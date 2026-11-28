/* ============ ASSISTANT IA — DOCUMENTS LUS PAR L'IA (0.49.0-alpha.1, audit IA validé : IA02, IA03, IA04, IA05, IA13, IA18) ============
   Fonctions pures (testables en Node) : consignes envoyées au service (en français), schémas de réponse (contrôlés par iaSchemaValider,
   17a-ia-usages.js), lecture des réponses et rapprochement avec les listes de la base. Rien n'écrit dans la base : chaque lecture
   préremplit un formulaire ou un écran de vérification, enregistré seulement après relecture (S4), avec la trace « ia ».
   - IA02 « reception » (niveau 1) : photo de l'étiquette d'un sac ou d'un bidon → produit, fabricant, n° de lot, DDM, quantité ;
     rapproché des produits en stock (noms envoyés), puis des catalogues (rapprochement sur l'appareil) ;
   - IA03 « pesee » (niveau 2) : ticket de pesée, bon de livraison ou DAE → pesée (apporteur, cru, parcelle, cépage, poids, caisses) ou
     entrée de moûts (n° de bon, immatriculation, compartiments, volumes, cépages, fractions) ; noms des listes envoyés, jamais d'identifiant ;
   - IA04 « baremes » (niveau 1) : pages d'un certificat de jaugeage → tables hauteur → volume, remises au format texte et lues par
     jaugeAnalyser (15-baremes.js) : continuité, réunion des pages (baremeGroupesContinus), fiabilité et revue inchangées ;
   - IA05 « planProtocole » (niveau 1) : protocole libre → plan de vinification (groupes, revendications, fractions, lignes) au format de
     planVinifNet, marqué « à vérifier » ;
   - IA13 « composes » (niveau 1) : texte de la FT → composés de REG_COMPOSES (ids et noms envoyés) avec leur part ;
   - IA18 « bulletinCommentaire » (niveau 2) : résultats, stade, revendication (et plafonds déjà calculés) → résultats à surveiller,
     « à vérifier avec votre œnologue » ; rien n'est enregistré.
   Une réponse incohérente (poids négatif, date impossible, table sans volumes croissants…) est écartée champ par champ, jamais devinée. */

/* ---------- outils communs ---------- */
const iadCle = (s) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
const iadTexte = (v, n) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim().slice(0, n || 200));
// nombre lu (« 1 234,5 », 4300, « 4.300 kg ») → nombre fini ou null
function iadNombre(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v == null ? '' : v).replace(/[  ]/g, ' ').trim(); if (!s) return null;
  const m = /-?\d[\d ]*(?:[.,]\d+)?/.exec(s); if (!m) return null;
  let t = m[0].replace(/ /g, ''); if (/^\d{1,3}\.\d{3}$/.test(t) && !/,/.test(s)) t = t.replace('.', ''); // « 4.300 » : milliers
  const n = Number(t.replace(',', '.')); return Number.isFinite(n) ? n : null;
}
const iadSaisie = (n) => (n == null || !Number.isFinite(n) ? '' : String(Math.round(n * 1000) / 1000).replace('.', ','));
const IAD_MOIS = [[/^(janv|jan)/, 1], [/^(fevr|fev|feb)/, 2], [/^(mars|mar)/, 3], [/^(avr|apr)/, 4], [/^(mai|may)/, 5], [/^(juin|jun)/, 6], [/^(juil|jul)/, 7], [/^(aout|aug)/, 8], [/^sep/, 9], [/^oct/, 10], [/^nov/, 11], [/^(dec)/, 12]];
const iadIso = (a, m, j) => `${a}-${String(m).padStart(2, '0')}-${String(j).padStart(2, '0')}`;
const iadFinMois = (a, m) => new Date(Date.UTC(a, m, 0)).getUTCDate();
// date lue → { iso, mois (jour non écrit : dernier jour du mois retenu) } ou null ; années de 2000 à 2099
function iadDate(v) {
  const s = norm(iadTexte(v, 40)); if (!s) return null;
  const an = (x) => (x.length === 2 ? 2000 + +x : +x);
  const ok = (a, m, j) => a >= 2000 && a <= 2099 && m >= 1 && m <= 12 && j >= 1 && j <= iadFinMois(a, m);
  const jour = (a, m, j) => (ok(a, m, j) ? { iso: iadIso(a, m, j), mois: false } : null);
  const mois = (a, m) => (ok(a, m, 1) ? { iso: iadIso(a, m, iadFinMois(a, m)), mois: true } : null);
  let r = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/.exec(s); if (r) return jour(+r[1], +r[2], +r[3]);
  r = /\b(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{4}|\d{2})\b/.exec(s); if (r) return jour(an(r[3]), +r[2], +r[1]);
  r = /\b(\d{4})[-/.](\d{1,2})\b/.exec(s); if (r) return mois(+r[1], +r[2]);
  r = /\b(\d{1,2})[/.\- ](\d{4}|\d{2})\b/.exec(s); if (r) return mois(an(r[2]), +r[1]);
  r = /\b(?:(\d{1,2})\s+)?([a-z]{3,9})\.?\s+(\d{4})\b/.exec(s);
  if (r) { const M = IAD_MOIS.find(([re]) => re.test(r[2])); if (M) return r[1] ? jour(+r[3], M[1], +r[1]) : mois(+r[3], M[1]); }
  return null;
}
const iadHeure = (v) => { const m = /^(\d{1,2})\s*[:hH.]\s*(\d{2})/.exec(iadTexte(v, 10)); if (!m) return ''; const h = +m[1], mi = +m[2]; return h <= 23 && mi <= 59 ? `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}` : ''; };
// unité lue → g, kg, mL, cL, L, hL, m3, u (ou '')
function iadUnite(s) {
  const t = norm(iadTexte(s, 30)).replace(/[.\s]/g, '');
  if (!t) return ''; if (/^(kg|kgs|kilo|kilos|kilogramme|kilogrammes)$/.test(t)) return 'kg'; if (/^(g|gr|grs|gramme|grammes)$/.test(t)) return 'g';
  if (/^(ml|millilitre|millilitres)$/.test(t)) return 'mL'; if (/^(cl|centilitre|centilitres)$/.test(t)) return 'cL'; if (/^(l|lt|litre|litres)$/.test(t)) return 'L';
  if (/^(hl|hectolitre|hectolitres)$/.test(t)) return 'hL'; if (/^(m3|m³|metrecube|metrescubes)$/.test(t)) return 'm3';
  if (/^(u|un|unite|unites|piece|pieces|pc|pcs|sachet|sachets|bidon|bidons|sac|sacs|carton|cartons|boite|boites|flacon|flacons|dose|doses)$/.test(t)) return 'u';
  return '';
}
const IAD_CONV = { g: ['m', 1], kg: ['m', 1000], mL: ['v', 1], cL: ['v', 10], L: ['v', 1000], hL: ['v', 100000], m3: ['v', 1000000], u: ['u', 1] };
// quantité dans une autre unité (même grandeur : masse, volume ou pièces) → nombre ou null (unités incompatibles)
function iadConvertir(q, de, vers) {
  const a = IAD_CONV[de]; const b = IAD_CONV[vers]; if (!a || !b || a[0] !== b[0] || !Number.isFinite(q)) return null;
  return Math.round((q * a[1] / b[1]) * 10000) / 10000;
}
// rapprochement d'un nom lu avec une liste [{ id, noms: [...] }] → { id, score, sur: 'exact' | 'proche' } ou null (rien de sûr, ou ex æquo)
function iadRapprocher(nom, liste, opts) {
  const o = { seuil: 0.72, ...(opts || {}) }; const q = iadCle(nom); if (q.length < 2) return null;
  const mq = q.split(' ').filter((w) => w.length >= 2);
  const note = (n) => {
    const c = iadCle(n); if (!c) return 0; if (c === q) return 1;
    const court = c.length < q.length ? c : q; const long = c.length < q.length ? q : c;
    if (court.length >= 3 && (` ${long} `).includes(` ${court} `)) return 0.82 + 0.1 * (court.length / long.length);
    const mc = c.split(' ').filter((w) => w.length >= 2); const com = mq.filter((w) => mc.includes(w)).length; const jac = com / Math.max(1, new Set([...mq, ...mc]).size);
    const lev = 1 - levenshtein(q, c) / Math.max(q.length, c.length);
    return Math.max(jac * 0.9, q.length >= 4 && c.length >= 4 ? lev : 0);
  };
  const S = (liste || []).filter((x) => x && x.id).map((x) => ({ id: x.id, score: Math.max(0, ...(x.noms || []).filter(Boolean).map(note)) })).sort((a, b) => b.score - a.score);
  if (!S.length || S[0].score < o.seuil) return null;
  if (S[0].score < 1 && S[1] && S[1].score >= S[0].score - 0.02) return null; // deux candidats aussi proches : à choisir à la main
  return { id: S[0].id, score: Math.round(S[0].score * 100) / 100, sur: S[0].score >= 1 ? 'exact' : 'proche' };
}
// liste codée envoyée au service (« A1 | nom ») et table des codes → identifiants (jamais envoyés)
function iadListeCodee(prefixe, L, nomDe, max) {
  const codes = {}; const lignes = (L || []).slice(0, max || 300).map((x, i) => { const k = `${prefixe}${i + 1}`; codes[k] = x.id; return `${k} | ${iadTexte(nomDe(x), 80)}`; });
  return { codes, texte: lignes.join('\n') || '(aucun)' };
}
// valeur choisie : code de la liste renvoyé par le service, sinon nom lu rapproché ; → { id, sur, lu }
function iadChoix(code, lu, codes, liste, opts) {
  const k = iadTexte(code, 12).toUpperCase(); if (k && codes && codes[k]) return { id: codes[k], sur: 'liste', lu: iadTexte(lu, 80) };
  const r = lu ? iadRapprocher(lu, liste, opts) : null; return r ? { id: r.id, sur: r.sur, lu: iadTexte(lu, 80) } : { id: '', sur: '', lu: iadTexte(lu, 80) };
}
const iadIncertains = (L, permis) => uniq((Array.isArray(L) ? L : []).map(String).filter((x) => !permis || permis.includes(x)));
const IAD_CONSIGNE = 'Tu ne reprends que ce qui est écrit ou visible, sans rien inventer. Une information illisible ou absente : null. Indique dans « incertains » les champs que tu as lus avec un doute.';

