import { open } from './ui.mjs'; import fs from 'fs';
// base v1 : extraite de la page publiée (jeu d'exemple v1 généré dans le navigateur)
const { browser, page, errors } = await open();
const old = fs.readFileSync(new URL('./fixtures/base-v1-cuverie-champenoise-exemple.json', import.meta.url), 'utf8');
console.log('base v1 :', old ? Math.round(old.length / 1024) + ' Ko' : 'ABSENTE');
await page.evaluate((o) => { localStorage.clear(); localStorage.setItem('cuverie-champenoise-db-v1', o); }, old);
await page.reload(); await page.waitForTimeout(1200);
console.log(await page.$eval('main', (m) => m.innerText.slice(0, 160).replace(/\n/g, ' | ')));
console.log('clé v2:', await page.evaluate(() => !!localStorage.getItem('oenotrack-db-v2')));
for (const t of ['cuverie', 'trace', 'registres']) { await page.click('#tab-' + t); await page.waitForTimeout(300); }
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
