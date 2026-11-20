/* ============ TRAÇABILITÉ : recherches amont / aval (intrants, crus, apporteurs) ============ */

// Intrants (R.apps) appliqués à un ensemble de lots, regroupés par produit + n° de lot fournisseur.
function intrantsForLots(db, R, lotIds, withAnc) {
  const set = new Set(lotIds);
  if (withAnc) lotIds.forEach((id) => ancestors(db, id).forEach((a) => set.add(a)));
  const rows = {};
  R.apps.filter((a) => a.produitId && a.lotId && set.has(a.lotId)).forEach((a) => {
    const k = `${a.produitId}|${a.arrivageId || ''}`;
    const r = (rows[k] = rows[k] || { produitId: a.produitId, arrivageId: a.arrivageId, numLot: a.numLot, unite: a.unite, qty: 0, n: 0, lots: new Set(), direct: false, unauth: false });
    r.qty += a.qty; r.n += 1; r.lots.add(a.lotId); if (lotIds.includes(a.lotId)) r.direct = true; if (a.unauth) r.unauth = true;
  });
  return Object.values(rows).sort((x, y) => (prodOf(db, x.produitId).nom || '').localeCompare(prodOf(db, y.produitId).nom || '', 'fr'));
}

// Cibles d'une application d'intrant : lots de vin et/ou lots finis réellement touchés
function appTargets(db, R, a) {
  if (a.kind === 'prep') {
    const lots = uniq(R.prepUse.filter((u) => u.prepId === a.prepId && u.lotId).map((u) => u.lotId));
    const finis = (db.lotsFinis || []).filter((f) => (f.prepIds || []).includes(a.prepId)).map((f) => f.id);
    return { lots, finis };
  }
  if (a.kind === 'deg') return { lots: [], finis: (db.lotsFinis || []).filter((f) => f.opId === a.opId).map((f) => f.id) };
  return { lots: a.lotId ? [a.lotId] : [], finis: [] };
}

// Part (0..1) d'un lot « target » qui provient du lot « source » (au prorata des volumes engagés dans les assemblages)
function shareFrom(db, target, source, memo = {}, guard = new Set()) {
  if (target === source) return 1;
  const k = `${target}>${source}`; if (k in memo) return memo[k];
  if (guard.has(target)) return 0; guard.add(target);
  const l = lotById(db, target); let r = 0;
  if (l && l.sources && l.sources.length) { const tot = sum(l.sources, (s) => s.volL); if (tot > 0) r = sum(l.sources, (s) => (num(s.volL) / tot) * shareFrom(db, s.lotId, source, memo, guard)); }
  else if (l && l.type === 'fraction' && (l.parentIds || []).length && l.apports == null) r = shareFrom(db, l.parentIds[0], source, memo, guard);
  guard.delete(target); memo[k] = r; return r;
}

const stockOfLot = (R, id) => ({ vol: R.lotVol[id] || 0, bottles: (R.tir[id] || {}).nb || 0, conts: uniq(Object.values(R.portions).filter((p) => p.lotId === id).map((p) => p.contenantId)) });

