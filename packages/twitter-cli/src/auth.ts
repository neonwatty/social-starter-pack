import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  OAuth2Credentials,
  refreshAccessToken,
  createOAuth2Header,
} from "./oauth2";

function getCredentialsPath(): string {
  return path.join(os.homedir(), ".twitter-cli-credentials.json");
}

export function saveCredentials(credentials: OAuth2Credentials): void {
  fs.writeFileSync(getCredentialsPath(), JSON.stringify(credentials, null, 2), {
    mode: 0o600,
  });
}

export function loadCredentials(): OAuth2Credentials | null {
  try {
    const data = fs.readFileSync(getCredentialsPath(), "utf-8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearCredentials(): void {
  try {
    fs.unlinkSync(getCredentialsPath());
  } catch {
    // File doesn't exist, that's fine
  }
}

export async function getCredentials(): Promise<OAuth2Credentials> {
  const credentials = loadCredentials();
  if (!credentials) {
    throw new Error('Not authenticated. Run "twitter auth" first.');
  }

  // Check if token is expired or about to expire (within 5 minutes)
  const now = Date.now();
  const expiresIn = credentials.expiresAt - now;
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresIn < fiveMinutes) {
    console.log("Access token expired, refreshing...");
    try {
      const tokenResponse = await refreshAccessToken(
        credentials.refreshToken,
        credentials.clientId,
        credentials.clientSecret,
      );

      const newCredentials: OAuth2Credentials = {
        ...credentials,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      };

      saveCredentials(newCredentials);
      return newCredentials;
    } catch (error) {
      throw new Error(
        `Failed to refresh token. Please run "twitter auth" again. Error: ${error}`,
      );
    }
  }

  return credentials;
}

export async function getAuthHeader(): Promise<string> {
  const credentials = await getCredentials();
  return createOAuth2Header(credentials.accessToken);
}

export async function verifyCredentials(): Promise<boolean> {
  try {
    const authHeader = await getAuthHeader();
    const url = "https://api.x.com/2/users/me";

    const response = await fetch(url, {
      headers: {
        Authorization: authHeader,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}
