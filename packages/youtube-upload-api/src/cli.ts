#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { getAuthenticatedClient } from "./auth";
import { uploadVideo, VideoMetadata } from "./upload";
import { validateForShorts, checkFfprobe } from "./validate";
import { listVideos, printVideosTable, printVideosJson } from "./list";
import { updateVideo } from "./update";
import { cloneVideo, checkYtDlp } from "./clone";

interface CliArgs {
  command: string;
  file?: string;
  videoId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  privacy?: "public" | "private" | "unlisted";
  skipValidation?: boolean;
  forceUpload?: boolean;
  maxResults?: number;
  format?: "table" | "json";
  keepFile?: boolean;
}

function printUsage(): void {
  console.log(`
YouTube Shorts Upload CLI

Usage:
  yt-shorts auth                        Authenticate with YouTube
  yt-shorts upload <file> [options]     Upload a video as a Short
  yt-shorts list [options]              List your channel's videos
  yt-shorts update <video-id> [options] Update video metadata
  yt-shorts clone <video-id> [options]  Clone video with new metadata
  yt-shorts validate <file>             Validate video for Shorts
  yt-shorts help                        Show this help message

Upload Options:
  --title, -t <title>         Video title (required)
  --description, -d <desc>    Video description
  --tags <tag1,tag2,...>      Comma-separated tags
  --privacy <status>          public, private, or unlisted (default: private)
  --skip-validation           Skip video validation
  --force                     Upload even if validation fails

List Options:
  --max, -n <number>          Maximum videos to show (default: 10)
  --privacy <status>          Filter by: public, private, unlisted
  --format <type>             Output format: table, json (default: table)

Update Options:
  --title, -t <title>         New video title
  --description, -d <desc>    New description
  --tags <tag1,tag2,...>      Replace tags
  --privacy <status>          Change privacy status

Clone Options:
  --title, -t <title>         Title for clone (required)
  --description, -d <desc>    Description (defaults to original)
  --tags <tag1,tag2,...>      Tags (defaults to original)
  --privacy <status>          Privacy status (default: private)
  --keep-file                 Keep downloaded video file

Examples:
  yt-shorts auth
  yt-shorts upload video.mp4 --title "My Short" --privacy public
  yt-shorts list --max 20 --format json
  yt-shorts update abc123 --title "New Title" --privacy unlisted
  yt-shorts clone abc123 --title "Cloned Video"
  yt-shorts validate video.mp4

Setup:
  1. Create a project at https://console.cloud.google.com
  2. Enable YouTube Data API v3
  3. Create OAuth 2.0 credentials (Web application)
  4. Add http://localhost:3000 as redirect URI
  5. Download as client_secrets.json in this directory
  6. Run: yt-shorts auth
`);
}

function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = { command: args[0] || "help" };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--title" || arg === "-t") {
      result.title = args[++i];
    } else if (arg === "--description" || arg === "-d") {
      result.description = args[++i];
    } else if (arg === "--tags") {
      result.tags = args[++i]?.split(",").map((t) => t.trim());
    } else if (arg === "--privacy") {
      result.privacy = args[++i] as "public" | "private" | "unlisted";
    } else if (arg === "--skip-validation") {
      result.skipValidation = true;
    } else if (arg === "--force") {
      result.forceUpload = true;
    } else if (arg === "--max" || arg === "-n") {
      result.maxResults = parseInt(args[++i], 10);
    } else if (arg === "--format") {
      result.format = args[++i] as "table" | "json";
    } else if (arg === "--keep-file") {
      result.keepFile = true;
    } else if (!arg.startsWith("-")) {
      // First positional arg: file for upload/validate, videoId for update/clone
      if (!result.file && !result.videoId) {
        if (result.command === "update" || result.command === "clone") {
          result.videoId = arg;
        } else {
          result.file = arg;
        }
      }
    }
  }

  return result;
}

async function handleAuth(): Promise<void> {
  console.log("Starting YouTube authentication...\n");
  await getAuthenticatedClient();
  console.log("You can now upload videos!");
}

