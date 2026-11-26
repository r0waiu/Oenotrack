// 0.17.0-alpha.1 : Œnotrack en ligne installable (manifeste, icônes, service worker) et ouverture sans réseau
// (0.23.0-alpha.1 : page d'accueil à la première ouverture du site, pages fixes des informations légales)
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import http from 'http';
const require = createRequire(import.meta.url); const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const dir = path.dirname(new URL(import.meta.url).pathname); const web = path.join(dir, '..', 'dist', 'web', 'oenotrack-web');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.txt': 'text/plain' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(web, p); if (!f.startsWith(web) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
await new Promise((ok) => srv.listen(8765, ok));
const log = (...a) => console.log(...a); const ok = (n, c, x) => log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined ? x : '');
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, isMobile: true, hasTouch: true, serviceWorkers: 'allow', locale: 'fr-FR' }); // navigateur en français (0.24.0-alpha.1 : langue de la première ouverture)
const errors = []; const shim = (n) => fs.readFileSync(path.join(dir, 'shim', n), 'utf8');
await ctx.route('**/*', (route) => { const u = route.request().url();
  if (u.startsWith('http://localhost:8765/')) return route.continue();
  if (u.includes('react-dom')) return route.fulfill({ contentType: 'text/javascript', body: '' });
  if (u.includes('/react/') || u.includes('/react@')) return route.fulfill({ contentType: 'text/javascript', body: shim('react-shim.js') });
  if (u.includes('tailwindcss')) return route.fulfill({ contentType: 'text/javascript', body: shim('tw.js') });
  if (u.includes('xlsx')) return route.fulfill({ contentType: 'text/javascript', body: 'window.XLSX={utils:{}};' });
  if (u.includes('fonts.g')) return route.fulfill({ contentType: 'text/css', body: '' });
  return route.abort(); });
const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto('http://localhost:8765/'); await page.waitForTimeout(1500);
const man = await page.evaluate(async () => { const l = document.querySelector('link[rel="manifest"]'); const r = await fetch(l.href); return { ok: r.ok, j: await r.json() }; });
ok('manifeste : nom, icônes 192 et 512, plein écran, démarrage', man.ok && man.j.short_name === 'Œnotrack' && man.j.display === 'standalone' && man.j.start_url === './' && ['192x192', '512x512'].every((s) => man.j.icons.some((i) => i.sizes === s)) && man.j.icons.some((i) => i.purpose === 'maskable'));
const icones = await page.evaluate(async () => Promise.all(['icone-192.png', 'icone-512.png', 'icone-maskable-512.png', 'apple-touch-icon.png'].map(async (n) => { const r = await fetch(n); const b = await r.blob(); const im = await createImageBitmap(b); return `${n}:${im.width}`; })));
ok('icônes : PNG aux bonnes tailles', icones.join() === 'icone-192.png:192,icone-512.png:512,icone-maskable-512.png:512,apple-touch-icon.png:180', icones.join());
const sw = await page.evaluate(async () => { const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]); return reg ? reg.active && reg.active.scriptURL : null; });
ok('service worker actif', /sw\.js$/.test(sw || ''), sw);
await page.reload(); await page.waitForTimeout(1500);
ok('page contrôlée par le service worker', await page.evaluate(() => !!navigator.serviceWorker.controller));
// 0.23.0-alpha.1 : première ouverture du site → page d'accueil (présentation), puis « Ouvrir Œnotrack » ; pages fixes et accueil sans JavaScript
ok('première ouverture du site : page d’accueil (présentation d’Œnotrack)', (await page.locator('[data-accueil]').count()) === 1 && (await page.locator('h1').first().innerText()) === 'Œnotrack' && (await page.locator('#tab-params').count()) === 0);
const fixes = await page.evaluate(async () => { const t = async (u) => { const r = await fetch(u); return r.ok ? await r.text() : ''; }; const i = await t('./'); return { noscript: /<noscript><div class="accueil"/.test(i) && /politique de confidentialité/.test(i), pages: (await Promise.all(['confidentialite.html', 'mentions-legales.html', 'cgu.html', 'licence.html'].map(t))).map((x) => /<main data-page=/.test(x) && /Œnotrack/.test(x)) }; });
ok('site : accueil lisible sans JavaScript, pages fixes des informations légales', fixes.noscript && fixes.pages.every(Boolean), fixes);
await page.locator('[data-accueil-ouvrir]').first().click(); await page.waitForTimeout(600);
ok('application affichée', (await page.locator('header').count()) > 0 && (await page.locator('#tab-params').count()) > 0);
await ctx.setOffline(true); srv.close();
await page.reload(); await page.waitForTimeout(2000);
ok('sans réseau : Œnotrack s’ouvre quand même', (await page.locator('#tab-params').count()) > 0, await page.title());
await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('main button', { hasText: 'Données & paramètres' }).first().click(); await page.waitForTimeout(300);
log('carte application :', (await page.locator('[data-installer]').innerText()).replace(/\s+/g, ' ').slice(0, 200));
ok('carte « Application » : consignes Android / iPhone', /Android/.test(await page.locator('[data-installer]').innerText()) && /Sur l’écran d’accueil/.test(await page.locator('[data-installer]').innerText()));
await page.screenshot({ path: (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots/t38-installer.png' });
log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close(); process.exit(0);
