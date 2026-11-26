/* ============ OPÉRATIONS : lecture (lots, contenants, résumé) ============ */
function opConts(op, R) {
  const ids = new Set(); const P = (pid) => { const pi = pid && R.pinfo[pid]; if (pi) ids.add(pi.contenantId); };
  P(op.portionId); P(op.sourcePortionId); (op.sources || []).forEach((s) => P(s.portionId));
  if (op.destId) ids.add(op.destId); if (op.contenantId) ids.add(op.contenantId);
  (op.fractions || []).forEach((f) => f.volL > 0 && ids.add(f.contenantId));
  (op.lots || []).forEach((l) => l.contenantId && ids.add(l.contenantId));
  return [...ids];
}
function opLots(op, R) {
  const ids = new Set(); [op.parentLotId, op.lotId, op.sourceLotId].forEach((x) => x && ids.add(x));
  (op.fractions || []).forEach((f) => f.volL > 0 && ids.add(f.lotId));
  (op.lots || []).forEach((l) => l.lotId && ids.add(l.lotId));
  const P = (pid) => { const pi = pid && R.pinfo[pid]; if (pi) ids.add(pi.lotId); };
  P(op.portionId); P(op.sourcePortionId); (op.sources || []).forEach((s) => { if (s.lotId) ids.add(s.lotId); P(s.portionId); });
  return [...ids];
}
// dose de chaque produit (0.29.0-alpha.1) : celle calculée au rejeu (R.apps), dans l'unité du produit (g/hL, mL/hL, kg/hL, L/hL)
const APPS_PAR_OP = new WeakMap();
const appsDeOp = (R, opId) => { const A = (R && R.apps) || []; let m = APPS_PAR_OP.get(A); if (!m) { m = new Map(); A.forEach((x) => { const L = m.get(x.opId); if (L) L.push(x); else m.set(x.opId, [x]); }); APPS_PAR_OP.set(A, m); } return m.get(opId) || []; };
const lignesText = (db, lignes, R, opId) => (lignes || []).map((l) => { const p = prodOf(db, l.produitId); const a = arrOf(db, l.arrivageId); const ap = R && opId ? appsDeOp(R, opId).find((x) => x.produitId === l.produitId && (x.arrivageId || '') === (l.arrivageId || '')) : null; const dz = ap && ap.dose != null ? doseTexte(ap.dose, p.unite) : '';
  return `${p.nom || '?'} ${fmt(l.qty, 2)} ${p.unite || ''}${dz ? ` (${dz})` : ''}${a.numLot ? ` (lot ${a.numLot})` : ''}`; }).join(' · ');
