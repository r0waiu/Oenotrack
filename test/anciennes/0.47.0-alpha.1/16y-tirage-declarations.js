/* ============ TIRAGE — DÉCLARATIONS ET IMPRESSIONS (0.42.0-alpha.4) ============
   - db.declarationsTirage = [{ id, type: 'prealable' | 'finale', chantierId, opIds [ids des tirages déclarés], date (de la déclaration),
     champs { … }, statut: 'brouillon' | 'deposee', deposeLe, reference, instantane (déclaration figée au dépôt), par, le, maj }]
   - déclaration préalable de tirage (formulaire de l'AIDAC, au moins 48 h avant le tirage, en 3 exemplaires : AIDAC, recette des
     douanes, registre) : volumes prévisionnels de vin, de sucre et total à tirer calculés par le profil de tirage (à vérifier)
   - déclaration de fin de tirage et de revendication (saisie en ligne Innov OI depuis 2024) : volumes effectivement mis en œuvre (vins,
     sucres et liqueurs, total tiré), VRTP distinct, puis lot par lot dans l'ordre de la saisie : produit, millésimé, cuvée, flacons par
     format, revendications particulières (cru, monocépage, tirage à façon…) ; ventilation par revendication, échelle des crus, couleur */

const DECL_TIRAGE_TYPES = [{ id: 'prealable', label: 'Déclaration préalable de tirage' }, { id: 'finale', label: 'Déclaration de fin de tirage et de revendication' }];
const DECL_STATUTS_DECLARANT = [{ id: 'recoltant', label: 'Récoltant' }, { id: 'cooperative', label: 'Coopérative' }, { id: 'negociant', label: 'Négociant' }];
const DECL_FACON = [{ id: '', label: 'Vins appartenant au déclarant' }, { id: 'recoltant', label: 'Tirage à façon : vins d’un récoltant' }, { id: 'negociant', label: 'Tirage à façon : vins d’un négociant' }, { id: 'caf_ind', label: 'CAF individuelle' }, { id: 'caf_coll', label: 'CAF collective' }];
const DECL_PREALABLE_DELAI_H = 48; // au moins 48 heures avant le tirage (cahier des charges de l'AOC Champagne, obligations déclaratives)
const DECL_FORMATS_COLONNES = ['demie', 'bouteille', 'magnum']; // colonnes du formulaire ; les autres formats vont dans « autres »
const declarationsTirage = (db) => (Array.isArray(db && db.declarationsTirage) ? db.declarationsTirage.filter((d) => d && d.id) : []);
const declarationTirage = (db, id) => declarationsTirage(db).find((d) => d.id === id) || null;

// déclarant : société, n° EVV (CVI), accise, ressortissant CIVC (réglages de la DRM), repris et modifiables dans la déclaration
function declDeclarant(db) {
  const e = db.entreprise || {}; const d = typeof drmReglage === 'function' ? drmReglage(db) : {}; const s = (db.settings && db.settings.declarationTirage) || {};
  return { nom: e.nom || '', adresse: e.adresse || '', evv: d.cvi || '', accise: d.accise || '', civc: d.civc || '', codeRecoltant: s.codeRecoltant || '', statut: s.statut || 'recoltant', lieuTirage: s.lieuTirage || '', lieuStockage: s.lieuStockage || '', signataire: s.signataire || '', faitA: s.faitA || '' };
}

/* ---------- déclaration préalable ---------- */
// volumes prévisionnels (hL) d'après le vin de base prévu et le point de tirage de la cuvée
function declPrealableCalcul(db, c) {
  const vinHL = num(c.vinHL); if (!(vinHL > 0)) return fail('Indiquez le volume prévisionnel de vin de base (hL).');
  if (!hasNum(c.pointGL)) return fail('Indiquez le point de tirage de la cuvée (g/L).');
  const p = { ...tirageProfil(db), pointGL: num(c.pointGL) }; const k = tirageCalcul({ mode: 'vin', vinL: vinHL * 100 }, p); if (!k.ok) return k;
  const sucreHL = k.sucreKg * num(p.volSucreLkg) / 100; // volume occupé par le sucre (augmentation de volume du saccharose)
  return okr({ vinHL: (k.vinL + k.vinLevainL) / 100, sucreKg: k.sucreKg, sucreHL, liqueurHL: k.liqueurTotaleL / 100, totalHL: k.mixL / 100, vrtpHL: k.vrtpL / 100, vrtpPct: k.vrtpPct, eqBouteilles: k.utileL / 0.75, alertes: k.alertes || [] });
}
const declDelaiHeures = (date, dateTirage) => (isoOK(date) && isoOK(dateTirage) ? (new Date(`${dateTirage}T00:00:00Z`) - new Date(`${date}T00:00:00Z`)) / 36e5 : null);

