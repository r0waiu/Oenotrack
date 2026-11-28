/* ============ VIN : stades, couleurs et échelle (classement) des crus — listes personnalisables ============ */
// Stades : l'ordre de la liste = progression habituelle de la vinification (sert à « stade suivant » et aux assemblages).
// phase : mout | ferm | vin | bout. role : rattache un stade aux propositions automatiques des opérations.
const STADE_PHASES = [['mout', 'Moût'], ['ferm', 'Fermentation'], ['vin', 'Vin'], ['bout', 'Bouteille']];
const STADE_ROLES = [
  ['', '— aucun —'], ['entree', 'Moût reçu ou pressé'], ['debourbage', 'Après débourbage'], ['levurage', 'Après levurage (levures, levain, pied de cuve)'],
  ['finfa', 'Fin de fermentation alcoolique'], ['bacteries', 'Après ensemencement malolactique'], ['finfml', 'Fin de fermentation malolactique'], ['clair', 'Vin clarifié (reprise de stock)'], ['assemblage', 'Lot créé par assemblage de vins'], ['tirage', 'Tirage (mise en bouteille)'], ['degorgement', 'Dégorgement'],
];
const DEFAULT_STADES = () => ([
  { id: 'mout', label: 'Moût', court: 'Moût', phase: 'mout', role: 'entree', couleur: '#C9B458' },
  { id: 'mout_debourbe', label: 'Moût débourbé', court: 'Débourbé', phase: 'mout', role: 'debourbage', couleur: '#9FA53C' },
  { id: 'fa', label: 'En fermentation alcoolique', court: 'En FA', phase: 'ferm', role: 'levurage', couleur: '#E07B24' },
  { id: 'fin_fa', label: 'Fin de FA', court: 'Fin FA', phase: 'vin', role: 'finfa', couleur: '#B4532A' },
  { id: 'fml', label: 'En fermentation malolactique', court: 'En FML', phase: 'ferm', role: 'bacteries', couleur: '#C2577A' },
  { id: 'fin_fml', label: 'FML terminée', court: 'FML faite', phase: 'vin', role: 'finfml', couleur: '#8E4A7E' },
  { id: 'vin_soutire', label: 'Vin soutiré', court: 'Soutiré', phase: 'vin', role: '', couleur: '#6F8FB5' },
  { id: 'vin_colle', label: 'Vin collé', court: 'Collé', phase: 'vin', role: '', couleur: '#5A9AA8' },
  { id: 'vin_clair', label: 'Vin clarifié', court: 'Clarifié', phase: 'vin', role: 'clair', couleur: '#3C8DB0' }, // 0.47.0-alpha.2 : « Vin clair » (sens champenois : vins de base) → « Vin clarifié »
  { id: 'vin_filtre', label: 'Vin filtré', court: 'Filtré', phase: 'vin', role: '', couleur: '#2E6F9E' },
  { id: 'elevage', label: 'En élevage (fût, foudre…)', court: 'Élevage', phase: 'vin', role: '', couleur: '#8A6A3B' },
  { id: 'assemble', label: 'Vin assemblé', court: 'Assemblé', phase: 'vin', role: 'assemblage', couleur: '#4F5DB0' },
  { id: 'stabilise', label: 'Vin stabilisé, prêt à la mise en bouteille ou au tirage', court: 'Stabilisé', phase: 'vin', role: '', couleur: '#2C7C78' },
  { id: 'tire', label: 'Tiré (prise de mousse, sur lattes)', court: 'Tiré', phase: 'bout', role: 'tirage', couleur: '#6A4C9C' },
  { id: 'sur_pointes', label: 'Remué, sur pointes', court: 'Sur pointes', phase: 'bout', role: '', couleur: '#4E3E7E' },
  { id: 'degorge', label: 'Dégorgé', court: 'Dégorgé', phase: 'bout', role: 'degorgement', couleur: '#33305A' },
]);
// Couleurs du vin : « mélange » = couleur obtenue quand on assemble des couleurs différentes (rosé d'assemblage : blanc + rouge).
const DEFAULT_COULEURS_VIN = () => ([
  { id: 'blanc', label: 'Blanc', couleur: '#E6CF73' },
  { id: 'rose', label: 'Rosé', couleur: '#EE96A4', melange: true },
  { id: 'rouge', label: 'Rouge', couleur: '#8E1F33' },
]);
// Échelles (classements) : préréglages par région ; rang croissant = niveau plus élevé. Un mélange prend le rang le plus bas.
const ECHELLE_PRESETS = [
  { id: 'champagne', nom: 'Champagne', titre: 'Échelle des crus', items: [
    { id: 'autre', label: 'Autres crus', un: 'Autre cru', court: 'AUT', rang: 1, couleur: '#8A7F6B' },
    { id: 'premier', label: 'Premiers Crus', un: 'Premier Cru', court: '1ER', rang: 2, couleur: '#C07A2C' },
    { id: 'grand', label: 'Grands Crus', un: 'Grand Cru', court: 'GC', rang: 3, couleur: '#C79A1E' }] },
  { id: 'bourgogne', nom: 'Bourgogne', titre: 'Hiérarchie des appellations', items: [
    { id: 'regionale', label: 'Appellations régionales', un: 'Régionale', court: 'RÉG', rang: 1, couleur: '#8A7F6B' },
    { id: 'village', label: 'Villages', un: 'Village', court: 'VIL', rang: 2, couleur: '#5F8A6B' },
    { id: 'premier', label: 'Premiers Crus', un: 'Premier Cru', court: '1ER', rang: 3, couleur: '#C07A2C' },
    { id: 'grand', label: 'Grands Crus', un: 'Grand Cru', court: 'GC', rang: 4, couleur: '#C79A1E' }] },
  { id: 'alsace', nom: 'Alsace', titre: 'Hiérarchie des appellations', items: [
    { id: 'regionale', label: 'AOC Alsace', un: 'AOC Alsace', court: 'AOC', rang: 1, couleur: '#8A7F6B' },
    { id: 'communale', label: 'Communales et lieux-dits', un: 'Communale / lieu-dit', court: 'COM', rang: 2, couleur: '#5F8A6B' },
    { id: 'grand', label: 'Grands Crus', un: 'Grand Cru', court: 'GC', rang: 3, couleur: '#C79A1E' }] },
  { id: 'saint-emilion', nom: 'Saint-Émilion (classement)', titre: 'Classement', items: [
    { id: 'aoc', label: 'Saint-Émilion', un: 'Saint-Émilion', court: 'SE', rang: 1, couleur: '#8A7F6B' },
    { id: 'gc', label: 'Saint-Émilion grand cru', un: 'Grand cru', court: 'GC', rang: 2, couleur: '#7C2D36' },
    { id: 'gcc', label: 'Grands crus classés', un: 'Grand cru classé', court: 'GCC', rang: 3, couleur: '#C07A2C' },
    { id: 'pgcc', label: 'Premiers grands crus classés', un: '1er grand cru classé', court: '1GCC', rang: 4, couleur: '#C79A1E' }] },
  { id: 'generique', nom: 'Générique (sans IG / IGP / AOP)', titre: 'Niveau d’appellation', items: [
    { id: 'vsig', label: 'Vins de France (sans IG)', un: 'Vin de France', court: 'VDF', rang: 1, couleur: '#8A7F6B' },
    { id: 'igp', label: 'IGP', un: 'IGP', court: 'IGP', rang: 2, couleur: '#5F8A6B' },
    { id: 'aop', label: 'AOP', un: 'AOP', court: 'AOP', rang: 3, couleur: '#C79A1E' }] },
];
const DEFAULT_ECHELLES = () => ECHELLE_PRESETS[0].items.map((x) => ({ ...x }));

