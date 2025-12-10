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
}

/**
 * Default video settings
 */
export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  width: 1920,
  height: 1080,
};
