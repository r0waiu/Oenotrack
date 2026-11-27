/* ============ PLAFONDS DES REVENDICATIONS, CUMUL DES INTRANTS, SO₂ TOTAL ESTIMÉ (0.30.0-alpha.1) ============
   db.plafonds (absent : exemples ci-dessous, « à vérifier ») :
     { id, qualifId, objet: 'so2t', vin: rouge | blanc_rose | effervescent | tous, valeur, unite: 'mg/L', note, source, exemple, aVerifier, verifiePar, verifieLe }
     { id, qualifId, objet: 'substance', mot (mots-clés séparés par « | »), libelle, autorise, doseMax, unite: 'g/hL' | 'mL/hL', note, source, aVerifier, … }
   Une règle de substance (cahier des charges) s'ajoute à la règle du produit : la plus restrictive l'emporte (interdiction, dose maximale).
   Cumul des intrants (R.conc, calculé au rejeu) : dose apportée par hL du lot, transmise au prorata des volumes (assemblages, tirage).
   SO₂ total estimé = dernière analyse du lot + ajouts depuis (produits dont la teneur en SO₂ est connue). Dépassement : avertir + motif tracé. */
const VINS_TYPES = [{ id: 'effervescent', label: 'Vins effervescents' }, { id: 'blanc_rose', label: 'Vins blancs et rosés' }, { id: 'rouge', label: 'Vins rouges' }, { id: 'tous', label: 'Tous les vins' }];
const vinTypeLabel = (id) => (VINS_TYPES.find((v) => v.id === id) || { label: id || '—' }).label;
const PLAFONDS_SOURCES = {
  ue: 'Règlement délégué (UE) 2019/934, annexe I B — exemple à vérifier',
  bio: 'Règlement (UE) 2018/848 (vin biologique) : plafonds de l’UE réduits de 30 mg/L — exemple à vérifier',
  dem: 'Cahier des charges vinification Demeter France — exemple à vérifier (dérogations possibles)',
};
const PLAFONDS_EXEMPLES = () => [
  ['conv', 'rouge', 150, 'sucres < 5 g/L (200 au-delà)', 'ue'], ['conv', 'blanc_rose', 200, 'sucres < 5 g/L (250 au-delà)', 'ue'], ['conv', 'effervescent', 185, 'vins mousseux de qualité (235 pour les autres vins mousseux)', 'ue'],
  ['bio', 'rouge', 100, 'sucres < 2 g/L (120 de 2 à 5 g/L, 170 au-delà)', 'bio'], ['bio', 'blanc_rose', 150, 'sucres < 2 g/L (170 de 2 à 5 g/L, 220 au-delà)', 'bio'], ['bio', 'effervescent', 155, 'vins mousseux de qualité (205 pour les autres vins mousseux)', 'bio'],
  ['dem', 'rouge', 70, 'sucres < 5 g/L ; dérogation possible à 100', 'dem'], ['dem', 'blanc_rose', 90, 'sucres < 5 g/L ; dérogation possible à 120', 'dem'], ['dem', 'effervescent', 70, 'sucres < 10 g/L (100 au-delà) ; dérogation possible à 100', 'dem'],
].map(([qualifId, vin, valeur, note, s]) => ({ id: `ex-${qualifId}-${vin}`, qualifId, objet: 'so2t', vin, valeur, unite: 'mg/L', note, source: PLAFONDS_SOURCES[s], exemple: true, aVerifier: true }));
const plafondsDe = (db) => (Array.isArray(db && db.plafonds) ? db.plafonds.filter((p) => p && p.id && ['so2t', 'substance'].includes(p.objet)) : PLAFONDS_EXEMPLES());
// première modification : les exemples deviennent des données de la cave (synchronisées), qu'on peut valider, corriger ou retirer
function plafondsMaterialiser(db) { if (!Array.isArray(db.plafonds)) db.plafonds = PLAFONDS_EXEMPLES(); return db.plafonds; }
const plafondQualifOK = (db, q) => qualifList(db).some((x) => x.id === q);
// champs gérés par cette version (les autres, ajoutés par une version suivante, sont conservés à la modification)
const PLAFOND_CHAMPS = ['objet', 'vin', 'valeur', 'unite', 'mot', 'libelle', 'autorise', 'doseMax', 'note', 'source', 'aVerifier', 'verifiePar', 'verifieLe'];
function plafondSave(db, s, id, uid) {
  s = s || {}; if (!plafondQualifOK(db, s.qualifId)) return fail('Choisissez la revendication.');
  const L = plafondsMaterialiser(db); const old = id ? L.find((p) => p.id === id) : null; if (id && !old) return fail('Plafond introuvable.');
  const base = { qualifId: s.qualifId, note: String(s.note || '').trim().slice(0, 200), source: String(s.source || '').trim().slice(0, 240) };
  let x;
  if (s.objet === 'substance') {
    const mot = String(s.mot || '').split('|').map((m) => catCle(m)).filter((m) => m.length >= 3).join('|'); if (!mot) return fail('Mot-clé de la substance requis (3 lettres au moins).');
    const doseMax = hasNum(s.doseMax) ? num(s.doseMax) : null; if (doseMax != null && doseMax < 0) return fail('Dose maximale invalide.');
    x = { ...base, objet: 'substance', mot, libelle: String(s.libelle || s.mot || '').trim().slice(0, 80), autorise: s.autorise !== false, doseMax: s.autorise === false ? null : doseMax, unite: s.unite === 'mL/hL' ? 'mL/hL' : 'g/hL' };
  } else {
    if (!VINS_TYPES.some((v) => v.id === s.vin)) return fail('Choisissez le type de vin.');
    if (!(num(s.valeur) > 0)) return fail('Plafond de SO₂ total invalide (mg/L).');
    x = { ...base, objet: 'so2t', vin: s.vin, valeur: num(s.valeur), unite: 'mg/L' };
  }
  const verifie = s.aVerifier === false ? { aVerifier: false, verifiePar: uid || s.verifiePar || '', verifieLe: s.verifieLe || todayISO() } : { aVerifier: true };
  if (old) { PLAFOND_CHAMPS.forEach((k) => { delete old[k]; }); Object.assign(old, x, verifie); return okr({ id: old.id }); } // champs inconnus (versions suivantes) gardés
  const nouv = { id: nid(db, 'pf'), ...x, ...verifie, cree: todayISO() }; L.push(nouv); return okr({ id: nouv.id });
}
function plafondValider(db, id, uid) { const p = plafondsMaterialiser(db).find((x) => x.id === id); if (!p) return fail('Plafond introuvable.'); p.aVerifier = false; p.verifiePar = uid || ''; p.verifieLe = todayISO(); return okr(); }
function plafondSupprimer(db, id) { const L = plafondsMaterialiser(db); const i = L.findIndex((x) => x.id === id); if (i < 0) return fail('Plafond introuvable.'); L.splice(i, 1); return okr(); }
// type de vin d'un lot pour le plafond de SO₂ : effervescent (Champagne, ou vin tiré), sinon selon la couleur
function lotTypeVin(db, R, lotId) {
  const fini = !(R && R.lots && R.lots[lotId]) && (db.lotsFinis || []).some((x) => x.id === lotId); if (fini) return 'effervescent'; // lot fini : dégorgé
  const l = (R && R.lots && R.lots[lotId]) || (db.lots || []).find((x) => x.id === lotId) || {};
  const st = stadeList(db).find((s) => s.id === l.stade); if ((st && st.phase === 'bout') || champenois(db)) return 'effervescent';
  return l.couleur === 'rouge' ? 'rouge' : 'blanc_rose';
}
// plafond de SO₂ total qui s'applique au lot (revendication + type de vin ; « tous les vins » à défaut) : le plus bas s'il y en a plusieurs
// 0.40.0-alpha.1 : plafonds du référentiel réglementaire (UE, labels de la revendication, labels visés par le lot) comparés aussi ; un plafond
// vérifié de l'exploitation pour la revendication et ce type de vin remplace ceux du référentiel (sauf labels visés par le lot)
function plafondSo2Lot(db, R, lotId) {
  const l = (R && R.lots && R.lots[lotId]) || (db.lots || []).find((x) => x.id === lotId) || (db.lotsFinis || []).find((x) => x.id === lotId); if (!l) return null; // lot fini (0.38.0-alpha.3)
  const t = lotTypeVin(db, R, lotId); const L = plafondsDe(db).filter((p) => p.objet === 'so2t' && p.qualifId === l.qualif);
  const c = L.filter((p) => p.vin === t); const m = (c.length ? c : L.filter((p) => p.vin === 'tous')).sort((a, b) => a.valeur - b.valeur);
  const ref = typeof refSo2Plafonds === 'function' ? refSo2Plafonds(db, R, lotId, t, m.some((p) => !p.aVerifier)) : [];
  const tous = [...m, ...ref].sort((a, b) => a.valeur - b.valeur || (a.referentiel ? 1 : 0) - (b.referentiel ? 1 : 0));
  return tous[0] ? { ...tous[0], typeVin: t } : null;
}
// règle de substance : concerne le produit si un mot-clé figure dans son nom, sa famille ou sa composition
const plafondConcerne = (x, p) => { const t = catCle(`${p.nom || ''} ${p.famille || ''} ${famLabel(p.famille)} ${p.composition || ''}`); return String(x.mot || '').split('|').some((m) => m.length >= 3 && ` ${t} `.includes(` ${m}`)); };
// règle effective d'un produit pour une revendication : règle du produit + règles de substance (la plus restrictive l'emporte)
// 0.40.0-alpha.1 : + avis du référentiel réglementaire (UE, appellation, labels de la revendication, labels visés « vises » du lot)
function regleEffective(db, p, qualifId, vises) {
  if (!p || !qualifId) return null; const base = ruleFor(db, p.id, qualifId);
  const subs = plafondsDe(db).filter((x) => x.objet === 'substance' && x.qualifId === qualifId && plafondConcerne(x, p));
  const ref = typeof refRegleProduit === 'function' ? refRegleProduit(db, p, qualifId, vises) : null;
  const restreint = !!(ref && (ref.interdit ? !!(base && base.autorise) || !base : ref.doseMax != null && base && base.autorise && (!hasNum(base.doseMax) || ref.doseMax < num(base.doseMax))));
  if (!subs.length && !restreint) return base; // le référentiel ne restreint rien : règle du produit telle quelle (UI : refRegleProduit pour ses conditions)
  let autorise = !!(base && base.autorise); let doseMax = base && hasNum(base.doseMax) ? num(base.doseMax) : null; const sources = []; const du = doseUnit(p.unite);
  subs.forEach((x) => { if (x.autorise === false) { if (autorise) sources.push(x); autorise = false; } else if (hasNum(x.doseMax) && x.unite === du && (doseMax == null || num(x.doseMax) < doseMax)) { doseMax = num(x.doseMax); sources.push(x); } });
  const o = { ...(base || { produitId: p.id, qualifId }), autorise, doseMax, aVerifier: !!((base && base.aVerifier) || sources.some((x) => x.aVerifier)), sources };
  if (ref) {
    o.ref = ref; o.conditions = ref.conditions;
    if (ref.interdit) { if (o.autorise) { o.refInterditPar = ref.interditPar; o.refInterditCompose = ref.interditCompose; o.aVerifier = o.aVerifier || ref.aVerifier; } o.autorise = false; o.refInterdit = true; o.refInterditPar = o.refInterditPar || ref.interditPar; o.refInterditCompose = o.refInterditCompose || ref.interditCompose; }
    else if (o.autorise && ref.doseMax != null && (o.doseMax == null || ref.doseMax < o.doseMax)) { o.doseMax = ref.doseMax; o.refDosePar = ref.dosePar; o.refDoseCompose = ref.doseCompose; o.aVerifier = o.aVerifier || ref.aVerifier; }
  }
  return o;
}
// teneur en SO₂ d'un produit (champ « so2 » : « 150 g/L », « 0,5 g/g », « 5 g/u »…) ramenée à son unité : grammes de SO₂ par unité saisie
function so2Teneur(p) {
  const m = /^(\d+(?:[.,]\d+)?)\s*(g|mg)\s*\/\s*(L|mL|kg|g|u)$/i.exec(String((p && p.so2) || '').trim()); if (!m) return null;
  let g = num(m[1]); if (m[2].toLowerCase() === 'mg') g /= 1000; const par = { l: 'L', ml: 'mL', kg: 'kg', g: 'g', u: 'u' }[m[3].toLowerCase()]; // 0.38.0-alpha.3 : « mg/ml », « g/KG »… reconnus
  const f = { L: { L: 1, mL: 1000 }, mL: { L: 0.001, mL: 1 }, kg: { kg: 1, g: 1000 }, g: { kg: 0.001, g: 1 }, u: { u: 1 } }[par]; const k = f && f[p.unite];
  return k ? g / k : null;
}
// produit sulfitant (teneur en SO₂ connue, famille « sulfitage » ou nom de sulfitant) : sa dose cumulée se contrôle par le SO₂ total estimé,
// pas par la dose maximale d'un ajout (la réglementation limite le SO₂ total du vin)
const produitSulfitant = (p) => !!p && (so2Teneur(p) != null || p.famille === 'sulfitage' || catFamilleDevine(p.nom) === 'sulfitage');
const prodDe = (db, id) => db.produits.find((p) => p.id === id) || { id, nom: '(produit supprimé)', unite: 'g' };
// intrants cumulés d'un lot : dose totale par hL (héritée des lots d'origine au prorata des volumes + apportée directement), plafond
function lotIntrantsCumul(db, R, lotId) {
  const c = (R.conc || {})[lotId] || {}; const d = (R.concDir || {})[lotId] || {}; const l = R.lots[lotId] || {};
  return Object.keys(c).filter((k) => k[0] !== '@' && c[k] > 1e-9).map((pid) => {
    const p = prodDe(db, pid); const r = regleEffective(db, p, l.qualif, l.labelsVises); const max = r && r.autorise && hasNum(r.doseMax) ? num(r.doseMax) : null;
    const dose = c[pid]; const direct = Math.min(dose, d[pid] || 0);
    const so2 = produitSulfitant(p); // contrôlé par le SO₂ total estimé
    return { produitId: pid, p, dose, direct, herite: Math.max(0, dose - direct), unite: doseUnit(p.unite), max: so2 ? null : max, so2, depasse: !so2 && max != null && dose > max + 1e-9, interdit: !!(l.qualif && !(r && r.autorise)), aVerifier: !!(r && r.aVerifier), regle: r };
  }).sort((a, b) => a.p.nom.localeCompare(b.p.nom, 'fr'));
}
// SO₂ total estimé d'un lot : dernière analyse (SO₂ total) + ajouts depuis ; sans analyse, cumul des ajouts depuis l'origine (héritage compris)
// SO₂ total d'un lot à une date, pendant le rejeu (0.38.0-alpha.3, lot fini issu d'un dégorgement) : dernière analyse jusqu'à cette date et
// ajouts depuis, sinon ajouts cumulés
function so2Herite(db, R, lotId, date) {
  const an = (db.analyses || []).filter((a) => a && a.lotId === lotId && a.valeurs && hasNum(a.valeurs.so2t) && a.date <= date).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).pop();
  const ev = ((R.so2Ev || {})[lotId] || []).filter((x) => x.date <= date);
  return an ? num(an.valeurs.so2t) + sum(ev.filter((x) => x.date >= an.date), (x) => x.mgL) : (((R.conc || {})[lotId] || {})['@so2'] || 0) * 10;
}
function so2TotalEstime(db, R, lotId) {
  const an = (db.analyses || []).filter((a) => a && a.lotId === lotId && a.valeurs && hasNum(a.valeurs.so2t) && (!R.upTo || a.date <= R.upTo)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).pop() || null;
  const ev = (R.so2Ev || {})[lotId] || []; const cumul = (((R.conc || {})[lotId] || {})['@so2'] || 0) * 10; // g/hL de SO₂ → mg/L
  const pf = plafondSo2Lot(db, R, lotId);
  if (an) { const apres = ev.filter((x) => x.date >= an.date); /* le jour de l'analyse : correction faite après le prélèvement */ const depuis = sum(apres, (x) => x.mgL); const estime = num(an.valeurs.so2t) + depuis; return { analyse: an, base: num(an.valeurs.so2t), depuis, ajouts: apres, estime, cumul, plafond: pf, depasse: !!(pf && estime > pf.valeur + 1e-9) }; }
  return { analyse: null, base: null, depuis: null, ajouts: ev, estime: cumul > 0 ? cumul : null, cumul, sansAnalyse: true, plafond: pf, depasse: !!(pf && cumul > pf.valeur + 1e-9) };
}
// produits de sulfitage sans teneur en SO₂ connue (le SO₂ qu'ils apportent n'entre pas dans l'estimation)
const so2TeneurInconnue = (db, R, lotId) => uniq((R.apps || []).filter((x) => x.lotId === lotId).map((x) => x.produitId)).map((id) => prodDe(db, id)).filter((p) => so2Teneur(p) == null && (p.famille === 'sulfitage' || catFamilleDevine(p.nom) === 'sulfitage'));

