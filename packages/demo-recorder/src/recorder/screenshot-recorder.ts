import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import type {
  DemoDefinition,
  DemoContext,
  VideoSettings,
  ScreenshotSettings,
  ScreenshotCapture,
  ScreenshotResult,
  TypeOptions,
  MoveOptions,
  ClickOptions,
  ZoomOptions,
  ScrollOptions,
  WaitForEnabledOptions,
} from '../core/types';
import { DEFAULT_VIDEO_SETTINGS, DEFAULT_SCREENSHOT_SETTINGS } from '../core/types';
import { logger } from '../utils/logger';
import { generateGallery } from '../utils/gallery-generator';
import { parseViewport, type ViewportPreset } from '../core/viewports';
import {
  generateStepBadgeScript,
  generateTextAnnotationScript,
  generateRemoveAnnotationsScript,
  getActionDescription,
  type AnnotationOptions,
  DEFAULT_ANNOTATION_OPTIONS,
} from '../utils/annotations';

export interface ScreenshotRecorderOptions {
  /** Run browser in headed mode (visible window) */
  headed?: boolean;
  /** Generate HTML gallery (default: true) */
  gallery?: boolean;
  /** Viewport preset name or WxH string */
  viewport?: string;
  /** Add step numbers to screenshots */
  stepNumbers?: boolean;
  /** Step number badge position */
  stepPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Add action description captions */
  captions?: boolean;
}

export class ScreenshotRecorder {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private options: ScreenshotRecorderOptions;
  private captures: ScreenshotCapture[] = [];
  private screenshotDir: string = '';
  private settings: ScreenshotSettings = DEFAULT_SCREENSHOT_SETTINGS;
  private viewportPreset: ViewportPreset | undefined;
  private annotationOptions: AnnotationOptions;

  constructor(options: ScreenshotRecorderOptions = {}) {
    this.options = { gallery: true, ...options };

    // Parse viewport preset if provided
    if (options.viewport) {
      this.viewportPreset = parseViewport(options.viewport);
      if (!this.viewportPreset) {
        logger.warn(`Unknown viewport preset: ${options.viewport}, using default`);
      }
    }

    // Build annotation options
    this.annotationOptions = {
      ...DEFAULT_ANNOTATION_OPTIONS,
      stepNumbers: options.stepNumbers,
      stepPosition: options.stepPosition,
    };
  }

