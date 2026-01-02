# Cloudinary Integration

Upload and manage media assets for social posts via the MCP server.

## Overview

Cloudinary integration is built directly into the social-tools MCP server. It allows you to:
- Upload images and videos to Cloudinary
- List and search assets
- Generate URLs with transformations (resize, crop, format conversion)
- Delete assets

This is useful for managing media that will be used in social posts across Twitter, LinkedIn, and other platforms.

## Setup

### 1. Create Cloudinary Account

Sign up at [cloudinary.com](https://cloudinary.com) (free tier available).

### 2. Get API Credentials

From the Cloudinary Console, get:
- **Cloud Name** - Your account identifier
- **API Key** - Public key
- **API Secret** - Private key (keep secure)

### 3. Configure Credentials

Add to Doppler (`social-starter-pack` project):
```bash
doppler secrets set \
  CLOUDINARY_CLOUD_NAME=your_cloud_name \
  CLOUDINARY_API_KEY=your_api_key \
  CLOUDINARY_API_SECRET=your_api_secret \
  --project social-starter-pack \
  --config dev
```

Or add to `.env`:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## MCP Tools

### cloudinary_upload

Upload an image or video to Cloudinary.

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `file` | Yes | Path to local file or URL to upload |
| `folder` | No | Folder to organize assets |
| `publicId` | No | Custom public ID (filename) |
| `tags` | No | Comma-separated tags for organization |
| `resourceType` | No | `image`, `video`, `raw`, or `auto` (default: auto) |

**Example via Claude Code:**
```
Upload the image at /path/to/screenshot.png to Cloudinary in the "social" folder
```

### cloudinary_list

List assets in your Cloudinary account.

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `resourceType` | No | `image`, `video`, or `raw` (default: image) |
| `maxResults` | No | Max results to return (default: 10) |
| `prefix` | No | Filter by public ID prefix |
| `tags` | No | Include tags in response |

**Example:**
```
List my recent Cloudinary images
```

### cloudinary_search

Search assets using expressions.

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `expression` | Yes | Search expression (e.g., `tags=product`, `folder=social`) |
| `maxResults` | No | Max results (default: 10) |
| `sortBy` | No | Field to sort by (`created_at`, `public_id`) |
| `sortOrder` | No | `asc` or `desc` |

**Example:**
```
Search Cloudinary for assets tagged "twitter"
```

### cloudinary_delete

Delete an asset from Cloudinary.

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `publicId` | Yes | Public ID of the asset to delete |
| `resourceType` | No | `image`, `video`, or `raw` (default: image) |

**Example:**
```
Delete the Cloudinary image with public ID "old-screenshot"
```

### cloudinary_url

Generate a Cloudinary URL with transformations.

**Parameters:**
| Parameter | Required | Description |
|-----------|----------|-------------|
| `publicId` | Yes | Public ID of the asset |
| `resourceType` | No | `image` or `video` (default: image) |
| `transformation` | No | Transformation string (e.g., `w_300,h_200,c_fill`) |
| `format` | No | Output format (`jpg`, `png`, `webp`) |

**Example:**
```
Generate a 300x300 thumbnail URL for the image "my-photo"
```

## Common Transformations

| Transformation | Description |
|----------------|-------------|
| `w_300` | Width 300px |
| `h_200` | Height 200px |
| `c_fill` | Crop to fill dimensions |
| `c_fit` | Fit within dimensions |
| `c_thumb` | Generate thumbnail |
| `f_auto` | Auto-select best format |
| `q_auto` | Auto-select quality |

Combine with commas: `w_300,h_300,c_fill,f_auto,q_auto`

## Workflow Example

1. **Upload asset:**
   ```
   Upload screenshot.png to Cloudinary with tags "twitter,product"
   ```

2. **Generate optimized URL:**
   ```
   Generate a Twitter-optimized URL (1200x675) for "screenshot"
   ```

3. **Use in post:**
   ```
   Post to Twitter: "Check out our new feature!" with the Cloudinary image URL
   ```

## Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Transformation Reference](https://cloudinary.com/documentation/transformation_reference)
- [Free Tier Limits](https://cloudinary.com/pricing) - 25 credits/month
