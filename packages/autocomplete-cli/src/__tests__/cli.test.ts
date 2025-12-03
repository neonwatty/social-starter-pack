import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import { resolve } from "path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../../package.json");

const CLI_PATH = resolve(__dirname, "../../dist/index.js");

function runCli(args: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${CLI_PATH} ${args}`, {
      encoding: "utf-8",
      timeout: 10000,
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: execError.stdout || "",
      stderr: execError.stderr || "",
      exitCode: execError.status || 1,
    };
  }
}

describe("CLI", () => {
  it("shows help with --help flag", () => {
    const { stdout, exitCode } = runCli("--help");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Query autocomplete suggestions from Google, YouTube, Bing, Amazon, and");
    expect(stdout).toContain("google");
    expect(stdout).toContain("youtube");
  });

  it("shows version with --version flag", () => {
    const { stdout, exitCode } = runCli("--version");

    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe(pkg.version);
  });

  it("shows google command help", () => {
    const { stdout, exitCode } = runCli("google --help");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Get Google autocomplete suggestions");
    expect(stdout).toContain("--lang");
    expect(stdout).toContain("--country");
  });

  it("shows youtube command help", () => {
    const { stdout, exitCode } = runCli("youtube --help");

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Get YouTube autocomplete suggestions");
    expect(stdout).toContain("--lang");
    expect(stdout).toContain("--country");
  });

  it("runs without error when no command provided", () => {
    const { stdout, stderr } = runCli("");

    // Commander shows help when no command is given (may be stdout or stderr)
    const output = stdout + stderr;
    expect(output).toContain("Usage:");
  });

  describe("error scenarios", () => {
    it("shows error for unknown command", () => {
      const { stderr, exitCode } = runCli("unknown");

      expect(exitCode).toBe(1);
      expect(stderr).toContain("unknown");
    });

    it("shows error when google command missing query", () => {
      const { stderr, exitCode } = runCli("google");

      expect(exitCode).toBe(1);
      expect(stderr).toContain("query");
    });

    it("shows error when youtube command missing query", () => {
      const { stderr, exitCode } = runCli("youtube");

      expect(exitCode).toBe(1);
      expect(stderr).toContain("query");
    });

    it("accepts short option flags", () => {
      const { stdout, exitCode } = runCli("google --help");

      expect(exitCode).toBe(0);
      expect(stdout).toContain("-l, --lang");
      expect(stdout).toContain("-c, --country");
    });
  });

  describe("delay option", () => {
    it("shows --delay option in google command help", () => {
      const { stdout, exitCode } = runCli("google --help");

      expect(exitCode).toBe(0);
      expect(stdout).toContain("-d, --delay");
      expect(stdout).toContain("Delay between API calls");
    });

    it("shows --delay option in youtube command help", () => {
      const { stdout, exitCode } = runCli("youtube --help");

      expect(exitCode).toBe(0);
      expect(stdout).toContain("-d, --delay");
      expect(stdout).toContain("Delay between API calls");
    });

    it("shows default delay value in help", () => {
      const { stdout, exitCode } = runCli("google --help");

      expect(exitCode).toBe(0);
      // Commander may split default across lines, so check for presence of default indicator
      expect(stdout).toMatch(/default.*100/s);
    });

    it("accepts -d short flag in google command help", () => {
      const { stdout, exitCode } = runCli("google --help");

      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/-d,?\s+--delay/);
    });

    it("accepts -d short flag in youtube command help", () => {
      const { stdout, exitCode } = runCli("youtube --help");

      expect(exitCode).toBe(0);
      expect(stdout).toMatch(/-d,?\s+--delay/);
    });
  });

  describe("additional sources", () => {
    it("shows bing command help", () => {
      const { stdout, exitCode } = runCli("bing --help");

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Get Bing autocomplete suggestions");
      expect(stdout).toContain("--lang");
      expect(stdout).toContain("--country");
      expect(stdout).toContain("--delay");
    });

    it("shows amazon command help", () => {
      const { stdout, exitCode } = runCli("amazon --help");

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Get Amazon autocomplete suggestions");
      expect(stdout).toContain("--delay");
    });

    it("shows duckduckgo command help", () => {
      const { stdout, exitCode } = runCli("duckduckgo --help");

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Get DuckDuckGo autocomplete suggestions");
      expect(stdout).toContain("--delay");
    });

    it("supports ddg alias for duckduckgo", () => {
      const { stdout, exitCode } = runCli("ddg --help");

      expect(exitCode).toBe(0);
      expect(stdout).toContain("Get DuckDuckGo autocomplete suggestions");
    });

    it("shows error when bing command missing query", () => {
      const { stderr, exitCode } = runCli("bing");

      expect(exitCode).toBe(1);
      expect(stderr).toContain("query");
    });

    it("shows error when amazon command missing query", () => {
      const { stderr, exitCode } = runCli("amazon");

      expect(exitCode).toBe(1);
      expect(stderr).toContain("query");
    });

    it("shows error when duckduckgo command missing query", () => {
      const { stderr, exitCode } = runCli("duckduckgo");

      expect(exitCode).toBe(1);
      expect(stderr).toContain("query");
    });
  });
});
