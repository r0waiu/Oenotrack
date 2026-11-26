/* ============ DRM — DÉCLARATION RÉCAPITULATIVE DES ENTRÉES ET SORTIES DE VINS (0.32.0-alpha.1) ============
   Mensuelle (DRM) ou annuelle (DRA, petits producteurs), au choix. Trois moyens : fichier XML DTI+ pour CIEL (douane), le même fichier
   avec les codes produits du CIVC (à déposer sur la plateforme de l'interprofession), impression et CSV. Pas de compte CRD (choix de
   l'utilisateur). Format DTI+ des entrepositaires agréés viticoles (schéma ciel-dti-plus-viti, version 1.0.9) : racine mouvements-balances,
   balances des produits en droits suspendus ; volumes en hL (5 décimales au plus).
   db.drmProduits (absent : exemples selon la région, « à vérifier », copiés dans la base à la 1re modification ; champs inconnus gardés) :
     { id, libelle (libellé personnalisé, celui du compte CIEL), codeInao, libelleFiscal, codeCivc, tav, nature: tranquille | mousseux | '',
       fractions: [ids], sansFractions: [ids], manuel (aucun rattachement automatique), exemple, aVerifier }
   db.drmRattachements [{ id: lotId, produitId }] : rattachement manuel d'un lot (sinon : la règle la plus précise qui convient).
   db.drmSorties [{ id: `${periode}|${produitId}`, periode, produitId, ventesFrance, ventesFranceAnt, definitives, degustation, autres,
     entrees, obs }] : bouteilles finies sorties (ou entrées) dans la période, saisies à la DRM, en bouteilles équivalent 75 cl.
   db.drmDeclarations [{ id: periode, periode, deposeeLe, par, produits: [{ produitId, libelle, s0, s1, E, S }] }] : DRM déposées.
   settings.drm { accise, cvi, civc, periodicite: mensuelle | annuelle }. Période : « M:2026-10 » (mois) ou « A:<campagne> » (DRA). */
const DRM_BOUTEILLE_L = 0.75;
const DRM_NS = 'http://douane.finances.gouv.fr/app/ciel/dtiplus/v1';
// libellés fiscaux des vins (liste complète dans le schéma de la douane) ; un produit a un code INAO ou, à défaut, un libellé fiscal
const DRM_LIBELLES_FISCAUX = [['VT_IG_AOP', 'Vins tranquilles avec IG – AOP'], ['VT_IG_IGP', 'Vins tranquilles avec IG – IGP'], ['VT_SANS_IG_CEPAGE', 'Vins tranquilles sans IG – avec mention du cépage'],
  ['VT_SANS_IG_AUTRES', 'Vins tranquilles sans IG – autres'], ['VM_IG_AOP', 'Vins mousseux avec IG – AOP'], ['VM_IG_IGP', 'Vins mousseux avec IG – IGP'], ['VM_SANS_IG_CEPAGE', 'Vins mousseux sans IG – avec mention du cépage'],
  ['VM_SANS_IG_AUTRES', 'Vins mousseux sans IG – autres']];
const DRM_NATURES = [['tranquille', 'Vins tranquilles (moûts et vins en cuve)'], ['mousseux', 'Vins mousseux (bouteilles tirées, sur lattes, dégorgées)']];
// rubriques de la balance : [clé, libellé, chemin dans le fichier DTI+]
const DRM_ENTREES = [
  ['production', 'Volume produit (récolte, pressurage)', ['entrees-periode', 'volume-produit']],
  ['achats', 'Achats, réintégrations (moûts et vins achetés)', ['entrees-periode', 'achats-reintegrations']],
  ['transfertE', 'Transferts depuis un autre produit (tirage, assemblage)', ['entrees-periode', 'mouvements-internes', 'replis-declassement-transfert-changement-appellation']],
  ['manipE', 'Manipulations : augmentation de volume (liqueurs, préparations)', ['entrees-periode', 'mouvements-internes', 'manipulations']],
  ['autresE', 'Autres entrées (reprises de stock, excédents)', ['entrees-periode', 'autres-entrees']],
];
const DRM_SORTIES = [
  ['ventesFrance', 'Ventes France sous CRD', ['sorties-periode', 'ventes-france-crd-suspendus', 'annee-courante']],
  ['definitives', 'Sorties définitives (export, UE, vrac, lies et distillation)', ['sorties-periode', 'sorties-sans-paiement-droits', 'sorties-definitives']],
  ['degustation', 'Consommation familiale, dégustation, échantillons', ['sorties-periode', 'sorties-sans-paiement-droits', 'consommation-familiale-degustation']],
  ['transfertS', 'Transferts vers un autre produit (tirage, assemblage)', ['sorties-periode', 'sorties-sans-paiement-droits', 'mouvements-internes', 'replis-declassement-transfert-changement-appellation']],
  ['internesS', 'Autres mouvements internes (bourbes, lies, soutirages, pertes de manipulation)', ['sorties-periode', 'sorties-sans-paiement-droits', 'mouvements-internes', 'autres-mouvements-internes']],
  ['autresS', 'Autres sorties (pertes accidentelles, destructions)', ['sorties-periode', 'sorties-sans-paiement-droits', 'autres-sorties']],
];
// saisie des bouteilles finies (équivalent 75 cl) : sorties et entrées de la période
const DRM_SAISIES = [['ventesFrance', 'Ventes France (CRD)'], ['definitives', 'Export, UE (DAE)'], ['degustation', 'Dégustation, consommation familiale'], ['autres', 'Autres sorties (casse…)'], ['entrees', 'Entrées (reprise de stock, retours)']];

