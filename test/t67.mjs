// 0.34.0-alpha.1 : entrée de moûts — analyses imposées « Moût · Débourbage » (plus de liste), volume calculé à l'épalement (hauteur en cm,
// modifiable à la main), plusieurs partenaires dans une même citerne (onglets avec n° de bon / DAE, moûts, documents et bulletin d'analyses
// par partenaire), enregistrement en cuve, lots créés, registre, modification, traçabilité, anglais, téléphone.
// Données fictives : test/fixtures/base-0.34.0-alpha.1-partenaires.json (Cuve 03 avec une table d'épalement fictive : 50 L par cm).
import { open, pick } from './ui.mjs'; import fs from 'fs'; import path from 'path';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const db0 = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'base-0.34.0-alpha.1-partenaires.json'), 'utf8'));
db0.settings.securite = { ...db0.settings.securite, actif: false }; // test de saisie : sans écran de connexion
const init = { content: `if (!sessionStorage.getItem('semee')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(db0))}); sessionStorage.setItem('semee', '1'); } window.print = () => {};` };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const ov = () => page.locator('.overlay').last();
const toast = async () => page.locator('.toast').last().innerText().catch(() => '');
let minute = 0; const avance = async (pg = page) => { minute += 1; await pg.clock.setFixedTime(new Date(Date.parse('2026-11-26T10:00:00') + minute * 60000)); }; // horloge figée : l'anti-double-clic du plan de cave se relâche
const fermer = async () => { for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };

// 1. Cuve 03 (table d'épalement) › Entrée de moûts ici
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await page.locator('.pitem', { hasText: 'Cuve 03' }).first().click({ button: 'right' }); await page.waitForTimeout(250);
await page.locator('[role=menuitem]', { hasText: /moût/i }).first().click(); await page.waitForTimeout(400);
let s = ov(); let t = await txt(s);
ok('analyses imposées : plus de liste « Modèle d’analyse », modèle « Moût · Débourbage » annoncé, champs du moût affichés directement', (await s.locator('[aria-label="Modèle d’analyse des lots reçus"]').count()) === 0 && /Analyses des lots reçus : Moût · Débourbage/.test(t)
  && await s.locator('[aria-label="TAP du moût 1"]').isVisible() && await s.locator('[aria-label="AT du moût 1"]').isVisible() && (await s.locator('summary', { hasText: /Analyses du lot/ }).count()) === 0, t.slice(0, 400));
