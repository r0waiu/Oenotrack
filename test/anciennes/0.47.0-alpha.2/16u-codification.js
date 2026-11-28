/* ============ CODIFICATION DES LOTS (0.41.0-alpha.1) : règles libres par stade, versionnées par date d'effet ============
   Aucun style n'est imposé : chaque exploitation compose le code de ses lots à chaque stade avec des briques (texte, séparateur,
   date, millésime, compteur, variable du lot, choix dans une table, reprise du code précédent), des conditions et une mise en forme.
   - db.codifRegles = [{ id: stade, unicite: 'refus' | 'avert' | 'aucune', declencheurs: [stades du vin], versions: [{ id, des, briques,
     defaut?: true (code d'Œnotrack), note, par, le }], maj }] — sans version applicable à la date : code d'Œnotrack (inchangé)
   - db.codifTables = [{ id, nom, source: 'libre' | variable, lignes: [{ id, cle, libelle, code }], maj }]
   - chaque lot (lots, lotsFinis, habillages, préparations) garde `codif = { stade, version, parts, cpt, cle, choix, manuel? }` :
     le compteur suivant se déduit de la base (jamais stocké), l'héritage d'une partie est sûr même si la règle a changé
   - aucun code existant n'est jamais recalculé : une nouvelle version ne vaut que pour les lots créés à partir de sa date
   - db.habillages = [{ id, type: 'habillage' | 'carton', date, heure, source: { type: 'fini' | 'habillage', id }, nb, nbCartons, parCarton,
     code, designation, codif, notes, operateurs, codesPrecedents, par, le }] (opérations « Habillage » et « Mise en carton / expédition »)
   - renommage manuel (réétiquetage, exception) : motif exigé, anciens codes gardés dans `codesPrecedents` (cherchables) */

const CODIF_GROUPES = [
  { id: 'vendange', label: 'Vendange (marc / lot de pressoir)' },
  { id: 'reception', label: 'Réception des moûts / entrée en cuverie' },
  { id: 'vinification', label: 'Vinification / cuves et fûts' },
  { id: 'tirage', label: 'Assemblage & tirage' },
  { id: 'lattes', label: 'Stockage sur lattes' },
  { id: 'degorgement', label: 'Dégorgement' },
  { id: 'habillage', label: 'Habillage' },
  { id: 'expedition', label: 'Mise en carton / expédition' },
];
// coll : où vivent les codes (unicité, compteurs) ; parent : stade dont le code peut être repris ; ops : opérations qui créent le lot
const CODIF_STADES = [
  { id: 'marc', groupe: 'vendange', label: 'Lot du marc (pressée)', coll: 'lots', ops: ['pressurage'], defaut: 'P + année (2 chiffres) + « - » + rang (P26-01)' },
  { id: 'fraction', groupe: 'vendange', label: 'Fractions de presse (cuvée, tailles, rebêches)', coll: 'lots', ops: ['pressurage'], parent: 'marc', defaut: 'code du marc + « - » + suffixe de la fraction (P26-01-C)' },
  { id: 'mout', groupe: 'reception', label: 'Lots de moûts reçus (un par cuve)', coll: 'lots', ops: ['entree_mout'], defaut: 'M + année + « - » + rang, puis suffixe de la fraction (M26-01-C)' },
  { id: 'vin', groupe: 'reception', label: 'Entrée de vin en contenant (achat, reprise)', coll: 'lots', ops: ['reprise'], defaut: 'saisi à la main' },
  { id: 'vinification', groupe: 'vinification', label: 'Nouveau code au changement de stade du vin', coll: 'lots', ops: ['etape'], parent: 'vinification', declencheur: true, defaut: 'le lot garde son code' },
  { id: 'prep_levain', groupe: 'vinification', label: 'Levains levuriens', coll: 'preps', ops: ['preparation'], ptype: 'levain', defaut: 'LEV-26-01' },
  { id: 'prep_pied_mlf', groupe: 'vinification', label: 'Pieds de cuve malolactiques', coll: 'preps', ops: ['preparation'], ptype: 'pied_mlf', defaut: 'PDC-26-01' },
  { id: 'assemblage', groupe: 'tirage', label: 'Assemblages', coll: 'lots', ops: ['assemblage'], parent: 'source', defaut: 'AS + année + « - » + rang (AS26-01)' },
  { id: 'tirage', groupe: 'tirage', label: 'Lots de tirage (mis sur lattes)', coll: 'lots', ops: ['tirage'], parent: 'source', defaut: 'T + année + « - » + rang (T26-01)' },
  { id: 'prep_liqueur_tirage', groupe: 'tirage', label: 'Liqueurs de tirage', coll: 'preps', ops: ['preparation'], ptype: 'liqueur_tirage', defaut: 'LT-26-01' },
  { id: 'prep_liqueur_exp', groupe: 'tirage', label: 'Liqueurs d’expédition', coll: 'preps', ops: ['preparation'], ptype: 'liqueur_exp', defaut: 'LE-26-01' },
  { id: 'lattes_achat', groupe: 'lattes', label: 'Lots achetés sur lattes ou dosées nues', coll: 'lots', ops: ['reprise'], defaut: 'saisi à la main (le code du fournisseur est gardé à part)' },
  { id: 'degorgement', groupe: 'degorgement', label: 'Lots finis (dégorgés)', coll: 'finis', ops: ['degorgement'], parent: 'tirage', defaut: 'LF-26-001' },
  { id: 'habillage', groupe: 'habillage', label: 'Lots habillés', coll: 'habillages', parent: 'degorgement', defaut: 'H + année + « - » + rang (H26-001)' },
  { id: 'expedition', groupe: 'expedition', label: 'Mises en carton / expéditions', coll: 'habillages', parent: 'habillage', defaut: 'C + année + « - » + rang (C26-001)' },
];
const codifStadeDef = (id) => CODIF_STADES.find((s) => s.id === id) || (String(id || '').startsWith('op:') ? { id, groupe: 'perso', label: id.slice(3), coll: 'lots', ops: [], perso: true } : null);
// stade d'une opération (type de base, nature, catalogue personnalisé) : une règle propre à une opération du catalogue (« op:<id> ») passe d'abord
function codifStadePourOp(db, type, o) {
  o = o || {}; let s = '';
  if (type === 'pressurage') s = 'marc'; else if (type === 'entree_mout') s = 'mout'; else if (type === 'assemblage') s = 'assemblage'; else if (type === 'tirage') s = 'tirage';
  else if (type === 'degorgement') s = 'degorgement'; else if (type === 'etape') s = 'vinification';
  else if (type === 'preparation') s = `prep_${o.ptype || 'liqueur_tirage'}`;
  else if (type === 'reprise') s = o.kind === 'bouteilles' || num(o.nbBouteilles) > 0 ? 'lattes_achat' : 'vin';
  const perso = o.sousType && o.sousType !== type ? `op:${o.sousType}` : '';
  return perso && (db.codifRegles || []).some((r) => r && r.id === perso && (r.versions || []).length) ? perso : s;
}

