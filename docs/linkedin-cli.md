# linkedin-cli

CLI tool for posting content and managing posts on LinkedIn via the Marketing API.

## Installation

```bash
# From the monorepo root
make install-node

# Or standalone
cd packages/linkedin-cli
npm install
npm run build
npm link
```

## Setup

### 1. Create LinkedIn Developer App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Request access to:
   - "Share on LinkedIn" (for posting)
   - "Sign In with LinkedIn using OpenID Connect" (for authentication)
4. Add redirect URL: `http://localhost:3000/callback`
5. Note your Client ID and Client Secret

### 2. Configure Credentials

**Option A: Doppler (recommended)**
```bash
make doppler-connect
# Secrets should include: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET
```

**Option B: Environment variables**
```bash
export LINKEDIN_CLIENT_ID=your_client_id
export LINKEDIN_CLIENT_SECRET=your_client_secret
```

**Option C: CLI authentication**
```bash
linkedin auth --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
```

Credentials are saved to `~/.linkedin-cli/credentials.json` after first authentication.
Tokens are saved to `~/.linkedin-cli/tokens.json` (valid for 60 days).

## Commands

### Authentication

```bash
# Authenticate with LinkedIn (opens browser)
linkedin auth --client-id YOUR_ID --client-secret YOUR_SECRET

# View current user profile
linkedin whoami

# Check token status
linkedin status

# Remove saved tokens
linkedin logout
```

### Posting

```bash
# Post a simple text update
linkedin post "Hello LinkedIn!"

# Post with an image
linkedin post "Check this out!" --image photo.jpg

# Post with a video
linkedin post "Watch this!" --video clip.mp4

# Post with custom visibility
linkedin post "For my network only" --visibility connections

# Add media titles
linkedin post "My demo" --video demo.mp4 --video-title "Product Demo"
```

### Visibility Options

| Value | Description |
|-------|-------------|
| `public` | Visible to everyone (default) |
| `connections` | Visible only to your connections |
| `logged_in` | Visible to any logged-in LinkedIn member |

### Deleting

```bash
linkedin delete 1234567890
```

## Media Limits

| Type | Formats | Max Size |
|------|---------|----------|
| Images | JPEG, PNG | 8 MB |
| Videos | MP4, MOV, AVI, WebM | 200 MB |

## Running via Makefile

```bash
# With Doppler secrets injection
make linkedin ARGS='post "Hello from make!"'
make linkedin ARGS='whoami'
make linkedin ARGS='status'
```

## Token Lifecycle

- Access tokens are valid for **60 days**
- The CLI caches your user URN to minimize API calls
- Use `linkedin status` to check token expiration
- Re-authenticate with `linkedin auth` when token expires

## Development

```bash
cd packages/linkedin-cli

# Install dependencies
npm install

# Run in development mode
npm run dev -- post "Test post"

# Run tests
npm test

# Lint
npm run lint

# Type check
npm run typecheck

# Build
npm run build
```
