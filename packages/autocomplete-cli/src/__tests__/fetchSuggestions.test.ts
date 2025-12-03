import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import nock from "nock";
import {
  fetchSuggestions,
  resetRateLimiter,
  DEFAULT_DELAY_MS,
  formatSuggestions,
  outputSuggestions,
  expandQuery,
  fetchExpandedSuggestions,
  ALPHABET,
  QUESTION_WORDS,
} from "../suggest.js";

describe("fetchSuggestions", () => {
  beforeEach(() => {
    nock.cleanAll();
    resetRateLimiter();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it("fetches Google suggestions successfully", async () => {
    const mockResponse = ["test query", ["suggestion 1", "suggestion 2", "suggestion 3"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "test query" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("test query", {}, "google");

    expect(result).toEqual(["suggestion 1", "suggestion 2", "suggestion 3"]);
  });

  it("fetches YouTube suggestions with ds=yt parameter", async () => {
    const mockResponse = ["video", ["video 1", "video 2"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "video", ds: "yt" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("video", {}, "youtube");

    expect(result).toEqual(["video 1", "video 2"]);
  });

  it("includes language parameter when provided", async () => {
    const mockResponse = ["query", ["result"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query", hl: "de" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("query", { lang: "de" }, "google");

    expect(result).toEqual(["result"]);
  });

  it("includes country parameter when provided", async () => {
    const mockResponse = ["query", ["result"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query", gl: "uk" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("query", { country: "uk" }, "google");

    expect(result).toEqual(["result"]);
  });

  it("includes both lang and country when provided", async () => {
    const mockResponse = ["query", ["result"]];

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query", hl: "en", gl: "us" })
      .reply(200, mockResponse);

    const result = await fetchSuggestions("query", { lang: "en", country: "us" }, "google");

    expect(result).toEqual(["result"]);
  });

  it("throws error on HTTP error response", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query" })
      .reply(500);

    await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 500");
  });

  it("returns empty array when response format is unexpected", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query" })
      .reply(200, { unexpected: "format" });

    const result = await fetchSuggestions("query", {}, "google");

    expect(result).toEqual([]);
  });

  it("returns empty array when suggestions array is missing", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query" })
      .reply(200, ["query"]);

    const result = await fetchSuggestions("query", {}, "google");

    expect(result).toEqual([]);
  });

  it("handles empty suggestions array", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query({ client: "firefox", q: "query" })
      .reply(200, ["query", []]);

    const result = await fetchSuggestions("query", {}, "google");

    expect(result).toEqual([]);
  });

  // Phase 1: HTTP Status Code Tests
  describe("HTTP status codes", () => {
    it("throws error on 400 Bad Request", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(400);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 400");
    });

    it("throws error on 403 Forbidden", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(403);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 403");
    });

    it("throws error on 404 Not Found", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(404);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 404");
    });

    it("throws error on 429 Too Many Requests", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(429);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 429");
    });

    it("throws error on 503 Service Unavailable", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(503);

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow("HTTP error: 503");
    });
  });

  // Phase 1: Input Edge Cases
  describe("input edge cases", () => {
    it("handles query with special characters", async () => {
      const mockResponse = ["test <script>", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("test <script>", {}, "google");
      expect(result).toEqual(["result"]);
    });

    it("handles query with unicode characters", async () => {
      const mockResponse = ["café", ["café latte", "café mocha"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("café", {}, "google");
      expect(result).toEqual(["café latte", "café mocha"]);
    });

    it("handles query with spaces", async () => {
      const mockResponse = ["how to code", ["how to code in python"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("how to code", {}, "google");
      expect(result).toEqual(["how to code in python"]);
    });

    it("handles empty query string", async () => {
      const mockResponse = ["", []];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("", {}, "google");
      expect(result).toEqual([]);
    });

    it("handles query with ampersand and equals", async () => {
      const mockResponse = ["a=b&c=d", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("a=b&c=d", {}, "google");
      expect(result).toEqual(["result"]);
    });
  });

  // Phase 2: Network Error Tests
  describe("network errors", () => {
    it("throws error on connection refused", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .replyWithError({ code: "ECONNREFUSED", message: "Connection refused" });

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow();
    });

    it("throws error on connection reset", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .replyWithError({ code: "ECONNRESET", message: "Connection reset" });

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow();
    });

    it("throws error on socket hang up", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .replyWithError("socket hang up");

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow();
    });
  });

  // Phase 2: Response Parsing Edge Cases
  describe("response parsing", () => {
    it("handles null in response array", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, ["query", []]);

      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual([]);
    });

    it("throws error on invalid JSON response", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, "not valid json", { "Content-Type": "text/plain" });

      await expect(fetchSuggestions("query", {}, "google")).rejects.toThrow();
    });

    it("handles empty object response", async () => {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, {});

      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual([]);
    });

    it("handles response with extra metadata", async () => {
      const mockResponse = ["query", ["suggestion"], { extra: "data" }];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual(["suggestion"]);
    });

    it("handles large number of suggestions", async () => {
      const suggestions = Array.from({ length: 100 }, (_, i) => `suggestion ${i}`);
      const mockResponse = ["query", suggestions];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toHaveLength(100);
      expect(result[0]).toBe("suggestion 0");
      expect(result[99]).toBe("suggestion 99");
    });
  });

  // Rate limiting tests
  describe("rate limiting", () => {
    it("exports DEFAULT_DELAY_MS constant", () => {
      expect(DEFAULT_DELAY_MS).toBe(100);
    });

    it("respects custom delay option", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", { delay: 50 }, "google");
      expect(result).toEqual(["result"]);
    });

    it("works with delay set to 0", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", { delay: 0 }, "google");
      expect(result).toEqual(["result"]);
    });

    it("delays between rapid successive calls", async () => {
      vi.useFakeTimers();

      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .times(2)
        .reply(200, mockResponse);

      // First call should proceed immediately
      const firstCall = fetchSuggestions("query", { delay: 100 }, "google");
      await vi.advanceTimersByTimeAsync(0);
      await firstCall;

      // Second call should be delayed
      const secondCall = fetchSuggestions("query", { delay: 100 }, "google");

      // Advance time to allow the delay
      await vi.advanceTimersByTimeAsync(100);
      await secondCall;

      vi.useRealTimers();
    });

    it("resets rate limiter between tests", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      // This should not be delayed because resetRateLimiter is called in beforeEach
      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual(["result"]);
    });

    it("uses default delay when delay option is undefined", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      // No delay option provided - should use DEFAULT_DELAY_MS
      const result = await fetchSuggestions("query", {}, "google");
      expect(result).toEqual(["result"]);
    });

    it("handles multiple rapid calls with fake timers", async () => {
      vi.useFakeTimers();

      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .times(3)
        .reply(200, mockResponse);

      // Make three rapid calls
      const call1 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(0);
      await call1;

      const call2 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(50);
      await call2;

      const call3 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(50);
      const result = await call3;

      expect(result).toEqual(["result"]);
      vi.useRealTimers();
    });

    it("does not delay when enough time has passed", async () => {
      vi.useFakeTimers();

      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .times(2)
        .reply(200, mockResponse);

      // First call
      const call1 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(0);
      await call1;

      // Wait longer than delay
      await vi.advanceTimersByTimeAsync(100);

      // Second call should not need to wait
      const call2 = fetchSuggestions("query", { delay: 50 }, "google");
      await vi.advanceTimersByTimeAsync(0);
      const result = await call2;

      expect(result).toEqual(["result"]);
      vi.useRealTimers();
    });

    it("works with very large delay values", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", { delay: 10000 }, "google");
      expect(result).toEqual(["result"]);
    });

    it("combines delay with other options", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query({ client: "firefox", q: "query", hl: "de", gl: "de" })
        .reply(200, mockResponse);

      const result = await fetchSuggestions(
        "query",
        { lang: "de", country: "de", delay: 0 },
        "google"
      );
      expect(result).toEqual(["result"]);
    });

    it("works with youtube and custom delay", async () => {
      const mockResponse = ["query", ["result"]];

      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query({ client: "firefox", q: "query", ds: "yt" })
        .reply(200, mockResponse);

      const result = await fetchSuggestions("query", { delay: 25 }, "youtube");
      expect(result).toEqual(["result"]);
    });
  });

  // DuckDuckGo tests
  describe("DuckDuckGo source", () => {
    it("fetches DuckDuckGo suggestions successfully", async () => {
      const mockResponse = [
        { phrase: "test suggestion 1" },
        { phrase: "test suggestion 2" },
        { phrase: "test suggestion 3" },
      ];

      nock("https://duckduckgo.com")
        .get("/ac/")
        .query({ q: "test" })
        .reply(200, mockResponse);

      const result = await fetchSuggestions("test", {}, "duckduckgo");
      expect(result).toEqual(["test suggestion 1", "test suggestion 2", "test suggestion 3"]);
    });

    it("handles empty DuckDuckGo response", async () => {
      nock("https://duckduckgo.com")
        .get("/ac/")
        .query({ q: "xyz123" })
        .reply(200, []);

      const result = await fetchSuggestions("xyz123", {}, "duckduckgo");
      expect(result).toEqual([]);
    });

    it("throws error on DuckDuckGo HTTP error", async () => {
      nock("https://duckduckgo.com")
        .get("/ac/")
        .query(true)
        .reply(500);

      await expect(fetchSuggestions("query", {}, "duckduckgo")).rejects.toThrow("HTTP error: 500");
    });
  });

  // Amazon tests
  describe("Amazon source", () => {
    it("fetches Amazon suggestions successfully", async () => {
      const mockResponse = {
        suggestions: [
          { value: "laptop stand" },
          { value: "laptop bag" },
          { value: "laptop sleeve" },
        ],
      };

      nock("https://completion.amazon.com")
        .get("/api/2017/suggestions")
        .query({ mid: "ATVPDKIKX0DER", alias: "aps", prefix: "laptop" })
        .reply(200, mockResponse);

      const result = await fetchSuggestions("laptop", {}, "amazon");
      expect(result).toEqual(["laptop stand", "laptop bag", "laptop sleeve"]);
    });

    it("handles empty Amazon response", async () => {
      const mockResponse = { suggestions: [] };

      nock("https://completion.amazon.com")
        .get("/api/2017/suggestions")
        .query(true)
        .reply(200, mockResponse);

      const result = await fetchSuggestions("xyz", {}, "amazon");
      expect(result).toEqual([]);
    });

    it("throws error on Amazon HTTP error", async () => {
      nock("https://completion.amazon.com")
        .get("/api/2017/suggestions")
        .query(true)
        .reply(503);

      await expect(fetchSuggestions("query", {}, "amazon")).rejects.toThrow("HTTP error: 503");
    });
  });

  // Bing tests
  describe("Bing source", () => {
    it("fetches Bing suggestions successfully", async () => {
      const mockHtmlResponse = `<ul class="sa_drw">
        <li query="weather today">weather today</li>
        <li query="weather forecast">weather forecast</li>
        <li query="weather radar">weather radar</li>
      </ul>`;

      nock("https://www.bing.com")
        .get("/AS/Suggestions")
        .query({ qry: "weather", cvid: "1" })
        .reply(200, mockHtmlResponse);

      const result = await fetchSuggestions("weather", {}, "bing");
      expect(result).toEqual(["weather today", "weather forecast", "weather radar"]);
    });

    it("handles Bing with custom language", async () => {
      const mockHtmlResponse = `<ul><li query="wetter heute">wetter heute</li></ul>`;

      nock("https://www.bing.com")
        .get("/AS/Suggestions")
        .query({ qry: "wetter", cvid: "1", setlang: "de" })
        .reply(200, mockHtmlResponse);

      const result = await fetchSuggestions("wetter", { lang: "de" }, "bing");
      expect(result).toEqual(["wetter heute"]);
    });

    it("handles empty Bing response", async () => {
      const mockHtmlResponse = `<ul class="sa_drw"></ul>`;

      nock("https://www.bing.com")
        .get("/AS/Suggestions")
        .query(true)
        .reply(200, mockHtmlResponse);

      const result = await fetchSuggestions("xyz", {}, "bing");
      expect(result).toEqual([]);
    });

    it("throws error on Bing HTTP error", async () => {
      nock("https://www.bing.com")
        .get("/AS/Suggestions")
        .query(true)
        .reply(429);

      await expect(fetchSuggestions("query", {}, "bing")).rejects.toThrow("HTTP error: 429");
    });
  });
});

