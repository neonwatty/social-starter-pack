// OAuth 1.0a
export { OAuth1Credentials, createOAuth1Header, oauth1Fetch } from "./oauth1";

// Authentication
export {
  saveCredentials,
  loadCredentials,
  clearCredentials,
  getCredentials,
  verifyCredentials,
} from "./auth";

// Tweet operations
export {
  createTweet,
  deleteTweet,
  replyToTweet,
  quoteTweet,
  createThread,
  type TweetOptions,
  type TweetResponse,
  type DeleteResponse,
} from "./tweet";

// Media upload
export { uploadMedia, uploadMultipleMedia } from "./media";

// Timeline
export {
  getCurrentUser,
  getUserTimeline,
  getMyTimeline,
  getTweet,
  type User,
  type Tweet,
  type TimelineResponse,
  type TimelineOptions,
} from "./timeline";