/* ---------- briques ---------- */
const CODIF_BRIQUES = [
  { id: 'texte', label: 'Texte fixe' }, { id: 'sep', label: 'Séparateur' }, { id: 'date', label: 'Date ou heure' }, { id: 'millesime', label: 'Millésime(s)' },
  { id: 'compteur', label: 'Compteur' }, { id: 'variable', label: 'Donnée du lot' }, { id: 'choix', label: 'Choix dans une table' }, { id: 'herite', label: 'Reprise du code précédent' },
];
const CODIF_DATES = [
  { id: 'annee', label: 'Année', chiffres: 2 }, { id: 'mois', label: 'Mois', chiffres: 2 }, { id: 'jour', label: 'Jour du mois', chiffres: 2 },
  { id: 'quantieme', label: 'Quantième (jour de l’année)', chiffres: 3 }, { id: 'semaine', label: 'N° de semaine', chiffres: 2 }, { id: 'jourSemaine', label: 'Jour de la semaine (1 = lundi)', chiffres: 1 },
  { id: 'heure', label: 'Heure', chiffres: 2 }, { id: 'minute', label: 'Minute', chiffres: 2 },
];
// variables du lot : valeur (libellé), code court de la liste quand il existe, ou table de correspondance
const CODIF_VARS = [
  { id: 'cepage', label: 'Cépage (majoritaire)', liste: true }, { id: 'cepages', label: 'Cépages (tous, du plus présent au moins présent)', liste: true, ensemble: true },
  { id: 'fraction', label: 'Fraction de pressurage (majoritaire)', liste: true }, { id: 'fractions', label: 'Fractions (toutes)', liste: true, ensemble: true },
  { id: 'cru', label: 'Cru (majoritaire)', liste: true }, { id: 'echelle', label: 'Échelle des crus', liste: true }, { id: 'revendication', label: 'Revendication / label', liste: true },
  { id: 'couleur', label: 'Couleur du vin', liste: true }, { id: 'stade', label: 'Stade du vin', liste: true }, { id: 'site', label: 'Site / dépôt', liste: true },
  { id: 'contenant', label: 'Cuve ou fût', liste: true }, { id: 'apporteur', label: 'Partenaire (majoritaire)', liste: true },
  { id: 'marc', label: 'N° de marc (carnet de pressoir)' }, { id: 'codeFournisseur', label: 'Code du lot chez le fournisseur' }, { id: 'dosage', label: 'Dosage (g/L)' },
  { id: 'nb', label: 'Nombre de bouteilles' }, { id: 'format', label: 'Format du flacon (cL)' }, { id: 'nbCartons', label: 'Nombre de cartons' },
];
const CODIF_TESTS = [{ id: 'rempli', label: 'est renseigné' }, { id: 'vide', label: 'est vide' }, { id: 'egal', label: 'est égal à' }, { id: 'different', label: 'est différent de' }, { id: 'changeParent', label: 'diffère de l’étape précédente' }];
const CODIF_ALPHABETS = { num: '0123456789', alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', alphaInv: 'ZYXWVUTSRQPONMLKJIHGFEDCBA' };
const CODIF_RAZ = [{ id: 'jamais', label: 'Jamais' }, { id: 'campagne', label: 'À chaque vendange (campagne)' }, { id: 'annee', label: 'À chaque année civile' }, { id: 'mois', label: 'Chaque mois' }, { id: 'semaine', label: 'Chaque semaine' }, { id: 'jour', label: 'Chaque jour' }];
const CODE_CHAMPENOIS = 'CHAMPENOIS'; // 1 = C, 2 = H, 3 = A, 4 = M, 5 = P, 6 = E, 7 = N, 8 = O, 9 = I, 0 = S

/* ---------- encodages ---------- */
const codifChampenois = (s) => String(s).replace(/\d/g, (d) => CODE_CHAMPENOIS[(+d + 9) % 10]);
const codifDeChampenois = (s) => String(s).toUpperCase().replace(/[CHAMPENOIS]/g, (c) => String((CODE_CHAMPENOIS.indexOf(c) + 1) % 10));
// n (≥ 1) en numération bijective sur un alphabet : A…Z, AA, AB… (alphabet décroissant : Z = 1, Y = 2…)
function codifLettres(n, alphabet) {
  const A = String(alphabet || CODIF_ALPHABETS.alpha); const k = A.length; let x = Math.floor(num(n)); if (!(x >= 1) || !k) return '';
  let s = ''; while (x > 0) { x -= 1; s = A[x % k] + s; x = Math.floor(x / k); } return s;
}
function codifNombre(n, b) { // compteur rendu selon son alphabet et sa longueur
  const al = b.alphabet || 'num';
  if (al === 'num') return pad(Math.max(0, Math.floor(num(n))), Math.max(1, num(b.chiffres) || 1));
  const A = al === 'perso' ? uniq(String(b.caracteres || '').split('')).join('') : CODIF_ALPHABETS[al] || CODIF_ALPHABETS.alpha;
  if (A.length < 2) return String(n);
  const s = codifLettres(n, A); const w = num(b.chiffres) || 0; return w > s.length ? A[0].repeat(w - s.length) + s : s;
}
const codifJourAn = (iso) => daysBetween(`${iso.slice(0, 4)}-01-01`, iso) + 1;
function codifSemaine(iso) { // n° de semaine ISO 8601
  const d = new Date(`${iso}T12:00:00Z`); const j = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - j + 3);
  const a = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return 1 + Math.round(((d - a) / 86400000 - 3 + ((a.getUTCDay() + 6) % 7)) / 7);
}
const codifJourSemaine = (iso) => ((new Date(`${iso}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;

/* ---------- tables de correspondance ---------- */
const codifTables = (db) => (Array.isArray(db && db.codifTables) ? db.codifTables.filter((t) => t && t.id) : []);
const codifTable = (db, id) => codifTables(db).find((t) => t.id === id) || null;
const codifCleEnsemble = (ids) => [...(ids || [])].map(String).sort().join('+');
function codifTableCode(db, tableId, cle) {
  const t = codifTable(db, tableId); if (!t) return null; const c = String(cle === undefined || cle === null ? '' : cle);
  const l = (t.lignes || []).find((x) => x && String(x.cle) === c) || (c.includes('+') ? (t.lignes || []).find((x) => x && codifCleEnsemble(String(x.cle).split('+')) === codifCleEnsemble(c.split('+'))) : null);
  return l ? String(l.code || '') : null;
}
// lignes proposées d'office pour une table liée à une liste (cépages, fractions…) : clés = identifiants de la liste
function codifElementsListe(db, v) {
  const L = (x, f) => (x || []).filter(Boolean).map((e) => ({ cle: e.id, libelle: f(e), court: e.court || e.suffix || e.code || '' }));
  switch (v) {
    case 'cepage': case 'cepages': return L(db.lists.cepages, (e) => e.label);
    case 'fraction': case 'fractions': return L(fracList(db), (e) => e.label).map((e) => ({ ...e, court: (fracDef(db, e.cle) || {}).suffix || '' }));
    case 'cru': return L(db.crus, (e) => e.nom);
    case 'echelle': return L(echList(db), (e) => e.un || e.label);
    case 'revendication': return L(qualifList(db), (e) => e.label);
    case 'couleur': return L(couleurList(db), (e) => e.label);
    case 'stade': return L(stadeList(db), (e) => e.label);
    case 'site': return L(db.sites, (e) => e.nom);
    case 'contenant': return L(db.contenants, (e) => e.nom);
    case 'apporteur': return L(db.apporteurs, (e) => e.nom);
    default: return [];
  }
}
function codifTableSet(db, t, opts) {
  opts = opts || {}; const nom = String((t && t.nom) || '').trim(); if (!nom) return fail('Donnez un nom à la table.');
  if (!Array.isArray(db.codifTables)) db.codifTables = [];
  const id = (t && t.id) || nid(db, 'ctab'); if (db.codifTables.some((x) => x && x.id !== id && norm(x.nom).trim() === norm(nom))) return fail(`Une table « ${nom} » existe déjà.`);
  const src = t.source && (t.source === 'libre' || CODIF_VARS.some((v) => v.id === t.source) || t.source === 'date') ? t.source : 'libre';
  const lignes = (Array.isArray(t.lignes) ? t.lignes : []).filter((l) => l && (String(l.cle || '').trim() || String(l.libelle || '').trim() || String(l.code || '').trim()))
    .map((l) => ({ ...l, id: l.id || nid(db, 'cl'), cle: String(l.cle === undefined || l.cle === null || l.cle === '' ? (src === 'libre' ? (l.id || '') : '') : l.cle).trim(), libelle: String(l.libelle || '').trim(), code: String(l.code || '') }));
  lignes.forEach((l) => { if (src === 'libre' && !l.cle) l.cle = l.id; });
  const cles = lignes.map((l) => l.cle).filter(Boolean); if (new Set(cles).size !== cles.length) return fail('Deux lignes de la table ont la même valeur d’origine.');
  if (src === 'libre' && lignes.some((l) => !l.libelle)) return fail('Chaque ligne de la table doit avoir un libellé (ce qui est choisi à la saisie).');
  const x = { ...(codifTable(db, id) || {}), ...t, id, nom, source: src, lignes, maj: opts.le || new Date().toISOString(), ...(opts.par ? { par: opts.par } : {}) };
  const i = db.codifTables.findIndex((y) => y && y.id === id); if (i >= 0) db.codifTables[i] = x; else db.codifTables.push(x);
  return okr({ id });
}
const codifTableUsages = (db, id) => (db.codifRegles || []).filter((r) => r && (r.versions || []).some((v) => (v.briques || []).some((b) => b && (b.tableId === id || (b.si && b.si.variable === `choix:${id}`))))).map((r) => r.id);
function codifTableDel(db, id) {
  const u = codifTableUsages(db, id); if (u.length) return fail(`Cette table sert dans la règle : ${u.map((s) => (codifStadeDef(s) || { label: s }).label).join(', ')}.`);
  db.codifTables = codifTables(db).filter((t) => t.id !== id); return okr();
}

/* ---------- règles et versions ---------- */
const codifRegleDe = (db, stade) => (Array.isArray(db && db.codifRegles) ? db.codifRegles.find((r) => r && r.id === stade) : null) || null;
const codifVersions = (db, stade) => [...((codifRegleDe(db, stade) || {}).versions || [])].filter(Boolean).sort((a, b) => String(a.des || '').localeCompare(String(b.des || '')));
// version en vigueur à une date (la plus récente dont la date d'effet est passée) ; null = code d'Œnotrack
function codifVersion(db, stade, date) {
  const d = isoOK(date) ? date : todayISO(); const V = codifVersions(db, stade).filter((v) => !v.des || v.des <= d); const v = V[V.length - 1];
  return v && !v.defaut && (v.briques || []).length ? v : null;
}
const codifActif = (db, stade, date) => !!(stade && codifVersion(db, stade, date));
const codifUnicite = (db, stade, date) => (codifActif(db, stade, date) ? ((codifRegleDe(db, stade) || {}).unicite || 'refus') : 'refus');
const codifDeclencheurs = (db) => ((codifRegleDe(db, 'vinification') || {}).declencheurs || []);
// enregistrements codés d'un stade (pour les compteurs et l'unicité)
function codifEnregistrements(db, stade) {
  const st = codifStadeDef(stade) || { coll: 'lots' }; const out = [];
  if (st.coll === 'lots') (db.lots || []).forEach((l) => { if (l && l.code) out.push({ id: l.id, code: l.code, codif: l.codif, date: l.date }); });
  else if (st.coll === 'finis') (db.lotsFinis || []).forEach((l) => { if (l && l.code) out.push({ id: l.id, code: l.code, codif: l.codif, date: l.date }); });
  else if (st.coll === 'habillages') (db.habillages || []).forEach((h) => { if (h && h.code && (stade === 'expedition' ? h.type === 'carton' : h.type !== 'carton')) out.push({ id: h.id, code: h.code, codif: h.codif, date: h.date }); });
  else if (st.coll === 'preps') (db.ops || []).forEach((o) => { if (o && o.type === 'preparation' && o.code) out.push({ id: o.prepId || o.id, code: o.code, codif: o.codif, date: o.date }); });
  return out;
}
const codifUsage = (db, stade, vid) => codifEnregistrements(db, stade).filter((r) => r.codif && r.codif.stade === stade && r.codif.version === vid).length;
function codifCodePris(db, stade, code, exclure) {
  const c = norm(code).trim(); if (!c) return false; const ex = exclure || [];
  return codifEnregistrements(db, stade).some((r) => norm(r.code).trim() === c && !ex.includes(r.id));
}

// contrôle d'une composition
function codifValider(db, stade, briques) {
  const B = (Array.isArray(briques) ? briques : []).filter(Boolean); if (!B.length) return fail('Ajoutez au moins une brique au code.');
  const st = codifStadeDef(stade); if (!st) return fail('Stade inconnu.');
  if (B.filter((b) => b.type === 'compteur').length > 1) return fail('Un seul compteur par code.');
  for (const b of B) {
    if (!CODIF_BRIQUES.some((x) => x.id === b.type)) return fail(`Brique inconnue (${b.type}).`);
    if ((b.type === 'texte' || b.type === 'sep') && !String(b.valeur || '').length) return fail('Une brique de texte ou un séparateur est vide.');
    if (b.type === 'date' && !CODIF_DATES.some((x) => x.id === b.champ)) return fail('Choisissez l’élément de date (année, mois, jour…).');
    if (b.type === 'variable' && !CODIF_VARS.some((x) => x.id === b.variable)) return fail('Choisissez la donnée du lot.');
    if ((b.type === 'choix' || b.rendu === 'table' || b.encodage === 'table') && !codifTable(db, b.tableId)) return fail('Choisissez la table de correspondance.');
    if (b.type === 'herite' && !st.parent) return fail('Ce stade n’a pas d’étape précédente : la reprise du code est impossible.');
    if (b.type === 'compteur' && (b.alphabet === 'perso' && uniq(String(b.caracteres || '').split('')).length < 2)) return fail('Un alphabet personnalisé demande au moins deux caractères.');
    if (num(b.largeur) > 40) return fail('Largeur fixe limitée à 40 caractères.');
    if (b.si && b.si.variable && !CODIF_TESTS.some((x) => x.id === b.si.test)) return fail('Condition incomplète.');
  }
  const noms = B.map((b) => String(b.nom || '').trim()).filter(Boolean); if (new Set(noms.map(norm)).size !== noms.length) return fail('Deux briques portent le même nom.');
  return okr();
}
function codifVersionSet(db, stade, v, opts) {
  opts = opts || {}; if (!codifStadeDef(stade)) return fail('Stade inconnu.');
  const des = v && v.des ? String(v.des) : ''; if (des && !isoValide(des)) return fail('Date d’effet invalide.');
  if (!(v && v.defaut)) { const c = codifValider(db, stade, v && v.briques); if (!c.ok) return c; }
  if (!Array.isArray(db.codifRegles)) db.codifRegles = [];
  let r = codifRegleDe(db, stade); if (!r) { r = { id: stade, unicite: 'refus', versions: [] }; db.codifRegles.push(r); }
  if (!Array.isArray(r.versions)) r.versions = [];
  const id = v.id || nid(db, 'cv'); const ex = r.versions.find((x) => x && x.id === id);
  if (ex && codifUsage(db, stade, id)) return fail('Cette version a déjà servi à coder des lots : créez une nouvelle version à partir d’une date (les lots déjà codés ne changent pas).');
  if (r.versions.some((x) => x && x.id !== id && String(x.des || '') === des)) return fail(des ? `Une version commence déjà le ${fmtDate(des)}.` : 'Une version sans date d’effet existe déjà : donnez une date à la nouvelle version.');
  const x = { id, des, ...(v.defaut ? { defaut: true, briques: [] } : { briques: clone(v.briques).map((b) => ({ ...b, id: b.id || nid(db, 'cb') })) }), note: String(v.note || '').trim(), par: opts.par || v.par || '', le: opts.le || new Date().toISOString() };
  if (ex) r.versions[r.versions.indexOf(ex)] = x; else r.versions.push(x);
  r.versions.sort((a, b) => String(a.des || '').localeCompare(String(b.des || ''))); r.maj = x.le;
  return okr({ id });
}
function codifVersionDel(db, stade, vid) {
  const r = codifRegleDe(db, stade); if (!r) return fail('Règle introuvable.');
  if (codifUsage(db, stade, vid)) return fail('Cette version a déjà servi : elle est gardée (les lots codés y renvoient).');
  r.versions = (r.versions || []).filter((x) => x && x.id !== vid); r.maj = new Date().toISOString(); return okr();
}
function codifRegleOptions(db, stade, o) {
  if (!codifStadeDef(stade)) return fail('Stade inconnu.');
  if (!Array.isArray(db.codifRegles)) db.codifRegles = [];
  let r = codifRegleDe(db, stade); if (!r) { r = { id: stade, versions: [] }; db.codifRegles.push(r); }
  if (o.unicite !== undefined) { if (!['refus', 'avert', 'aucune'].includes(o.unicite)) return fail('Choix d’unicité inconnu.'); r.unicite = o.unicite; }
  if (o.declencheurs !== undefined) r.declencheurs = uniq((o.declencheurs || []).filter((s) => stadeDef(db, s)));
  r.maj = new Date().toISOString(); return okr();
}
// noms des parties d'un stade (pour la reprise d'une partie) : toutes ses versions
const codifParties = (db, stade) => uniq(codifVersions(db, stade).flatMap((v) => (v.briques || []).map((b) => String(b.nom || '').trim()).filter(Boolean)));
// tables à choisir à la saisie dans la règle en vigueur
const codifChoixTables = (db, stade, date) => { const v = codifVersion(db, stade, date); return v ? uniq(v.briques.filter((b) => b.type === 'choix' || (b.si && String(b.si.variable || '').startsWith('choix:'))).map((b) => (b.type === 'choix' ? b.tableId : b.si.variable.slice(6)))).map((id) => codifTable(db, id)).filter(Boolean) : []; };

/* ---------- contexte : ce que l'on sait du lot ---------- */
const codifMajoritaire = (m) => { const k = Object.keys(m || {}).filter((x) => x && x !== '?' && x !== 'inconnu' && num(m[x]) > 0).sort((a, b) => num(m[b]) - num(m[a]) || a.localeCompare(b)); return k; };
// contexte d'un mélange de lots (sources pondérées par leur volume) : composition, revendication, couleur, millésimes
function codifCtxSources(db, R, sources) {
  const S = (sources || []).filter((s) => s && s.lotId && R.lots[s.lotId]); if (!S.length) return {};
  const comp = mixComp(S.map((s) => ({ comp: composition(db, R, s.lotId), w: num(s.volL) || 1 })));
  const L = S.map((s) => R.lots[s.lotId]); const maj = [...S].sort((a, b) => num(b.volL) - num(a.volL))[0];
  const mil = {}; S.forEach((s) => { String((R.lots[s.lotId] || {}).millesime || '').split(/\s*\+\s*/).filter(Boolean).forEach((m) => { mil[m] = (mil[m] || 0) + (num(s.volL) || 1); }); });
  return { comp, qualif: minQualif(L.map((l) => l.qualif || 'conv')), couleur: (R.lots[maj.lotId] || {}).couleur, stade: (R.lots[maj.lotId] || {}).stade, millesimes: Object.keys(comp.millesimes || {}).length ? comp.millesimes : mil, parentLotId: maj.lotId };
}
const codifCtxLot = (db, R, lotId) => { const l = R.lots[lotId] || lotById(db, lotId); if (!l) return {}; const c = codifCtxSources(db, R, [{ lotId, volL: 1 }]); return { ...c, qualif: l.qualif, couleur: l.couleur, stade: l.stade, contenantId: l.contenantId || '', codeFournisseur: l.codeFournisseur || '' }; };
// parent (code et parties) d'un enregistrement
const codifParent = (x) => (x && x.code ? { code: x.code, codif: x.codif || null } : null);

function codifValeurVar(db, ctx, v) {
  const comp = ctx.comp || {}; const one = (k) => codifMajoritaire(comp[k])[0] || '';
  switch (v) {
    case 'cepage': return { id: one('cepages') }; case 'cepages': return { ids: codifMajoritaire(comp.cepages) };
    case 'fraction': return { id: ctx.fractionId || one('fractions') }; case 'fractions': return { ids: ctx.fractionId ? [ctx.fractionId] : codifMajoritaire(comp.fractions) };
    case 'cru': return { id: one('crus') };
    case 'echelle': { const e = echelleInfo(comp); return { id: ctx.echelle || e.id || '' }; }
    case 'revendication': return { id: ctx.qualif || one('qualifs') };
    case 'couleur': return { id: ctx.couleur || '' }; case 'stade': return { id: ctx.stade || '' };
    case 'contenant': return { id: ctx.contenantId || '' };
    case 'site': return { id: ctx.siteId || ((db.contenants || []).find((c) => c.id === ctx.contenantId) || {}).siteId || '' };
    case 'apporteur': return { id: ctx.apporteurId || one('apporteurs') };
    case 'marc': return { texte: hasNum(ctx.marc) ? String(ctx.marc) : '' };
    case 'codeFournisseur': return { texte: String(ctx.codeFournisseur || '') };
    case 'dosage': return { texte: hasNum(ctx.dosage) ? String(num(ctx.dosage)).replace('.', ',') : '' };
    case 'nb': return { texte: hasNum(ctx.nb) ? String(num(ctx.nb)) : '' };
    case 'nbCartons': return { texte: hasNum(ctx.nbCartons) ? String(num(ctx.nbCartons)) : '' };
    case 'format': return { texte: hasNum(ctx.volBouteilleL) && num(ctx.volBouteilleL) > 0 ? String(Math.round(num(ctx.volBouteilleL) * 1000) / 10).replace('.', ',') : '' };
    default: return { texte: '' };
  }
}
function codifRenduListe(db, v, id, b) {
  if (!id) return '';
  if (b.rendu === 'table') { const c = codifTableCode(db, b.tableId, id); return c === null ? String(b.defaut || '') : c; }
  const e = codifElementsListe(db, v).find((x) => x.cle === id);
  if (b.rendu === 'court') return e ? String(e.court || e.libelle) : String(b.defaut || '');
  return e ? e.libelle : String(b.defaut || id);
}
// valeur brute d'une variable (pour les conditions)
function codifValeurTest(db, ctx, variable, parts) {
  const v = String(variable || '');
  if (v.startsWith('choix:')) { const t = codifTable(db, v.slice(6)); const lid = (ctx.choix || {})[v.slice(6)]; const l = t && (t.lignes || []).find((x) => x.id === lid || x.cle === lid); return l ? l.cle : ''; }
  if (v.startsWith('partie:')) return String((parts || {})[v.slice(7)] || '');
  const x = codifValeurVar(db, ctx, v); return x.ids ? codifCleEnsemble(x.ids) : x.id !== undefined ? x.id : x.texte;
}
function codifCondition(db, ctx, si, parts) {
  if (!si || !si.variable) return true; const val = String(codifValeurTest(db, ctx, si.variable, parts) || ''); const att = String(si.valeur || '');
  switch (si.test) {
    case 'vide': return !val; case 'rempli': return !!val;
    case 'egal': return norm(val) === norm(att); case 'different': return norm(val) !== norm(att);
    case 'changeParent': { const p = ctx.parentCtx; if (!p) return !!val; return norm(val) !== norm(String(codifValeurTest(db, p, si.variable, (ctx.parent && ctx.parent.codif && ctx.parent.codif.parts) || {}) || '')); }
    default: return true;
  }
}
function codifMiseEnForme(s, b) {
  let v = String(s === undefined || s === null ? '' : s);
  if (b.casse === 'maj') v = v.toUpperCase(); else if (b.casse === 'min') v = v.toLowerCase();
  if (b.sansAccents) v = v.normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (num(b.garder) > 0) v = b.garderDe === 'fin' ? v.slice(-num(b.garder)) : v.slice(0, num(b.garder));
  const w = num(b.largeur); if (w > 0) { const c = String(b.remplir === undefined || b.remplir === '' ? ' ' : b.remplir)[0]; v = v.length > w ? v.slice(0, w) : b.aligne === 'droite' ? v.padStart(w, c) : v.padEnd(w, c); }
  return v;
}
function codifDateValeur(db, ctx, b) {
  const d = isoOK(ctx.date) ? ctx.date : todayISO(); const def = CODIF_DATES.find((x) => x.id === b.champ) || CODIF_DATES[0];
  const h = /^\d{1,2}:\d{2}/.test(String(ctx.heure || '')) ? String(ctx.heure).split(':') : null;
  const n = b.champ === 'annee' ? yearOf(d) : b.champ === 'mois' ? +d.slice(5, 7) : b.champ === 'jour' ? +d.slice(8, 10) : b.champ === 'quantieme' ? codifJourAn(d)
    : b.champ === 'semaine' ? codifSemaine(d) : b.champ === 'jourSemaine' ? codifJourSemaine(d) : b.champ === 'heure' ? (h ? +h[0] : null) : b.champ === 'minute' ? (h ? +h[1] : null) : null;
  if (n === null) return '';
  return codifEncoder(db, n, b, def.chiffres);
}
function codifEncoder(db, n, b, chiffresDefaut) {
  const w = num(b.chiffres) || chiffresDefaut || 2;
  if (b.encodage === 'table') { const c = codifTableCode(db, b.tableId, String(n)); return c === null ? String(b.defaut || '') : c; }
  if (b.encodage === 'lettres') return codifLettres(n, CODIF_ALPHABETS.alpha);
  const s = w >= 4 ? String(n) : pad(n % (10 ** w), w);
  return b.encodage === 'champenois' ? codifChampenois(s) : s;
}
function codifMillesime(db, ctx, b) {
  const M = codifMajoritaire(ctx.millesimes || {}).filter((m) => /^\d{4}$/.test(m)); const nv = b.nv === undefined ? 'NV' : String(b.nv);
  if (!M.length) return nv;
  const mode = b.mode || 'tous'; const L = mode === 'majoritaire' ? [M[0]] : mode === 'premier' ? [[...M].sort()[0]] : mode === 'dernier' ? [[...M].sort().pop()] : [...M].sort();
  return L.map((m) => codifEncoder(db, +m, b, 2)).join(b.sep === undefined ? '/' : String(b.sep));
}
function codifHerite(ctx, b) {
  const p = ctx.parent; if (!p || !p.code) return '';
  if (b.mode === 'partie') { const P = (p.codif && !p.codif.manuel && p.codif.parts) || {}; return P[b.partie] !== undefined ? String(P[b.partie]) : String(b.defaut || ''); }
  if (b.mode === 'position') { const a = Math.max(1, num(b.debut) || 1); const f = num(b.fin); return p.code.slice(a - 1, f > 0 ? f : undefined); }
  return p.code;
}
// clé de remise à zéro du compteur : période + parties choisies (ex. marque + cuvée + format)
function codifCleRaz(db, ctx, b, parts) {
  const d = isoOK(ctx.date) ? ctx.date : todayISO(); const c = campOf(db, d);
  const per = b.raz === 'campagne' ? `c:${c ? c.id : yearOf(d)}` : b.raz === 'annee' ? `a:${yearOf(d)}` : b.raz === 'mois' ? `m:${d.slice(0, 7)}` : b.raz === 'jour' ? `j:${d}`
    : b.raz === 'semaine' ? `s:${yearOf(addDays(d, 3 - ((codifJourSemaine(d) + 6) % 7)))}-${codifSemaine(d)}` : '';
  const par = (b.razParties || []).map((n) => `${n}=${(parts || {})[n] || ''}`).join('|');
  return [per, par].filter(Boolean).join('|');
}

/**
 * Code proposé pour un stade : { ok, code, parts, cpt, cle, version, stade, avert, defaut? }
 * ctx : { date, heure, comp, millesimes, qualif, couleur, stade, contenantId, siteId, apporteurId, fractionId, marc, codeFournisseur, dosage, nb,
 *         volBouteilleL, nbCartons, choix: { tableId: ligneId }, parent: { code, codif }, parentCtx, reserves: [{ cle, cpt, code }], exclure: [ids] }
 * opts.briques : composition à essayer (aperçu, sans l'enregistrer) ; sans règle en vigueur : { defaut: true } (code d'Œnotrack)
 */
function codifGenerer(db, stade, ctx, opts) {
  opts = opts || {}; ctx = ctx || {};
  const v = opts.briques ? { id: 'apercu', briques: opts.briques } : codifVersion(db, stade, ctx.date);
  if (!v) return { ok: true, defaut: true, code: '', parts: {}, stade };
  const B = (v.briques || []).filter(Boolean); const parts = {}; const vals = []; const avert = []; let cb = null;
  B.forEach((b, i) => {
    const nom = String(b.nom || '').trim() || `${b.type}${i + 1}`;
    if (b.type === 'compteur') { cb = { b, i, nom }; vals.push(null); return; }
    if (!codifCondition(db, ctx, b.si, parts)) { const r = b.reserver && num(b.largeur) > 0 ? String(b.remplir || ' ')[0].repeat(num(b.largeur)) : ''; parts[nom] = r; vals.push(r); return; }
    let s = '';
    if (b.type === 'texte' || b.type === 'sep') s = String(b.valeur || '');
    else if (b.type === 'date') s = codifDateValeur(db, ctx, b);
    else if (b.type === 'millesime') s = codifMillesime(db, ctx, b);
    else if (b.type === 'herite') s = codifHerite(ctx, b);
    else if (b.type === 'choix') { const t = codifTable(db, b.tableId); const lid = (ctx.choix || {})[b.tableId]; const l = t && (t.lignes || []).find((x) => x.id === lid || x.cle === lid); s = l ? String(l.code || '') : String(b.defaut || ''); if (!l && t) avert.push(`Choisissez « ${t.nom} ».`); }
    else if (b.type === 'variable') {
      const def = CODIF_VARS.find((x) => x.id === b.variable); const x = codifValeurVar(db, ctx, b.variable);
      if (def && def.ensemble) { const ids = x.ids || []; s = b.rendu === 'table' && (b.ensembleEntier !== false) && codifTableCode(db, b.tableId, codifCleEnsemble(ids)) !== null ? codifTableCode(db, b.tableId, codifCleEnsemble(ids)) : ids.map((id) => codifRenduListe(db, b.variable, id, b)).join(b.sep === undefined ? '' : String(b.sep)); }
      else if (def && def.liste) s = codifRenduListe(db, b.variable, x.id, b);
      else { s = x.texte || ''; if (s && b.rendu === 'table') { const c = codifTableCode(db, b.tableId, s); s = c === null ? String(b.defaut || '') : c; } else if (!s) s = String(b.defaut || ''); }
    }
    s = codifMiseEnForme(s, b); parts[nom] = s; vals.push(s);
  });
  let cpt = null; let cle = '';
  const assemble = () => vals.map((x, k) => (k === (cb && cb.i) ? parts[cb.nom] : x)).join('');
  if (cb) {
    const b = cb.b; const pas = Math.max(1, Math.floor(num(b.pas) || 1)); const dep = hasNum(b.depart) ? Math.max(0, Math.floor(num(b.depart))) : 1;
    cle = codifCleRaz(db, ctx, b, parts); const ex = ctx.exclure || [];
    const deja = [...codifEnregistrements(db, stade).filter((r) => !ex.includes(r.id) && r.codif && r.codif.stade === stade && r.codif.cle === cle && hasNum(r.codif.cpt)).map((r) => num(r.codif.cpt)),
      ...(ctx.reserves || []).filter((r) => r && r.cle === cle && hasNum(r.cpt)).map((r) => num(r.cpt))];
    cpt = deja.length ? Math.max(...deja) + pas : dep;
    const pris = (c) => (codifCodePris(db, stade, c, ex) || (ctx.reserves || []).some((r) => r && norm(r.code) === norm(c)));
    for (let k = 0; k < 2000; k += 1) { parts[cb.nom] = codifMiseEnForme(codifNombre(cpt, b), { ...b, largeur: 0 }); if (!pris(assemble())) break; cpt += pas; }
  }
  const code = assemble();
  if (!code.trim()) return { ok: false, msg: 'Le code obtenu est vide : complétez la règle ou les choix.', code: '', parts, stade, version: v.id, avert };
  const uni = (codifRegleDe(db, stade) || {}).unicite || 'refus';
  if (!cb && uni !== 'aucune' && (codifCodePris(db, stade, code, ctx.exclure) || (ctx.reserves || []).some((r) => r && norm(r.code) === norm(code)))) avert.push(`Le code « ${code} » existe déjà.`);
  return { ok: true, code, parts, cpt, cle, version: v.id, stade, avert };
}
// trace gardée avec le lot : parties et compteur si le code est celui proposé, sinon marqué « manuel »
function codifTrace(g, code, choix) {
  if (!g || g.defaut || !g.version || g.version === 'apercu') return null;
  const ch = choix && Object.keys(choix).length ? { choix: { ...choix } } : {};
  if (norm(code).trim() === norm(g.code).trim()) return { stade: g.stade, version: g.version, parts: { ...g.parts }, ...(g.cpt !== null && g.cpt !== undefined ? { cpt: g.cpt, cle: g.cle } : {}), ...ch };
  // code retouché : son rang de compteur reste compté (le 2e habillage du jour reste le 2e, même avec un code d'exception)
  return { stade: g.stade, version: g.version, manuel: true, ...(g.cpt !== null && g.cpt !== undefined ? { cpt: g.cpt, cle: g.cle } : {}), ...ch };
}
// choix repris de l'étape précédente (même table) : la marque, la cuvée… ne se ressaisissent pas
const codifChoixHerites = (db, stade, date, parentCodif) => { const p = (parentCodif && parentCodif.choix) || {}; const out = {}; codifChoixTables(db, stade, date).forEach((t) => { if (p[t.id]) out[t.id] = p[t.id]; }); return out; };

/* ---------- renommage (exception, réétiquetage) et changement de code au changement de stade ---------- */
// le code est aussi écrit dans l'opération qui a créé le lot (sinon la réenregistrer remettrait l'ancien)
function codifCodeDansOp(db, kind, id, code) {
  (db.ops || []).forEach((o) => {
    if (!o) return;
    if (kind === 'lot') {
      if (o.type === 'pressurage') { if (o.parentLotId === id && o.parentSpec) o.parentSpec = { ...o.parentSpec, code }; (o.fractions || []).forEach((f) => { if (f.lotId === id) f.code = code; }); }
      if ((o.type === 'assemblage' || o.type === 'tirage' || o.type === 'reprise') && o.lotId === id && o.lotSpec) o.lotSpec = { ...o.lotSpec, code };
      if (o.type === 'entree_mout') (o.lots || []).forEach((l) => { if (l.lotId === id) l.code = code; });
    }
    if (kind === 'fini' && o.type === 'degorgement' && o.lotFiniId === id && o.lotFiniSpec) o.lotFiniSpec = { ...o.lotFiniSpec, code };
  });
}
const codifCollection = (db, kind) => (kind === 'fini' ? (db.lotsFinis = db.lotsFinis || []) : kind === 'habillage' ? (db.habillages = db.habillages || []) : db.lots);
function lotRenommer(db, kind, id, code, motif, par) {
  const x = codifCollection(db, kind).find((y) => y && y.id === id); if (!x) return fail('Lot introuvable.');
  const c = String(code || '').trim(); if (!c) return fail('Indiquez le nouveau code.'); if (c === x.code) return fail('Le code est inchangé.');
  if (!String(motif || '').trim()) return fail('Indiquez le motif du changement de code (réétiquetage, erreur de saisie…).');
  const d = kind === 'lot' ? (x.date || todayISO()) : (x.date || todayISO()); if (isLocked(db, d)) return fail('Ce lot appartient à une campagne figée.');
  const stade = (x.codif && x.codif.stade) || (kind === 'fini' ? 'degorgement' : kind === 'habillage' ? (x.type === 'carton' ? 'expedition' : 'habillage') : 'vinification');
  if (codifUnicite(db, stade, todayISO()) === 'refus' && (kind === 'lot' ? codifCollection(db, 'lot').some((y) => y && y.id !== id && norm(y.code).trim() === norm(c)) : codifCodePris(db, stade, c, [id]))) return fail(`Le code « ${c} » existe déjà.`);
  x.codesPrecedents = [...(x.codesPrecedents || []), { code: x.code, jusquau: todayISO(), motif: String(motif).trim(), par: par || '', le: new Date().toISOString() }];
  x.code = c; if (x.codif) x.codif = { ...x.codif, manuel: true }; codifCodeDansOp(db, kind, id, c);
  return okr();
}
// étape (changement de stade) qui attribue un nouveau code : appliqué par syncEntities, annulé à la suppression de l'opération
function codifEtapeAppliquer(db, op) {
  const l = (db.lots || []).find((x) => x && x.id === op.lotId); if (!l) return;
  const prev = (l.codesPrecedents || []).find((p) => p && p.opId === op.id);
  if (!op.nouveauCode) { if (prev) codifEtapeAnnuler(db, op); return; }
  if (!prev) l.codesPrecedents = [...(l.codesPrecedents || []), { code: l.code, jusquau: op.date, opId: op.id, motif: 'Changement de stade', ...(l.codif ? { codif: l.codif } : {}) }];
  l.code = op.nouveauCode; if (op.codif) l.codif = op.codif; else if (l.codif) l.codif = { ...l.codif, manuel: true };
  codifCodeDansOp(db, 'lot', l.id, l.code);
}
function codifEtapeAnnuler(db, op) {
  const l = (db.lots || []).find((x) => x && x.id === op.lotId); if (!l) return; const prev = (l.codesPrecedents || []).find((p) => p && p.opId === op.id); if (!prev) return;
  l.code = prev.code; if (prev.codif) l.codif = prev.codif; else delete l.codif; l.codesPrecedents = l.codesPrecedents.filter((p) => p !== prev); if (!l.codesPrecedents.length) delete l.codesPrecedents;
  codifCodeDansOp(db, 'lot', l.id, l.code);
}
// recherche par un code, actuel ou ancien
const codifCherche = (x, q) => { const t = norm(q).trim(); return !!t && (norm(x.code).includes(t) || (x.codesPrecedents || []).some((p) => norm(p.code).includes(t)) || norm(x.codeFournisseur || '').includes(t)); };

/* ---------- habillage et mise en carton / expédition ---------- */
const habillages = (db) => (Array.isArray(db && db.habillages) ? db.habillages.filter((h) => h && h.id) : []);
const habillageSource = (db, s) => (!s ? null : s.type === 'fini' ? (db.lotsFinis || []).find((f) => f && f.id === s.id) || null : habillages(db).find((h) => h.id === s.id) || null);
const habillagesDe = (db, s, type) => habillages(db).filter((h) => h.source && h.source.type === s.type && h.source.id === s.id && (!type || (type === 'carton' ? h.type === 'carton' : h.type !== 'carton')));
// bouteilles encore disponibles d'une source : pour un habillage (ou un réétiquetage), celles pas encore habillées ; pour une mise en carton, pas encore cartonnées
function habillageRestant(db, s, type, exclure) {
  const src = habillageSource(db, s); if (!src) return 0;
  return Math.max(0, num(src.nb) - sum(habillagesDe(db, s, type).filter((h) => h.id !== exclure), (h) => h.nb));
}
// lot fini d'origine (en remontant les réétiquetages)
function habillageFini(db, h) { let x = h; for (let i = 0; i < 50 && x; i += 1) { if (!x.source) return null; if (x.source.type === 'fini') return habillageSource(db, x.source); x = habillageSource(db, x.source); } return null; }
// code d'Œnotrack sans règle : H26-001 (habillage), C26-001 (mise en carton)
function habillageCodeDefaut(db, type, date) {
  const p = `${type === 'carton' ? 'C' : 'H'}${pad(yearOf(isoOK(date) ? date : todayISO()) % 100)}-`; const st = type === 'carton' ? 'expedition' : 'habillage';
  let n = codifEnregistrements(db, st).filter((r) => String(r.code).startsWith(p)).length + 1; let c = `${p}${pad(n, 3)}`; while (codifCodePris(db, st, c)) { n += 1; c = `${p}${pad(n, 3)}`; } return c;
}
function habillageSave(db, h, id, ctx) {
  ctx = ctx || {}; const old = id ? habillages(db).find((x) => x.id === id) : null;
  const type = h.type === 'carton' ? 'carton' : 'habillage'; const stade = type === 'carton' ? 'expedition' : 'habillage';
  if (!isoOK(h.date)) return fail('Choisissez une date.'); const c = campOf(db, h.date);
  if (!c) return fail('Aucune campagne ne couvre cette date. Créez-la dans Paramètres › Campagnes.'); if (c.figee) return fail(`La campagne ${c.nom} est figée.`);
  if (old && isLocked(db, old.date)) return fail('Cette opération appartient à une campagne figée.');
  const s = h.source && (h.source.type === 'fini' || h.source.type === 'habillage') ? { type: h.source.type, id: h.source.id } : null; const src = habillageSource(db, s);
  if (!src) return fail(type === 'carton' ? 'Choisissez le lot habillé (ou le lot fini) mis en carton.' : 'Choisissez le lot fini (ou le lot habillé à réétiqueter).');
  if (s.type === 'habillage' && src.type === 'carton') return fail('Une mise en carton ne peut pas être habillée de nouveau.');
  if (old && s.type === 'habillage' && s.id === old.id) return fail('Un lot ne peut pas être sa propre source.');
  if (!(num(h.nb) > 0)) return fail('Indiquez le nombre de bouteilles.');
  const rest = habillageRestant(db, s, type, old && old.id); if (num(h.nb) > rest + 1e-9) return fail(`Seulement ${rest} bouteille(s) disponible(s) dans « ${src.code} ».`);
  if (h.heure && !heureOK(h.heure)) return fail('Heure invalide (hh:mm).');
  const code = String(h.code || '').trim(); if (!code) return fail('Indiquez le code du lot.');
  if (codifUnicite(db, stade, h.date) === 'refus' && codifCodePris(db, stade, code, old ? [old.id] : [])) return fail(`Le code « ${code} » existe déjà.`);
  const enfants = old ? habillages(db).filter((x) => x.source && x.source.type === 'habillage' && x.source.id === old.id) : [];
  if (old && num(h.nb) + 1e-9 < Math.max(sum(enfants.filter((x) => x.type === 'carton'), (x) => x.nb), sum(enfants.filter((x) => x.type !== 'carton'), (x) => x.nb))) return fail('Des bouteilles de ce lot sont déjà mises en carton ou réétiquetées : le nombre ne peut pas descendre en dessous.');
  if (type === 'carton' && hasNum(h.nbCartons) && num(h.nbCartons) < 0) return fail('Nombre de cartons invalide.');
  const qui = operateursValides(db, h.operateurs); if (!qui.length && !old && (db.settings || {}).operateurObligatoire) return fail('Indiquez qui a réalisé l’opération (opérateur).');
  if (!Array.isArray(db.habillages)) db.habillages = [];
  const x = { ...(old || {}), ...h, id: old ? old.id : nid(db, 'hab'), type, source: s, date: h.date, heure: h.heure || '', nb: num(h.nb), code, designation: String(h.designation || '').trim(),
    ...(type === 'carton' ? { nbCartons: hasNum(h.nbCartons) ? num(h.nbCartons) : null, parCarton: hasNum(h.parCarton) ? num(h.parCarton) : null, destinataire: String(h.destinataire || '').trim(), ref: String(h.ref || '').trim() } : {}),
    notes: String(h.notes || '').trim(), operateurs: qui, ...(old ? { modifiePar: ctx.par || '', modifieLe: new Date().toISOString() } : { par: ctx.par || '', le: new Date().toISOString() }) };
  if (!x.codif) delete x.codif;
  if (old) db.habillages[db.habillages.indexOf(db.habillages.find((y) => y && y.id === old.id))] = x; else db.habillages.push(x);
  return okr({ id: x.id });
}
function habillageDelete(db, id) {
  const h = habillages(db).find((x) => x.id === id); if (!h) return fail('Opération introuvable.'); if (isLocked(db, h.date)) return fail('Opération verrouillée : la campagne est figée.');
  const enf = habillages(db).filter((x) => x.source && x.source.type === 'habillage' && x.source.id === id); if (enf.length) return fail(`Suppression impossible : ${enf.length} opération(s) en dépendent (${enf.slice(0, 3).map((x) => x.code).join(', ')}). Supprimez-les d’abord.`);
  db.habillages = db.habillages.filter((x) => !(x && x.id === id)); return okr();
}
// contexte d'un habillage ou d'une mise en carton : lot fini d'origine, vin de tirage, dosage, format
function codifCtxHabillage(db, R, h) {
  const src = habillageSource(db, h.source); const fini = h.source && h.source.type === 'fini' ? src : (src ? habillageFini(db, src) : null);
  const base = fini ? codifCtxLot(db, R, fini.sourceLotId) : {}; const tir = fini ? (db.ops || []).find((o) => o && o.type === 'tirage' && o.lotId === fini.sourceLotId) : null;
  return { ...base, date: h.date, heure: h.heure, nb: h.nb, nbCartons: h.nbCartons, dosage: fini ? fini.dosageGL : null, qualif: fini ? fini.qualif : base.qualif, couleur: fini ? fini.couleur : base.couleur,
    volBouteilleL: tir ? tir.volBouteilleL : (db.settings || {}).volBouteilleL, choix: h.choix || {}, parent: codifParent(src), parentCtx: base, exclure: h.id ? [h.id] : [] };
}

/* ---------- exporter / importer une codification complète ---------- */
function codifExporter(db) {
  return { format: 'oenotrack-codification', version: APP_VERSION, exporteLe: new Date().toISOString(), entreprise: ((db.entreprise || {}).nom) || '', regles: clone((db.codifRegles || []).filter(Boolean)), tables: clone(codifTables(db)) };
}
// les tables sont réunies (lignes ajoutées ou mises à jour, jamais retirées) ; chaque règle reçue devient une NOUVELLE version à partir de `des`
// (les versions déjà en place, et les lots qu'elles ont codés, restent tels quels)
function codifImporter(db, data, opts) {
  opts = opts || {}; let x = data; if (typeof x === 'string') { try { x = JSON.parse(x); } catch (e) { return fail('Fichier illisible (JSON attendu).'); } }
  if (!x || x.format !== 'oenotrack-codification' || !Array.isArray(x.regles) || !Array.isArray(x.tables)) return fail('Ce fichier n’est pas une codification d’Œnotrack.');
  const des = opts.des || todayISO(); if (!isoValide(des)) return fail('Date d’effet invalide.');
  if (!Array.isArray(db.codifTables)) db.codifTables = []; if (!Array.isArray(db.codifRegles)) db.codifRegles = [];
  const ren = {}; let nt = 0; let nr = 0; const avert = [];
  x.tables.filter((t) => t && t.id && t.nom).forEach((t) => {
    const ex = codifTable(db, t.id) || codifTables(db).find((y) => norm(y.nom).trim() === norm(t.nom).trim());
    if (ex) { ren[t.id] = ex.id; const L = [...(ex.lignes || [])]; (t.lignes || []).filter(Boolean).forEach((l) => { const i = L.findIndex((y) => (l.id && y.id === l.id) || (String(y.cle) === String(l.cle) && l.cle !== '')); if (i >= 0) L[i] = { ...L[i], libelle: l.libelle, code: l.code }; else L.push({ ...l }); }); codifTableSet(db, { ...ex, lignes: L }, opts); }
    else { const r = codifTableSet(db, { ...t, id: t.id }, opts); if (r.ok) ren[t.id] = r.id; }
    nt += 1;
  });
  x.regles.filter((r) => r && codifStadeDef(r.id)).forEach((r) => {
    const V = [...(r.versions || [])].filter(Boolean).sort((a, b) => String(a.des || '').localeCompare(String(b.des || ''))); const v = V[V.length - 1]; if (!v) return;
    const briques = (v.briques || []).map((b) => ({ ...b, id: undefined, ...(b.tableId ? { tableId: ren[b.tableId] || b.tableId } : {}), ...(b.si && String(b.si.variable || '').startsWith('choix:') ? { si: { ...b.si, variable: `choix:${ren[b.si.variable.slice(6)] || b.si.variable.slice(6)}` } } : {}) }));
    const VD = codifVersions(db, r.id).filter((y) => !y.des || y.des <= des); const cur = VD[VD.length - 1]; // déjà en vigueur à cette date : rien à ajouter
    if (cur && !!cur.defaut === !!v.defaut && (v.defaut || JSON.stringify((cur.briques || []).map(({ id, ...b }) => b)) === JSON.stringify(briques.map(({ id, ...b }) => b)))) return;
    const cible = codifVersions(db, r.id).find((y) => String(y.des || '') === des);
    const res = codifVersionSet(db, r.id, { ...(cible && !codifUsage(db, r.id, cible.id) ? { id: cible.id } : {}), des: cible && codifUsage(db, r.id, cible.id) ? addDays(des, 1) : des, briques, defaut: !!v.defaut, note: v.note || `Importée${x.entreprise ? ` de ${x.entreprise}` : ''}` }, opts);
    if (!res.ok) { avert.push(`${(codifStadeDef(r.id) || {}).label} : ${res.msg}`); return; }
    codifRegleOptions(db, r.id, { ...(r.unicite ? { unicite: r.unicite } : {}), ...(Array.isArray(r.declencheurs) ? { declencheurs: r.declencheurs } : {}) }); nr += 1;
  });
  return okr({ tables: nt, regles: nr, avert });
}
