import { execSync } from "child_process";
import * as path from "path";

export interface VideoInfo {
  width: number;
  height: number;
  duration: number;
  aspectRatio: string;
  isVertical: boolean;
  isValidShort: boolean;
  warnings: string[];
}

const MAX_SHORTS_DURATION = 60; // seconds
const MIN_SHORTS_DURATION = 1;

export function getVideoInfo(filePath: string): VideoInfo {
  const warnings: string[] = [];

  // Use ffprobe to get video metadata
  let ffprobeOutput: string;
  try {
    ffprobeOutput = execSync(
      `ffprobe -v quiet -print_format json -show_streams -show_format "${filePath}"`,
      { encoding: "utf-8" }
    );
  } catch {
    throw new Error(
      `Failed to analyze video. Make sure ffprobe is installed (brew install ffmpeg)`
    );
  }

  const probe = JSON.parse(ffprobeOutput);
  const videoStream = probe.streams?.find((s: any) => s.codec_type === "video");

  if (!videoStream) {
    throw new Error("No video stream found in file");
  }

  const width = videoStream.width;
  const height = videoStream.height;
  const duration = parseFloat(probe.format?.duration || videoStream.duration || "0");

  const aspectRatio = `${width}:${height}`;
  const isVertical = height > width;
  const aspectDecimal = width / height;

  // Check if it's a valid short
  let isValidShort = true;

  // Duration check
  if (duration > MAX_SHORTS_DURATION) {
    warnings.push(
      `Duration (${duration.toFixed(1)}s) exceeds ${MAX_SHORTS_DURATION}s - will NOT be a Short`
    );
    isValidShort = false;
  } else if (duration < MIN_SHORTS_DURATION) {
    warnings.push(`Duration too short (${duration.toFixed(1)}s)`);
    isValidShort = false;
  }

  // Aspect ratio check (9:16 = 0.5625)
  if (!isVertical) {
    warnings.push(`Video is horizontal (${width}x${height}) - Shorts should be vertical (9:16)`);
    isValidShort = false;
  } else if (Math.abs(aspectDecimal - 0.5625) > 0.1) {
    warnings.push(`Aspect ratio ${aspectRatio} differs from ideal 9:16 - may have black bars`);
  }

  return {
    width,
    height,
    duration,
    aspectRatio,
    isVertical,
    isValidShort,
    warnings,
  };
}

export function validateForShorts(filePath: string): VideoInfo {
  const fileName = path.basename(filePath);
  console.log(`\nValidating: ${fileName}`);

  const info = getVideoInfo(filePath);

  console.log(`  Resolution: ${info.width}x${info.height} (${info.aspectRatio})`);
  console.log(`  Duration: ${info.duration.toFixed(1)}s`);
  console.log(`  Vertical: ${info.isVertical ? "Yes" : "No"}`);
  console.log(`  Valid Short: ${info.isValidShort ? "Yes" : "No"}`);

  if (info.warnings.length > 0) {
    console.log(`  Warnings:`);
    info.warnings.forEach((w) => console.log(`    - ${w}`));
  }

  return info;
}

export function checkFfprobe(): boolean {
  try {
    execSync("ffprobe -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
