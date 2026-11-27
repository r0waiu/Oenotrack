/* ============ STORE : base, opérations, alertes, campagnes, persistance ============ */
const fail = (msg) => ({ ok: false, msg });
const okr = (extra) => ({ ok: true, ...(extra || {}) });

const DEFAULT_PARAMS = () => ([
  { id: 'tap', nom: 'TAP', unite: '% vol.', dec: 1 }, { id: 'at', nom: 'AT', unite: 'g/L H₂SO₄', dec: 2 }, { id: 'ph', nom: 'pH', unite: '', dec: 2 },
  { id: 'azote', nom: 'Azote assimilable', unite: 'mg/L', dec: 0 }, { id: 'so2t', nom: 'SO₂ total', unite: 'mg/L', dec: 0 }, { id: 'so2l', nom: 'SO₂ libre', unite: 'mg/L', dec: 0 },
  { id: 'dbase', nom: 'Densité vin de base', unite: '', dec: 4 }, { id: 'dmix', nom: 'Densité mixtion', unite: '', dec: 4 },
  ...SUIVI_PARAMS(),
]);
// suivi de vinification : fermentations (densité, température, sucres) et FML (acide malique), acidité volatile
const SUIVI_PARAMS = () => ([
  { id: 'densite', nom: 'Densité', unite: '', dec: 3 }, { id: 'temp', nom: 'Température', unite: '°C', dec: 1 }, { id: 'sucres', nom: 'Sucres (glucose + fructose)', unite: 'g/L', dec: 1 },
  { id: 'malique', nom: 'Acide malique', unite: 'g/L', dec: 2 }, { id: 'av', nom: 'Acidité volatile', unite: 'g/L H₂SO₄', dec: 2 },
]);
const SUIVI_MODELES = () => ([
  { id: 'm_ferm', nom: 'Suivi de fermentation', etape: 'Fermentation alcoolique', paramIds: ['densite', 'temp', 'sucres'] },
  { id: 'm_fml', nom: 'Contrôle FML', etape: 'Fermentation malolactique', paramIds: ['malique', 'av', 'ph'] },
]);
const DEFAULT_MODELES = () => ([
  { id: 'm_mout', nom: 'Moût', etape: 'Débourbage', paramIds: ['tap', 'at', 'ph', 'azote'] },
  { id: 'm_clair', nom: 'Vin clair', etape: 'Vinification', paramIds: ['tap', 'at', 'ph', 'so2t', 'so2l'] },
  { id: 'm_pretirage', nom: 'Pré-tirage', etape: 'Tirage', paramIds: ['tap', 'at', 'ph', 'so2t', 'dbase', 'dmix'] },
  ...SUIVI_MODELES(),
]);

function emptyDb(campNom) {
  const y = yearOf(todayISO()); const m = parseInt(todayISO().slice(5, 7), 10);
  const y0 = m >= 8 ? y : y - 1; // campagne : 1er août → 31 juillet
  const nom = campNom || `${y0}-${y0 + 1}`;
  return {
    app: APP_ID, schema: SCHEMA,
    meta: { seq: 0, opSeq: 0, creeLe: todayISO(), derniereExport: null, exemple: false, creeAvec: APP_VERSION, appVersion: APP_VERSION, versions: [APP_VERSION] },
    settings: { campagneActive: nom, coefSucre: 2.6, volBouteilleL: 0.75, objectifTirageGL: 24, siteActif: 'all', domaine: '', couleurDefaut: 'blanc', echelleNom: 'Échelle des crus', echellePreset: 'champagne', planHygieneDepuis: todayISO() },
    lists: DEFAULT_LISTS(),
    sites: [{ id: 'site1', nom: 'Cuverie principale', adresse: '', zones: [] }],
    crus: DEFAULT_CRUS(), parcelles: [], apporteurs: [], apparence: DEFAULT_APPARENCE(),
    campagnes: [{ id: nom, nom, debut: `${y0}-08-01`, fin: `${y0 + 1}-07-31`, figee: false, snapshot: null, ouverture: null }],
    contenants: [], lots: [], lotsFinis: [], ops: [], alertes: [],
    fournisseurs: [], produits: [], arrivages: [], regles: [],
    analyses: [], analysesParams: DEFAULT_PARAMS(), analysesModeles: DEFAULT_MODELES(),
    hygiene: [],
    entreprise: { nom: '', adresse: '', logo: '', logoW: 0, logoH: 0 },
    docs: [], previsions: [], fiches: [], modelesFiches: [],
    operateurs: [], // personnes qui réalisent les opérations (Paramètres › Société & opérateurs)
    utilisateurs: [], profils: [], audit: [], // identifiants, profils de droits, journal des accès (0.15.0-alpha.1 ; inactifs tant qu'on ne les active pas)
    baremes: [], // barèmes de jaugeage des cuves et des citernes (0.17.0-alpha.1)
    produitsHygiene: [], // produits de nettoyage et de désinfection : FDS, fiches techniques, emploi (0.18.0-alpha.1)
    formulaires: [], // formulaires d'opération personnalisés : champs affichés / masqués / obligatoires, champs personnalisés (0.16.0-alpha.1)
    journalPressoir: [], // journal du pressoir : validations, corrections et annulations des pesées et des marcs (0.24.0-alpha.1, ajout seul)
    // plans d'hygiène (0.26.0-alpha.1) : plan de nettoyage et de désinfection, plan de maintenance, interventions, non-conformités justifiées
    planNettoyage: PLAN_NETTOYAGE_MODELE(), planMaintenance: PLAN_MAINTENANCE_MODELE(), maintenance: [], hygieneAcquits: [],
  };
}

