import { test, expect } from '@playwright/test';

test('desktop header stays full width on entry and becomes rounded at the welcome scene', async ({page}) => {
  await page.setViewportSize({width:1920,height:900});
  await page.goto('/');
  const header = page.locator('[data-header]');
  await expect(header).not.toHaveClass(/is-compact/);
  expect((await header.boundingBox()).width).toBe(1920);
  await page.evaluate(()=>scrollTo({top:1450,behavior:'instant'}));
  await expect(header).toHaveClass(/is-compact/);
  await expect(header).toHaveCSS('border-radius','24px');
  expect((await header.boundingBox()).width).toBeLessThan(1500);
  await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
  await expect(header).not.toHaveClass(/is-compact/);
});

test('compact header inverts only over dark sections', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  const header = page.locator('[data-header]');
  await expect(header).not.toHaveClass(/on-dark-section/);
  for (const [selector, dark] of [['#metodo', true], ['#para-quem', false], ['#em-acao', true], ['#parceiros', false]]) {
    await page.locator(selector).evaluate(el => scrollTo({top:el.getBoundingClientRect().top + scrollY + 120,behavior:'instant'}));
    if (dark) {
      await expect(header).toHaveClass(/on-dark-section/);
      await expect(header.locator('nav a').first()).toHaveCSS('color','rgb(10, 10, 11)');
      await expect(header.locator('.motion-button')).toHaveCSS('background-color','rgb(10, 10, 11)');
    } else await expect(header).not.toHaveClass(/on-dark-section/);
  }
});
