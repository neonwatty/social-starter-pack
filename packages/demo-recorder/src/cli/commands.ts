import path from 'path';
import fs from 'fs/promises';
import ora from 'ora';
import { chromium } from 'playwright';
import { PlaywrightRecorder } from '../recorder/playwright-recorder';
import { ScreenshotRecorder } from '../recorder/screenshot-recorder';
import { convertToMp4, checkFfmpegInstalled, extractThumbnail } from '../recorder/video-processor';
import { convertToGif } from '../recorder/gif-processor';
import { loadDemo, listDemos } from '../core/demo-loader';
import { logger } from '../utils/logger';
import { generateMarkdownFromDirectory } from '../utils/markdown-generator';
import { generateEmbedFile } from '../utils/embed-generator';
import { MOBILE_PRESETS, DESKTOP_PRESETS, parseViewport } from '../core/viewports';
import type { ScreenshotSettings } from '../core/types';

export interface RecordOptions {
  output: string;
  convert: boolean;
  headed: boolean;
  headedDebug?: boolean;
  stepThrough?: boolean;
}

export interface InspectOptions {
  viewport?: string;
  format: 'table' | 'json';
  headed: boolean;
}

export interface CreateOptions {
  url: string;
  name?: string;
  dir: string;
  record: boolean;
  output: string;
  headed: boolean;
}

export interface ScreenshotOptions {
  output: string;
  format: 'png' | 'jpeg' | 'webp';
  quality: string;
  fullPage: boolean;
  headed: boolean;
  gallery: boolean;
  viewport?: string;
  stepNumbers: boolean;
  stepPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  captions: boolean;
}

export interface ThumbnailOptions {
  output?: string;
  time?: string;
  width: string;
  format: 'png' | 'jpeg' | 'webp';
  quality: string;
}

export interface GifOptions {
  output?: string;
  fps: string;
  width: string;
  colors: string;
  dither: boolean;
  fast: boolean;
}

export interface MarkdownOptions {
  output?: string;
  title?: string;
  description?: string;
  timestamps: boolean;
  selectors: boolean;
}

export interface EmbedOptions {
  output?: string;
  width: string;
  height?: string;
  autoplay: boolean;
  loop: boolean;
  muted: boolean;
  poster?: string;
}

/**
 * Record command - records video from a demo definition
 */
