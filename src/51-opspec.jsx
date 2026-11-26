/* ============ OPÉRATIONS : état initial des formulaires et construction des spécifications ============ */
const S_ = (x) => (x === null || x === undefined ? '' : String(x));
const err = (error) => ({ error });
const takenCode = (db, code, exceptIds) => db.lots.some((l) => norm(l.code).trim() === norm(code).trim() && !(exceptIds || []).includes(l.id));
function nextCode(db, prefix, date) {
  const yy = pad(yearOf(date) % 100); let n = db.lots.filter((l) => String(l.code).startsWith(`${prefix}${yy}-`)).length + 1;
  let c = `${prefix}${yy}-${pad(n)}`; while (takenCode(db, c)) { n += 1; c = `${prefix}${yy}-${pad(n)}`; } return c;
}
const pickPerte = (db, id) => (db.lists.typesPerte.some((x) => x.id === id) ? id : (db.lists.typesPerte[0] || {}).id);
const LGN = (l) => (l || []).map((x) => ({ produitId: x.produitId, arrivageId: x.arrivageId || '', qty: S_(x.qty) }));
const PRU = (u) => (u || []).map((x) => ({ prepId: x.prepId, volL: S_(x.volL) }));
const PRT = (p) => (p || []).map((x) => ({ typeId: x.typeId, volL: S_(x.volL) }));

