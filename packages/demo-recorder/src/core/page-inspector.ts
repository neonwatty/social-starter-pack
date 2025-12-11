import type { Page } from 'playwright';

/**
 * Selector strategies for an element, from most to least reliable
 */
export interface SelectorStrategies {
  /** data-testid attribute (most reliable) */
  testId?: string;
  /** Element ID */
  id?: string;
  /** ARIA role + accessible name */
  role?: string;
  /** Text-based selector */
  text?: string;
  /** Fallback CSS selector (least reliable) */
  css: string;
}

/**
 * Element state information
 */
export interface ElementState {
  visible: boolean;
  enabled: boolean;
  inViewport: boolean;
}

/**
 * Bounding box for element positioning
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * An interactive element found on the page
 */
export interface InspectedElement {
  type: 'button' | 'link' | 'input' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'clickable';
  text: string;
  selectors: SelectorStrategies;
  state: ElementState;
  boundingBox: BoundingBox | null;
  /** Input placeholder text if applicable */
  placeholder?: string;
  /** Input type (text, email, password, etc.) */
  inputType?: string;
  /** Select options if applicable */
  options?: string[];
  /** Link href if applicable */
  href?: string;
}

/**
 * A page section (heading, landmark, etc.)
 */
export interface PageSection {
  tag: string;
  selector: string;
  text: string;
  distanceFromTop: number;
}

/**
 * Form field information
 */
export interface FormField {
  type: string;
  name: string;
  selector: string;
  placeholder?: string;
  required: boolean;
  label?: string;
}

/**
 * Form information
 */
export interface FormInfo {
  selector: string;
  fields: FormField[];
  submitButton?: string;
}

/**
 * Complete page inspection result
 */
export interface PageInspection {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  elements: InspectedElement[];
  sections: PageSection[];
  forms: FormInfo[];
  /** Total count of each element type */
  summary: Record<string, number>;
}

/**
 * Options for page inspection
 */
export interface InspectOptions {
  /** Include elements that are not visible */
  includeHidden?: boolean;
  /** Maximum elements to return per type */
  maxPerType?: number;
}

/**
 * Inspect a page and return comprehensive element information
 */
