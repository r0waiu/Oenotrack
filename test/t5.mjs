import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
for (const [name, o] of [['mobile', { viewport: { width: 390, height: 844 }, mobile: true }], ['dark', { dark: true }]]) {
  const { browser, page, errors } = await open(o);
  await page.screenshot({ path: `${SH}/${name}-home.png` });
  for (const t of ['cuverie', 'trace', 'registres', 'ops']) { await page.click('#tab-' + t); await page.waitForTimeout(300); const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); if (ov > 2) console.log(name, t, 'débordement horizontal', ov); }
  await page.click('#tab-cuverie'); await page.waitForTimeout(300);
  if (name === 'mobile') { await page.click('main button:has-text("Cartes")'); await page.waitForTimeout(300); await page.screenshot({ path: `${SH}/mobile-cartes.png` }); await page.locator('.tankcard').nth(4).click(); await page.waitForTimeout(400); await page.screenshot({ path: `${SH}/mobile-contsheet.png` }); }
  else { await page.screenshot({ path: `${SH}/dark-cuverie.png`, fullPage: false }); }
  console.log(name, 'ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
}
