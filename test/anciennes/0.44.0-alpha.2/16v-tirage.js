/* ============ TIRAGE (0.42.0-alpha.1) : profil, calculateur, fonte de liqueur, levain (étapes, propagation, recalibrage), VRTP ============
   Valeurs par défaut tirées des méthodes de cave courantes (plan de levain en 4 étapes, propagation à 15 % d'alimentation, liqueur à
   500 g/L) : toutes « à vérifier » et modifiables (Paramètres › Calculs œnologiques › Tirage, et sur chaque levain).
   Texte vérifié : cahier des charges AOC Champagne (arrêté du 31/07/2025), ch. I, VIII 2° d) — volumes résultant d'exigences
   techniques particulières (VRTP) au stade du tirage ≤ 1 % des volumes mis en œuvre ; augmentation de volume par la liqueur de tirage
   ≤ 1,12 % pour 1 % vol d'augmentation du TAV.
   VRTP d'un tirage = volume tiré (cols × contenance ; 0,0075 hL par bouteille de 75 cL) − liqueur utilisée − vin (levain + mixtion). */

const TIRAGE_FORMATS = [
  { id: 'quart', label: 'Quart (20 cL)', L: 0.2 }, { id: 'demie', label: 'Demie (37,5 cL)', L: 0.375 }, { id: 'bouteille', label: 'Bouteille (75 cL)', L: 0.75 },
  { id: 'magnum', label: 'Magnum (1,5 L)', L: 1.5 }, { id: 'jeroboam', label: 'Jéroboam (3 L)', L: 3 }, { id: 'rehoboam', label: 'Réhoboam (4,5 L)', L: 4.5 },
  { id: 'mathusalem', label: 'Mathusalem (6 L)', L: 6 }, { id: 'salmanazar', label: 'Salmanazar (9 L)', L: 9 }, { id: 'balthazar', label: 'Balthazar (12 L)', L: 12 },
  { id: 'nabuchodonosor', label: 'Nabuchodonosor (15 L)', L: 15 },
];
const tirageFormat = (id) => TIRAGE_FORMATS.find((f) => f.id === id) || null;
const TIRAGE_VRTP_MAX_PCT = 1; // cahier des charges AOC Champagne, ch. I, VIII 2° d) (vérifié, arrêté du 31/07/2025)
const TIRAGE_SOURCE_VRTP = 'Cahier des charges de l’AOC Champagne (arrêté du 31/07/2025), ch. I, VIII 2° d)';

