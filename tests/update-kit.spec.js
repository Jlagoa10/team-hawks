import { test, expect } from '@playwright/test';

test('all requested photographs and hero copy are assigned to the specified sections', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero-media img')).toHaveAttribute('src', /hero-eagle\.webp/);
  await expect(page.locator('.hero-morph p')).toHaveText('BEM-VINDOSAO TEAM HAWKS.');
  await expect(page.locator('#hero-title')).toContainText('NÃO É SÓ TREINO.');
  await expect(page.locator('#manifesto')).toContainText('A técnica começa pelos pés.');
  for (const image of await page.locator('[data-stage-image]').all()) await expect(image).toHaveAttribute('src', /method-court\.webp/);
  await expect(page.locator('.editorial-primary img')).toHaveAttribute('src', /fabio-editorial\.webp/);
  await expect(page.locator('[data-media-slot="team"] img')).toHaveAttribute('src', /team-action\.webp/);
  await expect(page.locator('[data-media-slot="events"] img')).toHaveAttribute('src', /team-group\.webp/);
  await expect(page.locator('#contato img')).toHaveAttribute('src', /contact-eagle\.webp/);
  await expect(page.locator('.future-media')).not.toContainText('em breve');
  await expect(page.locator('.editorial-secondary')).not.toContainText('em breve');
});

test('family heading is static and its three outlined lines never overlap', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const heading = page.locator('[data-family-heading]');
    await heading.scrollIntoViewIfNeeded();
    await expect(heading.locator('.kinetic-word')).toHaveCount(0);
    await expect(heading).not.toHaveAttribute('data-kinetic', '');
    await expect(heading).toHaveCSS('transform', 'none');
    const boxes = await heading.locator(':scope > span').evaluateAll((spans) => spans.map((span) => ({ top: span.getBoundingClientRect().top, bottom: span.getBoundingClientRect().bottom })));
    expect(boxes).toHaveLength(3);
    expect(boxes[0].bottom).toBeLessThanOrEqual(boxes[1].top);
    expect(boxes[1].bottom).toBeLessThanOrEqual(boxes[2].top);
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

test('JLK and Lauton coupons stay independent and preserve exact capitalization', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (value) => { window.copiedCoupon = value; } } });
  });
  await page.goto('/');
  await expect(page.locator('.partner-grid > li')).toHaveCount(4);
  const jlk = page.locator('[data-partner="jlk"]');
  await expect(jlk).toContainText('condições especiais');
  await expect(jlk).not.toContainText('5%');
  await expect(jlk.locator('a')).toHaveAttribute('href', 'https://jlkoficial.com');
  await expect(jlk.locator('a')).toHaveAttribute('rel', 'noopener noreferrer');
  await page.getByRole('button', { name: 'Copiar cupom HAWKSJLK', exact: true }).click();
  expect(await page.evaluate(() => window.copiedCoupon)).toBe('HAWKSJLK');
  await expect(jlk.locator('[aria-live]')).toHaveText('Copiado');
  await page.getByRole('button', { name: 'Copiar cupom TEAMHAWKS', exact: true }).click();
  expect(await page.evaluate(() => window.copiedCoupon)).toBe('TEAMHAWKS');
  await expect(page.locator('.marquee-track')).toContainText('JLK WEB & DIGITAL SERVICES');
});

test('gallery opens uncropped photos in a keyboard accessible viewer', async ({ page }) => {
  await page.goto('/');
  const figure = page.locator('[data-media-slot="events"]');
  await figure.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.image-viewer img')).toHaveAttribute('src', /team-group\.webp/);
  await expect(page.locator('.image-viewer img')).toHaveCSS('object-fit', 'contain');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(figure).toBeFocused();
  await page.locator('.stack-open').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.image-viewer img')).toHaveAttribute('src', /team-event-01\.webp/);
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
