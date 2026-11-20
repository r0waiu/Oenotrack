import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
await page.click('#tab-params');
for (const t of ['Crus & parcelles', 'Partenaires', 'Sites', 'Contenants & couleurs']) { await page.click(`main button:has-text("${t}")`); await page.waitForTimeout(400); await page.screenshot({ path: `${SH}/reg-${t.slice(0, 5)}.png`, fullPage: t.startsWith('Cont') }); console.log(t, await page.$eval('main', (m) => m.innerText.length)); }
// cru personnalisé
await page.click('main button:has-text("Crus & parcelles")'); await page.click('text=+ Cru personnalisé'); await page.waitForTimeout(300);
await page.screenshot({ path: SH + '/cruform.png' });
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
