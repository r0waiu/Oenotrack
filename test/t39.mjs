// 0.18.0-alpha.1 : revendications modifiables (Paramètres), produits d'hygiène avec FDS (lecture du PDF texte et du scan), journal d'hygiène
// avec produits, fiches de sécurité imprimables, registre, base d'une version antérieure, téléphone
import { open, pick } from './ui.mjs'; import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '';
const FX = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures');
const PDFJS = '/opt/npm-tools/node_modules/pdfjs-dist/build/';
const routes = async (route, u) => {
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'pdf.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && /\/(wasm|standard_fonts|cmaps)\//.test(u)) { const f = '/opt/npm-tools/node_modules/pdfjs-dist/' + u.split('pdfjs-dist@6.2.108/')[1]; if (fs.existsSync(f)) { await route.fulfill({ body: fs.readFileSync(f), contentType: f.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream' }); return true; } }
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.worker.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'pdf.worker.min.mjs', 'utf8') }); return true; }
  if (u.includes('tesseract.js')) { await route.fulfill({ contentType: 'text/javascript', body: 'window.Tesseract={createWorker:async()=>({recognize:async(c)=>({data:{tsv:await window.__ocr(c.toDataURL("image/png"))}}),terminate:async()=>{}})};' }); return true; }
  return false;
};
fs.mkdirSync(SC + '/shots', { recursive: true });
const { browser, page, errors } = await open({ routes, viewport: { width: 1360, height: 900 } });
// reconnaissance de caractères : programme « tesseract » s'il est installé, sinon tesseract.js (Node, données « fra » locales) — mêmes réglages (psm 6)
let tessJs = null;
async function ocrTsv(f) {
  try { return execFileSync('tesseract', [f, 'stdout', '-l', 'fra', '--psm', '6', 'tsv'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString(); } catch (e) { /* programme absent : tesseract.js */ }
  if (!tessJs) { const { createRequire } = await import('module'); const T = createRequire(import.meta.url)('/opt/npm-tools/node_modules/tesseract.js'); tessJs = T.createWorker('fra', 1, { langPath: '/opt/npm-tools/node_modules/@tesseract.js-data/fra/4.0.0', cacheMethod: 'none', gzip: true }).then(async (w) => { await w.setParameters({ tessedit_pageseg_mode: '6' }); return w; }); }
  const w = await tessJs; const r = await w.recognize(f, {}, { tsv: true }); return r.data.tsv;
}
await page.exposeFunction('__ocr', async (dataUrl) => { const f = path.join(SC, `ocr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.png`); fs.writeFileSync(f, Buffer.from(dataUrl.split(',')[1], 'base64')); try { return await ocrTsv(f); } finally { fs.unlinkSync(f); } });
const top = () => page.locator('.overlay').last(); const log = (...a) => console.log(...a); const ok = (n, c, x) => log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined ? x : '');
const dbj = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const toast = async () => page.locator('.toast').last().innerText().catch(() => '');
const echap = async (n = 1) => { for (let i = 0; i < n; i += 1) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); } };

