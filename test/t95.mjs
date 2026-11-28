// 0.48.0-alpha.1 : modules (audit d'interface U07, U08, U13, U23, U25, U28, U32, U33) — préparations créées dans Tirages › Préparer
// (pied de cuve compris) et lien depuis « Tirer » ; recherche unique de la Traçabilité filtrée par pastilles (anciens sous-onglets,
// recherche reprise de l'en-tête) ; calculateur de tirage sans reproche avant saisie ; « 🖨 Imprimer / PDF » des listes de Cave,
// Dégorgement et Hygiène, sommaire des documents imprimables ; noms complets des cartes d'hygiène ; aides repliables ; téléphone
// (tableaux en cartes, première colonne figée, pas de débordement) ; anglais (mots français interdits). Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const sous = async (page, re) => { await page.locator('main [role=tablist]').first().locator('[role=tab]', { hasText: re }).first().click(); await page.waitForTimeout(400); };
const choisi = async (page, id) => (await page.locator(`#tab-${id}`).getAttribute('aria-selected')) === 'true';
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last();
  // ---- U13 : calculateur de tirage
  await page.click('#tab-tirage'); await page.waitForTimeout(400); await sous(page, /Préparer/);
  const calc = page.locator('[data-tirage-calcul]');
  let t = await txt(calc);
  ok('U13 : avant toute saisie, aide neutre (« Choisissez le point de tirage… »), aucun reproche', /Choisissez le point de tirage de la cuvée pour lancer le calcul/.test(t) && !/Indiquez le point de tirage/.test(t), t.slice(0, 400));
  await calc.getByLabel('Cols 1').fill('6000'); await page.waitForTimeout(250);
  ok('… après une saisie de cols sans point de tirage : le point est demandé', /Indiquez le point de tirage de la cuvée/.test(await txt(calc)));
  await calc.getByLabel('Point de tirage de la cuvée (g/L)').fill('24'); await page.waitForTimeout(250);
  ok('… avec le point de tirage : calcul affiché', (await calc.locator('[data-calc="mix"]').count()) === 1);
  // ---- U07 : préparations dans « Préparer »
  t = await txt(page.locator('[data-tirage-preparer]'));
  ok('U07 : Préparer crée levains, liqueurs et pieds de cuve (« ＋ Pied de cuve malolactique »)', /＋ Levain/.test(t) && /＋ Fonte de liqueur/.test(t) && /＋ Pied de cuve malolactique/.test(t) && (await page.locator('[data-pieds-cuve]').count()) === 1, t.slice(0, 300));
  await page.locator('[data-pieds-cuve] button', { hasText: 'Pied de cuve malolactique' }).click(); await page.waitForTimeout(400);
  ok('… le bouton ouvre le formulaire de préparation (pied de cuve malolactique)', /Pied de cuve malolactique/.test(await txt(ov())));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  t = await txt(page.locator('[data-liqueurs-tirage]'));
  ok('… liqueurs de tirage modifiables depuis Préparer (ou campagne figée signalée), lots servis', /Modifier|figée/.test(t) && /Utilisée pour/i.test(t), t.slice(0, 300));
  await sous(page, /Tirer/);
  t = await txt(page.locator('main'));
  ok('U07 : « Tirer » sans boutons de préparation ni second tableau des préparations', !/\+ Levain levurien|\+ Liqueur de tirage|\+ Pied de cuve/.test(t) && !/Préparations \(levain, pied de cuve/.test(t) && /Tirages \(mixtions\)/.test(t), t.slice(0, 500));
  const lien = page.locator('[data-preparations-lien] button');
  ok('… un lien « Préparations disponibles (n) → Préparer »', /^Préparations disponibles \(\d+\) → Préparer$/.test((await lien.innerText()).trim()), await lien.innerText());
  await lien.click(); await page.waitForTimeout(400);
  ok('… le lien ouvre « Préparer »', (await page.locator('[data-tirage-preparer]').count()) === 1);
  // ---- U08 : recherche unique de la Traçabilité
  await page.click('#tab-trace'); await page.waitForTimeout(500);
  const st = await txt(page.locator('main [role=tablist]').first());
  ok('U08 : cinq sous-onglets, « 🔎 Recherche » d’abord (plus de sous-onglets Intrant, Cru, Parcelle, Partenaire)', (await page.locator('main [role=tablist]').first().locator('[role=tab]').count()) === 5 && /^🔎 Recherche /.test(st) && !/Intrant \(rappel de lot\)|Cru \(village\)/.test(st), st);
  const filtres = await page.locator('[data-trace-filtre]').allInnerTexts();
  ok('… filtres en pastilles : Tout · Intrant · Cru · Parcelle · Partenaire, « Tout » choisi (toutes les étapes)', filtres.join('·') === 'Tout·Intrant·Cru·Parcelle·Partenaire' && (await page.locator('[data-trace-filtre="tout"][aria-pressed="true"]').count()) === 1 && (await page.locator('[data-trace-etapes]').count()) === 1, filtres);
  await page.click('[data-trace-filtre="intrant"]'); await page.waitForTimeout(300);
  ok('… « Intrant » : rappel de lot (choix du produit)', /Produit \(intrant\)/i.test(await txt(page.locator('main'))) && (await page.locator('[data-trace-etapes]').count()) === 0);
  await page.click('[data-trace-filtre="parcelle"]'); await page.waitForTimeout(300);
  ok('… « Parcelle » : choix de la parcelle', (await page.locator('main input[aria-label="Parcelle"]').count()) === 1);
  await page.screenshot({ path: `${SC}/shots/t95-trace-filtres.png` });
  // anciens identifiants de sous-onglet : la dernière page visitée (onglet + sous-onglet) rouvre la recherche avec le bon filtre
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="modules"]').click(); await page.waitForTimeout(400);
  await page.locator('main select[data-onglet-moment="demarrage"]').selectOption('derniere'); await page.waitForTimeout(400);
  const ouvrirSur = async (sub) => { await page.evaluate((s) => localStorage.setItem('oenotrack-derniere-page', JSON.stringify({ '': { tab: 'trace', sub: s } })), sub); await page.reload(); await page.waitForTimeout(1500); };
  for (const [sub, f] of [['cru', 'cru'], ['apporteur', 'apporteur'], ['intrant', 'intrant'], ['etapes', 'tout']]) {
    await ouvrirSur(sub);
    ok(`… setTab('trace', '${sub}') : recherche, filtre « ${f} »`, await choisi(page, 'trace') && (await page.locator(`[data-trace-filtre="${f}"][aria-pressed="true"]`).count()) === 1 && (await page.locator('main [role=tab][aria-selected="true"]').first().innerText()).includes('Recherche'));
  }
  await ouvrirSur('audit'); ok('… setTab(\'trace\', \'audit\') : mode audit', (await page.locator('[data-audits]').count()) === 1 && (await page.locator('[data-trace-filtres]').count()) === 0);
  // recherche demandée par l'en-tête (« Tout voir dans Traçabilité ») : texte repris, filtre « Tout »
  await page.click('[data-trace-filtre]').catch(() => {}); await page.click('#tab-cave'); await page.waitForTimeout(300);
  await page.evaluate(() => { if (typeof TRACE_RECHERCHE_DEMANDE !== 'undefined') TRACE_RECHERCHE_DEMANDE.q = 'pesée 1'; else window.TRACE_RECHERCHE_DEMANDE = { q: 'pesée 1' }; });
  await page.click('#tab-trace'); await page.waitForTimeout(600);
  ok('… recherche reprise de l’en-tête : texte dans le champ, résultats, filtre « Tout », reprise une seule fois', (await page.locator('input[aria-label="Rechercher une étape"]').inputValue()) === 'pesée 1' && /Pesée n° 1/.test(await txt(page.locator('[data-trace-resultats]'))) && (await page.locator('[data-trace-filtre="tout"][aria-pressed="true"]').count()) === 1
    && await page.evaluate(() => (typeof TRACE_RECHERCHE_DEMANDE !== 'undefined' ? TRACE_RECHERCHE_DEMANDE : window.TRACE_RECHERCHE_DEMANDE).q === ''));
  // ---- U32 : sommaire des documents imprimables
  await sous(page, /Rapports imprimables/);
  const nDocs = await page.locator('[data-sommaire-impression] [data-document]').count();
  t = await txt(page.locator('[data-sommaire-impression]'));
  ok('U32 : Rapports imprimables = sommaire de tous les documents (lots, contenants, plan de cave, carnet, déclarations, cave, hygiène, DRM…)', nDocs >= 20 && ['Rapport de lots', 'Plan de cave', 'Carnet de pressoir', 'Déclarations de tirage', 'Bouteilles en cave', 'Journal d’hygiène', 'DRM', 'Fiche récapitulative des intrants'].every((x) => t.includes(x)), { nDocs, t: t.slice(0, 400) });
  await page.click('[data-sommaire-lien="tirage:declarations"]'); await page.waitForTimeout(500);
  ok('… lien « Déclarations de tirage » : Tirages › Déclarations', await choisi(page, 'tirage') && (await page.locator('[data-tirage-declarations]').count()) === 1);
  await page.click('#tab-trace'); await page.waitForTimeout(400); await sous(page, /Rapports imprimables/);
  await page.click('[data-sommaire-lien="pressoir:marcs"]'); await page.waitForTimeout(500);
  ok('… lien « Carnet de pressoir » : Pressoir › Pressurages', await choisi(page, 'pressoir') && /Carnet de pressoir/.test(await txt(page.locator('main'))));
  await page.click('#tab-trace'); await page.waitForTimeout(400); await sous(page, /Rapports imprimables/);
  await page.locator('[data-document="lots"] button', { hasText: 'Choisir les lots' }).click(); await page.waitForTimeout(400);
  ok('… « Choisir les lots… » ouvre le rapport de lots', /Rapport imprimable/.test(await txt(ov()))); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // ---- U32 : « 🖨 Imprimer / PDF » des listes
  for (const [tab, nom, attendu] of [['cave', 'cave-bouteilles', /T26-01/], ['degorgement', 'degorgement', /LF-26-001/], ['hygiene', 'journal-hygiene', /Journal d’hygiène/]]) {
    await page.click(`#tab-${tab}`); await page.waitForTimeout(400);
    const b = page.locator(`main [data-imprimer-liste="${nom}"]`);
    ok(`U32 : ${tab} — « 🖨 Imprimer / PDF » en haut de la liste`, (await b.count()) === 1 && (await b.innerText()).includes('Imprimer / PDF'));
    await b.click(); await page.waitForTimeout(500);
    const r = ov().locator(`[data-liste-impression="${nom}"]`);
    t = (await r.count()) ? await txt(r) : '';
    ok(`… aperçu imprimable (en-tête, tableau) avec « 🖨 Imprimer » et « ⬇ PDF »`, attendu.test(t) && (await r.locator('table').count()) >= 1 && (await ov().locator('[data-sortie-imprimer]').count()) === 1 && (await ov().locator('[data-sortie-pdf]').count()) === 1, t.slice(0, 300));
    if (tab === 'cave') await page.screenshot({ path: `${SC}/shots/t95-cave-imprimer.png` });
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  }
  // ---- U28 : cartes d'hygiène, noms complets
  await page.click('#tab-hygiene'); await page.waitForTimeout(400);
  const cartes = await page.evaluate(() => [...document.querySelectorAll('[data-hyg-carte]')].map((c) => { const n = c.querySelector('.hyg-nom'); const ty = c.querySelector('.hyg-type'); const rn = n.getBoundingClientRect(); return { nom: n.textContent, title: n.getAttribute('title'), tronque: n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1, ellipsis: getComputedStyle(n).textOverflow === 'ellipsis' && getComputedStyle(n).whiteSpace === 'nowrap', typeDessous: !ty || ty.getBoundingClientRect().top >= rn.bottom - 1 }; }));
  // avant : 14 noms coupés sur une ligne ; désormais deux lignes, nom complet au survol (title) pour un nom plus long encore
  ok('U28 : noms d’équipements et de locaux sur deux lignes (plus coupés sur une ligne), title = nom complet, type sous le nom', cartes.length > 10 && cartes.every((x) => !x.ellipsis && x.title === x.nom && x.typeDessous) && cartes.filter((x) => x.tronque).length <= 1, cartes.filter((x) => x.tronque || x.ellipsis || !x.typeDessous || x.title !== x.nom).slice(0, 5));
  ok('… pastilles « équipement » et « local » présentes', (await page.locator('[data-hyg-carte] .hyg-type', { hasText: 'équipement' }).count()) > 0 && (await page.locator('[data-hyg-carte] .hyg-type', { hasText: 'local' }).count()) > 0);
  await page.screenshot({ path: `${SC}/shots/t95-hygiene.png` });
  // ---- U25 : aides repliables (Catalogues, Fournitures, Labels)
  await page.click('#tab-intrants'); await page.waitForTimeout(400); await sous(page, /^Catalogues/);
  const aide = (id) => page.locator(`[data-aide="${id}"]`);
  ok('U25 : Catalogues — aide « ℹ Catalogues des fournisseurs » dépliée à la première visite, résumé d’une ligne', (await aide('intrants-catalogues').count()) === 1 && (await aide('intrants-catalogues').getAttribute('open')) !== null && /Données relevées dans les catalogues/.test(await txt(aide('intrants-catalogues').locator('summary'))));
  await sous(page, /Labels/);
  ok('… Labels — aide repliable des référentiels', (await aide('labels-referentiel').count()) === 1);
  await page.click('#tab-tirage'); await page.waitForTimeout(300); await sous(page, /Fournitures/);
  ok('… Fournitures — aide repliable « Fournitures = intrants »', (await aide('tirage-fournitures').count()) === 1);
  await page.reload(); await page.waitForTimeout(1500); await page.click('#tab-intrants'); await page.waitForTimeout(400); await sous(page, /^Catalogues/);
  ok('… repliée à la visite suivante (souvenir de cet appareil)', (await aide('intrants-catalogues').getAttribute('open')) === null);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
