// Chartes : chaque thème en clair et en sombre
import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots/chartes';
import fs from 'fs'; fs.mkdirSync(SH, { recursive: true });
const { browser, page, errors } = await open();
const info = () => page.evaluate(() => [document.documentElement.dataset.charte, document.documentElement.dataset.mode, document.documentElement.dataset.band, getComputedStyle(document.body).backgroundColor, getComputedStyle(document.body).fontFamily.split(',')[0]].join(' | '));
console.log('défaut :', await info());
await page.locator('header button', { hasText: 'Thème' }).click(); await page.waitForTimeout(400);
await page.screenshot({ path: SH + '/picker.png' });
const ids = await page.$$eval('.charte-card', (b) => b.map((x) => x.querySelector('b').textContent));
console.log('chartes :', ids.join(' · '));
for (let i = 0; i < ids.length; i++) {
  for (const m of ['Clair', 'Sombre']) {
    await page.locator('.charte-card').nth(i).locator('.charte-modes button', { hasText: m }).click(); await page.waitForTimeout(200);
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    await page.click('#tab-cuverie'); await page.waitForTimeout(150);
    await page.screenshot({ path: `${SH}/c${i}-${m}.png` });
    console.log(i, ids[i], m, '→', await info());
    await page.locator('header button', { hasText: 'Thème' }).click(); await page.waitForTimeout(250);
  }
}
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
