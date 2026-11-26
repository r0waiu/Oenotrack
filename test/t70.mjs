// 0.37.0-alpha.1 : bulletins d'analyses à plusieurs échantillons (onglet Analyses ; entrée de moûts : dépôt dans l'opération, affectation
// guidée aux moûts) ; tables d'épalement : pages d'une même cuve réunies à l'import, fusion de deux tableaux d'un document avant
// enregistrement, fusion de deux barèmes enregistrés (Paramètres › Barèmes de jaugeage).
// Données fictives : test/fixtures/base-0.37.0-alpha.1-bulletins.json ; rapport et cahier d'épalement fictifs fabriqués ici (pdf-lib).
import { open } from './ui.mjs'; import fs from 'fs'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const { PDFDocument, StandardFonts } = require('/opt/npm-tools/node_modules/pdf-lib');
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const PDFJS = '/opt/npm-tools/node_modules/pdfjs-dist/';
const routes = async (route, u) => {
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'build/pdf.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.worker.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'build/pdf.worker.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && /\/(wasm|standard_fonts|cmaps)\//.test(u)) { const f = PDFJS + u.split(/pdfjs-dist@[^/]+\//)[1]; if (fs.existsSync(f)) { await route.fulfill({ body: fs.readFileSync(f) }); return true; } }
  return false;
};
// ---- documents fictifs
async function pdfDe(pages) { // pages : [[{ s, xc, y, taille }]] — y depuis le haut, texte centré sur xc
  const doc = await PDFDocument.create(); const font = await doc.embedFont(StandardFonts.Helvetica);
  pages.forEach((P) => { const pg = doc.addPage([842, 595]); P.forEach((it) => { const t = it.taille || 7; const w = font.widthOfTextAtSize(it.s, t); pg.drawText(it.s, { x: it.xc - w / 2, y: 595 - it.y, size: t, font }); }); });
  return Buffer.from(await doc.save());
}
const C = [190, 260, 330, 400, 470, 540, 610]; const it = (s, xc, y, taille) => ({ s, xc, y, taille });
const ECH = [['26FX000101', 'M1 FX 5002', ['1077,0', '177,79', '10,6', '3,25', '6,00', '9,19', '75']], ['26FX000102', 'M2 FX 40004', ['1068,5', '159,90', '9,5', '3,13', '6,64', '10,17', '<20']], ['26FX000103', 'M9FXB23', ['1070,6', '166,23', '9,9', '3,33', '5,31', '8,13', '49']]];
const rapport = () => { const P = [it('RAPPORT D’ANALYSES', 450, 30, 9), it('N° FX-261001-000042.1', 470, 42, 8), it('S.A.S. LABORATOIRE FICTIF - Unité de test', 110, 70), it('Réceptionné le : 01/10/26', 330, 70), it('Paramètre', 80, 130), it('Unité / Incertitude', 80, 150)];
  ['Masse Volumique à 20°C', 'Sucre Moût', 'Titre Alcoométrique', 'pH', 'Acidité Totale', 'Acidité Totale', 'Dioxyde de Soufre Total'].forEach((x, k) => P.push(it(x, C[k], 130, 5.5)));
  ['IRTF (*)', 'IRTF (*)', 'volumique naturel', 'IRTF (*)', 'IRTF (*)', 'Conversion (IRTF) (*)', 'Colorimétrique Auto'].forEach((x, k) => P.push(it(x, C[k], 140, 5.5)));
  ['g/dm3 /', 'g/L /', '% vol /', '/', 'g/L H2SO4 /', 'g/L TH2 /', 'mg/L / 16 mg/L'].forEach((x, k) => P.push(it(x, C[k], 150, 5.5)));
  ECH.forEach(([n, r, v], k) => { const y = 170 + k * 30; P.push(it(n, 45, y), it(r, 45, y + 20)); v.forEach((x, j) => P.push(it(`${x} /`, C[j], y + 10))); });
  P.push(it('Version : RapportMultiEch.3', 60, 290), it('Impression n° 1 / imprimé le 01/10/26', 330, 290));
  return pdfDe([P, [it('Ce rapport d’analyse ne concerne que les objets soumis à l’analyse, sauf autorisation du laboratoire.', 300, 60)]]); };
