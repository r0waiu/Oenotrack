// 0.27.0-alpha.1 : protection des importations — fichiers refusés (programme déguisé, page web, macros), PDF désarmé, aperçu sûr,
// journal de sécurité, sauvegarde piégée nettoyée, point de restauration, logo SVG redessiné ; anglais. Fichiers d'essai fabriqués ici (fictifs).
import { open } from './ui.mjs'; import fs from 'fs'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const P = require('/opt/npm-tools/node_modules/pdf-lib'); const JSZip = require('/opt/npm-tools/node_modules/jszip');
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); const FX = `${SC}/garde`; fs.mkdirSync(FX, { recursive: true }); fs.mkdirSync(`${SC}/shots`, { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 600) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
// fichiers d'essai
fs.writeFileSync(`${FX}/facture.pdf`, Buffer.concat([Buffer.from('MZ\x90\x00\x03\x00\x00\x00', 'latin1'), Buffer.alloc(200, 1)]));
fs.writeFileSync(`${FX}/page.txt`, '<!doctype html><html><body><script>parent.__piege = 1</script></body></html>');
fs.writeFileSync(`${FX}/notes.txt`, 'Contrôle du 12/11 : cuve propre.\n<script>window.__piege2 = 1</script> reste du texte\n');
{ const z = new JSZip(); z.file('[Content_Types].xml', '<Types/>'); z.file('word/document.xml', '<w:document/>'); z.file('word/vbaProject.bin', 'Attribute VB_Name'); fs.writeFileSync(`${FX}/lettre.docx`, await z.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })); }
{ const d = await P.PDFDocument.create(); const pg = d.addPage([595, 842]); const f = await d.embedFont(P.StandardFonts.Helvetica); pg.drawText('Fiche technique de demonstration', { x: 50, y: 780, size: 14, font: f });
  d.catalog.set(P.PDFName.of('OpenAction'), d.context.register(d.context.obj({ S: 'JavaScript', JS: P.PDFString.of('app.alert("x")') }))); await d.attach(Buffer.from('MZ programme'), 'outil.exe', { mimeType: 'application/octet-stream' });
  fs.writeFileSync(`${FX}/fiche-active.pdf`, await d.save({ useObjectStreams: true })); }
fs.writeFileSync(`${FX}/logo.svg`, '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" onload="window.__piege3=1"><script>window.__piege4=1</script><rect width="120" height="40" fill="#8C6E2F"/></svg>');

