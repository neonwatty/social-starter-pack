import { describe, it, expect } from 'vitest';
import {
  generateStepBadgeCSS,
  generateTextAnnotationCSS,
  generateStepBadgeScript,
  generateTextAnnotationScript,
  generateRemoveAnnotationsScript,
  getActionDescription,
  DEFAULT_ANNOTATION_OPTIONS,
} from '../src/utils/annotations';

describe('annotations', () => {
  describe('DEFAULT_ANNOTATION_OPTIONS', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_ANNOTATION_OPTIONS.stepNumbers).toBe(false);
      expect(DEFAULT_ANNOTATION_OPTIONS.stepPosition).toBe('top-left');
      expect(DEFAULT_ANNOTATION_OPTIONS.stepSize).toBe(32);
      expect(DEFAULT_ANNOTATION_OPTIONS.stepBackground).toBe('#3b82f6');
      expect(DEFAULT_ANNOTATION_OPTIONS.stepTextColor).toBe('#ffffff');
    });
  });

  describe('generateStepBadgeCSS', () => {
    it('should generate CSS for step badge', () => {
      const css = generateStepBadgeCSS(1);
      expect(css).toContain('position: fixed');
      expect(css).toContain('border-radius: 50%');
      expect(css).toContain('z-index: 999999');
    });

    it('should use top-left position by default', () => {
      const css = generateStepBadgeCSS(1);
      expect(css).toContain('top:');
      expect(css).toContain('left:');
    });

    it('should apply custom position', () => {
      const css = generateStepBadgeCSS(1, { stepPosition: 'bottom-right' });
      expect(css).toContain('bottom:');
      expect(css).toContain('right:');
    });

    it('should apply custom colors', () => {
      const css = generateStepBadgeCSS(1, {
        stepBackground: '#ff0000',
        stepTextColor: '#000000',
      });
      expect(css).toContain('#ff0000');
      expect(css).toContain('#000000');
    });

    it('should apply custom size', () => {
      const css = generateStepBadgeCSS(1, { stepSize: 48 });
      expect(css).toContain('width: 48px');
      expect(css).toContain('height: 48px');
    });
  });

  describe('generateTextAnnotationCSS', () => {
    it('should generate CSS for text annotation', () => {
      const css = generateTextAnnotationCSS();
      expect(css).toContain('position: fixed');
      expect(css).toContain('left: 0');
      expect(css).toContain('right: 0');
    });

    it('should use bottom position by default', () => {
      const css = generateTextAnnotationCSS();
      expect(css).toContain('bottom: 0');
    });

    it('should apply top position when specified', () => {
      const css = generateTextAnnotationCSS({ textPosition: 'top' });
      expect(css).toContain('top: 0');
    });

    it('should apply custom colors', () => {
      const css = generateTextAnnotationCSS({
        textBackground: 'rgba(255, 0, 0, 0.5)',
        textColor: '#ffffff',
      });
      expect(css).toContain('rgba(255, 0, 0, 0.5)');
    });
  });

  describe('generateStepBadgeScript', () => {
    it('should generate executable JavaScript', () => {
      const script = generateStepBadgeScript(1);
      expect(script).toContain('(function()');
      expect(script).toContain('demo-recorder-step-badge');
      expect(script).toContain("textContent = '1'");
    });

    it('should include step number in script', () => {
      const script = generateStepBadgeScript(42);
      expect(script).toContain("textContent = '42'");
    });

    it('should remove existing badge before creating new one', () => {
      const script = generateStepBadgeScript(1);
      expect(script).toContain('existingBadge');
      expect(script).toContain('remove()');
    });
  });

  describe('generateTextAnnotationScript', () => {
    it('should generate executable JavaScript', () => {
      const script = generateTextAnnotationScript('Test caption');
      expect(script).toContain('(function()');
      expect(script).toContain('demo-recorder-text-annotation');
      expect(script).toContain('Test caption');
    });

    it('should escape single quotes', () => {
      const script = generateTextAnnotationScript("It's working");
      expect(script).toContain("\\'s working");
    });

    it('should remove existing annotation before creating new one', () => {
      const script = generateTextAnnotationScript('Test');
      expect(script).toContain('existingAnnotation');
      expect(script).toContain('remove()');
    });
  });

  describe('generateRemoveAnnotationsScript', () => {
    it('should generate script to remove all annotations', () => {
      const script = generateRemoveAnnotationsScript();
      expect(script).toContain('demo-recorder-step-badge');
      expect(script).toContain('demo-recorder-text-annotation');
      expect(script).toContain('remove()');
    });
  });

  describe('getActionDescription', () => {
    it('should return empty string for undefined action', () => {
      expect(getActionDescription()).toBe('');
      expect(getActionDescription(undefined)).toBe('');
    });

    it('should return label for known actions', () => {
      expect(getActionDescription('click')).toBe('Click');
      expect(getActionDescription('type')).toBe('Type text');
      expect(getActionDescription('highlight')).toBe('Highlight');
      expect(getActionDescription('scroll')).toBe('Scroll');
      expect(getActionDescription('manual')).toBe('Capture');
    });

    it('should include simplified selector for click action', () => {
      const desc = getActionDescription('click', '.submit-button');
      expect(desc).toContain('Click');
      expect(desc).toContain('.submit-button');
    });

    it('should truncate long selectors', () => {
      const longSelector = '.very-long-class-name-that-exceeds-forty-characters-in-length';
      const desc = getActionDescription('click', longSelector);
      expect(desc).toContain('...');
      expect(desc.length).toBeLessThanOrEqual(longSelector.length + 10);
    });

    it('should return action name for unknown actions', () => {
      expect(getActionDescription('custom-action')).toBe('custom-action');
    });
  });
});
