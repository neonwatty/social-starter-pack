import { describe, it, expect } from "vitest";
import { isTokenValid, type TokenData } from "./auth.js";

describe("auth", () => {
  describe("isTokenValid", () => {
    it("returns true for token expiring in more than 1 hour", () => {
      const tokens: TokenData = {
        access_token: "test-token",
        expires_at: Date.now() + 2 * 60 * 60 * 1000, // 2 hours from now
      };
      expect(isTokenValid(tokens)).toBe(true);
    });

    it("returns false for token expiring in less than 1 hour", () => {
      const tokens: TokenData = {
        access_token: "test-token",
        expires_at: Date.now() + 30 * 60 * 1000, // 30 minutes from now
      };
      expect(isTokenValid(tokens)).toBe(false);
    });

    it("returns false for expired token", () => {
      const tokens: TokenData = {
        access_token: "test-token",
        expires_at: Date.now() - 1000, // 1 second ago
      };
      expect(isTokenValid(tokens)).toBe(false);
    });
  });
});
