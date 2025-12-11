import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as readline from 'readline';
import type {
  DemoDefinition,
  DemoContext,
  TypeOptions,
  MoveOptions,
  ClickOptions,
  ZoomOptions,
  ScrollOptions,
  WaitForEnabledOptions,
  WaitForTextOptions,
  WaitForTextChangeOptions,
  WaitForHydrationOptions,
} from '../core/types';
import { DEFAULT_VIDEO_SETTINGS } from '../core/types';
import { logger } from '../utils/logger';

export interface DebugRunnerOptions {
  viewport?: { width: number; height: number };
}

interface DebugStep {
  action: string;
  selector?: string;
  args?: string;
}

/**
 * Debug runner for step-by-step demo execution
 */
export class DebugRunner {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private stepNumber = 0;
  private rl: readline.Interface | null = null;

  constructor(private options: DebugRunnerOptions = {}) {}

  /**
   * Run a demo in debug mode with step-by-step execution
   */
  async run(demo: DemoDefinition): Promise<void> {
    const viewport = this.options.viewport || {
      width: demo.video?.width || DEFAULT_VIDEO_SETTINGS.width,
      height: demo.video?.height || DEFAULT_VIDEO_SETTINGS.height,
    };

    // Setup readline for user input
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      // Launch browser in headed mode
      logger.info('Launching browser in debug mode...');
      this.browser = await chromium.launch({ headless: false });
      this.context = await this.browser.newContext({ viewport });
      const page = await this.context.newPage();

      logger.info(`Navigating to: ${demo.url}`);
      await page.goto(demo.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000); // Let page hydrate

      console.log('\n' + '═'.repeat(60));
      console.log('DEBUG MODE - Press Enter to continue, q to quit, s to skip');
      console.log('═'.repeat(60) + '\n');

      // Create debug context with wrapped helpers
      const demoContext = this.createDebugContext(page);

      // Run the demo
      await demo.run(demoContext);

      console.log('\n' + '═'.repeat(60));
      console.log('Demo completed successfully!');
      console.log(`Total steps executed: ${this.stepNumber}`);
      console.log('═'.repeat(60) + '\n');

      await this.waitForInput('Press Enter to close browser...');
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Execute a debug step with user prompt
   */
  private async executeStep<T>(
    page: Page,
    step: DebugStep,
    fn: () => Promise<T>
  ): Promise<T | undefined> {
    this.stepNumber++;

    const shouldContinue = await this.showStepAndWait(step);
    if (!shouldContinue) {
      console.log('  Skipped');
      return undefined;
    }

    try {
      const result = await fn();
      console.log('  \u2713 Completed');
      return result;
    } catch (error) {
      console.log(`  \u2717 Failed: ${(error as Error).message}`);

      // Show available elements if selector failed
      if (step.selector) {
        await this.showAvailableElements(page, step.selector);
      }

      const retry = await this.waitForInput('  Press Enter to retry, s to skip, q to quit: ');
      if (retry === 'q') {
        throw new Error('Debug session aborted by user');
      } else if (retry === 's') {
        console.log('  Skipped');
        return undefined;
      } else {
        // Retry
        return await fn();
      }
    }
  }

  /**
   * Create a debug context that wraps each helper with pause functionality
   */
  private createDebugContext(page: Page): DemoContext {
    const self = this;

    return {
      page,
      browser: this.browser!,
      context: this.context!,

      wait: async (ms: number): Promise<void> => {
        await self.executeStep(page, { action: 'wait', args: `${ms}ms` }, async () => {
          await page.waitForTimeout(ms);
        });
      },

      highlight: async (selector: string, durationMs = 500): Promise<void> => {
        await self.executeStep(page, { action: 'highlight', selector }, async () => {
          await page.evaluate(
            ({ sel, dur }) => {
              const element = document.querySelector(sel);
              if (!element) return;
              const overlay = document.createElement('div');
              const rect = element.getBoundingClientRect();
              overlay.style.cssText = `
                position: fixed;
                left: ${rect.left}px;
                top: ${rect.top}px;
                width: ${rect.width}px;
                height: ${rect.height}px;
                border: 3px solid #ff4444;
                box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
                pointer-events: none;
                z-index: 999999;
              `;
              document.body.appendChild(overlay);
              setTimeout(() => overlay.remove(), dur);
            },
            { sel: selector, dur: durationMs }
          );
          await page.waitForTimeout(durationMs);
        });
      },

      hideDevTools: async (): Promise<void> => {
        await self.executeStep(page, { action: 'hideDevTools' }, async () => {
          // No-op in debug mode
        });
      },

      typeAnimated: async (selector: string, text: string, _options?: TypeOptions): Promise<void> => {
        await self.executeStep(page, { action: 'typeAnimated', selector, args: `"${text}"` }, async () => {
          await page.fill(selector, text);
        });
      },

      moveTo: async (selector: string, _options?: MoveOptions): Promise<void> => {
        await self.executeStep(page, { action: 'moveTo', selector }, async () => {
          await page.hover(selector);
        });
      },

      clickAnimated: async (selector: string, options?: ClickOptions): Promise<void> => {
        await self.executeStep(page, { action: 'clickAnimated', selector }, async () => {
          if (options?.scrollIntoView !== false) {
            await page.locator(selector).scrollIntoViewIfNeeded();
          }
          await page.click(selector, { force: options?.force });
        });
      },

      zoomHighlight: async (selector: string, _options?: ZoomOptions): Promise<void> => {
        await self.executeStep(page, { action: 'zoomHighlight', selector }, async () => {
          await page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (!element) return;
            const rect = element.getBoundingClientRect();
            const overlay = document.createElement('div');
            overlay.style.cssText = `
              position: fixed;
              left: ${rect.left - 5}px;
              top: ${rect.top - 5}px;
              width: ${rect.width + 10}px;
              height: ${rect.height + 10}px;
              border: 3px solid #4444ff;
              border-radius: 8px;
              box-shadow: 0 0 15px rgba(68, 68, 255, 0.6);
              pointer-events: none;
              z-index: 999999;
            `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.remove(), 800);
          }, selector);
          await page.waitForTimeout(800);
        });
      },

