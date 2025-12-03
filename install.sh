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
        {
            echo ""
            echo "# social-starter-pack secrets"
            echo ".env"
            echo "praw.ini"
        } >> .gitignore
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
echo ""
echo "─────────────────────────────────────────────────────"
echo "Add to your AGENTS.md or CLAUDE.md:"
echo "─────────────────────────────────────────────────────"
echo ""
echo "## Social Starter Pack Tools"
echo ""
echo "### autocomplete-cli"
echo "Keyword suggestions from Google, YouTube, Bing, Amazon, DuckDuckGo."
echo "- \`autocomplete google \"topic\"\` - Google suggestions"
echo "- \`autocomplete --help\` - all options"
echo "- README: https://github.com/neonwatty/social-starter-pack/tree/main/packages/autocomplete-cli"
echo ""
echo "### reddit-market-research"
echo "Search Reddit for pain points and market opportunities."
echo "- \`make reddit ARGS='search -s \"subreddit\" -k \"keywords\"'\`"
echo "- Requires: \`make doppler-connect\` for credentials"
echo "- README: https://github.com/neonwatty/social-starter-pack/tree/main/packages/reddit-market-research"
echo ""
echo "### demo-recorder"
echo "Record demo videos and screenshots of web apps."
echo "- \`demo-recorder record demo.ts -o video.mp4\`"
echo "- Requires: FFmpeg installed"
echo "- README: https://github.com/neonwatty/social-starter-pack/tree/main/packages/demo-recorder"
echo ""
echo "### youtube-upload-api"
echo "Manage YouTube Shorts - upload, list, clone, update."
echo "- \`make youtube ARGS='auth'\` - First-time authentication"
echo "- \`make youtube ARGS='list'\` - List your videos"
echo "- \`make youtube ARGS='upload video.mp4 --title \"My Short\"'\`"
echo "- Requires: Google OAuth credentials (see .env.example)"
echo "- README: https://github.com/neonwatty/social-starter-pack/tree/main/packages/youtube-upload-api"
echo ""
echo "Setup: \`make install && make doppler-connect && make check\`"
echo ""
echo "─────────────────────────────────────────────────────"
echo "Or ask your AI agent:"
echo ""
cat << 'PROMPT'
Add social-starter-pack tools to my AGENTS.md or CLAUDE.md (whichever exists).
Fetch each README for full usage details.

1. autocomplete-cli - keyword suggestions from Google, YouTube, Bing, Amazon, DuckDuckGo
   - Example: autocomplete google "topic"
   - Help: autocomplete --help
   - README: https://github.com/neonwatty/social-starter-pack/tree/main/packages/autocomplete-cli

2. reddit-market-research - search Reddit for pain points and market opportunities
   - Example: make reddit ARGS='search -s "subreddit" -k "keywords"'
   - Requires: make doppler-connect for credentials
   - Help: reddit-market-research --help
   - README: https://github.com/neonwatty/social-starter-pack/tree/main/packages/reddit-market-research

3. demo-recorder - record demo videos and screenshots of web apps
   - Example: demo-recorder record demo.ts -o video.mp4
   - Requires: FFmpeg installed
   - Help: demo-recorder --help
   - README: https://github.com/neonwatty/social-starter-pack/tree/main/packages/demo-recorder

4. youtube-upload-api - manage YouTube Shorts (upload, list, clone, update)
   - Example: make youtube ARGS='upload video.mp4 --title "My Short"'
   - Requires: Google OAuth credentials
   - Help: yt-shorts --help
   - README: https://github.com/neonwatty/social-starter-pack/tree/main/packages/youtube-upload-api

Setup: make install && make doppler-connect && make check
PROMPT
echo ""
echo "─────────────────────────────────────────────────────"
