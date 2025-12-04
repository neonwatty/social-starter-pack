#!/usr/bin/env node

import { Command } from "commander";
import * as path from "path";
import {
  saveCredentials,
  loadCredentials,
  clearCredentials,
  verifyCredentials,
} from "./auth";
import { createTweet, deleteTweet, replyToTweet, createThread } from "./tweet";
import { uploadMedia } from "./media";
import { getMyTimeline, getCurrentUser, getTweet } from "./timeline";
import { OAuth1Credentials } from "./oauth1";

const program = new Command();

program
  .name("twitter")
  .description("CLI tool for posting tweets and managing content on X/Twitter")
  .version("1.0.0");

// Auth command
program
  .command("auth")
  .description("Authenticate with X/Twitter using OAuth 1.0a credentials")
  .option("--api-key <key>", "X API Key (Consumer Key)")
  .option("--api-secret <secret>", "X API Secret (Consumer Secret)")
  .option("--access-token <token>", "Access Token")
  .option("--access-token-secret <secret>", "Access Token Secret")
  .action(async (options) => {
    try {
      const existingCreds = loadCredentials();

      const credentials: OAuth1Credentials = {
        apiKey:
          options.apiKey ||
          existingCreds?.apiKey ||
          process.env.X_API_KEY ||
          "",
        apiSecret:
          options.apiSecret ||
          existingCreds?.apiSecret ||
          process.env.X_API_KEY_SECRET ||
          process.env.X_API_SECRET ||
          "",
        accessToken:
          options.accessToken ||
          existingCreds?.accessToken ||
          process.env.X_ACCESS_TOKEN ||
          "",
        accessTokenSecret:
          options.accessTokenSecret ||
          existingCreds?.accessTokenSecret ||
          process.env.X_ACCESS_TOKEN_SECRET ||
          "",
      };

      if (
        !credentials.apiKey ||
        !credentials.apiSecret ||
        !credentials.accessToken ||
        !credentials.accessTokenSecret
      ) {
        console.error("Error: All four credentials are required.");
        console.error("\nProvide them via CLI options:");
        console.error("  twitter auth \\");
        console.error("    --api-key YOUR_API_KEY \\");
        console.error("    --api-secret YOUR_API_SECRET \\");
        console.error("    --access-token YOUR_ACCESS_TOKEN \\");
        console.error("    --access-token-secret YOUR_ACCESS_TOKEN_SECRET");
        console.error("\nOr environment variables:");
        console.error(
          "  X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET",
        );
        process.exit(1);
      }

      console.log("Verifying credentials...");
      const isValid = await verifyCredentials(credentials);

      if (!isValid) {
        console.error(
          "Error: Invalid credentials. Please check your API keys and tokens.",
        );
        process.exit(1);
      }

      saveCredentials(credentials);
      console.log("Authentication successful! Credentials saved.");

      // Show user info
      const user = await getCurrentUser();
      console.log(`\nLogged in as @${user.username} (${user.name})`);
    } catch (error) {
      console.error(
        "Authentication failed:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Logout command
program
  .command("logout")
  .description("Remove saved credentials")
  .action(() => {
    clearCredentials();
    console.log("Logged out successfully. Credentials removed.");
  });

// Post command
program
  .command("post")
  .description("Post a tweet")
  .argument("<text>", "Tweet text")
  .option("-i, --image <path>", "Attach an image")
  .option("-v, --video <path>", "Attach a video")
  .option("-m, --media <paths...>", "Attach multiple media files")
  .action(async (text, options) => {
    try {
      const mediaPaths: string[] = [];

      if (options.image) {
        mediaPaths.push(path.resolve(options.image));
      }
      if (options.video) {
        mediaPaths.push(path.resolve(options.video));
      }
      if (options.media) {
        mediaPaths.push(...options.media.map((p: string) => path.resolve(p)));
      }

      const mediaIds: string[] = [];

      if (mediaPaths.length > 0) {
        console.log("Uploading media...");
        for (const mediaPath of mediaPaths) {
          const mediaId = await uploadMedia(mediaPath, (percent, stage) => {
            process.stdout.write(`\r${stage}: ${percent}%`);
          });
          console.log(""); // New line after progress
          mediaIds.push(mediaId);
        }
      }

      const response = await createTweet({
        text,
        mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
      });

      console.log("Tweet posted successfully!");
      console.log(`ID: ${response.data.id}`);
      console.log(`URL: https://x.com/i/status/${response.data.id}`);
    } catch (error) {
      console.error(
        "Failed to post tweet:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Reply command
program
  .command("reply")
  .description("Reply to a tweet")
  .argument("<tweet-id>", "Tweet ID to reply to")
  .argument("<text>", "Reply text")
  .option("-i, --image <path>", "Attach an image")
  .option("-v, --video <path>", "Attach a video")
  .action(async (tweetId, text, options) => {
    try {
      let mediaIds: string[] | undefined;

      if (options.image || options.video) {
        const mediaPath = path.resolve(options.image || options.video);
        console.log("Uploading media...");
        const mediaId = await uploadMedia(mediaPath, (percent, stage) => {
          process.stdout.write(`\r${stage}: ${percent}%`);
        });
        console.log("");
        mediaIds = [mediaId];
      }

      const response = await replyToTweet(tweetId, text, mediaIds);

      console.log("Reply posted successfully!");
      console.log(`ID: ${response.data.id}`);
      console.log(`URL: https://x.com/i/status/${response.data.id}`);
    } catch (error) {
      console.error(
        "Failed to post reply:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Thread command
program
  .command("thread")
  .description("Post a thread of tweets")
  .argument("<tweets...>", "Tweets to post (each argument is a separate tweet)")
  .action(async (tweets) => {
    try {
      console.log(`Posting thread with ${tweets.length} tweets...`);
      const responses = await createThread(tweets);

      console.log("Thread posted successfully!");
      responses.forEach((response, index) => {
        console.log(`\nTweet ${index + 1}:`);
        console.log(`  ID: ${response.data.id}`);
        console.log(`  URL: https://x.com/i/status/${response.data.id}`);
      });
    } catch (error) {
      console.error(
        "Failed to post thread:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Delete command
program
  .command("delete")
  .description("Delete a tweet")
  .argument("<tweet-id>", "Tweet ID to delete")
  .action(async (tweetId) => {
    try {
      const response = await deleteTweet(tweetId);

      if (response.data.deleted) {
        console.log("Tweet deleted successfully!");
      } else {
        console.log("Tweet was not deleted.");
      }
    } catch (error) {
      console.error(
        "Failed to delete tweet:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Timeline command
program
  .command("timeline")
  .description("View your recent tweets")
  .option("-l, --limit <number>", "Number of tweets to show", "10")
  .option("--no-replies", "Exclude replies")
  .option("--no-retweets", "Exclude retweets")
  .action(async (options) => {
    try {
      const user = await getCurrentUser();
      console.log(`@${user.username}'s recent tweets:\n`);

      const timeline = await getMyTimeline({
        limit: parseInt(options.limit),
        excludeReplies: !options.replies,
        excludeRetweets: !options.retweets,
      });

      if (!timeline.data || timeline.data.length === 0) {
        console.log("No tweets found.");
        return;
      }

      timeline.data.forEach((tweet) => {
        console.log(`---`);
        console.log(`ID: ${tweet.id}`);
        if (tweet.created_at) {
          console.log(`Date: ${new Date(tweet.created_at).toLocaleString()}`);
        }
        console.log(`\n${tweet.text}\n`);
        if (tweet.public_metrics) {
          const m = tweet.public_metrics;
          console.log(
            `Likes: ${m.like_count} | Retweets: ${m.retweet_count} | Replies: ${m.reply_count}`,
          );
        }
        console.log("");
      });
    } catch (error) {
      console.error(
        "Failed to get timeline:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// View tweet command
program
  .command("view")
  .description("View a specific tweet")
  .argument("<tweet-id>", "Tweet ID to view")
  .action(async (tweetId) => {
    try {
      const tweet = await getTweet(tweetId);

      console.log(`Tweet ${tweet.id}:`);
      if (tweet.created_at) {
        console.log(`Date: ${new Date(tweet.created_at).toLocaleString()}`);
      }
      console.log(`\n${tweet.text}\n`);
      if (tweet.public_metrics) {
        const m = tweet.public_metrics;
        console.log(
          `Likes: ${m.like_count} | Retweets: ${m.retweet_count} | Replies: ${m.reply_count}`,
        );
      }
      console.log(`\nURL: https://x.com/i/status/${tweet.id}`);
    } catch (error) {
      console.error(
        "Failed to get tweet:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

// Me command
program
  .command("me")
  .description("Show current authenticated user")
  .action(async () => {
    try {
      const user = await getCurrentUser();
      console.log("Authenticated as:");
      console.log(`  Name: ${user.name}`);
      console.log(`  Username: @${user.username}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Profile: https://x.com/${user.username}`);
    } catch (error) {
      console.error(
        "Failed to get user info:",
        error instanceof Error ? error.message : error,
      );
      process.exit(1);
    }
  });

program.parse();
