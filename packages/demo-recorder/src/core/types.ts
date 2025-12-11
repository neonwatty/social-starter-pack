import type { Page, Browser, BrowserContext } from 'playwright';

/**
 * Video recording settings
 */
export interface VideoSettings {
  /** Video width in pixels (default: 1920) */
  width: number;
  /** Video height in pixels (default: 1080) */
  height: number;
}

/**
 * Options for animated typing
 */
export interface TypeOptions {
  /** Delay between characters in ms (default: 50) */
  delay?: number;
  /** Random variation in delay (default: 20) */
  variation?: number;
}

/**
 * Options for cursor movement
 */
export interface MoveOptions {
  /** Total move duration in ms (default: 500) */
  duration?: number;
  /** Number of interpolation steps (default: 20) */
  steps?: number;
}

/**
 * Options for animated click
 */
export interface ClickOptions {
  /** How long to hover before clicking in ms (default: 200) */
  hoverDuration?: number;
  /** Cursor move duration in ms (default: 400) */
  moveDuration?: number;
  /** Skip visibility checks and force click (default: false) */
  force?: boolean;
  /** Auto-scroll element into view before clicking (default: true) */
  scrollIntoView?: boolean;
}

/**
 * Options for waitForEnabled helper
 */
export interface WaitForEnabledOptions {
  /** Timeout in ms (default: 30000) */
  timeout?: number;
  /** Polling interval in ms (default: 100) */
  interval?: number;
}

/**
 * Options for waitForText helper
 */
export interface WaitForTextOptions {
  /** Timeout in ms (default: 30000) */
  timeout?: number;
  /** Polling interval in ms (default: 100) */
  interval?: number;
}

/**
 * Options for waitForTextChange helper
 */
export interface WaitForTextChangeOptions {
  /** Timeout in ms (default: 30000) */
  timeout?: number;
  /** Polling interval in ms (default: 100) */
  interval?: number;
  /** Initial text to wait for change from (if not provided, captures current text) */
  initialText?: string;
}

/**
 * Options for waitForHydration helper
 */
export interface WaitForHydrationOptions {
  /** Timeout in ms (default: 10000) */
  timeout?: number;
}

/**
 * Options for zoom highlight effect
 */
export interface ZoomOptions {
  /** Zoom scale factor (default: 1.05) */
  scale?: number;
  /** Total animation duration in ms (default: 600) */
  duration?: number;
}

/**
 * Options for scroll animations
 */
export interface ScrollOptions {
  /** Scroll animation duration in ms (default: 600) */
  duration?: number;
  /** Easing function (default: 'ease-out') */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  /** Pixel offset from target element (default: 0) */
  offset?: number;
}

/**
 * Title card configuration for intro
 */
export interface TitleCardOptions {
  /** Main title text */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Duration to show title card in ms (default: 2000) */
  duration?: number;
  /** Background color (default: '#000') */
  background?: string;
  /** Text color (default: '#fff') */
  textColor?: string;
}

/**
 * Intro effect options
 */
export interface IntroOptions {
  /** Fade in from black (default: false) */
  fadeIn?: boolean;
  /** Fade duration in ms (default: 800) */
  fadeDuration?: number;
  /** Optional title card */
  titleCard?: TitleCardOptions;
}

/**
 * Outro effect options
 */
export interface OutroOptions {
  /** Fade out to black (default: false) */
  fadeOut?: boolean;
  /** Fade duration in ms (default: 800) */
  fadeDuration?: number;
}

/**
 * Screenshot capture settings
 */
export interface ScreenshotSettings {
  /** Image format (default: 'png') */
  format?: 'png' | 'jpeg' | 'webp';
  /** Quality for jpeg/webp, 0-100 (default: 90) */
  quality?: number;
  /** Capture full page or just viewport (default: false) */
  fullPage?: boolean;
}

/**
 * Individual screenshot metadata
 */
