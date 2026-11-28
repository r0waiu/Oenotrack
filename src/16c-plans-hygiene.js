/* ============ PLANS D'HYGIÈNE (0.26.0-alpha.1) : plan de nettoyage et de désinfection (PND) et plan de maintenance du matériel ============
   Méthode HACCP : pour chaque zone, ce qui se nettoie, quand, avec quoi, comment, comment on le vérifie et qui l'enregistre ; des règles
   en tirent les tâches à faire et les non-conformités (alertes), d'après les opérations réellement enregistrées.
   db.planNettoyage [{ id, zone, libelle, cible { type: 'contenants' | 'equipements' | 'locaux', formes [], ids [], motCle }, actionId,
     quand [{ type, delai, heures, jours, siVide, pendantVendanges, ops [], texte }], produits [{ type | produitId, conc, concUnite }],
     mode, contact, controle, attendu, enregistrement, enregistrer (alertes si la trace manque), responsable, danger, actif, modele }]
   db.planMaintenance [{ id, libelle, equipementIds [], motCle, annee, type: 'preventive' | 'reglementaire' | type ajouté, frequence { n, unite },
     avantVendanges, interventions, enregistrement, intervenant, derniere (date connue avant Œnotrack), actif, modele }]
   db.maintenance [{ id, date, entreeId, equipementId, libelle, type: 'preventive' | 'curative' | 'reglementaire' | type ajouté, statut: 'faite' | 'ouverte',
     probleme, interventions, intervenant, resultat: 'conforme' | 'a_suivre' | 'hors_service', notes, operateurs }]
   db.hygieneAcquits [{ id (clé de la tâche), date, par, motif }] : non-conformités vues et justifiées, plus signalées.
   settings.planHygieneDepuis : mise en place du plan (seuls les événements suivants sont contrôlés) ; settings.planHygieneActif.
   Journal d'hygiène : entrée + controle { type, resultat, valeur }, changementRevendication { de, vers }, planId ; cible « local »
   (lists.locaux : sols, caisses, matériel de transfert…). Les versions précédentes gardent ces champs et ces collections. */
const HYG_ZONES = [['pressoir', 'Pressoir et réception'], ['cuverie', 'Cuverie'], ['tirage', 'Tirage'], ['degorgement', 'Dégorgement'], ['autre', 'Autres zones']];
const HYG_DANGERS = [['biologique', 'Biologique (levures, bactéries, moisissures)'], ['chimique', 'Chimique (résidus de produits)'], ['physique', 'Physique (tartre, corps étrangers)'], ['certification', 'Revendication (bio, biodynamie)']];
const HYG_CONTROLES = [['visuel', 'Visuel'], ['ph', 'Papier pH'], ['peroxyde', 'Papier peroxyde'], ['aucun', 'Aucun']];
const HYG_CONTROLE_ATTENDU = { ph: 'pH 7', peroxyde: '0 (aucun résidu)' };
const HYG_QUAND = [
  ['vidange', 'Après chaque vidange'], ['avantRemplissage', 'Avant chaque remplissage (dernier passage de plus de 24 h)'], ['changementRevendication', 'Changement de revendication (vers Bio, Demeter / biodynamie…)'],
  ['apresOp', 'Après chaque marc ou opération'], ['periodique', 'Périodique (tous les … jours)'], ['vendangesSoir', 'Chaque soir en période de vendanges'],
  ['avantVendanges', 'Avant les vendanges'], ['apresVendanges', 'Après les vendanges'], ['avantAssemblages', 'Avant les assemblages'], ['apresAssemblages', 'Après les assemblages'], ['apresTirage', 'Après le tirage'],
  ['texte', 'Autre moment (consigne, sans alerte)'],
];
// une action plus complète vaut la plus simple : un nettoyage vaut un rinçage, la vapeur vaut une désinfection…
const HYG_SATISFAIT = { rincage: ['rincage', 'nettoyage', 'desinfection', 'detartrage', 'vapeur'], nettoyage: ['nettoyage', 'detartrage'], desinfection: ['desinfection', 'vapeur'], detartrage: ['detartrage'], vapeur: ['vapeur'], soufrage: ['soufrage'] };
const hygSatisfait = (requis, fait) => !!requis && (requis === fait || (HYG_SATISFAIT[requis] || []).includes(fait));
const MAINT_TYPES = [['preventive', 'Préventive'], ['curative', 'Curative'], ['reglementaire', 'Réglementaire']];
const MAINT_UNITES = [['jour', 'jour(s)'], ['semaine', 'semaine(s)'], ['mois', 'mois'], ['an', 'an(s)']];
const MAINT_RESULTATS = [['conforme', 'En service, conforme'], ['a_suivre', 'À suivre'], ['hors_service', 'Hors service']];
const hygLibQuand = (q) => { if (q && q.type === 'texte') return q.texte || 'Autre moment'; if (!q || q.type !== 'periodique') return hygLib(HYG_QUAND, q && q.type); const n = q.jours || 7; return q.pendantVendanges && q.siVide ? `Tous les ${n} jours, pendant les vendanges, contenant vide` : q.pendantVendanges ? `Tous les ${n} jours, pendant les vendanges` : q.siVide ? `Tous les ${n} jours, contenant vide` : `Tous les ${n} jours`; };

