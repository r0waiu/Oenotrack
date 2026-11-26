// Base de test 0.32.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.31.0-alpha.1 rouverte par cette version, avec
// - les réglages de la DRM : n° d'accise, CVI et n° CIVC fictifs, DRM mensuelle ;
// - les produits de la DRM : exemples champenois copiés dans la base, produit mousseux vérifié avec des codes INAO et CIVC fictifs,
//   un champ inconnu (version future) sur un produit ;
// - un rattachement manuel (le rouge de Bouzy aux Coteaux champenois) ;
// - les bouteilles finies sorties en octobre 2026 (1 200 en France, 300 à l'export, 12 en dégustation) et la DRM d'octobre déposée ;
//   une saisie de novembre (non déposée) ;
// - un enrichissement au MCR (en plus de la chaptalisation au sucre du jeu d'exemple), pour le registre d'enrichissement
// → test/fixtures/base-0.32.0-alpha.1-drm.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, replay, opSave, drmReglageSet, drmProduitsDe, drmProduitSave, drmRattacher, drmSaisieSet, drmDeposer, drmCalcul, drmControles, arrivalRest, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.31.0-alpha.1-schemas.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const ad = d.utilisateurs.find((u) => u.profilId === 'pf_admin').id;
// réglages (identifiants fictifs)
must(L.drmReglageSet(d, { accise: 'FR012345E6789', cvi: '5101234567', civc: 'CIVC-0042', periodicite: 'mensuelle' }));
// produits : le mousseux vérifié, avec des codes fictifs (les exemples sont copiés dans la base à la 1re modification)
const vm = L.drmProduitsDe(d).find((p) => p.id === 'ex-champ-vm');
must(L.drmProduitSave(d, { ...vm, codeInao: '1S001M', codeCivc: 'CHMOUS01', aVerifier: false }, vm.id, ad));
d.drmProduits.find((p) => p.id === 'ex-lies').champFutur = { note: 'champ d’une version future, à garder' };
// rattachement manuel : le rouge de Bouzy aux Coteaux champenois
const rouge = d.lots.find((l) => /Coteaux champenois/.test(l.designation || '') && /rouge/i.test(l.designation || ''));
if (!rouge) throw new Error('lot de rouge introuvable');
must(L.drmRattacher(d, rouge.id, 'ex-coteaux'));
// bouteilles finies : sorties d'octobre 2026, DRM d'octobre déposée ; saisie de novembre (non déposée)
must(L.drmSaisieSet(d, 'M:2026-10', 'ex-champ-vm', { ventesFrance: 1200, definitives: 300, degustation: 12, obs: '' }));
const bl = L.drmControles(d, L.drmCalcul(d, 'M:2026-10')).filter((c) => c.niveau === 'bloquant'); if (bl.length) throw new Error(bl[0].msg);
must(L.drmDeposer(d, 'M:2026-10', ad));
must(L.drmSaisieSet(d, 'M:2026-11', 'ex-champ-vm', { ventesFrance: 240, degustation: 6, autres: 2, obs: 'casse au transport (fictif)' }));
// enrichissement au MCR sur une cuve de moût pressé en septembre 2026 (registre d'enrichissement)
const mcr = d.produits.find((p) => /MCR/.test(p.nom)); if (!mcr) throw new Error('MCR introuvable');
const R = L.replay(d); const dateE = '2026-09-13';
const Re = L.getR(d, dateE); const portion = Object.values(Re.portions).filter((p) => p.vol > 500 && Re.lots[p.lotId] && /moût|mout/i.test(Re.lots[p.lotId].stade || '') ).sort((a, b) => b.vol - a.vol)[0]
  || Object.values(Re.portions).filter((p) => p.vol > 500).sort((a, b) => b.vol - a.vol)[0];
if (!portion) throw new Error('aucune cuve pour l’enrichissement');
const ar = (d.arrivages || []).filter((a) => a.produitId === mcr.id && L.arrivalRest(Re, a) > 1e-6)[0];
const rE = must(L.opSave(d, { type: 'intrant', sousType: 'enrichissement', date: dateE, portionId: portion.id, notes: 'enrichissement fictif (jeu d’essai)',
  lignes: [{ produitId: mcr.id, arrivageId: ar ? ar.id : '', qty: '20' }], prepUses: [],
  enrichissement: { tap: 9.8, tav: 10.6, methode: 'mcr', sucreMCR: 0.65, mcrL: 20, sucreKg: 13, volL: Math.round(portion.vol + 20) } }));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.32.0-alpha.1-drm.json');
fs.writeFileSync(out, JSON.stringify(d));
const c10 = L.drmCalcul(d, 'M:2026-10');
console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', '· produits', d.drmProduits.length,
  '· rattachement', rouge.code, '· déposée', d.drmDeclarations.map((x) => x.periode).join(', '), '· mousseux fin octobre', (c10.lignes.find((x) => x.produitId === 'ex-champ-vm').s1 / 100).toFixed(2), 'hL',
  '· enrichissement MCR', rE.op.id, (Re.lots[portion.lotId] || {}).code, Math.round(portion.vol), 'L', '·', R.flows.length, 'mouvements');
