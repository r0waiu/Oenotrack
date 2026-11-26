// Base de test 0.35.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.34.0-alpha.1 rouverte par cette version, avec
// - une table d'épalement fictive pour la Cuve 03 (0 à 200 cm, 50 L/cm) ;
// - une entrée de moûts à deux partenaires dans la même citerne (onglets) : EARL Marchand (BL-FX-001 : deux moûts, dont un mesuré en cuve
//   à l'épalement) et Domaine Hennequin (DAE-FX-002 : un moût), les deux partenaires versant dans la Cuve 03 ;
// - un document joint à chaque partenaire, un document général.
// → test/fixtures/base-0.35.0-alpha.1-partenaires.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, opSave, baremeSave, docMetaAdd, cleLigne, getR, jaugeEntreeCuve, baremeDe, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.34.0-alpha.1-vinification.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
must(L.baremeSave(d, { nom: 'Cuve 03 (barème fictif)', cible: 'contenant', contenantId: 'ct24', mesure: 'hauteur', points: [[0, 0], [50, 2500], [100, 5000], [150, 7500], [200, 10000]], meta: { organisme: 'Exemple fictif' } }));
const date = '2026-11-20'; const R = L.getR(d, date); const avant = Object.values(R.portions).filter((p) => p.contenantId === 'ct24').reduce((s, p) => s + p.vol, 0);
// moût 1 (Marchand) : 1 000 L en Cuve 03 mesurés à 20 cm de plus que le contenu d'avant → volume calculé par l'épalement
const b = L.baremeDe(d, 'ct24'); const h1 = (avant + 1000) / 50; const j1 = L.jaugeEntreeCuve(b, h1, avant);
const lignes = [
  { compartiment: 'C1', cepageId: 'chard', fractionId: 'cuvee', cruId: 'cru-avize', qualifId: 'conv', millesime: '2026', couleur: 'blanc', apporteurId: 'apt5', numLot: 'BL-FX-001-1', analyses: { tap: 10.1, at: 7.6, ph: 3.08 }, volL: Math.round(j1.v), dests: [{ contenantId: 'ct24', volL: Math.round(j1.v) }], partId: 'pa1' },
  { compartiment: 'C2', cepageId: 'pm', fractionId: 'taille1', cruId: '', qualifId: 'conv', millesime: '2026', couleur: 'blanc', apporteurId: 'apt5', numLot: 'BL-FX-001-2', volL: 600, dests: [{ contenantId: 'ct23', volL: 600 }], partId: 'pa1' },
  { compartiment: 'C3', cepageId: 'pn', fractionId: 'cuvee', cruId: '', qualifId: 'conv', millesime: '2026', couleur: 'blanc', apporteurId: 'apt6', apporteurs: [{ id: 'apt6' }], numLot: 'DAE-FX-002-1', analyses: { tap: 9.9, at: 8.1 }, volL: 900, dests: [{ contenantId: 'ct24', volL: 900 }], partId: 'pa2' },
];
const spec = { type: 'entree_mout', date, notes: '', apporteurId: 'apt5', ref: 'BL-FX-001 / DAE-FX-002', immat: 'FX-123-AB', millesime: '2026', stade: 'mout', analyseModele: 'm_mout', entrees: lignes,
  partenaires: [{ id: 'pa1', apporteurId: 'apt5', ref: 'BL-FX-001', lignes: lignes.slice(0, 2).map(L.cleLigne) }, { id: 'pa2', apporteurId: 'apt6', ref: 'DAE-FX-002', lignes: [L.cleLigne(lignes[2])] }],
  jaugesCuves: [{ cle: L.cleLigne(lignes[0]), contenantId: 'ct24', mesure: 'hauteur', apres: h1, volAvant: avant, volL: Math.round(j1.v), baremeId: b.id }],
  lots: [{ contenantId: 'ct24', code: 'M26-FX-C', designation: 'Moût cuvée – EARL Marchand + Domaine Hennequin' }, { contenantId: 'ct23', code: 'M26-FX-T1', designation: 'Moût 1ère taille – EARL Marchand' }] };
const r = must(L.opSave(d, spec, null, {}));
must(L.docMetaAdd(d, { id: 'docfx-bon1', nom: 'bon-fictif-marchand.pdf', mime: 'application/pdf', taille: 1200, cat: 'bon', cible: { type: 'op', id: r.op.id }, partId: 'pa1' }));
must(L.docMetaAdd(d, { id: 'docfx-bul2', nom: 'bulletin-fictif-hennequin.pdf', mime: 'application/pdf', taille: 1500, cat: 'analyse', cible: { type: 'op', id: r.op.id }, partId: 'pa2' }));
must(L.docMetaAdd(d, { id: 'docfx-gen', nom: 'photo-citerne-fictive.jpg', mime: 'image/jpeg', taille: 900, cat: 'photo', cible: { type: 'op', id: r.op.id } }));
d.meta.modifLe = '2026-11-26T09:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.35.0-alpha.1-partenaires.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko · op', r.op.id, '· avant', avant, '· hauteur', h1, '· volume', Math.round(j1.v));