/* ---------- déclaration de fin de tirage ---------- */
const declTirageOps = (db, d) => { const ids = Array.isArray(d.opIds) && d.opIds.length ? d.opIds : (d.chantierId ? chantierTirages(db, d.chantierId).map((o) => o.id) : []); return ids.map((id) => (db.ops || []).find((o) => o.id === id && o.type === 'tirage')).filter(Boolean).sort(byDate); };
// revendications particulières proposées pour un lot : cru (si tout le lot), monocépage, revendication (bio…), tirage à façon
function declRevendicationsLot(db, R, lotId, champs) {
  const out = []; const lot = (R.lots || {})[lotId] || lotById(db, lotId) || {}; const comp = R.lots && R.lots[lotId] ? composition(db, R, lotId) : null;
  if (comp) out.push(...cuveeMentionsComp(db, comp, lot.couleur));
  if (lot.qualif && lot.qualif !== 'conv') out.push(qLabel(lot.qualif));
  const fa = (champs || {}).facon; if (fa && fa !== '') out.push(`${fa === 'caf_ind' ? 'CAF individuelle' : fa === 'caf_coll' ? 'CAF collective' : 'TAF'} de vins appartenant à ${(champs.proprietaire || '').trim() || '…'}`);
  return out;
}
// lot par lot, dans l'ordre de la saisie en ligne : produit, millésimé, cuvée, flacons par format, revendications particulières
function declFinaleLots(db, R, d) {
  const ch = d.champs || {}; const pers = ch.lots || {};
  return declTirageOps(db, d).map((o) => {
    const lot = (R.lots || {})[o.lotId] || lotById(db, o.lotId) || {}; const F = tirageFormatsDe(o); const p = pers[o.id] || {};
    const col = {}; DECL_FORMATS_COLONNES.forEach((k) => { col[k] = sum(F.filter((f) => f.format === k), (f) => num(f.nb)); });
    const autres = F.filter((f) => !DECL_FORMATS_COLONNES.includes(f.format) && num(f.nb) > 0).map((f) => ({ format: f.format, label: (tirageFormat(f.format) || { label: f.format }).label, nb: num(f.nb) }));
    const mill = lot.millesime && /^\d{4}$/.test(String(lot.millesime)) ? String(lot.millesime) : '';
    const b = tirageBilan(db, R, { ...o, formats: F });
    // 0.44.0-alpha.1 : lot tiré depuis une cuvée prévue du chantier → nom, couleur, revendication et mentions de la cuvée
    const cv = o.cuveeId && o.chantierId ? chantierCuvee(db, o.chantierId, o.cuveeId) : null; const ce = cv ? cuveeEffective(db, R, cv) : null;
    const couleur = (ce && ce.couleur) || lot.couleur || ''; const qualif = lot.qualif || (ce && ce.qualif) || '';
    const revAuto = ce ? [...ce.mentions, ...declRevendicationsLot(db, R, o.lotId, ch).filter((m) => /^(TAF|CAF)/.test(m))].join(' – ') : declRevendicationsLot(db, R, o.lotId, ch).join(' – ');
    return { opId: o.id, lotId: o.lotId, cuveeId: o.cuveeId || '', code: lot.code || (o.lotSpec || {}).code || '', date: o.date, produit: p.produit || (couleur === 'rose' ? 'Champagne rosé' : 'Champagne'), millesime: p.millesime !== undefined ? p.millesime : (mill || (ce && ce.millesime) || ''),
      cuvee: p.cuvee !== undefined ? p.cuvee : ((cv && cv.nom) || lot.designation || (o.lotSpec || {}).designation || ''), formats: F, colonnes: col, autres, nbCols: sum(F, (f) => num(f.nb)), eqBouteilles: tirageEqBouteilles(F),
      revendications: p.revendications !== undefined ? p.revendications : revAuto, qualif, couleur, echelle: ce && ce.echelle ? ce.echelle : R.lots && R.lots[o.lotId] ? echelleInfo(composition(db, R, o.lotId)).id || '' : '', bilan: b, casse: num(o.casse) };
  });
}
// volumes effectivement mis en œuvre, VRTP distinct, ventilations
function declFinaleCalcul(db, R, d) {
  const L = declFinaleLots(db, R, d); const t = (k) => sum(L, (l) => l.bilan[k]);
  const vinL = t('vinL'); const liqL = t('liqueurL'); const tireL = t('tireL'); const vrtpL = t('vrtpL'); const eauL = t('eauL');
  const vent = (cle, lab) => { const m = {}; L.forEach((l) => { const k = l[cle] || '?'; const x = (m[k] = m[k] || { cle: k, label: lab(k), nbCols: 0, eqBouteilles: 0, tireL: 0 }); x.nbCols += l.nbCols; x.eqBouteilles += l.eqBouteilles; x.tireL += l.bilan.tireL; }); return Object.values(m).sort((a, b) => b.tireL - a.tireL); };
  const alertes = []; const vrtpPct = vinL > 0 ? vrtpL / vinL * 100 : 0;
  if (vrtpPct > TIRAGE_VRTP_MAX_PCT + 1e-9) alertes.push(`VRTP ${fmt(vrtpPct, 2)} % : au-delà de ${TIRAGE_VRTP_MAX_PCT} % des volumes mis en œuvre.`);
  if (L.some((l) => l.bilan.compoIncomplete)) alertes.push('Composition d’un levain non saisie : le VRTP est surestimé.');
  if (!L.length) alertes.push('Aucun lot de tirage dans cette déclaration.');
  return { lots: L, vinHL: vinL / 100, liqueurHL: liqL / 100, totalHL: tireL / 100, vrtpHL: vrtpL / 100, vrtpPct, eauHL: eauL / 100, nbCols: sum(L, (l) => l.nbCols), eqBouteilles: sum(L, (l) => l.eqBouteilles), casse: sum(L, (l) => l.casse), dateFin: L.length ? L[L.length - 1].date : '', dateDebut: L.length ? L[0].date : '',
    parRevendication: vent('qualif', (k) => qLabel(k)), parEchelle: vent('echelle', (k) => (eDef(k) || { label: 'Non précisée' }).label), parCouleur: vent('couleur', (k) => couleurLabel(db, k === '?' ? '' : k)), alertes };
}
// lignes CSV dans l'ordre de la saisie en ligne (une ligne par lot), puis les totaux
function declFinaleCsv(db, R, d) {
  const c = d.instantane && d.instantane.calcul ? d.instantane.calcul : declFinaleCalcul(db, R, d);
  const autresF = uniq(c.lots.flatMap((l) => l.autres.map((a) => a.format)));
  const tete = ['Lot', 'Date de tirage', 'Produit', 'Couleur', 'Revendication', 'Échelle des crus', 'Millésime', 'Cuvée', 'Demies', 'Bouteilles', 'Magnums', ...autresF.map((f) => (tirageFormat(f) || { label: f }).label), 'Total cols', 'Équivalent bouteilles', 'Revendications particulières', 'Volume tiré (hL)', 'Vin (hL)', 'Sucres et liqueurs (hL)', 'VRTP (hL)'];
  const n = (v, k) => fmt(v, k).replace(/\s/g, '');
  const lignes = c.lots.map((l) => [l.code, l.date, l.produit, couleurLabel(db, l.couleur), l.qualif ? qLabel(l.qualif) : '', l.echelle ? (eDef(l.echelle) || { label: l.echelle }).label : '', l.millesime || 'non millésimé', l.cuvee, l.colonnes.demie, l.colonnes.bouteille, l.colonnes.magnum, ...autresF.map((f) => sum(l.autres.filter((a) => a.format === f), (a) => a.nb)), l.nbCols, n(l.eqBouteilles, 0), l.revendications, n(l.bilan.tireL / 100, 4), n(l.bilan.vinL / 100, 4), n(l.bilan.liqueurL / 100, 4), n(l.bilan.vrtpL / 100, 4)]);
  lignes.push(['TOTAL', c.dateFin, '', '', '', '', '', '', sum(c.lots, (l) => l.colonnes.demie), sum(c.lots, (l) => l.colonnes.bouteille), sum(c.lots, (l) => l.colonnes.magnum), ...autresF.map((f) => sum(c.lots, (l) => sum(l.autres.filter((a) => a.format === f), (a) => a.nb))), c.nbCols, n(c.eqBouteilles, 0), '', n(c.totalHL, 4), n(c.vinHL, 4), n(c.liqueurHL, 4), n(c.vrtpHL, 4)]);
  return [tete, ...lignes];
}