// ================= 1. revendications =================
await page.click('#tab-params'); await page.waitForTimeout(300);
await page.locator('main button', { hasText: 'Revendications, stades & listes' }).click(); await page.waitForTimeout(300);
const ed = page.locator('[data-qualifs-editor]');
ok('éditeur des revendications : 3 revendications d’origine', (await ed.locator('[data-qualif]').count()) === 3 && (await ed.innerText()).includes('FR-BIO-01'));
ok('Conventionnel : ni supprimable ni déplaçable', await ed.locator('[data-qualif="conv"] button[aria-label^="Supprimer"]').isDisabled() && await ed.locator('[data-qualif="conv"] button[aria-label^="Monter"]').isDisabled());
await ed.locator('input[aria-label="Nom de la nouvelle revendication"]').fill('HVE');
await ed.locator('select[aria-label="Rang de la nouvelle revendication"]').selectOption('conv');
ok('règles proposées : celles de la revendication juste en dessous', (await ed.locator('select[aria-label="Règles des intrants de la nouvelle revendication"]').inputValue()) === 'conv');
await ed.locator('button', { hasText: '+ Ajouter' }).click(); await page.waitForTimeout(300);
let d = await dbj();
ok('HVE ajoutée au rang 2 avec les règles de Conventionnel', d.lists.qualifs.map((q) => q.id).join() === 'conv,hve,bio,dem' && d.regles.filter((r) => r.qualifId === 'hve').length === d.regles.filter((r) => r.qualifId === 'conv').length && (await toast()).includes('reprises'), d.lists.qualifs.map((q) => q.id).join());
ok('variable de couleur posée pour la nouvelle revendication', (await page.evaluate(() => document.documentElement.style.getPropertyValue('--qhve'))).trim() === '#2f7d8c' || (await page.evaluate(() => document.documentElement.style.getPropertyValue('--qhve'))).trim().toLowerCase() === '#2f7d8c');
const nomBio = ed.locator('input[aria-label="Nom de la revendication FR-BIO-01"]'); await nomBio.fill('Agriculture biologique'); await nomBio.press('Enter'); await page.waitForTimeout(300);
const abHve = ed.locator('input[aria-label="Abréviation de HVE"]'); await abHve.fill('hve2'); await abHve.press('Enter'); await page.waitForTimeout(300);
d = await dbj(); ok('renommée et abréviation', d.lists.qualifs.find((q) => q.id === 'bio').label === 'Agriculture biologique' && d.lists.qualifs.find((q) => q.id === 'hve').court === 'HVE2');
await ed.locator('[data-qualif="hve"] button[aria-label^="Descendre"]').click(); await page.waitForTimeout(200);
d = await dbj(); ok('ordre : HVE descend au rang 3', d.lists.qualifs.map((q) => q.id).join() === 'conv,bio,hve,dem');
await ed.locator('[data-qualif="hve"] button[aria-label^="Monter"]').click(); await page.waitForTimeout(200);
ok('revendication utilisée : suppression impossible (bouton grisé)', await ed.locator('[data-qualif="bio"] button[aria-label^="Supprimer"]').isDisabled());
await page.screenshot({ path: SC + '/shots/t39-revendications.png' });
// formulaire d'apport : la nouvelle revendication est proposée ; masquée, elle ne l'est plus
await page.click('#tab-pressoir'); await page.waitForTimeout(300);
const ouvrirApport = async () => { await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(400); };
await ouvrirApport();
const optsQ = async () => top().locator('label:has-text("Revendication") select option').allInnerTexts();
let oq = await optsQ(); ok('apport : HVE (rang 2) et « Agriculture biologique » proposés', oq.some((x) => x.startsWith('HVE (rang 2)')) && oq.some((x) => x.startsWith('Agriculture biologique (rang 3)')), oq.join(' | '));
await echap(1);
await page.click('#tab-params'); await page.waitForTimeout(200); await page.locator('main button', { hasText: 'Revendications, stades & listes' }).click(); await page.waitForTimeout(300);
await ed.locator('[data-qualif="hve"] label', { hasText: 'masquée' }).click(); await page.waitForTimeout(300);
await page.click('#tab-pressoir'); await page.waitForTimeout(300); await ouvrirApport();
oq = await optsQ(); ok('masquée : plus proposée à la saisie', !oq.some((x) => x.startsWith('HVE')), oq.join(' | ')); await echap(1);
// intrants : une colonne de règles par revendication, lien vers l'éditeur
await page.click('#tab-intrants'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Produits & règles' }).click(); await page.waitForTimeout(300);
const ths = await page.locator('main table thead th').allInnerTexts();
ok('intrants : colonne de règles pour HVE', ths.some((x) => /HVE/i.test(x) && /rang 2/i.test(x)), ths.join(' | '));
await page.locator('main button', { hasText: 'Modifier ou ajouter des revendications' }).click(); await page.waitForTimeout(300);
ok('lien vers l’éditeur des revendications', (await page.locator('[data-qualifs-editor]').count()) === 1);
await ed.locator('[data-qualif="hve"] label', { hasText: 'masquée' }).click(); await page.waitForTimeout(200);
await ed.locator('[data-qualif="hve"] button[aria-label^="Supprimer"]').click(); await page.waitForTimeout(200); await top().locator('button', { hasText: 'Supprimer' }).last().click(); await page.waitForTimeout(300);
d = await dbj(); ok('HVE (inutilisée) supprimée avec ses règles', !d.lists.qualifs.some((q) => q.id === 'hve') && !d.regles.some((r) => r.qualifId === 'hve'));

// ================= 2. produits d'hygiène =================
await page.click('#tab-hygiene'); await page.waitForTimeout(300);
ok('Hygiène : sous-onglets Journal et Produits (badge des FDS manquantes)', (await page.locator('main [role=tab]', { hasText: 'Produits d’hygiène' }).innerText()).includes('3'));
await page.locator('main [role=tab]', { hasText: 'Produits d’hygiène' }).click(); await page.waitForTimeout(300);
ok('liste : 3 produits d’exemple, pictogrammes et protections', (await page.locator('main table tbody tr').count()) === 3 && (await page.locator('main table tbody [data-securite] svg').count()) > 6);
// 2a. FDS scannée (image seule) : reconnaissance du texte, formulaire pré-rempli puis abandonné
await page.locator('input[aria-label="Fiche de données de sécurité"]').setInputFiles(path.join(FX, 'hygiene', 'fds-demo-chlore-scan.pdf'));
await top().locator('h2', { hasText: 'Nouveau produit d’hygiène' }).waitFor({ timeout: 120000 }); await page.waitForTimeout(300);
const nomScan = await top().locator('label:has-text("Nom du produit") input').inputValue();
const phScan = await top().locator('label:has-text("Mentions de danger") textarea').inputValue();
ok('scan : nom et mentions de danger lus par reconnaissance de caractères', /NETTOYANT/i.test(nomScan) && /H314/.test(phScan), `${nomScan} / ${phScan.slice(0, 60)}`);
ok('scan : signalé « à vérifier attentivement »', (await top().innerText()).includes('scan'));
const idbAvant = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('oenotrack-docs', 1); r.onsuccess = () => { const tx = r.result.transaction('fichiers', 'readonly'); const q = tx.objectStore('fichiers').getAllKeys(); q.onsuccess = () => res(q.result.length); }; }));
await top().locator('.sheet-f button', { hasText: 'Annuler' }).click(); await page.waitForTimeout(500);
const idbApres = await page.evaluate(() => new Promise((res) => { const r = indexedDB.open('oenotrack-docs', 1); r.onsuccess = () => { const tx = r.result.transaction('fichiers', 'readonly'); const q = tx.objectStore('fichiers').getAllKeys(); q.onsuccess = () => res(q.result.length); }; }));
ok('abandon : rien de créé, fichier en attente effacé', (await dbj()).produitsHygiene.length === 3 && idbApres === idbAvant - 1, `${idbAvant} → ${idbApres}`);
// 2b. FDS (PDF texte) : produit créé avec sa FDS jointe
await page.locator('input[aria-label="Fiche de données de sécurité"]').setInputFiles(path.join(FX, 'hygiene', 'fds-demo-chlore.pdf'));
await top().locator('h2', { hasText: 'Nouveau produit d’hygiène' }).waitFor({ timeout: 60000 }); await page.waitForTimeout(300);
const val = async (lab, tag = 'input') => top().locator(`label:has-text("${lab}") ${tag}`).first().inputValue();
ok('PDF texte : nom, fabricant, date et version de la FDS repris', (await val('Nom du produit')) === 'NETTOYANT CHLORÉ DÉMO 123' && (await val('Fabricant')) === 'Hygiène Exemple SAS' && (await val('Date de révision de la FDS')) === '2023-03-15' && (await val('Version de la FDS')) === '4.0');
ok('… nature et mention d’avertissement', (await val('Nature', 'select')) === 'alcalin_chlore' && (await val('Mention d’avertissement', 'select')) === 'danger');
const pres = async (grp) => top().locator(`[role=group][aria-label="${grp}"] button[aria-pressed="true"]`).count();
ok('… pictogrammes (2) et protections (4) cochés', (await pres('Pictogrammes de danger')) === 2 && (await pres('Protections individuelles')) === 4);
ok('… FDS en attente d’enregistrement', (await top().locator('[data-docs-attente] li').count()) === 1);
ok('nom lu en majuscules : « Enregistré sous « Nettoyant Chloré Démo 123 » » (casse à la création, 0.26.0-alpha.1)', /Enregistré sous « Nettoyant Chloré Démo 123 »/.test(await top().innerText()));
await page.screenshot({ path: SC + '/shots/t39-fds-lue.png' });
await top().locator('input[aria-label="Concentration minimale"]').fill('1');
await top().locator('input[aria-label="Concentration maximale"]').fill('2');
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
d = await dbj(); const pN = d.produitsHygiene.find((p) => p.nom === 'Nettoyant Chloré Démo 123');
ok('produit créé, FDS jointe (catégorie FDS)', !!pN && d.docs.some((x) => x.cible.type === 'produitHygiene' && x.cible.id === pN.id && x.cat === 'fds') && pN.concMin === 1 && pN.concMax === 2 && pN.pictos.join() === 'SGH05,SGH09');
ok('fiche du produit ouverte : FDS du 15/03/2023 (plus de 3 ans)', (await top().innerText()).includes('FDS du 15/03/2023'));
await page.screenshot({ path: SC + '/shots/t39-fiche-produit.png' });
// 2c. relire une FDS sur une fiche existante : revue, reprise sélective
await top().locator('.sheet-f button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(300);
await top().locator('input[aria-label="Fiche de données de sécurité à lire"]').setInputFiles(path.join(FX, 'hygiene', 'fds-demo-peracide.txt'));
await top().locator('[data-fds-revue]').waitFor({ timeout: 30000 });
const nRev = await top().locator('[data-fds-revue] li').count(); ok('relecture : revue des informations trouvées', nRev >= 8, nRev);
await top().locator('[data-fds-revue] input[aria-label="Reprendre : Nom du produit"]').uncheck();
for (const lab of ['Nature', 'Pictogrammes de danger', 'Mentions de danger', 'Mention d’avertissement', 'Fabricant / fournisseur de la FDS', 'Composition']) { const c = top().locator(`[data-fds-revue] input[aria-label="Reprendre : ${lab}"]`); if (await c.count()) await c.uncheck(); }
await top().locator('[data-fds-revue] button', { hasText: 'Reprendre la sélection' }).click(); await page.waitForTimeout(400);
ok('reprise sélective : nom gardé, date de la nouvelle FDS reprise', (await val('Nom du produit')) === 'Nettoyant Chloré Démo 123' && (await val('Date de révision de la FDS')) === '2022-02-03');
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
d = await dbj(); ok('relecture enregistrée : nouveau fichier joint comme FDS', d.docs.filter((x) => x.cible.type === 'produitHygiene' && x.cible.id === pN.id && x.cat === 'fds').length === 2 && d.produitsHygiene.find((p) => p.id === pN.id).fdsDate === '2022-02-03');
await echap();
// 2d. fiches de sécurité imprimables
await page.locator('main button', { hasText: 'Fiches de sécurité' }).click(); await page.waitForTimeout(500);
ok('fiches de sécurité : une page par produit', (await top().locator('.report .rpt-item').count()) === 4 && (await top().locator('.report').innerText()).includes('Urgences : 15 (SAMU) ou 112'));
await page.screenshot({ path: SC + '/shots/t39-fiches-securite.png' });
await echap();

// ================= 3. journal d'hygiène avec produits =================
await page.locator('main [role=tab]', { hasText: 'Journal d’hygiène' }).click(); await page.waitForTimeout(300);
await page.locator('main button', { hasText: '+ Nouvelle entrée' }).click(); await page.waitForTimeout(400);
const cinp = top().locator('input[role=combobox]').first(); await pick(page, cinp, 'Cuve 04', 'Cuve 04');
const l0 = top().locator('[data-hyg-ligne="0"]');
const pin = l0.locator('input[aria-label="Produit 1"], select[aria-label="Produit 1"]').first();
if ((await pin.evaluate((e) => e.tagName)) === 'SELECT') await pin.selectOption({ label: 'Nettoyant Chloré Démo 123 (1 à 2 %)' }); else await pick(page, pin, 'NETTOYANT', 'Nettoyant Chloré Démo 123');
await page.waitForTimeout(200);
ok('produit choisi : concentration proposée (bas de la plage), rappels de sécurité', (await l0.locator('input[aria-label="Concentration du produit 1"]').inputValue()) === '1' && (await l0.locator('[data-securite] svg').count()) >= 4 && (await l0.innerText()).includes('Ne jamais mélanger'));
await l0.locator('input[aria-label="Concentration du produit 1"]').fill('3'); await l0.locator('input[aria-label="Quantité du produit 1"]').fill('2,5');
await top().locator('button', { hasText: '+ Ajouter un produit' }).click(); await page.waitForTimeout(200);
const pin2 = top().locator('[data-hyg-ligne="1"]').locator('input[aria-label="Produit 2"], select[aria-label="Produit 2"]').first();
if ((await pin2.evaluate((e) => e.tagName)) === 'SELECT') await pin2.selectOption({ label: 'Acide citrique (détartrant) (1 à 2 %)' }); else await pick(page, pin2, 'Acide citrique', 'Acide citrique');
await page.waitForTimeout(200);
const txt = await top().innerText();
ok('alertes : chloré + acide, concentration au-dessus de la plage', /chloré et produit acide/.test(txt) && /au-dessus de la concentration d’emploi/.test(txt), txt.match(/(Produit chloré[^\n]*|[^\n]*au-dessus[^\n]*)/g));
await top().locator('label:has-text("Méthode") input').fill('eau chaude 50 °C');
await page.screenshot({ path: SC + '/shots/t39-entree.png' });
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
d = await dbj(); const he = d.hygiene[d.hygiene.length - 1];
ok('entrée enregistrée : produits, concentrations, quantité, méthode, résumé', he.produits.length === 2 && he.produits[0].conc === 3 && he.produits[0].quantite === 2.5 && he.methode === 'eau chaude 50 °C' && he.produit.startsWith('Nettoyant Chloré Démo 123 3 % + Acide citrique (détartrant)'), he.produit);
const row = page.locator('main table tbody tr', { hasText: 'Cuve 04' }).first();
ok('journal : pastilles des produits', (await row.locator('button.chip', { hasText: 'NETTOYANT' }).count()) === 1);
await row.locator('button.chip', { hasText: 'NETTOYANT' }).click(); await page.waitForTimeout(300);
ok('pastille → fiche du produit (utilisation comptée)', (await top().locator('h2').innerText()) === 'Nettoyant Chloré Démo 123' && (await top().innerText()).includes('Bac') === false && (await top().innerText()).includes('Cuve 04'));
await echap();
// filtre par produit
await page.locator('main select[aria-label="Produit d’hygiène"]').selectOption({ label: 'Nettoyant Chloré Démo 123' }); await page.waitForTimeout(200);
ok('filtre par produit', (await page.locator('main table tbody tr').count()) === 1);
await page.locator('main select[aria-label="Produit d’hygiène"]').selectOption(''); await page.waitForTimeout(200);
// création d'un produit depuis l'entrée
await page.locator('main button', { hasText: '+ Nouvelle entrée' }).click(); await page.waitForTimeout(400);
await top().locator('button', { hasText: '+ Nouveau produit d’hygiène' }).click(); await page.waitForTimeout(300);
await top().locator('label:has-text("Nom du produit") input').fill('Eau ozonée démo'); await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('produit créé depuis l’entrée : ajouté à la liste des produits utilisés', (await top().locator('[data-hyg-ligne]').count()) === 1 && /Eau Ozonée Démo/.test(await top().locator('[data-hyg-ligne="0"]').innerText() + (await top().locator('[data-hyg-ligne="0"] input, [data-hyg-ligne="0"] select').first().inputValue())));
await echap();

// ================= 4. registre, sauvegarde, base 0.17.0-alpha.2 =================
await page.click('#tab-registres'); await page.waitForTimeout(300);
await page.locator('main button', { hasText: 'Produits d’hygiène (FDS)' }).first().click(); await page.waitForTimeout(300);
ok('registre « Produits d’hygiène (FDS) »', (await page.locator('main table tbody tr').count()) >= 5 && (await page.locator('main table thead').innerText()).includes('FDS JOINTE'));
// base 0.17.0-alpha.2 (entrées d'hygiène en texte) : ouverte et modifiée sans rien perdre
const b18 = fs.readFileSync(path.join(FX, 'base-0.17.0-alpha.2-icone.json'), 'utf8');
await page.evaluate((txt) => { localStorage.setItem('oenotrack-db-v2', txt); }, b18); await page.reload(); await page.waitForTimeout(1500);
d = await dbj(); ok('base 0.17.0-alpha.2 : revendications d’origine, aucun produit', d.lists.qualifs.map((q) => q.id).join() === 'conv,bio,dem' && d.produitsHygiene.length === 0);
const h18 = d.hygiene.find((x) => x.produit && !x.produits && !(d.campagnes.find((c) => c.figee && x.date >= c.debut && x.date <= c.fin)));
await page.click('#tab-hygiene'); await page.waitForTimeout(300);
if (h18) {
  await page.locator('main table tbody tr', { hasText: h18.produit }).first().locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400);
  ok('entrée 0.17.0-alpha.2 : son texte devient la méthode', (await top().locator('label:has-text("Méthode") input').inputValue()) === h18.produit && (await top().locator('[data-hyg-ligne]').count()) === 0);
  await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(300);
  d = await dbj(); const x = d.hygiene.find((y) => y.id === h18.id); ok('… enregistrée : texte inchangé', x.produit === h18.produit && x.methode === h18.produit);
} else ok('base 0.17.0-alpha.2 : entrée d’hygiène modifiable trouvée', false);
log('erreurs :', errors.length ? errors : 'aucune');
await browser.close();