/* ---------- réglages et produits ---------- */
const drmReglage = (db) => { const s = (db && db.settings && db.settings.drm) || {}; return { accise: String(s.accise || ''), cvi: String(s.cvi || ''), civc: String(s.civc || ''), periodicite: s.periodicite === 'annuelle' ? 'annuelle' : 'mensuelle' }; };
const drmAcciseOk = (x) => /^[A-Za-z]{2}[0-9A-Za-z]{11}$/.test(String(x || ''));
const DRM_EXEMPLES = (db) => (champenois(db) ? [
  { id: 'ex-champ-vt', libelle: 'Champagne — vins tranquilles (moûts, vins de base, réserves)', libelleFiscal: 'VT_IG_AOP', nature: 'tranquille', sansFractions: ['rebeche', 'lies', 'bourbes'] },
  { id: 'ex-champ-vm', libelle: 'Champagne — vins mousseux (bouteilles tirées)', libelleFiscal: 'VM_IG_AOP', nature: 'mousseux' },
  { id: 'ex-rebeches', libelle: 'Rebêches', libelleFiscal: 'VT_SANS_IG_AUTRES', fractions: ['rebeche'] },
  { id: 'ex-lies', libelle: 'Lies et bourbes', libelleFiscal: 'VT_SANS_IG_AUTRES', fractions: ['lies', 'bourbes'] },
  { id: 'ex-coteaux', libelle: 'Coteaux champenois', libelleFiscal: 'VT_IG_AOP', manuel: true },
  { id: 'ex-riceys', libelle: 'Rosé des Riceys', libelleFiscal: 'VT_IG_AOP', manuel: true },
] : [
  { id: 'ex-vt-aop', libelle: 'Vins tranquilles AOP', libelleFiscal: 'VT_IG_AOP', nature: 'tranquille' },
  { id: 'ex-vm-aop', libelle: 'Vins mousseux AOP', libelleFiscal: 'VM_IG_AOP', nature: 'mousseux' },
]).map((p) => ({ codeInao: '', codeCivc: '', tav: null, nature: '', fractions: [], sansFractions: [], manuel: false, ...p, exemple: true, aVerifier: true }));
const drmProduitsDe = (db) => (Array.isArray(db && db.drmProduits) ? db.drmProduits.filter((p) => p && p.id) : DRM_EXEMPLES(db));
function drmProduitsMaterialiser(db) { if (!Array.isArray(db.drmProduits)) db.drmProduits = DRM_EXEMPLES(db); return db.drmProduits; }
const DRM_PRODUIT_CHAMPS = ['libelle', 'codeInao', 'libelleFiscal', 'codeCivc', 'tav', 'nature', 'fractions', 'sansFractions', 'manuel', 'aVerifier', 'verifiePar', 'verifieLe']; // les autres sont gardés
const drmCode = (p) => (p ? String(p.codeInao || '').trim() || String(p.libelleFiscal || '').trim() : '');
function drmProduitSave(db, s, id, uid) {
  s = s || {}; const libelle = String(s.libelle || '').trim().slice(0, 100); if (!libelle) return fail('Libellé du produit requis (celui de votre compte CIEL).');
  const L = drmProduitsMaterialiser(db); const old = id ? L.find((x) => x.id === id) : null; if (id && !old) return fail('Produit introuvable.');
  if (L.some((x) => x.id !== id && norm(x.libelle) === norm(libelle))) return fail('Un produit porte déjà ce libellé.');
  const inao = String(s.codeInao || '').trim().toUpperCase(); const lf = String(s.libelleFiscal || '').trim();
  if (inao && (inao.length < 5 || inao.length > 8)) return fail('Code INAO : 5 à 8 caractères.');
  if (!inao && !lf) return fail('Indiquez le code INAO du produit ou, à défaut, son libellé fiscal.');
  const civc = String(s.codeCivc || '').trim().toUpperCase(); if (civc && (civc.length < 5 || civc.length > 8)) return fail('Code CIVC : 5 à 8 caractères (repris dans le fichier pour le CIVC).');
  const tav = String(s.tav == null ? '' : s.tav).trim() === '' ? null : num(s.tav); if (tav != null && !(tav > 0.5 && tav < 100)) return fail('TAV : entre 0,5 et 100 % vol.');
  const liste = (x) => uniq((Array.isArray(x) ? x : []).map(String).filter(Boolean)).slice(0, 20);
  const x = { libelle, codeInao: inao, libelleFiscal: lf, codeCivc: civc, tav, nature: ['tranquille', 'mousseux'].includes(s.nature) ? s.nature : '', fractions: liste(s.fractions), sansFractions: liste(s.sansFractions), manuel: !!s.manuel };
  const verifie = s.aVerifier === false ? { aVerifier: false, verifiePar: uid || '', verifieLe: todayISO() } : { aVerifier: true };
  if (old) { DRM_PRODUIT_CHAMPS.forEach((k) => { delete old[k]; }); Object.assign(old, x, verifie); return okr({ id: old.id }); }
  const nouv = { id: nid(db, 'drmp'), ...x, ...verifie }; L.push(nouv); return okr({ id: nouv.id });
}
function drmProduitSupprimer(db, id) {
  const L = drmProduitsMaterialiser(db); const i = L.findIndex((x) => x.id === id); if (i < 0) return fail('Produit introuvable.');
  if ((db.drmDeclarations || []).some((d) => (d.produits || []).some((p) => p.produitId === id))) return fail('Ce produit figure dans une DRM déposée : gardez-le (rattachement manuel seulement) ou rouvrez la déclaration.');
  L.splice(i, 1); db.drmRattachements = (db.drmRattachements || []).filter((r) => r.produitId !== id); return okr();
}
function drmProduitDeplacer(db, id, delta) { const L = drmProduitsMaterialiser(db); const i = L.findIndex((x) => x.id === id); const j = i + delta; if (i < 0 || j < 0 || j >= L.length) return okr(); [L[i], L[j]] = [L[j], L[i]]; return okr(); }
function drmRattacher(db, lotId, produitId) {
  if (!lotId) return fail('Lot introuvable.'); db.drmRattachements = (db.drmRattachements || []).filter((r) => r && r.id !== lotId);
  if (produitId) { if (!drmProduitsDe(db).some((p) => p.id === produitId)) return fail('Produit introuvable.'); drmProduitsMaterialiser(db); db.drmRattachements.push({ id: lotId, produitId }); }
  return okr();
}
const drmReglageSet = (db, patch) => {
  const r = { ...((db.settings && db.settings.drm) || {}), ...patch };
  if (r.accise && !drmAcciseOk(r.accise)) return fail('N° d’accise : 13 caractères (2 lettres puis 11 lettres ou chiffres, ex. FR012345E6789).');
  db.settings.drm = { ...r, accise: String(r.accise || '').trim().toUpperCase(), cvi: String(r.cvi || '').trim().slice(0, 20), civc: String(r.civc || '').trim().slice(0, 20), periodicite: r.periodicite === 'annuelle' ? 'annuelle' : 'mensuelle' };
  return okr();
};

