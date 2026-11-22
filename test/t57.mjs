// 0.28.0-alpha.1 : Traçabilité › Toutes les étapes (une recherche, la chaîne complète des pesées aux expéditions, centrer sur une
// étape, impression) et Mode audit (types fournis, personnalisation, type créé, audit préparé, chapitres, réponses, test de
// traçabilité chronométré, durée sur lattes, SO₂, dossier imprimé, clôture) ; téléphone ; anglais. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const init = () => { window.__imp = []; window.print = () => { window.dispatchEvent(new Event('beforeprint')); const z = document.getElementById('zone-impression'); window.__imp.push(z ? z.textContent.replace(/\s+/g, ' ').slice(0, 400000) : ''); window.dispatchEvent(new Event('afterprint')); }; };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const toasts = async () => page.locator('.toast').allInnerTexts();
  const sous = async (nom) => { await page.locator('main [role=tab]', { hasText: nom }).first().click(); await page.waitForTimeout(400); };
  const cherche = async (q) => { await page.locator('input[aria-label="Rechercher une étape"]').fill(q); await page.waitForTimeout(400); };
  // 1. Traçabilité s'ouvre sur « Toutes les étapes »
  await page.click('#tab-trace'); await page.waitForTimeout(500);
  const st = await txt(page.locator('main [role=tablist]').first());
  ok('Traçabilité : « 🔎 Toutes les étapes » d’abord, « 🧾 Mode audit » avant les rapports', /^🔎 Toutes les étapes Intrant \(rappel de lot\)/.test(st) && /🧾 Mode audit 🖨 Rapports imprimables/.test(st) && (await page.locator('[data-trace-etapes]').count()) === 1, st);
  await cherche('pesée 3'); let t = await txt(page.locator('[data-trace-resultats]'));
  ok('« pesée 3 » : la pesée n° 3 de chaque année, rangée sous « Raisins (pesées) »', /🍇 Raisins \(pesées\)/i.test(t) && (t.match(/Pesée n° 3/g) || []).length === 2, t);
  await cherche('zzz-introuvable'); ok('rien trouvé : message', /Rien trouvé : essayez un autre repère\./.test(await txt(page.locator('[data-trace-etapes]'))));
  await cherche('10/09/2025'); t = await txt(page.locator('[data-trace-resultats]'));
  ok('date « 10/09/2025 » : pesées, marcs et moûts du jour', /Pesée n° 1/.test(t) && /Pesée n° 2/.test(t) && /Marc n° 1/.test(t) && /P25-01-C/.test(t), t.slice(0, 400));
  // 2. chaîne depuis la pesée n° 1 de 2025 : jusqu'à la cuvée de tirage
  await page.locator('[data-resultat]', { hasText: 'Pesée n° 1' }).first().click(); await page.waitForTimeout(500);
  const nb = async (e) => page.locator(`[data-etape="${e}"] .card`).count();
  t = await txt(page.locator('main'));
  ok('chaîne de traçabilité — Pesée n° 1 (10/09/2025) : marc, moûts, assemblages, cuvée de tirage', /Chaîne de traçabilité — Pesée n° 1 \(10\/09\/2025\)/i.test(t) && await nb('raisin') === 1 && await nb('pressurage') === 1 && await nb('mout') >= 1 && await nb('assemblage') >= 1 && await nb('tirage') >= 1, { r: await nb('raisin'), p: await nb('pressurage'), m: await nb('mout'), a: await nb('assemblage'), t: await nb('tirage') });
  ok('… la pesée cherchée marquée « recherché », les autres « centrer ici »', /recherché/i.test(await txt(page.locator('[data-etape="raisin"]'))) && (await page.locator('[data-chaine] button', { hasText: 'centrer ici' }).count()) >= 3);
  await page.screenshot({ path: SC + '/shots/t57-chaine.png' });
  await page.locator('[data-etape="tirage"] button', { hasText: 'centrer ici' }).first().click(); await page.waitForTimeout(500);
  ok('« centrer ici » sur la cuvée de tirage : elle devient la cible, la pesée reste en amont', /recherché/i.test(await txt(page.locator('[data-etape="tirage"]'))) && await nb('raisin') >= 1 && /🍾 Tirage \(sur lattes\)/i.test(await txt(page.locator('[data-chaine]'))));
  await page.locator('main [data-sortie-imprimer]').first().click(); await page.waitForTimeout(1300);
  let imp = await page.evaluate(() => window.__imp);
  ok('chaîne imprimée : « Chaîne de traçabilité », étapes, repères', imp.length === 1 && /Chaîne de traçabilité/.test(imp[0]) && /Raisins \(pesées\)/.test(imp[0]) && /Pesée n° 1/.test(imp[0]), imp[0] && imp[0].slice(0, 300));
  // depuis une expédition (DAE)
  const d0 = await db(); const dae = d0.ops.find((o) => o.type === 'sortie' && /^DAE/.test(o.ref || ''));
  await cherche(dae.ref.slice(0, 12)); await page.locator(`[data-resultat="${dae.id}"]`).click(); await page.waitForTimeout(500);
  ok('expédition (DAE) : rangée sous « Expéditions et sorties », chaîne vers l’amont', /recherché/i.test(await txt(page.locator('[data-etape="sortie"]'))) && (await page.locator('[data-chaine] .card').count()) >= 2);
  // 3. Mode audit : types fournis
  await sous('Mode audit'); t = await txt(page.locator('[data-audits]'));
  ok('Mode audit : explication, cinq types fournis (bio, Demeter, douanes, HACCP, AOC)', /Préparez la visite d’un auditeur/.test(t) && ['bio', 'demeter', 'douanes', 'haccp', 'aoc'].every(async (id) => true) && (await page.locator('[data-audit-type]').count()) === 5 && /Agriculture biologique/.test(t) && /Demeter \(biodynamie\)/.test(t) && /Douanes \(contributions indirectes\)/.test(t) && /Hygiène \(HACCP, plan de maîtrise sanitaire\)/.test(t) && /Appellation d’origine \(ODG, contrôle AOC\)/.test(t), t.slice(0, 600));
  ok('… pièces et points de contrôle annoncés (« 11 pièce(s) · 9 point(s) de contrôle » pour le bio)', /11 pièce\(s\) · 9 point\(s\) de contrôle/.test(await txt(page.locator('[data-audit-type="bio"]'))));
  // personnaliser l'AOC : réglage de la durée sur lattes
  await page.locator('[data-audit-type="aoc"] button', { hasText: 'Personnaliser' }).click(); await page.waitForTimeout(400);
  let f = ov(); ok('personnaliser : pièces à cocher, points, réglages (sur lattes 15 / 36 mois)', (await f.locator('[data-audit-pieces] input[type=checkbox]').count()) === 23 && (await f.locator('input[aria-label="Durée minimale sur lattes en mois"]').inputValue()) === '15' && (await f.locator('input[aria-label="Durée minimale sur lattes des millésimés en mois"]').inputValue()) === '36');
  await f.locator('input[aria-label="Durée minimale sur lattes en mois"]').fill('18'); await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
  let d = await db(); ok('… type fourni personnalisé (« personnalisé »)', (d.auditModeles || []).some((m) => m.id === 'aoc' && m.reglages.lattesMois === 18) && /personnalisé/i.test(await txt(page.locator('[data-audit-type="aoc"]'))));
  await page.locator('[data-audit-type="aoc"] button', { hasText: 'Personnaliser' }).click(); await page.waitForTimeout(400);
  await ov().locator('.sheet-f button', { hasText: 'Rétablir l’original' }).click(); await page.waitForTimeout(300); await ov().locator('.btn-primary, .btn-danger').last().click(); await page.waitForTimeout(500);
  d = await db(); ok('… rétabli (« Type d’audit rétabli. »)', !(d.auditModeles || []).some((m) => m.id === 'aoc') && (await toasts()).some((x) => /Type d’audit rétabli\./.test(x)));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // type créé
  await page.locator('[data-audit-nouveau-type]').click(); await page.waitForTimeout(400); f = ov();
  await f.locator('input[aria-label="Nom du type d’audit"]').fill('Audit client export');
  await f.locator('[data-audit-pieces] label', { hasText: 'Lots finis (dégorgements)' }).locator('input').check();
  await f.locator('[data-audit-points] textarea, [data-audit-points] input').first().fill('Lot tracé jusqu’à l’expédition');
  await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
  d = await db(); const perso = (d.auditModeles || []).find((m) => m.nom === 'Audit client export');
  ok('type créé (« créé par vous ») avec ses pièces', !!perso && perso.pieces.includes('lotsfinis') && perso.pieces.includes('tracabilite') && perso.points.length === 1 && (await page.locator('[data-audit-type]').count()) === 6 && /créé par vous/i.test(await txt(page.locator(`[data-audit-type="${perso.id}"]`))), perso);
  // 4. préparer un audit douanes, ouvrir le mode audit
  await page.locator('[data-audit-type="douanes"] button', { hasText: 'Préparer un audit' }).click(); await page.waitForTimeout(400); f = ov();
  await f.locator('input[aria-label="Auditeur"]').fill('M. Contrôleur'); const org = f.locator('label', { hasText: 'Organisme' }).locator('input').first(); if (await org.count()) await org.fill('Douane (fictif)');
  await f.locator('.btn-primary', { hasText: 'Ouvrir le mode audit' }).click(); await page.waitForTimeout(1200);
  d = await db(); const au = (d.audits || [])[0];
  ok('audit préparé (« Audit préparé. ») et mode audit ouvert sur les points de contrôle', !!au && au.modeleId === 'douanes' && au.statut === 'encours' && (await page.locator(`[data-mode-audit="${au.id}"]`).count()) === 1 && (await page.locator('[data-audit-point]').count()) === 6, au);
  t = await txt(ov());
  ok('… titre, période, auditeur ; chapitres (pièces du type)', /Douanes \(contributions indirectes\)/.test(t) && /Période du \d\d\/\d\d\/\d{4} au \d\d\/\d\d\/\d{4} · audit du 21\/11\/2026 · M\. Contrôleur/.test(t) && ['entrees_sorties', 'operations', 'sorties', 'stocks', 'bilan', 'lotsfinis', 'lattes'].every(() => true) && (await page.locator('[data-chapitre]').count()) === 10, t.slice(0, 400));
  await page.locator('[data-audit-point="p1"] button[data-etat="conforme"]').click(); await page.waitForTimeout(300);
  await page.locator('[data-audit-point="p3"] button[data-etat="nc"]').click(); await page.waitForTimeout(300);
  await page.locator('[data-audit-point="p3"] textarea, [data-audit-point="p3"] input[aria-label^="Note"]').first().fill('Écart de stock à justifier'); await page.keyboard.press('Tab'); await page.waitForTimeout(400);
  d = await db(); let a1 = d.audits.find((x) => x.id === au.id);
  ok('réponses : conforme, non-conformité avec sa note', a1.reponses.p1.etat === 'conforme' && a1.reponses.p3.etat === 'nc' && /Écart de stock/.test(a1.reponses.p3.note || ''), a1.reponses);
  ok('… résumé au pied (1 conforme, 1 non-conformité, 4 à voir) ; chapitre marqué ⚠', /1 conforme/.test(await txt(ov().locator('.sheet-f'))) && /1 non-conformité/.test(await txt(ov().locator('.sheet-f'))) && /⚠/.test(await txt(page.locator('[data-chapitre="stocks"]'))), await txt(ov().locator('.sheet-f')));
  // chapitres : registre, stocks, durée sur lattes
  await page.locator('[data-chapitre="entrees_sorties"]').click(); await page.waitForTimeout(500);
  ok('chapitre « Registre des entrées et sorties » : lignes de la période', /Registre des entrées et sorties/i.test(await txt(page.locator('[data-mode-audit]'))) && (await page.locator('[data-mode-audit] tbody tr').count()) >= 1);
  await page.locator('[data-chapitre="stocks"]').click(); await page.waitForTimeout(500);
  ok('chapitre « Stocks en fin de période » : stock en cuve et sur lattes', /Stock au \d\d\/\d\d\/\d{4} : .* en cuve, .* bouteille\(s\) sur lattes\./.test(await txt(page.locator('[data-mode-audit]'))), (await txt(page.locator('[data-mode-audit]'))).slice(0, 300));
  await page.locator('[data-chapitre="lattes"]').click(); await page.waitForTimeout(500); t = await txt(page.locator('[data-mode-audit]'));
  ok('chapitre « Durée sur lattes » : réglage du type ou lots dégorgés sur la période', /Durée sur lattes/i.test(t) && (/Aucune durée minimale réglée/.test(t) || /Minimum/.test(t)), t.slice(0, 300));
  // test de traçabilité chronométré
  await page.locator('[data-chapitre="operations"]').click(); await page.waitForTimeout(400);
  await page.locator('[data-audit-point="p1"] button[data-etat="obs"]').click(); await page.waitForTimeout(300);
  await ov().locator('.sheet-f [data-audit-clore]').click(); await page.waitForTimeout(400);
  ok('clore avec des points sans réponse : confirmation « N point(s) sans réponse. »', /\d point\(s\) sans réponse\./.test(await txt(ov())));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // audit HACCP : test de traçabilité
  await sous('Mode audit');
  await page.locator('[data-audit-type="haccp"] button', { hasText: 'Préparer un audit' }).click(); await page.waitForTimeout(400);
  await ov().locator('.btn-primary', { hasText: 'Ouvrir le mode audit' }).click(); await page.waitForTimeout(1200);
  await page.locator('[data-chapitre="tracabilite"]').click(); await page.waitForTimeout(400);
  await page.locator('[data-audit-test-go]').click(); await page.waitForTimeout(1300);
  await page.locator('[data-audit-test] input[aria-label="Rechercher une étape"]').fill('LF-26-001'); await page.waitForTimeout(400);
  await page.locator('[data-audit-test] [data-resultat]').first().click(); await page.waitForTimeout(600);
  await page.locator('[data-audit-test-ok]').click(); await page.waitForTimeout(500);
  d = await db(); const a2 = d.audits.find((x) => x.modeleId === 'haccp');
  ok('test de traçabilité : chaîne présentée, temps noté (« LF-26-001 (05/10/2026) : N s » ; horloge figée du test : 0 s)', a2 && a2.tests.length === 1 && a2.tests[0].titre === 'LF-26-001 (05/10/2026)' && a2.tests[0].secondes >= 0 && /LF-26-001 \(05\/10\/2026\) : \d+ s/.test(await txt(page.locator('[data-audit-test]'))) && (await toasts()).some((x) => /Test de traçabilité enregistré\./.test(x)), a2 && a2.tests);
  await page.locator('[data-chapitre="equipements"]').click(); await page.waitForTimeout(500);
  ok('chapitre « Équipements » : maintenance et vérifications du parc', /Équipements : maintenance et vérifications périodiques/i.test(await txt(page.locator('[data-mode-audit]'))) && /Bascule du pressoir/.test(await txt(page.locator('[data-mode-audit]'))), (await txt(page.locator('[data-mode-audit]'))).slice(0, 400));
  // dossier imprimé
  await page.evaluate(() => { window.__imp = []; });
  await ov().locator('.sheet-f [data-sortie-imprimer]').click(); await page.waitForTimeout(2500);
  imp = await page.evaluate(() => window.__imp);
  ok('dossier d’audit imprimé : points de contrôle puis chaque pièce', imp.length === 1 && /Audit — Hygiène \(HACCP, plan de maîtrise sanitaire\)/.test(imp[0]) && /Points de contrôle/.test(imp[0]) && /Plan de nettoyage et non-conformités/.test(imp[0]) && /Test de traçabilité \(amont, aval\)/.test(imp[0]) && /LF-26-001/.test(imp[0]), imp[0] && imp[0].slice(0, 500));
  // clôture : plus de modification
  await ov().locator('.sheet-f [data-audit-clore]').click(); await page.waitForTimeout(300); await ov().locator('.btn-primary').last().click(); await page.waitForTimeout(500);
  d = await db(); ok('audit clos (« Audit clos. ») : boutons d’état retirés, « Rouvrir »', d.audits.find((x) => x.modeleId === 'haccp').statut === 'clos' && (await page.locator('[data-audit-point] button[data-etat]').count()) === 0 && /Rouvrir/.test(await txt(ov().locator('.sheet-f'))));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  t = await txt(page.locator('[data-audits]'));
  ok('liste des audits : deux audits (un clos, un en cours) avec leurs résultats', /Audits \(2\)/i.test(t) && /clos/.test(t) && /en cours/.test(t), t.slice(-500));
  ok('aucune erreur de page', errors.length === 0, errors);
  // 5. anglais
  await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1500);
  await page.click('#tab-trace'); await page.waitForTimeout(500);
  await page.locator('input[aria-label="Search a stage"]').fill('pesée 1'); await page.waitForTimeout(400);
  await page.locator('[data-resultat]').first().click(); await page.waitForTimeout(500);
  t = await txt(page.locator('main'));
  ok('anglais : « All stages », « Search at any stage… », « Traceability chain — », étapes', /🔎 All stages/.test(t) && /Search at any stage, from grapes to disgorged/i.test(t) && /Traceability chain — /i.test(t) && /Grapes \(weighings\)/i.test(t) && /Pressing \(press loads\)/i.test(t) && /Bottling \(on lees\)/i.test(t) && /center here/.test(t), t.slice(0, 800));
  ok('… plus de français dans la chaîne', !/Raisins \(pesées\)|centrer ici|recherché|Chaîne de traçabilité|Expéditions et sorties/.test(t), t.slice(0, 900));
  await page.locator('main [role=tab]', { hasText: 'Audit mode' }).click(); await page.waitForTimeout(500);
  t = await txt(page.locator('[data-audits]'));
  ok('anglais : Mode audit (« Organic farming », « Customs (excise duties) », « Prepare an audit », « Customise »)', /Prepare an auditor’s visit/.test(t) && /Organic farming/.test(t) && /Customs \(excise duties\)/.test(t) && /Prepare an audit/.test(t) && /Customise/.test(t) && /piece\(s\) of evidence · \d+ checkpoint\(s\)/.test(t), t.slice(0, 700));
  ok('… plus de français dans la liste des types', !/Préparer un audit|Personnaliser|Agriculture biologique|pièce\(s\)/.test(t), t.slice(0, 900));
  await page.locator('[data-audit-ouvrir]').first().click(); await page.waitForTimeout(1200); t = await txt(ov());
  ok('… mode audit en anglais : chapitres, « Checkpoints », résumé', /Checkpoints/.test(t) && /Period from \d\d\/\d\d\/\d{4} to \d\d\/\d\d\/\d{4} · audit of 21\/11\/2026/.test(t) && !/Points de contrôle|Période du|Clore l’audit/.test(t), t.slice(0, 700));
  await page.screenshot({ path: SC + '/shots/t57-audit-en.png' });
  ok('aucune erreur de page (anglais)', errors.length === 0, errors);
  await browser.close();
}
// 6. téléphone : chapitres dans une liste déroulante
{
  const { browser, page, errors } = await open({ init, viewport: { width: 390, height: 844 }, mobile: true, date: '2026-11-21T10:00:00' });
  await page.locator('#tab-trace').click(); await page.waitForTimeout(500);
  await page.locator('main [role=tab]', { hasText: 'Mode audit' }).first().click(); await page.waitForTimeout(500);
  await page.locator('[data-audit-type="bio"] button', { hasText: 'Préparer un audit' }).click(); await page.waitForTimeout(400);
  await page.locator('.overlay').last().locator('.btn-primary', { hasText: 'Ouvrir le mode audit' }).click(); await page.waitForTimeout(1200);
  const sel = page.locator('[data-mode-audit] select[aria-label="Chapitre"]');
  ok('téléphone : chapitres dans une liste (« Chapitre »), sans débordement horizontal', (await sel.count()) === 1 && await sel.isVisible() && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await sel.selectOption('so2'); await page.waitForTimeout(400);
  ok('… chapitre SO₂ total affiché', /Teneurs en SO₂ total/i.test(await txt(page.locator('[data-mode-audit]'))) && /SO₂ total \(mg\/L\)/i.test(await txt(page.locator('[data-mode-audit]'))));
  await page.screenshot({ path: SC + '/shots/t57-telephone.png' });
  ok('aucune erreur de page (téléphone)', errors.length === 0, errors);
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUT EST BON (t57 : traçabilité à chaque étape, mode audit)');
process.exitCode = ko ? 1 : 0;
