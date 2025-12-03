#!/usr/bin/env node

import { Command } from 'commander';
import { recordCommand, listCommand, createCommand, screenshotCommand, thumbnailCommand, gifCommand, markdownCommand, embedCommand, viewportsCommand } from './cli/commands';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json');

const program = new Command();

program
  .name('demo-recorder')
  .description('Record demo videos of web apps using Playwright')
  .version(pkg.version);

// demo-recorder create <id> --url <url>
program
  .command('create <id>')
  .description('Create a new demo definition file')
  .requiredOption('-u, --url <url>', 'URL of the app to demo')
  .option('-n, --name <name>', 'Human-readable name for the demo')
  .option('-d, --dir <directory>', 'Directory to create demo in', './demos')
  .option('-r, --record', 'Record the demo immediately after creating')
  .option('-o, --output <dir>', 'Output directory for recordings', './output')
  .option('--headed', 'Run browser in headed mode when recording')
  .action(createCommand);

// demo-recorder record <demo-file>
program
  .command('record <demo-file>')
  .description('Record a demo video from a demo definition file')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--no-convert', 'Skip WebM to MP4 conversion')
  .option('--headed', 'Run browser in headed mode (visible window)')
  .action(recordCommand);

// demo-recorder screenshot <demo-file>
program
  .command('screenshot <demo-file>')
  .description('Capture screenshots from a demo (auto-captures after each interaction)')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('--format <format>', 'Image format: png, jpeg, webp', 'png')
  .option('--quality <n>', 'Quality for jpeg/webp (0-100)', '90')
  .option('--full-page', 'Capture full page instead of viewport')
  .option('--headed', 'Run browser in headed mode (visible window)')
  .option('--no-gallery', 'Skip HTML gallery generation')
  .option('--viewport <preset>', 'Viewport preset (e.g., iphone-15-pro) or WxH')
  .option('--step-numbers', 'Add step number badges to screenshots')
  .option('--step-position <pos>', 'Badge position: top-left, top-right, bottom-left, bottom-right', 'top-left')
  .option('--captions', 'Add action description captions')
  .action(screenshotCommand);

// demo-recorder list
program
  .command('list')
  .description('List all demo definition files')
  .option('-d, --dir <directory>', 'Demos directory', './demos')
  .action(listCommand);

// demo-recorder thumbnail <video-file>
program
  .command('thumbnail <video-file>')
  .description('Extract a thumbnail image from a video file')
  .option('-o, --output <path>', 'Output image path')
  .option('-t, --time <seconds>', 'Timestamp in seconds (default: 1/3 into video)')
  .option('-w, --width <n>', 'Width in pixels', '1280')
  .option('-f, --format <format>', 'Image format: png, jpeg, webp', 'png')
  .option('-q, --quality <n>', 'Quality for jpeg/webp (0-100)', '90')
  .action(thumbnailCommand);

// demo-recorder gif <video-file>
program
  .command('gif <video-file>')
  .description('Convert a video file to animated GIF')
  .option('-o, --output <path>', 'Output GIF path')
  .option('--fps <n>', 'Frames per second', '10')
  .option('--width <n>', 'Width in pixels', '800')
  .option('--colors <n>', 'Color palette size (32-256)', '256')
  .option('--no-dither', 'Disable dithering')
  .option('--fast', 'Use faster single-pass encoding (lower quality)')
  .action(gifCommand);

// demo-recorder markdown <screenshot-dir>
program
  .command('markdown <screenshot-dir>')
  .description('Generate markdown documentation from screenshots')
  .option('-o, --output <path>', 'Output markdown file path')
  .option('-t, --title <title>', 'Document title')
  .option('-d, --description <text>', 'Document description')
  .option('--timestamps', 'Include capture timestamps')
  .option('--selectors', 'Include CSS selectors')
  .action(markdownCommand);

// demo-recorder embed <video-file>
program
  .command('embed <video-file>')
  .description('Generate embed code snippets for a video')
  .option('-o, --output <path>', 'Output file path')
  .option('-w, --width <value>', 'Video width', '100%')
  .option('-h, --height <value>', 'Video height')
  .option('--autoplay', 'Enable autoplay')
  .option('--loop', 'Enable loop')
  .option('--muted', 'Mute video')
  .option('--poster <url>', 'Poster image URL')
  .action(embedCommand);

// demo-recorder viewports
program
  .command('viewports')
  .description('List available viewport presets for mobile/desktop')
  .action(viewportsCommand);

program.parse();
