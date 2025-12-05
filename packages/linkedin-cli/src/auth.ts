import http from "http";
import { URL, URLSearchParams } from "url";
import open from "open";
import fs from "fs";
import path from "path";
import os from "os";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const REDIRECT_PORT = 3000;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

const CONFIG_DIR = path.join(os.homedir(), ".linkedin-cli");
const TOKEN_FILE = path.join(CONFIG_DIR, "tokens.json");
const CREDENTIALS_FILE = path.join(CONFIG_DIR, "credentials.json");

export interface TokenData {
  access_token: string;
  expires_at: number;
  user_urn?: string;
}

export interface Credentials {
  client_id: string;
  client_secret: string;
}

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function saveCredentials(credentials: Credentials): void {
  ensureConfigDir();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
  fs.chmodSync(CREDENTIALS_FILE, 0o600);
}

export function loadCredentials(): Credentials | null {
  // First check environment variables (for Doppler integration)
  const envClientId = process.env.LINKEDIN_CLIENT_ID;
  const envClientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (envClientId && envClientSecret) {
    return {
      client_id: envClientId,
      client_secret: envClientSecret,
    };
  }

  // Fall back to file-based credentials
  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }
  try {
    const data = fs.readFileSync(CREDENTIALS_FILE, "utf-8");
    return JSON.parse(data) as Credentials;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: TokenData): void {
  ensureConfigDir();
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  fs.chmodSync(TOKEN_FILE, 0o600);
}

export function loadTokens(): TokenData | null {
  if (!fs.existsSync(TOKEN_FILE)) {
    return null;
  }
  try {
    const data = fs.readFileSync(TOKEN_FILE, "utf-8");
    return JSON.parse(data) as TokenData;
  } catch {
    return null;
  }
}

export function isTokenValid(tokens: TokenData): boolean {
  const now = Date.now();
  // Consider token invalid if it expires within 1 hour
  return tokens.expires_at > now + 3600000;
}

export function getValidToken(): string | null {
  const tokens = loadTokens();
  if (!tokens || !isTokenValid(tokens)) {
    return null;
  }
  return tokens.access_token;
}

async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
): Promise<TokenData> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const response = await fetch(LINKEDIN_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

function startLocalServer(
  clientId: string,
  clientSecret: string,
): Promise<TokenData> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || "", `http://localhost:${REDIRECT_PORT}`);

      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const errorDescription = url.searchParams.get("error_description");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>Authentication Failed</h1>
                <p>${errorDescription || error}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(errorDescription || error));
          return;
        }

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>Authentication Failed</h1>
                <p>No authorization code received.</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error("No authorization code received"));
          return;
        }

        try {
          const tokens = await exchangeCodeForToken(
            code,
            clientId,
            clientSecret,
          );

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>Authentication Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </body>
            </html>
          `);

          server.close();
          resolve(tokens);
        } catch (err) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>Authentication Failed</h1>
                <p>${err instanceof Error ? err.message : "Unknown error"}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(err);
        }
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(`Listening for OAuth callback on port ${REDIRECT_PORT}...`);
    });

    server.on("error", (err) => {
      reject(new Error(`Failed to start local server: ${err.message}`));
    });

    // Timeout after 5 minutes
    setTimeout(
      () => {
        server.close();
        reject(new Error("Authentication timed out"));
      },
      5 * 60 * 1000,
    );
  });
}

export async function authenticate(
  clientId?: string,
  clientSecret?: string,
): Promise<TokenData> {
  // Use provided credentials or load from file
  let credentials: Credentials;

  if (clientId && clientSecret) {
    credentials = { client_id: clientId, client_secret: clientSecret };
    saveCredentials(credentials);
  } else {
    const stored = loadCredentials();
    if (!stored) {
      throw new Error(
        "No credentials found. Please run: linkedin-cli auth --client-id YOUR_ID --client-secret YOUR_SECRET",
      );
    }
    credentials = stored;
  }

  const scopes = ["w_member_social"];

  const authParams = new URLSearchParams({
    response_type: "code",
    client_id: credentials.client_id,
    redirect_uri: REDIRECT_URI,
    scope: scopes.join(" "),
    state: Math.random().toString(36).substring(7),
  });

  const authUrl = `${LINKEDIN_AUTH_URL}?${authParams.toString()}`;

  console.log("Opening browser for LinkedIn authorization...");
  console.log(`If browser doesn't open, visit: ${authUrl}`);

  // Start server before opening browser
  const tokenPromise = startLocalServer(
    credentials.client_id,
    credentials.client_secret,
  );

  // Open browser
  await open(authUrl);

  // Wait for callback
  const tokens = await tokenPromise;

  // Save tokens
  saveTokens(tokens);

  console.log("Authentication successful! Token saved.");
  console.log(`Token expires: ${new Date(tokens.expires_at).toLocaleString()}`);

  return tokens;
}

export function clearAuth(): void {
  if (fs.existsSync(TOKEN_FILE)) {
    fs.unlinkSync(TOKEN_FILE);
  }
  console.log("Tokens cleared.");
}

export function getTokenStatus(): {
  valid: boolean;
  expiresAt?: Date;
  daysRemaining?: number;
} {
  const tokens = loadTokens();
  if (!tokens) {
    return { valid: false };
  }

  const now = Date.now();
  const valid = tokens.expires_at > now;
  const daysRemaining = Math.floor(
    (tokens.expires_at - now) / (1000 * 60 * 60 * 24),
  );

  return {
    valid,
    expiresAt: new Date(tokens.expires_at),
    daysRemaining: valid ? daysRemaining : 0,
  };
}