async function handleUpload(args: CliArgs): Promise<void> {
  if (!args.file) {
    console.error("Error: No video file specified");
    process.exit(1);
  }

  if (!args.title) {
    console.error("Error: Title is required (--title or -t)");
    process.exit(1);
  }

  const filePath = path.resolve(args.file);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  // Validate video unless skipped
  if (!args.skipValidation) {
    if (!checkFfprobe()) {
      console.warn("Warning: ffprobe not found. Install ffmpeg for video validation.\n");
    } else {
      const info = validateForShorts(filePath);

      if (!info.isValidShort && !args.forceUpload) {
        console.error("\nVideo does not meet Shorts requirements. Use --force to upload anyway.");
        process.exit(1);
      }
    }
  }

  // Authenticate
  console.log("\nAuthenticating...");
  const auth = await getAuthenticatedClient();

  // Upload
  const metadata: VideoMetadata = {
    title: args.title,
    description: args.description,
    tags: args.tags,
    privacyStatus: args.privacy || "private",
  };

  const result = await uploadVideo(auth, filePath, metadata);

  console.log("\n=== Upload Summary ===");
  console.log(`Title: ${result.title}`);
  console.log(`URL: ${result.url}`);
}

async function handleValidate(args: CliArgs): Promise<void> {
  if (!args.file) {
    console.error("Error: No video file specified");
    process.exit(1);
  }

  if (!checkFfprobe()) {
    console.error("Error: ffprobe not found. Install ffmpeg first.");
    console.error("  macOS: brew install ffmpeg");
    console.error("  Ubuntu: sudo apt install ffmpeg");
    process.exit(1);
  }

  const filePath = path.resolve(args.file);

  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const info = validateForShorts(filePath);

  process.exit(info.isValidShort ? 0 : 1);
}

async function handleList(args: CliArgs): Promise<void> {
  console.log("\nAuthenticating...");
  const auth = await getAuthenticatedClient();

  console.log("Fetching videos...\n");
  const result = await listVideos(auth, {
    maxResults: args.maxResults,
    privacy: args.privacy,
    format: args.format,
  });

  if (args.format === "json") {
    printVideosJson(result);
  } else {
    printVideosTable(result);
  }
}

async function handleUpdate(args: CliArgs): Promise<void> {
  if (!args.videoId) {
    console.error("Error: No video ID specified");
    console.error("Usage: yt-shorts update <video-id> [options]");
    process.exit(1);
  }

  console.log("\nAuthenticating...");
  const auth = await getAuthenticatedClient();

  const result = await updateVideo(auth, args.videoId, {
    title: args.title,
    description: args.description,
    tags: args.tags,
    privacyStatus: args.privacy,
  });

  console.log(`\nURL: ${result.url}`);
}

async function handleClone(args: CliArgs): Promise<void> {
  if (!args.videoId) {
    console.error("Error: No video ID specified");
    console.error("Usage: yt-shorts clone <video-id> --title <title>");
    process.exit(1);
  }

  if (!args.title) {
    console.error("Error: Title is required for clone (--title or -t)");
    process.exit(1);
  }

  if (!checkYtDlp()) {
    console.error("Error: yt-dlp is required for cloning videos");
    console.error("  Install with: brew install yt-dlp (macOS)");
    console.error("  Or: pip install yt-dlp");
    process.exit(1);
  }

  console.log("\nAuthenticating...");
  const auth = await getAuthenticatedClient();

  const result = await cloneVideo(auth, args.videoId, {
    title: args.title,
    description: args.description,
    tags: args.tags,
    privacyStatus: args.privacy,
    keepFile: args.keepFile,
  });

  console.log("\n=== Clone Complete ===");
  console.log(`New Video ID: ${result.videoId}`);
  console.log(`Title: ${result.title}`);
  console.log(`URL: ${result.url}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  try {
    switch (args.command) {
      case "auth":
        await handleAuth();
        break;
      case "upload":
        await handleUpload(args);
        break;
      case "list":
        await handleList(args);
        break;
      case "update":
        await handleUpdate(args);
        break;
      case "clone":
        await handleClone(args);
        break;
      case "validate":
        await handleValidate(args);
        break;
      case "help":
      default:
        printUsage();
        break;
    }
  } catch (error: any) {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  }
}

main();
