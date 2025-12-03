import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

// Create mock using vi.hoisted
const { mockSpawn, getMockProcess } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { EventEmitter } = require('events');

  let currentMockProcess: EventEmitter & { stderr: EventEmitter; stdout: EventEmitter };

  const createMockProcess = () => {
    const proc = new EventEmitter() as EventEmitter & { stderr: EventEmitter; stdout: EventEmitter };
    proc.stderr = new EventEmitter();
    proc.stdout = new EventEmitter();
    return proc;
  };

  const mockSpawn = vi.fn(() => {
    currentMockProcess = createMockProcess();
    return currentMockProcess;
  });

  return {
    mockSpawn,
    getMockProcess: () => currentMockProcess,
  };
});

// Mock child_process
vi.mock('child_process', () => ({
  spawn: mockSpawn,
}));

// Mock fs for file operations
vi.mock('fs/promises', () => ({
  default: {
    stat: vi.fn().mockResolvedValue({ size: 1024 * 1024 }), // 1MB
    unlink: vi.fn().mockResolvedValue(undefined),
  },
  stat: vi.fn().mockResolvedValue({ size: 1024 * 1024 }),
  unlink: vi.fn().mockResolvedValue(undefined),
}));

// Import after mock
import { convertToGif, estimateGifSize } from '../src/recorder/gif-processor';

describe('gif-processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('convertToGif', () => {
    it('should generate output path from input path', async () => {
      const promise = convertToGif({ inputPath: '/tmp/video.mp4', highQuality: false });
      process.nextTick(() => getMockProcess().emit('close', 0));

      const result = await promise;
      expect(result).toBe('/tmp/video.gif');
    });

    it('should use custom output path when provided', async () => {
      const promise = convertToGif({
        inputPath: '/tmp/video.mp4',
        outputPath: '/custom/output.gif',
        highQuality: false,
      });
      process.nextTick(() => getMockProcess().emit('close', 0));

      const result = await promise;
      expect(result).toBe('/custom/output.gif');
    });

    it('should use default settings for single-pass', async () => {
      const promise = convertToGif({ inputPath: '/tmp/video.mp4', highQuality: false });
      process.nextTick(() => getMockProcess().emit('close', 0));

      await promise;
      expect(mockSpawn).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-vf', 'fps=10,scale=800:-1:flags=lanczos'])
      );
    });

    it('should use two-pass encoding for high quality', async () => {
      const promise = convertToGif({ inputPath: '/tmp/video.mp4', highQuality: true });

      // First call for palette generation
      process.nextTick(() => getMockProcess().emit('close', 0));
      // Second call for GIF creation
      setTimeout(() => getMockProcess().emit('close', 0), 10);

      await promise;
      // Should have been called twice (palette + gif)
      expect(mockSpawn).toHaveBeenCalledTimes(2);
    });

    it('should use custom fps setting', async () => {
      const promise = convertToGif({ inputPath: '/tmp/video.mp4', fps: 15, highQuality: false });
      process.nextTick(() => getMockProcess().emit('close', 0));

      await promise;
      expect(mockSpawn).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-vf', 'fps=15,scale=800:-1:flags=lanczos'])
      );
    });

    it('should use custom width setting', async () => {
      const promise = convertToGif({ inputPath: '/tmp/video.mp4', width: 600, highQuality: false });
      process.nextTick(() => getMockProcess().emit('close', 0));

      await promise;
      expect(mockSpawn).toHaveBeenCalledWith(
        'ffmpeg',
        expect.arrayContaining(['-vf', 'fps=10,scale=600:-1:flags=lanczos'])
      );
    });

    it('should reject when FFmpeg fails', async () => {
      const promise = convertToGif({ inputPath: '/tmp/video.mp4', highQuality: false });
      process.nextTick(() => {
        getMockProcess().stderr.emit('data', 'Error: conversion failed');
        getMockProcess().emit('close', 1);
      });

      await expect(promise).rejects.toThrow('FFmpeg exited with code 1');
    });

    it('should provide helpful error when FFmpeg is not found', async () => {
      const promise = convertToGif({ inputPath: '/tmp/video.mp4', highQuality: false });
      const enoentError = new Error('spawn ffmpeg ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      process.nextTick(() => getMockProcess().emit('error', enoentError));

      await expect(promise).rejects.toThrow('FFmpeg not found');
    });
  });

  describe('estimateGifSize', () => {
    it('should estimate size for standard settings', () => {
      const result = estimateGifSize(10, 800, 10);
      expect(result.estimatedMb).toBeGreaterThan(0);
      expect(typeof result.warning).toBe('boolean');
    });

    it('should warn for large estimated sizes', () => {
      // 30 seconds at 800px and 15fps should exceed 10MB
      const result = estimateGifSize(30, 800, 15);
      expect(result.warning).toBe(true);
    });

    it('should not warn for small videos', () => {
      const result = estimateGifSize(5, 600, 8);
      expect(result.warning).toBe(false);
    });

    it('should scale estimate with width', () => {
      const small = estimateGifSize(10, 400, 10);
      const large = estimateGifSize(10, 800, 10);
      expect(large.estimatedMb).toBeGreaterThan(small.estimatedMb);
    });
  });
});