/* ---------- modèles d'origine (génériques, méthode HACCP ; à adapter à chaque exploitation) ---------- */
const CUVES_TYPES = ['cuve', 'foudre', 'jarre', 'amphore', 'oeuf', 'bombonne'];
const PN = (id, zone, libelle, cible, actionId, quand, o) => ({ id, zone, libelle, cible, actionId, quand, produits: [], mode: '', contact: '', controle: 'visuel', attendu: '', enregistrement: '', enregistrer: true, responsable: '', danger: 'biologique', actif: true, modele: true, ...(o || {}) });
const PLAN_NETTOYAGE_MODELE = () => [
  PN('pn_pressoir_rincage', 'pressoir', 'Pressoirs : intérieur', { type: 'equipements', motCle: '^pressoir' }, 'rincage', [{ type: 'apresOp', ops: ['pressurage'] }], { mode: 'Rinçage au jet d’eau potable : parois, toiles et zones de contact avec le marc ; évacuer les eaux de rinçage.', enregistrer: false, responsable: 'Opérateur du pressoir' }),
  PN('pn_pressoir_nettoyage', 'pressoir', 'Pressoirs : intérieur', { type: 'equipements', motCle: '^pressoir' }, 'nettoyage', [{ type: 'avantVendanges' }, { type: 'changementRevendication' }], { mode: 'Rinçage manuel au jet (parois, vis, drains), puis programme de lavage du pressoir ; l’eau évacuée doit être claire. En cas de changement de revendication, cochez-le dans l’entrée du journal.', responsable: 'Opérateur du pressoir', danger: 'certification' }),
  PN('pn_pressoir_fin', 'pressoir', 'Pressoirs : intérieur', { type: 'equipements', motCle: '^pressoir' }, 'nettoyage', [{ type: 'apresVendanges' }], { produits: [{ type: 'alcalin', conc: 3.5, concUnite: '%' }], mode: 'Démonter et nettoyer les drains ; solution alcaline dans le pressoir en rotation, puis rinçages automatique et manuel.', contact: '30 min', controle: 'ph', attendu: 'pH 7', responsable: 'Opérateur du pressoir', danger: 'chimique' }),
  PN('pn_pressoir_desinfection', 'pressoir', 'Pressoirs, maies, goulottes et trémies', { type: 'equipements', motCle: '^pressoir' }, 'desinfection', [{ type: 'vendangesSoir' }], { produits: [{ type: 'desinfectant', conc: 0.2, concUnite: '%' }], mode: 'Nettoyeur haute pression, rinçage, puis pulvérisation de la solution désinfectante ; laisser agir, rincer à l’eau claire.', contact: '15 à 20 min', controle: 'peroxyde', attendu: '0 (aucun résidu)', responsable: 'Opérateur du pressoir' }),
  PN('pn_sol_pressoir', 'pressoir', 'Sol et murs du pressoir', { type: 'locaux', ids: ['sol_pressoir'] }, 'nettoyage', [{ type: 'avantVendanges' }, { type: 'apresVendanges' }], { produits: [{ type: 'alcalin', conc: 10, concUnite: '%' }], mode: 'Haute pression sur sols, murs et trémies ; solution alcaline, frotter, rincer et passer la raclette.', contact: '15 à 20 min', controle: 'ph', attendu: 'pH 7', responsable: 'Opérateur du pressoir', danger: 'chimique' }),
  PN('pn_caisses_rincage', 'pressoir', 'Caisses à vendanges', { type: 'locaux', ids: ['caisses'] }, 'rincage', [{ type: 'texte', texte: 'Après chaque déchargement' }], { mode: 'Laveuse de caisses ou jet d’eau : aucune caisse remise en service sans rinçage.', enregistrer: false, responsable: 'Opérateur des caisses' }),
  PN('pn_caisses_nettoyage', 'pressoir', 'Caisses à vendanges', { type: 'locaux', ids: ['caisses'] }, 'nettoyage', [{ type: 'periodique', jours: 7, pendantVendanges: true }, { type: 'apresVendanges' }], { produits: [{ type: 'alcalin', conc: 10, concUnite: '%' }], mode: 'Nettoyage chimique dans la laveuse, rinçage final au jet ; contrôler le rinçage sur quelques caisses.', controle: 'ph', attendu: 'pH 7', responsable: 'Opérateur des caisses', danger: 'chimique' }),
  PN('pn_cuves_rincage', 'cuverie', 'Intérieur des cuves vides', { type: 'contenants', formes: CUVES_TYPES }, 'rincage', [{ type: 'vidange', delai: 1 }, { type: 'avantRemplissage', heures: 24 }], { mode: 'Rincer abondamment à l’eau (chaude en cas de tartre) ; vérifier la propreté avant de remplir.', responsable: 'Opérateur de cuverie' }),
  PN('pn_cuves_revendication', 'cuverie', 'Cuves : changement de revendication', { type: 'contenants', formes: CUVES_TYPES }, 'rincage', [{ type: 'changementRevendication' }], { mode: 'Avant de recevoir un vin d’une revendication supérieure (Conventionnel → Bio, Bio → Demeter / biodynamie : Biodyvin…) : rinçage complet, enregistré avec la mention « changement de revendication ».', responsable: 'Opérateur de cuverie', danger: 'certification' }),
  PN('pn_cuves_detartrage', 'cuverie', 'Intérieur des cuves vides', { type: 'contenants', formes: CUVES_TYPES }, 'detartrage', [{ type: 'avantVendanges' }, { type: 'avantAssemblages' }, { type: 'apresTirage' }], { produits: [{ type: 'alcalin', conc: 10, concUnite: '%' }], mode: 'Solution alcaline en circulation (pompe et boule de lavage) ; brosser vannes, dégustateurs et jauges ; rincer abondamment.', contact: '15 à 20 min', controle: 'ph', attendu: 'pH 7', responsable: 'Opérateur de cuverie', danger: 'physique' }),
  PN('pn_transfert_rincage', 'cuverie', 'Matériel de transfert (pompes, tuyaux, raccords)', { type: 'locaux', ids: ['materiel_transfert'] }, 'rincage', [{ type: 'texte', texte: 'Après chaque série de transferts, et à chaque changement de revendication' }], { mode: 'Faire circuler de l’eau propre jusqu’à disparition de la mousse ; rincer raccords et vannes au jet.', enregistrer: false, responsable: 'Opérateur de cuverie' }),
  PN('pn_transfert_desinfection', 'cuverie', 'Matériel de transfert (pompes, tuyaux, raccords)', { type: 'locaux', ids: ['materiel_transfert'] }, 'desinfection', [{ type: 'periodique', jours: 7 }, { type: 'vendangesSoir' }], { produits: [{ type: 'desinfectant', conc: 0.2, concUnite: '%' }], mode: 'Boucle de circulation (pompes, tuyaux, raccords) avec la solution désinfectante et une balle de nettoyage, puis rinçage abondant.', contact: '10 à 15 min', controle: 'peroxyde', attendu: '0 (aucun résidu)', responsable: 'Opérateur de cuverie' }),
  PN('pn_transfert_nettoyage', 'cuverie', 'Matériel de transfert (pompes, tuyaux, raccords)', { type: 'locaux', ids: ['materiel_transfert'] }, 'nettoyage', [{ type: 'avantVendanges' }, { type: 'apresTirage' }], { produits: [{ type: 'alcalin', conc: 10, concUnite: '%' }], mode: 'Solution alcaline en circulation, brosser les raccords ; rincer jusqu’à pH neutre ; nettoyer aussi l’extérieur des tuyaux.', contact: '10 à 15 min', controle: 'ph', attendu: 'pH 7', responsable: 'Opérateur de cuverie', danger: 'chimique' }),
  PN('pn_sol_cuverie', 'cuverie', 'Sol de la cuverie', { type: 'locaux', ids: ['sol_cuverie'] }, 'nettoyage', [{ type: 'periodique', jours: 7 }], { produits: [{ type: 'alcalin', conc: 5, concUnite: '%' }], mode: 'Pulvériser la solution, laisser agir, frotter au balai-brosse (joints, grilles de caniveaux), rincer.', contact: '15 à 20 min', controle: 'ph', attendu: 'pH 7', responsable: 'Opérateur de cuverie', danger: 'chimique' }),
  PN('pn_sol_desinfection', 'cuverie', 'Sol de la cuverie', { type: 'locaux', ids: ['sol_cuverie'] }, 'desinfection', [{ type: 'vendangesSoir' }], { produits: [{ type: 'desinfectant', conc: 0.2, concUnite: '%' }], mode: 'Pulvériser la solution désinfectante sur tout le sol, laisser agir, rincer.', contact: '15 à 20 min', controle: 'peroxyde', attendu: '0 (aucun résidu)', responsable: 'Opérateur de cuverie' }),
  PN('pn_futs_rincage', 'cuverie', 'Fûts', { type: 'contenants', formes: ['fut'] }, 'rincage', [{ type: 'vidange', delai: 1 }], { mode: 'Canne de lavage à l’eau froide (environ 5 min), égoutter fût retourné.', responsable: 'Opérateur de cuverie' }),
  PN('pn_futs_vapeur', 'cuverie', 'Fûts', { type: 'contenants', formes: ['fut'] }, 'vapeur', [{ type: 'apresAssemblages' }], { mode: 'Après rinçage, vapeur dans le fût (environ 20 min), rincer de nouveau, égoutter.', contact: '20 min', responsable: 'Opérateur de cuverie', danger: 'physique' }),
  PN('pn_futs_mechage', 'cuverie', 'Fûts vides en stock', { type: 'contenants', formes: ['fut'] }, 'soufrage', [{ type: 'periodique', jours: 45, siVide: true }], { mode: 'Méchage sur fût propre et sec (environ 10 g de mèche par fût), bonde fermée ; renouveler pendant le stockage.', controle: 'aucun', responsable: 'Opérateur de cuverie' }),
  PN('pn_citerne', 'cuverie', 'Citerne de transport', { type: 'contenants', formes: ['citerne'] }, 'rincage', [{ type: 'vidange', delai: 0 }, { type: 'changementRevendication' }], { mode: 'Rinçage à l’eau après déchargement ; vérifier les compartiments avant chargement. Moût ou vin Bio / Demeter (biodynamie : Biodyvin…) : attestation de nettoyage.', responsable: 'Conducteur de la citerne', danger: 'certification' }),
  PN('pn_tirage', 'tirage', 'Chaîne de tirage', { type: 'locaux', ids: ['chaine_tirage'] }, 'desinfection', [{ type: 'texte', texte: 'Chaque semaine pendant le tirage ; rinçage du circuit à chaque changement de revendication' }], { produits: [{ type: 'desinfectant', conc: 0.5, concUnite: '%' }], mode: 'Nettoyage puis désinfection de la chaîne et du circuit du vin ; rinçage, contrôle des résidus.', controle: 'peroxyde', attendu: '0 (aucun résidu)', enregistrer: false, responsable: 'Prestataire de tirage' }),
  PN('pn_degorgement', 'degorgement', 'Chaîne de dégorgement', { type: 'locaux', ids: ['chaine_degorgement'] }, 'desinfection', [{ type: 'texte', texte: 'Rinçage en début de journée ; nettoyage et désinfection chaque semaine' }], { produits: [{ type: 'desinfectant', conc: 0.5, concUnite: '%' }], mode: 'Circuit du vin : solution de nettoyage puis de désinfection en circulation ; rinçage, contrôle des résidus.', controle: 'peroxyde', attendu: '0 (aucun résidu)', enregistrer: false, responsable: 'Prestataire de dégorgement' }),
];
const PM = (id, libelle, motCle, type, n, unite, interventions, o) => ({ id, libelle, equipementIds: [], motCle, annee: '', type, frequence: { n, unite }, avantVendanges: false, interventions, enregistrement: '', intervenant: 'Interne', derniere: '', actif: true, modele: true, ...(o || {}) });
const PLAN_MAINTENANCE_MODELE = () => [
  PM('pm_pressoirs', 'Pressoirs', '^pressoir', 'preventive', 1, 'an', 'Révision avant vendanges : membrane, toiles, joints, programmes et sécurités ; essai de fonctionnement.', { avantVendanges: true, intervenant: 'Constructeur ou interne' }),
  PM('pm_pompes', 'Pompes à vin', 'pompe', 'preventive', 1, 'an', 'Rotor ou pistons, joints et garnitures ; essai de fonctionnement.'),
  PM('pm_tuyaux', 'Tuyaux et raccords vinicoles', '', 'preventive', 1, 'an', 'Recherche de fuites, état intérieur (fissures, dépôts) ; remplacer ce qui est abîmé.'),
  PM('pm_agitateurs', 'Agitateurs', 'agitat', 'preventive', 1, 'an', 'Essai de fonctionnement, étanchéité.'),
  PM('pm_froid', 'Groupe froid et thermorégulation', 'froid', 'reglementaire', 1, 'an', 'Entretien et contrôle d’étanchéité du circuit frigorifique (obligatoire selon la charge en fluide).', { intervenant: 'Frigoriste' }),
  PM('pm_filtres', 'Filtres', 'filtre', 'preventive', 1, 'an', 'Joints, plaques, membranes et manomètres selon le constructeur.'),
  PM('pm_co2', 'Détection et extraction du CO₂', 'co2', 'preventive', 1, 'an', 'Essai des détecteurs et de l’extracteur (sécurité du personnel en cuverie).', { intervenant: 'Prestataire' }),
  PM('pm_bascule', 'Bascule et balances', 'bascule|balance', 'reglementaire', 1, 'an', 'Vérification périodique par un organisme agréé (vignette verte).', { avantVendanges: true, intervenant: 'Organisme agréé' }),
  PM('pm_instruments', 'Instruments de mesure (thermomètres, réfractomètre, densimètres, pH-mètre)', '', 'preventive', 1, 'an', 'Vérification ou étalonnage avant les vendanges.', { avantVendanges: true }),
  PM('pm_extincteurs', 'Extincteurs', '', 'reglementaire', 1, 'an', 'Vérification annuelle par un organisme agréé (registre de sécurité).', { intervenant: 'Organisme agréé' }),
  PM('pm_levage', 'Chariots élévateurs et équipements de levage', '', 'reglementaire', 6, 'mois', 'Vérification générale périodique.', { intervenant: 'Organisme agréé' }),
  PM('pm_remueurs', 'Gyropalettes et remueurs', 'remu|gyro', 'preventive', 1, 'an', 'Vérifications et maintenance courante.'),
  PM('pm_tirage', 'Tireuse et ligne de dégorgement', 'tireuse|degorg', 'preventive', 1, 'an', 'Maintenance avant la campagne de tirage ou de dégorgement (souvent par le prestataire).', { intervenant: 'Prestataire' }),
  PM('pm_nettoyage', 'Nettoyeur haute pression et laveuse de caisses', '', 'preventive', 1, 'an', 'Entretien courant (buses, joints, filtres) ; essai avant vendanges.', { avantVendanges: true }),
];