/* ---------- IA02 : photo de l'étiquette d'un sac ou d'un bidon à la réception ---------- */
const IA_RECEPTION_CHAMPS = ['produit', 'fabricant', 'numLot', 'ddm', 'quantite', 'unite'];
const IA_RECEPTION_SCHEMA = { type: 'object', properties: {
  produitCode: { type: 'string', maxLength: 12, nullable: true }, produit: { type: 'string', maxLength: 120, nullable: true }, fabricant: { type: 'string', maxLength: 120, nullable: true },
  numLot: { type: 'string', maxLength: 60, nullable: true }, ddm: { type: 'string', maxLength: 40, nullable: true }, dateFabrication: { type: 'string', maxLength: 40, nullable: true },
  quantite: { type: ['number', 'null'] }, unite: { type: 'string', maxLength: 20, nullable: true }, nombre: { type: ['integer', 'null'], minimum: 0, maximum: 100000 },
  incertains: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 20 } } }, required: ['produit', 'numLot', 'ddm', 'quantite', 'unite'] };
const iadProduitsListe = (db) => (db.produits || []).filter((p) => p && p.id && p.actif !== false && p.categorie !== 'sec').sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr'));
function iaReceptionPrompt(db) {
  const L = iadListeCodee('P', iadProduitsListe(db), (p) => p.nom, 400);
  const system = `Tu lis l’étiquette d’un sac, d’un bidon ou d’un carton de produit œnologique reçu par une cave (photo ou PDF). ${IAD_CONSIGNE}`;
  const texte = `Produits déjà en stock dans la cave (code | nom) :\n${L.texte}\n\n`
    + 'Lis sur l’étiquette : le nom commercial du produit, le fabricant ou la marque, le n° de lot (Lot, Batch, L.), la date de durabilité minimale (DDM, « à utiliser de préférence avant », EXP, « best before ») telle qu’écrite, '
    + 'la quantité nette d’UN emballage avec son unité (kg, g, L, mL…), et le nombre d’emballages visibles sur la photo s’il est évident (sinon null). '
    + 'Si le produit est l’un de ceux de la liste, donne son code dans « produitCode » ; sinon null. N’invente jamais de n° de lot.';
  return { system, texte, schema: IA_RECEPTION_SCHEMA, nom: 'reception', max: 800, codes: L.codes };
}
// réponse → { ok, patch (champs du formulaire d'arrivage), produit, catalogue, lu, incertains, alertes } ; produitUnite : unité de stock (si connue)
function iaReceptionLire(db, v, codes, opts) {
  const o = opts || {}; if (!v || typeof v !== 'object') return fail('Réponse vide.');
  const alertes = []; const incertains = iadIncertains(v.incertains, IA_RECEPTION_CHAMPS); const patch = {};
  const P = iadProduitsListe(db); const lu = { produit: iadTexte(v.produit, 120), fabricant: iadTexte(v.fabricant, 120) };
  let produit = null; let catalogue = null;
  const k = iadTexte(v.produitCode, 12).toUpperCase(); const viaCode = k && codes && codes[k] ? P.find((p) => p.id === codes[k]) : null;
  if (viaCode) produit = { id: viaCode.id, nom: viaCode.nom, sur: 'liste' };
  else if (lu.produit) { const r = iadRapprocher(lu.produit, P.map((p) => ({ id: p.id, noms: [p.nom, p.reference] }))); if (r) { const p = P.find((x) => x.id === r.id); produit = { id: p.id, nom: p.nom, sur: r.sur }; } }
  if (!produit && lu.produit && typeof catalogueEntrees === 'function') { // catalogues des fournisseurs (préinstallés, importés), sur l'appareil
    const E = catalogueEntrees(db); const r = iadRapprocher(lu.produit, E.map((e) => ({ id: e.id, noms: [e.nom, `${e.marque} ${e.nom}`] })), { seuil: 0.8 });
    if (r) { const e = E.find((x) => x.id === r.id); catalogue = { id: e.id, nom: e.nom, marque: e.marque, fournisseur: e.fournisseur, unite: e.unite, sur: r.sur }; }
  }
  if (produit) { patch.produitId = produit.id; const p = P.find((x) => x.id === produit.id); if (p && p.fournisseurId) patch.fournisseurId = p.fournisseurId; }
  else if (lu.fabricant || lu.produit) { const fo = iadRapprocher(lu.fabricant || (catalogue && catalogue.fournisseur) || '', (db.fournisseurs || []).map((f) => ({ id: f.id, noms: [f.nom] }))); if (fo) patch.fournisseurId = fo.id; }
  const lot = iadTexte(v.numLot, 60).replace(/^(?:n°|no\.?|num(?:ero)?\.?|lot|batch|l\.)\s*[:#°n.]*\s*/i, '').trim();
  if (lot && /[A-Za-z0-9]/.test(lot) && lot.length <= 40) patch.numLot = lot; else if (lot) alertes.push('N° de lot lu incohérent : écarté.');
  if (v.ddm) {
    const d = iadDate(v.ddm); const fab = v.dateFabrication ? iadDate(v.dateFabrication) : null;
    if (!d) alertes.push(`DDM « ${iadTexte(v.ddm, 30)} » illisible : écartée.`);
    else if (fab && d.iso < fab.iso) alertes.push('DDM antérieure à la date de fabrication : écartée.');
    else { patch.dluo = d.iso; if (d.mois) { incertains.push('ddm'); alertes.push('DDM écrite au mois près : dernier jour du mois retenu.'); } if (o.aujourdhui && d.iso < o.aujourdhui) alertes.push('DDM dépassée : vérifiez le produit avant de l’utiliser.'); }
  }
  const q = iadNombre(v.quantite); const u = iadUnite(v.unite); const n = Number.isInteger(v.nombre) && v.nombre > 0 ? v.nombre : 1;
  let quantite = null;
  if (q != null && !(q > 0 && q < 1e6)) alertes.push('Quantité lue incohérente : écartée.');
  else if (q != null) {
    quantite = { v: q, unite: u, nombre: n, total: Math.round(q * n * 10000) / 10000 };
    const uP = o.produitUnite || (produit && (P.find((x) => x.id === produit.id) || {}).unite) || '';
    const conv = uP && u ? iadConvertir(quantite.total, u, uP) : null;
    if (conv != null) patch.qty = iadSaisie(conv); else if (!uP || !u) { patch.qty = iadSaisie(quantite.total); if (u && !uP) incertains.push('unite'); }
    else alertes.push(`Quantité en ${u}, produit suivi en ${uP} : saisissez la quantité à la main.`);
    if (n > 1) alertes.push(`${n} emballages visibles : quantité multipliée, à vérifier.`);
  }
  if (!patch.produitId && !catalogue && !patch.numLot && !quantite && !patch.dluo) return fail('Rien d’exploitable sur cette étiquette.');
  return okr({ patch, produit, catalogue, lu, quantite, incertains: uniq(incertains), alertes });
}

/* ---------- IA03 : ticket de pesée, bon de livraison, DAE ---------- */
const IA_PESEE_CHAMPS = ['date', 'heure', 'apporteur', 'cru', 'parcelle', 'cepage', 'poids', 'caisses', 'tap', 'numero'];
const IA_PESEE_SCHEMA = { type: 'object', properties: {
  document: { type: 'string', enum: ['ticket', 'bon', 'dae', 'autre'], nullable: true }, numero: { type: 'string', maxLength: 40, nullable: true },
  date: { type: 'string', maxLength: 40, nullable: true }, heure: { type: 'string', maxLength: 10, nullable: true },
  apporteurCode: { type: 'string', maxLength: 12, nullable: true }, apporteur: { type: 'string', maxLength: 120, nullable: true },
  cruCode: { type: 'string', maxLength: 12, nullable: true }, cru: { type: 'string', maxLength: 80, nullable: true },
  parcelleCode: { type: 'string', maxLength: 12, nullable: true }, parcelle: { type: 'string', maxLength: 80, nullable: true },
  cepageCode: { type: 'string', maxLength: 12, nullable: true }, cepage: { type: 'string', maxLength: 60, nullable: true },
  poidsBrutKg: { type: ['number', 'null'] }, tareKg: { type: ['number', 'null'] }, poidsNetKg: { type: ['number', 'null'] },
  caisses: { type: ['integer', 'null'] }, tap: { type: ['number', 'null'] },
  incertains: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 20 } } }, required: ['poidsNetKg'] };