/* ---------- périodes ---------- */
const drmFinMois = (ym) => { const [y, m] = ym.split('-').map(Number); const d = new Date(Date.UTC(y, m, 0)); return d.toISOString().slice(0, 10); };
function drmPeriode(db, key) {
  const k = String(key || '');
  if (/^M:\d{4}-\d{2}$/.test(k)) { const ym = k.slice(2); const [y, m] = ym.split('-').map(Number); if (m < 1 || m > 12) return null; return { key: k, type: 'M', d1: `${ym}-01`, d2: drmFinMois(ym), mois: m, annee: y, ym }; }
  if (/^A:/.test(k)) { const c = (db.campagnes || []).find((x) => x.id === k.slice(2)); if (!c) return null; return { key: k, type: 'A', d1: c.debut, d2: c.fin, mois: Number(c.fin.slice(5, 7)), annee: Number(c.fin.slice(0, 4)), campagne: c }; }
  return null;
}
// périodes proposées : les mois (du plus récent au plus ancien) depuis la première opération, ou les campagnes
function drmPeriodes(db, type, today) {
  const t = today || todayISO();
  if (type === 'annuelle') return [...(db.campagnes || [])].filter((c) => c.debut <= t).sort((a, b) => (a.debut < b.debut ? 1 : -1)).map((c) => `A:${c.id}`);
  const d0 = (db.ops || []).reduce((m, o) => (o.date && o.date < m ? o.date : m), t).slice(0, 7); const out = []; let ym = t.slice(0, 7);
  for (let i = 0; i < 240 && ym >= d0; i += 1) { out.push(`M:${ym}`); const [y, m] = ym.split('-').map(Number); ym = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; }
  return out;
}
const drmFinPeriode = (db, key) => { const p = drmPeriode(db, key); return p ? p.d2 : ''; };

