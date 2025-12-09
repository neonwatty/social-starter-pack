import { describe, it, expect } from "vitest";

describe("output module", () => {
  it("should export success function", async () => {
    const { success } = await import("./output");
    expect(typeof success).toBe("function");
  });

  it("should export error function", async () => {
    const { error } = await import("./output");
    expect(typeof error).toBe("function");
  });

  it("should export info function", async () => {
    const { info } = await import("./output");
    expect(typeof info).toBe("function");
  });

  it("should export warn function", async () => {
    const { warn } = await import("./output");
    expect(typeof warn).toBe("function");
  });

  it("should export printJson function", async () => {
    const { printJson } = await import("./output");
    expect(typeof printJson).toBe("function");
  });

  it("should export printTable function", async () => {
    const { printTable } = await import("./output");
    expect(typeof printTable).toBe("function");
  });

  it("should export printKeyValue function", async () => {
    const { printKeyValue } = await import("./output");
    expect(typeof printKeyValue).toBe("function");
  });
});