function normalizeDb(d) {
  const e = emptyDb(); const old = (d.schema || 1) < 2; // sauvegardes de la v1 « Cuverie champenoise » : migration automatique
  const out = { ...e, ...d, meta: { ...e.meta, ...(d.meta || {}) }, settings: { ...e.settings, ...(d.settings || {}) }, lists: { ...e.lists, ...(d.lists || {}) } };
  ['campagnes', 'contenants', 'lots', 'lotsFinis', 'ops', 'alertes', 'fournisseurs', 'produits', 'arrivages', 'regles', 'analyses', 'analysesParams', 'analysesModeles', 'hygiene', 'sites', 'apporteurs', 'parcelles', 'docs', 'previsions', 'fiches', 'modelesFiches', 'operateurs', 'utilisateurs', 'profils', 'audit', 'formulaires', 'baremes', 'produitsHygiene', 'journalPressoir', 'planNettoyage', 'planMaintenance', 'maintenance', 'hygieneAcquits'].forEach((k) => { if (!Array.isArray(out[k])) out[k] = e[k]; });
  if (out.settings.charte === 'craie') out.settings.charte = 'oenotrack'; // « Craie & Champagne » est devenue la charte Œnotrack par défaut
  if (out.settings.charte && typeof CHARTES !== 'undefined' && !CHARTES.some((c) => c.id === out.settings.charte)) out.settings.charte = 'oenotrack';
  out.entreprise = { ...e.entreprise, ...(d.entreprise && typeof d.entreprise === 'object' ? d.entreprise : {}) };
  if (!Array.isArray(d.crus)) out.crus = DEFAULT_CRUS();
  if (!out.campagnes.length) out.campagnes = e.campagnes;
  if (!out.campagnes.find((c) => c.id === out.settings.campagneActive)) out.settings.campagneActive = out.campagnes[out.campagnes.length - 1].id;
  // listes : types de contenants (forme) et matières (couleur, finition)
  const dl = DEFAULT_LISTS(); const mergeList = (key, extra) => {
    const cur = out.lists[key] = (out.lists[key] || []).map((x) => ({ ...x }));
    if (old) dl[key].forEach((x) => { if (!cur.some((y) => y.id === x.id)) cur.push({ ...x }); });
    cur.forEach((x) => { const dflt = dl[key].find((y) => y.id === x.id); extra.forEach(([f, fb]) => { if (x[f] == null || x[f] === '') x[f] = dflt ? dflt[f] : fb; }); });
  };
  mergeList('typesContenant', [['forme', 'cuve']]); mergeList('matieres', [['couleur', '#B9C4CC'], ['finition', 'lisse']]); mergeList('fractions', [['suffix', ''], ['pressurage', true]]);
  // entrées de moûts « v2 » (une cuve, fraction et revendication globales) → moûts par ligne avec destinations
  out.ops = out.ops.map((o) => {
    if (o.type !== 'entree_mout' || Array.isArray(o.lots)) return o;
    const { contenantId, lotId, portionId, lotSpec, fractionId, ...rest } = o; const sp = lotSpec || {};
    return { ...rest, millesime: o.millesime || sp.millesime || '', immat: o.immat || '',
      entrees: (o.entrees || []).map((e) => ({ compartiment: e.compartiment || '', millesime: e.millesime || o.millesime || sp.millesime || '', cepageId: e.cepageId, fractionId: e.fractionId || fractionId || '', cruId: e.cruId || '', qualifId: e.qualifId || sp.qualifId || 'conv', apporteurId: e.apporteurId || o.apporteurId || '', volL: num(e.volL), dests: [{ contenantId, volL: num(e.volL) }] })),
      lots: [{ contenantId, lotId, portionId, code: sp.code || '', designation: sp.designation || '' }] };
  });
  // sites & plan de cave
  out.sites = out.sites.map((s) => ({ zones: [], adresse: '', ...s, zones: Array.isArray(s.zones) ? s.zones : [] }));
  if (!out.sites.length) out.sites = e.sites;
  if (out.settings.siteActif !== 'all' && !out.sites.some((s) => s.id === out.settings.siteActif)) out.settings.siteActif = 'all';
  out.contenants = out.contenants.map((c) => ({ ...c, siteId: out.sites.some((s) => s.id === c.siteId) ? c.siteId : out.sites[0].id }));
  out.sites.forEach((s) => planAuto(out, s.id, true));
  // partage des partenaires des lots de moût recalculé (une version antérieure qui a réécrit l'entrée ne connaissait qu'un partenaire par compartiment)
  out.lots = (() => { const maj = {}; out.ops.forEach((o) => { if (!o || o.type !== 'entree_mout' || !(o.entreesExtra || []).some((x) => x && (x.apporteurs || []).length) && !(o.entrees || []).some((e) => e && (e.apporteurs || []).length)) return; moutLots(o).forEach((l) => { if (l.lotId) maj[l.lotId] = moutApporteursLot(o, l); }); });
    return Object.keys(maj).length ? out.lots.map((x) => (x && maj[x.id] && x.origine ? { ...x, origine: { ...x.origine, apporteurs: maj[x.id] } } : x)) : out.lots; })();
  // entrées de moûts réécrites par une version antérieure : la copie 0.14.0-alpha.1 des compartiments (entreesExtra) est gardée et l'opération
  // remarquée « 0.14.0-alpha.1 » pour que cette copie survive aussi à la modification suivante faite avec cette version
  out.ops = out.ops.map((o) => (o && o.type === 'entree_mout' && Array.isArray(o.entreesExtra) && o.entreesExtra.some((x) => x && Object.keys(x).length) && num(o.av) < 1004 ? { ...o, av: 1004 } : o));
  // documents joints à une opération à réaliser puis validée par une version antérieure : rattachés à l'opération réalisée
  out.docs = out.docs.map((x) => { if (!x || !x.cible || x.cible.type !== 'prev') return x; const p = out.previsions.find((y) => y.id === x.cible.id); return p && p.statut === 'realisee' && p.opId && out.ops.some((o) => o.id === p.opId) ? { ...x, cible: { type: 'op', id: p.opId } } : x; });
  // apparence
  const ap = d.apparence || {}; const da = DEFAULT_APPARENCE();
  out.apparence = { ...da, ...ap, cepageColors: { ...da.cepageColors, ...(ap.cepageColors || {}) }, qualifColors: { ...da.qualifColors, ...(ap.qualifColors || {}) }, echelleColors: { ...da.echelleColors, ...(ap.echelleColors || {}) }, melanges: Array.isArray(ap.melanges) ? ap.melanges : [] };
  // stades, couleurs du vin, échelle des crus (listes personnalisables) — bases antérieures : valeurs par défaut
  const dlists = d.lists || {};
  if (!Array.isArray(dlists.echelles) || !dlists.echelles.length) out.lists.echelles = DEFAULT_ECHELLES().map((x) => ({ ...x, couleur: (ap.echelleColors || {})[x.id] || x.couleur }));
  if (!Array.isArray(dlists.stades) || !dlists.stades.length) out.lists.stades = DEFAULT_STADES();
  if (!Array.isArray(dlists.couleursVin) || !dlists.couleursVin.length) out.lists.couleursVin = DEFAULT_COULEURS_VIN();
  // revendications (0.18.0-alpha.1) : bases antérieures → Conventionnel, FR-BIO-01, Demeter avec leurs couleurs ; « conv » toujours en tête
  out.lists.qualifs = !Array.isArray(dlists.qualifs) || !dlists.qualifs.some((x) => x && x.id) ? DEFAULT_QUALIFS().map((x) => ({ ...x, couleur: (ap.qualifColors || {})[x.id] || x.couleur })) : qualifList(out);
  out.lists.stades = out.lists.stades.map((x) => ({ phase: 'vin', role: '', ...x }));
  if (!out.settings.suiviV3) { // une seule fois : paramètres et modèles de suivi des fermentations
    SUIVI_PARAMS().forEach((p) => { if (!out.analysesParams.some((x) => x.id === p.id)) out.analysesParams.push(p); });
    SUIVI_MODELES().forEach((m) => { if (!out.analysesModeles.some((x) => x.id === m.id)) out.analysesModeles.push(m); });
    if (!(out.lists.stades.find((x) => x.id === 'fin_fml') || {}).role && !out.lists.stades.some((x) => x.role === 'finfml')) { const f = out.lists.stades.find((x) => x.id === 'fin_fml'); if (f) f.role = 'finfml'; }
    out.settings.suiviV3 = true;
  }
  out.ops = out.ops.map((o) => (o.type === 'etape' && o.newType && !o.newStade ? { ...o, newStade: stadeFromType(o.newType) } : o));
  // 0.9.0-alpha.1 : nouveaux stades par défaut (vin soutiré, collé, filtré, sur pointes) insérés à leur place ; règles de mélange ; catalogue d'opérations
  if (!out.settings.stadesV9) {
    const D = DEFAULT_STADES(); D.forEach((x, i) => { if (out.lists.stades.some((y) => y.id === x.id)) return; let pos = -1; for (let j = i - 1; j >= 0 && pos < 0; j -= 1) pos = out.lists.stades.findIndex((y) => y.id === D[j].id); out.lists.stades.splice(pos + 1, 0, { phase: 'vin', role: '', ...x }); });
    if (!Array.isArray(dlists.stadesMelanges)) out.lists.stadesMelanges = DEFAULT_STADES_MELANGES();
    out.settings.stadesV9 = true;
  }
  if (!Array.isArray(out.lists.stadesMelanges)) out.lists.stadesMelanges = DEFAULT_STADES_MELANGES();
  { const D = DEFAULT_OPERATIONS(); const cur = Array.isArray(dlists.operations) ? dlists.operations.filter((x) => x && x.id).map((x) => ({ ...x })) : [];
    D.forEach((x, i) => { if (cur.some((y) => y.id === x.id)) return; let pos = -1; for (let j = i - 1; j >= 0 && pos < 0; j -= 1) pos = cur.findIndex((y) => y.id === D[j].id); cur.splice(pos + 1, 0, { ...x }); });
    // opérations d'origine : les réglages de l'utilisateur priment, les nouveaux champs par défaut complètent ; comportement toujours d'origine
    out.lists.operations = cur.map((y) => { const x = D.find((z) => z.id === y.id); return x ? { ...x, ...y, base: x.base } : (y.base ? y : { ...y, base: 'suivi' }); });
    // libellé d'origine renommé (0.25.0-alpha.2) : « Apport vendange » → « Pesée de vendange » (un libellé choisi par l'utilisateur est gardé)
    out.lists.operations.forEach((y) => { if (y.id === 'apport' && y.label === 'Apport vendange') y.label = 'Pesée de vendange'; }); }
  // compatibilité entre versions : les champs inconnus (créés par une version plus récente) sont conservés tels quels,
  // le marqueur de schéma ne redescend jamais, et la base garde la trace des versions qui l'ont ouverte
  out.app = APP_ID; out.schema = Math.max(SCHEMA, num(d.schema));
  const dm = d.meta || {}; const vs = Array.isArray(dm.versions) ? dm.versions.filter((x) => typeof x === 'string') : [];
  out.meta = { ...out.meta, creeAvec: dm.creeAvec || (old ? 'Cuverie champenoise' : vs[0] || '0.7.0-alpha.1 ou antérieure'), appVersion: APP_VERSION, versions: vs.includes(APP_VERSION) ? vs : [...vs, APP_VERSION].slice(-30) };
  syncConfig(out);
  return out;
}