// code / désignation des moûts : le suffixe suit la fraction choisie (M26-02-C → M26-02-T1)
const reSuffix = (code, from, to) => { let c = String(code || ''); if (from && c.endsWith(`-${from}`)) c = c.slice(0, -(from.length + 1)); return to ? `${c}-${to}` : c; };
// Ligne de moût reçu (compartiment de citerne) : cépage, fraction, cru, revendication, et répartition sur une ou plusieurs cuves
const moutLine = (db, cid, e) => { e = e || {}; return { numLot: e.numLot || '', apporteurs: Array.isArray(e.apporteurs) && e.apporteurs.length ? e.apporteurs.map((a) => ({ id: a.id, pct: S_(a.pct) })) : (e.apporteurId ? [{ id: e.apporteurId, pct: '' }] : []), analyses: Object.fromEntries(Object.entries(e.analyses || {}).map(([k, v]) => [k, S_(v)])), couleur: e.couleur || couleurDefaut(db), parcelleId: e.parcelleId || '', compartiment: e.compartiment || '', cepageId: e.cepageId || (db.lists.cepages[0] || {}).id || '', fractionId: e.fractionId || (fracList(db)[0] || {}).id || '', cruId: e.cruId || '', qualifId: e.qualifId || 'conv', millesime: e.millesime || '', dests: (e.dests && e.dests.length ? e.dests : [{ contenantId: cid || '', volL: '' }]).map((d) => ({ contenantId: d.contenantId || '', volL: S_(d.volL) })) }; };
// onglets partenaires du formulaire (0.34.0-alpha.1) : f.partenaires [{ id, apporteurId, ref }] ; sans liste, le partenaire et le n° de bon de l'en-tête
const moutOnglets = (f) => { const L = Array.isArray(f && f.partenaires) ? f.partenaires.filter((p) => p && p.id) : []; return L.length ? L : [{ id: 'pa1', apporteurId: (f && f.apporteurId) || '', ref: (f && f.ref) || '' }]; };
const ongletDe = (P, e) => (e && e.partId && P.some((p) => p.id === e.partId) ? e.partId : P[0].id);
const moutStockCuve = (Rd, cid) => sum(Object.values((Rd && Rd.portions) || {}).filter((p) => p.contenantId === cid), (p) => p.vol);
// contenu d'une cuve avant la destination j du moût i : stock à la date + volumes des moûts précédents de la même entrée vers cette cuve
function moutVolAvant(Rd, f, i, j) { const cid = (((f.entrees || [])[i] || {}).dests || [])[j] ? f.entrees[i].dests[j].contenantId : ''; if (!cid) return 0; let v = moutStockCuve(Rd, cid); (f.entrees || []).forEach((e, k) => (e.dests || []).forEach((d, l) => { if ((k < i || (k === i && l < j)) && d.contenantId === cid) v += num(d.volL); })); return v; }
// Plan des lots créés : un par cuve de destination (codes automatiques : préfixe + suffixe de fraction, numérotés si besoin)
function moutPlan(db, f) {
  const tanks = []; const by = {};
  (f.entrees || []).forEach((e, i) => (e.dests || []).forEach((d) => { if (!d.contenantId) return; let t = by[d.contenantId]; if (!t) { t = by[d.contenantId] = { contenantId: d.contenantId, vol: 0, parts: [] }; tanks.push(t); } t.vol += num(d.volL); t.parts.push({ e, i, vol: num(d.volL) }); }));
  const base = String(f.code || '').trim();
  tanks.forEach((t) => { t.fractions = uniq(t.parts.map((p) => p.e.fractionId).filter(Boolean)); t.qualifs = uniq(t.parts.map((p) => p.e.qualifId || 'conv')); const sfx = t.fractions.length === 1 ? ((fracDef(db, t.fractions[0]) || {}).suffix || '') : ''; t.auto = sfx && base ? `${base}-${sfx}` : base; });
  const cnt = {}; tanks.forEach((t) => { cnt[t.auto] = (cnt[t.auto] || 0) + 1; }); const seen = {};
  tanks.forEach((t) => { if (cnt[t.auto] > 1) { seen[t.auto] = (seen[t.auto] || 0) + 1; t.auto = `${t.auto}-${seen[t.auto]}`; } });
  tanks.forEach((t) => {
    const ov = (f.lotCodes || {})[t.contenantId] || {};
    t.code = String(ov.code || '').trim() || t.auto;
    const PF = moutOnglets(f); const apIds = PF.length > 1 ? uniq(t.parts.map((p) => ((p.e.apporteurs || [])[0] || {}).id || (PF.find((x) => x.id === ongletDe(PF, p.e)) || {}).apporteurId).filter(Boolean)) : (f.apporteurId ? [f.apporteurId] : []); // plusieurs partenaires (0.34.0-alpha.1)
    t.designationAuto = `Moût ${t.fractions.map((x) => fracLabel(db, x).toLowerCase()).join(' + ')}${apIds.length ? ` – ${apIds.map((id) => apporteurName(db, id)).join(' + ')}` : ''}`;
    t.designation = String(ov.designation || '').trim() || t.designationAuto; t.qualif = minQualif(t.qualifs);
  });
  return tanks;
}
function opInit(type, old, db, date) {
  const o = old || {}; const base = { date: o.date || date, notes: o.notes || '', operateurs: Array.isArray(o.operateurs) ? [...o.operateurs] : [], champs: champsEtat(o), jauges: Array.isArray(o.jauges) ? o.jauges.filter((j) => j && j.champ) : [], sousType: o.sousType || '', stade: o.stade || '', couleur: o.couleur || '', stadeManuel: !!(old && o.stade), couleurManuel: !!(old && o.couleur),
    amont: Array.isArray(o.amont) ? o.amont : [], traceExports: Array.isArray(o.traceExports) ? o.traceExports : [], // 0.27.0-alpha.1 : traçabilité amont reçue, fichiers de traçabilité exportés
    enrichissement: o.enrichissement && typeof o.enrichissement === 'object' ? o.enrichissement : null }; // 0.29.0-alpha.1 : calcul de l'enrichissement (simulateur)
  switch (type) {
    case 'apport': return { ...base, cepageId: o.cepageId || (db.lists.cepages[0] || {}).id, kg: S_(o.kg), qualifId: o.qualifId || 'conv', apporteurId: o.apporteurId || '', cruId: o.cruId || '', parcelleId: o.parcelleId || '', ref: o.ref || '', heurePesee: (o.pesee || {}).heure || '' };
    case 'entree_mout': { const codes = {}; (o.lots || []).forEach((l) => { codes[l.contenantId] = { code: l.code || '', designation: l.designation || '' }; });
      // ligne réécrite par une version antérieure : n° de lot, analyses et partenaires repris de la copie (entreesExtra)
      const lignes = (o.entrees && o.entrees.length ? o.entrees : [null]).map((e, i) => { if (!e) return e; const { cle, ...x } = ligneExtra(o, i, e); if ((x.apporteurs || []).length && e.apporteurId && x.apporteurs[0].id !== e.apporteurId) delete x.apporteurs; // partenaire changé ensuite : on garde le sien
        return { ...e, ...(e.numLot ? {} : x.numLot ? { numLot: x.numLot } : {}), ...((e.apporteurs || []).length ? {} : (x.apporteurs || []).length ? { apporteurs: x.apporteurs } : {}), ...(e.analyses && Object.keys(e.analyses).length ? {} : x.analyses ? { analyses: x.analyses } : {}) }; });
      // plusieurs partenaires dans la citerne (0.34.0-alpha.1) : un onglet chacun (partenaire, n° de bon / DAE) ; hauteurs mesurées en cuve (épalement)
      const P = moutPartenaires(o).map((p) => ({ id: p.id, apporteurId: p.apporteurId || '', ref: p.ref || '' })); const JC = Array.isArray(o.jaugesCuves) ? o.jaugesCuves.filter((x) => x && x.cle) : [];
      return { ...base, apporteurId: P[0].apporteurId, ref: P[0].ref, partenaires: P, immat: o.immat || '', millesime: o.millesime || '', code: ((o.lots || [])[0] || {}).code || '', entrees: lignes.map((e) => { const L0 = moutLine(db, '', e); const j = e && (o.jauges || []).find((x) => x && x.cle && x.cle === cleLigne(e));
        const L1 = { ...L0, partId: lignePartId(o, e, P), dests: L0.dests.map((d) => { const h = e && JC.find((x) => x.cle === cleLigne(e) && x.contenantId === d.contenantId); return h ? { ...d, hauteur: S_(h.apres) } : d; }) };
        return j ? { ...L1, creux: S_(j.apres), baremeId: j.baremeId || '' } : L1; }), lotCodes: codes }; }
    case 'pressurage': {
      const ps = o.parentSpec || {}; const frac = {};
      fracPress(db, (o.fractions || []).map((y) => y.fractionId)).forEach((fr) => { const x = (o.fractions || []).find((y) => y.fractionId === fr.id); frac[fr.id] = { volL: x ? S_(x.volL) : '', contenantId: x ? x.contenantId : '', code: x ? x.code : '' }; });
      return { ...base, equipementId: o.equipementId || 'pressoir', charges: o.charges ? o.charges.map((c) => ({ apportId: c.apportId, kg: S_(c.kg) })) : [{ apportId: '', kg: '' }], code: ps.code || '', designation: ps.designation || '', millesime: ps.millesime || '', qualifId: ps.qualifId || 'conv', frac, heureDebut: (o.marc || {}).heureDebut || '' };
    }
    case 'debourbage': case 'soutirage': case 'transfert':
      return { ...base, portionId: o.portionId || '', volL: S_(o.volL), destId: o.destId || '', pertes: old ? PRT(o.pertes) : (type === 'transfert' ? [] : [{ typeId: pickPerte(db, type === 'debourbage' ? 'bourbes' : 'lies'), volL: '' }]), lignes: LGN(o.lignes), equipementIds: o.equipementIds || [] };
    case 'intrant': return { ...base, portionId: o.portionId || '', lignes: LGN(o.lignes), prepUses: PRU(o.prepUses), motif: o.motif || '' };
    case 'suivi': return { ...base, portionId: o.portionId || '', lignes: LGN(o.lignes), prepUses: PRU(o.prepUses), motif: o.motif || '', tempC: S_(o.tempC), densite: S_(o.densite) };
    case 'sortie': return { ...base, portionId: o.portionId || '', volL: S_(o.volL), motif: o.motif || '', destinataire: o.destinataire || '', ref: o.ref || '' };
    case 'froid': return { ...base, portionId: o.portionId || '', tempC: S_(o.tempC), jours: S_(o.jours), lignes: LGN(o.lignes) };
    case 'filtration': return { ...base, portionId: o.portionId || '', methodeId: o.methodeId || (db.lists.methodesFiltration[0] || {}).id, equipementIds: o.equipementIds || [], lignes: LGN(o.lignes), pertes: PRT(o.pertes) };
    case 'jaugeage': return { ...base, portionId: o.portionId || '', volMesure: S_(o.volMesure), typeId: o.typeId || pickPerte(db, 'ecart'), hauteurMesure: S_(o.hauteurMesure), baremeId: o.baremeId || '', mesureJauge: o.mesureJauge || '' };
    case 'assemblage': { const ls = o.lotSpec || {}; return { ...base, sources: (o.sources || [{}, {}]).map((s) => ({ portionId: s.portionId || '', volL: S_(s.volL) })), destId: o.destId || '', pertes: PRT(o.pertes), lignes: LGN(o.lignes), code: ls.code || '', designation: ls.designation || '', millesime: ls.millesime || '', ltype: ls.type || 'assemblage' }; }
    case 'etape': return { ...base, lotId: o.lotId || '', newStade: o.newStade || (o.newType ? stadeFromType(o.newType) : ''), couleur: o.couleur || '', newType: o.newType || '' };
    case 'reprise': { const ls = o.lotSpec || {}; base.apporteurId = o.apporteurId || ''; const cp = {}; Object.keys(ls.cepages || {}).forEach((k) => { cp[k] = S_(ls.cepages[k]); }); const cr = Object.keys(ls.crus || {}).filter((k) => k !== '?').map((k) => ({ cruId: k, pct: S_(ls.crus[k]) })); return { ...base, crus: cr.length ? cr : [{ cruId: '', pct: '' }], echelle: ls.echelle || '', kind: num(o.nbBouteilles) > 0 ? 'bouteilles' : 'vin', contenantId: o.contenantId || '', volL: S_(o.volL), nbBouteilles: S_(o.nbBouteilles), code: ls.code || '', designation: ls.designation || '', millesime: ls.millesime || '', ltype: ls.type || 'vin_reserve', qualifId: ls.qualifId || 'conv', cepages: cp }; }
    case 'preparation': return { ...base, ptype: o.ptype || 'liqueur_tirage', qualifId: o.qualifId || 'conv', code: o.code || '', volL: S_(o.volL), sourcePortionId: o.sourcePortionId || '', sourceVolL: S_(o.sourceVolL), lignes: LGN(o.lignes) };
    case 'tirage': { const ls = o.lotSpec || {}; return { ...base, sources: (o.sources || [{}]).map((s) => ({ portionId: s.portionId || '', volL: S_(s.volL) })), prepUses: PRU(o.prepUses), lignes: LGN(o.lignes), nbBouteilles: S_(o.nbBouteilles), volBouteilleL: S_(o.volBouteilleL || db.settings.volBouteilleL), densBase: S_(o.densBase), densMix: S_(o.densMix), code: ls.code || '', designation: ls.designation || '', millesime: ls.millesime || '' }; }
    case 'degorgement': { const ls = o.lotFiniSpec || {}; return { ...base, sourceLotId: o.sourceLotId || '', nb: S_(o.nb), prepUses: PRU(o.prepUses), lignes: LGN(o.lignes), code: ls.code || '', designation: ls.designation || '', dosageGL: S_(ls.dosageGL) }; }
    default: return base;
  }
}