// ================= 5. téléphone =================
{
  const { browser: b2, page: p2, errors: e2 } = await open({ routes, viewport: { width: 390, height: 844 }, mobile: true });
  await p2.click('#tab-hygiene'); await p2.waitForTimeout(300); await p2.locator('main [role=tab]', { hasText: 'Produits d’hygiène' }).click(); await p2.waitForTimeout(300);
  const larg = await p2.evaluate(() => document.documentElement.scrollWidth);
  ok('téléphone : produits en cartes, pas de défilement horizontal', (await p2.locator('main button.card').count()) === 3 && larg <= 392, larg);
  await p2.screenshot({ path: SC + '/shots/t39-mobile-produits.png' });
  await p2.locator('main button.card').first().click(); await p2.waitForTimeout(300); await p2.screenshot({ path: SC + '/shots/t39-mobile-fiche.png' });
  await p2.keyboard.press('Escape'); await p2.waitForTimeout(200);
  await p2.locator('main [role=tab]', { hasText: 'Journal d’hygiène' }).click(); await p2.waitForTimeout(200);
  await p2.locator('main button', { hasText: '+ Nouvelle entrée' }).click(); await p2.waitForTimeout(400); await p2.screenshot({ path: SC + '/shots/t39-mobile-entree.png' });
  const lw = await p2.evaluate(() => { const s = document.querySelector('.overlay .sheet-b'); return s ? s.scrollWidth - s.clientWidth : -1; });
  ok('téléphone : formulaire d’entrée sans débordement', lw <= 1, lw);
  log('erreurs (téléphone) :', e2.length ? e2 : 'aucune');
  await b2.close();
}
if (tessJs) await (await tessJs).terminate();
