import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [320, 390, 768, 1440]) {
  test(`launch: navigation and readable content at ${width}px`, async ({page}) => {
    await page.setViewportSize({width, height:900});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    for (const id of ['inicio','metodo','aulas','team-hawks','contato']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
    expect(await page.locator('a[href^="#"]').evaluateAll(links => links.every(a => !a.hash || document.getElementById(a.hash.slice(1))))).toBe(true);
    expect(await page.locator('body').innerText()).not.toContain('—');
    expect(errors).toEqual([]);
  });
}
test('launch: mobile menu and every contact link use the official WhatsApp', async ({page}) => {
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
  await expect(page.locator('#menu-mobile')).toBeVisible();
  await page.locator('#menu-mobile a[href="#metodo"]').click();
  await expect(page.locator('#menu-mobile')).toBeHidden();
  for(const link of await page.locator('[data-contact]').all()) {
    expect(new URL(await link.getAttribute('href')).pathname).toBe('/5511969182478');
  }
  await expect(page.locator('[data-channel-label]')).toHaveText('Atendimento via WhatsApp');
});
test('launch: production discovery, privacy, 404 and image assets', async ({page,request}) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://teamhawksfutevolei.com/');
  expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toContain('https://teamhawksfutevolei.com/');
  const assets = await page.locator('img[src],link[rel="icon"]').evaluateAll(nodes => nodes.map(n => n.getAttribute('src') || n.getAttribute('href')));
  for(const url of new Set([...assets,'/robots.txt','/sitemap.xml','/privacidade.html','/404.html','/assets/team-hawks-share-v2.png'])) {
    const response=await request.get(url); expect(response.ok(),url).toBe(true);
  }
  await page.goto('/privacidade.html');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Privacidade e cookies');
  await page.goto('/404.html');
  await expect(page.getByRole('heading',{level:1})).toHaveText('Página não encontrada');
});
test('launch: supplied videos play by user action and pause offscreen', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  const card=page.locator('.video-card').first();
  await card.scrollIntoViewIfNeeded();
  const video=card.locator('video');
  await expect(card).toHaveAttribute('data-status','ready');
  await card.getByRole('button',{name:'Reproduzir vídeo'}).click();
  await expect.poll(()=>video.evaluate(v=>v.currentTime)).toBeGreaterThan(.1);
  await page.locator('#contato').scrollIntoViewIfNeeded();
  await expect.poll(()=>video.evaluate(v=>v.paused)).toBe(true);
});
test('launch: accessibility audit',async ({page})=>{
  await page.goto('/');
  const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  expect(results.violations).toEqual([]);
});
