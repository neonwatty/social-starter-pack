import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { uploadVideo, UploadResult } from "./upload";

export interface CloneOptions {
  title: string;
  description?: string;
  tags?: string[];
  privacyStatus?: "public" | "private" | "unlisted";
  keepFile?: boolean;
}

export function checkYtDlp(): boolean {
  try {
    execSync("yt-dlp --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export async function cloneVideo(
  auth: OAuth2Client,
  videoId: string,
  options: CloneOptions
): Promise<UploadResult> {
  const youtube = google.youtube({ version: "v3", auth });

  // Check yt-dlp is available
  if (!checkYtDlp()) {
    throw new Error(
      "yt-dlp is required for cloning videos.\n" +
        "  Install with: brew install yt-dlp (macOS) or pip install yt-dlp"
    );
  }

  // Fetch original video metadata
  console.log(`Fetching original video ${videoId}...`);
  const listResponse = await youtube.videos.list({
    id: [videoId],
    part: ["snippet", "status"],
  });

  const video = listResponse.data.items?.[0];
  if (!video) {
    throw new Error(`Video not found: ${videoId}`);
  }

  const originalSnippet = video.snippet!;

  // Merge options with original metadata
  const metadata = {
    title: options.title,
    description: options.description ?? originalSnippet.description ?? "",
    tags: options.tags ?? originalSnippet.tags ?? [],
    privacyStatus: options.privacyStatus ?? "private",
  };

  console.log(`Original title: ${originalSnippet.title}`);
  console.log(`New title: ${metadata.title}`);
  console.log(`Privacy: ${metadata.privacyStatus}\n`);

  // Download video to temp directory
  const tempDir = os.tmpdir();
  const tempFile = path.join(tempDir, `yt-clone-${videoId}-${Date.now()}.mp4`);
  const videoUrl = `https://youtube.com/watch?v=${videoId}`;

  console.log("Downloading video...");
  try {
    // Let yt-dlp choose best format and merge to mp4
    execSync(`yt-dlp --merge-output-format mp4 -o "${tempFile}" "${videoUrl}"`, {
      stdio: "inherit",
    });
  } catch {
    throw new Error(
      `Failed to download video. Make sure the video is accessible and you have permission to download it.`
    );
  }

  if (!fs.existsSync(tempFile)) {
    throw new Error("Download failed: temp file not created");
  }

  console.log(`\nDownloaded to: ${tempFile}`);
  console.log("Uploading clone...\n");

  // Upload with new metadata
  let result: UploadResult;
  try {
    result = await uploadVideo(auth, tempFile, {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      privacyStatus: metadata.privacyStatus as "public" | "private" | "unlisted",
      addShortsHashtag: false, // Don't auto-add #shorts since we're cloning
    });
  } finally {
    // Clean up temp file unless --keep-file
    if (!options.keepFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      console.log("Temp file deleted.");
    } else if (options.keepFile) {
      console.log(`Keeping file: ${tempFile}`);
    }
  }

  return result;
}
