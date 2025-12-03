import { describe, it, expect } from 'vitest';
import { DEFAULT_VIDEO_SETTINGS } from '../src/core/types';

describe('types', () => {
  describe('DEFAULT_VIDEO_SETTINGS', () => {
    it('should have correct default width', () => {
      expect(DEFAULT_VIDEO_SETTINGS.width).toBe(1920);
    });

    it('should have correct default height', () => {
      expect(DEFAULT_VIDEO_SETTINGS.height).toBe(1080);
    });
  });
});