// profil de tirage : réglage commun (settings.tirageProfil), chaque levain ou calcul peut le surcharger
const TIRAGE_PROFIL_DEFAUT = () => ({
  levainPct: 5, // levain incorporé (% du volume de mixtion)
  titreLiqueurGL: 500, // liqueur de tirage (g de sucre par L)
  volSucreLkg: 0.66, // augmentation de volume du saccharose (L par kg) : 1 kg + 1,34 L de vin = 2 L de liqueur à 500 g/L
  sucreLevainGL: 0, // sucre encore présent dans le levain incorporé (g/L), retranché de la liqueur à ajouter
  levainEauPct: 18, // part d'eau du levain (réhydratation, multiplications, alimentations), pour le VRTP prévisionnel
  levainLiqueurPct: 7, // part de liqueur du levain (comptée avec la liqueur utilisée)
  remplissagePct: 0, // volume préparé en plus (casse, remplissage, fond de cuve)
  densPtParGL: 0.4, // points de densité par g/L de sucre (24 g/L ≈ +9,6)
  sucreMaxKgHL: 2.7, // repère déclaratif (kg de sucre par hL, tirage + levain) : avertissement au-delà
  adjuvants: [], // [{ id, nom, produitId, doseLhL }] adjuvants de remuage, en L (ou kg) par hL de mixtion
  etapes: {
    lsaGhL: 4, activateurGhL: 4, eauRehydLkg: 10, tempRehyd: 35, tempRehydMax: 40,
    acclim: { facteur: 3, liqueurPart: 0.38, dapGL: 0.25, temp: 20, tempMax: 28, densite: 1010 },
    mult1: { partDeMult2: 0.5, eauPct: 11, sucreGL: 40, dapGL: 0.15, temp: 18 },
    mult2: { eauPct: 11, sucreGL: 35, dapGL: 0.15, temp: 16 },
    densiteMin: 996, rechargeGL: 20,
  },
  propagation: { alimPct: 15, liqueurPct: 4, eauPct: 5, phosG: 100, phosGPetit: 50, seuilPhosL: 99, restantFinL: 0, alimMaxPct: 25 },
});
const tirageFusion = (a, b) => { const o = { ...a }; Object.keys(b || {}).forEach((k) => { const v = b[k]; o[k] = v && typeof v === 'object' && !Array.isArray(v) && a[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? tirageFusion(a[k], v) : v; }); return o; };
function tirageProfil(db, sur) {
  const s = (db && db.settings) || {}; const base = tirageFusion(TIRAGE_PROFIL_DEFAUT(), s.tirageProfil || {});
  delete base.pointGL; // 0.42.0-alpha.1 : le point de tirage se choisit pour chaque cuvée (calcul, levain, tirage), jamais dans les réglages communs
  return sur ? tirageFusion(base, sur) : base;
}
function tirageProfilSet(db, p, par) {
  const x = p || {}; const n = (k, min, max) => (x[k] === undefined || x[k] === '' ? undefined : num(x[k]));
  for (const [k, a, b] of [['levainPct', 0, 20], ['titreLiqueurGL', 100, 800], ['volSucreLkg', 0.5, 0.8], ['remplissagePct', 0, 10], ['levainEauPct', 0, 100], ['levainLiqueurPct', 0, 50], ['sucreLevainGL', 0, 200]]) {
    const v = n(k); if (v !== undefined && (!(v >= a) || v > b)) return fail(`Valeur hors limites : ${k} (${a} à ${b}).`);
  }
  const nombres = (o) => (Array.isArray(o) ? o.map(nombres) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, ['id', 'nom', 'produitId', 'par', 'le'].includes(k) ? v : nombres(v)])) : typeof o === 'string' && o.trim() !== '' && hasNum(o) ? num(o) : o);
  const { pointGL, ...sans } = nombres(clone(x)); // le point de tirage n'est pas un réglage commun
  db.settings.tirageProfil = { ...(db.settings.tirageProfil || {}), ...sans, par: par || '', le: new Date().toISOString() }; delete db.settings.tirageProfil.pointGL;
  return okr();
}

/* ---------- calculateur : vin → mixtion (équivalent bouteilles), ou bouteilles → besoins ---------- */
// fractions de la mixtion : levain, liqueur, adjuvants, vin de base
function tirageFractions(p) {
  const fLev = num(p.levainPct) / 100; const titre = num(p.titreLiqueurGL) || 500;
  const fLiq = Math.max(0, (num(p.pointGL) - fLev * num(p.sucreLevainGL)) / titre);
  const fAdj = sum(p.adjuvants || [], (a) => num(a.doseLhL)) / 100;
  return { fLev, fLiq, fAdj, fVin: 1 - fLev - fLiq - fAdj };
}
const tirageVolFormats = (formats) => sum(formats || [], (f) => num(f.nb) * (num(f.L) || (tirageFormat(f.format) || {}).L || 0.75));
const tirageNbFormats = (formats) => sum(formats || [], (f) => num(f.nb));
/**
 * entree : { mode: 'vin', vinL } ou { mode: 'cols', formats: [{ format, nb }] } (ou { mode: 'mixtion', mixL }) ; profil : tirageProfil(…)
 * → { ok, mixL, vinL, liqueurL, levainL, adjuvants [{ nom, L }], sucreKg, vinFonteL, formats [{ format, nb, L }], eqBouteilles,
 *     vinMisEnOeuvreL, vrtpL (prévisionnel), vrtpPct, alertes }
 */
