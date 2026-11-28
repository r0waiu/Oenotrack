// Base de test 0.49.0-alpha.1 (données fictives) : la base 0.48.0-alpha.1 rouverte par cette version ; assistant IA : niveau 2 réservé au
// modèle local (settings.ia.niveau2), une opération et un arrivage proposés par l'IA puis validés (trace « ia »), veille d'un texte du
// référentiel gardée (settings.referentiel.veille) → test/fixtures/base-0.49.0-alpha.1-ia.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, opSave, arrivageSave, iaNiveau2Set, veilleTextesSet, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.48.0-alpha.1-interface.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const camp = d.campagnes.find((c) => c.id === d.settings.campagneActive) || d.campagnes[0];
must(L.iaNiveau2Set(d, 'local', ''));
must(L.opSave(d, { type: 'note', date: camp.debut, notes: 'Relevé dicté (fictif)', ia: { usage: 'saisie', modele: 'modele-local-fictif', fournisseur: 'perso', local: true, le: '2026-12-23T09:00:00Z' } }, null));
must(L.arrivageSave(d, { produitId: d.produits[0].id, date: camp.debut, qty: 2, numLot: 'LOT-IA-FICTIF', ia: { usage: 'reception', modele: 'modele-fictif', fournisseur: 'anthropic', le: '2026-12-23T09:05:00Z' } }));
must(L.veilleTextesSet(d, { ue: { trouve: true, date: '2026-06-01', url: 'https://eur-lex.europa.eu/exemple-fictif', version: 'Version consolidée (fictive)' } }, ''));
d.meta.modifLe = '2026-12-23T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.49.0-alpha.1-ia.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, d.meta.versions.slice(-2));
