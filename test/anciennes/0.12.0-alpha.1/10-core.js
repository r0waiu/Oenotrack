/* ============ CONSTANTES & OUTILS ============ */
const { useState, useEffect, useMemo, useRef, useCallback, useContext, createContext, Fragment } = React;

const APP_NAME = 'Œnotrack';
const APP_ID = 'oenotrack';
// Version affichée en pied de page : +0.1 à chaque nouvelle version publiée (et une ligne dans le journal ci-dessous)
const APP_VERSION = 'alpha V1.2';
const CHANGELOG = [
  { v: 'alpha V1.2', date: '2026-11-18', notes: ['Opérateurs : liste des personnes de la société (salariés, saisonniers, apprentis, prestataires, œnologue) dans Registres & Paramètres › Société & opérateurs ; un opérateur qui a servi est archivé, jamais supprimé', 'Chaque opération indique qui l’a réalisée (une ou plusieurs personnes), proposée d’office selon l’appareil (« 👤 Qui saisit ? ») ; aussi dans le journal d’hygiène, les décisions de déclassement et les opérations à réaliser (qui doit la faire)', 'Journal filtrable par opérateur, fiche de chaque opérateur avec toute son activité et export, registres « Activité des opérateurs » et « Opérateurs », colonne Opérateur(s) dans les registres, rapports et fiches imprimées ; réglage « opérateur obligatoire »'] },
  { v: 'alpha V1.1', date: '2026-11-18', notes: ['Stockage sur votre Drive : Œnotrack en ligne se connecte à Google Drive, OneDrive ou Dropbox (ou à un dossier de l’ordinateur) et y enregistre automatiquement toutes ses données', 'Plusieurs appareils et plusieurs personnes sur le même dossier partagé : saisies réunies, conflits gardés au journal, copie quotidienne dans historique/', 'Hors réseau : les saisies restent sur l’appareil et partent au retour de la connexion', 'Paquet de mise en ligne (Netlify) et guides pour déclarer Œnotrack chez Google, Microsoft et Dropbox'] },
  { v: 'alpha V1.0', date: '2026-11-18', notes: ['Synchronisation avec votre Drive par glisser-déposer : déposez (ou collez) le fichier Œnotrack du Drive n’importe où, Œnotrack réunit les modifications faites ici et sur les autres appareils', 'Mise à jour automatique du fichier relié quand le navigateur le permet (Chrome, Edge sur ordinateur) ; sinon « Envoyer vers le Drive »', 'Conflits : la modification la plus récente est gardée, l’autre reste au journal et peut être reprise', 'Google Drive, OneDrive, Dropbox, iCloud Drive, kDrive, pCloud ; nom de chaque appareil ; identifiants propres à chaque appareil'] },
  { v: 'alpha V0.9', date: '2026-11-18', notes: ['Volumes des vins et des contenants en hectolitres (hL, 2 décimales)', 'Catalogue d’opérations personnalisable : 49 opérations (levurage, sulfitage, collage, suivi de fermentation, réchauffage, bâtonnage, mise en fût, remuage, regroupement de cuves, ventes en vrac, distillerie…), création d’opérations avec leur fiche', 'Changement de stade automatique réglable par opération (soutirage → vin soutiré, filtration → vin filtré…)', 'Nouveaux stades (vin soutiré, collé, filtré, sur pointes) et règles de mélange des stades personnalisables', 'Sorties de cave (bilan matière, registre), suivi des cuves (densité, température)'] },
  { v: 'alpha V0.8', date: '2026-11-18', notes: ['Parcelles reliées aux crus (apports, entrées de moûts, composition, traçabilité)', 'Sauvegarde complète en un seul fichier (base + documents joints + logo), guide Google Drive / OneDrive / Dropbox / iCloud et sauvegarde en ligne, regroupés dans Registres & Paramètres', 'Cartouche des fiches (version, création, modification) modifiable', 'Compatibilité : toute base ou sauvegarde d’une version précédente s’ouvre dans les versions suivantes'] },
  { v: 'alpha V0.7', date: '2026-11-18', notes: ['Stades et couleurs du vin personnalisables, intégrés aux opérations', 'Classement des crus personnalisable (préréglages par région)', 'Les 9 thèmes en clair et en sombre'] },
  { v: 'alpha V0.6', date: '2026-11-17', notes: ['Impression en PDF, plan de cave imprimable', 'Opérations à réaliser ou à valider depuis n’importe quel formulaire'] },
  { v: 'alpha V0.5', date: '2026-11-17', notes: ['Chartes graphiques, fiches d’enregistrement imprimables, documents joints, logo'] },
  { v: 'alpha V0.4', date: '2026-11-17', notes: ['Entrées de moûts par compartiment, fractions, millésime par moût, saisie semi-automatique'] },
  { v: 'alpha V0.3', date: '2026-11-16', notes: ['Crus (villages), apporteurs, échelle des crus'] },
  { v: 'alpha V0.2', date: '2026-11-16', notes: ['Œnotrack : sites, plan de cave modifiable, contenants personnalisés, traçabilité des intrants, rapports'] },
  { v: 'alpha V0.1', date: '2026-11-13', notes: ['Première version (« Cuverie champenoise »)'] },
];
const STORAGE_KEY = 'oenotrack-db-v2';
const OLD_STORAGE_KEYS = ['cuverie-champenoise-db-v1']; // anciennes versions (migration automatique à la 1re ouverture)
const SCHEMA = 2;
// numéro de version croissant (alpha V0.9 → 9, V1.0 → 1000) : une opération écrite par une version plus récente garde ses champs inconnus
const APP_NUM = (() => { const m = /(\d+)\.(\d+)/.exec(APP_VERSION); return m ? Number(m[1]) * 1000 + Number(m[2]) : 0; })();

