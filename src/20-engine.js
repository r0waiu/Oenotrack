/* ============ MOTEUR : rejeu du journal d'opérations ============ */
// Source de vérité = db.ops (journal). Les stocks (portions), quantités d'intrants restantes,
// avertissements de capacité, doses, etc. sont recalculés par rejeu chronologique.

const ruleFor = (db, produitId, qualifId) => (db.regles || []).find((x) => x.produitId === produitId && x.qualifId === qualifId) || null;
const ruleAllows = (db, produitId, qualifId) => { const r = ruleFor(db, produitId, qualifId); return !!(r && r.autorise); };

// Entrée de moûts : lots créés (un par cuve) avec la part de chaque moût reçu (ligne / compartiment) qui y est versée
function moutLots(op) {
  return (op.lots || []).map((l) => {
    const parts = []; (op.entrees || []).forEach((e, i) => (e.dests || []).forEach((d) => { if (d.contenantId === l.contenantId && num(d.volL) > 0) parts.push({ e, i, vol: num(d.volL) }); }));
    return { ...l, parts, vol: sum(parts, (p) => p.vol), qualifs: uniq(parts.map((p) => p.e.qualifId || 'conv')) };
  });
}
// événements des contenants pour les plans d'hygiène (0.26.0-alpha.1) : vidange (le contenant devient vide), remplissage (vide → plein),
// avec les revendications du contenu sorti, du contenu entré et du contenu précédent (avant la dernière vidange)
const volsParContenant = (P) => { const m = {}; for (const k in P) { const p = P[k]; if (p.vol) m[p.contenantId] = (m[p.contenantId] || 0) + p.vol; } return m; };
const qualifsDe = (R, cid) => uniq(Object.values(R.portions).filter((p) => p.contenantId === cid && p.vol > 0.005).map((p) => (R.lots[p.lotId] || {}).qualif).filter(Boolean));
function evenementsOp(R, op, avant) {
  const apres = volsParContenant(R.portions); R._vols = apres; R.evts = R.evts || []; R._contenu = R._contenu || {}; R._vidange = R._vidange || {};
  const tous = op.type === 'declassement'; // revendication changée sans mouvement : contenu de chaque cuve relu
  [...new Set([...Object.keys(avant), ...Object.keys(apres)])].forEach((cid) => {
    const a = avant[cid] || 0; const b = apres[cid] || 0; if (!tous && Math.abs(a - b) < 1e-9) return; // seulement les cuves dont le volume a changé
    if (a > 0.5 && b <= 0.5) { R.evts.push({ type: 'vidange', date: op.date, opId: op.id, opType: op.type, contenantId: cid, qualifs: R._contenu[cid] || [] }); R._vidange[cid] = op.date; }
    else if (a <= 0.5 && b > 0.5) R.evts.push({ type: 'remplissage', date: op.date, opId: op.id, opType: op.type, contenantId: cid, qualifs: qualifsDe(R, cid), avant: R._contenu[cid] || [], depuisVidange: R._vidange[cid] || '' });
    if (b > 0.5) R._contenu[cid] = qualifsDe(R, cid);
  });
}
function replay(db, upTo, opts) {
  syncConfig(db);
  const R = { upTo: upTo || null, lots: {}, portions: {}, pinfo: {}, contVol: {}, preps: {}, tir: {}, raisins: {}, arrUsed: {}, apps: [], warn: {}, flows: [], prepUse: [], opsByLot: {}, capOver: {}, stadeHist: {} };
  for (const l of db.lots) {
    const st = l.stade || stadeFromType(l.type); const co = l.couleur || couleurDefaut(db);
    R.lots[l.id] = { ...l, stade: st, couleur: co };
    R.stadeHist[l.id] = [{ date: l.date || '', stade: st, couleur: co, opId: l.opId || null, init: true }];
  }
  // stade (et couleur) d'un lot après une opération : historique daté, consultable sur la fiche du lot
  const setStade = (op, lotId, stade, couleur) => {
    const L = R.lots[lotId]; if (!L || (!stade && !couleur)) return;
    const ns = stade || L.stade, nc = couleur || L.couleur; if (ns === L.stade && nc === L.couleur) return;
    L.stade = ns; L.couleur = nc; (R.stadeHist[lotId] = R.stadeHist[lotId] || []).push({ date: op.date, stade: ns, couleur: nc, opId: op.id });
  };
  const prod = Object.fromEntries(db.produits.map((p) => [p.id, p]));
  const arr = Object.fromEntries(db.arrivages.map((a) => [a.id, a]));
  const cont = Object.fromEntries(db.contenants.map((c) => [c.id, c]));
  const warn = (op, m) => { (R.warn[op.id] = R.warn[op.id] || []).push(m); };
  const touch = (op, lotId) => { if (!lotId) return; const a = (R.opsByLot[lotId] = R.opsByLot[lotId] || []); if (!a.includes(op.id)) a.push(op.id); };
  const pq = (pid) => { const pi = R.pinfo[pid]; return pi && R.lots[pi.lotId] ? R.lots[pi.lotId].qualif : null; };
  const mixWarn = (op, qs, what) => { const u = uniq(qs.filter(Boolean)); if (u.length > 1) warn(op, `Revendications mélangées (${u.map(qLabel).join(' + ')}) : ${what} hérite de ${qLabel(minQualif(u))} (rang le plus bas).`); };
  const flow = (op, kind, L, extra) => { if (Math.abs(L) > 1e-9) R.flows.push({ date: op.date, opId: op.id, kind, L, ...extra }); };
  const contTotal = (cid) => sum(Object.values(R.portions).filter((p) => p.contenantId === cid), (p) => p.vol);
  const checkCap = (op, cid) => {
    const c = cont[cid]; if (!c) return;
    const t = contTotal(cid);
    if (c.volMax > 0 && t > c.volMax + 0.5) warn(op, `Capacité dépassée en ${c.nom} : ${fmtL(t)} pour ${fmtL(c.volMax)} max.`);
  };
  const addPortion = (op, lotId, cid, vol, id) => {
    if (vol <= 0) return null;
    const ex = Object.values(R.portions).find((p) => p.lotId === lotId && p.contenantId === cid);
    if (ex) { ex.vol += vol; return ex; }
    const p = { id, lotId, contenantId: cid, vol, since: op.date };
    R.portions[id] = p; R.pinfo[id] = { lotId, contenantId: cid };
    const others = Object.values(R.portions).filter((q) => q.contenantId === cid && q.lotId !== lotId);
    if (others.length) warn(op, `${cont[cid] ? cont[cid].nom : 'Contenant'} contient déjà un autre lot (${others.map((q) => (R.lots[q.lotId] || {}).code).join(', ')}).`);
    return p;
  };
  const take = (op, portionId, vol) => {
    const p = R.portions[portionId];
    if (!p) { warn(op, 'Portion source introuvable ou déjà vidée à cette date.'); return null; }
    const v = Math.min(num(vol), p.vol);
    if (num(vol) > p.vol + 0.5) warn(op, `Volume demandé (${fmtL(vol)}) supérieur au stock de la portion (${fmtL(p.vol)}).`);
    const res = { lotId: p.lotId, contenantId: p.contenantId, vol: v, before: p.vol };
    p.vol -= v;
    if (p.vol < 0.005) delete R.portions[portionId];
    touch(op, p.lotId);
    return res;
  };
  const applyLignes = (op, lignes, tg) => {
    (lignes || []).forEach((l) => {
      const pr = prod[l.produitId]; if (!pr) { warn(op, 'Produit introuvable dans une ligne d’intrant.'); return; }
      const a = arr[l.arrivageId]; const q = num(l.qty);
      if (!a) warn(op, `${pr.nom} : aucun arrivage (lot fournisseur) sélectionné.`);
      else {
        const rest = a.qty - (R.arrUsed[a.id] || 0);
        if (q > rest + 1e-6) warn(op, `${pr.nom} (lot ${a.numLot}) : quantité utilisée supérieure au restant (${fmt(rest, 2)} ${pr.unite}).`);
        if (a.dluo && op.date > a.dluo) warn(op, `${pr.nom} (lot ${a.numLot}) : DLUO dépassée au ${fmtDate(a.dluo)}.`);
        if (a.date && op.date < a.date) warn(op, `${pr.nom} (lot ${a.numLot}) : utilisé avant sa réception (${fmtDate(a.date)}).`);
        R.arrUsed[a.id] = (R.arrUsed[a.id] || 0) + q;
      }
      const dose = tg.vol && tg.kind !== 'prep' ? doseHL(q, pr.unite, tg.vol) : null; // la dose légale se juge sur le vin final, pas sur la préparation
      const rule = tg.qualif && pr.categorie !== 'sec' ? ruleFor(db, pr.id, tg.qualif) : null;
      const unauth = !!(tg.qualif && pr.categorie !== 'sec' && !(rule && rule.autorise));
      if (unauth && tg.kind === 'prep') warn(op, `${pr.nom} n’est pas autorisé pour une préparation ${qLabel(tg.qualif)}.`);
      const over = !!(rule && rule.autorise && rule.doseMax != null && rule.doseMax !== '' && dose != null && dose > num(rule.doseMax) + 1e-9);
      if (over) warn(op, `${pr.nom} : dose ${fmt(dose, 1)} ${doseUnit(pr.unite)} supérieure à la dose légale max (${fmt(rule.doseMax, 1)}) pour ${qLabel(tg.qualif)}.`);
      R.apps.push({ opId: op.id, date: op.date, opType: op.type, opSousType: op.sousType || '', produitId: pr.id, arrivageId: l.arrivageId || null, numLot: a ? a.numLot : '', qty: q, unite: pr.unite, kind: tg.kind, portionId: tg.portionId || null, lotId: tg.lotId || null, contenantId: tg.contenantId || null, prepId: tg.prepId || null, vol: tg.vol || null, dose, qualif: tg.qualif || null, unauth, over });
    });
  };
  const usePrep = (op, u, lotId) => {
    const p = R.preps[u.prepId];
    if (!p) { warn(op, 'Préparation introuvable.'); return null; }
    p.remaining -= num(u.volL);
    if (p.remaining < -0.01) warn(op, `Préparation ${p.code} : volume utilisé supérieur au restant.`);
    R.prepUse.push({ opId: op.id, date: op.date, prepId: p.id, volL: num(u.volL), lotId: lotId || null });
    return p;
  };

  const ops = [...db.ops].sort(byDate);
  for (const op of ops) {
    // opts.repriseOn : jour d'ouverture d'une campagne dont les « reprises de stock » font partie du stock d'ouverture
    if (upTo && op.date > (opts && opts.repriseOn ? opts.repriseOn : upTo)) break;
    if (upTo && op.date > upTo && !(opts && op.type === 'reprise' && op.date === opts.repriseOn)) continue;
    const evAvant = opts && opts.evenements ? (R._vols || volsParContenant(R.portions)) : null; // plans d'hygiène (0.26.0-alpha.1) : vidanges et remplissages
    switch (op.type) {
      case 'apport':
        R.raisins[op.id] = { id: op.id, date: op.date, cepageId: op.cepageId, kg: num(op.kg), qualifId: op.qualifId, apporteurId: op.apporteurId || '', cruId: op.cruId || '', parcelleId: op.parcelleId || '', ref: op.ref || '', used: 0 };
        break;
      case 'pressurage': {
        (op.charges || []).forEach((c) => { const r = R.raisins[c.apportId]; if (!r) { warn(op, 'Apport de vendange introuvable.'); return; } r.used += num(c.kg); if (r.used > r.kg + 0.5) warn(op, `Apport du ${fmtDate(r.date)} : plus de raisin pressé (${fmt(r.used)} kg) que reçu (${fmt(r.kg)} kg).`); });
        touch(op, op.parentLotId);
        { const aq = (op.charges || []).map((c) => (R.raisins[c.apportId] || {}).qualifId).filter(Boolean); const want = (op.parentSpec || {}).qualifId; if (aq.length && want && rang(want) > rang(minQualif(aq))) warn(op, `Revendication choisie (${qLabel(want)}) supérieure à celle d’un apport pressé (${qLabel(minQualif(aq))}).`); }
        (op.fractions || []).forEach((f) => { if (num(f.volL) <= 0) return; touch(op, f.lotId); addPortion(op, f.lotId, f.contenantId, num(f.volL), f.portionId); flow(op, 'entree', num(f.volL), { lotId: f.lotId }); checkCap(op, f.contenantId); });
        break;
      }
      case 'debourbage': case 'soutirage': case 'transfert': {
        const t = take(op, op.portionId, op.volL); if (!t) break;
        const lossV = sum(op.pertes, (x) => x.volL);
        if (lossV > t.vol + 0.01) warn(op, 'Les pertes dépassent le volume repris.');
        (op.pertes || []).forEach((x) => flow(op, 'perte', -num(x.volL), { typeId: x.typeId, lotId: t.lotId }));
        const recv = Math.max(0, t.vol - lossV);
        if (op.destId === t.contenantId) warn(op, 'Contenant de destination identique à la source.');
        const np = addPortion(op, t.lotId, op.destId, recv, op.outPortionId);
        checkCap(op, op.destId);
        if (np) applyLignes(op, op.lignes, { kind: 'portion', portionId: np.id, lotId: t.lotId, contenantId: op.destId, vol: np.vol, qualif: R.lots[t.lotId] && R.lots[t.lotId].qualif });
        if (op.stade) setStade(op, t.lotId, op.stade);
        break;
      }
      case 'sortie': { // vin ou moût qui quitte la cave (vente en vrac, distillerie, destruction)
        const t = take(op, op.portionId, op.volL); if (!t) break;
        flow(op, 'sortie', -t.vol, { lotId: t.lotId, motif: op.motif || '' });
        break;
      }
      case 'intrant': case 'froid': case 'filtration': case 'suivi': {
        const p = R.portions[op.portionId];
        if (!p) { warn(op, 'Portion cible introuvable ou vidée à cette date.'); break; }
        touch(op, p.lotId);
        const lot = R.lots[p.lotId];
        if (op.type === 'filtration' && (op.pertes || []).length) { const lv = sum(op.pertes, (x) => x.volL); (op.pertes || []).forEach((x) => flow(op, 'perte', -num(x.volL), { typeId: x.typeId, lotId: p.lotId })); p.vol = Math.max(0, p.vol - lv); }
        applyLignes(op, op.lignes, { kind: 'portion', portionId: p.id, lotId: p.lotId, contenantId: p.contenantId, vol: p.vol, qualif: lot && lot.qualif });
        if (op.stade) setStade(op, p.lotId, op.stade);
        (op.prepUses || []).forEach((u) => { const pr = usePrep(op, u, p.lotId); if (pr) { p.vol += num(u.volL); flow(op, 'ajout', num(u.volL), { lotId: p.lotId, prepId: pr.id }); if (lot && rang(pr.qualif) < rang(lot.qualif)) R.apps.push({ opId: op.id, date: op.date, opType: op.type, opSousType: op.sousType || '', kind: 'prep', prepId: pr.id, lotId: p.lotId, portionId: p.id, contenantId: p.contenantId, qualif: lot.qualif, prepQualif: pr.qualif, unauth: true, qty: num(u.volL), unite: 'L', produitId: null }); } });
        if ((op.prepUses || []).length) checkCap(op, p.contenantId); // seul un ajout de volume peut faire déborder
        break;
      }
      case 'jaugeage': {
        const p = R.portions[op.portionId]; if (!p) { warn(op, 'Portion cible introuvable ou vidée à cette date.'); break; }
        touch(op, p.lotId);
        const delta = num(op.volMesure) - p.vol;
        flow(op, 'jaugeage', delta, { lotId: p.lotId, typeId: op.typeId });
        p.vol = Math.max(0, num(op.volMesure));
        if (p.vol < 0.005) delete R.portions[op.portionId];
        checkCap(op, p.contenantId);
        break;
      }
      case 'assemblage': {
        let tot = 0; touch(op, op.lotId);
        mixWarn(op, (op.sources || []).map((s) => pq(s.portionId)), `le lot ${(R.lots[op.lotId] || {}).code || ''}`);
        (op.sources || []).forEach((s) => { const t = take(op, s.portionId, s.volL); if (t) tot += t.vol; });
        const lossV = sum(op.pertes, (x) => x.volL);
        (op.pertes || []).forEach((x) => flow(op, 'perte', -num(x.volL), { typeId: x.typeId, lotId: op.lotId }));
        const np = addPortion(op, op.lotId, op.destId, Math.max(0, tot - lossV), op.outPortionId);
        checkCap(op, op.destId);
        if (np) applyLignes(op, op.lignes, { kind: 'portion', portionId: np.id, lotId: op.lotId, contenantId: op.destId, vol: np.vol, qualif: R.lots[op.lotId] && R.lots[op.lotId].qualif });
        break;
      }
      case 'etape': if (R.lots[op.lotId]) { if (op.newType) R.lots[op.lotId].type = op.newType; setStade(op, op.lotId, op.newStade, op.couleur); touch(op, op.lotId); } break;
      case 'declassement': if (R.lots[op.lotId]) { R.lots[op.lotId].qualif = op.qualifId; touch(op, op.lotId); } break;
      case 'preparation': {
        let srcLot = null;
        if (op.sourcePortionId && num(op.sourceVolL) > 0) { const t = take(op, op.sourcePortionId, op.sourceVolL); if (t) { flow(op, 'prelevement', -t.vol, { lotId: t.lotId }); srcLot = t.lotId; } }
        R.preps[op.prepId] = { id: op.prepId, code: op.code, ptype: op.ptype, qualif: op.qualifId, vol: num(op.volL), remaining: num(op.volL), date: op.date, opId: op.id, srcLot };
        applyLignes(op, op.lignes, { kind: 'prep', prepId: op.prepId, vol: num(op.volL), qualif: op.qualifId });
        break;
      }
      case 'tirage': {
        touch(op, op.lotId);
        mixWarn(op, [...(op.sources || []).map((s) => pq(s.portionId)), ...(op.prepUses || []).map((u) => (R.preps[u.prepId] || {}).qualif)], `la cuvée de tirage ${(R.lots[op.lotId] || {}).code || ''}`);
        (op.sources || []).forEach((s) => { const t = take(op, s.portionId, s.volL); if (t) flow(op, 'tirage', -t.vol, { lotId: t.lotId }); });
        (op.prepUses || []).forEach((u) => usePrep(op, u, op.lotId));
        R.tir[op.lotId] = { lotId: op.lotId, nb: num(op.nbBouteilles), mis: num(op.nbBouteilles), date: op.date };
        applyLignes(op, op.lignes, { kind: 'tirage', lotId: op.lotId, vol: num(op.nbBouteilles) * num(op.volBouteilleL || 0.75), qualif: R.lots[op.lotId] && R.lots[op.lotId].qualif });
        break;
      }
      case 'degorgement': {
        touch(op, op.sourceLotId);
        mixWarn(op, [(R.lots[op.sourceLotId] || {}).qualif, ...(op.prepUses || []).map((u) => (R.preps[u.prepId] || {}).qualif)], 'le lot fini');
        const t = R.tir[op.sourceLotId];
        if (!t) warn(op, 'Lot de tirage introuvable (aucune bouteille en stock à cette date).');
        else { if (num(op.nb) > t.nb) warn(op, `Dégorgement de ${fmt(op.nb)} bouteilles pour ${fmt(t.nb)} en stock.`); t.nb = Math.max(0, t.nb - num(op.nb)); t.deg = (t.deg || 0) + num(op.nb); if (t.nb <= 0) setStade(op, op.sourceLotId, stadeRole(db, 'degorgement')); }
        (op.prepUses || []).forEach((u) => usePrep(op, u, op.sourceLotId));
        applyLignes(op, op.lignes, { kind: 'deg', lotId: op.sourceLotId, vol: null, qualif: null });
        break;
      }
      case 'entree_mout': { // un lot de moût par cuve de destination ; plusieurs moûts (compartiments) peuvent aller dans la même cuve
        moutLots(op).forEach((l) => {
          touch(op, l.lotId);
          mixWarn(op, l.qualifs, `le lot ${l.code || ''} (${cont[l.contenantId] ? cont[l.contenantId].nom : 'cuve'})`);
          if (l.vol > 0) { addPortion(op, l.lotId, l.contenantId, l.vol, l.portionId); flow(op, 'entree', l.vol, { lotId: l.lotId, mout: true }); checkCap(op, l.contenantId); }
        });
        break;
      }
      case 'reprise': {
        touch(op, op.lotId);
        if (num(op.nbBouteilles) > 0) R.tir[op.lotId] = { lotId: op.lotId, nb: num(op.nbBouteilles), mis: num(op.nbBouteilles), date: op.date, reprise: true };
        if (num(op.volL) > 0 && op.contenantId) { addPortion(op, op.lotId, op.contenantId, num(op.volL), op.portionId); flow(op, 'entree', num(op.volL), { lotId: op.lotId, reprise: true }); checkCap(op, op.contenantId); }
        break;
      }
      default: break;
    }
    if (evAvant) evenementsOp(R, op, evAvant);
  }
  const pa = Object.values(R.portions);
  R.lotVol = {}; pa.forEach((p) => { R.lotVol[p.lotId] = (R.lotVol[p.lotId] || 0) + p.vol; });
  db.contenants.forEach((c) => { const t = sum(pa.filter((p) => p.contenantId === c.id), (p) => p.vol); R.contVol[c.id] = t; if (c.volMax > 0 && t > c.volMax + 0.5) R.capOver[c.id] = true; });
  R.totalVol = sum(pa, (p) => p.vol);
  return R;
}

