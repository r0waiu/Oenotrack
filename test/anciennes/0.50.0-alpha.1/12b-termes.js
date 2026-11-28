/* ============ VOCABULAIRE ET COEFFICIENTS (0.47.0-alpha.2) : revue des termes techniques validée par l'exploitation ============
   - sucre et densité : un seul coefficient (settings.coefSucre, g/L de saccharose par point de densité, 2,5 par défaut) ; les points de
     densité par g/L (correction du point de tirage) s'en déduisent (1 ÷ coefficient = 0,4) ;
   - augmentation de volume du saccharose dissous : valeur physique 0,6329 L/kg pour les calculs (calculateur de tirage, fonte de liqueur,
     simulateur d'enrichissement : settings.tirageProfil.volSucreLkg) et valeur douanière 0,66 L/kg pour les déclarations
     (volume du sucre de la déclaration préalable de tirage : settings.tirageProfil.volSucreDeclLkg) ;
   - rosé par coupage de vin blanc et de vin rouge : permis pour une cuvée destinée aux vins mousseux ; avertissement (non bloquant) pour
     un vin tranquille (règlement délégué (UE) 2019/934, art. 8), sauf si la liste des appellations contient la Côte-Rôtie (son cahier
     des charges autorise l'ajout de vin blanc au rouge) ;
   - millésime « NV » (donnée gardée pour la compatibilité) affiché « non millésimé » ;
   - libellés d'origine renommés dans les bases existantes (seulement s'ils sont encore à leur valeur d'origine, une fois, tracé dans
     settings.termes047) ; valeurs numériques réglées par l'exploitation jamais changées. */
const SUCRE_VOL_PHYSIQUE_LKG = 0.6329; // L par kg de saccharose dissous (valeur physique)
const SUCRE_VOL_DOUANE_LKG = 0.66; // L par kg (valeur douanière, retenue pour les déclarations)
const COEF_SUCRE_DEFAUT = 2.5; // g/L de saccharose par point de densité (0,4 point par g/L), à vérifier
const COEF_SUCRE_ANCIEN = 2.6; // valeur par défaut avant 0.47.0-alpha.2
const ACIDITE_TARTRIQUE_PAR_H2SO4 = 1.531; // 1 g/L exprimé en H₂SO₄ = 1,531 g/L exprimé en acide tartrique
const ACIDITE_ACETIQUE_PAR_H2SO4 = 1.2245; // acidité volatile : 1 g/L H₂SO₄ = 1,2245 g/L en acide acétique

const coefSucre = (db) => { const v = num(((db && db.settings) || {}).coefSucre); return v > 0 ? v : COEF_SUCRE_DEFAUT; };
const densPtParGL = (db) => 1 / coefSucre(db); // points de densité par g/L de sucre (déduits du coefficient unique)
const sucreVolPhysique = (db) => { const t = (((db && db.settings) || {}).tirageProfil) || {}; return num(t.volSucreLkg) > 0 ? num(t.volSucreLkg) : SUCRE_VOL_PHYSIQUE_LKG; };
const sucreVolDouane = (db) => { const t = (((db && db.settings) || {}).tirageProfil) || {}; return num(t.volSucreDeclLkg) > 0 ? num(t.volSucreDeclLkg) : SUCRE_VOL_DOUANE_LKG; };

// millésime affiché : « NV » (non-vintage, donnée d'origine) → « non millésimé »
const millesimeAffiche = (m) => { const s = String(m == null ? '' : m).trim(); return /^(nv|n\.v\.|sans millésime)$/i.test(s) ? 'non millésimé' : s; };
const millesimeSaisi = (m) => (/^non mill[ée]sim[ée]$/i.test(String(m || '').trim()) ? 'NV' : m); // saisie « non millésimé » → donnée 'NV'

