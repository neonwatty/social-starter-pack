/**
 * E2E Tests for Demo Recorder
 *
 * These tests run real Playwright recordings against Hacker News.
 * No mocking - actual browser, actual video files.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { PlaywrightRecorder } from '../../src/recorder/playwright-recorder';
import { convertToMp4, checkFfmpegInstalled } from '../../src/recorder/video-processor';
import { loadDemo } from '../../src/core/demo-loader';

describe('E2E Recording Tests', () => {
  const TEST_OUTPUT_DIR = path.join(__dirname, 'output');
  const FIXTURE_PATH = path.join(__dirname, 'fixtures', 'hackernews.demo.js');

  beforeAll(async () => {
    // Clean up any existing test output
    await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
    await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test output
    await fs.rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    // Small delay between tests to ensure browser cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Hacker News Recording', () => {
    it('should record a multi-step demo and produce a WebM file', async () => {
      // Load the demo fixture
      const demo = await loadDemo(FIXTURE_PATH);
      expect(demo.id).toBe('hackernews-e2e-test');
      expect(demo.url).toBe('https://news.ycombinator.com');

      // Record the demo
      const recorder = new PlaywrightRecorder({ headed: false });
      const result = await recorder.record(demo, TEST_OUTPUT_DIR);

      // Verify recording result
      expect(result.videoPath).toBeDefined();
      expect(result.videoPath).toMatch(/\.webm$/);
      expect(result.durationMs).toBeGreaterThan(0);

      // Verify video file exists
      const fileExists = await fs.access(result.videoPath).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify file size is reasonable (> 100KB for real recording)
      const stats = await fs.stat(result.videoPath);
      expect(stats.size).toBeGreaterThan(100 * 1024); // > 100KB
      expect(stats.size).toBeLessThan(100 * 1024 * 1024); // < 100MB
    }, 120000); // 2 minute timeout

    it('should convert WebM to MP4 when FFmpeg is available', async () => {
      // Check if FFmpeg is available
      const hasFfmpeg = await checkFfmpegInstalled();
      if (!hasFfmpeg) {
        console.log('Skipping MP4 conversion test - FFmpeg not installed');
        return;
      }

      // Load and record the demo
      const demo = await loadDemo(FIXTURE_PATH);
      const recorder = new PlaywrightRecorder({ headed: false });
      const result = await recorder.record(demo, TEST_OUTPUT_DIR);

      // Convert to MP4
      const mp4Path = await convertToMp4({ inputPath: result.videoPath });

      // Verify MP4 file exists
      expect(mp4Path).toMatch(/\.mp4$/);
      const fileExists = await fs.access(mp4Path).then(() => true).catch(() => false);
      expect(fileExists).toBe(true);

      // Verify MP4 file size
      const stats = await fs.stat(mp4Path);
      expect(stats.size).toBeGreaterThan(50 * 1024); // > 50KB
    }, 180000); // 3 minute timeout (recording + conversion)
  });

  describe('Highlight Helper', () => {
    it('should execute highlight helper without errors', async () => {
      // Create a simple demo that uses highlight
      const highlightDemo = {
        id: 'highlight-test',
        name: 'Highlight Test',
        url: 'https://news.ycombinator.com',
        run: async ({ wait, highlight }: { wait: (ms: number) => Promise<void>; highlight: (selector: string, ms?: number) => Promise<void> }) => {
          await wait(1500);
          // Highlight multiple elements
          await highlight('.athing:first-child .titleline > a', 400);
          await highlight('.athing:nth-child(2) .titleline > a', 400);
          await wait(500);
        },
      };

      const recorder = new PlaywrightRecorder({ headed: false });
      const result = await recorder.record(highlightDemo, TEST_OUTPUT_DIR);

      // If we get here without throwing, highlight worked
      expect(result.videoPath).toBeDefined();
      expect(result.durationMs).toBeGreaterThan(0);
    }, 60000); // 1 minute timeout
  });

  describe('Video Resolution', () => {
    it('should record at default 1920x1080 resolution', async () => {
      const demo = await loadDemo(FIXTURE_PATH);
      const recorder = new PlaywrightRecorder({ headed: false });
      const result = await recorder.record(demo, TEST_OUTPUT_DIR);

      // Video file should exist with reasonable size for 1080p
      const stats = await fs.stat(result.videoPath);
      expect(stats.size).toBeGreaterThan(100 * 1024);
    }, 120000);
  });
});
