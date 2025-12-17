import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  escapeForAppleScript,
  escapeForShell,
  buildAppleScript,
  getModeLabel,
  checkPlatform,
  KEYSTROKES,
  type SpawnMode,
  type SpawnOptions,
} from "./spawner.js";

describe("escapeForAppleScript", () => {
  it("should escape double quotes", () => {
    expect(escapeForAppleScript('hello "world"')).toBe('hello \\"world\\"');
  });

  it("should escape backslashes", () => {
    expect(escapeForAppleScript("path\\to\\file")).toBe("path\\\\to\\\\file");
  });

  it("should escape both quotes and backslashes", () => {
    expect(escapeForAppleScript('say "hello\\world"')).toBe(
      'say \\"hello\\\\world\\"',
    );
  });

  it("should handle strings without special characters", () => {
    expect(escapeForAppleScript("hello world")).toBe("hello world");
  });

  it("should handle empty strings", () => {
    expect(escapeForAppleScript("")).toBe("");
  });
});

describe("escapeForShell", () => {
  it("should escape single quotes", () => {
    expect(escapeForShell("it's working")).toBe("it'\\''s working");
  });

  it("should handle multiple single quotes", () => {
    expect(escapeForShell("don't can't won't")).toBe(
      "don'\\''t can'\\''t won'\\''t",
    );
  });

  it("should handle strings without single quotes", () => {
    expect(escapeForShell("hello world")).toBe("hello world");
  });

  it("should handle empty strings", () => {
    expect(escapeForShell("")).toBe("");
  });
});

describe("KEYSTROKES", () => {
  it("should have correct keystroke for window mode", () => {
    expect(KEYSTROKES["window"]).toBe('keystroke "n" using command down');
  });

  it("should have correct keystroke for tab mode", () => {
    expect(KEYSTROKES["tab"]).toBe('keystroke "t" using command down');
  });

  it("should have correct keystroke for split-right mode", () => {
    expect(KEYSTROKES["split-right"]).toBe('keystroke "d" using command down');
  });

  it("should have correct keystroke for split-down mode", () => {
    expect(KEYSTROKES["split-down"]).toBe(
      'keystroke "d" using {command down, shift down}',
    );
  });
});

describe("getModeLabel", () => {
  it("should return 'window' for window mode", () => {
    expect(getModeLabel("window")).toBe("window");
  });

  it("should return 'tab' for tab mode", () => {
    expect(getModeLabel("tab")).toBe("tab");
  });

  it("should return 'split (right)' for split-right mode", () => {
    expect(getModeLabel("split-right")).toBe("split (right)");
  });

  it("should return 'split (down)' for split-down mode", () => {
    expect(getModeLabel("split-down")).toBe("split (down)");
  });
});

describe("buildAppleScript", () => {
  const baseOptions: SpawnOptions = {
    mode: "window",
    directory: "/Users/test/project",
    count: 1,
  };

  it("should generate script with window keystroke", () => {
    const script = buildAppleScript(baseOptions);
    expect(script).toContain('keystroke "n" using command down');
  });

  it("should generate script with tab keystroke", () => {
    const script = buildAppleScript({ ...baseOptions, mode: "tab" });
    expect(script).toContain('keystroke "t" using command down');
  });

  it("should generate script with split-right keystroke", () => {
    const script = buildAppleScript({ ...baseOptions, mode: "split-right" });
    expect(script).toContain('keystroke "d" using command down');
  });

  it("should generate script with split-down keystroke", () => {
    const script = buildAppleScript({ ...baseOptions, mode: "split-down" });
    expect(script).toContain('keystroke "d" using {command down, shift down}');
  });

  it("should use yolo command by default", () => {
    const script = buildAppleScript(baseOptions);
    expect(script).toContain('keystroke "yolo"');
  });

  it("should use claude command when safe option is true", () => {
    const script = buildAppleScript({ ...baseOptions, safe: true });
    expect(script).toContain('keystroke "claude"');
  });

  it("should include cd command with directory", () => {
    const script = buildAppleScript(baseOptions);
    expect(script).toContain("cd '/Users/test/project'");
  });

  it("should include prompt when provided", () => {
    const script = buildAppleScript({
      ...baseOptions,
      prompt: "fix the tests",
    });
    expect(script).toContain("yolo 'fix the tests'");
  });

  it("should escape single quotes in prompt", () => {
    const script = buildAppleScript({
      ...baseOptions,
      prompt: "it's a test",
    });
    // Shell escaping: ' becomes '\''
    // Then AppleScript escaping: \ becomes \\
    // Result in AppleScript string: yolo 'it'\\''s a test'
    expect(script).toContain("yolo 'it'\\\\''s a test'");
  });

  it("should escape double quotes in directory path for AppleScript", () => {
    const script = buildAppleScript({
      ...baseOptions,
      directory: '/Users/test/"quoted"',
    });
    expect(script).toContain('\\"quoted\\"');
  });

  it("should activate Ghostty", () => {
    const script = buildAppleScript(baseOptions);
    expect(script).toContain('tell application "Ghostty" to activate');
  });

  it("should include System Events block", () => {
    const script = buildAppleScript(baseOptions);
    expect(script).toContain('tell application "System Events"');
  });

  it("should include delays for reliability", () => {
    const script = buildAppleScript(baseOptions);
    expect(script).toContain("delay 0.3");
    expect(script).toContain("delay 0.8");
  });

  it("should include keystroke return commands", () => {
    const script = buildAppleScript(baseOptions);
    expect(script.match(/keystroke return/g)?.length).toBe(2);
  });
});

describe("checkPlatform", () => {
  const originalPlatform = process.platform;
  const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
    throw new Error("process.exit called");
  });
  const mockConsoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => {});

  beforeEach(() => {
    mockExit.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  });

  it("should not exit on darwin (macOS)", () => {
    Object.defineProperty(process, "platform", { value: "darwin" });
    expect(() => checkPlatform()).not.toThrow();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it("should exit with error on linux", () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    expect(() => checkPlatform()).toThrow("process.exit called");
    expect(mockConsoleError).toHaveBeenCalledWith(
      "Error: spawn-claude only works on macOS (uses Ghostty + AppleScript)",
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("should exit with error on windows", () => {
    Object.defineProperty(process, "platform", { value: "win32" });
    expect(() => checkPlatform()).toThrow("process.exit called");
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});

describe("SpawnMode type", () => {
  it("should accept all valid modes", () => {
    const modes: SpawnMode[] = ["window", "tab", "split-right", "split-down"];
    expect(modes).toHaveLength(4);
  });
});

describe("SpawnOptions interface", () => {
  it("should accept minimal options", () => {
    const options: SpawnOptions = {
      mode: "window",
      directory: "/test",
      count: 1,
    };
    expect(options.mode).toBe("window");
    expect(options.prompt).toBeUndefined();
    expect(options.safe).toBeUndefined();
  });

  it("should accept full options", () => {
    const options: SpawnOptions = {
      mode: "split-right",
      directory: "/test/project",
      prompt: "hello world",
      safe: true,
      count: 3,
    };
    expect(options.mode).toBe("split-right");
    expect(options.prompt).toBe("hello world");
    expect(options.safe).toBe(true);
    expect(options.count).toBe(3);
  });
});
