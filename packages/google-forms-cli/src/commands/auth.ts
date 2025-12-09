import { authenticate, getAuthStatus, logout } from "../auth";
import { success, error, info, printKeyValue } from "../utils/output";

export async function handleAuth(args: string[]): Promise<void> {
  // Check for flags
  if (args.includes("--status")) {
    const status = getAuthStatus();
    if (status.authenticated) {
      success("Authenticated");
      if (status.expiresAt) {
        printKeyValue({
          "Token expires": status.expiresAt.toLocaleString(),
        });
      }
    } else {
      info('Not authenticated. Run "gforms auth" to authenticate.');
    }
    return;
  }

  if (args.includes("--logout")) {
    logout();
    return;
  }

  // Perform authentication
  try {
    await authenticate();
  } catch (err) {
    error(`Authentication failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
