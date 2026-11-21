// Œnotrack — service worker : l'application s'ouvre même sans réseau (cave, vignes) ; nouvelle version prise dès que le réseau est là
const VERSION = 'oenotrack-0.26.0-alpha.2-dfb6cf17';
const COEUR = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './icone-512.png', './icone-maskable-512.png', './apple-touch-icon.png'];
const CDN = /^https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|cdn\.tailwindcss\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COEUR)).catch(() => null).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('oenotrack-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
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
  if (CDN.test(r.url)) e.respondWith(caches.match(r).then((x) => x || fetch(r).then((rep) => garder(r, rep)))); // bibliothèques (versions figées)
  // Google Drive, OneDrive, Dropbox : jamais interceptés
});
