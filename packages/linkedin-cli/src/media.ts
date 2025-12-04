import fs from "fs";
import path from "path";
import { getValidToken } from "./auth.js";
import { getUserUrn, getHeaders } from "./profile.js";

const IMAGES_API_URL = "https://api.linkedin.com/rest/images";
const VIDEOS_API_URL = "https://api.linkedin.com/rest/videos";

export interface ImageUploadResponse {
  uploadUrl: string;
  image: string;
  uploadUrlExpiresAt: number;
}

export interface VideoUploadResponse {
  uploadUrl: string;
  video: string;
  uploadUrlExpiresAt: number;
  uploadInstructions?: UploadInstruction[];
}

interface UploadInstruction {
  uploadUrl: string;
  firstByte: number;
  lastByte: number;
}

interface InitializeImageUploadResponse {
  value: {
    uploadUrlExpiresAt: number;
    uploadUrl: string;
    image: string;
  };
}

interface InitializeVideoUploadResponse {
  value: {
    uploadUrlExpiresAt: number;
    video: string;
    uploadInstructions: UploadInstruction[];
  };
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".avi": "video/x-msvideo",
    ".webm": "video/webm",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

export async function initializeImageUpload(): Promise<ImageUploadResponse> {
  const accessToken = getValidToken();
  if (!accessToken) {
    throw new Error("Not authenticated. Please run: linkedin-cli auth");
  }

  const userUrn = await getUserUrn();

  const response = await fetch(`${IMAGES_API_URL}?action=initializeUpload`, {
    method: "POST",
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: userUrn,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to initialize image upload: ${error}`);
  }

  const data = (await response.json()) as InitializeImageUploadResponse;

  return {
    uploadUrl: data.value.uploadUrl,
    image: data.value.image,
    uploadUrlExpiresAt: data.value.uploadUrlExpiresAt,
  };
}

export async function uploadImageBinary(
  uploadUrl: string,
  filePath: string,
): Promise<void> {
  const accessToken = getValidToken();
  if (!accessToken) {
    throw new Error("Not authenticated. Please run: linkedin-cli auth");
  }

  const fileBuffer = fs.readFileSync(filePath);
  const mimeType = getMimeType(filePath);

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": mimeType,
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload image: ${error}`);
  }
}

export async function uploadImage(filePath: string): Promise<string> {
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Validate file type
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) {
    throw new Error("Unsupported image format. Use JPEG or PNG.");
  }

  console.log("Initializing image upload...");
  const uploadInfo = await initializeImageUpload();

  console.log("Uploading image...");
  await uploadImageBinary(uploadInfo.uploadUrl, filePath);

  console.log("Image uploaded successfully.");
  return uploadInfo.image;
}

export async function initializeVideoUpload(
  fileSizeBytes: number,
): Promise<VideoUploadResponse> {
  const accessToken = getValidToken();
  if (!accessToken) {
    throw new Error("Not authenticated. Please run: linkedin-cli auth");
  }

  const userUrn = await getUserUrn();

  const response = await fetch(`${VIDEOS_API_URL}?action=initializeUpload`, {
    method: "POST",
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: userUrn,
        fileSizeBytes,
        uploadCaptions: false,
        uploadThumbnail: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to initialize video upload: ${error}`);
  }

  const data = (await response.json()) as InitializeVideoUploadResponse;

  return {
    uploadUrl: data.value.uploadInstructions[0]?.uploadUrl || "",
    video: data.value.video,
    uploadUrlExpiresAt: data.value.uploadUrlExpiresAt,
    uploadInstructions: data.value.uploadInstructions,
  };
}

export async function uploadVideoChunk(
  uploadUrl: string,
  chunk: Buffer,
): Promise<string> {
  const accessToken = getValidToken();
  if (!accessToken) {
    throw new Error("Not authenticated. Please run: linkedin-cli auth");
  }

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: chunk,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to upload video chunk: ${error}`);
  }

  // Get the etag from response headers
  const etag = response.headers.get("etag") || "";
  return etag;
}

export async function finalizeVideoUpload(
  videoUrn: string,
  etags: string[],
): Promise<void> {
  const accessToken = getValidToken();
  if (!accessToken) {
    throw new Error("Not authenticated. Please run: linkedin-cli auth");
  }

  const response = await fetch(`${VIDEOS_API_URL}?action=finalizeUpload`, {
    method: "POST",
    headers: getHeaders(accessToken),
    body: JSON.stringify({
      finalizeUploadRequest: {
        video: videoUrn,
        uploadToken: "",
        uploadedPartIds: etags,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to finalize video upload: ${error}`);
  }
}

export async function uploadVideo(filePath: string): Promise<string> {
  // Validate file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Validate file type
  const ext = path.extname(filePath).toLowerCase();
  if (![".mp4", ".mov", ".avi", ".webm"].includes(ext)) {
    throw new Error("Unsupported video format. Use MP4, MOV, AVI, or WebM.");
  }

  const stats = fs.statSync(filePath);
  const fileSizeBytes = stats.size;

  console.log("Initializing video upload...");
  const uploadInfo = await initializeVideoUpload(fileSizeBytes);

  if (
    !uploadInfo.uploadInstructions ||
    uploadInfo.uploadInstructions.length === 0
  ) {
    throw new Error("No upload instructions received from LinkedIn");
  }

  console.log("Uploading video...");
  const etags: string[] = [];

  // Read file and upload in chunks according to instructions
  const fileBuffer = fs.readFileSync(filePath);

  for (const instruction of uploadInfo.uploadInstructions) {
    const chunk = fileBuffer.slice(
      instruction.firstByte,
      instruction.lastByte + 1,
    );
    const etag = await uploadVideoChunk(instruction.uploadUrl, chunk);
    etags.push(etag);
    console.log(
      `Uploaded chunk ${etags.length}/${uploadInfo.uploadInstructions.length}`,
    );
  }

  console.log("Finalizing video upload...");
  await finalizeVideoUpload(uploadInfo.video, etags);

  console.log("Video uploaded successfully.");
  return uploadInfo.video;
}
