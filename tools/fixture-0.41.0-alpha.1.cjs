// Base de test 0.41.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.40.0-alpha.2 rouverte par cette version, avec
// - une table de correspondance libre « Cuvée (fictive) » et une table liée aux cépages ;
// - des règles de codification datées : tirage (A + cuvée + année et mois en code champenois + jour), habillage (L + année + compteur à
//   rebours remis à zéro chaque jour + quantième), vinification (nouveau code au passage en « Vin clair ») ;
// - un lot de tirage codé par la règle, un changement de stade qui renomme un lot (ancien code gardé), un lot fini renommé à la main,
//   deux habillages, un réétiquetage et une mise en carton ; un code de lot chez le fournisseur.
// → test/fixtures/base-0.41.0-alpha.1-codification.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, replay, opSave, codifTableSet, codifVersionSet, codifRegleOptions, codifGenerer, codifTrace, codifCtxSources, codifCtxLot, codifParent, habillageSave, habillageCodeDefaut, lotRenommer, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.40.0-alpha.2-bulletins.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const par = (d.utilisateurs && d.utilisateurs[0] && d.utilisateurs[0].id) || '';
const tc = must(L.codifTableSet(d, { nom: 'Cuvée (fictive)', source: 'libre', lignes: [{ libelle: 'Brut fictif', code: 'BF' }, { libelle: 'Rosé fictif', code: 'RF' }] }, { par })).id;
must(L.codifTableSet(d, { nom: 'Cépages (codes fictifs)', source: 'cepages', lignes: [{ cle: 'chard', code: 'CH' }, { cle: 'pn', code: 'PN' }, { cle: 'pm', code: 'MN' }, { cle: 'chard+pn', code: 'CP' }] }, { par }));
must(L.codifVersionSet(d, 'tirage', { des: '2026-08-01', briques: [{ type: 'texte', valeur: 'A' }, { type: 'choix', tableId: tc, nom: 'cuvée' }, { type: 'date', champ: 'annee', encodage: 'champenois' }, { type: 'date', champ: 'mois', encodage: 'champenois' }, { type: 'date', champ: 'jour' }] }, { par }));
must(L.codifVersionSet(d, 'habillage', { des: '2026-08-01', briques: [{ type: 'texte', valeur: 'L' }, { type: 'date', champ: 'annee' }, { type: 'compteur', alphabet: 'alphaInv', chiffres: 1, raz: 'jour' }, { type: 'date', champ: 'quantieme' }] }, { par }));
must(L.codifVersionSet(d, 'vinification', { des: '2026-08-01', briques: [{ type: 'variable', variable: 'cepages', rendu: 'table', tableId: d.codifTables[1].id, nom: 'cépages' }, { type: 'millesime', mode: 'tous' }, { type: 'sep', valeur: '-' }, { type: 'compteur', chiffres: 1, raz: 'campagne' }] }, { par }));
must(L.codifRegleOptions(d, 'vinification', { declencheurs: ['vin_clair'], unicite: 'refus' }));
// tirage codé par la règle
const R = L.getR(d, '2026-11-26'); const P = Object.values(R.portions).filter((p) => p.vol > 300 && (R.lots[p.lotId] || {}).type !== 'mout').sort((a, b) => b.vol - a.vol)[0];
const ctx = { ...L.codifCtxSources(d, R, [{ lotId: P.lotId, volL: 300 }]), date: '2026-11-26', choix: { [tc]: d.codifTables[0].lignes[0].id } };
const g = L.codifGenerer(d, 'tirage', ctx);
const tir = must(L.opSave(d, { type: 'tirage', date: '2026-11-26', sources: [{ portionId: P.id, lotId: P.lotId, volL: 300 }], prepUses: [], lignes: [], nbBouteilles: 400, volBouteilleL: 0.75, densBase: null, densMix: null, sucreGL: null, lotSpec: { code: g.code, designation: 'Tirage fictif codifié', millesime: '2026', codif: L.codifTrace(g, g.code, ctx.choix) } })).op;
// changement de stade qui attribue un nouveau code (ancien gardé)
const R2 = L.getR(d, '2026-11-26'); const lv = Object.values(R2.lots).find((l) => l.type !== 'cuvee_tirage' && l.stade !== 'vin_clair' && (R2.lotVol[l.id] || 0) > 0 && l.id !== P.lotId);
const gv = L.codifGenerer(d, 'vinification', { ...L.codifCtxLot(d, R2, lv.id), date: '2026-11-26', parent: L.codifParent(lv), exclure: [lv.id] });
must(L.opSave(d, { type: 'etape', date: '2026-11-26', lotId: lv.id, newStade: 'vin_clair', nouveauCode: gv.code, codif: L.codifTrace(gv, gv.code) }));
// lot fini renommé à la main ; habillages, réétiquetage, mise en carton
const fini = d.lotsFinis[0]; must(L.lotRenommer(d, 'fini', fini.id, `${fini.code}-X`, 'Réétiquetage fictif', par));
const habiller = (src, nb, type) => { const h = { type, date: '2026-11-27', heure: '09:15', source: src, nb, code: '' }; const st = type === 'carton' ? 'expedition' : 'habillage';
  const gh = L.codifGenerer(d, st, { date: h.date, heure: h.heure, nb }); h.code = gh.code || L.habillageCodeDefaut(d, type, h.date); h.codif = L.codifTrace(gh, h.code); if (!h.codif) delete h.codif; return must(L.habillageSave(d, h, null, { par })).id; };
const h1 = habiller({ type: 'fini', id: fini.id }, 1200, 'habillage'); habiller({ type: 'fini', id: fini.id }, 600, 'habillage');
const h3 = habiller({ type: 'habillage', id: h1 }, 100, 'habillage'); habiller({ type: 'habillage', id: h3 }, 96, 'carton');
// entrée de vin achetée sur lattes : code du lot chez le fournisseur
const ap = (d.apporteurs || [])[0];
must(L.opSave(d, { type: 'reprise', sousType: 'entree_vin', date: '2026-11-27', nbBouteilles: 600, volL: 0, ...(ap ? { apporteurId: ap.id } : {}), lotSpec: { code: 'ACH-26-01', designation: 'Achat sur lattes fictif', millesime: 'NV', type: 'cuvee_tirage', qualifId: 'conv', cepages: {}, crus: {}, echelle: '', codeFournisseur: 'FOURN-FX-778' } }));
d.meta.modifLe = '2026-11-27T22:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.41.0-alpha.1-codification.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'tirage', tir.lotSpec.code, 'renommé', lv.code, '→', gv.code, 'habillages', d.habillages.map((h) => h.code).join(' '));
