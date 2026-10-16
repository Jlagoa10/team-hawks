import { test, expect } from '@playwright/test';

test('mobile layout keeps its styles when the application script cannot load', async ({ browser }) => {
  const context = await browser.newContext({viewport:{width:390,height:844}});
  const page = await context.newPage();
  await page.route('**/src/main.js', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const logo = await page.locator('[data-header] a[href="#inicio"]').boundingBox();
  expect(logo.width).toBeLessThan(250);
  expect(logo.height).toBeLessThan(80);
  expect(await page.locator('.hover-gallery').evaluate(el => getComputedStyle(el).display)).toBe('grid');
  await context.close();
});

for (const width of [320, 390, 600]) {
  test(`mobile content fits its containers at ${width}px with motion`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const logo = page.locator('[data-header] a[href="#inicio"]');
    const logoBox = await logo.boundingBox();
    expect(logoBox.width).toBeLessThan(width * .7);
    expect(logoBox.height).toBeLessThan(80);
    expect(await page.locator('#hero-title').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    for (const selector of ['.hover-gallery > li', '.method-visual-label', '[aria-labelledby="patrocinio-title"] ul']) {
      for (const element of await page.locator(selector).all()) {
        await element.evaluate(el => scrollTo({ top: el.getBoundingClientRect().top + scrollY - 100, behavior: 'instant' }));
        await expect.poll(() => element.evaluate(el => {
          const r = el.getBoundingClientRect();
          return { fits: r.left >= -1 && r.right <= innerWidth + 1 && el.scrollWidth <= el.clientWidth + 1, tag: el.outerHTML.slice(0,100), left: r.left, right: r.right, scroll: el.scrollWidth, client: el.clientWidth };
        })).toMatchObject({fits:true});
      }
    }
    expect(await page.locator('.method-visual').evaluate(el => getComputedStyle(el).position)).toBe('sticky');
    expect(await page.locator('.hover-gallery').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)).toBe(2);
  });
}
