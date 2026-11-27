// Base de test 0.42.0-alpha.4 (données fictives : jeu d'exemple) : la base 0.42.0-alpha.3 rouverte par cette version, avec
// - les réglages du déclarant (code récoltant, lieux, signataire fictifs) ;
// - une déclaration préalable de tirage du chantier (vin prévu, point de tirage) ;
// - une déclaration de fin de tirage du chantier, déposée (figée, référence fictive), avec un lot personnalisé (cuvée, revendications).
// → test/fixtures/base-0.42.0-alpha.4-declarations.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, replay, declarationTirageSave, declarationTirageDeposer, declarationTirageReglagesSet, chantierTirages, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.42.0-alpha.3-fournitures.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
must(L.declarationTirageReglagesSet(d, { codeRecoltant: 'RC-FICTIF', statut: 'recoltant', lieuTirage: 'Cuverie fictive', lieuStockage: 'Cave fictive', signataire: 'Signataire fictif, gérant', faitA: 'Ville fictive' }));
const ch = d.chantiersTirage[0];
must(L.declarationTirageSave(d, { type: 'prealable', date: '2026-11-28', chantierId: ch.id, champs: { dateTirage: '2026-12-02', vinHL: 12, pointGL: 24, mentions: 'Mention fictive' } }, null, ''));
const T = L.chantierTirages(d, ch.id); const premier = T[0];
const fin = must(L.declarationTirageSave(d, { type: 'finale', date: '2026-12-04', chantierId: ch.id, champs: { tav: 11.2, lots: { [premier.id]: { cuvee: 'Cuvée fictive', revendications: 'Premier Cru' } } } }, null, '')).id;
must(L.declarationTirageDeposer(d, L.replay(d), fin, { deposeLe: '2026-12-05', reference: 'ACC-FICTIF-01' }, ''));
d.meta.modifLe = '2026-12-05T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.42.0-alpha.4-declarations.json');
fs.writeFileSync(out, JSON.stringify(d));
const x = d.declarationsTirage.find((y) => y.id === fin).instantane.calcul;
console.log(L.APP_VERSION, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'lots', x.lots.length, 'total', x.totalHL.toFixed(3), 'VRTP', x.vrtpHL.toFixed(4), x.vrtpPct.toFixed(2), '%');