/* ---------- persistance locale ---------- */
// 0.38.0-alpha.1 : la base est lue dans le coffre de l'appareil (33d-coffre.js : déchiffrée au démarrage, en clair en mémoire seulement) ;
// données écrites à côté par une version antérieure (enveloppe lue comme une base vide) : réunies sans base commune, rien n'est perdu
// 0.38.0-alpha.3 : la base de l'appareil l'emporte sur ces données (valeurs par défaut de la version antérieure), et chaque version
// écartée va au journal des conflits (reprenable) ; base présente mais illisible : jamais remplacée par l'exemple (voir loadDbIllisible)
const LOAD_SANS_NULS = (o) => { if (o && typeof o === 'object' && !Array.isArray(o)) Object.keys(o).forEach((k) => { if (Array.isArray(o[k]) && o[k].some((x) => x == null)) o[k] = o[k].filter((x) => x != null); }); return o; };
let _loadIllisible = false; // base présente mais illisible : la sauvegarde automatique est suspendue (rien n'est écrasé)
const loadDbIllisible = () => _loadIllisible;
const loadDbDebloquer = () => { _loadIllisible = false; }; // base remplacée volontairement (sauvegarde restaurée)
function loadDb() {
  let raw = null;
  try {
    raw = coffreLire(STORAGE_KEY);
    if (raw) {
      const j = JSON.parse(raw); let db; try { db = normalizeDb(j); } catch (e) { db = normalizeDb(LOAD_SANS_NULS(j)); } // élément vide (null) dans une collection
      const anc = _coffre.ancien;
      if (anc) {
        try {
          const fu = syncFusion(null, db, normalizeDb(LOAD_SANS_NULS(clone(anc))), { gagnant: 'appareil' }); const nd = normalizeDb(fu.db);
          if (fu.conflits.length) nd.meta.syncConflits = syncConflitsGarder([...fu.conflits.map((c) => ({ ...c, date: new Date().toISOString(), fichier: 'version antérieure sur cet appareil' })), ...((db.meta && db.meta.syncConflits) || [])]);
          _coffre.ancien = null; return { db: nd, fromStorage: true, reunie: true };
        } catch (e) { /* base chiffrée seule */ }
      }
      return { db, fromStorage: true };
    }
  } catch (e) { if (raw) { _loadIllisible = true; return { db: null, fromStorage: false, illisible: true }; } /* stockage indisponible */ }
  for (const k of OLD_STORAGE_KEYS) { // première ouverture d'Œnotrack : reprise automatique des données de « Cuverie champenoise »
    try { const raw = window.localStorage.getItem(k); if (raw) { const db = normalizeDb(JSON.parse(raw)); return { db, fromStorage: true, migrated: true }; } } catch (e) { /* ignoré */ }
  }
  return { db: null, fromStorage: false };
}
function saveDb(db) {
  if (_loadIllisible || ongletBloque()) return false; // base de l'appareil illisible : gardée telle quelle (voir loadDb) ; autre onglet actif (33e)
  try { return coffreEcrire(STORAGE_KEY, JSON.stringify(db)); } catch (e) { return false; }
}
function exportJSON(db) { return JSON.stringify(db, null, 2); }
function importJSON(text) {
  let d; try { d = JSON.parse(text); } catch (e) { throw new Error('Fichier illisible : ce n’est pas un JSON valide.'); }
  return importObj(d);
}
// Toute base Œnotrack (ou « Cuverie champenoise ») de n'importe quelle version : migrée vers la version courante, sans rien perdre
function importObj(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.ops) || !Array.isArray(d.lots) || !Array.isArray(d.contenants)) throw new Error('Ce fichier ne ressemble pas à une sauvegarde Œnotrack (opérations, lots ou contenants manquants).');
  if (d.app && d.app !== APP_ID && d.app !== 'cuverie-champenoise') throw new Error('Ce fichier provient d’une autre application.');
  return normalizeDb(d);
}

