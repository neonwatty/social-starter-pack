import type { DemoDefinition } from '../src/core/types';

/**
 * Demo: Bleeping the Bob Ross Sample Video
 *
 * This demo shows the full workflow:
 * 1. Load the Bob Ross sample video (pre-loaded via URL)
 * 2. Start transcription and wait for completion
 * 3. Use keyword matching to select words for bleeping
 * 4. Apply the bleep effect
 * 5. Play the final result
 */
const demo: DemoDefinition = {
  id: 'bleep-bob-ross',
  name: 'Bleep Bob Ross Demo',
  url: 'https://bleep-that-sht.com/bleep?sample=bob-ross',

  // 16:9 for YouTube
  video: {
    width: 1920,
    height: 1080,
  },

  // Intro effects
  intro: {
    fadeIn: true,
    fadeDuration: 600,
    titleCard: {
      title: 'Bleeping Bob Ross',
      subtitle: 'Watch AI transcription in action',
      duration: 2500,
      background: '#1a1a2e',
      textColor: '#ffffff',
    },
  },

  // Outro effects
  outro: {
    fadeOut: true,
    fadeDuration: 800,
  },

  run: async ({
    page,
    wait,
    clickAnimated,
    typeAnimated,
    zoomHighlight,
    highlight,
    scrollToElement,
    scrollToTop,
    scrollBy,
    waitForHydration,
    waitForText,
  }) => {
    // Wait for page to fully load and hydrate
    await waitForHydration();
    await wait(1500);

    // The Bob Ross sample is pre-loaded via URL query param
    // Highlight the loaded video preview
    const videoPreview = await page.$('video');
    if (videoPreview) {
      await highlight('video', 800);
    }
    await wait(300);

    // Scroll down to show the transcription button
    await scrollToElement('[data-testid="transcribe-button"]');
    await wait(500);

    // Highlight and click the transcribe button
    await zoomHighlight('[data-testid="transcribe-button"]', { duration: 500 });
    await clickAnimated('[data-testid="transcribe-button"]');

    // Wait for transcription to complete
    // The button changes from "TRANSCRIBING..." back to "Start Transcription" when done
    // We need to wait until the button text no longer contains "transcribing"

    // First, wait a moment for the button to change to "TRANSCRIBING..."
    await wait(3000);

    // Now poll until transcription completes - poll every 2 seconds, timeout after 5 minutes
    const transcriptionTimeout = 300000;
    const pollInterval = 2000;
    const startTime = Date.now();

    while (Date.now() - startTime < transcriptionTimeout) {
      // Check the transcribe button - it shows "TRANSCRIBING..." while processing
      const transcribeBtn = await page.$('[data-testid="transcribe-button"]');
      if (transcribeBtn) {
        const btnText = await transcribeBtn.textContent();
        console.log(`Button text: "${btnText}"`);

        // If button still shows "TRANSCRIBING...", keep waiting
        if (btnText && btnText.toLowerCase().includes('transcribing')) {
          console.log('Still transcribing, waiting...');
          await wait(pollInterval);
          continue;
        }

        // Button text changed - transcription is complete!
        console.log('Transcription complete - button text changed back');
        break;
      }

      await wait(pollInterval);
    }

    // Extra pause to ensure UI has fully updated after transcription
    await wait(1500);

    // Scroll back to top to show tabs
    await scrollToTop({ duration: 400 });
    await wait(400);

    // Click on "Review & Match" tab (2nd tab)
    await zoomHighlight('[role="tab"]:nth-child(2)', { duration: 400 });
    await clickAnimated('[role="tab"]:nth-child(2)');
    await wait(1000);

    // The Review & Match tab shows expandable sections:
    // - QUICK APPLY WORD LISTS
    // - KEYWORD MATCHING
    // - INTERACTIVE TRANSCRIPT
    // - MANUAL TIMELINE

    // Click on "KEYWORD MATCHING" to expand it and show the word matching feature
    const keywordMatchingBtn = page.locator('text=KEYWORD MATCHING').first();
    if (await keywordMatchingBtn.count() > 0) {
      await zoomHighlight('text=KEYWORD MATCHING', { duration: 400 });
      await keywordMatchingBtn.click();
      await wait(1500);
    }

    // Scroll down to see more of the keyword matching section
    await scrollBy(200);
    await wait(800);

    // Now click on "INTERACTIVE TRANSCRIPT" to show the clickable transcript
    const interactiveBtn = page.locator('text=INTERACTIVE TRANSCRIPT').first();
    if (await interactiveBtn.count() > 0) {
      await zoomHighlight('text=INTERACTIVE TRANSCRIPT', { duration: 400 });
      await interactiveBtn.click();
      await wait(1500);
    }

    // Scroll down to see the transcript words
    await scrollBy(200);
    await wait(800);

    // Navigate to Bleep & Download tab (3rd tab)
    await scrollToTop({ duration: 400 });
    await wait(400);

    await zoomHighlight('[role="tab"]:nth-child(3)', { duration: 400 });
    await clickAnimated('[role="tab"]:nth-child(3)');
    await wait(1000);

    // The Bleep & Download tab shows:
    // - CHOOSE BLEEP SOUND & VOLUME section
    // - Bleep Sound dropdown
    // - Bleep Volume slider
    // - Original Word Volume slider
    // - Preview Bleep button (pink/purple)

    // Scroll down to see the bleep options and Preview button
    await scrollBy(250);
    await wait(800);

    // Click "Preview Bleep" button to hear the effect
    const previewBtn = page.locator('text=Preview Bleep').first();
    if (await previewBtn.count() > 0) {
      await zoomHighlight('text=Preview Bleep', { duration: 500 });
      await previewBtn.click();
      await wait(3000); // Let preview play
    }

    // Scroll down more to show download section
    await scrollBy(300);
    await wait(1000);

    // Look for the download section
    const downloadHeading = page.locator('text=BLEEP THAT SH*T').first();
    if (await downloadHeading.count() > 0) {
      await highlight('text=BLEEP THAT SH*T', 600);
      await wait(500);
    }

    // Final pause to show the result
    await wait(1500);
  },
};

export default demo;