ok('en-tête commun : date, immatriculation, millésime ; onglet « Partenaire n° 1 »', (await s.locator('input[placeholder="ex. AB-123-CD"]').count()) === 1 && (await s.locator('[data-onglets-partenaires] [role=tab]').count()) === 1 && /Partenaire n° 1/.test(await s.locator('[data-onglets-partenaires]').innerText()));
await s.locator('input[placeholder="ex. AB-123-CD"]').fill('TT-067-AB');
// onglet 1 : EARL Marchand, BL-T67-1
await pick(page, s.locator('input[aria-label="Partenaire 1"]'), 'EARL', 'EARL Marchand'); await page.waitForTimeout(200);
await s.locator('[aria-label="N° de bon / DAE du partenaire 1"]').fill('BL-T67-1');
await s.locator('[aria-label="N° de lot du moût 1"]').fill('T67-1');
ok('partenaire de l’onglet donné au moût ; onglet nommé avec le partenaire et le n° de bon', /EARL Marchand · BL-T67-1/.test(await txt(s.locator('[data-onglets-partenaires]'))) && (await s.locator('[data-partenaires="1"] .chip', { hasText: 'EARL Marchand' }).count()) === 1, [await s.locator('[data-onglets-partenaires]').innerText(), await s.locator('[data-partenaires="1"]').innerText()]);
// 2. épalement : Cuve 03 contient 38,90 hL ; hauteur 107,8 cm = 53,90 hL → 15,00 hL reçus
const H = s.locator('[aria-label="Hauteur en cuve 1 du moût 1 (cm)"]');
ok('cuve avec table d’épalement : champ « Hauteur après réception (cm) »', (await H.count()) === 1 && /Hauteur après réception/i.test(await s.locator('[data-hauteur-cuve="1-1"]').innerText()));
await H.fill('107,8'); await page.waitForTimeout(200);
const V1 = s.locator('[aria-label="Volume vers la cuve 1 du moût 1"]');
t = await txt(s.locator('[data-hauteur-cuve="1-1"]'));
ok('hauteur saisie → volume calculé (contenu mesuré − contenu d’avant) et rempli', /53,90 hL en cuve − 38,90 hL déjà présents = 15,00 hL reçus/.test(t) && /^15(,00?)?$/.test(await V1.inputValue()), [t, await V1.inputValue()]);
await V1.fill('14,5'); await page.waitForTimeout(150);
ok('volume ajusté à la main : gardé, signalé', (await V1.inputValue()) === '14,5' && /volume ajusté à la main/.test(await s.locator('[data-hauteur-cuve="1-1"]').innerText()));
await s.locator('[data-hauteur-cuve="1-1"] button', { hasText: 'Reprendre le calcul' }).click(); await page.waitForTimeout(150);
ok('« Reprendre le calcul » : volume de l’épalement', /^15(,00?)?$/.test(await V1.inputValue()), await V1.inputValue());
// moût 2 de l'onglet 1 : Cuve 02 (sans épalement), 5 hL
await s.locator('button:has-text("+ Ajouter un moût")').click(); await page.waitForTimeout(150);
await s.locator('[aria-label="Cépage du moût 2"]').selectOption({ label: 'Meunier' });
await pick(page, s.locator('input[aria-label="Cuve de destination 1 du moût 2"]'), 'Cuve 02', 'Cuve 02');
ok('cuve sans table d’épalement : pas de champ de hauteur', (await s.locator('[aria-label="Hauteur en cuve 1 du moût 2 (cm)"]').count()) === 0);
await s.locator('[aria-label="Volume vers la cuve 1 du moût 2"]').fill('5');
// 3. onglet 2 : Domaine Hennequin, DAE-T67-2, un moût vers la Cuve 03 (le moût 1 y est déjà compté)
await s.locator('[data-ajouter-partenaire]').click(); await page.waitForTimeout(250);
ok('« + Partenaire » : deuxième onglet actif, avec son propre moût (Moût 1)', (await s.locator('[data-onglets-partenaires] [role=tab]').count()) === 2 && (await s.locator('[data-onglet-partenaire="2"]').getAttribute('aria-selected')) === 'true'
  && (await s.locator('[role=tabpanel] [data-mout]').count()) === 1 && /Moût 1/.test(await s.locator('[role=tabpanel] [data-mout] .chip-info').innerText()));
