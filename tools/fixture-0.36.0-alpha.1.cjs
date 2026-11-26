// Base de test 0.36.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.35.0-alpha.1 rouverte par cette version, avec
// - deux régularisations de stock (un inventaire compté, une casse) sur des lots fournisseurs d'intrants ;
// - des allergènes cochés (sulfites, enzymes) et des choix Oui / Non de revendications sur deux intrants ;
// - deux produits de maintenance (graisse alimentaire suivie en stock avec ses mouvements, joint sans suivi de stock), une FDS fictive jointe.
// → test/fixtures/base-0.36.0-alpha.1-intrants.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, arrivalRest, regulSave, produitSave, maintProduitSave, maintMouvementSave, docMetaAdd, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.35.0-alpha.1-partenaires.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const R = L.getR(d); const vivants = d.arrivages.filter((a) => L.arrivalRest(R, a) > 1 && d.produits.find((p) => p.id === a.produitId && p.categorie !== 'sec'));
const a1 = vivants[0]; const a2 = vivants.find((a) => a.produitId !== a1.produitId);
const rest1 = L.arrivalRest(R, a1);
must(L.regulSave(d, { arrivageId: a1.id, date: '2026-11-25', mode: 'compte', compte: Math.max(0, Math.round((rest1 - 1) * 100) / 100), motif: 'inventaire', notes: 'Inventaire de fin de campagne (fictif)' }, null, ''));
must(L.regulSave(d, { arrivageId: a2.id, date: '2026-11-25', mode: 'ecart', qty: 0.5, motif: 'casse', notes: 'Sachet percé (fictif)' }, null, ''));
const p1 = d.produits.find((p) => p.id === a1.produitId); const p2 = d.produits.find((p) => p.id === a2.produitId);
must(L.produitSave(d, { ...p1, allergenesListe: ['sulfites'], revendications: { bio: true, dem: false } }, p1.id));
must(L.produitSave(d, { ...p2, allergenesListe: ['enzymes'], revendications: { bio: false } }, p2.id));
const g = must(L.maintProduitSave(d, { nom: 'Graisse alimentaire fictive H1', fournisseur: 'Fournisseur fictif', usage: 'Graissage des pompes et du pressoir', contactAlimentaire: 'oui', caveVinif: 'oui', composition: 'Huile blanche, épaississant (fictif)', unite: 'kg', suiviStock: true, seuil: 1, champs: [{ label: 'Conditionnement', valeur: 'cartouche 400 g' }] }));
must(L.maintMouvementSave(d, { produitId: g.id, type: 'entree', date: '2026-11-02', qty: 4, numLot: 'GR-FX-1' }, null, ''));
must(L.maintMouvementSave(d, { produitId: g.id, type: 'sortie', date: '2026-11-15', qty: 1.2 }, null, ''));
must(L.maintMouvementSave(d, { produitId: g.id, type: 'regul', mode: 'compte', compte: 2.5, motif: 'inventaire', date: '2026-11-25' }, null, ''));
const j = must(L.maintProduitSave(d, { nom: 'Joint de porte de cuve fictif', fournisseur: 'Fournisseur fictif', usage: 'Portes de cuves inox', contactAlimentaire: 'oui', caveVinif: 'oui', composition: 'EPDM (fictif)', suiviStock: false, fdsNonRequise: true }));
must(L.docMetaAdd(d, { id: 'docfx-pm-fds', nom: 'fds-graisse-fictive.pdf', mime: 'application/pdf', taille: 1100, cat: 'fds', cible: { type: 'produitMaintenance', id: g.id }, revision: '2025-03-01' }));
d.meta.modifLe = '2026-11-26T09:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.36.0-alpha.1-intrants.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko · lots', a1.id, a2.id, '· produits', p1.nom, '/', p2.nom, '· maintenance', g.id, j.id);
