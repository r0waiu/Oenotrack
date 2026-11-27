/* ============ SYNCHRONISATION DRIVE : fusion à trois voies (version commune · cet appareil · fichier du Drive) ============ */
// Chaque élément (opération, lot, contenant, analyse, réglage…) est comparé à la dernière version commune aux deux côtés :
// ce qui n'a changé que d'un côté est repris tel quel ; ce qui a changé des deux côtés est un conflit : la version la plus
// récente est gardée et l'autre est conservée dans le journal de synchronisation (rien n'est perdu).
const canon = (v) => {
  if (v === null || v === undefined || typeof v !== 'object') return JSON.stringify(v === undefined ? null : v);
  if (Array.isArray(v)) return `[${v.map(canon).join(',')}]`;
  return `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(',')}}`;
};
const hash36 = (s) => {
  let h1 = 0xdeadbeef ^ s.length; let h2 = 0x41c6ce57 ^ s.length;
  for (let i = 0; i < s.length; i += 1) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36);
};
// réglages propres à chaque appareil (vue en cours) : jamais synchronisés
const SYNC_LOCAL = { settings: ['siteActif', 'campagneActive'] };
// clé d'identité des éléments sans identifiant
const SYNC_CLES = { regles: (x) => `${x.produitId}|${x.qualifId}`, 'lists.stadesMelanges': (x) => [x.a, x.b].sort().join('+') };
const SYNC_NOMS = {
  ops: ['opération', 'opérations'], lots: ['lot', 'lots'], lotsFinis: ['lot fini', 'lots finis'], contenants: ['contenant', 'contenants'], analyses: ['analyse', 'analyses'],
  produits: ['produit', 'produits'], arrivages: ['arrivage', 'arrivages'], fournisseurs: ['fournisseur', 'fournisseurs'], regles: ['règle d’intrant', 'règles d’intrants'],
  docs: ['document', 'documents'], previsions: ['opération à réaliser', 'opérations à réaliser'], fiches: ['fiche', 'fiches'], modelesFiches: ['modèle de fiche', 'modèles de fiches'],
  hygiene: ['entrée d’hygiène', 'entrées d’hygiène'], alertes: ['alerte', 'alertes'], apporteurs: ['partenaire', 'partenaires'], crus: ['cru', 'crus'], parcelles: ['parcelle', 'parcelles'],
  sites: ['site', 'sites'], campagnes: ['campagne', 'campagnes'], operateurs: ['opérateur', 'opérateurs'], utilisateurs: ['utilisateur', 'utilisateurs'], profils: ['profil de droits', 'profils de droits'], audit: ['entrée du journal des accès', 'entrées du journal des accès'], formulaires: ['formulaire d’opération', 'formulaires d’opérations'], analysesParams: ['paramètre d’analyse', 'paramètres d’analyse'], analysesModeles: ['modèle d’analyse', 'modèles d’analyse'],
  catalogues: ['catalogue importé', 'catalogues importés'], catalogueReglage: ['réglage des catalogues', 'réglages des catalogues'], plafonds: ['plafond de revendication', 'plafonds des revendications'], // 0.30.0-alpha.1
  schemas: ['schéma de vinification', 'schémas de vinification'], // 0.31.0-alpha.1
  plansVinif: ['plan de vinification', 'plans de vinification'], // 0.39.0-alpha.1
  codifRegles: ['règle de codification', 'règles de codification'], codifTables: ['table de codification', 'tables de codification'], habillages: ['habillage ou mise en carton', 'habillages et mises en carton'], // 0.41.0-alpha.1
  chantiersTirage: ['chantier de tirage', 'chantiers de tirage'], // 0.42.0-alpha.2
  declarationsTirage: ['déclaration de tirage', 'déclarations de tirage'], // 0.42.0-alpha.4
  regulStocks: ['régularisation de stock', 'régularisations de stock'], produitsMaintenance: ['produit de maintenance', 'produits de maintenance'], mouvementsMaintenance: ['mouvement de stock de maintenance', 'mouvements de stock de maintenance'], // 0.36.0-alpha.1
  drmProduits: ['produit de la DRM', 'produits de la DRM'], drmRattachements: ['rattachement à la DRM', 'rattachements à la DRM'], drmSorties: ['saisie de la DRM', 'saisies de la DRM'], drmDeclarations: ['DRM déposée', 'DRM déposées'], // 0.32.0-alpha.1
  baremes: ['barème de jaugeage', 'barèmes de jaugeage'], produitsHygiene: ['produit d’hygiène', 'produits d’hygiène'], lists: ['élément de liste', 'éléments de listes'], settings: ['réglage', 'réglages'], entreprise: ['information de l’entreprise', 'informations de l’entreprise'], apparence: ['réglage d’apparence', 'réglages d’apparence'],
};
const syncNom = (cle, n) => { const x = SYNC_NOMS[cle.split('.')[0]] || ['élément', 'éléments']; return `${n} ${n > 1 ? x[1] : x[0]}`; };
// empreinte du contenu (sans les métadonnées ni les réglages de vue) : deux bases de même empreinte sont identiques
function syncEmpreinte(db) {
  if (!db) return '';
  const { meta, ...rest } = db; const st = { ...(rest.settings || {}) }; SYNC_LOCAL.settings.forEach((k) => { delete st[k]; });
  return hash36(canon({ ...rest, settings: st }));
}
const syncLibelle = (cle, x) => {
  if (!x || typeof x !== 'object') return '';
  if (cle === 'ops') return `${typeof opNom === 'function' ? opNom(x) : x.type} du ${typeof fmtDate === 'function' ? fmtDate(x.date) : x.date}`;
  if (cle === 'analyses' || cle === 'hygiene') return `${cle === 'analyses' ? 'Analyse' : 'Hygiène'} du ${typeof fmtDate === 'function' ? fmtDate(x.date) : x.date}`;
  if (cle === 'operateurs') return [x.prenom, x.nom].filter(Boolean).join(' ') || x.id || '';
  return x.code || x.nom || x.label || x.titre || x.id || '';
};

