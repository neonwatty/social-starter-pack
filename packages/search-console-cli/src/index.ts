// Public API exports
export { authenticate, getAuthenticatedClient, getAuthStatus, logout } from "./auth";
export { listSites, getSite } from "./api/sites";
export { querySearchAnalytics, buildQueryOptions, sortResults } from "./api/searchanalytics";
export type {
  Dimension,
  SearchType,
  DeviceType,
  FilterOperator,
  DimensionFilter,
  QueryOptions,
  SearchAnalyticsRow,
  SearchAnalyticsResponse,
  PermissionLevel,
  Site,
  SitesResponse,
  CLIQueryOptions,
} from "./api/types";
