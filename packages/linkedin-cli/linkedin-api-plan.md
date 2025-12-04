# LinkedIn API CLI Implementation Plan

## Overview

Build a CLI tool similar to `yt-shorts-cli` for posting content and managing posts on LinkedIn via their Marketing API.

---

## API Access & Pricing

| Access Level                    | Cost   | Notes                                           |
| ------------------------------- | ------ | ----------------------------------------------- |
| **Standard**                    | Free   | Basic posting, requires app approval            |
| **Marketing Developer Program** | Free   | Full posting capabilities, requires application |
| **Partner Programs**            | Varies | Enhanced access, dedicated support              |

**Key Difference from X/Twitter:** LinkedIn API access is free but requires approval through their Developer Program.

### References

- [LinkedIn Developer Portal](https://developer.linkedin.com/)
- [Marketing Developer Program](https://developer.linkedin.com/product-catalog/marketing)

---

## Authentication

### OAuth 2.0 (3-Legged Flow)

LinkedIn uses standard OAuth 2.0 for user authorization.

#### Key Endpoints

| Purpose             | URL                                                 |
| ------------------- | --------------------------------------------------- |
| Authorization       | `https://www.linkedin.com/oauth/v2/authorization`   |
| Token               | `https://www.linkedin.com/oauth/v2/accessToken`     |
| Token Introspection | `https://www.linkedin.com/oauth/v2/introspectToken` |

#### Token Lifespan

- **Access Token:** 60 days
- **Refresh Tokens:** Available for some applications
- **Authorization Code:** 10 minutes (must exchange immediately)

#### Required Scopes

```
openid              # OpenID Connect
profile             # Basic profile info
w_member_social     # Post on behalf of member (REQUIRED for posting)
```

#### Additional Scopes (if needed)

```
r_emailaddress      # Read email
r_liteprofile       # Read lite profile
w_organization_social  # Post to company pages
```

### OAuth Flow Steps

1. Redirect user to LinkedIn authorization URL
2. User approves access
3. LinkedIn redirects back with authorization code
4. Exchange code for access token (within 10 minutes!)
5. Store token (valid 60 days)

### References

- [OAuth 2.0 Overview](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [3-Legged OAuth Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Setting up LinkedIn OAuth 2025](https://medium.com/@ed.sav/setting-up-linkedin-oauth-few-notes-2025-0097ac858157)

---

## Required Headers (Important!)

All LinkedIn API requests require these headers:

```
Authorization: Bearer {access_token}
LinkedIn-Version: 202411           # YYYYMM format, use latest
X-Restli-Protocol-Version: 2.0.0
Content-Type: application/json
```

**Note:** The `LinkedIn-Version` header is REQUIRED and must be updated periodically as versions are sunset.

### References

- [API Versioning](https://learn.microsoft.com/en-us/linkedin/marketing/versioning)

---

## Core API Endpoints

### Get User Info (URN)

First, you need your LinkedIn URN (user identifier):

```
GET https://api.linkedin.com/v2/userinfo
```

**Response:**

```json
{
  "sub": "abc123xyz", // This is your URN ID
  "name": "John Doe",
  "email": "john@example.com"
}
```

Your author URN will be: `urn:li:person:abc123xyz`

---

### Create Text Post

```
POST https://api.linkedin.com/rest/posts
```

**Request Body:**

```json
{
  "author": "urn:li:person:{YOUR_URN}",
  "commentary": "Your post text here!",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "lifecycleState": "PUBLISHED"
}
```

### References

- [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2025-11)

---

### Create Post with Image

#### Step 1: Initialize Image Upload

```
POST https://api.linkedin.com/rest/images?action=initializeUpload
```

**Request Body:**

```json
{
  "initializeUploadRequest": {
    "owner": "urn:li:person:{YOUR_URN}"
  }
}
```

**Response:**

```json
{
  "value": {
    "uploadUrlExpiresAt": 1234567890,
    "uploadUrl": "https://www.linkedin.com/dms-uploads/...",
    "image": "urn:li:image:C5610AQFj6TdYowm17w"
  }
}
```

#### Step 2: Upload Image Binary

```
PUT {uploadUrl from step 1}
Content-Type: image/jpeg

[binary image data]
```

#### Step 3: Create Post with Image

```
POST https://api.linkedin.com/rest/posts
```

**Request Body:**

```json
{
  "author": "urn:li:person:{YOUR_URN}",
  "commentary": "Check out this image!",
  "visibility": "PUBLIC",
  "distribution": {
    "feedDistribution": "MAIN_FEED",
    "targetEntities": [],
    "thirdPartyDistributionChannels": []
  },
  "content": {
    "media": {
      "title": "Image title",
      "id": "urn:li:image:C5610AQFj6TdYowm17w"
    }
  },
  "lifecycleState": "PUBLISHED"
}
```

### Supported Image Formats

- JPEG
- PNG

### References

- [Images API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api?view=li-lms-2025-11)
- [MultiImage API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/multiimage-post-api?view=li-lms-2025-11)

---

### Create Post with Video

Similar to images, but uses the Videos API:

```
POST https://api.linkedin.com/rest/videos?action=initializeUpload
```

Then upload video chunks and create post with video URN.

### References

- [Videos API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/videos-api?view=li-lms-2025-11)

---

## Rate Limits

| Category          | Limit                         |
| ----------------- | ----------------------------- |
| Daily API calls   | Application-specific (varies) |
| Throttle response | 429 Too Many Requests         |

**Best Practices:**

- Implement exponential backoff on 429 errors
- Cache user URN to avoid repeated lookups
- Batch operations where possible

### References

- [Rate Limiting](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits)

---

## Proposed CLI Structure

```
linkedin-cli/
├── src/
│   ├── auth.ts           # OAuth 2.0 flow
│   ├── cli.ts            # Main CLI entry point
│   ├── post.ts           # Create posts
│   ├── media.ts          # Image/video upload
│   ├── profile.ts        # Get user info/URN
│   └── index.ts          # Exports for library use
├── package.json
├── tsconfig.json
└── README.md
```

### CLI Commands

```bash
# Authentication
linkedin-cli auth                    # OAuth flow, save tokens

# Profile
linkedin-cli whoami                  # Show current user info

# Posting
linkedin-cli post "Hello LinkedIn!"  # Simple text post
linkedin-cli post "Check this" --image photo.jpg
linkedin-cli post "My video" --video clip.mp4

# Visibility options
linkedin-cli post "Public post" --visibility public
linkedin-cli post "Connections only" --visibility connections

# Management
linkedin-cli delete <post-id>        # Delete a post
```

---

## Implementation Steps

### Phase 1: Core Authentication

1. Set up OAuth 2.0 3-legged flow
2. Token storage (60-day tokens)
3. Token refresh/re-auth flow
4. Get and cache user URN

### Phase 2: Basic Posting

1. Text-only posts
2. Visibility options (public/connections)
3. Delete posts

### Phase 3: Media Support

1. Image upload flow
2. Video upload flow
3. Multi-image posts

### Phase 4: CLI Polish

1. Nice output formatting
2. Error handling
3. Rate limit awareness

---

## Dependencies

```json
{
  "dependencies": {
    "axios": "^1.x", // HTTP client
    "open": "^10.x" // Open browser for auth
  }
}
```

**Note:** Unlike X/Twitter, there's no popular LinkedIn SDK, so we'll use raw HTTP requests.

---

## Developer Portal Setup

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Click "Create App"
3. Fill in app details and verify with a LinkedIn Page
4. Go to **Products** tab
5. Request access to:
   - "Share on LinkedIn"
   - "Sign In with LinkedIn using OpenID Connect"
6. Go to **Auth** tab and copy:
   - Client ID
   - Client Secret
7. Add OAuth 2.0 redirect URL: `http://localhost:3000/callback`

### References

- [LinkedIn Developer Portal](https://developer.linkedin.com/)
- [App Settings Guide](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow#step-1-configure-your-application)

---

## Token Management

### Important Considerations

1. **60-day expiry:** Tokens last 60 days, need re-auth after
2. **No auto-refresh for most apps:** Manual re-authentication needed
3. **Token generator tool:** LinkedIn provides a [token generator](https://www.linkedin.com/developers/tools/oauth/token-generator) for testing

### Storage Recommendation

```json
{
  "access_token": "AQV...",
  "expires_at": 1234567890,
  "user_urn": "urn:li:person:abc123"
}
```

---

## Key Limitations

1. **Approval required** - Must apply for Marketing Developer Program
2. **60-day tokens** - No long-lived tokens without partner status
3. **Version headers required** - API versioning adds complexity
4. **No scheduling API** - Must build your own scheduler
5. **Company pages need separate scope** - `w_organization_social`
6. **Rate limits are opaque** - Not well documented

---

## Visibility Options

| Value         | Description                           |
| ------------- | ------------------------------------- |
| `PUBLIC`      | Visible to everyone                   |
| `CONNECTIONS` | Visible to connections only           |
| `LOGGED_IN`   | Visible to logged-in LinkedIn members |

---

## Error Handling

Common errors to handle:

| Status | Meaning               | Action               |
| ------ | --------------------- | -------------------- |
| 401    | Token expired/invalid | Re-authenticate      |
| 403    | Missing permissions   | Check scopes         |
| 429    | Rate limited          | Exponential backoff  |
| 422    | Invalid request       | Check payload format |

---

## Official Documentation Links

- [LinkedIn Marketing API Overview](https://learn.microsoft.com/en-us/linkedin/marketing/)
- [Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api)
- [Images API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/images-api)
- [Videos API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/videos-api)
- [Authentication Guide](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication)
- [3-Legged OAuth Flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [Rate Limits](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/concepts/rate-limits)
- [Developer Portal](https://developer.linkedin.com/)
- [Token Generator Tool](https://www.linkedin.com/developers/tools/oauth/token-generator)

---

## Comparison: X/Twitter vs LinkedIn

| Aspect         | X/Twitter            | LinkedIn              |
| -------------- | -------------------- | --------------------- |
| Cost           | $0-$5000/mo          | Free (with approval)  |
| Token lifespan | 2 hours (+ refresh)  | 60 days               |
| SDK available  | Yes (twitter-api-v2) | No official SDK       |
| Media upload   | Separate v1.1 API    | Integrated in v2      |
| Rate limits    | Well documented      | Opaque                |
| Approval       | Instant              | Requires review       |
| API versioning | Simple               | Header-based versions |
