# Social Starter Pack

Keyword & market research tools in a unified monorepo.

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
make doppler-connect  # Connect to Doppler for secrets
make setup-secrets    # Create local .env file
make check            # Verify setup
make test             # Run all package tests
```

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

## License

MIT