const _rc = new WeakMap();
function getR(db, upTo) {
  let m = _rc.get(db); if (!m) { m = new Map(); _rc.set(db, m); }
  const k = upTo || '*'; if (!m.has(k)) m.set(k, replay(db, upTo, upTo || !hygEvenementsUtiles(db) ? undefined : { evenements: true })); return m.get(k); // état complet : avec les événements des contenants si les plans d'hygiène sont suivis (0.26.0-alpha.1)
}

/* ---------- arrivages / DLUO ---------- */
const arrivalRest = (R, a) => a.qty - (R.arrUsed[a.id] || 0);
function dluoState(dluo, ref) {
  if (!dluo) return { k: 'none', label: 'Sans DLUO', cls: '' };
  const d = daysBetween(ref || todayISO(), dluo);
  if (d < 0) return { k: 'expire', label: `Périmé depuis ${-d} j`, cls: 'chip-bad' };
  if (d <= 30) return { k: 'bientot', label: `DLUO dans ${d} j`, cls: 'chip-warn' };
  return { k: 'ok', label: `DLUO ${fmtDate(dluo)}`, cls: 'chip-ok' };
}

/* ---------- généalogie ---------- */
const lotById = (db, id) => db.lots.find((l) => l.id === id);
const parentsOf = (db, id) => { const l = lotById(db, id); return l ? (l.parentIds || []) : []; };
const childrenOf = (db, id) => db.lots.filter((l) => (l.parentIds || []).includes(id));
const finisOf = (db, id) => (db.lotsFinis || []).filter((f) => f.sourceLotId === id);
function ancestors(db, id, seen = new Set()) { parentsOf(db, id).forEach((p) => { if (!seen.has(p)) { seen.add(p); ancestors(db, p, seen); } }); return seen; }
function descendants(db, id, seen = new Set()) { childrenOf(db, id).forEach((c) => { if (!seen.has(c.id)) { seen.add(c.id); descendants(db, c.id, seen); } }); return seen; }