/* ---------- plan en vigueur ---------- */
const planNettoyage = (db) => (db && Array.isArray(db.planNettoyage) ? db.planNettoyage : []);
const planMaintenance = (db) => (db && Array.isArray(db.planMaintenance) ? db.planMaintenance : []);
const planHygieneActif = (db) => !(db && db.settings && db.settings.planHygieneActif === false);
// le rejeu complet (getR) relève les vidanges et remplissages seulement si les plans servent (module Hygiène actif, plans actifs)
const hygEvenementsUtiles = (db) => planHygieneActif(db) && (typeof moduleActif !== 'function' || moduleActif(db, 'hygiene'));
const planDepuis = (db, today) => { const d = db && db.settings && db.settings.planHygieneDepuis; return isoOK(d) ? d : today || todayISO(); };
const nomContenant = (db, id) => (((db && db.contenants) || []).find((c) => c.id === id) || {}).nom || '—';
const locauxDe = (db) => (db && db.lists && Array.isArray(db.lists.locaux) ? db.lists.locaux : []);
const localNom = (db, id) => (locauxDe(db).find((x) => x.id === id) || {}).label || id || '';
const hygCibleNom = (db, type, id) => (type === 'contenant' ? nomContenant(db, id) : type === 'local' ? localNom(db, id) : lbl(db, 'equipements', id));
// cibles concrètes d'une ligne du plan : contenants (par type ou choisis), équipements (choisis ou d'après un mot du nom), locaux
function hygCibles(db, cible) {
  const c = cible || {}; const ids = Array.isArray(c.ids) ? c.ids.filter(Boolean) : [];
  if (c.type === 'contenants') { const F = Array.isArray(c.formes) ? c.formes : []; return (db.contenants || []).filter((x) => x.statut !== 'archive' && (ids.length ? ids.includes(x.id) : !F.length || F.includes(x.type))).map((x) => ({ type: 'contenant', id: x.id, nom: x.nom })); }
  if (c.type === 'equipements') { let re = null; try { re = c.motCle ? new RegExp(plier(c.motCle)) : null; } catch (e) { re = null; } return ((db.lists && db.lists.equipements) || []).filter((x) => (ids.length ? ids.includes(x.id) : re ? re.test(plier(x.label || '')) : false)).map((x) => ({ type: 'equipement', id: x.id, nom: x.label })); }
  if (c.type === 'locaux') return locauxDe(db).filter((x) => !ids.length || ids.includes(x.id)).map((x) => ({ type: 'local', id: x.id, nom: x.label }));
  return [];
}
const hygCibleTexte = (db, cible) => { const L = hygCibles(db, cible); return L.length ? L.map((x) => x.nom).join(', ') : 'aucune cible trouvée'; };

