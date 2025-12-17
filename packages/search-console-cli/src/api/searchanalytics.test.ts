import { describe, it, expect } from "vitest";
import { buildQueryOptions, sortResults } from "./searchanalytics";
import type { SearchAnalyticsRow } from "./types";

describe("buildQueryOptions", () => {
  it("should build options with default 7 days", () => {
    const options = buildQueryOptions("https://example.com", {});
    expect(options.siteUrl).toBe("https://example.com");
    expect(options.rowLimit).toBe(25);
    expect(options.startDate).toBeDefined();
    expect(options.endDate).toBeDefined();
  });

  it("should use custom days parameter", () => {
    const options = buildQueryOptions("https://example.com", { days: 30 });
    expect(options.siteUrl).toBe("https://example.com");
  });

  it("should use custom date range", () => {
    const options = buildQueryOptions("https://example.com", {
      start: "2025-01-01",
      end: "2025-01-31",
    });
    expect(options.startDate).toBe("2025-01-01");
    expect(options.endDate).toBe("2025-01-31");
  });

  it("should parse dimensions", () => {
    const options = buildQueryOptions("https://example.com", {
      dimensions: "query,page",
    });
    expect(options.dimensions).toEqual(["query", "page"]);
  });

  it("should add query filter", () => {
    const options = buildQueryOptions("https://example.com", {
      filterQuery: "test keyword",
    });
    expect(options.dimensionFilterGroups).toBeDefined();
    expect(options.dimensionFilterGroups![0].filters[0].dimension).toBe("query");
    expect(options.dimensionFilterGroups![0].filters[0].expression).toBe("test keyword");
  });

  it("should add page filter", () => {
    const options = buildQueryOptions("https://example.com", {
      filterPage: "/blog/",
    });
    expect(options.dimensionFilterGroups![0].filters[0].dimension).toBe("page");
  });

  it("should add device filter with normalized value", () => {
    const options = buildQueryOptions("https://example.com", {
      filterDevice: "mobile",
    });
    expect(options.dimensionFilterGroups![0].filters[0].dimension).toBe("device");
    expect(options.dimensionFilterGroups![0].filters[0].expression).toBe("MOBILE");
  });

  it("should set search type", () => {
    const options = buildQueryOptions("https://example.com", {
      type: "image",
    });
    expect(options.searchType).toBe("image");
  });

  it("should set custom limit", () => {
    const options = buildQueryOptions("https://example.com", {
      limit: 100,
    });
    expect(options.rowLimit).toBe(100);
  });
});

describe("sortResults", () => {
  const mockRows: SearchAnalyticsRow[] = [
    { keys: ["a"], clicks: 10, impressions: 100, ctr: 0.1, position: 5 },
    { keys: ["b"], clicks: 50, impressions: 200, ctr: 0.25, position: 2 },
    { keys: ["c"], clicks: 30, impressions: 150, ctr: 0.2, position: 8 },
  ];

  it("should sort by clicks descending", () => {
    const sorted = sortResults(mockRows, "clicks");
    expect(sorted[0].clicks).toBe(50);
    expect(sorted[1].clicks).toBe(30);
    expect(sorted[2].clicks).toBe(10);
  });

  it("should sort by impressions descending", () => {
    const sorted = sortResults(mockRows, "impressions");
    expect(sorted[0].impressions).toBe(200);
    expect(sorted[1].impressions).toBe(150);
    expect(sorted[2].impressions).toBe(100);
  });

  it("should sort by ctr descending", () => {
    const sorted = sortResults(mockRows, "ctr");
    expect(sorted[0].ctr).toBe(0.25);
    expect(sorted[1].ctr).toBe(0.2);
    expect(sorted[2].ctr).toBe(0.1);
  });

  it("should sort by position ascending (lower is better)", () => {
    const sorted = sortResults(mockRows, "position");
    expect(sorted[0].position).toBe(2);
    expect(sorted[1].position).toBe(5);
    expect(sorted[2].position).toBe(8);
  });

  it("should not mutate original array", () => {
    const original = [...mockRows];
    sortResults(mockRows, "clicks");
    expect(mockRows).toEqual(original);
  });
});
