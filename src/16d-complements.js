/* ============ FICHES PRODUITS (0.26.0-alpha.1) : casse des noms, informations reprises des documents, assistant IA ============
   Noms : à la création d'un produit (intrant, produit d'hygiène), chaque mot courant prend une majuscule initiale et le reste en minuscules
   (FRESH → Fresh) ; les sigles et abréviations (2 ou 3 lettres sans voyelle, liste connue : SP, AA, PH, SO2…) et les codes contenant des
   chiffres (OX2, B12, V4) restent en majuscules ; ni l'orthographe ni l'ordre des mots ne changent. Un mot écrit en casse mixte (pH,
   FermoPlus) est gardé tel quel ; les petits mots de liaison (de, en, pour…) sont en minuscules, sauf en tête du nom.
   Documents déposés sur un produit (FT, FDS, certificats) : leurs informations sont proposées en complément de la fiche (script : rubriques
   reconnues ; assistant IA s'il est configuré : il complète ce que le script n'a pas trouvé). Jamais imposées : l'utilisateur coche ce qu'il
   reprend. Champs des intrants (facultatifs, gardés par les versions précédentes) : fabricant, composition, doseEmploi, modeEmploi,
   stockage, conservation, allergenes, usageBio. */
const NOM_SIGLES = new Set(['AA', 'AB', 'AOC', 'AOP', 'ATP', 'CE', 'CMC', 'CO2', 'DAP', 'DDM', 'DLC', 'DLUO', 'EU', 'FA', 'FML', 'HACCP', 'HVE', 'ICV', 'IGP', 'INAO', 'IOC', 'KPA', 'LSA', 'OGM', 'OIV', 'PH', 'PVI', 'PVP', 'PVPP', 'SO2', 'SP', 'TAV', 'UE', 'UV', 'VDF']);
const NOM_PETITS = new Set(['de', 'du', 'des', 'd', 'la', 'le', 'les', 'l', 'et', 'en', 'à', 'au', 'aux', 'pour', 'sur', 'avec', 'sans', 'ou', 'par', 'of', 'and']);
const NOM_LETTRE = /[A-Za-zÀ-ÖØ-öø-ÿŒœÆæ]/;
const NOM_JETONS = /[A-Za-zÀ-ÖØ-öø-ÿŒœÆæ0-9]+(?:[.,][0-9]+)?%?|[^A-Za-zÀ-ÖØ-öø-ÿŒœÆæ0-9]+/g;
const NOM_QUANTITE = /^\d+(?:[.,]\d+)?(?:kg|g|mg|l|ml|cl|hl|%)$/i; // 25 kg, 5L : tels qu'écrits
const NOM_ROMAIN = /^(?=[IVX]{2,5}$)X{0,3}(?:IX|IV|V?I{0,3})$/; // II, IV, XII
const NOM_VOYELLE = /[AEIOUYÀÂÄÉÈÊËÎÏÔÖÙÛÜŸŒÆ]/;
function nomMotCasse(p, premier) {
  if (!NOM_LETTRE.test(p)) return p; // nombres, ponctuation
  if (/\d/.test(p)) return NOM_QUANTITE.test(p) ? p : p.toUpperCase(); // codes : OX2, B12
  const haut = p.toUpperCase(); const bas = p.toLowerCase();
  if (p !== haut && p !== bas) return p; // casse voulue (pH, FermoPlus)
  if (NOM_SIGLES.has(plier(haut).toUpperCase())) return haut;
  if (haut.length >= 2 && haut.length <= 3 && !NOM_VOYELLE.test(haut)) return haut; // sigle sans voyelle : SP, PH, KHT
  if (NOM_ROMAIN.test(haut)) return haut;
  if (!premier && NOM_PETITS.has(bas)) return bas;
  return bas.charAt(0).toUpperCase() + bas.slice(1);
}
function nomProduitCasse(nom) {
  let premier = true;
  return String(nom == null ? '' : nom).replace(NOM_JETONS, (t) => { if (!/[A-Za-zÀ-ÖØ-öø-ÿŒœÆæ0-9]/.test(t)) return t; const r = nomMotCasse(t, premier); if (NOM_LETTRE.test(t)) premier = false; return r; });
}

/* ---------- informations d'un intrant (fiche du produit) ---------- */
const PRODUIT_INFOS = [['fabricant', 'Fabricant', 120], ['composition', 'Composition', 600], ['doseEmploi', 'Dose d’emploi', 300], ['modeEmploi', 'Mode d’emploi', 1000],
  ['stockage', 'Stockage', 400], ['conservation', 'Conservation', 300], ['allergenes', 'Allergènes', 300], ['usageBio', 'Utilisation en bio', 300]];