// fusion à trois voies d'une valeur (b : base commune, ou undefined au premier contact)
function syncValeur(aBase, b, l, r) {
  const cl = canon(l); const cr = canon(r); if (cl === cr) return { v: l, k: 'egal' };
  if (aBase) { const cb = canon(b); if (cl === cb) return { v: r, k: 'recu' }; if (cr === cb) return { v: l, k: 'envoye' }; }
  return { k: 'conflit' };
}
// fiches de catalogue (intrants, fournisseurs, produits d'hygiène) modifiées des deux côtés : fusion champ par champ quand les
// changements portent sur des champs différents (ex. FDS jointe sur un appareil, référence saisie sur l'autre) — 0.20.0-alpha.1
// 0.28.0-alpha.1 : aussi les comptes (mot de passe changé sur un appareil, profil sur l'autre) et les fiches du parc de matériel
const SYNC_PAR_CHAMP = ['produits', 'fournisseurs', 'produitsHygiene', 'utilisateurs', 'lists.equipements'];
// clés d'accès d'un compte ajoutées ou retirées sur deux appareils entre deux synchronisations : réunies clé par clé
function syncSousListe(b, l, r) {
  const ok = (a) => a === undefined || (Array.isArray(a) && a.every((x) => x && typeof x === 'object' && typeof x.id === 'string'));
  if (![b, l, r].every(ok)) return null;
  const M = (a) => new Map((a || []).map((x) => [x.id, x])); const mb = M(b); const ml = M(l); const mr = M(r); const out = [];
  for (const id of new Set([...ml.keys(), ...mr.keys(), ...mb.keys()])) {
    const vl = ml.get(id); const vr = mr.get(id);
    if (!mb.has(id) && (vl === undefined || vr === undefined)) { out.push(vl || vr); continue; } // ajoutée d'un seul côté
    const x = syncValeur(mb.has(id), mb.get(id), vl, vr); if (x.k === 'conflit') return null; if (x.v !== undefined) out.push(x.v); // retirée d'un côté : x.v absent
  }
  return out;
}
function syncChamps(b, l, r) {
  const out = {};
  for (const k of new Set([...Object.keys(l), ...Object.keys(r), ...Object.keys(b)])) {
    if (k === 'modifLe' && typeof l[k] === 'string' && typeof r[k] === 'string') { out[k] = l[k] > r[k] ? l[k] : r[k]; continue; }
    const x = syncValeur(true, b[k], l[k], r[k]);
    if (x.k === 'conflit') { const sl = k === 'cles' ? syncSousListe(b[k], l[k], r[k]) : null; if (!sl) return null; out[k] = sl; continue; }
    if (x.v !== undefined) out[k] = x.v;
  }
  return out;
}
function syncCollection(cle, B, L, R, ctx) {
  const key = SYNC_CLES[cle] || ((x) => x.id); const st = ctx.st;
  const mk = (a) => { const m = new Map(); (a || []).forEach((x) => { if (x && typeof x === 'object') m.set(String(key(x)), x); }); return m; };
  const mb = mk(B); const ml = mk(L); const mr = mk(R); const aBase = !!B;
  const ids = (a) => (a || []).filter((x) => x && typeof x === 'object').map((x) => String(key(x)));
  const iL = ids(L); const iR = ids(R); const iB = ids(B);
  const memeOrdre = (x, y) => { const sx = x.filter((i) => y.includes(i)); const sy = y.filter((i) => x.includes(i)); return sx.join('\u0001') === sy.join('\u0001'); };
  const ordre = aBase && memeOrdre(iL, iB) && !memeOrdre(iR, iB) ? iR : iL; // un ordre changé d'un seul côté (stades, catalogue…) est repris
  const val = new Map(); const tous = [...new Set([...iL, ...iR, ...iB])];
  tous.forEach((id) => {
    const b = mb.get(id); const l = ml.get(id); const r = mr.get(id);
    const res = syncValeur(aBase && mb.has(id), b, l, r);
    if (res.k === 'egal') { if (l !== undefined) val.set(id, l); return; }
    if (res.k === 'recu') { if (res.v !== undefined) val.set(id, res.v); st.recus[cle] = (st.recus[cle] || 0) + 1; return; }
    if (res.k === 'envoye') { if (res.v !== undefined) val.set(id, res.v); st.envoyes[cle] = (st.envoyes[cle] || 0) + 1; return; }
    // l'élément n'existe que d'un côté sans base commune : c'est un ajout
    if (!(aBase && mb.has(id)) && (l === undefined || r === undefined)) { const v = l !== undefined ? l : r; val.set(id, v); const t = l !== undefined ? st.envoyes : st.recus; t[cle] = (t[cle] || 0) + 1; return; }
    // supprimé d'un côté, modifié de l'autre : on garde la version modifiée
    if (l === undefined || r === undefined) { const v = l !== undefined ? l : r; val.set(id, v); ctx.conflit(cle, id, v, null, l !== undefined ? 'appareil' : 'drive', 'suppression'); const t = l !== undefined ? st.envoyes : st.recus; t[cle] = (t[cle] || 0) + 1; return; }
    if (SYNC_PAR_CHAMP.includes(cle) && aBase && mb.has(id) && syncEstObj(b) && syncEstObj(l) && syncEstObj(r)) { const m = syncChamps(b, l, r); if (m) { val.set(id, m); st.recus[cle] = (st.recus[cle] || 0) + 1; st.envoyes[cle] = (st.envoyes[cle] || 0) + 1; return; } }
    const g = ctx.gagnant; const v = g === 'drive' ? r : l; val.set(id, v); ctx.conflit(cle, id, v, g === 'drive' ? l : r, g, 'modification');
    if (g === 'drive') st.recus[cle] = (st.recus[cle] || 0) + 1; else st.envoyes[cle] = (st.envoyes[cle] || 0) + 1;
  });
  tous.forEach((id) => { if (val.has(id)) return; if (mr.has(id)) st.supprEnvoyees += 1; if (ml.has(id)) st.supprRecues += 1; }); // suppressions transmises
  // ordre : celui retenu, puis les éléments venus de l'autre côté, placés après leur voisin
  const out = ordre.filter((id) => val.has(id)); const autre = ordre === iL ? iR : iL; const place = new Set(out);
  autre.forEach((id, i) => {
    if (place.has(id) || !val.has(id)) return; let pos = -1;
    for (let j = i - 1; j >= 0 && pos < 0; j -= 1) pos = out.indexOf(autre[j]);
    out.splice(pos + 1, 0, id); place.add(id);
  });
  tous.forEach((id) => { if (!place.has(id) && val.has(id)) { out.push(id); place.add(id); } });
  return out.map((id) => val.get(id));
}
const estCollection = (cle, ...arrs) => {
  if (!arrs.every((a) => a === undefined || Array.isArray(a))) return false; const pleins = arrs.filter((a) => a && a.length); if (!pleins.length) return false;
  const key = SYNC_CLES[cle] || ((x) => x.id);
  return pleins.every((a) => a.every((x) => x && typeof x === 'object' && !Array.isArray(x) && (SYNC_CLES[cle] || typeof x.id === 'string')) && new Set(a.map((x) => String(key(x)))).size === a.length);
};
// sous-objets fusionnés eux aussi clé par clé : couleurs par revendication, par cépage, par niveau (chaque appareil peut en ajouter)
const SYNC_SOUS_OBJETS = ['apparence.qualifColors', 'apparence.cepageColors', 'apparence.echelleColors'];
const syncEstObj = (x) => x !== undefined && x !== null && typeof x === 'object' && !Array.isArray(x);
// objet fusionné clé par clé (réglages, entreprise, apparence, listes)
function syncObjet(cle, B, L, R, ctx) {
  const aBase = !!B; const b0 = B || {}; const l0 = L || {}; const r0 = R || {}; const out = {}; const local = SYNC_LOCAL[cle] || [];
  [...new Set([...Object.keys(l0), ...Object.keys(r0), ...Object.keys(b0)])].forEach((k) => {
    if (local.includes(k)) { if (l0[k] !== undefined) out[k] = l0[k]; else if (r0[k] !== undefined) out[k] = r0[k]; return; }
    const sous = `${cle}.${k}`;
    if (SYNC_SOUS_OBJETS.includes(sous) && [l0[k], r0[k]].every((x) => x === undefined || syncEstObj(x)) && (syncEstObj(l0[k]) || syncEstObj(r0[k]))) { out[k] = syncObjet(sous, aBase ? (syncEstObj(b0[k]) ? b0[k] : {}) : null, l0[k], r0[k], ctx); return; }
    if (estCollection(sous, b0[k], l0[k], r0[k])) { out[k] = syncCollection(sous, aBase ? (b0[k] || []) : null, l0[k] || [], r0[k] || [], ctx); return; }
    const res = syncValeur(aBase && k in b0, b0[k], l0[k], r0[k]);
    if (res.k === 'egal') { if (l0[k] !== undefined) out[k] = l0[k]; return; }
    if (res.k === 'recu' || res.k === 'envoye') { if (res.v !== undefined) out[k] = res.v; const t = res.k === 'recu' ? ctx.st.recus : ctx.st.envoyes; t[cle] = (t[cle] || 0) + 1; return; }
    if (l0[k] === undefined || r0[k] === undefined) { const v = l0[k] !== undefined ? l0[k] : r0[k]; out[k] = v; if (aBase && k in b0) ctx.conflit(cle, k, v, null, l0[k] !== undefined ? 'appareil' : 'drive', 'suppression'); const t = l0[k] !== undefined ? ctx.st.envoyes : ctx.st.recus; t[cle] = (t[cle] || 0) + 1; return; }
    const g = ctx.gagnant; out[k] = g === 'drive' ? r0[k] : l0[k]; ctx.conflit(cle, k, out[k], g === 'drive' ? l0[k] : r0[k], g, 'modification');
  });
  return out;
}
const SYNC_OBJETS = ['settings', 'entreprise', 'apparence', 'lists'];
const syncMax = (...v) => v.filter((x) => x !== undefined && x !== null && x !== '').sort().pop() || null;
/**
 * B : base commune (ou null au premier contact) · L : cette base · R : base du fichier du Drive
 * → { db, recus: { cle: n }, envoyes: { cle: n }, conflits: [...], identique, gagnant, doublons }
 */
