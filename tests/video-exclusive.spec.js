import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const manifest = JSON.parse(readFileSync(new URL('../src/video-manifest.json', import.meta.url), 'utf8'));
test('starting another video restores the previous cover and stops playback', async ({ page }) => {
  await page.setViewportSize({ width: 1337, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/src/video-manifest.json*', route => route.fulfill({
    contentType: 'application/javascript',
    body: `export default ${JSON.stringify(manifest.map(spec => ({ ...spec, src: '/tests/fixtures/scrub.webm' })))};`,
  }));
  await page.route('**/*team-hawks-videos*', route => route.fulfill({
    contentType: 'application/javascript', body: `export default ${JSON.stringify(manifest.map(spec => spec.id))};`,
  }));
  await page.goto('/');
  const cards = page.locator('.video-events .video-card');
  await cards.first().scrollIntoViewIfNeeded();
  const first = cards.first().locator('video');
  const second = cards.nth(1).locator('video');
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  const a = await cards.first().boundingBox();
  const b = await cards.nth(1).boundingBox();
  expect(b.x - (a.x + a.width)).toBeGreaterThanOrEqual(48);
  await cards.first().locator('button').click();
  await expect.poll(() => first.evaluate(v => v.currentTime)).toBeGreaterThan(.1);
  await expect(cards.first().locator('.video-poster')).toBeHidden();
  await cards.nth(1).locator('button').click();
  await expect.poll(() => second.evaluate(v => v.paused)).toBe(false);
  await expect.poll(() => first.evaluate(v => v.paused)).toBe(true);
  await expect.poll(() => first.evaluate(v => v.currentTime)).toBeLessThan(.1);
  await expect(cards.first().locator('.video-poster')).toBeVisible();
  await expect(cards.first().locator('button')).toHaveAttribute('aria-label', 'Reproduzir vídeo');
  await cards.first().locator('button').click();
  await expect.poll(() => second.evaluate(v => v.paused)).toBe(true);
  await expect(cards.nth(1).locator('.video-poster')).toBeVisible();
});
