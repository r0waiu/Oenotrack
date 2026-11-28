/* ============ MISE EN BOUTEILLE DES VINS TRANQUILLES ET DOUX (0.50.0-alpha.2) ============
   Module « mise » (onglet « Mise en bouteille » : Mettre · Fournitures · Habillage & cartons), affiché avec les vins tranquilles ou doux
   (réglage Vignoble, 16oe : clé module:mise) ; Tirages, Cave et Dégorgement restent ceux des effervescents.
   - une mise = opération type « tirage », sousType « mise_bouteille », marquée op.mise = { ddm, bouchage { type, crd, capsule }, filtration,
     gaz, controles [{ heure, type (MISE_CONTROLES), mesure, cible, operateur, action }], avant { … rappel des analyses } } : le vin est pris
     dans les cuves (sources), le lot de mise (type « mise_bouteille », n° de lot réglementaire) devient aussitôt un LOT FINI (db.lotsFinis,
     mise: true) — habillage et mise en carton (63b) le reprennent comme un lot dégorgé ; formats, casse, fournitures (16x), intrants à la
     mise (op.lignes) comme un tirage ; rejoué : pas de bouteilles sur lattes (R.tir) mais R.mises[lot] ; une version antérieure, qui ne
     connaît pas la mise, y voit un tirage (le vin sort des cuves, les bouteilles restent comptées) et garde le lot fini ;
   - chantiers de mise : db.chantiersMise = [{ id, numero (MB-AAAA-NN), nom, dateDebut, dateFin, realisation: interne | prestataire,
     prestataireId (fournisseur au rôle « prestataire_mise »), ligne { … MISE_LIGNE }, notes, par, le, maj }] — documents cible { type: 'chantierMise' } ;
   - DRM : la mise fait passer le vin du vrac au conditionné dans le même produit (bouteilles finies, 16n) ; nature « tranquille ».
   Exemples et listes « à vérifier » ; aucune valeur réglementaire imposée. */
const MISE_SOUS_TYPE = 'mise_bouteille';
const estMise = (op) => !!op && op.type === 'tirage' && (op.sousType === MISE_SOUS_TYPE || !!(op.mise && typeof op.mise === 'object'));
const MISE_BOUCHAGES = [
  { id: 'liege_naturel', label: 'Bouchon liège naturel' }, { id: 'liege_colmate', label: 'Bouchon liège colmaté' }, { id: 'liege_technique', label: 'Bouchon technique (aggloméré, micro-aggloméré)' },
  { id: 'synthetique', label: 'Bouchon synthétique' }, { id: 'vis', label: 'Capsule à vis' }, { id: 'verre', label: 'Bouchon en verre' }, { id: 'couronne', label: 'Capsule couronne' }, { id: 'autre', label: 'Autre obturateur' },
];
const MISE_CAPSULES = [{ id: '', label: 'Sans capsule de surbouchage' }, { id: 'crd', label: 'Capsule CRD (représentative de droits)' }, { id: 'non_crd', label: 'Capsule de surbouchage sans CRD' }, { id: 'cire', label: 'Cire' }];
const MISE_FILTRATIONS = [{ id: '', label: 'Aucune à la mise' }, { id: 'sterilisante', label: 'Filtration stérilisante (membrane)' }, { id: 'tangentielle', label: 'Filtration tangentielle' }, { id: 'plaques', label: 'Filtration sur plaques' }, { id: 'cartouches', label: 'Filtration sur cartouches' }];
const MISE_GAZ = [{ id: 'azote', label: 'Azote' }, { id: 'co2', label: 'Dioxyde de carbone (CO₂)' }, { id: 'argon', label: 'Argon' }, { id: 'vide', label: 'Mise sous vide (tireuse)' }];
const MISE_CONTROLES = [
  { id: 'niveau', label: 'Niveau de remplissage', unite: 'mm' }, { id: 'volume', label: 'Volume (pesée de cols)', unite: 'mL' }, { id: 'so2l', label: 'SO₂ libre', unite: 'mg/L' },
  { id: 'o2', label: 'Oxygène dissous', unite: 'mg/L' }, { id: 'tpo', label: 'Oxygène total à l’emballage (TPO)', unite: 'mg/L' }, { id: 'co2', label: 'CO₂ dissous', unite: 'g/L' },
  { id: 'vide', label: 'Vide / espace de tête', unite: 'mm' }, { id: 'bouchage', label: 'Contrôle du bouchage (étanchéité, enfoncement)', unite: '' }, { id: 'autre', label: 'Autre contrôle', unite: '' },
];
// paramètres d'analyse rappelés avant la mise (identifiants du catalogue des analyses, s'ils existent)
const MISE_ANALYSES_AVANT = ['so2l', 'so2t', 'tav', 'av', 'at', 'ph', 'sucres', 'co2', 'turbidite'];
const MISE_LIGNE = [['rinceuse', 'Rinceuse / souffleuse'], ['tireuse', 'Tireuse (soutireuse)'], ['boucheuse', 'Boucheuse / visseuse'], ['capsuleuse', 'Capsuleuse (surbouchage)'], ['etiqueteuse', 'Étiqueteuse'],
  ['filtre', 'Filtre en ligne'], ['inerteur', 'Inertage (gaz)'], ['mireuse', 'Mireuse / contrôle optique'], ['marquage', 'Marquage du lot (jet d’encre, laser)'], ['encaisseuse', 'Encaisseuse / palettiseur']];
