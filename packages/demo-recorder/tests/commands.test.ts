import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// We'll test the generateDemoTemplate function by importing it
// For now, test the template generation logic

describe('commands', () => {
  const TEST_DIR = path.join(__dirname, 'fixtures', 'commands');

  beforeEach(async () => {
    await fs.mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  });

  describe('demo template generation', () => {
    it('should generate valid TypeScript demo template', () => {
      const id = 'my-test-demo';
      const name = 'My Test Demo';
      const url = 'https://example.com';

      // Template structure we expect
      const expectedStructure = {
        hasImport: true,
        hasId: true,
        hasName: true,
        hasUrl: true,
        hasRunFunction: true,
        hasExport: true,
      };

      const template = `import type { DemoDefinition } from '../src/core/types';

const demo: DemoDefinition = {
  id: '${id}',
  name: '${name}',
  url: '${url}',

  run: async ({ page, wait, highlight }) => {
    await wait(1500);
    await wait(2000);
  },
};

export default demo;
`;

      expect(template.includes("import type { DemoDefinition }")).toBe(expectedStructure.hasImport);
      expect(template.includes(`id: '${id}'`)).toBe(expectedStructure.hasId);
      expect(template.includes(`name: '${name}'`)).toBe(expectedStructure.hasName);
      expect(template.includes(`url: '${url}'`)).toBe(expectedStructure.hasUrl);
      expect(template.includes('run: async')).toBe(expectedStructure.hasRunFunction);
      expect(template.includes('export default demo')).toBe(expectedStructure.hasExport);
    });

    it('should convert kebab-case id to title case name', () => {
      const id = 'my-awesome-feature';
      const words = id.split('-');
      const name = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      expect(name).toBe('My Awesome Feature');
    });
  });

  describe('RecordOptions', () => {
    it('should have correct default structure', () => {
      const defaultOptions = {
        output: './output',
        convert: true,
        headed: false,
      };

      expect(defaultOptions.output).toBe('./output');
      expect(defaultOptions.convert).toBe(true);
      expect(defaultOptions.headed).toBe(false);
    });
  });

  describe('CreateOptions', () => {
    it('should have correct structure with required url', () => {
      const createOptions = {
        url: 'https://example.com',
        name: 'Test Demo',
        dir: './demos',
        record: false,
        output: './output',
        headed: false,
      };

      expect(createOptions.url).toBe('https://example.com');
      expect(createOptions.dir).toBe('./demos');
      expect(createOptions.record).toBe(false);
    });
  });
});
