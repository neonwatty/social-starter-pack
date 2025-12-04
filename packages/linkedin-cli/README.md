# linkedin-cli

CLI tool for posting content and managing posts on LinkedIn via their Marketing API.

## Prerequisites

1. Create a LinkedIn Developer App at [developer.linkedin.com](https://developer.linkedin.com/)
2. Go to **Products** tab and request access to:
   - "Share on LinkedIn"
   - "Sign In with LinkedIn using OpenID Connect"
3. Go to **Auth** tab and:
   - Copy your Client ID and Client Secret
   - Add redirect URL: `http://localhost:3000/callback`

## Installation

```bash
npm install
npm run build
npm link  # Optional: makes linkedin-cli available globally
```

## Usage

### Authentication

First time setup:

```bash
linkedin-cli auth --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
```

This opens your browser for LinkedIn authorization. After approval, your token is saved locally (valid for 60 days).

### Check Status

```bash
# Show current user
linkedin-cli whoami

# Check token status
linkedin-cli status
```

### Create Posts

```bash
# Text post
linkedin-cli post "Hello LinkedIn!"

# Post with image
linkedin-cli post "Check out this photo" --image photo.jpg

# Post with video
linkedin-cli post "Watch this" --video clip.mp4

# Connections only
linkedin-cli post "For my network" --visibility connections
```

### Delete Posts

```bash
linkedin-cli delete <post-id>
```

### Logout

```bash
linkedin-cli logout
```

## CLI Options

```
COMMANDS:
  auth                    Authenticate with LinkedIn
  whoami                  Show current user info
  post <text>             Create a new post
  delete <post-id>        Delete a post
  status                  Show token status
  logout                  Clear saved tokens
  help                    Show help

POST OPTIONS:
  --image <path>          Attach an image (JPEG or PNG)
  --video <path>          Attach a video (MP4, MOV, AVI, WebM)
  --visibility <v>        public, connections, or logged_in (default: public)
  --image-title <title>   Title for the image
  --video-title <title>   Title for the video
```

## Programmatic Usage

```typescript
import { authenticate, createPost, getUserInfo } from "linkedin-cli";

// Authenticate (if not already)
await authenticate("client-id", "client-secret");

// Get user info
const profile = await getUserInfo();
console.log(profile.name, profile.urn);

// Create a text post
const post = await createPost({
  text: "Hello from the API!",
  visibility: "PUBLIC",
});
console.log(post.urn);

// Create post with image
const imagePost = await createPost({
  text: "Check this out!",
  imagePath: "/path/to/image.jpg",
});
```

## Token Storage

Credentials and tokens are stored in `~/.linkedin-cli/`:

- `credentials.json` - Client ID/Secret
- `tokens.json` - Access token and expiry

Tokens are valid for 60 days. Run `linkedin-cli auth` to re-authenticate when expired.

## Rate Limits

LinkedIn rate limits are application-specific. The CLI implements:

- Automatic error handling for 429 responses
- Cached user URN to minimize API calls

## Supported Media

**Images:** JPEG, PNG

**Videos:** MP4, MOV, AVI, WebM

## License

MIT
