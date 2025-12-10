#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";

// Tool definitions - kept minimal for low context overhead
const tools: Tool[] = [
  // Autocomplete tools
  {
    name: "autocomplete",
    description: "Get search autocomplete suggestions from various engines",
    inputSchema: {
      type: "object",
      properties: {
        engine: {
          type: "string",
          enum: ["google", "youtube", "bing", "amazon", "duckduckgo"],
          description: "Search engine to query",
        },
        query: { type: "string", description: "Search query" },
        expand: { type: "boolean", description: "Expand with a-z suffixes" },
        questions: { type: "boolean", description: "Expand with question words" },
        commercial: { type: "boolean", description: "Expand with buying intent modifiers" },
        problems: { type: "boolean", description: "Expand with problem/pain point modifiers" },
        format: { type: "string", enum: ["text", "json", "csv"] },
      },
      required: ["engine", "query"],
    },
  },

  // YouTube tools
  {
    name: "youtube_auth",
    description: "Authenticate with YouTube (opens browser)",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "youtube_upload",
    description: "Upload a video to YouTube",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "Path to video file" },
        title: { type: "string", description: "Video title" },
        description: { type: "string", description: "Video description" },
        tags: { type: "string", description: "Comma-separated tags" },
        privacy: { type: "string", enum: ["public", "private", "unlisted"] },
      },
      required: ["file", "title"],
    },
  },
  {
    name: "youtube_list",
    description: "List your YouTube videos",
    inputSchema: {
      type: "object",
      properties: {
        max: { type: "number", description: "Max videos to show" },
        privacy: { type: "string", enum: ["public", "private", "unlisted"] },
        format: { type: "string", enum: ["table", "json"] },
      },
    },
  },
  {
    name: "youtube_update",
    description: "Update a YouTube video's metadata",
    inputSchema: {
      type: "object",
      properties: {
        videoId: { type: "string", description: "Video ID" },
        title: { type: "string" },
        description: { type: "string" },
        tags: { type: "string" },
        privacy: { type: "string", enum: ["public", "private", "unlisted"] },
      },
      required: ["videoId"],
    },
  },

  // Twitter tools
  {
    name: "twitter_auth",
    description: "Authenticate with Twitter/X (opens browser)",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "twitter_post",
    description: "Post a tweet",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Tweet text" },
        image: { type: "string", description: "Path to image" },
        video: { type: "string", description: "Path to video" },
      },
      required: ["text"],
    },
  },
  {
    name: "twitter_thread",
    description: "Post a thread of tweets",
    inputSchema: {
      type: "object",
      properties: {
        tweets: {
          type: "array",
          items: { type: "string" },
          description: "Array of tweet texts",
        },
      },
      required: ["tweets"],
    },
  },
  {
    name: "twitter_timeline",
    description: "View recent tweets from your timeline",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        noReplies: { type: "boolean" },
        noRetweets: { type: "boolean" },
      },
    },
  },
  {
    name: "twitter_me",
    description: "Show current authenticated Twitter user",
    inputSchema: { type: "object", properties: {} },
  },

  // LinkedIn tools
  {
    name: "linkedin_auth",
    description: "Authenticate with LinkedIn (opens browser)",
    inputSchema: {
      type: "object",
      properties: {
        clientId: { type: "string" },
        clientSecret: { type: "string" },
      },
    },
  },
  {
    name: "linkedin_post",
    description: "Post an update to LinkedIn",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Post text" },
        image: { type: "string", description: "Path to image" },
        video: { type: "string", description: "Path to video" },
        visibility: { type: "string", enum: ["public", "connections", "logged_in"] },
      },
      required: ["text"],
    },
  },
  {
    name: "linkedin_whoami",
    description: "Show current LinkedIn user info",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "linkedin_status",
    description: "Check LinkedIn token status",
    inputSchema: { type: "object", properties: {} },
  },

  // Demo recorder tools
  {
    name: "demo_record",
    description: "Record a demo video from a demo definition file",
    inputSchema: {
      type: "object",
      properties: {
        demoFile: { type: "string", description: "Path to demo .ts file" },
        output: { type: "string", description: "Output directory" },
        headed: { type: "boolean", description: "Run browser visibly" },
      },
      required: ["demoFile"],
    },
  },
  {
    name: "demo_screenshot",
    description: "Capture screenshots from a demo definition",
    inputSchema: {
      type: "object",
      properties: {
        demoFile: { type: "string", description: "Path to demo .ts file" },
        output: { type: "string", description: "Output directory" },
        format: { type: "string", enum: ["png", "jpeg", "webp"] },
        fullPage: { type: "boolean" },
        headed: { type: "boolean" },
      },
      required: ["demoFile"],
    },
  },
  {
    name: "demo_gif",
    description: "Convert a video to GIF",
    inputSchema: {
      type: "object",
      properties: {
        videoFile: { type: "string", description: "Path to video file" },
        output: { type: "string", description: "Output GIF path" },
        fps: { type: "number" },
        width: { type: "number" },
      },
      required: ["videoFile"],
    },
  },
  {
    name: "demo_thumbnail",
    description: "Extract a thumbnail from a video",
    inputSchema: {
      type: "object",
      properties: {
        videoFile: { type: "string", description: "Path to video file" },
        output: { type: "string" },
        time: { type: "number", description: "Timestamp in seconds" },
        format: { type: "string", enum: ["png", "jpeg", "webp"] },
      },
      required: ["videoFile"],
    },
  },

  // Reddit tools
  {
    name: "reddit_search",
    description: "Search Reddit for posts matching keywords",
    inputSchema: {
      type: "object",
      properties: {
        subreddits: { type: "string", description: "Subreddits joined with + (e.g., startups+SaaS)" },
        keywords: { type: "string", description: "Comma-separated keywords" },
        time: { type: "string", enum: ["hour", "day", "week", "month", "year", "all"] },
        sort: { type: "string", enum: ["relevance", "hot", "top", "new", "comments"] },
        limit: { type: "number" },
        json: { type: "boolean" },
      },
      required: ["subreddits", "keywords"],
    },
  },

  // Google Forms tools
  {
    name: "gforms_auth",
    description: "Authenticate with Google Forms (opens browser)",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "boolean", description: "Check auth status instead of authenticating" },
        logout: { type: "boolean", description: "Clear stored credentials" },
      },
    },
  },
  {
    name: "gforms_create",
    description: "Create a new Google Form",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Form title" },
        description: { type: "string", description: "Form description" },
        json: { type: "boolean", description: "Output as JSON" },
      },
      required: ["title"],
    },
  },
  {
    name: "gforms_list",
    description: "List all Google Forms",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max forms to show" },
        json: { type: "boolean" },
      },
    },
  },
  {
    name: "gforms_get",
    description: "Get details of a Google Form",
    inputSchema: {
      type: "object",
      properties: {
        formId: { type: "string", description: "Form ID" },
        includeQuestions: { type: "boolean", description: "Include question list" },
        json: { type: "boolean" },
      },
      required: ["formId"],
    },
  },
  {
    name: "gforms_update",
    description: "Update a Google Form's metadata",
    inputSchema: {
      type: "object",
      properties: {
        formId: { type: "string", description: "Form ID" },
        title: { type: "string", description: "New title" },
        description: { type: "string", description: "New description" },
      },
      required: ["formId"],
    },
  },
  {
    name: "gforms_delete",
    description: "Delete a Google Form",
    inputSchema: {
      type: "object",
      properties: {
        formId: { type: "string", description: "Form ID" },
        confirm: { type: "boolean", description: "Skip confirmation" },
      },
      required: ["formId"],
    },
  },
  {
    name: "gforms_add_question",
    description: "Add a question to a Google Form",
    inputSchema: {
      type: "object",
      properties: {
        formId: { type: "string", description: "Form ID" },
        type: {
          type: "string",
          enum: ["short-answer", "paragraph", "multiple-choice", "checkbox", "dropdown", "linear-scale", "date", "time"],
          description: "Question type",
        },
        title: { type: "string", description: "Question title" },
        description: { type: "string", description: "Helper text" },
        required: { type: "boolean", description: "Make question required" },
        options: { type: "string", description: "Comma-separated options (for choice types)" },
        low: { type: "number", description: "Scale low value" },
        high: { type: "number", description: "Scale high value" },
        lowLabel: { type: "string", description: "Scale low label" },
        highLabel: { type: "string", description: "Scale high label" },
      },
      required: ["formId", "type", "title"],
    },
  },
  {
    name: "gforms_responses",
    description: "Get responses from a Google Form",
    inputSchema: {
      type: "object",
      properties: {
        formId: { type: "string", description: "Form ID" },
        format: { type: "string", enum: ["json", "csv", "table"] },
        count: { type: "boolean", description: "Show only response count" },
        limit: { type: "number" },
        after: { type: "string", description: "Filter by date (YYYY-MM-DD)" },
      },
      required: ["formId"],
    },
  },
  {
    name: "gforms_export",
    description: "Export form structure as template",
    inputSchema: {
      type: "object",
      properties: {
        formId: { type: "string", description: "Form ID" },
        format: { type: "string", enum: ["json", "yaml"] },
      },
      required: ["formId"],
    },
  },
  {
    name: "gforms_import",
    description: "Create form from template file",
    inputSchema: {
      type: "object",
      properties: {
        file: { type: "string", description: "Path to template file (JSON or YAML)" },
        title: { type: "string", description: "Override template title" },
      },
      required: ["file"],
    },
  },
];