const MISE_REALISATIONS = [{ id: 'interne', label: 'Interne (matériel de la maison)' }, { id: 'prestataire', label: 'Prestataire (camion d’embouteillage, embouteilleur à façon)' }];
const prestatairesMise = (db) => (db.fournisseurs || []).filter((f) => fournisseurRoles(f).includes('prestataire_mise'));

/* ---------- chantiers de mise ---------- */
const chantiersMise = (db) => (Array.isArray(db && db.chantiersMise) ? db.chantiersMise.filter((c) => c && c.id) : []);
const chantierMise = (db, id) => chantiersMise(db).find((c) => c.id === id) || null;
const chantierMises = (db, id) => (db.ops || []).filter((o) => estMise(o) && o.chantierId === id).sort(byDate);
const chantierMiseNumeroSuivant = (db, date) => { const a = yearOf(isoOK(date) ? date : todayISO()); return `MB-${a}-${pad(chantiersMise(db).filter((c) => yearOf(c.dateDebut) === a).length + 1)}`; };
function chantierMiseSave(db, c, id, par) {
  const old = id ? chantierMise(db, id) : null; if (id && !old) return fail('Chantier introuvable.');
  if (!isoValide(c.dateDebut)) return fail('Indiquez la date de début du chantier.', { champ: 'dateDebut' }); if (c.dateFin && !isoValide(c.dateFin)) return fail('Date de fin invalide.', { champ: 'dateFin' });
  if (c.dateFin && c.dateFin < c.dateDebut) return fail('La date de fin précède la date de début.', { champ: 'dateFin' });
  const cp = campOf(db, c.dateDebut); if (!cp) return fail('Aucune campagne ne couvre cette date. Créez-la dans Paramètres › Campagnes.'); if (cp.figee) return fail(`La campagne ${cp.nom} est figée.`);
  const real = c.realisation === 'prestataire' ? 'prestataire' : 'interne';
  if (real === 'prestataire' && !(db.fournisseurs || []).some((f) => f.id === c.prestataireId)) return fail('Choisissez le prestataire de mise (Intrants › Fournisseurs, rôle « Prestataire de mise en bouteille »).', { champ: 'prestataireId' });
  const numero = String(c.numero || '').trim() || chantierMiseNumeroSuivant(db, c.dateDebut);
  if (chantiersMise(db).some((x) => x.id !== id && norm(x.numero) === norm(numero))) return fail(`Le chantier n° ${numero} existe déjà.`, { champ: 'numero' });
  const ligne = {}; const L0 = c.ligne || {}; MISE_LIGNE.forEach(([k]) => { if (L0[k]) ligne[k] = true; }); if (hasNum(L0.nbBecs)) ligne.nbBecs = num(L0.nbBecs); if (hasNum(L0.cadenceColsH)) ligne.cadenceColsH = num(L0.cadenceColsH); if (L0.autres) ligne.autres = String(L0.autres).trim().slice(0, 200);
  const it = { ...(old || {}), numero, nom: String(c.nom || '').trim().slice(0, 80), dateDebut: c.dateDebut, dateFin: c.dateFin || '', realisation: real, prestataireId: real === 'prestataire' ? c.prestataireId : '', ligne, notes: String(c.notes || '').trim().slice(0, 1000), maj: new Date().toISOString() };
  if (!Array.isArray(db.chantiersMise)) db.chantiersMise = [];
  if (old) { Object.assign(old, it); return okr({ id }); }
  const nidc = nid(db, 'chm'); db.chantiersMise.push({ id: nidc, ...it, par: par || '', le: new Date().toISOString() }); return okr({ id: nidc });
}
function chantierMiseDelete(db, id) {
  if (!chantierMise(db, id)) return fail('Chantier introuvable.');
  const n = chantierMises(db, id).length; if (n) return fail(`Suppression impossible : ${n} mise(s) rattachée(s) à ce chantier.`);
  db.chantiersMise = chantiersMise(db).filter((c) => c.id !== id); return okr();
}
// bilan d'un chantier (ou d'une liste de mises) : cols par format, équivalent bouteilles, volume mis, vin pris en cuve, pertes, casse
function miseBilan(db, R, ops) {
  const F = {}; let casse = 0; let vin = 0; const lots = [];
  (ops || []).forEach((o) => { tirageFormatsDe(o).forEach((f) => { F[f.format] = (F[f.format] || 0) + num(f.nb); }); casse += num(o.casse); const v = sum(o.sources || [], (s) => num(s.volL)); vin += v; lots.push({ opId: o.id, lotId: o.lotId, code: ((R && R.lots[o.lotId]) || lotById(db, o.lotId) || {}).code || '', cols: num(o.nbBouteilles), volL: tirageVolFormats(tirageFormatsDe(o)), vinL: v }); });
  const formats = Object.keys(F).map((k) => ({ format: k, nb: F[k], L: (tirageFormat(k) || {}).L || 0.75 })); const volL = tirageVolFormats(formats);
  return { formats, cols: sum(formats, (f) => f.nb), eqBouteilles: tirageEqBouteilles(formats), volL, vinL: vin, perteL: Math.max(0, vin - volL), casse, lots };
}
const chantierMiseBilan = (db, R, id) => miseBilan(db, R, chantierMises(db, id));

