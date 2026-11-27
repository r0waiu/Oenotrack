/* ============ INTRANTS : RÉGULARISATIONS DE STOCK, ALLERGÈNES, REVENDICATIONS OUI / NON, FICHE RÉCAPITULATIVE (0.36.0-alpha.1) ============
   Régularisations manuelles : db.regulStocks [{ id, arrivageId, produitId, date, qty (signée, unité du produit), motif, compte (quantité
   comptée, inventaire), restantAvant, notes, par, le }]. Le rejeu les ajoute au restant du lot fournisseur (R.arrRegul) : jamais d'état stocké.
   Allergènes d'un intrant : p.allergenesListe [ids d'ALLERGENES], p.allergenesAucun (aucun allergène déclaré) ; p.allergenes (texte) devient
   « précisions » et reste lu par les versions précédentes.
   Revendications (bio et personnalisées) : un choix Oui / Non par revendication = la règle du produit dans db.regles (autorise), la même
   donnée que l'onglet « Produits & règles par revendication » (synchronisation d'office). Détection à l'import d'une FT / FDS : propositions
   « allergenesListe » et « rev:<id> » ajoutées à celles des informations du produit (16d-complements).
   Liste d'allergènes : exemples à vérifier (règlement (UE) 1169/2011, annexe II, et mentions habituelles des fiches œnologiques). */
