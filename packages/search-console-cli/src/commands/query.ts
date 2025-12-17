import { getAuthenticatedClient } from "../auth";
import { querySearchAnalytics, buildQueryOptions, sortResults } from "../api/searchanalytics";
import { CLIQueryOptions, SearchAnalyticsRow } from "../api/types";
import { error, printTable, printJson, printCsv, info } from "../utils/output";

export async function handleQuery(args: string[]): Promise<void> {
  // First positional argument is the site URL
  const siteUrl = args.find((arg) => !arg.startsWith("-"));

  if (!siteUrl) {
    error("Site URL is required");
    console.log("\nUsage: gsc query <site-url> [options]");
    console.log("\nExample: gsc query https://example.com --dimensions query --limit 20");
    process.exit(1);
  }

  // Parse options
  const options = parseQueryOptions(args);

  try {
    const auth = await getAuthenticatedClient();
    const queryOptions = buildQueryOptions(siteUrl, options);

    let rows = await querySearchAnalytics(auth, queryOptions);

    if (rows.length === 0) {
      info("No data found for the specified query.");
      return;
    }

    // Sort if requested
    if (options.sort) {
      rows = sortResults(rows, options.sort);
    }

    // Output
    if (options.json) {
      printJson(rows);
    } else if (options.csv) {
      outputCsv(rows, queryOptions.dimensions || []);
    } else {
      outputTable(rows, queryOptions.dimensions || []);
    }
  } catch (err) {
    error(`Query failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

function parseQueryOptions(args: string[]): CLIQueryOptions {
  const options: CLIQueryOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--days":
        options.days = parseInt(nextArg, 10);
        i++;
        break;
      case "--start":
        options.start = nextArg;
        i++;
        break;
      case "--end":
        options.end = nextArg;
        i++;
        break;
      case "--dimensions":
        options.dimensions = nextArg;
        i++;
        break;
      case "--filter-query":
        options.filterQuery = nextArg;
        i++;
        break;
      case "--filter-page":
        options.filterPage = nextArg;
        i++;
        break;
      case "--filter-country":
        options.filterCountry = nextArg;
        i++;
        break;
      case "--filter-device":
        options.filterDevice = nextArg;
        i++;
        break;
      case "--type":
        options.type = nextArg;
        i++;
        break;
      case "--limit":
        options.limit = parseInt(nextArg, 10);
        i++;
        break;
      case "--sort":
        options.sort = nextArg;
        i++;
        break;
      case "--json":
        options.json = true;
        break;
      case "--csv":
        options.csv = true;
        break;
    }
  }

  return options;
}

function outputTable(rows: SearchAnalyticsRow[], dimensions: string[]): void {
  // Build headers
  const headers = [
    ...dimensions.map(formatDimensionHeader),
    "Clicks",
    "Impressions",
    "CTR",
    "Position",
  ];

  // Build rows
  const tableRows = rows.map((row) => [
    ...row.keys.map((k, i) => formatDimensionValue(k, dimensions[i])),
    row.clicks.toString(),
    row.impressions.toString(),
    formatCtr(row.ctr),
    formatPosition(row.position),
  ]);

  printTable(headers, tableRows);
}

function outputCsv(rows: SearchAnalyticsRow[], dimensions: string[]): void {
  const headers = [
    ...dimensions.map(formatDimensionHeader),
    "Clicks",
    "Impressions",
    "CTR",
    "Position",
  ];

  const csvRows = rows.map((row) => [
    ...row.keys,
    row.clicks.toString(),
    row.impressions.toString(),
    row.ctr.toString(),
    row.position.toString(),
  ]);

  printCsv(headers, csvRows);
}

function formatDimensionHeader(dim: string): string {
  const map: Record<string, string> = {
    query: "Query",
    page: "Page",
    country: "Country",
    device: "Device",
    date: "Date",
    searchAppearance: "Search Appearance",
  };
  return map[dim] || dim;
}

function formatDimensionValue(value: string, dimension: string): string {
  if (dimension === "page" && value.length > 60) {
    // Truncate long URLs
    return value.slice(0, 57) + "...";
  }
  if (dimension === "device") {
    const map: Record<string, string> = {
      DESKTOP: "Desktop",
      MOBILE: "Mobile",
      TABLET: "Tablet",
    };
    return map[value] || value;
  }
  return value;
}

function formatCtr(ctr: number): string {
  return (ctr * 100).toFixed(1) + "%";
}

function formatPosition(position: number): string {
  return position.toFixed(1);
}
