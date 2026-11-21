// 0.26.0-alpha.1 : plans de nettoyage et de maintenance (HACCP) — onglet Hygiène (À faire, plan de nettoyage, maintenance, impression),
// tâche enregistrée depuis la liste, non-conformité justifiée, panne signalée puis close, alertes à la saisie d'une opération, rinçage
// proposé juste après, plans en pause ; anglais
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 600) : ''); };
const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
// 0.28.0-alpha.1 : la maintenance a son onglet (Équipements) ; ce test vérifie l'Hygiène telle qu'elle reste quand cet onglet est désactivé
await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); d.settings.modulesOff = [...(d.settings.modulesOff || []), 'equipements']; localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); }); await page.reload(); await page.waitForTimeout(1200);
const ov = () => page.locator('.overlay').last();
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const fermer = async () => { for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
const sous = async (nom) => { await page.locator('main [role=tab]', { hasText: nom }).first().click(); await page.waitForTimeout(350); };
const taches = () => page.locator('[data-tache]');
const enregistrer = async (f, libelle = 'Enregistrer') => { await f.locator('.sheet-f .btn-primary', { hasText: libelle }).click(); await page.waitForTimeout(450); };

// 1. onglet Hygiène : pastille, sous-onglets, résumé du journal, cartes
let t = await txt(page.locator('#tab-hygiene'));
ok('onglet Hygiène : pastille de 7 tâches, rouge (non-conformités)', /Hygiène 7/.test(t) && (await page.locator('#tab-hygiene .chip-bad').count()) === 1, t);
await page.click('#tab-hygiene'); await page.waitForTimeout(400);
t = await txt(page.locator('main'));
ok('sous-onglets : Journal d’hygiène, À faire (7), Plan de nettoyage, Maintenance, Produits d’hygiène', /Journal d’hygiène À faire 7 Plan de nettoyage Maintenance Produits d’hygiène/.test(t), t.slice(0, 200));
ok('journal : résumé « 3 non-conformité(s) · 3 en retard · 1 à faire »', /3 non-conformité\(s\) 3 en retard 1 à faire Voir « À faire »/.test(await txt(page.locator('[data-hyg-resume]'))));
ok('cartes : Cuve 02 (vidée) « En retard : Rinçage », locaux listés', (await page.locator('button.card', { hasText: 'Cuve 02' }).locator('[data-carte-tache="retard"]').count()) === 1 && /En retard : Rinçage/.test(await txt(page.locator('button.card', { hasText: 'Cuve 02' }))) && (await page.locator('button.card', { hasText: 'Sol de la cuverie' }).count()) === 1);
await page.screenshot({ path: SC + '/shots/t49-journal.png' });

// 2. À faire : tâches, enregistrement depuis la tâche, justification, panne
await page.locator('[data-hyg-resume] button', { hasText: 'Voir' }).click(); await page.waitForTimeout(350);
ok('À faire : 7 tâches, non-conformités en tête', (await taches().count()) === 7 && (await taches().first().getAttribute('data-etat')) === 'nonconforme');
t = await txt(page.locator('[data-hyg-taches]'));
ok('… messages : remplissage sans rinçage, cuve vidée, désinfection hebdomadaire, pompes en retard, panne', /Bombonne 01 — remplissage du 10\/11\/2026 sans « Rinçage » au journal dans les 24 h précédentes\./.test(t) && /Cuve 02 — Rinçage à faire \(vidange du 14\/11\/2026\)\./.test(t) && /Désinfection tous les 7 jours \(dernier le 09\/11\/2026\)\./.test(t) && /Pompes à vin — maintenance en retard \(Préventive, échéance le 12\/11\/2026\)\./.test(t) && /Pompe à pistons — panne signalée le 18\/11\/2026/.test(t), t.slice(0, 900));
await page.locator('main select[aria-label="Filtre des tâches"]').selectOption('maintenance'); await page.waitForTimeout(250);
ok('filtre « Maintenance » : 2 tâches', (await taches().count()) === 2);
await page.locator('main select[aria-label="Filtre des tâches"]').selectOption(''); await page.waitForTimeout(250);
await page.locator('[data-tache*=":vid:ct23:"] button', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(400); let f = ov();
ok('« Enregistrer » : entrée d’hygiène préremplie (ligne du plan « Intérieur des cuves vides », contrôle visuel prévu)', (await f.locator('[data-hyg-plan]').inputValue()) === 'pn_cuves_rincage' && /Cuve 02/.test(await f.locator('input[role=combobox]').first().inputValue().catch(() => '') + await txt(f)) && /Le plan prévoit ce contrôle/.test(await txt(f)));
await f.locator('[data-hyg-controle] button', { hasText: 'Conforme' }).first().click(); await enregistrer(f);
let d = await db(); const hy = d.hygiene.find((x) => x.cibleId === 'ct23' && x.date === '2026-11-21');
ok('… enregistrée : rinçage de Cuve 02 avec contrôle conforme et ligne du plan ; tâche levée (6)', hy && hy.actionId === 'rincage' && hy.planId === 'pn_cuves_rincage' && hy.controle.type === 'visuel' && hy.controle.resultat === 'conforme' && (await taches().count()) === 6 && !(await page.locator('[data-tache*=":vid:ct23:"]').count()), hy);
const nc = taches().first(); const cleNc = await nc.getAttribute('data-tache');
await nc.locator('button', { hasText: 'Justifier' }).click(); await page.waitForTimeout(300); f = ov();
await enregistrer(f, 'Justifier');
ok('justifier : motif exigé', (await page.locator('.overlay').count()) === 1 && /Indiquez pourquoi/.test(await txt(page.locator('.toast').last())));
await f.locator('textarea[aria-label="Justification"]').fill('Bombonne neuve, rincée à la livraison.'); await enregistrer(f, 'Justifier');
d = await db();
ok('… justifiée : gardée dans l’historique, plus signalée (5)', d.hygieneAcquits.some((a) => a.id === cleNc && /neuve/.test(a.motif)) && (await taches().count()) === 5 && /Non-conformités justifiées \(1\)/.test(await txt(page.locator('main'))));
await page.locator('[data-tache^="pm:panne:"] button', { hasText: 'Clore la panne' }).click(); await page.waitForTimeout(350); f = ov();
ok('« Clore la panne » : formulaire « réparation faite »', /Clore la panne \(réparation faite\)/.test(await txt(f)) && (await f.locator('select[aria-label="État de la panne"]').inputValue()) === 'faite');
await f.locator('textarea').first().fill('Presse-étoupe refait.'); await enregistrer(f);
d = await db();
ok('… panne close : intervention « faite », tâche levée (4)', !d.maintenance.some((m) => m.statut === 'ouverte') && (await taches().count()) === 4);
await page.screenshot({ path: SC + '/shots/t49-afaire.png' });

// 3. plan de nettoyage : lignes par zone, modification, ajout, impression, pause
await sous('Plan de nettoyage');
ok('plan de nettoyage : 21 lignes du modèle, par zone, « consigne » ou « enregistré »', (await page.locator('[data-plan-ligne]').count()) === 21 && /Pressoir et réception \(7\)/.test(await txt(page.locator('main'))) && (await page.locator('[data-plan-ligne="pn_pressoir_rincage"]').innerText()).includes('consigne'));
await page.locator('[data-plan-ligne="pn_cuves_rincage"] button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(350); f = ov();
await f.locator('input[aria-label="Délai en jours"]').fill('2'); await enregistrer(f);
d = await db();
ok('ligne modifiée : rinçage des cuves en retard après 2 jours', d.planNettoyage.find((x) => x.id === 'pn_cuves_rincage').quand.find((q) => q.type === 'vidange').delai === 2);
await page.locator('main button', { hasText: '+ Ajouter une ligne' }).click(); await page.waitForTimeout(350); f = ov();
await f.locator('input[aria-label="Équipement ou local nettoyé"]').fill('Laveuse de caisses');
await f.locator('select[aria-label="Type de cible"]').selectOption('locaux'); await page.waitForTimeout(150);
await f.locator('[aria-label="Cibles choisies"] button', { hasText: 'Laveuse de caisses' }).click();
await f.locator('select[aria-label="Moment 1"]').selectOption('periodique'); await page.waitForTimeout(150); await f.locator('input[aria-label="Nombre de jours"]').fill('14');
await f.locator('select[aria-label="Action du plan"]').selectOption('nettoyage');
ok('… nouvelle ligne : cible retenue affichée', /Retenu : Laveuse de caisses\./.test(await txt(f)));
await enregistrer(f);
d = await db(); const nl = d.planNettoyage.find((x) => x.libelle === 'Laveuse de caisses');
ok('ligne ajoutée au plan (locaux, tous les 14 jours, nettoyage)', nl && nl.cible.type === 'locaux' && nl.cible.ids.join() === 'laveuse' && nl.quand[0].type === 'periodique' && nl.quand[0].jours === 14 && nl.actionId === 'nettoyage' && (await page.locator('[data-plan-ligne]').count()) === 22, nl);
await page.locator('main button', { hasText: '🖨 Imprimer le plan' }).click(); await page.waitForTimeout(400); f = ov();
t = await txt(f.locator('[data-plan-impression]'));
ok('impression du plan : en-tête, colonnes HACCP, lignes actives', /Plan de nettoyage et de désinfection/.test(t) && /Mis en place le 01\/11\/2026/.test(t) && /Fréquence/i.test(t) && /Temps de contact/i.test(t) && /Laveuse de caisses/.test(t) && /Intérieur des cuves vides/.test(t), t.slice(0, 400));
await fermer();
await page.locator('main label', { hasText: 'Plans actifs' }).locator('input').uncheck(); await page.waitForTimeout(400);
ok('plans en pause : plus de pastille, « À faire » l’indique', !(await page.locator('#tab-hygiene .chip').count()) && (await (async () => { await sous('À faire'); return /Plans d’hygiène en pause/.test(await txt(page.locator('main'))) && !(await taches().count()); })()));
await sous('Plan de nettoyage'); await page.locator('main label', { hasText: 'Plans actifs' }).locator('input').check(); await page.waitForTimeout(400);

// 4. maintenance : état du matériel, intervention, panne signalée, impression
await sous('Maintenance');
ok('maintenance : 14 matériels suivis ; pompes « en retard », pressoirs « à jour »', (await page.locator('main tbody').first().locator('tr').count()) === 14 && (await page.locator('main tr', { hasText: 'Pompes à vin' }).locator('[data-maint-etat="retard"]').count()) === 1 && (await page.locator('main tr', { hasText: 'Pressoirs' }).first().locator('[data-maint-etat="ok"]').count()) === 1);
await page.locator('main tr', { hasText: 'Pompes à vin' }).first().locator('button', { hasText: 'Intervention' }).click(); await page.waitForTimeout(350); f = ov();
await f.locator('textarea').first().fill('Garnitures changées, essai.'); await enregistrer(f);
ok('intervention préventive : pompes « à jour », échéance dans un an', (await page.locator('main tr', { hasText: 'Pompes à vin' }).first().locator('[data-maint-etat="ok"]').count()) === 1 && /21\/11\/2026 → 21\/11\/2027/.test(await txt(page.locator('main tr', { hasText: 'Pompes à vin' }).first())));
await page.locator('[data-signaler-panne]').click(); await page.waitForTimeout(350); f = ov();
await f.locator('select[aria-label="Matériel du plan"]').selectOption('pm_filtres'); await f.locator('textarea[aria-label="Panne"]').fill('Fuite au joint du filtre.');
await enregistrer(f, 'Signaler');
d = await db();
ok('panne signalée : en cours, dans « À faire »', d.maintenance.some((m) => m.statut === 'ouverte' && m.entreeId === 'pm_filtres' && /Fuite/.test(m.probleme)) && (await (async () => { await sous('À faire'); return (await page.locator('[data-tache^="pm:panne:"]').count()) === 1; })()));
await sous('Maintenance'); await page.locator('main button', { hasText: '🖨 Imprimer le plan' }).click(); await page.waitForTimeout(400);
t = await txt(ov().locator('[data-plan-impression]'));
ok('impression du plan de maintenance : matériel, type, fréquence, dernière et prochaine', /Plan de maintenance du matériel/.test(t) && /Extincteurs/.test(t) && /Réglementaire/.test(t) && /1 an\(s\)/.test(t) && /21\/11\/2027/.test(t), t.slice(0, 300));
await fermer(); await page.screenshot({ path: SC + '/shots/t49-maintenance.png' });

// 5. saisie d'une opération : alertes du plan, enregistrement immédiat, rinçage proposé après la validation
await page.click('#tab-ops'); await page.waitForTimeout(400);
await page.click('main button:text-is("Soutirage")'); await page.waitForTimeout(400); f = ov();
const combos = f.locator('input[role=combobox]');
await pick(page, combos.nth(0), 'Cuve 03', 'Cuve 03'); await page.waitForTimeout(250);
await pick(page, combos.nth(1), 'Bac D1', 'Bac D1'); await page.waitForTimeout(500);
t = await txt(f.locator('[data-hyg-saisie]'));
ok('saisie : « Cuve 03 sera vide — Rinçage à faire ensuite », « Bac D1 — Rinçage à faire avant le remplissage »', /Cuve 03 sera vide — Rinçage à faire ensuite \(plan de nettoyage\)\./.test(t) && /Bac D1 — Rinçage à faire avant le remplissage( \(dernier le \d\d\/\d\d\/\d{4}\))?\./.test(t), t);
await f.locator('[data-hyg-saisie] div', { hasText: 'Bac D1 — Rinçage' }).locator('button', { hasText: 'Enregistrer maintenant' }).last().click(); await page.waitForTimeout(400);
const fh = ov(); ok('« Enregistrer maintenant » : entrée d’hygiène par-dessus l’opération', /Nouvelle entrée d’hygiène/.test(await txt(fh)) && (await page.locator('.overlay').count()) === 2);
await enregistrer(fh); f = ov();
ok('… rinçage de Bac D1 enregistré : l’alerte disparaît du formulaire', (await page.locator('.overlay').count()) === 1 && !/Bac D1 — Rinçage à faire avant/.test(await txt(f)) && /Cuve 03 sera vide/.test(await txt(f)));
await enregistrer(f, 'Valider'); await page.waitForTimeout(400);
t = await txt(page.locator('[data-suite-hygiene]'));
ok('après la validation : « 🧽 À faire ensuite — Cuve 03 — Rinçage à faire (vidange du 21/11/2026). »', /À faire ensuite/.test(t) && /Cuve 03 — Rinçage à faire \(vidange du 21\/11\/2026\)\./.test(t), t);
await page.screenshot({ path: SC + '/shots/t49-suite.png' });
await page.locator('[data-suite-hygiene] button', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(400); f = ov();
ok('… « Enregistrer » : rinçage de Cuve 03 prérempli', (await f.locator('[data-hyg-plan]').inputValue()) === 'pn_cuves_rincage');
await enregistrer(f);
d = await db();
ok('… enregistré : plus rien à faire ensuite', !(await page.locator('[data-suite-hygiene]').count()) && d.hygiene.some((x) => x.cibleId === 'ct24' && x.date === '2026-11-21' && x.actionId === 'rincage'));

// 6. anglais
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(300);
await page.click('#tab-hygiene'); await page.waitForTimeout(300); await sous('To do');
t = await txt(page.locator('main'));
ok('anglais : « To do », « Cleaning plan », messages des tâches traduits', /Hygiene log To do \d+ Cleaning plan Maintenance Hygiene products/.test(t) && /Filters — breakdown reported on 21\/11\/2026, work to do: Fuite au joint du filtre\./.test(t) && /Transfer equipment \(pumps, hoses, fittings\) — Disinfection every 7 days/.test(t) && !/à faire|en retard|tous les|vidange/.test(t), t.slice(0, 1500));
await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
ok('aucune erreur', !errors.length, errors);
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt49 : TOUT PASSE');
await browser.close();
process.exitCode = ko ? 1 : 0;
