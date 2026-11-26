/* ============ SCHÉMAS DE VINIFICATION (0.31.0-alpha.1) ============
   Un schéma est une suite d'étapes types — jour après la création du lot (J+n), opération du catalogue, famille de produit et dose —
   proposée à la création d'un lot (pressurage, entrée de moûts) selon ses critères : cépage majoritaire, fraction, état sanitaire des
   raisins. Validé en un clic, il devient une saisie groupée d'opérations à réaliser (quantité = dose × volume du lot), à valider ensuite
   une à une ou en groupe, comme toute opération planifiée.
   db.schemas (absent : exemples ci-dessous, « à vérifier », copiés dans la base à la 1re modification ; champs inconnus gardés) :
     { id, nom, criteres: { cepages: [ids], fractions: [ids], etats: ['sain' | 'altere'] }, etapes: [étape], note, exemple, aVerifier, verifiePar, verifieLe }
     étape : { id, jour, opId (catalogue des opérations), famille (catalogues de produits), dose, unite: 'g/hL' | 'mL/hL' | 'so2' (g de SO₂ par hL), note }
   Les doses d'exemple sont des valeurs courantes, non officielles : à adapter avec votre œnologue et à vérifier sur la fiche technique. */
const SCHEMA_ETATS = [{ id: 'sain', label: 'Sain' }, { id: 'altere', label: 'Altéré (même faiblement)' }];
const SCHEMA_UNITES = [{ id: 'g/hL', label: 'g/hL de produit' }, { id: 'mL/hL', label: 'mL/hL de produit' }, { id: 'so2', label: 'g/hL de SO₂ apporté' }];
const SE = (id, jour, opId, o) => ({ id, jour, opId, famille: '', dose: null, unite: '', note: '', ...(o || {}) });
// étapes communes d'une vinification en blanc (moût de presse) : sulfitage, enzymage, débourbage, levurage, nutrition, suivis, fin de FA
const schemaBlanc = (so2, enz, lev, nut, o) => [
  SE('e1', 0, 'sulfitage', { famille: 'sulfitage', dose: so2, unite: 'so2', note: 'au pressurage, au fur et à mesure de l’écoulement des jus' }),
  SE('e2', 0, 'enzymage', { famille: 'enzyme', dose: enz, unite: 'g/hL', note: 'avant le débourbage' }),
  SE('e3', 1, 'debourbage', { note: (o && o.debourbage) || 'débourbage statique de 12 à 24 h, au frais' }),
  SE('e4', 1, 'levurage', { famille: 'levure', dose: lev, unite: 'g/hL', note: 'levures réhydratées selon la fiche technique' }),
  SE('e5', 4, 'nutrition', { famille: 'nutriment', dose: nut, unite: 'g/hL', note: 'au premier tiers de la fermentation' }),
  SE('e6', 3, 'suivi', { note: 'densité et température' }), SE('e7', 6, 'suivi', { note: 'densité et température' }),
  SE('e8', 9, 'suivi', { note: 'densité et température' }), SE('e9', 12, 'suivi', { note: 'densité et température' }),
  SE('e10', 15, 'fin_fa', { note: 'sucres épuisés (densité ≤ 0,994) : à confirmer par analyse' }),
  ...((o && o.fml) ? [SE('e11', 18, 'ensemencement_fml', { famille: 'bactérie', note: '1 dose pour le volume indiqué par le fournisseur' })] : []),
].sort((a, b) => a.jour - b.jour); // dans l'ordre des jours (comme un schéma enregistré)
const SCHEMAS_EXEMPLES = () => [
  { id: 'ex-cuvee-chard', nom: 'Cuvée de Chardonnay, raisins sains', criteres: { cepages: ['chard'], fractions: ['cuvee'], etats: ['sain'] }, etapes: schemaBlanc(5, 2, 20, 20) },
  { id: 'ex-cuvee-noirs', nom: 'Cuvée de Pinot noir ou de Meunier, raisins sains (avec FML)', criteres: { cepages: ['pn', 'pm'], fractions: ['cuvee'], etats: ['sain'] }, etapes: schemaBlanc(5, 2, 20, 20, { fml: true }) },
  { id: 'ex-tailles', nom: 'Tailles, raisins sains', criteres: { cepages: [], fractions: ['taille1', 'taille2', 'taille'], etats: ['sain'] }, etapes: schemaBlanc(7, 3, 20, 25) },
  { id: 'ex-altere', nom: 'Raisins altérés (toutes fractions)', criteres: { cepages: [], fractions: [], etats: ['altere'] }, etapes: schemaBlanc(8, 3, 25, 30, { debourbage: 'débourbage soigné (bourbes à écarter rapidement), au frais' }) },
].map((s) => ({ ...s, note: 'Exemple non officiel : doses courantes à adapter avec votre œnologue et à vérifier sur la fiche technique des produits.', exemple: true, aVerifier: true }));
const schemasDe = (db) => (Array.isArray(db && db.schemas) ? db.schemas.filter((s) => s && s.id && Array.isArray(s.etapes)) : SCHEMAS_EXEMPLES());
function schemasMaterialiser(db) { if (!Array.isArray(db.schemas)) db.schemas = SCHEMAS_EXEMPLES(); return db.schemas; }
const SCHEMA_CHAMPS = ['nom', 'criteres', 'etapes', 'note', 'aVerifier', 'verifiePar', 'verifieLe']; // les autres (version suivante) sont gardés
const schemaUnite = (u) => (['g/hL', 'mL/hL', 'so2'].includes(u) ? u : '');
function schemaEtapeNette(e, i) {
  const opId = String((e && e.opId) || '').trim(); if (!opId) return null;
  return { ...(e || {}), id: String(e.id || `e${i + 1}`).slice(0, 20), jour: Math.max(0, Math.min(365, Math.round(num(e.jour) || 0))), opId, famille: CAT_FAM[e.famille] ? e.famille : '',
    dose: hasNum(e.dose) && num(e.dose) > 0 ? num(e.dose) : null, unite: schemaUnite(e.unite), note: String(e.note || '').trim().slice(0, 200) };
}
function schemaSave(db, s, id, uid) {
  s = s || {}; const nom = String(s.nom || '').trim().slice(0, 100); if (!nom) return fail('Nom du schéma requis.');
  const L = schemasMaterialiser(db); const old = id ? L.find((x) => x.id === id) : null; if (id && !old) return fail('Schéma introuvable.');
  if (L.some((x) => x.id !== id && norm(x.nom) === norm(nom))) return fail('Un schéma porte déjà ce nom.');
  const etapes = (s.etapes || []).map(schemaEtapeNette).filter(Boolean); if (!etapes.length) return fail('Ajoutez au moins une étape.');
  const vus = {}; etapes.forEach((e) => { while (vus[e.id]) e.id = `${e.id}b`; vus[e.id] = true; });
  const c = s.criteres || {}; const liste = (x) => uniq((Array.isArray(x) ? x : []).map(String).filter(Boolean)).slice(0, 30);
  const x = { nom, criteres: { cepages: liste(c.cepages), fractions: liste(c.fractions), etats: liste(c.etats).filter((e) => SCHEMA_ETATS.some((y) => y.id === e)) }, etapes: etapes.sort((a, b) => a.jour - b.jour), note: String(s.note || '').trim().slice(0, 300) };
  const verifie = s.aVerifier === false ? { aVerifier: false, verifiePar: uid || '', verifieLe: todayISO() } : { aVerifier: true };
  if (old) { SCHEMA_CHAMPS.forEach((k) => { delete old[k]; }); Object.assign(old, x, verifie); return okr({ id: old.id }); }
  const nouv = { id: nid(db, 'sch'), ...x, ...verifie, cree: todayISO() }; L.push(nouv); return okr({ id: nouv.id });
}
function schemaValider(db, id, uid) { const s = schemasMaterialiser(db).find((x) => x.id === id); if (!s) return fail('Schéma introuvable.'); s.aVerifier = false; s.verifiePar = uid || ''; s.verifieLe = todayISO(); return okr(); }
function schemaSupprimer(db, id) { const L = schemasMaterialiser(db); const i = L.findIndex((x) => x.id === id); if (i < 0) return fail('Schéma introuvable.'); L.splice(i, 1); return okr(); }
function schemaDupliquer(db, id, uid) { const s = schemasDe(db).find((x) => x.id === id); if (!s) return fail('Schéma introuvable.'); let nom = `${s.nom} (copie)`; let k = 2; while (schemasDe(db).some((x) => norm(x.nom) === norm(nom))) { nom = `${s.nom} (copie ${k})`; k += 1; } return schemaSave(db, { ...clone(s), nom, aVerifier: true }, null, uid); }

