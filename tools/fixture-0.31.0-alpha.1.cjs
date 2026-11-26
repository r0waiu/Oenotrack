// Base de test 0.31.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.30.0-alpha.1 rouverte par cette version, avec
// - les schémas de vinification : exemples copiés dans la base (« Cuvée de Chardonnay, raisins sains » vérifié), un schéma maison
//   fictif (Meunier, 3 étapes), une copie de « Tailles, raisins sains » ; réglage « proposer à la création d'un lot » explicite ;
// - un schéma appliqué à un lot de cuvée pressé en 2026 : ses opérations à réaliser (p.schema), la première validée en opération
//   (op.schema), les autres encore à réaliser
// → test/fixtures/base-0.31.0-alpha.1-schemas.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, replay, opSave, previsionStatut, schemasDe, schemaValider, schemaSave, schemaDupliquer, schemasPourLot, schemaPlan, schemaAppliquer, arrivalRest, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.30.0-alpha.1-intrants.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const ad = d.utilisateurs.find((u) => u.profilId === 'pf_admin').id;
// schémas : exemple vérifié (copie des exemples dans la base), schéma maison fictif, copie d'un exemple ; réglage explicite
must(L.schemaValider(d, 'ex-cuvee-chard', ad));
must(L.schemaSave(d, { nom: 'Schéma maison fictif (jeu d’essai)', criteres: { cepages: ['pm'], fractions: [], etats: [] }, note: 'Fictif : doses inventées pour les tests.', aVerifier: false, etapes: [
  { id: 'm1', jour: 0, opId: 'sulfitage', famille: 'sulfitage', dose: 4, unite: 'so2', note: 'au débourbage' },
  { id: 'm2', jour: 1, opId: 'levurage', famille: 'levure', dose: 25, unite: 'g/hL', note: '' },
  { id: 'm3', jour: 2, opId: 'suivi', note: 'densité' },
] }, null, ad));
must(L.schemaDupliquer(d, 'ex-tailles', ad));
d.settings.schemas = { proposer: true };
// un lot de cuvée pressé en 2026 : le schéma le plus proche, appliqué (opérations à réaliser marquées)
const R = L.replay(d);
const press = d.ops.filter((o) => o.type === 'pressurage' && o.date >= '2026-01-01' && o.marc && o.marc.valide).sort((a, b) => (a.date < b.date ? -1 : 1));
let cible = null;
for (const o of press) {
  for (const f of (o.fractions || []).filter((x) => x.lotId && x.volL > 0)) {
    const ps = Object.values(R.portions).filter((p) => p.lotId === f.lotId && p.vol > 0.5).sort((a, b) => b.vol - a.vol);
    const sp = L.schemasPourLot(d, R, f.lotId);
    if (ps.length && sp.meilleur && sp.meilleur.id === 'ex-cuvee-chard') { cible = { op: o, lotId: f.lotId, portion: ps[0], vol: ps.reduce((t, p) => t + p.vol, 0), s: sp.meilleur }; break; }
  }
  if (cible) break;
}
if (!cible) throw new Error('aucun lot de cuvée de Chardonnay pressé en 2026');
const plan = L.schemaPlan(d, R, cible.s, { date: cible.op.date, vol: cible.vol });
const items = plan.filter((y) => !y.inconnue).map((y) => {
  const f = { date: y.date, notes: y.e.note || '' }; if (y.def.id !== y.base) f.sousType = y.def.id;
  if (y.base === 'etape') { f.lotId = cible.lotId; if (y.def.stadeAuto && y.def.stadeAuto.actif) f.newStade = y.def.stadeAuto.stade; } else f.portionId = cible.portion.id;
  if (['intrant', 'suivi'].includes(y.base)) {
    if (y.def.motif) f.motif = y.def.motif;
    if (y.produit) { const a = (d.arrivages || []).filter((z) => z.produitId === y.produit.id && L.arrivalRest(R, z) > 1e-6)[0]; f.lignes = [{ produitId: y.produit.id, arrivageId: a ? a.id : '', qty: y.qty == null ? '' : String(y.qty) }]; f.prepUses = []; }
  }
  return { type: y.base, date: y.date, f, resume: `${y.label} · ${(R.lots[cible.lotId] || {}).code || ''}${y.produit ? ` · ${y.produit.nom}` : ''}`, notes: y.e.note || '', etapeId: y.e.id };
});
must(L.schemaAppliquer(d, cible.lotId, cible.s, items));
// la première étape (sulfitage au pressurage) validée : opération enregistrée avec la marque du schéma, prévision réalisée
const p1 = d.previsions.filter((p) => p.schema && p.schema.lotId === cible.lotId).sort((a, b) => a.schema.rang - b.schema.rang)[0];
const rOp = must(L.opSave(d, { ...p1.f, type: p1.type, date: p1.date, schema: p1.schema }));
must(L.previsionStatut(d, p1.id, 'realisee', rOp.op.id));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.31.0-alpha.1-schemas.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', '· schémas', d.schemas.length, '· lot', (R.lots[cible.lotId] || {}).code, cible.lotId, '· étapes', items.length, '· opération', rOp.op.id, rOp.op.type, rOp.op.sousType || '');