const f3 = (x) => x.toFixed(3).replace('.', ',');
const cuvePage = (h0, nom) => { const P = [it('ANNEXE AU CERTIFICAT DE JAUGEAGE N° R . X1 . 26 . 00042', 300, 30, 9), it('BAREME CENTIMETRIQUE DES VOLUMES MESURES PAR LE PLEIN', 300, 44, 8), it(`Hauteurs de ${f3(Math.max(h0, 1) / 100)} m à ${f3((h0 + 159) / 100)} m`, 300, 70, 8), it('Volume total : 30,000 m³'.replace('³', '3'), 300, 82, 8)];
  if (nom) P.push(it(nom, 300, 58, 10)); [0, 1, 2, 3].forEach((c) => P.push(it('HAUTEURS', 90 + c * 180, 100), it('VOLUMES', 150 + c * 180, 100)));
  for (let r = 0; r < 40; r += 1) [0, 1, 2, 3].forEach((c) => { const h = h0 + r + c * 40; P.push(it(f3(h / 100), 90 + c * 180, 112 + r * 11), it(f3((h * 94.04) / 1000), 150 + c * 180, 112 + r * 11)); });
  P.push(it('LES HAUTEURS SONT EXPRIMEES EN METRES', 300, 560), it('LES VOLUMES SONT EXPRIMES EN METRES-CUBES', 300, 572)); return P; };

