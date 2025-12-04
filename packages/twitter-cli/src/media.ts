import * as fs from "fs";
import * as path from "path";

// NOTE: Media upload via OAuth 2.0 is not yet supported by the X API v2.
// The v1.1 media upload endpoint requires OAuth 1.0a authentication.
// This is a known limitation. For now, media upload is disabled.

type MediaCategory = "tweet_image" | "tweet_gif" | "tweet_video";

interface MediaType {
  mimeType: string;
  category: MediaCategory;
  maxSize: number;
}

const MEDIA_TYPES: Record<string, MediaType> = {
  ".jpg": {
    mimeType: "image/jpeg",
    category: "tweet_image",
    maxSize: 5 * 1024 * 1024,
  },
  ".jpeg": {
    mimeType: "image/jpeg",
    category: "tweet_image",
    maxSize: 5 * 1024 * 1024,
  },
  ".png": {
    mimeType: "image/png",
    category: "tweet_image",
    maxSize: 5 * 1024 * 1024,
  },
  ".webp": {
    mimeType: "image/webp",
    category: "tweet_image",
    maxSize: 5 * 1024 * 1024,
  },
  ".gif": {
    mimeType: "image/gif",
    category: "tweet_gif",
    maxSize: 15 * 1024 * 1024,
  },
  ".mp4": {
    mimeType: "video/mp4",
    category: "tweet_video",
    maxSize: 512 * 1024 * 1024,
  },
};

function getMediaType(filePath: string): MediaType {
  const ext = path.extname(filePath).toLowerCase();
  const mediaType = MEDIA_TYPES[ext];
  if (!mediaType) {
    throw new Error(
      `Unsupported file type: ${ext}. Supported: ${Object.keys(MEDIA_TYPES).join(", ")}`,
    );
  }
  return mediaType;
}

export async function uploadMedia(
  filePath: string,
  _onProgress?: (percent: number, stage: string) => void,
): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Validate the file type
  getMediaType(filePath);

  // Media upload is not supported with OAuth 2.0
  throw new Error(
    "Media upload is not currently supported with OAuth 2.0 authentication. " +
      "The X API v1.1 media upload endpoint requires OAuth 1.0a. " +
      "Please post tweets without media for now.",
  );
}

export async function uploadMultipleMedia(
  filePaths: string[],
  _onProgress?: (fileIndex: number, percent: number, stage: string) => void,
): Promise<string[]> {
  // Validate all files exist
  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    getMediaType(filePath);
  }

  throw new Error(
    "Media upload is not currently supported with OAuth 2.0 authentication. " +
      "The X API v1.1 media upload endpoint requires OAuth 1.0a. " +
      "Please post tweets without media for now.",
  );
}
