import type { DemoDefinition } from '../src/core/types';

/**
 * Example Demo showcasing v1.3.0 features:
 * - Intro/outro effects with title card
 * - Smooth scroll animations
 * - Auto-switching cursor styles
 * - Animated interactions
 */
const demo: DemoDefinition = {
  id: 'example-demo',
  name: 'Example Demo - Hacker News',
  url: 'https://news.ycombinator.com',

  // Title card intro
  intro: {
    fadeIn: true,
    titleCard: {
      title: 'Hacker News Demo',
      subtitle: 'Browsing the front page',
      duration: 2000,
    },
  },

  // Fade out outro
  outro: {
    fadeOut: true,
  },

  run: async ({
    page,
    wait,
    highlight,
    clickAnimated,
    moveTo,
    scrollBy,
    scrollToTop,
    zoomHighlight,
  }) => {
    // Wait for page to load
    await wait(1500);

    // Highlight the main title
    await highlight('.hnname a', 800);

    // Highlight the first story with zoom effect
    await zoomHighlight('.titleline > a', { duration: 1000 });

    // Move to the "new" link (cursor will auto-switch to hand)
    await moveTo('a[href="newest"]');
    await wait(300);

    // Click with animation
    await clickAnimated('a[href="newest"]');

    // Wait for navigation
    await page.waitForLoadState('networkidle');
    await wait(1500);

    // Scroll down smoothly to see more stories
    await scrollBy(400, { duration: 800, easing: 'ease-in-out' });
    await wait(1000);

    // Scroll back to top
    await scrollToTop({ duration: 600 });
    await wait(1500);
  },
};

export default demo;
