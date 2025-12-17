#!/usr/bin/env node

import { program } from "commander";
import { spawnClaude, checkPlatform } from "./spawner.js";
import type { SpawnMode } from "./spawner.js";

// Check platform before doing anything
checkPlatform();

program
  .name("spawn-claude")
  .description(
    "Spawn Claude Code instances in new Ghostty terminals (windows, tabs, splits)",
  )
  .version("1.0.0")
  .option("-w, --window", "Open in new window (default)")
  .option("-t, --tab", "Open in new tab")
  .option("-r, --split-right", "Split vertically (pane on right)")
  .option("--split-down", "Split horizontally (pane below)")
  .option("-s, --safe", "Use 'claude' instead of 'yolo' alias")
  .option("-p, --prompt <text>", "Start Claude with initial prompt")
  .option("--dir <path>", "Start in specific directory", process.cwd())
  .option("-c, --count <n>", "Spawn N instances", "1")
  .addHelpText(
    "after",
    `
Examples:
  spawn-claude                     # New window with yolo
  spawn-claude -t                  # New tab
  spawn-claude -r                  # Split right
  spawn-claude --split-down        # Split down
  spawn-claude -r -c 3             # 3 split-right panes
  spawn-claude -p "fix the tests"  # With initial prompt
  spawn-claude --safe              # Use claude instead of yolo

By default uses 'yolo' alias (claude --dangerously-skip-permissions)
`,
  )
  .action((options) => {
    // Determine mode (default to window)
    let mode: SpawnMode = "window";
    if (options.tab) mode = "tab";
    else if (options.splitRight) mode = "split-right";
    else if (options.splitDown) mode = "split-down";

    spawnClaude({
      mode,
      directory: options.dir,
      prompt: options.prompt,
      safe: options.safe ?? false,
      count: parseInt(options.count, 10),
    });
  });

program.parse();