/* ---------- critères d'un lot : cépage majoritaire, fraction, état sanitaire des raisins pressés ---------- */
const majoritaire = (m) => { const k = Object.keys(m || {}).filter((x) => x !== '?' && m[x] > 0).sort((a, b) => m[b] - m[a])[0]; return k && m[k] >= 0.5 ? k : ''; };
function lotEtatSanitaire(db, R, lotId) {
  // pressurages qui ont créé ce lot (fraction ou pressée) : état des pesées de vendange pressées, au prorata des kg
  const ops = (db.ops || []).filter((o) => o.type === 'pressurage' && (o.parentLotId === lotId || (o.fractions || []).some((f) => f.lotId === lotId)));
  let kg = 0; let alt = 0; let connu = 0;
  ops.forEach((o) => (o.charges || []).forEach((c) => { const a = (db.ops || []).find((x) => x.id === c.apportId); const k = num(c.kg); kg += k; const e = a && a.pesee && a.pesee.etat; if (e) { connu += k; if (e !== 'sain') alt += k; } }));
  if (!kg || !connu) return '';
  return alt / kg >= 0.1 ? 'altere' : 'sain';
}
function lotCriteres(db, R, lotId) {
  const c = composition(db, R, lotId); const fr = majoritaire(c.fractions);
  return { cepage: majoritaire(c.cepages), fraction: fr, etat: lotEtatSanitaire(db, R, lotId), cepages: c.cepages || {}, fractions: c.fractions || {} };
}
// correspondance : chaque critère renseigné du schéma doit être satisfait ; un critère inconnu du lot (état sanitaire d'un moût acheté…)
// n'exclut pas, mais au moins un critère connu doit correspondre (sinon seul un schéma sans critère, « tous les lots », convient) ;
// le plus précis d'abord
function schemaScore(s, k) {
  const c = s.criteres || {}; let n = 0; let poses = 0;
  const test = (liste, v, poids) => { if (!(liste || []).length) return true; poses += 1; if (!v) return true; if (!liste.includes(v)) return false; n += poids; return true; };
  const ok = test(c.cepages, k.cepage, 1) && test(c.fractions, k.fraction, 2) && test(c.etats, k.etat, 3);
  return ok && (n > 0 || !poses) ? n : -1;
}
function schemasPourLot(db, R, lotId) {
  const k = lotCriteres(db, R, lotId);
  const L = schemasDe(db).map((s, i) => ({ s, i, score: schemaScore(s, k) }));
  const ok = L.filter((x) => x.score >= 0).sort((a, b) => b.score - a.score || a.i - b.i).map((x) => x.s);
  return { criteres: k, proposes: ok, meilleur: ok[0] || null };
}