/* ---------- stades ---------- */
const stadeList = (db) => (db && db.lists && Array.isArray(db.lists.stades) && db.lists.stades.length ? db.lists.stades : DEFAULT_STADES());
const stadeDef = (db, id) => (id ? stadeList(db).find((x) => x.id === id) || null : null);
const stadeLabel = (db, id) => { const s = stadeDef(db, id); return s ? s.label : (id ? `(${id})` : 'Non précisé'); };
const stadeCourt = (db, id) => { const s = stadeDef(db, id); return s ? (s.court || s.label) : (id ? `(${id})` : '—'); };
const stadeColor = (db, id) => (stadeDef(db, id) || {}).couleur || '#9AA39B';
const stadeIdx = (db, id) => stadeList(db).findIndex((x) => x.id === id);
const stadePhase = (db, id) => (stadeDef(db, id) || {}).phase || '';
const stadeRole = (db, role) => { const L = stadeList(db); const s = L.find((x) => x.role === role && !x.masque) || L.find((x) => x.role === role); return s ? s.id : ''; };
const stadeNext = (db, id) => { const L = stadeList(db).filter((x) => !x.masque || x.id === id); const i = L.findIndex((x) => x.id === id); return i >= 0 && i < L.length - 1 ? L[i + 1] : null; };
const stadeOptions = (db, keep) => stadeList(db).filter((x) => !x.masque || x.id === keep).map((x) => ({ value: x.id, label: x.label }))
  .concat(keep && !stadeDef(db, keep) ? [{ value: keep, label: `(${keep})` }] : []);
