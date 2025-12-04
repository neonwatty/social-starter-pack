import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { OAuth1Credentials } from "./oauth1";

function getCredentialsPath(): string {
  return path.join(os.homedir(), ".x-cli-credentials.json");
}

export function saveCredentials(credentials: OAuth1Credentials): void {
  fs.writeFileSync(getCredentialsPath(), JSON.stringify(credentials, null, 2), {
    mode: 0o600,
  });
}

export function loadCredentials(): OAuth1Credentials | null {
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

export function getCredentials(): OAuth1Credentials {
  const credentials = loadCredentials();
  if (!credentials) {
    throw new Error('Not authenticated. Run "x-cli auth" first.');
  }
  return credentials;
}

export async function verifyCredentials(
  credentials: OAuth1Credentials,
): Promise<boolean> {
  const { createOAuth1Header } = await import("./oauth1");

  const url = "https://api.x.com/2/users/me";
  const authHeader = createOAuth1Header("GET", url, credentials);

  const response = await fetch(url, {
    headers: {
      Authorization: authHeader,
    },
  });

  return response.ok;
}
