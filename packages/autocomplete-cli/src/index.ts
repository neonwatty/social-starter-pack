#!/usr/bin/env node

import { Command } from "commander";
import { createRequire } from "node:module";
import { handleCommand, SuggestOptions, ExpandOptions, FormatOptions, OutputFormat } from "./suggest.js";

type CommandOptions = SuggestOptions & ExpandOptions & FormatOptions;

function validateFormat(format: string | undefined): format is OutputFormat {
  return !format || ['text', 'json', 'csv'].includes(format);
}

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("autocomplete")
  .description("Query autocomplete suggestions from Google, YouTube, Bing, Amazon, and DuckDuckGo")
  .version(pkg.version);

program
  .command("google")
  .description("Get Google autocomplete suggestions")
  .argument("<query>", "Search query")
  .option("-l, --lang <code>", "Language code (e.g., en, de, es)")
  .option("-c, --country <code>", "Country code (e.g., us, uk, in)")
  .option("-d, --delay <ms>", "Delay between API calls in milliseconds (default: 100)", "100")
  .option("-e, --expand", "Expand with alphabet suffixes (a-z)")
  .option("-q, --questions", "Expand with question words")
  .option("-p, --prefix <prefixes>", "Custom prefixes (comma-separated)")
  .option("-f, --format <type>", "Output format: text, json, csv (default: text)")
  .action(async (query: string, options: CommandOptions) => {
    if (!validateFormat(options.format)) {
      console.error("Error: Invalid format. Use: text, json, or csv");
      process.exit(1);
    }
    options.delay = parseInt(String(options.delay), 10);
    const result = await handleCommand(query, options, "google");
    if (!result.success) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });

program
  .command("youtube")
  .description("Get YouTube autocomplete suggestions")
  .argument("<query>", "Search query")
  .option("-l, --lang <code>", "Language code (e.g., en, de, es)")
  .option("-c, --country <code>", "Country code (e.g., us, uk, in)")
  .option("-d, --delay <ms>", "Delay between API calls in milliseconds (default: 100)", "100")
  .option("-e, --expand", "Expand with alphabet suffixes (a-z)")
  .option("-q, --questions", "Expand with question words")
  .option("-p, --prefix <prefixes>", "Custom prefixes (comma-separated)")
  .option("-f, --format <type>", "Output format: text, json, csv (default: text)")
  .action(async (query: string, options: CommandOptions) => {
    if (!validateFormat(options.format)) {
      console.error("Error: Invalid format. Use: text, json, or csv");
      process.exit(1);
    }
    options.delay = parseInt(String(options.delay), 10);
    const result = await handleCommand(query, options, "youtube");
    if (!result.success) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });

program
  .command("bing")
  .description("Get Bing autocomplete suggestions")
  .argument("<query>", "Search query")
  .option("-l, --lang <code>", "Language code (e.g., en, de, es)")
  .option("-c, --country <code>", "Country code (e.g., us, uk, de)")
  .option("-d, --delay <ms>", "Delay between API calls in milliseconds (default: 100)", "100")
  .option("-e, --expand", "Expand with alphabet suffixes (a-z)")
  .option("-q, --questions", "Expand with question words")
  .option("-p, --prefix <prefixes>", "Custom prefixes (comma-separated)")
  .option("-f, --format <type>", "Output format: text, json, csv (default: text)")
  .action(async (query: string, options: CommandOptions) => {
    if (!validateFormat(options.format)) {
      console.error("Error: Invalid format. Use: text, json, or csv");
      process.exit(1);
    }
    options.delay = parseInt(String(options.delay), 10);
    const result = await handleCommand(query, options, "bing");
    if (!result.success) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });

program
  .command("amazon")
  .description("Get Amazon autocomplete suggestions")
  .argument("<query>", "Search query")
  .option("-d, --delay <ms>", "Delay between API calls in milliseconds (default: 100)", "100")
  .option("-e, --expand", "Expand with alphabet suffixes (a-z)")
  .option("-q, --questions", "Expand with question words")
  .option("-p, --prefix <prefixes>", "Custom prefixes (comma-separated)")
  .option("-f, --format <type>", "Output format: text, json, csv (default: text)")
  .action(async (query: string, options: CommandOptions) => {
    if (!validateFormat(options.format)) {
      console.error("Error: Invalid format. Use: text, json, or csv");
      process.exit(1);
    }
    options.delay = parseInt(String(options.delay), 10);
    const result = await handleCommand(query, options, "amazon");
    if (!result.success) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });

program
  .command("duckduckgo")
  .alias("ddg")
  .description("Get DuckDuckGo autocomplete suggestions")
  .argument("<query>", "Search query")
  .option("-d, --delay <ms>", "Delay between API calls in milliseconds (default: 100)", "100")
  .option("-e, --expand", "Expand with alphabet suffixes (a-z)")
  .option("-q, --questions", "Expand with question words")
  .option("-p, --prefix <prefixes>", "Custom prefixes (comma-separated)")
  .option("-f, --format <type>", "Output format: text, json, csv (default: text)")
  .action(async (query: string, options: CommandOptions) => {
    if (!validateFormat(options.format)) {
      console.error("Error: Invalid format. Use: text, json, or csv");
      process.exit(1);
    }
    options.delay = parseInt(String(options.delay), 10);
    const result = await handleCommand(query, options, "duckduckgo");
    if (!result.success) {
      console.error("Error:", result.error);
      process.exit(1);
    }
  });

program.parse();
