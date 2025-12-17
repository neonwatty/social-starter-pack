# spawn-claude

Spawn Claude Code instances in new Ghostty terminals (macOS only).

## Installation

```bash
npm install -g @neonwatty/spawn-claude
```

## Usage

```bash
spawn-claude                     # New window with yolo
spawn-claude -t                  # New tab
spawn-claude -r                  # Split right (vertical)
spawn-claude --split-down        # Split down (horizontal)
spawn-claude -p "fix the tests"  # With initial prompt
spawn-claude --safe              # Use claude instead of yolo
spawn-claude -r -c 3             # 3 split-right panes
```

## Options

| Flag | Description |
|------|-------------|
| `-w, --window` | Open in new window (default) |
| `-t, --tab` | Open in new tab |
| `-r, --split-right` | Split vertically (pane on right) |
| `--split-down` | Split horizontally (pane below) |
| `-s, --safe` | Use `claude` instead of `yolo` alias |
| `-p, --prompt <text>` | Start Claude with initial prompt |
| `--dir <path>` | Start in specific directory |
| `-c, --count <n>` | Spawn N instances (default: 1) |

## Requirements

- macOS (uses AppleScript)
- [Ghostty](https://ghostty.org/) terminal
- Claude Code CLI (`claude` or `yolo` alias)

## How It Works

Uses AppleScript to control Ghostty:
1. Activates Ghostty
2. Sends keyboard shortcuts (Cmd+N/T/D) to create new window/tab/split
3. Types `cd` and `yolo`/`claude` commands

## License

MIT
