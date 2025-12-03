import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateEmbedSnippets, generateEmbedFile } from '../src/utils/embed-generator';

// Mock fs/promises
vi.mock('fs/promises', () => ({
  default: {
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

import fs from 'fs/promises';

describe('embed-generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateEmbedSnippets', () => {
    it('should generate all snippet types', () => {
      const snippets = generateEmbedSnippets('/path/to/video.mp4');

      expect(snippets).toHaveProperty('videoTag');
      expect(snippets).toHaveProperty('iframe');
      expect(snippets).toHaveProperty('markdown');
      expect(snippets).toHaveProperty('githubMarkdown');
    });

    it('should generate video tag with default options', () => {
      const snippets = generateEmbedSnippets('/video.mp4');

      expect(snippets.videoTag).toContain('<video');
      expect(snippets.videoTag).toContain('src="/video.mp4"');
      expect(snippets.videoTag).toContain('width="100%"');
      expect(snippets.videoTag).toContain('controls');
      expect(snippets.videoTag).not.toContain('autoplay');
      expect(snippets.videoTag).not.toContain('loop');
      expect(snippets.videoTag).not.toContain('muted');
    });

    it('should include autoplay and related attributes', () => {
      const snippets = generateEmbedSnippets('/video.mp4', {
        autoplay: true,
      });

      expect(snippets.videoTag).toContain('autoplay');
      expect(snippets.videoTag).toContain('muted'); // Auto-mute when autoplay
      expect(snippets.videoTag).toContain('playsinline'); // Required for mobile
    });

    it('should include loop when enabled', () => {
      const snippets = generateEmbedSnippets('/video.mp4', {
        loop: true,
      });

      expect(snippets.videoTag).toContain('loop');
    });

    it('should include poster when provided', () => {
      const snippets = generateEmbedSnippets('/video.mp4', {
        poster: '/thumb.png',
      });

      expect(snippets.videoTag).toContain('poster="/thumb.png"');
    });

    it('should use custom dimensions', () => {
      const snippets = generateEmbedSnippets('/video.mp4', {
        width: 800,
        height: 600,
      });

      expect(snippets.videoTag).toContain('width="800px"');
      expect(snippets.videoTag).toContain('height="600px"');
    });

    it('should generate iframe with dimensions', () => {
      const snippets = generateEmbedSnippets('/video.mp4', {
        width: '100%',
        height: 400,
      });

      expect(snippets.iframe).toContain('<iframe');
      expect(snippets.iframe).toContain('src="/video.mp4"');
      expect(snippets.iframe).toContain('width="100%"');
      expect(snippets.iframe).toContain('height=400');
      expect(snippets.iframe).toContain('allowfullscreen');
    });

    it('should generate markdown link', () => {
      const snippets = generateEmbedSnippets('/video.mp4');

      expect(snippets.markdown).toContain('[![video]');
      expect(snippets.markdown).toContain('(/video.mp4)');
    });

    it('should generate github markdown with video tag', () => {
      const snippets = generateEmbedSnippets('/video.mp4');

      expect(snippets.githubMarkdown).toContain('<video');
      expect(snippets.githubMarkdown).toContain('src="/video.mp4"');
      expect(snippets.githubMarkdown).toContain('controls');
    });

    it('should include title in video tag', () => {
      const snippets = generateEmbedSnippets('/my-demo.mp4', {
        title: 'My Demo Video',
      });

      expect(snippets.videoTag).toContain('title="My Demo Video"');
    });

    it('should escape special characters in attributes', () => {
      const snippets = generateEmbedSnippets('/video.mp4', {
        title: 'Test "quotes" & <tags>',
      });

      expect(snippets.videoTag).toContain('&quot;');
      expect(snippets.videoTag).toContain('&amp;');
      expect(snippets.videoTag).toContain('&lt;');
    });
  });

  describe('generateEmbedFile', () => {
    it('should write embed file with snippets', async () => {
      const result = await generateEmbedFile('/path/to/video.mp4');

      expect(result).toBe('/path/to/video-embed.md');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/path/to/video-embed.md',
        expect.stringContaining('# Embed Snippets'),
        'utf-8'
      );
    });

    it('should use custom output path', async () => {
      const result = await generateEmbedFile('/video.mp4', '/custom/output.md');

      expect(result).toBe('/custom/output.md');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/custom/output.md',
        expect.any(String),
        'utf-8'
      );
    });

    it('should include all embed types in file', async () => {
      await generateEmbedFile('/video.mp4');

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const content = writeCall[1] as string;

      expect(content).toContain('## HTML5 Video Tag');
      expect(content).toContain('## Iframe Embed');
      expect(content).toContain('## Markdown');
      expect(content).toContain('## GitHub README');
    });

    it('should pass options to snippet generation', async () => {
      await generateEmbedFile('/video.mp4', undefined, {
        autoplay: true,
        loop: true,
      });

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const content = writeCall[1] as string;

      expect(content).toContain('autoplay');
      expect(content).toContain('loop');
    });

    it('should include footer attribution', async () => {
      await generateEmbedFile('/video.mp4');

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('demo-recorder'),
        'utf-8'
      );
    });
  });
});
