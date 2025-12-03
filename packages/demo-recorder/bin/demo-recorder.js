#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distIndex = path.join(rootDir, 'dist', 'index.js');
const srcIndex = path.join(rootDir, 'src', 'index.ts');

const args = process.argv.slice(2);

// Check if compiled version exists (production)
if (fs.existsSync(distIndex)) {
  // Use compiled JS directly
  require(distIndex);
} else if (fs.existsSync(srcIndex)) {
  // Development mode: use ts-node
  const tsNodePath = path.join(rootDir, 'node_modules', '.bin', 'ts-node');

  const child = spawn(tsNodePath, [srcIndex, ...args], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: { ...process.env, TS_NODE_PROJECT: path.join(rootDir, 'tsconfig.json') }
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
} else {
  console.error('Error: Could not find demo-recorder source files.');
  console.error('Please run "npm run build" or ensure the package is installed correctly.');
  process.exit(1);
}