// Execute CLI command and return output
async function runCommand(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, {
      env: { ...process.env },
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout || stderr);
      } else {
        reject(new Error(stderr || stdout || `Command failed with code ${code}`));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

// Build CLI arguments from tool input
function buildArgs(args: Record<string, unknown>): string[] {
  const result: string[] = [];
  for (const [key, value] of Object.entries(args)) {
    if (value === undefined || value === null || value === false) continue;
    if (value === true) {
      result.push(`--${camelToKebab(key)}`);
    } else if (Array.isArray(value)) {
      result.push(...value.map(String));
    } else {
      result.push(`--${camelToKebab(key)}`, String(value));
    }
  }
  return result;
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

// Handle tool calls
async function handleToolCall(
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    switch (name) {
      // Autocomplete
      case "autocomplete": {
        const { engine, query, ...opts } = args;
        const cliArgs = [engine as string, query as string, ...buildArgs(opts)];
        return await runCommand("autocomplete", cliArgs);
      }

      // YouTube
      case "youtube_auth":
        return await runCommand("youtube", ["auth"]);
      case "youtube_upload": {
        const { file, ...opts } = args;
        return await runCommand("youtube", ["upload", file as string, ...buildArgs(opts)]);
      }
      case "youtube_list":
        return await runCommand("youtube", ["list", ...buildArgs(args)]);
      case "youtube_update": {
        const { videoId, ...opts } = args;
        return await runCommand("youtube", ["update", videoId as string, ...buildArgs(opts)]);
      }

      // Twitter
      case "twitter_auth":
        return await runCommand("twitter", ["auth"]);
      case "twitter_post": {
        const { text, ...opts } = args;
        return await runCommand("twitter", ["post", text as string, ...buildArgs(opts)]);
      }
      case "twitter_thread": {
        const { tweets } = args;
        return await runCommand("twitter", ["thread", ...(tweets as string[])]);
      }
      case "twitter_timeline":
        return await runCommand("twitter", ["timeline", ...buildArgs(args)]);
      case "twitter_me":
        return await runCommand("twitter", ["me"]);

      // LinkedIn
      case "linkedin_auth":
        return await runCommand("linkedin", ["auth", ...buildArgs(args)]);
      case "linkedin_post": {
        const { text, ...opts } = args;
        return await runCommand("linkedin", ["post", text as string, ...buildArgs(opts)]);
      }
      case "linkedin_whoami":
        return await runCommand("linkedin", ["whoami"]);
      case "linkedin_status":
        return await runCommand("linkedin", ["status"]);

      // Demo recorder
      case "demo_record": {
        const { demoFile, ...opts } = args;
        return await runCommand("demo-recorder", ["record", demoFile as string, ...buildArgs(opts)]);
      }
      case "demo_screenshot": {
        const { demoFile, ...opts } = args;
        return await runCommand("demo-recorder", ["screenshot", demoFile as string, ...buildArgs(opts)]);
      }
      case "demo_gif": {
        const { videoFile, ...opts } = args;
        return await runCommand("demo-recorder", ["gif", videoFile as string, ...buildArgs(opts)]);
      }
      case "demo_thumbnail": {
        const { videoFile, ...opts } = args;
        return await runCommand("demo-recorder", ["thumbnail", videoFile as string, ...buildArgs(opts)]);
      }

      // Reddit
      case "reddit_search": {
        const { subreddits, keywords, ...opts } = args;
        return await runCommand("reddit-market-research", [
          "search",
          "-s", subreddits as string,
          "-k", keywords as string,
          ...buildArgs(opts),
        ]);
      }

      // Google Forms
      case "gforms_auth": {
        const cliArgs = ["auth"];
        if (args.status) cliArgs.push("--status");
        if (args.logout) cliArgs.push("--logout");
        return await runCommand("gforms", cliArgs);
      }
      case "gforms_create": {
        const { title, ...opts } = args;
        return await runCommand("gforms", ["create", title as string, ...buildArgs(opts)]);
      }
      case "gforms_list":
        return await runCommand("gforms", ["list", ...buildArgs(args)]);
      case "gforms_get": {
        const { formId, ...opts } = args;
        return await runCommand("gforms", ["get", formId as string, ...buildArgs(opts)]);
      }
      case "gforms_update": {
        const { formId, ...opts } = args;
        return await runCommand("gforms", ["update", formId as string, ...buildArgs(opts)]);
      }
      case "gforms_delete": {
        const { formId, confirm } = args;
        const cliArgs = ["delete", formId as string];
        if (confirm) cliArgs.push("--confirm");
        return await runCommand("gforms", cliArgs);
      }
      case "gforms_add_question": {
        const { formId, type, title, ...opts } = args;
        return await runCommand("gforms", [
          "add-question", formId as string,
          "--type", type as string,
          "--title", title as string,
          ...buildArgs(opts),
        ]);
      }
      case "gforms_responses": {
        const { formId, ...opts } = args;
        return await runCommand("gforms", ["responses", formId as string, ...buildArgs(opts)]);
      }
      case "gforms_export": {
        const { formId, ...opts } = args;
        return await runCommand("gforms", ["export", formId as string, ...buildArgs(opts)]);
      }
      case "gforms_import": {
        const { file, ...opts } = args;
        return await runCommand("gforms", ["import", file as string, ...buildArgs(opts)]);
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Tool ${name} failed: ${message}`);
  }
}

// Create and run server
const server = new Server(
  {
    name: "social-tools-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const result = await handleToolCall(name, (args as Record<string, unknown>) || {});
    return {
      content: [{ type: "text", text: result }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Social Tools MCP server running on stdio");
}

main().catch(console.error);