/* ---------- stade et couleur du vin dans les opérations ---------- */
// VIN_CREE : l'opération crée des lots (leur stade et leur couleur) ; VIN_APRES : stade du lot traité après l'opération
const VIN_CREE = ['pressurage', 'entree_mout', 'assemblage', 'tirage', 'reprise'];
const VIN_APRES = ['debourbage', 'soutirage', 'transfert', 'intrant', 'froid', 'filtration', 'suivi'];
const LEVURE_RE = /levure|levain|saccharomyces|\bLSA\b|pied de cuve/i;
const BACT_RE = /bact[ée]r|oenococcus|malolact|\bFML\b/i;
const opLot = (Rd, portionId) => { const p = portionId && Rd.portions[portionId]; return p ? Rd.lots[p.lotId] || null : null; };
function vinPropose(type, f, db, Rd) {
  const after = (lot, role, why) => { const t = stadeRole(db, role); return lot && t && stadeIdx(db, lot.stade) < stadeIdx(db, t) ? { stade: t, why } : { stade: '', why: '' }; };
  // stade automatique réglé sur le type d'opération (catalogue) : appliqué s'il fait avancer le vin
  const cat = opDef(db, f.sousType || type); const sa = cat && cat.stadeAuto && cat.stadeAuto.actif && stadeDef(db, cat.stadeAuto.stade) ? cat.stadeAuto.stade : '';
  if (sa && VIN_APRES.includes(type)) { const lot = opLot(Rd, f.portionId); if (lot && stadeAutoOK(db, lot.stade, sa)) return { stade: sa, why: `stade automatique de « ${cat.label} »` }; if (lot) return { stade: '', why: '' }; }
  if (cat && cat.stadeAuto && !cat.stadeAuto.actif && VIN_APRES.includes(type)) return { stade: '', why: '' }; // désactivé : pas de proposition
  switch (type) {
    case 'pressurage': case 'entree_mout': return { stade: stadeRole(db, 'entree') || stadeList(db)[0].id, couleur: couleurDefaut(db), why: '' };
    case 'reprise': return { stade: (f.kind === 'bouteilles' ? stadeRole(db, 'tirage') : stadeRole(db, 'clair')) || stadeList(db)[0].id, couleur: couleurDefaut(db), why: '' };
    case 'assemblage': case 'tirage': {
      const ls = (f.sources || []).map((x) => opLot(Rd, x.portionId)).filter(Boolean); const cols = uniq(ls.map((l) => l.couleur).filter(Boolean)); const c = mixCouleur(db, cols) || couleurDefaut(db);
      const sts = uniq(ls.map((l) => l.stade).filter(Boolean)); const mix = stadeMix(db, sts); const st = type === 'tirage' ? (sa || stadeRole(db, 'tirage')) : stadeAssemblage(db, sts, sa || null);
      const whyStade = type === 'tirage' || !sts.length ? '' : `${sts.length > 1 ? `mélange ${sts.map((x) => stadeCourt(db, x)).join(' + ')} = ${stadeCourt(db, mix)}` : `stade des lots : ${stadeCourt(db, mix)}`}${st && st !== mix ? `, puis stade automatique de « ${cat ? cat.label : 'Assemblage'} » (vins) : ${stadeCourt(db, st)}` : ''}`;
      return { stade: st, whyStade, couleur: c, why: cols.length > 1 ? `${cols.map((x) => couleurLabel(db, x)).join(' + ')} → ${couleurLabel(db, c)}` : '' };
    }
    case 'debourbage': return after(opLot(Rd, f.portionId), 'debourbage', 'débourbage');
    case 'intrant': {
      const lot = opLot(Rd, f.portionId); const names = (f.lignes || []).map((l) => (db.produits.find((x) => x.id === l.produitId) || {}).nom || '').join(' | ');
      const preps = (f.prepUses || []).map((u) => (Rd.preps[u.prepId] || {}).ptype);
      if (BACT_RE.test(names) || preps.includes('pied_mlf')) return after(lot, 'bacteries', 'bactéries lactiques ajoutées');
      if (LEVURE_RE.test(names) || preps.includes('levain')) return after(lot, 'levurage', 'levures ajoutées');
      return { stade: '', why: '' };
    }
    default: return { stade: '', why: '' };
  }
}
// valeurs retenues : choix de l'utilisateur s'il a modifié le champ, sinon proposition automatique
function vinChoix(type, f, db, Rd) {
  const p = vinPropose(type, f, db, Rd);
  if (VIN_CREE.includes(type)) return { p, stade: (f.stadeManuel && f.stade) || p.stade, couleur: type === 'entree_mout' ? '' : ((f.couleurManuel && f.couleur) || p.couleur) };
  if (VIN_APRES.includes(type)) { const lot = opLot(Rd, f.portionId); const st = f.stadeManuel ? (f.stade || '') : p.stade; return { p, lot, stade: lot && st === lot.stade ? '' : st, couleur: '' }; }
  return { p, stade: '', couleur: '' };
}
function buildSpec(type, f, db, Rd, old) {
  const r = buildSpec0(type, f, db, Rd, old); if (!r.spec) return r;
  if (VIN_CREE.includes(type) || VIN_APRES.includes(type)) { const v = vinChoix(type, f, db, Rd); if (v.stade) r.spec.stade = v.stade; if (v.couleur) r.spec.couleur = v.couleur; }
  if (f.sousType && f.sousType !== type) r.spec.sousType = f.sousType;
  // formulaire personnalisé (0.16.0-alpha.1) : champs rendus obligatoires, valeurs des champs personnalisés (calculs compris)
  const catId = f.sousType || type; const pb = champsErreurs(db, catId, type, f, { nouveau: !old }); if (pb) return err(pb);
  const ch = champsValeurs(formulaireDe(db, catId).perso, f.champs, formuleVarsStd(type, f), old && old.champs); if (ch.length) r.spec.champs = ch;
  // mesures de jaugeage (📏, 0.17.0-alpha.1) : gardées à part (op.jauges) — une version antérieure les conserve telles quelles
  if (type === 'entree_mout') {
    const J = []; (f.entrees || []).forEach((e) => {
      if (!hasNum(e.creux)) return; const L = baremesCiterne(db, f.immat); const b = L.find((x) => String(x.compartiment) === String(e.compartiment || '').replace(/^c/i, '').trim()) || L.find((x) => x.id === e.baremeId) || (L.length === 1 ? L[0] : null); if (!b) return;
      const m = {}; (e.dests || []).filter((d) => num(d.volL) > 0).forEach((d) => { m[d.contenantId] = (m[d.contenantId] || 0) + num(d.volL); }); const vol = r2(sum(Object.keys(m).map((k) => r2(m[k]))));
      const rv = baremeVolume(b, e.creux); J.push({ cle: cleLigne({ compartiment: String(e.compartiment || '').trim(), cepageId: e.cepageId, fractionId: e.fractionId, volL: vol }), compartiment: String(b.compartiment), immat: b.immat, mesure: 'creux', apres: num(e.creux), volL: rv ? r2(rv.v) : null, baremeId: b.id });
    });
    if (J.length) r.spec.jauges = J;
  } else if (Array.isArray(f.jauges) && f.jauges.length) r.spec.jauges = f.jauges.filter((j) => j && j.champ && hasNum(j.apres));
  // traçabilité amont (fichier de l'expéditeur) et fichiers de traçabilité exportés : gardés avec l'opération (0.27.0-alpha.1)
  if (Array.isArray(f.amont) && f.amont.length) r.spec.amont = f.amont;
  if (Array.isArray(f.traceExports) && f.traceExports.length) r.spec.traceExports = f.traceExports;
  if (type === 'intrant' && f.enrichissement && typeof f.enrichissement === 'object') r.spec.enrichissement = f.enrichissement; // TAP, TAV visé, méthode (simulateur, 0.29.0-alpha.1)
  // qui a réalisé l'opération (liste des opérateurs de la société) ; obligatoire si le réglage est activé (nouvelles opérations)
  const qui = operateursValides(db, f.operateurs);
  if (qui.length) r.spec.operateurs = qui;
  else if (!old && (db.settings || {}).operateurObligatoire) return err('Indiquez qui a réalisé l’opération (opérateur).');
  return r;
}
function buildSpec0(type, f, db, Rd, old) {
  if (!isoOK(f.date)) return err('Choisissez une date.');
  const base = { type, date: f.date, notes: f.notes || '' };
  const own = old ? opCreates(old).lots : [];
  const needPortion = () => (!f.portionId ? 'Choisissez la portion concernée.' : null);
  switch (type) {
    case 'apport':
      if (!f.cepageId) return err('Choisissez le cépage.'); if (!(num(f.kg) > 0)) return err('Indiquez le poids de raisin (kg).');
      if (f.heurePesee && !heureOK(f.heurePesee)) return err('Heure de la pesée invalide (hh:mm).');
      // registre des pesées (0.24.0-alpha.1) : n°, heure et validation gardés (l'onglet Pressoir les gère)
      return { spec: { ...base, cepageId: f.cepageId, kg: num(f.kg), qualifId: f.qualifId, apporteurId: f.apporteurId || '', cruId: f.cruId || '', parcelleId: f.parcelleId || '', ref: String(f.ref || '').trim(),
        ...(f.heurePesee || (old && old.pesee) ? { pesee: { ...((old && old.pesee) || {}), ...(f.heurePesee ? { heure: f.heurePesee } : {}) } } : {}) } };
    case 'entree_mout': {
      const lines = []; const PF = moutOnglets(f); const multi = PF.length > 1; const JC = []; const dejaCuve = {};
      for (let i = 0; i < (f.entrees || []).length; i += 1) {
        const e = f.entrees[i]; const n = i + 1; const ds = (e.dests || []).filter((d) => num(d.volL) > 0);
        if (!ds.length) continue; // ligne sans volume : ignorée
        if (ds.some((d) => !d.contenantId)) return err(`Moût ${n} : choisissez la cuve de destination de chaque volume.`);
        if (!e.cepageId) return err(`Moût ${n} : choisissez le cépage.`);
        if (!e.fractionId) return err(`Moût ${n} : choisissez la fraction (cuvée, taille, rebêche…).`);
        const m = {}; ds.forEach((d) => { m[d.contenantId] = (m[d.contenantId] || 0) + num(d.volL); });
        const dests = Object.keys(m).map((k) => ({ contenantId: k, volL: r2(m[k]) }));
        // partenaires du compartiment (plusieurs possibles) : parts en % toutes renseignées (total 100) ou aucune (parts égales)
        const aps = (e.apporteurs || []).filter((a) => a && a.id && (db.apporteurs || []).some((x) => x.id === a.id)).filter((a, k, t) => t.findIndex((y) => y.id === a.id) === k);
        const pcts = aps.map((a) => (hasNum(a.pct) ? num(a.pct) : null));
        if (pcts.some((p) => p != null) && (pcts.some((p) => p == null || p <= 0) || Math.abs(sum(pcts) - 100) > 0.5)) return err(`Moût ${n} : les parts des partenaires doivent être toutes renseignées et totaliser 100 % (ou laissez-les vides : parts égales).`);
        const an = {}; Object.keys(e.analyses || {}).forEach((k) => { if (hasNum(e.analyses[k])) an[k] = num(e.analyses[k]); });
        const numLot = String(e.numLot || '').trim(); const tab = PF.find((p) => p.id === ongletDe(PF, e)) || PF[0];
        if (!aps.length && tab.apporteurId && multi) aps.push({ id: tab.apporteurId, pct: '' }); // partenaire de l'onglet, écrit dans le moût (lu aussi par les versions antérieures)
        lines.push({ couleur: e.couleur || couleurDefaut(db), parcelleId: e.parcelleId || '', compartiment: String(e.compartiment || '').trim(), cepageId: e.cepageId, fractionId: e.fractionId, cruId: e.cruId || '', qualifId: e.qualifId || 'conv', millesime: String(e.millesime || '').trim() || String(f.millesime || '').trim() || String(yearOf(f.date)),
          apporteurId: (aps[0] || {}).id || tab.apporteurId || f.apporteurId || '', ...(aps.length ? { apporteurs: aps.map((a, k) => ({ id: a.id, ...(pcts[k] != null ? { pct: pcts[k] } : {}) })) } : {}), ...(numLot ? { numLot } : {}), ...(Object.keys(an).length ? { analyses: an } : {}), volL: r2(sum(dests, (d) => d.volL)), dests, ...(multi ? { partId: tab.id } : {}) });
        // volume mesuré en cuve à l'épalement (hauteur ou creux après réception) : gardé avec l'opération (op.jaugesCuves)
        const ln = lines[lines.length - 1];
        ds.forEach((d) => { const b = hasNum(d.hauteur) ? baremeDe(db, d.contenantId) : null; const avant = moutStockCuve(Rd, d.contenantId) + (dejaCuve[d.contenantId] || 0); dejaCuve[d.contenantId] = (dejaCuve[d.contenantId] || 0) + num(d.volL); if (!b) return; const r = jaugeEntreeCuve(b, d.hauteur, avant);
          if (r) { const x = JC.find((y) => y.cle === cleLigne(ln) && y.contenantId === d.contenantId); const m = { cle: cleLigne(ln), contenantId: d.contenantId, mesure: b.mesure === 'creux' ? 'creux' : 'hauteur', apres: num(d.hauteur), volAvant: r2(r.avant), volL: r2(r.v), baremeId: b.id }; if (x) Object.assign(x, m); else JC.push(m); } });
      }
      const nums = lines.map((l) => norm(l.numLot || '')).filter(Boolean);
      if (new Set(nums).size !== nums.length) return err('Deux moûts ont le même n° de lot : chaque compartiment reçu doit avoir son propre numéro.');
      if (!lines.length) return err('Ajoutez au moins un moût reçu : cépage, fraction, volume et cuve de destination.');
      const plan = moutPlan(db, { ...f, entrees: lines });
      if (plan.some((t) => !t.code)) return err('Indiquez le code de chaque lot créé (un par cuve).');
      const codes = plan.map((t) => t.code);
      if (new Set(codes.map((c) => norm(c).trim())).size !== codes.length) return err('Chaque cuve de destination doit recevoir un code de lot différent.');
      const tk = codes.find((c) => takenCode(db, c, own)); if (tk) return err(`Le code de lot « ${tk} » existe déjà.`);
      // onglets gardés : ceux qui ont un moût, un partenaire ou un n° de bon ; op.apporteurId et op.ref restent remplis pour les versions antérieures
      const PG = PF.filter((p, k) => k === 0 || p.apporteurId || String(p.ref || '').trim() || lines.some((l) => l.partId === p.id));
      const parts = PG.length > 1 ? { partenaires: PG.map((p) => ({ id: p.id, apporteurId: p.apporteurId || '', ref: String(p.ref || '').trim(), lignes: lines.filter((l) => l.partId === p.id).map(cleLigne) })) } : {};
      if (PG.length < 2) lines.forEach((l) => { delete l.partId; });
      const refs = uniq(PG.map((p) => String(p.ref || '').trim()).filter(Boolean));
      return { spec: { ...base, apporteurId: PG[0].apporteurId || f.apporteurId || (lines[0] || {}).apporteurId || '', ref: refs.join(' / '), immat: String(f.immat || '').trim().toUpperCase(), millesime: f.millesime || String(yearOf(f.date)), entrees: lines, lots: plan.map((t) => ({ contenantId: t.contenantId, code: t.code, designation: t.designation })),
        analyseModele: moutModeleImpose(db).id, ...parts, ...(JC.length ? { jaugesCuves: JC } : {}) } }; // modèle d'analyse imposé « Moût · Débourbage » (0.34.0-alpha.1) ; copie des compartiments (entreesExtra) : faite par opSave
    }
    case 'pressurage': {
      const charges = f.charges.filter((c) => c.apportId && num(c.kg) > 0).map((c) => ({ apportId: c.apportId, kg: num(c.kg) }));
      const code = String(f.code).trim();
      if (!charges.length) return err('Sélectionnez au moins un apport de vendange pressé.');
      if (!code) return err('Le code du lot parent (pressée) est obligatoire.');
      const fractions = Object.keys(f.frac).map((fid) => fracDef(db, fid) || { id: fid, suffix: fid }).map((fr) => ({ fractionId: fr.id, volL: num(f.frac[fr.id].volL), contenantId: f.frac[fr.id].contenantId, code: (f.frac[fr.id].code || '').trim() || `${code}-${fr.suffix}` })).filter((x) => x.volL > 0);
      if (!fractions.length) return err('Indiquez le volume d’au moins une fraction (cuvée, taille, rebêche).');
      if (fractions.some((x) => !x.contenantId)) return err('Choisissez un contenant pour chaque fraction renseignée.');
      const codes = [code, ...fractions.map((x) => x.code)];
      if (new Set(codes.map(norm)).size !== codes.length) return err('Les codes de lots de cette pressée doivent être différents.');
      const t = codes.find((c) => takenCode(db, c, own)); if (t) return err(`Le code de lot « ${t} » existe déjà.`);
      if (f.heureDebut && !heureOK(f.heureDebut)) return err('Heure du début du pressurage invalide (hh:mm).');
      return { spec: { ...base, equipementId: f.equipementId, charges, parentSpec: { code, designation: f.designation.trim() || code, millesime: f.millesime || String(yearOf(f.date)), qualifId: f.qualifId }, fractions,
        ...(f.heureDebut || (old && old.marc) ? { marc: { ...((old && old.marc) || {}), ...(f.heureDebut ? { heureDebut: f.heureDebut } : {}) } } : {}) } }; // carnet de pressoir (0.24.0-alpha.1)
    }
    case 'debourbage': case 'soutirage': case 'transfert': {
      const e = needPortion(); if (e) return err(e);
      if (!f.destId) return err('Choisissez le contenant de destination.'); if (!(num(f.volL) > 0)) return err('Indiquez le volume transféré (hL).');
      return { spec: { ...base, portionId: f.portionId, volL: num(f.volL), destId: f.destId, pertes: cleanPertes(f.pertes), lignes: cleanLignes(f.lignes), equipementIds: f.equipementIds } };
    }
    case 'intrant': {
      const e = needPortion(); if (e) return err(e);
      const lignes = cleanLignes(f.lignes), prepUses = cleanPrepUses(f.prepUses);
      if (!lignes.length && !prepUses.length) return err('Ajoutez au moins un intrant (produit + quantité) ou une préparation.');
      return { spec: { ...base, portionId: f.portionId, lignes, prepUses, motif: f.motif } };
    }
    case 'suivi': { const e = needPortion(); if (e) return err(e); return { spec: { ...base, portionId: f.portionId, lignes: cleanLignes(f.lignes), prepUses: cleanPrepUses(f.prepUses), motif: String(f.motif || '').trim(), tempC: hasNum(f.tempC) ? num(f.tempC) : null, densite: hasNum(f.densite) ? num(f.densite) : null } }; }
    case 'sortie': { const e = needPortion(); if (e) return err(e); if (!(num(f.volL) > 0)) return err('Indiquez le volume sorti (hL).'); const p = Rd.portions[f.portionId]; if (p && num(f.volL) > p.vol + 0.5) return err(`Volume supérieur au stock de la cuve (${fmtL(p.vol)}).`);
      return { spec: { ...base, portionId: f.portionId, volL: num(f.volL), motif: String(f.motif || '').trim(), destinataire: String(f.destinataire || '').trim(), ref: String(f.ref || '').trim() } }; }
    case 'froid': { const e = needPortion(); if (e) return err(e); return { spec: { ...base, portionId: f.portionId, tempC: hasNum(f.tempC) ? num(f.tempC) : null, jours: hasNum(f.jours) ? num(f.jours) : null, lignes: cleanLignes(f.lignes) } }; }
    case 'filtration': { const e = needPortion(); if (e) return err(e); return { spec: { ...base, portionId: f.portionId, methodeId: f.methodeId, equipementIds: f.equipementIds, lignes: cleanLignes(f.lignes), pertes: cleanPertes(f.pertes) } }; }
    case 'jaugeage': { const e = needPortion(); if (e) return err(e); if (!hasNum(f.volMesure) || num(f.volMesure) < 0) return err('Indiquez le volume mesuré (hL).'); return { spec: { ...base, portionId: f.portionId, volMesure: num(f.volMesure), typeId: f.typeId, ...(hasNum(f.hauteurMesure) ? { hauteurMesure: num(f.hauteurMesure), baremeId: f.baremeId || '', mesureJauge: f.mesureJauge || 'hauteur' } : {}) } }; }
    case 'assemblage': {
      const sources = f.sources.filter((s) => s.portionId && num(s.volL) > 0).map((s) => ({ portionId: s.portionId, lotId: (Rd.portions[s.portionId] || {}).lotId, volL: num(s.volL) }));
      if (sources.length < 1) return err('Sélectionnez au moins une portion source avec un volume.');
      if (sources.some((s) => !s.lotId)) return err('Une portion source n’existe plus à cette date.');
      if (!f.destId) return err('Choisissez le contenant de destination.'); const code = String(f.code).trim(); if (!code) return err('Le code du lot résultant est obligatoire.');
      if (takenCode(db, code, own)) return err(`Le code de lot « ${code} » existe déjà.`);
      return { spec: { ...base, sources, destId: f.destId, pertes: cleanPertes(f.pertes), lignes: cleanLignes(f.lignes), lotSpec: { code, designation: f.designation.trim() || code, millesime: f.millesime || String(yearOf(f.date)), type: f.ltype } } };
    }
    case 'etape': {
      if (!f.lotId) return err('Choisissez le lot.'); const lot = Rd.lots[f.lotId] || {};
      const ns = f.newStade && f.newStade !== lot.stade ? f.newStade : ''; const nc = f.couleur && f.couleur !== lot.couleur ? f.couleur : ''; const nt = f.newType && f.newType !== lot.type ? f.newType : '';
      if (!ns && !nc && !nt) return err('Choisissez un nouveau stade (ou une autre couleur, une autre nature).');
      return { spec: { ...base, lotId: f.lotId, ...(ns ? { newStade: ns } : {}), ...(nc ? { couleur: nc } : {}), ...(nt ? { newType: nt } : {}) } };
    }
    case 'reprise': {
      const code = String(f.code).trim(); if (!code) return err('Le code du lot repris est obligatoire.');
      if (takenCode(db, code, own)) return err(`Le code de lot « ${code} » existe déjà.`);
      const cepages = {}; Object.keys(f.cepages || {}).forEach((k) => { if (num(f.cepages[k]) > 0) cepages[k] = num(f.cepages[k]); });
      const crus = {}; (f.crus || []).forEach((x) => { if (x.cruId) crus[x.cruId] = (crus[x.cruId] || 0) + (num(x.pct) > 0 ? num(x.pct) : 1); });
      const lotSpec = { code, designation: f.designation.trim() || code, millesime: f.millesime || 'NV', type: f.kind === 'bouteilles' ? 'cuvee_tirage' : f.ltype, qualifId: f.qualifId, cepages, crus, echelle: Object.keys(crus).length ? '' : (f.echelle || '') };
      const vendeur = f.apporteurId && (db.apporteurs || []).some((a) => a.id === f.apporteurId) ? { apporteurId: f.apporteurId } : {};
      if (f.sousType === 'entree_vin' && !vendeur.apporteurId) return err('Choisissez le partenaire qui vend ou livre le vin.');
      if (f.kind === 'bouteilles') { if (!(num(f.nbBouteilles) > 0)) return err('Indiquez le nombre de bouteilles.'); return { spec: { ...base, nbBouteilles: num(f.nbBouteilles), volL: 0, lotSpec, ...vendeur } }; }
      if (!f.contenantId) return err('Choisissez le contenant.'); if (!(num(f.volL) > 0)) return err('Indiquez le volume (hL).');
      return { spec: { ...base, contenantId: f.contenantId, volL: num(f.volL), lotSpec, ...vendeur } };
    }
    case 'preparation': {
      const code = String(f.code).trim(); if (!code) return err('Le code de la préparation est obligatoire.'); if (!(num(f.volL) > 0)) return err('Indiquez le volume préparé (hL).');
      if (f.sourcePortionId && !(num(f.sourceVolL) > 0)) return err('Indiquez le volume de vin prélevé (ou retirez la portion source).');
      return { spec: { ...base, ptype: f.ptype, qualifId: f.qualifId, code, volL: num(f.volL), sourcePortionId: f.sourcePortionId || '', sourceVolL: f.sourcePortionId ? num(f.sourceVolL) : 0, lignes: cleanLignes(f.lignes) } };
    }
    case 'tirage': {
      const sources = f.sources.filter((s) => s.portionId && num(s.volL) > 0).map((s) => ({ portionId: s.portionId, lotId: (Rd.portions[s.portionId] || {}).lotId, volL: num(s.volL) }));
      if (!sources.length) return err('Sélectionnez le vin de base (portion + volume).'); if (sources.some((s) => !s.lotId)) return err('Une portion source n’existe plus à cette date.');
      if (!(num(f.nbBouteilles) > 0)) return err('Indiquez le nombre de bouteilles tirées.'); const code = String(f.code).trim(); if (!code) return err('Le code du lot de tirage est obligatoire.');
      if (takenCode(db, code, own)) return err(`Le code de lot « ${code} » existe déjà.`);
      const sucre = hasNum(f.densBase) && hasNum(f.densMix) ? r2((num(f.densMix) - num(f.densBase)) * 1000 * num(db.settings.coefSucre)) : null;
      return { spec: { ...base, sources, prepUses: cleanPrepUses(f.prepUses), lignes: cleanLignes(f.lignes), nbBouteilles: num(f.nbBouteilles), volBouteilleL: num(f.volBouteilleL) || 0.75, densBase: hasNum(f.densBase) ? num(f.densBase) : null, densMix: hasNum(f.densMix) ? num(f.densMix) : null, sucreGL: sucre, lotSpec: { code, designation: f.designation.trim() || code, millesime: f.millesime || String(yearOf(f.date)) } } };
    }
    case 'degorgement': {
      if (!f.sourceLotId) return err('Choisissez le lot de tirage à dégorger.'); if (!(num(f.nb) > 0)) return err('Indiquez le nombre de bouteilles dégorgées.');
      const code = String(f.code).trim(); if (!code) return err('Le code du lot fini est obligatoire.');
      if ((db.lotsFinis || []).some((x) => norm(x.code) === norm(code) && !(old && x.id === old.lotFiniId))) return err(`Le code de lot fini « ${code} » existe déjà.`);
      return { spec: { ...base, sourceLotId: f.sourceLotId, nb: num(f.nb), prepUses: cleanPrepUses(f.prepUses), lignes: cleanLignes(f.lignes), lotFiniSpec: { code, designation: f.designation.trim() || code, dosageGL: hasNum(f.dosageGL) ? num(f.dosageGL) : null } } };
    }
    default: return err('Type d’opération inconnu.');
  }
}