const IA_MOUT_SCHEMA = { type: 'object', properties: {
  document: { type: 'string', enum: ['ticket', 'bon', 'dae', 'autre'], nullable: true }, numero: { type: 'string', maxLength: 40, nullable: true },
  date: { type: 'string', maxLength: 40, nullable: true }, immatriculation: { type: 'string', maxLength: 20, nullable: true },
  apporteurCode: { type: 'string', maxLength: 12, nullable: true }, apporteur: { type: 'string', maxLength: 120, nullable: true }, millesime: { type: ['integer', 'null'] },
  compartiments: { type: 'array', maxItems: 20, items: { type: 'object', properties: {
    compartiment: { type: 'string', maxLength: 12, nullable: true }, volume: { type: ['number', 'null'] }, unite: { type: 'string', enum: ['L', 'hL', 'm3'], nullable: true },
    cepageCode: { type: 'string', maxLength: 12, nullable: true }, cepage: { type: 'string', maxLength: 60, nullable: true }, fraction: { type: 'string', maxLength: 40, nullable: true },
    cruCode: { type: 'string', maxLength: 12, nullable: true }, cru: { type: 'string', maxLength: 80, nullable: true }, millesime: { type: ['integer', 'null'] } }, required: ['volume'] } },
  incertains: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 30 } } }, required: ['compartiments'] };
