# youtube-cli

Manage YouTube Shorts - upload, list, clone, and update videos.

## Installation

```bash
npm install -g @neonwatty/youtube-cli
```

## Setup

1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials (Web application type)
4. Add `http://localhost:3000` as authorized redirect URI
5. Download credentials as `client_secrets.json`
6. Run `youtube auth` to authenticate

## Commands

```
youtube auth                    Authenticate with YouTube
youtube upload <file>           Upload video as a Short
youtube list                    List your channel's videos
youtube update <video-id>       Update video metadata
youtube clone <video-id>        Clone video with new metadata
youtube validate <file>         Validate video for Shorts requirements
```

## Upload Options

```
--title, -t <title>       Video title (required)
--description, -d <desc>  Video description
--tags <tag1,tag2,...>    Comma-separated tags
--privacy <status>        public, private, or unlisted (default: private)
--skip-validation         Skip video validation
--force                   Upload even if validation fails
```

## List Options

```
--max, -n <number>        Maximum videos to show (default: 10)
--privacy <status>        Filter by: public, private, unlisted
--format <type>           Output format: table, json (default: table)
```

## Update Options

```
--title, -t <title>       New video title
--description, -d <desc>  New description
--tags <tag1,tag2,...>    Replace all tags
--privacy <status>        Change privacy status
```

## Clone Options

```
--title, -t <title>       Title for clone (required)
--description, -d <desc>  Description (defaults to original)
--tags <tag1,tag2,...>    Tags (defaults to original)
--privacy <status>        Privacy status (default: private)
--keep-file               Keep downloaded video file after upload
```

## Examples

First-time authentication:
```bash
youtube auth
```

Upload a Short:
```bash
youtube upload video.mp4 --title "My Short" --privacy public
```

Upload with full metadata:
```bash
youtube upload video.mp4 \
  --title "Tutorial: Quick Tips" \
  --description "Learn something new!" \
  --tags "tutorial,tips,howto" \
  --privacy public
```

List your videos:
```bash
youtube list --max 20
youtube list --format json
youtube list --privacy public
```

Update video metadata:
```bash
youtube update abc123 --title "New Title" --privacy unlisted
```

Clone a video with new title:
```bash
youtube clone abc123 --title "Cloned Video"
```

Validate before uploading:
```bash
youtube validate video.mp4
```

## Video Requirements for Shorts

- Duration: 60 seconds or less
- Aspect ratio: 9:16 (vertical)
- Resolution: 1080x1920 recommended
