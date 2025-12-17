import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import {
  QueryOptions,
  SearchAnalyticsResponse,
  SearchAnalyticsRow,
  CLIQueryOptions,
  Dimension,
  DimensionFilter,
  SearchType,
} from "./types";

function getSearchConsoleClient(auth: OAuth2Client) {
  return google.searchconsole({ version: "v1", auth });
}

export async function querySearchAnalytics(
  auth: OAuth2Client,
  options: QueryOptions
): Promise<SearchAnalyticsRow[]> {
  const searchconsole = getSearchConsoleClient(auth);

  const requestBody: Record<string, unknown> = {
    startDate: options.startDate,
    endDate: options.endDate,
    rowLimit: options.rowLimit || 25,
  };

  if (options.dimensions && options.dimensions.length > 0) {
    requestBody.dimensions = options.dimensions;
  }

  if (options.searchType && options.searchType !== "web") {
    requestBody.type = options.searchType;
  }

  if (options.dimensionFilterGroups && options.dimensionFilterGroups.length > 0) {
    requestBody.dimensionFilterGroups = options.dimensionFilterGroups;
  }

  if (options.startRow) {
    requestBody.startRow = options.startRow;
  }

  const response = await searchconsole.searchanalytics.query({
    siteUrl: options.siteUrl,
    requestBody,
  });

  const data = response.data as SearchAnalyticsResponse;
  return data.rows || [];
}

// Helper to format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Get date N days ago
function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

// Parse CLI options into API query options
export function buildQueryOptions(siteUrl: string, cliOptions: CLIQueryOptions): QueryOptions {
  // Handle date range
  let startDate: string;
  let endDate: string;

  if (cliOptions.start && cliOptions.end) {
    startDate = cliOptions.start;
    endDate = cliOptions.end;
  } else {
    const days = cliOptions.days || 7;
    // Search Console data has a 2-3 day delay, so end date should be 3 days ago
    endDate = getDaysAgo(3);
    startDate = getDaysAgo(days + 3);
  }

  // Parse dimensions
  let dimensions: Dimension[] | undefined;
  if (cliOptions.dimensions) {
    dimensions = cliOptions.dimensions.split(",").map((d) => d.trim() as Dimension);
  }

  // Build filters
  const filters: DimensionFilter[] = [];

  if (cliOptions.filterQuery) {
    filters.push({
      dimension: "query",
      operator: "contains",
      expression: cliOptions.filterQuery,
    });
  }

  if (cliOptions.filterPage) {
    filters.push({
      dimension: "page",
      operator: "contains",
      expression: cliOptions.filterPage,
    });
  }

  if (cliOptions.filterCountry) {
    filters.push({
      dimension: "country",
      operator: "equals",
      expression: cliOptions.filterCountry.toUpperCase(),
    });
  }

  if (cliOptions.filterDevice) {
    const deviceMap: Record<string, string> = {
      mobile: "MOBILE",
      desktop: "DESKTOP",
      tablet: "TABLET",
    };
    filters.push({
      dimension: "device",
      operator: "equals",
      expression:
        deviceMap[cliOptions.filterDevice.toLowerCase()] || cliOptions.filterDevice.toUpperCase(),
    });
  }

  const options: QueryOptions = {
    siteUrl,
    startDate,
    endDate,
    dimensions,
    rowLimit: cliOptions.limit || 25,
  };

  if (cliOptions.type) {
    options.searchType = cliOptions.type as SearchType;
  }

  if (filters.length > 0) {
    options.dimensionFilterGroups = [
      {
        groupType: "and",
        filters,
      },
    ];
  }

  return options;
}

// Sort results by a specific field
export function sortResults(rows: SearchAnalyticsRow[], sortBy: string): SearchAnalyticsRow[] {
  const sortField = sortBy.toLowerCase();

  return [...rows].sort((a, b) => {
    switch (sortField) {
      case "clicks":
        return b.clicks - a.clicks;
      case "impressions":
        return b.impressions - a.impressions;
      case "ctr":
        return b.ctr - a.ctr;
      case "position":
        return a.position - b.position; // Lower position is better
      default:
        return b.clicks - a.clicks;
    }
  });
}
