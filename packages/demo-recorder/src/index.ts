#!/usr/bin/env node

import { Command } from 'commander';
import {
  recordCommand,
  listCommand,
  createCommand,
  screenshotCommand,
  thumbnailCommand,
  gifCommand,
  markdownCommand,
  embedCommand,
  viewportsCommand,
  inspectCommand,
  validateCommand,
  debugCommand,
  analyzeCommand,
  trimCommand,
} from './cli/commands';

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
  .option('--headed-debug', 'Headed mode with selector highlighting and logging')
  .option('--step-through', 'Pause for keypress between actions (requires --headed-debug)')
  .option('--preset <preset>', 'Video format preset: youtube-shorts, youtube, twitter, square')
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

// demo-recorder inspect <url>
program
  .command('inspect <url>')
  .description('Inspect a page and list all interactive elements')
  .option('--viewport <preset>', 'Viewport preset (e.g., iphone-15-pro) or WxH')
  .option('--format <format>', 'Output format: table, json', 'table')
  .option('--headed', 'Run browser in headed mode')
  .option('--full', 'Full inspection with multiple selector strategies (for AI consumption)')
  .option('--screenshot <path>', 'Capture a screenshot alongside inspection')
  .action(inspectCommand);

// demo-recorder validate <demo-file>
program
  .command('validate <demo-file>')
  .description('Validate selectors in a demo file without recording')
  .option('--viewport <preset>', 'Viewport preset (e.g., iphone-15-pro) or WxH')
  .option('--headed', 'Run browser in headed mode')
  .action(validateCommand);

// demo-recorder debug <demo-file>
program
  .command('debug <demo-file>')
  .description('Run demo in interactive debug mode with step-by-step execution')
  .option('--viewport <preset>', 'Viewport preset (e.g., iphone-15-pro) or WxH')
  .action(debugCommand);

// demo-recorder analyze <video-file>
program
  .command('analyze <video-file>')
  .description('Analyze video for editing opportunities (silence detection, scene changes)')
  .option('--timeline', 'Generate visual HTML timeline')
  .option('--max-pause <sec>', 'Maximum acceptable pause duration (seconds)', '3')
  .option('--json', 'Output JSON only')
  .action(analyzeCommand);

// demo-recorder trim <video-file>
program
  .command('trim <video-file>')
  .description('Auto-trim video based on analysis (removes long pauses)')
  .option('--preview', 'Preview what would be trimmed without applying')
  .option('--min-pause <sec>', 'Minimum pause to keep (seconds)', '1')
  .option('-o, --output <path>', 'Output video path')
  .action(trimCommand);

program.parse();
