# search-console-cli

CLI tool for querying Google Search Console data - search analytics, keywords, and page performance.

## Installation

```bash
npm install -g @neonwatty/search-console-cli
```

Or from this repo:

```bash
cd packages/search-console-cli
npm install && npm run build && npm link
```

## Prerequisites

1. Enable the **Search Console API** in your Google Cloud Console
2. Create OAuth 2.0 credentials (Desktop app type)
3. Set environment variables:
   ```bash
   export GOOGLE_SEARCH_CONSOLE_CLIENT_ID="your-client-id"
   export GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET="your-client-secret"
   ```
   Or download `client_secrets.json` to your working directory.

## Usage

### Authentication

```bash
# Authenticate (opens browser)
gsc auth

# Check authentication status
gsc auth --status

# Clear stored credentials
gsc auth --logout
```

### List Sites

```bash
# List all verified sites
gsc sites

# Output as JSON
gsc sites --json
```

### Query Search Analytics

```bash
# Basic query - last 7 days
gsc query https://example.com

# Top search queries
gsc query https://example.com --dimensions query

# Top pages
gsc query https://example.com --dimensions page --days 30

# Keywords for a specific page
gsc query https://example.com --dimensions query --filter-page "/blog/"

# Mobile traffic only
gsc query https://example.com --dimensions query --filter-device mobile

# Daily trend for a keyword
gsc query https://example.com --dimensions date --filter-query "keyword"

# Custom date range
gsc query https://example.com --start 2025-01-01 --end 2025-01-31

# Export to CSV
gsc query https://example.com --dimensions query,page --limit 100 --csv > data.csv

# JSON output
gsc query https://example.com --dimensions query --json
```

### Query Options

| Option                    | Description                                         |
| ------------------------- | --------------------------------------------------- |
| `--days <n>`              | Last N days of data (default: 7)                    |
| `--start <date>`          | Start date (YYYY-MM-DD)                             |
| `--end <date>`            | End date (YYYY-MM-DD)                               |
| `--dimensions <list>`     | Comma-separated: query, page, country, device, date |
| `--filter-query <text>`   | Filter by search query (contains)                   |
| `--filter-page <text>`    | Filter by page URL (contains)                       |
| `--filter-country <code>` | Filter by country code (e.g., usa, gbr)             |
| `--filter-device <type>`  | Filter by device: mobile, desktop, tablet           |
| `--type <type>`           | Search type: web, image, video, news, discover      |
| `--limit <n>`             | Max rows to return (default: 25, max: 25000)        |
| `--sort <field>`          | Sort by: clicks, impressions, ctr, position         |
| `--json`                  | Output as JSON                                      |
| `--csv`                   | Output as CSV                                       |

## MCP Integration

When installed via `make install-mcp`, these tools are available to Claude Code:

- `gsc_auth` - Authenticate with Google Search Console
- `gsc_sites` - List verified sites
- `gsc_query` - Query search analytics data

## License

MIT
