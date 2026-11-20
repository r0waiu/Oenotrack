import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
for (const [nm, o] of [['pc', {}], ['mobile', { viewport: { width: 390, height: 844 }, mobile: true }], ['sombre', { dark: true }]]) {
  const { browser, page, errors } = await open(o);
  await page.click('#tab-params'); await page.click('main button:has-text("Données & paramètres")'); await page.waitForTimeout(300);
  await page.locator('main .charte-card .charte-pick', { hasText: 'Terroirs' }).click(); await page.waitForTimeout(400);
  await page.click('#tab-cuverie'); await page.waitForTimeout(400);
  await page.screenshot({ path: `${SH}/terroirs-${nm}.png` });
  await page.click('#tab-previsions'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${SH}/terroirs-prev-${nm}.png` });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (ov > 2) console.log(nm, 'débordement', ov);
  console.log(nm, 'ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
}
