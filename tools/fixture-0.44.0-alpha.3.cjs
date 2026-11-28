// Base de test 0.44.0-alpha.3 (données fictives) : la base 0.44.0-alpha.2 rouverte par cette version, configuration guidée relancée
// avec la revendication VDC (Viticulture Durable en Champagne) → test/fixtures/base-0.44.0-alpha.3-vdc.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, persoDefauts, persoPlan, persoAppliquer, persoMemoriser, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.44.0-alpha.2-sans-haccp.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const rep = { ...L.persoDefauts(d, {}), revendications: [...new Set([...L.persoDefauts(d, {}).revendications, 'vdc'])] };
must(L.persoAppliquer(d, L.persoPlan(d, 'basique', rep, {}), '')); must(L.persoMemoriser(d, 'basique', rep, ''));
d.meta.modifLe = '2026-12-12T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.44.0-alpha.3-vdc.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, d.lists.qualifs.map((q) => q.id + (q.masque ? '(m)' : '')).join(','));
