export const GOOGLE_BASE_URL = "https://suggestqueries.google.com/complete/search";
export const DUCKDUCKGO_BASE_URL = "https://duckduckgo.com/ac/";
export const AMAZON_BASE_URL = "https://completion.amazon.com/api/2017/suggestions";
export const BING_BASE_URL = "https://www.bing.com/AS/Suggestions";
export const DEFAULT_DELAY_MS = 100;

let lastCallTime = 0;

export function resetRateLimiter(): void {
  lastCallTime = 0;
}

async function rateLimitedFetch(url: string, delayMs: number = DEFAULT_DELAY_MS): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  if (elapsed < delayMs && lastCallTime > 0) {
    await new Promise(resolve => setTimeout(resolve, delayMs - elapsed));
  }
  lastCallTime = Date.now();
  return fetch(url);
}

export interface SuggestOptions {
  lang?: string;
  country?: string;
  delay?: number;
}

export type OutputFormat = 'text' | 'json' | 'csv';

export interface FormatOptions {
  format?: OutputFormat;
}

export interface ExpandOptions {
  expand?: boolean;
  questions?: boolean;
  prefix?: string;
}

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');
export const QUESTION_WORDS = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'does', 'is'];

export type Source = "google" | "youtube" | "bing" | "amazon" | "duckduckgo";

export async function fetchGoogleSuggestions(
  query: string,
  options: SuggestOptions,
  isYouTube: boolean = false
): Promise<string[]> {
  const params = new URLSearchParams({
    client: "firefox",
    q: query,
  });

  if (isYouTube) {
    params.set("ds", "yt");
  }

  if (options.lang) {
    params.set("hl", options.lang);
  }

  if (options.country) {
    params.set("gl", options.country);
  }

  const url = `${GOOGLE_BASE_URL}?${params.toString()}`;
  const delayMs = options.delay ?? DEFAULT_DELAY_MS;

  const response = await rateLimitedFetch(url, delayMs);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();

  // Response format: ["query", ["suggestion1", "suggestion2", ...]]
  if (Array.isArray(data) && Array.isArray(data[1])) {
    return data[1];
  }

  return [];
}

export async function fetchDuckDuckGoSuggestions(
  query: string,
  options: SuggestOptions
): Promise<string[]> {
  const params = new URLSearchParams({ q: query });

  const url = `${DUCKDUCKGO_BASE_URL}?${params.toString()}`;
  const delayMs = options.delay ?? DEFAULT_DELAY_MS;

  const response = await rateLimitedFetch(url, delayMs);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();

  // Response format: [{"phrase":"suggestion1"},{"phrase":"suggestion2"}]
  if (Array.isArray(data)) {
    return data.map((item: { phrase: string }) => item.phrase).filter(Boolean);
  }

  return [];
}

export async function fetchAmazonSuggestions(
  query: string,
  options: SuggestOptions
): Promise<string[]> {
  const params = new URLSearchParams({
    mid: "ATVPDKIKX0DER",
    alias: "aps",
    prefix: query,
  });

  const url = `${AMAZON_BASE_URL}?${params.toString()}`;
  const delayMs = options.delay ?? DEFAULT_DELAY_MS;

  const response = await rateLimitedFetch(url, delayMs);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();

  // Response format: { suggestions: [{ value: "suggestion1" }, ...] }
  if (data && Array.isArray(data.suggestions)) {
    return data.suggestions
      .map((item: { value?: string }) => item.value)
      .filter(Boolean);
  }

  return [];
}

export async function fetchBingSuggestions(
  query: string,
  options: SuggestOptions
): Promise<string[]> {
  const params = new URLSearchParams({
    qry: query,
    cvid: "1",
  });

  if (options.lang) {
    params.set("setlang", options.lang);
  }

  const url = `${BING_BASE_URL}?${params.toString()}`;
  const delayMs = options.delay ?? DEFAULT_DELAY_MS;

  const response = await rateLimitedFetch(url, delayMs);

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const text = await response.text();

  // Parse HTML response - extract query attribute from <li> elements
  const suggestions: string[] = [];
  const regex = /query="([^"]+)"/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    suggestions.push(match[1]);
  }

  return suggestions;
}

// Unified fetch function for backwards compatibility
export async function fetchSuggestions(
  query: string,
  options: SuggestOptions,
  source: Source
): Promise<string[]> {
  switch (source) {
    case "google":
      return fetchGoogleSuggestions(query, options, false);
    case "youtube":
      return fetchGoogleSuggestions(query, options, true);
    case "duckduckgo":
      return fetchDuckDuckGoSuggestions(query, options);
    case "amazon":
      return fetchAmazonSuggestions(query, options);
    case "bing":
      return fetchBingSuggestions(query, options);
    default:
      throw new Error(`Unknown source: ${source}`);
  }
}

export function formatSuggestions(suggestions: string[], format: OutputFormat = 'text'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(suggestions, null, 2);

    case 'csv': {
      const escaped = suggestions.map(s =>
        s.includes(',') || s.includes('"')
          ? `"${s.replace(/"/g, '""')}"`
          : s
      );
      return 'suggestion\n' + escaped.join('\n');
    }

    case 'text':
    default:
      return suggestions.join('\n');
  }
}

export function outputSuggestions(suggestions: string[], options: FormatOptions): void {
  if (suggestions.length === 0) {
    if (options.format === 'json') {
      console.log('[]');
    } else if (options.format === 'csv') {
      console.log('suggestion');
    } else {
      console.log('No suggestions found.');
    }
    return;
  }

  console.log(formatSuggestions(suggestions, options.format));
}

// Keep for backwards compatibility
export function printSuggestions(suggestions: string[]): void {
  outputSuggestions(suggestions, {});
}

export function expandQuery(query: string, options: ExpandOptions): string[] {
  const queries: string[] = [query];

  if (options.expand) {
    queries.push(...ALPHABET.map(letter => `${query} ${letter}`));
  }

  if (options.questions) {
    queries.push(...QUESTION_WORDS.map(word => `${word} ${query}`));
  }

  if (options.prefix) {
    const prefixes = options.prefix.split(',').map(p => p.trim());
    queries.push(...prefixes.map(prefix => `${prefix} ${query}`));
  }

  return queries;
}

export async function fetchExpandedSuggestions(
  query: string,
  options: SuggestOptions & ExpandOptions,
  source: Source
): Promise<string[]> {
  const queries = expandQuery(query, options);
  const allSuggestions: string[] = [];

  for (const q of queries) {
    const suggestions = await fetchSuggestions(q, options, source);
    allSuggestions.push(...suggestions);
  }

  return [...new Set(allSuggestions)];
}

export interface CommandResult {
  success: boolean;
  error?: string;
}

export async function handleCommand(
  query: string,
  options: SuggestOptions & ExpandOptions & FormatOptions,
  source: Source
): Promise<CommandResult> {
  try {
    const hasExpansion = options.expand || options.questions || options.prefix;
    const suggestions = hasExpansion
      ? await fetchExpandedSuggestions(query, options, source)
      : await fetchSuggestions(query, options, source);

    outputSuggestions(suggestions, options);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
