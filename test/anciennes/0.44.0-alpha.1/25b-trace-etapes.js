/* ============ TRAÇABILITÉ À CHAQUE ÉTAPE (0.28.0-alpha.1) : du raisin au dégorgé ============
   Recherche par n'importe quel repère — n° de pesée ou de marc, code de lot (moût, vin, assemblage, cuvée de tirage), lot fini (dégorgé),
   cuve, apporteur ou cru, n° de bon, de DAE ou de lot du fournisseur, date — puis la chaîne complète autour de ce qui est trouvé :
   en amont jusqu'aux pesées et aux entrées de moûts, en aval jusqu'aux lots finis et aux expéditions (un pas en amont, un pas en aval
   à chaque étape : règlement (CE) n° 178/2002, article 18). */
const ETAPES_TRACE = [['raisin', 'Raisins (pesées)'], ['pressurage', 'Pressurage (marcs)'], ['mout', 'Moûts et vins'], ['assemblage', 'Assemblages et vins de réserve'], ['tirage', 'Tirage (sur lattes)'], ['fini', 'Dégorgé (lots finis)'], ['sortie', 'Expéditions et sorties']];
const etapeLot = (l) => (!l ? 'mout' : l.type === 'cuvee_tirage' ? 'tirage' : ['assemblage', 'vin_reserve'].includes(l.type) ? 'assemblage' : l.type === 'pressee' ? 'pressurage' : 'mout');
const etapeRang = (e) => ETAPES_TRACE.findIndex((x) => x[0] === e);
// date saisie (21/11/2026, 21/11/26, 2026-11-21) → ISO
function traceDateQ(t) {
  const m = String(t || '').trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/); if (m) { const y = m[3].length === 2 ? `20${m[3]}` : m[3]; const iso = `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; return isoValide(iso) ? iso : ''; }
  return isoValide(String(t || '').trim()) ? String(t).trim() : '';
}
function traceChercher(db, R, q) {
  const brut = String(q || '').trim(); const t = norm(brut).trim(); if (t.length < 1) return [];
  const out = []; const add = (x) => { if (!out.some((y) => y.type === x.type && y.id === x.id)) out.push(x); };
  // « pesée 12 », « marc 3 » ; aussi dans les autres langues de l'interface (weighing, pesada, pesata, Wägung, pesagem ; press load…)
  const mP = t.match(/^(?:pesee|p|weighing|pesada|pesata|wagung|pesagem)\s*(?:n°|no\.?|nr\.?|n\.?º?|#)?\s*(\d+)$/); const mM = t.match(/^(?:marc|m|press load|load|prensada|pressata|pressung|prensagem)\s*(?:n°|no\.?|nr\.?|n\.?º?|#)?\s*(\d+)$/); const nb = /^\d+$/.test(t) ? Number(t) : null; const dq = traceDateQ(brut);
  const has = (s) => !!s && t.length >= 2 && norm(String(s)).includes(t);
  const nomAp = (id) => { const a = (db.apporteurs || []).find((x) => x.id === id); return a ? a.nom : ''; };
  const nomCru = (id) => { const c = (db.crus || []).find((x) => x.id === id); return c ? c.nom : ''; };
  (db.ops || []).forEach((o) => {
    if (!o) return;
    if (o.type === 'apport' && o.pesee) { const parc = (db.parcelles || []).find((x) => x.id === o.parcelleId); if ((mP && Number(mP[1]) === o.pesee.num) || (nb !== null && !mM && nb === o.pesee.num) || has(o.ref) || has(nomAp(o.apporteurId)) || has(nomCru(o.cruId)) || has(o.pesee.mention) || has(parc && parc.nom) || dq === o.date) add({ etape: 'raisin', type: 'op', id: o.id, titre: `Pesée n° ${o.pesee.num}`, sous: [nomAp(o.apporteurId), nomCru(o.cruId), `${fmt(o.kg)} kg`].filter(Boolean).join(' · '), date: o.date }); }
    else if (o.type === 'pressurage') { const codes = [(o.parentSpec || {}).code, ...(o.fractions || []).map((f) => f.code)]; if ((o.marc && ((mM && Number(mM[1]) === o.marc.num) || (nb !== null && !mP && nb === o.marc.num))) || codes.some(has) || dq === o.date) add({ etape: 'pressurage', type: 'op', id: o.id, titre: o.marc ? `Marc n° ${o.marc.num}` : 'Pressurage', sous: [(o.parentSpec || {}).code, (o.parentSpec || {}).designation].filter(Boolean).join(' · '), date: o.date }); }
    else if (o.type === 'sortie') { if (has(o.ref) || has(o.destinataire) || dq === o.date) add({ etape: 'sortie', type: 'op', id: o.id, titre: o.ref || opNom(o), sous: [o.destinataire, `${fmtHL(o.volL)}`].filter(Boolean).join(' · '), date: o.date }); }
    else if (o.type === 'entree_mout') { if (has(o.ref) || has(o.immat) || has(nomAp(o.apporteurId)) || moutPartenaires(o).some((p) => has(p.ref) || has(nomAp(p.apporteurId))) || (o.entrees || []).some((e) => ligneApporteurs(e, o).some((a) => has(nomAp(a.id)))) || (o.entrees || []).some((e) => has(e.numLot)) || dq === o.date) add({ etape: 'mout', type: 'op', id: o.id, titre: `Entrée de moûts${o.ref ? ` ${o.ref}` : ''}`, sous: nomAp(o.apporteurId), date: o.date }); }
    else if (o.type === 'degorgement' && dq === o.date && o.lotFiniId) { const f = (db.lotsFinis || []).find((x) => x.id === o.lotFiniId); if (f) add({ etape: 'fini', type: 'fini', id: f.id, titre: f.code, sous: f.designation, date: f.date }); }
  });
  const anc = (x) => (x.codesPrecedents || []).some((p) => p && has(p.code)) || has(x.codeFournisseur); // anciens codes, code du fournisseur (0.41.0-alpha.1)
  (db.lots || []).forEach((l) => { if (has(l.code) || has(l.designation) || anc(l) || (dq && dq === l.date)) add({ etape: etapeLot(l), type: 'lot', id: l.id, titre: l.code, sous: l.designation || LOT_TYPES[l.type] || '', date: l.date }); });
  (db.lotsFinis || []).forEach((f) => { if (has(f.code) || has(f.designation) || anc(f)) add({ etape: 'fini', type: 'fini', id: f.id, titre: f.code, sous: f.designation, date: f.date }); });
  // habillages et mises en carton (0.41.0-alpha.1) : le lot fini d'origine
  (db.habillages || []).forEach((h) => { if (!h || !(has(h.code) || anc(h) || has(h.ref) || (dq && dq === h.date))) return; const f = habillageFini(db, h); if (f) add({ etape: 'fini', type: 'fini', id: f.id, titre: f.code, sous: `${h.type === 'carton' ? 'Mise en carton' : 'Habillage'} ${h.code}`, date: f.date }); });
  // cuve : ce qu'elle contient aujourd'hui
  (db.contenants || []).forEach((c) => { const n = norm(c.nom || '').trim(); if (t.length >= 1 && (n === t || (t.length >= 3 && n.includes(t)))) contParts(R, c.id).forEach((p) => { const l = R.lots[p.lotId] || lotById(db, p.lotId); if (l) add({ etape: etapeLot(l), type: 'lot', id: l.id, titre: l.code, sous: `${l.designation || ''} — ${c.nom}`, date: l.date }); }); });
  // lot d'un produit (n° de lot du fournisseur) : les lots qui l'ont reçu
  (db.arrivages || []).forEach((a) => { if (a && has(a.numLot)) Object.keys(R.opsByLot || {}).forEach((lid) => { if ((R.opsByLot[lid] || []).some((oid) => { const o = (db.ops || []).find((x) => x.id === oid); return o && (o.lignes || []).some((li) => li.arrivageId === a.id); })) { const l = lotById(db, lid); if (l) add({ etape: etapeLot(l), type: 'lot', id: l.id, titre: l.code, sous: `${l.designation || ''} — ${a.numLot}`, date: l.date }); } }); });
  return out.sort((a, b) => etapeRang(a.etape) - etapeRang(b.etape) || String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 80);
}
// opérations qui ont créé, ou qui touchent, un lot
const traceOpsLot = (db, R, lotId) => ((R.opsByLot || {})[lotId] || []).map((id) => (db.ops || []).find((o) => o.id === id)).filter(Boolean);
// chaîne complète autour d'une cible { type: 'lot' | 'fini' | 'op', id }
function traceChaine(db, R, cible) {
  const opById = (id) => (db.ops || []).find((o) => o.id === id); const finiById = (id) => (db.lotsFinis || []).find((f) => f.id === id);
  let base = []; let finisCible = [];
  if (cible.type === 'lot') base = [cible.id];
  else if (cible.type === 'fini') { const f = finiById(cible.id); if (f) { finisCible = [f.id]; base = [f.sourceLotId]; } }
  else if (cible.type === 'op') {
    const o = opById(cible.id);
    if (o && o.type === 'apport') base = (db.ops || []).filter((p) => p.type === 'pressurage' && (p.charges || []).some((c) => c.apportId === o.id)).flatMap((p) => [p.parentLotId, ...(p.fractions || []).map((f) => f.lotId)]);
    else if (o && o.type === 'sortie') base = [((R.pinfo || {})[o.portionId] || {}).lotId];
    else if (o && o.type === 'degorgement') { finisCible = [o.lotFiniId]; base = [o.sourceLotId]; }
    else if (o) { const c = opCreates(o); const r = opRefs(o); base = [...c.lots, ...r.lots, ...(o.sources || []).map((s) => s.lotId), ...r.portions.map((pid) => ((R.pinfo || {})[pid] || {}).lotId)]; }
  }
  base = uniq(base.filter(Boolean)).filter((id) => lotById(db, id));
  const amont = new Set(); base.forEach((id) => ancestors(db, id, amont));
  const aval = new Set(); const desc = (id) => childrenOf(db, id).forEach((c) => { if (!aval.has(c.id)) { aval.add(c.id); desc(c.id); } }); base.forEach(desc);
  const ids = uniq([...amont, ...base, ...aval]); const lots = ids.map((id) => lotById(db, id)).filter(Boolean);
  const crea = uniq(lots.map((l) => l.opId)).map(opById).filter(Boolean);
  const press = crea.filter((o) => o.type === 'pressurage');
  const pesees = uniq(press.flatMap((p) => (p.charges || []).map((c) => c.apportId))).map(opById).filter(Boolean);
  const entrees = crea.filter((o) => o.type === 'entree_mout');
  const enAval = uniq([...base, ...aval]);
  const finis = uniq([...finisCible, ...enAval.flatMap((id) => finisOf(db, id).map((f) => f.id))]).map(finiById).filter(Boolean);
  const sorties = (db.ops || []).filter((o) => o && o.type === 'sortie' && (enAval.includes(((R.pinfo || {})[o.portionId] || {}).lotId) || (o.lotFiniId && finis.some((f) => f.id === o.lotFiniId))));
  const cibleOp = cible.type === 'op' ? opById(cible.id) : null;
  return {
    cible, base, lots, amont: [...amont], aval: [...aval], pesees, press, entrees, finis, sorties,
    etapes: {
      raisin: pesees.map((o) => ({ type: 'op', id: o.id, o, cible: !!(cibleOp && cibleOp.id === o.id) })),
      pressurage: [...press.map((o) => ({ type: 'op', id: o.id, o, cible: !!(cibleOp && cibleOp.id === o.id) }))],
      mout: [...entrees.map((o) => ({ type: 'op', id: o.id, o, cible: !!(cibleOp && cibleOp.id === o.id) })), ...lots.filter((l) => etapeLot(l) === 'mout').map((l) => ({ type: 'lot', id: l.id, l, cible: cible.type === 'lot' && cible.id === l.id }))],
      assemblage: lots.filter((l) => etapeLot(l) === 'assemblage').map((l) => ({ type: 'lot', id: l.id, l, cible: cible.type === 'lot' && cible.id === l.id })),
      tirage: lots.filter((l) => etapeLot(l) === 'tirage').map((l) => ({ type: 'lot', id: l.id, l, cible: cible.type === 'lot' && cible.id === l.id })),
      fini: finis.map((f) => ({ type: 'fini', id: f.id, f, cible: cible.type === 'fini' && cible.id === f.id })),
      sortie: sorties.map((o) => ({ type: 'op', id: o.id, o, cible: !!(cibleOp && cibleOp.id === o.id) })),
    },
  };
}
// résumé d'un lot pour la chaîne : volume présent, cuves, intrants, analyses, opérations
function traceLotResume(db, R, lotId) {
  const ops = traceOpsLot(db, R, lotId);
  const intrants = uniq(ops.flatMap((o) => (o.lignes || []).map((li) => li.produitId))).map((id) => (db.produits || []).find((p) => p.id === id)).filter(Boolean);
  const cuves = uniq(Object.values(R.portions || {}).filter((p) => p.lotId === lotId && p.vol > 0.005).map((p) => p.contenantId)).map((id) => (db.contenants || []).find((c) => c.id === id)).filter(Boolean);
  return { vol: (R.lotVol || {})[lotId] || 0, cuves, intrants, analyses: (db.analyses || []).filter((a) => a && a.lotId === lotId).length, ops: ops.length, bouteilles: ((R.tir || {})[lotId] || {}).nb || 0 };
}
