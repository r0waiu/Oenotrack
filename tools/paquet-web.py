# Paquet « Œnotrack en ligne » : dist/web/oenotrack-web/ (index.html complet, config.json, README.md, CHANGELOG.md) + zip
import os, json, zipfile, re, shutil
racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = open(os.path.join(racine, 'dist', 'cuverie.html'), encoding='utf8').read()
version = re.search(r"const APP_VERSION = '([^']+)'", open(os.path.join(racine, 'src', '10-core.js'), encoding='utf8').read()).group(1)
# icône d'onglet : le logo du modèle de base (tools/icones/icone.svg, rendu en PNG par tools/icones.mjs)
import urllib.parse
icone = 'data:image/svg+xml,' + urllib.parse.quote(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icones', 'icone.svg'), encoding='utf8').read().replace('\n', ''), safe="=:/'(),.-")
dossier = os.path.join(racine, 'dist', 'web', 'oenotrack-web'); os.makedirs(dossier, exist_ok=True)
cfg = os.path.join(dossier, 'config.json')
# identifiants publics du site officiel (config.json de la racine, déclarés chez Google, Microsoft et Dropbox pour https://oenotrack.pages.dev ;
# ce ne sont pas des secrets) repris dans le paquet ; CONFIG_VIDE=1 : paquet sans identifiants (autre hébergement, chacun les siens)
cfg_racine = os.path.join(racine, 'config.json')
if os.environ.get('CONFIG_VIDE') or not os.path.exists(cfg_racine):
    if not os.path.exists(cfg) or os.environ.get('CONFIG_VIDE'):
        json.dump({"google": {"clientId": ""}, "microsoft": {"clientId": ""}, "dropbox": {"appKey": ""}}, open(cfg, 'w', encoding='utf8'), indent=2)
else:
    shutil.copy(cfg_racine, cfg)
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
# 0.38.0-alpha.1 : chaîne d'approvisionnement — bibliothèques et polices copiées à côté de la page (vendor/, même origine), vérifiées
# (empreintes de src/16r-bibliotheques.js) ; plus aucun CDN contacté par le site ; politique de sécurité du contenu (CSP) stricte
import hashlib, base64, shutil
NM = os.environ.get('OENOTRACK_NODE_MODULES', '/opt/npm-tools/node_modules')
bibt = open(os.path.join(racine, 'src', '16r-bibliotheques.js'), encoding='utf8').read()
d0 = bibt.index('/*BIB-DEBUT*/'); f0 = bibt.index('/*BIB-FIN*/')
BIB = json.loads(bibt[bibt.index('{', d0):bibt.rindex('}', d0, f0) + 1])
vendor = os.path.join(dossier, 'vendor'); shutil.rmtree(vendor, ignore_errors=True); os.makedirs(vendor)
def pkg(npm): return npm.rsplit('@', 1)[0]
def copie(a, b):
    os.makedirs(os.path.dirname(b), exist_ok=True); shutil.copyfile(a, b)
for nom, b in BIB.items():
    f = os.path.join(NM, pkg(b['npm']), b['fichier']); o = open(f, 'rb').read()
    h = 'sha384-' + base64.b64encode(hashlib.sha384(o).digest()).decode()
    if h != b['sri']: raise SystemExit(f'bibliothèque {nom} : empreinte {h} différente de {b["sri"]} — paquet refusé')
    copie(f, os.path.join(vendor, b['local']))
pdfjs = os.path.join(NM, 'pdfjs-dist')
for sd in ['wasm', 'standard_fonts', 'cmaps']: shutil.copytree(os.path.join(pdfjs, sd), os.path.join(vendor, 'pdfjs', sd))
for n in ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js']: copie(os.path.join(NM, 'tesseract.js-core', n), os.path.join(vendor, 'tesseract', 'core', n))
copie(os.path.join(NM, '@tesseract.js-data', 'fra', '4.0.0_best_int', 'fra.traineddata.gz'), os.path.join(vendor, 'tesseract', 'lang', 'fra.traineddata.gz'))
# licences des bibliothèques copiées
for p0 in sorted({pkg(b['npm']) for b in BIB.values()} | {'tesseract.js-core', '@tesseract.js-data/fra'}):
    for ln in ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'license']:
        if os.path.exists(os.path.join(NM, p0, ln)): copie(os.path.join(NM, p0, ln), os.path.join(vendor, 'LICENCES', p0.replace('/', '-') + '.txt')); break
