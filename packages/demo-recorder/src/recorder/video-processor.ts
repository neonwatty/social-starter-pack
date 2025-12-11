import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger';
import type {
  VideoAnalysis,
  SilenceSegment,
  KeyframeInfo,
  TrimSuggestion,
  ActionTiming,
  RecordingMetadata,
  AnalyzeOptions,
  TrimOptions,
  TrimResult,
  FrameDiffSegment,
} from '../core/types';

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

// ==========================================
// Video Analysis Functions
// ==========================================

/**
 * Detect silence/pause segments in video using FFmpeg silencedetect filter
 */
export async function detectSilence(
  inputPath: string,
  threshold: number = -30,
  minDuration: number = 0.5
): Promise<SilenceSegment[]> {
  return new Promise((resolve, reject) => {
    const args = [
      '-i',
      inputPath,
      '-af',
      `silencedetect=n=${threshold}dB:d=${minDuration}`,
      '-f',
      'null',
      '-',
    ];

    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0 && code !== null) {
        // FFmpeg may exit with non-zero even if output is valid
        logger.debug(`FFmpeg silencedetect exited with code ${code}`);
      }

      // Parse silence_start and silence_end from stderr
      const silences: SilenceSegment[] = [];
      const lines = stderr.split('\n');
      let currentStart: number | null = null;

      for (const line of lines) {
        const startMatch = line.match(/silence_start:\s*([\d.]+)/);
        const endMatch = line.match(/silence_end:\s*([\d.]+)/);

        if (startMatch) {
          currentStart = parseFloat(startMatch[1]);
        }
        if (endMatch && currentStart !== null) {
          const endSec = parseFloat(endMatch[1]);
          const durationSec = endSec - currentStart;
          silences.push({
            startSec: currentStart,
            endSec,
            durationSec,
            keepPause: false, // Will be determined by correlation with actions
          });
          currentStart = null;
        }
      }

      resolve(silences);
    });

    ffmpeg.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('FFmpeg not found'));
      } else {
        reject(new Error(`FFmpeg error: ${err.message}`));
      }
    });
  });
}

/**
 * Extract keyframes at scene changes using FFmpeg scene detection
 */
export async function extractKeyframes(
  inputPath: string,
  outputDir: string,
  sceneThreshold: number = 0.3
): Promise<KeyframeInfo[]> {
  await fs.mkdir(outputDir, { recursive: true });

  return new Promise((resolve, reject) => {
    const outputPattern = path.join(outputDir, 'keyframe-%03d.png');
    const args = [
      '-i',
      inputPath,
      '-vf',
      `select='gt(scene,${sceneThreshold})',showinfo`,
      '-vsync',
      'vfr',
      '-y',
      outputPattern,
    ];

    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', async (code) => {
      if (code !== 0 && code !== null) {
        logger.debug(`FFmpeg scene detection exited with code ${code}`);
      }

      // Parse timestamps from showinfo output
      const keyframes: KeyframeInfo[] = [];
      const lines = stderr.split('\n');
      let frameIndex = 0;

      for (const line of lines) {
        // Match showinfo output: pts_time:XX.XXX
        const ptsMatch = line.match(/pts_time:\s*([\d.]+)/);
        if (ptsMatch) {
          const timestamp = parseFloat(ptsMatch[1]);
          const filename = `keyframe-${String(frameIndex + 1).padStart(3, '0')}.png`;
          const thumbnailPath = path.join(outputDir, filename);

          // Check if file exists
          try {
            await fs.access(thumbnailPath);
            keyframes.push({
              timestampSec: timestamp,
              thumbnailPath,
            });
            frameIndex++;
          } catch {
            // File might not exist for all detected scenes
          }
        }
      }

      // If no keyframes detected by scene change, extract a few evenly spaced ones
      if (keyframes.length === 0) {
        logger.info('No scene changes detected, extracting evenly spaced keyframes...');
        const duration = await getVideoDuration(inputPath);
        const count = Math.min(5, Math.ceil(duration / 10)); // One keyframe per 10 seconds, max 5

        for (let i = 0; i < count; i++) {
          const timestamp = (duration / (count + 1)) * (i + 1);
          const filename = `keyframe-${String(i + 1).padStart(3, '0')}.png`;
          const thumbnailPath = path.join(outputDir, filename);

          try {
            await extractSingleFrame(inputPath, thumbnailPath, timestamp);
            keyframes.push({
              timestampSec: timestamp,
              thumbnailPath,
            });
          } catch (err) {
            logger.warn(`Failed to extract keyframe at ${timestamp}s: ${err}`);
          }
        }
      }

      resolve(keyframes);
    });

    ffmpeg.on('error', (err) => {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(new Error('FFmpeg not found'));
      } else {
        reject(new Error(`FFmpeg error: ${err.message}`));
      }
    });
  });
}

