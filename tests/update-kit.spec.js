import { test, expect } from '@playwright/test';

test('all requested photographs and hero copy are assigned to the specified sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero-media img')).toHaveAttribute('src', /hero-eagle\.webp/);
  await expect(page.locator('.hero-morph p')).toHaveText('BEM-VINDOSAO TEAM HAWKS.');
  await expect(page.locator('#hero-title')).toContainText('NÃO É SÓ TREINO.');
  await expect(page.locator('#manifesto')).toContainText('A técnica começa pelos pés.');
  for (const image of await page.locator('[data-stage-image]').all()) await expect(image).toHaveAttribute('src', /method-court\.webp/);
  await expect(page.locator('.editorial-primary img')).toHaveAttribute('src', /fabio-editorial\.webp/);
  await expect(page.locator('.hover-gallery [data-media-slot="team"] img')).toHaveAttribute('src', /fabio-torneio\.jpeg/);
  await expect(page.locator('[data-media-slot="events"] img')).toHaveAttribute('src', /trofeu\.jpg/);
  await expect(page.locator('#contato img')).toHaveAttribute('src', /contact-eagle\.webp/);
  await expect(page.locator('.hover-gallery')).not.toContainText('em breve');
  await expect(page.locator('#team-hawks .coach-portrait img')).toHaveCount(1);
});

test('coach copy aligns with the portrait and the removed tagline stays absent', async ({ page }) => {
  for (const width of [390, 1088, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const portrait = page.locator('.coach-portrait img');
    const copy = page.locator('.coach-copy');
    await portrait.scrollIntoViewIfNeeded();
    await portrait.evaluate(img => img.decode());
    await page.evaluate(() => document.fonts.ready);
    await expect(copy.locator('[data-family-heading]')).toHaveCount(0);
    const photoBox = await portrait.boundingBox();
    const copyBox = await copy.boundingBox();
    if (width >= 1024) {
      expect(photoBox.x + photoBox.width).toBeLessThan(copyBox.x);
      expect(Math.abs(photoBox.y - copyBox.y)).toBeLessThan(2);
      expect(Math.abs(photoBox.height - copyBox.height)).toBeLessThan(2);
    } else {
      expect(photoBox.y + photoBox.height).toBeLessThan(copyBox.y);
    }
    await expect(page.locator('#manifesto-title')).toBeVisible();
    await expect(page.locator('#manifesto-title .kinetic-word')).toHaveCount(0);
    await expect(page.locator('#manifesto-title')).toHaveCSS('transform', 'none');
  }
});

test('court route draws BASE to LEITURA to CHEGADA to target once; pause shows it complete', async ({ page }) => {
  await page.goto('/');
  const diagram = page.locator('[data-court-diagram]');
  const segments = diagram.locator('[data-route-segment]');
  await expect(segments).toHaveCount(3);
  expect(await segments.first().evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset))).toBeGreaterThan(100);
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram).toHaveAttribute('data-route-played', 'true');
  await expect.poll(() => segments.first().evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset))).toBeLessThan(100);
  expect(await segments.nth(2).evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset))).toBeGreaterThan(100);
  for (const segment of await segments.all()) await expect.poll(() => segment.evaluate((el) => parseFloat(getComputedStyle(el).strokeDashoffset))).toBe(0);
  for (const node of await diagram.locator('[data-route-node]').all()) await expect(node).toHaveCSS('opacity', '1');
  await page.locator('#contato').scrollIntoViewIfNeeded();
  await diagram.scrollIntoViewIfNeeded();
  for (const segment of await segments.all()) await expect(segment).toHaveCSS('stroke-dashoffset', '0px');
  await page.getByRole('button', { name: 'Pausar animações', exact: true }).click();
  for (const segment of await segments.all()) await expect(segment).toHaveCSS('stroke-dashoffset', '0px');
  await expect(diagram.locator('title')).toHaveText('Esquema ilustrativo de padrão de deslocamento');
});

test('Partner cards exclude Lauton and the JLK coupon preserves exact capitalization', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (value) => { window.copiedCoupon = value; } } });
  });
  await page.goto('/');
  await expect(page.locator('.partner-grid > li')).toHaveCount(3);
  const jlk = page.locator('[data-partner="jlk"]');
  await expect(jlk).toContainText('condições especiais');
  await expect(jlk).not.toContainText('5%');
  await expect(jlk.locator('a')).toHaveAttribute('href', 'https://jlkoficial.com');
  await expect(jlk.locator('a')).toHaveAttribute('rel', 'noopener noreferrer');
  await page.getByRole('button', { name: 'Copiar cupom HAWKSJLK', exact: true }).click();
  expect(await page.evaluate(() => window.copiedCoupon)).toBe('HAWKSJLK');
  await expect(jlk.locator('[aria-live]')).toHaveText('Copiado');
  await expect(page.getByRole('button', { name: 'Copiar cupom TEAMHAWKS', exact: true })).toHaveCount(0);
  await expect(page.locator('#parceiros')).not.toContainText(/lauton/i);
  await expect(page.locator('.marquee-track')).toContainText('JLK WEB & DIGITAL SERVICES');
});

test('gallery opens uncropped photos in a keyboard accessible viewer', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hover-gallery > li > figure')).toHaveCount(6);
  const figure = page.locator('.hover-gallery [data-media-slot="events"]');
  await figure.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.image-viewer img')).toHaveAttribute('src', /trofeu\.jpg/);
  await expect(page.locator('.image-viewer img')).toHaveCSS('object-fit', 'contain');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(figure).toBeFocused();
});

test('all supplied pictures load without missing assets and hero fallback works', async ({ page }) => {
  const failures = [];
  const errors = [];
  page.on('response', (response) => { if (response.status() >= 400) failures.push(response.url()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('img[src]').evaluateAll((images) => images.forEach((image) => { image.loading = 'eager'; }));
  await expect.poll(() => page.locator('img[src]').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
  await page.route('**/hero-eagle.webp', (route) => route.abort());
  await page.reload();
  await expect(page.locator('.hero-media img')).toHaveAttribute('src', /hero-alternate\.webp/);
  await expect.poll(() => page.locator('.hero-media img').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
});