// journal des conflits (0.38.0-alpha.3) : les versions écartées reprenables (« autre ») sont toutes gardées — rien n'est perdu —, les
// simples mentions sont limitées aux 60 plus récentes (la liste reçue commence par les plus récentes)
function syncConflitsGarder(liste) {
  let n = 0; return (Array.isArray(liste) ? liste : []).filter((c) => c && (c.autre != null || (n += 1) <= 60));
}
function syncFusion(B, L, R, opts) {
  opts = opts || {}; const st = { recus: {}, envoyes: {}, supprEnvoyees: 0, supprRecues: 0 }; const conflits = [];
  const tl = (L.meta && L.meta.modifLe) || ''; const tr = (R.meta && R.meta.modifLe) || '';
  const gagnant = opts.gagnant || (tr > tl ? 'drive' : 'appareil');
  const ctx = { st, gagnant, conflit: (cle, id, garde, autre, cote, nature) => conflits.push({ cle, id, libelle: syncLibelle(cle, garde || autre), garde: cote, nature, autre: autre === undefined ? null : autre }) };
  const out = {};
  [...new Set([...Object.keys(L), ...Object.keys(R), ...Object.keys(B || {})])].forEach((k) => {
    if (k === 'meta') return;
    const b = B ? B[k] : undefined; const l = L[k]; const r = R[k];
    if (k === 'schema') { out[k] = Math.max(num(l), num(r)) || l; return; }
    if (k === 'app') { out[k] = l !== undefined ? l : r; return; }
    if (SYNC_OBJETS.includes(k) && (l === undefined || (typeof l === 'object' && !Array.isArray(l))) && (r === undefined || (typeof r === 'object' && !Array.isArray(r)))) { out[k] = syncObjet(k, B ? (b || {}) : null, l, r, ctx); return; }
    if (estCollection(k, b, l, r)) { out[k] = syncCollection(k, B ? (b || []) : null, l || [], r || [], ctx); return; }
    const res = syncValeur(!!B && b !== undefined, b, l, r);
    if (res.k === 'egal' || res.k === 'recu' || res.k === 'envoye') { if (res.v !== undefined) out[k] = res.v; if (res.k !== 'egal') { const t = res.k === 'recu' ? st.recus : st.envoyes; t[k] = (t[k] || 0) + 1; } return; }
    out[k] = gagnant === 'drive' ? (r !== undefined ? r : l) : (l !== undefined ? l : r);
    if (l !== undefined && r !== undefined) ctx.conflit(k, k, out[k], gagnant === 'drive' ? l : r, gagnant, 'modification');
  });
  const ml = L.meta || {}; const mr = R.meta || {};
  const versions = [...new Set([...(mr.versions || []), ...(ml.versions || [])])].slice(-30);
  out.meta = { ...mr, ...ml, seq: Math.max(num(ml.seq), num(mr.seq)), opSeq: Math.max(num(ml.opSeq), num(mr.opSeq)), versions,
    creeLe: [ml.creeLe, mr.creeLe].filter(Boolean).sort()[0] || ml.creeLe, exemple: !!(ml.exemple && mr.exemple),
    derniereExport: syncMax(ml.derniereExport, mr.derniereExport), derniereEnLigne: syncMax(ml.derniereEnLigne, mr.derniereEnLigne), modifLe: syncMax(ml.modifLe, mr.modifLe) };
  // lots portant le même code (créés sur deux appareils entre deux synchronisations)
  const vus = {}; const doublons = [];
  (out.lots || []).forEach((l) => { if (!l || !l.code) return; if (vus[l.code] && !doublons.includes(l.code)) doublons.push(l.code); vus[l.code] = true; });
  const nb = (o) => Object.values(o).reduce((a, n) => a + n, 0);
  return { db: out, recus: st.recus, envoyes: st.envoyes, nRecus: nb(st.recus), nEnvoyes: nb(st.envoyes), supprEnvoyees: st.supprEnvoyees, supprRecues: st.supprRecues, conflits, gagnant, doublons, identique: syncEmpreinte(out) === syncEmpreinte(R) && syncEmpreinte(out) === syncEmpreinte(L) };
}
// journal des conflits : reprendre la version écartée d'un élément
function conflitReprendre(d, c) {
  if (!c || c.autre === null || c.autre === undefined) return fail('Aucune autre version à reprendre.');
  const [k, sk] = String(c.cle).split('.');
  if (!sk && d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) { d[k] = { ...d[k], [c.id]: clone(c.autre) }; return okr(); }
  const arr = sk ? (d[k] || {})[sk] : d[k]; if (!Array.isArray(arr)) return fail('Élément introuvable.');
  const key = SYNC_CLES[c.cle] || ((x) => x.id); const i = arr.findIndex((x) => x && String(key(x)) === String(c.id));
  if (i >= 0) arr[i] = clone(c.autre); else arr.push(clone(c.autre));
  return okr();
}
// résumé lisible : « 3 opérations, 1 analyse »
const syncResume = (o) => Object.entries(o || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([k, n]) => syncNom(k, n)).join(', ');
