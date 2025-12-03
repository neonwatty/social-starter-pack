import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface UpdateOptions {
  title?: string;
  description?: string;
  tags?: string[];
  privacyStatus?: "public" | "private" | "unlisted";
}

export interface UpdateResult {
  videoId: string;
  title: string;
  url: string;
  changes: string[];
}

export async function updateVideo(
  auth: OAuth2Client,
  videoId: string,
  options: UpdateOptions
): Promise<UpdateResult> {
  const youtube = google.youtube({ version: "v3", auth });

  // Fetch current video metadata
  console.log(`Fetching video ${videoId}...`);
  const listResponse = await youtube.videos.list({
    id: [videoId],
    part: ["snippet", "status"],
  });

  const video = listResponse.data.items?.[0];
  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }

  const currentSnippet = video.snippet!;
  const currentStatus = video.status!;
  const changes: string[] = [];

  // Build updated snippet
  const updatedSnippet: any = {
    title: currentSnippet.title,
    description: currentSnippet.description,
    tags: currentSnippet.tags,
    categoryId: currentSnippet.categoryId,
  };

  // Build updated status
  const updatedStatus: any = {
    privacyStatus: currentStatus.privacyStatus,
  };

  // Apply changes
  if (options.title !== undefined) {
    changes.push(`Title: "${currentSnippet.title}" → "${options.title}"`);
    updatedSnippet.title = options.title;
  }

  if (options.description !== undefined) {
    const oldDesc = currentSnippet.description?.substring(0, 30) || "(empty)";
    const newDesc = options.description.substring(0, 30);
    changes.push(`Description: "${oldDesc}..." → "${newDesc}..."`);
    updatedSnippet.description = options.description;
  }

  if (options.tags !== undefined) {
    const oldTags = currentSnippet.tags?.join(", ") || "(none)";
    const newTags = options.tags.join(", ");
    changes.push(`Tags: [${oldTags}] → [${newTags}]`);
    updatedSnippet.tags = options.tags;
  }

  if (options.privacyStatus !== undefined) {
    changes.push(`Privacy: ${currentStatus.privacyStatus} → ${options.privacyStatus}`);
    updatedStatus.privacyStatus = options.privacyStatus;
  }

  if (changes.length === 0) {
    throw new Error("No changes specified. Use --title, --description, --tags, or --privacy");
  }

  // Update the video
  console.log("\nApplying changes:");
  changes.forEach((c) => console.log(`  • ${c}`));
  console.log();

  await youtube.videos.update({
    part: ["snippet", "status"],
    requestBody: {
      id: videoId,
      snippet: updatedSnippet,
      status: updatedStatus,
    },
  });

  console.log("Video updated successfully!");

  return {
    videoId,
    title: updatedSnippet.title,
    url: `https://youtube.com/watch?v=${videoId}`,
    changes,
  };
}
