import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../src/video-manifest.json', import.meta.url), 'utf8'));

async function configureVideos(page, src, count = 2, extra = {}) {
  const entries = manifest.map((entry, index) => index < count ? { ...entry, src, ...extra } : entry);
  await page.route('**/src/video-manifest.json*', (route) => route.fulfill({
    contentType: 'application/javascript', body: `export default ${JSON.stringify(entries)};`,
  }));
  await page.route('**/*team-hawks-videos*', (route) => route.fulfill({
    contentType: 'application/javascript', body: `export default ${JSON.stringify(entries.slice(0, count).map((entry) => entry.id))};`,
  }));
}

test('five absent videos: permanent headings above clean posters, no missing-file requests', async ({ page }) => {
  const mediaRequests = [];
  page.on('request', (request) => { if (/\.mp4(?:\?|$)/.test(request.url())) mediaRequests.push(request.url()); });
  await page.goto('/');
  await expect(page.locator('.video-card')).toHaveCount(5);
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.locator('.hero-media video')).toHaveCount(0);
  for (const entry of manifest) {
    const card = page.locator(`[data-video-id="${entry.id}"]`);
    await card.scrollIntoViewIfNeeded();
    await expect(card.getByRole('heading', { name: entry.title, exact: true })).toBeVisible();
    await expect(card.locator('.video-pending')).toHaveText('VÍDEO EM BREVE');
    const title = await card.locator('h3').boundingBox();
    const frame = await card.locator('.video-frame').boundingBox();
    expect(title.y + title.height).toBeLessThan(frame.y);
    await expect(card.locator('button')).toHaveCount(0);
  }
  expect(mediaRequests).toEqual([]);
});

test('configured clips: real controls, manual playback, exclusive/offscreen pause, headings stay above', async ({ page }) => {
  await configureVideos(page, '/tests/fixtures/scrub.webm');
  await page.goto('/');
  const cards = page.locator('[data-video-group="training"] .video-card');
  await cards.first().scrollIntoViewIfNeeded();
  const first = cards.first().locator('video');
  const second = cards.nth(1).locator('video');
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  await expect(first).toHaveAttribute('controls', '');
  await expect(first).toHaveAttribute('playsinline', '');
  expect(await first.evaluate((video) => video.paused)).toBe(true);
  await first.evaluate((video) => video.play());
  await expect.poll(() => first.evaluate((video) => video.currentTime)).toBeGreaterThan(0);
  await first.evaluate((video) => { video.currentTime = 3; });
  await expect.poll(() => first.evaluate((video) => video.currentTime)).toBeGreaterThanOrEqual(3);
  await second.evaluate((video) => video.play());
  await expect.poll(() => first.evaluate((video) => video.paused)).toBe(true);
  await expect.poll(() => second.evaluate((video) => video.paused)).toBe(false);
  const title = await cards.first().locator('h3').boundingBox();
  const frame = await cards.first().locator('.video-frame').boundingBox();
  expect(title.y + title.height).toBeLessThan(frame.y);
  await page.locator('#contato').scrollIntoViewIfNeeded();
  await expect.poll(() => second.evaluate((video) => video.paused)).toBe(true);
  await expect(page.locator('.hero-media img')).toHaveAttribute('src', /hero-eagle/);
  await expect(page.locator('.hero-media video')).toHaveCount(0);
});

test('unusable configured clip returns to an honest poster with no broken player', async ({ page }) => {
  await configureVideos(page, '/unavailable.webm', 1);
  await page.route('**/unavailable.webm', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  const card = page.locator('[data-video-id="video-01"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('data-status', 'pending');
  await expect(card.locator('.video-poster')).toBeVisible();
  await expect(card.locator('video')).toHaveCount(0);
  await expect(card.locator('.video-pending')).toHaveText('VÍDEO EM BREVE');
  await expect(card.locator('h3')).toHaveText('TREINAMENTO TÉCNICO');
});

test('a real subtitle track remains manually controllable under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await configureVideos(page, '/tests/fixtures/scrub.webm', 1, { tracks: [{ src: '/test-subtitles.vtt', lang: 'pt-BR', label: 'Português', default: true }] });
  await page.route('**/test-subtitles.vtt', (route) => route.fulfill({ contentType: 'text/vtt', body: 'WEBVTT\n\n00:00.000 --> 00:05.000\nLegenda de teste.\n' }));
  await page.goto('/');
  const card = page.locator('[data-video-id="video-01"]');
  await card.scrollIntoViewIfNeeded();
  const video = card.locator('video');
  await expect(video).toBeVisible();
  await expect(video.locator('track')).toHaveAttribute('srclang', 'pt-BR');
  expect(await video.evaluate((element) => element.paused)).toBe(true);
  await video.evaluate((element) => element.play());
  await expect.poll(() => video.evaluate((element) => element.paused)).toBe(false);
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
});
