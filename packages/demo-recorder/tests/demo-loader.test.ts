import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { loadDemo, listDemos } from '../src/core/demo-loader';
import fs from 'fs/promises';
import path from 'path';

const TEST_DEMOS_DIR = path.join(__dirname, 'fixtures', 'demos');
const VALID_DEMO_PATH = path.join(TEST_DEMOS_DIR, 'valid.demo.ts');
const INVALID_DEMO_PATH = path.join(TEST_DEMOS_DIR, 'invalid.demo.ts');

describe('demo-loader', () => {
  beforeAll(async () => {
    // Create test fixtures directory
    await fs.mkdir(TEST_DEMOS_DIR, { recursive: true });

    // Create a valid demo file
    await fs.writeFile(
      VALID_DEMO_PATH,
      `
const demo = {
  id: 'test-demo',
  name: 'Test Demo',
  url: 'https://example.com',
  run: async ({ page, wait, highlight }) => {
    await wait(100);
  },
};
module.exports = demo;
`
    );

    // Create an invalid demo file (missing required fields)
    await fs.writeFile(
      INVALID_DEMO_PATH,
      `
const demo = {
  id: 'invalid',
  // missing name, url, run
};
module.exports = demo;
`
    );
  });

  afterAll(async () => {
    // Clean up test fixtures
    await fs.rm(TEST_DEMOS_DIR, { recursive: true, force: true });
  });

  describe('loadDemo', () => {
    it('should load a valid demo file', async () => {
      const demo = await loadDemo(VALID_DEMO_PATH);
      expect(demo.id).toBe('test-demo');
      expect(demo.name).toBe('Test Demo');
      expect(demo.url).toBe('https://example.com');
      expect(typeof demo.run).toBe('function');
    });

    it('should throw error for missing required fields', async () => {
      await expect(loadDemo(INVALID_DEMO_PATH)).rejects.toThrow("Demo missing required field 'name'");
    });

    it('should throw error for non-existent file', async () => {
      await expect(loadDemo('/non/existent/file.demo.ts')).rejects.toThrow();
    });
  });

  describe('listDemos', () => {
    it('should list demo files in directory', async () => {
      const demos = await listDemos(TEST_DEMOS_DIR);
      expect(demos).toContain(VALID_DEMO_PATH);
      expect(demos).toContain(INVALID_DEMO_PATH);
      expect(demos.length).toBe(2);
    });

    it('should return empty array for non-existent directory', async () => {
      const demos = await listDemos('/non/existent/dir');
      expect(demos).toEqual([]);
    });

    it('should filter for .demo.ts files only', async () => {
      // Create a non-demo file
      const nonDemoFile = path.join(TEST_DEMOS_DIR, 'other.ts');
      await fs.writeFile(nonDemoFile, 'export const x = 1;');

      const demos = await listDemos(TEST_DEMOS_DIR);
      expect(demos).not.toContain(nonDemoFile);

      await fs.unlink(nonDemoFile);
    });
  });
});