await pick(page, s.locator('input[aria-label="Partenaire 2"]'), 'Henn', 'Domaine Hennequin'); await page.waitForTimeout(200);
await s.locator('[aria-label="N° de bon / DAE du partenaire 2"]').fill('DAE-T67-2');
await s.locator('[aria-label="Cépage du moût 3"]').selectOption({ label: 'Pinot Noir' });
await pick(page, s.locator('input[aria-label="Cuve de destination 1 du moût 3"]'), 'Cuve 03', 'Cuve 03'); await page.waitForTimeout(150);
await s.locator('[aria-label="Hauteur en cuve 1 du moût 3 (cm)"]').fill('123,8'); await page.waitForTimeout(200);
t = await txt(s.locator('[data-hauteur-cuve="3-1"]'));
ok('épalement du 2e partenaire : le moût du 1er déjà versé dans la cuve est compté (61,90 − 53,90 = 8,00 hL)', /61,90 hL en cuve − 53,90 hL déjà présents = 8,00 hL reçus/.test(t) && /^8(,00?)?$/.test(await s.locator('[aria-label="Volume vers la cuve 1 du moût 3"]').inputValue()), t);
// 4. bulletin d'analyses du partenaire 2 : lu, reporté sur son moût, joint à l'onglet ; document du partenaire 2
await s.locator('[data-docs-partenaire="2"] summary').click(); await page.waitForTimeout(150);
await s.locator('input[type=file][aria-label="Bulletin d’analyses du partenaire 2"]').setInputFiles([{ name: 'bulletin-hennequin.txt', mimeType: 'text/plain', buffer: Buffer.from('Laboratoire fictif\nÉchantillon n° 1 : Moût Hennequin\nTAP    10,4   % vol\nAcidité totale    7,9    g/L H2SO4\n') }]);
await page.waitForTimeout(1500);
ok('bulletin lu : TAP et AT reportés sur le moût du partenaire 2 ; joint à son onglet', (await s.locator('[aria-label="TAP du moût 3"]').inputValue()) === '10,4' && (await s.locator('[aria-label="AT du moût 3"]').inputValue()) === '7,9' && /bulletin-hennequin\.txt/.test(await s.locator('[data-docs-partenaire="2"]').innerText()), [await s.locator('[aria-label="TAP du moût 3"]').inputValue(), await toast()]);
await s.locator('input[type=file][aria-label="Documents du partenaire 2"]').setInputFiles([{ name: 'dae-hennequin.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') }]); await page.waitForTimeout(500);
await s.locator('input[type=file][aria-label="Fichiers à joindre"]').setInputFiles([{ name: 'photo-citerne.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') }]); await page.waitForTimeout(500);
ok('documents : 2 dans l’onglet du partenaire 2, 1 document général', (await s.locator('[data-docs-partenaire="2"] li').count()) === 2 && /photo-citerne/.test(await s.locator('[data-docs-attente]').last().innerText()));
await page.screenshot({ path: SC + '/shots/t67-partenaire2.png', fullPage: true });
// retour à l'onglet 1 : ses deux moûts, analyses non touchées
await s.locator('[data-onglet-partenaire="1"]').click(); await page.waitForTimeout(200);
ok('onglet 1 : ses 2 moûts (Moût 1, Moût 2), analyses non touchées par le bulletin du partenaire 2 ; documents du partenaire 2 absents', (await s.locator('[role=tabpanel] [data-mout]').count()) === 2 && (await s.locator('[aria-label="TAP du moût 1"]').inputValue()) === '' && !/bulletin-hennequin/.test(await s.locator('[data-docs-partenaire="1"]').innerText()));
await s.locator('[aria-label="TAP du moût 1"]').fill('9,8');
t = await txt(s);
ok('lots créés : Cuve 03 (moûts des deux partenaires) et Cuve 02', /Lots créés : un lot de moût par cuve \(2\)/i.test(t) && /EARL Marchand \+ Domaine Hennequin/.test(await s.locator('input[aria-label="Désignation du lot en Cuve 03"]').getAttribute('placeholder')), [t.slice(-600), await s.locator('input[aria-label="Désignation du lot en Cuve 03"]').getAttribute('placeholder')]);
await page.screenshot({ path: SC + '/shots/t67-saisie.png', fullPage: true });
// 5. enregistrement
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(700);
const tv = await toast(); ok('entrée validée avec ses documents', /validée/.test(tv), tv);
if (await page.locator('[data-schema-feuille]').count()) { await ov().locator('.sheet-f button', { hasText: 'Plus tard' }).click(); await page.waitForTimeout(300); }
let d = await db(); const op = d.ops.filter((o) => o.type === 'entree_mout').pop();
const ap = (nom) => d.apporteurs.find((a) => a.nom === nom).id; const M = ap('EARL Marchand'); const Hn = ap('Domaine Hennequin');
ok('opération : deux partenaires (onglets) et leur n° de bon ; op.apporteurId / op.ref remplis ; chaque moût porte son partenaire', op.partenaires.length === 2 && op.partenaires[0].apporteurId === M && op.partenaires[0].ref === 'BL-T67-1' && op.partenaires[1].apporteurId === Hn && op.partenaires[1].ref === 'DAE-T67-2'
  && op.apporteurId === M && op.ref === 'BL-T67-1 / DAE-T67-2' && op.entrees.map((e) => e.partId).join() === [op.partenaires[0].id, op.partenaires[0].id, op.partenaires[1].id].join() && op.entrees[2].apporteurs[0].id === Hn && op.partenaires[0].lignes.length === 2, op);