// crus envoyés : ceux de l'exploitation (parcelles, partenaires, crus ajoutés à la main), 120 au plus ; le rapprochement se fait sur tous
function iadCrusUtiles(db) {
  const ids = new Set(); (db.parcelles || []).forEach((p) => p && p.cruId && ids.add(p.cruId)); (db.apporteurs || []).forEach((a) => ((a && a.crusDefaut) || []).forEach((c) => ids.add(c)));
  (db.crus || []).forEach((c) => c && c.custom && ids.add(c.id));
  return (db.crus || []).filter((c) => c && ids.has(c.id)).slice(0, 120);
}
const iadCrusListe = (db) => (db.crus || []).filter((c) => c && c.id).map((c) => ({ id: c.id, noms: [c.nom, ...String(c.alias || '').split(/[|,;]/)] }));
const iadCepagesListe = (db) => ((db.lists && db.lists.cepages) || []).filter((c) => c && c.id).map((c) => ({ id: c.id, noms: [c.label, c.court, c.code] }));
const iadApporteursListe = (db) => (db.apporteurs || []).filter((a) => a && a.id && a.actif !== false).map((a) => ({ id: a.id, noms: [a.nom, a.raison, a.code] }));
function iaPeseePrompt(db, mode) {
  const A = iadListeCodee('A', (db.apporteurs || []).filter((a) => a && a.id && a.actif !== false), (a) => a.nom, 200);
  const C = iadListeCodee('C', iadCrusUtiles(db), (c) => c.nom, 120);
  const Pa = iadListeCodee('L', (db.parcelles || []).filter((p) => p && p.id && p.actif !== false), (p) => p.nom, 200);
  const Ce = iadListeCodee('V', ((db.lists && db.lists.cepages) || []).filter((c) => c && c.id), (c) => c.label, 40);
  const mout = mode === 'mout';
  const system = `Tu lis ${mout ? 'un bon de livraison, un DAE ou un document d’accompagnement d’une citerne de moûts' : 'un ticket de pesée, un bon de livraison ou un DAE de raisins'} livrés à une cave de Champagne (photo ou PDF). ${IAD_CONSIGNE}`;
  const listes = `Partenaires (apporteurs) de la cave (code | nom) :\n${A.texte}\n\nCrus (villages) de la cave (code | nom) :\n${C.texte}\n\n${mout ? '' : `Parcelles (code | nom) :\n${Pa.texte}\n\n`}Cépages (code | nom) :\n${Ce.texte}\n\n`;
  const consigne = mout
    ? 'Lis : le n° du bon ou du DAE, la date de livraison, l’immatriculation de la citerne, le partenaire (expéditeur), et pour chaque compartiment : son n°, le volume avec son unité (L, hL ou m3), le cépage, la fraction telle qu’écrite (cuvée, taille, rebêche…), le cru et le millésime. '
      + 'Pour le partenaire, le cru et le cépage, donne le code de la liste s’il correspond (apporteurCode, cruCode, cepageCode), sinon null, et toujours le nom tel qu’écrit.'
    : 'Lis : le n° du ticket ou du bon, la date et l’heure de la pesée, le partenaire (apporteur), le cru (village), la parcelle, le cépage, le poids brut, la tare et le poids net en kg, le nombre de caisses et le TAP (% vol.) s’il est écrit. '
      + 'Pour le partenaire, le cru, la parcelle et le cépage, donne le code de la liste s’il correspond (apporteurCode, cruCode, parcelleCode, cepageCode), sinon null, et toujours le nom tel qu’écrit.';
  return { system, texte: `${listes}${consigne}`, schema: mout ? IA_MOUT_SCHEMA : IA_PESEE_SCHEMA, nom: mout ? 'entree_mout' : 'pesee', max: mout ? 2000 : 900, codes: { A: A.codes, C: C.codes, L: Pa.codes, V: Ce.codes } };
}
// pesée lue → { ok, patch (champs du formulaire de pesée, saisis comme au clavier), incertains, alertes, nonReconnus }
function iaPeseeLire(db, v, codes) {
  if (!v || typeof v !== 'object') return fail('Réponse vide.');
  const K = codes || {}; const patch = {}; const alertes = []; const nonReconnus = {}; const incertains = iadIncertains(v.incertains, IA_PESEE_CHAMPS);
  const d = v.date ? iadDate(v.date) : null; if (d && !d.mois) patch.date = d.iso; else if (v.date) alertes.push(`Date « ${iadTexte(v.date, 20)} » illisible : écartée.`);
  const h = iadHeure(v.heure); if (h) patch.heure = h;
  const choix = (cle, code, lu, codesL, liste, champ) => { const c = iadChoix(code, lu, codesL, liste); if (c.id) patch[champ] = c.id; else if (c.lu) nonReconnus[cle] = c.lu; return c; };
  choix('apporteur', v.apporteurCode, v.apporteur, K.A, iadApporteursListe(db), 'apporteurId');
  const pc = choix('parcelle', v.parcelleCode, v.parcelle, K.L, (db.parcelles || []).filter((p) => p && p.id).map((p) => ({ id: p.id, noms: [p.nom] })), 'parcelleId');
  choix('cru', v.cruCode, v.cru, K.C, iadCrusListe(db), 'cruId');
  choix('cepage', v.cepageCode, v.cepage, K.V, iadCepagesListe(db), 'cepageId');
  if (pc.id) { const p = (db.parcelles || []).find((x) => x.id === pc.id) || {}; // parcelle : son cru, son cépage et son partenaire, s'ils ne sont pas lus
    if (p.cruId && !patch.cruId) patch.cruId = p.cruId; if (p.cepageId && !patch.cepageId) patch.cepageId = p.cepageId; if (p.apporteurId && !patch.apporteurId) patch.apporteurId = p.apporteurId;
    if (p.cruId && patch.cruId && p.cruId !== patch.cruId) { alertes.push('La parcelle lue n’est pas dans le cru lu : vérifiez.'); incertains.push('parcelle'); } }
  const brut = iadNombre(v.poidsBrutKg); const tare = iadNombre(v.tareKg); const net = iadNombre(v.poidsNetKg);
  const poidsOk = (x) => x != null && x > 0 && x < 100000;
  if (poidsOk(brut) && tare != null && tare >= 0 && tare < brut) {
    patch.brutKg = iadSaisie(brut); patch.tareKg = iadSaisie(tare);
    if (poidsOk(net) && Math.abs((brut - tare) - net) > Math.max(1, net * 0.005)) { alertes.push(`Poids brut − tare (${iadSaisie(brut - tare)} kg) différent du poids net lu (${iadSaisie(net)} kg) : vérifiez.`); incertains.push('poids'); }
  } else if (poidsOk(net)) patch.kg = iadSaisie(net);
  else if (brut != null || tare != null || net != null) alertes.push('Poids lus incohérents (net absent, négatif ou tare supérieure au brut) : écartés.');
  if (Number.isInteger(v.caisses)) { if (v.caisses > 0 && v.caisses <= 5000) patch.caisses = String(v.caisses); else alertes.push('Nombre de caisses incohérent : écarté.'); }
  const tap = iadNombre(v.tap); if (tap != null) { if (tap > 0 && tap <= 20) patch.tap = iadSaisie(tap); else alertes.push('TAP lu hors de 0 à 20 % vol. : écarté.'); }
  const numero = iadTexte(v.numero, 40); if (numero) patch.ref = numero;
  if (!patch.kg && !patch.brutKg && !patch.apporteurId && !patch.cepageId && !patch.ref) return fail('Rien d’exploitable sur ce document.');
  return okr({ patch, incertains: uniq(incertains), alertes, nonReconnus, document: v.document || '' });
}
// fraction lue (« Cuvée », « 1re taille », « Rebêche ») → identifiant de la liste des fractions (nom, puis rôle)
function iadFraction(db, lu) {
  const t = iadTexte(lu, 40); if (!t) return '';
  const L = fracList(db); const r = iadRapprocher(t, L.map((f) => ({ id: f.id, noms: [f.label, f.court] })), { seuil: 0.8 }); if (r) return r.id;
  const n = norm(t); const role = /rebech/.test(n) ? 'rebeche' : /taille/.test(n) ? 'taille' : /cuvee/.test(n) ? 'cuvee' : '';
  if (!role || typeof fracRole !== 'function') return '';
  const M = L.filter((f) => fracRole(db, f.id) === role); return M.length === 1 ? M[0].id : '';
}
// entrée de moûts lue → { ok, entete { date, immat, ref, apporteurId, millesime }, mouts [{ compartiment, volL, cepageId, fractionId, cruId, millesime }], incertains, alertes, nonReconnus }
function iaMoutLire(db, v, codes) {
  if (!v || typeof v !== 'object') return fail('Réponse vide.');
  const K = codes || {}; const entete = {}; const alertes = []; const nonReconnus = {}; const incertains = iadIncertains(v.incertains);
  const d = v.date ? iadDate(v.date) : null; if (d && !d.mois) entete.date = d.iso; else if (v.date) alertes.push(`Date « ${iadTexte(v.date, 20)} » illisible : écartée.`);
  const im = iadTexte(v.immatriculation, 20).toUpperCase().replace(/[^A-Z0-9-]/g, ''); if (im.replace(/-/g, '').length >= 5) entete.immat = im;
  const numero = iadTexte(v.numero, 40); if (numero) entete.ref = numero;
  const ap = iadChoix(v.apporteurCode, v.apporteur, K.A, iadApporteursListe(db)); if (ap.id) entete.apporteurId = ap.id; else if (ap.lu) nonReconnus.apporteur = ap.lu;
  const mil = (x) => (Number.isInteger(x) && x >= 1990 && x <= 2099 ? String(x) : '');
  if (mil(v.millesime)) entete.millesime = mil(v.millesime);
  const mouts = []; let ecartes = 0;
  (Array.isArray(v.compartiments) ? v.compartiments : []).forEach((c, i) => {
    if (!c || typeof c !== 'object') return; const vol = iadNombre(c.volume); const u = c.unite || (vol != null && vol < 400 ? 'hL' : 'L');
    const volL = vol != null ? iadConvertir(vol, iadUnite(u) || 'L', 'L') : null;
    if (!(volL > 0 && volL <= 40000)) { ecartes += 1; return; }
    const cep = iadChoix(c.cepageCode, c.cepage, K.V, iadCepagesListe(db)); const cru = iadChoix(c.cruCode, c.cru, K.C, iadCrusListe(db));
    if (!cep.id && cep.lu) nonReconnus[`cepage${i + 1}`] = cep.lu; if (!cru.id && cru.lu) nonReconnus[`cru${i + 1}`] = cru.lu;
    const fr = iadFraction(db, c.fraction); if (!fr && c.fraction) nonReconnus[`fraction${i + 1}`] = iadTexte(c.fraction, 40);
    if (!c.unite) incertains.push(`volume${i + 1}`);
    mouts.push({ compartiment: iadTexte(c.compartiment, 12), volL: Math.round(volL), cepageId: cep.id, fractionId: fr, cruId: cru.id, millesime: mil(c.millesime) || entete.millesime || '' });
  });
  if (ecartes) alertes.push(`${ecartes} compartiment(s) au volume illisible ou incohérent : écarté(s).`);
  const total = mouts.reduce((s, m) => s + m.volL, 0); if (total > 60000) return fail('Volumes lus incohérents (plus de 600 hL pour une citerne) : rien n’est prérempli.');
  if (!mouts.length && !entete.ref && !entete.apporteurId) return fail('Rien d’exploitable sur ce document.');
  return okr({ entete, mouts, total, incertains: uniq(incertains), alertes, nonReconnus, document: v.document || '' });
}

