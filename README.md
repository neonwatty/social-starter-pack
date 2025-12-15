# Social Starter Pack

Keyword & market research tools in a unified monorepo.

## Why This Exists

I created these tools to quickly post SEO-optimized content to LinkedIn, Twitter, Reddit, and my blog without leaving Claude Code.

Context switching between the terminal and social feeds was distracting, and I had random thoughts I didn't want to lose. Now I can stay in the terminal, edit with Claude Code so I don't look like a complete idiot, and share.

Designed for Claude Code, Codex, and similar AI coding assistants. This is not a replacement for interacting on those platforms and should not be used to automate posts—that would be too antisocial even for me.

## Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Research   │ ──▶ │   Create    │ ──▶ │  Distribute │
│             │     │             │     │             │
│ autocomplete│     │ Claude Code │     │ twitter-cli │
│ reddit-mkt  │     │ + your brain│     │ linkedin-cli│
│             │     │             │     │ youtube-cli │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Tools

| Package | Description | Registry |
|---------|-------------|----------|
| [autocomplete-cli](./packages/autocomplete-cli) | Keyword suggestions from Google, YouTube, Bing, Amazon, DuckDuckGo | npm |
| [reddit-market-research](./packages/reddit-market-research) | Search Reddit for pain points & opportunities | PyPI |
| [demo-recorder](./packages/demo-recorder) | Record demo videos & screenshots of web apps | npm |
| [youtube-cli](./packages/youtube-cli) | Manage YouTube Shorts (upload, list, clone, update) | npm |
| [twitter-cli](./packages/twitter-cli) | Post tweets & manage X/Twitter content | npm |
| [linkedin-cli](./packages/linkedin-cli) | Post updates & manage LinkedIn content | npm |
| [google-forms-cli](./packages/google-forms-cli) | Create forms, add questions, export responses | npm |
| [mcp-server](./packages/mcp-server) | MCP server for Claude Code integration | npm |

## Quick Example

Research a topic and post about it:

```bash
# Find what people are searching for
autocomplete google "developer productivity" --expand

# Find real pain points on Reddit
reddit search -s "programming" -k "struggling with" --time month

# Post your insights
twitter post "Here's what I learned about developer productivity..."
linkedin post "Sharing insights from my research..."
```

Or with Claude Code + MCP installed, just ask:

> "Search Reddit for developer pain points about testing, summarize the top 3, and draft a Twitter thread"

## Quick Start

```bash
git clone https://github.com/neonwatty/social-starter-pack.git
cd social-starter-pack
make install
make doppler-connect  # Or: cp .env.example .env && edit
make check
```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Quick command reference (for LLM context)
- **[docs/](./docs)** - Detailed CLI documentation per tool

## Make Commands

```
make help             # All commands
make install          # Install all CLI tools
make install-mcp      # Install MCP server for Claude Code
make uninstall-mcp    # Uninstall MCP server
make doppler-connect  # Connect to Doppler for secrets
make setup-secrets    # Create local .env file
make check            # Verify setup
make test             # Run all package tests
```

## Claude Code Integration

Use all social tools directly from Claude Code via the MCP server:

```bash
make install-mcp      # Install & configure MCP server
# Restart Claude Code
```

This gives Claude access to: autocomplete, YouTube, Twitter, LinkedIn, Reddit search, demo recording, and Google Forms tools.

## Development

Each package has its own:
- Source code in `packages/<name>/`
- CI workflow: `.github/workflows/<name>-ci.yml`
- Publish workflow: `.github/workflows/<name>-publish.yml`

### Publishing

Tag with package prefix to trigger publish:
```bash
git tag autocomplete-cli@1.5.0
git push --tags
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Ideas:
- New platform integrations (Bluesky, Mastodon)
- Bug fixes and documentation improvements

## Resources

- [Detailed documentation](./docs/) - CLI docs for each tool
- [CLAUDE.md](./CLAUDE.md) - Quick command reference for LLM context

## License

MIT
