/* ============ FICHIER DE TRAÇABILITÉ DES EXPÉDITIONS (0.27.0-alpha.1) ============
   Expédition de moût ou de vin vers un partenaire (sortie de cave, sauf perte) : l'expéditeur exporte un fichier de données
   (JSON « oenotrack-tracabilite ») avec la traçabilité du produit ; il choisit ce qu'il partage (discrétion) — produit et expédition
   toujours ; expéditeur, composition, crus, apporteurs, parcelles, intrants, analyses, historique, noms des cuves, traçabilité amont
   au choix ; jamais les opérateurs ni les volumes des autres lots. Empreinte SHA-256 : le receveur sait si le fichier a été modifié.
   Le receveur dépose le fichier dans son entrée de moût ou de vin : le formulaire est prérempli (partenaire, désignation, millésime,
   revendication, cépages, crus, fraction, n° de lot, analyses, volume) et la traçabilité d'avant la réception est gardée avec
   l'opération (op.amont), affichée dans le journal et sur la fiche des lots qui en descendent. */
const TRACE_FORMAT = 'oenotrack-tracabilite'; const TRACE_VERSION = 1;
const TRACE_SECTIONS = [
  { id: 'expediteur', label: 'Expéditeur : raison sociale et adresse', defaut: true },
  { id: 'composition', label: 'Composition : cépages, millésimes, fractions, revendications', defaut: true },
  { id: 'crus', label: 'Origine : crus (villages) et échelle des crus', defaut: true },
  { id: 'apporteurs', label: 'Apporteurs et partenaires d’origine (noms et parts)', defaut: false },
  { id: 'parcelles', label: 'Parcelles d’origine', defaut: false },
  { id: 'intrants', label: 'Intrants : produits, quantités, n° de lot, allergènes', defaut: true },
  { id: 'analyses', label: 'Analyses du lot et de ses origines', defaut: true },
  { id: 'historique', label: 'Historique des opérations (dates et types)', defaut: true },
  { id: 'contenants', label: 'Noms des cuves dans l’historique', defaut: false },
  { id: 'amont', label: 'Traçabilité amont reçue de vos propres fournisseurs', defaut: true },
];
const traceSectionsDefaut = () => TRACE_SECTIONS.filter((s) => s.defaut).map((s) => s.id);
const traceOpOk = (op) => !!op && op.type === 'sortie' && (op.sousType || '') !== 'perte';
// lot expédié : celui de la portion au moment de la sortie (flux du moteur)
function traceSortieLot(R, op) { const f = (R.flows || []).find((x) => x.opId === op.id && x.kind === 'sortie'); return f ? f.lotId : (((R.pinfo || {})[op.portionId] || (R.portions || {})[op.portionId] || {}).lotId || ''); }
// empreinte : SHA-256 du contenu (clés triées), sans l'empreinte elle-même
const traceCanon = (x) => (Array.isArray(x) ? `[${x.map(traceCanon).join(',')}]` : x && typeof x === 'object' ? `{${Object.keys(x).filter((k) => k !== 'empreinte').sort().map((k) => `${JSON.stringify(k)}:${traceCanon(x[k])}`).join(',')}}` : JSON.stringify(x === undefined ? null : x));
const traceEmpreinte = (d) => sha256Hex(traceCanon(d));
const tracePct = (m, nomDe) => Object.keys(m || {}).map((k) => ({ nom: nomDe(k), pct: Math.round(num(m[k]) * 1000) / 10 })).filter((x) => x.pct > 0).sort((a, b) => b.pct - a.pct);
function traceOpConts(op, R) {
  const ids = new Set(); const P = (pid) => { const pi = pid && (R.pinfo || {})[pid]; if (pi) ids.add(pi.contenantId); };
  P(op.portionId); P(op.sourcePortionId); (op.sources || []).forEach((s) => P(s.portionId));
  if (op.destId) ids.add(op.destId); if (op.contenantId) ids.add(op.contenantId); (op.fractions || []).forEach((f) => num(f.volL) > 0 && ids.add(f.contenantId)); (op.lots || []).forEach((l) => l.contenantId && ids.add(l.contenantId));
  return [...ids].filter(Boolean);
}
// traçabilité amont gardée avec les opérations qui ont créé un lot et ses origines : [{ lotId, code, rec }]
function traceAmontDuLot(db, lotId) {
  const out = []; const vus = new Set();
  [lotId, ...ancestors(db, lotId)].forEach((id) => { const l = lotById(db, id); const op = l && l.opId ? db.ops.find((o) => o.id === l.opId) : null; (op && Array.isArray(op.amont) ? op.amont : []).forEach((rec) => { if (rec && !vus.has(rec.id || rec.empreinte)) { vus.add(rec.id || rec.empreinte); out.push({ lotId: id, code: l.code, opId: op.id, rec }); } }); });
  return out;
}

