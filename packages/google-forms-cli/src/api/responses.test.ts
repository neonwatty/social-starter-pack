import { describe, it, expect } from "vitest";

describe("responses module", () => {
  it("should export getResponses function", async () => {
    const { getResponses } = await import("./responses");
    expect(typeof getResponses).toBe("function");
  });

  it("should export getResponseCount function", async () => {
    const { getResponseCount } = await import("./responses");
    expect(typeof getResponseCount).toBe("function");
  });

  it("should export exportResponsesAsCSV function", async () => {
    const { exportResponsesAsCSV } = await import("./responses");
    expect(typeof exportResponsesAsCSV).toBe("function");
  });

  it("should export exportResponsesAsJSON function", async () => {
    const { exportResponsesAsJSON } = await import("./responses");
    expect(typeof exportResponsesAsJSON).toBe("function");
  });
});
