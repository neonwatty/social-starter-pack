import { getAuthenticatedClient } from "../auth";
import { listSites } from "../api/sites";
import { error, printTable, printJson, info } from "../utils/output";

export async function handleSites(args: string[]): Promise<void> {
  const json = args.includes("--json");

  try {
    const auth = await getAuthenticatedClient();
    const sites = await listSites(auth);

    if (sites.length === 0) {
      info("No verified sites found in your Search Console account.");
      return;
    }

    if (json) {
      printJson(sites);
    } else {
      const headers = ["Site URL", "Permission"];
      const rows = sites.map((site) => [site.siteUrl, formatPermission(site.permissionLevel)]);
      printTable(headers, rows);
    }
  } catch (err) {
    error(`Failed to list sites: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

function formatPermission(level: string): string {
  const map: Record<string, string> = {
    siteOwner: "Owner",
    siteFullUser: "Full User",
    siteRestrictedUser: "Restricted User",
    siteUnverifiedUser: "Unverified",
  };
  return map[level] || level;
}
