#!/bin/bash
# Configure Claude Code MCP settings for social-tools

set -e

CLAUDE_CONFIG="$HOME/.claude.json"
MCP_NAME="social-tools"

add_config() {
    echo "Adding social-tools MCP to Claude Code config..."

    if [ ! -f "$CLAUDE_CONFIG" ]; then
        # Create new config file
        cat > "$CLAUDE_CONFIG" << 'EOF'
{
  "mcpServers": {
    "social-tools": {
      "command": "social-tools-mcp"
    }
  }
}
EOF
        echo "Created $CLAUDE_CONFIG with social-tools MCP server."
    else
        # Check if jq is available
        if ! command -v jq &> /dev/null; then
            echo "Warning: jq not installed. Please manually add to $CLAUDE_CONFIG:"
            echo '  "mcpServers": { "social-tools": { "command": "social-tools-mcp" } }'
            return 0
        fi

        # Check if social-tools already exists
        if jq -e '.mcpServers["social-tools"]' "$CLAUDE_CONFIG" &> /dev/null; then
            echo "social-tools MCP already configured in $CLAUDE_CONFIG"
            return 0
        fi

        # Add social-tools to existing config
        tmp=$(mktemp)
        if jq -e '.mcpServers' "$CLAUDE_CONFIG" &> /dev/null; then
            # mcpServers exists, add to it
            jq '.mcpServers["social-tools"] = {"command": "social-tools-mcp"}' "$CLAUDE_CONFIG" > "$tmp"
        else
            # mcpServers doesn't exist, create it
            jq '. + {"mcpServers": {"social-tools": {"command": "social-tools-mcp"}}}' "$CLAUDE_CONFIG" > "$tmp"
        fi
        mv "$tmp" "$CLAUDE_CONFIG"
        echo "Added social-tools MCP to $CLAUDE_CONFIG"
    fi

    echo ""
    echo "Restart Claude Code for changes to take effect."
}

remove_config() {
    echo "Removing social-tools MCP from Claude Code config..."

    if [ ! -f "$CLAUDE_CONFIG" ]; then
        echo "No Claude config found at $CLAUDE_CONFIG"
        return 0
    fi

    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        echo "Warning: jq not installed. Please manually remove social-tools from $CLAUDE_CONFIG"
        return 0
    fi

    # Check if social-tools exists
    if ! jq -e '.mcpServers["social-tools"]' "$CLAUDE_CONFIG" &> /dev/null; then
        echo "social-tools MCP not found in $CLAUDE_CONFIG"
        return 0
    fi

    # Remove social-tools from config
    tmp=$(mktemp)
    jq 'del(.mcpServers["social-tools"])' "$CLAUDE_CONFIG" > "$tmp"
    mv "$tmp" "$CLAUDE_CONFIG"
    echo "Removed social-tools MCP from $CLAUDE_CONFIG"

    echo ""
    echo "Restart Claude Code for changes to take effect."
}

case "${1:-}" in
    add)
        add_config
        ;;
    remove)
        remove_config
        ;;
    *)
        echo "Usage: $0 {add|remove}"
        exit 1
        ;;
esac
