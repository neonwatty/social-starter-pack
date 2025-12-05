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
echo "Docs: https://github.com/neonwatty/social-starter-pack/tree/main/docs"
echo ""
echo "Or run: make help"
echo ""
echo "─────────────────────────────────────────────────────"
echo "Add to your AGENTS.md or CLAUDE.md:"
echo "─────────────────────────────────────────────────────"
echo ""
echo "## Social Starter Pack Tools"
echo ""
echo "CLI reference: https://github.com/neonwatty/social-starter-pack/tree/main/docs"
echo ""
echo "### autocomplete-cli"
echo "Keyword suggestions from Google, YouTube, Bing, Amazon, DuckDuckGo."
echo "- \`autocomplete google \"topic\"\` - Google suggestions"
echo "- \`autocomplete --help\` - all options"
echo "- Docs: https://github.com/neonwatty/social-starter-pack/blob/main/docs/autocomplete-cli.md"
echo ""
echo "### reddit-market-research"
echo "Search Reddit for pain points and market opportunities."
echo "- \`make reddit ARGS='search -s \"subreddit\" -k \"keywords\"'\`"
echo "- Requires: \`make doppler-connect\` for credentials"
echo "- Docs: https://github.com/neonwatty/social-starter-pack/blob/main/docs/reddit-market-research.md"
echo ""
echo "### demo-recorder"
echo "Record demo videos and screenshots of web apps."
echo "- \`demo-recorder record demo.ts -o video.mp4\`"
echo "- Requires: FFmpeg installed"
echo "- Docs: https://github.com/neonwatty/social-starter-pack/blob/main/docs/demo-recorder.md"
echo ""
echo "### youtube-cli"
echo "Manage YouTube Shorts - upload, list, clone, update."
echo "- \`make youtube ARGS='auth'\` - First-time authentication"
echo "- \`make youtube ARGS='list'\` - List your videos"
echo "- \`make youtube ARGS='upload video.mp4 --title \"My Short\"'\`"
echo "- Requires: Google OAuth credentials (see .env.example)"
echo "- Docs: https://github.com/neonwatty/social-starter-pack/blob/main/docs/youtube-cli.md"
echo ""
echo "Setup: \`make install && make doppler-connect && make check\`"
echo ""
echo "─────────────────────────────────────────────────────"
echo "Or ask your AI agent:"
echo ""
cat << 'PROMPT'
Add social-starter-pack tools to my AGENTS.md or CLAUDE.md (whichever exists).
Fetch each doc file for full CLI reference.

CLI docs: https://github.com/neonwatty/social-starter-pack/tree/main/docs

1. autocomplete-cli - keyword suggestions from Google, YouTube, Bing, Amazon, DuckDuckGo
   - Example: autocomplete google "topic"
   - Help: autocomplete --help
   - Docs: https://github.com/neonwatty/social-starter-pack/blob/main/docs/autocomplete-cli.md

2. reddit-market-research - search Reddit for pain points and market opportunities
   - Example: make reddit ARGS='search -s "subreddit" -k "keywords"'
   - Requires: make doppler-connect for credentials
   - Help: reddit-market-research --help
   - Docs: https://github.com/neonwatty/social-starter-pack/blob/main/docs/reddit-market-research.md

3. demo-recorder - record demo videos and screenshots of web apps
   - Example: demo-recorder record demo.ts -o video.mp4
   - Requires: FFmpeg installed
   - Help: demo-recorder --help
   - Docs: https://github.com/neonwatty/social-starter-pack/blob/main/docs/demo-recorder.md

4. youtube-cli - manage YouTube Shorts (upload, list, clone, update)
   - Example: make youtube ARGS='upload video.mp4 --title "My Short"'
   - Requires: Google OAuth credentials
   - Help: youtube --help
   - Docs: https://github.com/neonwatty/social-starter-pack/blob/main/docs/youtube-cli.md

Setup: make install && make doppler-connect && make check
PROMPT
echo ""
echo "─────────────────────────────────────────────────────"
