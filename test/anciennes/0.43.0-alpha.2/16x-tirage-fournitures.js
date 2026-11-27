/* ============ TIRAGE — FOURNITURES ET CONTRÔLES HACCP (0.42.0-alpha.3) ============
   Les fournitures de tirage sont des intrants (db.produits, db.arrivages) : aucun stock en double.
   - produit : fourniture { type (FOURNITURE_TYPES), caracs { verrier, modele, teinte, format, bague, … } }, suiviStock (false = suivi par lot
     fournisseur sans décompte ; absent = décompté comme tout intrant)
   - arrivage (lot fournisseur) : controleReception { date, heure, par, echantillon, mesures [{ hauteur, diametre, bague }], defauts { id: n },
     decision ('accepte' | 'derogation' | 'refuse'), conforme, note, visa, le } — contrôle de réception de la verrerie
   - retour au fournisseur : régularisation (db.regulStocks, motif « retour ») avec retour { fournisseurId, bon, raison }
   - opération « tirage » : fournitures [{ produitId, arrivageId, type, format, qty, calc, manuel, decompte }] (trace complète) ;
     les quantités décomptées sont aussi écrites dans op.lignes (fourniture: true) : le rejeu et les versions antérieures les retirent du stock
   - chantier : haccp { demarrage { point: { ok, note } }, ajouts [{ id, label, phase }], controles [{ date, heure, points { point: ok },
     operateur, note }], fin { point: { ok, note } }, conditionnement [{ format, contenant, nb, parUnite }], incidents [{ date, heure,
     description, action, par }], visas [{ role, nom, le }] } — fiche d'enregistrement de la chaîne */