export interface ScreenshotCapture {
  /** Full path to screenshot file */
  filepath: string;
  /** Filename only */
  filename: string;
  /** Capture timestamp */
  timestamp: number;
  /** Action that triggered capture (e.g., "click", "type") */
  action?: string;
  /** CSS selector of target element */
  selector?: string;
}

/**
 * Result of screenshot capture session
 */
export interface ScreenshotResult {
  /** Array of captured screenshots */
  screenshots: ScreenshotCapture[];
  /** Path to generated HTML gallery */
  galleryPath: string;
  /** Output directory path */
  outputDir: string;
}

/**
 * Default screenshot settings
 */
export const DEFAULT_SCREENSHOT_SETTINGS: ScreenshotSettings = {
  format: 'png',
  quality: 90,
  fullPage: false,
};

/**
 * Context passed to the demo's run function
 */
export interface DemoContext {
  /** Playwright Page instance */
  page: Page;
  /** Playwright Browser instance */
  browser: Browser;
  /** Playwright BrowserContext instance */
  context: BrowserContext;
  /** Helper to add a pause (useful for letting animations complete) */
  wait: (ms: number) => Promise<void>;
  /** Helper to highlight an element before interacting */
  highlight: (selector: string, durationMs?: number) => Promise<void>;
  /** Hide dev tools (Next.js logo, etc.) */
  hideDevTools: () => Promise<void>;
  /** Type text with character-by-character animation */
  typeAnimated: (selector: string, text: string, options?: TypeOptions) => Promise<void>;
  /** Move cursor smoothly to an element */
  moveTo: (selector: string, options?: MoveOptions) => Promise<void>;
  /** Move to element, hover, then click */
  clickAnimated: (selector: string, options?: ClickOptions) => Promise<void>;
  /** Highlight with zoom/scale effect */
  zoomHighlight: (selector: string, options?: ZoomOptions) => Promise<void>;
  /** Smooth scroll to an element */
  scrollToElement: (selector: string, options?: ScrollOptions) => Promise<void>;
  /** Smooth scroll by a number of pixels */
  scrollBy: (pixels: number, options?: ScrollOptions) => Promise<void>;
  /** Smooth scroll to top of page */
  scrollToTop: (options?: ScrollOptions) => Promise<void>;
  /** Smooth scroll to bottom of page */
  scrollToBottom: (options?: ScrollOptions) => Promise<void>;
  /** Manually capture a screenshot (available in both video and screenshot modes) */
  screenshot: (name?: string) => Promise<string>;
  /** Wait for element to become enabled (not disabled) */
  waitForEnabled: (selector: string, options?: WaitForEnabledOptions) => Promise<void>;
  /** Check if element exists in DOM (returns boolean, does not throw) */
  exists: (selector: string) => Promise<boolean>;
  /** Check if element is visible (returns boolean, does not throw) */
  isVisible: (selector: string) => Promise<boolean>;

  // SPA & Async operation helpers

  /** Wait for React/Next.js hydration to complete */
  waitForHydration: (options?: WaitForHydrationOptions) => Promise<void>;
  /** Wait for element text to contain specific text */
  waitForText: (selector: string, text: string, options?: WaitForTextOptions) => Promise<void>;
  /** Wait for element text to change from its current value */
  waitForTextChange: (selector: string, options?: WaitForTextChangeOptions) => Promise<string>;
  /** Upload file to a file input element */
  uploadFile: (selector: string, filePath: string) => Promise<void>;
  /** Wait for a download to complete and return the downloaded file path */
  waitForDownload: (options?: { timeout?: number }) => Promise<string>;
}

/**
 * The main demo definition that users create
 */
