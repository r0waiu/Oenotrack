// 0.48.0-alpha.1 : Paramètres (rubriques avec icônes, groupe « Réglages des modules », langue dans Affichage, documents joints dans
// Sauvegarde, menu au téléphone : liste puis rubrique), « ⚙ Réglages » de chaque module, visite guidée (sommaire dans l'écran au téléphone,
// voile, bulle à côté d'une cible haute, parcours « L’essentiel », durée annoncée), recherche et repli dans Crus & parcelles et dans
// Listes, plan de vinification (« Tableau du plan », aide repliable), budget de temps sous ralentissement ×4, anglais. Jeu d'exemple (fictif).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const inter = (a, b) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
// ---- 1. bureau : rubriques, réglages des modules, langue, documents joints, listes, crus, plan, visite
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  await page.click('#tab-params'); await page.waitForTimeout(300);
  const groupes = await page.locator('[data-params-groupe]').evaluateAll((L) => L.map((x) => x.getAttribute('data-params-groupe')));
  ok('Paramètres : cinq groupes, « Réglages des modules » en dernier', groupes.join() === 'exploitation,vin,equipe,donnees,modules-reglages', groupes);
  const libs = await page.locator('[data-params-groupe]:not([data-params-groupe="modules-reglages"]) [data-params-item]').allInnerTexts();
  ok('… une icône devant chaque rubrique', libs.length >= 16 && libs.every((l) => /^\P{L}/u.test(l.trim())), libs);
  const reg = await page.locator('[data-params-groupe="modules-reglages"] [data-params-item]').evaluateAll((L) => L.map((x) => [x.getAttribute('data-params-item'), x.innerText.includes('↗')]));
  ok('… « Réglages des modules » : opérations, plan, barèmes, pressoir, analyses, hygiène, équipements, tous ↗', reg.map((x) => x[0]).join() === 'operations,schemas,jaugeage,reglages-pressoir,reglages-analyses,reglages-hygiene,reglages-equipements' && reg.every((x) => x[1]), reg);
  ok('… plus de rubrique ↗ dans « Vin & cuverie »', (await page.locator('[data-params-groupe="vin"] [data-params-item]', { hasText: '↗' }).count()) === 0);
  for (const [id, tab, sel] of [['reglages-pressoir', 'pressoir', '[data-pressoir]'], ['reglages-analyses', 'analyses', 'main'], ['reglages-hygiene', 'hygiene', 'main'], ['reglages-equipements', 'equipements', '[data-equipements]']]) {
    await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator(`[data-params-item="${id}"]`).click(); await page.waitForTimeout(400);
    const t = await page.locator(`${sel} [role=tab][aria-selected=true]`).first().innerText().catch(() => '');
    ok(`… ${id} → onglet ${tab}, sous-onglet « ⚙ Réglages » ouvert (le dernier)`, (await page.locator(`#tab-${tab}`).getAttribute('aria-selected')) === 'true' && /⚙ Réglages/.test(t), t);
  }
  const derniers = [];
  for (const tab of ['pressoir', 'analyses', 'hygiene', 'equipements']) { await page.click(`#tab-${tab}`); await page.waitForTimeout(300); const L = await page.locator('main [role=tablist]').first().locator('[role=tab]').allInnerTexts(); derniers.push(L[L.length - 1].trim()); }
  ok('« ⚙ Réglages » : dernier sous-onglet de Pressoir, Analyses, Hygiène, Équipements', derniers.every((x) => x === '⚙ Réglages'), derniers);
  await page.click('#tab-params'); await page.waitForTimeout(250);
  // ancien identifiant : setTab('params', 'operations') mène toujours au catalogue
  await page.locator('[data-params-item="operations"]').click(); await page.waitForTimeout(400);
  ok('« ⚙ Opérations » mène toujours au catalogue des opérations', (await page.locator('[data-ops-catalogue]').count()) === 1);
  // Société : plus de langue ni de documents joints ; région en résumé avec son lien
  await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('[data-params-item="entreprise"]').click(); await page.waitForTimeout(300);
  let t = await txt(page.locator('[data-params-rubrique]'));
  ok('Société & opérateurs : identité, région en résumé (lien), opérateurs ; plus de langue ni de documents joints', !/Langue de l’interface/.test(t) && !/Documents joints/.test(t) && (await page.locator('[data-region-societe] [data-profil-regler]').count()) === 1 && /Identité de la société/.test(t), t.slice(0, 300));
  await page.locator('[data-params-item="base"]').click(); await page.waitForTimeout(300);
  ok('Affichage & application : choix de la langue', (await page.locator('[data-langue-params] [data-langue]').count()) === 1);
  await page.locator('[data-params-item="sauvegarde"]').click(); await page.waitForTimeout(400);
  ok('Sauvegarde & Drive : documents joints (fichiers orphelins)', (await page.locator('[data-docs-joints]').count()) === 1 && /Rechercher les fichiers orphelins/.test(await txt(page.locator('[data-docs-joints]'))));
  // Listes : recherche et repli
  await page.locator('[data-params-item="listes"]').click(); await page.waitForTimeout(400);
  const h0 = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.locator('[data-listes-replier]').click(); await page.waitForTimeout(300);
  const h1 = await page.evaluate(() => document.documentElement.scrollHeight);
  ok('Listes : « Tout replier » raccourcit la page (titres et nombres restent)', h1 < h0 / 2 && (await page.locator('[data-liste-basculer][aria-expanded=false]').count()) >= 8, [h0, h1]);
  const memo = await page.evaluate(() => localStorage.getItem('oenotrack-listes-replis') || '');
  ok('… replis retenus sur cet appareil (hors de la base)', memo.includes('cepages') && !JSON.stringify(await page.evaluate(() => localStorage.getItem('oenotrack-db-v2'))).includes('listes-replis'));
  await page.locator('[data-listes-recherche]').fill('chardon'); await page.waitForTimeout(300);
  const secs = await page.locator('[data-liste-section]').evaluateAll((L) => L.map((x) => x.getAttribute('data-liste-section')));
  ok('… recherche « chardon » : seule la liste des cépages, dépliée, avec Chardonnay', secs.join() === 'cepages' && /Chardonnay/.test(await txt(page.locator('[data-liste-section="cepages"]'))), secs);
  await page.locator('[data-listes-recherche]').fill('zzzz'); await page.waitForTimeout(200);
  ok('… recherche sans résultat : message', /Aucune liste ne contient ce texte/.test(await txt(page.locator('[data-params-rubrique]'))));
  await page.locator('[data-listes-recherche]').fill(''); await page.locator('[data-listes-deplier]').click(); await page.waitForTimeout(300);
  ok('… « Tout déplier » : éditeur des revendications de nouveau visible', (await page.locator('[data-qualifs-editor] [data-qualif]').count()) >= 2);
  // Crus & parcelles : repli par département, recherche
  await page.locator('[data-params-item="crus"]').click(); await page.waitForTimeout(400);
  const deps = await page.locator('[data-crus-groupe]').evaluateAll((L) => L.map((x) => x.getAttribute('data-crus-groupe')));
  ok('Crus : regroupés par département, repliés (liste longue)', deps.length >= 3 && deps.includes('Marne') && (await page.locator('[data-crus-groupe] tbody tr').count()) === 0, deps);
  await page.locator('[data-crus-recherche]').fill('Ambonnay'); await page.waitForTimeout(300);
  ok('… recherche : le cru trouvé est affiché', (await page.locator('[data-params-rubrique] tbody tr', { hasText: 'Ambonnay' }).count()) === 1);
  await page.locator('[data-crus-recherche]').fill('sur-Marne'); await page.waitForTimeout(300);
  ok('… recherche sur plusieurs départements : groupes dépliés', (await page.locator('[data-crus-groupe]').count()) >= 2 && (await page.locator('[data-crus-groupe="Aisne"] tbody tr').count()) >= 2);
  await page.locator('[data-crus-recherche]').fill(''); await page.waitForTimeout(200);
  await page.locator('[data-crus-basculer="Aisne"]').click(); await page.waitForTimeout(200);
  ok('… un département se déplie seul', (await page.locator('[data-crus-groupe="Aisne"] tbody tr').count()) >= 2 && (await page.locator('[data-crus-groupe="Marne"] tbody tr').count()) === 0);
  await page.screenshot({ path: SC + '/shots/t96-crus.png' });
  // Plan de vinification : « Tableau du plan », aide repliable
  await page.click('#tab-plan'); await page.waitForTimeout(400);
  const subs = await page.locator('main [role=tablist]').filter({ hasText: 'Appliquer à un lot' }).locator('[role=tab]').allInnerTexts();
  ok('Plan de vinification : sous-onglets « Tableau du plan » et « Appliquer à un lot » (plus le nom du module répété)', subs.map((x) => x.trim()).join('|') === 'Tableau du plan|Appliquer à un lot', subs);
  ok('… explication dans une aide repliable, résumé visible', (await page.locator('[data-planv] details.aide[data-aide="plan-vinif"]').count()) === 1 && /adapter à chaque lot/.test(await txt(page.locator('[data-aide="plan-vinif"] summary'))));
  await page.reload(); await page.waitForTimeout(1300); await page.click('#tab-plan'); await page.waitForTimeout(400);
  ok('… repliée à la visite suivante', (await page.locator('[data-aide="plan-vinif"]').getAttribute('open')) === null);
  // ---- visite : sommaire, durée, essentiel, bulle à côté d'une cible haute
  await page.locator('[data-visite-bouton]').click(); await page.waitForTimeout(500);
  const tout = await txt(page.locator('[data-visite-tout]')); const ess = await txt(page.locator('[data-visite-essentiel]'));
  ok('visite : « Tout voir » annonce le nombre d’étapes et la durée ; « L’essentiel » aussi', /Tout voir · \d+ étapes · ~\d+ min/.test(tout) && /L’essentiel/.test(ess) && /\d+ étapes · ~\d+ min/.test(ess), [tout, ess]);
  const nEss = Number((ess.match(/(\d+) étapes/) || [])[1]);
  ok('… parcours « L’essentiel » de 8 à 10 étapes', nEss >= 8 && nEss <= 10, ess);
  await page.locator('[data-visite-essentiel]').click();
  const vus = []; let fin = false;
  for (let i = 0; i < 14; i += 1) {
    await page.waitForSelector('.visite-bulle', { timeout: 6000 }).catch(() => {}); await page.waitForTimeout(150);
    if (await page.locator('[data-visite-sommaire]').count()) { fin = true; break; }
    vus.push(await page.locator('[data-visite-chap]').getAttribute('data-visite-chap'));
    await page.locator('[data-visite-suivant]').click();
  }
  ok('… « L’essentiel » parcouru jusqu’au bout (cuverie, opérations, paramètres…)', fin && vus.length === nEss && ['cuverie', 'ops', 'params'].every((c) => vus.includes(c)), vus);
  await page.locator('[data-visite-chapitre="params"]').click(); await page.waitForTimeout(1300);
  let bul = await page.locator('.visite-bulle').boundingBox(); let halo = await page.locator('.visite-cible').boundingBox();
  ok('… cible plus haute que l’écran (rubriques de Paramètres) : bulle à côté, sans la recouvrir', halo && bul && halo.height > 600 && !inter(bul, halo) && ['droite', 'gauche'].includes(await page.locator('.visite-bulle').getAttribute('data-visite-cote')), { bul, halo });
  await page.screenshot({ path: SC + '/shots/t96-visite-cote.png' });
  await page.locator('[data-visite-retour]').click(); await page.waitForTimeout(300);
  await page.locator('[data-visite-chapitre="ops"]').click(); await page.waitForTimeout(1300);
  bul = await page.locator('.visite-bulle').boundingBox(); halo = await page.locator('.visite-cible').boundingBox();
  ok('… « Saisir une opération » : bouton « ＋ Nouvelle opération » (ou familles) mis en avant, bulle hors du halo', halo && bul && !inter(bul, halo), { bul, halo });
  for (let i = 0; i < 3; i += 1) { await page.locator('[data-visite-suivant]').click(); await page.waitForTimeout(900); }
  const b3 = await page.locator('.visite-bulle').boundingBox(); const h3 = await page.locator('.visite-cible').boundingBox();
  ok('… catalogue des opérations : petite cible (pas toute la page), halo dans l’écran, bulle hors du halo', h3 && h3.height < 600 && h3.y >= 0 && h3.y + h3.height <= 900 && !inter(b3, h3), { b3, h3 });
  await page.locator('[data-visite-retour]').click(); await page.waitForTimeout(300);
  await page.locator('[data-visite-voile]').click({ position: { x: 20, y: 20 } }); await page.waitForTimeout(300);
  ok('… toucher le voile ferme le sommaire', (await page.locator('.visite').count()) === 0);
  ok('aucune erreur (bureau)', errors.length === 0, errors);
  await browser.close();
}
// ---- 2. téléphone : menu des rubriques, visite
{
  const { browser, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
  await page.click('#tab-params'); await page.waitForTimeout(400);
  ok('téléphone : Paramètres s’ouvre sur la liste des rubriques (toutes visibles, pas de défilement horizontal)', (await page.locator('[data-params-vue-tel="liste"]').count()) === 1 && (await page.locator('[data-params-rubrique]').isVisible()) === false
    && (await page.locator('[data-params-item="campagnes"]').isVisible()) && (await page.locator('[data-params-item="crus"]').isVisible()) && (await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)));
  await page.locator('[data-params-item="crus"]').click(); await page.waitForTimeout(400);
  ok('… une rubrique choisie : liste masquée, contenu et « ‹ Rubriques »', (await page.locator('[data-params-menu]').isVisible()) === false && (await page.locator('[data-crus-recherche]').isVisible()) && /Crus & parcelles/.test(await txt(page.locator('.params-retour'))));
  await page.screenshot({ path: SC + '/shots/t96-tel-crus.png' });
  await page.locator('[data-params-retour]').click(); await page.waitForTimeout(300);
  ok('… « ‹ Rubriques » : retour à la liste', await page.locator('[data-params-item="listes"]').isVisible());
  await page.screenshot({ path: SC + '/shots/t96-tel-menu.png', fullPage: true });
  await page.locator('[data-visite-bouton]').click(); await page.waitForTimeout(600);
  const vh = 844; const s = await page.locator('[data-visite-sommaire] .visite-bulle').boundingBox();
  const bt = await page.locator('[data-visite-tout]').boundingBox(); const bf = await page.locator('[data-visite-sommaire] [data-visite-passer]').boundingBox();
  ok('visite au téléphone : sommaire dans l’écran, « Tout voir » et « Fermer » visibles', s.y >= 0 && s.y + s.height <= vh && bt.y + bt.height <= vh && bf.y + bf.height <= vh && bt.y >= 0, { s, bt, bf });
  await page.screenshot({ path: SC + '/shots/t96-tel-sommaire.png' });
  await page.locator('[data-visite-tout]').click(); await page.waitForTimeout(1200);
  ok('… « Tout voir » cliquable : étape 1', (await page.locator('[data-visite="1"]').count()) === 1);
  await page.locator('[data-visite-retour]').click(); await page.waitForTimeout(300);
  await page.locator('[data-visite-sommaire] [data-visite-passer]').click(); await page.waitForTimeout(300);
  ok('… « Fermer » cliquable', (await page.locator('.visite').count()) === 0);
  await page.locator('[data-visite-bouton]').click(); await page.waitForTimeout(500);
  await page.locator('[data-visite-chapitre="tirage"]').click(); await page.waitForTimeout(1500);
  const b = await page.locator('.visite-bulle').boundingBox();
  ok('… étape au téléphone : bulle entièrement dans l’écran (feuille basse si la cible est haute)', b && b.y >= 0 && b.y + b.height <= vh + 1 && b.x >= 0 && b.x + b.width <= 391, b);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('aucune erreur (téléphone)', errors.length === 0, errors);
  await browser.close();
}
// ---- 3. budget de temps : changement d'onglet sous ralentissement du processeur ×4 (téléphone)
{
  const { browser, page, errors, ctx } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const mesure = (sel) => page.evaluate(async (s) => { const el = document.querySelector(s); if (!el) return -1; const t0 = performance.now(); el.click(); await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))); return Math.round(performance.now() - t0); }, sel);
  const T = {};
  const onglets = await page.locator('nav [id^="tab-"]').evaluateAll((L) => L.filter((x) => x.getClientRects().length).map((x) => x.id));
  for (const id of onglets) { T[id] = await mesure(`#${id}`); await page.waitForTimeout(250); }
  await page.click('#tab-params'); await page.waitForTimeout(300);
  for (const id of ['listes', 'crus', 'entreprise', 'sauvegarde']) { T[`params:${id}`] = await mesure(`[data-params-item="${id}"]`); await page.waitForTimeout(250); await page.locator('[data-params-retour]').click(); await page.waitForTimeout(200); }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const lents = Object.entries(T).filter(([, v]) => v > 500 || v < 0);
  console.log('   temps (ms, ×4) :', JSON.stringify(T));
  ok('budget : chaque changement d’onglet et de rubrique en moins de 500 ms sous ralentissement ×4', onglets.length >= 8 && !lents.length, lents);
  ok('aucune erreur (budget)', errors.length === 0, errors);
  await browser.close();
}
// ---- 4. anglais
{
  const { browser, page, errors } = await open({ init: { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" }, viewport: { width: 1280, height: 900 } });
  await page.click('#tab-params'); await page.waitForTimeout(400);
  const t = await txt(page.locator('[data-params-menu]'));
  ok('en anglais : « Module settings », rubriques traduites', /Module settings/i.test(t) && /Company & operators/i.test(t) && /Seasons/i.test(t) && !/Réglages des modules/.test(t), t.slice(0, 600));
  await page.locator('[data-params-item="listes"]').click(); await page.waitForTimeout(400);
  const l = await txt(page.locator('[data-listes-outils]'));
  ok('… listes : « Collapse all », « Expand all »', /Collapse all/.test(l) && /Expand all/.test(l), l);
  await page.locator('[data-params-item="crus"]').click(); await page.waitForTimeout(400);
  ok('… crus : « departments »', /departments/i.test(await txt(page.locator('[data-crus-replis]'))));
  await page.click('#tab-pressoir'); await page.waitForTimeout(300);
  ok('… « ⚙ Settings » dans Pressoir', /⚙ Settings/.test(await txt(page.locator('[data-pressoir] [role=tablist]').first())));
  await page.click('#tab-plan'); await page.waitForTimeout(300);
  ok('… « Plan table »', /Plan table/.test(await txt(page.locator('main [role=tablist]').filter({ hasText: /Apply to a lot/ }).first())));
  await page.locator('[data-visite-bouton]').click(); await page.waitForTimeout(500);
  const v = await txt(page.locator('[data-visite-sommaire]'));
  ok('… visite : « The essentials », « See everything · n steps · ~m min »', /The essentials/.test(v) && /See everything · \d+ steps · ~\d+ min/.test(v), v.slice(0, 400));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
if (ko) { console.log(`✗ ${ko} échec(s)`); process.exitCode = 1; } else console.log('t96 : tout est bon');
