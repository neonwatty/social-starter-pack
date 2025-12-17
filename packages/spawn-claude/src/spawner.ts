import { execSync } from "node:child_process";

export type SpawnMode = "window" | "tab" | "split-right" | "split-down";

export interface SpawnOptions {
  mode: SpawnMode;
  directory: string;
  prompt?: string;
  safe?: boolean;
  count: number;
}

export const KEYSTROKES: Record<SpawnMode, string> = {
  window: 'keystroke "n" using command down',
  tab: 'keystroke "t" using command down',
  "split-right": 'keystroke "d" using command down',
  "split-down": 'keystroke "d" using {command down, shift down}',
};

export function escapeForAppleScript(str: string): string {
  // Escape backslashes and double quotes for AppleScript strings
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function escapeForShell(str: string): string {
  // Escape single quotes for shell (replace ' with '\'' )
  return str.replace(/'/g, "'\\''");
}

export function buildAppleScript(options: SpawnOptions): string {
  const keystroke = KEYSTROKES[options.mode];
  const claudeCmd = options.safe ? "claude" : "yolo";
  const cdCmd = escapeForAppleScript(`cd '${options.directory}'`);

  // Build the claude command with optional prompt
  // Use single quotes for the shell prompt to avoid AppleScript escaping issues
  let fullClaudeCmd = claudeCmd;
  if (options.prompt) {
    const shellEscapedPrompt = escapeForShell(options.prompt);
    fullClaudeCmd = `${claudeCmd} '${shellEscapedPrompt}'`;
  }
  const escapedClaudeCmd = escapeForAppleScript(fullClaudeCmd);

  return `
tell application "Ghostty" to activate
delay 0.3
tell application "System Events"
    tell process "Ghostty"
        ${keystroke}
        delay 0.8
    end tell
    delay 0.3
    keystroke "${cdCmd}"
    keystroke return
    delay 0.3
    keystroke "${escapedClaudeCmd}"
    keystroke return
end tell
`;
}

export function getModeLabel(mode: SpawnMode): string {
  switch (mode) {
    case "window":
      return "window";
    case "tab":
      return "tab";
    case "split-right":
      return "split (right)";
    case "split-down":
      return "split (down)";
  }
}

export function spawnClaude(options: SpawnOptions): void {
  const script = buildAppleScript(options);

  for (let i = 1; i <= options.count; i++) {
    const modeLabel = getModeLabel(options.mode);

    console.log(
      `Spawning Claude (${options.safe ? "claude" : "yolo"}) instance ${i} in ${modeLabel}...`,
    );

    try {
      execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, {
        stdio: "pipe",
      });
    } catch {
      // Try alternative approach with heredoc
      execSync(`osascript <<'APPLESCRIPT'\n${script}\nAPPLESCRIPT`, {
        stdio: "pipe",
        shell: "/bin/bash",
      });
    }

    if (i < options.count) {
      // Brief pause between spawns
      execSync("sleep 1.5");
    }
  }

  console.log(`Done! Spawned ${options.count} Claude instance(s)`);
}

export function checkPlatform(): void {
  if (process.platform !== "darwin") {
    console.error(
      "Error: spawn-claude only works on macOS (uses Ghostty + AppleScript)",
    );
    process.exit(1);
  }
}
