import { describe, it, expect } from "vitest";
import type {
  Dimension,
  SearchType,
  DeviceType,
  FilterOperator,
  QueryOptions,
  SearchAnalyticsRow,
  Site,
  CLIQueryOptions,
} from "./types";

describe("types module", () => {
  it("should allow valid Dimension values", () => {
    const dimensions: Dimension[] = [
      "query",
      "page",
      "country",
      "device",
      "date",
      "searchAppearance",
    ];
    expect(dimensions).toHaveLength(6);
  });

  it("should allow valid SearchType values", () => {
    const types: SearchType[] = ["web", "image", "video", "news", "discover"];
    expect(types).toHaveLength(5);
  });

  it("should allow valid DeviceType values", () => {
    const devices: DeviceType[] = ["DESKTOP", "MOBILE", "TABLET"];
    expect(devices).toHaveLength(3);
  });

  it("should allow valid FilterOperator values", () => {
    const operators: FilterOperator[] = [
      "equals",
      "notEquals",
      "contains",
      "notContains",
      "includingRegex",
      "excludingRegex",
    ];
    expect(operators).toHaveLength(6);
  });

  it("should create valid QueryOptions", () => {
    const options: QueryOptions = {
      siteUrl: "https://example.com",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      dimensions: ["query", "page"],
      rowLimit: 100,
    };
    expect(options.siteUrl).toBe("https://example.com");
    expect(options.dimensions).toHaveLength(2);
  });

  it("should create valid SearchAnalyticsRow", () => {
    const row: SearchAnalyticsRow = {
      keys: ["test query", "https://example.com/page"],
      clicks: 100,
      impressions: 1000,
      ctr: 0.1,
      position: 5.5,
    };
    expect(row.clicks).toBe(100);
    expect(row.ctr).toBe(0.1);
  });

  it("should create valid Site", () => {
    const site: Site = {
      siteUrl: "https://example.com",
      permissionLevel: "siteOwner",
    };
    expect(site.siteUrl).toBe("https://example.com");
  });

  it("should create valid CLIQueryOptions", () => {
    const options: CLIQueryOptions = {
      days: 30,
      dimensions: "query,page",
      filterQuery: "test",
      limit: 50,
      json: true,
    };
    expect(options.days).toBe(30);
    expect(options.json).toBe(true);
  });
});
