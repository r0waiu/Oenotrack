// 0.43.0-alpha.2 (remplace le test des schémas 0.31.0-alpha.1) : à la création d'un lot (marc validé au pressoir), les étapes du plan de
// vinification retenu sont proposées dans l'ordre du tableau, sans jours ; opérations à réaliser créées en un clic (« Étape n / m », jamais
// en retard), validation d'une étape, fiche du lot (étapes, impression, retrait), réglage de proposition, « Appliquer le plan… » depuis la
// fiche d'un lot. Données fictives (jeu d'exemple).
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 600) : ''); };
const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const ov = () => page.locator('.overlay').last();
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const sub = async (t) => { await page.locator('[data-pressoir] [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(250); };
const sous = async (t) => { await page.locator('main [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(350); };
const fermer = async () => { for (let i = 0; i < 5 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
const feuille = () => page.locator('[data-plan-feuille]');
async function peserEtPresser(heure, cuveC, cuveT, valider = true) {
  await page.click('#tab-pressoir'); await page.waitForTimeout(400);
  await page.locator('[aria-label="Année des vendanges"]').selectOption('2026'); await page.waitForTimeout(250);
  await sub('Pesées'); await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300);
  let f = ov(); await f.locator('[data-heure]').fill(heure);
  await pick(page, f.locator('input[aria-label="Partenaire"]').first(), 'Lefèvre');
  await pick(page, f.locator('input[placeholder^="Cru (village)"]').first(), 'Cramant');
  await f.locator('[data-brut]').fill('4300'); await f.locator('[data-tare]').fill('300'); await page.waitForTimeout(150);
  await f.locator('.sheet-f .btn-primary', { hasText: 'Peser et valider' }).click(); await page.waitForTimeout(500);
  await ov().locator('.sheet-f .btn', { hasText: 'Fermer' }).click(); await page.waitForTimeout(250);
  await sub('Pressurages'); await page.locator('[data-nouveau-marc]').click(); await page.waitForTimeout(300); f = ov();
  await f.locator('[data-heure-debut]').fill(heure); await f.locator('[data-remplir]').click(); await page.waitForTimeout(200);
  await f.locator('input[aria-label="Volume Cuvée"]').fill('20,5'); await pick(page, f.locator('input[aria-label="Cuve Cuvée"]'), cuveC);
  await f.locator('input[aria-label="Volume Taille"]').fill('5'); await pick(page, f.locator('input[aria-label="Cuve Taille"]'), cuveT);
  await f.locator('[data-tavp]').fill('10,2'); await f.locator('input[aria-label="Bourbes"]').fill('0,6'); await page.waitForTimeout(300);
  if (valider) await f.locator('[data-valider-marc]').click(); else await f.locator('.sheet-f .btn-primary').last().click();
  await page.waitForTimeout(900);
}
// 1. marc validé : étapes du plan proposées aux deux lots créés
await peserEtPresser('08:05', 'Bac D1', 'Bac D2');
ok('marc validé : feuille « Étapes du plan de vinification » ouverte', (await feuille().count()) === 1 && /Étapes du plan de vinification/.test(await txt(ov())));
const lotsF = await page.locator('[data-plan-lot]').count();
const choix = await page.locator('[data-plan-lot] select[aria-label^="Plan du lot"]').evaluateAll((L) => L.map((s) => s.options[s.selectedIndex].text));
ok('… deux lots (cuvée, 1re taille), plan retenu présélectionné', lotsF === 2 && choix.every((c) => /Vinification en blanc \(retenu\)/.test(c)), choix);
let t = await txt(feuille());
ok('… étapes dans l’ordre du tableau, sans jour (pas de « J+ »), doses de la colonne du lot, quantités pour le volume', /Sulfitage/.test(t) && /Enzymage/.test(t) && !/J\+/.test(t) && /5 g\/hL/.test(t), t.slice(0, 700));
const grp = await page.locator('[data-plan-lot]').first().locator('select[aria-label^="Groupe de cépages du lot"]').evaluate((s) => s.options[s.selectedIndex].text);
ok('… colonne du lot trouvée (Chardonnay → « Cépage blanc », Conventionnel, Cuvée)', /Cépage blanc/.test(grp), grp);
const btn = ov().locator('.sheet-f .btn-primary'); const n0 = Number(((await btn.innerText()).match(/\((\d+)\)/) || [])[1]);
await page.locator('[data-plan-lot]').nth(1).locator('input[aria-label="Retenir l’étape Enzymage"]').uncheck(); await page.waitForTimeout(200);
const n1 = Number(((await btn.innerText()).match(/\((\d+)\)/) || [])[1]);
ok('étape décochée : une opération de moins', n0 > 4 && n1 === n0 - 1, [n0, n1]);
await page.screenshot({ path: SC + '/shots/t63-feuille.png' });
await btn.click(); await page.waitForTimeout(700);
let d = await db(); const pv = (d.previsions || []).filter((p) => p.schema && p.schema.plan); const lotC = d.lots.find((l) => l.code === 'P26-06-C');
ok('opérations à réaliser créées : sans date, dans l’ordre (ordre 1…n), liées au plan et à la colonne', pv.length === n1 && pv.every((p) => p.sansDate && p.statut === 'prevue' && p.plan && p.plan.colonne) && pv.filter((p) => p.schema.lotId === lotC.id).map((p) => p.ordre).join() === pv.filter((p) => p.schema.lotId === lotC.id).map((p, i) => i + 1).join());
const sulf = pv.find((p) => p.schema.lotId === lotC.id && p.f && p.f.sousType === 'sulfitage'); const enz = pv.find((p) => p.schema.lotId === lotC.id && p.f && p.f.sousType === 'enzymage'); // 0.47.0-alpha.2 : dose du sulfitage en SO₂ (pas de quantité de produit déduite) : l'enzymage est validé
ok('… sulfitage : opération du catalogue, produit en stock et quantité prévus, consigne (étape, produit, dose)', sulf && sulf.type === 'intrant' && sulf.f.lignes && sulf.f.lignes[0].produitId && /Sulfitage/.test(sulf.notes) && /5 g\/hL/.test(sulf.notes), sulf);
// 2. « À réaliser » : étapes « n / m », pastille du plan, jamais en retard
await page.click('#tab-previsions'); await page.waitForTimeout(500);
t = await txt(page.locator('main'));
ok('« À réaliser » : « Étape 1 / n », pastille « plan de vinification », aucun retard', /Étape 1 \/ \d+/.test(t) && (await page.locator('main [data-schema-chip]').count()) >= n1 && /plan de vinification/.test(t) && !/en retard/.test(t), t.slice(0, 500));
await page.locator('main tbody tr', { hasText: 'Enzymage · P26-06-C' }).first().locator('button:has-text("Valider…")').click(); await page.waitForTimeout(500);
await ov().locator('.sheet-f button:text-is("✓ Valider")').click(); await page.waitForTimeout(600);
d = await db(); const opS = d.ops.find((o) => o.schema && o.schema.lotId === lotC.id); const pS1 = d.previsions.find((p) => p.id === enz.id);
ok('étape validée : opération enregistrée avec la marque du plan, étape réalisée', !!opS && opS.sousType === 'enzymage' && pS1.statut === 'realisee', [opS && opS.schema]);
// 3. fiche du lot : étapes n / m, impression sans jour, retrait
await page.click('#tab-cuverie'); await page.waitForTimeout(400); await sous('Cartes');
await page.locator('.tankcard', { hasText: 'Bac D1' }).first().click(); await page.waitForTimeout(500);
await ov().locator('[data-rubrique=lots] table .linkish').first().click(); await page.waitForTimeout(600);
const bloc = ov().locator('[data-schema-bloc]'); t = await txt(bloc);
ok('fiche du lot : plan appliqué (🗂, nom, 1 étape validée, colonne « Étape », pas de J+)', /Vinification en blanc/.test(t) && /1 \/ \d+ étape\(s\) validée\(s\)/.test(t) && /Étape/i.test(t) && !/J\+/.test(t), t.slice(0, 400));
await bloc.locator('button', { hasText: '🖨 Imprimer…' }).click(); await page.waitForTimeout(500);
t = await txt(ov()); ok('impression du plan du lot : étapes numérotées, sans jour', /Étape n° 1/i.test(t) && !/J\+/.test(t), t.slice(0, 300));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await bloc.locator('button', { hasText: 'Retirer les étapes à réaliser' }).click(); await page.waitForTimeout(300);
await page.locator('.overlay').last().locator('button', { hasText: /^Retirer$/ }).click(); await page.waitForTimeout(500);
d = await db(); ok('étapes à réaliser retirées : l’étape validée reste', d.previsions.filter((p) => p.schema && p.schema.lotId === lotC.id).length === 1);
await fermer();
// 4. réglage (page du plan) : plus de proposition
await page.click('#tab-plan'); await page.waitForTimeout(500);
await page.locator('[data-planv-proposer] input[type=checkbox]').uncheck(); await page.waitForTimeout(300);
d = await db(); ok('réglage décoché sur la page du plan : enregistré (commun à l’équipe)', d.settings.schemas && d.settings.schemas.proposer === false);
await peserEtPresser('10:15', 'Cuve 02', 'Bac T', false);
await fermer();
await page.locator('main tr', { hasText: 'P26-07' }).first().locator('button', { hasText: /^Valider$/ }).click().catch(() => {}); await page.waitForTimeout(700);
ok('réglage décoché : marc validé sans proposition', !(await feuille().count()));
// 5. « Appliquer le plan de vinification… » depuis la fiche d'un lot sans plan
await page.click('#tab-cuverie'); await page.waitForTimeout(400); await sous('Cartes');
await page.locator('.tankcard', { hasText: 'Cuve 02' }).first().click(); await page.waitForTimeout(500);
await ov().locator('[data-rubrique=lots] table .linkish').first().click(); await page.waitForTimeout(600);
const bloc2 = ov().locator('[data-schema-bloc]');
ok('lot sans plan : « Aucun plan de vinification appliqué » et bouton', /Aucun plan de vinification appliqué à ce lot/.test(await txt(bloc2)) && (await bloc2.locator('button', { hasText: 'Appliquer le plan de vinification' }).count()) === 1);
await bloc2.locator('button', { hasText: 'Appliquer le plan de vinification' }).click(); await page.waitForTimeout(600);
ok('… feuille ouverte pour ce lot seul', (await page.locator('[data-plan-lot]').count()) === 1);
await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
d = await db(); const lot7 = d.lots.find((l) => l.code === 'P26-07-C');
ok('… opérations à réaliser créées pour ce lot, sans date', d.previsions.filter((p) => p.schema && p.schema.lotId === lot7.id).every((p) => p.sansDate) && d.previsions.filter((p) => p.schema && p.schema.lotId === lot7.id).length > 4);
await fermer();
ok('aucune erreur dans la page', errors.length === 0, errors);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t63)'); process.exitCode = ko ? 1 : 0;