/* ---------- composition calculée (cépages, millésimes, revendications, crus, apporteurs, échelle) ---------- */
const COMP_KEYS = ['cepages', 'millesimes', 'fractions', 'qualifs', 'crus', 'apporteurs', 'echelles', 'parcelles'];
const emptyComp = () => ({ cepages: {}, millesimes: {}, fractions: {}, qualifs: {}, crus: {}, apporteurs: {}, echelles: {}, parcelles: {} });
const norm1 = (o) => { const t = sum(Object.values(o)); const r = {}; if (t > 0) Object.keys(o).forEach((k) => { r[k] = o[k] / t; }); return r; };
function mixComp(parts) { // parts : [{ comp, w }] → composition pondérée (au prorata des volumes)
  const acc = emptyComp(); const tot = sum(parts, (p) => p.w);
  parts.forEach((p) => { const w = tot > 0 ? num(p.w) / tot : 0; COMP_KEYS.forEach((k) => Object.keys(p.comp[k]).forEach((x) => { acc[k][x] = (acc[k][x] || 0) + p.comp[k][x] * w; })); });
  COMP_KEYS.forEach((k) => { acc[k] = norm1(acc[k]); });
  return acc;
}
// Échelle d'un lot = rang le plus bas des crus connus ; « partiel » si une part de l'origine n'est pas renseignée.
function echelleInfo(comp) {
  const e = (comp && comp.echelles) || {}; const inconnu = e.inconnu || 0;
  const id = minEchelle(Object.keys(e).filter((k) => eDef(k) && e[k] > 0.0005));
  return { id, inconnu, partiel: !!id && inconnu > 0.0005 };
}
function composition(db, R, lotId, memo) {
  memo = memo || (R._cm = R._cm || {});
  if (memo[lotId]) return memo[lotId];
  const lot = R.lots[lotId];
  if (!lot) return emptyComp();
  memo[lotId] = emptyComp(); // garde anti-cycle
  const unk = (r) => { r.crus = { '?': 1 }; r.apporteurs = { '?': 1 }; r.echelles = { inconnu: 1 }; return r; };
  let res;
  if (lot.sources && lot.sources.length) {
    res = mixComp(lot.sources.map((s) => ({ comp: composition(db, R, s.lotId, memo), w: num(s.volL) })));
  } else if (lot.type === 'fraction' && (lot.parentIds || []).length && lot.apports == null) {
    res = { ...composition(db, R, lot.parentIds[0], memo) };
  } else if (lot.apports && lot.apports.length) {
    const ce = {}, cr = {}, ap = {}, ec = {}; const add = (m, k, v) => { m[k] = (m[k] || 0) + v; };
    lot.apports.forEach((a) => { const kg = num(a.kg); add(ce, a.cepageId, kg); add(cr, a.cruId || '?', kg); add(ap, a.apporteurId || '?', kg); add(ec, cruEchelle(db, a.cruId) || 'inconnu', kg); });
    res = { cepages: norm1(ce), millesimes: { [lot.millesime || 'NV']: 1 }, qualifs: { [lot.qualif]: 1 }, crus: norm1(cr), apporteurs: norm1(ap), echelles: norm1(ec) };
  } else if (lot.origine && (sum(Object.values(lot.origine.cepages || {})) > 0 || sum(Object.values(lot.origine.crus || {})) > 0 || lot.origine.echelle)) {
    const o = lot.origine; const w = (m) => (sum(Object.values(m || {})) > 0 ? norm1(m) : null);
    const cr = w(o.crus); const ap = w(o.apporteurs); let ec = {};
    if (cr) Object.keys(cr).forEach((k) => { const e = cruEchelle(db, k) || 'inconnu'; ec[e] = (ec[e] || 0) + cr[k]; });
    else ec = o.echelle && eDef(o.echelle) ? { [o.echelle]: 1 } : { inconnu: 1 };
    res = { cepages: w(o.cepages) || {}, millesimes: w(o.millesimes) || { [lot.millesime || 'NV']: 1 }, qualifs: w(o.qualifs) || { [lot.qualif]: 1 }, crus: cr || { '?': 1 }, apporteurs: ap || { '?': 1 }, echelles: ec };
  } else {
    res = unk({ cepages: {}, millesimes: { [lot.millesime || 'NV']: 1 }, qualifs: { [lot.qualif]: 1 }, crus: {}, apporteurs: {}, echelles: {} });
  }
  // fraction de moût (cuvée, taille, rebêche…) : portée par le lot d'origine, puis mélangée au prorata des volumes dans les assemblages
  if (!(lot.sources && lot.sources.length)) res = { ...res, fractions: lot.origine && sum(Object.values(lot.origine.fractions || {})) > 0 ? norm1(lot.origine.fractions) : { [lot.fractionId || '?']: 1 } };
  // parcelle d'origine : portée par les apports pressés (au prorata des kg) ou par les moûts reçus, héritée par les fractions
  if (!res.parcelles) {
    if (lot.apports && lot.apports.length) { const pa = {}; lot.apports.forEach((a) => { pa[a.parcelleId || '?'] = (pa[a.parcelleId || '?'] || 0) + num(a.kg); }); res = { ...res, parcelles: norm1(pa) }; }
    else res = { ...res, parcelles: lot.origine && sum(Object.values(lot.origine.parcelles || {})) > 0 ? norm1(lot.origine.parcelles) : { '?': 1 } };
  }
  memo[lotId] = res; return res;
}
const lotEchelle = (db, R, lotId) => echelleInfo(composition(db, R, lotId));
// contenu d'un contenant = mélange (au prorata des volumes) de toutes les portions qu'il contient
const contParts = (R, cid) => Object.values(R.portions).filter((p) => p.contenantId === cid).map((p) => ({ lotId: p.lotId, vol: p.vol, portionId: p.id, since: p.since }));
function contentComp(db, R, cid) { const ps = contParts(R, cid); return ps.length ? mixComp(ps.map((p) => ({ comp: composition(db, R, p.lotId), w: p.vol }))) : null; }

