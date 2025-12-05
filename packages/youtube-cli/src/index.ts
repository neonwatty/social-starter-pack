export { getAuthenticatedClient } from "./auth";
export { uploadVideo, uploadMultipleVideos, VideoMetadata, UploadResult } from "./upload";
export { getVideoInfo, validateForShorts, checkFfprobe, VideoInfo } from "./validate";
export { listVideos, printVideosTable, printVideosJson } from "./list";
export type { VideoListItem, ListOptions, ListResult } from "./list";
export { updateVideo } from "./update";
export type { UpdateOptions, UpdateResult } from "./update";
export { cloneVideo, checkYtDlp } from "./clone";
export type { CloneOptions } from "./clone";
