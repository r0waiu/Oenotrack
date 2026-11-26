// Base de test 0.30.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.29.0-alpha.1 rouverte par cette version, avec
// - les catalogues : un catalogue préinstallé masqué (SOEC), deux produits ajoutés depuis les catalogues (solution sulfureuse Laffort,
//   produit IOC chez le fournisseur IOC déjà présent), un catalogue importé fictif (« Œnologie Exemple », 3 lignes : 2 validées, 1 écartée) ;
// - la teneur en SO₂ du métabisulfite (0,5 g/g) et d'une solution (100 g/L) ; une analyse de SO₂ total avant la saisie groupée du 20/11 ;
// - les plafonds : exemples matérialisés, celui des vins effervescents en Conventionnel vérifié, une règle de substance (charbon interdit
//   en Bio, issue d'un cahier des charges fictif) ;
// - une opération qui dépasse la dose maximale, enregistrée avec son motif (op.depassement)
// → test/fixtures/base-0.30.0-alpha.1-intrants.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, contParts, opSave, produitSave, arrivageSave, analyseSave, produitDepuisCatalogue, catalogueChercher, catalogueMasquer, catalogueImportSave, catalogueLignesEtat, plafondValider, plafondSave, previewOp, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.29.0-alpha.1-cave.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const ad = d.utilisateurs.find((u) => u.profilId === 'pf_admin').id;
// teneur en SO₂ du métabisulfite (0,5 g de SO₂ par g)
const meta = d.produits.find((p) => /métabisulfite/i.test(p.nom));
must(L.produitSave(d, { ...meta, so2: '0,5 g/g', famille: 'sulfitage' }, meta.id));
// catalogues : SOEC masqué, deux produits ajoutés depuis les catalogues préinstallés
must(L.catalogueMasquer(d, 'cat:soec', true));
const sol = L.catalogueChercher(d, { fournisseur: 'Laffort', q: 'SOLUTION 10' }).find((e) => e.nom === 'SOLUTION 10');
const rS = must(L.produitDepuisCatalogue(d, sol.id));
const ioc = L.catalogueChercher(d, { fournisseur: 'IOC', q: 'CLARIFIANT XL' }).find((e) => e.nom === 'CLARIFIANT XL');
must(L.produitDepuisCatalogue(d, ioc.id));
const pSol = d.produits.find((p) => p.id === rS.id);
must(L.arrivageSave(d, { produitId: pSol.id, fournisseurId: pSol.fournisseurId, numLot: 'LF-SOL10-2611', date: '2026-11-02', dluo: '2028-11-02', qty: 20 }));
// catalogue importé (fictif), relu : 2 lignes validées, 1 écartée
const imp = must(L.catalogueImportSave(d, { fournisseur: 'Œnologie Exemple', marque: 'Exemple', titre: 'Catalogue fictif 2026', annee: '2026', fichier: 'catalogue-fictif.csv', mode: 'tableur', par: ad, lignes: [
  { nom: 'LEVURE EXEMPLE CH', famille: 'levure', unite: 'g', dose: '20-30 g/hL', cond: '500 g', page: '3' },
  { nom: 'TANIN EXEMPLE', famille: 'tanin', unite: 'g', dose: '5-15 g/hL', cond: '1 kg', page: '7', ue: true },
  { nom: 'PRODUIT EXEMPLE ÉCARTÉ', famille: '', unite: 'g', dose: '', cond: '', page: '9' },
] }));
const c = d.catalogues.find((x) => x.id === imp.id);
must(L.catalogueLignesEtat(d, imp.id, [c.lignes[0].id, c.lignes[1].id], 'valide')); must(L.catalogueLignesEtat(d, imp.id, [c.lignes[2].id], 'ecarte'));
// analyse de SO₂ total d'un lot sulfité par la saisie groupée du 20/11 (5 g/hL de métabisulfite → +25 mg/L)
const g1 = d.ops.filter((o) => o.groupe && o.groupe.id === 'grp-fixture-0291').sort((a, b) => a.groupe.rang - b.groupe.rang)[0];
const R0 = L.getR(d, '2026-11-15'); const lotA = R0.portions[g1.portionId].lotId;
must(L.analyseSave(d, { lotId: lotA, date: '2026-11-15', contenantId: R0.portions[g1.portionId].contenantId, modeleId: 'm_clair', valeurs: { so2t: 40, so2l: 12 }, notes: 'Analyse fictive (jeu d’essai 0.30)' }));
// plafonds : exemples matérialisés, un vérifié ; règle de substance d'un cahier des charges fictif
must(L.plafondValider(d, 'ex-conv-effervescent', ad));
must(L.plafondSave(d, { qualifId: 'bio', objet: 'substance', mot: 'charbon', libelle: 'Charbon œnologique', autorise: false, source: 'Cahier des charges fictif (jeu d’essai)', aVerifier: false }, null, ad));
// opération au-delà de la dose maximale (métabisulfite à 20 g/hL, maximum 15 en Conventionnel), enregistrée avec son motif
const D1 = '2026-11-21'; const R1 = L.getR(d, D1); const groupees = d.ops.filter((o) => o.groupe).map((o) => o.portionId);
const cand = Object.values(R1.portions).filter((p) => p.vol > 500 && !groupees.includes(p.id) && (R1.lots[p.lotId] || {}).qualif === 'conv').sort((a, b) => b.vol - a.vol)[0];
const arr = d.arrivages.find((a) => a.produitId === meta.id && a.qty > 1000) || d.arrivages.find((a) => a.produitId === meta.id);
const spec = { type: 'intrant', sousType: 'sulfitage', date: D1, notes: 'Dépassement volontaire (jeu d’essai fictif)', portionId: cand.id, lignes: [{ produitId: meta.id, arrivageId: arr.id, qty: Math.round(cand.vol * 20 / 100) }], prepUses: [], motif: 'Sulfitage' };
const pv = L.previewOp(d, spec); if (!pv.depassements || !pv.depassements.length) throw new Error('aucun dépassement prévu');
spec.depassement = { motif: 'Correction décidée après analyse (fictif)', par: ad, le: D1, details: pv.depassements.map((x) => ({ type: x.type, produitId: x.produitId || null, lotId: x.lotId || null, valeur: Math.round(x.valeur * 1000) / 1000, max: x.max, unite: x.unite, qualif: x.qualif || null, aVerifier: !!x.aVerifier })) };
must(L.opSave(d, spec));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.30.0-alpha.1-intrants.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', '· produits du catalogue', d.produits.filter((p) => p.catalogue).length, '· plafonds', d.plafonds.length, '· dépassements', pv.depassements.map((x) => x.type).join(','), '· lot analysé', lotA, '· lot dépassé', cand.lotId);
