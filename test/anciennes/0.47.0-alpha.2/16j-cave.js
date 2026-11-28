/* ============ CAVE AU QUOTIDIEN (0.29.0-alpha.1) ============
   Fiches de cuve et de lot personnalisables (rubriques, ordre : réglage commun + ajustements de chacun), doses dans l'unité du produit,
   saisie groupée sur plusieurs cuves (une opération par cuve, reliées par un groupe), fiches multi-lignes du jour, courbes et alertes
   de fermentation, SO₂ moléculaire, simulateur d'enrichissement, étiquettes QR (adresse + identifiant opaque) et rappel de sauvegarde. */

/* ---------- rubriques des fiches ---------- */
const FICHE_RUBRIQUES = {
  cont: [
    ['fermentation', 'Fermentation (courbes densité et température, alerte)'], ['jauge', 'Jaugeage'], ['lots', 'Lots présents'],
    ['composition', 'Composition du contenu'], ['intrants', 'Intrants du contenu (cumulés)'], ['so2', 'SO₂ total estimé (analyse + ajouts depuis)'], ['ajouts', 'Ajouts d’intrants réalisés dans ce contenant'],
    ['hygiene', 'Hygiène'], ['analyses', 'Analyses prélevées ici'], ['mouts', 'Moûts reçus'], ['historique', 'Historique des opérations'],
  ],
  lot: [
    ['stades', 'Stade du vin'], ['schema', 'Schéma de vinification (opérations prévues)'], ['fermentation', 'Fermentation (courbes densité et température, alerte)'], ['composition', 'Composition calculée'],
    ['portions', 'Portions (lot + contenant + volume)'], ['intrants', 'Intrants cumulés par portion'], ['so2', 'SO₂ total estimé (analyse + ajouts depuis)'], ['amont', 'Traçabilité amont (avant réception)'],
    ['genealogie', 'Généalogie'], ['pertes', 'Pertes et écarts'], ['bilan', 'Bilan matière du lot'], ['hygiene', 'Journal d’hygiène'],
    ['mouts', 'Moûts reçus'], ['analyses', 'Analyses'], ['operations', 'Opérations du lot'],
  ],
};
const FICHE_PERSO_KEY = 'oenotrack-fiches-perso';
const ficheRubriqueNom = (kind, id) => ((FICHE_RUBRIQUES[kind] || []).find((r) => r[0] === id) || [id, id])[1];
// disposition : rubriques d'origine, puis le réglage commun, puis l'ajustement personnel (chacun remplace le précédent s'il existe)
// → [{ id, label, visible }] ; une rubrique ajoutée par une version plus récente que le réglage prend sa place d'origine
function ficheDispo(kind, ...couches) {
  const def = (FICHE_RUBRIQUES[kind] || []).map((r) => r[0]); let ordre = def.slice(); let masques = new Set();
  couches.filter((c) => c && typeof c === 'object').forEach((c) => {
    if (Array.isArray(c.ordre) && c.ordre.length) {
      const connus = uniq(c.ordre.filter((id) => def.includes(id))); ordre = connus.slice();
      def.filter((id) => !connus.includes(id)).forEach((id) => { const i = def.indexOf(id); let pos = 0; for (let k = i - 1; k >= 0; k -= 1) { const j = ordre.indexOf(def[k]); if (j >= 0) { pos = j + 1; break; } } ordre.splice(pos, 0, id); });
    }
    if (Array.isArray(c.masques)) masques = new Set(c.masques.filter((id) => def.includes(id)));
  });
  return ordre.map((id) => ({ id, label: ficheRubriqueNom(kind, id), visible: !masques.has(id) }));
}
// réglage à enregistrer : l'ordre et les rubriques masquées ; les rubriques inconnues d'un réglage plus récent sont gardées
function ficheDispoReglage(kind, dispo, ancien) {
  const def = (FICHE_RUBRIQUES[kind] || []).map((r) => r[0]); const a = ancien && typeof ancien === 'object' ? ancien : {};
  const inconnus = (L) => (Array.isArray(L) ? L.filter((id) => typeof id === 'string' && !def.includes(id)) : []);
  return { ordre: [...dispo.map((x) => x.id), ...inconnus(a.ordre)], masques: [...dispo.filter((x) => !x.visible).map((x) => x.id), ...inconnus(a.masques)] };
}
function ficheReglageCommunSet(db, kind, cfg) {
  if (!FICHE_RUBRIQUES[kind]) return fail('Fiche inconnue.');
  const fr = { ...((db.settings && db.settings.fichesRubriques) || {}) }; if (cfg) fr[kind] = cfg; else delete fr[kind];
  db.settings.fichesRubriques = fr; return okr();
}
// ajustement personnel d'un utilisateur connecté (identifiants activés) : gardé sur son compte (suit la personne d'un appareil à l'autre)
function ficheReglagePersoSet(db, uid, kind, cfg) {
  const u = (db.utilisateurs || []).find((x) => x && x.id === uid); if (!u) return fail('Utilisateur introuvable.');
  const fr = { ...(u.fichesRubriques || {}) }; if (cfg) fr[kind] = cfg; else delete fr[kind];
  if (Object.keys(fr).length) u.fichesRubriques = fr; else delete u.fichesRubriques; return okr();
}

