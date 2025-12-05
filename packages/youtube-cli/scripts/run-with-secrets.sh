#!/bin/bash
# Run command with secrets from Doppler or local .env

# Try Doppler first
if command -v doppler &> /dev/null && doppler secrets download --no-file &> /dev/null; then
    echo "[Using Doppler secrets]" >&2
    eval "$(doppler secrets download --no-file --format env-no-quotes 2>/dev/null | sed 's/^/export /')"
# Fall back to local .env
elif [ -f ".env" ]; then
    echo "[Using local .env file]" >&2
    set -a
    source .env
    set +a
else
    echo "[Warning: No secrets configured. Set up Doppler or create .env file]" >&2
fi

exec "$@"
