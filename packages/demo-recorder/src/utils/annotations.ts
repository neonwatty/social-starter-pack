/**
 * Annotation options for screenshots
 */
export interface AnnotationOptions {
  /** Add step number badges (default: false) */
  stepNumbers?: boolean;
  /** Step number badge position */
  stepPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Step number badge size in pixels */
  stepSize?: number;
  /** Step number badge background color */
  stepBackground?: string;
  /** Step number badge text color */
  stepTextColor?: string;
  /** Custom text annotation */
  text?: string;
  /** Text position */
  textPosition?: 'top' | 'bottom';
  /** Text background color */
  textBackground?: string;
  /** Text color */
  textColor?: string;
}

export const DEFAULT_ANNOTATION_OPTIONS: AnnotationOptions = {
  stepNumbers: false,
  stepPosition: 'top-left',
  stepSize: 32,
  stepBackground: '#3b82f6',
  stepTextColor: '#ffffff',
  textPosition: 'bottom',
  textBackground: 'rgba(0, 0, 0, 0.75)',
  textColor: '#ffffff',
};

/**
 * Generate CSS for step number badge
 */
export function generateStepBadgeCSS(
  stepNumber: number,
  options: AnnotationOptions = {}
): string {
  const {
    stepPosition = 'top-left',
    stepSize = 32,
    stepBackground = '#3b82f6',
    stepTextColor = '#ffffff',
  } = options;

  const positionStyles: Record<string, string> = {
    'top-left': 'top: 16px; left: 16px;',
    'top-right': 'top: 16px; right: 16px;',
    'bottom-left': 'bottom: 16px; left: 16px;',
    'bottom-right': 'bottom: 16px; right: 16px;',
  };

  return `
    position: fixed;
    ${positionStyles[stepPosition]}
    width: ${stepSize}px;
    height: ${stepSize}px;
    border-radius: 50%;
    background: ${stepBackground};
    color: ${stepTextColor};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: ${Math.floor(stepSize * 0.5)}px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  `;
}

/**
 * Generate CSS for text annotation bar
 */
export function generateTextAnnotationCSS(options: AnnotationOptions = {}): string {
  const {
    textPosition = 'bottom',
    textBackground = 'rgba(0, 0, 0, 0.75)',
    textColor = '#ffffff',
  } = options;

  const positionStyle = textPosition === 'top' ? 'top: 0;' : 'bottom: 0;';

  return `
    position: fixed;
    ${positionStyle}
    left: 0;
    right: 0;
    padding: 12px 20px;
    background: ${textBackground};
    color: ${textColor};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    text-align: center;
    z-index: 999998;
  `;
}

/**
 * Generate JavaScript to inject step number badge into page
 */
export function generateStepBadgeScript(
  stepNumber: number,
  options: AnnotationOptions = {}
): string {
  const css = generateStepBadgeCSS(stepNumber, options);

  return `
    (function() {
      const existingBadge = document.getElementById('demo-recorder-step-badge');
      if (existingBadge) existingBadge.remove();

      const badge = document.createElement('div');
      badge.id = 'demo-recorder-step-badge';
      badge.textContent = '${stepNumber}';
      badge.style.cssText = \`${css.replace(/\n/g, ' ')}\`;
      document.body.appendChild(badge);
    })();
  `;
}

/**
 * Generate JavaScript to inject text annotation into page
 */
export function generateTextAnnotationScript(
  text: string,
  options: AnnotationOptions = {}
): string {
  const css = generateTextAnnotationCSS(options);
  const escapedText = text.replace(/'/g, "\\'").replace(/\n/g, '\\n');

  return `
    (function() {
      const existingAnnotation = document.getElementById('demo-recorder-text-annotation');
      if (existingAnnotation) existingAnnotation.remove();

      const annotation = document.createElement('div');
      annotation.id = 'demo-recorder-text-annotation';
      annotation.textContent = '${escapedText}';
      annotation.style.cssText = \`${css.replace(/\n/g, ' ')}\`;
      document.body.appendChild(annotation);
    })();
  `;
}

/**
 * Generate JavaScript to remove all annotations from page
 */
export function generateRemoveAnnotationsScript(): string {
  return `
    (function() {
      const badge = document.getElementById('demo-recorder-step-badge');
      if (badge) badge.remove();

      const annotation = document.getElementById('demo-recorder-text-annotation');
      if (annotation) annotation.remove();
    })();
  `;
}

/**
 * Get action description for annotation
 */
export function getActionDescription(action?: string, selector?: string): string {
  if (!action) return '';

  const actionLabels: Record<string, string> = {
    click: 'Click',
    type: 'Type text',
    highlight: 'Highlight',
    scroll: 'Scroll',
    manual: 'Capture',
  };

  const label = actionLabels[action] || action;

  if (selector && action === 'click') {
    // Simplify selector for display
    const simplified = simplifySelector(selector);
    return `${label}: ${simplified}`;
  }

  return label;
}

/**
 * Simplify a CSS selector for display
 */
function simplifySelector(selector: string): string {
  // Remove complex selectors, keep simple ones readable
  if (selector.length > 40) {
    // Try to extract meaningful part
    const match = selector.match(/[.#][\w-]+/);
    if (match) {
      return match[0] + '...';
    }
    return selector.slice(0, 37) + '...';
  }
  return selector;
}
