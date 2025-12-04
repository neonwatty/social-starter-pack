import { getValidToken } from "./auth.js";
import { getUserUrn, getHeaders } from "./profile.js";
import { uploadImage, uploadVideo } from "./media.js";

const POSTS_API_URL = "https://api.linkedin.com/rest/posts";

export type Visibility = "PUBLIC" | "CONNECTIONS" | "LOGGED_IN";

export interface PostOptions {
  text: string;
  visibility?: Visibility;
  imagePath?: string;
  videoPath?: string;
  imageTitle?: string;
  videoTitle?: string;
}

export interface PostResponse {
  id: string;
  urn: string;
}

interface LinkedInPostPayload {
  author: string;
  commentary: string;
  visibility: Visibility;
  distribution: {
    feedDistribution: string;
    targetEntities: never[];
    thirdPartyDistributionChannels: never[];
  };
  lifecycleState: string;
  content?: {
    media?: {
      title?: string;
      id: string;
    };
  };
}

export async function createPost(options: PostOptions): Promise<PostResponse> {
  const accessToken = getValidToken();
  if (!accessToken) {
    throw new Error("Not authenticated. Please run: linkedin-cli auth");
  }

  const userUrn = await getUserUrn();
  const visibility = options.visibility || "PUBLIC";

  // Handle media upload if provided
  let mediaUrn: string | undefined;
  let mediaTitle: string | undefined;

  if (options.imagePath) {
    mediaUrn = await uploadImage(options.imagePath);
    mediaTitle = options.imageTitle;
  } else if (options.videoPath) {
    mediaUrn = await uploadVideo(options.videoPath);
    mediaTitle = options.videoTitle;
  }

  const payload: LinkedInPostPayload = {
    author: userUrn,
    commentary: options.text,
    visibility,
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    lifecycleState: "PUBLISHED",
  };

  // Add media content if uploaded
  if (mediaUrn) {
    payload.content = {
      media: {
        title: mediaTitle,
        id: mediaUrn,
      },
    };
  }

  const response = await fetch(POSTS_API_URL, {
    method: "POST",
    headers: getHeaders(accessToken),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error("Token expired. Please run: linkedin-cli auth");
    }
    if (response.status === 403) {
      throw new Error(
        "Permission denied. Check your app has the required scopes.",
      );
    }
    if (response.status === 429) {
      throw new Error("Rate limited. Please try again later.");
    }
    throw new Error(`Failed to create post: ${error}`);
  }

  // LinkedIn returns the post URN in the x-restli-id header
  const postUrn = response.headers.get("x-restli-id") || "";

  // Extract the ID from the URN
  const idMatch = postUrn.match(/urn:li:share:(\d+)/);
  const postId = idMatch ? idMatch[1] : postUrn;

  console.log("Post created successfully!");

  return {
    id: postId,
    urn: postUrn,
  };
}

export async function deletePost(postId: string): Promise<void> {
  const accessToken = getValidToken();
  if (!accessToken) {
    throw new Error("Not authenticated. Please run: linkedin-cli auth");
  }

  // Construct the URN if just an ID was provided
  const postUrn = postId.startsWith("urn:li:")
    ? postId
    : `urn:li:share:${postId}`;

  const encodedUrn = encodeURIComponent(postUrn);
  const deleteUrl = `${POSTS_API_URL}/${encodedUrn}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: getHeaders(accessToken),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error("Token expired. Please run: linkedin-cli auth");
    }
    if (response.status === 403) {
      throw new Error("Permission denied. You can only delete your own posts.");
    }
    if (response.status === 404) {
      throw new Error("Post not found.");
    }
    throw new Error(`Failed to delete post: ${error}`);
  }

  console.log("Post deleted successfully!");
}

export async function createTextPost(
  text: string,
  visibility: Visibility = "PUBLIC",
): Promise<PostResponse> {
  return createPost({ text, visibility });
}

export async function createImagePost(
  text: string,
  imagePath: string,
  visibility: Visibility = "PUBLIC",
  imageTitle?: string,
): Promise<PostResponse> {
  return createPost({ text, visibility, imagePath, imageTitle });
}

export async function createVideoPost(
  text: string,
  videoPath: string,
  visibility: Visibility = "PUBLIC",
  videoTitle?: string,
): Promise<PostResponse> {
  return createPost({ text, visibility, videoPath, videoTitle });
}
