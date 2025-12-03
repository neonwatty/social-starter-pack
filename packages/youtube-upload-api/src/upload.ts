import { google, youtube_v3 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import * as fs from "fs";
import * as path from "path";

export interface VideoMetadata {
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: "public" | "private" | "unlisted";
  madeForKids?: boolean;
  addShortsHashtag?: boolean;
}

export interface UploadResult {
  videoId: string;
  title: string;
  url: string;
}

const DEFAULT_CATEGORY_ID = "22"; // People & Blogs

export async function uploadVideo(
  auth: OAuth2Client,
  filePath: string,
  metadata: VideoMetadata
): Promise<UploadResult> {
  const youtube = google.youtube({ version: "v3", auth });

  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Video file not found: ${filePath}`);
  }

  // Prepare title and description with #shorts hashtag
  let title = metadata.title;
  let description = metadata.description || "";

  if (metadata.addShortsHashtag !== false) {
    if (!title.toLowerCase().includes("#shorts")) {
      title = `${title} #shorts`;
    }
    if (!description.toLowerCase().includes("#shorts")) {
      description = description ? `${description}\n\n#shorts` : "#shorts";
    }
  }

  // Ensure title doesn't exceed YouTube's limit
  if (title.length > 100) {
    title = title.substring(0, 97) + "...";
  }

  const fileSize = fs.statSync(filePath).size;
  const fileName = path.basename(filePath);

  console.log(`\nUploading: ${fileName}`);
  console.log(`Title: ${title}`);
  console.log(`Size: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Privacy: ${metadata.privacyStatus || "private"}\n`);

  const requestBody: youtube_v3.Schema$Video = {
    snippet: {
      title,
      description,
      tags: metadata.tags || [],
      categoryId: metadata.categoryId || DEFAULT_CATEGORY_ID,
    },
    status: {
      privacyStatus: metadata.privacyStatus || "private",
      selfDeclaredMadeForKids: metadata.madeForKids || false,
    },
  };

  const media = {
    body: fs.createReadStream(filePath),
  };

  // Track upload progress
  let lastProgress = 0;
  const startTime = Date.now();

  const res = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody,
      media,
    },
    {
      onUploadProgress: (evt) => {
        const progress = Math.round((evt.bytesRead / fileSize) * 100);
        if (progress !== lastProgress && progress % 10 === 0) {
          const elapsed = (Date.now() - startTime) / 1000;
          const speed = evt.bytesRead / elapsed / (1024 * 1024);
          console.log(`Progress: ${progress}% (${speed.toFixed(2)} MB/s)`);
          lastProgress = progress;
        }
      },
    }
  );

  const videoId = res.data.id!;
  const videoUrl = `https://youtube.com/shorts/${videoId}`;

  console.log(`\nUpload complete!`);
  console.log(`Video ID: ${videoId}`);
  console.log(`URL: ${videoUrl}\n`);

  return {
    videoId,
    title: res.data.snippet?.title || title,
    url: videoUrl,
  };
}

export async function uploadMultipleVideos(
  auth: OAuth2Client,
  videos: Array<{ filePath: string; metadata: VideoMetadata }>
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < videos.length; i++) {
    const { filePath, metadata } = videos[i];
    console.log(`\n=== Uploading video ${i + 1} of ${videos.length} ===`);

    try {
      const result = await uploadVideo(auth, filePath, metadata);
      results.push(result);
    } catch (error) {
      console.error(`Failed to upload ${filePath}:`, error);
    }
  }

  return results;
}