const { browser, page, errors } = await open({ viewport: { width: 1280, height: 900 }, date: '2026-11-21T10:00:00' });
const top = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const toasts = []; const lireToasts = async (n = 16) => { for (let i = 0; i < n; i += 1) { await page.waitForTimeout(250); (await page.locator('.toast').allInnerTexts().catch(() => [])).forEach((x) => { if (!toasts.includes(x)) toasts.push(x); }); } };
// 1. documents joints : chaque fichier vérifié
await page.click('#tab-ops'); await page.waitForTimeout(400);
await page.locator('main tbody tr').first().locator('[data-op-menu]').click(); await page.waitForTimeout(150); await page.locator('main button', { hasText: /📎/ }).first().click(); await page.waitForTimeout(500);
const inp = top().locator('input[aria-label="Fichiers à joindre"]');
for (const f of ['facture.pdf', 'page.txt', 'lettre.docx', 'fiche-active.pdf', 'notes.txt']) { await inp.setInputFiles(`${FX}/${f}`); await lireToasts(); }
const T = toasts.join(' | ');
ok('programme déguisé en PDF refusé (type réel lu dans le contenu)', /« facture\.pdf » refusé : contenu réel : programme Windows déguisé en « \.pdf »/.test(T), toasts);
ok('page web déguisée en texte refusée', /« page\.txt » refusé : contenu réel : page web \(HTML\)/.test(T), toasts);
ok('document Word avec macros refusé', /« lettre\.docx » refusé : macros/.test(T), toasts);
const liste = await txt(top());
ok('PDF à contenu actif désarmé et joint ; texte joint ; fichiers refusés absents', /fiche-active\.pdf.*🛡 désarmé/.test(liste) && /notes\.txt/.test(liste) && !/facture\.pdf|page\.txt|lettre\.docx/.test(liste), liste.slice(0, 500));
const d1 = await db(); const docA = (d1.docs || []).find((x) => x.nom === 'fiche-active.pdf');
ok('… verdict gardé avec le document (désarmé, PDF)', docA && docA.garde && docA.garde.statut === 'nettoye' && docA.garde.famille === 'pdf', docA);
// aperçu : le texte s'affiche comme texte (jamais exécuté) ; le PDF désarmé dans le lecteur PDF
await top().locator('button', { hasText: 'notes.txt' }).first().click(); await page.waitForTimeout(900);
ok('aperçu d’un texte : affiché comme texte, pas de page web, rien d’exécuté', (await page.locator('[data-doc-texte]').count()) === 1 && /<script>window\.__piege2 = 1<\/script>/.test(await page.locator('[data-doc-texte]').innerText()) && (await top().locator('iframe').count()) === 0 && !(await page.evaluate(() => window.__piege2)));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await top().locator('button', { hasText: 'fiche-active.pdf' }).first().click(); await page.waitForTimeout(900);
ok('aperçu du PDF désarmé dans le lecteur PDF', (await top().locator('iframe').count()) === 1);
await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 2. Paramètres › Sécurité des importations : journal
await page.click('#tab-params'); await page.waitForTimeout(400); await page.locator('button', { hasText: 'Sécurité des importations' }).first().click(); await page.waitForTimeout(600);
const g = await txt(page.locator('[data-garde]'));
ok('journal de sécurité : 3 refus et 1 désarmement, avec la raison', /Journal de sécurité \(4\)/.test(g) && (g.match(/Refusé/g) || []).length === 3 && /Désarmé/.test(g) && /PDF désarmé : code JavaScript/.test(g), g.slice(0, 900));
ok('compteur des fichiers vérifiés sur cet appareil', /Fichiers vérifiés sur cet appareil : 5\./.test(g));
await page.screenshot({ path: `${SC}/shots/t51-garde.png`, fullPage: true });
// 3. sauvegarde piégée : clés __proto__ retirées, logo SVG retiré, point de restauration avant de remplacer la base
const base = await db(); const piege = JSON.parse(JSON.stringify(base)); piege.entreprise = { ...(piege.entreprise || {}), nom: 'Domaine Piège', logo: 'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+' };
piege.docs = [...(piege.docs || []), { id: 'docpiege1', nom: 'piege.html', mime: 'text/html', taille: 30, cat: 'autre', cible: { type: 'op', id: piege.ops[0].id }, ajouteLe: '2026-11-20' }];
const texte = JSON.stringify({ format: 'oenotrack-sauvegarde', formatVersion: 1, app: 'oenotrack', appVersion: '0.26.0-alpha.2', exporteLe: '2026-11-20T10:00:00Z', contenu: {}, db: piege, fichiers: [{ id: 'docpiege1', nom: 'piege.html', mime: 'text/html', taille: 30, b64: Buffer.from('<html><script>x</script></html>').toString('base64') }] })
  .replace('{"format"', '{"__proto__":{"pollue":1},"format"');
