import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

export interface VideoListItem {
  videoId: string;
  title: string;
  publishedAt: string;
  privacyStatus: string;
  viewCount: string;
  likeCount: string;
  duration: string;
  url: string;
}

export interface ListOptions {
  maxResults?: number;
  privacy?: "public" | "private" | "unlisted";
  format?: "table" | "json";
}

export interface ListResult {
  videos: VideoListItem[];
  totalResults: number;
}

function parseDuration(isoDuration: string): string {
  // Parse ISO 8601 duration (e.g., PT1M30S -> 1:30)
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatCount(count: string): string {
  const num = parseInt(count);
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return count;
}

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toISOString().split("T")[0];
}

export async function listVideos(
  auth: OAuth2Client,
  options: ListOptions = {}
): Promise<ListResult> {
  const youtube = google.youtube({ version: "v3", auth });
  const maxResults = options.maxResults || 10;

  // Step 1: Get the user's channel and uploads playlist ID
  const channelResponse = await youtube.channels.list({
    mine: true,
    part: ["contentDetails"],
  });

  const channel = channelResponse.data.items?.[0];
  if (!channel) {
    throw new Error("No channel found for authenticated user");
  }

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist");
  }

  // Step 2: Get videos from the uploads playlist
  const playlistResponse = await youtube.playlistItems.list({
    playlistId: uploadsPlaylistId,
    part: ["snippet"],
    maxResults: Math.min(maxResults, 50), // API max is 50
  });

  const playlistItems = playlistResponse.data.items || [];
  const totalResults = playlistResponse.data.pageInfo?.totalResults || 0;

  if (playlistItems.length === 0) {
    return { videos: [], totalResults: 0 };
  }

  // Step 3: Get detailed info for each video
  const videoIds = playlistItems
    .map((item) => item.snippet?.resourceId?.videoId)
    .filter((id): id is string => !!id);

  const videosResponse = await youtube.videos.list({
    id: videoIds,
    part: ["snippet", "status", "statistics", "contentDetails"],
  });

  const videos: VideoListItem[] = [];

  for (const video of videosResponse.data.items || []) {
    const privacyStatus = video.status?.privacyStatus || "unknown";

    // Apply privacy filter if specified
    if (options.privacy && privacyStatus !== options.privacy) {
      continue;
    }

    videos.push({
      videoId: video.id!,
      title: video.snippet?.title || "Untitled",
      publishedAt: video.snippet?.publishedAt || "",
      privacyStatus,
      viewCount: video.statistics?.viewCount || "0",
      likeCount: video.statistics?.likeCount || "0",
      duration: video.contentDetails?.duration || "PT0S",
      url: `https://youtube.com/watch?v=${video.id}`,
    });
  }

  return { videos, totalResults };
}

export function printVideosTable(result: ListResult): void {
  const { videos, totalResults } = result;

  if (videos.length === 0) {
    console.log("\nNo videos found.");
    return;
  }

  console.log(`\nYour Videos (showing ${videos.length} of ${totalResults})\n`);

  // Calculate column widths
  const maxTitleLen = Math.min(40, Math.max(...videos.map((v) => v.title.length)));

  // Header
  const header = `  #  ${"Title".padEnd(maxTitleLen)}  Privacy    Views    Duration  Published`;
  console.log(header);
  console.log("  " + "-".repeat(header.length - 2));

  // Rows
  videos.forEach((video, index) => {
    const num = (index + 1).toString().padStart(2);
    let title = video.title;
    if (title.length > maxTitleLen) {
      title = title.substring(0, maxTitleLen - 3) + "...";
    }
    title = title.padEnd(maxTitleLen);

    const privacy = video.privacyStatus.padEnd(10);
    const views = formatCount(video.viewCount).padStart(8);
    const duration = parseDuration(video.duration).padStart(8);
    const published = formatDate(video.publishedAt);

    console.log(`  ${num}  ${title}  ${privacy}${views}  ${duration}  ${published}`);
  });

  console.log();
}

export function printVideosJson(result: ListResult): void {
  const output = result.videos.map((video) => ({
    videoId: video.videoId,
    title: video.title,
    url: video.url,
    publishedAt: video.publishedAt,
    privacyStatus: video.privacyStatus,
    viewCount: video.viewCount,
    likeCount: video.likeCount,
    duration: parseDuration(video.duration),
  }));

  console.log(JSON.stringify(output, null, 2));
}
