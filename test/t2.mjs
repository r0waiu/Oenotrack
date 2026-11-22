import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
await page.click('#tab-trace'); await page.waitForTimeout(300);
await page.locator('main [role=tab]', { hasText: 'Intrant (rappel de lot)' }).first().click(); await page.waitForTimeout(250); // 0.28.0-alpha.1 : « Toutes les étapes » d'abord
await page.locator('main input[role=combobox]').first().click(); await page.locator('main [role=option]').first().click(); await page.waitForTimeout(400);
await page.screenshot({ path: SH + '/trace-intrant.png', fullPage: true });
console.log(await page.$eval('main', (m) => m.innerText.slice(0, 600).replace(/\n/g, ' | ')));
await page.click('text=Cru (village)'); await page.waitForTimeout(300);
await page.screenshot({ path: SH + '/trace-cru.png' });
await page.click('text=Échelle des crus'); await page.waitForTimeout(400);
console.log(await page.$eval('main', (m) => m.innerText.slice(0, 400).replace(/\n/g, ' | ')));
await page.click('#tab-trace'); await page.click('main button:has-text("🖨 Rapports imprimables")'); await page.click('main button:has-text("Choisir les lots")'); await page.waitForTimeout(300); // 0.14.0-alpha.1 : rapports dans la Traçabilité
await page.click('text=Tout cocher'); await page.click('text=/Aperçu du rapport/'); await page.waitForTimeout(500);
await page.screenshot({ path: SH + '/report.png' });
await page.emulateMedia({ media: 'print' }); await page.screenshot({ path: SH + '/report-print.png' }); await page.emulateMedia({ media: 'screen' });
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
