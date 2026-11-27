// 0.14.0-alpha.1 : vue des contenants (contour / intérieur couleur + motif), partenaires (rôles, crus par défaut, plusieurs par compartiment),
// n° de lot et analyses des moûts reçus (moyennes, enrichissement), pré-remplis personnalisés des fiches, documents joints dès la saisie
import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗', name, x !== undefined ? `→ ${String(x).replace(/\s+/g, ' ').slice(0, 220)}` : ''); };
const { browser, page, errors } = await open();
const toast = async () => page.locator('.toast').innerText().catch(() => '');
const sheet = () => page.locator('.overlay').last();
const dbLS = async () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));

// 0. en-tête : plus de boutons « Exporter les registres » / « Rapports », rapports dans Traçabilité
ok('en-tête sans « Exporter les registres » ni « Rapports »', (await page.locator('header button', { hasText: /Exporter les registres|Rapports/ }).count()) === 0);
await page.click('#tab-trace'); await page.waitForTimeout(300);
await page.locator('main button', { hasText: 'Rapports' }).first().click(); await page.waitForTimeout(300);
ok('Traçabilité › Rapports imprimables', (await page.locator('main').innerText()).includes('Rapport de lots'));

// 1. vue de la cuverie : contour = revendications, intérieur = cépages + motif fractions
await page.click('#tab-cuverie'); await page.waitForTimeout(400);
const vue = page.locator('main select[aria-label="Ce que montre le contour des contenants"]');
ok('choix du contour : 8 critères', (await vue.locator('option').count()) >= 8, await vue.locator('option').allInnerTexts());
await vue.selectOption('qualif');
await page.locator('main select[aria-label="Couleur de l’intérieur des contenants"]').selectOption('cepage');
await page.locator('main select[aria-label="Motif de l’intérieur des contenants"]').selectOption('fraction'); await page.waitForTimeout(400);
const leg = await page.locator('main [data-legende="plan"]').innerText();
ok('légende : contour revendications, intérieur cépages, motifs des fractions', /Revendication|Conventionnel/i.test(leg) && /Chardonnay/.test(leg) && /Cuvée/.test(leg) && /taille/i.test(leg), leg.slice(0, 200));
ok('motifs dessinés dans les contenants', (await page.locator('main svg pattern').count()) > 0 && (await page.locator('main [data-motif]').count()) >= 2);
await page.screenshot({ path: SH + '/t33-vue.png' });
const ap = (await dbLS()).apparence;
ok('réglage enregistré (contour qualif, intérieur cépage, motif fraction)', ap.contourMode === 'qualif' && ap.interieurMode === 'cepage' && ap.interieurMotif === 'fraction', JSON.stringify({ c: ap.contourMode, i: ap.interieurMode, m: ap.interieurMotif }));

// 2. partenaires : rôles et crus par défaut
await page.click('#tab-params'); await page.waitForTimeout(300);
await page.locator('main button', { hasText: 'Partenaires' }).first().click(); await page.waitForTimeout(400);
const tP = await page.locator('main').innerText();
ok('Paramètres › Partenaires : rôles et crus par défaut affichés', tP.includes('vendeur de vins') && tP.includes('Maison Dubois') && tP.includes('Cramant'), tP.slice(0, 300));
await page.locator('main tr', { hasText: 'EARL Marchand' }).first().locator('td').first().click(); await page.waitForTimeout(300);
let s = sheet();
await pick(page, s.locator('input[aria-label="Cru (village)"]'), 'Bouz', 'Bouzy');
await s.locator('label', { hasText: 'Proposer automatiquement' }).locator('input[type=checkbox]').check();
await s.locator('label', { hasText: 'Vendeur de vins' }).locator('input[type=checkbox]').check();
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(300);
const em = (await dbLS()).apporteurs.find((a) => a.nom === 'EARL Marchand');
ok('partenaire modifié : vendeur de vins, cru par défaut Bouzy appliqué d’office', em.vendeur === true && em.apporteur === true && em.crusDefaut.length === 1 && em.cruAuto === true, JSON.stringify(em));

