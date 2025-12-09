import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as http from "http";
import * as url from "url";
import { readToken, writeToken, deleteToken, tokenExists } from "./utils/config";
import { success, error, info } from "./utils/output";

// Scopes required for Google Forms API
const SCOPES = [
  "https://www.googleapis.com/auth/forms.body",
  "https://www.googleapis.com/auth/forms.responses.readonly",
  "https://www.googleapis.com/auth/drive.readonly", // Read access to all Drive files (to list all forms)
];

const REDIRECT_PORT = 3000;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

interface Credentials {
  clientId: string;
  clientSecret: string;
}

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
}

function getCredentials(): Credentials | null {
  // Check environment variables first (supports multiple naming conventions)
  const clientId =
    process.env.GOOGLE_FORMS_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.YOUTUBE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_FORMS_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.YOUTUBE_CLIENT_SECRET;

  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }

  // Check for client_secrets.json file
  const secretsPath = "client_secrets.json";
  if (fs.existsSync(secretsPath)) {
    try {
      const content = fs.readFileSync(secretsPath, "utf-8");
      const secrets = JSON.parse(content);

      // Handle both "installed" and "web" OAuth types
      const creds = secrets.installed || secrets.web;
      if (creds) {
        return {
          clientId: creds.client_id,
          clientSecret: creds.client_secret,
        };
      }
    } catch {
      // Fall through to return null
    }
  }

  return null;
}

function createOAuth2Client(credentials: Credentials): OAuth2Client {
  return new OAuth2Client(credentials.clientId, credentials.clientSecret, REDIRECT_URI);
}

async function getAuthorizationCode(oauth2Client: OAuth2Client): Promise<string> {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.log("\nOpening browser for Google authentication...");
  console.log("If the browser does not open, visit this URL:\n");
  console.log(authUrl);
  console.log();

  // Try to open browser
  await import("child_process").then((cp) => {
    const platform = process.platform;
    if (platform === "darwin") {
      cp.exec(`open "${authUrl}"`);
    } else if (platform === "win32") {
      cp.exec(`start "" "${authUrl}"`);
    } else {
      cp.exec(`xdg-open "${authUrl}"`);
    }
  });

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          return;
        }

        const parsedUrl = url.parse(req.url, true);
        if (parsedUrl.pathname !== "/") {
          return;
        }

        const code = parsedUrl.query.code as string;
        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<h1>Error: No authorization code received</h1>");
          reject(new Error("No authorization code received"));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
              <div style="text-align: center;">
                <h1 style="color: #22c55e;">✓ Authentication Successful!</h1>
                <p>You can close this window and return to the terminal.</p>
              </div>
            </body>
          </html>
        `);

        server.close();
        resolve(code);
      } catch (err) {
        reject(err);
      }
    });

    server.listen(REDIRECT_PORT, () => {
      info(`Waiting for authorization on port ${REDIRECT_PORT}...`);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        reject(new Error(`Port ${REDIRECT_PORT} is in use. Please free the port and try again.`));
      } else {
        reject(err);
      }
    });

    // Timeout after 5 minutes
    setTimeout(
      () => {
        server.close();
        reject(new Error("Authorization timed out"));
      },
      5 * 60 * 1000
    );
  });
}

export async function authenticate(): Promise<OAuth2Client> {
  const credentials = getCredentials();
  if (!credentials) {
    error("No credentials found.");
    console.log("\nPlease provide credentials via:");
    console.log(
      "  1. Environment variables: GOOGLE_FORMS_CLIENT_ID and GOOGLE_FORMS_CLIENT_SECRET"
    );
    console.log("  2. A client_secrets.json file in the current directory");
    console.log("\nTo get credentials:");
    console.log("  1. Go to https://console.cloud.google.com/apis/credentials");
    console.log("  2. Create an OAuth 2.0 Client ID (Desktop app)");
    console.log("  3. Download the JSON file as client_secrets.json");
    process.exit(1);
  }

  const oauth2Client = createOAuth2Client(credentials);

  // Check for existing token
  const existingToken = readToken() as TokenData | null;
  if (existingToken) {
    oauth2Client.setCredentials(existingToken);

    // Check if token is expired
    const expiryDate = existingToken.expiry_date || 0;
    if (Date.now() < expiryDate - 60000) {
      // Token is still valid (with 1 minute buffer)
      return oauth2Client;
    }

    // Try to refresh the token
    if (existingToken.refresh_token) {
      try {
        const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
        writeToken(newCredentials as Record<string, unknown>);
        oauth2Client.setCredentials(newCredentials);
        return oauth2Client;
      } catch {
        // Refresh failed, need to re-authenticate
        info("Token refresh failed, re-authenticating...");
      }
    }
  }

  // No valid token, need to authenticate
  const code = await getAuthorizationCode(oauth2Client);
  const { tokens } = await oauth2Client.getToken(code);
  writeToken(tokens as Record<string, unknown>);
  oauth2Client.setCredentials(tokens);

  success("Authentication successful! Token saved.");
  return oauth2Client;
}

export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const credentials = getCredentials();
  if (!credentials) {
    error('No credentials found. Run "gforms auth" first.');
    process.exit(1);
  }

  const oauth2Client = createOAuth2Client(credentials);
  const existingToken = readToken() as TokenData | null;

  if (!existingToken) {
    error('Not authenticated. Run "gforms auth" first.');
    process.exit(1);
  }

  oauth2Client.setCredentials(existingToken);

  // Check if token needs refresh
  const expiryDate = existingToken.expiry_date || 0;
  if (Date.now() >= expiryDate - 60000 && existingToken.refresh_token) {
    try {
      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
      writeToken(newCredentials as Record<string, unknown>);
      oauth2Client.setCredentials(newCredentials);
    } catch {
      error('Token expired and refresh failed. Run "gforms auth" again.');
      process.exit(1);
    }
  }

  return oauth2Client;
}

export function getAuthStatus(): { authenticated: boolean; expiresAt?: Date } {
  const token = readToken() as TokenData | null;
  if (!token) {
    return { authenticated: false };
  }

  const expiryDate = token.expiry_date;
  return {
    authenticated: true,
    expiresAt: expiryDate ? new Date(expiryDate) : undefined,
  };
}

export function logout(): void {
  if (tokenExists()) {
    deleteToken();
    success("Logged out successfully.");
  } else {
    info("No active session found.");
  }
}