describe("formatSuggestions", () => {
  it("formats as text (default)", () => {
    const result = formatSuggestions(["one", "two", "three"]);
    expect(result).toBe("one\ntwo\nthree");
  });

  it("formats as text explicitly", () => {
    const result = formatSuggestions(["one", "two", "three"], "text");
    expect(result).toBe("one\ntwo\nthree");
  });

  it("formats as JSON", () => {
    const result = formatSuggestions(["one", "two", "three"], "json");
    expect(result).toBe('[\n  "one",\n  "two",\n  "three"\n]');
    expect(JSON.parse(result)).toEqual(["one", "two", "three"]);
  });

  it("formats as CSV with header", () => {
    const result = formatSuggestions(["one", "two", "three"], "csv");
    expect(result).toBe("suggestion\none\ntwo\nthree");
  });

  it("escapes commas in CSV", () => {
    const result = formatSuggestions(["hello, world", "test"], "csv");
    expect(result).toBe('suggestion\n"hello, world"\ntest');
  });

  it("escapes quotes in CSV", () => {
    const result = formatSuggestions(['say "hello"', "test"], "csv");
    expect(result).toBe('suggestion\n"say ""hello"""\ntest');
  });

  it("escapes both commas and quotes in CSV", () => {
    const result = formatSuggestions(['hello, "world"'], "csv");
    expect(result).toBe('suggestion\n"hello, ""world"""');
  });

  it("handles empty array for text", () => {
    const result = formatSuggestions([], "text");
    expect(result).toBe("");
  });

  it("handles empty array for JSON", () => {
    const result = formatSuggestions([], "json");
    expect(result).toBe("[]");
  });

  it("handles empty array for CSV", () => {
    const result = formatSuggestions([], "csv");
    expect(result).toBe("suggestion\n");
  });
});

