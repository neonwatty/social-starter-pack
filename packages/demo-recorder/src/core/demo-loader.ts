import path from 'path';
import type { DemoDefinition } from './types';

/**
 * Load and validate a demo definition file
 */
export async function loadDemo(filePath: string): Promise<DemoDefinition> {
  const absolutePath = path.resolve(filePath);

  // Clear require cache to allow reloading modified demos
  delete require.cache[require.resolve(absolutePath)];

  // Use require for CommonJS compatibility with ts-node
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const module = require(absolutePath);
  const demo: DemoDefinition = module.default || module;

  // Validate required fields
  validateDemo(demo, filePath);

  return demo;
}

function validateDemo(demo: unknown, filePath: string): asserts demo is DemoDefinition {
  if (!demo || typeof demo !== 'object') {
    throw new Error(`Invalid demo file: ${filePath} - must export an object`);
  }

  const d = demo as Record<string, unknown>;

  if (typeof d.id !== 'string' || !d.id) {
    throw new Error(`Demo missing required field 'id': ${filePath}`);
  }

  if (typeof d.name !== 'string' || !d.name) {
    throw new Error(`Demo missing required field 'name': ${filePath}`);
  }

  if (typeof d.url !== 'string' || !d.url) {
    throw new Error(`Demo missing required field 'url': ${filePath}`);
  }

  if (typeof d.run !== 'function') {
    throw new Error(`Demo missing required field 'run' (must be async function): ${filePath}`);
  }
}

/**
 * List all demo files in a directory
 */
export async function listDemos(demosDir: string): Promise<string[]> {
  const fs = await import('fs/promises');
  const resolvedDir = path.resolve(demosDir);

  try {
    const files = await fs.readdir(resolvedDir);
    return files
      .filter(f => f.endsWith('.demo.ts') || f.endsWith('.demo.js') || f.endsWith('.demo.mjs'))
      .map(f => path.join(resolvedDir, f));
  } catch {
    return [];
  }
}
