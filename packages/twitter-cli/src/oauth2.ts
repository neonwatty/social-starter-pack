import * as crypto from "crypto";
import * as http from "http";

export interface OAuth2Credentials {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

interface OAuth2TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

const AUTHORIZE_URL = "https://twitter.com/i/oauth2/authorize";
const TOKEN_URL = "https://api.x.com/2/oauth2/token";
const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];
const REDIRECT_PORT = 3000;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function getAuthorizationUrl(clientId: string): {
  url: string;
  codeVerifier: string;
  state: string;
} {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return {
    url: `${AUTHORIZE_URL}?${params.toString()}`,
    codeVerifier,
    state,
  };
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  clientId: string,
  clientSecret: string,
): Promise<OAuth2TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json() as Promise<OAuth2TokenResponse>;
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
): Promise<OAuth2TokenResponse> {
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  return response.json() as Promise<OAuth2TokenResponse>;
}

export function startCallbackServer(
  expectedState: string,
): Promise<{ code: string }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(
        req.url || "",
        `http://localhost:${REDIRECT_PORT}`,
      );

      if (parsedUrl.pathname === "/callback") {
        const code = parsedUrl.searchParams.get("code");
        const state = parsedUrl.searchParams.get("state");
        const error = parsedUrl.searchParams.get("error");
        const error_description =
          parsedUrl.searchParams.get("error_description");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body>
                <h1>Authentication Failed</h1>
                <p>Error: ${error}</p>
                <p>${error_description || ""}</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(`OAuth error: ${error} - ${error_description}`));
          return;
        }

        if (state !== expectedState) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`
            <html>
              <body>
                <h1>Authentication Failed</h1>
                <p>State mismatch - possible CSRF attack.</p>
                <p>You can close this window.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error("State mismatch - possible CSRF attack"));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body>
              <h1>Authentication Successful!</h1>
              <p>You can close this window and return to the terminal.</p>
              <script>window.close();</script>
            </body>
          </html>
        `);
        server.close();
        resolve({ code: code! });
      }
    });

    server.listen(REDIRECT_PORT, () => {
      console.log(
        `Waiting for authorization callback on port ${REDIRECT_PORT}...`,
      );
    });

    // Timeout after 5 minutes
    setTimeout(
      () => {
        server.close();
        reject(new Error("Authorization timed out after 5 minutes"));
      },
      5 * 60 * 1000,
    );
  });
}

export function createOAuth2Header(accessToken: string): string {
  return `Bearer ${accessToken}`;
}
