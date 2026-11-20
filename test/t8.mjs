import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
await page.click('#tab-params'); await page.click('main button:has-text("Revendications, stades & listes")'); await page.waitForTimeout(300);
const ov = await page.evaluate(() => { const c = document.querySelector('main .card'); return { page: document.documentElement.scrollWidth - innerWidth, card: c.scrollWidth - c.clientWidth }; });
console.log('débordement', JSON.stringify(ov));
await page.locator('main .card').first().screenshot({ path: SH + '/m-fractions.png' });
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