export async function inspectPage(page: Page, options: InspectOptions = {}): Promise<PageInspection> {
  const { includeHidden = false, maxPerType = 50 } = options;

  const viewport = page.viewportSize() || { width: 1920, height: 1080 };

  const result = await page.evaluate(
    ({ includeHidden, maxPerType, viewportWidth, viewportHeight }) => {
      // Helper functions (need to be defined inside evaluate)
      function generateCssSelector(el: HTMLElement): string {
        if (el.id) return `#${el.id}`;

        const testId = el.getAttribute('data-testid');
        if (testId) return `[data-testid="${testId}"]`;

        if (el.className && typeof el.className === 'string') {
          const classes = el.className
            .split(' ')
            .filter((c) => c && !c.startsWith('_') && !c.includes(':'));
          if (classes.length > 0) {
            return `${el.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`;
          }
        }

        const name = el.getAttribute('name');
        if (name) return `${el.tagName.toLowerCase()}[name="${name}"]`;

        return el.tagName.toLowerCase();
      }

      function getImplicitRole(el: HTMLElement): string | null {
        const tagRoles: Record<string, string> = {
          BUTTON: 'button',
          A: 'link',
          INPUT: 'textbox',
          SELECT: 'combobox',
          TEXTAREA: 'textbox',
        };
        if (el.tagName === 'INPUT') {
          const type = (el as HTMLInputElement).type;
          const inputRoles: Record<string, string> = {
            checkbox: 'checkbox',
            radio: 'radio',
            button: 'button',
            submit: 'button',
          };
          return inputRoles[type] || 'textbox';
        }
        return tagRoles[el.tagName] || null;
      }

      function getAccessibleName(el: HTMLElement): string | null {
        const ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) return ariaLabel;

        if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
          const id = el.id;
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return label.textContent?.trim() || null;
          }
        }

        if (el.tagName === 'BUTTON' || el.tagName === 'A') {
          return el.textContent?.trim()?.substring(0, 50) || null;
        }

        return null;
      }

      function isInViewport(el: HTMLElement): boolean {
        const rect = el.getBoundingClientRect();
        return (
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= viewportHeight &&
          rect.right <= viewportWidth
        );
      }

      function isVisible(el: HTMLElement): boolean {
        if (!el.offsetParent && el.tagName !== 'BODY') return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0')
          return false;
        return true;
      }

      function generateSelectors(el: HTMLElement) {
        const selectors: Record<string, string | undefined> = {
          css: generateCssSelector(el),
        };

        const testId = el.getAttribute('data-testid');
        if (testId) selectors.testId = `[data-testid="${testId}"]`;

        if (el.id) selectors.id = `#${el.id}`;

        const role = el.getAttribute('role') || getImplicitRole(el);
        const accessibleName = getAccessibleName(el);
        if (role && accessibleName) {
          selectors.role = `${el.tagName.toLowerCase()}[role="${role}"]:has-text("${accessibleName.substring(0, 30)}")`;
        }

        const text = el.innerText?.trim();
        if (text && text.length <= 50 && (el.tagName === 'BUTTON' || el.tagName === 'A')) {
          selectors.text = `${el.tagName.toLowerCase()}:has-text("${text.substring(0, 30)}")`;
        }

        return selectors;
      }

      // Collect elements
      interface CollectedElement {
        type: string;
        text: string;
        selectors: Record<string, string | undefined>;
        state: { visible: boolean; enabled: boolean; inViewport: boolean };
        boundingBox: { x: number; y: number; width: number; height: number } | null;
        placeholder?: string;
        inputType?: string;
        options?: string[];
        href?: string;
      }

      const elements: CollectedElement[] = [];
      const counts: Record<string, number> = {};

      function addElement(el: HTMLElement, type: string, extra: Partial<CollectedElement> = {}) {
        counts[type] = (counts[type] || 0) + 1;
        if (counts[type] > maxPerType) return;

        const visible = isVisible(el);
        if (!includeHidden && !visible) return;

        const rect = el.getBoundingClientRect();
        elements.push({
          type,
          text: el.innerText?.trim()?.substring(0, 100) || '',
          selectors: generateSelectors(el),
          state: {
            visible,
            enabled: !(el as HTMLButtonElement).disabled,
            inViewport: isInViewport(el),
          },
          boundingBox:
            rect.width > 0
              ? {
                  x: Math.round(rect.x),
                  y: Math.round(rect.y),
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                }
              : null,
          ...extra,
        });
      }

      // Buttons
      document.querySelectorAll('button').forEach((el) => {
        addElement(el as HTMLElement, 'button');
      });

      // Links
      document.querySelectorAll('a[href]').forEach((el) => {
        const link = el as HTMLAnchorElement;
        addElement(link, 'link', { href: link.href });
      });

      // Text inputs
      document
        .querySelectorAll('input[type="text"], input[type="email"], input[type="search"], input[type="password"], input[type="tel"], input[type="url"], input:not([type])')
        .forEach((el) => {
          const input = el as HTMLInputElement;
          addElement(input, 'input', {
            placeholder: input.placeholder || undefined,
            inputType: input.type || 'text',
          });
        });

      // File inputs
      document.querySelectorAll('input[type="file"]').forEach((el) => {
        const input = el as HTMLInputElement;
        addElement(input, 'file', { inputType: 'file' });
      });

      // Checkboxes
      document.querySelectorAll('input[type="checkbox"]').forEach((el) => {
        addElement(el as HTMLElement, 'checkbox');
      });

      // Radio buttons
      document.querySelectorAll('input[type="radio"]').forEach((el) => {
        addElement(el as HTMLElement, 'radio');
      });

      // Textareas
      document.querySelectorAll('textarea').forEach((el) => {
        const textarea = el as HTMLTextAreaElement;
        addElement(textarea, 'textarea', { placeholder: textarea.placeholder || undefined });
      });

      // Selects
      document.querySelectorAll('select').forEach((el) => {
        const select = el as HTMLSelectElement;
        const optionTexts = Array.from(select.options)
          .slice(0, 10)
          .map((o) => o.text);
        addElement(select, 'select', { options: optionTexts });
      });

      // Elements with click handlers or role=button (clickable divs, etc.)
      document.querySelectorAll('[role="button"], [onclick], [data-clickable]').forEach((el) => {
        if (el.tagName !== 'BUTTON' && el.tagName !== 'A') {
          addElement(el as HTMLElement, 'clickable');
        }
      });

      // Collect sections (headings and landmarks)
      interface CollectedSection {
        tag: string;
        selector: string;
        text: string;
        distanceFromTop: number;
      }

      const sections: CollectedSection[] = [];
      document.querySelectorAll('h1, h2, h3, section, [role="region"], main, nav, footer').forEach((el) => {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        sections.push({
          tag: htmlEl.tagName.toLowerCase(),
          selector: generateCssSelector(htmlEl),
          text: htmlEl.innerText?.trim()?.substring(0, 50) || '',
          distanceFromTop: Math.round(rect.top + window.scrollY),
        });
      });

      // Collect forms
      interface CollectedForm {
        selector: string;
        fields: Array<{
          type: string;
          name: string;
          selector: string;
          placeholder?: string;
          required: boolean;
          label?: string;
        }>;
        submitButton?: string;
      }

      const forms: CollectedForm[] = [];
      document.querySelectorAll('form').forEach((formEl, formIdx) => {
        const form = formEl as HTMLFormElement;
        const formSelector = form.id ? `#${form.id}` : `form:nth-of-type(${formIdx + 1})`;

        const fields: CollectedForm['fields'] = [];
        form.querySelectorAll('input, select, textarea').forEach((fieldEl) => {
          const field = fieldEl as HTMLInputElement;
          if (field.type === 'hidden' || field.type === 'submit') return;

          let label: string | undefined;
          if (field.id) {
            const labelEl = document.querySelector(`label[for="${field.id}"]`);
            if (labelEl) label = labelEl.textContent?.trim();
          }

          fields.push({
            type: field.type || field.tagName.toLowerCase(),
            name: field.name || '',
            selector: generateCssSelector(field),
            placeholder: (field as HTMLInputElement).placeholder || undefined,
            required: field.required,
            label,
          });
        });

        // Find submit button
        let submitButton: string | undefined;
        const submitBtn = form.querySelector('button[type="submit"], input[type="submit"], button:not([type])');
        if (submitBtn) {
          submitButton = generateCssSelector(submitBtn as HTMLElement);
        }

        forms.push({ selector: formSelector, fields, submitButton });
      });

      return {
        title: document.title,
        elements,
        sections: sections.slice(0, 30),
        forms,
        summary: counts,
      };
    },
    { includeHidden, maxPerType, viewportWidth: viewport.width, viewportHeight: viewport.height }
  );

  // Transform elements to ensure proper typing
  const elements: InspectedElement[] = result.elements.map((el) => ({
    type: el.type as InspectedElement['type'],
    text: el.text,
    selectors: {
      testId: el.selectors.testId,
      id: el.selectors.id,
      role: el.selectors.role,
      text: el.selectors.text,
      css: el.selectors.css || el.type, // Ensure css is always present
    },
    state: el.state,
    boundingBox: el.boundingBox,
    placeholder: el.placeholder,
    inputType: el.inputType,
    options: el.options,
    href: el.href,
  }));

  return {
    url: page.url(),
    title: result.title,
    viewport,
    elements,
    sections: result.sections,
    forms: result.forms,
    summary: result.summary,
  };
}