/* ---------- unicité & usages ---------- */
const nameTaken = (arr, nom, selfId, key = 'nom') => arr.some((x) => x.id !== selfId && norm(x[key]).trim() === norm(nom).trim());
function listUsage(db, key, id) {
  switch (key) {
    case 'cepages': return db.ops.filter((o) => o.cepageId === id || (o.entrees || []).some((x) => x.cepageId === id)).length + db.lots.filter((l) => l.origine && l.origine.cepages && l.origine.cepages[id] != null).length;
    case 'matieres': return db.contenants.filter((c) => c.matiere === id).length;
    case 'typesContenant': return db.contenants.filter((c) => c.type === id).length;
    case 'typesPerte': return db.ops.filter((o) => (o.pertes || []).some((p) => p.typeId === id) || o.typeId === id).length;
    case 'methodesFiltration': return db.ops.filter((o) => o.methodeId === id).length;
    case 'equipements': return db.ops.filter((o) => (o.equipementIds || []).includes(id) || o.equipementId === id).length + db.hygiene.filter((h) => h.cibleType === 'equipement' && h.cibleId === id).length;
    case 'actionsHygiene': return db.hygiene.filter((h) => h.actionId === id).length + (db.planNettoyage || []).filter((x) => x && x.actionId === id).length;
    case 'locaux': return db.hygiene.filter((h) => h.cibleType === 'local' && h.cibleId === id).length + (db.planNettoyage || []).filter((x) => x && x.cible && x.cible.type === 'locaux' && (x.cible.ids || []).includes(id)).length;
    case 'fractions': return db.ops.filter((o) => o.fractionId === id || (o.fractions || []).some((f) => f.fractionId === id) || (o.type === 'entree_mout' && (o.entrees || []).some((e) => e.fractionId === id))).length + db.lots.filter((l) => l.fractionId === id && !db.ops.some((o) => o.id === l.opId)).length;
    case 'stades': return db.lots.filter((l) => l.stade === id).length + db.ops.filter((o) => o.stade === id || o.newStade === id).length + opList(db).filter((x) => x.stadeAuto && x.stadeAuto.actif && x.stadeAuto.stade === id).length;
    case 'couleursVin': return db.lots.filter((l) => l.couleur === id).length + db.ops.filter((o) => o.couleur === id || (o.entrees || []).some((e) => e.couleur === id)).length + (db.lotsFinis || []).filter((l) => l.couleur === id).length;
    case 'echelles': return db.crus.filter((c) => c.echelle === id).length + db.lots.filter((l) => l.origine && l.origine.echelle === id).length + db.ops.filter((o) => o.lotSpec && o.lotSpec.echelle === id).length;
    case 'qualifs': return qualifUsage(db, id);
    default: return 0;
  }
}