// informations reprises sur un produit d'hygiène (les autres rubriques de la FDS : « Relire une FDS » dans sa fiche)
const HYG_INFOS = [['fabricant', 'Fabricant', 120], ['composition', 'Composition', 600], ['modeEmploi', 'Mode d’emploi', 2000], ['stockage', 'Stockage', 1000]];
const infosDe = (type) => (type === 'produitHygiene' ? HYG_INFOS : type === 'produitMaintenance' ? PMAINT_INFOS : PRODUIT_INFOS);
const ficheObjDe = (db, cible) => (!cible ? null : cible.type === 'produitHygiene' ? hygDef(db, cible.id) : cible.type === 'produitMaintenance' ? maintProdDef(db, cible.id) : (db.produits || []).find((x) => x.id === cible.id) || null);
const infoLib = (k) => ([...PRODUIT_INFOS, ...HYG_INFOS].find((x) => x[0] === k) || [k, k])[1];

/* ---------- lecture par le script : rubriques reconnues d'une FT, d'une FDS ou d'un certificat ---------- */
const INFOS_LIBELLES = [ // l'ordre compte : « Conservation et stockage » est du stockage
  ['fabricant', /^(?:fabricant|fabrique par|producteur|distribue par|distributeur|titulaire)\b/],
  ['composition', /^(?:composition|ingredients?|constituants?|matieres? actives?|principes? actifs?)\b/],
  ['doseEmploi', /^(?:doses? d.emploi|doses? d.utilisation|doses? conseillees?|doses? recommandees?|doses? legales?|dosages?)\b/],
  ['modeEmploi', /^(?:mode d.emploi|mode d.utilisation|mise en oeuvre|conseils? d.utilisation|preparation et utilisation|utilisation(?! en (?:agriculture |vinification )?bio))\b/],
  ['stockage', /^(?:conditions? de stockage|stockage|conservation et stockage|conditions? de conservation)\b/],
  ['conservation', /^(?:duree de conservation|conservation|dluo|ddm|date de durabilite)\b/],
  ['allergenes', /^(?:allergenes?|declaration allergenes?)\b/],
];
function ficheInfosScript(texte, genre) {
  const T = String(texte || '').replace(/\r/g, ''); if (!T.trim()) return {};
  const L = T.split('\n').map((x) => x.replace(/\s+/g, ' ').trim()); const F = L.map((x) => plier(x)); const out = {};
  const intitule = (f) => INFOS_LIBELLES.some(([, re]) => re.test(f)) || /^[^:]{2,45}:\s*$/.test(f) || /^\d{1,2}(?:\.\d{1,2})*\s*[.)–-]\s+[a-z]/.test(f);
  if (genre === 'fds') { // FDS : rubriques 1, 3 et 7 du règlement REACH
    const fds = fdsAnalyser(T); if (fds.fabricant) out.fabricant = fds.fabricant; if (fds.composition) out.composition = fds.composition; if (fds.stockage) out.stockage = fds.stockage;
    return out;
  }
  INFOS_LIBELLES.forEach(([k, re]) => {
    if (out[k]) return; const rang = (x) => INFOS_LIBELLES.findIndex((y) => y[0] === x); // une ligne qui répond à un intitulé placé avant (« Conservation et stockage ») lui revient
    const i = F.findIndex((f) => re.test(f) && f.length < 300 && !INFOS_LIBELLES.some(([k2, re2]) => k2 !== k && rang(k2) < rang(k) && re2.test(f)));
    if (i < 0) return;
    const dp = L[i].indexOf(':'); let v = dp >= 0 ? L[i].slice(dp + 1).trim() : '';
    // suite : sous un intitulé seul, jusqu'à 4 lignes ; après une valeur sur la même ligne, seulement une phrase qui continue (minuscule)
    const seul = !v; const suite = (x) => /^[a-zà-ÿœ(]/.test(x);
    for (let j = i + 1; j < L.length && j <= i + 4; j += 1) { if (!L[j] || intitule(F[j]) || v.length > 240 || (!seul && !suite(L[j]))) break; v = !v ? L[j] : suite(L[j]) || /[.!]$/.test(v) ? `${v} ${L[j]}` : `${v} ; ${L[j]}`; }
    v = v.replace(/\s+/g, ' ').trim(); if (v.length >= 3 && /[A-Za-zÀ-ÿ0-9]/.test(v)) out[k] = v.slice(0, ((PRODUIT_INFOS.find((x) => x[0] === k) || [])[2]) || 300);
  });
  const bio = L.find((x, n) => /agriculture biologique|2018\/848|203\/2012|utilisable en (?:vinification )?bio|autorise en (?:vinification )?bio|conforme .{0,40}\bbio\b/.test(F[n]) && x.length < 300);
  if (bio) out.usageBio = bio;
  return out;
}