// stade d'un lot ancien (avant les stades) : déduit de sa nature
const stadeFromType = (type) => ({ mout: 'mout', pressee: 'mout', fraction: 'mout', vin_clair: 'vin_clair', assemblage: 'assemble', vin_reserve: 'vin_clair', cuvee_tirage: 'tire' }[type] || 'vin_clair');
// Stade automatique d'une opération : appliqué s'il fait avancer le vin, sans faire passer un moût ou un vin en fermentation
// directement à un stade de la phase « Vin » (un soutirage pendant la FA ne fait pas un « vin soutiré »)
const STADE_PH_IDX = { mout: 0, ferm: 1, vin: 2, bout: 3 };
const stadeAutoOK = (db, cur, tgt) => {
  if (!tgt || !stadeDef(db, tgt) || tgt === cur) return false; if (!cur || !stadeDef(db, cur)) return true;
  if (stadeIdx(db, tgt) <= stadeIdx(db, cur)) return false;
  const pc = STADE_PH_IDX[stadePhase(db, cur)]; const pt = STADE_PH_IDX[stadePhase(db, tgt)]; if (pc === undefined || pt === undefined) return true;
  return (stadePhase(db, tgt) !== 'vin' || stadePhase(db, cur) === 'vin') && pc >= pt - 1;
};
// le moins avancé d'une liste de stades (un assemblage de moût et de vin reste… un moût)
const stadeMin = (db, ids) => { const k = uniq(ids.filter(Boolean)); if (!k.length) return ''; return k.reduce((m, x) => (stadeIdx(db, x) >= 0 && (stadeIdx(db, m) < 0 || stadeIdx(db, x) < stadeIdx(db, m)) ? x : m), k[0]); };

// Mélanges de stades (assemblages) : règles « A + B = résultat » personnalisables, puis règle par défaut
// (« auto » : le moins avancé ; « max » : le plus avancé ; ou un stade précis)
const DEFAULT_STADES_MELANGES = () => ([
  { a: 'mout', b: 'mout_debourbe', r: 'mout' }, { a: 'mout', b: 'fa', r: 'fa' }, { a: 'mout_debourbe', b: 'fa', r: 'fa' },
  { a: 'fa', b: 'fin_fa', r: 'fa' }, { a: 'fin_fa', b: 'fml', r: 'fml' }, { a: 'fml', b: 'fin_fml', r: 'fml' }, { a: 'fml', b: 'vin_clair', r: 'fml' },
  { a: 'vin_soutire', b: 'vin_clair', r: 'vin_soutire' }, { a: 'vin_colle', b: 'vin_clair', r: 'vin_clair' }, { a: 'vin_filtre', b: 'vin_clair', r: 'vin_clair' },
  { a: 'stabilise', b: 'vin_clair', r: 'vin_clair' }, { a: 'stabilise', b: 'assemble', r: 'assemble' },
]);
const stadeMelanges = (db) => (db && db.lists && Array.isArray(db.lists.stadesMelanges) ? db.lists.stadesMelanges : DEFAULT_STADES_MELANGES());
const stadeRegle = (db, a, b) => { if (a === b) return a; const r = stadeMelanges(db).find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a)); return r && stadeDef(db, r.r) ? r.r : null; };
function stadeMix(db, ids) {
  const k = uniq((ids || []).filter(Boolean)); if (!k.length) return ''; const dflt = (db && db.settings && db.settings.stadeMelangeDefaut) || 'auto';
  return k.slice(1).reduce((acc, x) => stadeRegle(db, acc, x) || (dflt === 'max' ? (stadeIdx(db, x) > stadeIdx(db, acc) ? x : acc) : stadeDef(db, dflt) ? dflt : stadeMin(db, [acc, x])), k[0]);
}
// stade du lot créé par un assemblage : mélange des stades ; si c'est un vin, le stade automatique de l'opération (« vin assemblé »)
const stadeAssemblage = (db, ids, auto) => { const m = stadeMix(db, ids); const cible = auto === undefined ? stadeRole(db, 'assemblage') : auto; if (!m) return cible || ''; return cible && stadeDef(db, cible) && stadePhase(db, m) === 'vin' ? cible : m; };

