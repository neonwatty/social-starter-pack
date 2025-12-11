# Demo Generation Guide for AI Assistants

This guide provides the information needed to generate accurate demo definitions from natural language descriptions.

## Workflow

1. **Inspect the target page** to understand available elements
2. **Generate the demo definition** with appropriate selectors and timing
3. **Validate selectors** work correctly
4. **Record the demo** with the desired video format

## Step 1: Page Inspection

Use the `demo-recorder inspect` command with `--full --format json` for comprehensive element data:

```bash
demo-recorder inspect https://example.com --full --format json
```

This returns structured data including:
- Interactive elements with multiple selector strategies
- Element state (visible, enabled, in viewport)
- Forms with field details and submit buttons
- Page sections for scroll targets

### Selector Priority (Most → Least Reliable)

1. **data-testid**: `[data-testid="submit-btn"]` - Most stable, survives refactors
2. **id**: `#submit-button` - Stable if present
3. **role + text**: `button:has-text("Submit")` - Good for accessible UIs
4. **CSS selector**: `.submit-btn` - Works but fragile to style changes

Always prefer selectors in this order from the inspection output.

## Step 2: Demo Definition Structure

```typescript
import type { DemoDefinition } from '../src/core/types';

const demo: DemoDefinition = {
  id: 'my-demo',           // Used for filenames (kebab-case)
  name: 'My Demo',         // Human-readable name
  url: 'https://example.com',

  // Optional: Video dimensions (or use --preset flag)
  video: {
    width: 1920,
    height: 1080,
  },

  // Optional: Intro effects
  intro: {
    fadeIn: true,
    titleCard: {
      title: 'Demo Title',
      subtitle: 'Subtitle text',
      duration: 2000,
    },
  },

  // Optional: Outro effects
  outro: {
    fadeOut: true,
  },

  run: async (context) => {
    // Demo logic here
  },
};

export default demo;
```

## Step 3: Available Helper Methods

### Core Interaction Helpers

#### `clickAnimated(selector, options?)`
Click with cursor movement animation. **THROWS if element not found.**

```typescript
await clickAnimated('[data-testid="submit"]');
await clickAnimated('button.next', {
  hoverDuration: 300,    // Hover before click (default: 200ms)
  moveDuration: 500,     // Cursor travel time (default: 400ms)
  force: false,          // Skip visibility checks
  scrollIntoView: true,  // Auto-scroll to element
});
```

#### `typeAnimated(selector, text, options?)`
Type with realistic character-by-character animation.

```typescript
await typeAnimated('input[name="email"]', 'user@example.com');
await typeAnimated('#password', 'secret123', {
  delay: 50,       // Delay between chars (default: 50ms)
  variation: 20,   // Random variation (default: 20ms)
});
```

#### `highlight(selector, durationMs?)`
Red border highlight effect. Does NOT throw if element missing.

```typescript
await highlight('.feature-card', 800);  // 800ms highlight
```

#### `zoomHighlight(selector, options?)`
Animated zoom + highlight effect.

```typescript
await zoomHighlight('[data-testid="key-feature"]', {
  scale: 1.05,     // Zoom scale (default: 1.05)
  duration: 600,   // Animation duration (default: 600ms)
});
```

### Navigation Helpers

#### `wait(ms)`
Explicit pause. Use after navigation or to let animations settle.

```typescript
await wait(1500);  // Wait 1.5 seconds
```

#### `scrollToElement(selector, options?)`
Smooth scroll to center element in viewport.

```typescript
await scrollToElement('.footer', {
  duration: 600,           // Scroll time (default: 600ms)
  easing: 'ease-out',      // linear, ease-in, ease-out, ease-in-out
  offset: 100,             // Pixels from center (default: 0)
});
```

#### `scrollBy(pixels, options?)`
Scroll by pixel amount (positive = down, negative = up).

```typescript
await scrollBy(400);   // Scroll down 400px
await scrollBy(-200);  // Scroll up 200px
```

#### `scrollToTop(options?)` / `scrollToBottom(options?)`
Scroll to page top or bottom.

```typescript
await scrollToTop({ duration: 500 });
await scrollToBottom({ duration: 800, easing: 'ease-in-out' });
```

### Conditional Helpers

#### `exists(selector)` / `isVisible(selector)`
Check element state without throwing.

```typescript
if (await exists('.cookie-banner')) {
  await clickAnimated('.cookie-banner .accept');
}

if (await isVisible('.modal')) {
  await clickAnimated('.modal .close');
}
```

#### `waitForEnabled(selector, options?)`
Wait for button/input to become enabled. **THROWS on timeout.**

```typescript
await waitForEnabled('button[type="submit"]', {
  timeout: 5000,    // Max wait (default: 30000ms)
  interval: 100,    // Poll interval (default: 100ms)
});
```

### SPA & Async Helpers

#### `waitForHydration(options?)`
Wait for React/Next.js to complete hydration.

```typescript
await waitForHydration({ timeout: 10000 });
```

