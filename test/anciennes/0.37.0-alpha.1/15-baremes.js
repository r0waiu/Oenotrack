/* ============ BARÈMES DE JAUGEAGE : tables d'épalement des cuves, certificats de jaugeage des citernes (0.17.0-alpha.1) ============
   db.baremes : [{ id, nom, cible: 'contenant' | 'citerne', contenantId, immat, compartiment,
                   mesure: 'hauteur' (niveau du liquide depuis le fond) | 'creux' (vide mesuré depuis le haut),
                   points: [[cm, litres], …] triés par hauteur croissante,
                   meta: { organisme, certificat, date, validite, constructeur, numeroSerie, forme, materiau, capacite (L), hauteurTotale (cm),
                           volumeDebordement, volumeNominal, volumeMinimal (L), creuxNominal, creuxMinimal (cm), fichier, pages },
                   corrections: [{ h, lu, v, mode: 'chiffre' | 'interpole' | 'douteux' | 'manuel' }], controle, archive, docId, creeLe, modifLe,
                   fusions: [{ id, nom, plage, le }] (tables réunies à celle-ci), fusionneDans (id : table réunie à une autre, archivée) — 0.37.0-alpha.1 }]
   0.37.0-alpha.1 : pages d'une même cuve lues séparément réunies en une seule table à l'import (baremeGroupesContinus) ; fusion manuelle
   de deux tables (baremeFusionApercu, baremeFusionner, baremesListeFusion).
   Unités internes : centimètres et litres (affichage : cm et hL). Entre deux lignes du barème : interpolation linéaire.
   Toutes les versions précédentes conservent cette collection telle quelle (collection inconnue = gardée). */
const BAREME_FORMAT = 'oenotrack-baremes';
const JAUGE_H = { mm: 0.1, cm: 1, dm: 10, m: 100 }; // → cm
const JAUGE_V = { l: 1, dal: 10, hl: 100, m3: 1000 }; // → litres
const JAUGE_UNITES_H = [['cm', 'cm'], ['mm', 'mm'], ['m', 'm']];
const JAUGE_UNITES_V = [['l', 'litres'], ['hl', 'hL'], ['m3', 'm³']];

const baremePts = (b) => (Array.isArray(b && b.points) ? b.points : []).filter((p) => Array.isArray(p) && Number.isFinite(+p[0]) && Number.isFinite(+p[1])).map((p) => [+p[0], +p[1]]).sort((a, c) => a[0] - c[0]);
// sens du barème : +1 le volume croît avec la mesure (hauteur), −1 il décroît (creux)
function baremeSens(b) { const P = baremePts(b); if (P.length < 2) return b && b.mesure === 'creux' ? -1 : 1; return P[P.length - 1][1] >= P[0][1] ? 1 : -1; }
// indice du volume maximal : premier (barème en hauteur, la suite est ignorée) ou dernier (barème au creux, ce qui précède est ignoré)
function baremeExtremum(P, s) { let e = 0; P.forEach((p, k) => { if (p[1] > P[e][1] || (s < 0 && p[1] === P[e][1])) e = k; }); return e; }
const immatNorm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const cmTxt = (h, d = 1) => (Number.isFinite(+h) ? `${fmt(+h, d)} cm` : '—');

// mesure (cm) → volume (L) ; hors = 'dessous' | 'dessus' quand la mesure sort du barème (volume prolongé en ligne droite)
function baremeVolume(b, h) {
  const P = baremePts(b); if (P.length < 2 || !hasNum(h)) return null; const x = num(h);
  let i; let hors = null;
  if (x < P[0][0]) { hors = 'dessous'; i = 0; } else if (x > P[P.length - 1][0]) { hors = 'dessus'; i = P.length - 2; } else {
    let lo = 0, hi = P.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m][0] <= x) lo = m; else hi = m; } i = lo;
  }
  const [h0, v0] = P[i], [h1, v1] = P[i + 1]; const v = h1 === h0 ? v0 : v0 + ((v1 - v0) * (x - h0)) / (h1 - h0);
  return { v: Math.max(0, v), hors, hMin: P[0][0], hMax: P[P.length - 1][0] };
}
// volume (L) → mesure (cm) sur la partie monotone du barème (jusqu'au volume maximal) ; hors = 'dessous' | 'dessus' (volume hors barème)
function baremeHauteur(b, v) {
  const P = baremePts(b); if (P.length < 2 || !hasNum(v)) return null; const y = num(v); const s = baremeSens(b);
  // partie utile : du début du barème jusqu'au volume extrême (au-delà, certaines tables redescendent)
  const ext = baremeExtremum(P, s);
  const Q = s > 0 ? P.slice(0, ext + 1) : P.slice(ext); // creux : volume maximal au plus petit creux
  const vMin = Math.min(...Q.map((p) => p[1])), vMax = Math.max(...Q.map((p) => p[1]));
  if (y > vMax) return { h: s > 0 ? Q[Q.length - 1][0] : Q[0][0], hors: 'dessus', vMin, vMax };
  if (y < vMin) return { h: s > 0 ? Q[0][0] : Q[Q.length - 1][0], hors: 'dessous', vMin, vMax };
  for (let k = 0; k < Q.length - 1; k += 1) {
    const a = Q[k][1], c = Q[k + 1][1];
    if ((y - a) * (y - c) <= 0) return { h: a === c ? Q[k][0] : Q[k][0] + ((Q[k + 1][0] - Q[k][0]) * (y - a)) / (c - a), hors: null, vMin, vMax };
  }
  return { h: Q[Q.length - 1][0], hors: null, vMin, vMax };
}
// entrée en cuve mesurée à l'épalement (0.34.0-alpha.1) : hauteur (ou creux) après réception → volume contenu, moins le contenu d'avant
// (stock de la cuve à la date et moûts déjà comptés dans la même entrée) ; null sans barème ni mesure
function jaugeEntreeCuve(b, h, volAvant) {
  const r = b ? baremeVolume(b, h) : null; if (!r) return null; const av = Math.max(0, num(volAvant));
  return { v: Math.max(0, r.v - av), total: r.v, avant: av, hors: r.hors, negatif: r.v < av - 0.5 };
}
// volume entre deux mesures (avant → après) : positif = volume entré
function baremeEcart(b, avant, apres) { const a = baremeVolume(b, avant), c = baremeVolume(b, apres); if (!a || !c) return null; return { v: c.v - a.v, avant: a, apres: c, hors: a.hors || c.hors }; }

// contrôles : monotonie, sauts, capacité, validité, corrections
function baremeControle(b) {
  const P = baremePts(b); const A = []; const s = baremeSens(b);
  if (P.length < 2) return [{ niveau: 'bad', msg: 'Moins de deux lignes : barème inutilisable.' }];
  const inv = []; for (let k = 1; k < P.length; k += 1) if ((P[k][1] - P[k - 1][1]) * s < 0) inv.push(P[k][0]);
  const ext = baremeExtremum(P, s);
  const queue = s > 0 ? P.length - 1 - ext : ext;
  if (queue > 0) A.push({ niveau: 'warn', msg: `Le volume ${s > 0 ? 'redescend au-delà de' : 'remonte en deçà de'} ${cmTxt(P[ext][0], 0)} (${queue} ligne${queue > 1 ? 's' : ''}) : pour retrouver une hauteur, Œnotrack s’arrête au volume maximal (${fmtL(P[ext][1])}).` });
  const inv2 = inv.filter((h) => (s > 0 ? h <= P[ext][0] : h >= P[ext][0]));
  if (inv2.length) A.push({ niveau: 'warn', msg: `Volume qui ${s > 0 ? 'baisse' : 'augmente'} entre deux lignes à ${inv2.slice(0, 4).map((h) => cmTxt(h, 0)).join(', ')}${inv2.length > 4 ? '…' : ''} : vérifiez ces valeurs.` });
  const pas = []; for (let k = 1; k < P.length; k += 1) pas.push(P[k][0] - P[k - 1][0]); const pm = mediane(pas);
  const trous = pas.filter((d) => d > pm * 2.5).length; if (trous) A.push({ niveau: 'info', msg: `${trous} saut${trous > 1 ? 's' : ''} de hauteur dans le tableau : les valeurs manquantes sont interpolées.` });
  const m = (b && b.meta) || {}; const vMax = Math.max(...P.map((p) => p[1]));
  if (hasNum(m.capacite) && num(m.capacite) > 0 && Math.abs(vMax - num(m.capacite)) / num(m.capacite) > 0.03) A.push({ niveau: 'info', msg: `Capacité annoncée ${fmtL(num(m.capacite))}, volume maximal du tableau ${fmtL(vMax)}.` });
  if (m.validite && String(m.validite) < todayISO()) A.push({ niveau: 'warn', msg: `Certificat de jaugeage expiré depuis le ${fmtDate(m.validite)}.` });
  const corr = (b.corrections || []).filter((c) => c.mode !== 'manuel');
  if (corr.length) A.push({ niveau: 'info', msg: `${corr.length} valeur${corr.length > 1 ? 's' : ''} mal lue${corr.length > 1 ? 's' : ''} sur le document, corrigée${corr.length > 1 ? 's' : ''} d’après les lignes voisines : à vérifier sur le cahier.` });
  return A;
}
function mediane(L) { const a = L.filter((x) => Number.isFinite(x)).sort((x, y) => x - y); if (!a.length) return NaN; const k = a.length >> 1; return a.length % 2 ? a[k] : (a[k - 1] + a[k]) / 2; }