/* ---------- export (expéditeur) ---------- */
function traceExport(db, opId, sections0, opts) {
  const o = opts || {}; const op = db.ops.find((x) => x.id === opId); if (!traceOpOk(op)) return fail('Expédition introuvable (sortie de cave vers un partenaire).');
  const S = new Set((sections0 || traceSectionsDefaut()).filter((s) => TRACE_SECTIONS.some((x) => x.id === s)));
  const R = getR(db, op.date); const lotId = traceSortieLot(R, op); const lot = R.lots[lotId] || lotById(db, lotId); if (!lot) return fail('Lot expédié introuvable.');
  const vol = Math.abs(sum((R.flows || []).filter((f) => f.opId === op.id && f.kind === 'sortie'), (f) => f.L)) || num(op.volL);
  const st = stadeDef(db, lot.stade); const nature = st && st.phase === 'mout' ? 'mout' : st && st.phase === 'bout' ? 'bouteilles' : 'vin';
  const d = { format: TRACE_FORMAT, formatVersion: TRACE_VERSION, app: APP_ID, appVersion: APP_VERSION, exporteLe: o.maintenant || new Date().toISOString(), sections: TRACE_SECTIONS.map((s) => s.id).filter((s) => S.has(s)),
    expedition: { date: op.date, volumeL: r2(vol), ref: String(op.ref || ''), motif: String(op.motif || ''), destinataire: String(op.destinataire || ''), operation: opNom(op) },
    produit: { lot: lot.code || '', designation: lot.designation || '', nature, type: LOT_TYPES[lot.type] || '', stade: lot.stade ? stadeLabel(db, lot.stade) : '', couleur: lot.couleur ? couleurLabel(db, lot.couleur) : '', millesime: String(lot.millesime || ''), revendication: qLabel(lot.qualif) } };
  if (S.has('expediteur')) { const e = db.entreprise || {}; d.expediteur = { nom: String(e.nom || ''), adresse: String(e.adresse || '') }; }
  const comp = composition(db, R, lotId);
  if (S.has('composition')) d.composition = { cepages: tracePct(comp.cepages, (k) => lbl(db, 'cepages', k)), millesimes: tracePct(comp.millesimes, (k) => String(k)), fractions: tracePct(comp.fractions, (k) => fracLabel(db, k)), revendications: tracePct(comp.qualifs, (k) => qLabel(k)) };
  if (S.has('crus')) d.crus = { crus: tracePct(comp.crus, (k) => (k === '?' ? 'non renseigné' : cruName(db, k))), echelles: tracePct(comp.echelles, (k) => eLabel(k)) };
  if (S.has('apporteurs')) d.apporteurs = tracePct(comp.apporteurs, (k) => (k === '?' ? 'non renseigné' : apporteurName(db, k)));
  if (S.has('parcelles')) d.parcelles = tracePct(comp.parcelles, (k) => parcelleName(db, k));
  const lignee = [lotId, ...ancestors(db, lotId)];
  if (S.has('intrants')) d.intrants = intrantsForLots(db, R, [lotId], true).map((r) => { const p = (db.produits || []).find((x) => x.id === r.produitId) || {}; return { produit: String(p.nom || ''), quantite: r2(r.qty), unite: String(r.unite || ''), lotFournisseur: String(r.numLot || ''), allergenes: String(p.allergenes || ''), ...(r.direct ? { surCeLot: true } : {}) }; });
  if (S.has('analyses')) { const P = (k) => (db.analysesParams || []).find((p) => p.id === k) || { nom: k, unite: '' }; d.analyses = (db.analyses || []).filter((a) => lignee.includes(a.lotId) && a.date <= op.date).sort(byDate).reverse().slice(0, 40).map((a) => ({ date: a.date, lot: ((R.lots[a.lotId] || lotById(db, a.lotId)) || {}).code || '', valeurs: Object.keys(a.valeurs || {}).map((k) => ({ nom: P(k).nom, valeur: a.valeurs[k], unite: P(k).unite || '' })) })); }
  if (S.has('historique')) {
    const ids = uniq(lignee.flatMap((l) => (R.opsByLot || {})[l] || [])); const C = S.has('contenants');
    d.historique = ids.map((i) => db.ops.find((x) => x.id === i)).filter((x) => x && x.date <= op.date && x.id !== op.id).sort(byDate).slice(-400).map((x) => ({ date: x.date, operation: opNom(x), lots: uniq([x.lotId, x.parentLotId, x.sourceLotId, ...((x.lots || []).map((l) => l.lotId))].filter((l) => l && lignee.includes(l))).map((l) => ((R.lots[l] || lotById(db, l)) || {}).code || ''), ...(C ? { contenants: traceOpConts(x, R).map((c) => (db.contenants.find((y) => y.id === c) || {}).nom || '').filter(Boolean) } : {}) }));
  }
  if (S.has('amont')) { const A = traceAmontDuLot(db, lotId).map((x) => x.rec); if (A.length) d.amont = A.slice(0, 20).map((r) => { const { id, recuLe, fichier, integre, ...reste } = r; return reste; }); }
  d.empreinte = traceEmpreinte(d);
  return okr({ data: d, lotId, nom: `tracabilite-${slug(lot.code) || 'lot'}-${op.date}.json` });
}
// export noté sur l'expédition (date, sections partagées, empreinte du fichier)
function traceExportNoter(db, opId, e) { const op = db.ops.find((x) => x.id === opId); if (!op) return fail('Expédition introuvable.'); op.traceExports = [...(Array.isArray(op.traceExports) ? op.traceExports : []), { le: e.le || new Date().toISOString(), sections: (e.sections || []).slice(0, 20), empreinte: String(e.empreinte || '').slice(0, 64) }].slice(-20); return okr(); }

