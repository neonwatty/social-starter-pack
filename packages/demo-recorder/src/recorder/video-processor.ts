import { spawn } from 'child_process';
import path from 'path';
import { logger } from '../utils/logger';

export interface ConversionOptions {
  /** Input video file path */
  inputPath: string;
  /** Output path (auto-generated if not provided) */
  outputPath?: string;
  /** Video codec (default: 'h264') */
  codec?: 'h264' | 'h265';
  /** Quality (0-51, lower = better, default: 23) */
  crf?: number;
}

/**
 * Convert WebM to MP4 using FFmpeg
 */
export async function convertToMp4(options: ConversionOptions): Promise<string> {
  const { inputPath, codec = 'h264', crf = 23 } = options;

  const outputPath = options.outputPath || inputPath.replace(/\.webm$/, '.mp4');

  logger.info(`Converting ${path.basename(inputPath)} to MP4...`);

  return new Promise((resolve, reject) => {
    const codecMap: Record<string, string> = {
      h264: 'libx264',
      h265: 'libx265',
    };

    const args = [
      '-i',
      inputPath,
      '-c:v',
      codecMap[codec],
      '-crf',
      crf.toString(),
      '-preset',
      'medium', // Balance between speed and compression
      '-pix_fmt',
      'yuv420p', // Required for YouTube compatibility
      '-movflags',
      '+faststart', // Enable streaming playback
      '-y', // Overwrite output file
      outputPath,
    ];

    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        logger.info(`Conversion complete: ${outputPath}`);
        resolve(outputPath);
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
 * Check if FFmpeg is installed and accessible
 */
export async function checkFfmpegInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    ffmpeg.on('close', (code) => resolve(code === 0));
    ffmpeg.on('error', () => resolve(false));
  });
}

/**
 * Get FFmpeg version string
 */
export async function getFfmpegVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    let output = '';

    ffmpeg.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        const match = output.match(/ffmpeg version ([^\s]+)/);
        resolve(match ? match[1] : 'unknown');
      } else {
        resolve(null);
      }
    });

    ffmpeg.on('error', () => resolve(null));
  });
}

export interface ThumbnailOptions {
  /** Input video file path */
  inputPath: string;
  /** Output thumbnail path (auto-generated if not provided) */
  outputPath?: string;
  /** Timestamp in seconds (default: 1/3 of video duration) */
  timestamp?: number;
  /** Output width in pixels (height auto-calculated, default: 1280) */
  width?: number;
  /** Image format (default: 'png') */
  format?: 'png' | 'jpeg' | 'webp';
  /** Quality for jpeg/webp (0-100, default: 90) */
  quality?: number;
}

/**
 * Get video duration in seconds using ffprobe
 */
export async function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve) => {
    const ffprobe = spawn('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      inputPath,
    ]);

    let output = '';
    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        resolve(isNaN(duration) ? 0 : duration);
      } else {
        resolve(0);
      }
    });

    ffprobe.on('error', () => resolve(0));
  });
}

/**
 * Extract a thumbnail frame from a video
 */
export async function extractThumbnail(options: ThumbnailOptions): Promise<string> {
  const { inputPath, width = 1280, format = 'png', quality = 90 } = options;

  // Determine timestamp (default to 1/3 into video)
  let timestamp = options.timestamp;
  if (timestamp === undefined) {
    const duration = await getVideoDuration(inputPath);
    timestamp = duration > 0 ? duration / 3 : 1;
  }

  const ext = format === 'jpeg' ? 'jpg' : format;
  const outputPath =
    options.outputPath || inputPath.replace(/\.(mp4|webm|mov|avi)$/i, `-thumb.${ext}`);

  logger.info(`Extracting thumbnail at ${timestamp.toFixed(2)}s...`);

  return new Promise((resolve, reject) => {
    const args = [
      '-ss',
      timestamp.toString(),
      '-i',
      inputPath,
      '-vframes',
      '1',
      '-vf',
      `scale=${width}:-1`,
    ];

    // Add quality settings for lossy formats
    if (format === 'jpeg') {
      // FFmpeg jpeg quality: 2-31, lower is better
      const ffmpegQuality = Math.round(31 - (quality / 100) * 29);
      args.push('-q:v', ffmpegQuality.toString());
    } else if (format === 'webp') {
      args.push('-quality', quality.toString());
    }

    args.push('-y', outputPath);

    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';
    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        logger.info(`Thumbnail created: ${outputPath}`);
        resolve(outputPath);
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