/* ---------- ce qui s'est passé : événements des contenants, usages du matériel, jours de vendange ---------- */
const _hygEv = new WeakMap();
function hygEvenements(db) {
  if (_hygEv.has(db)) return _hygEv.get(db);
  const R0 = getR(db); const R = R0.evts ? R0 : replay(db, null, { evenements: true }); const ev = { R, evts: R.evts || [], usages: hygUsagesMateriel(db, R), jours: hygJoursVendange(db) };
  _hygEv.set(db, ev); return ev;
}
// usages du matériel : pressoir des marcs, équipements nommés dans les opérations ; revendication de ce qui y est passé
function hygUsagesMateriel(db, R) {
  const U = {}; const add = (eid, op, qs) => { if (!eid) return; (U[eid] = U[eid] || []).push({ date: op.date, opId: op.id, type: op.type, qualifs: uniq(qs.filter(Boolean)) }); };
  [...(db.ops || [])].sort(byDate).forEach((op) => {
    if (op.type === 'pressurage') add(op.equipementId, op, [(op.parentSpec || {}).qualifId || minQualif((op.charges || []).map((c) => ((db.ops || []).find((a) => a.id === c.apportId) || {}).qualifId).filter(Boolean))]);
    (Array.isArray(op.equipementIds) ? op.equipementIds : []).forEach((eid) => add(eid, op, (R.opsByLot ? Object.keys(R.opsByLot).filter((l) => R.opsByLot[l].includes(op.id)).map((l) => (R.lots[l] || {}).qualif) : [])));
  });
  return U;
}
// jours de vendange : jours où l'on a pesé ou pressé
const hygJoursVendange = (db) => uniq((db.ops || []).filter((o) => o.type === 'apport' || o.type === 'pressurage').map((o) => o.date).filter(isoOK)).sort();
// entrées du journal d'hygiène par cible (triées par date)
function hygIndex(db) { const I = {}; (db.hygiene || []).forEach((h) => { if (!h || !isoOK(h.date)) return; (I[`${h.cibleType}:${h.cibleId}`] = I[`${h.cibleType}:${h.cibleId}`] || []).push(h); }); Object.values(I).forEach((L) => L.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))); return I; }
const hygFait = (I, cle, actionId, d1, d2) => (I[cle] || []).find((h) => hygSatisfait(actionId, h.actionId) && (!d1 || h.date >= d1) && (!d2 || h.date <= d2)) || null;
const hygDernier = (I, cle, actionId) => { const L = (I[cle] || []).filter((h) => hygSatisfait(actionId, h.actionId)); return L.length ? L[L.length - 1] : null; };
const rangMin = (qs) => { const r = (qs || []).map((q) => rang(q)).filter((x) => x > 0); return r.length ? Math.min(...r) : 0; };
// nom de l'action tel qu'il est dans la liste (« Rinçage ») : les messages le placent là où la majuscule va de soi, ce qui permet de
// les traduire (motifs) sans élision « de / d’ » ni accord
const actionNom = (db, id) => lbl(db, 'actionsHygiene', id) || '';