// Une analyse peut confirmer un passage de stade : sucres < 2 g/L (ou densité ≤ seuil de fin de FA, 0,994 par défaut : fermReglages) en FA → fin de FA ; acide malique ≤ 0,2 g/L en FML → FML terminée
function stadeSuggestion(db, R, a) {
  const lot = a && R.lots[a.lotId]; if (!lot) return null; const v = a.valeurs || {}; const role = (stadeDef(db, lot.stade) || {}).role;
  const has = (k) => v[k] != null && v[k] !== '' && Number.isFinite(num(v[k]));
  if (role === 'levurage' && ((has('sucres') && num(v.sucres) < 2) || (has('densite') && num(v.densite) <= fermReglages(db).fin + 1e-9))) { const t = stadeRole(db, 'finfa'); return t ? { lotId: lot.id, stade: t, why: has('sucres') ? `sucres ${fmt(v.sucres, 1)} g/L` : `densité ${fmt(v.densite, 3)}` } : null; }
  if (role === 'bacteries' && has('malique') && num(v.malique) <= 0.2) { const t = stadeRole(db, 'finfml'); return t ? { lotId: lot.id, stade: t, why: `acide malique ${fmt(v.malique, 2)} g/L` } : null; }
  return null;
}

/* ---------- couleurs du vin ---------- */
const couleurList = (db) => (db && db.lists && Array.isArray(db.lists.couleursVin) && db.lists.couleursVin.length ? db.lists.couleursVin : DEFAULT_COULEURS_VIN());
const couleurDef = (db, id) => (id ? couleurList(db).find((x) => x.id === id) || null : null);
const couleurLabel = (db, id) => { const c = couleurDef(db, id); return c ? c.label : (id ? `(${id})` : 'Non précisée'); };
const couleurColor = (db, id) => (couleurDef(db, id) || {}).couleur || '#B7BDB9';
const couleurDefaut = (db) => { const d = db && db.settings && db.settings.couleurDefaut; return couleurDef(db, d) ? d : (couleurList(db)[0] || {}).id || ''; };
const couleurOptions = (db, keep) => couleurList(db).filter((x) => !x.masque || x.id === keep).map((x) => ({ value: x.id, label: x.label }))
  .concat(keep && !couleurDef(db, keep) ? [{ value: keep, label: `(${keep})` }] : []);
// couleur d'un assemblage : identique si toutes les couleurs sont les mêmes, sinon la couleur « mélange » (rosé)
function mixCouleur(db, ids) {
  const u = uniq((ids || []).filter(Boolean)); if (!u.length) return ''; if (u.length === 1) return u[0];
  const m = couleurList(db).find((x) => x.melange && !x.masque) || couleurList(db).find((x) => x.melange); return m ? m.id : u[0];
}

/* ---------- échelle (classement) des crus ---------- */
const ECH = { nom: 'Échelle des crus' };
const echList = (db) => (db && db.lists && Array.isArray(db.lists.echelles) && db.lists.echelles.length ? db.lists.echelles : DEFAULT_ECHELLES());
// Les listes personnalisées alimentent les variables globales (ECHELLES, nom de l'échelle) utilisées partout.
/* ---------- revendications (0.18.0-alpha.1) : liste de la base ; « conv » toujours présente et première ---------- */
const qualifList = (db) => {
  const L = db && db.lists && Array.isArray(db.lists.qualifs) ? db.lists.qualifs.filter((x) => x && typeof x === 'object' && x.id) : [];
  if (!L.length) return DEFAULT_QUALIFS();
  const conv = L.find((x) => x.id === 'conv') || DEFAULT_QUALIFS()[0];
  return [conv, ...L.filter((x) => x.id !== 'conv')];
};
const qualifDef = (db, id) => qualifList(db).find((x) => x.id === id) || null;
// options des listes de choix : revendications visibles (+ la valeur actuelle si elle est masquée)
const qualifOptions = (db, keep) => QUALIFS.filter((q) => !q.masque || q.id === keep).map((q) => ({ value: q.id, label: `${q.code} (rang ${q.rang})` }))
  .concat(keep && !qConnu(keep) ? [{ value: keep, label: `(${keep})` }] : []);
/* 0.45.0-alpha.1 — revendication bio : nom « BIO » et code d'agrément de l'organisme certificateur (q.codeAgrement, q.organisme) ;
   le code d'agrément est la revendication affichée partout (qLabel, listes, fiches, déclarations, exports) mais la revendication reste du bio
   (règles, référentiel Bio UE). Bio = référentiel « bio-ue » choisi, ou deviné d'après le nom ; Demeter, Biodyvin… (qui en héritent) n'en ont pas. */