function tirageCalcul(entree, p) {
  const e = entree || {}; if (!(hasNum(p.pointGL) && num(p.pointGL) >= 0)) return fail('Indiquez le point de tirage de la cuvée (g/L de sucre apporté par la liqueur).'); const F = tirageFractions(p); const alertes = [];
  if (!(F.fVin > 0.5)) return fail('Les parts de levain, de liqueur et d’adjuvants dépassent la moitié de la mixtion : vérifiez le profil.');
  const marge = 1 + num(p.remplissagePct) / 100; let mixL = 0; let formats = [];
  if (e.mode === 'vin') { if (!(num(e.vinL) > 0)) return fail('Indiquez le volume de vin de base.'); mixL = num(e.vinL) / F.fVin; }
  else if (e.mode === 'mixtion') { if (!(num(e.mixL) > 0)) return fail('Indiquez le volume de mixtion.'); mixL = num(e.mixL); }
  else { formats = (e.formats || []).filter((f) => num(f.nb) > 0).map((f) => ({ format: f.format || 'bouteille', nb: Math.round(num(f.nb)), L: num(f.L) || (tirageFormat(f.format) || {}).L || 0.75 })); if (!formats.length) return fail('Indiquez le nombre de cols à tirer.'); mixL = tirageVolFormats(formats) * marge; }
  const utileL = mixL / marge; // volume réellement mis en bouteilles
  if (e.mode !== 'cols') { const fm = tirageFormat(e.format || 'bouteille') || TIRAGE_FORMATS[2]; formats = [{ format: fm.id, nb: Math.floor(utileL / fm.L + 1e-9), L: fm.L }]; }
  const levainL = mixL * F.fLev; const liqueurL = mixL * F.fLiq; const vinL = mixL * F.fVin; const titre = num(p.titreLiqueurGL) || 500;
  const sucreKg = liqueurL * titre / 1000; const vinFonteL = Math.max(0, liqueurL - sucreKg * num(p.volSucreLkg));
  const adjuvants = (p.adjuvants || []).filter((a) => num(a.doseLhL) > 0).map((a) => ({ id: a.id, nom: a.nom, produitId: a.produitId || '', doseLhL: num(a.doseLhL), L: mixL * num(a.doseLhL) / 100 }));
  const liqLevainL = levainL * num(p.levainLiqueurPct) / 100; const vinLevainL = levainL * Math.max(0, 1 - num(p.levainEauPct) / 100 - num(p.levainLiqueurPct) / 100); // levain : eau, liqueur, vin (prévision)
  const vrtpL = Math.max(0, mixL - liqueurL - liqLevainL - vinL - vinLevainL); const vinMisEnOeuvreL = vinL + vinLevainL; // VRTP = volume − liqueur utilisée − vin (levain + mixtion)
  const vrtpPct = vinMisEnOeuvreL > 0 ? vrtpL / vinMisEnOeuvreL * 100 : 0;
  if (vrtpPct > TIRAGE_VRTP_MAX_PCT + 1e-9) alertes.push(`VRTP prévisionnel ${fmt(vrtpPct, 2)} % : au-delà de ${TIRAGE_VRTP_MAX_PCT} % des volumes mis en œuvre.`);
  const sucreKgHL = vinMisEnOeuvreL > 0 ? sucreKg / (vinMisEnOeuvreL / 100) : 0;
  if (num(p.sucreMaxKgHL) > 0 && sucreKgHL > num(p.sucreMaxKgHL) + 1e-9) alertes.push(`Sucre ${fmt(sucreKgHL, 2)} kg/hL : au-delà du repère de ${fmt(num(p.sucreMaxKgHL), 2)} kg/hL.`);
  return okr({ mixL, utileL, vinL, liqueurL, levainL, adjuvants, sucreKg, sucreKgHL, vinFonteL, formats, eqBouteilles: utileL / 0.75, nbCols: tirageNbFormats(formats), vinMisEnOeuvreL, vinLevainL, liqLevainL, liqueurTotaleL: liqueurL + liqLevainL, vrtpL, vrtpPct, alertes, fractions: F });
}