#### `waitForText(selector, text, options?)`
Wait for element to contain specific text. **THROWS on timeout.**

```typescript
await waitForText('.status', 'Complete', { timeout: 60000 });
await waitForText('[data-testid="result"]', 'Success');
```

#### `waitForTextChange(selector, options?)`
Wait for element text to change from current value. Returns new text.

```typescript
const newStatus = await waitForTextChange('.processing-status', {
  timeout: 120000,  // 2 minutes for long operations
});
```

#### `uploadFile(selector, filePath)`
Upload file to file input element.

```typescript
await uploadFile('input[type="file"]', './test-audio.mp3');
```

#### `waitForDownload(options?)`
Wait for download to complete, returns file path.

```typescript
await clickAnimated('[data-testid="download-btn"]');
const downloadedFile = await waitForDownload({ timeout: 60000 });
```

### Direct Playwright Access

The `page`, `browser`, and `context` objects are available for advanced operations:

```typescript
run: async ({ page, clickAnimated, wait }) => {
  // Use helpers for visual actions
  await clickAnimated('a[href="/dashboard"]');

  // Use page directly for navigation waits
  await page.waitForLoadState('networkidle');

  // Use page for complex selectors
  const count = await page.locator('.item').count();
}
```

## Common Patterns

### Form Submission

```typescript
run: async ({ typeAnimated, clickAnimated, waitForEnabled, wait }) => {
  await wait(1000);  // Let page hydrate

  await typeAnimated('input[name="email"]', 'test@example.com');
  await typeAnimated('input[name="password"]', 'password123');

  await waitForEnabled('button[type="submit"]');
  await clickAnimated('button[type="submit"]');

  await page.waitForLoadState('networkidle');
}
```

### Handling Optional Elements

```typescript
run: async ({ exists, clickAnimated, wait }) => {
  await wait(1000);

  // Dismiss cookie banner if present
  if (await exists('.cookie-consent')) {
    await clickAnimated('.cookie-consent .accept');
    await wait(500);
  }

  // Continue with main flow
  await clickAnimated('[data-testid="start"]');
}
```

### Multi-Page Navigation

```typescript
run: async ({ page, clickAnimated, wait, highlight }) => {
  await wait(1500);

  // Page 1: Landing
  await highlight('.hero-cta', 800);
  await clickAnimated('.hero-cta');

  // Wait for navigation
  await page.waitForLoadState('networkidle');
  await wait(1000);

  // Page 2: Dashboard
  await highlight('[data-testid="dashboard-card"]', 600);
}
```

### Long Async Operations

```typescript
run: async ({ clickAnimated, uploadFile, waitForTextChange, waitForText, wait }) => {
  await wait(1000);

  // Upload file
  await uploadFile('input[type="file"]', './test-file.mp3');
  await wait(500);

  // Start processing
  await clickAnimated('[data-testid="process-btn"]');

  // Wait for processing to complete (may take minutes)
  await waitForTextChange('.status', { timeout: 180000 });
  await waitForText('.status', 'Complete', { timeout: 30000 });

  // Download result
  await clickAnimated('[data-testid="download"]');
}
```

## Video Format Presets

Use `--preset` flag to set video dimensions:

| Preset | Dimensions | Use Case |
|--------|-----------|----------|
| `youtube-shorts` | 1080x1920 | YouTube Shorts (9:16 vertical) |
| `youtube` | 1920x1080 | Regular YouTube (16:9) |
| `twitter` | 1200x675 | Twitter/X posts |
| `linkedin` | 1200x675 | LinkedIn posts |
| `square` | 1080x1080 | Instagram/cross-platform |
| `instagram-reel` | 1080x1920 | Instagram Reels |
| `tiktok` | 1080x1920 | TikTok |

```bash
demo-recorder record demo.ts --preset youtube-shorts -o output/
```

## Error Handling

### Throwing Methods (fail loud)
- `clickAnimated` - Element must exist and be clickable
- `waitForEnabled` - Element must become enabled within timeout
- `waitForText` - Element must contain text within timeout
- `waitForTextChange` - Element text must change within timeout
- `uploadFile` - File input must exist
- `waitForDownload` - Download must complete within timeout

### Non-Throwing Methods (fail silent)
- `highlight` - Logs warning if element not found
- `zoomHighlight` - Logs warning if element not found
- `moveTo` - Logs warning if element not found
- `scroll*` methods - Log warning on failure
- `exists` / `isVisible` - Return false on failure

## Tips for Reliable Demos

1. **Always start with `wait(1000-1500)`** to let the page hydrate
2. **Use `waitForHydration()`** for Next.js/React SPAs
3. **Prefer data-testid selectors** when available
4. **Use `exists()` checks** for optional UI elements
5. **Add `page.waitForLoadState('networkidle')`** after navigation
6. **Use longer timeouts** for async operations (AI processing, uploads)
7. **Test selectors first** with `demo-recorder inspect <url> --full`