/* ---------- IA04 : barèmes de jaugeage difficiles à lire ---------- */
const IA_BAREMES_SCHEMA = { type: 'object', properties: { tables: { type: 'array', maxItems: 24, items: { type: 'object', properties: {
  page: { type: ['integer', 'null'] }, nom: { type: 'string', maxLength: 60, nullable: true }, certificat: { type: 'string', maxLength: 40, nullable: true },
  compartiment: { type: 'string', maxLength: 6, nullable: true }, immatriculation: { type: 'string', maxLength: 20, nullable: true },
  capacite: { type: ['number', 'null'] }, uniteHauteur: { type: 'string', enum: ['mm', 'cm', 'm'], nullable: true }, uniteVolume: { type: 'string', enum: ['L', 'hL', 'm3'], nullable: true },
  mesure: { type: 'string', enum: ['hauteur', 'creux'], nullable: true },
  lignes: { type: 'array', maxItems: 2000, items: { type: 'array', maxItems: 2, items: { type: 'number' } } } }, required: ['lignes'] } } }, required: ['tables'] };
function iaBaremesPrompt() {
  const system = 'Tu relis les pages d’un certificat de jaugeage (barème d’épalement d’une cuve, ou barème d’une citerne mesuré par le creux) pour une cave. Tu recopies les nombres exactement tels qu’ils sont imprimés, sans interpoler, sans compléter une ligne illisible (omets-la) et sans arrondir.';
  const texte = 'Pour chaque tableau hauteur → volume (ou creux → volume) des pages : la page, le nom ou le n° du réservoir (ou le n° du compartiment et l’immatriculation de la citerne), le n° du certificat de jaugeage, la capacité totale, '
    + 'l’unité des hauteurs (mm, cm ou m) et des volumes (L, hL ou m3) telles qu’indiquées sur le document, « creux » si les hauteurs sont mesurées depuis le haut, et toutes les lignes du tableau sous la forme [hauteur, volume], dans l’ordre du tableau. '
    + 'Un tableau qui continue sur la page suivante : une entrée par page, avec le même nom. Un tableau volume → hauteur : renvoie quand même [hauteur, volume].';
  return { system, texte, schema: IA_BAREMES_SCHEMA, nom: 'baremes', max: 16000 };
}
const IAD_H = { mm: 0.1, cm: 1, m: 100 }; const IAD_V = { L: 1, hL: 100, m3: 1000 };
// tables lues → pages de texte (une par table) pour jaugeAnalyser (unités converties en cm et en litres) ; tables incohérentes écartées
function iaBaremesPages(v) {
  const pages = []; const journal = [];
  (v && Array.isArray(v.tables) ? v.tables : []).forEach((t, i) => {
    const n = Number.isInteger(t.page) && t.page > 0 ? t.page : i + 1; const kH = IAD_H[t.uniteHauteur] || 1; const kV = IAD_V[t.uniteVolume] || 1;
    const P = (Array.isArray(t.lignes) ? t.lignes : []).filter((x) => Array.isArray(x) && x.length === 2 && Number.isFinite(x[0]) && Number.isFinite(x[1]) && x[0] >= 0 && x[1] >= 0).map((x) => [Math.round(x[0] * kH * 1000) / 1000, Math.round(x[1] * kV * 1000) / 1000]).sort((a, b) => a[0] - b[0]);
    if (P.length < 3) { journal.push({ page: n, msg: 'tableau relu par l’IA trop court : ignoré' }); return; }
    // volumes dans un seul sens (croissants, ou décroissants pour un creux) : sinon la relecture n'est pas fiable
    let monte = 0, descend = 0; for (let k = 1; k < P.length; k += 1) { if (P[k][1] > P[k - 1][1]) monte += 1; else if (P[k][1] < P[k - 1][1]) descend += 1; }
    if (Math.min(monte, descend) > Math.max(2, P.length * 0.05)) { journal.push({ page: n, msg: 'tableau relu par l’IA : volumes dans le désordre, ignoré' }); return; }
    const L = [];
    if (t.nom) L.push(`Réservoir n° : ${iadTexte(t.nom, 60)}`); else L.push(`Page ${n}`);
    if (t.certificat) L.push(`Certificat de jaugeage n° : ${iadTexte(t.certificat, 40).replace(/\s+/g, '')}`);
    if (t.immatriculation) L.push(`Immatriculation : ${iadTexte(t.immatriculation, 20).toUpperCase()}`);
    if (t.compartiment && /^\d{1,2}$/.test(String(t.compartiment).trim())) L.push(`Compartiment n° ${String(t.compartiment).trim()}`);
    const cap = iadNombre(t.capacite); if (cap > 0) L.push(`Capacité : ${Math.round(cap * kV)} litres`);
    if (t.mesure === 'creux') L.push('Barème : mesures par le creux');
    L.push('Les hauteurs sont exprimées en centimètres', 'Les volumes sont exprimés en litres', 'Hauteur (cm)\tVolume (L)');
    P.forEach((x) => L.push(`${iadSaisie(x[0])}\t${iadSaisie(x[1])}`));
    pages.push({ n, texte: L.join('\n') });
  });
  return { pages, journal };
}
// lecture complète : pages relues → résultat de jaugeAnalyser (même revue que la lecture du script) ; les barèmes gardent la trace « ia »
function iaBaremesLire(v, opts) {
  const o = opts || {}; const T = iaBaremesPages(v); if (!T.pages.length) return fail(T.journal.length ? 'Aucun tableau exploitable dans la relecture de l’IA.' : 'L’IA n’a relu aucun tableau.');
  const pages = T.pages.map((p) => ({ ...jaugePageDeTexte(p.texte), n: p.n }));
  const r = jaugeAnalyser(pages, { fichier: o.fichier || '', immat: o.immat || '' });
  r.baremes.forEach((b) => { b.meta = { ...(b.meta || {}), lecture: 'ia', ...(o.trace ? { ia: o.trace } : {}) }; if (b.fiabilite === 'bonne') b.fiabilite = 'moyenne'; }); // relu par l'IA : toujours à vérifier
  return okr({ ...r, journal: [...T.journal, ...(r.journal || [])] });
}

