# Reddit Market Research Tool

Search Reddit for potential users, pain points, and market opportunities for your projects.

## Installation

```bash
pip install reddit-market-research
```

## Setup

Create a `praw.ini` file in your working directory with your Reddit API credentials:

```ini
[market_research]
client_id = YOUR_CLIENT_ID
client_secret = YOUR_CLIENT_SECRET
username = YOUR_USERNAME
password = YOUR_PASSWORD
user_agent = market_research by u/YOUR_USERNAME
```

Get credentials at https://www.reddit.com/prefs/apps (create a "script" app).

## Usage

### Search Historical Posts

```bash
# Basic search (keywords and subreddits required)
reddit-market-research search -s "startups+SaaS" -k "AI tool,help,recommendation"

# JSON output for programmatic use
reddit-market-research search -s "webdev" -k "bug,issue" --json

# Save to CSV
reddit-market-research search -s "programming" -k "help,looking for" --output results.csv

# Time filters and limits
reddit-market-research search -s "fitness" -k "app,tracking" --time year --limit 50

# Load keywords from file
reddit-market-research search -s "startups" --keywords-file keywords.txt --json
```

### Monitor New Posts (real-time)

```bash
reddit-market-research monitor -s "startups+SaaS" -k "looking for,need help"
```

## Options

| Flag | Short | Description |
|------|-------|-------------|
| `--subreddits` | `-s` | Subreddits to search (plus-separated) **required** |
| `--keywords` | `-k` | Keywords to match (comma-separated) |
| `--keywords-file` | | Load keywords from file (one per line) |
| `--time` | `-t` | Time filter: hour, day, week, month, year, all |
| `--sort` | | Sort: relevance, hot, top, new, comments |
| `--limit` | `-l` | Max results to display |
| `--json` | `-j` | Output as JSON |
| `--output` | `-o` | Save to file (.csv or .json) |

## Output Fields

Each result includes:
- `title` - Post title
- `body` - First 200 chars of post body (where pain points often live)
- `subreddit` - Source subreddit
- `score` - Upvotes
- `comments` - Comment count
- `url` - Direct link to post
- `created` - Post timestamp
- `author` - Reddit username

## Claude Code Workflow

This tool is designed to be used with Claude Code for market research on GitHub repos:

```
User: "Research market opportunities for https://github.com/neonwatty/seating-arrangement"

Claude Code:
  1. Fetches repo README via WebFetch
  2. Analyzes project → generates keywords + subreddits
  3. Runs: reddit-market-research search -s "..." -k "..." --json
  4. Parses JSON results
  5. Summarizes opportunities for user
```

Example prompts:
- "Find Reddit discussions about problems my seating-arrangement tool could solve"
- "Search for potential users of my meme-search project"
- "What pain points do people have that my youtube-tools repo addresses?"

## Development

```bash
# Clone and install in development mode
git clone https://github.com/neonwatty/reddit-market-research.git
cd reddit-market-research
pip install -e ".[dev]"

# Run linting
ruff check reddit_monitor.py

# Run formatter
ruff format reddit_monitor.py

# Run type checking
mypy reddit_monitor.py

# Run dead code detection
vulture reddit_monitor.py tests/

# Run tests
pytest tests/ -v
```

## License

MIT
