import { chromium, Browser, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import type {
  DemoDefinition,
  DemoContext,
  VideoSettings,
  RecordingResult,
  TypeOptions,
  MoveOptions,
  ClickOptions,
  ZoomOptions,
  ScrollOptions,
  IntroOptions,
  OutroOptions,
} from '../core/types';
import { DEFAULT_VIDEO_SETTINGS } from '../core/types';
import { logger } from '../utils/logger';

export interface RecorderOptions {
  /** Run browser in headed mode (visible window) */
  headed?: boolean;
}

export class PlaywrightRecorder {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private options: RecorderOptions;

  constructor(options: RecorderOptions = {}) {
    this.options = options;
  }

  /**
   * Record a demo and return the path to the recorded video
   */
  async record(demo: DemoDefinition, outputDir: string): Promise<RecordingResult> {
    const settings: VideoSettings = {
      ...DEFAULT_VIDEO_SETTINGS,
      ...demo.video,
    };

    const videoDir = path.join(outputDir, demo.id);
    await fs.mkdir(videoDir, { recursive: true });

    const startTime = Date.now();

    logger.info(`Starting recording for: ${demo.name}`);
    logger.info(`Resolution: ${settings.width}x${settings.height}`);
    logger.info(`URL: ${demo.url}`);

    try {
      // Launch browser with video recording enabled
      this.browser = await chromium.launch({
        headless: !this.options.headed,
      });

      this.context = await this.browser.newContext({
        viewport: {
          width: settings.width,
          height: settings.height,
        },
        recordVideo: {
          dir: videoDir,
          size: {
            width: settings.width,
            height: settings.height,
          },
        },
      });

      const page = await this.context.newPage();

      // Navigate to the demo URL
      logger.info('Navigating to URL...');
      await page.goto(demo.url, { waitUntil: 'networkidle' });

      // Hide dev tools immediately after page load
      await this.hideDevTools(page);

      // Initialize fake cursor for animations
      await this.initFakeCursor(page);

      // Show intro effects if configured
      if (demo.intro) {
        logger.info('Playing intro...');
        await this.showIntro(page, demo.intro);
      }

      // Create the demo context with helpers
      const demoContext: DemoContext = {
        page,
        browser: this.browser,
        context: this.context,
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
        screenshot: async (_name?: string) => {
          // In video mode, screenshots are a no-op (video captures everything)
          // Return empty string since no file is created
          return '';
        },
      };

      // Run the user's demo script
      logger.info('Running demo script...');
      await demo.run(demoContext);

      // Show outro effects if configured
      if (demo.outro) {
        logger.info('Playing outro...');
        await this.showOutro(page, demo.outro);
      }

      // Small delay to ensure final state is captured
      await page.waitForTimeout(500);

      // Close context to finalize video
      await this.context.close();
      this.context = null;

      // Get the video path (Playwright generates a random filename)
      const videoPath = await this.findRecordedVideo(videoDir);
      const durationMs = Date.now() - startTime;

      logger.info(`Recording complete: ${videoPath}`);
      logger.info(`Duration: ${(durationMs / 1000).toFixed(1)}s`);

      return { videoPath, durationMs };
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Highlight an element with a visual indicator
   */
  private async highlightElement(
    page: Page,
    selector: string,
    durationMs: number
  ): Promise<void> {
    try {
      await page.evaluate(
        ({ selector, durationMs }) => {
          const element = document.querySelector(selector);
          if (!element) {
            console.warn(`Highlight: Element not found for selector: ${selector}`);
            return;
          }

          const overlay = document.createElement('div');
          overlay.style.cssText = `
            position: absolute;
            border: 3px solid #ff4444;
            border-radius: 4px;
            pointer-events: none;
            z-index: 999999;
            box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
            transition: opacity 0.2s ease-out;
          `;

          const rect = element.getBoundingClientRect();
          overlay.style.top = `${rect.top + window.scrollY - 3}px`;
          overlay.style.left = `${rect.left + window.scrollX - 3}px`;
          overlay.style.width = `${rect.width + 6}px`;
          overlay.style.height = `${rect.height + 6}px`;

          document.body.appendChild(overlay);

          setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
          }, durationMs);
        },
        { selector, durationMs }
      );

      await page.waitForTimeout(durationMs + 200);
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
   * Initialize a fake cursor element for visible mouse movement
   */
  private async initFakeCursor(page: Page): Promise<void> {
    await page.evaluate(() => {
      // Create cursor element if it doesn't exist
      if (document.getElementById('__demo-cursor')) return;

      const cursor = document.createElement('div');
      cursor.id = '__demo-cursor';
      // Traditional macOS-style arrow cursor, larger size
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
   * Cursor SVG definitions
   */
  private readonly cursorSvgs = {
    arrow: `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 4V28L13.5 22.5L17.5 30H21.5L17.5 22H24L8 4Z" fill="black"/>
        <path d="M10 8V24L14 20L18 28H20L16 20H21L10 8Z" fill="white"/>
      </svg>
    `,
    hand: `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 6C17 4.89543 17.8954 4 19 4C20.1046 4 21 4.89543 21 6V14H17V6Z" fill="black"/>
        <path d="M12 8C12 6.89543 12.8954 6 14 6C15.1046 6 16 6.89543 16 8V14H12V8Z" fill="black"/>
        <path d="M7 11C7 9.89543 7.89543 9 9 9C10.1046 9 11 9.89543 11 11V14H7V11Z" fill="black"/>
        <path d="M22 10C22 8.89543 22.8954 8 24 8C25.1046 8 26 8.89543 26 10V18C26 23.5228 21.5228 28 16 28H14C9.58172 28 6 24.4183 6 20V14H7V20C7 23.866 10.134 27 14 27H16C21.5228 27 25 22.9706 25 18V10C25 9.44772 24.5523 9 24 9C23.4477 9 23 9.44772 23 10V15H22V10Z" fill="black"/>
        <path d="M18 7C18 5.44772 18.4477 5 19 5C19.5523 5 20 5.44772 20 7V14H18V7Z" fill="white"/>
        <path d="M13 9C13 7.44772 13.4477 7 14 7C14.5523 7 15 7.44772 15 9V14H13V9Z" fill="white"/>
        <path d="M8 12C8 10.4477 8.44772 10 9 10C9.55228 10 10 10.4477 10 12V14H8V12Z" fill="white"/>
      </svg>
    `,
    text: `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 4V28" stroke="black" stroke-width="3" stroke-linecap="round"/>
        <path d="M12 4H20" stroke="black" stroke-width="3" stroke-linecap="round"/>
        <path d="M12 28H20" stroke="black" stroke-width="3" stroke-linecap="round"/>
        <path d="M16 5V27" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M13 5H19" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M13 27H19" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `,
    grab: `
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 14V12C10 10.8954 10.8954 10 12 10C13.1046 10 14 10.8954 14 12V14" fill="black"/>
        <path d="M14 14V11C14 9.89543 14.8954 9 16 9C17.1046 9 18 9.89543 18 11V14" fill="black"/>
        <path d="M18 14V12C18 10.8954 18.8954 10 20 10C21.1046 10 22 10.8954 22 12V14" fill="black"/>
        <path d="M22 14V13C22 11.8954 22.8954 11 24 11C25.1046 11 26 11.8954 26 13V20C26 24.4183 22.4183 28 18 28H14C9.58172 28 6 24.4183 6 20V17C6 15.8954 6.89543 15 8 15C9.10457 15 10 15.8954 10 17V14" fill="black"/>
        <rect x="7" y="16" width="2" height="4" rx="1" fill="white"/>
        <rect x="11" y="11" width="2" height="7" rx="1" fill="white"/>
        <rect x="15" y="10" width="2" height="8" rx="1" fill="white"/>
        <rect x="19" y="11" width="2" height="7" rx="1" fill="white"/>
        <rect x="23" y="12" width="2" height="6" rx="1" fill="white"/>
      </svg>
    `,
  };

  /**
   * Set the cursor style
   */
  private async setCursorStyle(page: Page, type: 'arrow' | 'hand' | 'text' | 'grab'): Promise<void> {
    const svg = this.cursorSvgs[type];
    await page.evaluate(
      ({ svg }) => {
        const cursor = document.getElementById('__demo-cursor');
        if (cursor) {
          cursor.innerHTML = svg;
        }
      },
      { svg }
    );
  }

  /**
   * Auto-detect cursor type based on element
   */
  private async detectCursorType(
    page: Page,
    selector: string
  ): Promise<'arrow' | 'hand' | 'text' | 'grab'> {
    return await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return 'arrow';

      const tag = el.tagName.toLowerCase();
      const type = el.getAttribute('type');
      const role = el.getAttribute('role');
      const computed = window.getComputedStyle(el);

      // Check for clickable elements
      if (
        tag === 'a' ||
        tag === 'button' ||
        role === 'button' ||
        role === 'link' ||
        computed.cursor === 'pointer'
      ) {
        return 'hand';
      }

      // Check for text inputs
      if (
        (tag === 'input' &&
          ['text', 'email', 'password', 'search', 'tel', 'url', 'number'].includes(type || '')) ||
        tag === 'textarea' ||
        el.getAttribute('contenteditable') === 'true'
      ) {
        return 'text';
      }

      // Check for draggable
      if ((el as HTMLElement).draggable || computed.cursor === 'grab') {
        return 'grab';
      }

      return 'arrow';
    }, selector);
  }

  /**
   * Move the fake cursor to a position
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
      // Focus the element first
      await page.click(selector);
      await page.waitForTimeout(100);

      // Type each character with variation
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
   * Move cursor smoothly to an element
   */
  private async moveTo(page: Page, selector: string, options?: MoveOptions): Promise<void> {
    const duration = options?.duration ?? 500;
    const steps = options?.steps ?? 20;

    try {
      const element = await page.$(selector);
      if (!element) {
        logger.warn(`Element not found for moveTo: ${selector}`);
        return;
      }

      const box = await element.boundingBox();
      if (!box) return;

      // Target center of element
      const targetX = box.x + box.width / 2;
      const targetY = box.y + box.height / 2;

      // Get current cursor position (or start from corner)
      const currentPos = await page.evaluate(() => {
        const cursor = document.getElementById('__demo-cursor');
        if (cursor) {
          return {
            x: parseFloat(cursor.style.left) || 100,
            y: parseFloat(cursor.style.top) || 100,
          };
        }
        return { x: 100, y: 100 };
      });

      // Animate cursor movement with easing
      const stepDelay = duration / steps;
      for (let i = 1; i <= steps; i++) {
        const progress = i / steps;
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const x = currentPos.x + (targetX - currentPos.x) * eased;
        const y = currentPos.y + (targetY - currentPos.y) * eased;

        await this.updateCursorPosition(page, x, y);
        await page.mouse.move(x, y);
        await page.waitForTimeout(stepDelay);
      }

      // Auto-switch cursor style based on target element
      const cursorType = await this.detectCursorType(page, selector);
      await this.setCursorStyle(page, cursorType);
    } catch {
      logger.warn(`Failed to move to element: ${selector}`);
    }
  }

  /**
   * Animated click: move to element, hover, then click
   */
  private async clickAnimated(page: Page, selector: string, options?: ClickOptions): Promise<void> {
    const hoverDuration = options?.hoverDuration ?? 200;
    const moveDuration = options?.moveDuration ?? 400;

    try {
      // Move cursor to element
      await this.moveTo(page, selector, { duration: moveDuration });

      // Brief hover
      await page.waitForTimeout(hoverDuration);

      // Add click ripple effect
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('div');
        ripple.style.cssText = `
          position: fixed;
          left: ${rect.left + rect.width / 2}px;
          top: ${rect.top + rect.height / 2}px;
          width: 10px;
          height: 10px;
          background: rgba(66, 133, 244, 0.4);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          pointer-events: none;
          z-index: 999998;
          animation: __demo-ripple 0.4s ease-out forwards;
        `;

        // Add keyframes if not exists
        if (!document.getElementById('__demo-ripple-style')) {
          const style = document.createElement('style');
          style.id = '__demo-ripple-style';
          style.textContent = `
            @keyframes __demo-ripple {
              0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
              100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }

        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 400);
      }, selector);

      // Perform the click
      await page.click(selector);

      // Reset cursor to arrow after click
      await page.waitForTimeout(100);
      await this.setCursorStyle(page, 'arrow');
    } catch {
      logger.warn(`Failed to click element: ${selector}`);
    }
  }

  /**
   * Highlight with zoom/scale effect
   */
  private async zoomHighlight(page: Page, selector: string, options?: ZoomOptions): Promise<void> {
    const scale = options?.scale ?? 1.05;
    const duration = options?.duration ?? 600;

    try {
      await page.evaluate(
        ({ selector, scale, duration }) => {
          const element = document.querySelector(selector) as HTMLElement;
          if (!element) return;

          const rect = element.getBoundingClientRect();

          // Create highlight overlay
          const overlay = document.createElement('div');
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
            transform: scale(1);
            animation: __demo-zoom ${duration}ms ease-in-out forwards;
          `;

          // Add keyframes if not exists
          if (!document.getElementById('__demo-zoom-style')) {
            const style = document.createElement('style');
            style.id = '__demo-zoom-style';
            style.textContent = `
              @keyframes __demo-zoom {
                0% { transform: scale(1); opacity: 0; }
                20% { transform: scale(${scale}); opacity: 1; }
                80% { transform: scale(${scale}); opacity: 1; }
                100% { transform: scale(1); opacity: 0; }
              }
            `;
            document.head.appendChild(style);
          }

          document.body.appendChild(overlay);
          setTimeout(() => overlay.remove(), duration);
        },
        { selector, scale, duration }
      );

      await page.waitForTimeout(duration);
    } catch {
      logger.warn(`Failed to zoom highlight element: ${selector}`);
    }
  }

  /**
   * Smooth scroll to an element
   */
  private async scrollToElement(
    page: Page,
    selector: string,
    options?: ScrollOptions
  ): Promise<void> {
    const duration = options?.duration ?? 600;
    const easing = options?.easing ?? 'ease-out';
    const offset = options?.offset ?? 0;

    try {
      await page.evaluate(
        ({ selector, duration, easing, offset }) => {
          const element = document.querySelector(selector);
          if (!element) {
            console.warn(`ScrollToElement: Element not found for selector: ${selector}`);
            return;
          }

          const rect = element.getBoundingClientRect();
          const targetY = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2 + offset;

          // Custom easing functions
          const easingFunctions: Record<string, (t: number) => number> = {
            linear: (t) => t,
            'ease-in': (t) => t * t,
            'ease-out': (t) => t * (2 - t),
            'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
          };

          const easeFn = easingFunctions[easing] || easingFunctions['ease-out'];
          const startY = window.scrollY;
          const distance = targetY - startY;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeFn(progress);

            window.scrollTo(0, startY + distance * easedProgress);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        },
        { selector, duration, easing, offset }
      );

      await page.waitForTimeout(duration + 50);
    } catch {
      logger.warn(`Failed to scroll to element: ${selector}`);
    }
  }

  /**
   * Smooth scroll by a number of pixels
   */
  private async scrollBy(page: Page, pixels: number, options?: ScrollOptions): Promise<void> {
    const duration = options?.duration ?? 600;
    const easing = options?.easing ?? 'ease-out';

    try {
      await page.evaluate(
        ({ pixels, duration, easing }) => {
          const easingFunctions: Record<string, (t: number) => number> = {
            linear: (t) => t,
            'ease-in': (t) => t * t,
            'ease-out': (t) => t * (2 - t),
            'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
          };

          const easeFn = easingFunctions[easing] || easingFunctions['ease-out'];
          const startY = window.scrollY;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeFn(progress);

            window.scrollTo(0, startY + pixels * easedProgress);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        },
        { pixels, duration, easing }
      );

      await page.waitForTimeout(duration + 50);
    } catch {
      logger.warn(`Failed to scroll by ${pixels}px`);
    }
  }

  /**
   * Smooth scroll to top of page
   */
  private async scrollToTop(page: Page, options?: ScrollOptions): Promise<void> {
    const duration = options?.duration ?? 600;
    const easing = options?.easing ?? 'ease-out';

    try {
      await page.evaluate(
        ({ duration, easing }) => {
          const easingFunctions: Record<string, (t: number) => number> = {
            linear: (t) => t,
            'ease-in': (t) => t * t,
            'ease-out': (t) => t * (2 - t),
            'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
          };

          const easeFn = easingFunctions[easing] || easingFunctions['ease-out'];
          const startY = window.scrollY;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeFn(progress);

            window.scrollTo(0, startY * (1 - easedProgress));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        },
        { duration, easing }
      );

      await page.waitForTimeout(duration + 50);
    } catch {
      logger.warn('Failed to scroll to top');
    }
  }

  /**
   * Smooth scroll to bottom of page
   */
  private async scrollToBottom(page: Page, options?: ScrollOptions): Promise<void> {
    const duration = options?.duration ?? 600;
    const easing = options?.easing ?? 'ease-out';

    try {
      await page.evaluate(
        ({ duration, easing }) => {
          const easingFunctions: Record<string, (t: number) => number> = {
            linear: (t) => t,
            'ease-in': (t) => t * t,
            'ease-out': (t) => t * (2 - t),
            'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
          };

          const easeFn = easingFunctions[easing] || easingFunctions['ease-out'];
          const startY = window.scrollY;
          const targetY = document.documentElement.scrollHeight - window.innerHeight;
          const distance = targetY - startY;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeFn(progress);

            window.scrollTo(0, startY + distance * easedProgress);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        },
        { duration, easing }
      );

      await page.waitForTimeout(duration + 50);
    } catch {
      logger.warn('Failed to scroll to bottom');
    }
  }

  /**
   * Show intro effects (fade in and/or title card)
   */
  private async showIntro(page: Page, options?: IntroOptions): Promise<void> {
    if (!options) return;

    const { fadeIn, fadeDuration = 800, titleCard } = options;

    try {
      // Create overlay for effects
      await page.evaluate(
        ({ fadeIn, fadeDuration, titleCard }) => {
          // Add intro styles
          if (!document.getElementById('__demo-intro-style')) {
            const style = document.createElement('style');
            style.id = '__demo-intro-style';
            style.textContent = `
              @keyframes __demo-fade-in {
                from { opacity: 1; }
                to { opacity: 0; }
              }
              @keyframes __demo-title-in {
                0% { opacity: 0; transform: scale(0.9); }
                20% { opacity: 1; transform: scale(1); }
                80% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(1.05); }
              }
            `;
            document.head.appendChild(style);
          }

          // Fade in from black
          if (fadeIn) {
            const fadeOverlay = document.createElement('div');
            fadeOverlay.id = '__demo-fade-overlay';
            fadeOverlay.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: #000;
              z-index: 1000000;
              animation: __demo-fade-in ${fadeDuration}ms ease-out forwards;
            `;
            document.body.appendChild(fadeOverlay);
            setTimeout(() => fadeOverlay.remove(), fadeDuration);
          }

          // Title card
          if (titleCard) {
            const {
              title,
              subtitle,
              duration: cardDuration = 2000,
              background = '#000',
              textColor = '#fff',
            } = titleCard;

            const card = document.createElement('div');
            card.id = '__demo-title-card';
            card.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100vw;
              height: 100vh;
              background: ${background};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              z-index: 1000001;
              animation: __demo-title-in ${cardDuration}ms ease-in-out forwards;
            `;

            const titleEl = document.createElement('h1');
            titleEl.textContent = title;
            titleEl.style.cssText = `
              color: ${textColor};
              font-size: 64px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-weight: 700;
              margin: 0;
              padding: 0 40px;
              text-align: center;
            `;
            card.appendChild(titleEl);

            if (subtitle) {
              const subtitleEl = document.createElement('p');
              subtitleEl.textContent = subtitle;
              subtitleEl.style.cssText = `
                color: ${textColor};
                font-size: 28px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-weight: 400;
                margin-top: 20px;
                opacity: 0.8;
                padding: 0 40px;
                text-align: center;
              `;
              card.appendChild(subtitleEl);
            }

            document.body.appendChild(card);
            setTimeout(() => card.remove(), cardDuration);
          }
        },
        { fadeIn, fadeDuration, titleCard }
      );

      // Wait for effects to complete
      const totalDuration = Math.max(
        fadeIn ? fadeDuration : 0,
        titleCard?.duration ?? 0
      );
      if (totalDuration > 0) {
        await page.waitForTimeout(totalDuration + 100);
      }
    } catch {
      logger.warn('Failed to show intro');
    }
  }

  /**
   * Show outro effects (fade out to black)
   */
  private async showOutro(page: Page, options?: OutroOptions): Promise<void> {
    if (!options) return;

    const { fadeOut, fadeDuration = 800 } = options;

    if (!fadeOut) return;

    try {
      await page.evaluate(
        ({ fadeDuration }) => {
          // Add outro styles
          if (!document.getElementById('__demo-outro-style')) {
            const style = document.createElement('style');
            style.id = '__demo-outro-style';
            style.textContent = `
              @keyframes __demo-fade-out {
                from { opacity: 0; }
                to { opacity: 1; }
              }
            `;
            document.head.appendChild(style);
          }

          const fadeOverlay = document.createElement('div');
          fadeOverlay.id = '__demo-fade-out-overlay';
          fadeOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            z-index: 1000000;
            animation: __demo-fade-out ${fadeDuration}ms ease-in forwards;
          `;
          document.body.appendChild(fadeOverlay);
        },
        { fadeDuration }
      );

      await page.waitForTimeout(fadeDuration + 100);
    } catch {
      logger.warn('Failed to show outro');
    }
  }

  private async findRecordedVideo(dir: string): Promise<string> {
    const files = await fs.readdir(dir);
    const webmFile = files.find((f) => f.endsWith('.webm'));

    if (!webmFile) {
      throw new Error(`No video file found in ${dir}`);
    }

    return path.join(dir, webmFile);
  }

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
