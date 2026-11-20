/* ============ FORMULAIRES D'OPÉRATION PERSONNALISABLES (alpha V1.6) ============
   db.formulaires [{ id: <opération du catalogue>, champs: { <champ>: { vis: 'visible'|'replie'|'masque', obligatoire, libelle, aide, defaut } },
                     perso: [<champ personnalisé>], modifieLe }]
   Champ personnalisé : { id 'c…' (lettres et chiffres), code (pour les formules), label, type, unite, dec, min, max, options [], formule,
                          obligatoire, defaut, aide, position 'debut'|'fin', journal }
   Valeurs saisies : op.champs [{ id, code, label, type, unite, dec, journal, valeur }] — chaque valeur garde son libellé : l'historique reste
   lisible même si le champ est renommé ou supprimé ensuite. Les champs indispensables au calcul des stocks ne peuvent être ni masqués ni facultatifs. */
const CP_TYPES = [
  ['texte', 'Texte court'], ['texteLong', 'Texte long'], ['nombre', 'Nombre'], ['calcul', 'Calcul (formule)'], ['date', 'Date'], ['heure', 'Heure'],
  ['ouinon', 'Case à cocher (oui)'], ['liste', 'Liste de choix'], ['multi', 'Choix multiples'],
];
const CP_NUM = ['nombre', 'calcul'];
// champs de chaque formulaire : [clé, libellé, options] — ess : indispensable ; def : type de valeur par défaut ; ligne : par compartiment ;
// bare : bloc dont le libellé n'est pas modifiable ; noObl : ne peut pas être rendu obligatoire
const CH_DATE = ['date', 'Date', { ess: true, noDef: true }];
const CH_PORTION = ['portionId', 'Portion (cuve · lot)', { ess: true }];
const CH_LIGNES = ['lignes', 'Intrants', { bare: true }];
const CH_PERTES = ['pertes', 'Pertes', { bare: true }];
const CH_EQUIPS = ['equipementIds', 'Équipements utilisés', { bare: true, def: 'equips' }];
const CHAMPS_STD = {
  apport: [CH_DATE, ['cepageId', 'Cépage', { ess: true, def: 'cepage' }], ['kg', 'Poids reçu (kg)', { ess: true }], ['qualifId', 'Revendication du raisin', { def: 'qualif' }], ['parcelleId', 'Parcelle'], ['apporteurId', 'Partenaire (apporteur)'], ['cruId', 'Cru (village)'], ['ref', 'N° de bon de pesée / DAE', { def: 'texte' }]],
  entree_mout: [CH_DATE, ['apporteurId', 'Partenaire par défaut'], ['ref', 'N° de bon / DAE', { def: 'texte' }], ['immat', 'Immatriculation de la citerne'], ['millesime', 'Millésime (par défaut)', { def: 'texte' }], ['analyseModele', 'Modèle d’analyse des lots reçus', { noObl: true }],
    ['e.numLot', 'N° de lot (par compartiment)', { ligne: true }], ['e.compartiment', 'Compartiment', { ligne: true }], ['e.cepageId', 'Cépage', { ligne: true, ess: true, def: 'cepage' }], ['e.fractionId', 'Fraction', { ligne: true, ess: true, def: 'fraction' }],
    ['e.qualifId', 'Revendication', { ligne: true, def: 'qualif' }], ['e.millesime', 'Millésime du moût', { ligne: true }], ['e.couleur', 'Couleur', { ligne: true, def: 'couleur' }], ['e.parcelleId', 'Parcelle', { ligne: true }],
    ['e.apporteurs', 'Partenaire(s) du compartiment', { ligne: true }], ['e.cruId', 'Cru (village)', { ligne: true }], ['e.analyses', 'Analyses du lot', { ligne: true }], ['code', 'Préfixe des codes de lots', { noObl: true }]],
  pressurage: [CH_DATE, ['equipementId', 'Pressoir', { def: 'equip' }], ['charges', 'Apports de vendange pressés', { ess: true, bare: true }], ['code', 'Code du lot parent', { ess: true }], ['designation', 'Désignation', { def: 'texte' }], ['millesime', 'Millésime', { def: 'texte' }], ['qualifId', 'Revendication du lot', { def: 'qualif' }], ['frac', 'Fractions obtenues', { ess: true, bare: true }]],
  transfert: [CH_DATE, ['portionId', 'Portion source', { ess: true }], ['volL', 'Volume repris (hL)', { ess: true }], ['destId', 'Contenant de destination', { ess: true }], CH_PERTES, CH_LIGNES, CH_EQUIPS],
  intrant: [CH_DATE, ['portionId', 'Portion concernée', { ess: true }], ['motif', 'Objet de l’ajout', { def: 'texte' }], ['lignes', 'Intrants', { bare: true }], ['prepUses', 'Préparations ajoutées (pied de cuve, levain…)', { bare: true }]],
  suivi: [CH_DATE, ['portionId', 'Portion (cuve)', { ess: true }], ['motif', 'Objet', { def: 'texte' }], ['densite', 'Densité', { def: 'nombre' }], ['tempC', 'Température (°C)', { def: 'nombre' }], CH_LIGNES],
  sortie: [CH_DATE, CH_PORTION, ['volL', 'Volume sorti (hL)', { ess: true }], ['motif', 'Motif', { def: 'texte' }], ['ref', 'N° de DAE / DSA', { def: 'texte' }], ['destinataire', 'Destinataire (acheteur, distillerie…)', { def: 'texte' }]],
  froid: [CH_DATE, ['portionId', 'Portion (cuve)', { ess: true }], ['tempC', 'Température (°C)', { def: 'nombre' }], ['jours', 'Durée (jours)', { def: 'nombre' }], CH_LIGNES],
  filtration: [CH_DATE, ['portionId', 'Portion filtrée', { ess: true }], ['methodeId', 'Méthode de filtration', { def: 'methode' }], ['lignes', 'Auxiliaires et intrants', { bare: true }], CH_PERTES, CH_EQUIPS],
  jaugeage: [CH_DATE, ['portionId', 'Portion jaugée', { ess: true }], ['volMesure', 'Volume mesuré (hL)', { ess: true }], ['typeId', 'Nature de l’écart', { def: 'typesPerte' }]],
  assemblage: [CH_DATE, ['sources', 'Portions sources', { ess: true, bare: true }], ['destId', 'Contenant de destination', { ess: true }], ['ltype', 'Nature du lot résultant', { def: 'ltype' }], ['code', 'Code du nouveau lot', { ess: true }], ['designation', 'Désignation', { def: 'texte' }], ['millesime', 'Millésime', { def: 'texte' }], ['pertes', 'Pertes à l’assemblage', { bare: true }], CH_LIGNES],
  etape: [CH_DATE, ['lotId', 'Lot', { ess: true }], ['newStade', 'Nouveau stade', { ess: true }], ['couleur', 'Couleur du vin', { noObl: true }], ['newType', 'Nature du lot', { noObl: true }]],
  reprise: [CH_DATE, ['kind', 'Nature du stock', { ess: true }], ['apporteurId', 'Partenaire (vendeur)'], ['quantite', 'Contenant et volume / bouteilles', { ess: true, bare: true }], ['code', 'Code du lot', { ess: true }], ['designation', 'Désignation', { def: 'texte' }], ['millesime', 'Millésime', { def: 'texte' }], ['ltype', 'Nature du lot', { def: 'ltype' }], ['qualifId', 'Revendication', { def: 'qualif' }], ['crus', 'Origine par crus', { bare: true }], ['cepages', 'Composition par cépage', { bare: true }]],
  preparation: [CH_DATE, ['ptype', 'Type de préparation', { ess: true }], ['code', 'Code', { ess: true }], ['volL', 'Volume préparé (hL)', { ess: true }], ['qualifId', 'Revendication', { def: 'qualif' }], ['source', 'Vin prélevé pour la préparation', { bare: true }], ['lignes', 'Ingrédients', { bare: true }]],
  tirage: [CH_DATE, ['sources', 'Vin de base (portions)', { ess: true, bare: true }], ['prepUses', 'Liqueur de tirage et levain consommés', { bare: true }], ['lignes', 'Adjuvants et matières sèches', { bare: true }], ['nbBouteilles', 'Bouteilles tirées', { ess: true }], ['volBouteilleL', 'Volume bouteille (L)', { def: 'nombre' }], ['densites', 'Densités et sucre de la mixtion', { bare: true }], ['code', 'Code du lot de tirage', { ess: true }], ['designation', 'Désignation', { def: 'texte' }], ['millesime', 'Millésime', { def: 'texte' }]],
  degorgement: [CH_DATE, ['sourceLotId', 'Lot de tirage', { ess: true }], ['nb', 'Bouteilles dégorgées', { ess: true }], ['prepUses', 'Liqueur d’expédition utilisée', { bare: true }], ['lignes', 'Bouchon, muselet…', { bare: true }], ['code', 'Code du lot fini', { ess: true }], ['designation', 'Désignation', { def: 'texte' }], ['dosageGL', 'Dosage (g/L)', { def: 'nombre' }]],
};
CHAMPS_STD.debourbage = CHAMPS_STD.transfert; CHAMPS_STD.soutirage = CHAMPS_STD.transfert;
const CHAMPS_COMMUNS = [['vin', 'Stade et couleur du vin', { bare: true, noObl: true, vin: true }], ['operateurs', 'Opérateur(s)', { bare: true }], ['notes', 'Notes', { def: 'texte' }], ['docs', 'Documents joints', { bare: true }]];
// opérations qui fixent le stade / la couleur du vin (mêmes listes que VIN_CREE + VIN_APRES des formulaires)
const FORM_VIN = ['pressurage', 'entree_mout', 'assemblage', 'tirage', 'reprise', 'debourbage', 'soutirage', 'transfert', 'intrant', 'froid', 'filtration', 'suivi'];
function champsStd(type) {
  const L = (CHAMPS_STD[type] || [CH_DATE]).concat(CHAMPS_COMMUNS.filter((c) => !c[2].vin || FORM_VIN.includes(type)));
  return L.map(([k, label, o]) => ({ k, label, ...(o || {}) }));
}
const champStd = (type, k) => champsStd(type).find((c) => c.k === k) || null;
// deux comportements au même formulaire (débourbage, soutirage, transfert) : réglages copiables de l'un à l'autre
const memeFormulaire = (a, b) => a === b || (!!CHAMPS_STD[a] && CHAMPS_STD[a] === CHAMPS_STD[b]);

