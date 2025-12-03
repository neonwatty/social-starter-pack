import { describe, it, expect } from "vitest";

describe("validate module", () => {
  it("should export validateForShorts function", async () => {
    const { validateForShorts } = await import("./validate");
    expect(typeof validateForShorts).toBe("function");
  });

  it("should export checkFfprobe function", async () => {
    const { checkFfprobe } = await import("./validate");
    expect(typeof checkFfprobe).toBe("function");
  });
});

describe("checkFfprobe", () => {
  it("should return boolean", async () => {
    const { checkFfprobe } = await import("./validate");
    const result = checkFfprobe();
    expect(typeof result).toBe("boolean");
  });
});