/* ---------- rattachement des lots aux produits ---------- */
function drmNatureLot(db, Rs, lotId) {
  const l = (db.lots || []).find((x) => x.id === lotId) || {}; if (l.type === 'cuvee_tirage') return 'mousseux';
  const bout = stadeList(db).filter((s) => s.phase === 'bout').map((s) => s.id);
  return Rs.some((R) => R && ((R.tir && R.tir[lotId]) || (R.tirVol && R.tirVol[lotId] > 0) || (R.lots && R.lots[lotId] && bout.includes(R.lots[lotId].stade)))) ? 'mousseux' : 'tranquille';
}
function drmFractionLot(db, R, lotId) {
  const l = (R && R.lots && R.lots[lotId]) || (db.lots || []).find((x) => x.id === lotId) || {}; if (l.fractionId) return l.fractionId;
  try { return majoritaire(composition(db, R, lotId).fractions); } catch (e) { return ''; }
}
// produit d'un lot : rattachement manuel, sinon la règle la plus précise (fraction, puis nature) dans l'ordre de la liste
function drmProduitDuLot(db, P, Rs, lotId, cache) {
  if (cache && cache[lotId] !== undefined) return cache[lotId];
  const man = (db.drmRattachements || []).find((x) => x && x.id === lotId); let best = '';
  if (man && P.some((p) => p.id === man.produitId)) best = man.produitId;
  else {
    const nat = drmNatureLot(db, Rs, lotId); const R = Rs.find((r) => r && r.lots && r.lots[lotId]) || Rs[0]; const fr = drmFractionLot(db, R, lotId); let bs = -1;
    P.forEach((p) => { if (p.manuel) return; if (p.nature && p.nature !== nat) return; if ((p.fractions || []).length && !p.fractions.includes(fr)) return; if ((p.sansFractions || []).includes(fr)) return;
      const s = ((p.fractions || []).length ? 2 : 0) + (p.nature ? 1 : 0); if (s > bs) { bs = s; best = p.id; } });
  }
  if (cache) cache[lotId] = best; return best;
}
// volume d'une bouteille d'un lot tiré : volume tiré / bouteilles mises, sinon 75 cl
const drmVolBouteille = (R, t) => (R.tirVol && R.tirVol[t.lotId] > 0 && t.mis > 0 ? R.tirVol[t.lotId] / t.mis : DRM_BOUTEILLE_L);

/* ---------- saisies des bouteilles finies ---------- */
const drmSaisieDe = (db, periode, produitId) => (db.drmSorties || []).find((x) => x && x.periode === periode && x.produitId === produitId) || null;
function drmSaisieSet(db, periode, produitId, patch) {
  if (!drmPeriode(db, periode)) return fail('Période inconnue.'); if (!drmProduitsDe(db).some((p) => p.id === produitId)) return fail('Produit introuvable.');
  if ((db.drmDeclarations || []).some((d) => d.periode === periode)) return fail('Cette DRM est déposée : rouvrez-la pour la modifier.');
  if (!Array.isArray(db.drmSorties)) db.drmSorties = [];
  let x = drmSaisieDe(db, periode, produitId); if (!x) { x = { id: `${periode}|${produitId}`, periode, produitId }; db.drmSorties.push(x); }
  Object.keys(patch || {}).forEach((k) => { if (k === 'obs') x.obs = String(patch.obs || '').slice(0, 250); else if ([...DRM_SAISIES.map((s) => s[0]), 'ventesFranceAnt'].includes(k)) { const v = String(patch[k] == null ? '' : patch[k]).trim(); x[k] = v === '' ? 0 : Math.max(0, Math.round(num(v))); } });
  return okr();
}
// bouteilles finies (dégorgées, plus entrées saisies, moins sorties saisies) par produit, au soir du jour D ; une DRM mensuelle ne compte
// que les saisies mensuelles, une DRA compte aussi les saisies annuelles
function drmFinis(db, D, prodDe, type) {
  const s = {};
  (db.ops || []).forEach((o) => { if (o.type !== 'degorgement' || !o.date || o.date > D || !(num(o.nb) > 0)) return; const pid = prodDe(o.sourceLotId); s[pid] = (s[pid] || 0) + num(o.nb) * num(o.volBouteilleL || DRM_BOUTEILLE_L); });
  (db.drmSorties || []).forEach((x) => { if (type === 'M' && !String(x.periode).startsWith('M:')) return; const fin = drmFinPeriode(db, x.periode); if (!fin || fin > D) return; const n = num(x.entrees) - num(x.ventesFrance) - num(x.ventesFranceAnt) - num(x.definitives) - num(x.degustation) - num(x.autres); s[x.produitId] = (s[x.produitId] || 0) + n * DRM_BOUTEILLE_L; });
  return s;
}