/* ---------- état à une date : photo de stocks ---------- */
function snapshotAt(db, date, opts) {
  const R = replay(db, date, opts);
  return {
    date, creeLe: todayISO(),
    portions: Object.values(R.portions).map((p) => ({ lotId: p.lotId, code: (R.lots[p.lotId] || {}).code, designation: (R.lots[p.lotId] || {}).designation, qualif: (R.lots[p.lotId] || {}).qualif, contenantId: p.contenantId, contenant: (db.contenants.find((c) => c.id === p.contenantId) || {}).nom, volL: r2(p.vol) })),
    bouteilles: Object.values(R.tir).filter((t) => t.nb > 0).map((t) => ({ lotId: t.lotId, code: (R.lots[t.lotId] || {}).code, nb: t.nb })),
    intrants: db.arrivages.filter((a) => a.date <= date).map((a) => { const p = db.produits.find((x) => x.id === a.produitId) || {}; return { arrivageId: a.id, produit: p.nom, unite: p.unite, numLot: a.numLot, dluo: a.dluo, restant: r2(a.qty - (R.arrUsed[a.id] || 0)) }; }).filter((x) => x.restant > 0),
    preparations: Object.values(R.preps).filter((p) => p.remaining > 0.005).map((p) => ({ prepId: p.id, code: p.code, type: p.ptype, qualif: p.qualif, restantL: r2(p.remaining) })),
    totalL: r2(R.totalVol),
    totalBouteilles: sum(Object.values(R.tir), (t) => t.nb),
  };
}