const QUALIFS = [
  { id: 'conv', code: 'Conventionnel', court: 'CONV', rang: 1 },
  { id: 'bio', code: 'FR-BIO-01', court: 'BIO', rang: 2 },
  { id: 'dem', code: 'Demeter', court: 'DEM', rang: 3 },
];
const qDef = (id) => QUALIFS.find((q) => q.id === id) || QUALIFS[0];
const rang = (id) => qDef(id).rang;
const qLabel = (id) => qDef(id).code;
const minQualif = (ids) => ids.length ? ids.reduce((m, id) => (rang(id) < rang(m) ? id : m), ids[0]) : 'conv';

/* Échelle des crus (villages) : un assemblage prend le rang le plus bas des crus qui le composent (Grand Cru + 1er Cru → 1er Cru). */
const ECHELLES = [
  { id: 'autre', label: 'Autres', un: 'Autre cru', court: 'AUT', rang: 1 },
  { id: 'premier', label: '1ers Crus', un: '1er Cru', court: '1ER', rang: 2 },
  { id: 'grand', label: 'Grands Crus', un: 'Grand Cru', court: 'GC', rang: 3 },
];
const eDef = (id) => ECHELLES.find((e) => e.id === id) || null;
const eRang = (id) => (eDef(id) || { rang: 0 }).rang;
const eLabel = (id) => (eDef(id) ? eDef(id).un : 'Non renseigné');
const minEchelle = (ids) => { const k = ids.filter((i) => eDef(i)); return k.length ? k.reduce((m, i) => (eRang(i) < eRang(m) ? i : m), k[0]) : null; };
const DEPARTEMENTS = ['Marne', 'Aisne', 'Aube', 'Haute-Marne', 'Seine-et-Marne'];

