import { open } from './ui.mjs'; import fs from 'fs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/pdf';
const { browser, page, errors } = await open();
await page.click('#tab-trace'); await page.click('main button:has-text("🖨 Rapports imprimables")'); await page.click('main button:has-text("Choisir les lots")'); await page.waitForTimeout(300); // 0.14.0-alpha.1 : rapports dans la Traçabilité
const top = page.locator('.overlay').last();
await top.locator('[role=group], .card').first().waitFor();
for (const k of [0, 1, 2]) await top.locator('.card input[type=checkbox]').nth(k).check();
await page.click('text=/Aperçu du rapport/'); await page.waitForTimeout(500);
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), top.locator('button:has-text("⬇ PDF")').click()]);
await dl.saveAs(SH + '/rapport.pdf'); console.log('PDF :', fs.statSync(SH + '/rapport.pdf').size, 'octets');
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
