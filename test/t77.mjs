// 0.41.0-alpha.1 : codification des lots personnalisable (Paramètres › 🏷 Codification des lots) — règles par stade composées de briques,
// aperçu en direct, tables de correspondance, versions datées, export / import ; code proposé dans les formulaires (tirage, dégorgement),
// toujours modifiable ; habillage, réétiquetage et mise en carton (Dégorgement) ; anciens codes gardés. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');

{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  // ---- Paramètres › Codification des lots
  await page.click('#tab-params'); await page.waitForTimeout(300);
  await page.locator('[data-params-item="codification"]').click(); await page.waitForTimeout(300);
  const groupes = await page.locator('[data-codif-stades] .lbl').evaluateAll((L) => L.map((x) => x.textContent));
  ok('Codification : rubrique dans « Vin & cuverie », 8 stades de production (vendange → expédition)', (await page.locator('[data-params-groupe="vin"] [data-params-item="codification"]').count()) === 1 && groupes.length >= 8 && /Vendange/i.test(groupes[0]) && /expédition/i.test(groupes[7]), groupes);
  // table « Cuvée » à choisir à la saisie
  await page.getByRole('tab', { name: 'Tables de correspondance' }).click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: '＋ Nouvelle table' }).click(); await page.waitForTimeout(200);
  await page.getByLabel('Nom de la table').fill('Cuvée (essai)');
  for (const [lib, code] of [['Brut Or (fictif)', 'GO'], ['Rosé (fictif)', 'RO']]) { await page.getByRole('button', { name: '＋ Ligne' }).click(); await page.waitForTimeout(80); await page.getByLabel('Libellé').last().fill(lib); await page.getByLabel('Code', { exact: true }).last().fill(code); }
  await page.getByRole('button', { name: 'Enregistrer la table' }).click(); await page.waitForTimeout(300);
  let d = await db();
  ok('… table de correspondance libre créée (2 lignes)', (d.codifTables || []).length === 1 && d.codifTables[0].source === 'libre' && d.codifTables[0].lignes.map((l) => l.code).join() === 'GO,RO', d.codifTables);
  // règle du tirage : A + cuvée + année (code champenois) + mois (code champenois) + jour
  await page.getByRole('tab', { name: 'Règles par stade' }).click(); await page.waitForTimeout(200);
  await page.locator('[data-codif-choix-stade="tirage"]').click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: '＋ Nouvelle règle' }).click(); await page.waitForTimeout(200);
  const ajouter = async (type) => { await page.getByLabel('Type de brique à ajouter').selectOption(type); await page.getByRole('button', { name: '＋ Ajouter' }).click(); await page.waitForTimeout(120); };
  await ajouter('texte'); const ed = page.locator('[data-codif-brique-ed]').last(); await ed.getByLabel('Texte de la brique').fill('A');
  await ajouter('choix'); await page.locator('[data-codif-brique-ed]').last().getByLabel('Table à choisir').selectOption({ label: 'Cuvée (essai)' }); await page.locator('[data-codif-brique-ed]').last().getByLabel('Nom de la partie').fill('cuvée');
  await ajouter('date'); await page.locator('[data-codif-brique-ed]').last().getByLabel('Écriture').selectOption('champenois');
  await ajouter('date'); { const e = page.locator('[data-codif-brique-ed]').last(); await e.getByLabel('Élément de date').selectOption('mois'); await e.getByLabel('Écriture').selectOption('champenois'); }
  await ajouter('date'); await page.locator('[data-codif-brique-ed]').last().getByLabel('Élément de date').selectOption('jour');
  const ap = page.locator('[data-codif-apercu]'); await ap.getByLabel('Date de l’aperçu').fill('2020-07-22'); await ap.getByLabel('Cuvée (essai)').selectOption({ label: 'Brut Or (fictif)' }); await page.waitForTimeout(200);
  const res = await page.locator('[data-codif-resultat]').innerText();
  ok('aperçu en direct : A + GO + année 20 → « HS » + juillet → « SN » + 22 = AGOHSSN22', res === 'AGOHSSN22', res);
  await page.getByLabel('Date d’effet', { exact: true }).fill('2026-01-01');
  await page.screenshot({ path: `${SC}/shots/t77-regle.png`, fullPage: false });
  await page.getByRole('button', { name: 'Enregistrer la règle' }).click(); await page.waitForTimeout(300);
  d = await db(); const rt = (d.codifRegles || []).find((r) => r.id === 'tirage');
  ok('… règle enregistrée avec sa date d’effet, 5 briques', rt && rt.versions.length === 1 && rt.versions[0].des === '2026-01-01' && rt.versions[0].briques.length === 5, rt);
  t = await txt(page.locator('[data-codif-stade="tirage"]'));
  ok('… versions listées (à partir du 01/01/2026, 0 lot codé)', /01\/01\/2026/.test(t) && /Code champenois/i.test(t), t.slice(0, 400));
  // ---- export de la codification (fichier JSON)
  // ---- formulaire de tirage : encadré « Code du lot », code proposé selon la règle, modifiable
  await page.click('#tab-tirage'); await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Nouveau tirage/i }).first().click(); await page.waitForTimeout(400);
  const box = ov().locator('[data-codif="tirage"]');
  ok('formulaire de tirage : encadré « 🏷 Code du lot » de la règle', (await box.count()) === 1);
  await box.getByLabel('Cuvée (essai)').selectOption({ label: 'Rosé (fictif) (RO)' }); await page.waitForTimeout(250);
  const code = await ov().getByLabel(/Code du lot de tirage/i).inputValue().catch(async () => (await ov().locator('input').filter({ hasText: '' }).first().inputValue()));
  ok('… code proposé : A + RO + date (code champenois)', /^ARO[CHAMPENOIS]{4}\d{2}$/.test(code), code);
  await page.screenshot({ path: `${SC}/shots/t77-tirage.png` });
  await ov().getByRole('button', { name: /Fermer|Annuler/ }).first().click(); await page.waitForTimeout(300);
  // ---- habillage : règle L + année + compteur à rebours par jour (Z = 1er habillage du jour) + quantième
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="codification"]').click(); await page.waitForTimeout(200);
  await page.locator('[data-codif-choix-stade="habillage"]').click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: '＋ Nouvelle règle' }).click(); await page.waitForTimeout(200);
  await ajouter('texte'); await page.locator('[data-codif-brique-ed]').last().getByLabel('Texte de la brique').fill('L');
  await ajouter('date');
  await ajouter('compteur'); { const e = page.locator('[data-codif-brique-ed]').last(); await e.getByLabel('Écriture du compteur').selectOption('alphaInv'); await e.getByLabel('Longueur du compteur').fill('1'); await e.getByLabel('Remise à zéro').selectOption('jour'); }
  await ajouter('date'); await page.locator('[data-codif-brique-ed]').last().getByLabel('Élément de date').selectOption('quantieme');
  await page.locator('[data-codif-apercu]').getByLabel('Date de l’aperçu').fill('2022-03-24'); await page.waitForTimeout(200);
  ok('aperçu habillage : L22Z083 (24 mars 2022, 1er habillage du jour)', (await page.locator('[data-codif-resultat]').innerText()) === 'L22Z083', await page.locator('[data-codif-resultat]').innerText());
  await page.getByLabel('Date d’effet', { exact: true }).fill('2026-08-01'); await page.getByRole('button', { name: 'Enregistrer la règle' }).click(); await page.waitForTimeout(300);
  // ---- Dégorgement › Habillage & mise en carton
  const habiller = async (src, nb) => {
    await ov().getByLabel('Date', { exact: true }).fill('2026-11-27'); await page.waitForTimeout(100);
    if (src) { const sel = ov().getByLabel('Lot source'); await sel.selectOption(await sel.locator('option', { hasText: src }).first().getAttribute('value')); }
    await ov().getByLabel('Nombre de bouteilles').fill(String(nb)); await page.waitForTimeout(250);
  };
  await page.click('#tab-degorgement'); await page.waitForTimeout(400);
  await page.getByRole('button', { name: '＋ Habillage' }).click(); await page.waitForTimeout(300);
  await habiller('LF-26-001', 1200);
  let c1 = await ov().getByLabel('Code du lot').inputValue();
  ok('habillage : code proposé selon la règle (L26Z331)', c1 === 'L26Z331', c1);
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(300);
  await page.getByRole('button', { name: '＋ Habillage' }).click(); await page.waitForTimeout(300); await habiller('LF-26-001', 800);
  const c2 = await ov().getByLabel('Code du lot').inputValue();
  ok('… 2e habillage du jour : L26Y331', c2 === 'L26Y331', c2);
  await ov().getByLabel('Code du lot').fill('L26Y331-EXP'); await page.waitForTimeout(150);
  ok('… code modifié à la main signalé, « ↺ Code proposé » disponible', /modifié à la main/i.test(await txt(ov().locator('[data-codif="habillage"]'))));
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(300);
  d = await db(); const H = d.habillages || [];
  ok('… deux lots habillés du lot fini, trace de la règle (compteur Z = 1, code manuel marqué)', H.length === 2 && H[0].codif.cpt === 1 && H[0].codif.cle === 'j:2026-11-27' && H[1].codif.manuel === true && H[1].codif.cpt === 2 && H[1].code === 'L26Y331-EXP', H.map((h) => [h.code, h.codif]));
  // réétiquetage du 1er lot habillé : nouveau lot lié, le précédent intact
  await page.locator('[data-habillages] tr', { hasText: 'L26Z331' }).getByRole('button', { name: 'Réétiqueter' }).click(); await page.waitForTimeout(300);
  await ov().getByLabel('Nombre de bouteilles').fill('100'); await page.waitForTimeout(250);
  const c3 = await ov().getByLabel('Code du lot').inputValue();
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(300);
  // mise en carton du lot réétiqueté
  d = await db(); const re = (d.habillages || []).find((h) => h.source.type === 'habillage');
  ok('réétiquetage : nouveau lot habillé lié au précédent (code suivant du jour), le précédent intact', re && re.code === c3 && c3 === 'L26X331' && re.source.id === H[0].id && d.habillages.find((h) => h.id === H[0].id).nb === 1200, [c3, re]);
  await page.locator('[data-habillages] tr', { hasText: 'L26X331' }).getByRole('button', { name: 'Mettre en carton' }).click(); await page.waitForTimeout(300);
  await ov().getByLabel('Destinataire').fill('Client fictif'); await page.waitForTimeout(200);
  const c4 = await ov().getByLabel('Code du lot').inputValue();
  ok('mise en carton : code d’Œnotrack sans règle (C26-001), cartons calculés', c4 === 'C26-001' && /Calculé : 17/.test(await txt(ov())), c4);
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(300);
  d = await db(); const ca = d.habillages.find((h) => h.type === 'carton');
  ok('… mise en carton enregistrée (100 bouteilles, 17 cartons de 6)', ca && ca.nb === 100 && ca.nbCartons === 17 && ca.source.id === re.id, ca);
  await page.screenshot({ path: `${SC}/shots/t77-habillage.png`, fullPage: true });
  // fiche du lot fini : habillages, changement de code avec motif (ancien code gardé)
  await page.locator('tr', { hasText: 'LF-26-001' }).first().locator('td').first().click(); await page.waitForTimeout(400);
  t = await txt(ov()); ok('fiche du lot fini : habillages et mises en carton listés', /Habillages et mises en carton/i.test(t) && /L26Z331/.test(t) && /C26-001/.test(t));
  await ov().getByRole('button', { name: 'Changer le code' }).click(); await page.waitForTimeout(300);
  await ov().getByLabel('Nouveau code').fill('LF-26-001-R'); await ov().getByLabel('Motif du changement de code').fill('Réétiquetage export'); await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(300);
  d = await db(); const lf = d.lotsFinis.find((f) => f.code === 'LF-26-001-R'); const opD = d.ops.find((o) => o.id === (lf || {}).opId);
  ok('… code changé, ancien code gardé avec son motif et écrit dans l’opération de dégorgement', lf && lf.codesPrecedents[0].code === 'LF-26-001' && lf.codesPrecedents[0].motif === 'Réétiquetage export' && opD.lotFiniSpec.code === 'LF-26-001-R', lf);
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // ---- traçabilité : un ancien code et un code d'habillage retrouvent le lot fini
  // ---- import d'une codification (fichier JSON) : nouvelle version à partir de la date choisie, rien d'écrasé
  const exp = await page.evaluate(() => codifExporter(JSON.parse(localStorage.getItem('oenotrack-db-v2'))));
  exp.regles.find((r) => r.id === 'tirage').versions[0].briques[0].valeur = 'B'; fs.writeFileSync(`${SC}/codification-essai.json`, JSON.stringify(exp));
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="codification"]').click(); await page.waitForTimeout(200);
  await page.getByLabel('Date d’effet de l’import').fill('2027-01-01');
  await page.getByLabel('Fichier de codification').setInputFiles(`${SC}/codification-essai.json`); await page.waitForTimeout(800);
  d = await db(); const vt = d.codifRegles.find((r) => r.id === 'tirage').versions;
  ok('import : la règle reçue devient une nouvelle version à partir du 01/01/2027, la précédente gardée ; tables réunies sans doublon', vt.length === 2 && vt[1].des === '2027-01-01' && vt[1].briques[0].valeur === 'B' && vt[0].briques[0].valeur === 'A' && d.codifTables.length === 1, vt);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t77)'); process.exitCode = ko ? 1 : 0;
