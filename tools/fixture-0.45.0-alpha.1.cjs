// Base de test 0.45.0-alpha.1 (données fictives) : la base 0.44.0-alpha.3 rouverte par cette version (« FR-BIO-01 » d'exemple → « BIO »),
// puis code d'agrément de l'organisme certificateur saisi sur la revendication bio → test/fixtures/base-0.45.0-alpha.1-bio.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, qualifCodeAgrementSet, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.44.0-alpha.3-vdc.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
must(L.qualifCodeAgrementSet(d, 'bio', { codeAgrement: 'fr-bio-01', organisme: 'Organisme fictif' }, ''));
d.meta.modifLe = '2026-12-13T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.45.0-alpha.1-bio.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, JSON.stringify(d.lists.qualifs.find((q) => q.id === 'bio')), JSON.stringify(d.settings.bioLibelle));
