# Dépôt GitHub d'Œnotrack (depuis 0.24.0-alpha.1) : le site en ligne à la racine (GitHub Pages, oenotrack.fr) et le code source.
# Usage : python3 tools/paquet-web.py && python3 tools/depot-github.py DOSSIER   (DOSSIER : clone git du dépôt, ou dossier vide)
#  - site : index.html, pages fixes, manifeste, service worker, icônes, LICENCE.txt ; config.json seulement s'il manque
#    (celui du dépôt garde vos identifiants Drive et vos mentions) ;
#  - code : src/, tools/, test/, build.mjs, README.md, CHANGELOG.md, CLAUDE.md, .gitignore — jamais NOTES.md ni test/t37.mjs (données privées) ;
#  - retirés : LISEZ-MOI.txt (remplacé par README.md) et code-source.zip (le code est dans le dépôt) ; LICENSE (texte GitHub) gardé.
import os, sys, shutil
racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if len(sys.argv) < 2: sys.exit('Usage : python3 tools/depot-github.py DOSSIER_DU_DEPOT')
depot = os.path.abspath(sys.argv[1]); os.makedirs(depot, exist_ok=True)
web = os.path.join(racine, 'dist', 'web', 'oenotrack-web')
if not os.path.exists(os.path.join(web, 'index.html')): sys.exit('Faites d’abord le paquet : python3 tools/paquet-web.py')
SITE = ['index.html', 'mentions-legales.html', 'confidentialite.html', 'cgu.html', 'licence.html', 'manifest.webmanifest', 'sw.js', 'icone-192.png', 'icone-512.png', 'icone-maskable-512.png', 'apple-touch-icon.png', 'LICENCE.txt']
for n in SITE:
    if os.path.exists(os.path.join(web, n)): shutil.copy(os.path.join(web, n), os.path.join(depot, n))
if not os.path.exists(os.path.join(depot, 'config.json')): shutil.copy(os.path.join(web, 'config.json'), os.path.join(depot, 'config.json'))
for n in ['LISEZ-MOI.txt', 'code-source.zip']:
    if os.path.exists(os.path.join(depot, n)): os.remove(os.path.join(depot, n))
PRIVES = {os.path.join('test', 't37.mjs')}
def copier(rel):
    src = os.path.join(racine, rel); dst = os.path.join(depot, rel)
    if os.path.isdir(src):
        if os.path.exists(dst): shutil.rmtree(dst)
        for base, dirs, fichiers in os.walk(src):
            dirs[:] = [d for d in dirs if d not in ('__pycache__', 'node_modules')]
            for f in fichiers:
                r = os.path.relpath(os.path.join(base, f), racine)
                if r in PRIVES: continue
                os.makedirs(os.path.join(depot, os.path.dirname(r)), exist_ok=True); shutil.copy(os.path.join(base, f), os.path.join(depot, r))
    else: shutil.copy(src, dst)
for rel in ['src', 'tools', 'test', 'build.mjs', 'README.md', 'CHANGELOG.md', 'CLAUDE.md', '.gitignore']: copier(rel)
n = sum(len(f) for base, _, f in os.walk(depot) if '.git' not in base.split(os.sep))
print('dépôt prêt :', depot, '—', n, 'fichiers (sans NOTES.md ni test/t37.mjs)')