// Nature du lot (comment il a été créé) — distincte du stade (où en est le vin : moût, FA, vin clair…)
const LOT_TYPES = { mout: 'Moût reçu', pressee: 'Pressée', fraction: 'Fraction de presse', vin_clair: 'Vin', assemblage: 'Assemblage', vin_reserve: 'Vin de réserve', cuvee_tirage: 'Cuvée de tirage' };
// Fractions de moût : liste personnalisable (Registres & Paramètres › Listes). « pressurage » = proposée dans le formulaire de pressurage.
const DEFAULT_FRACTIONS = () => ([
  { id: 'cuvee', label: 'Cuvée', suffix: 'C', pressurage: true },
  { id: 'taille1', label: '1ère taille', suffix: 'T1', pressurage: true },
  { id: 'taille2', label: '2ème taille', suffix: 'T2', pressurage: true },
  { id: 'rebeche', label: 'Rebêche', suffix: 'R', pressurage: true },
  { id: 'lies', label: 'Lies', suffix: 'L', pressurage: false },
  { id: 'bourbes', label: 'Bourbes', suffix: 'B', pressurage: false },
]);
const fracList = (db) => (db && db.lists && Array.isArray(db.lists.fractions) && db.lists.fractions.length ? db.lists.fractions : DEFAULT_FRACTIONS());
const fracDef = (db, id) => fracList(db).find((x) => x.id === id) || null;
const fracLabel = (db, id) => { const f = id ? fracDef(db, id) : null; return f ? f.label : (id && id !== '?' ? `(${id})` : 'Non précisée'); };
const fracPress = (db, keep) => fracList(db).filter((x) => x.pressurage !== false || (keep || []).includes(x.id));
const PREP_TYPES = { levain: 'Levain levurien', pied_mlf: 'Pied de cuve malolactique', liqueur_tirage: 'Liqueur de tirage', liqueur_exp: "Liqueur d'expédition" };
const CATEGORIES = { oeno: 'Œnologique', aux: 'Auxiliaire', sec: 'Matière sèche' };
const UNITES = ['g', 'kg', 'mL', 'L', 'u'];
const OP_LABELS = {
  apport: 'Apport vendange', pressurage: 'Pressurage', debourbage: 'Débourbage', soutirage: 'Soutirage', transfert: 'Transfert',
  intrant: 'Ajout d’intrants', froid: 'Passage au froid', filtration: 'Filtration', jaugeage: 'Jaugeage', assemblage: 'Assemblage',
  etape: 'Changement de stade', declassement: 'Déclassement validé', preparation: 'Préparation', tirage: 'Tirage (mixtion)',
  degorgement: 'Dégorgement', reprise: 'Reprise de stock', entree_mout: 'Entrée de moûts',
};
const OP_TONE = { apport: 'ok', pressurage: 'ok', debourbage: 'info', soutirage: 'info', transfert: 'info', intrant: 'warn', froid: 'info', filtration: 'info', jaugeage: '', assemblage: 'ok', etape: '', declassement: 'bad', preparation: 'warn', tirage: 'ok', degorgement: 'ok', reprise: '', entree_mout: 'ok' };