// 3. entrée de moûts : deux partenaires sur un compartiment, n° de lot, analyses, moyenne et enrichissement
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await page.locator('.pitem', { hasText: 'Bac D1' }).first().click({ button: 'right' }); await page.waitForTimeout(250);
await page.locator('[role=menuitem]', { hasText: /moût/i }).first().click(); await page.waitForTimeout(400);
s = sheet();
await s.locator('[aria-label="Compartiment du moût 1"]').fill('C1');
await pick(page, s.locator('input[aria-label="Partenaire du moût 1"]'), 'EARL', 'EARL Marchand'); await page.waitForTimeout(200);
const cru1 = await s.locator('input[aria-label="Cru (village)"]').nth(0).inputValue();
ok('cru par défaut du partenaire appliqué d’office', /Bouzy/.test(cru1), cru1);
await pick(page, s.locator('input[aria-label="Partenaire du moût 1"]'), 'Lefè', 'Lefèvre');
await s.locator('[aria-label="Part de EARL Marchand (moût 1)"]').fill('70');
await s.locator('[aria-label="Part de Lefèvre Père & Fils (moût 1)"]').fill('30');
ok('crus des partenaires proposés (Cramant)', (await s.locator('text=Crus des partenaires').count()) === 1 && (await s.locator('button.chip', { hasText: 'Cramant' }).count()) >= 1);
await s.locator('[aria-label="Volume vers la cuve 1 du moût 1"]').fill('10');
await s.locator('[aria-label="N° de lot du moût 1"]').fill('LOT-A');
// 0.34.0-alpha.1 : analyses « Moût · Débourbage » affichées directement (plus de section repliée)
await s.locator('[aria-label="TAP du moût 1"]').fill('9,6');
await s.locator('[aria-label="AT du moût 1"]').fill('8');
// moût 2 : un seul partenaire, autre n° de lot, vers la même cuve
await s.locator('button:has-text("+ Ajouter un moût")').click(); await page.waitForTimeout(150);
await s.locator('[aria-label="Compartiment du moût 2"]').fill('C2');
await s.locator('[aria-label="Cépage du moût 2"]').selectOption({ label: 'Pinot Noir' });
await pick(page, s.locator('input[aria-label="Partenaire du moût 2"]'), 'Henn', 'Domaine Hennequin');
await pick(page, s.locator('input[aria-label="Cuve de destination 1 du moût 2"]'), 'Bac D1', 'Bac D1');
await s.locator('[aria-label="Volume vers la cuve 1 du moût 2"]').fill('5');
await s.locator('[aria-label="N° de lot du moût 2"]').fill('LOT-A');
// (analyses du moût 2 affichées directement)
await s.locator('[aria-label="TAP du moût 2"]').fill('10,2'); await page.waitForTimeout(300);
const moy = await s.locator('[data-moyennes]').first().innerText().catch(() => '');
ok('moyenne pondérée par cuve dans « Lots créés » (TAP 9,8)', /TAP 9,8/.test(moy) && /Enrichissement|enrichissement/.test(moy), moy);
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('n° de lot en double refusé', /même n° de lot/.test(await toast()), await toast());
await s.locator('[aria-label="N° de lot du moût 2"]').fill('LOT-B');
// documents joints dès la saisie
await s.locator('input[type=file][aria-label="Fichiers à joindre"]').setInputFiles([{ name: 'bon-livraison.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') }, { name: 'bulletin.txt', mimeType: 'text/plain', buffer: Buffer.from('TAP 9,6') }]);
await page.waitForTimeout(500);
ok('documents en attente listés dans le formulaire', (await s.locator('[data-docs-attente] li').count()) === 2);
await page.screenshot({ path: SH + '/t33-mout.png', fullPage: true });
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
const tv = await toast();
ok('entrée validée avec 2 documents joints', /validée/.test(tv) && /2 documents joints/.test(tv), tv);
// 0.31.0-alpha.1 : un schéma de vinification est proposé aux lots créés → « Plus tard »
ok('schéma de vinification proposé aux lots créés (0.31.0-alpha.1), remis à plus tard', (await page.locator('[data-plan-feuille]').count()) === 1);
if (await page.locator('[data-plan-feuille]').count()) { await page.locator('.overlay').last().locator('.sheet-f button', { hasText: 'Plus tard' }).click(); await page.waitForTimeout(300); }
const d1 = await dbLS(); const op1 = d1.ops.filter((o) => o.type === 'entree_mout').pop();
ok('opération : partenaires et parts, n° de lot, analyses, copie des compartiments', op1.entrees[0].apporteurs.length === 2 && op1.entrees[0].apporteurs[0].pct === 70 && op1.entrees[0].numLot === 'LOT-A' && op1.entrees[0].analyses.tap === 9.6 && op1.entreesExtra.length === 2 && op1.entreesExtra[1].numLot === 'LOT-B', JSON.stringify(op1.entrees[0]));
ok('documents rattachés à l’opération validée', d1.docs.filter((x) => x.cible.type === 'op' && x.cible.id === op1.id).length === 2);
// fiche de la cuve : lots reçus, moyenne, enrichissement
await page.locator('.pitem', { hasText: 'Bac D1' }).first().click(); await page.waitForTimeout(400);
const fc = await sheet().innerText();
ok('fiche cuve : moûts reçus (n° de lot, partenaires), moyenne et enrichissement', fc.includes('Moûts reçus') && fc.includes('LOT-A') && fc.includes('EARL Marchand (70 %)') && /TAP 9,8/.test(fc) && /kg de sucre/.test(fc), fc.slice(fc.indexOf('Moûts reçus'), fc.indexOf('Moûts reçus') + 300));
await page.screenshot({ path: SH + '/t33-cuve.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// module Analyses : analyses des moûts reçus
await page.click('#tab-analyses'); await page.waitForTimeout(300);
const ta = await page.locator('main').innerText();
ok('Analyses : tableau des analyses des moûts reçus', ta.includes('Analyses des moûts reçus') && ta.includes('LOT-B') && ta.includes('L2609-114-3'));

// 4. formulaire abandonné : fichiers joints effacés ; planifiée → documents sur l'opération à réaliser
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.click('main button:text-is("Soutirage")'); await page.waitForTimeout(400); s = sheet();
await s.locator('input[type=file][aria-label="Fichiers à joindre"]').setInputFiles([{ name: 'abandon.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF x') }]); await page.waitForTimeout(400);
const nAvant = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('oenotrack-docs', 1); r.onsuccess = () => { const q = r.result.transaction('fichiers').objectStore('fichiers').getAllKeys(); q.onsuccess = () => res(q.result.length); }; }));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
if (await page.locator('[role=alertdialog]').count()) { await page.locator('[role=alertdialog] button', { hasText: /Fermer|Quitter|Abandonner|Oui/ }).first().click(); await page.waitForTimeout(300); }
const nApres = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('oenotrack-docs', 1); r.onsuccess = () => { const q = r.result.transaction('fichiers').objectStore('fichiers').getAllKeys(); q.onsuccess = () => res(q.result.length); }; }));
ok('formulaire fermé sans enregistrer : fichier joint effacé', nApres === nAvant - 1, `${nAvant} → ${nApres}`);
await page.click('main button:text-is("Soutirage")'); await page.waitForTimeout(400); s = sheet();
await s.locator('input[type=file][aria-label="Fichiers à joindre"]').setInputFiles([{ name: 'consigne.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF y') }]); await page.waitForTimeout(400);
await s.locator('button', { hasText: 'Planifier' }).click(); await page.waitForTimeout(500);
ok('planifiée avec son document', /planifiée/.test(await toast()) && /1 document joint/.test(await toast()), await toast());
const d2 = await dbLS(); const pv = d2.previsions.filter((p) => p.statut === 'prevue').pop();
ok('document rattaché à l’opération à réaliser', d2.docs.some((x) => x.cible.type === 'prev' && x.cible.id === pv.id && x.nom === 'consigne.pdf'));
await page.click('#tab-previsions'); await page.waitForTimeout(300);
const rowP = page.locator('main tbody tr').filter({ has: page.locator('button[aria-label^="Documents"]', { hasText: '📎 1' }) }).first();
ok('À réaliser : bouton 📎 1 sur la ligne', (await rowP.count()) === 1);
await rowP.locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400);
ok('opération à réaliser ouverte : document visible (joint à l’opération à réaliser)', (await sheet().innerText()).includes('consigne.pdf') && (await sheet().innerText()).includes('passent sur l’opération'));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// 5. fiche « Réception de moûts » : pré-rempli personnalisé (partenaire · fraction · cépage · cru · millésime)
await page.locator('main button', { hasText: 'Modèles de fiches' }).click(); await page.waitForTimeout(300);
await page.locator('main tr, main .card', { hasText: /Réception de moûts/ }).first().locator('button', { hasText: /Modifier|Personnaliser/ }).first().click(); await page.waitForTimeout(400);
s = sheet();
const selOrig = s.locator('select[aria-label="Contenu de la colonne"]').filter({ has: page.locator('option[value="origine"]:checked') }).first();
ok('colonne « origine » trouvée', (await selOrig.count()) === 1);
ok('données supplémentaires proposées (N° de lot, Partenaire(s), Analyses)', (await selOrig.locator('option', { hasText: 'Pré-rempli : Partenaire(s)' }).count()) === 1 && (await selOrig.locator('option', { hasText: 'Pré-rempli : N° de lot' }).count()) === 1 && (await selOrig.locator('option', { hasText: 'Analyses du lot' }).count()) === 1);
await selOrig.selectOption('__perso'); await page.waitForTimeout(300);
const dlg = sheet();
for (const l of ['Partenaire(s)', 'Fraction', 'Cépage', 'Cru (village)', 'Millésime']) await dlg.locator('label', { hasText: new RegExp(`^${l.replace(/[()]/g, '\\$&')}$`) }).locator('input').check();
ok('aperçu de l’ordre', (await dlg.innerText()).includes('« Partenaire(s) · Fraction · Cépage · Cru (village) · Millésime »'));
await dlg.locator('button[aria-label="Monter Fraction"]').click(); await page.waitForTimeout(100);
ok('ordre modifiable', (await dlg.innerText()).includes('« Fraction · Partenaire(s) · Cépage'));
await dlg.locator('button[aria-label="Descendre Fraction"]').click();
await dlg.locator('button', { hasText: 'Utiliser ce pré-rempli' }).click(); await page.waitForTimeout(300);
s = sheet();
ok('colonne : « Personnalisé : Partenaire(s) · Fraction · … »', (await s.locator('select[aria-label="Contenu de la colonne"] option:checked', { hasText: 'Personnalisé : Partenaire(s) · Fraction · Cépage · Cru (village) · Millésime' }).count()) === 1);
await page.screenshot({ path: SH + '/t33-fiche-modele.png' });
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
const mf = (await dbLS()).modelesFiches.find((m) => /Réception/.test(m.titre)); const colsTxt = mf.tableaux.map((t) => t.cols).join('\n');
ok('modèle enregistré avec {x_partenaires_fraction_cepage_cru_millesime}', colsTxt.includes('{x_partenaires_fraction_cepage_cru_millesime}'), colsTxt.slice(0, 200));
// impression de la fiche de l'entrée d'exemple : la colonne contient le partenaire
await page.click('#tab-ops'); await page.waitForTimeout(300);
const rowM = page.locator('main tr', { hasText: 'GH-482-KT' }).first();
await rowM.locator('button[title*="iche"], button:has-text("🖨")').first().click(); await page.waitForTimeout(600);
const fi = await page.locator('.overlay').last().innerText();
ok('fiche imprimée : « Maison Dubois (60 %), Lefèvre Père & Fils (40 %) · 1ère taille · Pinot Noir · Mareuil-sur-Ay · 2026 »', fi.includes('Maison Dubois (60 %), Lefèvre Père & Fils (40 %) · 1ère taille · Pinot Noir · Mareuil-sur-Ay · 2026'), fi.slice(fi.indexOf('C3'), fi.indexOf('C3') + 200));
await page.screenshot({ path: SH + '/t33-fiche.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);

// 6. entrée de vin (vendeur de vins)
await page.click('#tab-ops'); await page.waitForTimeout(300);
const bv = page.locator('main button:text-is("Entrée de vin")');
ok('opération « Entrée de vin » au catalogue', (await bv.count()) === 1);
await bv.click(); await page.waitForTimeout(400); s = sheet();
const tVin = await s.innerText();
ok('entrée de vin : partenaire vendeur de vins demandé', /Partenaire|vendeur/i.test(tVin));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);

// 7. téléphone : formulaire d'entrée de moûts sans débordement
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(200);
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.locator('main button:text-is("Entrée de moûts")').first().click(); await page.waitForTimeout(400);
const ov = await page.evaluate(() => { const o = document.querySelector('.overlay:last-of-type .sheet') || document.querySelector('.overlay:last-of-type'); return Math.max(document.documentElement.scrollWidth - window.innerWidth, o ? o.scrollWidth - o.clientWidth : 0); });
ok('téléphone : entrée de moûts sans débordement horizontal', ov <= 1, ov);
await page.screenshot({ path: SH + '/t33-mobile.png' });
console.log('ERREURS:', errors.join(' | ') || 'aucune'); if (errors.length) ko++;
await browser.close();
console.log(ko ? `${ko} ÉCHEC(S)` : 'T33 OK');
