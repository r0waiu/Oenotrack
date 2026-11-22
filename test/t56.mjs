// 0.28.0-alpha.1 : onglet Équipements — parc (fiches par catégorie, état, filtres, indicateurs), nouvelle fiche (catégorie, marque,
// modèle, n° de série, site, garantie, vos informations, vérification périodique : validité calculée), fiche imprimable, panne
// signalée, À faire (vérifications et maintenance), Maintenance (déplacée depuis l'Hygiène), Vérifications, Listes (catégorie
// ajoutée), suppression refusée pour un matériel utilisé ; Hygiène sans maintenance ; onglet désactivé : maintenance de retour dans
// l'Hygiène ; anglais. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const init = () => { window.__imp = []; window.print = () => { window.dispatchEvent(new Event('beforeprint')); const z = document.getElementById('zone-impression'); window.__imp.push(z ? z.textContent.replace(/\s+/g, ' ').slice(0, 800) : ''); window.dispatchEvent(new Event('afterprint')); }; };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
const ov = () => page.locator('.overlay').last();
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const toasts = async () => page.locator('.toast').allInnerTexts();
const fermer = async () => { for (let i = 0; i < 5 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
const sous = async (nom) => { await page.locator('main [role=tab]', { hasText: nom }).first().click(); await page.waitForTimeout(400); };
const champ = (f, l) => f.locator('label', { hasText: l }).locator('input, select, textarea').first();

// 1. onglet après l'Hygiène, sous-onglets, indicateurs, parc par catégorie
const onglets = await page.$$eval('.navtabs [role=tab]', (b) => b.map((x) => x.id.replace('tab-', '')));
ok('onglet « Équipements » juste après l’Hygiène', onglets.indexOf('equipements') === onglets.indexOf('hygiene') + 1 && /Équipements/.test(await txt(page.locator('#tab-equipements'))), onglets);
await page.click('#tab-equipements'); await page.waitForTimeout(500);
let t = await txt(page.locator('main'));
ok('sous-onglets : Parc, À faire, Maintenance, Vérifications, Listes', /Parc À faire( \d+)? Maintenance Vérifications ⚙ Listes/.test(await txt(page.locator('main [role=tablist]').first())), await txt(page.locator('main [role=tablist]').first()));
ok('indicateurs : matériel en service, en panne (1, jeu d’exemple), maintenance en retard, vérifications', /Matériel en service \d+ \d+ fiche\(s\)/i.test(t) && /En panne 1/i.test(t) && /Maintenance en retard/i.test(t) && /Vérifications/i.test(t), t.slice(0, 400));
ok('parc par catégorie : Pressoirs, Pesage et instruments de mesure, Pompes…, Filtration (2)…', /Pressoirs \(1\)/i.test(t) && /Pesage et instruments de mesure \(1\)/i.test(t) && /Pompes, tuyaux et raccords \(1\)/i.test(t) && /Filtration \(2\)/i.test(t), t.slice(0, 900));
ok('… la pompe du jeu d’exemple « en panne » (avec la panne), la bascule et sa vignette', (await page.locator('[data-equip="pompe"][data-equip-etat="panne"]').count()) === 1 && /⚠ panne/.test(await txt(page.locator('[data-equip="pompe"]'))) && /valide · 30\/06\/2027/.test(await txt(page.locator('[data-equip="bascule"]'))), await txt(page.locator('[data-equip="bascule"]')));
await page.locator('main input[aria-label="Rechercher un équipement"]').fill('filtre'); await page.waitForTimeout(300);
ok('recherche « filtre » : 2 fiches', (await page.locator('[data-equip]').count()) === 2);
await page.locator('main input[aria-label="Rechercher un équipement"]').fill(''); await page.locator('main select[aria-label="État"]').selectOption('panne'); await page.waitForTimeout(300);
ok('filtre « en panne » : la pompe', (await page.locator('[data-equip]').count()) === 1 && (await page.locator('[data-equip="pompe"]').count()) === 1);
await page.locator('main select[aria-label="État"]').selectOption(''); await page.waitForTimeout(250);
await page.screenshot({ path: SC + '/shots/t56-parc.png' });

// 2. nouvelle fiche : informations, vérification périodique (validité calculée), vos informations
await page.locator('[data-equip-nouveau]').click(); await page.waitForTimeout(400);
let f = ov();
await f.locator('input[aria-label="Nom de l’équipement"]').fill('Réfractomètre de poche'); await f.locator('select[aria-label="Catégorie"]').selectOption('mesure');
await champ(f, 'Marque').fill('Marque fictive'); await champ(f, 'Modèle').fill('RF-1'); await f.locator('input[aria-label="N° de série"]').fill('SN-42');
await f.locator('input[aria-label="Année de mise en service"]').fill('2022'); await champ(f, 'Garantie jusqu’au').fill('2027-06-30');
await champ(f, 'Emplacement').fill('Laboratoire');
await f.locator('input[aria-label="Périodicité en mois"]').fill('12'); await champ(f, 'Dernière vérification').fill('2025-12-01'); await page.waitForTimeout(150);
const vj = await champ(f, 'Valable jusqu’au').inputValue();
ok('vérification : « Valable jusqu’au » calculé (dernière + 12 mois)', vj === '2026-12-01', vj);
await f.locator('input[aria-label="Organisme de vérification"]').fill('Laboratoire fictif');
await f.locator('[data-equip-champs] button', { hasText: '+ Ajouter une information' }).click(); await page.waitForTimeout(150);
await f.locator('input[aria-label="Intitulé 1"]').fill('Plage de mesure'); await f.locator('input[aria-label="Valeur 1"]').fill('0–32 % Brix');
await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
let d = await db(); const ref = d.lists.equipements.find((x) => x.label === 'Réfractomètre de poche');
ok('fiche enregistrée (« Équipement ajouté. »)', !!ref && ref.categorie === 'mesure' && ref.marque === 'Marque fictive' && ref.numSerie === 'SN-42' && ref.annee === '2022' && ref.garantieJusquau === '2027-06-30' && ref.verif.periodeMois === 12 && ref.verif.valideJusquau === '2026-12-01' && ref.champs[0].valeur === '0–32 % Brix' && (await toasts()).some((x) => /Équipement ajouté\./.test(x)), ref);
f = ov(); t = await txt(f);
ok('la fiche s’ouvre : état, « à renouveler · 01/12/2026 », informations, plan, interventions', (await f.locator(`[data-equip-fiche="${ref.id}"]`).count()) === 1 && /à renouveler · 01\/12\/2026/.test(t) && /Marque, modèle Marque fictive · RF-1/i.test(t) && /N° de série SN-42/i.test(t) && /tous les 12 mois · dernière le 01\/12\/2025 · valable jusqu’au 01\/12\/2026 · Laboratoire fictif/.test(t) && /Plage de mesure 0–32 % Brix/i.test(t) && /Interventions \(0\)/.test(t), t.slice(0, 900));
ok('… pied : « ⬇ PDF » et « 🖨 Imprimer » (pas de page web), « Supprimer »', /⬇ PDF/.test(await txt(f.locator('.sheet-f'))) && /🖨 Imprimer/.test(await txt(f.locator('.sheet-f'))) && !/⬇ HTML/.test(await txt(f.locator('.sheet-f'))));
await f.locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1300);
const imp = await page.evaluate(() => window.__imp);
ok('fiche imprimée directement (« Fiche équipement — Réfractomètre de poche »)', imp.length === 1 && /Fiche équipement — Réfractomètre de poche/.test(imp[0]) && /SN-42/.test(imp[0]), imp);
// 3. panne signalée depuis la fiche
await f.locator('button', { hasText: '⚠ Signaler une panne' }).click(); await page.waitForTimeout(400);
let g = ov(); await g.locator('textarea[aria-label="Panne"]').fill('Prisme rayé'); await g.locator('.sheet-f .btn-primary', { hasText: 'Signaler' }).click(); await page.waitForTimeout(500);
d = await db(); f = ov(); t = await txt(f);
ok('panne signalée : intervention ouverte reliée au matériel, fiche « en panne », « (panne en cours) »', d.maintenance.some((m) => m.equipementId === ref.id && m.statut === 'ouverte' && m.probleme === 'Prisme rayé') && /en panne/.test(t) && /Interventions \(1\)/.test(t) && /Curative \(panne en cours\)|\(panne en cours\)/.test(t), t.slice(0, 700));
await fermer();
ok('indicateur « En panne » : 2', /En panne 2/i.test(await txt(page.locator('main'))));

// 4. À faire : vérification proche et pannes, mise à jour de la vérification
await sous('À faire'); t = await txt(page.locator('main'));
ok('À faire : vérification à faire avant le 01/12/2026 (📏), pannes (⚠), maintenance du plan', /Réfractomètre de poche — vérification périodique à faire avant le 01\/12\/2026\./.test(t) && /📏 vérification/.test(t) && /Prisme rayé/.test(t), t.slice(0, 900));
ok('… pas de tâche de nettoyage (elles restent dans l’Hygiène)', !/Rinçage|rincer|nettoyage après/i.test(t.replace(/Plan de nettoyage/g, '')), t.slice(0, 600));
await page.locator('[data-tache^="eq:verif:"] button', { hasText: 'Mettre à jour la vérification' }).first().click(); await page.waitForTimeout(400);
f = ov(); await champ(f, 'Dernière vérification').fill('2026-11-20'); await page.waitForTimeout(150);
ok('… nouvelle vérification le 20/11/2026 : validité recalculée (20/11/2027)', (await champ(f, 'Valable jusqu’au').inputValue()) === '2027-11-20');
await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
t = await txt(page.locator('main'));
ok('… tâche de vérification terminée', !/Réfractomètre de poche — vérification périodique/.test(t));

// 5. Maintenance (même plan que dans l'Hygiène jusqu'ici) ; Vérifications
await sous('Maintenance'); t = await txt(page.locator('main'));
ok('Maintenance : plan du matériel, « ⚠ Signaler une panne », « 🖨 Imprimer le plan »', /Pompes à vin/.test(t) && (await page.locator('[data-signaler-panne]').count()) === 1 && (await page.locator('main button', { hasText: '🖨 Imprimer le plan' }).count()) === 1, t.slice(0, 500));
await sous('Vérifications'); t = await txt(page.locator('main'));
ok('Vérifications : bascule (valide · 30/06/2027) et réfractomètre (valide · 20/11/2027), extincteurs à renseigner', /Matériel vérifié \(2\)/.test(t) && /Bascule du pressoir/.test(t) && /valide · 30\/06\/2027/.test(t) && /valide · 20\/11\/2027/.test(t), t.slice(0, 700));
// 6. Listes : catégorie ajoutée, proposée avant « Autre matériel »
await sous('⚙ Listes'); t = await txt(page.locator('main'));
ok('Listes des équipements : catégories, types et résultats des interventions (3 listes)', /Listes des équipements/.test(t) && (await page.locator('[data-hyg-liste]').count()) === 3 && /Catégories d’équipements/.test(t) && /Types d’intervention de maintenance/.test(t), t.slice(0, 500));
const carte = page.locator('[data-hyg-liste="equipCategories"]');
await carte.locator('input[aria-label="Ajouter à Catégories d’équipements"]').fill('Matériel viticole'); await carte.locator('button', { hasText: 'Ajouter' }).click(); await page.waitForTimeout(400);
d = await db(); ok('catégorie « Matériel viticole » ajoutée', (d.lists.equipCategories || []).some((x) => x.id === 'materiel-viticole'), d.lists.equipCategories);
await sous('Parc'); await page.locator('[data-equip-nouveau]').click(); await page.waitForTimeout(400); f = ov();
const opts = await f.locator('select[aria-label="Catégorie"] option').evaluateAll((L) => L.map((o) => o.value));
ok('… proposée dans la fiche, avant « Autre matériel »', opts[opts.length - 1] === 'autre' && opts[opts.length - 2] === 'materiel-viticole', opts);
await f.locator('input[aria-label="Nom de l’équipement"]').fill('Enjambeur'); await f.locator('select[aria-label="Catégorie"]').selectOption('materiel-viticole');
await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600); await fermer();
ok('… parc : « Matériel viticole (1) »', /Matériel viticole \(1\)/i.test(await txt(page.locator('main'))));
// 7. suppression : matériel utilisé refusé
await page.locator('[data-equip="pompe"]').click(); await page.waitForTimeout(400);
await ov().locator('.sheet-f button', { hasText: 'Supprimer' }).click(); await page.waitForTimeout(300); await ov().locator('.btn-danger', { hasText: 'Supprimer' }).last().click(); await page.waitForTimeout(400);
d = await db(); ok('suppression d’un matériel utilisé refusée (« passez-le en « Réformé » »)', d.lists.equipements.some((x) => x.id === 'pompe') && (await toasts()).some((x) => /Matériel utilisé \d+ fois : passez-le en « Réformé »/.test(x)), await toasts());
await fermer();
// 8. Hygiène : plus de maintenance (elle est dans Équipements)
await page.click('#tab-hygiene'); await page.waitForTimeout(400);
let st = await txt(page.locator('main [role=tablist]').first());
ok('Hygiène : sous-onglets sans « Maintenance »', !/Maintenance/.test(st) && /Plan de nettoyage/.test(st), st);
await sous('⚙ Listes');
ok('Hygiène › Listes : listes de l’hygiène seules (9)', (await page.locator('[data-hyg-liste]').count()) === 9 && !(await page.locator('[data-hyg-liste="maintTypes"]').count()));
// 9. onglet désactivé : la maintenance revient dans l'Hygiène
await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: 'Modules' }).first().click(); await page.waitForTimeout(400);
await page.locator('[data-module="equipements"] input[type=checkbox], [data-module="equipements"] [role=switch]').first().click(); await page.waitForTimeout(500);
if (await page.locator('.overlay').count()) { await ov().locator('.btn-primary, .btn-danger').last().click(); await page.waitForTimeout(400); }
d = await db(); ok('Paramètres › Modules : Équipements désactivé', (d.settings.modulesOff || []).includes('equipements') && !(await page.locator('#tab-equipements').count()), d.settings.modulesOff);
await page.click('#tab-hygiene'); await page.waitForTimeout(400);
st = await txt(page.locator('main [role=tablist]').first());
ok('… Hygiène : « Maintenance » de retour (fiches et pannes gardées)', /Maintenance/.test(st), st);
await sous('Maintenance'); ok('… plan de maintenance affiché', /Pompes à vin/.test(await txt(page.locator('main'))));
await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: 'Modules' }).first().click(); await page.waitForTimeout(400);
await page.locator('[data-module="equipements"] input[type=checkbox], [data-module="equipements"] [role=switch]').first().click(); await page.waitForTimeout(500);
ok('… réactivé', (await page.locator('#tab-equipements').count()) === 1);
// 10. anglais
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1500);
await page.click('#tab-equipements'); await page.waitForTimeout(500);
t = await txt(page.locator('main'));
ok('anglais : « Equipment fleet », « Equipment in service », « Broken down », « Weighing and measuring instruments », « + New equipment »', /Equipment fleet/i.test(t) && /Equipment in service/i.test(t) && /Broken down/i.test(t) && /Weighing and measuring instruments/i.test(t) && /\+ New equipment/.test(t) && /Fleet To do/.test(await txt(page.locator('main [role=tablist]').first())), t.slice(0, 600));
ok('… plus de français dans le parc', !/Matériel en service|En panne|Pompes, tuyaux|Rechercher|à prévoir|en ordre|Vérifications/.test(t), t.slice(0, 900));
await page.locator(`[data-equip="${ref.id}"]`).click(); await page.waitForTimeout(400); t = await txt(ov());
ok('… fiche : « Equipment record — », « Make, model », « Serial no. », « Periodic check », « every 12 months »', /Equipment record — Réfractomètre de poche/.test(t) && /Make, model/i.test(t) && /Serial no\./i.test(t) && /Periodic check/i.test(t) && /every 12 months/.test(t) && /Interventions \(1\)/.test(t) && /printed on 21\/11\/2026/.test(t) && /Laboratoire/.test(t) && !/Laboratory/.test(t) && !/édité le/.test(t), t.slice(0, 900));
await fermer(); await sous('Checks'); t = await txt(page.locator('main'));
ok('… Vérifications : « Equipment checked (2) », « valid · 30/06/2027 »', /Equipment checked \(2\)/.test(t) && /valid · 30\/06\/2027/.test(t), t.slice(0, 500));
await page.screenshot({ path: SC + '/shots/t56-anglais.png' });
ok('aucune erreur de page', errors.length === 0, errors);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUT EST BON (t56 : onglet Équipements)');
process.exitCode = ko ? 1 : 0;