/* ---------- calcul de la balance d'une période ---------- */
function drmCalcul(db, key) {
  const per = drmPeriode(db, key); if (!per) return null;
  const P = drmProduitsDe(db); const R0 = getR(db, addDays(per.d1, -1)); const R1 = getR(db, per.d2); const cache = {};
  const prodDe = (lotId) => drmProduitDuLot(db, P, [R1, R0], lotId, cache);
  const lignes = {}; const L = (pid) => (lignes[pid] = lignes[pid] || { produitId: pid, s0: 0, s1: 0, E: {}, S: {}, obs: [], ecart: 0 });
  const add = (pid, sens, k, v, obs) => { if (!(v > 1e-9)) return; const x = L(pid); x[sens][k] = (x[sens][k] || 0) + v; if (obs && !x.obs.includes(obs)) x.obs.push(obs); };
  const F0 = drmFinis(db, addDays(per.d1, -1), prodDe, per.type); const F1 = drmFinis(db, per.d2, prodDe, per.type); // bouteilles finies (L)
  const stock = (R, f) => { const s = {}; Object.values(R.portions).forEach((p) => { const pid = prodDe(p.lotId); s[pid] = (s[pid] || 0) + p.vol; });
    Object.values(R.tir).forEach((t) => { if (t.nb > 0) { const pid = prodDe(t.lotId); s[pid] = (s[pid] || 0) + t.nb * drmVolBouteille(R, t); } });
    Object.keys(f).forEach((pid) => { s[pid] = (s[pid] || 0) + f[pid]; }); return s; };
  const S0 = stock(R0, F0); const S1 = stock(R1, F1);
  Object.keys(S0).forEach((pid) => { L(pid).s0 = S0[pid]; }); Object.keys(S1).forEach((pid) => { L(pid).s1 = S1[pid]; });
  const dans = (d) => d && d >= per.d1 && d <= per.d2; const ops = Object.fromEntries((db.ops || []).map((o) => [o.id, o])); const prep = {};
  R1.flows.filter((f) => dans(f.date)).forEach((f) => {
    const op = ops[f.opId] || {}; const pid = prodDe(f.lotId); const v = Math.abs(f.L);
    if (f.kind === 'entree') { if (f.reprise) add(pid, 'E', 'autresE', v, 'Reprise de stock (mise en service d’Œnotrack)'); else if (f.mout) add(pid, 'E', 'achats', v); else add(pid, 'E', 'production', v); }
    else if (f.kind === 'perte') add(pid, 'S', 'internesS', v);
    else if (f.kind === 'jaugeage') { if (f.L > 0) add(pid, 'E', 'autresE', v, 'Excédent constaté au jaugeage'); else add(pid, 'S', 'internesS', v); }
    else if (f.kind === 'sortie') { const st = op.sousType || ''; const m = norm(f.motif || op.motif || '');
      if (st === 'echantillon') add(pid, 'S', 'degustation', v); else if (st === 'perte' || /perte|destruction|casse/.test(m)) add(pid, 'S', 'autresS', v, 'Perte accidentelle ou destruction'); else add(pid, 'S', 'definitives', v); }
    else if (f.kind === 'tirage') { const pt = prodDe(op.lotId); if (pt !== pid) { add(pid, 'S', 'transfertS', v); add(pt, 'E', 'transfertE', v); } }
    else if (f.kind === 'prelevement') prep[pid] = (prep[pid] || 0) - v;
    else if (f.kind === 'ajout') prep[pid] = (prep[pid] || 0) + v;
  });
  (db.ops || []).filter((o) => dans(o.date)).forEach((o) => {
    if (o.type === 'assemblage') { const pd = prodDe(o.lotId); (o.sources || []).forEach((s) => { const pi = R1.pinfo[s.portionId]; if (!pi) return; const ps = prodDe(pi.lotId); if (ps !== pd) { add(ps, 'S', 'transfertS', num(s.volL)); add(pd, 'E', 'transfertE', num(s.volL)); } }); }
    if (o.type === 'tirage') { const pt = prodDe(o.lotId); (o.prepUses || []).forEach((u) => { prep[pt] = (prep[pt] || 0) + num(u.volL); }); }
    if (o.type === 'reprise' && num(o.nbBouteilles) > 0) add(prodDe(o.lotId), 'E', 'autresE', num(o.nbBouteilles) * DRM_BOUTEILLE_L, 'Reprise de stock (mise en service d’Œnotrack)');
    if (o.type === 'degorgement' && num(o.nb) > 0) { const pid = prodDe(o.sourceLotId); const t = R1.tir[o.sourceLotId]; const avant = num(o.nb) * (t ? drmVolBouteille(R1, t) : DRM_BOUTEILLE_L); const apres = num(o.nb) * num(o.volBouteilleL || DRM_BOUTEILLE_L);
      if (apres > avant) add(pid, 'E', 'manipE', apres - avant); else add(pid, 'S', 'internesS', avant - apres); }
  });
  Object.keys(prep).forEach((pid) => { if (prep[pid] > 0) add(pid, 'E', 'manipE', prep[pid]); else add(pid, 'S', 'internesS', -prep[pid]); });
  // bouteilles finies saisies pour la période (et, pour une DRA, les mois de la campagne)
  (db.drmSorties || []).forEach((x) => {
    const fin = drmFinPeriode(db, x.periode); if (!fin || !dans(fin)) return; if (per.type === 'M' && x.periode !== key) return;
    const b = (n) => num(n) * DRM_BOUTEILLE_L; const pid = x.produitId; L(pid);
    if (per.type === 'A' && x.periode.startsWith('M:') && Number(x.periode.slice(2, 6)) < per.annee) add(pid, 'S', 'ventesFranceAnt', b(x.ventesFrance)); else add(pid, 'S', 'ventesFrance', b(x.ventesFrance));
    add(pid, 'S', 'ventesFranceAnt', b(x.ventesFranceAnt)); add(pid, 'S', 'definitives', b(x.definitives)); add(pid, 'S', 'degustation', b(x.degustation));
    add(pid, 'S', 'autresS', b(x.autres), x.obs || 'Autres sorties de bouteilles'); add(pid, 'E', 'autresE', b(x.entrees), x.obs || 'Entrées de bouteilles (reprise, retours)');
    if (x.obs && !lignes[pid].obs.includes(x.obs)) lignes[pid].obs.push(x.obs);
  });
  // écart (volume constaté ≠ mouvements) : variation de volume, signalée
  Object.values(lignes).forEach((x) => {
    const e = Object.values(x.E).reduce((a, b) => a + b, 0); const s = Object.values(x.S).reduce((a, b) => a + b, 0); const r = x.s1 - (x.s0 + e - s);
    if (Math.abs(r) > 0.01) { x.ecart = r; if (r > 0) x.E.manipE = (x.E.manipE || 0) + r; else x.S.internesS = (x.S.internesS || 0) - r; }
  });
  const prev = drmDeclarationPrecedente(db, per);
  const out = [...P.map((p) => ({ ...L(p.id), produit: p })), ...(lignes[''] ? [{ ...lignes[''], produit: null }] : [])].map((x) => {
    const dp = prev && (prev.produits || []).find((y) => y.produitId === x.produitId);
    return { ...x, f0: F0[x.produitId] || 0, f1: F1[x.produitId] || 0, actif: x.s0 > 0.005 || x.s1 > 0.005 || Object.keys(x.E).length > 0 || Object.keys(x.S).length > 0, negatif: x.s1 < -0.005, continuite: dp ? x.s0 - dp.s1 : 0 };
  });
  const decl = (db.drmDeclarations || []).find((d) => d.periode === key) || null;
  return { periode: per, lignes: out, declaration: decl, precedente: prev, nonRattache: lignes[''] ? Math.max(lignes[''].s0, lignes[''].s1) : 0 };
}
// déclaration déposée pour la période qui précède immédiatement (mois précédent, ou campagne précédente)
function drmDeclarationPrecedente(db, per) {
  const veille = addDays(per.d1, -1);
  return (db.drmDeclarations || []).find((d) => { const p = drmPeriode(db, d.periode); return p && p.type === per.type && p.d2 === veille; }) || null;
}
// contrôles avant dépôt : n° d'accise, codes, lots non rattachés, stocks négatifs, écarts, continuité avec la DRM précédente
function drmControles(db, calc, o) {
  const out = []; const r = drmReglage(db); const civc = o && o.civc;
  if (!drmAcciseOk(r.accise)) out.push({ niveau: 'bloquant', msg: 'N° d’accise (13 caractères) à indiquer dans les réglages de la DRM.' });
  if (civc && !r.civc) out.push({ niveau: 'alerte', msg: 'N° CIVC (identifiant interprofessionnel) à indiquer dans les réglages de la DRM.' });
  if (calc.nonRattache > 0.005) out.push({ niveau: 'alerte', msg: `Lots non rattachés à un produit : ${fmtL(calc.nonRattache)} hors déclaration.` });
  // contrôle d'un produit : msg (phrase complète) ; nom (libellé du produit, une donnée : jamais traduit) et texte (la suite) pour l'affichage
  const pour = (nom, niveau, texte) => out.push({ niveau, msg: `${nom} : ${texte}`, nom, texte });
  calc.lignes.filter((x) => x.produit && x.actif).forEach((x) => {
    const nom = x.produit.libelle;
    if (x.negatif) pour(nom, 'bloquant', `stock de fin négatif (${fmtL(x.s1)}) : vérifiez les sorties de bouteilles saisies.`);
    if (civc && !x.produit.codeCivc) pour(nom, 'alerte', 'code CIVC à indiquer (sinon le code INAO ou le libellé fiscal est repris).');
    if (!drmCode(x.produit)) pour(nom, 'bloquant', 'code INAO ou libellé fiscal à indiquer.');
    if (x.produit.aVerifier) pour(nom, 'alerte', 'produit d’exemple à vérifier (libellé exact de votre compte CIEL, code INAO).');
    if (Math.abs(x.ecart) > 0.01) pour(nom, 'alerte', `écart de ${fmtL(Math.abs(x.ecart))} entre les mouvements et le stock constaté, porté en ${x.ecart > 0 ? 'manipulations' : 'autres mouvements internes'}.`);
    if (Math.abs(x.continuite) > 0.01) pour(nom, 'alerte', `le stock de début diffère de ${fmtL(Math.abs(x.continuite))} du stock de fin de la DRM déposée précédente : une opération antérieure a été modifiée.`);
  });
  // DRM déposée : chiffres recalculés différents de ceux du dépôt (une opération de la période modifiée depuis)
  const dec = calc.declaration;
  if (dec) {
    const dif = (a, b) => Math.abs((a || 0) - (b || 0)) > 0.05; const vide = { s0: 0, s1: 0, E: {}, S: {} };
    uniq([...(dec.produits || []).map((p) => p.produitId), ...calc.lignes.filter((x) => x.actif && x.produit).map((x) => x.produitId)]).forEach((pid) => {
      const dp = (dec.produits || []).find((p) => p.produitId === pid) || vide; const x = calc.lignes.find((y) => y.produitId === pid) || vide;
      const nom = (x.produit && x.produit.libelle) || dp.libelle || pid;
      const mvt = ['E', 'S'].some((k) => uniq([...Object.keys(dp[k] || {}), ...Object.keys(x[k] || {})]).some((c) => dif((dp[k] || {})[c], (x[k] || {})[c])));
      if (dif(dp.s1, x.s1)) pour(nom, 'alerte', `stock de fin recalculé ${fmtL(x.s1)}, ${fmtL(dp.s1)} dans la DRM déposée : une opération de la période a été modifiée depuis le dépôt.`);
      else if (dif(dp.s0, x.s0) || mvt) pour(nom, 'alerte', 'mouvements recalculés différents de la DRM déposée : une opération de la période a été modifiée depuis le dépôt.');
    });
  }
  if (calc.periode.type === 'A') out.push({ niveau: 'alerte', msg: 'DRA (annuelle) : période et ventes de l’année précédente à vérifier avec votre service des douanes avant le dépôt du fichier.' });
  return out;
}