/* ---------- tâches et alertes du plan de nettoyage ---------- */
// → [{ cle, origine: 'nettoyage', etat: 'retard' | 'afaire' | 'nonconforme', entreeId, cible { type, id }, actionId, date, echeance, msg, opId, revendication { de, vers } }]
function hygTaches(db, today, E) {
  const t = today || todayISO(); if (!planHygieneActif(db)) return [];
  const depuis = planDepuis(db, t); const ev = E || hygEvenements(db); const I = hygIndex(db); const out = [];
  const vides = (cid) => (ev.R.contVol[cid] || 0) <= 0.5;
  const jours = ev.jours.filter((d) => d >= depuis && d <= t); const annee = yearOf(t);
  const anneeJ = ev.jours.filter((d) => yearOf(d) === annee); const premierJ = anneeJ[0] || ''; const dernierJ = anneeJ[anneeJ.length - 1] || '';
  const camp = (typeof campOf === 'function' ? campOf(db, t) : null) || null;
  const opsCamp = (type) => (db.ops || []).filter((o) => o.type === type && (!camp || (o.date >= camp.debut && o.date <= camp.fin)) && o.date <= t).sort(byDate);
  const push = (e, x) => out.push({ origine: 'nettoyage', entreeId: e.id, actionId: e.actionId, libelle: e.libelle, ...x });
  for (const e of planNettoyage(db)) {
    if (!e || e.actif === false || e.enregistrer === false || !e.actionId) continue;
    const C = hygCibles(db, e.cible); const act = actionNom(db, e.actionId);
    for (const q of Array.isArray(e.quand) ? e.quand : []) {
      if (!q || !q.type) continue;
      for (const c of C) {
        const k = `${c.type}:${c.id}`; const base = { cible: { type: c.type, id: c.id } };
        if (q.type === 'vidange' && c.type === 'contenant' && vides(c.id)) {
          const V = ev.evts.filter((x) => x.contenantId === c.id && x.date >= depuis && x.date <= t); const last = V[V.length - 1];
          if (last && last.type === 'vidange' && !hygFait(I, k, e.actionId, last.date)) { const d = Math.max(0, num(q.delai == null ? 1 : q.delai)); push(e, { ...base, cle: `pn:${e.id}:vid:${c.id}:${last.opId}`, etat: daysBetween(last.date, t) > d ? 'retard' : 'afaire', date: last.date, echeance: addDays(last.date, d), opId: last.opId, msg: `${c.nom} — ${act} à faire (vidange du ${fmtDate(last.date)}).` }); }
        }
        if ((q.type === 'avantRemplissage' || q.type === 'changementRevendication') && c.type === 'contenant') {
          ev.evts.filter((x) => x.type === 'remplissage' && x.contenantId === c.id && x.date >= depuis && x.date <= t && daysBetween(x.date, t) <= 120).forEach((x) => {
            if (q.type === 'avantRemplissage') { const j = Math.max(1, Math.ceil(num(q.heures || 24) / 24)); if (!hygFait(I, k, e.actionId, addDays(x.date, -j), x.date)) push(e, { ...base, cle: `pn:${e.id}:remp:${c.id}:${x.opId}`, etat: 'nonconforme', date: x.date, opId: x.opId, msg: `${c.nom} — remplissage du ${fmtDate(x.date)} sans « ${act} » au journal dans les ${num(q.heures || 24)} h précédentes.` }); }
            else if (x.avant.length && rangMin(x.qualifs) > rangMin(x.avant) && !hygFait(I, k, e.actionId, x.depuisVidange || addDays(x.date, -365), x.date)) {
              const de = minQualif(x.avant); const vers = minQualif(x.qualifs);
              push(e, { ...base, cle: `pn:${e.id}:rev:${c.id}:${x.opId}`, etat: 'nonconforme', date: x.date, opId: x.opId, revendication: { de, vers }, msg: `${c.nom} — ${qLabel(de)} puis ${qLabel(vers)} le ${fmtDate(x.date)}, sans « ${act} » au journal entre les deux.` });
            }
          });
        }
        if (q.type === 'changementRevendication' && c.type === 'equipement') {
          const U = (ev.usages[c.id] || []).filter((u) => u.qualifs.length);
          U.forEach((u, i) => { const p = U[i - 1]; if (!p || u.date < depuis || u.date > t || daysBetween(u.date, t) > 120) return; if (rangMin(u.qualifs) > rangMin(p.qualifs) && !hygFait(I, k, e.actionId, p.date, u.date)) { const de = minQualif(p.qualifs); const vers = minQualif(u.qualifs); push(e, { ...base, cle: `pn:${e.id}:rev:${c.id}:${u.opId}`, etat: 'nonconforme', date: u.date, opId: u.opId, revendication: { de, vers }, msg: `${c.nom} — ${qLabel(de)} puis ${qLabel(vers)} le ${fmtDate(u.date)}, sans « ${act} » au journal entre les deux.` }); } });
        }
        if (q.type === 'apresOp' && c.type === 'equipement') {
          const T = Array.isArray(q.ops) && q.ops.length ? q.ops : ['pressurage']; const parJour = {};
          (ev.usages[c.id] || []).filter((u) => T.includes(u.type) && u.date >= depuis && u.date <= t && daysBetween(u.date, t) <= 14).forEach((u) => { parJour[u.date] = u; });
          Object.values(parJour).forEach((u) => { if (!hygFait(I, k, e.actionId, u.date, addDays(u.date, 1))) push(e, { ...base, cle: `pn:${e.id}:op:${c.id}:${u.date}`, etat: u.date < t ? 'retard' : 'afaire', date: u.date, opId: u.opId, msg: `${c.nom} — ${act} après l’utilisation du ${fmtDate(u.date)}.` }); });
        }
        if (q.type === 'periodique') {
          if (q.siVide && c.type === 'contenant' && !vides(c.id)) continue;
          const n = Math.max(1, Math.round(num(q.jours) || 7));
          if (q.pendantVendanges && !jours.some((d) => daysBetween(d, t) <= n)) continue;
          const L = hygDernier(I, k, e.actionId); const b = L && L.date > depuis ? L.date : depuis; const ech = addDays(b, n);
          if (t >= addDays(ech, -1)) push(e, { ...base, cle: `pn:${e.id}:per:${c.id}:${ech}`, etat: t > ech ? 'retard' : 'afaire', date: L ? L.date : '', echeance: ech, msg: L ? `${c.nom} — ${act} tous les ${n} jours (dernier le ${fmtDate(L.date)}).` : `${c.nom} — ${act} tous les ${n} jours.` });
        }
        if (q.type === 'vendangesSoir') {
          jours.filter((d) => daysBetween(d, t) <= 14).forEach((d) => { if (!hygFait(I, k, e.actionId, d, addDays(d, 1))) push(e, { ...base, cle: `pn:${e.id}:soir:${c.id}:${d}`, etat: d < t ? 'retard' : 'afaire', date: d, echeance: d, msg: d < t ? `${c.nom} — pas de « ${act} » au journal le soir du ${fmtDate(d)} (jour de vendange).` : `${c.nom} — ${act} ce soir (jour de vendange).` }); });
        }
        if (q.type === 'avantVendanges') {
          if (c.type === 'contenant' && !vides(c.id)) continue;
          const debut = `${annee}-06-01`; const ouvert = !premierJ ? t >= `${annee}-08-01` : premierJ >= depuis && t <= addDays(premierJ, 7);
          if (ouvert && !hygFait(I, k, e.actionId, debut, premierJ || t)) push(e, { ...base, cle: `pn:${e.id}:av:${c.id}:${annee}`, etat: premierJ ? 'retard' : 'afaire', date: premierJ || '', msg: premierJ ? `${c.nom} — pas de « ${act} » au journal avant les vendanges (commencées le ${fmtDate(premierJ)}).` : `${c.nom} — ${act} avant les vendanges.` });
        }
        if (q.type === 'apresVendanges') {
          if (dernierJ && dernierJ >= depuis && t >= addDays(dernierJ, 10) && t <= addDays(dernierJ, 60) && !hygFait(I, k, e.actionId, dernierJ)) push(e, { ...base, cle: `pn:${e.id}:ap:${c.id}:${annee}`, etat: t > addDays(dernierJ, 30) ? 'retard' : 'afaire', date: dernierJ, echeance: addDays(dernierJ, 30), msg: `${c.nom} — ${act} après les vendanges (dernier jour le ${fmtDate(dernierJ)}).` });
        }
        if (q.type === 'avantAssemblages') {
          const A = opsCamp('assemblage').filter((o) => o.date >= depuis);
          if (c.type === 'contenant') A.filter((o) => o.destId === c.id && daysBetween(o.date, t) <= 60).forEach((o) => { if (!hygFait(I, k, e.actionId, addDays(o.date, -30), o.date)) push(e, { ...base, cle: `pn:${e.id}:aa:${c.id}:${o.id}`, etat: 'nonconforme', date: o.date, opId: o.id, msg: `${c.nom} — assemblage reçu le ${fmtDate(o.date)} sans « ${act} » au journal dans les 30 jours précédents.` }); });
          else if (A.length && daysBetween(A[0].date, t) <= 14 && !hygFait(I, k, e.actionId, addDays(A[0].date, -30), A[0].date)) push(e, { ...base, cle: `pn:${e.id}:aa:${c.id}:${A[0].id}`, etat: 'retard', date: A[0].date, opId: A[0].id, msg: `${c.nom} — ${act} avant les assemblages (premier assemblage le ${fmtDate(A[0].date)}).` });
        }
        if (q.type === 'apresAssemblages' || q.type === 'apresTirage') {
          const T = opsCamp(q.type === 'apresTirage' ? 'tirage' : 'assemblage').filter((o) => o.date >= depuis && t >= addDays(o.date, 3) && t <= addDays(o.date, 60));
          const sources = (o) => (o.sources || []).map((s) => (ev.R.pinfo[s.portionId] || {}).contenantId).filter(Boolean);
          const derniere = T[T.length - 1]; const apres = (o) => (q.type === 'apresTirage' ? `${c.nom} — ${act} après le tirage du ${fmtDate(o.date)}.` : `${c.nom} — ${act} après l’assemblage du ${fmtDate(o.date)}.`);
          if (c.type === 'contenant') { const o = [...T].reverse().find((x) => sources(x).includes(c.id)); if (o && vides(c.id) && !hygFait(I, k, e.actionId, o.date)) push(e, { ...base, cle: `pn:${e.id}:${q.type}:${c.id}:${o.id}`, etat: t > addDays(o.date, 30) ? 'retard' : 'afaire', date: o.date, opId: o.id, msg: apres(o) }); }
          else if (derniere && !hygFait(I, k, e.actionId, derniere.date)) push(e, { ...base, cle: `pn:${e.id}:${q.type}:${c.id}:${derniere.id}`, etat: t > addDays(derniere.date, 30) ? 'retard' : 'afaire', date: derniere.date, opId: derniere.id, msg: apres(derniere) });
        }
      }
    }
  }
  const vu = new Set(); return out.filter((x) => { if (vu.has(x.cle)) return false; vu.add(x.cle); return true; });
}

