// Stades / couleurs : formulaires (proposition automatique), changement de stade, assemblage blanc + rouge
import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
const top = () => page.locator('.overlay').last();
await page.click('#tab-ops'); await page.waitForTimeout(300);
// 1. ajout d'intrants avec levure → stade proposé « En fermentation alcoolique »
await page.click('main button:text-is("Ajout d’intrants")'); await page.waitForTimeout(400);
const c = top().locator('input[role=combobox]');
console.log('combos :', await c.count());
await page.screenshot({ path: SH + '/t22-intrant.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// 2. changement de stade
await page.click('main button:text-is("Changement de stade")'); await page.waitForTimeout(400);
await page.screenshot({ path: SH + '/t22-etape.png' });
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