/* ---------- entités créées/mises à jour par une opération ---------- */
function upsert(arr, item) { const i = arr.findIndex((x) => x.id === item.id); if (i >= 0) arr[i] = { ...arr[i], ...item }; else arr.push(item); }

function assignIds(db, op, old) {
  const keep = (k, p) => { op[k] = (old && old[k]) || nid(db, p); };
  switch (op.type) {
    case 'pressurage':
      keep('parentLotId', 'lot');
      op.fractions = (op.fractions || []).map((f) => { const of = old && (old.fractions || []).find((x) => x.fractionId === f.fractionId); return { ...f, lotId: (of && of.lotId) || nid(db, 'lot'), portionId: (of && of.portionId) || nid(db, 'por') }; });
      break;
    case 'debourbage': case 'soutirage': case 'transfert': keep('outPortionId', 'por'); break;
    case 'assemblage': keep('lotId', 'lot'); keep('outPortionId', 'por'); break;
    case 'tirage': keep('lotId', 'lot'); break;
    case 'preparation': keep('prepId', 'prep'); break;
    case 'degorgement': keep('lotFiniId', 'fini'); break;
    case 'reprise': keep('lotId', 'lot'); if (op.contenantId) keep('portionId', 'por'); break;
    case 'entree_mout': op.lots = (op.lots || []).map((l) => { const ol = old && (old.lots || []).find((x) => x.contenantId === l.contenantId); return { ...l, lotId: (ol && ol.lotId) || nid(db, 'lot'), portionId: (ol && ol.portionId) || nid(db, 'por') }; }); break;
    default: break;
  }
}

function syncEntities(db, op) {
  const Rd = replay(db, op.date);
  const lq = (id) => (Rd.lots[id] || lotById(db, id) || {}).qualif || 'conv';
  if (op.type === 'pressurage') {
    const ps = op.parentSpec || {};
    const apports = (op.charges || []).map((c) => { const a = db.ops.find((o) => o.id === c.apportId); return a ? { apportId: a.id, cepageId: a.cepageId, kg: num(c.kg), qualifId: a.qualifId, cruId: a.cruId || '', apporteurId: a.apporteurId || '', parcelleId: a.parcelleId || '' } : null; }).filter(Boolean);
    const vin = { stade: op.stade || stadeRole(db, 'entree') || 'mout', couleur: op.couleur || couleurDefaut(db) };
    upsert(db.lots, { id: op.parentLotId, code: ps.code, designation: ps.designation, millesime: ps.millesime, type: 'pressee', qualif: ps.qualifId, parentIds: [], sources: [], apports, opId: op.id, date: op.date, ...vin, ...(ps.codif ? { codif: ps.codif } : {}) });
    (op.fractions || []).forEach((f) => upsert(db.lots, { id: f.lotId, code: f.code, designation: `${ps.designation || ps.code} – ${fracLabel(db, f.fractionId)}`, millesime: ps.millesime, type: 'fraction', qualif: ps.qualifId, parentIds: [op.parentLotId], sources: [], fractionId: f.fractionId, opId: op.id, date: op.date, ...vin, ...(f.codif ? { codif: f.codif } : {}) }));
  }
  if (op.type === 'assemblage' || op.type === 'tirage') {
    const sp = op.lotSpec || {}; const srcs = (op.sources || []);
    const prepQ = (op.prepUses || []).map((u) => (Rd.preps[u.prepId] || {}).qualif).filter(Boolean);
    const qs = [...srcs.map((s) => lq(s.lotId)), ...(op.type === 'tirage' ? prepQ : [])];
    const q = qs.length ? minQualif(qs) : 'conv';
    const agg = {}; srcs.forEach((s) => { agg[s.lotId] = (agg[s.lotId] || 0) + num(s.volL); });
    const type = op.type === 'tirage' ? 'cuvee_tirage' : (sp.type || 'assemblage');
    const srcL = Object.keys(agg).map((k) => Rd.lots[k] || lotById(db, k) || {});
    const stade = op.stade || (op.type === 'tirage' ? stadeRole(db, 'tirage') : stadeAssemblage(db, srcL.map((l) => l.stade))) || 'assemble';
    upsert(db.lots, { id: op.lotId, code: sp.code, designation: sp.designation, millesime: sp.millesime, type, qualif: q, parentIds: Object.keys(agg), sources: Object.keys(agg).map((k) => ({ lotId: k, volL: r2(agg[k]) })), opId: op.id, date: op.date, stade, couleur: op.couleur || mixCouleur(db, srcL.map((l) => l.couleur)) || couleurDefaut(db), ...(sp.codif ? { codif: sp.codif } : {}) });
  }
  if (op.type === 'reprise') {
    const sp = op.lotSpec || {};
    const stade = op.stade || (num(op.nbBouteilles) > 0 ? stadeRole(db, 'tirage') : stadeRole(db, 'clair')) || stadeFromType(sp.type);
    upsert(db.lots, { id: op.lotId, code: sp.code, designation: sp.designation, millesime: sp.millesime, type: sp.type || 'vin_clair', qualif: sp.qualifId || 'conv', parentIds: [], sources: [], origine: { cepages: sp.cepages || {}, crus: sp.crus || {}, echelle: sp.echelle || '', ...(op.apporteurId ? { apporteurs: { [op.apporteurId]: 1 } } : {}) }, opId: op.id, date: op.date, reprise: true, ...(sp.codif ? { codif: sp.codif } : {}), ...(sp.codeFournisseur ? { codeFournisseur: sp.codeFournisseur } : {}), stade, couleur: op.couleur || couleurDefaut(db) });
  }
  if (op.type === 'entree_mout') { // un lot « Moût » par cuve : mélange (au prorata des volumes) des moûts qui y sont versés
    const add = (m, k, v) => { m[k] = (m[k] || 0) + v; }; const keep = [];
    moutLots(op).forEach((l) => {
      const cep = {}, cru = {}, app = {}, fra = {}, qua = {}, mil = {}, par = {};
      l.parts.forEach((p) => { add(par, p.e.parcelleId || '?', p.vol); add(mil, String(p.e.millesime || op.millesime || yearOf(op.date)), p.vol); add(cep, p.e.cepageId, p.vol); add(cru, p.e.cruId || '?', p.vol);  add(fra, p.e.fractionId || '?', p.vol); add(qua, p.e.qualifId || 'conv', p.vol); });
      Object.assign(app, moutApporteursLot(op, l));
      const fr = Object.keys(fra).filter((k) => k !== '?');
      upsert(db.lots, { id: l.lotId, code: l.code, designation: l.designation || l.code, millesime: Object.keys(mil).sort().join(' + '), type: 'mout', qualif: minQualif(l.qualifs), parentIds: [], sources: [], origine: { cepages: cep, crus: cru, apporteurs: app, fractions: fra, qualifs: qua, millesimes: mil, parcelles: par }, fractionId: fr.length === 1 ? fr[0] : '', contenantId: l.contenantId, opId: op.id, date: op.date, mout: true,
        stade: op.stade || stadeRole(db, 'entree') || 'mout', couleur: mixCouleur(db, l.parts.map((p) => p.e.couleur || op.couleur || couleurDefaut(db))) || couleurDefaut(db) });
      { const lc = (op.lots || []).find((x) => x.lotId === l.lotId); const lo = db.lots.find((x) => x.id === l.lotId); if (lo && lc && lc.codif) lo.codif = lc.codif; } // codification (0.41.0-alpha.1)
      keep.push(l.lotId);
    });
    db.lots = db.lots.filter((x) => !(x.opId === op.id && x.type === 'mout' && !keep.includes(x.id))); // cuve retirée de l'entrée : son lot disparaît
  }
  if (op.type === 'etape') codifEtapeAppliquer(db, op); // nouveau code au changement de stade (0.41.0-alpha.1)
  if (op.type === 'degorgement') {
    const sp = op.lotFiniSpec || {};
    const prepQ = (op.prepUses || []).map((u) => (Rd.preps[u.prepId] || {}).qualif).filter(Boolean);
    const q = minQualif([lq(op.sourceLotId), ...prepQ]);
    if (!db.lotsFinis) db.lotsFinis = [];
    upsert(db.lotsFinis, { id: op.lotFiniId, code: sp.code, designation: sp.designation, sourceLotId: op.sourceLotId, date: op.date, nb: num(op.nb), qualif: q, dosageGL: sp.dosageGL, prepIds: (op.prepUses || []).map((u) => u.prepId), opId: op.id, couleur: (Rd.lots[op.sourceLotId] || {}).couleur || couleurDefaut(db), stade: stadeRole(db, 'degorgement') || 'degorge', ...(sp.codif ? { codif: sp.codif } : {}) });
  }
}

