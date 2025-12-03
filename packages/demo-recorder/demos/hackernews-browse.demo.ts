import type { DemoDefinition } from '../src/core/types';

const demo: DemoDefinition = {
  id: 'hackernews-browse',
  name: 'Hacker News Browsing Demo',
  url: 'https://news.ycombinator.com',

  run: async ({ page, wait, highlight }) => {
    // Wait for page to load
    await wait(2000);

    // Highlight the first story
    await highlight('.athing:first-child .titleline > a', 800);

    // Get the comments link for the first story
    const firstCommentsLink = page.locator('.athing:first-child + tr .subline a').last();
    await highlight('.athing:first-child + tr .subline a:last-child', 600);
    await firstCommentsLink.click();

    // Wait for comments page to load
    await page.waitForLoadState('networkidle');
    await wait(1500);

    // Scroll through comments
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, 400));
      await wait(800);
    }

    // Highlight a comment
    const comment = page.locator('.comment').first();
    if (await comment.isVisible()) {
      await highlight('.comment:first-child', 600);
    }

    await wait(1000);

    // Go back to home page
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await wait(1500);

    // Click on second story's comments
    const secondCommentsLink = page.locator('.athing:nth-child(4) + tr .subline a').last();
    await highlight('.athing:nth-child(4) .titleline > a', 800);
    await highlight('.athing:nth-child(4) + tr .subline a:last-child', 600);
    await secondCommentsLink.click();

    // Wait for comments page
    await page.waitForLoadState('networkidle');
    await wait(1500);

    // Scroll through these comments
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 350));
      await wait(700);
    }

    await wait(2000);
  },
};

export default demo;