/* ---------- assistant IA : compléter ce que le script n'a pas trouvé ---------- */
const IA_INFOS_DESC = {
  fabricant: '"<société qui fabrique ou commercialise le produit>"', composition: '"<composition ou matières actives, en une ou deux phrases>"',
  doseEmploi: '"<doses d’emploi conseillées (et dose légale maximale si indiquée), avec leurs unités>"', modeEmploi: '"<préparation et mise en œuvre, en deux ou trois phrases>"',
  stockage: '"<conditions de stockage>"', conservation: '"<durée de conservation, DDM (DLUO), conservation après ouverture>"', allergenes: '"<allergènes présents, ou « aucun » si le document l’affirme>"',
  usageBio: '"<utilisation en agriculture biologique d’après le document (règlement (UE) 2018/848…)>"',
};
function iaPromptInfos(lu, champs, produitNom, connu) {
  const system = 'Tu aides une cave (vinification) à compléter la fiche de ses produits œnologiques et d’hygiène à partir des documents de leurs fournisseurs (fiche technique, FDS, certificat). Tu ne reprends que ce que le document dit, sans rien inventer, en français et de façon concise. Tu réponds uniquement par un objet JSON valide.';
  const k = champs.map((c) => c[0]); const deja = k.filter((x) => connu && connu[x]).map((x) => `- ${infoLib(x)} : ${String(connu[x]).slice(0, 160)}`);
  const texte = `Produit : ${produitNom || '(d’après le document)'}\nDocument : « ${lu.fichier || 'document'} »${lu.genre ? ` (${lu.genre === 'fds' ? 'fiche de données de sécurité' : lu.genre === 'ft' ? 'fiche technique' : lu.genre === 'certificat' ? 'certificat ou attestation' : 'document'})` : ''}${lu.ocr ? ', texte reconnu sur un scan ou une photo (il peut contenir des erreurs)' : ''}.\nTexte :\n"""\n${String(lu.texte || lu.extrait || '').slice(0, 12000)}\n"""\n${deja.length ? `\nDéjà lu par le logiciel (à garder, sauf erreur manifeste) :\n${deja.join('\n')}\n` : ''}\nRéponds par un objet JSON avec ces clés (null quand le document ne le dit pas) :\n{${k.map((x) => `"${x}": ${IA_INFOS_DESC[x] || '"<texte>"'}`).join(', ')}}`;
  return { system, texte, max: 1200 };
}
function iaLireInfos(o, champs) {
  if (!o || typeof o !== 'object') return null; const out = {};
  champs.forEach(([k, , n]) => { const v = o[k]; const t = Array.isArray(v) ? v.filter((x) => !iaNul(x)).join(' ; ') : iaTexte(v, n || 300); if (t && !/^(?:aucune? (?:information|indication|mention)|non (?:precise|indique|communique)e?s?)\.?$/i.test(plier(t))) out[k] = t; });
  return out;
}
// script d'abord ; l'IA complète ce qui manque. src : d'où vient chaque information
function infosFusion(script, ia) {
  const vals = {}; const src = {};
  Object.keys(script || {}).forEach((k) => { if (script[k]) { vals[k] = script[k]; src[k] = 'script'; } });
  Object.keys(ia || {}).forEach((k) => { if (ia[k] && !vals[k]) { vals[k] = ia[k]; src[k] = 'ia'; } });
  return { vals, src };
}
// propositions pour un produit : informations lues qui complètent (case cochée) ou changeraient (décochée) sa fiche ; identiques : omises
function infosPropositions(db, cible, infos) {
  const p = ficheObjDe(db, cible);
  const V = (infos && infos.vals) || {};
  return [...infosDe(cible ? cible.type : 'produit').filter(([k]) => V[k]).map(([k, lab]) => { const act = String((p && p[k]) || '').trim(); return { k, lab, v: V[k], src: (infos.src || {})[k] || 'script', actuel: act, complete: !act }; }).filter((x) => norm(x.actuel) !== norm(x.v)),
    ...detectionPropositions(db, cible, p, V)]; // allergènes, revendications, contact alimentaire (0.36.0-alpha.1)
}
function produitInfosAppliquer(db, cible, vals) {
  if (!cible || !vals) return 0; const L = infosDe(cible.type); const p = ficheObjDe(db, cible); if (!p) return 0;
  let n = 0; L.forEach(([k, , max]) => { const v = vals[k]; if (v == null) return; const t = String(v).trim().slice(0, max); if (t && t !== p[k]) { p[k] = t; n += 1; } });
  Object.keys(vals).filter((k) => DETECTION_CLES(k)).forEach((k) => { n += detectionAppliquer(db, cible, p, k, vals[k]); });
  if (n && (cible.type === 'produitHygiene' || cible.type === 'produitMaintenance')) p.modifLe = todayISO();
  return n;
}