describe("outputSuggestions", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("outputs text format by default", () => {
    outputSuggestions(["one", "two"], {});
    expect(consoleSpy).toHaveBeenCalledWith("one\ntwo");
  });

  it("outputs JSON format", () => {
    outputSuggestions(["one", "two"], { format: "json" });
    expect(consoleSpy).toHaveBeenCalledWith('[\n  "one",\n  "two"\n]');
  });

  it("outputs CSV format", () => {
    outputSuggestions(["one", "two"], { format: "csv" });
    expect(consoleSpy).toHaveBeenCalledWith("suggestion\none\ntwo");
  });

  it('outputs "No suggestions found." for empty text', () => {
    outputSuggestions([], {});
    expect(consoleSpy).toHaveBeenCalledWith("No suggestions found.");
  });

  it("outputs [] for empty JSON", () => {
    outputSuggestions([], { format: "json" });
    expect(consoleSpy).toHaveBeenCalledWith("[]");
  });

  it("outputs header only for empty CSV", () => {
    outputSuggestions([], { format: "csv" });
    expect(consoleSpy).toHaveBeenCalledWith("suggestion");
  });
});

describe("expandQuery", () => {
  it("returns original query when no expansion options", () => {
    const result = expandQuery("coffee", {});
    expect(result).toEqual(["coffee"]);
  });

  it("expands with alphabet suffixes", () => {
    const result = expandQuery("coffee", { expand: true });
    expect(result).toHaveLength(27); // original + 26 letters
    expect(result[0]).toBe("coffee");
    expect(result[1]).toBe("coffee a");
    expect(result[26]).toBe("coffee z");
  });

  it("expands with question words", () => {
    const result = expandQuery("coffee", { questions: true });
    expect(result).toHaveLength(11); // original + 10 question words
    expect(result[0]).toBe("coffee");
    expect(result).toContain("what coffee");
    expect(result).toContain("how coffee");
    expect(result).toContain("why coffee");
  });

  it("expands with custom prefixes", () => {
    const result = expandQuery("coffee", { prefix: "best,top,how to" });
    expect(result).toHaveLength(4); // original + 3 custom
    expect(result[0]).toBe("coffee");
    expect(result[1]).toBe("best coffee");
    expect(result[2]).toBe("top coffee");
    expect(result[3]).toBe("how to coffee");
  });

  it("trims whitespace from custom prefixes", () => {
    const result = expandQuery("test", { prefix: " best , top " });
    expect(result).toContain("best test");
    expect(result).toContain("top test");
  });

  it("combines expand and questions", () => {
    const result = expandQuery("coffee", { expand: true, questions: true });
    expect(result).toHaveLength(37); // 1 + 26 + 10
    expect(result[0]).toBe("coffee");
    expect(result).toContain("coffee a");
    expect(result).toContain("what coffee");
  });

  it("combines all expansion options", () => {
    const result = expandQuery("coffee", {
      expand: true,
      questions: true,
      prefix: "best,top",
    });
    expect(result).toHaveLength(39); // 1 + 26 + 10 + 2
    expect(result).toContain("best coffee");
    expect(result).toContain("top coffee");
  });

  it("exports ALPHABET constant", () => {
    expect(ALPHABET).toHaveLength(26);
    expect(ALPHABET[0]).toBe("a");
    expect(ALPHABET[25]).toBe("z");
  });

  it("exports QUESTION_WORDS constant", () => {
    expect(QUESTION_WORDS).toHaveLength(10);
    expect(QUESTION_WORDS).toContain("what");
    expect(QUESTION_WORDS).toContain("how");
    expect(QUESTION_WORDS).toContain("why");
  });
});

