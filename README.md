# Social Starter Pack

Keyword & market research tools. One command to install in any project.

## Install

```bash
curl -sL https://raw.githubusercontent.com/neonwatty/social-starter-pack/main/install.sh | bash
```

## Setup

```bash
make install          # Install CLI tools (first time only)
make doppler-connect  # Connect to secrets
make check            # Verify everything works
```

## Tools

- **[autocomplete-cli](https://github.com/neonwatty/autocomplete-cli)** - Keyword suggestions from Google, YouTube, Bing, Amazon, DuckDuckGo
- **[reddit-market-research](https://github.com/neonwatty/reddit-market-research)** - Search Reddit for pain points & opportunities
- **[demo-recorder](https://github.com/neonwatty/demo-recorder)** - Record demo videos & screenshots of web apps

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
```

## Commands

```
make help             # All commands
make install          # Install CLI tools
make doppler-connect  # Connect to Doppler project
make check            # Verify setup
```
