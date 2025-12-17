import { describe, it, expect } from "vitest";

describe("auth module", () => {
  it("should export authenticate function", async () => {
    const { authenticate } = await import("./auth");
    expect(typeof authenticate).toBe("function");
  });

  it("should export getAuthenticatedClient function", async () => {
    const { getAuthenticatedClient } = await import("./auth");
    expect(typeof getAuthenticatedClient).toBe("function");
  });

  it("should export getAuthStatus function", async () => {
    const { getAuthStatus } = await import("./auth");
    expect(typeof getAuthStatus).toBe("function");
  });

  it("should export logout function", async () => {
    const { logout } = await import("./auth");
    expect(typeof logout).toBe("function");
  });
});

describe("getAuthStatus", () => {
  it("should return object with authenticated property", async () => {
    const { getAuthStatus } = await import("./auth");
    const result = getAuthStatus();
    expect(typeof result).toBe("object");
    expect(typeof result.authenticated).toBe("boolean");
  });
});
