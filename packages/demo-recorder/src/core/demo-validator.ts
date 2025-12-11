import { chromium, Page } from 'playwright';
import type { DemoDefinition } from './types';

/**
 * Result of validating a single selector
 */
export interface SelectorValidation {
  selector: string;
  status: 'found' | 'not_found' | 'multiple';
  matchCount: number;
  suggestions?: string[];
  elementText?: string;
}

/**
 * Result of validating an entire demo
 */
export interface DemoValidationResult {
  demoId: string;
  demoName: string;
  url: string;
  selectors: SelectorValidation[];
  passed: number;
  failed: number;
  warnings: number;
}

/**
 * Options for demo validation
 */
export interface ValidateOptions {
  headed?: boolean;
  viewport?: { width: number; height: number };
}

/**
 * Extract selectors from a demo's run function by analyzing the code
 * This is a simple regex-based extraction - not perfect but good enough
 */
export function extractSelectorsFromCode(code: string): string[] {
  const selectors: Set<string> = new Set();

  // Match common patterns:
  // clickAnimated('selector'), highlight('selector'), typeAnimated('selector', ...)
  // page.click('selector'), page.$('selector'), etc.
  const patterns = [
    // Demo context helpers - match complete quoted strings
    /(?:clickAnimated|highlight|zoomHighlight|moveTo|typeAnimated|scrollToElement|waitForEnabled|waitForText|waitForTextChange|uploadFile|exists|isVisible)\s*\(\s*['"]([^'"]+)['"]/g,
    // Playwright page methods - match complete quoted strings
    /page\.(?:click|fill|type|locator|waitForSelector|\$|\$\$)\s*\(\s*['"]([^'"]+)['"]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const selector = match[1];
      // Filter out obvious non-selectors
      if (
        selector &&
        !selector.startsWith('http') &&
        !selector.match(/^[a-z]+:\/\//) &&
        selector.length < 200 &&
        selector.length > 1 &&
        // Must look like a valid CSS selector
        (selector.startsWith('.') ||
         selector.startsWith('#') ||
         selector.startsWith('[') ||
         selector.match(/^[a-z][\w-]*(\[|:|\.)/i) ||
         selector.match(/^[a-z][\w-]*$/i)) &&
        // Reject malformed attribute selectors (must have closing bracket)
        (!selector.includes('[') || selector.includes(']'))
      ) {
        selectors.add(selector);
      }
    }
  }

  return Array.from(selectors);
}

/**
 * Validate a single selector on the page
 */
async function validateSelector(
  page: Page,
  selector: string
): Promise<SelectorValidation> {
  try {
    const elements = await page.$$(selector);
    const count = elements.length;

    if (count === 0) {
      // Try to find similar elements and suggest alternatives
      const suggestions = await findSimilarSelectors(page, selector);
      return {
        selector,
        status: 'not_found',
        matchCount: 0,
        suggestions,
      };
    } else if (count === 1) {
      // Get element text for context
      const text = await elements[0].textContent();
      return {
        selector,
        status: 'found',
        matchCount: 1,
        elementText: text?.trim().substring(0, 50) || undefined,
      };
    } else {
      // Multiple matches - might be ambiguous
      return {
        selector,
        status: 'multiple',
        matchCount: count,
        suggestions: [
          `${selector}:first-child`,
          `${selector}:nth-of-type(1)`,
        ],
      };
    }
  } catch (error) {
    return {
      selector,
      status: 'not_found',
      matchCount: 0,
      suggestions: [`Invalid selector syntax: ${(error as Error).message}`],
    };
  }
}

/**
 * Find similar selectors on the page when the original is not found
 */
async function findSimilarSelectors(
  page: Page,
  originalSelector: string
): Promise<string[]> {
  const suggestions: string[] = [];

  try {
    // Extract key parts from the original selector
    const testIdMatch = originalSelector.match(/data-testid="([^"]+)"/);
    const classMatch = originalSelector.match(/\.([a-zA-Z][\w-]*)/);
    const idMatch = originalSelector.match(/#([a-zA-Z][\w-]*)/);
    const tagMatch = originalSelector.match(/^([a-z]+)/);

    // Search for similar data-testid
    if (testIdMatch) {
      const partial = testIdMatch[1].split('-')[0];
      const similar = await page.$$(`[data-testid*="${partial}"]`);
      for (const el of similar.slice(0, 3)) {
        const testId = await el.getAttribute('data-testid');
        if (testId) {
          suggestions.push(`[data-testid="${testId}"]`);
        }
      }
    }

    // Search for similar classes
    if (classMatch) {
      const className = classMatch[1];
      const similar = await page.$$(`[class*="${className}"]`);
      for (const el of similar.slice(0, 3)) {
        const classes = await el.getAttribute('class');
        if (classes) {
          const mainClass = classes.split(' ').find(c => c.includes(className));
          if (mainClass) {
            suggestions.push(`.${mainClass}`);
          }
        }
      }
    }

    // Search for similar IDs
    if (idMatch) {
      const idPart = idMatch[1].split('-')[0];
      const similar = await page.$$(`[id*="${idPart}"]`);
      for (const el of similar.slice(0, 3)) {
        const id = await el.getAttribute('id');
        if (id) {
          suggestions.push(`#${id}`);
        }
      }
    }

    // If selector looks like it's for a specific element type, show available ones
    if (tagMatch) {
      const tag = tagMatch[1];
      if (['button', 'input', 'select', 'a', 'form'].includes(tag)) {
        const elements = await page.$$(`${tag}:visible`);
        for (const el of elements.slice(0, 3)) {
          const testId = await el.getAttribute('data-testid');
          if (testId) {
            suggestions.push(`[data-testid="${testId}"]`);
          } else {
            const id = await el.getAttribute('id');
            if (id) {
              suggestions.push(`#${id}`);
            }
          }
        }
      }
    }
  } catch {
    // Ignore errors in suggestion finding
  }

  // Deduplicate and limit suggestions
  return [...new Set(suggestions)].slice(0, 5);
}

/**
 * Validate a demo definition by checking all selectors
 */
export async function validateDemo(
  demo: DemoDefinition,
  demoCode: string,
  options: ValidateOptions = {}
): Promise<DemoValidationResult> {
  const { headed = false, viewport = { width: 1920, height: 1080 } } = options;

  // Extract selectors from demo code
  const selectors = extractSelectorsFromCode(demoCode);

  if (selectors.length === 0) {
    return {
      demoId: demo.id,
      demoName: demo.name,
      url: demo.url,
      selectors: [],
      passed: 0,
      failed: 0,
      warnings: 0,
    };
  }

  // Launch browser and validate
  const browser = await chromium.launch({ headless: !headed });
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  try {
    await page.goto(demo.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000); // Let SPA hydrate

    const validations: SelectorValidation[] = [];

    for (const selector of selectors) {
      const result = await validateSelector(page, selector);
      validations.push(result);
    }

    const passed = validations.filter((v) => v.status === 'found').length;
    const failed = validations.filter((v) => v.status === 'not_found').length;
    const warnings = validations.filter((v) => v.status === 'multiple').length;

    return {
      demoId: demo.id,
      demoName: demo.name,
      url: demo.url,
      selectors: validations,
      passed,
      failed,
      warnings,
    };
  } finally {
    await browser.close();
  }
}

/**
 * Format validation result as a human-readable string
 */
export function formatValidationResult(result: DemoValidationResult): string {
  const lines: string[] = [];

  lines.push(`\nValidating selectors for "${result.demoName}" at ${result.url}...\n`);

  if (result.selectors.length === 0) {
    lines.push('No selectors found in demo code.\n');
    return lines.join('\n');
  }

  for (const sel of result.selectors) {
    const icon = sel.status === 'found' ? '\u2713' : sel.status === 'not_found' ? '\u2717' : '\u26A0';
    const statusText =
      sel.status === 'found'
        ? `Found (1 match)${sel.elementText ? ` "${sel.elementText}"` : ''}`
        : sel.status === 'not_found'
          ? 'Not found'
          : `Multiple matches (${sel.matchCount})`;

    lines.push(`${icon} ${sel.selector}`);
    lines.push(`  \u2192 ${statusText}`);

    if (sel.suggestions && sel.suggestions.length > 0) {
      lines.push('  Suggestions:');
      for (const suggestion of sel.suggestions) {
        lines.push(`    - ${suggestion}`);
      }
    }
    lines.push('');
  }

  lines.push('─'.repeat(60));
  lines.push(
    `${result.selectors.length} selectors checked: ` +
      `${result.passed} passed, ${result.failed} failed, ${result.warnings} warnings`
  );
  lines.push('');

  return lines.join('\n');
}