/* ---------- IA05 : plan de vinification depuis un protocole libre ---------- */
const IA_PLAN_SCHEMA = { type: 'object', properties: {
  nom: { type: 'string', maxLength: 100, nullable: true }, sousTitre: { type: 'string', maxLength: 200, nullable: true }, reference: { type: 'string', maxLength: 40, nullable: true }, version: { type: 'string', maxLength: 20, nullable: true },
  groupes: { type: 'array', maxItems: 8, items: { type: 'object', properties: { label: { type: 'string', maxLength: 60 }, cepages: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 40 } } }, required: ['label'] } },
  revendications: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 60 } },
  fractions: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 60 } },
  lignes: { type: 'array', maxItems: 200, items: { type: 'object', properties: {
    type: { type: 'string', enum: ['etape', 'section', 'note'] }, etape: { type: 'string', maxLength: 160, nullable: true }, produit: { type: 'string', maxLength: 160, nullable: true },
    valeurs: { type: 'array', maxItems: 80, items: { type: 'object', properties: { groupe: { type: 'string', maxLength: 60, nullable: true }, revendication: { type: 'string', maxLength: 60, nullable: true }, fraction: { type: 'string', maxLength: 60, nullable: true }, valeur: { type: 'string', maxLength: 120 } }, required: ['valeur'] } } }, required: ['type'] } } },
  required: ['groupes', 'revendications', 'fractions', 'lignes'] };
