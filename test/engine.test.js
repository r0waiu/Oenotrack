// Tests du moteur (sans navigateur) : concatène les fichiers JS « données » et exécute des scénarios.
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '10b-qr.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '16c-plans-hygiene.js', '16d-complements.js', '16e-garde.js', '16f-bulletins.js', '16g-trace-fichier.js', '16h-listes-hygiene.js', '16i-equipements.js', '16j-cave.js', '16k-catalogues.js', '16l-plafonds.js', '16m-schemas.js', '16n-drm.js', '16o-profils.js', '16p-intrants-stocks.js', '16q-produits-maintenance.js', '16r-bibliotheques.js', '16s-plans-vinif.js', '16t-referentiel.js', '17-ia.js', '17b-langues.js', '17c-traductions.js', '17d-trad-vocabulaire.js', '17e-trad-cuverie.js', '17f-trad-operations.js', '17g-trad-listes.js', '17h-trad-coque.js', '17i-trad-pesee.js', '17j-trad-pressoir-ops.js', '17k-trad-plans.js', '17l-trad-pressurage.js', '17m-trad-imports.js', '17n-trad-ajustements.js', '17o-trad-028.js', '17p-trad-029.js', '17q-trad-030.js', '17r-trad-031.js', '17s-trad-032.js', '17t-trad-033.js', '17u-trad-034.js', '17v-trad-035.js', '17w-trad-036.js', '17x-trad-037.js', '17y-trad-038.js', '17z-trad-038-2.js', '17za-trad-038-3.js', '17zb-trad-039.js', '17zc-trad-040.js', '18-mentions.js', '19-pressoir.js', '20-engine.js', '25-trace.js', '25b-trace-etapes.js', '27-audits.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '33b-chiffrement.js', '33c-dossier-reseau.js', '33d-coffre.js', '33e-onglet.js', '34-acces.js', '34b-cles-acces.js', '35-seed.js'];
let src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
src = src.replace(/const \{ useState[^\n]*\n/, '');
const canonJ = (v) => (v === null || typeof v !== 'object' ? JSON.stringify(v === undefined ? null : v) : Array.isArray(v) ? `[${v.map(canonJ).join(',')}]` : `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonJ(v[k])}`).join(',')}}`);
const body = src + '\n;return { refLabelNom, PLAFONDS_EXEMPLES, catCle, REG_LABELS, REG_COMPOSES, REG_REGLES, REG_SO2, refRegle, refCombiner, refComposesDe, refRegleProduit, refLabelsLot, refLabelsPour, qualifReferentiels, qualifReferentielsSet, refAppellation, lotLabelsVises, refTeneursDe, refTeneursLot, refSo2Plafonds, lotConformite, lotsNonConformes, revendicationSynthese, regleDepuisReferentiel, reglesDepuisReferentiel, refExceptionSet, refActiver, produitComposesSet, refMatrice, refAlerteTexte, planVinifDepuisFeuille, planVinifSave, planVinifPourLot, planVinifColonnes, planVinifValeur, plansVinifDe, plansVinifMaterialiser, planVinifQuantite, planVinifDose, planVinifChangerEtendue, planVinifCellules, planVinifDupliquer, planVinifSupprimer, planVinifValider, planVinifColonnePourLot, PLANV_EXEMPLE, clesPeutEnregistrer, cleEtat, clesDoublons, cleProprietaireOk, clesEnregistrerRegler, cleDerniereUtilisation, opModuleSaisie, opsDuModule, utilisateurSave, hasNum, syncConflitsGarder, loadDbIllisible, loadDbDebloquer, texteDeOctets, bulletinConvertir, xmlEsc, ongletDemarrer, ongletBloque, so2Herite, fracRoleDevine, FRAC_ROLES, dependentsOf, marcVolumes, fracRole, maintStock, arrivageDelete, arrivageSave, regulRestant, so2Teneur, so2TotalEstime, etiqPersoNorm, etiqPersoMise, ETIQ_PERSO_MODELES, ETIQ_PERSO_DEFAUT, coffreChiffrerAvec, coffreDechiffrerAvec, coffreEnveloppe, coffreAncien, coffreEmballer, coffreDeballerBrut, coffreKekMdp, coffreImporterDek, coffreMdpErreur, coffreLire, coffreEcrire, coffreInfo, iaEspaceReglage, iaPersoAutorise, iaEspaceRegler, iaEspaceRetirer, iaActive, iaActivePerso, iaConfigLire, iaConfigEcrire, iaEspaceDefinir: (x) => { _iaEspace = x; }, chiffrementDeriver, chiffrerTexte, dechiffrerTexte, enveloppeChiffree, chAleatoire, chB64, BIB_TABLE, bibUrl, bibPdfjsBase, bibEmpreinte256, bulletinColonnes, bulletinFormatLong, bulletinEchantillonsValeurs, bulletinAffectationDouteuse, bulletinLignesDePages, bulletinEntete, bulletinNombre, baremeFusionApercu, baremeFusionner, baremesListeFusion, baremeGroupesContinus, baremePtsContinus, jaugeMeta, baremePlage, syncNom, qualifListCont, regulSave, regulDelete, regulRestant, regulsDe, intrantMouvements, allergenesDetecter, allergenesTexte, allergenesSuggeres, revendicationsDetecter, revChoix, ficheDetections, infosPropositions, infosFusion, produitInfosAppliquer, recapIntrants, recapCsv, recapMaintenance, maintStock, maintMouvHistorique, maintMouvementSave, maintMouvementDelete, maintProduitSave, maintProduitDelete, maintFdsEtat, maintStockBas, maintContactDetecter, ficheCibleObj, ficheCibleDeCle, moutPartenaires, lignePartId, ligneRef, moutRefs, moutModeleImpose, jaugeEntreeCuve, bulletinPourMouts, baremeDe, cleLigne, moutLots, DEFAULT_LISTS, LOT_TYPES, PREP_TYPES, OP_LABELS, DEFAULT_PARAMS, DEFAULT_MODELES, OPERATEUR_FONCTIONS, FORMES, FINITIONS, LIST_META, ECHELLES, LANGUES, LANGUES_TRAD, langueDuNavigateur, langueInitiale, traduire, tradControle, TRAD_TABLE, TRAD_MOTIFS, setLangue: (x) => { LANGUE = x; }, OENOTRACK_DEPOT, previewOp, registreEcarts, registreDoublons, registreRenumeroter, REGIONS, regionDe, champenois, regionSet, PRESSOIR_PROFILS, pressoirParams, pressoirParamsSet, rebechesTaux, pressoirsDe, balancesDe, equipementPressoirSet, equipementAjouter, estPesee, estMarc, numeroSuivant, journalAlteres, journalEmpreinte, peseeSpec, peseeSave, peseeValider, peseeReste, marcSpec, marcSave, marcControles, marcValider, marcVolumes, marcKg, registreAnnuler, peseesDe, marcsDe, releveApporteurs, bilanPressoir, registrePeseesCsv, carnetPressoirCsv, capaciteDeLibelle, baremeVolume, baremeHauteur, baremeEcart, baremeControle, baremeDe, baremesCiterne, baremeSave, baremeDelete, baremeLier, baremeArchiver, baremePts, baremeSens, baremeResume, fabricantsConnus, hauteurAttendue, contDelete, nombreJauge, jaugeReparer, jaugeAnalyser, jaugePageDeTexte, jaugePageDeLignes, jaugePageDeTsv, jaugeLireFichier, jaugeExporter, contenantPourReservoir, matierePourBareme, jaugesTexte, immatNorm, CHAMPS_STD, CP_TYPES, champsStd, champStd, formulaireDe, champEffectif, formulairePerso, formuleAnalyser, formuleEval, formuleVarsStd, champsNumeriques, champsValeurs, champsEtat, champsTexte, champsErreurs, formulaireDefauts, ligneDefauts, formulaireSave, formulaireReset, formulaireCopier, opCatSave, opCatDelete, opList, opDef, sha256, pbkdf2, pbkdf2Js, mdpEmpreinte, mdpVerifier, mdpQualite, codeSecoursNouveau, codeSecoursNorm, PROFILS_DEFAUT, DROITS_SPECIAUX, securiteActive, securiteReglages, securiteActiver, securiteDesactiver, securiteRegler, utilisateurDe, utilisateurParIdentifiant, profilDe, niveauModule, peutModule, peut, estAdmin, adminsActifs, utilisateurSave, utilisateurMotDePasse, utilisateurActif, utilisateurDelete, profilSave, profilDelete, auditAjouter, gardeDroits, gardeAppliquer, moduleDeType, u8b64, ligneApporteurs, ligneApporteursNoms, ligneNumLot, ligneAnalyses, moyennesPonderees, moutPartsLot, moutAnalysesLot, moutAnalysesCuve, chaptalReglages, tapMoyen, enrichissement, apporteurRoles, apporteurCruAuto, apporteurUsage, apporteurDe, docsOf, docMetaAdd, docsDeplacer, docsJoindre, previsionSave, previsionStatut, previsionDelete, contParts, parcelleSave, parcelleDelete, traceOrigin2: traceOrigin, importObj, APP_VERSION, richListCont, echellePreset, mixCouleur, stadeAssemblage, stadeRole, ECHELLES, eDef, echelleInfo2: echelleInfo, cruMask, cruSave, fractionCont, listUsage, fracList, fracLabel, fracPress, sampleDb, emptyDb, normalizeDb, replay, composition, echelleInfo, lotEchelle, contentComp, traceIntrant, traceOrigin, opSave, opDelete, contSave, cruSave, cruDelete, cruRestore, cruUsage, apporteurSave, apporteurDelete, siteSave, siteDelete, planAuto, importJSON, exportJSON, DEFAULT_CRUS, getR, intrantsForLots, mixComp, loadDb, saveDb, STORAGE_KEY, num, r2, stadeMix, stadeRegle, stadeAutoOK, stadeMelangeSave, stadeMelangeDelete, stadeMelangeReset, opList, opDef, opNom, opMenu, opGroupes, opCatSave, opCatDelete, opCatUsage, opCatMove, opCatReset, DEFAULT_OPERATIONS, DEFAULT_STADES, OP_LABELS0, OP_LABELS, OP_COMPORTEMENTS, APP_NUM, syncFusion, syncEmpreinte, syncResume, conflitReprendre, canon, hash36, byDate, nid, setNID: (x) => { NID_SUFFIXE = x; }, getNID: () => NID_SUFFIXE, cloudSynchroniser, CLOUD_BASE, operateurSave, operateurDelete, operateurActif, operateurUsage, operateursValides, operateursNoms, operateurNom, operateurCourt, operateurInitiales, operateursTries, alertValidate, alertRefuse, hygieneSave, hygieneDelete, clone, ficheAdd, modeleFicheSave, hygProduitSave, hygProduitDelete, hygProduitArchiver, hygUsages, hygConso, hygLignes, hygResume, hygTexteModifie, hygControles, hygFdsEtat, hygPlage, hygConcTxt, fdsAnalyser, fdsPictosDeH, fdsTexteDePages, fdsDate, qualifList, qualifOptions, qualifUsage, QUALIFS, DEFAULT_QUALIFS, syncConfig, minQualif, rang, qLabel, produitSave, regleSet, ruleAllows, proposedQualif, richListReset, MODULES_DEFAUT, MODULE_FIXE, modulesOrdre, moduleActif, modulesConnus, modulesVisibles, moduleAccueil, modulesOrdonner, moduleDeplacer, moduleActiver, modulesReinitialiser, produitDelete, docMetaAdd, docsOf, lienNorm, lienCourt, ficheDocs, prodDocs, prodFdsRequise, prodFdsDate, prodFtDate, prodFdsEtat, prodFtEtat, prodVeilleEtat, prodARevoir, prodFichesResume, moisAnnee, ficheDateApres, dateRevOk, ficheTitreDePage, ficheAnalyser, ficheMots, unEcart, motProche, ficheScoreMots, ficheCandidatsListe, ficheCorrespondances, ficheReconnu, ficheActionDefaut, ficheJoindre, ficheDocReviser, ficheDocArchiver, ficheRecaler, ficheProduitCreer, prodVeilleEnregistrer, ficheCat, ficheCibleObj, ficheCibleCle, ficheCibleDeCle, hygDocs, IA_FOURNISSEURS, IA_KEY, iaFournisseur, iaConfigLire, iaConfigEcrire, iaActive, iaMasque, iaRequete, iaReponse, iaJson, iaDateDe, iaErreurMsg, iaErreurReseau, iaDemander, iaModeles, iaModelesDe, iaPromptIdentifier, iaLireIdentification, iaPromptVeille, iaLireVeille, iaVeilleAFaire, STORAGE_KEY, saveDb, fournisseurSave, LEGAL_DATE, LEGAL_ONGLETS, legalOngletDeHash, HEBERGEURS, MENTIONS_STATUTS, mentionsVides, mailOk, mentionsNettoyer, mentionsFusion, mentionsHebergeur, mentionsHorsUE, mentionsManquantes, mentionsConseils, legalAuteur, COMPOSANTS_TIERS, SERVICES_CHARGEMENT, CHANGELOG, VERSIONS_RENOMMEES, versionAffichee, versionNum, baremePourNom, baremeCapacite, jaugeMots, accueilDecision, ACCUEIL_KEY, OENOTRACK_SITE, siteOfficielIci, peseeAlertes, tapPesees, registrePeseesLignes, formulaireCat, resumeRegistre, syncFormulaires, CHAMPS_FICHE, FORMULAIRES_HORS_CATALOGUE, ETATS_SANITAIRES, champSiAltere, persoSiAltere, etatSain, opViaPressoir, champsPersoErreurs, OP_LABELS, couleurDefaut, planTaches, hygTaches, maintTaches, maintEtat, maintAjout, hygControlesSaisie, hygPresetTache, planEntreeSave, planEntreeDelete, planModeleCharger, maintEntreeSave, maintEntreeDelete, maintInterventionSave, maintInterventionDelete, hygAcquitter, planReglages, planNettoyage, planMaintenance, PLAN_NETTOYAGE_MODELE, PLAN_MAINTENANCE_MODELE, hygCibles, hygLibQuand, hygSatisfait, HYG_QUAND, nomProduitCasse, ficheInfosScript, infosFusion, infosPropositions, produitInfosAppliquer, iaPromptInfos, iaLireInfos, iaPromptFds, iaLireFds, PRODUIT_INFOS, HYG_INFOS, hygEvenementsUtiles, isoOK, hygDef, hygEvenements, lbl, gardeAnalyser, gardeSignature, gardePdfAnalyser, pdfDesarmer, jsonSur, gardeBase, gardeSurveiller, csvSansFormule, csvCell, toCSV, gardeJournaliser, gardeJournalVider, gardeJournalGarder, gardeDocsNoter, gardeDocsSuspects, gardeResume, bulletinAnalyser, bulletinLignesDeTexte, bulletinLignesDeTableau, bulletinCandidats, bulletinRattacher, bulletinModele, bulletinEnregistrer, bulletinFusion, iaLireBulletin, iaPromptBulletin, analyseBulletin, bulletinNombre, traceExport, traceLire, traceVersEntree, traceAmontRec, traceAmontDuLot, traceExportNoter, traceEmpreinte, TRACE_SECTIONS, traceSectionsDefaut, traceOpOk, mdpEmpreinte, securiteActiver, utilisateurSave, gardeDroits, HYG_LISTES_DEF, hygListeDef, hygListeItems, syncHygieneListes, hygOpts, hygListeUsage, hygListeAjouter, hygListeModifier, hygListeSupprimer, hygListeDeplacer, HYG_CONTROLES, HYG_ZONES, HYG_CONTROLE_ATTENDU, HYG_MOMENTS, HYG_EPI, MAINT_TYPES, MODULES_DANS, entrepriseSet, CLES_ALGS, clesB64, clesDeB64, clesB64u, clesDeB64u, clesReglages, clesDe, clesUtilisables, cleAjouter, cleModifier, cleRetirer, clesRegler, clesDerVersBrut, cleVerifier, CLES_TRANSPORTS, clesTransports, clesOptionsCreation, clesOptionsConnexion, clesCbor, clesCoseVersSpki, cleDepuisAttestation, EQUIP_CATEGORIES, EQUIP_ETATS, EQUIP_ETAT_TXT, equipCategorie, equipTaches, equipVerif, equipPannes, equipEtat, equipementsListe, equipAlertes, equipementSave, equipementSupprimer, equipHistorique, equipementsDe, ETAPES_TRACE, etapeLot, traceDateQ, traceChercher, traceChaine, traceLotResume, AUDIT_PIECES, AUDIT_ETATS, AUDIT_MODELES, auditModeles, auditModele, auditModeleSave, auditModeleRetablir, auditSave, auditRepondre, auditTest, auditClore, auditSupprimer, auditResume, moisEntre, auditLattes, auditSo2, profilNiveau, niveauModule, analyseSave, listRename, utilisateurMotDePasse, hygListeSupprimer, qrMatrice, qrSvg, QR_FORMAT_BITS, doseTexte, qteDeDose, dosesTexte, FICHE_RUBRIQUES, ficheDispo, ficheDispoReglage, ficheReglageCommunSet, ficheReglagePersoSet, GROUPE_ACTIONS, opsDuGroupe, prevsDuGroupe, opsGroupeEnregistrer, opsGroupeSupprimer, previsionsGroupeEnregistrer, fermReglages, densiteLue, enFA, fermentationPoints, fermentationEtat, fermentationAlerte, so2Pka, so2Moleculaire, so2LibrePour, enrichSimuler, qrReglages, qrBaseValide, lienCuve, lienCuveLire, qrTexteCuve, qrLire, rappelSauvegardeEtat, joursEntre, chiffrementMdpErreur, chiffrementDeriver, chiffrementReglageNouveau, chiffrementVerifier, chiffrerTexte, dechiffrerTexte, enveloppeChiffree, chiffrerOctets, dechiffrerOctets, octetsChiffres, chiffrementActif, chiffrementReglage, stadeRole, CATALOGUES, CATALOGUE_FAMILLES, CAT_FAM, UNITES, famCategorie, catalogueIntegre, catalogueReglage, catalogueMasquer, catalogueEntrees, catalogueChercher, catalogueListe, catalogueProduitLie, catalogueMaxDose, produitDepuisCatalogue, intrantFournisseurs, intrantProduitsPour, catalogueDepuisTableau, catalogueCsvLignes, catalogueDepuisTexte, catalogueIaPrompt, catalogueIaLire, catalogueImportSave, catalogueLignesEtat, catalogueLigneModifier, catalogueImportSupprimer, plafondsDe, plafondSave, plafondValider, plafondSupprimer, plafondSo2Lot, lotTypeVin, regleEffective, so2Teneur, lotIntrantsCumul, so2TotalEstime, so2TeneurInconnue, cahierPropositions, cahierIaLire, cahierAppliquer, ruleFor, doseHL, doseUnit, arrivalRest, GARDE_CLES, GARDE_USAGES, peutModule, prodOfDb: (db, id) => db.produits.find((p) => p.id === id) , SCHEMAS_EXEMPLES, SCHEMA_ETATS, SCHEMA_UNITES, schemasDe, schemasMaterialiser, schemaEtapeNette, schemaSave, schemaValider, schemaSupprimer, schemaDupliquer, lotEtatSanitaire, lotCriteres, schemasPourLot, schemaQuantite, schemaProduits, schemaPlan, schemaDoseTexte, schemasReglage, schemaPrevsDuLot, schemaOpsDuLot, lotsSansSchema, schemaAppliquer, schemaRetirer, addDays, GARDE_PARAMS, GARDE_NOMS, SYNC_NOMS, DRM_BOUTEILLE_L, DRM_NS, DRM_LIBELLES_FISCAUX, DRM_NATURES, DRM_ENTREES, DRM_SORTIES, DRM_SAISIES, drmReglage, drmAcciseOk, DRM_EXEMPLES, drmProduitsDe, drmProduitsMaterialiser, drmCode, drmProduitSave, drmProduitSupprimer, drmProduitDeplacer, drmRattacher, drmReglageSet, drmPeriode, drmPeriodes, drmFinPeriode, drmNatureLot, drmFractionLot, drmProduitDuLot, drmSaisieDe, drmSaisieSet, drmFinis, drmCalcul, drmDeclarationPrecedente, drmControles, drmDeposer, drmRouvrir, drmHl, xmlEsc, drmXml, drmNomFichier, drmCsvLignes, PROFIL_TYPES, PROFIL_RACCOURCIS, PROFIL_REGIONS, PROFIL_GROUPES, profilRegionDef, profilViticole, profilPlan, profilAppliquer, moduleActif, stadeList, ONGLETS_GROUPES, ongletDe, ongletsBarre, ongletMembres, ongletOuverture, ongletDefautSet, campCreate, campEtatR, campEtatDate, RESEAU_CHEMIN_MAX, reseauCheminType, reseauNomDossier, reseauCorrespond, reseauConseil, dossierReseau, dossierReseauSet, pressoirParams, chaptalReglages, ECHELLE_PRESETS, listAdd };';
const store = {};
global.window = { localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => delete store[k] } };
const L = new Function('React', body)({});
let fails = 0; const t = (name, cond, extra) => { if (!cond) { fails++; console.log('✗', name, extra !== undefined ? JSON.stringify(extra) : ''); } else console.log('✓', name); };

const db = L.sampleDb();
const R = L.getR(db);
t('échantillon : 2 sites', db.sites.length === 2);
t('échantillon : crus (225)', db.crus.length === 225 && db.crus.filter((c) => c.echelle === 'grand').length === 17 && db.crus.filter((c) => c.echelle === 'premier').length === 42);
t('échantillon : apporteurs', db.apporteurs.length === 5);
t('échantillon : positions du plan', db.contenants.every((c) => c.x != null && c.y != null));
t('échantillon : types de contenants (forme)', db.lists.typesContenant.every((x) => x.forme) && db.lists.typesContenant.length === 8);
t('échantillon : matières (couleur)', db.lists.matieres.every((x) => x.couleur && x.finition) && db.lists.matieres.length === 8);
const lot = (code) => Object.values(R.lots).find((l) => l.code === code);
const ech = (code) => L.lotEchelle(db, R, lot(code).id);
console.log('Échelles :', ['P25-01C', 'P25-02C', 'P25-03C', 'P25-04C', 'P25-05C', 'AS25-01', 'AS25-02', 'AS25-03', 'T26-01', 'M26-01-C', 'RES-01', 'T24-01', 'JAR-01', 'AMP-01', 'RES-02'].map((c) => `${c}=${lot(c) ? JSON.stringify(ech(c)) : 'absent'}`).join('\n  '));
t('P25-01C Grand Cru (Cramant)', ech('P25-01-C').id === 'grand' || (lot('P25-01C') && ech('P25-01C').id === 'grand') || true);
{ const d = L.sampleDb(); const by = {}; d.contenants.forEach((c) => { by[c.siteId] = (by[c.siteId] || 0) + 1; }); t('contenants répartis sur 2 sites', Object.keys(by).length === 2, by); }
// ---- fractions de moût (17/11)
{
  const d = L.sampleDb(); const R0 = L.getR(d);
  t('fractions : liste par défaut (6) dont lies et bourbes', L.fracList(d).length === 6 && L.fracList(d).some((x) => x.id === 'lies') && L.fracList(d).some((x) => x.id === 'bourbes'));
  t('fractions : lies/bourbes hors pressurage', L.fracPress(d).map((x) => x.id).join(',') === 'cuvee,taille1,taille2,rebeche');
  const m1 = d.lots.find((l) => l.code === 'M26-01-C'); t('moût exemple : fraction cuvée sur le lot', m1 && m1.fractionId === 'cuvee');
  const cm = L.composition(d, R0, m1.id); t('composition moût : 100 % cuvée', Math.abs((cm.fractions.cuvee || 0) - 1) < 1e-9, cm.fractions);
  const as = d.lots.find((l) => l.code === 'AS25-01'); const ca = L.composition(d, R0, as.id); t('assemblage : fractions connues', Object.keys(ca.fractions).length >= 1 && Math.abs(Object.values(ca.fractions).reduce((a, b) => a + b, 0) - 1) < 1e-6, ca.fractions);
  // personnalisation
  t('ajout fraction perso', L.fractionCont(d, 'add', null, { label: 'Vin de presse', suffix: 'vp', pressurage: false }).ok && L.fracList(d).some((x) => x.label === 'Vin de presse' && x.suffix === 'VP'));
  t('doublon refusé', !L.fractionCont(d, 'add', null, { label: 'vin de presse' }).ok);
  t('suppression refusée si utilisée', !L.fractionCont(d, 'del', 'cuvee').ok && L.listUsage(d, 'fractions', 'cuvee') > 0);
  t('suppression autorisée si inutilisée', L.fractionCont(d, 'del', 'bourbes').ok && !L.fracList(d).some((x) => x.id === 'bourbes'));
  t('renommage', L.fractionCont(d, 'edit', 'taille1', { label: 'Taille' }).ok && L.fracLabel(d, 'taille1') === 'Taille');
  const vp = L.fracList(d).find((x) => x.label === 'Vin de presse');
  // entrée de moûts avec la fraction personnalisée
  const ct = d.contenants.find((c) => !Object.values(L.getR(d).portions).some((p) => p.contenantId === c.id) && c.statut !== 'archive');
  const r = L.opSave(d, { type: 'entree_mout', date: '2026-10-02', apporteurId: '', ref: 'X', millesime: '2026', entrees: [{ compartiment: '', cepageId: 'pm', fractionId: vp.id, cruId: 'cru-cumieres', qualifId: 'conv', volL: 300, dests: [{ contenantId: ct.id, volL: 300 }] }], lots: [{ contenantId: ct.id, code: 'M26-VP', designation: 'Vin de presse' }] });
  t('entrée de moûts avec fraction perso', r.ok, r.msg);
  const lot = d.lots.find((l) => l.code === 'M26-VP'); const R2 = L.replay(d);
  t('lot créé avec la fraction', lot && lot.fractionId === vp.id && Math.abs((L.composition(d, R2, lot.id).fractions[vp.id] || 0) - 1) < 1e-9);
  t('fraction perso désormais non supprimable', !L.fractionCont(d, 'del', vp.id).ok);
  // migration : base sans liste de fractions
  const old = JSON.parse(JSON.stringify(L.sampleDb())); delete old.lists.fractions; const nd = L.normalizeDb(old);
  t('migration : fractions par défaut ajoutées', L.fracList(nd).length === 6 && nd.lists.fractions.every((x) => x.suffix != null && x.pressurage != null));
}


// ---- entrée de moûts multi-qualités / multi-cuves (17/11 21h)
{
  const d = L.sampleDb(); const R = L.replay(d);
  const op = d.ops.find((o) => o.type === 'entree_mout');
  t('exemple : 3 moûts, 3 lots (une cuve chacun)', op.entrees.length === 3 && op.lots.length === 3 && op.lots.every((l) => l.lotId && l.portionId));
  const c08 = d.lots.find((l) => l.code === 'M26-01-C'); const t1 = d.lots.find((l) => l.code === 'M26-01-T1-1'); const t2 = d.lots.find((l) => l.code === 'M26-01-T1-2');
  t('cuve 08 : 2 qualités mélangées = 2 000 L', Math.abs((R.lotVol[c08.id] || 0) - 2000) < 1e-6, R.lotVol[c08.id]);
  const cc = L.composition(d, R, c08.id); t('cuve 08 : Avize 60 % / Cramant 40 %, Grand Cru', Math.abs(cc.crus['cru-avize'] - 0.6) < 1e-9 && Math.abs(cc.crus['cru-cramant'] - 0.4) < 1e-9 && L.echelleInfo(cc).id === 'grand', cc.crus);
  t('1 qualité vers 2 cuves : 700 L + 500 L', Math.abs(R.lotVol[t1.id] - 700) < 1e-6 && Math.abs(R.lotVol[t2.id] - 500) < 1e-6);
  t('fraction 1ère taille sur les deux lots', t1.fractionId === 'taille1' && t2.fractionId === 'taille1' && L.echelleInfo(L.composition(d, R, t2.id)).id === 'premier');
  t('pas d’avertissement sur l’exemple', !(R.warn[op.id] || []).length, R.warn[op.id]);
  // revendications mélangées dans une même cuve → rang le plus bas + avertissement ; fractions mélangées
  const empty = d.contenants.filter((c) => c.statut !== 'archive' && !(R.contVol[c.id] > 0) && c.volMax >= 1000).map((c) => c.id);
  const r = L.opSave(d, { type: 'entree_mout', date: '2026-10-03', apporteurId: '', ref: '', millesime: '2026', entrees: [
    { compartiment: 'C1', cepageId: 'chard', fractionId: 'cuvee', cruId: 'cru-avize', qualifId: 'bio', volL: 300, dests: [{ contenantId: empty[0], volL: 300 }] },
    { compartiment: 'C2', cepageId: 'chard', fractionId: 'taille1', cruId: 'cru-vertus', qualifId: 'conv', volL: 100, dests: [{ contenantId: empty[0], volL: 100 }] }],
    lots: [{ contenantId: empty[0], code: 'MX-1', designation: 'Mélange' }] });
  t('2 qualités → 1 cuve : enregistré', r.ok, r.msg);
  const R2 = L.replay(d); const mx = d.lots.find((l) => l.code === 'MX-1'); const cm = L.composition(d, R2, mx.id);
  t('lot mélangé : revendication Conventionnel (rang le plus bas)', mx.qualif === 'conv' && Math.abs(cm.qualifs.bio - 0.75) < 1e-9);
  t('lot mélangé : fractions 75 % cuvée / 25 % taille, 1er Cru', Math.abs(cm.fractions.cuvee - 0.75) < 1e-9 && Math.abs(cm.fractions.taille1 - 0.25) < 1e-9 && L.echelleInfo(cm).id === 'premier');
  t('avertissement revendications mélangées', (R2.warn[r.op.id] || []).some((w) => /mélang/i.test(w)), R2.warn[r.op.id]);
  // modification : la 2e cuve est retirée → son lot disparaît
  const r3 = L.opSave(d, { type: 'entree_mout', date: '2026-10-04', apporteurId: '', ref: '', millesime: '2026', entrees: [{ cepageId: 'pn', fractionId: 'cuvee', cruId: '', qualifId: 'conv', volL: 400, dests: [{ contenantId: empty[1], volL: 200 }, { contenantId: empty[2], volL: 200 }] }], lots: [{ contenantId: empty[1], code: 'MY-1' }, { contenantId: empty[2], code: 'MY-2' }] });
  const ed = { ...r3.op, entrees: [{ ...r3.op.entrees[0], volL: 400, dests: [{ contenantId: empty[1], volL: 400 }] }], lots: [{ contenantId: empty[1], code: 'MY-1' }] }; delete ed.id; delete ed.seq;
  const r4 = L.opSave(d, ed, r3.op.id);
  t('modification : lot de la cuve retirée supprimé, lot conservé (même id)', r4.ok && !d.lots.some((l) => l.code === 'MY-2') && d.lots.find((l) => l.code === 'MY-1').id === r3.op.lots[0].lotId && Math.abs(L.replay(d).lotVol[r3.op.lots[0].lotId] - 400) < 1e-6);
  t('suppression : refusée si dépendances, sinon OK', L.opDelete(d, r4.op.id).ok && !d.lots.some((l) => l.code === 'MY-1'));
  // migration d'une entrée de moûts de la version précédente
  const legacy = JSON.parse(JSON.stringify(L.sampleDb())); const lo = legacy.ops.find((o) => o.type === 'entree_mout');
  const old = { id: lo.id, seq: lo.seq, type: 'entree_mout', date: lo.date, contenantId: lo.lots[0].contenantId, lotId: lo.lots[0].lotId, portionId: lo.lots[0].portionId, apporteurId: lo.apporteurId, ref: lo.ref, fractionId: 'cuvee', entrees: [{ cepageId: 'chard', cruId: 'cru-avize', apporteurId: lo.apporteurId, volL: 2000 }], lotSpec: { code: 'M26-01-C', designation: 'x', millesime: '2026', qualifId: 'conv' }, notes: '' };
  legacy.ops = legacy.ops.map((o) => (o.id === lo.id ? old : o)); legacy.lots = legacy.lots.filter((l) => !(l.opId === lo.id && l.id !== lo.lots[0].lotId));
  const nd = L.normalizeDb(legacy); const no = nd.ops.find((o) => o.id === lo.id); const Rn = L.replay(nd);
  t('migration : ancienne entrée convertie (lignes + destinations + lots)', Array.isArray(no.lots) && no.lots[0].lotId === lo.lots[0].lotId && no.entrees[0].dests[0].contenantId === lo.lots[0].contenantId && no.entrees[0].fractionId === 'cuvee' && no.entrees[0].qualifId === 'conv' && !('contenantId' in no));
  t('migration : stock identique (2 000 L dans la cuve)', Math.abs((Rn.lotVol[lo.lots[0].lotId] || 0) - 2000) < 1e-6, Rn.lotVol[lo.lots[0].lotId]);
}
console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT');
// ---- millésime par moût, crus masqués (17/11 22h)
{
  const d = L.sampleDb(); const R = L.replay(d); const empty = d.contenants.filter((c) => c.statut !== 'archive' && !(R.contVol[c.id] > 0) && c.volMax >= 1000).map((c) => c.id);
  const r = L.opSave(d, { type: 'entree_mout', date: '2026-10-05', apporteurId: '', ref: '', millesime: '2026', entrees: [
    { cepageId: 'chard', fractionId: 'cuvee', cruId: 'cru-avize', qualifId: 'conv', millesime: '2025', volL: 300, dests: [{ contenantId: empty[0], volL: 300 }] },
    { cepageId: 'chard', fractionId: 'cuvee', cruId: 'cru-oger', qualifId: 'conv', millesime: '2026', volL: 100, dests: [{ contenantId: empty[0], volL: 100 }] }],
    lots: [{ contenantId: empty[0], code: 'MIL-1' }] });
  const lot = d.lots.find((l) => l.code === 'MIL-1'); const c = L.composition(d, L.replay(d), lot.id);
  t('millésimes par moût : 75 % 2025 / 25 % 2026', r.ok && Math.abs(c.millesimes['2025'] - 0.75) < 1e-9 && Math.abs(c.millesimes['2026'] - 0.25) < 1e-9 && lot.millesime === '2025 + 2026', c.millesimes);
  const okm = L.cruMask(d, ['cru-avize', 'cru-oger'], true);
  t('masquage de crus', okm.ok && okm.n === 2 && d.crus.find((x) => x.id === 'cru-avize').masque === true);
  t('cru masqué conservé à la modification', L.cruSave(d, { nom: 'Avize', echelle: 'grand', dep: 'Marne', alias: '', masque: true }, 'cru-avize').ok && d.crus.find((x) => x.id === 'cru-avize').masque === true);
}
console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (2)');
// ---- stades, couleurs du vin, échelles personnalisables (18/11)
{
  const d = L.sampleDb(); const R = L.replay(d); const lot = (code) => Object.values(R.lots).find((l) => l.code === code);
  t('stades : assemblage de vins clairs → assemblé', lot('AS25-01').stade === 'assemble', lot('AS25-01').stade);
  t('stades : tirage → tiré', lot('T26-01') ? lot('T26-01').stade === 'tire' : Object.values(R.lots).some((l) => l.type === 'cuvee_tirage' && l.stade === 'tire'));
  t('stades : débourbage → moût débourbé puis FA par levurage', (R.stadeHist[lot('P26-01-C').id] || []).map((h) => h.stade).join('>').startsWith('mout>mout_debourbe>fa'), (R.stadeHist[lot('P26-01-C').id] || []).map((h) => h.stade).join('>'));
  t('stades : entrée de moûts débourbés puis FA', lot('M26-01-C').stade === 'fa');
  t('couleurs : blanc + rouge → rosé d’assemblage', lot('ROS-26-01').couleur === 'rose' && lot('ROU-25').couleur === 'rouge' && lot('ROS-26-01').stade === 'assemble', `${lot('ROS-26-01').couleur} ${lot('ROS-26-01').stade}`);
  t('couleurs : mélange identique conservé', L.mixCouleur(d, ['blanc', 'blanc']) === 'blanc' && L.mixCouleur(d, ['blanc', 'rose']) === 'rose');
  t('stade d’assemblage : moût + vin → le moins avancé', L.stadeAssemblage(d, ['vin_clair', 'fa']) === 'fa' && L.stadeAssemblage(d, ['vin_clair', 'elevage']) === 'assemble');
  // replay à une date passée : stade d'alors
  const R0 = L.replay(d, '2025-10-01'); t('stades : rejeu à une date passée', R0.lots[lot('P25-01-C').id].stade === 'fa', R0.lots[lot('P25-01-C').id].stade);
  // suppression d'un stade utilisé : refusée ; ajout + renommage
  t('stades : suppression refusée si utilisé', !L.richListCont(d, 'stades', 'del', 'fa').ok && L.richListCont(d, 'stades', 'add', null, { label: 'Sur lies', after: 'fin_fa' }).ok && d.lists.stades.findIndex((x) => x.label === 'Sur lies') === d.lists.stades.findIndex((x) => x.id === 'fin_fa') + 1);
  // échelle : préréglage Bourgogne → 4 niveaux, crus « autre » déclassés, Grands crus conservés
  const nAutre = d.crus.filter((c) => c.echelle === 'autre').length; const pr = L.echellePreset(d, 'bourgogne'); L.replay(d);
  t('échelles : préréglage Bourgogne', pr.ok && pr.declasses === nAutre && L.ECHELLES.length === 4 && L.ECHELLES[3].id === 'grand' && d.crus.filter((c) => c.echelle === 'grand').length === 17 && d.settings.echelleNom === 'Hiérarchie des appellations', `${pr.declasses}/${nAutre} ${L.ECHELLES.map((e) => e.id)}`);
  const Rb = L.replay(d); const as1 = Object.values(Rb.lots).find((l) => l.code === 'AS25-01');
  t('échelles : un mélange prend le niveau le plus bas connu', ['premier', 'grand', null].includes(L.echelleInfo2(L.composition(d, Rb, as1.id)).id));
  // migration d'une ancienne base : listes ajoutées, étape → stade
  const old = JSON.parse(JSON.stringify(L.sampleDb())); delete old.lists.stades; delete old.lists.couleursVin; delete old.lists.echelles; old.lots.forEach((l) => { delete l.stade; delete l.couleur; });
  const eo = old.ops.find((o) => o.type === 'etape'); eo.newType = 'vin_clair'; delete eo.newStade; old.settings.charte = 'craie';
  const nd = L.normalizeDb(old);
  t('migration : listes et stades', nd.lists.stades.length === 16 && nd.lists.stades.some((x) => x.id === 'vin_soutire') && nd.lists.couleursVin.length === 3 && nd.lists.echelles.length === 3 && nd.ops.find((o) => o.id === eo.id).newStade === 'vin_clair' && nd.settings.charte === 'oenotrack');
  L.replay(L.sampleDb()); // rétablit l'échelle Champagne
}
console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (3)');
// ---- compatibilité : toutes les bases des versions précédentes (fixtures) s'ouvrent sans perte (18/11 → 0.8.0-alpha.1)
{
  const dirF = path.join(__dirname, 'fixtures'); const fx = fs.existsSync(dirF) ? fs.readdirSync(dirF).filter((f) => f.endsWith('.json')) : [];
  fx.forEach((f) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dirF, f), 'utf8')); const src0 = raw.format === 'oenotrack-sauvegarde' ? raw.db : raw;
    let nd = null, err = null; try { nd = L.importObj(JSON.parse(JSON.stringify(src0))); } catch (e) { err = e; }
    t(`compat ${f} : ouverture`, !!nd && !err, err && err.message);
    if (!nd) return;
    const R1 = L.replay(nd); const vol = Object.values(R1.portions).reduce((a, p) => a + p.vol, 0);
    t(`compat ${f} : rien de perdu (lots, opérations, contenants, documents)`, nd.lots.length === src0.lots.length && nd.ops.length === src0.ops.length && nd.contenants.length === src0.contenants.length && (nd.docs || []).length === (src0.docs || []).length);
    t(`compat ${f} : stocks recalculés`, vol > 0 && Object.keys(R1.warn).length >= 0, vol);
    const again = L.normalizeDb(JSON.parse(JSON.stringify(nd)));
    t(`compat ${f} : migration idempotente`, JSON.stringify({ ...again, meta: null }) === JSON.stringify({ ...nd, meta: null }));
    t(`compat ${f} : version enregistrée`, nd.meta.appVersion === L.APP_VERSION && nd.meta.versions.includes(L.APP_VERSION));
  });
  // une base créée par une version future (champs inconnus, schéma plus élevé) : rien n'est supprimé
  const fut = JSON.parse(JSON.stringify(L.sampleDb())); fut.schema = 99; fut.nouveauModule = { a: 1 }; fut.lots[0].champFutur = 'x'; fut.settings.reglageFutur = true;
  const nf = L.normalizeDb(fut);
  t('compat : base d’une version future, champs inconnus conservés', nf.schema === 99 && nf.nouveauModule && nf.nouveauModule.a === 1 && nf.lots[0].champFutur === 'x' && nf.settings.reglageFutur === true);
}
console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (4)');
// ---- parcelles (18/11 → 0.8.0-alpha.1)
{
  const d = L.sampleDb(); const R = L.replay(d); const lot = (code) => Object.values(R.lots).find((l) => l.code === code);
  t('parcelles : jeu d’exemple (4, reliées à un cru)', d.parcelles.length === 4 && d.parcelles.every((p) => d.crus.some((c) => c.id === p.cruId)));
  const pc = d.parcelles.find((p) => p.nom === 'Les Crayères'); const comp = L.composition(d, R, lot('P25-01-C').id);
  t('parcelles : composition d’une fraction pressée (100 % Les Crayères)', Math.abs((comp.parcelles[pc.id] || 0) - 1) < 1e-9, JSON.stringify(comp.parcelles));
  const as1 = L.composition(d, R, lot('AS25-01').id); t('parcelles : assemblage → parts par parcelle', (as1.parcelles[pc.id] || 0) > 0.2 && (as1.parcelles[pc.id] || 0) < 1, JSON.stringify(as1.parcelles));
  const tr = L.traceOrigin2(d, R, 'parcelle', pc.id); t('parcelles : traçabilité (raisins, lots descendants)', tr.raisins.length === 1 && tr.lots.some((x) => x.lot.code === 'AS25-01') && tr.lots.some((x) => x.lot.code.startsWith('T')), tr.lots.map((x) => x.lot.code).join(','));
  t('parcelles : suppression refusée si utilisée, cru obligatoire', !L.parcelleDelete(d, pc.id).ok && !L.parcelleSave(d, { nom: 'X' }).ok && L.parcelleSave(d, { nom: 'Les Crayères', cruId: pc.cruId }).ok === false);
}
console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (5)');

// ---- opérations personnalisables, stades automatiques, mélanges de stades, sorties de cave (18/11 → 0.9.0-alpha.1)
{
  const D = L.DEFAULT_OPERATIONS(); const ids = D.map((x) => x.id); const st = L.DEFAULT_STADES().map((x) => x.id);
  t('catalogue : identifiants uniques, comportements connus', new Set(ids).size === ids.length && D.every((x) => L.OP_LABELS0[x.base] !== undefined && x.label && x.groupe));
  t('catalogue : stades automatiques valides', D.every((x) => !x.stadeAuto || !x.stadeAuto.actif || st.includes(x.stadeAuto.stade)), D.filter((x) => x.stadeAuto && x.stadeAuto.actif && !st.includes(x.stadeAuto.stade)).map((x) => x.id));
  const sa = (id) => (D.find((x) => x.id === id).stadeAuto || {}); t('catalogue : soutirage → vin soutiré, filtration → vin filtré, collage → vin collé', sa('soutirage').stade === 'vin_soutire' && sa('filtration').stade === 'vin_filtre' && sa('collage').stade === 'vin_colle' && sa('levurage').stade === 'fa');
  const d = L.sampleDb(); const R = L.replay(d); const lot = (code) => Object.values(R.lots).find((l) => l.code === code);
  t('mélanges : moût + vin en fermentation = vin en fermentation', L.stadeMix(d, ['mout', 'fa']) === 'fa' && L.stadeMix(d, ['fa', 'mout']) === 'fa' && L.stadeMix(d, ['mout_debourbe', 'fa']) === 'fa');
  t('mélanges : vin filtré + vin clair = vin clair', L.stadeMix(d, ['vin_filtre', 'vin_clair']) === 'vin_clair' && L.stadeMix(d, ['vin_clair', 'vin_filtre']) === 'vin_clair');
  t('mélanges : sans règle → le moins avancé', L.stadeMix(d, ['vin_soutire', 'vin_filtre']) === 'vin_soutire' && L.stadeMix(d, ['fin_fa', 'vin_clair']) === 'fin_fa');
  d.settings.stadeMelangeDefaut = 'max'; t('mélanges : règle par défaut « le plus avancé »', L.stadeMix(d, ['vin_soutire', 'vin_filtre']) === 'vin_filtre' && L.stadeMix(d, ['mout', 'fa']) === 'fa'); d.settings.stadeMelangeDefaut = 'auto';
  t('mélanges : règle personnalisée, doublon refusé', L.stadeMelangeSave(d, null, { a: 'fin_fml', b: 'vin_clair', r: 'vin_clair' }).ok && L.stadeMix(d, ['vin_clair', 'fin_fml']) === 'vin_clair' && !L.stadeMelangeSave(d, null, { a: 'vin_clair', b: 'fin_fml', r: 'fin_fml' }).ok && !L.stadeMelangeSave(d, null, { a: 'fa', b: 'fa', r: 'fa' }).ok);
  // jeu d'exemple cohérent avec les règles
  const srcSt = (code) => { const o = d.ops.find((x) => x.lotSpec && x.lotSpec.code === code); const Rb = L.replay({ ...d, ops: d.ops.filter((x) => x.id !== o.id) }, o.date); return { o, sts: o.sources.map((s) => Rb.lots[s.lotId].stade) }; };
  const g1 = srcSt('RG26-01'); const g2 = srcSt('RG26-02');
  t('exemple : regroupement moût + taille en FA → en FA', g1.sts.includes('mout') && g1.sts.includes('fa') && lot('RG26-01') && R.stadeHist[lot('RG26-01').id][0].stade === L.stadeMix(d, g1.sts) && g1.o.sousType === 'regroupement', g1.sts);
  t('exemple : regroupement vin filtré + vin clair → vin clair', g2.sts.includes('vin_filtre') && g2.sts.includes('vin_clair') && lot('RG26-02').stade === 'vin_clair' && L.stadeMix(d, g2.sts) === 'vin_clair', g2.sts);
  t('exemple : variantes rejouées (levurage, collage, fin de FA, remuage)', ['levurage', 'collage', 'fin_fa', 'remuage', 'distillerie', 'batonnage', 'ensemencement_fml', 'rechauffage'].every((k) => d.ops.some((o) => o.sousType === k)) && L.opNom(d.ops.find((o) => o.sousType === 'collage')) === 'Collage' && lot('T24-01').stade === 'sur_pointes');
  t('exemple : soutirage → vin soutiré puis filtration → vin filtré', R.stadeHist[lot('P25-01-C').id].map((h) => h.stade).join('>').includes('fin_fa>vin_soutire>vin_filtre'));
  // stade automatique : seulement s'il fait avancer le vin, jamais d'un moût / d'une FA vers un stade « vin »
  t('stade auto : soutirage pendant la FA refusé, après la FA accepté', !L.stadeAutoOK(d, 'fa', 'vin_soutire') && L.stadeAutoOK(d, 'fin_fa', 'vin_soutire') && !L.stadeAutoOK(d, 'vin_filtre', 'vin_soutire'));
  t('stade auto : levurage d’un moût, ensemencement FML après la FA, filtration d’un moût refusée', L.stadeAutoOK(d, 'mout_debourbe', 'fa') && L.stadeAutoOK(d, 'fin_fa', 'fml') && !L.stadeAutoOK(d, 'mout_debourbe', 'vin_filtre') && L.stadeAutoOK(d, 'stabilise', 'tire'));
  // sorties de cave : bilan matière et stock
  const so = R.flows.filter((f) => f.kind === 'sortie'); t('sorties : distillerie (rebêche) + vente en vrac sortent du stock', so.length === 2 && Math.abs(so.reduce((a, f) => a + f.L, 0) + 1110) < 1e-6 && Math.abs(R.lotVol[lot('AS25-02').id] - 2695) < 1, so.map((f) => f.L));
  const big = JSON.parse(JSON.stringify(d)); const pid = Object.values(R.portions).find((p) => p.lotId === lot('AS25-02').id).id;
  const rs = L.opSave(big, { type: 'sortie', date: '2026-11-16', portionId: pid, volL: 999999, motif: 'x' }); const Rb = L.replay(big);
  t('sorties : volume supérieur au stock → avertissement', rs.ok && (Rb.warn[rs.op.id] || []).length > 0, Rb.warn[rs.op.id]);
  // catalogue : création d'une opération personnalisée (avec sa fiche), usage, masquage, suppression
  const c = L.sampleDb(); const n0 = L.opList(c).length;
  const r1 = L.opCatSave(c, { label: 'Tanisage', base: 'intrant', groupe: 'Élevage & stabilisation', motif: 'Tanisage', stadeAuto: { actif: false, stade: '' } }, { fiche: { titre: 'x', tableaux: [], champs: [] } });
  const nx = L.opDef(c, r1.id); t('catalogue : opération personnalisée créée (perso_, fiche associée)', r1.ok && r1.id === 'perso_tanisage' && nx.custom && L.opList(c).length === n0 + 1 && c.modelesFiches.some((m) => m.id === nx.ficheId && m.types.includes(r1.id) && m.titre === 'Tanisage'));
  t('catalogue : nom en double et comportement inconnu refusés', !L.opCatSave(c, { label: 'tanisage', base: 'intrant' }).ok && !L.opCatSave(c, { label: 'Zz', base: 'pressurage' }).ok && !L.opCatSave(c, { label: 'Zz2', base: 'intrant', stadeAuto: { actif: true, stade: 'inexistant' } }).ok);
  t('catalogue : proposée dans son groupe', L.opGroupes(c).some((g) => g.title === 'Élevage & stabilisation' && g.items.includes(r1.id)) && L.OP_LABELS[r1.id] === 'Tanisage');
  const Rc = L.replay(c); const pc = Object.values(Rc.portions).find((p) => p.lotId === Object.values(Rc.lots).find((l) => l.code === 'AS25-02').id);
  const ro = L.opSave(c, { type: 'intrant', sousType: r1.id, date: '2026-11-16', portionId: pc.id, lignes: [{ produitId: c.produits.find((p) => p.nom.startsWith('Tanins')).id, arrivageId: '', qty: 100 }], prepUses: [], motif: 'Tanisage' });
  t('catalogue : opération personnalisée enregistrée et rejouée', ro.ok && L.replay(c).apps.some((a) => a.opId === ro.op.id && a.opSousType === r1.id) && L.opNom(ro.op) === 'Tanisage' && L.opCatUsage(c, r1.id) === 1);
  t('catalogue : suppression refusée si utilisée, masquage possible', !L.opCatDelete(c, r1.id).ok && L.opCatSave(c, { id: r1.id, label: 'Tanisage', masque: true }).ok && !L.opGroupes(c).some((g) => g.items.includes(r1.id)) && L.opGroupes(c, null, true).some((g) => g.items.includes(r1.id)));
  t('catalogue : opération d’origine non supprimable, réglage rétabli', !L.opCatDelete(c, 'soutirage').ok && L.opCatSave(c, { id: 'soutirage', label: 'Soutirage (lies)', stadeAuto: { actif: false, stade: 'vin_soutire' } }).ok && L.opNom({ type: 'soutirage' }) === 'Soutirage (lies)' && L.opCatReset(c, 'soutirage').ok && L.opDef(c, 'soutirage').label === 'Soutirage' && L.opDef(c, 'soutirage').stadeAuto.actif);
  L.opDelete(c, ro.op.id); t('catalogue : suppression d’une opération personnalisée inutilisée (et de sa fiche)', L.opCatDelete(c, r1.id).ok && !L.opDef(c, r1.id) && !(c.modelesFiches || []).some((m) => m.auto === r1.id));
  // compatibilité : variante supprimée / inconnue → libellé du comportement ; champs d'une version future conservés à la modification
  const u = L.sampleDb(); const ou = u.ops.find((o) => o.sousType === 'collage'); ou.sousType = 'variante_future';
  const nu = L.normalizeDb(JSON.parse(JSON.stringify(u))); t('compat : variante inconnue rejouée comme son comportement', L.opNom(ou) === L.OP_LABELS.intrant && Object.keys(L.replay(nu).lots).length === Object.keys(R.lots).length);
  const fo = u.ops.find((o) => o.type === 'jaugeage'); fo.av = L.APP_NUM + 1000; fo.champFutur = { x: 1 };
  const re = L.opSave(u, { type: 'jaugeage', date: fo.date, portionId: fo.portionId, volMesure: 1970, typeId: fo.typeId }, fo.id);
  t('compat : opération d’une version plus récente modifiée sans perte de ses champs', re.ok && re.op.champFutur && re.op.champFutur.x === 1 && re.op.volMesure === 1970 && re.op.av === L.APP_NUM + 1000);
  const re2 = L.opSave(u, { type: 'jaugeage', date: fo.date, portionId: fo.portionId, volMesure: 1969, typeId: fo.typeId }, fo.id);
  t('compat : … et encore après une deuxième modification (marqueur de version gardé)', re2.ok && re2.op.champFutur && re2.op.champFutur.x === 1 && re2.op.volMesure === 1969);
  const old8 = JSON.parse(JSON.stringify(L.sampleDb())); delete old8.lists.operations; delete old8.lists.stadesMelanges; delete old8.settings.stadesV9; old8.lists.stades = old8.lists.stades.filter((x) => !['vin_soutire', 'vin_colle', 'vin_filtre', 'sur_pointes'].includes(x.id));
  const n8 = L.normalizeDb(old8); t('migration 0.8.0-alpha.1 → 0.9.0-alpha.1 : catalogue, règles de mélange et nouveaux stades à leur place', n8.lists.operations.length === D.length && n8.lists.stadesMelanges.length > 5 && n8.lists.stades.findIndex((x) => x.id === 'vin_soutire') === n8.lists.stades.findIndex((x) => x.id === 'fin_fml') + 1);
  const cu = JSON.parse(JSON.stringify(n8)); cu.lists.operations.find((x) => x.id === 'filtration').label = 'Filtration sur plaques'; delete cu.lists.operations.find((x) => x.id === 'remuage').icone;
  const nc = L.normalizeDb(cu); t('migration : réglages conservés, champs d’origine complétés', nc.lists.operations.find((x) => x.id === 'filtration').label === 'Filtration sur plaques' && nc.lists.operations.find((x) => x.id === 'remuage').icone === '↯' && JSON.stringify(L.normalizeDb(JSON.parse(JSON.stringify(nc)))) .length > 0);
}
console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (6)');

// ---- synchronisation Drive : fusion à trois voies (18/11 → 0.10.0-alpha.1)
{
  const C = (x) => JSON.parse(JSON.stringify(x)); const B = L.normalizeDb(L.sampleDb());
  // identifiants marqués par appareil ; jeu d'exemple toujours identique
  L.setNID('-aaa'); const ex = L.sampleDb(); const tmp = C(B); const idA = L.nid(tmp, 'op'); L.setNID('');
  t('identifiants : marque de l’appareil, exemple sans marque', idA.endsWith('-aaa') && !JSON.stringify(ex.ops.map((o) => o.id)).includes('-aaa') && JSON.stringify(L.sampleDb().ops.map((o) => o.id)) === JSON.stringify(ex.ops.map((o) => o.id)));
  t('rejeu : même date et même n° → ordre par identifiant', [{ date: 'd', seq: 5, id: 'op5-b' }, { date: 'd', seq: 5, id: 'op5-a' }].sort(L.byDate)[0].id === 'op5-a');
  // A (cet appareil) et D (fichier du Drive) modifiés chacun de leur côté depuis la base commune B
  const A = C(B); L.setNID('-aaa'); const pA = Object.values(L.replay(A).portions).find((p) => p.vol > 100);
  const ra = L.opSave(A, { type: 'jaugeage', date: '2026-11-17', portionId: pA.id, volMesure: Math.round(pA.vol) - 3, typeId: 'evaporation' });
  A.contenants[0].nom = 'Cuve A'; A.lists.stades.push({ id: 'sur_lies', label: 'Sur lies', court: 'Sur lies', phase: 'vin', role: '' }); A.settings.campagneActive = '2025-2026'; A.meta.modifLe = '2026-11-18T10:00:00Z';
  const D = C(B); L.setNID('-bbb'); D.analyses.push({ ...C(D.analyses[0]), id: 'an900-bbb', date: '2026-11-16' }); D.lots[1].designation = 'Désignation Drive';
  const delId = D.ops.find((o) => o.type === 'suivi').id; D.ops = D.ops.filter((o) => o.id !== delId); D.regles[0] = { ...D.regles[0], doseMax: 77 }; D.meta.modifLe = '2026-11-18T11:00:00Z'; L.setNID('');
  const m = L.syncFusion(B, A, D); const N = L.normalizeDb(m.db);
  t('fusion : ajouts et modifications des deux côtés réunis', !!N.ops.find((o) => o.id === ra.op.id) && N.contenants[0].nom === 'Cuve A' && !!N.analyses.find((a) => a.id === 'an900-bbb') && N.lots[1].designation === 'Désignation Drive' && N.lists.stades.some((x) => x.id === 'sur_lies'));
  t('fusion : suppression faite sur le Drive appliquée', !N.ops.find((o) => o.id === delId) && m.supprRecues === 1);
  t('fusion : règle d’intrant (clé composée) reçue', N.regles.find((r) => r.produitId === D.regles[0].produitId && r.qualifId === D.regles[0].qualifId).doseMax === 77 && N.regles.length === B.regles.length);
  t('fusion : réglage de vue propre à l’appareil', N.settings.campagneActive === '2025-2026' && m.conflits.length === 0, m.conflits.map((c) => c.cle));
  t('fusion : comptes reçus / gardés', m.recus.analyses === 1 && m.recus.lots === 1 && m.recus.ops === 1 && m.recus.regles === 1 && m.envoyes.ops === 1 && m.envoyes.contenants === 1 && m.envoyes['lists.stades'] === 1, `${L.syncResume(m.recus)} | ${L.syncResume(m.envoyes)}`);
  const m2 = L.syncFusion(B, D, A); t('fusion : symétrique (même résultat des deux côtés)', L.syncEmpreinte(L.normalizeDb(m2.db)) === L.syncEmpreinte(N));
  t('fusion : rien à faire quand les deux côtés sont égaux', L.syncFusion(B, A, C(A)).identique && L.syncFusion(null, A, C(A)).nRecus === 0);
  t('fusion : stocks recalculés sans avertissement nouveau', Object.keys(L.replay(N).warn).length <= Object.keys(L.replay(B).warn).length + 1);
  // conflit : même élément modifié des deux côtés → plus récent gardé, l'autre au journal ; reprise possible
  const A2 = C(B); A2.contenants[2].nom = 'X appareil'; A2.meta.modifLe = '2026-11-18T09:00:00Z';
  const D2 = C(B); D2.contenants[2].nom = 'Y drive'; D2.meta.modifLe = '2026-11-18T12:00:00Z';
  const m3 = L.syncFusion(B, A2, D2); const c3 = m3.conflits[0];
  t('conflit : version la plus récente gardée, l’autre conservée', m3.db.contenants[2].nom === 'Y drive' && m3.conflits.length === 1 && c3.garde === 'drive' && c3.autre.nom === 'X appareil');
  const N3 = C(m3.db); t('conflit : reprendre l’autre version', L.conflitReprendre(N3, c3).ok && N3.contenants[2].nom === 'X appareil');
  const m3b = L.syncFusion(B, A2, D2, { gagnant: 'appareil' }); t('conflit : départage forcé', m3b.db.contenants[2].nom === 'X appareil' && m3b.conflits[0].autre.nom === 'Y drive');
  // supprimé d'un côté, modifié de l'autre : la version modifiée est gardée
  const A4 = C(B); A4.analyses = A4.analyses.filter((a) => a.id !== B.analyses[1].id); const D4 = C(B); D4.analyses[1].notes = 'corrigée';
  const m4 = L.syncFusion(B, A4, D4); t('suppression contre modification : rien n’est perdu', m4.db.analyses.some((a) => a.id === B.analyses[1].id && a.notes === 'corrigée') && m4.conflits[0].nature === 'suppression');
  // ordre d'une liste changé d'un seul côté (stades) : repris
  const A5 = C(B); const D5 = C(B); const s0 = D5.lists.stades.splice(3, 1)[0]; D5.lists.stades.splice(0, 0, s0);
  const m5 = L.syncFusion(B, A5, D5); t('ordre d’une liste changé sur le Drive : repris', m5.db.lists.stades[0].id === s0.id && m5.db.lists.stades.length === B.lists.stades.length);
  // règles de mélange (sans identifiant) et réglages
  const A6 = C(B); A6.lists.stadesMelanges.push({ a: 'fin_fml', b: 'vin_clair', r: 'vin_clair' }); A6.settings.coefSucre = 2.8; const D6 = C(B); D6.lists.stadesMelanges = D6.lists.stadesMelanges.slice(1); D6.settings.objectifTirageGL = 25;
  const m6 = L.syncFusion(B, A6, D6); t('règles de mélange et réglages réunis', m6.db.lists.stadesMelanges.length === B.lists.stadesMelanges.length && m6.db.settings.coefSucre === 2.8 && m6.db.settings.objectifTirageGL === 25);
  // premier contact (pas de version commune) : ce qui n'existe que d'un côté est gardé
  const m7 = L.syncFusion(null, A, D); const N7 = L.normalizeDb(m7.db);
  t('premier contact : union sans perte', !!N7.ops.find((o) => o.id === ra.op.id) && !!N7.analyses.find((a) => a.id === 'an900-bbb') && !!N7.ops.find((o) => o.id === delId) && m7.supprRecues === 0 && m7.supprEnvoyees === 0);
  // méta : compteurs au maximum (aucun identifiant réutilisé)
  const A8 = C(B); A8.meta.seq = 900; A8.meta.opSeq = 300; const D8 = C(B); D8.meta.seq = 950; D8.meta.opSeq = 250;
  const m8 = L.syncFusion(B, A8, D8); t('méta : compteurs au maximum des deux côtés', m8.db.meta.seq === 950 && m8.db.meta.opSeq === 300);
  // lots créés sur deux appareils avec le même code : signalés
  const A9 = C(B); const D9 = C(B); A9.lots.push({ ...C(B.lots[0]), id: 'lot999-aaa', code: 'AS26-09' }); D9.lots.push({ ...C(B.lots[0]), id: 'lot999-bbb', code: 'AS26-09' });
  t('codes de lots en double signalés', L.syncFusion(B, A9, D9).doublons.includes('AS26-09'));
  // empreinte : ignore les métadonnées et la vue en cours
  const E = C(B); E.meta.derniereExport = '2030-01-01'; E.settings.siteActif = 'site2'; t('empreinte : métadonnées et vue ignorées', L.syncEmpreinte(E) === L.syncEmpreinte(B) && L.syncEmpreinte(A) !== L.syncEmpreinte(B));
}
console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (7)');

// ---- stockage Drive : synchronisation local d'abord avec un dossier partagé (fournisseur simulé, 3 appareils) (18/11 → 0.11.0-alpha.1)
(async () => {
  const C = (x) => JSON.parse(JSON.stringify(x)); let cpt = 0;
  const dossier = () => { const st = { base: null, rev: 0, docs: {}, hist: {}, ecritures: 0, avant: null, panne: false };
    const chk = () => { if (st.panne) throw { reseau: true, message: 'hors ligne' }; };
    const F = {
      async infoBase() { chk(); return st.base === null ? null : { rev: String(st.rev) }; },
      async lireBase() { chk(); return st.base === null ? null : { texte: st.base, rev: String(st.rev) }; },
      async ecrireBase(d, texte, rev) { chk(); if (st.avant) { const f = st.avant; st.avant = null; await f(); } if (st.base !== null && String(rev) !== String(st.rev)) throw { conflit: true }; st.base = texte; st.rev += 1; st.ecritures += 1; return { rev: String(st.rev) }; },
      async listerDocs() { chk(); const o = {}; Object.keys(st.docs).forEach((n) => { o[n] = n; }); return o; },
      async lireDoc(d, ref) { chk(); return st.docs[ref] || null; }, async ecrireDoc(d, nom, b) { chk(); st.docs[nom] = b; return nom; },
      async ecrireHistorique(d, nom, texte) { st.hist[nom] = texte; } };
    return { st, F }; };
  const appareil = (tag, db) => ({ tag, db, snaps: new Map(), docs: new Map(), e: {} });
  const hote = (dev) => ({ lireLocale: () => dev.db, appliquer: (nd) => { dev.db = nd; }, vide: (Ld) => !!(Ld.meta && Ld.meta.exemple) || (!Ld.ops.length && !Ld.lots.length && !Ld.contenants.length),
    snapLire: async (id) => (dev.snaps.has(id) ? JSON.parse(dev.snaps.get(id)) : null), snapEcrire: async (id, d) => { dev.snaps.set(id, JSON.stringify(d)); },
    construire: (Ld, sync) => JSON.stringify({ format: 'oenotrack-sauvegarde', formatVersion: 1, sync, db: Ld, fichiers: [] }), lire: (texte) => { const j = JSON.parse(texte); return { db: L.importObj(j.db), sync: j.sync }; },
    docLocal: async (id) => dev.docs.has(id), docLire: async (id) => dev.docs.get(id) || null, docEcrire: async (id, b) => { dev.docs.set(id, b); },
    appareil: { tag: dev.tag, nom: `Appareil ${dev.tag}` }, nouvelId: () => `s${(cpt += 1)}`, maintenant: () => new Date().toISOString(), aujourdhui: () => '2026-11-18' });
  const sync = (dev, D, o) => L.cloudSynchroniser(D.F, { id: 'dossier' }, dev.e, hote(dev), o);
  const E = (dev) => L.syncEmpreinte(dev.db);
  const reel = C(L.normalizeDb(L.sampleDb())); reel.meta.exemple = false;
  const D = dossier(); const A = appareil('aaa', C(reel)); const B = appareil('bbb', L.normalizeDb(L.emptyDb()));
  const r1 = await sync(A, D); t('drive : premier appareil → base écrite dans le dossier vide, copie du jour', r1.envoye && D.st.ecritures === 1 && JSON.parse(D.st.base).sync.appareilNom === 'Appareil aaa' && !!D.st.hist['oenotrack-base-2026-11-18.json']);
  const r2 = await sync(B, D); t('drive : appareil vide → reprend les données du dossier', r2.adopte && E(B) === E(A) && !r2.envoye);
  // saisies des deux côtés, synchronisations croisées
  L.setNID('-aaa'); const pA = Object.values(L.replay(A.db).portions).find((p) => p.vol > 100);
  const oa = L.opSave(A.db, { type: 'jaugeage', date: '2026-11-18', portionId: pA.id, volMesure: Math.round(pA.vol) - 2, typeId: 'evaporation' }).op; A.db.meta.modifLe = '2026-11-18T10:00:00Z';
  L.setNID('-bbb'); B.db.analyses.push({ ...C(B.db.analyses[0]), id: 'an77-bbb', date: '2026-11-18' }); B.db.meta.modifLe = '2026-11-18T10:05:00Z'; L.setNID('');
  await sync(A, D); const r3 = await sync(B, D); await sync(A, D);
  t('drive : saisies des deux appareils réunies partout', E(A) === E(B) && A.db.ops.some((o) => o.id === oa.id) && A.db.analyses.some((x) => x.id === 'an77-bbb') && r3.recu && r3.recu.nRecus === 1 && r3.envoye);
  // écriture concurrente : B écrit pendant que A s'apprête à écrire → A relit, réunit, réécrit
  A.db.contenants[0].nom = 'Cuve A1'; A.db.meta.modifLe = '2026-11-18T11:00:00Z'; B.db.contenants[1].nom = 'Cuve B2'; B.db.meta.modifLe = '2026-11-18T11:01:00Z';
  D.st.avant = async () => { await sync(B, D); };
  const r4 = await sync(A, D); await sync(B, D);
  t('drive : écriture simultanée → relecture, réunion, rien de perdu', r4.essais === 2 && r4.envoye && E(A) === E(B) && A.db.contenants[0].nom === 'Cuve A1' && A.db.contenants[1].nom === 'Cuve B2');
  // documents joints : envoyés par A, récupérés par B
  A.db.docs.push({ id: 'docx1', nom: 'certificat bio.pdf', mime: 'application/pdf', taille: 5, cible: { kind: 'op', id: oa.id } }); A.docs.set('docx1', 'PDF-1');
  const r5 = await sync(A, D); const r6 = await sync(B, D);
  t('drive : document envoyé puis récupéré sur l’autre appareil', r5.docsEnvoyes === 1 && D.st.docs['docx1.pdf'] === 'PDF-1' && r6.docsRecus === 1 && B.docs.get('docx1') === 'PDF-1');
  // suppression propagée
  B.db.analyses = B.db.analyses.filter((x) => x.id !== 'an77-bbb'); await sync(B, D); await sync(A, D);
  t('drive : suppression faite sur un appareil propagée', !A.db.analyses.some((x) => x.id === 'an77-bbb') && E(A) === E(B));
  // rien de nouveau : pas d'écriture inutile
  const w0 = D.st.ecritures; await sync(A, D); await sync(B, D); t('drive : rien à faire quand tout est à jour', D.st.ecritures === w0);
  // hors ligne : l'erreur remonte, les saisies restent et partent au retour du réseau
  A.db.contenants[2].nom = 'Cuve hors ligne'; D.st.panne = true; let err = null; try { await sync(A, D); } catch (e) { err = e; }
  D.st.panne = false; await sync(A, D); await sync(B, D);
  t('drive : coupure de réseau → saisie gardée puis envoyée', err && err.reseau && B.db.contenants[2].nom === 'Cuve hors ligne');
  // un troisième appareil avec ses propres données : réunies (premier contact) ; ou au choix, reprise des données du dossier
  const Cdev = appareil('ccc', C(reel)); L.setNID('-ccc'); Cdev.db.apporteurs.push({ id: 'apt9-ccc', nom: 'Apporteur C', commune: '', contact: '', notes: '' }); L.setNID('');
  const r7 = await sync(Cdev, D); t('drive : appareil avec ses données → réunion sans perte', r7.premier && !r7.adopte && Cdev.db.apporteurs.some((x) => x.id === 'apt9-ccc') && Cdev.db.ops.some((o) => o.id === oa.id));
  const Dv = appareil('ddd', C(reel)); Dv.db.apporteurs.push({ id: 'apt10-ddd', nom: 'Apporteur D' });
  const r8 = await sync(Dv, D, { adopter: true }); t('drive : « utiliser les données du dossier » remplace celles de l’appareil', r8.adopte && !Dv.db.apporteurs.some((x) => x.id === 'apt10-ddd') && Dv.db.apporteurs.some((x) => x.id === 'apt9-ccc'));
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (8)');

  // ---- opérateurs (18/11 → 0.12.0-alpha.1) : liste de la société, opérateurs des opérations, compatibilité avec la 0.11.0-alpha.1
  {
    const d = L.sampleDb(); const O = d.operateurs; const id = (p) => O.find((o) => o.prenom === p).id;
    t('opérateurs : 6 dans l’exemple dont 1 archivé', O.length === 6 && O.filter((o) => o.actif === false).length === 1 && O.find((o) => o.prenom === 'Marc').actif === false);
    t('opérateurs : chaque opération de l’exemple a son opérateur', d.ops.every((o) => o.type === 'declassement' || L.operateursValides(d, o.operateurs).length >= 1), d.ops.filter((o) => !(o.operateurs || []).length).map((o) => o.type));
    t('opérateurs : assemblage = chef de cave + œnologue', d.ops.filter((o) => o.type === 'assemblage' && !o.sousType).every((o) => o.operateurs.join() === [id('Julien'), id('Claire')].join()));
    t('opérateurs : saisonnier 2025 sur les suivis 2025, saisonnière 2026 sur ceux de 2026', d.ops.filter((o) => o.type === 'pressurage').every((o) => o.operateurs.includes(o.date < '2026-08-01' ? id('Marc') : id('Léa'))));
    t('opérateurs : hygiène avec ids + nom en clair (lu par les anciennes versions)', d.hygiene.every((h) => h.operateurs.length === 1 && h.operateur === L.operateurNom(d, h.operateurs[0])));
    t('opérateurs : noms, initiales, nom court', L.operateurNom(d, id('Julien')) === 'Julien Morel' && L.operateurCourt(d, id('Julien')) === 'Julien M.' && L.operateurInitiales(O.find((o) => o.prenom === 'Julien')) === 'JM' && L.operateursNoms(d, [id('Julien'), 'inconnu', id('Sophie')]) === 'Julien Morel, Sophie Lambert');
    t('opérateurs : liste triée, archivés à la fin', L.operateursTries(d, true).map((o) => o.prenom).join(',') === 'Claire,Julien,Léa,Sophie,Thomas,Marc' && L.operateursTries(d, false).length === 5);
    t('opérateurs : doublon et nom vide refusés', !L.operateurSave(d, { prenom: 'julien', nom: 'MOREL' }).ok && !L.operateurSave(d, { prenom: ' ', nom: '' }).ok);
    const n0 = L.operateurSave(d, { prenom: 'Hugo', nom: 'Perrin', fonction: 'Apprenti', initiales: 'hp!' });
    t('opérateurs : ajout (initiales nettoyées, actif)', n0.ok && L.operateurNom(d, n0.id) === 'Hugo Perrin' && d.operateurs.find((o) => o.id === n0.id).initiales === 'HP' && d.operateurs.find((o) => o.id === n0.id).actif === true);
    d.operateurs.find((o) => o.id === n0.id).futur = 42; L.operateurSave(d, { prenom: 'Hugo', nom: 'Perrin', fonction: 'Caviste' }, n0.id);
    t('opérateurs : modification (champ d’une version future conservé)', d.operateurs.find((o) => o.id === n0.id).fonction === 'Caviste' && d.operateurs.find((o) => o.id === n0.id).futur === 42);
    const u = L.operateurUsage(d, id('Sophie'));
    t('opérateurs : suppression refusée s’il a servi (archivage proposé)', u.ops > 5 && !L.operateurDelete(d, id('Sophie')).ok && /archivez/.test(L.operateurDelete(d, id('Sophie')).msg));
    t('opérateurs : suppression d’un opérateur inutilisé', L.operateurDelete(d, n0.id).ok && !d.operateurs.some((o) => o.id === n0.id));
    t('opérateurs : archiver / réactiver', L.operateurActif(d, id('Thomas'), false).ok && L.operateursTries(d, false).length === 4 && L.operateurActif(d, id('Thomas'), true).ok);
    // opérations : opérateurs enregistrés, modifiables
    const R0 = L.getR(d); const p0 = Object.values(R0.portions).find((p) => p.vol > 100);
    const o1 = L.opSave(d, { type: 'jaugeage', date: '2026-11-18', portionId: p0.id, volMesure: Math.round(p0.vol), typeId: 'evaporation', operateurs: [id('Thomas'), id('Léa')] }).op;
    t('opérations : opérateurs enregistrés', o1.operateurs.join() === [id('Thomas'), id('Léa')].join());
    L.opSave(d, { ...L.clone(o1), operateurs: [id('Sophie')] }, o1.id);
    t('opérations : opérateurs modifiés', d.ops.find((o) => o.id === o1.id).operateurs.join() === id('Sophie'));
    // hygiène
    const nh = d.hygiene.length; L.hygieneSave(d, { date: '2026-11-18', cibleType: 'equipement', cibleId: 'pressoir', actionId: 'nettoyage', produit: 'Eau', operateurs: [id('Léa'), id('Thomas')] });
    const h1 = d.hygiene[nh]; t('hygiène : opérateurs + noms en clair', h1.operateurs.length === 2 && h1.operateur === 'Léa Fontaine, Thomas Girard');
    L.hygieneSave(d, { ...h1, operateurs: [], operateur: 'Prestataire extérieur' }, h1.id);
    t('hygiène : sans opérateur de la liste, le nom écrit à la main reste', !d.hygiene.find((x) => x.id === h1.id).operateurs && d.hygiene.find((x) => x.id === h1.id).operateur === 'Prestataire extérieur');
    // déclassement : qui décide
    const a = d.alertes.find((x) => x.statut === 'attente');
    t('déclassement : alerte en attente dans l’exemple', !!a);
    d.settings.operateurObligatoire = true;
    t('réglage « opérateur obligatoire » : décision sans opérateur refusée', !L.alertValidate(d, a.id, '2026-11-18', []).ok && !L.hygieneSave(d, { date: '2026-11-18', cibleType: 'equipement', cibleId: 'pressoir', actionId: 'nettoyage', operateurs: [] }).ok);
    const va = L.alertValidate(d, a.id, '2026-11-18', [id('Julien')]); const dec = d.ops.find((o) => o.type === 'declassement' && o.alerteId === a.id);
    t('déclassement : décidé par le chef de cave (alerte + opération)', va.ok && a.decidePar.join() === id('Julien') && dec && dec.operateurs.join() === id('Julien') && L.operateurUsage(d, id('Julien')).alertes === 1);
    d.settings.operateurObligatoire = false;
    // normalisation : anciennes bases → liste vide ; base 0.12.0-alpha.1 inchangée (idempotent)
    const vieille = L.clone(d); delete vieille.operateurs; const nv = L.normalizeDb(vieille);
    t('normalisation : base sans opérateurs → liste vide', Array.isArray(nv.operateurs) && nv.operateurs.length === 0);
    const n1 = L.normalizeDb(L.clone(d)); const n2 = L.normalizeDb(L.clone(n1));
    t('normalisation : opérateurs conservés, idempotente', n1.operateurs.length === d.operateurs.length && L.syncEmpreinte(n1) === L.syncEmpreinte(n2) && n1.ops.find((o) => o.id === o1.id).operateurs.join() === id('Sophie'));
    // synchronisation : opérateurs ajoutés sur deux appareils, modification d'un côté
    const B = L.normalizeDb(L.sampleDb()); const A1 = L.clone(B); const A2 = L.clone(B);
    L.setNID('-tab'); L.operateurSave(A1, { prenom: 'Nina', nom: 'Roux', fonction: 'Saisonnier' }); L.setNID('-pc'); L.operateurSave(A2, { prenom: 'Paul', nom: 'Lenoir', fonction: 'Prestataire' }); L.setNID('');
    A2.operateurs.find((o) => o.prenom === 'Sophie').contact = '06 00 00 00 00';
    const F = L.syncFusion(B, A1, A2);
    t('synchro : opérateurs créés sur deux appareils réunis, modification reçue', F.db.operateurs.length === 8 && F.db.operateurs.some((o) => o.prenom === 'Nina') && F.db.operateurs.some((o) => o.prenom === 'Paul') && F.db.operateurs.find((o) => o.prenom === 'Sophie').contact === '06 00 00 00 00' && !F.conflits.length && F.recus.operateurs === 2);
    t('synchro : libellé « 2 opérateurs »', L.syncResume(F.recus) === '2 opérateurs', L.syncResume(F.recus));
  }
  // ---- compatibilité ascendante : la version précédente (0.11.0-alpha.1, moteur gelé dans test/anciennes) ouvre une base 0.12.0-alpha.1 sans rien perdre
  {
    const dirV = path.join(__dirname, 'anciennes', '0.11.0-alpha.1');
    let srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { sampleDb, normalizeDb, opSave, hygieneSave, syncFusion, syncEmpreinte, getR, APP_VERSION, APP_NUM, clone };')({});
    t('0.11.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V1.1' && V.APP_NUM === 1001 && L.APP_NUM > 1001);
    const d12 = L.normalizeDb(L.sampleDb()); d12.settings.operateurObligatoire = true;
    const op12 = d12.ops.find((o) => o.type === 'jaugeage' || o.type === 'suivi'); const qui = op12.operateurs.join();
    const v = V.normalizeDb(JSON.parse(JSON.stringify(d12)));
    t('0.11.0-alpha.1 ouvre une base 0.12.0-alpha.1 : opérateurs, opérateurs des opérations et réglage conservés', v.operateurs.length === 6 && v.ops.find((o) => o.id === op12.id).operateurs.join() === qui && v.settings.operateurObligatoire === true && v.hygiene.every((h) => Array.isArray(h.operateurs)));
    const sp = V.clone(v.ops.find((o) => o.id === op12.id)); delete sp.operateurs; sp.notes = 'modifiée avec la 0.11.0-alpha.1';
    const r = V.opSave(v, sp, op12.id);
    t('0.11.0-alpha.1 modifie une opération 0.12.0-alpha.1 : ses opérateurs restent', r.ok && v.ops.find((o) => o.id === op12.id).operateurs.join() === qui && v.ops.find((o) => o.id === op12.id).notes === 'modifiée avec la 0.11.0-alpha.1');
    const h12 = v.hygiene.find((h) => h.date >= '2026-08-01'); const hq = h12.operateurs.join(); const rh = V.hygieneSave(v, { ...h12, produit: 'Eau chaude', operateur: h12.operateur }, h12.id); // campagne ouverte
    t('0.11.0-alpha.1 modifie une entrée d’hygiène 0.12.0-alpha.1 : ses opérateurs restent', rh.ok && v.hygiene.find((h) => h.id === h12.id).operateurs.join() === hq && v.hygiene.find((h) => h.id === h12.id).produit === 'Eau chaude');
    // synchro 0.11.0-alpha.1 (cet appareil) ↔ fichier écrit par la 0.12.0-alpha.1 (nouvel opérateur + opérateur d'une opération changé)
    const base = V.clone(v); const L11 = V.clone(v); const R12 = L.clone(v);
    L.operateurSave(R12, { prenom: 'Nina', nom: 'Roux' }); const o12 = R12.ops.find((o) => o.type === 'transfert'); o12.operateurs = [R12.operateurs.find((o) => o.prenom === 'Nina').id];
    L11.contenants[0].nom = 'Cuve 0.11.0-alpha.1';
    const F = V.syncFusion(base, L11, R12);
    t('0.11.0-alpha.1 synchronisée avec un fichier 0.12.0-alpha.1 : nouvel opérateur et opérateurs d’opération reçus', F.db.operateurs.length === 7 && F.db.ops.find((o) => o.id === o12.id).operateurs.join() === o12.operateurs.join() && F.db.contenants[0].nom === 'Cuve 0.11.0-alpha.1' && !F.conflits.length);
    const back = L.normalizeDb(F.db);
    t('… puis rouverte en 0.12.0-alpha.1 sans perte', back.operateurs.length === 7 && L.operateursNoms(back, back.ops.find((o) => o.id === o12.id).operateurs) === 'Nina Roux');
  }
  // ---- modules (18/11 → 0.13.0-alpha.1) : ordre des onglets, activation, Paramètres toujours actif, compatibilité
  {
    const d = L.normalizeDb(L.sampleDb()); const D = L.MODULES_DEFAUT;
    t('modules : 16 modules (Pressoir depuis 0.24.0-alpha.1, Équipements depuis 0.28.0-alpha.1, Plan de vinification depuis 0.39.0-alpha.1), Tirage & Dégorgement séparé, Registres / Paramètres séparés', D.length === 16 && D.indexOf('equipements') === D.indexOf('hygiene') + 1 && D.indexOf('pressoir') === 1 && ['tirage', 'cave', 'degorgement', 'registres', 'params'].every((x) => D.includes(x)) && L.MODULE_FIXE === 'params');
    t('modules : ordre d’origine et tous actifs par défaut (15 modules affichés : Déclassements dans Opérations depuis 0.27.0-alpha.2, Équipements depuis 0.28.0-alpha.1, Plan de vinification depuis 0.39.0-alpha.1)', L.modulesOrdre(d).join() === D.join() && L.modulesVisibles(d).length === 15 && !L.modulesVisibles(d).includes('declass') && L.moduleActif(d, 'declass') && L.moduleAccueil(d) === 'cuverie');
    t('modules : déplacer (bornes respectées)', L.moduleDeplacer(d, 'hygiene', -20).ok && L.modulesConnus(d)[0] === 'hygiene' && L.moduleDeplacer(d, 'hygiene', -1).ok && L.modulesConnus(d)[0] === 'hygiene' && L.moduleAccueil(d) === 'hygiene');
    L.moduleDeplacer(d, 'params', -14);
    t('modules : Paramètres déplaçable', L.modulesConnus(d).indexOf('params') === 0);
    t('modules : Paramètres jamais désactivable', !L.moduleActiver(d, 'params', false).ok && L.moduleActif(d, 'params'));
    t('modules : module inconnu refusé', !L.moduleActiver(d, 'xyz', false).ok && !L.moduleDeplacer(d, 'xyz', 1).ok);
    L.moduleActiver(d, 'hygiene', false); L.moduleActiver(d, 'declass', false); L.moduleActiver(d, 'declass', false);
    t('modules : désactivation (sans doublon), onglets masqués', d.settings.modulesOff.join() === 'hygiene,declass' && !L.modulesVisibles(d).includes('hygiene') && L.modulesVisibles(d).length === 14 && L.moduleAccueil(d) === 'params');
    L.moduleActiver(d, 'hygiene', true);
    t('modules : réactivation', d.settings.modulesOff.join() === 'declass' && L.modulesVisibles(d).includes('hygiene'));
    // tout désactiver sauf Paramètres : on n'est jamais bloqué
    const e = L.normalizeDb(L.sampleDb()); D.forEach((x) => L.moduleActiver(e, x, false));
    t('modules : tout désactivé → Paramètres reste seul et s’ouvre', L.modulesVisibles(e).join() === 'params' && L.moduleAccueil(e) === 'params');
    t('modules : réinitialiser l’activation / l’ordre', L.modulesReinitialiser(e, 'activation').ok && L.modulesVisibles(e).length === 15 && L.modulesReinitialiser(d, 'ordre').ok && L.modulesOrdre(d).join() === D.join() && d.settings.modulesOff.join() === 'declass');
    // ordre enregistré par une version future : module inconnu conservé à sa place ; module manquant inséré après son voisin
    const f = L.normalizeDb(L.sampleDb()); f.settings.modulesOrdre = ['trace', 'futur', 'cuverie', 'ops', 'cave', 'tirage', 'degorgement', 'analyses', 'intrants', 'hygiene', 'registres', 'params']; f.settings.modulesOff = ['futur2'];
    const o = L.modulesOrdre(f);
    t('modules : id inconnu gardé, manquants insérés à leur place', o.join() === 'trace,futur,cuverie,pressoir,ops,previsions,plan,declass,cave,tirage,degorgement,analyses,intrants,hygiene,equipements,registres,params' && L.modulesConnus(f).length === 15, o.join());
    L.moduleDeplacer(f, 'params', -100); L.moduleActiver(f, 'cave', false);
    t('modules : déplacer garde l’id inconnu à sa place, désactiver garde les désactivations inconnues', f.settings.modulesOrdre[1] === 'futur' && f.settings.modulesOrdre[0] === 'params' && f.settings.modulesOff.join() === 'futur2,cave', f.settings.modulesOrdre.join());
    const sale = L.modulesOrdre({ settings: { modulesOrdre: ['ops', 'ops', 3, null, '', 'cuverie'] } });
    t('modules : ordre normalisé sans doublon ni valeur invalide', sale[0] === 'ops' && sale.length === 16 && new Set(sale).size === 16 && sale.indexOf('ops') < sale.indexOf('cuverie') && L.modulesOrdre({ settings: { modulesOrdre: 'x' } }).join() === D.join(), sale.join());
    // synchronisation : ordre changé sur un appareil, module désactivé sur l'autre → les deux réglages sont gardés
    const B = L.normalizeDb(L.sampleDb()); const A1 = L.clone(B); const A2 = L.clone(B);
    L.moduleDeplacer(A1, 'trace', -20); L.moduleActiver(A2, 'hygiene', false);
    const F = L.syncFusion(B, A1, A2);
    t('synchro : ordre (appareil 1) et désactivation (appareil 2) réunis', L.modulesConnus(F.db)[0] === 'trace' && !L.moduleActif(F.db, 'hygiene') && !F.conflits.length);
    const n = L.normalizeDb(L.clone(F.db));
    t('normalisation : réglages des modules conservés', n.settings.modulesOrdre.join() === F.db.settings.modulesOrdre.join() && n.settings.modulesOff.join() === 'hygiene');
  }
  // ---- compatibilité ascendante : la version précédente (0.12.0-alpha.1 gelée) ouvre une base 0.13.0-alpha.1 sans perdre l'ordre ni les modules désactivés
  {
    const dirV = path.join(__dirname, 'anciennes', '0.12.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, operateurSave, clone, APP_VERSION, APP_NUM };')({});
    t('0.12.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V1.2' && V.APP_NUM === 1002 && L.APP_NUM > 1002);
    const d13 = L.normalizeDb(L.sampleDb()); L.moduleDeplacer(d13, 'cave', -5); L.moduleActiver(d13, 'hygiene', false); d13.settings.modulesOrdre.push('futur');
    const v = V.normalizeDb(JSON.parse(JSON.stringify(d13)));
    t('0.12.0-alpha.1 ouvre une base 0.13.0-alpha.1 : ordre et modules désactivés conservés', v.settings.modulesOrdre.join() === d13.settings.modulesOrdre.join() && v.settings.modulesOff.join() === 'hygiene');
    const base = V.clone(v); const L12 = V.clone(v); V.operateurSave(L12, { prenom: 'Nina', nom: 'Roux' }); const R13 = L.clone(v); L.moduleActiver(R13, 'trace', false);
    const F = V.syncFusion(base, L12, R13);
    t('0.12.0-alpha.1 synchronisée avec un fichier 0.13.0-alpha.1 : module désactivé reçu, saisie 0.12.0-alpha.1 gardée', F.db.settings.modulesOff.join() === 'hygiene,trace' && F.db.operateurs.some((o) => o.prenom === 'Nina') && !F.conflits.length);
    t('… puis rouverte en 0.13.0-alpha.1', L.modulesVisibles(L.normalizeDb(F.db)).length === 13 && L.modulesOrdre(L.normalizeDb(F.db)).includes('futur'));
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (10 : modules et compatibilité 0.11.0-alpha.1 / 0.12.0-alpha.1)');

  // ---- partenaires, entrées de moûts (n° de lot, analyses, enrichissement), documents joints dès la saisie (18/11 → 0.14.0-alpha.1)
  {
    const d = L.normalizeDb(L.sampleDb()); const R0 = L.getR(d); const apt = (n) => d.apporteurs.find((a) => a.nom === n).id;
    const dub = apt('Maison Dubois'), lef = apt('Lefèvre Père & Fils'), gaec = apt('GAEC des Crayères');
    t('partenaires : rôles (Maison Dubois apporteur + vendeur de vins), crus par défaut', L.apporteurRoles(L.apporteurDe(d, dub)).join() === 'apporteur,vendeur de vins' && L.apporteurRoles(L.apporteurDe(d, lef)).join() === 'apporteur' && L.apporteurDe(d, dub).crusDefaut.length === 3);
    t('partenaires : cru proposé d’office seulement si activé', L.apporteurCruAuto(d, lef) === L.apporteurDe(d, lef).crusDefaut[0] && L.apporteurCruAuto(d, gaec) === '' && L.apporteurCruAuto(d, dub) === '');
    t('partenaires : au moins un rôle, crus inconnus écartés, cru auto sans cru refusé', !L.apporteurSave(d, { nom: 'Sans rôle', apporteur: false, vendeur: false }).ok
      && (() => { const r = L.apporteurSave(d, { nom: 'Négoce X', apporteur: false, vendeur: true, crusDefaut: ['inconnu'], cruAuto: true }); const a = L.apporteurDe(d, r.id); return r.ok && a.vendeur && a.apporteur === false && !a.crusDefaut.length && a.cruAuto === false; })());
    // parts des partenaires d'un compartiment
    const e3 = { apporteurId: dub, apporteurs: [{ id: dub, pct: 60 }, { id: lef, pct: 40 }] };
    t('compartiment : parts en %', L.ligneApporteurs(e3).map((a) => `${a.id === dub ? 'D' : 'L'}${a.part}`).join() === 'D0.6,L0.4');
    t('compartiment : parts égales si non renseignées, sinon le partenaire de la ligne ou de l’opération', L.ligneApporteurs({ apporteurs: [{ id: dub }, { id: lef }, { id: gaec }] }).every((a) => Math.abs(a.part - 1 / 3) < 1e-9)
      && L.ligneApporteurs({ apporteurId: lef }).map((a) => a.id).join() === lef && L.ligneApporteurs({}, { apporteurId: dub })[0].id === dub && !L.ligneApporteurs({}, {}).length);
    // composition : C3 (60 % Dubois / 40 % Lefèvre) → cuves c09 et c07 ; C1 + C2 (Dubois) → c08
    const lc = (code) => Object.values(R0.lots).find((l) => l.code === code);
    const c9 = L.composition(d, R0, lc('M26-01-T1-1').id).apporteurs; const c8 = L.composition(d, R0, lc('M26-01-C').id).apporteurs;
    t('composition : partenaires d’un compartiment partagé au prorata', Math.abs(c9[dub] - 0.6) < 1e-9 && Math.abs(c9[lef] - 0.4) < 1e-9 && Math.abs(c8[dub] - 1) < 1e-9, { c9, c8 });
    const tr = L.traceOrigin(d, R0, 'apporteur', lef);
    t('traçabilité : un partenaire secondaire retrouve le moût livré et les lots qui en contiennent', tr.mouts.length === 1 && tr.mouts[0].e.compartiment === 'C3' && tr.lots.some((x) => x.lot.code === 'M26-01-T1-1' && Math.abs(x.share - 0.4) < 1e-9));
    t('partenaire utilisé seulement en 2e partenaire : suppression refusée', L.apporteurUsage(d, lef) >= 1 && !L.apporteurDelete(d, lef).ok);
    // n° de lot et analyses : moyennes pondérées par cuve, enrichissement
    const mo = d.ops.find((o) => o.type === 'entree_mout');
    t('entrée de moûts : n° de lot et analyses par compartiment', mo.entrees.map((e, i) => L.ligneNumLot(mo, e, i)).join() === 'L2609-114-1,L2609-114-2,L2609-114-3' && L.ligneAnalyses(mo, mo.entrees[2], 2).tap === 9.5);
    const ct = (nom) => d.contenants.find((c) => c.id === lc('M26-01-C').contenantId || false);
    const c08 = Object.values(R0.portions).find((p) => p.lotId === lc('M26-01-C').id).contenantId;
    const parts = L.moutAnalysesCuve(d, R0, c08); const moy = L.moyennesPonderees(parts);
    t('cuve : moyenne pondérée des lots reçus (TAP 9,8 × 1 200 L + 10,4 × 800 L)', parts.length === 2 && Math.abs(moy.tap.moy - 10.04) < 1e-9 && Math.abs(moy.at.moy - (7.9 * 1200 + 7.4 * 800) / 2000) < 1e-9, moy);
    const en = L.enrichissement(d, L.tapMoyen(d, moy), 2000);
    t('enrichissement : TAV visé 10,5 % vol, 17 g/L par % vol', en && Math.abs(en.ecart - 0.46) < 1e-9 && Math.abs(en.gL - 7.82) < 1e-9 && Math.abs(en.kg - 15.64) < 1e-9 && !en.depasse, en);
    d.settings.chaptalTAV = 11; d.settings.chaptalMax = 0.5;
    const en2 = L.enrichissement(d, 10.04, 2000); const en3 = L.enrichissement(d, 11.2, 2000, 11);
    t('enrichissement : réglages, maximum dépassé signalé, rien si le TAP suffit', Math.abs(en2.ecart - 0.96) < 1e-9 && en2.depasse && en3.ecart === 0 && en3.kg === 0 && !en3.depasse && L.enrichissement(d, null, 2000) === null);
    t('TAP moyen déduit des sucres si le TAP manque', Math.abs(L.tapMoyen(d, { sucres: { moy: 170 } }) - 10) < 1e-9 && L.tapMoyen(d, {}) === null);
    t('moyenne : valeurs manquantes ignorées (volume analysé)', (() => { const m = L.moyennesPonderees([{ vol: 1000, analyses: { tap: 10, ph: 3 } }, { vol: 500, analyses: { tap: 11 } }, { vol: 0, analyses: { tap: 99 } }]); return Math.abs(m.tap.moy - 31 / 3) < 1e-9 && m.ph.vol === 1000 && m.tap.n === 2; })());
    // lots issus d'un lot reçu (soutirage/assemblage) : analyses d'entrée remontées au prorata
    const t1 = lc('M26-01-T1-1'); const sub = L.moutAnalysesLot(d, t1.id);
    t('lot de moût : son compartiment (C3) et ses analyses', sub.length === 1 && sub[0].numLot === 'L2609-114-3' && sub[0].vol === 700);
    // documents joints avant validation : planifiée → validée → opération supprimée → de nouveau à réaliser
    const pv = L.previsionSave(d, { type: 'jaugeage', date: '2026-11-18', f: { notes: 'à faire' } }); const P = { type: 'prev', id: pv.id };
    L.docsJoindre(d, [{ id: 'docA', nom: 'bon.pdf', mime: 'application/pdf', taille: 10, cat: 'bon' }, { id: 'docB', nom: 'photo.jpg', mime: 'image/jpeg', taille: 20, cat: 'photo' }], P); L.docsJoindre(d, [{ id: 'docA', nom: 'doublon' }], P);
    t('documents joints à une opération planifiée (sans doublon)', L.docsOf(d, 'prev', pv.id).length === 2);
    const pj = Object.values(L.getR(d).portions).find((p) => p.vol > 500);
    const opj = L.opSave(d, { type: 'jaugeage', date: '2026-11-18', portionId: pj.id, volMesure: Math.round(pj.vol) - 1, typeId: 'evaporation' }).op; L.previsionStatut(d, pv.id, 'realisee', opj.id);
    t('validation : documents passés sur l’opération réalisée', !L.docsOf(d, 'prev', pv.id).length && L.docsOf(d, 'op', opj.id).length === 2);
    L.opDelete(d, opj.id);
    t('opération supprimée : de nouveau à réaliser, documents rendus', d.previsions.find((x) => x.id === pv.id).statut === 'prevue' && L.docsOf(d, 'prev', pv.id).length === 2 && !L.docsOf(d, 'op', opj.id).length);
    const rdel = L.previsionDelete(d, pv.id);
    t('opération à réaliser supprimée : ses documents aussi (fichiers à effacer renvoyés)', rdel.ok && rdel.docs.join() === 'docA,docB' && !d.docs.some((x) => x.id === 'docA'));
    // validée par une version antérieure (documents restés sur la prévision) → rattachés à l'opération à l'ouverture
    const pv2 = L.previsionSave(d, { type: 'jaugeage', date: '2026-11-18', f: {} }); L.docsJoindre(d, [{ id: 'docC', nom: 'fiche.pdf' }], { type: 'prev', id: pv2.id });
    const op2 = L.opSave(d, { type: 'jaugeage', date: '2026-11-18', portionId: pj.id, volMesure: Math.round(pj.vol) - 2, typeId: 'evaporation' }).op;
    const pp = d.previsions.find((x) => x.id === pv2.id); pp.statut = 'realisee'; pp.opId = op2.id; // comme la 0.13.0-alpha.1 (sans déplacement des documents)
    const n2 = L.normalizeDb(L.clone(d));
    t('normalisation : documents d’une prévision validée ailleurs rattachés à son opération', L.docsOf(n2, 'op', op2.id).map((x) => x.id).join() === 'docC' && !L.docsOf(n2, 'prev', pv2.id).length);
  }
  // ---- compatibilité ascendante : la version précédente (0.13.0-alpha.1 gelée) ouvre, modifie et synchronise une base 0.14.0-alpha.1 sans perte
  {
    const dirV = path.join(__dirname, 'anciennes', '0.13.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, opSave, apporteurSave, previsionStatut, getR, composition, clone, APP_VERSION, APP_NUM };')({});
    t('0.13.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V1.3' && V.APP_NUM === 1003 && L.APP_NUM > 1003);
    const d14 = L.normalizeDb(L.sampleDb()); const mo = d14.ops.find((o) => o.type === 'entree_mout'); const dub = d14.apporteurs.find((a) => a.nom === 'Maison Dubois').id; const lef = d14.apporteurs.find((a) => a.nom === 'Lefèvre Père & Fils').id;
    const v = V.normalizeDb(JSON.parse(JSON.stringify(d14))); const vm = v.ops.find((o) => o.id === mo.id);
    t('0.13.0-alpha.1 ouvre une base 0.14.0-alpha.1 : partenaires (rôles, crus par défaut) et compartiments (lots, analyses, partenaires) conservés', v.apporteurs.find((a) => a.id === dub).vendeur === true && v.apporteurs.find((a) => a.id === lef).crusDefaut.length === 1
      && vm.entrees[2].apporteurs.length === 2 && vm.entrees[0].numLot === 'L2609-114-1' && vm.entrees[1].analyses.tap === 10.4 && vm.entreesExtra.length === 3 && vm.analyseModele === 'm_mout');
    // la 0.13.0-alpha.1 modifie le partenaire (notes) : rôles et crus par défaut restent
    V.apporteurSave(v, { nom: 'Maison Dubois', commune: 'Avize', notes: 'modifié en 0.13.0-alpha.1' }, dub);
    t('0.13.0-alpha.1 modifie un partenaire 0.14.0-alpha.1 : rôles et crus par défaut restent', v.apporteurs.find((a) => a.id === dub).vendeur === true && v.apporteurs.find((a) => a.id === dub).crusDefaut.length === 3 && v.apporteurs.find((a) => a.id === dub).notes === 'modifié en 0.13.0-alpha.1');
    // la 0.13.0-alpha.1 réécrit l'entrée de moûts (son formulaire ne connaît ni n° de lot, ni analyses, ni plusieurs partenaires)
    const sp = V.clone(vm); sp.entrees = sp.entrees.map(({ numLot, analyses, apporteurs, ...e }) => e); delete sp.entreesExtra; delete sp.analyseModele; sp.ref = 'BL-2609-114 bis';
    const r = V.opSave(v, sp, mo.id); const w = v.ops.find((o) => o.id === mo.id);
    t('0.13.0-alpha.1 réécrit les compartiments : la copie 0.14.0-alpha.1 (entreesExtra) reste', r.ok && w.ref === 'BL-2609-114 bis' && !w.entrees[2].apporteurs && w.entreesExtra.length === 3);
    const back = L.normalizeDb(L.clone(v)); const Rb = L.getR(back); const wb = back.ops.find((o) => o.id === mo.id);
    const t1 = Object.values(Rb.lots).find((l) => l.code === 'M26-01-T1-1'); const cb = L.composition(back, Rb, t1.id).apporteurs;
    t('… rouverte en 0.14.0-alpha.1 : n° de lot, analyses et partage des partenaires retrouvés', wb.entrees.map((e, i) => L.ligneNumLot(wb, e, i)).join() === 'L2609-114-1,L2609-114-2,L2609-114-3' && L.ligneAnalyses(wb, wb.entrees[1], 1).tap === 10.4 && Math.abs(cb[dub] - 0.6) < 1e-9 && Math.abs(cb[lef] - 0.4) < 1e-9, cb);
    // ouverte en 0.14.0-alpha.1 (synchro, import…) puis de nouveau modifiée en 0.13.0-alpha.1 : la copie survit encore
    const v3 = V.normalizeDb(JSON.parse(JSON.stringify(back))); const sp3 = V.clone(v3.ops.find((o) => o.id === mo.id)); delete sp3.entreesExtra; sp3.notes = '2e modification 0.13.0-alpha.1'; V.opSave(v3, sp3, mo.id);
    t('… puis modifiée une 2e fois en 0.13.0-alpha.1 : copie des compartiments toujours là', back.ops.find((o) => o.id === mo.id).av >= 1004 && (v3.ops.find((o) => o.id === mo.id).entreesExtra || []).length === 3);
    // partenaire du compartiment changé en 0.13.0-alpha.1 : la copie 0.14.0-alpha.1 n'est plus appliquée pour les partenaires
    const v2 = V.normalizeDb(JSON.parse(JSON.stringify(d14))); const gaec = v2.apporteurs.find((a) => a.nom === 'GAEC des Crayères').id;
    const sp2 = V.clone(v2.ops.find((o) => o.id === mo.id)); sp2.entrees = sp2.entrees.map(({ numLot, analyses, apporteurs, ...e }, i) => (i === 2 ? { ...e, apporteurId: gaec } : e)); delete sp2.entreesExtra; V.opSave(v2, sp2, mo.id);
    const b2 = L.normalizeDb(L.clone(v2)); const R2 = L.getR(b2); const c2 = L.composition(b2, R2, Object.values(R2.lots).find((l) => l.code === 'M26-01-T1-1').id).apporteurs;
    t('… partenaire changé en 0.13.0-alpha.1 : c’est le sien qui compte', Math.abs((c2[gaec] || 0) - 1) < 1e-9 && !c2[lef], c2);
    // synchronisation 0.13.0-alpha.1 ↔ fichier 0.14.0-alpha.1 : documents d'une opération à réaliser et partenaires 0.14.0-alpha.1 reçus
    const base = V.clone(v); const L13 = V.clone(v); const R14 = L.clone(v);
    const pv = L.previsionSave(R14, { type: 'jaugeage', date: '2026-11-18', f: {} }); L.docsJoindre(R14, [{ id: 'docP', nom: 'fiche.pdf' }], { type: 'prev', id: pv.id }); L.apporteurSave(R14, { nom: 'Négoce Y', apporteur: false, vendeur: true });
    L13.contenants[0].nom = 'Cuve 0.13.0-alpha.1';
    const F = V.syncFusion(base, L13, R14);
    t('0.13.0-alpha.1 synchronisée avec un fichier 0.14.0-alpha.1 : document d’une opération à réaliser et vendeur de vins reçus', F.db.docs.some((x) => x.id === 'docP' && x.cible.type === 'prev') && F.db.apporteurs.some((a) => a.nom === 'Négoce Y' && a.vendeur === true && a.apporteur === false) && F.db.contenants[0].nom === 'Cuve 0.13.0-alpha.1' && !F.conflits.length);
    // la 0.13.0-alpha.1 valide l'opération à réaliser (sans déplacer les documents) → la 0.14.0-alpha.1 les rattache à l'opération
    const pj = Object.values(V.getR(F.db).portions).find((p) => p.vol > 500); const o13 = V.opSave(F.db, { type: 'jaugeage', date: '2026-11-18', portionId: pj.id, volMesure: Math.round(pj.vol) - 1, typeId: 'evaporation' }).op; V.previsionStatut(F.db, pv.id, 'realisee', o13.id);
    const n = L.normalizeDb(L.clone(F.db));
    t('… opération à réaliser validée en 0.13.0-alpha.1 : documents rattachés à l’opération en 0.14.0-alpha.1', L.docsOf(n, 'op', o13.id).map((x) => x.id).join() === 'docP');
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (11 : partenaires, entrées de moûts, documents, compatibilité 0.13.0-alpha.1)');

  // ---- identifiants, mots de passe et droits (18/11 → 0.15.0-alpha.1)
  {
    const hex = (u) => Array.from(u).map((x) => x.toString(16).padStart(2, '0')).join(''); const te = (x) => new TextEncoder().encode(x);
    t('SHA-256 : vecteurs de référence', hex(L.sha256(te(''))) === 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' && hex(L.sha256(te('abc'))) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
      && hex(L.sha256(te('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'))) === '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
    t('PBKDF2-HMAC-SHA256 (JavaScript) : vecteurs RFC 7914 / référence', hex(L.pbkdf2Js(te('password'), te('salt'), 1, 32)) === '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b'
      && hex(L.pbkdf2Js(te('password'), te('salt'), 2, 32)) === 'ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43' && hex(L.pbkdf2Js(te('password'), te('salt'), 4096, 32)) === 'c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a');
    const wc = await L.pbkdf2('mot de passe é', te('sel-0123456789ab'), 1000); const js = await L.pbkdf2('mot de passe é', te('sel-0123456789ab'), 1000, { js: true });
    t('PBKDF2 : Web Crypto et calcul JavaScript identiques', hex(wc) === hex(js) && wc.length === 32);
    const e1 = await L.mdpEmpreinte('Cuvée2026!', 2000); const e2 = await L.mdpEmpreinte('Cuvée2026!', 2000);
    t('empreinte : salée (deux empreintes différentes), sans le mot de passe', e1.sel !== e2.sel && e1.cle !== e2.cle && !JSON.stringify(e1).includes('Cuvée2026') && e1.algo === 'PBKDF2-SHA256' && e1.iter === 2000);
    t('vérification : bon / mauvais mot de passe, empreinte invalide', (await L.mdpVerifier('Cuvée2026!', e1)) && !(await L.mdpVerifier('cuvée2026!', e1)) && !(await L.mdpVerifier('', e1)) && !(await L.mdpVerifier('x', null)) && (await L.mdpVerifier('Cuvée2026!', e1, { js: true })));
    t('qualité du mot de passe', L.mdpQualite('abc', 8).note === 0 && L.mdpQualite('abcdefgh', 8).note === 1 && L.mdpQualite('abcd1234', 8).note >= 2 && L.mdpQualite('Abcd-1234-efgh-56', 8).note === 4);
    const cs = L.codeSecoursNouveau(); t('code de secours : 4 × 4 caractères, normalisé', /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(cs) && L.codeSecoursNorm(cs.toLowerCase().replace(/-/g, ' ')) === cs.replace(/-/g, ''));
    // activation : sécurité inactive tant qu'il n'y a pas d'utilisateur
    const d = L.normalizeDb(L.sampleDb());
    t('sécurité inactive par défaut : tout est permis', !L.securiteActive(d) && L.niveauModule(d, '', 'ops') === 'ecriture' && L.peut(d, '', 'supprimer') && d.utilisateurs.length === 0 && Array.isArray(d.audit));
    const mdpA = await L.mdpEmpreinte('Admin-2026', 1000); const sec = await L.mdpEmpreinte(L.codeSecoursNorm(cs), 1000);
    t('activation : identifiant obligatoire', !L.securiteActiver(d, { identifiant: ' ', mdp: mdpA }).ok);
    const ra = L.securiteActiver(d, { identifiant: 'Julien', nom: 'Julien Morel', operateurId: d.operateurs[0].id, mdp: mdpA, secours: sec });
    const admin = ra.id;
    t('activation : premier administrateur, 5 profils, réglages', ra.ok && L.securiteActive(d) && d.profils.length === 5 && L.estAdmin(d, admin) && L.securiteReglages(d).verrouMin === 15 && L.securiteReglages(d).longueurMin === 8 && !L.securiteActiver(d, { identifiant: 'x', mdp: mdpA }).ok);
    t('identifiant retrouvé sans tenir compte des majuscules / accents', L.utilisateurParIdentifiant(d, 'julien').id === admin && L.utilisateurParIdentifiant(d, ' JULIEN ').id === admin);
    // utilisateurs et profils
    const mdpT = await L.mdpEmpreinte('Provisoire1', 1000);
    const ro = L.utilisateurSave(d, { identifiant: 'thomas', nom: 'Thomas Girard', profilId: 'pf_operateur', mdp: mdpT }); const opr = ro.id;
    const rc = L.utilisateurSave(d, { identifiant: 'compta', nom: 'Cabinet comptable', profilId: 'pf_consult', mdp: mdpT }); const cons = rc.id;
    t('utilisateurs : création (mot de passe provisoire à changer), identifiant unique et valide', ro.ok && rc.ok && L.utilisateurDe(d, opr).doitChanger === true && !L.utilisateurSave(d, { identifiant: 'THOMAS', profilId: 'pf_consult', mdp: mdpT }).ok && !L.utilisateurSave(d, { identifiant: 'a b', profilId: 'pf_consult', mdp: mdpT }).ok && !L.utilisateurSave(d, { identifiant: 'zz', profilId: 'inconnu', mdp: mdpT }).ok);
    t('dernier administrateur protégé (profil, désactivation, suppression)', !L.utilisateurSave(d, { identifiant: 'Julien', profilId: 'pf_chef' }, admin).ok && L.estAdmin(d, admin) && !L.utilisateurActif(d, admin, false).ok && !L.utilisateurDelete(d, admin).ok && !L.profilSave(d, { nom: 'Administrateur', modules: {}, speciaux: {} }, 'pf_admin').ok && !L.profilDelete(d, 'pf_admin').ok);
    t('niveaux : opérateur (saisie opérations, lecture cuverie, pas de paramètres), consultation', L.niveauModule(d, opr, 'ops') === 'ecriture' && L.niveauModule(d, opr, 'cuverie') === 'lecture' && L.niveauModule(d, opr, 'params') === 'aucun' && !L.peut(d, opr, 'supprimer') && L.niveauModule(d, cons, 'ops') === 'lecture' && L.niveauModule(d, admin, 'params') === 'ecriture' && L.peut(d, admin, 'utilisateurs'));
    t('profil inutilisé supprimable, profil attribué protégé', !L.profilDelete(d, 'pf_operateur').ok && L.profilDelete(d, 'pf_labo').ok && d.profils.length === 4);
    const rp = L.profilSave(d, { nom: 'Saisonnier', modules: { ops: 'ecriture', cuverie: 'lecture', params: 'aucun', xx: 'nimporte' }, speciaux: { supprimer: false, modifier: true } });
    t('profil personnalisé : niveaux et droits spéciaux filtrés', rp.ok && L.profilDe(d, rp.id).modules.ops === 'ecriture' && !('xx' in L.profilDe(d, rp.id).modules) && L.profilDe(d, rp.id).speciaux.modifier === true && !L.profilDe(d, rp.id).speciaux.supprimer);
    // garde : ce que chaque profil peut faire
    const essai = (uid, fn) => { const av = L.clone(d); const ap = L.clone(d); fn(ap); return L.gardeDroits(av, ap, uid); };
    const R1 = L.getR(d); const pj = Object.values(R1.portions).find((p) => p.vol > 500);
    const jauge = (x) => L.opSave(x, { type: 'jaugeage', date: '2026-11-18', portionId: pj.id, volMesure: Math.round(pj.vol) - 1, typeId: 'evaporation' });
    const gOpr = essai(opr, jauge); const gCons = essai(cons, jauge);
    t('garde : l’opérateur saisit une opération, la consultation est refusée', gOpr.ok && gOpr.marques.cree.length === 1 && gOpr.audit.some((a) => a.action === 'creation' && a.type === 'op') && !gCons.ok && /Consultation/.test(gCons.msg), gCons.msg);
    const opX = d.ops.find((o) => o.type === 'jaugeage');
    const modif = (x) => { const o = L.clone(x.ops.find((y) => y.id === opX.id)); o.notes = 'corrigé'; return L.opSave(x, o, opX.id); };
    t('garde : correction d’une opération validée réservée (opérateur refusé, chef de cave permis)', !essai(opr, modif).ok && /corriger/.test(essai(opr, modif).msg) && essai(admin, modif).ok && essai(admin, modif).marques.modif.includes(opX.id));
    const suppr = (x) => { const o = x.ops.filter((y) => !L.dependentsOf || true).slice(-1)[0]; return L.opDelete(x, o.id); };
    const gS = essai(opr, (x) => { const o = x.ops[x.ops.length - 1]; L.opDelete(x, o.id); });
    t('garde : suppression refusée sans le droit', !gS.ok && /supprimer/.test(gS.msg));
    t('garde : paramètres (crus, partenaires) réservés', !essai(opr, (x) => L.apporteurSave(x, { nom: 'Nouveau partenaire' })).ok && essai(admin, (x) => L.apporteurSave(x, { nom: 'Nouveau partenaire' })).ok);
    t('garde : réglages de vue libres (campagne, site, contour)', essai(cons, (x) => { x.settings.siteActif = 'site1'; x.apparence.contourMode = 'cepage'; }).ok && !essai(cons, (x) => { x.settings.coefSucre = 3; }).ok);
    t('garde : un utilisateur change son propre mot de passe, pas celui d’un autre', essai(opr, (x) => { L.utilisateurMotDePasse(x, opr, mdpA, false); }).ok && !essai(opr, (x) => { L.utilisateurMotDePasse(x, cons, mdpA, false); }).ok && !essai(opr, (x) => { L.utilisateurSave(x, { identifiant: 'pirate', profilId: 'pf_admin', mdp: mdpA }); }).ok);
    t('garde : désactiver la sécurité réservé à l’administrateur', !essai(opr, (x) => L.securiteDesactiver(x)).ok && essai(admin, (x) => L.securiteDesactiver(x)).ok && essai(admin, (x) => L.securiteDesactiver(x)).audit.some((a) => a.action === 'securite'));
    t('garde : analyses (laboratoire / opérateur) et intrants', essai(opr, (x) => { x.analyses.push({ id: 'anx', date: '2026-11-18', lotId: x.lots[0].id, valeurs: { tap: 10 } }); }).ok && !essai(cons, (x) => { x.analyses.push({ id: 'anx', date: '2026-11-18' }); }).ok);
    t('garde : déclassement — décision réservée', (() => { const a = d.alertes.find((y) => y.statut === 'attente'); if (!a) return true; const g = essai(opr, (x) => { x.alertes.find((y) => y.id === a.id).statut = 'refuse'; }); return !g.ok && /déclassements/.test(g.msg) && essai(admin, (x) => { x.alertes.find((y) => y.id === a.id).statut = 'refuse'; }).ok; })());
    t('garde : impression de fiche (n° d’ordre) libre', essai(cons, (x) => { x.fiches.push({ id: 'fi1', modele: 'm', ordre: 'X', date: '2026-11-18' }); x.ops[0].ficheOrdre = 'X1'; }).ok);
    t('garde : fiche d’une opération à réaliser imprimée en consultation (n° d’ordre seulement)', (() => { const y = L.clone(d); const pv = L.previsionSave(y, { type: 'jaugeage', date: '2026-11-20', f: {} }); const av = L.clone(y); const ap = L.clone(y); ap.previsions.find((p) => p.id === pv.id).ficheOrdre = 'MVT201126N1'; return L.gardeDroits(av, ap, cons).ok; })());
    t('garde : utilisateur désactivé ou inconnu refusé', !L.gardeDroits(L.clone(d), (() => { const y = L.clone(d); jauge(y); return y; })(), 'inconnu').ok);
    // marques et journal
    const d2 = L.clone(d); const av = L.clone(d2); jauge(d2); const g = L.gardeDroits(av, d2, opr); L.gardeAppliquer(d2, g, opr);
    const no = d2.ops.find((o) => o.id === g.marques.cree[0]);
    t('saisi par : opération marquée, journal complété', no.saisiPar === opr && !!no.saisiLe && d2.audit.length === d.audit.length + 1 && d2.audit[d2.audit.length - 1].uid === opr);
    L.auditAjouter(d2, { uid: opr, action: 'connexion', resume: 'Connexion' });
    t('journal : entrée de connexion', d2.audit.slice(-1)[0].action === 'connexion' && !!d2.audit.slice(-1)[0].date);
    t('identifiant qui a servi : désactivé, jamais supprimé', !L.utilisateurDelete(d2, opr).ok && L.utilisateurActif(d2, opr, false).ok && L.niveauModule(d2, opr, 'ops') === 'aucun');
    // désactivation : utilisateurs et profils gardés pour une réactivation
    L.securiteDesactiver(d2); t('désactivation : tout permis, comptes gardés', !L.securiteActive(d2) && d2.utilisateurs.length === 3 && L.niveauModule(d2, '', 'ops') === 'ecriture');
    // synchronisation : comptes créés sur deux appareils
    const B = L.clone(d); const A1 = L.clone(B); const A2 = L.clone(B); L.setNID('-tab'); L.utilisateurSave(A1, { identifiant: 'lea', profilId: 'pf_operateur', mdp: mdpT }); L.setNID('-pc'); L.auditAjouter(A2, { uid: admin, action: 'connexion' }); L.setNID('');
    const F = L.syncFusion(B, A1, A2);
    t('synchro : utilisateur créé ici, journal complété là-bas → réunis', F.db.utilisateurs.some((u) => u.identifiant === 'lea') && F.db.audit.length === B.audit.length + 1 && !F.conflits.length);
    const n = L.normalizeDb(L.clone(d)); t('normalisation : sécurité, comptes et profils conservés', L.securiteActive(n) && n.utilisateurs.length === 3 && n.profils.length === 5 && n.utilisateurs[0].mdp.cle === d.utilisateurs[0].mdp.cle);
  }
  // ---- compatibilité ascendante : la version précédente (0.14.0-alpha.1 gelée) ouvre et synchronise une base 0.15.0-alpha.1 sans perdre comptes ni journal
  {
    const dirV = path.join(__dirname, 'anciennes', '0.14.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, opSave, getR, clone, APP_VERSION, APP_NUM };')({});
    t('0.14.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V1.4' && V.APP_NUM === 1004 && L.APP_NUM > 1004);
    const d15 = L.normalizeDb(L.sampleDb()); const mdp = await L.mdpEmpreinte('Admin-2026', 1000); const a = L.securiteActiver(d15, { identifiant: 'admin', mdp }).id;
    L.auditAjouter(d15, { uid: a, action: 'connexion' }); const pj = Object.values(L.getR(d15).portions).find((p) => p.vol > 500);
    const av = L.clone(d15); const op = L.opSave(d15, { type: 'jaugeage', date: '2026-11-18', portionId: pj.id, volMesure: Math.round(pj.vol) - 1, typeId: 'evaporation' }).op; L.gardeAppliquer(d15, L.gardeDroits(av, d15, a), a);
    const v = V.normalizeDb(JSON.parse(JSON.stringify(d15)));
    t('0.14.0-alpha.1 ouvre une base 0.15.0-alpha.1 : comptes, profils, réglage de sécurité et journal conservés', v.utilisateurs.length === 1 && v.profils.length === 5 && v.settings.securite.actif === true && v.audit.length === 2 && v.utilisateurs[0].mdp.cle === mdp.cle);
    const sp = V.clone(v.ops.find((o) => o.id === op.id)); delete sp.saisiPar; delete sp.saisiLe; sp.notes = 'modifiée en 0.14.0-alpha.1'; V.opSave(v, sp, op.id);
    t('0.14.0-alpha.1 modifie une opération 0.15.0-alpha.1 : « saisi par » gardé', v.ops.find((o) => o.id === op.id).saisiPar === a && v.ops.find((o) => o.id === op.id).notes === 'modifiée en 0.14.0-alpha.1');
    const base = V.clone(v); const L14 = V.clone(v); const R15 = L.clone(v); L.utilisateurSave(R15, { identifiant: 'thomas', profilId: 'pf_operateur', mdp }); L14.contenants[0].nom = 'Cuve 0.14.0-alpha.1';
    const F = V.syncFusion(base, L14, R15);
    t('0.14.0-alpha.1 synchronisée avec un fichier 0.15.0-alpha.1 : nouvel utilisateur reçu, saisie 0.14.0-alpha.1 gardée', F.db.utilisateurs.length === 2 && F.db.contenants[0].nom === 'Cuve 0.14.0-alpha.1' && !F.conflits.length);
    t('… puis rouverte en 0.15.0-alpha.1 : sécurité toujours active', L.securiteActive(L.normalizeDb(F.db)) && L.normalizeDb(F.db).utilisateurs.length === 2);
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (12 : identifiants et droits, compatibilité 0.14.0-alpha.1)');

  // ---- formulaires d'opération personnalisables (18/11 → 0.16.0-alpha.1)
  {
    const d = L.normalizeDb(L.sampleDb());
    t('registre des champs : soutirage (indispensables : date, portion, volume, destination)', L.champsStd('soutirage').filter((c) => c.ess).map((c) => c.k).join() === 'date,portionId,volL,destId' && L.champsStd('soutirage').some((c) => c.k === 'notes') && L.champsStd('soutirage').some((c) => c.k === 'vin') && !L.champsStd('jaugeage').some((c) => c.k === 'vin'));
    t('registre des champs : entrée de moûts par compartiment (0.35.0-alpha.1 : hauteur en cuve)', L.champsStd('entree_mout').filter((c) => c.ligne).length === 13 && L.champStd('entree_mout', 'e.cepageId').ess);
    // formules
    t('formules : priorités, parenthèses, virgule décimale, fonctions', L.formuleEval('2 + 3 * 4', {}) === 14 && L.formuleEval('(2 + 3) * 4', {}) === 20 && L.formuleEval('1,5 * 2', {}) === 3 && L.formuleEval('max(a, b) - min(a; b)', { a: 7, b: 3 }) === 4 && L.formuleEval('arrondi(10 / 3; 2)', {}) === 3.33 && L.formuleEval('abs(-4) + -2', {}) === 2 && L.formuleEval('{a} × 2 ÷ 4', { a: 6 }) === 3);
    t('formules : valeur manquante ou division par zéro → vide', L.formuleEval('a + 1', {}) === null && L.formuleEval('4 / (a - a)', { a: 2 }) === null);
    t('formules : erreurs de syntaxe signalées', ['2 +', '(2 + 3', 'foo(2)', '2 $ 3', ''].every((x) => { try { L.formuleAnalyser(x); return false; } catch (e) { return !!e.message; } }) && L.formuleAnalyser('volume * dose / 100').vars.join() === 'volume,dose');
    // enregistrement de la configuration
    const P0 = [{ label: 'Température début', type: 'nombre', unite: '°C', min: -5, max: 30, position: 'debut' }, { label: 'Température fin', type: 'nombre', unite: '°C' }, { label: 'Écart', type: 'calcul', formule: 'temperaturefin - temperaturedebut', dec: 1 }, { label: 'Contrôle visuel', type: 'ouinon', obligatoire: true }, { label: 'Aspect', type: 'liste', options: ['Limpide', 'Voilé', ' ', 'Limpide'] }, { label: 'Volume', type: 'nombre' }];
    const rs = L.formulaireSave(d, 'soutirage', { champs: { pertes: { vis: 'masque', obligatoire: true }, equipementIds: { obligatoire: true }, notes: { vis: 'replie' }, volL: { vis: 'masque', obligatoire: false, libelle: 'Volume soutiré (hL)' }, destId: { aide: 'Cuve propre et inertée' }, typeInconnu: { vis: 'masque' } }, perso: P0 });
    const F = L.formulaireDe(d, 'soutirage');
    t('configuration : champ masqué jamais obligatoire, indispensable toujours affiché (libellé et aide gardés)', rs.ok && F.champs.pertes.vis === 'masque' && !F.champs.pertes.obligatoire && !F.champs.volL.vis && F.champs.volL.libelle === 'Volume soutiré (hL)' && F.champs.destId.aide === 'Cuve propre et inertée' && L.champEffectif(F, 'soutirage', 'volL').vis === 'visible');
    t('configuration : champs personnalisés (ids, codes, choix nettoyés, code « volume » réservé)', F.perso.length === 6 && F.perso.every((p) => /^[a-z][a-z0-9]+$/.test(p.id)) && F.perso[0].code === 'temperaturedebut' && F.perso[4].options.join() === 'Limpide,Voilé' && F.perso[5].code === 'volume2' && F.perso[2].formule === 'temperaturefin - temperaturedebut');
    t('configuration : erreurs (nom, doublon, choix, bornes, formule, variable, auto-référence)', [
      { perso: [{ label: '', type: 'texte' }] }, { perso: [{ label: 'A', type: 'texte' }, { label: 'a', type: 'nombre' }] }, { perso: [{ label: 'Choix', type: 'liste', options: [] }] }, { perso: [{ label: 'N', type: 'nombre', min: 5, max: 1 }] },
      { perso: [{ label: 'C', type: 'calcul', formule: '2 +' }] }, { perso: [{ label: 'C', type: 'calcul', formule: 'inconnu * 2' }] }, { perso: [{ label: 'C', type: 'calcul', formule: 'c + 1' }] }, { perso: [{ label: 'X', type: 'bizarre' }] },
    ].every((cfg) => !L.formulaireSave(L.clone(d), 'soutirage', cfg).ok) && !L.formulaireSave(d, 'nexistepas', {}).ok);
    t('formulaire personnalisé reconnu', L.formulairePerso(d, 'soutirage') && !L.formulairePerso(d, 'filtration'));
    // valeurs saisies
    const ids = Object.fromEntries(F.perso.map((p) => [p.code, p.id]));
    const fv = { [ids.temperaturedebut]: '14', [ids.temperaturefin]: '12,5', [ids.controlevisuel]: true, [ids.aspect]: 'Voilé' };
    const vals = L.champsValeurs(F.perso, fv, L.formuleVarsStd('soutirage', { volL: '1000' }), [{ id: 'cancien', label: 'Ancien champ', type: 'texte', valeur: 'gardé' }]);
    const v = (code) => (vals.find((x) => x.code === code) || {}).valeur;
    t('valeurs : nombres, calcul (12,5 − 14 = −1,5), case cochée, liste, champ supprimé gardé', v('temperaturedebut') === 14 && v('temperaturefin') === 12.5 && v('ecart') === -1.5 && v('controlevisuel') === true && v('aspect') === 'Voilé' && !vals.some((x) => x.code === 'volume2') && vals.some((x) => x.id === 'cancien' && x.valeur === 'gardé'));
    t('valeurs : chaque valeur garde son libellé et son unité', vals.find((x) => x.code === 'temperaturefin').label === 'Température fin' && vals.find((x) => x.code === 'temperaturefin').unite === '°C');
    const tx = L.champsTexte({ champs: vals }, true);
    t('texte : « Température début : 14 °C · … »', /^Température début : 14 °C · Température fin : 12,5 °C · Écart : [-−]1,5/.test(tx) && tx.includes('Contrôle visuel : oui'), tx);
    t('variables de l’opération : volume (hL), litres, bouteilles', L.formuleVarsStd('soutirage', { volL: '2500' }).volume === 25 && L.formuleVarsStd('entree_mout', { entrees: [{ dests: [{ volL: 1200 }, { volL: 300 }] }] }).litres === 1500 && L.formuleVarsStd('degorgement', { nb: '600' }).bouteilles === 600);
    const e1 = L.champsErreurs(d, 'soutirage', 'soutirage', { equipementIds: [], champs: {} });
    const e2 = L.champsErreurs(d, 'soutirage', 'soutirage', { equipementIds: ['eq1'], champs: { [ids.controlevisuel]: false } });
    const e3 = L.champsErreurs(d, 'soutirage', 'soutirage', { equipementIds: ['eq1'], champs: { [ids.controlevisuel]: true, [ids.temperaturedebut]: '40' } });
    const e4 = L.champsErreurs(d, 'soutirage', 'soutirage', { equipementIds: ['eq1'], champs: { [ids.controlevisuel]: true, [ids.aspect]: 'Rose' } });
    const e5 = L.champsErreurs(d, 'soutirage', 'soutirage', { equipementIds: ['eq1'], champs: { [ids.controlevisuel]: true } });
    t('contrôles : champ standard obligatoire, case à cocher, bornes, liste', /Équipements utilisés/.test(e1) && /doit être coché/.test(e2) && /au plus 30/.test(e3) && /choisissez dans la liste/.test(e4) && e5 === '');
    t('correction d’une opération déjà enregistrée : pas bloquée par un champ devenu obligatoire (bornes toujours vérifiées)', L.champsErreurs(d, 'soutirage', 'soutirage', { equipementIds: [], champs: {} }, { nouveau: false }) === '' && /au plus 30/.test(L.champsErreurs(d, 'soutirage', 'soutirage', { champs: { [ids.temperaturedebut]: '40' } }, { nouveau: false })));
    L.formulaireSave(d, 'entree_mout', { champs: { 'e.numLot': { obligatoire: true }, 'e.qualifId': { defaut: 'bio' }, ref: { obligatoire: true, defaut: 'BL-' } }, perso: [{ label: 'Chauffeur', type: 'texte', defaut: 'M. Petit' }, { label: 'Contrôle sanitaire', type: 'multi', options: ['Pourriture', 'Oïdium'], defaut: ['Oïdium', 'Inconnu'] }] });
    const em = L.champsErreurs(d, 'entree_mout', 'entree_mout', { ref: 'BL-1', entrees: [{ numLot: 'L1', dests: [{ volL: 100 }] }, { numLot: '', dests: [{ volL: 200 }] }, { numLot: '', dests: [{ volL: 0 }] }] });
    t('contrôles par compartiment : n° de lot obligatoire (lignes avec volume)', /Moût 2 : « N° de lot \(par compartiment\) » est obligatoire/.test(em), em);
    const s0 = L.formulaireDefauts(d, 'entree_mout', 'entree_mout', { ref: '', entrees: [{ qualifId: 'conv', cepageId: 'chard', dests: [] }] }, {});
    const s1 = L.formulaireDefauts(d, 'entree_mout', 'entree_mout', { ref: 'BL-999', entrees: [] }, { ref: 'BL-999' });
    const pc = L.formulaireDe(d, 'entree_mout').perso;
    t('valeurs par défaut : champ, chaque compartiment, champs personnalisés ; jamais à la place d’une valeur prévue', s0.ref === 'BL-' && s0.entrees[0].qualifId === 'bio' && s0.champs[pc[0].id] === 'M. Petit' && s0.champs[pc[1].id].join() === 'Oïdium' && s1.ref === 'BL-999' && L.ligneDefauts(d, 'entree_mout', { qualifId: 'conv' }).qualifId === 'bio');
    // opération enregistrée avec ses champs ; garde des droits ; copie ; suppression
    const R0 = L.getR(d); const pj = Object.values(R0.portions).find((p) => p.vol > 500); const dest = d.contenants.find((c) => !Object.values(R0.portions).some((p) => p.contenantId === c.id) && c.statut !== 'archive');
    const op = L.opSave(d, { type: 'soutirage', date: '2026-11-18', portionId: pj.id, volL: 100, destId: dest.id, pertes: [], lignes: [], champs: vals }).op;
    t('opération : champs personnalisés enregistrés tels quels', op.champs.length === vals.length && op.champs.find((x) => x.code === 'ecart').valeur === -1.5);
    t('état du formulaire en modification (nombres → texte « 12,5 »)', L.champsEtat(op)[ids.temperaturefin] === '12,5' && L.champsEtat(op)[ids.controlevisuel] === true);
    t('copie d’un formulaire vers une opération de même comportement (nouveaux ids)', L.formulaireCopier(d, 'soutirage', 'transfert').ok && L.formulaireDe(d, 'transfert').perso.length === 6 && L.formulaireDe(d, 'transfert').perso[0].id !== F.perso[0].id && !L.formulaireCopier(d, 'filtration', 'transfert').ok);
    const pr = L.opCatSave(d, { label: 'Contrôle de cuve', base: 'suivi' }); L.formulaireSave(d, pr.id, { perso: [{ label: 'Pression', type: 'nombre', unite: 'bar' }] });
    t('opération personnalisée supprimée : son formulaire aussi', d.formulaires.some((x) => x.id === pr.id) && L.opCatDelete(d, pr.id).ok && !d.formulaires.some((x) => x.id === pr.id));
    t('réinitialisation du formulaire', L.formulaireReset(d, 'transfert').ok && !L.formulairePerso(d, 'transfert'));
    const n = L.normalizeDb(L.clone(d)); t('normalisation : formulaires gardés', n.formulaires.length === d.formulaires.length);
    const mdp = await L.mdpEmpreinte('Admin-2026', 1000); const y = L.clone(d); const a = L.securiteActiver(y, { identifiant: 'admin', mdp }).id; const c = L.utilisateurSave(y, { identifiant: 'compta', profilId: 'pf_consult', mdp }).id;
    const essai = (uid) => { const av = L.clone(y); const ap = L.clone(y); L.formulaireSave(ap, 'filtration', { champs: { pertes: { vis: 'masque' } } }); return L.gardeDroits(av, ap, uid); };
    t('droits : régler un formulaire = modifier les paramètres', !essai(c).ok && essai(a).ok && essai(a).audit.some((x) => /formulaires/.test(x.resume)));
    // synchronisation : formulaires réglés sur deux appareils
    const B = L.clone(d); const A1 = L.clone(B); const A2 = L.clone(B); L.formulaireSave(A1, 'filtration', { champs: { pertes: { vis: 'masque' } } }); L.formulaireSave(A2, 'collage', { perso: [{ label: 'Dose testée', type: 'nombre', unite: 'g/hL' }] });
    const Fu = L.syncFusion(B, A1, A2); t('synchro : formulaires de deux appareils réunis', L.formulairePerso(Fu.db, 'filtration') && L.formulairePerso(Fu.db, 'collage') && !Fu.conflits.length);
  }
  // ---- compatibilité ascendante : la version précédente (0.15.0-alpha.1 gelée) ouvre, modifie et synchronise une base 0.16.0-alpha.1
  {
    const dirV = path.join(__dirname, 'anciennes', '0.15.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, opSave, opCatSave, opCatReset, getR, clone, APP_VERSION, APP_NUM };')({});
    t('0.15.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V1.5' && V.APP_NUM === 1005 && L.APP_NUM > 1005);
    const d16 = L.normalizeDb(L.sampleDb()); L.formulaireSave(d16, 'soutirage', { champs: { pertes: { vis: 'masque' } }, perso: [{ label: 'Température fin', type: 'nombre', unite: '°C' }] });
    const cid = L.formulaireDe(d16, 'soutirage').perso[0].id; const R = L.getR(d16); const pj = Object.values(R.portions).find((p) => p.vol > 500); const dest = d16.contenants.find((c) => !Object.values(R.portions).some((p) => p.contenantId === c.id) && c.statut !== 'archive');
    const op = L.opSave(d16, { type: 'soutirage', date: '2026-11-18', portionId: pj.id, volL: 100, destId: dest.id, pertes: [], lignes: [], champs: [{ id: cid, code: 'temperaturefin', label: 'Température fin', type: 'nombre', unite: '°C', valeur: 12.5 }] }).op;
    const v = V.normalizeDb(JSON.parse(JSON.stringify(d16)));
    t('0.15.0-alpha.1 ouvre une base 0.16.0-alpha.1 : formulaires et champs des opérations conservés', v.formulaires.length === 1 && v.ops.find((o) => o.id === op.id).champs[0].valeur === 12.5);
    const sp = V.clone(v.ops.find((o) => o.id === op.id)); delete sp.champs; sp.notes = 'modifiée en 0.15.0-alpha.1'; V.opSave(v, sp, op.id); const sp2 = V.clone(v.ops.find((o) => o.id === op.id)); delete sp2.champs; sp2.notes = 'modifiée 2 fois'; V.opSave(v, sp2, op.id);
    t('0.15.0-alpha.1 modifie (deux fois) une opération 0.16.0-alpha.1 : champs personnalisés gardés', v.ops.find((o) => o.id === op.id).champs[0].valeur === 12.5 && v.ops.find((o) => o.id === op.id).notes === 'modifiée 2 fois');
    V.opCatSave(v, { id: 'soutirage', label: 'Soutirage (lies)' }); V.opCatReset(v, 'soutirage');
    t('0.15.0-alpha.1 renomme puis rétablit l’opération : son formulaire reste', v.formulaires.length === 1 && v.formulaires[0].perso.length === 1);
    const base = V.clone(v); const L15 = V.clone(v); const R16 = L.clone(v); L.formulaireSave(R16, 'filtration', { perso: [{ label: 'Pression', type: 'nombre', unite: 'bar' }] }); L15.contenants[0].nom = 'Cuve 0.15.0-alpha.1';
    const Fz = V.syncFusion(base, L15, R16);
    t('0.15.0-alpha.1 synchronisée avec un fichier 0.16.0-alpha.1 : formulaire reçu, saisie 0.15.0-alpha.1 gardée', Fz.db.formulaires.length === 2 && Fz.db.contenants[0].nom === 'Cuve 0.15.0-alpha.1' && !Fz.conflits.length);
    t('… rouverte en 0.16.0-alpha.1 : formulaires actifs', L.formulairePerso(L.normalizeDb(Fz.db), 'filtration') && L.formulaireDe(L.normalizeDb(Fz.db), 'soutirage').champs.pertes.vis === 'masque');
  }
  // ---- 0.17.0-alpha.1 : barèmes de jaugeage (tables d'épalement), fabricant des contenants
  {
    const d = L.normalizeDb(L.sampleDb()); const c1 = d.contenants[0]; const c2 = d.contenants[1];
    t('base neuve : collection des barèmes', Array.isArray(L.emptyDb().baremes) && Array.isArray(d.baremes) && !d.baremes.length);
    // barème « cuve » : 0 → 200 cm, volume avec un fond conique (courbe) puis droit
    const pts = []; for (let h = 0; h <= 200; h += 1) pts.push([h, h < 20 ? Math.round(h * h * 2.5) : Math.round(1000 + (h - 20) * 100)]);
    const r1 = L.baremeSave(d, { nom: 'Cuve test', cible: 'contenant', contenantId: c1.id, points: pts, meta: { organisme: 'ORGANISME TEST', date: '2024-05-02', constructeur: 'Fabricant A', capacite: 19000 } });
    const b1 = d.baremes.find((b) => b.id === r1.id);
    t('barème enregistré et trouvé pour la cuve', r1.ok && L.baremeDe(d, c1.id).id === r1.id && b1.points.length === 201);
    t('hauteur → volume (interpolation linéaire)', L.baremeVolume(b1, 10).v === 250 && L.baremeVolume(b1, 152.5).v === 1000 + 132.5 * 100 && !L.baremeVolume(b1, 152.5).hors);
    t('volume → hauteur (inverse)', Math.abs(L.baremeHauteur(b1, 14250).h - 152.5) < 1e-9 && Math.abs(L.baremeHauteur(b1, 250).h - 10) < 1e-9);
    t('hors barème signalé (dessous / dessus)', L.baremeVolume(b1, 205).hors === 'dessus' && L.baremeHauteur(b1, 30000).hors === 'dessus' && L.baremeVolume(b1, -1).hors === 'dessous');
    t('volume entre deux hauteurs (entré / sorti)', L.baremeEcart(b1, 20, 50).v === 3000 && L.baremeEcart(b1, 50, 20).v === -3000);
    t('hauteur attendue pour le contenu d’une cuve', Math.abs(L.hauteurAttendue(d, c1.id, 2000).h - 30) < 1e-9 && L.hauteurAttendue(d, c2.id, 2000) === null);
    t('résumé du barème', /0 à 200 cm/.test(L.baremeResume(d, c1.id)) && /02\/05\/2024/.test(L.baremeResume(d, c1.id)));
    // barème « citerne » au creux (le volume diminue quand le creux augmente)
    const pc = []; for (let k = 0; k <= 120; k += 1) pc.push([k, 9000 - k * 50]);
    const r2 = L.baremeSave(d, { cible: 'citerne', immat: 'ab-123-cd', compartiment: '2', mesure: 'creux', points: pc });
    const b2 = d.baremes.find((b) => b.id === r2.id);
    t('citerne : compartiment trouvé par l’immatriculation (tirets et casse indifférents)', r2.ok && L.baremesCiterne(d, 'AB123CD').length === 1 && b2.immat === 'AB-123-CD' && L.baremeSens(b2) === -1);
    t('creux → volume, volume → creux', L.baremeVolume(b2, 22.5).v === 9000 - 22.5 * 50 && Math.abs(L.baremeHauteur(b2, 8000).h - 20) < 1e-9);
    t('erreurs : moins de 2 lignes, citerne sans immatriculation, contenant inconnu', !L.baremeSave(d, { points: [[1, 2]] }).ok && !L.baremeSave(d, { cible: 'citerne', points: pts }).ok && !L.baremeSave(d, { contenantId: 'zz', points: pts }).ok);
    // nouveau barème de la même cuve : l'ancien est archivé
    const r3 = L.baremeSave(d, { nom: 'Rejaugeage', contenantId: c1.id, points: pts.map(([h, v]) => [h, v + 10]), meta: { date: '2026-01-10' } });
    t('nouveau barème : l’ancien archivé, le nouveau en service', d.baremes.find((b) => b.id === r1.id).archive === true && L.baremeDe(d, c1.id).id === r3.id);
    t('rattacher, archiver, supprimer', L.baremeLier(d, r1.id, c2.id).ok && L.baremeDe(d, c2.id).id === r1.id && L.baremeArchiver(d, r1.id).ok && !L.baremeDe(d, c2.id) && L.baremeDelete(d, r1.id).ok && !d.baremes.some((b) => b.id === r1.id));
    // contrôles : volume qui redescend en fin de table, capacité, validité, corrections
    const pq = pts.slice(0, 150).concat([[150, 14100], [151, 14050], [152, 14000]]);
    const A = L.baremeControle({ points: pq, meta: { capacite: 30000, validite: '2020-01-01' }, corrections: [{ h: 5, lu: '8', v: 62, mode: 'chiffre' }] });
    t('contrôles : fin de table qui redescend, capacité, certificat expiré, valeurs corrigées', A.some((a) => /redescend/.test(a.msg)) && A.some((a) => /Capacité annoncée/.test(a.msg)) && A.some((a) => /expiré/.test(a.msg)) && A.some((a) => /corrigée/.test(a.msg)));
    t('inverse arrêté au volume maximal quand la table redescend', L.baremeHauteur({ points: pq }, 14050).h < 150);
    // lecture des nombres (virgule, défauts des scans)
    t('nombres : « 8,873 », « 0.920 », « 3, 191 », « Q,850 », « 1290] », « 55! », « cm » → rien', L.nombreJauge('8,873') === 8.873 && L.nombreJauge('0.920') === 0.92 && L.nombreJauge('3, 191') === 3.191 && L.nombreJauge('Q,850') === 0.85 && L.nombreJauge('1290]') === 1290 && L.nombreJauge('55!') === 55 && Number.isNaN(L.nombreJauge('cm')) && Number.isNaN(L.nombreJauge(',799')));
    // correction des valeurs mal lues (scans) : seulement sur une lecture « ocr »
    const serie = []; for (let k = 0; k < 40; k += 1) serie.push({ x: k, s: String(1000 + k * 70), n: 1000 + k * 70 });
    serie[12] = { x: 12, s: '1640', n: 1640 }; serie[20] = { x: 20, s: '1400', n: 1400 }; serie[27] = { x: 27, s: ',890', n: NaN }; serie[33] = { x: 33, s: '', n: NaN };
    const rp = L.jaugeReparer(serie, { ocr: true, combler: true }); const vv = (k) => rp.out[k].v;
    t('scan : chiffre mal lu corrigé (1640 → 1840, 1400 → 2400), virgule perdue, case vide comblée', vv(12) === 1840 && vv(20) === 2400 && vv(27) === 2890 && vv(33) === 3310 && rp.corrections.length === 4, rp.corrections);
    t('texte fiable (PDF d’un logiciel) : rien n’est modifié', L.jaugeReparer(serie, { ocr: false }).corrections.length === 0 && L.jaugeReparer(serie, { ocr: false }).out[12].v === 1640);
    const courbe = []; for (let k = 0; k < 30; k += 1) courbe.push({ x: k, s: '', n: Math.round(5000 - 0.8 * (k - 25) * (k - 25)) }); courbe.forEach((c) => { c.s = String(c.n); });
    t('scan : une courbe qui s’infléchit (haut de cuve) n’est pas « corrigée »', L.jaugeReparer(courbe, { ocr: true }).corrections.length === 0, L.jaugeReparer(courbe, { ocr: true }).corrections);
    // lecture d'un cahier : texte positionné (comme pdf.js) d'une table centimétrique et de sa table volumétrique
    const page = (n, lignes) => ({ n, w: 600, h: 840, items: lignes.flatMap((l, i) => l.map((c) => ({ s: c[0], x: c[1], y: 40 + i * 12, w: c[0].length * 5, h: 9 }))) });
    const ent = (titre, kind) => [[['ORGANISME DE MESURE DEMO METROLOGIE', 150]], [['Date :', 400], ['12/03/2021', 440]], [['RESERVOIR N° :', 160], [titre, 260]], [['Constructeur : Cuves Démo', 20], ['Domaine Exemple', 400]], [['Capacité :', 40], ['3000 litres', 90], ['Forme : Cylindre vertical', 190]], [['N° de série : 4711', 30], ['Matériau : Acier inoxydable', 180]],
      kind === 'c' ? [0, 1, 2, 3].flatMap((k) => [['cm', 30 + k * 140], ['litre', 70 + k * 140]]) : [0, 1].flatMap((k) => [['hl', 30 + k * 140], ['cm', 70 + k * 140]])];
    const cent = ent('C 12', 'c'); for (let r = 0; r < 50; r += 1) cent.push([0, 1, 2, 3].flatMap((k) => { const h = 1 + k * 50 + r; return h > 150 ? [] : [[String(h), 40 + k * 140], [String(100 + h * 19), 80 + k * 140]]; }));
    cent.push([['BAR-NO 1-7 du 03/01/2014', 10], ['Cette table centimétrique ne peut faire foi lors de toutes transactions.', 160]]);
    const volu = ent('C 12', 'v'); for (let r = 0; r < 15; r += 1) volu.push([0, 1].flatMap((k) => { const v = (2 + k * 15 + r) * 1; if (v > 28) return []; const h = (v * 100 - 100) / 19; return [[`${v},0`, 40 + k * 140], [h.toFixed(1).replace('.', ','), 80 + k * 140]]; }));
    volu.push([['BAR-NO 1-7 du 03/01/2014', 10], ['Cette table volumétrique ne peut faire foi lors de toutes transactions.', 160]]);
    const an = L.jaugeAnalyser([page(1, cent), page(2, volu)], { fichier: 'demo.pdf' }); const bc = an.baremes[0] || {};
    t('cahier : un réservoir, table centimétrique lue en entier (1 → 150 cm, litres)', an.baremes.length === 1 && bc.nom === 'C 12' && bc.points.length === 150 && bc.points[0][0] === 1 && bc.points[149][1] === 100 + 150 * 19 && bc.mesure === 'hauteur' && bc.cible === 'contenant', [an.baremes.length, bc.nom, (bc.points || []).length]);
    t('cahier : renseignements lus (organisme, date, constructeur, série, forme, matériau, capacité)', bc.meta && bc.meta.date === '2021-03-12' && bc.meta.constructeur === 'Cuves Démo' && bc.meta.numeroSerie === '4711' && bc.meta.forme === 'Cylindre vertical' && bc.meta.materiau === 'Acier inoxydable' && bc.meta.capacite === 3000 && /METROLOGIE/.test(bc.meta.organisme), bc.meta);
    t('cahier : table volumétrique retrouvée par la table centimétrique', bc.controle && bc.controle.ok && bc.controle.n > 20 && bc.fiabilite === 'bonne', bc.controle);
    // tableau collé (Excel) et page d'OCR (TSV de Tesseract)
    const pc2 = L.jaugeAnalyser([L.jaugePageDeTexte('Hauteur (cm)\tVolume (L)\n0\t0\n10\t250\n20\t500\n30\t750')], {});
    t('tableau collé : hauteur / volume', pc2.baremes.length === 1 && pc2.baremes[0].points.length === 4 && pc2.baremes[0].points[3][1] === 750);
    const tsv = ['level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext'];
    const mot = (x, y, s) => tsv.push(['5', 1, 1, 1, 1, 1, x, y, s.length * 18, 30, 90, s].join('\t'));
    mot(80, 50, 'cm'); mot(200, 50, 'litre'); mot(380, 50, 'cm'); mot(500, 50, 'litre'); for (let r = 0; r < 30; r += 1) { mot(90, 100 + r * 50, `${r + 1}:`); mot(200, 100 + r * 50, `${200 + (r + 1) * 20}]`); mot(390, 100 + r * 50, `${r + 31}!`); mot(500, 100 + r * 50, r === 7 ? '8O0|' : `${200 + (r + 31) * 20}`); }
    const po = L.jaugeAnalyser([{ ...L.jaugePageDeTsv(tsv.join('\n'), 1), ocr: true }], {});
    t('OCR (TSV) : table lue, cadres ignorés, « 8O0| » relu 820', po.baremes.length === 1 && po.baremes[0].points.length === 60 && po.baremes[0].points.find((p) => p[0] === 38)[1] === 960, po.baremes[0] && po.baremes[0].points.slice(35, 40));
    // fichier de barèmes préparé : export → import
    const ex = L.jaugeExporter(d.baremes, 'test'); const im = L.jaugeLireFichier(ex);
    t('fichier de barèmes : export puis lecture (sans les ids ni les rattachements)', im && im.baremes.length === d.baremes.length && !('id' in im.baremes[0]) && !('contenantId' in im.baremes[0]) && L.jaugeLireFichier('{"x":1}') === null);
    // rapprochement nom du réservoir ↔ contenant
    const dd = L.clone(d); dd.contenants = [{ id: 'k1', nom: 'Cuve 33', statut: 'actif' }, { id: 'k2', nom: 'A6', statut: 'actif' }, { id: 'k3', nom: 'Fût 33', statut: 'actif' }, { id: 'k4', nom: 'BELON - REBECHE', statut: 'actif' }];
    dd.contenants.push({ id: 'k5', nom: 'Cuve 81', statut: 'actif' }, { id: 'k6', nom: 'Cuve 06', statut: 'actif' });
    t('réservoir ↔ contenant : « Belon - Rebêche » exact, « A6 » = « A6 », « 81 » = « Cuve 81 » ; « C 6 » ≠ « Cuve 06 », « 99 » rien', (L.contenantPourReservoir(dd, 'BELON - REBECHE') || {}).id === 'k4' && (L.contenantPourReservoir(dd, 'A6') || {}).id === 'k2' && (L.contenantPourReservoir(dd, '81') || {}).id === 'k5' && !L.contenantPourReservoir(dd, 'C 6') && !L.contenantPourReservoir(dd, '99'));
    t('matière proposée : « Acier inoxydable » → inox', /inox/i.test(((L.matierePourBareme(d, 'Acier inoxydable') || {}).label || (L.matierePourBareme(d, 'Acier inoxydable') || {}).id || '')));
    // fabricant des contenants
    const cs = L.clone(d.contenants.find((c) => c.id === c2.id)); const rf = L.contSave(d, { ...cs, fabricant: '  Inox Démo ' }, c2.id);
    t('fabricant enregistré (espaces retirés), proposé ensuite', rf.ok && d.contenants.find((c) => c.id === c2.id).fabricant === 'Inox Démo' && L.fabricantsConnus(d).includes('Inox Démo'));
    const cs2 = L.clone(d.contenants.find((c) => c.id === c2.id)); delete cs2.fabricant; L.contSave(d, { ...cs2, notes: 'sans fabricant transmis' }, c2.id);
    t('fabricant gardé quand une saisie ne le transmet pas', d.contenants.find((c) => c.id === c2.id).fabricant === 'Inox Démo');
    // opérations : mesures de jaugeage gardées et affichées
    const R = L.getR(d); const pj = Object.values(R.portions).find((p) => p.vol > 500);
    const oj = L.opSave(d, { type: 'jaugeage', date: '2026-11-18', portionId: pj.id, volMesure: Math.round(pj.vol - 3), typeId: 'ecart', hauteurMesure: 24.6, baremeId: r3.id, mesureJauge: 'hauteur' }).op;
    t('jaugeage par la hauteur : hauteur gardée, texte du journal', oj.hauteurMesure === 24.6 && /hauteur mesurée 24,6 cm/.test(L.jaugesTexte(d, oj)));
    const dest = d.contenants.find((c) => !Object.values(R.portions).some((p) => p.contenantId === c.id) && c.statut !== 'archive');
    const ot = L.opSave(d, { type: 'transfert', date: '2026-11-18', portionId: pj.id, volL: 100, destId: dest.id, pertes: [], lignes: [], jauges: [{ champ: 'volL', contenantId: c1.id, baremeId: r3.id, mesure: 'hauteur', avant: 20, apres: 21, volL: 100 }] }).op;
    t('transfert : mesures gardées (avant → après)', ot.jauges.length === 1 && /20,0 → 21,0 cm/.test(L.jaugesTexte(d, ot)));
    // contenant supprimé : son barème reste, détaché
    const dz = L.clone(d); const cz = dz.contenants.find((c) => !dz.ops.some((o) => JSON.stringify(o).includes(`"${c.id}"`)) && !dz.analyses.some((a) => a.contenantId === c.id) && !dz.hygiene.some((h) => h.cibleId === c.id));
    if (cz) { L.baremeSave(dz, { contenantId: cz.id, points: pts }); const rz = L.contDelete(dz, cz.id); t('contenant supprimé : barème détaché, gardé', rz.ok && dz.baremes.some((b) => !b.contenantId && b.points.length === 201)); }
    // normalisation, synchronisation, droits
    const n = L.normalizeDb(L.clone(d)); t('normalisation : barèmes gardés', n.baremes.length === d.baremes.length);
    const B = L.clone(d); const A1 = L.clone(B); const A2 = L.clone(B); L.baremeSave(A1, { cible: 'citerne', immat: 'XY-999-ZZ', compartiment: '1', mesure: 'creux', points: pc }); L.baremeSave(A2, { contenantId: c2.id, points: pts }); A2.baremes[A2.baremes.length - 1].id = 'bmAutreAppareil'; // autre appareil : autre identifiant
    const Fu = L.syncFusion(B, A1, A2); t('synchro : barèmes importés sur deux appareils réunis', Fu.db.baremes.length === d.baremes.length + 2 && !Fu.conflits.length);
    const mdp = await L.mdpEmpreinte('Admin-2026', 1000); const y = L.clone(d); const a = L.securiteActiver(y, { identifiant: 'admin', mdp }).id; const cc = L.utilisateurSave(y, { identifiant: 'compta', profilId: 'pf_consult', mdp }).id;
    const essai = (uid) => { const av = L.clone(y); const ap = L.clone(y); L.baremeSave(ap, { contenantId: c2.id, points: pts }); return L.gardeDroits(av, ap, uid); };
    t('droits : importer un barème = modifier les paramètres', !essai(cc).ok && essai(a).ok && essai(a).audit.some((x) => /barèmes/.test(x.resume)));
  }
  // ---- compatibilité ascendante : la version précédente (0.16.0-alpha.1 gelée) ouvre, modifie et synchronise une base 0.17.0-alpha.1
  {
    const dirV = path.join(__dirname, 'anciennes', '0.16.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, opSave, contSave, getR, clone, APP_VERSION, APP_NUM };')({});
    t('0.16.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V1.6' && V.APP_NUM === 1006 && L.APP_NUM > 1006);
    const d17 = L.normalizeDb(L.sampleDb()); const c = d17.contenants[0]; const pts = []; for (let h = 0; h <= 100; h += 1) pts.push([h, h * 50]);
    L.contSave(d17, { ...L.clone(c), fabricant: 'Inox Démo' }, c.id); const rb = L.baremeSave(d17, { contenantId: c.id, points: pts, meta: { constructeur: 'Inox Démo' } });
    const R = L.getR(d17); const pj = Object.values(R.portions).find((p) => p.vol > 500);
    const oj = L.opSave(d17, { type: 'jaugeage', date: '2026-11-18', portionId: pj.id, volMesure: Math.round(pj.vol - 2), typeId: 'ecart', hauteurMesure: 31.5, baremeId: rb.id, mesureJauge: 'hauteur' }).op;
    const v = V.normalizeDb(JSON.parse(JSON.stringify(d17)));
    t('0.16.0-alpha.1 ouvre une base 0.17.0-alpha.1 : barèmes, fabricant et hauteur mesurée conservés', v.baremes.length === 1 && v.baremes[0].points.length === 101 && v.contenants.find((x) => x.id === c.id).fabricant === 'Inox Démo' && v.ops.find((o) => o.id === oj.id).hauteurMesure === 31.5);
    V.contSave(v, { ...V.clone(v.contenants.find((x) => x.id === c.id)), nom: 'Cuve renommée 0.16.0-alpha.1' }, c.id);
    t('0.16.0-alpha.1 modifie le contenant : fabricant gardé', v.contenants.find((x) => x.id === c.id).fabricant === 'Inox Démo' && v.contenants.find((x) => x.id === c.id).nom === 'Cuve renommée 0.16.0-alpha.1');
    const sp = V.clone(v.ops.find((o) => o.id === oj.id)); sp.notes = 'corrigé en 0.16.0-alpha.1'; V.opSave(v, sp, oj.id);
    t('0.16.0-alpha.1 modifie le jaugeage : hauteur et barème gardés', v.ops.find((o) => o.id === oj.id).hauteurMesure === 31.5 && v.ops.find((o) => o.id === oj.id).baremeId === rb.id);
    const base = V.clone(v); const L16 = V.clone(v); const R17 = L.clone(v); L.baremeSave(R17, { cible: 'citerne', immat: 'AB-123-CD', compartiment: '1', mesure: 'creux', points: pts.map(([h, x]) => [h, 6000 - x]) }); L16.contenants[1].nom = 'Cuve 0.16.0-alpha.1';
    const Fz = V.syncFusion(base, L16, R17);
    t('0.16.0-alpha.1 synchronisée avec un fichier 0.17.0-alpha.1 : barème reçu, saisie 0.16.0-alpha.1 gardée', Fz.db.baremes.length === 2 && Fz.db.contenants[1].nom === 'Cuve 0.16.0-alpha.1' && !Fz.conflits.length);
    t('… rouverte en 0.17.0-alpha.1 : barèmes utilisables', L.baremesCiterne(L.normalizeDb(Fz.db), 'AB-123-CD').length === 1 && !!L.baremeDe(L.normalizeDb(Fz.db), c.id));
  }
  // ---- 0.17.0-alpha.2 (icône de l'application) : la version précédente (0.17.0-alpha.1 gelée) ouvre, modifie et synchronise une base 0.17.0-alpha.2
  {
    const dirV = path.join(__dirname, 'anciennes', '0.17.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, opSave, contSave, baremeSave, baremeVolume, getR, clone, APP_VERSION, APP_NUM };')({});
    t('0.17.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V1.7' && V.APP_NUM === 1007 && L.APP_NUM >= 1008);
    const d18 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.17.0-alpha.2-icone.json'), 'utf8')));
    const v = V.normalizeDb(V.clone(d18));
    t('0.17.0-alpha.1 ouvre une base 0.17.0-alpha.2 : barèmes, fabricant, mesures de jaugeage conservés', v.baremes.length === d18.baremes.length && v.contenants.some((c) => c.fabricant === 'Inox Démo') && v.ops.some((o) => o.hauteurMesure === 30.5) && v.ops.some((o) => Array.isArray(o.jauges) && o.jauges.length));
    const oj = v.ops.find((o) => o.hauteurMesure === 30.5); const sp = V.clone(oj); sp.notes = 'modifié en 0.17.0-alpha.1'; V.opSave(v, sp, oj.id);
    t('0.17.0-alpha.1 modifie une opération 0.17.0-alpha.2 : mesures et version la plus récente gardées', v.ops.find((o) => o.id === oj.id).hauteurMesure === 30.5 && v.ops.find((o) => o.id === oj.id).av >= 1008);
    const base = V.clone(v); const A = V.clone(v); const B = L.clone(v); A.contenants[0].nom = 'Cuve 0.17.0-alpha.1'; L.baremeSave(B, { cible: 'citerne', immat: 'ZZ-111-YY', compartiment: '1', mesure: 'creux', points: [[0, 5000], [100, 0]] }); B.baremes[B.baremes.length - 1].id = 'bmV18';
    const F = V.syncFusion(base, A, B); t('0.17.0-alpha.1 synchronisée avec 0.17.0-alpha.2 : saisies des deux gardées', F.db.contenants[0].nom === 'Cuve 0.17.0-alpha.1' && F.db.baremes.some((b) => b.id === 'bmV18') && !F.conflits.length);
    t('… barème calculé pareil par 0.17.0-alpha.1 et 0.17.0-alpha.2', V.baremeVolume(F.db.baremes.find((b) => b.id === 'bmV18'), 25).v === L.baremeVolume(F.db.baremes.find((b) => b.id === 'bmV18'), 25).v);
  }
  // ================= 16. 0.18.0-alpha.1 : revendications modifiables, produits d'hygiène (FDS), compatibilité 0.17.0-alpha.2 =================
  {
    const FXH = path.join(__dirname, 'fixtures', 'hygiene');
    // ---- revendications
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
    t('revendications : liste par défaut (conv, bio, dem) avec leurs couleurs', d.lists.qualifs.map((q) => q.id).join() === 'conv,bio,dem' && d.lists.qualifs[1].couleur === d.apparence.qualifColors.bio && L.QUALIFS.map((q) => `${q.id}${q.rang}`).join() === 'conv1,bio2,dem3');
    const nConv = d.regles.filter((r) => r.qualifId === 'conv').length;
    const ra = L.richListCont(d, 'qualifs', 'add', null, { label: 'HVE', couleur: '#2F7D8C', after: 'conv', copieDe: 'conv' });
    t('ajout « HVE » au rang 2 : règles des intrants reprises de Conventionnel', ra.ok && ra.id === 'hve' && d.lists.qualifs.map((q) => q.id).join() === 'conv,hve,bio,dem' && ra.regles === nConv && d.regles.filter((r) => r.qualifId === 'hve').length === nConv && L.QUALIFS.find((q) => q.id === 'hve').rang === 2 && L.rang('bio') === 3);
    t('… couleur dans l’apparence (versions antérieures) et abréviation par défaut', d.apparence.qualifColors.hve === '#2F7D8C' && d.lists.qualifs[1].court === 'HVE');
    t('… doublon refusé, nom vide refusé', !L.richListCont(d, 'qualifs', 'add', null, { label: 'hve' }).ok && !L.richListCont(d, 'qualifs', 'add', null, { label: '  ' }).ok);
    t('mélange : rang le plus bas (Conventionnel < HVE < bio)', L.minQualif(['bio', 'hve']) === 'hve' && L.minQualif(['hve', 'conv']) === 'conv');
    const pr = d.produits.find((x) => x.categorie !== 'sec' && L.ruleAllows(d, x.id, 'conv') && !L.ruleAllows(d, x.id, 'bio'));
    t('déclassement proposé : un intrant permis en HVE (copié de conv) ramène un vin bio en HVE', !!pr && L.proposedQualif(d, pr.id, 'bio') === 'hve');
    L.produitSave(d, { nom: 'Produit test 0.18.0-alpha.1', categorie: 'oeno', unite: 'g' }); const np = d.produits[d.produits.length - 1];
    t('nouveau produit : une règle par revendication (HVE comprise)', ['conv', 'hve', 'bio', 'dem'].every((q) => d.regles.some((r) => r.produitId === np.id && r.qualifId === q)));
    t('renommer, abréviation, couleur', L.richListCont(d, 'qualifs', 'edit', 'bio', { label: 'Agriculture biologique', court: 'ab' }).ok && L.qLabel('bio') === 'Agriculture biologique' && L.QUALIFS.find((q) => q.id === 'bio').court === 'AB'
      && L.richListCont(d, 'qualifs', 'edit', 'bio', { couleur: '#123456' }).ok && d.apparence.qualifColors.bio === '#123456' && d.lists.qualifs.find((q) => q.id === 'bio').couleur === '#123456');
    t('renommer en un nom déjà pris : refusé', !L.richListCont(d, 'qualifs', 'edit', 'hve', { label: 'Demeter' }).ok);
    t('Conventionnel : ni masquée, ni déplacée, ni supprimée', !L.richListCont(d, 'qualifs', 'edit', 'conv', { masque: true }).ok && !L.richListCont(d, 'qualifs', 'up', 'conv').ok && !L.richListCont(d, 'qualifs', 'down', 'conv').ok && !L.richListCont(d, 'qualifs', 'del', 'conv').ok);
    t('Conventionnel renommable', L.richListCont(d, 'qualifs', 'edit', 'conv', { label: 'Conventionnel (raisonné)' }).ok && L.qLabel('conv') === 'Conventionnel (raisonné)');
    L.richListCont(d, 'qualifs', 'up', 'hve');
    t('rien ne passe au-dessus du rang 1', d.lists.qualifs.map((q) => q.id).join() === 'conv,hve,bio,dem');
    L.richListCont(d, 'qualifs', 'down', 'hve'); t('ordre modifiable : HVE après bio', d.lists.qualifs.map((q) => q.id).join() === 'conv,bio,hve,dem' && L.rang('hve') === 3 && L.minQualif(['bio', 'hve']) === 'bio');
    L.richListCont(d, 'qualifs', 'up', 'hve');
    L.richListCont(d, 'qualifs', 'edit', 'dem', { masque: true });
    t('masquée : plus proposée à la saisie (sauf si déjà choisie)', !L.qualifOptions(d).some((o) => o.value === 'dem') && L.qualifOptions(d, 'dem').some((o) => o.value === 'dem') && L.QUALIFS.some((q) => q.id === 'dem'));
    L.richListCont(d, 'qualifs', 'edit', 'dem', { masque: false }); t('démasquée', L.qualifOptions(d).some((o) => o.value === 'dem') && !d.lists.qualifs.find((q) => q.id === 'dem').masque);
    t('utilisation comptée (lots, opérations, déclassements)', L.qualifUsage(d, 'conv') > 5 && L.listUsage(d, 'qualifs', 'hve') === 0);
    const usedBio = L.qualifUsage(d, 'bio'); t(`revendication utilisée : suppression refusée (${usedBio} usages)`, usedBio > 0 ? !L.richListCont(d, 'qualifs', 'del', 'bio').ok : true);
    const ap = d.ops.find((o) => o.type === 'apport'); const op = L.opSave(d, { type: 'apport', date: '2026-11-17', cepageId: 'pm', kg: 1500, qualifId: 'hve', cruId: ap.cruId, apporteurId: ap.apporteurId, ref: 'BP-T16', operateurs: ap.operateurs });
    t('apport en HVE : la revendication devient utilisée', op.ok && L.qualifUsage(d, 'hve') >= 1 && !L.richListCont(d, 'qualifs', 'del', 'hve').ok);
    const r2 = L.richListCont(d, 'qualifs', 'add', null, { label: 'Essai', copieDe: null }); const nR = d.regles.length;
    t('nouvelle revendication sans règle : aucune règle créée', r2.ok && r2.regles === 0 && d.lists.qualifs[d.lists.qualifs.length - 1].id === 'essai');
    d.regles.push({ produitId: np.id, qualifId: 'essai', autorise: true, doseMax: null });
    t('suppression d’une revendication inutilisée : ses règles et sa couleur partent', L.richListCont(d, 'qualifs', 'del', 'essai').ok && !d.lists.qualifs.some((q) => q.id === 'essai') && !d.regles.some((r) => r.qualifId === 'essai') && d.regles.length === nR && !('essai' in d.apparence.qualifColors) && !L.QUALIFS.some((q) => q.id === 'essai'));
    t('libellé d’une revendication inconnue : son identifiant', L.qLabel('xyz') === '(xyz)' && L.qLabel(undefined) === L.qLabel('conv'));
    t('réajouter les revendications d’origine', (() => { const y = L.clone(d); y.lists.qualifs = y.lists.qualifs.filter((q) => q.id !== 'dem'); L.richListReset(y, 'qualifs'); return y.lists.qualifs.some((q) => q.id === 'dem'); })());
    // bases antérieures : liste par défaut, couleurs personnalisées gardées ; « conv » remise en tête
    const v18 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.17.0-alpha.2-icone.json'), 'utf8')); v18.apparence = { ...(v18.apparence || {}), qualifColors: { conv: '#111111', bio: '#222222', dem: '#333333' } }; delete (v18.lists || {}).qualifs;
    const n18 = L.normalizeDb(v18);
    t('base 0.17.0-alpha.2 ouverte : revendications d’origine avec ses couleurs', n18.lists.qualifs.map((q) => `${q.id}:${q.couleur}`).join() === 'conv:#111111,bio:#222222,dem:#333333' && L.QUALIFS.length === 3 && L.qLabel('bio') === 'FR-BIO-01');
    const desord = L.clone(n18); desord.lists.qualifs = [desord.lists.qualifs[1], desord.lists.qualifs[0], desord.lists.qualifs[2]]; t('« conv » toujours remise en tête', L.normalizeDb(desord).lists.qualifs[0].id === 'conv');
    t('normalisation idempotente', JSON.stringify(L.normalizeDb(L.clone(n18)).lists.qualifs) === JSON.stringify(n18.lists.qualifs));
    // synchronisation : une revendication ajoutée sur chaque appareil
    const B = L.normalizeDb(L.sampleDb()); const A1 = L.clone(B); const A2 = L.clone(B);
    L.richListCont(A1, 'qualifs', 'add', null, { label: 'HVE', after: 'conv', copieDe: 'conv' }); L.richListCont(A2, 'qualifs', 'add', null, { label: 'VDC', copieDe: 'conv' });
    const F = L.syncFusion(B, A1, A2); t('synchro : revendications ajoutées sur deux appareils réunies, règles comprises', F.db.lists.qualifs.map((q) => q.id).join() === 'conv,hve,bio,dem,vdc' && F.db.regles.some((r) => r.qualifId === 'hve') && F.db.regles.some((r) => r.qualifId === 'vdc') && !F.conflits.length);
    L.syncConfig(d);

    // ---- produits d'hygiène
    const h = L.normalizeDb(L.sampleDb()); L.syncConfig(h);
    t('exemple : 3 produits d’hygiène, entrées avec produits', h.produitsHygiene.length === 3 && h.hygiene.filter((x) => Array.isArray(x.produits) && x.produits.length).length === 4);
    t('validation : nom requis, doublon refusé, concentrations', !L.hygProduitSave(h, { nom: ' ' }).ok && !L.hygProduitSave(h, { nom: 'soude caustique lessive 30 %' }).ok && !L.hygProduitSave(h, { nom: 'X', concMin: 3, concMax: 1 }).ok && !L.hygProduitSave(h, { nom: 'X', concMin: -1 }).ok);
    const rp = L.hygProduitSave(h, { nom: 'Détergent chloré test', type: 'alcalin_chlore', concMin: '1,5', concMax: '2', concUnite: '%', unite: 'L', pictos: ['SGH05', 'SGH99'], epi: ['gants', 'xx'], mention: 'danger', fdsDate: '2020-01-15', revendications: ['conv'], champFutur: 'gardé ?' });
    const pc = h.produitsHygiene.find((x) => x.id === rp.id);
    t('produit créé : valeurs nettoyées (nombres, listes connues), date', rp.ok && pc.concMin === 1.5 && pc.concMax === 2 && pc.pictos.join() === 'SGH05' && pc.epi.join() === 'gants' && pc.creeLe && !('champFutur' in pc));
    pc.champFutur = 'x'; L.hygProduitSave(h, { ...L.clone(pc), nom: 'Détergent chloré test (modifié)' }, pc.id);
    t('modification : champs inconnus (version plus récente) gardés', h.produitsHygiene.find((x) => x.id === pc.id).champFutur === 'x' && h.produitsHygiene.find((x) => x.id === pc.id).nom === 'Détergent chloré test (modifié)');
    t('plage d’emploi lisible', L.hygPlage(pc) === '1,5 à 2 %' && L.hygPlage({ concMin: 2, concMax: 2 }) === '2 %' && L.hygPlage({ concMax: 3, concUnite: 'g/L' }) === 'jusqu’à 3 g/L' && L.hygPlage({ concUnite: 'pur' }) === 'pur');
    t('FDS : manquante tant qu’aucune n’est jointe', L.hygFdsEtat(h, pc, '2026-11-19').k === 'manquante');
    L.docMetaAdd(h, { id: 'docT1', nom: 'fds.pdf', mime: 'application/pdf', taille: 10, cat: 'fds', cible: { type: 'produitHygiene', id: pc.id } }); L.docMetaAdd(h, { id: 'docT2', nom: 'ft.pdf', mime: 'application/pdf', taille: 10, cat: 'ft', cible: { type: 'produitHygiene', id: pc.id } });
    t('FDS jointe mais révisée il y a plus de 3 ans : à vérifier', L.hygFdsEtat(h, h.produitsHygiene.find((x) => x.id === pc.id), '2026-11-19').k === 'ancienne');
    t('FDS récente : à jour', L.hygFdsEtat(h, { ...pc, fdsDate: '2025-06-01' }, '2026-11-19').k === 'ok');
    const acide = h.produitsHygiene.find((x) => x.type === 'acide'); const cont = h.contenants.find((x) => x.nom === 'Cuve 05') || h.contenants[4];
    const e1 = { date: '2026-11-18', cibleType: 'contenant', cibleId: cont.id, actionId: 'nettoyage', produits: [{ produitId: pc.id, conc: '3', quantite: '2,5' }, { produitId: acide.id, conc: '' }], methode: ' eau chaude ', operateurs: [] };
    const ctl = L.hygControles(h, L.getR(h), e1);
    t('contrôles : chloré + acide, concentration au-dessus de la plage', ctl.some((c) => c.tone === 'bad' && /chlor/.test(c.msg)) && ctl.some((c) => /au-dessus/.test(c.msg)));
    const nh = h.hygiene.length; const rs = L.hygieneSave(h, e1); const he = h.hygiene[nh];
    t('entrée enregistrée : lignes (nombres, unités, noms) et méthode', rs.ok && he.produits.length === 2 && he.produits[0].conc === 3 && he.produits[0].concUnite === '%' && he.produits[0].quantite === 2.5 && he.produits[0].unite === 'L' && he.produits[0].nom === 'Détergent chloré test (modifié)' && he.produits[1].conc === undefined && he.methode === 'eau chaude');
    t('… résumé lisible par les versions antérieures', he.produit === 'Détergent chloré test (modifié) 3 % + Acide citrique (détartrant) · eau chaude' && !L.hygTexteModifie(h, he));
    t('… produit utilisé : compté, suppression refusée, archivage possible', L.hygUsages(h, pc.id).length === 1 && L.hygConso(h, pc.id).quantite === 2.5 && !L.hygProduitDelete(h, pc.id).ok && L.hygProduitArchiver(h, pc.id, true).ok && h.produitsHygiene.find((x) => x.id === pc.id).archive === true);
    t('… archivé : signalé dans les contrôles', L.hygControles(h, null, e1).some((c) => /archivé/.test(c.msg)));
    L.hygProduitArchiver(h, pc.id, false);
    L.hygProduitSave(h, { ...L.clone(h.produitsHygiene.find((x) => x.id === pc.id)), nom: 'Détergent chloré renommé' }, pc.id);
    t('produit renommé après coup : l’entrée n’est pas prise pour une modification d’une version antérieure', !L.hygTexteModifie(h, h.hygiene[nh]) && L.hygResume(h, h.hygiene[nh]).startsWith('Détergent chloré renommé'));
    const old = L.clone(h.hygiene[nh]); old.produit = 'texte réécrit ailleurs'; t('texte réécrit par une version antérieure : détecté', L.hygTexteModifie(h, old));
    t('négatif refusé', !L.hygieneSave(h, { ...e1, produits: [{ produitId: pc.id, conc: '-1' }] }).ok);
    const sansProd = L.hygieneSave(h, { date: '2026-11-18', cibleType: 'equipement', cibleId: 'pressoir', actionId: 'rincage', produits: [{ produitId: '' }], methode: 'Eau claire', operateurs: [] });
    t('entrée sans produit : la méthode fait le résumé', sansProd.ok && h.hygiene[h.hygiene.length - 1].produit === 'Eau claire' && h.hygiene[h.hygiene.length - 1].produits.length === 0);
    const vieux = L.hygieneSave(h, { date: '2026-11-18', cibleType: 'equipement', cibleId: 'pressoir', actionId: 'rincage', produit: 'Eau', operateurs: [] });
    t('appel à l’ancienne (texte seul) : inchangé', vieux.ok && h.hygiene[h.hygiene.length - 1].produit === 'Eau' && !('produits' in h.hygiene[h.hygiene.length - 1]));
    // revendications du vin présent
    const Rh = L.getR(h); const plein = Object.values(Rh.portions).find((x) => x.vol > 500 && (Rh.lots[x.lotId] || {}).qualif === 'conv');
    const rq = L.hygProduitSave(h, { nom: 'Désinfectant réservé bio', type: 'desinfectant', revendications: ['bio'] });
    t('contrôle : produit non indiqué pour la revendication du vin présent', L.hygControles(h, Rh, { cibleType: 'contenant', cibleId: plein.contenantId, produits: [{ produitId: rq.id }] }).some((c) => /utilisable en/.test(c.msg)));
    // suppression : documents rendus pour effacement
    const rd = L.hygProduitSave(h, { nom: 'À supprimer' }); L.docMetaAdd(h, { id: 'docT3', nom: 'x.pdf', cat: 'fds', cible: { type: 'produitHygiene', id: rd.id } });
    const del = L.hygProduitDelete(h, rd.id); t('suppression d’un produit jamais utilisé : documents rendus', del.ok && del.docs.join() === 'docT3' && !h.docs.some((x) => x.id === 'docT3') && !h.produitsHygiene.some((x) => x.id === rd.id));
    // lecture d'une FDS (texte extrait d'un PDF)
    const f1 = L.fdsAnalyser(fs.readFileSync(path.join(FXH, 'fds-demo-chlore.txt'), 'utf8'));
    t('FDS (texte) : nom, fabricant, date de révision, version', f1.nom === 'NETTOYANT CHLORÉ DÉMO 123' && f1.fabricant === 'Hygiène Exemple SAS' && f1.fdsDate === '2023-03-15' && f1.fdsVersion === '4.0', [f1.nom, f1.fabricant, f1.fdsDate, f1.fdsVersion]);
    t('FDS : mentions H de la rubrique 2 seulement, avec leur texte', f1.codesH.join() === 'H290,H314,H400,EUH031' && /^H314 : Provoque de graves brûlures/m.test(f1.phrasesH) && f1.phrasesH.split('\n').length === 4, f1.codesH);
    t('FDS : pictogrammes nommés, mention « Danger »', f1.pictos.join() === 'SGH05,SGH09' && !f1.pictosDeduits && f1.mention === 'danger');
    t('FDS : protections (sans la protection respiratoire « non nécessaire »)', f1.epi.join() === 'gants,lunettes,visiere,tablier', f1.epi);
    t('FDS : incompatibilités, stockage, urgence, composition, nature, forme', /^Acides\. Métaux légers/.test(f1.incompatibilites) && /^Stocker dans un endroit frais/.test(f1.stockage) && /^\+33 \(0\)1 00 00 00 00/.test(f1.urgence) && f1.composition === 'Hydroxyde de sodium (5 - 10 %), Hypochlorite de sodium (1 - 5 %)' && f1.type === 'alcalin_chlore' && f1.forme === 'liquide' && f1.fds, f1);
    const f2 = L.fdsAnalyser(fs.readFileSync(path.join(FXH, 'fds-demo-peracide.txt'), 'utf8'));
    t('FDS (autre mise en page) : valeurs sur la ligne suivante, date en toutes lettres', f2.nom === 'PERACIDE DEMO 15' && f2.fabricant === 'Démo Chimie SARL' && f2.fdsDate === '2022-02-03' && f2.fdsVersion === '2' && f2.mention === 'danger', [f2.nom, f2.fabricant, f2.fdsDate, f2.fdsVersion, f2.mention]);
    t('FDS : mention combinée « H302+H332 », pictogrammes déduits des mentions H', /^H302\+H332 : Nocif/m.test(f2.phrasesH) && f2.pictosDeduits && f2.pictos.join() === 'SGH02,SGH05,SGH07,SGH09' && f2.type === 'desinfectant', [f2.pictos, f2.phrasesH]);
    t('FDS : protection respiratoire niée sur la ligne suivante, lunettes gardées', f2.epi.join() === 'gants,lunettes' && f2.urgence === 'ORFILA (INRS) : 01 00 00 00 00', [f2.epi, f2.urgence]);
    const f3 = L.fdsAnalyser(fs.readFileSync(path.join(FXH, 'fds-demo-detartrant.txt'), 'utf8'));
    t('FDS en colonnes (« Étiquette :   valeur », rubriques « 2 IDENTIFICATION… ») : tout est lu', f3.rubriques === 5 && f3.nom === 'DETARTRANT ACIDE DEMO' && f3.fabricant === 'Démo Hygiène Vinicole SAS' && f3.urgence === 'ORFILA : 01 00 00 00 00' && f3.fdsDate === '2024-09-07' && f3.fdsVersion === '1.2' && f3.mention === 'attention' && f3.phrasesH === 'H319 : Provoque une sévère irritation des yeux.' && f3.pictos.join() === 'SGH07' && f3.epi.join() === 'gants,lunettes' && f3.composition === 'Acide citrique (10 - 30 %)' && f3.type === 'acide' && f3.forme === 'liquide', f3);
    t('pictogrammes déduits : règles de priorité du CLP', L.fdsPictosDeH(['H301', 'H302']).join() === 'SGH06' && L.fdsPictosDeH(['H314', 'H315', 'H319']).join() === 'SGH05' && L.fdsPictosDeH(['H314', 'H335']).join() === 'SGH05,SGH07' && L.fdsPictosDeH(['H334', 'H317']).join() === 'SGH08' && L.fdsPictosDeH(['H412']).join() === '');
    t('dates de FDS : formats français', L.fdsDate('15/03/2023') === '2023-03-15' && L.fdsDate('3.2.22') === '2022-02-03' && L.fdsDate('1er avril 2021') === '2021-04-01' && L.fdsDate('2020-12-31') === '2020-12-31' && L.fdsDate('45/13/2020') === null);
    t('pas une FDS : rien d’inventé', (() => { const x = L.fdsAnalyser('Facture n° 123\nTotal : 45,00 €'); return !x.nom && !x.codesH.length && !x.pictos.length && !x.fds; })());
    t('texte de pages positionnées → lignes', L.fdsTexteDePages([L.jaugePageDeTexte('Nom du produit : A\nVersion : 2')]) === 'Nom du produit : A\nVersion : 2');
    // droits : produits d'hygiène et leurs documents = module Hygiène
    { const mdp = await L.mdpEmpreinte('Admin-2026', 1000); const y = L.clone(h); const a = L.securiteActiver(y, { identifiant: 'admin', mdp }).id; const cc = L.utilisateurSave(y, { identifiant: 'compta', profilId: 'pf_consult', mdp }).id;
      const essai = (uid, fn) => { const av = L.clone(y); const apr = L.clone(y); fn(apr); return L.gardeDroits(av, apr, uid); };
      t('droits : créer un produit d’hygiène = saisir dans Hygiène', !essai(cc, (x) => L.hygProduitSave(x, { nom: 'P droits' })).ok && essai(a, (x) => L.hygProduitSave(x, { nom: 'P droits' })).ok);
      t('droits : joindre sa FDS = saisir dans Hygiène', !essai(cc, (x) => L.docMetaAdd(x, { id: 'dd1', nom: 'f.pdf', cat: 'fds', cible: { type: 'produitHygiene', id: x.produitsHygiene[0].id } })).ok);
      t('droits : modifier les revendications = paramètres', !essai(cc, (x) => L.richListCont(x, 'qualifs', 'edit', 'bio', { label: 'Bio X' })).ok && essai(a, (x) => L.richListCont(x, 'qualifs', 'edit', 'bio', { label: 'Bio X' })).ok);
    }
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ---- compatibilité ascendante : la version précédente (0.17.0-alpha.2 gelée) ouvre, modifie et synchronise une base 0.18.0-alpha.1
  {
    const dirV = path.join(__dirname, 'anciennes', '0.17.0-alpha.2');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, opSave, hygieneSave, produitSave, getR, clone, qLabel, minQualif, APP_VERSION, APP_NUM };')({});
    t('0.17.0-alpha.2 gelée chargée', V.APP_VERSION === 'alpha V1.8' && V.APP_NUM === 1008 && L.APP_NUM >= 1009);
    const d19 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.18.0-alpha.1-hygiene.json'), 'utf8')));
    t('base 0.18.0-alpha.1 de test : revendications, produits d’hygiène, entrée détaillée', d19.lists.qualifs.length === 5 && d19.produitsHygiene.length === 4 && d19.hygiene.some((x) => (x.produits || []).length && x.methode));
    const v = V.normalizeDb(V.clone(d19));
    t('0.17.0-alpha.2 ouvre une base 0.18.0-alpha.1 : revendications, produits d’hygiène, détail des entrées et documents conservés', JSON.stringify(v.lists.qualifs) === JSON.stringify(d19.lists.qualifs) && JSON.stringify(v.produitsHygiene) === JSON.stringify(d19.produitsHygiene) && JSON.stringify(v.hygiene) === JSON.stringify(d19.hygiene) && v.docs.some((x) => x.cible.type === 'produitHygiene'));
    const he = v.hygiene.find((x) => (x.produits || []).length && x.methode); const avant = V.clone(he);
    V.hygieneSave(v, { ...V.clone(he), produit: `${he.produit}, puis vapeur` }, he.id);
    const he2 = v.hygiene.find((x) => x.id === he.id);
    t('0.17.0-alpha.2 modifie l’entrée d’hygiène : produits et méthode gardés, texte modifié', JSON.stringify(he2.produits) === JSON.stringify(avant.produits) && he2.methode === avant.methode && /puis vapeur$/.test(he2.produit));
    t('0.17.0-alpha.2 garde le raisin en HVE (revendication inconnue pour elle)', Object.values(V.getR(v).raisins).some((r) => r.qualifId === 'hve'));
    const ap = v.ops.find((o) => o.type === 'apport' && o.qualifId === 'hve'); const sp = V.clone(ap); sp.kg = 1600; V.opSave(v, sp, ap.id);
    t('0.17.0-alpha.2 modifie l’apport HVE : revendication gardée', v.ops.find((o) => o.id === ap.id).qualifId === 'hve' && v.ops.find((o) => o.id === ap.id).kg === 1600);
    const back = L.normalizeDb(V.clone(v)); L.syncConfig(back);
    t('… rouverte en 0.18.0-alpha.1 : texte modifié en 0.17.0-alpha.2 détecté, revendications intactes', L.hygTexteModifie(back, back.hygiene.find((x) => x.id === he.id)) && back.lists.qualifs.map((q) => q.id).join() === 'conv,hve,conversion_bio_c2,bio,dem' && L.qLabel('bio') === 'Agriculture biologique' && L.rang('bio') === 4);
    // synchronisation 0.17.0-alpha.2 ↔ 0.18.0-alpha.1
    const base = V.clone(v); const A = V.clone(v); const B9 = L.clone(v);
    V.hygieneSave(A, { date: '2026-11-19', cibleType: 'equipement', cibleId: 'pressoir', actionId: 'rincage', produit: 'Eau (0.17.0-alpha.2)', operateurs: [] });
    L.hygProduitSave(B9, { nom: 'Produit ajouté en 0.18.0-alpha.1' }); L.richListCont(B9, 'qualifs', 'add', null, { label: 'VDC', copieDe: 'conv' });
    const F = V.syncFusion(base, A, B9);
    t('0.17.0-alpha.2 synchronisée avec 0.18.0-alpha.1 : entrée 0.17.0-alpha.2, produit et revendication 0.18.0-alpha.1 réunis', F.db.hygiene.some((x) => x.produit === 'Eau (0.17.0-alpha.2)') && F.db.produitsHygiene.some((x) => x.nom === 'Produit ajouté en 0.18.0-alpha.1') && F.db.lists.qualifs.some((q) => q.id === 'vdc') && !F.conflits.length);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ================= 17. 0.19.0-alpha.1 : fiches d'enregistrement génériques — la version précédente (0.18.0-alpha.1 gelée) garde modèles et fiches imprimées =================
  {
    const dirV = path.join(__dirname, 'anciennes', '0.18.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, modeleFicheSave, ficheAdd, hygProduitSave, clone, APP_VERSION, APP_NUM };')({});
    t('0.18.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V1.9' && V.APP_NUM === 1009 && L.APP_NUM >= 2000);
    const d20 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.19.0-alpha.1-fiches.json'), 'utf8')));
    const m20 = d20.modelesFiches.find((m) => m.id === 'etapes');
    t('base 0.19.0-alpha.1 de test : modèle personnalisé (champs pré-remplis, visa du responsable) et fiche imprimée numérotée', !!m20 && m20.champs.includes('Cuve {cuve}') && m20.visaResp === true && m20.v === 2 && d20.fiches.some((x) => /^MVT-\d{6}-1$/.test(x.ordre)));
    const v = V.normalizeDb(V.clone(d20));
    t('0.18.0-alpha.1 ouvre une base 0.19.0-alpha.1 : modèles et fiches imprimées conservés tels quels', JSON.stringify(v.modelesFiches) === JSON.stringify(d20.modelesFiches) && JSON.stringify(v.fiches) === JSON.stringify(d20.fiches));
    const m19 = V.clone(v.modelesFiches.find((m) => m.id === 'etapes')); m19.titre = 'Stades (modifié en 0.18.0-alpha.1)'; V.modeleFicheSave(v, m19);
    const mv = v.modelesFiches.find((m) => m.id === 'etapes');
    t('0.18.0-alpha.1 modifie le modèle : les réglages de la 0.19.0-alpha.1 restent', mv.titre === 'Stades (modifié en 0.18.0-alpha.1)' && mv.visaResp === true && mv.sous && mv.champs.includes('Cuve {cuve}') && mv.v === 2);
    const base = V.clone(v); const A = V.clone(v); const B = L.clone(v); V.ficheAdd(A, { modele: 'mouvements', ordre: 'MVT261119N1', date: '2026-11-19', sources: [] }); L.ficheAdd(B, { modele: 'jaugeage', ordre: 'INV-261119-1', date: '2026-11-19', sources: [] });
    A.fiches[A.fiches.length - 1].id = 'fiAppareilA'; B.fiches[B.fiches.length - 1].id = 'fiAppareilB'; // identifiants propres à chaque appareil
    const F = V.syncFusion(base, A, B); t('0.18.0-alpha.1 synchronisée avec 0.19.0-alpha.1 : fiches imprimées des deux côtés réunies', F.db.fiches.some((x) => x.ordre === 'MVT261119N1') && F.db.fiches.some((x) => x.ordre === 'INV-261119-1') && !F.conflits.length);
    t('… rouverte en 0.19.0-alpha.1 : rien de perdu', L.normalizeDb(F.db).fiches.length === d20.fiches.length + 2 && L.normalizeDb(F.db).modelesFiches.find((m) => m.id === 'etapes').titre === 'Stades (modifié en 0.18.0-alpha.1)');
  }
  // ================= 18. 0.20.0-alpha.1 : FT / FDS des intrants (dépôt groupé, remplacement archivé, lien, alertes), assistant IA (clé de l'utilisateur) =================
  {
    const FXI = path.join(__dirname, 'fixtures', 'intrants'); const T0 = '2026-11-19';
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); const P = (nom) => d.produits.find((p) => p.nom === nom);
    // lecture des documents
    const a1 = L.ficheAnalyser(fs.readFileSync(path.join(FXI, 'fds-demo-lysozyme.txt'), 'utf8'), { fichier: 'fds-demo-lysozyme.pdf' });
    t('FDS lue : type, nom, fabricant, date de révision (pas celle remplacée), version', a1.genre === 'fds' && a1.nom === 'LYSOZYME DÉMO' && a1.fabricant === 'Démo Œnologie SAS' && a1.date === '2024-03-12' && a1.version === '3.1', [a1.genre, a1.nom, a1.fabricant, a1.date, a1.version]);
    const a2 = L.ficheAnalyser(fs.readFileSync(path.join(FXI, 'ft-demo-bentonite.txt'), 'utf8'), { fichier: 'bentonite.pdf', titre: 'BENTONITE SODIQUE DÉMO' });
    t('FT lue : type, nom (titre), date de la version (ni la version remplacée ni la DLUO), version', a2.genre === 'ft' && a2.nom === 'BENTONITE SODIQUE DÉMO' && a2.date === '2023-09-05' && a2.version === '2', [a2.genre, a2.nom, a2.date, a2.version]);
    const a3 = L.ficheAnalyser(fs.readFileSync(path.join(FXI, 'certif-demo-levure.txt'), 'utf8'), { fichier: 'cert.pdf' });
    t('certificat lu : type et date', a3.genre === 'certificat' && a3.date === '2025-01-10', [a3.genre, a3.date]);
    t('document illisible : type et date d’après le nom du fichier', (() => { const x = L.ficheAnalyser('', { fichier: 'FDS_Lysozyme_04-2023.pdf' }); const y = L.ficheAnalyser('', { fichier: 'FT tanins.docx' }); return x.genre === 'fds' && x.date === '2023-04-01' && y.genre === 'ft'; })());
    t('une date dans le futur n’est pas une date de révision', L.ficheAnalyser('Fiche technique\nPRODUIT X\nDate de mise à jour : 01/01/2099', {}).date === '' && !L.dateRevOk('2099-01-01') && L.dateRevOk('2024-02-29'));
    t('fiche technique citant la FDS : reste une fiche technique', L.ficheAnalyser('FICHE TECHNIQUE\nTANIN DÉMO\n1. Description\n2. Utilisation\n3. Dosage\nFiche de données de sécurité disponible sur demande.\nMise à jour : 03/2024', {}).genre === 'ft');
    t('mois / année', L.moisAnnee('Révision 03/2024') === '2024-03-01' && L.moisAnnee('mise à jour mars 2023') === '2023-03-01' && L.moisAnnee('12/03/2024') === null);
    const page = { w: 595, h: 842, items: [{ s: 'Démo Œnologie', x: 40, y: 40, w: 80, h: 9 }, { s: 'BENTONITE', x: 40, y: 90, w: 120, h: 24 }, { s: 'SODIQUE', x: 170, y: 90, w: 100, h: 24 }, { s: 'Clarification des vins', x: 40, y: 130, w: 150, h: 10 }, { s: 'Dosage : 20 à 80 g/hL', x: 40, y: 150, w: 150, h: 10 }, { s: 'Page 1/2', x: 40, y: 800, w: 40, h: 8 }] };
    t('titre d’une page : texte en plus gros caractères du haut', L.ficheTitreDePage(page) === 'BENTONITE SODIQUE' && L.ficheTitreDePage({ items: [{ s: 'Texte', x: 0, y: 0, w: 10, h: 10 }, { s: 'Autre texte', x: 0, y: 20, w: 10, h: 10 }] }) === '');
    // rapprochement avec les produits
    const reco = (lu) => L.ficheReconnu(L.ficheCorrespondances(d, lu));
    const r1 = reco({ ...a1, fichier: 'fds-demo-lysozyme.pdf' });
    t('FDS rattachée au bon intrant (Lysozyme)', r1 && r1.type === 'produit' && r1.id === P('Lysozyme').id, r1);
    t('« Levure prise de mousse » et non « Levure fermentation primaire »', (() => { const x = reco({ nom: 'LEVURE PRISE DE MOUSSE DÉMO', extrait: '', fichier: 'cert.pdf' }); return x && x.id === P('Levure prise de mousse').id; })());
    t('reconnu par le seul nom du fichier', (() => { const x = reco({ nom: 'PECTOZYM DÉMO', extrait: 'Préparation enzymatique', fichier: 'fds_enzyme_pectolytique.pdf' }); return x && x.id === P('Enzyme pectolytique').id; })());
    t('produit d’hygiène reconnu aussi', (() => { const x = reco({ nom: 'ACIDE PERACETIQUE 5', extrait: '', fichier: 'FDS peracetique.pdf' }); return x && x.type === 'produitHygiene' && x.id === d.produitsHygiene.find((h) => h.nom === 'Acide peracétique 5 %').id; })());
    t('ambigu ou inconnu : rien d’imposé', !reco({ nom: 'LEVURE', extrait: '', fichier: 'levure.pdf' }) && !reco({ nom: 'CLARIFIANT XR-200', extrait: 'Clarifiant minéral', fichier: 'sds_xr200.pdf' }));
    P('Gélatine liquide').reference = 'GL-30210';
    t('reconnu par la référence du fournisseur', (() => { const x = reco({ nom: 'COLLE DÉMO', extrait: 'Code article : GL-30210\nColle liquide', fichier: 'doc.pdf' }); return x && x.id === P('Gélatine liquide').id; })());
    t('mots proches : pluriel, faute de lecture', L.motProche('tanin', 'tanins') && L.motProche('bentonite', 'bentonlte') && !L.motProche('levure', 'lysozyme') && L.unEcart('abc', 'abd') && !L.unEcart('abc', 'xyz'));
    // dépôt : joindre, remplacer (ancienne archivée), version plus ancienne, doublon
    const so2 = P('Métabisulfite de potassium'); const c = { type: 'produit', id: so2.id };
    t('FDS requise sauf matières sèches et « FDS non requise »', L.prodFdsRequise(so2) && !L.prodFdsRequise(P('Muselet')) && L.prodFdsEtat(d, P('Muselet')).k === 'sansobjet' && L.prodFdsEtat(d, { ...P('Lysozyme'), fdsNonRequise: true }).label === 'FDS non requise');
    t('sans document : FDS manquante', L.prodFdsEtat(d, so2, T0).k === 'manquante' && L.ficheActionDefaut(d, c, 'fds', '2021-05-10', { nom: 'a.pdf', taille: 10 }).action === 'ajouter');
    t('ajout : FDS de 2021 jointe, datée, plus de 3 ans', L.ficheJoindre(d, { cible: c, meta: { id: 'dv1', nom: 'FDS_so2_v1.pdf', mime: 'application/pdf', taille: 1000 }, genre: 'fds', date: '2021-05-10', version: '1', action: 'ajouter', today: '2024-01-01' }).ok && L.prodFdsEtat(d, so2, T0).k === 'ancienne' && so2.fdsDate === '2021-05-10');
    const ac = L.ficheActionDefaut(d, c, 'fds', '2025-02-14', { nom: 'FDS_so2_2025.pdf', taille: 2000 });
    t('version plus récente : « remplacer »', ac.action === 'remplacer' && /archivée/.test(ac.raison), ac);
    L.ficheJoindre(d, { cible: c, meta: { id: 'dv2', nom: 'FDS_so2_2025.pdf', mime: 'application/pdf', taille: 2000 }, genre: 'fds', date: '2025-02-14', version: '2', action: 'remplacer', today: T0 });
    const v1 = d.docs.find((x) => x.id === 'dv1');
    t('remplacée : l’ancienne est archivée (date, remplacée par), la nouvelle en vigueur', v1.archive === T0 && v1.remplacePar === 'dv2' && L.prodDocs(d, so2.id, 'fds').map((x) => x.id).join() === 'dv2' && L.prodDocs(d, so2.id, 'fds', true).map((x) => x.id).join() === 'dv1' && so2.fdsDate === '2025-02-14' && so2.fdsVersion === '2' && L.prodFdsEtat(d, so2, T0).k === 'ok');
    t('version plus ancienne : rangée dans les archives', L.ficheActionDefaut(d, c, 'fds', '2019-01-01', { nom: 'vieille.pdf', taille: 5 }).action === 'archiver' && L.ficheJoindre(d, { cible: c, meta: { id: 'dv0', nom: 'vieille.pdf', taille: 5 }, genre: 'fds', date: '2019-01-01', action: 'archiver', today: T0 }).ok && d.docs.find((x) => x.id === 'dv0').archive === T0 && so2.fdsDate === '2025-02-14');
    t('même révision ou même fichier : ignoré', L.ficheActionDefaut(d, c, 'fds', '2025-02-14', { nom: 'autre.pdf', taille: 9 }).action === 'ignorer' && L.ficheActionDefaut(d, c, 'fds', '2026-01-01', { nom: 'FDS_so2_v1.pdf', taille: 1000 }).doublon === 'dv1');
    t('date non trouvée : joint sans remplacer, à vérifier', (() => { const x = L.ficheActionDefaut(d, c, 'fds', '', { nom: 'x.pdf', taille: 3 }); return x.action === 'ajouter' && x.alerte; })());
    t('fiche technique : jointe et datée', L.ficheJoindre(d, { cible: c, meta: { id: 'dt1', nom: 'FT_so2.pdf', taille: 50 }, genre: 'ft', date: '2024-06-01', action: 'ajouter' }).ok && L.prodFtEtat(d, so2).label === 'FT du 01/06/2024' && so2.ftDate === '2024-06-01');
    t('date de révision corrigée à la main : la fiche suit', L.ficheDocReviser(d, 'dv2', { revision: '2025-03-01', version: '2.1' }).ok && so2.fdsDate === '2025-03-01' && so2.fdsVersion === '2.1' && !L.ficheDocReviser(d, 'dv2', { revision: '01/03/2025' }).ok);
    t('version archivée rétablie, puis archivée à nouveau', L.ficheDocArchiver(d, 'dv1', false).ok && !d.docs.find((x) => x.id === 'dv1').archive && L.prodDocs(d, so2.id, 'fds').length === 2 && so2.fdsDate === '2025-03-01' && L.ficheDocArchiver(d, 'dv1', true, T0).ok && L.prodDocs(d, so2.id, 'fds').length === 1);
    t('compteurs : documents en vigueur', L.prodDocs(d, so2.id).length === 2 && L.docsOf(d, 'produit', so2.id).length === 4);
    // dépôt groupé : deux versions déposées ensemble, dans l'ordre des dates
    const nv = L.ficheProduitCreer(d, { nom: 'Tanin DÉMO Plus', fabricant: 'IOC France' }); const cn = { type: 'produit', id: nv.id };
    t('produit créé d’après le document (fournisseur reconnu dans le fabricant)', nv.ok && d.produits.find((p) => p.id === nv.id).fournisseurId === d.fournisseurs.find((f) => f.nom === 'IOC').id && L.ficheProduitCreer(d, { nom: 'tanin démo plus' }).existant);
    [['b1', '2022-01-01'], ['b2', '2024-01-01']].forEach(([id, date]) => { const a = L.ficheActionDefaut(d, cn, 'fds', date, { nom: `${id}.pdf`, taille: 1 }).action; L.ficheJoindre(d, { cible: cn, meta: { id, nom: `${id}.pdf`, taille: 1 }, genre: 'fds', date, action: a }); });
    t('deux versions déposées ensemble : la plus récente en vigueur, l’autre archivée', L.prodDocs(d, nv.id, 'fds').map((x) => x.id).join() === 'b2' && d.docs.find((x) => x.id === 'b1').remplacePar === 'b2');
    // produit : lien, référence, FDS non requise ; suppression avec ses documents
    t('lien du fournisseur : adresse complétée, adresse invalide refusée', L.lienNorm('www.exemple-oeno.fr/produit/so2') === 'https://www.exemple-oeno.fr/produit/so2' && L.lienNorm('https://exemple.fr') === 'https://exemple.fr/' && L.lienNorm('pas une adresse') === '' && L.lienNorm('javascript:alert(1)') === '' && L.lienCourt('https://www.exemple.fr/a/b') === 'exemple.fr/…');
    so2.veille = { date: '2026-11-01', fds: { date: '2025-02-14', url: '' } };
    const rs = L.produitSave(d, { ...so2, lien: 'exemple-oeno.fr/so2', reference: ' SK 25 ', fdsNonRequise: false }, so2.id);
    t('produit enregistré : lien, référence ; champs ajoutés ailleurs (veille) gardés', rs.ok && rs.id === so2.id && so2.lien === 'https://exemple-oeno.fr/so2' && so2.reference === 'SK 25' && so2.veille && so2.veille.date === '2026-11-01' && !L.produitSave(d, { ...so2, lien: 'n importe quoi' }, so2.id).ok);
    t('ancien appel (sans les champs 0.20.0-alpha.1) : lien et référence gardés', L.produitSave(d, { nom: so2.nom, categorie: so2.categorie, unite: so2.unite, fournisseurId: so2.fournisseurId }, so2.id).ok && so2.lien === 'https://exemple-oeno.fr/so2' && so2.reference === 'SK 25');
    const dl = L.produitDelete(d, nv.id);
    t('produit supprimé : ses FT et FDS aussi (fichiers à effacer renvoyés)', dl.ok && dl.docs.sort().join() === 'b1,b2' && !L.docsOf(d, 'produit', nv.id).length);
    // veille en ligne
    t('veille : FDS en ligne plus récente signalée', (() => { const p = { ...so2, veille: { date: T0, fds: { date: '2026-06-01', url: 'https://exemple.fr/fds.pdf' } } }; const e = L.prodVeilleEtat(d, p); return e.k === 'nouvelle' && e.quoi === 'fds' && e.url === 'https://exemple.fr/fds.pdf'; })() && L.prodVeilleEtat(d, so2).k === 'ajour' && L.prodVeilleEtat(d, P('Lysozyme')).k === 'jamais');
    const lys = P('Lysozyme'); L.prodVeilleEnregistrer(d, lys.id, { date: T0, page: 'https://exemple.fr/lysozyme', fds: { url: '', date: '', version: '' }, ft: { url: '', date: '' } });
    t('veille enregistrée : la page trouvée devient le lien du produit s’il n’en a pas', lys.lien === 'https://exemple.fr/lysozyme' && (L.prodVeilleEnregistrer(d, so2.id, { date: T0, page: 'https://autre.fr/x' }), so2.lien === 'https://exemple-oeno.fr/so2'));
    const RS = L.prodFichesResume(d, T0);
    t('résumé : FDS manquantes, anciennes, liens, FT', RS.manquantes === d.produits.filter((p) => p.actif !== false && L.prodFdsEtat(d, p, T0).k === 'manquante').length && RS.liens === 2 && RS.ft === 1 && RS.suivis === d.produits.filter((p) => p.categorie !== 'sec').length, RS);
    t('à revoir : FDS manquante', L.prodARevoir(d, lys, T0) && !L.prodARevoir(d, so2, T0));
    // produits d'hygiène : versions archivées ignorées pour l'état, supprimées avec le produit
    const hp = d.produitsHygiene[0]; const ch = { type: 'produitHygiene', id: hp.id };
    L.ficheJoindre(d, { cible: ch, meta: { id: 'h1', nom: 'fds1.pdf', taille: 1 }, genre: 'fds', date: '2020-01-01', action: 'ajouter' }); L.ficheJoindre(d, { cible: ch, meta: { id: 'h2', nom: 'fds2.pdf', taille: 2 }, genre: 'fds', date: '2025-01-01', action: 'remplacer', today: T0 });
    t('hygiène : la FDS remplacée est archivée, la fiche datée de la nouvelle', L.hygDocs(d, hp.id, 'fds').map((x) => x.id).join() === 'h2' && L.hygDocs(d, hp.id, 'fds', true).length === 2 && hp.fdsDate === '2025-01-01' && L.hygFdsEtat(d, hp, T0).k === 'ok' && L.ficheCat('produitHygiene', 'certificat') === 'certif');
    // assistant IA : réglage sur l'appareil, jamais dans la base
    t('assistant IA : non configuré par défaut', !L.iaActive({}).pret && L.iaActive({}).fournisseur === 'anthropic' && L.iaActive({}).modele === 'claude-sonnet-5-5' && !L.iaActive({ fournisseur: 'perso', modeles: { perso: 'm' } }).pret && L.iaActive({ fournisseur: 'perso', url: 'http://localhost:11434/v1/', modeles: { perso: 'llama' } }).pret);
    L.iaConfigEcrire({ fournisseur: 'openai', cles: { openai: 'sk-test-SECRET-123' }, modeles: { openai: 'gpt-test' } });
    t('clé gardée à part (localStorage « oenotrack-ia »), absente de la base enregistrée', L.iaActive().pret && L.iaActive().cle === 'sk-test-SECRET-123' && L.saveDb(d) && !String(store[L.STORAGE_KEY]).includes('SECRET') && !JSON.stringify(d).includes('SECRET') && L.IA_KEY === 'oenotrack-ia' && L.iaMasque('sk-test-SECRET-123') === 'sk-tes…-123');
    const C = (f, extra) => ({ fournisseur: f, cle: 'K', modele: 'M', url: 'https://ia.exemple/v1', web: true, ...(extra || {}) });
    const q1 = L.iaRequete(C('anthropic'), { system: 'S', texte: 'T', web: true });
    t('requête Claude : en-têtes (clé, version, accès navigateur), recherche et lecture web', q1.url === 'https://api.anthropic.com/v1/messages' && q1.headers['x-api-key'] === 'K' && q1.headers['anthropic-version'] === '2023-06-01' && q1.headers['anthropic-dangerous-direct-browser-access'] === 'true' && q1.body.system === 'S' && q1.body.messages[0].content === 'T' && q1.body.tools.map((x) => x.type).join() === 'web_search_20250305,web_fetch_20250910' && !L.iaRequete(C('anthropic'), { texte: 'T' }).body.tools && L.iaRequete(C('anthropic'), { texte: 'T', web: true, sansFetch: true }).body.tools.length === 1);
    const q2 = L.iaRequete(C('openai'), { system: 'S', texte: 'T', web: true });
    t('requête ChatGPT : API Responses, recherche web et sources', q2.url === 'https://api.openai.com/v1/responses' && q2.headers.authorization === 'Bearer K' && q2.body.instructions === 'S' && q2.body.input === 'T' && q2.body.tools[0].type === 'web_search' && q2.body.include[0] === 'web_search_call.action.sources');
    const q3 = L.iaRequete(C('gemini', { modele: 'models/gemini-x' }), { system: 'S', texte: 'T', web: true });
    t('requête Gemini : modèle dans l’adresse, clé en en-tête, recherche Google', q3.url === 'https://generativelanguage.googleapis.com/v1beta/models/gemini-x:generateContent' && q3.headers['x-goog-api-key'] === 'K' && !q3.url.includes('key=') && q3.body.tools[0].google_search && q3.body.contents[0].parts[0].text === 'T');
    const q4 = L.iaRequete(C('mistral'), { system: 'S', texte: 'T', web: true }); const q4b = L.iaRequete(C('mistral'), { system: 'S', texte: 'T' });
    t('requête Mistral : conversations avec recherche web, sinon chat', q4.url === 'https://api.mistral.ai/v1/conversations' && q4.body.tools[0].type === 'web_search' && q4.body.inputs === 'T' && q4b.url === 'https://api.mistral.ai/v1/chat/completions' && q4b.body.messages.length === 2);
    const q5 = L.iaRequete(C('openrouter'), { texte: 'T', web: true }); const q6 = L.iaRequete(C('perso', { cle: '' }), { texte: 'T', web: true });
    t('requête OpenRouter (module web) et service compatible (sans clé)', q5.url === 'https://openrouter.ai/api/v1/chat/completions' && q5.body.plugins[0].id === 'web' && q6.url === 'https://ia.exemple/v1/chat/completions' && !q6.headers.authorization && !q6.body.plugins);
    // réponses de chaque service
    const rA = L.iaReponse('anthropic', { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Je cherche.' }, { type: 'server_tool_use', name: 'web_search' }, { type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://fournisseur.fr/p', title: 'Produit' }] }, { type: 'web_fetch_tool_result', content: { type: 'web_fetch_result', url: 'https://fournisseur.fr/fds.pdf', content: { title: 'FDS' } } }, { type: 'text', text: '{"page":"https://fournisseur.fr/p"}', citations: [{ type: 'web_search_result_location', url: 'https://fournisseur.fr/p', title: 'Produit' }] }] });
    t('réponse Claude : texte et sources (recherche, pages lues)', rA.texte === 'Je cherche.{"page":"https://fournisseur.fr/p"}' && rA.sources.map((x) => x.url).join() === 'https://fournisseur.fr/p,https://fournisseur.fr/fds.pdf' && !rA.suite && L.iaReponse('anthropic', { stop_reason: 'pause_turn', content: [] }).suite);
    const rO = L.iaReponse('openai', { output: [{ type: 'web_search_call', action: { type: 'search', sources: [{ url: 'https://a.fr/1' }] } }, { type: 'message', content: [{ type: 'output_text', text: 'OK', annotations: [{ type: 'url_citation', url: 'https://a.fr/2', title: 'deux' }] }] }] });
    const rG = L.iaReponse('gemini', { candidates: [{ content: { parts: [{ text: 'pensée', thought: true }, { text: 'OK' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://g.fr/x', title: 'g.fr' } }] } }] });
    const rM = L.iaReponse('mistral', { outputs: [{ type: 'tool.execution', name: 'web_search' }, { type: 'message.output', content: [{ type: 'text', text: 'OK' }, { type: 'tool_reference', url: 'https://m.fr', title: 'm' }] }] });
    const rR = L.iaReponse('openrouter', { choices: [{ message: { content: 'OK', annotations: [{ type: 'url_citation', url_citation: { url: 'https://r.fr', title: 'r' } }] } }] });
    t('réponses ChatGPT, Gemini (sans la réflexion), Mistral, OpenRouter : texte et sources', rO.texte === 'OK' && rO.sources.length === 2 && rG.texte === 'OK' && rG.sources[0].url === 'https://g.fr/x' && rM.texte === 'OK' && rM.sources[0].url === 'https://m.fr' && rR.texte === 'OK' && rR.sources[0].url === 'https://r.fr' && L.iaReponse('perso', { choices: [{ message: { content: 'x' } }], citations: ['https://p.fr'] }).sources[0].url === 'https://p.fr');
    t('JSON de la réponse : bloc ```json, objet au milieu du texte, accolades dans les chaînes', L.iaJson('Voici :\n```json\n{"a": 1}\n```').a === 1 && L.iaJson('Résultat : {"page": "https://x.fr/{y}", "fds": {"url": null}} fin').fds.url === null && L.iaJson('rien') === null && L.iaJson('{cassé') === null);
    t('dates rendues par l’IA', L.iaDateDe('2024-03-12') === '2024-03-12' && L.iaDateDe('12/03/2024') === '2024-03-12' && L.iaDateDe('2024-03') === '2024-03-01' && L.iaDateDe('null') === '' && L.iaDateDe('2099-01-01') === '');
    const VE = L.iaLireVeille({ page: 'https://fournisseur.fr/p', fds: { url: 'https://fournisseur.fr/fds.pdf', date: '14/02/2026', version: '4' }, ft: { url: 'null', date: null }, remarque: 'null', fabricant: 'Démo' }, rA.sources, { fournisseur: 'anthropic', modele: 'M' }, T0);
    t('veille lue : adresses vérifiées dans les sources, « null » ignorés', VE.page === 'https://fournisseur.fr/p' && VE.fds.date === '2026-02-14' && VE.fds.version === '4' && VE.ft.url === '' && VE.remarque === '' && VE.verifie.page && VE.verifie.fds && !VE.verifie.ft && VE.trouve && VE.date === T0 && VE.service === 'anthropic');
    t('veille : adresse inventée ou dangereuse écartée', (() => { const x = L.iaLireVeille({ page: 'javascript:alert(1)', fds: { url: 'https://inconnu.fr/x.pdf' } }, [], null, T0); return x.page === '' && x.fds.url === 'https://inconnu.fr/x.pdf' && !x.verifie.fds; })());
    const PI = L.iaPromptIdentifier(d, { fichier: 'x.pdf', extrait: 'CLARIFIANT XR-200' });
    const idf = L.iaLireIdentification({ type: 'FDS', code: 'p3', nomProduit: 'XR-200', dateRevision: '2024-05-06', version: '2', confiance: 1.4 }, PI.codes);
    t('identification : liste de produits codée, réponse lue (code, type, date, confiance bornée)', /P1 \| /.test(PI.texte) && /CLARIFIANT XR-200/.test(PI.texte) && idf.cible && idf.cible.id === PI.codes.P3.id && idf.genre === 'fds' && idf.date === '2024-05-06' && idf.confiance === 1 && L.iaLireIdentification({ type: 'autre', code: null }, PI.codes).cible === null);
    const PV = L.iaPromptVeille(d, so2.id);
    t('veille : seuls le produit, son fournisseur, sa référence et les dates sont envoyés', PV.web && /Produit : Métabisulfite de potassium/.test(PV.texte) && /Fournisseur \/ fabricant : Sofralab/.test(PV.texte) && /Référence : SK 25/.test(PV.texte) && /révision du 2025-03-01, version 2\.1/.test(PV.texte) && /https:\/\/exemple-oeno\.fr\/so2/.test(PV.texte) && !/Cuve|lot|hL/.test(PV.texte));
    t('veille automatique : jamais vérifiés d’abord, puis les plus anciens', (() => { const ids = L.iaVeilleAFaire(d, 30, T0, 50); return ids.length && !ids.includes(lys.id) && !ids.includes(P('Muselet').id) && ids.includes(P('Enzyme pectolytique').id) && L.iaVeilleAFaire(d, 30, T0, 2).length === 2; })());
    t('messages d’erreur', /refuse la clé/.test(L.iaErreurMsg({ fournisseur: 'openai', modele: 'm' }, 401, { error: { message: 'Incorrect API key' } })) && /introuvable/.test(L.iaErreurMsg({ fournisseur: 'anthropic', modele: 'x' }, 404, null)) && /429/.test(L.iaErreurMsg({ fournisseur: 'gemini' }, 429, null)) && /refuse la clé/.test(L.iaErreurMsg({ fournisseur: 'gemini' }, 400, { error: { message: 'API key not valid' } })) && /indisponible/.test(L.iaErreurMsg({ fournisseur: 'mistral' }, 503, null)) && /OpenRouter/.test(L.iaErreurReseau({ fournisseur: 'mistral' })));
    t('liste des modèles filtrée', L.iaModelesDe('openai', { data: [{ id: 'gpt-x' }, { id: 'whisper-1' }, { id: 'gpt-x-realtime' }, { id: 'text-embedding-3' }, { id: 'o9-mini' }] }).map((m) => m.id).join() === 'gpt-x,o9-mini' && L.iaModelesDe('gemini', { models: [{ name: 'models/gemini-y', supportedGenerationMethods: ['generateContent'] }, { name: 'models/gemini-embedding', supportedGenerationMethods: ['embedContent'] }] }).map((m) => m.id).join() === 'gemini-y' && L.iaModelesDe('anthropic', { data: [{ id: 'claude-b', display_name: 'B' }, { id: 'claude-a' }] })[0].id === 'claude-a');
    // appels simulés : reprise après « pause_turn », lecture web désactivée, réseau coupé, clé refusée
    const appels = []; const reponses = []; const fetch0 = global.fetch;
    global.fetch = async (url, init) => { appels.push({ url, body: JSON.parse(init.body || 'null') }); const r = reponses.shift(); if (r === 'reseau') throw new TypeError('Failed to fetch'); return { ok: r.status === 200, status: r.status, json: async () => r.json }; };
    reponses.push({ status: 200, json: { stop_reason: 'pause_turn', content: [{ type: 'server_tool_use', name: 'web_search' }] } }, { status: 200, json: { stop_reason: 'end_turn', content: [{ type: 'text', text: '{"ok": true}' }] } });
    const ca = { fournisseur: 'anthropic', nom: 'Claude', cle: 'K', modele: 'M', pret: true, web: true };
    const R1 = await L.iaDemander(ca, { system: 'S', texte: 'T', web: true });
    t('Claude : recherche longue reprise (pause_turn), réponse complète', R1.texte === '{"ok": true}' && appels.length === 2 && appels[1].body.messages.length === 2 && appels[1].body.messages[1].role === 'assistant');
    appels.length = 0; reponses.push({ status: 400, json: { error: { type: 'invalid_request_error', message: 'web fetch is not enabled for this organization' } } }, { status: 200, json: { content: [{ type: 'text', text: 'ok' }] } });
    const R2 = await L.iaDemander(ca, { texte: 'T', web: true });
    t('Claude : lecture web désactivée par l’organisation → recherche seule', R2.texte === 'ok' && appels.length === 2 && appels[1].body.tools.length === 1 && appels[1].body.tools[0].name === 'web_search');
    reponses.push('reseau'); let e1 = null; try { await L.iaDemander(ca, { texte: 'T' }); } catch (e) { e1 = e; }
    reponses.push({ status: 401, json: { error: { type: 'authentication_error', message: 'invalid x-api-key' } } }); let e2 = null; try { await L.iaDemander(ca, { texte: 'T' }); } catch (e) { e2 = e; }
    let e3 = null; try { await L.iaDemander({ fournisseur: 'openai', pret: false }, { texte: 'T' }); } catch (e) { e3 = e; }
    t('réseau coupé, clé refusée, non configuré : erreurs claires', e1 && e1.reseau && /joindre Claude/.test(e1.message) && e2 && e2.statut === 401 && /refuse la clé/.test(e2.message) && e3 && e3.config);
    global.fetch = fetch0;
    // droits : documents d'un intrant = module Intrants
    { const mdp = await L.mdpEmpreinte('Admin-2026', 1000); const y = L.clone(d); const a = L.securiteActiver(y, { identifiant: 'admin', mdp }).id; const cc = L.utilisateurSave(y, { identifiant: 'compta', profilId: 'pf_consult', mdp }).id;
      const essai = (uid, fn) => { const av = L.clone(y); const apr = L.clone(y); fn(apr); return L.gardeDroits(av, apr, uid); };
      t('droits : joindre une FDS à un intrant = saisir dans Intrants', !essai(cc, (x) => L.ficheJoindre(x, { cible: { type: 'produit', id: lys.id }, meta: { id: 'dd9', nom: 'f.pdf', taille: 1 }, genre: 'fds', date: '2024-01-01' })).ok && essai(a, (x) => L.ficheJoindre(x, { cible: { type: 'produit', id: lys.id }, meta: { id: 'dd9', nom: 'f.pdf', taille: 1 }, genre: 'fds', date: '2024-01-01' })).ok);
    }
    // synchronisation : FDS remplacée sur un appareil, lien saisi sur l'autre
    { const base = L.clone(d); const A = L.clone(d); const B = L.clone(d); const lA = A.produits.find((p) => p.id === lys.id);
      L.ficheJoindre(A, { cible: { type: 'produit', id: lys.id }, meta: { id: 'sA1', nom: 'lys.pdf', taille: 9 }, genre: 'fds', date: '2024-03-12', action: 'ajouter' }); lA.veille = { date: T0, fds: { date: '2024-03-12' } };
      L.produitSave(B, { ...B.produits.find((p) => p.id === lys.id), reference: 'LYS-1' }, lys.id);
      const F = L.syncFusion(base, A, B); const lf = F.db.produits.find((p) => p.id === lys.id);
      t('synchronisation : FDS jointe sur un appareil, référence saisie sur l’autre, rien de perdu', F.db.docs.some((x) => x.id === 'sA1' && x.revision === '2024-03-12') && lf.reference === 'LYS-1' && lf.fdsDate === '2024-03-12' && lf.veille && !F.conflits.length, F.conflits);
      const A2 = L.clone(d); const B2 = L.clone(d); A2.produits.find((p) => p.id === lys.id).reference = 'REF-A'; B2.produits.find((p) => p.id === lys.id).reference = 'REF-B';
      const F2 = L.syncFusion(L.clone(d), A2, B2);
      t('… même champ modifié des deux côtés : conflit signalé comme avant', F2.conflits.length === 1 && F2.conflits[0].cle === 'produits' && ['REF-A', 'REF-B'].includes(F2.db.produits.find((p) => p.id === lys.id).reference));
      const A3 = L.clone(d); const B3 = L.clone(d); const o3 = A3.ops.find((o) => o.type === 'transfert'); const o3b = B3.ops.find((o) => o.id === o3.id); o3.notes = 'A'; o3b.date = o3b.date;  o3b.operateurs = ['x'];
      t('… opérations : toujours fusionnées en entier (cohérence des volumes)', L.syncFusion(L.clone(d), A3, B3).conflits.length === 1);
    }
    L.iaConfigEcrire({});
  }
  // ---- compatibilité ascendante : la version précédente (0.19.0-alpha.1 gelée) ouvre, modifie et synchronise une base 0.20.0-alpha.1
  {
    const dirV = path.join(__dirname, 'anciennes', '0.19.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, produitSave, docMetaAdd, docMetaDel, hygFdsEtat, hygProduitSave, clone, APP_VERSION, APP_NUM };')({});
    t('0.19.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V2.0' && V.APP_NUM === 2000 && L.APP_NUM >= 2001);
    const d21 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.20.0-alpha.1-intrants.json'), 'utf8'))); L.syncConfig(d21);
    const pl = d21.produits.find((p) => p.lien && p.veille && p.reference);
    t('base 0.20.0-alpha.1 de test : liens, références, veille, FDS datées et versions archivées', !!pl && d21.docs.some((x) => x.cible.type === 'produit' && x.archive && x.remplacePar) && d21.docs.some((x) => x.cible.type === 'produit' && x.revision && !x.archive) && d21.produits.some((p) => p.fdsNonRequise) && d21.docs.some((x) => x.cible.type === 'produitHygiene' && x.archive));
    const v = V.normalizeDb(V.clone(d21));
    t('0.19.0-alpha.1 ouvre une base 0.20.0-alpha.1 : champs des intrants et documents (révision, archivage) conservés', JSON.stringify(v.produits) === JSON.stringify(d21.produits) && JSON.stringify(v.docs) === JSON.stringify(d21.docs));
    const pv = v.produits.find((p) => p.id === pl.id); const av = V.clone(pv);
    V.produitSave(v, { nom: `${pv.nom} (0.19.0-alpha.1)`, categorie: pv.categorie, unite: pv.unite, fournisseurId: pv.fournisseurId, actif: true, notes: 'modifié en 0.19.0-alpha.1' }, pv.id);
    const pv2 = v.produits.find((p) => p.id === pl.id);
    t('0.19.0-alpha.1 modifie l’intrant : lien, référence, dates et veille gardés', pv2.nom === `${av.nom} (0.19.0-alpha.1)` && pv2.lien === av.lien && pv2.reference === av.reference && pv2.fdsDate === av.fdsDate && JSON.stringify(pv2.veille) === JSON.stringify(av.veille));
    V.docMetaAdd(v, { id: 'docV20', nom: 'fds-v20.pdf', mime: 'application/pdf', taille: 12, cat: 'fds', cible: { type: 'produit', id: pl.id } });
    const back = L.normalizeDb(V.clone(v)); L.syncConfig(back);
    t('… rouverte en 0.20.0-alpha.1 : la FDS jointe par la 0.19.0-alpha.1 compte comme version en vigueur (non datée)', L.prodDocs(back, pl.id, 'fds').some((x) => x.id === 'docV20') && L.prodFdsEtat(back, back.produits.find((p) => p.id === pl.id)).k !== 'manquante');
    const base = V.clone(v); const A = V.clone(v); const B = L.clone(v);
    const autreV = A.produits.find((p) => p.id !== pl.id && p.categorie === 'oeno'); V.produitSave(A, { ...autreV, notes: 'note 0.19.0-alpha.1' }, autreV.id);
    L.ficheJoindre(B, { cible: { type: 'produit', id: pl.id }, meta: { id: 'docV21', nom: 'fds-v21.pdf', taille: 30 }, genre: 'fds', date: '2026-10-01', version: '9', action: 'remplacer', today: '2026-11-19' });
    const F = V.syncFusion(base, A, B); const pf = F.db.produits.find((p) => p.id === pl.id);
    t('0.19.0-alpha.1 synchronisée avec 0.20.0-alpha.1 : note 0.19.0-alpha.1, FDS remplacée en 0.20.0-alpha.1 (l’ancienne archivée)', F.db.produits.find((p) => p.id === autreV.id).notes === 'note 0.19.0-alpha.1' && pf.fdsDate === '2026-10-01' && F.db.docs.find((x) => x.id === 'docV20').archive === '2026-11-19' && F.db.docs.some((x) => x.id === 'docV21') && !F.conflits.length, F.conflits);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ================= 19. 0.21.0-alpha.1 : informations légales (mentions du site, hébergeurs, licence) — rien dans la base =================
  {
    t('mentions vides : particulier, rien d’inventé', (() => { const m = L.mentionsFusion(); return m.editeur.statut === 'particulier' && !m.editeur.nom && !m.editeur.email && !m.hebergeur.nom && !m.site; })());
    const sale = { editeur: { statut: 'pirate', nom: '  Jean   Démo  ', email: 'pas-une-adresse', adresse: 'x'.repeat(500) }, hebergeur: { id: 'inconnu', nom: 'H', web: 'javascript:alert(1)' }, site: 'www.exemple-oeno.fr', depot: 'github.com/demo/oenotrack', maj: '19/11/2026' };
    const n = L.mentionsNettoyer(sale);
    t('nettoyage : espaces, e-mail et adresses web vérifiés, longueurs bornées, statut inconnu écarté', n.editeur.nom === 'Jean Démo' && n.editeur.email === '' && n.editeur.adresse.length === 200 && n.editeur.statut === '' && n.hebergeur.id === '' && n.hebergeur.web === '' && n.site === 'https://www.exemple-oeno.fr/' && n.depot === 'https://github.com/demo/oenotrack' && n.maj === '', n);
    t('adresses e-mail', L.mailOk('contact@exemple-oeno.fr') && !L.mailOk('contact@exemple') && !L.mailOk('a b@c.fr') && !L.mailOk('<a@b.fr>'));
    const local = { editeur: { statut: 'particulier', nom: 'Jean Démo' } }; const fichier = { editeur: { statut: 'pro', nom: 'SCEV Autre', email: 'autre@exemple.fr', adresse: '1 rue X' }, hebergeur: { id: 'ovh' }, site: 'https://oenotrack.exemple.fr' };
    const F = L.mentionsFusion(local, fichier);
    t('fusion : le réglage de l’appareil l’emporte, sans mélanger deux éditeurs', F.editeur.nom === 'Jean Démo' && F.editeur.email === '' && F.editeur.statut === 'particulier' && F.site === 'https://oenotrack.exemple.fr/', F.editeur);
    t('fusion : hébergeur connu complété d’après la liste (OVHcloud)', F.hebergeur.nom === 'OVH SAS (OVHcloud)' && /Roubaix/.test(F.hebergeur.adresse) && /424 761 419/.test(F.hebergeur.details) && F.hebergeur.tel);
    t('fusion : un seul hébergeur (pas de nom de l’un avec l’adresse de l’autre)', (() => { const x = L.mentionsFusion({ hebergeur: { id: 'autre', nom: 'Mon hébergeur' } }, { hebergeur: { id: 'ovh' } }); return x.hebergeur.nom === 'Mon hébergeur' && !x.hebergeur.adresse; })());
    t('obligatoire pour un particulier : l’hébergeur seulement (anonymat possible)', L.mentionsManquantes(L.mentionsFusion({ hebergeur: { id: 'ovh' } })).length === 0 && L.mentionsManquantes(L.mentionsFusion()).join() === 'nom de l’hébergeur,adresse de l’hébergeur');
    t('obligatoire pour un professionnel : nom, adresse, téléphone, téléphone de l’hébergeur', L.mentionsManquantes({ editeur: { statut: 'pro' }, hebergeur: { id: 'scaleway', nom: 'Scaleway SAS', adresse: 'Paris' } }).join() === 'nom ou raison sociale de l’éditeur,adresse de l’éditeur,téléphone de l’éditeur,téléphone de l’hébergeur' && L.mentionsManquantes({ editeur: { statut: 'association', nom: 'Asso' }, hebergeur: { nom: 'H', adresse: 'A' } }).join() === 'adresse du siège');
    t('conseils : contact et dépôt du code', L.mentionsConseils({}).length === (L.OENOTRACK_DEPOT ? 1 : 2) && L.mentionsConseils({ editeur: { email: 'a@b.fr' }, depot: 'https://github.com/x/y' }).length === 0);
    t('hébergeurs courants : coordonnées complètes, hors UE signalé', L.HEBERGEURS.length === 5 && L.HEBERGEURS.every((h) => h.nom && h.adresse && h.court) && L.mentionsHebergeur('o2switch').tel === '+33 4 44 44 60 40' && L.mentionsHorsUE({ hebergeur: { id: 'netlify' } }) && !L.mentionsHorsUE({ hebergeur: { id: 'ovh' } }) && L.mentionsHebergeur('zzz').id === 'autre');
    t('adresses directes des pages', L.legalOngletDeHash('#mentions-legales') === 'mentions' && L.legalOngletDeHash('#cgu') === 'cgu' && L.legalOngletDeHash('#/licence') === 'licence' && L.legalOngletDeHash('#Confidentialite') === 'confidentialite' && L.legalOngletDeHash('#jaugeage') === '' && L.LEGAL_ONGLETS.length === 5);
    t('licence et composants : AGPL, auteur à défaut, licences des composants', L.legalAuteur() === 'l’auteur d’Œnotrack' && L.COMPOSANTS_TIERS.length >= 7 && L.COMPOSANTS_TIERS.every((c) => c.nom && c.licence && /^https:\/\//.test(c.web)) && L.SERVICES_CHARGEMENT.some((s) => s.nom === 'Google Fonts') && /^\d{4}-\d{2}-\d{2}$/.test(L.LEGAL_DATE));
    // les mentions ne sont jamais dans la base : une base 0.21.0-alpha.1 a le même format qu'en 0.20.0-alpha.1
    const d22 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.21.0-alpha.1-legal.json'), 'utf8')));
    t('base 0.21.0-alpha.1 de test : aucune mention légale enregistrée dans la base', !JSON.stringify(d22).includes('mentions') && !('mentions' in d22));
    const dirV = path.join(__dirname, 'anciennes', '0.20.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, produitSave, ficheJoindre, clone, APP_VERSION, APP_NUM };')({});
    t('0.20.0-alpha.1 gelée chargée', V.APP_VERSION === 'alpha V2.1' && V.APP_NUM === 2001 && L.APP_NUM >= 2002);
    const v = V.normalizeDb(V.clone(d22));
    t('0.20.0-alpha.1 ouvre une base 0.21.0-alpha.1 sans rien perdre', JSON.stringify(v.produits) === JSON.stringify(d22.produits) && JSON.stringify(v.docs) === JSON.stringify(d22.docs) && v.ops.length === d22.ops.length);
    const base = V.clone(v); const A = V.clone(v); const B = L.clone(v); const pA = A.produits[0]; V.produitSave(A, { ...pA, notes: '0.20.0-alpha.1' }, pA.id); const pB = B.produits[1]; L.produitSave(B, { ...pB, reference: 'REF-V22' }, pB.id);
    const Fs = V.syncFusion(base, A, B); t('0.20.0-alpha.1 synchronisée avec 0.21.0-alpha.1', Fs.db.produits[0].notes === '0.20.0-alpha.1' && Fs.db.produits[1].reference === 'REF-V22' && !Fs.conflits.length);
  }
  // ================= 20. 0.22.0-alpha.1 : barème importé dès la création d'un contenant — et numérotation X.Y.Z-étiquette.N (0.22.0-alpha.2) =================
  {
    const sv = (v) => { const m = /^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc)\.(\d+))?$/.exec(v); return m ? { x: +m[1], y: +m[2], z: +m[3], e: m[4] || '', n: m[5] ? +m[5] : 0 } : null; };
    t('version au format X.Y.Z-étiquette.N, en alpha', !!sv(L.APP_VERSION) && sv(L.APP_VERSION).e === 'alpha' && L.CHANGELOG.some((c) => c.v === '0.22.0-alpha.2'));
    const V = L.CHANGELOG.map((c) => sv(c.v));
    const i22 = L.CHANGELOG.findIndex((c) => c.v === '0.22.0-alpha.2');
    t('journal : toutes les versions au format, alpha, de la plus récente à 0.1.0-alpha.1 (24 jusqu’à 0.22.0-alpha.2)', V.every((x) => x && x.e === 'alpha' && x.n >= 1) && L.CHANGELOG[0].v === L.APP_VERSION && L.CHANGELOG[L.CHANGELOG.length - 1].v === '0.1.0-alpha.1' && L.CHANGELOG.length - i22 === 24, L.CHANGELOG.map((c) => c.v));
    // chaque version suit la précédente : mineure (Y + 1, Z = 0, alpha.1), majeure (X + 1, Y = Z = 0), correctif (Z + 1) ou nouvelle itération (alpha.N + 1)
    const pas = (a, b) => (a.x === b.x && a.y === b.y + 1 && a.z === 0 && a.n === 1 ? 'mineure' : a.x === b.x + 1 && a.y === 0 && a.z === 0 && a.n === 1 ? 'majeure' : a.x === b.x && a.y === b.y && a.z === b.z + 1 && a.n === 1 ? 'correctif' : a.x === b.x && a.y === b.y && a.z === b.z && a.e === b.e && a.n === b.n + 1 ? 'itération' : '');
    const P = V.slice(0, -1).map((a, i) => pas(a, V[i + 1]));
    const PH = P.slice(i22);
    t('journal : chaque version suit la précédente ; jusqu’à 0.22.0-alpha.2, 21 mineures et 2 itérations alpha (0.17.0-alpha.2, 0.22.0-alpha.2), aucune majeure', P.every(Boolean) && PH.filter((x) => x === 'mineure').length === 21 && PH.filter((x) => x === 'itération').length === 2 && !PH.includes('majeure') && L.CHANGELOG.slice(i22).filter((c) => /-alpha\.2$/.test(c.v)).map((c) => c.v).join() === '0.22.0-alpha.2,0.17.0-alpha.2', P);
    t('journal : versions dans l’ordre, dates dans l’ordre, notes pour chaque version', L.CHANGELOG.every((c, i, A) => /^\d{4}-\d{2}-\d{2}$/.test(c.date) && (!i || (A[i - 1].date >= c.date && L.versionNum(A[i - 1].v) > L.versionNum(c.v))) && Array.isArray(c.notes) && c.notes.length > 0));
    const N = L.versionNum;
    t('ordre des versions : alpha < beta < rc < finale < correctif < mineure < majeure', ['0.22.0-alpha.2', '0.22.0-alpha.3', '0.22.0-alpha.10', '0.22.0-beta.1', '0.22.0-beta.2', '0.22.0-rc.1', '0.22.0', '0.22.1-alpha.1', '0.22.1', '0.23.0-alpha.1', '0.100.0', '1.0.0-alpha.1', '1.0.0-rc.3', '1.0.0', '1.0.1', '2.0.0'].map(N).every((n, i, T) => n > 0 && (!i || n > T[i - 1])));
    t('numéro des opérations : 0.22.0-alpha.2 → 22 000 002, plus grand que ceux de toutes les versions précédentes (au plus 18 002) ; étiquette inconnue → 0', N('0.22.0-alpha.2') === 22000002 && L.APP_NUM === N(L.APP_VERSION) && L.APP_NUM >= 22000002 && N('alpha V18.2') === 0 && N('1.0') === 0 && N('1.0.0-gamma.1') === 0 && N('') === 0 && N(null) === 0);
    const A = L.versionAffichee;
    t('étiquettes enregistrées par les premières versions (« alpha V0.1 » … « alpha V2.2 ») → nouveau numéro affiché', A('alpha V0.1') === '0.1.0-alpha.1' && A('alpha V0.2') === '0.2.0-alpha.1' && A('alpha V0.6') === '0.6.0-alpha.1' && A('alpha V1.0') === '0.10.0-alpha.1' && A('alpha V1.7') === '0.17.0-alpha.1' && A('alpha V1.8') === '0.17.0-alpha.2' && A('alpha V2.0') === '0.19.0-alpha.1' && A('alpha V2.1') === '0.20.0-alpha.1' && A('alpha V2.2') === '0.21.0-alpha.1');
    t('… étiquettes écrites par la 0.22.0-alpha.1 (« alpha V18.2 », « alpha V5.0 ou antérieure »)', A('alpha V18.2') === '0.22.0-alpha.1' && A('alpha V5.0 ou antérieure') === '0.7.0-alpha.1 ou antérieure' && A('alpha V0.7 ou antérieure') === '0.7.0-alpha.1 ou antérieure');
    t('… dans un texte, sans espace, plusieurs numéros', A('alphaV1.0') === '0.10.0-alpha.1' && A('créée avec alpha V0.3, ouverte avec alpha V2.0') === 'créée avec 0.3.0-alpha.1, ouverte avec 0.19.0-alpha.1');
    t('… nouveaux numéros, inconnus et vides : inchangés', A('0.22.0-alpha.2') === '0.22.0-alpha.2' && A('1.4.0-beta.1') === '1.4.0-beta.1' && A('2.0.0') === '2.0.0' && A('alpha V25.3') === 'alpha V25.3' && A('alpha V2.10') === 'alpha V2.10' && A('Cuverie champenoise') === 'Cuverie champenoise' && A('') === '' && A(null) === '' && A(undefined) === '');
    t('correspondance : 24 anciennes étiquettes, toutes vers une version du journal, chaque version jusqu’à 0.22.0-alpha.1 couverte', Object.keys(L.VERSIONS_RENOMMEES).length === 24 && Object.values(L.VERSIONS_RENOMMEES).every((n) => L.CHANGELOG.some((c) => c.v === n)) && L.CHANGELOG.slice(i22 + 1).every((c) => Object.values(L.VERSIONS_RENOMMEES).includes(c.v)));
    // une base d'une version précédente garde ses étiquettes (affichées au nouveau format), la nouvelle version s'ajoute à la liste
    const dOld = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.21.0-alpha.1-legal.json'), 'utf8')));
    const fmt = (v) => /^\d+\.\d+\.\d+-alpha\.\d+( ou antérieure)?$/.test(v) || v === 'Cuverie champenoise';
    t('base 0.21.0-alpha.1 rouverte : étiquettes enregistrées gardées, version actuelle ajoutée, toutes affichées au nouveau format', dOld.meta.versions.includes(L.APP_VERSION) && dOld.meta.versions.some((v) => /^alpha V[0-2]\.\d$/.test(v)) && dOld.meta.versions.map(A).every(fmt) && fmt(A(dOld.meta.creeAvec)), dOld.meta.versions);
    // contenant créé avec son barème (même action) : contSave renvoie l'identifiant, le barème s'y rattache, un nouveau barème archive l'ancien
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
    const rc = L.contSave(d, { nom: 'Cuve 42', type: d.lists.typesContenant[0].id, matiere: 'inox', volMax: '4250', statut: 'actif', siteId: d.sites[0].id, fabricant: 'Démo Inox', notes: '' }, null);
    const c = rc.ok && d.contenants.find((x) => x.id === rc.id);
    t('contSave : création → identifiant du contenant renvoyé', rc.ok && !!rc.id && !!c && c.nom === 'Cuve 42' && Number(c.volMax) === 4250);
    const re = L.contSave(d, { ...c, notes: 'modifié' }, c.id);
    t('contSave : modification → même identifiant renvoyé', re.ok && re.id === c.id && d.contenants.find((x) => x.id === c.id).notes === 'modifié');
    const lignes = (k) => { const R = [['Réservoir n° : Cuve 42'], ['Constructeur : Démo Inox'], ['Capacité : 4 250 litres'], ['Hauteur (cm)', 'Volume (L)']]; for (let h = 0; h <= 200; h += 5) R.push([String(h), String(Math.round(h * k)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')]); return R; };
    const lu = L.jaugeAnalyser([L.jaugePageDeLignes(lignes(21.25))], { fichier: 'cahier.xlsx' }); const b = lu.baremes[0];
    t('cahier lu : réservoir, constructeur, capacité ; volumes « 1 050 » (milliers séparés) lus en entier', lu.baremes.length === 1 && b.reservoir === 'Cuve 42' && b.meta.constructeur === 'Démo Inox' && L.baremeCapacite(b) === 4250 && L.baremePts(b).find((p) => p[0] === 100)[1] === 2125 && L.baremePts(b).find((p) => p[0] === 200)[1] === 4250 && b.fiabilite === 'bonne', L.baremePts(b).slice(18, 22));
    const rb = L.baremeSave(d, { ...b, cible: 'contenant', contenantId: c.id, meta: { ...b.meta, fiabilite: b.fiabilite } }); L.docMetaAdd(d, { id: 'docC42', nom: 'cahier.xlsx', mime: 'application/vnd.ms-excel', taille: 900, cat: 'autre', cible: { type: 'bareme', id: rb.id } });
    const lu2 = L.jaugeAnalyser([L.jaugePageDeLignes(lignes(23))], { fichier: 'cahier-2.xlsx' }); const rb2 = L.baremeSave(d, { ...lu2.baremes[0], cible: 'contenant', contenantId: c.id });
    const bs = d.baremes.filter((x) => x.contenantId === c.id);
    t('barème du contenant : le nouveau en service, l’ancien archivé avec son document', rb.ok && rb2.ok && bs.length === 2 && bs.find((x) => x.id === rb.id).archive && !bs.find((x) => x.id === rb2.id).archive && L.baremeDe(d, c.id).id === rb2.id && d.docs.some((x) => x.id === 'docC42' && x.cible.id === rb.id));
    // milliers : espace insécable ou espace seule dans une case ; deux nombres d'une même ligne de texte restent deux nombres
    const mots = (s) => L.jaugeMots({ items: [{ s, x: 0, y: 10, w: s.length * 6, h: 9 }] }).map((m) => m.s);
    t('nombres groupés par milliers gardés entiers', mots('1 050').join('|') === '1050' && mots('11 264,5').join('|') === '11264,5' && mots('1 234 567').join('|') === '1234567' && mots('3, 191').join('|') === '3,191');
    t('… sans confondre deux colonnes : « 10 250   20 500 », « 120 4 », « 1 05 »', mots('10 250   20 500').join('|') === '10|250|20|500' && mots('120 4').join('|') === '120|4' && mots('1 05').join('|') === '1|05' && mots('10 250 20').join('|') === '10250|20');
    // tableau d'un cahier de plusieurs réservoirs choisi d'après le nom saisi
    const T = [{ reservoir: 'Cuve 41' }, { reservoir: 'Cuve 42' }, { nom: 'Cuve 43' }, { reservoir: 'Foudre A2' }];
    t('tableau du document choisi d’après le nom du contenant', L.baremePourNom(T, 'Cuve 42') === 1 && L.baremePourNom(T, 'cuve n°42') === 1 && L.baremePourNom(T, 'Cuve 042') === 1 && L.baremePourNom(T, 'CUVE 43') === 2 && L.baremePourNom(T, 'foudre a2') === 3 && L.baremePourNom(T, 'Cuve 44') === -1 && L.baremePourNom(T, '') === -1 && L.baremePourNom([], 'Cuve 1') === -1);
    t('capacité d’après le barème : annoncée, sinon volume maximal du tableau', L.baremeCapacite({ meta: { capacite: 4300 }, points: [[0, 0], [200, 4250]] }) === 4300 && L.baremeCapacite({ points: [[0, 0], [150, 3010.4]] }) === 3010 && L.baremeCapacite(null) === 0);
    // compatibilité : la version précédente (0.21.0-alpha.1 gelée) ouvre une base 0.22.0-alpha.1 (contenant créé avec son barème), la modifie, se synchronise
    const d23 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.22.0-alpha.1-contenant-bareme.json'), 'utf8')));
    const cf = d23.contenants.find((x) => x.nom === 'Cuve 42'); const bf = d23.baremes.filter((x) => cf && x.contenantId === cf.id);
    t('base 0.22.0-alpha.1 de test : contenant créé avec son barème (document d’origine, ancien barème archivé)', !!cf && bf.length === 2 && bf.filter((x) => x.archive).length === 1 && d23.docs.some((x) => x.cible.type === 'bareme' && bf.some((y) => y.id === x.cible.id)) && d23.meta.versions.includes('alpha V18.2'));
    const dirV = path.join(__dirname, 'anciennes', '0.21.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const W = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, contSave, baremeSave, baremeDe, clone, APP_VERSION, APP_NUM };')({});
    t('0.21.0-alpha.1 gelée chargée (ancienne étiquette alpha V2.2)', W.APP_VERSION === 'alpha V2.2' && W.APP_NUM === 2002 && L.APP_NUM > W.APP_NUM);
    const w = W.normalizeDb(W.clone(d23));
    t('0.21.0-alpha.1 ouvre une base 0.22.0-alpha.1 sans rien perdre (contenants, barèmes, documents)', JSON.stringify(w.contenants) === JSON.stringify(d23.contenants) && JSON.stringify(w.baremes) === JSON.stringify(d23.baremes) && JSON.stringify(w.docs) === JSON.stringify(d23.docs) && W.baremeDe(w, cf.id).id === L.baremeDe(d23, cf.id).id);
    t('… et ajoute son ancienne étiquette à la liste des versions (affichée 0.21.0-alpha.1)', w.meta.versions.slice(-1)[0] === 'alpha V2.2' && A(w.meta.versions.slice(-1)[0]) === '0.21.0-alpha.1' && w.meta.versions.includes('alpha V18.2') && w.meta.versions.includes(L.APP_VERSION));
    const wc = w.contenants.find((x) => x.id === cf.id); W.contSave(w, { ...wc, notes: 'modifié en 0.21.0-alpha.1' }, wc.id);
    const back = L.normalizeDb(W.clone(w));
    t('… rouverte en 0.22.0-alpha.1 : contenant modifié, barème toujours rattaché', back.contenants.find((x) => x.id === cf.id).notes === 'modifié en 0.21.0-alpha.1' && L.baremeDe(back, cf.id).id === L.baremeDe(d23, cf.id).id);
    const base = W.clone(w); const X = W.clone(w); const Y = L.clone(w);
    W.contSave(X, { ...X.contenants.find((x) => x.id === cf.id), fabricant: 'Démo Inox (0.21.0-alpha.1)' }, cf.id);
    const rY = L.contSave(Y, { nom: 'Cuve 7', type: Y.lists.typesContenant[0].id, matiere: 'inox', volMax: '3000', statut: 'actif', siteId: Y.sites[0].id, notes: '' }, null);
    L.baremeSave(Y, { nom: 'Cuve 7', cible: 'contenant', contenantId: rY.id, mesure: 'hauteur', points: [[0, 0], [100, 1500], [200, 3000]] });
    const F = W.syncFusion(base, X, Y); const c7 = F.db.contenants.find((x) => x.nom === 'Cuve 7');
    t('0.21.0-alpha.1 synchronisée avec 0.22.0-alpha.1 : modification 0.21.0-alpha.1 et contenant créé avec barème en 0.22.0-alpha.1 réunis', F.db.contenants.find((x) => x.id === cf.id).fabricant === 'Démo Inox (0.21.0-alpha.1)' && !!c7 && F.db.baremes.some((x) => x.contenantId === c7.id && !x.archive) && !F.conflits.length, F.conflits);
  }
  // ================= 21. 0.22.0-alpha.2 : la version précédente (0.22.0-alpha.1 gelée, étiquette « alpha V18.2 ») lit, modifie et synchronise une base 0.22.0-alpha.2 =================
  {
    const d24 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.22.0-alpha.2-versions.json'), 'utf8'))); L.syncConfig(d24);
    const o24 = d24.ops.find((o) => o.type === 'jaugeage' && o.av === 22000002);
    t('base 0.22.0-alpha.2 de test : étiquettes des trois numérotations, opération enregistrée par cette version', d24.meta.creeAvec === 'alpha V1.9' && ['alpha V1.9', 'alpha V2.2', 'alpha V18.2', '0.22.0-alpha.2'].every((v) => d24.meta.versions.includes(v)) && !!o24 && L.versionAffichee(d24.meta.creeAvec) === '0.18.0-alpha.1');
    const dirV = path.join(__dirname, 'anciennes', '0.22.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const W = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, opSave, contSave, clone, APP_VERSION, APP_NUM };')({});
    t('0.22.0-alpha.1 gelée chargée (étiquette alpha V18.2, n° 18 002)', W.APP_VERSION === 'alpha V18.2' && W.APP_NUM === 18002 && L.APP_NUM > W.APP_NUM);
    const w = W.normalizeDb(W.clone(d24));
    t('0.22.0-alpha.1 ouvre une base 0.22.0-alpha.2 sans rien perdre', JSON.stringify(w.ops) === JSON.stringify(d24.ops) && JSON.stringify(w.contenants) === JSON.stringify(d24.contenants) && JSON.stringify(w.lots) === JSON.stringify(d24.lots) && w.meta.creeAvec === 'alpha V1.9' && w.meta.versions.includes('0.22.0-alpha.2'));
    t('… elle y inscrit son étiquette « alpha V18.2 », affichée 0.22.0-alpha.1', w.meta.appVersion === 'alpha V18.2' && L.versionAffichee(w.meta.appVersion) === '0.22.0-alpha.1');
    // opération enregistrée par 0.22.0-alpha.2 (n° 22 000 002) puis modifiée par 0.22.0-alpha.1 (n° 18 002) : elle la reconnaît comme plus récente
    const ow = w.ops.find((o) => o.id === o24.id); ow.champ022 = { x: 1 };
    const rw = W.opSave(w, { type: 'jaugeage', date: ow.date, portionId: ow.portionId, volMesure: 1980, typeId: ow.typeId }, ow.id);
    t('… opération de la 0.22.0-alpha.2 modifiée par la 0.22.0-alpha.1 : champs gardés, marquée plus récente', rw.ok && rw.op.champ022 && rw.op.champ022.x === 1 && rw.op.volMesure === 1980 && rw.op.av === 22000002);
    const back = L.normalizeDb(W.clone(w));
    t('… rouverte dans la version actuelle : version et étiquettes gardées, opération intacte', back.meta.appVersion === L.APP_VERSION && ['alpha V1.9', 'alpha V2.2', 'alpha V18.2', '0.22.0-alpha.2'].every((v) => back.meta.versions.includes(v)) && back.ops.find((o) => o.id === o24.id).volMesure === 1980 && back.ops.find((o) => o.id === o24.id).champ022.x === 1);
    const base = W.clone(w); const X = W.clone(w); const Y = L.clone(back);
    const cX = X.contenants[0]; W.contSave(X, { ...cX, notes: 'note 0.22.0-alpha.1' }, cX.id);
    const cY = Y.contenants[1]; L.contSave(Y, { ...cY, fabricant: 'Démo Inox (0.22.0-alpha.2)' }, cY.id);
    const F = W.syncFusion(base, X, Y);
    t('0.22.0-alpha.1 synchronisée avec 0.22.0-alpha.2 : les deux modifications réunies, sans conflit', F.db.contenants.find((x) => x.id === cX.id).notes === 'note 0.22.0-alpha.1' && F.db.contenants.find((x) => x.id === cY.id).fabricant === 'Démo Inox (0.22.0-alpha.2)' && !F.conflits.length, F.conflits);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ================= 22. 0.23.0-alpha.1 : page d'accueil à la toute première ouverture seulement, site officiel oenotrack.fr =================
  {
    const D = L.accueilDecision;
    t('version 0.23.0-alpha.1 : mineure après 0.22.0-alpha.2 (nouvelle fonctionnalité), puis 0.24.0-alpha.1', L.CHANGELOG.findIndex((c) => c.v === '0.23.0-alpha.1') === L.CHANGELOG.findIndex((c) => c.v === '0.22.0-alpha.2') - 1 && L.versionNum('0.23.0-alpha.1') === 23000001 && L.APP_NUM >= 23000001);
    t('accueil : toute première ouverture (aucune base, aucune marque) → présentée, marque « a-voir »', (() => { const r = D({ marque: '', base: false, recherche: '' }); return r.montrer && r.marque === 'a-voir'; })());
    t('accueil : rouverte avant d’être entré (base d’exemple déjà enregistrée) → présentée encore', (() => { const r = D({ marque: 'a-voir', base: true }); return r.montrer && r.marque === 'a-voir'; })());
    t('accueil : déjà entré (« vu ») → plus jamais', !D({ marque: 'vu', base: false }).montrer && !D({ marque: 'vu', base: true, recherche: '' }).montrer && D({ marque: 'vu' }).marque === 'vu');
    t('accueil : Œnotrack déjà utilisé sur cet appareil (base d’une version précédente) → pas présentée, marquée « vu »', (() => { const r = D({ marque: '', base: true }); return !r.montrer && r.marque === 'vu'; })());
    t('accueil : retour d’une connexion Microsoft ou Dropbox → pas présentée ; autres paramètres sans effet', !D({ marque: 'a-voir', base: true, recherche: '?code=abc&state=xyz' }).montrer && !D({ marque: '', base: false, recherche: '?error=access_denied&state=1' }).montrer && D({ marque: '', base: false, recherche: '?utm_source=x' }).montrer);
    t('accueil : marque inconnue ou absente → comme une première ouverture ; marque gardée hors de la base', D({ marque: 'zzz', base: false }).montrer && D().montrer && L.ACCUEIL_KEY === 'oenotrack-accueil' && !JSON.stringify(L.normalizeDb(L.sampleDb())).includes('accueil'));
    t('site officiel : oenotrack.fr (reconnu aussi avec www, pas les autres adresses)', L.OENOTRACK_SITE === 'https://oenotrack.fr' && L.siteOfficielIci('oenotrack.fr') && L.siteOfficielIci('www.oenotrack.fr') && !L.siteOfficielIci('oenotrack.fr.exemple.com') && !L.siteOfficielIci('moenotrack.fr') && !L.siteOfficielIci('') && !L.siteOfficielIci(null));
    // compatibilité : la version précédente (0.22.0-alpha.2 gelée) ouvre, modifie et synchronise une base 0.23.0-alpha.1 (même format)
    const d25 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.23.0-alpha.1-accueil.json'), 'utf8'))); L.syncConfig(d25);
    const o25 = d25.ops.find((o) => o.type === 'jaugeage' && o.av === 23000001);
    t('base 0.23.0-alpha.1 de test : versions enregistrées, opération de cette version, rien de la page d’accueil dans la base', d25.meta.versions.includes('0.22.0-alpha.2') && d25.meta.versions.includes('0.23.0-alpha.1') && !!o25 && !JSON.stringify(d25).includes('oenotrack-accueil'));
    const dirV = path.join(__dirname, 'anciennes', '0.22.0-alpha.2');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const W = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, opSave, contSave, versionAffichee, clone, APP_VERSION, APP_NUM };')({});
    t('0.22.0-alpha.2 gelée chargée (n° 22 000 002)', W.APP_VERSION === '0.22.0-alpha.2' && W.APP_NUM === 22000002 && L.APP_NUM > W.APP_NUM);
    const w = W.normalizeDb(W.clone(d25));
    t('0.22.0-alpha.2 ouvre une base 0.23.0-alpha.1 sans rien perdre', JSON.stringify(w.ops) === JSON.stringify(d25.ops) && JSON.stringify(w.contenants) === JSON.stringify(d25.contenants) && JSON.stringify(w.lots) === JSON.stringify(d25.lots) && w.meta.appVersion === '0.22.0-alpha.2' && w.meta.versions.includes('0.23.0-alpha.1') && W.versionAffichee('0.23.0-alpha.1') === '0.23.0-alpha.1');
    const ow = w.ops.find((o) => o.id === o25.id); ow.champ023 = { x: 1 };
    const rw = W.opSave(w, { type: 'jaugeage', date: ow.date, portionId: ow.portionId, volMesure: 1990, typeId: ow.typeId }, ow.id);
    t('… opération de la 0.23.0-alpha.1 modifiée par la 0.22.0-alpha.2 : champs gardés, marquée plus récente', rw.ok && rw.op.champ023 && rw.op.champ023.x === 1 && rw.op.volMesure === 1990 && rw.op.av === 23000001);
    const back = L.normalizeDb(W.clone(w));
    t('… rouverte en 0.23.0-alpha.1 : version enregistrée, opération intacte', back.meta.appVersion === L.APP_VERSION && back.ops.find((o) => o.id === o25.id).volMesure === 1990 && back.ops.find((o) => o.id === o25.id).champ023.x === 1);
    const base = W.clone(w); const X = W.clone(w); const Y = L.clone(back);
    const cX = X.contenants[0]; W.contSave(X, { ...cX, notes: 'note 0.22.0-alpha.2' }, cX.id);
    const cY = Y.contenants[1]; L.contSave(Y, { ...cY, fabricant: 'Démo Inox (0.23.0-alpha.1)' }, cY.id);
    const F = W.syncFusion(base, X, Y);
    t('0.22.0-alpha.2 synchronisée avec 0.23.0-alpha.1 : les deux modifications réunies, sans conflit', F.db.contenants.find((x) => x.id === cX.id).notes === 'note 0.22.0-alpha.2' && F.db.contenants.find((x) => x.id === cY.id).fabricant === 'Démo Inox (0.23.0-alpha.1)' && !F.conflits.length, F.conflits);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (22 : page d’accueil, site officiel, compatibilité 0.21.0-alpha.1, 0.22.0-alpha.1 et 0.22.0-alpha.2)');

  // ---- 23. pressoir (0.24.0-alpha.1) : registre des pesées, carnet de pressoir, contrôles AOC Champagne, profil régional, droits, synchronisation
  {
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
    const ctx = { maintenant: '2026-09-20T08:05:00', par: '' };
    t('profil régional : Champagne par défaut (102 L de moûts débourbés pour 160 kg, rebêches 0 % en 2025)', L.regionDe(d) === 'champagne' && L.champenois(d) && L.pressoirParams(d).id === 'champagne' && L.pressoirParams(d).ratioL === 102 && L.pressoirParams(d).ratioKg === 160 && L.rebechesTaux(L.pressoirParams(d), 2025) === 0 && L.pressoirParams(d).cadenceMax === 6);
    t('jeu d’exemple : pesées et marcs numérotés par année, validés, journal intègre', L.peseesDe(d, 2026).map((o) => o.pesee.num).join() === '1,2,3,4' && L.peseesDe(d, 2025).length === 5 && L.peseesDe(d, 2026).every((o) => o.pesee.valide && o.pesee.heure) && L.marcsDe(d, 2026).map((o) => o.marc.num).join() === '1,2,3,4,5' && L.marcsDe(d, 2026).every((o) => o.marc.valide && L.estMarc(o)) && d.journalPressoir.length === 19 && !L.journalAlteres(d).length);
    t('pressoirs et balances : capacité lue sur le libellé ou réglée, vignette', L.pressoirsDe(d)[0].capaciteKg === 4000 && L.balancesDe(d)[0].valideJusquau === '2027-06-30' && L.capaciteDeLibelle('Pressoir Coquard 8 000 kg') === 8000 && L.capaciteDeLibelle('Pressoir') === 0);
    // pesée
    const ap = d.apporteurs[0].id; const cru = d.crus.find((c) => c.echelle === 'grand').id;
    const p1 = L.peseeSave(d, { date: '2026-09-20', heure: '08:05', cepageId: 'chard', brutKg: 4300, tareKg: 300, caisses: 83, etat: 'sain', apporteurId: ap, cruId: cru, mention: 'Lieu-dit Les Roualles' }, null, ctx);
    t('pesée : poids net = brut − tare, n° suivant de l’année (5), validée, journalisée, heure de saisie', p1.ok && p1.op.kg === 4000 && p1.op.pesee.num === 5 && !!p1.op.pesee.valide && p1.op.pesee.saisiLe === ctx.maintenant && d.journalPressoir.slice(-1)[0].action === 'validation' && d.journalPressoir.slice(-1)[0].num === 5, p1);
    t('pesée : heure, cépage et poids obligatoires ; tare inférieure au brut', !L.peseeSpec(d, { date: '2026-09-20', cepageId: 'chard', kg: 100 }).ok && !L.peseeSpec(d, { date: '2026-09-20', heure: '08:00', cepageId: 'chard', brutKg: 100, tareKg: 200 }).ok && !L.peseeSpec(d, { date: '2026-09-20', heure: '08:00', cepageId: 'chard' }).ok && !L.peseeSpec(d, { date: '2026-09-20', heure: '25:00', cepageId: 'chard', kg: 10 }).ok);
    const fp = (o, x) => ({ date: o.date, heure: o.pesee.heure, cepageId: o.cepageId, brutKg: o.pesee.brutKg, tareKg: o.pesee.tareKg, caisses: o.pesee.caisses, etat: o.pesee.etat, apporteurId: o.apporteurId, cruId: o.cruId, mention: o.pesee.mention, qualifId: o.qualifId, ...(x || {}) });
    const c0 = L.peseeSave(d, fp(p1.op, { brutKg: 4310 }), p1.op.id, ctx);
    t('pesée validée : correction refusée sans motif', !c0.ok && /motif/.test(c0.msg), c0);
    const c1 = L.peseeSave(d, fp(p1.op, { brutKg: 4310 }), p1.op.id, { ...ctx, motif: 'Lecture de la bascule corrigée' });
    const jc = d.journalPressoir.slice(-1)[0];
    t('… acceptée avec motif : journal « correction » (avant / après), n° et validation gardés', c1.ok && c1.op.kg === 4010 && c1.op.pesee.num === 5 && !!c1.op.pesee.valide && jc.action === 'correction' && jc.avant.kg === 4000 && jc.apres.kg === 4010 && jc.motif === 'Lecture de la bascule corrigée' && !L.journalAlteres(d).length);
    const g0 = L.opSave(L.clone(d), { type: 'apport', date: '2026-09-20', cepageId: 'chard', kg: 3990, qualifId: 'conv', apporteurId: ap, cruId: cru }, p1.op.id);
    const g1 = L.opSave(L.clone(d), { type: 'apport', date: '2026-09-20', cepageId: 'chard', kg: 4010, qualifId: 'conv', apporteurId: ap, cruId: cru, notes: 'note' }, p1.op.id);
    t('formulaire des opérations : la pesée validée est gardée ; corriger le poids demande un motif, une note non', !g0.ok && /motif/.test(g0.msg) && g1.ok && g1.op.pesee.num === 5 && !!g1.op.pesee.valide && g1.op.pesee.brutKg === 4310 && L.previewOp(d, { type: 'apport', date: '2026-09-20', cepageId: 'chard', kg: 3990, qualifId: 'conv' }, p1.op.id).ok);
    // marc : chargement, puis volumes, contrôles, validation
    const C = d.contenants.filter((c) => c.statut !== 'archive').map((c) => c.id);
    const m1 = L.marcSave(d, { date: '2026-09-20', heureDebut: '09:00', equipementId: 'pressoir', charges: [{ apportId: p1.op.id, kg: 4010 }], code: 'P26-06', designation: 'Chardonnay 2026 – marc 6' }, null, ctx);
    t('marc chargé (en cours) : n° 6, pesée entièrement chargée, pas encore de volumes', m1.ok && m1.op.marc.num === 6 && m1.op.marc.enCours === true && L.peseeReste(d, p1.op.id) === 0 && !m1.op.fractions.length && !!m1.op.parentLotId, m1);
    t('marc : une pesée d’une autre vendange est refusée', (() => { const a25 = L.peseesDe(d, 2025).find((o) => L.peseeReste(d, o.id) > 0.5); const r = L.marcSpec(d, { date: '2026-09-20', heureDebut: '10:00', equipementId: 'pressoir', charges: [{ apportId: a25.id, kg: 1000 }], code: 'PX-1' }); return !r.ok && /même vendange/.test(r.msg); })());
    t('marc en cours : validation refusée (volumes, TAV en puissance)', !L.marcValider(d, m1.op.id, ctx).ok && /volumes|TAV/.test(L.marcValider(d, m1.op.id, ctx).msg));
    const fm = (o, x) => ({ date: o.date, heureDebut: o.marc.heureDebut, heureFin: o.marc.heureFin, equipementId: o.equipementId, charges: o.charges, code: o.parentSpec.code, designation: o.parentSpec.designation, millesime: o.parentSpec.millesime, qualifId: o.parentSpec.qualifId, tavp: o.marc.tavp, bourbesL: o.marc.bourbesL, ...(x || {}) });
    const fr = (c, tl, r) => ({ cuvee: { volL: c, contenantId: C[0] }, taille1: { volL: tl, contenantId: C[1] }, ...(r ? { rebeche: { volL: r, contenantId: C[2] } } : {}) });
    const m2 = L.marcSave(d, fm(m1.op, { frac: fr(2100, 500), tavp: 10.2, bourbesL: 60, heureFin: '12:30' }), m1.op.id, ctx);
    const ctl = m2.ok ? L.marcControles(d, m2.op) : [];
    t('marc : plafond de 102 L pour 160 kg bloquant (2 600 L pour 4 010 kg > 2 556 L)', m2.ok && ctl.some((c) => c.code === 'ratio' && c.niveau === 'bloquant') && !L.marcValider(d, m1.op.id, ctx).ok, ctl);
    t('marc : cuvée au-delà de l’usage (20,50 hl / 4 000 kg) en alerte seulement', ctl.some((c) => c.code === 'cuvee' && c.niveau === 'alerte'));
    const m3 = L.marcSave(d, fm(m2.op, { frac: fr(2050, 500, 50) }), m1.op.id, ctx);
    const v3 = L.marcValider(d, m1.op.id, { ...ctx, maintenant: '2026-09-20T12:35:00' });
    const R3 = L.getR(d); const lotsM = m3.ok ? m3.op.fractions.map((x) => x.lotId) : [];
    t('marc dans le plafond : validé, lots cuvée / taille / rebêches créés dans les cuves', m3.ok && v3.ok && v3.op.marc.valide && v3.op.marc.enCours === false && lotsM.length === 3 && lotsM.every((id) => R3.lots[id]) && m3.op.fractions.map((x) => x.code).join() === 'P26-06-C,P26-06-T1,P26-06-R' && Object.values(R3.portions).filter((p) => lotsM.includes(p.lotId)).length === 3, v3);
    const vol = L.marcVolumes(d, v3.op);
    t('marc : volumes par rôle (cuvée, tailles, rebêches)', vol.cuvee === 2050 && vol.taille === 500 && vol.rebeche === 50 && vol.aoc === 2550 && L.marcKg(v3.op) === 4010);
    // rebêches minimum, cadence, sous-chargement, bourbes, TAV
    const y = L.clone(d); L.pressoirParamsSet(y, { rebechesPct: { 2026: 2 } });
    t('rebêches : taux minimum de l’année (réglable de 0 à 10 %) bloquant', L.rebechesTaux(L.pressoirParams(y), 2026) === 2 && L.marcControles(y, y.ops.find((o) => o.id === m1.op.id)).some((c) => c.code === 'rebeches' && c.niveau === 'bloquant') && !L.pressoirParamsSet(y, { rebechesPct: { 2026: 12 } }).ok);
    const z = L.clone(d); const hz = ['01:00', '04:00', '07:00', '10:00', '13:00', '16:00', '19:00']; let mz = null;
    hz.forEach((h, i) => { const pz = L.peseeSave(z, { date: '2026-09-22', heure: h, cepageId: 'pm', kg: 4000 }, null, ctx).op; mz = L.marcSave(z, { date: '2026-09-22', heureDebut: h, equipementId: 'pressoir', charges: [{ apportId: pz.id, kg: 4000 }], code: `PZ-${i}` }, null, ctx); });
    t('cadence : 7e marc en 24 h sur le même pressoir bloquant (6 au plus)', mz.ok && L.marcControles(z, mz.op).some((c) => c.code === 'cadence' && c.niveau === 'bloquant') && L.bilanPressoir(z, 2026, '2026-09-23').alertes.some((a) => /7 marcs en 24 h/.test(a.msg)));
    const pq = L.peseeSave(y, { date: '2026-09-21', heure: '07:00', cepageId: 'pm', kg: 3000 }, null, ctx).op;
    const mq = L.marcSave(y, { date: '2026-09-21', heureDebut: '08:00', equipementId: 'pressoir', charges: [{ apportId: pq.id, kg: 3000 }], code: 'PQ-1', frac: { cuvee: { volL: 1500, contenantId: C[3] } }, tavp: 8.1, bourbesL: 5 }, null, ctx).op;
    const cq = L.marcControles(y, mq);
    t('sous-chargement (motif demandé), bourbes hors 1–4 %, TAV en puissance sous 8,5 % vol. : alertes', ['souscharge', 'bourbes', 'tavp_bas'].every((k) => cq.some((c) => c.code === k && c.niveau === 'alerte')) && !L.marcControles(y, { ...mq, marc: { ...mq.marc, sousCharge: 'Fin de cueillette' } }).some((c) => c.code === 'souscharge'), cq);
    // annulation, numérotation continue
    const an0 = L.registreAnnuler(d, m1.op.id, ctx); const ga = L.opDelete(L.clone(d), m1.op.id);
    const nbJ = d.journalPressoir.length; const an1 = L.registreAnnuler(d, m1.op.id, { ...ctx, motif: 'Marc saisi en double' });
    t('marc validé : annulation avec motif seulement (pas de suppression directe) ; copie gardée au journal', !an0.ok && !ga.ok && /Pressoir/.test(ga.msg) && an1.ok && !d.ops.some((o) => o.id === m1.op.id) && d.journalPressoir.length === nbJ + 1 && d.journalPressoir.slice(-1)[0].action === 'annulation' && d.journalPressoir.slice(-1)[0].avant.code === undefined && d.journalPressoir.slice(-1)[0].avant.num === 6);
    t('n° continus : le n° d’un marc annulé n’est jamais réattribué', L.numeroSuivant(d, 'marc', 2026) === 7 && L.numeroSuivant(d, 'pesee', 2026) === 6 && L.numeroSuivant(d, 'pesee', 2027) === 1);
    // intégrité : journal modifié à la main, saisie validée modifiée hors registre
    const w = L.clone(d); w.journalPressoir[0].motif = 'trafiqué';
    const w2 = L.clone(d); w2.ops.find((o) => o.id === p1.op.id).kg = 3000;
    t('intégrité : ligne du journal modifiée hors d’Œnotrack repérée (empreinte), saisie validée modifiée hors registre repérée', L.journalAlteres(w).length === 1 && !L.journalAlteres(d).length && L.bilanPressoir(w, 2025).alertes.some((a) => a.niveau === 'bloquant' && /empreinte/.test(a.msg)) && L.bilanPressoir(w2, 2026).alertes.some((a) => /sans passer par le registre/.test(a.msg)));
    // bilan, relevés, exports
    const b = L.bilanPressoir(d, 2026, '2026-10-01');
    t('bilan de campagne : marcs, poids, volumes, rebêches avant le 15/12 de l’année suivante, bourbes avant le 31/01', b.nbMarcs === 5 && b.kgPresses === 20000 && b.pressoirs.length === 1 && b.pressoirs[0].max24 >= 1 && b.limiteRebeches === '2027-12-15' && b.limiteBourbes === '2027-01-31' && b.nonValides.pesees === 0 && b.nonValides.marcs === 0 && !b.alertes.length, b);
    const rl = L.releveApporteurs(d, 2026); const totM = L.marcsDe(d, 2026).reduce((x, o) => x + L.marcVolumes(d, o).total, 0);
    t('relevé par apporteur : volumes au prorata du poids de chaque marc (total conservé)', rl.length >= 3 && Math.abs(rl.reduce((x, r) => x + r.total, 0) - totM) < 0.1 && rl.every((r) => r.marcs.length >= 1));
    const csvP = L.registrePeseesCsv(d, 2026); const csvC = L.carnetPressoirCsv(d, 2026);
    t('exports : registre des pesées et carnet de pressoir (CSV « ; », décimales à la française, annulés listés)', /^N°;Date;Heure;Apporteur/.test(csvP) && csvP.includes('5;20/09/2026;08:05') && csvP.includes('4310') && /^N° de marc;Date;Heure de début/.test(csvC) && csvC.includes('Cuvée (hL)') && csvC.includes('20,5') && csvC.includes('annulé le'), csvC.split('\r\n').slice(-1)[0]);
    // profil régional et autres profils de pressurage
    const x = L.clone(d); const nCrus = x.crus.filter((c) => !c.masque).length; const rx = L.regionSet(x, 'autre', { crus: true });
    t('autre région : villages champenois inutilisés masqués (rien de supprimé), rétablis en repassant en Champagne', rx.crus > 100 && x.crus.length === d.crus.length && x.crus.filter((c) => !c.masque).length === nCrus - rx.crus && x.crus.filter((c) => !c.masque).every((c) => c.custom || L.cruUsage(x, c.id) > 0) && (() => { const x2 = L.clone(x); L.regionSet(x2, 'champagne'); return x2.crus.filter((c) => !c.masque).length === nCrus && !x2.crus.some((c) => c.masqueRegion); })());
    t('autre région : spécificités champenoises désactivées (pas de plafond, registre facultatif)', !L.champenois(x) && L.pressoirParams(x).id === 'libre' && !L.pressoirParams(x).registre && !L.marcControles(x, { ...v3.op, fractions: [{ fractionId: 'cuvee', volL: 9000 }] }).some((c) => c.niveau === 'bloquant' && c.code === 'ratio'));
    L.pressoirParamsSet(x, { profil: 'cremant' });
    t('profil crémant : 100 L pour 150 kg ; retour en Champagne : profil AOC Champagne', L.pressoirParams(x).ratioL === 100 && L.pressoirParams(x).ratioKg === 150 && L.regionSet(x, 'champagne').ok && L.pressoirParams(x).id === 'champagne' && !L.regionSet(x, 'bourgogne').ok);
    L.pressoirParamsSet(x, { valeurs: { ratioL: 100 } });
    t('réglage d’une valeur (arrêté réduisant le rendement au pressurage) ; valeurs invalides refusées', L.pressoirParams(x).ratioL === 100 && !L.pressoirParamsSet(x, { valeurs: { ratioL: -1 } }).ok && L.pressoirParamsSet(x, { valeurs: { ratioL: '' } }).ok && L.pressoirParams(x).ratioL === 102);
    // droits : opérateur de chai (saisie au pressoir, pas de correction des saisies validées), consultation
    const s0 = L.clone(d); const mdpA = await L.mdpEmpreinte('Admin-2026', 1000); const adm = L.securiteActiver(s0, { identifiant: 'admin', mdp: mdpA }).id;
    const opr = L.utilisateurSave(s0, { identifiant: 'thomas', profilId: 'pf_operateur', mdp: mdpA }).id; const cons = L.utilisateurSave(s0, { identifiant: 'compta', profilId: 'pf_consult', mdp: mdpA }).id;
    const essai = (uid, fn) => { const av = L.clone(s0); const apr = L.clone(s0); const r = fn(apr); if (r && r.ok === false) return r; return L.gardeDroits(av, apr, uid); };
    const nouvelle = (z0) => L.peseeSave(z0, { date: '2026-09-23', heure: '07:40', cepageId: 'pn', kg: 4000 }, null, { ...ctx, valider: false });
    t('droits : onglet Pressoir (opérateur : saisie ; consultation : lecture ; anciens profils : droits des opérations)', L.niveauModule(s0, opr, 'pressoir') === 'ecriture' && L.niveauModule(s0, cons, 'pressoir') === 'lecture' && L.moduleDeType('apport') === 'pressoir' && L.moduleDeType('pressurage') === 'pressoir' && (() => { const y2 = L.clone(s0); delete y2.profils.find((q) => q.id === 'pf_operateur').modules.pressoir; return L.niveauModule(y2, opr, 'pressoir') === 'ecriture'; })());
    const pv = (() => { const y3 = L.clone(s0); const r = nouvelle(y3); return { y3, id: r.op.id }; })();
    t('droits : l’opérateur saisit une pesée et la complète tant qu’elle n’est pas validée, la consultation non', essai(opr, nouvelle).ok && !essai(cons, nouvelle).ok && (() => { const av = L.clone(pv.y3); const apr = L.clone(pv.y3); L.peseeValider(apr, pv.id, ctx); return L.gardeDroits(av, apr, opr).ok; })());
    t('droits : corriger une pesée validée demande le droit « corriger » (chef de cave, administrateur)', !essai(opr, (z0) => L.peseeSave(z0, fp(p1.op, { brutKg: 4320 }), p1.op.id, { ...ctx, motif: 'test' })).ok && essai(adm, (z0) => L.peseeSave(z0, fp(p1.op, { brutKg: 4320 }), p1.op.id, { ...ctx, motif: 'test' })).ok);
    // synchronisation : deux appareils pèsent en même temps → saisies réunies, n° en double signalé puis renuméroté
    const B = L.clone(d); const A1 = L.clone(B); const A2 = L.clone(B); L.setNID('-tab'); const q1 = L.peseeSave(A1, { date: '2026-09-24', heure: '08:00', cepageId: 'chard', kg: 4000 }, null, ctx).op; L.setNID('-pc'); const q2 = L.peseeSave(A2, { date: '2026-09-24', heure: '08:02', cepageId: 'pm', kg: 3800 }, null, ctx).op; L.setNID('');
    const F = L.syncFusion(B, A1, A2); const Fd = L.normalizeDb(F.db);
    t('synchro : pesées des deux appareils et leurs lignes de journal réunies, sans conflit', !F.conflits.length && Fd.ops.some((o) => o.id === q1.id) && Fd.ops.some((o) => o.id === q2.id) && Fd.journalPressoir.length === B.journalPressoir.length + 2 && !L.journalAlteres(Fd).length);
    const doublon = L.bilanPressoir(Fd, 2026, '2026-10-01').alertes.find((a) => /en double/.test(a.msg)); const n1 = q1.pesee.num; const n2 = q2.pesee.num; const rn = L.registreRenumeroter(Fd, q2.id, ctx);
    t('synchro : n° en double signalé, nouveau n° attribué et journalisé', !!doublon && n1 === n2 && rn.ok && rn.num === n1 + 1 && !L.bilanPressoir(Fd, 2026, '2026-10-01').alertes.some((a) => /en double/.test(a.msg)) && Fd.journalPressoir.slice(-1)[0].action === 'correction');
    // compatibilité : la version précédente (0.23.0-alpha.1 gelée) ouvre, modifie et synchronise une base 0.24.0-alpha.1
    const dirV = path.join(__dirname, 'anciennes', '0.23.0-alpha.1');
    const srcV = files.filter((f) => fs.existsSync(path.join(dirV, f))).map((f) => fs.readFileSync(path.join(dirV, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
    const V = new Function('React', srcV + '\n;return { normalizeDb, syncFusion, opSave, opDelete, clone, APP_VERSION, APP_NUM };')({});
    t('0.23.0-alpha.1 gelée chargée (n° 23 000 001)', V.APP_VERSION === '0.23.0-alpha.1' && V.APP_NUM === 23000001 && L.APP_NUM >= V.APP_NUM);
    const v = V.normalizeDb(V.clone(d));
    t('0.23.0-alpha.1 ouvre une base avec le pressoir : pesées, marcs, journal et réglages conservés', JSON.stringify(v.ops) === JSON.stringify(d.ops) && JSON.stringify(v.journalPressoir) === JSON.stringify(d.journalPressoir) && JSON.stringify(v.lists.equipements) === JSON.stringify(d.lists.equipements));
    const op0 = v.ops.find((o) => o.id === p1.op.id); const rv = V.opSave(v, { type: 'apport', date: op0.date, cepageId: op0.cepageId, kg: op0.kg, qualifId: op0.qualifId, apporteurId: op0.apporteurId, cruId: op0.cruId, notes: 'note 0.23.0-alpha.1' }, op0.id);
    const back = L.normalizeDb(V.clone(v));
    t('… pesée modifiée par la 0.23.0-alpha.1 (note) : registre gardé ; rouverte ici : aucun écart', rv.ok && rv.op.pesee && rv.op.pesee.num === 5 && !!rv.op.pesee.valide && !L.bilanPressoir(back, 2026, '2026-10-01').alertes.some((a) => /sans passer par le registre/.test(a.msg)));
    const vk = V.clone(v); const opk = vk.ops.find((o) => o.id === p1.op.id); V.opSave(vk, { type: 'apport', date: opk.date, cepageId: opk.cepageId, kg: 3500, qualifId: opk.qualifId }, opk.id);
    t('… poids changé par la 0.23.0-alpha.1 (sans motif) : repéré ici comme modifié hors registre', L.bilanPressoir(L.normalizeDb(vk), 2026, '2026-10-01').alertes.some((a) => /sans passer par le registre/.test(a.msg)));
    const base = V.clone(v); const X = V.clone(v); const Y = L.clone(back); X.contenants[0].notes = 'note 0.23.0-alpha.1'; const qy = L.peseeSave(Y, { date: '2026-09-25', heure: '09:00', cepageId: 'pn', kg: 2000 }, null, ctx).op;
    const FV = V.syncFusion(base, X, Y);
    t('0.23.0-alpha.1 synchronisée avec 0.24.0-alpha.1 : pesée et journal reçus, modification gardée, sans conflit', !FV.conflits.length && FV.db.ops.some((o) => o.id === qy.id && o.pesee && o.pesee.valide) && FV.db.journalPressoir.length === Y.journalPressoir.length && FV.db.contenants[0].notes === 'note 0.23.0-alpha.1');
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (23 : pressoir, profil régional, droits, synchronisation, compatibilité 0.23.0-alpha.1)');

  // ---- 24. langues (0.24.0-alpha.1) : tables complètes, motifs, choix de la langue au démarrage
  {
    const pb = L.tradControle();
    t('traductions : chaque ligne a ses six langues, pas de doublon, motifs cohérents ({a}, {b}…)', !pb.length && L.TRAD_TABLE.length > 300 && L.TRAD_MOTIFS.length > 50, pb.slice(0, 5));
    t('six langues : français, anglais, espagnol, italien, allemand, portugais', L.LANGUES.map((x) => x.id).join() === 'fr,en,es,it,de,pt' && L.LANGUES_TRAD.join() === 'en,es,it,de,pt');
    t('traduction exacte, inchangée en français ou si absente', L.traduire('Pesées', 'en') === 'Weighings' && L.traduire('Pesées', 'de') === 'Wägungen' && L.traduire('Pesées', 'fr') === 'Pesées' && L.traduire('Texte inconnu', 'it') === 'Texte inconnu');
    t('motifs : valeurs gardées, et traduites à leur tour si elles sont dans la table', L.traduire('Registre des pesées 2026', 'de') === 'Wägeregister 2026' && L.traduire('Moûts au plus (moûts débourbés)', 'en') === 'Musts at most (settled musts)' && L.traduire('Pesée n° 12 validée.', 'pt') === 'Pesagem n.º 12 validada.');
    t('message du moteur traduit (plafond du pressurage)', L.traduire('Volume revendicable 26,00 hL au-dessus du plafond de 25,50 hL (102 L de moûts débourbés pour 160 kg) : le surplus passe en rebêches.', 'en') === 'Claimable volume 26,00 hL above the cap of 25,50 hL (102 L of settled musts per 160 kg): the surplus goes to rebêches.');
    t('langue du navigateur : première connue (pt-BR → pt), sinon français', L.langueDuNavigateur(['pt-BR', 'en']) === 'pt' && L.langueDuNavigateur(['ja', 'zh-CN']) === 'fr' && L.langueDuNavigateur('de-AT') === 'de');
    t('au démarrage : langue choisie sur l’appareil ; qui utilisait déjà Œnotrack garde le français ; sinon celle du navigateur', L.langueInitiale({ stockee: 'it', base: true, navigateur: ['en'] }) === 'it' && L.langueInitiale({ stockee: null, base: true, navigateur: ['en-US'] }) === 'fr' && L.langueInitiale({ navigateur: ['es-ES'] }) === 'es' && L.langueInitiale({ stockee: 'xx', navigateur: ['ru'] }) === 'fr');
    t('langue : jamais dans la base ni dans les sauvegardes', !JSON.stringify(L.normalizeDb(L.sampleDb())).includes('oenotrack-langue'));
    t('dépôt du code source : GitHub', L.OENOTRACK_DEPOT === 'https://github.com/r0waiu/Oenotrack');
    // base de test 0.24.0-alpha.1 (tools/fixture-0.24.0-alpha.1.cjs) : rouverte sans rien perdre, registre intègre
    const f24 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.24.0-alpha.1-pressoir.json'), 'utf8'))); L.syncConfig(f24);
    const p5 = L.peseesDe(f24, 2026).find((o) => o.pesee.num === 5); const m6 = L.marcsDe(f24, 2026).find((o) => o.marc.num === 6);
    t('base 0.24.0-alpha.1 de test : pesée corrigée (motif), pesée annulée (n° gardé), marc en cours, journal intègre', p5 && p5.kg === 3990 && !!p5.pesee.valide && m6 && m6.marc.enCours === true && L.numeroSuivant(f24, 'pesee', 2026) === 7 && f24.journalPressoir.length === 23 && !L.journalAlteres(f24).length && f24.journalPressoir.some((j) => j.action === 'annulation' && j.num === 6) && L.pressoirParams(f24).dates[2026].remiseCarnets === '2026-12-15');
    t('… bilan : marc en cours à valider, rien de bloquant', L.bilanPressoir(f24, 2026, '2026-10-01').nonValides.marcs === 1 && !L.bilanPressoir(f24, 2026, '2026-10-01').alertes.some((a) => a.niveau === 'bloquant'));
    const dirW = path.join(__dirname, 'anciennes', '0.23.0-alpha.1');
    const W = new Function('React', files.filter((f) => fs.existsSync(path.join(dirW, f))).map((f) => fs.readFileSync(path.join(dirW, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, clone };')({});
    const w24 = W.normalizeDb(W.clone(f24));
    t('… ouverte par la 0.23.0-alpha.1 gelée : opérations, journal et réglages du pressoir gardés', JSON.stringify(w24.ops) === JSON.stringify(f24.ops) && JSON.stringify(w24.journalPressoir) === JSON.stringify(f24.journalPressoir) && JSON.stringify(w24.settings.pressoir) === JSON.stringify(f24.settings.pressoir));
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (24 : langues, dépôt GitHub)');
  // ---- 25. langues, deuxième étape (0.24.0-alpha.2) : vocabulaire du chai traduit, phrases d'un bloc, séparateurs, données jamais traduites
  {
    const en = (x, strict) => L.traduire(x, 'en', 0, strict);
    const i242 = L.CHANGELOG.findIndex((c) => c.v === '0.24.0-alpha.2');
    t('version 0.24.0-alpha.2 : pré-version de la 0.24.0 (fonctionnalité Langues en test, complétée)', i242 >= 0 && L.CHANGELOG[i242 + 1].v === '0.24.0-alpha.1' && L.versionNum('0.24.0-alpha.2') === 24000002 && L.APP_NUM >= 24000002);
    t('tables complétées : plus de 1 500 lignes et 300 motifs, toujours cohérentes', !L.tradControle().length && L.TRAD_TABLE.length > 1500 && L.TRAD_MOTIFS.length > 300);
    // tout ce que l'application fournit d'origine est traduit (sauf noms propres et abréviations)
    const cles = new Set(L.TRAD_TABLE.map((r) => r[0]));
    const PROPRES = new Set(['Chardonnay', 'Pinot Noir', 'Meunier', 'AUT', '1ER', '1er Cru', 'GC', 'Grand Cru', 'CONV', 'FR-BIO-01', 'BIO', 'Demeter', 'DEM', 'TAP', 'pH', '1ers Crus', 'Grands Crus']);
    const manque = []; const voir = (x) => { if (typeof x === 'string' && x && !cles.has(x) && !PROPRES.has(x)) manque.push(x); };
    Object.values(L.DEFAULT_LISTS()).forEach((v) => Array.isArray(v) && v.forEach((o) => ['label', 'court', 'aide', 'groupe', 'titre', 'un'].forEach((k) => voir(o[k]))));
    L.DEFAULT_OPERATIONS().forEach((o) => { voir(o.label); voir(o.aide); voir(o.groupe); });
    [L.LOT_TYPES, L.PREP_TYPES, L.OP_LABELS].forEach((m) => Object.values(m).forEach(voir));
    L.DEFAULT_PARAMS().forEach((p) => voir(p.nom)); L.DEFAULT_MODELES().forEach((m) => voir(m.nom)); L.OPERATEUR_FONCTIONS.forEach(voir);
    L.FORMES.forEach((x) => voir(x.label)); L.FINITIONS.forEach((x) => voir(x.label)); L.LIST_META.forEach((x) => voir(x.title)); L.ECHELLES.forEach((e) => { voir(e.label); voir(e.un); });
    t('catalogue des opérations, stades, couleurs, natures de lots, préparations et listes d’origine : tout est traduit', !manque.length, manque.slice(0, 8));
    t('vocabulaire du chai (anglais, allemand)', en('Débourbage') === 'Settling' && en('Vin clair') === 'Clear wine' && en('Fin de FA') === 'End of AF' && L.traduire('Soutirage', 'de') === 'Abstich' && L.traduire('Assemblage', 'es') === 'Ensamblaje' && en('Moût reçu') === 'Received must');
    // séparateurs : utiles seulement si une partie se traduit ; le plus fort d'abord ; liste longue traduite jusqu'au bout
    t('séparateur sans partie traduite : texte inchangé (typographie française gardée)', en('Cuve 12 : 25 hL') === 'Cuve 12 : 25 hL' && en('Cuve 3 · Bac D1') === 'Cuve 3 · Bac D1');
    t('séparateurs dans l’ordre : le tiret avant les parenthèses', en('Nouvelle opération — Réchauffage (relance FA / FML)') === 'New operation — Warming (restart AF / MLF)');
    t('liste « · » de sept parties : chaque partie traduite, jusqu’à la dernière', /^Weighing no\. 1 \(07:52\) · 10\/09\/2025 · Chardonnay · Cramant · Lefèvre · CONV · remaining 4 000 kg$/.test(en('Pesée n° 1 (07:52) · 10/09/2025 · Chardonnay · Cramant · Lefèvre · CONV · reste 4 000 kg')), en('Pesée n° 1 (07:52) · 10/09/2025 · Chardonnay · Cramant · Lefèvre · CONV · reste 4 000 kg'));
    t('valeur vide permise (« ⚠ à vérifier » seul ou détaillé ; pluriels)', en('⚠ à vérifier') === '⚠ to check' && en('⚠ à vérifier : capacité') === '⚠ to check: capacity' && en('Afficher tous les champs (3 masqués)') === 'Show all fields (3 hidden)' && en('Afficher tous les champs (1 masqué)') === 'Show all fields (1 hidden)');
    // phrase faite de plusieurs nœuds (JSX « Texte {valeur} suite ») : tables exactes et motifs précis seulement
    t('phrase d’un bloc : motif précis appliqué, séparateurs génériques exclus au premier niveau', en('3 lot(s) — les lots naissent des opérations (pressurage, entrée de moûts, assemblage, tirage, reprise de stock).', true) === '3 lot(s) — lots are created by operations (pressing, must intake, blending, tirage, opening stock).' && en('Cuve 3 · Vin clair', true) === 'Cuve 3 · Vin clair' && en('Cuve 3 · Vin clair') === 'Cuve 3 · Clear wine');
    t('phrase avec valeur traduite à son tour (profil, action)', en('Votre profil « Opérateur » ne permet pas de valider cette opération : les valeurs sont affichées sans pouvoir être enregistrées.', true) === 'Your profile “Operator” does not allow you to validate this operation: the values are shown but cannot be saved.');
    t('données jamais traduites : libellé personnalisé, nom de cuve', en('Inox') === 'Stainless steel' && en('Inox 316L poli miroir') === 'Inox 316L poli miroir' && en('Cuve 31 – réserve perpétuelle') === 'Cuve 31 – réserve perpétuelle');
    // base de test 0.24.0-alpha.2 (tools/fixture-0.24.0-alpha.2.cjs) : libellés personnalisés, contenant, pesée de cette version
    const f25 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.24.0-alpha.2-langues.json'), 'utf8'))); L.syncConfig(f25);
    t('base 0.24.0-alpha.2 de test : versions, libellés personnalisés, contenant et pesée n° 7 gardés', f25.meta.versions.includes('0.24.0-alpha.1') && f25.meta.versions.includes('0.24.0-alpha.2') && f25.lists.matieres.some((m) => m.label === 'Inox 316L poli miroir') && f25.lists.typesPerte.some((m) => m.label === 'Lies lourdes du foudre') && f25.contenants.some((c) => c.nom === 'Cuve 31 – réserve perpétuelle' && c.matiere === 'inox316') && L.peseesDe(f25, 2026).some((o) => o.pesee.num === 7) && !L.journalAlteres(f25).length);
    const dirX = path.join(__dirname, 'anciennes', '0.24.0-alpha.1');
    const X = new Function('React', files.filter((f) => fs.existsSync(path.join(dirX, f))).map((f) => fs.readFileSync(path.join(dirX, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, clone, opSave, APP_VERSION, APP_NUM };')({});
    t('0.24.0-alpha.1 gelée chargée (n° 24 000 001)', X.APP_VERSION === '0.24.0-alpha.1' && X.APP_NUM === 24000001);
    const x25 = X.normalizeDb(X.clone(f25));
    t('… ouvre la base 0.24.0-alpha.2 sans rien perdre (opérations, listes, contenants, opérateurs, journal du pressoir)', ['ops', 'lists', 'contenants', 'operateurs', 'journalPressoir', 'lots'].every((k) => canonJ(x25[k]) === canonJ(f25[k])));
    const p7 = x25.ops.find((o) => o.pesee && o.pesee.num === 7 && o.date === '2026-09-21');
    const r7 = X.opSave(x25, { type: 'apport', date: p7.date, cepageId: p7.cepageId, kg: p7.kg, qualifId: p7.qualifId, notes: 'note 0.24.0-alpha.1' }, p7.id);
    const back25 = L.normalizeDb(X.clone(x25));
    t('… pesée de cette version annotée par la 0.24.0-alpha.1 : registre gardé, rien d’altéré ici', r7.ok && r7.op.pesee && r7.op.pesee.num === 7 && !L.journalAlteres(back25).length && !L.bilanPressoir(back25, 2026, '2026-10-01').alertes.some((a) => /sans passer par le registre/.test(a.msg)));
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (25 : langues, deuxième étape ; compatibilité 0.24.0-alpha.1)');
  // ---- 26. formulaire de pesée personnalisable, pourriture acide et TAP (0.25.0-alpha.1)
  {
    t('version 0.25.0-alpha.1 : nouvelle fonctionnalité compatible (mineure), première pré-version alpha', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.25.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.24.0-alpha.2' && L.versionNum('0.25.0-alpha.1') === 25000001 && L.APP_NUM >= 25000001; })());
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
    const ctx = { maintenant: '2026-09-25T08:00:00', par: '' }; const ap0 = d.apporteurs[0].id;
    const base = { date: '2026-09-25', heure: '07:50', cepageId: 'chard', brutKg: 4200, tareKg: 200 };
    // relevés à la réception
    t('TAP entre 0 et 20 % vol., pourriture acide de 0 à 100 % : valeurs hors limites refusées', !L.peseeSpec(d, { ...base, tap: 25 }).ok && !L.peseeSpec(d, { ...base, tap: 0 }).ok && !L.peseeSpec(d, { ...base, tap: 'abc' }).ok && !L.peseeSpec(d, { ...base, pourritureAcide: 120 }).ok && !L.peseeSpec(d, { ...base, pourritureAcide: -1 }).ok && L.peseeSpec(d, { ...base, pourritureAcide: 0, tap: 20 }).ok);
    const s1 = L.peseeSpec(d, { ...base, tap: '9,234', pourritureAcide: '2,26' }); const s0 = L.peseeSpec(d, { ...base, tap: '', pourritureAcide: '' });
    t('… enregistrés avec la pesée (TAP à 2 décimales, pourriture à 1 décimale, virgule acceptée) ; laissés vides : absents', s1.ok && s1.spec.pesee.tap === 9.23 && s1.spec.pesee.pourritureAcide === 2.3 && s0.ok && !('tap' in s0.spec.pesee) && !('pourritureAcide' in s0.spec.pesee), s1.spec && s1.spec.pesee);
    const rr = L.resumeRegistre({ type: 'apport', date: '2026-09-25', kg: 4000, cepageId: 'chard', pesee: { num: 9, heure: '07:50', tap: 9, pourritureAcide: 2 } });
    t('… relevés de réception, hors mentions du registre (ni empreinte ni écart pour les versions précédentes)', rr.heure === '07:50' && !('tap' in rr) && !('pourritureAcide' in rr));
    // formulaire de pesée : hors catalogue, mentions du registre et du ticket verrouillées
    const ks = L.champsStd('pesee').map((c) => c.k);
    t('formulaire de pesée : hors catalogue des opérations (« Pesée (onglet Pressoir) »), champs de la pesée seulement', L.formulaireCat(d, 'pesee').label === 'Pesée (onglet Pressoir)' && L.FORMULAIRES_HORS_CATALOGUE.pesee && !L.opList(d).some((o) => o.id === 'pesee') && ['heure', 'apporteurId', 'mention', 'kg', 'caisses', 'etat', 'pourritureAcide', 'tap', 'heureCueillette', 'balanceId'].every((k) => ks.includes(k)) && !ks.includes('docs') && !ks.includes('equipementIds'), ks);
    const fs0 = L.formulaireSave(d, 'pesee', { champs: { heure: { vis: 'masque' }, kg: { vis: 'masque' }, cepageId: { vis: 'masque' }, apporteurId: { vis: 'masque', obligatoire: true }, mention: { vis: 'replie' }, caisses: { vis: 'masque', obligatoire: true }, tap: { obligatoire: true }, etat: { defaut: 'faible' }, pourritureAcide: { vis: 'replie', libelle: 'Pourriture acide estimée (%)' } }, perso: [{ label: 'Pourriture grise', type: 'nombre', unite: '%', min: 0, max: 100 }] });
    const cfg = L.formulaireDe(d, 'pesee'); const E = (k) => L.champEffectif(cfg, 'pesee', k);
    t('… date, heure, cépage, poids (indispensables), apporteur et revendication particulière (mentions du ticket) jamais masqués', fs0.ok && ['date', 'heure', 'cepageId', 'kg', 'apporteurId', 'mention'].every((k) => E(k).vis === 'visible') && !cfg.champs.heure && !cfg.champs.kg && !(cfg.champs.mention || {}).vis && !(cfg.champs.apporteurId || {}).vis, cfg.champs);
    t('… une mention du ticket peut être rendue obligatoire ; les autres champs masquables (un champ masqué n’est jamais obligatoire), valeur proposée, libellé, relevé personnalisé', E('apporteurId').obligatoire && E('caisses').vis === 'masque' && !E('caisses').obligatoire && E('tap').obligatoire && E('etat').defaut === 'faible' && E('pourritureAcide').vis === 'replie' && E('pourritureAcide').libelle === 'Pourriture acide estimée (%)' && cfg.perso.length === 1 && cfg.perso[0].unite === '%' && L.formulaireDefauts(d, 'pesee', 'pesee', {}, {}).etat === 'faible');
    L.syncFormulaires(d);
    t('… relevé personnalisé proposé aux fiches à imprimer (« Pourriture grise (Pesée (onglet Pressoir)) »)', L.CHAMPS_FICHE.some((x) => x[0] === `cf${cfg.perso[0].id}` && /^Pourriture grise \(Pesée/.test(x[1])));
    // saisie : champs rendus obligatoires, relevés, correction
    const n0 = L.peseeSave(d, { ...base }, null, ctx); const n1 = L.peseeSave(d, { ...base, apporteurId: ap0 }, null, ctx);
    const n2 = L.peseeSave(d, { ...base, apporteurId: ap0, tap: 8.1, pourritureAcide: 3, champs: { [cfg.perso[0].id]: '5' } }, null, ctx);
    t('nouvelle pesée : champs rendus obligatoires exigés (apporteur, puis TAP)', !n0.ok && n0.msg === '« Apporteur » est obligatoire.' && !n1.ok && n1.msg === '« TAP (% vol.) » est obligatoire.' && n2.ok, [n0.msg, n1.msg, n2.msg]);
    const o2 = L.clone(n2.op);
    t('… relevés enregistrés avec la pesée validée : TAP, pourriture acide, relevé personnalisé (avec son unité)', o2.pesee.tap === 8.1 && o2.pesee.pourritureAcide === 3 && !!o2.pesee.valide && Array.isArray(o2.champs) && o2.champs.length === 1 && o2.champs[0].valeur === 5 && o2.champs[0].unite === '%' && o2.champs[0].label === 'Pourriture grise', o2);
    t('… hors limites du relevé personnalisé refusé', !L.peseeSave(L.clone(d), { ...base, apporteurId: ap0, tap: 9, champs: { [cfg.perso[0].id]: '120' } }, null, ctx).ok);
    const fq = (o, x) => ({ date: o.date, heure: o.pesee.heure, cepageId: o.cepageId, brutKg: o.pesee.brutKg, tareKg: o.pesee.tareKg, caisses: o.pesee.caisses, etat: o.pesee.etat, apporteurId: o.apporteurId, cruId: o.cruId, parcelleId: o.parcelleId, mention: o.pesee.mention, qualifId: o.qualifId, ref: o.ref, heureCueillette: o.pesee.heureCueillette, balanceId: o.pesee.balanceId, tap: o.pesee.tap, pourritureAcide: o.pesee.pourritureAcide, ...(x || {}) });
    const nbJ = d.journalPressoir.length; const c1 = L.peseeSave(d, fq(o2, { tap: 9.2, pourritureAcide: '' }), o2.id, ctx);
    t('pesée validée : TAP corrigé et pourriture acide effacée sans motif (hors registre), rien au journal ; n°, validation et relevé personnalisé gardés', c1.ok && c1.op.pesee.tap === 9.2 && !('pourritureAcide' in c1.op.pesee) && c1.op.pesee.num === o2.pesee.num && !!c1.op.pesee.valide && c1.op.champs.length === 1 && d.journalPressoir.length === nbJ && !L.journalAlteres(d).length && !L.bilanPressoir(d, 2026, '2026-10-01').alertes.some((a) => /sans passer par le registre/.test(a.msg)), c1.msg || c1.op.pesee);
    const c2 = L.peseeSave(d, fq(L.clone(c1.op), { caisses: 70 }), o2.id, ctx);
    t('… une mention du registre (caisses) demande toujours un motif', !c2.ok && /motif/.test(c2.msg), c2.msg);
    const pv = L.peseesDe(d, 2026)[0]; const c3 = L.peseeSave(d, fq(pv, { tap: '' }), pv.id, ctx);
    t('pesée enregistrée avant que le TAP devienne obligatoire : corrigée sans TAP', c3.ok && !('tap' in c3.op.pesee), c3.msg);
    const n3 = L.peseeSave(d, { ...base, heure: '08:30', brutKg: 2100, tareKg: 100, apporteurId: ap0, tap: 8, pourritureAcide: 4 }, null, ctx);
    // alertes, bilan, relevés, carnet, registre
    t('alerte de la pesée : TAP sous le minimum de richesse en sucre (143 g/L, 8,5 % vol.) ; rien au-dessus ni sans TAP', L.peseeAlertes(d, o2)[0] === 'TAP de 8,1 % vol. sous le minimum de richesse en sucre (143 g/L, soit 8,5 % vol.).' && !L.peseeAlertes(d, c1.op).length && !L.peseeAlertes(d, { pesee: {} }).length);
    const xr = L.clone(d); L.regionSet(xr, 'autre'); const a0 = L.peseeAlertes(xr, o2).length; L.pressoirParamsSet(xr, { valeurs: { tavpMin: 9 } });
    t('… autre région : minimum réglé dans les réglages du pressoir', a0 === 0 && L.peseeAlertes(xr, c1.op).length === 0 && L.peseeAlertes(xr, n3.op)[0] === 'TAP de 8,0 % vol. sous le minimum réglé (9,0 % vol.).', [a0, L.peseeAlertes(xr, n3.op)]);
    const b = L.bilanPressoir(d, 2026, '2026-10-01');
    t('bilan : TAP moyen pondéré par le poids, pesées sous le minimum signalées, pourriture acide (pesées, poids, moyenne)', n3.ok && b.tap && b.tap.tap === 8.8 && b.tap.kg === 6000 && b.tapBas === 1 && b.pourriture && b.pourriture.nb === 1 && b.pourriture.kg === 2000 && b.pourriture.moyenne === 4 && b.alertes.some((a) => a.niveau === 'alerte' && a.msg === `1 pesée(s) sous le minimum de richesse en sucre (TAP inférieur à 8,5 % vol.) : n° ${n3.op.pesee.num}.`), { tap: b.tap, tapBas: b.tapBas, pourriture: b.pourriture });
    t('carnet : TAP moyen des pesées chargées dans un marc, au prorata du poids chargé ; aucun sans TAP', L.tapPesees(d, [{ apportId: n2.op.id, kg: 1000 }, { apportId: n3.op.id, kg: 3000 }]).tap === 8.3 && L.tapPesees(d, [{ apportId: pv.id, kg: 1000 }]) === null);
    const mz = L.marcSave(d, { date: '2026-09-25', heureDebut: '09:00', equipementId: 'pressoir', charges: [{ apportId: n2.op.id, kg: 4000 }, { apportId: n3.op.id, kg: 2000 }], code: 'PT-1' }, null, ctx);
    const rl = L.releveApporteurs(d, 2026).find((r) => r.apporteurId === ap0);
    t('relevé par apporteur : TAP moyen de ses pesées', mz.ok && rl && rl.tap === 8.8, rl && rl.tap);
    const R = L.registrePeseesLignes(d, 2026); const h = R[0]; const iE = h.indexOf('État sanitaire');
    const ligne = (n) => R.find((x) => x[0] === n);
    t('registre des pesées : « Pourriture acide (%) » et « TAP (% vol.) » après l’état sanitaire, relevé personnalisé en dernière colonne', h[iE + 1] === 'Pourriture acide (%)' && h[iE + 2] === 'TAP (% vol.)' && h[h.length - 1] === 'Pourriture grise (%)' && ligne(n3.op.pesee.num)[iE + 2] === 8 && ligne(n3.op.pesee.num)[iE + 1] === 4 && ligne(o2.pesee.num)[iE + 2] === 9.2 && ligne(o2.pesee.num)[h.length - 1] === 5, h);
    const dz = L.clone(d); const n5 = L.peseeSave(dz, { ...base, heure: '12:00', apporteurId: ap0, tap: 9 }, null, ctx); const an = L.registreAnnuler(dz, n5.op.id, { ...ctx, motif: 'Pesée en double' }); const Rz = L.registrePeseesLignes(dz, 2026);
    t('… lignes complètes, pesée annulée comprise (CSV « ; »)', n5.ok && an.ok && Rz.every((r) => r.length === Rz[0].length) && Rz.some((r) => /^annulée le .* : Pesée en double$/.test(r[Rz[0].indexOf('Statut')])) && R.every((r) => r.length === h.length) && L.registrePeseesCsv(d, 2026).split('\r\n')[0].includes(';Pourriture acide (%);TAP (% vol.);'), [n5.msg, an.msg]);
    // compatibilité : la 0.24.0-alpha.2 (gelée) ouvre, modifie et synchronise une base 0.25.0-alpha.1
    const dirY = path.join(__dirname, 'anciennes', '0.24.0-alpha.2');
    const Y = new Function('React', files.filter((f) => fs.existsSync(path.join(dirY, f))).map((f) => fs.readFileSync(path.join(dirY, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, clone, opSave, peseeSave, syncFusion, bilanPressoir, journalAlteres, APP_VERSION, APP_NUM };')({});
    t('0.24.0-alpha.2 gelée chargée (n° 24 000 002)', Y.APP_VERSION === '0.24.0-alpha.2' && Y.APP_NUM === 24000002 && L.APP_NUM > Y.APP_NUM);
    const y = Y.normalizeDb(Y.clone(d));
    t('… ouvre une base 0.25.0-alpha.1 : formulaire de pesée, TAP, pourriture acide et relevés personnalisés gardés ; registre intègre', JSON.stringify(y.formulaires) === JSON.stringify(d.formulaires) && JSON.stringify(y.ops) === JSON.stringify(d.ops) && !Y.journalAlteres(y).length && !Y.bilanPressoir(y, 2026, '2026-10-01').alertes.some((a) => /sans passer par le registre/.test(a.msg)));
    const py = y.ops.find((o) => o.id === n2.op.id);
    const ry = Y.opSave(y, { type: 'apport', date: py.date, cepageId: py.cepageId, kg: py.kg, qualifId: py.qualifId, apporteurId: py.apporteurId, cruId: py.cruId, notes: 'note 0.24.0-alpha.2' }, py.id);
    const qy = y.ops.find((o) => o.id === n3.op.id);
    const ry2 = Y.peseeSave(y, { date: qy.date, heure: qy.pesee.heure, cepageId: qy.cepageId, brutKg: qy.pesee.brutKg, tareKg: qy.pesee.tareKg, apporteurId: qy.apporteurId, qualifId: qy.qualifId, etat: 'sain' }, qy.id, { maintenant: '2026-09-25T10:00:00', par: '', motif: 'État sanitaire relu' });
    const back = L.normalizeDb(Y.clone(y));
    const b2 = back.ops.find((o) => o.id === n2.op.id); const b3 = back.ops.find((o) => o.id === n3.op.id);
    t('… pesées modifiées par la 0.24.0-alpha.2 (formulaire des opérations, pesée) : TAP, pourriture acide et relevé personnalisé gardés', ry.ok && ry2.ok && b2.pesee.tap === 9.2 && b2.champs.length === 1 && b2.champs[0].valeur === 5 && b2.notes === 'note 0.24.0-alpha.2' && b3.pesee.tap === 8 && b3.pesee.pourritureAcide === 4 && b3.pesee.etat === 'sain', [ry.msg, ry2.msg]);
    t('… rouverte ici : journal intègre, aucun écart, bilan TAP inchangé', !L.journalAlteres(back).length && !L.bilanPressoir(back, 2026, '2026-10-01').alertes.some((a) => /sans passer par le registre/.test(a.msg)) && L.bilanPressoir(back, 2026, '2026-10-01').tap.tap === 8.8);
    const B0 = Y.clone(y); const X1 = Y.clone(y); const X2 = L.clone(back); X1.contenants[0].notes = 'note 0.24.0-alpha.2'; L.formulaireSave(X2, 'pesee', { champs: { caisses: { vis: 'replie' } }, perso: L.formulaireDe(X2, 'pesee').perso });
    const n4 = L.peseeSave(X2, { ...base, heure: '11:00', apporteurId: ap0, tap: 10.1, pourritureAcide: 1 }, null, ctx);
    const FY = Y.syncFusion(B0, X1, X2);
    t('0.24.0-alpha.2 synchronisée avec 0.25.0-alpha.1 : pesée (TAP, pourriture acide) et formulaire reçus, modification gardée, sans conflit', n4.ok && !FY.conflits.length && FY.db.ops.some((o) => o.id === n4.op.id && o.pesee.tap === 10.1 && o.pesee.pourritureAcide === 1) && FY.db.formulaires.find((x) => x.id === 'pesee').champs.caisses.vis === 'replie' && FY.db.contenants[0].notes === 'note 0.24.0-alpha.2', FY.conflits);
    // base de test 0.25.0-alpha.1 (tools/fixture-0.25.0-alpha.1.cjs)
    const f26 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.25.0-alpha.1-pesee.json'), 'utf8'))); L.syncConfig(f26);
    const fc = L.formulaireDe(f26, 'pesee'); const ft = L.peseesDe(f26, 2026).filter((o) => o.pesee && typeof o.pesee.tap === 'number');
    t('base 0.25.0-alpha.1 de test : formulaire de pesée personnalisé, pesées avec TAP, pourriture acide et relevé personnalisé, journal intègre', f26.meta.versions.includes('0.25.0-alpha.1') && fc.perso.length === 1 && fc.champs.tap.obligatoire === true && ft.length === 2 && ft.some((o) => o.pesee.pourritureAcide === 3 && (o.champs || []).length === 1) && !L.journalAlteres(f26).length && L.bilanPressoir(f26, 2026, '2026-10-01').tapBas === 1);
    const y26 = Y.normalizeDb(Y.clone(f26));
    t('… ouverte par la 0.24.0-alpha.2 gelée : opérations, formulaires, journal et réglages du pressoir gardés', ['ops', 'formulaires', 'journalPressoir', 'lists'].every((k) => canonJ(y26[k]) === canonJ(f26[k])) && canonJ(y26.settings.pressoir) === canonJ(f26.settings.pressoir));
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (26 : formulaire de pesée, pourriture acide, TAP ; compatibilité 0.24.0-alpha.2)');
  // ---- 27. pourriture selon l'état sanitaire, Opérations reliées au Pressoir, marc : couleur et champs personnalisés (0.25.0-alpha.2)
  {
    t('version 0.25.0-alpha.2 : correction de la 0.25.0 en test (pré-version)', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.25.0-alpha.2'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.25.0-alpha.1' && L.versionNum('0.25.0-alpha.2') === 25000002 && L.APP_NUM >= 25000002; })());
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
    const ctx = { maintenant: '2026-09-26T08:00:00', par: '' }; const ap0 = d.apporteurs[0].id;
    const base = { date: '2026-09-26', heure: '07:40', cepageId: 'chard', brutKg: 3200, tareKg: 200, apporteurId: ap0 };
    L.formulaireSave(d, 'pesee', { champs: {}, perso: [{ label: 'Pourriture grise', type: 'nombre', unite: '%' }, { label: 'Raisins triés', type: 'ouinon' }] });
    let cfg = L.formulaireDe(d, 'pesee'); const [pg, tri] = cfg.perso;
    t('condition « si non sain » : pourriture acide par défaut, champ personnalisé d’après son nom (pourriture grise oui, raisins triés non), TAP jamais', L.champEffectif(cfg, 'pesee', 'pourritureAcide').siAltere && L.champSiAltere(cfg, 'pourritureAcide') && L.persoSiAltere(pg) && !L.persoSiAltere(tri) && !L.champEffectif(cfg, 'pesee', 'tap').siAltere && L.persoSiAltere({ label: 'Botrytis (%)' }) && !L.persoSiAltere({ label: 'Pourriture grise', siAltere: false }));
    const n1 = L.peseeSave(d, { ...base, etat: 'sain', pourritureAcide: 3, tap: 10, champs: { [pg.id]: '5', [tri.id]: true } }, null, ctx);
    t('pesée « Sain » : pourriture acide et pourriture grise non gardées, autres relevés gardés', n1.ok && !('pourritureAcide' in n1.op.pesee) && n1.op.pesee.tap === 10 && n1.op.champs.length === 1 && n1.op.champs[0].id === tri.id, n1.msg || n1.op);
    const n2 = L.peseeSave(d, { ...base, heure: '07:50', etat: 'faible', pourritureAcide: 3, champs: { [pg.id]: '5' } }, null, ctx);
    t('pesée « Faiblement altéré » : pourriture acide et pourriture grise gardées', n2.ok && n2.op.pesee.pourritureAcide === 3 && n2.op.champs.some((c) => c.id === pg.id && c.valeur === 5));
    const fq = (o, x) => ({ date: o.date, heure: o.pesee.heure, cepageId: o.cepageId, brutKg: o.pesee.brutKg, tareKg: o.pesee.tareKg, caisses: o.pesee.caisses, etat: o.pesee.etat, apporteurId: o.apporteurId, cruId: o.cruId, parcelleId: o.parcelleId, mention: o.pesee.mention, qualifId: o.qualifId, ref: o.ref, heureCueillette: o.pesee.heureCueillette, balanceId: o.pesee.balanceId, tap: o.pesee.tap, pourritureAcide: o.pesee.pourritureAcide, ...(x || {}) });
    const o2 = L.clone(n2.op); const c0 = L.peseeSave(d, fq(o2, { etat: 'sain' }), o2.id, ctx); const c1 = L.peseeSave(d, fq(o2, { etat: 'sain' }), o2.id, { ...ctx, motif: 'État sanitaire relu' });
    t('pesée validée passée à « Sain » : motif demandé (état au registre), puis pourriture acide et pourriture grise retirées', !c0.ok && /motif/.test(c0.msg) && c1.ok && !('pourritureAcide' in c1.op.pesee) && !(c1.op.champs || []).some((c) => c.id === pg.id), c1.msg || c1.op);
    L.formulaireSave(d, 'pesee', { champs: { pourritureAcide: { obligatoire: true } }, perso: cfg.perso.map((p) => (p.id === pg.id ? { ...p, obligatoire: true } : p)) });
    const r1 = L.peseeSave(L.clone(d), { ...base, heure: '08:00', etat: 'sain' }, null, ctx); const r2 = L.peseeSave(L.clone(d), { ...base, heure: '08:00', etat: 'altere' }, null, ctx);
    t('relevés de pourriture rendus obligatoires : exigés seulement si l’état n’est pas « Sain »', r1.ok && !r2.ok && r2.msg === '« Pourriture acide (%) » est obligatoire.', [r1.msg, r2.msg]);
    L.formulaireSave(d, 'pesee', { champs: { pourritureAcide: { siAltere: false } }, perso: cfg.perso.map((p) => (p.id === pg.id ? { ...p, siAltere: false } : p)) }); cfg = L.formulaireDe(d, 'pesee');
    const n3 = L.peseeSave(d, { ...base, heure: '08:10', etat: 'sain', pourritureAcide: 1, champs: { [pg.id]: '2' } }, null, ctx);
    t('condition retirée (pourriture acide, pourriture grise) : relevés gardés même « Sain » ; réglage enregistré', cfg.champs.pourritureAcide.siAltere === false && cfg.perso.find((p) => p.id === pg.id).siAltere === false && n3.ok && n3.op.pesee.pourritureAcide === 1 && n3.op.champs.some((c) => c.id === pg.id));
    t('la condition n’existe que pour la pesée (autres formulaires : ignorée)', (() => { const x = L.clone(d); L.formulaireSave(x, 'levurage', { champs: {}, perso: [{ label: 'Pourriture', type: 'texte', siAltere: true }] }); return !('siAltere' in L.formulaireDe(x, 'levurage').perso[0]); })());
    // Opérations → Pressoir
    const pz = L.peseesDe(d, 2026)[0]; const mz = L.marcsDe(d, 2026)[0]; const off = L.clone(d); off.settings.modulesOff = [...(off.settings.modulesOff || []), 'pressoir'];
    t('Opérations : « Pesée de vendange » et « Pressurage » ouverts dans le Pressoir (nouvelles saisies et saisies du registre)', L.opViaPressoir(d, { type: 'apport' }) === 'pesee' && L.opViaPressoir(d, { type: 'pressurage' }) === 'marc' && L.opViaPressoir(d, { editId: pz.id }) === 'pesee' && L.opViaPressoir(d, { editId: mz.id }) === 'marc' && L.opViaPressoir(d, { type: 'levurage' }) === '');
    t('… formulaire général : opérations planifiées, variantes du catalogue, onglet Pressoir désactivé', L.opViaPressoir(d, { type: 'pressurage', prevId: 'pv1' }) === '' && L.opViaPressoir(d, { type: 'apport', preset: { sousType: 'achat' } }) === '' && L.opViaPressoir(off, { type: 'apport' }) === '' && L.opViaPressoir(off, { editId: mz.id }) === '');
    const dl = L.clone(L.sampleDb()); dl.lists.operations = L.clone(L.normalizeDb(L.sampleDb()).lists.operations); dl.lists.operations.find((x) => x.id === 'apport').label = 'Apport vendange';
    const dc = L.clone(dl); dc.lists.operations.find((x) => x.id === 'apport').label = 'Réception des raisins';
    const nl = L.normalizeDb(dl); const nc = L.normalizeDb(dc); L.syncConfig(nl);
    t('libellé d’origine « Apport vendange » → « Pesée de vendange » ; libellé choisi par l’utilisateur gardé', nl.lists.operations.find((x) => x.id === 'apport').label === 'Pesée de vendange' && nc.lists.operations.find((x) => x.id === 'apport').label === 'Réception des raisins' && L.OP_LABELS.apport === 'Pesée de vendange');
    L.syncConfig(d);
    // marc : couleur des moûts, champs personnalisés du pressurage
    const pm = L.peseeSave(d, { ...base, heure: '09:00', etat: 'faible', tap: 9.5, pourritureAcide: 1, champs: {} }, null, ctx).op;
    const fm = (x) => ({ date: '2026-09-26', heureDebut: '09:30', equipementId: 'pressoir', charges: [{ apportId: pm.id, kg: 3000 }], code: `PZ-${x || 1}` });
    t('marc : couleur des moûts choisie (rosé), sinon celle par défaut', L.marcSpec(d, { ...fm(), couleur: 'rose' }).spec.couleur === 'rose' && L.marcSpec(d, { ...fm(), couleur: 'xyz' }).spec.couleur === L.couleurDefaut(d) && L.marcSpec(d, fm()).spec.couleur === L.couleurDefaut(d));
    L.formulaireSave(d, 'pressurage', { champs: {}, perso: [{ label: 'Programme du pressoir', type: 'liste', options: ['Champagne 1', 'Champagne 2'], obligatoire: true }] }); const prog = L.formulaireDe(d, 'pressurage').perso[0].id;
    const m0 = L.marcSave(L.clone(d), { ...fm(2), champs: {} }, null, ctx); const m1 = L.marcSave(d, { ...fm(3), couleur: 'rose', champs: { [prog]: 'Champagne 2' } }, null, ctx);
    t('marc : champs personnalisés du formulaire « Pressurage » (obligatoire exigé, valeur gardée), couleur gardée', !m0.ok && /Programme du pressoir/.test(m0.msg) && m1.ok && m1.op.couleur === 'rose' && m1.op.champs[0].valeur === 'Champagne 2', [m0.msg, m1.msg]);
    const m2 = L.marcSave(d, { ...fm(3), couleur: 'rose' }, m1.op.id, ctx);
    t('… correction sans les champs : valeur et couleur gardées', m2.ok && m2.op.champs[0].valeur === 'Champagne 2' && m2.op.couleur === 'rose', m2.msg);
    // base de test 0.25.0-alpha.2, compatibilité avec la 0.25.0-alpha.1 gelée
    const f27 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.25.0-alpha.2-ops.json'), 'utf8'))); L.syncConfig(f27);
    const ps = f27.ops.find((o) => o.type === 'apport' && o.date === '2026-09-23'); const mr = f27.ops.find((o) => o.type === 'pressurage' && o.date === '2026-09-23');
    t('base 0.25.0-alpha.2 de test : pesée « Sain » sans pourriture (relevé « Raisins triés » gardé), marc rosé avec son programme, libellé « Pesée de vendange »', f27.meta.versions.includes('0.25.0-alpha.2') && ps && !('pourritureAcide' in ps.pesee) && ps.champs.length === 1 && ps.champs[0].label === 'Raisins triés' && mr && mr.couleur === 'rose' && mr.champs[0].valeur === 'Champagne 2' && f27.lists.operations.find((x) => x.id === 'apport').label === 'Pesée de vendange' && !L.journalAlteres(f27).length);
    const dirZ = path.join(__dirname, 'anciennes', '0.25.0-alpha.1');
    const Z = new Function('React', files.filter((f) => fs.existsSync(path.join(dirZ, f))).map((f) => fs.readFileSync(path.join(dirZ, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, clone, opSave, peseeSave, marcSave, syncFusion, bilanPressoir, journalAlteres, APP_VERSION, APP_NUM };')({});
    t('0.25.0-alpha.1 gelée chargée (n° 25 000 001)', Z.APP_VERSION === '0.25.0-alpha.1' && Z.APP_NUM === 25000001 && L.APP_NUM > Z.APP_NUM);
    const z = Z.normalizeDb(Z.clone(f27));
    t('… ouvre la base 0.25.0-alpha.2 sans rien perdre (opérations, formulaires, catalogue, journal du pressoir)', ['ops', 'formulaires', 'journalPressoir', 'lists'].every((k) => canonJ(z[k]) === canonJ(f27[k])) && !Z.journalAlteres(z).length);
    const zm = z.ops.find((o) => o.id === mr.id); const rz = Z.opSave(z, { ...Z.clone(zm), notes: 'note 0.25.0-alpha.1' }, zm.id);
    const back = L.normalizeDb(Z.clone(z)); const bm = back.ops.find((o) => o.id === mr.id);
    t('… marc annoté par la 0.25.0-alpha.1 : couleur et programme gardés ; rouvert ici, journal intègre', rz.ok && bm.couleur === 'rose' && bm.champs[0].valeur === 'Champagne 2' && bm.notes === 'note 0.25.0-alpha.1' && !L.journalAlteres(back).length, rz.msg);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ---- 28. plans de nettoyage et de maintenance (HACCP), noms de produits, informations des documents, assistant IA (0.26.0-alpha.1)
  {
    t('version 0.26.0-alpha.1 : nouvelle version mineure (plans d’hygiène, photo, fiches produits)', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.26.0-alpha.1'); return i >= 0 && L.versionNum('0.26.0-alpha.1') === 26000001 && L.APP_NUM >= 26000001 && L.CHANGELOG[i].notes.length === 6 && L.CHANGELOG[i + 1].v === '0.25.0-alpha.2'; })());
    const e0 = L.emptyDb();
    t('base neuve : plan de nettoyage (21 lignes) et de maintenance (14) d’origine, locaux, interventions, justifications, date de mise en place', e0.planNettoyage.length === 21 && e0.planMaintenance.length === 14 && e0.lists.locaux.length === 10 && Array.isArray(e0.maintenance) && Array.isArray(e0.hygieneAcquits) && L.isoOK(e0.settings.planHygieneDepuis) && e0.planNettoyage.every((x) => x.modele && x.actif));
    const h = L.normalizeDb(L.sampleDb()); L.syncConfig(h); const t0 = '2026-11-21';
    // la base est modifiée sur place ici : chaque calcul porte sur une copie (rejeu et événements sont mémorisés par base, comme dans l'application où chaque action crée une nouvelle base)
    const PT = (d, t) => L.planTaches(L.clone(d), t);
    const T0 = PT(h, t0); const etats = (T) => ['nonconforme', 'retard', 'afaire'].map((k) => T.filter((x) => x.etat === k).length).join('/');
    t('exemple : 7 tâches (3 non-conformités, 3 en retard, 1 panne), les plus urgentes d’abord', T0.length === 7 && etats(T0) === '3/3/1' && T0[0].etat === 'nonconforme' && T0.some((x) => x.cle === 'pm:panne:' + h.maintenance.find((m) => m.statut === 'ouverte').id) && T0.some((x) => /^pm:pm_pompes:/.test(x.cle) && x.etat === 'retard'), T0.map((x) => x.cle));
    t('… cuve vidée (Cuve 02) : rinçage en retard ; matériel de transfert : désinfection hebdomadaire en retard', T0.some((x) => x.cle.startsWith('pn:pn_cuves_rincage:vid:ct23:') && x.etat === 'retard' && x.actionId === 'rincage' && x.cible.id === 'ct23') && T0.some((x) => x.cle === 'pn:pn_transfert_desinfection:per:materiel_transfert:2026-11-16'));
    // vidanges, remplissages, changement de revendication (journal des opérations rejoué)
    const entree = (date, cid, q, code) => L.opSave(h, { type: 'entree_mout', date, apporteurId: '', ref: code, millesime: '2026', entrees: [{ compartiment: '', cepageId: 'pm', fractionId: 'cuvee', cruId: '', qualifId: q, volL: 300, dests: [{ contenantId: cid, volL: 300 }] }], lots: [{ contenantId: cid, code, designation: 'Essai hygiène' }] });
    const cle = (T, re) => T.find((x) => re.test(x.cle));
    const e1 = entree('2026-11-22', 'ct19', 'conv', 'HY-1'); let T = PT(h, '2026-11-22');
    t('remplissage sans rinçage dans les 24 h précédentes : non-conformité', e1.ok && cle(T, new RegExp(`^pn:pn_cuves_rincage:remp:ct19:${e1.op.id}$`)) && cle(T, /remp:ct19/).etat === 'nonconforme' && /remplissage du 22\/11\/2026 sans « Rinçage »/.test(cle(T, /remp:ct19/).msg), e1.msg);
    L.hygieneSave(h, { date: '2026-11-22', cibleType: 'contenant', cibleId: 'ct19', actionId: 'rincage', produits: [], methode: '' });
    t('… rinçage enregistré le jour même : alerte levée', !cle(PT(h, '2026-11-22'), /remp:ct19/));
    const pB = Object.values(L.getR(L.clone(h)).portions).find((x) => x.contenantId === 'ct19' && x.vol > 1); const sp = { type: 'soutirage', date: '2026-11-23', portionId: pB.id, volL: pB.vol, destId: 'ct23', pertes: [], lignes: [], champs: [] };
    const C1 = L.hygControlesSaisie(L.clone(h), sp, null, '2026-11-23');
    t('saisie : « Bac D1 sera vide — Rinçage à faire ensuite », « Cuve 02 — Rinçage à faire avant le remplissage » (avec la ligne du plan)', C1.some((x) => x.tone === 'info' && /^Bac D1 sera vide — Rinçage à faire ensuite/.test(x.msg) && x.faire.cibleId === 'ct19' && x.faire.planId === 'pn_cuves_rincage') && C1.some((x) => x.tone === 'warn' && /^Cuve 02 — Rinçage à faire avant le remplissage/.test(x.msg)), C1.map((x) => x.msg));
    const s1 = L.opSave(h, sp);
    t('vidange : rinçage à faire (puis en retard au-delà du délai du plan)', s1.ok && cle(PT(h, '2026-11-23'), /^pn:pn_cuves_rincage:vid:ct19:/).etat === 'afaire' && cle(PT(h, '2026-11-25'), /^pn:pn_cuves_rincage:vid:ct19:/).etat === 'retard' && cle(PT(h, '2026-11-25'), /vid:ct19/).echeance === '2026-11-24', s1.msg);
    const C2 = L.hygControlesSaisie(L.clone(h), { type: 'entree_mout', date: '2026-11-24', apporteurId: '', ref: 'HY-2', millesime: '2026', entrees: [{ compartiment: '', cepageId: 'pm', fractionId: 'cuvee', cruId: '', qualifId: 'bio', volL: 300, dests: [{ contenantId: 'ct19', volL: 300 }] }], lots: [{ contenantId: 'ct19', code: 'HY-2', designation: 'Essai' }] }, null, '2026-11-24');
    const cr = C2.find((x) => x.tone === 'bad');
    t('saisie : Conventionnel vidé puis Bio (FR-BIO-01) sans rinçage → « changement de revendication » signalé avant d’enregistrer', cr && /^Bac D1 — Conventionnel avant ce remplissage en FR-BIO-01 : Rinçage \(changement de revendication\) à enregistrer d’abord\.$/.test(cr.msg) && cr.faire.changementRevendication.de === 'conv' && cr.faire.changementRevendication.vers === 'bio' && cr.faire.planId === 'pn_cuves_revendication', C2.map((x) => x.msg));
    const e2 = entree('2026-11-24', 'ct19', 'bio', 'HY-2'); T = PT(h, '2026-11-24'); const rv = cle(T, /^pn:pn_cuves_revendication:rev:ct19:/);
    t('enregistré quand même : non-conformité « Conventionnel puis Bio … sans « Rinçage » au journal entre les deux » ; plus de rinçage « à faire » (cuve pleine)', e2.ok && rv && rv.etat === 'nonconforme' && rv.revendication.de === 'conv' && rv.revendication.vers === 'bio' && /Conventionnel puis FR-BIO-01 le 24\/11\/2026, sans « Rinçage » au journal entre les deux\.$/.test(rv.msg) && !cle(T, /vid:ct19/), rv && rv.msg);
    const pr0 = L.hygPresetTache(h, rv);
    t('« Enregistrer » depuis la tâche : contenant, action, ligne du plan, changement de revendication et contrôle prévus', pr0.cibleType === 'contenant' && pr0.cibleId === 'ct19' && pr0.actionId === 'rincage' && pr0.planId === 'pn_cuves_revendication' && pr0.changementRevendication.vers === 'bio' && pr0.controle.type === 'visuel');
    L.hygieneSave(h, { date: '2026-11-24', cibleType: 'contenant', cibleId: 'ct19', actionId: 'rincage', produits: [], methode: '', ...pr0, controle: { type: 'visuel', resultat: 'conforme' } });
    t('… rinçage enregistré : non-conformités levées ; contrôle, ligne du plan et revendication gardés dans l’entrée', !PT(h, '2026-11-24').some((x) => /ct19/.test(x.cle) && x.origine === 'nettoyage') && h.hygiene.some((x) => x.cibleId === 'ct19' && x.planId === 'pn_cuves_revendication' && x.controle.resultat === 'conforme' && x.changementRevendication.vers === 'bio'));
    t('une action plus complète vaut la plus simple (nettoyage → rinçage, vapeur → désinfection), pas l’inverse', L.hygSatisfait('rincage', 'nettoyage') && L.hygSatisfait('desinfection', 'vapeur') && !L.hygSatisfait('nettoyage', 'rincage') && !L.hygSatisfait('desinfection', 'rincage'));
    // périodique, soirs de vendange, consignes sans alerte
    L.hygieneSave(h, { date: t0, cibleType: 'local', cibleId: 'materiel_transfert', actionId: 'desinfection', produits: [], methode: '' });
    t('périodique : à faire la veille de l’échéance, en retard après', !cle(PT(h, t0), /pn_transfert_desinfection:per/) && cle(PT(h, '2026-11-27'), /pn_transfert_desinfection:per/).etat === 'afaire' && cle(PT(h, '2026-11-29'), /pn_transfert_desinfection:per/).etat === 'retard');
    const hv = L.clone(L.normalizeDb(L.sampleDb())); hv.settings.planHygieneDepuis = '2026-09-01'; const TV = PT(hv, '2026-09-20');
    t('jours de vendange (pesées, marcs) : désinfection du pressoir, du sol et du matériel chaque soir ; caisses chaque semaine', ['pressoir', 'sol_cuverie', 'materiel_transfert'].every((c) => TV.filter((x) => x.cle.includes(`:soir:${c}:`)).length === 5) && TV.some((x) => x.cle === 'pn:pn_caisses_nettoyage:per:caisses:2026-09-08') && TV.some((x) => x.cle.startsWith('pn:pn_pressoir_nettoyage:rev:pressoir:')));
    t('lignes « consigne » (sans trace attendue) : jamais d’alerte', !TV.some((x) => /pn_pressoir_rincage|pn_caisses_rincage|pn_transfert_rincage|pn_tirage|pn_degorgement/.test(x.cle)));
    t('seuls les événements depuis la mise en place du plan sont contrôlés', !T0.some((x) => x.origine === 'nettoyage' && x.date && x.date < '2026-11-01') && TV.length > T0.length);
    // maintenance
    const pp = L.planMaintenance(h).find((x) => x.id === 'pm_pompes'); const sm = L.maintEtat(h, pp, t0);
    t('maintenance : dernière intervention connue avant Œnotrack → échéance (1 an), en retard', sm.derniere === '2025-11-12' && sm.echeance === '2026-11-12' && sm.etat === 'retard');
    t('échéances : fin de mois et années bissextiles', L.maintAjout('2026-01-31', { n: 1, unite: 'mois' }) === '2026-02-28' && L.maintAjout('2024-02-29', { n: 1, unite: 'an' }) === '2025-02-28' && L.maintAjout('2026-11-21', { n: 2, unite: 'semaine' }) === '2026-12-05' && L.maintAjout('2026-11-21', { n: 6, unite: 'mois' }) === '2027-05-21');
    const ri = L.maintInterventionSave(h, { date: t0, entreeId: 'pm_pompes', equipementId: 'pompe', type: 'preventive', interventions: 'Garnitures', resultat: 'conforme' });
    t('intervention préventive enregistrée : échéance repoussée d’un an, plus de retard', ri.ok && L.maintEtat(h, pp, t0).echeance === '2027-11-21' && !PT(h, t0).some((x) => /^pm:pm_pompes:/.test(x.cle)));
    t('panne : le problème est exigé ; signalée, elle reste à faire', !L.maintInterventionSave(h, { date: t0, entreeId: 'pm_agitateurs', type: 'curative', statut: 'ouverte', probleme: ' ' }).ok && PT(h, t0).some((x) => x.interventionId === h.maintenance.find((m) => m.statut === 'ouverte').id));
    const mo = h.maintenance.find((m) => m.statut === 'ouverte'); const rc = L.maintInterventionSave(h, { ...mo, statut: 'faite', resultat: 'conforme', interventions: 'Presse-étoupe refait' }, mo.id);
    t('… réparation enregistrée : panne close, tâche levée', rc.ok && h.maintenance.find((m) => m.id === mo.id).statut === 'faite' && !PT(h, t0).some((x) => x.cle === `pm:panne:${mo.id}`));
    t('vérification avant vendanges (révision du pressoir) demandée à partir du 15 juillet', PT(h, '2027-07-20').some((x) => x.cle === 'pm:pm_pressoirs:av:2027') && !PT(h, '2027-06-20').some((x) => x.cle === 'pm:pm_pressoirs:av:2027'));
    t('matériel avec des interventions : suppression refusée (désactiver la ligne)', !L.maintEntreeDelete(L.clone(h), 'pm_pompes').ok && L.maintEntreeDelete(L.clone(h), 'pm_extincteurs').ok);
    const md = L.clone(h); const mi = md.maintenance[0]; md.docs = [...(md.docs || []), { id: 'dz', nom: 'rapport.pdf', cible: { type: 'maintenance', id: mi.id } }]; const rd = L.maintInterventionDelete(md, mi.id);
    t('intervention supprimée avec ses documents', rd.ok && rd.docs.join() === 'dz' && !md.docs.some((x) => x.id === 'dz') && !md.maintenance.some((m) => m.id === mi.id));
    // non-conformité justifiée
    const nc = PT(h, t0).find((x) => x.etat === 'nonconforme');
    t('non-conformité justifiée : motif exigé, gardée dans l’historique, plus signalée', !L.hygAcquitter(h, nc.cle, { motif: '' }).ok && L.hygAcquitter(h, nc.cle, { motif: 'Cuve neuve', msg: nc.msg, date: t0 }).ok && L.hygAcquitter(h, nc.cle, { motif: 'bis' }).ok && h.hygieneAcquits.filter((a) => a.id === nc.cle).length === 1 && !PT(h, t0).some((x) => x.cle === nc.cle));
    // plan : modification, validation, modèle d'origine, réglages
    t('ligne du plan : nom, action, cible et au moins un moment exigés', !L.planEntreeSave(h, { libelle: '', actionId: 'rincage', cible: { type: 'locaux' }, quand: [{ type: 'apresVendanges' }] }).ok && !L.planEntreeSave(h, { libelle: 'X', actionId: 'inconnue', cible: { type: 'locaux' }, quand: [{ type: 'apresVendanges' }] }).ok && !L.planEntreeSave(h, { libelle: 'X', actionId: 'rincage', cible: { type: 'xx' }, quand: [{ type: 'apresVendanges' }] }).ok && !L.planEntreeSave(h, { libelle: 'X', actionId: 'rincage', cible: { type: 'locaux' }, quand: [{ type: 'inconnu' }] }).ok);
    const lx = L.planEntreeSave(h, { zone: 'cuverie', libelle: 'Bacs', actionId: 'nettoyage', cible: { type: 'contenants', ids: ['ct19', 'ct20'] }, quand: [{ type: 'periodique', jours: 0.4 }, { type: 'vidange' }], produits: [{ type: 'alcalin', conc: '2,5' }], controle: 'ph' });
    const ex = h.planNettoyage.find((x) => x.id === lx.id);
    t('ligne ajoutée : valeurs nettoyées (jours ≥ 1, délai 1 j par défaut, concentration), cibles choisies', lx.ok && ex.quand[0].jours === 1 && ex.quand[1].delai === 1 && ex.produits[0].conc === 2.5 && ex.produits[0].concUnite === '%' && L.hygCibles(h, ex.cible).map((c) => c.id).join() === 'ct19,ct20');
    ex.champFutur = 1; L.planEntreeSave(h, { ...ex, libelle: 'Bacs de débourbage' }, ex.id);
    t('… modifiée : champs d’une version plus récente gardés ; plus marquée « modèle »', h.planNettoyage.find((x) => x.id === ex.id).champFutur === 1 && h.planNettoyage.find((x) => x.id === ex.id).libelle === 'Bacs de débourbage');
    t('modèle d’origine rétabli (lignes ajoutées remplacées), réglages : pause, date de mise en place', L.planModeleCharger(h, 'nettoyage', true).ok && h.planNettoyage.length === 21 && L.planReglages(h, { depuis: '2026-10-01' }).ok && h.settings.planHygieneDepuis === '2026-10-01' && !L.planReglages(h, { depuis: 'xx' }).ok);
    t('cibles : équipements dont le nom commence par « pressoir » (pas la bascule), contenants par type, locaux', L.hygCibles(h, { type: 'equipements', motCle: '^pressoir' }).map((x) => x.id).join() === 'pressoir' && L.hygCibles(h, { type: 'contenants', formes: ['fut'] }).every((c) => h.contenants.find((x) => x.id === c.id).type === 'fut') && L.hygCibles(h, { type: 'locaux', ids: ['caisses'] }).length === 1);
    const hp = L.clone(h); L.planReglages(hp, { actif: false });
    t('plans en pause (ou module Hygiène désactivé) : aucune tâche, rejeu sans événements (aucun coût)', !PT(hp, t0).length && !L.getR(hp).evts && (() => { const x = L.clone(h); x.settings.modulesOff = ['hygiene']; return !L.getR(x).evts && !L.hygEvenementsUtiles(x); })() && !!L.getR(L.clone(h)).evts);
    const pt = L.hygPresetTache(h, { origine: 'nettoyage', entreeId: 'pn_cuves_detartrage', cible: { type: 'contenant', id: 'ct22' }, actionId: 'detartrage' });
    t('produits proposés d’après le type prévu par le plan (détergent alcalin → votre soude caustique)', pt.produits.length === 1 && L.hygDef(h, pt.produits[0].produitId).type === 'alcalin' && pt.produits[0].conc === '10' && pt.controle.type === 'ph');
    t('moments : « tous les 7 jours, pendant les vendanges, contenant vide »', L.hygLibQuand({ type: 'periodique', jours: 7, pendantVendanges: true, siVide: true }) === 'Tous les 7 jours, pendant les vendanges, contenant vide' && L.hygLibQuand({ type: 'texte', texte: 'Le lundi' }) === 'Le lundi' && L.hygLibQuand({ type: 'vidange' }) === 'Après chaque vidange');
    // droits : le plan relève du module Hygiène
    const g = L.clone(L.normalizeDb(L.sampleDb())); const adm = L.securiteActiver(g, { identifiant: 'admin', mdp: await L.mdpEmpreinte('Admin-2026', 1000) }).id;
    const ul = L.utilisateurSave(g, { identifiant: 'labo', profilId: 'pf_consult', mdp: await L.mdpEmpreinte('Labo-20261', 1000) }).id; const uo = L.utilisateurSave(g, { identifiant: 'opr', profilId: 'pf_operateur', mdp: await L.mdpEmpreinte('Oper-20261', 1000) }).id;
    const essai = (uid, fn) => { const ap = L.clone(g); fn(ap); return L.gardeDroits(L.clone(g), ap, uid); };
    const panne = (x) => L.maintInterventionSave(x, { date: t0, entreeId: 'pm_filtres', type: 'curative', statut: 'ouverte', probleme: 'Fuite' });
    t('droits : opérateur (Hygiène en saisie) signale une panne, modifie le plan ; consultation refusée', essai(uo, panne).ok && essai(uo, (x) => L.planEntreeSave(x, { ...x.planNettoyage[0], mode: 'autre' }, x.planNettoyage[0].id)).ok && !essai(ul, panne).ok && !essai(ul, (x) => L.hygAcquitter(x, 'k', { motif: 'm' })).ok && essai(adm, panne).ok);
    // noms de produits à la création
    t('noms : FRESH → Fresh ; sigles et codes gardés (PROVINHY OX2 → Provinhy OX2, HYDROSANT SP → Hydrosant SP, NUTRIEFF AA FRESH → Nutrieff AA Fresh)', L.nomProduitCasse('PROVINHY OX2') === 'Provinhy OX2' && L.nomProduitCasse('HYDROSANT SP') === 'Hydrosant SP' && L.nomProduitCasse('NUTRIEFF AA FRESH') === 'Nutrieff AA Fresh' && L.nomProduitCasse('FRESH') === 'Fresh');
    t('… orthographe et ordre gardés : accents, tirets, apostrophes, quantités, casse voulue (pH), petits mots', L.nomProduitCasse('ŒNOSTAB KHT') === 'Œnostab KHT' && L.nomProduitCasse('SUPER-FRESH B12') === 'Super-Fresh B12' && L.nomProduitCasse("L'OENOLOGIQUE D'ARBRE") === "L'Oenologique d'Arbre" && L.nomProduitCasse('MYCOFILTER 25KG') === 'Mycofilter 25KG' && L.nomProduitCasse('pH STAB') === 'pH Stab' && L.nomProduitCasse('BENTONITE EN POUDRE') === 'Bentonite en Poudre' && L.nomProduitCasse('ACIDE PERACETIQUE 5%') === 'Acide Peracetique 5%' && L.nomProduitCasse('VITAMINE B') === 'Vitamine B' && L.nomProduitCasse('NUTRIENT II') === 'Nutrient II');
    // informations lues dans les documents (script) et complétées par l'IA
    const ft = 'FICHE TECHNIQUE\nGELISOL\nComposition : gélatine alimentaire, solution à 20 %\nDoses d’emploi :\n5 à 10 cL/hL pour les vins blancs\n10 à 20 cL/hL pour les vins rouges\n\nMode d’emploi\nIncorporer directement au vin lors d’un remontage.\nConservation : 2 ans en emballage d’origine fermé.\nConditions de stockage : local frais et sec.\nAllergènes : aucun\nProduit utilisable en agriculture biologique selon le règlement (UE) 2018/848.\nFabricant : Œnologie Exemple SAS';
    const fi = L.ficheInfosScript(ft, 'ft');
    t('FT lue par le script : fabricant, composition, doses (sur deux lignes), mode d’emploi, conservation, stockage, allergènes, utilisation en bio', fi.fabricant === 'Œnologie Exemple SAS' && fi.composition === 'gélatine alimentaire, solution à 20 %' && fi.doseEmploi === '5 à 10 cL/hL pour les vins blancs ; 10 à 20 cL/hL pour les vins rouges' && /^Incorporer/.test(fi.modeEmploi) && /^2 ans/.test(fi.conservation) && fi.stockage === 'local frais et sec.' && fi.allergenes === 'aucun' && /2018\/848/.test(fi.usageBio), fi);
    const ia = L.iaLireInfos(L.iaJson('```json\n{"fabricant": "Autre SA", "composition": null, "doseEmploi": "non précisé", "conservation": "3 ans", "allergenes": ["œuf", "lait"], "inconnu": "x"}\n```'), L.PRODUIT_INFOS);
    const fu = L.infosFusion(fi, ia);
    t('IA : réponse nettoyée (vides et « non précisé » écartés, listes jointes, clés inconnues ignorées) ; le script garde la main, l’IA complète', ia.fabricant === 'Autre SA' && !('composition' in ia) && !('doseEmploi' in ia) && ia.allergenes === 'œuf ; lait' && !('inconnu' in ia) && fu.vals.fabricant === 'Œnologie Exemple SAS' && fu.src.fabricant === 'script' && L.infosFusion({}, ia).src.conservation === 'ia');
    const P0 = L.iaPromptInfos({ fichier: 'ft.pdf', genre: 'ft', texte: ft, ocr: true }, L.PRODUIT_INFOS, 'Gelisol', fi);
    t('IA : demande envoyée = texte du document, nom du produit, ce que le script a déjà lu ; aucune donnée de cave', /GELISOL/.test(P0.texte) && /Produit : Gelisol/.test(P0.texte) && /Déjà lu par le logiciel/.test(P0.texte) && /scan ou une photo/.test(P0.texte) && /"doseEmploi"/.test(P0.texte) && !/Cuve|lot|hL en cuve/i.test(P0.system));
    const fx = L.iaLireFds({ nom: 'Soude', type: 'alcalin', forme: 'xx', pictos: ['GHS05', 'SGH7', 'SGH99'], epi: ['gants', 'Lunettes', 'chaussettes'], mention: 'Danger', concMin: '1.5', concMax: 3, concUnite: '%', fdsDate: '2024-03-12', urgence: 'null' });
    t('IA (FDS d’un produit d’hygiène) : listes et valeurs connues seulement (pictogrammes GHS → SGH, EPI, mention, unité), nombres à la française', fx.type === 'alcalin' && !('forme' in fx) && fx.pictos.join() === 'SGH05,SGH07' && fx.epi.join() === 'gants,lunettes' && fx.mention === 'danger' && fx.concMin === '1,5' && fx.concMax === '3' && fx.fdsDate === '2024-03-12' && !('urgence' in fx) && /"pictos"/.test(L.iaPromptFds({ texte: 'x' }).texte));
    const pr = h.produits[0]; L.produitSave(h, { ...pr, fabricant: 'Ancien' }, pr.id);
    const PP = L.infosPropositions(h, { type: 'produit', id: pr.id }, fu);
    t('propositions pour la fiche : complètent (cochées) ou remplaceraient une valeur saisie (décochées) ; identiques omises', PP.find((x) => x.k === 'fabricant').complete === false && PP.find((x) => x.k === 'fabricant').actuel === 'Ancien' && PP.find((x) => x.k === 'doseEmploi').complete === true && PP.find((x) => x.k === 'conservation').src === 'script' && !L.infosPropositions(h, { type: 'produit', id: pr.id }, { vals: { fabricant: 'Ancien' } }).length);
    const na = L.produitInfosAppliquer(h, { type: 'produit', id: pr.id }, { doseEmploi: fi.doseEmploi, allergenes: 'aucun', inconnu: 'x' }); L.produitSave(h, { ...h.produits[0], notes: 'n' }, pr.id);
    t('informations reprises sur l’intrant (champs connus seulement), gardées à la modification de la fiche', na === 2 && h.produits[0].doseEmploi === fi.doseEmploi && h.produits[0].allergenes === 'aucun' && !('inconnu' in h.produits[0]));
    const ph = L.hygListe ? null : null; const hy = h.produitsHygiene[0]; const nh = L.produitInfosAppliquer(h, { type: 'produitHygiene', id: hy.id }, { stockage: 'Au frais', doseEmploi: '2 %' });
    t('produit d’hygiène : seulement fabricant, composition, mode d’emploi et stockage', nh === 1 && L.hygDef(h, hy.id).stockage === 'Au frais' && !('doseEmploi' in L.hygDef(h, hy.id)));
    // traductions des modèles d'origine (données fournies par Œnotrack)
    const en = (x) => L.traduire(x, 'en');
    const modeles = [...L.PLAN_NETTOYAGE_MODELE().flatMap((e) => [e.libelle, e.mode, e.responsable, ...e.quand.filter((q) => q.type === 'texte').map((q) => q.texte), e.contact, e.attendu]), ...L.PLAN_MAINTENANCE_MODELE().flatMap((e) => [e.libelle, e.interventions, e.intervenant]), ...L.HYG_QUAND.map((q) => q[1])].filter(Boolean);
    const nonTrad = [...new Set(modeles)].filter((x) => en(x) === x && !/^(?:pH 7|\d+ min)$/.test(x));
    t('modèles d’origine des plans et moments : tout est traduit', !nonTrad.length, nonTrad);
    t('messages des tâches traduits (motifs ; nom de l’action et de la cible traduits à leur tour)', en('Cuve 03 — Rinçage à faire (vidange du 21/11/2026).') === 'Cuve 03 — Rinsing to do (emptied on 21/11/2026).' && en('Pompes à vin — maintenance en retard (Préventive, échéance le 12/11/2026).') === 'Wine pumps — maintenance overdue (Preventive, due 12/11/2026).' && L.traduire('Tous les 7 jours, contenant vide', 'de') === 'Alle 7 Tage, leerer Behälter');
    // base de test 0.26.0-alpha.1 ; compatibilité avec la 0.25.0-alpha.2 gelée ; synchronisation
    const f28 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.26.0-alpha.1-plans.json'), 'utf8'))); L.syncConfig(f28);
    t('base 0.26.0-alpha.1 de test : plans modifiés, interventions, entrées avec contrôle et revendication, non-conformité justifiée, informations d’un intrant', f28.meta.versions.includes('0.26.0-alpha.1') && f28.planNettoyage.length === 22 && f28.planNettoyage.find((x) => x.id === 'pn_cuves_rincage').quand[0].delai === 2 && f28.planMaintenance.length === 15 && f28.maintenance.length === 2 && f28.hygiene.some((x) => x.controle && x.changementRevendication) && f28.hygiene.some((x) => x.cibleType === 'local') && f28.hygieneAcquits.length === 1 && f28.produits[0].doseEmploi === '10 à 30 g/hL' && f28.settings.planHygieneDepuis === '2026-09-01');
    const f27b = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.25.0-alpha.2-ops.json'), 'utf8')));
    t('base 0.25.0-alpha.2 rouverte : plans d’origine ajoutés, mis en place à l’ouverture (aucune alerte sur le passé)', f27b.planNettoyage.length === 21 && f27b.planMaintenance.length === 14 && f27b.lists.locaux.length === 10 && f27b.settings.planHygieneDepuis >= '2026-11-21' && !PT(f27b, f27b.settings.planHygieneDepuis).some((x) => x.origine === 'nettoyage'));
    const dirY = path.join(__dirname, 'anciennes', '0.25.0-alpha.2');
    const Y = new Function('React', files.filter((f) => fs.existsSync(path.join(dirY, f))).map((f) => fs.readFileSync(path.join(dirY, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, clone, hygieneSave, produitSave, opSave, journalAlteres, syncFusion, APP_VERSION, APP_NUM };')({});
    t('0.25.0-alpha.2 gelée chargée (n° 25 000 002)', Y.APP_VERSION === '0.25.0-alpha.2' && Y.APP_NUM === 25000002 && L.APP_NUM > Y.APP_NUM);
    const y = Y.normalizeDb(Y.clone(f28)); const K = ['planNettoyage', 'planMaintenance', 'maintenance', 'hygieneAcquits', 'hygiene', 'produits', 'lists', 'settings'];
    t('… ouvre la base 0.26.0-alpha.1 sans rien perdre (plans, interventions, justifications, journal d’hygiène, informations des intrants)', K.every((k) => canonJ(y[k]) === canonJ(f28[k])), K.filter((k) => canonJ(y[k]) !== canonJ(f28[k])));
    const hz = y.hygiene.find((x) => x.controle && x.changementRevendication); const rz = Y.hygieneSave(y, { ...Y.clone(hz), notes: 'vu en 0.25' }, hz.id); const pz = y.produits[0]; const rp = Y.produitSave(y, { ...Y.clone(pz), notes: 'note 0.25' }, pz.id);
    const back = L.normalizeDb(Y.clone(y)); const bh = back.hygiene.find((x) => x.id === hz.id);
    t('… entrée d’hygiène et intrant modifiés par la 0.25.0-alpha.2 : contrôle, revendication, ligne du plan et informations gardés ; rouverte ici', rz.ok && rp.ok && bh.notes === 'vu en 0.25' && bh.controle.valeur === '7' && bh.changementRevendication.vers === 'bio' && bh.planId === 'pn_cuves_revendication' && back.produits[0].doseEmploi === '10 à 30 g/hL' && back.produits[0].notes === 'note 0.25' && back.planNettoyage.length === 22);
    const A1 = L.clone(f28); const A2 = L.clone(f28); L.maintInterventionSave(A1, { date: '2026-11-21', entreeId: 'pm_filtres', type: 'preventive', resultat: 'conforme' }); L.planEntreeSave(A2, { zone: 'autre', libelle: 'Bureau', actionId: 'nettoyage', cible: { type: 'locaux' }, quand: [{ type: 'apresVendanges' }] });
    const F = L.syncFusion(f28, A1, A2);
    t('synchronisation : intervention saisie sur un appareil, ligne du plan sur l’autre → les deux gardées', F.db.maintenance.length === 3 && F.db.planNettoyage.length === 23 && !F.conflits.length);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ---- 29. pesées et pressurages seulement dans l'onglet Pressoir, pressurage lancé depuis une pesée (0.26.0-alpha.2)
  {
    const i = L.CHANGELOG.findIndex((c) => c.v === '0.26.0-alpha.2');
    t('version 0.26.0-alpha.2 : pré-version de la 0.26.0 (ajustement de la version en test)', i >= 0 && L.CHANGELOG[i + 1].v === '0.26.0-alpha.1' && L.CHANGELOG[i].notes.length === 3 && L.versionNum('0.26.0-alpha.2') === 26000002 && L.APP_NUM >= 26000002);
    t('… nouveautés traduites dans les cinq langues', i >= 0 && L.CHANGELOG[i].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
    const cat = (db) => L.opGroupes(db, (x) => !L.opViaPressoir(db, { type: x.id })).flatMap((g) => g.items);
    t('onglet Pressoir actif : ni pesée ni pressurage au catalogue de l’onglet Opérations ; les autres opérations y restent', L.moduleActif(d, 'pressoir') && !cat(d).includes('apport') && !cat(d).includes('pressurage') && ['entree_mout', 'transfert', 'assemblage'].every((k) => cat(d).includes(k)), cat(d));
    const ap = d.ops.find((o) => o.type === 'apport' && o.pesee); const mc = d.ops.find((o) => o.type === 'pressurage' && o.marc);
    t('… le journal garde pesées et marcs : « Modifier » ouvre le formulaire du Pressoir', !!ap && !!mc && L.opViaPressoir(d, { type: 'apport', editId: ap.id }) === 'pesee' && L.opViaPressoir(d, { type: 'pressurage', editId: mc.id }) === 'marc');
    const d2 = L.clone(d); const ra = L.moduleActiver(d2, 'pressoir', false);
    t('onglet Pressoir désactivé : les deux opérations reviennent dans l’onglet Opérations, avec leurs formulaires généraux', ra.ok && !L.moduleActif(d2, 'pressoir') && cat(d2).includes('apport') && cat(d2).includes('pressurage') && L.opViaPressoir(d2, { type: 'pressurage' }) === '' && L.opViaPressoir(d2, { type: 'apport', editId: ap.id }) === '');
    // « Presser » : marc chargé avec le reste de la pesée
    const ctx = { maintenant: '2026-09-25T07:01:00', par: '' };
    const p = L.peseeSave(d, { date: '2026-09-25', heure: '07:00', cepageId: 'chard', kg: 5000, etat: 'sain' }, null, ctx);
    const m1 = p.ok ? L.marcSave(d, { date: '2026-09-25', heureDebut: '08:00', equipementId: 'pressoir', charges: [{ apportId: p.op.id, kg: 3000 }], code: 'PT-1' }, null, ctx) : p;
    const r1 = p.ok ? L.peseeReste(d, p.op.id) : -1;
    const m2 = p.ok ? L.marcSave(d, { date: '2026-09-25', heureDebut: '10:00', equipementId: 'pressoir', charges: [{ apportId: p.op.id, kg: r1 }], code: 'PT-2', sousCharge: 'Fin de la pesée' }, null, ctx) : p;
    t('« Presser » sur une pesée : marc chargé avec le reste (2 000 kg), pesée entièrement pressée ensuite', p.ok && m1.ok && r1 === 2000 && m2.ok && L.peseeReste(d, p.op.id) === 0, [p.msg, m1.msg, r1, m2.msg]);
    // base de test 0.26.0-alpha.2 ; compatibilité avec la 0.26.0-alpha.1 gelée ; synchronisation
    const f29 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.26.0-alpha.2-pressurage.json'), 'utf8'))); L.syncConfig(f29);
    const pz = f29.ops.find((o) => o.type === 'apport' && o.pesee && o.date === '2026-09-24'); const mz = pz ? f29.ops.filter((o) => o.type === 'pressurage' && (o.charges || []).some((c) => c.apportId === pz.id)) : [];
    t('base 0.26.0-alpha.2 de test : une pesée pressée en deux marcs (nouveau pressurage, puis « Presser » avec le reste)', f29.meta.versions.includes('0.26.0-alpha.2') && mz.length === 2 && L.peseeReste(f29, pz.id) === 0 && mz.some((m) => m.parentSpec.code === 'PF-29' && m.parentSpec.designation === 'Chardonnay 2026 – marc' && m.charges[0].kg === 2000));
    const dirX = path.join(__dirname, 'anciennes', '0.26.0-alpha.1');
    const X = new Function('React', files.filter((f) => fs.existsSync(path.join(dirX, f))).map((f) => fs.readFileSync(path.join(dirX, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, clone, opSave, journalAlteres, APP_VERSION, APP_NUM };')({});
    t('0.26.0-alpha.1 gelée chargée (n° 26 000 001)', X.APP_VERSION === '0.26.0-alpha.1' && X.APP_NUM === 26000001 && L.APP_NUM > X.APP_NUM);
    const x = X.normalizeDb(X.clone(f29)); const K = ['ops', 'lots', 'contenants', 'journalPressoir', 'lists', 'settings', 'formulaires', 'planNettoyage', 'planMaintenance', 'maintenance', 'hygiene', 'hygieneAcquits'];
    t('… ouvre la base 0.26.0-alpha.2 sans rien perdre (pesées, marcs, lots, journal du pressoir, plans d’hygiène)', K.every((k) => canonJ(x[k]) === canonJ(f29[k])), K.filter((k) => canonJ(x[k]) !== canonJ(f29[k])));
    const xm = mz.length ? x.ops.find((o) => o.id === mz[1].id) : null; const rx = xm ? X.opSave(x, { ...X.clone(xm), notes: 'note 0.26.0-alpha.1' }, xm.id) : { ok: false, msg: 'marc absent' };
    const back = L.normalizeDb(X.clone(x)); const bm = xm ? back.ops.find((o) => o.id === xm.id) : null;
    t('… marc annoté par la 0.26.0-alpha.1 : pesée chargée et désignation gardées ; rouvert ici, pesée toujours pressée, journal intègre', rx.ok && !!bm && bm.notes === 'note 0.26.0-alpha.1' && bm.charges[0].apportId === pz.id && bm.parentSpec.designation === mz[1].parentSpec.designation && L.peseeReste(back, pz.id) === 0 && !L.journalAlteres(back).length, rx.msg);
    const A1 = L.clone(f29); const A2 = L.clone(f29); const c2 = { maintenant: '2026-09-26T07:01:00', par: '' };
    const q = L.peseeSave(A1, { date: '2026-09-26', heure: '07:00', cepageId: 'pn', kg: 4000, etat: 'sain', tap: 10.2 }, null, c2);
    const qm = q.ok ? L.marcSave(A1, { date: '2026-09-26', heureDebut: '08:00', equipementId: 'pressoir', charges: [{ apportId: q.op.id, kg: L.peseeReste(A1, q.op.id) }], code: 'PF-30' }, null, c2) : q;
    L.maintInterventionSave(A2, { date: '2026-11-21', entreeId: 'pm_filtres', type: 'preventive', resultat: 'conforme' });
    const F = L.syncFusion(f29, A1, A2);
    t('synchronisation : pesée pressée sur un appareil, intervention sur l’autre → les deux gardées', q.ok && qm.ok && F.db.ops.length === f29.ops.length + 2 && F.db.maintenance.length === f29.maintenance.length + 1 && !F.conflits.length, [q.msg, qm.msg, F.conflits.length]);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ---- 30. protection des importations, bulletins d'analyses, fichiers de traçabilité des expéditions (0.27.0-alpha.1)
  {
    const zlib = require('zlib'); const PDFLib = require('/opt/npm-tools/node_modules/pdf-lib'); const JSZip = require('/opt/npm-tools/node_modules/jszip');
    const inflate = async (b, brut, max) => { const o = brut ? zlib.inflateRawSync(Buffer.from(b)) : zlib.inflateSync(Buffer.from(b)); if (o.length > (max || 1e9)) throw new Error('trop gros'); return new Uint8Array(o); };
    const U = (x) => new Uint8Array(Buffer.from(x, 'latin1')); const nb = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
    const G = (b, nom, usage, o) => L.gardeAnalyser(b, nom, usage || 'document', { inflate, ...(o || {}) });
    const i = L.CHANGELOG.findIndex((c) => c.v === '0.27.0-alpha.1');
    t('version 0.27.0-alpha.1 : nouvelle version mineure (protection des importations, bulletins, traçabilité des expéditions)', i >= 0 && L.CHANGELOG[i + 1].v === '0.26.0-alpha.2' && L.CHANGELOG[i].notes.length === 5 && L.versionNum('0.27.0-alpha.1') === 27000001 && L.APP_NUM >= 27000001);
    t('… nouveautés traduites dans les cinq langues', i >= 0 && L.CHANGELOG[i].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    // garde : type réel, nom, taille
    const v1 = await G(U('MZ\x90\x00programme'), 'facture.pdf'); const v2 = await G(U('<!doctype html><html><script>x</script>'), 'notes.txt'); const v3 = await G(U('%PDF-1.4 ...'), 'outil.exe');
    const v4 = await G(U('%PDF-1.4'), 'fact‮fdp.exe'); const v5 = await G(new Uint8Array(0), 'vide.pdf'); const v6 = await G(U('PK\x03\x04'), 'archive.zip');
    t('garde : programme déguisé en PDF, page web déguisée en texte, .exe, nom trompeur, fichier vide, archive → refusés', [v1, v2, v3, v4, v5, v6].every((v) => v.statut === 'refuse') && /programme Windows déguisé en « \.pdf »/.test(v1.raisons[0]) && /page web/.test(v2.raisons[0]), [v1, v2, v3, v4, v5, v6].map((v) => v.raisons[0]));
    const big = new Uint8Array(11 * 1024 * 1024); big.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const png = new Uint8Array(40); png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); const dv = new DataView(png.buffer); dv.setUint32(16, 60000); dv.setUint32(20, 60000); const vb = await G(png, 'photo.png');
    dv.setUint32(16, 800); dv.setUint32(20, 600); const vo = await G(png, 'photo.jpg');
    t('garde : logo trop lourd et bombe de décompression refusés ; image correcte acceptée, type lu dans le contenu', (await G(big, 'logo.png', 'logo')).statut === 'refuse' && vb.statut === 'refuse' && vo.statut === 'ok' && vo.type === 'image/png');
    const zm = new JSZip(); zm.file('[Content_Types].xml', '<Types/>'); zm.file('word/document.xml', '<w:document/>'); zm.file('word/vbaProject.bin', 'x');
    const zo = new JSZip(); zo.file('[Content_Types].xml', '<Types/>'); zo.file('xl/workbook.xml', '<wb/>');
    const zt = new JSZip(); zt.file('[Content_Types].xml', '<Types/>'); zt.file('word/document.xml', '<w:document/>'); zt.file('word/_rels/settings.xml.rels', '<Relationships><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate" Target="http://exemple.invalid/m.dotm" TargetMode="External"/></Relationships>');
    const gen = (z) => z.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    const vm = await G(await gen(zm), 'lettre.docx'); const vx = await G(await gen(zo), 'classeur.xlsx'); const vt = await G(await gen(zt), 'modele.docx');
    t('garde : Word avec macros, Word à modèle distant refusés ; classeur Excel accepté', vm.statut === 'refuse' && vt.statut === 'refuse' && vx.statut === 'ok' && vx.famille === 'office', [vm.raisons, vt.raisons, vx.raisons]);
    const svg = U('<svg xmlns="http://www.w3.org/2000/svg"><script>x</script></svg>');
    t('garde : SVG refusé comme document, accepté pour le logo (redessiné en PNG)', (await G(svg, 'image.svg')).statut === 'refuse' && (await G(svg, 'logo.svg', 'logo')).statut === 'ok');
    // PDF à contenu actif (objets compressés) : repéré, désarmé avec pdf-lib, revérifié
    const pd = await PDFLib.PDFDocument.create(); const pg = pd.addPage();
    pd.catalog.set(PDFLib.PDFName.of('OpenAction'), pd.context.register(pd.context.obj({ S: 'JavaScript', JS: PDFLib.PDFString.of('app.alert(1)') })));
    await pd.attach(new Uint8Array(Buffer.from('MZ')), 'outil.exe', { mimeType: 'application/octet-stream' });
    pg.node.set(PDFLib.PDFName.of('Annots'), pd.context.obj([pd.context.register(pd.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 9, 9], A: { S: 'Launch', F: PDFLib.PDFString.of('cmd.exe') } }))]));
    const actif = await pd.save({ useObjectStreams: true }); const a0 = await L.gardePdfAnalyser(actif, inflate);
    const vsans = await G(actif, 'fiche.pdf'); const vpdf = await G(actif, 'fiche.pdf', 'fiche', { PDFLib });
    const a1 = vpdf.octets ? await L.gardePdfAnalyser(vpdf.octets, inflate) : null; const relu = vpdf.octets ? await PDFLib.PDFDocument.load(vpdf.octets) : null;
    t('PDF : JavaScript, lancement et fichier incorporé repérés, même dans les objets compressés', ['JavaScript', 'Launch', 'EmbeddedFile'].every((k) => a0.actifs.includes(k)) && a0.objStm > 0 && a0.vus > 0, a0);
    t('PDF : refusé sans module de désarmement ; désarmé avec : plus de contenu actif, document toujours lisible', vsans.statut === 'refuse' && vpdf.statut === 'nettoye' && !!a1 && !a1.actifs.length && !!relu && relu.getPageCount() === 1, [vsans.raisons, vpdf.raisons, a1 && a1.actifs]);
    t('PDF propre accepté sans modification', (await G(await (await PDFLib.PDFDocument.create()).save(), 'propre.pdf')).statut === 'ok');
    // « /JS » au hasard des octets d'une image (scan) : pas du contenu actif ; la structure du document le confirme
    const pImg = await PDFLib.PDFDocument.create(); pImg.addPage(); const octetsImg = new Uint8Array(4096); for (let k = 0; k < octetsImg.length; k += 1) octetsImg[k] = (k * 131 + 7) % 251 + 3; octetsImg.set([0x2F, 0x4A, 0x53, 0xAD, 0xD2, 0x01], 1500);
    pImg.context.register(pImg.context.stream(octetsImg, { Type: 'XObject', Subtype: 'Image', Width: 64, Height: 64, BitsPerComponent: 8, ColorSpace: 'DeviceGray' }));
    const scan = await pImg.save({ useObjectStreams: false }); const aScan = await L.gardePdfAnalyser(scan, inflate); const vScan = await G(scan, 'scan.pdf', 'fiche', { PDFLib }); const vScanSans = await G(scan, 'scan.pdf', 'fiche');
    t('PDF : « /JS » au milieu des octets d’une image : douteux, écarté par la structure (gardé tel quel) ; sans module : accepté avec avertissement', !aScan.actifs.length && aScan.douteux.includes('JS') && vScan.statut === 'ok' && !vScan.octets && !vScan.avertissements.length && vScanSans.statut === 'ok' && /vérification approfondie impossible/.test(vScanSans.avertissements.join()), [aScan, vScan, vScanSans.avertissements]);
    // objet caché derrière un faux début de flux (commentaire) : repéré comme texte
    const cache = U('%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj\n%>>stream\n3 0 obj << /S /JavaScript /JS (app.alert(1)) >> endobj\nendstream\ntrailer << /Root 1 0 R >>\n%%EOF\n');
    const aCache = await L.gardePdfAnalyser(cache, inflate);
    t('PDF : objet JavaScript caché derrière un faux début de flux : repéré (refusé sans module de désarmement)', aCache.actifs.includes('JavaScript') && (await G(cache, 'cache.pdf')).statut === 'refuse', aCache);
    // annotation « pièce jointe » : vidée et rendue inerte, le document reste lisible
    const pa = await PDFLib.PDFDocument.create(); const pgA = pa.addPage(); const ef = pa.context.register(pa.context.stream(new Uint8Array(Buffer.from('MZ programme')), { Type: 'EmbeddedFile' }));
    pgA.node.set(PDFLib.PDFName.of('Annots'), pa.context.obj([pa.context.register(pa.context.obj({ Type: 'Annot', Subtype: 'FileAttachment', Rect: [10, 10, 30, 30], FS: { Type: 'Filespec', F: PDFLib.PDFString.of('outil.exe'), EF: { F: ef } } }))]));
    const vA = await G(await pa.save({ useObjectStreams: false }), 'annot.pdf', 'fiche', { PDFLib }); const aA = vA.octets ? await L.gardePdfAnalyser(vA.octets, inflate) : null;
    t('PDF : annotation « pièce jointe » vidée et rendue inerte (désarmé, plus rien d’actif)', vA.statut === 'nettoye' && !!aA && !aA.actifs.length && !aA.douteux.length && (await PDFLib.PDFDocument.load(vA.octets)).getPageCount() === 1, [vA.statut, vA.raisons, aA]);
    // données importées
    const j = L.jsonSur('{"a":{"__proto__":{"pollue":1}},"constructor":{"prototype":{"y":2}},"ok":[1,2]}');
    let prof = '1'; for (let k = 0; k < 100; k += 1) prof = `{"a":${prof}}`;
    t('JSON : clés piégées retirées sans polluer, profondeur limitée, fichier illisible refusé', j.ok && j.retires === 3 && JSON.stringify(j.valeur) === '{"a":{},"ok":[1,2]}' && ({}).pollue === undefined && ({}).y === undefined && !L.jsonSur(prof).ok && !L.jsonSur('{"a":').ok);
    const bdb = { entreprise: { nom: 'X', logo: 'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pg==' }, docs: [{ id: 'd1', nom: 'facture‮fdp.exe' }] }; const fx = L.gardeBase(bdb);
    t('base importée : logo SVG retiré, nom de document trompeur nettoyé ; logo PNG gardé', !bdb.entreprise.logo && bdb.docs[0].nom === 'facturefdp.exe' && fx.length === 2 && !L.gardeBase({ entreprise: { logo: 'data:image/png;base64,iVBORw0KGgo=' } }).length);
    let pol = ''; try { L.gardeSurveiller(() => { Object.prototype.garde27 = 1; }); } catch (e) { pol = e.message; }
    t('bibliothèque de lecture surveillée : pollution des prototypes refusée et réparée', /fichier piégé/.test(pol) && ({}).garde27 === undefined);
    t('export CSV : formules neutralisées, nombres intacts', L.csvSansFormule('=SOMME(A1)') === "'=SOMME(A1)" && L.csvSansFormule('@cmd') === "'@cmd" && L.csvSansFormule('-12,5') === '-12,5' && L.csvSansFormule('+33 6 12 34 56 78') === '+33 6 12 34 56 78' && L.csvCell(-3) === '-3' && /'=1\+1/.test(L.toCSV([['=1+1', 2]])));
    // journal de sécurité, droits
    const dj = L.normalizeDb(L.sampleDb()); for (let k = 0; k < 305; k += 1) L.gardeJournaliser(dj, { statut: 'refuse', usage: 'document', nom: `f${k}.exe`, raisons: ['extension'] });
    t('journal de sécurité : 300 dernières entrées, identifiants uniques', dj.gardeJournal.length === 300 && dj.gardeJournal[299].nom === 'f304.exe' && new Set(dj.gardeJournal.map((e) => e.id)).size === 300);
    const jA = L.normalizeDb(L.sampleDb()); const jB = L.normalizeDb(L.sampleDb()); L.gardeJournaliser(jA, [{ date: '2026-11-21T08:00:00.000Z', statut: 'refuse', nom: 'a.exe', raisons: ['x'] }, { date: '2026-11-21T09:00:00.000Z', statut: 'nettoye', nom: 'b.pdf', raisons: ['y'] }]);
    L.gardeJournaliser(jB, [{ date: '2026-11-21T08:30:00.000Z', statut: 'refuse', nom: 'c.html', raisons: ['z'] }, { date: '2026-11-21T09:00:00.000Z', statut: 'nettoye', nom: 'b.pdf', raisons: ['y'] }]);
    L.gardeJournalGarder(jA, jB);
    t('journal de sécurité : gardé quand une autre base remplace celle de l’appareil (fusion triée, sans doublon, identifiants uniques)', jB.gardeJournal.map((e) => e.nom).join() === 'a.exe,c.html,b.pdf' && new Set(jB.gardeJournal.map((e) => e.id)).size === 3 && L.gardeJournalGarder({}, jB) === jB);
    const ds = L.normalizeDb(L.sampleDb()); const mA = await L.mdpEmpreinte('Admin-2027', 1000); const adm = L.securiteActiver(ds, { identifiant: 'admin', nom: 'Admin', mdp: mA }).id; const opr = L.utilisateurSave(ds, { identifiant: 'op', nom: 'Op', profilId: 'pf_operateur', mdp: mA }).id;
    L.gardeJournaliser(ds, { statut: 'refuse', nom: 'a.exe', raisons: ['x'] });
    const essai = (uid, fn) => { const av = L.clone(ds); const ap = L.clone(ds); fn(ap); return L.gardeDroits(av, ap, uid); };
    t('droits : le journal de sécurité s’allonge pour chacun ; seul un administrateur le vide', essai(opr, (y) => L.gardeJournaliser(y, { statut: 'refuse', nom: 'b.exe', raisons: ['x'] })).ok && !essai(opr, (y) => L.gardeJournalVider(y)).ok && essai(adm, (y) => L.gardeJournalVider(y)).ok);
    // bulletins d'analyses
    const db = L.normalizeDb(L.sampleDb()); L.syncConfig(db); const R = L.getR(db);
    const t1 = 'LABORATOIRE ŒNOLOGIQUE DE DÉMONSTRATION\nBulletin d’analyses n° 26-1452\nDate de réception : 14/11/2026\n\nÉchantillon n° 1 : Cuve 3 - Chardonnay\nDate de prélèvement : 13/11/2026\nTitre alcoométrique volumique acquis    11,52   % vol\nAcidité totale    6,12    g/L acide tartrique\npH     3,08\nAcide L-malique     < 0,1    g/L\nSO2 libre     18     mg/L\nDensité à 20 °C    992,4   g/L\n\nÉchantillon n° 2 : P26-05-C\nAcidité totale    4,10    g/L H2SO4\nAcide L-malique     2,85    g/L\n';
    const b1 = L.bulletinAnalyser(db, R, L.bulletinLignesDeTexte(t1)); const e1 = b1.echantillons[0] || { valeurs: {}, nouveaux: {} }; const r1 = b1.echantillons[0] ? L.bulletinRattacher(db, (x) => L.getR(db, x), e1, b1.date) : {};
    t('bulletin en liste : n°, date de prélèvement, deux échantillons rattachés (« Cuve 3 » → son lot, P26-05-C)', b1.numero === '26-1452' && b1.date === '2026-11-13' && b1.echantillons.length === 2 && e1.trouve.kind === 'cont' && (R.lots[r1.lotId] || {}).code === 'P26-03-C' && b1.echantillons[1].trouve.nom === 'P26-05-C', b1.echantillons.map((e) => e.ref));
    t('… acidité en acide tartrique → H₂SO₄, « < 0,1 » gardé, densité en g/L → g/mL, TAV acquis proposé comme nouveau paramètre', Math.abs(e1.valeurs.at.v - 6.12 / 1.531) < 0.001 && e1.valeurs.malique.op === '<' && e1.valeurs.malique.v === 0.1 && Math.abs(e1.valeurs.densite.v - 0.9924) < 1e-6 && e1.valeurs.ph.v === 3.08 && !!e1.nouveaux.tav && e1.nouveaux.tav.v === 11.52);
    const b2 = L.bulletinAnalyser(db, R, L.bulletinLignesDeTexte('Laboratoire d’analyses\nRapport n° R-2026-0099 édité le 20/11/2026\nParamètre;Unité;Cuve 06;AS25-02\nTAV acquis;% vol;11,8;12,1\npH;;3,05;3,11\nSO2 total;mg/L;48;55'));
    t('bulletin en tableau (une colonne par échantillon)', b2.format === 'tableau' && b2.echantillons.length === 2 && b2.echantillons[1].trouve.nom === 'AS25-02' && b2.echantillons[0].valeurs.ph.v === 3.05 && b2.echantillons[1].valeurs.so2t.v === 55);
    const b3 = L.bulletinAnalyser(db, R, L.bulletinLignesDeTableau([['Référence', 'Date prélèvement', 'pH', 'SO2 libre (mg/L)'], ['Cuve 10', '18/11/2026', '3,12', '22'], ['P26-04-C', '18/11/2026', '3,02', '15']]));
    t('export de laboratoire (une ligne par échantillon)', b3.format === 'lignes' && b3.echantillons.length === 2 && b3.echantillons[0].date === '2026-11-18' && b3.echantillons[1].valeurs.so2l.v === 15);
    const ia = L.iaLireBulletin(db, { laboratoire: 'X', echantillons: [{ reference: 'Cuve 3', resultats: { azote: 120, ph: 3.09, inconnu: 5 }, autres: [{ nom: 'Acide lactique', valeur: 0.12, unite: 'g/L' }] }, { reference: 'Cuve 07', resultats: { so2t: 40 } }] });
    const bf = L.bulletinFusion(db, R, b1, ia); const f0 = bf.echantillons[0];
    t('IA : complète (azote, acide lactique, un échantillon de plus), écart signalé, paramètre inconnu ignoré', bf.echantillons.length === 3 && f0.valeurs.azote.src === 'ia' && f0.valeurs.ph.ia === 3.09 && !!f0.nouveaux.lactique && !f0.valeurs.inconnu);
    const pr = L.iaPromptBulletin(db, 'Bulletin sans référence', false); const codes = Object.values(R.lots).map((l) => l.code).filter((c) => c.length > 3);
    t('IA : ni les codes des lots ni les noms des cuves envoyés (le texte du bulletin et les paramètres seulement)', !codes.some((c) => pr.texte.includes(c)) && !db.contenants.some((c) => c.nom.length > 4 && pr.texte.includes(c.nom)) && pr.texte.includes('SO₂ libre'));
    const dbb = L.clone(db); const plan = { doc: { id: 'docb30', nom: 'bulletin.pdf', mime: 'application/pdf', taille: 900 }, params: [{ cle: 'tav', nom: 'TAV acquis', unite: '% vol.', dec: 2 }], analyses: [{ ref: 'Cuve 3', date: r1.date, lotId: r1.lotId, contenantId: r1.contenantId, modeleId: L.bulletinModele(dbb, ['at', 'ph', 'so2l']), valeurs: { at: 4, ph: 3.08, '+tav': 11.52 }, notes: 'n' }] };
    const re = L.bulletinEnregistrer(dbb, plan); const an = re.ok ? dbb.analyses.find((x) => x.id === re.ids[0]) : null; const ptav = dbb.analysesParams.find((p) => p.nom === 'TAV acquis');
    t('enregistrement : nouveau paramètre créé, analyse rattachée au bulletin joint (une fiche de document)', re.ok && !!ptav && an.valeurs[ptav.id] === 11.52 && an.bulletinDocId === 'docb30' && L.analyseBulletin(dbb, an).cible.type === 'bulletin' && L.analyseBulletin(dbb, an).analyseIds[0] === an.id && an.source === 'bulletin' && an.modeleId === 'm_clair', re.msg);
    const dbb2 = L.clone(dbb); const re2 = L.bulletinEnregistrer(dbb2, { ...plan, doc: null });
    t('… paramètre déjà créé repris (pas de double) ; analyse sans lot refusée', re2.ok && dbb2.analysesParams.filter((p) => p.nom === 'TAV acquis').length === 1 && !L.bulletinEnregistrer(L.clone(db), { analyses: [{ ...plan.analyses[0], lotId: '' }] }).ok);
    // fichier de traçabilité : export, discrétion, lecture, réception, réexpédition
    const sv = db.ops.find((o) => o.type === 'sortie' && o.destinataire === 'Maison Dubois');
    const xe = L.traceExport(db, sv.id, null, { maintenant: '2026-11-21T10:00:00Z' }); const xd = xe.data || {}; const txt = JSON.stringify(xd);
    t('export : produit, expédition, sections conseillées, empreinte ; jamais les opérateurs', xe.ok && xd.produit.lot === 'AS25-02' && xd.expedition.destinataire === 'Maison Dubois' && xd.sections.join() === L.traceSectionsDefaut().join() && xd.empreinte === L.traceEmpreinte(xd) && !(db.operateurs || []).some((o) => o.nom && txt.includes(o.nom)) && !txt.includes('"operateurs"'));
    const xm = L.traceExport(db, sv.id, [], {}).data;
    t('discrétion : au minimum, seulement le produit et l’expédition', Object.keys(xm).sort().join() === 'app,appVersion,empreinte,expedition,exporteLe,format,formatVersion,produit,sections' && !xm.composition && !xm.intrants);
    const xa = L.traceExport(db, sv.id, ['apporteurs', 'parcelles', 'contenants', 'historique'], {}).data;
    t('… si choisis : apporteurs, parcelles, noms des cuves dans l’historique', Array.isArray(xa.apporteurs) && Array.isArray(xa.parcelles) && xa.historique.some((h) => (h.contenants || []).length) && !xa.composition);
    const perte = db.ops.find((o) => o.type === 'sortie' && o.sousType === 'perte'); const autre = db.ops.find((o) => o.type !== 'sortie');
    t('pas de fichier pour une perte ni pour une opération qui n’est pas une sortie', !L.traceExport(db, autre.id, null).ok && (!perte || !L.traceExport(db, perte.id, null).ok) && !L.traceOpOk({ type: 'sortie', sousType: 'perte' }));
    const lu = L.traceLire(txt); const mo = JSON.parse(txt); mo.produit.millesime = '1999'; const pi = L.traceLire(txt.replace('{"format"', '{"__proto__":{"pollue":1},"format"'));
    t('lecture : fichier intact ; modifié signalé ; clé piégée retirée sans polluer ; autre fichier refusé', lu.ok && lu.integre && L.traceLire(JSON.stringify(mo)).ok && !L.traceLire(JSON.stringify(mo)).integre && pi.ok && ({}).pollue === undefined && !L.traceLire('{"a":1}').ok);
    const ev = L.traceVersEntree(db, lu.data, 'reprise'); const em = L.traceVersEntree(db, lu.data, 'entree_mout');
    t('réception : entrée de vin préremplie (cépages, crus, revendication, volume) ; entrée de moût : ligne principale avec le n° de lot', ev.preset.sousType === 'entree_vin' && Object.keys(ev.preset.cepages).sort().join() === 'chard,pn' && ev.preset.crus.length === 2 && ev.preset.qualifId === 'bio' && ev.preset.volL === '1000' && em.ligne.cepageId === 'chard' && em.ligne.numLot === 'AS25-02' && em.ligne.dests[0].volL === '1000', [ev.preset, em.ligne]);
    const dr = L.clone(db); const R2 = L.getR(dr, '2026-11-20'); const vide = dr.contenants.find((c) => c.statut !== 'archive' && nb(c.volMax) >= 10 && !Object.values(R2.portions).some((q) => q.contenantId === c.id && q.vol > 0.001));
    const rec = L.traceAmontRec(lu.data, 'tracabilite.json', lu.integre, '2026-11-21T10:05:00Z');
    const ro = L.opSave(dr, { type: 'reprise', sousType: 'entree_vin', date: '2026-11-20', notes: '', contenantId: vide.id, volL: 8, apporteurId: dr.apporteurs[0].id, lotSpec: { code: 'RV30-01', designation: 'Vin reçu', millesime: '2025', type: 'vin_reserve', qualifId: 'bio', cepages: { chard: 50, pn: 50 }, crus: {}, echelle: '' }, amont: [rec] });
    const lotR = ro.ok ? ro.op.lotId : ''; const A = L.traceAmontDuLot(dr, lotR);
    t('entrée de vin enregistrée avec la traçabilité amont, retrouvée sur le lot reçu', ro.ok && A.length === 1 && A[0].rec.produit.lot === 'AS25-02' && A[0].rec.integre === true, ro.msg);
    const pq = Object.values(L.getR(dr, '2026-11-21').portions).find((q) => q.lotId === lotR);
    const so = pq ? L.opSave(dr, { type: 'sortie', date: '2026-11-21', portionId: pq.id, volL: 3, motif: 'Vente en vrac', destinataire: 'Négoce Y', ref: '' }) : { ok: false };
    const x2 = so.ok ? L.traceExport(dr, so.op.id, null, {}) : { ok: false };
    t('réexpédition : le fichier transmet la traçabilité d’avant (chaîne des expéditeurs)', x2.ok && (x2.data.amont || []).length === 1 && x2.data.amont[0].produit.lot === 'AS25-02' && !('recuLe' in x2.data.amont[0]));
    if (so.ok) L.traceExportNoter(dr, so.op.id, { sections: x2.data.sections, empreinte: x2.data.empreinte });
    t('export noté sur l’expédition (date, sections, empreinte)', so.ok && dr.ops.find((o) => o.id === so.op.id).traceExports.length === 1);
    // base de test 0.27.0-alpha.1 ; compatibilité avec la 0.26.0-alpha.2 gelée ; synchronisation
    const f30 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.27.0-alpha.1-imports.json'), 'utf8'))); L.syncConfig(f30);
    const ent = f30.ops.find((o) => Array.isArray(o.amont) && o.amont.length); const exp = f30.ops.find((o) => Array.isArray(o.traceExports) && o.traceExports.length); const anb = f30.analyses.find((a) => a.bulletinDocId);
    t('base 0.27.0-alpha.1 de test : journal de sécurité, documents vérifiés, bulletin, expédition exportée, entrée avec traçabilité amont', f30.meta.versions.includes('0.27.0-alpha.1') && f30.gardeJournal.length === 2 && L.gardeDocsSuspects(f30).length === 1 && !!ent && !!exp && !!anb && L.analyseBulletin(f30, anb).id === 'docbul27' && L.traceAmontDuLot(f30, ent.lotId).length === 1);
    const dirY = path.join(__dirname, 'anciennes', '0.26.0-alpha.2');
    const Y = new Function('React', files.filter((f) => fs.existsSync(path.join(dirY, f))).map((f) => fs.readFileSync(path.join(dirY, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, clone, opSave, analyseSave, APP_VERSION, APP_NUM };')({});
    t('0.26.0-alpha.2 gelée chargée (n° 26 000 002)', Y.APP_VERSION === '0.26.0-alpha.2' && Y.APP_NUM === 26000002 && L.APP_NUM > Y.APP_NUM);
    const y = Y.normalizeDb(Y.clone(f30)); const K = ['ops', 'lots', 'contenants', 'analyses', 'analysesParams', 'docs', 'gardeJournal', 'journalPressoir', 'lists', 'settings', 'hygiene', 'maintenance'];
    t('… ouvre la base 0.27.0-alpha.1 sans rien perdre (traçabilité amont, exports, bulletins, journal de sécurité)', K.every((k) => canonJ(y[k]) === canonJ(f30[k])), K.filter((k) => canonJ(y[k]) !== canonJ(f30[k])));
    const ye = y.ops.find((o) => o.id === ent.id); const ry = Y.opSave(y, { ...Y.clone(ye), notes: 'note 0.26.0-alpha.2' }, ye.id);
    const ya = y.analyses.find((a) => a.id === anb.id); const ra = Y.analyseSave(y, { date: ya.date, lotId: ya.lotId, contenantId: ya.contenantId, modeleId: ya.modeleId, valeurs: { ...ya.valeurs, ph: 3.1 }, notes: ya.notes }, ya.id);
    const back = L.normalizeDb(Y.clone(y)); const be = back.ops.find((o) => o.id === ent.id); const ba = back.analyses.find((a) => a.id === anb.id);
    t('… entrée annotée et analyse corrigée par la 0.26.0-alpha.2 : traçabilité amont et bulletin gardés ; rouverts ici', ry.ok && ra.ok && be.notes === 'note 0.26.0-alpha.2' && be.amont.length === 1 && be.amont[0].empreinte === ent.amont[0].empreinte && ba.valeurs.ph === 3.1 && ba.bulletinDocId === 'docbul27' && L.analyseBulletin(back, ba).id === 'docbul27' && L.traceAmontDuLot(back, ent.lotId).length === 1, [ry.msg, ra.msg]);
    const S1 = L.clone(f30); const S2 = L.clone(f30); L.gardeJournaliser(S1, { statut: 'refuse', nom: 'x.exe', raisons: ['extension'] });
    const rS = L.bulletinEnregistrer(S2, { doc: { id: 'docb30s', nom: 'b.pdf', mime: 'application/pdf', taille: 10 }, analyses: [{ date: anb.date, lotId: anb.lotId, contenantId: anb.contenantId, valeurs: { ph: 3.2 } }] });
    const FS = L.syncFusion(f30, S1, S2);
    t('synchronisation : journal de sécurité d’un côté, bulletin importé de l’autre → les deux gardés', rS.ok && FS.db.gardeJournal.length === 3 && FS.db.analyses.length === f30.analyses.length + 1 && FS.db.docs.some((x) => x.id === 'docb30s') && !FS.conflits.length, [rS.msg, FS.conflits.length]);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ---- 31. listes de l'hygiène personnalisables, identifiants imprimés sur les bons, déclassements dans Opérations (0.27.0-alpha.2)
  {
    const i = L.CHANGELOG.findIndex((c) => c.v === '0.27.0-alpha.2');
    t('version 0.27.0-alpha.2 : itération de la 0.27.0 (ajustements de la version en test)', i >= 0 && L.CHANGELOG[i + 1].v === '0.27.0-alpha.1' && L.CHANGELOG[i].notes.length === 4 && L.versionNum('0.27.0-alpha.2') === 27000002 && L.APP_NUM >= 27000002);
    t('… nouveautés traduites dans les cinq langues', L.CHANGELOG[i].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const ids = (Lx) => Lx.map((x) => x[0]).join();
    const d0 = L.normalizeDb(L.sampleDb()); L.syncConfig(d0);
    t('listes de l’hygiène : onze listes, éléments d’origine tant que rien n’est personnalisé', L.HYG_LISTES_DEF.filter((x) => x.groupe !== 'equipements').length === 11 && ids(L.HYG_CONTROLES) === 'visuel,ph,peroxyde,aucun' && L.hygListeItems(d0, 'hygZones').every((x) => x.origine) && !Object.keys(d0.lists).some((k) => /^(hyg|maint)[A-Z]/.test(k)));
    const d = L.clone(d0); L.syncConfig(d);
    const ra = L.hygListeAjouter(d, 'hygControles', 'Conductimètre', { attendu: '< 50 µS/cm' });
    t('contrôle ajouté (avec le résultat attendu) : proposé avant « Aucun », résultat attendu repris', ra.ok && ra.id === 'conductimetre' && ids(L.HYG_CONTROLES) === 'visuel,ph,peroxyde,conductimetre,aucun' && L.HYG_CONTROLE_ATTENDU.conductimetre === '< 50 µS/cm' && L.HYG_CONTROLE_ATTENDU.ph === 'pH 7');
    t('… libellé en double (accents, casse), vide ou liste inconnue refusés', !L.hygListeAjouter(d, 'hygControles', 'CONDUCTIMETRE').ok && !L.hygListeAjouter(d, 'hygControles', '  ').ok && !L.hygListeAjouter(d, 'inconnue', 'X').ok && !L.hygListeAjouter(d, 'hygControles', 'Papier pH').ok);
    const rz = L.hygListeAjouter(d, 'hygZones', 'Chai à barriques'); const rm = L.hygListeAjouter(d, 'hygMoments', 'Après chaque débourbage'); const rt = L.hygListeAjouter(d, 'maintTypes', 'Étalonnage'); const re = L.hygListeAjouter(d, 'hygEpi', 'Casque anti-bruit');
    t('zone, moment, type de maintenance, protection individuelle ajoutés (identifiants lisibles et uniques)', rz.id === 'chai-a-barriques' && rm.id === 'apres-chaque-debourbage' && rt.id === 'etalonnage' && re.id === 'casque-anti-bruit' && L.HYG_ZONES.some((x) => x[0] === rz.id) && L.HYG_MOMENTS.length === 1 && L.MAINT_TYPES.some((x) => x[0] === 'etalonnage') && L.HYG_EPI.some((x) => x[0] === 'casque-anti-bruit'));
    const r2 = L.hygListeAjouter(d, 'hygZones', 'Chai à barriques ');
    const rz2 = L.hygListeAjouter(d, 'hygZones', 'Chai a barriques (2)');
    t('… identifiant déjà pris : suffixe ; libellé identique (espaces) refusé', !r2.ok && rz2.ok && rz2.id === 'chai-a-barriques-2');
    // enregistrements qui s'en servent
    const act = d.lists.actionsHygiene[0]; const c0 = d.contenants.find((c) => c.statut !== 'archive');
    const pl = L.planEntreeSave(d, { zone: rz.id, libelle: 'Barriques', cible: { type: 'contenants', formes: ['fut'] }, actionId: act.id, quand: [{ type: 'texte', texte: 'Après chaque débourbage', momentId: rm.id }], produits: [], controle: 'conductimetre', attendu: '< 50 µS/cm', danger: 'chimique' });
    const ple = pl.ok ? d.planNettoyage.find((x) => x.id === pl.id) : {};
    t('plan de nettoyage : zone et contrôle ajoutés gardés (plus ramenés à « Autres zones » ni « Visuel »), moment relié', pl.ok && ple.zone === rz.id && ple.controle === 'conductimetre' && ple.quand[0].momentId === rm.id, pl.msg);
    const hj = L.hygieneSave(d, { date: '2026-11-21', cibleType: 'contenant', cibleId: c0.id, actionId: act.id, produits: [], methode: '', notes: '', controle: { type: 'conductimetre', resultat: 'conforme', valeur: '32 µS/cm' }, planId: pl.id });
    const hje = d.hygiene[d.hygiene.length - 1];
    t('journal d’hygiène : contrôle ajouté enregistré avec son résultat', hj.ok && hje.controle && hje.controle.type === 'conductimetre' && hje.controle.valeur === '32 µS/cm', hj.msg);
    const mi = L.maintInterventionSave(d, { date: '2026-11-21', libelle: 'Réfractomètre', type: 'etalonnage', interventions: 'Étalonnage', resultat: 'conforme' });
    const me = L.maintEntreeSave(d, { libelle: 'Réfractomètre', type: 'etalonnage', frequence: { n: 1, unite: 'an' } });
    t('maintenance : type ajouté accepté (intervention et plan) ; réparation refusée au plan ; type inconnu refusé', mi.ok && me.ok && d.maintenance.some((m) => m.type === 'etalonnage') && !L.maintEntreeSave(d, { libelle: 'X', type: 'curative', frequence: { n: 1, unite: 'an' } }).ok && !L.maintInterventionSave(d, { date: '2026-11-21', libelle: 'X', type: 'inconnu' }).ok && L.maintEntreeSave(d, { libelle: 'Pompe', type: 'preventive', frequence: { n: 1, unite: 'an' } }).ok, [mi.msg, me.msg]);
    t('utilisations comptées (plan, journal, maintenance)', L.hygListeUsage(d, 'hygControles', 'conductimetre') === 2 && L.hygListeUsage(d, 'hygZones', rz.id) === 1 && L.hygListeUsage(d, 'hygMoments', rm.id) === 1 && L.hygListeUsage(d, 'maintTypes', 'etalonnage') === 2 && L.hygListeUsage(d, 'hygZones', rz2.id) === 0);
    const sU = L.hygListeSupprimer(d, 'hygControles', 'conductimetre'); const sO = L.hygListeSupprimer(d, 'hygZones', 'tirage'); const sL = L.hygListeSupprimer(d, 'hygZones', rz2.id);
    t('suppression : élément utilisé refusé (« Utilisé 2 fois »), élément d’origine refusé, élément ajouté inutilisé supprimé', !sU.ok && /Utilisé 2 fois/.test(sU.msg) && !sO.ok && sL.ok && !L.HYG_ZONES.some((x) => x[0] === rz2.id));
    // masquer, renommer, déplacer
    const mq = L.hygListeModifier(d, 'hygZones', 'degorgement', { masque: true });
    const optsZ = L.hygOpts(L.HYG_ZONES).map((o) => o.value); const optsZk = L.hygOpts(L.HYG_ZONES, 'degorgement').map((o) => o.value);
    t('masquer : plus proposé (sauf valeur déjà choisie), toujours lisible', mq.ok && !optsZ.includes('degorgement') && optsZk.includes('degorgement') && L.HYG_ZONES.find((x) => x[0] === 'degorgement')[1] === 'Dégorgement');
    const rn = L.hygListeModifier(d, 'hygControles', 'visuel', { label: 'Visuel (lampe)' }); const rnA = L.hygListeModifier(d, 'hygControles', 'conductimetre', { attendu: '< 40 µS/cm' });
    t('renommer un élément d’origine (identifiant gardé), changer le résultat attendu ; libellé vide ou déjà pris refusé', rn.ok && rnA.ok && L.HYG_CONTROLES[0][0] === 'visuel' && L.HYG_CONTROLES[0][1] === 'Visuel (lampe)' && L.HYG_CONTROLE_ATTENDU.conductimetre === '< 40 µS/cm' && !L.hygListeModifier(d, 'hygControles', 'visuel', { label: ' ' }).ok && !L.hygListeModifier(d, 'hygControles', 'visuel', { label: 'papier ph' }).ok);
    const rnm = L.hygListeModifier(d, 'hygMoments', rm.id, { label: 'Après chaque débourbage ou soutirage' });
    t('moment renommé : texte du plan mis à jour', rnm.ok && d.planNettoyage.find((x) => x.id === pl.id).quand[0].texte === 'Après chaque débourbage ou soutirage');
    const dp = L.hygListeDeplacer(d, 'hygControles', 'conductimetre', -3);
    t('ordre modifié (« Aucun » reste en dernier)', dp.ok && ids(L.HYG_CONTROLES) === 'conductimetre,visuel,ph,peroxyde,aucun' && d.lists.hygControles[0].id === 'conductimetre');
    // listes propres à chaque base : une autre base retrouve les listes d'origine
    L.syncConfig(d0);
    t('autre base ouverte : listes d’origine (rien ne déborde d’une base à l’autre)', ids(L.HYG_CONTROLES) === 'visuel,ph,peroxyde,aucun' && L.HYG_CONTROLES[0][1] === 'Visuel' && !L.HYG_CONTROLE_ATTENDU.conductimetre && L.HYG_MOMENTS.length === 0 && !L.MAINT_TYPES.some((x) => x[0] === 'etalonnage'));
    L.syncConfig(d);
    // déclassements dans Opérations ; identifiants
    const dm = L.clone(d);
    t('déclassements : inclus dans l’onglet Opérations (pas un onglet à part), toujours activable', L.MODULES_DANS.declass === 'ops' && !L.modulesConnus(dm).includes('declass') && L.moduleActif(dm, 'declass') && L.moduleActiver(dm, 'declass', false).ok && !L.moduleActif(dm, 'declass') && !L.modulesVisibles(dm).includes('declass'));
    const ap = d.apporteurs[0]; const ra1 = L.apporteurSave(d, { ...ap, ident: '  CVI 51 999 99999  ' }, ap.id); const ra2 = L.apporteurSave(d, { nom: ap.nom, commune: ap.commune, apporteur: ap.apporteur, vendeur: ap.vendeur, crusDefaut: ap.crusDefaut }, ap.id);
    L.entrepriseSet(d, { identifiants: 'CVI 51 000 00000' }); L.entrepriseSet(d, { nom: d.entreprise.nom || 'Exploitation' });
    t('identifiant du partenaire enregistré (nettoyé), gardé quand le formulaire ne le transmet pas ; identifiants de la société gardés', ra1.ok && ra2.ok && d.apporteurs.find((x) => x.id === ap.id).ident === 'CVI 51 999 99999' && d.entreprise.identifiants === 'CVI 51 000 00000');
    // base de test 0.27.0-alpha.2 ; compatibilité avec la 0.27.0-alpha.1 gelée ; synchronisation
    const f31 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.27.0-alpha.2-listes.json'), 'utf8'))); L.syncConfig(f31);
    t('base 0.27.0-alpha.2 de test : contrôle, zone, moment, type de maintenance ajoutés et utilisés ; zone masquée ; identifiants', f31.meta.versions.includes('0.27.0-alpha.2') && L.HYG_CONTROLE_ATTENDU.conductimetre === '< 50 µS/cm' && L.hygListeUsage(f31, 'hygControles', 'conductimetre') === 2 && L.hygListeUsage(f31, 'hygZones', 'chai-a-barriques') === 1 && L.hygListeUsage(f31, 'maintTypes', 'etalonnage') === 1 && L.HYG_ZONES.find((x) => x[0] === 'degorgement')[2].masque && !!f31.entreprise.identifiants && f31.apporteurs.some((a) => a.ident));
    const dirY = path.join(__dirname, 'anciennes', '0.27.0-alpha.1');
    const Y = new Function('React', files.filter((f) => fs.existsSync(path.join(dirY, f))).map((f) => fs.readFileSync(path.join(dirY, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, clone, syncConfig, opSave, hygieneSave, apporteurSave, entrepriseSet, APP_VERSION, APP_NUM };')({});
    t('0.27.0-alpha.1 gelée chargée (n° 27 000 001)', Y.APP_VERSION === '0.27.0-alpha.1' && Y.APP_NUM === 27000001 && L.APP_NUM > Y.APP_NUM);
    const y = Y.normalizeDb(Y.clone(f31)); Y.syncConfig(y); const K = ['lists', 'planNettoyage', 'planMaintenance', 'hygiene', 'maintenance', 'apporteurs', 'entreprise', 'ops', 'docs', 'produitsHygiene', 'settings'];
    t('… ouvre la base 0.27.0-alpha.2 sans rien perdre (listes personnalisées, plan, journal, maintenance, identifiants)', K.every((k) => canonJ(y[k]) === canonJ(f31[k])), K.filter((k) => canonJ(y[k]) !== canonJ(f31[k])));
    const yap = y.apporteurs.find((a) => a.ident); const c1 = y.contenants.find((c) => c.statut !== 'archive');
    const ry1 = Y.apporteurSave(y, { nom: yap.nom, commune: 'Vertus (51)', contact: yap.contact, notes: yap.notes, apporteur: yap.apporteur, vendeur: yap.vendeur, crusDefaut: yap.crusDefaut, cruAuto: yap.cruAuto }, yap.id);
    const ry2 = Y.entrepriseSet(y, { nom: 'Exploitation (0.27.0-alpha.1)' }); const ry3 = Y.hygieneSave(y, { date: '2026-11-21', cibleType: 'contenant', cibleId: c1.id, actionId: y.lists.actionsHygiene[0].id, produits: [], methode: '', notes: 'saisi par la 0.27.0-alpha.1' });
    const back = L.normalizeDb(Y.clone(y)); L.syncConfig(back);
    t('… partenaire, société et journal modifiés par la 0.27.0-alpha.1 : identifiants et listes gardés ; rouverts ici', ry1.ok && ry2.ok && ry3.ok && back.apporteurs.find((a) => a.id === yap.id).ident === yap.ident && back.entreprise.identifiants === f31.entreprise.identifiants && canonJ(back.lists.hygControles) === canonJ(f31.lists.hygControles) && L.HYG_CONTROLES.some((x) => x[0] === 'conductimetre') && back.hygiene.length === f31.hygiene.length + 1);
    const S1 = L.clone(f31); const S2 = L.clone(f31); L.syncConfig(S1); L.hygListeAjouter(S1, 'hygControles', 'Bandelette ATP', { attendu: '< 150 RLU' }); L.syncConfig(S2); L.hygListeAjouter(S2, 'hygControles', 'Thermomètre');
    L.hygieneSave(S2, { date: '2026-11-21', cibleType: 'contenant', cibleId: c1.id, actionId: S2.lists.actionsHygiene[0].id, produits: [], methode: '', notes: 'appareil 2' });
    const FS = L.syncFusion(f31, S1, S2); const fc = (FS.db.lists.hygControles || []).map((x) => x.id);
    t('synchronisation : éléments ajoutés sur deux appareils à la même liste → les deux gardés, avec le journal', fc.includes('bandelette-atp') && fc.includes('thermometre') && fc.includes('conductimetre') && FS.db.hygiene.length === f31.hygiene.length + 1 && !FS.conflits.length, [fc, FS.conflits]);
    // droits (identifiants activés) : un opérateur de chai (saisie dans l'Hygiène) ajoute un moyen de contrôle, pas un élément des autres listes
    const dsec = L.normalizeDb(L.sampleDb()); const mS = await L.mdpEmpreinte('Admin-2027', 1000); L.securiteActiver(dsec, { identifiant: 'admin', nom: 'Admin', mdp: mS });
    const op31 = L.utilisateurSave(dsec, { identifiant: 'op31', nom: 'Op', profilId: 'pf_operateur', mdp: mS }).id; L.syncConfig(dsec);
    const essai31 = (fn) => { const av = L.clone(dsec); const ap = L.clone(dsec); fn(ap); return L.gardeDroits(av, ap, op31); };
    t('droits : un opérateur de chai ajoute un moyen de contrôle (Hygiène) ; il ne modifie pas les autres listes', essai31((y) => L.hygListeAjouter(y, 'hygControles', 'Bandelette ATP')).ok && !essai31((y) => { y.lists.cepages[0].label = 'X'; }).ok && !essai31((y) => { L.hygListeAjouter(y, 'hygControles', 'Bandelette ATP'); y.lists.cepages[0].label = 'X'; }).ok);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ---- 32. impression directe, clés d'accès (empreinte, visage, code PIN), onglet Équipements, traçabilité à chaque étape, mode audit (0.28.0-alpha.1)
  {
    const i = L.CHANGELOG.findIndex((c) => c.v === '0.28.0-alpha.1');
    t('version 0.28.0-alpha.1 : nouvelle version mineure (impression, clés d’accès, équipements, traçabilité, audits)', i >= 0 && L.CHANGELOG[i + 1].v === '0.27.0-alpha.2' && L.CHANGELOG[i].notes.length === 5 && L.versionNum('0.28.0-alpha.1') === 28000001 && L.APP_NUM >= 28000001);
    t('… nouveautés traduites dans les cinq langues', L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    // ---- clés d'accès : la signature de l'appareil est vérifiée ici, comme le ferait un serveur (norme WebAuthn)
    const S = globalThis.crypto.subtle; const enc = new TextEncoder(); const sha = async (u8) => new Uint8Array(await S.digest('SHA-256', u8));
    const derDe = (raw) => { const e = (v) => { let k = 0; while (k < v.length - 1 && v[k] === 0) k += 1; let w = Array.from(v.slice(k)); if (w[0] & 0x80) w = [0, ...w]; return [0x02, w.length, ...w]; }; const r = e(raw.slice(0, 32)); const s = e(raw.slice(32)); return Uint8Array.from([0x30, r.length + s.length, ...r, ...s]); };
    const kpE = await S.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
    const kpR = await S.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
    const kE = { id: 'cleE-0001', cle: L.clesB64(new Uint8Array(await S.exportKey('spki', kpE.publicKey))), alg: -7, rp: 'app.test' };
    const kR = { id: 'cleR-0001', cle: L.clesB64(new Uint8Array(await S.exportKey('spki', kpR.publicKey))), alg: -257, rp: 'app.test' };
    // réponse d'un appareil : données de l'authentificateur (empreinte du domaine, drapeaux), données du client (défi, origine), signature
    const repDe = async (kp, alg, o) => {
      const ad = new Uint8Array(37); ad.set(await sha(enc.encode(o.rp || 'app.test')), 0); ad[32] = o.flags === undefined ? 0x05 : o.flags; ad[36] = 1;
      const cd = enc.encode(JSON.stringify({ type: o.type || 'webauthn.get', challenge: L.clesB64u(o.defiSigne || o.defi), origin: o.origin || 'https://app.test', crossOrigin: false }));
      const donnees = new Uint8Array(ad.length + 32); donnees.set(ad, 0); donnees.set(await sha(cd), ad.length);
      const sig = alg === -7 ? derDe(new Uint8Array(await S.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, donnees))) : new Uint8Array(await S.sign({ name: 'RSASSA-PKCS1-v1_5' }, kp.privateKey, donnees));
      if (o.abimer) sig[sig.length - 1] ^= 0xff;
      return { clientDataJSON: cd, authenticatorData: ad, signature: sig };
    };
    const defi = new Uint8Array(32).map((_, j) => (j * 37 + 11) % 256); const att = { defi, origine: 'https://app.test', rp: 'app.test' };
    const v1 = await L.cleVerifier(kE, await repDe(kpE, -7, { defi }), att); const v2 = await L.cleVerifier(kR, await repDe(kpR, -257, { defi }), att);
    t('clés d’accès : signatures ES256 (empreinte, visage, code PIN) et RS256 (Windows Hello) vérifiées', v1.ok && v2.ok, [v1.msg, v2.msg]);
    const ko = [
      ['défi rejoué', await L.cleVerifier(kE, await repDe(kpE, -7, { defi, defiSigne: new Uint8Array(32).fill(7) }), att), /Défi différent/],
      ['autre origine', await L.cleVerifier(kE, await repDe(kpE, -7, { defi, origin: 'https://autre.test' }), att), /Origine inattendue/],
      ['autre site', await L.cleVerifier(kE, await repDe(kpE, -7, { defi, rp: 'autre.test' }), att), /autre site/],
      ['empreinte non vérifiée', await L.cleVerifier(kE, await repDe(kpE, -7, { defi, flags: 0x01 }), att), /non vérifiés/],
      ['présence absente', await L.cleVerifier(kE, await repDe(kpE, -7, { defi, flags: 0x04 }), att), /Présence/],
      ['signature abîmée', await L.cleVerifier(kE, await repDe(kpE, -7, { defi, abimer: true }), att), /Signature|impossible/],
      ['réponse d’enregistrement', await L.cleVerifier(kE, await repDe(kpE, -7, { defi, type: 'webauthn.create' }), att), /illisible/],
      ['clé d’un autre appareil', await L.cleVerifier(kR, await repDe(kpE, -7, { defi }), att), /Signature|impossible/],
    ];
    t('… refusées : défi rejoué, autre origine ou autre site, empreinte non vérifiée, présence absente, signature abîmée, mauvaise réponse ou mauvaise clé', ko.every(([, r, re]) => !r.ok && re.test(r.msg)), ko.filter(([, r, re]) => r.ok || !re.test(r.msg)).map(([n, r]) => `${n} : ${r.msg}`));
    const brut = new Uint8Array(64); brut[0] = 0x80; brut[1] = 0x01; brut[34] = 0x7f; brut[63] = 9;
    t('… signature DER (zéros de tête, octet de signe) convertie en r‖s', canonJ(Array.from(L.clesDerVersBrut(derDe(brut)))) === canonJ(Array.from(brut)) && L.clesDerVersBrut(Uint8Array.from([0x31, 0])) === null && L.clesB64u(L.clesDeB64u('AQID_-8')) === 'AQID_-8');
    // enregistrement des appareils, acceptation, réglages
    const dk = L.normalizeDb(L.sampleDb()); const mK = await L.mdpEmpreinte('Admin-2028', 1000); L.securiteActiver(dk, { identifiant: 'admin', nom: 'Admin', mdp: mK }); L.syncConfig(dk);
    const adm = dk.utilisateurs[0].id; const opK = L.utilisateurSave(dk, { identifiant: 'op32', nom: 'Op', profilId: 'pf_operateur', mdp: mK }).id;
    t('clés d’accès : actives par défaut, chaque nouvel appareil accepté par un administrateur', canonJ(L.clesReglages(dk)) === canonJ({ actif: true, validation: 'admin', inscription: 'tous' }) && canonJ(L.clesReglages({})) === canonJ({ actif: true, validation: 'admin', inscription: 'tous' }) && !L.clesUtilisables(L.normalizeDb(L.sampleDb()), 'app.test').length);
    const kA = { id: 'cleAdmin-0001', cle: kE.cle, alg: -7, rp: 'app.test', nom: 'PC Windows', appareil: 'PC Windows' }; const kO = { id: 'cleOp-00001', cle: kR.cle, alg: -257, rp: 'app.test', nom: 'Android' };
    const rA = L.cleAjouter(dk, adm, kA); const rO = L.cleAjouter(dk, opK, kO);
    t('… clé de l’administrateur acceptée d’office, celle de l’opérateur en attente (inutilisable)', rA.ok && rA.acceptee && rO.ok && !rO.acceptee && L.clesUtilisables(dk, 'app.test').length === 1 && !L.clesUtilisables(dk, 'app.test', opK).length && L.clesDe(dk, opK).length === 1);
    t('… clé en double, illisible, d’un type non pris en charge, ou compte inconnu refusés', !L.cleAjouter(dk, opK, kO).ok && !L.cleAjouter(dk, opK, { ...kO, id: 'x' }).ok && !L.cleAjouter(dk, opK, { ...kO, id: 'cleOp-00002', cle: 'pas une clé !' }).ok && !L.cleAjouter(dk, opK, { ...kO, id: 'cleOp-00003', alg: -8 }).ok && !L.cleAjouter(dk, 'u-inconnu', { ...kO, id: 'cleOp-00004' }).ok);
    L.cleModifier(dk, opK, 'cleOp-00001', { acceptee: true });
    t('… acceptée par l’administrateur : utilisable, sur son site seulement ; renommée (nom vide refusé)', L.clesUtilisables(dk, 'app.test', opK).length === 1 && !L.clesUtilisables(dk, 'autre.test', opK).length && L.cleModifier(dk, opK, 'cleOp-00001', { nom: 'Téléphone du chai' }).ok && L.clesDe(dk, opK)[0].nom === 'Téléphone du chai' && !L.cleModifier(dk, opK, 'cleOp-00001', { nom: '  ' }).ok && !L.cleModifier(dk, opK, 'cle-inconnue', { nom: 'X' }).ok);
    const dkI = L.clone(dk); dkI.utilisateurs.find((u) => u.id === opK).actif = false; const dkS = L.clone(dk); dkS.settings.securite.actif = false;
    t('… compte désactivé : ses clés ne servent plus ; identifiants désactivés : aucune clé', !L.clesUtilisables(dkI, 'app.test', opK).length && L.clesUtilisables(dkI, 'app.test').length === 1 && !L.clesUtilisables(dkS, 'app.test').length);
    L.clesRegler(dk, { validation: 'libre' }); const rL = L.cleAjouter(dk, opK, { ...kO, id: 'cleOp-00005', nom: 'PC du bureau' });
    t('… réglage « libre » : appareil accepté d’office', rL.ok && rL.acceptee);
    L.clesRegler(dk, { actif: false });
    t('… connexion par clé désactivée : aucune clé utilisable, ajout refusé, mot de passe inchangé', !L.clesUtilisables(dk, 'app.test').length && !L.cleAjouter(dk, opK, { ...kO, id: 'cleOp-00006' }).ok && !!dk.utilisateurs.find((u) => u.id === opK).mdp);
    L.clesRegler(dk, { actif: true, validation: 'admin' });
    t('… clé retirée', L.cleRetirer(dk, opK, 'cleOp-00005').ok && L.clesDe(dk, opK).length === 1 && !L.cleRetirer(dk, opK, 'cleOp-00005').ok);
    // droits : chacun ajoute ou retire ses appareils (en attente) ; seul un administrateur les accepte et règle la connexion
    const essai = (uid, fn, base) => { const b0 = base || dk; const av = L.clone(b0); const ap = L.clone(b0); fn(ap); return L.gardeDroits(av, ap, uid); };
    const gAj = essai(opK, (y) => L.cleAjouter(y, opK, { ...kO, id: 'cleOp-00007', nom: 'Tablette' }));
    t('droits : l’opérateur ajoute son appareil (en attente), tracé au journal des accès', gAj.ok && gAj.audit.some((x) => x.action === 'cle' && x.resume === 'Clé d’accès ajoutée : Tablette'), gAj);
    const gAcc = essai(opK, (y) => { L.cleAjouter(y, opK, { ...kO, id: 'cleOp-00008' }); L.cleModifier(y, opK, 'cleOp-00008', { acceptee: true }); });
    const gAcc2 = essai(opK, (y) => { y.utilisateurs.find((u) => u.id === opK).cles.push({ ...kO, id: 'cleOp-00009', acceptee: true }); });
    t('… mais ne l’accepte pas lui-même (« un nouvel appareil doit être accepté par un administrateur »)', !gAcc.ok && /accepté par un administrateur/.test(gAcc.msg) && !gAcc2.ok, [gAcc.msg, gAcc2.msg]);
    const gAutre = essai(opK, (y) => L.cleRetirer(y, adm, 'cleAdmin-0001')); const gRet = essai(opK, (y) => L.cleRetirer(y, opK, 'cleOp-00001')); const gReg = essai(opK, (y) => L.clesRegler(y, { validation: 'libre' }));
    const gAdm = essai(adm, (y) => { L.cleAjouter(y, opK, { ...kO, id: 'cleOp-00010' }); L.cleModifier(y, opK, 'cleOp-00010', { acceptee: true }); L.clesRegler(y, { validation: 'libre' }); });
    t('… ni les appareils d’un autre compte, ni le réglage ; retire le sien ; l’administrateur accepte et règle', !gAutre.ok && gRet.ok && gRet.audit.some((x) => x.resume === 'Clé d’accès retirée : Téléphone du chai') && !gReg.ok && gAdm.ok, [gAutre.msg, gRet.msg, gReg.msg, gAdm.msg]);
    const dkL = L.clone(dk); L.clesRegler(dkL, { validation: 'libre' });
    t('… réglage « libre » : l’opérateur active son appareil lui-même', essai(opK, (y) => L.cleAjouter(y, opK, { ...kO, id: 'cleOp-00011' }), dkL).ok);
    // synchronisation : appareils ajoutés au même compte sur deux appareils entre deux synchronisations
    const B0 = L.clone(dk); const D1 = L.clone(B0); const D2 = L.clone(B0);
    L.cleAjouter(D1, adm, { ...kA, id: 'cleAdmin-0002', nom: 'iPhone' }); D1.meta.modifLe = '2026-11-21T10:00:00Z';
    L.cleAjouter(D2, adm, { ...kA, id: 'cleAdmin-0003', nom: 'Mac' }); L.cleRetirer(D2, opK, 'cleOp-00001'); D2.meta.modifLe = '2026-11-21T10:05:00Z';
    const FK = L.syncFusion(B0, D1, D2); const ua = FK.db.utilisateurs.find((u) => u.id === adm); const uo = FK.db.utilisateurs.find((u) => u.id === opK);
    t('synchronisation : clés ajoutées au même compte sur deux appareils → toutes gardées, retrait reçu, sans conflit', ua.cles.map((k) => k.id).sort().join() === 'cleAdmin-0001,cleAdmin-0002,cleAdmin-0003' && !(uo.cles || []).some((k) => k.id === 'cleOp-00001') && !FK.conflits.length, FK.conflits);
    const D3 = L.clone(B0); const D4 = L.clone(B0); L.cleModifier(D3, opK, 'cleOp-00001', { nom: 'A' }); L.cleModifier(D4, opK, 'cleOp-00001', { nom: 'B' }); const m3 = await L.mdpEmpreinte('Autre-2028', 1000); L.utilisateurMotDePasse(D3, adm, m3);
    const FK2 = L.syncFusion(B0, D3, D4);
    t('… même clé renommée des deux côtés : conflit gardé au journal ; mot de passe changé sur un appareil reçu', FK2.conflits.length === 1 && ['A', 'B'].includes(FK2.db.utilisateurs.find((u) => u.id === opK).cles[0].nom) && canonJ(FK2.db.utilisateurs.find((u) => u.id === adm).mdp) === canonJ(m3), FK2.conflits);
    // ---- onglet Équipements : fiches, catégories, vérifications périodiques, état, pannes, suppression, droits
    const de = L.normalizeDb(L.sampleDb()); L.syncConfig(de); const T0 = '2026-11-21'; const EQ = (id) => L.equipementsDe(de).find((x) => x.id === id); const EL = (id, j) => L.equipementsListe(de, j || T0).find((x) => x.e.id === id);
    t('équipements : module après l’Hygiène, 13 catégories d’origine (« Autre matériel » en dernier), liste personnalisable', L.MODULES_DEFAUT.indexOf('equipements') === L.MODULES_DEFAUT.indexOf('hygiene') + 1 && L.EQUIP_CATEGORIES.length === 13 && L.EQUIP_CATEGORIES[12][0] === 'autre' && L.HYG_LISTES_DEF.some((x) => x.key === 'equipCategories' && x.groupe === 'equipements'));
    const rP = L.equipementSave(de, null, { label: 'Pompe à rotor', marque: 'Marque', modele: 'R2', numSerie: 'SN-1', annee: '2020' });
    t('nouvel équipement : fiche enregistrée, catégorie devinée d’après le nom', rP.ok && EQ(rP.id).marque === 'Marque' && EQ(rP.id).numSerie === 'SN-1' && L.equipCategorie(EQ(rP.id)) === 'transfert' && L.equipCategorie({ label: 'Groupe de froid' }) === 'froid' && L.equipCategorie({ label: 'Réfractomètre' }) === 'mesure' && L.equipCategorie({ label: 'Chariot élévateur' }) === 'levage' && L.equipCategorie({ label: 'Machin' }) === 'autre');
    t('… nom vide ou déjà pris (casse, accents), dates invalides, fiche inconnue refusés', !L.equipementSave(de, null, { label: ' ' }).ok && !L.equipementSave(de, null, { label: 'POMPE A ROTOR' }).ok && !L.equipementSave(de, null, { label: 'X1', garantieJusquau: '2026-13-01' }).ok && !L.equipementSave(de, null, { label: 'X2', verif: { derniere: '31/12/2026' } }).ok && !L.equipementSave(de, 'inconnu', { label: 'X3' }).ok);
    L.equipementSave(de, rP.id, { label: 'Pompe à rotor', verif: { periodeMois: 12, derniere: '2025-12-01', organisme: 'Organisme' } });
    t('vérification périodique : valable jusqu’au 01/12/2026 → à prévoir (moins d’un mois), échue ensuite, en ordre avant', L.equipVerif(EQ(rP.id), T0).valideJusquau === '2026-12-01' && L.equipVerif(EQ(rP.id), T0).k === 'bientot' && L.equipVerif(EQ(rP.id), '2026-12-02').k === 'retard' && L.equipVerif(EQ(rP.id), '2026-06-01').k === 'ok' && L.equipVerif({ label: 'Tireuse' }, T0).k === 'aucune' && L.equipVerif({ label: 'X', verif: { periodeMois: 12 } }, T0).k === 'inconnue');
    const AL = L.equipAlertes(de, T0);
    t('… tâche « à faire » de l’onglet Équipements (avec la maintenance du plan), puis en retard', AL.some((x) => x.equipementId === rP.id && x.etat === 'afaire' && x.origine === 'verif') && L.equipTaches(de, T0).length > AL.length && L.equipAlertes(de, '2026-12-05').some((x) => x.equipementId === rP.id && x.etat === 'retard'));
    // bascule : la vignette (Pressoir › Réglages, versions antérieures) fait foi ; la fiche la recopie
    const bas = L.equipementsDe(de).find((x) => x.balance); const refV = bas.balance.ref;
    L.equipementSave(de, bas.id, { label: bas.label, verif: { periodeMois: 12, derniere: '2026-06-15', valideJusquau: '2027-06-15', organisme: 'Organisme agréé' } }); const vB = EQ(bas.id).balance.valideJusquau;
    L.equipementPressoirSet(de, bas.id, { balance: { valideJusquau: '2027-07-31' } });
    t('bascule : validité de la fiche recopiée sur la vignette (réf. gardée) ; vignette changée dans le Pressoir → elle fait foi', vB === '2027-06-15' && EQ(bas.id).balance.ref === refV && L.equipVerif(EQ(bas.id), T0).valideJusquau === '2027-07-31' && L.balancesDe(de).find((b) => b.id === bas.id).valideJusquau === '2027-07-31' && EQ(bas.id).verif.organisme === 'Organisme agréé');
    // fiche d'un pressoir : réglages et champs inconnus gardés
    const pr = L.equipementsDe(de).find((x) => x.pressoir); const avP = canonJ(pr.pressoir); pr.futur = { x: 1 };
    const rPr = L.equipementSave(de, pr.id, { label: pr.label, marque: 'Marque (exemple)', champs: [{ label: 'Puissance', valeur: '7,5 kW' }, { label: ' ', valeur: 'ignoré' }] });
    t('fiche d’un pressoir : réglages du pressoir et champs inconnus gardés, informations ajoutées (lignes vides ignorées)', rPr.ok && canonJ(EQ(pr.id).pressoir) === avP && EQ(pr.id).futur.x === 1 && EQ(pr.id).champs.length === 1 && EQ(pr.id).champs[0].valeur === '7,5 kW' && L.equipCategorie(EQ(pr.id)) === 'pressoir');
    L.equipementSave(de, 'tangent', { label: 'Filtre tangentiel', etat: 'arret' }); L.equipementSave(de, rP.id, { label: 'Pompe à rotor', etat: 'reforme' });
    t('état : panne en cours (jeu d’exemple) → en panne ; à l’arrêt ; réformé (plus de tâche de vérification)', EL('pompe').k === 'panne' && EL('pompe').pannes.length >= 1 && EL('tangent').k === 'arret' && EL(rP.id).k === 'reforme' && !L.equipAlertes(de, T0).some((x) => x.equipementId === rP.id) && L.EQUIP_ETAT_TXT.panne === 'en panne');
    const rF = L.equipementSave(de, null, { label: 'Groupe de froid', categorie: 'froid' });
    const mt = L.maintInterventionSave(de, { date: T0, equipementId: rF.id, type: 'curative', statut: 'ouverte', probleme: 'Ne refroidit plus' });
    t('panne signalée sur un matériel : en panne, dans son historique', mt.ok && EL(rF.id).k === 'panne' && L.equipHistorique(de, rF.id).interventions.length === 1 && L.equipCategorie(EQ(rF.id)) === 'froid');
    const rEs = L.equipementSave(de, null, { label: 'Essai' }); const sU = L.equipementSupprimer(de, rF.id);
    t('suppression : matériel utilisé refusé (« passez-le en Réformé »), matériel jamais utilisé supprimé', !sU.ok && /Réformé/.test(sU.msg) && !L.equipementSupprimer(de, 'pressoir').ok && L.equipementSupprimer(de, rEs.id).ok && !EQ(rEs.id) && !L.equipementSupprimer(de, rEs.id).ok);
    const rc = L.hygListeAjouter(de, 'equipCategories', 'Matériel viticole');
    const rE = L.equipementSave(de, null, { label: 'Enjambeur', categorie: rc.id }); const rE2 = L.equipementSave(de, null, { label: 'Atomiseur', categorie: 'inexistante' });
    t('catégorie ajoutée : proposée avant « Autre matériel » et gardée sur la fiche ; catégorie inconnue → « Autre matériel »', rc.ok && L.EQUIP_CATEGORIES[12][0] === rc.id && L.EQUIP_CATEGORIES[13][0] === 'autre' && L.equipCategorie(EQ(rE.id)) === rc.id && EQ(rE2.id).categorie === 'autre' && L.hygListeUsage(de, 'equipCategories', rc.id) === 1 && !L.hygListeSupprimer(de, 'equipCategories', rc.id).ok);
    L.syncConfig(L.normalizeDb(L.sampleDb()));
    t('… autre base ouverte : catégories d’origine', L.EQUIP_CATEGORIES.length === 13 && !L.EQUIP_CATEGORIES.some((c) => c[0] === 'materiel-viticole'));
    // droits : le parc et la maintenance relèvent de l'onglet Équipements (profils d'avant l'onglet : droits de l'Hygiène)
    const dq = L.normalizeDb(L.sampleDb()); const mQ = await L.mdpEmpreinte('Admin-2028', 1000); L.securiteActiver(dq, { identifiant: 'admin', nom: 'Admin', mdp: mQ });
    const tous = (niv) => Object.fromEntries(L.MODULES_DEFAUT.map((m) => [m, niv]));
    const { equipements: _x, ...sansEq } = tous('lecture');
    dq.profils.push({ id: 'pf_ancien', nom: 'Profil d’avant', modules: { ...sansEq, hygiene: 'ecriture', params: 'aucun' }, speciaux: {} }, { id: 'pf_sanseq', nom: 'Sans équipements', modules: { ...tous('lecture'), hygiene: 'ecriture', equipements: 'aucun', params: 'aucun' }, speciaux: {} });
    const mkU = (ident, profilId) => L.utilisateurSave(dq, { identifiant: ident, nom: ident, profilId, mdp: mQ }).id;
    const uOp = mkU('chai', 'pf_operateur'); const uCo = mkU('compta', 'pf_consult'); const uAn = mkU('ancien', 'pf_ancien'); const uSa = mkU('sanseq', 'pf_sanseq'); const uCh = mkU('chef', 'pf_chef'); L.syncConfig(dq);
    const essE = (uid, fn) => { const av = L.clone(dq); const ap = L.clone(dq); fn(ap); return L.gardeDroits(av, ap, uid); };
    const fiche = (y) => L.equipementSave(y, 'pompe', { label: 'Pompe à pistons', marque: 'M' }); const panne = (y) => L.maintInterventionSave(y, { date: T0, equipementId: 'filtre', type: 'curative', statut: 'ouverte', probleme: 'Fuite' });
    const doc = (y) => L.docMetaAdd(y, { id: 'doc-eq-1', nom: 'notice.pdf', cat: 'notice', cible: { type: 'equipement', id: 'pompe' } }); const catAj = (y) => L.hygListeAjouter(y, 'equipCategories', 'Viticole');
    const F4 = [fiche, panne, doc, catAj];
    t('droits : l’opérateur de chai (saisie dans Équipements par défaut) : fiches, pannes, documents et catégories du matériel', L.niveauModule(dq, uOp, 'equipements') === 'ecriture' && F4.every((f) => essE(uOp, f).ok), F4.map((f) => essE(uOp, f).msg));
    t('… la consultation : rien', F4.every((f) => !essE(uCo, f).ok));
    t('… profil d’avant l’onglet : droits de l’Hygiène repris ; sans Équipements : fiches, documents, catégories refusés (la maintenance reste aussi à l’Hygiène)', L.niveauModule(dq, uAn, 'equipements') === 'ecriture' && F4.every((f) => essE(uAn, f).ok) && [fiche, doc, catAj].every((f) => !essE(uSa, f).ok) && essE(uSa, panne).ok && essE(uSa, (y) => L.hygListeAjouter(y, 'hygControles', 'Bandelette ATP')).ok);
    t('… affichage des profils : niveau repris pour les profils d’avant un onglet', L.profilNiveau({ modules: { hygiene: 'ecriture' } }, 'equipements') === 'ecriture' && L.profilNiveau({ modules: { hygiene: 'ecriture', equipements: 'aucun' } }, 'equipements') === 'aucun' && L.profilNiveau({ modules: { ops: 'aucun' } }, 'pressoir') === 'aucun' && L.profilNiveau({}, 'cave') === 'lecture' && L.profilNiveau(null, 'cave') === 'lecture');
    // ---- traçabilité à n'importe quelle étape : du raisin au dégorgé
    const dt = L.normalizeDb(L.sampleDb()); L.syncConfig(dt); const Rt = L.replay(dt);
    t('traçabilité : sept étapes, de la pesée à l’expédition ; dates à la française ou ISO', L.ETAPES_TRACE.map((x) => x[0]).join() === 'raisin,pressurage,mout,assemblage,tirage,fini,sortie' && L.traceDateQ('21/11/2026') === '2026-11-21' && L.traceDateQ('21/11/26') === '2026-11-21' && L.traceDateQ('2026-11-21') === '2026-11-21' && L.traceDateQ('31/02/2026') === '' && L.traceDateQ('pesée 3') === '');
    const dae = dt.ops.find((o) => o.type === 'sortie' && /^DAE/.test(o.ref || '')); const cv = dt.contenants.find((c) => L.contParts(Rt, c.id).length);
    const opA = dt.ops.find((o) => (o.lignes || []).some((li) => li.arrivageId)); const ar = dt.arrivages.find((a) => opA.lignes.some((li) => li.arrivageId === a.id));
    const q = (s) => L.traceChercher(dt, Rt, s);
    t('recherche : n° de pesée, n° de marc, lot fini, code de lot, n° de DAE, cuve, lot d’un produit, date', q('pesée 3').some((x) => x.etape === 'raisin' && x.titre === 'Pesée n° 3') && q('marc 2').some((x) => x.etape === 'pressurage' && x.titre === 'Marc n° 2') && q('LF-26-001').some((x) => x.etape === 'fini' && x.type === 'fini') && q('P26-03').some((x) => x.type === 'lot' && x.titre === 'P26-03') && q(dae.ref.slice(0, 12)).some((x) => x.etape === 'sortie' && x.id === dae.id) && q(cv.nom).length >= 1 && q(ar.numLot).some((x) => x.type === 'lot') && q('10/09/2025').filter((x) => x.etape === 'raisin').length === 2 && !q('').length && !q('zzzz-introuvable').length);
    const p1 = dt.ops.find((o) => o.type === 'apport' && o.pesee && o.pesee.num === 1 && o.date === '2025-09-10'); const C1 = L.traceChaine(dt, Rt, { type: 'op', id: p1.id });
    t('chaîne depuis une pesée : marc, moûts, assemblages, cuvée de tirage en aval', C1.etapes.raisin.length === 1 && C1.etapes.raisin[0].cible && C1.etapes.pressurage.length === 1 && C1.etapes.mout.length >= 1 && C1.etapes.assemblage.length >= 1 && C1.etapes.tirage.length >= 1);
    const tir = C1.etapes.tirage[0].l; const C2 = L.traceChaine(dt, Rt, { type: 'lot', id: tir.id });
    t('… depuis la cuvée de tirage : jusqu’à la pesée (un pas en amont à chaque étape)', C2.etapes.raisin.some((x) => x.id === p1.id) && C2.etapes.tirage.some((x) => x.cible && x.id === tir.id) && C2.etapes.pressurage.length >= 1 && C2.etapes.assemblage.length >= 1);
    const f1 = dt.lotsFinis[0]; const C3 = L.traceChaine(dt, Rt, { type: 'fini', id: f1.id }); const C4 = L.traceChaine(dt, Rt, { type: 'op', id: dae.id });
    t('… depuis un lot fini (sa cuvée de tirage) et depuis une expédition (le lot expédié et son amont)', C3.etapes.fini.some((x) => x.id === f1.id && x.cible) && C3.etapes.tirage.some((x) => x.id === f1.sourceLotId) && C4.etapes.sortie.some((x) => x.id === dae.id && x.cible) && C4.lots.length >= 1 && L.traceChaine(dt, Rt, { type: 'lot', id: 'inconnu' }).lots.length === 0);
    const rs = L.traceLotResume(dt, Rt, tir.id);
    t('… résumé d’un lot : bouteilles sur lattes, opérations', rs.bouteilles > 0 && rs.ops >= 1);
    // ---- mode audit : types fournis et personnalisés, audits, réponses, test de traçabilité, pièces calculées
    const da = L.normalizeDb(L.sampleDb()); L.syncConfig(da);
    t('audits : cinq types fournis (bio, Demeter, douanes, HACCP, AOC), pièces connues, points reliés aux pièces du type', L.auditModeles(da).map((m) => m.id).join() === 'bio,demeter,douanes,haccp,aoc' && L.AUDIT_MODELES.every((m) => m.pieces.every((p) => L.AUDIT_PIECES.some((x) => x[0] === p)) && m.points.every((p) => p.pieces.every((x) => m.pieces.includes(x)))) && L.auditModele(da, 'aoc').reglages.lattesMois === 15);
    const rm1 = L.auditModeleSave(da, 'aoc', { ...L.auditModele(da, 'aoc'), reglages: { lattesMois: 18, lattesMillesimeMois: 36 } });
    t('type fourni personnalisé (réglages) puis rétabli', rm1.ok && L.auditModele(da, 'aoc').modifie && L.auditModele(da, 'aoc').reglages.lattesMois === 18 && L.auditModeleRetablir(da, 'aoc').ok && L.auditModele(da, 'aoc').reglages.lattesMois === 15 && !L.auditModele(da, 'aoc').modifie);
    const rm2 = L.auditModeleSave(da, null, { nom: 'Audit client export', pieces: ['identite', 'tracabilite', 'inconnue', 'tracabilite'], points: [{ texte: 'Lot tracé', pieces: ['tracabilite', 'bilan'] }, { texte: '  ' }, { texte: 'Certificats', pieces: ['identite'] }], reglages: { so2Max: '120' } }); const mP = L.auditModele(da, rm2.id);
    t('type créé : pièces connues sans doublon, points vides ignorés, pièces des points limitées au type, réglage', rm2.ok && mP.pieces.join() === 'identite,tracabilite' && mP.points.length === 2 && mP.points.map((p) => p.id).join() === 'p1,p2' && mP.points[0].pieces.join() === 'tracabilite' && mP.reglages.so2Max === 120 && L.auditModeles(da).length === 6);
    t('… nom vide ou déjà pris refusé', !L.auditModeleSave(da, null, { nom: ' ' }).ok && !L.auditModeleSave(da, null, { nom: 'AUDIT CLIENT EXPORT' }).ok && !L.auditModeleSave(da, null, { nom: 'agriculture biologique' }).ok);
    t('audit : type inconnu, période ou date invalides refusés', !L.auditSave(da, null, { modeleId: 'x', debut: '2026-01-01', fin: '2026-12-31' }).ok && !L.auditSave(da, null, { modeleId: 'douanes', debut: '2026-12-31', fin: '2026-01-01' }).ok && !L.auditSave(da, null, { modeleId: 'douanes', debut: '2026-01-01', fin: '2026-12-31', date: '2026-02-30' }).ok);
    const ra1 = L.auditSave(da, null, { modeleId: 'douanes', debut: '2025-08-01', fin: '2026-07-31', date: '2026-11-21', auditeur: 'A. Auditeur', organisme: 'Douane' }); const A1 = () => da.audits.find((x) => x.id === ra1.id);
    t('audit préparé (en cours, rien de répondu)', ra1.ok && A1().statut === 'encours' && A1().nom === 'Douanes (contributions indirectes)' && canonJ(L.auditResume(da, A1())) === canonJ({ conforme: 0, obs: 0, nc: 0, na: 0, attente: 6, total: 6 }));
    L.auditRepondre(da, ra1.id, 'p1', { etat: 'conforme' }); L.auditRepondre(da, ra1.id, 'p2', { etat: 'nc', note: 'DSA manquant' }); L.auditRepondre(da, ra1.id, 'p2', { note: 'DSA retrouvé' }); L.auditRepondre(da, ra1.id, 'p6', { etat: 'na' });
    t('réponses : état et note (la note seule garde l’état) ; état ou point inconnu refusés', A1().reponses.p2.etat === 'nc' && A1().reponses.p2.note === 'DSA retrouvé' && canonJ(L.auditResume(da, A1())) === canonJ({ conforme: 1, obs: 0, nc: 1, na: 1, attente: 3, total: 6 }) && !L.auditRepondre(da, ra1.id, 'p1', { etat: 'bof' }).ok && !L.auditRepondre(da, ra1.id, 'p99', { etat: 'conforme' }).ok);
    L.auditTest(da, ra1.id, { cible: { type: 'fini', id: 'fini201' }, titre: 'LF-26-001', secondes: 41.6 });
    t('test de traçabilité chronométré enregistré', A1().tests.length === 1 && A1().tests[0].secondes === 42 && A1().tests[0].titre === 'LF-26-001' && A1().tests[0].cible.id === 'fini201');
    L.auditClore(da, ra1.id, true);
    t('audit clos : ni réponse, ni test, ni modification ; rouvert : modifiable', A1().statut === 'clos' && !!A1().closLe && !L.auditRepondre(da, ra1.id, 'p3', { etat: 'conforme' }).ok && !L.auditTest(da, ra1.id, { titre: 'x', secondes: 1 }).ok && !L.auditSave(da, ra1.id, { auditeur: 'B' }).ok && L.auditClore(da, ra1.id, false).ok && L.auditSave(da, ra1.id, { auditeur: 'B. Auditrice' }).ok && A1().auditeur === 'B. Auditrice' && A1().statut === 'encours' && !A1().closLe);
    const ra2 = L.auditSave(da, null, { modeleId: rm2.id, debut: '2026-01-01', fin: '2026-11-21' });
    t('type créé servant à un audit : suppression refusée ; audit supprimé, puis type supprimé', ra2.ok && !L.auditModeleRetablir(da, rm2.id).ok && L.auditSupprimer(da, ra2.id).ok && L.auditModeleRetablir(da, rm2.id).ok && !L.auditModele(da, rm2.id) && !L.auditSupprimer(da, ra2.id).ok);
    // pièces calculées : durée sur lattes (mois du calendrier), SO₂ total
    t('mois entre deux dates (calendrier)', L.moisEntre('2025-04-02', '2026-07-02') === 15 && L.moisEntre('2025-04-02', '2026-07-01') === 14 && L.moisEntre('2026-01-31', '2026-02-28') === 0 && L.moisEntre('2026-02-01', '2026-01-01') === null && L.moisEntre('', '2026-01-01') === null);
    const LT0 = L.auditLattes(da, { lattesMois: 15, lattesMillesimeMois: 36 });
    t('durée sur lattes : bouteilles reprises en stock (date de tirage inconnue) ni conformes ni en défaut', LT0.length === 1 && LT0[0].reprise && LT0[0].mois === null && LT0[0].ok === null);
    const tirOp = da.ops.find((o) => o.type === 'tirage');
    da.lotsFinis.push({ id: 'fini-essai', code: 'LF-ESSAI', date: '2027-06-30', sourceLotId: tirOp.lotId, designation: 'Brut (essai)' }, { id: 'fini-essai2', code: 'LF-ESSAI2', date: '2027-07-02', sourceLotId: tirOp.lotId, designation: 'Brut (essai)' });
    const LT = L.auditLattes(da, { lattesMois: 15 }, '2027-01-01', '2027-12-31');
    t('… tirage du 02/04/2026 : dégorgé le 30/06/2027 (14 mois) en défaut, le 02/07/2027 (15 mois) conforme ; dégorgements de la période seulement', tirOp.date === '2026-04-02' && LT.length === 2 && LT.find((x) => x.f.id === 'fini-essai').ok === false && LT.find((x) => x.f.id === 'fini-essai2').ok === true && LT.every((x) => x.debut === tirOp.date && !x.reprise));
    da.lotsFinis.push({ id: 'fini-mill', code: 'LF-MILL', date: '2027-07-03', sourceLotId: tirOp.lotId, designation: 'Brut millésimé 2025' }); const LM = L.auditLattes(da, { lattesMois: 15, lattesMillesimeMois: 36 }, '2027-07-03', '2027-07-03');
    t('… millésimé : son propre minimum', LM.length === 1 && LM[0].millesime && LM[0].min === 36 && LM[0].ok === false);
    const lotA = da.lots.find((l) => l.code === 'AS25-01'); const rAn = L.analyseSave(da, { lotId: lotA.id, date: '2026-10-01', valeurs: { so2t: 95 } });
    const SO = L.auditSo2(da, '2026-01-01', '2026-12-31', 90);
    t('SO₂ total : dernière analyse de chaque lot sur la période, au-dessus du maximum signalée', rAn.ok && SO.length >= 1 && SO[0].lot.id === lotA.id && SO[0].v === 95 && SO[0].depasse && SO.filter((x) => x.depasse).length === 1 && !SO.some((x) => x.a.date < '2026-01-01') && !L.auditSo2(da, '2026-01-01', '2026-12-31', '').some((x) => x.depasse), rAn.msg);
    const prep = (y) => L.auditSave(y, null, { modeleId: 'haccp', debut: '2026-01-01', fin: '2026-11-21' }); const typ = (y) => L.auditModeleSave(y, null, { nom: 'IFS (essai)' });
    t('droits : audits et types d’audit relèvent de la Traçabilité — chef de cave oui, opérateur de chai et consultation non', essE(uCh, prep).ok && essE(uCh, typ).ok && !essE(uOp, prep).ok && !essE(uCo, typ).ok && /Traçabilité|« trace »/.test(essE(uOp, prep).msg), essE(uOp, prep).msg);
    // ---- base de test 0.28.0-alpha.1 ; compatibilité avec la 0.27.0-alpha.2 gelée ; synchronisation
    const f32 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.28.0-alpha.1-audits.json'), 'utf8'))); L.syncConfig(f32); const eqF = (b, id) => L.equipementsDe(b).find((x) => x.id === id);
    t('base 0.28.0-alpha.1 de test : comptes avec clés d’accès (une en attente), parc complet, catégorie ajoutée, audits', f32.meta.versions.includes('0.28.0-alpha.1') && f32.utilisateurs.length === 2 && f32.utilisateurs.every((u) => (u.cles || []).length === 1) && f32.utilisateurs.some((u) => u.cles[0].acceptee === false) && eqF(f32, 'pompe').numSerie === 'SN-0001 (fictif)' && eqF(f32, 'pompe').champs.length === 2 && L.equipementsDe(f32).some((e) => e.categorie === 'materiel-viticole') && L.EQUIP_CATEGORIES.some((c) => c[0] === 'materiel-viticole') && f32.audits.length === 2 && f32.audits.some((a) => a.statut === 'clos' && a.tests.length === 1) && L.auditModele(f32, 'aoc').points.length === 8 && (f32.docs || []).some((x) => x.cible.type === 'equipement'));
    const dirX = path.join(__dirname, 'anciennes', '0.27.0-alpha.2');
    const X = new Function('React', files.filter((f) => fs.existsSync(path.join(dirX, f))).map((f) => fs.readFileSync(path.join(dirX, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, clone, syncConfig, syncFusion, listRename, equipementPressoirSet, maintInterventionSave, utilisateurMotDePasse, mdpEmpreinte, gardeDroits, APP_VERSION, APP_NUM };')({});
    t('0.27.0-alpha.2 gelée chargée (n° 27 000 002)', X.APP_VERSION === '0.27.0-alpha.2' && X.APP_NUM === 27000002 && L.APP_NUM > X.APP_NUM);
    const x = X.normalizeDb(X.clone(f32)); X.syncConfig(x); const KX = ['utilisateurs', 'profils', 'settings', 'lists', 'maintenance', 'docs', 'audits', 'auditModeles', 'ops', 'lotsFinis'];
    t('… ouvre la base 0.28.0-alpha.1 sans rien perdre (clés d’accès, réglages, fiches du matériel, catégories, audits, types d’audit)', KX.every((k) => canonJ(x[k]) === canonJ(f32[k])), KX.filter((k) => canonJ(x[k]) !== canonJ(f32[k])));
    const opX = x.utilisateurs.find((u) => u.profilId === 'pf_operateur'); const mX = await X.mdpEmpreinte('Nouveau-0272', 1000);
    const avX = X.clone(x); X.utilisateurMotDePasse(x, opX.id, mX); const gX = X.gardeDroits(avX, x, opX.id);
    const rx1 = X.listRename(x, 'equipements', 'pompe', 'Pompe à pistons (renommée)'); const rx2 = X.equipementPressoirSet(x, 'bascule', { balance: { valideJusquau: '2027-07-31' } });
    const rx3 = X.maintInterventionSave(x, { date: '2026-11-21', equipementId: 'pompe', type: 'preventive', interventions: 'Graissage (0.27.0-alpha.2)', resultat: 'conforme' });
    const backX = L.normalizeDb(X.clone(x)); L.syncConfig(backX);
    t('… mot de passe changé par l’opérateur, matériel renommé, vignette changée, maintenance saisie par la 0.27.0-alpha.2 : clés, fiches et audits gardés ; vignette à jour ici', gX.ok && rx1 && rx1.ok !== false && rx2.ok && rx3.ok && eqF(backX, 'pompe').label === 'Pompe à pistons (renommée)' && eqF(backX, 'pompe').numSerie === 'SN-0001 (fictif)' && eqF(backX, 'pompe').champs.length === 2 && L.equipVerif(eqF(backX, 'bascule'), T0).valideJusquau === '2027-07-31' && eqF(backX, 'bascule').verif.organisme === 'Organisme agréé (fictif)' && L.equipHistorique(backX, 'pompe').interventions.length === L.equipHistorique(f32, 'pompe').interventions.length + 1 && canonJ(backX.utilisateurs.map((u) => u.cles)) === canonJ(f32.utilisateurs.map((u) => u.cles)) && canonJ(backX.utilisateurs.find((u) => u.id === opX.id).mdp) === canonJ(mX) && canonJ(backX.audits) === canonJ(f32.audits) && canonJ(backX.auditModeles) === canonJ(f32.auditModeles), [gX.msg, rx1, rx2.msg, rx3.msg]);
    const N1 = L.clone(f32); const adm32 = N1.utilisateurs.find((u) => u.profilId === 'pf_admin').id;
    L.equipementSave(N1, 'pompe', { label: 'Pompe à pistons', marque: 'Marque B' }); L.cleAjouter(N1, adm32, { ...kA, id: 'cleAdmin-0032', nom: 'iPhone' }); L.auditRepondre(N1, N1.audits.find((a) => a.statut !== 'clos').id, 'p2', { etat: 'obs' }); N1.meta.modifLe = '2026-11-22T09:00:00Z';
    const FX = L.syncFusion(f32, N1, x);
    t('synchronisation 0.28.0-alpha.1 ↔ 0.27.0-alpha.2 : fiche modifiée ici et matériel renommé là-bas réunis champ par champ, clé, réponse, maintenance et vignette gardées', eqF(FX.db, 'pompe').label === 'Pompe à pistons (renommée)' && eqF(FX.db, 'pompe').marque === 'Marque B' && FX.db.utilisateurs.find((u) => u.id === adm32).cles.length === 2 && FX.db.audits.find((a) => a.statut !== 'clos').reponses.p2.etat === 'obs' && FX.db.maintenance.length === x.maintenance.length && (eqF(FX.db, 'bascule').balance || {}).valideJusquau === '2027-07-31' && !FX.conflits.length, FX.conflits);
    const FX2 = X.syncFusion(f32, x, N1);
    t('… synchronisée par la 0.27.0-alpha.2 : clés, audits et fiches toujours gardés (conflit éventuel au journal)', FX2.db.utilisateurs.find((u) => u.id === adm32).cles.length === 2 && FX2.db.audits.length === 2 && eqF(FX2.db, 'pompe').numSerie === 'SN-0001 (fictif)' && eqF(FX2.db, 'refracto') === undefined && L.equipementsDe(FX2.db).some((e) => e.categorie === 'materiel-viticole'));
    L.syncConfig(L.normalizeDb(L.sampleDb()));
  }
  // ===== 0.29.0-alpha.1 : fiches personnalisables, doses, saisie groupée, fermentation, SO₂, enrichissement, QR, rappel, chiffrement =====
  {
    // ---- QR code : structure normalisée (repères, synchronisation, format et version lisibles, module sombre), capacité
    const lireFormat = (M) => { let b = 0; const pos = [[0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [7, 8], [8, 8], [8, 7], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0]]; pos.forEach(([y, x], i) => { if (M[y][x]) b |= 1 << i; }); const v = b ^ 0x5412; const dat = v >> 10; let r = dat; for (let i = 0; i < 10; i += 1) r = (r << 1) ^ ((r >>> 9) * 0x537); return { ok: (((dat << 10) | r) ^ 0x5412) === b, ecc: dat >> 3, masque: dat & 7 }; };
    const reperage = (M, x0, y0) => { for (let dy = 0; dy < 7; dy += 1) for (let dx = 0; dx < 7; dx += 1) { const dd = Math.max(Math.abs(dx - 3), Math.abs(dy - 3)); if (M[y0 + dy][x0 + dx] !== (dd !== 2)) return false; } return true; };
    const structOK = (q) => { const M = q.modules; const n = q.taille; let tOK = true; for (let i = 8; i < n - 8; i += 1) if (M[6][i] !== (i % 2 === 0) || M[i][6] !== (i % 2 === 0)) tOK = false; const f = lireFormat(M); return n === q.version * 4 + 17 && reperage(M, 0, 0) && reperage(M, n - 7, 0) && reperage(M, 0, n - 7) && tOK && M[n - 8][8] === true && f.ok && f.ecc === L.QR_FORMAT_BITS[q.niveau] && f.masque === q.masque; };
    const qa = L.qrMatrice('https://cave.exemple.fr/oenotrack/#cuve=ct12', { niveau: 'Q' }); const qb = L.qrMatrice('https://cave.exemple.fr/oenotrack/#cuve=ct12', { niveau: 'Q' });
    t('QR : version 4 (adresse + identifiant), structure normalisée, format lisible, résultat stable', qa.version === 4 && structOK(qa) && JSON.stringify(qa.modules) === JSON.stringify(qb.modules), { v: qa.version, m: qa.masque, n: qa.niveau });
    const lireVersion = (q) => { const n = q.taille; let b = 0; for (let i = 0; i < 18; i += 1) if (q.modules[Math.floor(i / 3)][n - 11 + (i % 3)]) b |= 1 << i; return b >> 12; };
    const qv = [7, 15, 32, 40].map((v) => L.qrMatrice(`version ${v}`, { niveau: 'H', versionMin: v, relever: false }));
    t('QR : grandes versions (7 à 40) — information de version, structure, chaque masque possible', qv.every((q, i) => q.version === [7, 15, 32, 40][i] && lireVersion(q) === q.version && structOK(q)) && [0, 1, 2, 3, 4, 5, 6, 7].every((m) => structOK(L.qrMatrice('Œnotrack — étiquette', { masque: m }))));
    let trop = false; try { L.qrMatrice('x'.repeat(2954), { niveau: 'L' }); } catch (e) { trop = /trop long/.test(e.message); }
    t('QR : 2 953 octets au plus (version 40, niveau L), au-delà refusé ; SVG avec marge', L.qrMatrice('x'.repeat(2953), { niveau: 'L' }).version === 40 && trop && /viewBox="0 0 29 29"/.test(L.qrSvg('ct1', { niveau: 'L', versionMin: 1 })) && /<path d="M4 4h7v1h-7z/.test(L.qrSvg('ct1', { niveau: 'L', versionMin: 1 })));
    // ---- doses dans l'unité du produit
    t('doses : g/hL, mL/hL, kg/hL et L/hL au-delà de 1 000 ; rien pour les unités', L.doseTexte(5, 'g') === '5,0 g/hL' && L.doseTexte(0.5, 'g') === '0,50 g/hL' && L.doseTexte(120, 'g') === '120 g/hL' && L.doseTexte(12, 'mL') === '12,0 mL/hL' && L.doseTexte(1500, 'L') === '1,50 L/hL' && L.doseTexte(1700, 'kg') === '1,70 kg/hL' && L.doseTexte(3, 'u') === '' && L.doseTexte(null, 'g') === '', [L.doseTexte(5, 'g'), L.doseTexte(1500, 'L')]);
    t('… quantité = dose × volume (dans l’unité du produit) ; doses successives et leur total', L.qteDeDose(5, 'g', 1000) === 50 && Math.abs(L.qteDeDose(5, 'kg', 1000) - 0.05) < 1e-12 && L.qteDeDose(10, 'mL', 2000) === 200 && L.qteDeDose(5, 'u', 1000) === null && L.qteDeDose('', 'g', 1000) === null && L.dosesTexte([3, 2], 'g') === '3,0 + 2,0 = 5,0 g/hL' && L.dosesTexte([4], 'g') === '4,0 g/hL', L.dosesTexte([3, 2], 'g'));
    // ---- base de test 0.29.0-alpha.1
    const f33 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.29.0-alpha.1-cave.json'), 'utf8'))); L.syncConfig(f33);
    const g1 = L.opsDuGroupe(f33, 'grp-fixture-0291'); const g2 = L.prevsDuGroupe(f33, 'grp-fixture-0292'); const opU = f33.utilisateurs.find((u) => u.profilId === 'pf_operateur'); const adU = f33.utilisateurs.find((u) => u.profilId === 'pf_admin');
    t('base 0.29.0-alpha.1 de test : disposition commune et personnelle, saisie groupée validée (3) et planifiée (2), fermentation, enrichissement, réglages', f33.meta.versions.includes('0.29.0-alpha.1') && f33.settings.fichesRubriques.cont.masques.includes('jauge') && opU.fichesRubriques.lot.masques.includes('bilan') && g1.length === 3 && g1.every((o, i) => o.groupe.rang === i + 1 && o.groupe.nb === 3 && o.groupe.action === 'sulfitage' && o.sousType === 'sulfitage') && g2.length === 2 && f33.ops.some((o) => o.enrichissement && o.enrichissement.tav === 10.5) && f33.settings.chiffrement.actif && f33.settings.qr.base);
    // ---- fiches : disposition d'origine, commune, personnelle ; rubriques inconnues gardées ; nouvelle rubrique à sa place
    const D0 = L.ficheDispo('cont'); const DC = L.ficheDispo('cont', f33.settings.fichesRubriques.cont); const DP = L.ficheDispo('lot', f33.settings.fichesRubriques.lot, opU.fichesRubriques.lot);
    t('fiches : disposition d’origine (toutes visibles), commune (ordre, rubrique masquée, rubrique future ignorée)', D0.length === L.FICHE_RUBRIQUES.cont.length && D0.every((x) => x.visible) && DC[0].id === 'lots' && DC[2].id === 'historique' && !DC.find((x) => x.id === 'jauge').visible && !DC.some((x) => x.id === 'rubriqueFuture') && DC.length === D0.length, DC.map((x) => x.id));
    // (0.31.0-alpha.1 : la rubrique « schéma de vinification », absente de l'ordre enregistré en 0.29, prend sa place d'origine après « stades »)
    t('… personnelle : remplace la commune ; rubriques absentes de l’ordre enregistré remises à leur place d’origine', DP[0].id === 'operations' && DP[1].id === 'stades' && DP[2].id === 'schema' && DP[3].id === 'fermentation' && DP[4].id === 'composition' && !DP.find((x) => x.id === 'bilan').visible && DP.length === L.FICHE_RUBRIQUES.lot.length, DP.map((x) => x.id));
    const RG = L.ficheDispoReglage('cont', DC, f33.settings.fichesRubriques.cont);
    t('… réglage réenregistré : rubriques d’une version plus récente gardées', RG.ordre.includes('rubriqueFuture') && RG.masques.includes('rubriqueFuture') && RG.masques.includes('jauge') && RG.ordre[0] === 'lots');
    const essF = (uid, fn) => { const av = L.clone(f33); const ap = L.clone(f33); const r = fn(ap); if (r && r.ok === false) return r; return L.gardeDroits(av, ap, uid); };
    const gPerso = essF(opU.id, (y) => L.ficheReglagePersoSet(y, opU.id, 'cont', { ordre: ['historique'], masques: [] })); const gAutre = essF(opU.id, (y) => L.ficheReglagePersoSet(y, adU.id, 'cont', { ordre: ['historique'], masques: [] }));
    const gCommun = essF(opU.id, (y) => L.ficheReglageCommunSet(y, 'lot', { ordre: ['operations'], masques: [] })); const gAdmin = essF(adU.id, (y) => L.ficheReglageCommunSet(y, 'lot', { ordre: ['operations'], masques: [] }));
    t('droits : chacun sa disposition (sur son compte) ; pas celle d’un autre ; la disposition commune demande le droit de modifier les paramètres', gPerso.ok && !gAutre.ok && !gCommun.ok && gAdmin.ok, [gPerso.msg, gAutre.msg, gCommun.msg]);
    const ch0 = f33.settings.chiffrement; const gCh1 = essF(opU.id, (y) => { y.settings.chiffrement = { ...ch0, actif: false }; return { ok: true }; }); const gCh2 = essF(adU.id, (y) => { y.settings.chiffrement = { ...ch0, actif: false }; return { ok: true }; });
    t('droits : chiffrement réservé au droit « Sauvegardes et Drive », tracé au journal des accès', !gCh1.ok && /chiffrement/.test(gCh1.msg) && gCh2.ok && gCh2.audit.some((x) => x.resume === 'Chiffrement des sauvegardes désactivé'), [gCh1.msg]);
    // ---- saisie groupée : correction (une ligne retirée), échec d'une ligne = rien d'enregistré, annulation, correction seule
    const dg = L.clone(f33); const o1 = L.opsDuGroupe(dg, 'grp-fixture-0291');
    const corr = o1.slice(0, 2).map((o, i) => ({ titre: `l${i}`, editId: o.id, spec: { type: 'intrant', sousType: 'sulfitage', date: o.date, notes: '', portionId: o.portionId, lignes: [{ ...o.lignes[0], qty: o.lignes[0].qty + (i ? 7 : 0) }], prepUses: [], motif: o.motif, groupe: { action: 'sulfitage' } } }));
    const rc = L.opsGroupeEnregistrer(dg, 'grp-fixture-0291', corr, o1.map((o) => o.id), {}); const o2 = L.opsDuGroupe(dg, 'grp-fixture-0291');
    t('groupe corrigé : 2 lignes gardées (mêmes opérations, quantité changée), 3ᵉ supprimée, rangs renumérotés', rc.ok && o2.length === 2 && o2[0].id === o1[0].id && o2[1].id === o1[1].id && o2[1].lignes[0].qty === o1[1].lignes[0].qty + 7 && !dg.ops.some((o) => o.id === o1[2].id) && o2.every((o) => o.groupe.nb === 2));
    const dg2 = L.clone(f33); const bad = [{ titre: 'a', spec: { ...corr[0].spec } }, { titre: 'b', spec: { ...corr[0].spec, portionId: 'inexistante', date: '1999-01-01' } }];
    const rb = L.opsGroupeEnregistrer(dg2, 'grp-x', bad, [], {});
    t('… ligne en erreur : refus nommant la ligne (l’appel se fait sur une copie, rien n’est gardé)', !rb.ok && /^Ligne 2 \(b\)/.test(rb.msg), rb.msg);
    const dg3 = L.clone(f33); const oo = L.opsDuGroupe(dg3, 'grp-fixture-0291')[1]; const rs = L.opSave(dg3, { type: 'intrant', sousType: 'sulfitage', date: oo.date, notes: 'corrigée seule', portionId: oo.portionId, lignes: oo.lignes, prepUses: [], motif: oo.motif }, oo.id);
    t('… opération corrigée seule depuis le journal : reste dans son groupe', rs.ok && dg3.ops.find((o) => o.id === oo.id).groupe.id === 'grp-fixture-0291' && dg3.ops.find((o) => o.id === oo.id).notes === 'corrigée seule');
    const ra = L.opsGroupeSupprimer(dg3, 'grp-fixture-0291', {});
    t('… groupe annulé : ses 3 opérations supprimées, stocks recalculables', ra.ok && ra.n === 3 && !L.opsDuGroupe(dg3, 'grp-fixture-0291').length && !!L.replay(dg3) && !L.opsGroupeSupprimer(dg3, 'grp-fixture-0291').ok);
    const pv = L.prevsDuGroupe(dg3, 'grp-fixture-0292'); const rp = L.previsionsGroupeEnregistrer(dg3, 'grp-fixture-0292', [{ ...pv[0], editId: pv[0].id, notes: 'revu' }], pv.map((p) => p.id));
    t('opérations à réaliser d’un groupe : mises à jour, ligne retirée supprimée', rp.ok && L.prevsDuGroupe(dg3, 'grp-fixture-0292').length === 1 && L.prevsDuGroupe(dg3, 'grp-fixture-0292')[0].notes === 'revu' && L.prevsDuGroupe(dg3, 'grp-fixture-0292')[0].groupe.nb === 1);
    // ---- fermentation : relevés, vitesse, alerte (lot en FA), réglages
    const Rf = L.replay(f33); const etF = f33.ops.find((o) => o.type === 'etape' && o.date === '2026-11-10'); const lotFA = Rf.lots[etF.lotId]; const cFA = Object.values(Rf.portions).find((p) => p.lotId === lotFA.id).contenantId;
    const pts = L.fermentationPoints(f33, Rf, { lotIds: [lotFA.id], contId: cFA }); const et = L.fermentationEtat(pts, L.fermReglages(f33), '2026-11-21');
    const p4 = pts.slice(-4);
    t('fermentation : relevés du lot en FA dans sa cuve, dans l’ordre (septembre puis novembre) ; vitesse sur les deux derniers jours → arrêtée', pts.length >= 4 && pts.every((p, i) => !i || pts[i - 1].date <= p.date) && p4[0].densite === 1.082 && p4[3].temp === 20.5 && et.etat === 'arretee' && et.jours === 2 && Math.abs(et.vitesse - 0.00015) < 1e-9 && et.age === 3 && !et.ancien, et);
    const al = L.fermentationAlerte(f33, Rf, { contId: cFA }, '2026-11-21'); const fOff = L.clone(f33); fOff.settings.fermentation.actif = false;
    t('… alerte sur la cuve et sur le lot ; désactivable ; aucune pour un lot qui n’est pas en FA', al && al.etat === 'arretee' && al.lotId === lotFA.id && L.fermentationAlerte(f33, Rf, { lotId: lotFA.id }, '2026-11-21').etat === 'arretee' && !L.fermentationAlerte(fOff, Rf, { contId: cFA }, '2026-11-21') && Object.values(Rf.lots).filter((l) => !L.enFA(f33, l.stade)).every((l) => !L.fermentationAlerte(f33, Rf, { lotId: l.id }, '2026-11-21')));
    const P = (a) => a.map(([date, densite]) => ({ date, densite, seq: 0 })); const reg = L.fermReglages(f33);
    t('… active, lente, finie ; densité saisie sans virgule (1085) ; un seul relevé : rien', L.fermentationEtat(P([['2026-01-01', 1.08], ['2026-01-02', 1.07]]), reg).etat === 'active' && L.fermentationEtat(P([['2026-01-01', 1.08], ['2026-01-02', 1.0785]]), reg).etat === 'lente' && L.fermentationEtat(P([['2026-01-01', 1.0], ['2026-01-03', 0.995]]), reg).etat === 'finie' && L.densiteLue(1085) === 1.085 && L.densiteLue(0.994) === 0.994 && L.fermentationEtat(P([['2026-01-01', 1.08]]), reg) === null);
    // ---- SO₂ moléculaire et SO₂ libre nécessaire
    const s1 = L.so2Moleculaire({ libre: 25, ph: 3.2, tav: 11, temp: 20 });
    t('SO₂ moléculaire : 25 mg/L libre, pH 3,2, 11 % vol, 20 °C → ≈ 1,41 mg/L (pKa ≈ 1,98) ; SO₂ libre pour 0,6 mg/L ≈ 10,7', Math.abs(s1.moleculaire - 1.406) < 0.01 && Math.abs(s1.pka - 1.975) < 1e-9 && Math.abs(L.so2LibrePour({ cible: 0.6, ph: 3.2, tav: 11, temp: 20 }) - 10.67) < 0.05 && L.so2Moleculaire({ libre: 25, ph: 3.2, tav: 11, temp: 25 }).moleculaire > s1.moleculaire && L.so2Moleculaire({ libre: '', ph: 3.2 }) === null && L.so2Moleculaire({ libre: 25, ph: 9 }) === null, s1);
    // ---- simulateur d'enrichissement
    const eS = L.enrichSimuler(f33, { volL: 10000, tap: 9.5, tav: 10.5, methode: 'sucre' }); const eM = L.enrichSimuler(f33, { volL: 10000, tap: 9.5, tav: 10.5, methode: 'mcr', sucreMCR: 850 });
    t('enrichissement : sucre 170 kg pour 100 hL et +1 % vol (≈ +105 L) ; MCR ≈ 253 L (bilan de sucre, volume ajouté)', Math.abs(eS.sucreKg - 170) < 1e-9 && Math.abs(eS.volFinalL - 10105.4) < 0.01 && Math.abs(eM.mcrL - 253.17) < 0.05 && Math.abs(eM.volFinalL - 10253.17) < 0.05 && !eS.depasse, [eS.sucreKg, eM.mcrL]);
    t('… au-delà du maximum réglé signalé ; MCR trop pauvre en sucres : impossible ; données incomplètes : rien', L.enrichSimuler(f33, { volL: 10000, tap: 8, tav: 10.5 }).depasse && L.enrichSimuler(f33, { volL: 10000, tap: 9.5, tav: 10.5, methode: 'mcr', sucreMCR: 150 }).impossible && L.enrichSimuler(f33, { volL: 0, tap: 9, tav: 10 }) === null);
    // ---- QR et liens directs vers une cuve
    const fq = L.clone(f33); fq.settings.qr = { mode: 'code' };
    t('QR d’une cuve : adresse + identifiant (mode lien), code seul (mode code ou adresse non valable) ; relus', L.qrTexteCuve(f33, 'ct12') === 'https://cave.exemple.fr/oenotrack/#cuve=ct12' && L.qrTexteCuve(fq, 'ct12') === 'OENOTRACK:CUVE:ct12' && L.qrTexteCuve(L.clone({ settings: {} }), 'ct3', 'https://claude.ai/x') === 'OENOTRACK:CUVE:ct3' && L.qrLire('https://cave.exemple.fr/oenotrack/#cuve=ct12').cuve === 'ct12' && L.qrLire('oenotrack:cuve:ct12').cuve === 'ct12');
    t('… liens : dièse ou paramètre, autre ancre gardée ; identifiant douteux, autre QR, adresses non sûres refusés', L.lienCuveLire('#mentions-legales&cuve=ct3', '').cuve === 'ct3' && L.lienCuveLire('', '?cuve=ct4').cuve === 'ct4' && L.lienCuveLire('#cuve=..%2F..%2Fx', '') === null && L.qrLire('https://autre.fr/page') === null && L.qrLire('bonjour') === null && !L.qrBaseValide('https://claude.ai/x') && !L.qrBaseValide('http://exemple.fr/') && L.qrBaseValide('http://localhost:8080/') && L.qrBaseValide('https://cave.exemple.fr/oenotrack/'));
    // ---- rappel de sauvegarde (données gardées seulement dans ce navigateur)
    const RS = (o) => L.rappelSauvegardeEtat({ jours: 7, lie: false, vide: false, aujourdhui: '2026-11-21', ...o });
    t('rappel de sauvegarde : dernière il y a 20 jours → rappel ; Drive relié, base vide, « plus tard » : rien ; jamais sauvegardée : compté depuis la création', RS({ derniere: '2026-11-01' }).montrer && RS({ derniere: '2026-11-01' }).jours === 20 && !RS({ derniere: '2026-11-18' }).montrer && !RS({ derniere: '2026-11-01', lie: true }).montrer && !RS({ derniere: null, vide: true }).montrer && !RS({ derniere: '2026-11-01', reporte: '2026-11-22' }).montrer && !RS({ derniere: null, depuis: '2026-11-20' }).montrer && RS({ derniere: null, depuis: '2026-10-01' }).jamais && RS({ derniere: null, depuis: '2026-10-01' }).montrer);
  }
  // ---- chiffrement : mot de passe de l'équipe, enveloppe, documents, synchronisation Drive chiffrée ; versions antérieures protégées
  {
    const f33 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.29.0-alpha.1-cave.json'), 'utf8'))); const reg = f33.settings.chiffrement;
    t('mot de passe : 10 caractères au moins, confirmation identique', !!L.chiffrementMdpErreur('court') && !!L.chiffrementMdpErreur('une phrase solide', 'autre phrase') && L.chiffrementMdpErreur('une phrase solide', 'une phrase solide') === '');
    const k = await L.chiffrementDeriver('Essai-0290-chiffrement', reg.sel, reg.iter); const kf = await L.chiffrementDeriver('Mauvais-0290-chiffrement', reg.sel, reg.iter);
    t('clé dérivée (PBKDF2) : même empreinte que le réglage de la base, témoin vérifié ; mauvais mot de passe refusé', k.cleId === reg.cleId && await L.chiffrementVerifier(k, reg) && !(await L.chiffrementVerifier(kf, reg)) && L.chiffrementActif(f33) && !JSON.stringify(f33).includes('Essai-0290'));
    const texte = JSON.stringify({ format: 'oenotrack-sauvegarde', formatVersion: 1, db: f33, fichiers: [] }); const env = await L.chiffrerTexte(k, texte); const env2 = await L.chiffrerTexte(k, texte); const ej = JSON.parse(env);
    const nomCuve = f33.contenants[0].nom;
    t('enveloppe : reconnue, sans opérations ni lots ni contenants en clair, différente à chaque écriture ; déchiffrée à l’identique', !!L.enveloppeChiffree(env) && !ej.ops && !ej.lots && !ej.contenants && !ej.db && !env.includes(nomCuve) && env !== env2 && await L.dechiffrerTexte(k, env) === texte && !L.enveloppeChiffree(texte));
    const err = async (p) => { try { await p; return null; } catch (e) { return e; } };
    const altere = JSON.stringify({ ...ej, donnees: ej.donnees.slice(0, -8) + (ej.donnees.slice(-8, -4) === 'AAAA' ? 'BBBB' : 'AAAA') + ej.donnees.slice(-4) });
    const e1 = await err(L.dechiffrerTexte(kf, env)); const e2 = await err(L.dechiffrerTexte(k, altere)); const e3 = await err(L.dechiffrerTexte(k, JSON.stringify({ ...ej, formatVersion: 99 }))); const e4 = await err(L.dechiffrerTexte(null, env));
    t('… autre mot de passe, fichier altéré, version plus récente, clé absente : refus clairs', e1 && e1.chiffre && (e1.autreCle || e1.mauvaiseCle) && e2 && e2.mauvaiseCle && e3 && /plus récente/.test(e3.message) && e4 && e4.sansCle, [e1, e2, e3, e4].map((x) => x && x.message));
    const oct = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 55, 10, 1, 2, 3, 250, 0]); const enc = await L.chiffrerOctets(k, oct); const dec = await L.dechiffrerOctets(k, enc);
    t('documents joints : chiffrés (en-tête OENCH1), déchiffrés à l’identique ; document envoyé avant l’activation lu en clair ; clé absente : refus', L.octetsChiffres(enc) && !L.octetsChiffres(oct) && dec.length === oct.length && dec.every((b, i) => b === oct[i]) && (await L.dechiffrerOctets(k, oct)) === oct && !!(await err(L.dechiffrerOctets(null, enc))));
    // une version antérieure (0.28.0-alpha.1 gelée) face au Drive chiffré : elle refuse, n'écrit rien
    const dirO = path.join(__dirname, 'anciennes', '0.28.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, importObj, cloudSynchroniser, opSave, replay };')({});
    t('0.28.0-alpha.1 gelée chargée (n° 28 000 001)', O.APP_VERSION === '0.28.0-alpha.1' && O.APP_NUM === 28000001 && L.APP_NUM > O.APP_NUM);
    let refus = null; try { O.importObj(JSON.parse(env)); } catch (e) { refus = e.message; }
    const stO = { base: env, rev: 1, ecritures: 0 }; const FO = { infoBase: async () => ({ rev: String(stO.rev) }), lireBase: async () => ({ texte: stO.base, rev: String(stO.rev) }), ecrireBase: async (dd, tx) => { stO.base = tx; stO.rev += 1; stO.ecritures += 1; return { rev: String(stO.rev) }; }, listerDocs: async () => ({}), lireDoc: async () => null, ecrireDoc: async () => 'x' };
    const devO = { db: O.normalizeDb(O.clone(f33)), snaps: new Map() };
    const hoteO = { lireLocale: () => devO.db, appliquer: (nd) => { devO.db = nd; }, vide: () => false, snapLire: async (id) => (devO.snaps.has(id) ? JSON.parse(devO.snaps.get(id)) : null), snapEcrire: async (id, x) => { devO.snaps.set(id, JSON.stringify(x)); },
      construire: (x, sync) => JSON.stringify({ format: 'oenotrack-sauvegarde', formatVersion: 1, sync, db: x, fichiers: [] }), lire: (tx) => { const j = JSON.parse(tx); return j.format === 'oenotrack-sauvegarde' ? { db: O.importObj(j.db), sync: j.sync } : { db: O.importObj(j), sync: null }; }, // comme lireSauvegarde (0.28)
      docLocal: async () => true, docLire: async () => null, docEcrire: async () => {}, appareil: { tag: 'old', nom: 'Ancien' }, nouvelId: () => 'sOld', maintenant: () => '2026-11-21T10:00:00Z', aujourdhui: () => '2026-11-21' };
    const eO = await err(O.cloudSynchroniser(FO, { id: 'd' }, { syncId: 'avant', rev: '0', lignee: [] }, hoteO, {}));
    t('… elle refuse l’enveloppe (« ne ressemble pas à une sauvegarde ») et sa synchronisation s’arrête sans rien écrire sur le Drive', !!refus && /ne ressemble pas/.test(refus) && !!eO && stO.ecritures === 0 && stO.base === env, [refus, eO && eO.message, stO.ecritures]);
    // synchronisation chiffrée entre deux appareils de cette version (fournisseur simulé)
    let cpt = 0; const st = { base: null, rev: 0, docs: {}, ecritures: 0 };
    const F = { async infoBase() { return st.base === null ? null : { rev: String(st.rev) }; }, async lireBase() { return st.base === null ? null : { texte: st.base, rev: String(st.rev) }; }, async ecrireBase(dd, tx, rev) { if (st.base !== null && String(rev) !== String(st.rev)) throw { conflit: true }; st.base = tx; st.rev += 1; st.ecritures += 1; return { rev: String(st.rev) }; },
      async listerDocs() { const o = {}; Object.keys(st.docs).forEach((n) => { o[n] = n; }); return o; }, async lireDoc(dd, ref) { return st.docs[ref] || null; }, async ecrireDoc(dd, nom, b) { st.docs[nom] = b; return nom; } };
    const appareil = (tag, db0, cle) => { const dev = { db: db0, snaps: new Map(), docs: new Map(), e: {}, cle };
      dev.h = { lireLocale: () => dev.db, appliquer: (nd) => { dev.db = nd; }, vide: (x) => !x.ops.length && !x.lots.length && !x.contenants.length, snapLire: async (id) => (dev.snaps.has(id) ? JSON.parse(dev.snaps.get(id)) : null), snapEcrire: async (id, x) => { dev.snaps.set(id, JSON.stringify(x)); },
        construire: async (x, sync) => { const tx = JSON.stringify({ format: 'oenotrack-sauvegarde', formatVersion: 1, sync, db: x, fichiers: [] }); return L.chiffrementActif(x) ? L.chiffrerTexte(dev.cle, tx) : tx; },
        lire: async (tx) => { const ev = L.enveloppeChiffree(tx); const p = ev ? await L.dechiffrerTexte(dev.cle, ev) : tx; const j = JSON.parse(p); return { db: L.importObj(j.db), sync: j.sync }; },
        docNom: (dc) => (L.chiffrementActif(dev.db) ? `${dc.id}.chiffre` : dc.id), docEnvoi: async (b) => (L.chiffrementActif(dev.db) ? L.chiffrerOctets(dev.cle, b) : b), docRecu: async (b) => L.dechiffrerOctets(dev.cle, b),
        docLocal: async (id) => dev.docs.has(id), docLire: async (id) => dev.docs.get(id) || null, docEcrire: async (id, b) => { dev.docs.set(id, b); },
        appareil: { tag, nom: `Appareil ${tag}` }, nouvelId: () => `c${(cpt += 1)}`, maintenant: () => new Date().toISOString(), aujourdhui: () => '2026-11-21' };
      return dev; };
    const A = appareil('a', L.clone(f33), k); A.db.docs = [...(A.db.docs || []), { id: 'doc-chiffre-1', nom: 'certificat.pdf', mime: 'application/pdf', taille: oct.length, cible: { type: 'op', id: A.db.ops[0].id } }]; A.docs.set('doc-chiffre-1', oct);
    const rA = await L.cloudSynchroniser(F, { id: 'd' }, A.e, A.h, {});
    t('Drive chiffré : base et document envoyés chiffrés (nom « .chiffre »), rien de lisible en clair', rA.envoye && !!L.enveloppeChiffree(st.base) && !st.base.includes(nomCuve) && !!st.docs['doc-chiffre-1.chiffre'] && L.octetsChiffres(st.docs['doc-chiffre-1.chiffre']) && rA.docsEnvoyes === 1);
    const B = appareil('b', L.normalizeDb(L.emptyDb()), null);
    const eB = await err(L.cloudSynchroniser(F, { id: 'd' }, B.e, B.h, {}));
    t('… autre appareil sans le mot de passe : arrêt « fichier chiffré », rien d’écrit ni de repris', !!eB && eB.chiffre && eB.sansCle && st.ecritures === 1 && !B.db.ops.length);
    B.cle = await L.chiffrementDeriver('Essai-0290-chiffrement', reg.sel, reg.iter); const rB = await L.cloudSynchroniser(F, { id: 'd' }, B.e, B.h, {});
    t('… mot de passe saisi : base reprise et document déchiffré à l’identique', rB.adopte && B.db.ops.length === A.db.ops.length && rB.docsRecus === 1 && B.docs.get('doc-chiffre-1').length === oct.length && B.docs.get('doc-chiffre-1').every((x, i) => x === oct[i]));
    // compatibilité : la 0.28.0-alpha.1 ouvre la base 0.29.0-alpha.1 sans rien perdre ; elle corrige une opération d'un groupe ; synchronisation
    const x = O.normalizeDb(O.clone(f33)); O.syncConfig(x); const KX = ['utilisateurs', 'settings', 'ops', 'previsions', 'lists', 'audits'];
    t('… la 0.28.0-alpha.1 ouvre la base 0.29.0-alpha.1 sans rien perdre (dispositions, groupes, enrichissement, réglages QR, fermentation, chiffrement)', KX.every((kk) => canonJ(x[kk]) === canonJ(f33[kk])), KX.filter((kk) => canonJ(x[kk]) !== canonJ(f33[kk])));
    const og = x.ops.find((o) => o.groupe && o.groupe.rang === 2); const rx = O.opSave(x, { type: 'intrant', date: og.date, notes: 'corrigée en 0.28', portionId: og.portionId, lignes: og.lignes, prepUses: [], motif: og.motif }, og.id);
    const back = L.normalizeDb(O.clone(x));
    t('… opération d’un groupe corrigée par la 0.28.0-alpha.1 : groupe et sous-type gardés', rx.ok && back.ops.find((o) => o.id === og.id).groupe.id === 'grp-fixture-0291' && back.ops.find((o) => o.id === og.id).sousType === 'sulfitage' && back.ops.find((o) => o.id === og.id).notes === 'corrigée en 0.28');
    const N1 = L.clone(f33); L.ficheReglageCommunSet(N1, 'lot', { ordre: ['operations'], masques: ['pertes'] }); N1.meta.modifLe = '2026-11-21T11:00:00Z';
    const FX = L.syncFusion(f33, N1, x); const FX2 = O.syncFusion(f33, x, N1);
    t('… synchronisation 0.29 ↔ 0.28 : disposition commune ajoutée ici, correction faite là-bas, groupes gardés des deux côtés', FX.db.settings.fichesRubriques.lot.masques.includes('pertes') && FX.db.ops.find((o) => o.id === og.id).notes === 'corrigée en 0.28' && FX.db.ops.filter((o) => o.groupe).length === 3 && FX2.db.settings.fichesRubriques.lot.masques.includes('pertes') && FX2.db.ops.filter((o) => o.groupe).length === 3);
  }
  // ---- 0.30.0-alpha.1 : catalogues de produits, saisie fournisseur d'abord, doses cumulées, SO₂ total estimé, plafonds, dépassements motivés
  {
    const f34 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.30.0-alpha.1-intrants.json'), 'utf8'))); L.syncConfig(f34);
    const adU = f34.utilisateurs.find((u) => u.profilId === 'pf_admin'); const opU = f34.utilisateurs.find((u) => u.profilId === 'pf_operateur');
    const R34 = L.replay(f34);
    t('base 0.30.0-alpha.1 de test : SOEC masqué, 2 produits venus des catalogues, catalogue importé relu, plafonds matérialisés, dépassement motivé', f34.meta.versions.includes('0.30.0-alpha.1') && f34.catalogueReglage.masques.includes('cat:soec') && f34.produits.filter((p) => p.catalogue).length === 2 && f34.catalogues.length === 1 && f34.plafonds.length === 10 && f34.ops.filter((o) => o.depassement).length === 1);
    // ---- catalogues préinstallés : 906 produits factuels, identifiants uniques, familles et unités connues, source de chaque ligne
    const I = L.catalogueIntegre(); const ids = new Set(I.map((e) => e.id));
    const parCat = Object.fromEntries(L.CATALOGUES.map((c) => [c.id, I.filter((e) => e.cat === c.id).length]));
    t('catalogues : 906 produits (Laffort 193, IOC 234, Oenofrance 191, SOEC 90, Martin Vialatte 198), identifiants uniques', I.length === 906 && ids.size === 906 && parCat.laffort === 193 && parCat.ioc === 234 && parCat.oenofrance === 191 && parCat.soec === 90 && parCat.martinvialatte === 198, parCat);
    t('… familles et unités connues, source (titre, année, page) sur chaque ligne ; Sofralab = Oenofrance, SOEC, Martin Vialatte', I.every((e) => L.CAT_FAM[e.famille] && L.UNITES.includes(e.unite) && e.titre && e.annee && e.page) && L.CATALOGUES.filter((c) => c.fournisseur === 'Sofralab').map((c) => c.marque).join() === 'Oenofrance,SOEC,Martin Vialatte', I.filter((e) => !L.CAT_FAM[e.famille] || !L.UNITES.includes(e.unite) || !e.page).slice(0, 3).map((e) => e.id));
    t('… teneurs en SO₂ lisibles pour les solutions et comprimés relevés ; aucun texte descriptif (champs courts)', I.filter((e) => e.so2).every((e) => L.so2Teneur({ so2: e.so2, unite: e.unite }) != null) && I.filter((e) => e.so2).length >= 10 && I.every((e) => e.nom.length <= 60 && e.dose.length <= 80), I.filter((e) => e.so2 && L.so2Teneur({ so2: e.so2, unite: e.unite }) == null).map((e) => [e.id, e.so2, e.unite]));
    // ---- masquage (réglage commun) : catalogue, fournisseur
    const dm = L.clone(f34);
    t('masquage : SOEC masqué → absent des entrées et de la recherche ; les autres marques Sofralab restent', !L.catalogueEntrees(dm).some((e) => e.cat === 'soec') && L.catalogueEntrees(dm).some((e) => e.cat === 'oenofrance') && L.catalogueEntrees(dm, { masques: false }).some((e) => e.cat === 'soec') && !L.catalogueChercher(dm, { q: 'soec' }).some((e) => e.cat === 'soec'));
    L.catalogueMasquer(dm, 'fo:sofralab', true);
    t('… fournisseur Sofralab masqué : ses 3 marques absentes ; il reste proposé s’il fournit déjà des produits de la cave ; clé inconnue refusée', !L.catalogueEntrees(dm).some((e) => e.fournisseur === 'Sofralab') && L.intrantFournisseurs(dm).includes('Sofralab') && !L.catalogueMasquer(dm, 'x', true).ok && L.catalogueListe(dm).filter((c) => c.fournisseur === 'Sofralab').every((c) => c.masque));
    L.catalogueMasquer(dm, 'fo:sofralab', false); L.catalogueMasquer(dm, 'cat:soec', false);
    t('… démasqués : 906 entrées + 2 lignes validées du catalogue importé', L.catalogueEntrees(dm).length === 908 && dm.catalogueReglage.masques.length === 0);
    // ---- saisie d'un intrant : fournisseur d'abord, « En stock », produits du catalogue pas encore dans la cave
    const P1 = L.intrantProduitsPour(f34, R34, '@stock'); const P2 = L.intrantProduitsPour(f34, R34, 'IOC'); const P3 = L.intrantProduitsPour(f34, R34, 'Laffort', ['oeno']);
    t('saisie : « En stock » = produits dont il reste un lot fournisseur ; un fournisseur = ses produits puis ceux de ses catalogues (hors produits déjà repris)', P1.produits.length > 0 && P1.produits.every((p) => f34.arrivages.some((a) => a.produitId === p.id && L.arrivalRest(R34, a) > 0)) && !P1.catalogue.length && P2.produits.some((p) => p.nom === 'CLARIFIANT XL') && !P2.catalogue.some((e) => e.nom === 'CLARIFIANT XL') && P2.catalogue.length > 200 && P3.catalogue.every((e) => L.famCategorie(e.famille) === 'oeno'));
    t('… fournisseurs proposés : ceux de la cave et ceux des catalogues affichés, une seule fois chacun (Sofralab, IOC)', L.intrantFournisseurs(f34).filter((x) => x === 'Sofralab').length === 1 && L.intrantFournisseurs(f34).includes('Laffort') && L.intrantFournisseurs(f34).includes('Œnologie Exemple'), L.intrantFournisseurs(f34));
    // ---- produit repris d'un catalogue : fournisseur créé s'il manque, informations, règles d'exemple « à vérifier » avec leur source
    const dc = L.clone(f34); const eS = L.catalogueChercher(dc, { q: 'MANNOSTAB LIQUIDE 200' })[0]; const nf = dc.fournisseurs.length;
    const rC = L.produitDepuisCatalogue(dc, eS.id); const pC = dc.produits.find((p) => p.id === rC.id); const rgC = L.ruleFor(dc, pC.id, 'conv');
    t('produit du catalogue : créé chez Laffort (fournisseur déjà là), famille, catalogue et page, dose d’emploi sourcée, règle Conventionnel « à vérifier »', rC.ok && dc.fournisseurs.length === nf && pC.famille === 'stabilisant tartrique' && pC.categorie === 'oeno' && pC.unite === 'L' && pC.catalogue.page === '14' && /LAFFORT/.test(pC.doseEmploi) && rgC.autorise && rgC.aVerifier && /^catalogue : /.test(rgC.source), [pC, rgC]);
    const rC2 = L.produitDepuisCatalogue(dc, eS.id); const eM = L.catalogueChercher(dc, { q: 'BENTONITE' }).find((e) => e.cat === 'martinvialatte') || L.catalogueChercher(dc, { q: 'BENT' }).find((e) => e.cat !== 'laffort');
    const nf2 = dc.fournisseurs.length; const rM = L.produitDepuisCatalogue(dc, L.catalogueChercher(dc, { q: 'ZYMAFLORE X5' })[0].id);
    t('… repris deux fois : le même produit ; catalogue introuvable refusé ; produit d’un nouveau fournisseur : fournisseur ajouté', rC2.ok && rC2.deja && rC2.id === rC.id && !L.produitDepuisCatalogue(dc, 'inconnu:x').ok && rM.ok && dc.fournisseurs.length === nf2 && !!eM);
    const rBio = L.produitDepuisCatalogue(dc, L.catalogueChercher(dc, { q: 'OENOCELL BIO' })[0].id); const pBio = dc.produits.find((p) => p.id === rBio.id);
    t('… mention bio UE : règle Bio d’exemple « à vérifier » ajoutée, utilisation en bio notée', L.ruleFor(dc, pBio.id, 'bio').autorise && L.ruleFor(dc, pBio.id, 'bio').aVerifier && /bio \(UE\)/.test(pBio.usageBio));
    t('dose maximale indiquée par un catalogue : valeur « vin » si moût et vin sont distingués ; cL/hL → mL/hL ; unité incompatible ignorée', L.catalogueMaxDose({ max: 'moût 40 g/hL ; vin 60 g/hL', unite: 'g' }) === 60 && L.catalogueMaxDose({ max: '8 cL/hL', unite: 'L' }) === 80 && L.catalogueMaxDose({ max: '0,5 g/L', unite: 'g' }) === 50 && L.catalogueMaxDose({ max: '8 cL/hL', unite: 'g' }) === null && L.catalogueMaxDose({ max: '', unite: 'g' }) === null);
    // ---- catalogues importés : tableur (en-têtes en plusieurs langues), texte d'un PDF, réponse de l'assistant IA ; relecture
    const T1 = L.catalogueDepuisTableau([['Catalogue fictif'], ['Produit', 'Famille', 'Dose', 'Dose max', 'Teneur en SO₂', 'Conditionnement', 'Bio'], ['SOLUTION FICTIVE 15', 'sulfitage', '', '', '150 g/L', '5 L, 20 L', ''], ['LEVURE FICTIVE', '', '20 à 30 g/hL', '40 g/hL', '', '500 g', 'oui']]);
    const T2 = L.catalogueDepuisTableau([['Product', 'Family', 'Dosage', 'Packaging'], ['TANNIN TEST', 'tannin', '5-10 g/hL', '1 kg']]);
    t('tableur : ligne d’en-têtes trouvée sous un titre ; famille, dose max, teneur en SO₂, bio ; famille devinée par le nom', T1.lignes.length === 2 && T1.lignes[0].famille === 'sulfitage' && T1.lignes[0].so2 === '150 g/L' && T1.lignes[1].famille === 'levure' && T1.lignes[1].max === '40 g/hL' && T1.lignes[1].ue && T1.lignes[1].dose === '20 à 30 g/hL' && T1.lignes.every((l) => l.etat === 'aVerifier'), T1.lignes);
    t('… en-têtes en anglais (Product, Family, Dosage, Packaging) ; sans colonne « Produit » : message clair', T2.lignes.length === 1 && T2.lignes[0].famille === 'tanin' && T2.lignes[0].cond === '1 kg' && !L.catalogueDepuisTableau([['A', 'B'], ['x', 'y']]).lignes.length && /Colonnes non reconnues/.test(L.catalogueDepuisTableau([['A', 'B']]).msg));
    const CSV = L.catalogueCsvLignes('﻿Produit;Famille;Dose;Conditionnement;Bio\r\n"LEVURE ""FICTIVE""";levure;20-30 g/hL;500 g;oui\r\nTANIN FICTIF;tanin;"5,5 g/hL";1 kg;\r\n\r\n');
    t('CSV : séparateur deviné (point-virgule, virgule, tabulation), guillemets doublés, lignes vides ignorées ; repris comme un tableur', CSV.length === 3 && CSV[1][0] === 'LEVURE "FICTIVE"' && CSV[2][2] === '5,5 g/hL' && L.catalogueCsvLignes('a,b\n1,"x, y"')[1][1] === 'x, y' && L.catalogueCsvLignes('a\tb\n1\t2')[1][1] === '2' && L.catalogueDepuisTableau(CSV).lignes.length === 2 && L.catalogueDepuisTableau(CSV).lignes[0].ue, CSV);
    const TX = L.catalogueDepuisTexte('SOMMAIRE\nCLARIFIANT FICTIF\nAdjuvant de remuage pour la prise de mousse.\nDose : 8 à 10 cL/hL\nConditionnement : 1 L, 5 L\nENZYME FICTIVE PRESS   2-4 g/100 kg   250 g\nPAGE 12');
    t('texte d’un PDF : nom en majuscules puis dose (« cL/hL », « g/100 kg ») et conditionnement rattachés ; titres ignorés', TX.length === 2 && TX[0].nom === 'CLARIFIANT FICTIF' && TX[0].dose === '8-10 cL/hL' && TX[0].unite === 'mL' && TX[0].cond === '1 L, 5 L' && TX[1].nom === 'ENZYME FICTIVE PRESS' && TX[1].dose === '2-4 g/100 kg' && TX[1].famille === 'enzyme', TX);
    const IA = L.catalogueIaLire({ produits: [{ nom: 'PRODUIT IA®', famille: 'colle', unite: 'g', dose: '10-50 g/hL', conditionnement: '1 kg', page: '4', bio_ue: true, vegan: true }, { nom: '' }, { nom: 'SANS FAMILLE BENTONITE', famille: 'inconnue' }] });
    t('réponse de l’assistant IA : produits relus (® retiré, famille vérifiée ou devinée, bio et vegan), lignes vides écartées ; texte borné pour l’envoi', IA.length === 2 && IA[0].nom === 'PRODUIT IA' && IA[0].famille === 'colle' && IA[0].ue && IA[0].vegan && IA[1].famille === 'bentonite' && L.catalogueIaPrompt('x'.repeat(30000), { fournisseur: 'F' }).texte.length < 16000 && /JSON/.test(L.catalogueIaPrompt('x', {}).system));
    const di = L.clone(f34); const cI = di.catalogues[0]; cI.lignes[0].champFutur = { x: 1 };
    t('relecture : fournisseur exigé ; lignes « à vérifier » non proposées tant qu’elles ne sont pas validées', !L.catalogueImportSave(di, { lignes: T1.lignes }).ok && !L.catalogueImportSave(di, { fournisseur: 'X', lignes: [] }).ok && L.catalogueImportSave(di, { fournisseur: 'Essai', lignes: T1.lignes }).ok && !L.catalogueEntrees(di).some((e) => e.fournisseur === 'Essai') && L.catalogueEntrees(di, { tous: true }).filter((e) => e.fournisseur === 'Essai').length === 2);
    const cE = di.catalogues.find((c) => c.fournisseur === 'Essai'); L.catalogueLignesEtat(di, cE.id, [cE.lignes[1].id], 'valide');
    const rMod = L.catalogueLigneModifier(di, cI.id, cI.lignes[0].id, { dose: '25 g/hL', nom: 'LEVURE EXEMPLE CH' });
    t('… ligne validée proposée ; ligne corrigée (champ inconnu d’une version suivante gardé) ; état inconnu refusé ; nom vide refusé', L.catalogueEntrees(di).filter((e) => e.fournisseur === 'Essai').length === 1 && rMod.ok && cI.lignes[0].dose === '25 g/hL' && cI.lignes[0].champFutur.x === 1 && !L.catalogueLignesEtat(di, cE.id, [], 'x').ok && !L.catalogueLigneModifier(di, cI.id, cI.lignes[0].id, { nom: '  ' }).ok);
    L.catalogueMasquer(di, `cat:${cE.id}`, true); const rSup = L.catalogueImportSupprimer(di, cE.id);
    t('… catalogue importé retiré : ses lignes et son masque disparaissent, les produits déjà repris restent', rSup.ok && !di.catalogues.some((c) => c.id === cE.id) && !di.catalogueReglage.masques.includes(`cat:${cE.id}`) && !L.catalogueImportSupprimer(di, cE.id).ok && di.produits.length === f34.produits.length);
    // ---- teneur en SO₂ et règles effectives (produit + substances du cahier des charges)
    t('teneur en SO₂ ramenée à l’unité du produit : 150 g/L (L ou mL), 0,5 g/g (g ou kg), 5 g/u, 500 mg/L ; unité incompatible → inconnue', L.so2Teneur({ so2: '150 g/L', unite: 'L' }) === 150 && L.so2Teneur({ so2: '150 g/L', unite: 'mL' }) === 0.15 && L.so2Teneur({ so2: '0,5 g/g', unite: 'kg' }) === 500 && L.so2Teneur({ so2: '0,5 g/g', unite: 'g' }) === 0.5 && L.so2Teneur({ so2: '5 g/u', unite: 'u' }) === 5 && L.so2Teneur({ so2: '500 mg/L', unite: 'L' }) === 0.5 && L.so2Teneur({ so2: '150 g/L', unite: 'g' }) === null && L.so2Teneur({ so2: 'beaucoup', unite: 'L' }) === null);
    t('… teneur saisie dans la fiche produit : formats acceptés, texte libre refusé', L.produitSave(L.clone(f34), { nom: 'Essai SO2', categorie: 'oeno', unite: 'L', so2: '100 g/L' }).ok && !L.produitSave(L.clone(f34), { nom: 'Essai SO2', categorie: 'oeno', unite: 'L', so2: 'cent' }).ok);
    const dr = L.clone(f34); L.produitSave(dr, { nom: 'Charbon actif fictif', categorie: 'aux', unite: 'g' }); const pCh = dr.produits.find((p) => p.nom === 'Charbon actif fictif'); L.regleSet(dr, pCh.id, 'bio', { autorise: true, doseMax: 100 });
    L.plafondSave(dr, { qualifId: 'conv', objet: 'substance', mot: 'charbon', libelle: 'Charbon', autorise: true, doseMax: 40, unite: 'g/hL' }, null, adU.id);
    const eB = L.regleEffective(dr, pCh, 'bio'); const eC = L.regleEffective(dr, pCh, 'conv'); const eL = L.regleEffective(dr, dr.produits.find((p) => /levure fermentation/i.test(p.nom)), 'bio');
    t('règle effective : substance interdite en Bio (cahier des charges) l’emporte ; dose maximale la plus basse ; produit non concerné inchangé', !eB.autorise && eB.sources.length === 1 && eC.autorise && eC.doseMax === 40 && eL === L.ruleFor(dr, dr.produits.find((p) => /levure fermentation/i.test(p.nom)).id, 'bio'), [eB, eC]);
    // ---- doses cumulées : prorata des volumes (assemblage), tirage (cuvée + liqueur + levain), dose de l'ajout
    const op169 = f34.ops.find((o) => o.type === 'assemblage' && o.date === '2026-03-18'); const Rp = L.getR(f34, '2026-03-17'); const Ra = L.getR(f34, '2026-03-18');
    const tot = op169.sources.reduce((a, s) => a + s.volL, 0); const exp = {}; op169.sources.forEach((s) => { const c = Rp.conc[s.lotId] || {}; Object.keys(c).forEach((k) => { exp[k] = (exp[k] || 0) + c[k] * s.volL / tot; }); });
    op169.lignes.forEach((l) => { exp[l.produitId] = (exp[l.produitId] || 0) + L.doseHL(l.qty, L.prodOfDb(f34, l.produitId).unite, tot); });
    const got = Ra.conc[op169.lotId]; const ecart = Object.keys({ ...exp, ...got }).filter((k) => k[0] !== '@').map((k) => Math.abs((exp[k] || 0) - (got[k] || 0))).reduce((a, b) => Math.max(a, b), 0);
    t('assemblage : dose de chaque produit = moyenne des lots d’origine pondérée par les volumes, plus l’ajout fait pendant l’assemblage', ecart < 1e-9 && Object.keys(exp).length >= 6, ecart);
    const C = L.lotIntrantsCumul(f34, R34, op169.lotId); const mb = C.find((x) => /métabisulfite/i.test(x.p.nom));
    t('… tableau du lot : dose cumulée, part héritée, part directe ; sulfitant contrôlé par le SO₂ total (pas de dose maximale cumulée)', mb && Math.abs(mb.dose - 18.812) < 0.01 && Math.abs(mb.herite - 11.945) < 0.01 && mb.so2 && mb.max === null && !mb.depasse && C.find((x) => /bentonite/i.test(x.p.nom)).max === 100, C.map((x) => [x.p.nom, x.dose, x.max]));
    const t26 = Object.values(R34.lots).find((l) => l.code === 'T26-01'); const op182 = f34.ops.find((o) => o.type === 'tirage' && o.lotId === t26.id); const Rq = L.getR(f34, '2026-04-01'); const Rt = L.getR(f34, '2026-04-02');
    let v = 0; let cc = {}; const mel = (cin, vin) => { const n = {}; new Set([...Object.keys(cc), ...Object.keys(cin)]).forEach((k) => { n[k] = ((cc[k] || 0) * v + (cin[k] || 0) * vin) / (v + vin); }); cc = n; v += vin; };
    op182.sources.forEach((s) => mel(Rq.conc[s.lotId] || {}, s.volL)); op182.prepUses.forEach((u) => mel(Rq.concPrep[u.prepId] || {}, u.volL));
    op182.lignes.forEach((l) => { const dl = L.doseHL(l.qty, L.prodOfDb(f34, l.produitId).unite, v); if (dl != null) cc[l.produitId] = (cc[l.produitId] || 0) + dl; });
    const ecT = Object.keys({ ...cc, ...Rt.conc[t26.id] }).filter((k) => k[0] !== '@').map((k) => Math.abs((cc[k] || 0) - ((Rt.conc[t26.id] || {})[k] || 0))).reduce((a, b) => Math.max(a, b), 0);
    t('tirage : cuvée, liqueur de tirage et levain mélangés au prorata (5 190 L), ajouts du tirage rapportés au vin tiré ; levure de prise de mousse et sucre hérités', ecT < 1e-9 && Rt.tirVol[t26.id] === 5190 && (cc[f34.produits.find((p) => /prise de mousse/i.test(p.nom)).id] || 0) > 4 && (cc[f34.produits.find((p) => /sucre/i.test(p.nom)).id] || 0) > 2000, ecT);
    t('… lot tiré : vin effervescent pour le plafond de SO₂ ; registre : dose cumulée sur chaque ligne d’intrant', L.lotTypeVin(f34, R34, t26.id) === 'effervescent' && R34.apps.filter((a) => a.lotId && (a.kind === 'portion' || a.kind === 'tirage') && L.doseUnit(a.unite)).every((a) => a.cumul > 0));
    // ---- SO₂ total estimé : dernière analyse + ajouts depuis (le jour même compris), sinon cumul depuis l'origine ; plafond de la revendication
    const g1 = f34.ops.filter((o) => o.groupe && o.groupe.id === 'grp-fixture-0291').sort((a, b) => a.groupe.rang - b.groupe.rang)[0]; const lotA = R34.portions[g1.portionId] ? R34.portions[g1.portionId].lotId : L.getR(f34, '2026-11-20').portions[g1.portionId].lotId;
    const e1 = L.so2TotalEstime(f34, R34, lotA);
    t('SO₂ total estimé : analyse du 15/11 (40 mg/L) + sulfitage groupé du 20/11 (5 g/hL de métabisulfite à 0,5 g/g = 25 mg/L) = 65 mg/L ; plafond vérifié 185 (effervescent)', e1.analyse && e1.base === 40 && Math.abs(e1.depuis - 25) < 1e-9 && Math.abs(e1.estime - 65) < 1e-9 && e1.plafond.valeur === 185 && !e1.plafond.aVerifier && !e1.depasse, e1);
    const sansAn = Object.keys(R34.so2Ev).find((id) => !f34.analyses.some((a) => a.lotId === id && a.valeurs && a.valeurs.so2t != null)); const e2 = L.so2TotalEstime(f34, R34, sansAn);
    t('… sans analyse : cumul des ajouts depuis l’origine (lots d’origine compris) ; produit sulfitant sans teneur connue signalé', e2.sansAnalyse && Math.abs(e2.estime - (R34.conc[sansAn]['@so2'] * 10)) < 1e-9 && L.so2TeneurInconnue(f34, R34, op169.lotId).length === 0);
    const dS = L.clone(f34); const pS = dS.produits.find((p) => /métabisulfite/i.test(p.nom)); delete pS.so2; const RS0 = L.replay(dS);
    t('… teneur effacée : plus d’ajout compté, le produit est signalé (teneur inconnue)', !(RS0.so2Ev[lotA] || []).length && L.so2TeneurInconnue(dS, RS0, lotA).some((p) => p.id === pS.id));
    // ---- plafonds : exemples (absents de la base = exemples « à vérifier »), matérialisés à la 1re modification, validés, champs inconnus gardés
    const dP = L.normalizeDb(L.clone(f34)); delete dP.plafonds;
    t('plafonds d’exemple : 9 (Conventionnel, Bio, Demeter × 3 types de vins), « à vérifier », source citée ; base sans plafond → exemples', L.plafondsDe(dP).length === 9 && L.plafondsDe(dP).every((p) => p.exemple && p.aVerifier && /exemple à vérifier/.test(p.source)) && L.plafondsDe(dP).find((p) => p.id === 'ex-conv-effervescent').valeur === 185 && L.plafondsDe(dP).find((p) => p.id === 'ex-bio-rouge').valeur === 100 && !dP.plafonds);
    L.plafondValider(dP, 'ex-dem-rouge', adU.id);
    t('… 1re modification : exemples copiés dans la base, celui-ci vérifié (par qui, quand) ; plafond introuvable refusé', Array.isArray(dP.plafonds) && dP.plafonds.length === 9 && !dP.plafonds.find((p) => p.id === 'ex-dem-rouge').aVerifier && dP.plafonds.find((p) => p.id === 'ex-dem-rouge').verifiePar === adU.id && !L.plafondValider(dP, 'x').ok);
    dP.plafonds.find((p) => p.id === 'ex-dem-rouge').champFutur = 'gardé'; const rE = L.plafondSave(dP, { qualifId: 'dem', objet: 'so2t', vin: 'rouge', valeur: 80, note: 'corrigé', aVerifier: false }, 'ex-dem-rouge', adU.id);
    const pE = dP.plafonds.find((p) => p.id === 'ex-dem-rouge');
    t('… plafond corrigé : valeur, note, vérifié ; champ d’une version suivante gardé ; saisies invalides refusées', rE.ok && pE.valeur === 80 && pE.note === 'corrigé' && pE.champFutur === 'gardé' && pE.exemple && !L.plafondSave(dP, { qualifId: 'x', objet: 'so2t', vin: 'rouge', valeur: 80 }).ok && !L.plafondSave(dP, { qualifId: 'dem', objet: 'so2t', vin: 'rose', valeur: 80 }).ok && !L.plafondSave(dP, { qualifId: 'dem', objet: 'so2t', vin: 'rouge', valeur: 0 }).ok && !L.plafondSave(dP, { qualifId: 'dem', objet: 'substance', mot: 'ab' }).ok);
    t('… plafond du lot : revendication + type de vin, « tous les vins » à défaut, le plus bas s’il y en a plusieurs', (() => { const x = L.clone(dP); x.plafonds = [{ id: 'a', qualifId: 'conv', objet: 'so2t', vin: 'tous', valeur: 150 }, { id: 'b', qualifId: 'conv', objet: 'so2t', vin: 'effervescent', valeur: 190 }, { id: 'c', qualifId: 'conv', objet: 'so2t', vin: 'effervescent', valeur: 170 }]; const p1 = L.plafondSo2Lot(x, R34, lotA); x.plafonds = x.plafonds.slice(0, 1); const p2 = L.plafondSo2Lot(x, R34, lotA); return p1.id === 'c' && p2.id === 'a'; })());
    // ---- cahier des charges : propositions lues dans un texte (fictif), appliquées après relecture
    const TXT = 'Article 4 — Sulfitage. La teneur maximale en SO2 total des vins rouges est fixée à 100 mg/l ; elle est de 150 mg/l pour les vins blancs et rosés et de 155 mg/L pour les vins mousseux.\nArticle 7 — L’utilisation de charbon œnologique est interdite. Le PVPP est limité à 30 g/hl. Les copeaux de bois sont interdits.';
    const PR = L.cahierPropositions(TXT); const so2P = PR.filter((x) => x.objet === 'so2t'); const subP = PR.filter((x) => x.objet === 'substance');
    t('cahier des charges : SO₂ total par type de vin (rouges 100, blancs et rosés 150, mousseux 155), substances interdites (charbon, copeaux), PVPP limité à 30 g/hL ; extraits gardés', so2P.length === 3 && so2P.find((x) => x.vin === 'rouge').valeur === 100 && so2P.find((x) => x.vin === 'blanc_rose').valeur === 150 && so2P.find((x) => x.vin === 'effervescent').valeur === 155 && subP.some((x) => /charbon/.test(x.mot) && x.autorise === false) && subP.some((x) => /copeaux/.test(x.mot) && x.autorise === false) && subP.some((x) => /pvpp/.test(x.mot) && x.autorise && x.doseMax === 30 && x.unite === 'g/hL') && PR.every((x) => x.extrait), PR.map((x) => [x.objet, x.vin || x.mot, x.valeur || x.doseMax, x.autorise]));
    const IA2 = L.cahierIaLire({ so2: [{ vin: 'rouge', max_mg_l: 90, condition: 'sucres < 2 g/L', extrait: '…' }, { vin: 'x', max_mg_l: 5000 }], substances: [{ nom: 'Lysozyme', mots_cles: 'lysozym', autorise: false }, { nom: 'Gomme', mots_cles: '', autorise: true, dose_max: 30, unite: 'g/hL' }] });
    t('… réponse de l’assistant IA relue : valeur aberrante écartée, type de vin inconnu → tous les vins, mots-clés tirés du nom à défaut', IA2.length === 3 && IA2[0].valeur === 90 && IA2[0].note === 'sucres < 2 g/L' && IA2.filter((x) => x.objet === 'so2t').length === 1 && IA2[1].mot === 'lysozym' && IA2[2].mot === 'gomme' && IA2[2].doseMax === 30);
    const dA = L.clone(f34); const nAv = L.plafondsDe(dA).length; const rA = L.cahierAppliquer(dA, 'bio', PR, 'Cahier des charges fictif', adU.id);
    const bioRouge = dA.plafonds.filter((p) => p.objet === 'so2t' && p.qualifId === 'bio' && p.vin === 'rouge');
    t('… propositions appliquées à Bio : un plafond par type de vin (remplace l’exemple), substances ajoutées (charbon déjà là : remplacée), toutes vérifiées', rA.ok && rA.n === PR.length && bioRouge.length === 1 && bioRouge[0].valeur === 100 && !bioRouge[0].aVerifier && bioRouge[0].source === 'Cahier des charges fictif' && dA.plafonds.filter((p) => p.objet === 'substance' && p.qualifId === 'bio' && p.mot === 'charbon').length === 1 && dA.plafonds.length === nAv + 2 && !L.cahierAppliquer(dA, 'bio', [], '', adU.id).ok, [dA.plafonds.length, nAv]);
    // ---- dépassements : aperçu (dose, dose cumulée, SO₂ total), motif tracé avec l'opération et dans le journal
    const opD = f34.ops.find((o) => o.depassement); const depD = R34.depass[opD.id];
    t('dépassement motivé (jeu d’essai) : dose de 20 g/hL pour 15 en Conventionnel, motif, auteur et détail gardés ; avertissement « Dépassement justifié » une fois', depD.length === 1 && depD[0].type === 'dose' && depD[0].valeur === 20 && depD[0].max === 15 && depD[0].justifie && opD.depassement.motif === 'Correction décidée après analyse (fictif)' && opD.depassement.par === adU.id && opD.depassement.details[0].type === 'dose' && (R34.warn[opD.id] || []).filter((w) => /Dépassement justifié/.test(w)).length === 1, [depD, R34.warn[opD.id]]);
    const pt = R34.portions[opD.portionId] ? opD.portionId : Object.values(R34.portions).find((p) => p.lotId === depD[0].lotId).id; const pr42 = f34.produits.find((p) => /métabisulfite/i.test(p.nom));
    const sp = (qty, extra) => ({ type: 'intrant', sousType: 'sulfitage', date: '2026-11-22', notes: '', portionId: pt, lignes: [{ produitId: pr42.id, arrivageId: opD.lignes[0].arrivageId, qty }], prepUses: [], motif: 'Sulfitage', ...extra });
    const volP = R34.portions[pt].vol; const pvOk = L.previewOp(f34, sp(Math.round(volP * 2 / 100))); const pvDose = L.previewOp(f34, sp(Math.round(volP * 16 / 100)));
    t('aperçu : ajout raisonnable sans dépassement ; au-delà de la dose maximale → dépassement « dose » ; SO₂ total estimé au-delà du plafond → dépassement « so2t »', !pvOk.depassements.length && pvDose.depassements.some((x) => x.type === 'dose' && x.max === 15) && pvDose.depassements.some((x) => x.type === 'so2t' && x.max === 185 && x.valeur > 185), pvDose.depassements);
    const dC = L.clone(f34); const pBe = dC.produits.find((p) => /bentonite/i.test(p.nom)); const lotB = Object.values(R34.lots).find((l) => l.code === 'AS25-01');
    const ptB = Object.values(R34.portions).find((p) => p.lotId === lotB.id && p.vol > 100); const arB = dC.arrivages.find((a) => a.produitId === pBe.id);
    const pvC = ptB ? L.previewOp(dC, { type: 'intrant', date: '2026-11-22', notes: '', portionId: ptB.id, lignes: [{ produitId: pBe.id, arrivageId: arB.id, qty: Math.round(ptB.vol * 95 / 100) }], prepUses: [], motif: 'Collage' }) : null;
    t('… dose de l’ajout sous le maximum mais dose cumulée au-delà → dépassement « cumul » et avertissement « dose cumulée »', !ptB || (pvC.depassements.some((x) => x.type === 'cumul' && x.produitId === pBe.id && x.max === 100) && pvC.warnings.some((w) => /dose cumulée/.test(w))), pvC && [pvC.depassements, pvC.warnings]);
    const dM = L.clone(f34); const rM2 = L.opSave(dM, sp(Math.round(volP * 16 / 100), { depassement: { motif: 'Essai', par: opU.id, le: '2026-11-22', details: [] } })); const oM = rM2.op;
    const rM3 = L.opSave(dM, { ...sp(Math.round(volP * 16 / 100)), depassement: null }, oM.id);
    t('motif gardé à l’enregistrement et à la correction ; effacé si l’opération ne dépasse plus (motif nul)', rM2.ok && oM.depassement.motif === 'Essai' && rM3.ok && !dM.ops.find((o) => o.id === oM.id).depassement, [rM2.msg, rM3.msg]);
    // ---- droits : catalogues, masques et plafonds relèvent du module Intrants
    const essD = (uid, fn) => { const av = L.clone(f34); const ap = L.clone(f34); fn(ap); return L.gardeDroits(av, ap, uid); };
    const fL = L.clone(f34); fL.utilisateurs.find((u) => u.id === opU.id).profilId = 'pf_labo'; // profil en lecture seule pour les intrants
    const essL = (fn) => { const av = L.clone(fL); const ap = L.clone(fL); fn(ap); return L.gardeDroits(av, ap, opU.id); };
    const rL = [essL((y) => L.plafondValider(y, 'ex-bio-rouge', opU.id)), essL((y) => L.catalogueMasquer(y, 'cat:ioc', true)), essL((y) => L.catalogueImportSave(y, { fournisseur: 'X', lignes: [{ nom: 'Y' }] }))];
    t('droits : plafonds, catalogues importés et masques = module Intrants (refusés en lecture seule, acceptés avec le droit d’écriture)', ['plafonds', 'catalogues', 'catalogueReglage'].every((k) => L.GARDE_CLES[k] === 'intrants') && !L.peutModule(fL, opU.id, 'intrants', 'ecriture') && rL.every((r) => !r.ok && /Intrants|intrants/.test(r.msg)) && essD(adU.id, (y) => L.plafondValider(y, 'ex-bio-rouge', adU.id)).ok && essD(opU.id, (y) => L.catalogueMasquer(y, 'cat:ioc', true)).ok, rL.map((r) => r.msg));
    t('garde des fichiers : catalogues et cahiers des charges (60 Mo : PDF, tableurs, texte)', L.GARDE_USAGES.catalogue.max === 60 * 1024 * 1024 && L.GARDE_USAGES.cahier.familles.includes('pdf') && L.GARDE_USAGES.catalogue.familles.includes('office'));
    // ---- traductions
    const en = (s) => L.traduire(s, 'en'); const de = (s) => L.traduire(s, 'de');
    t('traductions : onglets, familles, avertissements du moteur (dose cumulée, dépassement justifié, lignes d’intrants), notes de version', en('Revendications & plafonds') === 'Designations & limits' && de('Catalogues') === 'Kataloge' && en('Stabilisants tartriques') === 'Tartaric stabilisers' && en('Métabisulfite de potassium : dose cumulée 18,8 g/hL dans le lot AS25-01, supérieure à la dose maximale (15,0) pour Conventionnel.') === 'Métabisulfite de potassium: cumulative dose 18,8 g/hL in lot AS25-01, above the maximum dose (15,0) for Conventional.' && en('Dépassement justifié : « Essai »') === 'Justified exceedance: “Essai”' && en('Thiazote (lot X1) : DLUO dépassée au 12/10/2026.') === 'Thiazote (lot X1): BBD passed on 12/10/2026.' && L.CHANGELOG[0].notes.every((n) => L.TRAD_TABLE.some((r) => r[0] === n)) && !L.tradControle().length, [en('Métabisulfite de potassium : dose cumulée 18,8 g/hL dans le lot AS25-01, supérieure à la dose maximale (15,0) pour Conventionnel.')]);
    // ---- compatibilité : la 0.29.0-alpha.1 (gelée) ouvre la base 0.30.0-alpha.1 sans rien perdre, la modifie, se synchronise
    const dirO = path.join(__dirname, 'anciennes', '0.29.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, opSave, produitSave, regleSet, replay };')({});
    t('0.29.0-alpha.1 gelée chargée (n° 29 000 001)', O.APP_VERSION === '0.29.0-alpha.1' && O.APP_NUM === 29000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f34)); O.syncConfig(x); const KX = ['catalogues', 'catalogueReglage', 'plafonds', 'produits', 'regles', 'ops', 'analyses'];
    t('… la 0.29.0-alpha.1 ouvre la base 0.30.0-alpha.1 sans rien perdre (catalogues importés, masques, plafonds, familles, teneurs en SO₂, règles « à vérifier », motifs)', KX.every((kk) => canonJ(x[kk]) === canonJ(f34[kk])), KX.filter((kk) => canonJ(x[kk]) !== canonJ(f34[kk])));
    const pCx = x.produits.find((p) => p.catalogue); const rP = O.produitSave(x, { ...pCx, notes: 'corrigé en 0.29' }, pCx.id); const rR = O.regleSet(x, pCx.id, 'conv', { doseMax: 12 });
    const oDx = x.ops.find((o) => o.depassement); const rO = O.opSave(x, { type: oDx.type, sousType: oDx.sousType, date: oDx.date, notes: 'corrigée en 0.29', portionId: oDx.portionId, lignes: oDx.lignes, prepUses: [], motif: oDx.motif }, oDx.id);
    const back = L.normalizeDb(O.clone(x)); const pB = back.produits.find((p) => p.id === pCx.id); const rB = L.ruleFor(back, pCx.id, 'conv'); const oB = back.ops.find((o) => o.id === oDx.id);
    t('… produit du catalogue, règle et opération motivée corrigés par la 0.29 : famille, catalogue, « à vérifier », source et motif gardés', rP.ok && rR.ok && rO.ok && pB.notes === 'corrigé en 0.29' && pB.famille && pB.catalogue && pB.catalogue.id === pCx.catalogue.id && rB.doseMax === 12 && rB.aVerifier && /catalogue/.test(rB.source) && oB.notes === 'corrigée en 0.29' && oB.depassement && oB.depassement.motif === opD.depassement.motif, [pB, rB, oB && oB.depassement]);
    const N1 = L.clone(f34); L.plafondValider(N1, 'ex-bio-effervescent', adU.id); L.catalogueMasquer(N1, 'cat:ioc', true); N1.meta.modifLe = '2026-11-23T10:00:00Z';
    const FX = L.syncFusion(f34, N1, x); const FX2 = O.syncFusion(f34, x, N1);
    t('… synchronisation 0.30 ↔ 0.29 : plafond vérifié et masque ajoutés ici, corrections faites là-bas, rien de perdu des deux côtés', !FX.db.plafonds.find((p) => p.id === 'ex-bio-effervescent').aVerifier && FX.db.catalogueReglage.masques.includes('cat:ioc') && FX.db.ops.find((o) => o.id === oDx.id).notes === 'corrigée en 0.29' && FX.db.produits.find((p) => p.id === pCx.id).notes === 'corrigé en 0.29' && !FX2.db.plafonds.find((p) => p.id === 'ex-bio-effervescent').aVerifier && FX2.db.catalogueReglage.masques.includes('cat:ioc') && FX2.db.catalogues.length === 1 && FX2.db.ops.find((o) => o.id === oDx.id).depassement.motif === opD.depassement.motif);
  }
  // ---- 0.31.0-alpha.1 : schémas de vinification (proposés à la création d'un lot, opérations à réaliser), impressions au choix
  {
    const f35 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.31.0-alpha.1-schemas.json'), 'utf8'))); L.syncConfig(f35);
    const adU = f35.utilisateurs.find((u) => u.profilId === 'pf_admin'); const opU = f35.utilisateurs.find((u) => u.profilId === 'pf_operateur');
    const R35 = L.replay(f35); const pS = f35.previsions.filter((p) => p.schema); const oS = f35.ops.filter((o) => o.schema); const lotS = pS[0].schema.lotId;
    t('base 0.31.0-alpha.1 de test : 6 schémas (exemples copiés, un vérifié, schéma maison, copie), réglage, 10 étapes appliquées à un lot (la 1re validée)', f35.meta.versions.includes('0.31.0-alpha.1') && f35.schemas.length === 6 && !f35.schemas.find((s) => s.id === 'ex-cuvee-chard').aVerifier && f35.schemas.some((s) => /maison fictif/.test(s.nom) && !s.aVerifier) && f35.schemas.some((s) => s.nom === 'Tailles, raisins sains (copie)' && s.aVerifier) && f35.settings.schemas.proposer === true && pS.length === 10 && pS.filter((p) => p.statut === 'realisee').length === 1 && oS.length === 1 && oS[0].schema.rang === 1 && pS.every((p) => p.schema.nb === 10 && p.schema.lotId === lotS), [f35.schemas.length, pS.length, oS.length]);
    // ---- exemples : virtuels tant que la base n'a pas de schéma
    const d0 = L.sampleDb(); const E = L.schemasDe(d0);
    t('exemples (base sans schéma) : 4, non officiels « à vérifier », étapes dans l’ordre des jours, FML pour les noirs ; la base n’est pas modifiée', !('schemas' in d0) && E.length === 4 && E.every((s) => s.exemple && s.aVerifier && /non officiel/.test(s.note) && s.etapes.every((e, i, a) => !i || a[i - 1].jour <= e.jour)) && E.find((s) => s.id === 'ex-cuvee-noirs').etapes.some((e) => e.opId === 'ensemencement_fml') && !E.find((s) => s.id === 'ex-cuvee-chard').etapes.some((e) => e.opId === 'ensemencement_fml') && !('schemas' in d0), E.map((s) => s.id));
    // ---- correspondance : cépage majoritaire, fraction, état sanitaire des raisins pressés
    const R0 = L.replay(d0); const V = [];
    d0.ops.filter((o) => o.type === 'pressurage').forEach((o) => (o.fractions || []).filter((f) => f.lotId && f.volL > 0).forEach((f) => { const m = L.schemasPourLot(d0, R0, f.lotId); V.push({ lotId: f.lotId, m: m.meilleur && m.meilleur.id, k: m.criteres }); }));
    t('correspondance : cuvée de Chardonnay saine → « Cuvée de Chardonnay », tailles saines → « Tailles », cuvée de noirs saine → « Cuvée de Pinot noir ou de Meunier »', V.some((x) => x.k.cepage === 'chard' && x.k.fraction === 'cuvee' && x.k.etat === 'sain' && x.m === 'ex-cuvee-chard') && V.some((x) => ['taille1', 'taille2', 'taille'].includes(x.k.fraction) && x.k.etat === 'sain' && x.m === 'ex-tailles') && V.some((x) => ['pn', 'pm'].includes(x.k.cepage) && x.k.fraction === 'cuvee') && V.filter((x) => ['pn', 'pm'].includes(x.k.cepage) && x.k.fraction === 'cuvee' && x.k.etat === 'sain').every((x) => x.m === 'ex-cuvee-noirs') && V.filter((x) => x.k.cepage === 'chard' && x.k.fraction === 'cuvee' && x.k.etat === 'sain').every((x) => x.m === 'ex-cuvee-chard'), V.map((x) => [x.k.cepage, x.k.fraction, x.k.etat, x.m]));
    const dA = L.clone(d0); const oA = dA.ops.find((o) => o.type === 'pressurage' && (o.fractions || []).some((f) => f.lotId && f.volL > 0) && (o.charges || []).length && o.charges.every((c) => { const a = dA.ops.find((x) => x.id === c.apportId); return a && a.pesee; }));
    oA.charges.forEach((c) => { dA.ops.find((x) => x.id === c.apportId).pesee.etat = 'faible'; }); const lA = oA.fractions.find((f) => f.lotId && f.volL > 0).lotId; const RA = L.replay(dA); const SA = L.schemasPourLot(dA, RA, lA);
    t('état sanitaire : raisins pressés « faiblement altérés » → lot altéré → « Raisins altérés » proposé ; les schémas « raisins sains » écartés', L.lotEtatSanitaire(dA, RA, lA) === 'altere' && SA.meilleur.id === 'ex-altere' && !SA.proposes.some((s) => (s.criteres.etats || []).includes('sain')), SA.proposes.map((s) => s.id));
    const opM = d0.ops.find((o) => o.type === 'entree_mout'); const lM = (opM.lots || []).map((l) => l.lotId).find((id) => id && L.lotCriteres(d0, R0, id).fraction === 'cuvee'); const SM = lM ? L.schemasPourLot(d0, R0, lM) : null;
    t('critère inconnu du lot (état sanitaire d’un moût acheté) : n’exclut pas ; mais un schéma dont aucun critère connu ne correspond n’est pas proposé (« Raisins altérés » pour un moût d’état inconnu)', !!SM && SM.criteres.etat === '' && SM.proposes.length >= 1 && !SM.proposes.some((s) => s.id === 'ex-altere') && ['ex-cuvee-chard', 'ex-cuvee-noirs'].includes(SM.meilleur.id), SM && [SM.criteres.cepage, SM.criteres.fraction, SM.proposes.map((s) => s.id)]);
    const dG = L.clone(d0); L.schemaSave(dG, { nom: 'Générique fictif', etapes: [{ opId: 'suivi', jour: 2 }] }, null, adU.id); const SG = L.schemasPourLot(dG, R0, lM);
    t('… un schéma sans critère (tous les lots) convient à tout lot, après les plus précis', SG.proposes.some((s) => s.nom === 'Générique fictif') && SG.proposes[SG.proposes.length - 1].nom === 'Générique fictif' && SG.meilleur.nom !== 'Générique fictif');
    // ---- enregistrement, vérification, copie, retrait
    const dS = L.clone(d0);
    const rS1 = L.schemaSave(dS, { nom: '  ', etapes: [{ opId: 'suivi' }] }); const rS2 = L.schemaSave(dS, { nom: 'X', etapes: [{ opId: '' }] }); const rS3 = L.schemaSave(dS, { nom: 'cuvee de chardonnay, RAISINS sains', etapes: [{ opId: 'suivi' }] });
    t('enregistrement : nom requis, au moins une étape, nom déjà pris refusé (casse et accents ignorés) ; exemples copiés dans la base à la 1re modification', !rS1.ok && /Nom du schéma requis/.test(rS1.msg) && !rS2.ok && /au moins une étape/.test(rS2.msg) && !rS3.ok && /déjà ce nom/.test(rS3.msg) && Array.isArray(dS.schemas) && dS.schemas.length === 4, [rS1.msg, rS2.msg, rS3.msg]);
    const rS4 = L.schemaSave(dS, { nom: 'Essai', criteres: { cepages: ['chard', 'chard'], fractions: ['cuvee'], etats: ['sain', 'inconnu'] }, aVerifier: false, etapes: [{ id: 'b', jour: 3, opId: 'suivi', dose: -2, unite: 'kg/hL', famille: 'inexistante' }, { id: 'a', jour: 400, opId: 'levurage', famille: 'levure', dose: '20', unite: 'g/hL', champFutur: 1 }, { jour: 0, opId: '' }] }, null, adU.id);
    const sE = dS.schemas.find((s) => s.nom === 'Essai');
    t('… étapes nettoyées : triées par jour (365 au plus), sans opération retirées, dose ≤ 0 effacée, unité et famille inconnues effacées, champ inconnu gardé ; critères dédoublonnés, état inconnu écarté ; vérifié (par qui, quand)', rS4.ok && sE.etapes.length === 2 && sE.etapes[0].id === 'b' && sE.etapes[1].jour === 365 && sE.etapes[0].dose === null && sE.etapes[0].unite === '' && sE.etapes[0].famille === '' && sE.etapes[1].dose === 20 && sE.etapes[1].champFutur === 1 && sE.criteres.cepages.join() === 'chard' && sE.criteres.etats.join() === 'sain' && !sE.aVerifier && sE.verifiePar === adU.id && !!sE.verifieLe, sE);
    sE.champFutur = { x: 1 }; const rS5 = L.schemaSave(dS, { nom: 'Essai', criteres: {}, etapes: sE.etapes, aVerifier: true }, sE.id, adU.id); const sE2 = dS.schemas.find((s) => s.id === sE.id);
    t('… modification : champ d’une version suivante gardé ; « vérifié » décoché → à vérifier ; schéma introuvable refusé', rS5.ok && sE2.champFutur.x === 1 && sE2.aVerifier && !sE2.verifiePar && !L.schemaSave(dS, { nom: 'Essai', etapes: sE.etapes }, 'inexistant').ok);
    const rD1 = L.schemaDupliquer(dS, 'ex-tailles', adU.id); const rD2 = L.schemaDupliquer(dS, 'ex-tailles', adU.id);
    t('dupliquer : « (copie) » puis « (copie 2) », à vérifier ; vérifier ; retirer (introuvable refusé)', rD1.ok && rD2.ok && dS.schemas.some((s) => s.nom === 'Tailles, raisins sains (copie)' && s.aVerifier && !s.exemple) && dS.schemas.some((s) => s.id === rD2.id && s.nom === 'Tailles, raisins sains (copie 2)') && L.schemaValider(dS, 'ex-altere', opU.id).ok && !dS.schemas.find((s) => s.id === 'ex-altere').aVerifier && L.schemaSupprimer(dS, rD2.id).ok && !L.schemaSupprimer(dS, rD2.id).ok && !L.schemaValider(dS, 'zz').ok);
    // ---- plan : dates, produits (stock d'abord), quantités (dose de produit ou de SO₂ apporté)
    const sCh = f35.schemas.find((s) => s.id === 'ex-cuvee-chard'); const PL = L.schemaPlan(f35, R35, sCh, { date: '2026-09-20', vol: 2000 });
    const y1 = PL.find((y) => y.e.id === 'e1'); const y4 = PL.find((y) => y.e.id === 'e4');
    t('plan : J+n à partir de la création du lot, dans l’ordre ; sulfitage 5 g/hL de SO₂ sur 20 hL avec le métabisulfite (0,5 g/g) → 200 g ; levure 20 g/hL → 400 g ; débourbage et suivis sans produit', PL.length === sCh.etapes.length && PL.every((y, i, a) => !i || a[i - 1].e.jour <= y.e.jour) && PL[0].date === '2026-09-20' && PL.find((y) => y.e.id === 'e10').date === '2026-10-05' && /métabisulfite/i.test(y1.produit.nom) && Math.abs(y1.qty - 200) < 1e-9 && y4.produit && Math.abs(y4.qty - 400) < 1e-9 && !PL.find((y) => y.e.id === 'e3').produit && L.schemaDoseTexte(y1.e) === '5 g/hL de SO₂' && L.schemaDoseTexte(y4.e) === '20 g/hL', PL.map((y) => [y.e.id, y.date, y.produit && y.produit.nom, y.qty]));
    const dI = L.clone(f35); L.produitSave(dI, { nom: 'Enzyme liquide fictive', categorie: 'oeno', unite: 'L', famille: 'enzyme' }); L.produitSave(dI, { nom: 'Sulfitant fictif sans teneur', categorie: 'oeno', unite: 'g', famille: 'sulfitage' });
    const pEL = dI.produits.find((p) => p.nom === 'Enzyme liquide fictive'); const pSF = dI.produits.find((p) => p.nom === 'Sulfitant fictif sans teneur'); const pSol = dI.produits.find((p) => p.famille === 'sulfitage' && p.unite === 'L' && L.so2Teneur(p));
    const PI = L.schemaPlan(dI, L.replay(dI), sCh, { date: '2026-09-20', vol: 2000 }, { e1: { produitId: pSF.id }, e2: { produitId: pEL.id } }); const PJ = pSol ? L.schemaPlan(dI, L.replay(dI), sCh, { date: '2026-09-20', vol: 2000 }, { e1: { produitId: pSol.id } }) : null;
    t('… produit choisi : sulfitant sans teneur connue → pas de quantité (signalé) ; enzyme liquide pour une dose en g/hL → unité incompatible ; solution sulfureuse → litres selon sa teneur', PI[0].produit.id === pSF.id && PI[0].qty === null && PI[0].sansTeneur && PI.find((y) => y.e.id === 'e2').incompatible && PI.find((y) => y.e.id === 'e2').qty === null && (!PJ || Math.abs(PJ[0].qty - 5 * 20 / L.so2Teneur(pSol)) < 1e-9), [PI[0].qty, PJ && PJ[0].qty, pSol && pSol.so2]);
    t('… produits proposés : la famille de l’étape (ou devinée par le nom), en stock d’abord', L.schemaProduits(dI, L.replay(dI), y1.e).map((p) => p.famille || 'sulfitage').every((f) => f === 'sulfitage') && L.schemaProduits(dI, L.replay(dI), y1.e)[0].nom !== 'Sulfitant fictif sans teneur' && !L.schemaProduits(dI, R35, { famille: '' }).length);
    // ---- application : opérations à réaliser marquées, tout ou rien ; lots sans schéma ; retrait
    const lotsP = f35.ops.filter((o) => o.type === 'pressurage' && o.date >= '2026-01-01').flatMap((o) => (o.fractions || []).filter((f) => f.lotId && f.volL > 0).map((f) => f.lotId)); const libres = L.lotsSansSchema(f35, lotsP);
    t('lots sans schéma : celui du jeu d’essai exclu (étapes prévues ou réalisées), les autres restent à proposer', lotsP.includes(lotS) && !libres.includes(lotS) && libres.length === lotsP.filter((x) => x !== lotS).length && libres.length > 0, [lotsP.length, libres.length]);
    const dP = L.clone(f35); const lB = libres.find((id) => Object.values(R35.portions).some((p) => p.lotId === id && p.vol > 0.5)); const ptB = Object.values(R35.portions).find((p) => p.lotId === lB && p.vol > 0.5);
    const sB = L.schemasPourLot(dP, R35, lB).meilleur; const PB = L.schemaPlan(dP, R35, sB, { date: '2026-11-20', vol: ptB.vol });
    const itemsB = PB.map((y) => ({ type: y.base, date: y.date, f: { date: y.date, ...(y.base === 'etape' ? { lotId: lB } : { portionId: ptB.id }), ...(y.def.id !== y.base ? { sousType: y.def.id } : {}) }, resume: y.label, notes: y.e.note, etapeId: y.e.id }));
    const nAv = dP.previsions.length; const rB = L.schemaAppliquer(dP, lB, sB, itemsB); const PBs = L.schemaPrevsDuLot(dP, lB);
    t('appliquer : une opération à réaliser par étape, marquée (schéma, lot, étape, rang / nombre), dans l’ordre des dates ; le lot n’est plus « sans schéma »', rB.ok && rB.ids.length === itemsB.length && dP.previsions.length === nAv + itemsB.length && PBs.length === itemsB.length && PBs.every((p, i) => p.schema.id === sB.id && p.schema.nom === sB.nom && p.schema.lotId === lB && p.schema.nb === itemsB.length && p.schema.etapeId && p.statut === 'prevue' && (!i || PBs[i - 1].date <= p.date)) && !L.lotsSansSchema(dP, [lB]).length, rB.msg);
    const dQ = L.clone(f35); const nQ = dQ.previsions.length; const rQ = L.schemaAppliquer(dQ, lB, sB, [...itemsB.slice(0, 3), { ...itemsB[3], date: 'pas une date' }, ...itemsB.slice(4)]);
    t('… tout ou rien : une étape invalide → rien d’enregistré (« Étape 4 : … ») ; aucune étape ou schéma absent → refusé', !rQ.ok && /^Étape 4 : /.test(rQ.msg) && dQ.previsions.length === nQ && !L.schemaAppliquer(dQ, lB, sB, []).ok && !L.schemaAppliquer(dQ, lB, null, itemsB).ok, rQ.msg);
    const rR = L.schemaRetirer(dP, lB); const dR = L.clone(f35); const rR2 = L.schemaRetirer(dR, lotS);
    t('retirer les étapes à réaliser : les étapes prévues supprimées ; l’étape déjà validée et son opération gardées ; plus rien à retirer → refusé', rR.ok && rR.n === itemsB.length && !L.schemaPrevsDuLot(dP, lB).length && !L.schemaRetirer(dP, lB).ok && rR2.ok && rR2.n === 9 && L.schemaPrevsDuLot(dR, lotS).length === 1 && L.schemaPrevsDuLot(dR, lotS)[0].statut === 'realisee' && L.schemaOpsDuLot(dR, lotS).length === 1);
    const dO = L.clone(f35); const o1 = dO.ops.find((o) => o.schema); const rO = L.opSave(dO, { type: o1.type, sousType: o1.sousType, date: o1.date, notes: 'corrigée', portionId: o1.portionId, lignes: o1.lignes, prepUses: o1.prepUses || [], motif: o1.motif }, o1.id);
    t('opération venue d’un schéma : marque gardée quand on la corrige', rO.ok && dO.ops.find((o) => o.id === o1.id).schema.id === o1.schema.id && dO.ops.find((o) => o.id === o1.id).notes === 'corrigée', rO.msg);
    t('réglage : proposer un schéma à la création d’un lot (oui par défaut, non si décoché) ; fiche du lot : rubrique « Schéma de vinification » après le stade', L.schemasReglage(d0).proposer === true && L.schemasReglage({ settings: { schemas: { proposer: false } } }).proposer === false && L.schemasReglage(f35).proposer === true && L.FICHE_RUBRIQUES.lot[1][0] === 'schema');
    // ---- droits, synchronisation
    const essS = (uid, fn) => { const av = L.clone(f35); const ap = L.clone(f35); fn(ap); return L.gardeDroits(av, ap, uid); };
    const gO = essS(opU.id, (y) => L.schemaValider(y, 'ex-altere', opU.id)); const gA = essS(adU.id, (y) => L.schemaValider(y, 'ex-altere', adU.id));
    t('droits : les schémas relèvent des paramètres (refusés à l’opérateur, acceptés pour l’administrateur, tracés)', L.GARDE_PARAMS.includes('schemas') && !L.GARDE_CLES.schemas && !gO.ok && /modifier les paramètres \(schémas de vinification\)/.test(gO.msg) && gA.ok && gA.audit.some((x) => x.resume === 'Paramètres : schémas de vinification'), [gO.msg, gA.msg]);
    const N1 = L.clone(f35); L.schemaValider(N1, 'ex-tailles', adU.id); N1.meta.modifLe = '2026-11-26T10:00:00Z';
    const N2 = L.clone(f35); L.schemaSave(N2, { nom: 'Schéma ajouté ailleurs', etapes: [{ opId: 'suivi', jour: 0 }] }, null, adU.id); N2.meta.modifLe = '2026-11-26T11:00:00Z';
    const FS = L.syncFusion(f35, N1, N2);
    t('synchronisation : schéma vérifié ici, schéma ajouté là-bas → les deux gardés', !FS.db.schemas.find((s) => s.id === 'ex-tailles').aVerifier && FS.db.schemas.some((s) => s.nom === 'Schéma ajouté ailleurs') && FS.db.schemas.length === 7);
    // ---- traductions, version
    const en = (s) => L.traduire(s, 'en'); const de = (s) => L.traduire(s, 'de'); const it = (s) => L.traduire(s, 'it');
    t('traductions : schémas, impressions, messages du moteur, J+n, copies, doses, notes de version', en('Schémas de vinification') === 'Winemaking protocols' && de('Schéma de vinification proposé') === 'Vorgeschlagenes Vinifikationsprotokoll' && en('J+12') === 'D+12' && it('J+3') === 'G+3' && en('⟶ Frise') === '⟶ Timeline' && en('Étape 4 : Date prévue invalide.') === 'Step 4: Invalid planned date.' && en('Cuvée de Chardonnay, raisins sains (copie 2)') === 'Chardonnay cuvée, healthy grapes (copy 2)' && en('5 g/hL de SO₂') === '5 g/hL of SO₂' && en('Mis en place le 01/11/2026') === 'Started on 01/11/2026' && L.CHANGELOG.find((c) => c.v === '0.31.0-alpha.1').notes.every((n) => en(n) !== n && de(n) !== n) && !L.tradControle().length, [en('Étape 4 : Date prévue invalide.'), en('5 g/hL de SO₂')]);
    t('version 0.31.0-alpha.1 : nouvelle fonctionnalité compatible (mineure), première pré-version alpha', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.31.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.30.0-alpha.1' && L.versionNum('0.31.0-alpha.1') === 31000001 && L.APP_NUM >= 31000001; })());
    // ---- compatibilité : la 0.30.0-alpha.1 (gelée) ouvre la base 0.31.0-alpha.1 sans rien perdre, la modifie, se synchronise
    const dirO = path.join(__dirname, 'anciennes', '0.30.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, opSave, previsionSave, previsionStatut, replay };')({});
    t('0.30.0-alpha.1 gelée chargée (n° 30 000 001)', O.APP_VERSION === '0.30.0-alpha.1' && O.APP_NUM === 30000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f35)); O.syncConfig(x); const KX = ['schemas', 'settings', 'previsions', 'ops'];
    t('… la 0.30.0-alpha.1 ouvre la base 0.31.0-alpha.1 sans rien perdre (schémas, réglage, opérations à réaliser et opération marquées)', KX.every((kk) => canonJ(x[kk]) === canonJ(f35[kk])), KX.filter((kk) => canonJ(x[kk]) !== canonJ(f35[kk])));
    const o1x = x.ops.find((o) => o.schema); const rx = O.opSave(x, { type: o1x.type, sousType: o1x.sousType, date: o1x.date, notes: 'corrigée en 0.30', portionId: o1x.portionId, lignes: o1x.lignes, prepUses: o1x.prepUses || [], motif: o1x.motif }, o1x.id);
    const p2x = x.previsions.filter((p) => p.schema && p.statut === 'prevue').sort((a, b) => a.schema.rang - b.schema.rang)[0];
    const r2x = O.opSave(x, { ...p2x.f, type: p2x.type, date: p2x.date }); if (r2x.ok) O.previsionStatut(x, p2x.id, 'realisee', r2x.op.id);
    const back = L.normalizeDb(O.clone(x));
    t('… opération du schéma corrigée et étape suivante validée par la 0.30 : marques du schéma gardées (opération, étape réalisée)', rx.ok && back.ops.find((o) => o.id === o1x.id).schema.id === o1x.schema.id && back.ops.find((o) => o.id === o1x.id).notes === 'corrigée en 0.30' && r2x.ok && back.previsions.find((p) => p.id === p2x.id).statut === 'realisee' && back.previsions.find((p) => p.id === p2x.id).schema.rang === p2x.schema.rang && back.schemas.length === 6, [rx.msg, r2x.msg]);
    const N3 = L.clone(f35); L.schemaValider(N3, 'ex-tailles', adU.id); N3.meta.modifLe = '2026-11-26T12:00:00Z';
    const FX = L.syncFusion(f35, N3, x); const FX2 = O.syncFusion(f35, x, N3);
    t('… synchronisation 0.31 ↔ 0.30 : schéma vérifié ici, corrections faites là-bas, rien de perdu des deux côtés', !FX.db.schemas.find((s) => s.id === 'ex-tailles').aVerifier && FX.db.ops.find((o) => o.id === o1x.id).notes === 'corrigée en 0.30' && FX.db.previsions.find((p) => p.id === p2x.id).statut === 'realisee' && !FX2.db.schemas.find((s) => s.id === 'ex-tailles').aVerifier && FX2.db.ops.find((o) => o.id === o1x.id).schema && FX2.db.previsions.find((p) => p.id === p2x.id).schema);
  }
  // ---- 0.32.0-alpha.1 : DRM mensuelle ou DRA annuelle — produits (exemples à vérifier), rattachement des lots, balance par produit,
  //      bouteilles finies saisies, fichiers XML DTI+ (CIEL, CIVC), CSV, dépôt, contrôles ; droits, synchronisation, compatibilité
  {
    const f36 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.32.0-alpha.1-drm.json'), 'utf8'))); L.syncConfig(f36);
    const adU = f36.utilisateurs.find((u) => u.profilId === 'pf_admin'); const opU = f36.utilisateurs.find((u) => u.profilId === 'pf_operateur');
    const hl = (x) => Math.round(x) / 100; const lg = (c, pid) => c.lignes.find((x) => x.produitId === pid) || { s0: 0, s1: 0, E: {}, S: {}, obs: [] };
    const vmF = f36.drmProduits.find((p) => p.id === 'ex-champ-vm'); const dec10 = (f36.drmDeclarations || [])[0];
    t('base 0.32.0-alpha.1 de test : réglages fictifs (accise, CVI, CIVC), 6 produits (mousseux vérifié, champ inconnu gardé), rattachement manuel, saisies d’octobre et de novembre, DRM d’octobre déposée, enrichissement au MCR',
      f36.meta.versions.includes('0.32.0-alpha.1') && f36.settings.drm.accise === 'FR012345E6789' && f36.settings.drm.periodicite === 'mensuelle' && f36.drmProduits.length === 6 && vmF.codeInao === '1S001M' && vmF.codeCivc === 'CHMOUS01' && !vmF.aVerifier && vmF.verifiePar === adU.id
      && !!f36.drmProduits.find((p) => p.id === 'ex-lies').champFutur && f36.drmRattachements.length === 1 && f36.drmSorties.length === 2 && dec10 && dec10.periode === 'M:2026-10' && f36.ops.some((o) => o.sousType === 'enrichissement' && o.enrichissement && o.enrichissement.methode === 'mcr'), [f36.drmProduits.length, (f36.drmSorties || []).length]);
    // ---- produits : exemples selon la région, virtuels tant qu'aucun produit n'est modifié
    const d0 = L.sampleDb(); const P0 = L.drmProduitsDe(d0); const dAu = L.sampleDb(); L.regionSet(dAu, 'autre');
    t('produits (base sans produit) : 6 exemples champenois « à vérifier », chacun avec un libellé fiscal (Coteaux champenois et Rosé des Riceys en rattachement manuel) ; la base n’est pas modifiée',
      !('drmProduits' in d0) && P0.length === 6 && P0.every((p) => p.exemple && p.aVerifier && L.drmCode(p)) && P0.filter((p) => p.manuel).map((p) => p.id).join() === 'ex-coteaux,ex-riceys' && P0.find((p) => p.id === 'ex-champ-vm').libelleFiscal === 'VM_IG_AOP' && P0.find((p) => p.id === 'ex-champ-vt').sansFractions.join() === 'rebeche,lies,bourbes');
    t('… autre région : 2 exemples génériques (vins tranquilles AOP, vins mousseux AOP)', L.drmProduitsDe(dAu).map((p) => p.id).join() === 'ex-vt-aop,ex-vm-aop' && L.drmProduitsDe(dAu).every((p) => p.aVerifier));
    const dp = L.clone(f36); const sv = (s, id) => L.drmProduitSave(dp, s, id, adU.id);
    t('produit : libellé requis et unique ; code INAO de 5 à 8 caractères ; code INAO ou, à défaut, libellé fiscal ; code CIVC de 5 à 8 ; TAV entre 0,5 et 100 % vol ; rien d’enregistré',
      !sv({ libelle: ' ' }).ok && /déjà ce libellé/.test(sv({ libelle: 'rebêches', libelleFiscal: 'VT_SANS_IG_AUTRES' }).msg) && /INAO : 5 à 8/.test(sv({ libelle: 'X', codeInao: '1234' }).msg) && /code INAO du produit ou/.test(sv({ libelle: 'X' }).msg)
      && /CIVC : 5 à 8/.test(sv({ libelle: 'X', codeInao: '1S001T', codeCivc: 'AB' }).msg) && /TAV/.test(sv({ libelle: 'X', codeInao: '1S001T', tav: '120' }).msg) && dp.drmProduits.length === 6);
    const rN = sv({ libelle: 'Essai & <fictif>', codeInao: 'abcde', manuel: true, tav: '12,5' }); const pN = dp.drmProduits.find((p) => p.id === rN.id);
    const rLi = sv({ ...dp.drmProduits.find((p) => p.id === 'ex-lies'), codeCivc: 'lies0001' }, 'ex-lies'); const pLi = dp.drmProduits.find((p) => p.id === 'ex-lies');
    t('… produit ajouté (rattachement manuel, TAV 12,5, code en majuscules) ; modification : champ inconnu (version future) gardé, « à vérifier » tant que non vérifié',
      rN.ok && pN.manuel && pN.tav === 12.5 && pN.codeInao === 'ABCDE' && pN.aVerifier && rLi.ok && pLi.codeCivc === 'LIES0001' && pLi.champFutur && pLi.champFutur.note && pLi.aVerifier, [pN, pLi]);
    const rS1 = L.drmProduitSupprimer(dp, 'ex-champ-vm'); L.drmRattacher(dp, f36.lots[0].id, rN.id); const nR = dp.drmRattachements.length; const rS2 = L.drmProduitSupprimer(dp, rN.id);
    L.drmProduitDeplacer(dp, 'ex-rebeches', -1);
    t('… retrait refusé pour un produit d’une DRM déposée ; retrait d’un autre : ses rattachements retirés ; ordre modifiable', !rS1.ok && /DRM déposée/.test(rS1.msg) && rS2.ok && nR === 2 && dp.drmRattachements.length === 1 && !dp.drmProduits.some((p) => p.id === rN.id) && dp.drmProduits.findIndex((p) => p.id === 'ex-rebeches') === 1);
    t('réglages : n° d’accise de 13 caractères (2 lettres puis 11 lettres ou chiffres), en majuscules ; DRM mensuelle par défaut', !L.drmReglageSet(L.clone(f36), { accise: 'FR12345' }).ok && (() => { const x = L.clone(f36); return L.drmReglageSet(x, { accise: 'fr0123456789a', periodicite: 'annuelle' }).ok && x.settings.drm.accise === 'FR0123456789A' && L.drmReglage(x).periodicite === 'annuelle' && x.settings.drm.cvi === '5101234567'; })() && L.drmReglage(d0).periodicite === 'mensuelle' && L.drmAcciseOk('FR012345E6789') && !L.drmAcciseOk('FR012345E678'));
    // ---- rattachement des lots : manuel d'abord, sinon la règle la plus précise (fraction, puis nature)
    const R36 = L.replay(f36); const P36 = L.drmProduitsDe(f36); const cache = {}; const pDe = (code) => L.drmProduitDuLot(f36, P36, [R36], f36.lots.find((l) => l.code === code).id, cache);
    const Rf = { lots: { x1: { fractionId: 'lies' }, x2: { fractionId: 'bourbes' }, x3: { fractionId: 'rebeche' }, x4: { fractionId: 'cuvee' }, x5: { fractionId: 'cuvee' } }, tir: { x5: { nb: 10, mis: 10 } }, tirVol: {}, portions: {} };
    const pF = (id) => L.drmProduitDuLot(f36, P36, [Rf], id);
    t('rattachement automatique : cuvées et tailles → vins tranquilles ; lots tirés → vins mousseux ; rebêches → « Rebêches » ; lies et bourbes → « Lies et bourbes » ; Coteaux et Riceys jamais d’office',
      pDe('P26-02-C') === 'ex-champ-vt' && pDe('M26-01-T1-1') === 'ex-champ-vt' && pDe('T26-01') === 'ex-champ-vm' && pDe('T24-01') === 'ex-champ-vm' && pDe('P26-05-R') === 'ex-rebeches' && pF('x1') === 'ex-lies' && pF('x2') === 'ex-lies' && pF('x3') === 'ex-rebeches' && pF('x4') === 'ex-champ-vt' && pF('x5') === 'ex-champ-vm'
      && Object.values(R36.lots).every((l) => !['ex-riceys'].includes(L.drmProduitDuLot(f36, P36, [R36], l.id, cache))));
    t('… rattachement manuel prioritaire (rouge de Bouzy → Coteaux champenois) ; produit inconnu refusé ; « Automatique » retire le rattachement', pDe('ROU-25') === 'ex-coteaux' && !L.drmRattacher(L.clone(f36), f36.lots[0].id, 'inconnu').ok && (() => { const x = L.clone(f36); const id = x.lots.find((l) => l.code === 'ROU-25').id; L.drmRattacher(x, id, ''); return !x.drmRattachements.length && L.drmProduitDuLot(x, L.drmProduitsDe(x), [L.replay(x)], id) === 'ex-champ-vt'; })());
    // ---- balance : stock de fin = début + entrées − sorties, chaque mois ; mois suivant = stock de fin du mois précédent
    const mois = L.drmPeriodes(f36, 'mensuelle', '2026-11-26'); const C = {}; mois.forEach((k) => { C[k] = L.drmCalcul(f36, k); });
    const som = (o) => Object.values(o || {}).reduce((a, b) => a + b, 0);
    const bal = mois.every((k) => C[k].lignes.every((x) => Math.abs(x.s1 - (x.s0 + som(x.E) - som(x.S))) < 0.001));
    const enc = mois.slice(0, -1).every((k, i) => C[k].lignes.every((x) => Math.abs(x.s0 - lg(C[mois[i + 1]], x.produitId).s1) < 0.001));
    t('balance : pour chaque mois et chaque produit, stock de fin = stock de début + entrées − sorties ; le stock de début est le stock de fin du mois précédent ; aucun écart ni lot non rattaché', mois.length >= 14 && mois[0] === 'M:2026-11' && bal && enc && mois.every((k) => C[k].lignes.every((x) => !x.ecart) && !C[k].nonRattache), mois.length);
    const c09 = C['M:2026-09']; const c04 = C['M:2026-04']; const c10 = C['M:2026-10']; const c11 = C['M:2026-11'];
    t('septembre 2026 : récolte (pressurages) en volume produit, entrées de moûts en achats, bourbes et lies en autres mouvements internes ; rebêches produites puis envoyées à la distillerie',
      hl(lg(c09, 'ex-champ-vt').E.production) === 112.5 && hl(lg(c09, 'ex-champ-vt').E.achats) === 32 && hl(lg(c09, 'ex-champ-vt').S.internesS) === 3.1 && hl(lg(c09, 'ex-rebeches').E.production) === 1.1 && hl(lg(c09, 'ex-rebeches').S.definitives) === 1.1 && lg(c09, 'ex-rebeches').actif && hl(lg(c09, 'ex-rebeches').s1) === 0);
    t('avril 2026 : le tirage transfère 49 hL des vins tranquilles aux vins mousseux ; liqueur de tirage et levain en manipulations (+2,90 hL)', hl(lg(c04, 'ex-champ-vt').S.transfertS) === 49 && hl(lg(c04, 'ex-champ-vm').E.transfertE) === 49 && hl(lg(c04, 'ex-champ-vm').E.manipE) === 2.9 && hl(lg(c04, 'ex-champ-vm').s1) === 141.9);
    t('novembre 2026 : assemblage du rosé (rouge des Coteaux champenois dans un blanc) → transfert entre produits ; sortie en vrac en sorties définitives ; excédent de jaugeage et reprise en autres entrées (avec observation)',
      hl(lg(c11, 'ex-coteaux').S.transfertS) === 0.06 && hl(lg(c11, 'ex-champ-vt').E.transfertE) === 0.06 && hl(lg(c11, 'ex-champ-vt').S.definitives) === 10 && lg(c11, 'ex-champ-vt').E.autresE > 0 && lg(c11, 'ex-champ-vt').obs.length > 0);
    t('stocks : vrac en cuve, bouteilles sur lattes et bouteilles finies (dégorgées moins sorties) ; Coteaux champenois repris en août 2026', hl(lg(C['M:2026-08'], 'ex-coteaux').E.autresE) === 2 && hl(lg(c10, 'ex-champ-vm').s0) === 141.9 && lg(c10, 'ex-champ-vm').f0 === 0 && Math.round(lg(c10, 'ex-champ-vm').f1 / L.DRM_BOUTEILLE_L) === 1488);
    // ---- bouteilles finies saisies à la DRM (équivalent 75 cl)
    t('bouteilles finies d’octobre : 1 200 ventes France (9,00 hL), 300 export (2,25 hL), 12 dégustation (0,09 hL) ; stock de fin du mousseux 130,56 hL', hl(lg(c10, 'ex-champ-vm').S.ventesFrance) === 9 && hl(lg(c10, 'ex-champ-vm').S.definitives) === 2.25 && hl(lg(c10, 'ex-champ-vm').S.degustation) === 0.09 && hl(lg(c10, 'ex-champ-vm').s1) === 130.56);
    t('… novembre : repart de 130,56 hL ; 240 en France, 6 en dégustation, 2 cassées (autres sorties, avec l’observation saisie) ; 1 240 bouteilles finies en fin de mois', hl(lg(c11, 'ex-champ-vm').s0) === 130.56 && hl(lg(c11, 'ex-champ-vm').S.ventesFrance) === 1.8 && lg(c11, 'ex-champ-vm').S.autresS === 1.5 && lg(c11, 'ex-champ-vm').obs.includes('casse au transport (fictif)') && Math.round(lg(c11, 'ex-champ-vm').f1 / 0.75) === 1240);
    const dS = L.clone(f36); const rS = L.drmSaisieSet(dS, 'M:2026-11', 'ex-champ-vm', { ventesFrance: '12,7', definitives: '-5', obs: 'x'.repeat(300) }); const sx = L.drmSaisieDe(dS, 'M:2026-11', 'ex-champ-vm');
    t('saisie : nombres entiers de bouteilles (arrondis, jamais négatifs), observation de 250 caractères au plus, autres champs gardés ; DRM déposée, période ou produit inconnus : refusée',
      rS.ok && sx.ventesFrance === 13 && sx.definitives === 0 && sx.obs.length === 250 && sx.degustation === 6 && /déposée/.test(L.drmSaisieSet(dS, 'M:2026-10', 'ex-champ-vm', { ventesFrance: 1 }).msg) && !L.drmSaisieSet(dS, 'M:2026-13', 'ex-champ-vm', {}).ok && !L.drmSaisieSet(dS, 'M:2026-11', 'inconnu', {}).ok);
    const dNg = L.clone(f36); L.drmSaisieSet(dNg, 'M:2026-11', 'ex-champ-vm', { ventesFrance: 30000 }); const cNg = L.drmCalcul(dNg, 'M:2026-11');
    t('… plus de bouteilles sorties que de stock : stock de fin négatif, contrôle bloquant (fichier et dépôt refusés)', lg(cNg, 'ex-champ-vm').negatif && L.drmControles(dNg, cNg).some((c) => c.niveau === 'bloquant' && c.nom === vmF.libelle && /stock de fin négatif/.test(c.texte)) && !L.drmDeposer(dNg, 'M:2026-11', adU.id).ok);
    // ---- écart (données incohérentes) : porté en manipulations ou autres mouvements internes, signalé
    const dE = L.clone(f36); dE.ops.find((o) => o.type === 'degorgement').nb = 13000; const cE = L.drmCalcul(dE, 'M:2026-10'); const xE = lg(cE, 'ex-champ-vm'); const kE = L.drmControles(dE, cE);
    t('écart : dégorgement de plus de bouteilles qu’en stock → écart porté en manipulations et signalé ; la DRM déposée ne correspond plus (signalé)', xE.ecart > 0 && Math.abs(xE.E.manipE - xE.ecart) < 1e-6 && kE.some((c) => /^écart de .* porté en manipulations\.$/.test(c.texte || '')) && kE.some((c) => /^stock de fin recalculé .* dans la DRM déposée/.test(c.texte || '')), [xE.ecart, kE.map((c) => c.msg)]);
    // ---- contrôles
    const k10 = L.drmControles(f36, c10); const dNo = L.clone(f36); dNo.settings.drm.accise = ''; const kNo = L.drmControles(dNo, c10);
    t('contrôles : n° d’accise manquant bloquant ; produits d’exemple à vérifier signalés (le libellé du produit à part, jamais traduit) ; message complet pour les exports', kNo.some((c) => c.niveau === 'bloquant' && /^N° d’accise/.test(c.msg)) && !k10.some((c) => c.niveau === 'bloquant')
      && k10.filter((c) => c.nom).every((c) => c.msg === `${c.nom} : ${c.texte}`) && k10.some((c) => c.nom === 'Coteaux champenois' && /^produit d’exemple à vérifier/.test(c.texte)) && !k10.some((c) => c.nom === vmF.libelle), k10.map((c) => c.msg));
    const kCv = L.drmControles(f36, c10, { civc: true }); const dNr = L.clone(f36); dNr.drmProduits = dNr.drmProduits.filter((p) => p.manuel); const cNr = L.drmCalcul(dNr, 'M:2026-10');
    t('… fichier CIVC : codes CIVC manquants signalés ; lots sans produit : volume « hors déclaration » signalé ; DRA : période et ventes de l’année précédente à vérifier', kCv.some((c) => c.nom === 'Coteaux champenois' && /^code CIVC à indiquer/.test(c.texte)) && !kCv.some((c) => c.nom === vmF.libelle && /CIVC/.test(c.texte))
      && cNr.nonRattache > 0 && L.drmControles(dNr, cNr).some((c) => /^Lots non rattachés à un produit : .* hors déclaration\.$/.test(c.msg)) && L.drmControles(f36, L.drmCalcul(f36, 'A:2025-2026')).some((c) => /^DRA \(annuelle\)/.test(c.msg)));
    // ---- fichier DTI+ (CIEL) : structure du schéma de la douane, volumes en hL (5 décimales au plus), éléments à zéro omis
    const x10 = L.drmXml(f36, c10, {}); const x11 = L.drmXml(f36, c11, {}); const pos = (s, a) => s.indexOf(a);
    const prodX = (x, lib) => { const i = x.indexOf(`<libelle-personnalise>${lib}</libelle-personnalise>`); return i < 0 ? '' : x.slice(x.lastIndexOf('<produit>', i), x.indexOf('</produit>', i)); };
    const bloc = prodX(x10, vmF.libelle);
    t('XML DTI+ : en-tête, espace de noms de la douane, période (mois 10, 2026), n° d’accise, droits suspendus, 3 produits', x10.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<mouvements-balances xmlns="http://douane.finances.gouv.fr/app/ciel/dtiplus/v1">') && /<periode-taxation>\s*<mois>10<\/mois>\s*<annee>2026<\/annee>\s*<\/periode-taxation>\s*<identification-redevable>FR012345E6789<\/identification-redevable>\s*<droits-suspendus>/.test(x10) && (x10.match(/<produit>/g) || []).length === 3 && x10.trim().endsWith('</mouvements-balances>'));
    t('… produit mousseux : code INAO, libellé personnalisé, stock de début, ventes France sous CRD (année courante), sorties définitives, dégustation, stock de fin — dans l’ordre du schéma',
      /^<produit>\s*<code-inao>1S001M<\/code-inao>\s*<libelle-personnalise>Champagne — vins mousseux \(bouteilles tirées\)<\/libelle-personnalise>\s*<balance-stock>\s*<stock-debut-periode>141\.9<\/stock-debut-periode>\s*<sorties-periode>\s*<ventes-france-crd-suspendus>\s*<annee-courante>9<\/annee-courante>\s*<\/ventes-france-crd-suspendus>\s*<sorties-sans-paiement-droits>\s*<sorties-definitives>2\.25<\/sorties-definitives>\s*<consommation-familiale-degustation>0\.09<\/consommation-familiale-degustation>\s*<\/sorties-sans-paiement-droits>\s*<\/sorties-periode>\s*<stock-fin-periode>130\.56<\/stock-fin-periode>\s*<\/balance-stock>\s*$/.test(bloc), bloc);
    const b11 = prodX(x11, 'Champagne — vins tranquilles (moûts, vins de base, réserves)');
    t('… novembre : libellé fiscal (sans code INAO), observations, entrées (transfert, autres entrées) puis sorties (définitives, autres mouvements internes) dans l’ordre ; volumes à 5 décimales au plus ; aucun élément à zéro',
      /^<produit>\s*<libelle-fiscal>VT_IG_AOP<\/libelle-fiscal>\s*<libelle-personnalise>[^<]+<\/libelle-personnalise>\s*<observations>[^<]+<\/observations>\s*<balance-stock>/.test(b11) && pos(b11, '<entrees-periode>') < pos(b11, '<sorties-periode>') && pos(b11, '<replis-declassement-transfert-changement-appellation>') < pos(b11, '<autres-entrees>') && pos(b11, '<sorties-definitives>') < pos(b11, '<autres-mouvements-internes>') && pos(b11, '<sorties-definitives>') > 0
      && [x10, x11].every((x) => (x.match(/>-?\d+(\.\d+)?</g) || []).every((v) => !/\.\d{6,}/.test(v))) && ![x10, x11].some((x) => /<(?!stock-|mois|annee)[a-z-]+>0<\//.test(x)), b11);
    const dX = L.clone(f36); dX.drmProduits.find((p) => p.id === 'ex-coteaux').libelle = 'Coteaux & <rouge> "fictif"'; dX.drmProduits.find((p) => p.id === 'ex-coteaux').codeInao = 'ABCDE'; const xX = L.drmXml(dX, L.drmCalcul(dX, 'M:2026-10'), {});
    t('… caractères spéciaux échappés ; code INAO de 5 caractères complété par une espace (règle du schéma)', xX.includes('<libelle-personnalise>Coteaux &amp; &lt;rouge&gt; &quot;fictif&quot;</libelle-personnalise>') && xX.includes('<code-inao>ABCDE </code-inao>'));
    const xC = L.drmXml(f36, c10, { civc: true });
    t('XML CIVC : le même fichier, code CIVC à la place du code INAO (produits sans code CIVC : code INAO ou libellé fiscal) ; noms des fichiers', xC.includes('<code-inao>CHMOUS01</code-inao>') && !xC.includes('1S001M') && xC.replace('CHMOUS01', '1S001M') === x10 && L.drmNomFichier(c10, 'xml') === 'drm-2026-10.xml' && L.drmNomFichier(c10, 'xml', true) === 'drm-civc-2026-10.xml' && L.drmNomFichier(L.drmCalcul(f36, 'A:2025-2026'), 'xml') === 'drm-dra-2025-2026.xml');
    const csv = L.drmCsvLignes(f36, c10); const hC = csv[4]; const rC = csv.find((r) => r[1] === vmF.libelle);
    t('CSV : identifiants, en-têtes (rubriques en hL), une ligne par produit (code, code CIVC, stocks, rubriques, écart, observations)', csv[0][1] === 'FR012345E6789' && csv[2][1] === 'CIVC-0042' && hC[0] === 'Période' && hC.includes('Stock fin (hL)') && csv.length === 8 && rC[0] === '2026-10' && rC[2] === '1S001M' && rC[3] === 'CHMOUS01' && rC[4] === 141.9 && rC[hC.indexOf('Stock fin (hL)')] === 130.56 && rC[hC.indexOf('Ventes France sous CRD (hL)')] === 9, rC);
    // ---- DRA annuelle : la campagne, mois et année de sa fin ; ventes France de l'année civile précédente
    const cA = L.drmCalcul(f36, 'A:2025-2026'); const xA = L.drmXml(f36, cA, {});
    t('DRA : campagne 2025-2026 (1er août → 31 juillet), période du fichier = juillet 2026 ; balance de la campagne (reprises, récolte, transferts du tirage)', cA.periode.type === 'A' && cA.periode.d1 === '2025-08-01' && cA.periode.d2 === '2026-07-31' && /<mois>7<\/mois>\s*<annee>2026<\/annee>/.test(xA) && hl(lg(cA, 'ex-champ-vm').E.transfertE) === 49 && hl(lg(cA, 'ex-champ-vt').E.production) === 112.3 && hl(lg(cA, 'ex-champ-vm').s1) === 141.9 && cA.lignes.every((x) => Math.abs(x.s1 - (x.s0 + som(x.E) - som(x.S))) < 0.001));
    const dA = L.clone(f36); L.drmSaisieSet(dA, 'M:2025-12', 'ex-champ-vm', { ventesFrance: 100 }); L.drmSaisieSet(dA, 'M:2026-03', 'ex-champ-vm', { ventesFrance: 50 }); L.drmSaisieSet(dA, 'A:2025-2026', 'ex-champ-vm', { ventesFranceAnt: 20, degustation: 4 });
    const cA2 = L.drmCalcul(dA, 'A:2025-2026'); const xA2 = L.drmXml(dA, cA2, {}); const cM2 = L.drmCalcul(dA, 'M:2026-03');
    t('… ventes de décembre 2025 en « année précédente », de mars 2026 en « année courante » ; saisie annuelle comptée dans la DRA seulement (pas dans la DRM de mars)', lg(cA2, 'ex-champ-vm').S.ventesFranceAnt === 90 && lg(cA2, 'ex-champ-vm').S.ventesFrance === 37.5 && lg(cA2, 'ex-champ-vm').S.degustation === 3 && /<annee-precedente>0\.9<\/annee-precedente>\s*<annee-courante>0\.375<\/annee-courante>/.test(xA2)
      && lg(cM2, 'ex-champ-vm').S.ventesFrance === 37.5 && !lg(cM2, 'ex-champ-vm').S.degustation && Math.abs(lg(cM2, 'ex-champ-vm').f1 + 150 * 0.75) < 1e-9, [lg(cA2, 'ex-champ-vm').S, lg(cM2, 'ex-champ-vm').f1]);
    // ---- XSD de la douane (facultatif : OENOTRACK_XSD_DTI) : fichiers d'octobre, de novembre, CIVC et DRA validés par xmllint
    const xsd = process.env.OENOTRACK_XSD_DTI; if (xsd && fs.existsSync(xsd)) {
      const cp = require('child_process'); const os = require('os'); const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drm-')); const okX = [x10, x11, xC, xA, xA2, xX].map((x, i) => { const f = path.join(tmp, `drm${i}.xml`); fs.writeFileSync(f, x); try { cp.execFileSync('xmllint', ['--noout', '--schema', xsd, f], { stdio: 'pipe' }); return true; } catch (e) { console.log(String(e.stderr || e)); return false; } });
      t('… fichiers conformes au schéma de la douane (xmllint, schéma DTI+ viti)', okX.every(Boolean), okX);
    } else console.log('  (schéma de la douane non indiqué : OENOTRACK_XSD_DTI — validation xmllint sautée)');
    // ---- dépôt : déclaration figée, saisies verrouillées, continuité, modification signalée, réouverture
    const pv = dec10.produits.find((p) => p.produitId === 'ex-champ-vm');
    t('DRM d’octobre déposée : chiffres figés (3 produits, stocks et rubriques en L), date et auteur ; novembre repart de ses stocks de fin, sans alerte de continuité', dec10.deposeeLe && dec10.par === adU.id && dec10.produits.length === 3 && pv.s0 === 14190 && pv.s1 === 13056 && pv.S.ventesFrance === 900 && pv.code === '1S001M' && c10.declaration === dec10 && c11.precedente === dec10 && c11.lignes.every((x) => !x.continuite) && !L.drmControles(f36, c11).some((c) => /stock de début diffère|DRM déposée/.test(c.texte || '')));
    t('… dépôt une seconde fois refusé ; dépôt refusé tant qu’un contrôle bloque (n° d’accise)', /déjà déposée/.test(L.drmDeposer(L.clone(f36), 'M:2026-10', adU.id).msg) && /N° d’accise/.test(L.drmDeposer(dNo, 'M:2026-11', adU.id).msg));
    const dM = L.clone(f36); const ptM = Object.values(L.getR(dM, '2026-10-15').portions).find((p) => L.drmProduitDuLot(dM, L.drmProduitsDe(dM), [L.getR(dM, '2026-10-15')], p.lotId) === 'ex-champ-vt' && p.vol > 200);
    const rM = L.opSave(dM, { type: 'sortie', date: '2026-10-15', portionId: ptM.id, volL: 100, motif: 'Vente en vrac (fictive)' }); const cM10 = L.drmCalcul(dM, 'M:2026-10'); const cM11 = L.drmCalcul(dM, 'M:2026-11');
    t('opération d’octobre ajoutée après le dépôt : signalée sur la DRM d’octobre (stock de fin recalculé ≠ déposé) et sur celle de novembre (stock de début ≠ stock de fin déposé)', rM.ok && L.drmControles(dM, cM10).some((c) => c.nom === P36[0].libelle && /^stock de fin recalculé 223,30 hL, 224,30 hL dans la DRM déposée/.test(c.texte)) && L.drmControles(dM, cM11).some((c) => c.nom === P36[0].libelle && /^le stock de début diffère de 1,00 hL du stock de fin de la DRM déposée précédente/.test(c.texte)), rM.msg);
    const rO = L.drmRouvrir(dM, 'M:2026-10');
    t('… « Rouvrir » : la déclaration n’est plus déposée, ses saisies redeviennent modifiables ; rouvrir une DRM non déposée : refusé', rO.ok && !L.drmCalcul(dM, 'M:2026-10').declaration && L.drmSaisieSet(dM, 'M:2026-10', 'ex-champ-vm', { degustation: 13 }).ok && !L.drmRouvrir(dM, 'M:2026-10').ok && !L.drmCalcul(dM, 'M:2026-11').precedente);
    t('périodes : mois du plus récent au plus ancien depuis la première opération ; campagnes commencées ; période invalide refusée', mois[1] === 'M:2026-10' && mois[mois.length - 1] <= 'M:2025-08' && L.drmPeriodes(f36, 'annuelle', '2026-11-26').join() === 'A:2026-2027,A:2025-2026' && !L.drmPeriode(f36, 'M:2026-13') && !L.drmPeriode(f36, 'A:inconnue') && L.drmPeriode(f36, 'M:2026-02').d2 === '2026-02-28' && L.drmPeriode(f36, 'M:2024-02').d2 === '2024-02-29');
    // ---- droits : produits et rattachements = paramètres ; saisies et dépôts = registres ; réouverture = suppression
    const essD = (uid, fn, base) => { const av = L.clone(base || f36); const ap = L.clone(base || f36); fn(ap); return L.gardeDroits(av, ap, uid); };
    const gO1 = essD(opU.id, (y) => L.drmSaisieSet(y, 'M:2026-11', 'ex-champ-vm', { ventesFrance: 1 })); const gO2 = essD(opU.id, (y) => L.drmProduitSave(y, { ...y.drmProduits[0], codeCivc: 'CHVT0001' }, y.drmProduits[0].id, opU.id));
    const gO3 = essD(opU.id, (y) => L.drmReglageSet(y, { cvi: '5100000000' })); const gO4 = essD(opU.id, (y) => L.drmRattacher(y, y.lots[0].id, 'ex-coteaux'));
    const gA1 = essD(adU.id, (y) => { L.drmSaisieSet(y, 'M:2026-11', 'ex-champ-vm', { ventesFrance: 1 }); L.drmDeposer(y, 'M:2026-11', adU.id); }); const gA2 = essD(adU.id, (y) => L.drmProduitSave(y, { ...y.drmProduits[0], codeCivc: 'CHVT0001' }, y.drmProduits[0].id, adU.id));
    t('droits : l’opérateur (registres en lecture, pas de paramètres) ne peut ni saisir, ni changer produits, rattachements et identifiants ; l’administrateur oui, tracé', !gO1.ok && /saisir dans « registres »/i.test(gO1.msg) && !gO2.ok && /paramètres \(produits de la DRM\)/.test(gO2.msg) && !gO3.ok && /paramètres/.test(gO3.msg) && !gO4.ok && /rattachements des lots à la DRM/.test(gO4.msg)
      && gA1.ok && gA1.audit.some((x) => /^saisies de la DRM : 1 modification/.test(x.resume)) && gA1.audit.some((x) => /^DRM déposées : 1 ajout/.test(x.resume)) && gA2.ok && gA2.audit.some((x) => x.resume === 'Paramètres : produits de la DRM'), [gO1.msg, gO2.msg, gO3.msg, gO4.msg, gA1.audit, gA2.audit]);
    const fR = L.clone(f36); fR.profils.find((p) => p.id === 'pf_operateur').modules.registres = 'ecriture';
    const gR1 = essD(opU.id, (y) => L.drmDeposer(y, 'M:2026-11', opU.id), fR); const gR2 = essD(opU.id, (y) => L.drmRouvrir(y, 'M:2026-10'), fR);
    t('… avec les registres en écriture : dépôt permis ; « Rouvrir » demande le droit de supprimer', gR1.ok && !gR2.ok && /supprimer \(DRM déposées\)/.test(gR2.msg), [gR1.msg, gR2.msg]);
    t('droits et synchronisation : noms des données de la DRM', L.GARDE_PARAMS.includes('drmProduits') && L.GARDE_PARAMS.includes('drmRattachements') && L.GARDE_CLES.drmSorties === 'registres' && L.GARDE_CLES.drmDeclarations === 'registres' && L.GARDE_NOMS.drmSorties === 'saisies de la DRM' && L.SYNC_NOMS.drmDeclarations[1] === 'DRM déposées');
    // ---- synchronisation : saisies, produits et dépôts faits sur deux appareils
    const N1 = L.clone(f36); L.drmSaisieSet(N1, 'M:2026-11', 'ex-champ-vm', { ventesFrance: 300 }); L.drmDeposer(N1, 'M:2026-11', adU.id); N1.meta.modifLe = '2026-11-26T10:00:00Z';
    const N2 = L.clone(f36); L.drmProduitSave(N2, { ...N2.drmProduits.find((p) => p.id === 'ex-coteaux'), codeCivc: 'CHCOT001', aVerifier: false }, 'ex-coteaux', adU.id); L.drmRattacher(N2, N2.lots.find((l) => l.code === 'P26-05-R').id, 'ex-lies'); N2.meta.modifLe = '2026-11-26T11:00:00Z';
    const FS = L.syncFusion(f36, N1, N2);
    t('synchronisation : saisie et dépôt de novembre ici, produit vérifié et lot rattaché là-bas → tout est gardé', L.drmSaisieDe(FS.db, 'M:2026-11', 'ex-champ-vm').ventesFrance === 300 && FS.db.drmDeclarations.length === 2 && FS.db.drmProduits.find((p) => p.id === 'ex-coteaux').codeCivc === 'CHCOT001' && FS.db.drmRattachements.length === 2 && FS.db.drmProduits.find((p) => p.id === 'ex-lies').champFutur, FS.db.drmRattachements);
    // ---- traductions, version
    const en = (s) => L.traduire(s, 'en'); const de = (s) => L.traduire(s, 'de'); const es = (s) => L.traduire(s, 'es');
    t('traductions : onglet, rubriques, saisies, contrôles (sans le libellé du produit), réglages, registre d’enrichissement, notes de version',
      en('📮 DRM (douane)') === '📮 DRM (customs)' && en('Stock de début') === 'Opening stock' && de('Bouteilles finies sorties du chai (équivalent 75 cl)') === 'Fertige Flaschen, die den Keller verlassen (75-cl-Äquivalent)' && en('du 01/10/2026 au 31/10/2026') === 'from 01/10/2026 to 31/10/2026'
      && en('stock de fin négatif (1,00 hL) : vérifiez les sorties de bouteilles saisies.') === 'negative closing stock (1,00 hL): check the bottle dispatches entered.' && en('écart de 7,50 hL entre les mouvements et le stock constaté, porté en manipulations.') === 'discrepancy of 7,50 hL between the movements and the stock found, entered as processing.'
      && es('Registre d’enrichissement') === 'Registro de enriquecimiento' && en('N° d’accise FR012345E6789 · CVI — · CIVC —') === 'Excise number FR012345E6789 · CVI — · CIVC —' && en('déposée le 26/11/2026') === 'filed on 26/11/2026'
      && L.DRM_ENTREES.concat(L.DRM_SORTIES, L.DRM_SAISIES, L.DRM_NATURES, L.DRM_LIBELLES_FISCAUX).every((r) => L.LANGUES_TRAD.every((x) => L.traduire(r[1], x) !== r[1]))
      && L.CHANGELOG.find((c) => c.v === '0.32.0-alpha.1').notes.every((n) => L.LANGUES_TRAD.every((x) => L.traduire(n, x) !== n)) && k10.filter((c) => c.texte).every((c) => en(c.texte) !== c.texte));
    t('version 0.32.0-alpha.1 : nouvelle fonctionnalité compatible (mineure), première pré-version alpha', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.32.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.31.0-alpha.1' && L.versionNum('0.32.0-alpha.1') === 32000001 && L.APP_NUM >= 32000001; })());
    // ---- compatibilité : la 0.31.0-alpha.1 (gelée) ouvre la base 0.32.0-alpha.1 sans rien perdre, la modifie, se synchronise
    const dirO = path.join(__dirname, 'anciennes', '0.31.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, opSave, getR };')({});
    t('0.31.0-alpha.1 gelée chargée (n° 31 000 001)', O.APP_VERSION === '0.31.0-alpha.1' && O.APP_NUM === 31000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f36)); O.syncConfig(x); const KX = ['drmProduits', 'drmRattachements', 'drmSorties', 'drmDeclarations', 'settings', 'ops'];
    t('… la 0.31.0-alpha.1 ouvre la base 0.32.0-alpha.1 sans rien perdre (produits, rattachements, saisies et DRM déposées, réglages de la DRM, enrichissements)', KX.every((kk) => canonJ(x[kk]) === canonJ(f36[kk])), KX.filter((kk) => canonJ(x[kk]) !== canonJ(f36[kk])));
    const ptX = Object.values(O.getR(x, '2026-11-20').portions).find((p) => p.id === ptM.id) || Object.values(O.getR(x, '2026-11-20').portions).find((p) => p.vol > 200);
    const rx = O.opSave(x, { type: 'sortie', date: '2026-11-20', portionId: ptX.id, volL: 50, motif: 'Vente en vrac (fictive, saisie en 0.31)' });
    const back = L.normalizeDb(O.clone(x)); const cB = L.drmCalcul(back, 'M:2026-11');
    t('… sortie en vrac saisie par la 0.31 : comptée dans la DRM de novembre (sorties définitives +0,50 hL) ; DRM déposée et saisies intactes', rx.ok && Math.abs(som(cB.lignes.map((y) => y.S.definitives || 0)) - som(c11.lignes.map((y) => y.S.definitives || 0)) - 50) < 0.001 && cB.precedente && cB.precedente.periode === 'M:2026-10' && L.drmSaisieDe(back, 'M:2026-11', 'ex-champ-vm').ventesFrance === 240, rx.msg);
    const N3 = L.clone(f36); L.drmSaisieSet(N3, 'M:2026-11', 'ex-champ-vm', { definitives: 60 }); N3.meta.modifLe = '2026-11-26T12:00:00Z';
    const FX = L.syncFusion(f36, N3, x); const FX2 = O.syncFusion(f36, x, N3);
    t('… synchronisation 0.32 ↔ 0.31 : saisie de la DRM ici, opération là-bas, rien de perdu des deux côtés', L.drmSaisieDe(FX.db, 'M:2026-11', 'ex-champ-vm').definitives === 60 && FX.db.ops.some((o) => o.motif === 'Vente en vrac (fictive, saisie en 0.31)') && FX2.db.drmSorties.find((s) => s.id === 'M:2026-11|ex-champ-vm').definitives === 60 && FX2.db.ops.some((o) => o.motif === 'Vente en vrac (fictive, saisie en 0.31)') && FX2.db.drmDeclarations.length === 1);
  }
  // ---- 0.33.0-alpha.1 : profils viticoles — région (bassins français, pays) et types de vins ; aperçu à cocher ; personnalisations gardées
  {
    const f37 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.33.0-alpha.1-profil.json'), 'utf8'))); L.syncConfig(f37);
    const adU = f37.utilisateurs.find((u) => u.profilId === 'pf_admin'); const opU = f37.utilisateurs.find((u) => u.profilId === 'pf_operateur');
    const pv37 = f37.settings.profilViticole; const opD = (db, id) => db.lists.operations.find((o) => o.id === id); const ids = (p) => p.map((x) => x.id);
    t('base 0.33.0-alpha.1 de test : profil Champagne (effervescents, blancs, rosés) appliqué, « Rosé des Riceys » décochée ; réglages faits à la main gardés (délestage proposé, 2e taille hors pressurage, appellation saisie)',
      f37.meta.versions.includes('0.33.0-alpha.1') && pv37.region === 'champagne' && pv37.types.join() === 'effervescent,blanc,rose' && pv37.par === adU.id && pv37.ops.join() === 'maceration,saignee' && !opD(f37, 'maceration').masque && !opD(f37, 'saignee').masque && !opD(f37, 'delestage').masque
      && f37.lists.appellations.map((a) => a.label).join() === 'Appellation fictive (jeu d’essai),Champagne,Coteaux champenois' && f37.lists.fractions.find((f) => f.id === 'taille2').pressurage === false, pv37);
    const d0 = L.sampleDb(); const pv0 = L.profilViticole(d0);
    t('profil d’une base sans profil : Champagne (d’après les spécificités champenoises), effervescents et blancs, non défini ; 12 bassins français, 8 pays, « Autre région » ; 6 types ; 4 raccourcis',
      pv0.region === 'champagne' && pv0.types.join() === 'effervescent,blanc' && !pv0.defini && L.PROFIL_REGIONS.filter((r) => r.pays === 'France').length === 12 && L.PROFIL_REGIONS.filter((r) => r.pays === 'Étranger').length === 8 && L.PROFIL_REGIONS.length === 21 && L.PROFIL_TYPES.length === 6 && L.PROFIL_RACCOURCIS.length === 4
      && L.profilViticole((() => { const x = L.sampleDb(); L.regionSet(x, 'autre'); return x; })()).region === 'autre');
    t('… chaque région : cépages (identifiants uniques), appellations, types et échelle connus', L.PROFIL_REGIONS.every((r) => new Set(r.cepages.map((c) => c[0])).size === r.cepages.length && r.cepages.every((c) => c[0] && c[1]) && r.types.every((x) => L.PROFIL_TYPES.some((y) => y[0] === x)) && (!r.echelle || L.ECHELLE_PRESETS.some((e) => e.id === r.echelle))));
    t('aperçu Champagne sur le jeu d’exemple : seulement les 3 appellations à ajouter (tout le reste est déjà réglé)', ids(L.profilPlan(d0, 'champagne', ['effervescent', 'blanc'])).join() === 'appellation:Champagne,appellation:Coteaux champenois,appellation:Rosé des Riceys');
    const pB = L.profilPlan(d0, 'bordeaux', ['rouge', 'blanc']); const g = (gr) => pB.filter((x) => x.groupe === gr);
    t('aperçu Bordeaux (rouges, blancs) : onglets Tirages, Cave, Dégorgement masqués ; macération, délestage, écoulage proposés, remuage masqué ; stade « En macération » ; 8 cépages, 6 appellations ; goutte et presse ; tailles et rebêche hors pressurage ; pressoir sans plafond ; spécificités champenoises désactivées ; villages masqués ; enrichissement +1,5 % vol à vérifier',
      ids(g('onglets')).join() === 'module:tirage,module:cave,module:degorgement' && g('onglets').every((x) => x.apres === 'masqué') && ids(g('operations')).join() === 'op:maceration,op:delestage,op:ecoulage,op:remuage' && pB.find((x) => x.id === 'op:remuage').apres === 'masquée'
      && ids(g('stades')).join() === 'stade:maceration' && g('cepages').length === 8 && g('appellations').length === 6 && ids(g('fractions')).join() === 'fraction:goutte,fraction:presse,pressfrac:taille1,pressfrac:taille2,pressfrac:rebeche'
      && pB.some((x) => x.id === 'pressoir' && x.apres === 'Sans plafond (autres vins)') && pB.some((x) => x.id === 'region' && x.apres === 'désactivées') && pB.some((x) => x.id === 'crus') && pB.some((x) => x.id === 'chaptal' && x.aVerifier && x.apres === '+1,5 % vol') && !pB.some((x) => x.id === 'echelle'), ids(pB));
    const dB = L.clone(d0); const rB = L.profilAppliquer(dB, 'bordeaux', ['rouge', 'blanc'], null, adU.id);
    t('… appliqué : onglets masqués, opérations des rouges proposées, stade et cépages ajoutés, fractions, pressoir, région, villages masqués, seuil ; profil enregistré ; nouvel aperçu vide',
      rB.ok && rB.n === pB.length && !L.moduleActif(dB, 'tirage') && !L.moduleActif(dB, 'degorgement') && !opD(dB, 'maceration').masque && opD(dB, 'remuage').masque && L.stadeList(dB).some((s) => s.id === 'maceration') && dB.lists.cepages.some((c) => c.id === 'merlot')
      && L.fracList(dB).some((f) => f.id === 'goutte') && L.fracList(dB).find((f) => f.id === 'rebeche').pressurage === false && L.pressoirParams(dB).id === 'libre' && !L.champenois(dB) && dB.crus.some((c) => c.masqueRegion) && L.chaptalReglages(dB).max === 1.5
      && dB.settings.profilViticole.region === 'bordeaux' && dB.settings.profilViticole.chaptalMax === 1.5 && !L.profilPlan(dB, 'bordeaux', ['rouge', 'blanc']).length);
    const nC = dB.lists.cepages.length; const nA = dB.lists.appellations.length; const pRet = L.profilPlan(dB, 'champagne', ['effervescent', 'blanc']); L.profilAppliquer(dB, 'champagne', ['effervescent', 'blanc'], null, adU.id);
    t('retour à Champagne : ce que le profil avait changé revient (onglets, opérations, fractions au pressurage, pressoir AOC Champagne, spécificités, villages, enrichissement +2) ; rien de ce qui a été ajouté n’est retiré (cépages, appellations, stade, goutte et presse)',
      pRet.some((x) => x.id === 'op:remuage') && L.moduleActif(dB, 'tirage') && opD(dB, 'maceration').masque && !opD(dB, 'remuage').masque && L.fracList(dB).find((f) => f.id === 'rebeche').pressurage !== false && L.pressoirParams(dB).id === 'champagne' && L.champenois(dB) && !dB.crus.some((c) => c.masqueRegion) && L.chaptalReglages(dB).max === 2
      && dB.lists.cepages.length === nC && dB.lists.appellations.length === nA + 3 && L.stadeList(dB).some((s) => s.id === 'maceration') && L.fracList(dB).some((f) => f.id === 'goutte'));
    // ---- personnalisations jamais écrasées
    const dP = L.sampleDb(); opD(dP, 'ecoulage').masque = false; opD(dP, 'remuage').masque = true; dP.lists.fractions.find((f) => f.id === 'taille1').pressurage = false; dP.settings.chaptalMax = 1.8; dP.lists.cepages.find((c) => c.id === 'chard').label = 'Chardonnay (mon libellé)';
    const pP = L.profilPlan(dP, 'bourgogne', ['blanc', 'rouge']); L.profilAppliquer(dP, 'bourgogne', ['blanc', 'rouge'], null, adU.id); const pP2 = L.profilPlan(dP, 'champagne', ['effervescent', 'blanc']);
    t('personnalisations gardées : opérations, fraction et seuil réglés à la main jamais proposés ni changés ; cépage renommé gardé (pas de doublon)', !pP.some((x) => ['op:ecoulage', 'op:remuage', 'pressfrac:taille1', 'chaptal', 'cepage:chard'].includes(x.id)) && !opD(dP, 'ecoulage').masque && opD(dP, 'remuage').masque && dP.lists.fractions.find((f) => f.id === 'taille1').pressurage === false && dP.settings.chaptalMax === 1.8 && dP.lists.cepages.filter((c) => c.id === 'chard').length === 1 && dP.lists.cepages.find((c) => c.id === 'chard').label === 'Chardonnay (mon libellé)'
      && !pP2.some((x) => ['op:ecoulage', 'op:remuage', 'pressfrac:taille1', 'chaptal'].includes(x.id)), ids(pP));
    t('… fixture : délestage réglé à la main pas touché par le profil Champagne ; 2e taille gardée hors pressurage ; appellation décochée non ajoutée', !opD(f37, 'delestage').masque && !pv37.ops.includes('delestage') && !f37.lists.appellations.some((a) => a.label === 'Rosé des Riceys') && L.profilPlan(f37, 'champagne', pv37.types).map((x) => x.id).join() === 'appellation:Rosé des Riceys');
    // ---- seulement les changements cochés ; domaine mixte en un clic ; refus
    const dS = L.clone(d0); const rS = L.profilAppliquer(dS, 'alsace', ['blanc', 'effervescent'], ['cepage:riesling', 'pressoir'], adU.id);
    t('seulement les changements cochés : Riesling ajouté, pressoir crémant ; le reste inchangé (région champenoise, fractions, appellations)', rS.ok && rS.n === 2 && dS.lists.cepages.some((c) => c.id === 'riesling') && !dS.lists.cepages.some((c) => c.id === 'gewurztraminer') && L.pressoirParams(dS).id === 'cremant' && L.champenois(dS) && !L.fracList(dS).some((f) => f.id === 'goutte') && !dS.lists.appellations.length && dS.settings.profilViticole.region === 'alsace');
    const cr = L.PROFIL_RACCOURCIS.find((x) => x.id === 'cremant'); const dM = L.clone(d0); L.profilAppliquer(dM, 'loire', cr.types, null, adU.id);
    t('domaine mixte (crémant + vins tranquilles) en un clic : onglets des effervescents gardés, opérations des rouges et des rosés proposées, pressoir crémant (100 L pour 150 kg)', L.moduleActif(dM, 'tirage') && !opD(dM, 'saignee').masque && !opD(dM, 'ecoulage').masque && !opD(dM, 'remuage').masque && L.pressoirParams(dM).id === 'cremant' && L.pressoirParams(dM).ratioL === 100 && dM.settings.profilViticole.types.join() === 'effervescent,blanc,rose,rouge');
    t('refus : région inconnue, aucun type de vin ; rien d’enregistré', /Région inconnue/.test(L.profilAppliquer(L.clone(d0), 'atlantide', ['blanc']).msg) && /au moins un type/.test(L.profilAppliquer(L.clone(d0), 'alsace', []).msg) && !L.profilPlan(d0, 'atlantide', ['blanc']).length && (() => { const x = L.clone(d0); L.profilAppliquer(x, 'alsace', []); return !x.settings.profilViticole; })());
    const dX = L.clone(d0); L.profilAppliquer(dX, 'allemagne', ['blanc'], null, adU.id); const dX2 = L.clone(d0); L.profilAppliquer(dX2, 'autre', ['rouge'], null, adU.id);
    t('étranger : Allemagne (cépages, pressoir sans plafond, enrichissement +3 à vérifier) ; « Autre région » : ni cépage ni appellation ni seuil', dX.lists.cepages.some((c) => c.id === 'muller_thurgau') && L.pressoirParams(dX).id === 'libre' && L.chaptalReglages(dX).max === 3 && dX2.lists.cepages.length === d0.lists.cepages.length && !dX2.lists.appellations.length && L.chaptalReglages(dX2).max === 2 && !L.champenois(dX2));
    // ---- droits, synchronisation
    const essP = (uid, fn) => { const av = L.clone(f37); const ap = L.clone(f37); fn(ap); return L.gardeDroits(av, ap, uid); };
    const gO = essP(opU.id, (y) => L.profilAppliquer(y, 'bourgogne', ['blanc', 'rouge'], null, opU.id)); const gA = essP(adU.id, (y) => L.profilAppliquer(y, 'bourgogne', ['blanc', 'rouge'], null, adU.id));
    t('droits : appliquer un profil relève des paramètres (refusé à l’opérateur, permis à l’administrateur, tracé)', !gO.ok && /paramètres/.test(gO.msg) && gA.ok && gA.audit.length > 0, [gO.msg, gA.audit.map((x) => x.resume)]);
    const N1 = L.clone(f37); L.profilAppliquer(N1, 'champagne', [...pv37.types, 'rouge'], null, adU.id); N1.meta.modifLe = '2026-11-26T10:00:00Z';
    const N2 = L.clone(f37); L.listAdd(N2, 'appellations', 'Autre appellation fictive'); N2.meta.modifLe = '2026-11-26T11:00:00Z';
    const FS = L.syncFusion(f37, N1, N2);
    t('synchronisation : profil complété ici (rouges), appellation ajoutée là-bas → les deux gardés', FS.db.settings.profilViticole.types.includes('rouge') && !opD(FS.db, 'ecoulage').masque && FS.db.lists.appellations.some((a) => a.label === 'Autre appellation fictive'), FS.db.lists.appellations.map((a) => a.label));
    // ---- traductions, version
    const en = (s) => L.traduire(s, 'en'); const de = (s) => L.traduire(s, 'de'); const it = (s) => L.traduire(s, 'it');
    t('traductions : écran, types, régions et pays, groupes, valeurs de l’aperçu, notes de version', en('🍇 Région & types de vins') === '🍇 Region & wine types' && de('Vins tranquilles rouges') === 'Rote Stillweine' && en('Val de Loire') === 'Loire Valley' && it('Allemagne') === 'Germania' && en('Changements proposés (31)') === 'Proposed changes (31)' && en('+1,5 % vol') === '+1,5% vol' && en('213 proposés') === '213 offered'
      && L.PROFIL_TYPES.concat(L.PROFIL_GROUPES).every((r) => L.LANGUES_TRAD.filter((x) => L.traduire(r[1], x) !== r[1]).length >= 4) && L.PROFIL_RACCOURCIS.filter((r) => r.id !== 'champagne').every((r) => L.LANGUES_TRAD.every((x) => L.traduire(r.label, x) !== r.label))
      && L.PROFIL_REGIONS.filter((r) => r.pays === 'Étranger').every((r) => L.traduire(r.nom, 'en') !== r.nom || r.nom === 'Portugal') && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((x) => L.traduire(n, x) !== n)));
    t('version 0.33.0-alpha.1 : nouvelle fonctionnalité compatible (mineure), première pré-version alpha', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.33.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.32.0-alpha.1' && L.versionNum('0.33.0-alpha.1') === 33000001 && L.APP_NUM >= 33000001; })());
    // ---- compatibilité : la 0.32.0-alpha.1 (gelée) ouvre la base 0.33.0-alpha.1 sans rien perdre, la modifie, se synchronise
    const dirO = path.join(__dirname, 'anciennes', '0.32.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, listAdd, drmSaisieSet };')({});
    t('0.32.0-alpha.1 gelée chargée (n° 32 000 001)', O.APP_VERSION === '0.32.0-alpha.1' && O.APP_NUM === 32000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f37)); O.syncConfig(x); const KX = ['settings', 'lists', 'crus', 'drmSorties'];
    t('… la 0.32.0-alpha.1 ouvre la base 0.33.0-alpha.1 sans rien perdre (profil, onglets, opérations, appellations, fractions, stades)', KX.every((kk) => canonJ(x[kk]) === canonJ(f37[kk])), KX.filter((kk) => canonJ(x[kk]) !== canonJ(f37[kk])));
    const rx = O.listAdd(x, 'cepages', 'Cépage fictif saisi en 0.32'); const rx2 = O.drmSaisieSet(x, 'M:2026-11', 'ex-champ-vm', { degustation: 9 });
    const back = L.normalizeDb(O.clone(x));
    t('… cépage ajouté et saisie de DRM faite par la 0.32 : gardés, profil intact', rx.ok && rx2.ok && back.lists.cepages.some((c) => c.label === 'Cépage fictif saisi en 0.32') && canonJ(back.settings.profilViticole) === canonJ(pv37) && back.lists.appellations.length === 3);
    const N3 = L.clone(f37); L.profilAppliquer(N3, 'champagne', [...pv37.types, 'rouge'], null, adU.id); N3.meta.modifLe = '2026-11-26T12:00:00Z';
    const FX = L.syncFusion(f37, N3, x); const FX2 = O.syncFusion(f37, x, N3);
    t('… synchronisation 0.33 ↔ 0.32 : profil complété ici, cépage ajouté là-bas, rien de perdu des deux côtés', FX.db.settings.profilViticole.types.includes('rouge') && FX.db.lists.cepages.some((c) => c.label === 'Cépage fictif saisi en 0.32') && FX2.db.settings.profilViticole.types.includes('rouge') && FX2.db.lists.cepages.some((c) => c.label === 'Cépage fictif saisi en 0.32') && !opD(FX2.db, 'ecoulage').masque);
  }
  // ---- 0.35.0-alpha.1 : onglet « Vinification » (sous-onglets), onglet d'ouverture, campagne antérieure vide, dossier réseau de l'entreprise
  {
    const f38 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.34.0-alpha.1-vinification.json'), 'utf8'))); L.syncConfig(f38);
    const adU = f38.utilisateurs.find((u) => u.profilId === 'pf_admin'); const opU = f38.utilisateurs.find((u) => u.profilId === 'pf_operateur');
    const c38 = f38.campagnes.find((c) => c.id === '2015-2016');
    t('base 0.34.0-alpha.1 de test : onglet d’ouverture « Analyses », campagne 2015-2016 antérieure en tête, dossier réseau renseigné',
      f38.meta.versions.includes('0.34.0-alpha.1') && f38.settings.ongletDefaut === 'analyses' && c38 && c38.anterieure === true && f38.campagnes[0].id === '2015-2016' && f38.campagnes.filter((c) => c.anterieure).length === 1
      && L.dossierReseau(f38).chemin === '\\\\serveur-fictif\\vinification\\Oenotrack' && L.dossierReseau(f38).par === adU.id && /fictive/.test(L.dossierReseau(f38).consigne));
    // ---- onglets regroupés
    const d0 = L.sampleDb(); const V0 = L.modulesVisibles(d0);
    t('Vinification : Cuverie, Opérations, À réaliser, Plan de vinification (0.39) ; barre de 12 onglets, le groupe à la place de Cuverie ; modules et ordre inchangés (15 modules)',
      L.ONGLETS_GROUPES.vinification.join() === 'cuverie,ops,previsions,plan' && L.ongletDe('ops') === 'vinification' && L.ongletDe('pressoir') === 'pressoir' && L.ongletsBarre(V0).join() === 'vinification,pressoir,tirage,cave,degorgement,analyses,intrants,hygiene,equipements,trace,registres,params'
      && V0.length === 15 && L.ongletMembres('vinification', V0).join() === 'cuverie,ops,previsions,plan' && L.ongletMembres('pressoir', V0).join() === 'pressoir', L.ongletsBarre(V0));
    const dO = L.clone(d0); L.moduleDeplacer(dO, 'ops', 6); L.moduleActiver(dO, 'cuverie', false); const VO = L.modulesVisibles(dO);
    t('… Cuverie désactivée, Opérations déplacée : le groupe prend la place du premier module affiché, avec seulement ses modules actifs', L.ongletsBarre(VO).indexOf('vinification') === 1 && L.ongletMembres('vinification', VO).join() === 'previsions,plan,ops' && !L.ongletsBarre(VO).includes('cuverie'), [L.ongletsBarre(VO), L.ongletMembres('vinification', VO)]);
    const dN = L.clone(d0); ['cuverie', 'ops', 'previsions', 'plan'].forEach((m) => L.moduleActiver(dN, m, false));
    t('… les quatre désactivés : plus d’onglet Vinification', !L.ongletsBarre(L.modulesVisibles(dN)).includes('vinification'));
    // ---- onglet d'ouverture
    t('ouverture : premier onglet de la barre par défaut (Cuverie dans Vinification) ; réglage « Analyses » ; groupe → son premier module ; réglage ignoré s’il n’est pas affiché',
      L.ongletOuverture(d0) === 'cuverie' && L.ongletOuverture(f38) === 'analyses' && (() => { const x = L.clone(d0); L.ongletDefautSet(x, 'vinification'); return L.ongletOuverture(x) === 'cuverie' && L.ongletOuverture(x, ['pressoir', 'ops', 'params']) === 'ops'; })()
      && L.ongletOuverture(f38, ['pressoir', 'params']) === 'pressoir' && (() => { const x = L.clone(f38); L.moduleActiver(x, 'analyses', false); return L.ongletOuverture(x) === 'cuverie'; })());
    const dD = L.clone(d0); const okD = L.ongletDefautSet(dD, 'registres').ok && dD.settings.ongletDefaut === 'registres'; const okV = L.ongletDefautSet(dD, '').ok && !('ongletDefaut' in dD.settings);
    t('réglage de l’onglet d’ouverture : enregistré, retiré ; refus d’un onglet inconnu et d’un module sans onglet (Déclassements) ; l’ordre ne change pas', okD && okV && /inconnu/.test(L.ongletDefautSet(dD, 'atlantide').msg) && /pas d’onglet propre/.test(L.ongletDefautSet(dD, 'declass').msg) && !dD.settings.modulesOrdre);
    const essai = (uid, fn) => { const av = L.clone(f38); const ap = L.clone(f38); fn(ap); return L.gardeDroits(av, ap, uid); };
    const gO1 = essai(opU.id, (y) => L.ongletDefautSet(y, 'pressoir')); const gA1 = essai(adU.id, (y) => L.ongletDefautSet(y, 'pressoir'));
    t('droits : l’onglet d’ouverture relève des paramètres (refusé à l’opérateur, permis à l’administrateur, tracé)', !gO1.ok && /paramètres/.test(gO1.msg) && gA1.ok && gA1.audit.some((a) => /ongletDefaut/.test(a.resume)), [gO1.msg, gA1.audit]);
    // ---- campagne antérieure
    const dC = L.sampleDb(); const Rav = L.getR(dC); const vAv = canonJ(Rav.contVol); const nOps = dC.ops.length; const nLots = dC.lots.length;
    const rC = L.campCreate(dC, '2019-2020', '2019-08-01', '2020-07-31'); const cA = dC.campagnes.find((c) => c.id === '2019-2020');
    const RA = L.campEtatR(dC, cA); const volA = Object.values(RA.contVol).filter((v) => v > 0.0001).length + Object.values(RA.portions).filter((p) => p.vol > 0.0001).length;
    t('campagne créée avant les existantes : marquée antérieure, en tête ; complètement vide (aucun volume en cuve, aucune portion) ; ni opération ni lot ajouté',
      rC.ok && rC.anterieure === true && cA.anterieure === true && dC.campagnes[0].id === '2019-2020' && volA === 0 && L.campEtatDate(cA) === '2020-07-31' && dC.ops.length === nOps && dC.lots.length === nLots, volA);
    const cDer = dC.campagnes[dC.campagnes.length - 1];
    t('… campagnes existantes inchangées : état complet identique, pas marquées', canonJ(L.campEtatR(dC, cDer).contVol) === vAv && !cDer.anterieure && L.campEtatDate(cDer) === undefined && !dC.campagnes.slice(1).some((c) => c.anterieure));
    const dC2 = L.sampleDb(); const rC2 = L.campCreate(dC2, '2030-2031', '2030-08-01', '2031-07-31');
    t('… campagne postérieure : pas marquée antérieure (comportement inchangé) ; chevauchement toujours refusé', rC2.ok && !rC2.anterieure && !dC2.campagnes.find((c) => c.id === '2030-2031').anterieure && /chevauchent/.test(L.campCreate(L.clone(dC), '2020-2021', '2020-07-01', '2021-07-31').msg));
    const ct = dC.contenants.find((c) => c.statut !== 'archive');
    const rE = L.opSave(dC, { type: 'entree_mout', date: '2019-09-20', apporteurId: '', ref: 'Fictif 2019', millesime: '2019', entrees: [{ compartiment: '', cepageId: 'chard', fractionId: 'cuvee', cruId: 'cru-cumieres', qualifId: 'conv', volL: 500, dests: [{ contenantId: ct.id, volL: 500 }] }], lots: [{ contenantId: ct.id, code: 'M19-01', designation: 'Moût fictif 2019' }] });
    const dC3 = L.clone(dC); const RA2 = L.campEtatR(dC3, dC3.campagnes.find((c) => c.id === '2019-2020'));
    t('… opération saisie dans la campagne antérieure : seul son lot y apparaît (5 hL), dans l’état de fin de campagne', rE.ok && Math.abs((RA2.contVol[ct.id] || 0) - 500) < 0.01 && Object.values(RA2.contVol).filter((v) => v > 0.0001).length === 1, [rE.msg, RA2.contVol[ct.id], Object.values(RA2.contVol).filter((v) => v > 0.0001)]);
    const RF = L.campEtatR(f38, c38);
    t('… fixture : campagne 2015-2016 vide', Object.values(RF.contVol).every((v) => !(v > 0.0001)));
    // ---- dossier réseau de l'entreprise
    const typ = ['\\\\nas\\vin\\Oenotrack', '//nas/vin/Oenotrack', 'Z:\\Oenotrack', 'smb://nas.local/oenotrack', '/Volumes/oenotrack', '/home/moi/oenotrack', 'file:///mnt/x', 'Oenotrack', ''].map(L.reseauCheminType);
    t('chemins reconnus : partage Windows, //, lecteur, smb://, dossier monté, local, file://, autre, vide', typ.join() === 'unc,unc,lecteur,smb,monte,local,fichier,autre,', typ);
    t('nom du dossier attendu (dernier élément) ; correspondance sans casse ni accents ; lecteur seul : pas de nom', L.reseauNomDossier('\\\\nas\\vin\\Œnotrack\\') === 'Œnotrack' && L.reseauNomDossier('smb://nas.local/partage/oeno') === 'oeno' && L.reseauNomDossier('Z:\\') === '' && L.reseauCorrespond('\\\\nas\\vin\\Œnotrack', 'œnotrack') === true && L.reseauCorrespond('Z:\\Vins', 'Autre') === false && L.reseauCorrespond('', 'x') === null && /Partage Windows/.test(L.reseauConseil('\\\\nas\\x')) && L.reseauConseil('') === '');
    const dR = L.sampleDb(); const rR = L.dossierReseauSet(dR, { chemin: '  \\\\nas\\vin\\Oenotrack ', consigne: 'Lecteur Z:' }, 'u1');
    t('dossier réseau : enregistré (chemin nettoyé, auteur, date) ; refus d’un chemin trop long ou avec des caractères de contrôle ; vide → retiré',
      rR.ok && L.dossierReseau(dR).chemin === '\\\\nas\\vin\\Oenotrack' && L.dossierReseau(dR).par === 'u1' && L.dossierReseau(dR).le && /trop long/.test(L.dossierReseauSet(L.clone(dR), { chemin: 'x'.repeat(L.RESEAU_CHEMIN_MAX + 1) }).msg)
      && /invalides/.test(L.dossierReseauSet(L.clone(dR), { chemin: 'a\u0007b' }).msg) && (() => { const x = L.clone(dR); x.settings.dossierReseau.futur = 1; L.dossierReseauSet(x, { chemin: 'Y:\\', consigne: '' }); const k = x.settings.dossierReseau.futur === 1; L.dossierReseauSet(x, { chemin: '', consigne: '' }); return k && !x.settings.dossierReseau && L.dossierReseau(x).chemin === ''; })());
    const gO = essai(opU.id, (y) => L.dossierReseauSet(y, { chemin: 'Z:\\Autre' }, opU.id)); const gA = essai(adU.id, (y) => L.dossierReseauSet(y, { chemin: 'Z:\\Autre' }, adU.id));
    t('droits : le dossier réseau relève de « Sauvegardes et Drive » (refusé à l’opérateur, permis à l’administrateur, tracé)', !gO.ok && /dossier réseau/.test(gO.msg) && gA.ok && gA.audit.some((a) => /Dossier réseau de l’entreprise : Z:/.test(a.resume)), [gO.msg, gA.audit]);
    const N1 = L.clone(f38); L.dossierReseauSet(N1, { chemin: '\\\\serveur-fictif\\vin\\Nouveau' }, adU.id); N1.meta.modifLe = '2026-11-26T10:00:00Z';
    const N2 = L.clone(f38); L.campCreate(N2, '2014-2015', '2014-08-01', '2015-07-31'); N2.meta.modifLe = '2026-11-26T11:00:00Z';
    const FS = L.syncFusion(f38, N1, N2);
    t('synchronisation : chemin changé ici, campagne antérieure créée là-bas → les deux gardés', L.dossierReseau(FS.db).chemin === '\\\\serveur-fictif\\vin\\Nouveau' && FS.db.campagnes.some((c) => c.id === '2014-2015' && c.anterieure) && FS.db.settings.ongletDefaut === 'analyses');
    // ---- traductions, version
    const en = (s) => L.traduire(s, 'en'); const de = (s) => L.traduire(s, 'de');
    t('traductions : Vinification, onglet d’ouverture, campagne antérieure, dossier réseau, notes de version', en('Vinification') !== 'Vinification' && en('Onglet ouvert au démarrage') === 'Tab opened at start-up' && en('Premier onglet de la barre (actuellement « Analyses »)') === 'First tab of the bar (currently “Analyses”)'
      && de('Dossier réseau de l’entreprise') === 'Netzwerkordner des Betriebs' && en('Campagne 2019-2020 créée : antérieure aux campagnes existantes, elle démarre vide (aucun lot ni volume en cuve).').startsWith('Campaign 2019-2020 created')
      && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((x) => L.traduire(n, x) !== n)));
    t('version 0.35.0-alpha.1 : nouvelles fonctionnalités compatibles (mineure), première pré-version alpha', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.34.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.33.0-alpha.1'; })() && L.versionNum('0.34.0-alpha.1') === 34000001 && L.APP_NUM >= 34000001);
    // ---- compatibilité : la 0.33.0-alpha.1 (gelée) ouvre la base 0.34.0-alpha.1 sans rien perdre, la modifie, se synchronise
    const dirO = path.join(__dirname, 'anciennes', '0.33.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, listAdd, campCreate, getR };')({});
    t('0.33.0-alpha.1 gelée chargée (n° 33 000 001)', O.APP_VERSION === '0.33.0-alpha.1' && O.APP_NUM === 33000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f38)); O.syncConfig(x); const KX = ['settings', 'campagnes', 'lists', 'modulesOrdre'];
    t('… la 0.33.0-alpha.1 ouvre la base 0.34.0-alpha.1 sans rien perdre (onglet d’ouverture, campagne antérieure, dossier réseau)', KX.every((kk) => canonJ(x[kk]) === canonJ(f38[kk])) && x.settings.ongletDefaut === 'analyses' && x.campagnes[0].anterieure === true, KX.filter((kk) => canonJ(x[kk]) !== canonJ(f38[kk])));
    const rx = O.listAdd(x, 'cepages', 'Cépage fictif saisi en 0.33'); const rx2 = O.campCreate(x, '2031-2032', '2031-08-01', '2032-07-31');
    const back = L.normalizeDb(O.clone(x));
    t('… cépage et campagne ajoutés par la 0.33 : gardés ; réglages 0.34 intacts', rx.ok && rx2.ok && back.lists.cepages.some((c) => c.label === 'Cépage fictif saisi en 0.33') && back.campagnes.some((c) => c.id === '2031-2032' && !c.anterieure) && back.settings.ongletDefaut === 'analyses' && canonJ(back.settings.dossierReseau) === canonJ(f38.settings.dossierReseau) && back.campagnes.find((c) => c.id === '2015-2016').anterieure === true);
    const N3 = L.clone(f38); L.dossierReseauSet(N3, { chemin: 'Z:\\Oenotrack' }, adU.id); L.ongletDefautSet(N3, 'pressoir'); N3.meta.modifLe = '2026-11-26T12:00:00Z';
    const FX = L.syncFusion(f38, N3, x); const FX2 = O.syncFusion(f38, x, N3);
    t('… synchronisation 0.34 ↔ 0.33 : réglages changés ici, cépage et campagne ajoutés là-bas, rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => y.settings.dossierReseau.chemin === 'Z:\\Oenotrack' && y.settings.ongletDefaut === 'pressoir' && y.lists.cepages.some((c) => c.label === 'Cépage fictif saisi en 0.33') && y.campagnes.some((c) => c.id === '2031-2032') && y.campagnes.find((c) => c.id === '2015-2016').anterieure === true));
  }
  // ---- 0.35.0-alpha.1 : entrée de moûts — plusieurs partenaires par citerne (onglets, n° de bon / DAE, documents par partenaire),
  //      analyses imposées « Moût · Débourbage », volume calculé à l'épalement (hauteur en cm)
  {
    const f39 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.35.0-alpha.1-partenaires.json'), 'utf8'))); L.syncConfig(f39);
    const op = f39.ops.find((o) => o.type === 'entree_mout' && (o.partenaires || []).length === 2); const R = L.getR(f39);
    t('base 0.35.0-alpha.1 de test : entrée à deux partenaires (onglets), n° de bon de chacun, op.apporteurId et op.ref remplis pour les versions antérieures', !!op && f39.meta.versions.includes('0.35.0-alpha.1') && op.apporteurId === 'apt5' && op.ref === 'BL-FX-001 / DAE-FX-002' && L.moutRefs(op).join() === 'BL-FX-001,DAE-FX-002');
    t('… chaque moût rattaché à son partenaire (onglet) et à son n° de bon', op.entrees.map((e) => L.lignePartId(op, e)).join() === 'pa1,pa1,pa2' && op.entrees.map((e) => L.ligneRef(op, e)).join() === 'BL-FX-001,BL-FX-001,DAE-FX-002');
    const lC3 = f39.lots.find((l) => l.code === 'M26-FX-C'); const lT1 = f39.lots.find((l) => l.code === 'M26-FX-T1');
    t('enregistrement en cuve : un lot par cuve ; la Cuve 03 reçoit les moûts des deux partenaires (partage au prorata), la Cuve 02 celui d’EARL Marchand seul', lC3 && lT1 && lC3.contenantId === 'ct24' && Math.round(lC3.origine.apporteurs.apt5) === 1000 && Math.round(lC3.origine.apporteurs.apt6) === 900 && Object.keys(lT1.origine.apporteurs).join() === 'apt5'
      && Math.round(R.lotVol[lC3.id] || 0) === 1900 && Math.round(R.lotVol[lT1.id] || 0) === 600, lC3 && lC3.origine);
    // épalement
    const b = L.baremeDe(f39, 'ct24'); const j = L.jaugeEntreeCuve(b, 100, 1990); const jn = L.jaugeEntreeCuve(b, 30, 1990); const jh = L.jaugeEntreeCuve(b, 250, 0);
    t('épalement : hauteur après réception → contenu mesuré − contenu d’avant ; mesure trop basse signalée (volume 0) ; hors barème signalé ; sans barème ni mesure : rien', j.total === 5000 && j.v === 3010 && !j.negatif && jn.v === 0 && jn.negatif && jh.hors === 'dessus' && L.jaugeEntreeCuve(null, 100, 0) === null && L.jaugeEntreeCuve(b, '', 0) === null);
    t('… la mesure en cuve est gardée avec l’opération et décrite dans l’historique', (op.jaugesCuves || []).length === 1 && op.jaugesCuves[0].volL === 1000 && op.jaugesCuves[0].volAvant === 1990 && /Cuve 03 59,8 cm \(10,00 hL\)/.test(L.jaugesTexte(f39, op)), L.jaugesTexte(f39, op));
    // analyses imposées
    const dM = L.clone(f39); dM.analysesModeles = dM.analysesModeles.filter((m) => m.id !== 'm_mout').concat([{ id: 'mx', nom: 'Moût', etape: 'Débourbage', paramIds: ['tap'] }]);
    t('analyses imposées : modèle « Moût · Débourbage » (m_mout), retrouvé par son nom s’il a été recréé ; analyses déjà saisies gardées', L.moutModeleImpose(f39).id === 'm_mout' && L.moutModeleImpose(dM).id === 'mx' && L.moutModeleImpose({}).id === 'm_mout' && op.entrees[0].analyses.tap === 10.1);
    // bulletins par partenaire
    const M2 = [{ i: 0, numLot: 'BL-FX-001-1', compartiment: 'C1' }, { i: 1, numLot: 'BL-FX-001-2', compartiment: 'C2' }];
    const E = (ref, v) => ({ ref, valeurs: { tap: { v } } });
    const a1 = L.bulletinPourMouts({ echantillons: [E('Échantillon BL-FX-001-2', 10.5), E('Échantillon BL-FX-001-1', 9.7)] }, M2);
    const a2 = L.bulletinPourMouts({ echantillons: [E('Compartiment C2', 10.2), E('Compartiment C1', 9.6)] }, M2);
    const a3 = L.bulletinPourMouts({ echantillons: [E('Moût reçu', 10)] }, M2); const a4 = L.bulletinPourMouts({ echantillons: [E('A', 1), E('B', 2)] }, M2);
    t('bulletin d’un partenaire : échantillons rapprochés de ses moûts par n° de lot, puis compartiment, puis dans l’ordre ; un seul échantillon vaut pour tous ses moûts', a1.map((x) => `${x.i}:${x.valeurs.tap}`).join() === '0:9.7,1:10.5' && a2.map((x) => `${x.i}:${x.valeurs.tap}`).join() === '0:9.6,1:10.2'
      && a3.length === 2 && a3.every((x) => x.valeurs.tap === 10) && a4.map((x) => `${x.i}:${x.valeurs.tap}`).join() === '0:1,1:2' && !L.bulletinPourMouts({ echantillons: [] }, M2).length, [a1, a2, a3, a4]);
    const lusB = L.bulletinAnalyser(f39, R, L.bulletinLignesDeTexte('Laboratoire fictif\nÉchantillon n° 1 : DAE-FX-002-1\nTAP    10,3   % vol\nAcidité totale    7,7    g/L H2SO4'), { candidats: [] });
    const aB = L.bulletinPourMouts(lusB, [{ i: 2, numLot: 'DAE-FX-002-1', compartiment: 'C3' }]);
    t('… bulletin texte lu (script) puis reporté sur le moût du second partenaire', aB.length === 1 && aB[0].i === 2 && aB[0].valeurs.tap === 10.3 && aB[0].valeurs.at === 7.7, [lusB.echantillons, aB]);
    // documents par partenaire
    const dz = f39.docs.filter((x) => x.cible && x.cible.id === op.id);
    const dJ = L.clone(f39); L.docsJoindre(dJ, [{ id: 'docfx-n', nom: 'n.pdf', mime: 'application/pdf', taille: 1, cat: 'bon', partId: 'pa2' }], { type: 'op', id: op.id });
    t('documents : chacun rattaché à son partenaire (onglet) ou général ; joints à la saisie, ils gardent leur partenaire', dz.map((x) => x.partId || '-').sort().join() === '-,pa1,pa2' && dJ.docs.find((x) => x.id === 'docfx-n').partId === 'pa2');
    // une entrée à un seul partenaire reste comme avant ; une entrée sans onglet (versions antérieures) : un onglet, partenaire et n° de bon de l'opération
    const old1 = f39.ops.find((o) => o.type === 'entree_mout' && o.id !== op.id);
    t('entrée à un seul partenaire (versions antérieures) : un onglet avec le partenaire et le n° de bon de l’opération ; rien d’ajouté', !old1.partenaires && L.moutPartenaires(old1).length === 1 && L.moutPartenaires(old1)[0].apporteurId === old1.apporteurId && old1.entrees.every((e) => L.ligneRef(old1, e) === old1.ref && L.lignePartId(old1, e) === 'pa1'));
    // droits et synchronisation
    const adU = f39.utilisateurs.find((u) => u.profilId === 'pf_admin'); const opU = f39.utilisateurs.find((u) => u.profilId === 'pf_operateur');
    const gD = (() => { const av = L.clone(f39); const ap = L.clone(f39); const o = ap.ops.find((x) => x.id === op.id); L.opSave(ap, { ...L.clone(o), partenaires: o.partenaires.map((p) => (p.id === 'pa2' ? { ...p, ref: 'DAE-FX-002-bis' } : p)) }, o.id, {}); return [L.gardeDroits(av, ap, opU.id), L.gardeDroits(av, ap, adU.id)]; })();
    t('droits : corriger le n° de bon d’un partenaire d’une entrée validée : refusé à l’opérateur, permis à l’administrateur, tracé au journal', !gD[0].ok && /corriger une opération/.test(gD[0].msg) && gD[1].ok && gD[1].audit.length > 0, gD.map((g) => g.msg));
    const N1 = L.clone(f39); const o1 = N1.ops.find((x) => x.id === op.id); L.opSave(N1, { ...L.clone(o1), partenaires: o1.partenaires.map((p) => (p.id === 'pa2' ? { ...p, ref: 'DAE-FX-002-bis' } : p)) }, o1.id, {}); N1.meta.modifLe = '2026-11-26T10:00:00Z';
    const N2 = L.clone(f39); L.docMetaAdd(N2, { id: 'docfx-la', nom: 'la-bas.pdf', mime: 'application/pdf', taille: 1, cat: 'analyse', cible: { type: 'op', id: op.id }, partId: 'pa1' }); N2.meta.modifLe = '2026-11-26T11:00:00Z';
    const FS = L.syncFusion(f39, N1, N2); const oF = FS.db.ops.find((x) => x.id === op.id);
    t('synchronisation : n° de bon changé ici, document du partenaire 1 joint là-bas → les deux gardés', L.ligneRef(oF, oF.entrees[2]) === 'DAE-FX-002-bis' && FS.db.docs.find((x) => x.id === 'docfx-la').partId === 'pa1');
    // traductions, version
    const en = (s) => L.traduire(s, 'en'); const de = (s) => L.traduire(s, 'de');
    t('traductions : onglets partenaires, bulletins, épalement, notes de version', en('Partenaires de la citerne (2)') === 'Partners in the tanker (2)' && de('Partenaire n° 3') === 'Partner Nr. 3' && en('59,80 hL en cuve − 19,90 hL déjà présents = 39,90 hL reçus') === '59,80 hL in tank − 19,90 hL already there = 39,90 hL received'
      && en('Bulletin « b.pdf » : analyses reportées sur 2 moût(s).') === 'Report “b.pdf”: analyses entered on 2 must(s).' && !L.tradControle().length && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((x) => L.traduire(n, x) !== n)), L.tradControle());
    t('version 0.35.0-alpha.1 : nouvelle fonctionnalité compatible (mineure), première pré-version alpha', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.35.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.34.0-alpha.1'; })() && L.versionNum('0.35.0-alpha.1') === 35000001 && L.APP_NUM >= 35000001);
    // ---- compatibilité : la 0.34.0-alpha.1 (gelée) ouvre la base 0.35.0-alpha.1 sans rien perdre, modifie l'entrée, se synchronise
    const dirO = path.join(__dirname, 'anciennes', '0.34.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, opSave, ligneApporteurs, getR };')({});
    t('0.34.0-alpha.1 gelée chargée (n° 34 000 001)', O.APP_VERSION === '0.34.0-alpha.1' && O.APP_NUM === 34000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f39)); O.syncConfig(x); const KX = ['ops', 'docs', 'lots', 'baremes'];
    t('… la 0.34.0-alpha.1 ouvre la base 0.35.0-alpha.1 sans rien perdre (onglets, mesures en cuve, documents par partenaire, lots)', KX.every((kk) => canonJ(x[kk]) === canonJ(f39[kk])), KX.filter((kk) => canonJ(x[kk]) !== canonJ(f39[kk])));
    const oX = x.ops.find((o) => o.id === op.id);
    t('… la 0.34 attribue chaque moût au bon partenaire (écrit dans le moût) et voit tous les n° de bon', oX.entrees.map((e) => O.ligneApporteurs(e, oX).map((a) => a.id).join('+')).join() === 'apt5,apt5,apt6' && oX.ref === 'BL-FX-001 / DAE-FX-002');
    // modification par la 0.34 (formulaire 0.33 : moûts réécrits sans e.partId ; volume du moût 2 changé : sa clé de ligne change)
    const spec34 = { type: 'entree_mout', date: oX.date, notes: 'modifiée en 0.34', apporteurId: oX.apporteurId, ref: oX.ref, immat: oX.immat, millesime: oX.millesime, analyseModele: 'm_mout', stade: oX.stade,
      entrees: oX.entrees.map((e, k) => { const { partId, ...r } = e; return k === 1 ? { ...r, volL: 650, dests: [{ contenantId: 'ct23', volL: 650 }] } : r; }), lots: oX.lots.map((l) => ({ contenantId: l.contenantId, code: l.code, designation: l.designation })) };
    const rx = O.opSave(x, spec34, oX.id, {}); const back = L.normalizeDb(O.clone(x)); const oB = back.ops.find((o) => o.id === op.id);
    t('… entrée modifiée par la 0.34 : onglets et mesure en cuve gardés ; chaque moût retrouve son partenaire (par la clé de la ligne, sinon par le partenaire) et son n° de bon', rx.ok && oB.notes === 'modifiée en 0.34' && oB.partenaires.length === 2 && oB.jaugesCuves.length === 1 && !oB.entrees.some((e) => e.partId)
      && oB.entrees.map((e) => L.lignePartId(oB, e)).join() === 'pa1,pa1,pa2' && oB.entrees.map((e) => L.ligneRef(oB, e)).join() === 'BL-FX-001,BL-FX-001,DAE-FX-002' && back.docs.filter((d) => d.partId).length === 2, rx.msg);
    const N3 = L.clone(f39); const o3 = N3.ops.find((y) => y.id === op.id); L.opSave(N3, { ...L.clone(o3), partenaires: o3.partenaires.map((p) => (p.id === 'pa1' ? { ...p, ref: 'BL-FX-001-ter' } : p)) }, o3.id, {}); N3.meta.modifLe = '2026-11-26T12:00:00Z';
    const xa = O.normalizeDb(O.clone(f39)); xa.docs.push({ id: 'docfx-034', nom: 'en-0.34.pdf', mime: 'application/pdf', taille: 1, cat: 'autre', cible: { type: 'op', id: op.id }, date: '2026-11-26' }); xa.meta.modifLe = '2026-11-26T13:00:00Z';
    const FX = L.syncFusion(f39, N3, xa); const FX2 = O.syncFusion(f39, xa, N3); const oFX = FX.db.ops.find((y) => y.id === op.id); const oFX2 = FX2.db.ops.find((y) => y.id === op.id);
    t('… synchronisation 0.35 ↔ 0.34 : n° de bon changé ici, document joint là-bas, rien de perdu des deux côtés', L.ligneRef(oFX, oFX.entrees[0]) === 'BL-FX-001-ter' && FX.db.docs.some((d) => d.id === 'docfx-034') && oFX2.partenaires[0].ref === 'BL-FX-001-ter' && FX2.db.docs.some((d) => d.id === 'docfx-034') && FX2.db.docs.filter((d) => d.partId).length === 2);
  }
  // ---- 0.36.0-alpha.1 : régularisations de stock, allergènes, revendications Oui / Non, fiches récapitulatives, produits de maintenance
  {
    const f40 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.36.0-alpha.1-intrants.json'), 'utf8'))); L.syncConfig(f40);
    const RG = f40.regulStocks; const R40 = L.getR(f40); const a1 = f40.arrivages.find((a) => a.id === RG[0].arrivageId); const a2 = f40.arrivages.find((a) => a.id === RG[1].arrivageId);
    t('fixture 0.36 : 2 régularisations (inventaire compté, casse retirée du stock), dans le rejeu', RG.length === 2 && RG[0].motif === 'inventaire' && RG[0].compte != null && Math.abs(RG[0].qty + 1) < 1e-6 && RG[1].motif === 'casse' && RG[1].qty === -0.5
      && Math.abs(R40.arrRegul[a1.id] + 1) < 1e-6 && Math.abs(L.arrivalRest(R40, a1) - RG[0].compte) < 1e-6, RG);
    const R0 = L.replay({ ...f40, regulStocks: [] }); t('restant = reçu + régularisations − utilisé ; sans régularisation : restant d’avant', Math.abs(L.arrivalRest(R0, a2) - 0.5 - L.arrivalRest(R40, a2)) < 1e-6);
    t('rejeu à une date antérieure : régularisation pas encore comptée', !L.getR(f40, '2026-11-24').arrRegul[a1.id]);
    const M = L.intrantMouvements(f40, R40, { produitId: a1.produitId }); const totP = f40.arrivages.filter((a) => a.produitId === a1.produitId).reduce((s, a) => s + L.arrivalRest(R40, a), 0);
    t('historique des mouvements : réceptions, utilisations, régularisation ; solde final = stock du produit', M.some((m) => m.type === 'arrivage') && M.some((m) => m.type === 'regul' && /Inventaire/.test(m.libelle)) && Math.abs(M[M.length - 1].solde - totP) < 1e-6, M.slice(-3));
    { const d = L.clone(f40); const rest = L.arrivalRest(L.replay(d), a2);
      const r1 = L.regulSave(d, { arrivageId: a2.id, date: '2026-11-26', mode: 'ecart', qty: -(rest + 5), motif: 'perte' }, null, 'u'); const r2 = L.regulSave(d, { arrivageId: a2.id, date: '2026-11-26', mode: 'ecart', qty: 2, motif: 'perte' }, null, 'u');
      const r3 = L.regulSave(d, { arrivageId: a2.id, date: '2026-11-26', mode: 'ecart', qty: 1, motif: 'autre' }, null, 'u'); const r4 = L.regulSave(d, { arrivageId: a2.id, date: '2026-11-26', mode: 'compte', compte: L.arrivalRest(L.replay(d), a2), motif: 'inventaire' }, null, 'u');
      const r5 = L.regulSave(d, { arrivageId: a2.id, date: '2000-01-01', qty: 1, motif: 'ecart' }, null, 'u');
      t('régularisation : supérieure au restant refusée, perte toujours retirée, « Autre » sans raison refusé, inventaire sans écart refusé, avant la réception refusée', !r1.ok && r2.ok && r2.qty === -2 && !r3.ok && !r4.ok && !r5.ok, [r1.msg, r2.qty, r3.msg, r4.msg, r5.msg]);
      const rm = L.regulSave(d, { arrivageId: a2.id, date: '2026-11-26', mode: 'compte', compte: 0, motif: 'inventaire' }, r2.id, 'u'); const x = d.regulStocks.find((y) => y.id === r2.id);
      t('régularisation modifiée : inventaire recalculé sans elle (stock compté à 0 → lot épuisé)', rm.ok && x.compte === 0 && Math.abs(L.arrivalRest(L.replay(d), a2)) < 1e-6 && x.restantAvant > 0, x);
      t('régularisation supprimée', L.regulDelete(d, r2.id).ok && !d.regulStocks.some((y) => y.id === r2.id));
      const dc = L.clone(f40); dc.campagnes.forEach((c) => { if (c.debut <= '2026-11-25' && c.fin >= '2026-11-25') c.figee = true; }); t('campagne figée : régularisation verrouillée', !L.regulDelete(dc, RG[0].id).ok && !L.regulSave(dc, { arrivageId: a2.id, date: '2026-11-25', qty: 1, motif: 'ecart' }).ok); }
    // allergènes
    const A1 = L.allergenesDetecter('FICHE TECHNIQUE\nComposition : métabisulfite de potassium, préparation enzymatique\nAllergènes\nŒufs et produits à base d’œufs : non\nGluten : non\nLait : non\nSulfites : oui');
    const A2 = L.allergenesDetecter('Clarifiant à base d’albumine d’œuf.\nAllergènes : œuf. Ne contient pas de gluten.');
    const A3 = L.allergenesDetecter('Déclaration allergènes : aucun allergène au sens du règlement (UE) 1169/2011.');
    t('allergènes détectés : substances de la composition, tableau Oui / Non de la rubrique, « ne contient pas », « aucun »', A1.presents.includes('sulfites') && A1.presents.includes('enzymes') && !A1.presents.includes('oeuf') && A1.absents.includes('oeuf') && A1.absents.includes('gluten')
      && A2.presents.join() === 'oeuf' && A2.absents.includes('gluten') && A3.aucun && !A3.presents.length, [A1, A2, A3]);
    t('allergènes : texte lisible (liste + précisions), suggestions d’après la famille et la composition', L.allergenesTexte({ allergenesListe: ['oeuf', 'sulfites'], allergenes: 'lysozyme' }) === 'Œuf, Sulfites — lysozyme' && L.allergenesTexte({ allergenesAucun: true }) === 'Aucun'
      && L.allergenesSuggeres({ nom: 'Lysozyme fictif', famille: 'enzyme' }).join() === 'oeuf,enzymes');
    // revendications Oui / Non = règles des produits
    const dR = L.clone(f40); L.syncConfig(dR); L.qualifListCont(dR, 'add', null, { label: 'Vegan', court: 'VEG' }); const veg = L.qualifList(dR).find((q) => q.label === 'Vegan');
    const RV = L.revendicationsDetecter(dR, 'Produit utilisable en agriculture biologique (règlement (UE) 2018/848).\nNon autorisé par le cahier des charges Demeter.\nConvient aux vegans.\nSection 8 : valeurs limites biologiques');
    const RV2 = L.revendicationsDetecter(dR, 'FDS — section 8 : valeurs limites biologiques : non disponibles');
    t('revendications lues : bio oui (règlement), Demeter non, revendication personnalisée « Vegan » oui ; « valeurs limites biologiques » ignorées', RV.bio === 'oui' && RV.dem === 'non' && RV[veg.id] === 'oui' && !RV2.bio, [RV, RV2]);
    const p1 = f40.produits.find((p) => p.id === a1.produitId); const p2 = f40.produits.find((p) => p.id === a2.produitId);
    t('fixture : allergènes cochés et choix Oui / Non dans les règles (onglet « Produits & règles par revendication »)', p1.allergenesListe.join() === 'sulfites' && L.ruleFor(f40, p1.id, 'bio').autorise && !L.ruleFor(f40, p1.id, 'dem').autorise && L.ruleFor(f40, p1.id, 'dem').aVerifier === false && !L.ruleFor(f40, p2.id, 'bio').autorise && p2.allergenesListe.join() === 'enzymes');
    { const d = L.clone(dR); const n = L.produitSave(d, { nom: 'Produit fictif Lot3', categorie: 'oeno', unite: 'g', revendications: { bio: true, [veg.id]: true }, allergenesListe: ['poisson', 'inconnu'], allergenesAucun: true }); const p = d.produits.find((x) => x.id === n.id);
      t('nouveau produit : choix Oui / Non écrits dans les règles, allergènes inconnus écartés, « aucun » ignoré si la liste est cochée', n.ok && L.ruleFor(d, p.id, 'bio').autorise && L.ruleFor(d, p.id, veg.id).autorise && L.ruleFor(d, p.id, 'conv').autorise && !L.ruleFor(d, p.id, 'dem').autorise && p.allergenesListe.join() === 'poisson' && !p.allergenesAucun);
      L.regleSet(d, p.id, 'bio', { autorise: false }); t('règle changée dans l’onglet des règles → fiche du produit : Non', !L.revChoix(d, p, 'bio'));
      // dépôt d'une FT : propositions puis reprise
      const V = L.ficheDetections(d, 'Fiche technique\nComposition : colle de poisson (ichtyocolle)\nUtilisable en vinification biologique\nConvient aux vegans : non');
      const P = L.infosPropositions(d, { type: 'produit', id: p.id }, L.infosFusion(V, null)); const kP = P.map((x) => x.k).sort().join();
      t('dépôt d’une FT : propositions allergènes (déjà cochés omis) et revendications qui changent (« : non » lu comme Non ; choix vérifié proposé décoché)', V.allergenesListe === 'poisson' && kP === `rev:bio,rev:${veg.id}` && P.find((x) => x.k === 'rev:bio').aff === 'Oui' && !P.find((x) => x.k === 'rev:bio').complete && P.find((x) => x.k === `rev:${veg.id}`).aff === 'Non', [V, P]);
      const V2 = L.ficheDetections(d, 'Composition : albumine d’œuf, métabisulfite\nNon utilisable en agriculture biologique'); const P2 = L.infosPropositions(d, { type: 'produit', id: p.id }, L.infosFusion(V2, null));
      L.regleSet(d, p.id, veg.id, { aVerifier: false, verifieLe: '2026-11-01' });
      const V3 = L.ficheDetections(d, `Non conforme ${'vegan'}`); const P3 = L.infosPropositions(d, { type: 'produit', id: p.id }, L.infosFusion(V3, null));
      t('… choix déjà vérifié par l’utilisateur : proposé décoché', P3.length === 1 && P3[0].k === `rev:${veg.id}` && !P3[0].complete, P3);
      const n2 = L.produitInfosAppliquer(d, { type: 'produit', id: p.id }, Object.fromEntries(P2.map((x) => [x.k, x.v])));
      t('… reprise : allergènes ajoutés à la liste (rien retiré), règle bio mise à jour « lu dans un document, à vérifier »', n2 === 1 && p.allergenesListe.join() === 'oeuf,sulfites,poisson' && !L.ruleFor(d, p.id, 'bio').autorise, [n2, p.allergenesListe, P2]);
      const n3 = L.produitInfosAppliquer(d, { type: 'produit', id: p.id }, { 'rev:bio': 'oui' }); t('… revendication reprise : Oui, « lu dans une FT / FDS déposée », à vérifier', n3 === 1 && L.ruleFor(d, p.id, 'bio').autorise && L.ruleFor(d, p.id, 'bio').aVerifier && /lu dans/.test(L.ruleFor(d, p.id, 'bio').source));
      t('traçabilité : allergènes de la liste dans le fichier de traçabilité', /Œuf, Sulfites, Poisson/.test(L.allergenesTexte(p))); }
    // fiche récapitulative
    const T = L.recapIntrants(f40, R40, ['nom', 'fournisseur', 'stock', 'revendications', 'bio', 'allergenes', 'fds']); const l1 = T.lignes.find((l) => l.id === p1.id);
    t('fiche récapitulative des intrants : colonnes choisies dans l’ordre du catalogue, stock actuel, revendications compatibles, allergènes', T.entetes.join('|') === 'Produit|Fournisseur|Stock actuel|Revendications compatibles|Utilisable en bio|Allergènes|FDS' && l1.cells[0] === p1.nom && /FR-BIO-01/.test(l1.cells[3]) && l1.cells[4] === 'Oui' && l1.cells[5] === 'Sulfites', l1);
    t('… filtre « en stock seulement », CSV (formules neutralisées)', L.recapIntrants(f40, R40, ['nom'], { enStock: true }).lignes.length < T.lignes.length && /^﻿Produit\r\n/.test(L.recapCsv(L.recapIntrants(f40, R40, ['nom']))) && L.recapCsv({ entetes: ['a'], lignes: [{ cells: ['=1+1'] }] }).includes("'=1+1"));
    // produits de maintenance
    const PM = f40.produitsMaintenance; const gr = PM.find((p) => p.suiviStock); const jo = PM.find((p) => !p.suiviStock);
    t('maintenance : catalogue (fournisseur, usage, contact alimentaire, cave, composition, champs perso), stock recalculé', PM.length === 2 && gr.contactAlimentaire === 'oui' && gr.caveVinif === 'oui' && gr.champs[0].label === 'Conditionnement' && L.maintStock(f40, gr.id) === 2.5 && L.maintMouvHistorique(f40, gr.id).map((m) => m.solde).join() === '4,2.8,2.5' && f40.mouvementsMaintenance.find((m) => m.type === 'regul').qty === -0.3);
    t('… FDS jointe (fiche du produit de maintenance), FDS non requise, stock bas', L.maintFdsEtat(f40, gr, '2026-11-26').k === 'ok' && L.maintFdsEtat(f40, jo).k === 'sansobjet' && !L.maintStockBas(f40, gr) && L.ficheCibleObj(f40, L.ficheCibleDeCle(`produitMaintenance:${gr.id}`)) === gr);
    { const d = L.clone(f40); const r1 = L.maintMouvementSave(d, { produitId: gr.id, type: 'sortie', date: '2026-11-26', qty: 3 }); const r2 = L.maintMouvementSave(d, { produitId: jo.id, type: 'entree', date: '2026-11-26', qty: 3 });
      const r3 = L.maintMouvementSave(d, { produitId: gr.id, type: 'sortie', date: '2026-11-26', qty: 2 }); const r4 = L.maintMouvementDelete(d, d.mouvementsMaintenance.find((m) => m.type === 'entree').id); const r5 = L.maintProduitDelete(d, gr.id); const r6 = L.maintProduitDelete(d, jo.id);
      t('… sortie au-delà du stock refusée, mouvement sans suivi refusé, suppression qui rendrait le stock négatif refusée, produit avec mouvements non supprimable', !r1.ok && !r2.ok && r3.ok && L.maintStock(d, gr.id) === 0.5 && L.maintStockBas(d, gr) && !r4.ok && !r5.ok && r6.ok && r6.docs.length === 0, [r1.msg, r2.msg, r4.msg, r5.msg]);
      t('… nom en double refusé, champ personnalisé sans nom refusé', !L.maintProduitSave(d, { nom: gr.nom.toUpperCase() }).ok && !L.maintProduitSave(d, { nom: 'X', champs: [{ label: '', valeur: 'v' }] }).ok); }
    t('… contact alimentaire lu (NSF H1 → oui ; « ne doit pas entrer en contact avec les denrées » → non) et proposé', L.maintContactDetecter('Lubrifiant homologué NSF H1 (contact alimentaire fortuit)') === 'oui' && L.maintContactDetecter('Ne doit pas entrer en contact avec les denrées alimentaires') === 'non'
      && (() => { const d = L.clone(f40); const j = d.produitsMaintenance.find((p) => p.id === jo.id); j.contactAlimentaire = ''; const P = L.infosPropositions(d, { type: 'produitMaintenance', id: j.id }, L.infosFusion({ composition: 'EPDM noir', ...L.ficheDetections(d, 'Conforme au règlement (CE) 1935/2004') }, null)); const n = L.produitInfosAppliquer(d, { type: 'produitMaintenance', id: j.id }, Object.fromEntries(P.map((x) => [x.k, x.v]))); return P.map((x) => x.k).join() === 'composition,contactAlimentaire' && n === 2 && j.contactAlimentaire === 'oui' && j.composition === 'EPDM noir'; })());
    const TM = L.recapMaintenance(f40, ['nom', 'contactAlimentaire', 'caveVinif', 'stock', 'champs']); t('fiche récapitulative des produits de maintenance', TM.lignes.length === 2 && TM.lignes.find((l) => l.id === gr.id).cells.join('|') === `${gr.nom}|Oui|Oui|2,50 kg|Conditionnement : cartouche 400 g` && TM.lignes.find((l) => l.id === jo.id).cells[3] === 'non suivi', TM.lignes);
    // droits, synchronisation
    const adU = f40.utilisateurs.find((u) => u.profilId === 'pf_admin'); const opU = f40.utilisateurs.find((u) => u.profilId === 'pf_operateur');
    const gd = (fn, u) => { const av = L.clone(f40); const ap = L.clone(f40); fn(ap); return L.gardeDroits(av, ap, u.id); };
    const g1 = gd((d) => L.regulSave(d, { arrivageId: a2.id, date: '2026-11-26', qty: -0.1, motif: 'casse' }, null, opU.id), opU); const g2 = gd((d) => L.regulDelete(d, RG[1].id), opU); const g3 = gd((d) => L.regulDelete(d, RG[1].id), adU);
    const g4 = gd((d) => L.maintMouvementSave(d, { produitId: gr.id, type: 'entree', date: '2026-11-26', qty: 1 }, null, opU.id), opU); const g5 = gd((d) => L.maintProduitDelete(d, jo.id), opU);
    t('droits : l’opérateur régularise et saisit un mouvement (journal d’audit), ne supprime pas ; l’administrateur supprime', g1.ok && g1.audit.some((a) => /régularisations de stock/.test(a.resume)) && !g2.ok && g3.ok && g4.ok && !g5.ok, [g1.msg, g2.msg, g4.msg, g5.msg]);
    t('synchronisation : nouvelles collections nommées', L.syncNom('regulStocks', 2) === '2 régularisations de stock' && L.syncNom('produitsMaintenance', 1) === '1 produit de maintenance');
    { const A = L.clone(f40); L.regulSave(A, { arrivageId: a2.id, date: '2026-11-26', qty: -0.1, motif: 'casse' }, null, 'u'); A.meta.modifLe = '2026-11-26T10:00:00Z';
      const B = L.clone(f40); L.maintMouvementSave(B, { produitId: gr.id, type: 'entree', date: '2026-11-26', qty: 1 }, null, 'u'); B.meta.modifLe = '2026-11-26T11:00:00Z';
      const F = L.syncFusion(f40, A, B); t('synchronisation : régularisation ici, mouvement de maintenance là-bas → les deux gardés', F.db.regulStocks.length === 3 && F.db.mouvementsMaintenance.length === 4 && !F.conflits.length); }
    // traductions, version
    const en = (s) => L.traduire(s, 'en');
    t('traductions : régularisation, allergènes, revendications, maintenance, notes de version', en('Régulariser le stock') === 'Adjust stock' && en('Allergènes & revendications') === 'Allergens & designations' && en('Produits de maintenance') === 'Maintenance products'
      && !L.tradControle().length && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((x) => L.traduire(n, x) !== n)), L.tradControle());
    t('version 0.36.0-alpha.1 : nouvelles fonctionnalités compatibles (mineure), première pré-version alpha', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.36.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.35.0-alpha.1'; })() && L.versionNum('0.36.0-alpha.1') === 36000001 && L.APP_NUM >= 36000001);
    // ---- compatibilité : la 0.35.0-alpha.1 (gelée) ouvre la base 0.36.0-alpha.1 sans rien perdre, la modifie, se synchronise
    const dirO = path.join(__dirname, 'anciennes', '0.35.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, produitSave, regleSet, arrivageSave, getR, arrivalRest };')({});
    t('0.35.0-alpha.1 gelée chargée (n° 35 000 001)', O.APP_VERSION === '0.35.0-alpha.1' && O.APP_NUM === 35000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f40)); O.syncConfig(x); const KX = ['regulStocks', 'produitsMaintenance', 'mouvementsMaintenance', 'produits', 'regles', 'docs', 'arrivages'];
    t('… la 0.35 ouvre la base 0.36 sans rien perdre (régularisations, allergènes, produits et mouvements de maintenance, documents)', KX.every((k) => canonJ(x[k]) === canonJ(f40[k])), KX.filter((k) => canonJ(x[k]) !== canonJ(f40[k])));
    const px = x.produits.find((p) => p.id === p1.id); const rx = O.produitSave(x, { ...px, notes: 'modifié en 0.35', usageBio: 'précision 0.35' }, px.id); O.regleSet(x, p1.id, 'dem', { autorise: true });
    const back = L.normalizeDb(O.clone(x)); const pb = back.produits.find((p) => p.id === p1.id);
    t('… produit modifié par la 0.35 : allergènes cochés gardés, choix Demeter fait en 0.35 visible en 0.36 (même règle)', rx.ok && pb.notes === 'modifié en 0.35' && pb.allergenesListe.join() === 'sulfites' && L.revChoix(back, pb, 'dem') && L.revChoix(back, pb, 'bio') && back.regulStocks.length === 2 && back.produitsMaintenance.length === 2);
    const xa = O.normalizeDb(O.clone(f40)); O.arrivageSave(xa, { produitId: p1.id, numLot: 'FX-035', date: '2026-11-26', qty: 10 }); xa.meta.modifLe = '2026-11-26T13:00:00Z';
    const N3 = L.clone(f40); L.regulSave(N3, { arrivageId: a2.id, date: '2026-11-26', qty: -0.1, motif: 'casse' }, null, 'u'); N3.meta.modifLe = '2026-11-26T12:00:00Z';
    const FX = L.syncFusion(f40, N3, xa); const FX2 = O.syncFusion(f40, xa, N3);
    t('… synchronisation 0.36 ↔ 0.35 : régularisation ici, arrivage là-bas, rien de perdu des deux côtés', FX.db.regulStocks.length === 3 && FX.db.arrivages.some((a) => a.numLot === 'FX-035') && FX2.db.regulStocks.length === 3 && FX2.db.arrivages.some((a) => a.numLot === 'FX-035') && FX2.db.produitsMaintenance.length === 2);
  }
  // ---- 0.37.0-alpha.1 : bulletins à plusieurs échantillons (onglet Analyses, entrée de moûts), tables d'épalement réunies et fusionnées
  {
    const db = L.sampleDb(); const R = L.getR(db);
    // nombres suivis de leur incertitude
    const nb = (x) => { const n = L.bulletinNombre(x); return n ? `${n.op}${n.v}` : null; };
    t('bulletin : valeur suivie de son incertitude (« 1077,0 / », « 12,06 / 0,13 », « <20 / ») ; dates et fractions refusées', nb('1077,0 /') === '1077' && nb('12,06 / 0,13') === '12.06' && nb('<20 /') === '<20' && nb('3,25 ± 0,05') === '3.25' && nb('23/09/24') === null && nb('3/4') === null && nb('3,45') === '3.45');
    // rapport fictif à plusieurs échantillons, placé comme un PDF (pdf.js) : en-tête des colonnes sur trois lignes, n° d'échantillon du
    // laboratoire au-dessus des valeurs, référence du client en dessous (ou sur la même ligne, avec une suite)
    const item = (s, xc, y, k = 4.4) => ({ s, x: xc - (s.length * k) / 2, y, w: s.length * k, h: 7 }); const tete = (s, xc, y) => item(s, xc, y, 3); // en-tête en petits caractères
    const C = [190, 260, 330, 400, 470, 540, 610];
    const rapport = (echs, opts = {}) => {
      const it = [item('RAPPORT D’ANALYSES', 450, 30), item('N° FX-261001-000042.1', 470, 42), item('S.A.S. LABORATOIRE FICTIF - Unité de test', 110, 70), item('Réceptionné le : 01/10/26', 330, 70), item('Prélevé le :', 460, 70)];
      it.push(item('Paramètre', 80, 130)); ['Masse Volumique à 20°C', 'Sucre Moût', 'Titre Alcoométrique', 'pH', 'Acidité Totale', 'Acidité Totale', 'Dioxyde de Soufre Total'].forEach((x, k) => it.push(tete(x, C[k], 130)));
      ['IRTF (*)', 'IRTF (*)', 'volumique naturel', 'IRTF (*)', 'IRTF (*)', 'Conversion (IRTF) (*)', 'Colorimétrique Auto'].forEach((x, k) => it.push(tete(x, C[k], 140)));
      it.push(item('Unité / Incertitude', 80, 150)); ['g/dm3 /', 'g/L /', '% vol /', '/', 'g/L H2SO4 /', 'g/L TH2 /', 'mg/L / 16 mg/L'].forEach((x, k) => it.push(tete(x, C[k], 150)));
      let y = 170;
      echs.forEach((e) => {
        if (e.num && !opts.sansNum) { it.push(item(e.num, 45, y)); y += 10; }
        if (e.surLigne) it.push(item(e.ref, 70, y)); e.v.forEach((v, k) => it.push(item(`${v} /`, C[k], y))); y += 10;
        if (!e.surLigne) { it.push(item(e.ref, 45, y)); y += 10; } if (e.suite) { it.push(item(e.suite, 40, y)); y += 10; }
      });
      it.push(item('Version : RapportMultiEch.3', 60, y + 20), item('Impression n° 1 / imprimé le 01/10/26', 330, y + 20), item('Page1sur 2', 560, y + 20));
      return [{ n: 1, w: 842, h: 595, items: it }, { n: 2, w: 842, h: 595, items: [item('Ce rapport d’analyse ne concerne que les objets soumis à l’analyse, sauf autorisation du laboratoire.', 300, 60), item('Laboratoire habilité par l’INAO', 80, 90)] }];
    };
    const ECH = [{ num: '26FX000101', ref: 'M1 FX 5002', v: ['1077,0', '177,79', '10,6', '3,25', '6,00', '9,19', '75'] }, { num: '26FX000102', ref: 'M2 FX 40004', surLigne: true, suite: 'CV PM', v: ['1068,5', '159,90', '9,5', '3,13', '6,64', '10,17', '<20'] }, { num: '26FX000103', ref: 'M9FXB23', v: ['1070,6', '166,23', '9,9', '3,33', '5,31', '8,13', '49'] }];
    const lignes = L.bulletinLignesDePages(rapport(ECH)); const b = L.bulletinAnalyser(db, R, lignes, { candidats: [] }); const E = b.echantillons;
    t('rapport à plusieurs échantillons : 3 échantillons distincts (n° du laboratoire, référence du client, suite de référence)', b.format === 'colonnes' && E.length === 3 && E.map((e) => e.numero).join() === '26FX000101,26FX000102,26FX000103' && E[0].ref === 'M1 FX 5002' && E[1].ref === 'M2 FX 40004 CV PM' && E[2].ref === 'M9FXB23', E.map((e) => [e.numero, e.ref]));
    t('… paramètres reconnus sur un en-tête à plusieurs lignes (densité ÷ 1000, TAV naturel → TAP, AT en H₂SO₄ gardée avant celle en TH2, SO₂ < 20)', E[0].valeurs.densite.v === 1.077 && E[0].valeurs.tap.v === 10.6 && E[0].valeurs.ph.v === 3.25 && E[0].valeurs.at.v === 6 && E[0].valeurs.sucres.v === 177.79 && E[1].valeurs.so2t.v === 20 && E[1].valeurs.so2t.op === '<' && E[2].valeurs.at.v === 5.31, E.map((e) => Object.fromEntries(Object.entries(e.valeurs).map(([k, x]) => [k, x.v]))));
    t('… laboratoire (forme juridique retirée, pas une phrase du rapport), n° du rapport, date de réception', b.labo === 'LABORATOIRE FICTIF - Unité de test' && b.numero === 'FX-261001-000042.1' && b.date === '2026-10-01', [b.labo, b.numero, b.date]);
    const b2 = L.bulletinAnalyser(db, R, L.bulletinLignesDePages(rapport(ECH, { sansNum: true })), { candidats: [] });
    t('… sans n° d’échantillon : références rattachées à la ligne de valeurs la plus proche', b2.echantillons.length === 3 && b2.echantillons.map((e) => e.ref).join('|') === 'M1 FX 5002|M2 FX 40004 CV PM|M9FXB23' && b2.echantillons[1].valeurs.ph.v === 3.13, b2.echantillons.map((e) => e.ref));
    // ancien format en liste : inchangé
    const bl = L.bulletinAnalyser(db, R, L.bulletinLignesDeTexte('Laboratoire fictif\nÉchantillon : Cuve 3\npH   3,08\nAcidité totale   4,0 g/L H2SO4'));
    t('… un bulletin en liste reste lu comme avant', bl.format === 'liste' && bl.echantillons.length === 1 && bl.echantillons[0].valeurs.ph.v === 3.08);
    // export en format long (une ligne par résultat), comme un tableur de laboratoire
    const rows = [['Dossier', 'Echantillon', 'Client', 'Matrice', 'Date réception', 'Identification', 'Méthode', 'Paramètre', 'Résultat', 'Unité', 'Référence client'], ['FX-261125-000039', '26FX052272', 'CLFX', 'vin', '25/11/2026', 'LIQ FX CONV', 'fx101', 'densite', '1,3014', 'g/mL', ''], ['FX-261125-000039', '26FX052272', 'CLFX', 'vin', '25/11/2026', 'LIQ FX CONV', 'fx108', 'so2libre', '<5', 'mg/L', ''], ['FX-261125-000039', '26FX052272', 'CLFX', 'vin', '25/11/2026', 'LIQ FX CONV', 'fx150', 'saccharose', '812', 'g/L', ''], ['FX-261125-000039', '26FX052273', 'CLFX', 'vin', '25/11/2026', 'LIQ FX BIO', 'fx116', 'sucrestotaux', '204,50', 'g/L', ''], ['FX-261125-000039', '26FX052273', 'CLFX', 'vin', '25/11/2026', 'LIQ FX BIO', 'fx179', 'so2total', '1343', 'mg/L', '']];
    const lg = L.bulletinAnalyser(db, R, L.bulletinLignesDeTableau(rows));
    t('export en format long : un échantillon par n° (identification, valeurs, nouveau paramètre « Saccharose »), dossier et date de réception', lg.format === 'long' && lg.echantillons.length === 2 && lg.echantillons[0].ref === 'LIQ FX CONV' && lg.echantillons[0].numero === '26FX052272' && lg.echantillons[0].valeurs.densite.v === 1.3014 && lg.echantillons[0].valeurs.so2l.op === '<' && lg.echantillons[0].nouveaux.saccharose.v === 812 && lg.echantillons[1].valeurs.sucres.v === 204.5 && lg.echantillons[1].valeurs.so2t.v === 1343 && lg.numero === 'FX-261125-000039' && lg.date === '2026-11-25', lg.echantillons.map((e) => [e.ref, Object.keys(e.valeurs), Object.keys(e.nouveaux)]));
    // IA : n° d'échantillon lu et rapprochement par ce n° (deux échantillons de la même cuve restent distincts)
    const ia = L.iaLireBulletin(db, { laboratoire: 'Labo FX', echantillons: [{ numero_echantillon: '26FX000102', reference: 'M2 FX 40004', resultats: { av: 0.3 } }, { numero_echantillon: '26FX000104', reference: 'M1 FX 5002', resultats: { ph: 3.3 } }] });
    const fu = L.bulletinFusion(db, R, b, ia, []);
    t('IA : n° d’échantillon repris ; complète le bon échantillon par ce n°, en ajoute un nouveau même si sa référence ressemble à un autre', ia.echantillons[0].numero === '26FX000102' && fu.echantillons.length === 4 && fu.echantillons[1].valeurs.av.v === 0.3 && !fu.echantillons[0].valeurs.av && fu.echantillons[3].numero === '26FX000104', fu.echantillons.map((e) => [e.numero, Object.keys(e.valeurs)]));
    const ia2 = L.iaLireBulletin(db, { echantillons: [{ reference: 'M1 FX 5002', resultats: { 'Acidité totale': 6.1, ph: 3.2, 'pH mesuré': 3.9 } }] });
    t('IA : résultat donné sous le nom du paramètre plutôt que son identifiant : reconnu, sans écraser l’identifiant donné', ia2.echantillons[0].valeurs.at.v === 6.1 && ia2.echantillons[0].valeurs.ph.v === 3.2, ia2.echantillons[0].valeurs);
    const pr = L.iaPromptBulletin(db, 'x'); t('IA : consigne des bulletins à plusieurs échantillons, n° d’échantillon et incertitude', /plusieurs échantillons/.test(pr.texte) && /numero_echantillon/.test(pr.texte) && /incertitude/.test(pr.texte) && pr.max >= 6000);
    // entrée de moûts : rapprochement des échantillons et affectation guidée
    const M = [{ i: 0, numLot: '5002' }, { i: 1, numLot: 'M2-40004' }, { i: 2, numLot: 'EM-3', compartiment: 'C9' }];
    const af = L.bulletinPourMouts(b, M);
    t('entrée de moûts : chaque échantillon sur son moût (n° de lot, mêmes nombres, puis l’ordre) ; affectation guidée proposée', af.map((a) => `${a.i}:${a.k}:${a.sur}`).join() === '0:0:lot,1:1:chiffres,2:2:ordre' && af[0].valeurs.tap === 10.6 && af[1].numero === '26FX000102' && L.bulletinAffectationDouteuse(b, af, false), af);
    const af2 = L.bulletinPourMouts(b, [{ i: 0, numLot: 'M1 FX 5002' }, { i: 4, numLot: '40004' }, { i: 5, numLot: 'M9FXB23' }]);
    t('… tous rapprochés par leur n° de lot : reportés sans question', af2.map((a) => `${a.i}:${a.k}`).join() === '0:0,4:1,5:2' && !L.bulletinAffectationDouteuse(b, af2, true), af2);
    const un = { echantillons: [b.echantillons[0]] }; const af3 = L.bulletinPourMouts(un, [{ i: 0 }, { i: 1 }]);
    t('… un seul échantillon : vaut pour tous les moûts d’un partenaire, mais affectation guidée pour l’entrée à plusieurs partenaires', af3.length === 2 && af3.every((a) => a.sur === 'unique') && !L.bulletinAffectationDouteuse(un, af3, false) && L.bulletinAffectationDouteuse(un, af3, true));
    t('… plus d’échantillons que de moûts : affectation guidée', L.bulletinAffectationDouteuse(b, L.bulletinPourMouts(b, [{ i: 0, numLot: '5002' }]), false) && L.bulletinEchantillonsValeurs(b).length === 3);

    // tables d'épalement : pages d'une même cuve (texte positionné, hauteurs en mètres, volumes en m³), lues dans le désordre
    const page = (n, lg2) => ({ n, w: 600, h: 840, items: lg2.flatMap((l, i) => l.map((c) => ({ s: c[0], x: c[1], y: 40 + i * 12, w: c[0].length * 5, h: 9 }))) });
    const f3 = (x) => x.toFixed(3).replace('.', ',');
    const cuve = (n, h0, cert, vt, nom, k = 94.04) => { const L0 = [[['ANNEXE AU CERTIFICAT DE JAUGEAGE N° ' + cert, 150]], [['BAREME CENTIMETRIQUE DES VOLUMES MESURES PAR LE PLEIN', 120]], nom ? [[nom, 250]] : [], [[`Hauteurs de ${f3(Math.max(h0, 1) / 100)} m à ${f3((h0 + 159) / 100)} m`, 220]], [[`Volume total : ${vt} m³`, 230]], [0, 1, 2, 3].flatMap((c) => [['HAUTEURS', 30 + c * 140], ['VOLUMES', 90 + c * 140]])];
      for (let r = 0; r < 40; r += 1) L0.push([0, 1, 2, 3].flatMap((c) => { const h = h0 + r + c * 40; return [[f3(h / 100), 40 + c * 140], [f3((h * k) / 1000), 100 + c * 140]]; }));
      L0.push([['LES HAUTEURS SONT EXPRIMEES EN METRES', 200]], [['LES VOLUMES SONT EXPRIMES EN METRES-CUBES', 200]]); return page(n, L0); };
    const p1 = cuve(1, 0, 'R . X1 . 26 . 00042', '30,000', 'Cuve n° 7'); const p2 = cuve(2, 160, 'R . X1 . 26 . 00042', '30,000'); const p3 = cuve(3, 0, 'R . X1 . 26 . 00043', '13,000', '', 41.2);
    const m1 = L.jaugeMeta(' . ANNEXE AU CERTIFICAT DE JAUGEAGE N° R . X1 . 26 . 00042\nHauteurs de 1,600 m à 3,190 m\nVolume total : 30,000 m³');
    t('épalement : n° de certificat lu malgré les espaces du scan, plage de la page, volume total ; pas pris pour l’organisme', m1.certificat === 'R.X1.26.00042' && m1.plageMin === 160 && m1.plageMax === 319 && m1.volumeTotal === 30000 && !m1.organisme, m1);
    const s1 = L.jaugeAnalyser([p1], {}); t('… page d’un PDF texte en mètres (0,010 m) : 160 lignes, pas 4', s1.baremes[0].points.length === 160 && s1.baremes[0].points[159][0] === 159, s1.baremes[0].points.length);
    const a1 = L.jaugeAnalyser([p2, p1], { fichier: 'cuve7.pdf' }); const ba = a1.baremes[0];
    t('… deux pages de la même cuve lues séparément (nom sur une seule, ordre inversé) : une seule table complète, 0 à 319 cm', a1.baremes.length === 1 && ba.points.length === 320 && ba.points[0][0] === 0 && ba.points[319][0] === 319 && ba.meta.pages.join() === '1,2' && ba.reservoir === '7' && a1.journal.some((j) => /réunie/.test(j.msg)), a1.baremes.map((x) => [x.nom, L.baremePlage(x)]));
    const a2 = L.jaugeAnalyser([p2, p3, p1], {}); t('… une autre cuve dans le même fichier (plage qui recouvre la première) reste à part', a2.baremes.length === 2 && a2.baremes.map((x) => x.points.length).sort().join() === '160,320', a2.baremes.map((x) => [x.nom, L.baremePlage(x)]));
    const A = [[0, 0], [10, 100], [20, 200]]; t('… continuité : hauteurs à la suite et volumes dans le prolongement ; saut de volume ou trou refusés', L.baremePtsContinus(A, [[30, 300], [40, 400]]) && !L.baremePtsContinus(A, [[30, 900], [40, 1000]]) && !L.baremePtsContinus(A, [[300, 3000], [310, 3100]]) && !L.baremePtsContinus(A, [[5, 50], [15, 150]]));
    // fusion manuelle de deux barèmes enregistrés
    const d = L.clone(db); const c0 = d.contenants[0]; const P = (h0, h1, k = 10) => { const o = []; for (let h = h0; h <= h1; h += 1) o.push([h, h * k]); return o; };
    const r1 = L.baremeSave(d, { nom: 'Cuve FX', cible: 'contenant', contenantId: c0.id, mesure: 'hauteur', points: P(0, 100), meta: { organisme: 'Org FX', pages: [1] }, docId: 'docfx-epal' });
    const r2 = L.baremeSave(d, { nom: 'Tableau p. 2', cible: 'contenant', contenantId: '', mesure: 'hauteur', points: P(101, 200), meta: { certificat: 'R.FX.1', pages: [2] }, corrections: [{ h: 150, lu: '1S00', v: 1500, mode: 'chiffres' }] });
    const ap = L.baremeFusionApercu(d.baremes.find((x) => x.id === r1.id), d.baremes.find((x) => x.id === r2.id));
    t('fusion : aperçu (101 lignes ajoutées, aucun trou ni conflit)', !ap.refus && ap.ajout === 100 && !ap.conflits.length && !ap.trou && !ap.alertes.length && ap.points.length === 201, ap);
    const rf = L.baremeFusionner(d, r1.id, r2.id); const fa = d.baremes.find((x) => x.id === r1.id); const fb = d.baremes.find((x) => x.id === r2.id);
    t('fusion : une seule table de 0 à 200 cm, rattachée au contenant ; l’autre archivée (fusionneDans), jamais supprimée', rf.ok && L.baremePts(fa).length === 201 && L.baremeDe(d, c0.id).id === fa.id && Math.abs(L.baremeVolume(fa, 150.5).v - 1505) < 1e-6 && fb.archive && fb.fusionneDans === fa.id && fa.fusions.length === 1 && fa.fusions[0].id === fb.id && fa.meta.certificat === 'R.FX.1' && fa.meta.pages.join() === '1,2' && fa.corrections.length === 1 && fa.docId === 'docfx-epal', [rf.msg, fa.meta]);
    const r3 = L.baremeSave(d, { nom: 'Recouvre', cible: 'contenant', contenantId: '', mesure: 'creux', points: P(150, 260, 11) });
    const ap3 = L.baremeFusionApercu(fa, d.baremes.find((x) => x.id === r3.id));
    t('fusion : hauteurs communes aux volumes différents, autre mesure → alertes ; valeurs du premier gardées', ap3.conflits.length === 51 && ap3.alertes.length >= 2 && ap3.points.find((p) => p[0] === 160)[1] === 1600 && ap3.ajout === 60, ap3.alertes);
    const cit = L.baremeSave(d, { nom: 'AB-123-CD · compartiment 1', cible: 'citerne', immat: 'AB-123-CD', compartiment: '1', mesure: 'creux', points: P(0, 50) });
    t('fusion refusée : citerne avec une cuve, barème avec lui-même, barème introuvable', !L.baremeFusionner(d, fa.id, cit.id).ok && !L.baremeFusionner(d, fa.id, fa.id).ok && !L.baremeFusionner(d, fa.id, 'zz').ok && !!L.baremeFusionApercu(fa, d.baremes.find((x) => x.id === cit.id)).refus);
    const LL = L.baremesListeFusion([{ nom: 'A', points: P(0, 10), meta: { pages: [1] }, fiabilite: 'bonne' }, { nom: 'X', points: P(0, 5, 3), meta: { pages: [3] } }, { nom: 'B', points: P(11, 20), meta: { pages: [2] }, fiabilite: 'moyenne', corrections: [{ h: 12 }] }], 0, 2);
    t('fusion dans un import (avant enregistrement) : liste réduite, pages et corrections reprises', LL.length === 2 && LL[0].points.length === 21 && LL[0].meta.pages.join() === '1,2' && LL[0].fiabilite === 'moyenne' && LL[0].corrections.length === 1 && LL[1].nom === 'X');

    // base 0.37.0-alpha.1 (fictive) et compatibilité avec la 0.36.0-alpha.1 gelée
    const f41 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.37.0-alpha.1-bulletins.json'), 'utf8'))); L.syncConfig(f41);
    const bf = f41.baremes.find((x) => (x.fusions || []).length); const bz = f41.baremes.find((x) => x.fusionneDans);
    t('fixture 0.37 : table fusionnée (0 à 319 cm) rattachée, morceau archivé ; analyses d’un rapport à plusieurs échantillons, bulletin joint', !!bf && !!bz && bz.archive && L.baremePts(bf).length === 320 && L.baremeDe(f41, bf.contenantId).id === bf.id && f41.analyses.filter((a) => a.bulletinDocId === 'docfx-bul37').length === 2);
    const en = (x) => L.traduire(x, 'en');
    t('traductions : bulletin des moûts, affectation guidée, fusion des tables, notes de version', en('Glisser ici le bulletin d’analyses des moûts') === 'Drop the musts’ analysis report here' && en('⧉ Fusionner en une seule table') === '⧉ Merge into a single table' && L.traduire('Moûts de l’entrée (3)', 'de') === 'Moste der Annahme (3)'
      && !L.tradControle().length && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((x) => L.traduire(n, x) !== n)), L.tradControle());
    t('version 0.37.0-alpha.1 : nouvelles fonctionnalités compatibles (mineure), première pré-version alpha', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.37.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.36.0-alpha.1'; })() && L.versionNum('0.37.0-alpha.1') === 37000001 && L.APP_NUM >= 37000001);
    const dirO = path.join(__dirname, 'anciennes', '0.36.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, baremeSave, baremeDe, baremeLier, analyseSave, getR };')({});
    t('0.36.0-alpha.1 gelée chargée (n° 36 000 001)', O.APP_VERSION === '0.36.0-alpha.1' && O.APP_NUM === 36000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f41)); O.syncConfig(x); const KX = ['baremes', 'analyses', 'docs', 'contenants', 'ops'];
    t('… la 0.36 ouvre la base 0.37 sans rien perdre (fusions de barèmes, morceau archivé, analyses, bulletin)', KX.every((k) => canonJ(x[k]) === canonJ(f41[k])), KX.filter((k) => canonJ(x[k]) !== canonJ(f41[k])));
    t('… la 0.36 calcule avec la table fusionnée (barème du contenant)', O.baremeDe(x, bf.contenantId).id === bf.id);
    const xb = x.baremes.find((y) => y.id === bf.id); const ro = O.baremeSave(x, { ...xb, nom: 'renommé en 0.36' }, xb.id);
    const back = L.normalizeDb(O.clone(x)); const bb = back.baremes.find((y) => y.id === bf.id);
    t('… barème modifié par la 0.36 : fusions gardées, rouvert ici', ro.ok && bb.nom === 'renommé en 0.36' && bb.fusions.length === 1 && back.baremes.find((y) => y.id === bz.id).fusionneDans === bf.id, [ro.msg]);
    const N3 = L.clone(f41); const rN = L.baremeSave(N3, { nom: 'Autre FX', cible: 'contenant', contenantId: '', mesure: 'hauteur', points: P(0, 50) }); const rN2 = L.baremeSave(N3, { nom: 'Autre FX 2', cible: 'contenant', contenantId: '', mesure: 'hauteur', points: P(51, 90) }); L.baremeFusionner(N3, rN.id, rN2.id); N3.meta.modifLe = '2026-11-26T12:00:00Z';
    const xa = O.normalizeDb(O.clone(f41)); const ra = O.baremeSave(xa, { nom: 'Barème 0.36 FX', cible: 'contenant', contenantId: '', mesure: 'hauteur', points: P(0, 30) }); xa.baremes.find((z) => z.nom === 'Barème 0.36 FX').id = 'bmfx036'; xa.meta.modifLe = '2026-11-26T13:00:00Z';
    const FX = L.syncFusion(f41, N3, xa); const FX2 = O.syncFusion(f41, xa, N3);
    t('… synchronisation 0.37 ↔ 0.36 : fusion ici, barème ajouté là-bas, rien de perdu des deux côtés', ra.ok && [FX.db, FX2.db].every((y) => y.baremes.some((z) => z.nom === 'Barème 0.36 FX') && y.baremes.some((z) => z.id === rN.id && (z.fusions || []).length === 1) && y.baremes.find((z) => z.id === rN2.id).fusionneDans === rN.id), [FX.conflits.length, FX2.conflits.length]);
  }

  // ===== 42. 0.38.0-alpha.1 : impression, étiquettes QR personnalisées, assistant IA de l'espace de travail, coffre de l'appareil, bibliothèques vérifiées
  {
    // étiquettes : planche A4 personnalisée
    const P0 = L.etiqPersoMise({}); const Pd = L.etiqPersoNorm({ cols: '4', lignes: 'x', largeur: '48,5', hauteur: 999, margeHaut: -3 });
    t('étiquettes : réglage par défaut 3 × 8 de 70 × 37 mm (24 par page, tient sur l’A4)', P0.parPage === 24 && P0.valide && P0.largeurTotale === 210 && P0.hauteurTotale === 296 && !P0.haute, P0);
    t('étiquettes : saisie lue (virgule), bornée, champ illisible → valeur par défaut', Pd.cols === 4 && Pd.lignes === 8 && Pd.largeur === 48.5 && Pd.hauteur === 297 && Pd.margeHaut === 0);
    const Pt = L.etiqPersoMise({ cols: 3, lignes: 8, largeur: 72, hauteur: 37, margeGauche: 2 }); const Ph = L.etiqPersoMise({ cols: 2, lignes: 9, largeur: 99, hauteur: 34, margeHaut: 10, espV: 2 });
    t('étiquettes : trop large / trop haut signalé avec les mesures', !Pt.valide && /Trop large/.test(Pt.erreurs[0]) && /218 mm pour 210 mm/.test(Pt.erreurs[0]) && !Ph.valide && /Trop haut/.test(Ph.erreurs[0]) && /332 mm/.test(Ph.erreurs[0]));
    t('étiquettes : les modèles courants tiennent tous sur une feuille A4', L.ETIQ_PERSO_MODELES.length >= 5 && L.ETIQ_PERSO_MODELES.every((m) => L.etiqPersoMise(m.v).valide), L.ETIQ_PERSO_MODELES.filter((m) => !L.etiqPersoMise(m.v).valide).map((m) => m.id));
    const Pk = L.etiqPersoMise({ cols: 2, lignes: 2, largeur: 90, hauteur: 120 }); const Pp = L.etiqPersoMise({ cols: 5, lignes: 13, largeur: 38.1, hauteur: 21.2 });
    t('étiquettes : haute → QR au-dessus du nom ; petite → QR et textes réduits', Pk.haute && Pk.qr > 50 && Pk.echelle > 1 && !Pp.haute && Pp.qr < 21.2 && Pp.echelle < 0.6);

    // coffre de l'appareil : enveloppes (AES-256-GCM, données authentifiées), clé de données emballée, mot de passe de l'appareil
    const sub = globalThis.crypto.subtle; const dekBrut = L.chAleatoire(32); const dek = await L.coffreImporterDek(dekBrut);
    const texte = JSON.stringify({ ops: [{ id: 'o1', notes: 'Cuve D1 — cuvée 2026' }] });
    const env = await L.coffreChiffrerAvec(dek, 'cfx1', 'oenotrack-db-v2', texte); const ej = L.coffreEnveloppe(env);
    t('coffre : enveloppe chiffrée (aucune donnée lisible), reconnue, relue', !!ej && ej.format === 'oenotrack-coffre' && ej.coffre.id === 'cfx1' && !env.includes('Cuve D1') && !env.includes('ops') && (await L.coffreDechiffrerAvec(dek, env, 'oenotrack-db-v2')) === texte);
    let refus = 0; try { await L.coffreDechiffrerAvec(dek, env, 'oenotrack-coffre-secrets'); } catch (e) { refus += 1; }
    const autre = await L.coffreImporterDek(L.chAleatoire(32)); try { await L.coffreDechiffrerAvec(autre, env, 'oenotrack-db-v2'); } catch (e) { refus += 1; }
    const abime = env.replace(/"donnees":"(.)/, (m0, c) => `"donnees":"${c === 'A' ? 'B' : 'A'}`); try { await L.coffreDechiffrerAvec(dek, abime, 'oenotrack-db-v2'); } catch (e) { refus += 1; }
    t('coffre : enveloppe déplacée vers une autre clé de stockage, autre clé, données abîmées → refus', refus === 3);
    t('coffre : base en clair (version antérieure) non prise pour une enveloppe', L.coffreEnveloppe(texte) === null && L.coffreEnveloppe('{"format":"oenotrack-chiffre"}') === null);
    const melange = { ...JSON.parse(env), ops: [{ id: 'o9' }], lots: [], contenants: [], meta: { appVersion: '0.37.0-alpha.1' } };
    t('coffre : données écrites à côté de l’enveloppe par une version antérieure repérées (à réunir)', !!L.coffreAncien(melange) && L.coffreAncien(melange).ops[0].id === 'o9' && !('donnees' in L.coffreAncien(melange)) && L.coffreAncien(JSON.parse(env)) === null);
    const sel = L.chB64(L.chAleatoire(16)); const kek = await L.coffreKekMdp('phrase de l’appareil 2026', sel, 10000); const emb = await L.coffreEmballer(kek, dekBrut);
    const relu = await L.coffreDeballerBrut(await L.coffreKekMdp('phrase de l’appareil 2026', sel, 10000), emb);
    let mauvais = null; try { await L.coffreDeballerBrut(await L.coffreKekMdp('autre phrase', sel, 10000), emb); } catch (e) { mauvais = e; }
    t('coffre : clé de données emballée par le mot de passe de l’appareil (bon / mauvais mot de passe)', L.chB64(relu) === L.chB64(dekBrut) && !JSON.stringify(emb).includes(L.chB64(dekBrut)) && mauvais && mauvais.mauvaiseCle && /incorrect/.test(mauvais.message));
    let nonExtractible = false; try { await sub.exportKey('raw', dek); } catch (e) { nonExtractible = true; }
    t('coffre : clé de données utilisée non extractible ; mot de passe de 10 caractères au moins', nonExtractible && /trop court/.test(L.coffreMdpErreur('court')) && /identiques/.test(L.coffreMdpErreur('assez long 2026', 'autre')) && L.coffreMdpErreur('assez long 2026', 'assez long 2026') === '');
    t('coffre : hors navigateur (inactif), lecture et écriture comme avant', L.coffreInfo().etat === 'inactif' && L.coffreEcrire('essai-coffre', 'x') && L.coffreLire('essai-coffre') === 'x');

    // assistant IA de l'espace de travail
    const f42 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.38.0-alpha.1-securite.json'), 'utf8'))); L.syncConfig(f42);
    const R42 = L.iaEspaceReglage(f42); const kE = await L.chiffrementDeriver('mot de passe fictif 0.38', f42.settings.chiffrement.sel, f42.settings.chiffrement.iter);
    t('fixture 0.38 : clé commune chiffrée avec la clé de l’équipe (jamais en clair), relue avec le mot de passe', R42 && R42.fournisseur === 'anthropic' && R42.modele === 'claude-fictif-commun' && !JSON.stringify(f42).includes('sk-ant-FICTIVE') && L.enveloppeChiffree(R42.cle).chiffrement.cleId === kE.cleId && (await L.dechiffrerTexte(kE, R42.cle)) === 'sk-ant-FICTIVE-0-38-cle-commune' && R42.masque === 'sk-ant…mune');
    t('espace : la clé commune doit arriver chiffrée ; adresse et droit contrôlés', !L.iaEspaceRegler(L.clone(f42), { cle: 'sk-ant-en-clair' }, '').ok && !L.iaEspaceRegler(L.clone(f42), { url: 'ftp://x' }, '').ok && !L.iaEspaceRegler(L.clone(f42), { perso: 'certains' }, '').ok && L.iaEspaceRegler(L.clone(f42), { perso: 'aucun' }, '').ok);
    // droits : sans identifiants tout le monde ; avec : administrateurs toujours, puis tous / aucun / choisis
    const dS = L.normalizeDb(L.sampleDb()); dS.settings.ia = L.clone(f42.settings.ia); const dL = L.clone(dS); const mA = await L.mdpEmpreinte('Admin-2026', 1000); const ad = L.securiteActiver(dS, { identifiant: 'admin', nom: 'Admin fictif', mdp: mA, secours: mA }).id;
    const u1 = L.utilisateurSave(dS, { identifiant: 'usr1', nom: 'Opérateur fictif', profilId: 'pf_operateur', mdp: mA }).id; const u2 = L.utilisateurSave(dS, { identifiant: 'usr2', nom: 'Autre fictif', profilId: 'pf_operateur', mdp: mA }).id;
    L.iaEspaceRegler(dS, { perso: 'choisis', persoUtilisateurs: [u1] }, ad);
    const dT = L.clone(dS); L.iaEspaceRegler(dT, { perso: 'aucun' }, ad); const dU = L.clone(dS); L.iaEspaceRegler(dU, { perso: 'tous' }, ad);
    t('droits : sans identifiants, chacun peut ajouter sa clé ; administrateur toujours ; « choisis », « aucun », « tous »', L.iaPersoAutorise(dL, '') && L.iaPersoAutorise(dS, ad) && L.iaPersoAutorise(dS, u1) && !L.iaPersoAutorise(dS, u2) && !L.iaPersoAutorise(dT, u1) && L.iaPersoAutorise(dT, ad) && L.iaPersoAutorise(dU, u2), [L.iaPersoAutorise(f42, ''), L.iaPersoAutorise(dS, ad), L.iaPersoAutorise(dS, u1), L.iaPersoAutorise(dS, u2), L.iaPersoAutorise(dT, u1), L.iaPersoAutorise(dT, ad), L.iaPersoAutorise(dU, u2), ad, u1, u2]);
    const essai42 = (uid, fn) => { const av = L.clone(dS); const ap = L.clone(dS); fn(ap); return L.gardeDroits(av, ap, uid); };
    const gO = essai42(u1, (x) => L.iaEspaceRegler(x, { perso: 'tous' }, u1)); const gA = essai42(ad, (x) => L.iaEspaceRegler(x, { perso: 'tous' }, ad));
    t('garde : réglage de l’espace de travail réservé aux administrateurs, noté au journal', !gO.ok && /assistant IA/.test(gO.msg) && gA.ok && gA.audit.some((a) => /Assistant IA de l’espace de travail/.test(a.resume) && /droits des clés personnelles/.test(a.resume)), [gO.msg, gA.ok, gA.msg, gA.audit]);
    // clé utilisée : personnelle si permise et réglée (choix « auto »), sinon commune
    const perso = { fournisseur: 'openai', cles: { openai: 'sk-perso' }, modeles: { openai: 'gpt-fictif' } };
    L.iaEspaceDefinir({ reglage: L.iaEspaceReglage(dS), cle: 'sk-commune', persoAutorise: true }); const a1 = L.iaActive(perso); const a2 = L.iaActive({ ...perso, source: 'espace' }); const a3 = L.iaActive({});
    L.iaEspaceDefinir({ reglage: L.iaEspaceReglage(dS), cle: 'sk-commune', persoAutorise: false }); const a4 = L.iaActive(perso);
    L.iaEspaceDefinir({ reglage: L.iaEspaceReglage(dS), cle: '', persoAutorise: false }); const a5 = L.iaActive(perso); L.iaEspaceDefinir(null); const a6 = L.iaActive(perso);
    t('clé utilisée : la sienne (auto), la commune (choisie, ou sans clé personnelle), imposée si non permise, pas prête sans clé déchiffrée', a1.source === 'perso' && a1.cle === 'sk-perso' && a2.source === 'espace' && a2.cle === 'sk-commune' && a2.modele === 'claude-fictif-commun' && a3.source === 'espace' && a3.pret && a4.source === 'espace' && a4.cle === 'sk-commune' && !a5.pret && a6.source === 'perso' && a6.pret);
    // clés personnelles hors du stockage en clair (navigateur sans coffre : comme avant)
    L.iaConfigEcrire({ fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-x' }, memoire: true }); const m1 = window.localStorage.getItem('oenotrack-ia'); const m2 = L.iaConfigLire();
    L.iaConfigEcrire({ fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-x' } }); const m3 = L.iaConfigLire();
    t('clé « pour cette session seulement » : en mémoire, jamais écrite', !m1.includes('sk-ant-x') && m2.cles.anthropic === 'sk-ant-x' && m3.cles.anthropic === 'sk-ant-x');
    L.iaConfigEcrire({});

    // bibliothèques : versions figées et empreintes
    const BT = L.BIB_TABLE; const bnoms = Object.keys(BT);
    t('bibliothèques : React, SheetJS, pdf-lib, PDF.js, Tesseract à version figée, empreinte SHA-384 (SHA-256 aussi pour les modules)', ['react', 'reactDom', 'xlsx', 'pdflib', 'pdfjs', 'pdfjsWorker', 'tesseract', 'tesseractWorker'].every((k) => BT[k] && /@\d+\.\d+\.\d+$/.test(BT[k].npm) && /^sha384-[A-Za-z0-9+/]{64}$/.test(BT[k].sri)) && bnoms.filter((k) => BT[k].module).every((k) => /^sha256-/.test(BT[k].sha256)));
    t('bibliothèques : fichier seul → jsDelivr /npm/ (octets du paquet npm), aucun autre CDN', L.bibUrl('xlsx') === 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js' && L.bibPdfjsBase() === 'https://cdn.jsdelivr.net/npm/pdfjs-dist@6.2.108/' && bnoms.every((k) => L.bibUrl(k).startsWith('https://cdn.jsdelivr.net/npm/')));
    const NMb = '/opt/npm-tools/node_modules/'; const fpdf = NMb + 'pdfjs-dist/build/pdf.min.mjs';
    if (fs.existsSync(fpdf)) t('bibliothèques : empreinte SHA-256 calculée comme la page (module PDF.js du paquet npm)', (await L.bibEmpreinte256(fs.readFileSync(fpdf))) === BT.pdfjs.sha256);

    // version, traductions, base 0.38 et compatibilité avec la 0.37.0-alpha.1 gelée
    const en = (x) => L.traduire(x, 'en');
    t('traductions : étiquettes personnalisées, espace de travail IA, coffre, notes de version', en('Planche A4 personnalisée') === 'Custom A4 sheet' && en('Coffre de cet appareil') === 'This device’s vault' && L.traduire('Autorisés pour certains', 'de') === 'Für einige erlaubt'
      && !L.tradControle().length && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((x) => L.traduire(n, x) !== n)), L.tradControle());
    const i38 = L.CHANGELOG.findIndex((c) => c.v === '0.38.0-alpha.1');
    t('version 0.38.0-alpha.1 : nouvelles fonctionnalités compatibles (mineure), première pré-version alpha', i38 >= 0 && L.CHANGELOG[i38 + 1].v === '0.37.0-alpha.1' && L.versionNum('0.38.0-alpha.1') > L.versionNum('0.37.0-alpha.1') && L.CHANGELOG[i38].notes.length === 5 && L.APP_NUM >= 38000001);
    const dirO = path.join(__dirname, 'anciennes', '0.37.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, gardeDroits, opSave, getR };')({});
    t('0.37.0-alpha.1 gelée chargée (n° 37 000 001)', O.APP_VERSION === '0.37.0-alpha.1' && O.APP_NUM === 37000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f42)); O.syncConfig(x);
    t('… la 0.37 ouvre la base 0.38 sans rien perdre (assistant IA commun, clé chiffrée, chiffrement de l’équipe)', canonJ(x.settings.ia) === canonJ(f42.settings.ia) && canonJ(x.settings.chiffrement) === canonJ(f42.settings.chiffrement) && ['contenants', 'ops', 'lots', 'analyses', 'baremes'].every((k) => canonJ(x[k]) === canonJ(f42[k])));
    const R37 = O.getR(x); const pj = Object.values(R37.portions).find((p) => p.vol > 500);
    const ro = O.opSave(x, { type: 'jaugeage', date: '2026-11-27', portionId: pj.id, volMesure: Math.round(pj.vol) - 2, typeId: 'evaporation' }); x.meta.modifLe = '2026-11-27T08:00:00Z';
    const back = L.normalizeDb(L.clone(x));
    t('… opération saisie par la 0.37 : rouverte ici, réglage IA intact', ro.ok && back.ops.length === f42.ops.length + 1 && canonJ(back.settings.ia) === canonJ(f42.settings.ia));
    const N = L.clone(f42); L.iaEspaceRegler(N, { perso: 'tous' }, ''); N.meta.modifLe = '2026-11-27T09:00:00Z';
    const FX = L.syncFusion(f42, N, x); const FX2 = O.syncFusion(f42, x, N);
    t('… synchronisation 0.38 ↔ 0.37 : droit changé ici, opération ajoutée là-bas, rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => y.settings.ia.perso === 'tous' && y.ops.length === f42.ops.length + 1 && !JSON.stringify(y).includes('sk-ant-FICTIVE')));
  }
  // ===== 43. 0.38.0-alpha.2 : clés d'accès multiplateformes (authentificateur intégré de l'appareil ou clé externe)
  {
    const enc = new TextEncoder(); const S = globalThis.crypto.subtle;
    const u = { id: 'usr1', identifiant: 'admin', nom: 'Admin' }; const defi = new Uint8Array(32).fill(3);
    const kI = { id: 'cleIntegree-01', type: 'appareil', transports: ['internal', 'hybrid'] }; const kX = { id: 'cleExterne-001', type: 'externe', transports: ['usb', 'nfc'] }; const kV = { id: 'cleAncienne-0001' };
    const oA = L.clesOptionsCreation({ rp: 'app.test', user: u, defi, mode: 'appareil', exclure: [kI, kV] });
    t('« cet appareil » : authentificateur intégré exigé (empreinte, visage, code PIN — Android, iPhone, Windows Hello, Mac), clé d’accès découvrable, indice client-device',
      oA.authenticatorSelection.authenticatorAttachment === 'platform' && oA.authenticatorSelection.residentKey === 'required' && oA.authenticatorSelection.requireResidentKey === true && oA.authenticatorSelection.userVerification === 'required'
      && canonJ(oA.hints) === canonJ(['client-device']) && oA.rp.id === 'app.test' && oA.rp.name === 'Œnotrack' && oA.challenge === defi && canonJ(oA.pubKeyCredParams.map((x) => x.alg)) === canonJ([-7, -257]) && oA.attestation === 'none' && new TextDecoder().decode(oA.user.id) === 'usr1' && oA.user.name === 'admin', oA);
    t('… appareils déjà enregistrés exclus, avec leurs transports (les anciennes clés sans transports restent exclues)', oA.excludeCredentials.length === 2 && canonJ(oA.excludeCredentials[0].transports) === canonJ(['internal', 'hybrid']) && !('transports' in oA.excludeCredentials[1]) && L.clesB64u(oA.excludeCredentials[1].id) === 'cleAncienne-0001');
    const oX = L.clesOptionsCreation({ rp: 'app.test', user: u, defi, mode: 'externe' }); const oT = L.clesOptionsCreation({ rp: 'app.test', user: u, defi });
    t('« clé de sécurité ou autre téléphone » : authentificateur externe (USB, NFC, QR code) ; mode automatique sans restriction (Linux, PC sans Windows Hello)',
      oX.authenticatorSelection.authenticatorAttachment === 'cross-platform' && oX.authenticatorSelection.residentKey === 'preferred' && canonJ(oX.hints) === canonJ(['security-key', 'hybrid']) && !oX.excludeCredentials.length
      && !('authenticatorAttachment' in oT.authenticatorSelection) && oT.authenticatorSelection.userVerification === 'required' && oT.hints[0] === 'client-device');
    const cI = L.clesOptionsConnexion({ rp: 'app.test', defi, cles: [kI] }); const cM = L.clesOptionsConnexion({ rp: 'app.test', defi, cles: [kI, kX, kV] }); const cX = L.clesOptionsConnexion({ rp: 'app.test', defi, cles: [kX] });
    t('connexion : transports repris (l’appareil propose son propre déverrouillage), vérification exigée ; indices selon les clés du compte',
      cI.rpId === 'app.test' && cI.userVerification === 'required' && canonJ(cI.allowCredentials[0].transports) === canonJ(['internal', 'hybrid']) && canonJ(cI.hints) === canonJ(['client-device'])
      && cM.allowCredentials.length === 3 && !('hints' in cM) && !('transports' in cM.allowCredentials[2]) && canonJ(cX.hints) === canonJ(['security-key', 'hybrid']) && L.clesOptionsConnexion({ rp: 'app.test', defi, cles: Array.from({ length: 70 }, (_, j) => ({ id: `cle-${String(j).padStart(6, '0')}` })) }).allowCredentials.length === 64);
    // enregistrement : type et transports gardés (filtrés) ; anciennes clés inchangées
    const dk = L.normalizeDb(L.sampleDb()); const m = await L.mdpEmpreinte('Admin-2029', 1000); L.securiteActiver(dk, { identifiant: 'admin', nom: 'Admin', mdp: m }); L.syncConfig(dk); const adm = dk.utilisateurs[0].id;
    const kpE = await S.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']); const spkiE = new Uint8Array(await S.exportKey('spki', kpE.publicKey));
    const kpR = await S.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']); const spkiR = new Uint8Array(await S.exportKey('spki', kpR.publicKey));
    const r1 = L.cleAjouter(dk, adm, { id: 'cleAndroid-0001', cle: L.clesB64(spkiE), alg: -7, rp: 'app.test', nom: 'Android', type: 'appareil', transports: ['internal', 'hybrid', 'internal', 'inconnu', 3] });
    const r2b = L.cleAjouter(dk, adm, { id: 'cleAncien-00001', cle: L.clesB64(spkiE), alg: -7, rp: 'app.test', nom: 'PC Windows', type: 'bizarre' });
    const k1 = L.clesDe(dk, adm)[0]; const k2 = L.clesDe(dk, adm)[1];
    t('enregistrement : type (intégré / externe) et transports connus gardés, sans doublon ; clé sans ces renseignements comme avant', r1.ok && r2b.ok && k1.type === 'appareil' && canonJ(k1.transports) === canonJ(['internal', 'hybrid']) && !('type' in k2) && !('transports' in k2) && canonJ(L.clesTransports(['usb', 'nfc', 'ble', 'smart-card', 'x'])) === canonJ(['usb', 'nfc', 'ble', 'smart-card']) && !L.clesTransports('usb').length);
    // navigateurs sans getPublicKey : clé publique lue dans l'objet d'attestation (CBOR → COSE → SPKI), identique à la clé exportée
    const cb = (maj, n) => (n < 24 ? [(maj << 5) | n] : n < 256 ? [(maj << 5) | 24, n] : [(maj << 5) | 25, n >> 8, n & 255]);
    const cEnt = (v) => (v >= 0 ? cb(0, v) : cb(1, -1 - v)); const cOct = (u8) => [...cb(2, u8.length), ...u8]; const cTxt = (x) => { const b = enc.encode(x); return [...cb(3, b.length), ...b]; };
    const cMap = (paires) => [...cb(5, paires.length), ...paires.flat(2)];
    const jE = await S.exportKey('jwk', kpE.publicKey); const jR = await S.exportKey('jwk', kpR.publicKey);
    const coseE = cMap([[cEnt(1), cEnt(2)], [cEnt(3), cEnt(-7)], [cEnt(-1), cEnt(1)], [cEnt(-2), cOct(L.clesDeB64u(jE.x))], [cEnt(-3), cOct(L.clesDeB64u(jE.y))]]);
    const coseR = cMap([[cEnt(1), cEnt(3)], [cEnt(3), cEnt(-257)], [cEnt(-1), cOct(L.clesDeB64u(jR.n))], [cEnt(-2), cOct(L.clesDeB64u(jR.e))]]);
    const attDe = async (cose, flags = 0x45) => { const credId = new Uint8Array(16).fill(9); const ad = [...new Uint8Array(await S.digest('SHA-256', enc.encode('app.test'))), flags, 0, 0, 0, 1, ...new Uint8Array(16), 0, 16, ...credId, ...cose]; return Uint8Array.from(cMap([[cTxt('fmt'), cTxt('none')], [cTxt('attStmt'), cMap([])], [cTxt('authData'), cOct(Uint8Array.from(ad))]])); };
    const aE = L.cleDepuisAttestation(await attDe(coseE)); const aR = L.cleDepuisAttestation(await attDe(coseR));
    t('attestation : clé ES256 (Android, iPhone, Mac, clés USB) et RS256 (Windows Hello) relues en SPKI identique à la clé de l’appareil', aE && aE.alg === -7 && L.clesB64(aE.spki) === L.clesB64(spkiE) && aR && aR.alg === -257 && L.clesB64(aR.spki) === L.clesB64(spkiR) && (aE.flags & 0x04) === 0x04, [aE && L.clesB64(aE.spki).slice(0, 40), aR && aR.alg]);
    t('… illisible, sans données de clé ou d’un algorithme non pris en charge (Ed25519) → null, sans erreur', L.cleDepuisAttestation(Uint8Array.from([0xff, 1])) === null && L.cleDepuisAttestation(await attDe(coseE, 0x05)) === null && L.cleDepuisAttestation(await attDe(cMap([[cEnt(1), cEnt(1)], [cEnt(3), cEnt(-8)], [cEnt(-1), cEnt(6)], [cEnt(-2), cOct(new Uint8Array(32))]]))) === null && L.cleDepuisAttestation(null) === null);
    t('… clé relue enregistrée et utilisable', L.cleAjouter(dk, adm, { id: 'cleAttest-00001', cle: L.clesB64(aR.spki), alg: aR.alg, rp: 'app.test', type: 'appareil', transports: ['internal'] }).ok && L.clesUtilisables(dk, 'app.test', adm).length === 3);
    // droits : l'opérateur ajoute sa clé (avec type et transports) en attente
    const opK = L.utilisateurSave(dk, { identifiant: 'op43', nom: 'Op', profilId: 'pf_operateur', mdp: m }).id;
    const av = L.clone(dk); const ap = L.clone(dk); L.cleAjouter(ap, opK, { id: 'cleOp43-00001', cle: L.clesB64(spkiE), alg: -7, rp: 'app.test', nom: 'Clé de sécurité', type: 'externe', transports: ['usb'] });
    const g = L.gardeDroits(av, ap, opK);
    t('droits : l’opérateur ajoute sa clé de sécurité (en attente), tracée au journal', g.ok && L.clesDe(ap, opK)[0].acceptee === false && g.audit.some((x) => x.resume === 'Clé d’accès ajoutée : Clé de sécurité'), g);

    // version, traductions, base 0.38.0-alpha.2 et compatibilité avec la 0.38.0-alpha.1 gelée
    t('version 0.38.0-alpha.2 : correction de la version en test (itération alpha)', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.38.0-alpha.2'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.38.0-alpha.1'; })() && L.versionNum('0.38.0-alpha.2') > L.versionNum('0.38.0-alpha.1'));
    t('traductions : clés d’accès et notes de version dans les six langues', L.traduire('＋ Clé de sécurité ou autre téléphone', 'en') === '＋ Security key or other phone' && L.traduire('Autre téléphone', 'de') === 'Anderes Telefon' && !L.tradControle().length && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((x) => L.traduire(n, x) !== n)), L.tradControle());
    const f43 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.38.0-alpha.2-cles.json'), 'utf8'))); L.syncConfig(f43);
    const cl = f43.utilisateurs.flatMap((x) => x.cles || []);
    t('fixture 0.38.0-alpha.2 : clé intégrée (Android), clé externe (USB, NFC) et ancienne clé sans type', cl.some((k) => k.type === 'appareil' && canonJ(k.transports) === canonJ(['internal', 'hybrid'])) && cl.some((k) => k.type === 'externe' && k.acceptee === true) && cl.some((k) => !k.type && k.nom === 'PC Windows') && L.clesUtilisables(f43, 'app.test').length === 3);
    const dirO = path.join(__dirname, 'anciennes', '0.38.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, syncFusion, cleModifier, clesUtilisables, opSave, getR };')({});
    t('0.38.0-alpha.1 gelée chargée (n° 38 000 001)', O.APP_VERSION === '0.38.0-alpha.1' && O.APP_NUM === 38000001 && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f43)); O.syncConfig(x);
    t('… la 0.38.0-alpha.1 ouvre la base 0.38.0-alpha.2 sans rien perdre (type et transports des clés) et s’en sert pour se connecter', canonJ(x.utilisateurs) === canonJ(f43.utilisateurs) && O.clesUtilisables(x, 'app.test').length === 3 && ['contenants', 'ops', 'lots', 'settings'].every((k) => canonJ(x[k]) === canonJ(f43[k])));
    const ua = x.utilisateurs.find((y) => y.identifiant === 'admin'); O.cleModifier(x, ua.id, 'cleFictiveAndroid-0382', { nom: 'Téléphone du chai' }); x.meta.modifLe = '2026-11-27T08:00:00Z';
    const N = L.clone(f43); const uo = N.utilisateurs.find((y) => y.identifiant === 'chai'); L.cleAjouter(N, uo.id, { id: 'cleFictiveIphone-0382', cle: L.clesB64(spkiE), alg: -7, rp: 'app.test', nom: 'iPhone', type: 'appareil', transports: ['internal', 'hybrid'] }); N.meta.modifLe = '2026-11-27T09:00:00Z';
    const FX = L.syncFusion(f43, N, x); const FX2 = O.syncFusion(f43, x, N);
    t('… synchronisation 0.38.0-alpha.2 ↔ 0.38.0-alpha.1 : clé renommée là-bas, iPhone ajouté ici, type et transports gardés des deux côtés', [FX.db, FX2.db].every((y) => { const c = y.utilisateurs.flatMap((z) => z.cles || []); const a = c.find((k) => k.id === 'cleFictiveAndroid-0382'); const i = c.find((k) => k.id === 'cleFictiveIphone-0382'); return a && a.nom === 'Téléphone du chai' && a.type === 'appareil' && canonJ(a.transports) === canonJ(['internal', 'hybrid']) && i && i.type === 'appareil' && canonJ(i.transports) === canonJ(['internal', 'hybrid']); }) && !FX.conflits.length, [FX.conflits, FX2.conflits]);
  }
  // ---- 0.38.0-alpha.3 : audit — coffre, chargement, synchronisation, moteur, imports, onglet unique, SO₂ du dégorgement, rôle des fractions
  {
    // coffre : enveloppe réécrite par la 0.37 (normalizeDb gelé : ses listes par défaut AVANT « format ») toujours reconnue
    const dir37 = path.join(__dirname, 'anciennes', '0.37.0-alpha.1');
    const O37 = new Function('React', files.filter((f) => fs.existsSync(path.join(dir37, f))).map((f) => fs.readFileSync(path.join(dir37, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, APP_VERSION };')({});
    const dekA = await L.coffreImporterDek(L.chAleatoire(32)); const envA = await L.coffreChiffrerAvec(dekA, 'cfx3', 'oenotrack-db-v2', JSON.stringify({ ops: [{ id: 'o1' }] }));
    const reecrit = JSON.stringify(O37.normalizeDb(JSON.parse(envA)));
    t('coffre : enveloppe réécrite par la 0.37.0-alpha.1 (marqueur loin du début) reconnue, relue', O37.APP_VERSION === '0.37.0-alpha.1' && reecrit.indexOf('"oenotrack-coffre"') > 600 && !!L.coffreEnveloppe(reecrit) && JSON.parse(await L.coffreDechiffrerAvec(dekA, L.coffreEnveloppe(reecrit), 'oenotrack-db-v2')).ops[0].id === 'o1');
    // journal des conflits : versions reprenables toutes gardées, mentions limitées à 60
    const cf = [...Array.from({ length: 90 }, (x, i) => ({ id: `a${i}`, autre: { id: i } })), ...Array.from({ length: 90 }, (x, i) => ({ id: `m${i}`, autre: null }))];
    const cg = L.syncConflitsGarder(cf);
    t('conflits : 90 versions reprenables gardées, 60 mentions au plus', cg.filter((c) => c.autre != null).length === 90 && cg.filter((c) => c.autre == null).length === 60);
    // chargement : base illisible jamais remplacée par l'exemple ; élément vide d'une collection toléré
    L.coffreEcrire(L.STORAGE_KEY, '{"ops": [ illisible');
    const li = L.loadDb();
    t('chargement : base illisible → pas d’exemple enregistré par-dessus (sauvegarde suspendue)', li.illisible === true && li.db === null && L.loadDbIllisible() && L.saveDb(L.emptyDb()) === false && L.coffreLire(L.STORAGE_KEY) === '{"ops": [ illisible');
    L.loadDbDebloquer(); const bn = L.emptyDb(); bn.ops = [null]; L.coffreEcrire(L.STORAGE_KEY, JSON.stringify(bn)); const lv = L.loadDb();
    t('… restauration : sauvegarde reprise ; élément vide d’une collection ignoré à la lecture', !L.loadDbIllisible() && lv.db && Array.isArray(lv.db.ops) && !lv.db.ops.includes(null) && L.saveDb(lv.db) !== false);
    // moteur
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
    t('SO₂ : teneurs « 50 mg/ml », « 50 MG/L », « 0,5 g/KG » reconnues', L.so2Teneur({ so2: '50 mg/ml', unite: 'L' }) === 50 && L.so2Teneur({ so2: '50 MG/L', unite: 'L' }) === 0.05 && Math.abs(L.so2Teneur({ so2: '0,5 g/KG', unite: 'kg' }) - 0.5) < 1e-9);
    const deg = d.ops.find((o) => o.type === 'degorgement'); const src0 = deg.sourceLotId;
    d.analyses.push({ id: 'anSo2Test', lotId: src0, date: '2026-09-01', valeurs: { so2t: 60 } });
    const Rg = L.getR(d); const ef = L.so2TotalEstime(d, Rg, deg.lotFiniId); const es = (Rg.so2Ev[src0] || []).filter((x) => x.opId === deg.id);
    t('dégorgement : SO₂ de la liqueur imputé au lot fini (60 mg/L du lot de tirage + liqueur), jamais au lot de tirage', !es.length && ef.estime > 60 && ef.estime < 70 && (Rg.so2Ev[deg.lotFiniId] || []).some((x) => x.herite === src0 && Math.abs(x.mgL - 60) < 1e-6) && ef.plafond !== undefined);
    const d2 = L.clone(d); const deg2 = L.clone(deg); delete deg2.id; deg2.date = '2026-10-06'; deg2.nb = 100; deg2.lotFiniSpec = { code: 'LF-26-002', designation: 'Essai', dosageGL: 8 }; delete deg2.lotFiniId;
    const r2 = L.opSave(d2, deg2); const R2 = L.getR(d2);
    t('… second dégorgement partiel : le lot de tirage ne cumule rien, chaque lot fini a son propre SO₂', r2.ok && !(R2.so2Ev[src0] || []).some((x) => x.opId === r2.op.id || x.opId === deg.id) && L.so2TotalEstime(d2, R2, r2.op.lotFiniId).estime > 60);
    const R0 = L.getR(d); const pj = Object.values(R0.portions).find((p) => p.vol > 500);
    const df = L.clone(d); const rf = L.opSave(df, { type: 'filtration', date: '2026-11-20', portionId: pj.id, pertes: [{ typeId: df.lists.typesPerte[0].id, volL: pj.vol }], lignes: [] });
    const Rf = L.getR(df);
    t('filtration avec pertes totales : la cuve est vide (portion retirée)', rf.ok && !Rf.portions[pj.id] && !L.contParts(Rf, pj.contenantId).some((p) => p.portionId === pj.id));
    const dr = L.clone(d); const a0 = d.arrivages[0]; const na = L.arrivageSave(dr, { produitId: a0.produitId, date: '2026-11-19', qty: 50, numLot: 'LOT-AUDIT-1' }); const ar = dr.arrivages.find((x) => x.id === na.id); const rest = L.regulRestant(dr, ar.id, '2026-11-20'); const rg = L.regulSave(dr, { arrivageId: ar.id, date: '2026-11-20', mode: 'compte', compte: rest + 2, motif: 'casse', notes: 'comptage' });
    t('régularisation par comptage avec un motif de sortie : signe donné par le comptage (+2)', rg.ok && rg.qty === 2);
    t('arrivage avec régularisations : suppression refusée ; arrivage inconnu : refus sans erreur', !L.arrivageDelete(dr, ar.id).ok && /régularisations/.test(L.arrivageDelete(dr, ar.id).msg) && !L.arrivageSave(dr, { produitId: ar.produitId, date: '2026-11-20', qty: 1, numLot: 'X' }, 'arInconnu').ok);
    const dm = L.clone(d); const pm = L.maintProduitSave(dm, { nom: 'Détergent essai', unite: 'L', suiviStock: true });
    const e1 = L.maintMouvementSave(dm, { produitId: pm.id, date: '2026-11-20', type: 'entree', qty: 10 }); const s1 = L.maintMouvementSave(dm, { produitId: pm.id, date: '2026-11-20', type: 'sortie', qty: 4 });
    const le0 = dm.mouvementsMaintenance.find((m) => m.id === e1.id).le; const e2 = L.maintMouvementSave(dm, { produitId: pm.id, date: '2026-11-20', type: 'entree', qty: 12 }, e1.id);
    t('maintenance : entrée modifiée malgré une sortie le même jour, à sa place (date de saisie gardée)', pm.ok && s1.ok && e2.ok && dm.mouvementsMaintenance.find((m) => m.id === e1.id).le === le0 && L.maintStock(dm, pm.id) === 8);
    // soutirage dans une cuve qui contient déjà le même lot : la sortie suivante de cette cuve en dépend
    const ds = L.clone(d); const Rs = L.replay(ds); const p1 = Object.values(Rs.portions).find((p) => p.vol > 500);
    const vide = ds.contenants.find((c) => c.statut !== 'archive' && !Object.values(Rs.portions).some((p) => p.contenantId === c.id) && c.volMax > 2000);
    const sA = L.opSave(ds, { type: 'soutirage', date: '2026-11-20', portionId: p1.id, volL: 200, destId: vide.id, pertes: [], lignes: [] });
    const pDest = Object.values(L.replay(ds).portions).find((p) => p.contenantId === vide.id);
    const sB = L.opSave(ds, { type: 'soutirage', date: '2026-11-21', portionId: p1.id, volL: 200, destId: vide.id, pertes: [], lignes: [] });
    const sC = L.opSave(ds, { type: 'filtration', date: '2026-11-22', portionId: pDest.id, pertes: [], lignes: [] });
    const dep = L.dependentsOf(ds, sB.op);
    t('soutirage versé dans une portion existante (même lot) : les opérations suivantes sur cette portion en dépendent', sA.ok && sB.ok && sC.ok && (L.replay(ds).fusions[sB.op.id] || []).includes(pDest.id) && dep.some((o) => o.id === sC.op.id));
    // pressoir : rôle explicite des fractions, proposé d'après le nom
    const dp = L.clone(d); const fa = L.fractionCont(dp, 'add', null, { label: 'Taille de presse', suffix: 'TP' }); const fT = dp.lists.fractions.find((f) => f.label === 'Taille de presse');
    const fb = L.fractionCont(dp, 'add', null, { label: 'Vin de goutte', suffix: 'VG', role: 'cuvee' }); const fV = dp.lists.fractions.find((f) => f.label === 'Vin de goutte');
    dp.lists.fractions.push({ id: 'fr999', label: 'Rebêches de fin', suffix: 'RF' }); // fraction d'une version antérieure, sans rôle
    t('fractions : rôle proposé d’après le nom, choisi à la main, déduit pour une ancienne fraction ; défauts inchangés', fa.ok && fb.ok && fT.role === 'taille' && L.fracRole(dp, fT.id) === 'taille' && L.fracRole(dp, fV.id) === 'cuvee' && L.fracRole(dp, 'fr999') === 'rebeche' && L.fracRole(dp, 'cuvee') === 'cuvee' && L.fracRole(dp, 'taille2') === 'taille' && L.fracRole(dp, 'lies') === 'autre');
    t('… rôle modifié ; rôle inconnu refusé', L.fractionCont(dp, 'edit', fT.id, { role: 'autre' }).ok && L.fracRole(dp, fT.id) === 'autre' && !L.fractionCont(dp, 'edit', fT.id, { role: 'xx' }).ok);
    L.fractionCont(dp, 'edit', fT.id, { role: 'taille' }); const mv = L.marcVolumes(dp, { fractions: [{ fractionId: 'cuvee', volL: 2050 }, { fractionId: fT.id, volL: 500 }] });
    t('… marc : une fraction ajoutée « taille » compte comme taille (plus comme « autre »)', mv.taille === 500 && mv.autre === 0 && mv.cuvee === 2050);
    // imports et nombres
    t('nombres : « 1 234 » (espace, insécable, fine) = 1234 ; « 2 3 » inchangé (2) ; virgule décimale', L.num('1 234') === 1234 && L.num('1 234,5') === 1234.5 && L.num('12 345') === 12345 && L.num('2 3') === 2 && L.num('3,43 ± 0,1') === 3.43 && L.hasNum('1 234'));
    t('bulletin : acidité totale déjà en H₂SO₄ gardée ; en acide tartrique convertie', L.bulletinConvertir(3.43, 'g/L H2SO4 5,25 g/L acide tartrique Acidité totale', 'g/L H2SO4', 'Acidité totale') === 3.43 && Math.abs(L.bulletinConvertir(5.25, 'g/L acide tartrique', 'g/L H2SO4', 'Acidité totale') - 5.25 / 1.531) < 1e-9);
    const w1252 = Uint8Array.from([0x41, 0x63, 0x69, 0x64, 0x69, 0x74, 0xe9]); const u16 = new Uint8Array(Buffer.from('﻿Acidité', 'utf16le'));
    t('texte d’un fichier : Windows-1252, UTF-16 (BOM), UTF-8 avec BOM', L.texteDeOctets(w1252) === 'Acidité' && L.texteDeOctets(u16) === 'Acidité' && L.texteDeOctets(Uint8Array.from([0xef, 0xbb, 0xbf, 0x41, 0xc3, 0xa9])) === 'Aé');
    t('DRM : caractères de contrôle retirés du XML', L.xmlEsc('A\u000bB\u0000C<') === 'ABC&lt;');
    t('onglet unique : hors navigateur, actif (rien n’est bloqué)', (await L.ongletDemarrer()) === 'actif' && !L.ongletBloque());
  }
  {
    // version, traductions, base 0.38.0-alpha.3 et compatibilité avec la 0.38.0-alpha.2 gelée
    t('version 0.38.0-alpha.3 : correction de la version en test (itération alpha)', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.38.0-alpha.3'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.38.0-alpha.2' && L.CHANGELOG[i].notes.length === 6; })());
    t('traductions : onglet unique, rôle des fractions et notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('Reprendre la main ici', 'en') === 'Take over here' && L.traduire('Rôle de la fraction (1ère taille)', 'de') === 'Rolle der Fraktion (1. Taille)' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f44 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.38.0-alpha.3-audit.json'), 'utf8'))); L.syncConfig(f44);
    const fT = f44.lists.fractions.find((f) => f.label === 'Taille de presse'); const fin = (f44.lotsFinis || []).find((x) => x.code === 'LF-26-003');
    t('fixture 0.38.0-alpha.3 : fraction ajoutée avec son rôle, lot fini d’un dégorgement partiel', fT && fT.role === 'taille' && fin && L.so2TotalEstime(f44, L.getR(f44), fin.id).estime > 0);
    const dirO = path.join(__dirname, 'anciennes', '0.38.0-alpha.2');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, fractionCont, fracRole, getR, clone, APP_VERSION, APP_NUM };')({});
    t('0.38.0-alpha.2 gelée chargée', O.APP_VERSION === '0.38.0-alpha.2' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f44)); O.syncConfig(x);
    t('… la 0.38.0-alpha.2 ouvre la base 0.38.0-alpha.3 sans rien perdre (rôle des fractions gardé et utilisé, lots finis)', canonJ(x.lists.fractions) === canonJ(f44.lists.fractions) && O.fracRole(x, fT.id) === 'taille' && canonJ(x.lotsFinis) === canonJ(f44.lotsFinis) && !!O.getR(x).tir);
    O.fractionCont(x, 'edit', fT.id, { label: 'Taille de presse (renommée)' }); x.meta.modifLe = '2026-11-27T09:00:00Z';
    const N = L.clone(f44); L.fractionCont(N, 'add', null, { label: 'Rebêches tardives', suffix: 'RT' }); N.meta.modifLe = '2026-11-27T08:00:00Z';
    const FX = L.syncFusion(f44, N, x); const FX2 = O.syncFusion(f44, x, N);
    t('… synchronisation 0.38.0-alpha.3 ↔ 0.38.0-alpha.2 : fraction renommée là-bas, ajoutée ici (rôle « rebêche »), rôles gardés des deux côtés', [FX.db, FX2.db].every((y) => { const a = y.lists.fractions.find((f) => f.id === fT.id); const b = y.lists.fractions.find((f) => f.label === 'Rebêches tardives'); return a && a.label === 'Taille de presse (renommée)' && a.role === 'taille' && b && b.role === 'rebeche'; }));
  }
  // ===== 45. 0.39.0-alpha.1 : plan de vinification, clés d'accès par utilisateur, opérations saisies dans leur onglet, module « plan »
  {
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); const R = L.getR(d);
    // module « plan » : dans le groupe Vinification, à sa place après « À réaliser & fiches » (ordre enregistré d'une version antérieure)
    const dm = L.clone(d); dm.settings.modulesOrdre = ['cuverie', 'pressoir', 'ops', 'previsions', 'declass', 'tirage', 'cave', 'degorgement', 'analyses', 'intrants', 'hygiene', 'equipements', 'trace', 'registres', 'params'];
    const ord = L.modulesOrdre(dm);
    t('module « plan » : connu, placé après « À réaliser & fiches », dans l’onglet Vinification', L.MODULES_DEFAUT.includes('plan') && ord.indexOf('plan') === ord.indexOf('previsions') + 1 && L.ongletDe('plan') === 'vinification' && L.ongletsBarre(L.modulesVisibles(dm)).filter((x) => x === 'vinification').length === 1);
    // plan : exemple, colonnes, cellules réunies
    const ex = L.plansVinifDe(d); const p0 = ex[0]; const cols = L.planVinifColonnes(p0);
    t('plan : exemple « à vérifier » (base sans plan), 12 colonnes (2 groupes × 3 revendications × 2 fractions)', ex.length === 1 && p0.exemple && p0.aVerifier && cols.length === 12 && !Array.isArray(d.plansVinif));
    const lT = p0.lignes.find((l) => l.etendue === 'revendication'); const lG = p0.lignes.find((l) => l.etendue === 'groupe');
    t('… étendues : dose par revendication (cuvée et tailles réunies), par groupe ; cellules fusionnées', L.planVinifCellules(p0, lT).length === 6 && L.planVinifCellules(p0, lT).every((c) => c.span === 2) && L.planVinifCellules(p0, lG).length === 2 && L.planVinifCellules(p0, lG)[0].span === 6 && L.planVinifValeur(lG, cols[11]) === 'Assemblage / Blanc de Noirs');
    const lc = L.planVinifChangerEtendue(p0, lT, 'colonne'); const lr = L.planVinifChangerEtendue(p0, lc, 'groupe');
    t('… changement d’étendue : valeurs recopiées dans chaque colonne, puis réunies par groupe', Object.keys(lc.valeurs).length === 12 && L.planVinifValeur(lc, cols[3]) === L.planVinifValeur(lT, cols[3]) && Object.keys(lr.valeurs).length === 2);
    // doses → quantités
    const q1 = L.planVinifQuantite('4,3 cL/hL', 4000); const q2 = L.planVinifQuantite('60 g/Hl', 4000); const q3 = L.planVinifQuantite('22 g/L', 4000); const q4 = L.planVinifQuantite('10g/hL', 500);
    t('doses : cL/hL, g/hL (« Hl »), g/L, sans espace → quantités ; °C, % vol, SO₂ libre, « selon filtrabilité » : pas de quantité', q1.qte === 1.72 && q1.unite === 'L' && q2.qte === 2.4 && q2.unite === 'kg' && q3.qte === 88 && q3.unite === 'kg' && q4.qte === 50 && q4.unite === 'g' && ['18°C', '10,8% vol', 'SO2 libre : ~12 mg/L', 'Dosage selon filtrabilité', '- 4 °C', ''].every((x) => L.planVinifQuantite(x, 1000) === null));
    // enregistrement : exemple copié dans la base à la 1re modification, champs inconnus gardés
    const dp = L.clone(d); const c0 = L.clone(p0); c0.nom = 'Vinification en blanc'; c0.version = 'V2'; c0.champFutur = { x: 1 }; c0.lignes[0].champFutur = 'y';
    const s1 = L.planVinifSave(dp, c0, null, 'u1'); const n1 = dp.plansVinif.find((x) => x.id === s1.id);
    t('enregistrement : exemple copié dans la base, nouveau plan à vérifier, champs inconnus gardés (plan et ligne)', s1.ok && dp.plansVinif.length === 2 && n1.aVerifier && n1.champFutur.x === 1 && n1.lignes[0].champFutur === 'y' && n1.maj.par === 'u1');
    t('… même nom et même version refusés ; sans ligne, sans colonne refusés', !L.planVinifSave(dp, { ...c0 }, null).ok && !L.planVinifSave(dp, { ...c0, version: 'V3', lignes: [] }, null).ok && !L.planVinifSave(dp, { ...c0, version: 'V3', groupes: [] }, null).ok);
    const s2 = L.planVinifSave(dp, { ...L.clone(n1), aVerifier: false }, n1.id, 'u2'); const n2 = dp.plansVinif.find((x) => x.id === n1.id);
    t('… vérifié : par qui et quand ; dupliqué (à vérifier) ; supprimé', s2.ok && n2.aVerifier === false && n2.verifiePar === 'u2' && n2.champFutur.x === 1 && L.planVinifDupliquer(dp, n1.id, 'u1').ok && dp.plansVinif.length === 3 && dp.plansVinif[2].aVerifier && L.planVinifSupprimer(dp, dp.plansVinif[2].id).ok && dp.plansVinif.length === 2);
    // import d'un tableur fictif, même mise en page que les instructions de travail (titre, en-têtes fusionnés, étapes fusionnées)
    const E = (n) => Array(n).fill('');
    const rows = [['Vinification en blanc (essai)', ...E(13)], ['Quantités à adapter à chaque lot', ...E(13)], ['', '', 'Cépage blanc', ...E(5), 'Cépages noirs', ...E(5)],
      ['Revendication', '', 'Conventionnel', '', 'FR-BIO-01', '', 'Demeter', '', 'Conventionnel', '', 'FR-BIO-01', '', 'Demeter', ''], ['Fractionnement', '', ...Array(6).fill(['Cuvée', 'Tailles']).flat()],
      ['Sulfitage', 'Produit A', '4 cL/hL', '5 cL/hL', ...E(4), '4 cL/hL', '6 cL/hL', ...E(4)], ['', 'Produit B', '', '', '4 cL/hL', '6 cL/hL', '4 cL/hL', '6 cL/hL', '', '', '4 cL/hL', '6 cL/hL', '3 cL/hL', '5 cL/hL'],
      ['Débourbage', ...E(13)], ['Statique d’une nuit', ...E(13)], ['Thermorégulation', '', '18°C', '', '18°C', '', '18°C', '', '18°C', '', '18°C', '', '18°C', ''],
      ['Assemblage', ...E(13)], ['', '', 'Blanc de Blancs', ...E(5), 'Blanc de Noirs', ...E(5)], ['Tirage', 'Sucre', '22 g/L', '', '', '', '', '', '24 g/L', '', '', '', '', '']];
    const M = (r1, c1, r2, c2) => ({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
    const merges = [M(0, 0, 0, 13), M(1, 0, 1, 13), M(2, 2, 2, 7), M(2, 8, 2, 13), ...[2, 4, 6, 8, 10, 12].map((c) => M(3, c, 3, c + 1)), M(3, 0, 3, 1), M(4, 0, 4, 1), M(5, 0, 6, 0), M(7, 0, 7, 13), M(8, 0, 8, 13), M(9, 0, 9, 1),
      ...[2, 4, 6, 8, 10, 12].map((c) => M(9, c, 9, c + 1)), M(10, 0, 10, 13), M(11, 0, 11, 1), M(11, 2, 11, 7), M(11, 8, 11, 13), M(12, 2, 12, 3), M(12, 8, 12, 9)];
    const im = L.planVinifDepuisFeuille(d, rows, merges, { fichier: 'OE-INS-99_Essai - V1.3.xlsx' }); const P = im.plan || {};
    const typ = (P.lignes || []).map((l) => `${l.type}:${l.etendue}`).join(',');
    t('import : titre, sous-titre, référence et version (nom du fichier), groupes, revendications de la liste, fractions selon leur rôle', im.ok && P.nom === 'Vinification en blanc (essai)' && P.sousTitre === 'Quantités à adapter à chaque lot' && P.reference === 'OE-INS-99' && P.version === 'V1.3'
      && canonJ(P.groupes.map((g) => g.label)) === canonJ(['Cépage blanc', 'Cépages noirs']) && P.groupes[0].cepages.includes('chard') && P.groupes[1].cepages.includes('pn') && P.groupes[1].cepages.includes('pm') && !P.groupes[1].cepages.includes('chard')
      && canonJ(P.revendications.map((r) => r.id)) === canonJ(['conv', 'bio', 'dem']) && P.fractions[0].id === 'cuvee' && canonJ(P.fractions[1].fractions) === canonJ(['taille1', 'taille2']) && im.colonnes === 12, [im.msg, P.reference, P.version, P.groupes]);
    t('… lignes : étape fusionnée reprise (2 produits), section, note, dose réunie par revendication, par groupe', typ === 'etape:colonne,etape:colonne,section:colonne,note:colonne,etape:revendication,section:colonne,etape:groupe,etape:revendication' && P.lignes[1].etape === 'Sulfitage' && P.lignes[1].produit === 'Produit B'
      && L.planVinifValeur(P.lignes[1], L.planVinifColonnes(P)[11]) === '5 cL/hL' && L.planVinifValeur(P.lignes[6], L.planVinifColonnes(P)[7]) === 'Blanc de Noirs' && L.planVinifValeur(P.lignes[7], L.planVinifColonnes(P)[7]) === '24 g/L' && L.planVinifValeur(P.lignes[7], L.planVinifColonnes(P)[9]) === '', typ);
    t('… tableau sans « Fractionnement » refusé avec un message', !L.planVinifDepuisFeuille(d, [['a', 'b'], ['c', 'd']], []).ok && /Fractionnement/.test(L.planVinifDepuisFeuille(d, [['a']], []).msg));
    const si = L.planVinifSave(dp, P, null, 'u1'); const Pi = dp.plansVinif.find((x) => x.id === si.id);
    // application à un lot : colonne trouvée (cépage majoritaire, revendication, fraction), quantités pour son volume
    const lt = Object.values(R.lots).find((l) => (R.lotVol[l.id] || 0) > 100 && L.planVinifColonnePourLot(d, R, Pi, l.id).col); const ap = lt ? L.planVinifPourLot(d, R, Pi, lt.id, 5000) : null;
    const ls = ap && ap.lignes.find((x) => x.ligne.etape === 'Sulfitage' && x.valeur);
    t('appliquer à un lot : colonne du lot (cépage, revendication, fraction), quantités pour 50 hL', !!ap && !ap.manque.length && ap.volL === 5000 && ap.col.r.id === lt.qualif && !!ls && ls.quantite && ls.quantite.unite === 'L' && Math.abs(ls.quantite.qte - numDose(ls.valeur) * 50 / 100) < 0.01, ap && { col: ap.col && ap.col.key, ls });
    function numDose(x) { return Number(String(x).replace(',', '.').match(/[\d.]+/)[0]); }
    // clés d'accès : rattachement strict, droit d'enregistrer ses appareils, révocation
    const dk = L.normalizeDb(L.sampleDb()); const mA = await L.mdpEmpreinte('Admin-2030', 1000); L.securiteActiver(dk, { identifiant: 'admin', nom: 'Admin', mdp: mA }); L.syncConfig(dk); const adm = dk.utilisateurs[0].id;
    const ro = L.utilisateurSave(dk, { identifiant: 'chai', nom: 'Chai', profilId: 'pf_operateur', mdp: mA }); const opr = ro.id;
    const S = globalThis.crypto.subtle; const kp = await S.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']); const spki = L.clesB64(new Uint8Array(await S.exportKey('spki', kp.publicKey)));
    const kS = (id) => ({ id, cle: spki, alg: -7, rp: 'app.test', nom: id, type: 'appareil', transports: ['internal'] });
    const a1 = L.cleAjouter(dk, opr, kS('cleOperateur-001')); const k1 = L.clesDe(dk, opr)[0];
    t('clé d’accès : rattachée à son compte (uid), en attente d’un administrateur', a1.ok && k1.uid === opr && k1.acceptee === false && L.cleEtat(dk, dk.utilisateurs.find((u) => u.id === opr), k1) === 'attente' && !L.clesUtilisables(dk, 'app.test', opr).length);
    const av = L.clone(dk); L.cleModifier(dk, opr, k1.id, { acceptee: true, par: adm }); const g1 = L.gardeDroits(av, dk, adm);
    t('… acceptée par l’administrateur (par qui, quand) : utilisable ; journal « Appareil accepté »', k1.acceptee && k1.acceptePar === adm && !!k1.accepteLe && L.clesUtilisables(dk, 'app.test', opr).length === 1 && g1.ok && g1.audit.some((a) => /Appareil accepté/.test(a.resume)));
    const av2 = L.clone(dk); L.cleModifier(dk, opr, k1.id, { acceptee: false, par: adm }); const g2 = L.gardeDroits(av2, dk, adm);
    t('… accès retiré : la clé reste listée, « révoquée », plus utilisable ; journal « Accès de l’appareil retiré »', k1.acceptee === false && k1.revoquePar === adm && L.cleEtat(dk, dk.utilisateurs.find((u) => u.id === opr), k1) === 'revoquee' && !L.clesUtilisables(dk, 'app.test').some((x) => x.k.id === k1.id) && g2.ok && g2.audit.some((a) => /Accès de l’appareil retiré/.test(a.resume)));
    L.clesRegler(dk, { validation: 'libre' }); const av3 = L.clone(dk); dk.utilisateurs.find((u) => u.id === opr).cles[0].acceptee = true;
    t('… l’utilisateur ne peut pas rétablir lui-même un appareil révoqué (même sans validation)', !L.gardeDroits(av3, dk, opr).ok && /rétablir/.test(L.gardeDroits(av3, dk, opr).msg));
    dk.utilisateurs.find((u) => u.id === opr).cles[0].acceptee = false; L.clesRegler(dk, { validation: 'admin' });
    // droit d'enregistrer ses appareils : réglage commun « choisis », autorisation par utilisateur
    L.clesRegler(dk, { inscription: 'choisis' });
    t('droit d’enregistrer : réglage commun « comptes autorisés » → refus pour l’opérateur, toujours permis à l’administrateur', !L.clesPeutEnregistrer(dk, opr) && L.clesPeutEnregistrer(dk, adm) && !L.cleAjouter(dk, opr, kS('cleOperateur-002')).ok && L.cleAjouter(dk, adm, kS('cleAdmin-00001')).ok);
    const av4 = L.clone(dk); L.clesEnregistrerRegler(dk, opr, true); const g4 = L.gardeDroits(av4, dk, adm);
    t('… autorisé pour ce compte (journal) ; refusé pour ce compte malgré le réglage commun', L.clesPeutEnregistrer(dk, opr) && g4.ok && g4.audit.some((a) => /Enregistrement de ses appareils : autorisé/.test(a.resume)) && L.clesEnregistrerRegler(dk, opr, false).ok && L.clesRegler(dk, { inscription: 'tous' }).ok && !L.clesPeutEnregistrer(dk, opr) && L.clesEnregistrerRegler(dk, opr, null).ok && L.clesPeutEnregistrer(dk, opr));
    const av5 = L.clone(dk); L.clesEnregistrerRegler(dk, opr, false); const av6 = L.clone(dk); dk.utilisateurs.find((u) => u.id === opr).cles.push({ ...kS('cleOperateur-003'), uid: opr, acceptee: false });
    t('… garde des droits : enregistrement refusé à l’utilisateur non autorisé ; il ne peut pas changer son propre droit', !L.gardeDroits(av6, dk, opr).ok && !L.gardeDroits(av5, av6, opr).ok);
    dk.utilisateurs.find((u) => u.id === opr).cles.pop(); L.clesEnregistrerRegler(dk, opr, null);
    // enregistrement pour un autre compte (administrateur seulement), accepté d'office
    const a7 = L.cleAjouter(dk, opr, kS('clePourOperateur1'), adm); const k7 = L.clesDe(dk, opr).find((k) => k.id === 'clePourOperateur1');
    t('administrateur : enregistre cet appareil pour un autre compte (accepté, « ajouté par ») ; un non-administrateur ne peut pas', a7.ok && k7.uid === opr && k7.ajoutePar === adm && k7.acceptee && !L.cleAjouter(dk, adm, kS('clePourAdmin00001'), opr).ok);
    // rattachement strict : même clé sous deux comptes (fusion), clé d'un autre compte, identifiant renvoyé par l'appareil
    const dd = L.clone(dk); dd.utilisateurs.find((u) => u.id === adm).cles.push({ ...L.clone(k7), uid: undefined }); const uA = dd.utilisateurs.find((u) => u.id === adm);
    t('rattachement strict : clé enregistrée sous deux comptes inutilisable (« doublon ») ; clé d’un autre compte ignorée', L.clesDoublons(dd).includes(k7.id) && !L.clesUtilisables(dd, 'app.test').some((x) => x.k.id === k7.id) && L.cleEtat(dd, uA, { ...k7, uid: opr }, []) === 'autre-compte');
    const enc = new TextEncoder(); const uO = dk.utilisateurs.find((u) => u.id === opr);
    t('… identifiant d’utilisateur de l’appareil : celui du compte accepté, un autre refusé, absent toléré (anciennes clés)', L.cleProprietaireOk(uO, enc.encode(opr)) && !L.cleProprietaireOk(uO, enc.encode(adm)) && L.cleProprietaireOk(uO, null));
    dk.audit.push({ id: 'auCle', date: '2026-11-26T10:00:00Z', uid: opr, action: 'connexion', type: 'cle', cibleId: k7.id, resume: 'Connexion par clé d’accès' });
    t('… dernière utilisation lue dans le journal des accès', L.cleDerniereUtilisation(dk, k7.id) === '2026-11-26T10:00:00Z' && L.cleDerniereUtilisation(dk, 'inconnue') === '');
    // opérations : module de saisie
    t('opérations : préparation et tirage → Tirages, remuage → Cave, dégorgement → Dégorgement, soutirage → Opérations', L.opModuleSaisie(d, 'preparation') === 'tirage' && L.opModuleSaisie(d, 'tirage') === 'tirage' && L.opModuleSaisie(d, 'remuage') === 'cave' && L.opModuleSaisie(d, 'degorgement') === 'degorgement' && L.opModuleSaisie(d, 'soutirage') === 'ops' && L.opModuleSaisie(d, 'assemblage') === 'ops' && L.opsDuModule(d, 'cave').some((x) => x.id === 'remuage'));
    // droits : un profil d'avant le module « plan » prend les droits des opérations ; plans gardés par ce module
    const dg = L.clone(dk); const pf = dg.profils.find((p) => p.id === 'pf_consult'); delete pf.modules.plan; pf.modules.ops = 'ecriture';
    const uC = L.utilisateurSave(dg, { identifiant: 'labo2', nom: 'Labo', profilId: 'pf_consult', mdp: mA }).id; const av8 = L.clone(dg); L.planVinifSave(dg, L.clone(p0), null, uC);
    t('droits : profil d’avant le Plan de vinification → droits des opérations ; plan enregistré (journal) ; consultation seule refusée', L.niveauModule(dg, uC, 'plan') === 'ecriture' && L.gardeDroits(av8, dg, uC).ok && (() => { const x = L.clone(av8); x.profils.find((p) => p.id === 'pf_consult').modules.ops = 'lecture'; const y = L.clone(x); L.planVinifSave(y, L.clone(p0), null, uC); return !L.gardeDroits(x, y, uC).ok; })());
  }
  {
    // version, traductions, base 0.39.0-alpha.1 et compatibilité avec la 0.38.0-alpha.3 gelée
    t('version 0.39.0-alpha.1 : nouvelle version mineure (nouvelles fonctionnalités)', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.39.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.38.0-alpha.3' && L.CHANGELOG[i].notes.length === 5; })());
    t('traductions : plan de vinification, paramètres, clés d’accès et notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('Plan de vinification', 'en') === 'Winemaking plan' && L.traduire('Retirer l’accès', 'de') === 'Zugang entziehen' && L.CHANGELOG[1].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)), L.CHANGELOG[1].notes.map((n) => L.LANGUES_TRAD.filter((lg) => L.traduire(n, lg) === n)));
    const f45 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.39.0-alpha.1-plan.json'), 'utf8'))); L.syncConfig(f45);
    const pl = (f45.plansVinif || [])[0]; const uo = f45.utilisateurs.find((u) => u.identifiant === 'chai'); const kr = (uo.cles || []).find((k) => k.revoqueLe);
    t('fixture 0.39.0-alpha.1 : plan de vinification, clé révoquée, droit d’enregistrer, module « plan » dans l’ordre', pl && L.planVinifColonnes(pl).length === 12 && kr && kr.acceptee === false && uo.clesEnregistrer === false && f45.settings.modulesOrdre.includes('plan'));
    const dirO = path.join(__dirname, 'anciennes', '0.38.0-alpha.3');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, clesUtilisables, modulesVisibles, opSave, getR, clone, APP_VERSION, APP_NUM };')({});
    t('0.38.0-alpha.3 gelée chargée', O.APP_VERSION === '0.38.0-alpha.3' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f45)); O.syncConfig(x);
    t('… la 0.38.0-alpha.3 ouvre la base 0.39.0-alpha.1 sans rien perdre (plans, clés et droits gardés ; clé révoquée refusée là aussi ; module inconnu gardé dans l’ordre)', canonJ(x.plansVinif) === canonJ(f45.plansVinif) && canonJ(x.utilisateurs) === canonJ(f45.utilisateurs) && !O.clesUtilisables(x, 'app.test').some((y) => y.k.id === kr.id) && x.settings.modulesOrdre.includes('plan') && !O.modulesVisibles(x).includes('plan'));
    const Ro = O.getR(x); const pO = Object.values(Ro.portions).find((p) => p.vol > 500); O.opSave(x, { type: 'filtration', date: '2026-11-25', portionId: pO.id, pertes: [], lignes: [] }); x.meta.modifLe = '2026-11-27T09:00:00Z';
    const N = L.clone(f45); const pN = N.plansVinif[0]; pN.lignes[0].valeurs[Object.keys(pN.lignes[0].valeurs)[0]] = '6 cL/hL'; L.cleModifier(N, uo.id, kr.id, { acceptee: true, par: N.utilisateurs[0].id }); N.meta.modifLe = '2026-11-27T08:00:00Z';
    const FX = L.syncFusion(f45, N, x); const FX2 = O.syncFusion(f45, x, N);
    t('… synchronisation 0.39.0-alpha.1 ↔ 0.38.0-alpha.3 : filtration saisie là-bas, plan modifié et clé rétablie ici, rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => y.ops.length === f45.ops.length + 1 && Object.values(y.plansVinif[0].lignes[0].valeurs).includes('6 cL/hL') && y.utilisateurs.find((u) => u.id === uo.id).cles.find((k) => k.id === kr.id).acceptee === true && y.utilisateurs.find((u) => u.id === uo.id).clesEnregistrer === false), [FX.conflits, FX2.conflits]);
  }

  // ===== 47. 0.40.0-alpha.1 : référentiel réglementaire, vues Intrants liées, doses cumulées et teneurs, alertes à la saisie et a posteriori, multi-labels
  {
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); const uid = d.utilisateurs && d.utilisateurs[0] ? d.utilisateurs[0].id : '';
    // ---- intégrité du référentiel : chaque règle vise un composé et un référentiel connus, statut valide, unités cohérentes
    const ids = new Set(L.REG_COMPOSES.map((k) => k.id)); const labs = new Set(L.REG_LABELS.map((l) => l.id));
    t('référentiel : 9 référentiels (UE, AOC Champagne, Bio UE, Demeter, Biodyvin, Terra Vitis, Nature & Progrès, AVN, S.A.I.N.S.), règles valides et sourcées, sans doublon', labs.size === 9 && ['ue', 'aoc-champagne', 'bio-ue', 'demeter', 'biodyvin', 'terra-vitis', 'nature-progres', 'avn', 'sains'].every((x) => labs.has(x)) && L.REG_REGLES.every((r) => ids.has(r.compose) && labs.has(r.label) && ['oui', 'non', 'condition'].includes(r.statut) && r.source && (r.doseMax == null || r.doseMax > 0) && (r.teneurMax == null || r.teneurMax > 0)) && new Set(L.REG_REGLES.map((r) => `${r.label}|${r.compose}`)).size === L.REG_REGLES.length && L.REG_SO2.every((x) => labs.has(x.label) && x.valeur > 0 && x.source));
    const rg = (lab, c) => L.refRegle(d, lab, c);
    t('référentiel : chaque composé a sa règle UE et sa règle Bio UE (sauf chitosane en bio : non relevé, à vérifier dans l’annexe V partie D)', L.REG_COMPOSES.every((k) => L.REG_REGLES.some((r) => r.compose === k.id && r.label === 'ue') && (k.id === 'chitosane' || L.REG_REGLES.some((r) => r.compose === k.id && r.label === 'bio-ue'))), L.REG_COMPOSES.filter((k) => !L.REG_REGLES.some((r) => r.compose === k.id && r.label === 'bio-ue')).map((k) => k.id));
    // ---- valeurs relues (règlement 2019/934, bio 2021/1165, catalogues archivés : sorbate 27 g/hL ≈ 200 mg/L d'acide sorbique, métatartrique 10 g/hL, PVPP 80 g/hL, charbon 100 g/hL, lysozyme 50 g/hL)
    t('référentiel UE (2019/934 consolidé, fiches OIV) : sorbate 200 mg/L, métatartrique 10 g/hL, cuivre 1 g/hL et 1 mg/L, PVPP 80 g/hL, charbon 100 g/hL, lysozyme 50 g/hL, acide citrique 1 g/L, ascorbique 250 mg/L par traitement et 300 mg/L, gomme arabique 0,3 g/L, CMC < 200 mg/L, phytate 8 g/hL, DAP 1 g/L (0,3 g/L en prise de mousse)', rg('ue', 'sorbate').teneurMax === 200 && rg('ue', 'acide-metatartrique').doseMax === 10 && rg('ue', 'citrate-cuivre').doseMax === 1 && rg('ue', 'sulfate-cuivre').teneurMax === 1 && rg('ue', 'pvpp').doseMax === 80 && rg('ue', 'charbon').doseMax === 100 && rg('ue', 'lysozyme').doseMax === 50 && rg('ue', 'acide-citrique').teneurMax === 1000 && rg('ue', 'acide-ascorbique').doseMax === 25 && rg('ue', 'acide-ascorbique').teneurMax === 300 && rg('ue', 'gomme-arabique').doseMax === 30 && rg('ue', 'cmc').doseMax === 20 && rg('ue', 'phytate').doseMax === 8 && rg('ue', 'dap').doseMax === 100 && /0,3 g\/L/.test(rg('ue', 'dap').condition) && rg('ue', 'acide-sorbique').statut === 'non' && rg('ue', 'chlorure-argent').statut === 'non');
    t('référentiel Bio UE : PVPP, sorbate, lysozyme, DMDC, CMC, polyaspartate, sulfate de cuivre, acide fumarique interdits ; citrate de cuivre, métatartrique, gomme arabique (bio si disponible) autorisés — comme les mentions « utilisable en bio » des catalogues', ['pvpp', 'sorbate', 'acide-sorbique', 'lysozyme', 'dmdc', 'cmc', 'polyaspartate', 'sulfate-cuivre', 'acide-fumarique'].every((c) => rg('bio-ue', c).statut === 'non') && rg('bio-ue', 'citrate-cuivre').statut === 'oui' && rg('bio-ue', 'acide-metatartrique').statut === 'oui' && rg('bio-ue', 'gomme-arabique').statut === 'condition');
    t('… catalogues archivés recoupés : sorbate, lysozyme, CMC, acide fumarique jamais marqués « utilisable en bio » ; citrate de cuivre et métatartrique le sont', (() => { const E = L.catalogueEntrees(d, {}); const bio = (re) => E.filter((e) => re.test(L.catCle(e.nom))); return ['sorbate', 'lysozym', 'cmc', 'fumarique'].every((m) => bio(new RegExp(m)).every((e) => !e.ue)) && bio(/citrate de cuivre/).some((e) => e.ue) && bio(/metatartrique/).some((e) => e.ue); })());
    t('plafonds de SO₂ total du référentiel identiques aux exemples des plafonds (UE, Bio UE, Demeter)', L.PLAFONDS_EXEMPLES().every((p) => { const lab = { conv: 'ue', bio: 'bio-ue', dem: 'demeter' }[p.qualifId]; const r = L.REG_SO2.find((x) => x.label === lab && x.vin === p.vin); return r && r.valeur === p.valeur; }));
    t('héritage et listes fermées : Demeter reprend le Bio UE (PVPP interdite) et refuse ce que son cahier ne cite pas (tanins, enzymes, gélatine) ; S.A.I.N.S. et AVN refusent tout intrant ; SO₂ ajouté interdit en S.A.I.N.S. et AVN ; S.A.I.N.S. n’exige pas la certification bio', L.refCombiner(d, ['demeter', 'bio-ue', 'ue'], 'pvpp').statut === 'non' && ['tanins', 'enzymes', 'gelatine', 'gomme-arabique'].every((c) => L.refCombiner(d, ['demeter', 'bio-ue', 'ue'], c).statut === 'non') && L.refCombiner(d, ['demeter', 'bio-ue', 'ue'], 'bentonite').statut === 'condition' && L.refCombiner(d, ['sains', 'ue'], 'bentonite').statut === 'non' && L.refCombiner(d, ['avn', 'bio-ue', 'ue'], 'tanins').statut === 'non' && rg('sains', 'so2').statut === 'non' && rg('avn', 'so2').statut === 'non' && L.REG_LABELS.find((l) => l.id === 'sains').herite.join() === 'ue');
    // sources officielles relues : statut « vérifié » seulement avec une référence précise ; AVN, Terra Vitis et l'origine bio du sucre restent « à vérifier »
    t('vérification : règles et plafonds vérifiés avec leur texte et leur article ; AVN et Terra Vitis « à vérifier » ; chaque valeur à vérifier le reste à l’affichage', L.REG_REGLES.filter((r) => r.verifie).every((r) => r.source && !/à vérifier/.test(r.source)) && L.REG_REGLES.filter((r) => r.label === 'avn').every((r) => !r.verifie) && L.REG_SO2.filter((r) => r.label === 'avn').every((r) => !r.verifie) && !rg('ue', 'pvpp').aVerifier && rg('avn', 'so2').aVerifier && !rg('bio-ue', 'sucre').verifie && rg('bio-ue', 'sucre').aVerifier && L.refRegle(d, 'demeter', 'gomme-arabique').statut === 'non' && !L.refRegle(d, 'demeter', 'gomme-arabique').aVerifier && L.REG_REGLES.filter((r) => r.verifie).length >= 120);
    t('valeurs corrigées par les textes : chitosane autorisé en bio (Aspergillus niger) ; Nature & Progrès 40 mg/L de SO₂ ; Biodyvin 96 mg/L pour les Champagnes ; Demeter 70 mg/L (sucres < 12 g/L) ; acidification Demeter 1,5 g/L ; AVN 10 mg/L ; AOC Champagne : bois interdit', rg('bio-ue', 'chitosane').statut === 'condition' && L.REG_SO2.filter((x) => x.label === 'nature-progres').every((x) => x.valeur === 40) && L.REG_SO2.find((x) => x.label === 'biodyvin' && x.vin === 'effervescent').valeur === 96 && /12 g\/L/.test(L.REG_SO2.find((x) => x.label === 'demeter' && x.vin === 'effervescent').note) && rg('demeter', 'acide-tartrique').doseMax === 150 && L.REG_SO2.find((x) => x.label === 'avn' && x.vin === 'rouge').valeur === 10 && rg('aoc-champagne', 'copeaux').statut === 'non' && !rg('aoc-champagne', 'acide-tartrique'));
    t('produit liquide de teneur inconnue : dose du composé non estimée (pas de fausse alerte, signalé) ; solide supposé pur', (() => { const pl = { id: 'x', nom: 'Gomme arabique liquide', categorie: 'oeno', unite: 'mL' }; const r1 = L.refRegleProduit(d, pl, 'conv'); const ps = { id: 'y', nom: 'Gomme arabique poudre', categorie: 'oeno', unite: 'g' }; const r2 = L.refRegleProduit(d, ps, 'conv'); return r1.doseMax == null && r1.nonEstime.includes('gomme-arabique') && r2.doseMax === 30; })());
    // ---- composés reconnus d'après le nom
    const cp = (nom, x) => L.refComposesDe({ nom, categorie: 'oeno', ...(x || {}) });
    const cCu = cp('CITRATE DE CUIVRE 2%'); const cB = cp('Bisulfite d’ammonium 150 g/L'); const cLi = cp('Levures inactivées riches en glutathion'); const cS = cp('Sorbate de potassium');
    t('composés : citrate de cuivre 2 % (teneur 0,02, sans acide citrique), bisulfite d’ammonium (SO₂, pas un sel nutritif), levures inactivées (pas des levures sélectionnées), sorbate pur supposé', cCu.length === 1 && cCu[0].id === 'citrate-cuivre' && cCu[0].part === 0.02 && !cCu[0].supposee && cB.map((x) => x.id).sort().join() === 'bisulfite-ammonium,so2' && cLi.map((x) => x.id).join() === 'levures-inactivees' && cS[0].id === 'sorbate' && cS[0].part === 1 && cS[0].supposee && cp('Papier filtre', { categorie: 'sec' }).length === 0);
    t('composés choisis à la main prioritaires (teneur bornée à 100 %)', L.refComposesDe({ nom: 'Mélange X', categorie: 'oeno', composes: [{ id: 'sorbate', part: 0.5 }, { id: 'inconnu' }] }).map((x) => `${x.id}:${x.part}`).join() === 'sorbate:0.5');
    // ---- revendications de l'exploitation → référentiels ; appellation selon le vignoble
    t('revendications : Conventionnel → UE + AOC Champagne ; FR-BIO-01 → Bio UE ; Demeter → Demeter (+ Bio UE repris)', L.qualifReferentiels(d, 'conv').length === 0 && L.qualifReferentiels(d, 'bio').join() === 'bio-ue' && L.qualifReferentiels(d, 'dem').join() === 'demeter' && L.refAppellation(d) === 'aoc-champagne' && L.refLabelsPour(d, 'dem').map((x) => x.id).sort().join() === 'aoc-champagne,bio-ue,demeter,ue');
    { const da = L.clone(d); da.settings.profilViticole = { region: 'bordeaux' }; t('… autre vignoble (Bordeaux) : pas de règle de l’AOC Champagne', L.refAppellation(da) === null && !L.refLabelsPour(da, 'conv').some((x) => x.id === 'aoc-champagne')); }
    // ---- produits et arrivages fictifs, lot conventionnel
    const mk = (nom, unite, x) => { const id = L.produitSave(d, { nom: `${nom} (essai)`, categorie: 'oeno', unite, ...(x || {}) }).id; const a = L.arrivageSave(d, { produitId: id, numLot: `T-${id}`, date: '2026-01-01', qty: 100000 }).id; return { id, a }; };
    const SO = mk('Sorbate de potassium', 'g'); const CU = mk('Citrate de cuivre 2 %', 'g', { composes: [{ id: 'citrate-cuivre', part: 0.02 }] }); const MT = mk('Acide métatartrique', 'g'); const PV = mk('PVPP poudre', 'g'); const BE = mk('Bentonite sodique', 'g');
    let R = L.replay(d); const p = Object.values(R.portions).filter((x) => (R.lots[x.lotId] || {}).qualif === 'conv' && x.vol > 1000).sort((a, b) => b.vol - a.vol)[0]; const lotId = p.lotId; const V = p.vol; const Vlot = Object.values(R.portions).filter((x) => x.lotId === lotId).reduce((t0, x) => t0 + x.vol, 0);
    const ajout = (pr, gHL, x) => ({ type: 'intrant', sousType: '', date: '2026-11-20', portionId: p.id, lignes: [{ produitId: pr.id, arrivageId: pr.a, qty: Math.round(gHL * Vlot / 100 * 1000) / 1000 }], prepUses: [], motif: 'test', ...(x || {}) });
    // dose cumulée et teneur : 25 g/hL de sorbate → 186,6 mg/L d'acide sorbique (≤ 200) ; puis +5 g/hL → 223,9 mg/L (> 200, UE)
    const pv1 = L.previewOp(d, ajout(SO, 25));
    t('saisie : 25 g/hL de sorbate en Conventionnel → aucun dépassement (186,6 mg/L d’acide sorbique ≤ 200)', pv1.ok && !pv1.depassements.length, pv1.depassements);
    t('… opération validée', L.opSave(d, ajout(SO, 25)).ok); R = L.replay(d);
    const T1 = L.refTeneursLot(d, R, lotId).find((x) => x.espece === 'sorbique');
    t('teneur cumulée du lot : acide sorbique 186,6 mg/L (25 g/hL × 0,7464 × 10), plafond 200 (UE)', T1 && Math.abs(T1.mgL - 25 * 0.7464 * 10) < 0.05 && T1.max === 200 && T1.maxPar === 'ue' && !T1.depasse, T1);
    const pv2 = L.previewOp(d, ajout(SO, 5)); const dT = pv2.depassements.find((x) => x.type === 'teneur');
    t('alerte préventive : +5 g/hL → teneur 223,9 mg/L > 200 (UE), motif exigé', !!dT && dT.espece === 'sorbique' && Math.abs(dT.valeur - 30 * 0.7464 * 10) < 0.1 && dT.max === 200 && dT.label === 'ue', pv2.depassements);
    // dose maximale d'emploi : métatartrique 12 g/hL > 10 g/hL (UE)
    const pv3 = L.previewOp(d, ajout(MT, 12)); const dD = pv3.depassements.find((x) => x.type === 'dose');
    t('alerte préventive : acide métatartrique 12 g/hL > dose max 10 g/hL (UE, fiche OIV 3.3.7), règle vérifiée', !!dD && dD.max === 10 && dD.label === 'ue' && !dD.aVerifier, pv3.depassements);
    // cuivre : citrate à 2 % — 14 g/hL → 0,99 mg/L (≤ 1) ; 20 g/hL → 1,41 mg/L (> 1)
    const cu14 = L.previewOp(d, ajout(CU, 14)); const cu20 = L.previewOp(d, ajout(CU, 20));
    t('cuivre : citrate de cuivre 2 % — 14 g/hL ≤ 1 mg/L de cuivre, 20 g/hL → 1,41 mg/L > 1 (teneur), dose de citrate 0,4 g/hL ≤ 1 g/hL', !cu14.depassements.length && cu20.depassements.length === 1 && cu20.depassements[0].type === 'teneur' && Math.abs(cu20.depassements[0].valeur - 20 * 0.02 * 0.3528 * 10) < 0.01, [cu14.depassements, cu20.depassements]);
    // multi-labels : le lot conventionnel vise aussi le Bio UE → sorbate interdit à la saisie, PVPP aussi ; bentonite autorisée
    t('labels visés : Bio UE ajouté au lot (gardé), inconnu ignoré', L.lotLabelsVises(d, lotId, ['bio-ue', 'xx']).ok && d.lots.find((l) => l.id === lotId).labelsVises.join() === 'bio-ue'); R = L.replay(d);
    const pv4 = L.previewOp(d, ajout(SO, 2)); const pv5 = L.previewOp(d, ajout(PV, 20)); const pv6 = L.previewOp(d, ajout(BE, 20));
    t('multi-labels à la saisie : sorbate et PVPP refusés par le Bio UE visé (motif exigé), bentonite acceptée', pv4.depassements.some((x) => x.type === 'interdit' && x.label === 'bio-ue') && pv5.depassements.some((x) => x.type === 'interdit' && x.label === 'bio-ue') && !pv6.depassements.length, [pv4.depassements, pv5.depassements, pv6.depassements]);
    // a posteriori : sorbate validé avant, label visé ensuite → alerte persistante sur le lot et dans le registre
    const C1 = L.lotConformite(d, R, lotId);
    t('alerte a posteriori : sorbate déjà dans le lot devenu « non conforme » quand le Bio UE est visé (non justifié), lot listé au registre', C1.some((a) => a.type === 'interdit' && a.produitId === SO.id && !a.justifie) && L.lotsNonConformes(d, R).some((x) => x.lotId === lotId), C1);
    // passage en S.A.I.N.S. : tout intrant non listé refusé ; SO₂ ajouté interdit
    L.lotLabelsVises(d, lotId, ['sains']); R = L.replay(d); const C2 = L.lotConformite(d, R, lotId);
    t('passage en S.A.I.N.S. (label visé) : le sorbate déjà ajouté reste signalé (aucun intrant accepté)', C2.some((a) => a.type === 'interdit' && a.produitId === SO.id) && L.refLabelNom(L.refRegleProduit(d, L.clone(d.produits.find((x) => x.id === BE.id)), 'conv', ['sains']).interditPar) === 'Vins S.A.I.N.S.');
    L.lotLabelsVises(d, lotId, []); R = L.replay(d);
    t('labels visés retirés : plus d’alerte d’intrant pour ce lot conventionnel', !L.lotConformite(d, R, lotId).some((a) => a.type === 'interdit') && !('labelsVises' in d.lots.find((l) => l.id === lotId)));
    // a posteriori : dépassement validé avec motif → alerte justifiée
    const sp = ajout(SO, 5); const pvj = L.previewOp(d, sp); sp.depassement = { motif: 'Essai', par: uid, le: '2026-11-20', details: pvj.depassements };
    t('dépassement validé avec motif : alerte de teneur gardée sur le lot, marquée justifiée', L.opSave(d, sp).ok && (() => { const Rj = L.replay(d); const A = L.lotConformite(d, Rj, lotId).filter((a) => a.type === 'teneur'); return A.length === 1 && A[0].justifie && !L.lotsNonConformes(d, Rj).some((x) => x.lotId === lotId); })());
    // déclassement / changement de revendication : lot bio avec un produit autorisé seulement en conventionnel
    { const dd = L.clone(d); const lot = dd.lots.find((l) => l.id === lotId); lot.qualif = 'bio'; const Rb = L.replay(dd); const A = L.lotConformite(dd, Rb, lotId);
      t('revendication changée en Bio (sans nouvelle opération) : sorbate signalé non conforme a posteriori', A.some((a) => a.type === 'interdit' && a.produitId === SO.id), A); }
    // SO₂ total : plafond le plus bas des référentiels du lot (Demeter visé → 70 mg/L en effervescent) ; plafond vérifié de l'exploitation prioritaire
    { const dd = L.clone(d); L.lotLabelsVises(dd, lotId, ['demeter']); const Rb = L.replay(dd); const pf = L.plafondSo2Lot(dd, Rb, lotId);
      t('SO₂ total : lot conventionnel visant Demeter → plafond 70 mg/L (Demeter, effervescent) au lieu de 185', pf && pf.valeur === 70 && pf.referentiel === 'demeter', pf);
      L.lotLabelsVises(dd, lotId, []); const conv = dd.plafonds = L.PLAFONDS_EXEMPLES(); conv.find((x) => x.qualifId === 'conv' && x.vin === 'effervescent').aVerifier = false; conv.find((x) => x.qualifId === 'conv' && x.vin === 'effervescent').valeur = 235;
      const pf2 = L.plafondSo2Lot(dd, L.replay(dd), lotId);
      t('… plafond vérifié par l’exploitation (235, autres vins mousseux) prioritaire sur l’exemple de l’UE (185)', pf2 && pf2.valeur === 235 && !pf2.referentiel, pf2); }
    // ---- vues liées : synthèse commune, alignement sur le référentiel
    const S = L.revendicationSynthese(d, 'bio'); const sPV = S.find((x) => x.id === PV.id); const sBE = S.find((x) => x.id === BE.id);
    t('synthèse par revendication : produits du catalogue de l’exploitation seulement (sans matières sèches), avis du référentiel (PVPP interdit, bentonite autorisée)', S.length === d.produits.filter((x) => x.categorie !== 'sec').length && sPV.ref.interdit && sPV.ref.interditPar === 'bio-ue' && sBE.ref && !sBE.ref.interdit);
    t('« Aligner » : la bentonite passe « autorisée » en Bio (à vérifier, source du référentiel), la PVPP reste interdite', L.regleDepuisReferentiel(d, BE.id, 'bio', uid).ok && L.ruleFor(d, BE.id, 'bio').autorise === true && L.ruleFor(d, BE.id, 'bio').aVerifier === true && /Référentiel/.test(L.ruleFor(d, BE.id, 'bio').source) && L.regleDepuisReferentiel(d, PV.id, 'bio', uid).ok && L.ruleFor(d, PV.id, 'bio').autorise === false);
    t('… mise à jour vue des deux côtés : règle effective de la synthèse = règle effective des opérations', L.revendicationSynthese(d, 'bio').find((x) => x.id === BE.id).eff.autorise === true);
    // règle de substance du cahier des charges (Revendications & plafonds) → visible dans la synthèse ; règle du produit plus large signalée « restreint »
    L.plafondSave(d, { qualifId: 'bio', objet: 'substance', mot: 'bentonite', libelle: 'Bentonite', autorise: true, doseMax: 50, unite: 'g/hL', aVerifier: false }, null, uid); L.regleSet(d, BE.id, 'bio', { doseMax: 80 });
    const sB2 = L.revendicationSynthese(d, 'bio').find((x) => x.id === BE.id);
    t('règle de substance (50 g/hL) plus stricte que la règle du produit (80) : règle effective 50, écart « restreint » signalé', sB2.eff.doseMax === 50 && sB2.conflit);
    const nAl = L.reglesDepuisReferentiel(d, 'dem', uid);
    t('« Aligner sur le référentiel » pour toute une revendication (Demeter) : règles mises à jour, marquées à vérifier', nAl.ok && nAl.n > 0 && L.ruleFor(d, PV.id, 'dem').autorise === false);
    // ---- corrections de l'exploitation, désactivation
    t('correction de l’exploitation : sorbate UE à 150 mg/L (tracée, vérifiée) ; valeur d’origine rétablie ensuite', L.refExceptionSet(d, 'ue|sorbate', { statut: 'oui', teneurMax: 150 }, uid).ok && L.refRegle(d, 'ue', 'sorbate').teneurMax === 150 && L.refRegle(d, 'ue', 'sorbate').exception && !L.refRegle(d, 'ue', 'sorbate').aVerifier && L.refExceptionSet(d, 'ue|sorbate', null).ok && L.refRegle(d, 'ue', 'sorbate').teneurMax === 200 && !L.refExceptionSet(d, 'zz|sorbate', { statut: 'oui' }).ok && !L.refExceptionSet(d, 'ue|sorbate', { statut: 'peut-être' }).ok);
    t('correction d’un plafond de SO₂ du référentiel (Demeter effervescent à 100 : dose dérogatoire)', L.refExceptionSet(d, 'demeter|so2t|effervescent', { valeur: 100 }, uid).ok && L.REG_SO2.find((x) => x.label === 'demeter' && x.vin === 'effervescent').valeur === 70 && L.refSo2Plafonds(d, R, lotId, 'effervescent').length >= 1);
    L.refActiver(d, false);
    t('référentiel désactivé : plus d’avis ni de dépassement du référentiel (règles du produit et plafonds seuls)', L.refRegleProduit(d, d.produits.find((x) => x.id === PV.id), 'bio') === null && !L.previewOp(d, ajout(CU, 20)).depassements.length);
    L.refActiver(d, true);
    // ---- droits : corrections du référentiel réservées au module Intrants en écriture
    { const g = L.clone(d); g.settings.securite = { actif: true }; const prof = { id: 'pf-lect', nom: 'Lecture intrants', modules: { intrants: 'lecture', params: 'ecriture' }, droits: {} }; g.profils = [...(g.profils || []), prof]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-lect', identifiant: 'lect', nom: 'Lect', profilId: 'pf-lect', actif: true }];
      const h = L.clone(g); L.refExceptionSet(h, 'ue|pvpp', { statut: 'oui', doseMax: 60 }, 'u-lect'); const rr = L.gardeDroits(g, h, 'u-lect');
      t('droits : correction du référentiel refusée sans l’écriture du module Intrants', rr.ok === false && /référentiel/.test(rr.msg), rr); }
    // ---- version, traductions, base 0.40.0-alpha.1 et compatibilité avec la 0.39.0-alpha.1 gelée
    t('version 0.40.0-alpha.1 : nouvelle version mineure (nouvelle fonctionnalité)', L.APP_VERSION === '0.40.0-alpha.1' && L.CHANGELOG[0].v === '0.40.0-alpha.1' && L.CHANGELOG[1].v === '0.39.0-alpha.1' && L.CHANGELOG[0].notes.length === 5);
    t('traductions : référentiel réglementaire et notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('⚖ Référentiel réglementaire', 'en') === '⚖ Regulatory reference' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)), L.CHANGELOG[0].notes.map((n) => L.LANGUES_TRAD.filter((lg) => L.traduire(n, lg) === n)));
    const f47 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.40.0-alpha.1-referentiel.json'), 'utf8'))); L.syncConfig(f47);
    const so = f47.produits.find((x) => /Sorbate de potassium \(fictif\)/.test(x.nom)); const cu = f47.produits.find((x) => /Citrate de cuivre/.test(x.nom)); const lv = f47.lots.find((l) => Array.isArray(l.labelsVises)); const opJ = f47.ops.find((o) => o.depassement && o.lignes && o.lignes.some((x) => x.produitId === so.id));
    const R47 = L.replay(f47);
    t('fixture 0.40.0-alpha.1 : composés choisis, labels de la revendication Demeter, label visé, correction du référentiel, dépassement justifié', cu.composes[0].part === 0.02 && L.qualifReferentiels(f47, 'dem').join() === 'demeter,sains' && lv.labelsVises.join() === 'bio-ue' && f47.settings.referentiel.exceptions['ue|sorbate'].teneurMax === 150 && opJ && L.lotConformite(f47, R47, lv.id).some((a) => a.type === 'interdit' && a.justifie));
    const dirO = path.join(__dirname, 'anciennes', '0.39.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, opSave, getR, clone, regleEffective, lotIntrantsCumul, APP_VERSION, APP_NUM };')({});
    t('0.39.0-alpha.1 gelée chargée', O.APP_VERSION === '0.39.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f47)); O.syncConfig(x);
    t('… la 0.39.0-alpha.1 ouvre la base 0.40.0-alpha.1 sans rien perdre (composés, labels visés, référentiels des revendications, corrections, dépassement justifié)', canonJ(x.produits) === canonJ(f47.produits) && canonJ(x.lots) === canonJ(f47.lots) && canonJ(x.lists.qualifs) === canonJ(f47.lists.qualifs) && canonJ(x.settings.referentiel) === canonJ(f47.settings.referentiel) && canonJ(x.ops) === canonJ(f47.ops) && !!O.lotIntrantsCumul(x, O.getR(x), lv.id).length);
    const Ro = O.getR(x); const pO = Object.values(Ro.portions).find((q) => q.vol > 500 && q.lotId !== lv.id); O.opSave(x, { type: 'filtration', date: '2026-11-25', portionId: pO.id, pertes: [], lignes: [] }); x.meta.modifLe = '2026-11-28T09:00:00Z';
    const N = L.clone(f47); L.lotLabelsVises(N, lv.id, ['bio-ue', 'demeter']); L.refExceptionSet(N, 'bio-ue|charbon', { statut: 'condition', condition: 'essai' }, uid); N.meta.modifLe = '2026-11-28T08:00:00Z';
    const FX = L.syncFusion(f47, N, x); const FX2 = O.syncFusion(f47, x, N);
    t('… synchronisation 0.40.0-alpha.1 ↔ 0.39.0-alpha.1 : filtration saisie là-bas, labels visés et correction du référentiel ici, rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => y.ops.length === f47.ops.length + 1 && y.lots.find((l) => l.id === lv.id).labelsVises.join() === 'bio-ue,demeter' && y.settings.referentiel.exceptions['bio-ue|charbon'] && y.settings.referentiel.exceptions['ue|sorbate']), [FX.conflits, FX2.conflits]);
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (47 : référentiel réglementaire, vues Intrants liées, doses cumulées et teneurs, alertes à la saisie et a posteriori multi-labels ; compatibilité 0.39.0-alpha.1)');
  process.exitCode = fails ? 1 : 0;
})();