/* ---------- liqueur de tirage : fonte et correction du point de tirage ---------- */
// { volL } ou { sucreKg } → sucre, vin de fonte et volume de liqueur (augmentation de volume du saccharose comprise)
function liqueurFonte(e, titreGL, volSucreLkg) {
  const t = num(titreGL) || 500; const k = hasNum(volSucreLkg) ? num(volSucreLkg) : 0.66;
  if (t * k / 1000 >= 1) return fail('Titre de liqueur impossible avec cette augmentation de volume du sucre.');
  let volL; let sucreKg;
  if (e && num(e.sucreKg) > 0) { sucreKg = num(e.sucreKg); volL = sucreKg * 1000 / t; } else if (e && num(e.volL) > 0) { volL = num(e.volL); sucreKg = volL * t / 1000; } else if (e && num(e.vinL) > 0) { volL = num(e.vinL) / (1 - t * k / 1000); sucreKg = volL * t / 1000; } else return fail('Indiquez le volume de liqueur, la masse de sucre ou le volume de vin.');
  return okr({ volL, sucreKg, vinL: volL - sucreKg * k, augmentationL: sucreKg * k, titreGL: t });
}
// fonte enregistrée avec la préparation : titre, sucre, augmentation de volume, densité relevée (brute, température, corrigée à 20 °C)
function liqueurFonteSpec(x) {
  const o = {}; ['titreGL', 'sucreKg', 'volSucreLkg', 'vinL', 'densite', 'tempC', 'densite20', 'acideCitriqueG'].forEach((k) => { if (hasNum(x[k])) o[k] = num(x[k]); });
  if (x.notes) o.notes = String(x.notes).trim(); return Object.keys(o).length ? o : null;
}
// point de tirage : densité théorique = densité du vin + points par g/L × g/L visés ; liqueur à ajouter si la densité lue est trop basse
function tirageCorrection(e, p) {
  const k = num((p || {}).densPtParGL) || 0.4; const dth = num(e.densInit) + k * num(e.pointGL);
  const manqueGL = (dth - num(e.densLue)) / k; const liqueurL = manqueGL * num(e.volL) / (num((p || {}).titreLiqueurGL) || 500);
  return { densTheo: dth, manqueGL, liqueurL: Math.max(0, liqueurL), excesGL: manqueGL < 0 ? -manqueGL : 0 };
}

/* ---------- levain : étapes (réhydratation, acclimatation, 1re et 2e multiplication) ---------- */
// e : { mixTotalL (volume total de mixtion des tirages servis), levainJour1L (levain à avoir le 1er jour de tirage) }
function levainEtapes(e, p) {
  const E = (p || {}).etapes || TIRAGE_PROFIL_DEFAUT().etapes; const t = num(p.titreLiqueurGL) || 500; const mixHL = num(e.mixTotalL) / 100;
  const lsaKg = mixHL * num(E.lsaGhL) / 1000; const actKg = mixHL * num(E.activateurGhL) / 1000;
  const rehyd = { etape: 'rehydratation', eauL: lsaKg * num(E.eauRehydLkg), lsaKg, activateurKg: actKg, temp: num(E.tempRehyd), tempMax: num(E.tempRehydMax) }; rehyd.totalL = rehyd.eauL;
  const A = E.acclim || {}; const acc = { etape: 'acclimatation', totalL: rehyd.totalL * num(A.facteur || 3), temp: num(A.temp), tempMax: num(A.tempMax), densite: num(A.densite) };
  acc.liqueurL = num(A.liqueurPart) * (acc.totalL - rehyd.totalL); acc.dapG = num(A.dapGL) * acc.totalL; acc.eauL = Math.max(0, acc.totalL - rehyd.totalL - acc.liqueurL); acc.vinL = 0;
  const M2 = E.mult2 || {}; const M1 = E.mult1 || {};
  const m2 = { etape: 'mult2', totalL: Math.max(num(e.levainJour1L), acc.totalL * 2), temp: num(M2.temp) };
  const m1 = { etape: 'mult1', totalL: Math.max(m2.totalL * num(M1.partDeMult2 || 0.5), acc.totalL), temp: num(M1.temp) };
  const remplir = (m, M, avant) => { m.eauL = m.totalL * num(M.eauPct) / 100; m.liqueurL = m.totalL * num(M.sucreGL) / t; m.dapG = num(M.dapGL) * m.totalL; m.vinL = Math.max(0, m.totalL - avant - m.eauL - m.liqueurL); m.ajoutL = m.totalL - avant; };
  remplir(m1, M1, acc.totalL); remplir(m2, M2, m1.totalL);
  return [rehyd, acc, m1, m2];
}

