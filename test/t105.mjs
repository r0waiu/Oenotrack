// 0.50.0-alpha.3 : cahiers des charges — fiche « 📜 Cahier des charges » dans Vignoble › Appellations (rendement, cépages, texte et
// version), ajout proposé des cépages, alerte non bloquante dans le formulaire d'une parcelle (cépage hors cahier des charges), anglais.
// Données fictives (jeu d'exemple).
import { open, vignoble } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const init = () => { window.claude = { use: async () => null }; window.print = () => {}; };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const ov = () => page.locator('.overlay').last();

// 1. Champagne cochée dans Vignoble › Appellations → bouton du cahier des charges
await vignoble(page, 'Appellations'); await page.waitForTimeout(300);
if (await page.locator('[data-vignoble-relier]').count()) { await page.locator('[data-vignoble-relier]').click(); await page.waitForTimeout(500); }
const champ = page.locator('[data-vignoble-ref="champagne:champagne"] input');
if (await champ.count() && !(await champ.isChecked())) { await champ.check(); await page.waitForTimeout(500); }
let d = await db(); const app = d.lists.appellations.find((a) => a.ref && a.ref.id === 'champagne:champagne');
ok('Champagne dans la liste, reliée au référentiel, bouton « 📜 Cahier des charges »', app && (await page.locator(`[data-vignoble-cdc="${app.id}"]`).count()) === 1);
await page.locator(`[data-vignoble-cdc="${app.id}"]`).click(); await page.waitForTimeout(500);
let t = await txt(ov());
ok('fiche : rendement 12 400 kg/ha, richesse en sucre 143 g/L, cépages, TAV total 13, pratiques interdites, texte officiel et version (arrêté du 31 juillet 2025)', /12 400/.test(t) && /143/.test(t) && /Chardonnay/.test(t) && /Pratiques interdites/.test(t) && /31 juillet 2025/.test(t) && (await ov().locator('[data-cdc-source]').getAttribute('href')).startsWith('https://info.agriculture.gouv.fr/'), t.slice(0, 500));
await page.screenshot({ path: SC + '/shots/t105-cdc.png' });
// 2. pré-réglage : cépages manquants ajoutés
ok('cépages du cahier des charges absents de la liste proposés (Arbane, Petit meslier…)', /Arbane/.test(await txt(ov().locator('[data-cdc-cepages-manquants]'))));
await ov().locator('[data-cdc-cepages-ajouter]').click(); await page.waitForTimeout(500); d = await db();
ok('… ajoutés à la liste des cépages', ['Arbane', 'Petit meslier'].every((n) => d.lists.cepages.some((c) => c.label === n)) && !(await ov().locator('[data-cdc-cepages-manquants]').count()));
for (let i = 0; i < 3 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
// 3. parcelle : cépage hors cahier des charges → avertissement non bloquant
await vignoble(page, 'Parcelles'); await page.locator('main button', { hasText: '＋ Nouvelle parcelle' }).first().click(); await page.waitForTimeout(400);
const f = ov(); await f.getByLabel('Appellation de la parcelle').selectOption(app.id); await page.waitForTimeout(200);
const opts = await f.locator('select').evaluateAll((S) => S.map((s) => [s.getAttribute('aria-label') || '', [...s.options].map((o) => o.value + '=' + o.textContent)]));
ok('formulaire de la parcelle : appellation choisie, aucun avertissement sans cépage', !(await f.locator('[data-cdc-parcelle]').count()), opts.map((x) => x[0]));
ok('aucune erreur', !errors.length, errors);
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(300);
for (let i = 0; i < 3 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
await vignoble(page, 'Appellations'); await page.locator(`[data-vignoble-cdc="${app.id}"]`).click(); await page.waitForTimeout(400);
t = await txt(ov());
ok('anglais : « Specification », « Main grape varieties », « Yield (kg/ha) » ; nom de l’appellation non traduit', /Specification/.test(t) && /Main grape varieties/.test(t) && /Yield \(kg\/ha\)/.test(t) && /Champagne/.test(t), t.slice(0, 300));
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt105 : TOUT PASSE'); process.exitCode = ko ? 1 : 0;
