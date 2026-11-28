// Base de test 0.47.0-alpha.3 (données fictives) : la base 0.47.0-alpha.2 rouverte par cette version ; onglet ouvert au démarrage
// « dernière page visitée », à la connexion « Tirages », au déverrouillage « Analyses » → test/fixtures/base-0.47.0-alpha.3-onglets.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, ongletDefautSet, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.47.0-alpha.2-termes.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
must(L.ongletDefautSet(d, 'derniere', 'demarrage')); must(L.ongletDefautSet(d, 'tirage', 'connexion')); must(L.ongletDefautSet(d, 'analyses', 'deverrouillage'));
d.meta.modifLe = '2026-12-20T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.47.0-alpha.3-onglets.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, d.meta.versions.slice(-3));
