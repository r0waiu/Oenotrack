// Base de test 0.40.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.39.0-alpha.1 rouverte par cette version, avec
// - un produit « Sorbate de potassium (fictif) » et un produit « Citrate de cuivre 2 % (fictif) » dont les composés sont choisis à la main ;
// - les labels Demeter et S.A.I.N.S. choisis pour la revendication « dem », un label visé (Bio UE) sur un lot conventionnel ;
// - une correction de l'exploitation dans le référentiel (sorbate en UE : teneur max 150 mg/L) et une règle alignée sur le référentiel ;
// - un ajout de sorbate validé avec un motif de dépassement (alerte a posteriori justifiée).
// → test/fixtures/base-0.40.0-alpha.1-referentiel.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, produitSave, arrivageSave, opSave, previewOp, getR, replay, qualifReferentielsSet, lotLabelsVises, refExceptionSet, regleDepuisReferentiel, clone, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.39.0-alpha.1-plan.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const adm = d.utilisateurs.find((u) => u.identifiant !== 'chai') || d.utilisateurs[0];
const so = must(L.produitSave(d, { nom: 'Sorbate de potassium (fictif)', categorie: 'oeno', unite: 'g', famille: 'conservateur' })).id;
const cu = must(L.produitSave(d, { nom: 'Citrate de cuivre 2 % (fictif)', categorie: 'oeno', unite: 'g', composes: [{ id: 'citrate-cuivre', part: 0.02 }] })).id;
const aso = must(L.arrivageSave(d, { produitId: so, numLot: 'FX-SO-1', date: '2026-10-01', qty: 5000 })).id;
must(L.arrivageSave(d, { produitId: cu, numLot: 'FX-CU-1', date: '2026-10-01', qty: 1000 }));
must(L.qualifReferentielsSet(d, 'dem', ['demeter', 'sains']));
const R = L.getR(d); const p = Object.values(R.portions).filter((x) => (R.lots[x.lotId] || {}).qualif === 'conv' && x.vol > 1000).sort((a, b) => b.vol - a.vol)[0];
must(L.lotLabelsVises(d, p.lotId, ['bio-ue']));
must(L.refExceptionSet(d, 'ue|sorbate', { statut: 'oui', teneurMax: 150, condition: 'Correction fictive (jeu d’essai)' }, adm.id));
must(L.regleDepuisReferentiel(d, so, 'bio', adm.id));
// ajout de sorbate (dose fictive) sur un lot conventionnel qui vise aussi le bio : interdit + teneur dépassée → motif tracé
const vol = p.vol; const qty = Math.round(25 * vol / 100);
const spec = { type: 'intrant', sousType: '', date: '2026-11-20', portionId: p.id, lignes: [{ produitId: so, arrivageId: aso, qty }], prepUses: [], motif: 'Essai fictif' };
const pv = L.previewOp(d, spec); if (!pv.depassements.length) throw new Error('dépassement attendu');
spec.depassement = { motif: 'Essai fictif : dépassement volontaire (jeu d’essai)', par: adm.id, le: '2026-11-20', details: pv.depassements.map((x) => ({ type: x.type, produitId: x.produitId || null, lotId: x.lotId || null, valeur: x.valeur != null ? Math.round(x.valeur * 1000) / 1000 : null, max: x.max != null ? x.max : null, unite: x.unite || null, qualif: x.qualif || null, aVerifier: !!x.aVerifier, ...(x.label ? { label: x.label } : {}), ...(x.espece ? { espece: x.espece } : {}) })) };
must(L.opSave(d, spec));
d.meta.modifLe = '2026-11-27T20:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.40.0-alpha.1-referentiel.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'lot', p.lotId, 'dépassements', pv.depassements.map((x) => x.type).join(','));
