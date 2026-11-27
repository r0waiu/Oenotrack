/* ============ CODIFICATION DES LOTS DANS LES FORMULAIRES (0.41.0-alpha.1) ============
   Contexte de codification lu dans le formulaire d'une opération (cépages, crus, revendication, millésimes, cuve, dosage…), code proposé
   par la règle du stade, et trace gardée avec le lot (parties et compteur, ou « manuel » si le code a été modifié à la main). */

// lots sources d'un formulaire (portions + volumes)
const codifSourcesForm = (Rd, sources) => (sources || []).filter((s) => s && s.portionId && num(s.volL) > 0 && Rd.portions[s.portionId]).map((s) => ({ lotId: Rd.portions[s.portionId].lotId, volL: num(s.volL) }));
const codifPropres = (old) => { if (!old) return []; const m = opCreates(old); return [...(m.lots || []), ...(m.finis || []), ...(old.prepId ? [old.prepId] : [])]; };
// lot dont le code est repris (lot majoritaire des sources, lot de tirage dégorgé, lot qui change de stade)
const codifParentLot = (db, Rd, lotId, old) => {
  const l = Rd.lots[lotId] || lotById(db, lotId); if (!l) return { parent: null, parentCtx: null };
  const prev = old && (l.codesPrecedents || []).find((p) => p && p.opId === old.id); // étape modifiée : le code d'avant le changement
  return { parent: prev ? { code: prev.code, codif: prev.codif || null } : codifParent(l), parentCtx: codifCtxLot(db, Rd, lotId) };
};
function codifCtxPressurage(db, f, old) {
  const comp = { cepages: {}, crus: {}, qualifs: {}, apporteurs: {}, echelles: {} }; const add = (m, k, v) => { if (k) m[k] = (m[k] || 0) + v; };
  (f.charges || []).forEach((c) => { const a = (db.ops || []).find((o) => o.id === c.apportId); if (!a || !(num(c.kg) > 0)) return; add(comp.cepages, a.cepageId, num(c.kg)); add(comp.crus, a.cruId, num(c.kg)); add(comp.qualifs, a.qualifId || 'conv', num(c.kg)); add(comp.apporteurs, a.apporteurId, num(c.kg)); add(comp.echelles, cruEchelle(db, a.cruId) || 'inconnu', num(c.kg)); });
  const marc = old && old.marc && old.marc.num ? old.marc.num : (typeof numeroSuivant === 'function' ? numeroSuivant(db, 'marc', yearOf(f.date)) : '');
  return { date: f.date, heure: f.heureDebut || '', comp, qualif: f.qualifId || 'conv', millesimes: { [String(f.millesime || yearOf(f.date))]: 1 }, marc, choix: f.codifChoix || {}, exclure: codifPropres(old) };
}
// contexte du code principal d'une opération
function codifCtxForm(db, Rd, type, f, old) {
  const base = { date: f.date, choix: f.codifChoix || {}, exclure: codifPropres(old) };
  switch (type) {
    case 'assemblage': case 'tirage': {
      const S = codifSourcesForm(Rd, f.sources); const c = codifCtxSources(db, Rd, S); const p = c.parentLotId ? codifParentLot(db, Rd, c.parentLotId) : {};
      return { ...base, ...c, ...p, contenantId: f.destId || '', ...(type === 'tirage' ? { nb: f.nbBouteilles, volBouteilleL: f.volBouteilleL } : {}), ...(f.millesime ? { millesimes: { [f.millesime]: 1 } } : {}) };
    }
    case 'degorgement': {
      const c = f.sourceLotId ? codifCtxLot(db, Rd, f.sourceLotId) : {}; const tir = (db.ops || []).find((o) => o && o.type === 'tirage' && o.lotId === f.sourceLotId);
      return { ...base, ...c, ...(f.sourceLotId ? codifParentLot(db, Rd, f.sourceLotId) : {}), dosage: f.dosageGL, nb: f.nb, volBouteilleL: tir ? tir.volBouteilleL : (db.settings || {}).volBouteilleL };
    }
    case 'preparation': { const p = f.sourcePortionId && Rd.portions[f.sourcePortionId]; return { ...base, ...(p ? codifCtxLot(db, Rd, p.lotId) : {}), qualif: f.qualifId || 'conv', ptype: f.ptype }; }
    case 'reprise': {
      const comp = { cepages: {}, crus: {}, echelles: {} }; Object.keys(f.cepages || {}).forEach((k) => { if (num(f.cepages[k]) > 0) comp.cepages[k] = num(f.cepages[k]); });
      (f.crus || []).forEach((x) => { if (x.cruId) { comp.crus[x.cruId] = (comp.crus[x.cruId] || 0) + (num(x.pct) || 1); const e = cruEchelle(db, x.cruId); if (e) comp.echelles[e] = (comp.echelles[e] || 0) + (num(x.pct) || 1); } });
      return { ...base, comp, ...(Object.keys(comp.echelles).length ? {} : { echelle: f.echelle || '' }), qualif: f.qualifId || 'conv', millesimes: /^\d{4}$/.test(String(f.millesime || '')) ? { [f.millesime]: 1 } : {}, contenantId: f.contenantId || '', apporteurId: f.apporteurId || '', codeFournisseur: f.codeFournisseur || '', nb: f.kind === 'bouteilles' ? f.nbBouteilles : '' };
    }
    case 'pressurage': return codifCtxPressurage(db, f, old);
    case 'etape': { if (!f.lotId) return base; const c = codifCtxLot(db, Rd, f.lotId); return { ...base, ...c, ...codifParentLot(db, Rd, f.lotId, old), stade: f.newStade || c.stade, couleur: f.couleur || c.couleur, exclure: [...base.exclure, f.lotId] }; }
    default: return base;
  }
}
// codes proposés aux fractions d'une pressée (règle « fraction » : code du marc repris, compteur partagé) → { fractionId: résultat }
function pressFractionsAuto(db, f, code, Rd, old) {
  const out = {}; if (!codifActif(db, 'fraction', f.date)) return out;
  const ctx = codifCtxPressurage(db, f, old); const gm = codifGenerer(db, 'marc', ctx); const parent = { code, codif: codifTrace(gm, code, f.codifChoix) }; const reserves = [];
  fracPress(db, Object.keys(f.frac || {})).filter((fr) => (f.frac || {})[fr.id]).forEach((fr) => {
    const g = codifGenerer(db, 'fraction', { ...ctx, fractionId: fr.id, comp: { ...ctx.comp, fractions: { [fr.id]: 1 } }, parent, parentCtx: ctx, reserves }); out[fr.id] = g;
    if (g.ok && g.code) reserves.push({ cle: g.cle, cpt: g.cpt, code: g.code });
  });
  return out;
}
function pressFractionAuto(db, f, fr, code, Rd, old) { const g = pressFractionsAuto(db, f, code, Rd, old)[fr.id]; return g && g.ok && g.code ? g.code : `${code}-${fr.suffix}`; }

