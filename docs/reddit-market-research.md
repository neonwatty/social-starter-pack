# reddit-market-research

Search Reddit for pain points, feature requests, and market opportunities.

## Installation

```bash
# Via uv (recommended)
uv tool install reddit-market-research

# Via pip
pip install reddit-market-research
```

## Setup

Requires Reddit API credentials. Get them at https://www.reddit.com/prefs/apps

Set environment variables:
```bash
export REDDIT_CLIENT_ID=your_client_id
export REDDIT_CLIENT_SECRET=your_client_secret
export REDDIT_USERNAME=your_username
export REDDIT_PASSWORD=your_password
```

Or use with Doppler/social-starter-pack:
```bash
make doppler-connect
make reddit ARGS='search -s "subreddit" -k "keywords"'
```

## Commands

```
reddit-market-research search    Search historical posts
reddit-market-research monitor   Monitor new posts in real-time
```

## Search Options

```
-s, --subreddits <subs>     Subreddits to search (plus-separated)
-k, --keywords <words>      Keywords to search (comma-separated)
--keywords-file <file>      Load keywords from file (one per line)
-t, --time <period>         Time filter: hour, day, week, month, year, all
--sort <order>              Sort: relevance, hot, top, new, comments
-l, --limit <n>             Max results to display (default: 20)
-j, --json                  Output as JSON
-o, --output <file>         Save to file (CSV or JSON based on extension)
```

## Examples

Basic search:
```bash
reddit-market-research search -s "startups" -k "looking for,need help"
```

Search multiple subreddits:
```bash
reddit-market-research search -s "startups+SaaS+indiehackers" -k "AI tool,automation"
```

Filter by time:
```bash
reddit-market-research search -s "webdev" -k "bug,issue" --time week
```

Save results to file:
```bash
reddit-market-research search -s "fitness" -k "app,tracking" -o results.csv
reddit-market-research search -s "fitness" -k "app,tracking" -o results.json
```

JSON output for scripting:
```bash
reddit-market-research search -s "programming" -k "help" --json | jq '.[]'
```

Load keywords from file:
```bash
reddit-market-research search -s "startups" --keywords-file keywords.txt
```

Real-time monitoring:
```bash
reddit-market-research monitor -s "startups" -k "looking for,need help"
```

## Use with Makefile

```bash
# Using social-starter-pack Makefile
make reddit ARGS='search -s "subreddit" -k "keyword1,keyword2"'
```

## Finding Market Opportunities

Search for pain points:
```bash
reddit-market-research search -s "smallbusiness+entrepreneur" \
  -k "frustrated,wish there was,looking for,anyone know" \
  --time month --limit 50
```

Search for feature requests:
```bash
reddit-market-research search -s "SaaS+startups" \
  -k "feature request,would pay for,need a tool" \
  --sort top
```
