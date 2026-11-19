import { test, expect } from '@playwright/test';

for (const width of [1572, 900, 390]) {
  test(`all five videos share a row and retain their size at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const track = page.locator('#team-videos');
    const cards = track.locator('.video-card');
    await expect(cards).toHaveCount(5);
    await expect(track.locator('[data-video-group="training"] .video-card')).toHaveCount(3);
    const boxes = await track.locator('.video-frame').evaluateAll(frames => frames.map(frame => ({
      top: frame.offsetTop + frame.offsetParent.offsetTop,
      width: frame.offsetWidth,
      height: frame.offsetHeight,
    })));
    expect(new Set(boxes.map(box => box.top)).size).toBe(1);

    const originalWidth = await track.evaluate(element => element.parentElement.clientWidth);
    const gap = Math.min(128, Math.max(64, width * 0.08));
    const columns = width <= 600 ? 1 : width <= 900 ? 2 : 3;
    const playerLimit = width <= 600 ? Math.min(240, 900 * 0.315) : 450;
    const trainingWidth = Math.min(playerLimit, (originalWidth - gap * (columns - 1)) / columns);
    expect(Math.abs(boxes[0].width - trainingWidth)).toBeLessThanOrEqual(1);
    for (const box of boxes) expect(Math.abs(box.height - box.width * 16 / 9)).toBeLessThanOrEqual(2);

    const previous = page.locator('[aria-controls="team-videos"][data-media-step="-1"]');
    const next = page.locator('[aria-controls="team-videos"][data-media-step="1"]');
    await expect(previous).toBeHidden();
    const trackBox = await track.boundingBox();
    expect((await next.boundingBox()).x).toBeGreaterThan(trackBox.x + trackBox.width);
    await next.click();
    await expect(previous).toBeVisible();
    const previousBox = await previous.boundingBox();
    expect(previousBox.x + previousBox.width).toBeLessThan(trackBox.x);
    await previous.click();
    await expect(previous).toBeHidden();
  });
}
