// 0.27.0-alpha.2 : ajustements de la version en test — bon de pesée (cru et échelle des crus, cumul de la campagne de l'apporteur,
// identifiants), bon de pressoir d'un marc, échelle à la saisie et au registre ; Opérations sans « Pesée de vendange », déclassements en
// sous-onglet ; Hygiène › Listes (moyen de contrôle ajouté et utilisé, zone masquée, moment personnalisé, type de maintenance) ;
// écran de connexion (logo de la société, choix de la langue) ; anglais. Données fictives (jeu d'exemple).
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
// 0.28.0-alpha.1 : la maintenance a son onglet (Équipements) ; ce test vérifie l'Hygiène telle qu'elle reste quand cet onglet est désactivé
await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); d.settings.modulesOff = [...(d.settings.modulesOff || []), 'equipements']; localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); }); await page.reload(); await page.waitForTimeout(1200);
const ov = () => page.locator('.overlay').last();
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const toasts = async () => page.locator('.toast').allInnerTexts();
const fermer = async () => { for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
const params = async (s) => { await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: s }).first().click(); await page.waitForTimeout(350); };
const sub = async (t) => { await page.locator('[data-pressoir] [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(300); };
const sous = async (nom) => { await page.locator('main [role=tab]', { hasText: nom }).first().click(); await page.waitForTimeout(350); };

// 1. identifiants imprimés sur les bons : société et partenaire
await params('Société & opérateurs');
await page.locator('main label', { hasText: 'Nom de l’entreprise' }).locator('input').fill('Domaine Fictif des Essais'); await page.keyboard.press('Tab'); await page.waitForTimeout(250);
await page.locator('main input[aria-label="Identifiants officiels"]').fill('CVI 51 000 00000 · Accise FR00000000000'); await page.keyboard.press('Tab'); await page.waitForTimeout(350);
let d = await db();
ok('Société : identifiants officiels enregistrés (« Identifiants enregistrés. »)', d.entreprise.identifiants === 'CVI 51 000 00000 · Accise FR00000000000' && (await toasts()).some((x) => /Identifiants enregistrés\./.test(x)), d.entreprise);
const p4 = d.ops.find((o) => o.type === 'apport' && o.pesee && o.pesee.num === 4 && o.date.startsWith('2026')); const ap4 = d.apporteurs.find((a) => a.id === p4.apporteurId);
await params('Partenaires');
await page.locator('main tr:visible', { hasText: ap4.nom }).first().click(); await page.waitForTimeout(350);
let f = ov(); ok('fiche du partenaire : champ « Identifiant (facultatif) »', /Identifiant \(facultatif\)/i.test(await txt(f)) && /Imprimé sur les bons de pesée/i.test(await txt(f)));
await f.locator('input[aria-label="Identifiant du partenaire"]').fill('CVI 51 999 99999'); await f.locator('.sheet-f .btn-primary', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(400);
d = await db(); ok('partenaire : identifiant enregistré', d.apporteurs.find((a) => a.id === ap4.id).ident === 'CVI 51 999 99999');

// 2. Pressoir : échelle des crus à la saisie, au registre, à la recherche
await page.click('#tab-pressoir'); await page.waitForTimeout(400);
await page.locator('[aria-label="Année des vendanges"]').selectOption('2026'); await page.waitForTimeout(250);
ok('registre : échelle des crus à côté du cru (2 Grand Cru, 2 Autre cru)', (await page.locator('main [data-echelle-cru="grand"]:visible').count()) === 2 && (await page.locator('main [data-echelle-cru="autre"]:visible').count()) === 2 && /Grand Cru/.test(await txt(page.locator('main [data-echelle-cru="grand"]:visible').first())));
await page.locator('main input[aria-label="Rechercher une pesée"]').fill('grand cru'); await page.waitForTimeout(250);
ok('recherche « grand cru » : les deux pesées de grands crus', (await page.locator('main [data-num-pesee]:visible').count()) === 2);
await page.locator('main input[aria-label="Rechercher une pesée"]').fill(''); await page.waitForTimeout(200);
await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300); f = ov();
await pick(page, f.locator('input[placeholder^="Cru (village)"]').first(), 'Avenay');
ok('nouvelle pesée : l’échelle du cru choisi s’affiche (« Échelle des crus : Premier Cru »)', /Échelle des crus : Premier Cru/.test(await txt(f.locator('[data-echelle-pesee]'))) && (await f.locator('[data-echelle-pesee] [data-echelle-cru="premier"]').count()) === 1);
await fermer();

// 3. bon de pesée (distinct du bon de pressoir) : livraison, échelle, cumul de la campagne de l'apporteur, identifiants
await page.locator('main tr:visible', { has: page.locator('[data-num-pesee]', { hasText: /^4$/ }) }).locator('[data-bon-pesee-btn]').click(); await page.waitForTimeout(400);
let b = await txt(ov().locator('[data-bon-pesee]'));
ok('bon de pesée n° 4 : titre, campagne, centre de pressurage et ses identifiants, apporteur et son identifiant', /Ticket de pesée n° 4/.test(b) && /Vendanges 2026/.test(b) && /Centre de pressurage/i.test(b) && /Domaine Fictif des Essais/.test(b) && /CVI 51 000 00000 · Accise FR00000000000/.test(b) && b.includes(ap4.nom) && /CVI 51 999 99999/.test(b), b.slice(0, 600));
ok('… livraison : cépage, cru, échelle des crus (« Autre cru »), poids net', (await ov().locator('[data-bon-livraison] th', { hasText: 'Échelle des crus' }).count()) === 1 && /Autre cru/.test(await txt(ov().locator('[data-bon-livraison]'))) && /4 000 kg/.test(await txt(ov().locator('[data-bon-livraison]'))));
const cumul = await txt(ov().locator('[data-bon-cumul]'));
ok('… cumul de la campagne de l’apporteur : 2 pesées, 8 000 kg ; par cépage et par échelle', /Cette livraison 1 (83 )?4 000 kg/i.test(cumul) && /Cumul de la campagne 2 (166 )?8 000 kg/i.test(cumul) && /Cépages livrés : Meunier = 8 000 kg/.test(b) && /Échelle des crus : Autre cru = 8 000 kg/.test(await txt(ov().locator('[data-bon-echelles]'))), [cumul, b.slice(0, 900)]);
ok('… pas de pourcentage d’échelle, signatures apporteur et centre', !/%/.test(await txt(ov().locator('[data-bon-echelles]'))) && /Signature de l’apporteur/.test(b) && /Signature du centre de pressurage/.test(b));
await page.screenshot({ path: SC + '/shots/t54-bon-pesee.png' });
await fermer();
await page.locator('main tr:visible', { has: page.locator('[data-num-pesee]', { hasText: /^1$/ }) }).locator('[data-bon-pesee-btn]').click(); await page.waitForTimeout(400);
b = await txt(ov().locator('[data-bon-pesee]'));
ok('bon de pesée n° 1 (autre apporteur) : Grand Cru, cumul 1 pesée', /Ticket de pesée n° 1/.test(b) && /Grand Cru/.test(b) && /Cumul de la campagne 1 (\d+ )?8 000 kg/i.test(await txt(ov().locator('[data-bon-cumul]'))) && /Échelle des crus : Grand Cru = 8 000 kg/.test(b), b.slice(0, 700));
await fermer();

// 4. bon de pressoir d'un marc
await sub('Pressurages');
await page.locator('main [data-bon-pressoir-btn]:visible').first().waitFor();
const nbBons = await page.locator('main [data-bon-pressoir-btn]:visible').count();
d = await db(); const m1 = d.ops.find((o) => o.type === 'pressurage' && o.marc && o.marc.num === 1 && o.date.startsWith('2026'));
await page.locator('main tr:visible', { hasText: (m1.parentSpec || {}).code || 'P26-01' }).first().locator('[data-bon-pressoir-btn]').click(); await page.waitForTimeout(400);
b = await txt(ov().locator('[data-bon-pressoir]'));
ok('bon de pressoir : un par marc, titre « Bon de pressoir — marc n° 1 », heures de pressurage', nbBons >= 5 && /Bon de pressoir — marc n° 1/.test(b) && new RegExp(`Pressurage du \\d\\d/\\d\\d/2026, de ${m1.marc.heureDebut} à ${m1.marc.heureFin}`).test(b), b.slice(0, 500));
ok('… raisins chargés : pesée, apporteur, cru, échelle, poids ; total chargé', (await ov().locator('[data-bon-charges] th', { hasText: 'Échelle des crus' }).count()) === 1 && /Grand Cru/.test(await txt(ov().locator('[data-bon-charges]'))) && new RegExp(`Total chargé ${(m1.charges || []).reduce((a, c) => a + Number(c.kg || 0), 0).toLocaleString('fr-FR').replace(/\s/g, ' ')} kg`, 'i').test((await txt(ov().locator('[data-bon-charges]'))).replace(/\s/g, ' ')));
ok('… répartition : « Cépages : Chardonnay = 100,0 % », « Échelle des crus : Grand Cru = 100,0 % »', /Cépages : Chardonnay = 100,0 %/.test(b) && /Échelle des crus : Grand Cru = 100,0 %/.test(b), b.slice(0, 900));
ok('… moûts obtenus avec leurs cuves et lots, revendicable, rendement, contrôles, validation, signatures', (await ov().locator('[data-bon-fractions] tbody tr').count()) >= 2 && /Revendicable \(cuvée \+ taille\)/i.test(b) && /Rendement [\d,]+ L \/ 160 kg/i.test(b) && /Contrôles/.test(b) && /Marc inscrit au carnet de pressoir sous le n° 1, validé le/.test(b) && /Signature du responsable du pressurage/.test(b) && /Signature de l’apporteur \(pressurage à façon\)/.test(b), b.slice(0, 1400));
ok('… distinct du bon de pesée', !/Ticket de pesée/.test(b) && !/Cumul de la campagne/.test(b));
await page.screenshot({ path: SC + '/shots/t54-bon-pressoir.png' });
await fermer();

// 5. Opérations : pas de « Pesée de vendange » ; déclassements en sous-onglet
await page.click('#tab-ops'); await page.waitForTimeout(400);
let t = await txt(page.locator('main'));
ok('Opérations : ni « Pesée de vendange » ni « Pressurage » ; renvoi vers l’onglet Pressoir', !(await page.locator('main [data-groupe] button', { hasText: /Pesée de vendange|^\S*\s*Pressurage$/ }).count()) && (await page.locator('[data-vers-pressoir]').count()) === 1);
ok('onglets : plus d’onglet « Déclassements » à part ; pastille sur Opérations (1 à valider)', !(await page.locator('#tab-declass').count()) && /1/.test(await txt(page.locator('#tab-ops'))) && (await page.locator('#tab-ops .chip-bad').count()) === 1);
ok('sous-onglets « Opérations » et « Déclassements (1) »', (await page.locator('main [role=tablist] [role=tab]', { hasText: 'Opérations' }).count()) >= 1 && /Déclassements 1/.test(await txt(page.locator('main [role=tablist] [role=tab]', { hasText: 'Déclassements' }))));
await page.locator('main button', { hasText: 'Déclassements à valider' }).click(); await page.waitForTimeout(350);
t = await txt(page.locator('main'));
ok('KPI « Déclassements à valider » → sous-onglet Déclassements', (await page.locator('main [role=tab][aria-selected="true"]', { hasText: 'Déclassements' }).count()) === 1 && /Valider|Refuser/.test(t), t.slice(0, 300));
await page.click('#tab-pressoir'); await page.waitForTimeout(250); await page.click('#tab-ops'); await page.waitForTimeout(300);

// 6. Hygiène › Listes
await page.click('#tab-hygiene'); await page.waitForTimeout(400); await sous('⚙ Réglages');
ok('Hygiène › Listes : onze listes de l’hygiène + actions et locaux', (await page.locator('[data-hyg-liste]').count()) === 11 && /Contrôles après rinçage/.test(await txt(page.locator('[data-hyg-listes]'))) && /Types d’intervention de maintenance/.test(await txt(page.locator('[data-hyg-listes]'))));
const carte = (k) => page.locator(`[data-hyg-liste="${k}"]`);
await carte('hygControles').locator('input[aria-label="Ajouter à Contrôles après rinçage"]').fill('Bandelette ATP');
await carte('hygControles').locator('input[aria-label="Résultat attendu du nouvel élément"]').fill('< 150 RLU');
await carte('hygControles').locator('button', { hasText: 'Ajouter' }).click(); await page.waitForTimeout(300);
d = await db();
ok('contrôle ajouté avec son résultat attendu (« attendu : < 150 RLU »)', (d.lists.hygControles || []).some((x) => x.id === 'bandelette-atp' && x.attendu === '< 150 RLU' && x.perso) && /attendu : < 150 RLU/.test(await txt(carte('hygControles').locator('[data-hyg-item="bandelette-atp"]'))));
ok('… élément d’origine : pas de « Supprimer » ; élément ajouté : supprimable', !(await carte('hygControles').locator('[data-hyg-item="ph"] button', { hasText: 'Supprimer' }).count()) && (await carte('hygControles').locator('[data-hyg-item="bandelette-atp"] button', { hasText: 'Supprimer' }).count()) === 1);
await carte('hygZones').locator('[data-hyg-item="degorgement"] button', { hasText: 'Masquer' }).click(); await page.waitForTimeout(300);
ok('zone « Dégorgement » masquée (chip « masqué », « Afficher »)', /masqué/.test(await txt(carte('hygZones').locator('[data-hyg-item="degorgement"]'))) && (await carte('hygZones').locator('[data-hyg-item="degorgement"] button', { hasText: 'Afficher' }).count()) === 1);
await carte('hygMoments').locator('input[aria-label="Ajouter à Moments personnalisés du plan"]').fill('Après chaque débourbage'); await carte('hygMoments').locator('button', { hasText: 'Ajouter' }).click(); await page.waitForTimeout(300);
await carte('maintTypes').locator('input[aria-label="Ajouter à Types d’intervention de maintenance"]').fill('Étalonnage'); await carte('maintTypes').locator('button', { hasText: 'Ajouter' }).click(); await page.waitForTimeout(300);
await carte('hygControles').locator('[data-hyg-item="visuel"] button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(150);
await carte('hygControles').locator('[data-hyg-item="visuel"] input[aria-label="Libellé"]').fill('Visuel (lampe)'); await carte('hygControles').locator('[data-hyg-item="visuel"] button', { hasText: 'OK' }).click(); await page.waitForTimeout(300);
d = await db();
ok('moment, type de maintenance ajoutés ; contrôle d’origine renommé (identifiant gardé)', d.lists.hygMoments.some((x) => x.label === 'Après chaque débourbage') && d.lists.maintTypes.some((x) => x.id === 'etalonnage') && d.lists.hygControles.find((x) => x.id === 'visuel').label === 'Visuel (lampe)');
await page.screenshot({ path: SC + '/shots/t54-listes.png', fullPage: true });
// plan de nettoyage : zone masquée plus proposée, moment personnalisé et contrôle ajouté proposés
await sous('Plan de nettoyage');
await page.locator('main button', { hasText: '+ Ajouter une ligne' }).click(); await page.waitForTimeout(350); f = ov();
const zones = await f.locator('select[aria-label="Zone"] option').evaluateAll((L) => L.map((o) => o.value));
const moments = await f.locator('select[aria-label="Moment 1"] option').evaluateAll((L) => L.map((o) => o.textContent));
const ctls = await f.locator('select[aria-label="Contrôle après rinçage"] option').evaluateAll((L) => L.map((o) => o.value));
ok('plan : « Dégorgement » plus proposé, moment « Après chaque débourbage » et « Bandelette ATP » proposés', !zones.includes('degorgement') && zones.includes('cuverie') && moments.includes('Après chaque débourbage') && ctls.includes('bandelette-atp'), [zones, moments, ctls]);
await f.locator('select[aria-label="Contrôle après rinçage"]').selectOption('bandelette-atp'); await page.waitForTimeout(150);
ok('… résultat attendu du contrôle ajouté prérempli', (await f.locator('label', { hasText: 'Résultat attendu' }).locator('input').first().inputValue().catch(() => '')) === '< 150 RLU');
await fermer();
// journal : contrôle ajouté directement depuis la saisie, puis utilisé
await sous('Journal d’hygiène');
await page.locator('main button', { hasText: '+ Nouvelle entrée' }).click(); await page.waitForTimeout(350); f = ov();
await f.locator('[data-ajout-controle]').click(); await page.waitForTimeout(150);
await f.locator('[data-ajout-controle-form] input[aria-label="Nouveau moyen de contrôle"]').fill('Conductimètre'); await f.locator('[data-ajout-controle-form] input[aria-label="Résultat attendu du contrôle"]').fill('< 50 µS/cm');
await f.locator('[data-ajout-controle-form] button', { hasText: 'Ajouter' }).click(); await page.waitForTimeout(350);
ok('journal : « + » ajoute un moyen de contrôle à la liste et le choisit (aide « Résultat attendu : < 50 µS/cm. »)', (await f.locator('select[aria-label="Type de contrôle"]').inputValue()) === 'conductimetre' && /Résultat attendu : < 50 µS\/cm\./.test(await txt(f)) && (await toasts()).some((x) => /Moyen de contrôle ajouté à la liste\./.test(x)));
const cible = f.locator('input[role=combobox]').first(); await cible.click(); await cible.fill('Cuve 0'); await page.waitForTimeout(150); await page.locator('[role=option]').first().click(); await page.waitForTimeout(100);
const actSel = f.locator('select').filter({ has: page.locator('option[value="rincage"]') }).first(); if (await actSel.count()) await actSel.selectOption('rincage');
await f.locator('[data-hyg-controle] button', { hasText: 'Conforme' }).first().click(); await f.locator('[data-hyg-controle] input[aria-label="Valeur lue"]').fill('32 µS/cm');
await f.locator('.sheet-f .btn-primary', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(450);
d = await db(); const hc = d.hygiene.find((h) => h.controle && h.controle.type === 'conductimetre');
ok('… entrée enregistrée avec le contrôle ajouté (conforme, 32 µS/cm)', !!hc && hc.controle.resultat === 'conforme' && hc.controle.valeur === '32 µS/cm' && (await page.locator('.overlay').count()) === 0, hc || (await toasts()));
await sous('⚙ Réglages');
ok('Listes : utilisation comptée, suppression bloquée', /1×/.test(await txt(carte('hygControles').locator('[data-hyg-item="conductimetre"]'))) && await carte('hygControles').locator('[data-hyg-item="conductimetre"] button', { hasText: 'Supprimer' }).isDisabled());
// maintenance : type ajouté proposé et accepté
await sous('Maintenance');
await page.locator('main button', { hasText: /Enregistrer une intervention|\+ Intervention/ }).first().click(); await page.waitForTimeout(350); f = ov();
const types = await f.locator('select[aria-label="Type d’intervention"] option').evaluateAll((L) => L.map((o) => o.value));
ok('maintenance : type « Étalonnage » proposé', types.includes('etalonnage'), types);
await f.locator('select[aria-label="Type d’intervention"]').selectOption('etalonnage');
await f.locator('label', { hasText: 'Matériel (texte)' }).locator('input').first().fill('Réfractomètre');
await f.locator('textarea').first().fill('Étalonnage à l’eau distillée.');
await f.locator('.sheet-f .btn-primary', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(450);
d = await db();
ok('… intervention « Étalonnage » enregistrée', d.maintenance.some((m) => m.type === 'etalonnage') && (await page.locator('.overlay').count()) === 0, await toasts());
await fermer();

// 7. écran de connexion : logo de la société centré sous l'en-tête, choix de la langue entier
const logo = await page.evaluate(() => { const c = document.createElement('canvas'); c.width = 240; c.height = 80; const g = c.getContext('2d'); g.fillStyle = '#7a3b2e'; g.fillRect(0, 0, 240, 80); g.fillStyle = '#fff'; g.fillRect(20, 20, 200, 40); return c.toDataURL('image/png'); });
await page.evaluate((u) => { const x = JSON.parse(localStorage.getItem('oenotrack-db-v2')); x.entreprise = { ...x.entreprise, logo: u, logoW: 240, logoH: 80 }; localStorage.setItem('oenotrack-db-v2', JSON.stringify(x)); }, logo);
await page.reload(); await page.waitForTimeout(1200);
await params('Utilisateurs & droits');
const fa = page.locator('main [data-activation] form'); const MDP = 'Essai-2026!zz';
await fa.locator('input[aria-label="Identifiant"]').fill('admin');
await fa.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Admin Essai');
await fa.locator('input[aria-label="Mot de passe"]').fill(MDP); await fa.locator('input[aria-label="Confirmer le mot de passe"]').fill(MDP);
await fa.locator('button[type=submit]').click(); await page.waitForTimeout(1800);
await ov().locator('label', { hasText: 'J’ai noté ce code' }).locator('input').check(); await ov().locator('button:text-is("Terminer")').click(); await page.waitForTimeout(400);
await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(500);
const geo = async () => page.evaluate(() => {
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, cx: (b.left + b.right) / 2 }; };
  const card = document.querySelector('[data-connexion] .login-card'); const tete = card && card.querySelector('.login-tete'); const lg = tete && tete.querySelector('select, button, .langue-choix');
  const logo = card && card.querySelector('[data-login-logo]'); const img = logo && logo.querySelector('img');
  const titre = tete && tete.querySelector('.brand'); const lc = tete && tete.querySelector('.langue-choix');
  return { card: r(card), tete: r(tete), langue: r(lg), titre: r(titre), choix: r(lc), logo: r(logo), img: r(img), imgOk: !!(img && img.complete && img.naturalWidth > 0), largeurPage: document.documentElement.scrollWidth, vue: window.innerWidth };
});
const verif = (g) => !!(g.card && g.tete && g.langue && g.logo && g.img && g.titre && g.choix) && g.imgOk && g.langue.r <= g.card.r + 0.5 && g.langue.l >= g.card.l - 0.5 && (g.titre.r <= g.choix.l + 0.5 || g.choix.t >= g.titre.b - 0.5) && g.logo.t >= g.tete.b - 0.5 && Math.abs(g.img.cx - g.card.cx) < 3 && g.largeurPage <= g.vue;
let g = await geo();
ok('connexion (ordinateur) : logo de la société centré sous l’en-tête, choix de la langue entier dans la carte, sur la ligne du nom', verif(g) && Math.abs(g.choix.t - g.titre.t) < 30, g);
await page.screenshot({ path: SC + '/shots/t54-connexion.png' });
await page.setViewportSize({ width: 360, height: 760 }); await page.waitForTimeout(300); g = await geo();
ok('connexion (téléphone, 360 px) : idem, sans défilement horizontal ni chevauchement du nom (langue passée dessous)', verif(g), g);
await page.screenshot({ path: SC + '/shots/t54-connexion-mobile.png' });
await page.setViewportSize({ width: 1440, height: 950 }); await page.waitForTimeout(200);
await page.locator('[data-connexion] input[aria-label="Identifiant"]').fill('admin').catch(() => {});
await page.locator('[data-connexion] input[aria-label="Mot de passe"]').fill(MDP); await page.locator('[data-connexion] button[type=submit]').click(); await page.waitForTimeout(1500);
ok('reconnecté', (await page.locator('[data-utilisateur]').count()) === 1);

// 8. anglais
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1500);
if (await page.locator('[data-connexion]').count()) { await page.locator('[data-connexion] input[aria-label="Password"]').fill(MDP); await page.locator('[data-connexion] button[type=submit]').click(); await page.waitForTimeout(1500); }
await page.click('#tab-pressoir'); await page.waitForTimeout(400); await page.locator('[aria-label="Harvest year"]').selectOption('2026').catch(() => {}); await page.waitForTimeout(250);
await page.locator('main tr:visible', { has: page.locator('[data-num-pesee]', { hasText: /^4$/ }) }).locator('[data-bon-pesee-btn]').click(); await page.waitForTimeout(400);
b = await txt(ov().locator('[data-bon-pesee]'));
ok('anglais : bon de pesée (« Weighing ticket no. 4 », « Cru scale: Other cru = 8 000 kg », cumul)', /Weighing ticket no\. 4/.test(b) && /Harvest 2026/.test(b) && /Cru scale: Other cru = 8 000 kg/.test(b) && /Grape varieties delivered: Meunier = 8 000 kg/.test(b) && /Campaign total/i.test(b) && /Weighing recorded in the weighing register under no\. 4, validated on .*\. Register kept according to the AOC Champagne specification \(chapter II\)\./.test(b) && !/Bon de pesée|Cumul de la campagne|Vendanges|Registre tenu/.test(b), b.slice(0, 900));
await fermer(); await sub('Pressings');
await page.locator('main [data-bon-pressoir-btn]:visible').first().click(); await page.waitForTimeout(400);
b = await txt(ov().locator('[data-bon-pressoir]'));
ok('anglais : bon de pressoir (« Pressing slip — press load no. », « Grapes loaded », « Musts obtained »)', /Pressing slip — press load no\. \d/.test(b) && /Grapes loaded/.test(b) && /Total loaded/i.test(b) && /Pressing of \d\d\/\d\d\/2026/.test(b) && /Cru scale: Grand Cru = 100,0 %|Cru scale: (Other cru|Premier Cru) = /.test(b) && !/Bon de pressoir|Raisins chargés|Pressurage du/.test(b), b.slice(0, 900));
await fermer();
await page.click('#tab-hygiene'); await page.waitForTimeout(400); await sous('⚙ Lists');
t = await txt(page.locator('[data-hyg-listes]'));
ok('anglais : Hygiène › Listes (« Hygiene lists », « Post-rinse checks », « expected: < 150 RLU », « hidden »)', /Hygiene lists/.test(t) && /Post-rinse checks/.test(t) && /expected: < 150 RLU/.test(t) && /hidden/.test(t) && /Maintenance intervention types/.test(t) && !/Contrôles après rinçage|Listes de l’hygiène/.test(t), t.slice(0, 700));
await page.click('#tab-ops'); await page.waitForTimeout(400); t = await txt(page.locator('main'));
ok('anglais : Opérations (sous-onglet « Downgrades », renvoi vers l’onglet Pressoir)', /Downgrades/.test(t) && /Weighings and pressings:/.test(t) && !/Déclassements/.test(t), t.slice(0, 500));
ok('aucune erreur de page', errors.length === 0, errors);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS UI PASSENT (t54 : bons de pesée et de pressoir, échelle des crus, identifiants, Opérations, Hygiène › Listes, connexion, anglais)');
process.exitCode = ko ? 1 : 0;