const FOURNITURE_TYPES = [
  { id: 'bouteille', label: 'Bouteille', caracs: ['verrier', 'modele', 'format', 'teinte', 'bague', 'poids', 'marquage'], mots: /\b(bouteilles?|magnums?|jeroboam|verre|champenoise)\b/i },
  { id: 'obturateur', label: 'Obturateur (bidule)', caracs: ['fabricant', 'modele', 'diametre', 'matiere', 'couleur'], mots: /\b(bidules?|obturateurs?)\b/i },
  { id: 'capsule', label: 'Capsule de tirage', caracs: ['fabricant', 'modele', 'diametre', 'matiere', 'couleur', 'joint', 'marquage'], mots: /\bcapsules?\b/i },
  { id: 'bouchon', label: 'Bouchon de tirage (liège)', caracs: ['fabricant', 'modele', 'diametre', 'matiere'], mots: /\bbouchons?\b.*\btirage\b/i },
  { id: 'agrafe', label: 'Agrafe', caracs: ['fabricant', 'modele', 'matiere'], mots: /\bagrafes?\b/i },
  { id: 'adjuvant', label: 'Adjuvant de remuage', caracs: ['fabricant', 'modele'], mots: /\b(adjuvants?\s+de\s+remuage|bentonite.*remuage|alginate)\b/i },
  { id: 'emballage', label: 'Caisse, palette, intercalaire', caracs: ['fabricant', 'modele', 'matiere', 'contenance'], mots: /\b(caisses?-?fils?|intercalaires?|palettes?|gyropalettes?)\b/i },
  { id: 'autre', label: 'Autre fourniture de tirage', caracs: ['fabricant', 'modele'] },
];
const FOURNITURE_CARACS = { verrier: 'Verrier', fabricant: 'Fabricant', modele: 'Modèle', format: 'Format', teinte: 'Teinte', bague: 'Bague (mm)', poids: 'Poids (g)', marquage: 'Marquage', diametre: 'Diamètre (mm)', matiere: 'Matière', couleur: 'Couleur', joint: 'Joint', contenance: 'Contenance (cols)' };
const fournitureTypeDef = (t) => FOURNITURE_TYPES.find((x) => x.id === t) || null;
// type d'une fourniture : choisi sur le produit, sinon deviné d'après le nom pour une matière sèche (jamais pour un produit œnologique)
function fournitureTypeDe(p) {
  if (!p) return ''; if (p.fourniture && fournitureTypeDef(p.fourniture.type)) return p.fourniture.type;
  if (p.fourniture && p.fourniture.type === '') return ''; // « pas une fourniture de tirage » choisi explicitement
  if (p.categorie !== 'sec') return '';
  const t = FOURNITURE_TYPES.find((x) => x.mots && x.mots.test(String(p.nom || ''))); return t ? t.id : '';
}
const _fProd = (db, id) => ((db && db.produits) || []).find((p) => p && p.id === id) || {};
const fournitureCaracs = (p) => ((p && p.fourniture && p.fourniture.caracs) || {});
const fournitureSuivi = (p) => !(p && p.suiviStock === false);
// format d'une bouteille : choisi, sinon lu dans le nom (« magnum », « 75 cl »)
function fournitureFormat(p) {
  const c = fournitureCaracs(p); if (c.format && tirageFormat(c.format)) return c.format;
  if (fournitureTypeDe(p) !== 'bouteille') return '';
  const n = norm(p.nom || ''); const f = TIRAGE_FORMATS.find((x) => n.includes(norm(x.label))); if (f) return f.id;
  const m = n.match(/(\d+(?:[.,]\d+)?)\s*cl\b/); if (m) { const L = num(m[1]) / 100; const g = TIRAGE_FORMATS.find((x) => Math.abs(x.L - L) < 0.005); if (g) return g.id; }
  return '';
}
const fournituresTirage = (db, type) => (db.produits || []).filter((p) => p && fournitureTypeDe(p) && (!type || fournitureTypeDe(p) === type));
// fourniture enregistrée sur le produit (type, caractéristiques nettoyées)
function fournitureSpec(f) {
  if (!f || typeof f !== 'object') return null; const t = f.type === '' ? '' : (fournitureTypeDef(f.type) ? f.type : null); if (t === null) return null;
  const caracs = {}; Object.keys(f.caracs || {}).forEach((k) => { if (!FOURNITURE_CARACS[k]) return; const v = String(f.caracs[k] == null ? '' : f.caracs[k]).trim().slice(0, 80); if (v) caracs[k] = v; });
  return t ? { type: t, ...(Object.keys(caracs).length ? { caracs } : {}) } : { type: '' };
}