const baremeActifs = (db) => (db.baremes || []).filter((b) => b && !b.archive);
// barème en service d'un contenant (le plus récent)
function baremeDe(db, contId) {
  if (!contId) return null; const L = baremeActifs(db).filter((b) => b.cible !== 'citerne' && b.contenantId === contId);
  return L.sort((a, b) => String((b.meta || {}).date || b.creeLe || '').localeCompare(String((a.meta || {}).date || a.creeLe || '')))[0] || null;
}
// compartiments d'une citerne (par immatriculation)
function baremesCiterne(db, immat) { const k = immatNorm(immat); if (!k) return []; return baremeActifs(db).filter((b) => b.cible === 'citerne' && immatNorm(b.immat) === k).sort((a, b) => num(a.compartiment) - num(b.compartiment) || String(a.compartiment).localeCompare(String(b.compartiment))); }
function citernesConnues(db) { const m = new Map(); baremeActifs(db).filter((b) => b.cible === 'citerne' && b.immat).forEach((b) => { const k = immatNorm(b.immat); if (!m.has(k)) m.set(k, { immat: b.immat, compartiments: [] }); m.get(k).compartiments.push(b); }); return [...m.values()]; }
const baremePlage = (b) => { const P = baremePts(b); if (!P.length) return ''; const v = P.map((p) => p[1]); return `${fmt(P[0][0], P[0][0] % 1 ? 1 : 0)} à ${fmt(P[P.length - 1][0], P[P.length - 1][0] % 1 ? 1 : 0)} cm · ${fmtL(Math.min(...v))} à ${fmtL(Math.max(...v))}`; };
function baremeTexte(b) { if (!b) return ''; const m = b.meta || {}; return [b.mesure === 'creux' ? 'creux' : null, baremePlage(b), m.organisme ? titreCourt(m.organisme) : null, m.date ? `jaugé le ${fmtDate(m.date)}` : null].filter(Boolean).join(' · '); }
const titreCourt = (s) => String(s || '').toLowerCase().replace(/(^|[\s\-'’])([a-zà-ÿ])/g, (x, a, c) => a + c.toUpperCase()).slice(0, 60);
function baremeResume(db, contId) { const b = baremeDe(db, contId); return b ? baremeTexte(b) : ''; }
function fabricantsConnus(db) {
  const L = [...(db.contenants || []).map((c) => c.fabricant), ...(db.baremes || []).map((b) => (b.meta || {}).constructeur)].map((x) => String(x || '').trim()).filter((x) => x && x !== '-');
  const vus = new Map(); L.forEach((x) => { const k = norm(x); if (!vus.has(k)) vus.set(k, x); }); return [...vus.values()].sort((a, b) => a.localeCompare(b, 'fr'));
}
// hauteur attendue dans un contenant pour un volume donné (null : pas de barème)
function hauteurAttendue(db, contId, volL) { const b = baremeDe(db, contId); if (!b || !hasNum(volL)) return null; const r = baremeHauteur(b, num(volL)); return r ? { ...r, bareme: b } : null; }

// ---------- enregistrement ----------
function baremeNettoyer(s) {
  const pts = baremePts(s); const out = []; pts.forEach((p) => { const h = Math.round(p[0] * 1000) / 1000, v = Math.round(p[1] * 1000) / 1000; if (out.length && out[out.length - 1][0] === h) out[out.length - 1] = [h, v]; else out.push([h, v]); });
  return out;
}
function baremeSave(db, s, id) {
  if (!Array.isArray(db.baremes)) db.baremes = [];
  const points = baremeNettoyer(s); if (points.length < 2) return fail('Le barème doit avoir au moins deux lignes (hauteur, volume).');
  const cible = s.cible === 'citerne' ? 'citerne' : 'contenant';
  if (cible === 'citerne' && !immatNorm(s.immat)) return fail('Indiquez l’immatriculation de la citerne.');
  if (cible === 'contenant' && s.contenantId && !db.contenants.some((c) => c.id === s.contenantId)) return fail('Contenant introuvable.');
  const item = { nom: String(s.nom || '').trim() || (cible === 'citerne' ? `${s.immat} · compartiment ${s.compartiment || '?'}` : 'Barème'), cible, contenantId: cible === 'contenant' ? s.contenantId || '' : '', immat: cible === 'citerne' ? String(s.immat || '').trim().toUpperCase() : '', compartiment: cible === 'citerne' ? String(s.compartiment || '').trim() : '',
    mesure: s.mesure === 'creux' ? 'creux' : 'hauteur', points, meta: { ...(s.meta || {}) }, corrections: Array.isArray(s.corrections) ? s.corrections.slice(0, 500) : [], modifLe: new Date().toISOString() };
  if (s.controle) item.controle = s.controle; if (s.docId) item.docId = s.docId;
  if (id) { const b = db.baremes.find((x) => x.id === id); if (!b) return fail('Barème introuvable.'); Object.assign(b, item); return okr({ id }); }
  const nb = { id: nid(db, 'bm'), ...item, creeLe: new Date().toISOString() }; db.baremes.push(nb);
  // un seul barème en service par contenant (ou par compartiment) : l'ancien est archivé
  db.baremes.forEach((x) => { if (x.id !== nb.id && !x.archive && ((cible === 'contenant' && nb.contenantId && x.cible !== 'citerne' && x.contenantId === nb.contenantId) || (cible === 'citerne' && x.cible === 'citerne' && immatNorm(x.immat) === immatNorm(nb.immat) && String(x.compartiment) === String(nb.compartiment)))) x.archive = true; });
  return okr({ id: nb.id });
}
function baremeLier(db, id, contId) { const b = (db.baremes || []).find((x) => x.id === id); if (!b) return fail('Barème introuvable.'); if (contId && !db.contenants.some((c) => c.id === contId)) return fail('Contenant introuvable.'); b.cible = 'contenant'; b.contenantId = contId || ''; b.archive = false; b.modifLe = new Date().toISOString(); (db.baremes || []).forEach((x) => { if (x.id !== id && contId && !x.archive && x.cible !== 'citerne' && x.contenantId === contId) x.archive = true; }); return okr(); }
function baremeDelete(db, id) { const b = (db.baremes || []).find((x) => x.id === id); if (!b) return fail('Barème introuvable.'); db.baremes = db.baremes.filter((x) => x.id !== id); return okr({ docId: b.docId || null }); }
function baremeArchiver(db, id, archive = true) { const b = (db.baremes || []).find((x) => x.id === id); if (!b) return fail('Barème introuvable.'); b.archive = !!archive; b.modifLe = new Date().toISOString(); return okr(); }
// ---------- fusion de deux tables de jaugeage en une seule (0.37.0-alpha.1) ----------
// a garde ses valeurs aux hauteurs communes ; b complète les hauteurs que a n'a pas. → aperçu sans rien modifier
function baremeFusionApercu(a, b) {
  if (!a || !b) return { refus: 'Barème introuvable.' };
  if ((a.cible === 'citerne') !== (b.cible === 'citerne')) return { refus: 'Un barème de citerne ne se fusionne qu’avec un compartiment de citerne.' };
  if (a.cible === 'citerne' && immatNorm(a.immat) !== immatNorm(b.immat)) return { refus: 'Ces compartiments n’appartiennent pas à la même citerne.' };
  const A = baremePts(a), B = baremePts(b); if (A.length < 2 || B.length < 2) return { refus: 'Chaque barème doit avoir au moins deux lignes.' };
  const cle = (h) => (Math.round(h * 1000) / 1000).toFixed(3); const mA = new Map(A.map((p) => [cle(p[0]), p[1]]));
  const ajout = B.filter((p) => !mA.has(cle(p[0]))); const communs = B.filter((p) => mA.has(cle(p[0])));
  const conflits = communs.filter((p) => { const v = mA.get(cle(p[0])); return Math.abs(v - p[1]) > Math.max(1, Math.abs(v) * 0.005); }).map((p) => ({ h: p[0], va: mA.get(cle(p[0])), vb: p[1] }));
  const points = baremeNettoyer({ points: [...A, ...ajout] }); const fus = { ...a, points };
  const [x0, x1] = [A[0][0], A[A.length - 1][0]]; const [y0, y1] = [B[0][0], B[B.length - 1][0]];
  const pas = mediane(points.slice(1).map((p, k) => p[0] - points[k][0]).filter((x) => x > 0)) || 1; const ecart = y0 > x1 ? y0 - x1 : x0 > y1 ? x0 - y1 : 0; const trou = ecart > pas * 1.5 ? ecart : 0; // tables à la suite : pas de trou
  const s = baremeSens(fus); const P = baremePts(fus); const e = baremeExtremum(P, s); let inv = 0; for (let k = 1; k < P.length; k += 1) if ((s > 0 ? k <= e : k - 1 >= e) && (P[k][1] - P[k - 1][1]) * s < 0) inv += 1;
  const alertes = [];
  if ((a.mesure === 'creux') !== (b.mesure === 'creux')) alertes.push('Les deux barèmes ne mesurent pas la même chose (hauteur de liquide / creux) : vérifiez avant de fusionner.');
  if (trou) alertes.push(`Trou de ${fmt(trou, trou % 1 ? 1 : 0)} cm entre les deux tableaux : les volumes y seront calculés par interpolation.`);
  if (conflits.length) alertes.push(`${conflits.length} hauteur(s) en commun avec des volumes différents : les valeurs du premier barème sont gardées.`);
  if (inv) alertes.push(`${inv} volume(s) en sens inverse après la fusion : vérifiez le tableau.`);
  return { points, ajout: ajout.length, communs: communs.length, conflits, trou, alertes, plage: baremePlage(fus) };
}
// fusion enregistrée : a reçoit les lignes de b (contenant, document et renseignements manquants compris) ; b est archivé, jamais supprimé
function baremeFusionner(db, idA, idB) {
  const L = db.baremes || []; const a = L.find((x) => x.id === idA); const b = L.find((x) => x.id === idB);
  if (!a || !b) return fail('Barème introuvable.'); if (a.id === b.id) return fail('Choisissez deux barèmes différents.');
  const ap = baremeFusionApercu(a, b); if (ap.refus) return fail(ap.refus);
  const garde = new Set(ap.points.map((p) => (Math.round(p[0] * 1000) / 1000).toFixed(3))); const deA = new Set(baremePts(a).map((p) => (Math.round(p[0] * 1000) / 1000).toFixed(3)));
  a.points = ap.points; a.corrections = [...(a.corrections || []), ...(b.corrections || []).filter((c) => { const k = (Math.round(num(c.h) * 1000) / 1000).toFixed(3); return garde.has(k) && !deA.has(k); })];
  const ma = { ...(a.meta || {}) }; Object.keys(b.meta || {}).forEach((k) => { if (k !== 'pages' && (ma[k] == null || ma[k] === '')) ma[k] = b.meta[k]; });
  if ((b.meta || {}).pages && (!ma.fichier || ma.fichier === b.meta.fichier)) ma.pages = uniq([...(ma.pages || []), ...b.meta.pages]).sort((x, y) => x - y);
  a.meta = ma; if (!a.docId && b.docId) a.docId = b.docId; if (a.cible !== 'citerne' && !a.contenantId && b.contenantId) a.contenantId = b.contenantId;
  if (b.fiabilite === 'faible' || (b.fiabilite === 'moyenne' && a.fiabilite === 'bonne')) a.fiabilite = b.fiabilite;
  const le = new Date().toISOString(); a.fusions = [...(Array.isArray(a.fusions) ? a.fusions : []), { id: b.id, nom: b.nom || '', plage: baremePlage(b), le }]; a.archive = false; a.modifLe = le;
  b.archive = true; b.fusionneDans = a.id; b.modifLe = le;
  return okr({ id: a.id, ajout: ap.ajout, conflits: ap.conflits.length });
}
// fusion dans une liste lue (import, avant enregistrement) : le tableau j est réuni au tableau i → nouvelle liste
function baremesListeFusion(L, i, j) {
  const a = L[i], b = L[j]; const ap = baremeFusionApercu(a, b); if (ap.refus) return null;
  const m = { ...(a.meta || {}) }; Object.keys(b.meta || {}).forEach((k) => { if (k !== 'pages' && (m[k] == null || m[k] === '')) m[k] = b.meta[k]; }); m.pages = uniq([...((a.meta || {}).pages || []), ...((b.meta || {}).pages || [])]).sort((x, y) => x - y);
  const garde = new Set(baremePts(a).map((p) => (Math.round(p[0] * 1000) / 1000).toFixed(3)));
  const c = { ...a, points: ap.points, meta: m, corrections: [...(a.corrections || []), ...(b.corrections || []).filter((x) => !garde.has((Math.round(num(x.h) * 1000) / 1000).toFixed(3)))], fiabilite: [a.fiabilite, b.fiabilite].includes('faible') ? 'faible' : [a.fiabilite, b.fiabilite].includes('moyenne') ? 'moyenne' : a.fiabilite };
  return L.map((x, k) => (k === i ? c : x)).filter((x, k) => k !== j);
}

/* ---------- lecture des cahiers d'épalement ----------
   Une page = { n, w, h, items: [{ s, x, y, w, h }] } : texte positionné (x bord gauche, y ligne de base, origine en haut à gauche),
   tel que le donnent pdf.js (PDF « texte », PDF d'Adobe Scan…), la reconnaissance de caractères (scans, photos) ou un tableau collé. */
const PLIER = { à: 'a', â: 'a', ä: 'a', á: 'a', é: 'e', è: 'e', ê: 'e', ë: 'e', î: 'i', ï: 'i', í: 'i', ô: 'o', ö: 'o', ó: 'o', ù: 'u', û: 'u', ü: 'u', ú: 'u', ç: 'c', œ: 'o', æ: 'a', '’': "'", ' ': ' ', ' ': ' ', '³': '3' };
const plier = (s) => String(s || '').toLowerCase().split('').map((c) => (PLIER[c] !== undefined ? PLIER[c] : c)).join(''); // même longueur que l'original
// nombre écrit à la française (virgule), tolérant aux défauts de lecture : « Q,850 », « 0.920 », « 3, 191 »
function nombreJauge(s0) {
  let s = String(s0 == null ? '' : s0).trim().replace(/[  ]/g, ' ');
  if (!s) return NaN;
  const chiffres = (s.match(/\d/g) || []).length; const lettres = (s.match(/[a-zA-Z]/g) || []).length;
  if (!chiffres || lettres > 1 || (lettres && chiffres < 2)) return NaN;
  s = s.replace(/^[|[\](){}!:;?_"'*`~«»<>]+|[|[\](){}!:;?_"'*`~«»<>,.]+$/g, ''); // cadres et séparateurs de colonnes collés au nombre
  s = s.replace(/[OoQD]/g, '0').replace(/[Il|]/g, '1').replace(/[Ss]/g, '5').replace(/[Bb]/g, '8').replace(/[Zz]/g, '2');
  s = s.replace(/^[^\d,.\-]+|[^\d]+$/g, '').replace(/(\d)[,.]\s+(\d)/g, '$1,$2').replace(/\s+/g, '');
  if (!/^-?[\d.,]+$/.test(s) || /^[,.]/.test(s)) return NaN;
  const nv = (s.match(/,/g) || []).length, np = (s.match(/\./g) || []).length;
  if (nv + np > 1) { const d = Math.max(s.lastIndexOf(','), s.lastIndexOf('.')); s = s.slice(0, d).replace(/[.,]/g, '') + '.' + s.slice(d + 1); } else s = s.replace(',', '.');
  const n = Number(s); return Number.isFinite(n) ? n : NaN;
}
const decimalesDe = (s) => { const t = String(s || '').trim(); const m = t.match(/[,.](\d+)\s*$/); return m ? m[1].length : 0; };
const MOT_H = /^(cm|mm|m|dm|hauteurs?|creux|niveaux?|haut\.?|h)$/; const MOT_V = /^(litres?|l|lit\.?|hl|hectolitres?|m3|volumes?|vol\.?|v)$/;
function levenshtein(a, b) { const m = a.length, n = b.length; if (!m || !n) return m || n; let prev = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i += 1) { const cur = [i]; for (let j = 1; j <= n; j += 1) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; }
const procheDe = (t, mots) => t.length >= 5 && mots.some((w) => levenshtein(t, w) <= (t.length >= 7 ? 2 : 1));
function motCle(s, ligneForte) {
  const t = plier(s).replace(/[^a-z0-9]/g, ''); if (!t) return null;
  if (/^hauteur/.test(t) || /^creux/.test(t) || /^niveau/.test(t) || procheDe(t, ['hauteur', 'hauteurs', 'hauteurss'])) return { k: 'h', u: null, fort: true };
  if (/^volume/.test(t) || procheDe(t, ['volume', 'volumes'])) return { k: 'v', u: null, fort: true };
  if (/^litre/.test(t) || /^hectolitre/.test(t)) return { k: 'v', u: /^hecto/.test(t) ? 'hl' : 'l', fort: true };
  if (t === 'hl') return { k: 'v', u: 'hl', fort: true };
  if (t === 'm3') return { k: 'v', u: 'm3', fort: true };
  if (t === 'cm') return { k: 'h', u: 'cm', fort: true };
  if (t === 'mm') return { k: 'h', u: 'mm', fort: true };
  if (ligneForte && /^(em|om|crn|cn|cri|ern)$/.test(t)) return { k: 'h', u: 'cm', fort: false }; // « cm » mal lu sur un scan
  if (ligneForte && /^(l|ltr|lt)$/.test(t)) return { k: 'v', u: 'l', fort: false };
  if (ligneForte && /^(hi|h1|nl|bl|hil|hli)$/.test(t)) return { k: 'v', u: 'hl', fort: false };
  if (ligneForte && t === 'm') return { k: 'h', u: 'm', fort: false };
  return null;
}
// découpe un élément de texte en mots (avec leur position estimée) ; « 3, 191 » reste un seul nombre
function jaugeMots(page) {
  const out = [];
  (page.items || []).forEach((it) => {
    const s = String(it.s == null ? '' : it.s); if (!s.trim()) return; const L = s.length || 1; const re = /\S+/g; let m; const parts = [];
    while ((m = re.exec(s))) parts.push({ t: m[0], i: m.index });
    for (let k = 0; k < parts.length - 1; k += 1) if (/\d[,.]$/.test(parts[k].t) && /^\d/.test(parts[k + 1].t)) { parts[k] = { t: parts[k].t + parts[k + 1].t, i: parts[k].i, fin: parts[k + 1].i + parts[k + 1].t.length }; parts.splice(k + 1, 1); }
    // « 1 050 », « 11 264,5 » (0.22.0-alpha.1) : milliers séparés par une espace insécable, ou par une espace quand l'élément (case d'un tableur,
    // texte d'une case de PDF) n'est que ce nombre — sinon « 10 250 » peut être deux colonnes et reste deux nombres
    const seulNombre = /^-?\d{1,3}(?:[   ]\d{3})+(?:[,.]\d+)?$/.test(s.trim());
    for (let k = 0; k < parts.length - 1; k += 1) {
      const a = parts[k]; const b = parts[k + 1]; const sep = s.slice((a.fin || a.i + a.t.length), b.i);
      if ((/^-?\d{1,3}$/.test(a.t) || a.milliers) && /^\d{3}(?:[,.]\d+)?$/.test(b.t) && (/^[  ]$/.test(sep) || (sep === ' ' && seulNombre))) { parts[k] = { t: a.t + b.t, i: a.i, fin: b.i + b.t.length, milliers: true }; parts.splice(k + 1, 1); k -= 1; }
    }
    parts.forEach((p) => { const fin = p.fin || p.i + p.t.length; out.push({ s: p.t, x: it.x + (num(it.w) * p.i) / L, w: Math.max(1, (num(it.w) * (fin - p.i)) / L), y: num(it.y), h: num(it.h) || 8, gros: num(it.h) || 8 }); });
  });
  return out;
}
function jaugeLignes(mots) {
  const L = mots.slice().sort((a, b) => a.y - b.y); const lignes = [];
  const hm = mediane(L.map((m) => m.h)) || 8;
  L.forEach((m) => { const lg = lignes.length ? lignes[lignes.length - 1] : null; if (lg && Math.abs(lg.y - m.y) <= hm * 0.45) { lg.mots.push(m); lg.y = (lg.y * (lg.mots.length - 1) + m.y) / lg.mots.length; } else lignes.push({ y: m.y, mots: [m] }); });
  lignes.forEach((lg) => { lg.mots.sort((a, b) => a.x - b.x); let t = ''; let fin = null; lg.mots.forEach((m) => { if (fin != null) t += m.x - fin > hm * 1.2 ? '   ' : ' '; t += m.s; fin = m.x + m.w; }); lg.texte = t; });
  return lignes;
}
// métadonnées lues sur la page (tolérant aux défauts de lecture des scans)
function jaugeMeta(texte) {
  const T = String(texte || ''); const F = plier(T); const meta = {};
  const pris = (re, k, f) => { const m = re.exec(F); if (!m) return null; const g = m.index + m[0].length - m[k].length; const v = T.slice(g, g + m[k].length).trim(); return f ? f(v, m) : v; };
  const dateIso = (v) => { const m = /(\d{1,2})[/.](\d{1,2})[/.](\d{4})/.exec(v); if (!m) return null; const j = +m[1], mo = +m[2], a = +m[3]; return j >= 1 && j <= 31 && mo >= 1 && mo <= 12 && a >= 1950 && a <= 2100 ? `${a}-${String(mo).padStart(2, '0')}-${String(j).padStart(2, '0')}` : null; };
  const champ = (v) => { const x = (String(v || '').split(/\s{2,}/).map((y) => y.trim()).find((y) => /[A-Za-z0-9À-ÿ-]/.test(y)) || '').replace(/^[^A-Za-z0-9À-ÿ-]+/, '').replace(/[,;|]+$/, '').trim(); return x && x !== '-' ? x : ''; };
  meta.nom = pris(/reservoir\s*n\s*[°o]?\s*:?\s*([^\n]+)/, 1, (v) => champ(v.replace(/\s*detenteur.*$/i, ''))) || pris(/\bcuve\s*n\s*[°o]\s*:?\s*([^\n]+)/, 1, champ) || '';
  meta.compartiment = pris(/compartiment\s?(?:n\s*[°o]\s?|[:;.]\s?)(\d{1,2})\b/, 1) || '';
  const im = /immatriculation[^\n]{0,60}?\b([a-z]{2})\s*-?\s*(\d{3})\s*-?\s*([a-z]{2})\b/.exec(F) || /\b([a-z]{2})-(\d{3})-([a-z]{2})\b/.exec(F);
  meta.immat = im ? `${im[1]}-${im[2]}-${im[3]}`.toUpperCase() : '';
  meta.certificat = pris(/certificat de jaugeage\s*(?:n\s*(?:umero|°|o|\*|")?\.?\s*)?:?\s*([a-z0-9][a-z0-9.\-/]{5,})/, 1) || '';
  // « N° R . I3 . 18 . 00151 » (scan : espaces autour des points) → R.I3.18.00151 (0.37.0-alpha.1)
  if (!meta.certificat || meta.certificat.length < 6) meta.certificat = pris(/certificat de jaugeage\s*n\s*[°o"*]?\s*:?\s*([a-z0-9]{1,6}(?:\s{0,2}[.\-/]\s{0,2}[a-z0-9]{1,8}){2,6})/, 1, (v) => v.replace(/\s+/g, '').toUpperCase()) || meta.certificat;
  meta.date = pris(/(?:date de la\s*verification|date)\s*:?\s*(\d{1,2}[/.]\d{1,2}[/.]\d{4})/, 1, dateIso) || null;
  meta.validite = pris(/limite de\s*validite\s*:?\s*(\d{1,2}[/.]\d{1,2}[/.]\d{4})/, 1, dateIso) || null;
  meta.constructeur = pris(/constructeur\s*:?\s*([^\n]+)/, 1, champ) || '';
  meta.numeroSerie = pris(/n\s*[°o]\s*de\s*serie\s*:?\s*([a-z0-9][a-z0-9\-/.]*\d[a-z0-9\-/.]*)/, 1) || '';
  meta.forme = pris(/forme\s*:\s*([^\n]+)/, 1, champ) || pris(/description du reservoir\s+([^\n]+)/, 1, champ) || '';
  meta.materiau = pris(/materiau\s*:\s*([^\n]+)/, 1, champ) || '';
  const cap = /capacite\s*:?\s*([\d\s.,]+?)\s*(litres?|l\b|hl|m3)/.exec(F); if (cap) { const n = nombreJauge(cap[1].replace(/\s/g, '')); if (Number.isFinite(n)) meta.capacite = Math.round(n * (JAUGE_V[cap[2].startsWith('l') ? 'l' : cap[2]] || 1) * 1000) / 1000; }
  const vol = (re) => { const m = re.exec(F); if (!m) return undefined; const n = nombreJauge(m[1]); if (!Number.isFinite(n)) return undefined; const u = m[2] && /^l/.test(m[2]) ? 1 : m[2] === 'hl' ? 100 : n < 100 ? 1000 : 1; return Math.round(n * u * 1000) / 1000; };
  const lon = (re) => { const m = re.exec(F); if (!m) return undefined; const n = nombreJauge(m[1]); if (!Number.isFinite(n)) return undefined; return Math.round(n * (m[2] === 'mm' ? 0.1 : m[2] === 'cm' ? 1 : 100) * 100) / 100; };
  meta.hauteurTotale = lon(/hauteur\s*totale\s*(?:temoin)?\s*:?\s*(\d[\d.,]*)\s*(mm|cm|m)/);
  // plage de la page (« Hauteurs de 1,600 m à 3,190 m ») et volume total du réservoir : relient les pages d'une même table (0.37.0-alpha.1)
  { const m = /hauteurs?\s*de\s*(\d[\d.,]*)\s*(mm|cm|m)\s*a\s*(\d[\d.,]*)\s*(mm|cm|m)\b/.exec(F); if (m) { const k = (u) => (u === 'mm' ? 0.1 : u === 'cm' ? 1 : 100); const a = nombreJauge(m[1]), b = nombreJauge(m[3]); if (Number.isFinite(a) && Number.isFinite(b) && b > a) { meta.plageMin = Math.round(a * k(m[2]) * 100) / 100; meta.plageMax = Math.round(b * k(m[4]) * 100) / 100; } } }
  meta.volumeTotal = vol(/volume\s*total\s*:?\s*(\d[\d.,]*)\s*(m3|m|l|hl)?/);
  meta.volumeDebordement = vol(/volume\s*total\s*au\s*debordement\s*:?\s*(\d[\d.,]*)\s*(m3|m|l|hl)?/);
  meta.volumeNominal = vol(/(?<!au\s{0,3})volume\s*no\w{0,2}in\w{1,2}l\s*:?\s*(\d[\d.,]*)\s*(m3|m|l|hl)?/);
  meta.volumeMinimal = vol(/(?<!au\s{0,3})volume\s*min\w{1,3}l\s*:?\s*(\d[\d.,]*)\s*(m3|m|l|hl)?/);
  meta.creuxNominal = lon(/creux\s*corres?p\w*\s*au\s*volume\s*nominal\s*:?\s*(\d[\d.,]*)\s*(mm|cm|m)/);
  meta.creuxMinimal = lon(/creux\s*corres?p\w*\s*au\s*volume\s*minimal\s*:?\s*(\d[\d.,]*)\s*(mm|cm|m)/);
  // organisme : première ligne de l'en-tête (« … PESAGE METROLOGIE », « JCR Maintenance »…)
  const lignes = T.split('\n').map((x) => x.trim()).filter(Boolean);
  const debut = (l) => plier(l).replace(/^[^a-z0-9]+/, ''); // « ' . ANNEXE AU CERTIFICAT… » (scan) : pas un organisme
  const org = lignes.slice(0, 4).find((l) => /pesage|metrologie|jaugeage|maintenance|verification/i.test(plier(l)) && !/^(organisme de verification|annexe|certificat)/i.test(debut(l)));
  const org2 = lignes.slice(0, 4).find((l) => /maintenance|metrologie|pesage/i.test(plier(l)) && !/^(annexe|certificat)/i.test(debut(l)));
  const orgL = (org2 || org || '').replace(/\s+\d+\s*[I|/]?\s*\d+\s*$/, ''); const orgP = orgL.split(/\s{2,}/).find((x) => /pesage|metrologie|maintenance|jaugeage|verification/i.test(plier(x)));
  meta.organisme = champ(orgP || orgL) || '';
  meta.creux = /mesures? par le creux|\bcreux\b/.test(F) && /bareme/.test(F);
  meta.unitesH = /hauteurs? sont exprimees? en\s*(?:\n|\s)*(metres|centimetres|millimetres)/.exec(F); meta.unitesH = meta.unitesH ? { metres: 'm', centimetres: 'cm', millimetres: 'mm' }[meta.unitesH[1]] : null;
  meta.unitesV = /volumes? sont exprimes? en\s*(?:\n|\s)*(metres[\s-]*cubes|m3|litres|hectolitres)/.exec(F); meta.unitesV = meta.unitesV ? (/metres/.test(meta.unitesV[1]) || meta.unitesV[1] === 'm3' ? 'm3' : meta.unitesV[1] === 'hectolitres' ? 'hl' : 'l') : null;
  meta.kind = /table volumetrique/.test(F) ? 'volumetrique' : /table centimetrique|bareme centimetrique/.test(F) ? 'centimetrique' : null;
  Object.keys(meta).forEach((k) => { if (meta[k] === undefined || meta[k] === null || meta[k] === '') delete meta[k]; });
  return meta;
}

// régression robuste (Theil–Sen) : y ≈ a + b·x
function theilSen(P) {
  const pts = P.filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])); if (pts.length < 2) return null; const S = [];
  for (let i = 0; i < pts.length; i += 1) for (let j = i + 1; j < pts.length; j += 1) if (pts[j][0] !== pts[i][0]) S.push((pts[j][1] - pts[i][1]) / (pts[j][0] - pts[i][0]));
  const b = mediane(S); if (!Number.isFinite(b)) return null; const a = mediane(pts.map((p) => p[1] - b * p[0])); return { a, b };
}
// mode d'une liste de nombres arrondis à r
function modeDe(L, r) { const m = new Map(); L.forEach((x) => { if (!Number.isFinite(x)) return; const k = Math.round(x / r) * r; m.set(k.toFixed(6), (m.get(k.toFixed(6)) || 0) + 1); }); let best = null, n = 0; m.forEach((c, k) => { if (c > n) { n = c; best = Number(k); } }); return { v: best, n }; }

// inclinaison d'une page (dx/dy des colonnes de nombres), estimée sur les colonnes les plus fournies
function jaugeInclinaison(mots) {
  const C = mots.filter((m) => Number.isFinite(nombreJauge(m.s))).map((m) => ({ cx: m.x + m.w / 2, y: m.y, w: m.w })); if (C.length < 12) return 0;
  const lw = mediane(C.map((c) => c.w)) || 10; const tri = C.slice().sort((a, b) => a.cx - b.cx); const cols = [];
  tri.forEach((c) => { const k = cols[cols.length - 1]; if (k && c.cx - k.fin <= Math.max(6, lw * 0.7)) { k.c.push(c); k.fin = c.cx; } else cols.push({ c: [c], fin: c.cx }); });
  const pentes = cols.filter((k) => k.c.length >= 8).map((k) => { const f = theilSen(k.c.map((c) => [c.y, c.cx])); return f ? f.b : NaN; }).filter(Number.isFinite);
  return pentes.length >= 2 ? mediane(pentes) : 0;
}
// un tableau d'une page : colonnes de nombres groupées par paires (mesure, volume) sous un en-tête
function jaugeTableau(page) {
  let mots = jaugeMots(page);
  const incl = jaugeInclinaison(mots); if (Math.abs(incl) > 0.004) { const c = Math.cos(Math.atan(incl)), sn = Math.sin(Math.atan(incl)); mots = mots.map((m) => ({ ...m, x: m.x * c - m.y * sn, y: m.x * sn + m.y * c })); } // page de travers (scan, photo) : redressée
  const lignes = jaugeLignes(mots); const texte = lignes.map((l) => l.texte).join('\n'); const meta = jaugeMeta(texte);
  // en-tête : la ligne qui contient le plus de mots-clés (cm / litre / hl / hauteurs / volumes)
  // (ligne d'en-tête : faite presque uniquement de mots-clés — « Hauteur de creux correspondant au volume nominal » n'en est pas une)
  let tete = null; const tetes = [];
  lignes.forEach((lg, i) => {
    const forte = lg.mots.some((m) => { const k = motCle(m.s, false); return k && k.fort; });
    const ks = lg.mots.map((m) => ({ m, k: motCle(m.s, forte) })).filter((x) => x.k);
    const nb = lg.mots.filter((m) => Number.isFinite(nombreJauge(m.s))).length; const autres = lg.mots.filter((m) => /[a-zA-Zéèà]/.test(m.s) || /\d/.test(m.s)).length - nb; // « | », « : » ne comptent pas
    if (ks.length >= 2 && ks.some((x) => x.k.k === 'h') && ks.some((x) => x.k.k === 'v') && ks.length >= nb && ks.length >= autres * 0.6 && ks.filter((x) => x.k.fort).length >= 2) {
      tetes.push({ i, y: lg.y, ks }); if (!tete || ks.length > tete.ks.length) tete = { i, y: lg.y, ks };
    }
  });
  if (tete) { const hl = mediane(lignes.map((l) => mediane(l.mots.map((m) => m.h)))) || 8; tetes.forEach((x) => { if (x.i !== tete.i && Math.abs(x.y - tete.y) < hl * 2.6) tete.ks = [...tete.ks, ...x.ks.filter((k) => !tete.ks.some((z) => z.m === k.m))]; }); }
  const debut = tete ? tete.i + 1 : 0;
  // fin du tableau : première ligne de texte (phrase) après au moins une ligne de nombres
  let fin = lignes.length; let vuNb = false;
  for (let i = debut; i < lignes.length; i += 1) {
    const lg = lignes[i]; const nb = lg.mots.filter((m) => Number.isFinite(nombreJauge(m.s))).length; const mots3 = lg.mots.filter((m) => /[a-zA-Zéèà]{3,}/.test(m.s)).length;
    if (nb) vuNb = true;
    if (vuNb && !nb && (mots3 >= 3 || /exprime|cette table|bar-no|fait a|precision|garantie/.test(plier(lg.texte)))) { fin = i; break; }
  }
  const cellules = [];
  for (let i = debut; i < fin; i += 1) lignes[i].mots.forEach((m) => { if (/^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}$/.test(m.s) || /\d\s*\/\s*\d/.test(m.s)) return; const n = nombreJauge(m.s); const bruit = !Number.isFinite(n) && /[\d]/.test(m.s) && m.s.replace(/[^\d,.]/g, '').length >= 2; if (Number.isFinite(n) || bruit) cellules.push({ ...m, n: Number.isFinite(n) ? n : NaN, cx: m.x + m.w / 2 }); });
  if (cellules.length < 4) return { meta, texte, colonnes: 0, lignes: [], tete: !!tete };
  // texte reconnu sur une image (scan, PDF d'Adobe Scan…) : tailles de caractères irrégulières ; texte d'un logiciel : toutes identiques
  const hs = cellules.map((c) => c.h).filter((x) => x > 0); const hmoy = hs.reduce((a, x) => a + x, 0) / (hs.length || 1); const cv = hs.length ? Math.sqrt(hs.reduce((a, x) => a + (x - hmoy) * (x - hmoy), 0) / hs.length) / (hmoy || 1) : 0;
  const ocr = page.ocr != null ? !!page.ocr : cv > 0.035 || cellules.some((c) => !Number.isFinite(c.n));
  // colonnes : regroupement des centres horizontaux
  const lw = mediane(cellules.map((c) => c.w)) || 10; const tri = cellules.slice().sort((a, b) => a.cx - b.cx);
  let cols = []; tri.forEach((c) => { const k = cols[cols.length - 1]; if (k && c.cx - k.fin <= Math.max(6, lw * 0.7)) { k.c.push(c); k.fin = c.cx; } else cols.push({ c: [c], deb: c.cx, fin: c.cx }); });
  const nMin = Math.max(3, Math.round(cellules.length / Math.max(1, cols.length) * 0.15));
  cols = cols.filter((k) => k.c.length >= nMin).map((k) => ({ ...k, x: mediane(k.c.map((c) => c.cx)) }));
  if (cols.length < 2) return { meta, texte, colonnes: cols.length, lignes: [], tete: !!tete };
  // nature des colonnes : dans chaque paire, la colonne de gauche est l'axe régulier (1 cm, 0,01 m, 0,5 hL… d'une ligne à l'autre) ;
  // l'axe est une mesure (table centimétrique) ou un volume (table volumétrique) selon le premier mot-clé de l'en-tête
  const unites = { h: null, v: null };
  if (tete) tete.ks.forEach((x) => { if (x.k.u && !unites[x.k.k]) unites[x.k.k] = x.k.u; });
  const regularite = (k) => { const L = k.c.filter((c) => Number.isFinite(c.n)).sort((a, b) => a.y - b.y); if (L.length < 3) return 0; const d = []; for (let i = 1; i < L.length; i += 1) d.push(L[i].n - L[i - 1].n); const dec = modeDe(L.map((c) => decimalesDe(c.s)), 1).v || 0; const md = modeDe(d, Math.pow(10, -dec)); return md.v ? md.n / d.length : 0; };
  cols.forEach((k) => { k.reg = regularite(k); });
  const moy = (par) => { const L = cols.filter((k, i) => i % 2 === par); return L.length ? L.reduce((a, k) => a + k.reg, 0) / L.length : 0; };
  const parite = cols.length > 1 && moy(1) > moy(0) + 0.15 ? 1 : 0; // colonne isolée à gauche (marge) : l'axe commence à la deuxième
  let ordre = 'h'; // 'h' : table centimétrique (mesure → volume) ; 'v' : table volumétrique (volume → mesure)
  if (meta.kind) ordre = meta.kind === 'volumetrique' ? 'v' : 'h'; // « table volumétrique », « barème centimétrique » écrits sur la page
  else if (tete) { let nh = 0, nv = 0; cols.forEach((k, i) => { if (i % 2 !== parite) return; let best = null; tete.ks.forEach((x) => { const d = Math.abs((x.m.x + x.m.w / 2) - k.x); if (!best || d < best.d) best = { d, x }; }); if (best) { if (best.x.k.k === 'h') nh += 1; else nv += 1; } }); ordre = nv > nh ? 'v' : 'h'; }
  cols.forEach((k, i) => { k.k = (i % 2 === parite) ? ordre : ordre === 'h' ? 'v' : 'h'; });
  if (parite) cols = cols.slice(1);
  const paires = []; for (let i = 0; i < cols.length; i += 1) { if (cols[i].k === ordre) { const d = cols[i + 1] && cols[i + 1].k !== ordre ? cols[i + 1] : null; paires.push({ ax: cols[i], dep: d }); if (d) i += 1; } }
  const pas = mediane(lignes.slice(debut, fin).map((l, i, a) => (i ? l.y - a[i - 1].y : NaN))) || lw;
  // lignes de chaque paire : axe et valeur appariés par la hauteur sur la page
  const rangs = [];
  paires.forEach((p, ip) => {
    const A = p.ax.c.slice().sort((a, b) => a.y - b.y); const D = p.dep ? p.dep.c.slice().sort((a, b) => a.y - b.y) : []; const pris2 = new Set();
    const rows = A.map((a) => { let best = null; D.forEach((d, j) => { if (pris2.has(j)) return; const dy = Math.abs(d.y - a.y); if (dy <= pas * 0.62 && (!best || dy < best.dy)) best = { dy, j }; }); if (best) pris2.add(best.j); return { y: a.y, ax: a, dep: best ? D[best.j] : null }; });
    D.forEach((d, j) => { if (!pris2.has(j)) rows.push({ y: d.y, ax: null, dep: d }); });
    rows.sort((a, b) => a.y - b.y); rows.forEach((r) => rangs.push({ ...r, paire: ip }));
  });
  return { meta, texte, colonnes: cols.length, ordre, unites, paires: paires.length, pas, lignes: rangs, tete: !!tete, ocr };
}

// axe régulier (hauteurs de 1 cm en 1 cm, volumes de 0,5 hL en 0,5 hL…) : valeurs mal lues recalculées depuis la position
function jaugeAxe(rangs, paires, ocr = true) {
  const val = rangs.filter((r) => r.ax && Number.isFinite(r.ax.n));
  // texte exact (PDF d'un logiciel) : résolution d'après les décimales (hauteurs en mètres « 0,010 » : 0,001), sinon les lignes se confondaient (0.37.0-alpha.1)
  if (!ocr && val.length === rangs.length) { rangs.forEach((r) => { r.axe = r.ax.n; }); const d0 = modeDe(val.map((r) => decimalesDe(r.ax.s)), 1).v || 0; return { regulier: false, dec: d0, res: Math.pow(10, -d0), exact: true }; }
  const dec = modeDe(val.map((r) => decimalesDe(r.ax.s)), 1).v || 0; const res = Math.pow(10, -dec);
  const diffs = []; for (let p = 0; p < paires; p += 1) { const L = val.filter((r) => r.paire === p); for (let i = 1; i < L.length; i += 1) diffs.push(L[i].ax.n - L[i - 1].ax.n); }
  const md = modeDe(diffs.filter((d) => d > 0), res); const step = md.v; if (!step || md.n < Math.max(3, diffs.length * 0.35)) return { regulier: false, dec, res };
  const base = modeDe(val.map((r) => ((r.ax.n % step) + step) % step), res).v || 0;
  const fits = []; for (let p = 0; p < paires; p += 1) fits.push(theilSen(val.filter((r) => r.paire === p).map((r) => [r.y, r.ax.n])));
  const bGlob = mediane(fits.filter(Boolean).map((f) => f.b)); let ok = 0;
  rangs.forEach((r, i) => {
    let f = fits[r.paire];
    if (!f || !Number.isFinite(f.b) || Math.abs(f.b - bGlob) > Math.abs(bGlob) * 0.25) { const L = val.filter((x) => x.paire === r.paire); f = L.length ? { b: bGlob, a: mediane(L.map((x) => x.ax.n - bGlob * x.y)) } : null; }
    if (!f && r.paire > 0) { const prev = rangs.filter((x) => x.paire === r.paire - 1 && Number.isFinite(x.axe)); const last = prev[prev.length - 1]; if (last) { const first = rangs.find((x) => x.paire === r.paire); f = { b: bGlob, a: last.axe + step - bGlob * first.y }; } }
    if (!f) { r.axe = r.ax ? r.ax.n : NaN; return; }
    const est = f.a + f.b * r.y; const snap = Math.round((est - base) / step) * step + base; r.axe = Math.round(snap / res) * res; r.axe = Number(r.axe.toFixed(dec + 2));
    if (r.ax && Number.isFinite(r.ax.n) && Math.abs(r.ax.n - r.axe) < res / 2) ok += 1; else r.axeCorrige = true;
    rangs[i] = r;
  });
  return { regulier: true, step, dec, res, accord: val.length ? ok / val.length : 0 };
}

// valeurs mal lues : comparées à leurs voisines (la courbe d'un barème est régulière), corrigées chiffre par chiffre ou interpolées
function candidatsLecture(s, dec) {
  const t = String(s || '').replace(/[^\d,.]/g, ''); const C = new Set(); const dig = t.replace(/[,.]/g, ''); const sep = (x) => (dec > 0 && x.length > dec ? `${x.slice(0, x.length - dec)}.${x.slice(x.length - dec)}` : dec > 0 ? `0.${x.padStart(dec, '0')}` : x);
  const ajoute = (x) => { const n = Number(x); if (Number.isFinite(n)) C.add(n); };
  if (!dig) return [];
  if (/^[,.]/.test(t)) for (let d = 0; d <= 9; d += 1) ajoute(`${d}.${dig}`);
  ajoute(sep(dig));
  for (let i = 0; i < dig.length; i += 1) for (let d = 0; d <= 9; d += 1) { ajoute(sep(dig.slice(0, i) + d + dig.slice(i + 1))); ajoute(sep(dig.slice(0, i) + d + dig.slice(i))); }
  for (let d = 0; d <= 9; d += 1) ajoute(sep(dig + d));
  for (let i = 0; i < dig.length; i += 1) ajoute(sep(dig.slice(0, i) + dig.slice(i + 1)));
  if (dec > 0) for (let d = 0; d <= 9; d += 1) ajoute(sep(d + dig));
  return [...C];
}
// Lagrange : valeur en x du polynôme passant par les points P [[x, y], …] (2 à 4 points)
function lagrange(P, x) { let v = 0; for (let i = 0; i < P.length; i += 1) { let w = 1; for (let j = 0; j < P.length; j += 1) if (j !== i) w *= (x - P[j][0]) / (P[i][0] - P[j][0]); v += w * P[i][1]; } return v; }
function jaugeReparer(serie, opts = {}) {
  // serie : [{ x, s (texte lu), n (nombre lu ou NaN) }] triée par x. Sans « ocr » (texte d'un PDF fabriqué par un logiciel) : rien n'est modifié.
  const dec = opts.dec != null ? opts.dec : modeDe(serie.filter((p) => Number.isFinite(p.n)).map((p) => decimalesDe(p.s)), 1).v || 0; const res = Math.pow(10, -dec);
  const N = serie.length; const y = serie.map((p) => p.n); const X = serie.map((p) => p.x);
  const out = serie.map((p, i) => ({ x: p.x, v: y[i], s: p.s }));
  if (!opts.ocr) return { out, corrections: [], dec, res };
  let bad = y.map((v) => !Number.isFinite(v));
  const voisins = (i, n) => { const g = [], d = []; for (let k = i - 1; k >= 0 && g.length < n; k -= 1) if (!bad[k]) g.push(k); for (let k = i + 1; k < N && d.length < n; k += 1) if (!bad[k]) d.push(k); return { g, d }; };
  const pasLocal = (i) => { const L = []; for (let k = Math.max(1, i - 4); k <= Math.min(N - 1, i + 4); k += 1) if (!bad[k] && !bad[k - 1]) L.push(Math.abs(y[k] - y[k - 1]) / ((X[k] - X[k - 1]) || 1)); return mediane(L); };
  const predire = (i) => {
    const { g, d } = voisins(i, 2); const dx = mediane([g[0], d[0]].filter((k) => k != null).map((k) => Math.abs(X[k] - X[i]))) || 1;
    if (g.length && d.length) { const P = [...g.slice().reverse(), ...d].map((k) => [X[k], y[k]]); return { v: lagrange(P, X[i]), deuxCotes: true, g: g[0], d: d[0], dx }; }
    const c = g.length ? g : d; if (c.length < 2) return null;
    return { v: lagrange(c.map((k) => [X[k], y[k]]), X[i]), deuxCotes: false, dx };
  };
  const tolDe = (i, p) => { const st = (pasLocal(i) || 0) * p.dx; return p.deuxCotes ? Math.max(3 * res, 0.3 * st) : Math.max(5 * res, 1.5 * st); };
  for (let passe = 0; passe < 4; passe += 1) {
    const nb = y.map((v) => !Number.isFinite(v));
    for (let i = 0; i < N; i += 1) {
      if (nb[i]) continue; const p = predire(i); if (!p) continue; const tol = tolDe(i, p);
      let faux = Math.abs(y[i] - p.v) > tol;
      if (p.deuxCotes && (y[i] - y[p.g]) * (y[p.d] - y[i]) < 0 && Math.min(Math.abs(y[i] - y[p.g]), Math.abs(y[p.d] - y[i])) > tol) faux = true; // pic isolé (la courbe a le droit de s'infléchir)
      nb[i] = faux;
    }
    bad = nb;
  }
  const corrections = [];
  for (let i = 0; i < N; i += 1) {
    if (!bad[i]) continue;
    const p = predire(i); const brut = String(serie[i].s || '');
    if (!p) { out[i].v = NaN; continue; }
    if (!brut.replace(/[^\d]/g, '')) { // case vide : comblée seulement entre deux valeurs lues
      if (p.deuxCotes && opts.combler) { out[i].v = Math.round(p.v / res) * res; corrections.push({ i, lu: '', v: out[i].v, mode: 'interpole' }); } else out[i].v = NaN; continue;
    }
    const tol = tolDe(i, p) * (p.deuxCotes ? 1 : 0.4);
    const cands = candidatsLecture(brut, dec).map((c) => ({ c, e: Math.abs(c - p.v) })).filter((x) => x.e <= tol).sort((a, b) => a.e - b.e);
    if (cands.length) { out[i].v = cands[0].c; corrections.push({ i, lu: brut, v: cands[0].c, mode: 'chiffre' }); }
    else if (p.deuxCotes) { out[i].v = Math.round(p.v / res) * res; corrections.push({ i, lu: brut, v: out[i].v, mode: 'interpole' }); }
    else if (Number.isFinite(y[i])) corrections.push({ i, lu: brut, v: y[i], mode: 'douteux' });
    else out[i].v = NaN;
  }
  out.forEach((o) => { if (Number.isFinite(o.v)) o.v = Number(o.v.toFixed(dec + 3)); });
  return { out, corrections, dec, res };
}

// analyse d'un document complet (toutes ses pages) → barèmes proposés
function jaugeAnalyser(pages, opts = {}) {
  const tabs = []; const journal = [];
  (pages || []).forEach((page) => {
    const t = jaugeTableau(page); t.page = page.n;
    if (!t.lignes || t.lignes.length < 3) { if (t.texte && t.texte.trim()) journal.push({ page: page.n, msg: 'pas de tableau de jaugeage reconnu' }); tabs.push({ ...t, vide: true }); return; }
    const ax = jaugeAxe(t.lignes, t.paires, t.ocr);
    let rangs = t.lignes.filter((r) => Number.isFinite(r.axe) || (r.ax && Number.isFinite(r.ax.n))).map((r) => ({ ...r, axe: Number.isFinite(r.axe) ? r.axe : r.ax.n }));
    // doublons d'axe (deux cases lues au même niveau) : on garde la plus proche de sa colonne
    rangs.sort((a, b) => a.axe - b.axe); const uniq2 = []; rangs.forEach((r) => { const d = uniq2[uniq2.length - 1]; if (d && Math.abs(d.axe - r.axe) < (ax.res || 1e-9) / 2) { if (!d.dep && r.dep) uniq2[uniq2.length - 1] = r; } else uniq2.push(r); }); rangs = uniq2;
    const serie = rangs.map((r) => ({ x: r.axe, s: r.dep ? r.dep.s : '', n: r.dep ? r.dep.n : NaN }));
    const rep = jaugeReparer(serie, { combler: true, ocr: t.ocr });
    // unités
    const m = t.meta; let uH = t.unites.h || m.unitesH || null; let uV = t.unites.v || m.unitesV || null;
    const axV = rep.out.map((o) => o.x); const depV = rep.out.map((o) => o.v).filter(Number.isFinite);
    const kind = t.ordre === 'v' ? 'volumetrique' : 'centimetrique';
    const hVals = kind === 'centimetrique' ? axV : depV; const vVals = kind === 'centimetrique' ? depV : axV;
    // unités d'après l'ordre de grandeur (médiane : quelques nombres mal lus, sans virgule, ne doivent pas tromper)
    const decV = kind === 'volumetrique' ? ax.dec : rep.dec; const decH = kind === 'volumetrique' ? rep.dec : ax.dec;
    if (!uH) uH = mediane(hVals) <= 5 && decH >= 2 ? 'm' : 'cm';
    if (!uV) uV = mediane(vVals) <= 60 && decV >= 2 ? 'm3' : mediane(vVals) <= 400 && decV === 1 ? 'hl' : 'l';
    const kH = JAUGE_H[uH] || 1, kV = JAUGE_V[uV] || 1;
    const points = []; const corr = [];
    rep.out.forEach((o, i) => { if (!Number.isFinite(o.v) || !Number.isFinite(o.x)) return; const h = kind === 'centimetrique' ? o.x : o.v; const v = kind === 'centimetrique' ? o.v : o.x; points.push([Number((h * kH).toFixed(4)), Number((v * kV).toFixed(4))]); });
    rep.corrections.forEach((c) => { const o = rep.out[c.i]; if (!o || !Number.isFinite(o.x)) return; const h = kind === 'centimetrique' ? o.x * kH : c.v * kH; corr.push({ h: Number(h.toFixed(3)), lu: c.lu, v: Number.isFinite(c.v) ? Number(((kind === 'centimetrique' ? c.v : o.x) * kV).toFixed(3)) : null, mode: c.mode }); });
    const axCorr = rangs.filter((r) => r.axeCorrige && r.ax).length;
    const mesure = m.creux ? 'creux' : null;
    tabs.push({ page: page.n, kind, meta: m, texte: t.texte, uH, uV, points, corrections: corr, axeRegulier: ax.regulier, axeCorr: axCorr, pas: ax.step ? ax.step * (kind === 'centimetrique' ? kH : kV) : null, mesure, ocr: t.ocr });
  });
  // regroupement : un barème par réservoir (ou par compartiment de citerne) ; la table volumétrique sert de contrôle
  const docImmat = (tabs.map((t) => t.meta && t.meta.immat).find(Boolean)) || opts.immat || immatDeNom(opts.fichier);
  const citerne = !!docImmat && tabs.some((t) => t.meta && (t.meta.compartiment || t.meta.creux));
  // renseignements communs au document : l'organisme (et, pour une citerne, tout le certificat) ; le reste est propre à chaque réservoir
  const docMeta = {}; tabs.forEach((t) => { (citerne ? ['organisme', 'certificat', 'date', 'validite', 'constructeur', 'forme'] : ['organisme']).forEach((k) => { if (t.meta && t.meta[k] && !docMeta[k]) docMeta[k] = t.meta[k]; }); });
  const groupes = []; const cleDe = (t) => (citerne ? (t.meta.compartiment ? `c${t.meta.compartiment}` : null) : (t.meta.nom ? `n${norm(t.meta.nom)}` : null));
  const groupe = (cle) => { let g = groupes.find((x) => x.cle === cle); if (!g) { g = { cle, cent: [], vol: [], meta: {}, pages: [] }; groupes.push(g); } return g; };
  const ranger = (g, t) => { (t.kind === 'volumetrique' ? g.vol : g.cent).push(t); g.pages.push(t.page); Object.keys(t.meta || {}).forEach((k) => { if (t.meta[k] == null || t.meta[k] === '') return; if (g.meta[k] == null) g.meta[k] = t.meta[k]; (g.tous = g.tous || {})[k] = [...((g.tous || {})[k] || []), t.meta[k]]; }); };
  const utiles = tabs.filter((t) => !t.vide && t.points && t.points.length >= 2);
  utiles.forEach((t) => { const c = cleDe(t); if (c) ranger(groupe(c), t); });
  // pages sans nom ni numéro de compartiment lisible : même certificat (hauteur témoin, volume au débordement) ou suite de la page précédente
  utiles.forEach((t, i) => {
    if (cleDe(t)) return; let g = null;
    if (citerne && t.meta.hauteurTotale) g = groupes.find((x) => x.meta.hauteurTotale && Math.abs(x.meta.hauteurTotale - t.meta.hauteurTotale) < 0.35 && (!x.meta.volumeDebordement || !t.meta.volumeDebordement || Math.abs(x.meta.volumeDebordement - t.meta.volumeDebordement) <= Math.max(2, x.meta.volumeDebordement * 0.002)));
    if (!g && i > 0) { const p = utiles[i - 1]; const gp = groupes.find((x) => x.cent.includes(p) || x.vol.includes(p)); if (gp && p.kind === t.kind && p.points.length && t.points[0][0] > p.points[p.points.length - 1][0] - 0.001) g = gp; }
    ranger(g || groupe(`p${t.page}`), t);
  });
  groupes.forEach((g) => { ['cent', 'vol'].forEach((k) => {
    const L = g[k].slice().sort((a, b) => (a.corrections.length / a.points.length) - (b.corrections.length / b.points.length)); const gardes = [];
    L.forEach((t) => { const h0 = t.points[0][0], h1 = t.points[t.points.length - 1][0]; const rec = gardes.find((x) => { const x0 = x.points[0][0], x1 = x.points[x.points.length - 1][0]; return Math.min(h1, x1) - Math.max(h0, x0) > Math.min(h1 - h0, x1 - x0) * 0.3; }); if (rec) journal.push({ page: t.page, msg: 'tableau en double ou illisible : ignoré' }); else gardes.push(t); });
    g[k] = gardes.sort((a, b) => a.page - b.page);
  }); });
  // tables continues d'un même réservoir lues séparément (nom lu sur une seule page, page mal reconnue…) : réunies en une seule (0.37.0-alpha.1)
  if (!citerne) {
    const tri = () => groupes.sort((a, b) => ((baremeGroupePts(a)[0] || [0])[0]) - ((baremeGroupePts(b)[0] || [0])[0]));
    let fait = true; tri();
    while (fait) {
      fait = false;
      for (let i = 0; i < groupes.length && !fait; i += 1) for (let j = i + 1; j < groupes.length && !fait; j += 1) {
        if (!baremeGroupesContinus(groupes[i], groupes[j])) continue;
        const a = groupes[i]; const b = groupes[j]; a.cent.push(...b.cent); a.vol.push(...b.vol); a.pages.push(...b.pages);
        Object.keys(b.meta).forEach((k) => { if (a.meta[k] == null || a.meta[k] === '') a.meta[k] = b.meta[k]; }); Object.keys(b.tous || {}).forEach((k) => { (a.tous = a.tous || {})[k] = [...(a.tous[k] || []), ...b.tous[k]]; });
        journal.push({ page: Math.min(...b.pages), msg: 'suite du même tableau : réunie' }); groupes.splice(j, 1); fait = true; tri();
      }
    }
  }
  const baremes = groupes.map((g) => {
    const src = g.cent.length ? g.cent : g.vol; const pts = []; const corr = []; src.forEach((t) => { pts.push(...t.points); corr.push(...t.corrections); });
    const b = { nom: '', cible: citerne ? 'citerne' : 'contenant', immat: citerne ? docImmat : '', compartiment: citerne ? String(g.meta.compartiment || '') : '', mesure: src.some((t) => t.mesure === 'creux') || citerne ? 'creux' : 'hauteur', points: baremeNettoyer({ points: pts }), corrections: corr, meta: {} };
    const m = citerne ? { ...g.meta, ...docMeta } : { ...docMeta, ...g.meta }; ['organisme', 'certificat', 'date', 'validite', 'constructeur', 'numeroSerie', 'forme', 'materiau', 'capacite', 'hauteurTotale', 'volumeDebordement', 'volumeNominal', 'volumeMinimal', 'creuxNominal', 'creuxMinimal'].forEach((k) => { if (m[k] != null && m[k] !== '') b.meta[k] = m[k]; });
    if (opts.fichier) b.meta.fichier = opts.fichier; b.meta.pages = uniq(g.pages).sort((x, y) => x - y);
    b.nom = citerne ? `${docImmat} · compartiment ${b.compartiment || '?'}` : g.meta.nom || `Tableau p. ${b.meta.pages[0]}`; b.reservoir = g.meta.nom || '';
    if (citerne && !b.compartiment) b.compartimentIncertain = true;
    // contrôle croisé avec la table volumétrique (même réservoir)
    const volSur = g.vol.filter((t) => t.points.length >= 5 && t.corrections.length <= t.points.length * 0.2);
    if (g.cent.length && volSur.length) {
      const ecarts = []; volSur.forEach((t) => t.points.forEach(([h, v]) => { const r = baremeVolume(b, h); if (r && !r.hors) ecarts.push(Math.abs(r.v - v) / Math.max(1, v)); }));
      const pire = Math.max(0, ...ecarts); b.controle = { n: ecarts.length, ecartMax: Number((pire * 100).toFixed(2)), ok: pire < 0.012 };
    }
    // contrôles des volumes remarquables des certificats de citerne
    if (citerne) { // chaque page répète ces valeurs (parfois mal lues) : on retient le couple le plus cohérent avec le tableau
      const chk = []; const T = g.tous || {};
      [['volumeNominal', 'creuxNominal'], ['volumeMinimal', 'creuxMinimal']].forEach(([kv, kh]) => {
        let best = null; (T[kv] || []).forEach((v) => (T[kh] || []).forEach((h) => { const r = baremeVolume(b, h); if (r && !r.hors && v > 0) { const e = Math.abs(r.v - v) / v; if (!best || e < best.e) best = { e, v, h }; } }));
        if (best) { b.meta[kv] = best.v; b.meta[kh] = best.h; chk.push(best.e); }
      });
      if (chk.length) b.controle = { n: chk.length, ecartMax: Number((Math.max(...chk) * 100).toFixed(2)), ok: Math.max(...chk) < 0.012, certificat: true };
    }
    // lecture peu sûre : beaucoup de corrections, de sauts ou d'inversions → à vérifier valeur par valeur
    { const P = baremePts(b); const s2 = baremeSens(b); const e2 = baremeExtremum(P, s2); let inv = 0; for (let k = 1; k < P.length; k += 1) if ((s2 > 0 ? k <= e2 : k - 1 >= e2) && (P[k][1] - P[k - 1][1]) * s2 < 0) inv += 1; const nc = b.corrections.filter((c) => c.mode !== 'manuel').length;
      b.fiabilite = P.length < 5 || nc > P.length * 0.2 || inv > Math.max(2, P.length * 0.03) || (b.controle && !b.controle.ok && b.controle.ecartMax > 3) ? 'faible' : nc || inv || (b.controle && !b.controle.ok) ? 'moyenne' : 'bonne'; }
    return b;
  });
  return { baremes, tableaux: tabs.filter((t) => !t.vide).map((t) => ({ page: t.page, kind: t.kind, lignes: t.points.length, corrections: t.corrections.length, uH: t.uH, uV: t.uV })), journal, citerne, immat: docImmat || '' };
}
// points d'un groupe de pages (table centimétrique, sinon volumétrique), triés par hauteur
const baremeGroupePts = (g) => (g.cent.length ? g.cent : g.vol).flatMap((t) => t.points || []).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])).sort((a, b) => a[0] - b[0]);
// deux groupes de pages forment-ils une seule table ? mêmes nom, certificat et volume total (s'ils sont lus), hauteurs à la suite (sans
// recouvrement, sans trou de plus de quelques lignes) et volumes dans le prolongement l'un de l'autre (0.37.0-alpha.1)
function baremeGroupesContinus(a, b) {
  if (!!a.cent.length !== !!b.cent.length) return false; const ma = a.meta || {}; const mb = b.meta || {};
  if (ma.nom && mb.nom && norm(ma.nom).replace(/[^a-z0-9]/g, '') !== norm(mb.nom).replace(/[^a-z0-9]/g, '')) return false;
  if (ma.certificat && mb.certificat && levenshtein(immatNorm(ma.certificat), immatNorm(mb.certificat)) > 2) return false; // lecture de scan : un ou deux caractères mal lus
  if (ma.volumeTotal && mb.volumeTotal && Math.abs(ma.volumeTotal - mb.volumeTotal) > Math.max(ma.volumeTotal, mb.volumeTotal) * 0.01) return false;
  return baremePtsContinus(baremeGroupePts(a), baremeGroupePts(b));
}
function baremePtsContinus(A, B) {
  if (A.length < 2 || B.length < 2) return false;
  const q = (P, f) => P[Math.min(P.length - 1, Math.max(0, Math.round((P.length - 1) * f)))][0];
  if (q(B, 0.1) <= q(A, 0.9)) return false; // tables qui se recouvrent : deux réservoirs
  const pas = mediane(A.slice(1).map((p, k) => p[0] - A[k][0]).filter((x) => x > 0)) || 1; const fin = A[A.length - 1];
  const b0 = B.find((p) => p[0] > fin[0]) || B[0]; if (b0[0] - fin[0] > Math.max(pas * 6, 25)) return false; // trou de plus de quelques lignes
  const a0 = A[Math.max(0, A.length - 8)]; const pente = (fin[1] - a0[1]) / ((fin[0] - a0[0]) || 1); const attendu = fin[1] + pente * (b0[0] - fin[0]);
  return Math.abs(b0[1] - attendu) <= Math.max(Math.abs(attendu) * 0.06, Math.abs(pente) * pas * 3);
}
const immatDeNom = (s) => { const m = /([A-Z]{2})[-_ ]?(\d{3})[-_ ]?([A-Z]{2})/i.exec(String(s || '')); return m ? `${m[1]}-${m[2]}-${m[3]}`.toUpperCase() : ''; };

// texte collé ou fichier tableur (lignes de cellules) → une page de texte positionné (une cellule = un élément)
function jaugePageDeLignes(rows, n = 1) {
  const items = []; (rows || []).forEach((r, i) => { (Array.isArray(r) ? r : []).forEach((c, j) => { const s = c == null ? '' : String(c).trim(); if (s) items.push({ s, x: j * 60, y: 20 + i * 12, w: 40, h: 9 }); }); });
  return { n, w: 1000, h: 20 + (rows || []).length * 12, items };
}
function jaugePageDeTexte(text) {
  const L = String(text || '').replace(/\r/g, '').split('\n');
  if (L.some((l) => l.includes('\t'))) return jaugePageDeLignes(L.map((l) => l.split('\t')));
  const items = []; L.forEach((l, i) => { const re = /\S+/g; let m; while ((m = re.exec(l))) items.push({ s: m[0], x: m.index * 6, y: 20 + i * 12, w: m[0].length * 6, h: 9 }); });
  return { n: 1, w: 1000, h: 20 + L.length * 12, items };
}
// sortie TSV de la reconnaissance de caractères (Tesseract) → page
function jaugePageDeTsv(tsv, n = 1, echelle = 1) {
  const items = []; String(tsv || '').split('\n').forEach((l) => { const c = l.split('\t'); if (c.length < 12 || c[0] !== '5') return; const s = c.slice(11).join(' ').trim(); if (!s) return; const left = num(c[6]), top = num(c[7]), w = num(c[8]), h = num(c[9]); items.push({ s, x: left * echelle, y: (top + h) * echelle, w: w * echelle, h: h * echelle, conf: num(c[10]) }); });
  return { n, w: 0, h: 0, items };
}
// fichier de barèmes préparé (export Œnotrack) : { format: 'oenotrack-baremes', baremes: [...] }
function jaugeLireFichier(text) {
  let j; try { j = JSON.parse(text); } catch (e) { return null; }
  if (!j || j.format !== BAREME_FORMAT || !Array.isArray(j.baremes)) return null;
  return { baremes: j.baremes.filter((b) => b && Array.isArray(b.points)).map((b) => ({ ...b, points: baremeNettoyer(b) })), source: j.source || '' };
}
function jaugeExporter(baremes, source) { return JSON.stringify({ format: BAREME_FORMAT, version: 1, app: APP_ID, appVersion: APP_VERSION, exporteLe: new Date().toISOString(), source: source || '', baremes: baremes.map((b) => { const { id, archive, docId, creeLe, modifLe, contenantId, ...x } = b; return x; }) }); }

// contenant correspondant au nom d'un réservoir (« C 33 » ↔ « C33 », « Cuve 33 » ; « 81 » ↔ « Cuve 81 »)
function contenantPourReservoir(db, nom) {
  const n = norm(nom).replace(/[^a-z0-9]/g, ''); if (!n) return null; const L = (db.contenants || []).filter((c) => c.statut !== 'archive');
  const exact = L.find((c) => norm(c.nom).replace(/[^a-z0-9]/g, '') === n); if (exact) return exact;
  const chiffres = (s) => (String(s).match(/\d+/g) || []).map((x) => String(Number(x))).join('-'); const lettres = (s) => norm(s).replace(/(cuve|cuv|fut|foudre|reservoir|tank|n°|no)/g, '').replace(/[^a-z]/g, '');
  const d = chiffres(nom); if (!d) return null; const lt = lettres(nom);
  // mêmes chiffres et mêmes lettres (« C 33 » ↔ « Cuve C33 », « 81 » ↔ « Cuve 81 ») ; « A6 » et « C 6 » ne sont pas « Cuve 06 »
  const C2 = L.filter((c) => chiffres(c.nom) === d && lettres(c.nom) === lt); return C2.length === 1 ? C2[0] : null;
}
// tableau d'un cahier (plusieurs réservoirs) qui correspond au nom du contenant saisi (0.22.0-alpha.1) : même nom, sinon mêmes chiffres et lettres ; -1 si aucun
function baremePourNom(baremes, nom) {
  const L = (baremes || []).map((b) => b.reservoir || b.nom || ''); const n = norm(nom).replace(/[^a-z0-9]/g, ''); if (!n) return -1;
  const ex = L.findIndex((x) => norm(x).replace(/[^a-z0-9]/g, '') === n); if (ex >= 0) return ex;
  const chiffres = (s) => (String(s).match(/\d+/g) || []).map((x) => String(Number(x))).join('-'); const lettres = (s) => norm(s).replace(/(cuve|cuv|fut|foudre|reservoir|tank|n°|no)/g, '').replace(/[^a-z]/g, '');
  const d = chiffres(nom); if (!d) return -1; const lt = lettres(nom); const I = L.map((x, i) => i).filter((i) => chiffres(L[i]) === d && lettres(L[i]) === lt); return I.length === 1 ? I[0] : -1;
}
// capacité proposée d'après un barème (litres) : capacité annoncée, sinon volume maximal du tableau
const baremeCapacite = (b) => Math.round(Math.max(num(((b && b.meta) || {}).capacite) || 0, ...baremePts(b || {}).map((x) => x[1]), 0));
// matière / type proposés pour un contenant créé depuis un barème
function matierePourBareme(db, materiau) { const m = norm(materiau); if (!m) return null; const L = db.lists.matieres || []; const k = /inox/.test(m) ? 'inox' : /beton/.test(m) ? 'beton' : /bois|chene/.test(m) ? 'bois' : /resine|polyester|fibre/.test(m) ? 'resine' : /email|acier/.test(m) ? 'acier' : m; return (L.find((x) => norm(x.label || x.nom || '').includes(k)) || L.find((x) => norm(x.id).includes(k)) || null); }
// mesures de jaugeage enregistrées avec une opération : op.jauges [{ contenantId | compartiment, avant, apres, mesure, volL, baremeId }], op.hauteurMesure (jaugeage),
// op.jaugesCuves (entrée de moûts, 0.34.0-alpha.1) [{ cle, contenantId, mesure, apres, volAvant, volL, baremeId }]
function jaugesTexte(db, op) {
  const J = [...(Array.isArray(op && op.jauges) ? op.jauges : []), ...(Array.isArray(op && op.jaugesCuves) ? op.jaugesCuves : [])].filter((j) => j && hasNum(j.apres)); // jaugesCuves : entrée de moûts mesurée en cuve (0.34.0-alpha.1)
  const L = J.map((j) => { const qui = j.contenantId ? ((db.contenants || []).find((c) => c.id === j.contenantId) || {}).nom || '?' : j.compartiment ? `compartiment ${j.compartiment}` : ''; return `${qui} ${j.mesure === 'creux' ? 'creux ' : ''}${hasNum(j.avant) ? `${fmt(j.avant, 1)} → ` : ''}${fmt(j.apres, 1)} cm${hasNum(j.volL) ? ` (${fmtL(j.volL)})` : ''}`.trim(); });
  if (op && op.type === 'jaugeage' && hasNum(op.hauteurMesure)) L.unshift(`${op.mesureJauge === 'creux' ? 'creux mesuré' : 'hauteur mesurée'} ${fmt(op.hauteurMesure, 1)} cm`);
  return L.length ? `📏 ${L.join(' ; ')}` : '';
}
