// Base de test 0.46.0-alpha.1 (données fictives) : la base 0.45.0-alpha.1 rouverte par cette version, avec des opérations des autres vins
// (pigeage, électrodialyse) et un tirage en méthode ancestrale → test/fixtures/base-0.46.0-alpha.1-operations.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, replay, opSave, opDef, tirageFormatsCompat, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.45.0-alpha.1-bio.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const R = L.replay(d, '2026-12-05'); const P = (id) => ({ portionId: id, lotId: R.portions[id].lotId });
['pigeage', 'stab_electrodialyse'].forEach((id) => { d.lists.operations.find((o) => o.id === id).masque = false; });
must(L.opSave(d, { type: 'suivi', sousType: 'pigeage', date: '2026-12-05', ...P('por235'), lignes: [], motif: 'Pigeage', notes: 'Pigeage fictif' }));
must(L.opSave(d, { type: 'filtration', sousType: 'stab_electrodialyse', date: '2026-12-05', ...P('por251'), methodeId: (d.lists.methodesFiltration[0] || {}).id, equipementIds: [], lignes: [], pertes: [{ typeId: (d.lists.pertes || d.lists.typesPertes || [{}])[0].id || '', volL: 12 }] }));
const F = [{ format: 'bouteille', nb: 400, L: 0.75 }];
must(L.opSave(d, { type: 'tirage', date: '2026-12-05', sources: [{ ...P('por289'), volL: 300 }], prepUses: [], lignes: [], formats: F, ...L.tirageFormatsCompat(F), mode: 'ancestrale', lotSpec: { code: 'T-ANC-FX', designation: 'Pétillant naturel fictif', millesime: '2026' } }));
d.meta.modifLe = '2026-12-14T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.46.0-alpha.1-operations.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, d.ops.filter((o) => ['pigeage', 'stab_electrodialyse'].includes(o.sousType) || o.mode === 'ancestrale').length, 'opérations');
