// 0.49.0-alpha.2 : corrections de l'assistant IA — certificat de jaugeage de plus de 8 pages relu par lots de pages (deux envois : pages 1 à 8
// puis 9 à 10, tableau qui passe d'un lot à l'autre réuni en un seul barème) ; pastille « 🤖 IA » dans les listes d'arrivages et de pesées.
// Service simulé (aucun réseau), PDF de 10 pages blanches généré par pdf-lib, données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const { PDFDocument } = require('/opt/npm-tools/node_modules/pdf-lib');
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const pdf = await PDFDocument.create(); for (let i = 0; i < 10; i += 1) pdf.addPage([595, 842]); const PDF = Buffer.from(await pdf.save());
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
const pts1 = []; for (let h = 0; h <= 60; h += 1) pts1.push([h, 150 + h * 48]); const pts2 = []; for (let h = 61; h <= 120; h += 1) pts2.push([h, 150 + h * 48]);
const IA = { appels: [] };
const PDFJS = '/opt/npm-tools/node_modules/pdfjs-dist/'; // bibliothèque de lecture des PDF servie localement (comme t52)
const routes = async (route, u) => {
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'build/pdf.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.worker.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'build/pdf.worker.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && /\/(wasm|standard_fonts|cmaps)\//.test(u)) { const f = PDFJS + u.split(/pdfjs-dist@[^/]+\//)[1]; if (fs.existsSync(f)) { await route.fulfill({ body: fs.readFileSync(f) }); return true; } }
  if (!u.startsWith('https://api.anthropic.com/')) return false;
  const rq = route.request(); if (rq.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return true; }
  const b = JSON.parse(rq.postData() || '{}'); IA.appels.push(b); const t = JSON.stringify(b.messages || []);
  // lot 1 : le tableau commence page 8 ; lot 2 : l'IA numérote l'image 1 (= page 9 du certificat)
  const rep = /pages 9 à 10/.test(t) ? { tables: [{ page: 1, nom: 'C 88', certificat: 'R.X9.26.00088', uniteHauteur: 'cm', uniteVolume: 'L', lignes: pts2 }] }
    : { tables: [{ page: 8, nom: 'C 88', certificat: 'R.X9.26.00088', uniteHauteur: 'cm', uniteVolume: 'L', capacite: 5900, lignes: pts1 }] };
  await route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(rep) }] }) });
  return true;
};
const init = { content: "try { localStorage.setItem('oenotrack-ia', JSON.stringify({ fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-essai' }, modeles: { anthropic: 'modele-essai' } })); } catch (e) {}" };
const images = (b) => ((b && b.messages && b.messages[0] && Array.isArray(b.messages[0].content)) ? b.messages[0].content : []).filter((x) => x.type === 'image');
{
  const { browser, page, errors } = await open({ routes, init, viewport: { width: 1360, height: 900 }, date: '2026-10-05T10:00:00' });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  // ---- certificat de 10 pages
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('main button', { hasText: 'Barèmes de jaugeage' }).first().click(); await page.waitForTimeout(400);
  await page.locator('main button', { hasText: 'Importer des barèmes' }).first().click(); await page.waitForTimeout(300);
  await ov().locator('input[aria-label="Fichiers de barèmes"]').setInputFiles({ name: 'certificat-C88.pdf', mimeType: 'application/pdf', buffer: PDF });
  // ni texte ni reconnaissance de caractères (module non servi par le harnais) : la relecture par l'IA part d'elle-même, sinon on la demande
  for (let i = 0; i < 80 && !(await ov().locator('[data-bareme-ia-relu], [data-ia-bouton="baremes"]').count()); i += 1) await page.waitForTimeout(250);
  if (!(await ov().locator('[data-bareme-ia-relu]').count()) && !IA.appels.length) await ov().locator('[data-ia-bouton="baremes"]').click();
  for (let i = 0; i < 60 && !(await ov().locator('[data-bareme-ia-relu]').count()); i += 1) await page.waitForTimeout(250);
  const t1 = JSON.stringify(IA.appels[0] ? IA.appels[0].messages : ''); const t2 = JSON.stringify(IA.appels[1] ? IA.appels[1].messages : '');
  ok('10 pages : deux envois, 8 images puis 2, chaque lot annonce ses pages', IA.appels.length === 2 && images(IA.appels[0]).length === 8 && images(IA.appels[1]).length === 2 && /pages 1 à 8/.test(t1) && /pages 9 à 10/.test(t2), { n: IA.appels.length, i: IA.appels.map((b) => images(b).length) });
  ok('… tableau commencé page 8 et continué page 9 : un seul barème proposé', (await ov().locator('[data-bareme-ia-relu]').count()) === 1 && /C 88/.test(await ov().innerText()));
  await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(800);
  const bm = ((await db()).baremes || []).find((b) => /C 88/.test(b.nom));
  ok('… enregistré : 121 lignes réunies (0 à 120 cm), trace « ia »', bm && bm.points.length === 121 && bm.meta.ia && bm.meta.ia.usage === 'baremes', bm && { n: bm.points.length });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // ---- pastilles des listes : un arrivage et une pesée proposés par l'IA
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const tr = { usage: 'reception', modele: 'modele-essai', fournisseur: 'anthropic', le: '2026-10-05T09:00:00Z' };
    d.arrivages[0].ia = tr; d.ops.filter((o) => o.type === 'apport' && o.pesee && o.date >= '2026-08-01').slice(0, 1).forEach((p) => { p.ia = { ...tr, usage: 'pesee' }; }); window.__peseeIa = (d.ops.find((o) => o.ia && o.ia.usage === 'pesee') || {}).date; localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); });
  await page.reload(); await page.waitForTimeout(1500);
  await page.click('#tab-intrants'); await page.waitForTimeout(400);
  await page.getByRole('tab', { name: /Arrivages|Stocks/ }).first().click().catch(() => {}); await page.waitForTimeout(300);
  ok('liste des arrivages : pastille « 🤖 IA » sur l’arrivage proposé par l’IA, titre explicite', (await page.locator('main [data-ia-trace]').count()) >= 1 && /Proposé par l’IA/.test(await page.locator('main [data-ia-trace]').first().getAttribute('title')));
  await page.click('#tab-pressoir'); await page.waitForTimeout(500);
  ok('registre des pesées : pastille « 🤖 IA » sur la pesée proposée par l’IA', (await page.locator('main tr', { has: page.locator('[data-num-pesee]') }).locator('[data-ia-trace]').count()) === 1);
  await page.screenshot({ path: `${SC}/shots/t101-pesees.png` });
  const errs = errors.filter((e) => !/Failed to load resource: net::ERR_FAILED/.test(e)); // module de reconnaissance de caractères non servi par le harnais
  ok('aucune erreur dans la page', errs.length === 0, errs);
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t101)'); process.exitCode = ko ? 1 : 0;
