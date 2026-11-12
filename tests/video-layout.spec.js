import { test, expect } from '@playwright/test';

for (const width of [1337, 390]) {
  test(`video loading preserves layout before the pinned training scene at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 650 });
    await page.route('**/src/video-manifest.json*', async route => {
      const response = await route.fetch();
      // A small local fixture exercises mounting without depending on supplied MP4s.
      const body = (await response.text()).replace(/assets\/videos\/[^"']+\.mp4/g, 'tests/fixtures/scrub.webm');
      await route.fulfill({ response, body });
    });
    await page.route('**/*team-hawks-videos*', route => route.fulfill({
      contentType: 'application/javascript',
      body: 'export default ["video-03", "video-05"];',
    }));
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const events = page.locator('.video-events');
    const before = await events.boundingBox();
    await events.scrollIntoViewIfNeeded();
    await expect(events.locator('video')).toHaveCount(2);
    await expect.poll(async () => (await events.boundingBox()).width).toBeCloseTo(before.width, 0);
    expect((await events.boundingBox()).height).toBeCloseTo(before.height, 0);
    await page.locator('.training-stage').evaluate(element => {
      scrollTo({ top: element.getBoundingClientRect().top + scrollY + 500, behavior: 'instant' });
    });
    await expect.poll(async () => (await events.boundingBox()).y + (await events.boundingBox()).height).toBeLessThan(0);
    await expect.poll(() => page.locator('.training-stage').evaluate(element => {
      const rect = element.getBoundingClientRect();
      return document.elementFromPoint(rect.width / 2, 200)?.closest('.training-stage') !== null;
    })).toBe(true);
  });
}

