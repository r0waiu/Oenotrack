// Œnotrack — service worker : l'application s'ouvre même sans réseau (cave, vignes) ; nouvelle version prise dès que le réseau est là
const VERSION = 'oenotrack-0.42.0-alpha.1-0f64ca70';
const COEUR = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './icone-512.png', './icone-maskable-512.png', './apple-touch-icon.png'];
// 0.38.0-alpha.1 : bibliothèques et polices servies par le site (vendor/) : mises en cache dès l'installation ; aucun CDN
// 0.38.0-alpha.3 : seules les polices de la charte par défaut sont mises en cache à l'installation (les autres le sont à leur premier
// usage, et gardées d'une version à l'autre) : environ 1,5 Mo de moins à télécharger
const VENDOR = ["./vendor/pdf-lib.min.js", "./vendor/pdfjs/build/pdf.min.mjs", "./vendor/pdfjs/build/pdf.worker.min.mjs", "./vendor/pdfjs/wasm/jbig2.wasm", "./vendor/pdfjs/wasm/openjpeg.wasm", "./vendor/pdfjs/wasm/qcms_bg.wasm", "./vendor/pdfjs/wasm/quickjs-eval.wasm", "./vendor/polices/barlow-latin-400-normal.woff2", "./vendor/polices/barlow-latin-500-normal.woff2", "./vendor/polices/barlow-latin-600-normal.woff2", "./vendor/polices/barlow-latin-ext-400-normal.woff2", "./vendor/polices/barlow-latin-ext-500-normal.woff2", "./vendor/polices/barlow-latin-ext-600-normal.woff2", "./vendor/polices/inter-latin-400-normal.woff2", "./vendor/polices/inter-latin-500-normal.woff2", "./vendor/polices/inter-latin-600-normal.woff2", "./vendor/polices/inter-latin-700-normal.woff2", "./vendor/polices/inter-latin-ext-400-normal.woff2", "./vendor/polices/inter-latin-ext-500-normal.woff2", "./vendor/polices/inter-latin-ext-600-normal.woff2", "./vendor/polices/inter-latin-ext-700-normal.woff2", "./vendor/polices/playfair-display-latin-600-normal.woff2", "./vendor/polices/playfair-display-latin-700-normal.woff2", "./vendor/polices/playfair-display-latin-ext-600-normal.woff2", "./vendor/polices/playfair-display-latin-ext-700-normal.woff2", "./vendor/polices/polices.css", "./vendor/react-dom.production.min.js", "./vendor/react.production.min.js", "./vendor/xlsx.full.min.js"];
const LIBS = VENDOR;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COEUR).catch(() => null).then(() => Promise.all(LIBS.map((u) => c.add(u).catch(() => null))))).catch(() => null).then(() => self.skipWaiting())); });
// polices déjà utilisées (autre charte) reprises de l'ancienne version avant son effacement : elles restent disponibles hors ligne
const reprendre = (k) => Promise.all([caches.open(k), caches.open(VERSION)]).then(([a, n]) => a.keys().then((rs) => Promise.all(rs.filter((r) => /\/vendor\/polices\/[^/]+\.woff2$/.test(new URL(r.url).pathname)).map((r) => n.match(r).then((x) => x || a.match(r).then((rep) => rep && n.put(r, rep))))))).catch(() => null);
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('oenotrack-') && k !== VERSION).map((k) => reprendre(k).then(() => caches.delete(k))))).then(() => self.clients.claim())); });
const garder = (r, rep) => { if (rep && (rep.ok || rep.type === 'opaque')) { const cp = rep.clone(); caches.open(VERSION).then((c) => c.put(r, cp)).catch(() => null); } return rep; };
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    if (r.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname) || u.pathname.endsWith('config.json')) { // la page et config.json : le réseau d'abord
      const cle = r.mode === 'navigate' ? './index.html' : r;
      e.respondWith(fetch(r).then((rep) => garder(cle, rep)).catch(() => caches.match(cle).then((x) => x || caches.match('./')))); return;
    }
    e.respondWith(caches.match(r).then((x) => x || fetch(r).then((rep) => garder(r, rep)))); return;
  }
  // Google Drive, OneDrive, Dropbox, services d'IA : jamais interceptés
});
