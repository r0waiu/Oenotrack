# Paquet « Œnotrack en ligne » : dist/web/oenotrack-web/ (index.html complet, config.json, README.md, CHANGELOG.md) + zip
import os, json, zipfile, re
racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(racine, 'dist', 'cuverie.html'), encoding='utf8').read()
version = re.search(r"const APP_VERSION = '([^']+)'", open(os.path.join(racine, 'src', '10-core.js'), encoding='utf8').read()).group(1)
# icône d'onglet : le logo du modèle de base (tools/icones/icone.svg, rendu en PNG par tools/icones.mjs)
import urllib.parse
icone = 'data:image/svg+xml,' + urllib.parse.quote(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icones', 'icone.svg'), encoding='utf8').read().replace('\n', ''), safe="=:/'(),.-")
dossier = os.path.join(racine, 'dist', 'web', 'oenotrack-web'); os.makedirs(dossier, exist_ok=True)
cfg = os.path.join(dossier, 'config.json')
if not os.path.exists(cfg) or os.environ.get('CONFIG_VIDE'):
    json.dump({"google": {"clientId": ""}, "microsoft": {"clientId": ""}, "dropbox": {"appKey": ""}}, open(cfg, 'w', encoding='utf8'), indent=2)
# pages fixes (0.23.0-alpha.1) : informations légales et page d'accueil lisibles sans JavaScript, rendues par Œnotrack lui-même
# (tools/pages-statiques.mjs, Playwright) avec le config.json du paquet ; sans Playwright, le paquet se fait sans elles
import subprocess
PAGES_FIXES = ['mentions-legales.html', 'confidentialite.html', 'cgu.html', 'licence.html']
noscript = ''
try:
    r = subprocess.run(['node', os.path.join(racine, 'tools', 'pages-statiques.mjs'), dossier], capture_output=True, text=True, timeout=300)
    fa = os.path.join(dossier, 'accueil-noscript.html')
    if r.returncode == 0 and os.path.exists(fa): noscript = open(fa, encoding='utf8').read(); print(r.stdout.strip())
    else: print('pages fixes non générées :', (r.stderr or r.stdout)[-400:])
    if os.path.exists(fa): os.remove(fa)
except Exception as e:
    print('pages fixes non générées :', e)
# application installable (0.17.0-alpha.1) : manifeste, icônes, service worker (ouverture sans réseau)
page = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        f'<meta name="description" content="Œnotrack {version} — traçabilité de cuverie et de chai">\n<meta name="theme-color" content="#1E242B">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" sizes="192x192" href="icone-192.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="Œnotrack">\n'
        f'<link rel="icon" href="{icone}" sizes="any">\n</head>\n<body>\n' + (f'<noscript>{noscript}</noscript>\n' if noscript else '') + src + '\n</body>\n</html>\n')