const ALLERGENES = [
  // [id, libellé, court, mot dans une zone « Allergènes », substance reconnue partout (composition)]
  ['oeuf', 'Œuf (albumine, ovalbumine, lysozyme)', 'Œuf', /\b(oeufs?|albumines?|ovalbumines?|lysozymes?|egg|eggs)\b/, /\b(albumines? d'oeufs?|ovalbumines?|lysozymes?|blancs? d'oeufs?|oeufs? en poudre)\b/],
  ['lait', 'Lait (caséine, caséinates, lactose)', 'Lait', /\b(lait|laits|caseines?|caseinates?|lactose|lactoserum|milk)\b/, /\b(caseines?|caseinates?( de potassium)?|lactoserum)\b/],
  ['gluten', 'Gluten (blé, orge, seigle, avoine)', 'Gluten', /\b(gluten|ble|froment|orge|seigle|avoine|epeautre|wheat|cereales contenant du gluten)\b/, /\b(gluten|proteines? de ble)\b/],
  ['sulfites', 'Sulfites, bisulfites (SO₂ > 10 mg/L)', 'Sulfites', /\b(sulfites?|bisulfites?|metabisulfites?|disulfites?|anhydride sulfureux|dioxyde de soufre|sulphites?|so2)\b/, /\b(metabisulfites?|bisulfites?|disulfites?|sulfites? de|e ?22[0-8])\b/],
  ['enzymes', 'Enzymes', 'Enzymes', /\b(enzymes?|enzymatiques?|pectinases?|glucanases?)\b/, /\b(preparations? enzymatiques?|enzymes? pectolytiques?|pectinases?|glucanases?|beta-glucanases?)\b/],
  ['poisson', 'Poisson (colle de poisson, ichtyocolle)', 'Poisson', /\b(poissons?|ichtyocolle|ichthyocolle|isinglass|fish)\b/, /\b(colle de poisson|ichtyocolle|ichthyocolle|isinglass)\b/],
  ['crustaces', 'Crustacés', 'Crustacés', /\b(crustaces?|crustacean)\b/, /\b(d'origine crustacee|issu de crustaces)\b/],
  ['soja', 'Soja', 'Soja', /\b(soja|soy|soya)\b/, /\b(lecithine de soja|proteines? de soja)\b/],
  ['fruitsCoque', 'Fruits à coque', 'Fruits à coque', /\b(fruits? a coques?|noix|noisettes?|amandes?|nuts)\b/, /$^/],
];
const allergeneDef = (id) => ALLERGENES.find((a) => a[0] === id) || null;
const allergeneCourt = (id) => (allergeneDef(id) || [id, id, id])[2];
const lot3Plier = (s) => norm(String(s || '').replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae')).replace(/[’`]/g, "'");
const allergenesDe = (p) => (Array.isArray(p && p.allergenesListe) ? p.allergenesListe.filter((x) => allergeneDef(x)) : []);
// texte lisible : liste cochée + précisions saisies (traçabilité, fiche récapitulative)
function allergenesTexte(p) {
  if (!p) return ''; const L = allergenesDe(p).map(allergeneCourt); let pr = String(p.allergenes || '').trim(); if (L.length && /^(aucun|aucune|neant|néant|none|-)\.?$/i.test(pr)) pr = ''; // « aucun » saisi avant la liste
  if (!L.length && p.allergenesAucun) return pr ? `Aucun (${pr})` : 'Aucun';
  return [L.join(', '), pr].filter(Boolean).join(' — ');
}
const ALG_NEG = /\b(sans|exempte?s?|aucune?s?|absences?|absente?s?|non|ne contient pas|pas de|free|not|no|neant|negatifs?|0 ?%)\b/;
const ALG_POS = /\b(oui|yes|presente?s?|contient|contains|contenant|x)\b/;
// allergènes lus dans un document : présents (cochés), absents (déclarés « non »), « aucun » (déclaration sans allergène)
function allergenesDetecter(texte) {
  const L = String(texte || '').split('\n').map((x) => lot3Plier(x).replace(/\s+/g, ' ').trim()); const presents = []; const absents = []; let aucun = false;
  let zone = 0; // lignes restantes de la rubrique « Allergènes »
  L.forEach((l) => {
    if (!l) return;
    if (/allerg/.test(l)) { zone = 16; if (/\b(aucun|neant|pas d'allergene|sans allergene|non concerne|free from|none|ne contient aucun)\b/.test(l)) aucun = true; }
    else if (zone > 0) zone -= 1;
    ALLERGENES.forEach(([id, , , motZone, substance]) => {
      const dansZone = zone > 0 && motZone.test(l); const sub = substance.test(l); if (!dansZone && !sub) return;
      const m = (dansZone ? motZone : substance).exec(l); const avant = l.slice(Math.max(0, m.index - 40), m.index); const apres = l.slice(m.index, m.index + 60);
      const neg = ALG_NEG.test(avant) || /:\s*(non|no|absent|neant|0)\b/.test(apres) || /\b(non|no|absent)\s*$/.test(l);
      if (neg && !ALG_POS.test(apres.slice(m[0].length))) { if (!absents.includes(id)) absents.push(id); return; }
      if (!presents.includes(id)) presents.push(id);
    });
  });
  return { presents, absents: absents.filter((x) => !presents.includes(x)), aucun: aucun && !presents.length };
}
// suggestions à la saisie d'une fiche : nom, famille, composition et précisions du produit
function allergenesSuggeres(p) {
  if (!p) return []; const t = [p.nom, p.composition, p.allergenes].filter(Boolean).join('\n'); const r = allergenesDetecter(`Allergènes\n${t}`).presents;
  if (p.famille === 'enzyme' && !r.includes('enzymes')) r.push('enzymes');
  if (p.famille === 'sulfitage' && !r.includes('sulfites')) r.push('sulfites');
  return r.filter((x) => !allergenesDe(p).includes(x));
}

/* ---------- revendications : choix Oui / Non par revendication (règle du produit) et détection dans les documents ---------- */
// revendications proposées sur la fiche : toutes sauf « Conventionnel » (rang 1), masquées comprises si une règle les autorise
const revendicationsFiche = (db, p) => qualifList(db).filter((q) => q.id !== 'conv' && (!q.masque || (p && (ruleFor(db, p.id, q.id) || {}).autorise)));
const revChoix = (db, p, qid) => { const r = p ? ruleFor(db, p.id, qid) : null; return !!(r && r.autorise); };
// choix de la fiche du produit appliqués aux règles (seulement ceux qui changent : la dose maximale et la source restent)
function revendicationsAppliquer(db, pid, choix, o = {}) {
  let n = 0; if (!choix || typeof choix !== 'object') return 0;
  qualifList(db).forEach((q) => {
    const v = choix[q.id]; if (typeof v !== 'boolean') return; const r = ruleFor(db, pid, q.id);
    if (r && !!r.autorise === v && !o.source && !(r.aVerifier && !o.aVerifier)) return; // même choix : confirmé par l'utilisateur (vérifié)
    const patch = { autorise: v, aVerifier: !!o.aVerifier, ...(o.aVerifier ? {} : { verifiePar: o.uid || '', verifieLe: todayISO() }) }; if (o.source) patch.source = o.source;
    regleSet(db, pid, q.id, patch); n += 1;
  });
  return n;
}
const REV_NEG = /(:\s*non\b|\bnon\s*$|non[ -](utilisable|autorise|conforme|admis|compatible|certifie|agree|approuve|valide)|interdite?s?|pas (utilisable|autorise|admis|conforme|compatible)|ne (peut|doit|convient) pas|n'est pas (utilisable|autorise|admis|conforme|compatible|certifie)|not (allowed|suitable|permitted|approved|compliant|authori[sz]ed)|\bexclue?s?\b|proscrite?s?)/;
const REV_POS = /(utilisable|autorisee?s?|conformes?|compatibles?|certifiee?s?|admise?s?|approuvee?s?|agreee?s?|allowed|suitable|approved|compliant|permitted|authori[sz]ed|convient|adaptee?s?|utilisation en|usage en|\boui\b|\byes\b|cahier des charges|\blabel\b|\bmention\b|\blogo\b|certification)/;
const REV_BIO = /(agriculture biologique|vinification biologique|vins? biologiques?|produits? biologiques?|\bbio\b|2018\/848|203\/2012|889\/2008|\borganic\b|ecocert|\bnop\b|\bab\b)/;
// revendications lues dans un document : { bio: 'oui' | 'non', <id personnalisé>: … }
function revendicationsDetecter(db, texte) {
  const L = String(texte || '').split('\n').map((x) => lot3Plier(x).replace(/\s+/g, ' ').trim()).filter(Boolean); const out = {};
  const juger = (re) => { let pos = false; let neg = false; L.forEach((l) => { if (!re.test(l)) return; if (REV_NEG.test(l)) neg = true; else if (REV_POS.test(l)) pos = true; }); return neg ? 'non' : pos ? 'oui' : ''; };
  qualifList(db).forEach((q) => {
    if (q.id === 'conv') return; let re = null;
    if (q.id === 'bio') re = REV_BIO;
    else {
      const mots = uniq([q.label, q.court].map((x) => lot3Plier(x).replace(/[^a-z0-9& +-]/g, ' ').replace(/\s+/g, ' ').trim()).filter((x) => x.length >= 3 && !/^(fr-bio-01|bio|conv)$/.test(x)));
      if (!mots.length) return; re = new RegExp(`(^|[^a-z0-9])(${mots.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})s?([^a-z0-9]|$)`);
    }
    const v = juger(re); if (v) out[q.id] = v;
  });
  return out;
}
// détections ajoutées aux informations lues par le script (FichesDepot) : allergènes et revendications d'un intrant, contact alimentaire
// et usage en cave d'un produit de maintenance
function ficheDetections(db, texte) {
  const out = {}; if (!String(texte || '').trim()) return out;
  const A = allergenesDetecter(texte); if (A.presents.length) out.allergenesListe = A.presents.join('|'); else if (A.aucun) out.allergenesListe = 'aucun';
  const R = revendicationsDetecter(db, texte); Object.keys(R).forEach((k) => { out[`rev:${k}`] = R[k]; });
  const ca = maintContactDetecter(texte); if (ca) out.contactAlimentaire = ca;
  return out;
}
const DETECTION_CLES = (k) => k === 'allergenesListe' || /^rev:/.test(k) || k === 'contactAlimentaire';
// propositions de la revue d'un dépôt pour ces détections (cochées quand elles complètent la fiche sans changer un choix vérifié)
function detectionPropositions(db, cible, p, V) {
  if (!cible || !p || !V) return []; const out = [];
  if (cible.type === 'produit') {
    if (V.allergenesListe) {
      const cur = allergenesDe(p);
      if (V.allergenesListe === 'aucun') { if (!cur.length && !p.allergenesAucun) out.push({ k: 'allergenesListe', lab: 'Allergènes (liste)', v: 'aucun', aff: 'Aucun allergène déclaré', src: 'script', actuel: '', complete: true }); }
      else { const nv = V.allergenesListe.split('|').filter((x) => allergeneDef(x) && !cur.includes(x)); if (nv.length) out.push({ k: 'allergenesListe', lab: 'Allergènes (liste)', v: nv.join('|'), aff: nv.map(allergeneCourt).join(', '), src: 'script', actuel: cur.map(allergeneCourt).join(', '), complete: true, ajout: true }); }
    }
    if (p.categorie !== 'sec') Object.keys(V).filter((k) => /^rev:/.test(k)).forEach((k) => {
      const qid = k.slice(4); const q = qualifDef(db, qid); if (!q) return; const v = V[k] === 'oui'; const r = ruleFor(db, p.id, qid);
      if (r && !!r.autorise === v) return; const verifiee = !!(r && r.aVerifier === false && r.verifieLe);
      out.push({ k, lab: `Utilisable en ${q.label}`, v: V[k], aff: v ? 'Oui' : 'Non', src: 'script', actuel: r ? (r.autorise ? 'Oui' : 'Non') : '', complete: !verifiee });
    });
  }
  if (cible.type === 'produitMaintenance' && V.contactAlimentaire && p.contactAlimentaire !== V.contactAlimentaire) out.push({ k: 'contactAlimentaire', lab: 'Agréé contact alimentaire', v: V.contactAlimentaire, aff: V.contactAlimentaire === 'oui' ? 'Oui' : 'Non', src: 'script', actuel: p.contactAlimentaire ? (p.contactAlimentaire === 'oui' ? 'Oui' : 'Non') : '', complete: !p.contactAlimentaire });
  return out;
}
function detectionAppliquer(db, cible, p, k, v) {
  if (k === 'allergenesListe') {
    if (v === 'aucun') { if (allergenesDe(p).length) return 0; p.allergenesAucun = true; return 1; }
    const nv = String(v || '').split('|').filter((x) => allergeneDef(x)); const cur = allergenesDe(p); const L = uniq([...cur, ...nv]); if (L.length === cur.length) return 0;
    p.allergenesListe = ALLERGENES.map((a) => a[0]).filter((x) => L.includes(x)); p.allergenesAucun = false; return 1;
  }
  if (/^rev:/.test(k) && cible.type === 'produit') return revendicationsAppliquer(db, p.id, { [k.slice(4)]: v === 'oui' }, { aVerifier: true, source: 'lu dans une FT / FDS déposée' });
  if (k === 'contactAlimentaire' && cible.type === 'produitMaintenance') { if (!['oui', 'non'].includes(v) || p.contactAlimentaire === v) return 0; p.contactAlimentaire = v; return 1; }
  return 0;
}

/* ---------- régularisations manuelles de stock (inventaire, casse, perte…) ---------- */
const REGUL_MOTIFS = [['inventaire', 'Inventaire (stock compté)'], ['casse', 'Casse'], ['perte', 'Perte'], ['peremption', 'Péremption, produit détruit'], ['ecart', 'Écart constaté'], ['echantillon', 'Échantillon, don'], ['retour', 'Retour au fournisseur'], ['autre', 'Autre motif']];
const regulMotifLib = (m) => (REGUL_MOTIFS.find((x) => x[0] === m) || [m, 'Autre motif'])[1];
const regulsDe = (db) => (Array.isArray(db && db.regulStocks) ? db.regulStocks.filter((x) => x && x.id && x.arrivageId) : []);
// restant d'un lot fournisseur à une date, sans une régularisation donnée (modification) : base du calcul d'un inventaire
function regulRestant(db, arrivageId, date, sauf) {
  const a = (db.arrivages || []).find((x) => x.id === arrivageId); if (!a) return null;
  const d = sauf ? { ...db, regulStocks: regulsDe(db).filter((x) => x.id !== sauf) } : db; const R = replay(d, date || null); return arrivalRest(R, a);
}
function regulSave(db, s, id, uid) {
  s = s || {}; const a = (db.arrivages || []).find((x) => x.id === s.arrivageId); if (!a) return fail('Choisissez le lot fournisseur (arrivage) à régulariser.');
  if (!isoOK(s.date)) return fail('Date de la régularisation invalide.');
  if (a.date && s.date < a.date) return fail(`Le lot a été reçu le ${fmtDate(a.date)} : régularisation impossible avant.`);
  if (isLocked(db, s.date)) return fail('Cette date appartient à une campagne figée.');
  const motif = REGUL_MOTIFS.some((m) => m[0] === s.motif) ? s.motif : 'autre';
  const old = id ? regulsDe(db).find((x) => x.id === id) : null; if (id && !old) return fail('Régularisation introuvable.'); if (old && isLocked(db, old.date)) return fail('Régularisation verrouillée (campagne figée).');
  const rest = regulRestant(db, a.id, s.date, id || null); let qty; let compte = null;
  if (s.mode === 'compte') { if (!hasNum(s.compte) || num(s.compte) < 0) return fail('Quantité comptée : valeur positive ou nulle requise.'); compte = r2(num(s.compte)); qty = r2(compte - rest); if (Math.abs(qty) < 1e-6) return fail('Le stock compté est égal au restant : aucune régularisation à enregistrer.'); }
  else { if (!hasNum(s.qty) || Math.abs(num(s.qty)) < 1e-9) return fail('Quantité de la régularisation : valeur non nulle requise (− pour une sortie, + pour une entrée).'); qty = r2(num(s.qty)); }
  if (s.mode !== 'compte' && ['casse', 'perte', 'peremption', 'echantillon', 'retour'].includes(motif) && qty > 0) qty = -qty; // ces motifs retirent du stock (0.38.0-alpha.3 : un comptage donne le signe de lui-même)
  if (rest + qty < -1e-6) return fail(`Régularisation supérieure au restant du lot (${fmt(rest, 2)}).`);
  const motifTxt = String(s.notes || '').trim().slice(0, 300); if (motif === 'autre' && !motifTxt) return fail('Motif « Autre » : précisez la raison dans les notes.');
  const x = { arrivageId: a.id, produitId: a.produitId, date: s.date, qty, motif, notes: motifTxt, restantAvant: r2(rest), ...(compte != null ? { compte } : {}), par: uid || s.par || '', le: new Date().toISOString() };
  if (!Array.isArray(db.regulStocks)) db.regulStocks = [];
  if (old) { ['compte'].forEach((k) => { delete old[k]; }); Object.assign(old, x, { modifie: true }); return okr({ id: old.id, qty }); }
  const nv = { id: nid(db, 'rg'), ...x }; db.regulStocks.push(nv); return okr({ id: nv.id, qty });
}
function regulDelete(db, id) {
  const x = regulsDe(db).find((y) => y.id === id); if (!x) return fail('Régularisation introuvable.'); if (isLocked(db, x.date)) return fail('Régularisation verrouillée (campagne figée).');
  db.regulStocks = db.regulStocks.filter((y) => !(y && y.id === id)); return okr();
}
// historique des mouvements d'un produit (ou d'un lot fournisseur) : réceptions, utilisations (opérations), régularisations, solde cumulé
function intrantMouvements(db, R, o = {}) {
  const A = (db.arrivages || []).filter((a) => (!o.produitId || a.produitId === o.produitId) && (!o.arrivageId || a.id === o.arrivageId)); const ids = new Set(A.map((a) => a.id)); const lot = (id) => (A.find((a) => a.id === id) || {}).numLot || '';
  const M = [
    ...A.map((a) => ({ date: a.date, ordre: 0, type: 'arrivage', qty: num(a.qty), arrivageId: a.id, numLot: a.numLot, libelle: 'Réception', detail: ((db.fournisseurs || []).find((f) => f.id === a.fournisseurId) || {}).nom || '', id: a.id })),
    ...(R.apps || []).filter((x) => x.arrivageId && ids.has(x.arrivageId) && num(x.qty)).map((x) => ({ date: x.date, ordre: 1, type: 'utilisation', qty: -num(x.qty), arrivageId: x.arrivageId, numLot: lot(x.arrivageId), libelle: OP_LABELS[x.opType] || x.opType || 'Opération', detail: x.lotId && R.lots[x.lotId] ? R.lots[x.lotId].code : '', opId: x.opId })),
    ...regulsDe(db).filter((x) => ids.has(x.arrivageId) && (!R.upTo || x.date <= R.upTo)).map((x) => ({ date: x.date, ordre: 2, type: 'regul', qty: num(x.qty), arrivageId: x.arrivageId, numLot: lot(x.arrivageId), libelle: `Régularisation : ${regulMotifLib(x.motif)}`, detail: [x.compte != null ? `compté : ${fmt(x.compte, 2)}` : '', x.notes].filter(Boolean).join(' — '), id: x.id, par: x.par })),
  ].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.ordre - b.ordre));
  let solde = 0; M.forEach((m) => { solde += m.qty; m.solde = r2(solde); });
  return M;
}

/* ---------- fiche récapitulative des produits œnologiques (colonnes au choix) ---------- */
const RECAP_INTRANTS_COLS = [
  ['nom', 'Produit'], ['categorie', 'Catégorie'], ['famille', 'Famille'], ['fournisseur', 'Fournisseur'], ['reference', 'Référence'], ['fabricant', 'Fabricant'], ['unite', 'Unité de stock'],
  ['stock', 'Stock actuel'], ['lots', 'Lots en stock'], ['dluo', 'Prochaine DLUO'], ['revendications', 'Revendications compatibles'], ['bio', 'Utilisable en bio'], ['allergenes', 'Allergènes'],
  ['composition', 'Composition'], ['dose', 'Dose d’emploi'], ['so2', 'Teneur en SO₂'], ['fds', 'FDS'], ['ft', 'Fiche technique'], ['conservation', 'Conservation'], ['stockage', 'Stockage'], ['notes', 'Notes'],
];
const RECAP_INTRANTS_DEFAUT = ['nom', 'fournisseur', 'stock', 'revendications', 'allergenes', 'fds'];
const ouiNon = (v) => (v ? 'Oui' : 'Non');
function recapIntrants(db, R, cols, o = {}) {
  const C = RECAP_INTRANTS_COLS.filter(([k]) => (cols || RECAP_INTRANTS_DEFAUT).includes(k)); const auj = o.today || todayISO();
  const P = (db.produits || []).filter((p) => (o.inactifs || p.actif !== false) && (!o.categorie || p.categorie === o.categorie)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const lignes = [];
  P.forEach((p) => {
    const ls = (db.arrivages || []).filter((a) => a.produitId === p.id).map((a) => ({ a, rest: arrivalRest(R, a) })).filter((x) => x.rest > 0.0001);
    if (o.enStock && !ls.length) return; const total = sum(ls, (x) => x.rest);
    const dl = ls.filter((x) => x.a.dluo).sort((x, y) => (x.a.dluo < y.a.dluo ? -1 : 1))[0];
    const revs = p.categorie === 'sec' ? 'sans objet' : qualifList(db).filter((q) => !q.masque && (regleEffective(db, p, q.id) || {}).autorise).map((q) => q.label).join(', ') || 'aucune';
    const v = {
      nom: p.nom, categorie: CATEGORIES[p.categorie] || p.categorie, famille: p.famille ? famLabel(p.famille) : '', fournisseur: fournisseurNom(db, p.fournisseurId), reference: p.reference || '', fabricant: p.fabricant || '', unite: p.unite,
      stock: `${fmt(total, 2)} ${p.unite}`, lots: ls.map((x) => `${x.a.numLot} (${fmt(x.rest, 2)})`).join(', '), dluo: dl ? `${fmtDate(dl.a.dluo)}${dl.a.dluo < auj ? ' (dépassée)' : ''}` : '',
      revendications: revs, bio: p.categorie === 'sec' || !qualifDef(db, 'bio') ? '' : ouiNon((regleEffective(db, p, 'bio') || {}).autorise), allergenes: allergenesTexte(p),
      composition: p.composition || '', dose: p.doseEmploi || '', so2: p.so2 || '', fds: prodFdsEtat(db, p, auj).label, ft: prodFtEtat(db, p).label, conservation: p.conservation || '', stockage: p.stockage || '', notes: p.notes || '',
    };
    lignes.push({ id: p.id, cells: C.map(([k]) => v[k]) });
  });
  return { entetes: C.map((c) => c[1]), cles: C.map((c) => c[0]), lignes };
}
const recapCsv = (T, tr) => toCSV([T.entetes.map((h) => (tr ? tr(h) : h)), ...T.lignes.map((l) => l.cells.map((c) => (c == null ? '' : c)))]);