/* ---------- levain : propagation sur plusieurs jours de tirage ---------- */
// jours : [{ date, mixL (volume de mixtion tiré ce jour) | cols }] ; le plan se calcule du dernier jour vers le premier :
// tiré(j) = mixtion(j) × taux ; restant(j) = avant(j+1) − alimentation(j) ; alimentation(j) = alimPct × avant(j+1) (liqueur, eau, vin)
function levainPropagation(jours, p, opts) {
  const P = (p || {}).propagation || TIRAGE_PROFIL_DEFAUT().propagation; const taux = num(p.levainPct) / 100; const o = opts || {};
  const J = (jours || []).filter((j) => j && isoOK(j.date)).map((j) => ({ ...j, mixL: num(j.mixL) > 0 ? num(j.mixL) : num(j.cols) * 0.75 })).sort((a, b) => a.date.localeCompare(b.date));
  const rows = J.map((j) => ({ date: j.date, mixL: j.mixL, cols: j.mixL / 0.75, tireL: j.mixL * taux }));
  let avantSuivant = null;
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const r = rows[i];
    if (avantSuivant === null) { r.alimL = 0; r.liqueurL = 0; r.eauL = 0; r.vinL = 0; r.phosG = 0; r.restantL = num(P.restantFinL); }
    else { r.liqueurL = avantSuivant * num(P.liqueurPct) / 100; r.eauL = avantSuivant * num(P.eauPct) / 100; r.alimL = avantSuivant * num(P.alimPct) / 100; r.vinL = Math.max(0, r.alimL - r.liqueurL - r.eauL); r.phosG = r.vinL > num(P.seuilPhosL) ? num(P.phosG) : num(P.phosGPetit); r.restantL = avantSuivant - r.alimL; }
    r.avantL = r.tireL + r.restantL; avantSuivant = r.avantL;
  }
  const total = { tireL: sum(rows, (r) => r.tireL), liqueurL: sum(rows, (r) => r.liqueurL), eauL: sum(rows, (r) => r.eauL), vinL: sum(rows, (r) => r.vinL), phosG: sum(rows, (r) => r.phosG), mixL: sum(rows, (r) => r.mixL) };
  return { rows, total, levainJour1L: rows.length ? rows[0].avantL : 0, alertes: o.alertes || [] };
}
// recalibrage : le tirage n'avance jamais exactement au rythme prévu — on repart du levain réellement disponible et des jours restants
// reel : { date, restantL (levain disponible après le tirage du jour, mesuré ou calculé) } → alimentation à faire aujourd'hui pour le plan restant
function levainRecalibrer(jours, p, reel) {
  const P = (p || {}).propagation || TIRAGE_PROFIL_DEFAUT().propagation; const r0 = reel || {};
  const futurs = (jours || []).filter((j) => j && isoOK(j.date) && j.date > r0.date);
  const plan = levainPropagation(futurs, p); const besoinL = plan.levainJour1L; const dispo = Math.max(0, num(r0.restantL));
  if (!futurs.length) return { plan, besoinL: 0, alimL: 0, liqueurL: 0, eauL: 0, vinL: 0, phosG: 0, excedentL: dispo, alertes: [] };
  const alimL = Math.max(0, besoinL - dispo); const part = (x) => (num(P.alimPct) > 0 ? num(x) / num(P.alimPct) : 0);
  const liqueurL = alimL * part(P.liqueurPct); const eauL = alimL * part(P.eauPct); const vinL = Math.max(0, alimL - liqueurL - eauL); const alertes = [];
  if (besoinL > 0 && alimL / besoinL * 100 > num(P.alimMaxPct || 25)) alertes.push(`Alimentation de ${fmt(alimL / besoinL * 100, 0)} % du levain : au-delà de ${num(P.alimMaxPct || 25)} %, le levain se dilue — préparez un second levain plutôt que de le réalimenter.`);
  return { plan, besoinL, alimL, liqueurL, eauL, vinL, phosG: vinL > num(P.seuilPhosL) ? num(P.phosG) : alimL > 0 ? num(P.phosGPetit) : 0, excedentL: Math.max(0, dispo - besoinL), alertes };
}