/* ---------- doses ---------- */
// dose dans l'unité du produit : g/hL (kg/hL à partir de 1 000 g/hL), mL/hL (L/hL à partir de 1 000 mL/hL) ; jamais convertie en SO₂ pur
function doseTexte(dose, unite) {
  const u = doseUnit(unite); if (!u || dose == null || !Number.isFinite(Number(dose))) return '';
  let v = num(dose); let uu = u;
  if (Math.abs(v) >= 1000) { v /= 1000; uu = u === 'g/hL' ? 'kg/hL' : 'L/hL'; }
  const d = uu !== u ? 2 : Math.abs(v) < 1 ? 2 : Math.abs(v) < 100 ? 1 : 0;
  return `${fmt(v, d)} ${uu}`;
}
// quantité (unité du produit) pour une dose en g/hL ou mL/hL et un volume en litres
const qteDeDose = (dose, unite, volL) => { if (!hasNum(dose) || !(num(volL) > 0) || unite === 'u' || !doseUnit(unite)) return null; const b = (num(dose) * num(volL)) / 100; return unite === 'kg' || unite === 'L' ? b / 1000 : b; };
// doses successives d'une même ligne (« 3,0 + 2,0 = 5,0 g/hL ») : même unité seulement
// sansTotal (0.30.0-alpha.1) : doses appliquées à des lots différents — leur somme ne serait pas la dose d'un lot (voir les doses cumulées)
function dosesTexte(doses, unite, sansTotal) {
  const L = (doses || []).filter((d) => d != null && Number.isFinite(Number(d))); if (!L.length) return '';
  if (L.length === 1) return doseTexte(L[0], unite);
  if (sansTotal) return L.map((d) => doseTexte(d, unite)).join(' · ');
  const u = doseUnit(unite); const t = sum(L, (d) => num(d));
  return `${L.map((d) => doseTexte(d, unite).replace(` ${u}`, '').replace(/ (kg|L)\/hL$/, '')).join(' + ')} = ${doseTexte(t, unite)}`;
}