# polices (Fontsource, mêmes familles et graisses que Google Fonts) : sous-ensembles latin et latin étendu, WOFF2
m = re.search(r'<link rel="stylesheet" href="(https://fonts\.googleapis\.com/css2\?[^"]+)">', src)
css = ['/* Œnotrack — polices hébergées avec la page (Fontsource, licence SIL OFL 1.1) */']
for fam in re.findall(r'family=([^&]+)', m.group(1).replace('&amp;', '&')):
    nomf, _, poids = fam.partition(':wght@'); nomf = nomf.replace('+', ' '); dp = nomf.lower().replace(' ', '-')
    for w in poids.split(';'):
        txt = open(os.path.join(NM, '@fontsource', dp, f'{w}.css'), encoding='utf8').read()
        for bloc in re.findall(r'/\* ([\w-]+) \*/\s*(@font-face \{[^}]+\})', txt):
            if not re.search(r'-(latin|latin-ext)-\d+-normal$', bloc[0]): continue
            fw = re.search(r'url\(\./files/([^)]+\.woff2)\)', bloc[1]).group(1)
            copie(os.path.join(NM, '@fontsource', dp, 'files', fw), os.path.join(vendor, 'polices', fw))
            css.append(re.sub(r"src: [^;]+;", f"src: url({fw}) format('woff2');", bloc[1]))
    lic = os.path.join(NM, '@fontsource', dp, 'LICENSE')
    if os.path.exists(lic): copie(lic, os.path.join(vendor, 'LICENCES', f'police-{dp}.txt'))
open(os.path.join(vendor, 'polices', 'polices.css'), 'w', encoding='utf8').write('\n'.join(css) + '\n')
src = src.replace(m.group(0), '<link rel="stylesheet" href="vendor/polices/polices.css">')
for nom in ['react', 'reactDom']:
    b = BIB[nom]; u = f'https://cdn.jsdelivr.net/npm/{b["npm"]}/{b["fichier"]}'
    if u not in src: raise SystemExit(f'adresse de {nom} introuvable dans la page')
    src = src.replace(f'src="{u}"', f'src="vendor/{b["local"]}"')
if re.search(r'https://(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|unpkg\.com|cdn\.tailwindcss\.com|fonts\.googleapis\.com)[^"\']*["\'][^>]*>', src.split('/*__APPJS__*/')[0][:20000]): print('attention : adresse de CDN restante dans l\'en-tête de la page')
# CSP : scripts de la page (empreintes SHA-256 des scripts en ligne) et du site seulement ; connexions limitées aux services utilisés
cfgj = {}
try: cfgj = json.load(open(cfg, encoding='utf8'))
except Exception: cfgj = {}
CONNECT = ["'self'", 'https://api.anthropic.com', 'https://api.openai.com', 'https://generativelanguage.googleapis.com', 'https://api.mistral.ai', 'https://openrouter.ai',
           'https://www.googleapis.com', 'https://oauth2.googleapis.com', 'https://accounts.google.com', 'https://graph.microsoft.com', 'https://login.microsoftonline.com', 'https://login.live.com',
           'https://api.onedrive.com', 'https://*.sharepoint.com', 'https://*.1drv.com', 'https://*.livefilestore.com', 'https://*.microsoftpersonalcontent.com',
           'https://api.dropboxapi.com', 'https://content.dropboxapi.com', 'https://*.dropboxusercontent.com', 'http://localhost:*', 'http://127.0.0.1:*']
plus = [x for x in ((cfgj.get('securite') or {}).get('connexions') or []) if isinstance(x, str) and re.match(r'^https://[\w*.-]+(:\d+)?$', x)]
def csp_de(page_txt):
    hs = sorted({"'sha256-" + base64.b64encode(hashlib.sha256(x.encode('utf8')).digest()).decode() + "'" for x in re.findall(r'<script>([\s\S]*?)</script>', page_txt)})
    return '; '.join([
        "default-src 'self'", "script-src 'self' " + ' '.join(hs) + " 'wasm-unsafe-eval' https://accounts.google.com/gsi/client", "worker-src 'self' blob:",
        "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style", "font-src 'self' data:", "img-src 'self' data: blob:", "media-src 'self' blob:",
        'connect-src ' + ' '.join(CONNECT + plus), "frame-src 'self' blob: https://accounts.google.com", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "manifest-src 'self'"])
