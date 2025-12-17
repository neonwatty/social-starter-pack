#!/usr/bin/env node

import { handleAuth } from "./commands/auth";
import { handleSites } from "./commands/sites";
import { handleQuery } from "./commands/query";

const HELP = `
Google Search Console CLI

Usage: gsc <command> [options]

Commands:
  auth                     Authenticate with Google Search Console
  auth --status            Check authentication status
  auth --logout            Clear stored credentials
  sites                    List verified sites
  sites --json             List sites as JSON
  query <site-url>         Query search analytics data

Query Options:
  --days <n>               Last N days of data (default: 7)
  --start <YYYY-MM-DD>     Start date
  --end <YYYY-MM-DD>       End date
  --dimensions <list>      Comma-separated: query,page,country,device,date
  --filter-query <text>    Filter by search query (contains)
  --filter-page <text>     Filter by page URL (contains)
  --filter-country <code>  Filter by country code (e.g., usa, gbr)
  --filter-device <type>   Filter by device: mobile, desktop, tablet
  --type <type>            Search type: web, image, video, news, discover
  --limit <n>              Max rows to return (default: 25)
  --sort <field>           Sort by: clicks, impressions, ctr, position
  --json                   Output as JSON
  --csv                    Output as CSV

Examples:
  # Authenticate
  gsc auth

  # List your verified sites
  gsc sites

  # Top queries for the last 7 days
  gsc query https://example.com --dimensions query

  # Page performance for the last 30 days
  gsc query https://example.com --dimensions page --days 30

  # Keywords for a specific page
  gsc query https://example.com --dimensions query --filter-page "/blog/"

  # Mobile traffic only
  gsc query https://example.com --dimensions query --filter-device mobile

  # Daily trend for a keyword
  gsc query https://example.com --dimensions date --filter-query "keyword"

  # Export to CSV
  gsc query https://example.com --dimensions query,page --limit 100 --csv > data.csv
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    console.log(HELP);
    return;
  }

  try {
    switch (command) {
      case "auth":
        await handleAuth(args.slice(1));
        break;

      case "sites":
        await handleSites(args.slice(1));
        break;

      case "query":
        await handleQuery(args.slice(1));
        break;

      default:
        console.error(`Unknown command: ${command}`);
        console.log("\nRun 'gsc --help' for usage information.");
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
