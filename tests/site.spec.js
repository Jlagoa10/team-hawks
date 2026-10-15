import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('desktop: media expansion, morph, all five chapters and training scenes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(2);
  const initial = await page.locator('.hero-media').boundingBox();
  await page.evaluate(() => scrollTo({ top: 650, behavior: 'instant' }));
  await expect.poll(async () => (await page.locator('.hero-media').boundingBox()).width).toBeGreaterThan(initial.width * 1.35);
  await page.evaluate(() => scrollTo({ top: 1450, behavior: 'instant' }));
  await expect(page.locator('.hero-morph')).toBeVisible();
  await expect.poll(() => page.locator('.hero-media').evaluate((el) => parseFloat(getComputedStyle(el).opacity))).toBeLessThan(.5);
  for (let index = 0; index < 5; index++) {
    await page.locator('.method-chapter').nth(index).scrollIntoViewIfNeeded();
    await expect(page.locator('.method-visual')).toHaveAttribute('data-active-stage', String(index));
    await expect(page.locator('[data-method-label]')).toContainText(String(index + 1).padStart(2, '0'));
  }
  const trainingTop = await page.locator('#treino').evaluate((el) => el.getBoundingClientRect().top + scrollY);
  for (const [offset, word] of [[100, 'POSICIONE.'], [950, 'LEIA.'], [1800, 'EXECUTE.']]) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), trainingTop + offset);
    await expect(page.locator('[data-training-word]')).toHaveText(word);
  }
  await expect.poll(() => page.locator('img[src]').evaluateAll((images) => images.filter((el) => el.complete && el.naturalWidth === 0).length)).toBe(0);
  expect(errors).toEqual([]);
});

test('gallery: buttons, keyboard, touch and enlarged image state', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-stack-next]').click();
  await expect(page.locator('[data-stack-status]')).toContainText('02 / 04');
  await page.locator('.image-stack').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-stack-status]')).toContainText('03 / 04');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('[data-stack-status]')).toContainText('02 / 04');
  await page.locator('.image-stack').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 270, clientY: 400 });
  await page.locator('.image-stack').dispatchEvent('pointerup', { pointerType: 'touch', clientX: 150, clientY: 410 });
  await expect(page.locator('[data-stack-status]')).toContainText('03 / 04');
  await page.locator('.hover-image').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.hover-image').first()).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(page.locator('.hover-image').first()).toHaveAttribute('aria-expanded', 'false');
});

test('mobile: drawer navigation, focus trap and Instagram fallback', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await expect(page.locator('#menu-mobile')).toBeVisible();
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  const last = page.locator('#menu-mobile a').last();
  await last.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Fechar menu', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-mobile')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Abrir menu', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page.locator('#menu-mobile a[href="#metodo"]').click();
  await expect(page.locator('#menu-mobile')).toBeHidden();
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');
  expect(await page.locator('[data-contact]').evaluateAll((links) => links.every((link) => link.href === 'https://ig.me/m/team_hawks_futevolei'))).toBe(true);
});

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`layout: no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    for (const section of ['#inicio', '#metodo', '#team-hawks', '#em-acao', '#para-quem', '#consultoria', '#contato']) {
      await page.locator(section).scrollIntoViewIfNeeded();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(await page.locator('a[href^="#"]').evaluateAll((links) => links.every((link) => document.getElementById(link.hash.slice(1))))).toBe(true);
  });
}

test('reduced motion and manual pause remove pins and preserve full content', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.pin-spacer')).toHaveCount(2);
  await page.getByRole('button', { name: 'Pausar animações', exact: true }).click();
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.training-transcript')).toBeVisible();
  await page.getByRole('button', { name: 'Ativar animações', exact: true }).click();
  await expect(page.locator('.pin-spacer')).toHaveCount(2);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Movimento reduzido', exact: true })).toBeDisabled();
  await expect(page.locator('.training-transcript')).toContainText('Execute.');
  for (const stage of await page.locator('.method-chapter').all()) await expect(stage).toContainText(/./);
});

test('resizing and toggling motion never duplicate pins', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.evaluate(() => scrollTo(0, 1000));
  for (const width of [390, 1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.pin-spacer')).toHaveCount(2);
    await page.evaluate(() => scrollTo(0, 0));
    await expect.poll(async () => (await page.locator('.hero-media').boundingBox()).width / width).toBeGreaterThan(width === 390 ? .85 : .63);
    await expect.poll(async () => (await page.locator('.hero-media').boundingBox()).width / width).toBeLessThan(width === 390 ? .89 : .65);
  }
  for (let i = 0; i < 3; i++) {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(page.locator('.pin-spacer')).toHaveCount(2);
  }
});

test('spotlight and button surfaces respond; marquee can pause', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('#para-quem .spotlight-card').first();
  await card.hover();
  await expect.poll(() => card.evaluate((el) => parseFloat(getComputedStyle(el, '::before').opacity))).toBe(1);
  const button = page.locator('#contato .motion-button').first();
  await button.hover();
  await expect.poll(() => button.evaluate((el) => parseFloat(getComputedStyle(el).borderRadius))).toBe(28);
  await page.getByRole('button', { name: 'Pausar movimento', exact: true }).click();
  await expect(page.locator('.marquee-track')).toHaveCSS('animation-play-state', 'paused');
});

test('essential content remains available with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#hero-title')).toBeVisible();
  await expect(page.locator('#metodo-title')).toBeVisible();
  await expect(page.locator('.method-chapter')).toHaveCount(5);
  await expect(page.locator('#contato [data-contact]').first()).toHaveAttribute('href', 'https://ig.me/m/team_hawks_futevolei');
  await context.close();
});

test('accessibility: WCAG A/AA desktop and mobile menu', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(result.violations).toEqual([]);
});
