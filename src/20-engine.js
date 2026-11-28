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
const R_FINIS = new WeakSet(); // états rejoués terminés (0.38.0-alpha.3, voir contParts)
function replay(db, upTo, opts) {
  syncConfig(db);
  const R = { upTo: upTo || null, fusions: {}, lots: {}, portions: {}, pinfo: {}, contVol: {}, preps: {}, tir: {}, raisins: {}, arrUsed: {}, apps: [], warn: {}, flows: [], prepUse: [], opsByLot: {}, capOver: {}, stadeHist: {},
    conc: {}, concDir: {}, concPrep: {}, tirVol: {}, so2Ev: {}, depass: {}, arrRegul: {} };
  // régularisations manuelles de stock (0.36.0-alpha.1) : ajoutées au restant de leur lot fournisseur, à leur date
  const regAv = {}; (Array.isArray(db.regulStocks) ? db.regulStocks : []).forEach((x) => { if (!x || !x.arrivageId || !isoOK(x.date) || (upTo && x.date > upTo)) return; R.arrRegul[x.arrivageId] = (R.arrRegul[x.arrivageId] || 0) + num(x.qty); (regAv[x.arrivageId] = regAv[x.arrivageId] || []).push(x); });
  const regulAu = (aid, date) => sum((regAv[aid] || []).filter((x) => x.date <= date), (x) => x.qty); // cumul des intrants, SO₂ ajouté, dépassements (0.30.0-alpha.1)
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
  // cumul des intrants par lot (0.30.0-alpha.1) : dose apportée par hL du lot (toutes ses cuves), transmise au prorata des volumes quand du vin
  // d'autres lots entre (assemblage, tirage) ; « @so2 » : SO₂ apporté (g/hL) par les produits dont la teneur est connue
  const volLot = (lotId) => { let v = 0; for (const k in R.portions) { const q = R.portions[k]; if (q.lotId === lotId) v += q.vol; } return v; };
  const concAjout = (lotId, pid, d, direct) => { if (!lotId || !(d > 0)) return; const c = (R.conc[lotId] = R.conc[lotId] || {}); c[pid] = (c[pid] || 0) + d; if (direct) { const k = (R.concDir[lotId] = R.concDir[lotId] || {}); k[pid] = (k[pid] || 0) + d; } };
  const concMelange = (lotId, v0, cin, vin) => { // vin litres de concentration cin entrent dans le lot qui en avait v0
    if (!lotId || !(vin > 0)) return; const t = v0 + vin; const c = R.conc[lotId] || {}; const n = {};
    for (const k of new Set([...Object.keys(c), ...Object.keys(cin || {})])) { const v = ((c[k] || 0) * v0 + ((cin || {})[k] || 0) * vin) / t; if (v > 1e-12) n[k] = v; }
    R.conc[lotId] = n; const d = R.concDir[lotId]; if (d) { const m = {}; for (const k in d) { const v = d[k] * v0 / t; if (v > 1e-12) m[k] = v; } R.concDir[lotId] = m; }
  };
  const concDe = (parts) => { const tot = sum(parts, (x) => x.vol); const r = {}; if (!(tot > 0)) return r; parts.forEach((x) => { const c = R.conc[x.lotId] || {}; for (const k in c) r[k] = (r[k] || 0) + c[k] * x.vol / tot; }); return r; };
  const so2Ev = (op, lotId, mgL) => { if (lotId && mgL > 1e-9) (R.so2Ev[lotId] = R.so2Ev[lotId] || []).push({ date: op.date, opId: op.id, mgL }); };
  const depasse = (op, x) => { const a = (R.depass[op.id] = R.depass[op.id] || []); const motif = op.depassement && op.depassement.motif ? String(op.depassement.motif) : '';
    if (motif && !a.length) warn(op, `Dépassement justifié : « ${motif.slice(0, 200)} »`); a.push({ ...x, opId: op.id, date: op.date, justifie: !!motif }); };
  // préparation (pied de cuve, liqueur) versée dans un lot : ses intrants entrent avec son volume
  const prepVerse = (op, prepId, lotId, v0, volL) => { const c = R.concPrep[prepId]; if (!lotId || !(volL > 0)) return; concMelange(lotId, v0, c || {}, volL); if (c && c['@so2']) so2Ev(op, lotId, c['@so2'] * volL / (v0 + volL) * 10); };
  const addPortion = (op, lotId, cid, vol, id, cin) => {
    if (vol <= 0) return null;
    if (cin !== undefined) concMelange(lotId, volLot(lotId), cin, vol); // moût ou vin venu d'ailleurs ({} : sans intrant) ; absent : même lot déplacé
    const ex = Object.values(R.portions).find((p) => p.lotId === lotId && p.contenantId === cid);
    if (ex) { ex.vol += vol; if (op && op.id) (R.fusions[op.id] || (R.fusions[op.id] = [])).push(ex.id); return ex; } // 0.38.0-alpha.3 : versé dans une portion existante (dependentsOf)
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
        const rest = a.qty + regulAu(a.id, op.date) - (R.arrUsed[a.id] || 0);
        if (q > rest + 1e-6) warn(op, `${pr.nom} (lot ${a.numLot}) : quantité utilisée supérieure au restant (${fmt(rest, 2)} ${pr.unite}).`);
        if (a.dluo && op.date > a.dluo) warn(op, `${pr.nom} (lot ${a.numLot}) : DDM dépassée au ${fmtDate(a.dluo)}.`);
        if (a.date && op.date < a.date) warn(op, `${pr.nom} (lot ${a.numLot}) : utilisé avant sa réception (${fmtDate(a.date)}).`);
        R.arrUsed[a.id] = (R.arrUsed[a.id] || 0) + q;
      }
      const dose = tg.vol && tg.kind !== 'prep' ? doseHL(q, pr.unite, tg.vol) : null; // la dose légale se juge sur le vin final, pas sur la préparation
      const lotV = tg.lotId && R.lots[tg.lotId] ? R.lots[tg.lotId].labelsVises : null; // labels visés par le lot (0.40.0-alpha.1)
      const rule = tg.qualif && pr.categorie !== 'sec' ? regleEffective(db, pr, tg.qualif, lotV) : null; // règle du produit + règles de substance du cahier des charges
      const unauth = !!(tg.qualif && pr.categorie !== 'sec' && !(rule && rule.autorise));
      if (unauth && tg.kind === 'prep') warn(op, `${pr.nom} n’est pas autorisé pour une préparation ${qLabel(tg.qualif)}.`);
      const over = !!(rule && rule.autorise && rule.doseMax != null && rule.doseMax !== '' && dose != null && dose > num(rule.doseMax) + 1e-9);
      if (over) warn(op, `${pr.nom} : dose ${fmt(dose, 1)} ${doseUnit(pr.unite)} supérieure à la dose légale max (${fmt(rule.doseMax, 1)}) pour ${qLabel(tg.qualif)}.`);
      // cumul par lot : dose rapportée au volume du lot (ou au vin tiré), SO₂ ajouté quand la teneur du produit est connue
      let volLotA = null; let cumul = null; let so2 = 0;
      if (tg.lotId && (tg.kind === 'portion' || tg.kind === 'tirage')) {
        const V = tg.kind === 'portion' ? volLot(tg.lotId) : (R.tirVol[tg.lotId] || tg.vol || 0); volLotA = V || null;
        const dl = V > 0 ? doseHL(q, pr.unite, V) : null; if (dl != null) { concAjout(tg.lotId, pr.id, dl, true); cumul = (R.conc[tg.lotId] || {})[pr.id]; }
        const t = so2Teneur(pr); if (t != null && V > 0 && q > 0) { so2 = q * t * 1000 / V; concAjout(tg.lotId, '@so2', so2 / 10, true); so2Ev(op, tg.lotId, so2); }
      } else if (tg.kind === 'prep' && tg.prepId && tg.vol > 0) {
        const c = (R.concPrep[tg.prepId] = R.concPrep[tg.prepId] || {}); const dl = doseHL(q, pr.unite, tg.vol); if (dl != null) c[pr.id] = (c[pr.id] || 0) + dl;
        const t = so2Teneur(pr); if (t != null && q > 0) c['@so2'] = (c['@so2'] || 0) + q * t * 100 / tg.vol;
      }
      const maxD = rule && rule.autorise && rule.doseMax != null && rule.doseMax !== '' ? num(rule.doseMax) : null;
      const overC = !over && maxD != null && cumul != null && cumul > maxD + 1e-9 && !produitSulfitant(pr); // sulfitants : contrôlés par le SO₂ total estimé
      if (overC) warn(op, `${pr.nom} : dose cumulée ${fmt(cumul, 1)} ${doseUnit(pr.unite)} dans le lot ${(R.lots[tg.lotId] || {}).code || ''}, supérieure à la dose maximale (${fmt(maxD, 1)}) pour ${qLabel(tg.qualif)}.`);
      if (over || overC) depasse(op, { type: over ? 'dose' : 'cumul', produitId: pr.id, lotId: tg.lotId || null, valeur: over ? dose : cumul, max: maxD, unite: doseUnit(pr.unite), qualif: tg.qualif, aVerifier: !!(rule && rule.aVerifier), label: (rule && rule.refDosePar) || null });
      // référentiel réglementaire (0.40.0-alpha.1) : intrant refusé par un label de la revendication ou visé par le lot, teneur maximale dans le vin franchie
      if (rule && rule.refInterdit && tg.kind !== 'prep') { warn(op, `${pr.nom} : non autorisé (${refLabelNom(rule.refInterditPar)}) pour le lot ${(R.lots[tg.lotId] || {}).code || ''}.`); depasse(op, { type: 'interdit', produitId: pr.id, lotId: tg.lotId || null, qualif: tg.qualif, label: rule.refInterditPar, compose: rule.refInterditCompose || null, aVerifier: !!rule.aVerifier }); }
      if (tg.lotId && cumul != null && (tg.kind === 'portion' || tg.kind === 'tirage') && refActif(db)) {
        const esp = uniq(refComposesDe(pr).map((c) => (refCompose(c.id) || {}).espece).filter(Boolean));
        if (esp.length) refTeneursLot(db, R, tg.lotId).filter((t) => t.depasse && esp.includes(t.espece)).forEach((t) => { warn(op, `${t.libelle} : ${fmt(t.mgL, 1)} mg/L dans le lot ${(R.lots[tg.lotId] || {}).code || ''}, au-delà de la teneur maximale (${fmt(t.max, t.max < 1 ? 2 : 0)} mg/L, ${refLabelNom(t.maxPar)}).`); depasse(op, { type: 'teneur', produitId: pr.id, lotId: tg.lotId, espece: t.espece, valeur: t.mgL, max: t.max, unite: 'mg/L', qualif: tg.qualif, label: t.maxPar, aVerifier: t.aVerifier }); });
      }
      R.apps.push({ opId: op.id, date: op.date, opType: op.type, opSousType: op.sousType || '', produitId: pr.id, arrivageId: l.arrivageId || null, numLot: a ? a.numLot : '', qty: q, unite: pr.unite, kind: tg.kind, portionId: tg.portionId || null, lotId: tg.lotId || null, contenantId: tg.contenantId || null, prepId: tg.prepId || null, vol: tg.vol || null, dose, qualif: tg.qualif || null, unauth, over, volLot: volLotA, cumul, so2 });
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
        (op.fractions || []).forEach((f) => { if (num(f.volL) <= 0) return; touch(op, f.lotId); addPortion(op, f.lotId, f.contenantId, num(f.volL), f.portionId, {}); flow(op, 'entree', num(f.volL), { lotId: f.lotId }); checkCap(op, f.contenantId); });
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
        (op.prepUses || []).forEach((u) => { const pr = usePrep(op, u, p.lotId); if (pr) { prepVerse(op, pr.id, p.lotId, volLot(p.lotId), num(u.volL)); p.vol += num(u.volL); flow(op, 'ajout', num(u.volL), { lotId: p.lotId, prepId: pr.id }); if (lot && rang(pr.qualif) < rang(lot.qualif)) R.apps.push({ opId: op.id, date: op.date, opType: op.type, opSousType: op.sousType || '', kind: 'prep', prepId: pr.id, lotId: p.lotId, portionId: p.id, contenantId: p.contenantId, qualif: lot.qualif, prepQualif: pr.qualif, unauth: true, qty: num(u.volL), unite: 'L', produitId: null }); } });
        if ((op.prepUses || []).length) checkCap(op, p.contenantId); // seul un ajout de volume peut faire déborder
        if (op.type === 'filtration' && p.vol < 0.005 && R.portions[op.portionId] === p) delete R.portions[op.portionId]; // 0.38.0-alpha.3 : tout perdu → cuve vide (comme le jaugeage)
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
        const parts = []; (op.sources || []).forEach((s) => { const t = take(op, s.portionId, s.volL); if (t) { tot += t.vol; parts.push({ lotId: t.lotId, vol: t.vol }); } });
        const lossV = sum(op.pertes, (x) => x.volL);
        (op.pertes || []).forEach((x) => flow(op, 'perte', -num(x.volL), { typeId: x.typeId, lotId: op.lotId }));
        // cuve de mixtion (0.42.0-alpha.2) : levain et liqueur versés avec le vin ; composition (vin, liqueur, eau) gardée pour le VRTP
        const pu = op.mixtion ? (op.prepUses || []).map((u) => ({ u, p: usePrep(op, u, op.lotId) })).filter((x) => x.p) : []; const vp = sum(pu, (x) => x.u.volL);
        if (op.mixtion) { const cp = prepCompoVide(); parts.forEach((x) => { const c = (R.lotCompo || {})[x.lotId]; if (c) Object.keys(cp).forEach((k) => { cp[k] += x.vol * c[k]; }); else cp.vin += x.vol; }); pu.forEach((x) => { const c = prepCompo(R, x.p.id); Object.keys(cp).forEach((k) => { cp[k] += num(x.u.volL) * c[k]; }); }); const tt = sum(Object.values(cp)); R.lotCompo = R.lotCompo || {}; if (tt > 0) R.lotCompo[op.lotId] = Object.fromEntries(Object.entries(cp).map(([k, v]) => [k, v / tt])); }
        const np = addPortion(op, op.lotId, op.destId, Math.max(0, tot + vp - lossV), op.outPortionId, concDe(parts)); // intrants des lots d'origine au prorata
        if (np && pu.length) { let v0 = tot - lossV; pu.forEach((x) => { prepVerse(op, x.p.id, op.lotId, v0, num(x.u.volL)); v0 += num(x.u.volL); }); }
        checkCap(op, op.destId);
        if (np) applyLignes(op, op.lignes, { kind: 'portion', portionId: np.id, lotId: op.lotId, contenantId: op.destId, vol: np.vol, qualif: R.lots[op.lotId] && R.lots[op.lotId].qualif });
        break;
      }
      case 'etape': if (R.lots[op.lotId]) { if (op.newType) R.lots[op.lotId].type = op.newType; setStade(op, op.lotId, op.newStade, op.couleur); touch(op, op.lotId); } break;
      case 'declassement': if (R.lots[op.lotId]) { R.lots[op.lotId].qualif = op.qualifId; touch(op, op.lotId); } break;
      case 'preparation': {
        let srcLot = null;
        if (op.sourcePortionId && num(op.sourceVolL) > 0) { const t = take(op, op.sourcePortionId, op.sourceVolL); if (t) { flow(op, 'prelevement', -t.vol, { lotId: t.lotId }); srcLot = t.lotId; } }
        // composition (0.42.0-alpha.1) : vin prélevé, liqueur utilisée (préparations), eau ; le reste (levures, sucre…) en « autre »
        let liqUse = 0; (op.prepUses || []).forEach((u) => { const pr = usePrep(op, u, null); if (pr) liqUse += num(u.volL); });
        const vinP = srcLot ? num(op.sourceVolL) : 0; const eauP = num(op.eauL);
        R.preps[op.prepId] = { id: op.prepId, code: op.code, ptype: op.ptype, qualif: op.qualifId, vol: num(op.volL), remaining: num(op.volL), date: op.date, opId: op.id, srcLot,
          compo: { vin: vinP, liqueur: liqUse, eau: eauP, autre: Math.max(0, num(op.volL) - vinP - liqUse - eauP) } };
        if (srcLot && num(op.volL) > 0) { const c = R.conc[srcLot] || {}; const f = Math.min(1, num(op.sourceVolL) / num(op.volL)); const k = {}; for (const x in c) k[x] = c[x] * f; R.concPrep[op.prepId] = k; }
        applyLignes(op, op.lignes, { kind: 'prep', prepId: op.prepId, vol: num(op.volL), qualif: op.qualifId });
        break;
      }
      case 'alimentation': { // levain (0.42.0-alpha.1) : étape, alimentation ou relevé — vin prélevé, liqueur utilisée, eau, autres ajouts ; volume mesuré
        const p = R.preps[op.prepId]; if (!p) { warn(op, 'Préparation introuvable.'); break; }
        let vin = 0; if (op.sourcePortionId && num(op.sourceVolL) > 0) { const t = take(op, op.sourcePortionId, op.sourceVolL); if (t) { flow(op, 'prelevement', -t.vol, { lotId: t.lotId }); vin = t.vol; } }
        let liq = 0; (op.prepUses || []).forEach((u) => { const pr = usePrep(op, u, null); if (pr) liq += num(u.volL); });
        const eau = num(op.eauL); const autre = num(op.autreL); const ajout = vin + liq + eau + autre;
        p.vol += ajout; p.remaining += ajout; p.compo = p.compo || prepCompoVide(); p.compo.vin += vin; p.compo.liqueur += liq; p.compo.eau += eau; p.compo.autre += autre;
        if (hasNum(op.volMesureL) && num(op.volMesureL) >= 0) { const ecart = num(op.volMesureL) - p.remaining; p.remaining = num(op.volMesureL); p.ecartL = (p.ecartL || 0) + ecart; }
        applyLignes(op, op.lignes, { kind: 'prep', prepId: op.prepId, vol: p.remaining, qualif: p.qualif });
        p.suivi = (p.suivi || 0) + 1; break;
      }
      case 'tirage': {
        touch(op, op.lotId);
        mixWarn(op, [...(op.sources || []).map((s) => pq(s.portionId)), ...(op.prepUses || []).map((u) => (R.preps[u.prepId] || {}).qualif)], `la cuvée de tirage ${(R.lots[op.lotId] || {}).code || ''}`);
        const parts = []; (op.sources || []).forEach((s) => { const t = take(op, s.portionId, s.volL); if (t) { flow(op, 'tirage', -t.vol, { lotId: t.lotId }); parts.push({ lotId: t.lotId, vol: t.vol }); } });
        { const v = sum(parts, (x) => x.vol); if (v > 0) { const v0 = R.tirVol[op.lotId] || 0; concMelange(op.lotId, v0, concDe(parts), v); R.tirVol[op.lotId] = v0 + v; } }
        (op.prepUses || []).forEach((u) => { const pr = usePrep(op, u, op.lotId); if (pr) { const v0 = R.tirVol[op.lotId] || 0; prepVerse(op, pr.id, op.lotId, v0, num(u.volL)); R.tirVol[op.lotId] = v0 + num(u.volL); } });
        R.tir[op.lotId] = { lotId: op.lotId, nb: num(op.nbBouteilles), mis: num(op.nbBouteilles), date: op.date, ...(Array.isArray(op.formats) && op.formats.length ? { formats: op.formats.map((x) => ({ format: x.format, nb: num(x.nb), L: num(x.L) })) } : {}), ...(num(op.casse) > 0 ? { casse: num(op.casse) } : {}) };
        applyLignes(op, op.lignes, { kind: 'tirage', lotId: op.lotId, vol: num(op.nbBouteilles) * num(op.volBouteilleL || 0.75), qualif: R.lots[op.lotId] && R.lots[op.lotId].qualif });
        // 0.42.0-alpha.3 : fournitures suivies par lot fournisseur sans décompte → tracées (quantité 0, quantité utilisée gardée à part)
        (Array.isArray(op.fournitures) ? op.fournitures : []).filter((x) => x && !x.decompte && x.produitId && prod[x.produitId]).forEach((x) => { const a = arr[x.arrivageId]; R.apps.push({ opId: op.id, date: op.date, opType: op.type, opSousType: '', produitId: x.produitId, arrivageId: x.arrivageId || null, numLot: a ? a.numLot : '', qty: 0, nonDecompte: num(x.qty), unite: prod[x.produitId].unite, kind: 'tirage', portionId: null, lotId: op.lotId || null, contenantId: null, prepId: null, vol: null, dose: null, qualif: null, unauth: false, over: false, volLot: null, cumul: null, so2: 0 }); });
        break;
      }
      case 'degorgement': {
        touch(op, op.sourceLotId);
        mixWarn(op, [(R.lots[op.sourceLotId] || {}).qualif, ...(op.prepUses || []).map((u) => (R.preps[u.prepId] || {}).qualif)], 'le lot fini');
        const t = R.tir[op.sourceLotId];
        if (!t) warn(op, 'Lot de tirage introuvable (aucune bouteille en stock à cette date).');
        else { if (num(op.nb) > t.nb) warn(op, `Dégorgement de ${fmt(op.nb)} bouteilles pour ${fmt(t.nb)} en stock.`); t.nb = Math.max(0, t.nb - num(op.nb)); t.deg = (t.deg || 0) + num(op.nb); if (t.nb <= 0) setStade(op, op.sourceLotId, stadeRole(db, 'degorgement')); }
        (op.prepUses || []).forEach((u) => { const pr = usePrep(op, u, op.sourceLotId); const vd = num(op.nb) * num(op.volBouteilleL || (R.tirVol[op.sourceLotId] && t && t.mis ? R.tirVol[op.sourceLotId] / t.mis : 0.75));
          // 0.38.0-alpha.3 : la liqueur ne va que dans les bouteilles dégorgées → imputée au LOT FINI (jamais cumulée sur le lot de tirage,
          // qui garde ses bouteilles sur lattes) ; le lot fini reprend ce que contenait le lot de tirage à cette date (SO₂ compris)
          const fid = op.lotFiniId; if (fid && !R.conc[fid]) { R.conc[fid] = { ...(R.conc[op.sourceLotId] || {}) }; R.concDir[fid] = {}; const h = so2Herite(db, R, op.sourceLotId, op.date); R.conc[fid]['@so2'] = h / 10; if (h > 1e-9) (R.so2Ev[fid] = R.so2Ev[fid] || []).push({ date: op.date, opId: op.id, mgL: h, herite: op.sourceLotId }); }
          const c = pr && R.concPrep[pr.id]; if (fid && c && vd > 0) for (const k in c) { const d = c[k] * num(u.volL) / vd; concAjout(fid, k, d, true); if (k === '@so2') so2Ev(op, fid, d * 10); } });
        applyLignes(op, op.lignes, { kind: 'deg', lotId: op.sourceLotId, vol: null, qualif: null });
        break;
      }
      case 'entree_mout': { // un lot de moût par cuve de destination ; plusieurs moûts (compartiments) peuvent aller dans la même cuve
        moutLots(op).forEach((l) => {
          touch(op, l.lotId);
          mixWarn(op, l.qualifs, `le lot ${l.code || ''} (${cont[l.contenantId] ? cont[l.contenantId].nom : 'cuve'})`);
          if (l.vol > 0) { addPortion(op, l.lotId, l.contenantId, l.vol, l.portionId, {}); flow(op, 'entree', l.vol, { lotId: l.lotId, mout: true }); checkCap(op, l.contenantId); }
        });
        break;
      }
      case 'reprise': {
        touch(op, op.lotId);
        if (num(op.nbBouteilles) > 0) R.tir[op.lotId] = { lotId: op.lotId, nb: num(op.nbBouteilles), mis: num(op.nbBouteilles), date: op.date, reprise: true };
        if (num(op.volL) > 0 && op.contenantId) { addPortion(op, op.lotId, op.contenantId, num(op.volL), op.portionId, {}); flow(op, 'entree', num(op.volL), { lotId: op.lotId, reprise: true }); checkCap(op, op.contenantId); }
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
  R_FINIS.add(R); // rejeu terminé : R ne change plus (index des contenants, contParts)
  return R;
}