/* ---------- saisie groupée : une opération par cuve, reliées par op.groupe = { id, rang, nb, action } ---------- */
const GROUPE_ACTIONS = {
  sulfitage: { type: 'intrant', sousType: 'sulfitage', label: 'Sulfitage', intrant: true },
  levurage: { type: 'intrant', sousType: 'levurage', label: 'Levurage', intrant: true },
  collage: { type: 'intrant', sousType: 'collage', label: 'Collage', intrant: true },
  intrant: { type: 'intrant', sousType: '', label: 'Autre ajout d’intrant', intrant: true },
  suivi: { type: 'suivi', sousType: '', label: 'Relevé densité / température', releve: true },
  etape: { type: 'etape', sousType: '', label: 'Changement de stade', stade: true },
};
const groupeNouvelId = (db) => nid(db, 'grp');
const opsDuGroupe = (db, gid) => (gid ? db.ops.filter((o) => o && o.groupe && o.groupe.id === gid) : []).sort((a, b) => num(a.groupe.rang) - num(b.groupe.rang) || num(a.seq) - num(b.seq));
const prevsDuGroupe = (db, gid) => (gid ? (db.previsions || []).filter((p) => p && p.groupe && p.groupe.id === gid) : []).sort((a, b) => num(a.groupe.rang) - num(b.groupe.rang));
// enregistre (ou corrige) un groupe : lignes [{ spec, editId }] ; les anciennes opérations absentes de la liste sont supprimées. Tout ou rien.
function opsGroupeEnregistrer(db, gid, lignes, anciensIds, opts) {
  if (!gid) return fail('Groupe sans identifiant.'); if (!(lignes || []).length) return fail('Aucune cuve dans la saisie groupée.');
  const garder = new Set(lignes.map((x) => x.editId).filter(Boolean)); const ids = [];
  for (const id of anciensIds || []) if (!garder.has(id)) { const r = opDelete(db, id, opts); if (!r.ok) return r; }
  for (let i = 0; i < lignes.length; i += 1) {
    const x = lignes[i]; const spec = { ...x.spec, groupe: { ...(x.spec.groupe || {}), id: gid, rang: i + 1, nb: lignes.length } };
    const r = opSave(db, spec, x.editId || null, opts); if (!r.ok) return fail(`Ligne ${i + 1} (${x.titre || ''}) : ${r.msg}`); ids.push(r.op.id);
  }
  return okr({ ids });
}
function opsGroupeSupprimer(db, gid, opts) {
  const L = opsDuGroupe(db, gid).reverse(); if (!L.length) return fail('Groupe introuvable.');
  for (const o of L) { const r = opDelete(db, o.id, opts); if (!r.ok) return fail(`Opération « ${opNom(o)} » du ${fmtDate(o.date)} : ${r.msg}`); }
  return okr({ n: L.length });
}
// opérations à réaliser d'un groupe (planifiées depuis la saisie groupée) : items [{ type, date, f, resume, editId }]
function previsionsGroupeEnregistrer(db, gid, items, anciensIds) {
  if (!gid || !(items || []).length) return fail('Aucune cuve dans la saisie groupée.');
  const garder = new Set(items.map((x) => x.editId).filter(Boolean));
  (anciensIds || []).filter((id) => !garder.has(id)).forEach((id) => previsionDelete(db, id));
  const ids = [];
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i]; const r = previsionSave(db, it, it.editId || null); if (!r.ok) return r;
    const p = db.previsions.find((x) => x.id === r.id); p.groupe = { ...(it.groupe || {}), id: gid, rang: i + 1, nb: items.length }; ids.push(r.id);
  }
  return okr({ ids });
}

/* ---------- fermentation : relevés de densité et de température, alerte de ralentissement ---------- */
const fermReglages = (db) => { const s = ((db && db.settings) || {}).fermentation || {}; const n = (k, d) => (hasNum(s[k]) ? num(s[k]) : d);
  return { actif: s.actif !== false, lente: n('lente', 0.002), arret: n('arret', 0.0005), fin: n('fin', 0.994), recent: n('recent', 3) }; };
