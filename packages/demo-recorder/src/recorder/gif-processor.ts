import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import { logger } from '../utils/logger';

export interface GifConversionOptions {
  /** Input video file path (MP4 or WebM) */
  inputPath: string;
  /** Output GIF path (auto-generated if not provided) */
  outputPath?: string;
  /** Output width (height auto-calculated to maintain aspect ratio, default: 800) */
  width?: number;
  /** Frames per second (default: 10) */
  fps?: number;
  /** Color palette size (32-256, default: 256) */
  colors?: number;
  /** Enable dithering for better color reproduction (default: true) */
  dither?: boolean;
  /** Loop count (default: 0 = infinite) */
  loop?: number;
  /** Use high-quality two-pass encoding (default: true) */
  highQuality?: boolean;
}

/**
 * Convert a video file to animated GIF using FFmpeg
 */
export async function convertToGif(options: GifConversionOptions): Promise<string> {
  const {
    inputPath,
    width = 800,
    fps = 10,
    colors = 256,
    dither = true,
    loop = 0,
    highQuality = true,
  } = options;

  const outputPath = options.outputPath || inputPath.replace(/\.(mp4|webm|mov|avi)$/i, '.gif');

  logger.info(`Converting ${path.basename(inputPath)} to GIF...`);
  logger.info(`  Width: ${width}px, FPS: ${fps}, Colors: ${colors}`);

  if (highQuality) {
    return convertTwoPass(inputPath, outputPath, { width, fps, colors, dither, loop });
  } else {
    return convertSinglePass(inputPath, outputPath, { width, fps, loop });
  }
}

/**
 * Two-pass GIF conversion for optimal quality and file size
 * Pass 1: Generate optimized color palette
 * Pass 2: Apply palette to create GIF
 */
async function convertTwoPass(
  inputPath: string,
  outputPath: string,
  options: { width: number; fps: number; colors: number; dither: boolean; loop: number }
): Promise<string> {
  const { width, fps, colors, dither, loop } = options;

  // Create temp palette file
  const tempDir = os.tmpdir();
  const palettePath = path.join(tempDir, `palette-${Date.now()}.png`);

  try {
    // Pass 1: Generate palette
    logger.info('  Pass 1/2: Generating color palette...');
    await runFfmpeg([
      '-i',
      inputPath,
      '-vf',
      `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=max_colors=${colors}:stats_mode=diff`,
      '-y',
      palettePath,
    ]);

    // Pass 2: Create GIF with palette
    logger.info('  Pass 2/2: Creating GIF...');
    const ditherOpt = dither ? 'dither=bayer:bayer_scale=5' : 'dither=none';
    await runFfmpeg([
      '-i',
      inputPath,
      '-i',
      palettePath,
      '-lavfi',
      `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=${ditherOpt}`,
      '-loop',
      loop.toString(),
      '-y',
      outputPath,
    ]);

    logger.info(`GIF created: ${outputPath}`);

    // Report file size
    const stats = await fs.stat(outputPath);
    const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
    logger.info(`GIF size: ${sizeMb} MB`);

    if (stats.size > 10 * 1024 * 1024) {
      logger.warn('GIF is larger than 10MB. Consider reducing width, fps, or duration.');
    }

    return outputPath;
  } finally {
    // Clean up palette file
    try {
      await fs.unlink(palettePath);
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Single-pass GIF conversion (faster but lower quality)
 */
async function convertSinglePass(
  inputPath: string,
  outputPath: string,
  options: { width: number; fps: number; loop: number }
): Promise<string> {
  const { width, fps, loop } = options;

  await runFfmpeg([
    '-i',
    inputPath,
    '-vf',
    `fps=${fps},scale=${width}:-1:flags=lanczos`,
    '-gifflags',
    '+transdiff',
    '-loop',
    loop.toString(),
    '-y',
    outputPath,
  ]);

  logger.info(`GIF created: ${outputPath}`);

  // Report file size
  const stats = await fs.stat(outputPath);
  const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
  logger.info(`GIF size: ${sizeMb} MB`);

  return outputPath;
}

/**
 * Run FFmpeg with the given arguments
 */
function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-500)}`));
      }
    });

    ffmpeg.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            'FFmpeg not found. Please install FFmpeg:\n' +
              '  macOS: brew install ffmpeg\n' +
              '  Ubuntu: sudo apt install ffmpeg\n' +
              '  Windows: choco install ffmpeg'
          )
        );
      } else {
        reject(new Error(`FFmpeg error: ${err.message}`));
      }
    });
  });
}

/**
 * Get estimated GIF file size based on video duration and settings
 * Useful for warning users about potentially large GIFs
 */
export function estimateGifSize(
  durationSeconds: number,
  width: number,
  fps: number
): { estimatedMb: number; warning: boolean } {
  // Rough estimate: ~30KB per frame at 800px width
  const frameSize = (width / 800) * 30 * 1024;
  const totalFrames = durationSeconds * fps;
  const estimatedBytes = frameSize * totalFrames;
  const estimatedMb = estimatedBytes / 1024 / 1024;

  return {
    estimatedMb: Math.round(estimatedMb * 10) / 10,
    warning: estimatedMb > 10, // Warn if > 10MB
  };
}
