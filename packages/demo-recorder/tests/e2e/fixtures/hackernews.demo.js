/**
 * Hacker News E2E test demo
 * A simplified demo for testing - navigates, clicks, scrolls
 */
const demo = {
  id: 'hackernews-e2e-test',
  name: 'Hacker News E2E Test',
  url: 'https://news.ycombinator.com',

  run: async ({ page, wait, highlight }) => {
    // Wait for page to load
    await wait(1500);

    // Highlight the first story title
    await highlight('.athing:first-child .titleline > a', 500);

    // Click on the comments link for the first story
    const commentsLink = page.locator('.athing:first-child + tr .subline a').last();
    await commentsLink.click();

    // Wait for comments page to load
    await page.waitForLoadState('networkidle');
    await wait(1000);

    // Scroll down through comments
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await wait(500);
    }

    // Final pause
    await wait(1000);
  },
};

module.exports = demo;
