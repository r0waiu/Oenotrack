// 0.39.0-alpha.1 : Paramètres réorganisés (rubriques, réglages rangés dans Vinification, rien de perdu si le module est désactivé),
// opérations de tirage / cave / dégorgement saisies dans leur onglet (traçabilité des bouteilles), plan de vinification (tableau,
// impression A4 paysage, modification, import d'un tableur fictif, application à un lot), clés d'accès gérées utilisateur par utilisateur.
// Données fictives (jeu d'exemple ; tableur créé par le test).
import { open } from './ui.mjs'; import fs from 'fs'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const XLSX = require('/opt/npm-tools/node_modules/xlsx');
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const initImp = () => { window.__imp = []; window.print = () => { window.dispatchEvent(new Event('beforeprint')); const z = document.getElementById('zone-impression'); window.__imp.push({ orientation: z ? z.dataset.orientation || '' : '', texte: z ? z.textContent.replace(/\s+/g, ' ').slice(0, 400) : null, planv: z ? z.querySelectorAll('table.planv').length : 0 }); window.dispatchEvent(new Event('afterprint')); }; };
// tableur fictif à la mise en page d'une instruction de travail (titre, en-têtes fusionnés, étapes fusionnées)
function tableurFictif() {
  const E = (n) => Array(n).fill('');
  const rows = [['Vinification en blanc (essai)', ...E(13)], ['Doses fictives pour le test', ...E(13)], ['', '', 'Cépage blanc', ...E(5), 'Cépages noirs', ...E(5)],
    ['Revendication', '', 'Conventionnel', '', 'FR-BIO-01', '', 'Demeter', '', 'Conventionnel', '', 'FR-BIO-01', '', 'Demeter', ''], ['Fractionnement', '', ...Array(6).fill(['Cuvée', 'Tailles']).flat()],
    ['Sulfitage', 'Produit fictif A', '4 cL/hL', '5 cL/hL', ...E(4), '4 cL/hL', '6 cL/hL', ...E(4)], ['', 'Produit fictif B', '', '', '4 cL/hL', '6 cL/hL', '4 cL/hL', '6 cL/hL', '', '', '4 cL/hL', '6 cL/hL', '3 cL/hL', '5 cL/hL'],
    ['Débourbage', ...E(13)], ['Statique d’une nuit', ...E(13)], ['Thermorégulation', '', '18°C', '', '18°C', '', '18°C', '', '18°C', '', '18°C', '', '18°C', ''], ['Tirage', 'Sucre', '22 g/L', '', '', '', '', '', '24 g/L', '', '', '', '', '']];
  const ws = XLSX.utils.aoa_to_sheet(rows); const M = (r1, c1, r2, c2) => ({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
  ws['!merges'] = [M(0, 0, 0, 13), M(1, 0, 1, 13), M(2, 2, 2, 7), M(2, 8, 2, 13), ...[2, 4, 6, 8, 10, 12].map((c) => M(3, c, 3, c + 1)), M(3, 0, 3, 1), M(4, 0, 4, 1), M(5, 0, 6, 0), M(7, 0, 7, 13), M(8, 0, 8, 13), M(9, 0, 9, 1), ...[2, 4, 6, 8, 10, 12].map((c) => M(9, c, 9, c + 1)), M(10, 2, 10, 3), M(10, 8, 10, 9)];
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Vin Blanc'); const f = `${SC}/OE-INS-99_Plan fictif - V1.3.xlsx`; XLSX.writeFile(wb, f); return f;
}
const xlsxVrai = fs.readFileSync('/opt/npm-tools/node_modules/xlsx/dist/xlsx.full.min.js', 'utf8');
const routes = async (route, u) => { if (u.includes('xlsx')) { await route.fulfill({ contentType: 'text/javascript', body: xlsxVrai }); return true; } return false; };

// 1. Paramètres, opérations, cave, plan de vinification
{
  const { browser, page, errors } = await open({ init: initImp, routes, viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  // ---- Paramètres : rubriques
  await page.click('#tab-params'); await page.waitForTimeout(300);
  const groupes = await page.locator('[data-params-groupe]').evaluateAll((L) => L.map((x) => x.getAttribute('data-params-groupe')));
  const menu = await txt(page.locator('[data-params-menu]'));
  ok('Paramètres : quatre rubriques (Exploitation, Vin & cuverie, Équipe & sécurité, Données & application) + « Réglages des modules » (0.48.0-alpha.1), menu latéral', groupes.join() === 'exploitation,vin,equipe,donnees,modules-reglages' && /Exploitation/i.test(menu) && /Vin & cuverie/i.test(menu) && /Équipe & sécurité/i.test(menu) && /Données & application/i.test(menu) && /Réglages des modules/i.test(menu), [groupes, menu]);
  const items = await page.locator('[data-params-item]').evaluateAll((L) => L.map((x) => x.getAttribute('data-params-item')));
  ok('… toutes les rubriques d’avant présentes (aucun réglage perdu) + « 🧪 Calculs œnologiques »', ['entreprise', 'utilisateurs', 'modules', 'profil', 'sauvegarde', 'garde', 'campagnes', 'sites', 'contenants', 'jaugeage', 'crus', 'apporteurs', 'operations', 'schemas', 'listes', 'calculs', 'ia', 'base'].every((x) => items.includes(x)) && items.length === 23 && items.includes('codification') && ['reglages-pressoir', 'reglages-analyses', 'reglages-hygiene', 'reglages-equipements'].every((x) => items.includes(x)), items); // 0.41.0-alpha.1 : + « 🏷 Codification des lots » ; 0.48.0-alpha.1 : + réglages de 4 modules
  await page.locator('[data-params-item="calculs"]').click(); await page.waitForTimeout(300);
  let t = await txt(page.locator('main'));
  ok('« 🧪 Calculs œnologiques » : sucre par point de densité, objectif de tirage, enrichissement', (await page.locator('[data-params-calculs]').count()) === 1 && /g\/L par point de densité/i.test(t) && /Enrichissement des moûts/i.test(t));
  await page.locator('[data-params-item="base"]').click(); await page.waitForTimeout(300); t = await txt(page.locator('main'));
  ok('« 🖥 Affichage & application » : données, charte graphique, mode d’affichage (calculs ailleurs)', /Charte graphique/i.test(t) && /Mode d’affichage/i.test(t) && !/Enrichissement des moûts/i.test(t));
  await page.screenshot({ path: SC + '/shots/t75-params.png' });
  // réglages rangés dans Vinification
  await page.locator('[data-params-item="operations"]').click(); await page.waitForTimeout(400);
  ok('« ⚙ Opérations » → Vinification › Opérations & Assemblages › Catalogue des opérations', (await page.locator('[data-ops-catalogue]').count()) === 1 && (await page.locator('main button', { hasText: '+ Nouvelle opération' }).count()) >= 1);
  await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('[data-params-item="jaugeage"]').click(); await page.waitForTimeout(400);
  ok('« 📏 Barèmes de jaugeage » → Vinification › Cuverie & Lots (sous-onglet Barèmes)', (await page.locator('[data-cuverie-baremes]').count()) === 1);
  await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('[data-params-item="schemas"]').click(); await page.waitForTimeout(400);
  ok('« 🗂 Plan de vinification » (ancien « Schémas de vinification ») → Vinification › Plan de vinification', (await page.locator('[data-planv]').count()) === 1);
  // ---- Opérations & Assemblages : plus de saisie de tirage, cave, dégorgement ; journal complet
  await page.click('#tab-ops'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: /^Journal$/ }).click(); await page.waitForTimeout(300);
  const nouv = page.locator('main section', { hasText: 'Nouvelle opération' }).first(); const bt = await nouv.locator('button').allInnerTexts();
  ok('Opérations : préparation, tirage, remuage, dégorgement plus proposés à la saisie', !bt.some((x) => /^(⚗|🍾|↯)?\s*(Préparation|Tirage \(mixtion\)|Remuage|Dégorgement)$/.test(x.trim())) && bt.some((x) => /Soutirage/.test(x)), bt);
  ok('… carte « Tirage & bouteilles » : liens vers Tirages, Cave, Dégorgement', (await page.locator('[data-vers-bouteilles] [data-vers-module]').count()) === 3);
  const journal = await txt(page.locator('main section', { hasText: 'Journal des opérations' }).first());
  ok('… journal toujours complet (tirage et dégorgement compris)', /Tirage/.test(journal) && /Dégorgement/.test(journal));
  await page.locator('[data-vers-module="cave"]').click(); await page.waitForTimeout(400); t = await txt(page.locator('main'));
  ok('Cave : remuage saisi ici ; colonne « Vins de base » (lots de la vinification)', /Remuage \/ mise sur pointes/.test(t) && /Vins de base/i.test(t) && (await page.locator('[data-vins-base]').count()) >= 1);
  await page.locator('#tab-tirage').click(); await page.waitForTimeout(400); await page.getByRole('tab', { name: /Tirer/ }).click(); await page.waitForTimeout(300); t = await txt(page.locator('main')); // 0.42.0-alpha.1 : sous-onglet « Tirer »
  ok('Tirages : préparations et tirage saisis ici ; suite de chaque tirage (en cave, dégorgées)', /Nouveau tirage/.test(t) && /Suite \(cave, dégorgement\)/i.test(t) && (await page.locator('[data-suite-tirage]').count()) >= 1 && /En cave : /.test(t));
  await page.locator('#tab-degorgement').click(); await page.waitForTimeout(400); t = await txt(page.locator('main'));
  ok('Dégorgement : saisi ici ; parcours du lot fini, vins de base', /Nouveau dégorgement/.test(t) && /Parcours de chaque lot fini/.test(t) && /Vins de base/i.test(t));
  // ---- Plan de vinification
  await page.click('#tab-vinification'); await page.waitForTimeout(200); await page.click('#tab-plan'); await page.waitForTimeout(400);
  const th = await page.locator('[data-planv-edit] thead tr').nth(2).locator('th').count(); // 0.43.0-alpha.2 : tableau modifiable directement
  t = (await page.locator('[data-planv-edit] input, [data-planv-edit] textarea').evaluateAll((L) => L.map((x) => x.value).join(' '))) + ' ' + await txt(page.locator('[data-planv]'));
  ok('Plan de vinification : onglet Vinification, tableau 12 colonnes (2 groupes × 3 revendications × cuvée / tailles), exemple à vérifier', th === 12 && /Cépage blanc/i.test(t) && /Cépages noirs/i.test(t) && /BIO/i.test(t) && /Demeter/i.test(t) && /Débourbage/i.test(t) && /exemple à vérifier/.test(await txt(page.locator('[data-planv]'))), [th, t.slice(0, 300)]);
  await page.screenshot({ path: SC + '/shots/t75-plan.png' });
  await page.locator('[data-planv-imprimer]').click(); await page.waitForTimeout(300); await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1500);
  const imp = await page.evaluate(() => window.__imp);
  ok('… impression : A4 paysage, tableau du plan seul', imp.length === 1 && imp[0].orientation === 'paysage' && imp[0].planv === 1 && /Vinification en blanc/.test(imp[0].texte), imp);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // modification : une dose changée → plan copié dans la base
  const c0 = page.locator('[data-planv-edit] tbody tr').nth(1).locator('[data-planv-case] input').first(); await c0.fill('6 g/hL'); await c0.press('Enter'); await page.waitForTimeout(500);
  await page.locator('[data-planv] button', { hasText: '✓ Vérifié' }).click(); await page.waitForTimeout(500);
  let d = await db();
  ok('… modifié : copié dans la base, vérifié, dose enregistrée', Array.isArray(d.plansVinif) && d.plansVinif.length === 1 && d.plansVinif[0].aVerifier === false && Object.values(d.plansVinif[0].lignes[1].valeurs).includes('6 g/hL'), d.plansVinif && d.plansVinif[0] && d.plansVinif[0].lignes[1]);
  // import d'un tableur fictif
  await page.locator('[data-planv-importer]').click(); await page.waitForTimeout(250);
  await page.locator('input[aria-label="Tableur du plan de vinification"]').setInputFiles(tableurFictif()); await page.waitForTimeout(2500);
  const nomLu = await ov().locator('input[aria-label="Nom du plan"]').inputValue().catch(() => '');
  ok('import : tableur lu, plan proposé à vérifier (nom, référence, version)', nomLu === 'Vinification en blanc (essai)' && (await ov().locator('input[placeholder="ex. OE-INS-01"]').inputValue()) === 'OE-INS-99' && (await ov().locator('input[placeholder="ex. V1.2"]').inputValue()) === 'V1.3', nomLu);
  await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600); d = await db();
  const pi = d.plansVinif.find((p) => p.nom === 'Vinification en blanc (essai)');
  ok('… enregistré : étapes, section, note, doses réunies par revendication', !!pi && pi.lignes.length === 6 && pi.lignes[2].type === 'section' && pi.lignes[3].type === 'note' && pi.lignes[4].etendue === 'revendication' && pi.aVerifier === true, pi && pi.lignes.map((l) => [l.type, l.etendue, l.etape]));
  // appliquer à un lot
  await page.locator('main [role=tab]', { hasText: 'Appliquer à un lot' }).click(); await page.waitForTimeout(300);
  const optLot = await page.locator('[data-planv-choix-lot] option').evaluateAll((L) => L.map((o) => o.value).filter(Boolean));
  await page.locator('[data-planv-choix-lot]').selectOption(optLot[0]); await page.waitForTimeout(300);
  for (const [lab, i] of [['Groupe de cépages', 1], ['Revendication', 1], ['Fraction', 1]]) { const s = page.locator(`[data-planv-lot] select[aria-label="${lab}"]`); if (!(await s.inputValue())) await s.selectOption({ index: i }); }
  await page.locator('[data-planv-lot] input[aria-label="Volume (hL)"]').fill('50'); await page.waitForTimeout(300);
  const fl = page.locator('[data-planv-fiche-lot]'); t = (await fl.count()) ? await txt(fl) : '';
  ok('appliquer à un lot : colonne du lot, étapes et quantités pour 50 hL (dose en g/hL → kg ou g)', (await fl.count()) === 1 && /Quantité pour le lot/i.test(t) && /\d+(,\d+)? (g|kg|mL|L)\b/.test(t), t.slice(0, 400));
  // module « plan » désactivé : les schémas restent dans Paramètres
  await page.evaluate(() => { const x = JSON.parse(localStorage.getItem('oenotrack-db-v2')); x.settings.modulesOff = ['plan']; localStorage.setItem('oenotrack-db-v2', JSON.stringify(x)); });
  await page.reload(); await page.waitForTimeout(1500);
  await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('[data-params-item="schemas"]').click(); await page.waitForTimeout(400);
  ok('module Plan désactivé : « Plan de vinification » s’affiche dans Paramètres (rien de perdu), avec une explication', (await page.locator('[data-params-rubrique="schemas"] [data-planv]').count()) === 1 && /Réglage rangé dans Vinification › Plan de vinification/.test(await txt(page.locator('main'))));
  ok('aucune erreur de page', errors.length === 0, errors);
  await browser.close();
}
// 2. clés d'accès : gestion utilisateur par utilisateur (page sécurisée, authentificateur virtuel)
{
  const { browser, page, errors, ctx } = await open({ https: true, viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const cdp = await ctx.newCDPSession(page); await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  const params = async (s) => { await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: s }).first().click(); await page.waitForTimeout(350); };
  await params('Utilisateurs & droits');
  const fa = page.locator('main [data-activation] form'); const MDP = 'Essai-2026!zz';
  await fa.locator('input[aria-label="Identifiant"]').fill('admin'); await fa.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Admin Essai');
  await fa.locator('input[aria-label="Mot de passe"]').fill(MDP); await fa.locator('input[aria-label="Confirmer le mot de passe"]').fill(MDP);
  await fa.locator('button[type=submit]').click(); await page.waitForTimeout(1800);
  await ov().locator('label', { hasText: 'J’ai noté ce code' }).locator('input').check(); await ov().locator('button:text-is("Terminer")').click(); await page.waitForTimeout(400);
  await page.locator('main button', { hasText: '+ Nouvel utilisateur' }).first().click(); await page.waitForTimeout(400);
  const f = ov(); await f.locator('input[aria-label="Identifiant"]').fill('chai'); await f.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Opérateur Essai');
  await f.locator('input[aria-label="Mot de passe provisoire"]').fill('Chai-2026!zz'); await f.locator('select[aria-label="Profil de droits"]').selectOption('pf_operateur');
  await f.locator('label', { hasText: 'À changer à la première connexion' }).locator('input').uncheck(); await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(1500);
  let d = await db(); const op = d.utilisateurs.find((u) => u.identifiant === 'chai');
  ok('appareils : un bloc par utilisateur (administrateur, opérateur)', (await page.locator('[data-appareils-utilisateur]').count()) === 2 && (await page.locator(`[data-appareils-utilisateur="${op.id}"]`).count()) === 1);
  await page.locator(`[data-cle-pour="${op.id}"]`).click(); await page.waitForTimeout(1800);
  d = await db(); let k = (d.utilisateurs.find((u) => u.id === op.id).cles || [])[0]; const adm = d.utilisateurs.find((u) => u.identifiant === 'admin');
  ok('« ＋ Enregistrer cet appareil pour ce compte » : clé rattachée à l’opérateur, ajoutée et acceptée par l’administrateur', !!k && k.uid === op.id && k.ajoutePar === adm.id && k.acceptee === true && /Appareil enregistré pour Opérateur Essai/.test((await page.locator('.toast').allInnerTexts()).join(' ')), k);
  ok('… listée sous son compte, avec « Retirer l’accès »', (await page.locator(`[data-appareils-utilisateur="${op.id}"] [data-appareil="${k.id}"] [data-cle-revoquer]`).count()) === 1);
  await page.locator(`[data-appareil="${k.id}"] [data-cle-revoquer]`).click(); await page.waitForTimeout(250); await ov().locator('button', { hasText: /^Retirer l’accès$/ }).click(); await page.waitForTimeout(500);
  d = await db(); k = d.utilisateurs.find((u) => u.id === op.id).cles[0];
  ok('« Retirer l’accès » : la clé reste listée, accès retiré (par qui, quand), « Rétablir l’accès » proposé ; journal', k.acceptee === false && k.revoquePar === adm.id && !!k.revoqueLe && (await page.locator(`[data-appareil="${k.id}"] [data-cle-retablir]`).count()) === 1 && /accès retiré/.test(await txt(page.locator(`[data-appareils-utilisateur="${op.id}"]`))) && (d.audit || []).some((a) => /Accès de l’appareil retiré/.test(a.resume)), k);
  await page.locator(`[data-appareil="${k.id}"] [data-cle-retablir]`).click(); await page.waitForTimeout(500); d = await db();
  ok('… rétabli', d.utilisateurs.find((u) => u.id === op.id).cles[0].acceptee === true && !d.utilisateurs.find((u) => u.id === op.id).cles[0].revoqueLe);
  await page.locator(`[data-cles-droit="${op.id}"]`).selectOption('non'); await page.waitForTimeout(500); d = await db();
  ok('droit d’enregistrer ses appareils : refusé pour l’opérateur (journal)', d.utilisateurs.find((u) => u.id === op.id).clesEnregistrer === false && (d.audit || []).some((a) => /Enregistrement de ses appareils : refusé/.test(a.resume)));
  // l'opérateur (mot de passe) : plus de bouton d'activation, explication
  await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(600);
  const cx = page.locator('[data-connexion]');
  await cx.locator('input[aria-label="Identifiant"]').fill('chai'); await cx.locator('input[aria-label="Mot de passe"]').fill('Chai-2026!zz'); await cx.locator('button[type=submit]').click(); await page.waitForTimeout(1500);
  await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(300);
  ok('opérateur non autorisé : pas d’activation, « demandez-le à un administrateur »', (await ov().locator('[data-mes-cles] [data-cle-ajouter]').count()) === 0 && (await ov().locator('[data-cle-interdit]').count()) === 1);
  ok('aucune erreur de page (clés d’accès)', errors.length === 0, errors);
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (t75)');
process.exitCode = ko ? 1 : 0;
