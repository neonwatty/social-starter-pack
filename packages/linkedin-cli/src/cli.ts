#!/usr/bin/env node

import { authenticate, clearAuth, getTokenStatus } from "./auth.js";
import { getUserInfo } from "./profile.js";
import { createPost, deletePost, type Visibility } from "./post.js";
import path from "path";

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: "",
    positional: [],
    flags: {},
  };

  let i = 0;

  // First arg is the command
  if (args.length > 0 && !args[0].startsWith("-")) {
    result.command = args[0];
    i = 1;
  }

  while (i < args.length) {
    const arg = args[i];

    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith("-")) {
        result.flags[key] = nextArg;
        i += 2;
      } else {
        result.flags[key] = true;
        i += 1;
      }
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith("-")) {
        result.flags[key] = nextArg;
        i += 2;
      } else {
        result.flags[key] = true;
        i += 1;
      }
    } else {
      result.positional.push(arg);
      i += 1;
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
LinkedIn CLI - Post and manage content on LinkedIn

USAGE:
  linkedin-cli <command> [options]

COMMANDS:
  auth                    Authenticate with LinkedIn
  whoami                  Show current user info
  post <text>             Create a new post
  delete <post-id>        Delete a post
  status                  Show token status
  logout                  Clear saved tokens
  help                    Show this help message

AUTH OPTIONS:
  --client-id <id>        LinkedIn app client ID
  --client-secret <s>     LinkedIn app client secret

POST OPTIONS:
  --image <path>          Attach an image (JPEG or PNG)
  --video <path>          Attach a video (MP4, MOV, AVI, WebM)
  --visibility <v>        Post visibility: public, connections, logged_in
                          (default: public)
  --image-title <title>   Title for the image
  --video-title <title>   Title for the video

EXAMPLES:
  # First time setup
  linkedin-cli auth --client-id YOUR_ID --client-secret YOUR_SECRET

  # Create posts
  linkedin-cli post "Hello LinkedIn!"
  linkedin-cli post "Check this out" --image photo.jpg
  linkedin-cli post "My video" --video clip.mp4
  linkedin-cli post "For my network" --visibility connections

  # Manage
  linkedin-cli whoami
  linkedin-cli status
  linkedin-cli delete 1234567890
  linkedin-cli logout
`);
}

async function handleAuth(args: ParsedArgs): Promise<void> {
  const clientId = args.flags["client-id"] as string | undefined;
  const clientSecret = args.flags["client-secret"] as string | undefined;

  try {
    await authenticate(clientId, clientSecret);
  } catch (error) {
    console.error(
      "Authentication failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

async function handleWhoami(): Promise<void> {
  try {
    const profile = await getUserInfo();
    console.log("\nLinkedIn Profile:");
    console.log(`  Name:  ${profile.name}`);
    console.log(`  ID:    ${profile.id}`);
    console.log(`  URN:   ${profile.urn}`);
    if (profile.email) {
      console.log(`  Email: ${profile.email}`);
    }
    console.log("");
  } catch (error) {
    console.error(
      "Failed to get profile:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

async function handlePost(args: ParsedArgs): Promise<void> {
  const text = args.positional[0];

  if (!text) {
    console.error("Error: Post text is required.");
    console.error('Usage: linkedin-cli post "Your post text"');
    process.exit(1);
  }

  const imagePath = args.flags["image"] as string | undefined;
  const videoPath = args.flags["video"] as string | undefined;
  const imageTitle = args.flags["image-title"] as string | undefined;
  const videoTitle = args.flags["video-title"] as string | undefined;

  let visibility: Visibility = "PUBLIC";
  const visibilityArg = args.flags["visibility"] as string | undefined;
  if (visibilityArg) {
    const v = visibilityArg.toUpperCase().replace("-", "_");
    if (["PUBLIC", "CONNECTIONS", "LOGGED_IN"].includes(v)) {
      visibility = v as Visibility;
    } else {
      console.error(
        "Error: Invalid visibility. Use: public, connections, or logged_in",
      );
      process.exit(1);
    }
  }

  // Resolve paths to absolute
  const resolvedImagePath = imagePath ? path.resolve(imagePath) : undefined;
  const resolvedVideoPath = videoPath ? path.resolve(videoPath) : undefined;

  if (resolvedImagePath && resolvedVideoPath) {
    console.error("Error: Cannot attach both image and video. Choose one.");
    process.exit(1);
  }

  try {
    const result = await createPost({
      text,
      visibility,
      imagePath: resolvedImagePath,
      videoPath: resolvedVideoPath,
      imageTitle,
      videoTitle,
    });

    console.log(`\nPost ID: ${result.id}`);
    console.log(`URN: ${result.urn}`);
    console.log(
      `\nView at: https://www.linkedin.com/feed/update/${result.urn}`,
    );
    console.log("");
  } catch (error) {
    console.error(
      "Failed to create post:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

async function handleDelete(args: ParsedArgs): Promise<void> {
  const postId = args.positional[0];

  if (!postId) {
    console.error("Error: Post ID is required.");
    console.error("Usage: linkedin-cli delete <post-id>");
    process.exit(1);
  }

  try {
    await deletePost(postId);
  } catch (error) {
    console.error(
      "Failed to delete post:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

function handleStatus(): void {
  const status = getTokenStatus();

  console.log("\nToken Status:");
  if (status.valid) {
    console.log(`  Status:   Valid`);
    console.log(`  Expires:  ${status.expiresAt?.toLocaleString()}`);
    console.log(`  Days left: ${status.daysRemaining}`);
  } else {
    console.log(`  Status:   Invalid or expired`);
    console.log(`  Run 'linkedin-cli auth' to authenticate.`);
  }
  console.log("");
}

function handleLogout(): void {
  clearAuth();
  console.log("Logged out successfully.");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (
    args.command === "" ||
    args.command === "help" ||
    args.flags["help"] ||
    args.flags["h"]
  ) {
    printHelp();
    return;
  }

  switch (args.command) {
    case "auth":
      await handleAuth(args);
      break;

    case "whoami":
      await handleWhoami();
      break;

    case "post":
      await handlePost(args);
      break;

    case "delete":
      await handleDelete(args);
      break;

    case "status":
      handleStatus();
      break;

    case "logout":
      handleLogout();
      break;

    default:
      console.error(`Unknown command: ${args.command}`);
      console.error("Run 'linkedin-cli help' for usage.");
      process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
