import { test, expect } from '@playwright/test';

test('court route draws again after leaving and returning', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const diagram = page.locator('[data-court-diagram]');
  const segment = diagram.locator('[data-route-segment]').first();
  const offset = () => segment.evaluate(el => parseFloat(getComputedStyle(el).strokeDashoffset));
  await diagram.scrollIntoViewIfNeeded();
  await expect.poll(offset).toBeLessThan(1);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(offset).toBeGreaterThan(10);
  await diagram.scrollIntoViewIfNeeded();
  await expect.poll(offset).toBeLessThan(1);
  expect(errors).toEqual([]);
});
