#!/bin/bash
# spawn-claude.sh - Spawn Claude Code instances in new Ghostty terminals
#
# Usage:
#   spawn-claude                    # New window with yolo (default)
#   spawn-claude --tab              # New tab instead of window
#   spawn-claude --split-right      # Split vertically (new pane on right)
#   spawn-claude --split-down       # Split horizontally (new pane below)
#   spawn-claude --safe             # Use 'claude' instead of 'yolo'
#   spawn-claude --prompt "task"    # Start with a prompt
#   spawn-claude --dir /path        # Start in specific directory
#   spawn-claude --count 3          # Spawn multiple instances

set -e

# Defaults
MODE="window"  # window, tab, split-right, split-down
PROMPT=""
DIR=""
COUNT=1
CLAUDE_CMD="yolo"  # Default to yolo alias

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --tab|-t)
            MODE="tab"
            shift
            ;;
        --window|-w)
            MODE="window"
            shift
            ;;
        --split-right|--right|-r)
            MODE="split-right"
            shift
            ;;
        --split-down|--down)
            MODE="split-down"
            shift
            ;;
        --safe|-s)
            CLAUDE_CMD="claude"
            shift
            ;;
        --prompt|-p)
            PROMPT="$2"
            shift 2
            ;;
        --dir)
            DIR="$2"
            shift 2
            ;;
        --count|-c)
            COUNT="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: spawn-claude [options]"
            echo ""
            echo "Options:"
            echo "  --window, -w       Open in new window (default)"
            echo "  --tab, -t          Open in new tab"
            echo "  --split-right, -r  Split vertically (pane on right)"
            echo "  --split-down       Split horizontally (pane below)"
            echo "  --safe, -s         Use 'claude' instead of 'yolo' alias"
            echo "  --prompt, -p TEXT  Start Claude with initial prompt"
            echo "  --dir PATH         Start in specific directory"
            echo "  --count, -c N      Spawn N instances (default: 1)"
            echo "  --help, -h         Show this help"
            echo ""
            echo "By default uses 'yolo' alias (claude --dangerously-skip-permissions)"
            exit 0
            ;;
        *)
            # Treat remaining args as prompt
            PROMPT="$*"
            break
            ;;
    esac
done

# Use current directory if not specified
if [[ -z "$DIR" ]]; then
    DIR="$(pwd)"
fi

# Keystroke for mode
case "$MODE" in
    tab)
        KEYSTROKE='keystroke "t" using command down'
        ;;
    split-right)
        KEYSTROKE='keystroke "d" using command down'
        ;;
    split-down)
        KEYSTROKE='keystroke "d" using {command down, shift down}'
        ;;
    *)  # window
        KEYSTROKE='keystroke "n" using command down'
        ;;
esac

spawn_one() {
    # Build command parts separately for cleaner AppleScript
    local cd_cmd="cd '${DIR}'"
    local claude_cmd="$CLAUDE_CMD"

    if [[ -n "$PROMPT" ]]; then
        # For prompts, write to a temp file to avoid escaping issues
        local tmpfile=$(mktemp)
        echo "$PROMPT" > "$tmpfile"
        claude_cmd="$CLAUDE_CMD \"\$(cat $tmpfile)\""
    fi

    osascript <<EOF
tell application "Ghostty" to activate
delay 0.3
tell application "System Events"
    tell process "Ghostty"
        $KEYSTROKE
        delay 0.8
    end tell
    delay 0.3
    keystroke "${cd_cmd}"
    keystroke return
    delay 0.3
    keystroke "${claude_cmd}"
    keystroke return
end tell
EOF
}

# Spawn requested number of instances
for ((i=1; i<=COUNT; i++)); do
    echo "Spawning Claude ($CLAUDE_CMD) instance $i in $MODE..."
    spawn_one
    if [[ $i -lt $COUNT ]]; then
        sleep 1.5  # Brief pause between spawns
    fi
done

echo "Done! Spawned $COUNT Claude instance(s)"
