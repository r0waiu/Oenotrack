// Base de test 0.38.0-alpha.3 (données fictives : jeu d'exemple) : la base 0.38.0-alpha.2 rouverte par cette version, avec
// - une fraction ajoutée « Taille de presse » et son rôle explicite (taille) ;
// - un second dégorgement partiel (lot fini LF-26-003) : SO₂ de la liqueur imputé au lot fini.
// → test/fixtures/base-0.38.0-alpha.3-audit.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, fractionCont, opSave, clone, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.38.0-alpha.2-cles.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
must(L.fractionCont(d, 'add', null, { label: 'Taille de presse', suffix: 'TP', pressurage: true }));
const deg = d.ops.find((o) => o.type === 'degorgement');
if (deg) { const s = L.clone(deg); delete s.id; delete s.lotFiniId; s.date = '2026-10-07'; s.nb = 120; s.lotFiniSpec = { code: 'LF-26-003', designation: 'Brut – dégorgement partiel (fictif)', dosageGL: 8 }; must(L.opSave(d, s)); }
d.meta.modifLe = '2026-11-26T18:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.38.0-alpha.3-audit.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko');
