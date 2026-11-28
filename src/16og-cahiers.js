/* ============ CAHIERS DES CHARGES DES APPELLATIONS FRANÇAISES (0.50.0-alpha.3) ============
   Données dans le code (16of-cahiers-donnees.js, généré par tools/cahiers-donnees.py depuis les cahiers des charges homologués en vigueur),
   jamais dans la base. Trois usages (réglage validé) :
   - fiche « Cahier des charges » de chaque appellation (Paramètres › Vignoble › Appellations) : cépages, rendements, richesse en sucre, TAV,
     enrichissement, sucres, élevage, mise en marché, pratiques imposées ou interdites, conditionnement, texte et version ;
   - alertes NON bloquantes : cépage hors cahier des charges dans un lot ou une parcelle, enrichissement interdit, TAV total au-delà du
     maximum, rendement en kg/ha au-delà du plafond (Champagne : pesées de la parcelle) — jamais un refus ;
   - pré-réglages proposés : cépages de l'appellation absents de la liste (ajout à confirmer), seuil d'enrichissement affiché.
   Niveau 1 : le référentiel (appRef) reprend les catégories et couleurs corrigées, les appellations ajoutées et les dénominations / mentions
   relevées (cdcAppliquerRef, appelé par appRef) ; une appellation que le texte dit inexistante est marquée etat « abrogee » (hors vigueur).
   Une dénomination rattachée (DGC, mention) suit le cahier des charges de son appellation parente. */
