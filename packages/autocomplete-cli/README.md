# autocomplete-cli

Query autocomplete suggestions from Google, YouTube, Bing, Amazon, and DuckDuckGo.

## Install

```bash
npm install -g @neonwatty/autocomplete-cli
```

## Usage

```bash
autocomplete <source> <query> [options]
```

### Sources

| Source | Command | Description |
|--------|---------|-------------|
| Google | `autocomplete google "query"` | Google search suggestions |
| YouTube | `autocomplete youtube "query"` | YouTube search suggestions |
| Bing | `autocomplete bing "query"` | Bing search suggestions |
| Amazon | `autocomplete amazon "query"` | Amazon product suggestions |
| DuckDuckGo | `autocomplete ddg "query"` | DuckDuckGo suggestions |

### Options

| Flag | Description |
|------|-------------|
| `-l, --lang <code>` | Language code (e.g., `en`, `de`, `es`) |
| `-c, --country <code>` | Country code (e.g., `us`, `uk`, `de`) |
| `-d, --delay <ms>` | Delay between API calls in ms (default: 100) |
| `-e, --expand` | Expand with alphabet suffixes (a-z) |
| `-q, --questions` | Expand with question words |
| `-p, --prefix <list>` | Custom prefixes (comma-separated) |
| `-f, --format <type>` | Output format: `text`, `json`, `csv` |

## Examples

```bash
# Google suggestions
autocomplete google "best programming language"

# YouTube suggestions
autocomplete youtube "how to learn python"

# Amazon product suggestions
autocomplete amazon "mechanical keyboard"

# Bing with language
autocomplete bing "wetter" --lang de

# DuckDuckGo (short alias)
autocomplete ddg "privacy browser"

# JSON output for scripting
autocomplete google "typescript" --format json

# CSV for spreadsheets
autocomplete amazon "desk" --format csv > keywords.csv

# Alphabet expansion (27 queries, ~270 results)
autocomplete google "coffee" --expand

# Question word expansion (what, how, why, etc.)
autocomplete youtube "python" --questions

# Custom prefixes
autocomplete google "programming" --prefix "best,learn,how to"

# Combined expansion with JSON output
autocomplete google "seo" --expand --questions --format json
```

## Using with Claude Code / AI Agents

After installing globally, you can instruct Claude Code or other AI agents to use this tool for keyword research:

### Example prompts:

```
Use the autocomplete CLI to find Google search suggestions for "best laptop 2025"
```

```
Run autocomplete to get Amazon product keyword ideas for "standing desk"
```

```
Use the autocomplete tool to compare suggestions across Google, YouTube, and Amazon for "productivity apps"
```

### In CLAUDE.md or system prompts:

```markdown
## Available Tools

- `autocomplete` - CLI for keyword research. Usage:
  - `autocomplete google "query"` - Google suggestions
  - `autocomplete youtube "query"` - YouTube suggestions
  - `autocomplete amazon "query"` - Amazon product suggestions
  - `autocomplete bing "query"` - Bing suggestions
  - `autocomplete ddg "query"` - DuckDuckGo suggestions
```

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm test             # Run tests (108 tests)
npm run lint         # Lint code
npm run typecheck    # Type check
```

## License

MIT

