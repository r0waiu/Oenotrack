// Base de test 0.44.0-alpha.2 (données fictives) : la base 0.44.0-alpha.1 rouverte par cette version (fiche HACCP de la chaîne et contrôles
// de réception de la verrerie des versions antérieures gardés tels quels), avec un retour au fournisseur et une cuvée prévue relue
// → test/fixtures/base-0.44.0-alpha.2-sans-haccp.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, replay, arrivalRest, fournitureRetourSave, chantierCuveeSave, chantierCuvee, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.44.0-alpha.1-cuvees.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d); const R = L.replay(d); const ch = d.chantiersTirage[0];
const a = d.arrivages.find((x) => x.controleReception && x.controleReception.decision !== 'refuse' && L.arrivalRest(R, x) > 10);
must(L.fournitureRetourSave(d, { arrivageId: a.id, date: '2026-12-04', qty: 10, bon: 'RET-FICTIF-2', raison: 'Cols ébréchés (fictif)' }, ''));
must(L.chantierCuveeSave(d, ch.id, { ...L.chantierCuvee(d, ch.id, 'cv3'), notes: 'Rosé relu (fictif)' }, 'cv3', ''));
d.meta.modifLe = '2026-12-11T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.44.0-alpha.2-sans-haccp.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'retour sur', a.numLot, '; fiche', !!ch.haccp, '; contrôles', d.arrivages.filter((x) => x.controleReception).length);
