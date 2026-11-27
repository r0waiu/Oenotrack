// Base de test 0.43.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.42.0-alpha.4 rouverte par cette version, avec
// - une revendication fictive « Nature fictive » rattachée à AVN avant l'ouverture (bascule vers VMN tracée) ;
// - un plafond de substance lié à la main à un produit des catalogues, un autre délié ;
// - des composés choisis pour une entrée de catalogue, puis le produit mis en stock depuis cette entrée.
// → test/fixtures/base-0.43.0-alpha.1-labels.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, plafondSave, plafondLienSet, plafondProduitsCatalogue, catalogueChercher, refComposesCatalogueSet, produitDepuisCatalogue, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.42.0-alpha.4-declarations.json'), 'utf8'));
base.lists.qualifs.push({ id: 'nat', label: 'Nature fictive', court: 'NAT', couleur: '#777777', rang: 9, referentiels: ['avn'] });
const d = L.normalizeDb(base); L.syncConfig(d);
const pv = must(L.plafondSave(d, { qualifId: 'bio', objet: 'substance', mot: 'pvpp', libelle: 'PVPP', autorise: false, source: 'Exemple fictif' }, null, '')).id;
const auto = L.plafondProduitsCatalogue(d, d.plafonds.find((p) => p.id === pv)).filter((y) => y.lie);
if (auto.length) must(L.plafondLienSet(d, pv, auto[0].e.id, 'retrait', ''));
const autre = L.catalogueChercher(d, { q: 'bentonite' })[0]; must(L.plafondLienSet(d, pv, autre.id, 'ajout', ''));
const tan = L.catalogueChercher(d, { q: 'tanin' })[0]; must(L.refComposesCatalogueSet(d, tan.id, [{ id: 'tanins', part: 0.5 }], ''));
must(L.produitDepuisCatalogue(d, tan.id));
d.meta.modifLe = '2026-12-06T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.43.0-alpha.1-labels.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'qualif nat →', d.lists.qualifs.find((q) => q.id === 'nat').referentiels, 'renommes', JSON.stringify(d.settings.referentiel.renommes), 'auto', auto.length, 'bentonite', autre.nom, 'tanin', tan.nom);