export async function recordCommand(demoFile: string, options: RecordOptions): Promise<void> {
  const spinner = ora('Loading demo definition...').start();

  try {
    const demoPath = path.resolve(demoFile);
    const demo = await loadDemo(demoPath);
    spinner.succeed(`Loaded demo: ${demo.name}`);

    // Check FFmpeg if conversion is needed
    if (options.convert) {
      const hasFfmpeg = await checkFfmpegInstalled();
      if (!hasFfmpeg) {
        spinner.warn('FFmpeg not found - video will be saved as WebM');
      }
    }

    // Record the video
    spinner.start('Recording demo...');
    const recorder = new PlaywrightRecorder({
      headed: options.headed || options.headedDebug,
      debug: options.headedDebug,
      stepThrough: options.stepThrough,
    });
    const { videoPath, durationMs } = await recorder.record(demo, options.output);
    spinner.succeed(`Recording complete (${(durationMs / 1000).toFixed(1)}s)`);

    // Convert to MP4 if needed
    let finalPath = videoPath;
    if (options.convert) {
      const hasFfmpeg = await checkFfmpegInstalled();
      if (hasFfmpeg) {
        spinner.start('Converting to MP4...');
        finalPath = await convertToMp4({ inputPath: videoPath });
        spinner.succeed('Conversion complete');
      }
    }

    console.log('\n========================================');
    console.log('Recording saved!');
    console.log(`File: ${finalPath}`);
    console.log('========================================\n');
  } catch (error) {
    spinner.fail('Recording failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Screenshot command - captures screenshots from a demo definition
 */
export async function screenshotCommand(demoFile: string, options: ScreenshotOptions): Promise<void> {
  const spinner = ora('Loading demo definition...').start();

  try {
    const demoPath = path.resolve(demoFile);
    const demo = await loadDemo(demoPath);
    spinner.succeed(`Loaded demo: ${demo.name}`);

    // Build screenshot settings and merge with demo settings
    const screenshotSettings: Partial<ScreenshotSettings> = {
      ...demo.screenshot,
      format: options.format,
      quality: parseInt(options.quality, 10),
      fullPage: options.fullPage,
    };

    // Merge settings into demo
    const demoWithSettings = {
      ...demo,
      screenshot: screenshotSettings,
    };

    // Capture screenshots
    spinner.start('Capturing screenshots...');
    const recorder = new ScreenshotRecorder({
      headed: options.headed,
      gallery: options.gallery,
      viewport: options.viewport,
      stepNumbers: options.stepNumbers,
      stepPosition: options.stepPosition,
      captions: options.captions,
    });
    const result = await recorder.capture(demoWithSettings, options.output);
    spinner.succeed(`Captured ${result.screenshots.length} screenshot(s)`);

    console.log('\n========================================');
    console.log('Screenshots captured!');
    console.log(`Directory: ${result.outputDir}`);
    console.log(`Screenshots: ${result.screenshots.length}`);
    if (result.galleryPath) {
      console.log(`Gallery: ${result.galleryPath}`);
    }
    console.log('========================================\n');
  } catch (error) {
    spinner.fail('Screenshot capture failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * List demos command
 */
export async function listCommand(options: { dir: string }): Promise<void> {
  const spinner = ora('Finding demo files...').start();

  try {
    const demosDir = path.resolve(options.dir);
    const demoFiles = await listDemos(demosDir);

    if (demoFiles.length === 0) {
      spinner.info('No demo files found');
      console.log(`\nLooking in: ${demosDir}`);
      console.log('Demo files should have the extension: .demo.ts, .demo.js, or .demo.mjs\n');
      return;
    }

    spinner.succeed(`Found ${demoFiles.length} demo file(s)`);
    console.log('\nAvailable demos:\n');

    for (const file of demoFiles) {
      try {
        const demo = await loadDemo(file);
        console.log(`  ${path.basename(file)}`);
        console.log(`    ID: ${demo.id}`);
        console.log(`    Name: ${demo.name}`);
        console.log(`    URL: ${demo.url}`);
        console.log('');
      } catch (error) {
        console.log(`  ${path.basename(file)}`);
        console.log(`    Error: ${(error as Error).message}`);
        console.log('');
      }
    }
  } catch (error) {
    spinner.fail('Failed to list demos');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Create command - generates a demo file template
 */
export async function createCommand(id: string, options: CreateOptions): Promise<void> {
  const spinner = ora('Creating demo file...').start();

  try {
    const demosDir = path.resolve(options.dir);
    await fs.mkdir(demosDir, { recursive: true });

    const filename = `${id}.demo.ts`;
    const filepath = path.join(demosDir, filename);

    // Check if file already exists
    try {
      await fs.access(filepath);
      spinner.fail(`Demo file already exists: ${filepath}`);
      process.exit(1);
    } catch {
      // File doesn't exist, good to proceed
    }

    const name = options.name || id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    const template = generateDemoTemplate(id, name, options.url);
    await fs.writeFile(filepath, template);
    spinner.succeed(`Created demo: ${filepath}`);

    console.log('\nNext steps:');
    console.log(`  1. Edit ${filename} to define your demo flow`);
    console.log(`  2. Run: demo-recorder record ${filepath}`);

    // Optionally record immediately
    if (options.record) {
      console.log('\n');
      await recordCommand(filepath, {
        output: options.output,
        convert: true,
        headed: options.headed,
      });
    }
  } catch (error) {
    spinner.fail('Failed to create demo');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Thumbnail command - extracts a thumbnail from a video file
 */
export async function thumbnailCommand(videoFile: string, options: ThumbnailOptions): Promise<void> {
  const spinner = ora('Extracting thumbnail...').start();

  try {
    const inputPath = path.resolve(videoFile);

    // Verify input exists
    await fs.access(inputPath);

    const thumbPath = await extractThumbnail({
      inputPath,
      outputPath: options.output ? path.resolve(options.output) : undefined,
      timestamp: options.time ? parseFloat(options.time) : undefined,
      width: parseInt(options.width, 10),
      format: options.format,
      quality: parseInt(options.quality, 10),
    });

    spinner.succeed('Thumbnail extracted');
    console.log(`\nThumbnail saved: ${thumbPath}\n`);
  } catch (error) {
    spinner.fail('Thumbnail extraction failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * GIF command - converts a video file to animated GIF
 */
export async function gifCommand(videoFile: string, options: GifOptions): Promise<void> {
  const spinner = ora('Converting to GIF...').start();

  try {
    const inputPath = path.resolve(videoFile);

    // Verify input exists
    await fs.access(inputPath);

    const gifPath = await convertToGif({
      inputPath,
      outputPath: options.output ? path.resolve(options.output) : undefined,
      fps: parseInt(options.fps, 10),
      width: parseInt(options.width, 10),
      colors: parseInt(options.colors, 10),
      dither: options.dither,
      highQuality: !options.fast,
    });

    spinner.succeed('GIF conversion complete');
    console.log(`\nGIF saved: ${gifPath}\n`);
  } catch (error) {
    spinner.fail('GIF conversion failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Markdown command - generates markdown documentation from screenshots
 */
export async function markdownCommand(screenshotDir: string, options: MarkdownOptions): Promise<void> {
  const spinner = ora('Generating markdown...').start();

  try {
    const inputDir = path.resolve(screenshotDir);

    // Verify directory exists
    const stat = await fs.stat(inputDir);
    if (!stat.isDirectory()) {
      throw new Error(`Not a directory: ${inputDir}`);
    }

    const markdownPath = await generateMarkdownFromDirectory(inputDir, {
      title: options.title,
      description: options.description,
      includeTimestamps: options.timestamps,
      includeSelectors: options.selectors,
    });

    // Move to custom output if specified
    let finalPath = markdownPath;
    if (options.output) {
      const outputPath = path.resolve(options.output);
      await fs.rename(markdownPath, outputPath);
      finalPath = outputPath;
    }

    spinner.succeed('Markdown generated');
    console.log(`\nMarkdown saved: ${finalPath}\n`);
  } catch (error) {
    spinner.fail('Markdown generation failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Embed command - generates embed snippets for a video
 */
export async function embedCommand(videoFile: string, options: EmbedOptions): Promise<void> {
  const spinner = ora('Generating embed snippets...').start();

  try {
    const inputPath = path.resolve(videoFile);

    // Verify input exists
    await fs.access(inputPath);

    const embedPath = await generateEmbedFile(inputPath, options.output ? path.resolve(options.output) : undefined, {
      width: options.width,
      height: options.height ? parseInt(options.height, 10) : undefined,
      autoplay: options.autoplay,
      loop: options.loop,
      muted: options.muted,
      poster: options.poster,
    });

    spinner.succeed('Embed snippets generated');
    console.log(`\nEmbed file saved: ${embedPath}\n`);
  } catch (error) {
    spinner.fail('Embed generation failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Viewports command - lists available viewport presets
 */
export async function viewportsCommand(): Promise<void> {
  console.log('\nAvailable viewport presets:\n');

  console.log('Mobile Devices:');
  for (const [key, preset] of Object.entries(MOBILE_PRESETS)) {
    console.log(`  ${key.padEnd(20)} ${preset.name} (${preset.width}x${preset.height})`);
  }

  console.log('\nDesktop/Laptop:');
  for (const [key, preset] of Object.entries(DESKTOP_PRESETS)) {
    console.log(`  ${key.padEnd(20)} ${preset.name} (${preset.width}x${preset.height})`);
  }

  console.log('\nCustom format: WIDTHxHEIGHT (e.g., 1024x768)\n');
  console.log('Usage: demo-recorder screenshot <demo> --viewport iphone-15-pro\n');
}

/**
 * Inspect command - inspect a page and list all interactive elements
 */
export async function inspectCommand(url: string, options: InspectOptions): Promise<void> {
  const spinner = ora('Launching browser...').start();

  try {
    // Parse viewport if provided
    let width = 1920;
    let height = 1080;
    if (options.viewport) {
      const preset = parseViewport(options.viewport);
      if (preset) {
        width = preset.width;
        height = preset.height;
      }
    }

    // Launch browser
    const browser = await chromium.launch({
      headless: !options.headed,
    });

    const context = await browser.newContext({
      viewport: { width, height },
    });

    const page = await context.newPage();

    spinner.text = 'Navigating to page...';
    await page.goto(url, { waitUntil: 'networkidle' });

    spinner.text = 'Inspecting page elements...';

    // Collect all interactive elements
    const elements = await page.evaluate(() => {
      interface InspectedElement {
        selector: string;
        type: string;
        text: string;
        visible: boolean;
        enabled: boolean;
        options?: string[];
      }

      const results: InspectedElement[] = [];

      // All elements with data-testid
      document.querySelectorAll('[data-testid]').forEach((el) => {
        const htmlEl = el as HTMLElement;
        const testId = el.getAttribute('data-testid');
        results.push({
          selector: `[data-testid="${testId}"]`,
          type: 'testid',
          text: htmlEl.innerText?.trim().substring(0, 40) || '',
          visible: htmlEl.offsetParent !== null,
          enabled: !(htmlEl as HTMLButtonElement).disabled,
        });
      });

      // Buttons without testid
      document.querySelectorAll('button:not([data-testid])').forEach((el, idx) => {
        const btn = el as HTMLButtonElement;
        if (!el.closest('[data-testid]')) {
          results.push({
            selector: `button:nth-of-type(${idx + 1})`,
            type: 'button',
            text: btn.innerText?.trim().substring(0, 40) || '',
            visible: btn.offsetParent !== null,
            enabled: !btn.disabled,
          });
        }
      });

      // Select elements
      document.querySelectorAll('select').forEach((el) => {
        const sel = el as HTMLSelectElement;
        const testId = sel.getAttribute('data-testid');
        const selector = testId ? `[data-testid="${testId}"]` : sel.id ? `#${sel.id}` : 'select';
        const optionTexts = Array.from(sel.options).slice(0, 5).map(o => o.text);
        results.push({
          selector,
          type: 'select',
          text: `(${sel.options.length} options)`,
          visible: sel.offsetParent !== null,
          enabled: !sel.disabled,
          options: optionTexts,
        });
      });

      // Input elements (text, email, etc.)
      document.querySelectorAll('input[type="text"], input[type="email"], input[type="search"], input[type="password"]').forEach((el) => {
        const input = el as HTMLInputElement;
        const testId = input.getAttribute('data-testid');
        const selector = testId ? `[data-testid="${testId}"]` : input.id ? `#${input.id}` : input.name ? `input[name="${input.name}"]` : 'input';
        results.push({
          selector,
          type: 'input',
          text: input.placeholder || '',
          visible: input.offsetParent !== null,
          enabled: !input.disabled,
        });
      });

      // Links
      document.querySelectorAll('a[href]').forEach((el) => {
        const link = el as HTMLAnchorElement;
        const testId = link.getAttribute('data-testid');
        if (testId || link.innerText.trim()) {
          const selector = testId ? `[data-testid="${testId}"]` : `a:has-text("${link.innerText.trim().substring(0, 20)}")`;
          results.push({
            selector,
            type: 'link',
            text: link.innerText?.trim().substring(0, 40) || link.href.substring(0, 40),
            visible: link.offsetParent !== null,
            enabled: true,
          });
        }
      });

      return results;
    });

    await browser.close();
    spinner.succeed(`Found ${elements.length} interactive elements`);

    // Output results
    if (options.format === 'json') {
      console.log(JSON.stringify(elements, null, 2));
    } else {
      // Table format
      console.log('\n' + '─'.repeat(100));
      console.log(
        'TYPE'.padEnd(10) +
        'SELECTOR'.padEnd(50) +
        'TEXT'.padEnd(25) +
        'VISIBLE'.padEnd(8) +
        'ENABLED'
      );
      console.log('─'.repeat(100));

      for (const el of elements) {
        const visible = el.visible ? '✓' : '✗';
        const enabled = el.enabled ? '✓' : '✗';
        console.log(
          el.type.padEnd(10) +
          el.selector.substring(0, 48).padEnd(50) +
          el.text.substring(0, 23).padEnd(25) +
          visible.padEnd(8) +
          enabled
        );
      }
      console.log('─'.repeat(100) + '\n');
    }
  } catch (error) {
    spinner.fail('Inspection failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Generate a demo file template
 */
function generateDemoTemplate(id: string, name: string, url: string): string {
  return `import type { DemoDefinition } from '../src/core/types';

const demo: DemoDefinition = {
  id: '${id}',
  name: '${name}',
  url: '${url}',

  run: async ({ page, wait, highlight }) => {
    // Wait for page to load
    await wait(1500);

    // TODO: Add your demo steps here
    // Examples:
    //   await highlight('button.submit', 500);  // Highlight an element
    //   await page.click('button.submit');       // Click an element
    //   await page.fill('input#email', 'test@example.com');  // Fill input
    //   await page.waitForSelector('.result');   // Wait for element
    //   await wait(2000);                        // Pause for 2 seconds

    // Final pause
    await wait(2000);
  },
};

export default demo;
`;
}
