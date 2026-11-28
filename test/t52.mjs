// 0.27.0-alpha.1 : import des bulletins d'analyses — PDF (texte positionné) et CSV reconnus par le script, vérification, enregistrement
// avec le bulletin joint (📄), nouveau paramètre ; lecture complétée par l'IA (simulée) sans envoyer les lots ni les cuves ; réglage
// « Lire les bulletins avec l'IA » ; anglais. Bulletins d'essai fictifs fabriqués ici.
import { open } from './ui.mjs'; import fs from 'fs'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const P = require('/opt/npm-tools/node_modules/pdf-lib');
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); const FX = `${SC}/bulletins`; fs.mkdirSync(FX, { recursive: true }); fs.mkdirSync(`${SC}/shots`, { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
// bulletins d'essai
{ const b = await P.PDFDocument.create(); const p = b.addPage([595, 842]); const F = await b.embedFont(P.StandardFonts.Helvetica); const FB = await b.embedFont(P.StandardFonts.HelveticaBold);
  let y = 800; const T = (t, x, fo, s) => p.drawText(t, { x, y, size: s || 10, font: fo || F });
  T('LABORATOIRE OENOLOGIQUE DE DEMONSTRATION', 50, FB, 13); y -= 18; T('Bulletin d\'analyses n° 26-0777', 50); y -= 14; T('Date de réception : 17/11/2026', 50); y -= 30;
  const ech = (titre, prelev, L) => { T(titre, 50, FB, 11); y -= 15; T(`Date de prélèvement : ${prelev}`, 50); y -= 18; T('Paramètre', 50, FB); T('Résultat', 330, FB); T('Unité', 420, FB); y -= 14; L.forEach(([a, v, u]) => { T(a, 50); T(v, 330); T(u, 420); y -= 14; }); y -= 16; };
  ech('Échantillon 1 - Votre référence : Cuve 06', '16/11/2026', [['Titre alcoométrique volumique', '11,62', '% vol'], ['Sucres (glucose + fructose)', '1,4', 'g/L'], ['Acidité totale', '6,35', 'g/L ac. tartrique'], ['pH', '3,06', ''], ['SO2 libre', '21', 'mg/L'], ['SO2 total', '64', 'mg/L'], ['Acide L-malique', '< 0,10', 'g/L']]);
  ech('Échantillon 2 - Votre référence : AS25-02', '16/11/2026', [['Titre alcoométrique volumique', '12,05', '% vol'], ['Acidité totale', '4,05', 'g/L H2SO4'], ['pH', '3,12', ''], ['Acidité volatile', '0,31', 'g/L H2SO4'], ['Turbidité', '9', 'NTU']]);
  fs.writeFileSync(`${FX}/bulletin-26-0777.pdf`, await b.save()); }
fs.writeFileSync(`${FX}/bulletin-export.csv`, 'Référence;Date prélèvement;TAV (% vol);pH;Acidité totale (g/L H2SO4);SO2 libre (mg/L);SO2 total (mg/L)\nCuve 10;18/11/2026;11,9;3,12;4,05;22;58\nP26-04-C;18/11/2026;11,3;3,02;4,40;15;41\n');
fs.writeFileSync(`${FX}/rapport-libre.txt`, 'Vinilab Démo\nRapport 26-0901\nVotre vin de la cuve 10 a été prélevé le 19/11/2026.\nNous y avons trouvé un degré de 11,9 et une acidité volatile qui reste faible.\n');
// pdf.js local ; IA simulée (requêtes gardées)
const PDFJS = '/opt/npm-tools/node_modules/pdfjs-dist/'; const reqs = [];
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
const repIA = { laboratoire: 'Vinilab Démo', numero: '26-0901', echantillons: [{ reference: 'Cuve 10', date_prelevement: '2026-11-19', resultats: { av: 0.28, ph: 3.15 }, autres: [{ nom: 'TAV acquis', valeur: 11.9, unite: '% vol' }, { nom: 'Glycérol', valeur: 7.2, unite: 'g/L' }] }] };
const routes = async (route, u) => {
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'build/pdf.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.worker.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'build/pdf.worker.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && /\/(wasm|standard_fonts|cmaps)\//.test(u)) { const f = PDFJS + u.split(/pdfjs-dist@[^/]+\//)[1]; if (fs.existsSync(f)) { await route.fulfill({ body: fs.readFileSync(f) }); return true; } }
  if (!u.startsWith('https://api.anthropic.com/')) return false;
  const rq = route.request(); if (rq.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return true; }
  reqs.push(rq.postData() || '');
  await route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: '```json\n' + JSON.stringify(repIA) + '\n```' }] }) }); return true;
};
const { browser, page, errors } = await open({ routes, date: '2026-11-21T10:00:00' });
const top = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const revue = async () => { for (let i = 0; i < 60; i += 1) { await page.waitForTimeout(300); if (await page.locator('[data-bulletin-revue]').count()) break; } await page.waitForTimeout(400); };
const E = (ech) => `[data-bulletin-ech*="${ech}"]`; // référence telle qu'écrite par le laboratoire (« Échantillon 1 - Votre référence : Cuve 06 »)
const val = (ech, nom) => page.locator(`${E(ech)} input[aria-label="Valeur ${nom}"]`).first().inputValue({ timeout: 2000 }).catch(() => null);
// 1. sans IA : PDF + CSV
await page.click('#tab-analyses'); await page.waitForTimeout(500);
const d0 = await db(); const nA0 = (d0.analyses || []).length;
await page.locator('input[aria-label="Bulletins d’analyses à importer"]').setInputFiles([`${FX}/bulletin-26-0777.pdf`, `${FX}/bulletin-export.csv`]); await revue();
const rv = await txt(page.locator('[data-bulletin-revue]'));
ok('vérification : 2 bulletins, 4 échantillons (laboratoire et n° du PDF reconnus)', (await page.locator('[data-bulletin-ech]').count()) === 4 && /LABORATOIRE OENOLOGIQUE DE DEMONSTRATION/i.test(rv) && /n° 26-0777/.test(rv) && /bulletin-export\.csv/.test(rv), rv.slice(0, 900));
ok('PDF : valeurs reprises et converties (AT tartrique → H₂SO₄, « < 0,10 » gardé), nouveau paramètre proposé (turbidité ; TAV acquis : paramètre d’origine depuis 0.47.0-alpha.2)', (await val('Cuve 06', 'pH')) === '3,06' && (await val('Cuve 06', 'AT')) === '4,148' && (await val('Cuve 06', 'Acide malique')) === '0,1' && (await val('Cuve 06', 'SO₂ total')) === '64'
  && (await val('AS25-02', 'Acidité volatile')) === '0,31' && (await page.locator(`${E('AS25-02')} [data-bulletin-nouveau]`).count()) === 1 && (await val('AS25-02', 'Turbidité')) === '9',
  [await val('Cuve 06', 'pH'), await val('Cuve 06', 'AT'), await val('Cuve 06', 'Acide malique'), await val('AS25-02', 'Acidité volatile'), await val('AS25-02', 'Turbidité')]);
