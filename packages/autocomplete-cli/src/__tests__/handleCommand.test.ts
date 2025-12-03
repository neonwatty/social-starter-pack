import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import nock from "nock";
import { handleCommand } from "../suggest.js";

describe("handleCommand", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    nock.cleanAll();
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    nock.cleanAll();
    consoleSpy.mockRestore();
  });

  it("returns success true on successful fetch", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query(true)
      .reply(200, ["query", ["suggestion1", "suggestion2"]]);

    const result = await handleCommand("query", {}, "google");

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("prints suggestions on success", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query(true)
      .reply(200, ["query", ["suggestion1", "suggestion2"]]);

    await handleCommand("query", {}, "google");

    expect(consoleSpy).toHaveBeenCalledWith("suggestion1\nsuggestion2");
  });

  it("returns success false with error message on HTTP error", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query(true)
      .reply(500);

    const result = await handleCommand("query", {}, "google");

    expect(result.success).toBe(false);
    expect(result.error).toBe("HTTP error: 500");
  });

  it("returns success false with error message on network error", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query(true)
      .replyWithError("connection refused");

    const result = await handleCommand("query", {}, "google");

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("works with youtube source", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query((query) => query.ds === "yt")
      .reply(200, ["query", ["youtube suggestion"]]);

    const result = await handleCommand("query", {}, "youtube");

    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith("youtube suggestion");
  });

  it("passes options correctly", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query((query) => query.hl === "de" && query.gl === "de")
      .reply(200, ["query", ["german suggestion"]]);

    const result = await handleCommand("query", { lang: "de", country: "de" }, "google");

    expect(result.success).toBe(true);
  });

  it("handles empty results gracefully", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query(true)
      .reply(200, ["query", []]);

    const result = await handleCommand("query", {}, "google");

    expect(result.success).toBe(true);
    expect(consoleSpy).toHaveBeenCalledWith("No suggestions found.");
  });
});