const densiteLue = (x) => { if (!hasNum(x)) return null; const v = num(x); return v > 100 ? v / 1000 : v; }; // 1085 (saisi sans virgule) = 1,085
// lot en fermentation alcoolique (la densité doit baisser) : stade « En FA » ou stade de fermentation personnalisé autre que la FML
const enFA = (db, stadeId) => { const d = stadeDef(db, stadeId) || {}; return d.role === 'levurage' || (d.phase === 'ferm' && d.role !== 'bacteries'); };
// points : suivis de fermentation (cuve) et analyses (densité, température) ; filtre { lotIds, contId }
function fermentationPoints(db, R, filtre) {
  const f = filtre || {}; const L = new Set(f.lotIds || []); const pts = [];
  db.ops.forEach((o) => {
    if (!o || o.type !== 'suivi' || (!hasNum(o.densite) && !hasNum(o.tempC))) return;
    const p = R.pinfo[o.portionId] || {}; if (!L.has(p.lotId)) return; if (f.contId && p.contenantId !== f.contId) return;
    pts.push({ date: o.date, seq: num(o.seq), densite: densiteLue(o.densite), temp: hasNum(o.tempC) ? num(o.tempC) : null, src: 'suivi', opId: o.id, lotId: p.lotId, contId: p.contenantId });
  });
  (db.analyses || []).forEach((a) => {
    if (!a || !L.has(a.lotId)) return; if (f.contId && a.contenantId && a.contenantId !== f.contId) return; const v = a.valeurs || {};
    if (!hasNum(v.densite) && !hasNum(v.temp)) return;
    pts.push({ date: a.date, seq: 1e9, densite: densiteLue(v.densite), temp: hasNum(v.temp) ? num(v.temp) : null, src: 'analyse', anId: a.id, lotId: a.lotId, contId: a.contenantId || '' });
  });
  return pts.filter((p) => isoOK(p.date)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq));
}
const joursEntre = (a, b) => Math.round((Date.parse(`${String(b).slice(0, 10)}T00:00:00Z`) - Date.parse(`${String(a).slice(0, 10)}T00:00:00Z`)) / 86400000);
// état d'une fermentation : vitesse de baisse de la densité entre le dernier relevé et un relevé d'au moins un jour plus tôt (7 jours au plus)
// → null (pas assez de relevés) | { etat: 'active'|'lente'|'arretee'|'finie', vitesse (densité / jour), jours, dernier, age, ancien }
function fermentationEtat(pts, reg, aujourdhui) {
  const g = reg || {}; const D = (pts || []).filter((p) => p.densite != null); if (D.length < 2) return null;
  const der = D[D.length - 1]; const age = joursEntre(der.date, aujourdhui || der.date);
  if (der.densite <= num(g.fin != null ? g.fin : 0.994)) return { etat: 'finie', vitesse: null, jours: 0, dernier: der, age, ancien: false };
  const ref = [...D].reverse().find((p) => joursEntre(p.date, der.date) >= 1 && joursEntre(p.date, der.date) <= 7); if (!ref) return null;
  const j = joursEntre(ref.date, der.date); const v = (ref.densite - der.densite) / j;
  const etat = v <= num(g.arret != null ? g.arret : 0.0005) ? 'arretee' : v <= num(g.lente != null ? g.lente : 0.002) ? 'lente' : 'active';
  return { etat, vitesse: v, jours: j, dernier: der, age, ancien: age > num(g.recent != null ? g.recent : 3) };
}
// alerte d'un contenant (lots présents en FA) ou d'un lot → null | { etat, ... , lotId }
function fermentationAlerte(db, R, { contId, lotId }, aujourdhui) {
  const reg = fermReglages(db); if (!reg.actif) return null;
  const lots = lotId ? [lotId] : uniq(contParts(R, contId).map((p) => p.lotId));
  const fa = lots.filter((id) => R.lots[id] && enFA(db, R.lots[id].stade)); if (!fa.length) return null;
  for (const id of fa) { const e = fermentationEtat(fermentationPoints(db, R, { lotIds: [id], contId: lotId ? null : contId }), reg, aujourdhui); if (e && (e.etat === 'lente' || e.etat === 'arretee')) return { ...e, lotId: id }; }
  return null;
}