  /**
   * Capture screenshots from a demo
   */
  async capture(demo: DemoDefinition, outputDir: string): Promise<ScreenshotResult> {
    // Use viewport preset if provided, otherwise fall back to demo settings
    const videoSettings: VideoSettings = this.viewportPreset
      ? { width: this.viewportPreset.width, height: this.viewportPreset.height }
      : { ...DEFAULT_VIDEO_SETTINGS, ...demo.video };

    this.settings = {
      ...DEFAULT_SCREENSHOT_SETTINGS,
      ...demo.screenshot,
    };

    this.screenshotDir = path.join(outputDir, demo.id);
    await fs.mkdir(this.screenshotDir, { recursive: true });

    this.captures = [];

    logger.info(`Starting screenshot capture for: ${demo.name}`);
    if (this.viewportPreset) {
      logger.info(`Viewport: ${this.viewportPreset.name} (${videoSettings.width}x${videoSettings.height})`);
    } else {
      logger.info(`Resolution: ${videoSettings.width}x${videoSettings.height}`);
    }
    logger.info(`Format: ${this.settings.format}`);
    logger.info(`URL: ${demo.url}`);

    try {
      // Launch browser (no video recording)
      this.browser = await chromium.launch({
        headless: !this.options.headed,
      });

      // Build context options with viewport preset settings
      const contextOptions: Parameters<typeof this.browser.newContext>[0] = {
        viewport: {
          width: videoSettings.width,
          height: videoSettings.height,
        },
      };

      // Add mobile device settings if using a mobile preset
      if (this.viewportPreset) {
        if (this.viewportPreset.isMobile !== undefined) {
          contextOptions.isMobile = this.viewportPreset.isMobile;
        }
        if (this.viewportPreset.hasTouch !== undefined) {
          contextOptions.hasTouch = this.viewportPreset.hasTouch;
        }
        if (this.viewportPreset.deviceScaleFactor !== undefined) {
          contextOptions.deviceScaleFactor = this.viewportPreset.deviceScaleFactor;
        }
      }

      this.context = await this.browser.newContext(contextOptions);

      const page = await this.context.newPage();

      // Navigate to the demo URL
      logger.info('Navigating to URL...');
      await page.goto(demo.url, { waitUntil: 'networkidle' });

      // Hide dev tools immediately after page load
      await this.hideDevTools(page);

      // Initialize fake cursor for screenshots
      await this.initFakeCursor(page);

      // Create base demo context
      const baseContext = this.createBaseContext(page);

      // Wrap context for auto-capture
      const wrappedContext = this.wrapContextForAutoCapture(baseContext, page);

      // Run the user's demo script
      logger.info('Running demo script with auto-capture...');
      await demo.run(wrappedContext);

      // Close browser
      await this.context.close();
      this.context = null;

      // Generate gallery if enabled
      let galleryPath = '';
      if (this.options.gallery && this.captures.length > 0) {
        logger.info('Generating HTML gallery...');
        galleryPath = await generateGallery(this.captures, this.screenshotDir, demo.name);
      }

      logger.info(`Screenshot capture complete: ${this.captures.length} screenshots`);

      return {
        screenshots: this.captures,
        galleryPath,
        outputDir: this.screenshotDir,
      };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Create base demo context with all helpers
   */
  private createBaseContext(page: Page): DemoContext {
    return {
      page,
      browser: this.browser!,
      context: this.context!,
      wait: (ms: number) => page.waitForTimeout(ms),
      highlight: async (selector: string, durationMs = 500) => {
        await this.highlightElement(page, selector, durationMs);
      },
      hideDevTools: async () => {
        await this.hideDevTools(page);
      },
      typeAnimated: async (selector: string, text: string, options?: TypeOptions) => {
        await this.typeAnimated(page, selector, text, options);
      },
      moveTo: async (selector: string, options?: MoveOptions) => {
        await this.moveTo(page, selector, options);
      },
      clickAnimated: async (selector: string, options?: ClickOptions) => {
        await this.clickAnimated(page, selector, options);
      },
      zoomHighlight: async (selector: string, options?: ZoomOptions) => {
        await this.zoomHighlight(page, selector, options);
      },
      scrollToElement: async (selector: string, options?: ScrollOptions) => {
        await this.scrollToElement(page, selector, options);
      },
      scrollBy: async (pixels: number, options?: ScrollOptions) => {
        await this.scrollBy(page, pixels, options);
      },
      scrollToTop: async (options?: ScrollOptions) => {
        await this.scrollToTop(page, options);
      },
      scrollToBottom: async (options?: ScrollOptions) => {
        await this.scrollToBottom(page, options);
      },
      screenshot: async (name?: string) => {
        const capture = await this.captureScreenshot(page, name || `manual-${this.captures.length + 1}`, 'manual');
        return capture.filepath;
      },
      waitForEnabled: async (selector: string, options?: WaitForEnabledOptions) => {
        const timeout = options?.timeout ?? 30000;
        const interval = options?.interval ?? 100;
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
          const isEnabled = await page.evaluate((sel) => {
            const el = document.querySelector(sel) as HTMLButtonElement | HTMLInputElement;
            if (!el) return false;
            return !el.disabled && el.getAttribute('aria-disabled') !== 'true';
          }, selector);

          if (isEnabled) return;
          await page.waitForTimeout(interval);
        }
        throw new Error(`waitForEnabled: Element "${selector}" did not become enabled within ${timeout}ms`);
      },
      exists: async (selector: string) => {
        const element = await page.$(selector);
        return element !== null;
      },
      isVisible: async (selector: string) => {
        try {
          const element = await page.$(selector);
          if (!element) return false;
          return await element.isVisible();
        } catch {
          return false;
        }
      },
    };
  }

  /**
   * Wrap context to auto-capture after each interaction
   */
  private wrapContextForAutoCapture(baseContext: DemoContext, page: Page): DemoContext {
    return {
      ...baseContext,
      clickAnimated: async (selector: string, options?: ClickOptions) => {
        await baseContext.clickAnimated(selector, options);
        await this.captureScreenshot(page, `click-${this.captures.length + 1}`, 'click', selector);
      },
      typeAnimated: async (selector: string, text: string, options?: TypeOptions) => {
        await baseContext.typeAnimated(selector, text, options);
        await this.captureScreenshot(page, `type-${this.captures.length + 1}`, 'type', selector);
      },
      zoomHighlight: async (selector: string, options?: ZoomOptions) => {
        await baseContext.zoomHighlight(selector, options);
        await this.captureScreenshot(page, `highlight-${this.captures.length + 1}`, 'highlight', selector);
      },
      highlight: async (selector: string, durationMs = 500) => {
        await baseContext.highlight(selector, durationMs);
        await this.captureScreenshot(page, `highlight-${this.captures.length + 1}`, 'highlight', selector);
      },
      scrollToElement: async (selector: string, options?: ScrollOptions) => {
        await baseContext.scrollToElement(selector, options);
        await this.captureScreenshot(page, `scroll-${this.captures.length + 1}`, 'scroll', selector);
      },
    };
  }

  /**
   * Capture a screenshot and add to captures array
   */
  private async captureScreenshot(
    page: Page,
    name: string,
    action?: string,
    selector?: string
  ): Promise<ScreenshotCapture> {
    const index = this.captures.length + 1;
    const paddedIndex = String(index).padStart(3, '0');
    const filename = `screenshot-${paddedIndex}-${name}.${this.settings.format}`;
    const filepath = path.join(this.screenshotDir, filename);

    // Brief delay to ensure UI has settled
    await page.waitForTimeout(100);

    // Add step number badge if enabled
    if (this.options.stepNumbers) {
      await page.evaluate(generateStepBadgeScript(index, this.annotationOptions));
    }

    // Add caption if enabled
    if (this.options.captions && action) {
      const caption = getActionDescription(action, selector);
      if (caption) {
        await page.evaluate(generateTextAnnotationScript(caption, this.annotationOptions));
      }
    }

    // Take screenshot
    await page.screenshot({
      path: filepath,
      type: this.settings.format === 'jpeg' ? 'jpeg' : this.settings.format === 'webp' ? 'png' : 'png',
      quality: this.settings.format !== 'png' ? this.settings.quality : undefined,
      fullPage: this.settings.fullPage,
    });

    // Remove annotations after screenshot
    if (this.options.stepNumbers || this.options.captions) {
      await page.evaluate(generateRemoveAnnotationsScript());
    }

    const capture: ScreenshotCapture = {
      filepath,
      filename,
      timestamp: Date.now(),
      action,
      selector,
    };

    this.captures.push(capture);
    logger.info(`  Captured: ${filename}`);

    return capture;
  }

  /**
   * Highlight an element with a visual indicator (static for screenshots)
   */
  private async highlightElement(
    page: Page,
    selector: string,
    durationMs: number
  ): Promise<void> {
    try {
      await page.evaluate(
        ({ selector }) => {
          const element = document.querySelector(selector);
          if (!element) {
            console.warn(`Highlight: Element not found for selector: ${selector}`);
            return;
          }

          const overlay = document.createElement('div');
          overlay.id = '__demo-highlight';
          overlay.style.cssText = `
            position: absolute;
            border: 3px solid #ff4444;
            border-radius: 4px;
            pointer-events: none;
            z-index: 999999;
            box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
          `;

          const rect = element.getBoundingClientRect();
          overlay.style.top = `${rect.top + window.scrollY - 3}px`;
          overlay.style.left = `${rect.left + window.scrollX - 3}px`;
          overlay.style.width = `${rect.width + 6}px`;
          overlay.style.height = `${rect.height + 6}px`;

          document.body.appendChild(overlay);
        },
        { selector }
      );

      await page.waitForTimeout(durationMs);

      // Remove highlight
      await page.evaluate(() => {
        const highlight = document.getElementById('__demo-highlight');
        if (highlight) highlight.remove();
      });
    } catch {
      logger.warn(`Failed to highlight element: ${selector}`);
    }
  }

  /**
   * Hide development tools and logos (Next.js, etc.)
   */
  private async hideDevTools(page: Page): Promise<void> {
    await page.addStyleTag({
      content: `
        nextjs-portal,
        [data-nextjs-toast],
        [data-nextjs-dialog-overlay],
        #__next-build-watcher,
        [class*="nextjs"],
        [class*="__next"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `,
    });
  }

  /**
   * Initialize a fake cursor element for visible mouse position
   */
  private async initFakeCursor(page: Page): Promise<void> {
    await page.evaluate(() => {
      if (document.getElementById('__demo-cursor')) return;

      const cursor = document.createElement('div');
      cursor.id = '__demo-cursor';
      cursor.innerHTML = `
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 4V28L13.5 22.5L17.5 30H21.5L17.5 22H24L8 4Z" fill="black"/>
          <path d="M10 8V24L14 20L18 28H20L16 20H21L10 8Z" fill="white"/>
        </svg>
      `;
      cursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 32px;
        height: 32px;
        pointer-events: none;
        z-index: 999999;
        transform: translate(0, 0);
        filter: drop-shadow(2px 2px 3px rgba(0,0,0,0.4));
      `;
      document.body.appendChild(cursor);
    });
  }

  /**
   * Update cursor position
   */
  private async updateCursorPosition(page: Page, x: number, y: number): Promise<void> {
    await page.evaluate(
      ({ x, y }) => {
        const cursor = document.getElementById('__demo-cursor');
        if (cursor) {
          cursor.style.left = `${x}px`;
          cursor.style.top = `${y}px`;
        }
      },
      { x, y }
    );
  }

  /**
   * Type text with character-by-character animation
   */
  private async typeAnimated(
    page: Page,
    selector: string,
    text: string,
    options?: TypeOptions
  ): Promise<void> {
    const delay = options?.delay ?? 50;
    const variation = options?.variation ?? 20;

    try {
      await page.click(selector);
      await page.waitForTimeout(100);

      for (const char of text) {
        await page.keyboard.type(char);
        const actualDelay = delay + Math.floor(Math.random() * variation * 2) - variation;
        await page.waitForTimeout(Math.max(10, actualDelay));
      }
    } catch {
      logger.warn(`Failed to type in element: ${selector}`);
    }
  }

  /**
   * Move cursor to an element (simplified for screenshots - just position cursor)
   */
  private async moveTo(page: Page, selector: string, options?: MoveOptions): Promise<void> {
    try {
      const element = await page.$(selector);
      if (!element) {
        logger.warn(`Element not found for moveTo: ${selector}`);
        return;
      }

      const box = await element.boundingBox();
      if (!box) return;

      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;

      await this.updateCursorPosition(page, targetX, targetY);
      await page.mouse.move(targetX, targetY);

      // Brief pause to let UI update
      await page.waitForTimeout(options?.duration ?? 100);
    } catch {
      logger.warn(`Failed to move to element: ${selector}`);
    }
  }

  /**
   * Animated click (simplified for screenshots)
   */
  private async clickAnimated(page: Page, selector: string, options?: ClickOptions): Promise<void> {
    const force = options?.force ?? false;
    const scrollIntoView = options?.scrollIntoView ?? true;

    try {
      // Auto-scroll element into view first
      if (scrollIntoView) {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (el) {
            el.scrollIntoView({ behavior: 'instant', block: 'center' });
          }
        }, selector);
        await page.waitForTimeout(100);
      }

      // Check element exists
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`clickAnimated: Element not found for selector "${selector}"`);
      }

      // Check element has bounding box (is renderable)
      const box = await element.boundingBox();
      if (!box && !force) {
        const state = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return { exists: false };
          const style = window.getComputedStyle(el);
          return {
            exists: true,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            offsetParent: !!(el as HTMLElement).offsetParent,
          };
        }, selector);

        throw new Error(
          `clickAnimated: Element "${selector}" has no bounding box. ` +
          `State: display=${state.display}, visibility=${state.visibility}, ` +
          `opacity=${state.opacity}, offsetParent=${state.offsetParent}`
        );
      }

      await this.moveTo(page, selector, { duration: options?.moveDuration ?? 100 });
      await page.waitForTimeout(options?.hoverDuration ?? 100);
      await page.click(selector, { force });
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('clickAnimated:')) {
        throw error;
      }
      logger.warn(`Failed to click element: ${selector} - ${error}`);
      throw error;
    }
  }

  /**
   * Zoom highlight effect (static overlay for screenshots)
   */
  private async zoomHighlight(page: Page, selector: string, options?: ZoomOptions): Promise<void> {
    const duration = options?.duration ?? 300;

    try {
      await page.evaluate(
        ({ selector }) => {
          const element = document.querySelector(selector) as HTMLElement;
          if (!element) return;

          const rect = element.getBoundingClientRect();

          const overlay = document.createElement('div');
          overlay.id = '__demo-zoom-highlight';
          overlay.style.cssText = `
            position: fixed;
            top: ${rect.top - 4}px;
            left: ${rect.left - 4}px;
            width: ${rect.width + 8}px;
            height: ${rect.height + 8}px;
            border: 3px solid #4285f4;
            border-radius: 8px;
            pointer-events: none;
            z-index: 999997;
            box-shadow: 0 0 20px rgba(66, 133, 244, 0.5), 0 0 40px rgba(66, 133, 244, 0.3);
          `;

          document.body.appendChild(overlay);
        },
        { selector }
      );

      await page.waitForTimeout(duration);

      // Remove overlay
      await page.evaluate(() => {
        const overlay = document.getElementById('__demo-zoom-highlight');
        if (overlay) overlay.remove();
      });
    } catch {
      logger.warn(`Failed to zoom highlight element: ${selector}`);
    }
  }

  /**
   * Scroll to element (instant for screenshots)
   */
  private async scrollToElement(page: Page, selector: string, options?: ScrollOptions): Promise<void> {
    try {
      await page.evaluate(
        ({ selector, offset }) => {
          const element = document.querySelector(selector);
          if (!element) return;

          const rect = element.getBoundingClientRect();
          const targetY = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2 + (offset || 0);
          window.scrollTo(0, targetY);
        },
        { selector, offset: options?.offset ?? 0 }
      );

      await page.waitForTimeout(100);
    } catch {
      logger.warn(`Failed to scroll to element: ${selector}`);
    }
  }

  /**
   * Scroll by pixels
   */
  private async scrollBy(page: Page, pixels: number, _options?: ScrollOptions): Promise<void> {
    try {
      await page.evaluate((px) => window.scrollBy(0, px), pixels);
      await page.waitForTimeout(100);
    } catch {
      logger.warn(`Failed to scroll by ${pixels}px`);
    }
  }

  /**
   * Scroll to top
   */
  private async scrollToTop(page: Page, _options?: ScrollOptions): Promise<void> {
    try {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);
    } catch {
      logger.warn('Failed to scroll to top');
    }
  }

  /**
   * Scroll to bottom
   */
  private async scrollToBottom(page: Page, _options?: ScrollOptions): Promise<void> {
    try {
      await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight);
      });
      await page.waitForTimeout(100);
    } catch {
      logger.warn('Failed to scroll to bottom');
    }
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.context) {
      try {
        await this.context.close();
      } catch {
        // Ignore errors during cleanup
      }
      this.context = null;
    }

    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Ignore errors during cleanup
      }
      this.browser = null;
    }
  }
}