/* ---------- cahiers des charges : propositions lues dans le texte (script) ou par l'assistant IA, validées une à une ---------- */
const CAHIER_SUBSTANCES = [
  ['pvpp|polyvinylpolypyrrolidone', 'PVPP'], ['charbon', 'Charbon œnologique'], ['gelatine', 'Gélatine'], ['casein', 'Caséine, caséinates'], ['albumin|ovalbumin', 'Albumine d’œuf'], ['ichtyocolle|colle de poisson', 'Colle de poisson'],
  ['bentonite', 'Bentonite'], ['chitosan', 'Chitosane'], ['sorbique|sorbate', 'Acide sorbique, sorbate de potassium'], ['lysozym', 'Lysozyme'], ['metatartrique', 'Acide métatartrique'], ['carboxymethylcellulose|cmc', 'Carboxyméthylcellulose (CMC)'],
  ['polyaspartate', 'Polyaspartate de potassium'], ['gomme arabique', 'Gomme arabique'], ['tanin', 'Tanins'], ['ascorbique', 'Acide ascorbique'], ['citrique', 'Acide citrique'], ['dicarbonate|dmdc|velcorin', 'Dicarbonate de diméthyle'],
  ['copeaux|morceaux de bois', 'Morceaux de bois de chêne'], ['enzym', 'Enzymes'], ['levures inactiv', 'Levures inactivées'], ['mannoprot', 'Mannoprotéines'], ['acide tartrique', 'Acide tartrique'], ['acide lactique', 'Acide lactique'],
  ['acide malique', 'Acide malique'], ['bicarbonate', 'Bicarbonate de potassium'], ['carbonate de calcium', 'Carbonate de calcium'], ['cuivre', 'Sels de cuivre'], ['phosphate', 'Phosphate diammonique'], ['thiamine', 'Thiamine'],
  ['acide fumarique', 'Acide fumarique'], ['proteines de pois|proteine de pois', 'Protéines végétales (pois)'], ['silice|dioxyde de silicium', 'Dioxyde de silicium'], ['kaolin', 'Kaolin'], ['mcr|mout concentre rectifie', 'Moût concentré rectifié'], ['saccharose|sucre', 'Saccharose'],
];
const CAHIER_INTERDIT = /\b(interdit|interdits|interdite|interdites|non autorise|non autorises|non autorisee|non autorisees|proscrit|proscrits|exclu|exclus|n est pas autorise|ne sont pas autorises|pas autorise)\b/;
const CAHIER_DOSE = /(\d+(?:[.,]\d+)?)\s*(g|mg|cl|ml)\s*\/\s*(hl|l)\b/;
// type de vin nommé dans un bout de phrase : le premier (après la valeur) ou le plus proche de la valeur (avant elle)
const CAHIER_VINS = [['effervescent', /(effervescent|mousseux|petillant|champagne)/g], ['rouge', /\brouges?\b/g], ['blanc_rose', /\b(blancs?|roses?)\b/g]];
function cahierTypeVin(s, dernier) {
  let best = null; CAHIER_VINS.forEach(([k, re]) => { re.lastIndex = 0; let mm; while ((mm = re.exec(s))) { if (!best || (dernier ? mm.index > best.i : mm.index < best.i)) best = { k, i: mm.index }; } });
  return best ? best.k : null;
}
const cahierExtrait = (t, i, n) => t.slice(Math.max(0, i - (n || 90)), i + (n || 90)).replace(/\s+/g, ' ').trim();
// propositions : plafonds de SO₂ total par type de vin, substances interdites ou limitées (dose maximale)
function cahierPropositions(texte) {
  const brut = String(texte || ''); const t = norm(brut).replace(/[’']/g, ' '); const out = []; const vus = new Set(); const add = (x) => { const k = JSON.stringify([x.objet, x.vin || x.mot, x.autorise, x.valeur, x.doseMax]); if (!vus.has(k)) { vus.add(k); out.push({ id: `p${out.length + 1}`, ...x }); } };
  // SO₂ total : « 150 mg/l pour les vins blancs » (type après la valeur) ou « vins rouges : 100 mg/l » (type avant), dans un passage sur le SO₂
  const so2Re = /(so2|so 2|anhydride sulfureux|dioxyde de soufre|sulfites?)/g; let m;
  while ((m = so2Re.exec(t))) {
    const fen = t.slice(m.index, m.index + 420); const nRe = /(\d{2,3})\s*mg\s*\/\s*l/g; const N = []; let n;
    while ((n = nRe.exec(fen))) N.push({ i: n.index, f: n.index + n[0].length, v: num(n[1]) });
    N.forEach((x, k) => {
      const fin = k + 1 < N.length ? N[k + 1].i : fen.length; const apres = fen.slice(x.f, fin).split(/[;.\n]/)[0];
      const debut = k ? N[k - 1].f : 0; const avant = fen.slice(debut, x.i).split(/[;.\n]/).pop();
      const p = /\bpour\b/.exec(apres); const ty = (p && cahierTypeVin(apres.slice(p.index, p.index + 60), false)) || cahierTypeVin(avant, true) || 'tous';
      if (x.v >= 20 && x.v <= 400) add({ objet: 'so2t', vin: ty, valeur: x.v, unite: 'mg/L', extrait: cahierExtrait(t, m.index + x.i, 110) });
    });
  }
  // substances : interdiction ou dose maximale dans la même phrase
  const phrases = t.split(/(?<=[.;:!?\n])\s+/);
  phrases.forEach((ph) => CAHIER_SUBSTANCES.forEach(([mots, libelle]) => {
    const alt = mots.split('|'); const i = alt.map((a) => ph.indexOf(a)).filter((x) => x >= 0).sort((a, b) => a - b)[0]; if (i === undefined) return;
    if (CAHIER_INTERDIT.test(ph)) { add({ objet: 'substance', mot: mots, libelle, autorise: false, doseMax: null, unite: 'g/hL', extrait: ph.slice(0, 220) }); return; }
    const d = CAHIER_DOSE.exec(ph.slice(i)); if (!d) return;
    let v = num(d[1]); let u = 'g/hL'; const mu = d[2]; if (mu === 'mg') v /= 1000; if (mu === 'cl') { v *= 10; u = 'mL/hL'; } if (mu === 'ml') u = 'mL/hL'; if (d[3] === 'l') v *= 100;
    add({ objet: 'substance', mot: mots, libelle, autorise: true, doseMax: Math.round(v * 1000) / 1000, unite: u, extrait: ph.slice(0, 220) });
  }));
  return out;
}
function cahierIaPrompt(texte, qualifNom) {
  const system = 'Tu relèves les limites d’un cahier des charges viticole ou œnologique. Tu réponds uniquement par un objet JSON valide, sans texte autour.';
  const t = `Cahier des charges${qualifNom ? ` (revendication « ${qualifNom} »)` : ''}.\nTexte :\n"""\n${String(texte || '').slice(0, 14000)}\n"""\n\nRéponds : {"so2":[{"vin":"effervescent|blanc_rose|rouge|tous","max_mg_l":nombre,"condition":"…","extrait":"phrase du texte"}],"substances":[{"nom":"…","mots_cles":"mot1|mot2","autorise":true|false,"dose_max":nombre ou null,"unite":"g/hL|mL/hL","extrait":"phrase du texte"}]}. Seulement ce que le texte dit explicitement ; n’invente rien.`;
  return { system, texte: t };
}
function cahierIaLire(o) {
  const out = []; const so2 = o && Array.isArray(o.so2) ? o.so2 : []; const subs = o && Array.isArray(o.substances) ? o.substances : [];
  so2.slice(0, 40).forEach((x) => { const v = num(x.max_mg_l); if (v > 0 && v < 1000) out.push({ id: `p${out.length + 1}`, objet: 'so2t', vin: VINS_TYPES.some((y) => y.id === x.vin) ? x.vin : 'tous', valeur: v, unite: 'mg/L', note: iaTexte(x.condition, 160), extrait: iaTexte(x.extrait, 240), ia: true }); });
  subs.slice(0, 120).forEach((x) => { const mot = String(x.mots_cles || x.nom || '').split('|').map(catCle).filter((m) => m.length >= 3).join('|'); if (!mot) return; const dm = x.dose_max == null || x.dose_max === '' ? null : num(x.dose_max);
    out.push({ id: `p${out.length + 1}`, objet: 'substance', mot, libelle: iaTexte(x.nom, 80) || mot, autorise: x.autorise !== false, doseMax: x.autorise === false ? null : dm, unite: x.unite === 'mL/hL' ? 'mL/hL' : 'g/hL', extrait: iaTexte(x.extrait, 240), ia: true }); });
  return out;
}
// propositions retenues : enregistrées comme validées (relues par l'utilisateur), un plafond de SO₂ remplace celui du même type de vin
function cahierAppliquer(db, qualifId, props, source, uid) {
  if (!plafondQualifOK(db, qualifId)) return fail('Choisissez la revendication.'); if (!(props || []).length) return fail('Aucune proposition retenue.');
  const L = plafondsMaterialiser(db); let n = 0;
  for (const p of props) {
    const s = { ...p, qualifId, source: source || p.source || '', note: p.note || '', aVerifier: false };
    let id = null; if (p.objet === 'so2t') { const ex = L.find((x) => x.objet === 'so2t' && x.qualifId === qualifId && x.vin === p.vin); if (ex) id = ex.id; }
    else { const ex = L.find((x) => x.objet === 'substance' && x.qualifId === qualifId && x.mot === String(p.mot || '').split('|').map(catCle).join('|')); if (ex) id = ex.id; }
    const r = plafondSave(db, s, id, uid); if (!r.ok) return r; n += 1;
  }
  return okr({ n });
}
