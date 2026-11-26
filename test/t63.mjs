// 0.31.0-alpha.1 : schémas de vinification — proposés à la création d'un lot (marc validé au pressoir ou depuis le carnet, réglage),
// opérations à réaliser créées en un clic (étape décochée, produit, quantité), validation d'une étape (marque du schéma sur l'opération),
// fiche du lot (rubrique, retrait des étapes à réaliser, « Appliquer un schéma… »), Paramètres › Schémas (vérifier, dupliquer, modifier,
// retirer) ; anglais
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 500) : ''); };
const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const ov = () => page.locator('.overlay').last();
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const sub = async (t) => { await page.locator('[data-pressoir] [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(250); };
const sous = async (t) => { await page.locator('main [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(350); };
const fermer = async () => { for (let i = 0; i < 5 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
const feuille = () => page.locator('[data-schema-feuille]');
// pesée validée puis marc chargé et complété (comme t45) ; valider : « Enregistrer et valider »
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
  await f.locator('input[aria-label="Volume 1ère taille"]').fill('5'); await pick(page, f.locator('input[aria-label="Cuve 1ère taille"]'), cuveT);
  await f.locator('[data-tavp]').fill('10,2'); await f.locator('input[aria-label="Bourbes"]').fill('0,6'); await page.waitForTimeout(300);
  if (valider) await f.locator('[data-valider-marc]').click(); else await f.locator('.sheet-f .btn-primary').last().click();
  await page.waitForTimeout(900);
}

// 1. marc validé au pressoir : schéma proposé aux deux lots créés
await peserEtPresser('08:05', 'Bac D1', 'Bac D2');
ok('marc validé : feuille « Schéma de vinification proposé » ouverte', (await feuille().count()) === 1 && /Schéma de vinification proposé/.test(await txt(ov())));
const lotsF = await page.locator('[data-schema-lot]').count();
const choix = await page.locator('[data-schema-lot] select[aria-label="Schéma"]').evaluateAll((L) => L.map((s) => s.options[s.selectedIndex].text));
ok('… deux lots (cuvée, 1re taille), le schéma le plus proche présélectionné « (proposé) »', lotsF === 2 && choix[0] === 'Cuvée de Chardonnay, raisins sains (proposé)' && choix[1] === 'Tailles, raisins sains (proposé)', choix);
let t = await txt(feuille());
ok('… critères du lot (Chardonnay, Cuvée, Sain), J+n et dates, produits en stock, quantités calculées sur le volume (5 g/hL de SO₂ sur 20,50 hL → 205,00 g de métabisulfite à 0,5 g/g)', /P26-06-C/.test(t) && /Chardonnay/.test(t) && /Sain/.test(t) && /J\+0 26\/11\/2026/.test(t) && /J\+15 11\/12\/2026/.test(t) && /5 g\/hL de SO₂/.test(t) && /205,00 g/.test(t) && /410,00 g/.test(t), t.slice(0, 600));
const btn = ov().locator('.sheet-f .btn-primary');
ok('… bouton « ✓ Créer les opérations à réaliser (20) »', /Créer les opérations à réaliser \(20\)/.test(await btn.innerText()), await btn.innerText());
await page.locator('[data-schema-lot]').nth(1).locator('input[aria-label="Retenir l’étape Suivi de fermentation"]').last().uncheck(); await page.waitForTimeout(200);
ok('étape décochée : 19 opérations', /\(19\)/.test(await btn.innerText()), await btn.innerText());
await page.screenshot({ path: SC + '/shots/t63-feuille.png' });
await btn.click(); await page.waitForTimeout(700);
let d = await db(); const pv = (d.previsions || []).filter((p) => p.schema); const lotC = d.lots.find((l) => l.code === 'P26-06-C');
ok('19 opérations à réaliser créées, marquées (schéma, lot, rang) ; toast', pv.length === 19 && pv.filter((p) => p.schema.lotId === lotC.id).length === 10 && pv.every((p) => p.statut === 'prevue') && /19 opération\(s\) à réaliser créée\(s\) d’après le schéma/.test(await page.locator('.toast').last().innerText().catch(() => '')), pv.length);
const sulf = pv.find((p) => p.schema.lotId === lotC.id && p.schema.rang === 1);
ok('… sulfitage : produit, lot du fournisseur et quantité prévus (205 g), consigne', sulf.type === 'intrant' && sulf.f.sousType === 'sulfitage' && sulf.f.lignes[0].qty === '205' && !!sulf.f.lignes[0].arrivageId && /écoulement des jus/.test(sulf.notes), sulf.f);
ok('… schéma copié nulle part : la base garde les exemples virtuels', !('schemas' in d));
// 2. « À réaliser » : pastilles, validation d'une étape (marque du schéma sur l'opération)
await page.click('#tab-previsions'); await page.waitForTimeout(500);
ok('« À réaliser » : pastille « 📋 schéma » sur chaque étape', (await page.locator('main [data-schema-chip]').count()) >= 19, await page.locator('main [data-schema-chip]').count());
await page.locator('main tbody tr', { hasText: 'Sulfitage · P26-06-C' }).first().locator('button:has-text("Valider…")').click(); await page.waitForTimeout(500);
await ov().locator('.sheet-f button:text-is("✓ Valider")').click(); await page.waitForTimeout(600);
d = await db(); const opS = d.ops.find((o) => o.schema && o.schema.lotId === lotC.id); const pS1 = d.previsions.find((p) => p.id === sulf.id);
ok('étape validée : opération enregistrée avec la marque du schéma, étape réalisée', !!opS && opS.sousType === 'sulfitage' && opS.schema.rang === 1 && pS1.statut === 'realisee' && pS1.opId === opS.id, [opS && opS.schema, pS1.statut]);
await page.click('#tab-ops'); await page.waitForTimeout(400);
ok('journal des opérations : pastille « 📋 schéma »', (await page.locator('main [data-schema-chip]').count()) >= 1);
// 3. fiche du lot : rubrique, impression, retrait des étapes à réaliser
await page.click('#tab-cuverie'); await page.waitForTimeout(400); await sous('Cartes');
await page.locator('.tankcard', { hasText: 'Bac D1' }).first().click(); await page.waitForTimeout(500);
await ov().locator('[data-rubrique=lots] table .linkish').first().click(); await page.waitForTimeout(600);
const bloc = ov().locator('[data-schema-bloc]'); t = await txt(bloc);
ok('fiche du lot : rubrique « Schéma de vinification » (nom, 1 / 10 étape(s) validée(s), J+n, produits et quantités, consignes, statuts)', /Cuvée de Chardonnay, raisins sains/.test(t) && /1 \/ 10 étape\(s\) validée\(s\)/.test(t) && /J\+15/.test(t) && /Sulfitage · Métabisulfite de potassium 205,00 g/.test(t) && /écoulement des jus/.test(t) && /Validée/.test(t) && /À réaliser/i.test(t), t.slice(0, 400));
await page.screenshot({ path: SC + '/shots/t63-fiche-lot.png' });
await bloc.locator('button', { hasText: 'Retirer les étapes à réaliser' }).click(); await page.waitForTimeout(300);
await page.locator('.overlay').last().locator('button', { hasText: /^Retirer$/ }).click(); await page.waitForTimeout(500);
d = await db();
ok('étapes à réaliser retirées : l’étape validée et son opération restent', d.previsions.filter((p) => p.schema && p.schema.lotId === lotC.id).length === 1 && d.ops.some((o) => o.schema && o.schema.lotId === lotC.id) && /1 \/ 1 étape/.test(await txt(ov().locator('[data-schema-bloc]'))));
await fermer();
// 4. réglage : plus de proposition ; marc validé depuis le carnet (bouton « Valider »)
await page.click('#tab-params'); await page.waitForTimeout(400); await sous('Schémas de vinification');
await page.locator('main label', { hasText: 'Proposer un schéma à la création d’un lot' }).locator('input[type=checkbox]').uncheck(); await page.waitForTimeout(300);
d = await db(); ok('réglage décoché : enregistré dans la base (commun à l’équipe)', d.settings.schemas && d.settings.schemas.proposer === false);
await peserEtPresser('10:15', 'Cuve 02', 'Bac T', false); // cuvée seule dans la cuve 02 ; taille regroupée avec les tailles du Bac T
ok('marc chargé sans validation : pas de feuille', !(await feuille().count()));
await fermer();
await page.locator('main tr', { hasText: 'P26-07' }).first().locator('button', { hasText: /^Valider$/ }).click().catch(() => {}); await page.waitForTimeout(700);
ok('réglage décoché : marc validé depuis le carnet sans proposition', !(await feuille().count()));
await page.click('#tab-params'); await page.waitForTimeout(400); await sous('Schémas de vinification');
await page.locator('main label', { hasText: 'Proposer un schéma à la création d’un lot' }).locator('input[type=checkbox]').check(); await page.waitForTimeout(300);
// 5. « 📋 Appliquer un schéma… » depuis la fiche d'un lot sans schéma (P26-07-C, seul dans la cuve 02)
await page.click('#tab-cuverie'); await page.waitForTimeout(400); await sous('Cartes');
await page.locator('.tankcard', { hasText: 'Cuve 02' }).first().click(); await page.waitForTimeout(500);
await ov().locator('[data-rubrique=lots] table .linkish').first().click(); await page.waitForTimeout(600);
const bloc2 = ov().locator('[data-schema-bloc]');
ok('lot sans schéma : « Aucun schéma appliqué » et « 📋 Appliquer un schéma… »', /Aucun schéma appliqué à ce lot/.test(await txt(bloc2)) && (await bloc2.locator('button', { hasText: '📋 Appliquer un schéma…' }).count()) === 1, await txt(bloc2));
await bloc2.locator('button', { hasText: '📋 Appliquer un schéma…' }).click(); await page.waitForTimeout(600);
ok('… feuille ouverte pour ce lot seul (« Annuler », pas « Plus tard »)', (await page.locator('[data-schema-lot]').count()) === 1 && (await ov().locator('.sheet-f button', { hasText: 'Annuler' }).count()) === 1);
await page.locator('[data-schema-lot] select[aria-label="Schéma"]').selectOption({ label: 'Aucun schéma' }); await page.waitForTimeout(200);
ok('… « Aucun schéma » : rien à créer (bouton inactif)', /Aucun schéma : rien ne sera créé pour ce lot/.test(await txt(feuille())) && await ov().locator('.sheet-f .btn-primary').isDisabled());
await page.locator('[data-schema-lot] select[aria-label="Schéma"]').selectOption({ label: 'Cuvée de Chardonnay, raisins sains (proposé)' }); await page.waitForTimeout(200);
await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
d = await db(); const lot7 = d.lots.find((l) => l.code === 'P26-07-C');
ok('… opérations à réaliser créées pour ce lot (10)', d.previsions.filter((p) => p.schema && p.schema.lotId === lot7.id).length === 10);
await fermer();
// 6. Paramètres › Schémas : vérifier, dupliquer, modifier, retirer
await page.click('#tab-params'); await page.waitForTimeout(400); await sous('Schémas de vinification');
t = await txt(page.locator('main'));
ok('Paramètres › Schémas : 4 exemples « exemple à vérifier », critères, nombre d’étapes, avertissement', (await page.locator('[data-schemas] tbody tr').count()) === 4 && (t.match(/exemple à vérifier/g) || []).length >= 4 && /Chardonnay · Cuvée · Sain/.test(t) && /non officielles/.test(t), t.slice(0, 500));
await page.locator('[data-schemas] tbody tr', { hasText: 'Raisins altérés' }).locator('button', { hasText: '✓ Vérifié' }).click(); await page.waitForTimeout(400);
d = await db(); ok('« ✓ Vérifié » : exemples copiés dans la base, celui-ci vérifié', Array.isArray(d.schemas) && d.schemas.length === 4 && !d.schemas.find((s) => s.id === 'ex-altere').aVerifier);
await page.locator('[data-schemas] tbody tr', { hasText: 'Tailles, raisins sains' }).locator('button', { hasText: 'Dupliquer' }).click(); await page.waitForTimeout(400);
ok('« Dupliquer » : « Tailles, raisins sains (copie) »', (await page.locator('[data-schemas] tbody tr', { hasText: 'Tailles, raisins sains (copie)' }).count()) === 1);
await page.locator('[data-schemas] tbody tr', { hasText: 'Tailles, raisins sains (copie)' }).locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400);
let f = ov(); await f.locator('input[placeholder^="ex. Cuvée de Chardonnay"]').fill('Tailles de Meunier (essai)');
await f.locator('label', { hasText: 'Meunier' }).first().locator('input[type=checkbox]').check();
const nE = await f.locator('[data-schema-etape]').count();
await f.locator('button', { hasText: '+ Ajouter une étape' }).click(); await page.waitForTimeout(200);
await f.locator('[data-schema-etape]').last().locator('input').first().fill('21');
await f.locator('[data-schema-etape]').first().locator('button[aria-label="Retirer l’étape"]').click(); await page.waitForTimeout(200);
await f.locator('label', { hasText: 'Vérifié (sinon : à vérifier)' }).locator('input[type=checkbox]').check();
await page.screenshot({ path: SC + '/shots/t63-form.png' });
await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
d = await db(); const sM = d.schemas.find((s) => s.nom === 'Tailles de Meunier (essai)');
ok('« Modifier » : nom, critère cépage, étape ajoutée (J+21, en dernier), étape retirée, vérifié', !!sM && sM.criteres.cepages.includes('pm') && sM.etapes.length === nE && sM.etapes[sM.etapes.length - 1].jour === 21 && !sM.etapes.some((e) => e.id === 'e1') && !sM.aVerifier, sM);
await page.locator('[data-schemas] tbody tr', { hasText: 'Tailles de Meunier (essai)' }).locator('button', { hasText: 'Retirer' }).click(); await page.waitForTimeout(300);
await page.locator('.overlay').last().locator('button', { hasText: /^Retirer$/ }).click(); await page.waitForTimeout(400);
d = await db(); ok('« Retirer » : schéma retiré ; les opérations à réaliser déjà créées restent', !d.schemas.some((s) => s.nom === 'Tailles de Meunier (essai)') && d.previsions.filter((p) => p.schema).length >= 10);
// 7. anglais : Paramètres, fiche du lot, feuille de proposition
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(400);
t = await txt(page.locator('main'));
ok('anglais : Paramètres › Winemaking protocols (exemples, critères, réglage) traduits', /Winemaking protocols/.test(t) && /Chardonnay cuvée, healthy grapes/.test(t) && /Suggest a protocol when a lot is created/.test(t) && /\+ New protocol/.test(t) && /Chardonnay · Cuvée · Healthy/.test(t) && !/Schéma|schéma|raisins sains|Proposer un/.test(t), t.slice(0, 600));
await page.locator('[data-schemas] tbody tr').first().locator('button', { hasText: 'Edit' }).click(); await page.waitForTimeout(400); t = await txt(ov());
ok('anglais : formulaire (étapes, consignes d’exemple) traduit', /Edit the protocol/.test(t) && /Steps \(day after the lot is created\)/i.test(t) && /Day \(D\+\)/i.test(t) && /Product family/i.test(t) && /g\/hL of SO₂ added/.test(t) && /\+ Add a step/.test(t) && !/Étape|étape|Consigne|Famille|Jour/.test(t), t.slice(-700));
await fermer();
await page.click('#tab-cuverie'); await page.waitForTimeout(400); await sous('Cards');
await page.locator('.tankcard', { hasText: 'Cuve 02' }).first().click(); await page.waitForTimeout(500);
await ov().locator('[data-rubrique=lots] table .linkish').first().click(); await page.waitForTimeout(600);
t = await txt(ov().locator('[data-schema-bloc]'));
ok('anglais : rubrique du lot (D+n, étapes, statuts)', /Chardonnay cuvée, healthy grapes/.test(t) && /0 \/ 10 step\(s\) validated/.test(t) && /D\+0/.test(t) && /Remove the steps to do/.test(t) && !/J\+|étape|Étape|À réaliser/.test(t), t.slice(0, 400));
await fermer();
await page.click('#tab-cuverie'); await page.waitForTimeout(300); await sous('Cards');
await page.locator('.tankcard', { hasText: 'Cuve 09' }).first().click(); await page.waitForTimeout(500);
await ov().locator('[data-rubrique=lots] table .linkish').first().click(); await page.waitForTimeout(600);
await ov().locator('[data-schema-bloc] button', { hasText: 'Apply a protocol' }).click(); await page.waitForTimeout(600);
t = await txt(ov());
ok('anglais : feuille de proposition traduite (titre, colonnes, quantités, consignes)', /Suggested winemaking protocol|Winemaking protocol/.test(t) && /\(suggested\)/.test(t) && /D\+0/.test(t) && /Create the operations to do \(\d+\)/.test(t) && /at pressing, as the juice runs off/.test(t) && /g\/hL of SO₂/.test(t) && !/J\+|Créer|Consigne|écoulement/.test(t), t.slice(0, 700));
await page.screenshot({ path: SC + '/shots/t63-en.png' });
await fermer();
await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
ok('aucune erreur', !errors.length, errors.slice(0, 3));
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt63 : TOUT PASSE');
process.exitCode = ko ? 1 : 0;
