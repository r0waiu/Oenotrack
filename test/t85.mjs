// 0.44.0-alpha.1 : Tirages › chantier — cuvées prévues (plusieurs qualités : blanc de blancs, blanc de noirs, rosé d'assemblage), qualité
// calculée depuis les vins de base et corrigeable, statuts prévue / tirée et écart, cuve de mixtion et lot de tirage créés depuis la ligne,
// déclaration préalable par cuvée (une ligne par qualité, totaux, rosé), fin de tirage avec la cuvée et ses mentions ; anglais.
// Données fictives : test/fixtures/base-0.44.0-alpha.1-cuvees.json.
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const fx = JSON.parse(fs.readFileSync(new URL('./fixtures/base-0.44.0-alpha.1-cuvees.json', import.meta.url), 'utf8')); fx.settings.campagneActive = '2026-2027'; fx.settings.securite = { ...(fx.settings.securite || {}), actif: false };
const semer = (extra) => ({ content: `if (!sessionStorage.getItem('semee')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(fx))}); ${extra || ''} sessionStorage.setItem('semee', '1'); }` });
const ouvrirChantier = async (page, onglet) => {
  await page.click('#tab-tirage'); await page.waitForTimeout(300); await page.getByRole('tab', { name: onglet || /Tirer/ }).click(); await page.waitForTimeout(400);
  await page.locator('tr', { hasText: 'CH-2026-01' }).first().click(); await page.waitForTimeout(500);
};
{
  const { browser, page, errors } = await open({ init: semer(), viewport: { width: 1400, height: 950 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await ouvrirChantier(page);
  t = await txt(page.locator('[data-cuvees]'));
  ok('fiche du chantier : 3 cuvées prévues de qualités différentes (blanc de blancs, blanc de noirs, rosé d’assemblage), mentions calculées', /Blanc de blancs fictif/.test(t) && /Grand Cru – Blanc de blancs/.test(t) && /Blanc de noirs – Monocépage Pinot Noir/.test(t) && /Rosé d’assemblage fictif/.test(t) && /Rosé/i.test(t), t.slice(0, 700));
  ok('… statuts : blanc de blancs tirée (1 330 cols, écart −20), les autres prévues', /tirée/i.test(t) && /1\s?330 cols \(écart [−-]20\)/.test(t) && /prévue/i.test(t), t.slice(0, 700));
  ok('… boutons selon le statut : lot de tirage pour une cuvée par pompe, rien à créer pour une cuvée tirée', (await page.locator('[data-cuvee-tirer="cv2"]').count()) === 1 && (await page.locator('[data-cuvee-tirer="cv1"]').count()) === 0 && (await page.locator('[data-cuvee-mixtion="cv1"]').count()) === 0);
  await page.screenshot({ path: `${SC}/shots/t85-cuvees.png` });
  // ---- nouvelle cuvée prévue
  await page.locator('[data-cuvee-ajouter]').click(); await page.waitForTimeout(300);
  const f = ov(); await f.getByLabel('Nom de la cuvée').fill('Blanc de blancs bio T85');
  await pick(page, f.locator('input[placeholder="Cuve · lot · volume…"]').first(), 'AMP-01'); await page.waitForTimeout(200);
  t = await txt(f.locator('[data-cuvee-qualite]'));
  ok('formulaire : qualité calculée depuis le vin de base (blanc, bio, Premier Cru, millésime, blanc de blancs)', /Blanc/i.test(t) && /BIO/i.test(t) && /2025/.test(t) && /Blanc de blancs/.test(t) && /Premier Cru/.test(t), t);
  await f.getByLabel('Mode de tirage prévu').selectOption('mixtion'); await f.getByLabel('Point de tirage de la cuvée prévue').fill('24'); await f.getByLabel('Cols format 1').fill('300'); await page.waitForTimeout(200);
  t = await txt(f.locator('[data-cuvee-calcul]')); ok('… volumes prévus calculés (vin, sucre, total à tirer)', /total à tirer/.test(t) && /sucre/.test(t), t);
  await f.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  let d = await db(); let cv = d.chantiersTirage[0].cuvees.find((c) => c.nom === 'Blanc de blancs bio T85');
  ok('cuvée enregistrée : mixtion, vin de base, 300 cols, point de tirage', cv && cv.mode === 'mixtion' && cv.sources.length === 1 && cv.formats[0].nb === 300 && cv.pointGL === 24, cv);
  // ---- cuve de mixtion depuis la ligne
  await page.locator(`[data-cuvee-mixtion="${cv.id}"]`).click(); await page.waitForTimeout(500);
  t = (await ov().locator('input').evaluateAll((e) => e.map((x) => x.value))).join(' | '); ok('＋ Cuve de mixtion : formulaire d’assemblage prérempli (vin de base de la cuvée, désignation)', /AMP-01/.test(t) && t.includes('Blanc de blancs bio T85 — mixtion'), t.slice(0, 500));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); if ((await page.locator('.overlay').count()) > 1) { await ov().getByRole('button', { name: /Annuler|Fermer/ }).first().click().catch(() => {}); await page.waitForTimeout(300); }
  // ---- lot de tirage par pompe depuis la ligne
  await page.locator('[data-cuvee-tirer="cv2"]').click(); await page.waitForTimeout(500);
  ok('＋ Lot de tirage : mode pompe, chantier, cols prévus, point de tirage de la cuvée', (await ov().getByLabel('Mode de tirage').inputValue()) === 'pompe' && (await ov().getByLabel('Chantier de tirage').inputValue()) === d.chantiersTirage[0].id && (await ov().getByLabel('Cols format 1').inputValue()) === '1100');
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); if ((await page.locator('.overlay').count()) > 1) { await ov().getByRole('button', { name: /Annuler|Fermer/ }).first().click().catch(() => {}); await page.waitForTimeout(300); }
  // ---- mentions corrigées
  await page.locator('[data-cuvees] tr', { hasText: 'Blanc de noirs fictif' }).getByRole('button', { name: 'Modifier' }).click(); await page.waitForTimeout(300);
  await ov().getByLabel('Mentions de la cuvée').fill('Blanc de noirs, Extra brut fictif'); await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  t = await txt(page.locator('[data-cuvees]')); ok('mentions saisies à la place des mentions calculées', /Blanc de noirs – Extra brut fictif/.test(t), t.slice(0, 600));
  // ---- déclaration préalable du chantier : une ligne par cuvée
  await ov().getByRole('button', { name: '＋ Déclaration préalable' }).click(); await page.waitForTimeout(400);
  t = await txt(ov().locator('[data-prealable-cuvees]'));
  ok('préalable : une ligne par cuvée prévue (qualité, vin, sucre, total), total ; plus de saisie du volume', /4 cuvée\(s\) prévue\(s\)/.test(t) && /Blanc de blancs bio T85/.test(t) && /Rosé/.test(t) && /Total : vin/.test(t) && (await ov().getByLabel('Vin de base prévu', { exact: true }).count()) === 0, t.slice(0, 700));
  await ov().getByLabel('Date de la déclaration').fill('2026-11-29'); await ov().getByLabel('Date du tirage').fill('2026-12-02');
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(600);
  t = await txt(page.locator('[data-declaration-rapport="prealable"]'));
  ok('rapport préalable : tableau des cuvées prévues, rosé d’assemblage (vins rouges et blancs), mentions réunies', /Cuvées prévues/i.test(t) && /Blanc de noirs fictif/.test(t) && /Rosé d’assemblage : vins rouges/.test(t) && /Extra brut fictif/.test(t), t.slice(0, 900));
  await page.screenshot({ path: `${SC}/shots/t85-prealable.png` });
  await ov().getByRole('button', { name: 'Fermer', exact: true }).last().click(); await page.waitForTimeout(300);
  // ---- fin de tirage : cuvée et mentions du lot tiré
  await ov().getByRole('button', { name: '＋ Déclaration de fin de tirage' }).click(); await page.waitForTimeout(400);
  ok('fin de tirage : lot tiré depuis la cuvée → nom et mentions de la cuvée', (await ov().getByLabel('Cuvée du lot T-BDB-FX').inputValue()) === 'Blanc de blancs fictif' && /Grand Cru – Blanc de blancs/.test(await ov().getByLabel('Revendications particulières du lot T-BDB-FX').inputValue()));
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ init: semer("localStorage.setItem('oenotrack-langue', 'en');"), viewport: { width: 1280, height: 900 } });
  await ouvrirChantier(page, /Bottle|Tirer|Fill/);
  t = await txt(page.locator('.overlay').last()); ok('en anglais : « Planned cuvées (forecast) », statuts traduits, données gardées', /Planned cuvées \(forecast\)/.test(t) && /planned/i.test(t) && /bottled/i.test(t) && /Blanc de blancs fictif/.test(t), t.slice(0, 500));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t85)'); process.exitCode = ko ? 1 : 0;