// codification gardée avec chaque lot créé ; renvoie un message d'erreur ou null
function codifAttacher(type, f, db, Rd, old, spec) {
  if (type === 'reprise' && spec.lotSpec) { const cf = String(f.codeFournisseur || '').trim(); if (cf) spec.lotSpec.codeFournisseur = cf; }
  const stade = codifStadePourOp(db, type, f); const choix = f.codifChoix || {};
  const garde = (coll, id, code) => { const x = (coll || []).find((y) => y && y.id === id); return x && x.codif && norm(x.code).trim() === norm(code).trim() ? x.codif : null; };
  if (type === 'etape') {
    if (!f.codifAttribuer) return null; const nc = String(f.nouveauCode || '').trim(); if (!nc) return 'Indiquez le nouveau code du lot (ou décochez « Attribuer un nouveau code »).';
    if (codePris(db, 'vinification', f.date, nc, [f.lotId])) return `Le code de lot « ${nc} » existe déjà.`;
    spec.nouveauCode = nc; const keep = old && old.nouveauCode === nc && old.codif ? old.codif : null;
    const tr = keep || (codifActif(db, 'vinification', f.date) ? codifTrace(codifGenerer(db, 'vinification', codifCtxForm(db, Rd, type, f, old)), nc, choix) : null); if (tr) spec.codif = tr; return null;
  }
  if (!stade || !codifActif(db, stade, f.date)) return null;
  const tr = (code) => codifTrace(codifGenerer(db, stade, codifCtxForm(db, Rd, type, f, old)), code, choix);
  if (['assemblage', 'tirage', 'reprise'].includes(type) && spec.lotSpec) { const c = garde(db.lots, old && old.lotId, spec.lotSpec.code) || tr(spec.lotSpec.code); if (c) spec.lotSpec.codif = c; }
  if (type === 'degorgement' && spec.lotFiniSpec) { const c = garde(db.lotsFinis, old && old.lotFiniId, spec.lotFiniSpec.code) || tr(spec.lotFiniSpec.code); if (c) spec.lotFiniSpec.codif = c; }
  if (type === 'preparation') { const c = (old && old.codif && norm(old.code) === norm(spec.code) ? old.codif : null) || tr(spec.code); if (c) spec.codif = c; }
  if (type === 'pressurage' && spec.parentSpec) {
    const c = garde(db.lots, old && old.parentLotId, spec.parentSpec.code) || tr(spec.parentSpec.code); if (c) spec.parentSpec.codif = c;
    const G = pressFractionsAuto(db, f, spec.parentSpec.code, Rd, old);
    (spec.fractions || []).forEach((x) => { const of = old && (old.fractions || []).find((y) => y.fractionId === x.fractionId); const k = (of && garde(db.lots, of.lotId, x.code)) || codifTrace(G[x.fractionId], x.code, choix); if (k) x.codif = k; });
  }
  if (type === 'entree_mout') {
    const plan = moutPlan(db, { ...f, entrees: spec.entrees }, codifPropres(old));
    (spec.lots || []).forEach((l) => { const t = plan.find((y) => y.contenantId === l.contenantId); const ol = old && (old.lots || []).find((y) => y.contenantId === l.contenantId); const k = (ol && garde(db.lots, ol.lotId, l.code)) || (t && codifTrace(t.gen, l.code, choix)); if (k) l.codif = k; });
  }
  return null;
}
