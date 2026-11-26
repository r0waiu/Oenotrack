// 0.38.0-alpha.1 : sécurité sans serveur — Œnotrack en ligne (dist/web/oenotrack-web, à construire avant : python3 tools/paquet-web.py)
// servi en local : bibliothèques et polices embarquées (vendor/), aucune requête vers un CDN, politique de sécurité du contenu stricte
// sans violation, React 18 et Tailwind précompilé réels, ouverture et bibliothèques hors connexion (service worker), coffre de
// l'appareil (base chiffrée, mot de passe à l'ouverture, clé perdue : données mises de côté) ; fichier seul : bibliothèque modifiée refusée.
import { open } from './ui.mjs'; import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import http from 'http';
const require = createRequire(import.meta.url); const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const dir = path.dirname(new URL(import.meta.url).pathname); const web = path.join(dir, '..', 'dist', 'web', 'oenotrack-web');
if (!fs.existsSync(path.join(web, 'vendor'))) { console.log('✗ ÉCHEC paquet web absent : python3 tools/paquet-web.py'); process.exit(1); }
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.gz': 'application/gzip', '.bcmap': 'application/octet-stream', '.pfb': 'application/octet-stream', '.ttf': 'font/ttf', '.txt': 'text/plain' };
const PORT = 8767; const BASE = `http://localhost:${PORT}/`;
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(web, p); if (!f.startsWith(web) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise((res) => srv.listen(PORT, res));
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');

// 1. Œnotrack en ligne : tout vient du site
{
  const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'allow', locale: 'fr-FR' });
  const externes = []; const errors = [];
  await ctx.route('**/*', (route) => { const u = route.request().url(); if (u.startsWith(BASE)) return route.continue(); externes.push(u); return route.abort(); });
  await ctx.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)); try { if (!localStorage.getItem('oenotrack-accueil')) localStorage.setItem('oenotrack-accueil', 'vu'); } catch (e) { /* ignoré */ } });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  await page.goto(BASE); await page.waitForTimeout(2500);
  ok('application affichée (React et Tailwind du site)', (await page.locator('#tab-params').count()) === 1);
  const csp = await page.evaluate(() => (document.querySelector('meta[http-equiv="Content-Security-Policy"]') || {}).content || '');
  ok('CSP : scripts de la page (empreintes) et du site seulement, ni CDN ni « unsafe-eval », connexions limitées', /script-src 'self' 'sha256-[^']+' 'sha256-[^']+'/.test(csp) && !/'unsafe-eval'|'unsafe-inline'|jsdelivr|cdnjs|unpkg|tailwindcss|fonts\.googleapis/.test(csp.split('style-src')[0]) && /connect-src 'self' https:\/\/api\.anthropic\.com/.test(csp) && !/connect-src[^;]*\shttps:(\s|;)/.test(csp) && /object-src 'none'/.test(csp), csp);
  const env = await page.evaluate(async () => { await document.fonts.ready; const el = document.querySelector('.flex'); return { react: window.React && window.React.version, tw: (document.getElementById('oenotrack-tailwind') || {}).textContent.length, flex: el && getComputedStyle(el).display, polices: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family).slice(0, 8), meta: document.querySelector('meta[name="oenotrack-bibliotheques"]').content }; });
  ok('React 18.3.1 du site, Tailwind précompilé appliqué, polices du site chargées', env.react === '18.3.1' && env.tw > 5000 && env.flex === 'flex' && env.polices.length > 0 && env.meta === 'vendor/', env);
  const libs = await page.evaluate(async () => { const r = {}; try { await loadPdfLib(); r.pdflib = !!window.PDFLib; } catch (e) { r.pdflib = e.message; } try { await loadXlsx(); r.xlsx = !!(window.XLSX && window.XLSX.utils); } catch (e) { r.xlsx = e.message; } try { const L = await chargerPdfjs(); r.pdfjs = L.version; } catch (e) { r.pdfjs = String(e.message || e); } r.scripts = [...document.scripts].map((s) => s.getAttribute('src')).filter(Boolean); return r; });
  ok('bibliothèques à la demande servies par le site (pdf-lib, SheetJS, PDF.js), vérifiées (integrity)', libs.pdflib === true && libs.xlsx === true && libs.pdfjs === '6.2.108' && libs.scripts.every((s) => s.startsWith('vendor/')) && libs.scripts.length >= 4, libs);
  const ocr = await page.evaluate(async () => { try { const c = document.createElement('canvas'); c.width = 420; c.height = 120; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 420, 120); g.fillStyle = '#000'; g.font = '48px Arial'; g.fillText('125 4380', 30, 80); const p = await ocrCanvas(c, 1, 1); return JSON.stringify(p).slice(0, 400); } catch (e) { return `erreur ${e && e.message}`; } });
  ok('reconnaissance de caractères (Tesseract : moteur, « worker » et langue du site)', /125/.test(ocr) && /4380/.test(ocr), ocr);
  const brut = await page.evaluate(() => localStorage.getItem('oenotrack-db-v2') || '');
  ok('coffre de l’appareil : base chiffrée dans le navigateur', /"oenotrack-coffre"/.test(brut) && Object.keys(JSON.parse(brut)).sort().join() === ['appVersion', 'coffre', 'donnees', 'format', 'formatVersion', 'iv', 'nom'].join(), brut.slice(0, 120));
  // hors connexion
  await page.waitForTimeout(1500); await ctx.setOffline(true);
  await page.reload(); await page.waitForTimeout(2500);
  const hl = await page.evaluate(async () => { const r = { app: !!document.getElementById('tab-params') }; try { await loadXlsx(); r.xlsx = true; } catch (e) { r.xlsx = e.message; } try { await loadPdfLib(); r.pdflib = true; } catch (e) { r.pdflib = e.message; } try { r.pdfjs = (await chargerPdfjs()).version; } catch (e) { r.pdfjs = String(e.message || e); } return r; });
  ok('hors connexion : Œnotrack s’ouvre, SheetJS, pdf-lib et PDF.js disponibles (mis en cache dès l’installation)', hl.app && hl.xlsx === true && hl.pdflib === true && hl.pdfjs === '6.2.108', hl);
  // mot de passe de l'appareil
  await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main [role=tab]', { hasText: 'Sauvegarde' }).first().click(); await page.waitForTimeout(400);
  await page.locator('[data-coffre-carte] button', { hasText: 'Demander un mot de passe à l’ouverture…' }).click(); await page.waitForTimeout(250);
  const ov = page.locator('.overlay').last();
  await ov.locator('input[type=password]').nth(0).fill('court'); await ov.locator('input[type=password]').nth(1).fill('court'); await ov.locator('button', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(300);
  ok('mot de passe de l’appareil : trop court refusé', /trop court/.test(await txt(ov)));
  await ov.locator('input[type=password]').nth(0).fill('Phrase de l’appareil 2026'); await ov.locator('input[type=password]').nth(1).fill('Phrase de l’appareil 2026'); await ov.locator('button', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(4000);
  ok('… activé : demandé à chaque ouverture', (await page.locator('[data-coffre-carte="mdp"]').count()) === 1);
  await page.reload(); await page.waitForTimeout(1500);
  ok('réouverture : « Œnotrack est verrouillé », rien d’affiché avant le mot de passe', (await page.locator('[data-coffre="verrouille"]').count()) === 1 && (await page.locator('#tab-params').count()) === 0);
  await page.locator('[data-coffre] input[type=password]').fill('Mauvaise phrase 2026'); await page.locator('[data-coffre] button[type=submit]').click(); await page.waitForTimeout(3500);
  ok('… mauvais mot de passe refusé', /Mot de passe incorrect/.test(await txt(page.locator('[data-coffre]'))));
  await page.locator('[data-coffre] input[type=password]').fill('Phrase de l’appareil 2026'); await page.locator('[data-coffre] button[type=submit]').click(); await page.waitForTimeout(3500);
  ok('… bon mot de passe : données ouvertes', (await page.locator('#tab-params').count()) === 1 && (await page.locator('main').innerText()).length > 50);
  // clé perdue (données du navigateur effacées en partie) : rien n'est écrasé, la copie chiffrée est mise de côté
  await page.evaluate(() => new Promise((res) => { const r = indexedDB.deleteDatabase('oenotrack-coffre'); r.onsuccess = r.onerror = r.onblocked = () => res(); }));
  await page.reload(); await page.waitForTimeout(1800);
  ok('clé perdue : « Données de cet appareil illisibles », rien n’est écrasé', (await page.locator('[data-coffre="illisible"]').count()) === 1 && /"oenotrack-coffre"/.test(await page.evaluate(() => localStorage.getItem('oenotrack-db-v2') || '')));
  await page.locator('[data-coffre] button', { hasText: 'Repartir sur cet appareil…' }).first().click(); await page.waitForTimeout(200); await page.locator('[data-coffre-repartir] button', { hasText: /^Repartir$/ }).click(); await page.waitForTimeout(2500);
  const cles = await page.evaluate(() => Object.keys(localStorage));
  ok('… « Repartir » : Œnotrack s’ouvre, l’ancienne copie chiffrée gardée à part', (await page.locator('#tab-params').count()) === 1 && cles.some((k) => /^oenotrack-db-v2-illisible-/.test(k)), cles);
  await page.screenshot({ path: SC + '/shots/t73-site.png' });
  const csp2 = await page.evaluate(() => window.__csp);
  ok('aucune requête vers un CDN ou un site tiers', !externes.length, externes);
  ok('aucune violation de la politique de sécurité du contenu', !csp2.length, csp2);
  const vraies = errors.filter((e) => !/ERR_INTERNET_DISCONNECTED|net::/.test(e));
  ok('aucune erreur dans la console', !vraies.length, vraies);
  await browser.close();
}
srv.close();

// 2. fichier seul (CDN) : une bibliothèque modifiée est refusée avant d'être exécutée
{
  const NM = '/opt/npm-tools/node_modules/';
  const routes = async (route, u) => {
    if (u.includes('/react-dom@')) { await route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(NM + 'react-dom/umd/react-dom.production.min.js') }); return true; }
    if (u.includes('/react@')) { await route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(NM + 'react/umd/react.production.min.js') }); return true; }
    if (u.includes('pdf-lib')) { await route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(NM + 'pdf-lib/dist/pdf-lib.min.js', 'utf8') + '\n;window.__pirate = 1;' }); return true; }
    if (u.includes('xlsx')) { await route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(NM + 'xlsx/dist/xlsx.full.min.js') }); return true; }
    if (u.includes('pdfjs-dist') && u.endsWith('pdf.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(NM + 'pdfjs-dist/build/pdf.min.mjs', 'utf8') + '\n;globalThis.__pirate = 2;' }); return true; }
    return false;
  };
  const { browser, page, errors } = await open({ sri: true, https: true, routes });
  ok('fichier seul : React vérifié par son empreinte (integrity) puis affiché', (await page.locator('#tab-params').count()) === 1 && (await page.evaluate(() => window.React.version)) === '18.3.1');
  const r = await page.evaluate(async () => { const o = {}; try { await loadPdfLib(); o.pdflib = 'chargé'; } catch (e) { o.pdflib = e.message; } try { await chargerPdfjs(); o.pdfjs = 'chargé'; } catch (e) { o.pdfjs = String(e.message || e); } try { await loadXlsx(); o.xlsx = !!window.XLSX.utils; } catch (e) { o.xlsx = e.message; } o.pirate = window.__pirate || globalThis.__pirate || 0; return o; });
  ok('pdf-lib modifié sur le CDN : refusé, rien d’exécuté', /Bibliothèque refusée : pdflib/.test(r.pdflib) && !r.pirate, r);
  ok('PDF.js modifié sur le CDN : refusé avant import (empreinte des octets)', /Bibliothèque refusée : pdfjs/.test(r.pdfjs), r);
  ok('SheetJS intact : chargé', r.xlsx === true, r);
  const vraies = errors.filter((e) => !/integrity|Failed to find a valid digest|Failed to load resource/.test(e));
  ok('aucune autre erreur', !vraies.length, vraies);
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S) (t73)` : '\nTOUS LES TESTS PASSENT (t73)');
process.exitCode = ko ? 1 : 0;
