// Base de test 0.44.0-alpha.1 (données fictives) : la base 0.43.0-alpha.3 rouverte par cette version, avec le prévisionnel des cuvées
// du chantier de tirage (blanc de blancs en mixtion, blanc de noirs et rosé d'assemblage par pompe doseuse), la cuve de mixtion et le lot
// tiré créés depuis la cuvée prévue, et une déclaration préalable déposée avec une ligne par cuvée
// → test/fixtures/base-0.44.0-alpha.1-cuvees.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, replay, opSave, chantierCuveeSave, declarationTirageSave, declarationTirageDeposer, tirageFormatsCompat, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.43.0-alpha.3-configuration.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d); const ch = d.chantiersTirage[0];
let R = L.replay(d, '2026-12-02'); const P = (id) => ({ portionId: id, lotId: R.portions[id].lotId });
must(L.chantierCuveeSave(d, ch.id, { nom: 'Blanc de blancs fictif', sources: [{ ...P('por315'), volL: 1000 }], pointGL: 24, mode: 'mixtion', formats: [{ format: 'bouteille', nb: 1300 }, { format: 'magnum', nb: 50 }] }, null, ''));
must(L.chantierCuveeSave(d, ch.id, { nom: 'Blanc de noirs fictif', sources: [{ ...P('por235'), volL: 500 }, { ...P('por291'), volL: 300 }], pointGL: 23, mode: 'pompe', formats: [{ format: 'bouteille', nb: 1100 }], notes: 'Cuvée fictive' }, null, ''));
must(L.chantierCuveeSave(d, ch.id, { nom: 'Rosé d’assemblage fictif', sources: [{ ...P('por304'), volL: 100 }, { ...P('por289'), volL: 900 }], vinHL: 9.5, pointGL: 24, mode: 'pompe', formats: [{ format: 'bouteille', nb: 1200 }, { format: 'demie', nb: 100 }] }, null, ''));
const mix = must(L.opSave(d, { type: 'assemblage', date: '2026-12-02', sources: [{ ...P('por315'), volL: 1000 }], destId: 'ct37', pertes: [], lignes: [], mixtion: true, cuveeId: 'cv1', chantierId: ch.id, prepUses: [{ prepId: 'prep473', volL: 40 }, { prepId: 'prep475', volL: 30 }], pointGL: 24, lotSpec: { code: 'MIX-BDB-FX', designation: 'Blanc de blancs fictif — mixtion', millesime: '2026', type: 'assemblage' } })).op;
R = L.replay(d, '2026-12-03'); const pm = Object.values(R.portions).find((x) => x.lotId === mix.lotId);
const F = [{ format: 'bouteille', nb: 1280, L: 0.75 }, { format: 'magnum', nb: 50, L: 1.5 }];
must(L.opSave(d, { type: 'tirage', date: '2026-12-03', sources: [{ portionId: pm.id, lotId: mix.lotId, volL: 1035 }], prepUses: [], lignes: [], formats: F, ...L.tirageFormatsCompat(F), mode: 'mixtion', chantierId: ch.id, cuveeId: 'cv1', pointGL: 24, casse: 4, lotSpec: { code: 'T-BDB-FX', designation: 'Blanc de blancs fictif', millesime: '2026' } }));
const pr = must(L.declarationTirageSave(d, { type: 'prealable', date: '2026-11-29', chantierId: ch.id, champs: { dateTirage: '2026-12-02' } }, null, ''));
must(L.declarationTirageDeposer(d, L.replay(d), pr.id, { deposeLe: '2026-11-29', reference: 'AIDAC-FICTIF-02' }, ''));
d.meta.modifLe = '2026-12-10T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.44.0-alpha.1-cuvees.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', ch.cuvees.length, 'cuvées');
