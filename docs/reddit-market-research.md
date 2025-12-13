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
reddit-market-research post      Post a submission to Reddit
reddit-market-research flairs    List available flairs for a subreddit
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

## Posting to Reddit

Post a text submission:
```bash
reddit-market-research post -s "test" -t "My Title" -b "Post body text"
```

Post a link submission:
```bash
reddit-market-research post -s "coolgithubprojects" -t "My Project" -u "https://github.com/user/repo"
```

Post a link with body text (requires PRAW 7.8.2+):
```bash
reddit-market-research post -s "coolgithubprojects" \
  -t "My Project" \
  -u "https://github.com/user/repo" \
  -b "Description of the project..."
```

### Post Options

```
-s, --subreddit <sub>     Subreddit to post to (without r/ prefix)
-t, --title <title>       Post title
-u, --url <url>           URL for link posts
-b, --body <text>         Text body (or optional body for link posts)
--flair-id <id>           Flair template ID (from 'flairs' command)
--flair-text <text>       Custom flair text (for editable flairs)
-j, --json                Output result as JSON
```

### Using Flairs

List available flairs for a subreddit:
```bash
reddit-market-research flairs -s "python"
```

Post with a flair:
```bash
reddit-market-research post -s "python" \
  -t "My Python Project" \
  -u "https://github.com/user/repo" \
  --flair-id "f35fb004-c1ff-11ee-8305-565bc5d0cc73"
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
