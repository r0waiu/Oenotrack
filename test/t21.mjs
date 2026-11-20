// Mobile : bouton « Imprimer le plan » + boîte d'impression sans débordement
import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
await page.click('button:has-text("Imprimer le plan")'); await page.waitForTimeout(500);
const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log('débordement :', ov, '| pages :', await page.locator('.overlay .planpage').count());
await page.screenshot({ path: SH + '/m-plan-print.png' });
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
