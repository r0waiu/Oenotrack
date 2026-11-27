// 0.42.0-alpha.4 : Tirages › Déclarations — déclaration préalable (volumes prévisionnels, alerte 48 h, rapport AIDAC), déclaration de fin
// de tirage (lots dans l'ordre de la saisie Innov OI, cuvée modifiée, VRTP distinct, dépôt figé), impressions du chantier (ordre de tirage,
// fiche de la chaîne). Données fictives (jeu d'exemple ; préparations, chantier et tirage créés par le test).
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const prep = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const cp = d.campagnes.find((c) => !c.figee); const date = cp.debut > '2026-11-20' ? cp.debut : '2026-11-20';
    const R = replay(d, date); const pv = Object.values(R.portions).filter((p) => p.vol > 1500 && (R.lots[p.lotId] || {}).qualif === 'conv' && (R.lots[p.lotId] || {}).type !== 'mout').sort((a, b) => b.vol - a.vol)[0];
    const liq = opSave(d, { type: 'preparation', date, ptype: 'liqueur_tirage', qualifId: 'conv', code: 'LT-T81', volL: 300, lignes: [] }).op; const lev = opSave(d, { type: 'preparation', date, ptype: 'levain', qualifId: 'conv', code: 'LEV-T81', volL: 300, lignes: [] }).op;
    const ch = chantierTirageSave(d, { dateDebut: date, nom: 'Chantier fictif T81', realisation: 'interne' }).id;
    const F = [{ format: 'bouteille', nb: 900, L: 0.75 }, { format: 'magnum', nb: 50, L: 1.5 }];
    const r = opSave(d, { type: 'tirage', date, sources: [{ portionId: pv.id, lotId: pv.lotId, volL: 670 }], prepUses: [{ prepId: liq.prepId, volL: 36 }, { prepId: lev.prepId, volL: 37.5 }], lignes: [], formats: F, ...tirageFormatsCompat(F), mode: 'pompe', chantierId: ch, pointGL: 24, pompe: { consignes: { liqueurPct: 4.8, levainPct: 5 } }, lotSpec: { code: 'T-T81', designation: 'Cuvée fictive T81', millesime: '2026' } });
    localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); return { date, ch, ok: r.ok, msg: r.msg };
  });
  ok('préparation : tirage fictif enregistré', prep.ok, prep.msg);
  await page.reload(); await page.waitForTimeout(1200);
  await page.click('#tab-tirage'); await page.waitForTimeout(300); await page.getByRole('tab', { name: /Déclarations/ }).click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-tirage-declarations]'));
  ok('sous-onglet Déclarations : explication AIDAC / Innov OI, lot de tirage sans déclaration signalé', /Innov OI/.test(t) && /sans déclaration de fin de tirage/.test(t), t.slice(0, 400));
  // ---- déclaration préalable
  await page.getByRole('button', { name: '＋ Déclaration préalable' }).click(); await page.waitForTimeout(300);
  await ov().getByLabel('Chantier de la déclaration').selectOption(prep.ch); await ov().getByLabel('Date de la déclaration').fill(prep.date); await ov().getByLabel('Date du tirage').fill(prep.date);
  await ov().getByLabel('Vin de base prévu').fill('100'); await ov().getByLabel('Point de tirage de la déclaration').fill('24'); await page.waitForTimeout(200);
  t = await txt(ov()); ok('préalable : volumes calculés (vin, sucre, total à tirer, VRTP prévisionnel), alerte à moins de 48 h', /total à tirer/.test(t) && /VRTP prévisionnel/.test(t) && /Moins de 48 h avant le tirage/.test(t), t.slice(0, 600));
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  t = await txt(page.locator('[data-declaration-rapport="prealable"]'));
  ok('rapport préalable : champs du formulaire de l’AIDAC et 3 exemplaires', /Volume prévisionnel de vin à mettre en œuvre/.test(t) && /Volume total à tirer/.test(t) && /3 exemplaires/.test(t), t.slice(0, 400));
  await ov().getByRole('button', { name: 'Fermer', exact: true }).last().click(); await page.waitForTimeout(300);
  // ---- déclaration de fin de tirage
  await page.getByRole('button', { name: '＋ Déclaration de fin de tirage' }).click(); await page.waitForTimeout(300);
  await ov().getByLabel('Chantier de la déclaration').selectOption(prep.ch); await page.waitForTimeout(200);
  const lots = ov().locator('[data-declaration-lots]'); t = await txt(lots);
  ok('fin de tirage : lot dans l’ordre de la saisie (produit, millésime, cuvée, flacons)', /T-T81/.test(t) && /900 × Bouteille/.test(t) && /50 × Magnum/.test(t) && (await ov().getByLabel('Millésime du lot T-T81').inputValue()) === '2026', t);
  await ov().getByLabel('Cuvée du lot T-T81').fill('Cuvée déclarée'); await ov().getByLabel('Titre alcoométrique avant tirage').fill('11,2');
  t = await txt(ov().locator('[data-finale-totaux]')); ok('totaux : vins, sucres et liqueurs, total tiré 7,50 hL, VRTP distinct', /total tiré 7,50 hL/.test(t) && /VRTP/.test(t), t);
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  t = await txt(page.locator('[data-declaration-rapport="finale"]'));
  ok('rapport de fin de tirage : volumes, VRTP, lots, ventilation', /Volume résultant d’exigences techniques particulières/.test(t) && /Cuvée déclarée/.test(t) && /Par revendication/i.test(t) && /11,20 % vol/.test(t), t.slice(0, 500));
  ok('… export CSV et PDF proposés', (await ov().getByRole('button', { name: '⬇ CSV' }).count()) === 1 && (await ov().locator('[data-sortie-pdf]').count()) === 1);
  await page.screenshot({ path: `${SC}/shots/t81-fin-tirage.png`, fullPage: true });
  await ov().getByRole('button', { name: 'Marquer déposée' }).click(); await page.waitForTimeout(200);
  await ov().getByLabel('Référence du dépôt').fill('ACC-T81'); await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  let d = await db(); const fin = (d.declarationsTirage || []).find((x) => x.type === 'finale');
  ok('dépôt : déclaration figée (calcul gardé), référence', fin && fin.statut === 'deposee' && fin.reference === 'ACC-T81' && fin.instantane && fin.instantane.calcul.lots[0].cuvee === 'Cuvée déclarée', fin);
  ok('… modification remplacée par « Rouvrir (rectificative) »', (await ov().getByRole('button', { name: 'Rouvrir (rectificative)' }).count()) === 1 && (await ov().getByRole('button', { name: 'Modifier', exact: true }).count()) === 0);
  await ov().getByRole('button', { name: 'Fermer', exact: true }).last().click(); await page.waitForTimeout(300);
  t = await txt(page.locator('[data-tirage-declarations]')); ok('liste : préalable en brouillon, fin de tirage déposée ; plus de lot sans déclaration', /brouillon/.test(t) && /déposée le/.test(t) && !/sans déclaration de fin de tirage/.test(t), t.slice(0, 500));
  // ---- impressions du chantier
  await page.getByRole('tab', { name: /Tirer/ }).click(); await page.waitForTimeout(300);
  await page.locator('tr', { hasText: 'Chantier fictif T81' }).click(); await page.waitForTimeout(400);
  await ov().getByRole('button', { name: '🖨 Ordre de tirage' }).click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-ordre-tirage]')); ok('ordre de tirage : lot, mode, point de tirage, préparations, consignes de la pompe', /T-T81/.test(t) && /LT-T81/.test(t) && /24,0 g\/L/.test(t) && /Pompe doseuse : liqueur 4,80 %/.test(t), t.slice(0, 500));
  await ov().getByRole('button', { name: 'Fermer', exact: true }).last().click(); await page.waitForTimeout(300);
  await ov().getByRole('button', { name: '🖨 Fiche de la chaîne' }).click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-chaine-rapport]')); ok('fiche de la chaîne imprimable : démarrage, contrôles, fournitures, visas', /Démarrage de la ligne/.test(t) && /Contrôles en cours de chantier/.test(t) && /Chef de ligne/.test(t), t.slice(0, 300));
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ viewport: { width: 1280, height: 900 } });
  await page.evaluate(() => localStorage.setItem('oenotrack-langue', 'en')); await page.reload(); await page.waitForTimeout(1200);
  await page.click('#tab-tirage'); await page.waitForTimeout(300); await page.getByRole('tab', { name: /Declarations/ }).click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-tirage-declarations]')); ok('en anglais : déclarations à l’AIDAC, boutons', /Declarations to the AIDAC/.test(t) && /Prior declaration/.test(t), t.slice(0, 300));
  ok('aucune erreur (2)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t81)'); process.exitCode = ko ? 1 : 0;
