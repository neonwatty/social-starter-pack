import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMarkdown, generateMarkdownFromDirectory } from '../src/utils/markdown-generator';
import type { ScreenshotCapture } from '../src/core/types';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
  },
}));

import fs from 'fs/promises';

describe('markdown-generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateMarkdown', () => {
    it('should generate markdown with default options', async () => {
      const captures: ScreenshotCapture[] = [
        {
          filepath: '/output/screenshot-001-click-1.png',
          filename: 'screenshot-001-click-1.png',
          timestamp: Date.now(),
          action: 'click',
          selector: '.button',
        },
      ];

      const result = await generateMarkdown(captures, '/output', 'Test Demo');

      expect(result).toBe('/output/walkthrough.md');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/walkthrough.md',
        expect.stringContaining('# Test Demo'),
        'utf-8'
      );
    });

    it('should include custom title and description', async () => {
      const captures: ScreenshotCapture[] = [
        {
          filepath: '/output/screenshot-001.png',
          filename: 'screenshot-001.png',
          timestamp: Date.now(),
        },
      ];

      await generateMarkdown(captures, '/output', 'Default Name', {
        title: 'Custom Title',
        description: 'This is a description',
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/walkthrough.md',
        expect.stringContaining('# Custom Title'),
        'utf-8'
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/walkthrough.md',
        expect.stringContaining('This is a description'),
        'utf-8'
      );
    });

    it('should include timestamps when option is enabled', async () => {
      const captures: ScreenshotCapture[] = [
        {
          filepath: '/output/screenshot-001.png',
          filename: 'screenshot-001.png',
          timestamp: Date.now(),
          action: 'click',
        },
      ];

      await generateMarkdown(captures, '/output', 'Test', {
        includeTimestamps: true,
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/walkthrough.md',
        expect.stringContaining('*Captured at'),
        'utf-8'
      );
    });

    it('should include selectors when option is enabled', async () => {
      const captures: ScreenshotCapture[] = [
        {
          filepath: '/output/screenshot-001.png',
          filename: 'screenshot-001.png',
          timestamp: Date.now(),
          action: 'click',
          selector: '.my-button',
        },
      ];

      await generateMarkdown(captures, '/output', 'Test', {
        includeSelectors: true,
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/walkthrough.md',
        expect.stringContaining('.my-button'),
        'utf-8'
      );
    });

    it('should use relative paths by default', async () => {
      const captures: ScreenshotCapture[] = [
        {
          filepath: '/absolute/path/screenshot-001.png',
          filename: 'screenshot-001.png',
          timestamp: Date.now(),
        },
      ];

      await generateMarkdown(captures, '/output', 'Test');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/walkthrough.md',
        expect.stringContaining('![Step 1 - Action](screenshot-001.png)'),
        'utf-8'
      );
    });

    it('should use absolute paths when relativePaths is false', async () => {
      const captures: ScreenshotCapture[] = [
        {
          filepath: '/absolute/path/screenshot-001.png',
          filename: 'screenshot-001.png',
          timestamp: Date.now(),
        },
      ];

      await generateMarkdown(captures, '/output', 'Test', {
        relativePaths: false,
      });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/output/walkthrough.md',
        expect.stringContaining('(/absolute/path/screenshot-001.png)'),
        'utf-8'
      );
    });

    it('should handle multiple captures with step numbers', async () => {
      const captures: ScreenshotCapture[] = [
        { filepath: '/out/s1.png', filename: 's1.png', timestamp: Date.now(), action: 'click' },
        { filepath: '/out/s2.png', filename: 's2.png', timestamp: Date.now(), action: 'type' },
        { filepath: '/out/s3.png', filename: 's3.png', timestamp: Date.now(), action: 'scroll' },
      ];

      await generateMarkdown(captures, '/out', 'Test');

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const content = writeCall[1] as string;

      expect(content).toContain('## Step 1: Click');
      expect(content).toContain('## Step 2: Type text');
      expect(content).toContain('## Step 3: Scroll');
      expect(content).toContain('3 steps in this walkthrough');
    });

    it('should include footer with attribution', async () => {
      const captures: ScreenshotCapture[] = [
        { filepath: '/out/s1.png', filename: 's1.png', timestamp: Date.now() },
      ];

      await generateMarkdown(captures, '/out', 'Test');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/out/walkthrough.md',
        expect.stringContaining('demo-recorder'),
        'utf-8'
      );
    });
  });

  describe('generateMarkdownFromDirectory', () => {
    it('should throw error when no screenshots found', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([]);

      await expect(generateMarkdownFromDirectory('/empty')).rejects.toThrow(
        'No screenshots found'
      );
    });

    it('should find and process screenshot files', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'screenshot-001-click-1.png',
        'screenshot-002-type-1.png',
        'other-file.txt',
        'gallery.html',
      ] as unknown as string[]);

      const result = await generateMarkdownFromDirectory('/screenshots');

      expect(result).toBe('/screenshots/walkthrough.md');
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should parse action from filename', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'screenshot-001-click-1.png',
      ] as unknown as string[]);

      await generateMarkdownFromDirectory('/screenshots');

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/screenshots/walkthrough.md',
        expect.stringContaining('Click'),
        'utf-8'
      );
    });

    it('should use custom title option', async () => {
      vi.mocked(fs.readdir).mockResolvedValue([
        'screenshot-001.png',
      ] as unknown as string[]);

      await generateMarkdownFromDirectory('/screenshots', { title: 'Custom Title' });

      expect(fs.writeFile).toHaveBeenCalledWith(
        '/screenshots/walkthrough.md',
        expect.stringContaining('# Custom Title'),
        'utf-8'
      );
    });
  });
});
