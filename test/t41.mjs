// 0.20.0-alpha.1 : Intrants › Fiches FT & FDS — dépôt groupé (lecture, produit reconnu, date de révision), remplacement avec archivage,
// doublon ignoré, lien fournisseur, FDS non requise ; assistant IA avec la clé de l'utilisateur (réglages, liste des modèles, test,
// identification d'un document, veille en ligne, erreurs) — services d'IA simulés ; clé jamais dans la base ; téléphone
import { open } from './ui.mjs'; import fs from 'fs'; import path from 'path';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
const FX = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'intrants');
const PDFJS = '/opt/npm-tools/node_modules/pdfjs-dist/build/';
const IA = { mode: 'ok', appels: [] };
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
const json = (route, o, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: cors, body: JSON.stringify(o) });
const routes = async (route, u) => {
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'pdf.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && /\/(wasm|standard_fonts|cmaps)\//.test(u)) { const f = '/opt/npm-tools/node_modules/pdfjs-dist/' + u.split('pdfjs-dist@6.2.108/')[1]; if (fs.existsSync(f)) { await route.fulfill({ body: fs.readFileSync(f), contentType: f.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream' }); return true; } }
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.worker.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'pdf.worker.min.mjs', 'utf8') }); return true; }
  if (u.startsWith('https://api.anthropic.com/')) {
    const rq = route.request(); if (rq.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return true; }
    IA.appels.push({ url: u, headers: rq.headers(), body: rq.postData() || '' });
    if (IA.mode === 'refus') { await json(route, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }, 401); return true; }
    if (u.includes('/v1/models')) { await json(route, { data: [{ id: 'claude-sonnet-5-5', display_name: 'Claude Sonnet 5.5' }, { id: 'claude-haiku-5-5', display_name: 'Claude Haiku 5.5' }] }); return true; }
    const b = JSON.parse(rq.postData() || '{}'); const txt = (b.messages || [])[0] ? b.messages[0].content : '';
    if (/Test de connexion/.test(txt)) { await json(route, { content: [{ type: 'text', text: 'Connexion réussie — claude-sonnet-5-5' }], stop_reason: 'end_turn' }); return true; }
    if (b.tools) { // veille : page, FDS plus récente, sources
      await json(route, { stop_reason: 'end_turn', content: [{ type: 'server_tool_use', id: 's1', name: 'web_search', input: { query: 'metabisulfite FDS' } },
        { type: 'web_search_tool_result', tool_use_id: 's1', content: [{ type: 'web_search_result', url: 'https://www.demo-oenologie.fr/metabisulfite', title: 'Métabisulfite — Démo Œnologie' }, { type: 'web_search_result', url: 'https://www.demo-oenologie.fr/fds/metabisulfite.pdf', title: 'FDS' }] },
        { type: 'text', text: '```json\n{"page": "https://www.demo-oenologie.fr/metabisulfite", "fds": {"url": "https://www.demo-oenologie.fr/fds/metabisulfite.pdf", "date": "2026-06-01", "version": "3"}, "ft": {"url": null, "date": null}, "fabricant": "Démo Œnologie SAS", "remarque": "FDS mise à jour en juin 2026."}\n```' }] });
      return true;
    }
    const m = /(P\d+) \| Gélatine liquide/.exec(txt); // identification : le document « CLARIFIANT XR-200 » est rattaché à la gélatine
    await json(route, { stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify({ type: 'fds', code: m ? m[1] : null, nomProduit: 'CLARIFIANT XR-200', fabricant: 'Démo Colles SAS', dateRevision: '2025-06-20', version: '4', confiance: 0.82 }) }] });
    return true;
  }
  return false;
};
const { browser, page, errors } = await open({ routes, viewport: { width: 1440, height: 950 } });
const top = () => page.locator('.overlay').last(); const log = (...a) => console.log(...a); const ok = (n, c, x) => log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined ? x : '');
const dbj = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const toast = async () => page.locator('.toast').last().innerText().catch(() => '');
const fiches = async () => { await page.click('#tab-intrants'); await page.waitForTimeout(250); await page.locator('main [role=tab]', { hasText: 'Fiches FT & FDS' }).click(); await page.waitForTimeout(350); };
const ligne = (nom) => page.locator('main table tbody tr').filter({ has: page.locator('td:first-child button', { hasText: new RegExp(`^${nom.replace(/[()]/g, '\\$&')}$`) }) });
const carte = (fichier) => top().locator(`[data-fiche-depot="${fichier}"]`);
const lus = async (n) => { for (let i = 0; i < 80; i += 1) { const t = await top().locator('[data-fiche-depot]').allInnerTexts(); if (t.length === n && t.every((x) => !/en attente|lecture…/.test(x))) return true; await page.waitForTimeout(250); } return false; };
const produitDe = async (fichier) => (await carte(fichier).locator('input[aria-label^="Produit — "], select[aria-label^="Produit — "]').first().inputValue().catch(() => ''));