// Rappel de lot (HACCP) : où sont passés les intrants d'un produit / de certains lots fournisseurs ?
function traceIntrant(db, R, { produitId, arrivageIds }) {
  const arrs = db.arrivages.filter((a) => a.produitId === produitId && (!arrivageIds || !arrivageIds.length || arrivageIds.includes(a.id)));
  const sel = new Set(arrs.map((a) => a.id));
  const apps = R.apps.filter((a) => a.produitId === produitId && a.arrivageId && sel.has(a.arrivageId)).sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
  const direct = {}; const finisDirect = {};
  apps.forEach((a) => { const t = appTargets(db, R, a); t.lots.forEach((id) => { (direct[id] = direct[id] || []).push(a); }); t.finis.forEach((id) => { (finisDirect[id] = finisDirect[id] || []).push(a); }); });
  const res = {}; const memo = {};
  Object.keys(direct).forEach((id) => { res[id] = { lotId: id, direct: true, apps: direct[id], share: 1, from: [] }; });
  Object.keys(direct).forEach((src) => descendants(db, src).forEach((d) => {
    const sh = shareFrom(db, d, src, memo); if (sh <= 0.0005) return;
    const r = (res[d] = res[d] || { lotId: d, direct: false, apps: [], share: 0, from: [] });
    if (!r.direct) r.share = Math.min(1, r.share + sh); r.from.push(src);
  }));
  const lots = Object.values(res).map((r) => ({ ...r, ...stockOfLot(R, r.lotId), lot: R.lots[r.lotId] || lotById(db, r.lotId) || {} })).sort((a, b) => (a.direct === b.direct ? (a.lot.code || '').localeCompare(b.lot.code || '', 'fr', { numeric: true }) : a.direct ? -1 : 1));
  const finis = {};
  lots.forEach((r) => finisOf(db, r.lotId).forEach((f) => { finis[f.id] = { fini: f, share: r.share, apps: [], via: r.lotId, direct: false }; }));
  Object.keys(finisDirect).forEach((fid) => { const f = (db.lotsFinis || []).find((x) => x.id === fid); if (f) finis[fid] = { fini: f, share: 1, apps: finisDirect[fid], via: f.sourceLotId, direct: true }; });
  const fin = Object.values(finis);
  const arrInfo = arrs.map((a) => ({ a, recu: a.qty, utilise: R.arrUsed[a.id] || 0, reste: arrivalRest(R, a), nApps: apps.filter((x) => x.arrivageId === a.id).length }));
  return { produitId, arrs: arrInfo, apps, lots, finis: fin, tot: { vol: sum(lots, (r) => r.vol), volExpo: sum(lots, (r) => r.vol * r.share), bottles: sum(lots, (r) => r.bottles), finiBottles: sum(fin, (f) => f.fini.nb), nLots: lots.length, nFinis: fin.length, reste: sum(arrInfo, (x) => Math.max(0, x.reste)) } };
}

// Origine : où se retrouvent un cru (village), un apporteur ou une échelle de crus ?
function traceOrigin(db, R, kind, id) {
  const key = kind === 'cru' ? 'crus' : kind === 'apporteur' ? 'apporteurs' : kind === 'parcelle' ? 'parcelles' : 'echelles';
  const lots = Object.values(R.lots).map((l) => { const share = (composition(db, R, l.id)[key] || {})[id] || 0; return { lotId: l.id, lot: l, share, ...stockOfLot(R, l.id) }; })
    .filter((x) => x.share > 0.0005).sort((a, b) => b.share - a.share || (a.lot.code || '').localeCompare(b.lot.code || '', 'fr', { numeric: true }));
  const match = (cruId, apId, parcId) => (kind === 'cru' ? cruId === id : kind === 'apporteur' ? apId === id : kind === 'parcelle' ? parcId === id : cruEchelle(db, cruId) === id);
  const raisins = Object.values(R.raisins).filter((r) => match(r.cruId, r.apporteurId, r.parcelleId)).sort((a, b) => (a.date < b.date ? -1 : 1));
  const mouts = []; db.ops.filter((o) => o.type === 'entree_mout').forEach((o) => (o.entrees || []).forEach((e) => { if (match(e.cruId, e.apporteurId || o.apporteurId, e.parcelleId)) mouts.push({ op: o, e }); }));
  const ids = new Set(lots.map((l) => l.lotId));
  const finis = (db.lotsFinis || []).filter((f) => ids.has(f.sourceLotId)).map((f) => ({ fini: f, share: (lots.find((l) => l.lotId === f.sourceLotId) || {}).share || 0 }));
  return { kind, id, lots, raisins, mouts, finis, tot: { kg: sum(raisins, (r) => r.kg), lMout: sum(mouts, (m) => m.e.volL), volExpo: sum(lots, (l) => l.vol * l.share), vol: sum(lots, (l) => l.vol), bottles: sum(lots, (l) => l.bottles), nLots: lots.length } };
}