// unités d'acidité selon le pays : France g/L H₂SO₄ ; ailleurs (OIV, UE) acide tartrique (AT) et acide acétique (acidité volatile)
const ACIDITE_UNITES = { france: { at: 'g/L H₂SO₄', av: 'g/L H₂SO₄' }, etranger: { at: 'g/L ac. tartrique', av: 'g/L ac. acétique' } };
const aciditeEquivalence = (v, unite) => { if (!hasNum(v)) return ''; const u = norm(String(unite || '').replace(/₂/g, '2').replace(/₄/g, '4')); if (/h2so4/.test(u)) return `${fmt(num(v) * ACIDITE_TARTRIQUE_PAR_H2SO4, 2)} g/L ac. tartrique`; if (/tartrique/.test(u)) return `${fmt(num(v) / ACIDITE_TARTRIQUE_PAR_H2SO4, 2)} g/L H₂SO₄`; return ''; };

// SO₂ moléculaire d'un vin : TAV acquis (dernière analyse), sinon TAP des analyses antérieures (moûts, bases d'avant 0.47.0-alpha.2)
function so2TavDe(db, lotIds) {
  const der = (pid) => { const L = (db.analyses || []).filter((a) => a && (lotIds || []).includes(a.lotId) && a.valeurs && hasNum(a.valeurs[pid])).sort((a, b) => (a.date < b.date ? 1 : -1)); return L.length ? num(L[0].valeurs[pid]) : null; };
  const t = der(tavParamId(db)); return t != null ? t : der('tap');
}
// paramètre « TAV acquis » de la base : 'tav' (0.47.0-alpha.2), ou celui créé avant depuis un bulletin (même nom)
const tavParamId = (db) => { const P = (db && db.analysesParams) || []; const p = P.find((x) => x && x.id === 'tav') || P.find((x) => x && norm(x.nom).trim() === 'tav acquis'); return p ? p.id : 'tav'; };

/* ---------- coupage blanc + rouge ---------- */
const COTE_ROTIE = (db) => (((db && db.lists && db.lists.appellations) || []).some((a) => a && norm(a.label).replace(/[^a-z]/g, '') === 'coterotie'));
// cuvée destinée aux vins mousseux : mixtion, cuvée de tirage prévue, exploitation champenoise, ou exploitation qui ne fait que des effervescents
function coupageEffervescent(db, o) {
  const x = o || {}; if (x.mixtion || x.cuveeId || x.effervescent) return true;
  if (typeof champenois === 'function' && champenois(db)) return true;
  const T = typeof profilViticole === 'function' ? profilViticole(db).types : [];
  return T.length > 0 && T.every((t) => t === 'effervescent' || t === 'ancestrale');
}
// avertissement (non bloquant) pour un coupage de vin blanc et de vin rouge donnant un rosé hors vins mousseux ; null sinon
function roseCoupageAlerte(db, couleurs, o) {
  const u = uniq((couleurs || []).filter(Boolean)); if (u.length < 2) return null;
  const def = (id) => couleurDef(db, id) || {}; const rouge = u.some((c) => c === 'rouge' || norm(def(c).label) === 'rouge'); const blanc = u.some((c) => c === 'blanc' || norm(def(c).label) === 'blanc');
  if (!rouge || !blanc) return null; if (coupageEffervescent(db, o) || COTE_ROTIE(db)) return null;
  return 'Coupage de vin blanc et de vin rouge : un rosé ainsi obtenu est interdit pour un vin tranquille (règlement délégué (UE) 2019/934, art. 8), sauf cuvée destinée aux vins mousseux ou cahier des charges qui l’autorise (la Côte-Rôtie permet l’ajout de vin blanc au rouge) : vérifiez votre cahier des charges.';
}

