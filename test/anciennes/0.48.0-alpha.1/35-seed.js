/* ============ JEU DE DONNÉES D'EXEMPLE (généré avec les mêmes fonctions que l'interface) ============ */
// le jeu d'exemple a toujours les mêmes identifiants (sans marque d'appareil) : chargé sur deux appareils, il se synchronise sans doublon
function sampleDb() { const s = NID_SUFFIXE; NID_SUFFIXE = ''; try { return sampleDb0(); } finally { NID_SUFFIXE = s; } }
function sampleDb0() {
  const db = emptyDb('2026-2027');
  db.campagnes = [
    { id: '2025-2026', nom: '2025-2026', debut: '2025-08-01', fin: '2026-07-31', figee: false, snapshot: null, ouverture: null },
    { id: '2026-2027', nom: '2026-2027', debut: '2026-08-01', fin: '2027-07-31', figee: false, snapshot: null, ouverture: null },
  ];
  db.settings.campagneActive = '2026-2027'; db.meta.exemple = true;
  const K = { ct: {}, pr: {}, ar: {}, lot: {}, fo: {}, prep: {}, op: {}, apt: {} };
  const must = (r) => { if (!r.ok) throw new Error('Jeu d’exemple : ' + r.msg); return r; };
  // qui fait quoi (opérateurs du domaine) : la cave aux cavistes, les intrants et les étapes au chef de cave, l'assemblage avec l'œnologue
  const OPR = {};
  const quiFait = (sp) => {
    const t = sp.type; const st = sp.sousType || ''; const saison = sp.date < '2026-08-01' ? OPR.mr : OPR.lf;
    if (['apport', 'entree_mout', 'jaugeage'].includes(t)) return [OPR.tg];
    if (t === 'pressurage') return [OPR.tg, saison];
    if (t === 'suivi') return st === 'batonnage' ? [OPR.sl] : [saison];
    if (['debourbage', 'soutirage', 'transfert', 'froid', 'sortie'].includes(t)) return [OPR.sl];
    if (t === 'filtration') return [OPR.sl, OPR.tg];
    if (t === 'assemblage') return st === 'regroupement' ? [OPR.sl] : [OPR.jm, OPR.cv];
    if (['preparation', 'tirage', 'degorgement'].includes(t)) return [OPR.jm, OPR.sl];
    return [OPR.jm];
  };
  const S = (spec) => must(opSave(db, { ...spec, operateurs: spec.operateurs || quiFait(spec).filter(Boolean) })).op;
  const cr = (nom) => { const c = db.crus.find((x) => x.nom === nom); if (!c) throw new Error('Jeu d’exemple : cru introuvable ' + nom); return c.id; };

  // sites : le stock est commun, seul l'emplacement des contenants change
  db.sites[0].nom = 'Cuverie d’Épernay'; db.sites[0].adresse = 'Avenue de Champagne, Épernay';
  must(siteSave(db, { nom: 'Chai de Vertus', adresse: 'Côte des Blancs · vinification Bio / Demeter' })); const SITE2 = db.sites[1].id;
  // apporteurs (viticulteurs / négoce)
  // partenaires : apporteurs (raisins, moûts) et vendeurs de vins ; crus par défaut proposés à la saisie (« cru auto » : le premier est appliqué d'office)
  const crs = (...noms) => noms.map((n) => db.crus.find((x) => x.nom === n)).filter(Boolean).map((c) => c.id);
  [['Lefèvre Père & Fils', 'Cramant', { crusDefaut: crs('Cramant'), cruAuto: true }], ['GAEC des Crayères', 'Verzenay', { crusDefaut: crs('Verzenay', 'Verzy'), cruAuto: false }], ['EARL Marchand', 'Vincelles', {}],
    ['Domaine Hennequin', 'Vertus', { crusDefaut: crs('Vertus'), cruAuto: true }], ['Maison Dubois', 'Avize', { vendeur: true, crusDefaut: crs('Avize', 'Cramant', 'Mareuil-sur-Ay'), notes: 'Négociant : moûts et vins clairs' }]]
    .forEach(([nom, commune, x]) => { must(apporteurSave(db, { nom, commune, ...x })); K.apt[nom] = db.apporteurs.find((a) => a.nom === nom).id; });
  // opérateurs : l'équipe du domaine, l'œnologue conseil et un saisonnier des vendanges 2025 (archivé en fin de jeu)
  [['jm', 'Julien', 'Morel', 'Chef de cave', ''], ['sl', 'Sophie', 'Lambert', 'Caviste', ''], ['tg', 'Thomas', 'Girard', 'Ouvrier de chai', ''], ['lf', 'Léa', 'Fontaine', 'Saisonnier', 'Vendanges et fermentations 2026'],
    ['cv', 'Claire', 'Vasseur', 'Œnologue', 'Œnologue conseil (laboratoire extérieur) : assemblages et dégustations'], ['mr', 'Marc', 'Rivière', 'Saisonnier', 'Vendanges 2025']]
    .forEach(([k, prenom, nom, fonction, notes]) => { OPR[k] = must(operateurSave(db, { prenom, nom, fonction, notes })).id; });
  // couleurs d'assemblages de cépages (exemples personnalisés)
  db.apparence.melanges = [{ id: 'mel1', nom: 'Blanc de noirs', cepages: ['pm', 'pn'], couleur: '#A24B5C' }, { id: 'mel2', nom: 'Trois cépages', cepages: ['chard', 'pm', 'pn'], couleur: '#D1A86A' }];

  // fournisseurs
  ['Sofralab', 'O2C', 'IOC', 'Compas', 'CSGV'].forEach((n) => { must(fournisseurSave(db, { nom: n })); K.fo[n] = db.fournisseurs[db.fournisseurs.length - 1].id; });
  // contenants : [clé, nom, type, matière, année de fabrication, volume max, statut, site (s1 = Épernay, s2 = Vertus)]
  const CT = [
    ['bacd1', 'Bac D1', 'cuve', 'inox', 2018, 5000], ['bacd2', 'Bac D2', 'cuve', 'inox', 2018, 5000], ['bact', 'Bac T', 'cuve', 'inox', 2018, 2500],
    ['c01', 'Cuve 01', 'cuve', 'inox', 2016, 6000], ['c02', 'Cuve 02', 'cuve', 'inox', 2016, 6000], ['c03', 'Cuve 03', 'cuve', 'inox', 2019, 4000], ['c05', 'Cuve 05', 'cuve', 'inox', 2021, 2500],
    ['c06', 'Cuve 06', 'cuve', 'inox', 2021, 2500], ['c07', 'Cuve 07', 'cuve', 'inox', 2020, 3000], ['c08', 'Cuve 08', 'cuve', 'inox', 2020, 4000], ['c09', 'Cuve 09', 'cuve', 'inox', 2022, 4000],
    ['c10', 'Cuve 10', 'cuve', 'inox', 2022, 4000], ['cb1', 'Cuve B1', 'cuve', 'inox', 2022, 3000, 'actif', 's2'], ['cd1', 'Cuve D1', 'cuve', 'inox', 2022, 3000, 'actif', 's2'], ['cit1', 'Citerne 01', 'citerne', 'inox', 2010, 10000, 'actif', 's2'],
    ['foud1', 'Foudre 01', 'foudre', 'chene', 1998, 2500, 'actif', 's2'], ['fut1', 'Fût 01', 'fut', 'chene', 2020, 228, 'actif', 's2'], ['fut2', 'Fût 02', 'fut', 'chene', 2021, 228, 'actif', 's2'], ['c04', 'Cuve 04 (ancienne)', 'cuve', 'beton', 1985, 2000, 'archive'],
    ['oeuf1', 'Œuf 01', 'oeuf', 'beton', 2022, 1000, 'actif', 's2'], ['jarre1', 'Jarre 01', 'jarre', 'gres', 2023, 400, 'actif', 's2'], ['amph1', 'Amphore 01', 'amphore', 'terrecuite', 2024, 300, 'actif', 's2'], ['bomb1', 'Bombonne 01', 'bombonne', 'verre', 2015, 54, 'actif', 's2'],
  ];
  CT.forEach(([k, nom, type, matiere, annee, volMax, statut, site]) => { must(contSave(db, { nom, type, matiere, annee, volMax, statut: statut || 'actif', siteId: site === 's2' ? SITE2 : db.sites[0].id })); K.ct[k] = db.contenants[db.contenants.length - 1].id; });

  // produits (règles d'exemple, non officielles) : [clé, nom, catégorie, unité, fournisseur, [conv, bio, dem] = [autorisé, dose max]]
  const PR = [
    ['so2', 'Métabisulfite de potassium', 'oeno', 'g', 'Sofralab', [[1, 15], [1, 10], [1, 6]]], ['enz', 'Enzyme pectolytique', 'oeno', 'g', 'IOC', [[1, 4], [1, 4], [0]]],
    ['levp', 'Levure fermentation primaire', 'oeno', 'g', 'O2C', [[1, 30], [1, 30], [1, 30]]], ['levm', 'Levure prise de mousse', 'oeno', 'g', 'IOC', [[1, 30], [1, 30], [1, 30]]],
    ['act', 'Activateur de fermentation', 'oeno', 'g', 'O2C', [[1, 40], [0], [0]]], ['tan', 'Tanins œnologiques', 'oeno', 'g', 'Compas', [[1, 20], [1, 15], [0]]],
    ['lys', 'Lysozyme', 'oeno', 'g', 'Compas', [[1, 50], [0], [0]]], ['gel', 'Gélatine liquide', 'aux', 'mL', 'Sofralab', [[1, 10], [1, 10], [1, 5]]],
    ['ben', 'Bentonite sodique', 'aux', 'g', 'CSGV', [[1, 100], [1, 100], [1, 100]]], ['dia', 'Terre de diatomées', 'aux', 'kg', 'CSGV', [[1, 300], [1, 300], [1, 300]]],
    ['plq', 'Plaques de filtration', 'aux', 'u', 'Compas', [[1], [1], [1]]], ['bac', 'Bactéries lactiques (FML)', 'oeno', 'g', 'IOC', [[1, 2], [1, 2], [1, 2]]], ['suc', 'Sucre de canne', 'oeno', 'kg', 'CSGV', [[1], [1], [1]]],
    ['mcr', 'MCR (moût concentré rectifié)', 'oeno', 'L', 'Sofralab', [[1], [1], [1]]], ['bou', 'Bouteille champenoise 75 cl', 'sec', 'u', 'CSGV', [[1], [1], [1]]],
    ['cap', 'Capsule de tirage', 'sec', 'u', 'CSGV', [[1], [1], [1]]], ['bch', 'Bouchon liège champenois', 'sec', 'u', 'CSGV', [[1], [1], [1]]], ['mus', 'Muselet', 'sec', 'u', 'CSGV', [[1], [1], [1]]],
  ];
  PR.forEach(([k, nom, categorie, unite, fo, rules]) => {
    must(produitSave(db, { nom, categorie, unite, fournisseurId: K.fo[fo] })); const id = db.produits[db.produits.length - 1].id; K.pr[k] = id;
    ['conv', 'bio', 'dem'].forEach((q, i) => regleSet(db, id, q, { autorise: !!rules[i][0], doseMax: rules[i][1] != null ? rules[i][1] : null }));
  });
  // familles (catalogues) et teneur en SO₂ du métabisulfite (0,5 g de SO₂ par g) pour l'estimation du SO₂ total (0.30.0-alpha.1)
  const FAM = { so2: 'sulfitage', enz: 'enzyme', levp: 'levure', levm: 'levure', act: 'nutriment', tan: 'tanin', lys: 'stabilisant microbiologique', gel: 'colle', ben: 'bentonite', dia: 'filtration', plq: 'filtration', bac: 'bactérie', suc: 'sucre / MCR', mcr: 'sucre / MCR' };
  Object.keys(FAM).forEach((k) => { db.produits.find((x) => x.id === K.pr[k]).famille = FAM[k]; });
  db.produits.find((x) => x.id === K.pr.so2).so2 = '0,5 g/g';
  // arrivages : [clé, produit, n° lot fournisseur, DLUO, date, quantité]
  const AR = [
    ['so2a', 'so2', 'SK-2501', '2027-06-30', '2025-08-20', 25000], ['enza', 'enz', 'ENZ-25-114', '2026-11-30', '2025-08-28', 500], ['levpa', 'levp', 'LP-0925', '2027-03-31', '2025-09-01', 2000],
    ['levma', 'levm', 'PM-0126', '2027-09-30', '2026-01-15', 1000], ['acta', 'act', 'ACT-2406', '2026-09-30', '2025-09-01', 1000], ['actb', 'act', 'ACT-2603', '2028-03-31', '2026-03-01', 1000],
    ['tana', 'tan', 'TAN-5521', '2027-12-31', '2025-09-05', 800], ['gela', 'gel', 'GL-8841', '2027-05-31', '2025-09-05', 5000], ['bena', 'ben', 'BEN-3392', '2029-01-31', '2025-09-05', 5000],
    ['diaa', 'dia', 'DIA-2210', '', '2025-12-01', 25], ['plqa', 'plq', 'PLQ-77', '', '2025-12-01', 100], ['lysa', 'lys', 'LYS-0613', '2027-02-28', '2026-04-01', 1000],
    ['suca', 'suc', 'SUC-2603', '', '2026-03-10', 300], ['mcra', 'mcr', 'MCR-2604', '2027-04-30', '2026-09-20', 100], ['boua', 'bou', 'BOU-2604', '', '2026-03-15', 10000],
    ['capa', 'cap', 'CAP-2604', '', '2026-03-15', 10000], ['bcha', 'bch', 'BCH-2609', '', '2026-09-20', 5000], ['musa', 'mus', 'MUS-2609', '', '2026-09-20', 5000],
    ['so2b', 'so2', 'SK-2609', '2028-09-30', '2026-09-01', 25000], ['baca', 'bac', 'BL-2608', '2027-08-31', '2026-09-01', 100], ['levpb', 'levp', 'LP-0926', '2028-03-31', '2026-09-01', 2000], ['enzb', 'enz', 'ENZ-26-077', '2028-03-31', '2026-09-01', 500],
  ];
  AR.forEach(([k, p, numLot, dluo, date, qty]) => { must(arrivageSave(db, { produitId: K.pr[p], numLot, dluo, date, qty })); K.ar[k] = db.arrivages[db.arrivages.length - 1].id; });
  const ln = (p, a, qty) => ({ produitId: K.pr[p], arrivageId: K.ar[a], qty });
  const por = (lot, ct) => { const p = Object.values(replay(db).portions).find((x) => x.lotId === K.lot[lot] && x.contenantId === K.ct[ct]); if (!p) throw new Error(`Jeu d’exemple : portion introuvable ${lot}/${ct}`); return p; };
  const src = (lot, ct, v) => { const p = por(lot, ct); return { portionId: p.id, lotId: p.lotId, volL: v == null ? r2(p.vol) : v }; };

  // carnet de pressoir (0.24.0-alpha.1) : heure du début et de la fin, TAV en puissance, bourbes ; marcs validés
  const MARCS = { P1: ['09:05', '12:40', 10.4, 45], P2: ['13:10', '16:45', 10.1, 50], P3: ['09:20', '12:50', 9.8, 50], P4: ['09:00', '12:30', 10.6, 55], P5: ['09:15', '12:45', 10.9, 50],
    P6: ['08:40', '12:10', 10.3, 65], P7: ['08:30', '12:00', 10.2, 70], P8: ['09:00', '12:35', 10, 60], P9: ['09:10', '12:40', 9.9, 55], P10: ['08:50', '12:30', 9.7, 60] };
  const press = (date, key, code, desig, qualifId, charges, frac) => {
    const fr = Object.entries(frac).map(([fid, [volL, ct]]) => ({ fractionId: fid, volL, contenantId: K.ct[ct], code: `${code}-${fracDef(db, fid).suffix}` }));
    const [heureDebut, heureFin, tavp, bourbesL] = MARCS[key];
    const op = S({ type: 'pressurage', date, equipementId: 'pressoir', charges: charges.map(([a, kg]) => ({ apportId: K.op[a], kg })), parentSpec: { code, designation: desig, millesime: String(yearOf(date)), qualifId }, fractions: fr, marc: { heureDebut, heureFin, tavp, bourbesL } });
    must(marcValider(db, op.id, { maintenant: `${date}T${heureFin}:00` }));
    K.lot[key] = op.parentLotId; op.fractions.forEach((f) => { K.lot[`${key}${{ cuvee: 'C', taille1: 'T', taille2: 'T2', rebeche: 'R' }[f.fractionId]}`] = f.lotId; });
  };
  // pressoir (capacité agréée) et bascule (vignette de vérification) : Paramètres › Listes › Équipements, réglés dans l'onglet Pressoir
  { const pe = db.lists.equipements.find((e) => e.id === 'pressoir'); if (pe) pe.pressoir = { capaciteKg: 4000, agrement: 'qualitatif', h24: false };
    if (!db.lists.equipements.some((e) => e.id === 'bascule')) db.lists.equipements.unshift({ id: 'bascule', label: 'Bascule du pressoir', balance: { valideJusquau: '2027-06-30', ref: 'Vignette 2026' } }); }
  // parcellaire d'exemple (parcelles reliées à un cru)
  const PA = [['cram', 'Les Crayères', 'Cramant', 'Les Crayères', 'ZB 112', 42.5, 'chard', '1995', 'Lefèvre Père & Fils'], ['verz', 'Mont des Moulins', 'Verzenay', 'Les Moulins', 'AC 47', 38, 'pn', '2003', 'GAEC des Crayères'],
    ['vinc', 'La Côte Rôtie', 'Vincelles', 'Côte Rôtie', 'B 1287', 55.3, 'pm', '1988', 'EARL Marchand'], ['mesn', 'Les Chétillons – rang 12', 'Le Mesnil-sur-Oger', 'Les Chétillons', 'AE 219', 21.6, 'chard', '1979', 'Lefèvre Père & Fils']];
  PA.forEach(([k, nom, cru, lieuDit, cadastre, surface, cepageId, annee, apt]) => { const r = parcelleSave(db, { nom, cruId: cr(cru), lieuDit, cadastre, surface, cepageId, annee, apporteurId: K.apt[apt] }); must(r); K.parc = K.parc || {}; K.parc[k] = r.id; });
  const PARC_DE = { a1: 'cram', a2: 'verz', a3: 'vinc', a6: 'mesn', a7: 'verz' };
  // registre des pesées (0.24.0-alpha.1) : heure, poids brut, tare des caisses, état sanitaire, bascule ; pesées validées
  const PESEES = { a1: '07:52', a2: '08:35', a3: '08:10', a4: '07:58', a5: '08:22', a6: '07:48', a7: '08:12', a8: '08:30', a9: '07:55' };
  const apport = (key, date, cepageId, kg, qualifId, cru, apporteur) => {
    const caisses = Math.round(kg / 48); const tareKg = r2(caisses * 1.8);
    const pesee = { heure: PESEES[key], brutKg: r2(kg + tareKg), tareKg, caisses, etat: 'sain', balanceId: 'bascule', ...(key === 'a6' ? { mention: 'Lieu-dit « Les Chétillons »', heureCueillette: '07:10' } : {}) };
    K.op[key] = S({ type: 'apport', date, cepageId, kg, qualifId, cruId: cr(cru), apporteurId: K.apt[apporteur], parcelleId: PARC_DE[key] ? K.parc[PARC_DE[key]] : '', ref: `BP-${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8)}-${key.toUpperCase()}`, pesee }).id;
    must(peseeValider(db, K.op[key], { maintenant: `${date}T${PESEES[key]}:00` }));
  };
  const trans = (type, date, lot, from, to, volL, pertes, lignes, extra) => S({ type, date, portionId: por(lot, from).id, destId: K.ct[to], volL: volL == null ? r2(por(lot, from).vol) : volL, pertes: (pertes || []).map(([typeId, v]) => ({ typeId, volL: v })), lignes: lignes || [], equipementIds: ['pompe'], ...(type === 'debourbage' ? { stade: 'mout_debourbe' } : {}), ...(extra || {}) });
  const et = (date, lot, newStade, extra) => S({ type: 'etape', date, lotId: K.lot[lot], newStade, ...(extra || {}) }); // changement de stade
  const treat = (type, date, lot, ct, lignes, extra) => S({ type, date, portionId: por(lot, ct).id, lignes, ...(extra || {}) });

  /* ===== Campagne 2025-2026 ===== */
  const rr = S({ type: 'reprise', date: '2025-08-01', contenantId: K.ct.foud1, volL: 1800, lotSpec: { code: 'RES-01', designation: 'Réserve perpétuelle – génération 1', millesime: 'NV', type: 'vin_reserve', qualifId: 'conv', cepages: { chard: 50, pn: 30, pm: 20 }, crus: { [cr('Cramant')]: 40, [cr('Ludes')]: 35, [cr('Épernay')]: 25 } } }); K.lot.RES1 = rr.lotId;
  const rt = S({ type: 'reprise', date: '2025-08-01', nbBouteilles: 12000, volL: 0, lotSpec: { code: 'T24-01', designation: 'Cuvée Brut 2024 – sur lattes', millesime: '2024', type: 'cuvee_tirage', qualifId: 'conv', cepages: { chard: 40, pn: 40, pm: 20 }, echelle: 'premier' } }); K.lot.T24 = rt.lotId;

  apport('a1', '2025-09-10', 'chard', 8000, 'conv', 'Cramant', 'Lefèvre Père & Fils'); apport('a2', '2025-09-10', 'pn', 4000, 'conv', 'Verzenay', 'GAEC des Crayères'); apport('a3', '2025-09-12', 'pm', 4000, 'conv', 'Vincelles', 'EARL Marchand'); apport('a4', '2025-09-13', 'chard', 4000, 'bio', 'Vertus', 'Domaine Hennequin'); apport('a5', '2025-09-14', 'pn', 4000, 'dem', 'Ambonnay', 'GAEC des Crayères');
  press('2025-09-10', 'P1', 'P25-01', 'Chardonnay 2025 – pressée 1', 'conv', [['a1', 4000]], { cuvee: [2050, 'bacd1'], taille1: [500, 'c05'] });
  press('2025-09-10', 'P2', 'P25-02', 'Pinot noir 2025 – pressée 2', 'conv', [['a2', 4000]], { cuvee: [2050, 'bacd2'], taille1: [480, 'c06'] });
  trans('debourbage', '2025-09-11', 'P1C', 'bacd1', 'c01', 1300, [['bourbes', 45]], [ln('enz', 'enza', 25), ln('so2', 'so2a', 120)]);
  trans('debourbage', '2025-09-11', 'P1C', 'bacd1', 'c07', null, [['bourbes', 25]], [ln('enz', 'enza', 15), ln('so2', 'so2a', 70)]);
  trans('debourbage', '2025-09-11', 'P2C', 'bacd2', 'c02', null, [['bourbes', 70]], [ln('enz', 'enza', 40), ln('so2', 'so2a', 190)]);
  press('2025-09-12', 'P3', 'P25-03', 'Meunier 2025 – pressée 3', 'conv', [['a3', 4000]], { cuvee: [2050, 'bacd1'] });
  press('2025-09-13', 'P4', 'P25-04', 'Chardonnay Bio 2025 – pressée 4', 'bio', [['a4', 4000]], { cuvee: [2050, 'bacd2'] });
  trans('debourbage', '2025-09-13', 'P3C', 'bacd1', 'c03', null, [['bourbes', 60]], [ln('enz', 'enza', 40), ln('so2', 'so2a', 190)]);
  press('2025-09-14', 'P5', 'P25-05', 'Pinot noir Demeter 2025 – pressée 5', 'dem', [['a5', 4000]], { cuvee: [2050, 'bacd1'] });
  trans('debourbage', '2025-09-14', 'P4C', 'bacd2', 'cb1', null, [['bourbes', 50]], [ln('so2', 'so2a', 100)]);
  trans('debourbage', '2025-09-15', 'P5C', 'bacd1', 'cd1', null, [['bourbes', 55]], [ln('so2', 'so2a', 60)]);
  // variantes du catalogue (sousType) : levurage → « en FA », soutirage → « vin soutiré », collage → « vin collé », filtration → « vin filtré »
  treat('intrant', '2025-09-16', 'P1C', 'c01', [ln('levp', 'levpa', 370)], { sousType: 'levurage', motif: 'Levurage', stade: 'fa' });
  treat('intrant', '2025-09-16', 'P1C', 'c07', [ln('levp', 'levpa', 215)], { sousType: 'levurage', motif: 'Levurage', stade: 'fa' });
  treat('intrant', '2025-09-16', 'P2C', 'c02', [ln('levp', 'levpa', 590), ln('act', 'acta', 600)], { sousType: 'levurage', motif: 'Levurage + activateur', stade: 'fa' });
  et('2025-09-14', 'P1T', 'fa'); et('2025-09-14', 'P2T', 'fa'); et('2025-09-15', 'P3C', 'fa'); et('2025-09-16', 'P4C', 'fa'); et('2025-09-17', 'P5C', 'fa'); // levures indigènes
  const fa = (date, lot) => et(date, lot, 'fin_fa', { sousType: 'fin_fa' });
  fa('2025-10-06', 'P1C'); fa('2025-10-07', 'P2C'); fa('2025-10-08', 'P3C'); fa('2025-10-08', 'P1T'); fa('2025-10-08', 'P2T'); fa('2025-10-12', 'P4C'); fa('2025-10-14', 'P5C');
  trans('soutirage', '2025-12-05', 'P2C', 'c02', 'c08', null, [['lies', 60]], [ln('so2', 'so2a', 80)], { stade: 'vin_soutire' });
  trans('soutirage', '2025-12-05', 'P1C', 'c01', 'c09', null, [['lies', 40]], [ln('so2', 'so2a', 60)], { stade: 'vin_soutire' });
  et('2025-12-06', 'P3C', 'vin_clair'); et('2025-12-06', 'P1T', 'vin_clair'); et('2025-12-06', 'P2T', 'vin_clair'); et('2025-12-08', 'P4C', 'vin_clair'); et('2025-12-08', 'P5C', 'vin_clair');
  treat('intrant', '2026-01-05', 'P2C', 'c08', [ln('ben', 'bena', 400)], { sousType: 'collage', motif: 'Collage', stade: 'vin_colle' });
  treat('froid', '2026-01-12', 'P2C', 'c08', [ln('gel', 'gela', 150)], { tempC: -2, jours: 10 });
  treat('filtration', '2026-02-20', 'P1C', 'c09', [ln('plq', 'plqa', 12), ln('dia', 'diaa', 2)], { methodeId: 'plaques', equipementIds: ['filtre'], pertes: [{ typeId: 'autre', volL: 25 }], stade: 'vin_filtre' });
  // assemblage : vin filtré + vin collé + vin clair → mélange « vin clair » (règles), puis stade automatique « vin assemblé »
  const as1 = S({ type: 'assemblage', date: '2026-03-18', sources: [src('P1C', 'c09'), src('P1C', 'c07'), src('P2C', 'c08'), src('P3C', 'c03')], destId: K.ct.cit1, pertes: [], lignes: [ln('so2', 'so2a', 400)], lotSpec: { code: 'AS25-01', designation: 'Assemblage Brut 2025', millesime: '2025', type: 'assemblage' } }); K.lot.AS1 = as1.lotId;
  const as2 = S({ type: 'assemblage', date: '2026-03-19', sources: [src('P4C', 'cb1'), src('P5C', 'cd1')], destId: K.ct.c10, pertes: [], lignes: [], lotSpec: { code: 'AS25-02', designation: 'Assemblage Nature 2025', millesime: '2025', type: 'assemblage' } }); K.lot.AS2 = as2.lotId;
  const as3 = S({ type: 'assemblage', date: '2026-03-20', sources: [src('P1T', 'c05'), src('AS2', 'c10', 300)], destId: K.ct.c05, pertes: [], lignes: [], lotSpec: { code: 'AS25-03', designation: 'Assemblage Tailles 2025', millesime: '2025', type: 'assemblage' } }); K.lot.AS3 = as3.lotId;
  const lev = S({ type: 'preparation', date: '2026-03-25', ptype: 'levain', qualifId: 'conv', volL: 50, code: 'LEV-26-01', lignes: [ln('levm', 'levma', 250), ln('suc', 'suca', 5)], sourcePortionId: por('AS1', 'cit1').id, sourceVolL: 40 }); K.prep.lev = lev.prepId;
  const liq = S({ type: 'preparation', date: '2026-03-25', ptype: 'liqueur_tirage', qualifId: 'conv', volL: 240, code: 'LT-26-01', lignes: [ln('suc', 'suca', 120)] }); K.prep.liq = liq.prepId;
  const t26 = S({ type: 'tirage', date: '2026-04-02', sources: [src('AS1', 'cit1', 4900)], prepUses: [{ prepId: K.prep.liq, volL: 240 }, { prepId: K.prep.lev, volL: 50 }], lignes: [ln('ben', 'bena', 1000), ln('bou', 'boua', 6900), ln('cap', 'capa', 6900)], nbBouteilles: 6900, volBouteilleL: 0.75, densBase: 0.9918, densMix: 1.001, lotSpec: { code: 'T26-01', designation: 'Cuvée Brut 2025 – tirage printemps 2026', millesime: '2025' } }); K.lot.T26 = t26.lotId;
  const hy = (date, cibleType, ct, actionId, produit) => must(hygieneSave(db, { date, cibleType, cibleId: cibleType === 'contenant' ? K.ct[ct] : ct, actionId, produit, operateurs: [date < '2026-08-01' ? OPR.mr : OPR.tg] }));
  hy('2025-09-09', 'equipement', 'pressoir', 'nettoyage', 'Eau chaude + détergent alcalin'); hy('2025-09-10', 'contenant', 'bacd1', 'rincage', 'Eau claire'); hy('2025-09-10', 'contenant', 'bacd2', 'rincage', 'Eau claire');
  hy('2025-09-10', 'contenant', 'c01', 'desinfection', 'Acide peracétique 0,2 %'); hy('2025-09-10', 'contenant', 'c02', 'desinfection', 'Acide peracétique 0,2 %'); hy('2025-12-04', 'contenant', 'c08', 'nettoyage', 'Soude 2 % puis rinçage');
  hy('2026-02-19', 'equipement', 'filtre', 'nettoyage', 'Eau chaude 80 °C'); hy('2026-03-30', 'equipement', 'tireuse', 'desinfection', 'Acide peracétique 0,2 %');
  const an = (date, lot, ct, modeleId, valeurs) => must(analyseSave(db, { date, lotId: K.lot[lot], contenantId: ct ? K.ct[ct] : '', modeleId, valeurs }));
  an('2025-09-11', 'P1C', 'bacd1', 'm_mout', { tap: 10.2, at: 7.9, ph: 3.05, azote: 165 }); an('2025-09-11', 'P2C', 'bacd2', 'm_mout', { tap: 10.4, at: 7.5, ph: 3.12, azote: 150 });
  an('2025-12-04', 'P2C', 'c02', 'm_clair', { tap: 10.6, at: 7.1, ph: 3.12, so2t: 28, so2l: 8 }); an('2026-02-18', 'P1C', 'c09', 'm_clair', { tap: 10.4, at: 6.9, ph: 3.15, so2t: 45, so2l: 14 });
  an('2026-03-26', 'AS1', 'cit1', 'm_pretirage', { tap: 11.0, at: 6.2, ph: 3.18, so2t: 38, dbase: 0.9918, dmix: 1.001 });
  campFreeze(db, '2025-2026');

  /* ===== Campagne 2026-2027 ===== */
  const le = S({ type: 'preparation', date: '2026-10-01', ptype: 'liqueur_exp', qualifId: 'conv', volL: 20, code: 'LE-26-01', lignes: [ln('mcr', 'mcra', 8), ln('suc', 'suca', 6), ln('so2', 'so2b', 10)] }); K.prep.le = le.prepId;
  et('2026-09-28', 'T24', 'sur_pointes', { sousType: 'remuage' }); // remuage en gyropalettes, bouteilles sur pointes
  S({ type: 'degorgement', date: '2026-10-05', sourceLotId: K.lot.T24, nb: 3000, prepUses: [{ prepId: K.prep.le, volL: 20 }], lignes: [ln('bch', 'bcha', 3000), ln('mus', 'musa', 3000)], lotFiniSpec: { code: 'LF-26-001', designation: 'Brut – dégorgé octobre 2026', dosageGL: 8 } });
  apport('a6', '2026-09-09', 'chard', 8000, 'conv', 'Le Mesnil-sur-Oger', 'Lefèvre Père & Fils'); apport('a7', '2026-09-11', 'pn', 4000, 'conv', 'Verzenay', 'GAEC des Crayères'); apport('a8', '2026-09-12', 'pm', 4000, 'bio', 'Passy-Grigny', 'EARL Marchand');
  press('2026-09-09', 'P6', 'P26-01', 'Chardonnay 2026 – pressée 1', 'conv', [['a6', 4000]], { cuvee: [2050, 'bacd1'], taille1: [500, 'bact'] });
  press('2026-09-10', 'P7', 'P26-02', 'Chardonnay 2026 – pressée 2', 'conv', [['a6', 4000]], { cuvee: [2050, 'bacd2'] });
  trans('debourbage', '2026-09-10', 'P6C', 'bacd1', 'c01', null, [['bourbes', 65]], [ln('enz', 'enzb', 40), ln('so2', 'so2b', 190)]);
  press('2026-09-11', 'P8', 'P26-03', 'Pinot noir 2026 – pressée 3', 'conv', [['a7', 4000]], { cuvee: [2050, 'bacd1'] });
  trans('debourbage', '2026-09-11', 'P7C', 'bacd2', 'c02', null, [['bourbes', 70]], [ln('so2', 'so2b', 200)]);
  press('2026-09-12', 'P9', 'P26-04', 'Meunier Bio 2026 – pressée 4', 'bio', [['a8', 4000]], { cuvee: [2050, 'bacd2'] });
  trans('debourbage', '2026-09-12', 'P8C', 'bacd1', 'c03', null, [['bourbes', 60]], [ln('so2', 'so2b', 190)]);
  trans('debourbage', '2026-09-13', 'P9C', 'bacd2', 'cb1', null, [['bourbes', 55]], [ln('so2', 'so2b', 100)]);
  treat('intrant', '2026-09-14', 'P6C', 'c01', [ln('levp', 'levpb', 590)], { sousType: 'levurage', motif: 'Levurage', stade: 'fa' });
  // pressée 5 (Meunier) : la rebêche part à la distillerie ; la taille rejoint une taille déjà en FA → « moût + vin en fermentation = vin en fermentation »
  apport('a9', '2026-09-15', 'pm', 4000, 'conv', 'Vincelles', 'EARL Marchand');
  press('2026-09-15', 'P10', 'P26-05', 'Meunier 2026 – pressée 5', 'conv', [['a9', 4000]], { cuvee: [2050, 'bacd1'], taille1: [500, 'bacd2'], rebeche: [110, 'fut2'] });
  trans('debourbage', '2026-09-16', 'P10C', 'bacd1', 'cd1', null, [['bourbes', 60]], [ln('enz', 'enzb', 40), ln('so2', 'so2b', 190)]);
  treat('intrant', '2026-09-17', 'P10C', 'cd1', [ln('levp', 'levpb', 590), ln('act', 'actb', 400)], { sousType: 'levurage', motif: 'Levurage + activateur', stade: 'fa' });
  const rg1 = S({ type: 'assemblage', sousType: 'regroupement', date: '2026-09-17', sources: [src('P10T', 'bacd2'), src('P6T', 'bact')], destId: K.ct.bact, pertes: [], lignes: [], lotSpec: { code: 'RG26-01', designation: 'Tailles 2026 regroupées', millesime: '2026', type: 'assemblage' }, stade: 'fa' }); K.lot.RG1 = rg1.lotId;
  S({ type: 'sortie', sousType: 'distillerie', date: '2026-09-18', portionId: por('P10R', 'fut2').id, volL: 110, motif: 'Prestations viniques', destinataire: 'Distillerie de la Marne', ref: 'DSA 26-0918-01' });
  const sv = (date, lot, ct, densite, tempC, extra) => S({ type: 'suivi', date, portionId: por(lot, ct).id, lignes: [], prepUses: [], motif: 'Suivi de fermentation', densite, tempC, ...(extra || {}) });
  sv('2026-09-19', 'P10C', 'cd1', 1.068, 16); sv('2026-09-21', 'RG1', 'bact', 1.031, 18); sv('2026-09-24', 'P6C', 'c01', 1.012, 18); sv('2026-09-26', 'P10C', 'cd1', 1.018, 19); sv('2026-10-01', 'RG1', 'bact', 0.996, 17);
  et('2026-09-11', 'P6T', 'fa'); et('2026-09-13', 'P7C', 'fa'); et('2026-09-14', 'P8C', 'fa'); et('2026-09-15', 'P9C', 'fa');
  an('2026-09-24', 'P6C', 'c01', 'm_ferm', { densite: 1.012, temp: 18, sucres: 28 }); an('2026-10-01', 'P6C', 'c01', 'm_ferm', { densite: 0.993, temp: 17, sucres: 1.4 }); an('2026-10-26', 'P8C', 'c03', 'm_fml', { malique: 0.1, av: 0.28, ph: 3.21 });
  fa('2026-10-02', 'P6C'); fa('2026-10-05', 'P7C'); fa('2026-10-08', 'P8C'); fa('2026-10-09', 'P9C'); fa('2026-10-06', 'RG1'); fa('2026-10-10', 'P10C'); et('2026-10-18', 'P6C', 'vin_clair');
  S({ type: 'froid', sousType: 'rechauffage', date: '2026-10-19', portionId: por('P8C', 'c03').id, tempC: 20, jours: 6, lignes: [] }); // cuve réchauffée pour la malo
  treat('intrant', '2026-10-20', 'P8C', 'c03', [ln('bac', 'baca', 20)], { sousType: 'ensemencement_fml', motif: 'Ensemencement bactérien', stade: 'fml' });
  treat('intrant', '2026-10-15', 'P9C', 'cb1', [ln('lys', 'lysa', 500)], { motif: 'Protection contre la malo' }); // lysozyme non autorisé en FR-BIO-01 → alerte à valider
  const rs = S({ type: 'assemblage', date: '2026-10-20', sources: [src('RES1', 'foud1'), src('P6C', 'c01', 900)], destId: K.ct.foud1, pertes: [], lignes: [], lotSpec: { code: 'RES-02', designation: 'Réserve perpétuelle – génération 2', millesime: 'NV', type: 'vin_reserve' }, stade: 'elevage' }); K.lot.RES2 = rs.lotId; // dépasse la capacité du foudre → « à vérifier »
  et('2026-10-25', 'P7C', 'vin_clair');
  S({ type: 'jaugeage', date: '2026-11-05', portionId: por('P7C', 'c02').id, volMesure: 1975, typeId: 'ecart' });
  an('2026-09-10', 'P6C', 'bacd1', 'm_mout', { tap: 10.0, at: 8.1, ph: 3.02, azote: 172 }); an('2026-11-05', 'P7C', 'c02', 'm_clair', { tap: 10.5, at: 7.2, ph: 3.1, so2t: 30, so2l: 9 });
  // entrée de moûts achetés (2 cépages, 2 crus, même apporteur) + sulfitage à la réception
  // livraison de moûts en citerne à 3 compartiments : 2 qualités vers une même cuve, 1 qualité répartie sur 2 cuves
  // chaque compartiment : n° de lot, analyses à réception (moyenne pondérée et enrichissement par cuve) ; C3 vient de deux partenaires
  const ME = [{ numLot: 'L2609-114-1', analyses: { tap: 9.8, at: 7.9, ph: 3.05 } }, { numLot: 'L2609-114-2', analyses: { tap: 10.4, at: 7.4, ph: 3.1 } },
    { numLot: 'L2609-114-3', apporteurs: [{ id: K.apt['Maison Dubois'], pct: 60 }, { id: K.apt['Lefèvre Père & Fils'], pct: 40 }], analyses: { tap: 9.5, at: 8.6, ph: 2.98 } }];
  const mo = S({ type: 'entree_mout', date: '2026-09-14', apporteurId: K.apt['Maison Dubois'], ref: 'BL-2609-114', immat: 'GH-482-KT', millesime: '2026', stade: 'mout_debourbe', analyseModele: 'm_mout', entrees: [
    { compartiment: 'C1', cepageId: 'chard', fractionId: 'cuvee', cruId: cr('Avize'), qualifId: 'conv', apporteurId: K.apt['Maison Dubois'], ...ME[0], volL: 1200, dests: [{ contenantId: K.ct.c08, volL: 1200 }] },
    { compartiment: 'C2', cepageId: 'chard', fractionId: 'cuvee', cruId: cr('Cramant'), qualifId: 'conv', apporteurId: K.apt['Maison Dubois'], ...ME[1], volL: 800, dests: [{ contenantId: K.ct.c08, volL: 800 }] },
    { compartiment: 'C3', cepageId: 'pn', fractionId: 'taille1', cruId: cr('Mareuil-sur-Ay'), qualifId: 'conv', apporteurId: K.apt['Maison Dubois'], ...ME[2], volL: 1200, dests: [{ contenantId: K.ct.c09, volL: 700 }, { contenantId: K.ct.c07, volL: 500 }] }],
  lots: [{ contenantId: K.ct.c08, code: 'M26-01-C', designation: 'Moût cuvée Chardonnay Grands Crus – Maison Dubois' }, { contenantId: K.ct.c09, code: 'M26-01-T1-1', designation: 'Moût taille Pinot noir – Maison Dubois' }, { contenantId: K.ct.c07, code: 'M26-01-T1-2', designation: 'Moût taille Pinot noir – Maison Dubois' }] }); K.lot.M1 = mo.lots[0].lotId;
  treat('intrant', '2026-09-15', 'M1', 'c08', [ln('so2', 'so2b', 90)], { sousType: 'sulfitage', motif: 'Sulfitage à réception' });
  et('2026-09-16', 'M1', 'fa');
  // contenants « artisanaux » : réserve en jarre, essai en amphore, élevage en œuf
  const rj = S({ type: 'reprise', date: '2026-08-01', contenantId: K.ct.jarre1, volL: 350, lotSpec: { code: 'JAR-01', designation: 'Réserve en jarre grès', millesime: '2025', type: 'vin_reserve', qualifId: 'conv', cepages: { pn: 60, pm: 40 }, crus: { [cr('Verzenay')]: 100 } } }); K.lot.JAR = rj.lotId;
  const ra = S({ type: 'reprise', date: '2026-08-01', contenantId: K.ct.amph1, volL: 280, lotSpec: { code: 'AMP-01', designation: 'Essai Chardonnay en amphore', millesime: '2025', type: 'vin_clair', qualifId: 'bio', cepages: { chard: 100 }, crus: { [cr('Vertus')]: 100 } }, stade: 'elevage' }); K.lot.AMP = ra.lotId;
  // vin rouge (Coteaux champenois) élevé en fût : sert au rosé d'assemblage
  const rr2 = S({ type: 'reprise', date: '2026-08-01', contenantId: K.ct.fut1, volL: 200, couleur: 'rouge', stade: 'elevage', lotSpec: { code: 'ROU-25', designation: 'Rouge de Bouzy 2025 (Coteaux champenois)', millesime: '2025', type: 'vin_clair', qualifId: 'conv', cepages: { pn: 100 }, crus: { [cr('Bouzy')]: 100 } } }); K.lot.ROU = rr2.lotId;
  trans('transfert', '2026-11-08', 'P7C', 'c02', 'oeuf1', 400, [], []);
  // essai de rosé d'assemblage : vin clair blanc + rouge → couleur « rosé » proposée automatiquement
  const ros = S({ type: 'assemblage', date: '2026-11-10', sources: [src('P7C', 'oeuf1', 46), src('ROU', 'fut1', 6)], destId: K.ct.bomb1, pertes: [], lignes: [], lotSpec: { code: 'ROS-26-01', designation: 'Essai rosé d’assemblage (12 % de rouge)', millesime: '2026', type: 'assemblage' } }); K.lot.ROS = ros.lotId;
  S({ type: 'suivi', sousType: 'batonnage', date: '2026-11-02', portionId: por('RES2', 'foud1').id, lignes: [], prepUses: [], motif: 'Bâtonnage des lies fines' });
  S({ type: 'sortie', date: '2026-11-03', portionId: por('AS2', 'c10').id, volL: 1000, motif: 'Vente en vrac', destinataire: 'Maison Dubois', ref: 'DAE 26FR0510001184' });
  treat('filtration', '2026-11-12', 'P6C', 'c01', [ln('plq', 'plqa', 6)], { methodeId: 'plaques', equipementIds: ['filtre'], pertes: [{ typeId: 'autre', volL: 15 }], stade: 'vin_filtre' });
  const rg2 = S({ type: 'assemblage', sousType: 'regroupement', date: '2026-11-14', sources: [src('P6C', 'c01'), src('P7C', 'c02')], destId: K.ct.c01, pertes: [], lignes: [], lotSpec: { code: 'RG26-02', designation: 'Chardonnay 2026 cuvée – regroupement', millesime: '2026', type: 'assemblage' }, stade: 'vin_clair' }); K.lot.RG2 = rg2.lotId; // vin filtré + vin clair = vin clair
  hy('2026-09-08', 'equipement', 'pressoir', 'nettoyage', 'Eau chaude + détergent alcalin'); hy('2026-09-09', 'contenant', 'bacd1', 'rincage', 'Eau claire'); hy('2026-09-12', 'contenant', 'cb1', 'desinfection', 'Acide peracétique 0,2 %');
  // produits d'hygiène (0.18.0-alpha.1) : exemples à remplacer par les informations des FDS de vos fournisseurs
  const EXH = 'Exemple : reprenez les informations de la fiche de données de sécurité (FDS) de votre fournisseur et joignez-la.';
  const ph = (x) => must(hygProduitSave(db, { notes: EXH, ...x })).id;
  const H314 = 'H314 : Provoque de graves brûlures de la peau et de graves lésions des yeux.';
  const phS = ph({ nom: 'Soude caustique lessive 30 %', type: 'alcalin', forme: 'liquide', unite: 'L', composition: 'Hydroxyde de sodium (30 %)', concMin: 1, concMax: 3, concUnite: '%', temperature: '40 à 60 °C', contact: '15 à 30 min', rincage: 'oui', contactAlimentaire: true,
    mention: 'danger', pictos: ['SGH05'], phrasesH: `H290 : Peut être corrosif pour les métaux.\n${H314}`, epi: ['gants', 'lunettes', 'visiere', 'tablier', 'bottes'],
    incompatibilites: 'Acides (réaction violente), aluminium, zinc, étain.', stockage: 'Local fermé et ventilé, sur bac de rétention, à l’écart des acides.', secours: 'Yeux : rincer immédiatement et abondamment à l’eau pendant 15 minutes, consulter un médecin. Peau : retirer les vêtements souillés, rincer abondamment à l’eau.' });
  const phP = ph({ nom: 'Acide peracétique 5 %', type: 'desinfectant', forme: 'liquide', unite: 'L', composition: 'Acide peracétique, peroxyde d’hydrogène, acide acétique', concMin: 0.5, concMax: 1, concUnite: '%', contact: '10 à 20 min', rincage: 'oui', contactAlimentaire: true,
    mention: 'danger', pictos: ['SGH05'], phrasesH: H314, epi: ['gants', 'lunettes', 'tablier'], incompatibilites: 'Produits chlorés, bases, métaux.', stockage: 'Au frais, à l’abri de la lumière, bidon fermé et ventilé (dégazage).' });
  ph({ nom: 'Acide citrique (détartrant)', type: 'acide', forme: 'poudre', unite: 'kg', composition: 'Acide citrique', concMin: 1, concMax: 2, concUnite: '%', rincage: 'oui', contactAlimentaire: true,
    mention: 'attention', pictos: ['SGH07'], phrasesH: 'H319 : Provoque une sévère irritation des yeux.', epi: ['gants', 'lunettes'] });
  const hyP = (date, ct, actionId, produits, methode) => must(hygieneSave(db, { date, cibleType: 'contenant', cibleId: K.ct[ct], actionId, produits, methode, operateurs: [OPR.tg] }));
  hyP('2026-11-16', 'bacd1', 'nettoyage', [{ produitId: phS, conc: 2, quantite: 4 }], 'eau chaude 50 °C, puis rinçage à l’eau claire');
  hyP('2026-11-16', 'bacd1', 'desinfection', [{ produitId: phP, conc: 0.5, quantite: 1 }], 'rinçage à l’eau claire');
  // plans d'hygiène (0.26.0-alpha.1) : plan de nettoyage et de maintenance mis en place le 1er novembre (modèles d'origine) ;
  // quelques entrées suivant le plan (avec leur contrôle), une révision, une pompe déjà entretenue l'an dernier et une panne signalée
  db.settings.planHygieneDepuis = '2026-11-01';
  const hyL = (date, cibleType, cibleId, actionId, produits, methode, controle) => must(hygieneSave(db, { date, cibleType, cibleId, actionId, produits, methode, operateurs: [OPR.tg], ...(controle ? { controle } : {}) }));
  hyL('2026-11-08', 'contenant', K.ct.oeuf1, 'rincage', [], 'eau claire', { type: 'visuel', resultat: 'conforme' });
  hyL('2026-11-09', 'local', 'materiel_transfert', 'desinfection', [{ produitId: phP, conc: 0.5 }], 'boucle de circulation 15 min, balle de nettoyage', { type: 'peroxyde', resultat: 'conforme', valeur: '0' });
  hyL('2026-11-16', 'local', 'sol_cuverie', 'nettoyage', [{ produitId: phS, conc: 2 }], 'balai-brosse, joints et caniveaux, rinçage', { type: 'ph', resultat: 'conforme', valeur: '7' });
  must(maintInterventionSave(db, { date: '2026-08-20', entreeId: 'pm_pressoirs', equipementId: 'pressoir', type: 'preventive', interventions: 'Révision avant vendanges : membrane et joints contrôlés, programmes essayés.', intervenant: 'Constructeur', resultat: 'conforme', operateurs: [OPR.tg] }));
  (db.planMaintenance.find((x) => x.id === 'pm_pompes') || {}).derniere = '2025-11-12';
  must(maintInterventionSave(db, { date: '2026-11-18', entreeId: 'pm_pompes', equipementId: 'pompe', type: 'curative', statut: 'ouverte', probleme: 'Fuite au presse-étoupe de la pompe à pistons.', operateurs: [OPR.tg] }));
  must(operateurActif(db, OPR.mr, false)); // saisonnier 2025 : n'est plus proposé, son historique reste
  db.sites.forEach((st) => planAuto(db, st.id, false));
  return db;
}