export interface DemoDefinition {
  /** Unique identifier for this demo (used for filenames) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Target URL to record */
  url: string;
  /** Video recording settings (optional, has defaults) */
  video?: Partial<VideoSettings>;
  /** Intro effects (fade in, title card) */
  intro?: IntroOptions;
  /** Outro effects (fade out) */
  outro?: OutroOptions;
  /** Screenshot settings (used when running in screenshot mode) */
  screenshot?: Partial<ScreenshotSettings>;
  /**
   * The actual demo script - receives a Playwright Page and helpers
   */
  run: (context: DemoContext) => Promise<void>;
}

/**
 * Result of running a recording
 */
export interface RecordingResult {
  /** Path to the recorded video file */
  videoPath: string;
  /** Recording duration in milliseconds */
  durationMs: number;
  /** Path to metadata JSON file (if generated) */
  metadataPath?: string;
  /** Parsed recording metadata (if generated) */
  metadata?: RecordingMetadata;
}

// ==========================================
// Action Timing & Recording Metadata Types
// ==========================================

/**
 * Element state captured at time of action
 */
export interface ActionElementState {
  /** Whether element was found in DOM */
  found: boolean;
  /** Whether element was visible */
  visible: boolean;
  /** Whether element was enabled (not disabled) */
  enabled: boolean;
  /** Element bounding box if available */
  boundingBox?: { x: number; y: number; width: number; height: number };
  /** First 200 chars of text content */
  textContent?: string;
}

/**
 * Screenshots captured for an action
 */
export interface ActionScreenshots {
  /** Screenshot taken before action (relative path) */
  before?: string;
  /** Screenshot taken after action (relative path) */
  after?: string;
}

/**
 * Result data for actions that return values
 */
export interface ActionResult {
  /** Type of result */
  type: 'text' | 'boolean' | 'path';
  /** String representation of result */
  value: string;
}

/**
 * Timing information for a single recorded action
 */
export interface ActionTiming {
  /** Action type (clickAnimated, wait, typeAnimated, etc.) */
  action: string;
  /** CSS selector if applicable */
  selector?: string;
  /** Additional action arguments (e.g., typed text, wait duration) */
  args?: string;
  /** Start time in milliseconds from recording start */
  startMs: number;
  /** End time in milliseconds from recording start */
  endMs: number;
  /** Duration in milliseconds */
  durationMs: number;
  /** Whether action completed successfully */
  success: boolean;
  /** Error message if action failed */
  error?: string;
  /** Element state at time of action (for selector-based actions) */
  elementState?: ActionElementState;
  /** Screenshots captured before/after action */
  screenshots?: ActionScreenshots;
  /** Result data for actions that return values */
  result?: ActionResult;
}

/**
 * Summary statistics for AI review
 */
export interface RecordingSummary {
  /** Total number of actions */
  totalActions: number;
  /** Number of successful actions */
  successfulActions: number;
  /** Number of failed actions */
  failedActions: number;
  /** Warning messages for review */
  warnings: string[];
  /** Total screenshots captured */
  screenshotCount: number;
}

/**
 * Complete recording metadata including action timings
 */
export interface RecordingMetadata {
  /** Demo ID */
  demoId: string;
  /** Demo name */
  demoName: string;
  /** Target URL */
  url: string;
  /** Recording start timestamp (ISO string) */
  recordedAt: string;
  /** Video resolution */
  resolution: { width: number; height: number };
  /** Total recording duration in milliseconds */
  totalDurationMs: number;
  /** Array of timed actions */
  actions: ActionTiming[];
  /** Summary statistics for AI review */
  summary: RecordingSummary;
  /** Path to source demo file */
  demoSourcePath: string;
}

// ==========================================
// Video Analysis Types
// ==========================================

/**
 * Frame difference measurement for a time segment
 */
export interface FrameDiffSegment {
  /** Start time in seconds */
  startSec: number;
  /** End time in seconds */
  endSec: number;
  /** Average frame difference score (0-100, lower = more static) */
  avgDiffScore: number;
  /** Minimum difference score in segment */
  minDiffScore: number;
  /** Maximum difference score in segment */
  maxDiffScore: number;
  /** Classification based on activity level */
  classification: 'static' | 'low_activity' | 'medium_activity' | 'high_activity';
  /** Recommendation for this segment */
  recommendation: 'cut' | 'speedup_4x' | 'speedup_2x' | 'keep';
}