/* ---------- enregistrement, dépôt ---------- */
function declarationTirageSave(db, s, id, uid) {
  const old = id ? declarationTirage(db, id) : null; if (id && !old) return fail('Déclaration introuvable.');
  if (old && old.statut === 'deposee') return fail('Déclaration déposée : rouvrez-la pour la modifier.');
  const type = DECL_TIRAGE_TYPES.some((t) => t.id === s.type) ? s.type : (old ? old.type : 'finale');
  if (!isoOK(s.date)) return fail('Date de la déclaration invalide.'); if (isLocked(db, s.date)) return fail('Cette date appartient à une campagne figée.');
  if (s.chantierId && !chantierTirage(db, s.chantierId)) return fail('Chantier introuvable.');
  const opIds = uniq((s.opIds || []).filter((x) => (db.ops || []).some((o) => o.id === x && o.type === 'tirage')));
  if (type === 'finale' && !s.chantierId && !opIds.length) return fail('Choisissez le chantier ou les lots de tirage déclarés.');
  const champs = JSON.parse(JSON.stringify(s.champs || {}));
  if (type === 'prealable' && champs.dateTirage && !isoOK(champs.dateTirage)) return fail('Date du tirage invalide.');
  if (!Array.isArray(db.declarationsTirage)) db.declarationsTirage = [];
  const x = { ...(old || {}), id: old ? old.id : nid(db, 'dct'), type, chantierId: s.chantierId || '', opIds, date: s.date, champs, statut: 'brouillon', maj: new Date().toISOString(), ...(old ? {} : { par: uid || '', le: new Date().toISOString() }) };
  if (old) db.declarationsTirage[db.declarationsTirage.indexOf(old)] = x; else db.declarationsTirage.push(x);
  return okr({ id: x.id });
}
// dépôt : la déclaration est figée telle qu'elle a été envoyée (calcul compris) ; référence de l'accusé (DREV…) gardée
function declarationTirageDeposer(db, R, id, s, uid) {
  const d = declarationTirage(db, id); if (!d) return fail('Déclaration introuvable.'); if (d.statut === 'deposee') return fail('Déclaration déjà déposée.');
  if (!isoOK(s.deposeLe)) return fail('Date du dépôt invalide.');
  // 0.44.0-alpha.1 : préalable d'un chantier dont les cuvées sont prévues → une ligne par cuvée (toutes complètes : volume et point de tirage)
  const pc = d.type === 'prealable' && d.chantierId ? declPrealableCuvees(db, R, d.chantierId) : null;
  if (pc && pc.incompletes.length) return fail(`Cuvées prévues incomplètes (volume de vin ou point de tirage) : ${pc.incompletes.join(', ')}.`);
  const calcul = pc ? okr({ ...pc, parCuvee: true }) : d.type === 'prealable' ? declPrealableCalcul(db, d.champs || {}) : declFinaleCalcul(db, R, d); if (d.type === 'prealable' && !calcul.ok) return calcul;
  if (d.type === 'finale' && !calcul.lots.length) return fail('Aucun lot de tirage dans cette déclaration.');
  const { ok, ...c } = calcul; // eslint-disable-line no-unused-vars
  d.instantane = { calcul: JSON.parse(JSON.stringify(c)), declarant: { ...declDeclarant(db), ...((d.champs || {}).declarant || {}) }, le: new Date().toISOString() };
  d.statut = 'deposee'; d.deposeLe = s.deposeLe; d.reference = String(s.reference || '').trim().slice(0, 80); d.deposePar = uid || ''; d.maj = new Date().toISOString(); return okr();
}
function declarationTirageRouvrir(db, id, motif, uid) {
  const d = declarationTirage(db, id); if (!d) return fail('Déclaration introuvable.'); if (d.statut !== 'deposee') return fail('Déclaration non déposée.');
  if (!String(motif || '').trim()) return fail('Indiquez le motif de la réouverture (déclaration rectificative).');
  d.historique = [...(d.historique || []), { deposeLe: d.deposeLe, reference: d.reference || '', instantane: d.instantane, rouvertLe: new Date().toISOString(), par: uid || '', motif: String(motif).trim() }];
  d.statut = 'brouillon'; delete d.instantane; d.maj = new Date().toISOString(); return okr();
}
function declarationTirageDelete(db, id) {
  const d = declarationTirage(db, id); if (!d) return fail('Déclaration introuvable.'); if (d.statut === 'deposee' || (d.historique || []).length) return fail('Une déclaration déposée se garde : rouvrez-la pour la rectifier.');
  if (isLocked(db, d.date)) return fail('Cette déclaration appartient à une campagne figée.');
  db.declarationsTirage = declarationsTirage(db).filter((x) => x.id !== id); return okr();
}
// réglages communs repris d'une déclaration à l'autre (code récoltant, statut, lieux, signataire)
function declarationTirageReglagesSet(db, s) {
  if (!db.settings) db.settings = {}; const x = {}; ['codeRecoltant', 'statut', 'lieuTirage', 'lieuStockage', 'signataire', 'faitA'].forEach((k) => { if (s[k] !== undefined) x[k] = String(s[k] || '').trim().slice(0, 200); });
  db.settings.declarationTirage = { ...(db.settings.declarationTirage || {}), ...x }; return okr();
}
// tirages de la campagne pas encore couverts par une déclaration de fin de tirage
function tiragesNonDeclares(db, camp) {
  const pris = new Set(); declarationsTirage(db).filter((d) => d.type === 'finale').forEach((d) => declTirageOps(db, d).forEach((o) => pris.add(o.id)));
  return (db.ops || []).filter((o) => o && o.type === 'tirage' && !pris.has(o.id) && (!camp || (o.date >= camp.debut && o.date <= camp.fin))).sort(byDate);
}

