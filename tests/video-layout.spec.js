import { test, expect } from '@playwright/test';

for (const width of [1337, 390]) {
  test(`event videos follow the training videos without shifting on load at ${width}px`, async ({ page }) => {
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
    const training = page.locator('#treino > .video-section > [data-video-group="training"]');
    await expect(training.locator('.video-card')).toHaveCount(3);
    await expect(page.locator('#treino > .video-section > [data-video-group="training"] + .video-events .video-card')).toHaveCount(2);
    const before = await events.boundingBox();
    await events.scrollIntoViewIfNeeded();
    await expect(events.locator('video')).toHaveCount(2);
    await expect.poll(async () => (await events.boundingBox()).width).toBeCloseTo(before.width, 0);
    expect((await events.boundingBox()).height).toBeCloseTo(before.height, 0);
    const trainingBox = await training.boundingBox();
    const eventsBox = await events.boundingBox();
    expect(eventsBox.y).toBeGreaterThanOrEqual(trainingBox.y + trainingBox.height);
  });
}