// ---- U33 : téléphone (390 px)
{
  const { browser, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
  const deborde = () => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const cartes = (sel) => page.evaluate((s) => { const w = document.querySelector(s); if (!w) return null; const tb = w.matches('.tbl-cartes') ? w : w.querySelector('.tbl-cartes'); if (!tb) return null; const tr = tb.querySelector('tbody tr'); const th = tb.querySelector('thead'); const l = tb.querySelector('.tc-l'); const r = tr.getBoundingClientRect(); return { tr: getComputedStyle(tr).display, thead: getComputedStyle(th).display, label: l ? getComputedStyle(l).display : 'aucun', large: Math.round(r.width), droite: Math.round(r.right) }; }, sel);
  await page.click('#tab-cave'); await page.waitForTimeout(500);
  let c = await cartes('[data-vg="cave-bouteilles"]');
  ok('U33 : Cave au téléphone — bouteilles en cartes (en-têtes en libellés), dans l’écran', c && c.tr === 'flex' && c.thead === 'none' && c.label === 'block' && c.droite <= 390, c);
  ok('… mouvements en cave en cartes aussi', ((await cartes('[data-vg="cave-mouvements"]')) || {}).tr === 'flex');
  ok('… pas de défilement horizontal de la page (Cave)', (await deborde()) <= 0, await deborde());
  await page.screenshot({ path: `${SC}/shots/t95-tel-cave.png`, fullPage: true });
  await page.click('#tab-tirage'); await page.waitForTimeout(400); await page.locator('main [role=tablist]').first().locator('[role=tab]', { hasText: /Tirer/ }).click(); await page.waitForTimeout(500);
  c = await cartes('[data-tirages]');
  ok('U33 : Tirages › Tirer au téléphone — tirages en cartes, dans l’écran (plus de tableau de 1 366 px)', c && c.tr === 'flex' && c.thead === 'none' && c.droite <= 390, c);
  ok('… pas de défilement horizontal de la page (Tirages)', (await deborde()) <= 0, await deborde());
  await page.screenshot({ path: `${SC}/shots/t95-tel-tirage.png`, fullPage: true });
  await page.click('#tab-analyses'); await page.waitForTimeout(500);
  c = await cartes('[data-analyses-liste]');
  ok('U33 : Analyses au téléphone — analyses en cartes, dans l’écran', c && c.tr === 'flex' && c.thead === 'none' && c.droite <= 390, c);
  ok('… pas de défilement horizontal de la page (Analyses)', (await deborde()) <= 0, await deborde());
  await page.click('#tab-registres'); await page.waitForTimeout(400); await page.locator('main [role=tablist]').first().locator('[role=tab]', { hasText: /DRM/ }).click(); await page.waitForTimeout(600);
  const fige = (sel) => page.evaluate((s) => { const td = document.querySelector(`${s} .tbl tbody td:first-child`); return td ? getComputedStyle(td).position : null; }, sel);
  ok('U33 : DRM au téléphone — première colonne figée (sticky)', (await fige('[data-drm]')) === 'sticky', await fige('[data-drm]'));
  ok('… pas de défilement horizontal de la page (DRM : seul le tableau défile)', (await deborde()) <= 0, await deborde());
  await page.click('#tab-equipements'); await page.waitForTimeout(400); await page.locator('main [role=tablist]').first().locator('[role=tab]', { hasText: /^Maintenance/ }).click(); await page.waitForTimeout(500);
  ok('U33 : Maintenance au téléphone — première colonne figée', (await fige('[data-equipements]')) === 'sticky', await fige('[data-equipements]'));
  await page.click('#tab-trace'); await page.waitForTimeout(400);
  ok('… Traçabilité au téléphone : pastilles visibles, pas de débordement', (await page.locator('[data-trace-filtre]').count()) === 5 && (await deborde()) <= 0, await deborde());
  ok('aucune erreur dans la page (téléphone)', errors.length === 0, errors);
  await browser.close();
}
// ---- U23 : anglais — aucun mot français interdit sur les onglets des modules (« sur lattes », « sur pointes » mis à part : termes gardés)
{
  const { browser, page, errors } = await open({ init: { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" }, viewport: { width: 1360, height: 900 } });
  const INTERDITS = /Plus ancien tirage|Reprise de|mise sur pointes|Mouvements en cave|Afficher aussi|remuées|prêtes à dégorger|Nouveau dégorgement|Nouvel(le)? analyse|Nouveau (paramètre|modèle|tirage)|Paramètres & modèles|Exports CSV \/ Excel des registres|État des stocks|Préparations disponibles|lots? de tirage|Issu du lot|Utilisée pour|Liqueurs disponibles|Imprimer|Recherche|Rapport de lots|Choisir les|Toutes les étapes|Aucun|Aucune|Mixtion en cuve|se suivent|soldés?|\bdont\b|\bdes\b|\bavec\b|\bpour\b|\bdans\b|\bune\b/;
  // données (noms de produits, de lots, de partenaires, aperçu des registres) : jamais traduites, donc écartées
  const restes = (donnees) => page.evaluate(([src, d]) => { const re = new RegExp(src); const out = []; const w = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const s = n.textContent.trim(); const el = n.parentElement; if (s.length > 2 && re.test(s) && !el.closest(`[translate=no],select,option,[data-trace-resultats] b${d ? `,${d}` : ''}`) && el.getBoundingClientRect().width) out.push(s.slice(0, 100)); } return [...new Set(out)]; }, [INTERDITS.source, donnees]);
  const vues = [['tirage', /Prepare/], ['tirage', /Tirer|Tirage$|^🍾/], ['cave'], ['degorgement'], ['analyses'], ['registres', null, 'tbody'], ['trace'], ['trace', /Printable reports/]];
  for (const [tab, s, donnees] of vues) {
    await page.click(`#tab-${tab}`); await page.waitForTimeout(500);
    if (s) { await page.locator('main [role=tablist]').first().locator('[role=tab]', { hasText: s }).first().click(); await page.waitForTimeout(500); }
    const r = await restes(donnees);
    ok(`U23 : ${tab}${s ? ` (${s.source})` : ''} en anglais — aucun texte français interdit`, r.length === 0, r);
  }
  await page.click('#tab-cave'); await page.waitForTimeout(400); let t = await txt(page.locator('main'));
  ok('… Cave : « Oldest tirage », « Cellar movements », « Also show closed lots », « riddled, ready to disgorge », « sur lattes » gardé', /Oldest tirage/i.test(t) && /Cellar movements/i.test(t) && /Also show closed lots/.test(t) && /riddled, ready to disgorge/i.test(t) && /sur lattes/.test(t), t.slice(0, 600));
  await page.click('#tab-degorgement'); await page.waitForTimeout(400); t = await txt(page.locator('main'));
  ok('… Dégorgement : « New disgorging », « 🖨 Print / PDF »', /New disgorging/.test(t) && /🖨 Print \/ PDF/.test(t), t.slice(0, 500));
  await page.click('#tab-analyses'); await page.waitForTimeout(400); t = await txt(page.locator('main'));
  ok('… Analyses : « + New analysis », sous-onglet « ⚙ Settings » (0.48 : réglages des modules)', /\+ New analysis/.test(t) && /⚙ Settings/.test(t), t.slice(0, 400));
  await page.click('#tab-trace'); await page.waitForTimeout(400); t = await txt(page.locator('main'));
  ok('… Traçabilité : « 🔎 Search », filtres « All · Additive · Cru · Plot · Partner »', /🔎 Search/.test(t) && (await page.locator('[data-trace-filtre]').allInnerTexts()).join('·') === 'All·Additive·Cru·Plot·Partner', t.slice(0, 300));
  ok('aucune erreur (anglais)', errors.length === 0, errors);
  await browser.close();
}
console.log(ko ? `${ko} échec(s)` : 'tout est bon');
process.exit(ko ? 1 : 0);