/* ---------- SO₂ moléculaire (actif) ---------- */
// SO₂ moléculaire = SO₂ libre / (1 + 10^(pH − pKa)) ; pKa ≈ 1,81 dans l'eau à 20 °C, plus haut avec l'alcool (+ 0,015 par % vol)
// et la température (+ 0,01 par °C) : estimation indicative (repères IFV, AJEV), à confirmer par le laboratoire
const so2Pka = (tav, temp) => 1.81 + 0.015 * (hasNum(tav) ? num(tav) : 11) + 0.01 * ((hasNum(temp) ? num(temp) : 20) - 20);
function so2Moleculaire({ libre, ph, tav, temp }) {
  if (!hasNum(libre) || !hasNum(ph) || num(ph) <= 0 || num(ph) > 7) return null;
  const pka = so2Pka(tav, temp); const part = 1 / (1 + Math.pow(10, num(ph) - pka)); return { pka, part, moleculaire: num(libre) * part };
}
const so2LibrePour = ({ cible, ph, tav, temp }) => (!hasNum(cible) || !hasNum(ph) || num(ph) <= 0 ? null : num(cible) * (1 + Math.pow(10, num(ph) - so2Pka(tav, temp))));

/* ---------- simulateur d'enrichissement (sucre ou MCR) ---------- */
// sucre : quantité = écart × coefficient (g/L par % vol) × volume, le volume augmente de 0,6329 L par kg (valeur physique, réglable :
// sucreVolPhysique, la même que pour le tirage — 0.47.0-alpha.2) ;
// MCR (moût concentré rectifié, S g/L de sucres) : bilan de sucre avec le volume ajouté, q = V × (s1 − s0) / (S − s1)
const ENRICH_VOL_KG = SUCRE_VOL_PHYSIQUE_LKG; // valeur par défaut (0.47.0-alpha.2 : 0,62 auparavant)
function enrichSimuler(db, p) {
  const g = chaptalReglages(db); const k = num(p.coef) > 0 ? num(p.coef) : g.coef; const V = num(p.volL);
  if (!hasNum(p.tap) || !hasNum(p.tav) || !(V > 0)) return null;
  const tap = num(p.tap); const tav = num(p.tav); const ecart = Math.max(0, tav - tap);
  const r = { tap, tav, ecart, coef: k, max: g.max, depasse: g.max > 0 && ecart > g.max + 1e-9, methode: p.methode === 'mcr' ? 'mcr' : 'sucre', volL: V };
  if (r.methode === 'mcr') {
    const S = num(p.sucreMCR) > 0 ? num(p.sucreMCR) : 850; const s0 = tap * k; const s1 = tav * k;
    if (S <= s1 + 1) return { ...r, sucreMCR: S, impossible: true };
    const q = (V * (s1 - s0)) / (S - s1); return { ...r, sucreMCR: S, mcrL: q, sucreKg: (q * S) / 1000, volFinalL: V + q };
  }
  const kg = (ecart * k * V) / 1000; return { ...r, sucreKg: kg, volFinalL: V + kg * sucreVolPhysique(db) };
}