// 1. réglages de l'assistant IA : service, clé (sur l'appareil), liste des modèles, test
await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main [role=tab]', { hasText: 'Assistant IA' }).click(); await page.waitForTimeout(300);
ok('réglages : « votre IA, votre clé », 6 services proposés', /Votre IA, avec votre propre compte/.test(await page.locator('main').innerText()) && (await page.locator('select[aria-label="Service d’IA"] option').count()) === 6);
await page.locator('input[aria-label="Clé API Claude"]').fill('sk-ant-test-CLE-SECRETE-42'); await page.waitForTimeout(150);
await page.locator('button', { hasText: 'Charger la liste des modèles' }).click(); await page.waitForTimeout(500);
ok('liste des modèles chargée avec la clé (en-têtes navigateur)', /2 modèles disponibles/.test(await toast()) && (await page.locator('#ia-modeles option').count()) === 2 && IA.appels.some((a) => a.url.includes('/v1/models') && a.headers['x-api-key'] === 'sk-ant-test-CLE-SECRETE-42' && a.headers['anthropic-dangerous-direct-browser-access'] === 'true'));
await page.locator('button', { hasText: 'Tester la connexion' }).click(); await page.waitForTimeout(600);
ok('test de connexion réussi', /Connexion réussie/.test(await page.locator('main').innerText()));
const ls = await page.evaluate(() => ({ ia: localStorage.getItem('oenotrack-ia'), db: localStorage.getItem('oenotrack-db-v2') }));
ok('clé gardée sur l’appareil seulement (jamais dans la base)', /CLE-SECRETE/.test(ls.ia) && !/CLE-SECRETE/.test(ls.db || ''));
await page.screenshot({ path: SC + '/shots/t41-reglages-ia.png', fullPage: true });

