import { authenticate, getAuthStatus, logout } from "../auth";
import { success, error, info, printKeyValue } from "../utils/output";

export async function handleAuth(args: string[]): Promise<void> {
  // Check for --status flag
  if (args.includes("--status")) {
    const status = getAuthStatus();
    if (status.authenticated) {
      success("Authenticated");
      printKeyValue({
        "Token expires": status.expiresAt?.toLocaleString() || "Unknown",
      });
    } else {
      info("Not authenticated");
    }
    return;
  }

  // Check for --logout flag
  if (args.includes("--logout")) {
    logout();
    return;
  }

  // Default: authenticate
  try {
    await authenticate();
  } catch (err) {
    error(`Authentication failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