const DEFAULT_LISTS = () => ({
  fractions: DEFAULT_FRACTIONS(),
  cepages: [{ id: 'chard', label: 'Chardonnay' }, { id: 'pn', label: 'Pinot Noir' }, { id: 'pm', label: 'Meunier' }, { id: 'autre', label: 'Autre (Arbane, Petit Meslier…)' }],
  matieres: [{ id: 'inox', label: 'Inox', couleur: '#B9C4CC', finition: 'metal' }, { id: 'chene', label: 'Chêne', couleur: '#A9743F', finition: 'bois' }, { id: 'beton', label: 'Béton', couleur: '#A7A39A', finition: 'mineral' }, { id: 'fibre', label: 'Fibre / résine', couleur: '#8FB3C7', finition: 'lisse' }, { id: 'verre', label: 'Verre', couleur: '#9CC9B5', finition: 'verre' }, { id: 'gres', label: 'Grès', couleur: '#B79A78', finition: 'mineral' }, { id: 'terrecuite', label: 'Terre cuite', couleur: '#C0653D', finition: 'terre' }, { id: 'ceramique', label: 'Céramique', couleur: '#E8E2D2', finition: 'email' }],
  typesContenant: [{ id: 'cuve', label: 'Cuve', forme: 'cuve' }, { id: 'fut', label: 'Fût', forme: 'fut' }, { id: 'foudre', label: 'Foudre', forme: 'foudre' }, { id: 'citerne', label: 'Citerne', forme: 'citerne' }, { id: 'jarre', label: 'Jarre', forme: 'jarre' }, { id: 'amphore', label: 'Amphore', forme: 'amphore' }, { id: 'oeuf', label: 'Œuf œnologique', forme: 'oeuf' }, { id: 'bombonne', label: 'Bombonne', forme: 'bombonne' }],
  typesPerte: [{ id: 'bourbes', label: 'Bourbes' }, { id: 'lies', label: 'Lies' }, { id: 'ouillage', label: 'Évaporation / ouillage' }, { id: 'echantillon', label: 'Échantillons' }, { id: 'casse', label: 'Casse / fuite' }, { id: 'ecart', label: 'Écart de jaugeage' }, { id: 'autre', label: 'Autre' }],
  methodesFiltration: [{ id: 'diato', label: 'Terre diatomée' }, { id: 'plaques', label: 'Plaques' }, { id: 'tangentiel', label: 'Tangentielle' }, { id: 'cartouches', label: 'Cartouches / membrane' }, { id: 'centrif', label: 'Centrifugation' }],
  equipements: [{ id: 'pressoir', label: 'Pressoir 4 000 kg' }, { id: 'pompe', label: 'Pompe à pistons' }, { id: 'filtre', label: 'Filtre à plaques' }, { id: 'tangent', label: 'Filtre tangentiel' }, { id: 'tireuse', label: 'Tireuse' }, { id: 'degorgeuse', label: 'Ligne de dégorgement' }],
  stades: DEFAULT_STADES(), couleursVin: DEFAULT_COULEURS_VIN(), echelles: DEFAULT_ECHELLES(), stadesMelanges: DEFAULT_STADES_MELANGES(), operations: DEFAULT_OPERATIONS(),
  actionsHygiene: [{ id: 'nettoyage', label: 'Nettoyage' }, { id: 'rincage', label: 'Rinçage' }, { id: 'desinfection', label: 'Désinfection' }, { id: 'detartrage', label: 'Détartrage' }, { id: 'vapeur', label: 'Passage vapeur' }, { id: 'soufrage', label: 'Mèchage / SO₂' }],
});
const LIST_META = [
  { key: 'cepages', title: 'Cépages' },
  { key: 'typesPerte', title: 'Types de pertes' }, { key: 'methodesFiltration', title: 'Méthodes de filtration' }, { key: 'equipements', title: 'Équipements' },
  { key: 'actionsHygiene', title: 'Actions d’hygiène' },
];

/* ---------- contenants : formes, finitions, apparence (plan de cave) ---------- */
const FORMES = [
  { id: 'cuve', label: 'Cuve verticale' }, { id: 'conique', label: 'Cuve tronconique' }, { id: 'citerne', label: 'Citerne horizontale' },
  { id: 'fut', label: 'Fût / barrique' }, { id: 'foudre', label: 'Foudre' }, { id: 'jarre', label: 'Jarre' },
  { id: 'amphore', label: 'Amphore' }, { id: 'oeuf', label: 'Œuf œnologique' }, { id: 'bombonne', label: 'Bombonne / dame-jeanne' },
];
const FINITIONS = [
  { id: 'metal', label: 'Métal brossé' }, { id: 'bois', label: 'Bois (douelles)' }, { id: 'mineral', label: 'Minéral (béton, grès)' },
  { id: 'terre', label: 'Terre cuite' }, { id: 'email', label: 'Émail / céramique' }, { id: 'verre', label: 'Verre' }, { id: 'lisse', label: 'Lisse (résine)' },
];
const DEFAULT_APPARENCE = () => ({
  cepageColors: { chard: '#E6D58A', pn: '#8E3A4B', pm: '#C27D7A', autre: '#9AA39B' },
  melanges: [], // [{ id, nom, cepages: [ids], couleur }] : couleur imposée à un assemblage de cépages précis
  inconnuColor: '#B7BDB9',
  qualifColors: { conv: '#5F7A8A', bio: '#3E8E4E', dem: '#8454B3' },
  echelleColors: { autre: '#8A7F6B', premier: '#C07A2C', grand: '#C79A1E' },
  contourMode: 'qualif', // qualif | echelle | aucun
  interieurMode: 'cepage', // cepage | couleur | stade : ce que montre l'intérieur des contenants sur le plan
});
const CEPAGE_FALLBACK = ['#D9B26F', '#7FA38F', '#B07AA1', '#6F8FB8', '#C58B5E', '#8FB86E'];