/* ---------- quantités consommées par un tirage ---------- */
// cols + casse : une bouteille d'un format donné ne compte que les cols de ce format (casse au prorata) ; obturateurs, capsules,
// bouchons et agrafes comptent tous les cols ; les autres fournitures se saisissent à la main
function fournitureQteTirage(db, p, t) {
  const type = fournitureTypeDe(p); const F = (t.formats || []).filter((f) => num(f.nb) > 0); const n = sum(F, (f) => num(f.nb)); const casse = num(t.casse);
  if (!n) return null;
  if (type === 'bouteille') { const fm = fournitureFormat(p); const nf = fm ? sum(F.filter((f) => (f.format || 'bouteille') === fm), (f) => num(f.nb)) : n; return Math.round(nf + casse * nf / n); }
  if (['obturateur', 'capsule', 'bouchon', 'agrafe'].includes(type)) return Math.round(n + casse);
  return null;
}
// fournitures proposées pour un tirage : pour chaque format, la bouteille du format la plus en stock ; un obturateur et une capsule
function tirageFournituresProposees(db, R, t) {
  const F = (t.formats || []).filter((f) => num(f.nb) > 0); const out = [];
  const meilleur = (P) => { const L = P.map((p) => { const A = (db.arrivages || []).filter((a) => a.produitId === p.id).map((a) => ({ a, rest: arrivalRest(R, a) })).filter((x) => x.rest > 0 && !(x.a.controleReception && x.a.controleReception.decision === 'refuse')).sort((x, y) => (x.a.date < y.a.date ? -1 : 1)); return { p, A, tot: sum(A, (x) => x.rest) }; }).filter((x) => x.p.actif !== false).sort((x, y) => y.tot - x.tot); return L[0] || null; };
  uniq(F.map((f) => f.format || 'bouteille')).forEach((fm) => { const P = fournituresTirage(db, 'bouteille').filter((p) => fournitureFormat(p) === fm || (!fournitureFormat(p) && fm === 'bouteille')); const m = meilleur(P); if (m) out.push({ produitId: m.p.id, arrivageId: m.A.length ? m.A[0].a.id : '', type: 'bouteille', format: fm }); });
  ['obturateur', 'capsule'].forEach((ty) => { const m = meilleur(fournituresTirage(db, ty)); if (m) out.push({ produitId: m.p.id, arrivageId: m.A.length ? m.A[0].a.id : '', type: ty }); });
  return out.map((x) => ({ ...x, calc: fournitureQteTirage(db, _fProd(db, x.produitId), t) }));
}
// fournitures d'un tirage → trace (op.fournitures) et lignes décomptées (op.lignes, fourniture: true)
function tirageFournituresSpec(db, L, t) {
  const fournitures = []; const lignes = [];
  (L || []).filter((x) => x && x.produitId).forEach((x) => {
    const p = _fProd(db, x.produitId); const calc = fournitureQteTirage(db, p, t); const manuel = !!x.manuel || calc == null;
    const qty = manuel ? (hasNum(x.qty) ? Math.max(0, num(x.qty)) : 0) : calc; const decompte = fournitureSuivi(p);
    const y = { produitId: x.produitId, arrivageId: x.arrivageId || '', type: fournitureTypeDe(p) || '', ...(x.format ? { format: x.format } : {}), qty, ...(calc != null ? { calc } : {}), ...(manuel ? { manuel: true } : {}), decompte };
    fournitures.push(y); if (decompte && qty > 0) lignes.push({ produitId: y.produitId, arrivageId: y.arrivageId, qty, fourniture: true });
  });
  return { fournitures, lignes };
}
// fournitures d'une opération (anciennes : lignes de matières sèches devinées)
function tirageFournituresDe(db, op) {
  if (Array.isArray(op && op.fournitures)) return op.fournitures;
  return ((op && op.lignes) || []).filter((l) => fournitureTypeDe(_fProd(db, l.produitId))).map((l) => ({ produitId: l.produitId, arrivageId: l.arrivageId || '', type: fournitureTypeDe(_fProd(db, l.produitId)), qty: num(l.qty), manuel: true, decompte: true, ancienne: true }));
}
// lignes d'intrants d'un tirage hors fournitures (marquées, ou réécrites sans marque par une version antérieure : reconnues une à une)
function tirageLignesHorsFournitures(op) {
  const F = (Array.isArray(op && op.fournitures) ? op.fournitures : []).filter((x) => x.decompte && num(x.qty) > 0).map((x) => ({ ...x }));
  return ((op && op.lignes) || []).filter((l) => { if (!l || l.fourniture) return false; const i = F.findIndex((x) => x.produitId === l.produitId && (x.arrivageId || '') === (l.arrivageId || '') && Math.abs(num(x.qty) - num(l.qty)) < 1e-6); if (i >= 0) { F.splice(i, 1); return false; } return true; });
}
// alertes sur les fournitures d'un tirage (lot refusé, verrerie non contrôlée, stock, format, lot manquant)
function fournituresAlertes(db, R, L, t) {
  const out = []; const F = uniq(((t && t.formats) || []).filter((f) => num(f.nb) > 0).map((f) => f.format || 'bouteille'));
  (L || []).filter((x) => x && x.produitId).forEach((x) => {
    const p = _fProd(db, x.produitId); const a = (db.arrivages || []).find((y) => y.id === x.arrivageId); const nom = p.nom || 'Fourniture';
    if (!a) { out.push(`${nom} : choisissez le lot fournisseur (traçabilité).`); return; }
    const c = a.controleReception; const type = fournitureTypeDe(p);
    if (c && c.decision === 'refuse') out.push(`${nom} (lot ${a.numLot}) : lot refusé au contrôle de réception.`);
    else if (type === 'bouteille' && !c) out.push(`${nom} (lot ${a.numLot}) : verrerie sans contrôle de réception enregistré.`);
    const fm = fournitureFormat(p); if (type === 'bouteille' && fm && F.length && !F.includes(fm)) out.push(`${nom} : format ${(tirageFormat(fm) || {}).label || fm} absent de ce tirage.`);
    const q = x.manuel || x.calc == null ? num(x.qty) : num(x.calc); if (fournitureSuivi(p) && R && q > arrivalRest(R, a) + 1e-6) out.push(`${nom} (lot ${a.numLot}) : ${fmt(q)} pour ${fmt(arrivalRest(R, a))} en stock.`);
  });
  return out;
}