const lotSel = async (ech) => page.locator(`${E(ech)} [aria-label^="Lot de "]`).first().evaluate((x) => x.value || '', null, { timeout: 2000 }).catch(() => '');
const lots = await Promise.all(['Cuve 06', 'AS25-02', 'Cuve 10', 'P26-04-C'].map(lotSel));
ok('chaque échantillon rattaché à un lot (cuve ou code du lot)', lots.every((x) => !!x), lots);
ok('CSV : valeurs reprises', (await val('Cuve 10', 'SO₂ libre')) === '22' && (await val('P26-04-C', 'AT')) === '4,4' && (await val('P26-04-C', 'pH')) === '3,02');
await page.screenshot({ path: `${SC}/shots/t52-revue.png` });
// on écarte la turbidité (décochée) : seuls les paramètres cochés sont créés
await page.locator(`${E('AS25-02')} input[aria-label="Créer Turbidité"]`).uncheck();
await page.locator('.overlay button', { hasText: /^Enregistrer les analyses \(4\)$/ }).click(); await page.waitForTimeout(900);
const T1 = await page.locator('.toast').allInnerTexts();
const d1 = await db(); const nouv = (d1.analyses || []).slice(nA0); const docB = (d1.docs || []).filter((x) => x.cible && x.cible.type === 'bulletin');
ok('enregistrées : 4 analyses, chacune avec son bulletin joint', nouv.length === 4 && nouv.every((a) => a.bulletinDocId && a.source === 'bulletin') && docB.length === 2 && T1.some((x) => /Analyses enregistrées : 4 \(bulletin joint\)\./.test(x)), [nouv.length, nouv.map((a) => [a.bulletinDocId, a.source]), docB.length, T1]);
const pTav = (d1.analysesParams || []).find((x) => x.nom === 'TAV acquis');
ok('nouveau paramètre « TAV acquis » créé, « Turbidité » décochée non créée ; valeurs justes', pTav && !(d1.analysesParams || []).some((x) => /Turbidit/.test(x.nom)) && nouv.some((a) => a.valeurs && a.valeurs.at === 4.148 && a.valeurs.ph === 3.06 && a.valeurs[pTav.id] === 11.62), [pTav, nouv.map((a) => a.valeurs)]);
ok('… bulletin vérifié par la garde (verdict gardé avec le document)', docB.every((x) => x.garde && x.garde.statut === 'ok'), docB.map((x) => x.garde));
ok('liste des analyses : 📄 bulletin sur chaque analyse importée', (await page.locator('[data-bulletin-doc]').count()) >= 4);
await page.locator('[data-bulletin-doc]', { hasText: /bulletin/ }).first().click(); await page.waitForTimeout(1000);
ok('📄 ouvre le bulletin dans la visionneuse', /bulletin-26-0777\.pdf|bulletin-export\.csv/.test(await txt(top())) && ((await top().locator('iframe').count()) === 1 || (await top().locator('[data-doc-texte]').count()) === 1));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 2. avec l'IA (simulée) : un compte rendu en texte libre
await page.evaluate(() => { localStorage.setItem('oenotrack-ia', JSON.stringify({ fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-essai' }, modeles: { anthropic: 'claude-essai' } })); });
await page.locator('input[aria-label="Bulletins d’analyses à importer"]').setInputFiles(`${FX}/rapport-libre.txt`); await revue();
const rv2 = await txt(page.locator('[data-bulletin-revue]'));
ok('IA : lecture complétée (laboratoire, n°, échantillon rattaché à la cuve 10)', reqs.length === 1 && /🤖 lecture complétée par l’IA/.test(rv2) && /Vinilab Démo/.test(rv2) && /n° 26-0901/.test(rv2) && (await page.locator('[data-bulletin-ech]').count()) === 1 && !!(await lotSel(await page.locator('[data-bulletin-ech]').first().getAttribute('data-bulletin-ech'))), [reqs.length, rv2.slice(0, 700)]);
const e2 = await page.locator('[data-bulletin-ech]').first().getAttribute('data-bulletin-ech');
ok('IA : valeurs trouvées (🤖), paramètre existant reconnu, nouveau paramètre proposé', (await val(e2, 'Acidité volatile')) === '0,28' && (await val(e2, 'pH')) === '3,15' && (await val(e2, 'TAV acquis')) === '11,9' && (await page.locator(`[data-bulletin-ech="${e2}"] [data-bulletin-nouveau]`).count()) === 1 && /🤖/.test(rv2), [await val(e2, 'Acidité volatile'), await val(e2, 'pH'), await val(e2, 'TAV acquis')]);
const corps = reqs[0] || ''; const lotsDb = (d1.lots || []).map((l) => l.code).filter((c) => c && c.length > 3 && !/cuve 10/i.test(c)); const contsDb = (d1.contenants || []).map((c) => c.nom).filter((n) => n && !/^cuve 10$/i.test(n) && n.length > 4);
ok('IA : envoyé le texte du bulletin et les paramètres, jamais les codes des lots ni les noms des cuves', /Bulletin d’analyses/.test(corps) && /degré de 11,9/.test(corps) && /Acidité volatile/.test(corps) && !lotsDb.some((c) => corps.includes(c)) && !contsDb.some((n) => corps.includes(n)), [lotsDb.filter((c) => corps.includes(c)), contsDb.filter((n) => corps.includes(n))]);
await page.locator('.overlay button', { hasText: /^Enregistrer les analyses \(1\)$/ }).click(); await page.waitForTimeout(900);
const d2 = await db(); const aIA = (d2.analyses || []).slice(-1)[0];
ok('analyse lue avec l’IA enregistrée et marquée comme telle ; « Glycérol » créé', aIA && aIA.source === 'bulletin-ia' && aIA.bulletinDocId && (d2.analysesParams || []).some((x) => /Glycérol/.test(x.nom)), aIA);
// 3. réglage : lecture par l'IA désactivée → aucune demande
await page.click('#tab-params'); await page.waitForTimeout(400); await page.locator('button', { hasText: 'Assistant IA' }).first().click(); await page.waitForTimeout(500);
await page.locator('label', { hasText: 'Lire les bulletins d’analyses avec l’IA' }).locator('input[type=checkbox]').uncheck(); await page.waitForTimeout(300);
ok('réglage gardé sur l’appareil (bulletins : non)', await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-ia')).bulletins === false));
await page.click('#tab-analyses'); await page.waitForTimeout(500);
await page.locator('input[aria-label="Bulletins d’analyses à importer"]').setInputFiles(`${FX}/rapport-libre.txt`); await revue();
ok('lecture par l’IA désactivée : aucune demande envoyée', reqs.length === 1 && !/lecture complétée par l’IA/.test(await txt(page.locator('[data-bulletin-revue]').first())), reqs.length);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 4. anglais
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1200);
await page.click('#tab-analyses'); await page.waitForTimeout(500);
ok('anglais : zone de dépôt traduite', /Import analysis reports/.test(await txt(page.locator('[data-bulletins]'))));
await page.locator('input[aria-label="Analysis reports to import"]').setInputFiles(`${FX}/bulletin-export.csv`); await revue();
const re = await txt(top());
ok('anglais : vérification traduite', /Analysis reports: check/.test(re) && /Sampling date/i.test(re) && /Lot analysed/i.test(re) && /The ticked “new” parameters are created/.test(re) && (await page.locator('.overlay button', { hasText: /^Save the analyses \(2\)$/ }).count()) === 1, re.slice(0, 700));
await page.locator('.overlay button', { hasText: /^Save the analyses \(2\)$/ }).click(); await page.waitForTimeout(900);
ok('anglais : enregistrement annoncé', (await page.locator('.toast').allInnerTexts()).some((x) => /Analyses saved: 2 \(report attached\)\./.test(x)), await page.locator('.toast').allInnerTexts());
ok('aucune erreur', !errors.length, errors);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nERREURS: aucune');
process.exit(ko ? 1 : 0);
