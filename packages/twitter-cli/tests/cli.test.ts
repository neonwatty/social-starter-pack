import { describe, it, expect } from "vitest";

describe("twitter-cli", () => {
  describe("module exports", () => {
    it("exports createTweet function", async () => {
      const { createTweet } = await import("../src/tweet");
      expect(typeof createTweet).toBe("function");
    });

    it("exports uploadMedia function", async () => {
      const { uploadMedia } = await import("../src/media");
      expect(typeof uploadMedia).toBe("function");
    });

    it("exports auth functions", async () => {
      const { saveCredentials, loadCredentials, clearCredentials } =
        await import("../src/auth");
      expect(typeof saveCredentials).toBe("function");
      expect(typeof loadCredentials).toBe("function");
      expect(typeof clearCredentials).toBe("function");
    });

    it("exports timeline functions", async () => {
      const { getMyTimeline, getCurrentUser, getTweet } =
        await import("../src/timeline");
      expect(typeof getMyTimeline).toBe("function");
      expect(typeof getCurrentUser).toBe("function");
      expect(typeof getTweet).toBe("function");
    });
  });

  describe("oauth2", () => {
    it("exports OAuth2 functions", async () => {
      const { getAuthorizationUrl, createOAuth2Header } =
        await import("../src/oauth2");
      expect(typeof getAuthorizationUrl).toBe("function");
      expect(typeof createOAuth2Header).toBe("function");
    });
  });
});