/* ---------- alertes de déclassement ---------- */
const proposedQualif = (db, produitId, from) => { for (let r = rang(from) - 1; r >= 1; r--) { const q = QUALIFS.find((x) => x.rang === r); if (ruleAllows(db, produitId, q.id)) return q.id; } return 'conv'; };
const alKey = (a) => `${a.produitId || 'prep:' + a.prepId}|${a.lotId}`;
function refreshAlerts(db, op) {
  const R = replay(db);
  const wanted = R.apps.filter((a) => a.opId === op.id && a.unauth && a.lotId);
  const wk = new Set(wanted.map(alKey));
  db.alertes = db.alertes.filter((al) => !(al.opId === op.id && al.statut === 'attente' && !wk.has(alKey(al))));
  wanted.forEach((a) => {
    if (db.alertes.some((al) => al.opId === op.id && alKey(al) === alKey(a))) return;
    const lot = R.lots[a.lotId]; const from = a.qualif || (lot && lot.qualif) || 'conv';
    const isPrep = a.kind === 'prep';
    const to = isPrep ? a.prepQualif : proposedQualif(db, a.produitId, from);
    if (rang(to) >= rang(from)) return;
    const pr = db.produits.find((p) => p.id === a.produitId); const prep = R.preps[a.prepId];
    db.alertes.push({ id: nid(db, 'al'), opId: op.id, date: op.date, lotId: a.lotId, contenantId: a.contenantId || null, produitId: a.produitId || null, prepId: isPrep ? a.prepId : null, kind: isPrep ? 'prep' : 'intrant', from, to, statut: 'attente', motif: isPrep ? `Préparation ${prep ? prep.code : ''} (${qLabel(to)}) ajoutée à un lot ${qLabel(from)}` : `${pr ? pr.nom : 'Intrant'} non autorisé en ${qLabel(from)}` });
  });
}
function propagate(db, lotId) {
  const R = replay(db);
  childrenOf(db, lotId).forEach((ch) => {
    const cur = R.lots[ch.id]; if (!cur) return;
    const srcQ = (ch.parentIds || []).map((p) => (R.lots[p] || {}).qualif).filter(Boolean);
    if (!srcQ.length) return; const exp = minQualif(srcQ);
    if (rang(cur.qualif) > rang(exp) && !db.alertes.some((a) => a.lotId === ch.id && a.kind === 'propagation' && a.statut === 'attente' && a.to === exp)) {
      db.alertes.push({ id: nid(db, 'al'), opId: ch.opId, date: todayISO(), lotId: ch.id, produitId: null, prepId: null, kind: 'propagation', from: cur.qualif, to: exp, statut: 'attente', motif: `Un lot d’origine (${(R.lots[lotId] || {}).code}) a été déclassé en ${qLabel(R.lots[lotId].qualif)}` });
    }
  });
}
function alertValidate(db, id, date, operateurs) {
  const a = db.alertes.find((x) => x.id === id); if (!a || a.statut !== 'attente') return fail('Alerte introuvable ou déjà traitée.');
  const par = operateursValides(db, operateurs); if (!par.length && (db.settings || {}).operateurObligatoire) return fail('Indiquez qui valide le déclassement (opérateur).');
  const d = date || todayISO(); const c = campOf(db, d);
  if (!c) return fail('Aucune campagne ne couvre la date de validation.');
  if (c.figee) return fail(`La campagne ${c.nom} est figée : rouvrez-la ou choisissez une autre date.`);
  const cur = (replay(db).lots[a.lotId] || {}).qualif;
  if (par.length) a.decidePar = par; else delete a.decidePar;
  if (cur && rang(cur) <= rang(a.to)) { a.statut = 'valide'; a.decidedOn = d; a.dejaFait = true; return okr(); }
  const op = { id: nid(db, 'op'), seq: ++db.meta.opSeq, type: 'declassement', date: d, lotId: a.lotId, qualifId: a.to, alerteId: a.id, notes: a.motif, av: APP_NUM, ...(par.length ? { operateurs: par } : {}) };
  db.ops.push(op); a.statut = 'valide'; a.decidedOn = d; a.decisionOpId = op.id;
  propagate(db, a.lotId);
  return okr();
}
function alertRefuse(db, id, operateurs) {
  const a = db.alertes.find((x) => x.id === id); if (!a || a.statut !== 'attente') return fail('Alerte introuvable ou déjà traitée.');
  const par = operateursValides(db, operateurs); if (!par.length && (db.settings || {}).operateurObligatoire) return fail('Indiquez qui refuse le déclassement (opérateur).');
  if (par.length) a.decidePar = par; else delete a.decidePar;
  a.statut = 'refuse'; a.decidedOn = todayISO(); return okr();
}

