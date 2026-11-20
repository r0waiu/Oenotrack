// Harnais UI : sert dist/cuverie.html (enveloppé), CDN remplacés par des copies locales. Usage: node test/ui.mjs [script.mjs]
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const html = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + fs.readFileSync(path.join(dir, '..', 'dist', 'cuverie.html'), 'utf8') + '</body></html>';
export async function open(opts = {}) {
  const browser = await chromium.launch();
  // navigateur en français par défaut (0.24.0-alpha.1 : la langue de la toute première ouverture suit celle du navigateur) ; opts.locale pour les autres
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1280, height: 900 }, colorScheme: opts.dark ? 'dark' : 'light', deviceScaleFactor: 1, isMobile: !!opts.mobile, hasTouch: !!opts.mobile, locale: opts.locale || 'fr-FR' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const BASE = opts.https ? 'https://app.test/' : 'http://app.test/';
  await page.route('**/*', async (route) => {
    const u = route.request().url();
    if (opts.routes) { const fait = await opts.routes(route, u); if (fait) return undefined; }
    if (u.startsWith(BASE) && /config\.json/.test(u)) return route.fulfill({ contentType: 'application/json', body: '{}' });
    if (u.startsWith(BASE)) return route.fulfill({ contentType: 'text/html', body: html });
    if (u.includes('react-dom') ) return route.fulfill({ contentType: 'text/javascript', body: '' });
    if (u.includes('/react/')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(dir, 'shim', 'react-shim.js'), 'utf8') });
    if (u.includes('tailwindcss')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(dir, 'shim', 'tw.js'), 'utf8') });
    if (u.includes('pdf-lib')) return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync('/opt/npm-tools/node_modules/pdf-lib/dist/pdf-lib.min.js', 'utf8') });
    if (u.includes('xlsx')) return route.fulfill({ contentType: 'text/javascript', body: 'window.XLSX={utils:{book_new(){return{}},aoa_to_sheet(){return{}},book_append_sheet(){}},write(){return new Uint8Array(1)}};' });
    if (u.includes('fonts.g')) return route.fulfill({ contentType: 'text/css', body: '' });
    return route.abort();
  });
  await page.exposeFunction('__saveTest', (name, b64) => { fs.mkdirSync((process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/dl', { recursive: true }); fs.writeFileSync((process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/dl/' + name, Buffer.from(b64, 'base64')); return true; });
  // page d'accueil (0.23.0-alpha.1) : considérée comme déjà vue, sauf pour les tests de l'accueil (opts.accueil)
  if (!opts.accueil) await page.addInitScript(() => { try { if (!localStorage.getItem('oenotrack-accueil')) localStorage.setItem('oenotrack-accueil', 'vu'); } catch (e) { /* ignoré */ } });
  if (opts.init) await page.addInitScript(opts.init);
  await page.goto(BASE); await page.waitForTimeout(1200);
  return { browser, page, errors, ctx };
}
// Saisie avec autocomplétion : écrit le texte puis clique la proposition correspondante
export async function pick(page, input, text, choice) {
  await input.click(); await input.fill(text); await page.waitForTimeout(120);
  const box = input.locator('xpath=..');
  const opt = box.locator('[role=option]', { hasText: choice || text }).first();
  await opt.click(); await page.waitForTimeout(80);
}
