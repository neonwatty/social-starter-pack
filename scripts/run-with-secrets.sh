#!/usr/bin/env bash
# Run a command with secrets from Doppler (preferred) or local .env (fallback)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Function to load .env file
load_env() {
    if [ -f "$PROJECT_DIR/.env" ]; then
        set -a
        # shellcheck source=/dev/null
        source "$PROJECT_DIR/.env"
        set +a
        return 0
    fi
    return 1
}

# Function to create praw.ini for reddit-market-research
setup_praw_ini() {
    local praw_ini="$HOME/praw.ini"

    # Check if required vars are set
    if [ -z "$REDDIT_CLIENT_ID" ] || [ -z "$REDDIT_CLIENT_SECRET" ]; then
        echo "Error: Reddit credentials not configured."
        echo "Run 'make setup-doppler' or 'make setup-secrets' first."
        exit 1
    fi

    # Create or update praw.ini
    cat > "$praw_ini" << EOF
[DEFAULT]
client_id=$REDDIT_CLIENT_ID
client_secret=$REDDIT_CLIENT_SECRET
username=$REDDIT_USERNAME
password=$REDDIT_PASSWORD
user_agent=reddit-market-research by /u/$REDDIT_USERNAME
EOF

    chmod 600 "$praw_ini"
}

# Main logic
main() {
    local cmd="$1"
    shift

    # Try Doppler first
    if command -v doppler &> /dev/null && doppler secrets &> /dev/null 2>&1; then
        echo "[Using Doppler secrets]" >&2

        # Export Doppler secrets to environment
        eval "$(doppler secrets download --no-file --format env-no-quotes 2>/dev/null | sed 's/^/export /')"
    elif load_env; then
        echo "[Using local .env file]" >&2
    else
        echo "Warning: No secrets configured. Some features may not work." >&2
    fi

    # Special handling for reddit-market-research
    if [[ "$cmd" == "reddit-market-research" ]]; then
        setup_praw_ini
    fi

    # Special handling for youtube-upload-api (yt-shorts)
    # YouTube uses OAuth tokens - env vars are passed through for initial auth
    # The tool handles its own token storage after first auth

    # Run the command
    exec "$cmd" "$@"
}

main "$@"