/* ---------- dépendances avant suppression d'une opération ---------- */
function opCreates(op) {
  const c = { lots: [], portions: [], preps: [], finis: [], apports: [] };
  if (op.type === 'pressurage') { c.lots.push(op.parentLotId, ...(op.fractions || []).map((f) => f.lotId)); c.portions.push(...(op.fractions || []).map((f) => f.portionId)); }
  if (['debourbage', 'soutirage', 'transfert', 'assemblage'].includes(op.type)) c.portions.push(op.outPortionId);
  if (op.type === 'assemblage' || op.type === 'tirage' || op.type === 'reprise') c.lots.push(op.lotId);
  if (op.type === 'reprise' && op.portionId) c.portions.push(op.portionId);
  if (op.type === 'entree_mout') { (op.lots || []).forEach((l) => { c.lots.push(l.lotId); c.portions.push(l.portionId); }); if (op.lotId) c.lots.push(op.lotId); }
  if (op.type === 'preparation') c.preps.push(op.prepId);
  if (op.type === 'degorgement') c.finis.push(op.lotFiniId);
  if (op.type === 'apport') c.apports.push(op.id);
  return c;
}
function opRefs(op) {
  const r = { lots: [], portions: [], preps: [], apports: [] };
  const P = (x) => x && r.portions.push(x);
  ['portionId', 'sourcePortionId'].forEach((k) => P(op[k]));
  (op.sources || []).forEach((s) => P(s.portionId));
  (op.prepUses || []).forEach((u) => r.preps.push(u.prepId));
  (op.charges || []).forEach((c) => r.apports.push(c.apportId));
  if (op.sourceLotId) r.lots.push(op.sourceLotId);
  if (op.type === 'etape' || op.type === 'declassement') r.lots.push(op.lotId);
  return r;
}
function dependentsOf(db, op) {
  const made = opCreates(op); const out = [];
  const lotsMade = new Set(made.lots), portMade = new Set(made.portions), prepMade = new Set(made.preps), appMade = new Set(made.apports);
  db.ops.forEach((o) => {
    if (o.id === op.id) return;
    const r = opRefs(o);
    if (r.portions.some((p) => portMade.has(p)) || r.preps.some((p) => prepMade.has(p)) || r.apports.some((p) => appMade.has(p)) || r.lots.some((l) => lotsMade.has(l))) out.push(o);
  });
  db.lots.forEach((l) => { if (!lotsMade.has(l.id) && (l.parentIds || []).some((p) => lotsMade.has(p))) { const lo = db.ops.find((o) => o.id === l.opId); if (lo && lo.id !== op.id && !out.includes(lo)) out.push(lo); } });
  (db.lotsFinis || []).forEach((f) => { if (lotsMade.has(f.sourceLotId)) { const lo = db.ops.find((o) => o.id === f.opId); if (lo && lo.id !== op.id && !out.includes(lo)) out.push(lo); } });
  return out;
}