/* ---------- composition d'une préparation (vin, liqueur, eau, autre) : VRTP et déclarations ---------- */
const prepCompoVide = () => ({ vin: 0, liqueur: 0, eau: 0, autre: 0 });
// part de chaque composant (0..1) d'une préparation de R ; liqueur de tirage = liqueur entière
function prepCompo(R, prepId) {
  const p = (R.preps || {})[prepId]; if (!p) return { vin: 0, liqueur: 0, eau: 0, autre: 1 };
  if (p.ptype === 'liqueur_tirage' || p.ptype === 'liqueur_exp') return { vin: 0, liqueur: 1, eau: 0, autre: 0 };
  const c = p.compo || prepCompoVide(); const t = c.vin + c.liqueur + c.eau + c.autre; if (!(t > 0)) return { vin: 0, liqueur: 0, eau: 0, autre: 1 };
  return { vin: c.vin / t, liqueur: c.liqueur / t, eau: c.eau / t, autre: c.autre / t };
}
// bilan d'un tirage : vin (mixtion + part de vin des levains), liqueur (liqueurs + part de liqueur des levains), volume tiré, VRTP
function tirageBilan(db, R, op) {
  let vinMix = 0; let vinLev = 0; let liq = 0; let eau = 0; let autre = 0;
  (op.sources || []).forEach((s) => { const c = (R.lotCompo || {})[s.lotId]; const v = num(s.volL); if (!c) { vinMix += v; return; } vinMix += v * c.vin; liq += v * c.liqueur; eau += v * c.eau; autre += v * c.autre; }); // cuve de mixtion (0.42.0-alpha.2)
  (op.prepUses || []).forEach((u) => { const c = prepCompo(R, u.prepId); const v = num(u.volL); liq += v * c.liqueur; vinLev += v * c.vin; eau += v * c.eau; autre += v * c.autre; });
  const formats = Array.isArray(op.formats) && op.formats.length ? op.formats : [{ format: 'bouteille', nb: num(op.nbBouteilles), L: num(op.volBouteilleL) || 0.75 }];
  const tireL = tirageVolFormats(formats); const vin = vinMix + vinLev; const vrtpL = tireL - liq - vin;
  const levL = sum(op.prepUses || [], (u) => (((R.preps || {})[u.prepId] || {}).ptype === 'levain' ? num(u.volL) : 0)); // levain sans composition saisie : son volume inconnu compte dans le VRTP
  return { tireL, vinMixL: vinMix, vinLevainL: vinLev, vinL: vin, liqueurL: liq, eauL: eau, autreL: autre, vrtpL, vrtpPct: vin > 0 ? vrtpL / vin * 100 : 0, depasse: vin > 0 && vrtpL / vin * 100 > TIRAGE_VRTP_MAX_PCT + 1e-9, formats, compoIncomplete: levL > 0 && autre > 0.5 * levL };
}
const tirageVrtp = (cols75, liqueurL, vinL) => num(cols75) * 0.75 - num(liqueurL) - num(vinL); // formule de l'exploitation (L) : bouteilles × 0,0075 hL − liqueur − vin