open(os.path.join(dossier, 'index.html'), 'w', encoding='utf8').write(page)
manifeste = {"name": "Œnotrack — traçabilité de cuverie et de chai", "short_name": "Œnotrack", "description": "Traçabilité de cuverie et de chai : cuves, lots, opérations, registres, jaugeage.",
             "lang": "fr", "dir": "ltr", "start_url": "./", "scope": "./", "id": "./", "display": "standalone", "display_override": ["standalone", "minimal-ui"], "orientation": "any",
             "background_color": "#1E242B", "theme_color": "#1E242B", "categories": ["business", "productivity"],
             "icons": [{"src": "icone-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"}, {"src": "icone-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
                       {"src": "icone-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
json.dump(manifeste, open(os.path.join(dossier, 'manifest.webmanifest'), 'w', encoding='utf8'), ensure_ascii=False, indent=2)
import shutil
for n in ['icone-192.png', 'icone-512.png', 'icone-maskable-512.png', 'apple-touch-icon.png']: shutil.copy(os.path.join(racine, 'tools', 'icones', n), os.path.join(dossier, n))
import hashlib
empreinte = hashlib.sha1(page.encode('utf8') + b''.join(open(os.path.join(dossier, n), 'rb').read() for n in ['icone-192.png', 'icone-512.png', 'icone-maskable-512.png', 'apple-touch-icon.png'])).hexdigest()[:8]
sw = """// Œnotrack — service worker : l'application s'ouvre même sans réseau (cave, vignes) ; nouvelle version prise dès que le réseau est là
const VERSION = 'oenotrack-__VERSION__';
const COEUR = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './icone-512.png', './icone-maskable-512.png', './apple-touch-icon.png'];
const CDN = /^https:\\/\\/(cdnjs\\.cloudflare\\.com|cdn\\.jsdelivr\\.net|unpkg\\.com|cdn\\.tailwindcss\\.com|fonts\\.googleapis\\.com|fonts\\.gstatic\\.com)\\//;
// bibliothèques chargées à la demande (Excel, PDF) : mises en cache dès l'installation pour fonctionner aussi hors connexion
const LIBS = ['https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COEUR).catch(() => null).then(() => Promise.all(LIBS.map((u) => c.add(new Request(u, { mode: 'cors' })).catch(() => null))))).catch(() => null).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('oenotrack-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
const garder = (r, rep) => { if (rep && (rep.ok || rep.type === 'opaque')) { const cp = rep.clone(); caches.open(VERSION).then((c) => c.put(r, cp)).catch(() => null); } return rep; };
self.addEventListener('fetch', (e) => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === self.location.origin) {
    if (r.mode === 'navigate' || /\\/(index\\.html)?$/.test(u.pathname) || u.pathname.endsWith('config.json')) { // la page et config.json : le réseau d'abord
      const cle = r.mode === 'navigate' ? './index.html' : r;
      e.respondWith(fetch(r).then((rep) => garder(cle, rep)).catch(() => caches.match(cle).then((x) => x || caches.match('./')))); return;
    }
    e.respondWith(caches.match(r).then((x) => x || fetch(r).then((rep) => garder(r, rep)))); return;
  }
  if (CDN.test(r.url)) e.respondWith(caches.match(r).then((x) => x || fetch(r).then((rep) => garder(r, rep)))); // bibliothèques (versions figées)
  // Google Drive, OneDrive, Dropbox : jamais interceptés
});
""".replace('__VERSION__', version + '-' + empreinte)
open(os.path.join(dossier, 'sw.js'), 'w', encoding='utf8').write(sw)
# README.md (format GitHub, depuis 0.24.0-alpha.1, à la place de LISEZ-MOI.txt) : celui du dépôt, badge de version mis à jour ;
# CHANGELOG.md fabriqué à partir du journal des nouveautés de l'application (tools/changelog.mjs)
rm = os.path.join(racine, 'README.md'); texte = open(rm, encoding='utf8').read()
texte2 = re.sub(r'img\.shields\.io/badge/version-.*?-8C6E2F', 'img.shields.io/badge/version-' + version.replace('-', '--') + '-8C6E2F', texte)
if texte2 != texte: open(rm, 'w', encoding='utf8').write(texte2)
shutil.copy(rm, os.path.join(dossier, 'README.md'))
subprocess.run(['node', os.path.join(racine, 'tools', 'changelog.mjs')], check=True, capture_output=True)
shutil.copy(os.path.join(racine, 'CHANGELOG.md'), os.path.join(dossier, 'CHANGELOG.md'))
if os.path.exists(os.path.join(dossier, 'LISEZ-MOI.txt')): os.remove(os.path.join(dossier, 'LISEZ-MOI.txt'))
# licence et code source de cette version (depuis 0.21.0-alpha.1) : sans les notes de travail ni le test qui lit des documents privés de l'exploitation
shutil.copy(os.path.join(racine, 'LICENCE.txt'), os.path.join(dossier, 'LICENCE.txt'))
EXCLUS_RACINE = {'dist', 'NOTES.md', 'published-fragment.html', '.git', 'node_modules'}
EXCLUS = {os.path.join('test', 't37.mjs')}
nom_src = 'oenotrack-' + version.replace(' ', '-')
cs = os.path.join(dossier, 'code-source.zip')
with zipfile.ZipFile(cs, 'w', zipfile.ZIP_DEFLATED) as z:
    for base, dirs, fichiers in os.walk(racine):
        rel = os.path.relpath(base, racine)
        if rel == '.': dirs[:] = [d for d in dirs if d not in EXCLUS_RACINE]
        dirs[:] = sorted(d for d in dirs if d not in ('__pycache__', 'node_modules', '.git'))
        for f in sorted(fichiers):
            r = os.path.normpath(os.path.join(rel, f))
            if (rel == '.' and f in EXCLUS_RACINE) or r in EXCLUS: continue
            z.write(os.path.join(base, f), f'{nom_src}/{r}')
zp = os.path.join(racine, 'dist', 'web', 'oenotrack-web.zip')
with zipfile.ZipFile(zp, 'w', zipfile.ZIP_DEFLATED) as z:
    for n in ['index.html', 'config.json', 'README.md', 'CHANGELOG.md', 'LICENCE.txt', 'code-source.zip', 'manifest.webmanifest', 'sw.js', 'icone-192.png', 'icone-512.png', 'icone-maskable-512.png', 'apple-touch-icon.png'] + [x for x in PAGES_FIXES if os.path.exists(os.path.join(dossier, x))]: z.write(os.path.join(dossier, n), f'oenotrack-web/{n}')
print('paquet', version, os.path.getsize(zp) // 1024, 'Ko')