function iaPlanPrompt(texte) {
  const system = 'Tu mets en forme le protocole de vinification d’une cave (instruction de travail) en un plan de vinification : un tableau dont les colonnes sont les groupes de cépages × les revendications × les fractions de pressurage, et les lignes les étapes (sulfitage, enzymage, débourbage, levurage, enrichissement, fermentation malolactique, stabilisation tartrique, collage, filtration, tirage…) avec le produit et la dose. Tu ne reprends que ce qui est écrit ; tu n’inventes ni produit ni dose.';
  const t = `${texte ? `Protocole :\n"""\n${String(texte).slice(0, 15000)}\n"""\n\n` : 'Le protocole est dans les images jointes.\n\n'}`
    + 'Renvoie : les groupes de cépages (ex. « Chardonnay », « Pinots » avec leurs cépages ; un seul groupe « Tous cépages » si le protocole ne les distingue pas), les revendications (ex. « Conventionnel », « BIO » ; « Conventionnel » s’il n’y en a qu’une), '
    + 'les fractions (ex. « Cuvée », « Taille » ; « Toutes fractions » si le protocole ne les distingue pas), puis les lignes dans l’ordre : type « etape » (étape, produit, valeurs), « section » (titre d’une partie) ou « note » (remarque sur toute la largeur). '
    + 'Pour chaque valeur (dose, température, durée…) : le groupe, la revendication et la fraction auxquels elle s’applique (null = tous), et la valeur telle qu’écrite (ex. « 5 g/hL »).';
  return { system, texte: t, schema: IA_PLAN_SCHEMA, nom: 'plan_vinification', max: 8000 };
}
// réponse → plan au format attendu par la revue (PlanVinifForm, planVinifNet) : identifiants, cépages, revendications et fractions rapprochés
function iaPlanLire(db, v, opts) {
  const o = opts || {}; if (!v || typeof v !== 'object') return fail('Réponse vide.');
  const cepL = iadCepagesListe(db); const quals = ((db.lists && db.lists.qualifs) || DEFAULT_QUALIFS()).filter((q) => q && q.id);
  const groupes = (v.groupes || []).filter((g) => iadTexte(g.label, 60)).slice(0, 8).map((g, i) => {
    const ids = uniq((g.cepages || []).map((c) => (iadRapprocher(c, cepL) || {}).id).filter(Boolean)); const ids2 = ids.length ? ids : uniq([(iadRapprocher(g.label, cepL) || {}).id].filter(Boolean));
    return { id: `g${i + 1}`, label: iadTexte(g.label, 60), cepages: ids2 };
  });
  const revendications = (v.revendications || []).map((x) => iadTexte(x, 60)).filter(Boolean).slice(0, 8).map((label, i) => {
    const n = iadCle(label); const q = quals.find((x) => iadCle(x.label) === n || iadCle(x.court) === n || iadCle(x.id) === n || (x.codeAgrement && iadCle(x.codeAgrement) === n) || (/\bbio\b/.test(n) && x.id === 'bio') || (/convention/.test(n) && x.id === 'conv'));
    return { id: q ? q.id : `r${i + 1}`, label };
  }).filter((r, i, L) => L.findIndex((y) => y.id === r.id) === i);
  const fractions = (v.fractions || []).map((x) => iadTexte(x, 60)).filter(Boolean).slice(0, 8).map((label, i) => {
    const n = norm(label); const role = /rebech/.test(n) ? 'rebeche' : /taille/.test(n) ? 'taille' : /cuvee/.test(n) ? 'cuvee' : '';
    const ids = role && typeof fracRole === 'function' ? fracList(db).filter((x) => fracRole(db, x.id) === role).map((x) => x.id) : [];
    return { id: role ? (role === 'taille' ? 'tailles' : role) : `f${i + 1}`, label, fractions: ids };
  }).filter((f, i, L) => L.findIndex((y) => y.id === f.id) === i);
  if (!groupes.length || !revendications.length || !fractions.length) return fail('Le plan lu n’a pas de groupe de cépages, de revendication ou de fraction : rien n’est prérempli.');
  const cherche = (L, lu) => { const t = iadTexte(lu, 60); if (!t) return null; const r = iadRapprocher(t, L.map((x) => ({ id: x.id, noms: [x.label] })), { seuil: 0.6 }); return r ? r.id : undefined; };
  const nG = groupes.length, nR = revendications.length, nF = fractions.length; let ignorees = 0;
  const lignes = (v.lignes || []).slice(0, 200).map((l, i) => {
    const type = ['etape', 'section', 'note'].includes(l.type) ? l.type : 'etape'; const etape = iadTexte(l.etape, 160); const produit = type === 'etape' ? iadTexte(l.produit, 160) : '';
    if (type !== 'etape') return etape ? { id: `l${i + 1}`, type, etape, produit: '', etendue: 'colonne', valeurs: {} } : null;
    const V = (l.valeurs || []).map((x) => ({ g: cherche(groupes, x.groupe), r: cherche(revendications, x.revendication), f: cherche(fractions, x.fraction), v: iadTexte(x.valeur, 120) })).filter((x) => x.v);
    const sures = V.filter((x) => x.g !== undefined && x.r !== undefined && x.f !== undefined); ignorees += V.length - sures.length; // colonne nommée mais introuvable : écartée
    // étendue la plus large : pas de fraction précisée → par revendication ; ni revendication ni fraction → par groupe
    const etendue = sures.length && sures.every((x) => !x.f) ? (sures.every((x) => !x.r) ? (nG > 1 || nR > 1 || nF > 1 ? 'groupe' : 'colonne') : 'revendication') : 'colonne';
    const valeurs = {}; const G = (id) => (id ? groupes.filter((g) => g.id === id) : groupes); const Rv = (id) => (id ? revendications.filter((r) => r.id === id) : revendications); const F = (id) => (id ? fractions.filter((f) => f.id === id) : fractions);
    sures.forEach((x) => G(x.g).forEach((g) => { if (etendue === 'groupe') { if (!valeurs[g.id]) valeurs[g.id] = x.v; return; }
      Rv(x.r).forEach((r) => { if (etendue === 'revendication') { const k = `${g.id}|${r.id}`; if (!valeurs[k]) valeurs[k] = x.v; return; } F(x.f).forEach((f) => { const k = `${g.id}|${r.id}|${f.id}`; if (!valeurs[k]) valeurs[k] = x.v; }); }); }));
    return etape || produit || Object.keys(valeurs).length ? { id: `l${i + 1}`, type: 'etape', etape, produit, etendue, valeurs } : null;
  }).filter(Boolean);
  if (!lignes.length) return fail('Aucune étape lue dans le protocole : rien n’est prérempli.');
  const plan = { nom: iadTexte(v.nom, 100) || iadTexte(String(o.fichier || '').replace(/\.[a-z0-9]+$/i, ''), 100) || 'Plan de vinification', reference: iadTexte(v.reference, 40), version: iadTexte(v.version, 20), sousTitre: iadTexte(v.sousTitre, 200),
    groupes, revendications, fractions, lignes, aVerifier: true, ...(o.trace ? { ia: o.trace } : {}) };
  return okr({ plan, colonnes: nG * nR * nF, lignes: lignes.length, ignorees });
}

/* ---------- IA13 : composés actifs d'un produit inconnu ---------- */
const IA_COMPOSES_SCHEMA = { type: 'object', properties: { composes: { type: 'array', maxItems: 10, items: { type: 'object', properties: {
  id: { type: 'string', maxLength: 40 }, partPct: { type: ['number', 'null'], minimum: 0, maximum: 100 }, justification: { type: 'string', maxLength: 200, nullable: true } }, required: ['id'] } } }, required: ['composes'] };