/* ---------- avant la mise : rappel des dernières analyses des lots pris en cuve ---------- */
function miseAnalysesAvant(db, lotIds, date) {
  const P = db.analysesParams || []; const ids = MISE_ANALYSES_AVANT.filter((k) => P.some((p) => p.id === k));
  return uniq(lotIds || []).map((lotId) => {
    const A = (db.analyses || []).filter((a) => a && a.lotId === lotId && (!date || a.date <= date)).sort(byDate);
    const val = {}; ids.forEach((k) => { for (let i = A.length - 1; i >= 0; i -= 1) { const v = (A[i].valeurs || {})[k]; if (hasNum(v)) { val[k] = { v: num(v), date: A[i].date }; break; } } });
    const der = A.length ? A[A.length - 1].date : ''; const age = der && date ? Math.round((new Date(date) - new Date(der)) / 864e5) : null;
    return { lotId, valeurs: val, derniere: der, ageJ: age };
  });
}

/* ---------- enregistrement d'une mise ---------- */
// s : { date, heure, sources [{ portionId, volL }], formats [{ format, nb }], casse, chantierId, code, designation, ddm, bouchage { type, capsule },
//       filtration, gaz [ids], controles [...], fournitures [...], lignes (intrants à la mise), operateurs, notes, codif? }
function miseSpec(db, R, s) {
  const S = (s.sources || []).filter((x) => x && x.portionId && num(x.volL) > 0);
  if (!isoOK(s.date)) return { error: 'Date invalide.', champ: 'date' };
  if (!S.length) return { error: 'Choisissez au moins une cuve et le volume de vin mis en bouteille.', champ: 'sources' };
  for (const x of S) { const p = (R.portions || {})[x.portionId]; if (!p) return { error: 'Cuve introuvable à cette date.', champ: 'sources' }; if (num(x.volL) > p.vol + 0.5) return { error: `Volume demandé (${fmt(num(x.volL))} L) supérieur au contenu de la cuve (${fmt(p.vol)} L).`, champ: 'sources' }; }
  const formats = (s.formats || []).filter((f) => num(f.nb) > 0).map((f) => ({ format: f.format || 'bouteille', nb: Math.round(num(f.nb)), L: num(f.L) || (tirageFormat(f.format) || {}).L || 0.75 }));
  if (!formats.length) return { error: 'Indiquez le nombre de cols mis par format.', champ: 'formats' };
  const code = String(s.code || '').trim(); if (!code) return { error: 'Indiquez le n° de lot de la mise.', champ: 'code' };
  if (s.chantierId && !chantierMise(db, s.chantierId)) return { error: 'Chantier de mise introuvable.', champ: 'chantierId' };
  if (s.ddm && !isoValide(s.ddm)) return { error: 'DDM invalide.', champ: 'ddm' };
  const b = s.bouchage || {}; if (b.type && !MISE_BOUCHAGES.some((x) => x.id === b.type)) return { error: 'Type de bouchage inconnu.', champ: 'bouchage' };
  const sources = S.map((x) => ({ portionId: x.portionId, lotId: R.portions[x.portionId].lotId, volL: num(x.volL) }));
  const fs = tirageFournituresSpec(db, s.fournitures || [], { formats, casse: num(s.casse) });
  const controles = (s.controles || []).filter((c) => c && c.type && MISE_CONTROLES.some((x) => x.id === c.type)).map((c) => ({ heure: String(c.heure || '').slice(0, 5), type: c.type, ...(hasNum(c.mesure) ? { mesure: num(c.mesure) } : {}), ...(hasNum(c.cible) ? { cible: num(c.cible) } : {}), ...(c.operateur ? { operateur: c.operateur } : {}), ...(c.action ? { action: String(c.action).slice(0, 200) } : {}) }));
  const mise = { ...(s.ddm ? { ddm: s.ddm } : {}), bouchage: { type: b.type || '', capsule: MISE_CAPSULES.some((x) => x.id === b.capsule) ? b.capsule : '', ...(b.fabricant ? { fabricant: String(b.fabricant).slice(0, 80) } : {}) },
    filtration: MISE_FILTRATIONS.some((x) => x.id === s.filtration) ? s.filtration : '', gaz: (s.gaz || []).filter((g) => MISE_GAZ.some((x) => x.id === g)), controles,
    avant: miseAnalysesAvant(db, sources.map((x) => x.lotId), s.date).map((a) => ({ lotId: a.lotId, valeurs: a.valeurs, derniere: a.derniere })) };
  const lignes = [...(s.lignes || []).filter((l) => l && l.produitId && num(l.qty) > 0 && !l.fourniture), ...fs.lignes];
  return { spec: { type: 'tirage', sousType: MISE_SOUS_TYPE, date: s.date, ...(s.heure ? { heure: s.heure } : {}), sources, formats, ...tirageFormatsCompat(formats), ...(num(s.casse) > 0 ? { casse: Math.round(num(s.casse)) } : {}),
    ...(s.chantierId ? { chantierId: s.chantierId } : {}), lotSpec: { code, designation: String(s.designation || '').trim() || code, ...(s.codif ? { codif: s.codif } : {}) }, mise, fournitures: fs.fournitures, lignes,
    operateurs: Array.isArray(s.operateurs) ? s.operateurs : [], notes: String(s.notes || '').slice(0, 1000) } };
}
function miseSave(db, s, editId, opts) {
  const old = editId ? (db.ops || []).find((o) => o.id === editId) : null; if (editId && !estMise(old)) return fail('Mise en bouteille introuvable.');
  const R0 = replay(old ? { ...db, ops: db.ops.filter((o) => o.id !== editId) } : db, isoOK(s.date) ? s.date : undefined); // en modification : le vin de cette mise revient en cuve
  const x = miseSpec(db, R0, s); if (x.error) return fail(x.error, { champ: x.champ });
  return opSave(db, x.spec, editId, opts);
}
// mises d'une période (journal du module)
const misesListe = (db) => (db.ops || []).filter(estMise).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
const miseLotFini = (db, op) => (db.lotsFinis || []).find((f) => f && f.opId === op.id) || null;