ok('analyses imposées « Moût · Débourbage » ; valeurs du bulletin et saisies gardées', op.analyseModele === 'm_mout' && op.entrees[0].analyses.tap === 9.8 && op.entrees[2].analyses.tap === 10.4 && op.entrees[2].analyses.at === 7.9, op.entrees.map((e) => e.analyses));
ok('mesures en cuve gardées avec l’opération (hauteur, contenu d’avant, volume)', op.jaugesCuves.length === 2 && op.jaugesCuves[0].apres === 107.8 && op.jaugesCuves[0].volAvant === 3890 && op.jaugesCuves[0].volL === 1500 && op.jaugesCuves[1].volAvant === 5390 && op.jaugesCuves[1].volL === 800, op.jaugesCuves);
const docs = d.docs.filter((x) => x.cible.type === 'op' && x.cible.id === op.id);
ok('documents rattachés : bulletin et DAE au partenaire 2, photo générale', docs.length === 3 && docs.filter((x) => x.partId === op.partenaires[1].id).length === 2 && docs.find((x) => /bulletin/.test(x.nom)).cat === 'analyse' && !docs.find((x) => /photo/.test(x.nom)).partId, docs);
const l03 = d.lots.find((l) => l.opId === op.id && l.contenantId === 'ct24'); const l02 = d.lots.find((l) => l.opId === op.id && l.contenantId === 'ct23');
ok('lots en cuve : Cuve 03 partagée entre les deux partenaires (15 + 8 hL), Cuve 02 à EARL Marchand', l03 && l02 && Math.round(l03.origine.apporteurs[M]) === 1500 && Math.round(l03.origine.apporteurs[Hn]) === 800 && Object.keys(l02.origine.apporteurs).join() === M, [l03 && l03.origine, l02 && l02.origine]);
// fiche de la Cuve 03 : moûts reçus de l'entrée
await page.locator('.toast').first().waitFor({ state: 'detached', timeout: 15000 }).catch(() => {}); // le message masque la cuve
await avance(); await page.locator('.pitem', { hasText: 'Cuve 03' }).first().click(); await page.waitForTimeout(400);
t = await txt(ov()); ok('fiche Cuve 03 : moûts reçus des deux partenaires', /Moûts reçus/.test(t) && /EARL Marchand/.test(t) && /Domaine Hennequin/.test(t) && /T67-1/.test(t), t.slice(t.indexOf('Moûts reçus'), t.indexOf('Moûts reçus') + 300));
await fermer();
// 6. registre des entrées : n° de bon de chaque partenaire
await page.click('#tab-registres'); await page.waitForTimeout(400);
t = await txt(page.locator('main'));
ok('registre : chaque moût avec le n° de bon de son partenaire', /BL-T67-1/.test(t) && /DAE-T67-2/.test(t) && !/BL-T67-1 \/ DAE-T67-2/.test(t), t.slice(0, 200));
// 7. modification : onglets retrouvés, hauteur gardée ; n° de bon changé
await page.click('#tab-ops'); await page.waitForTimeout(400);
await page.locator('main tr', { hasText: 'DAE-T67-2' }).first().locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(500); s = ov();
ok('modifier : 2 onglets, hauteur et analyses retrouvées, documents du partenaire 2 dans son onglet', (await s.locator('[data-onglets-partenaires] [role=tab]').count()) === 2 && /^107[.,]8$/.test(await s.locator('[aria-label="Hauteur en cuve 1 du moût 1 (cm)"]').inputValue())
  && /^9[.,]8$/.test(await s.locator('[aria-label="TAP du moût 1"]').inputValue()) && /\(0\)/.test(await s.locator('[data-docs-partenaire="1"] summary').innerText()), [await s.locator('[data-onglets-partenaires] [role=tab]').count(), await s.locator('[aria-label="Hauteur en cuve 1 du moût 1 (cm)"]').inputValue().catch(() => 'absent'), await s.locator('[aria-label="TAP du moût 1"]').inputValue().catch(() => 'absent')]);
