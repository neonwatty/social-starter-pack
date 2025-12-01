#!/usr/bin/env bash
# Install social-starter-pack into current directory
# Usage: curl -sL https://raw.githubusercontent.com/neonwatty/social-starter-pack/main/install.sh | bash

set -e

REPO="neonwatty/social-starter-pack"
BRANCH="main"
BASE_URL="https://raw.githubusercontent.com/$REPO/$BRANCH"

echo "Installing social-starter-pack..."
echo ""

# Create scripts directory
mkdir -p scripts

# Download files
echo "Downloading files..."
curl -sL "$BASE_URL/Makefile" -o Makefile
curl -sL "$BASE_URL/.env.example" -o .env.example
curl -sL "$BASE_URL/scripts/run-with-secrets.sh" -o scripts/run-with-secrets.sh

# Make scripts executable
chmod +x scripts/run-with-secrets.sh

# Append to .gitignore if it exists, otherwise create
if [ -f .gitignore ]; then
    # Check if entries already exist
    if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
        echo "" >> .gitignore
        echo "# social-starter-pack secrets" >> .gitignore
        echo ".env" >> .gitignore
        echo "praw.ini" >> .gitignore
    fi
else
    cat > .gitignore << 'EOF'
# social-starter-pack secrets
.env
praw.ini
EOF
fi

echo ""
echo "Installed:"
echo "  - Makefile"
echo "  - .env.example"
echo "  - scripts/run-with-secrets.sh"
echo "  - Updated .gitignore"
echo ""
echo "Next steps:"
echo "  1. make install          # Install CLI tools"
echo "  2. make doppler-connect  # Connect to Doppler secrets"
echo "  3. make check            # Verify setup"
echo ""
echo "Or run: make help"