// 2. onglet Fiches FT & FDS : alertes de départ
await fiches(); const kpi0 = await page.locator('main').innerText();
const d0 = await dbj(); const manq0 = d0.produits.filter((p) => p.categorie !== 'sec').length;
ok('alertes : toutes les FDS manquantes au départ, matières sèches sans objet', new RegExp(`FDS MANQUANTES\\s*${manq0}`, 'i').test(kpi0) && (await ligne('Muselet').innerText()).includes('FDS sans objet'), manq0);
// 3. dépôt groupé
await page.locator('input[aria-label="Fiches techniques et FDS à déposer"]').setInputFiles(['FDS_metabisulfite_2021.pdf', 'FT Bentonite sodique.pdf', 'fds_enzyme_pectolytique.pdf', 'SDS_XR-200.pdf', 'FDS peracetique.pdf'].map((f) => path.join(FX, f)));
ok('cinq documents lus', await lus(5));
const so2 = await produitDe('FDS_metabisulfite_2021.pdf'); const ben = await produitDe('FT Bentonite sodique.pdf'); const enz = await produitDe('fds_enzyme_pectolytique.pdf'); const per = await produitDe('FDS peracetique.pdf'); const xr = await produitDe('SDS_XR-200.pdf');
ok('produits reconnus : métabisulfite, bentonite, enzyme, produit d’hygiène ; XR-200 à choisir', /^Métabisulfite de potassium — reconnu/.test(so2) && /^Bentonite sodique/.test(ben) && /^Enzyme pectolytique/.test(enz) && /Acide peracétique 5 %/.test(per) && xr === '', [so2, ben, enz, per, xr]);
ok('types et dates de révision lus', (await carte('FDS_metabisulfite_2021.pdf').locator('input[type=date]').inputValue()) === '2021-05-10' && (await carte('FT Bentonite sodique.pdf').locator('select[aria-label^="Type de document"]').inputValue()) === 'ft' && (await carte('FT Bentonite sodique.pdf').locator('input[type=date]').inputValue()) === '2023-09-05' && (await carte('FDS_metabisulfite_2021.pdf').locator('input[aria-label^="Version"]').inputValue()) === '1');
ok('XR-200 non rattaché : « produit à choisir », bouton IA proposé', /produit à choisir/.test(await carte('SDS_XR-200.pdf').innerText()) && (await top().locator('button', { hasText: /Identifier avec l’IA \(\d\)/ }).count()) === 1);
await page.screenshot({ path: SC + '/shots/t41-depot-revue.png', fullPage: false });
// 4. identification par l'IA (simulée) : le document est rattaché à la gélatine, daté
IA.appels.length = 0; await top().locator('button', { hasText: /Identifier avec l’IA/ }).click(); await page.waitForTimeout(1200);
const idn = IA.appels.find((a) => a.url.endsWith('/v1/messages')); const corps = idn ? JSON.parse(idn.body) : {};
ok('IA : début du texte et liste des produits envoyés, rien d’autre', !!idn && /CLARIFIANT XR-200/.test(corps.messages[0].content) && /\| Gélatine liquide \|/.test(corps.messages[0].content) && !corps.tools && !/Cuve|cuve 0/.test(corps.messages[0].content));
ok('IA : document identifié (produit, date, confiance), à vérifier', /^Gélatine liquide/.test(await produitDe('SDS_XR-200.pdf')) && (await carte('SDS_XR-200.pdf').locator('input[type=date]').inputValue()) === '2025-06-20' && /Identifié par Claude \(confiance 82 %\)/.test(await carte('SDS_XR-200.pdf').innerText()));
await top().locator('button', { hasText: /^Joindre 5 documents$/ }).click(); await page.waitForTimeout(700);
ok('cinq documents joints', /5 documents joints/.test(await toast()), await toast());
let d1 = await dbj(); const P = (d, nom) => d.produits.find((p) => p.nom === nom);
ok('FDS du métabisulfite jointe et datée (plus de 3 ans), FT de la bentonite', /FDS du 10\/05\/2021 \(plus de 3 ans\)/.test(await ligne('Métabisulfite de potassium').innerText()) && /FT du 05\/09\/2023/.test(await ligne('Bentonite sodique').innerText()) && P(d1, 'Métabisulfite de potassium').fdsDate === '2021-05-10');
ok('FDS de l’hygiène rangée sur le produit d’hygiène', d1.docs.some((x) => x.cible.type === 'produitHygiene' && x.nom === 'FDS peracetique.pdf' && x.revision === '2024-09-07'));
ok('fichiers rangés dans ce navigateur', await page.evaluate(async () => { const ids = JSON.parse(localStorage.getItem('oenotrack-db-v2')).docs.filter((x) => x.cible.type === 'produit').map((x) => x.id); const db = await new Promise((r) => { const q = indexedDB.open('oenotrack-docs', 1); q.onsuccess = () => r(q.result); }); const keys = await new Promise((r) => { const q = db.transaction('fichiers').objectStore('fichiers').getAllKeys(); q.onsuccess = () => r(q.result); }); return ids.length === 4 && ids.every((i) => keys.includes(i)); }));
// 5. nouvelle version : remplace l'ancienne, archivée
await page.locator('input[aria-label="Fiches techniques et FDS à déposer"]').setInputFiles(path.join(FX, 'FDS-METABISULFITE-2025.pdf')); await lus(1);
ok('nouvelle version : « remplacer », l’ancienne archivée', (await carte('FDS-METABISULFITE-2025.pdf').locator('select[aria-label^="Action"]').inputValue()) === 'remplacer' && /plus récente que la version jointe \(10\/05\/2021\)/.test(await carte('FDS-METABISULFITE-2025.pdf').innerText()));
await top().locator('button', { hasText: /^Joindre 1 document$/ }).click(); await page.waitForTimeout(600);
ok('remplacée : FDS du 14/02/2025 en vigueur, ancienne version archivée', /1 ancienne version archivée/.test(await toast()) && /FDS du 14\/02\/2025/.test(await ligne('Métabisulfite de potassium').innerText()), await toast());
await ligne('Métabisulfite de potassium').locator('button[aria-label^="Documents"]').click(); await page.waitForTimeout(300);
ok('documents : version en vigueur datée, version précédente archivée', (await top().locator('[data-docs-panel] > ul > li').count()) === 1 && /rév\. 14\/02\/2025 · v2/.test(await top().locator('[data-docs-panel] > ul').innerText()) && /Versions précédentes archivées\s*1/.test(await top().locator('[data-docs-archives]').innerText()));
// le même fichier déposé à nouveau : ignoré
await top().locator('input[aria-label="Fichiers à joindre"]').setInputFiles(path.join(FX, 'FDS_metabisulfite_2021.pdf')); await page.waitForTimeout(300); await lus(1);
ok('fichier déjà joint (version archivée) : « ne pas joindre »', (await carte('FDS_metabisulfite_2021.pdf').locator('select[aria-label^="Action"]').inputValue()) === 'ignorer' && /déjà joint/.test(await carte('FDS_metabisulfite_2021.pdf').innerText()) && (await top().locator('button', { hasText: /^Joindre 0 document$/ }).isDisabled()));
await page.keyboard.press('Escape'); await page.waitForTimeout(200); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// 6. fiche de l'intrant : lien fournisseur, référence, FDS non requise
await ligne('Métabisulfite de potassium').locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(300);
await top().locator('input[aria-label="Lien vers la page du produit"]').fill('www.demo-oenologie.fr/metabisulfite'); await top().locator('input[placeholder="ex. 30210"]').fill('SK-25');
ok('lien : « Ouvrir » et « Chercher » proposés', (await top().locator('a', { hasText: 'Ouvrir' }).getAttribute('href')) === 'https://www.demo-oenologie.fr/metabisulfite' && /google\.com\/search\?q=/.test(await top().locator('a', { hasText: 'Chercher' }).getAttribute('href')));
await top().locator('button', { hasText: /^Enregistrer$/ }).click(); await page.waitForTimeout(400);
d1 = await dbj(); ok('lien et référence enregistrés', P(d1, 'Métabisulfite de potassium').lien === 'https://www.demo-oenologie.fr/metabisulfite' && P(d1, 'Métabisulfite de potassium').reference === 'SK-25' && /demo-oenologie\.fr\/…/.test(await ligne('Métabisulfite de potassium').innerText()));
await ligne('Sucre de canne').locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(300);
await top().locator('label', { hasText: 'FDS non requise' }).locator('input').check(); await top().locator('button', { hasText: /^Enregistrer$/ }).click(); await page.waitForTimeout(400);
ok('« FDS non requise » : plus d’alerte', /FDS non requise/.test(await ligne('Sucre de canne').innerText()));
// 7. veille en ligne (IA simulée) : nouvelle version repérée
IA.appels.length = 0; await ligne('Métabisulfite de potassium').locator('[data-veille]').click(); await page.waitForTimeout(300);
await top().locator('button', { hasText: 'Vérifier en ligne avec Claude' }).click(); await page.waitForTimeout(1500);
const ve = IA.appels.find((a) => a.url.endsWith('/v1/messages')); const vb = ve ? JSON.parse(ve.body) : {};
ok('veille : recherche web demandée, produit + fournisseur + référence + date envoyés', !!ve && vb.tools && vb.tools[0].type === 'web_search_20250305' && /Métabisulfite de potassium/.test(vb.messages[0].content) && /Sofralab/.test(vb.messages[0].content) && /SK-25/.test(vb.messages[0].content) && /2025-02-14/.test(vb.messages[0].content));
const vtxt = await top().locator('[data-veille-resultat]').innerText().catch(() => '');
ok('veille : FDS en ligne plus récente signalée, liens vérifiés dans les sources', /FDS du 01\/06\/2026 en ligne/.test(vtxt) && /plus récente que la vôtre \(14\/02\/2025\)/.test(vtxt) && /révision du 01\/06\/2026, version 3/.test(vtxt) && (await top().locator('[data-veille-resultat] .chip-ok', { hasText: 'vue' }).count()) === 2 && /FDS mise à jour en juin 2026/.test(vtxt), vtxt.slice(0, 300));
await page.screenshot({ path: SC + '/shots/t41-veille.png', fullPage: false });
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
ok('tableau : « FDS du 01/06/2026 en ligne », indicateur « nouvelles versions »', /FDS du 01\/06\/2026 en ligne/.test(await ligne('Métabisulfite de potassium').innerText()) && /NOUVELLES VERSIONS EN LIGNE\s*1/i.test(await page.locator('main').innerText()));
// vérification groupée sur le filtre « Nouvelle version en ligne » (un produit : pas de confirmation)
await page.locator('select[aria-label="Filtre des fiches"]').selectOption('nouvelle'); await page.waitForTimeout(250);
ok('filtre « Nouvelle version en ligne »', (await page.locator('main table tbody tr').count()) === 1);
await page.locator('main button', { hasText: /Vérifier en ligne \(1\)/ }).click(); await page.waitForTimeout(1500);
ok('vérification groupée terminée', /Vérification terminée : 1 produit/.test(await page.locator('main').innerText()) && /1 nouvelle version à télécharger/.test(await page.locator('main').innerText()));
// clé refusée : message clair, arrêt
IA.mode = 'refus'; await page.locator('main button', { hasText: /Vérifier en ligne \(1\)/ }).click(); await page.waitForTimeout(1200);
ok('clé refusée : vérification interrompue, message clair', /Vérification interrompue/.test(await page.locator('main').innerText()) && /Claude refuse la clé API \(401\)/.test(await page.locator('main').innerText()));
IA.mode = 'ok'; await page.locator('select[aria-label="Filtre des fiches"]').selectOption('tous'); await page.waitForTimeout(200);
await page.screenshot({ path: SC + '/shots/t41-onglet.png', fullPage: false });
// dossier entier : tous ses documents sont proposés à la revue
await page.locator('input[aria-label="Dossier de fiches à déposer"]').setInputFiles(FX); await page.waitForTimeout(400);
const nDossier = fs.readdirSync(FX).filter((f) => /\.(pdf|txt)$/i.test(f)).length;
ok('dossier choisi : tous ses documents lus', await lus(nDossier), nDossier);
ok('dossier : FDS de lysozyme (texte) reconnue, fichiers déjà joints ignorés', /^Lysozyme/.test(await produitDe('fds-demo-lysozyme.txt')) && (await carte('FT Bentonite sodique.pdf').locator('select[aria-label^="Action"]').inputValue()) === 'ignorer');
await top().locator('button', { hasText: /^Annuler$/ }).click(); await page.waitForTimeout(250);
// 8. hygiène : la FDS déposée compte pour le produit d'hygiène
await page.click('#tab-hygiene'); await page.waitForTimeout(250); await page.locator('main [role=tab]', { hasText: 'Produits d’hygiène' }).click(); await page.waitForTimeout(300);
ok('hygiène : FDS du 07/09/2024 sur l’acide peracétique', /FDS du 07\/09\/2024/.test(await page.locator('main table tbody tr', { hasText: 'Acide peracétique 5 %' }).innerText()));
const errs = errors.filter((e) => !/status of 401/.test(e)); // la clé refusée (401) est voulue
ok('aucune erreur de page', !errs.length, errs.slice(0, 3));
await browser.close();

