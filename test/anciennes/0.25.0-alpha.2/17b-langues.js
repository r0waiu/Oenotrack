/* ============ LANGUES (0.24.0-alpha.1) : langue de l'interface, dictionnaires, traduction ============
   Le texte de l'application est écrit en français ; les traductions (17c-traductions.js) associent à chaque texte français sa version
   dans les autres langues, et les « motifs » ({a}, {b}… : nombres, noms, dates) traduisent les phrases qui contiennent des valeurs.
   La traduction se fait à l'affichage (40c-langue.jsx) : ce qui n'est pas encore traduit reste en français. Les données saisies, les
   registres exportés et les fichiers ne sont jamais traduits.
   Langue : réglage de l'appareil (comme le thème), jamais dans la base ; à la première ouverture, celle du navigateur si Œnotrack la
   connaît (aucune géolocalisation) ; qui utilisait déjà Œnotrack garde le français. */
const LANGUES = [
  { id: 'fr', nom: 'Français', locale: 'fr-FR' },
  { id: 'en', nom: 'English', locale: 'en-GB' },
  { id: 'es', nom: 'Español', locale: 'es-ES' },
  { id: 'it', nom: 'Italiano', locale: 'it-IT' },
  { id: 'de', nom: 'Deutsch', locale: 'de-DE' },
  { id: 'pt', nom: 'Português', locale: 'pt-PT' },
];
const LANGUE_KEY = 'oenotrack-langue';
const LANGUES_TRAD = ['en', 'es', 'it', 'de', 'pt']; // colonnes des tables de traduction, après le français
let LANGUE = 'fr';
const langueConnue = (id) => LANGUES.some((l) => l.id === id);
// première langue connue de la liste du navigateur (navigator.languages : « en-GB », « pt-BR »…)
function langueDuNavigateur(liste) {
  for (const x of (Array.isArray(liste) ? liste : [liste])) { const k = String(x || '').toLowerCase().slice(0, 2); if (langueConnue(k)) return k; }
  return 'fr';
}
// langue au démarrage : celle choisie sur cet appareil ; sinon le français pour qui utilisait déjà Œnotrack (base présente), sinon celle du navigateur
function langueInitiale({ stockee, base, navigateur } = {}) {
  if (langueConnue(stockee)) return stockee;
  if (base) return 'fr';
  return langueDuNavigateur(navigateur);
}

