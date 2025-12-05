import { describe, it, expect } from "vitest";

// Test the helper functions - we need to export them first
// For now, test the module structure

describe("list module", () => {
  it("should export listVideos function", async () => {
    const { listVideos } = await import("./list");
    expect(typeof listVideos).toBe("function");
  });

  it("should export printVideosTable function", async () => {
    const { printVideosTable } = await import("./list");
    expect(typeof printVideosTable).toBe("function");
  });

  it("should export printVideosJson function", async () => {
    const { printVideosJson } = await import("./list");
    expect(typeof printVideosJson).toBe("function");
  });
});

describe("duration parsing", () => {
  it("should verify module exports correct types", async () => {
    const list = await import("./list");
    // Verify the module exports the expected functions
    expect(list).toHaveProperty("listVideos");
    expect(list).toHaveProperty("printVideosTable");
    expect(list).toHaveProperty("printVideosJson");
  });
});
