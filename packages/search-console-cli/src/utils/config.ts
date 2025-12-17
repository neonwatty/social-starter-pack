import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".config", "search-console-cli");
const TOKEN_PATH = path.join(CONFIG_DIR, "token.json");

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getTokenPath(): string {
  return TOKEN_PATH;
}

export function tokenExists(): boolean {
  return fs.existsSync(TOKEN_PATH);
}

export function readToken(): Record<string, unknown> | null {
  if (!tokenExists()) {
    return null;
  }
  try {
    const content = fs.readFileSync(TOKEN_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function writeToken(token: Record<string, unknown>): void {
  ensureConfigDir();
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
}

export function deleteToken(): void {
  if (tokenExists()) {
    fs.unlinkSync(TOKEN_PATH);
  }
}