      scrollToElement: async (selector: string, _options?: ScrollOptions): Promise<void> => {
        await self.executeStep(page, { action: 'scrollToElement', selector }, async () => {
          await page.locator(selector).scrollIntoViewIfNeeded();
        });
      },

      scrollBy: async (pixels: number, _options?: ScrollOptions): Promise<void> => {
        await self.executeStep(page, { action: 'scrollBy', args: `${pixels}px` }, async () => {
          await page.evaluate((px) => window.scrollBy(0, px), pixels);
        });
      },

      scrollToTop: async (_options?: ScrollOptions): Promise<void> => {
        await self.executeStep(page, { action: 'scrollToTop' }, async () => {
          await page.evaluate(() => window.scrollTo(0, 0));
        });
      },

      scrollToBottom: async (_options?: ScrollOptions): Promise<void> => {
        await self.executeStep(page, { action: 'scrollToBottom' }, async () => {
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        });
      },

      screenshot: async (_name?: string): Promise<string> => {
        const result = await self.executeStep(page, { action: 'screenshot' }, async () => {
          return '';
        });
        return result ?? '';
      },

      waitForEnabled: async (selector: string, options?: WaitForEnabledOptions): Promise<void> => {
        await self.executeStep(page, { action: 'waitForEnabled', selector }, async () => {
          const timeout = options?.timeout ?? 30000;
          await page.waitForSelector(`${selector}:not([disabled])`, { timeout });
        });
      },

      exists: async (selector: string): Promise<boolean> => {
        const element = await page.$(selector);
        return element !== null;
      },

