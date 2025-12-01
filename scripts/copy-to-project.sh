#!/usr/bin/env bash
# Copy social-starter-pack files to another project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(dirname "$SCRIPT_DIR")"

if [ -z "$1" ]; then
    echo "Usage: $0 <target-project-directory>"
    echo ""
    echo "Example: $0 ~/projects/my-new-project"
    exit 1
fi

TARGET_DIR="$1"

if [ ! -d "$TARGET_DIR" ]; then
    echo "Error: Directory '$TARGET_DIR' does not exist."
    exit 1
fi

echo "Copying social-starter-pack to: $TARGET_DIR"

# Copy files
cp "$SOURCE_DIR/Makefile" "$TARGET_DIR/"
cp "$SOURCE_DIR/.env.example" "$TARGET_DIR/"
cp "$SOURCE_DIR/.gitignore" "$TARGET_DIR/.gitignore.social" 2>/dev/null || true

# Copy scripts directory
mkdir -p "$TARGET_DIR/scripts"
cp "$SOURCE_DIR/scripts/run-with-secrets.sh" "$TARGET_DIR/scripts/"
chmod +x "$TARGET_DIR/scripts/run-with-secrets.sh"

echo ""
echo "Done! Files copied:"
echo "  - Makefile"
echo "  - .env.example"
echo "  - scripts/run-with-secrets.sh"
echo ""
echo "Next steps in $TARGET_DIR:"
echo "  1. make install"
echo "  2. make setup-doppler  (or make setup-secrets)"
echo "  3. make check"
echo ""
echo "Note: Add contents of .gitignore.social to your .gitignore"
