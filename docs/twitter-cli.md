# twitter-cli

CLI tool for posting tweets and managing content on X/Twitter via API v2.

## Installation

```bash
# From the monorepo root
make install-node

# Or standalone
cd packages/twitter-cli
npm install
npm run build
npm link
```

## Setup

### 1. Create X/Twitter Developer Account

1. Go to [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Create a new project and app
3. Enable OAuth 1.0a with Read and Write permissions
4. Generate Access Token and Secret

### 2. Configure Credentials

**Option A: Doppler (recommended)**
```bash
make doppler-connect
# Secrets should include: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
```

**Option B: Environment variables**
```bash
export X_API_KEY=your_api_key
export X_API_SECRET=your_api_secret
export X_ACCESS_TOKEN=your_access_token
export X_ACCESS_TOKEN_SECRET=your_access_token_secret
```

**Option C: CLI authentication**
```bash
twitter auth \
  --api-key YOUR_API_KEY \
  --api-secret YOUR_API_SECRET \
  --access-token YOUR_ACCESS_TOKEN \
  --access-token-secret YOUR_ACCESS_TOKEN_SECRET
```

Credentials are saved to `~/.x-cli-credentials.json` after successful authentication.

## Commands

### Authentication

```bash
# Authenticate and save credentials
twitter auth --api-key KEY --api-secret SECRET --access-token TOKEN --access-token-secret SECRET

# View current user
twitter me

# Remove saved credentials
twitter logout
```

### Posting

```bash
# Post a simple tweet
twitter post "Hello, world!"

# Post with an image
twitter post "Check this out!" --image photo.jpg

# Post with a video
twitter post "Watch this!" --video clip.mp4

# Post with multiple media
twitter post "Multiple images" --media img1.jpg img2.jpg img3.jpg

# Post a thread
twitter thread "First tweet" "Second tweet" "Third tweet"
```

### Replying

```bash
# Reply to a tweet
twitter reply 1234567890 "Great point!"

# Reply with media
twitter reply 1234567890 "Here's a visual" --image diagram.png
```

### Reading

```bash
# View your timeline
twitter timeline

# View more tweets
twitter timeline --limit 20

# Exclude replies and retweets
twitter timeline --no-replies --no-retweets

# View a specific tweet
twitter view 1234567890
```

### Deleting

```bash
twitter delete 1234567890
```

## Rate Limits

X API v2 rate limits (Basic tier):
- **POST /2/tweets**: 300 per 3 hours
- **GET /2/tweets**: 900 per 15 minutes

## Media Limits

| Type | Max Size |
|------|----------|
| Images (JPEG, PNG, GIF, WEBP) | 5 MB |
| Videos (MP4) | 512 MB |
| Animated GIFs | 15 MB |

## Running via Makefile

```bash
# With Doppler secrets injection
make twitter ARGS='post "Hello from make!"'
make twitter ARGS='timeline --limit 5'
```

## Development

```bash
cd packages/twitter-cli

# Install dependencies
npm install

# Run in development mode
npm run dev -- post "Test tweet"

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck

# Build
npm run build
```
