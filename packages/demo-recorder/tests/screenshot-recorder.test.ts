import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScreenshotRecorder } from '../src/recorder/screenshot-recorder';
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
          }),
          mouse: {
            move: vi.fn().mockResolvedValue(undefined),
          },
          screenshot: vi.fn().mockResolvedValue(undefined),
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
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock gallery generator
vi.mock('../src/utils/gallery-generator', () => ({
  generateGallery: vi.fn().mockResolvedValue('/tmp/output/test/gallery.html'),
}));

describe('ScreenshotRecorder', () => {
  let recorder: ScreenshotRecorder;

  beforeEach(() => {
    recorder = new ScreenshotRecorder();
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      expect(recorder).toBeInstanceOf(ScreenshotRecorder);
    });

    it('should create instance with headed option', () => {
      const headedRecorder = new ScreenshotRecorder({ headed: true });
      expect(headedRecorder).toBeInstanceOf(ScreenshotRecorder);
    });

    it('should create instance with gallery option', () => {
      const noGalleryRecorder = new ScreenshotRecorder({ gallery: false });
      expect(noGalleryRecorder).toBeInstanceOf(ScreenshotRecorder);
    });
  });

  describe('capture', () => {
    it('should accept a valid demo definition', async () => {
      const demo: DemoDefinition = {
        id: 'test',
        name: 'Test Demo',
        url: 'https://example.com',
        run: async ({ wait }) => {
          await wait(100);
        },
      };

      const result = await recorder.capture(demo, '/tmp/output');
      expect(result).toHaveProperty('screenshots');
      expect(result).toHaveProperty('galleryPath');
      expect(result).toHaveProperty('outputDir');
      expect(Array.isArray(result.screenshots)).toBe(true);
    });

    it('should auto-capture after clickAnimated', async () => {
      const demo: DemoDefinition = {
        id: 'test-click',
        name: 'Test Click Demo',
        url: 'https://example.com',
        run: async ({ clickAnimated }) => {
          await clickAnimated('.button');
        },
      };

      const result = await recorder.capture(demo, '/tmp/output');
      expect(result.screenshots.length).toBeGreaterThan(0);
      expect(result.screenshots[0].action).toBe('click');
    });

    it('should respect gallery option', async () => {
      const noGalleryRecorder = new ScreenshotRecorder({ gallery: false });
      const demo: DemoDefinition = {
        id: 'test-no-gallery',
        name: 'Test No Gallery',
        url: 'https://example.com',
        run: async ({ wait }) => {
          await wait(100);
        },
      };

      const result = await noGalleryRecorder.capture(demo, '/tmp/output');
      expect(result.galleryPath).toBe('');
    });
  });
});
