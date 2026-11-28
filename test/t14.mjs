import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
await page.click('#tab-ops'); await page.waitForTimeout(300);
for (const [txt, name] of [['GH-482-KT', 'reception'], ['Débourbage', 'debourbage']]) {
  const row = page.locator('main tbody tr', { hasText: txt }).first();
  await row.locator('[data-op-menu]').click(); await page.waitForTimeout(150); await row.locator('button[aria-label="Fiche d’enregistrement"]').click(); await page.waitForTimeout(500);
  await page.emulateMedia({ media: 'print' }); await page.screenshot({ path: `${SH}/fiche-${name}.png`, fullPage: true }); await page.emulateMedia({ media: 'screen' });
  console.log(name, ':', (await page.locator('.overlay').last().locator('.fiche').first().innerText()).replace(/\s+/g, ' ').slice(0, 300));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
}
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