/* ---------- configuration d'un formulaire ---------- */
const formulaireBrut = (db, catId) => ((db && db.formulaires) || []).find((x) => x && x.id === catId) || null;
function formulaireDe(db, catId) {
  const x = formulaireBrut(db, catId) || {};
  return { id: catId, champs: x.champs && typeof x.champs === 'object' ? x.champs : {}, perso: Array.isArray(x.perso) ? x.perso.filter((p) => p && p.id) : [], perso_: !!formulaireBrut(db, catId) };
}
const champCfg = (cfg, k) => (cfg && cfg.champs && cfg.champs[k]) || {};
// réglage effectif d'un champ standard (un champ indispensable reste toujours visible et n'est jamais « obligatoire » en plus)
function champEffectif(cfg, type, k) {
  const s = champStd(type, k) || {}; const c = champCfg(cfg, k);
  return { ...s, vis: s.ess ? 'visible' : (['visible', 'replie', 'masque'].includes(c.vis) ? c.vis : 'visible'), obligatoire: !s.ess && !s.noObl && !!c.obligatoire && c.vis !== 'masque', libelle: String(c.libelle || '').trim(), aide: String(c.aide || '').trim(), defaut: c.defaut };
}
const formulairePerso = (db, catId) => !!formulaireBrut(db, catId) && (() => { const f = formulaireDe(db, catId); return f.perso.length > 0 || Object.keys(f.champs).some((k) => { const c = f.champs[k] || {}; return (c.vis && c.vis !== 'visible') || c.obligatoire || c.libelle || c.aide || (c.defaut != null && c.defaut !== ''); }); })();
const codeDe = (label) => norm(label).replace(/[^a-z0-9]+/g, '').replace(/^[0-9]+/, '').slice(0, 20) || 'champ';
const nouvelIdChamp = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`.replace(/[^a-z0-9]/g, '');
// variables des formules : champs numériques personnalisés (par leur code) + quelques valeurs de l'opération
const FORMULE_STD = [['volume', 'volume de l’opération (hL)'], ['litres', 'volume de l’opération (L)'], ['kg', 'poids de raisin (kg)'], ['bouteilles', 'nombre de bouteilles'], ['temperature', 'température saisie (°C)'], ['densite', 'densité saisie'], ['jours', 'durée (jours)'], ['dosage', 'dosage (g/L)']];
function formuleVarsStd(type, f) {
  const n = (x) => (hasNum(x) ? num(x) : null); f = f || {};
  let L = null;
  if (hasNum(f.volL)) L = num(f.volL); else if (type === 'entree_mout') L = sum(f.entrees || [], (e) => sum(e.dests || [], (d) => d.volL)); else if (['assemblage', 'tirage'].includes(type)) L = sum(f.sources || [], (s) => s.volL); else if (type === 'pressurage') L = sum(Object.values(f.frac || {}), (x) => x.volL); else if (hasNum(f.volMesure)) L = num(f.volMesure);
  return { volume: L != null ? L / 100 : null, litres: L, kg: type === 'pressurage' ? sum(f.charges || [], (c) => c.kg) : n(f.kg), bouteilles: n(f.nbBouteilles) != null ? n(f.nbBouteilles) : n(f.nb), temperature: n(f.tempC), densite: n(f.densite), jours: n(f.jours), dosage: n(f.dosageGL) };
}
// formules : + − × ÷, parenthèses, nombres (virgule ou point), variables (code), fonctions min, max, abs, arrondi(x[, décimales])
function formuleAnalyser(src) {
  const s = String(src || ''); let i = 0; const err = (m) => { throw new Error(m); }; const vars = new Set();
  const esp = () => { while (i < s.length && /\s/.test(s[i])) i += 1; };
  const expr = () => { let a = terme(); for (;;) { esp(); const c = s[i]; if (c === '+' || c === '-') { i += 1; const b = terme(); const x = a; a = c === '+' ? { op: '+', a: x, b } : { op: '-', a: x, b }; } else return a; } };
  const terme = () => { let a = facteur(); for (;;) { esp(); const c = s[i]; if (c === '*' || c === '/' || c === '×' || c === '÷') { i += 1; const b = facteur(); a = { op: c === '*' || c === '×' ? '*' : '/', a, b }; } else return a; } };
  const facteur = () => {
    esp(); const c = s[i];
    if (c === '-' || c === '+') { i += 1; const a = facteur(); return c === '-' ? { op: 'neg', a } : a; }
    if (c === '(') { i += 1; const a = expr(); esp(); if (s[i] !== ')') err('parenthèse non fermée'); i += 1; return a; }
    if (c === '{') { const j = s.indexOf('}', i); if (j < 0) err('accolade non fermée'); const v = s.slice(i + 1, j).trim(); i = j + 1; if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(v)) err(`variable « ${v} » invalide`); vars.add(v.toLowerCase()); return { v: v.toLowerCase() }; }
    if (/[0-9.,]/.test(c || '')) { let j = i; while (j < s.length && /[0-9.,]/.test(s[j])) j += 1; const t = s.slice(i, j).replace(',', '.'); i = j; if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) err(`nombre « ${t} » invalide`); return { n: parseFloat(t) }; }
    if (/[A-Za-z]/.test(c || '')) {
      let j = i; while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j += 1; const id = s.slice(i, j).toLowerCase(); i = j; esp();
      if (s[i] === '(') { i += 1; const args = []; esp(); if (s[i] !== ')') { for (;;) { args.push(expr()); esp(); if (s[i] === ',' || s[i] === ';') { i += 1; continue; } break; } } esp(); if (s[i] !== ')') err('parenthèse non fermée'); i += 1;
        if (!['min', 'max', 'abs', 'arrondi'].includes(id)) err(`fonction « ${id} » inconnue (min, max, abs, arrondi)`); return { f: id, args }; }
      vars.add(id); return { v: id };
    }
    err(c ? `caractère « ${c} » inattendu` : 'formule incomplète');
    return null;
  };
  if (!s.trim()) err('formule vide');
  const arbre = expr(); esp(); if (i < s.length) err(`caractère « ${s[i]} » inattendu`);
  return { arbre, vars: [...vars] };
}
function formuleCalculer(arbre, vals) {
  const ev = (t) => {
    if (!t) return null; if ('n' in t) return t.n; if ('v' in t) { const x = vals[t.v]; return x == null || Number.isNaN(x) ? null : x; }
    if (t.f) { const a = t.args.map(ev); if (a.some((x) => x == null)) return null; if (t.f === 'min') return a.length ? Math.min(...a) : null; if (t.f === 'max') return a.length ? Math.max(...a) : null; if (t.f === 'abs') return Math.abs(a[0]); const k = Math.pow(10, Math.round(a[1] || 0)); return Math.round(a[0] * k) / k; }
    if (t.op === 'neg') { const a = ev(t.a); return a == null ? null : -a; }
    const a = ev(t.a), b = ev(t.b); if (a == null || b == null) return null;
    if (t.op === '+') return a + b; if (t.op === '-') return a - b; if (t.op === '*') return a * b; return b === 0 ? null : a / b;
  };
  const r = ev(arbre); return r == null || !Number.isFinite(r) ? null : r;
}
function formuleEval(src, vals) { try { return formuleCalculer(formuleAnalyser(src).arbre, vals || {}); } catch (e) { return null; } }

/* ---------- valeurs saisies ---------- */
const cpVide = (d, v) => (d.type === 'ouinon' ? v !== true : d.type === 'multi' ? !(Array.isArray(v) && v.length) : d.type === 'calcul' ? v == null : v == null || String(v).trim() === '');
// valeurs des champs numériques et calculés (les calculs peuvent s'enchaîner)
function champsNumeriques(defs, fv, vars) {
  const vals = { ...(vars || {}) }; defs.filter((d) => d.type === 'nombre').forEach((d) => { const v = fv[d.id]; vals[d.code] = hasNum(v) ? num(v) : null; });
  const calc = defs.filter((d) => d.type === 'calcul'); const res = {};
  for (let pas = 0; pas < calc.length + 1; pas += 1) { let chg = false; calc.forEach((d) => { const r = formuleEval(d.formule, vals); const x = r == null ? null : (hasNum(d.dec) ? Math.round(r * Math.pow(10, num(d.dec))) / Math.pow(10, num(d.dec)) : r); if (res[d.id] !== x) { res[d.id] = x; vals[d.code] = x; chg = true; } }); if (!chg) break; }
  return res;
}
// champs.valeurs (formulaire) → op.champs ; garde les valeurs d'anciens champs (supprimés depuis) pour ne rien perdre
function champsValeurs(defs, fv, vars, anciens) {
  fv = fv || {}; const calc = champsNumeriques(defs, fv, vars); const out = [];
  defs.forEach((d) => {
    let v = d.type === 'calcul' ? calc[d.id] : fv[d.id];
    if (d.type === 'nombre') v = hasNum(v) ? num(v) : null; else if (d.type === 'ouinon') v = v === true ? true : null; else if (d.type === 'multi') v = Array.isArray(v) && v.length ? v.filter(Boolean) : null; else if (d.type !== 'calcul') v = v == null ? null : String(v).trim() || null;
    if (v == null) return; out.push({ id: d.id, code: d.code, label: d.label, type: d.type, ...(d.unite ? { unite: d.unite } : {}), ...(hasNum(d.dec) ? { dec: num(d.dec) } : {}), ...(d.journal === false ? { journal: false } : {}), valeur: v });
  });
  (Array.isArray(anciens) ? anciens : []).forEach((a) => { if (a && a.id && !defs.some((d) => d.id === a.id)) out.push(a); });
  return out;
}
const champsEtat = (op) => { const o = {}; (Array.isArray(op && op.champs) ? op.champs : []).forEach((c) => { if (c && c.id) o[c.id] = typeof c.valeur === 'number' ? String(c.valeur).replace('.', ',') : c.valeur; }); return o; };
// nombre affiché : décimales réglées, sinon celles saisies (jusqu'à 4)
const fmtChamp = (v, dec) => (hasNum(dec) ? fmt(v, num(dec)) : num(v).toLocaleString('fr-FR', { maximumFractionDigits: 4 }));
const champValeurTexte = (c) => { const v = c.valeur; if (v == null || v === '') return ''; if (c.type === 'ouinon') return v === true ? 'oui' : 'non'; if (Array.isArray(v)) return v.join(', '); if (typeof v === 'number') return `${fmtChamp(v, c.dec)}${c.unite ? ` ${c.unite}` : ''}`; if (c.type === 'date') return fmtDate(v); return `${v}${c.unite && c.type === 'texte' ? ` ${c.unite}` : ''}`; };
// « Libellé : valeur · … » (journal : sans les champs marqués « pas dans le journal »)
const champsTexte = (op, journal) => (Array.isArray(op && op.champs) ? op.champs : []).filter((c) => c && (!journal || c.journal !== false)).map((c) => { const t = champValeurTexte(c); return t ? `${c.label} : ${t}` : ''; }).filter(Boolean).join(' · ');

/* ---------- contrôles à la validation ---------- */
const vide = (v) => v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && !v.length) || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
function champStdVide(db, type, k, f) {
  switch (k) {
    case 'lignes': return !(f.lignes || []).some((l) => l.produitId);
    case 'pertes': return !(f.pertes || []).some((p) => num(p.volL) > 0);
    case 'prepUses': return !(f.prepUses || []).some((u) => u.prepId);
    case 'operateurs': return !operateursValides(db, f.operateurs).length;
    case 'crus': return !Object.keys(f.crus || {}).some((c) => f.crus[c] != null && f.crus[c] !== '');
    case 'cepages': return !Object.keys(f.cepages || {}).some((c) => num(f.cepages[c]) > 0);
    case 'source': return !f.sourcePortionId;
    case 'densites': return !(hasNum(f.densBase) && hasNum(f.densMix));
    default: return vide(f[k]);
  }
}
// opts.nouveau === false (correction d'une opération déjà enregistrée) : les champs devenus obligatoires depuis ne bloquent pas la correction
function champsErreurs(db, catId, type, f, opts) {
  const cfg = formulaireDe(db, catId); const nom = (c) => c.libelle || c.label; const oblig = !(opts && opts.nouveau === false);
  for (const s of oblig ? champsStd(type) : []) {
    if (['docs', 'vin'].includes(s.k)) continue; const c = champEffectif(cfg, type, s.k); if (!c.obligatoire) continue;
    if (s.ligne) { const k = s.k.slice(2); const L = (f.entrees || []).map((e, i) => ({ e, i })).filter(({ e }) => sum(e.dests || [], (d) => d.volL) > 0); const manque = L.find(({ e }) => (k === 'analyses' ? !Object.keys(e.analyses || {}).some((x) => hasNum(e.analyses[x])) : k === 'apporteurs' ? !(e.apporteurs || []).some((a) => a.id) : vide(e[k])));
      if (manque) return `Moût ${manque.i + 1} : « ${nom(c)} » est obligatoire.`; continue; }
    if (champStdVide(db, type, s.k, f)) return `« ${nom(c)} » est obligatoire.`;
  }
  const fv = f.champs || {}; const calc = champsNumeriques(cfg.perso, fv, formuleVarsStd(type, f));
  for (const d of cfg.perso) {
    const v = d.type === 'calcul' ? calc[d.id] : fv[d.id];
    if (oblig && d.obligatoire && cpVide(d, v)) return d.type === 'ouinon' ? `« ${d.label} » doit être coché.` : `« ${d.label} » est obligatoire.`;
    if (d.type === 'nombre' && v != null && String(v).trim() !== '') { if (!hasNum(v)) return `« ${d.label} » : nombre attendu.`; if (hasNum(d.min) && num(v) < num(d.min)) return `« ${d.label} » : au moins ${fmt(d.min)}${d.unite ? ` ${d.unite}` : ''}.`; if (hasNum(d.max) && num(v) > num(d.max)) return `« ${d.label} » : au plus ${fmt(d.max)}${d.unite ? ` ${d.unite}` : ''}.`; }
    if (d.type === 'liste' && v && (d.options || []).length && !(d.options || []).includes(v)) return `« ${d.label} » : choisissez dans la liste.`;
  }
  return '';
}
// nouvelle opération : valeurs par défaut des champs (standard et personnalisés)
function formulaireDefauts(db, catId, type, s, garder) {
  const cfg = formulaireDe(db, catId); const g = garder || {};
  champsStd(type).forEach((c) => {
    const x = champCfg(cfg, c.k); if (x.defaut == null || x.defaut === '' || (Array.isArray(x.defaut) && !x.defaut.length) || g[c.k]) return;
    if (c.ligne) { const k = c.k.slice(2); s.entrees = (s.entrees || []).map((e) => (vide(e[k]) || k === 'qualifId' || k === 'couleur' || k === 'cepageId' ? { ...e, [k]: x.defaut } : e)); return; }
    s[c.k] = Array.isArray(x.defaut) ? [...x.defaut] : x.defaut;
  });
  const ch = { ...(s.champs || {}) }; cfg.perso.forEach((d) => { if (ch[d.id] == null && d.defaut != null && d.defaut !== '' && d.type !== 'calcul') ch[d.id] = d.type === 'multi' ? [].concat(d.defaut) : d.type === 'ouinon' ? d.defaut === true || d.defaut === 'oui' : d.defaut; });
  if (Object.keys(ch).length) s.champs = ch;
  return s;
}
// valeurs par défaut d'une nouvelle ligne de moût
const ligneDefauts = (db, catId, e) => { const cfg = formulaireDe(db, catId); const out = { ...e }; ['qualifId', 'couleur', 'fractionId', 'cepageId', 'millesime'].forEach((k) => { const x = champCfg(cfg, `e.${k}`); if (x.defaut != null && x.defaut !== '') out[k] = x.defaut; }); return out; };

/* ---------- fiches à imprimer : chaque champ personnalisé devient une donnée pré-remplie (clé cf<id>) ---------- */
const CHAMPS_FICHE = []; // [[clé, libellé (opération)]]
function syncFormulaires(db) {
  const L = []; ((db && db.formulaires) || []).forEach((x) => { const op = opList(db).find((o) => o.id === x.id); (x.perso || []).forEach((p) => { if (p && p.id) L.push([`cf${p.id}`, `${p.label} (${op ? op.label : x.id})`]); }); });
  CHAMPS_FICHE.splice(0, CHAMPS_FICHE.length, ...L);
}
// valeurs des champs personnalisés d'une fiche : { cf<id>: texte }
function champsAtomes(db, type, f) {
  const ch = Array.isArray(f && f.champs) ? f.champs : champsValeurs(formulaireDe(db, (f && f.sousType) || type).perso, (f && f.champs) || {}, formuleVarsStd(type, f || {}), []);
  const o = {}; ch.forEach((c) => { if (c && c.id) o[`cf${c.id}`] = champValeurTexte(c); }); return o;
}

/* ---------- enregistrement de la configuration ---------- */
function formulaireSave(db, catId, s) {
  const cat = opList(db).find((x) => x.id === catId) || (OP_LABELS0[catId] ? { id: catId, base: catId } : null); if (!cat) return fail('Opération introuvable.');
  const type = cat.base || catId; const champs = {};
  Object.keys((s && s.champs) || {}).forEach((k) => {
    const c = s.champs[k] || {}; const st = champStd(type, k); const x = {};
    if (st && st.ess) { if (c.libelle) x.libelle = String(c.libelle).trim().slice(0, 60); if (c.aide) x.aide = String(c.aide).trim().slice(0, 300); if (Object.keys(x).length) champs[k] = x; return; }
    if (['replie', 'masque'].includes(c.vis)) x.vis = c.vis;
    if (c.obligatoire && c.vis !== 'masque' && !(st && st.noObl)) x.obligatoire = true;
    if (c.libelle && String(c.libelle).trim() && !(st && st.bare)) x.libelle = String(c.libelle).trim().slice(0, 60);
    if (c.aide && String(c.aide).trim()) x.aide = String(c.aide).trim().slice(0, 300);
    if (c.defaut != null && c.defaut !== '' && !(Array.isArray(c.defaut) && !c.defaut.length) && (!st || st.def)) x.defaut = Array.isArray(c.defaut) ? c.defaut.slice(0, 30) : String(c.defaut).slice(0, 120);
    if (Object.keys(x).length) champs[k] = x;
  });
  const perso = []; const codes = new Set(['volume', 'litres', 'kg', 'bouteilles', 'temperature', 'densite', 'jours', 'dosage', 'min', 'max', 'abs', 'arrondi']); const labels = new Set();
  for (const p0 of ((s && s.perso) || [])) {
    const p = { ...p0 }; const label = String(p.label || '').trim().slice(0, 60); if (!label) return fail('Chaque champ personnalisé doit avoir un nom.');
    if (labels.has(norm(label))) return fail(`Deux champs s’appellent « ${label} ».`); labels.add(norm(label));
    if (!CP_TYPES.some((t) => t[0] === p.type)) return fail(`« ${label} » : type de champ inconnu.`);
    const id = /^[a-z][a-z0-9]{2,30}$/.test(String(p.id || '')) ? p.id : nouvelIdChamp();
    let code = String(p.code || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '') || codeDe(label); if (/^[0-9]/.test(code)) code = `c${code}`;
    const base = code; let k = 2; while (codes.has(code)) { code = `${base}${k}`; k += 1; } codes.add(code);
    const opts = uniq((p.options || []).map((o) => String(o || '').trim()).filter(Boolean)).slice(0, 60);
    if (['liste', 'multi'].includes(p.type) && !opts.length) return fail(`« ${label} » : ajoutez au moins un choix.`);
    if (hasNum(p.min) && hasNum(p.max) && num(p.min) > num(p.max)) return fail(`« ${label} » : le minimum dépasse le maximum.`);
    const it = { id, code, label, type: p.type, position: p.position === 'debut' ? 'debut' : 'fin', ...(p.obligatoire && p.type !== 'calcul' ? { obligatoire: true } : {}), ...(p.journal === false ? { journal: false } : {}),
      ...(String(p.aide || '').trim() ? { aide: String(p.aide).trim().slice(0, 300) } : {}), ...(String(p.unite || '').trim() && CP_NUM.concat(['texte']).includes(p.type) ? { unite: String(p.unite).trim().slice(0, 16) } : {}),
      ...(CP_NUM.includes(p.type) && hasNum(p.dec) ? { dec: Math.max(0, Math.min(4, Math.round(num(p.dec)))) } : {}), ...(p.type === 'nombre' && hasNum(p.min) ? { min: num(p.min) } : {}), ...(p.type === 'nombre' && hasNum(p.max) ? { max: num(p.max) } : {}),
      ...(['liste', 'multi'].includes(p.type) ? { options: opts } : {}) };
    if (p.type === 'calcul') it.formule = String(p.formule || '').trim().slice(0, 300);
    if (p.defaut != null && p.defaut !== '' && p.type !== 'calcul') it.defaut = p.type === 'multi' ? [].concat(p.defaut).filter((x) => opts.includes(x)) : p.type === 'ouinon' ? !!(p.defaut === true || p.defaut === 'oui') : String(p.defaut).slice(0, 120);
    if (it.defaut === false || (Array.isArray(it.defaut) && !it.defaut.length)) delete it.defaut;
    perso.push(it);
  }
  // formules : syntaxe et variables connues (champs numériques de ce formulaire ou valeurs de l'opération)
  const numCodes = new Set([...FORMULE_STD.map((x) => x[0]), ...perso.filter((p) => CP_NUM.includes(p.type)).map((p) => p.code)]);
  for (const p of perso.filter((x) => x.type === 'calcul')) {
    let a; try { a = formuleAnalyser(p.formule); } catch (e) { return fail(`Formule de « ${p.label} » : ${e.message}.`); }
    const inc = a.vars.filter((v) => !numCodes.has(v)); if (inc.length) return fail(`Formule de « ${p.label} » : variable inconnue « ${inc[0]} ».`); if (a.vars.includes(p.code)) return fail(`Formule de « ${p.label} » : un champ ne peut pas se calculer à partir de lui-même.`);
  }
  if (!Array.isArray(db.formulaires)) db.formulaires = [];
  const i = db.formulaires.findIndex((x) => x.id === catId); const item = { ...(i >= 0 ? db.formulaires[i] : {}), id: catId, champs, perso, modifieLe: todayISO() };
  if (i >= 0) db.formulaires[i] = item; else db.formulaires.push(item);
  return okr({ perso });
}
function formulaireReset(db, catId) { db.formulaires = (db.formulaires || []).filter((x) => x.id !== catId); return okr(); }
function formulaireCopier(db, deId, versId) { const src = formulaireBrut(db, deId); if (!src) return fail('Ce formulaire n’est pas personnalisé.'); const c = clone(src); c.perso = (c.perso || []).map((p) => ({ ...p, id: nouvelIdChamp() })); return formulaireSave(db, versId, c); }