/* ---------- ordre de tirage (avant le chantier) ---------- */
// par lot : vin (cuves, volumes), préparations, formats, point de tirage, mode, fournitures et consignes de la pompe
function ordreTirage(db, R, chantierId) {
  const ch = chantierTirage(db, chantierId); if (!ch) return null;
  const lots = chantierTirages(db, chantierId).map((o) => {
    const lot = (R.lots || {})[o.lotId] || lotById(db, o.lotId) || {};
    const sources = (o.sources || []).map((s) => { const ps = ((R.lots || {})[s.lotId]) || lotById(db, s.lotId) || {}; return { code: ps.code || '', volL: num(s.volL), mixtion: !!ps.mixtion }; });
    const preps = (o.prepUses || []).map((u) => { const p = (R.preps || {})[u.prepId] || {}; return { code: p.code || '', ptype: p.ptype || '', volL: num(u.volL) }; });
    const fo = tirageFournituresDe(db, o).map((x) => { const a = (db.arrivages || []).find((y) => y.id === x.arrivageId) || {}; const p = ((db.produits || []).find((y) => y.id === x.produitId)) || {}; return { nom: p.nom || '', numLot: a.numLot || '', qty: num(x.qty), unite: p.unite || '' }; });
    return { opId: o.id, code: lot.code || (o.lotSpec || {}).code || '', designation: lot.designation || '', date: o.date, mode: o.mode || '', pointGL: o.pointGL, formats: tirageFormatsDe(o), sources, preps, fournitures: fo, pompe: o.pompe || null, lignes: (o.lignes || []).filter((l) => !l.fourniture).map((l) => ({ nom: ((db.produits || []).find((p) => p.id === l.produitId) || {}).nom || '', qty: num(l.qty), unite: ((db.produits || []).find((p) => p.id === l.produitId) || {}).unite || '', numLot: ((db.arrivages || []).find((a) => a.id === l.arrivageId) || {}).numLot || '' })) };
  });
  return { chantier: ch, lots, bilan: chantierBilan(db, R, chantierId) };
}