describe("fetchExpandedSuggestions", () => {
  beforeEach(() => {
    nock.cleanAll();
    resetRateLimiter();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it("fetches suggestions for original query only when no expansion", async () => {
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query(true)
      .reply(200, ["coffee", ["coffee beans", "coffee maker"]]);

    const result = await fetchExpandedSuggestions("coffee", {}, "google");
    expect(result).toEqual(["coffee beans", "coffee maker"]);
  });

  it("fetches expanded suggestions with alphabet", async () => {
    // Mock original query
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query((q) => q.q === "test")
      .reply(200, ["test", ["test 1"]]);

    // Mock "test a" query
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query((q) => q.q === "test a")
      .reply(200, ["test a", ["test apple"]]);

    // Mock remaining alphabet queries
    for (let i = 1; i < 26; i++) {
      const letter = String.fromCharCode(97 + i); // b-z
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query((q) => q.q === `test ${letter}`)
        .reply(200, [`test ${letter}`, []]);
    }

    const result = await fetchExpandedSuggestions(
      "test",
      { expand: true, delay: 0 },
      "google"
    );
    expect(result).toContain("test 1");
    expect(result).toContain("test apple");
  });

  it("deduplicates results", async () => {
    // Mock both queries returning the same suggestion
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query((q) => q.q === "test")
      .reply(200, ["test", ["same result"]]);

    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query((q) => q.q === "best test")
      .reply(200, ["best test", ["same result", "different result"]]);

    const result = await fetchExpandedSuggestions(
      "test",
      { prefix: "best", delay: 0 },
      "google"
    );

    // Should only have "same result" once
    expect(result.filter((r) => r === "same result")).toHaveLength(1);
    expect(result).toContain("different result");
  });

  it("fetches with question word expansion", async () => {
    // Mock original query
    nock("https://suggestqueries.google.com")
      .get("/complete/search")
      .query((q) => q.q === "test")
      .reply(200, ["test", ["test 1"]]);

    // Mock question word queries
    for (const word of QUESTION_WORDS) {
      nock("https://suggestqueries.google.com")
        .get("/complete/search")
        .query((q) => q.q === `${word} test`)
        .reply(200, [`${word} test`, [`${word} test result`]]);
    }

    const result = await fetchExpandedSuggestions(
      "test",
      { questions: true, delay: 0 },
      "google"
    );

    expect(result).toContain("test 1");
    expect(result).toContain("what test result");
    expect(result).toContain("how test result");
  });
});