function iaComposesPrompt(p, texte) {
  const L = REG_COMPOSES.map((c) => `${c.id} | ${c.label}`).join('\n');
  const system = 'Tu aides une cave à reconnaître les composés actifs d’un produit œnologique d’après sa fiche technique, pour appliquer les doses et teneurs maximales de la réglementation. Tu ne retiens que les composés écrits dans la fiche, parmi ceux de la liste.';
  const t = `Produit : « ${iadTexte(p && p.nom, 120)} »${p && p.fabricant ? ` (${iadTexte(p.fabricant, 80)})` : ''}.\n\nComposés connus (identifiant | nom) :\n${L}\n\nFiche technique :\n"""\n${String(texte || '').slice(0, 12000)}\n"""\n\n`
    + 'Renvoie les composés de la liste présents dans le produit, avec leur part en % de la masse (ou du volume) du produit si la fiche la donne (ex. « citrate de cuivre 2 % » → 2), sinon null, et la phrase de la fiche qui le justifie. Aucun composé reconnu : liste vide.';
  return { system, texte: t, schema: IA_COMPOSES_SCHEMA, nom: 'composes', max: 900 };
}
// réponse → [{ id, part (0 à 1, absente : produit supposé pur), justification }] ; identifiants inconnus écartés, doublons fusionnés
function iaComposesLire(v) {
  if (!v || !Array.isArray(v.composes)) return fail('Réponse vide.');
  const out = []; let inconnus = 0;
  v.composes.forEach((c) => {
    const id = iadTexte(c && c.id, 40); if (!refCompose(id)) { inconnus += 1; return; } if (out.some((x) => x.id === id)) return;
    const pct = iadNombre(c.partPct); out.push({ id, ...(pct != null && pct > 0 && pct <= 100 ? { part: Math.round(pct * 100) / 10000 } : {}), justification: iadTexte(c.justification, 200) });
  });
  return okr({ composes: out, inconnus });
}
// proposition → saisie de ComposesChoix ([{ id, part: '2' (%) }]) ; composés déjà dans la liste gardés (leur teneur aussi, sauf vide :
// celle proposée la remplace), nouveaux ajoutés
function iaComposesChoix(L, existants) {
  const E = Array.isArray(existants) ? existants : []; const pc = (x) => (x.part != null ? iadSaisie(x.part * 100) : '');
  return [...E.map((y) => { const x = (L || []).find((z) => z.id === y.id); return x && !String(y.part || '').trim() && x.part != null ? { ...y, part: pc(x) } : y; }), ...(L || []).filter((x) => !E.some((y) => y.id === x.id)).map((x) => ({ id: x.id, part: pc(x) }))];
}

/* ---------- IA18 : commentaire d'un bulletin d'analyses ---------- */
const IA_COMMENTAIRE_SCHEMA = { type: 'object', properties: {
  synthese: { type: 'string', maxLength: 600, nullable: true },
  points: { type: 'array', maxItems: 12, items: { type: 'object', properties: { parametre: { type: 'string', maxLength: 80, nullable: true }, niveau: { type: 'string', enum: ['info', 'surveiller', 'alerte'] }, message: { type: 'string', maxLength: 400 } }, required: ['niveau', 'message'] } } },
  required: ['points'] };
const IA_COMMENTAIRE_NIVEAUX = { info: ['info', 'Information'], surveiller: ['warn', 'À surveiller'], alerte: ['bad', 'Alerte'] };
// données envoyées : résultats (nom, valeur, unité), stade, couleur, type de vin, revendication, plafond de SO₂ total et alertes du moteur ;
// jamais le code du lot, la cuve, les produits ni les volumes. valeurs : { paramId: nombre } ; nouveaux : [{ nom, v, unite }]
function iaCommentaireDonnees(db, R, o) {
  const x = o || {}; const par = (id) => (db.analysesParams || []).find((p) => p.id === id);
  const resultats = Object.keys(x.valeurs || {}).filter((k) => hasNum(x.valeurs[k])).map((k) => { const p = par(k); return p ? { nom: p.nom, valeur: num(x.valeurs[k]), unite: p.unite || '' } : null; }).filter(Boolean)
    .concat((x.nouveaux || []).filter((n) => n && n.nom && hasNum(n.v)).map((n) => ({ nom: iadTexte(n.nom, 60), valeur: num(n.v), unite: iadTexte(n.unite, 20) })));
  const l = x.lotId && typeof refLotDe === 'function' ? refLotDe(db, R, x.lotId) : null; const d = { resultats, date: isoOK(x.date) ? x.date : '' };
  if (l) {
    d.stade = l.stade ? stadeLabel(db, l.stade) : ''; d.couleur = l.couleur ? couleurLabel(db, l.couleur) : ''; d.revendication = l.qualif ? qLabel(l.qualif) : '';
    if (typeof lotTypeVin === 'function') d.typeVin = ({ effervescent: 'vin effervescent', rouge: 'vin rouge', blanc_rose: 'vin blanc ou rosé' })[lotTypeVin(db, R, x.lotId)] || '';
    const pl = typeof plafondSo2Lot === 'function' ? plafondSo2Lot(db, R, x.lotId) : null; if (pl && Number.isFinite(+pl.valeur)) d.plafondSo2Total = { mgL: +pl.valeur, source: pl.referentiel ? (refLabel(pl.referentiel) || {}).label || pl.referentiel : 'réglage de l’exploitation', aVerifier: !!pl.aVerifier };
    const C = typeof lotConformite === 'function' ? lotConformite(db, R, x.lotId) : [];
    d.alertesMoteur = C.filter((a) => !a.justifie).map((a) => (a.type === 'so2t' ? `SO₂ total estimé ${Math.round(a.valeur)} mg/L au-delà du plafond de ${a.max} mg/L`
      : a.type === 'teneur' ? `${a.libelle} : ${Math.round(a.valeur * 100) / 100} mg/L au-delà de ${a.max} mg/L`
        : a.type === 'cumul' ? 'dose cumulée d’un intrant au-delà de la dose maximale' : a.type === 'interdit' ? 'intrant non accepté par un label visé' : '')).filter(Boolean).slice(0, 10);
  }
  return d;
}
function iaCommentairePrompt(donnees) {
  const system = 'Tu es un assistant œnologique pour une cave de Champagne. Tu commentes un bulletin d’analyses : tu signales les résultats à surveiller pour le stade et le type de vin indiqués (risques, valeurs inhabituelles, points à recontrôler), en complément des alertes déjà calculées par le logiciel. Tu restes prudent : tes remarques sont à vérifier avec l’œnologue de la cave ; tu ne prescris aucune dose.';
  const t = `Données du bulletin (JSON) :\n${JSON.stringify(donnees)}\n\n`
    + 'Renvoie une synthèse courte (deux phrases au plus) et la liste des points : le paramètre concerné, le niveau (« info », « surveiller » ou « alerte ») et le message. Ne répète pas les alertes du logiciel, sauf pour les expliquer. Résultat normal : pas de point.';
  return { system, texte: t, schema: IA_COMMENTAIRE_SCHEMA, nom: 'commentaire_bulletin', max: 1200 };
}
function iaCommentaireLire(v) {
  if (!v || typeof v !== 'object') return fail('Réponse vide.');
  const points = (Array.isArray(v.points) ? v.points : []).map((p) => ({ parametre: iadTexte(p.parametre, 80), niveau: IA_COMMENTAIRE_NIVEAUX[p.niveau] ? p.niveau : 'info', message: iadTexte(p.message, 400) })).filter((p) => p.message)
    .sort((a, b) => ['alerte', 'surveiller', 'info'].indexOf(a.niveau) - ['alerte', 'surveiller', 'info'].indexOf(b.niveau));
  const synthese = iadTexte(v.synthese, 600); if (!synthese && !points.length) return fail('Commentaire vide.');
  return okr({ synthese, points });
}