fs.writeFileSync(`${FX}/sauvegarde-piegee.json`, texte);
await page.locator('button', { hasText: 'Sauvegarde & Drive' }).first().click(); await page.waitForTimeout(500);
await page.locator('input[aria-label="Fichier de sauvegarde à importer"]').setInputFiles(`${FX}/sauvegarde-piegee.json`); await page.waitForTimeout(800);
await top().locator('button', { hasText: 'Restaurer' }).last().click(); toasts.length = 0; await lireToasts(10);
const d2 = await db(); const T2 = toasts.join(' | ');
ok('sauvegarde piégée : restaurée, clé piégée retirée sans polluer, logo SVG retiré', d2.entreprise.nom === 'Domaine Piège' && !d2.entreprise.logo && /clé\(s\) piégée\(s\) retirée\(s\)/.test(T2) && /logo retiré/.test(T2) && !(await page.evaluate(() => ({}).pollue)), T2);
ok('… page web cachée dans la sauvegarde refusée (fiche signalée, fichier non rangé)', /1 document\(s\) refusé\(s\)/.test(T2) && ((d2.docs || []).find((x) => x.id === 'docpiege1') || {}).garde && d2.docs.find((x) => x.id === 'docpiege1').garde.statut === 'suspect', T2);
await page.locator('button', { hasText: 'Sécurité des importations' }).first().click(); await page.waitForTimeout(800);
const g2 = await txt(page.locator('[data-garde]')); const sus2 = (await page.locator('[data-garde-suspects]').count()) ? await txt(page.locator('[data-garde-suspects]')) : '';
ok('point de restauration créé avant la restauration ; document signalé listé', /Restauration d’une sauvegarde/.test(g2) && /⚠ signalé piege\.html extension « \.html » : programme, script ou page web, jamais accepté/.test(sus2) && /piege\.html Sauvegarde ou base Refusé/.test(g2), [sus2, g2.slice(g2.indexOf('Journal de sécurité'), g2.indexOf('Journal de sécurité') + 900)]);
// revenir au point de restauration : la base d'avant revient
await page.locator('[data-garde] button', { hasText: 'Revenir' }).first().click(); await page.waitForTimeout(400); await top().locator('button', { hasText: 'Revenir' }).last().click(); await page.waitForTimeout(1200);
const d3 = await db();
ok('« Revenir » : la base d’avant la restauration est rétablie, le journal de sécurité est gardé', (d3.entreprise || {}).nom !== 'Domaine Piège' && d3.ops.length === base.ops.length && (d3.gardeJournal || []).some((e) => e.nom === 'piege.html') && d3.gardeJournal.length === 5, [(d3.entreprise || {}).nom, d3.ops.length, base.ops.length, (d3.gardeJournal || []).map((e) => e.nom)]);
// 4. logo SVG avec du code : vérifié puis redessiné en PNG (aucun code gardé ni exécuté)
await page.locator('button', { hasText: 'Société & opérateurs' }).first().click(); await page.waitForTimeout(500);
await page.locator('input[aria-label="Fichier du logo"]').setInputFiles(`${FX}/logo.svg`); await page.waitForTimeout(1500);
const d4 = await db();
ok('logo SVG avec code : redessiné en image PNG, code jamais exécuté', /^data:image\/png;base64,/.test((d4.entreprise || {}).logo || '') && !(await page.evaluate(() => window.__piege3 || window.__piege4)), ((d4.entreprise || {}).logo || '').slice(0, 40));
// 5. anglais
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1200);
await page.click('#tab-params'); await page.waitForTimeout(400); await page.locator('button', { hasText: 'Import security' }).first().click(); await page.waitForTimeout(600);
const ge = await txt(page.locator('[data-garde]'));
ok('anglais : écran de sécurité des importations traduit', /Import protection/.test(ge) && /Actual type\./.test(ge) && /Security log \(\d+\)/.test(ge) && /Restore points \(on this device\)/.test(ge) && /actual content: Windows program disguised as “\.pdf”/.test(ge) && /\d+ vessel\(s\) · \d+ lot\(s\) · \d+ operation\(s\) · \d+ document\(s\)/.test(ge) && /21\/11\/2026 at 10:00/.test(ge) && !/ à /.test(ge) && /Restoring a backup/.test(ge) && /Return to a restore point/.test(ge), [/Import protection/.test(ge), /Actual type\./.test(ge), /actual content: Windows program disguised as “\.pdf”/.test(ge), /21\/11\/2026 at 10:00/.test(ge), !/ à /.test(ge), /Restoring a backup/.test(ge), /Return to a restore point/.test(ge), ge.slice(ge.indexOf('Restore points'))]);
ok('aucune erreur', !errors.length, errors);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nERREURS: aucune');
process.exit(ko ? 1 : 0);
