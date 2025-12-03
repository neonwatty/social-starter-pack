import { describe, it, expect } from 'vitest';
import {
  VIEWPORT_PRESETS,
  MOBILE_PRESETS,
  DESKTOP_PRESETS,
  getViewportPreset,
  listPresetNames,
  listMobilePresets,
  listDesktopPresets,
  parseViewport,
} from '../src/core/viewports';

describe('viewports', () => {
  describe('VIEWPORT_PRESETS', () => {
    it('should include mobile presets', () => {
      expect(VIEWPORT_PRESETS['iphone-15-pro']).toBeDefined();
      expect(VIEWPORT_PRESETS['ipad']).toBeDefined();
      expect(VIEWPORT_PRESETS['pixel-7']).toBeDefined();
    });

    it('should include desktop presets', () => {
      expect(VIEWPORT_PRESETS['desktop']).toBeDefined();
      expect(VIEWPORT_PRESETS['macbook-pro-14']).toBeDefined();
    });

    it('should have valid dimensions for all presets', () => {
      for (const preset of Object.values(VIEWPORT_PRESETS)) {
        expect(preset.width).toBeGreaterThan(0);
        expect(preset.height).toBeGreaterThan(0);
        expect(preset.name).toBeTruthy();
      }
    });
  });

  describe('MOBILE_PRESETS', () => {
    it('should have isMobile and hasTouch set for all mobile devices', () => {
      for (const preset of Object.values(MOBILE_PRESETS)) {
        expect(preset.isMobile).toBe(true);
        expect(preset.hasTouch).toBe(true);
      }
    });

    it('should include common iPhone models', () => {
      expect(MOBILE_PRESETS['iphone-se']).toBeDefined();
      expect(MOBILE_PRESETS['iphone-12']).toBeDefined();
      expect(MOBILE_PRESETS['iphone-15-pro']).toBeDefined();
      expect(MOBILE_PRESETS['iphone-15-pro-max']).toBeDefined();
    });

    it('should include iPad models', () => {
      expect(MOBILE_PRESETS['ipad']).toBeDefined();
      expect(MOBILE_PRESETS['ipad-pro-11']).toBeDefined();
      expect(MOBILE_PRESETS['ipad-pro-12']).toBeDefined();
    });

    it('should include Android devices', () => {
      expect(MOBILE_PRESETS['pixel-7']).toBeDefined();
      expect(MOBILE_PRESETS['samsung-s21']).toBeDefined();
      expect(MOBILE_PRESETS['android-tablet']).toBeDefined();
    });
  });

  describe('DESKTOP_PRESETS', () => {
    it('should not have isMobile set', () => {
      for (const preset of Object.values(DESKTOP_PRESETS)) {
        expect(preset.isMobile).toBeUndefined();
      }
    });

    it('should include common desktop sizes', () => {
      expect(DESKTOP_PRESETS['desktop']).toBeDefined();
      expect(DESKTOP_PRESETS['desktop-hd']).toBeDefined();
      expect(DESKTOP_PRESETS['laptop']).toBeDefined();
    });
  });

  describe('getViewportPreset', () => {
    it('should return preset by name', () => {
      const preset = getViewportPreset('iphone-15-pro');
      expect(preset).toBeDefined();
      expect(preset?.width).toBe(393);
      expect(preset?.height).toBe(852);
    });

    it('should be case-insensitive', () => {
      const preset = getViewportPreset('IPHONE-15-PRO');
      expect(preset).toBeDefined();
    });

    it('should return undefined for unknown preset', () => {
      const preset = getViewportPreset('unknown-device');
      expect(preset).toBeUndefined();
    });
  });

  describe('listPresetNames', () => {
    it('should return all preset names', () => {
      const names = listPresetNames();
      expect(names).toContain('iphone-15-pro');
      expect(names).toContain('desktop');
      expect(names.length).toBeGreaterThan(10);
    });
  });

  describe('listMobilePresets', () => {
    it('should return only mobile preset names', () => {
      const names = listMobilePresets();
      expect(names).toContain('iphone-15-pro');
      expect(names).toContain('ipad');
      expect(names).not.toContain('desktop');
    });
  });

  describe('listDesktopPresets', () => {
    it('should return only desktop preset names', () => {
      const names = listDesktopPresets();
      expect(names).toContain('desktop');
      expect(names).toContain('macbook-pro-14');
      expect(names).not.toContain('iphone-15-pro');
    });
  });

  describe('parseViewport', () => {
    it('should parse preset name', () => {
      const result = parseViewport('iphone-15-pro');
      expect(result).toBeDefined();
      expect(result?.width).toBe(393);
      expect(result?.height).toBe(852);
    });

    it('should parse WxH format', () => {
      const result = parseViewport('1024x768');
      expect(result).toBeDefined();
      expect(result?.width).toBe(1024);
      expect(result?.height).toBe(768);
      expect(result?.name).toContain('Custom');
    });

    it('should handle uppercase WxH format', () => {
      const result = parseViewport('1920X1080');
      expect(result).toBeDefined();
      expect(result?.width).toBe(1920);
      expect(result?.height).toBe(1080);
    });

    it('should return undefined for invalid input', () => {
      expect(parseViewport('invalid')).toBeUndefined();
      expect(parseViewport('100')).toBeUndefined();
      expect(parseViewport('100x')).toBeUndefined();
      expect(parseViewport('x100')).toBeUndefined();
    });
  });
});