/* ---------- nombres, dates, textes ---------- */
const num = (x) => { const v = typeof x === 'string' ? parseFloat(x.replace(',', '.')) : Number(x); return Number.isFinite(v) ? v : 0; };
const hasNum = (x) => x !== '' && x !== null && x !== undefined && Number.isFinite(typeof x === 'string' ? parseFloat(x.replace(',', '.')) : Number(x));
const r2 = (x) => Math.round((num(x) + Number.EPSILON) * 100) / 100;
const r0 = (x) => Math.round(num(x));
const fmt = (x, d = 0) => num(x).toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
// Volumes de vin et de contenants : affichés et saisis en hectolitres, 2 décimales (le moteur calcule en litres)
const fmtHL = (L) => fmt(num(L) / 100, 2);
const fmtL = (L) => `${fmtHL(L)} hL`;
const hlTxt = (L) => (hasNum(L) ? String(Math.round(num(L) / 100 * 10000) / 10000).replace('.', ',') : ''); // valeur de saisie en hL
const pct = (x, d = 0) => `${fmt(num(x) * 100, d)} %`;
const sum = (a, f = (x) => x) => a.reduce((s, x) => s + num(f(x)), 0);
const pad = (n, w = 2) => String(n).padStart(w, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const isoOK = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00Z') - new Date(a + 'T12:00:00Z')) / 86400000);
const fmtDate = (iso) => (isoOK(iso) ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '—');
const yearOf = (iso) => parseInt(String(iso).slice(0, 4), 10);
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const clone = (o) => JSON.parse(JSON.stringify(o));
// ordre de rejeu : date, n° de saisie, puis identifiant (stable quand deux appareils ont saisi le même jour avec le même n°)
const byDate = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : ((a.seq || 0) - (b.seq || 0)) || (String(a.id || '') < String(b.id || '') ? -1 : String(a.id || '') > String(b.id || '') ? 1 : 0));
const uniq = (a) => Array.from(new Set(a));

/* ---------- identifiants déterministes ---------- */
// identifiants : compteur de la base + marque de l'appareil (« op124-k7f ») → deux appareils synchronisés ne créent jamais le même identifiant
let NID_SUFFIXE = '';
const nid = (db, p) => { db.meta.seq = (db.meta.seq || 0) + 1; return `${p}${db.meta.seq}${NID_SUFFIXE}`; };

/* ---------- listes ---------- */
const lbl = (db, key, id) => { const it = (db.lists[key] || []).find((x) => x.id === id); return it ? it.label : (id ? `(${id})` : '—'); };
const opts = (db, key) => (db.lists[key] || []).map((x) => ({ value: x.id, label: x.label }));

/* ---------- unités & doses ---------- */
const toBase = (qty, unit) => (unit === 'kg' || unit === 'L' ? num(qty) * 1000 : num(qty)); // g ou mL
const doseHL = (qty, unit, volL) => (unit === 'u' || num(volL) <= 0 ? null : toBase(qty, unit) / (num(volL) / 100)); // g/hL ou mL/hL
const doseUnit = (unit) => (unit === 'g' || unit === 'kg' ? 'g/hL' : unit === 'mL' || unit === 'L' ? 'mL/hL' : '');

/* ---------- CSV ---------- */
const csvCell = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCSV = (rows) => '﻿' + rows.map((r) => r.map(csvCell).join(';')).join('\r\n');

/* ---------- campagnes ---------- */
const campOf = (db, date) => db.campagnes.find((c) => date >= c.debut && date <= c.fin) || null;
const isLocked = (db, date) => { const c = campOf(db, date); return !!(c && c.figee); };
const campLabel = (c) => (c ? c.nom : '—');