/* ---------- enregistrer / supprimer une opération ---------- */
// opts (0.24.0-alpha.1, pesées et marcs du registre du pressoir) : { motif (correction d'une saisie validée), par (utilisateur),
//   maintenant (heure de saisie, ISO), apercu (aperçu du formulaire : pas de motif exigé) }
function opSave(db, spec, editingId, opts) {
  const old = editingId ? db.ops.find((o) => o.id === editingId) : null;
  if (!isoOK(spec.date)) return fail('Date invalide.');
  const camp = campOf(db, spec.date);
  if (!camp) return fail('Aucune campagne ne couvre cette date. Créez-la dans Paramètres › Campagnes.');
  if (camp.figee) return fail(`La campagne ${camp.nom} est figée : rouvrez-la pour enregistrer ou modifier une opération à cette date.`);
  if (old && isLocked(db, old.date)) return fail('Cette opération appartient à une campagne figée.');
  // compatibilité : une opération créée par une version plus récente garde ses champs inconnus ; le n° de fiche est conservé
  // « av » = la version la plus récente dont l'opération porte des données : réécrite ici, elle garde ce marqueur pour que les champs
  // d'une version plus récente survivent aussi aux modifications suivantes (0.14.0-alpha.1)
  const neuf = old && num(old.av) > APP_NUM;
  // qui a saisi (et corrigé) l'opération : gardé quand on la modifie (la garde des droits ajoute « corrigée par »)
  // saisie groupée (0.29.0-alpha.1) : une opération corrigée seule reste dans son groupe
  const marques = {}; if (old) ['saisiPar', 'saisiLe', 'modifiePar', 'modifieLe', 'groupe', 'depassement', 'schema'].forEach((k) => { if (old[k] !== undefined && spec[k] === undefined) marques[k] = old[k]; });
  const op = { ...(neuf ? old : {}), ...marques, ...spec, ...(old && old.ficheOrdre ? { ficheOrdre: old.ficheOrdre } : {}), id: old ? old.id : nid(db, 'op'), seq: old ? old.seq : ++db.meta.opSeq, av: neuf ? num(old.av) : APP_NUM };
  // registre des pesées et carnet de pressoir : n° continu, données gardées, motif exigé pour corriger une saisie validée (journal)
  const rg = registreAvantEnregistrer(db, old, op, opts); if (!rg.ok) return rg;
  if (op.type === 'entree_mout') { const ex = entreesExtraDe(op.entrees); if (ex) op.entreesExtra = ex; else if (!neuf) delete op.entreesExtra; }
  assignIds(db, op, old);
  if (old) db.ops[db.ops.indexOf(old)] = op; else db.ops.push(op);
  syncEntities(db, op);
  refreshAlerts(db, op);
  return okr({ op });
}
// opts (0.24.0-alpha.1) : { motif, par } — annulation d'une pesée ou d'un marc validé (gardée au journal du pressoir)
function opDelete(db, id, opts) {
  const op = db.ops.find((o) => o.id === id); if (!op) return fail('Opération introuvable.');
  if (isLocked(db, op.date)) return fail('Opération verrouillée : la campagne est figée.');
  const dep = dependentsOf(db, op);
  if (dep.length) return fail(`Suppression impossible : ${dep.length} opération(s) en dépendent (${dep.slice(0, 3).map((o) => `${opNom(o)} du ${fmtDate(o.date)}`).join(', ')}${dep.length > 3 ? '…' : ''}). Supprimez-les d’abord.`);
  if (op.type !== 'declassement' && db.alertes.some((a) => a.opId === op.id && a.statut === 'valide' && a.decisionOpId)) return fail('Un déclassement validé dépend de cette opération : supprimez d’abord l’opération « Déclassement validé » correspondante.');
  const rg = registreAvantSupprimer(db, op, opts); if (!rg.ok) return rg;
  const made = opCreates(op);
  const hab = (db.habillages || []).filter((h) => h && h.source && h.source.type === 'fini' && made.finis.includes(h.source.id)); // habillages du lot fini (0.41.0-alpha.1)
  if (hab.length) return fail(`Suppression impossible : ${hab.length} habillage(s) en dépendent (${hab.slice(0, 3).map((h) => h.code).join(', ')}). Supprimez-les d’abord.`);
  if (op.type === 'etape') codifEtapeAnnuler(db, op);
  db.ops = db.ops.filter((o) => o.id !== id);
  // l'opération réalisait une opération à réaliser : celle-ci revient « à réaliser » et récupère les documents joints
  const prevs = (db.previsions || []).filter((p) => p.opId === id); prevs.forEach((p) => { p.statut = 'prevue'; p.opId = null; delete p.realiseLe; });
  if (prevs.length) docsDeplacer(db, { type: 'op', id }, { type: 'prev', id: prevs[0].id });
  else db.docs = (db.docs || []).filter((x) => !(x.cible && x.cible.type === 'op' && x.cible.id === id));
  db.lots = db.lots.filter((l) => !made.lots.includes(l.id));
  db.lotsFinis = (db.lotsFinis || []).filter((f) => !made.finis.includes(f.id));
  if (op.type === 'declassement') { const a = db.alertes.find((x) => x.id === op.alerteId); if (a) { a.statut = 'attente'; delete a.decidedOn; delete a.decisionOpId; } }
  db.alertes = db.alertes.filter((a) => !(a.opId === id));
  return okr();
}
function opToggleVerified(db, id) { const o = db.ops.find((x) => x.id === id); if (o) o.verifie = !o.verifie; return okr(); }

