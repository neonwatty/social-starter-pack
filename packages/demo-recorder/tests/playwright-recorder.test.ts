import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaywrightRecorder } from '../src/recorder/playwright-recorder';
import type { DemoDefinition } from '../src/core/types';

// Mock playwright
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn().mockResolvedValue({
      newContext: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn().mockResolvedValue(undefined),
          waitForTimeout: vi.fn().mockResolvedValue(undefined),
          evaluate: vi.fn().mockResolvedValue(undefined),
          addStyleTag: vi.fn().mockResolvedValue(undefined),
          click: vi.fn().mockResolvedValue(undefined),
          keyboard: {
            type: vi.fn().mockResolvedValue(undefined),
          },
          $: vi.fn().mockResolvedValue({
            boundingBox: vi.fn().mockResolvedValue({ x: 100, y: 100, width: 50, height: 30 }),
            isVisible: vi.fn().mockResolvedValue(true),
            textContent: vi.fn().mockResolvedValue('Test text'),
          }),
          screenshot: vi.fn().mockResolvedValue(undefined),
          mouse: {
            move: vi.fn().mockResolvedValue(undefined),
          },
          video: vi.fn().mockReturnValue({
            path: vi.fn().mockResolvedValue('/tmp/video.webm'),
          }),
        }),
        close: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue(['test-video.webm']),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('PlaywrightRecorder', () => {
  let recorder: PlaywrightRecorder;

  beforeEach(() => {
    recorder = new PlaywrightRecorder();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(recorder).toBeInstanceOf(PlaywrightRecorder);
    });

    it('should create instance with headed option', () => {
      const headedRecorder = new PlaywrightRecorder({ headed: true });
      expect(headedRecorder).toBeInstanceOf(PlaywrightRecorder);
    });
  });

  describe('record', () => {
    it('should accept a valid demo definition', async () => {
      const demo: DemoDefinition = {
        id: 'test',
        name: 'Test Demo',
        url: 'https://example.com',
        run: async ({ wait }) => {
          await wait(100);
        },
      };

      // The actual recording uses mocked playwright
      // Just verify it doesn't throw with valid input
      const result = await recorder.record(demo, '/tmp/output');
      expect(result).toHaveProperty('videoPath');
      expect(result).toHaveProperty('durationMs');
    });
  });
});