const pertesText = (db, pertes) => (pertes || []).map((p) => `${lbl(db, 'typesPerte', p.typeId)} ${fmtL(p.volL)}`).join(' · ');
// résumé + stade / couleur portés par l'opération
function opSummary(db, R, op) {
  const c = champsTexte(op, true); const t = opSummary1(db, R, op); const j = jaugesTexte(db, op); return [t, c, j].filter(Boolean).join(' · '); // + champs personnalisés (0.16.0-alpha.1), mesures de jaugeage (0.17.0-alpha.1)
}
function opSummary1(db, R, op) {
  const t = opSummary0(db, R, op); if (op.type === 'etape' || (!op.stade && !op.couleur)) return t;
  const v = [op.stade ? `stade : ${stadeCourt(db, op.stade)}` : '', op.couleur && VIN_CREE.includes(op.type) && op.type !== 'entree_mout' ? couleurLabel(db, op.couleur).toLowerCase() : ''].filter(Boolean).join(', ');
  return v ? `${t} · ${VIN_CREE.includes(op.type) ? v : `→ ${v}`}` : t;
}
function opSummary0(db, R, op) {
  const cn = (id) => contName(db, id); const pc = (pid) => (R.pinfo[pid] ? cn(R.pinfo[pid].contenantId) : '—');
  const L = lignesText(db, op.lignes, R, op.id); const parts = [];
  switch (op.type) {
    case 'apport': return [op.pesee && op.pesee.num ? `Pesée n° ${op.pesee.num}` : '', `${fmt(op.kg)} kg ${lbl(db, 'cepages', op.cepageId)}`, op.parcelleId ? `parcelle ${parcelleName(db, op.parcelleId)}` : '', op.cruId ? cruName(db, op.cruId) : 'cru non renseigné', op.apporteurId ? apporteurName(db, op.apporteurId) : '', qLabel(op.qualifId), op.ref ? `bon ${op.ref}` : '', op.pesee && hasNum(op.pesee.tap) ? `TAP ${fmt(op.pesee.tap, 1)} % vol.` : '', op.pesee && hasNum(op.pesee.pourritureAcide) ? `pourriture acide ${fmt(op.pesee.pourritureAcide, 1)} %` : ''].filter(Boolean).join(' · ');
    case 'entree_mout': return [`${fmtL(sum(op.entrees, (e) => e.volL))} de moûts (${(op.entrees || []).length} moût${(op.entrees || []).length > 1 ? 's' : ''})`, (op.entrees || []).map((e) => `${e.compartiment ? e.compartiment + ' ' : ''}${lbl(db, 'cepages', e.cepageId)} ${fracLabel(db, e.fractionId).toLowerCase()}${e.cruId ? ' ' + cruName(db, e.cruId) : ''}${e.millesime && e.millesime !== op.millesime ? ' ' + e.millesime : ''} ${qDef(e.qualifId).court}`).join(' / '), (op.partenaires || []).length > 1 ? moutPartenaires(op).map((p) => `${p.apporteurId ? apporteurName(db, p.apporteurId) : '—'}${p.ref ? ` (${p.ref})` : ''}`).join(' + ') : op.apporteurId ? apporteurName(db, op.apporteurId) : '', op.immat ? `citerne ${op.immat}` : '', `→ ${(op.lots || []).map((l) => `${cn(l.contenantId)} (${l.code})`).join(', ')}`].filter(Boolean).join(' · ');
    case 'pressurage': return [op.marc && op.marc.num ? `Marc n° ${op.marc.num}${op.marc.enCours ? ' (en cours)' : ''}` : '', `${fmt(sum(op.charges, (c) => c.kg))} kg → ${fmtL(sum(op.fractions, (f) => f.volL))}`, (op.fractions || []).filter((f) => f.volL > 0).map((f) => `${fracLabel(db, f.fractionId)} ${fmtL(f.volL)} → ${cn(f.contenantId)}`).join(', ')].filter(Boolean).join(' · ');
    case 'debourbage': case 'soutirage': case 'transfert': parts.push(`${fmtL(op.volL)} : ${pc(op.portionId)} → ${cn(op.destId)}`); if ((op.pertes || []).length) parts.push(`pertes : ${pertesText(db, op.pertes)}`); if (L) parts.push(L); return parts.join(' · ');
    case 'intrant': return [pc(op.portionId), op.motif, L, (op.prepUses || []).map((u) => `${prepOf(R, u.prepId).code || '?'} ${fmtL(u.volL)}`).join(', '), op.enrichissement && hasNum(op.enrichissement.tap) && hasNum(op.enrichissement.tav) ? `TAP ${fmt(op.enrichissement.tap, 1)} → ${fmt(op.enrichissement.tav, 1)} % vol` : ''].filter(Boolean).join(' · ');
    case 'froid': return [pc(op.portionId), op.tempC != null ? `${fmt(op.tempC, 1)} °C` : '', op.jours ? `${fmt(op.jours)} j` : '', L].filter(Boolean).join(' · ');
    case 'filtration': return [pc(op.portionId), lbl(db, 'methodesFiltration', op.methodeId), L, (op.pertes || []).length ? `pertes : ${pertesText(db, op.pertes)}` : ''].filter(Boolean).join(' · ');
    case 'suivi': return [pc(op.portionId), op.motif, op.densite != null && op.densite !== '' ? `densité ${fmt(op.densite, 3)}` : '', op.tempC != null && op.tempC !== '' ? `${fmt(op.tempC, 1)} °C` : '', L].filter(Boolean).join(' · ');
    case 'sortie': return [`${fmtL(op.volL)} sortis de ${pc(op.portionId)}`, op.motif, op.destinataire ? `→ ${op.destinataire}` : '', op.ref ? `doc. ${op.ref}` : ''].filter(Boolean).join(' · ');
    case 'jaugeage': return `${pc(op.portionId)} · mesuré ${fmtL(op.volMesure)} (${lbl(db, 'typesPerte', op.typeId)})`;
    case 'assemblage': return [`${(op.sources || []).length} portion(s) → ${cn(op.destId)}`, `${fmtL(sum(op.sources, (s) => s.volL))}`, (op.pertes || []).length ? `pertes : ${pertesText(db, op.pertes)}` : '', L].filter(Boolean).join(' · ');
    case 'etape': return [`${(R.lots[op.lotId] || {}).code || ''} →`, op.newStade ? stadeLabel(db, op.newStade) : '', op.couleur ? `couleur : ${couleurLabel(db, op.couleur).toLowerCase()}` : '', op.newType ? `nature : ${LOT_TYPES[op.newType] || op.newType}` : ''].filter(Boolean).join(' ');
    case 'declassement': return `→ ${qLabel(op.qualifId)}${op.notes ? ` · ${op.notes}` : ''}`;
    case 'preparation': return [`${PREP_TYPES[op.ptype]} ${op.code}`, `${fmtL(op.volL)}`, qLabel(op.qualifId), L].filter(Boolean).join(' · ');
    case 'tirage': return [`${fmt(op.nbBouteilles)} bouteilles`, op.sucreGL != null ? `${fmt(op.sucreGL, 1)} g/L de sucre` : '', (op.prepUses || []).map((u) => prepOf(R, u.prepId).code).filter(Boolean).join(', '), L].filter(Boolean).join(' · ');
    case 'degorgement': return [`${fmt(op.nb)} bouteilles`, op.lotFiniSpec ? `→ lot fini ${op.lotFiniSpec.code}` : '', (op.prepUses || []).map((u) => prepOf(R, u.prepId).code).filter(Boolean).join(', '), L].filter(Boolean).join(' · ');
    case 'reprise': return num(op.nbBouteilles) > 0 ? `${fmt(op.nbBouteilles)} bouteilles sur lattes` : `${fmtL(op.volL)} en ${cn(op.contenantId)}`;
    default: return '';
  }
}
function opVolume(op) {
  switch (op.type) {
    case 'debourbage': case 'soutirage': case 'transfert': case 'sortie': return num(op.volL);
    case 'pressurage': return sum(op.fractions, (f) => f.volL);
    case 'assemblage': return sum(op.sources, (s) => s.volL);
    case 'jaugeage': return num(op.volMesure);
    case 'preparation': return num(op.volL);
    case 'reprise': return num(op.volL);
    case 'entree_mout': return sum(op.entrees, (e) => e.volL);
    default: return null;
  }
}