const db0 = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'base-0.37.0-alpha.1-bulletins.json'), 'utf8'));
db0.settings.securite = { ...db0.settings.securite, actif: false };
db0.baremes.push({ id: 'bm900', nom: 'Tableau complémentaire fictif', cible: 'contenant', contenantId: '', mesure: 'hauteur', points: [[201, 10050], [250, 12500], [300, 15000]], meta: { fichier: 'complement.pdf' } });
const init = { content: `if (!sessionStorage.getItem('semee')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(db0))}); sessionStorage.setItem('semee', '1'); } window.print = () => {};` };
const { browser, page, errors } = await open({ init, routes, viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const ov = () => page.locator('.overlay').last();
const toast = async () => page.locator('.toast').last().innerText().catch(() => '');
const fermer = async () => { for (let i = 0; i < 5 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); const b = page.locator('.overlay button', { hasText: /^(Quitter sans enregistrer|Abandonner|Fermer sans enregistrer)/ }); if (await b.count()) await b.first().click(); } };
const PDF = await rapport(); fs.writeFileSync(SC + '/rapport-fictif.pdf', PDF);

// 1. onglet Analyses : rapport à plusieurs échantillons
await page.click('#tab-analyses'); await page.waitForTimeout(500);
await page.locator('input[aria-label="Bulletins d’analyses à importer"]').setInputFiles([{ name: 'rapport-fictif.pdf', mimeType: 'application/pdf', buffer: PDF }]);
await page.locator('[data-bulletin-revue]').waitFor({ timeout: 30000 }); await page.waitForTimeout(300);
let s = ov(); let t = await txt(s);
ok('Analyses : 3 échantillons distincts, n° du laboratoire, laboratoire et n° du rapport', (await s.locator('[data-bulletin-ech]').count()) === 3 && /n° 26FX000101/.test(t) && /n° 26FX000103/.test(t) && /3 échantillons/.test(t) && /LABORATOIRE FICTIF/.test(t) && /FX-261001-000042\.1/.test(t), t.slice(0, 600));
ok('… valeurs de chaque échantillon (pH, TAP, SO₂ < 20)', (await s.locator('[data-bulletin-ech="M1 FX 5002"] [aria-label="Valeur pH"]').inputValue()) === '3,25' && (await s.locator('[data-bulletin-ech="M2 FX 40004"] [aria-label="Valeur pH"]').inputValue()) === '3,13' && (await s.locator('[data-bulletin-ech="M9FXB23"] [aria-label="Valeur TAP"]').inputValue()) === '9,9', await s.locator('[data-bulletin-ech]').first().innerText());
await page.screenshot({ path: SC + '/shots/t70-analyses.png' });
await fermer();

// 2. entrée de moûts : bulletin glissé dans l'opération, affectation guidée
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await page.locator('.pitem', { hasText: 'Cuve 03' }).first().click({ button: 'right' }); await page.waitForTimeout(250);
await page.locator('[role=menuitem]', { hasText: /moût/i }).first().click(); await page.waitForTimeout(400);
s = ov();
ok('entrée de moûts : zone « Glisser ici le bulletin d’analyses des moûts » dans l’opération', await s.locator('[data-bulletin-entree]').isVisible() && /Glisser ici le bulletin d’analyses des moûts/.test(await s.locator('[data-bulletin-entree]').innerText()));
await s.locator('[aria-label="N° de lot du moût 1"]').fill('5002');
await s.locator('button:has-text("+ Ajouter un moût")').click(); await page.waitForTimeout(150); await s.locator('[aria-label="N° de lot du moût 2"]').fill('M2-40004');
await s.locator('button:has-text("+ Ajouter un moût")').click(); await page.waitForTimeout(150); await s.locator('[aria-label="N° de lot du moût 3"]').fill('EM-3');
await s.locator('input[type=file][aria-label="Bulletin d’analyses de l’entrée de moûts"]').setInputFiles([{ name: 'rapport-fictif.pdf', mimeType: 'application/pdf', buffer: PDF }]);
await page.locator('[data-bulletin-guide]').waitFor({ timeout: 30000 }); await page.waitForTimeout(250);
const G = page.locator('[data-bulletin-guide]'); t = await txt(G);
ok('affectation guidée : 3 échantillons, moûts 1 et 2 rapprochés (n° de lot, mêmes nombres), moût 3 dans l’ordre (à vérifier)', (await G.locator('[data-bulletin-guide-ech]').count()) === 3 && (await G.locator('[aria-label="Échantillon du moût 1"]').inputValue()) === '0' && (await G.locator('[aria-label="Échantillon du moût 2"]').inputValue()) === '1' && (await G.locator('[aria-label="Échantillon du moût 3"]').inputValue()) === '2'
  && /rapproché par le n° de lot/.test(await G.locator('[data-bulletin-guide-mout="1"]').innerText()) && /rapproché par les mêmes nombres/.test(await G.locator('[data-bulletin-guide-mout="2"]').innerText()) && /dans l’ordre du bulletin : à vérifier/.test(await G.locator('[data-bulletin-guide-mout="3"]').innerText()), t.slice(0, 700));
await page.screenshot({ path: SC + '/shots/t70-guide.png' });
await G.locator('[aria-label="Échantillon du moût 3"]').selectOption(''); await page.waitForTimeout(100);
ok('… échantillon retiré d’un moût : « non reporté »', /non reporté/.test(await G.locator('[data-bulletin-guide-ech="3"]').innerText()));
await G.locator('[aria-label="Échantillon du moût 3"]').selectOption('2'); await page.waitForTimeout(100);
await ov().locator('button', { hasText: 'Reporter les analyses' }).click(); await page.waitForTimeout(400);
s = ov();
ok('analyses reportées sur chaque moût (TAP, AT, pH)', (await s.locator('[aria-label="TAP du moût 1"]').inputValue()) === '10,6' && (await s.locator('[aria-label="TAP du moût 2"]').inputValue()) === '9,5' && (await s.locator('[aria-label="TAP du moût 3"]').inputValue()) === '9,9' && (await s.locator('[aria-label="AT du moût 1"]').inputValue()) === '6', [await s.locator('[aria-label="TAP du moût 1"]').inputValue(), await s.locator('[aria-label="TAP du moût 2"]').inputValue(), await s.locator('[aria-label="TAP du moût 3"]').inputValue(), await s.locator('[aria-label="AT du moût 1"]').inputValue()]);
ok('… toast et bulletin joint à l’entrée', /analyses reportées sur 3 moût/.test(await toast()) && /rapport-fictif\.pdf/.test(await s.innerText()), await toast());
// bulletin dont tous les échantillons sont rapprochés par leur n° de lot : reporté sans question
await s.locator('[aria-label="N° de lot du moût 3"]').fill('M9FXB23'); await s.locator('[aria-label="TAP du moût 3"]').fill('');
await s.locator('input[type=file][aria-label="Bulletin d’analyses de l’entrée de moûts"]').setInputFiles([{ name: 'rapport-fictif-2.pdf', mimeType: 'application/pdf', buffer: PDF }]);
await page.waitForTimeout(2500);
ok('tous rapprochés : reporté directement, sans affectation guidée', (await page.locator('[data-bulletin-guide]').count()) === 0 && (await ov().locator('[aria-label="TAP du moût 3"]').inputValue()) === '9,9', await toast());
await fermer();

// 3. Paramètres › Barèmes de jaugeage : fusion de deux barèmes enregistrés
await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('main button', { hasText: 'Barèmes de jaugeage' }).first().click(); await page.waitForTimeout(400);
await page.locator('main tr', { hasText: 'Cuve 03 (barème fictif)' }).first().click(); await page.waitForTimeout(350);
await ov().locator('[data-bareme-fusionner]').click(); await page.waitForTimeout(300);
const F = page.locator('[data-bareme-fusion]');
await F.locator('[aria-label="Barème à fusionner"]').selectOption('bm900').catch(async () => { await F.locator('input[aria-label="Barème à fusionner"]').click(); await page.locator('[role=option]', { hasText: 'Tableau complémentaire' }).first().click(); });
await page.waitForTimeout(250); t = await txt(F);
ok('fusion : aperçu de la table réunie (0 à 300 cm, 3 lignes ajoutées)', /Table fusionnée : 0 à 300 cm/.test(t) && /3 ligne\(s\) ajoutée\(s\)/.test(t), t.slice(0, 400));
await page.screenshot({ path: SC + '/shots/t70-fusion.png' });
await ov().locator('button', { hasText: '⧉ Fusionner en une seule table' }).last().click(); await page.waitForTimeout(400);
let d = await db(); const b408 = d.baremes.find((b) => b.id === 'bm408'); const b900 = d.baremes.find((b) => b.id === 'bm900');
ok('fusion enregistrée : une seule table (0 à 300 cm) pour la Cuve 03, l’autre archivée', b408.points[b408.points.length - 1][0] === 300 && !b408.archive && b408.fusions.length === 1 && b900.archive && b900.fusionneDans === 'bm408' && /Barèmes fusionnés en une seule table/.test(await toast()), [b408.points, b900]);
ok('fiche du barème : « Tables réunies »', /Tables réunies/.test(await ov().innerText()));
await fermer();

// 4. import d'un fichier de barèmes à deux tableaux qui se suivent : fusion avant enregistrement
const pts = (h0, h1) => Array.from({ length: h1 - h0 + 1 }, (_, i) => [h0 + i, (h0 + i) * 20]);
const jsonB = JSON.stringify({ format: 'oenotrack-baremes', version: 1, baremes: [{ nom: 'Tableau p. 1', cible: 'contenant', mesure: 'hauteur', points: pts(0, 100), meta: { pages: [1] } }, { nom: 'Tableau p. 2', cible: 'contenant', mesure: 'hauteur', points: pts(101, 200), meta: { pages: [2] } }] });
await page.locator('main button', { hasText: 'Importer des barèmes' }).first().click(); await page.waitForTimeout(300);
await ov().locator('input[aria-label="Fichiers de barèmes"]').setInputFiles([{ name: 'deux-tableaux.json', mimeType: 'application/json', buffer: Buffer.from(jsonB) }]);
await page.locator('[data-bareme-revue]').waitFor({ timeout: 20000 }); await page.waitForTimeout(200);
s = ov(); ok('import : deux tableaux proposés', (await s.locator('[data-bareme-prop]').count()) === 2);
await s.locator('[data-bareme-fusion-choix="0"] summary').click(); await page.waitForTimeout(100);
await s.locator('[data-bareme-fusion-choix="0"] select').selectOption('1'); await page.waitForTimeout(150);
ok('… aperçu de la fusion', /Table fusionnée : 0 à 200 cm/.test(await s.locator('[data-bareme-fusion-choix="0"]').innerText()));
await s.locator('[data-bareme-fusion-choix="0"] button', { hasText: 'Fusionner en une seule table' }).click(); await page.waitForTimeout(250);
ok('… un seul tableau, de 0 à 200 cm', (await s.locator('[data-bareme-prop]').count()) === 1 && /0 à 200 cm/.test(await s.locator('[data-bareme-prop="0"]').innerText()), await s.locator('[data-bareme-prop]').first().innerText());
await fermer();

// 5. cahier d'épalement PDF : pages d'une même cuve, dans le désordre, nom sur une seule → une seule table
const CAHIER = await pdfDe([cuvePage(160), cuvePage(0, 'Cuve n° 77')]);
await page.locator('main button', { hasText: 'Importer des barèmes' }).first().click(); await page.waitForTimeout(300);
await ov().locator('input[aria-label="Fichiers de barèmes"]').setInputFiles([{ name: 'cahier-cuve-77.pdf', mimeType: 'application/pdf', buffer: CAHIER }]);
await page.locator('[data-bareme-revue]').waitFor({ timeout: 30000 }); await page.waitForTimeout(200);
s = ov(); t = await txt(s);
ok('cahier PDF de 2 pages : une seule table complète de 0 à 319 cm (pages 1, 2)', (await s.locator('[data-bareme-prop]').count()) === 1 && /320 lignes · 0 à 319 cm/.test(t) && /pages 1, 2/.test(t), t.slice(0, 500));
await page.screenshot({ path: SC + '/shots/t70-cahier.png' });
await fermer();

ok('aucune erreur dans la console', !errors.length, errors);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (t70)');
process.exitCode = ko ? 1 : 0;
