// Base de test 0.46.0-alpha.2 (données fictives) : la base 0.46.0-alpha.1 rouverte par cette version, avec deux appellations ajoutées
// depuis le référentiel (Chablis, Rioja) → test/fixtures/base-0.46.0-alpha.2-appellations.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, appChercher, appellationDepuisRef, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.46.0-alpha.1-operations.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
['Chablis', 'Rioja'].forEach((n) => must(L.appellationDepuisRef(d, L.appChercher(n, {})[0].id)));
d.meta.modifLe = '2026-12-15T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.46.0-alpha.2-appellations.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, d.lists.appellations.filter((a) => a.ref).map((a) => a.label).join(', '));
