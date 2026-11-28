/* ============ TIRAGE — FOURNITURES (0.42.0-alpha.3 ; 0.44.0-alpha.2 : contrôle de la verrerie et fiche HACCP de la chaîne retirés) ============
   Les fournitures de tirage sont des intrants (db.produits, db.arrivages) : aucun stock en double.
   - produit : fourniture { type (FOURNITURE_TYPES), caracs { verrier, modele, teinte, format, bague, … } }, suiviStock (false = suivi par lot
     fournisseur sans décompte ; absent = décompté comme tout intrant)
   - 0.44.0-alpha.2 : arrivage.controleReception, settings.controleVerre et chantier.haccp (versions 0.42.0-alpha.3 à 0.44.0-alpha.1)
     restent dans la base sans être lus ni modifiés
   - retour au fournisseur : régularisation (db.regulStocks, motif « retour ») avec retour { fournisseurId, bon, raison }
   - opération « tirage » : fournitures [{ produitId, arrivageId, type, format, qty, calc, manuel, decompte }] (trace complète) ;
     les quantités décomptées sont aussi écrites dans op.lignes (fourniture: true) : le rejeu et les versions antérieures les retirent du stock */

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
  const meilleur = (P) => { const L = P.map((p) => { const A = (db.arrivages || []).filter((a) => a.produitId === p.id).map((a) => ({ a, rest: arrivalRest(R, a) })).filter((x) => x.rest > 0).sort((x, y) => (x.a.date < y.a.date ? -1 : 1)); return { p, A, tot: sum(A, (x) => x.rest) }; }).filter((x) => x.p.actif !== false).sort((x, y) => y.tot - x.tot); return L[0] || null; };
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
// alertes sur les fournitures d'un tirage (stock, format, lot manquant)
function fournituresAlertes(db, R, L, t) {
  const out = []; const F = uniq(((t && t.formats) || []).filter((f) => num(f.nb) > 0).map((f) => f.format || 'bouteille'));
  (L || []).filter((x) => x && x.produitId).forEach((x) => {
    const p = _fProd(db, x.produitId); const a = (db.arrivages || []).find((y) => y.id === x.arrivageId); const nom = p.nom || 'Fourniture';
    if (!a) { out.push(`${nom} : choisissez le lot fournisseur (traçabilité).`); return; }
    const type = fournitureTypeDe(p);
    const fm = fournitureFormat(p); if (type === 'bouteille' && fm && F.length && !F.includes(fm)) out.push(`${nom} : format ${(tirageFormat(fm) || {}).label || fm} absent de ce tirage.`);
    const q = x.manuel || x.calc == null ? num(x.qty) : num(x.calc); if (fournitureSuivi(p) && R && q > arrivalRest(R, a) + 1e-6) out.push(`${nom} (lot ${a.numLot}) : ${fmt(q)} pour ${fmt(arrivalRest(R, a))} en stock.`);
  });
  return out;
}

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