/* ---------- lecture (receveur) : seules les données attendues sont reprises, nettoyées ---------- */
const traceTxt = (v, n) => (typeof v === 'string' || typeof v === 'number' ? String(v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, n || 200) : '');
const traceNb = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && bulletinNombre(v) ? bulletinNombre(v).v : null);
const tracePcts = (L) => (Array.isArray(L) ? L.slice(0, 60).map((x) => (x && typeof x === 'object' ? { nom: traceTxt(x.nom, 80), pct: Math.max(0, Math.min(100, traceNb(x.pct) || 0)) } : null)).filter((x) => x && x.nom) : []);
function traceNettoyer(d, prof) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null; const p = prof || 0;
  const E = d.expedition && typeof d.expedition === 'object' ? d.expedition : {}; const P = d.produit && typeof d.produit === 'object' ? d.produit : {};
  const out = { format: TRACE_FORMAT, formatVersion: traceNb(d.formatVersion) || 1, appVersion: traceTxt(d.appVersion, 40), exporteLe: traceTxt(d.exporteLe, 40), sections: (Array.isArray(d.sections) ? d.sections : []).map((s) => traceTxt(s, 30)).filter(Boolean).slice(0, 20),
    expedition: { date: isoOK(E.date) ? E.date : '', volumeL: traceNb(E.volumeL), ref: traceTxt(E.ref, 80), motif: traceTxt(E.motif, 120), destinataire: traceTxt(E.destinataire, 160), operation: traceTxt(E.operation, 80) },
    produit: { lot: traceTxt(P.lot, 60), designation: traceTxt(P.designation, 160), nature: ['mout', 'vin', 'bouteilles'].includes(P.nature) ? P.nature : 'vin', type: traceTxt(P.type, 60), stade: traceTxt(P.stade, 80), couleur: traceTxt(P.couleur, 60), millesime: traceTxt(P.millesime, 12), revendication: traceTxt(P.revendication, 60) } };
  if (d.expediteur && typeof d.expediteur === 'object') out.expediteur = { nom: traceTxt(d.expediteur.nom, 160), adresse: traceTxt(d.expediteur.adresse, 600) };
  if (d.composition && typeof d.composition === 'object') out.composition = { cepages: tracePcts(d.composition.cepages), millesimes: tracePcts(d.composition.millesimes), fractions: tracePcts(d.composition.fractions), revendications: tracePcts(d.composition.revendications) };
  if (d.crus && typeof d.crus === 'object') out.crus = { crus: tracePcts(d.crus.crus), echelles: tracePcts(d.crus.echelles) };
  if (Array.isArray(d.apporteurs)) out.apporteurs = tracePcts(d.apporteurs);
  if (Array.isArray(d.parcelles)) out.parcelles = tracePcts(d.parcelles);
  if (Array.isArray(d.intrants)) out.intrants = d.intrants.slice(0, 300).filter((x) => x && typeof x === 'object').map((x) => ({ produit: traceTxt(x.produit, 120), quantite: traceNb(x.quantite), unite: traceTxt(x.unite, 20), lotFournisseur: traceTxt(x.lotFournisseur, 60), allergenes: traceTxt(x.allergenes, 200), ...(x.surCeLot ? { surCeLot: true } : {}) })).filter((x) => x.produit);
  if (Array.isArray(d.analyses)) out.analyses = d.analyses.slice(0, 60).filter((x) => x && typeof x === 'object').map((x) => ({ date: isoOK(x.date) ? x.date : '', lot: traceTxt(x.lot, 60), valeurs: (Array.isArray(x.valeurs) ? x.valeurs : []).slice(0, 60).filter((v) => v && typeof v === 'object').map((v) => ({ nom: traceTxt(v.nom, 80), valeur: traceNb(v.valeur), unite: traceTxt(v.unite, 30) })).filter((v) => v.nom && v.valeur != null) }));
  if (Array.isArray(d.historique)) out.historique = d.historique.slice(-400).filter((x) => x && typeof x === 'object').map((x) => ({ date: isoOK(x.date) ? x.date : '', operation: traceTxt(x.operation, 80), lots: (Array.isArray(x.lots) ? x.lots : []).slice(0, 12).map((l) => traceTxt(l, 60)).filter(Boolean), ...(Array.isArray(x.contenants) ? { contenants: x.contenants.slice(0, 12).map((c) => traceTxt(c, 60)).filter(Boolean) } : {}) }));
  if (Array.isArray(d.amont) && p < 4) out.amont = d.amont.slice(0, 20).map((a) => traceNettoyer(a, p + 1)).filter(Boolean);
  if (typeof d.empreinte === 'string') out.empreinte = d.empreinte.slice(0, 64);
  return out;
}
// fichier reçu : JSON protégé, format reconnu, empreinte vérifiée sur le fichier tel que reçu, données nettoyées
function traceLire(texte) {
  const js = jsonSur(texte, { max: 20 * GARDE_MO, profondeur: 40 }); if (!js.ok) return fail(js.msg);
  const d = js.valeur; if (!d || typeof d !== 'object' || d.format !== TRACE_FORMAT) return fail('Ce fichier n’est pas un fichier de traçabilité Œnotrack.');
  const integre = typeof d.empreinte === 'string' && d.empreinte === traceEmpreinte(d);
  const data = traceNettoyer(d); if (!data || !data.produit) return fail('Fichier de traçabilité incomplet.');
  return okr({ data, integre, recente: num(d.formatVersion) > TRACE_VERSION, retires: js.retires });
}
const traceAmontRec = (data, fichier, integre, maintenant) => ({ id: `am${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, recuLe: maintenant || new Date().toISOString(), fichier: gardeNomPropre(fichier).slice(0, 120), integre: !!integre, ...data });
// préremplissage de l'entrée (moût : entree_mout ; vin : reprise « Entrée de vin ») d'après le fichier — ce qui ne correspond à rien chez le receveur est signalé
function traceVersEntree(db, data, type) {
  const P = data.produit || {}; const C = data.composition || {}; const E = data.expedition || {}; const manquants = []; const pris = [];
  const cherche = (L, nom, f) => { const n = norm(nom).trim(); return n ? (L || []).find((x) => norm(f(x)).trim() === n) || null : null; };
  const cep = (nom) => { const c = cherche(db.lists.cepages, nom, (x) => x.label); if (!c && nom) manquants.push(`cépage « ${nom} »`); return c ? c.id : ''; };
  const cru = (nom) => { if (!nom || /non renseign/i.test(nom)) return ''; const c = cherche(db.crus, nom, (x) => x.nom); if (!c) manquants.push(`cru « ${nom} »`); return c ? c.id : ''; };
  const frac = (nom) => { const c = cherche(fracList(db), nom, (x) => x.label); if (!c && nom && !/non pr/i.test(nom)) manquants.push(`fraction « ${nom} »`); return c ? c.id : ''; };
  const qualif = (code) => { const q = QUALIFS.find((x) => norm(x.code) === norm(code) || norm(x.court) === norm(code) || norm(x.id) === norm(code)); return q ? q.id : 'conv'; };
  const exp = data.expediteur && data.expediteur.nom ? cherche(db.apporteurs, data.expediteur.nom, (x) => x.nom) : null; if (data.expediteur && data.expediteur.nom && !exp) manquants.push(`partenaire « ${data.expediteur.nom} » (à créer dans Paramètres › Partenaires)`);
  const partenaire = !exp && data.expediteur && data.expediteur.nom ? { nom: data.expediteur.nom, adresse: data.expediteur.adresse || '' } : null; // à créer chez le receveur (bouton du formulaire)
  const mil = /^\d{4}$/.test(P.millesime || '') ? P.millesime : ((C.millesimes || []).length === 1 && /^\d{4}$/.test(C.millesimes[0].nom) ? C.millesimes[0].nom : '');
  const vol = num(E.volumeL) > 0 ? String(r2(E.volumeL)) : '';
  const q = qualif(P.revendication);
  if (type === 'entree_mout') {
    const ce = (C.cepages || [])[0]; const fr = (C.fractions || [])[0]; const cr = ((data.crus || {}).crus || [])[0];
    const an = {}; const A = (data.analyses || [])[0]; if (A) A.valeurs.forEach((v) => { const p = bulletinParam(db, v.nom); if (p && p.paramId && v.valeur != null) an[p.paramId] = String(v.valeur).replace('.', ','); });
    if ((C.cepages || []).length > 1 || (C.fractions || []).length > 1 || (((data.crus || {}).crus) || []).length > 1) pris.push('moût composé de plusieurs cépages, fractions ou crus : la ligne reprend le principal, la composition complète est gardée avec l’entrée');
    // ligne de moût (le formulaire la complète avec moutLine) : cépage, fraction et cru principaux, n° de lot de l'expéditeur, analyses, volume
    const ligne = { cepageId: ce ? cep(ce.nom) : '', fractionId: fr ? frac(fr.nom) : '', cruId: cr ? cru(cr.nom) : '', qualifId: q, millesime: mil, numLot: P.lot || '', apporteurId: exp ? exp.id : '', analyses: an, dests: [{ contenantId: '', volL: vol }] };
    return { preset: { ...(exp ? { apporteurId: exp.id } : {}), ref: E.ref || '', ...(mil ? { millesime: mil } : {}) }, ligne, manquants: uniq(manquants), notes: pris, partenaire };
  }
  const cepages = {}; (C.cepages || []).forEach((x) => { const id = cep(x.nom); if (id) cepages[id] = String(x.pct).replace('.', ','); });
  const crus = (((data.crus || {}).crus) || []).map((x) => ({ cruId: cru(x.nom), pct: String(x.pct).replace('.', ',') })).filter((x) => x.cruId);
  const code = P.lot && !db.lots.some((l) => norm(l.code) === norm(P.lot)) ? P.lot : '';
  return { preset: { sousType: 'entree_vin', ...(exp ? { apporteurId: exp.id } : {}), designation: P.designation || P.lot || '', ...(code ? { code } : {}), ...(mil ? { millesime: mil } : {}), qualifId: q, cepages, crus: crus.length ? crus : [{ cruId: '', pct: '' }], volL: vol, kind: P.nature === 'bouteilles' ? 'bouteilles' : 'vin' }, manquants: uniq(manquants), notes: pris, partenaire };
}