await s.locator('[data-onglet-partenaire="2"]').click(); await page.waitForTimeout(200);
ok('… onglet 2 : son moût, ses 2 documents', (await s.locator('[role=tabpanel] [data-mout]').count()) === 1 && /\(2\)/.test(await s.locator('[data-docs-partenaire="2"] summary').innerText()));
await s.locator('[aria-label="N° de bon / DAE du partenaire 2"]').fill('DAE-T67-2B');
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
const tm = await toast(); if (await page.locator('.overlay').count()) { const m = ov().locator('textarea, input[aria-label*="otif"]').first(); if (await m.count()) { await m.fill('Correction du n° de DAE (test)'); await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500); } }
d = await db(); const op2 = d.ops.find((o) => o.id === op.id);
ok('modification enregistrée : n° de bon du partenaire 2 changé, rien d’autre perdu', op2.partenaires[1].ref === 'DAE-T67-2B' && op2.ref === 'BL-T67-1 / DAE-T67-2B' && op2.jaugesCuves.length === 2 && op2.entrees.length === 3 && d.lots.filter((l) => l.opId === op.id).length === 2, [tm, op2.partenaires]);
await fermer();
// 8. retirer un partenaire (nouvelle saisie) : ses moûts partent, confirmation demandée
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await avance(); await page.locator('.pitem', { hasText: 'Cuve 02' }).first().click({ button: 'right' }); await page.waitForTimeout(250);
await page.locator('[role=menuitem]', { hasText: /moût/i }).first().click(); await page.waitForTimeout(400); s = ov();
await s.locator('[data-ajouter-partenaire]').click(); await page.waitForTimeout(200);
await s.locator('[aria-label="Volume vers la cuve 1 du moût 2"]').fill('3');
await pick(page, s.locator('input[aria-label="Cuve de destination 1 du moût 2"]'), 'Cuve 02', 'Cuve 02');
await s.locator('[data-retirer-partenaire]').click(); await page.waitForTimeout(250);
const conf = await txt(ov()); await ov().locator('button', { hasText: /^Retirer$/ }).click(); await page.waitForTimeout(250); s = ov();
ok('retirer un partenaire : confirmation, onglet et moûts retirés', /Retirer ce partenaire/.test(conf) && (await s.locator('[data-onglets-partenaires] [role=tab]').count()) === 1 && (await s.locator('[data-mout]').count()) === 1, conf.slice(0, 200));
await fermer(); await page.waitForTimeout(200); await fermer();
// 9. anglais
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1500);
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await avance(); await page.locator('.pitem', { hasText: 'Cuve 03' }).first().click({ button: 'right' }); await page.waitForTimeout(250);
await page.locator('[role=menuitem]').filter({ hasText: /must/i }).first().click(); await page.waitForTimeout(500); s = ov();
await s.locator('[aria-label="Height in tank 1 of must 1 (cm)"], [aria-label="Hauteur en cuve 1 du moût 1 (cm)"]').first().fill('120'); await page.waitForTimeout(300);
t = await txt(s);
ok('anglais : onglets partenaires, épalement, analyses imposées', /Partners in the tanker \(1\)/i.test(t) && /Partner no\. 1/.test(t) && /\+ Partner/.test(t) && /Height after receipt \(cm\)/i.test(t) && /in tank − .* already there = .* received/.test(t) && /Analyses of received lots/.test(t), t.slice(t.indexOf('Partner no'), t.indexOf('Partner no') + 1500));
await page.screenshot({ path: SC + '/shots/t67-en.png', fullPage: true });
await fermer();
await browser.close();
// 10. téléphone : pas de débordement horizontal
const tel = await open({ init, viewport: { width: 390, height: 844 }, mobile: true, date: '2026-11-26T10:00:00' }); const pg = tel.page;
await pg.click('#tab-cuverie').catch(() => {}); await pg.waitForTimeout(300);
await pg.locator('.pitem', { hasText: 'Cuve 03' }).first().click({ button: 'right' }); await pg.waitForTimeout(250);
await pg.locator('[role=menuitem]', { hasText: /moût/i }).first().click(); await pg.waitForTimeout(400);
await pg.locator('.overlay').last().locator('[data-ajouter-partenaire]').click(); await pg.waitForTimeout(200);
const deb = await pg.evaluate(() => { const o = document.querySelector('.overlay:last-of-type .sheet') || document.querySelector('.overlay .sheet') || document.body; return Math.max(0, o.scrollWidth - o.clientWidth); });
ok('téléphone : entrée de moûts à deux onglets sans débordement horizontal', deb <= 1, deb);
await pg.screenshot({ path: SC + '/shots/t67-telephone.png', fullPage: true });
await tel.browser.close();
const errs = [...errors, ...tel.errors];
console.log('ERREURS:', errs.length ? errs.join('\n') : 'aucune');
console.log(ko || errs.length ? `t67 : ${ko} ÉCHEC(S)` : 't67 : TOUT PASSE (entrée de moûts : analyses imposées, épalement, plusieurs partenaires par citerne)');
process.exitCode = ko || errs.length ? 1 : 0;