// 9. téléphone : cartes lisibles, pas de défilement horizontal
{
  const { browser: b2, page: p2, errors: e2 } = await open({ routes, viewport: { width: 390, height: 844 }, mobile: true });
  await p2.click('#tab-intrants'); await p2.waitForTimeout(250); await p2.locator('main [role=tab]', { hasText: 'Fiches FT & FDS' }).click(); await p2.waitForTimeout(350);
  const larg = await p2.evaluate(() => document.documentElement.scrollWidth); const cartes = await p2.locator('[data-fiche-produit]').count();
  ok('téléphone : une carte par intrant, pas de défilement horizontal', cartes >= 10 && larg <= 392, `${cartes} cartes, ${larg} px`);
  await p2.locator('input[aria-label="Fiches techniques et FDS à déposer"]').setInputFiles([path.join(FX, 'FT Bentonite sodique.pdf')]); await p2.waitForTimeout(300);
  for (let i = 0; i < 60 && /lecture…|en attente/.test(await p2.locator('.overlay').last().innerText()); i += 1) await p2.waitForTimeout(250);
  const lw = await p2.evaluate(() => { const s = document.querySelector('.overlay .sheet'); return s ? s.scrollWidth <= s.clientWidth + 2 : false; });
  ok('téléphone : revue du dépôt lisible', lw && /Bentonite sodique/.test(await p2.locator('.overlay').last().locator('input[aria-label^="Produit — "]').inputValue()));
  await p2.screenshot({ path: SC + '/shots/t41-mobile.png', fullPage: false });
  ok('téléphone : aucune erreur', !e2.length, e2.slice(0, 2));
  await b2.close();
}