/* ---------- application : opérations à réaliser (dates, produits, quantités) ---------- */
// quantité d'un produit pour une dose de l'étape : g/hL ou mL/hL de produit (dans son unité), ou g/hL de SO₂ (selon sa teneur)
function schemaQuantite(p, e, volL) {
  if (!p || !e || !hasNum(e.dose) || !(num(volL) > 0)) return null;
  if (e.unite === 'so2') { const t = so2Teneur(p); return t ? Math.round((num(e.dose) * num(volL) / 100 / t) * 1000) / 1000 : null; }
  if (e.unite && doseUnit(p.unite) !== e.unite) return null; // unité de dose incompatible (g/hL pour un produit liquide…)
  const q = qteDeDose(e.dose, p.unite, volL); return q == null ? null : Math.round(q * 1000) / 1000;
}
// produits proposés pour une étape : de sa famille (ou dont le nom la fait deviner), en stock d'abord, puis les autres actifs
function schemaProduits(db, R, e) {
  if (!e || !e.famille) return [];
  const reste = (p) => (db.arrivages || []).filter((a) => a.produitId === p.id).reduce((t, a) => t + Math.max(0, arrivalRest(R, a)), 0);
  return (db.produits || []).filter((p) => p.actif !== false && p.categorie !== 'sec' && (p.famille === e.famille || (!p.famille && catFamilleDevine(p.nom) === e.famille)))
    .map((p) => ({ p, stock: reste(p) })).sort((a, b) => (b.stock > 0) - (a.stock > 0) || a.p.nom.localeCompare(b.p.nom, 'fr')).map((x) => x.p);
}
// plan d'un schéma pour un lot (date de création, volume) : une ligne par étape, produit proposé, quantité calculée
function schemaPlan(db, R, s, lot, choix) {
  const d0 = lot.date || todayISO(); const ch = choix || {};
  return (s.etapes || []).map((e) => {
    const def = opDef(db, e.opId); const prods = schemaProduits(db, R, e); const pid = ch[e.id] && ch[e.id].produitId !== undefined ? ch[e.id].produitId : (prods[0] ? prods[0].id : '');
    const p = pid ? (db.produits || []).find((x) => x.id === pid) : null; const qty = p ? schemaQuantite(p, e, lot.vol) : null;
    return { e, def, base: def ? def.base : '', label: def ? def.label : e.opId, date: addDays(d0, e.jour), produits: prods, produitId: pid, produit: p, qty, inconnue: !def,
      sansTeneur: !!(p && e.unite === 'so2' && so2Teneur(p) == null), incompatible: !!(p && e.unite && e.unite !== 'so2' && doseUnit(p.unite) !== e.unite) };
  }).map((x, i) => ({ x, i })).sort((a, b) => a.x.e.jour - b.x.e.jour || a.i - b.i).map((y) => y.x); // dans l'ordre des jours
}
const schemaDoseTexte = (e) => (hasNum(e.dose) ? `${fmt(e.dose, Number.isInteger(num(e.dose)) ? 0 : 2)} ${e.unite === 'so2' ? 'g/hL de SO₂' : e.unite || ''}`.trim() : '');