/* ---------- revendications : levain et liqueur doivent convenir au lot tiré (sinon déclassement, confirmé à la saisie) ---------- */
// lotQualif : revendication des vins de base ; preps : préparations utilisées → messages (vides si tout est compatible)
function tirageRevendicationAlertes(db, R, lotQualif, prepIds) {
  const q = lotQualif || 'conv'; const out = [];
  uniq(prepIds || []).forEach((id) => { const p = (R.preps || {})[id]; if (!p) return; const pq = p.qualif || 'conv'; if (pq !== q && rang(pq) < rang(q)) out.push(`${PREP_TYPES[p.ptype] || 'Préparation'} ${p.code} (${qLabel(pq)}) dans un lot ${qLabel(q)} : le lot sera déclassé en ${qLabel(pq)} (alerte de déclassement).`); });
  return out;
}
// levains et liqueurs disponibles pour une revendication (compatibles d'abord)
const tiragePrepsPour = (R, ptype, qualif) => Object.values(R.preps || {}).filter((p) => p.ptype === ptype && p.remaining > 0.05).sort((a, b) => ((a.qualif === qualif ? 0 : 1) - (b.qualif === qualif ? 0 : 1)) || String(b.date).localeCompare(String(a.date)));

/* ---------- suivi d'un levain : alimentations et relevés (opérations « alimentation ») ---------- */
const LEVAIN_ETAPES = [{ id: 'rehydratation', label: 'Réhydratation' }, { id: 'acclimatation', label: 'Acclimatation à l’alcool' }, { id: 'mult1', label: '1re multiplication' }, { id: 'mult2', label: '2e multiplication' }, { id: 'alimentation', label: 'Alimentation (propagation)' }, { id: 'releve', label: 'Relevé (densité, température, aération)' }, { id: 'labo', label: 'Contrôle laboratoire' }];
const levainEtapeLabel = (id) => (LEVAIN_ETAPES.find((x) => x.id === id) || { label: id || '—' }).label;
const levainSuivi = (db, prepId) => (db.ops || []).filter((o) => o && o.type === 'alimentation' && o.prepId === prepId).sort(byDate);
// volume prélevé chaque jour dans un levain (tirages) et alimentations faites, pour le tableau de propagation « réalisé »
function levainRealise(db, R, prepId) {
  const par = {}; const j = (d) => (par[d] = par[d] || { date: d, tireL: 0, liqueurL: 0, vinL: 0, eauL: 0, alimL: 0 });
  (R.prepUse || []).filter((u) => u.prepId === prepId).forEach((u) => { j(u.date).tireL += num(u.volL); });
  levainSuivi(db, prepId).forEach((o) => { const x = j(o.date); const liq = sum(o.prepUses || [], (u) => u.volL); x.liqueurL += liq; x.vinL += num(o.sourceVolL); x.eauL += num(o.eauL); x.alimL += liq + num(o.sourceVolL) + num(o.eauL) + num(o.autreL); });
  return Object.values(par).sort((a, b) => a.date.localeCompare(b.date));
}

// plan du levain enregistré avec la préparation (jours de tirage prévus, mixtion servie, taux propres) ; modifiable à tout moment (recalibrage)
function levainPlanSet(db, prepId, plan) {
  const op = (db.ops || []).find((o) => o && o.type === 'preparation' && o.prepId === prepId); if (!op) return fail('Levain introuvable.');
  if (isLocked(db, op.date)) return fail('Ce levain appartient à une campagne figée.');
  const jours = (plan.jours || []).filter((j) => j && isoValide(j.date) && num(j.cols) > 0).map((j) => ({ date: j.date, cols: Math.round(num(j.cols)) })).sort((a, b) => a.date.localeCompare(b.date));
  if (uniq(jours.map((j) => j.date)).length !== jours.length) return fail('Deux jours de tirage ont la même date.');
  const sur = {}; const P = plan.sur || {}; ['levainPct', 'pointGL', 'titreLiqueurGL'].forEach((k) => { if (hasNum(P[k])) sur[k] = num(P[k]); }); if (P.propagation && hasNum(P.propagation.alimPct)) sur.propagation = { alimPct: num(P.propagation.alimPct) };
  op.levainPlan = { jours, ...(hasNum(plan.mixTotalL) ? { mixTotalL: num(plan.mixTotalL) } : {}), sur, maj: new Date().toISOString() };
  op.av = Math.max(num(op.av), APP_NUM); // une version antérieure qui réécrit l'opération garde le plan
  return okr();
}
