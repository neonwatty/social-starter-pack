# @neonwatty/twitter-cli

CLI tool for posting tweets and managing content on X/Twitter via API v2.

## Installation

```bash
npm install -g @neonwatty/twitter-cli
```

Or from the monorepo:

```bash
make install-node
```

## Setup

1. Create an app at [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Enable OAuth 1.0a with Read and Write permissions
3. Generate Access Token and Secret

## Authentication

```bash
# Via CLI options
twitter auth \
  --api-key YOUR_API_KEY \
  --api-secret YOUR_API_SECRET \
  --access-token YOUR_ACCESS_TOKEN \
  --access-token-secret YOUR_ACCESS_TOKEN_SECRET

# Or via environment variables
export X_API_KEY=...
export X_API_SECRET=...
export X_ACCESS_TOKEN=...
export X_ACCESS_TOKEN_SECRET=...
twitter auth
```

Credentials are saved to `~/.x-cli-credentials.json`.

## Usage

```bash
# Post a tweet
twitter post "Hello, world!"

# Post with media
twitter post "Check this out!" --image photo.jpg
twitter post "Watch this!" --video clip.mp4

# Post a thread
twitter thread "First tweet" "Second tweet" "Third tweet"

# Reply to a tweet
twitter reply 1234567890 "Great point!"

# View timeline
twitter timeline --limit 20

# View current user
twitter me

# Delete a tweet
twitter delete 1234567890

# Logout
twitter logout
```

## Rate Limits

- POST /2/tweets: 300 per 3 hours
- GET /2/tweets: 900 per 15 minutes

## License

MIT
