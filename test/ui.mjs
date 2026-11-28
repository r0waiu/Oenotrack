// Harnais UI : sert dist/cuverie.html (enveloppé), CDN remplacés par des copies locales. Usage: node test/ui.mjs [script.mjs]
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const page0 = fs.readFileSync(path.join(dir, '..', 'dist', 'cuverie.html'), 'utf8');
// 0.38.0-alpha.1 : React et les bibliothèques sont vérifiés par leur empreinte (integrity) ; le harnais sert des copies de test (React
// de test/shim, tableur simulé) : attributs integrity retirés de la page, et propriété integrity neutralisée sauf opts.sri (test des refus)
const htmlSri = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + page0 + '</body></html>';
const html = htmlSri.replace(/ integrity="sha384-[^"]+"/g, '');
export async function open(opts = {}) {
  const browser = await chromium.launch();
  // navigateur en français par défaut (0.24.0-alpha.1 : la langue de la toute première ouverture suit celle du navigateur) ; opts.locale pour les autres
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, colorScheme: opts.dark ? 'dark' : 'light', deviceScaleFactor: 1, isMobile: !!opts.mobile, hasTouch: !!opts.mobile, locale: opts.locale || 'fr-FR' });
  // opts.date : date et heure figées (Date, todayISO) pour les tests qui en dépendent (plans d'hygiène), les minuteries tournent normalement
  if (opts.date) await ctx.clock.setFixedTime(new Date(opts.date));
  // 0.34.0-alpha.1 : Cuverie, Opérations et À réaliser sont des sous-onglets de « Vinification » ; un clic sur l'un d'eux depuis un autre
  // onglet passe d'abord par « Vinification » (les tests écrits avant restent valables)
  const n0 = ctx.newPage.bind(ctx); ctx.newPage = async () => vinification(await n0());
  const page = await ctx.newPage();
  const errors = [];
  await preparer(page, opts, errors);
  await page.goto(opts.https ? 'https://app.test/' : 'http://app.test/'); await page.waitForTimeout(1200);
  // 0.38.0-alpha.3 : autre onglet de la même session (même stockage), préparé comme le premier (onglet unique)
  ctx.autreOnglet = async (errs) => { const p = await ctx.newPage(); await preparer(p, opts, errs || errors); return p; };
  return { browser, page, errors, ctx };
}
async function preparer(page, opts, errors) {
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const BASE = opts.https ? 'https://app.test/' : 'http://app.test/';
  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (opts.routes) { const fait = await opts.routes(route, u); if (fait) return undefined; }
    if (u.startsWith(BASE) && /config\.json/.test(u)) return route.fulfill({ contentType: 'application/json', body: '{}' });
    if (u.startsWith(BASE)) return route.fulfill({ contentType: 'text/html', body: opts.sri ? htmlSri : html });
    if (u.includes('react-dom') ) return route.fulfill({ contentType: 'text/javascript', body: '' });
    if (u.includes('/react/') || u.includes('/react@')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(dir, 'shim', 'react-shim.js'), 'utf8') });
    if (u.includes('tailwindcss')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(dir, 'shim', 'tw.js'), 'utf8') });
    if (u.includes('pdf-lib')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync('/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js', 'utf8') });
    if (u.includes('xlsx')) return route.fulfill({ contentType: 'text/javascript', body: 'window.XLSX={utils:{book_new(){return{}},aoa_to_sheet(){return{}},book_append_sheet(){}},write(){return new Uint8Array(1)}};' });
    if (u.includes('fonts.g')) return route.fulfill({ contentType: 'text/css', body: '' });
    return route.abort();
  });
  await page.exposeFunction('__saveTest', (name, b64) => { fs.mkdirSync((process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/dl', { recursive: true }); fs.writeFileSync((process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/dl/' + name, Buffer.from(b64, 'base64')); return true; });
  // page d'accueil (0.23.0-alpha.1) : considérée comme déjà vue, sauf pour les tests de l'accueil (opts.accueil)
  if (!opts.accueil) await page.addInitScript(() => { try { if (!localStorage.getItem('oenotrack-accueil')) localStorage.setItem('oenotrack-accueil', 'vu'); } catch (e) { /* ignoré */ } });
  // 0.38.0-alpha.1 : la base et les secrets sont chiffrés par le coffre de l'appareil ; pour les tests écrits avant, localStorage.getItem
  // d'une clé chiffrée rend la copie claire tenue par l'application (crochet de test __coffreClair) ; localStorage.__brut(k) lit l'enveloppe
  if (!opts.sri) await page.addInitScript(() => { try { Object.defineProperty(HTMLScriptElement.prototype, 'integrity', { configurable: true, get() { return ''; }, set() { /* copies de test */ } }); } catch (e) { /* ignoré */ } });
  await page.addInitScript(() => {
    window.__oenotrackTests = true; const g = Storage.prototype.getItem;
    Storage.prototype.__brut = function (k) { return g.call(this, k); };
    Storage.prototype.getItem = function (k) { const v = g.call(this, k); if (this === window.localStorage && typeof v === 'string' && v.indexOf('"oenotrack-coffre"') >= 0 && v.indexOf('"oenotrack-coffre"') < 600 && typeof window.__coffreClair === 'function') { const c = window.__coffreClair(k); if (c != null) return c; } return v; };
  });
  if (opts.init) await page.addInitScript(opts.init);
}
export function vinification(page) {
  if (page.__vinif) return page; page.__vinif = true; const c0 = page.click.bind(page);
  page.click = async (sel, o) => {
    if (typeof sel === 'string' && /^#tab-(cuverie|ops|previsions|plan)$/.test(sel) && !(await page.locator(sel).isVisible().catch(() => false)) && (await page.locator('#tab-vinification').count())) { await c0('#tab-vinification'); await page.waitForTimeout(150); }
    const r = await c0(sel, o);
    // 0.48.0-alpha.1 : les familles d'opérations sont dans le sélecteur « ＋ Nouvelle opération » ; un clic sur #tab-ops l'ouvre (les tests
    // écrits avant, qui cliquent directement un bouton d'opération, restent valables ; t93 teste la page fermée avec locator().click())
    if (sel === '#tab-ops') { await page.waitForTimeout(150); const b = page.locator('main [data-nouvelle-op][aria-expanded="false"]'); if (await b.count().catch(() => 0)) await b.first().click().catch(() => {}); }
    return r;
  };
  return page;
}
// Saisie avec autocomplétion : écrit le texte puis clique la proposition correspondante
export async function pick(page, input, text, choice) {
  await input.click(); await input.fill(text); await page.waitForTimeout(120);
  const box = input.locator('xpath=..');
  const opt = box.locator('[role=option]', { hasText: choice || text }).first();
  await opt.click(); await page.waitForTimeout(80);
}