const _rc = new WeakMap();
function getR(db, upTo) {
  let m = _rc.get(db); if (!m) { m = new Map(); _rc.set(db, m); }
  const k = upTo || '*'; if (!m.has(k)) m.set(k, replay(db, upTo, upTo || !hygEvenementsUtiles(db) ? undefined : { evenements: true })); return m.get(k); // état complet : avec les événements des contenants si les plans d'hygiène sont suivis (0.26.0-alpha.1)
}

/* ---------- arrivages / DDM ---------- */
const arrivalRest = (R, a) => a.qty + ((R.arrRegul || {})[a.id] || 0) - (R.arrUsed[a.id] || 0); // régularisations comprises (0.36.0-alpha.1)
function dluoState(dluo, ref) {
  if (!dluo) return { k: 'none', label: 'Sans DDM', cls: '' };
  const d = daysBetween(ref || todayISO(), dluo);
  if (d < 0) return { k: 'expire', label: `Périmé depuis ${-d} j`, cls: 'chip-bad' };
  if (d <= 30) return { k: 'bientot', label: `DDM dans ${d} j`, cls: 'chip-warn' };
  return { k: 'ok', label: `DDM ${fmtDate(dluo)}`, cls: 'chip-ok' };
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
// 0.38.0-alpha.3 : sur un état terminé (R_FINIS), index des portions par contenant construit une fois (les cartes de cuves appelaient
// ce calcul trois fois par cuve, en parcourant toutes les portions) ; toujours une liste neuve (les appelants la trient sur place)
const _rParCont = new WeakMap();
const contPartsTout = (R, cid) => Object.values(R.portions).filter((p) => p.contenantId === cid);
function contParts(R, cid) {
  let ps;
  if (R && R_FINIS.has(R)) {
    let ix = _rParCont.get(R); if (!ix) { ix = {}; Object.values(R.portions).forEach((p) => { (ix[p.contenantId] || (ix[p.contenantId] = [])).push(p); }); _rParCont.set(R, ix); }
    ps = ix[cid] || [];
  } else ps = contPartsTout(R, cid);
  return ps.map((p) => ({ lotId: p.lotId, vol: p.vol, portionId: p.id, since: p.since }));
}
function contentComp(db, R, cid) { const ps = contParts(R, cid); return ps.length ? mixComp(ps.map((p) => ({ comp: composition(db, R, p.lotId), w: p.vol }))) : null; }

/* ---------- état à une date : photo de stocks ---------- */
function snapshotAt(db, date, opts) {
  const R = replay(db, date, opts);
  return {
    date, creeLe: todayISO(),
    portions: Object.values(R.portions).map((p) => ({ lotId: p.lotId, code: (R.lots[p.lotId] || {}).code, designation: (R.lots[p.lotId] || {}).designation, qualif: (R.lots[p.lotId] || {}).qualif, contenantId: p.contenantId, contenant: (db.contenants.find((c) => c.id === p.contenantId) || {}).nom, volL: r2(p.vol) })),
    bouteilles: Object.values(R.tir).filter((t) => t.nb > 0).map((t) => ({ lotId: t.lotId, code: (R.lots[t.lotId] || {}).code, nb: t.nb })),
    intrants: db.arrivages.filter((a) => a.date <= date).map((a) => { const p = db.produits.find((x) => x.id === a.produitId) || {}; return { arrivageId: a.id, produit: p.nom, unite: p.unite, numLot: a.numLot, dluo: a.dluo, restant: r2(arrivalRest(R, a)) }; }).filter((x) => x.restant > 0),
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
  if (op.type === 'alimentation' && op.prepId) r.preps.push(op.prepId); // suivi d'un levain (0.42.0-alpha.1)
  return r;
}
function dependentsOf(db, op) {
  const made = opCreates(op); const out = [];
  const lotsMade = new Set(made.lots), portMade = new Set(made.portions), prepMade = new Set(made.preps), appMade = new Set(made.apports);
  // 0.38.0-alpha.3 : volume versé dans une portion qui existait déjà (même lot, même cuve) : les opérations suivantes sur cette portion en dépendent
  let fus = new Set(); try { const Rf = replay(db); // rejeu direct (la base peut avoir changé depuis le dernier getR)
     fus = new Set(((Rf && Rf.fusions) || {})[op.id] || []); } catch (e) { /* rejeu impossible : dépendances directes seules */ }
  const apres = (o) => o.date > op.date || (o.date === op.date && (o.seq || 0) > (op.seq || 0));
  db.ops.forEach((o) => {
    if (o.id === op.id) return;
    const r = opRefs(o);
    if (r.portions.some((p) => portMade.has(p) || (fus.has(p) && apres(o))) || r.preps.some((p) => prepMade.has(p)) || r.apports.some((p) => appMade.has(p)) || r.lots.some((l) => lotsMade.has(l))) out.push(o);
  });
  db.lots.forEach((l) => { if (!lotsMade.has(l.id) && (l.parentIds || []).some((p) => lotsMade.has(p))) { const lo = db.ops.find((o) => o.id === l.opId); if (lo && lo.id !== op.id && !out.includes(lo)) out.push(lo); } });
  (db.lotsFinis || []).forEach((f) => { if (lotsMade.has(f.sourceLotId)) { const lo = db.ops.find((o) => o.id === f.opId); if (lo && lo.id !== op.id && !out.includes(lo)) out.push(lo); } });
  return out;
}
