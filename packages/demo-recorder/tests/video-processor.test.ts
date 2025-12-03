import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

// Create mock using vi.hoisted to ensure it's available during mock hoisting
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

// Import after mock
import { checkFfmpegInstalled, getFfmpegVersion, convertToMp4, extractThumbnail, getVideoDuration } from '../src/recorder/video-processor';

describe('video-processor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkFfmpegInstalled', () => {
    it('should return true when FFmpeg exits with code 0', async () => {
      const promise = checkFfmpegInstalled();
      process.nextTick(() => getMockProcess().emit('close', 0));
      const result = await promise;
      expect(result).toBe(true);
    });

    it('should return false when FFmpeg exits with error', async () => {
      const promise = checkFfmpegInstalled();
      process.nextTick(() => getMockProcess().emit('error', new Error('not found')));
      const result = await promise;
      expect(result).toBe(false);
    });
  });

  describe('getFfmpegVersion', () => {
    it('should return version string when FFmpeg is available', async () => {
      const promise = getFfmpegVersion();
      process.nextTick(() => {
        getMockProcess().stdout.emit('data', 'ffmpeg version 6.0 Copyright');
        getMockProcess().emit('close', 0);
      });
      const result = await promise;
      expect(result).toBe('6.0');
    });

    it('should return null when FFmpeg errors', async () => {
      const promise = getFfmpegVersion();
      process.nextTick(() => getMockProcess().emit('error', new Error('not found')));
      const result = await promise;
      expect(result).toBe(null);
    });
  });

  describe('convertToMp4', () => {
    it('should generate output path from input path when not provided', async () => {
      const promise = convertToMp4({ inputPath: '/tmp/video.webm' });
      process.nextTick(() => getMockProcess().emit('close', 0));

      const result = await promise;
      expect(result).toBe('/tmp/video.mp4');
      expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining(['-i', '/tmp/video.webm']));
    });

    it('should use custom output path when provided', async () => {
      const promise = convertToMp4({
        inputPath: '/tmp/video.webm',
        outputPath: '/custom/output.mp4',
      });
      process.nextTick(() => getMockProcess().emit('close', 0));

      const result = await promise;
      expect(result).toBe('/custom/output.mp4');
    });

    it('should use h265 codec when specified', async () => {
      const promise = convertToMp4({
        inputPath: '/tmp/video.webm',
        codec: 'h265',
      });
      process.nextTick(() => getMockProcess().emit('close', 0));

      await promise;
      expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining(['-c:v', 'libx265']));
    });

    it('should reject when FFmpeg exits with error code', async () => {
      const promise = convertToMp4({ inputPath: '/tmp/video.webm' });
      process.nextTick(() => {
        getMockProcess().stderr.emit('data', 'Error: invalid input');
        getMockProcess().emit('close', 1);
      });

      await expect(promise).rejects.toThrow('FFmpeg exited with code 1');
    });

    it('should provide helpful error when FFmpeg is not found', async () => {
      const promise = convertToMp4({ inputPath: '/tmp/video.webm' });
      const enoentError = new Error('spawn ffmpeg ENOENT') as NodeJS.ErrnoException;
      enoentError.code = 'ENOENT';
      process.nextTick(() => getMockProcess().emit('error', enoentError));

      await expect(promise).rejects.toThrow('FFmpeg not found');
    });

    it('should use custom CRF value when provided', async () => {
      const promise = convertToMp4({
        inputPath: '/tmp/video.webm',
        crf: 18,
      });
      process.nextTick(() => getMockProcess().emit('close', 0));

      await promise;
      expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining(['-crf', '18']));
    });

    it('should use default h264 codec', async () => {
      const promise = convertToMp4({ inputPath: '/tmp/video.webm' });
      process.nextTick(() => getMockProcess().emit('close', 0));

      await promise;
      expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining(['-c:v', 'libx264']));
    });

    it('should handle generic FFmpeg errors', async () => {
      const promise = convertToMp4({ inputPath: '/tmp/video.webm' });
      const genericError = new Error('Some FFmpeg error');
      process.nextTick(() => getMockProcess().emit('error', genericError));

      await expect(promise).rejects.toThrow('FFmpeg error: Some FFmpeg error');
    });
  });

  describe('getVideoDuration', () => {
    it('should return duration when ffprobe succeeds', async () => {
      const promise = getVideoDuration('/tmp/video.mp4');
      process.nextTick(() => {
        getMockProcess().stdout.emit('data', '12.345\n');
        getMockProcess().emit('close', 0);
      });
      const result = await promise;
      expect(result).toBe(12.345);
    });

    it('should return 0 when ffprobe fails', async () => {
      const promise = getVideoDuration('/tmp/video.mp4');
      process.nextTick(() => getMockProcess().emit('close', 1));
      const result = await promise;
      expect(result).toBe(0);
    });

    it('should return 0 when ffprobe errors', async () => {
      const promise = getVideoDuration('/tmp/video.mp4');
      process.nextTick(() => getMockProcess().emit('error', new Error('not found')));
      const result = await promise;
      expect(result).toBe(0);
    });
  });

  describe('extractThumbnail', () => {
    it('should extract thumbnail with default settings', async () => {
      // First call for duration, second for extraction
      const promise = extractThumbnail({ inputPath: '/tmp/video.mp4' });
      process.nextTick(() => {
        // ffprobe call for duration
        getMockProcess().stdout.emit('data', '30.0\n');
        getMockProcess().emit('close', 0);
      });
      // Wait for duration check to complete, then handle FFmpeg call
      setTimeout(() => {
        getMockProcess().emit('close', 0);
      }, 10);

      const result = await promise;
      expect(result).toBe('/tmp/video-thumb.png');
    });

    it('should use custom timestamp when provided', async () => {
      const promise = extractThumbnail({ inputPath: '/tmp/video.mp4', timestamp: 5 });
      process.nextTick(() => getMockProcess().emit('close', 0));

      const result = await promise;
      expect(result).toBe('/tmp/video-thumb.png');
      expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining(['-ss', '5']));
    });

    it('should use custom width when provided', async () => {
      const promise = extractThumbnail({ inputPath: '/tmp/video.mp4', timestamp: 1, width: 800 });
      process.nextTick(() => getMockProcess().emit('close', 0));

      await promise;
      expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining(['-vf', 'scale=800:-1']));
    });

    it('should generate jpeg output with quality setting', async () => {
      const promise = extractThumbnail({
        inputPath: '/tmp/video.mp4',
        timestamp: 1,
        format: 'jpeg',
        quality: 80,
      });
      process.nextTick(() => getMockProcess().emit('close', 0));

      const result = await promise;
      expect(result).toBe('/tmp/video-thumb.jpg');
      expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', expect.arrayContaining(['-q:v']));
    });
  });
});