/* ---------- aperçu sans enregistrer (avertissements, alertes, qualification résultante) ---------- */
function previewOp(db, spec, editingId) {
  const d = clone(db);
  const r = opSave(d, spec, editingId, { apercu: true });
  if (!r.ok) return { ok: false, msg: r.msg, warnings: [], alerts: [], lot: null };
  const R = replay(d, null, typeof hygEvenementsUtiles === 'function' && hygEvenementsUtiles(d) ? { evenements: true } : undefined); // événements : contrôles des plans d'hygiène à la saisie (0.26.0-alpha.1)
  const before = new Set(db.alertes.map((a) => a.id));
  // dépassements (0.30.0-alpha.1) : dose, dose cumulée, SO₂ total estimé des lots que l'opération sulfite au-delà du plafond de leur revendication
  const depassements = [...(R.depass[r.op.id] || [])]; const just = !!(r.op.depassement && r.op.depassement.motif);
  Object.keys(R.so2Ev || {}).filter((k) => R.so2Ev[k].some((x) => x.opId === r.op.id)).forEach((lotId) => { const e = so2TotalEstime(d, R, lotId);
    if (e.depasse) depassements.push({ type: 'so2t', opId: r.op.id, lotId, valeur: e.estime, max: e.plafond.valeur, unite: 'mg/L', qualif: (R.lots[lotId] || {}).qualif, aVerifier: !!e.plafond.aVerifier, justifie: just, estimation: e }); });
  return { ok: true, op: r.op, warnings: R.warn[r.op.id] || [], alerts: d.alertes.filter((a) => a.opId === r.op.id && a.statut === 'attente' && !before.has(a.id)), lot: r.op.lotId ? (R.lots[r.op.lotId] || null) : null, R, depassements };
}

/* ---------- campagnes ---------- */
function campCreate(db, nom, debut, fin) {
  if (!nom.trim()) return fail('Nom de campagne requis.');
  if (nameTaken(db.campagnes, nom, null, 'nom')) return fail('Une campagne porte déjà ce nom.');
  if (!isoOK(debut) || !isoOK(fin) || fin < debut) return fail('Dates de campagne invalides.');
  if (db.campagnes.some((c) => debut <= c.fin && fin >= c.debut)) return fail('Les dates chevauchent une campagne existante.');
  // campagne antérieure (0.34.0-alpha.1) : avant toutes les campagnes existantes, elle démarre vide (aucun lot ni volume en cuve) — voir campEtatR
  const anterieure = db.campagnes.length > 0 && db.campagnes.every((c) => fin < c.debut);
  db.campagnes.push({ id: nom.trim(), nom: nom.trim(), debut, fin, figee: false, snapshot: null, ouverture: null, ...(anterieure ? { anterieure: true } : {}) });
  db.campagnes.sort((a, b) => (a.debut < b.debut ? -1 : 1)); return okr({ anterieure });
}
/* état affiché pour la campagne active (0.34.0-alpha.1) : une campagne antérieure montre l'état rejoué jusqu'à sa fin — seules ses propres
   opérations (et celles d'avant) comptent, jamais les lots et volumes des campagnes suivantes ; les autres campagnes : état complet, comme avant.
   Rien n'est stocké : les opérations saisies dans la campagne antérieure se répercutent ensuite normalement dans les suivantes. */
const campEtatDate = (c) => (c && c.anterieure && isoOK(c.fin) ? c.fin : undefined);
const campEtatR = (db, c) => getR(db, campEtatDate(c));
function campFreeze(db, id) {
  const c = db.campagnes.find((x) => x.id === id); if (!c) return fail('Campagne introuvable.');
  c.ouverture = snapshotAt(db, addDays(c.debut, -1), { repriseOn: c.debut }); // stocks d'ouverture (reprises de stock du 1er jour incluses)
  c.snapshot = snapshotAt(db, c.fin);                  // stocks de clôture = ouverture de la suivante
  c.figee = true; c.figeLe = todayISO(); return okr();
}
function campReopen(db, id) {
  const c = db.campagnes.find((x) => x.id === id); if (!c) return fail('Campagne introuvable.');
  const later = db.campagnes.find((x) => x.debut > c.debut && x.figee);
  if (later) return fail(`Réouverture impossible : la campagne ${later.nom}, postérieure, est figée. Rouvrez-la d’abord.`);
  c.figee = false; c.snapshot = null; c.ouverture = null; delete c.figeLe; return okr();
}