/**
 * Get the best selector for an element (most reliable first)
 */
export function getBestSelector(selectors: SelectorStrategies): string {
  return selectors.testId || selectors.id || selectors.role || selectors.text || selectors.css;
}

/**
 * Format inspection results as a human-readable table
 */
export function formatInspectionTable(inspection: PageInspection): string {
  const lines: string[] = [];

  lines.push(`\nPage: ${inspection.title}`);
  lines.push(`URL: ${inspection.url}`);
  lines.push(`Viewport: ${inspection.viewport.width}x${inspection.viewport.height}`);
  lines.push('');

  // Summary
  lines.push('Element Summary:');
  for (const [type, count] of Object.entries(inspection.summary)) {
    lines.push(`  ${type}: ${count}`);
  }
  lines.push('');

  // Elements table
  lines.push('─'.repeat(120));
  lines.push(
    'TYPE'.padEnd(12) +
      'BEST SELECTOR'.padEnd(55) +
      'TEXT'.padEnd(30) +
      'VISIBLE'.padEnd(8) +
      'ENABLED'.padEnd(8) +
      'IN VIEW'
  );
  lines.push('─'.repeat(120));

  for (const el of inspection.elements) {
    const bestSelector = getBestSelector(el.selectors);
    const visible = el.state.visible ? '\u2713' : '\u2717';
    const enabled = el.state.enabled ? '\u2713' : '\u2717';
    const inView = el.state.inViewport ? '\u2713' : '\u2717';
    lines.push(
      el.type.padEnd(12) +
        bestSelector.substring(0, 53).padEnd(55) +
        el.text.substring(0, 28).padEnd(30) +
        visible.padEnd(8) +
        enabled.padEnd(8) +
        inView
    );
  }
  lines.push('─'.repeat(120));

  // Forms
  if (inspection.forms.length > 0) {
    lines.push('\nForms:');
    for (const form of inspection.forms) {
      lines.push(`  ${form.selector}`);
      for (const field of form.fields) {
        const label = field.label ? ` "${field.label}"` : '';
        const required = field.required ? ' (required)' : '';
        lines.push(`    - ${field.type}: ${field.selector}${label}${required}`);
      }
      if (form.submitButton) {
        lines.push(`    Submit: ${form.submitButton}`);
      }
    }
  }

  // Sections
  if (inspection.sections.length > 0) {
    lines.push('\nPage Sections:');
    for (const section of inspection.sections.slice(0, 15)) {
      lines.push(`  ${section.distanceFromTop}px - <${section.tag}> ${section.text.substring(0, 40)}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}