/* ---------- étiquettes QR et liens directs vers une fiche de cuve ---------- */
const QR_PREFIXE = 'OENOTRACK:CUVE:'; // code seul (sans adresse) : lu par le scanner d'Œnotrack
const qrReglages = (db) => { const s = ((db && db.settings) || {}).qr || {}; return { mode: s.mode === 'code' ? 'code' : 'lien', base: String(s.base || '').trim() }; };
const qrBaseValide = (s) => { try { const u = new URL(String(s || '').trim()); return (u.protocol === 'https:' || (u.protocol === 'http:' && /^(localhost|127\.0\.0\.1)$/.test(u.hostname))) && !/(^|\.)(claude\.ai|claudeusercontent\.com)$/.test(u.hostname); } catch (e) { return false; } };
const lienCuve = (base, id) => `${String(base || '').trim().replace(/#.*$/, '')}#cuve=${encodeURIComponent(id)}`;
function lienCuveLire(hash, search) {
  const h = String(hash || '').replace(/^#/, ''); const m = /(?:^|&)cuve=([^&]+)/.exec(h) || /(?:^|[?&])cuve=([^&#]+)/.exec(String(search || ''));
  if (!m) return null; let id = ''; try { id = decodeURIComponent(m[1]); } catch (e) { return null; } return /^[\w.-]{1,80}$/.test(id) ? { cuve: id } : null;
}
// contenu du QR d'une cuve : adresse d'Œnotrack en ligne + identifiant (mode « lien »), ou code seul (mode « code », ou adresse non réglée)
const qrTexteCuve = (db, id, baseDefaut) => { const q = qrReglages(db); const base = q.base || baseDefaut || ''; return q.mode === 'lien' && qrBaseValide(base) ? lienCuve(base, id) : `${QR_PREFIXE}${id}`; };
function qrLire(texte) {
  const s = String(texte || '').trim(); if (!s) return null;
  if (s.toUpperCase().startsWith(QR_PREFIXE)) { const id = s.slice(QR_PREFIXE.length).trim(); return /^[\w.-]{1,80}$/.test(id) ? { cuve: id } : null; }
  try { const u = new URL(s); return lienCuveLire(u.hash, u.search); } catch (e) { return null; }
}

/* ---------- planche d'étiquettes A4 personnalisable (0.38.0-alpha.1) ----------
   Colonnes × lignes, largeur × hauteur d'une étiquette, marges (haut, gauche) et espacements (entre colonnes, entre lignes), en mm.
   Les deux formats standards (A4 24 × 70 × 37 mm, A6) restent proposés tels quels. Modèles courants : dimensions « à vérifier »
   sur la notice des planches achetées (les fabricants publient le gabarit exact). */
const ETIQ_A4 = { l: 210, h: 297 };
const ETIQ_PERSO_DEFAUT = { cols: 3, lignes: 8, largeur: 70, hauteur: 37, margeHaut: 0, margeGauche: 0, espH: 0, espV: 0 };
const ETIQ_PERSO_MODELES = [
  { id: 'a4-24', nom: '24 étiquettes 70 × 37 mm (3 × 8)', v: { cols: 3, lignes: 8, largeur: 70, hauteur: 37, margeHaut: 0.5, margeGauche: 0, espH: 0, espV: 0 } },
  { id: 'a4-21', nom: '21 étiquettes 63,5 × 38,1 mm (3 × 7)', v: { cols: 3, lignes: 7, largeur: 63.5, hauteur: 38.1, margeHaut: 15.15, margeGauche: 7.2, espH: 2.5, espV: 0 } },
  { id: 'a4-14', nom: '14 étiquettes 99,1 × 38,1 mm (2 × 7)', v: { cols: 2, lignes: 7, largeur: 99.1, hauteur: 38.1, margeHaut: 15.15, margeGauche: 4.65, espH: 2.5, espV: 0 } },
  { id: 'a4-8', nom: '8 étiquettes 99,1 × 67,7 mm (2 × 4)', v: { cols: 2, lignes: 4, largeur: 99.1, hauteur: 67.7, margeHaut: 13.1, margeGauche: 4.65, espH: 2.5, espV: 0 } },
  { id: 'a4-40', nom: '40 étiquettes 48,5 × 25,4 mm (4 × 10)', v: { cols: 4, lignes: 10, largeur: 48.5, hauteur: 25.4, margeHaut: 21.5, margeGauche: 8, espH: 0, espV: 0 } },
  { id: 'a4-65', nom: '65 étiquettes 38,1 × 21,2 mm (5 × 13)', v: { cols: 5, lignes: 13, largeur: 38.1, hauteur: 21.2, margeHaut: 10.7, margeGauche: 4.7, espH: 2.5, espV: 0 } },
];
const ETIQ_BORNES = { cols: [1, 10], lignes: [1, 30], largeur: [10, 210], hauteur: [10, 297], margeHaut: [0, 150], margeGauche: [0, 150], espH: [0, 50], espV: [0, 50] };
// réglage lu (stockage de l'appareil, saisie) → valeurs bornées ; un champ illisible reprend la valeur par défaut
function etiqPersoNorm(o) {
  const x = o && typeof o === 'object' ? o : {}; const r = {};
  Object.keys(ETIQ_PERSO_DEFAUT).forEach((k) => { const t = String(x[k] == null ? '' : x[k]).trim().replace(',', '.'); const v = Number(t); const [a, b] = ETIQ_BORNES[k]; r[k] = t !== '' && Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : ETIQ_PERSO_DEFAUT[k]; });
  r.cols = Math.round(r.cols); r.lignes = Math.round(r.lignes); return r;
}
// mise en page : étiquettes par page, encombrement (mm) et ce qui dépasse de la feuille A4
function etiqPersoMise(o) {
  const p = etiqPersoNorm(o); const lt = p.margeGauche + p.cols * p.largeur + (p.cols - 1) * p.espH; const ht = p.margeHaut + p.lignes * p.hauteur + (p.lignes - 1) * p.espV;
  const erreurs = [];
  if (lt > ETIQ_A4.l + 0.5) erreurs.push(`Trop large pour une feuille A4 : ${r2(lt)} mm pour ${ETIQ_A4.l} mm (réduisez la largeur, les colonnes, la marge gauche ou l’espacement).`);
  if (ht > ETIQ_A4.h + 0.5) erreurs.push(`Trop haut pour une feuille A4 : ${r2(ht)} mm pour ${ETIQ_A4.h} mm (réduisez la hauteur, les lignes, la marge du haut ou l’espacement).`);
  const haute = p.hauteur >= p.largeur * 0.9; // étiquette haute : QR au-dessus du nom
  const pad = Math.max(1.5, Math.min(4, Math.min(p.largeur, p.hauteur) * 0.09));
  const qr = Math.max(6, haute ? Math.min(p.largeur - 2 * pad, p.hauteur * 0.62) : Math.min(p.hauteur - 2 * pad, p.largeur * 0.45));
  const k = Math.max(0.45, Math.min(2.2, haute ? p.largeur / 70 : Math.min(p.hauteur / 37, (p.largeur - qr) / 41)));
  return { ...p, parPage: p.cols * p.lignes, largeurTotale: r2(lt), hauteurTotale: r2(ht), erreurs, valide: !erreurs.length, haute, pad: r2(pad), qr: r2(qr), echelle: r2(k) };
}

/* ---------- rappel de sauvegarde (données gardées seulement sur cet appareil) ---------- */
// → { montrer, jours (depuis la dernière sauvegarde), jamais }
// (jamais sauvegardée : compté depuis la création de la base)
function rappelSauvegardeEtat({ derniere, depuis, jours, lie, vide, aujourdhui, reporte }) {
  if (lie || vide) return { montrer: false };
  const J = hasNum(jours) && num(jours) > 0 ? num(jours) : 7; const ref = derniere || depuis || null; const n = ref ? joursEntre(ref, aujourdhui) : null;
  if (reporte && String(reporte) >= String(aujourdhui)) return { montrer: false, jours: n, jamais: !derniere };
  return { montrer: n == null || n > J, jours: n, jamais: !derniere };
}

/* ---------- arrondis ---------- */
const r3 = (x) => Math.round((num(x) + Number.EPSILON) * 1000) / 1000;
const r4 = (x) => Math.round((num(x) + Number.EPSILON) * 10000) / 10000;
