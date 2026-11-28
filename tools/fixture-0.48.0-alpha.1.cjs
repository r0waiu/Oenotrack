// Base de test 0.48.0-alpha.1 (données fictives) : la base 0.47.0-alpha.3 rouverte par cette version (refonte de l'interface : aucune
// donnée nouvelle dans la base — favoris d'opérations, aides repliées, listes repliées restent sur l'appareil) ; un cépage ajouté
// → test/fixtures/base-0.48.0-alpha.1-interface.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, nid, APP_VERSION };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.47.0-alpha.3-onglets.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
d.lists.cepages.push({ id: L.nid(d, 'cep'), label: 'Cépage fictif 0.48', couleur: 'blanc' });
d.meta.modifLe = '2026-12-22T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.48.0-alpha.1-interface.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, d.meta.versions.slice(-3));