/* ---------- contrôle de réception de la verrerie (modèle d'enregistrement de l'exploitation) ---------- */
const CONTROLE_VERRE_DEFAUTS = [['bulle', 'Bulle, soufflure'], ['glacure', 'Glaçure, fêlure'], ['pierre', 'Pierre, infondu'], ['bague', 'Bague défectueuse (ébréchure, bavure)'], ['fond', 'Fond, piqûre défectueux'], ['deformation', 'Déformation, ovalisation'], ['salissure', 'Salissure, corps étranger'], ['teinte', 'Teinte non conforme'], ['marquage', 'Marquage illisible ou absent'], ['palette', 'Palette, housse ou film abîmés']];
// réglages « à vérifier » (taille de l'échantillon selon la taille du lot, nombre de défauts toléré, tolérances des mesures)
function controleVerreReglages(db) {
  const s = (db && db.settings && db.settings.controleVerre) || {}; const n = (v, d) => (hasNum(v) ? num(v) : d);
  const tol = s.tolerances || {}; const T = (k) => (tol[k] && (hasNum(tol[k].min) || hasNum(tol[k].max)) ? { min: hasNum(tol[k].min) ? num(tol[k].min) : null, max: hasNum(tol[k].max) ? num(tol[k].max) : null } : { min: null, max: null });
  return { seuilLot: n(s.seuilLot, 10000), nPetit: n(s.nPetit, 20), nGrand: n(s.nGrand, 40), defautsMax: n(s.defautsMax, 4), tolerances: { hauteur: T('hauteur'), diametre: T('diametre'), bague: T('bague') }, aVerifier: s.aVerifier !== false };
}
function controleVerreReglagesSet(db, s, uid) {
  if (!db.settings) db.settings = {}; const x = {}; for (const k of ['seuilLot', 'nPetit', 'nGrand', 'defautsMax']) { if (s[k] === undefined || s[k] === '') continue; if (!hasNum(s[k]) || num(s[k]) < 0) return fail('Contrôle de la verrerie : nombres positifs attendus.'); x[k] = num(s[k]); }
  const tol = {}; Object.keys(s.tolerances || {}).forEach((k) => { if (!['hauteur', 'diametre', 'bague'].includes(k)) return; const t = s.tolerances[k] || {}; const y = {}; if (hasNum(t.min)) y.min = num(t.min); if (hasNum(t.max)) y.max = num(t.max); if (y.min != null && y.max != null && y.min > y.max) return; if (Object.keys(y).length) tol[k] = y; });
  db.settings.controleVerre = { ...x, ...(Object.keys(tol).length ? { tolerances: tol } : {}), aVerifier: s.aVerifier !== false, par: uid || '', le: new Date().toISOString() }; return okr();
}
const controleVerreEchantillon = (db, qty) => { const r = controleVerreReglages(db); return num(qty) > r.seuilLot ? r.nGrand : r.nPetit; };
// évaluation d'un contrôle : défauts, mesures hors tolérance, conformité proposée
function controleVerreEvaluer(db, c) {
  const r = controleVerreReglages(db); const D = (c && c.defauts) || {}; const nDef = sum(Object.keys(D), (k) => Math.max(0, num(D[k])));
  const M = ((c && c.mesures) || []).filter((m) => m && ['hauteur', 'diametre', 'bague'].some((k) => hasNum(m[k])));
  const stats = {}; let hors = 0;
  ['hauteur', 'diametre', 'bague'].forEach((k) => { const v = M.filter((m) => hasNum(m[k])).map((m) => num(m[k])); const t = r.tolerances[k]; const h = v.filter((x) => (t.min != null && x < t.min) || (t.max != null && x > t.max)).length; hors += h; stats[k] = v.length ? { n: v.length, min: Math.min(...v), max: Math.max(...v), moy: sum(v) / v.length, hors: h } : null; });
  const conforme = nDef < r.defautsMax && hors === 0;
  return { nDefauts: nDef, hors, stats, conforme, defautsMax: r.defautsMax, nMesures: M.length, echantillon: num(c && c.echantillon) || null };
}
const CONTROLE_DECISIONS = [{ id: 'accepte', label: 'Lot accepté' }, { id: 'derogation', label: 'Accepté par dérogation' }, { id: 'refuse', label: 'Lot refusé (retour au fournisseur)' }];
function arrivageControleSave(db, arrivageId, s, uid) {
  const a = (db.arrivages || []).find((x) => x.id === arrivageId); if (!a) return fail('Arrivage introuvable.'); if (isLocked(db, a.date)) return fail('Arrivage verrouillé (campagne figée).');
  if (s === null) { delete a.controleReception; return okr(); }
  if (!isoOK(s.date)) return fail('Date du contrôle invalide.'); if (s.date < a.date) return fail(`Le lot a été reçu le ${fmtDate(a.date)} : contrôle impossible avant.`);
  if (!CONTROLE_DECISIONS.some((d) => d.id === s.decision)) return fail('Indiquez la décision (accepté, dérogation ou refusé).');
  const defauts = {}; Object.keys(s.defauts || {}).forEach((k) => { if (CONTROLE_VERRE_DEFAUTS.some((d) => d[0] === k) && num(s.defauts[k]) > 0) defauts[k] = Math.round(num(s.defauts[k])); });
  const mesures = (s.mesures || []).map((m) => { const y = {}; ['hauteur', 'diametre', 'bague'].forEach((k) => { if (hasNum(m && m[k])) y[k] = num(m[k]); }); return y; }).filter((m) => Object.keys(m).length);
  const ev = controleVerreEvaluer(db, { defauts, mesures, echantillon: s.echantillon });
  const note = String(s.note || '').trim().slice(0, 500);
  if (s.decision === 'derogation' && !note) return fail('Acceptation par dérogation : précisez la raison dans la note.');
  if (s.decision === 'accepte' && !ev.conforme && !note) return fail(`Contrôle non conforme (${ev.nDefauts} défaut(s), ${ev.hors} mesure(s) hors tolérance) : acceptez par dérogation ou refusez le lot.`);
  a.controleReception = { date: s.date, ...(s.heure ? { heure: String(s.heure).trim() } : {}), echantillon: hasNum(s.echantillon) ? Math.round(num(s.echantillon)) : controleVerreEchantillon(db, a.qty), mesures, defauts, nDefauts: ev.nDefauts, conforme: ev.conforme, decision: s.decision, note, visa: String(s.visa || '').trim().slice(0, 80), par: uid || '', le: new Date().toISOString() };
  return okr({ conforme: ev.conforme });
}
const arrivageControleEtat = (a) => { const c = a && a.controleReception; if (!c) return { k: 'aucun', label: 'non contrôlé', tone: 'warn' }; if (c.decision === 'refuse') return { k: 'refuse', label: 'refusé', tone: 'bad' }; if (c.decision === 'derogation') return { k: 'derogation', label: 'accepté par dérogation', tone: 'warn' }; return { k: 'accepte', label: 'contrôlé, accepté', tone: 'ok' }; };