const qualifEstBio = (q) => !!q && (Array.isArray(q.referentiels) ? q.referentiels.includes('bio-ue') : (q.id === 'bio' || (typeof refDeviner === 'function' && refDeviner(q).includes('bio-ue'))));
const CODE_AGREMENT_RE = /^[A-Z]{2}-[A-ZÄÖÜ]{2,4}-\d{2,3}$/; // format européen : pays-terme-numéro (ex. FR-BIO-01), règlement (UE) 2018/848
const codeAgrementNorm = (v) => String(v == null ? '' : v).trim().toUpperCase().replace(/\s+/g, '').replace(/–|—/g, '-');
const codeAgrementValide = (v) => { const c = codeAgrementNorm(v); return !c || CODE_AGREMENT_RE.test(c); };
const qualifAffiche = (q) => (q ? String((qualifEstBio(q) && q.codeAgrement) || q.label || q.code || q.id) : '');
function qualifCodeAgrementSet(db, id, s, uid) {
  if (!Array.isArray(db.lists.qualifs) || !db.lists.qualifs.length) db.lists.qualifs = qualifList(db).map((x) => ({ ...x }));
  const q = db.lists.qualifs.find((x) => x && x.id === id); if (!q) return fail('Revendication introuvable.');
  if (!qualifEstBio(q)) return fail('Le code d’agrément de l’organisme certificateur ne concerne que les revendications bio.');
  const code = codeAgrementNorm(s.codeAgrement); if (!codeAgrementValide(code)) return fail(`Code d’agrément « ${String(s.codeAgrement).trim()} » invalide : pays, terme et numéro, ex. FR-BIO-01.`);
  const org = String(s.organisme == null ? (q.organisme || '') : s.organisme).trim().slice(0, 80);
  if (code) q.codeAgrement = code; else delete q.codeAgrement; if (org) q.organisme = org; else delete q.organisme;
  q.agrementPar = uid || ''; q.agrementLe = new Date().toISOString(); return okr({ code });
}
// migration (une fois) : le nom d'exemple « FR-BIO-01 » (code d'Ecocert) devient « BIO », sans code d'agrément ; un autre nom n'est pas touché
function bioMigrerLibelle(db) {
  if (!db.settings) db.settings = {}; if (db.settings.bioLibelle) return false;
  const q = Array.isArray(db.lists && db.lists.qualifs) ? db.lists.qualifs.find((x) => x && x.id === 'bio') : null; let fait = false;
  if (q && String(q.label || '').trim().toUpperCase() === 'FR-BIO-01' && !q.codeAgrement) { q.label = 'BIO'; fait = true; }
  db.settings.bioLibelle = { de: fait ? 'FR-BIO-01' : '', le: new Date().toISOString(), version: typeof APP_VERSION === 'string' ? APP_VERSION : '' }; return fait;
}
function syncQualifs(db) {
  const L = qualifList(db).map((x, i) => ({ id: String(x.id), code: qualifAffiche(x), nom: String(x.label || x.code || x.id), court: String(x.court || x.label || x.id).slice(0, 8), rang: i + 1, masque: x.id !== 'conv' && !!x.masque, ...(qualifEstBio(x) ? { bio: true } : {}), ...(x.codeAgrement ? { codeAgrement: x.codeAgrement, organisme: x.organisme || '' } : {}) }));
  QUALIFS.splice(0, QUALIFS.length, ...L);
}

function syncConfig(db) {
  if (!db || !db.lists) return;
  syncQualifs(db);
  const L = echList(db).map((x, i) => ({ ...x, label: x.label || x.un || x.id, un: x.un || x.label || x.id, court: x.court || String(x.un || x.label || x.id).slice(0, 4).toUpperCase(), rang: num(x.rang) || i + 1 }))
    .sort((a, b) => a.rang - b.rang);
  ECHELLES.splice(0, ECHELLES.length, ...L);
  ECH.nom = String((db.settings && db.settings.echelleNom) || '').trim() || 'Échelle des crus';
  if (typeof syncOps === 'function') syncOps(db); // catalogue des opérations → libellés
  if (typeof syncFormulaires === 'function') syncFormulaires(db); // champs personnalisés → données des fiches
  if (typeof syncHygieneListes === 'function') syncHygieneListes(db); // listes de l'hygiène personnalisées (0.27.0-alpha.2)
}
const echTop = () => (ECHELLES.length ? ECHELLES[ECHELLES.length - 1].id : null);
