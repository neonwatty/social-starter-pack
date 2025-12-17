// Search Analytics Types

export type Dimension = "query" | "page" | "country" | "device" | "date" | "searchAppearance";

export type SearchType = "web" | "image" | "video" | "news" | "discover";

export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET";

export type FilterOperator =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "includingRegex"
  | "excludingRegex";

export interface DimensionFilter {
  dimension: Dimension;
  operator: FilterOperator;
  expression: string;
}

export interface QueryOptions {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions?: Dimension[];
  searchType?: SearchType;
  dimensionFilterGroups?: Array<{
    groupType?: "and";
    filters: DimensionFilter[];
  }>;
  rowLimit?: number;
  startRow?: number;
}

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

// Sites Types

export type PermissionLevel =
  | "siteOwner"
  | "siteFullUser"
  | "siteRestrictedUser"
  | "siteUnverifiedUser";

export interface Site {
  siteUrl: string;
  permissionLevel: PermissionLevel;
}

export interface SitesResponse {
  siteEntry?: Site[];
}

// CLI Query Options

export interface CLIQueryOptions {
  days?: number;
  start?: string;
  end?: string;
  dimensions?: string;
  filterQuery?: string;
  filterPage?: string;
  filterCountry?: string;
  filterDevice?: string;
  type?: string;
  limit?: number;
  sort?: string;
  json?: boolean;
  csv?: boolean;
}
