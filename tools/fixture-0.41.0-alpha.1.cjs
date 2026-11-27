// Base de test 0.41.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.40.0-alpha.2 rouverte par cette version, avec
// - trois cuves fictives (« Cuve FX41-A », « -B », « -C ») ;
// - un taux de bourbes par fraction (cuvée 3 %, 1ère taille 4 %) et un taux par défaut du profil de pressurage (2,5 %) ;
// - une pesée et un marc de 4 000 kg dont les volumes sont ceux de sortie pressoir (non débourbés : cuvée 2 120 L, 1ère taille 520 L),
//   avec 100 L de bourbes ; débourbage de la cuvée saisi en cuverie (2 120 L repris, 72 L de bourbes → 2 048 L de clair).
// → test/fixtures/base-0.41.0-alpha.1-debourbe.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, contSave, fractionCont, pressoirParamsSet, pressoirsDe, peseeSave, marcSave, marcValider, opSave, marcDebourbe, APP_VERSION, APP_NUM };')({});
const num0 = (x) => Number(x) || 0;
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.40.0-alpha.2-bulletins.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const adm = d.utilisateurs.find((u) => u.identifiant !== 'chai') || d.utilisateurs[0]; const ctx = { par: adm.id, maintenant: '2026-09-27T08:10:00' };
must(L.fractionCont(d, 'edit', 'cuvee', { bourbesPct: 3 })); must(L.fractionCont(d, 'edit', 'taille1', { bourbesPct: 4 }));
must(L.pressoirParamsSet(d, { valeurs: { bourbesDefaut: 2.5 } }));
// trois cuves fictives dédiées (vides)
const libres = ['Cuve FX41-A', 'Cuve FX41-B', 'Cuve FX41-C'].map((nom) => { must(L.contSave(d, { nom, type: 'cuve', matiere: 'inox', volMax: 3000, statut: 'actif', siteId: (d.contenants[0] || {}).siteId || '' })); return d.contenants.find((c) => c.nom === nom).id; });
if (libres.length < 3) throw new Error('pas assez de cuves libres');
const cru = d.crus.find((c) => c.echelle === 'grand').id;
const pe = must(L.peseeSave(d, { date: '2026-09-27', heure: '07:40', cepageId: 'chard', brutKg: 4300, tareKg: 300, caisses: 80, etat: 'sain', tap: 10.3, apporteurId: d.apporteurs[0].id, cruId: cru }, null, ctx));
const pr = L.pressoirsDe(d)[0].id;
const ma = must(L.marcSave(d, { date: '2026-09-27', heureDebut: '08:00', heureFin: '11:30', equipementId: pr, charges: [{ apportId: pe.op.id, kg: 4000 }], code: 'FX-41-01', tavp: 10.4, bourbesL: 100,
  frac: { cuvee: { volL: 2120, contenantId: libres[0] }, taille1: { volL: 520, contenantId: libres[1] } } }, null, ctx));
must(L.marcValider(d, ma.op.id, ctx));
const op = d.ops.find((o) => o.id === ma.op.id); const fc = op.fractions.find((f) => f.fractionId === 'cuvee');
must(L.opSave(d, { type: 'debourbage', date: '2026-09-28', portionId: fc.portionId, destId: libres[2], volL: 2120, pertes: [{ typeId: 'bourbes', volL: 72 }], lignes: [], stade: 'mout_debourbe' }));
d.meta.modifLe = '2026-11-27T22:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.41.0-alpha.1-debourbe.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'débourbé', JSON.stringify(L.marcDebourbe(d, d.ops.find((o) => o.id === ma.op.id))));