/* ---------- plan de maintenance : échéances ---------- */
const maintFreqTexte = (f) => (f && num(f.n) > 0 ? `${fmt(num(f.n))} ${hygLib(MAINT_UNITES, f.unite || 'an')}` : '—');
const maintAjout = (d, f) => { const n = Math.max(1, Math.round(num(f && f.n) || 1)); const u = (f && f.unite) || 'an'; if (u === 'an' || u === 'mois') { const [y, m, j] = d.split('-').map(Number); const mm = m - 1 + (u === 'an' ? 12 * n : n); const dt = new Date(Date.UTC(y + Math.floor(mm / 12), ((mm % 12) + 12) % 12, 1)); const fin = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)).getUTCDate(); return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(Math.min(j, fin)).padStart(2, '0')}`; } return addDays(d, n * (u === 'semaine' ? 7 : 1)); };
const maintEquipements = (db, e) => hygCibles(db, { type: 'equipements', ids: e.equipementIds, motCle: e.motCle });
// dernière intervention faite (journal de maintenance, sinon date connue avant Œnotrack) et prochaine échéance
function maintEtat(db, e, today) {
  const t = today || todayISO(); const J = (db.maintenance || []).filter((m) => m && m.entreeId === e.id && m.statut !== 'ouverte' && isoOK(m.date) && m.type !== 'curative').sort((a, b) => (a.date < b.date ? 1 : -1));
  const derniere = J[0] ? J[0].date : isoOK(e.derniere) ? e.derniere : ''; const echeance = derniere && e.frequence && num(e.frequence.n) > 0 ? maintAjout(derniere, e.frequence) : '';
  const etat = !derniere ? 'inconnue' : echeance && t > echeance ? 'retard' : echeance && daysBetween(t, echeance) <= 30 ? 'bientot' : 'ok';
  return { derniere, echeance, etat, interventions: J };
}
// → tâches : préventive ou réglementaire échue, révision avant vendanges, panne signalée, vignette de la bascule
function maintTaches(db, today, E) {
  const t = today || todayISO(); if (!planHygieneActif(db)) return []; const out = []; const annee = yearOf(t);
  const ev = E || null; const jours = ev ? ev.jours : hygJoursVendange(db); const premierJ = jours.find((d) => yearOf(d) === annee) || '';
  for (const e of planMaintenance(db)) {
    if (!e || e.actif === false) continue; const s = maintEtat(db, e, t);
    if (s.etat === 'retard' || s.etat === 'bientot') out.push({ origine: 'maintenance', cle: `pm:${e.id}:${s.echeance}`, entreeId: e.id, etat: s.etat === 'retard' ? 'retard' : 'afaire', date: s.derniere, echeance: s.echeance, libelle: e.libelle, msg: s.etat === 'retard' ? `${e.libelle} — maintenance en retard (${hygLib(MAINT_TYPES, e.type)}, échéance le ${fmtDate(s.echeance)}).` : `${e.libelle} — maintenance à prévoir (${hygLib(MAINT_TYPES, e.type)}, échéance le ${fmtDate(s.echeance)}).` });
    if (e.avantVendanges && !premierJ && t >= `${annee}-07-15` && !(s.derniere && s.derniere >= `${annee}-01-01`)) out.push({ origine: 'maintenance', cle: `pm:${e.id}:av:${annee}`, entreeId: e.id, etat: 'afaire', libelle: e.libelle, msg: `${e.libelle} — vérification avant les vendanges.` });
  }
  (db.maintenance || []).filter((m) => m && m.statut === 'ouverte').forEach((m) => { const e = planMaintenance(db).find((x) => x.id === m.entreeId); const nom = m.equipementId ? lbl(db, 'equipements', m.equipementId) : (e && e.libelle) || m.libelle || 'Matériel'; out.push({ origine: 'maintenance', cle: `pm:panne:${m.id}`, interventionId: m.id, entreeId: m.entreeId || '', etat: daysBetween(m.date, t) > 7 ? 'retard' : 'afaire', date: m.date, libelle: nom, msg: m.probleme ? `${nom} — panne signalée le ${fmtDate(m.date)}, intervention à faire : ${m.probleme}` : `${nom} — panne signalée le ${fmtDate(m.date)}, intervention à faire.` }); });
  if (typeof balancesDe === 'function') balancesDe(db).filter((b) => isoOK(b.valideJusquau)).forEach((b) => { const d = daysBetween(t, b.valideJusquau); if (d <= 30) out.push({ origine: 'maintenance', cle: `pm:vignette:${b.id}:${b.valideJusquau}`, etat: d < 0 ? 'retard' : 'afaire', echeance: b.valideJusquau, libelle: b.nom, msg: d < 0 ? `${b.nom} — vérification périodique expirée (vignette valable jusqu’au ${fmtDate(b.valideJusquau)}).` : `${b.nom} — vérification périodique à renouveler (vignette valable jusqu’au ${fmtDate(b.valideJusquau)}).` }); });
  return out;
}
// toutes les tâches à jour (non-conformités déjà justifiées retirées), les plus urgentes d'abord
const HYG_ORDRE = { nonconforme: 0, retard: 1, afaire: 2 };
function planTaches(db, today) {
  const t = today || todayISO(); const E = hygEvenements(db); const acq = new Set((db.hygieneAcquits || []).map((a) => a && a.id));
  return [...hygTaches(db, t, E), ...maintTaches(db, t, E)].filter((x) => !acq.has(x.cle)).sort((a, b) => (HYG_ORDRE[a.etat] - HYG_ORDRE[b.etat]) || String(b.date || '').localeCompare(String(a.date || '')) || String(a.msg).localeCompare(String(b.msg)));
}

/* ---------- contrôles à la saisie d'une opération (avant d'enregistrer) ---------- */
// spec : opération en cours de saisie ; → [{ tone, msg, faire { cibleType, cibleId, actionId, planId, changementRevendication } }]
// pre : aperçu déjà calculé par le formulaire (previewOp : base simulée, rejeu avec événements, n° de l'opération) ; sinon simulé ici
// (opSave en aperçu : lots créés comme à l'enregistrement, donc revendication du contenu connue)
function hygControlesSaisie(db, spec, editId, today, pre) {
  if (!spec || !planHygieneActif(db) || !isoOK(spec.date)) return [];
  let R; let id;
  if (pre && pre.R && pre.R.evts && pre.opId) { R = pre.R; id = pre.opId; }
  else { try { const d = clone(db); const { id: x0, ...sp } = spec; const r = opSave(d, sp, editId || null, { apercu: true }); if (!r.ok) return []; id = r.op.id; R = replay(d, null, { evenements: true }); } catch (e) { return []; } }
  const evts = (R.evts || []).filter((x) => x.opId === id); const I = hygIndex(db); const out = [];
  evts.filter((x) => x.type === 'remplissage').forEach((x) => {
    planNettoyage(db).filter((e) => e && e.actif !== false && e.actionId && hygCibles(db, e.cible).some((c) => c.type === 'contenant' && c.id === x.contenantId)).forEach((e) => {
      const k = `contenant:${x.contenantId}`; const nom = nomContenant(db, x.contenantId); const act = actionNom(db, e.actionId);
      (e.quand || []).forEach((q) => {
        if (q.type === 'avantRemplissage') { const j = Math.max(1, Math.ceil(num(q.heures || 24) / 24)); const L = hygDernier(I, k, e.actionId); if (!hygFait(I, k, e.actionId, addDays(x.date, -j), x.date)) out.push({ tone: 'warn', msg: L ? `${nom} — ${act} à faire avant le remplissage (dernier le ${fmtDate(L.date)}).` : `${nom} — ${act} à faire avant le remplissage.`, faire: { cibleType: 'contenant', cibleId: x.contenantId, actionId: e.actionId, planId: e.id } }); }
        if (q.type === 'changementRevendication' && x.avant.length && rangMin(x.qualifs) > rangMin(x.avant) && !hygFait(I, k, e.actionId, x.depuisVidange || addDays(x.date, -365), x.date)) { const de = minQualif(x.avant); const vers = minQualif(x.qualifs); out.push({ tone: 'bad', msg: `${nom} — ${qLabel(de)} avant ce remplissage en ${qLabel(vers)} : ${act} (changement de revendication) à enregistrer d’abord.`, faire: { cibleType: 'contenant', cibleId: x.contenantId, actionId: e.actionId, planId: e.id, changementRevendication: { de, vers } } }); }
      });
    });
  });
  if (spec.type === 'pressurage' && spec.equipementId) {
    const qs = [(spec.parentSpec || {}).qualifId].filter(Boolean); const U = (hygUsagesMateriel(db, getR(db))[spec.equipementId] || []).filter((u) => u.opId !== editId && u.date <= spec.date && u.qualifs.length); const p = U[U.length - 1];
    if (p && qs.length && rangMin(qs) > rangMin(p.qualifs)) planNettoyage(db).filter((e) => e && e.actif !== false && (e.quand || []).some((q) => q.type === 'changementRevendication') && hygCibles(db, e.cible).some((c) => c.type === 'equipement' && c.id === spec.equipementId)).forEach((e) => {
      if (!hygFait(I, `equipement:${spec.equipementId}`, e.actionId, p.date, spec.date)) { const de = minQualif(p.qualifs); const vers = minQualif(qs); out.push({ tone: 'bad', msg: `${lbl(db, 'equipements', spec.equipementId)} — dernier marc en ${qLabel(de)}, celui-ci en ${qLabel(vers)} : ${actionNom(db, e.actionId)} (changement de revendication) à enregistrer d’abord.`, faire: { cibleType: 'equipement', cibleId: spec.equipementId, actionId: e.actionId, planId: e.id, changementRevendication: { de, vers } } }); }
    });
  }
  evts.filter((x) => x.type === 'vidange').forEach((x) => { const e = planNettoyage(db).find((y) => y && y.actif !== false && (y.quand || []).some((q) => q.type === 'vidange') && hygCibles(db, y.cible).some((c) => c.type === 'contenant' && c.id === x.contenantId)); if (e) out.push({ tone: 'info', msg: `${nomContenant(db, x.contenantId)} sera vide — ${actionNom(db, e.actionId)} à faire ensuite (plan de nettoyage).`, faire: { cibleType: 'contenant', cibleId: x.contenantId, actionId: e.actionId, planId: e.id } }); });
  const vu = new Set(); return out.filter((x) => { const k = x.msg; if (vu.has(k)) return false; vu.add(k); return true; });
}

/* ---------- enregistrement : plan de nettoyage, plan de maintenance, interventions, justifications ---------- */
const nvIdPlan = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
function planEntreeSave(db, s, id) {
  const libelle = String((s && s.libelle) || '').trim().slice(0, 120); if (!libelle) return fail('Indiquez ce qui est nettoyé (équipement, contenant ou local).');
  if (!s.actionId || !(db.lists.actionsHygiene || []).some((a) => a.id === s.actionId)) return fail('Choisissez l’action (rinçage, nettoyage, désinfection…).');
  const cible = s.cible && ['contenants', 'equipements', 'locaux'].includes(s.cible.type) ? { type: s.cible.type, ...(Array.isArray(s.cible.ids) && s.cible.ids.length ? { ids: s.cible.ids.filter(Boolean) } : {}), ...(Array.isArray(s.cible.formes) && s.cible.formes.length ? { formes: s.cible.formes.filter(Boolean) } : {}), ...(s.cible.motCle ? { motCle: String(s.cible.motCle).trim().slice(0, 60) } : {}) } : null;
  if (!cible) return fail('Choisissez la cible : contenants, équipements ou locaux.');
  const quand = (Array.isArray(s.quand) ? s.quand : []).filter((q) => q && HYG_QUAND.some((x) => x[0] === q.type)).map((q) => ({ type: q.type, ...(q.type === 'periodique' ? { jours: Math.max(1, Math.round(num(q.jours) || 7)), ...(q.siVide ? { siVide: true } : {}), ...(q.pendantVendanges ? { pendantVendanges: true } : {}) } : {}), ...(q.type === 'vidange' ? { delai: Math.max(0, Math.round(num(q.delai == null ? 1 : q.delai))) } : {}), ...(q.type === 'avantRemplissage' ? { heures: Math.max(1, Math.round(num(q.heures) || 24)) } : {}), ...(q.type === 'apresOp' ? { ops: (Array.isArray(q.ops) && q.ops.length ? q.ops : ['pressurage']).filter(Boolean) } : {}), ...(q.type === 'texte' ? { texte: String(q.texte || '').trim().slice(0, 200), ...(q.momentId ? { momentId: String(q.momentId).slice(0, 60) } : {}) } : {}) }));
  if (!quand.length) return fail('Indiquez quand le faire (au moins un moment).');
  const produits = (Array.isArray(s.produits) ? s.produits : []).filter((p) => p && (p.produitId || p.type)).map((p) => ({ ...(p.produitId ? { produitId: p.produitId } : { type: p.type }), ...(hasNum(p.conc) ? { conc: Math.round(num(p.conc) * 1000) / 1000, concUnite: p.concUnite || '%' } : {}) }));
  const T = (k, n) => String((s && s[k]) || '').trim().slice(0, n);
  const item = { zone: HYG_ZONES.some((z) => z[0] === s.zone) ? s.zone : 'autre', libelle, cible, actionId: s.actionId, quand, produits, mode: T('mode', 1200), contact: T('contact', 60), controle: HYG_CONTROLES.some((c) => c[0] === s.controle) ? s.controle : 'visuel', attendu: T('attendu', 60), enregistrement: T('enregistrement', 160), enregistrer: s.enregistrer !== false, responsable: T('responsable', 120), danger: HYG_DANGERS.some((x) => x[0] === s.danger) ? s.danger : 'biologique', actif: s.actif !== false };
  if (!Array.isArray(db.planNettoyage)) db.planNettoyage = [];
  if (id) { const x = db.planNettoyage.find((y) => y.id === id); if (!x) return fail('Ligne du plan introuvable.'); Object.assign(x, item); delete x.modele; return okr({ id }); } // champs inconnus (version plus récente) gardés
  const nid0 = nvIdPlan('pn'); db.planNettoyage.push({ id: nid0, ...item }); return okr({ id: nid0 });
}
function planEntreeDelete(db, id) { if (!(db.planNettoyage || []).some((x) => x.id === id)) return fail('Ligne du plan introuvable.'); db.planNettoyage = db.planNettoyage.filter((x) => x.id !== id); return okr(); }
// modèle d'origine : remplace le plan, ou ajoute seulement les lignes manquantes
function planModeleCharger(db, quoi, remplacer) {
  const M = quoi === 'maintenance' ? PLAN_MAINTENANCE_MODELE() : PLAN_NETTOYAGE_MODELE(); const k = quoi === 'maintenance' ? 'planMaintenance' : 'planNettoyage';
  if (remplacer || !Array.isArray(db[k])) db[k] = M; else M.forEach((x) => { if (!db[k].some((y) => y.id === x.id)) db[k].push(x); });
  return okr({ n: db[k].length });
}
function maintEntreeSave(db, s, id) {
  const libelle = String((s && s.libelle) || '').trim().slice(0, 120); if (!libelle) return fail('Indiquez le matériel concerné.');
  if (s.type === 'curative' || !MAINT_TYPES.some((x) => x[0] === s.type)) return fail('Type de maintenance : choisissez-le dans la liste (une réparation s’enregistre comme intervention).'); // types ajoutés (Hygiène › Listes) acceptés
  const n = Math.round(num(s.frequence && s.frequence.n)); if (!(n > 0)) return fail('Indiquez la fréquence (tous les combien).');
  if (s.derniere && !isoOK(s.derniere)) return fail('Date de la dernière intervention invalide.');
  const T = (k, m) => String((s && s[k]) || '').trim().slice(0, m);
  const item = { libelle, equipementIds: (Array.isArray(s.equipementIds) ? s.equipementIds : []).filter(Boolean), motCle: T('motCle', 60), annee: T('annee', 10), type: s.type, frequence: { n, unite: MAINT_UNITES.some((u) => u[0] === (s.frequence || {}).unite) ? s.frequence.unite : 'an' }, avantVendanges: !!s.avantVendanges, interventions: T('interventions', 800), enregistrement: T('enregistrement', 160), intervenant: T('intervenant', 120), derniere: isoOK(s.derniere) ? s.derniere : '', actif: s.actif !== false };
  if (!Array.isArray(db.planMaintenance)) db.planMaintenance = [];
  if (id) { const x = db.planMaintenance.find((y) => y.id === id); if (!x) return fail('Ligne du plan introuvable.'); Object.assign(x, item); delete x.modele; return okr({ id }); }
  const nid0 = nvIdPlan('pm'); db.planMaintenance.push({ id: nid0, ...item }); return okr({ id: nid0 });
}
function maintEntreeDelete(db, id) { if ((db.maintenance || []).some((m) => m.entreeId === id)) return fail('Des interventions sont enregistrées pour ce matériel : désactivez la ligne plutôt.'); db.planMaintenance = (db.planMaintenance || []).filter((x) => x.id !== id); return okr(); }
// intervention : faite (préventive, réglementaire ou réparation) ou panne signalée (curative ouverte)
function maintInterventionSave(db, s, id) {
  if (!isoOK(s.date)) return fail('Date invalide.'); if (isLocked(db, s.date) && !id) return fail('Cette date appartient à une campagne figée.');
  if (!MAINT_TYPES.some((x) => x[0] === s.type)) return fail('Type d’intervention inconnu.');
  if (!s.entreeId && !s.equipementId && !String(s.libelle || '').trim()) return fail('Indiquez le matériel concerné.');
  const statut = s.type === 'curative' && s.statut === 'ouverte' ? 'ouverte' : 'faite';
  if (statut === 'ouverte' && !String(s.probleme || '').trim()) return fail('Décrivez la panne ou le dysfonctionnement.');
  const ids = Array.isArray(s.operateurs) ? operateursValides(db, s.operateurs) : [];
  const T = (k, m) => String((s && s[k]) || '').trim().slice(0, m);
  const item = { date: s.date, entreeId: s.entreeId || '', equipementId: s.equipementId || '', libelle: T('libelle', 120), type: s.type, statut, probleme: T('probleme', 400), interventions: T('interventions', 800), intervenant: T('intervenant', 120), resultat: MAINT_RESULTATS.some((r) => r[0] === s.resultat) ? s.resultat : statut === 'ouverte' ? 'hors_service' : 'conforme', notes: T('notes', 600), ...(ids.length ? { operateurs: ids } : {}) };
  if (!Array.isArray(db.maintenance)) db.maintenance = [];
  if (id) { const x = db.maintenance.find((y) => y.id === id); if (!x) return fail('Intervention introuvable.'); Object.assign(x, item); if (!ids.length) delete x.operateurs; return okr({ id }); }
  const nid0 = nid(db, 'mt'); db.maintenance.push({ id: nid0, ...item }); return okr({ id: nid0 });
}
function maintInterventionDelete(db, id) { const x = (db.maintenance || []).find((y) => y.id === id); if (!x) return fail('Intervention introuvable.'); if (isLocked(db, x.date)) return fail('Intervention verrouillée (campagne figée).'); const docs = (db.docs || []).filter((d) => d.cible && d.cible.type === 'maintenance' && d.cible.id === id).map((d) => d.id); db.maintenance = db.maintenance.filter((y) => y.id !== id); if (docs.length) db.docs = db.docs.filter((d) => !docs.includes(d.id)); return okr({ docs }); }
// non-conformité vue et justifiée (motif obligatoire) : elle reste dans l'historique des justifications, plus dans les alertes
function hygAcquitter(db, cle, s) {
  const motif = String((s && s.motif) || '').trim().slice(0, 300); if (!cle) return fail('Alerte introuvable.'); if (!motif) return fail('Indiquez pourquoi (ex. nettoyage fait mais non enregistré, cuve neuve…).');
  if (!Array.isArray(db.hygieneAcquits)) db.hygieneAcquits = []; if (db.hygieneAcquits.some((a) => a.id === cle)) return okr();
  db.hygieneAcquits.push({ id: cle, date: (s && s.date) || todayISO(), par: (s && s.par) || '', motif, msg: String((s && s.msg) || '').slice(0, 300) }); return okr();
}
// réglages du plan : actif, mise en place
function planReglages(db, s) {
  if (s.depuis !== undefined) { if (!isoOK(s.depuis)) return fail('Date de mise en place invalide.'); db.settings.planHygieneDepuis = s.depuis; }
  if (s.actif !== undefined) db.settings.planHygieneActif = !!s.actif;
  return okr();
}
// entrée du journal proposée pour une tâche : cible, action, produits du plan (ceux de l'exploitation, du type demandé), ligne du plan
function hygPresetTache(db, x) {
  const e = x && x.entreeId ? planNettoyage(db).find((y) => y.id === x.entreeId) : null; const H = hygListe(db).filter((p) => !p.archive);
  const produits = e ? (e.produits || []).map((p) => { const d = p.produitId ? hygDef(db, p.produitId) : H.find((h) => h.type === p.type); return d ? { produitId: d.id, conc: hasNum(p.conc) ? String(p.conc).replace('.', ',') : '', quantite: '' } : null; }).filter(Boolean) : [];
  return { cibleType: x.cible ? x.cible.type : (x.cibleType || 'contenant'), cibleId: x.cible ? x.cible.id : (x.cibleId || ''), actionId: (e && e.actionId) || x.actionId || '', planId: e ? e.id : (x.planId || ''), ...(produits.length ? { produits } : {}), ...(x.revendication || x.changementRevendication ? { changementRevendication: x.revendication || x.changementRevendication } : {}), ...(e && e.controle && e.controle !== 'aucun' ? { controle: { type: e.controle, resultat: '', valeur: '' } } : {}) };
}