/* ---------- assistant IA : FDS d'un produit d'hygiène (toutes les rubriques utiles) ---------- */
const IA_FDS_DESC = () => [
  ['nom', '"<nom commercial du produit>"'], ['fabricant', '"<société qui a émis la FDS>"'], ['type', `"${HYG_TYPES.map((x) => x[0]).join('" | "')}"`], ['forme', `"${HYG_FORMES.map((x) => x[0]).join('" | "')}"`],
  ['composition', '"<substances dangereuses principales et leurs concentrations>"'], ['fdsDate', '"AAAA-MM-JJ (date de révision)"'], ['fdsVersion', '"<version>"'], ['mention', '"danger" | "attention"'],
  ['pictos', '["SGH05", …] (codes des pictogrammes de danger)'], ['phrasesH', '"<mentions de danger H avec leur texte, séparées par « ; »>"'], ['epi', `[${HYG_EPI.map((x) => `"${x[0]}"`).join(', ')}] (protections à porter)`],
  ['incompatibilites', '"<matières incompatibles>"'], ['stockage', '"<conditions de stockage>"'], ['secours', '"<premiers secours, en bref>"'], ['urgence', '"<numéro d’appel d’urgence>"'],
  ['concMin', 'nombre (concentration d’emploi minimale, si le document l’indique)'], ['concMax', 'nombre (concentration d’emploi maximale)'], ['concUnite', `"${HYG_CONC.map((x) => x[0]).join('" | "')}"`],
  ['temperature', '"<température d’emploi>"'], ['contact', '"<temps de contact>"'], ['modeEmploi', '"<mode d’emploi en deux ou trois phrases>"'],
];
function iaPromptFds(lu, nom) {
  const system = 'Tu aides une cave (vinification) à remplir la fiche de ses produits de nettoyage et de désinfection à partir de leur fiche de données de sécurité (FDS) ou de leur fiche technique. Tu ne reprends que ce que le document dit, sans rien inventer, en français et de façon concise. Tu réponds uniquement par un objet JSON valide.';
  const texte = `Produit : ${nom || '(d’après le document)'}\nDocument : « ${lu.fichier || 'FDS'} »${lu.ocr ? ' (texte reconnu sur un scan ou une photo : il peut contenir des erreurs)' : ''}.\nTexte :\n"""\n${String(lu.texte || '').slice(0, 14000)}\n"""\n\nRéponds par un objet JSON avec ces clés (null quand le document ne le dit pas) :\n{${IA_FDS_DESC().map(([k, d]) => `"${k}": ${d}`).join(', ')}}`;
  return { system, texte, max: 1800 };
}
function iaLireFds(o) {
  if (!o || typeof o !== 'object') return null; const out = {}; const t = (k, n) => { const v = iaTexte(o[k], n); if (v) out[k] = v; };
  const parmi = (k, L) => { const v = iaNul(o[k]) ? '' : String(o[k]).trim().toLowerCase(); const x = L.find((y) => y[0].toLowerCase() === v); if (x) out[k] = x[0]; };
  t('nom', 120); t('fabricant', 120); parmi('type', HYG_TYPES); parmi('forme', HYG_FORMES); t('composition', 600); const d = iaDateDe(o.fdsDate); if (d) out.fdsDate = d; t('fdsVersion', 20);
  parmi('mention', HYG_MENTIONS); parmi('concUnite', HYG_CONC);
  const codes = (Array.isArray(o.pictos) ? o.pictos : String(o.pictos || '').split(/[,;\s]+/)).map((x) => String(x || '').toUpperCase().replace(/^GHS/, 'SGH').replace(/^SGH(\d)$/, 'SGH0$1')).filter((x) => HYG_PICTOS.some((p) => p[0] === x));
  if (codes.length) out.pictos = uniq(codes);
  t('phrasesH', 4000); const epi = (Array.isArray(o.epi) ? o.epi : []).map((x) => String(x || '').toLowerCase()).filter((x) => HYG_EPI.some((e) => e[0] === x)); if (epi.length) out.epi = uniq(epi);
  t('incompatibilites', 1000); t('stockage', 1000); t('secours', 2000); t('urgence', 200); t('temperature', 60); t('contact', 60); t('modeEmploi', 2000);
  ['concMin', 'concMax'].forEach((k) => { const v = o[k]; if (!iaNul(v) && hasNum(String(v).replace(',', '.'))) out[k] = String(num(String(v).replace(',', '.'))).replace('.', ','); });
  return out;
}
