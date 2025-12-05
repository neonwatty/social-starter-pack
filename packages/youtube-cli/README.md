# youtube-cli

CLI tool for managing YouTube Shorts.

## Setup

### Google Cloud Setup

1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable **YouTube Data API v3**
3. Create **OAuth 2.0 credentials** (Web application type)
4. Add `http://localhost:3000` as authorized redirect URI

### Requirements

- Node.js 18+
- `yt-dlp` (for clone command): `brew install yt-dlp`
- `ffmpeg` (for validation): `brew install ffmpeg`

## Installation

```bash
make install
```

Or manually:

```bash
npm install
npm run build
npm link
```

## Secrets Configuration

### Option A: Doppler (Recommended)

```bash
# Connect to Doppler project
make doppler-connect

# Run commands (secrets auto-injected)
make auth
make list ARGS="--max 20"
```

### Option B: Local .env File

```bash
cp .env.example .env
# Edit .env with your credentials
```

### Option C: Local client_secrets.json

Download OAuth credentials from Google Cloud Console as `client_secrets.json`.

## Commands

### `youtube auth`

Authenticate with YouTube (required before other commands).

### `youtube list [options]`

List your channel's videos.

| Option               | Description                          |
| -------------------- | ------------------------------------ |
| `--max, -n <num>`    | Max videos to show (default: 10)     |
| `--privacy <status>` | Filter: public, private, unlisted    |
| `--format <type>`    | Output: table, json (default: table) |

```bash
youtube list
youtube list --max 20 --format json
youtube list --privacy public
```

### `youtube upload <file> [options]`

Upload a video as a YouTube Short.

| Option                     | Description                                  |
| -------------------------- | -------------------------------------------- |
| `--title, -t <title>`      | Video title (required)                       |
| `--description, -d <desc>` | Video description                            |
| `--tags <t1,t2,...>`       | Comma-separated tags                         |
| `--privacy <status>`       | public, private, unlisted (default: private) |
| `--skip-validation`        | Skip Shorts requirements check               |
| `--force`                  | Upload even if validation fails              |

```bash
youtube upload video.mp4 --title "My Short"
youtube upload video.mp4 -t "Gaming Clip" -d "Epic moment" --tags gaming,clips --privacy public
```

### `youtube update <video-id> [options]`

Update metadata on an existing video.

| Option                     | Description           |
| -------------------------- | --------------------- |
| `--title, -t <title>`      | New title             |
| `--description, -d <desc>` | New description       |
| `--tags <t1,t2,...>`       | Replace tags          |
| `--privacy <status>`       | Change privacy status |

```bash
youtube update abc123 --title "New Title"
youtube update abc123 --privacy unlisted
youtube update abc123 -t "Title" -d "Description" --tags tag1,tag2
```

### `youtube clone <video-id> [options]`

Download a video and re-upload with new metadata.

| Option                     | Description                        |
| -------------------------- | ---------------------------------- |
| `--title, -t <title>`      | Title for clone (required)         |
| `--description, -d <desc>` | Description (defaults to original) |
| `--tags <t1,t2,...>`       | Tags (defaults to original)        |
| `--privacy <status>`       | Privacy (default: private)         |
| `--keep-file`              | Keep downloaded video file         |

```bash
youtube clone abc123 --title "Cloned Video"
youtube clone abc123 -t "New Version" --privacy public --keep-file
```

### `youtube validate <file>`

Check if a video meets YouTube Shorts requirements (duration, aspect ratio).

```bash
youtube validate video.mp4
```
