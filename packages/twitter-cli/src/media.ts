import * as fs from "fs";
import * as path from "path";
import { getCredentials } from "./auth";
import { createOAuth1Header, OAuth1Credentials } from "./oauth1";

const MEDIA_UPLOAD_URL = "https://upload.twitter.com/1.1/media/upload.json";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

interface MediaUploadResponse {
  media_id_string: string;
  media_id: number;
  size?: number;
  expires_after_secs?: number;
  processing_info?: {
    state: string;
    check_after_secs?: number;
    progress_percent?: number;
    error?: {
      code: number;
      name: string;
      message: string;
    };
  };
}

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

async function simpleUpload(
  filePath: string,
  credentials: OAuth1Credentials,
): Promise<string> {
  const fileData = fs.readFileSync(filePath);
  const base64Data = fileData.toString("base64");

  const bodyParams = { media_data: base64Data };
  const authHeader = createOAuth1Header(
    "POST",
    MEDIA_UPLOAD_URL,
    credentials,
    bodyParams,
  );

  const response = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(bodyParams).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Media upload failed: ${error}`);
  }

  const data = (await response.json()) as MediaUploadResponse;
  return data.media_id_string;
}

async function initChunkedUpload(
  totalBytes: number,
  mimeType: string,
  category: MediaCategory,
  credentials: OAuth1Credentials,
): Promise<string> {
  const bodyParams = {
    command: "INIT",
    total_bytes: totalBytes.toString(),
    media_type: mimeType,
    media_category: category,
  };

  const authHeader = createOAuth1Header(
    "POST",
    MEDIA_UPLOAD_URL,
    credentials,
    bodyParams,
  );

  const response = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(bodyParams).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Media INIT failed: ${error}`);
  }

  const data = (await response.json()) as MediaUploadResponse;
  return data.media_id_string;
}

async function appendChunk(
  mediaId: string,
  chunkData: Buffer,
  segmentIndex: number,
  credentials: OAuth1Credentials,
): Promise<void> {
  const bodyParams = {
    command: "APPEND",
    media_id: mediaId,
    segment_index: segmentIndex.toString(),
    media_data: chunkData.toString("base64"),
  };

  const authHeader = createOAuth1Header(
    "POST",
    MEDIA_UPLOAD_URL,
    credentials,
    bodyParams,
  );

  const response = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(bodyParams).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Media APPEND failed: ${error}`);
  }
}

async function finalizeUpload(
  mediaId: string,
  credentials: OAuth1Credentials,
): Promise<MediaUploadResponse> {
  const bodyParams = {
    command: "FINALIZE",
    media_id: mediaId,
  };

  const authHeader = createOAuth1Header(
    "POST",
    MEDIA_UPLOAD_URL,
    credentials,
    bodyParams,
  );

  const response = await fetch(MEDIA_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(bodyParams).toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Media FINALIZE failed: ${error}`);
  }

  return response.json() as Promise<MediaUploadResponse>;
}

async function checkStatus(
  mediaId: string,
  credentials: OAuth1Credentials,
): Promise<MediaUploadResponse> {
  const url = `${MEDIA_UPLOAD_URL}?command=STATUS&media_id=${mediaId}`;

  const authHeader = createOAuth1Header("GET", url, credentials);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authHeader,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Media STATUS check failed: ${error}`);
  }

  return response.json() as Promise<MediaUploadResponse>;
}

async function waitForProcessing(
  mediaId: string,
  credentials: OAuth1Credentials,
  onProgress?: (percent: number) => void,
): Promise<void> {
  let attempts = 0;
  const maxAttempts = 60; // Max 5 minutes (assuming avg 5s check interval)

  while (attempts < maxAttempts) {
    const status = await checkStatus(mediaId, credentials);

    if (!status.processing_info) {
      return; // Processing complete
    }

    const { state, check_after_secs, progress_percent, error } =
      status.processing_info;

    if (error) {
      throw new Error(`Media processing failed: ${error.message}`);
    }

    if (state === "succeeded") {
      onProgress?.(100);
      return;
    }

    if (state === "failed") {
      throw new Error("Media processing failed");
    }

    if (progress_percent !== undefined) {
      onProgress?.(progress_percent);
    }

    const waitTime = (check_after_secs || 5) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    attempts++;
  }

  throw new Error("Media processing timed out");
}

async function chunkedUpload(
  filePath: string,
  credentials: OAuth1Credentials,
  onProgress?: (percent: number, stage: string) => void,
): Promise<string> {
  const stats = fs.statSync(filePath);
  const mediaType = getMediaType(filePath);

  if (stats.size > mediaType.maxSize) {
    throw new Error(
      `File too large. Max size for ${mediaType.category}: ${mediaType.maxSize / 1024 / 1024}MB`,
    );
  }

  // INIT
  onProgress?.(0, "Initializing upload");
  const mediaId = await initChunkedUpload(
    stats.size,
    mediaType.mimeType,
    mediaType.category,
    credentials,
  );

  // APPEND chunks
  const fileHandle = fs.openSync(filePath, "r");
  const totalChunks = Math.ceil(stats.size / CHUNK_SIZE);

  try {
    for (let i = 0; i < totalChunks; i++) {
      const buffer = Buffer.alloc(CHUNK_SIZE);
      const bytesRead = fs.readSync(
        fileHandle,
        buffer,
        0,
        CHUNK_SIZE,
        i * CHUNK_SIZE,
      );
      const chunk = buffer.subarray(0, bytesRead);

      const uploadPercent = Math.round(((i + 1) / totalChunks) * 100);
      onProgress?.(uploadPercent, "Uploading");

      await appendChunk(mediaId, chunk, i, credentials);
    }
  } finally {
    fs.closeSync(fileHandle);
  }

  // FINALIZE
  onProgress?.(100, "Finalizing");
  const finalizeResult = await finalizeUpload(mediaId, credentials);

  // Wait for processing if needed (videos)
  if (finalizeResult.processing_info) {
    onProgress?.(0, "Processing");
    await waitForProcessing(mediaId, credentials, (percent) => {
      onProgress?.(percent, "Processing");
    });
  }

  return mediaId;
}

export async function uploadMedia(
  filePath: string,
  onProgress?: (percent: number, stage: string) => void,
): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const credentials = getCredentials();
  const stats = fs.statSync(filePath);
  const mediaType = getMediaType(filePath);

  // Use simple upload for small images, chunked for everything else
  if (mediaType.category === "tweet_image" && stats.size < 5 * 1024 * 1024) {
    onProgress?.(0, "Uploading");
    const mediaId = await simpleUpload(filePath, credentials);
    onProgress?.(100, "Complete");
    return mediaId;
  }

  return chunkedUpload(filePath, credentials, onProgress);
}

export async function uploadMultipleMedia(
  filePaths: string[],
  onProgress?: (fileIndex: number, percent: number, stage: string) => void,
): Promise<string[]> {
  const mediaIds: string[] = [];

  for (let i = 0; i < filePaths.length; i++) {
    const mediaId = await uploadMedia(filePaths[i], (percent, stage) => {
      onProgress?.(i, percent, stage);
    });
    mediaIds.push(mediaId);
  }

  return mediaIds;
}
