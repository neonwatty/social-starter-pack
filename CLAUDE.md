# Social Starter Pack

CLI tools for keyword research, content creation, and social media management.

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

### youtube-upload-api (yt-shorts)
Manage YouTube Shorts - upload, list, clone, update.
```bash
yt-shorts auth                                    # First-time auth
yt-shorts upload video.mp4 --title "My Short"    # Upload
yt-shorts list --max 20                          # List videos
yt-shorts clone <video-id> --title "New Title"   # Clone video
```
[Full docs](./docs/youtube-upload-api.md)

### reddit-market-research
Search Reddit for pain points and market opportunities.
```bash
make reddit ARGS='search -s "startups+SaaS" -k "looking for,need help"'
make reddit ARGS='search -s "webdev" -k "bug" --time week --limit 50'
```
[Full docs](./docs/reddit-market-research.md)

## Setup

```bash
make install          # Install all CLI tools
make doppler-connect  # Connect to Doppler for secrets
make check            # Verify setup
```

## Secrets

YouTube and Reddit tools require API credentials. Configure via:
- Doppler: `make doppler-connect`
- Or `.env` file (copy from `.env.example`)
