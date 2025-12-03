import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// Mock ora
vi.mock('ora', () => ({
  default: () => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    info: vi.fn().mockReturnThis(),
    text: '',
  }),
}));

// Mock playwright recorder - using a class constructor
vi.mock('../src/recorder/playwright-recorder', () => {
  const MockPlaywrightRecorder = function(this: { record: () => Promise<unknown> }) {
    this.record = vi.fn().mockResolvedValue({
      videoPath: '/tmp/test-video.webm',
      durationMs: 5000,
    });
  };
  return { PlaywrightRecorder: MockPlaywrightRecorder };
});

// Mock video processor
vi.mock('../src/recorder/video-processor', () => ({
  convertToMp4: vi.fn().mockResolvedValue('/tmp/test-video.mp4'),
  checkFfmpegInstalled: vi.fn().mockResolvedValue(true),
}));

// Import after mocks
import { createCommand, recordCommand, listCommand } from '../src/cli/commands';

describe('CLI Commands Integration', () => {
  const TEST_DIR = path.join(__dirname, 'fixtures', 'cli-test');
  const DEMOS_DIR = path.join(TEST_DIR, 'demos');

  beforeEach(async () => {
    await fs.mkdir(DEMOS_DIR, { recursive: true });
    // Suppress console output during tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  describe('createCommand', () => {
    it('should create a demo file with correct content', async () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      await createCommand('test-feature', {
        url: 'https://example.com',
        name: 'Test Feature',
        dir: DEMOS_DIR,
        record: false,
        output: './output',
        headed: false,
      });

      const filePath = path.join(DEMOS_DIR, 'test-feature.demo.ts');
      const content = await fs.readFile(filePath, 'utf-8');

      expect(content).toContain("id: 'test-feature'");
      expect(content).toContain("name: 'Test Feature'");
      expect(content).toContain("url: 'https://example.com'");
      expect(content).toContain('run: async');

      mockExit.mockRestore();
    });

    it('should auto-generate name from id if not provided', async () => {
      await createCommand('my-awesome-demo', {
        url: 'https://example.com',
        dir: DEMOS_DIR,
        record: false,
        output: './output',
        headed: false,
      });

      const filePath = path.join(DEMOS_DIR, 'my-awesome-demo.demo.ts');
      const content = await fs.readFile(filePath, 'utf-8');

      expect(content).toContain("name: 'My Awesome Demo'");
    });
  });

  describe('recordCommand', () => {
    it('should record a valid demo file', async () => {
      // Create a valid demo file first (using .js so require() can load it)
      const demoPath = path.join(DEMOS_DIR, 'record-test.demo.js');
      await fs.writeFile(demoPath, `
const demo = {
  id: 'record-test',
  name: 'Record Test',
  url: 'https://example.com',
  run: async ({ wait }) => { await wait(100); },
};
module.exports = demo;
`);

      await recordCommand(demoPath, {
        output: path.join(TEST_DIR, 'output'),
        convert: true,
        headed: false,
      });

      // If we get here without error, the command succeeded
      expect(true).toBe(true);
    });
  });

  describe('listCommand', () => {
    it('should list demo files in directory', async () => {
      // Create some demo files (using .js so require() can load them)
      await fs.writeFile(
        path.join(DEMOS_DIR, 'demo1.demo.js'),
        `module.exports = { id: 'demo1', name: 'Demo 1', url: 'https://example.com', run: async () => {} };`
      );
      await fs.writeFile(
        path.join(DEMOS_DIR, 'demo2.demo.js'),
        `module.exports = { id: 'demo2', name: 'Demo 2', url: 'https://test.com', run: async () => {} };`
      );

      await listCommand({ dir: DEMOS_DIR });

      // Verify console.log was called with demo info
      expect(console.log).toHaveBeenCalled();
    });

    it('should handle empty directory', async () => {
      const emptyDir = path.join(TEST_DIR, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      await listCommand({ dir: emptyDir });

      // Should not throw
      expect(true).toBe(true);
    });
  });
});
