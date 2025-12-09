import { describe, it, expect } from "vitest";

describe("config module", () => {
  it("should export ensureConfigDir function", async () => {
    const { ensureConfigDir } = await import("./config");
    expect(typeof ensureConfigDir).toBe("function");
  });

  it("should export getTokenPath function", async () => {
    const { getTokenPath } = await import("./config");
    expect(typeof getTokenPath).toBe("function");
  });

  it("should export tokenExists function", async () => {
    const { tokenExists } = await import("./config");
    expect(typeof tokenExists).toBe("function");
  });

  it("should export readToken function", async () => {
    const { readToken } = await import("./config");
    expect(typeof readToken).toBe("function");
  });

  it("should export writeToken function", async () => {
    const { writeToken } = await import("./config");
    expect(typeof writeToken).toBe("function");
  });

  it("should export deleteToken function", async () => {
    const { deleteToken } = await import("./config");
    expect(typeof deleteToken).toBe("function");
  });
});

describe("getTokenPath", () => {
  it("should return path containing google-forms-cli", async () => {
    const { getTokenPath } = await import("./config");
    const path = getTokenPath();
    expect(path).toContain("google-forms-cli");
    expect(path).toContain("token.json");
  });
});

describe("tokenExists", () => {
  it("should return boolean", async () => {
    const { tokenExists } = await import("./config");
    const result = tokenExists();
    expect(typeof result).toBe("boolean");
  });
});