/* ---------- retour au fournisseur ---------- */
function fournitureRetourSave(db, s, uid) {
  const a = (db.arrivages || []).find((x) => x.id === s.arrivageId); if (!a) return fail('Choisissez le lot fournisseur à retourner.');
  if (!(num(s.qty) > 0)) return fail('Quantité retournée : valeur supérieure à 0 requise.');
  const raison = String(s.raison || '').trim(); if (!raison) return fail('Indiquez la raison du retour.');
  const r = regulSave(db, { arrivageId: a.id, date: s.date, qty: -Math.abs(num(s.qty)), motif: 'retour', notes: raison }, null, uid); if (!r.ok) return r;
  const x = db.regulStocks.find((y) => y && y.id === r.id); x.retour = { fournisseurId: s.fournisseurId || a.fournisseurId || '', bon: String(s.bon || '').trim().slice(0, 60), raison };
  return okr({ id: r.id });
}
const fournitureRetours = (db, arrivageId) => (db.regulStocks || []).filter((x) => x && x.motif === 'retour' && (!arrivageId || x.arrivageId === arrivageId)).sort(byDate);

/* ---------- fiche d'enregistrement de la chaîne de tirage (HACCP) ---------- */
// points d'exemple, inspirés des fiches de chantier : l'exploitation les complète chantier par chantier
const CHAINE_DEMARRAGE = [['nettoyage', 'Nettoyage et désinfection de la ligne (attestation reçue)'], ['rincage', 'Rinçage à l’eau potable, absence de produit de nettoyage'], ['verre', 'Absence de verre et de corps étrangers sur la ligne'], ['fournitures', 'Fournitures conformes : lots contrôlés, références du chantier'], ['niveau', 'Réglage du niveau de remplissage'], ['injecteuse', 'Réglage de l’injecteuse (consignes de liqueur et de levain)'], ['capsuleuse', 'Réglage de la capsuleuse (sertissage)'], ['marquage', 'Marquage lisible (n° de lot)'], ['protections', 'Protections et carters en place'], ['epi', 'Équipements de protection individuelle']];
const CHAINE_CONTROLES = [['niveau', 'Niveau de remplissage'], ['sertissage', 'Sertissage de la capsule'], ['obturateur', 'Présence de l’obturateur'], ['marquage', 'Marquage'], ['bris', 'Absence de bris de verre'], ['proprete', 'Propreté de la ligne'], ['agitation', 'Agitation de la cuve (levain en suspension)']];
const CHAINE_FIN = [['vidange', 'Vidange de la tireuse et des circuits'], ['nettoyage', 'Nettoyage de fin de journée'], ['fournitures', 'Fournitures restantes comptées et rangées'], ['bris', 'Bris de verre ramassé et consigné'], ['dechets', 'Déchets triés'], ['zone', 'Zone rangée, ligne sécurisée']];
const CHAINE_CONTENANTS = [{ id: 'caisse_fil', label: 'Caisses-fils' }, { id: 'caisse_bois', label: 'Caisses-bois' }, { id: 'palette', label: 'Palettes' }, { id: 'gyropalette', label: 'Gyropalettes' }, { id: 'autre', label: 'Autre contenant' }];
const CHAINE_VISAS = [{ id: 'chef_ligne', label: 'Chef de ligne' }, { id: 'cave', label: 'Responsable de cave' }, { id: 'qualite', label: 'Qualité' }, { id: 'prestataire', label: 'Prestataire' }];
const CHAINE_INTERVALLE_H = 2; // contrôles en cours de chantier : toutes les 2 heures (repère de la fiche de chantier, à vérifier)
const chantierHaccp = (ch) => { const h = (ch && ch.haccp) || {}; return { demarrage: h.demarrage || {}, ajouts: h.ajouts || [], controles: h.controles || [], fin: h.fin || {}, conditionnement: h.conditionnement || [], incidents: h.incidents || [], visas: h.visas || [] }; };
const chainePoints = (ch, phase) => [...(phase === 'demarrage' ? CHAINE_DEMARRAGE : phase === 'controles' ? CHAINE_CONTROLES : CHAINE_FIN), ...chantierHaccp(ch).ajouts.filter((a) => a.phase === phase).map((a) => [a.id, a.label, true])];
const _chOk = (v) => (v === true || v === false ? v : null);
function chantierHaccpSet(db, id, h, uid) {
  const ch = chantierTirage(db, id); if (!ch) return fail('Chantier introuvable.'); if (isLocked(db, ch.dateDebut)) return fail('Ce chantier appartient à une campagne figée.');
  const txt = (v, n) => String(v == null ? '' : v).trim().slice(0, n || 300);
  const etats = (o) => { const x = {}; Object.keys(o || {}).forEach((k) => { const e = o[k] || {}; const ok = _chOk(e.ok); const note = txt(e.note); if (ok !== null || note) x[k] = { ...(ok !== null ? { ok } : {}), ...(note ? { note } : {}) }; }); return x; };
  const ajouts = (h.ajouts || []).filter((a) => a && txt(a.label) && ['demarrage', 'controles', 'fin'].includes(a.phase)).map((a) => ({ id: a.id || `aj${Math.random().toString(36).slice(2, 8)}`, label: txt(a.label, 120), phase: a.phase }));
  const heureOk = (v) => !v || /^\d{1,2}[:h]\d{2}$/.test(String(v).trim());
  for (const c of h.controles || []) if (!heureOk(c.heure)) return fail('Heure d’un contrôle : format HH:MM attendu.');
  const controles = (h.controles || []).filter((c) => c && (c.heure || Object.keys(c.points || {}).length || txt(c.note))).map((c) => ({ date: isoOK(c.date) ? c.date : ch.dateDebut, heure: txt(c.heure, 5).replace('h', ':'), points: Object.fromEntries(Object.keys(c.points || {}).filter((k) => _chOk(c.points[k]) !== null).map((k) => [k, c.points[k]])), ...(txt(c.operateur, 80) ? { operateur: txt(c.operateur, 80) } : {}), ...(txt(c.note) ? { note: txt(c.note) } : {}) })).sort((x, y) => (`${x.date}${x.heure.padStart(5, '0')}` < `${y.date}${y.heure.padStart(5, '0')}` ? -1 : 1));
  const conditionnement = (h.conditionnement || []).filter((c) => c && num(c.nb) > 0).map((c) => ({ format: tirageFormat(c.format) ? c.format : 'bouteille', contenant: CHAINE_CONTENANTS.some((k) => k.id === c.contenant) ? c.contenant : 'autre', nb: Math.round(num(c.nb)), ...(num(c.parUnite) > 0 ? { parUnite: Math.round(num(c.parUnite)) } : {}) }));
  const incidents = (h.incidents || []).filter((c) => c && txt(c.description)).map((c) => ({ date: isoOK(c.date) ? c.date : ch.dateDebut, heure: txt(c.heure, 5), description: txt(c.description, 500), ...(txt(c.action, 500) ? { action: txt(c.action, 500) } : {}), par: txt(c.par, 80) || uid || '' }));
  const visas = (h.visas || []).filter((v) => v && CHAINE_VISAS.some((k) => k.id === v.role) && txt(v.nom, 80)).map((v) => ({ role: v.role, nom: txt(v.nom, 80), le: v.le || new Date().toISOString() }));
  ch.haccp = { demarrage: etats(h.demarrage), ajouts, controles, fin: etats(h.fin), conditionnement, incidents, visas, par: uid || '', maj: new Date().toISOString() };
  ch.maj = ch.haccp.maj; return okr();
}
const _minutes = (c) => { const m = String(c.heure || '').match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
// écarts de la fiche : points non conformes, contrôles espacés de plus de 2 h, conditionnement différent des cols tirés
function chantierHaccpEcarts(db, R, ch) {
  const h = chantierHaccp(ch); const out = [];
  const nok = (o, phase) => chainePoints(ch, phase).filter(([k]) => o[k] && o[k].ok === false).map(([, l]) => l);
  const dem = nok(h.demarrage, 'demarrage'); if (dem.length) out.push(`Démarrage non conforme : ${dem.join(', ')}.`);
  const fin = nok(h.fin, 'fin'); if (fin.length) out.push(`Fin de journée non conforme : ${fin.join(', ')}.`);
  h.controles.forEach((c) => { const L = chainePoints(ch, 'controles').filter(([k]) => c.points[k] === false).map(([, l]) => l); if (L.length) out.push(`Contrôle de ${c.heure || '—'} (${fmtDate(c.date)}) : ${L.join(', ')}.`); });
  uniq(h.controles.map((c) => c.date)).forEach((d) => { const M = h.controles.filter((c) => c.date === d).map(_minutes).filter((m) => m != null).sort((a, b) => a - b); const hm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; for (let i = 1; i < M.length; i++) if (M[i] - M[i - 1] > CHAINE_INTERVALLE_H * 60 + 15) out.push(`${fmtDate(d)} : plus de ${CHAINE_INTERVALLE_H} h entre deux contrôles (${hm(M[i - 1])} → ${hm(M[i])}).`); });
  const C = chantierConditionnement(db, R, ch); C.formats.forEach((f) => { if (f.contenus != null && f.contenus !== f.cols) out.push(`${(tirageFormat(f.format) || {}).label || f.format} : ${fmt(f.contenus)} cols rangés pour ${fmt(f.cols)} tirés.`); });
  return out;
}
// bilan par format et par contenant (caisses-fils, caisses-bois, palettes, gyropalettes)
function chantierConditionnement(db, R, ch) {
  const h = chantierHaccp(ch); const B = chantierBilan(db, R, ch.id); const parC = {};
  h.conditionnement.forEach((c) => { const k = `${c.format}|${c.contenant}`; const x = (parC[k] = parC[k] || { format: c.format, contenant: c.contenant, nb: 0, cols: 0, colsConnus: true }); x.nb += c.nb; if (c.parUnite) x.cols += c.nb * c.parUnite; else x.colsConnus = false; });
  const lignes = Object.values(parC);
  const formats = uniq([...Object.keys(B.parFormat), ...lignes.map((l) => l.format)]).map((fm) => { const L = lignes.filter((l) => l.format === fm); return { format: fm, cols: B.parFormat[fm] || 0, contenus: L.length && L.every((l) => l.colsConnus) ? sum(L, (l) => l.cols) : null }; });
  return { lignes, formats, casse: B.casse };
}
// fournitures utilisées sur le chantier, lot par lot (changement de lot = nouvelles fournitures)
function chantierFournitures(db, id) {
  return chantierTirages(db, id).map((o) => ({ opId: o.id, date: o.date, code: (lotById(db, o.lotId) || {}).code || (o.lotSpec || {}).code || '', fournitures: tirageFournituresDe(db, o).map((x) => { const a = (db.arrivages || []).find((y) => y.id === x.arrivageId) || {}; return { ...x, nom: _fProd(db, x.produitId).nom || '', numLot: a.numLot || '' }; }) }));
}