# application installable (0.17.0-alpha.1) : manifeste, icônes, service worker (ouverture sans réseau)
page = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        f'<meta name="description" content="Œnotrack {version} — traçabilité de cuverie et de chai">\n<meta name="theme-color" content="#1E242B">\n'
        '<link rel="manifest" href="manifest.webmanifest">\n<link rel="icon" type="image/png" sizes="192x192" href="icone-192.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n'
        '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="Œnotrack">\n'
        f'<link rel="icon" href="{icone}" sizes="any">\n<meta name="oenotrack-bibliotheques" content="vendor/">\n<!--__CSP__-->\n</head>\n<body>\n' + (f'<noscript>{noscript}</noscript>\n' if noscript else '') + src + '\n</body>\n</html>\n')
page = page.replace('<!--__CSP__-->', f'<meta http-equiv="Content-Security-Policy" content="{csp_de(page)}">')
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
# polices de la charte par défaut « oenotrack » (head.html : Inter, Playfair Display) et Barlow (courbes, étiquettes QR, toutes chartes)
POLICES_PRECACHE = r'(inter|playfair-display|barlow)-latin'
sw = """// Œnotrack — service worker : l'application s'ouvre même sans réseau (cave, vignes) ; nouvelle version prise dès que le réseau est là
const VERSION = 'oenotrack-__VERSION__';
const COEUR = ['./', './index.html', './manifest.webmanifest', './icone-192.png', './icone-512.png', './icone-maskable-512.png', './apple-touch-icon.png'];
// 0.38.0-alpha.1 : bibliothèques et polices servies par le site (vendor/) : mises en cache dès l'installation ; aucun CDN
// 0.38.0-alpha.3 : seules les polices de la charte par défaut sont mises en cache à l'installation (les autres le sont à leur premier
// usage, et gardées d'une version à l'autre) : environ 1,5 Mo de moins à télécharger
const VENDOR = __VENDOR__;
const LIBS = VENDOR;
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(COEUR).catch(() => null).then(() => Promise.all(LIBS.map((u) => c.add(u).catch(() => null))))).catch(() => null).then(() => self.skipWaiting())); });
// polices déjà utilisées (autre charte) reprises de l'ancienne version avant son effacement : elles restent disponibles hors ligne
const reprendre = (k) => Promise.all([caches.open(k), caches.open(VERSION)]).then(([a, n]) => a.keys().then((rs) => Promise.all(rs.filter((r) => /\/vendor\/polices\/[^/]+\.woff2$/.test(new URL(r.url).pathname)).map((r) => n.match(r).then((x) => x || a.match(r).then((rep) => rep && n.put(r, rep))))))).catch(() => null);
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('oenotrack-') && k !== VERSION).map((k) => reprendre(k).then(() => caches.delete(k))))).then(() => self.clients.claim())); });
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
  // Google Drive, OneDrive, Dropbox, services d'IA : jamais interceptés
});
""".replace('__VERSION__', version + '-' + empreinte).replace('__VENDOR__', json.dumps(['./vendor/' + x for x in sorted([BIB[n]['local'] for n in ['react', 'reactDom', 'pdflib', 'xlsx', 'pdfjs', 'pdfjsWorker']] + ['polices/polices.css'] + ['polices/' + f for f in os.listdir(os.path.join(vendor, 'polices')) if f.endswith('.woff2') and re.match(POLICES_PRECACHE, f)] + ['pdfjs/wasm/' + f for f in os.listdir(os.path.join(vendor, 'pdfjs', 'wasm')) if f.endswith('.wasm')])]))
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
EXCLUS_RACINE = {'dist', 'NOTES.md', 'published-fragment.html', '.git', 'node_modules', 'vendor', '.claude'}  # .claude : outils locaux (copies de travail), jamais dans le code source livré
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
    for base, _d, fichiers in os.walk(vendor):
        for f in sorted(fichiers): q = os.path.join(base, f); z.write(q, 'oenotrack-web/' + os.path.relpath(q, dossier).replace(os.sep, '/'))
print('paquet', version, os.path.getsize(zp) // 1024, 'Ko')
