# Social Starter Pack - CLI Reference

Keyword research, content creation, and social media tools.

## Tools

| Tool | Description |
|------|-------------|
| [autocomplete-cli](./autocomplete-cli.md) | Query autocomplete suggestions from Google, YouTube, Bing, Amazon, DuckDuckGo |
| [demo-recorder](./demo-recorder.md) | Record demo videos and screenshots of web apps |
| [youtube-upload-api](./youtube-upload-api.md) | Manage YouTube Shorts - upload, list, clone, update |
| [reddit-market-research](./reddit-market-research.md) | Search Reddit for pain points and market opportunities |

## Quick Setup

```bash
# Clone and install
git clone https://github.com/neonwatty/social-starter-pack
cd social-starter-pack
make install

# Or install just the glue (Makefile, scripts)
curl -sL https://raw.githubusercontent.com/neonwatty/social-starter-pack/main/install.sh | bash
```

## Adding to CLAUDE.md

Include these docs in your Claude Code context:

```markdown
## Social Starter Pack

CLI tools for keyword research and content creation.
Full reference: https://github.com/neonwatty/social-starter-pack/tree/main/docs

### Quick Commands
- `autocomplete google "query"` - Google keyword suggestions
- `autocomplete youtube "query" --expand` - YouTube suggestions with a-z expansion
- `demo-recorder record demo.ts -o video.mp4` - Record demo video
- `yt-shorts upload video.mp4 --title "Title"` - Upload YouTube Short
- `make reddit ARGS='search -s "subreddit" -k "keywords"'` - Search Reddit
```

Or fetch full docs:

```markdown
For CLI usage, see:
- docs/autocomplete-cli.md
- docs/demo-recorder.md
- docs/youtube-upload-api.md
- docs/reddit-market-research.md
```