      isVisible: async (selector: string): Promise<boolean> => {
        try {
          const element = await page.$(selector);
          if (!element) return false;
          return await element.isVisible();
        } catch {
          return false;
        }
      },

      waitForHydration: async (_options?: WaitForHydrationOptions): Promise<void> => {
        await self.executeStep(page, { action: 'waitForHydration' }, async () => {
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(500);
        });
      },

      waitForText: async (selector: string, text: string, options?: WaitForTextOptions): Promise<void> => {
        await self.executeStep(page, { action: 'waitForText', selector, args: `"${text}"` }, async () => {
          const timeout = options?.timeout ?? 30000;
          await page.waitForFunction(
            ({ sel, txt }) => {
              const el = document.querySelector(sel);
              return el?.textContent?.includes(txt);
            },
            { sel: selector, txt: text },
            { timeout }
          );
        });
      },

      waitForTextChange: async (selector: string, options?: WaitForTextChangeOptions): Promise<string> => {
        const result = await self.executeStep(page, { action: 'waitForTextChange', selector }, async () => {
          const timeout = options?.timeout ?? 30000;
          const initialText = options?.initialText ?? await page.textContent(selector) ?? '';
          await page.waitForFunction(
            ({ sel, initial }) => {
              const el = document.querySelector(sel);
              return el?.textContent?.trim() !== initial;
            },
            { sel: selector, initial: initialText },
            { timeout }
          );
          return await page.textContent(selector) ?? '';
        });
        return result ?? '';
      },

      uploadFile: async (selector: string, filePath: string): Promise<void> => {
        await self.executeStep(page, { action: 'uploadFile', selector, args: filePath }, async () => {
          const fileInput = await page.$(selector);
          if (!fileInput) throw new Error(`File input not found: ${selector}`);
          await fileInput.setInputFiles(filePath);
        });
      },

      waitForDownload: async (options?: { timeout?: number }): Promise<string> => {
        const result = await self.executeStep(page, { action: 'waitForDownload' }, async () => {
          const timeout = options?.timeout ?? 60000;
          const download = await page.waitForEvent('download', { timeout });
          return await download.path() ?? '';
        });
        return result ?? '';
      },
    };
  }

  /**
   * Show step information and wait for user input
   */
  private async showStepAndWait(step: DebugStep): Promise<boolean> {
    console.log(`\nStep ${this.stepNumber}: ${step.action}${step.selector ? `('${step.selector}')` : ''}${step.args ? ` ${step.args}` : ''}`);

    const input = await this.waitForInput('  [Enter to run, s to skip, q to quit]: ');

    if (input.toLowerCase() === 'q') {
      throw new Error('Debug session aborted by user');
    }

    return input.toLowerCase() !== 's';
  }

  /**
   * Show available elements that might match a failed selector
   */
  private async showAvailableElements(page: Page, failedSelector: string): Promise<void> {
    try {
      // Try to find similar elements
      const tagMatch = failedSelector.match(/^([a-z]+)/i);
      if (tagMatch) {
        const tag = tagMatch[1].toLowerCase();
        const elements = await page.$$eval(tag, (els) =>
          els.slice(0, 5).map((el) => {
            const testId = el.getAttribute('data-testid');
            const id = el.id;
            const classes = el.className;
            const text = el.textContent?.trim().substring(0, 30);
            return { testId, id, classes, text };
          })
        );

        if (elements.length > 0) {
          console.log(`\n  Available ${tag} elements on page:`);
          for (const el of elements) {
            const selectors = [];
            if (el.testId) selectors.push(`[data-testid="${el.testId}"]`);
            if (el.id) selectors.push(`#${el.id}`);
            if (el.classes) selectors.push(`.${el.classes.split(' ')[0]}`);
            console.log(`    - ${selectors.join(' or ')} "${el.text || ''}"`);
          }
        }
      }
    } catch {
      // Ignore errors in element discovery
    }
  }

  /**
   * Wait for user input
   */
  private waitForInput(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl!.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