let _cdc = null;
function cdcListe() {
  if (_cdc) return _cdc; _cdc = {};
  const S = typeof CDC_SOURCES !== 'undefined' ? CDC_SOURCES : []; const F = typeof CDC_FICHES !== 'undefined' ? CDC_FICHES : [];
  (typeof CDC_TXT !== 'undefined' ? CDC_TXT : []).forEach(([id, nom, region, signe, statut, cats, coul, den, fi, si, version, v, remarque]) => {
    if (!id) return; _cdc[id] = { id, nom, region, signe, statut, cats, coul, denominations: (den || []).map(([n, type, c, k]) => ({ nom: n, type, cats: c, coul: k })), fiche: F[fi] || { t: [], p: {} }, source: S[si] || '', version: version || '', verifie: v === 1, remarque: remarque || '' };
  });
  return _cdc;
}
const CDC_CODES_CAT = { t: 'tranquille', e: 'effervescent', p: 'petillant', a: 'ancestrale', d: 'doux', v: 'vdn', s: 'sous_voile' };
const CDC_CODES_COUL = { b: 'blanc', o: 'rose', r: 'rouge' };
const CDC_COUL_DE = { blanc: 'b', rose: 'o', rouge: 'r' };
// niveau 1 : corrections du référentiel (appelé par appRef sur la liste en construction)
function cdcAppliquerRef(L) {
  const C = cdcListe(); const ids = new Set(L.map((a) => a.id)); const parNom = {}; L.forEach((a) => { parNom[`${a.region}|${norm(a.nom).trim()}`] = a; });
  const cats = (s) => String(s || '').split('').map((x) => CDC_CODES_CAT[x]).filter(Boolean); const couls = (s) => String(s || '').split('').map((x) => CDC_CODES_COUL[x]).filter(Boolean);
  Object.values(C).forEach((c) => {
    const a = L.find((x) => x.id === c.id);
    if (a) {
      a.cdc = true; if (c.verifie && c.source) { a.source = c.source; a.version = c.version; a.verifie = true; }
      if (c.statut === 'corrigee') { if (c.cats) { a.libre = c.cats === '*'; a.cats = a.libre ? [] : cats(c.cats); } if (c.coul) a.couleurs = couls(c.coul); if (c.nom && norm(c.nom) !== norm(a.nom)) { if (c.nom.length <= 60 && !/[(«»+]/.test(c.nom)) { a.alias = uniq([...(a.alias || []), a.nom]); a.nom = c.nom; } else if (!(a.alias || []).includes(c.nom)) a.alias = [...(a.alias || []), c.nom]; } } // nouveau nom officiel (Blaye → Blavia) : l'ancien reste cherchable ; identifiant inchangé
      if (c.statut === 'inexistante' && a.etat !== 'annulee') a.etat = 'abrogee';
      if (c.verifie && (c.statut === 'confirmee' || c.statut === 'corrigee') && a.etat === 'demande') a.etat = ''; // homologuée depuis le relevé (Laudun, 21/11/2024)
    } else if (c.statut === 'ajout' && c.nom && !ids.has(c.id)) {
      ids.add(c.id); L.push({ id: c.id, nom: c.nom, region: c.region, pays: 'france', signe: c.signe || 'AOP', eu: c.signe === 'IGP' ? 'IGP' : 'AOP', sousRegion: '', libre: c.cats === '*', cats: c.cats === '*' ? [] : cats(c.cats), couleurs: couls(c.coul), verifie: !!c.verifie, etat: '', source: c.source, version: c.version, complement: true, genre: 'aop', parentId: '', alias: [], cdc: true });
    }
    const parent = L.find((x) => x.id === c.id); if (!parent) return;
    c.denominations.forEach((dn) => { // dénominations et mentions relevées : ajoutées si absentes (nom normalisé, même région)
      const k = `${parent.region}|${norm(dn.nom).trim()}`; if (parNom[k] || norm(dn.nom).trim() === norm(parent.nom).trim()) return; const id = `${parent.region}:${norm(dn.nom)}`; if (ids.has(id)) return;
      ids.add(id); const x = { id, nom: dn.nom, region: parent.region, pays: 'france', signe: parent.signe, eu: parent.eu, sousRegion: parent.sousRegion, libre: false, cats: dn.cats ? cats(dn.cats) : parent.cats, couleurs: dn.coul ? couls(dn.coul) : parent.couleurs, verifie: !!c.verifie, etat: '', source: c.source, version: c.version, complement: true, genre: 'dgc', parentId: parent.id, alias: [], mention: dn.type };
      parNom[k] = x; L.push(x);
    });
  });
  return L;
}
// cahier des charges d'une appellation du référentiel (une dénomination rattachée → celui de son appellation parente)
function cdcDe(refId) {
  const C = cdcListe(); if (C[refId]) return C[refId];
  const a = typeof appRefDef === 'function' ? appRefDef(refId) : null; return a && a.parentId && C[a.parentId] ? { ...C[a.parentId], denomination: a.nom } : null;
}
// cahier des charges d'une appellation de la liste de l'exploitation
const cdcDeListe = (db, appId) => { const a = ((db.lists && db.lists.appellations) || []).find((x) => x && x.id === appId); return a && a.ref && a.ref.id ? cdcDe(a.ref.id) : null; };
// blocs techniques pour une couleur (blanc | rose | rouge) et/ou une catégorie (codes ou noms) ; sans précision : tous
function cdcBlocs(cdc, o) {
  const T = (cdc && cdc.fiche && cdc.fiche.t) || []; const x = o || {}; const c = CDC_COUL_DE[x.couleur] || x.couleur || ''; const k = x.categorie || '';
  const L = T.filter((b) => (!c || !b.c || b.c === c) && (!k || !b.k || b.k === k)); return L.length ? L : (c ? T.filter((b) => !b.c || b.c === c) : T);
}
// nom de cépage d'un cahier des charges (« Chardonnay B », « Côt N (malbec) ») → noms normalisés (couleur retirée, synonymes)
function cdcCepageNoms(s) {
  const t = String(s || ''); const syn = (t.match(/\(([^)]*)\)/) || [])[1] || ''; const base = t.replace(/\([^)]*\)/g, ' ').replace(/\s+(B|N|G|Rs|Rg|R|GR)\s*$/u, '').trim();
  return uniq([base, ...syn.split(/[,;]|\bou\b/).map((x) => x.replace(/\s+(B|N|G|Rs|Rg|R)\s*$/u, '').trim())].map((x) => norm(x).replace(/[-’']/g, ' ').replace(/\s+/g, ' ').trim()).filter((x) => x && x.length > 2 && !/^(variete|interet|convention|sous|a fin)/.test(x)));
}
const cdcCepNorm = (s) => norm(s).replace(/\s*\([^)]*\)/g, '').replace(/[-’']/g, ' ').replace(/\s+/g, ' ').trim();
// cépages autorisés (principaux et accessoires) des blocs choisis ; null si le cahier n'en cite aucun
function cdcCepagesAutorises(cdc, o) {
  const B = cdcBlocs(cdc, o); const noms = new Set(); const lib = [];
  B.forEach((b) => [...(b.cp || []), ...(b.ca || [])].forEach((c) => { cdcCepageNoms(c).forEach((n) => noms.add(n)); if (!lib.includes(c)) lib.push(c); }));
  return noms.size ? { noms, libelles: lib } : null;
}
// un cépage de la liste de l'exploitation est-il autorisé ? true | false | null (inconnu : pas de cépage cité)
function cdcCepageAutorise(db, cdc, cepageId, o) {
  const A = cdcCepagesAutorises(cdc, o); if (!A) return null; const c = ((db.lists && db.lists.cepages) || []).find((x) => x.id === cepageId); if (!c || /^autres?\b/i.test(String(c.label || '').trim())) return null; // « Autre (…) » : cépage non précisé
  const n = cdcCepNorm(c.label); return [...A.noms].some((x) => x === n || x.startsWith(`${n} `) || n.startsWith(`${x} `)) ? true : false;
}
const cdcEnrichInterdit = (cdc, o) => { const B = cdcBlocs(cdc, o); return B.length > 0 && B.every((b) => /^\s*interdit/i.test(b.en || '')); };
const cdcTavTotalMax = (cdc, o) => { const v = cdcBlocs(cdc, o).map((b) => b.tt).filter((x) => hasNum(x)); return v.length ? Math.max(...v) : null; };
const cdcRendementKg = (cdc, o) => { const v = cdcBlocs(cdc, o).map((b) => b.rk).filter((x) => hasNum(x)); return v.length ? Math.max(...v) : null; };

/* ---------- alertes non bloquantes ---------- */
// lot : appellations au prorata de ses parcelles (lotAppellations) → cépages, enrichissement, TAV total
function cdcAlertesLot(db, R, lotId) {
  const out = []; const lot = (R && R.lots && R.lots[lotId]) || lotById(db, lotId); if (!lot) return out;
  const coul = lot.couleur || ''; const comp = composition(db, R, lotId); const cep = comp.cepages || {};
  (typeof lotAppellations === 'function' ? lotAppellations(db, R, lotId) : []).filter((x) => x.appId).forEach((x) => {
    const cdc = cdcDeListe(db, x.appId); if (!cdc) return; const o = { couleur: coul };
    Object.keys(cep).filter((k) => cep[k] > 1e-6).forEach((k) => { if (cdcCepageAutorise(db, cdc, k, o) === false) out.push({ type: 'cepage', appellation: x.label, cepageId: k, part: cep[k], msg: `${lbl(db, 'cepages', k)} (${fmt(cep[k] * 100, 0)} %) n’est pas un cépage du cahier des charges « ${x.label} ».` }); });
    const enr = (db.ops || []).filter((op) => op && op.sousType === 'enrichissement' && ((op.lignes || []).length || op.lotId) && opTouchesLot(R, op, lotId));
    if (enr.length && cdcEnrichInterdit(cdc, o)) out.push({ type: 'enrichissement', appellation: x.label, msg: `Enrichissement enregistré alors que le cahier des charges « ${x.label} » l’interdit.` });
    const tt = cdcTavTotalMax(cdc, o); const tav = derniereValeurLot(db, lotId, 'tav');
    if (tt != null && tav != null && tav > tt + 1e-9) out.push({ type: 'tav', appellation: x.label, msg: `TAV de ${fmt(tav, 1)} % vol au-delà du TAV total maximum (${fmt(tt, 1)} % vol) du cahier des charges « ${x.label} ».` });
  });
  return out;
}
const opTouchesLot = (R, op, lotId) => ((R && R.opsByLot && R.opsByLot[lotId]) || []).some((x) => x === op.id || (x && x.id === op.id));
function derniereValeurLot(db, lotId, param) { const A = (db.analyses || []).filter((a) => a && a.lotId === lotId && a.valeurs && hasNum(a.valeurs[param])).sort(byDate); return A.length ? num(A[A.length - 1].valeurs[param]) : null; }
// parcelle : cépage et rendement en kg/ha (pesées de la parcelle sur une campagne)
function cdcAlertesParcelle(db, R, parcelleId, camp) {
  const out = []; const p = (db.parcelles || []).find((x) => x && x.id === parcelleId); if (!p || !p.appellationId) return out;
  const cdc = cdcDeListe(db, p.appellationId); if (!cdc) return out; const app = ((db.lists.appellations || []).find((x) => x.id === p.appellationId) || {}).label || '';
  if (p.cepageId && cdcCepageAutorise(db, cdc, p.cepageId, {}) === false) out.push({ type: 'cepage', msg: `${lbl(db, 'cepages', p.cepageId)} n’est pas un cépage du cahier des charges « ${app} ».` });
  const rk = cdcRendementKg(cdc, {}); const ha = num(p.surface) / 100;
  if (rk && ha > 0 && R) { const kg = sum(Object.values(R.raisins || {}).filter((r) => r.parcelleId === p.id && (!camp || (r.date >= camp.debut && r.date <= camp.fin))), (r) => num(r.kg)); if (kg / ha > rk + 1e-6) out.push({ type: 'rendement', msg: `Rendement de ${fmt(kg / ha, 0)} kg/ha au-delà du plafond (${fmt(rk, 0)} kg/ha) du cahier des charges « ${app} ».` }); }
  return out;
}

/* ---------- pré-réglages (à confirmer) ---------- */
// cépages de l'appellation absents de la liste de l'exploitation (libellé sans la lettre de couleur)
function cdcCepagesManquants(db, appId) {
  const cdc = cdcDeListe(db, appId); const A = cdc && cdcCepagesAutorises(cdc, {}); if (!A) return [];
  const L = ((db.lists && db.lists.cepages) || []).map((c) => cdcCepNorm(c.label));
  return uniq(A.libelles.map((c) => c.replace(/\([^)]*\)/g, '').replace(/\s+(B|N|G|Rs|Rg|R|GR)\s*$/u, '').trim()).filter((c) => c && !/vari[ée]t[ée] d.int[ée]r[êe]t/i.test(c)))
    .filter((c) => !L.some((x) => x === cdcCepNorm(c) || x.startsWith(`${cdcCepNorm(c)} `) || cdcCepNorm(c).startsWith(`${x} `)));
}
function cdcCepagesAjouter(db, appId, noms) {
  const M = cdcCepagesManquants(db, appId); const L = (noms || M).filter((n) => M.includes(n)); if (!L.length) return fail('Aucun cépage à ajouter.');
  if (!Array.isArray(db.lists.cepages)) db.lists.cepages = [];
  L.forEach((n) => { let id = `cep_${norm(n).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24)}`; let k = 2; while (db.lists.cepages.some((c) => c.id === id)) { id = `${id}_${k}`; k += 1; } db.lists.cepages.push({ id, label: n }); });
  return okr({ n: L.length });
}