/**
 * Video analysis result from FFmpeg
 */
export interface VideoAnalysis {
  /** Video file path */
  videoPath: string;
  /** Total video duration in seconds */
  duration: number;
  /** Detected silence/pause segments */
  silences: SilenceSegment[];
  /** Extracted keyframes at scene changes */
  keyframes: KeyframeInfo[];
  /** Correlated actions from metadata (if available) */
  actions?: ActionTiming[];
  /** Suggested trim points */
  suggestions: TrimSuggestion[];
  /** Frame difference analysis (visual activity detection) */
  frameDiffs?: FrameDiffSegment[];
}

/**
 * Silence detection result
 */
export interface SilenceSegment {
  /** Start time in seconds */
  startSec: number;
  /** End time in seconds */
  endSec: number;
  /** Duration in seconds */
  durationSec: number;
  /** Whether this pause should be kept (e.g., waiting for animation) */
  keepPause: boolean;
  /** Reason for keeping/removing */
  reason?: string;
}

/**
 * Keyframe information
 */
export interface KeyframeInfo {
  /** Timestamp in seconds */
  timestampSec: number;
  /** Path to extracted thumbnail */
  thumbnailPath: string;
  /** Associated action (if metadata available) */
  associatedAction?: ActionTiming;
  /** Scene change score (0-1, higher = bigger change) */
  sceneChangeScore?: number;
}

/**
 * Trim suggestion from analysis
 */
export interface TrimSuggestion {
  /** Type: remove_pause, keep_segment, speed_up */
  type: 'remove_pause' | 'keep_segment' | 'speed_up';
  /** Start time in seconds */
  startSec: number;
  /** End time in seconds */
  endSec: number;
  /** Confidence score (0-1) */
  confidence: number;
  /** Human-readable reason */
  reason: string;
}

// ==========================================
// Trim Operation Types
// ==========================================

/**
 * Options for video analysis
 */
export interface AnalyzeOptions {
  /** Input video file path */
  inputPath: string;
  /** Output directory for analysis artifacts */
  outputDir?: string;
  /** Silence detection threshold in dB (default: -30) */
  silenceThreshold?: number;
  /** Minimum silence duration to detect in seconds (default: 0.5) */
  minSilenceDuration?: number;
  /** Maximum acceptable pause duration in seconds (default: 3) */
  maxAcceptablePause?: number;
  /** Scene change threshold (0-1, default: 0.3) */
  sceneThreshold?: number;
  /** Path to metadata JSON file (optional) */
  metadataPath?: string;
}

/**
 * Options for video trimming
 */
export interface TrimOptions {
  /** Input video file path */
  inputPath: string;
  /** Output video path */
  outputPath?: string;
  /** Path to analysis JSON file */
  analysisPath?: string;
  /** Video analysis object (if already loaded) */
  analysis?: VideoAnalysis;
  /** Minimum pause to keep in seconds (default: 1) */
  minPauseToKeep?: number;
  /** Keep original file (default: true) */
  keepOriginal?: boolean;
}

/**
 * Trim operation result
 */
export interface TrimResult {
  /** Original video path */
  originalPath: string;
  /** Trimmed video path */
  trimmedPath: string;
  /** Original duration in seconds */
  originalDuration: number;
  /** Trimmed duration in seconds */
  trimmedDuration: number;
  /** Segments that were removed */
  removedSegments: Array<{ startSec: number; endSec: number; reason: string }>;
  /** Segments that were kept */
  keptSegments: Array<{ startSec: number; endSec: number }>;
}

/**
 * Default video settings
 */
export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  width: 1920,
  height: 1080,
};