/* ---------- dépôt (figé) ---------- */
function drmDeposer(db, key, uid) {
  const calc = drmCalcul(db, key); if (!calc) return fail('Période inconnue.');
  if ((db.drmDeclarations || []).some((d) => d.periode === key)) return fail('Cette DRM est déjà déposée.');
  const bl = drmControles(db, calc).filter((c) => c.niveau === 'bloquant'); if (bl.length) return fail(bl[0].msg);
  if (!Array.isArray(db.drmDeclarations)) db.drmDeclarations = [];
  const r2v = (x) => Math.round(x * 100) / 100; const obj = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r2v(v)]));
  db.drmDeclarations.push({ id: key, periode: key, deposeeLe: todayISO(), par: uid || '', produits: calc.lignes.filter((x) => x.produit && x.actif).map((x) => ({ produitId: x.produitId, libelle: x.produit.libelle, code: drmCode(x.produit), s0: r2v(x.s0), s1: r2v(x.s1), E: obj(x.E), S: obj(x.S) })) });
  return okr();
}
function drmRouvrir(db, key) { const n = (db.drmDeclarations || []).length; db.drmDeclarations = (db.drmDeclarations || []).filter((d) => d.periode !== key); return n === db.drmDeclarations.length ? fail('Cette DRM n’est pas déposée.') : okr(); }