/* ---------- schéma appliqué à un lot : opérations à réaliser marquées p.schema { id, nom, lotId, etapeId, rang, nb, le } ---------- */
const schemasReglage = (db) => { const s = (db && db.settings && db.settings.schemas) || {}; return { proposer: s.proposer !== false }; };
const schemaPrevsDuLot = (db, lotId) => (db.previsions || []).filter((p) => p && p.schema && p.schema.lotId === lotId).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.schema.rang || 0) - (b.schema.rang || 0)));
const schemaOpsDuLot = (db, lotId) => (db.ops || []).filter((o) => o && o.schema && o.schema.lotId === lotId);
// lots sans schéma (ni opération à réaliser ni opération réalisée venue d'un schéma) : à qui proposer un schéma
const lotsSansSchema = (db, lotIds) => (lotIds || []).filter((id) => !schemaPrevsDuLot(db, id).length && !schemaOpsDuLot(db, id).length);
// items : [{ type, date, f, resume, notes, etapeId }] (préparés par l'interface) ; tout ou rien
function schemaAppliquer(db, lotId, s, items) {
  if (!lotId || !s || !s.id) return fail('Schéma introuvable.'); if (!(items || []).length) return fail('Aucune étape retenue.');
  // tout ou rien : chaque étape contrôlée avant d'en enregistrer une seule
  for (let i = 0; i < items.length; i += 1) { const it = items[i] || {}; if (!isoOK(it.date)) return fail(`Étape ${i + 1} : Date prévue invalide.`); if (!OP_LABELS[it.type]) return fail(`Étape ${i + 1} : Type d’opération inconnu.`); }
  const ids = []; const le = todayISO();
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i]; const r = previsionSave(db, it, null); if (!r.ok) return fail(`Étape ${i + 1} : ${r.msg}`);
    const p = db.previsions.find((x) => x.id === r.id); p.schema = { id: s.id, nom: s.nom, lotId, etapeId: it.etapeId || '', rang: i + 1, nb: items.length, le }; ids.push(r.id);
  }
  return okr({ ids });
}
// retirer les étapes encore à réaliser (les opérations déjà réalisées restent)
function schemaRetirer(db, lotId) {
  const L = schemaPrevsDuLot(db, lotId).filter((p) => p.statut === 'prevue'); if (!L.length) return fail('Aucune étape à réaliser pour ce lot.');
  L.forEach((p) => previsionDelete(db, p.id)); return okr({ n: L.length });
}
