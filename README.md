# Social Starter Pack

Keyword & market research tools in a unified monorepo.

## Tools

- **[autocomplete-cli](./packages/autocomplete-cli)** - Keyword suggestions from Google, YouTube, Bing, Amazon, DuckDuckGo
- **[reddit-market-research](./packages/reddit-market-research)** - Search Reddit for pain points & opportunities
- **[demo-recorder](./packages/demo-recorder)** - Record demo videos & screenshots of web apps
- **[youtube-upload-api](./packages/youtube-upload-api)** - Manage YouTube Shorts (upload, list, clone, update)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/neonwatty/social-starter-pack.git
cd social-starter-pack

# Install all tools
make install

# Connect to secrets (Doppler recommended)
make doppler-connect

# Verify setup
make check
```

## Usage

```bash
# Keyword research
autocomplete google "your idea"
autocomplete youtube "topic" --expand-alphabet

# Reddit research (secrets auto-injected)
make reddit ARGS='search -s "startups" -k "looking for,need help"'

# Demo recording (requires FFmpeg)
demo-recorder record demo.ts -o video.mp4
demo-recorder screenshot demo.ts -o screenshots/

# YouTube Shorts management (requires OAuth setup)
make youtube ARGS='auth'                    # First-time authentication
make youtube ARGS='list'                    # List your videos
make youtube ARGS='upload video.mp4 --title "My Short"'
```

## Commands

```
make help             # All commands
make install          # Install all CLI tools
make doppler-connect  # Connect to Doppler project
make setup-secrets    # Create local .env file (alternative to Doppler)
make check            # Verify setup
```

## Development

This is a monorepo containing:

| Package | Language | Registry |
|---------|----------|----------|
| autocomplete-cli | TypeScript | npm |
| demo-recorder | TypeScript | npm |
| youtube-upload-api | TypeScript | npm |
| reddit-market-research | Python | PyPI |

Each package has its own CI/CD workflows in `packages/<name>/.github/workflows/`.

## License

MIT