/* ---------- fichier DTI+ (CIEL) et variante CIVC ; CSV ---------- */
const drmHl = (L) => { const v = Math.round((L / 100) * 100000) / 100000; return Object.is(v, -0) ? '0' : String(v); };
const xmlEsc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
function drmXml(db, calc, o) {
  const civc = !!(o && o.civc); const r = drmReglage(db); const per = calc.periode; const T = '  ';
  const el = (n, v, ind) => `${T.repeat(ind)}<${n}>${v}</${n}>`;
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', `<mouvements-balances xmlns="${DRM_NS}">`, `${T}<periode-taxation>`, el('mois', per.mois, 2), el('annee', per.annee, 2), `${T}</periode-taxation>`, el('identification-redevable', xmlEsc(r.accise), 1)];
  const prods = calc.lignes.filter((x) => x.produit && x.actif);
  if (prods.length) {
    lines.push(`${T}<droits-suspendus>`);
    prods.forEach((x) => {
      const p = x.produit; const v = (k, s) => (x[s][k] || 0); const g = (k, s) => v(k, s) > 1e-6;
      lines.push(`${T.repeat(2)}<produit>`);
      const code = civc && p.codeCivc ? p.codeCivc : p.codeInao;
      if (code) lines.push(el('code-inao', xmlEsc(code.length === 5 ? `${code} ` : code), 3)); else lines.push(el('libelle-fiscal', xmlEsc(p.libelleFiscal), 3));
      lines.push(el('libelle-personnalise', xmlEsc(p.libelle), 3));
      if (p.tav != null && p.tav !== '') lines.push(el('tav', num(p.tav).toFixed(2), 3));
      const obs = x.obs.join(' ; ').slice(0, 250); if (obs) lines.push(el('observations', xmlEsc(obs), 3));
      lines.push(`${T.repeat(3)}<balance-stock>`, el('stock-debut-periode', drmHl(x.s0), 4));
      if (['production', 'achats', 'transfertE', 'manipE', 'autresE'].some((k) => g(k, 'E'))) {
        lines.push(`${T.repeat(4)}<entrees-periode>`);
        if (g('production', 'E')) lines.push(el('volume-produit', drmHl(v('production', 'E')), 5));
        if (g('achats', 'E')) lines.push(el('achats-reintegrations', drmHl(v('achats', 'E')), 5));
        if (g('transfertE', 'E') || g('manipE', 'E')) { lines.push(`${T.repeat(5)}<mouvements-internes>`); if (g('transfertE', 'E')) lines.push(el('replis-declassement-transfert-changement-appellation', drmHl(v('transfertE', 'E')), 6)); if (g('manipE', 'E')) lines.push(el('manipulations', drmHl(v('manipE', 'E')), 6)); lines.push(`${T.repeat(5)}</mouvements-internes>`); }
        if (g('autresE', 'E')) lines.push(el('autres-entrees', drmHl(v('autresE', 'E')), 5));
        lines.push(`${T.repeat(4)}</entrees-periode>`);
      }
      if (['ventesFrance', 'ventesFranceAnt', 'definitives', 'degustation', 'transfertS', 'internesS', 'autresS'].some((k) => g(k, 'S'))) {
        lines.push(`${T.repeat(4)}<sorties-periode>`);
        if (g('ventesFrance', 'S') || g('ventesFranceAnt', 'S')) { lines.push(`${T.repeat(5)}<ventes-france-crd-suspendus>`); if (g('ventesFranceAnt', 'S')) lines.push(el('annee-precedente', drmHl(v('ventesFranceAnt', 'S')), 6)); lines.push(el('annee-courante', drmHl(v('ventesFrance', 'S')), 6)); lines.push(`${T.repeat(5)}</ventes-france-crd-suspendus>`); }
        if (['definitives', 'degustation', 'transfertS', 'internesS', 'autresS'].some((k) => g(k, 'S'))) {
          lines.push(`${T.repeat(5)}<sorties-sans-paiement-droits>`);
          if (g('definitives', 'S')) lines.push(el('sorties-definitives', drmHl(v('definitives', 'S')), 6));
          if (g('degustation', 'S')) lines.push(el('consommation-familiale-degustation', drmHl(v('degustation', 'S')), 6));
          if (g('transfertS', 'S') || g('internesS', 'S')) { lines.push(`${T.repeat(6)}<mouvements-internes>`); if (g('transfertS', 'S')) lines.push(el('replis-declassement-transfert-changement-appellation', drmHl(v('transfertS', 'S')), 7)); if (g('internesS', 'S')) lines.push(el('autres-mouvements-internes', drmHl(v('internesS', 'S')), 7)); lines.push(`${T.repeat(6)}</mouvements-internes>`); }
          if (g('autresS', 'S')) lines.push(el('autres-sorties', drmHl(v('autresS', 'S')), 6));
          lines.push(`${T.repeat(5)}</sorties-sans-paiement-droits>`);
        }
        lines.push(`${T.repeat(4)}</sorties-periode>`);
      }
      lines.push(el('stock-fin-periode', drmHl(x.s1), 4), `${T.repeat(3)}</balance-stock>`, `${T.repeat(2)}</produit>`);
    });
    lines.push(`${T}</droits-suspendus>`);
  }
  lines.push('</mouvements-balances>');
  return `${lines.join('\n')}\n`;
}
const drmNomFichier = (calc, ext, civc) => `drm-${civc ? 'civc-' : ''}${calc.periode.type === 'A' ? `dra-${calc.periode.campagne.id}` : calc.periode.ym}.${ext}`;
function drmCsvLignes(db, calc) {
  const hl = (L) => Math.round((L / 100) * 10000) / 10000; const r = drmReglage(db);
  const head = ['Période', 'Produit (libellé personnalisé)', 'Code INAO ou libellé fiscal', 'Code CIVC', 'Stock début (hL)', ...DRM_ENTREES.map((e) => `${e[1]} (hL)`), ...DRM_SORTIES.map((e) => `${e[1]} (hL)`), 'Ventes France, année précédente (hL)', 'Stock fin (hL)', 'Écart (hL)', 'Observations'];
  const per = calc.periode.type === 'A' ? `DRA ${calc.periode.campagne.nom}` : calc.periode.ym;
  const rows = calc.lignes.filter((x) => x.actif).map((x) => [per, x.produit ? x.produit.libelle : '(non rattaché)', x.produit ? drmCode(x.produit) : '', x.produit ? x.produit.codeCivc || '' : '', hl(x.s0), ...DRM_ENTREES.map((e) => hl(x.E[e[0]] || 0)), ...DRM_SORTIES.map((e) => hl(x.S[e[0]] || 0)), hl(x.S.ventesFranceAnt || 0), hl(x.s1), hl(x.ecart || 0), x.obs.join(' ; ')]);
  return [['N° d’accise', r.accise], ['N° CVI', r.cvi], ['N° CIVC', r.civc], [], head, ...rows];
}
