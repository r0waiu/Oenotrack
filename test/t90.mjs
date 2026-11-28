// 0.47.0-alpha.2 : revue du vocabulaire technique — Paramètres › Calculs œnologiques (saccharose : valeur physique 0,6329 pour les calculs,
// valeur douanière 0,66 pour les déclarations ; points de densité par g/L déduits du coefficient unique ; conversion sucres → TAP),
// fractions (libellés d'origine « 1re taille », aide des sous-fractions), assemblage d'un blanc et d'un rouge (coupage ; avertissement
// rosé pour un vin tranquille, pas en Champagne), anglais. Données fictives (test/fixtures/base-0.47.0-alpha.2-termes.json).
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const fx0 = JSON.parse(fs.readFileSync(new URL('./fixtures/base-0.47.0-alpha.2-termes.json', import.meta.url), 'utf8')); fx0.settings.securite = { ...(fx0.settings.securite || {}), actif: false };
const semer = (fx, langue) => ({ content: `if (!sessionStorage.getItem('semee')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(fx))}); ${langue ? `localStorage.setItem('oenotrack-langue', '${langue}');` : ''} sessionStorage.setItem('semee', '1'); }` });
const tranquille = JSON.parse(JSON.stringify(fx0)); tranquille.settings.region = 'autre'; tranquille.settings.profilViticole = { ...(tranquille.settings.profilViticole || {}), region: 'rhone', types: ['rouge', 'blanc'] };
// formulaire « Regroupement de cuves » (comportement assemblage) : un rouge (ROU-25) et un blanc (JAR-01)
const coupage = async (page, nom) => {
  await page.click('#tab-ops'); await page.waitForTimeout(400);
  await page.locator('main [data-groupe] button', { hasText: nom || 'Regroupement de cuves' }).click(); await page.waitForTimeout(400);
  const f = page.locator('.overlay').last(); const cb = f.locator('input[role=combobox]');
  await pick(page, cb.nth(0), 'Fût 01', 'ROU-25'); await page.waitForTimeout(200); await pick(page, cb.nth(1), 'Jarre 01', 'JAR-01'); await page.waitForTimeout(400);
  return f;
};
{
  const { browser, page, errors } = await open({ init: semer(fx0), viewport: { width: 1360, height: 900 } });
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="calculs"]').click(); await page.waitForTimeout(500);
  t = await txt(page.locator('[data-params-calculs]'));
  ok('Calculs œnologiques : saccharose — calculs 0,6329 (valeur physique) et déclarations 0,66 (valeur douanière), aides', /Augmentation de volume du saccharose — calculs/i.test(t) && /Augmentation de volume du saccharose — déclarations/i.test(t) && /Valeur physique, calculs \(0,6329\)/.test(t) && /Valeur douanière, déclarations \(0,66\)/.test(t)
    && (await page.getByLabel('Augmentation de volume du saccharose — calculs (L/kg)').inputValue()).replace('.', ',') === '0,6329' && (await page.getByLabel('Augmentation de volume du saccharose — déclarations (L/kg)').inputValue()).replace('.', ',') === '0,66', [await page.getByLabel('Augmentation de volume du saccharose — calculs (L/kg)').inputValue(), await page.getByLabel('Augmentation de volume du saccharose — déclarations (L/kg)').inputValue(), t.slice(0, 300)]);
  ok('… un seul coefficient sucre / densité (2,5 g/L par point, base existante migrée) ; points de densité par g/L déduits (0,400) ; conversion sucres → TAP 16,83', /Un seul coefficient/.test(t) && (await page.locator('[data-dens-pt-gl]').innerText()).trim() === '0,400' && /Conversion sucres → TAP/i.test(t) && /16,83/.test(t) && /Enrichissement des moûts \(saccharose, MCR\)/i.test(t), t.slice(0, 900));
  await page.screenshot({ path: `${SC}/shots/t90-calculs.png` });
  await page.locator('main [role=tab]', { hasText: 'Revendications, stades' }).click(); await page.waitForTimeout(500);
  ok('fractions : base existante gardée (« 1re taille », « 2e taille ») ; aide des sous-fractions (cœur de cuvée, 1re / 2e taille, avec leur rôle)', (await page.locator('select[aria-label="Rôle de la fraction (1re taille)"]').count()) === 1 && (await page.locator('select[aria-label="Rôle de la fraction (2e taille)"]').count()) === 1 && /cœur de cuvée, tête de cuvée, 1re \/ 2e taille/.test(await txt(page.locator('[data-sous-fractions]'))));
  const f = await coupage(page); t = await txt(f);
  ok('assemblage d’un rouge et d’un blanc en Champagne : coupage signalé (règlement délégué (UE) 2019/934, art. 7), pas d’avertissement rosé', (await f.locator('[data-coupage]').count()) === 1 && (await f.locator('[data-rose-coupage]').count()) === 0 && /2019\/934, art\. 7/.test(t), t.slice(0, 600));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ init: semer(tranquille), viewport: { width: 1360, height: 900 } });
  const f = await coupage(page); t = await txt(f.locator('[data-rose-coupage]'));
  ok('vin tranquille : avertissement « Rosé par coupage » (règlement délégué (UE) 2019/934, art. 8 ; exception de la Côte-Rôtie citée), non bloquant', /Rosé par coupage/i.test(t) && /2019\/934, art\. 8/.test(t) && /Côte-Rôtie/.test(t), t);
  await page.screenshot({ path: `${SC}/shots/t90-rose.png` });
  ok('aucune erreur dans la page (vin tranquille)', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ init: semer(tranquille, 'en'), viewport: { width: 1280, height: 900 } });
  const f = await coupage(page, 'Tank consolidation'); t = await txt(f.locator('[data-rose-coupage]'));
  ok('en anglais : « Rosé by blending », « Delegated Regulation (EU) 2019/934, art. 8 »', /Rosé by blending/i.test(t) && /Delegated Regulation \(EU\) 2019\/934, art\. 8/.test(t), t);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="calculs"]').click(); await page.waitForTimeout(500);
  t = await txt(page.locator('[data-params-calculs]'));
  ok('en anglais : « Sucrose volume increase — declarations », « Customs value »', /Sucrose volume increase — declarations/i.test(t) && /Customs value, declarations/.test(t), t.slice(0, 600));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t90)'); process.exitCode = ko ? 1 : 0;
