import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

// Test CLI argument parsing by running the actual CLI with --help
// and checking exit codes / output parsing

describe("CLI", () => {
  describe("--help", () => {
    it("should display help information", () => {
      const output = execSync("node dist/index.js --help", {
        encoding: "utf-8",
      });
      expect(output).toContain("spawn-claude");
      expect(output).toContain("Spawn Claude Code instances");
    });

    it("should show all mode options in help", () => {
      const output = execSync("node dist/index.js --help", {
        encoding: "utf-8",
      });
      expect(output).toContain("--window");
      expect(output).toContain("--tab");
      expect(output).toContain("--split-right");
      expect(output).toContain("--split-down");
    });

    it("should show prompt option in help", () => {
      const output = execSync("node dist/index.js --help", {
        encoding: "utf-8",
      });
      expect(output).toContain("--prompt");
      expect(output).toContain("-p");
    });

    it("should show safe option in help", () => {
      const output = execSync("node dist/index.js --help", {
        encoding: "utf-8",
      });
      expect(output).toContain("--safe");
      expect(output).toContain("-s");
    });

    it("should show count option in help", () => {
      const output = execSync("node dist/index.js --help", {
        encoding: "utf-8",
      });
      expect(output).toContain("--count");
      expect(output).toContain("-c");
    });

    it("should show dir option in help", () => {
      const output = execSync("node dist/index.js --help", {
        encoding: "utf-8",
      });
      expect(output).toContain("--dir");
    });

    it("should show examples in help", () => {
      const output = execSync("node dist/index.js --help", {
        encoding: "utf-8",
      });
      expect(output).toContain("Examples:");
      expect(output).toContain("spawn-claude -t");
      expect(output).toContain("spawn-claude -r");
    });
  });

  describe("--version", () => {
    it("should display version number", () => {
      const output = execSync("node dist/index.js --version", {
        encoding: "utf-8",
      });
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe("short flags", () => {
    it("should recognize -h as help", () => {
      const output = execSync("node dist/index.js -h", {
        encoding: "utf-8",
      });
      expect(output).toContain("spawn-claude");
    });

    it("should recognize -V as version", () => {
      const output = execSync("node dist/index.js -V", {
        encoding: "utf-8",
      });
      expect(output.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });
});

describe("CLI argument validation", () => {
  it("should accept valid count values", () => {
    // Just verify the help shows count option - actual execution would spawn windows
    const output = execSync("node dist/index.js --help", {
      encoding: "utf-8",
    });
    expect(output).toContain("Spawn N instances");
  });
});