// assemblage : avertissement rosé (ci-dessus) et coupage au sens du règlement délégué (UE) 2019/934, art. 7 (millésimes, cépages ou couleurs
// différents ; l'usage champenois « assemblage » reste le nom de l'opération) — sources : [{ portionId }] de R
function assemblageCoupage(db, R, sources, o) {
  const P = (R && R.portions) || {}; const lots = uniq((sources || []).map((x) => x && P[x.portionId]).filter(Boolean).map((p) => p.lotId)).map((id) => (R.lots || {})[id]).filter(Boolean);
  const couleurs = uniq(lots.map((l) => l.couleur).filter(Boolean)); const mil = uniq(lots.map((l) => String(l.millesime || '')).filter(Boolean));
  const cep = uniq(lots.map((l) => { const c = (composition(db, R, l.id) || {}).cepages || {}; return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || ''; }).filter(Boolean));
  const motifs = [mil.length > 1 ? 'millesimes' : '', cep.length > 1 ? 'cepages' : '', couleurs.length > 1 ? 'couleurs' : ''].filter(Boolean);
  return { rose: roseCoupageAlerte(db, couleurs, o), coupage: motifs.length ? motifs : null, couleurs };
}

/* ---------- libellés et valeurs d'origine renommés (0.47.0-alpha.2), dans les bases existantes ---------- */
// [liste, id, champ, ancienne valeur d'origine, nouvelle valeur] : changé seulement si la valeur est encore celle d'origine
const TERMES_047_LISTES = [
  ['fractions', 'taille1', 'label', '1ère taille', '1re taille'], ['fractions', 'taille2', 'label', '2ème taille', '2e taille'],
  ['typesPerte', 'ouillage', 'label', 'Évaporation / ouillage', 'Évaporation (part des anges)'],
  ['methodesFiltration', 'diato', 'label', 'Terre diatomée', 'Terre de diatomées'],
  ['actionsHygiene', 'soufrage', 'label', 'Mèchage / SO₂', 'Méchage / SO₂'],
  ['cepages', 'pn', 'label', 'Pinot Noir', 'Pinot noir'], ['cepages', 'pinot_gris', 'label', 'Pinot Gris', 'Pinot gris'], ['cepages', 'pinot_blanc', 'label', 'Pinot Blanc', 'Pinot blanc'],
  ['cepages', 'sauvignon', 'label', 'Sauvignon Blanc', 'Sauvignon blanc'], ['cepages', 'cab_franc', 'label', 'Cabernet Franc', 'Cabernet franc'],
  ['stades', 'vin_clair', 'label', 'Vin clair', 'Vin clarifié'], ['stades', 'vin_clair', 'court', 'Vin clair', 'Clarifié'],
  ['stades', 'stabilise', 'label', 'Vin stabilisé, prêt au tirage', 'Vin stabilisé, prêt à la mise en bouteille ou au tirage'],
  ['echelles', 'premier', 'label', 'Premiers crus', 'Premiers Crus'], ['echelles', 'premier', 'label', '1ers Crus', 'Premiers Crus'], ['echelles', 'premier', 'un', '1er Cru', 'Premier Cru'], ['echelles', 'grand', 'label', 'Grands crus', 'Grands Crus'],
  ['operations', 'enrichissement', 'label', 'Enrichissement (chaptalisation)', 'Enrichissement'],
  ['operations', 'enrichissement', 'aide', 'Ajout de sucre (saccharose, MCR) pour augmenter le titre alcoométrique, dans les limites autorisées et déclarées.', 'Augmentation du titre alcoométrique volumique naturel par ajout de saccharose (chaptalisation), de moût concentré ou de MCR, dans les limites autorisées et déclarées.'],
  ['operations', 'nutrition', 'aide', 'Ajout d’activateur de fermentation, de phosphate d’ammonium ou de nutriments organiques pendant la FA.', 'Ajout d’activateur de fermentation, de phosphate diammonique (DAP), de sulfate d’ammonium ou de nutriments organiques pendant la FA.'],
  ['operations', 'fin_fa', 'aide', 'Sucres épuisés (< 2 g/L, densité ≤ 0,994) : le lot passe en « Fin de FA ».', 'Sucres (glucose + fructose) < 2 g/L, confirmés par analyse ; densité sous le seuil de fin de FA (0,994 par défaut, à vérifier) : le lot passe en « Fin de FA ».'],
  ['operations', 'froid', 'aide', 'Stabilisation tartrique ou débourbage à froid : cuve, température, durée et intrants éventuels.', 'Stabilisation tartrique par le froid : cuve, température, durée et intrants éventuels.'],
  ['operations', 'regroupement', 'aide', 'Réunion de plusieurs cuves d’un même vin : le stade suit les règles de mélange (ex. vin filtré + vin clair = vin clair), sans passer en « assemblé ».', 'Réunion de plusieurs cuves d’un même vin : le stade suit les règles de mélange (ex. vin filtré + vin clarifié = vin clarifié), sans passer en « assemblé ».'],
  ['operations', 'assemblage_millesimes', 'aide', 'Vins de plusieurs millésimes réunis (vin non millésimé, vins de réserve) : choisissez le millésime du lot (ou « non millésimé ») selon les règles de l’appellation.', 'Vins de plusieurs millésimes réunis (vin non millésimé, vins de réserve ; coupage au sens du règlement délégué (UE) 2019/934, art. 7) : choisissez le millésime du lot (ou « non millésimé ») selon les règles de l’appellation.'],
];
// paramètres d'analyse et modèles d'origine
const TERMES_047_PARAMS = [['densite', 'nom', 'Densité', 'Densité (masse volumique à 20 °C)'], ['densite', 'unite', '', 'g/mL']];
const TERMES_047_MODELES = [['m_clair', ['tap', 'at', 'ph', 'so2t', 'so2l'], ['tav', 'at', 'ph', 'so2t', 'so2l']], ['m_pretirage', ['tap', 'at', 'ph', 'so2t', 'dbase', 'dmix'], ['tav', 'at', 'ph', 'so2t', 'dbase', 'dmix']]];
// textes d'origine du plan de nettoyage et de l'exemple du plan de vinification
const TERMES_047_TEXTES = [
  ['Avant de recevoir un vin d’une revendication supérieure (Conventionnel → Bio, Bio → Biodynamie) : rinçage complet, enregistré avec la mention « changement de revendication ».', 'Avant de recevoir un vin d’une revendication supérieure (Conventionnel → Bio, Bio → Demeter / biodynamie : Biodyvin…) : rinçage complet, enregistré avec la mention « changement de revendication ».'],
  ['Rinçage à l’eau après déchargement ; vérifier les compartiments avant chargement. Moût ou vin Bio / Biodynamie : attestation de nettoyage.', 'Rinçage à l’eau après déchargement ; vérifier les compartiments avant chargement. Moût ou vin Bio / Demeter (biodynamie : Biodyvin…) : attestation de nettoyage.'],
  ['Chaptalisation (TAP visé)', 'Enrichissement (TAV visé)'], ['Stabulation à froid', 'Stabilisation tartrique par le froid'],
  ['Volume non débourbé pour un marc de 4 000 kg (hL)', 'Volume de moûts débourbés pour un marc de 4 000 kg (hL)'], // la ligne « Volume débourbé » d'une copie reste telle quelle
  ['Blanc de Blancs', 'Blanc de blancs'], ['Assemblage / Blanc de Noirs', 'Assemblage / Blanc de noirs'], ['5 g/hL', '5 g/hL de SO₂'], ['7 g/hL', '7 g/hL de SO₂'],
];
// une seule fois par base (settings.termes047 : version, date, changements) ; rien n'est supprimé, une valeur choisie par l'exploitation est gardée
function termesMigrer047(out) {
  const s = out.settings || (out.settings = {}); if (s.termes047) return out;
  const ch = []; const note = (cle, de, a) => ch.push({ cle, de, a });
  TERMES_047_LISTES.forEach(([k, id, f, de, a]) => { const x = ((out.lists || {})[k] || []).find((y) => y && y.id === id); if (x && x[f] === de) { x[f] = a; note(`lists.${k}.${id}.${f}`, de, a); } });
  const P = Array.isArray(out.analysesParams) ? out.analysesParams : [];
  TERMES_047_PARAMS.forEach(([id, f, de, a]) => { const p = P.find((x) => x && x.id === id); if (p && (p[f] == null ? '' : p[f]) === de && (f !== 'unite' || p.nom === 'Densité (masse volumique à 20 °C)')) { p[f] = a; note(`analysesParams.${id}.${f}`, de, a); } });
  if (!P.some((x) => x && (x.id === 'tav' || norm(x.nom).trim() === 'tav acquis'))) { const i = P.findIndex((x) => x && x.id === 'tap'); P.splice(i < 0 ? P.length : i + 1, 0, { id: 'tav', nom: 'TAV acquis', unite: '% vol.', dec: 1 }); note('analysesParams.tav', '', 'TAV acquis'); }
  const tav = tavParamId(out); // modèles des vins : TAV acquis au lieu du TAP (paramètre existant de la base s'il a été créé avant)
  (Array.isArray(out.analysesModeles) ? out.analysesModeles : []).forEach((m) => { const r = m && TERMES_047_MODELES.find((x) => x[0] === m.id); if (r && Array.isArray(m.paramIds) && m.paramIds.join() === r[1].join()) { m.paramIds = r[2].map((x) => (x === 'tav' ? tav : x)); note(`analysesModeles.${m.id}`, r[1].join(), m.paramIds.join()); } });
  const texte = (v) => { const r = TERMES_047_TEXTES.find((x) => x[0] === v); return r ? r[1] : v; };
  (Array.isArray(out.planNettoyage) ? out.planNettoyage : []).forEach((x) => { if (x && typeof x.mode === 'string' && texte(x.mode) !== x.mode) { note(`planNettoyage.${x.id}.mode`, x.mode, texte(x.mode)); x.mode = texte(x.mode); } });
  (Array.isArray(out.plansVinif) ? out.plansVinif : []).forEach((p) => { if (!p || p.id !== 'pv-exemple-blanc') return; (p.lignes || []).forEach((l) => {
    if (!l) return; ['etape', 'produit'].forEach((f) => { if (typeof l[f] === 'string' && texte(l[f]) !== l[f]) { note(`plansVinif.${p.id}.${l.id}.${f}`, l[f], texte(l[f])); l[f] = texte(l[f]); } });
    if ((l.id === 'l2' || l.id === 'l13') && l.valeurs && typeof l.valeurs === 'object') Object.keys(l.valeurs).forEach((k) => { const v = l.valeurs[k]; if (typeof v === 'string' && texte(v) !== v) { l.valeurs[k] = texte(v); note(`plansVinif.${p.id}.${l.id}.${k}`, v, l.valeurs[k]); } }); }); });
  // coefficients : la valeur d'origine (2,6 ; 0,66 L/kg pour les calculs) devient la nouvelle ; une valeur réglée par l'exploitation est gardée
  const tp = s.tirageProfil && typeof s.tirageProfil === 'object' ? s.tirageProfil : null;
  if (num(s.coefSucre) === COEF_SUCRE_ANCIEN) {
    const dp = tp && num(tp.densPtParGL) > 0 && Math.abs(num(tp.densPtParGL) - 0.4) > 1e-9 ? num(tp.densPtParGL) : 0; // points par g/L réglés à la main : le coefficient en est déduit
    const v = dp ? Math.round(10000 / dp) / 10000 : COEF_SUCRE_DEFAUT; note('settings.coefSucre', s.coefSucre, v); s.coefSucre = v;
  }
  if (tp && num(tp.volSucreLkg) === SUCRE_VOL_DOUANE_LKG) { tp.volSucreLkg = SUCRE_VOL_PHYSIQUE_LKG; note('settings.tirageProfil.volSucreLkg', SUCRE_VOL_DOUANE_LKG, SUCRE_VOL_PHYSIQUE_LKG); }
  s.termes047 = { version: APP_VERSION, le: new Date().toISOString(), changements: ch };
  return out;
}