/* ---------- dictionnaires ---------- */
// TRAD_TABLE (17c) : [français, english, español, italiano, deutsch, português] ; TRAD_MOTIFS : même forme, avec {a}, {b}…
const TRAD = {}; let TRAD_PRET = false; const TRAD_RE = {};
const motifEchappe = (s) => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
function tradPreparer() {
  if (TRAD_PRET) return; TRAD_PRET = true;
  const table = typeof TRAD_TABLE !== 'undefined' ? TRAD_TABLE : []; const motifs = typeof TRAD_MOTIFS !== 'undefined' ? TRAD_MOTIFS : [];
  LANGUES_TRAD.forEach((lg, i) => {
    const D = TRAD[lg] = {}; table.forEach((r) => { if (r && r[0] && r[i + 1]) D[r[0]] = r[i + 1]; });
    TRAD_RE[lg] = motifs.filter((r) => r && r[0] && r[i + 1]).map((r) => {
      // une valeur peut être vide (« Vin en cuverie{a} » : « Vin en cuverie » ou « Vin en cuverie (site) »)
      const noms = []; const re = new RegExp(`^${r[0].split(/(\{[a-j]\})/).map((p) => { const m = /^\{([a-j])\}$/.exec(p); if (m) { noms.push(m[1]); return '(.*?)'; } return motifEchappe(p); }).join('')}$`, 's');
      const lit = r[0].replace(/\{[a-j]\}/g, '');
      return { re, noms, dst: r[i + 1], src: r[0], lit: lit.length, gen: !/[A-Za-zÀ-ÿ]/.test(lit) }; // gen : motif générique (« {a} · {b} », « {a} : {b} »…)
    }).sort((a, b) => b.lit - a.lit); // le motif le plus précis d'abord (« Pesée n° {a} validée. » avant « Pesée n° {a} »)
  });
}
// texte français → langue active (ou lg) ; inchangé s'il n'est pas (encore) traduit. Les valeurs d'un motif sont traduites à leur tour
// (sans leurs espaces autour). strict : pas de motif générique au premier niveau (phrase faite de plusieurs nœuds, voir 40c)
const TRAD_CACHE = {}; // texte → traduction, par langue (les mêmes textes reviennent à chaque rendu : tableaux, listes)
function traduire(texte, lg, prof, strict) {
  lg = lg || LANGUE; if (lg === 'fr' || texte == null || texte === '') return texte; tradPreparer();
  const D = TRAD[lg]; if (!D) return texte; const s = String(texte);
  if (D[s] !== undefined) return D[s];
  if (!prof) {
    const C = TRAD_CACHE[lg] || (TRAD_CACHE[lg] = new Map()); const k = (strict ? '\u0001' : '') + s;
    let r = C.get(k); if (r !== undefined) return r;
    r = traduireMotifs(s, lg, 0, strict); if (C.size > 20000) C.clear(); C.set(k, r); return r;
  }
  return traduireMotifs(s, lg, prof, strict);
}
function traduireMotifs(s, lg, prof, strict) {
  if ((prof || 0) > 10) return s;
  for (const m of TRAD_RE[lg] || []) {
    if (strict && m.gen) continue;
    const r = m.re.exec(s); if (!r) continue;
    let change = false;
    const vals = {}; m.noms.forEach((n, i) => { const c = r[i + 1]; const t = c.trim(); const tt = t ? traduire(t, lg, (prof || 0) + 1) : t; if (tt !== t) change = true; vals[n] = t ? c.replace(t, () => tt) : c; });
    if (m.gen && !change) continue; // séparateur seul (« {a} · {b} ») : utile seulement si une partie est traduite ; sinon le séparateur suivant
    return m.dst.replace(/\{([a-j])\}/g, (x, n) => (vals[n] !== undefined ? vals[n] : x));
  }
  return s;
}

// contrôle des tables : chaque ligne a ses 6 langues ; un motif garde ses {a}, {b}… dans chaque langue
function tradControle() {
  const pb = []; const table = typeof TRAD_TABLE !== 'undefined' ? TRAD_TABLE : []; const motifs = typeof TRAD_MOTIFS !== 'undefined' ? TRAD_MOTIFS : [];
  const vus = new Set();
  table.forEach((r, i) => { if (!Array.isArray(r) || r.length !== 6 || r.some((x) => typeof x !== 'string' || !x)) pb.push(`ligne ${i + 1} incomplète : ${JSON.stringify(r).slice(0, 80)}`); else if (vus.has(r[0])) pb.push(`ligne ${i + 1} en double : ${r[0].slice(0, 60)}`); else vus.add(r[0]); });
  const mvus = new Set();
  motifs.forEach((r, i) => {
    if (!Array.isArray(r) || r.length !== 6 || r.some((x) => typeof x !== 'string' || !x)) { pb.push(`motif ${i + 1} incomplet : ${JSON.stringify(r).slice(0, 80)}`); return; }
    if (mvus.has(r[0])) pb.push(`motif ${i + 1} en double : ${r[0].slice(0, 60)}`); mvus.add(r[0]);
    const cles = (x) => (x.match(/\{[a-j]\}/g) || []).sort().join('');
    r.slice(1).forEach((x, k) => { if (cles(x) !== cles(r[0])) pb.push(`motif ${i + 1} (${LANGUES_TRAD[k]}) : valeurs {…} différentes`); });
  });
  return pb;
}
