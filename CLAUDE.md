# Social Starter Pack

CLI tools for keyword research, content creation, and social media management.

## When to Use

| Task | Tool |
|------|------|
| Find keyword ideas for content | `autocomplete` |
| Discover user pain points & opportunities | `reddit-market-research` |
| Create product demos & screenshots | `demo-recorder` |
| Publish & manage YouTube Shorts | `youtube` |
| Post tweets & manage X/Twitter content | `twitter` |
| Post updates & manage LinkedIn content | `linkedin` |
| Create & manage Google Forms | `gforms` |
| Use all tools via Claude Code | `mcp-server` |

## Tools

### autocomplete-cli
Keyword suggestions from Google, YouTube, Bing, Amazon, DuckDuckGo.
```bash
autocomplete google "query"           # Google suggestions
autocomplete youtube "query" --expand # YouTube with a-z expansion
autocomplete amazon "query" --format json
```
[Full docs](./docs/autocomplete-cli.md)

### demo-recorder
Record demo videos and screenshots of web apps using Playwright.
```bash
demo-recorder create my-demo              # Create demo definition
demo-recorder record demo.ts -o video.mp4 # Record video
demo-recorder screenshot demo.ts          # Capture screenshots
demo-recorder gif video.mp4 -o demo.gif   # Convert to GIF
```
[Full docs](./docs/demo-recorder.md)

### youtube-cli
Manage YouTube Shorts - upload, list, clone, update.
```bash
youtube auth                                    # First-time auth
youtube upload video.mp4 --title "My Short"    # Upload
youtube list --max 20                          # List videos
youtube clone <video-id> --title "New Title"   # Clone video
```
[Full docs](./docs/youtube-cli.md)

### reddit-market-research
Search Reddit for pain points and market opportunities.
```bash
make reddit ARGS='search -s "startups+SaaS" -k "looking for,need help"'
make reddit ARGS='search -s "webdev" -k "bug" --time week --limit 50'
```
[Full docs](./docs/reddit-market-research.md)

### twitter-cli
Post tweets and manage content on X/Twitter via API v2.
```bash
twitter auth                              # First-time auth with credentials
twitter post "Hello world!"               # Post a tweet
twitter post "Check this!" --image pic.jpg # Post with media
twitter timeline --limit 10               # View recent tweets
twitter thread "First" "Second" "Third"   # Post a thread
```
[Full docs](./docs/twitter-cli.md)

### linkedin-cli
Post updates and manage content on LinkedIn via the Marketing API.
```bash
linkedin auth --client-id ID --client-secret SECRET  # First-time auth
linkedin post "Hello LinkedIn!"                       # Post an update
linkedin post "Check this!" --image pic.jpg          # Post with media
linkedin whoami                                       # View current user
linkedin status                                       # Check token status
```
[Full docs](./docs/linkedin-cli.md)

## Setup

```bash
make install          # Install all CLI tools
make doppler-connect  # Connect to Doppler for secrets
make check            # Verify setup
```

## Claude Code Integration (MCP)

Install the MCP server to use all tools directly from Claude Code:
```bash
make install-mcp      # Install MCP server + configure Claude Code
# Restart Claude Code
make uninstall-mcp    # Remove MCP server
```

Once installed, Claude can:
- Search keywords (`autocomplete`)
- Post to Twitter/LinkedIn
- Search Reddit for market research
- Manage YouTube videos
- Record demos & screenshots
- Create/manage Google Forms

## Secrets

YouTube, Reddit, Twitter, and LinkedIn tools require API credentials. Configure via:
- Doppler: `make doppler-connect`
- Or `.env` file (copy from `.env.example`)