/**
 * Extract a single frame at a specific timestamp
 */
async function extractSingleFrame(
  inputPath: string,
  outputPath: string,
  timestamp: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['-ss', timestamp.toString(), '-i', inputPath, '-vframes', '1', '-y', outputPath];

    const ffmpeg = spawn('ffmpeg', args);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-200)}`));
      }
    });

    ffmpeg.on('error', reject);
  });
}

/**
 * Correlate silences with action metadata to determine which pauses to keep
 */
function correlateSilencesWithActions(
  silences: SilenceSegment[],
  actions: ActionTiming[],
  maxAcceptablePause: number
): SilenceSegment[] {
  return silences.map((silence) => {
    const startMs = silence.startSec * 1000;
    const endMs = silence.endSec * 1000;

    // Check if this silence overlaps with a 'wait' action
    const overlappingWait = actions.find(
      (action) =>
        action.action === 'wait' &&
        action.startMs <= endMs &&
        action.endMs >= startMs
    );

    if (overlappingWait) {
      return {
        ...silence,
        keepPause: true,
        reason: `Intentional wait (${overlappingWait.args || 'pause'})`,
      };
    }

    // Check if this silence is during a long operation like waitForHydration or waitForText
    const overlappingLongOp = actions.find(
      (action) =>
        ['waitForHydration', 'waitForText', 'waitForEnabled', 'waitForTextChange'].includes(
          action.action
        ) &&
        action.startMs <= endMs &&
        action.endMs >= startMs
    );

    if (overlappingLongOp) {
      return {
        ...silence,
        keepPause: true,
        reason: `During ${overlappingLongOp.action}`,
      };
    }

    // Short pauses below threshold are acceptable
    if (silence.durationSec < maxAcceptablePause) {
      return {
        ...silence,
        keepPause: true,
        reason: 'Short pause within acceptable range',
      };
    }

    return {
      ...silence,
      keepPause: false,
      reason: `Long pause (${silence.durationSec.toFixed(1)}s) - recommend removal`,
    };
  });
}

/**
 * Generate trim suggestions from analysis
 */
function generateTrimSuggestions(
  silences: SilenceSegment[],
  _duration: number,
  minPauseToKeep: number = 1
): TrimSuggestion[] {
  const suggestions: TrimSuggestion[] = [];

  for (const silence of silences) {
    if (!silence.keepPause && silence.durationSec > minPauseToKeep) {
      // Calculate how much to trim (keep minPauseToKeep seconds)
      const trimStart = silence.startSec + minPauseToKeep / 2;
      const trimEnd = silence.endSec - minPauseToKeep / 2;

      if (trimEnd > trimStart) {
        suggestions.push({
          type: 'remove_pause',
          startSec: trimStart,
          endSec: trimEnd,
          confidence: Math.min(0.9, 0.5 + (silence.durationSec - minPauseToKeep) / 10),
          reason: silence.reason || `Remove ${(trimEnd - trimStart).toFixed(1)}s pause`,
        });
      }
    }
  }

  // Sort suggestions by start time
  suggestions.sort((a, b) => a.startSec - b.startSec);

  return suggestions;
}

// ==========================================
// Frame Difference Analysis
// ==========================================

/**
 * Analyze frame differences to detect static/low-activity segments
 * Uses FFmpeg to extract frames and compare them
 */
export async function analyzeFrameDifferences(
  inputPath: string,
  segmentDurationSec: number = 1.0
): Promise<FrameDiffSegment[]> {
  const duration = await getVideoDuration(inputPath);
  if (duration === 0) {
    return [];
  }

  logger.info('Analyzing frame differences...');

  // Use FFmpeg's mpdecimate filter to detect duplicate/similar frames
  // This outputs stats about frame differences
  const ffmpegArgs = [
    '-i',
    inputPath,
    '-vf',
    // Compare frames and output difference metrics
    // signalstats outputs YAVG (average luminance) which we can use to detect changes
    'select=not(mod(n\\,5)),signalstats=stat=tout+vrep+brng',
    '-f',
    'null',
    '-',
  ];

  const result = await new Promise<string>((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);
    let stderr = '';

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0 || stderr.includes('frame=')) {
        resolve(stderr);
      } else {
        reject(new Error(`FFmpeg frame analysis failed: ${stderr}`));
      }
    });
  });

  // Alternative approach: Extract frames at intervals and compare file sizes
  // Frames with little change will compress similarly
  const segments: FrameDiffSegment[] = [];
  const numSegments = Math.ceil(duration / segmentDurationSec);

  // Create temp directory for frame extraction
  const tmpDir = path.join(path.dirname(inputPath), '.frame-analysis-tmp');
  await fs.mkdir(tmpDir, { recursive: true });

  try {
    for (let i = 0; i < numSegments; i++) {
      const startSec = i * segmentDurationSec;
      const endSec = Math.min((i + 1) * segmentDurationSec, duration);

      // Extract 2 frames from this segment - start and end
      const frame1Path = path.join(tmpDir, `segment-${i}-start.png`);
      const frame2Path = path.join(tmpDir, `segment-${i}-end.png`);

      // Extract first frame of segment
      await new Promise<void>((resolve, reject) => {
        const args = [
          '-ss',
          startSec.toString(),
          '-i',
          inputPath,
          '-vframes',
          '1',
          '-y',
          frame1Path,
        ];
        const ffmpeg = spawn('ffmpeg', args);
        ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject()));
        ffmpeg.on('error', reject);
      });

      // Extract last frame of segment
      const frame2Time = Math.max(startSec, endSec - 0.1);
      await new Promise<void>((resolve, reject) => {
        const args = [
          '-ss',
          frame2Time.toString(),
          '-i',
          inputPath,
          '-vframes',
          '1',
          '-y',
          frame2Path,
        ];
        const ffmpeg = spawn('ffmpeg', args);
        ffmpeg.on('close', (code) => (code === 0 ? resolve() : reject()));
        ffmpeg.on('error', reject);
      });

      // Compare file sizes as a proxy for visual difference
      // Similar frames compress to similar sizes
      let diffScore = 50; // Default middle value
      try {
        const [stat1, stat2] = await Promise.all([fs.stat(frame1Path), fs.stat(frame2Path)]);
        const sizeDiff = Math.abs(stat1.size - stat2.size);
        const avgSize = (stat1.size + stat2.size) / 2;
        // Normalize to 0-100 scale
        // Small size difference = low activity (score closer to 0)
        const sizeRatio = sizeDiff / avgSize;
        diffScore = Math.min(100, sizeRatio * 500); // Scale up for sensitivity
      } catch {
        // Use default if comparison fails
      }

      // Classify segment based on diff score
      let classification: FrameDiffSegment['classification'];
      let recommendation: FrameDiffSegment['recommendation'];

      if (diffScore < 5) {
        classification = 'static';
        recommendation = 'cut';
      } else if (diffScore < 15) {
        classification = 'low_activity';
        recommendation = 'speedup_4x';
      } else if (diffScore < 35) {
        classification = 'medium_activity';
        recommendation = 'speedup_2x';
      } else {
        classification = 'high_activity';
        recommendation = 'keep';
      }

      segments.push({
        startSec,
        endSec,
        avgDiffScore: diffScore,
        minDiffScore: diffScore,
        maxDiffScore: diffScore,
        classification,
        recommendation,
      });
    }

    // Merge consecutive segments with same recommendation
    const mergedSegments: FrameDiffSegment[] = [];
    for (const segment of segments) {
      const last = mergedSegments[mergedSegments.length - 1];
      if (last && last.recommendation === segment.recommendation) {
        // Merge with previous
        last.endSec = segment.endSec;
        last.avgDiffScore = (last.avgDiffScore + segment.avgDiffScore) / 2;
        last.minDiffScore = Math.min(last.minDiffScore, segment.minDiffScore);
        last.maxDiffScore = Math.max(last.maxDiffScore, segment.maxDiffScore);
      } else {
        mergedSegments.push({ ...segment });
      }
    }

    logger.info(`Frame analysis complete: ${mergedSegments.length} segments identified`);
    return mergedSegments;
  } finally {
    // Cleanup temp directory
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Analyze a video file for editing opportunities
 */
export async function analyzeVideo(options: AnalyzeOptions): Promise<VideoAnalysis> {
  const {
    inputPath,
    outputDir = path.dirname(inputPath),
    silenceThreshold = -30,
    minSilenceDuration = 0.5,
    maxAcceptablePause = 3,
    sceneThreshold = 0.3,
    metadataPath,
  } = options;

  logger.info(`Analyzing video: ${inputPath}`);

  // Get video duration
  const duration = await getVideoDuration(inputPath);
  if (duration === 0) {
    throw new Error('Could not determine video duration');
  }
  logger.info(`Video duration: ${duration.toFixed(2)}s`);

  // Create output directory for keyframes
  const keyframeDir = path.join(outputDir, 'keyframes');

  // Load action metadata if available
  let actions: ActionTiming[] | undefined;
  const metaPath = metadataPath || inputPath.replace(/\.[^.]+$/, '.metadata.json');
  try {
    const metaContent = await fs.readFile(metaPath, 'utf-8');
    const metadata: RecordingMetadata = JSON.parse(metaContent);
    actions = metadata.actions;
    logger.info(`Loaded ${actions.length} actions from metadata`);
  } catch {
    logger.info('No metadata file found, analyzing without action timing');
  }

  // Detect silences
  logger.info('Detecting silence segments...');
  let silences = await detectSilence(inputPath, silenceThreshold, minSilenceDuration);
  logger.info(`Found ${silences.length} silence segments`);

  // Correlate with actions if available
  if (actions && actions.length > 0) {
    silences = correlateSilencesWithActions(silences, actions, maxAcceptablePause);
  } else {
    // Without metadata, mark long pauses as removable
    silences = silences.map((s) => ({
      ...s,
      keepPause: s.durationSec < maxAcceptablePause,
      reason: s.durationSec < maxAcceptablePause ? 'Short pause' : 'Long pause - recommend removal',
    }));
  }

  // Extract keyframes
  logger.info('Extracting keyframes at scene changes...');
  const keyframes = await extractKeyframes(inputPath, keyframeDir, sceneThreshold);
  logger.info(`Extracted ${keyframes.length} keyframes`);

  // Associate keyframes with actions if available
  if (actions) {
    for (const keyframe of keyframes) {
      const timestampMs = keyframe.timestampSec * 1000;
      // Find the action that was happening at this timestamp
      const associatedAction = actions.find(
        (action) => action.startMs <= timestampMs && action.endMs >= timestampMs
      );
      if (associatedAction) {
        keyframe.associatedAction = associatedAction;
      }
    }
  }

  // Analyze frame differences for visual activity detection
  logger.info('Analyzing frame differences for visual activity...');
  const frameDiffs = await analyzeFrameDifferences(inputPath, 1.0);
  logger.info(`Identified ${frameDiffs.length} activity segments`);

  // Add frame-based suggestions for static/low-activity segments
  const frameSuggestions: TrimSuggestion[] = frameDiffs
    .filter((seg) => seg.recommendation === 'cut' && seg.endSec - seg.startSec >= 1.0)
    .map((seg) => ({
      type: 'remove_pause' as const,
      startSec: seg.startSec,
      endSec: seg.endSec,
      confidence: seg.avgDiffScore < 2 ? 0.9 : 0.7,
      reason: `Static/no visual change (activity score: ${seg.avgDiffScore.toFixed(1)})`,
    }));

  // Generate trim suggestions from silence detection
  const silenceSuggestions = generateTrimSuggestions(silences, duration);

  // Merge suggestions, preferring frame-based analysis
  const allSuggestions = [...frameSuggestions];
  for (const silenceSugg of silenceSuggestions) {
    // Only add silence suggestion if it doesn't overlap with a frame suggestion
    const overlaps = frameSuggestions.some(
      (fs) =>
        (silenceSugg.startSec >= fs.startSec && silenceSugg.startSec <= fs.endSec) ||
        (silenceSugg.endSec >= fs.startSec && silenceSugg.endSec <= fs.endSec)
    );
    if (!overlaps) {
      allSuggestions.push(silenceSugg);
    }
  }

  // Sort by start time
  allSuggestions.sort((a, b) => a.startSec - b.startSec);
  logger.info(`Generated ${allSuggestions.length} total trim suggestions`);

  const analysis: VideoAnalysis = {
    videoPath: inputPath,
    duration,
    silences,
    keyframes,
    actions,
    suggestions: allSuggestions,
    frameDiffs,
  };

  // Save analysis to JSON
  const analysisPath = path.join(outputDir, 'analysis.json');
  await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
  logger.info(`Analysis saved to: ${analysisPath}`);

  return analysis;
}

// ==========================================
// Video Trimming Functions
// ==========================================

/**
 * Trim video based on analysis, removing unnecessary pauses
 */
export async function trimVideo(options: TrimOptions): Promise<TrimResult> {
  const {
    inputPath,
    minPauseToKeep = 1,
    keepOriginal = true,
    analysisPath,
  } = options;

  // Load analysis
  let analysis = options.analysis;
  if (!analysis) {
    const analysisFile = analysisPath || path.join(path.dirname(inputPath), 'analysis.json');
    try {
      const content = await fs.readFile(analysisFile, 'utf-8');
      analysis = JSON.parse(content);
    } catch {
      throw new Error(
        `Analysis file not found: ${analysisFile}\nRun 'demo-recorder analyze' first.`
      );
    }
  }

  if (!analysis) {
    throw new Error('No analysis data available');
  }

  const outputPath =
    options.outputPath || inputPath.replace(/(\.[^.]+)$/, '-trimmed$1');

  // Calculate segments to keep (inverse of remove suggestions)
  const removeSegments = analysis.suggestions
    .filter((s) => s.type === 'remove_pause')
    .sort((a, b) => a.startSec - b.startSec);

  if (removeSegments.length === 0) {
    logger.info('No segments to remove, video is already optimal');
    // Copy the file as-is
    await fs.copyFile(inputPath, outputPath);
    return {
      originalPath: inputPath,
      trimmedPath: outputPath,
      originalDuration: analysis.duration,
      trimmedDuration: analysis.duration,
      removedSegments: [],
      keptSegments: [{ startSec: 0, endSec: analysis.duration }],
    };
  }

  // Build list of segments to keep
  const keptSegments: Array<{ startSec: number; endSec: number }> = [];
  let currentPos = 0;

  for (const remove of removeSegments) {
    if (remove.startSec > currentPos) {
      keptSegments.push({ startSec: currentPos, endSec: remove.startSec });
    }
    currentPos = remove.endSec;
  }

  // Add final segment if needed
  if (currentPos < analysis.duration) {
    keptSegments.push({ startSec: currentPos, endSec: analysis.duration });
  }

  logger.info(`Keeping ${keptSegments.length} segments, removing ${removeSegments.length}`);

  // Build FFmpeg filter complex for concatenation
  const filterInputs: string[] = [];
  const filterParts: string[] = [];

  for (let i = 0; i < keptSegments.length; i++) {
    const seg = keptSegments[i];
    filterParts.push(
      `[0:v]trim=start=${seg.startSec}:end=${seg.endSec},setpts=PTS-STARTPTS[v${i}]`
    );
    filterParts.push(
      `[0:a]atrim=start=${seg.startSec}:end=${seg.endSec},asetpts=PTS-STARTPTS[a${i}]`
    );
    filterInputs.push(`[v${i}][a${i}]`);
  }

  const concatInput = filterInputs.join('');
  filterParts.push(`${concatInput}concat=n=${keptSegments.length}:v=1:a=1[outv][outa]`);

  const filterComplex = filterParts.join(';');

  logger.info('Trimming video...');

  await new Promise<void>((resolve, reject) => {
    const args = [
      '-i',
      inputPath,
      '-filter_complex',
      filterComplex,
      '-map',
      '[outv]',
      '-map',
      '[outa]',
      '-c:v',
      'libx264',
      '-crf',
      '23',
      '-preset',
      'medium',
      '-c:a',
      'aac',
      '-y',
      outputPath,
    ];

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
        reject(new Error('FFmpeg not found'));
      } else {
        reject(new Error(`FFmpeg error: ${err.message}`));
      }
    });
  });

  // Get trimmed duration
  const trimmedDuration = await getVideoDuration(outputPath);

  // Calculate time savings
  const savedTime = analysis.duration - trimmedDuration;
  logger.info(`Trimming complete: ${outputPath}`);
  logger.info(
    `Original: ${analysis.duration.toFixed(1)}s → Trimmed: ${trimmedDuration.toFixed(1)}s (saved ${savedTime.toFixed(1)}s)`
  );

  // Optionally delete original
  if (!keepOriginal) {
    await fs.unlink(inputPath);
    logger.info(`Deleted original: ${inputPath}`);
  }

  return {
    originalPath: inputPath,
    trimmedPath: outputPath,
    originalDuration: analysis.duration,
    trimmedDuration,
    removedSegments: removeSegments.map((s) => ({
      startSec: s.startSec,
      endSec: s.endSec,
      reason: s.reason,
    })),
    keptSegments,
  };
}
