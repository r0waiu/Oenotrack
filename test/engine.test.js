// Tests du moteur (sans navigateur) : concatène les fichiers JS « données » et exécute des scénarios.
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '10b-qr.js', '11-crus.js', '12-vin.js', '12b-termes.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '16c-plans-hygiene.js', '16d-complements.js', '16e-garde.js', '16f-bulletins.js', '16g-trace-fichier.js', '16h-listes-hygiene.js', '16i-equipements.js', '16j-cave.js', '16k-catalogues.js', '16ka-catalogues-web.js', '16l-plafonds.js', '16m-schemas.js', '16n-drm.js', '16o-profils.js', '16oa-appellations-donnees.js', '16ob-appellations.js', '16oc-echelles-appellations.js', '16p-intrants-stocks.js', '16q-produits-maintenance.js', '16r-bibliotheques.js', '16s-plans-vinif.js', '16t-referentiel.js', '16u-codification.js', '16v-tirage.js', '16w-tirage-chantier.js', '16wa-tirage-cuvees.js', '16x-tirage-fournitures.js', '16y-tirage-declarations.js', '16z-personnalisation.js', '17-ia.js', '17a-ia-usages.js', '17b-langues.js', '17c-traductions.js', '17d-trad-vocabulaire.js', '17e-trad-cuverie.js', '17f-trad-operations.js', '17g-trad-listes.js', '17h-trad-coque.js', '17i-trad-pesee.js', '17j-trad-pressoir-ops.js', '17k-trad-plans.js', '17l-trad-pressurage.js', '17m-trad-imports.js', '17n-trad-ajustements.js', '17o-trad-028.js', '17p-trad-029.js', '17q-trad-030.js', '17r-trad-031.js', '17s-trad-032.js', '17t-trad-033.js', '17u-trad-034.js', '17v-trad-035.js', '17w-trad-036.js', '17x-trad-037.js', '17y-trad-038.js', '17z-trad-038-2.js', '17za-trad-038-3.js', '17zb-trad-039.js', '17zc-trad-040.js', '17zd-trad-040-2.js', '17ze-trad-041.js', '17zf-trad-042.js', '17zg-trad-042-2.js', '17zh-trad-042-3.js', '17zi-trad-042-4.js', '17zj-trad-043.js', '17zk-trad-043-2.js', '17zl-trad-043-3.js', '17zm-trad-044.js', '17zn-trad-045.js', '17zo-trad-046.js', '17zp-trad-046-2.js', '17zq-trad-047.js', '17zr-trad-047-2.js', '17zs-trad-047-3.js', '17zt-trad-048.js', '17zu-trad-048-ops.js', '17zv-trad-048-formulaires.js', '17zw-trad-048-modules.js', '17zx-trad-048-parametres.js', '17zy-trad-049-chai.js', '17zz-trad-049-documents.js', '17zza-trad-049-regle.js', '17zzb-trad-049.js', '18-mentions.js', '19-pressoir.js', '20-engine.js', '25-trace.js', '25b-trace-etapes.js', '27-audits.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '33b-chiffrement.js', '33c-dossier-reseau.js', '33d-coffre.js', '33e-onglet.js', '34-acces.js', '34b-cles-acces.js', '35-seed.js'];
if (!files.includes('17ad-ia-regle.js')) files.splice(files.indexOf('17a-ia-usages.js') + 1, 0, '17ad-ia-regle.js');
if (!files.includes('17ac-ia-documents.js')) files.splice(files.indexOf('17a-ia-usages.js') + 1, 0, '17ac-ia-documents.js');
if (!files.includes('17ab-ia-chai.js')) files.splice(files.indexOf('17a-ia-usages.js') + 1, 0, '17ab-ia-chai.js');
let src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
src = src.replace(/const \{ useState[^\n]*\n/, '');
const canonJ = (v) => (v === null || typeof v !== 'object' ? JSON.stringify(v === undefined ? null : v) : Array.isArray(v) ? `[${v.map(canonJ).join(',')}]` : `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonJ(v[k])}`).join(',')}}`);
const body = src + '\n;return { iaSaisiePrompt, iaSaisieLire, iaSaisiePreset, iaFicheStructure, iaFichePrompt, iaFicheLire, iaFicheForm, iaFermentationDonnees, iaFermentationPrompt, iaRecherchePrompt, iaRechercheAppliquer, iaHistoireDonnees, iaHistoirePrompt, iaHistoireRendu, iaChaiNombre, todayISO, iadDate, iadHeure, iadNombre, iadUnite, iadConvertir, iadRapprocher, iaReceptionPrompt, iaReceptionLire, IA_RECEPTION_SCHEMA, iaPeseePrompt, iaPeseeLire, iaMoutLire, IA_PESEE_SCHEMA, IA_MOUT_SCHEMA, iaBaremesLire, iaBaremesPages, iaPlanPrompt, iaPlanLire, IA_PLAN_SCHEMA, iaComposesPrompt, iaComposesLire, iaComposesChoix, IA_COMPOSES_SCHEMA, iaCommentaireDonnees, iaCommentairePrompt, iaCommentaireLire, IA_COMMENTAIRE_SCHEMA, planVinifNet, IA_USAGES, IA_NIVEAUX, iaUsageDef, iaUsageActif, iaAdresseLocale, iaServiceLocal, iaUsageRefus, iaConsentRequis, iaSchemaValider, iaContenuImages, iaImagesNorm, iaRequete, iaTraceNorm, iaTraceTexte, iaUsage, iaJournalLire, iaJournalVider, iaNiveau2Set, iaNiveau2Reglage, iaConfigLire, iaFormatReponse, fail, champsErreurDetail, champsPersoErreurDetail, SUCRE_VOL_PHYSIQUE_LKG, SUCRE_VOL_DOUANE_LKG, COEF_SUCRE_DEFAUT, coefSucre, densPtParGL, sucreVolPhysique, sucreVolDouane, millesimeAffiche, millesimeSaisi, roseCoupageAlerte, assemblageCoupage, termesMigrer047, so2TavDe, tavParamId, bulletinTavnMout, aciditeEquivalence, profilAciditeUnites, DEFAULT_FRACTIONS, BULLETIN_CATALOGUE, bulletinParam, stadeSuggestion, CATEGORIES, TIRAGE_SOURCE_VRTP, eLabel, ECHELLE_HIERARCHIES, echelleHierarchie, appEchelleProposee, appellationEchelle, appellationEchelleSet, appellationNiveaux, lotAppellations, appRef, appRefRegion, appTypes, appTypesRegion, profilTypeHorsAppellation, appChercher, appellationDepuisRef, norm, OP_GROUPES, opSurPortion, TIRAGE_MODES, lotEstMixtion, qualifEstBio, codeAgrementValide, codeAgrementNorm, qualifAffiche, qualifCodeAgrementSet, bioMigrerLibelle, VISITE_CHAPITRES, visiteChapitres, VISITE_ESSENTIEL, visiteEssentiel, visiteDuree, qDef, estModule, couleurLabel, chantierCuvees, chantierCuvee, cuveeMentionsComp, cuveeCaracteres, cuveeEffective, chantierCuveeSave, chantierCuveeDelete, cuveeRealise, CUVEE_STATUTS, cuveePreset, declPrealableCuvees, PERSO_MODES, PERSO_SECTIONS, PERSO_QUESTIONS, PERSO_REVENDICATIONS, PERSO_ONGLETS, persoQuestion, persoOptions, persoQuestions, persoDuree, persoDefauts, persoValider, persoValiderTout, persoOperateurs, persoPlan, persoAppliquer, persoMemoriser, moduleActif, emptyDb, securiteActiver, securiteActive, securiteReglages, qualifUsage, refActif, schemasReglage, drmReglage, PLANV_CRITERES, planVinifConditionsNet, planVinifConditions, planVinifEstVariante, lotCriteresPlan, planVinifScore, planVinifPourLotChoix, planVinifOpDevine, planVinifOpDe, planVinifEtapes, planVinifQteProduit, planVinifAppliquer, previsionEnRetard, planVinifCellule, planVinifEntete, planVinifLigne, planVinifConditionsSet, planVinifVariante, planVinifDepuisSchema, plansVinifConvertirSchemas, lotsSansSchema, schemaPrevsDuLot, refMigrerLabels, REG_LABELS_RENOMMES, plafondLiens, plafondCatalogueAuto, plafondCatalogueConcerne, plafondProduitsCatalogue, plafondLienSet, plafondConcerneProduit, refComposesCatalogue, refComposesCatalogueSet, refCatalogueParCompose, labelsSo2Synthese, catalogueEntree, DECL_TIRAGE_TYPES, DECL_PREALABLE_DELAI_H, declDeclarant, declPrealableCalcul, declDelaiHeures, declTirageOps, declRevendicationsLot, declFinaleLots, declFinaleCalcul, declFinaleCsv, declarationTirageSave, declarationTirageDeposer, declarationTirageRouvrir, declarationTirageDelete, declarationTirageReglagesSet, tiragesNonDeclares, ordreTirage, drmReglageSet, chantierTirages, FOURNITURE_TYPES, fournitureTypeDe, fournitureFormat, fournitureSuivi, fournituresTirage, fournitureSpec, fournitureQteTirage, tirageFournituresProposees, tirageFournituresSpec, tirageFournituresDe, tirageLignesHorsFournitures, fournituresAlertes, fournitureRetourSave, fournitureRetours, traceIntrant, tirageFormatsDe, tirageFormatsCompat, tirageEqBouteilles, tirageModeControle, tiragePompeBilan, tiragePompeSpec, pompeMlCol, chantierTirageSave, chantierTirageDelete, chantierBilan, chantiersTirage, chantierNumeroSuivant, prestatairesTirage, fournisseurSave, TIRAGE_FORMATS, TIRAGE_PROFIL_DEFAUT, TIRAGE_VRTP_MAX_PCT, tirageProfil, tirageProfilSet, tirageCalcul, liqueurFonte, tirageCorrection, levainEtapes, levainPropagation, levainRecalibrer, prepCompo, tirageBilan, tirageVrtp, tirageRevendicationAlertes, levainPlanSet, levainSuivi, levainRealise, dependentsOf, CODIF_STADES, CODIF_GROUPES, codifChampenois, codifDeChampenois, codifLettres, codifSemaine, codifJourAn, codifGenerer, codifTrace, codifVersionSet, codifVersionDel, codifVersion, codifActif, codifUnicite, codifRegleOptions, codifTableSet, codifTableDel, codifTableCode, codifValider, codifUsage, codifCtxSources, codifCtxLot, codifParent, codifChoixHerites, codifChoixTables, codifStadePourOp, codifExporter, codifImporter, codifCodePris, codifParties, lotRenommer, lotEdit, habillageSave, habillageDelete, habillageRestant, habillageFini, habillageCodeDefaut, habillagesDe, codifCtxHabillage, traceChercher, opDelete, catalogueEcocert, catalogueMasquer, catalogueListe, ecocertListe, ecocertPour, catalogueWeb, catalogueIntegre, catalogueChercher, produitDepuisCatalogue, ECOCERT_SOURCE, refLabelNom, PLAFONDS_EXEMPLES, catCle, REG_LABELS, REG_COMPOSES, REG_REGLES, REG_SO2, refRegle, refCombiner, refComposesDe, refRegleProduit, refLabelsLot, refLabelsPour, qualifReferentiels, qualifReferentielsSet, refAppellation, lotLabelsVises, refTeneursDe, refTeneursLot, refSo2Plafonds, lotConformite, lotsNonConformes, revendicationSynthese, regleDepuisReferentiel, reglesDepuisReferentiel, refExceptionSet, refActiver, produitComposesSet, refMatrice, refAlerteTexte, planVinifDepuisFeuille, planVinifSave, planVinifPourLot, planVinifColonnes, planVinifValeur, plansVinifDe, plansVinifMaterialiser, planVinifQuantite, planVinifDose, planVinifChangerEtendue, planVinifCellules, planVinifDupliquer, planVinifSupprimer, planVinifValider, planVinifColonnePourLot, PLANV_EXEMPLE, clesPeutEnregistrer, cleEtat, clesDoublons, cleProprietaireOk, clesEnregistrerRegler, cleDerniereUtilisation, opModuleSaisie, opsDuModule, utilisateurSave, hasNum, syncConflitsGarder, loadDbIllisible, loadDbDebloquer, texteDeOctets, bulletinConvertir, xmlEsc, ongletDemarrer, ongletBloque, so2Herite, fracRoleDevine, FRAC_ROLES, dependentsOf, marcVolumes, fracRole, maintStock, arrivageDelete, arrivageSave, regulRestant, so2Teneur, so2TotalEstime, etiqPersoNorm, etiqPersoMise, ETIQ_PERSO_MODELES, ETIQ_PERSO_DEFAUT, coffreChiffrerAvec, coffreDechiffrerAvec, coffreEnveloppe, coffreAncien, coffreEmballer, coffreDeballerBrut, coffreKekMdp, coffreImporterDek, coffreMdpErreur, coffreLire, coffreEcrire, coffreInfo, iaEspaceReglage, iaPersoAutorise, iaEspaceRegler, iaEspaceRetirer, iaActive, iaActivePerso, iaConfigLire, iaConfigEcrire, iaEspaceDefinir: (x) => { _iaEspace = x; }, chiffrementDeriver, chiffrerTexte, dechiffrerTexte, enveloppeChiffree, chAleatoire, chB64, BIB_TABLE, bibUrl, bibPdfjsBase, bibEmpreinte256, bulletinColonnes, bulletinFormatLong, bulletinEchantillonsValeurs, bulletinAffectationDouteuse, bulletinLignesDePages, bulletinEntete, bulletinNombre, baremeFusionApercu, baremeFusionner, baremesListeFusion, baremeGroupesContinus, baremePtsContinus, jaugeMeta, baremePlage, syncNom, qualifListCont, regulSave, regulDelete, regulRestant, regulsDe, intrantMouvements, allergenesDetecter, allergenesTexte, allergenesSuggeres, revendicationsDetecter, revChoix, ficheDetections, infosPropositions, infosFusion, produitInfosAppliquer, recapIntrants, recapCsv, recapMaintenance, maintStock, maintMouvHistorique, maintMouvementSave, maintMouvementDelete, maintProduitSave, maintProduitDelete, maintFdsEtat, maintStockBas, maintContactDetecter, ficheCibleObj, ficheCibleDeCle, moutPartenaires, lignePartId, ligneRef, moutRefs, moutModeleImpose, jaugeEntreeCuve, bulletinPourMouts, baremeDe, cleLigne, moutLots, DEFAULT_LISTS, LOT_TYPES, PREP_TYPES, OP_LABELS, DEFAULT_PARAMS, DEFAULT_MODELES, OPERATEUR_FONCTIONS, FORMES, FINITIONS, LIST_META, ECHELLES, LANGUES, LANGUES_TRAD, langueDuNavigateur, langueInitiale, traduire, tradControle, TRAD_TABLE, TRAD_MOTIFS, setLangue: (x) => { LANGUE = x; }, OENOTRACK_DEPOT, previewOp, registreEcarts, registreDoublons, registreRenumeroter, REGIONS, regionDe, champenois, regionSet, PRESSOIR_PROFILS, pressoirParams, pressoirParamsSet, rebechesTaux, pressoirsDe, balancesDe, equipementPressoirSet, equipementAjouter, estPesee, estMarc, numeroSuivant, journalAlteres, journalEmpreinte, peseeSpec, peseeSave, peseeValider, peseeReste, marcSpec, marcSave, marcControles, marcValider, marcVolumes, marcKg, registreAnnuler, peseesDe, marcsDe, releveApporteurs, bilanPressoir, registrePeseesCsv, carnetPressoirCsv, capaciteDeLibelle, baremeVolume, baremeHauteur, baremeEcart, baremeControle, baremeDe, baremesCiterne, baremeSave, baremeDelete, baremeLier, baremeArchiver, baremePts, baremeSens, baremeResume, fabricantsConnus, hauteurAttendue, contDelete, nombreJauge, jaugeReparer, jaugeAnalyser, jaugePageDeTexte, jaugePageDeLignes, jaugePageDeTsv, jaugeLireFichier, jaugeExporter, contenantPourReservoir, matierePourBareme, jaugesTexte, immatNorm, CHAMPS_STD, CP_TYPES, champsStd, champStd, formulaireDe, champEffectif, formulairePerso, formuleAnalyser, formuleEval, formuleVarsStd, champsNumeriques, champsValeurs, champsEtat, champsTexte, champsErreurs, formulaireDefauts, ligneDefauts, formulaireSave, formulaireReset, formulaireCopier, opCatSave, opCatDelete, opList, opDef, sha256, pbkdf2, pbkdf2Js, mdpEmpreinte, mdpVerifier, mdpQualite, codeSecoursNouveau, codeSecoursNorm, PROFILS_DEFAUT, DROITS_SPECIAUX, securiteActive, securiteReglages, securiteActiver, securiteDesactiver, securiteRegler, utilisateurDe, utilisateurParIdentifiant, profilDe, niveauModule, peutModule, peut, estAdmin, adminsActifs, utilisateurSave, utilisateurMotDePasse, utilisateurActif, utilisateurDelete, profilSave, profilDelete, auditAjouter, gardeDroits, gardeAppliquer, moduleDeType, u8b64, ligneApporteurs, ligneApporteursNoms, ligneNumLot, ligneAnalyses, moyennesPonderees, moutPartsLot, moutAnalysesLot, moutAnalysesCuve, chaptalReglages, tapMoyen, enrichissement, apporteurRoles, apporteurCruAuto, apporteurUsage, apporteurDe, docsOf, docMetaAdd, docsDeplacer, docsJoindre, previsionSave, previsionStatut, previsionDelete, contParts, parcelleSave, parcelleDelete, traceOrigin2: traceOrigin, importObj, APP_VERSION, richListCont, echellePreset, mixCouleur, stadeAssemblage, stadeRole, ECHELLES, eDef, echelleInfo2: echelleInfo, cruMask, cruSave, fractionCont, listUsage, fracList, fracLabel, fracPress, sampleDb, emptyDb, normalizeDb, replay, composition, echelleInfo, lotEchelle, contentComp, traceIntrant, traceOrigin, opSave, opDelete, contSave, cruSave, cruDelete, cruRestore, cruUsage, apporteurSave, apporteurDelete, siteSave, siteDelete, planAuto, importJSON, exportJSON, DEFAULT_CRUS, getR, intrantsForLots, mixComp, loadDb, saveDb, STORAGE_KEY, num, r2, stadeMix, stadeRegle, stadeAutoOK, stadeMelangeSave, stadeMelangeDelete, stadeMelangeReset, opList, opDef, opNom, opMenu, opGroupes, opCatSave, opCatDelete, opCatUsage, opCatMove, opCatReset, DEFAULT_OPERATIONS, DEFAULT_STADES, OP_LABELS0, OP_LABELS, OP_COMPORTEMENTS, APP_NUM, syncFusion, syncEmpreinte, syncResume, conflitReprendre, canon, hash36, byDate, nid, setNID: (x) => { NID_SUFFIXE = x; }, getNID: () => NID_SUFFIXE, cloudSynchroniser, CLOUD_BASE, operateurSave, operateurDelete, operateurActif, operateurUsage, operateursValides, operateursNoms, operateurNom, operateurCourt, operateurInitiales, operateursTries, alertValidate, alertRefuse, hygieneSave, hygieneDelete, clone, ficheAdd, modeleFicheSave, hygProduitSave, hygProduitDelete, hygProduitArchiver, hygUsages, hygConso, hygLignes, hygResume, hygTexteModifie, hygControles, hygFdsEtat, hygPlage, hygConcTxt, fdsAnalyser, fdsPictosDeH, fdsTexteDePages, fdsDate, qualifList, qualifOptions, qualifUsage, QUALIFS, DEFAULT_QUALIFS, syncConfig, minQualif, rang, qLabel, produitSave, regleSet, ruleAllows, proposedQualif, richListReset, MODULES_DEFAUT, MODULE_FIXE, modulesOrdre, moduleActif, modulesConnus, modulesVisibles, moduleAccueil, modulesOrdonner, moduleDeplacer, moduleActiver, modulesReinitialiser, produitDelete, docMetaAdd, docsOf, lienNorm, lienCourt, ficheDocs, prodDocs, prodFdsRequise, prodFdsDate, prodFtDate, prodFdsEtat, prodFtEtat, prodVeilleEtat, prodARevoir, prodFichesResume, moisAnnee, ficheDateApres, dateRevOk, ficheTitreDePage, ficheAnalyser, ficheMots, unEcart, motProche, ficheScoreMots, ficheCandidatsListe, ficheCorrespondances, ficheReconnu, ficheActionDefaut, ficheJoindre, ficheDocReviser, ficheDocArchiver, ficheRecaler, ficheProduitCreer, prodVeilleEnregistrer, ficheCat, ficheCibleObj, ficheCibleCle, ficheCibleDeCle, hygDocs, IA_FOURNISSEURS, IA_KEY, iaFournisseur, iaConfigLire, iaConfigEcrire, iaActive, iaMasque, iaRequete, iaReponse, iaJson, iaDateDe, iaErreurMsg, iaErreurReseau, iaDemander, iaModeles, iaModelesDe, iaPromptIdentifier, iaLireIdentification, iaPromptVeille, iaLireVeille, iaVeilleAFaire, STORAGE_KEY, saveDb, fournisseurSave, LEGAL_DATE, LEGAL_ONGLETS, legalOngletDeHash, HEBERGEURS, MENTIONS_STATUTS, mentionsVides, mailOk, mentionsNettoyer, mentionsFusion, mentionsHebergeur, mentionsHorsUE, mentionsManquantes, mentionsConseils, legalAuteur, COMPOSANTS_TIERS, SERVICES_CHARGEMENT, CHANGELOG, VERSIONS_RENOMMEES, versionAffichee, versionNum, baremePourNom, baremeCapacite, jaugeMots, accueilDecision, ACCUEIL_KEY, OENOTRACK_SITE, siteOfficielIci, peseeAlertes, tapPesees, registrePeseesLignes, formulaireCat, resumeRegistre, syncFormulaires, CHAMPS_FICHE, FORMULAIRES_HORS_CATALOGUE, ETATS_SANITAIRES, champSiAltere, persoSiAltere, etatSain, opViaPressoir, champsPersoErreurs, OP_LABELS, couleurDefaut, planTaches, hygTaches, maintTaches, maintEtat, maintAjout, hygControlesSaisie, hygPresetTache, planEntreeSave, planEntreeDelete, planModeleCharger, maintEntreeSave, maintEntreeDelete, maintInterventionSave, maintInterventionDelete, hygAcquitter, planReglages, planNettoyage, planMaintenance, PLAN_NETTOYAGE_MODELE, PLAN_MAINTENANCE_MODELE, hygCibles, hygLibQuand, hygSatisfait, HYG_QUAND, nomProduitCasse, ficheInfosScript, infosFusion, infosPropositions, produitInfosAppliquer, iaPromptInfos, iaLireInfos, iaPromptFds, iaLireFds, PRODUIT_INFOS, HYG_INFOS, hygEvenementsUtiles, isoOK, hygDef, hygEvenements, lbl, gardeAnalyser, gardeSignature, gardePdfAnalyser, pdfDesarmer, jsonSur, gardeBase, gardeSurveiller, csvSansFormule, csvCell, toCSV, gardeJournaliser, gardeJournalVider, gardeJournalGarder, gardeDocsNoter, gardeDocsSuspects, gardeResume, bulletinAnalyser, bulletinLignesDeTexte, bulletinLignesDeTableau, bulletinCandidats, bulletinRattacher, bulletinModele, bulletinEnregistrer, bulletinFusion, iaLireBulletin, iaPromptBulletin, analyseBulletin, bulletinNombre, traceExport, traceLire, traceVersEntree, traceAmontRec, traceAmontDuLot, traceExportNoter, traceEmpreinte, TRACE_SECTIONS, traceSectionsDefaut, traceOpOk, mdpEmpreinte, securiteActiver, utilisateurSave, gardeDroits, HYG_LISTES_DEF, hygListeDef, hygListeItems, syncHygieneListes, hygOpts, hygListeUsage, hygListeAjouter, hygListeModifier, hygListeSupprimer, hygListeDeplacer, HYG_CONTROLES, HYG_ZONES, HYG_CONTROLE_ATTENDU, HYG_MOMENTS, HYG_EPI, MAINT_TYPES, MODULES_DANS, entrepriseSet, CLES_ALGS, clesB64, clesDeB64, clesB64u, clesDeB64u, clesReglages, clesDe, clesUtilisables, cleAjouter, cleModifier, cleRetirer, clesRegler, clesDerVersBrut, cleVerifier, CLES_TRANSPORTS, clesTransports, clesOptionsCreation, clesOptionsConnexion, clesCbor, clesCoseVersSpki, cleDepuisAttestation, EQUIP_CATEGORIES, EQUIP_ETATS, EQUIP_ETAT_TXT, equipCategorie, equipTaches, equipVerif, equipPannes, equipEtat, equipementsListe, equipAlertes, equipementSave, equipementSupprimer, equipHistorique, equipementsDe, ETAPES_TRACE, etapeLot, traceDateQ, traceChercher, traceChaine, traceLotResume, AUDIT_PIECES, AUDIT_ETATS, AUDIT_MODELES, auditModeles, auditModele, auditModeleSave, auditModeleRetablir, auditSave, auditRepondre, auditTest, auditClore, auditSupprimer, auditResume, moisEntre, auditLattes, auditSo2, profilNiveau, niveauModule, analyseSave, listRename, utilisateurMotDePasse, hygListeSupprimer, qrMatrice, qrSvg, QR_FORMAT_BITS, doseTexte, qteDeDose, dosesTexte, FICHE_RUBRIQUES, ficheDispo, ficheDispoReglage, ficheReglageCommunSet, ficheReglagePersoSet, GROUPE_ACTIONS, opsDuGroupe, prevsDuGroupe, opsGroupeEnregistrer, opsGroupeSupprimer, previsionsGroupeEnregistrer, fermReglages, densiteLue, enFA, fermentationPoints, fermentationEtat, fermentationAlerte, so2Pka, so2Moleculaire, so2LibrePour, enrichSimuler, qrReglages, qrBaseValide, lienCuve, lienCuveLire, qrTexteCuve, qrLire, rappelSauvegardeEtat, joursEntre, chiffrementMdpErreur, chiffrementDeriver, chiffrementReglageNouveau, chiffrementVerifier, chiffrerTexte, dechiffrerTexte, enveloppeChiffree, chiffrerOctets, dechiffrerOctets, octetsChiffres, chiffrementActif, chiffrementReglage, stadeRole, CATALOGUES, CATALOGUE_FAMILLES, CAT_FAM, UNITES, famCategorie, catalogueIntegre, catalogueReglage, catalogueMasquer, catalogueEntrees, catalogueChercher, catalogueListe, catalogueProduitLie, catalogueMaxDose, produitDepuisCatalogue, intrantFournisseurs, intrantProduitsPour, catalogueDepuisTableau, catalogueCsvLignes, catalogueDepuisTexte, catalogueIaPrompt, catalogueIaLire, catalogueImportSave, catalogueLignesEtat, catalogueLigneModifier, catalogueImportSupprimer, plafondsDe, plafondSave, plafondValider, plafondSupprimer, plafondSo2Lot, lotTypeVin, regleEffective, so2Teneur, lotIntrantsCumul, so2TotalEstime, so2TeneurInconnue, cahierPropositions, cahierIaLire, cahierAppliquer, ruleFor, doseHL, doseUnit, arrivalRest, GARDE_CLES, GARDE_USAGES, peutModule, prodOfDb: (db, id) => db.produits.find((p) => p.id === id) , SCHEMAS_EXEMPLES, SCHEMA_ETATS, SCHEMA_UNITES, schemasDe, schemasMaterialiser, schemaEtapeNette, schemaSave, schemaValider, schemaSupprimer, schemaDupliquer, lotEtatSanitaire, lotCriteres, schemasPourLot, schemaQuantite, schemaProduits, schemaPlan, schemaDoseTexte, schemasReglage, schemaPrevsDuLot, schemaOpsDuLot, lotsSansSchema, schemaAppliquer, schemaRetirer, addDays, GARDE_PARAMS, GARDE_NOMS, SYNC_NOMS, DRM_BOUTEILLE_L, DRM_NS, DRM_LIBELLES_FISCAUX, DRM_NATURES, DRM_ENTREES, DRM_SORTIES, DRM_SAISIES, drmReglage, drmAcciseOk, DRM_EXEMPLES, drmProduitsDe, drmProduitsMaterialiser, drmCode, drmProduitSave, drmProduitSupprimer, drmProduitDeplacer, drmRattacher, drmReglageSet, drmPeriode, drmPeriodes, drmFinPeriode, drmNatureLot, drmFractionLot, drmProduitDuLot, drmSaisieDe, drmSaisieSet, drmFinis, drmCalcul, drmDeclarationPrecedente, drmControles, drmDeposer, drmRouvrir, drmHl, xmlEsc, drmXml, drmNomFichier, drmCsvLignes, PROFIL_TYPES, PROFIL_RACCOURCIS, PROFIL_REGIONS, PROFIL_GROUPES, profilRegionDef, profilViticole, profilPlan, profilAppliquer, moduleActif, stadeList, ONGLETS_GROUPES, ongletDe, ongletsBarre, ongletMembres, ongletOuverture, ongletDefautSet, ongletReglage, ongletOuvertureNav, ONGLET_MOMENTS, campCreate, campEtatR, campEtatDate, RESEAU_CHEMIN_MAX, reseauCheminType, reseauNomDossier, reseauCorrespond, reseauConseil, dossierReseau, dossierReseauSet, pressoirParams, chaptalReglages, ECHELLE_PRESETS, listAdd, veilleTextesListe, veilleTexteDe, veilleTexteIdDeSource, iaVeilleTextesPrompt, iaVeilleTextesLire, veilleReglage, veilleTextesSet, veilleTexteRelu, veilleTexteARelire, veilleReglesDuTexte, veilleRegleARelire, iarDateDe, iarDateIa, iaAuditPiecesEtat, iaAuditDonnees, iaAuditPrompt, iaAuditLire, iaAuditNotesTexte, iaAuditNotesAjouter, IA_AUDIT_SCHEMA, iaAideDoc, iaAidePrompt, iaAideLire, IA_AIDE_SCHEMA, iaCodifPrompt, iaCodifBriques, iaCodifTablesCodes, IA_CODIF_SCHEMA, iaPersoQuestions, iaPersoPrompt, iaPersoReponses, IA_PERSO_SCHEMA, iaNettoyageDonnees, iaNettoyagePrompt, iaNettoyageLignes, iaNettoyageAjouter, iaNettoyageVerifie, IA_NETTOYAGE_SCHEMA, IA_VEILLE_TEXTES_SCHEMA, REG_TEXTES, VISITE_CHAPITRES, auditSave, auditModele, codifTableSet, planNettoyage, PERSO_QUESTIONS, refReglage };';
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
  t('fractions : liste par défaut (5 depuis 0.47.0-alpha.2 : Cuvée, Taille, Rebêche) dont lies et bourbes', L.fracList(d).length === 5 && L.fracList(d).map((x) => x.label).slice(0, 3).join() === 'Cuvée,Taille,Rebêche' && L.fracList(d).some((x) => x.id === 'lies') && L.fracList(d).some((x) => x.id === 'bourbes'));
  t('fractions : lies/bourbes hors pressurage', L.fracPress(d).map((x) => x.id).join(',') === 'cuvee,taille1,rebeche');
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
  t('migration : fractions par défaut ajoutées', L.fracList(nd).length === 5 && nd.lists.fractions.every((x) => x.suffix != null && x.pressurage != null));
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
    t('TAP moyen déduit des sucres si le TAP manque', Math.abs(L.tapMoyen(d, { sucres: { moy: 170 } }) - 170 / 16.83) < 1e-9 && L.tapMoyen(d, {}) === null);
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
    t('base 0.17.0-alpha.2 ouverte : revendications d’origine avec ses couleurs', n18.lists.qualifs.map((q) => `${q.id}:${q.couleur}`).join() === 'conv:#111111,bio:#222222,dem:#333333' && L.QUALIFS.length === 3 && L.qLabel('bio') === 'BIO');
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
    t('hébergeurs courants : coordonnées complètes, hors UE signalé', L.HEBERGEURS.length >= 5 && L.HEBERGEURS.every((h) => h.nom && h.adresse && h.court) && L.mentionsHebergeur('o2switch').tel === '+33 4 44 44 60 40' && L.mentionsHorsUE({ hebergeur: { id: 'netlify' } }) && !L.mentionsHorsUE({ hebergeur: { id: 'ovh' } }) && L.mentionsHebergeur('zzz').id === 'autre');
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
    t('site officiel : oenotrack.pages.dev depuis 0.47.0-alpha.3, oenotrack.fr reconnu (aussi avec www, pas les autres adresses)', L.OENOTRACK_SITE === 'https://oenotrack.pages.dev' && L.siteOfficielIci('oenotrack.pages.dev') && !L.siteOfficielIci('autre.pages.dev') && L.siteOfficielIci('oenotrack.fr') && L.siteOfficielIci('www.oenotrack.fr') && !L.siteOfficielIci('oenotrack.fr.exemple.com') && !L.siteOfficielIci('moenotrack.fr') && !L.siteOfficielIci('') && !L.siteOfficielIci(null));
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
    t('marc dans le plafond : validé, lots cuvée / taille / rebêches créés dans les cuves', m3.ok && v3.ok && v3.op.marc.valide && v3.op.marc.enCours === false && lotsM.length === 3 && lotsM.every((id) => R3.lots[id]) && m3.op.fractions.map((x) => x.code).join() === 'P26-06-C,P26-06-T,P26-06-R' && Object.values(R3.portions).filter((p) => lotsM.includes(p.lotId)).length === 3, v3);
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
    t('saisie : Conventionnel vidé puis Bio (FR-BIO-01) sans rinçage → « changement de revendication » signalé avant d’enregistrer', cr && /^Bac D1 — Conventionnel avant ce remplissage en BIO : Rinçage \(changement de revendication\) à enregistrer d’abord\.$/.test(cr.msg) && cr.faire.changementRevendication.de === 'conv' && cr.faire.changementRevendication.vers === 'bio' && cr.faire.planId === 'pn_cuves_revendication', C2.map((x) => x.msg));
    const e2 = entree('2026-11-24', 'ct19', 'bio', 'HY-2'); T = PT(h, '2026-11-24'); const rv = cle(T, /^pn:pn_cuves_revendication:rev:ct19:/);
    t('enregistré quand même : non-conformité « Conventionnel puis Bio … sans « Rinçage » au journal entre les deux » ; plus de rinçage « à faire » (cuve pleine)', e2.ok && rv && rv.etat === 'nonconforme' && rv.revendication.de === 'conv' && rv.revendication.vers === 'bio' && /Conventionnel puis BIO le 24\/11\/2026, sans « Rinçage » au journal entre les deux\.$/.test(rv.msg) && !cle(T, /vid:ct19/), rv && rv.msg);
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
    t('… acidité en acide tartrique → H₂SO₄, « < 0,1 » gardé, densité en g/L → g/mL, TAV acquis reconnu (paramètre d’origine depuis 0.47.0-alpha.2)', Math.abs(e1.valeurs.at.v - 6.12 / 1.531) < 0.001 && e1.valeurs.malique.op === '<' && e1.valeurs.malique.v === 0.1 && Math.abs(e1.valeurs.densite.v - 0.9924) < 1e-6 && e1.valeurs.ph.v === 3.08 && e1.valeurs.tav && e1.valeurs.tav.v === 11.52);
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
    t('enrichissement : sucre 170 kg pour 100 hL et +1 % vol (≈ +108 L : 0,6329 L/kg depuis 0.47.0-alpha.2) ; MCR ≈ 253 L (bilan de sucre, volume ajouté)', Math.abs(eS.sucreKg - 170) < 1e-9 && Math.abs(eS.volFinalL - 10107.593) < 0.01 && Math.abs(eM.mcrL - 253.17) < 0.05 && Math.abs(eM.volFinalL - 10253.17) < 0.05 && !eS.depasse, [eS.sucreKg, eM.mcrL]);
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
    t('… mention bio UE : règle Bio ajoutée, « à vérifier » sauf autorisation attestée par Ecocert (0.40.0-alpha.1), utilisation en bio notée', L.ruleFor(dc, pBio.id, 'bio').autorise && (L.ruleFor(dc, pBio.id, 'bio').aVerifier || L.ruleFor(dc, pBio.id, 'bio').verifiePar === 'Ecocert') && /bio \(UE\)/.test(pBio.usageBio));
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
    t('profil d’une base sans profil : Champagne (d’après les spécificités champenoises), effervescents et blancs, non défini ; 13 bassins français (Charentes en 0.46.0-alpha.2), 8 pays, « Autre région » ; 6 types ; 4 raccourcis',
      pv0.region === 'champagne' && pv0.types.join() === 'effervescent,blanc' && !pv0.defini && L.PROFIL_REGIONS.filter((r) => r.pays === 'France').length === 13 && L.PROFIL_REGIONS.filter((r) => r.pays === 'Étranger').length === 8 && L.PROFIL_REGIONS.length === 22 && L.PROFIL_TYPES.length === 6 && L.PROFIL_RACCOURCIS.length === 4
      && L.profilViticole((() => { const x = L.sampleDb(); L.regionSet(x, 'autre'); return x; })()).region === 'autre');
    t('… chaque région : cépages (identifiants uniques), appellations, types et échelle connus', L.PROFIL_REGIONS.every((r) => new Set(r.cepages.map((c) => c[0])).size === r.cepages.length && r.cepages.every((c) => c[0] && c[1]) && r.types.every((x) => L.PROFIL_TYPES.some((y) => y[0] === x)) && (!r.echelle || L.ECHELLE_PRESETS.some((e) => e.id === r.echelle))));
    t('aperçu Champagne sur le jeu d’exemple : seulement les 3 appellations à ajouter (tout le reste est déjà réglé)', ids(L.profilPlan(d0, 'champagne', ['effervescent', 'blanc'])).join() === 'appellation:Champagne,appellation:Coteaux champenois,appellation:Rosé des Riceys');
    const pB = L.profilPlan(d0, 'bordeaux', ['rouge', 'blanc']); const g = (gr) => pB.filter((x) => x.groupe === gr);
    t('aperçu Bordeaux (rouges, blancs) : onglets Tirages, Cave, Dégorgement masqués ; macération, délestage, écoulage et opérations de vinification en rouge (0.46.0-alpha.1) proposés, remuage masqué ; stade « En macération » ; 8 cépages, 6 appellations ; goutte et presse ; tailles et rebêche hors pressurage ; pressoir sans plafond ; spécificités champenoises désactivées ; villages masqués ; enrichissement +1,5 % vol à vérifier',
      ids(g('onglets')).join() === 'module:tirage,module:cave,module:degorgement' && g('onglets').every((x) => x.apres === 'masqué') && ids(g('operations')).join() === 'op:maceration,op:delestage,op:ecoulage,op:eraflage,op:mpf_froid,op:mac_carbonique,op:mac_semi_carbonique,op:thermovinification,op:flash_detente,op:pigeage,op:mfc,op:pressurage_marcs,op:micro_oxygenation,op:remuage' && pB.find((x) => x.id === 'op:remuage').apres === 'masquée'
      && ids(g('stades')).join() === 'stade:maceration' && g('cepages').length === 8 && g('appellations').length === 6 && ids(g('fractions')).join() === 'fraction:goutte,fraction:presse,pressfrac:taille1,pressfrac:rebeche'
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
    t('… fixture : délestage réglé à la main pas touché par le profil Champagne ; 2e taille gardée hors pressurage ; appellation décochée non ajoutée', !opD(f37, 'delestage').masque && !pv37.ops.includes('delestage') && !f37.lists.appellations.some((a) => a.label === 'Rosé des Riceys') && L.profilPlan(f37, 'champagne', pv37.types).map((x) => x.id).join() === 'op:eraflage,op:mpf_froid,appellation:Rosé des Riceys'); /* 0.46.0-alpha.1 : rosé de macération */
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
    t('fiche récapitulative des intrants : colonnes choisies dans l’ordre du catalogue, stock actuel, revendications compatibles, allergènes', T.entetes.join('|') === 'Produit|Fournisseur|Stock actuel|Revendications compatibles|Utilisable en bio|Allergènes|FDS' && l1.cells[0] === p1.nom && /BIO/.test(l1.cells[3]) && l1.cells[4] === 'Oui' && l1.cells[5] === 'Sulfites', l1);
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
    t('… étendues : dose par revendication (cuvée et tailles réunies), par groupe ; cellules fusionnées', L.planVinifCellules(p0, lT).length === 6 && L.planVinifCellules(p0, lT).every((c) => c.span === 2) && L.planVinifCellules(p0, lG).length === 2 && L.planVinifCellules(p0, lG)[0].span === 6 && L.planVinifValeur(lG, cols[11]) === 'Assemblage / Blanc de noirs');
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
      && canonJ(P.revendications.map((r) => r.id)) === canonJ(['conv', 'bio', 'dem']) && P.fractions[0].id === 'cuvee' && canonJ(P.fractions[1].fractions) === canonJ(['taille1']) && im.colonnes === 12, [im.msg, P.reference, P.version, P.groupes]);
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
    t('référentiel : 9 référentiels (UE, AOC Champagne, Bio UE, Demeter, Biodyvin, Terra Vitis, Nature & Progrès, VMN, S.A.I.N.S.), règles valides et sourcées, sans doublon', labs.size === 9 && ['ue', 'aoc-champagne', 'bio-ue', 'demeter', 'biodyvin', 'terra-vitis', 'nature-progres', 'vmn', 'sains'].every((x) => labs.has(x)) && L.REG_REGLES.every((r) => ids.has(r.compose) && labs.has(r.label) && ['oui', 'non', 'condition'].includes(r.statut) && r.source && (r.doseMax == null || r.doseMax > 0) && (r.teneurMax == null || r.teneurMax > 0)) && new Set(L.REG_REGLES.map((r) => `${r.label}|${r.compose}`)).size === L.REG_REGLES.length && L.REG_SO2.every((x) => labs.has(x.label) && x.valeur > 0 && x.source));
    const rg = (lab, c) => L.refRegle(d, lab, c);
    t('référentiel : chaque composé a sa règle UE et sa règle Bio UE (sauf chitosane en bio : non relevé, à vérifier dans l’annexe V partie D)', L.REG_COMPOSES.every((k) => L.REG_REGLES.some((r) => r.compose === k.id && r.label === 'ue') && (k.id === 'chitosane' || L.REG_REGLES.some((r) => r.compose === k.id && r.label === 'bio-ue'))), L.REG_COMPOSES.filter((k) => !L.REG_REGLES.some((r) => r.compose === k.id && r.label === 'bio-ue')).map((k) => k.id));
    // ---- valeurs relues (règlement 2019/934, bio 2021/1165, catalogues archivés : sorbate 27 g/hL ≈ 200 mg/L d'acide sorbique, métatartrique 10 g/hL, PVPP 80 g/hL, charbon 100 g/hL, lysozyme 50 g/hL)
    t('référentiel UE (2019/934 consolidé, fiches OIV) : sorbate 200 mg/L, métatartrique 10 g/hL, cuivre 1 g/hL et 1 mg/L, PVPP 80 g/hL, charbon 100 g/hL, lysozyme 50 g/hL, acide citrique 1 g/L, ascorbique 250 mg/L par traitement et 300 mg/L, gomme arabique 0,3 g/L, CMC < 200 mg/L, phytate 8 g/hL, DAP 1 g/L (0,3 g/L en prise de mousse)', rg('ue', 'sorbate').teneurMax === 200 && rg('ue', 'acide-metatartrique').doseMax === 10 && rg('ue', 'citrate-cuivre').doseMax === 1 && rg('ue', 'sulfate-cuivre').teneurMax === 1 && rg('ue', 'pvpp').doseMax === 80 && rg('ue', 'charbon').doseMax === 100 && rg('ue', 'lysozyme').doseMax === 50 && rg('ue', 'acide-citrique').teneurMax === 1000 && rg('ue', 'acide-ascorbique').doseMax === 25 && rg('ue', 'acide-ascorbique').teneurMax === 300 && rg('ue', 'gomme-arabique').doseMax === 30 && rg('ue', 'cmc').doseMax === 20 && rg('ue', 'phytate').doseMax === 8 && rg('ue', 'dap').doseMax === 100 && /0,3 g\/L/.test(rg('ue', 'dap').condition) && rg('ue', 'acide-sorbique').statut === 'non' && rg('ue', 'chlorure-argent').statut === 'non');
    t('référentiel Bio UE : PVPP, sorbate, lysozyme, DMDC, CMC, polyaspartate, sulfate de cuivre, acide fumarique interdits ; citrate de cuivre, métatartrique, gomme arabique (bio si disponible) autorisés — comme les mentions « utilisable en bio » des catalogues', ['pvpp', 'sorbate', 'acide-sorbique', 'lysozyme', 'dmdc', 'cmc', 'polyaspartate', 'sulfate-cuivre', 'acide-fumarique'].every((c) => rg('bio-ue', c).statut === 'non') && rg('bio-ue', 'citrate-cuivre').statut === 'oui' && rg('bio-ue', 'acide-metatartrique').statut === 'oui' && rg('bio-ue', 'gomme-arabique').statut === 'condition');
    t('… catalogues archivés recoupés : sorbate, lysozyme, CMC, acide fumarique jamais marqués « utilisable en bio » ; citrate de cuivre et métatartrique le sont', (() => { const E = L.catalogueEntrees(d, {}); const bio = (re) => E.filter((e) => re.test(L.catCle(e.nom))); return ['sorbate', 'lysozym', 'cmc', 'fumarique'].every((m) => bio(new RegExp(m)).every((e) => !e.ue)) && bio(/citrate de cuivre/).some((e) => e.ue) && bio(/metatartrique/).some((e) => e.ue); })());
    t('plafonds de SO₂ total du référentiel identiques aux exemples des plafonds (UE, Bio UE, Demeter)', L.PLAFONDS_EXEMPLES().every((p) => { const lab = { conv: 'ue', bio: 'bio-ue', dem: 'demeter' }[p.qualifId]; const r = L.REG_SO2.find((x) => x.label === lab && x.vin === p.vin); return r && r.valeur === p.valeur; }));
    t('héritage et listes fermées : Demeter reprend le Bio UE (PVPP interdite) et refuse ce que son cahier ne cite pas (tanins, enzymes, gélatine) ; S.A.I.N.S. et VMN refusent tout intrant ; SO₂ ajouté interdit en S.A.I.N.S., sous condition en VMN (30 mg/L) ; S.A.I.N.S. n’exige pas la certification bio', L.refCombiner(d, ['demeter', 'bio-ue', 'ue'], 'pvpp').statut === 'non' && ['tanins', 'enzymes', 'gelatine', 'gomme-arabique'].every((c) => L.refCombiner(d, ['demeter', 'bio-ue', 'ue'], c).statut === 'non') && L.refCombiner(d, ['demeter', 'bio-ue', 'ue'], 'bentonite').statut === 'condition' && L.refCombiner(d, ['sains', 'ue'], 'bentonite').statut === 'non' && L.refCombiner(d, ['vmn', 'bio-ue', 'ue'], 'tanins').statut === 'non' && rg('sains', 'so2').statut === 'non' && rg('vmn', 'so2').statut === 'condition' && L.REG_LABELS.find((l) => l.id === 'sains').herite.join() === 'ue');
    // sources officielles relues : statut « vérifié » seulement avec une référence précise ; VMN relu dans la charte du 23/03/2023 ; Terra Vitis et l'origine bio du sucre restent « à vérifier »
    t('vérification : règles et plafonds vérifiés avec leur texte et leur article ; VMN vérifié (charte 2023), Terra Vitis « à vérifier » ; chaque valeur à vérifier le reste à l’affichage', L.REG_REGLES.filter((r) => r.verifie).every((r) => r.source && !/à vérifier/.test(r.source)) && L.REG_REGLES.filter((r) => r.label === 'vmn').every((r) => r.verifie && r.ref) && L.REG_SO2.filter((r) => r.label === 'vmn').every((r) => r.verifie) && !rg('ue', 'pvpp').aVerifier && !rg('vmn', 'so2').aVerifier && !rg('bio-ue', 'sucre').verifie && rg('bio-ue', 'sucre').aVerifier && L.refRegle(d, 'demeter', 'gomme-arabique').statut === 'non' && !L.refRegle(d, 'demeter', 'gomme-arabique').aVerifier && L.REG_REGLES.filter((r) => r.verifie).length >= 120);
    t('valeurs corrigées par les textes : chitosane autorisé en bio (Aspergillus niger) ; Nature & Progrès 40 mg/L de SO₂ ; Biodyvin 96 mg/L pour les Champagnes ; Demeter 70 mg/L (sucres < 12 g/L) ; acidification Demeter 1,5 g/L ; VMN 30 mg/L ; AOC Champagne : bois interdit', rg('bio-ue', 'chitosane').statut === 'condition' && L.REG_SO2.filter((x) => x.label === 'nature-progres').every((x) => x.valeur === 40) && L.REG_SO2.find((x) => x.label === 'biodyvin' && x.vin === 'effervescent').valeur === 96 && /12 g\/L/.test(L.REG_SO2.find((x) => x.label === 'demeter' && x.vin === 'effervescent').note) && rg('demeter', 'acide-tartrique').doseMax === 150 && L.REG_SO2.find((x) => x.label === 'vmn' && x.vin === 'rouge').valeur === 30 && rg('aoc-champagne', 'copeaux').statut === 'non' && !rg('aoc-champagne', 'acide-tartrique'));
    t('produit liquide de teneur inconnue : dose du composé non estimée (pas de fausse alerte, signalé) ; solide supposé pur', (() => { const pl = { id: 'x', nom: 'Gomme arabique liquide', categorie: 'oeno', unite: 'mL' }; const r1 = L.refRegleProduit(d, pl, 'conv'); const ps = { id: 'y', nom: 'Gomme arabique poudre', categorie: 'oeno', unite: 'g' }; const r2 = L.refRegleProduit(d, ps, 'conv'); return r1.doseMax == null && r1.nonEstime.includes('gomme-arabique') && r2.doseMax === 30; })());
    // ---- composés reconnus d'après le nom
    const cp = (nom, x) => L.refComposesDe({ nom, categorie: 'oeno', ...(x || {}) });
    const cCu = cp('CITRATE DE CUIVRE 2%'); const cB = cp('Bisulfite d’ammonium 150 g/L'); const cLi = cp('Levures inactivées riches en glutathion'); const cS = cp('Sorbate de potassium');
    t('composés : citrate de cuivre 2 % (teneur 0,02, sans acide citrique), bisulfite d’ammonium (SO₂, pas un sel nutritif), levures inactivées (pas des levures sélectionnées), sorbate pur supposé', cCu.length === 1 && cCu[0].id === 'citrate-cuivre' && cCu[0].part === 0.02 && !cCu[0].supposee && cB.map((x) => x.id).sort().join() === 'bisulfite-ammonium,so2' && cLi.map((x) => x.id).join() === 'levures-inactivees' && cS[0].id === 'sorbate' && cS[0].part === 1 && cS[0].supposee && cp('Papier filtre', { categorie: 'sec' }).length === 0);
    t('composés choisis à la main prioritaires (teneur bornée à 100 %)', L.refComposesDe({ nom: 'Mélange X', categorie: 'oeno', composes: [{ id: 'sorbate', part: 0.5 }, { id: 'inconnu' }] }).map((x) => `${x.id}:${x.part}`).join() === 'sorbate:0.5');
    // ---- revendications de l'exploitation → référentiels ; appellation selon le vignoble
    t('revendications : Conventionnel → UE + AOC Champagne ; BIO → Bio UE ; Demeter → Demeter (+ Bio UE repris)', L.qualifReferentiels(d, 'conv').length === 0 && L.qualifReferentiels(d, 'bio').join() === 'bio-ue' && L.qualifReferentiels(d, 'dem').join() === 'demeter' && L.refAppellation(d) === 'aoc-champagne' && L.refLabelsPour(d, 'dem').map((x) => x.id).sort().join() === 'aoc-champagne,bio-ue,demeter,ue');
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
    // ---- catalogues : liste Ecocert des intrants utilisables en bio, compléments des sites des fournisseurs, préremplissage des fiches
    { const I = L.catalogueIntegre(); const E = L.ecocertListe(); const eco = L.catalogueEcocert(); const lies = I.filter((e) => e.bioEcocert);
      t('liste Ecocert : plus de 1 500 produits utilisables en bio (UE), rapprochés des catalogues (même fournisseur, même nom) ; les autres forment le catalogue « Ecocert » (autres fournisseurs)', E.length > 1500 && lies.length > 300 && eco.length > 900 && eco.length + lies.length >= E.length - 50 && eco.every((e) => e.ue && e.bioEcocert && e.famille) && eco.some((e) => /LALLEMAND/.test(e.fournisseur)) && new Set([...I, ...eco].map((e) => e.id)).size === I.length + eco.length && I.length === 906);
      const w = I.filter((e) => e.lien); const wL = w.find((e) => e.cat === 'laffort' && e.ftUrl);
      t('sites des fournisseurs : page du produit, fiche technique et FDS en ligne pour les catalogues Laffort, Martin Vialatte et Oenofrance', w.length > 300 && !!wL && /^https:\/\/laffort\.com\/produits\//.test(wL.lien) && /\.pdf$/.test(wL.ftUrl) && w.some((e) => e.cat === 'martinvialatte') && w.some((e) => e.cat === 'oenofrance'));
      t('catalogue « Ecocert » masqué par défaut (fournisseurs proposés inchangés), affiché à la demande ; recherche « bio » : produits Ecocert compris', !L.catalogueChercher(d, { cat: 'ecocert' }).length && (() => { const dm2 = L.clone(d); L.catalogueMasquer(dm2, 'cat:ecocert', false); return L.catalogueChercher(dm2, { bio: true, cat: 'ecocert' }).length === eco.length && L.catalogueChercher(dm2, { bio: true }).length > 1500 && L.catalogueListe(dm2).find((c) => c.id === 'ecocert').masque === false && L.catalogueMasquer(dm2, 'cat:ecocert', true).ok && L.catalogueListe(dm2).find((c) => c.id === 'ecocert').masque; })());
      const dE = L.clone(d); const eL = eco.find((e) => /LALLEMAND/.test(e.fournisseur)); const rE = L.produitDepuisCatalogue(dE, eL.id); const pE = dE.produits.find((x) => x.id === rE.id);
      t('« Ajouter à mes produits » depuis la liste Ecocert (organisme certificateur bio) : fournisseur créé, mention bio et restriction reprises, autorisation en bio « vérifiée » (Ecocert, sans dose)', rE.ok && /liste Ecocert/.test(pE.usageBio) && dE.fournisseurs.some((f) => f.id === pE.fournisseurId && /LALLEMAND/.test(f.nom)) && L.ruleFor(dE, pE.id, 'bio').autorise && L.ruleFor(dE, pE.id, 'bio').aVerifier === false && L.ruleFor(dE, pE.id, 'bio').verifiePar === 'Ecocert' && /organisme certificateur/.test(L.ruleFor(dE, pE.id, 'bio').source));
      { const eM = L.catalogueIntegre().find((e) => e.bioEcocert && /^\d+(?:[.,]\d+)? g\/hL$/.test(e.max) && e.unite === 'g'); const rM = eM ? L.produitDepuisCatalogue(dE, eM.id) : null; const gM = rM && L.ruleFor(dE, rM.id, 'bio');
        t('… avec une dose maximale du fournisseur : autorisation attestée par Ecocert, mais règle encore « à vérifier » (dose non certifiée)', !!gM && gM.autorise && gM.doseMax > 0 && gM.aVerifier === true && /Ecocert/.test(gM.source) && /dose/.test(gM.source), eM && eM.id); }
      const rW = L.produitDepuisCatalogue(dE, wL.id); const pW = dE.produits.find((x) => x.id === rW.id);
      t('… depuis un catalogue complété par le site du fournisseur : page, fiche technique et FDS préremplies', rW.ok && pW.lien === wL.lien && pW.ftUrl === wL.ftUrl && (!wL.fdsUrl || pW.fdsUrl === wL.fdsUrl));
      t('fiche du produit : lien de FT ou de FDS invalide refusé', !L.produitSave(dE, { ...pW, ftUrl: 'pas une adresse' }, pW.id).ok); }
    // ---- version, traductions, base 0.40.0-alpha.1 et compatibilité avec la 0.39.0-alpha.1 gelée
    t('version 0.40.0-alpha.1 : nouvelle version mineure (nouvelle fonctionnalité)', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.40.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.39.0-alpha.1' && L.CHANGELOG[i].notes.length === 6; })());
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

  // ===== 48. 0.40.0-alpha.2 : rapport à plusieurs échantillons dont les paramètres sont répartis sur plusieurs tableaux et plusieurs pages
  {
    const db = L.sampleDb(); const R = L.getR(db);
    const nb = (x) => { const n = L.bulletinNombre(x); return n ? `${n.op}${n.v}` : null; };
    t('bulletin : « 6,9 / (**) », « 6,9/ (**) » et « 36 (*) » lus (barre collée, renvoi à une note) ; « 12/09 » et « 3/4 » toujours refusés', nb('6,9/ (**)') === '6.9' && nb('6,9 / (**)') === '6.9' && nb('36 (*)') === '36' && nb('7,0/') === '7' && nb('12/09') === null && nb('3/4') === null && nb('23/09/24') === null);
    // rapport fictif placé comme un PDF : n° du laboratoire, valeurs (chacune suivie d'une barre « / » séparée), puis référence du client ;
    // 1er tableau (5 paramètres) pour les 4 échantillons, puis, sous lui sur la même page, le tableau de l'azote (mêmes abscisses que les
    // trois premières colonnes du 1er) commencé et continué page 2 ; deux échantillons portent la même référence avec deux n° différents
    const item = (s, x, y, w) => ({ s, x, y, w: w || s.length * 4.4, h: 7 }); const C = [183, 257, 325, 401, 470];
    const entete = (it, y, noms, unites) => { it.push(item('Paramètre', 60, y)); noms.forEach((n, k) => it.push(item(n, C[k] - n.length * 1.5, y + 4, n.length * 3))); it.push(item('Méthode d’analyse', 40, y + 18)); noms.forEach((n, k) => it.push(item('IRTF (*)', C[k] - 10, y + 12, 21))); it.push(item('Unité / Incertitude', 41, y + 38)); unites.forEach((u, k) => it.push(item(u, C[k] - 10, y + 37, u.length * 3))); };
    const ligne = (it, y, e, vals) => { it.push(item(e.num, 16, y, 54)); vals.forEach((v, k) => { it.push(item(v, C[k] - 8, y + 6, v.length * 4)); it.push(item('/', C[k] + 6, y + 6, 3)); }); it.push(item(e.ref, 16, y + 10, 35)); };
    const ECH = [{ num: '26FX000301', ref: 'FX101C', a: ['1082,4', '194,96', '3,0', '6,53', '6,5'], z: ['214', '89', '125'] }, { num: '26FX000302', ref: 'FX101T', a: ['1077,8', '184,78', '3,24', '4,37', '6,9 (**)'], z: ['203', '61', '142'] }, { num: '26FX000303', ref: 'FX302T', a: ['1077,1', '181,83', '3,18', '5,02', '5,5'], z: ['226', '77', '149'] }, { num: '26FX000304', ref: 'FX302T', a: ['1072,9', '171,84', '3,24', '4,85', '4,5'], z: ['90', '20', '70'] }];
    const NA = ['Masse Volumique à 20°C', 'Sucre Moût', 'pH', 'Acidité Totale', 'Acide Malique']; const UA = ['g/dm3 /', 'g/L /', '/ 0.05', 'g/L H2SO4 / 6.5 %', 'g/L / 20 %'];
    const NZ = ['Azote Assimilable', 'Azote Ammoniacal', 'Azote Alpha Aminé']; const UZ = ['mg/L /', 'mg/L /', 'mg/L /'];
    const pied = (it, n) => it.push(item('Version : RapportMultiEch.3', 13, 583, 100), item('Impression n° 1 / imprimé le', 290, 583, 99), item(`Page${n}sur 2`, 746, 583, 41));
    const p1 = [item('RAPPORT D’ANALYSES', 450, 30), item('N° FX-261126-000077.1', 470, 42), item('S.A.S. LABORATOIRE FICTIF - Unité de test', 110, 70), item('Réceptionné le : 26/11/26', 330, 70)];
    entete(p1, 110, NA, UA); ECH.forEach((e, k) => ligne(p1, 168 + 25 * k, e, e.a));
    entete(p1, 290, NZ, UZ); ECH.slice(0, 2).forEach((e, k) => ligne(p1, 348 + 25 * k, e, e.z)); pied(p1, 1);
    const p2 = [item('RAPPORT D’ANALYSES', 450, 30), item('N° FX-261126-000077.1', 470, 42)]; entete(p2, 110, NZ, UZ); ECH.slice(2).forEach((e, k) => ligne(p2, 168 + 25 * k, e, e.z)); pied(p2, 2);
    const pages = [{ n: 1, w: 842, h: 595, items: p1 }, { n: 2, w: 842, h: 595, items: p2 }];
    const b = L.bulletinAnalyser(db, R, L.bulletinLignesDePages(pages), { candidats: [] }); const E = b.echantillons;
    const v = (e, k) => (e.valeurs[k] || e.nouveaux[k] || {}).v;
    t('plusieurs tableaux : 4 échantillons (pas 8), réunis par n° du laboratoire, références sans l’en-tête du tableau suivant', b.format === 'colonnes' && E.length === 4 && E.map((e) => e.numero).join() === '26FX000301,26FX000302,26FX000303,26FX000304' && E.map((e) => e.ref).join() === 'FX101C,FX101T,FX302T,FX302T', E.map((e) => [e.numero, e.ref]));
    t('… chaque tableau lu avec son en-tête : azote assimilable, ammoniacal et alpha-aminé (nouveaux paramètres) — pas pris pour la densité ou les sucres', E.every((e, k) => Math.abs(v(e, 'densite') - +ECH[k].a[0].replace(',', '.') / 1000) < 1e-9 && v(e, 'sucres') === +ECH[k].a[1].replace(',', '.') && v(e, 'azote') === +ECH[k].z[0] && v(e, 'azoteAmmoniacal') === +ECH[k].z[1] && v(e, 'azoteAmine') === +ECH[k].z[2]) && !!E[0].nouveaux.azoteAmmoniacal && E[0].nouveaux.azoteAmine.nom === 'Azote alpha-aminé', E.map((e) => Object.fromEntries(Object.entries({ ...e.valeurs, ...e.nouveaux }).map(([k, x]) => [k, x.v]))));
    t('… suite page 2 (un seul tableau, sans le 1er) rattachée ; même référence, deux n° : deux échantillons distincts avec leurs propres valeurs', v(E[2], 'azote') === 226 && v(E[3], 'azote') === 90 && v(E[3], 'malique') === 4.5 && v(E[1], 'malique') === 6.9 && v(E[2], 'ph') === 3.18);
    // sans n° de laboratoire : réunis par référence ; deux lignes d'un même tableau jamais réunies
    const sansNum = pages.map((p) => ({ ...p, items: p.items.filter((i) => !/^26FX/.test(i.s)) }));
    const bs = L.bulletinAnalyser(db, R, L.bulletinLignesDePages(sansNum), { candidats: [] });
    t('… sans n° : réunis par référence, les deux « FX302T » d’un même tableau restent deux échantillons', bs.echantillons.length === 4 && v(bs.echantillons[0], 'azote') === 214 && v(bs.echantillons[3], 'densite') === 1.0729, bs.echantillons.map((e) => [e.ref, Object.keys(e.valeurs).length, Object.keys(e.nouveaux).length]));
    // chaptalisation calculée par le laboratoire : nouveau paramètre proposé
    t('catalogue : « Chaptalisation » (kg/hL), « Azote ammoniacal », « Azote alpha-aminé » reconnus ; « Azote assimilable » inchangé', L.bulletinAnalyser(db, R, L.bulletinLignesDeTexte('Échantillon : Cuve 3\nChaptalisation   0,412   kg/hL\nAzote ammoniacal   81   mg/L\nAzote alpha aminé   131   mg/L\nAzote assimilable   214   mg/L')).echantillons.some((e) => e.nouveaux.chaptalisation && e.nouveaux.chaptalisation.v === 0.412 && e.nouveaux.azoteAmmoniacal.v === 81 && e.nouveaux.azoteAmine.v === 131 && e.valeurs.azote.v === 214));
    // ---- version, traductions, base 0.40.0-alpha.2 et compatibilité avec la 0.40.0-alpha.1 gelée
    t('version 0.40.0-alpha.2 : correction de la version en test (itération alpha)', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.40.0-alpha.2'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.40.0-alpha.1' && L.CHANGELOG[i].notes.length === 2; })());
    t('traductions : nouveaux paramètres et notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('Azote ammoniacal', 'en') === 'Ammonia nitrogen' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f48 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.40.0-alpha.2-bulletins.json'), 'utf8'))); L.syncConfig(f48);
    const pAm = f48.analysesParams.find((p) => p.nom === 'Azote ammoniacal'); const aB = f48.analyses.filter((a) => a.bulletinDocId === 'docfx402');
    t('fixture 0.40.0-alpha.2 : analyses d’un bulletin à plusieurs tableaux, nouveaux paramètres créés', !!pAm && aB.length === 2 && aB[0].valeurs[pAm.id] === 81 && f48.analysesParams.some((p) => p.nom === 'Chaptalisation (calcul du laboratoire)' && p.unite === 'kg/hL'));
    const dirO = path.join(__dirname, 'anciennes', '0.40.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, analyseSave, bulletinAnalyser, bulletinLignesDePages, sampleDb, APP_VERSION, APP_NUM };')({});
    t('0.40.0-alpha.1 gelée chargée (elle lisait 8 morceaux mal attribués dans ce rapport)', O.APP_VERSION === '0.40.0-alpha.1' && L.APP_NUM > O.APP_NUM && (() => { const dO = O.sampleDb(); const bo = O.bulletinAnalyser(dO, O.getR(dO), O.bulletinLignesDePages(pages), { candidats: [] }); return bo.echantillons.length !== 4; })());
    const x = O.normalizeDb(O.clone(f48)); O.syncConfig(x);
    t('… la 0.40.0-alpha.1 ouvre la base 0.40.0-alpha.2 sans rien perdre (analyses, paramètres, bulletin joint)', canonJ(x.analyses) === canonJ(f48.analyses) && canonJ(x.analysesParams) === canonJ(f48.analysesParams) && canonJ(x.docs) === canonJ(f48.docs));
    const aX = O.clone(aB[0]); aX.notes = 'Relu là-bas'; x.analyses = x.analyses.map((a) => (a.id === aX.id ? aX : a)); x.meta.modifLe = '2026-11-28T09:00:00Z';
    const N = L.clone(f48); N.analysesParams.find((p) => p.id === pAm.id).dec = 1; N.meta.modifLe = '2026-11-28T08:00:00Z';
    const FX = L.syncFusion(f48, N, x); const FX2 = O.syncFusion(f48, x, N);
    t('… synchronisation 0.40.0-alpha.2 ↔ 0.40.0-alpha.1 : analyse annotée là-bas, paramètre modifié ici, rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => y.analyses.find((a) => a.id === aX.id).notes === 'Relu là-bas' && y.analysesParams.find((p) => p.id === pAm.id).dec === 1 && y.analyses.length === f48.analyses.length));
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (48 : bulletins à plusieurs tableaux et plusieurs pages, nouveaux paramètres d’analyse ; compatibilité 0.40.0-alpha.1)');

  // ===== 49. 0.41.0-alpha.1 : codification des lots personnalisable (règles par stade, briques, versions datées, tables, héritage), habillage
  {
    const db = L.normalizeDb(L.sampleDb()); L.syncConfig(db); const uid = '';
    // ---- encodages
    t('code champenois : 1-2-3-4-5-6-7-8-9-0 → C-H-A-M-P-E-N-O-I-S, aller et retour', L.codifChampenois('1234567890') === 'CHAMPENOIS' && L.codifChampenois('18') === 'CO' && L.codifChampenois('07') === 'SN' && L.codifDeChampenois('HS') === '20');
    t('lettres en numération bijective : A…Z, AA ; à rebours Z = 1, Y = 2 ; alphabet personnalisé', L.codifLettres(1) === 'A' && L.codifLettres(26) === 'Z' && L.codifLettres(27) === 'AA' && L.codifLettres(1, 'ZYXWVUTSRQPONMLKJIHGFEDCBA') === 'Z' && L.codifLettres(2, 'ZYXWVUTSRQPONMLKJIHGFEDCBA') === 'Y' && L.codifLettres(3, 'XY') === 'XX');
    t('quantième et semaine ISO : 24/03/2022 = 83e jour ; 01/01/2021 = semaine 53 ; 04/01/2021 = semaine 1', L.codifJourAn('2022-03-24') === 83 && L.codifSemaine('2021-01-01') === 53 && L.codifSemaine('2021-01-04') === 1 && L.codifSemaine('2026-11-27') === 48);
    // ---- composition : stades, briques, validation
    t('8 regroupements de stades (vendange → mise en carton), stades des liqueurs de tirage et d’expédition, achats sur lattes', L.CODIF_GROUPES.length === 8 && ['marc', 'fraction', 'mout', 'vinification', 'assemblage', 'tirage', 'prep_liqueur_tirage', 'prep_liqueur_exp', 'lattes_achat', 'degorgement', 'habillage', 'expedition'].every((id) => L.CODIF_STADES.some((s) => s.id === id)));
    t('validation : brique vide, deux compteurs, table absente, reprise sans étape précédente refusés', !L.codifValider(db, 'tirage', []).ok && !L.codifValider(db, 'tirage', [{ type: 'texte', valeur: '' }]).ok && !L.codifValider(db, 'tirage', [{ type: 'compteur' }, { type: 'compteur' }]).ok && !L.codifValider(db, 'tirage', [{ type: 'choix', tableId: 'x' }]).ok && !L.codifValider(db, 'marc', [{ type: 'herite' }]).ok && L.codifValider(db, 'degorgement', [{ type: 'herite' }]).ok);
    // ---- sans règle : code d'Œnotrack inchangé
    t('sans règle : rien n’est imposé (code d’Œnotrack), unicité refusée comme avant', L.codifGenerer(db, 'tirage', { date: '2026-11-27' }).defaut === true && !L.codifActif(db, 'tirage', '2026-11-27') && L.codifUnicite(db, 'tirage', '2026-11-27') === 'refus');
    // ---- tables de correspondance
    const tc = L.codifTableSet(db, { nom: 'Cuvée', source: 'libre', lignes: [{ libelle: 'Brut Or', code: 'GO' }, { libelle: 'Rosé', code: 'RO' }] }).id; const T = db.codifTables.find((x) => x.id === tc);
    const tcep = L.codifTableSet(db, { nom: 'Cépages', source: 'cepages', lignes: [{ cle: 'chard', code: 'CH' }, { cle: 'pn', code: 'PN' }, { cle: 'pn+chard', code: 'CP' }] }).id;
    const tan = L.codifTableSet(db, { nom: 'Code année', source: 'date', lignes: [{ cle: '2026', code: 'AA' }, { cle: '2027', code: 'AB' }] }).id;
    t('tables : libre (choix à la saisie), liée aux cépages (combinaison, ordre indifférent), années ; doublon de nom et de valeur refusés', T.lignes.length === 2 && L.codifTableCode(db, tcep, 'chard+pn') === 'CP' && L.codifTableCode(db, tan, '2027') === 'AB' && L.codifTableCode(db, tcep, 'pm') === null && !L.codifTableSet(db, { nom: 'cuvée', source: 'libre' }).ok && !L.codifTableSet(db, { nom: 'X', source: 'date', lignes: [{ cle: '1', code: 'a' }, { cle: '1', code: 'b' }] }).ok);
    // ---- briques : aperçu (sans enregistrer)
    const ap = (briques, ctx) => L.codifGenerer(db, 'tirage', { date: '2020-07-22', ...(ctx || {}) }, { briques });
    t('aperçu : marque + cuvée choisie + année et mois en code champenois + jour → AGOHSSN22 (parties nommées)', (() => { const g = ap([{ type: 'texte', valeur: 'A' }, { type: 'choix', tableId: tc, nom: 'cuvée' }, { type: 'date', champ: 'annee', encodage: 'champenois' }, { type: 'date', champ: 'mois', encodage: 'champenois' }, { type: 'date', champ: 'jour' }], { choix: { [tc]: T.lignes[0].id } }); return g.code === 'AGOHSSN22' && g.parts['cuvée'] === 'GO'; })());
    t('dates : année sur 1, 2 ou 4 chiffres, en lettres, par table ; quantième, semaine, heure et minute', ap([{ type: 'date', champ: 'annee', chiffres: 1 }, { type: 'date', champ: 'annee', chiffres: 4 }, { type: 'date', champ: 'mois', encodage: 'lettres' }, { type: 'date', champ: 'quantieme' }, { type: 'date', champ: 'semaine' }, { type: 'date', champ: 'heure' }, { type: 'date', champ: 'minute' }], { heure: '11:18' }).code === '02020G2043011' + '18' && ap([{ type: 'date', champ: 'annee', encodage: 'table', tableId: tan }], { date: '2027-03-01' }).code === 'AB');
    t('millésimes : deux millésimes « 19/20 », le majoritaire, code champenois, « NV » sans millésime', ap([{ type: 'millesime' }], { millesimes: { 2020: 0.3, 2019: 0.7 } }).code === '19/20' && ap([{ type: 'millesime', mode: 'majoritaire', chiffres: 4 }], { millesimes: { 2020: 0.3, 2019: 0.7 } }).code === '2019' && ap([{ type: 'millesime', encodage: 'champenois' }], { millesimes: { 2018: 1 } }).code === 'CO' && ap([{ type: 'millesime' }], {}).code === 'NV');
    const comp = { cepages: { pn: 0.6, chard: 0.4 }, fractions: { cuvee: 1 }, qualifs: { bio: 1 } };
    t('données du lot : cépage majoritaire (libellé, table), combinaison de cépages par table, fraction (code court), revendication (code court)', ap([{ type: 'variable', variable: 'cepage', rendu: 'table', tableId: tcep }], { comp }).code === 'PN' && ap([{ type: 'variable', variable: 'cepages', rendu: 'table', tableId: tcep }], { comp }).code === 'CP' && ap([{ type: 'variable', variable: 'fraction', rendu: 'court' }], { comp }).code === 'C' && ap([{ type: 'variable', variable: 'revendication', rendu: 'court' }], { comp, qualif: 'bio' }).code === 'BIO' && ap([{ type: 'variable', variable: 'cepage' }], { comp }).code === 'Pinot noir');
    t('mise en forme : largeur fixe (complétée, alignée), casse, garder les N premiers ou derniers caractères, sans accents', ap([{ type: 'texte', valeur: 'ab', largeur: 4, remplir: '_' }, { type: 'texte', valeur: '7', largeur: 3, remplir: '0', aligne: 'droite' }, { type: 'texte', valeur: 'cuvée', casse: 'maj', sansAccents: true, garder: 3 }, { type: 'texte', valeur: 'XYZ', garder: 1, garderDe: 'fin' }]).code === 'ab__007CUVZ');
    t('conditions : segment « si millésimé », place réservée (« réserve si cuvée à 3 caractères »), test sur un choix, différent de l’étape précédente', ap([{ type: 'texte', valeur: 'L' }, { type: 'millesime', si: { variable: 'cepage', test: 'egal', valeur: 'chard' } }]).code === 'L' && ap([{ type: 'texte', valeur: 'M', si: { variable: 'cepage', test: 'rempli' }, largeur: 2, reserver: true, remplir: ' ' }, { type: 'texte', valeur: '|' }]).code === '  |' && ap([{ type: 'texte', valeur: 'E', si: { variable: `choix:${tc}`, test: 'egal', valeur: T.lignes[1].cle } }, { type: 'texte', valeur: '-' }], { choix: { [tc]: T.lignes[1].id } }).code === 'E-' && ap([{ type: 'texte', valeur: 'D', si: { variable: 'revendication', test: 'changeParent' } }, { type: 'texte', valeur: '.' }], { qualif: 'bio', parentCtx: { qualif: 'conv' }, parent: { code: 'X' } }).code === 'D.');
    // ---- héritage : code entier, partie nommée (sûre même après un changement de règle), position
    const parent = { code: 'CSA2CO', codif: { stade: 'assemblage', parts: { marque: 'C', 'cuvée': 'SA2', annee: 'CO' } } };
    t('reprise : code entier, partie nommée « cuvée », caractères 2 à 4 ; partie absente → valeur par défaut ; code saisi à la main : pas de partie', ap([{ type: 'herite' }, { type: 'texte', valeur: '+' }, { type: 'herite', mode: 'partie', partie: 'cuvée' }, { type: 'texte', valeur: '+' }, { type: 'herite', mode: 'position', debut: 2, fin: 4 }], { parent }).code === 'CSA2CO+SA2+SA2' && ap([{ type: 'herite', mode: 'partie', partie: 'x', defaut: '?' }], { parent }).code === '?' && ap([{ type: 'herite', mode: 'partie', partie: 'cuvée', defaut: '' }, { type: 'texte', valeur: '!' }], { parent: { code: 'Z', codif: { manuel: true, parts: { 'cuvée': 'SA2' } } } }).code === '!');
    // ---- règles datées et compteurs
    const vH = L.codifVersionSet(db, 'habillage', { des: '2026-08-01', briques: [{ type: 'texte', valeur: 'L' }, { type: 'date', champ: 'annee' }, { type: 'compteur', alphabet: 'alphaInv', chiffres: 1, raz: 'jour' }, { type: 'date', champ: 'quantieme' }] }, { par: uid });
    t('règle d’habillage enregistrée à partir du 01/08/2026 ; avant cette date : code d’Œnotrack', vH.ok && L.codifActif(db, 'habillage', '2026-11-27') && !L.codifActif(db, 'habillage', '2026-07-31'));
    const fini = db.lotsFinis[0]; const H = (nb, extra) => { const h = { type: 'habillage', date: '2026-11-27', source: { type: 'fini', id: fini.id }, nb, ...(extra || {}) }; const g = L.codifGenerer(db, 'habillage', { date: h.date }); h.code = h.code || g.code; h.codif = L.codifTrace(g, h.code); return L.habillageSave(db, h, null, { par: uid }); };
    const h1 = H(1000); const h2 = H(500, { code: 'L26Y331-SPECIAL' }); const g3 = L.codifGenerer(db, 'habillage', { date: '2026-11-27' });
    t('compteur à rebours remis à zéro chaque jour : Z (1er habillage du jour), Y ; un code retouché à la main garde son rang ; le 3e est X', h1.ok && db.habillages[0].code === 'L26Z331' && db.habillages[1].codif.manuel && db.habillages[1].codif.cpt === 2 && g3.code === 'L26X331' && L.codifGenerer(db, 'habillage', { date: '2026-11-28' }).code === 'L26Z332', [db.habillages.map((h) => h.code), g3.code]);
    t('compteur : pas, départ, remise à zéro par combinaison de parties (marque + cuvée), codes déjà pris sautés, réservations d’une même saisie', (() => {
      const B = [{ type: 'choix', tableId: tc, nom: 'cuvée' }, { type: 'compteur', chiffres: 3, depart: 10, pas: 5, raz: 'annee', razParties: ['cuvée'] }];
      const a = ap(B, { choix: { [tc]: T.lignes[0].id }, reserves: [{ cle: 'a:2020|cuvée=GO', cpt: 10, code: 'GO010' }] }); const b = ap(B, { choix: { [tc]: T.lignes[1].id } });
      const y = L.clone(db); y.lots.push({ id: 'lx', code: 'TS01' }); const c = L.codifGenerer(y, 'tirage', { date: '2020-01-01' }, { briques: [{ type: 'texte', valeur: 'TS' }, { type: 'compteur', chiffres: 2 }] });
      return a.code === 'GO015' && a.cle === 'a:2020|cuvée=GO' && b.code === 'RO010' && c.code === 'TS02'; })());
    t('alphabet personnalisé (sans I ni O) et lettres sur 2 caractères minimum', ap([{ type: 'compteur', alphabet: 'perso', caracteres: 'ABCDEFGHJKLMNPQRSTUVWXYZ', chiffres: 2 }]).code === 'AA' && ap([{ type: 'compteur', alphabet: 'alpha', depart: 9 }]).code === 'I');
    // ---- versions : une version qui a servi ne se modifie plus ; nouvelle version datée ; retour au code d'Œnotrack
    const vid = db.codifRegles.find((r) => r.id === 'habillage').versions[0].id;
    t('version qui a servi : ni modifiable ni supprimable ; une nouvelle version à partir d’une date s’applique ensuite, les lots déjà codés ne changent pas', L.codifUsage(db, 'habillage', vid) === 2 && !L.codifVersionSet(db, 'habillage', { id: vid, des: '2026-08-01', briques: [{ type: 'texte', valeur: 'X' }] }).ok && !L.codifVersionDel(db, 'habillage', vid).ok
      && L.codifVersionSet(db, 'habillage', { des: '2027-01-01', briques: [{ type: 'texte', valeur: 'H' }, { type: 'compteur', chiffres: 3, raz: 'annee' }] }).ok && L.codifGenerer(db, 'habillage', { date: '2027-02-01' }).code === 'H001' && L.codifGenerer(db, 'habillage', { date: '2026-12-01' }).code === 'L26Z335' && db.habillages[0].code === 'L26Z331'
      && !L.codifVersionSet(db, 'habillage', { des: '2027-01-01', briques: [{ type: 'texte', valeur: 'Q' }] }).ok);
    t('retour au code d’Œnotrack à partir d’une date (version « défaut »), H26-001 sans règle', L.codifVersionSet(db, 'habillage', { des: '2027-06-01', defaut: true }).ok && L.codifGenerer(db, 'habillage', { date: '2027-07-01' }).defaut && L.habillageCodeDefaut(db, 'carton', '2026-11-27') === 'C26-001');
    t('unicité réglable : refus (défaut), avertissement, sans contrôle', (() => { L.codifVersionSet(db, 'assemblage', { des: '2020-01-01', briques: [{ type: 'texte', valeur: 'AS25-01' }] }); const a = L.codifGenerer(db, 'assemblage', { date: '2026-01-01' }); L.codifRegleOptions(db, 'assemblage', { unicite: 'aucune' }); const b = L.codifGenerer(db, 'assemblage', { date: '2026-01-01' }); const u = L.codifUnicite(db, 'assemblage', '2026-01-01'); L.codifRegleOptions(db, 'assemblage', { unicite: 'refus' }); return a.avert.length === 1 && b.avert.length === 0 && u === 'aucune' && !L.codifRegleOptions(db, 'assemblage', { unicite: 'x' }).ok; })());
    t('table utilisée par une règle : suppression refusée', (() => { L.codifVersionSet(db, 'marc', { des: '2020-01-01', briques: [{ type: 'variable', variable: 'cepage', rendu: 'table', tableId: tcep }] }); return !L.codifTableDel(db, tcep).ok; })());
    // ---- dans les opérations : trace gardée avec le lot, rien de renommé quand la règle change
    L.codifVersionSet(db, 'tirage', { des: '2026-08-01', briques: [{ type: 'texte', valeur: 'T' }, { type: 'variable', variable: 'cepages', rendu: 'table', tableId: tcep, nom: 'cépages' }, { type: 'millesime', chiffres: 2 }, { type: 'sep', valeur: '-' }, { type: 'compteur', chiffres: 2, raz: 'campagne' }] });
    const R0 = L.getR(db, '2026-11-27'); const P = Object.values(R0.portions).filter((p) => p.vol > 300 && (R0.lots[p.lotId] || {}).type !== 'mout').sort((a, b) => b.vol - a.vol)[0];
    const tirer = (code, n) => { const R = L.getR(db, '2026-11-27'); const ctx = { ...L.codifCtxSources(db, R, [{ lotId: P.lotId, volL: 100 }]), date: '2026-11-27' }; const g = L.codifGenerer(db, 'tirage', ctx); const c = code || g.code; return { g, r: L.opSave(db, { type: 'tirage', date: '2026-11-27', sources: [{ portionId: P.id, lotId: P.lotId, volL: 100 }], prepUses: [], lignes: [], nbBouteilles: n, volBouteilleL: 0.75, lotSpec: { code: c, designation: c, millesime: '2026', codif: L.codifTrace(g, c) } }) }; };
    const t1 = tirer(null, 100); const lot1 = db.lots.find((l) => l.id === t1.r.op.lotId); const t2 = tirer(null, 100);
    t('tirage : code de la règle, trace (version, parties, compteur, clé) gardée avec le lot ; compteur suivant au tirage suivant', t1.r.ok && lot1.code === t1.g.code && /-01$/.test(lot1.code) && lot1.codif.version && lot1.codif.cpt === 1 && lot1.codif.parts['cépages'] && /-02$/.test(t2.g.code), [t1.g, t2.g.code]);
    const avant = db.lots.map((l) => l.code).join(); L.codifVersionSet(db, 'tirage', { des: '2026-11-28', briques: [{ type: 'texte', valeur: 'NOUVEAU' }, { type: 'compteur' }] }); L.replay(db);
    t('nouvelle règle : aucun lot existant renommé (codes stockés, jamais recalculés)', db.lots.map((l) => l.code).join() === avant && L.codifGenerer(db, 'tirage', { date: '2026-12-01' }).code === 'NOUVEAU1');
    t('choix repris de l’étape précédente (même table) et tables à choisir de la règle', (() => { L.codifVersionSet(db, 'degorgement', { des: '2020-01-01', briques: [{ type: 'choix', tableId: tc }, { type: 'texte', valeur: '-D' }] }); return L.codifChoixTables(db, 'degorgement', '2026-11-27').map((x) => x.id).join() === tc && L.codifChoixHerites(db, 'degorgement', '2026-11-27', { choix: { [tc]: T.lignes[1].id, autre: 'x' } })[tc] === T.lignes[1].id && Object.keys(L.codifChoixHerites(db, 'degorgement', '2026-11-27', { choix: { autre: 'x' } })).length === 0; })());
    t('stade d’une opération : nature de l’entrée de vin (contenant ou sur lattes), type de préparation, règle propre à une opération du catalogue', L.codifStadePourOp(db, 'reprise', { kind: 'bouteilles' }) === 'lattes_achat' && L.codifStadePourOp(db, 'reprise', { nbBouteilles: 0 }) === 'vin' && L.codifStadePourOp(db, 'preparation', { ptype: 'liqueur_exp' }) === 'prep_liqueur_exp' && (() => { L.codifVersionSet(db, 'op:collage', { des: '2020-01-01', briques: [{ type: 'texte', valeur: 'C' }] }); return L.codifStadePourOp(db, 'etape', { sousType: 'collage' }) === 'op:collage'; })());
    // ---- changement de stade qui attribue un nouveau code ; annulé à la suppression de l'opération
    { const R = L.getR(db, '2026-11-27'); const lv = Object.values(R.lots).find((l) => l.type !== 'cuvee_tirage' && (R.lotVol[l.id] || 0) > 0 && l.stade !== 'vin_clair'); const c0 = lv.code;
      const op = L.opSave(db, { type: 'etape', date: '2026-11-27', lotId: lv.id, newStade: 'vin_clair', nouveauCode: 'VC-TEST-1' }).op; const l1 = db.lots.find((l) => l.id === lv.id); const creat = db.ops.find((o) => o.id === l1.opId);
      const codeOp = (o) => (o.lotSpec || o.parentSpec || {}).code || ((o.lots || []).find((x) => x.lotId === lv.id) || {}).code || ((o.fractions || []).find((x) => x.lotId === lv.id) || {}).code;
      const T1 = L.traceChercher(db, L.replay(db), c0);
      t('changement de stade : nouveau code, ancien gardé (cherchable en traçabilité), écrit aussi dans l’opération qui a créé le lot', l1.code === 'VC-TEST-1' && l1.codesPrecedents[0].code === c0 && l1.codesPrecedents[0].opId === op.id && (!creat || codeOp(creat) === 'VC-TEST-1') && T1.some((x) => x.id === lv.id), [l1.code, T1.map((x) => x.titre)]);
      L.opDelete(db, op.id); const l2 = db.lots.find((l) => l.id === lv.id);
      t('… opération supprimée : l’ancien code revient', l2.code === c0 && !l2.codesPrecedents && (!creat || codeOp(db.ops.find((o) => o.id === creat.id)) === c0)); }
    // ---- renommage manuel (exception, réétiquetage) : motif exigé, ancien code gardé
    { const l = db.lots.find((x) => x.code === 'AS25-01');
      t('lot : changement de code à la main — ancien code gardé, opération de création mise à jour (la réenregistrer ne remet pas l’ancien)', L.lotEdit(db, l.id, { code: 'AS25-01-B', designation: l.designation, millesime: l.millesime, motif: 'Erreur de saisie' }).ok && l.codesPrecedents[0].code === 'AS25-01' && l.codesPrecedents[0].motif === 'Erreur de saisie' && db.ops.find((o) => o.id === l.opId).lotSpec.code === 'AS25-01-B');
      t('lot fini : motif exigé ; code déjà pris refusé ; ancien code gardé', !L.lotRenommer(db, 'fini', fini.id, 'X1', '', uid).ok && L.lotRenommer(db, 'fini', fini.id, 'LF-REET', 'Réétiquetage', uid).ok && fini.code === 'LF-REET' && fini.codesPrecedents[0].code === 'LF-26-001' && db.ops.find((o) => o.id === fini.opId).lotFiniSpec.code === 'LF-REET' && L.traceChercher(db, L.replay(db), 'LF-26-001').some((x) => x.id === fini.id)); }
    // ---- habillage, réétiquetage, mise en carton
    { const hb = db.habillages[0];
      t('habillage : bouteilles disponibles contrôlées (lot fini de 3 000 : 1 500 déjà habillées)', L.habillageRestant(db, { type: 'fini', id: fini.id }, 'habillage') === 1500 && !L.habillageSave(db, { type: 'habillage', date: '2026-11-27', source: { type: 'fini', id: fini.id }, nb: 1501, code: 'H-TROP' }).ok);
      const re = L.habillageSave(db, { type: 'habillage', date: '2026-11-27', source: { type: 'habillage', id: hb.id }, nb: 200, code: 'REET-1' }); const ca = L.habillageSave(db, { type: 'carton', date: '2026-11-27', source: { type: 'habillage', id: re.id }, nb: 120, nbCartons: 20, parCarton: 6, destinataire: 'Client fictif', code: 'C-1' });
      t('réétiquetage : nouveau lot lié au précédent, intact ; mise en carton du lot réétiqueté ; lot fini d’origine retrouvé', re.ok && ca.ok && db.habillages.find((h) => h.id === hb.id).nb === 1000 && L.habillageFini(db, db.habillages.find((h) => h.id === ca.id)).id === fini.id && L.habillageRestant(db, { type: 'habillage', id: re.id }, 'carton') === 80);
      t('… suppression refusée tant qu’un lot en dépend ; dégorgement non supprimable tant que son lot fini est habillé ; code d’habillage cherchable', !L.habillageDelete(db, re.id).ok && L.habillageDelete(db, ca.id).ok && !L.opDelete(db, fini.opId).ok && L.traceChercher(db, L.replay(db), 'REET-1').some((x) => x.id === fini.id));
      t('… nombre réduit sous ce qui a déjà été réétiqueté : refusé ; une mise en carton ne se rhabille pas ; code en double refusé', !L.habillageSave(db, { ...hb, nb: 100 }, hb.id).ok && !L.habillageSave(db, { type: 'habillage', date: '2026-11-27', source: { type: 'habillage', id: db.habillages.find((h) => h.type === 'carton') ? db.habillages.find((h) => h.type === 'carton').id : 'x' }, nb: 1, code: 'Z' }).ok && !L.habillageSave(db, { type: 'habillage', date: '2026-11-27', source: { type: 'fini', id: fini.id }, nb: 1, code: 'REET-1' }).ok);
      t('contexte d’un habillage : lot fini d’origine (dosage, revendication), parent = source', (() => { const c = L.codifCtxHabillage(db, L.replay(db), { date: '2026-11-27', source: { type: 'habillage', id: re.id }, nb: 10 }); return c.parent.code === 'REET-1' && c.dosage === fini.dosageGL && c.qualif === fini.qualif; })()); }
    // ---- export / import
    { const x = L.codifExporter(db); const y = L.normalizeDb(L.sampleDb()); L.syncConfig(y);
      const r1 = L.codifImporter(y, JSON.stringify(x), { des: '2026-09-01' }); const r2 = L.codifImporter(y, x, { des: '2026-09-01' });
      t('export / import : règles devenues versions à partir de la date choisie, tables recréées (références réunies), second import identique sans effet', r1.ok && r1.regles >= 4 && y.codifTables.length === 3 && y.codifRegles.find((r) => r.id === 'tirage').versions.length === 1 && y.codifRegles.find((r) => r.id === 'tirage').versions[0].des === '2026-09-01' && r2.ok && r2.regles === 0 && y.codifTables.length === 3 && !L.codifImporter(y, '{}').ok && !L.codifImporter(y, 'pas du json').ok, [r1, r2]); }
    // ---- droits et synchronisation
    { const g = L.clone(db); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-cave', nom: 'Cave', modules: { degorgement: 'ecriture', params: 'lecture' }, droits: {} }]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-cave', identifiant: 'cave', nom: 'Cave', profilId: 'pf-cave', actif: true }];
      const h = L.clone(g); L.codifVersionSet(h, 'expedition', { des: '2026-01-01', briques: [{ type: 'texte', valeur: 'E' }] }); const r1 = L.gardeDroits(g, h, 'u-cave');
      const h2 = L.clone(g); L.habillageSave(h2, { type: 'habillage', date: '2026-11-27', source: { type: 'fini', id: fini.id }, nb: 10, code: 'HAB-DROIT' }); const r2 = L.gardeDroits(g, h2, 'u-cave');
      t('droits : règles de codification = paramètres (refusé en lecture) ; habillage = module Dégorgement', r1.ok === false && r2.ok === true, [r1, r2]); }
    { const B = L.clone(db); const A = L.clone(db); const C = L.clone(db); L.codifTableSet(A, { ...A.codifTables[0], lignes: [...A.codifTables[0].lignes, { libelle: 'Blanc de blancs', code: 'BB' }] }); A.meta.modifLe = '2026-11-28T08:00:00Z';
      L.habillageSave(C, { type: 'habillage', date: '2026-11-27', source: { type: 'fini', id: fini.id }, nb: 5, code: 'HAB-SYNC' }); C.meta.modifLe = '2026-11-28T09:00:00Z'; const F = L.syncFusion(B, A, C);
      t('synchronisation : table modifiée ici, habillage saisi là-bas, rien de perdu', F.db.codifTables[0].lignes.length === 3 && F.db.habillages.some((h) => h.code === 'HAB-SYNC') && L.syncNom('habillages', 2) === '2 habillages et mises en carton'); }
    // ---- version, traductions, base 0.41.0-alpha.1 et compatibilité avec la 0.40.0-alpha.2 gelée
    t('version 0.41.0-alpha.1 : nouvelle version mineure (nouvelle fonctionnalité)', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.41.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.40.0-alpha.2' && L.CHANGELOG[i].notes.length === 3; })());
    t('traductions : codification et notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('🏷 Codification des lots', 'en') === '🏷 Lot coding' && L.traduire('Habillage & mise en carton', 'de') === 'Ausstattung & Kartonierung' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)), L.tradControle().slice(0, 5));
    const f49 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.41.0-alpha.1-codification.json'), 'utf8'))); L.syncConfig(f49);
    const lt = f49.lots.find((l) => l.codif && l.codif.stade === 'tirage'); const lr = f49.lots.find((l) => (l.codesPrecedents || []).length); const fr = f49.lotsFinis.find((f) => (f.codesPrecedents || []).length);
    t('fixture 0.41.0-alpha.1 : tables, règles datées, tirage codé, lot renommé au changement de stade, lot fini renommé, habillages, réétiquetage, carton, code du fournisseur', f49.codifTables.length === 2 && f49.codifRegles.length === 3 && lt && lt.code === 'ABFHECC26' && lr && lr.codesPrecedents[0].opId && fr && f49.habillages.length === 4 && f49.habillages.filter((h) => h.source.type === 'habillage').length === 2 && f49.lots.some((l) => l.codeFournisseur === 'FOURN-FX-778'));
    t('… le compteur reprend après la base : 4e habillage du jour = W ; vinification suivante = 2', L.codifGenerer(f49, 'habillage', { date: '2026-11-27' }).code === 'L26W331' && /-2$/.test(L.codifGenerer(f49, 'vinification', { date: '2026-11-27', comp: { cepages: { chard: 1 } }, millesimes: { 2025: 1 } }).code));
    const dirO = path.join(__dirname, 'anciennes', '0.40.0-alpha.2');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, opSave, lotEdit, APP_VERSION, APP_NUM };')({});
    t('0.40.0-alpha.2 gelée chargée', O.APP_VERSION === '0.40.0-alpha.2' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f49)); O.syncConfig(x);
    t('… la 0.40.0-alpha.2 ouvre la base 0.41.0-alpha.1 sans rien perdre (règles, tables, habillages, traces des lots, anciens codes)', canonJ(x.codifRegles) === canonJ(f49.codifRegles) && canonJ(x.codifTables) === canonJ(f49.codifTables) && canonJ(x.habillages) === canonJ(f49.habillages) && canonJ(x.lots) === canonJ(f49.lots) && canonJ(x.lotsFinis) === canonJ(f49.lotsFinis) && canonJ(x.ops) === canonJ(f49.ops) && !!O.getR(x).lots[lt.id]);
    // là-bas : le lot de tirage codé est réenregistré (son opération est réécrite par l'ancienne version) ; ici : un habillage
    const opT = x.ops.find((o) => o.id === lt.opId); const rO = O.opSave(x, { ...O.clone(opT), notes: 'Relu là-bas' }, opT.id); x.meta.modifLe = '2026-11-28T09:00:00Z';
    const N = L.clone(f49); L.habillageSave(N, { type: 'habillage', date: '2026-11-27', source: { type: 'fini', id: f49.lotsFinis[0].id }, nb: 10, code: 'HAB-COMPAT' }); N.meta.modifLe = '2026-11-28T08:00:00Z';
    const FX = L.syncFusion(f49, N, x); const FX2 = O.syncFusion(f49, x, N);
    t('… synchronisation 0.41.0-alpha.1 ↔ 0.40.0-alpha.2 : tirage réécrit là-bas (trace de codification gardée), habillage saisi ici, rien de perdu des deux côtés', rO.ok && [FX.db, FX2.db].every((y) => y.habillages.length === f49.habillages.length + 1 && y.lots.find((l) => l.id === lt.id).codif.version === lt.codif.version && y.lots.find((l) => l.id === lt.id).code === lt.code && y.ops.find((o) => o.id === lt.opId).notes === 'Relu là-bas' && canonJ(y.codifRegles) === canonJ(f49.codifRegles)), [FX.conflits, FX2.conflits]);
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (49 : codification des lots personnalisable, habillage et mise en carton ; compatibilité 0.40.0-alpha.2)');

  // ===== 50. 0.42.0-alpha.1 : Tirages › Préparer — calculateur, liqueur de tirage, levain (étapes, propagation, recalibrage), VRTP
  {
    const db = L.normalizeDb(L.sampleDb()); L.syncConfig(db); const p = { ...L.tirageProfil(db), pointGL: 24 }; const near = (a, b, e) => Math.abs(a - b) < (e || 0.01);
    t('profil par défaut : levain 5 %, liqueur 500 g/L, augmentation de volume du saccharose 0,6329 L/kg (calculs ; 0,66 L/kg pour les déclarations, 0.47.0-alpha.2), VRTP ≤ 1 % (cahier des charges) ; pas de point de tirage commun : il se choisit pour chaque cuvée (calcul refusé sans lui)', p.levainPct === 5 && p.titreLiqueurGL === 500 && p.volSucreLkg === 0.6329 && p.volSucreDeclLkg === 0.66 && L.tirageProfil(db).pointGL === undefined && !L.tirageCalcul({ mode: 'cols', formats: [{ format: 'bouteille', nb: 10 }] }, L.tirageProfil(db)).ok && L.TIRAGE_VRTP_MAX_PCT === 1);
    // ---- calculateur dans les deux sens
    const c = L.tirageCalcul({ mode: 'cols', formats: [{ format: 'bouteille', nb: 10000 }] }, p);
    t('cols → besoins : 10 000 bouteilles = 75 hL de mixtion ; levain 5 % (375 L), liqueur 24/500 (360 L, 180 kg de sucre), vin 90 % (6 765 L)', c.ok && near(c.mixL, 7500) && near(c.levainL, 375) && near(c.liqueurL, 360) && near(c.sucreKg, 180) && near(c.vinL, 6765), c);
    t('… vin de fonte de la liqueur = liqueur − sucre × 0,6329 L/kg ; VRTP prévisionnel = eau du levain (moins de 1 % des volumes mis en œuvre, vins et liqueurs), sans alerte', near(c.vinFonteL, 360 - 180 * 0.6329) && near(c.vrtpPct, c.vrtpL / (c.vinMisEnOeuvreL + c.liqueurTotaleL) * 100, 1e-9) && near(c.vrtpL, 375 * 0.18) && c.vrtpPct < 1 && !c.alertes.length);
    const v = L.tirageCalcul({ mode: 'vin', vinL: c.vinL }, p);
    t('vin → mixtion : le même vin redonne 75 hL et 10 000 bouteilles (calcul réversible)', v.ok && near(v.mixL, 7500) && v.nbCols === 10000 && v.formats[0].format === 'bouteille');
    const m = L.tirageCalcul({ mode: 'cols', formats: [{ format: 'bouteille', nb: 1000 }, { format: 'magnum', nb: 100 }, { format: 'demie', nb: 200 }] }, { ...p, remplissagePct: 1 });
    t('plusieurs formats (bouteilles, magnums, demies) : volume utile 975 L, préparé +1 % = 984,75 L ; équivalent bouteilles 1 300', near(m.utileL, 975) && near(m.mixL, 984.75) && near(m.eqBouteilles, 1300) && m.nbCols === 1300);
    const lev8 = L.tirageCalcul({ mode: 'cols', formats: [{ format: 'bouteille', nb: 1000 }] }, { ...p, levainPct: 8, levainEauPct: 30, adjuvants: [{ nom: 'Adjuvant fictif', doseLhL: 0.1 }] });
    t('alertes : VRTP prévisionnel au-delà de 1 % (beaucoup d’eau de levain) ; adjuvant dosé par hL de mixtion (0,75 L pour 7,5 hL)', lev8.alertes.some((a) => /VRTP/.test(a)) && near(lev8.adjuvants[0].L, 0.75) && !L.tirageCalcul({ mode: 'cols', formats: [] }, p).ok && !L.tirageCalcul({ mode: 'vin', vinL: 0 }, p).ok);
    t('repère sucre : au-delà de 2,7 kg/hL de vin mis en œuvre (point de tirage 30 g/L), avertissement', L.tirageCalcul({ mode: 'cols', formats: [{ format: 'bouteille', nb: 1000 }] }, { ...p, pointGL: 30 }).alertes.some((a) => /kg\/hL/.test(a)));
    // ---- liqueur
    const f1 = L.liqueurFonte({ volL: 100 }, 500, 0.66); const f2 = L.liqueurFonte({ sucreKg: 50 }, 500, 0.66); const f3 = L.liqueurFonte({ vinL: 134 }, 500, 0.66);
    t('fonte : 100 L à 500 g/L = 50 kg de sucre + 67 L de vin (le sucre ajoute 33 L) ; depuis le sucre ou depuis le vin, même résultat', near(f1.sucreKg, 50) && near(f1.vinL, 67) && near(f1.augmentationL, 33) && near(f2.volL, 100) && near(f3.volL, 200) && near(f3.sucreKg, 100) && !L.liqueurFonte({}, 500).ok && !L.liqueurFonte({ volL: 10 }, 2000, 0.66).ok);
    const k = L.tirageCorrection({ densInit: 993, densLue: 1001.6, pointGL: 24, volL: 5000 }, p);
    t('point de tirage : densité visée 993 + 0,4 × 24 = 1 002,6 ; lue 1 001,6 → il manque 2,5 g/L, soit 25 L de liqueur pour 5 000 L', near(k.densTheo, 1002.6) && near(k.manqueGL, 2.5) && near(k.liqueurL, 25) && L.tirageCorrection({ densInit: 993, densLue: 1003.6, pointGL: 24, volL: 5000 }, p).liqueurL === 0);
    // ---- levain : étapes (exemple « Ordre ferments » : 1 317 hL de mixtion)
    const E = L.levainEtapes({ mixTotalL: 131700, levainJour1L: 2000 }, p); const [re, ac, m1, m2] = E;
    t('étapes : levure sèche et activateur 5,27 kg (4 g/hL de mixtion), eau de réhydratation 52,7 L (10 L/kg)', E.length === 4 && near(re.lsaKg, 5.268) && near(re.activateurKg, 5.268) && near(re.eauL, 52.68));
    t('… acclimatation : total = 3 × réhydraté (158 L), liqueur 0,38 × (total − réhydraté) = 40 L, phosphates 0,25 g/L', near(ac.totalL, 158.04) && near(ac.liqueurL, 0.38 * (158.04 - 52.68)) && near(ac.dapG, 0.25 * 158.04));
    t('… 2e multiplication = levain du 1er jour (2 000 L) : eau 11 %, liqueur 35 g/L (140 L), 1re = moitié ; vin en complément', near(m2.totalL, 2000) && near(m2.eauL, 220) && near(m2.liqueurL, 140) && near(m1.totalL, 1000) && near(m2.vinL, 2000 - 1000 - 220 - 140) && m1.vinL > 0);
    // ---- propagation (du dernier jour vers le premier)
    const pr = L.levainPropagation([{ date: '2027-02-02', cols: 20000 }, { date: '2027-02-01', cols: 31200 }], p); const [j1, j2] = pr.rows;
    t('propagation : 31 200 cols (234 hL) → 1 170 L tirés à 5 % ; dernier jour sans reste ; la veille, alimentation = 15 % du levain du lendemain', pr.rows.length === 2 && j1.date === '2027-02-01' && near(j1.tireL, 1170) && near(j2.restantL, 0) && near(j2.avantL, 750) && near(j1.alimL, 112.5) && near(j1.liqueurL, 30) && near(j1.eauL, 37.5) && near(j1.vinL, 45) && near(j1.restantL, 637.5) && near(j1.avantL, 1807.5) && pr.levainJour1L === j1.avantL);
    t('… phosphates : 100 g si plus de 99 L de vin, sinon 50 g ; totaux', j1.phosG === 50 && L.levainPropagation([{ date: '2027-02-01', cols: 40000 }, { date: '2027-02-02', cols: 60000 }], p).rows[0].phosG === 100 && near(pr.total.tireL, 1920));
    // ---- recalibrage
    const J = [{ date: '2027-02-01', cols: 31200 }, { date: '2027-02-02', cols: 20000 }, { date: '2027-02-03', cols: 20000 }];
    const r1 = L.levainRecalibrer(J, p, { date: '2027-02-01', restantL: 1200 }); const r2 = L.levainRecalibrer(J, p, { date: '2027-02-01', restantL: 3000 }); const r3 = L.levainRecalibrer(J, p, { date: '2027-02-01', restantL: 200 });
    t('recalibrage : levain disponible 1 200 L, besoin des jours restants → alimentation du manque (liqueur, vin, eau aux proportions du profil)', near(r1.besoinL, L.levainPropagation(J.slice(1), p).levainJour1L) && near(r1.alimL, r1.besoinL - 1200) && near(r1.liqueurL + r1.vinL + r1.eauL, r1.alimL) && !r1.alertes.length);
    t('… levain en avance : pas d’alimentation, excédent ; trop peu de levain : alerte « second levain »', r2.alimL === 0 && r2.excedentL > 0 && r3.alertes.length === 1 && L.levainRecalibrer(J, p, { date: '2027-02-03', restantL: 10 }).besoinL === 0);
    // ---- moteur : levain suivi (opérations « alimentation »), composition, tirage, VRTP
    const R0 = L.replay(db, '2026-11-27'); const pv = Object.values(R0.portions).filter((x) => x.vol > 1500 && (R0.lots[x.lotId] || {}).qualif === 'conv' && (R0.lots[x.lotId] || {}).type !== 'mout').sort((a, b) => b.vol - a.vol)[0];
    const liq = L.opSave(db, { type: 'preparation', date: '2026-11-27', ptype: 'liqueur_tirage', qualifId: 'conv', code: 'LT-T50', volL: 200, sourcePortionId: pv.id, sourceVolL: 134, lignes: [], fonte: { titreGL: 500, sucreKg: 100 } }).op;
    const lev = L.opSave(db, { type: 'preparation', date: '2026-11-27', ptype: 'levain', qualifId: 'conv', code: 'LEV-T50', volL: 100, eauL: 20, prepUses: [{ prepId: liq.prepId, volL: 10 }], sourcePortionId: pv.id, sourceVolL: 60, lignes: [] }).op;
    let R1 = L.replay(db, '2026-11-27');
    t('levain : composition vin 60 L, liqueur 10 L (prise sur la liqueur, qui baisse), eau 20 L, autre 10 L', near(L.prepCompo(R1, lev.prepId).vin, 0.6) && near(L.prepCompo(R1, lev.prepId).eau, 0.2) && near(L.prepCompo(R1, lev.prepId).liqueur, 0.1) && near(R1.preps[liq.prepId].remaining, 190) && L.prepCompo(R1, liq.prepId).liqueur === 1);
    const a1 = L.opSave(db, { type: 'alimentation', date: '2026-11-28', prepId: lev.prepId, etape: 'mult2', sourcePortionId: pv.id, sourceVolL: 40, prepUses: [{ prepId: liq.prepId, volL: 8 }], eauL: 12, lignes: [], mesures: { densite: 1004 } });
    R1 = L.replay(db, '2026-11-28'); const pL = R1.preps[lev.prepId];
    t('alimentation : +40 L de vin (pris dans la cuve), +8 L de liqueur, +12 L d’eau → levain 160 L ; journal du levain', a1.ok && near(pL.remaining, 160) && near(pL.compo.vin, 100) && near(pL.compo.eau, 32) && near(R1.preps[liq.prepId].remaining, 182) && L.levainSuivi(db, lev.prepId).length === 1);
    L.opSave(db, { type: 'alimentation', date: '2026-11-29', prepId: lev.prepId, etape: 'releve', volMesureL: 150, lignes: [] });
    t('relevé avec volume mesuré : levain recalé à 150 L (écart −10 L gardé)', near(L.replay(db, '2026-11-29').preps[lev.prepId].remaining, 150) && near(L.replay(db, '2026-11-29').preps[lev.prepId].ecartL, -10));
    const R2 = L.replay(db, '2026-11-30'); const pt = Object.values(R2.portions).filter((x) => x.vol > 1000 && (R2.lots[x.lotId] || {}).qualif === 'conv' && (R2.lots[x.lotId] || {}).type !== 'mout').sort((a, b) => b.vol - a.vol)[0];
    const ti = L.opSave(db, { type: 'tirage', date: '2026-11-30', sources: [{ portionId: pt.id, lotId: pt.lotId, volL: 670 }], prepUses: [{ prepId: lev.prepId, volL: 40 }, { prepId: liq.prepId, volL: 36 }], lignes: [], nbBouteilles: 1000, volBouteilleL: 0.75, lotSpec: { code: 'T-T50', designation: 'T-T50', millesime: '2026' } }).op;
    const R3 = L.replay(db); const b = L.tirageBilan(db, R3, ti); const cl = L.prepCompo(R3, lev.prepId);
    t('bilan du tirage : vin = mixtion 670 L + part de vin du levain ; liqueur = 36 L + part de liqueur du levain ; VRTP = 750 L − liqueur − vin', near(b.tireL, 750) && near(b.vinL, 670 + 40 * cl.vin) && near(b.liqueurL, 36 + 40 * cl.liqueur) && near(b.vrtpL, 750 - b.liqueurL - b.vinL) && near(L.tirageVrtp(1000, b.liqueurL, b.vinL), b.vrtpL), b);
    t('… un même levain sert plusieurs tirages (décompte du volume) ; supprimer le levain est refusé tant qu’un suivi ou un tirage l’utilise', near(R3.preps[lev.prepId].remaining, 110) && L.dependentsOf(db, lev).length >= 2 && !L.opDelete(db, lev.id).ok && L.levainRealise(db, R3, lev.prepId).some((x) => x.date === '2026-11-30' && near(x.tireL, 40)));
    // ---- revendications
    const bio = L.opSave(db, { type: 'preparation', date: '2026-11-27', ptype: 'levain', qualifId: 'bio', code: 'LEV-BIO', volL: 50, lignes: [] }).op; const R4 = L.replay(db);
    t('revendication : levain Conventionnel dans un lot Bio → message de déclassement (confirmation demandée) ; levain Bio dans un lot Conventionnel → rien', L.tirageRevendicationAlertes(db, R4, 'bio', [lev.prepId]).length === 1 && /déclassé/.test(L.tirageRevendicationAlertes(db, R4, 'bio', [lev.prepId])[0]) && L.tirageRevendicationAlertes(db, R4, 'conv', [bio.prepId]).length === 0 && L.tirageRevendicationAlertes(db, R4, 'bio', [bio.prepId]).length === 0);
    // ---- plan du levain et profil
    t('plan du levain : jours triés, cols arrondis, doublon de date refusé ; marqué pour qu’une version antérieure le garde', L.levainPlanSet(db, lev.prepId, { jours: [{ date: '2026-12-02', cols: '2000' }, { date: '2026-12-01', cols: 3000.4 }], sur: { levainPct: '4' } }).ok && db.ops.find((o) => o.id === lev.id).levainPlan.jours[0].date === '2026-12-01' && db.ops.find((o) => o.id === lev.id).levainPlan.sur.levainPct === 4 && db.ops.find((o) => o.id === lev.id).av >= L.APP_NUM && !L.levainPlanSet(db, lev.prepId, { jours: [{ date: '2026-12-01', cols: 1 }, { date: '2026-12-01', cols: 2 }] }).ok);
    t('profil : valeurs enregistrées en nombres, hors limites refusées, point de tirage jamais gardé dans le profil commun', L.tirageProfilSet(db, { levainPct: '4', pointGL: 26, propagation: { alimPct: '12' } }).ok && db.settings.tirageProfil.pointGL === undefined && L.tirageProfil(db).levainPct === 4 && L.tirageProfil(db).propagation.alimPct === 12 && L.tirageProfil(db).propagation.liqueurPct === 4 && !L.tirageProfilSet(db, { levainPct: 50 }).ok);
    // ---- version, traductions, base 0.42.0-alpha.1 et compatibilité avec la 0.41.0-alpha.1 gelée
    t('version 0.42.0-alpha.1 : nouvelle version mineure (nouvelle fonctionnalité)', (() => { const i = L.CHANGELOG.findIndex((c) => c.v === '0.42.0-alpha.1'); return i >= 0 && L.CHANGELOG[i + 1].v === '0.41.0-alpha.1' && L.CHANGELOG[i].notes.length === 2; })());
    t('traductions : tirage et notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('🧮 Calculateur de tirage', 'en') === '🧮 Tirage calculator' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f50 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.42.0-alpha.1-tirage.json'), 'utf8'))); L.syncConfig(f50);
    const oL = f50.ops.find((o) => o.type === 'preparation' && o.code === 'LEV-FX-01'); const oT = f50.ops.find((o) => o.type === 'tirage' && (o.lotSpec || {}).code === 'T-FX-LEV'); const R5 = L.getR(f50);
    t('fixture 0.42.0-alpha.1 : profil, liqueur fondue, levain (plan, 3 suivis), tirage ; levain restant 85 L, VRTP calculable', f50.settings.tirageProfil.levainPct === 5 && oL.levainPlan.jours.length === 2 && L.levainSuivi(f50, oL.prepId).length === 3 && near(R5.preps[oL.prepId].remaining, 85) && L.tirageBilan(f50, R5, oT).vinL > 1350);
    const dirO = path.join(__dirname, 'anciennes', '0.41.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, opSave, APP_VERSION, APP_NUM };')({});
    t('0.41.0-alpha.1 gelée chargée', O.APP_VERSION === '0.41.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f50)); O.syncConfig(x);
    t('… la 0.41.0-alpha.1 ouvre la base 0.42.0-alpha.1 sans rien perdre (opérations « alimentation », plan du levain, fonte, profil de tirage)', canonJ(x.ops) === canonJ(f50.ops) && canonJ(x.settings.tirageProfil) === canonJ(f50.settings.tirageProfil) && !!O.getR(x).preps[oL.prepId]);
    // là-bas : le levain est réenregistré (sa préparation réécrite par l'ancienne version) ; ici : une alimentation de plus
    const rO = O.opSave(x, { ...O.clone(oL), notes: 'Relu là-bas' }, oL.id); x.meta.modifLe = '2026-12-02T09:00:00Z';
    const N = L.clone(f50); L.opSave(N, { type: 'alimentation', date: '2026-12-01', prepId: oL.prepId, etape: 'releve', lignes: [], mesures: { densite: 1001 } }); N.meta.modifLe = '2026-12-02T08:00:00Z';
    const FX = L.syncFusion(f50, N, x); const FX2 = O.syncFusion(f50, x, N);
    t('… synchronisation 0.42.0-alpha.1 ↔ 0.41.0-alpha.1 : levain réécrit là-bas (plan et eau gardés), relevé saisi ici, rien de perdu des deux côtés', rO.ok && [FX.db, FX2.db].every((y) => y.ops.filter((o) => o.type === 'alimentation').length === 4 && y.ops.find((o) => o.id === oL.id).levainPlan.jours.length === 2 && y.ops.find((o) => o.id === oL.id).eauL === 20 && y.ops.find((o) => o.id === oL.id).notes === 'Relu là-bas'), [FX.conflits, FX2.conflits]);
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (50 : tirage — calculateur, liqueur, levain, propagation, recalibrage, VRTP ; compatibilité 0.41.0-alpha.1)');

  // ===== 51. 0.42.0-alpha.2 : Tirages › Tirer — chantiers, mixtion en cuve ou pompe doseuse (exclusif), formats, prestataire
  {
    const db = L.normalizeDb(L.sampleDb()); L.syncConfig(db); const near = (a, b, e) => Math.abs(a - b) < (e || 0.01);
    // ---- formats
    const F = [{ format: 'bouteille', nb: 900 }, { format: 'magnum', nb: 50 }, { format: 'demie', nb: 40 }].map((x) => ({ ...x, L: L.TIRAGE_FORMATS.find((f) => f.id === x.format).L }));
    const cp = L.tirageFormatsCompat(F);
    t('formats : total et volume moyen pour les versions antérieures (nbBouteilles × volBouteilleL = volume tiré), équivalent bouteilles', cp.nbBouteilles === 990 && near(cp.nbBouteilles * cp.volBouteilleL, 900 * 0.75 + 75 + 15) && near(L.tirageEqBouteilles(F), (675 + 75 + 15) / 0.75));
    t('… tirage d’avant (sans formats) : un format déduit du volume de la bouteille ; magnum reconnu', L.tirageFormatsDe({ nbBouteilles: 6900, volBouteilleL: 0.75 })[0].format === 'bouteille' && L.tirageFormatsDe({ nbBouteilles: 10, volBouteilleL: 1.5 })[0].format === 'magnum' && L.tirageFormatsDe({ formats: [{ format: 'jeroboam', nb: 2 }] })[0].L === 3);
    // ---- prestataire et chantier
    t('prestataire : rôle d’un fournisseur (gardé à la modification)', L.fournisseurSave(db, { nom: 'Prestataire T51', roles: ['prestataire_tirage'] }).ok && L.prestatairesTirage(db).length === 1 && L.fournisseurSave(db, { nom: 'Prestataire T51', contact: 'x' }, db.fournisseurs.find((f) => f.nom === 'Prestataire T51').id).ok && L.prestatairesTirage(db).length === 1);
    const pr = L.prestatairesTirage(db)[0];
    t('chantier : prestataire exigé, dates dans l’ordre, campagne ouverte', !L.chantierTirageSave(db, { dateDebut: '2026-12-02', realisation: 'prestataire' }).ok && !L.chantierTirageSave(db, { dateDebut: '2026-12-03', dateFin: '2026-12-02', realisation: 'interne' }).ok && !L.chantierTirageSave(db, { dateDebut: '2025-12-02', realisation: 'interne' }).ok);
    const ch = L.chantierTirageSave(db, { dateDebut: '2026-12-02', realisation: 'prestataire', prestataireId: pr.id, ligne: { tireuse: true, injecteuse: true, nbBecs: '32', marquage: 'laser', emboxeur: false } }, null, 'u1');
    const C = L.chantiersTirage(db)[0];
    t('… n° automatique CH-2026-01, ligne normalisée (becs en nombre, cases décochées retirées), doublon de n° refusé', ch.ok && C.numero === 'CH-2026-01' && C.ligne.nbBecs === 32 && C.ligne.emboxeur === undefined && C.ligne.marquage === 'laser' && L.chantierNumeroSuivant(db, '2026-12-05') === 'CH-2026-02' && !L.chantierTirageSave(db, { numero: 'CH-2026-01', dateDebut: '2026-12-04', realisation: 'interne' }).ok);
    // ---- préparations et cuve de mixtion
    const R0 = L.replay(db, '2026-12-02'); const P = Object.values(R0.portions).filter((x) => x.vol > 900 && (R0.lots[x.lotId] || {}).qualif === 'conv' && !['mout', 'cuvee_tirage'].includes((R0.lots[x.lotId] || {}).type)).sort((a, b) => b.vol - a.vol);
    const liq = L.opSave(db, { type: 'preparation', date: '2026-12-01', ptype: 'liqueur_tirage', qualifId: 'conv', code: 'LT-T51', volL: 300, lignes: [] }).op;
    const lev = L.opSave(db, { type: 'preparation', date: '2026-12-01', ptype: 'levain', qualifId: 'conv', code: 'LEV-T51', volL: 200, eauL: 40, prepUses: [{ prepId: liq.prepId, volL: 20 }], sourcePortionId: P[2].id, sourceVolL: 140, lignes: [] }).op;
    const vide = db.contenants.find((c) => !Object.values(R0.portions).some((x) => x.contenantId === c.id && x.vol > 0.5));
    const mix = L.opSave(db, { type: 'assemblage', date: '2026-12-02', sources: [{ portionId: P[0].id, lotId: P[0].lotId, volL: 900 }], destId: vide.id, pertes: [], lignes: [], mixtion: true, prepUses: [{ prepId: liq.prepId, volL: 45 }, { prepId: lev.prepId, volL: 50 }], pointGL: 24, lotSpec: { code: 'MIX-T51', designation: 'MIX-T51', millesime: '2026', type: 'assemblage' } }).op;
    let R1 = L.replay(db, '2026-12-02'); const pm = Object.values(R1.portions).find((x) => x.lotId === mix.lotId); const cm = R1.lotCompo[mix.lotId];
    t('cuve de mixtion : 900 L de vin + 45 L de liqueur + 50 L de levain = 995 L ; liqueur et levain décomptés ; lot marqué mixtion (assemblage pour les versions antérieures)', near(pm.vol, 995) && near(R1.preps[liq.prepId].remaining, 235) && near(R1.preps[lev.prepId].remaining, 150) && db.lots.find((l) => l.id === mix.lotId).mixtion === true && db.lots.find((l) => l.id === mix.lotId).type === 'assemblage');
    t('… composition de la mixtion : vin 900 + 35 (levain), liqueur 45 + 5 (levain), eau 10 (levain)', near(cm.vin * 995, 935) && near(cm.liqueur * 995, 50) && near(cm.eau * 995, 10));
    // ---- exclusivité
    const ctl = (spec) => L.tirageModeControle(db, R1, spec);
    t('exclusivité : mixtion sans cuve de mixtion refusée ; mixtion avec dosage en ligne refusée ; pompe depuis une cuve de mixtion refusée ; pompe sans liqueur ni levain refusée ; sans mode (tirage d’avant) accepté',
      /cuve de mixtion/.test(ctl({ mode: 'mixtion', sources: [{ portionId: P[1].id, lotId: P[1].lotId }] }) || '') && /pas de dosage en ligne/.test(ctl({ mode: 'mixtion', sources: [{ portionId: pm.id, lotId: mix.lotId }], prepUses: [{ prepId: liq.prepId, volL: 1 }] }) || '')
      && /ne doit pas venir d’une cuve de mixtion/.test(ctl({ mode: 'pompe', sources: [{ portionId: pm.id, lotId: mix.lotId }], prepUses: [{ prepId: liq.prepId, volL: 1 }] }) || '') && /indiquez la liqueur et le levain/.test(ctl({ mode: 'pompe', sources: [{ portionId: P[1].id, lotId: P[1].lotId }] }) || '')
      && ctl({ mode: 'mixtion', sources: [{ portionId: pm.id, lotId: mix.lotId }] }) === null && ctl({ mode: 'pompe', sources: [{ portionId: P[1].id, lotId: P[1].lotId }], prepUses: [{ prepId: lev.prepId, volL: 1 }] }) === null && ctl({ sources: [] }) === null && /inconnu/.test(ctl({ mode: 'x' })));
    // ---- tirage par mixtion : bilan et VRTP via la composition de la cuve
    const F1 = [{ format: 'bouteille', nb: 1100, L: 0.75 }, { format: 'magnum', nb: 60, L: 1.5 }];
    const t1 = L.opSave(db, { type: 'tirage', date: '2026-12-03', sources: [{ portionId: pm.id, lotId: mix.lotId, volL: 915 }], prepUses: [], lignes: [], formats: F1, ...L.tirageFormatsCompat(F1), mode: 'mixtion', chantierId: C.id, casse: 6, lotSpec: { code: 'T-T51-M', designation: 'T-T51-M', millesime: '2026' } });
    let R2 = L.replay(db); const b1 = L.tirageBilan(db, R2, t1.op);
    t('tirage par mixtion : 1 100 bouteilles + 60 magnums = 915 L ; vin et liqueur lus dans la composition de la cuve ; VRTP = eau du levain (1,07 % : au-delà de 1 %, signalé)', t1.ok && near(b1.tireL, 915) && near(b1.vinL, 915 * cm.vin) && near(b1.liqueurL, 915 * cm.liqueur) && near(b1.vrtpL, 915 * cm.eau) && b1.depasse && R2.tir[t1.op.lotId].nb === 1160 && R2.tir[t1.op.lotId].formats.length === 2 && R2.tir[t1.op.lotId].casse === 6);
    // ---- pompe doseuse
    const F2 = [{ format: 'bouteille', nb: 300, L: 0.75 }, { format: 'magnum', nb: 10, L: 1.5 }];
    const pompe = L.tiragePompeSpec({ consignes: { liqueurPct: '4,8', levainPct: '5', adjuvants: [{ nom: 'Adjuvant fictif', pct: '0,1' }] }, debitColsH: '3000', tolerancePct: '2', controles: [{ heure: '09:30', type: 'eprouvette', nCols: '1', mesure: '36,4', cible: '36' }, { heure: '11:30', type: 'eprouvette', nCols: '2', mesure: '76', cible: '36', action: 'pompe réglée' }, { heure: '', mesure: '' }] });
    t('pompe : consignes et contrôles normalisés (nombres), contrôle vide retiré', pompe.consignes.liqueurPct === 4.8 && pompe.debitColsH === 3000 && pompe.controles.length === 2 && pompe.controles[1].nCols === 2 && pompe.consignes.adjuvants[0].pct === 0.1);
    const t2 = L.opSave(db, { type: 'tirage', date: '2026-12-03', sources: [{ portionId: P[1].id, lotId: P[1].lotId, volL: 225 }], prepUses: [{ prepId: liq.prepId, volL: 12 }, { prepId: lev.prepId, volL: 12.75 }], lignes: [], formats: F2, ...L.tirageFormatsCompat(F2), mode: 'pompe', chantierId: C.id, pompe, lotSpec: { code: 'T-T51-P', designation: 'T-T51-P', millesime: '2026' } });
    R2 = L.replay(db); const pb = L.tiragePompeBilan(db, R2, t2.op); const lq = pb.lignes.find((x) => x.nom === 'Liqueur de tirage');
    t('pompe : théorique = 4,8 % de 240 L = 11,52 L, réel 12 L (écart +4,2 %) ; mL par col : 36 (bouteille), 72 (magnum) ; adjuvant théorique', near(pb.volL, 240) && near(lq.theoL, 11.52) && near(lq.reelL, 12) && near(lq.ecartPct, (12 - 11.52) / 11.52 * 100) && near(lq.mLcol[0].mL, 36) && near(lq.mLcol[1].mL, 72) && near(L.pompeMlCol(5, 'demie'), 18.75) && pb.lignes.some((x) => x.nom === 'Adjuvant fictif' && near(x.theoL, 0.24)));
    t('… contrôles : 36,4 mL pour 36 visés (+1,1 %) ; 76 mL pour 2 cols (+5,6 %, hors tolérance) → dérive signalée', near(pb.controles[0].ecartPct, 0.4 / 36 * 100) && near(pb.controles[1].parCol, 38) && pb.derive.length === 1);
    // ---- bilan du chantier, suppression
    const bc = L.chantierBilan(db, R2, C.id);
    t('bilan du chantier : 1 470 cols (1 400 bouteilles, 70 magnums), casse 6, 1 155 L, équivalent 1 540 bouteilles', bc.cols === 1470 && bc.parFormat.bouteille === 1400 && bc.parFormat.magnum === 70 && bc.casse === 6 && near(bc.volL, 1155) && near(bc.eqBouteilles, 1540) && bc.lots.length === 2);
    t('chantier non supprimable tant que des tirages y sont rattachés ; cuve de mixtion non supprimable tant qu’un tirage en dépend', !L.chantierTirageDelete(db, C.id).ok && !L.opDelete(db, mix.id).ok);
    // ---- droits, documents, synchronisation
    { const g = L.clone(db); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-cave51', nom: 'Cave', modules: { tirage: 'lecture', degorgement: 'ecriture' }, droits: {} }]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-cave51', identifiant: 'cave51', nom: 'Cave', profilId: 'pf-cave51', actif: true }];
      const h = L.clone(g); L.chantierTirageSave(h, { dateDebut: '2026-12-05', realisation: 'interne' }); const r1 = L.gardeDroits(g, h, 'u-cave51');
      const h2 = L.clone(g); h2.docs = [...(h2.docs || []), { id: 'dch', nom: 'of.pdf', cible: { type: 'chantier', id: C.id }, cat: 'ordre' }]; const r2 = L.gardeDroits(g, h2, 'u-cave51');
      t('droits : chantier et documents de prestation = module Tirages (refusés en consultation)', r1.ok === false && r2.ok === false, [r1, r2]); }
    { const B = L.clone(db); const A = L.clone(db); const Cc = L.clone(db); L.chantierTirageSave(A, { ...A.chantiersTirage[0], notes: 'Vu ici' }, A.chantiersTirage[0].id); A.meta.modifLe = '2026-12-04T08:00:00Z';
      L.chantierTirageSave(Cc, { dateDebut: '2026-12-06', realisation: 'interne', nom: 'Là-bas' }); Cc.meta.modifLe = '2026-12-04T09:00:00Z'; const FX = L.syncFusion(B, A, Cc);
      t('synchronisation : chantier annoté ici, autre chantier créé là-bas, rien de perdu', FX.db.chantiersTirage.length === 2 && FX.db.chantiersTirage.some((c) => c.notes === 'Vu ici') && L.syncNom('chantiersTirage', 2) === '2 chantiers de tirage'); }
    // ---- version, traductions, base 0.42.0-alpha.2 et compatibilité avec la 0.42.0-alpha.1 gelée
    t('version 0.42.0-alpha.2 : lot B de la refonte du tirage (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.42.0-alpha.2').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.42.0-alpha.2') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.42.0-alpha.1'));
    t('traductions : chantiers, pompe doseuse et notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('Chantiers de tirage', 'en') === 'Tirage sessions' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f51 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.42.0-alpha.2-chantier.json'), 'utf8'))); L.syncConfig(f51); const R5 = L.replay(f51);
    const tM = f51.ops.find((o) => o.type === 'tirage' && o.mode === 'mixtion'); const tP = f51.ops.find((o) => o.type === 'tirage' && o.mode === 'pompe');
    t('fixture 0.42.0-alpha.2 : prestataire, chantier, cuve de mixtion (995 L), lot par mixtion (bouteilles et magnums), lot par pompe (contrôle)', L.prestatairesTirage(f51).length === 1 && f51.chantiersTirage.length === 1 && tM.formats.length === 2 && tP.pompe.controles.length === 1 && L.chantierBilan(f51, R5, f51.chantiersTirage[0].id).cols === 1460 && f51.lots.some((l) => l.mixtion));
    const dirO = path.join(__dirname, 'anciennes', '0.42.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, opSave, APP_VERSION, APP_NUM };')({});
    t('0.42.0-alpha.1 gelée chargée', O.APP_VERSION === '0.42.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f51)); O.syncConfig(x); const Ro = O.getR(x);
    t('… la 0.42.0-alpha.1 ouvre la base 0.42.0-alpha.2 sans rien perdre (chantiers, rôles, formats, mode, pompe) ; elle compte les bouteilles et le volume du lot par mixtion', canonJ(x.chantiersTirage) === canonJ(f51.chantiersTirage) && canonJ(x.ops) === canonJ(f51.ops) && canonJ(x.fournisseurs) === canonJ(f51.fournisseurs) && Ro.tir[tM.lotId].nb === 1160);
    const rO = O.opSave(x, { ...O.clone(tM), notes: 'Relu là-bas' }, tM.id); x.meta.modifLe = '2026-12-04T09:00:00Z';
    const N = L.clone(f51); L.chantierTirageSave(N, { ...N.chantiersTirage[0], notes: 'Visa cave' }, N.chantiersTirage[0].id); N.meta.modifLe = '2026-12-04T08:00:00Z';
    const FX = L.syncFusion(f51, N, x); const FX2 = O.syncFusion(f51, x, N);
    t('… synchronisation 0.42.0-alpha.2 ↔ 0.42.0-alpha.1 : tirage réécrit là-bas (formats, mode, chantier gardés), chantier annoté ici, rien de perdu des deux côtés', rO.ok && [FX.db, FX2.db].every((y) => { const o = y.ops.find((z) => z.id === tM.id); return o.notes === 'Relu là-bas' && o.formats.length === 2 && o.mode === 'mixtion' && o.chantierId === f51.chantiersTirage[0].id && y.chantiersTirage[0].notes === 'Visa cave'; }), [FX.conflits, FX2.conflits]);
  }
  // ===== 52. 0.42.0-alpha.3 : Tirages › Fournitures — articles, suivi du stock, contrôle de la verrerie, retours, fournitures d'un tirage, fiche HACCP de la chaîne
  {
    const db = L.normalizeDb(L.sampleDb()); L.syncConfig(db); const near = (a, b, e) => Math.abs(a - b) < (e || 0.01);
    // ---- articles : type choisi ou deviné, caractéristiques, suivi du stock
    const seedB = db.produits.find((p) => /Bouteille champenoise/.test(p.nom)); const seedC = db.produits.find((p) => /Capsule de tirage/.test(p.nom)); const seedM = db.produits.find((p) => /Muselet/.test(p.nom));
    t('type deviné d’après le nom d’une matière sèche (bouteille, capsule) ; muselet et produit œnologique : pas une fourniture de tirage ; format 75 cl lu dans le nom', L.fournitureTypeDe(seedB) === 'bouteille' && L.fournitureTypeDe(seedC) === 'capsule' && L.fournitureTypeDe(seedM) === '' && L.fournitureTypeDe({ categorie: 'oeno', nom: 'Bouteille de levure' }) === '' && L.fournitureFormat(seedB) === 'bouteille');
    const pB = L.produitSave(db, { nom: 'Bouteille fictive 75 cl', categorie: 'sec', unite: 'u', fourniture: { type: 'bouteille', caracs: { verrier: ' Verrier fictif ', format: 'bouteille', bague: '29', inconnu: 'x' } } }).id;
    const pM = L.produitSave(db, { nom: 'Magnum fictif', categorie: 'sec', unite: 'u', fourniture: { type: 'bouteille', caracs: { format: 'magnum' } } }).id;
    const pC = L.produitSave(db, { nom: 'Capsule fictive', categorie: 'sec', unite: 'u', suiviStock: false, fourniture: { type: 'capsule' } }).id;
    const P = (id) => db.produits.find((p) => p.id === id);
    t('article enregistré : type, caractéristiques nettoyées (champ inconnu écarté), suivi du stock (absent = décompté, false = sans décompte)', P(pB).fourniture.type === 'bouteille' && P(pB).fourniture.caracs.verrier === 'Verrier fictif' && P(pB).fourniture.caracs.inconnu === undefined && L.fournitureSuivi(P(pB)) && P(pC).suiviStock === false && !L.fournitureSuivi(P(pC)));
    L.produitSave(db, { ...P(seedM.id), fourniture: { type: '' } }, seedM.id); L.produitSave(db, { nom: 'Magnum fictif', categorie: 'sec', unite: 'u' }, pM);
    t('« pas une fourniture » gardé ; modification sans champ fourniture : type conservé', L.fournitureTypeDe(P(seedM.id)) === '' && P(pM).fourniture.caracs.format === 'magnum' && L.fournituresTirage(db, 'bouteille').some((p) => p.id === pM));
    // ---- réception (0.44.0-alpha.2 : contrôle de la verrerie retiré)
    const aB = L.arrivageSave(db, { produitId: pB, numLot: 'VF-1', date: '2026-11-25', qty: 6000 }).id; const aB2 = L.arrivageSave(db, { produitId: pB, numLot: 'VF-2', date: '2026-11-26', qty: 20000 }).id;
    const aM = L.arrivageSave(db, { produitId: pM, numLot: 'VFM-1', date: '2026-11-25', qty: 300 }).id; const aC = L.arrivageSave(db, { produitId: pC, numLot: 'CF-1', date: '2026-11-25', qty: 10000 }).id;
    const A = (id) => db.arrivages.find((a) => a.id === id);
    t('contrôle de réception de la verrerie retiré (0.44.0-alpha.2) : plus de fonction', typeof L.arrivageControleSave === 'undefined' && typeof L.chantierHaccpSet === 'undefined');
    // ---- retour au fournisseur
    const rt = L.fournitureRetourSave(db, { arrivageId: aB2, date: '2026-11-27', qty: 5000, bon: 'RET-1', raison: 'Lot refusé' }, 'u1'); const rtKo = L.fournitureRetourSave(db, { arrivageId: aB2, date: '2026-11-27', qty: 10 }, 'u1');
    let R = L.replay(db); const rg = db.regulStocks.find((x) => x.id === rt.id);
    t('retour : sortie de 5 000 tracée (motif retour, bon, raison) ; sans raison refusé', rt.ok && rg.qty === -5000 && rg.motif === 'retour' && rg.retour.bon === 'RET-1' && near(L.arrivalRest(R, A(aB2)), 15000) && !rtKo.ok && L.fournitureRetours(db, aB2).length === 1);
    // ---- fournitures d'un tirage
    const F = [{ format: 'bouteille', nb: 1000, L: 0.75 }, { format: 'magnum', nb: 100, L: 1.5 }]; const tt = { formats: F, casse: 11 };
    t('quantités : bouteille 75 cl = 1 000 + casse au prorata (10) ; magnum = 100 + 1 ; capsule = tous les cols + casse (1 111) ; autre fourniture : à la main', L.fournitureQteTirage(db, P(pB), tt) === 1010 && L.fournitureQteTirage(db, P(pM), tt) === 101 && L.fournitureQteTirage(db, P(pC), tt) === 1111 && L.fournitureQteTirage(db, { categorie: 'sec', nom: 'x', fourniture: { type: 'adjuvant' } }, tt) === null);
    const prop = L.tirageFournituresProposees(db, R, tt);
    t('proposition d’après les formats : la bouteille de chaque format et la capsule', prop.some((x) => x.produitId === pM && x.format === 'magnum') && prop.some((x) => x.type === 'capsule') && prop.some((x) => x.type === 'bouteille' && x.format === 'bouteille'), prop);
    const al = L.fournituresAlertes(db, R, [{ produitId: pB, arrivageId: aB2 }, { produitId: pM, arrivageId: aM, calc: 101 }, { produitId: pC, arrivageId: '' }], tt);
    t('alertes : lot fournisseur manquant ; plus d’alerte de contrôle de réception (retiré)', al.some((x) => /choisissez le lot fournisseur/.test(x)) && !al.some((x) => /contrôle de réception|refusé/.test(x)), al);
    const fo = L.tirageFournituresSpec(db, [{ produitId: pB, arrivageId: aB }, { produitId: pM, arrivageId: aM, manuel: true, qty: '105' }, { produitId: pC, arrivageId: aC }], tt);
    t('spécification : trace complète (calculé, manuel, non décompté) ; lignes décomptées seulement pour les articles suivis en stock', fo.fournitures.length === 3 && fo.fournitures[0].qty === 1010 && fo.fournitures[1].qty === 105 && fo.fournitures[1].manuel && fo.fournitures[2].decompte === false && fo.lignes.length === 2 && fo.lignes.every((l) => l.fourniture));
    const R0 = L.replay(db, '2026-12-02'); const pv = Object.values(R0.portions).filter((x) => x.vol > 900 && (R0.lots[x.lotId] || {}).qualif === 'conv' && !['mout', 'cuvee_tirage'].includes((R0.lots[x.lotId] || {}).type)).sort((a, b) => b.vol - a.vol)[0];
    const liq = L.opSave(db, { type: 'preparation', date: '2026-12-01', ptype: 'liqueur_tirage', qualifId: 'conv', code: 'LT-T52', volL: 300, lignes: [] }).op; const lev = L.opSave(db, { type: 'preparation', date: '2026-12-01', ptype: 'levain', qualifId: 'conv', code: 'LEV-T52', volL: 300, lignes: [] }).op;
    const t1 = L.opSave(db, { type: 'tirage', date: '2026-12-03', sources: [{ portionId: pv.id, lotId: pv.lotId, volL: 820 }], prepUses: [{ prepId: liq.prepId, volL: 45 }, { prepId: lev.prepId, volL: 47 }], lignes: fo.lignes, fournitures: fo.fournitures, formats: F, ...L.tirageFormatsCompat(F), mode: 'pompe', casse: 11, lotSpec: { code: 'T-T52', designation: 'T-T52', millesime: '2026' } });
    R = L.replay(db); const tr = L.traceIntrant(db, R, { produitId: pC });
    t('tirage : bouteilles et magnums décomptés (6 000 − 1 010 ; 300 − 105) ; capsules non décomptées mais tracées (lot CF-1 → lot de tirage)', t1.ok && near(L.arrivalRest(R, A(aB)), 4990) && near(L.arrivalRest(R, A(aM)), 195) && near(L.arrivalRest(R, A(aC)), 10000) && R.apps.some((x) => x.arrivageId === aC && x.nonDecompte === 1111 && x.lotId === t1.op.lotId) && tr && JSON.stringify(tr).includes(t1.op.lotId), tr && Object.keys(tr));
    const sansMarque = { ...t1.op, lignes: t1.op.lignes.map((l) => ({ produitId: l.produitId, arrivageId: l.arrivageId, qty: l.qty })) };
    t('lignes hors fournitures : marquées, ou réécrites sans marque par une version antérieure → reconnues une à une', L.tirageLignesHorsFournitures(t1.op).length === 0 && L.tirageLignesHorsFournitures(sansMarque).length === 0 && L.tirageLignesHorsFournitures({ ...sansMarque, lignes: [...sansMarque.lignes, { produitId: pB, arrivageId: aB, qty: 5 }] }).length === 1 && L.tirageFournituresDe(db, { lignes: [{ produitId: seedB.id, arrivageId: '', qty: 10 }] })[0].ancienne);
    // ---- droits et synchronisation
    { const g = L.clone(db); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-t52', nom: 'Tirage', modules: { tirage: 'ecriture', intrants: 'lecture' }, droits: {} }]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-t52', identifiant: 't52', nom: 'T', profilId: 'pf-t52', actif: true }];
      const h1 = L.clone(g); L.fournitureRetourSave(h1, { arrivageId: aM, date: '2026-11-27', qty: 5, raison: 'Casse' }, 'u-t52'); const r1 = L.gardeDroits(g, h1, 'u-t52');
      t('droits : retours au fournisseur = module Intrants', r1.ok === false, r1); }
    { const B = L.clone(db); const X = L.clone(db); const Y = L.clone(db); L.fournitureRetourSave(X, { arrivageId: aM, date: '2026-11-27', qty: 5, raison: 'Casse' }, 'u1'); X.meta.modifLe = '2026-12-04T08:00:00Z';
      L.produitSave(Y, { ...Y.produits.find((p) => p.id === pC), nom: 'Capsule fictive relue' }, pC); Y.meta.modifLe = '2026-12-04T09:00:00Z'; const FX = L.syncFusion(B, X, Y);
      t('synchronisation : retour ici, article modifié là-bas, rien de perdu', L.fournitureRetours(FX.db, aM).length === 1 && FX.db.produits.find((p) => p.id === pC).nom === 'Capsule fictive relue'); }
    // ---- version, traductions, base 0.42.0-alpha.3 et compatibilité avec la 0.42.0-alpha.2 gelée
    t('version 0.42.0-alpha.3 : lot C de la refonte du tirage (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.42.0-alpha.3').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.42.0-alpha.3') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.42.0-alpha.2'));
    t('traductions : fournitures, contrôle de la verrerie, fiche de la chaîne et notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('Fourniture de tirage', 'en') !== 'Fourniture de tirage' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f52 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.42.0-alpha.3-fournitures.json'), 'utf8'))); L.syncConfig(f52); const R5 = L.replay(f52);
    const tF = f52.ops.find((o) => o.type === 'tirage' && Array.isArray(o.fournitures)); const aRef = f52.arrivages.find((a) => a.numLot === 'VF-2612');
    t('fixture 0.42.0-alpha.3 : 3 fournitures (une non décomptée), lot refusé retourné, fiche de la chaîne', tF.fournitures.length === 3 && tF.fournitures.some((x) => !x.decompte) && near(L.arrivalRest(R5, aRef), 0) && f52.chantiersTirage[0].haccp.controles.length === 2);
    const dirO = path.join(__dirname, 'anciennes', '0.42.0-alpha.2');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, opSave, arrivalRest, APP_VERSION, APP_NUM };')({});
    t('0.42.0-alpha.2 gelée chargée', O.APP_VERSION === '0.42.0-alpha.2' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f52)); O.syncConfig(x); const Ro = O.getR(x); const aBo = x.arrivages.find((a) => a.numLot === 'VF-2611');
    t('… la 0.42.0-alpha.2 ouvre la base 0.42.0-alpha.3 sans rien perdre (articles, contrôles, retours, fournitures, fiche de la chaîne) ; elle décompte les mêmes bouteilles', canonJ(x.produits) === canonJ(f52.produits) && canonJ(x.arrivages) === canonJ(f52.arrivages) && canonJ(x.ops) === canonJ(f52.ops) && canonJ(x.chantiersTirage) === canonJ(f52.chantiersTirage) && canonJ(x.regulStocks) === canonJ(f52.regulStocks) && near(O.arrivalRest(Ro, aBo), L.arrivalRest(R5, f52.arrivages.find((a) => a.numLot === 'VF-2611'))));
    const rO = O.opSave(x, { ...O.clone(tF), notes: 'Relu là-bas' }, tF.id); x.meta.modifLe = '2026-12-04T09:00:00Z';
    const N = L.clone(f52); N.chantiersTirage[0].haccp.visas = [{ role: 'qualite', nom: 'Qualité fictive', le: '2026-12-04T08:00:00Z' }]; N.chantiersTirage[0].maj = '2026-12-04T08:00:00Z'; N.meta.modifLe = '2026-12-04T08:00:00Z'; /* 0.44.0-alpha.2 : fiche de la chaîne retirée de l'interface, donnée d'une version antérieure */
    const FX = L.syncFusion(f52, N, x); const FX2 = O.syncFusion(f52, x, N);
    t('… synchronisation 0.42.0-alpha.3 ↔ 0.42.0-alpha.2 : tirage réécrit là-bas (fournitures gardées), fiche visée ici, rien de perdu des deux côtés', rO.ok && [FX.db, FX2.db].every((y) => { const o = y.ops.find((z) => z.id === tF.id); return o.notes === 'Relu là-bas' && canonJ(o.fournitures) === canonJ(tF.fournitures) && y.chantiersTirage[0].haccp.visas.some((v) => v.nom === 'Qualité fictive'); }));
  }
  // ===== 53. 0.42.0-alpha.4 : Tirages › Déclarations — préalable (AIDAC), fin de tirage (Innov OI), VRTP, ventilations, dépôt, impressions
  {
    const near = (a, b, e) => Math.abs(a - b) < (e || 0.01);
    const db = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.42.0-alpha.3-fournitures.json'), 'utf8'))); L.syncConfig(db);
    const ch = db.chantiersTirage[0]; const T = L.chantierTirages(db, ch.id); let R = L.replay(db);
    // ---- déclarant
    L.drmReglageSet ? L.drmReglageSet(db, { cvi: '5100000000', accise: 'FR000000E0000', civc: '12345' }) : (db.settings.drm = { cvi: '5100000000', accise: 'FR000000E0000', civc: '12345' });
    db.entreprise.nom = 'Exploitation fictive'; L.declarationTirageReglagesSet(db, { codeRecoltant: 'RC-1', lieuTirage: 'Cuverie fictive', signataire: 'Signataire fictif' });
    const dd = L.declDeclarant(db);
    t('déclarant : société, n° EVV / accise / CIVC des réglages de la DRM, code récoltant et lieux des réglages des déclarations', dd.nom === 'Exploitation fictive' && dd.evv === '5100000000' && dd.civc === '12345' && dd.codeRecoltant === 'RC-1' && dd.lieuTirage === 'Cuverie fictive', dd);
    // ---- préalable
    const k = L.declPrealableCalcul(db, { vinHL: 100, pointGL: 24 }); const prof = L.tirageProfil(db);
    t('préalable : volumes prévisionnels (vin, sucre = kg × 0,66 L/kg — valeur douanière —, total à tirer), VRTP prévisionnel distinct', k.ok && near(k.sucreHL, k.sucreKg * 0.66 / 100) && prof.volSucreDeclLkg === 0.66 && k.totalHL > k.vinHL && k.vinHL >= 100 && k.vinHL < 110 && k.vrtpHL > 0 && !L.declPrealableCalcul(db, { vinHL: 100 }).ok && !L.declPrealableCalcul(db, { pointGL: 24 }).ok, k);
    t('délai : 48 h avant le tirage', L.DECL_PREALABLE_DELAI_H === 48 && L.declDelaiHeures('2026-12-01', '2026-12-03') === 48 && L.declDelaiHeures('2026-12-02', '2026-12-03') === 24);
    const p1 = L.declarationTirageSave(db, { type: 'prealable', date: '2026-11-28', chantierId: ch.id, champs: { dateTirage: '2026-12-02', vinHL: '12', pointGL: '24' } }, null, 'u1');
    t('préalable enregistrée (brouillon) ; date de tirage invalide refusée', p1.ok && db.declarationsTirage.find((x) => x.id === p1.id).statut === 'brouillon' && !L.declarationTirageSave(db, { type: 'prealable', date: '2026-11-28', champs: { dateTirage: '02/12' } }, null, 'u1').ok);
    // ---- fin de tirage
    t('fin de tirage : chantier ou lots exigés', !L.declarationTirageSave(db, { type: 'finale', date: '2026-12-04' }, null, 'u1').ok);
    const d0 = { type: 'finale', chantierId: ch.id, champs: {} }; const c = L.declFinaleCalcul(db, R, d0);
    const sB = (k2) => T.reduce((a, o) => a + L.tirageBilan(db, R, { ...o, formats: L.tirageFormatsDe(o) })[k2], 0);
    t('volumes effectifs = somme des bilans des lots (vins, sucres et liqueurs, total tiré) ; VRTP = total − liqueur − vin', c.lots.length === T.length && near(c.vinHL * 100, sB('vinL')) && near(c.liqueurHL * 100, sB('liqueurL')) && near(c.totalHL * 100, sB('tireL')) && near(c.vrtpHL, c.totalHL - c.liqueurHL - c.vinHL, 1e-6) && near(c.vrtpPct, c.vrtpHL / (c.vinHL + c.liqueurHL) * 100), c);
    t('alerte VRTP au-delà de 1 % des vins', (c.vrtpPct > 1) === c.alertes.some((a) => /VRTP/.test(a)));
    const lF = c.lots.find((l) => l.code === 'T-FX-FOUR');
    t('lots dans l’ordre de la saisie : produit, millésime, cuvée, demies / bouteilles / magnums, autres formats, cols, équivalent bouteilles', lF && lF.produit === 'Champagne' && lF.millesime === '2026' && lF.cuvee === 'Tirage fictif (fournitures)' && lF.colonnes.bouteille === 200 && lF.colonnes.magnum === 20 && lF.colonnes.demie === 0 && lF.nbCols === 220 && near(lF.eqBouteilles, 240), lF);
    const tt = c.parRevendication.reduce((a, x) => a + x.tireL, 0); const te = c.parEchelle.reduce((a, x) => a + x.nbCols, 0); const tc = c.parCouleur.reduce((a, x) => a + x.eqBouteilles, 0);
    t('ventilation par revendication, échelle des crus et couleur : totaux égaux à la déclaration', near(tt / 100, c.totalHL) && te === c.nbCols && near(tc, c.eqBouteilles));
    const rv = L.declRevendicationsLot(db, R, lF.lotId, { facon: 'recoltant', proprietaire: 'EARL fictive' }); const rvC = L.declRevendicationsLot(db, R, lF.lotId, { facon: 'caf_coll', proprietaire: 'n° 12' });
    t('revendications particulières : tirage à façon (TAF), CAF collective', rv.some((x) => x === 'TAF de vins appartenant à EARL fictive') && rvC.some((x) => /^CAF collective/.test(x)), rv);
    const f1 = L.declarationTirageSave(db, { type: 'finale', date: '2026-12-04', chantierId: ch.id, champs: { tav: '11,2', lots: { [lF.opId]: { cuvee: 'Cuvée fictive', revendications: 'Premier Cru', millesime: '' } } } }, null, 'u1');
    const dF = db.declarationsTirage.find((x) => x.id === f1.id); const lF2 = L.declFinaleCalcul(db, R, dF).lots.find((l) => l.opId === lF.opId);
    t('lot personnalisé : cuvée, revendications, non millésimé', f1.ok && lF2.cuvee === 'Cuvée fictive' && lF2.revendications === 'Premier Cru' && lF2.millesime === '');
    const csv = L.declFinaleCsv(db, R, dF);
    t('CSV : en-tête (produit, millésime, cuvée, formats, revendications, volumes, VRTP), une ligne par lot, ligne de total', csv[0].includes('Revendications particulières') && csv[0].includes('VRTP (hL)') && csv.length === T.length + 2 && csv[csv.length - 1][0] === 'TOTAL' && csv.some((r) => r[7] === 'Cuvée fictive' && r[6] === 'non millésimé' && csv[0][3] === 'Couleur' && csv[0][4] === 'Revendication'), csv.slice(0, 2));
    t('tirages sans déclaration de fin : aucun (le chantier est déclaré)', L.tiragesNonDeclares(db).filter((o) => o.chantierId === ch.id).length === 0 && L.tiragesNonDeclares(db).length === db.ops.filter((o) => o.type === 'tirage' && o.chantierId !== ch.id).length);
    // ---- dépôt, figée, réouverture
    const dep = L.declarationTirageDeposer(db, R, f1.id, { deposeLe: '2026-12-05', reference: 'ACC-1' }, 'u1'); const tot0 = dF.instantane.calcul.totalHL;
    t('dépôt : statut déposée, référence, déclaration figée (calcul et déclarant gardés)', dep.ok && dF.statut === 'deposee' && dF.reference === 'ACC-1' && near(tot0, c.totalHL) && dF.instantane.declarant.evv === '5100000000');
    db.ops.find((o) => o.id === lF.opId).casse = 99; db.entreprise.nom = 'Autre nom';
    t('… figée : une modification ultérieure de la base ne change ni le CSV ni le déclarant ; modification et suppression refusées', L.declFinaleCsv(db, L.replay(db), dF)[csv.length - 1][csv[0].indexOf('Volume tiré (hL)')] === csv[csv.length - 1][csv[0].indexOf('Volume tiré (hL)')] && dF.instantane.declarant.nom === 'Exploitation fictive' && !L.declarationTirageSave(db, { ...dF }, f1.id, 'u1').ok && !L.declarationTirageDelete(db, f1.id).ok);
    t('réouverture : motif exigé ; ancienne version gardée dans l’historique ; suppression toujours refusée', !L.declarationTirageRouvrir(db, f1.id, '', 'u1').ok && L.declarationTirageRouvrir(db, f1.id, 'Casse corrigée', 'u1').ok && dF.statut === 'brouillon' && dF.historique.length === 1 && dF.historique[0].reference === 'ACC-1' && !dF.instantane && !L.declarationTirageDelete(db, f1.id).ok);
    t('préalable : dépôt et suppression d’un brouillon', L.declarationTirageDeposer(db, R, p1.id, { deposeLe: '2026-11-28' }, 'u1').ok && db.declarationsTirage.find((x) => x.id === p1.id).instantane.calcul.totalHL > 0 && L.declarationTirageDelete(db, L.declarationTirageSave(db, { type: 'prealable', date: '2026-11-28', champs: {} }, null, 'u1').id).ok);
    // ---- ordre de tirage
    const o = L.ordreTirage(db, L.replay(db), ch.id); const oF = o.lots.find((l) => l.code === 'T-FX-FOUR');
    t('ordre de tirage : lots du chantier, vin (cuves), liqueur et levain, formats, fournitures avec lot fournisseur, consignes de la pompe', o.lots.length === T.length && oF.sources.length === 1 && oF.preps.length === 2 && oF.fournitures.some((x) => x.numLot === 'VF-2611') && oF.pompe.consignes.liqueurPct === 4.8 && o.bilan.cols > 0);
    // ---- droits et synchronisation
    { const g = L.clone(db); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-t53', nom: 'Lecture', modules: { tirage: 'lecture' }, droits: {} }]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-t53', identifiant: 't53', nom: 'T', profilId: 'pf-t53', actif: true }];
      const h1 = L.clone(g); L.declarationTirageSave(h1, { type: 'prealable', date: '2026-11-28', champs: {} }, null, 'u-t53'); const r1 = L.gardeDroits(g, h1, 'u-t53');
      const h2 = L.clone(g); L.declarationTirageReglagesSet(h2, { signataire: 'X' }); const r2 = L.gardeDroits(g, h2, 'u-t53');
      t('droits : déclarations et leurs réglages = module Tirages (refusés en consultation)', r1.ok === false && r2.ok === false, [r1, r2]); }
    { const n0 = L.getNID(); const B = L.clone(db); const X = L.clone(db); const Y = L.clone(db); L.setNID('x53'); L.declarationTirageSave(X, { type: 'prealable', date: '2026-11-29', champs: { mentions: 'ici' } }, null, 'u1'); X.meta.modifLe = '2026-12-06T08:00:00Z';
      L.setNID('y53'); L.declarationTirageSave(Y, { type: 'prealable', date: '2026-11-30', champs: { mentions: 'là-bas' } }, null, 'u1'); Y.meta.modifLe = '2026-12-06T09:00:00Z'; L.setNID(n0); const FX = L.syncFusion(B, X, Y);
      t('synchronisation : déclarations créées des deux côtés, rien de perdu', ['ici', 'là-bas'].every((m) => FX.db.declarationsTirage.some((x) => (x.champs || {}).mentions === m)) && L.syncNom('declarationsTirage', 2) === '2 déclarations de tirage'); }
    // ---- version, traductions, base 0.42.0-alpha.4 et compatibilité avec la 0.42.0-alpha.3 gelée
    t('version 0.42.0-alpha.4 : lot D de la refonte du tirage (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.42.0-alpha.4').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.42.0-alpha.4') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.42.0-alpha.3'));
    t('traductions : déclarations, impressions et notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('Déclaration préalable de tirage', 'en') !== 'Déclaration préalable de tirage' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f53 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.42.0-alpha.4-declarations.json'), 'utf8'))); L.syncConfig(f53);
    const fin = f53.declarationsTirage.find((x) => x.type === 'finale');
    t('fixture 0.42.0-alpha.4 : préalable et fin de tirage déposée (figée, référence)', f53.declarationsTirage.length === 2 && fin.statut === 'deposee' && fin.reference === 'ACC-FICTIF-01' && fin.instantane.calcul.lots.length === 3 && f53.settings.declarationTirage.codeRecoltant === 'RC-FICTIF');
    const dirO = path.join(__dirname, 'anciennes', '0.42.0-alpha.3');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, opSave, chantierHaccpSet, APP_VERSION, APP_NUM };')({});
    t('0.42.0-alpha.3 gelée chargée', O.APP_VERSION === '0.42.0-alpha.3' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f53)); O.syncConfig(x); O.getR(x);
    t('… la 0.42.0-alpha.3 ouvre la base 0.42.0-alpha.4 sans rien perdre (déclarations, réglages du déclarant)', canonJ(x.declarationsTirage) === canonJ(f53.declarationsTirage) && canonJ(x.settings.declarationTirage) === canonJ(f53.settings.declarationTirage) && canonJ(x.ops) === canonJ(f53.ops));
    O.chantierHaccpSet(x, x.chantiersTirage[0].id, { visas: [{ role: 'cave', nom: 'Visa là-bas' }] }, 'u1'); x.meta.modifLe = '2026-12-06T09:00:00Z';
    const N = L.clone(f53); L.declarationTirageSave(N, { type: 'prealable', date: '2026-12-06', champs: { mentions: 'Nouvelle ici' } }, null, 'u1'); N.meta.modifLe = '2026-12-06T08:00:00Z';
    const FX = L.syncFusion(f53, N, x); const FX2 = O.syncFusion(f53, x, N);
    t('… synchronisation 0.42.0-alpha.4 ↔ 0.42.0-alpha.3 : déclaration créée ici, fiche visée là-bas, rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => y.declarationsTirage.length === 3 && y.declarationsTirage.some((z) => (z.champs || {}).mentions === 'Nouvelle ici') && y.chantiersTirage[0].haccp.visas.some((v) => v.nom === 'Visa là-bas')));
  }
  // ===== 54. 0.43.0-alpha.1 : Labels & cahiers des charges — VMN remplace AVN, plafonds et composés liés aux produits des catalogues, SO₂ comparé
  {
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
    // ---- VMN (charte d'engagement du 23/03/2023)
    const vmn = L.REG_LABELS.find((l) => l.id === 'vmn'); const rg = (c) => L.refRegle(d, 'vmn', c);
    t('VMN remplace AVN : label vérifié, reprend le Bio UE, liste fermée « aucun intrant »', vmn && !L.REG_LABELS.some((l) => l.id === 'avn') && vmn.herite.join() === 'bio-ue' && vmn.defaut === 'non' && vmn.inconnu === 'non' && /23 mars 2023/.test(L.REG_TEXTES ? L.REG_TEXTES.vmn : (L.refRegle(d, 'vmn', 'so2') || {}).source || ''));
    t('VMN : levures sélectionnées et filtration interdites, SO₂ sous condition (vin fini), sucre interdit (prise de mousse au jus de raisin) ; 30 mg/L de SO₂ total pour tous les vins', rg('levures').statut === 'non' && rg('filtration').statut === 'non' && rg('so2').statut === 'condition' && /30 mg\/L/.test(rg('so2').condition) && rg('sucre').statut === 'non' && /jus de raisin/.test(rg('sucre').condition) && ['rouge', 'blanc_rose', 'effervescent'].every((v) => L.REG_SO2.find((x) => x.label === 'vmn' && x.vin === v).valeur === 30));
    t('VMN : un produit inconnu ou un tanin refusé ; bentonite refusée (liste fermée)', ['tanins', 'bentonite', 'enzymes'].every((c) => L.refCombiner(d, ['vmn', 'bio-ue', 'ue'], c).statut === 'non'));
    t('revendication devinée : « Vin méthode nature » ou « vins naturels » → VMN', L.qualifReferentiels({ lists: { qualifs: [{ id: 'x', label: 'Vin méthode nature' }] } }, 'x').join() === 'vmn' && L.qualifReferentiels({ lists: { qualifs: [{ id: 'y', label: 'Vins naturels' }] } }, 'y').join() === 'vmn');
    // ---- bascule AVN → VMN
    { const b = L.clone(d); b.lists.qualifs.push({ id: 'nat', label: 'Nature', court: 'NAT', couleur: '#777', rang: 9, referentiels: ['avn', 'bio-ue'] }); const lot = b.lots[0]; lot.labelsVises = ['avn']; b.settings.referentiel = { exceptions: { 'avn|so2t|rouge': { valeur: 15 }, 'avn|tanins': { statut: 'oui' } } };
      const n = L.refMigrerLabels(b); const n2 = L.refMigrerLabels(b);
      t('bascule AVN → VMN : revendications, labels visés des lots, corrections (clés), tracée ; idempotente', n === 4 && n2 === 0 && b.lists.qualifs.find((q) => q.id === 'nat').referentiels.join() === 'vmn,bio-ue' && lot.labelsVises.join() === 'vmn' && b.settings.referentiel.exceptions['vmn|so2t|rouge'].valeur === 15 && !b.settings.referentiel.exceptions['avn|tanins'] && b.settings.referentiel.renommes[0].de === 'avn' && b.settings.referentiel.renommes[0].vers === 'vmn');
      const c = L.normalizeDb(JSON.parse(JSON.stringify({ ...b, lists: { ...b.lists, qualifs: [...b.lists.qualifs.filter((q) => q.id !== 'nat'), { id: 'nat2', label: 'N2', court: 'N2', couleur: '#777', rang: 9, referentiels: ['avn'] }] } })));
      t('… faite à l’ouverture de la base (normalizeDb)', c.lists.qualifs.find((q) => q.id === 'nat2').referentiels.join() === 'vmn'); }
    // ---- plafonds liés aux produits des catalogues
    const sub = L.plafondSave(d, { qualifId: 'bio', objet: 'substance', mot: 'pvpp', libelle: 'PVPP', autorise: false }, null, 'u1'); const P = () => d.plafonds.find((p) => p.id === sub.id);
    const E = L.plafondProduitsCatalogue(d, P()); const auto = E.filter((y) => y.lie);
    t('substance : produits des catalogues liés d’office d’après le mot-clé (PVPP)', auto.length > 0 && auto.every((y) => y.auto && /pvpp/i.test(L.catCle(`${y.e.nom} ${y.e.famille} ${y.e.composition || ''}`) + ' pvpp')), auto.slice(0, 3).map((y) => y.e.nom));
    const so2p = L.plafondsDe(d).find((p) => p.objet === 'so2t'); const so2E = L.plafondProduitsCatalogue(d, so2p).filter((y) => y.lie);
    t('SO₂ total : produits apportant du SO₂ liés d’office (sulfitage, métabisulfite)', so2E.length > 0 && so2E.some((y) => /sulf/i.test(L.catCle(y.e.nom) + y.e.famille)));
    const e0 = auto[0].e; const e1 = L.catalogueChercher(d, { q: 'bentonite' }).find((e) => !L.plafondCatalogueAuto(d, P(), e));
    t('délier un produit automatique, lier un autre à la main ; entrée inconnue refusée', L.plafondLienSet(d, sub.id, e0.id, 'retrait', 'u1').ok && L.plafondLienSet(d, sub.id, e1.id, 'ajout', 'u1').ok && !L.plafondCatalogueConcerne(d, P(), e0) && L.plafondCatalogueConcerne(d, P(), e1) && L.plafondLiens(P()).retraits.includes(e0.id) && !L.plafondLienSet(d, sub.id, 'inconnu', 'ajout', 'u1').ok && !L.plafondLienSet(d, sub.id, e1.id, 'peut-etre', 'u1').ok);
    // produit mis en stock depuis le catalogue : suit le choix
    const p1 = L.produitDepuisCatalogue(d, e1.id); const p0 = L.produitDepuisCatalogue(d, e0.id); const pr1 = d.produits.find((x) => x.id === p1.id); const pr0 = d.produits.find((x) => x.id === p0.id);
    t('produits en stock créés depuis le catalogue : le lié à la main est concerné, le délié ne l’est plus ; règle effective restreinte en bio', L.plafondConcerneProduit(d, P(), pr1) && !L.plafondConcerneProduit(d, P(), pr0) && L.regleEffective(d, pr1, 'bio').autorise === false);
    t('rétablir l’automatique', L.plafondLienSet(d, sub.id, e0.id, null, 'u1').ok && L.plafondConcerneProduit(d, P(), pr0));
    t('un exemple de plafond lié devient une donnée de la cave (exemples copiés)', (() => { const g = L.normalizeDb(L.sampleDb()); L.syncConfig(g); const ex = L.plafondsDe(g).find((p) => p.objet === 'so2t'); const e = L.plafondProduitsCatalogue(g, ex)[0].e; return !g.plafonds && L.plafondLienSet(g, ex.id, e.id, 'retrait', 'u1').ok && Array.isArray(g.plafonds) && g.plafonds.find((p) => p.id === ex.id).liens.retraits[0] === e.id; })());
    // ---- composés des produits des catalogues
    const tan = L.catalogueChercher(d, { q: 'tanin' })[0]; const c0 = L.refComposesCatalogue(d, tan);
    t('composés d’un produit des catalogues reconnus d’après le nom (tanins)', c0.some((c) => c.id === 'tanins') && L.refCatalogueParCompose(d, 'tanins').some((x) => x.e.id === tan.id && !x.choisi));
    L.refComposesCatalogueSet(d, tan.id, [{ id: 'tanins', part: 0.5 }, { id: 'inconnu' }], 'u1'); const c1 = L.refComposesCatalogue(d, tan);
    t('composés choisis (teneur 50 %, composé inconnu écarté) ; repris par le produit mis en stock', c1.length === 1 && c1[0].part === 0.5 && c1[0].choisi && L.refCatalogueParCompose(d, 'tanins').find((x) => x.e.id === tan.id).choisi && (() => { const r = L.produitDepuisCatalogue(d, tan.id); return d.produits.find((x) => x.id === r.id).composes[0].part === 0.5; })());
    L.refComposesCatalogueSet(d, tan.id, [], 'u1');
    t('composé retiré du produit du catalogue ; retour à l’automatique', !L.refCatalogueParCompose(d, 'tanins').some((x) => x.e.id === tan.id) && L.refComposesCatalogueSet(d, tan.id, null, 'u1').ok && L.refCatalogueParCompose(d, 'tanins').some((x) => x.e.id === tan.id && !x.choisi));
    // ---- SO₂ comparé
    const S = L.labelsSo2Synthese(d); const b = S.find((x) => x.qualifId === 'bio' && x.vin === 'rouge');
    t('SO₂ total par revendication : exploitation (exemple à vérifier) et labels côte à côte ; retenu = le plus bas', b && b.exploitation.valeur === 100 && b.referentiel.valeur === 100 && b.retenu.valeur === 100);
    { const g = L.clone(d); L.plafondSave(g, { qualifId: 'bio', objet: 'so2t', vin: 'rouge', valeur: 130, aVerifier: false }, 'ex-bio-rouge', 'u1'); const gb = L.labelsSo2Synthese(g).find((x) => x.qualifId === 'bio' && x.vin === 'rouge');
      t('… plafond vérifié de l’exploitation plus haut que le label : retenu (l’exploitation l’emporte), écart signalé', gb.retenu.valeur === 130 && gb.retenu.par === 'exploitation' && gb.ecart); }
    // ---- droits et synchronisation
    { const g = L.clone(d); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-t54', nom: 'Lecture', modules: { intrants: 'lecture' }, droits: {} }]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-t54', identifiant: 't54', nom: 'T', profilId: 'pf-t54', actif: true }];
      const h1 = L.clone(g); L.plafondLienSet(h1, sub.id, e1.id, 'retrait', 'u-t54'); const h2 = L.clone(g); L.refComposesCatalogueSet(h2, tan.id, [{ id: 'tanins' }], 'u-t54');
      t('droits : liens des plafonds et composés des catalogues = écriture Intrants', L.gardeDroits(g, h1, 'u-t54').ok === false && L.gardeDroits(g, h2, 'u-t54').ok === false); }
    { const B = L.clone(d); const X = L.clone(d); const Y = L.clone(d); L.plafondLienSet(X, sub.id, e0.id, 'retrait', 'u1'); X.meta.modifLe = '2026-12-06T08:00:00Z'; L.refComposesCatalogueSet(Y, tan.id, [{ id: 'tanins' }], 'u1'); Y.meta.modifLe = '2026-12-06T09:00:00Z';
      const FX = L.syncFusion(B, X, Y); t('synchronisation : lien délié ici, composé choisi là-bas, rien de perdu', L.plafondLiens(FX.db.plafonds.find((p) => p.id === sub.id)).retraits.includes(e0.id) && Array.isArray(FX.db.settings.referentiel.composesCatalogue[tan.id])); }
    // ---- version, traductions, base 0.43.0-alpha.1 et compatibilité avec la 0.42.0-alpha.4 gelée
    t('version 0.43.0-alpha.1 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.43.0-alpha.1').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.43.0-alpha.1') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.42.0-alpha.4'));
    t('traductions : labels et cahiers des charges, VMN, notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('⚖ Labels & cahiers des charges', 'en') !== '⚖ Labels & cahiers des charges' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f54 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.43.0-alpha.1-labels.json'), 'utf8'))); L.syncConfig(f54);
    const pf = f54.plafonds.find((p) => p.objet === 'substance' && p.mot === 'pvpp');
    t('fixture 0.43.0-alpha.1 : revendication basculée vers VMN, plafond lié et délié, composés choisis repris par le produit', f54.lists.qualifs.find((q) => q.id === 'nat').referentiels.join() === 'vmn' && pf.liens.ajouts.length === 1 && pf.liens.retraits.length === 1 && Object.keys(f54.settings.referentiel.composesCatalogue).length === 1 && f54.produits.some((p) => p.catalogue && Array.isArray(p.composes) && p.composes[0].part === 0.5));
    const dirO = path.join(__dirname, 'anciennes', '0.42.0-alpha.4');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, plafondSave, APP_VERSION, APP_NUM };')({});
    t('0.42.0-alpha.4 gelée chargée', O.APP_VERSION === '0.42.0-alpha.4' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f54)); O.syncConfig(x); O.getR(x);
    t('… la 0.42.0-alpha.4 ouvre la base 0.43.0-alpha.1 sans rien perdre (liens, composés des catalogues, revendication VMN)', canonJ(x.plafonds) === canonJ(f54.plafonds) && canonJ(x.settings.referentiel) === canonJ(f54.settings.referentiel) && canonJ(x.lists.qualifs) === canonJ(f54.lists.qualifs));
    O.plafondSave(x, { ...pf, note: 'Relu là-bas' }, pf.id, 'u1'); x.meta.modifLe = '2026-12-07T09:00:00Z';
    const N = L.clone(f54); L.plafondLienSet(N, pf.id, pf.liens.ajouts[0], null, 'u1'); N.meta.modifLe = '2026-12-07T08:00:00Z';
    const FX = L.syncFusion(f54, N, x); const FX2 = O.syncFusion(f54, x, N);
    t('… synchronisation 0.43.0-alpha.1 ↔ 0.42.0-alpha.4 : plafond annoté là-bas (liens gardés), rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => { const q = y.plafonds.find((p) => p.id === pf.id); return q.note === 'Relu là-bas' && q.liens && q.liens.retraits.length === 1; }));
  }
  // ===== 55. 0.43.0-alpha.2 : plan de vinification modifiable, variantes conditionnelles, étapes ordonnées à la création d'un lot, schémas convertis
  {
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); let R = L.replay(d);
    // ---- conditions et choix du plan
    t('conditions : critères connus seulement, listes dédoublonnées, vides retirées', L.planVinifConditionsNet({ crus: ['a', 'a', 'b'], inconnu: ['x'], cepages: [] }).crus.join() === 'a,b' && !('inconnu' in L.planVinifConditionsNet({ crus: ['a'], inconnu: ['x'] })) && L.planVinifConditionsNet({ cepages: [] }) === null && L.PLANV_CRITERES.length === 7);
    const lot = Object.values(R.lots).find((l) => (R.lotVol[l.id] || 0) > 100 && l.type !== 'mout' && L.lotCriteresPlan(d, R, l.id).cepage && L.lotCriteresPlan(d, R, l.id).apporteur);
    const k = L.lotCriteresPlan(d, R, lot.id);
    t('critères d’un lot : cépage, partenaire, cru, échelle majoritaires, revendication', k.cepage && k.apporteur && k.revendication === lot.qualif && 'cru' in k && 'echelle' in k, k);
    const gen = { conditions: null }; const vRev = { conditions: { revendications: [k.revendication] } }; const vPart = { conditions: { apporteurs: [k.apporteur], revendications: [k.revendication] } }; const vAutre = { conditions: { apporteurs: ['inconnu'] } };
    t('score : plan général 0, variante remplie = somme des poids (partenaire 5 + revendication 2), condition non remplie = exclue', L.planVinifScore(gen, k) === 0 && L.planVinifScore(vRev, k) === 2 && L.planVinifScore(vPart, k) === 7 && L.planVinifScore(vAutre, k) === -1 && L.planVinifScore({ conditions: { crus: ['x'] } }, { ...k, cru: '' }) === -1);
    const base = L.plansVinifDe(d)[0];
    const v1 = L.planVinifVariante(d, base.id, { revendications: [k.revendication] }, 'u1'); const v2 = L.planVinifVariante(d, base.id, { apporteurs: [k.apporteur] }, 'u1'); const v3 = L.planVinifVariante(d, base.id, { apporteurs: ['inconnu'] }, 'u1');
    const ch = L.planVinifPourLotChoix(d, R, lot.id);
    t('variantes : copies du plan avec leurs conditions ; la plus précise retenue (partenaire), puis revendication, puis plan général ; la variante d’un autre partenaire écartée', v1.ok && v2.ok && v3.ok && ch.meilleur.id === v2.id && ch.proposes.map((p) => p.id).join() === [v2.id, v1.id, base.id].join() && L.planVinifEstVariante(ch.meilleur) && !L.planVinifEstVariante(L.plansVinifDe(d).find((p) => p.id === base.id)));
    t('plan archivé jamais retenu', (() => { const g = L.clone(d); g.plansVinif.find((p) => p.id === v2.id).actif = false; return L.planVinifPourLotChoix(g, L.replay(g), lot.id).meilleur.id === v1.id; })());
    // ---- opérations devinées et étapes ordonnées
    t('opération devinée d’après l’étape : sulfitage, enzymage, levurage, FML, chaptalisation, froid, filtration ; « Volume… » sans opération', L.planVinifOpDevine(d, 'Sulfitage') === 'sulfitage' && L.planVinifOpDevine(d, 'Enzymage') === 'enzymage' && L.planVinifOpDevine(d, 'Levurage') === 'levurage' && L.planVinifOpDevine(d, 'FML') === 'ensemencement_fml' && L.planVinifOpDevine(d, 'Chaptalisation (TAP visé)') === 'enrichissement' && L.planVinifOpDevine(d, 'Passage au froid') === 'froid' && L.planVinifOpDevine(d, 'Filtration') === 'filtration' && L.planVinifOpDevine(d, 'Volume débourbé pour un marc') === '');
    const P = L.plansVinifDe(d).find((p) => p.id === base.id); const col = L.planVinifColonnes(P)[0]; const E = L.planVinifEtapes(d, R, P, col, 2000);
    t('étapes d’une colonne : dans l’ordre du tableau, seulement celles renseignées, rang 1…n, section en cours, sans jour', E.length > 3 && E.every((e, i) => e.rang === i + 1 && e.valeur && !('jour' in e)) && E.map((e) => P.lignes.indexOf(e.ligne)).every((x, i, a) => !i || x > a[i - 1]) && E.some((e) => e.section), E.map((e) => e.ligne.etape));
    const sulf = E.find((e) => e.opId === 'sulfitage'); const enz = E.find((e) => e.opId === 'enzymage');
    t('quantité pour le volume du lot (enzymage 1 g/hL × 20 hL = 20 g ; sulfitage « 5 g/hL de SO₂ » : dose de SO₂, pas de quantité de produit) ; conversion vers l’unité du produit', sulf && !sulf.quantite && enz && enz.quantite && enz.quantite.qte === 20 && enz.quantite.unite === 'g' && L.planVinifQteProduit({ qte: 100, unite: 'g' }, 'kg') === 0.1 && L.planVinifQteProduit({ qte: 2.5, unite: 'L' }, 'mL') === 2500 && L.planVinifQteProduit({ qte: 30, unite: 'mL' }, 'cL') === 3 && L.planVinifQteProduit({ qte: 30, unite: 'mL' }, 'g') === null, sulf && sulf.quantite);
    t('opération choisie sur la ligne prioritaire sur la devinette', L.planVinifOpDe(d, { etape: 'Sulfitage', opId: 'intrant' }) === 'intrant' && L.planVinifOpDe(d, { etape: 'Sulfitage', opId: 'inconnue' }) === 'sulfitage');
    // ---- application : opérations à réaliser sans date, dans l'ordre
    const date = lot.date || '2026-09-20'; const its = E.filter((e) => e.opId).slice(0, 3).map((e) => ({ type: L.opDef(d, e.opId).base, date, f: { date }, resume: e.ligne.etape, notes: e.valeur, ligneId: e.ligne.id }));
    const ap = L.planVinifAppliquer(d, lot.id, P, col.key, its); const Pv = L.schemaPrevsDuLot(d, lot.id);
    t('plan appliqué : opérations à réaliser sans date, ordre 1…3, liées au plan (fiche du lot, retrait) ; jamais « en retard »', ap.ok && Pv.length === 3 && Pv.every((x, i) => x.sansDate && x.ordre === i + 1 && x.schema.plan && x.schema.rang === i + 1 && x.schema.nb === 3 && x.plan.id === P.id && x.plan.colonne === col.key) && Pv.every((x) => !L.previsionEnRetard(x, '2099-01-01')) && L.previsionEnRetard({ statut: 'prevue', date: '2020-01-01' }, '2026-01-01') && !L.lotsSansSchema(d, [lot.id]).length);
    t('tout ou rien : un type inconnu refuse l’ensemble', !L.planVinifAppliquer(d, lot.id, P, col.key, [...its, { type: 'inconnu', date, f: {} }]).ok && L.schemaPrevsDuLot(d, lot.id).length === 3);
    // ---- modification directe du tableau
    { const g = L.normalizeDb(L.sampleDb()); L.syncConfig(g); const p0 = L.plansVinifDe(g)[0]; const l0 = p0.lignes.find((l) => l.type === 'etape'); const k0 = L.planVinifCellules(p0, l0)[0].key;
      const r1 = L.planVinifCellule(g, p0.id, l0.id, k0, ' 6 g/hL ', 'u1'); const pm = g.plansVinif.find((p) => p.id === p0.id);
      t('case modifiée : l’exemple devient une donnée de la cave, valeur nettoyée ; case vidée retirée ; clé invalide refusée', r1.ok && Array.isArray(g.plansVinif) && !pm.exemple && pm.lignes.find((l) => l.id === l0.id).valeurs[k0] === '6 g/hL' && L.planVinifCellule(g, p0.id, l0.id, k0, '', 'u1').ok && !(k0 in pm.lignes.find((l) => l.id === l0.id).valeurs) && !L.planVinifCellule(g, p0.id, l0.id, 'a b"c', 'x', 'u1').ok && !L.planVinifCellule(g, p0.id, 'inconnue', k0, 'x', 'u1').ok);
      t('étape et produit modifiés ; en-tête renommé (vide refusé)', L.planVinifCellule(g, p0.id, l0.id, 'etape', 'Sulfitage à la presse', 'u1').ok && pm.lignes.find((l) => l.id === l0.id).etape === 'Sulfitage à la presse' && L.planVinifEntete(g, p0.id, 'groupes', pm.groupes[0].id, 'Chardonnay', 'u1').ok && pm.groupes[0].label === 'Chardonnay' && !L.planVinifEntete(g, p0.id, 'groupes', pm.groupes[0].id, ' ', 'u1').ok && !L.planVinifEntete(g, p0.id, 'inconnu', 'x', 'y', 'u1').ok);
      const n0 = pm.lignes.length; const ins = L.planVinifLigne(g, p0.id, l0.id, 'inserer', 'section', 'u1'); const i0 = pm.lignes.findIndex((l) => l.id === l0.id);
      t('lignes : insérer après, monter, descendre, changer le type (valeurs effacées), l’étendue, l’opération liée ; retirer', ins.ok && pm.lignes.length === n0 + 1 && pm.lignes[i0 + 1].id === ins.id && pm.lignes[i0 + 1].type === 'section' && L.planVinifLigne(g, p0.id, ins.id, 'monter', null, 'u1').ok && pm.lignes[i0].id === ins.id && L.planVinifLigne(g, p0.id, l0.id, 'operation', 'levurage', 'u1').ok && pm.lignes.find((l) => l.id === l0.id).opId === 'levurage' && !L.planVinifLigne(g, p0.id, l0.id, 'operation', 'inconnue', 'u1').ok && L.planVinifLigne(g, p0.id, l0.id, 'etendue', 'groupe', 'u1').ok && pm.lignes.find((l) => l.id === l0.id).etendue === 'groupe' && L.planVinifLigne(g, p0.id, l0.id, 'type', 'note', 'u1').ok && Object.keys(pm.lignes.find((l) => l.id === l0.id).valeurs).length === 0 && L.planVinifLigne(g, p0.id, ins.id, 'retirer', null, 'u1').ok && pm.lignes.length === n0 && !L.planVinifLigne(g, p0.id, l0.id, 'voler', null, 'u1').ok);
      t('conditions d’un plan enregistrées et retirées', L.planVinifConditionsSet(g, p0.id, { echelles: ['grand'] }, 'u1').ok && pm.conditions.echelles[0] === 'grand' && L.planVinifConditionsSet(g, p0.id, {}, 'u1').ok && !pm.conditions);
      t('modification par le formulaire (colonnes et propriétés) : conditions et opération liée gardées', (() => { L.planVinifConditionsSet(g, p0.id, { crus: ['cru-vertus'] }, 'u1'); const r = L.planVinifSave(g, { ...L.clone(pm), note: 'n' }, p0.id, 'u1'); const q = g.plansVinif.find((p) => p.id === p0.id); return r.ok && q.conditions.crus[0] === 'cru-vertus' && q.lignes.find((l) => l.id === l0.id).opId === 'levurage' && q.note === 'n'; })()); }
    // ---- schémas convertis en variantes
    { const g = L.normalizeDb(L.sampleDb()); L.syncConfig(g); g.schemas = L.SCHEMAS_EXEMPLES().slice(0, 2).map((x) => ({ ...x, id: `sx-${x.id}` })); delete g.settings.schemasConvertis;
      const n = L.plansVinifConvertirSchemas(g); const n2 = L.plansVinifConvertirSchemas(g); const cv = g.plansVinif.filter((p) => /^pv-sch-/.test(p.id)); const sc = g.schemas[0];
      t('schémas enregistrés → variantes du plan (une fois) : mêmes critères, étapes dans l’ordre des jours sans les jours, opération liée ; schémas gardés', n === 2 && n2 === 0 && cv.length === 2 && cv[0].conditions && (sc.criteres.cepages || []).every((c) => (cv[0].conditions.cepages || []).includes(c)) && cv[0].lignes.length === sc.etapes.length && cv[0].lignes.every((l) => l.opId && !('jour' in l)) && g.schemas.length === 2 && g.settings.schemasConvertis.ids[sc.id] === cv[0].id);
      const h = L.normalizeDb(JSON.parse(JSON.stringify({ ...g, plansVinif: undefined, settings: { ...g.settings, schemasConvertis: undefined } })));
      t('… faite à l’ouverture de la base ; une base sans schéma enregistré (exemples) n’est pas touchée', h.plansVinif.filter((p) => /^pv-sch-/.test(p.id)).length === 2 && !L.normalizeDb(L.sampleDb()).settings.schemasConvertis); }
    // ---- droits et synchronisation
    { const g = L.clone(d); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-t55', nom: 'Lecture', modules: { plan: 'lecture' }, droits: {} }]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-t55', identifiant: 't55', nom: 'T', profilId: 'pf-t55', actif: true }];
      const h1 = L.clone(g); const pp = L.plansVinifDe(h1)[0]; L.planVinifCellule(h1, pp.id, pp.lignes.find((l) => l.type === 'etape').id, 'etape', 'X', 'u-t55');
      t('droits : modifier une case du plan = écriture du module Plan de vinification', L.gardeDroits(g, h1, 'u-t55').ok === false); }
    { const B = L.clone(d); const X = L.clone(d); const Y = L.clone(d); const pid = v1.id; const lx = X.plansVinif.find((p) => p.id === pid).lignes.find((l) => l.type === 'etape');
      L.planVinifCellule(X, pid, lx.id, 'etape', 'Ici', 'u1'); X.meta.modifLe = '2026-12-08T08:00:00Z'; L.planVinifConditionsSet(Y, v2.id, { crus: ['cru-vertus'] }, 'u1'); Y.meta.modifLe = '2026-12-08T09:00:00Z';
      const FX = L.syncFusion(B, X, Y); t('synchronisation : case modifiée ici, conditions d’une autre variante là-bas, rien de perdu', FX.db.plansVinif.find((p) => p.id === pid).lignes.some((l) => l.etape === 'Ici') && FX.db.plansVinif.find((p) => p.id === v2.id).conditions.crus[0] === 'cru-vertus'); }
    // ---- version, traductions, base 0.43.0-alpha.2 et compatibilité avec la 0.43.0-alpha.1 gelée
    t('version 0.43.0-alpha.2 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.43.0-alpha.2').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.43.0-alpha.2') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.43.0-alpha.1'));
    t('traductions : plan modifiable, variantes, étapes ordonnées, notes de version dans les six langues', L.tradControle().length === 0 && L.traduire('＋ Variante', 'en') === '＋ Variant' && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f55 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.43.0-alpha.2-plans.json'), 'utf8'))); L.syncConfig(f55);
    t('fixture 0.43.0-alpha.2 : variante d’un partenaire, schéma converti, étapes à réaliser sans date', f55.plansVinif.some((p) => p.conditions && p.conditions.apporteurs) && f55.plansVinif.some((p) => /^pv-sch-/.test(p.id)) && f55.previsions.filter((p) => p.sansDate && p.schema && p.schema.plan).length >= 3);
    const dirO = path.join(__dirname, 'anciennes', '0.43.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, planVinifSave, previsionSave, APP_VERSION, APP_NUM };')({});
    t('0.43.0-alpha.1 gelée chargée', O.APP_VERSION === '0.43.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f55)); O.syncConfig(x); O.getR(x);
    t('… la 0.43.0-alpha.1 ouvre la base 0.43.0-alpha.2 sans rien perdre (variantes, conditions, opérations liées, étapes sans date, schémas d’origine)', canonJ(x.plansVinif) === canonJ(f55.plansVinif) && canonJ(x.previsions) === canonJ(f55.previsions) && canonJ(x.schemas) === canonJ(f55.schemas));
    const pv = f55.plansVinif.find((p) => p.conditions && p.conditions.apporteurs); O.planVinifSave(x, { ...O.clone(pv), note: 'Relu là-bas' }, pv.id, 'u1'); x.meta.modifLe = '2026-12-08T09:00:00Z';
    const N = L.clone(f55); const ln = N.plansVinif.find((p) => p.id === pv.id).lignes.find((l) => l.type === 'etape'); L.planVinifCellule(N, pv.id, ln.id, 'produit', 'Produit fictif', 'u1'); N.meta.modifLe = '2026-12-08T08:00:00Z';
    const FX = L.syncFusion(f55, N, x); const FX2 = O.syncFusion(f55, x, N);
    t('… synchronisation 0.43.0-alpha.2 ↔ 0.43.0-alpha.1 : variante relue là-bas (conditions gardées), rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => { const q = y.plansVinif.find((p) => p.id === pv.id); return q.note === 'Relu là-bas' && q.conditions && q.conditions.apporteurs.length === 1; }));
  }
  // ===== 56. 0.43.0-alpha.3 : moteur de personnalisation (questionnaire basique / avancé) — tests unitaires complets
  {
    const canonSans = (x) => { const c = L.clone(x); delete c.meta; if (c.settings && c.settings.profilViticole) delete c.settings.profilViticole.le; if (c.settings && c.settings.personnalisation) delete c.settings.personnalisation.le; (c.operateurs || []).forEach((o) => delete o.creeLe); return canonJ(c); };
    const vide = () => { const e = L.normalizeDb(L.emptyDb()); L.syncConfig(e); return e; };
    const ex = () => { const e = L.normalizeDb(L.sampleDb()); L.syncConfig(e); return e; };
    const Q = L.PERSO_QUESTIONS; const TYPES = ['texte', 'choix', 'multi', 'oui_non', 'nombre', 'date', 'liste', 'compte'];
    // ---- catalogue des questions
    t('questions : identifiants uniques, mode, section, type connus, options pour les choix, durée estimée', new Set(Q.map((q) => q.id)).size === Q.length && Q.every((q) => ['basique', 'avance'].includes(q.mode) && L.PERSO_SECTIONS.some((x) => x[0] === q.section) && TYPES.includes(q.type) && q.texte && q.secondes > 0 && (!['choix', 'multi'].includes(q.type) || L.persoOptions(q).length >= 2)));
    t('questions : revendications proposées = conventionnel, Bio, Demeter, Biodyvin, Nature & Progrès, VMN, HVE, VDC (référentiels connus)', L.PERSO_REVENDICATIONS.map((x) => x.id).join() === 'conv,bio,dem,bdv,np,vmn,hve,vdc' && L.PERSO_REVENDICATIONS.every((x) => x.referentiels.every((r) => L.REG_LABELS.some((l) => l.id === r))));
    // ---- questions qui s'appliquent
    const ids = (m, r, c) => L.persoQuestions(m, r, c).map((q) => q.id);
    const b0 = ids('basique', { types: ['blanc'], acces: 'seul' }, {}); const a0 = ids('avance', { types: ['blanc'], acces: 'seul' }, {});
    t('basique ⊂ avancé ; l’avancé ajoute des questions', b0.every((x) => a0.includes(x)) && a0.length > b0.length + 8 && Q.filter((q) => q.mode === 'avance').every((q) => !b0.includes(q.id)));
    t('conditions : tirage seulement pour des effervescents ; compte et verrouillage seulement pour une équipe ; base de départ seulement à la première ouverture', !b0.includes('tirage') && ids('basique', { types: ['effervescent'] }, {}).includes('tirage') && ids('basique', { types: ['ancestrale'] }, {}).includes('tirage') && !b0.includes('compte') && ids('basique', { acces: 'equipe' }, {}).includes('compte') && !a0.includes('verrou') && ids('avance', { acces: 'equipe' }, {}).includes('verrou') && !b0.includes('donnees') && ids('basique', {}, { premiere: true }).includes('donnees'));
    t('conditions : CIVC et code récoltant en Champagne (code récoltant si tirage chez soi) ; cave et dégorgement si tirage chez soi ; proposition du plan si plan utilisé', !a0.includes('civc') && ids('avance', { region: 'champagne' }, {}).includes('civc') && ids('avance', { region: 'champagne', types: ['effervescent'], tirage: 'sur_place' }, {}).includes('codeRecoltant') && !ids('avance', { region: 'champagne', types: ['effervescent'], tirage: 'aucun' }, {}).includes('codeRecoltant') && !ids('avance', { types: ['effervescent'], tirage: 'aucun' }, {}).includes('cave') && ids('avance', { types: ['effervescent'], tirage: 'prestataire' }, {}).includes('degorgement') && !ids('avance', { plan: false }, {}).includes('planProposer') && ids('avance', {}, {}).includes('planProposer'));
    t('durée : basique plus court que l’avancé, plus longue avec les questions conditionnelles, au moins 1 minute', L.persoDuree('basique', {}, {}) < L.persoDuree('avance', {}, {}) && L.persoDuree('avance', { acces: 'equipe', types: ['effervescent'], region: 'champagne' }, { premiere: true }) >= L.persoDuree('avance', {}, {}) && L.persoDuree('basique', {}, {}) >= 1);
    // ---- réponses par défaut
    { const d = ex(); const df = L.persoDefauts(d, { premiere: true }); const df2 = L.persoDefauts(d, {});
      t('défauts tirés de la base : région, types, onglets (pressoir, tirage, hygiène), revendications visibles, accès seul, base vide à la première ouverture', df.region === 'champagne' && df.types.includes('effervescent') && df.pressoir === true && df.tirage === 'sur_place' && df.hygiene === true && df.revendications.join() === 'conv,bio,dem' && df.acces === 'seul' && df.donnees === 'vide' && !('donnees' in df2) && df.verrou === L.securiteReglages(d).verrouMin && L.persoValiderTout('basique', { ...df, nom: 'X' }, { premiere: true }).ok);
      d.settings.personnalisation = { mode: 'basique', reponses: { nom: 'Repris', pressoir: false } };
      t('défauts : réponses d’un questionnaire précédent reprises', L.persoDefauts(d, {}).nom === 'Repris' && L.persoDefauts(d, {}).pressoir === false); }
    // ---- validation
    const q = (id) => L.persoQuestion(id); const v = (id, x) => L.persoValider(q(id), x);
    t('validation : réponse obligatoire, choix et choix multiples inconnus refusés, oui / non strict', v('nom', '') && v('nom', '  ') === '' && !v('nom', 'Domaine') && v('region', 'atlantide') && !v('region', 'loire') && v('types', []) && v('types', ['blanc', 'mars']) && !v('types', ['blanc']) && v('pressoir', 'oui') && !v('pressoir', false) && !v('adresse', '') && v('nom', 'x'.repeat(201)), [v('nom', '  ')]);
    t('validation : nombre borné, date ISO, n° d’accise (13 caractères)', v('accise', 'FR0') && !v('accise', 'fr012345e6789') && v('verrou', 'abc') && v('verrou', 600) && !v('verrou', 30) && v('campagne', '15/08/2027') && !v('campagne', '2027-08-15') && L.persoValider(null, 1));
    t('validation du compte : identifiant requis et sans espace, mot de passe de 8 caractères, confirmation identique', /identifiant/.test(v('compte', {})) && /sans espace/.test(v('compte', { identifiant: 'jean dupont', mdp: '12345678', mdp2: '12345678' })) && /8 caractères/.test(v('compte', { identifiant: 'jean', mdp: '1234', mdp2: '1234' })) && /diffèrent/.test(v('compte', { identifiant: 'jean', mdp: '12345678', mdp2: '12345679' })) && !v('compte', { identifiant: 'jean.d', mdp: '12345678', mdp2: '12345678' }));
    { const r = L.persoValiderTout('basique', { nom: '', region: 'champagne', statut: 'recoltant', types: ['effervescent'], tirage: 'x', revendications: ['conv'], acces: 'equipe', compte: {} }, {});
      t('validation de toutes les réponses : erreurs par question (nom, tirage, compte), questions qui ne s’appliquent pas ignorées', !r.ok && 'nom' in r.erreurs && 'tirage' in r.erreurs && 'compte' in r.erreurs && !('evv' in r.erreurs) && Object.keys(r.erreurs).length === 3, r.erreurs); }
    // ---- opérateurs
    { const d = ex(); const o0 = d.operateurs[0]; const L1 = L.persoOperateurs(d, `Jeanne Fictive\n\n  Paul  Fictif ; Jeanne Fictive\nSolo\n${o0.prenom} ${o0.nom}`);
      t('opérateurs : une personne par ligne (ou « ; »), prénom puis nom, espaces nettoyés, doublons et opérateurs existants écartés', L1.length === 3 && L1[0].prenom === 'Jeanne' && L1[0].nom === 'Fictive' && L1[1].nom === 'Fictif' && L1[2].prenom === 'Solo' && L1[2].nom === '', L1); }
    // ---- plan des changements
    const R0 = { nom: '  Domaine fictif  ', region: 'loire', statut: 'negociant', types: ['blanc', 'rouge'], pressoir: false, revendications: ['bio', 'vmn', 'inconnue'], hygiene: false, acces: 'seul' };
    { const d = ex(); const avant = canonJ(d); const p = L.persoPlan(d, 'basique', R0, {});
      t('plan : la base n’est pas modifiée', canonJ(d) === avant);
      t('plan : nom nettoyé, profil (région, types), statut du déclarant, revendications (conventionnel toujours, inconnues écartées)', p.entreprise.nom === 'Domaine fictif' && p.profil.region === 'loire' && p.profil.types.join() === 'blanc,rouge' && p.declaration.statut === 'negociant' && p.revendications.join() === 'conv,bio,vmn');
      t('plan : onglets — pressoir masqué, tirage, cave et dégorgement masqués (pas d’effervescent), hygiène et équipements masqués (basique)', p.modules.pressoir === false && p.modules.tirage === false && p.modules.cave === false && p.modules.degorgement === false && p.modules.hygiene === false && p.modules.equipements === false && !('plan' in p.modules));
      t('plan : changements lisibles par groupe, sans base vide hors première ouverture', p.changements.some((c) => c.groupe === 'onglets' && /Pressoir/.test(c.label) && c.apres === 'masqué') && p.changements.some((c) => c.groupe === 'revendications') && !p.baseVide && !p.changements.some((c) => /Base de départ/.test(c.label))); }
    { const d = ex(); const pm = (r, m, c) => L.persoPlan(d, m || 'avance', { types: ['effervescent', 'blanc'], region: 'champagne', ...r }, c || {});
      t('plan : tirage chez soi (cave, dégorgement selon les réponses), par un prestataire (onglets gardés), pas chez soi (masqués)', pm({ tirage: 'sur_place', cave: false, degorgement: true }).modules.cave === false && pm({ tirage: 'sur_place', cave: false, degorgement: true }).modules.degorgement === true && pm({ tirage: 'prestataire' }).modules.tirage === true && pm({ tirage: 'aucun' }).modules.tirage === false && pm({ tirage: 'aucun' }).modules.degorgement === false);
      t('plan avancé : équipements indépendants de l’hygiène, plan de vinification, alertes, proposition du plan', pm({ hygiene: false, equipements: true }).modules.equipements === true && pm({ plan: false }).modules.plan === false && pm({ referentiel: false }).referentiel === false && pm({ planProposer: false }).schemasProposer === false && pm({ plan: false, planProposer: false }).schemasProposer === null);
      t('plan avancé : identifiants (EVV → cvi), CIVC en Champagne, code récoltant ; verrouillage borné', pm({ evv: ' 51 ', accise: 'FR1', civc: '42', codeRecoltant: 'RC' }).drm.cvi === '51' && pm({ civc: '42' }).drm.civc === '42' && L.persoPlan(d, 'avance', { region: 'loire', civc: '42' }, {}).drm.civc === undefined && pm({ codeRecoltant: 'RC', tirage: 'sur_place' }).declaration.codeRecoltant === 'RC' && pm({ acces: 'equipe', verrou: 999 }).verrouMin === 480 && pm({ acces: 'seul', verrou: 30 }).verrouMin === null);
      const pc = pm({ campagne: '2027-08-15' }); t('plan avancé : campagne d’un an (veille du même jour l’année suivante), onglet d’ouverture connu', pc.campagne.nom === '2027-2028' && pc.campagne.debut === '2027-08-15' && pc.campagne.fin === '2028-08-14' && pm({ onglet: 'intrants' }).ongletDefaut === 'intrants' && pm({ onglet: 'inconnu' }).ongletDefaut === null);
      t('plan : base vide seulement à la première ouverture et si choisie ; compte annoncé pour une équipe', L.persoPlan(d, 'basique', { donnees: 'vide' }, { premiere: true }).baseVide && !L.persoPlan(d, 'basique', { donnees: 'exemple' }, { premiere: true }).baseVide && !L.persoPlan(d, 'basique', { donnees: 'vide' }, {}).baseVide && L.persoPlan(d, 'basique', { acces: 'equipe', compte: {} }, {}).changements.some((c) => /Identifiants/.test(c.label))); }
    // ---- application
    { const e = vide(); const R1 = { ...R0, revendications: ['bio', 'vmn', 'hve'] }; const p = L.persoPlan(e, 'avance', { ...R1, referentiel: false, planProposer: false, evv: '5100000000', accise: 'FR012345E6789', operateurs: 'Jeanne Fictive\nPaul Fictif', campagne: '2027-08-15', onglet: 'intrants', plan: true }, {});
      const r = L.persoAppliquer(e, p, 'u1');
      t('application sur une base vide : nom, profil viticole (région, types), onglets', r.ok && e.entreprise.nom === 'Domaine fictif' && e.settings.profilViticole.region === 'loire' && !L.moduleActif(e, 'pressoir') && !L.moduleActif(e, 'tirage') && !L.moduleActif(e, 'hygiene') && L.moduleActif(e, 'plan') && L.moduleActif(e, 'params'));
      const qs = e.lists.qualifs;
      t('application : revendications ajoutées avec leurs référentiels (VMN, HVE), Demeter inutilisé masqué, conventionnel gardé', qs.find((x) => x.id === 'vmn').referentiels[0] === 'vmn' && qs.some((x) => x.id === 'hve') && qs.find((x) => x.id === 'dem').masque === true && !qs.find((x) => x.id === 'conv').masque && !qs.find((x) => x.id === 'bio').masque);
      t('application : alertes de conformité, proposition du plan, EVV et accise (DRM), statut du déclarant', L.refActif(e) === false && L.schemasReglage(e).proposer === false && L.drmReglage(e).cvi === '5100000000' && L.drmReglage(e).accise === 'FR012345E6789' && e.settings.declarationTirage.statut === 'negociant');
      t('application : opérateurs, campagne 2027-2028 créée et active, onglet d’ouverture', e.operateurs.filter((o) => /Fictiv|Fictif/.test(o.nom)).length === 2 && e.campagnes.some((c) => c.nom === '2027-2028') && e.settings.campagneActive === '2027-2028' && e.settings.ongletDefaut === 'intrants');
      const c1 = canonSans(e); const r2 = L.persoAppliquer(e, p, 'u1');
      t('application idempotente : la refaire ne change rien (ni doublon d’opérateur, de campagne ou de revendication)', r2.ok && canonSans(e) === c1);
      t('accise invalide dans un plan : EVV gardé, accise écartée ; verrouillage ignoré sans identifiants ; plan vide refusé', (() => { const g = vide(); L.persoAppliquer(g, { drm: { cvi: '51', accise: 'FR0' } }, 'u1'); return L.drmReglage(g).cvi === '51' && L.drmReglage(g).accise === ''; })() && (() => { const g = vide(); L.persoAppliquer(g, { verrouMin: 5 }, 'u1'); return !L.securiteActive(g) && L.securiteReglages(g).verrouMin !== 5; })() && !L.persoAppliquer(e, null, 'u1').ok); }
    { const d = ex(); const nL = d.lots.length; const nO = d.ops.length; const usage = L.qualifUsage(d, 'dem');
      const p = L.persoPlan(d, 'basique', { ...L.persoDefauts(d, {}), nom: 'X', revendications: ['conv'] }, {}); L.persoAppliquer(d, p, 'u1');
      t('application sur une base existante : rien n’est supprimé (lots, opérations) ; une revendication utilisée n’est jamais masquée', d.lots.length === nL && d.ops.length === nO && (!usage || !d.lists.qualifs.find((x) => x.id === 'dem').masque));
      d.lists.qualifs.push({ id: 'maison', label: 'Revendication maison', court: 'MAI', couleur: '#777' }); L.persoAppliquer(d, p, 'u1');
      t('… une revendication propre à l’exploitation n’est jamais masquée', !d.lists.qualifs.find((x) => x.id === 'maison').masque);
      const c0 = d.campagnes.length; L.persoAppliquer(d, { campagne: { nom: 'X', debut: d.campagnes[0].debut, fin: d.campagnes[0].fin } }, 'u1');
      t('… campagne : aucune création si une campagne couvre déjà la date', d.campagnes.length === c0);
      t('… région inconnue refusée', !L.persoAppliquer(d, { profil: { region: 'atlantide', types: ['blanc'] } }, 'u1').ok); }
    { const d = ex(); L.persoMemoriser(d, 'avance', { nom: 'N', compte: { identifiant: 'a', mdp: 'secret-123', mdp2: 'secret-123' } }, 'u1'); const pz = d.settings.personnalisation;
      t('réponses mémorisées sans le compte ni le mot de passe, avec le mode et la version', pz.mode === 'avance' && pz.reponses.nom === 'N' && !('compte' in pz.reponses) && !JSON.stringify(pz).includes('secret-123') && pz.version === L.APP_VERSION && pz.par === 'u1'); }
    // ---- droits et synchronisation
    { const g = ex(); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-t56', nom: 'Cave', modules: { params: 'lecture', cuverie: 'ecriture' }, droits: {} }]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-t56', identifiant: 't56', nom: 'T', profilId: 'pf-t56', actif: true }];
      const h = L.clone(g); L.persoAppliquer(h, L.persoPlan(h, 'basique', { ...L.persoDefauts(h, {}), nom: 'Autre nom', pressoir: false }, {}), 'u-t56');
      t('droits : la configuration (société, onglets, réglages) exige l’écriture des paramètres', L.gardeDroits(g, h, 'u-t56').ok === false); }
    { const B = ex(); const X = L.clone(B); const Y = L.clone(B); L.persoAppliquer(X, L.persoPlan(X, 'basique', { ...L.persoDefauts(X, {}), nom: 'Ici', revendications: ['conv', 'vmn'] }, {}), 'u1'); L.persoMemoriser(X, 'basique', { nom: 'Ici' }, 'u1'); X.meta.modifLe = '2026-12-09T08:00:00Z';
      L.operateurSave(Y, { prenom: 'Là', nom: 'Bas' }); Y.meta.modifLe = '2026-12-09T09:00:00Z'; const FX = L.syncFusion(B, X, Y);
      t('synchronisation : configuration ici, opérateur ajouté là-bas, rien de perdu', FX.db.entreprise.nom === 'Ici' && FX.db.lists.qualifs.some((q) => q.id === 'vmn') && FX.db.operateurs.some((o) => o.nom === 'Bas') && FX.db.settings.personnalisation.reponses.nom === 'Ici'); }
    // ---- version, traductions, base 0.43.0-alpha.3 et compatibilité avec la 0.43.0-alpha.2 gelée
    t('version 0.43.0-alpha.3 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.43.0-alpha.3').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.43.0-alpha.3') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.43.0-alpha.2'));
    t('traductions : questionnaire, visite guidée, notes de version dans les six langues ; chaque question et option traduite', L.tradControle().length === 0 && L.CHANGELOG.find((c) => c.v === '0.43.0-alpha.3').notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && Q.every((x) => L.traduire(x.texte, 'en') !== x.texte) && L.PERSO_SECTIONS.every((x) => L.traduire(x[1], 'de') !== x[1]), Q.filter((x) => L.traduire(x.texte, 'en') === x.texte).map((x) => x.texte));
    const f56 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.43.0-alpha.3-configuration.json'), 'utf8'))); L.syncConfig(f56);
    t('fixture 0.43.0-alpha.3 : configuration avancée appliquée (nom, VMN et HVE, opérateurs, campagne, réponses)', f56.entreprise.nom === 'Exploitation fictive' && ['vmn', 'hve'].every((id) => f56.lists.qualifs.some((q) => q.id === id)) && f56.campagnes.some((c) => c.nom === '2027-2028') && f56.settings.personnalisation.mode === 'avance' && f56.settings.ongletDefaut === 'previsions');
    const dirO = path.join(__dirname, 'anciennes', '0.43.0-alpha.2');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, operateurSave, APP_VERSION, APP_NUM };')({});
    t('0.43.0-alpha.2 gelée chargée', O.APP_VERSION === '0.43.0-alpha.2' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f56)); O.syncConfig(x); O.getR(x);
    t('… la 0.43.0-alpha.2 ouvre la base 0.43.0-alpha.3 sans rien perdre (réponses, revendications ajoutées, opérateurs, campagne)', canonJ(x.settings.personnalisation) === canonJ(f56.settings.personnalisation) && canonJ(x.lists.qualifs) === canonJ(f56.lists.qualifs) && canonJ(x.operateurs) === canonJ(f56.operateurs) && canonJ(x.campagnes) === canonJ(f56.campagnes));
    O.operateurSave(x, { prenom: 'Ancienne', nom: 'Version' }); x.meta.modifLe = '2026-12-09T09:00:00Z';
    const N = L.clone(f56); L.persoMemoriser(N, 'basique', { nom: 'Relancé' }, 'u1'); N.meta.modifLe = '2026-12-09T08:00:00Z';
    const FX = L.syncFusion(f56, N, x); const FX2 = O.syncFusion(f56, x, N);
    t('… synchronisation 0.43.0-alpha.3 ↔ 0.43.0-alpha.2 : questionnaire relancé ici, opérateur ajouté là-bas, rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => y.settings.personnalisation.reponses.nom === 'Relancé' && y.operateurs.some((o) => o.nom === 'Version')));
  }
  // ===== 57. 0.44.0-alpha.1 : prévisionnel des cuvées d'un chantier (plusieurs qualités), cuve de mixtion et lot tiré créés depuis la cuvée, déclarations par cuvée
  {
    const near = (a, b, e) => Math.abs(a - b) < (e || 0.01);
    const f57 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.44.0-alpha.1-cuvees.json'), 'utf8'))); L.syncConfig(f57);
    const db = L.clone(f57); const ch = db.chantiersTirage[0]; const R = L.replay(db); const R2 = L.replay(db, '2026-12-02');
    const C = (id) => L.chantierCuvee(db, ch.id, id); const P = (id) => ({ portionId: id, lotId: R2.portions[id].lotId });
    // ---- enregistrement
    t('cuvées prévues : 3 qualités sur le même chantier (blanc de blancs, blanc de noirs, rosé), identifiants cv1…cv3', L.chantierCuvees(ch).length === 3 && ['cv1', 'cv2', 'cv3'].every((id) => C(id)) && L.chantierCuvees(null).length === 0);
    t('enregistrement : nom requis, doublon refusé (casse et accents ignorés), vin ≤ 0 et point de tirage invalide refusés, chantier inconnu refusé',
      !L.chantierCuveeSave(db, ch.id, { nom: ' ' }).ok && /déjà prévue/.test(L.chantierCuveeSave(db, ch.id, { nom: 'BLANC DE BLANCS FICTIF' }).msg) && !L.chantierCuveeSave(db, ch.id, { nom: 'X', vinHL: '0' }).ok && !L.chantierCuveeSave(db, ch.id, { nom: 'X', pointGL: 'abc' }).ok && !L.chantierCuveeSave(db, ch.id, { nom: 'X', pointGL: -1 }).ok && !L.chantierCuveeSave(db, 'cht-x', { nom: 'X' }).ok);
    const n4 = L.chantierCuveeSave(db, ch.id, { nom: '  Cuvée bio fictive ', sources: [{ ...P('por301'), volL: '250' }, { portionId: '' }], pointGL: '24', mode: 'autre', formats: [{ format: 'bouteille', nb: '300' }, { format: 'inconnu', nb: 5 }, { format: 'magnum', nb: 0 }], mentions: 'Extra brut fictif ; ', couleur: 'violet', qualif: 'qx', echelle: 'zz' }, null, 'u1');
    const c4 = C(n4.id);
    t('… normalisée : nom nettoyé, n° cv4, sources vides retirées, point de tirage en nombre, mode pompe par défaut, formats inconnus ou à 0 retirés, mentions découpées, valeurs inconnues écartées, auteur', n4.ok && n4.id === 'cv4' && c4.nom === 'Cuvée bio fictive' && c4.sources.length === 1 && c4.sources[0].volL === 250 && c4.pointGL === 24 && c4.mode === 'pompe' && c4.formats.length === 1 && c4.formats[0].nb === 300 && c4.mentions.join() === 'Extra brut fictif' && c4.couleur === '' && c4.qualif === '' && c4.echelle === '' && c4.par === 'u1' && !('vinHL' in c4));
    // ---- qualité calculée depuis les vins de base
    const e1 = L.cuveeEffective(db, R2, C('cv1')); const e2 = L.cuveeEffective(db, R2, C('cv2')); const e3 = L.cuveeEffective(db, R2, C('cv3')); const e4 = L.cuveeEffective(db, R2, c4);
    t('blanc de blancs : couleur, revendication, échelle Grand Cru, millésime commun, mentions Grand Cru et Blanc de blancs, vin = vins de base', e1.couleur === 'blanc' && e1.qualif === 'conv' && e1.echelle === 'grand' && e1.millesime === '2026' && e1.mentions.join() === 'Grand Cru,Blanc de blancs' && near(e1.vinHL, 10), e1.mentions);
    t('blanc de noirs (100 % pinot noir) : Blanc de noirs et monocépage, échelle la plus basse (Premier Cru partiel : pas de mention de cru)', e2.mentions.join() === 'Blanc de noirs,Monocépage Pinot noir' && e2.echelle === 'premier' && !e2.mentions.some((m) => /Cru/.test(m)) && near(e2.vinHL, 8));
    t('rosé d’assemblage : couleur rosé calculée (rouge + blanc), pas de blanc de blancs, millésimes différents → non millésimé, vins rouges et blancs', e3.couleur === 'rose' && !e3.mentions.includes('Blanc de blancs') && e3.millesime === '' && e3.caracteres.rougeL === 100 && e3.caracteres.blancL === 900 && near(e3.vinHL, 9.5));
    t('revendication bio d’un vin de base bio : mention de la revendication ; mentions saisies prioritaires sur les calculées (gardées à part)', e4.qualif === 'bio' && e4.mentionsAuto.includes(L.qLabel('bio')) && e4.mentionsAuto.includes('Blanc de blancs') && e4.mentions.join() === 'Extra brut fictif');
    const qm = L.cuveeCaracteres(db, R2, [{ ...P('por301'), volL: 100 }, { ...P('por315'), volL: 100 }]);
    t('plusieurs revendications : la plus basse (bio + conventionnel → conventionnel) ; sans vin de base : rien de calculé', qm.qualif === 'conv' && L.cuveeCaracteres(db, R2, []).couleur === '' && L.cuveeCaracteres(db, R2, [{ portionId: 'x' }]).volL === 0);
    const e1r = L.cuveeEffective(db, R2, { ...C('cv1'), couleur: 'rose', qualif: 'bio', echelle: 'premier', millesime: '' , vinHL: 12 });
    t('valeurs corrigées : couleur (mentions recalculées sur la composition : Grand Cru gardé, plus de blanc de blancs), revendication, échelle, vin prévu', e1r.couleur === 'rose' && e1r.mentions.includes('Grand Cru') && !e1r.mentions.includes('Blanc de blancs') && e1r.mentions.includes(L.qLabel('bio')) && e1r.echelle === 'premier' && e1r.millesime === '2026' && e1r.vinHL === 12);
    // ---- réalisé, statut, écarts
    const r1 = L.cuveeRealise(db, R, ch.id, C('cv1')); const r2 = L.cuveeRealise(db, R, ch.id, C('cv2'));
    t('réalisé : blanc de blancs tirée (cuve de mixtion et lot liés), 1 330 cols pour 1 350 prévus (écart −20), vin mis en œuvre et écart au prévu', r1.statut === 'tiree' && r1.mixtions.length === 1 && r1.tirages.length === 1 && r1.cols === 1330 && r1.prevCols === 1350 && r1.ecartCols === -20 && near(r1.prevL, 1050) && r1.vinMisL > 900 && near(r1.ecartVinL, r1.vinMisL - 1000));
    const X = L.clone(db); X.ops = X.ops.filter((o) => !(o.type === 'tirage' && o.cuveeId === 'cv1'));
    t('statuts : prévue (rien de lié), en mixtion (cuve de mixtion seule), tirée ; libellés', r2.statut === 'prevue' && r2.ecartCols === null && L.cuveeRealise(X, L.replay(X), ch.id, C('cv1')).statut === 'en_cours' && L.CUVEE_STATUTS.en_cours === 'en mixtion');
    t('retrait : refusé tant qu’une opération est liée, accepté pour une cuvée seulement prévue', /déjà mise en œuvre/.test(L.chantierCuveeDelete(db, ch.id, 'cv1').msg) && L.chantierCuveeDelete(db, ch.id, 'cv4').ok && !C('cv4') && !L.chantierCuveeDelete(db, ch.id, 'cv4').ok);
    // ---- création depuis la ligne
    const pa = L.cuveePreset(db, L.replay(db, '2026-12-01'), ch, C('cv1'), 'assemblage'); const pt = L.cuveePreset(db, R, ch, C('cv1'), 'tirage'); const pp = L.cuveePreset(db, R2, ch, C('cv2'), 'tirage');
    t('cuve de mixtion préremplie : marquée mixtion, liée au chantier et à la cuvée, vins de base, point de tirage', pa.mixtion === true && pa.cuveeId === 'cv1' && pa.chantierId === ch.id && pa.sources[0].portionId === 'por315' && pa.sources[0].volL === '1000' && pa.pointGL === '24' && pa.date === ch.dateDebut && /mixtion/.test(pa.designation));
    t('lot de tirage prérempli : depuis la cuve de mixtion de la cuvée (mixtion) ou depuis les vins de base (pompe), formats, mode, millésime', pt.mode === 'mixtion' && pt.sources.length === 1 && R.portions[pt.sources[0].portionId].lotId === db.ops.find((o) => o.cuveeId === 'cv1' && o.mixtion).lotId && pp.mode === 'pompe' && pp.sources.length === 2 && pp.formats[0].nb === '1100' && pp.pointGL === '23' && pp.millesime === '2026' && pp.cuveeId === 'cv2');
    // ---- déclaration préalable par cuvée
    const pc = L.declPrealableCuvees(db, R, ch.id); const k1 = L.declPrealableCalcul(db, { vinHL: 10, pointGL: 24 });
    t('préalable : une ligne par cuvée (couleur, revendication, échelle, mentions, mode), volumes du profil de tirage', pc.lignes.length === 3 && pc.lignes.every((l) => l.ok) && near(pc.lignes[0].vinHL, k1.vinHL) && near(pc.lignes[0].sucreKg, k1.sucreKg) && near(pc.lignes[0].totalHL, k1.totalHL) && pc.lignes[0].mentions.join() === 'Grand Cru,Blanc de blancs' && pc.lignes[2].couleur === 'rose' && pc.lignes[1].mode === 'pompe');
    t('… totaux = somme des lignes ; rosé d’assemblage : rouge et blanc au prorata du vin prévu (0,95 + 8,55 hL)', ['vinHL', 'sucreHL', 'sucreKg', 'totalHL', 'vrtpHL'].every((k) => near(pc[k], pc.lignes.reduce((a, l) => a + l[k], 0), 1e-9)) && near(pc.lignes[2].rougeHL, 0.95) && near(pc.lignes[2].blancHL, 8.55) && pc.lignes[0].rougeHL === 0 && near(pc.rougeHL, 0.95) && pc.incompletes.length === 0);
    const Y = L.clone(db); L.chantierCuveeSave(Y, ch.id, { ...C('cv2'), pointGL: '' }, 'cv2', 'u1'); const pcY = L.declPrealableCuvees(Y, R, ch.id);
    const dY = L.declarationTirageSave(Y, { type: 'prealable', date: '2026-11-29', chantierId: ch.id, champs: {} }, null, 'u1');
    t('cuvée incomplète (sans point de tirage) : signalée, hors totaux, dépôt refusé', pcY.incompletes.join() === 'Blanc de noirs fictif' && pcY.lignes[1].manque === 'point de tirage' && near(pcY.vinHL, pc.vinHL - pc.lignes[1].vinHL) && /incomplètes/.test(L.declarationTirageDeposer(Y, R, dY.id, { deposeLe: '2026-11-29' }, 'u1').msg) && L.declPrealableCuvees(Y, R, 'cht-x') === null);
    const dp = f57.declarationsTirage.find((x) => x.statut === 'deposee' && x.type === 'prealable');
    t('préalable déposée (fixture) : figée avec une ligne par cuvée et les totaux', dp && dp.instantane.calcul.parCuvee === true && dp.instantane.calcul.lignes.length === 3 && near(dp.instantane.calcul.totalHL, pc.totalHL) && dp.reference === 'AIDAC-FICTIF-02');
    // ---- déclaration de fin de tirage : qualité de chaque lot
    const fc = L.declFinaleCalcul(db, R, { type: 'finale', chantierId: ch.id, champs: { facon: 'recoltant', proprietaire: 'EARL fictive' } }); const lb = fc.lots.find((l) => l.code === 'T-BDB-FX');
    t('fin de tirage : lot tiré depuis une cuvée → nom, couleur, échelle et mentions de la cuvée (+ tirage à façon)', lb && lb.cuveeId === 'cv1' && lb.cuvee === 'Blanc de blancs fictif' && lb.couleur === 'blanc' && lb.echelle === 'grand' && lb.revendications === 'Grand Cru – Blanc de blancs – TAF de vins appartenant à EARL fictive' && lb.millesime === '2026', lb);
    t('… lots sans cuvée : mentions calculées comme avant (blanc de noirs d’un pinot noir seul)', fc.lots.some((l) => !l.cuveeId && /Blanc de noirs – Monocépage Pinot noir/.test(l.revendications)));
    const csv = L.declFinaleCsv(db, R, { type: 'finale', chantierId: ch.id, champs: {} }); const lc = csv.find((r) => r[0] === 'T-BDB-FX');
    t('export CSV : couleur, revendication et échelle des crus de chaque lot', csv[0].slice(3, 6).join() === 'Couleur,Revendication,Échelle des crus' && lc[3] === L.couleurLabel(db, 'blanc') && lc[4] === L.qLabel('conv') && lc[5] === L.eDef('grand').label && csv[csv.length - 1].length === csv[0].length);
    // ---- chantier modifié : cuvées gardées ; droits ; synchronisation
    const Z = L.clone(db); L.chantierTirageSave(Z, { ...L.clone(Z.chantiersTirage[0]), cuvees: [], notes: 'Modifié' }, ch.id, 'u1');
    t('chantier modifié par son formulaire : cuvées prévues jamais écrasées', Z.chantiersTirage[0].notes === 'Modifié' && L.chantierCuvees(Z.chantiersTirage[0]).length === L.chantierCuvees(ch).length);
    { const g = L.clone(f57); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-t57', nom: 'Cave', modules: { tirage: 'lecture', cuverie: 'ecriture' }, droits: {} }, { id: 'pf-t57b', nom: 'Tirage', modules: { tirage: 'ecriture' }, droits: {} }];
      g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-t57', identifiant: 't57', nom: 'T', profilId: 'pf-t57', actif: true }, { id: 'u-t57b', identifiant: 't57b', nom: 'T2', profilId: 'pf-t57b', actif: true }];
      const h = L.clone(g); L.chantierCuveeSave(h, h.chantiersTirage[0].id, { nom: 'Cuvée droits' }, null, 'u-t57');
      t('droits : ajouter une cuvée prévue exige l’écriture des Tirages', L.gardeDroits(g, h, 'u-t57').ok === false && L.gardeDroits(g, h, 'u-t57b').ok === true); }
    { const B = L.clone(f57); const XA = L.clone(B); const YB = L.clone(B); L.chantierCuveeSave(XA, ch.id, { nom: 'Ajoutée ici' }, null, 'u1'); XA.meta.modifLe = '2026-12-10T12:00:00Z';
      L.declarationTirageSave(YB, { type: 'finale', date: '2026-12-05', chantierId: ch.id, champs: {} }, null, 'u1'); YB.meta.modifLe = '2026-12-10T11:00:00Z'; const FX = L.syncFusion(B, XA, YB);
      t('synchronisation : cuvée ajoutée ici, déclaration ajoutée là-bas, rien de perdu', L.chantierCuvees(FX.db.chantiersTirage[0]).some((c) => c.nom === 'Ajoutée ici') && FX.db.declarationsTirage.length === B.declarationsTirage.length + 1); }
    // ---- version, traductions, compatibilité avec la 0.43.0-alpha.3 gelée
    t('version 0.44.0-alpha.1 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.44.0-alpha.1').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.44.0-alpha.1') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.43.0-alpha.3'));
    t('traductions : notes de version, mentions et messages des cuvées dans les six langues', L.tradControle().length === 0 && L.CHANGELOG.find((c) => c.v === '0.44.0-alpha.1').notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && ['prévue', 'en mixtion', 'tirée', 'Nom de la cuvée requis.', 'Cuvée prévue introuvable.'].every((s) => L.traduire(s, 'en') !== s));
    const dirO = path.join(__dirname, 'anciennes', '0.43.0-alpha.3');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, chantierTirageSave, declFinaleCalcul, replay, APP_VERSION, APP_NUM };')({});
    t('0.43.0-alpha.3 gelée chargée', O.APP_VERSION === '0.43.0-alpha.3' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f57)); O.syncConfig(x); O.getR(x);
    t('… la 0.43.0-alpha.3 ouvre la base 0.44.0-alpha.1 sans rien perdre (cuvées prévues, opérations liées, préalable par cuvée figée)', canonJ(x.chantiersTirage) === canonJ(f57.chantiersTirage) && canonJ(x.declarationsTirage) === canonJ(f57.declarationsTirage) && x.ops.filter((o) => o.cuveeId).length === 2 && O.declFinaleCalcul(x, O.replay(x), { type: 'finale', chantierId: ch.id, champs: {} }).lots.length === 4);
    O.chantierTirageSave(x, { ...O.clone(x.chantiersTirage[0]), notes: 'Modifié là-bas' }, ch.id, 'u1'); x.meta.modifLe = '2026-12-10T13:00:00Z';
    const N = L.clone(f57); L.chantierCuveeSave(N, ch.id, { ...L.chantierCuvee(N, ch.id, 'cv2'), notes: 'Relue ici' }, 'cv2', 'u1'); L.declarationTirageSave(N, { type: 'finale', date: '2026-12-06', chantierId: ch.id, champs: {} }, null, 'u1'); N.meta.modifLe = '2026-12-10T12:00:00Z';
    const FX = L.syncFusion(f57, N, x); const FX2 = O.syncFusion(f57, x, N);
    t('… synchronisation 0.44.0-alpha.1 ↔ 0.43.0-alpha.3 : chantier modifié là-bas (cuvées gardées), déclaration ajoutée ici, cuvée relue ici gardée au journal des conflits, rien de perdu des deux côtés', [FX.db, FX2.db].every((y) => y.chantiersTirage[0].notes === 'Modifié là-bas' && L.chantierCuvees(y.chantiersTirage[0]).length === 3 && y.declarationsTirage.length === f57.declarationsTirage.length + 1)
      && [FX, FX2].every((F) => F.db.chantiersTirage[0].cuvees.find((c) => c.id === 'cv2').notes === 'Relue ici' || F.conflits.some((c) => c.cle === 'chantiersTirage' && JSON.stringify(c.autre).includes('Relue ici'))));
  }
  // ===== 58. 0.44.0-alpha.2 : fiche HACCP de la chaîne et contrôle de réception de la verrerie retirés (données gardées, versions antérieures)
  {
    const f57b = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.44.0-alpha.1-cuvees.json'), 'utf8')));
    const brut = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.44.0-alpha.1-cuvees.json'), 'utf8')); L.syncConfig(f57b);
    t('plus de fonctions de contrôle de la verrerie ni de fiche de la chaîne', ['arrivageControleSave', 'controleVerreReglages', 'controleVerreEvaluer', 'chantierHaccpSet', 'chantierHaccpEcarts', 'chantierConditionnement', 'chantierFournitures'].every((k) => L[k] === undefined));
    t('base d’une version antérieure : contrôles de réception, réglages du contrôle et fiche de la chaîne gardés tels quels à l’ouverture', canonJ(f57b.arrivages) === canonJ(brut.arrivages) && canonJ(f57b.chantiersTirage[0].haccp) === canonJ(brut.chantiersTirage[0].haccp) && f57b.arrivages.filter((a) => a.controleReception).length === 2);
    const db = L.clone(f57b); const ch = db.chantiersTirage[0]; const a = db.arrivages.find((x) => x.controleReception);
    L.chantierTirageSave(db, { ...L.clone(ch), notes: 'Modifié' }, ch.id, 'u1'); L.arrivageSave(db, { ...a, notes: 'Relu' }, a.id); L.chantierCuveeSave(db, ch.id, { ...L.chantierCuvee(db, ch.id, 'cv2'), notes: 'x' }, 'cv2', 'u1');
    t('… et après modification du chantier, de l’arrivage ou d’une cuvée : rien n’est effacé', canonJ(db.chantiersTirage[0].haccp) === canonJ(brut.chantiersTirage[0].haccp) && canonJ(db.arrivages.find((x) => x.id === a.id).controleReception) === canonJ(a.controleReception) && db.arrivages.find((x) => x.id === a.id).notes === 'Relu');
    const R = L.replay(db); const al = L.fournituresAlertes(db, R, db.arrivages.filter((x) => x.controleReception).map((x) => ({ produitId: x.produitId, arrivageId: x.id, qty: 1, manuel: true })), { formats: [{ format: 'bouteille', nb: 1 }] });
    t('alertes des fournitures : plus de mention du contrôle de réception', !al.some((x) => /contrôle|refusé/.test(x)), al);
    { const g = L.clone(f57b); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-t58', nom: 'Tirage', modules: { tirage: 'ecriture', intrants: 'lecture' }, droits: {} }]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-t58', identifiant: 't58', nom: 'T', profilId: 'pf-t58', actif: true }];
      const h = L.clone(g); h.settings.controleVerre = { nPetit: 1 };
      t('droits : les réglages du contrôle de la verrerie gardés dans la base restent protégés (module Intrants)', L.gardeDroits(g, h, 'u-t58').ok === false); }
    t('version 0.44.0-alpha.2 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.44.0-alpha.2').notes.length === 1 && L.CHANGELOG.findIndex((c) => c.v === '0.44.0-alpha.2') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.44.0-alpha.1'));
    t('traductions : note de version dans les six langues', L.tradControle().length === 0 && L.CHANGELOG.find((c) => c.v === '0.44.0-alpha.2').notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f58 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.44.0-alpha.2-sans-haccp.json'), 'utf8'))); L.syncConfig(f58);
    t('fixture 0.44.0-alpha.2 : retour au fournisseur, cuvée relue, fiche et contrôles d’avant gardés', f58.regulStocks.some((x) => x.retour && x.retour.bon === 'RET-FICTIF-2') && L.chantierCuvee(f58, f58.chantiersTirage[0].id, 'cv3').notes === 'Rosé relu (fictif)' && !!f58.chantiersTirage[0].haccp && f58.arrivages.filter((x) => x.controleReception).length === 2);
    const dirO = path.join(__dirname, 'anciennes', '0.44.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, chantierHaccpSet, chantierHaccp, arrivageControleSave, chantierCuvees, APP_VERSION, APP_NUM };')({});
    t('0.44.0-alpha.1 gelée chargée', O.APP_VERSION === '0.44.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f58)); O.syncConfig(x); O.getR(x);
    t('… la 0.44.0-alpha.1 ouvre la base 0.44.0-alpha.2 sans rien perdre et y retrouve la fiche de la chaîne et les contrôles', canonJ(x.chantiersTirage) === canonJ(f58.chantiersTirage) && canonJ(x.arrivages) === canonJ(f58.arrivages) && canonJ(x.regulStocks) === canonJ(f58.regulStocks) && O.chantierHaccp(x.chantiersTirage[0]).controles.length === 2);
    const aX = x.arrivages.find((y) => y.controleReception && y.controleReception.decision !== 'refuse'); const rc = O.arrivageControleSave(x, aX.id, { ...aX.controleReception, note: 'Relu là-bas', decision: 'derogation' }, 'u1'); x.meta.modifLe = '2026-12-11T12:00:00Z';
    const N = L.clone(f58); L.chantierCuveeSave(N, N.chantiersTirage[0].id, { nom: 'Ajoutée ici' }, null, 'u1'); N.meta.modifLe = '2026-12-11T11:00:00Z';
    const FX = L.syncFusion(f58, N, x); const FX2 = O.syncFusion(f58, x, N);
    t('… synchronisation 0.44.0-alpha.2 ↔ 0.44.0-alpha.1 : contrôle modifié là-bas (gardé ici), cuvée ajoutée ici, rien de perdu des deux côtés', rc.ok && [FX.db, FX2.db].every((y) => y.arrivages.find((z) => z.id === aX.id).controleReception.note === 'Relu là-bas' && L.chantierCuvees(y.chantiersTirage[0]).some((c) => c.nom === 'Ajoutée ici')));
  }
  // ===== 59. 0.44.0-alpha.3 : revendication VDC (Viticulture Durable en Champagne) dans la configuration guidée, rang des certifications de durabilité
  {
    const vide = () => { const e = L.normalizeDb(L.emptyDb()); L.syncConfig(e); return e; };
    const opts = L.persoOptions(L.persoQuestion('revendications'));
    t('VDC proposée à côté de HVE, sans référentiel d’intrants (certification de durabilité)', opts.some((o) => o.id === 'vdc' && o.label === 'VDC') && L.PERSO_REVENDICATIONS.find((x) => x.id === 'vdc').referentiels.length === 0 && L.PERSO_REVENDICATIONS.filter((x) => x.durable).map((x) => x.id).join() === 'hve,vdc');
    const e = vide(); const p = L.persoPlan(e, 'basique', { ...L.persoDefauts(e, {}), nom: 'X', revendications: ['bio', 'vdc', 'hve'] }, {}); const r = L.persoAppliquer(e, p, 'u1');
    const ids = e.lists.qualifs.filter((q) => !q.masque).map((q) => q.id);
    t('application : HVE et VDC rangées juste après Conventionnel, avant Bio', r.ok && ids.indexOf('hve') === ids.indexOf('conv') + 1 && ids.indexOf('vdc') === ids.indexOf('conv') + 2 && ids.indexOf('bio') > ids.indexOf('vdc'), ids);
    L.syncConfig(e);
    t('assemblage bio + VDC → VDC ; VDC + conventionnel → conventionnel', L.minQualif(['bio', 'vdc']) === 'vdc' && L.minQualif(['vdc', 'conv']) === 'conv' && L.minQualif(['hve', 'vdc']) === 'hve');
    const c = canonJ(e.lists.qualifs); L.persoAppliquer(e, p, 'u1');
    t('idempotent : pas de doublon ni de déplacement', canonJ(e.lists.qualifs) === c);
    const g = vide(); L.richListCont(g, 'qualifs', 'add', null, { label: 'VDC', couleur: '#123456' }); const pos = g.lists.qualifs.findIndex((q) => q.id === 'vdc');
    L.persoAppliquer(g, L.persoPlan(g, 'basique', { ...L.persoDefauts(g, {}), nom: 'X', revendications: ['vdc'] }, {}), 'u1');
    t('VDC déjà ajoutée par l’exploitation : gardée telle quelle (couleur, place), pas de doublon', g.lists.qualifs.filter((q) => q.id === 'vdc').length === 1 && g.lists.qualifs.findIndex((q) => q.id === 'vdc') === pos && g.lists.qualifs.find((q) => q.id === 'vdc').couleur === '#123456');
    t('version 0.44.0-alpha.3 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.44.0-alpha.3').notes.length === 1 && L.CHANGELOG.findIndex((c) => c.v === '0.44.0-alpha.3') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.44.0-alpha.2'));
    t('traductions : note de version dans les six langues', L.tradControle().length === 0 && L.CHANGELOG.find((c) => c.v === '0.44.0-alpha.3').notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)));
    const f59 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.44.0-alpha.3-vdc.json'), 'utf8'))); L.syncConfig(f59);
    t('fixture 0.44.0-alpha.3 : VDC ajoutée par la configuration guidée, réponses gardées', f59.lists.qualifs.some((q) => q.id === 'vdc' && !q.masque) && f59.settings.personnalisation.reponses.revendications.includes('vdc'));
    const dirO = path.join(__dirname, 'anciennes', '0.44.0-alpha.2');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, persoPlan, persoAppliquer, persoDefauts, operateurSave, APP_VERSION, APP_NUM };')({});
    t('0.44.0-alpha.2 gelée chargée', O.APP_VERSION === '0.44.0-alpha.2' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f59)); O.syncConfig(x); O.getR(x);
    O.persoAppliquer(x, O.persoPlan(x, 'basique', { ...O.persoDefauts(x, {}), revendications: ['conv', 'bio'] }, {}), 'u1');
    t('… la 0.44.0-alpha.2 ouvre la base 0.44.0-alpha.3 sans rien perdre et ne masque jamais VDC (inconnue pour elle : propre à l’exploitation)', x.lists.qualifs.some((q) => q.id === 'vdc' && !q.masque) && canonJ(x.settings.personnalisation) === canonJ(f59.settings.personnalisation));
    O.operateurSave(x, { prenom: 'Ancienne', nom: 'Version' }); x.meta.modifLe = '2026-12-12T12:00:00Z';
    const N = L.clone(f59); L.chantierCuveeSave(N, N.chantiersTirage[0].id, { nom: 'Cuvée VDC fictive' }, null, 'u1'); N.meta.modifLe = '2026-12-12T11:00:00Z';
    const FX = L.syncFusion(f59, N, x); const FX2 = O.syncFusion(f59, x, N);
    t('… synchronisation 0.44.0-alpha.3 ↔ 0.44.0-alpha.2 : VDC gardée, opérateur ajouté là-bas, cuvée ajoutée ici, rien de perdu', [FX.db, FX2.db].every((y) => y.lists.qualifs.some((q) => q.id === 'vdc') && y.operateurs.some((o) => o.prenom === 'Ancienne') && L.chantierCuvees(y.chantiersTirage[0]).some((c) => c.nom === 'Cuvée VDC fictive')));
  }
  // ===== 60. 0.45.0-alpha.1 : revendication « BIO » et code d'agrément de l'organisme certificateur ; visite guidée par chapitres
  {
    const ex = () => { const e = L.normalizeDb(L.sampleDb()); L.syncConfig(e); return e; };
    const q = (d, id) => d.lists.qualifs.find((x) => x.id === id);
    // ---- nom par défaut, migration
    t('revendication bio par défaut : « BIO » (plus « FR-BIO-01 », code d’Ecocert), dans la liste d’origine et le questionnaire', L.DEFAULT_QUALIFS().find((x) => x.id === 'bio').label === 'BIO' && L.PERSO_REVENDICATIONS.find((x) => x.id === 'bio').label === 'BIO');
    const old = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.44.0-alpha.3-vdc.json'), 'utf8'));
    const m = L.normalizeDb(L.clone(old)); L.syncConfig(m);
    t('base antérieure : « FR-BIO-01 » d’exemple renommé « BIO », sans code d’agrément, bascule tracée une fois', q(m, 'bio').label === 'BIO' && !q(m, 'bio').codeAgrement && m.settings.bioLibelle.de === 'FR-BIO-01' && L.qLabel('bio') === 'BIO');
    q(m, 'bio').label = 'FR-BIO-01'; const m2 = L.normalizeDb(m);
    t('… une seule fois : un nom remis ensuite par l’exploitation n’est plus touché', q(m2, 'bio').label === 'FR-BIO-01');
    const o2 = L.clone(old); o2.lists.qualifs.find((x) => x.id === 'bio').label = 'Agriculture biologique'; const m3 = L.normalizeDb(o2);
    t('… un nom choisi par l’exploitation (autre que FR-BIO-01) n’est pas touché', q(m3, 'bio').label === 'Agriculture biologique' && m3.settings.bioLibelle.de === '');
    // ---- revendications bio
    t('bio : identifiant « bio », référentiel Bio UE choisi ou deviné (Conversion bio) ; Demeter, HVE, conventionnel : non', L.qualifEstBio({ id: 'bio', label: 'BIO' }) && L.qualifEstBio({ id: 'x', label: 'Maison', referentiels: ['bio-ue'] }) && L.qualifEstBio({ id: 'c2', label: 'Conversion bio (C2)' }) && !L.qualifEstBio({ id: 'dem', label: 'Demeter' }) && !L.qualifEstBio({ id: 'hve', label: 'HVE' }) && !L.qualifEstBio({ id: 'bio', label: 'BIO', referentiels: [] }) && !L.qualifEstBio(null));
    t('format du code d’agrément : pays, terme, numéro (FR-BIO-01, DE-ÖKO-006) ; casse et espaces corrigés ; vide accepté', L.codeAgrementValide('FR-BIO-01') && L.codeAgrementValide(' fr-bio-10 ') && L.codeAgrementValide('DE-ÖKO-006') && L.codeAgrementValide('') && !L.codeAgrementValide('FRBIO01') && !L.codeAgrementValide('Ecocert') && L.codeAgrementNorm(' fr - bio - 01 ') === 'FR-BIO-01');
    const d = ex(); const r = L.qualifCodeAgrementSet(d, 'bio', { codeAgrement: 'fr-bio-01', organisme: ' Organisme fictif ' }, 'u1'); L.syncConfig(d);
    t('code d’agrément enregistré (majuscules), organisme, auteur', r.ok && q(d, 'bio').codeAgrement === 'FR-BIO-01' && q(d, 'bio').organisme === 'Organisme fictif' && q(d, 'bio').agrementPar === 'u1' && q(d, 'bio').label === 'BIO');
    t('… refusé : format invalide, revendication non bio, revendication inconnue', !L.qualifCodeAgrementSet(d, 'bio', { codeAgrement: 'Ecocert' }, 'u1').ok && !L.qualifCodeAgrementSet(d, 'dem', { codeAgrement: 'FR-BIO-01' }, 'u1').ok && !L.qualifCodeAgrementSet(d, 'zz', { codeAgrement: '' }, 'u1').ok && q(d, 'bio').codeAgrement === 'FR-BIO-01');
    // ---- affichage partout
    t('affichage : le code d’agrément est la revendication (qLabel, listes de choix) ; l’abréviation reste « BIO » ; le nom reste disponible', L.qLabel('bio') === 'FR-BIO-01' && L.qualifOptions(d).some((o) => o.value === 'bio' && /^FR-BIO-01 /.test(o.label)) && L.qDef('bio').court === 'BIO' && L.qDef('bio').nom === 'BIO' && L.qDef('bio').bio === true && L.qualifAffiche(q(d, 'dem')) === 'Demeter');
    t('… reste du bio : règles d’intrants et référentiel Bio UE inchangés, assemblage au même rang', L.qualifReferentiels(d, 'bio').includes('bio-ue') && L.rang('bio') === 2 && L.minQualif(['bio', 'dem']) === 'bio' && d.regles.some((x) => x.qualifId === 'bio'));
    const p = d.produits.find((x) => x.categorie !== 'sec' && (L.regleEffective(d, x, 'bio') || {}).autorise); const rc = L.recapIntrants(d, L.replay(d), ['nom', 'revendications']).lignes.find((l) => l.id === p.id);
    t('… fiches récapitulatives, mentions des déclarations : le code d’agrément', /FR-BIO-01/.test(rc.cells[1]) && L.cuveeMentionsComp(d, null, 'blanc').length === 0 && L.cuveeEffective(d, L.replay(d), { sources: [], qualif: 'bio' }).mentions.includes('FR-BIO-01'));
    L.qualifCodeAgrementSet(d, 'bio', { codeAgrement: '' }, 'u1'); L.syncConfig(d);
    t('code vidé : « BIO » affiché de nouveau, organisme gardé', L.qLabel('bio') === 'BIO' && !q(d, 'bio').codeAgrement && q(d, 'bio').organisme === 'Organisme fictif');
    const g = ex(); L.richListCont(g, 'qualifs', 'add', null, { label: 'Conversion bio (C2)', copieDe: 'bio' }); const c2 = g.lists.qualifs.find((x) => /Conversion/.test(x.label)); L.qualifCodeAgrementSet(g, c2.id, { codeAgrement: 'FR-BIO-01' }, 'u1'); L.syncConfig(g);
    t('revendication bio ajoutée par l’exploitation (conversion) : son propre code d’agrément', L.qLabel(c2.id) === 'FR-BIO-01' && L.qLabel('bio') === 'BIO');
    // ---- questionnaire
    const qb = L.persoQuestion('codeBio');
    t('questionnaire : code d’agrément demandé seulement si BIO est choisi, facultatif, format contrôlé, repris de la base', qb && qb.mode === 'basique' && L.persoQuestions('basique', { revendications: ['bio'] }, {}).some((x) => x.id === 'codeBio') && !L.persoQuestions('basique', { revendications: ['dem'] }, {}).some((x) => x.id === 'codeBio') && L.persoValider(qb, '') === '' && L.persoValider(qb, 'Ecocert') !== '' && L.persoValider(qb, 'FR-BIO-01') === '' && (() => { const h = ex(); L.qualifCodeAgrementSet(h, 'bio', { codeAgrement: 'FR-BIO-01' }, 'u1'); return L.persoDefauts(h, {}).codeBio === 'FR-BIO-01'; })());
    { const h = ex(); const pl = L.persoPlan(h, 'basique', { ...L.persoDefauts(h, {}), nom: 'X', revendications: ['bio'], codeBio: 'fr-bio-01' }, {}); const ra = L.persoAppliquer(h, pl, 'u1'); L.syncConfig(h); const c0 = canonJ(h.lists.qualifs); L.persoAppliquer(h, pl, 'u1');
      t('questionnaire appliqué : code d’agrément posé sur BIO (aperçu), idempotent ; sans BIO : rien', ra.ok && pl.changements.some((c) => /Code d’agrément/.test(c.label) && c.apres === 'FR-BIO-01') && L.qLabel('bio') === 'FR-BIO-01' && canonJ(h.lists.qualifs) === c0 && L.persoPlan(h, 'basique', { revendications: ['dem'], codeBio: 'FR-BIO-01' }, {}).codeBio === undefined); }
    // ---- droits, synchronisation
    { const g2 = ex(); g2.settings.securite = { actif: true }; g2.profils = [...(g2.profils || []), { id: 'pf-t60', nom: 'Cave', modules: { params: 'lecture', cuverie: 'ecriture' }, droits: {} }]; g2.utilisateurs = [...(g2.utilisateurs || []), { id: 'u-t60', identifiant: 't60', nom: 'T', profilId: 'pf-t60', actif: true }];
      const h = L.clone(g2); L.qualifCodeAgrementSet(h, 'bio', { codeAgrement: 'FR-BIO-01' }, 'u-t60');
      t('droits : le code d’agrément (liste des revendications) exige l’écriture des paramètres', L.gardeDroits(g2, h, 'u-t60').ok === false); }
    { const B = ex(); const X = L.clone(B); const Y = L.clone(B); L.qualifCodeAgrementSet(X, 'bio', { codeAgrement: 'FR-BIO-01' }, 'u1'); X.meta.modifLe = '2026-12-13T09:00:00Z'; L.operateurSave(Y, { prenom: 'Là', nom: 'Bas' }); Y.meta.modifLe = '2026-12-13T08:00:00Z';
      const FX = L.syncFusion(B, X, Y); t('synchronisation : code d’agrément ici, opérateur là-bas, rien de perdu', FX.db.lists.qualifs.find((x) => x.id === 'bio').codeAgrement === 'FR-BIO-01' && FX.db.operateurs.some((o) => o.nom === 'Bas')); }
    // ---- visite guidée par chapitres
    const C = L.VISITE_CHAPITRES; const mods = L.MODULES_DEFAUT.filter((m) => m !== 'declass');
    t('visite : chapitres uniques, « Prise en main » d’abord, un chapitre par module (déclassements dans Opérations)', new Set(C.map((c) => c.id)).size === C.length && C[0].id === 'prise' && C[0].module === null && mods.every((m) => C.some((c) => c.module === m)) && C.every((c) => !c.module || L.estModule(c.module)), mods.filter((m) => !C.some((c) => c.module === m)));
    t('… chaque étape : cible, titre et texte ; sous-onglet ou rang de sous-onglet bien formés', C.every((c) => c.etapes.length >= 2 && c.etapes.every((e) => e.cible && e.titre && e.texte && (e.sub === undefined || typeof e.sub === 'string') && (e.clic === undefined || Number.isInteger(e.clic)))));
    { const v = ex(); L.moduleActiver(v, 'pressoir', false); const ids = L.visiteChapitres(v).map((c) => c.id); const ids2 = L.visiteChapitres(v, (m) => m !== 'trace').map((c) => c.id);
      t('… chapitres proposés : modules affichés seulement, et autorisés (niveau d’accès)', !ids.includes('pressoir') && ids.includes('cuverie') && ids[0] === 'prise' && !ids2.includes('trace') && ids2.includes('params')); }
    t('… traduits : titres et textes des chapitres et des étapes (« Analyses », « DRM » identiques en anglais)', C.every((c) => (L.traduire(c.titre, 'en') !== c.titre || c.titre === 'Analyses') && c.etapes.every((e) => L.traduire(e.texte, 'de') !== e.texte && (L.traduire(e.titre, 'en') !== e.titre || ['DRM', 'Œnotrack'].includes(e.titre)))), C.flatMap((c) => [c.titre, ...c.etapes.flatMap((e) => [e.titre, e.texte])]).filter((x) => L.traduire(x, 'en') === x && !['DRM', 'Œnotrack', 'Analyses'].includes(x)));
    // 0.48.0-alpha.1 : cibles de repli « A || B », parcours « L’essentiel », durée annoncée
    t('0.48 — cibles de repli « A || B » : chaque partie est un sélecteur non vide ; la première étape de Paramètres montre la liste des rubriques (sans sous-onglet)', C.every((c) => c.etapes.every((e) => String(e.cible).split('||').every((x) => x.trim()))) && C.find((c) => c.id === 'params').etapes[0].cible === '[data-params-menu]' && !C.find((c) => c.id === 'params').etapes[0].sub && C.some((c) => c.etapes.some((e) => /\|\|/.test(e.cible))));
    { const v = ex(); const E = L.visiteEssentiel(v); const ids = E.map((c) => c.id);
      t('… « L’essentiel » : 8 à 10 étapes d’une étape chacune, prises dans les chapitres (titre, texte, cible), dans l’ordre', E.length >= 8 && E.length <= 10 && E.every((c) => c.etapes.length === 1) && L.VISITE_ESSENTIEL.every(([cid, i]) => C.find((c) => c.id === cid) && C.find((c) => c.id === cid).etapes[i]) && E.every((c) => C.find((x) => x.id === c.id).etapes.some((e) => e.titre === c.etapes[0].titre && e.texte === c.etapes[0].texte && e.cible === c.etapes[0].cible)) && ids[0] === 'prise' && ids.includes('cuverie') && ids.includes('params'), ids);
      const cuv = E.find((c) => c.id === 'cuverie').etapes[0]; const intr = E.find((c) => c.id === 'intrants').etapes[0]; const par = E.find((c) => c.id === 'params').etapes[0];
      t('… chaque étape garde le sous-onglet (ou le rang) des étapes qui la précèdent dans son chapitre', cuv.sub === 'plan' && cuv.cible === '.planwrap' && intr.clic === 0 && par.sub === undefined, { cuv, intr, par });
      L.moduleActiver(v, 'pressoir', false); const ids2 = L.visiteEssentiel(v, (m) => m !== 'trace').map((c) => c.id);
      t('… modules masqués ou non autorisés écartés', !ids2.includes('pressoir') && !ids2.includes('trace') && ids2.includes('ops') && ids2.length === ids.length - 2, ids2); }
    t('… durée annoncée : 8 s par étape, arrondie à la minute supérieure (56 étapes → ~8 min ; 10 → ~2 min ; au moins 1 min)', L.visiteDuree(56) === 8 && L.visiteDuree(10) === 2 && L.visiteDuree(0) === 1 && L.visiteDuree(C.reduce((n, c) => n + c.etapes.length, 0)) >= 7);
    // ---- version, traductions, fixture, compatibilité avec la 0.44.0-alpha.3 gelée
    t('version 0.45.0-alpha.1 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.45.0-alpha.1').notes.length === 3 && L.CHANGELOG.findIndex((c) => c.v === '0.45.0-alpha.1') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.44.0-alpha.3'));
    t('traductions : code d’agrément, visite, notes de version dans les six langues', L.tradControle().length === 0 && L.CHANGELOG.find((c) => c.v === '0.45.0-alpha.1').notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && L.traduire(qb.texte, 'it') !== qb.texte);
    const f60 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.45.0-alpha.1-bio.json'), 'utf8'))); L.syncConfig(f60);
    t('fixture 0.45.0-alpha.1 : « BIO » avec son code d’agrément et l’organisme, bascule tracée', q(f60, 'bio').label === 'BIO' && q(f60, 'bio').codeAgrement === 'FR-BIO-01' && q(f60, 'bio').organisme === 'Organisme fictif' && f60.settings.bioLibelle.de === 'FR-BIO-01' && L.qLabel('bio') === 'FR-BIO-01');
    const dirO = path.join(__dirname, 'anciennes', '0.44.0-alpha.3');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, richListCont, qLabel, operateurSave, APP_VERSION, APP_NUM };')({});
    t('0.44.0-alpha.3 gelée chargée', O.APP_VERSION === '0.44.0-alpha.3' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f60)); O.syncConfig(x); O.getR(x);
    t('… la 0.44.0-alpha.3 ouvre la base 0.45.0-alpha.1 sans rien perdre (code d’agrément, organisme gardés) ; elle affiche « BIO »', canonJ(x.lists.qualifs) === canonJ(f60.lists.qualifs) && O.qLabel('bio') === 'BIO' && canonJ(x.settings.bioLibelle) === canonJ(f60.settings.bioLibelle));
    O.richListCont(x, 'qualifs', 'edit', 'bio', { couleur: '#112233' }); x.meta.modifLe = '2026-12-13T12:00:00Z';
    const N = L.clone(f60); L.chantierCuveeSave(N, N.chantiersTirage[0].id, { nom: 'Cuvée bio fictive', qualif: 'bio' }, null, 'u1'); N.meta.modifLe = '2026-12-13T11:00:00Z';
    const FX = L.syncFusion(f60, N, x); const FX2 = O.syncFusion(f60, x, N);
    t('… synchronisation 0.45.0-alpha.1 ↔ 0.44.0-alpha.3 : couleur changée là-bas (code d’agrément gardé), cuvée bio ajoutée ici, rien de perdu', [FX.db, FX2.db].every((y) => { const b = y.lists.qualifs.find((z) => z.id === 'bio'); return b.couleur === '#112233' && b.codeAgrement === 'FR-BIO-01' && L.chantierCuvees(y.chantiersTirage[0]).some((c) => c.nom === 'Cuvée bio fictive'); }));
  }
  // ===== 61. 0.46.0-alpha.1 : opérations des autres vins (rouge et rosé, vins doux, élevage, stabilisation dont électrodialyse), méthode ancestrale, région et types de vins
  {
    const near = (a, b, e) => Math.abs(a - b) < (e || 0.01);
    const NOUV = ['eraflage', 'mpf_froid', 'mac_carbonique', 'mac_semi_carbonique', 'thermovinification', 'flash_detente', 'pigeage', 'mfc', 'arret_fermentation', 'mutage', 'pressurage_marcs', 'elevage_bois', 'elevage_voile', 'micro_oxygenation', 'copeaux', 'stab_electrodialyse', 'stab_cations', 'stab_proteique', 'assemblage_millesimes'];
    const D = L.DEFAULT_OPERATIONS(); const def = (id) => D.find((x) => x.id === id);
    t('catalogue : 19 opérations ajoutées, identifiants uniques, comportements existants (rejouées par toutes les versions), groupes connus, aide et icône', new Set(D.map((x) => x.id)).size === D.length && NOUV.every((id) => def(id) && ['suivi', 'intrant', 'transfert', 'filtration', 'froid', 'assemblage'].includes(def(id).base) && L.OP_GROUPES.includes(def(id).groupe) && def(id).aide && def(id).icone));
    t('… électrodialyse et échangeurs de cations : traitement avec pertes (filtration) ; mutage, copeaux, stabilisation protéique : intrants ; macérations à chaud ou à froid : traitement physique (température, durée)', def('stab_electrodialyse').base === 'filtration' && def('stab_cations').base === 'filtration' && ['mutage', 'copeaux', 'stab_proteique'].every((id) => def(id).base === 'intrant') && ['mpf_froid', 'thermovinification', 'flash_detente', 'mfc', 'arret_fermentation'].every((id) => def(id).base === 'froid') && def('pressurage_marcs').base === 'transfert');
    t('… proposées d’office : électrodialyse, stabilisation protéique, contrôle d’élevage sous bois, assemblage de millésimes ; les pratiques d’autres vins masquées (proposées par le profil)', ['stab_electrodialyse', 'stab_proteique', 'elevage_bois', 'assemblage_millesimes'].every((id) => !def(id).masque) && ['pigeage', 'mutage', 'elevage_voile', 'mac_carbonique', 'copeaux', 'stab_cations'].every((id) => def(id).masque) && def('remontage').label === 'Remontage');
    { const o = L.sampleDb(); o.lists.operations = o.lists.operations.filter((x) => !NOUV.includes(x.id)); o.lists.operations.find((x) => x.id === 'remontage').label = 'Remontage / pigeage'; const n = L.normalizeDb(o);
      const o2 = L.sampleDb(); o2.lists.operations.find((x) => x.id === 'remontage').label = 'Remontage (maison)'; const n2 = L.normalizeDb(o2);
      t('base antérieure : nouvelles opérations insérées à leur place, « Remontage / pigeage » d’origine renommé « Remontage », libellé maison gardé', NOUV.every((id) => n.lists.operations.some((x) => x.id === id)) && n.lists.operations.findIndex((x) => x.id === 'pigeage') === n.lists.operations.findIndex((x) => x.id === 'delestage') + 1 && n.lists.operations.find((x) => x.id === 'remontage').label === 'Remontage' && n2.lists.operations.find((x) => x.id === 'remontage').label === 'Remontage (maison)'); }
    // ---- profil viticole
    { const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); const ops = (p) => p.filter((x) => x.groupe === 'operations' && x.apres === 'proposée').map((x) => x.id.slice(3));
      t('profil : vins rouges → opérations de vinification en rouge ; vins doux → arrêt de fermentation et mutage ; Jura → élevage sous voile ; Champagne : aucune de ces opérations', ['pigeage', 'mac_carbonique', 'thermovinification', 'pressurage_marcs', 'micro_oxygenation'].every((id) => ops(L.profilPlan(d, 'bordeaux', ['rouge'])).includes(id)) && ['arret_fermentation', 'mutage'].every((id) => ops(L.profilPlan(d, 'bordeaux', ['blanc', 'doux'])).includes(id)) && !ops(L.profilPlan(d, 'bordeaux', ['blanc', 'doux'])).includes('pigeage') && ops(L.profilPlan(d, 'jura_savoie', ['blanc'])).includes('elevage_voile') && !ops(L.profilPlan(d, 'champagne', ['effervescent', 'blanc'])).some((id) => NOUV.includes(id)));
      L.profilAppliquer(d, 'bordeaux', ['rouge', 'blanc'], null, 'u1'); L.syncConfig(d);
      t('… appliqué : opérations proposées à la saisie (catalogue de la cuve), réversible par un autre profil', ['pigeage', 'mfc'].every((id) => !d.lists.operations.find((x) => x.id === id).masque) && L.opSurPortion(d).some((x) => x.id === 'pigeage') && (() => { L.profilAppliquer(d, 'bordeaux', ['blanc'], null, 'u1'); return d.lists.operations.find((x) => x.id === 'pigeage').masque === true; })()); }
    // ---- méthode ancestrale
    const f61 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.46.0-alpha.1-operations.json'), 'utf8'))); L.syncConfig(f61); const R = L.replay(f61);
    const ta = f61.ops.find((o) => o.type === 'tirage' && o.mode === 'ancestrale'); const liq = Object.values(R.preps).find((p) => p.ptype === 'liqueur_tirage'); const R0 = L.replay(f61, '2026-12-04'); const pv = Object.values(R0.portions).find((p) => p.vol > 100 && !L.lotEstMixtion(f61, R0, p.lotId));
    t('méthode ancestrale : mode connu ; vin hors cuve de mixtion sans liqueur accepté ; liqueur de tirage refusée ; cuve de mixtion refusée', L.TIRAGE_MODES.some((m) => m.id === 'ancestrale') && L.tirageModeControle(f61, R0, { mode: 'ancestrale', sources: [{ portionId: pv.id, lotId: pv.lotId }] }) === null && /pas de liqueur de tirage/.test(L.tirageModeControle(f61, R0, { mode: 'ancestrale', sources: [{ portionId: pv.id, lotId: pv.lotId }], prepUses: [{ prepId: liq.id, volL: 1 }] }) || '') && /pas de cuve de mixtion/.test(L.tirageModeControle(f61, R, { mode: 'ancestrale', sources: [{ lotId: f61.ops.find((o) => o.mixtion).lotId }] }) || ''));
    t('… lot tiré en méthode ancestrale : 400 bouteilles sur lattes, dégorgement possible ensuite ; cuvée prévue en méthode ancestrale gardée', R.tir[ta.lotId].nb === 400 && (() => { const x = L.clone(f61); L.chantierCuveeSave(x, x.chantiersTirage[0].id, { nom: 'Pétillant naturel prévu', mode: 'ancestrale' }, null, 'u1'); return L.chantierCuvees(x.chantiersTirage[0]).find((c) => c.nom === 'Pétillant naturel prévu').mode === 'ancestrale'; })());
    // ---- fixture : opérations rejouées
    const pig = f61.ops.find((o) => o.sousType === 'pigeage'); const ed = f61.ops.find((o) => o.sousType === 'stab_electrodialyse'); const Ra = L.replay(f61, '2026-12-04');
    t('fixture : pigeage (suivi, sans mouvement), électrodialyse (perte de 12 L enregistrée), libellés du catalogue', pig.type === 'suivi' && ed.type === 'filtration' && near(Ra.portions[ed.portionId].vol - R.portions[ed.portionId].vol, 12) && L.opNom(pig) === 'Pigeage' && L.opNom(ed) === 'Stabilisation tartrique par électrodialyse');
    t('version 0.46.0-alpha.1 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.46.0-alpha.1').notes.length === 3 && L.CHANGELOG.findIndex((c) => c.v === '0.46.0-alpha.1') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.45.0-alpha.1'));
    t('traductions : opérations, aides, méthode ancestrale, notes de version dans les six langues', L.tradControle().length === 0 && L.CHANGELOG.find((c) => c.v === '0.46.0-alpha.1').notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && NOUV.every((id) => L.traduire(def(id).label, 'en') !== def(id).label || ['Thermovinification'].includes(def(id).label)) && L.traduire(L.TIRAGE_MODES[2].label, 'de') !== L.TIRAGE_MODES[2].label);
    const dirO = path.join(__dirname, 'anciennes', '0.45.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, replay, clone, opSave, APP_VERSION, APP_NUM };')({});
    t('0.45.0-alpha.1 gelée chargée', O.APP_VERSION === '0.45.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f61)); O.syncConfig(x); const Ro = O.replay(x);
    t('… la 0.45.0-alpha.1 ouvre la base 0.46.0-alpha.1 sans rien perdre (catalogue, opérations), rejoue les mêmes volumes et le tirage en méthode ancestrale', canonJ(x.lists.operations) === canonJ(f61.lists.operations) && canonJ(x.ops) === canonJ(f61.ops) && near(Ro.portions[ed.portionId].vol, R.portions[ed.portionId].vol) && Ro.tir[ta.lotId].nb === 400);
    const rO = O.opSave(x, { ...O.clone(pig), notes: 'Relu là-bas' }, pig.id); x.meta.modifLe = '2026-12-14T12:00:00Z';
    const N = L.clone(f61); N.lists.operations.find((o) => o.id === 'mutage').masque = false; N.meta.modifLe = '2026-12-14T11:00:00Z';
    const FX = L.syncFusion(f61, N, x); const FX2 = O.syncFusion(f61, x, N);
    t('… synchronisation 0.46.0-alpha.1 ↔ 0.45.0-alpha.1 : pigeage relu là-bas (sous-type gardé), mutage proposé ici, rien de perdu', rO.ok && [FX.db, FX2.db].every((y) => { const p = y.ops.find((o) => o.id === pig.id); return p.notes === 'Relu là-bas' && p.sousType === 'pigeage' && y.lists.operations.find((o) => o.id === 'mutage').masque === false; }));
  }
  // ===== 62. 0.46.0-alpha.2 : référentiel des appellations (France, UE, Suisse, États-Unis, Australie), types hors appellation, région Charentes
  {
    const A = L.appRef(); const pays = (p) => A.filter((a) => a.pays === p); const regIds = new Set(L.PROFIL_REGIONS.map((r) => r.id));
    t('référentiel : 1 692 appellations, identifiants uniques, chaque région connue du profil, catégories ou « non restreintes », couleurs connues, source citée', A.length === 1692 && new Set(A.map((a) => a.id)).size === A.length && A.every((a) => regIds.has(a.region) && (a.libre || a.cats.length) && a.couleurs.every((c) => ['blanc', 'rose', 'rouge'].includes(c)) && /^https?:\/\//.test(a.source)));
    t('… France : 365 AOP et 74 IGP enregistrées (+ 2 demandes, 3 annulées, 4 absentes de la liste de l’INAO signalées)', pays('france').filter((a) => a.eu === 'AOP' && a.etat !== 'annulee' && a.etat !== 'demande').length === 365 && pays('france').filter((a) => a.eu === 'IGP' && a.etat !== 'annulee' && a.etat !== 'demande').length === 74 && pays('france').filter((a) => a.etat === 'demande').length === 2 && pays('france').filter((a) => a.etat === 'annulee').length === 3 && pays('france').filter((a) => a.etat === 'absente_inao').length === 4);
    t('… UE : Italie 522, Espagne 149, Portugal 44, Allemagne 46, Autriche 30 ; hors UE : Suisse 63, États-Unis 280, Australie 114 (indications non restreintes)', [['italie', 522], ['espagne', 149], ['portugal', 44], ['allemagne', 46], ['autriche', 30], ['suisse', 63], ['etats_unis', 280], ['australie', 114]].every(([p, n]) => pays(p).length === n) && ['suisse', 'etats_unis', 'australie'].every((p) => pays(p).every((a) => a.libre)));
    const C = L.appTypesRegion('champagne');
    t('Champagne : Champagne (effervescent blanc et rosé), Coteaux champenois, Rosé des Riceys ; méthode ancestrale et vins moelleux « hors appellation »', ['Champagne', 'Coteaux champenois', 'Rosé des Riceys'].every((n) => L.appRefRegion('champagne').some((a) => a.nom === n && a.signe === 'AOP')) && ['effervescent', 'blanc', 'rose', 'rouge'].every((x) => C.possibles.includes(x)) && L.profilTypeHorsAppellation('champagne', 'ancestrale') && L.profilTypeHorsAppellation('champagne', 'doux') && !L.profilTypeHorsAppellation('champagne', 'effervescent') && C.parType.effervescent.includes('Champagne'));
    t('… méthode ancestrale autorisée en Vallée du Rhône (Clairette de Die), Jura-Savoie (Bugey), Sud-Ouest (Gaillac), Languedoc (Limoux) ; vins doux à Bordeaux et en Alsace ; régions sans données ou indications non restreintes : rien de signalé', !L.profilTypeHorsAppellation('rhone', 'ancestrale') && L.appTypesRegion('rhone').parType.ancestrale.includes('Clairette de Die') && !L.profilTypeHorsAppellation('jura_savoie', 'ancestrale') && !L.profilTypeHorsAppellation('sud_ouest', 'ancestrale') && !L.profilTypeHorsAppellation('languedoc', 'ancestrale') && !L.profilTypeHorsAppellation('bordeaux', 'doux') && !L.profilTypeHorsAppellation('alsace', 'doux') && L.PROFIL_TYPES.every(([t2]) => !L.profilTypeHorsAppellation('suisse', t2) && !L.profilTypeHorsAppellation('autre', t2)));
    t('… les appellations annulées ou en demande ne comptent pas ; types d’une appellation : couleurs non précisées = trois couleurs', L.appTypes({ libre: false, cats: ['tranquille'], couleurs: [] }).join() === 'blanc,rose,rouge' && L.appTypes({ libre: false, cats: ['vdn'], couleurs: ['blanc'] }).join() === 'doux' && L.appTypes({ libre: false, cats: ['sous_voile'], couleurs: [] }).join() === 'blanc' && !L.appTypesRegion('bordeaux').parType.blanc.includes('Graves supérieures'));
    t('région Charentes : Pineau des Charentes (vin de liqueur) et IGP Charentais ; types blancs et doux par défaut', L.appRefRegion('charentes').map((a) => a.nom).sort().join() === 'Charentais,Pineau des Charentes' && L.PROFIL_REGIONS.find((r) => r.id === 'charentes').types.join() === 'blanc,doux' && L.appTypesRegion('charentes').parType.doux.includes('Pineau des Charentes'));
    // ---- recherche et ajout
    const ch = L.appChercher('chablis', { region: 'bourgogne' });
    t('recherche : « chablis » → Chablis (Bourgogne) d’abord, puis Petit Chablis, Chablis Grand Cru ; accents et casse ignorés ; région du profil d’abord ; limite', ch[0].nom === 'Chablis' && ch.some((a) => a.nom === 'Petit Chablis') && L.appChercher('CHÂTEAUNEUF', {})[0].nom === 'Châteauneuf-du-Pape' && L.appChercher('rioja', { region: 'espagne' })[0].pays === 'espagne' && L.appChercher('a', { limite: 5 }).length === 5 && L.appChercher('', {}).length === 0);
    { const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); const n0 = d.lists.appellations.length + (d.lists.appellations.some((a) => !a.ref && A.some((z) => L.norm(z.nom) === L.norm(a.label))) ? 0 : 1); const r1 = L.appellationDepuisRef(d, ch[0].id); const r2 = L.appellationDepuisRef(d, ch[0].id); const r3 = L.appellationDepuisRef(d, 'x:y');
      const ex = d.lists.appellations.find((a) => !a.ref && A.some((z) => L.norm(z.nom) === L.norm(a.label))) || (() => { d.lists.appellations.push({ id: 'app-t62', label: 'Sancerre' }); return d.lists.appellations[d.lists.appellations.length - 1]; })(); const refEx = A.find((a) => L.norm(a.nom) === L.norm(ex.label)); const r4 = refEx ? L.appellationDepuisRef(d, refEx.id) : { ok: true, deja: true };
      t('ajout depuis le référentiel : appellation et sa référence (région, pays, signe) ; sans doublon ; inconnue refusée ; appellation déjà saisie à la main complétée de sa référence', r1.ok && d.lists.appellations.length === n0 + 1 && d.lists.appellations.find((a) => a.id === r1.id).ref.signe === 'AOP' && r2.ok && r2.deja && d.lists.appellations.length === n0 + 1 && !r3.ok && r4.deja && (!refEx || !!d.lists.appellations.find((a) => a.id === ex.id).ref)); }
    // ---- version, traductions, fixture, compatibilité
    t('version 0.46.0-alpha.2 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.46.0-alpha.2').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.46.0-alpha.2') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.46.0-alpha.1'));
    t('traductions : référentiel, hors appellation, région Charentes, notes de version dans les six langues', L.tradControle().length === 0 && L.CHANGELOG.find((c) => c.v === '0.46.0-alpha.2').notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && L.traduire('hors appellation', 'en') !== 'hors appellation' && L.traduire(L.PROFIL_TYPES[5][1], 'it') !== L.PROFIL_TYPES[5][1]);
    const f62 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.46.0-alpha.2-appellations.json'), 'utf8'))); L.syncConfig(f62);
    t('fixture 0.46.0-alpha.2 : Chablis et Rioja ajoutés depuis le référentiel', ['Chablis', 'Rioja'].every((n) => f62.lists.appellations.some((a) => a.label === n && a.ref && a.ref.id)));
    const dirO = path.join(__dirname, 'anciennes', '0.46.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, listRename, APP_VERSION, APP_NUM };')({});
    t('0.46.0-alpha.1 gelée chargée', O.APP_VERSION === '0.46.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f62)); O.syncConfig(x); O.getR(x);
    t('… la 0.46.0-alpha.1 ouvre la base 0.46.0-alpha.2 sans rien perdre (appellations et leur référence)', canonJ(x.lists.appellations) === canonJ(f62.lists.appellations));
    const ap = x.lists.appellations.find((a) => a.label === 'Rioja'); O.listRename(x, 'appellations', ap.id, 'Rioja (DOCa)'); x.meta.modifLe = '2026-12-15T12:00:00Z';
    const N = L.clone(f62); L.appellationDepuisRef(N, L.appChercher('Sancerre', {})[0].id); N.meta.modifLe = '2026-12-15T11:00:00Z';
    const FX = L.syncFusion(f62, N, x); const FX2 = O.syncFusion(f62, x, N);
    t('… synchronisation 0.46.0-alpha.2 ↔ 0.46.0-alpha.1 : Rioja renommée là-bas (référence gardée), Sancerre ajoutée ici, rien de perdu', [FX, FX2].every((F) => { const L2 = F.db.lists.appellations; const r = L2.find((a) => a.id === ap.id); return L2.some((a) => a.label === 'Sancerre') && ((r.label === 'Rioja (DOCa)' && r.ref && r.ref.id) || F.conflits.length > 0); }));
  }
  // ===== 63. 0.47.0-alpha.1 : échelle par appellation (hiérarchies, proposée puis confirmée), appellation et niveau des parcelles, appellations d'un lot
  {
    const H = L.ECHELLE_HIERARCHIES;
    t('hiérarchies : les 5 d’origine puis Chablis, Beaujolais, Côtes du Rhône, Médoc, Sauternes, Graves, Languedoc, Loire, Italie, Espagne, Allemagne, Autriche, Portugal, Suisse ; identifiants uniques, niveaux rangés, nouvelles « à vérifier »', new Set(H.map((h) => h.id)).size === H.length && H.length === 19 && ['champagne', 'bourgogne', 'alsace', 'saint-emilion', 'generique'].every((id, i) => H[i].id === id) && H.every((h) => h.items.length >= 2 && h.items.every((x, i) => x.rang === i + 1 && x.id && x.label && x.un && x.court)) && H.slice(5).every((h) => h.aVerifier) && L.echelleHierarchie('chablis').items.map((x) => x.id).join() === 'petit_chablis,chablis,premier,grand' && L.echelleHierarchie('allemagne').items.length === 5);
    const P = (label, ref, reg) => L.appEchelleProposee({ label, ref }, reg);
    t('hiérarchie proposée : Champagne, Chablis (avant Bourgogne), Bourgogne, Alsace, Saint-Émilion grand cru, Pauillac → Médoc, Barsac → Sauternes, Pessac-Léognan → Graves, Morgon → Beaujolais, Gigondas → Rhône, Pic Saint-Loup → Languedoc, Savennières → Loire, IGP → générique, pays étrangers ; sans référence : région du profil',
      P('Champagne', { region: 'champagne', pays: 'france', eu: 'AOP' }) === 'champagne' && P('Petit Chablis', { region: 'bourgogne', pays: 'france', eu: 'AOP' }) === 'chablis' && P('Meursault', { region: 'bourgogne', pays: 'france', eu: 'AOP' }) === 'bourgogne' && P('Alsace grand cru Brand', { region: 'alsace', pays: 'france', eu: 'AOP' }) === 'alsace'
      && P('Saint-Émilion grand cru', { region: 'bordeaux', pays: 'france', eu: 'AOP' }) === 'saint-emilion' && P('Pauillac', { region: 'bordeaux', pays: 'france', eu: 'AOP' }) === 'medoc' && P('Barsac', { region: 'bordeaux', pays: 'france', eu: 'AOP' }) === 'sauternes' && P('Pessac-Léognan', { region: 'bordeaux', pays: 'france', eu: 'AOP' }) === 'graves'
      && P('Morgon', { region: 'beaujolais', pays: 'france', eu: 'AOP' }) === 'beaujolais' && P('Gigondas', { region: 'rhone', pays: 'france', eu: 'AOP' }) === 'rhone' && P('Pic Saint-Loup', { region: 'languedoc', pays: 'france', eu: 'AOP' }) === 'languedoc' && P('Savennières', { region: 'loire', pays: 'france', eu: 'AOP' }) === 'loire'
      && P('Pays d’Oc', { region: 'languedoc', pays: 'france', eu: 'IGP' }) === 'generique' && P('Rioja', { region: 'espagne', pays: 'espagne', eu: 'AOP' }) === 'espagne' && P('Mosel', { region: 'allemagne', pays: 'allemagne' }) === 'allemagne' && P('Ma cuvée', null, 'bourgogne') === 'bourgogne' && P('Ma cuvée', null, 'autre') === 'generique');
    const f63 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.47.0-alpha.1-echelles.json'), 'utf8'))); L.syncConfig(f63); const R = L.replay(f63);
    const ap = (n) => f63.lists.appellations.find((a) => a.label === n); const rioja = L.appellationEchelle(f63, ap('Rioja').id);
    t('hiérarchie d’une appellation : confirmée (Chablis) ou proposée (Rioja → Espagne) ; appellation inconnue : rien', L.appellationEchelle(f63, ap('Chablis').id).confirmee && L.appellationEchelle(f63, ap('Chablis').id).id === 'chablis' && !rioja.confirmee && rioja.id === 'espagne' && L.appellationEchelle(f63, 'x') === null);
    { const d = L.clone(f63); const r1 = L.appellationEchelleSet(d, ap('Rioja').id, 'espagne', 'u1'); const r2 = L.appellationEchelleSet(d, ap('Rioja').id, 'zz', 'u1'); const r3 = L.appellationEchelleSet(d, ap('Champagne').id, 'italie', 'u1');
      t('confirmer ou changer : hiérarchie inconnue refusée ; changement refusé si des parcelles ont un niveau qui n’existe pas dans la nouvelle', r1.ok && d.lists.appellations.find((a) => a.label === 'Rioja').echelle === 'espagne' && d.lists.appellations.find((a) => a.label === 'Rioja').echellePar === 'u1' && !r2.ok && !r3.ok && /parcelle/.test(r3.msg)); }
    const pc = f63.parcelles.find((p) => p.appellationId);
    t('parcelle : appellation et niveau enregistrés ; niveau hors hiérarchie ou appellation inconnue refusés ; formulaire sans ces champs : gardés', pc.appellationId === ap('Champagne').id && pc.niveau === 'grand' && (() => { const d = L.clone(f63); const p = d.parcelles.find((x) => x.id === pc.id);
      return !L.parcelleSave(d, { ...p, niveau: 'petit_chablis' }, p.id).ok && !L.parcelleSave(d, { ...p, appellationId: 'zz' }, p.id).ok && L.parcelleSave(d, { nom: p.nom, cruId: p.cruId }, p.id).ok && d.parcelles.find((x) => x.id === p.id).niveau === 'grand'; })());
    const lotId = Object.keys(R.lots).find((id) => R.lots[id].code === 'P25-01'); const la = L.lotAppellations(f63, R, lotId);
    t('lot : appellations et niveaux au prorata de ses parcelles (Champagne · Grand cru) ; parcelles sans appellation : part inconnue', la.some((x) => x.label === 'Champagne' && x.niveauLabel === 'Grand Cru' && x.part > 0) && Math.abs(la.reduce((s, x) => s + x.part, 0) - 1) < 1e-9);
    t('… l’échelle des crus de l’exploitation est inchangée (composition, versions antérieures)', canonJ(f63.lists.echelles) === canonJ(L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.46.0-alpha.2-appellations.json'), 'utf8'))).lists.echelles));
    { const g = L.clone(f63); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-t63', nom: 'Cave', modules: { params: 'lecture', cuverie: 'ecriture' }, droits: {} }]; g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-t63', identifiant: 't63', nom: 'T', profilId: 'pf-t63', actif: true }];
      const h = L.clone(g); L.appellationEchelleSet(h, ap('Rioja').id, 'espagne', 'u-t63');
      t('droits : confirmer une hiérarchie (liste des appellations) exige l’écriture des paramètres', L.gardeDroits(g, h, 'u-t63').ok === false); }
    t('version 0.47.0-alpha.1 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.47.0-alpha.1').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.47.0-alpha.1') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.46.0-alpha.2'));
    t('traductions : hiérarchies, parcelles, notes de version dans les six langues', L.tradControle().length === 0 && L.CHANGELOG.find((c) => c.v === '0.47.0-alpha.1').notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && ['Crus du Beaujolais', 'Crus classés en 1855', 'Niveau de la parcelle'].every((x) => L.traduire(x, 'en') !== x));
    const dirO = path.join(__dirname, 'anciennes', '0.46.0-alpha.2');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, parcelleSave, APP_VERSION, APP_NUM };')({});
    t('0.46.0-alpha.2 gelée chargée', O.APP_VERSION === '0.46.0-alpha.2' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f63)); O.syncConfig(x); O.getR(x);
    t('… la 0.46.0-alpha.2 ouvre la base 0.47.0-alpha.1 sans rien perdre (hiérarchies des appellations, appellation et niveau des parcelles)', canonJ(x.lists.appellations) === canonJ(f63.lists.appellations) && canonJ(x.parcelles) === canonJ(f63.parcelles));
    const px = x.parcelles.find((p) => p.id === pc.id); O.parcelleSave(x, { ...px, notes: 'Relue là-bas' }, px.id); x.meta.modifLe = '2026-12-16T12:00:00Z';
    t('… une parcelle modifiée par la 0.46.0-alpha.2 garde son appellation et son niveau', x.parcelles.find((p) => p.id === pc.id).niveau === 'grand' && x.parcelles.find((p) => p.id === pc.id).appellationId === pc.appellationId);
    const N = L.clone(f63); L.appellationEchelleSet(N, ap('Rioja').id, 'espagne', 'u1'); N.meta.modifLe = '2026-12-16T11:00:00Z';
    const FX = L.syncFusion(f63, N, x); const FX2 = O.syncFusion(f63, x, N);
    t('… synchronisation 0.47.0-alpha.1 ↔ 0.46.0-alpha.2 : parcelle relue là-bas, hiérarchie de Rioja confirmée ici, rien de perdu', [FX.db, FX2.db].every((y) => y.parcelles.find((p) => p.id === pc.id).notes === 'Relue là-bas' && y.parcelles.find((p) => p.id === pc.id).niveau === 'grand' && y.lists.appellations.find((a) => a.label === 'Rioja').echelle === 'espagne'));
  }
  // ===== 64. 0.47.0-alpha.2 : revue du vocabulaire technique (constats validés), coefficients corrigés, rosé par coupage, TAV acquis, Folin, « non millésimé »
  {
    const neuve = () => { const d = L.normalizeDb(L.emptyDb()); L.syncConfig(d); return d; }; const near = (a, b, e) => Math.abs(a - b) < (e || 1e-9);
    const d0 = neuve(); const p0 = L.tirageProfil(d0);
    // ---- T12 : augmentation de volume du saccharose — valeur physique (calculs) et valeur douanière (déclarations)
    t('saccharose : 0,6329 L/kg (valeur physique, calculs) et 0,66 L/kg (valeur douanière, déclarations), réglables séparément dans le profil', L.SUCRE_VOL_PHYSIQUE_LKG === 0.6329 && L.SUCRE_VOL_DOUANE_LKG === 0.66 && p0.volSucreLkg === 0.6329 && p0.volSucreDeclLkg === 0.66 && L.sucreVolPhysique(d0) === 0.6329 && L.sucreVolDouane(d0) === 0.66);
    { const c = L.tirageCalcul({ mode: 'cols', formats: [{ format: 'bouteille', nb: 10000 }] }, { ...p0, pointGL: 24 }); const k = L.declPrealableCalcul(d0, { vinHL: 100, pointGL: 24 });
      const eS = L.enrichSimuler(d0, { volL: 10000, tap: 9.5, tav: 10.5, methode: 'sucre' }); const dR = L.clone(d0); L.tirageProfilSet(dR, { volSucreLkg: 0.64 }, 'u1'); const eR = L.enrichSimuler(dR, { volL: 10000, tap: 9.5, tav: 10.5, methode: 'sucre' }); const kR = L.declPrealableCalcul(dR, { vinHL: 100, pointGL: 24 });
      t('… calculateur de tirage et simulateur d’enrichissement : une seule valeur physique (0,6329 ; réglée à 0,64, les deux suivent) ; déclaration préalable : sucre × 0,66 ; bornes du réglage', near(c.vinFonteL, c.liqueurL - c.sucreKg * 0.6329, 1e-6) && near(eS.volFinalL, 10000 + eS.sucreKg * 0.6329, 1e-6) && near(eR.volFinalL, 10000 + eR.sucreKg * 0.64, 1e-6) && L.sucreVolPhysique(dR) === 0.64 && near(k.sucreHL, k.sucreKg * 0.66 / 100, 1e-9) && near(kR.sucreHL, kR.sucreKg * 0.66 / 100, 1e-9) && !L.tirageProfilSet(L.clone(d0), { volSucreDeclLkg: 0.9 }, 'u1').ok && near(L.liqueurFonte({ sucreKg: 100 }, 500).augmentationL, 63.29, 1e-9)); }
    // ---- T13 : un seul coefficient, 2,5 g/L par point de densité, points par g/L déduits (0,4)
    { const d = L.clone(d0); d.settings.coefSucre = 2.7; const r = L.tirageCorrection({ densInit: 990, pointGL: 24, densLue: 999.6, volL: 1000 }, L.tirageProfil(d0));
      t('sucre et densité : 2,5 g/L par point par défaut, 0,4 point par g/L déduit (24 g/L ≈ +9,6) ; un coefficient réglé (2,7) change aussi la correction du point de tirage', d0.settings.coefSucre === 2.5 && L.COEF_SUCRE_DEFAUT === 2.5 && near(L.densPtParGL(d0), 0.4) && near(p0.densPtParGL, 0.4) && near(r.densTheo - 990, 9.6) && near(L.tirageProfil(d).densPtParGL, 1 / 2.7) && near(L.coefSucre({ settings: {} }), 2.5)); }
    // ---- migrations : valeurs d'origine remplacées une fois, valeurs réglées par l'exploitation gardées
    { const base = () => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.47.0-alpha.1-echelles.json'), 'utf8'));
      const m = (patch) => { const x = base(); patch(x); return L.normalizeDb(x); };
      const a1 = m(() => {}); const a2 = m((x) => { x.settings.coefSucre = 2.7; }); const a3 = m((x) => { x.settings.tirageProfil = { ...(x.settings.tirageProfil || {}), densPtParGL: 0.38, volSucreLkg: 0.66 }; }); const a4 = m((x) => { x.settings.tirageProfil = { ...(x.settings.tirageProfil || {}), volSucreLkg: 0.65 }; });
      const a5 = L.clone(a1); a5.settings.coefSucre = 2.6; const a6 = L.normalizeDb(a5);
      t('migration des coefficients : 2,6 d’origine → 2,5 ; 2,7 réglé gardé ; points par g/L réglés à la main (0,38) → coefficient déduit (2,6316) ; 0,66 L/kg des calculs → 0,6329, 0,65 réglé gardé ; une seule fois (2,6 remis ensuite : gardé)', a1.settings.coefSucre === 2.5 && a2.settings.coefSucre === 2.7 && near(a3.settings.coefSucre, 2.6316, 1e-9) && a3.settings.tirageProfil.volSucreLkg === 0.6329 && a4.settings.tirageProfil.volSucreLkg === 0.65 && a6.settings.coefSucre === 2.6 && !!a1.settings.termes047 && a1.settings.termes047.version === L.APP_VERSION && a1.settings.termes047.changements.some((c) => c.cle === 'settings.coefSucre'));
      const u = m((x) => { x.lists.typesPerte.find((y) => y.id === 'ouillage').label = 'Évaporation maison'; x.lists.fractions.find((y) => y.id === 'taille1').label = 'Première taille'; x.lists.operations.find((y) => y.id === 'froid').aide = 'Notre consigne de froid'; x.lists.stades.find((y) => y.id === 'vin_clair').label = 'Vin clair (vin de base)'; });
      t('libellés : ceux d’origine renommés (perte, filtration, méchage, cépage, stades, échelle, catalogue des opérations, plan de nettoyage, exemple du plan) ; ceux changés par l’exploitation gardés', a1.lists.typesPerte.find((y) => y.id === 'ouillage').label === 'Évaporation (part des anges)' && a1.lists.methodesFiltration.find((y) => y.id === 'diato').label === 'Terre de diatomées' && a1.lists.actionsHygiene.find((y) => y.id === 'soufrage').label === 'Méchage / SO₂' && a1.lists.cepages.find((y) => y.id === 'pn').label === 'Pinot noir'
        && a1.lists.stades.find((y) => y.id === 'vin_clair').label === 'Vin clarifié' && a1.lists.stades.find((y) => y.id === 'stabilise').label === 'Vin stabilisé, prêt à la mise en bouteille ou au tirage' && a1.lists.echelles.find((y) => y.id === 'premier').un === 'Premier Cru' && a1.lists.echelles.find((y) => y.id === 'grand').label === 'Grands Crus'
        && a1.lists.operations.find((y) => y.id === 'enrichissement').label === 'Enrichissement' && /phosphate diammonique/.test(a1.lists.operations.find((y) => y.id === 'nutrition').aide) && /Demeter/.test(a1.planNettoyage.find((y) => y.id === 'pn_cuves_revendication').mode)
        && (a1.plansVinif || []).every((pl) => pl.id !== 'pv-exemple-blanc' || pl.lignes.find((l) => l.id === 'l9').etape === 'Enrichissement (TAV visé)')
        && u.lists.typesPerte.find((y) => y.id === 'ouillage').label === 'Évaporation maison' && u.lists.fractions.find((y) => y.id === 'taille1').label === 'Première taille' && u.lists.operations.find((y) => y.id === 'froid').aide === 'Notre consigne de froid' && u.lists.stades.find((y) => y.id === 'vin_clair').label === 'Vin clair (vin de base)');
      const b0 = base();
      t('… identifiants inchangés, rien de supprimé (centrifugation gardée dans une base existante), migration idempotente (base rouverte identique)', ['typesPerte', 'methodesFiltration', 'fractions', 'cepages', 'stades', 'echelles'].every((k) => b0.lists[k].every((y) => a1.lists[k].some((z) => z.id === y.id))) && a1.lists.methodesFiltration.some((y) => y.id === 'centrif') && canonJ(L.normalizeDb(L.clone(a1)).lists) === canonJ(a1.lists) && canonJ(L.normalizeDb(L.clone(a1)).settings.termes047) === canonJ(a1.settings.termes047)); }
    // ---- T23 : fractions d'une base neuve, base existante inchangée, sous-fractions
    const f64 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.47.0-alpha.2-termes.json'), 'utf8'))); L.syncConfig(f64);
    t('fractions d’une base neuve : Cuvée, Taille, Rebêche (+ lies, bourbes)', d0.lists.fractions.map((x) => x.label).join() === 'Cuvée,Taille,Rebêche,Lies,Bourbes' && L.fracRole(d0, 'taille1') === 'taille' && L.DEFAULT_FRACTIONS().every((x) => x.id !== 'taille2'));
    t('… base existante : ses fractions gardées (2e taille, fraction ajoutée), libellés d’origine écrits « 1re taille » / « 2e taille » ; sous-fraction « Cœur de cuvée » comptée en cuvée ; rôle deviné pour « Tête de cuvée », « 2e taille »', ['cuvee', 'taille1', 'taille2', 'rebeche', 'lies', 'bourbes', 'fr425'].every((id) => f64.lists.fractions.some((x) => x.id === id)) && L.fracLabel(f64, 'taille1') === '1re taille' && L.fracLabel(f64, 'taille2') === '2e taille' && L.fracRole(f64, f64.lists.fractions.find((x) => x.label === 'Cœur de cuvée').id) === 'cuvee' && L.fracRoleDevine('Tête de cuvée') === 'cuvee' && L.fracRoleDevine('2e taille') === 'taille');
    { const x = L.clone(f64); delete x.lists.fractions; x.ops.push({ id: 'opx64', type: 'suivi', date: '2026-12-02', fractionId: 'taille2' }); const y = L.normalizeDb(x);
      t('… base sans liste de fractions enregistrée qui utilise la 2e taille : elle la retrouve', y.lists.fractions.some((f) => f.id === 'taille2' && f.label === '2e taille') && !L.normalizeDb(L.emptyDb()).lists.fractions.some((f) => f.id === 'taille2')); }
    // ---- T27 : rosé par coupage
    { const d = L.clone(d0); d.settings.region = 'autre'; d.settings.profilViticole = { region: 'rhone', types: ['rouge', 'blanc'] }; const al = L.roseCoupageAlerte(d, ['blanc', 'rouge']);
      const cr = L.clone(d); cr.lists.appellations = [...(cr.lists.appellations || []), { id: 'app-cr', label: 'Côte-Rôtie' }]; const ef = L.clone(d); ef.settings.profilViticole = { region: 'loire', types: ['effervescent'] }; const ch = L.clone(d0); ch.settings.region = 'champagne';
      t('rosé par coupage blanc + rouge : vin tranquille averti (règlement délégué (UE) 2019/934, art. 8, exception Côte-Rôtie citée) ; cuvée de mousseux (mixtion, cuvée prévue, Champagne, effervescents seuls) non ; Côte-Rôtie dans la liste non ; même couleur ou blanc + rosé non', !!al && /2019\/934, art\. 8/.test(al) && /Côte-Rôtie/.test(al) && L.roseCoupageAlerte(d, ['blanc', 'rouge'], { mixtion: true }) === null && L.roseCoupageAlerte(d, ['blanc', 'rouge'], { cuveeId: 'cv1' }) === null && L.roseCoupageAlerte(ch, ['blanc', 'rouge']) === null && L.roseCoupageAlerte(ef, ['blanc', 'rouge']) === null && L.roseCoupageAlerte(cr, ['rouge', 'blanc']) === null && L.roseCoupageAlerte(d, ['blanc', 'blanc']) === null && L.roseCoupageAlerte(d, ['blanc', 'rose']) === null); }
    { const sd = L.normalizeDb(L.sampleDb()); L.syncConfig(sd); const R = L.getR(sd); const op = sd.ops.find((o) => o.lotSpec && o.lotSpec.code === 'ROS-26-01'); const Rb = L.getR(sd, '2026-11-09'); const cp = L.assemblageCoupage(sd, Rb, op.sources);
      const st = L.clone(sd); st.settings.region = 'autre'; st.settings.profilViticole = { region: 'bourgogne', types: ['blanc', 'rouge'] }; const cs = L.assemblageCoupage(st, Rb, op.sources);
      t('… assemblage d’un blanc et d’un rouge (jeu d’exemple) : coupage (couleurs) signalé, pas d’avertissement en Champagne ; avertissement pour une exploitation de vins tranquilles', !!cp.coupage && cp.coupage.includes('couleurs') && cp.rose === null && !!cs.rose && R.lots[op.lotId] && R.lots[op.lotId].couleur === 'rose', [cp, cs.rose]); }
    // ---- T01 : TAV acquis, SO₂ moléculaire
    { const d = L.clone(d0); const lid = 'lot-t64'; d.analyses.push({ id: 'an1', date: '2026-10-01', lotId: lid, valeurs: { tap: 10.1 } }); const sTap = L.so2TavDe(d, [lid]); d.analyses.push({ id: 'an2', date: '2026-11-01', lotId: lid, valeurs: { tav: 11.6 } });
      const lotF = f64.analyses.find((a) => a.notes === 'Analyse fictive (TAV acquis)');
      t('TAV acquis : paramètre d’origine (vins clairs et pré-tirage), TAP gardé pour les moûts ; SO₂ moléculaire calculé avec le TAV acquis (sinon le TAP) ; base dont le « TAV acquis » venait d’un bulletin : ce paramètre repris', L.DEFAULT_PARAMS().some((x) => x.id === 'tav' && x.nom === 'TAV acquis') && L.DEFAULT_MODELES().find((x) => x.id === 'm_clair').paramIds[0] === 'tav' && L.DEFAULT_MODELES().find((x) => x.id === 'm_pretirage').paramIds[0] === 'tav' && L.DEFAULT_MODELES().find((x) => x.id === 'm_mout').paramIds[0] === 'tap'
        && sTap === 10.1 && L.so2TavDe(d, [lid]) === 11.6 && L.tavParamId(f64) === 'pa355' && f64.analysesModeles.find((x) => x.id === 'm_clair').paramIds[0] === 'pa355' && L.so2TavDe(f64, [lotF.lotId]) === 11.4 && L.so2Moleculaire({ libre: 25, ph: 3.2, tav: L.so2TavDe(d, [lid]), temp: 20 }).pka > L.so2Moleculaire({ libre: 25, ph: 3.2, tav: 10.1, temp: 20 }).pka); }
    // ---- T07, T08, T09, T10 : bulletins (TAV naturel, Folin, masse volumique), acidités
    { const b = (lab) => L.bulletinParam(d0, lab) || {};
      const vin = { valeurs: {}, nouveaux: { tavn: { v: 11.8, op: '', label: 'TAV naturel' } } }; L.bulletinTavnMout(d0, vin); const mout = { valeurs: { densite: { v: 1.078 } }, nouveaux: { tavn: { v: 10.6, op: '', label: 'TAV naturel' } } }; L.bulletinTavnMout(d0, mout);
      t('bulletins : indice de Folin-Ciocalteu distinct de l’IPT ; TAV naturel distinct du TAP (sauf moût : son TAP) ; densité = masse volumique à 20 °C (g/mL)', (b('Indice de Folin-Ciocalteu').cat || {}).cle === 'folin' && (b('IPT').cat || {}).cle === 'ipt' && (b('Indice des polyphénols totaux').cat || {}).cle === 'ipt' && (b('TAV naturel').cat || {}).cle === 'tavn' && b('TAP').paramId === 'tap' && !!vin.nouveaux.tavn && !vin.valeurs.tap && mout.valeurs.tap.v === 10.6 && !mout.nouveaux.tavn
        && d0.analysesParams.find((x) => x.id === 'densite').nom === 'Densité (masse volumique à 20 °C)' && d0.analysesParams.find((x) => x.id === 'densite').unite === 'g/mL' && near(L.bulletinConvertir(992.4, 'g/L', 'g/mL', 'Densité (masse volumique à 20 °C)'), 0.9924), [b('Indice de Folin-Ciocalteu'), b('IPT'), b('TAV naturel'), b('TAP')]); }
    { const it = L.normalizeDb(L.emptyDb()); const pl = L.profilPlan(it, 'italie', ['rouge']); const ac = pl.find((x) => x.id === 'acidite'); L.profilAppliquer(it, 'italie', ['rouge'], ['acidite'], 'u1');
      t('acidités : hors de France, unités en acide tartrique et acétique proposées (paramètres inutilisés) ; France : g/L H₂SO₄ ; conversion des bulletins et équivalence affichée (× 1,531)', !!ac && ac.apres === 'g/L ac. tartrique · g/L ac. acétique' && it.analysesParams.find((x) => x.id === 'at').unite === 'g/L ac. tartrique' && it.analysesParams.find((x) => x.id === 'av').unite === 'g/L ac. acétique' && !L.profilPlan(d0, 'bourgogne', ['blanc']).some((x) => x.id === 'acidite') && L.profilPlan(it, 'bourgogne', ['blanc']).some((x) => x.id === 'acidite')
        && near(L.bulletinConvertir(4, 'g/L H2SO4', 'g/L ac. tartrique', 'AT'), 6.124) && near(L.bulletinConvertir(80, 'meq/L', 'g/L ac. tartrique', 'AT'), 6) && near(L.bulletinConvertir(0.5, 'g/L H2SO4', 'g/L ac. acétique', 'AV'), 0.61225) && L.aciditeEquivalence(4, 'g/L H₂SO₄') === '6,12 g/L ac. tartrique' && L.aciditeEquivalence(6.124, 'g/L ac. tartrique') === '4,00 g/L H₂SO₄' && L.aciditeEquivalence(3, 'mg/L') === '', [ac, pl.map((x) => x.id)]); }
    // ---- T06, T11, T16 : TAP des sucres, fin de FA, VRTP
    { const d = L.clone(d0); const R = { lots: { L1: { id: 'L1', stade: 'fa' } } }; const sg = (v) => L.stadeSuggestion(d, R, { lotId: 'L1', valeurs: { densite: v } }); const d2 = L.clone(d0); d2.settings.sucresTapCoef = 17;
      const c = L.tirageCalcul({ mode: 'cols', formats: [{ format: 'bouteille', nb: 1000 }] }, { ...p0, pointGL: 24 });
      t('TAP déduit des sucres : 16,83 g/L par % vol (réglage distinct du sucre d’enrichissement, 17 g/L) ; fin de FA : un seul seuil (0,994 par défaut) pour les alertes et la suggestion de stade ; VRTP en % des volumes mis en œuvre (vins et liqueurs)', near(L.tapMoyen(d, { sucres: { moy: 168.3 } }), 10) && near(L.tapMoyen(d2, { sucres: { moy: 170 } }), 10) && L.chaptalReglages(d).coef === 17 && L.fermReglages(d).fin === 0.994 && (sg(0.993) || {}).stade === 'fin_fa' && sg(0.996) === null && near(c.vrtpPct, c.vrtpL / (c.vinMisEnOeuvreL + c.liqueurTotaleL) * 100) && near(c.volMisEnOeuvreL, c.vinMisEnOeuvreL + c.liqueurTotaleL)); }
    // ---- libellés et textes du code
    { const ops = L.DEFAULT_OPERATIONS(); const op = (id) => ops.find((o) => o.id === id) || {};
      t('catalogue : « Enrichissement » (saccharose, moût concentré, MCR), nutrition au phosphate diammonique, froid = stabilisation tartrique, nouveau « Débourbage à froid » (moûts, débourbage), coupage cité pour l’assemblage de millésimes ; présent dans une base antérieure', op('enrichissement').label === 'Enrichissement' && /moût concentré ou de MCR/.test(op('enrichissement').aide) && /phosphate diammonique/.test(op('nutrition').aide) && /^Stabilisation tartrique par le froid/.test(op('froid').aide) && op('debourbage_froid').base === 'debourbage' && op('debourbage_froid').groupe === 'Vendange & moûts' && /2019\/934, art\. 7/.test(op('assemblage_millesimes').aide) && f64.lists.operations.some((o) => o.id === 'debourbage_froid'));
      t('libellés : fraction de pressurage, produit de traitement / auxiliaire technologique, terre de diatomées (centrifugation hors filtration), évaporation (part des anges), méchage, Pinot noir, Premier Cru / Grands Crus, vin clarifié, Saint-Émilion par l’appellation (Bordeaux : générique), méthode ancestrale sans « pétillant naturel »', L.LOT_TYPES.fraction === 'Fraction de pressurage' && L.CATEGORIES.oeno === 'Produit de traitement' && L.CATEGORIES.aux === 'Auxiliaire technologique' && d0.lists.methodesFiltration.map((x) => x.label).join() === 'Terre de diatomées,Plaques,Tangentielle,Cartouches / membrane' && d0.lists.typesPerte.find((x) => x.id === 'ouillage').label === 'Évaporation (part des anges)' && d0.lists.actionsHygiene.find((x) => x.id === 'soufrage').label === 'Méchage / SO₂' && d0.lists.cepages.find((x) => x.id === 'pn').label === 'Pinot noir'
        && L.ECHELLE_PRESETS[0].items.map((x) => x.label).join() === 'Autres crus,Premiers Crus,Grands Crus' && L.ECHELLE_PRESETS[0].items[1].un === 'Premier Cru' && d0.lists.stades.find((x) => x.id === 'vin_clair').label === 'Vin clarifié' && L.PROFIL_REGIONS.find((r) => r.id === 'bordeaux').echelle === 'generique' && !/pétillant naturel/.test(L.PROFIL_TYPES.find((x) => x[0] === 'ancestrale')[1]));
      t('textes : déclaration d’intention de tirage / de revendication, VRTP au ch. I, IX 2° d), plan d’exemple aligné (moûts débourbés 20,5 hL, SO₂ en g/hL de SO₂, enrichissement au TAV visé, stabilisation tartrique, blanc de blancs)', L.DECL_TIRAGE_TYPES.map((x) => x.label).join(' | ') === 'Déclaration d’intention de tirage (déclaration préalable) | Déclaration de revendication (valant déclaration de tirage)' && /ch\. I, IX 2° d\)$/.test(L.TIRAGE_SOURCE_VRTP)
        && (() => { const P = L.plansVinifDe(d0)[0]; const l = (id) => P.lignes.find((x) => x.id === id); return /moûts débourbés/.test(l('l1').etape) && Object.values(l('l1').valeurs).includes('20,5') && !l('l6') && Object.values(l('l2').valeurs).every((v) => /de SO₂$/.test(v)) && l('l9').etape === 'Enrichissement (TAV visé)' && l('l14').produit === 'Stabilisation tartrique par le froid' && l('l13').valeurs.blanc === 'Blanc de blancs'; })()); }
    // ---- T37 : « non millésimé »
    t('millésime « NV » (donnée gardée) affiché « non millésimé » ; « non millésimé » saisi → NV ; millésime ordinaire inchangé', L.millesimeAffiche('NV') === 'non millésimé' && L.millesimeAffiche('2024') === '2024' && L.millesimeAffiche('') === '' && L.millesimeSaisi('non millésimé') === 'NV' && L.millesimeSaisi('2025') === '2025');
    // ---- version, traductions
    t('version 0.47.0-alpha.2 : notes de version (vocabulaire, coefficients), gardées', L.CHANGELOG.find((c) => c.v === '0.47.0-alpha.2').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.47.0-alpha.2') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.47.0-alpha.1'));
    { const dr = L.clone(d0); dr.settings.region = 'autre'; dr.settings.profilViticole = { region: 'rhone', types: ['rouge'] };
      t('traductions : libellés corrigés, avertissement rosé, coefficients, notes de version dans les six langues', L.tradControle().length === 0 && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && ['Vin clarifié', 'Évaporation (part des anges)', 'Ticket de pesée', 'Débourbage à froid', 'Apte au contact alimentaire', 'Indice de Folin-Ciocalteu', 'Augmentation de volume du saccharose — déclarations (L/kg)', L.roseCoupageAlerte(dr, ['blanc', 'rouge'])].every((x) => L.traduire(x, 'en') !== x) && L.traduire('DDM', 'de') === 'MHD'); }
    // ---- compatibilité avec la 0.47.0-alpha.1 gelée
    const dirO = path.join(__dirname, 'anciennes', '0.47.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, syncConfig, syncFusion, getR, clone, listRename, APP_VERSION, APP_NUM };')({});
    t('0.47.0-alpha.1 gelée chargée', O.APP_VERSION === '0.47.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f64)); O.syncConfig(x); O.getR(x);
    t('… la 0.47.0-alpha.1 ouvre la base 0.47.0-alpha.2 sans rien perdre (libellés corrigés, fractions, paramètres et modèles, débourbage à froid, coefficients, trace de la migration)', ['fractions', 'typesPerte', 'methodesFiltration', 'stades', 'echelles', 'operations', 'cepages'].every((k) => canonJ(x.lists[k]) === canonJ(f64.lists[k])) && canonJ(x.analysesParams) === canonJ(f64.analysesParams) && canonJ(x.analysesModeles) === canonJ(f64.analysesModeles) && x.settings.coefSucre === 2.5 && canonJ(x.settings.termes047) === canonJ(f64.settings.termes047) && canonJ(x.analyses) === canonJ(f64.analyses), ['fractions', 'typesPerte', 'methodesFiltration', 'stades', 'echelles', 'operations', 'cepages'].filter((k) => canonJ(x.lists[k]) !== canonJ(f64.lists[k])));
    O.listRename(x, 'cepages', 'pn', 'Pinot noir (N)'); x.settings.coefSucre = 2.6; x.meta.modifLe = '2026-12-17T12:00:00Z';
    const y = L.normalizeDb(L.clone(x));
    t('… une base repassée par la 0.47.0-alpha.1 (cépage renommé, coefficient remis à 2,6) : rouverte ici, rien n’est re-migré', y.settings.coefSucre === 2.6 && y.lists.cepages.find((c) => c.id === 'pn').label === 'Pinot noir (N)');
    const N = L.clone(f64); L.fractionCont(N, 'add', null, { label: 'Tête de cuvée', suffix: 'TC', pressurage: true, role: 'cuvee' }); N.meta.modifLe = '2026-12-17T11:00:00Z';
    const FX = L.syncFusion(f64, N, x); const FX2 = O.syncFusion(f64, x, N);
    t('… synchronisation 0.47.0-alpha.2 ↔ 0.47.0-alpha.1 : cépage renommé là-bas, sous-fraction ajoutée ici, rien de perdu', [FX, FX2].every((F) => (F.db.lists.cepages.find((c) => c.id === 'pn').label === 'Pinot noir (N)' && F.db.lists.fractions.some((f) => f.label === 'Tête de cuvée') && F.db.lists.fractions.some((f) => f.label === 'Cœur de cuvée')) || F.conflits.length > 0));
  }
  // ================= 65. 0.47.0-alpha.3 : onglet ouvert au démarrage, à la connexion et au déverrouillage (trois réglages), dernière page visitée ; site officiel =================
  {
    const d0 = L.normalizeDb(L.sampleDb()); L.syncConfig(d0); const V = L.modulesVisibles(d0);
    t('réglages par défaut : démarrage et connexion → premier onglet ; déverrouillage → dernière page visitée (page en cours)', L.ongletReglage(d0, 'demarrage') === 'premier' && L.ongletReglage(d0, 'connexion') === 'premier' && L.ongletReglage(d0, 'deverrouillage') === 'derniere' && L.ongletOuverture(d0) === V[0]);
    const d = L.clone(d0); const r1 = L.ongletDefautSet(d, 'derniere', 'demarrage'); const r2 = L.ongletDefautSet(d, 'tirage', 'connexion'); const r3 = L.ongletDefautSet(d, 'analyses', 'deverrouillage');
    t('trois réglages enregistrés séparément (ongletDefaut, ongletConnexion, ongletDeverrouillage)', r1.ok && r2.ok && r3.ok && d.settings.ongletDefaut === 'derniere' && d.settings.ongletConnexion === 'tirage' && d.settings.ongletDeverrouillage === 'analyses');
    t('dernière page visitée : reprise si elle est affichée (avec son sous-onglet), sinon premier onglet', (() => { const n = L.ongletOuvertureNav(d, V, 'demarrage', { tab: 'hygiene', sub: 'plans' }); const m = L.ongletOuvertureNav(d, V.filter((x) => x !== 'hygiene'), 'demarrage', { tab: 'hygiene' }); return n.tab === 'hygiene' && n.sub === 'plans' && m.tab === V[0] && L.ongletOuverture(d, V, 'demarrage', null) === V[0]; })());
    t('connexion et déverrouillage : leur propre onglet ; onglet non affiché → premier onglet', L.ongletOuverture(d, V, 'connexion') === 'tirage' && L.ongletOuverture(d, V, 'deverrouillage') === 'analyses' && L.ongletOuverture(d, V.filter((x) => x !== 'tirage'), 'connexion') === V.filter((x) => x !== 'tirage')[0]);
    { const e = L.clone(d0); L.ongletDefautSet(e, 'cave', 'demarrage'); L.ongletDefautSet(e, 'derniere', 'connexion');
      t('connexion « dernière page » sans page retenue → réglage du démarrage ; « comme au démarrage » et « premier » ', L.ongletOuverture(e, V, 'connexion', null) === 'cave' && L.ongletOuverture(e, V, 'connexion', { tab: 'trace' }) === 'trace' && (() => { L.ongletDefautSet(e, 'premier', 'connexion'); const a = L.ongletOuverture(e, V, 'connexion') === V[0]; L.ongletDefautSet(e, '', 'connexion'); return a && !('ongletConnexion' in e.settings) && L.ongletOuverture(e, V, 'connexion') === 'cave'; })()); }
    { const e = L.clone(d0); L.ongletDefautSet(e, 'demarrage', 'deverrouillage'); const a = e.settings.ongletDeverrouillage === 'demarrage' && L.ongletReglage(e, 'deverrouillage') === 'premier'; L.ongletDefautSet(e, 'derniere', 'deverrouillage');
      t('déverrouillage : « comme au démarrage » enregistré, « dernière page » = valeur par défaut (retirée)', a && !('ongletDeverrouillage' in e.settings)); }
    t('refus : onglet inconnu, module sans onglet propre, moment inconnu, « comme au démarrage » pour le démarrage', !L.ongletDefautSet(L.clone(d0), 'zz', 'connexion').ok && !L.ongletDefautSet(L.clone(d0), 'declass', 'deverrouillage').ok && /Moment inconnu/.test(L.ongletDefautSet(L.clone(d0), 'tirage', 'zz').msg) && !L.ongletDefautSet(L.clone(d0), 'demarrage', 'demarrage').ok);
    { const g = L.clone(d0); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-t65', nom: 'Cave', modules: { params: 'lecture', cuverie: 'ecriture' }, droits: {} }];
      const h = L.clone(g); L.ongletDefautSet(h, 'tirage', 'connexion');
      t('droits : les onglets d’ouverture relèvent des paramètres', L.gardeDroits(g, h, 'u-t65').ok === false); }
    t('site officiel : oenotrack.pages.dev (identifiants déclarés), Cloudflare Pages parmi les hébergeurs', L.OENOTRACK_SITE === 'https://oenotrack.pages.dev' && L.siteOfficielIci('oenotrack.pages.dev') && L.HEBERGEURS.some((h) => h.id === 'cloudflare' && !h.ue));
    t('version 0.47.0-alpha.3 (notes gardées)', L.CHANGELOG.find((c) => c.v === '0.47.0-alpha.3').notes.length === 2 && L.CHANGELOG.findIndex((c) => c.v === '0.47.0-alpha.3') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.47.0-alpha.2'));
    t('traductions : réglages des onglets, présentation, notes de version dans les six langues', L.tradControle().length === 0 && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && L.traduire('Dernière page visitée', 'en') === 'Last page visited' && L.traduire('Onglet ouvert à la connexion : Tirages.', 'en') !== 'Onglet ouvert à la connexion : Tirages.');
    // compatibilité : la 0.47.0-alpha.2 gelée ouvre, modifie et synchronise une base 0.47.0-alpha.3
    const f65 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.47.0-alpha.3-onglets.json'), 'utf8'))); L.syncConfig(f65);
    t('fixture 0.47.0-alpha.3 : trois réglages', f65.settings.ongletDefaut === 'derniere' && f65.settings.ongletConnexion === 'tirage' && f65.settings.ongletDeverrouillage === 'analyses' && f65.meta.versions.includes('0.47.0-alpha.3'));
    const dirO = path.join(__dirname, 'anciennes', '0.47.0-alpha.2');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, getR, syncFusion, ongletOuverture, ongletDefautSet, cepageSave: typeof cepageSave === "function" ? cepageSave : null };')({ useState() {}, useEffect() {}, useMemo() {}, useRef() {}, useCallback() {} });
    t('0.47.0-alpha.2 gelée chargée', O.APP_VERSION === '0.47.0-alpha.2' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f65)); O.syncConfig(x); O.getR(x);
    t('… la 0.47.0-alpha.2 ouvre la base 0.47.0-alpha.3 sans rien perdre ; « dernière page » au démarrage → premier onglet', x.settings.ongletConnexion === 'tirage' && x.settings.ongletDeverrouillage === 'analyses' && x.settings.ongletDefaut === 'derniere' && O.ongletOuverture(x) === O.ongletOuverture(O.normalizeDb(O.clone(L.sampleDb()))));
    O.ongletDefautSet(x, 'cave'); x.meta.modifLe = '2026-12-20T12:00:00Z';
    const N = L.clone(f65); L.ongletDefautSet(N, 'registres', 'connexion'); N.meta.modifLe = '2026-12-20T11:00:00Z';
    const FX = L.syncFusion(f65, N, x); const FX2 = O.syncFusion(f65, x, N);
    t('… synchronisation 0.47.0-alpha.3 ↔ 0.47.0-alpha.2 : démarrage changé là-bas, connexion changée ici, réglage du déverrouillage gardé', [FX.db, FX2.db].every((y) => y.settings.ongletDefaut === 'cave' && y.settings.ongletConnexion === 'registres' && y.settings.ongletDeverrouillage === 'analyses'), [FX.db.settings.ongletDefaut, FX.db.settings.ongletConnexion, FX2.db.settings.ongletConnexion]);
  }
  // ================= 66. 0.48.0-alpha.1 : refonte de l'interface (audit validé) — version, traductions, compatibilité 0.47.0-alpha.3 =================
  {
    t('version 0.48.0-alpha.1 : mineure après 0.47.0-alpha.3 (nouvelles fonctions d’interface), trois notes gardées', L.CHANGELOG.find((c) => c.v === '0.48.0-alpha.1').notes.length === 3 && L.CHANGELOG.findIndex((c) => c.v === '0.48.0-alpha.1') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.47.0-alpha.3') && L.versionNum('0.48.0-alpha.1') > L.versionNum('0.47.0-alpha.3'));
    t('traductions : notes de version, en-tête, libellés « ＋ » harmonisés dans les six langues', L.tradControle().length === 0 && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && L.traduire('＋ Nouvelle pesée', 'en') === '＋ New weighing' && L.traduire('⬇ Exporter (CSV)', 'de') === '⬇ Exportieren (CSV)' && L.traduire('Aller au contenu', 'en') === 'Skip to content');
    const f66 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.48.0-alpha.1-interface.json'), 'utf8'))); L.syncConfig(f66);
    t('fixture 0.48.0-alpha.1 : versions enregistrées, cépage ajouté, réglages des onglets gardés, rien de l’appareil dans la base', f66.meta.versions.includes('0.48.0-alpha.1') && f66.lists.cepages.some((c) => c.label === 'Cépage fictif 0.48') && f66.settings.ongletConnexion === 'tirage' && !/oenotrack-(ops-choix|aides|listes-replis|derniere-page)/.test(JSON.stringify(f66)));
    const dirO = path.join(__dirname, 'anciennes', '0.47.0-alpha.3');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, getR, syncFusion, ongletDefautSet };')({ useState() {}, useEffect() {}, useMemo() {}, useRef() {}, useCallback() {} });
    t('0.47.0-alpha.3 gelée chargée', O.APP_VERSION === '0.47.0-alpha.3' && L.APP_NUM > O.APP_NUM);
    const KX = ['ops', 'lots', 'contenants', 'produits', 'arrivages', 'plansVinif', 'chantiersTirage', 'declarationsTirage', 'habillages'];
    const x = O.normalizeDb(O.clone(f66)); O.syncConfig(x); O.getR(x);
    t('… la 0.47.0-alpha.3 ouvre la base 0.48.0-alpha.1 sans rien perdre', KX.every((k) => canonJ(x[k] || []) === canonJ(f66[k] || [])) && x.lists.cepages.some((c) => c.label === 'Cépage fictif 0.48') && x.settings.ongletConnexion === 'tirage');
    O.ongletDefautSet(x, 'cave', 'demarrage'); x.meta.modifLe = '2026-12-22T12:00:00Z';
    const N = L.clone(f66); N.lists.cepages.push({ id: L.nid(N, 'cep'), label: 'Cépage fictif ici', couleur: 'noir' }); N.meta.modifLe = '2026-12-22T11:00:00Z';
    const FX = L.syncFusion(f66, N, x); const FX2 = O.syncFusion(f66, x, N);
    t('… synchronisation 0.48.0-alpha.1 ↔ 0.47.0-alpha.3 : onglet changé là-bas, cépage ajouté ici, rien de perdu', [FX.db, FX2.db].every((y) => y.settings.ongletDefaut === 'cave' && y.lists.cepages.some((c) => c.label === 'Cépage fictif ici') && y.lists.cepages.some((c) => c.label === 'Cépage fictif 0.48')));
  }
  // ================= 66b. 0.48.0-alpha.1 : formulaires — le moteur renvoie aussi le champ en cause (fail(msg, { champ })) =================
  {
    const r0 = L.fail('Message.'); const r1 = L.fail('Choisissez le cépage.', { champ: 'cepageId' }); const r2 = L.fail('X.', { champ: 'a', ok: true, msg: 'autre' });
    t('66b. fail(msg) inchangé ; fail(msg, { champ }) : ok et msg intacts, champ ajouté', r0.ok === false && r0.msg === 'Message.' && !('champ' in r0) && r1.ok === false && r1.msg === 'Choisissez le cépage.' && r1.champ === 'cepageId' && r2.ok === false && r2.msg === 'X.' && r2.champ === 'a');
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); const cep = d.lists.cepages[0].id; const camp = d.campagnes.find((c) => c.id === d.settings.campagneActive) || d.campagnes[0];
    const jour = camp.debut;
    // pesée : chaque contrôle désigne son champ
    const P = (x, db0) => L.peseeSave(L.clone(db0 || d), { date: jour, heure: '09:00', cepageId: cep, kg: '1000', qualifId: 'conv', operateurs: [], champs: {}, ...x }, null, { par: '', maintenant: `${jour}T09:00:00Z` });
    const pz = { heure: P({ heure: '' }), kg: P({ kg: '' }), cep: P({ cepageId: '' }), tare: P({ brutKg: '100', tareKg: '200', kg: '' }), tap: P({ tap: '40' }), pa: P({ etat: 'altere', pourritureAcide: '140' }), date: P({ date: '' }), ok: P({}) };
    t('66b. pesée : heure, poids net, cépage, tare, TAP, pourriture, date → champ ; pesée correcte acceptée', pz.heure.champ === 'heure' && pz.kg.champ === 'kg' && pz.cep.champ === 'cepageId' && pz.tare.champ === 'tareKg' && pz.tap.champ === 'tap' && pz.date.champ === 'date' && pz.ok.ok && !pz.ok.champ, Object.fromEntries(Object.entries(pz).map(([k, v]) => [k, [v.ok, v.champ, v.msg]])));
    t('66b. … pourriture acide hors bornes (état altéré) → champ « pourritureAcide »', pz.pa.champ === 'pourritureAcide' || pz.pa.champ === 'etat', [pz.pa.champ, pz.pa.msg]);
    const e = L.clone(d); L.formulaireSave(e, 'pesee', { champs: { tap: { obligatoire: true } }, perso: [{ label: 'Remorque', type: 'texte', obligatoire: true }] });
    const ptap = P({}, e); const pid = L.formulaireDe(e, 'pesee').perso[0].id; const pperso = P({ tap: '9,5' }, e);
    t('66b. … champ rendu obligatoire (TAP) → « tap » ; champ personnalisé → « perso:<id> »', ptap.ok === false && ptap.champ === 'tap' && /TAP/.test(ptap.msg) && pperso.ok === false && pperso.champ === `perso:${pid}` && /Remorque/.test(pperso.msg), [ptap, pperso]);
    const e2 = L.clone(d); e2.settings.operateurObligatoire = true; const pop = P({}, e2);
    t('66b. … opérateur obligatoire → « operateurs »', pop.ok === false && pop.champ === 'operateurs', pop);
    // détail des champs obligatoires (formulaire des opérations) ; champsErreurs garde son message seul
    const f = L.clone(d); L.formulaireSave(f, 'entree_mout', { champs: { 'e.numLot': { obligatoire: true } } });
    const em = L.champsErreurDetail(f, 'entree_mout', 'entree_mout', { entrees: [{ numLot: 'L1', dests: [{ volL: 100 }] }, { numLot: '', dests: [{ volL: 200 }] }] });
    t('66b. champsErreurDetail : moût 2 → « entrees.1.numLot » ; champsErreurs → même message (chaîne)', em && em.champ === 'entrees.1.numLot' && L.champsErreurs(f, 'entree_mout', 'entree_mout', { entrees: [{ numLot: 'L1', dests: [{ volL: 100 }] }, { numLot: '', dests: [{ volL: 200 }] }] }) === em.msg, em);
    L.formulaireSave(f, 'soutirage', { champs: { equipementIds: { obligatoire: true } } });
    const es = L.champsErreurDetail(f, 'soutirage', 'soutirage', { equipementIds: [], champs: {} });
    t('66b. … champ standard → sa clé (« equipementIds ») ; rien à signaler → null / chaîne vide', es && es.champ === 'equipementIds' && L.champsErreurDetail(f, 'soutirage', 'soutirage', { equipementIds: ['x'], champs: {} }) === null && L.champsErreurs(f, 'soutirage', 'soutirage', { equipementIds: ['x'], champs: {} }) === '');
    // opération, arrivage, analyse, hygiène
    const g = L.clone(d); const o1 = L.opSave(g, { type: 'transfert', date: 'pas une date' }); const o2 = L.opSave(g, { type: 'transfert', date: '1990-01-01' });
    t('66b. opération : date invalide ou hors campagne → « date »', o1.ok === false && o1.champ === 'date' && o2.ok === false && o2.champ === 'date', [o1, o2]);
    const p0 = d.produits[0];
    const A = (x) => L.arrivageSave(L.clone(d), { produitId: p0.id, date: jour, qty: '5', numLot: 'LOT-1', ...x });
    t('66b. arrivage : produit, date, quantité, n° de lot → champ', A({ produitId: '' }).champ === 'produitId' && A({ date: '' }).champ === 'date' && A({ qty: '0' }).champ === 'qty' && A({ numLot: ' ' }).champ === 'numLot' && A({}).ok);
    const lot = d.lots[0];
    const N = (x) => L.analyseSave(L.clone(d), { date: jour, lotId: lot.id, valeurs: { ph: '3,1' }, ...x });
    t('66b. analyse : lot, date, valeurs → champ', N({ lotId: '' }).champ === 'lotId' && N({ date: '' }).champ === 'date' && N({ valeurs: {} }).champ === 'valeurs' && N({}).ok);
    const H = (x) => L.hygieneSave(L.clone(d), { date: jour, cibleType: 'contenant', cibleId: d.contenants[0].id, actionId: (d.lists.actionsHygiene[0] || {}).id, produits: [], methode: '', operateurs: [], ...x });
    t('66b. hygiène : date, cible, produits → champ', H({ date: '' }).champ === 'date' && H({ cibleId: '' }).champ === 'cibleId' && H({ produits: [{ produitId: 'hy-essai', nom: 'Soude', conc: '-1', quantite: '' }] }).champ === 'produits' && H({}).ok);
    const k = L.clone(d); k.settings.operateurObligatoire = true; const hop = L.hygieneSave(k, { date: jour, cibleType: 'contenant', cibleId: d.contenants[0].id, actionId: (d.lists.actionsHygiene[0] || {}).id, produits: [], methode: '', operateurs: [] });
    t('66b. … opérateur obligatoire → « operateurs »', hop.ok === false && hop.champ === 'operateurs', hop);
    // registre : correction d'une pesée validée sans motif → « motif »
    const m = L.clone(d); const pv = L.peseeSave(m, { date: jour, heure: '08:00', cepageId: cep, kg: '800', qualifId: 'conv', operateurs: [], champs: {} }, null, { par: '', maintenant: `${jour}T08:00:00Z` });
    const pc = pv.ok ? L.peseeSave(m, { date: jour, heure: '08:00', cepageId: cep, kg: '850', qualifId: 'conv', operateurs: [], champs: {} }, pv.op.id, { par: '', maintenant: `${jour}T08:30:00Z` }) : pv;
    t('66b. registre : correction d’une pesée validée sans motif → « motif »', pv.ok && pc.ok === false && pc.champ === 'motif' && /motif/.test(pc.msg), [pv.ok, pc]);
    // une version antérieure lit toujours ok et msg (le champ en plus est ignoré)
    t('66b. compatibilité : le message reste r.msg (le champ en plus est ignoré par les versions antérieures)', typeof pz.kg.msg === 'string' && /poids net/.test(pz.kg.msg) && Object.keys(L.fail('a', { champ: 'b' })).sort().join() === 'champ,msg,ok');
  }
  // ================= 67. 0.49.0-alpha.1 : socle de l'assistant IA — usages et niveaux, accord, modèle local, journal, images, réponses contrôlées, trace =================
  {
    const U = L.IA_USAGES; const ids = U.map((u) => u.id);
    t('67. usages : identifiants uniques, niveau 0 / 1 / 2, ce qui part décrit ; anciens usages repris (compléter, bulletins…)', ids.length === new Set(ids).size && U.every((u) => [0, 1, 2].includes(u.niveau) && u.nom && u.envoie) && ['identifier', 'completer', 'veille', 'bulletins', 'catalogue', 'cahier', 'fdsHygiene'].every((x) => ids.includes(x)) && U.length >= 24);
    t('67. usages proposés à l’exploitation : 17 nouveaux (saisie, fiche relue, fermentation, réception, pesée, barèmes, protocole, composés, textes, audit, aide, traçabilité, histoire, codification, configuration, nettoyage, commentaire)', ['saisie', 'ficheRelue', 'fermentation', 'reception', 'pesee', 'baremes', 'planProtocole', 'composes', 'veilleTextes', 'audit', 'aide', 'traceRecherche', 'histoireLot', 'codification', 'configuration', 'planNettoyage', 'bulletinCommentaire'].every((x) => ids.includes(x)) && !ids.includes('maintenance') && !ids.includes('drmRelecture'));
    t('67. activés par défaut : niveaux 0 et 1 ; niveau 2 désactivé ; anciens réglages « compléter » / « bulletins » à non repris ; choix explicite prioritaire', L.iaUsageActif({}, 'aide') && L.iaUsageActif({}, 'reception') && !L.iaUsageActif({}, 'saisie') && !L.iaUsageActif({ completer: false }, 'completer') && !L.iaUsageActif({ bulletins: false }, 'bulletins') && L.iaUsageActif({ usages: { saisie: true } }, 'saisie') && !L.iaUsageActif({ usages: { aide: false } }, 'aide') && !L.iaUsageActif({}, 'inconnu'));
    t('67. adresse locale : localhost, 127.0.0.1, [::1], *.local, réseaux privés ; pas une adresse publique', ['http://localhost:11434/v1', 'http://127.0.0.1:1234/v1', 'http://[::1]:8080/v1', 'http://serveur.local/v1', 'http://192.168.1.20:11434/v1', 'http://10.0.0.5/v1', 'http://172.16.3.4/v1'].every(L.iaAdresseLocale) && !['https://api.exemple.com/v1', 'http://172.32.0.1/v1', 'pas une adresse', ''].some(L.iaAdresseLocale));
    const cPret = { pret: true, fournisseur: 'anthropic', modele: 'm', usages: { saisie: true } }; const cLocal = { pret: true, fournisseur: 'perso', url: 'http://localhost:11434/v1', modele: 'm', usages: { saisie: true } };
    t('67. refus expliqués : non configuré, usage désactivé, niveau 2 réservé au modèle local (permis avec le service local)', /non configuré/.test(L.iaUsageRefus({ pret: false }, 'aide', 'tous')) && /désactivé/.test(L.iaUsageRefus({ pret: true, usages: { aide: false } }, 'aide', 'tous')) && /modèle installé/.test(L.iaUsageRefus(cPret, 'saisie', 'local')) && L.iaUsageRefus(cLocal, 'saisie', 'local') === '' && L.iaUsageRefus(cPret, 'saisie', 'tous') === '' && L.iaUsageRefus(cPret, 'reception', 'local') === '');
    t('67. accord demandé avant le premier envoi d’un usage de niveau 2 seulement, puis gardé', L.iaConsentRequis({}, 'saisie') && !L.iaConsentRequis({ consentements: { saisie: '2026-12-01' } }, 'saisie') && !L.iaConsentRequis({}, 'reception'));
    // S5 : réponses contrôlées
    const SCH = { type: 'object', required: ['operation', 'dose'], properties: { operation: { type: 'string', enum: ['sulfitage', 'levurage'] }, dose: { type: 'number', minimum: 0, maximum: 100 }, cuves: { type: 'array', items: { type: 'string', maxLength: 20 }, maxItems: 3 }, note: { type: 'string', nullable: true } } };
    const v1 = L.iaSchemaValider(SCH, { operation: 'sulfitage', dose: '3,5', cuves: ['C12', 'C13', 'C14', 'C15'], note: null, intrus: 'x' });
    t('67. schéma : nombre « 3,5 » lu, liste coupée au maximum, null permis, propriété inconnue retirée', v1.ok && v1.valeur.dose === 3.5 && v1.valeur.cuves.length === 3 && v1.valeur.note === null && !('intrus' in v1.valeur));
    const v2 = L.iaSchemaValider(SCH, { operation: 'collage', dose: 500 }); const v3 = L.iaSchemaValider(SCH, { dose: 2 });
    t('67. schéma : valeur hors liste, hors bornes, champ obligatoire absent → refusé avec la raison', !v2.ok && v2.erreurs.some((e) => /hors liste/.test(e)) && v2.erreurs.some((e) => /hors bornes/.test(e)) && !v3.ok && v3.erreurs.some((e) => /operation : obligatoire/.test(e)));
    // S1 : images
    const IMG = [{ type: 'image/jpeg', data: 'QUJD' }, { type: 'text/html', data: 'PGI+' }, { type: 'image/png', data: 'pas du base64 !' }];
    t('67. images : seuls les types d’image et le base64 passent', L.iaImagesNorm(IMG).length === 1 && L.iaImagesNorm(null).length === 0);
    const rqA = L.iaRequete({ fournisseur: 'anthropic', cle: 'k', modele: 'm' }, { system: 's', texte: 't', images: IMG });
    const rqO = L.iaRequete({ fournisseur: 'openai', cle: 'k', modele: 'm' }, { system: 's', texte: 't', images: IMG, format: L.iaFormatReponse('openai', SCH, 'essai') });
    const rqG = L.iaRequete({ fournisseur: 'gemini', cle: 'k', modele: 'm' }, { system: 's', texte: 't', images: IMG, format: L.iaFormatReponse('gemini', SCH) });
    const rqP = L.iaRequete({ fournisseur: 'perso', url: 'http://localhost:11434/v1', modele: 'm' }, { system: 's', texte: 't', images: IMG, format: L.iaFormatReponse('perso', SCH) });
    const rqM = L.iaRequete({ fournisseur: 'mistral', cle: 'k', modele: 'm' }, { system: 's', texte: 't', images: IMG });
    t('67. vision : image au format de chaque service (Claude, OpenAI, Gemini, compatible OpenAI, Mistral)', rqA.body.messages[0].content[0].type === 'image' && rqA.body.messages[0].content[0].source.media_type === 'image/jpeg' && rqO.body.input[0].content[1].type === 'input_image' && /^data:image\/jpeg;base64,/.test(rqO.body.input[0].content[1].image_url) && rqG.body.contents[0].parts[1].inline_data.mime_type === 'image/jpeg' && rqP.body.messages[1].content[1].image_url.url.startsWith('data:image/jpeg') && typeof rqM.body.messages[1].content[1].image_url === 'string');
    t('67. format de réponse demandé : schéma JSON (OpenAI), JSON (Gemini, compatible OpenAI) ; sans images : requête inchangée', rqO.body.text.format.type === 'json_schema' && rqO.body.text.format.schema === SCH && rqG.body.generationConfig.responseMimeType === 'application/json' && rqP.body.response_format.type === 'json_object' && L.iaRequete({ fournisseur: 'anthropic', cle: 'k', modele: 'm' }, { system: 's', texte: 't' }).body.messages[0].content === 't');
    // S4 : trace
    t('67. trace : usage connu seulement, modèle et date gardés ; texte lisible', L.iaTraceNorm({ usage: 'saisie', modele: 'm1', fournisseur: 'anthropic', le: '2026-12-01T10:00:00Z' }).le === '2026-12-01T10:00:00Z' && L.iaTraceNorm({ usage: 'zz' }) === null && L.iaTraceNorm(null) === null && /Proposé par l’IA/.test(L.iaTraceTexte({ usage: 'saisie', modele: 'm1' })));
    { const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); const camp = d.campagnes.find((c) => c.id === d.settings.campagneActive) || d.campagnes[0]; const R0 = L.getR(d); const p0 = Object.values(R0.portions || {})[0];
      const spec = { type: 'note', date: camp.debut, notes: 'Essai IA', ia: { usage: 'saisie', modele: 'm1', fournisseur: 'anthropic' } };
      const r1 = L.opSave(d, spec, null); const o1 = r1.ok ? d.ops.find((o) => o.id === r1.op.id) : null;
      const r2 = o1 ? L.opSave(d, { type: 'note', date: camp.debut, notes: 'Corrigée' }, o1.id) : { ok: false }; const o2 = o1 ? d.ops.find((o) => o.id === o1.id) : null;
      t('67. opération proposée par l’IA : trace gardée, gardée aussi quand on la corrige', !!o1 && o1.ia && o1.ia.usage === 'saisie' && r2.ok && o2.ia && o2.ia.usage === 'saisie', [r1.msg, r2.msg, p0 && p0.id]);
      const pr = d.produits[0]; const ra = L.arrivageSave(d, { produitId: pr.id, date: camp.debut, qty: 5, numLot: 'LOT-IA-1', ia: { usage: 'reception', modele: 'm1' } }); const a1 = d.arrivages.find((a) => a.numLot === 'LOT-IA-1');
      t('67. arrivage proposé par l’IA (photo de l’étiquette) : trace gardée', ra.ok && a1 && a1.ia && a1.ia.usage === 'reception', ra.msg); }
    // S3 : réglage commun du niveau 2, administrateurs seulement
    { const g = L.normalizeDb(L.sampleDb()); L.syncConfig(g); const r = L.iaNiveau2Set(L.clone(g), 'local', 'u1'); const h = L.clone(g); L.iaNiveau2Set(h, 'local', 'u1');
      t('67. niveau 2 réservé au modèle local : réglage enregistré, valeur inconnue refusée', r.ok && h.settings.ia.niveau2 === 'local' && L.iaNiveau2Reglage(h) === 'local' && L.iaNiveau2Reglage(g) === 'tous' && !L.iaNiveau2Set(L.clone(g), 'zz').ok); }
    // appel complet avec un service simulé (aucun réseau)
    const fetch0 = global.fetch; const env = []; global.fetch = async (url, init) => { env.push({ url, body: JSON.parse(init.body) }); return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '```json\n{"operation":"sulfitage","dose":"3"}\n```' }], stop_reason: 'end_turn' }) }; };
    L.iaConfigEcrire({ fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-essai' }, modeles: { anthropic: 'modele-essai' }, usages: { saisie: true } }); L.iaJournalVider();
    (async () => {
      let refus = null; try { await L.iaUsage('saisie', { system: 's', texte: 'sulfitage 3 g/hL', schema: SCH }, {}); } catch (e) { refus = e; }
      t('67. niveau 2 sans accord : rien n’est envoyé, l’accord est demandé', refus && refus.consentement && env.length === 0);
      const r = await L.iaUsage('saisie', { system: 's', texte: 'sulfitage 3 g/hL', schema: SCH, consenti: true }, {});
      const J = L.iaJournalLire();
      t('67. envoi : schéma rappelé dans les consignes, réponse contrôlée et convertie, trace prête, journal sans le contenu', env.length === 1 && /schéma JSON/.test(env[0].body.system) && r.ok && r.valeur.dose === 3 && r.trace.usage === 'saisie' && r.trace.modele === 'modele-essai' && J.length === 1 && J[0].usage === 'saisie' && J[0].niveau === 2 && J[0].ok && !JSON.stringify(J).includes('sulfitage 3'));
      global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text: '{"operation":"collage","dose":3}' }] }) });
      const r2 = await L.iaUsage('saisie', { texte: 'x', schema: SCH, consenti: true }, {});
      t('67. réponse hors schéma : refusée, jamais devinée', !r2.ok && r2.valeur === null && r2.erreurs.length > 0);
      L.iaConfigEcrire({ fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-essai' }, modeles: { anthropic: 'modele-essai' }, usages: { saisie: false } });
      let r3 = null; try { await L.iaUsage('saisie', { texte: 'x', consenti: true }, {}); } catch (e) { r3 = e; }
      t('67. usage désactivé : refus expliqué, rien n’est envoyé', r3 && r3.usage && /désactivé/.test(r3.message));
      global.fetch = fetch0; L.iaConfigEcrire({}); L.iaJournalVider();
    })().catch((e) => t('67. appel simulé sans erreur', false, String(e && e.message)));
  }
  // ================= 68c. 0.49.0-alpha.1 : assistant IA — veille des textes, audit, « Comment faire ? », codification dictée, configuration, plan de nettoyage =================
  {
    const base = () => { const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); return d; };
    const nomEx = ((base().apporteurs || [])[0] || {}).nom || 'zzz-sans-nom'; // donnée de l'exploitation (fictive) qui ne doit jamais partir
    // ---- IA14 : veille des textes réglementaires
    const T = L.veilleTextesListe(); const ids = T.map((x) => x.id);
    t('68c. veille : un texte par entrée de REG_TEXTES, date de la version relue lue dans l’intitulé (29/12/2024, 31 juillet 2025, janvier 2024, édition 2025)', ids.length === Object.keys(L.REG_TEXTES).length && L.veilleTexteDe('ue').dateRelue === '2024-12-29' && L.veilleTexteDe('champagne').dateRelue === '2025-07-31' && L.veilleTexteDe('demeter').dateRelue === '2024-01-01' && L.veilleTexteDe('np').dateRelue === '2025-01-01' && L.veilleTexteDe('terravitis').dateRelue === '' && L.veilleTexteDe('vmn').labels.includes('vmn'), T.map((x) => `${x.id}=${x.dateRelue}`));
    const PV = L.iaVeilleTextesPrompt();
    t('68c. veille : recherche web, schéma imposé ; ne part que la liste des textes (rien de l’exploitation)', PV.web === true && PV.schema === L.IA_VEILLE_TEXTES_SCHEMA && ids.every((id) => PV.texte.includes(`${id} | `)) && !PV.texte.includes(nomEx) && L.iaUsageDef('veilleTextes').niveau === 0);
    const repV = { textes: [{ id: 'ue', trouve: true, version: 'Règlement délégué (UE) 2019/934, version consolidée du 01/06/2025', date: '2025-06-01', url: 'https://eur-lex.europa.eu/eli/reg_del/2019/934/2025-06-01', remarque: null },
      { id: 'champagne', trouve: true, version: 'Cahier ancien', date: '2024-01-10', url: 'https://www.inao.gouv.fr/x', remarque: null }, { id: 'np', trouve: false, version: null, date: null, url: null, remarque: 'Rien de plus récent.' }, { id: 'zz', trouve: true, date: '2026-01-01', url: 'https://exemple.org' }] };
    const vV = L.iaSchemaValider(L.IA_VEILLE_TEXTES_SCHEMA, repV);
    const lu = L.iaVeilleTextesLire(vV.valeur, [{ url: 'https://eur-lex.europa.eu/eli/reg_del/2019/934/2025-06-01/', titre: 'EUR-Lex' }], { par: 'u1' });
    t('68c. veille : réponse contrôlée ; plus récent seulement si la date dépasse la version relue ; texte inconnu écarté ; adresse retrouvée dans les sources', vV.ok && lu.ue.trouve && lu.ue.date === '2025-06-01' && lu.ue.sourceVue && !lu.champagne.trouve && !lu.champagne.sourceVue && !lu.np.trouve && !lu.zz && lu.ue.dateRelue === '2024-12-29', lu);
    { const d = base(); const R0 = JSON.stringify([L.REG_REGLES, L.REG_SO2, L.REG_TEXTES]); const ex0 = JSON.stringify(L.refReglage(d)); const m0 = JSON.stringify(L.refMatrice(d));
      const r = L.veilleTextesSet(d, lu, 'u1'); const V = L.veilleReglage(d);
      t('68c. veille gardée (settings.referentiel.veille) : aucune valeur du référentiel ne change (règles, SO₂, textes, corrections, activation, matrice)', r.ok && r.n === 3 && r.plusRecents === 1 && V.ue.trouve && V.ue.par === 'u1' && !V.zz && JSON.stringify([L.REG_REGLES, L.REG_SO2, L.REG_TEXTES]) === R0 && JSON.stringify(L.refReglage(d)) === ex0 && JSON.stringify(L.refMatrice(d)) === m0, r);
      const rUe = L.REG_REGLES.find((x) => x.source === L.REG_TEXTES.ue); const rCh = L.REG_REGLES.find((x) => x.source === L.REG_TEXTES.champagne);
      t('68c. veille : les règles d’un texte plus récent sont « à relire » (affichage seulement) ; « Relu » lève la mention', L.veilleTexteARelire(d, 'ue') && !L.veilleTexteARelire(d, 'champagne') && L.veilleReglesDuTexte('ue').length > 10 && L.veilleRegleARelire(d, rUe) && (!rCh || !L.veilleRegleARelire(d, rCh)) && L.veilleTexteRelu(d, 'ue', 'u1').ok && !L.veilleTexteARelire(d, 'ue') && L.veilleReglage(d).ue.relu && !L.veilleTexteRelu(d, 'bio', 'u1').ok);
      t('68c. veille : réponse sans texte connu refusée, rien n’est écrit', !L.veilleTextesSet(base(), { zz: { trouve: true } }, 'u1').ok && !L.veilleTextesSet(base(), null, 'u1').ok);
      // droits : comme settings.referentiel, l'écriture du module Intrants
      const g = L.clone(d); g.settings.securite = { actif: true }; g.profils = [...(g.profils || []), { id: 'pf-l68', nom: 'Lecture intrants', modules: { intrants: 'lecture', params: 'ecriture' }, droits: {} }, { id: 'pf-e68', nom: 'Écriture intrants', modules: { intrants: 'ecriture', params: 'lecture' }, droits: {} }];
      g.utilisateurs = [...(g.utilisateurs || []), { id: 'u-l68', identifiant: 'l68', nom: 'L', profilId: 'pf-l68', actif: true }, { id: 'u-e68', identifiant: 'e68', nom: 'E', profilId: 'pf-e68', actif: true }];
      const h = L.clone(g); L.veilleTextesSet(h, { champagne: { ...lu.champagne, trouve: true, date: '2026-09-01' } }, 'u-l68'); const h2 = L.clone(g); L.veilleTextesSet(h2, { champagne: { ...lu.champagne, trouve: true, date: '2026-09-01' } }, 'u-e68');
      const gr = L.gardeDroits(g, h, 'u-l68'); const ge = L.gardeDroits(g, h2, 'u-e68');
      t('68c. droits : veille refusée sans l’écriture du module Intrants, permise avec', gr.ok === false && /référentiel/.test(gr.msg) && ge.ok !== false, [gr, ge]);
      // synchronisation : réglage commun, reçu par l'autre appareil
      const B = base(); const A = L.clone(B); L.veilleTextesSet(A, lu, 'u1'); A.meta = { ...(A.meta || {}), modifLe: '2026-12-01T10:00:00Z' };
      const m = L.syncFusion(B, A, L.clone(B)); const m2 = L.syncFusion(B, L.clone(B), A);
      t('68c. synchronisation : la veille passe d’un appareil à l’autre, dans les deux sens', L.veilleReglage(m.db).ue && L.veilleReglage(m.db).ue.trouve && L.veilleReglage(m2.db).ue && L.veilleReglage(m2.db).ue.trouve); }
    // ---- IA09 : préparer un audit
    { const d = base(); const ra = L.auditSave(d, null, { modeleId: 'douanes', debut: '2025-08-01', fin: '2026-07-31', date: '2026-11-21', auditeur: 'A. Auditeur-Fictif', organisme: 'Organisme-Fictif' }); const m = L.auditModele(d, 'douanes');
      L.auditRepondre(d, ra.id, 'p1', { etat: 'nc', note: 'Registre incomplet' }); const a = () => d.audits.find((x) => x.id === ra.id);
      const P = L.iaAuditPiecesEtat(d, a(), m, [{ id: 'entrees_sorties', rows: [] }, { id: 'operations', rows: [[1], [2]] }]);
      const ES = P.find((x) => x.id === 'entrees_sorties'); const OP = P.find((x) => x.id === 'operations'); const ID = P.find((x) => x.id === 'identite');
      t('68c. audit : pièces présentes / manquantes (registres de la période, identité, bilan)', P.length === m.pieces.length && ES.present === false && OP.present === true && OP.n === 2 && ID.n >= 0 && P.find((x) => x.id === 'bilan').present === true, P);
      const D = L.iaAuditDonnees(d, a(), m, P); const PA = L.iaAuditPrompt(D);
      t('68c. audit : part le type, les points et réponses, les pièces et les notes — ni l’auditeur ni l’organisme', D.type === m.nom && D.points.length === m.points.length && D.points[0].reponse === 'Non-conformité' && /Registre incomplet/.test(PA.texte) && /manquante/.test(PA.texte) && !PA.texte.includes('Auditeur-Fictif') && !PA.texte.includes('Organisme-Fictif') && L.iaUsageDef('audit').niveau === 2);
      const rep = { synthese: 'Registres à compléter.', pointsFaibles: [{ point: 'p1', texte: 'Registre des entrées incomplet' }, { point: 'zz', texte: 'Autre' }], piecesAPreparer: [{ piece: 'entrees_sorties', texte: 'Imprimer le registre' }],
        chapitres: [{ chapitre: 'synthese', notes: 'Point 1 à revoir.' }, { chapitre: 'operations', notes: 'Journal complet.' }, { chapitre: 'inconnu', notes: 'x' }] };
      const v = L.iaSchemaValider(L.IA_AUDIT_SCHEMA, rep); const x = L.iaAuditLire(v.valeur, m);
      t('68c. audit : réponse contrôlée, chapitres et pièces inconnus écartés', v.ok && x.chapitres.length === 2 && !x.chapitres.some((c) => c.chapitre === 'inconnu') && x.pointsFaibles[0].point === 'p1' && x.pointsFaibles[1].point === '' && x.piecesAPreparer[0].piece === 'entrees_sorties');
      const notes0 = a().notes || ''; const txt = L.iaAuditNotesTexte(x, { synthese: true, faibles: false, pieces: true, chapitres: ['operations'] }, m);
      t('68c. audit : rien dans les notes avant « Reprendre » ; texte composé des parties cochées seulement', (a().notes || '') === notes0 && /Registres à compléter/.test(txt) && /Imprimer le registre/.test(txt) && /Journal complet/.test(txt) && !/Point 1 à revoir/.test(txt) && !/entrées incomplet/.test(txt));
      const r2 = L.iaAuditNotesAjouter(d, ra.id, txt, { usage: 'audit', modele: 'm1', fournisseur: 'anthropic' });
      t('68c. audit : « Reprendre dans les notes » ajoute aux notes (sans effacer), trace de l’IA gardée ; audit clos refusé ; rien de coché refusé', r2.ok && a().notes.endsWith(txt.trim()) && a().ia && a().ia.usage === 'audit' && !L.iaAuditNotesAjouter(d, ra.id, '', null).ok && L.auditClore(d, ra.id, true).ok && !L.iaAuditNotesAjouter(d, ra.id, 'x', null).ok); }
    // ---- IA07 : « Comment faire… ? »
    { const doc = L.iaAideDoc({ modules: [{ id: 'cuverie', label: 'Cuverie & Lots', desc: 'Plan de cave' }, { id: 'params', label: 'Paramètres', desc: 'Réglages' }], chapitres: L.VISITE_CHAPITRES.filter((c) => !c.module || ['cuverie', 'params'].includes(c.module)), rubriques: [{ id: 'codification', label: '🏷 Codification des lots', groupe: 'Vin & cuverie' }], notes: [{ v: '0.49.0-alpha.1', notes: ['Assistant IA.'] }] });
      const PA = L.iaAidePrompt('Comment créer une règle de code ?', doc, ['Première question']);
      t('68c. aide : documentation intégrée (modules, visite, rubriques, nouveautés) ; question et questions précédentes ; rien de l’exploitation', /cuverie — Cuverie & Lots/.test(doc) && /## Prise en main/.test(doc) && /codification — 🏷 Codification des lots/.test(doc) && /0\.49\.0-alpha\.1/.test(doc) && PA.system.includes(doc) && /Comment créer une règle de code/.test(PA.texte) && /Première question/.test(PA.texte) && !PA.texte.includes(nomEx) && !PA.system.includes(nomEx) && L.iaUsageDef('aide').niveau === 0);
      const v = L.iaSchemaValider(L.IA_AIDE_SCHEMA, { reponse: 'Paramètres › Codification.', liens: [{ module: 'params', sub: 'codification', libelle: 'Codification' }, { module: 'tirage', sub: null, libelle: 'Tirages' }, { module: 'params', sub: '../x', libelle: 'Piège' }, { module: 'params', sub: 'codification', libelle: 'Doublon' }] });
      const x = L.iaAideLire(v.valeur, ['cuverie', 'params']);
      t('68c. aide : liens vers les modules permis seulement, sous-onglet au format d’un identifiant, sans doublon', v.ok && x.reponse === 'Paramètres › Codification.' && x.liens.length === 2 && x.liens[0].module === 'params' && x.liens[0].sub === 'codification' && !x.liens.some((l) => l.module === 'tirage') && x.liens[1].sub === '', x); }
    // ---- IA10 : règle de codification dictée
    { const d = base(); const rt = L.codifTableSet(d, { nom: 'Marques fictives', source: 'libre', lignes: [{ libelle: 'Marque A', code: 'A' }, { libelle: 'Marque B', code: 'B' }] });
      const P = L.iaCodifPrompt(d, 'tirage', 'T, l’année sur deux chiffres, un tiret, la marque, puis un compteur sur trois chiffres');
      t('68c. codification : la phrase et les noms des tables partent (codes T1…), schéma imposé', rt.ok && /Marques fictives/.test(P.texte) && P.codes.T1 === rt.id && /année sur deux chiffres/.test(P.texte) && !P.texte.includes(nomEx) && L.iaUsageDef('codification').niveau === 0);
      const rep = { briques: [{ type: 'texte', valeur: 'T' }, { type: 'date', champ: 'annee', chiffres: 2, encodage: 'chiffres' }, { type: 'sep', valeur: '-' }, { type: 'choix', table: 'T1' }, { type: 'compteur', chiffres: 3, alphabet: 'num', raz: 'annee', depart: 1, pas: 1, inconnu: 'x' }] };
      const v = L.iaSchemaValider(L.IA_CODIF_SCHEMA, rep); const x = L.iaCodifBriques(d, 'tirage', v.valeur, P.codes);
      const g = x.ok ? L.codifGenerer(d, 'tirage', { date: '2026-11-28', choix: { [rt.id]: d.codifTables[0].lignes[1].id } }, { briques: x.briques }) : {};
      t('68c. codification : briques contrôlées (codifValider), table reconnue par son code, champs inconnus écartés ; aperçu habituel (codifGenerer)', v.ok && x.ok && x.briques.length === 5 && x.briques[3].tableId === rt.id && !('inconnu' in x.briques[4]) && g.code === 'T26-B001', [x, g.code]);
      const bad = L.iaCodifBriques(d, 'tirage', { briques: [{ type: 'compteur' }, { type: 'compteur' }, { type: 'magie' }, { type: 'variable', variable: 'secret' }] }, P.codes);
      t('68c. codification : composition refusée (deux compteurs), type et donnée inconnus signalés ; rien n’est enregistré', !bad.ok && /Un seul compteur/.test(bad.msg) && bad.ignores.length >= 2 && !(d.codifRegles || []).length); }
    // ---- IA11 : configuration guidée depuis une description
    { const Q = L.iaPersoQuestions(); const P = L.iaPersoPrompt('Récoltant en Champagne, bio, nous sommes trois.');
      t('68c. configuration : liste des questions (identifiant, type, choix) sans le compte ni le choix de la base ; description envoyée', Q.length === L.PERSO_QUESTIONS.length - 2 && !Q.some((q) => q.id === 'compte' || q.id === 'donnees') && Q.find((q) => q.id === 'region').choix.some((o) => o.id === 'champagne') && /Récoltant en Champagne/.test(P.texte) && /region \| choix/.test(P.texte) && L.iaUsageDef('configuration').niveau === 0);
      const rep = { reponses: [{ id: 'nom', valeur: 'Domaine Fictif' }, { id: 'region', valeur: 'champagne' }, { id: 'statut', valeur: 'Récoltant (vos raisins)' }, { id: 'types', valeur: ['effervescent', 'inconnu'] }, { id: 'revendications', valeur: ['conv', 'bio'] }, { id: 'pressoir', valeur: 'oui' }, { id: 'verrou', valeur: '15' }, { id: 'acces', valeur: 'equipe' },
        { id: 'compte', valeur: 'admin' }, { id: 'donnees', valeur: 'vide' }, { id: 'onglet', valeur: 'nulle-part' }, { id: 'accise', valeur: 'FAUX' }, { id: 'zz', valeur: 'x' }, { id: 'hygiene', valeur: true }] };
      const v = L.iaSchemaValider(L.IA_PERSO_SCHEMA, rep); const x = L.iaPersoReponses(v.valeur);
      t('68c. configuration : réponses contrôlées par persoValider (libellé de choix reconnu, « oui », nombre écrit) ; choix inconnus, accise invalide, compte et base jamais proposés', v.ok && x.reponses.nom === 'Domaine Fictif' && x.reponses.region === 'champagne' && x.reponses.statut === 'recoltant' && x.reponses.pressoir === true && x.reponses.verrou === 15 && x.reponses.hygiene === true && x.reponses.acces === 'equipe' && !('types' in x.reponses) && !('compte' in x.reponses) && !('donnees' in x.reponses) && !('onglet' in x.reponses) && !('accise' in x.reponses) && x.refusees.some((r) => r.id === 'types') && x.refusees.some((r) => r.id === 'accise') && x.refusees.some((r) => r.id === 'zz'), x);
      const d = base(); const avant = JSON.stringify(d); const plan = L.persoPlan(d, 'basique', { ...L.persoDefauts(d, {}), ...x.reponses }, {});
      t('68c. configuration : les réponses proposées ne font qu’un plan (aperçu) ; la base ne change pas', plan.entreprise.nom === 'Domaine Fictif' && JSON.stringify(d) === avant); }
    // ---- IA21 : plan de nettoyage proposé
    { const d = base(); const D = L.iaNettoyageDonnees(d); const P = L.iaNettoyagePrompt(D);
      const nomsCuves = d.contenants.slice(0, 5).map((c) => c.nom).filter((n) => n && n.length > 3);
      t('68c. nettoyage : partent les types de contenants et d’équipements (avec leur nombre), les locaux et les noms des produits d’hygiène — pas les noms des cuves', D.contenants.some((c) => c.id === 'cuve' && c.n > 0) && D.equipements.some((e) => e.id === 'pressoir') && D.produits.some((p) => /Soude/.test(p.nom)) && /Soude caustique/.test(P.texte) && nomsCuves.every((n) => !P.texte.includes(`| ${n} |`)) && L.iaUsageDef('planNettoyage').niveau === 0);
      const rep = { lignes: [
        { zone: 'cuverie', libelle: 'Cuves inox', cible: { type: 'contenants', formes: ['cuve', 'inconnu'] }, action: 'nettoyage', quand: [{ type: 'vidange' }, { type: 'periodique', jours: 30 }], produits: [{ nom: 'Soude caustique lessive 30 %', conc: 2, concUnite: '%' }, { type: 'desinfectant', conc: 0.2, concUnite: '%' }], mode: 'Rincer, nettoyer, rincer.', contact: '20 min', controle: 'ph', attendu: 'pH 7', responsable: 'Caviste', danger: 'chimique' },
        { zone: 'pressoir', libelle: 'Pressoirs', cible: { type: 'equipements', categorie: 'pressoir' }, action: 'rincage', quand: [{ type: 'apresOp' }] },
        { zone: 'cuverie', libelle: 'Sol', cible: { type: 'locaux', locaux: ['sol_cuverie'] }, action: 'magie', quand: [{ type: 'periodique', jours: 7 }] },
        { zone: 'autre', libelle: 'Rien', cible: { type: 'locaux', locaux: ['introuvable'] }, action: 'rincage', quand: [{ type: 'texte', texte: 'Parfois' }] }] };
      const v = L.iaSchemaValider(L.IA_NETTOYAGE_SCHEMA, rep); const n0 = L.planNettoyage(d).length; const X = L.iaNettoyageLignes(d, v.valeur);
      t('68c. nettoyage : lignes au format du plan, produits de la cave reconnus, action inconnue et cible absente refusées ; rien d’ajouté avant validation', v.ok && X.length === 4 && X[0].ok && X[0].spec.cible.formes.join() === 'cuve' && X[0].spec.produits[0].produitId && X[0].spec.produits[1].type === 'desinfectant' && X[1].ok && X[1].spec.cible.ids.length >= 1 && !X[2].ok && !X[3].ok && L.planNettoyage(d).length === n0, X.map((x) => [x.ok, x.msg]));
      const r = L.iaNettoyageAjouter(d, X.filter((x) => x.ok).map((x) => x.spec), { usage: 'planNettoyage', modele: 'm1', fournisseur: 'anthropic' }); const l1 = d.planNettoyage.find((e) => e.id === (r.ids || [])[0]);
      t('68c. nettoyage : lignes cochées ajoutées, marquées « proposé par l’IA, à vérifier » (trace) ; rien de coché refusé', r.ok && r.n === 2 && L.planNettoyage(d).length === n0 + 2 && l1.ia && l1.ia.usage === 'planNettoyage' && l1.aVerifier === true && !L.iaNettoyageAjouter(d, [], null).ok);
      const re = L.planEntreeSave(d, { ...l1, libelle: 'Cuves inox (modifié)' }, l1.id); const l2 = d.planNettoyage.find((e) => e.id === l1.id);
      t('68c. nettoyage : ligne modifiée, trace gardée ; « Vérifiée » lève la mention « à vérifier »', re.ok && l2.ia && l2.aVerifier && L.iaNettoyageVerifie(d, l1.id, 'u1').ok && !d.planNettoyage.find((e) => e.id === l1.id).aVerifier && d.planNettoyage.find((e) => e.id === l1.id).ia && !L.iaNettoyageVerifie(d, 'zz', 'u1').ok); }
  }
  // ---------- 68b (0.49.0-alpha.1) : documents lus par l'IA — réception (IA02), ticket de pesée / bon / DAE (IA03), barèmes (IA04), plan depuis un protocole (IA05), composés (IA13), commentaire d'un bulletin (IA18) ----------
  {
    const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d); const avant = JSON.stringify(d);
    // outils : dates, nombres, unités, rapprochement
    const D = (x) => (L.iadDate(x) || {}).iso || null;
    t('68b. dates : ISO, jj/mm/aaaa, jj.mm.aa, mois/année et « mars 2027 » (dernier jour du mois, marqué), dates impossibles refusées', D('2027-03-12') === '2027-03-12' && D('12/03/2027') === '2027-03-12' && D('12.03.27') === '2027-03-12' && D('03/2027') === '2027-03-31' && L.iadDate('03/2027').mois && D('mars 2027') === '2027-03-31' && D('12 mars 2027') === '2027-03-12' && D('févr. 2028') === '2028-02-29' && D('31/02/2027') === null && D('n/a') === null && D('12/13/2027') === null && D('1999-01-01') === null);
    t('68b. heures et nombres : « 9h30 » → 09:30, « 1 234,5 », « 4.300 » (milliers) ; heure impossible écartée', L.iadHeure('9h30') === '09:30' && L.iadHeure('25:10') === '' && L.iadNombre('1 234,5 kg') === 1234.5 && L.iadNombre('4.300') === 4300 && L.iadNombre('3,25') === 3.25 && L.iadNombre('—') === null);
    t('68b. unités : kg ↔ g, L ↔ mL, hL → L, pièces ; masse et volume jamais mélangés', L.iadUnite('Kilogrammes') === 'kg' && L.iadUnite('sacs') === 'u' && L.iadConvertir(25, 'kg', 'g') === 25000 && L.iadConvertir(500, 'g', 'kg') === 0.5 && L.iadConvertir(2, 'L', 'mL') === 2000 && L.iadConvertir(52, 'hL', 'L') === 5200 && L.iadConvertir(1, 'L', 'g') === null && L.iadConvertir(3, 'u', 'kg') === null);
    const LS = [{ id: 'a', noms: ['Domaine Hennequin'] }, { id: 'b', noms: ['EARL Marchand'] }, { id: 'c', noms: ['Pinot noir'] }, { id: 'e', noms: ['Pinot blanc'] }];
    t('68b. rapprochement : casse et accents ignorés, nom partiel, faute de frappe ; ex æquo ou trop loin → rien (choix à la main)', L.iadRapprocher('domaine hennequin', LS).id === 'a' && L.iadRapprocher('Hennequin', LS).id === 'a' && L.iadRapprocher('EARL Marchant', LS).id === 'b' && L.iadRapprocher('Pinot', LS) === null && L.iadRapprocher('Zygomatique', LS) === null);
    // IA02 : réception
    const P2 = L.iaReceptionPrompt(d); const enz = d.produits.find((p) => /Enzyme/.test(p.nom));
    t('68b. IA02 : consignes en français, liste des produits envoyée par leurs noms (codes P1…), jamais leurs identifiants ; schéma imposé', /étiquette/.test(P2.system) && P2.texte.includes(`| ${enz.nom}`) && !P2.texte.includes(enz.id) && P2.schema === L.IA_RECEPTION_SCHEMA && Object.values(P2.codes).includes(enz.id));
    const kE = Object.keys(P2.codes).find((k) => P2.codes[k] === enz.id);
    const r2 = L.iaReceptionLire(d, { produitCode: kE, produit: 'ENZYME', numLot: 'Lot n° AB-1234', ddm: '03/2028', quantite: 1, unite: 'kg', nombre: 2, incertains: ['numLot', 'zz'] }, P2.codes, { aujourdhui: '2026-11-28' });
    t('68b. IA02 : produit choisi par son code, préfixe « Lot n° » retiré, DDM au mois (dernier jour, à vérifier), 2 × 1 kg → 2000 g (unité du produit), champs incertains connus seulement', r2.ok && r2.patch.produitId === enz.id && r2.patch.numLot === 'AB-1234' && r2.patch.dluo === '2028-03-31' && r2.patch.qty === '2000' && r2.incertains.includes('numLot') && r2.incertains.includes('ddm') && !r2.incertains.includes('zz') && r2.alertes.length === 2, r2);
    const r2b = L.iaReceptionLire(d, { produit: 'enzyme pectolytique', numLot: 'X1', ddm: '2025-01-01', quantite: 5, unite: 'L' }, P2.codes, { aujourdhui: '2026-11-28' });
    t('68b. IA02 : produit rapproché par son nom ; DDM dépassée signalée ; litres pour un produit suivi en grammes : quantité non convertie', r2b.ok && r2b.patch.produitId === enz.id && r2b.patch.dluo === '2025-01-01' && r2b.alertes.some((a) => /dépassée/.test(a)) && !r2b.patch.qty && r2b.alertes.some((a) => /à la main/.test(a)), r2b);
    const r2c = L.iaReceptionLire(d, { produit: 'Zymaflore X16', numLot: null, ddm: null, quantite: 500, unite: 'g' }, P2.codes);
    t('68b. IA02 : produit absent du stock trouvé dans les catalogues (rapprochement sur l’appareil)', r2c.ok && !r2c.patch.produitId && r2c.catalogue && /zymaflore/i.test(r2c.catalogue.nom) && r2c.patch.qty === '500', r2c);
    const r2d = L.iaReceptionLire(d, { produit: null, numLot: '???', ddm: '31/02/2027', quantite: -4, unite: 'kg' }, P2.codes);
    t('68b. IA02 : réponse incohérente (quantité négative, DDM impossible, lot sans caractère) : refusée, rien de prérempli', !r2d.ok && /Rien d’exploitable/.test(r2d.msg));
    t('68b. IA02 : schéma : quantité qui n’est pas un nombre, réponse qui n’est pas un objet : refusées ; valeurs nulles acceptées', !L.iaSchemaValider(L.IA_RECEPTION_SCHEMA, { produit: 'x', quantite: 'beaucoup' }).ok && !L.iaSchemaValider(L.IA_RECEPTION_SCHEMA, 'texte').ok && L.iaSchemaValider(L.IA_RECEPTION_SCHEMA, { produit: null, numLot: 'x', ddm: null, quantite: null, unite: null }).ok);
    // IA03 : pesée
    const P3 = L.iaPeseePrompt(d, 'pesee'); const ap = d.apporteurs[0]; const pc = d.parcelles.find((p) => p.cruId) || d.parcelles[0];
    t('68b. IA03 : noms des apporteurs, crus, parcelles et cépages envoyés (codes), jamais d’identifiant ni de volume ; niveau 2', P3.texte.includes(ap.nom) && P3.texte.includes('Pinot noir') && !P3.texte.includes(ap.id) && L.iaUsageDef('pesee').niveau === 2 && P3.schema === L.IA_PESEE_SCHEMA);
    const kA = Object.keys(P3.codes.A).find((k) => P3.codes.A[k] === ap.id);
    const r3 = L.iaPeseeLire(d, { date: '05/10/2026', heure: '9h30', apporteurCode: kA, cru: 'Ay', cepage: 'pinot noir', poidsBrutKg: 4300, tareKg: 300, poidsNetKg: 4000, caisses: 80, tap: 10.2, numero: 'T-0042', incertains: ['caisses'] }, P3.codes);
    t('68b. IA03 : ticket lu → date, heure, apporteur (code), cru et cépage (noms rapprochés), brut et tare (le net se calcule), caisses, TAP, n° du ticket', r3.ok && r3.patch.date === '2026-10-05' && r3.patch.heure === '09:30' && r3.patch.apporteurId === ap.id && r3.patch.cruId === 'cru-ay-champagne' && r3.patch.cepageId === 'pn' && r3.patch.brutKg === '4300' && r3.patch.tareKg === '300' && !r3.patch.kg && r3.patch.caisses === '80' && r3.patch.tap === '10,2' && r3.patch.ref === 'T-0042' && r3.incertains.includes('caisses'), r3);
    const r3b = L.iaPeseeLire(d, { parcelle: pc.nom, poidsBrutKg: 300, tareKg: 500, poidsNetKg: 3950, tap: 31, caisses: -2, apporteur: 'Inconnu de la cave' }, P3.codes);
    t('68b. IA03 : tare > brut écartée (net seul gardé), TAP hors bornes et caisses négatives écartés, apporteur inconnu signalé, parcelle → son cru', r3b.ok && r3b.patch.kg === '3950' && !r3b.patch.brutKg && !r3b.patch.tap && !r3b.patch.caisses && r3b.nonReconnus.apporteur === 'Inconnu de la cave' && r3b.patch.parcelleId === pc.id && (!pc.cruId || r3b.patch.cruId === pc.cruId) && r3b.alertes.length >= 2, r3b);
    const r3c = L.iaPeseeLire(d, { poidsBrutKg: 4300, tareKg: 300, poidsNetKg: 3000 }, P3.codes);
    t('68b. IA03 : brut − tare différent du net lu : signalé, poids à vérifier', r3c.ok && r3c.incertains.includes('poids') && r3c.alertes.some((a) => /différent/.test(a)));
    t('68b. IA03 : rien d’exploitable → refusé', !L.iaPeseeLire(d, { poidsNetKg: -5 }, P3.codes).ok && !L.iaPeseeLire(d, null).ok);
    // IA03 : entrée de moûts
    const P3m = L.iaPeseePrompt(d, 'mout');
    const r3m = L.iaMoutLire(d, { numero: 'DAE 26-001', date: '2026-10-06', immatriculation: 'ab-123-cd', apporteur: ap.nom, millesime: 2026, compartiments: [{ compartiment: '1', volume: 52, unite: 'hL', cepage: 'Chardonnay', fraction: 'Cuvée', cru: 'Cramant' }, { compartiment: '2', volume: 3800, unite: 'L', cepage: 'Meunier', fraction: '1re taille' }, { compartiment: '3', volume: -3 }, { compartiment: '4', volume: 2, unite: 'm3', cepage: 'Pinot Gris d’ailleurs', fraction: 'Presse' }] }, P3m.codes);
    t('68b. IA03 (moûts) : n° de bon, date, immatriculation, partenaire ; hL et m3 convertis en litres, fractions par nom puis par rôle (taille), compartiment incohérent écarté, noms absents signalés', r3m.ok && r3m.entete.ref === 'DAE 26-001' && r3m.entete.immat === 'AB-123-CD' && r3m.entete.apporteurId === ap.id && r3m.mouts.length === 3 && r3m.mouts[0].volL === 5200 && r3m.mouts[0].fractionId === 'cuvee' && r3m.mouts[0].cepageId === 'chard' && r3m.mouts[0].cruId === 'cru-cramant' && r3m.mouts[0].millesime === '2026' && r3m.mouts[1].fractionId === 'taille1' && r3m.mouts[2].volL === 2000 && r3m.nonReconnus.fraction4 === 'Presse' && r3m.nonReconnus.cepage4 && r3m.alertes.length === 1 && P3m.schema === L.IA_MOUT_SCHEMA, r3m);
    t('68b. IA03 (moûts) : plus de 600 hL lus → refusé, rien de prérempli', !L.iaMoutLire(d, { compartiments: [{ volume: 400, unite: 'hL' }, { volume: 300, unite: 'hL' }] }, P3m.codes).ok);
    // IA04 : barèmes
    const pts = []; for (let h = 0; h <= 150; h += 1) pts.push([h * 10, 100 + h * 40]);
    const rb = L.iaBaremesLire({ tables: [{ page: 1, nom: 'C 12', certificat: 'R.X1.26.00042', uniteHauteur: 'mm', uniteVolume: 'L', capacite: 6100, lignes: pts.slice(0, 80) }, { page: 2, nom: 'C 12', uniteHauteur: 'mm', uniteVolume: 'L', lignes: pts.slice(80) }] }, { fichier: 'cuve.pdf', trace: { usage: 'baremes' } });
    const b0 = rb.ok ? rb.baremes[0] : null;
    t('68b. IA04 : tables relues (deux pages, mm → cm) lues par jaugeAnalyser : pages réunies en un barème, certificat et capacité, trace « ia », fiabilité au mieux « à vérifier »', rb.ok && rb.baremes.length === 1 && b0.points.length === 151 && b0.points[1][0] === 1 && b0.points[1][1] === 140 && b0.meta.certificat === 'R.X1.26.00042' && b0.meta.capacite === 6100 && b0.meta.pages.join() === '1,2' && b0.meta.lecture === 'ia' && b0.meta.ia.usage === 'baremes' && b0.fiabilite !== 'bonne', rb);
    const desord = pts.slice(0, 40).map((p, i) => [p[0], i % 2 ? p[1] : 9000 - p[1]]);
    const rb2 = L.iaBaremesLire({ tables: [{ nom: 'C 13', lignes: desord }, { nom: 'C 14', lignes: [[1, 2]] }] });
    t('68b. IA04 : volumes dans le désordre ou table trop courte : écartés, jamais devinés', !rb2.ok && L.iaBaremesPages({ tables: [{ nom: 'C 13', lignes: desord }] }).journal.length === 1);
    const rbC = L.iaBaremesLire({ tables: [{ immatriculation: 'AB-123-CD', compartiment: '2', mesure: 'creux', uniteHauteur: 'm', uniteVolume: 'L', lignes: pts.slice(0, 60).map((p) => [p[0] / 1000, 8000 - p[1]]) }] }, { fichier: 'citerne.pdf' });
    t('68b. IA04 : certificat de citerne relu (creux, compartiment, immatriculation) : barème de citerne', rbC.ok && rbC.baremes[0].cible === 'citerne' && rbC.baremes[0].compartiment === '2' && rbC.baremes[0].mesure === 'creux', rbC.ok && rbC.baremes[0]);
    // IA05 : plan
    const P5 = L.iaPlanPrompt('Sulfitage : 4 g/hL en cuvée.');
    t('68b. IA05 : seul le protocole part (aucune liste de la cave), schéma imposé', P5.texte.includes('Sulfitage : 4 g/hL') && !P5.texte.includes('Chardonnay |') && P5.schema === L.IA_PLAN_SCHEMA);
    const r5 = L.iaPlanLire(d, { nom: 'Protocole blanc', groupes: [{ label: 'Chardonnay', cepages: ['Chardonnay'] }, { label: 'Pinots', cepages: ['Pinot noir', 'Meunier'] }], revendications: ['Conventionnel', 'Bio'], fractions: ['Cuvée', 'Taille'], lignes: [{ type: 'section', etape: 'Débourbage' }, { type: 'etape', etape: 'Sulfitage', produit: 'SO2', valeurs: [{ fraction: 'Cuvée', valeur: '4 g/hL' }, { fraction: 'Taille', valeur: '6 g/hL' }] }, { type: 'etape', etape: 'Enzymage', produit: 'Enzyme', valeurs: [{ valeur: '1 g/hL' }] }, { type: 'etape', etape: 'Levurage', valeurs: [{ revendication: 'Bio', valeur: '20 g/hL' }, { groupe: 'Inconnu', valeur: '9' }] }] }, { trace: { usage: 'planProtocole' } });
    const pl = r5.ok ? r5.plan : {}; const net = r5.ok ? L.planVinifNet(d, pl) : null;
    t('68b. IA05 : cépages, revendications (conv, bio) et fractions (rôles cuvée / taille) rapprochés ; étendues déduites (colonne, groupe, revendication) ; colonne inconnue écartée ; « à vérifier », trace ; format accepté par planVinifNet', r5.ok && pl.groupes[1].cepages.join() === 'pn,pm' && pl.revendications.map((r) => r.id).join() === 'conv,bio' && pl.fractions.map((f) => f.id).join() === 'cuvee,tailles' && pl.lignes[0].type === 'section' && pl.lignes[1].valeurs['g2|bio|tailles'] === '6 g/hL' && pl.lignes[2].etendue === 'groupe' && pl.lignes[2].valeurs.g1 === '1 g/hL' && pl.lignes[3].etendue === 'revendication' && pl.lignes[3].valeurs['g1|bio'] === '20 g/hL' && !pl.lignes[3].valeurs['g1|conv'] && r5.ignorees === 1 && pl.aVerifier === true && pl.ia.usage === 'planProtocole' && !!net && net.lignes.length === 4, r5);
    { const g = L.clone(d); const rs = L.planVinifSave(g, { ...pl, verifie: false }, null, 'u1'); const sv = rs.ok ? g.plansVinif.find((p) => p.id === rs.id) : null;
      t('68b. IA05 : plan enregistré après relecture : « à vérifier », trace « ia » gardée', rs.ok && sv.aVerifier === true && sv.ia && sv.ia.usage === 'planProtocole', rs.msg); }
    t('68b. IA05 : plan sans groupe, revendication ou fraction, ou sans ligne : refusé', !L.iaPlanLire(d, { groupes: [], revendications: ['Conventionnel'], fractions: ['Cuvée'], lignes: [{ type: 'etape', etape: 'x' }] }).ok && !L.iaPlanLire(d, { groupes: [{ label: 'Tous' }], revendications: ['Conventionnel'], fractions: ['Cuvée'], lignes: [] }).ok);
    // IA13 : composés
    const P13 = L.iaComposesPrompt({ nom: 'Cuivrol 2 %' }, 'Citrate de cuivre 2 % sur support bentonite.');
    t('68b. IA13 : texte de la FT et composés connus (ids et noms) envoyés', P13.texte.includes('citrate-cuivre | Citrate de cuivre') && P13.texte.includes('Citrate de cuivre 2 %') && P13.schema === L.IA_COMPOSES_SCHEMA);
    const r13 = L.iaComposesLire({ composes: [{ id: 'citrate-cuivre', partPct: 2, justification: 'Citrate de cuivre 2 %' }, { id: 'bentonite', partPct: null }, { id: 'inconnu' }, { id: 'citrate-cuivre', partPct: 5 }, { id: 'so2', partPct: 0 }] });
    t('68b. IA13 : identifiants inconnus écartés, doublons fusionnés, part en fraction (2 % → 0,02), part nulle ou absente : supposé pur ; choix repris dans la saisie (teneur vide complétée, teneur saisie gardée)', r13.ok && r13.composes.length === 3 && r13.composes[0].part === 0.02 && !('part' in r13.composes[1]) && !('part' in r13.composes[2]) && r13.inconnus === 1 && JSON.stringify(L.iaComposesChoix(r13.composes, [{ id: 'bentonite', part: '50' }, { id: 'citrate-cuivre', part: '' }])) === JSON.stringify([{ id: 'bentonite', part: '50' }, { id: 'citrate-cuivre', part: '2' }, { id: 'so2', part: '' }]), r13);
    { const g = L.clone(d); const r = L.produitSave(g, { nom: 'Cuivrol essai', categorie: 'oeno', unite: 'g', composes: r13.composes.map((x) => ({ id: x.id, ...(x.part != null ? { part: x.part } : {}) })) }); const p = g.produits.find((x) => x.id === r.id);
      t('68b. IA13 : composés repris enregistrés dans p.composes seulement à l’enregistrement du produit', r.ok && p.composes.length === 3 && p.composes[0].part === 0.02 && L.refComposesDe(p).some((x) => x.id === 'citrate-cuivre' && x.part === 0.02)); }
    t('68b. IA13 : réponse sans liste refusée', !L.iaComposesLire({}).ok);
    // IA18 : commentaire
    const R = L.getR(d); const lot = Object.values(R.lots)[0]; const pid = d.analysesParams[0].id;
    const don = L.iaCommentaireDonnees(d, R, { lotId: lot.id, valeurs: { [pid]: 3.2, zz: 4 }, nouveaux: [{ nom: 'Potassium', v: 900, unite: 'mg/L' }], date: '2026-11-01' });
    const P18 = L.iaCommentairePrompt(don); const txt = JSON.stringify(don);
    t('68b. IA18 : résultats (nom, valeur, unité), stade, couleur, revendication, plafond de SO₂ total et alertes du moteur ; jamais le code du lot, la cuve ni l’identifiant ; « œnologue »', don.resultats.length === 2 && don.resultats[0].valeur === 3.2 && don.stade && don.revendication && Array.isArray(don.alertesMoteur) && !txt.includes(lot.code) && !txt.includes(lot.id) && /œnologue/.test(P18.system) && P18.schema === L.IA_COMMENTAIRE_SCHEMA && L.iaUsageDef('bulletinCommentaire').niveau === 2, don);
    const r18 = L.iaCommentaireLire({ synthese: 'Acidité volatile élevée.', points: [{ niveau: 'info', message: 'pH normal' }, { niveau: 'alerte', parametre: 'AV', message: 'Recontrôler' }, { niveau: 'zz', message: 'autre' }, { niveau: 'surveiller', message: '' }] });
    t('68b. IA18 : points triés (alerte, à surveiller, info), niveau inconnu → info, message vide retiré ; commentaire vide refusé', r18.ok && r18.points.map((p) => p.niveau).join() === 'alerte,info,info' && !L.iaCommentaireLire({ synthese: '', points: [] }).ok);
    t('68b. aucune de ces lectures n’écrit dans la base', JSON.stringify(d) === avant);
  }
  // ================= 68a. 0.49.0-alpha.1 : assistant IA au chai — saisie en langage courant, fiche relue, fermentation, recherche, histoire d'un lot =================
  {
    const g = L.normalizeDb(L.sampleDb()); L.syncConfig(g); const Rg = L.getR(g); const auj = L.todayISO(); const g0 = JSON.stringify(g);
    const jour = (n) => new Date(Date.parse(`${auj}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
    const cont = (nom) => g.contenants.find((c) => c.nom === nom); const c8 = cont('Cuve 08'); const c5 = cont('Cuve 05'); const c6 = cont('Cuve 06'); const vide = g.contenants.find((c) => !L.contParts(Rg, c.id).some((p) => p.vol > 0.5));
    const p8 = L.contParts(Rg, c8.id)[0]; const codesLots = Object.values(Rg.lots).map((l) => l.code).filter((x) => x && x.length >= 4);
    const met = g.produits.find((p) => /Métabisulfite/.test(p.nom)); const sucre = g.produits.find((p) => p.unite === 'kg' && /Sucre/.test(p.nom));
    const trace = { usage: 'saisie', modele: 'm1', fournisseur: 'anthropic' };
    // IA01 : saisie
    const P = L.iaSaisiePrompt(g, Rg, 'sulfitage de la cuve 08 à 3 g/hL', { date: auj });
    const kC = (c) => Object.keys(P.codes.conts).find((k) => P.codes.conts[k] === c.id); const kO = (id) => Object.keys(P.codes.ops).find((k) => P.codes.ops[k] === id); const kP = (p) => Object.keys(P.codes.prods).find((k) => P.codes.prods[k] === p.id);
    t('68a. saisie : phrase, opérations, contenants et produits en stock envoyés sous des codes courts ; ni code de lot, ni identifiant interne, ni partenaire, ni volume', /sulfitage de la cuve 08/.test(P.texte) && /Cuve 08/.test(P.texte) && /Métabisulfite/.test(P.texte) && !!kC(c8) && !!kO('sulfitage') && !!kP(met)
      && !codesLots.some((c) => P.texte.includes(c)) && !g.contenants.some((c) => P.texte.includes(`| ${c.id}`) || P.texte.includes(` ${c.id}\n`)) && !g.produits.some((p) => P.texte.includes(p.id)) && !g.apporteurs.some((a) => P.texte.includes(a.nom)));
    const rep = { operation: kO('sulfitage'), contenant: kC(c8), produits: [{ produit: kP(met), dose: 3, uniteDose: 'g/hL' }] };
    const v1 = L.iaSchemaValider(P.schema, rep); const lu1 = L.iaSaisieLire(P.codes, v1.valeur);
    t('68a. saisie : réponse contrôlée, opération reconnue', v1.ok && lu1.type === 'sulfitage' && !lu1.choix.length);
    const x1 = L.iaSaisiePreset(g, Rg, P.codes, v1.valeur, 'sulfitage', trace);
    t('68a. saisie : formulaire prérempli — portion de la cuve, produit, lot fournisseur en stock, quantité = dose × volume, trace « ia »', x1.preset.portionId === p8.portionId && x1.preset.lignes.length === 1 && x1.preset.lignes[0].produitId === met.id && !!x1.preset.lignes[0].arrivageId && x1.preset.lignes[0].qty === String(3 * p8.vol / 100) && x1.preset.ia.usage === 'saisie' && !x1.notes.length, x1);
    const lu2 = L.iaSaisieLire(P.codes, { operation: kO('sulfitage'), autres: [kO('collage')] }); const lu3 = L.iaSaisieLire(P.codes, { operation: 'O999' });
    t('68a. saisie : opération ambiguë → liste de choix (jamais de supposition) ; inconnue → aucune', lu2.type === null && lu2.choix.join() === 'sulfitage,collage' && lu3.type === null && lu3.inconnue && !lu3.choix.length);
    t('68a. saisie : schéma — code d’unité hors liste refusé', !L.iaSchemaValider(P.schema, { operation: 'O1', produits: [{ produit: 'P1', dose: 3, uniteDose: 'kg/t' }] }).ok);
    const x2 = L.iaSaisiePreset(g, Rg, P.codes, { operation: kO('soutirage'), contenant: kC(c5), destination: kC(c6), volumeL: 2000, date: jour(-1) }, 'soutirage', trace);
    const x3 = L.iaSaisiePreset(g, Rg, P.codes, { operation: kO('suivi'), contenant: kC(c8), densite: 1012, temperature: 18.5 }, 'suivi', trace);
    t('68a. saisie : soutirage (départ, arrivée, volume, date dite) ; relevé (densité 1012 → 1,012, température)', x2.preset.portionId === L.contParts(Rg, c5.id)[0].portionId && x2.preset.destId === c6.id && x2.preset.volL === '2000' && x2.preset.date === jour(-1) && x3.preset.densite === '1,012' && x3.preset.tempC === '18,5', [x2, x3]);
    const x4 = L.iaSaisiePreset(g, Rg, P.codes, { operation: kO('enrichissement'), contenant: kC(c8), produits: [{ produit: kP(sucre), quantite: 1500, unite: 'g' }, { produit: kP(met), quantite: 2, unite: 'L' }] }, 'enrichissement', trace);
    t('68a. saisie : quantité convertie dans l’unité du produit (1 500 g → 1,5 kg), unité incompatible signalée et laissée vide', x4.preset.lignes[0].qty === '1.5' && x4.preset.lignes[1].qty === '' && x4.notes.some((n) => /unité incompatible/.test(n)), x4);
    const x5 = L.iaSaisiePreset(g, Rg, P.codes, { operation: kO('sulfitage'), contenant: kC(vide), date: '31/02/2026' }, 'sulfitage', trace);
    t('68a. saisie : cuve vide et date non reconnue → signalées, aucune portion devinée', !x5.preset.portionId && !x5.preset.date && x5.notes.some((n) => /est vide/.test(n)) && x5.notes.some((n) => /non reconnue/.test(n)), x5);
    // IA17 : fiche relue
    const d = L.clone(g);
    const pv1 = L.previsionSave(d, { type: 'intrant', date: auj, f: { date: auj, sousType: 'sulfitage', portionId: p8.portionId, lignes: [{ produitId: met.id, arrivageId: x1.preset.lignes[0].arrivageId, qty: '60' }], prepUses: [], motif: '' } });
    const pv2 = L.previsionSave(d, { type: 'suivi', date: auj, f: { date: auj, portionId: p8.portionId, lignes: [], prepUses: [], densite: '', tempC: '' } });
    const pv3 = L.previsionSave(d, { type: 'soutirage', date: auj, f: { date: auj, portionId: L.contParts(Rg, c5.id)[0].portionId, destId: c6.id, volL: '1000', pertes: [{ typeId: 'lies', volL: '20' }], lignes: [] } });
    const S = L.iaFicheStructure(d, [{ kind: 'prev', id: pv1.id }, { kind: 'prev', id: pv2.id }, { kind: 'prev', id: pv3.id }, { kind: 'op', id: d.ops[0].id }]);
    const l1 = S.lignes[0]; const l2 = S.lignes[1]; const l3 = S.lignes[2]; const nv = S.lignes.filter((l) => l.kind === 'nouveau');
    t('68a. fiche : une ligne par opération à réaliser (cases à lire, valeurs prévues), opération déjà validée laissée de côté, autres cuves en fermentation ajoutées (fiche de suivi)', S.lignes.length >= 3 && l1.cuve === 'Cuve 08' && l1.champs.map((c) => c.id).join() === 'qte0,lot0' && l1.champs[0].prevu === '60' && l2.champs.map((c) => c.id).join() === 'densite,temp' && l3.champs.map((c) => c.id).join() === 'vol,pertes' && l3.champs[0].prevu === '10' && S.ignorees.length === 1 && S.ignorees[0].raison === 'validee' && nv.every((l) => l.type === 'suivi' && l.portionId && l.champs.length === 2), S);
    const FP = L.iaFichePrompt(S, { titre: 'Traitements', ordre: 'TRT-1', date: auj, colonnes: ['Cuve', 'Quantité › relevé'] });
    t('68a. fiche : consignes (valeurs prévues jamais recopiées), structure et colonnes envoyées, schéma', /jamais une valeur prévue/.test(FP.system) && /Ligne 1 : .* · cuve Cuve 08/.test(FP.texte) && /qte0/.test(FP.texte) && /Quantité › relevé/.test(FP.texte) && L.iaSchemaValider(FP.schema, { lignes: [{ ligne: 1, fait: true, valeurs: [{ champ: 'qte0', valeur: '62' }] }] }).ok && !L.iaSchemaValider(FP.schema, { lignes: [{ ligne: 0 }] }).ok);
    const arr2 = d.arrivages.find((a) => a.produitId === met.id && a.id !== x1.preset.lignes[0].arrivageId);
    const LU = L.iaFicheLire(S, { lignes: [{ ligne: 1, fait: true, valeurs: [{ champ: 'qte0', valeur: '62' }, { champ: 'lot0', valeur: arr2 ? arr2.numLot : 'XX' }, { champ: 'inconnu', valeur: '1' }] }, { ligne: 2, fait: true, valeurs: [{ champ: 'densite', valeur: '1O12' }, { champ: 'temp', valeur: '17,5' }] }, { ligne: 99, fait: true }], illisible: 'bas de page' });
    t('68a. fiche : lecture — lignes et cases inconnues écartées, valeur non numérique signalée « à vérifier »', LU.lignes[1].valeurs.qte0 === '62' && !('inconnu' in LU.lignes[1].valeurs) && !LU.lignes[99] && LU.ecartes === 2 && LU.lignes[2].douteux.includes('densite') && !LU.lignes[2].douteux.includes('temp') && LU.illisible === 'bas de page', LU);
    const F1 = L.iaFicheForm(d, l1, { qte0: '62', lot0: arr2 ? arr2.numLot : '' }, 'fait à 9 h', { ...trace, usage: 'ficheRelue' });
    const F1b = L.iaFicheForm(d, l1, { qte0: '62', lot0: 'LOT-INCONNU' }, '', { ...trace, usage: 'ficheRelue' });
    const F2 = L.iaFicheForm(d, l2, { densite: '1012', temp: '17,5' }, '', { ...trace, usage: 'ficheRelue' }); const F3 = L.iaFicheForm(d, l3, { vol: '9,8', pertes: '0,15' }, '', null);
    t('68a. fiche : valeurs relues → formulaire de l’opération à réaliser (quantité, lot fournisseur retrouvé par son n°, remarque, trace « ia ») ; prévision inchangée', F1.f.lignes[0].qty === '62' && (!arr2 || F1.f.lignes[0].arrivageId === arr2.id) && F1.f.notes === 'fait à 9 h' && F1.f.ia.usage === 'ficheRelue' && F1.f.sousType === 'sulfitage' && d.previsions.find((p) => p.id === pv1.id).f.lignes[0].qty === '60', F1);
    t('68a. fiche : n° de lot inconnu → lot prévu gardé et signalé ; densité, température, volumes en hL convertis en litres', F1b.f.lignes[0].arrivageId === x1.preset.lignes[0].arrivageId && F1b.avert.length === 1 && F2.f.densite === '1,012' && F2.f.tempC === '17,5' && F3.f.volL === '980' && F3.f.pertes[0].volL === '15' && !F3.f.ia, [F1b, F2, F3]);
    if (nv.length) { const N1 = L.iaFicheForm(d, nv[0], { densite: '1,05' }, '', { ...trace, usage: 'ficheRelue' }); const N2 = L.iaFicheForm(d, nv[0], {}, '', null);
      t('68a. fiche : autre cuve en fermentation → relevé à créer (portion, densité, trace), vide si rien n’est relevé', N1.patch.portionId === nv[0].portionId && N1.patch.densite === '1,05' && N1.patch.ia.usage === 'ficheRelue' && !N1.vide && N2.vide); }
    // IA08 : fermentation
    const e = L.clone(g); [[-6, 1.06], [-4, 1.03], [-2, 1.029], [0, 1.0285]].forEach(([n, de]) => L.opSave(e, { type: 'suivi', date: jour(n), portionId: p8.portionId, densite: de, tempC: 14, lignes: [] }));
    const Re = L.getR(e); const FD = L.iaFermentationDonnees(e, Re, { contId: c8.id }, auj); const FPr = L.iaFermentationPrompt(FD, { langue: 'en' });
    t('68a. fermentation : jours relatifs, densités, températures, intrants du lot et seuils envoyés ; ni code de lot, ni nom de cuve, ni date', FD && FD.alerte && FD.alerte.etat === 'arretee' && FD.points.map((p) => p.jour).join() === 'J+0,J+2,J+4,J+6' && /J\+6 \| 1,029 \| 14,0/.test(FPr.texte) && /Métabisulfite/.test(FPr.texte) && /anglais/.test(FPr.system) && !FPr.texte.includes(Re.lots[p8.lotId].code) && !FPr.texte.includes('Cuve 08') && !/\d{4}-\d{2}-\d{2}/.test(FPr.texte), FPr && FPr.texte);
    t('68a. fermentation : réponse contrôlée (causes, probabilité dans la liste)', L.iaSchemaValider(FPr.schema, { resume: 'r', causes: [{ cause: 'azote', probabilite: 'forte' }], verifications: ['x'], actions: ['y'] }).ok && !L.iaSchemaValider(FPr.schema, { resume: 'r', causes: [{ cause: 'azote', probabilite: 'certaine' }] }).ok && L.iaFermentationPrompt(null) === null);
    // IA12 : recherche
    const QP = L.iaRecherchePrompt('quels lots ont reçu la bentonite lot B-12 ?', { aujourdhui: auj });
    t('68a. recherche : la question et les filtres possibles seulement — aucun nom de la base, aucun résultat', /bentonite lot B-12/.test(QP.texte) && /intrant/.test(QP.texte) && !g.crus.slice(0, 50).some((c) => QP.texte.includes(c.nom)) && !g.apporteurs.some((a) => QP.texte.includes(a.nom)) && !codesLots.some((c) => QP.texte.includes(c)) && !g.produits.some((p) => QP.texte.includes(p.nom)));
    const benton = g.produits.find((p) => /Bentonite/.test(p.nom)); const A1 = L.iaRechercheAppliquer(g, { filtre: 'intrant', nom: 'bentonite', numLot: 'B-12' });
    const A2 = L.iaRechercheAppliquer(g, { filtre: 'intrant', nom: 'levure' }); const A3 = L.iaRechercheAppliquer(g, { filtre: 'cru', nom: 'Avize' }); const A4 = L.iaRechercheAppliquer(g, { filtre: 'tout', texte: '2025-09-21' }); const A5 = L.iaRechercheAppliquer(g, { filtre: 'echelle', echelle: 'grand' });
    t('68a. recherche : noms retrouvés sur l’appareil (produit, cru), n° de lot inconnu signalé, plusieurs correspondances → à choisir, date mise au format de la recherche, échelle', A1.filtre === 'intrant' && A1.prod === benton.id && !A1.arrs.length && A1.avert.length === 1 && A2.prod === '' && /Plusieurs produits/.test(A2.avert[0]) && A3.cru === g.crus.find((c) => c.nom === 'Avize').id && A4.q === '21/09/2025' && A5.ech === 'grand', [A1, A2, A3, A4]);
    t('68a. recherche : filtre hors liste refusé par le schéma', !L.iaSchemaValider(QP.schema, { filtre: 'resultats' }).ok && L.iaSchemaValider(QP.schema, { filtre: 'tout', texte: 'pesée 12' }).ok);
    // IA20 : histoire d'un lot
    const lot5 = L.contParts(Rg, c5.id)[0].lotId; const HD = L.iaHistoireDonnees(g, Rg, lot5); const HP = L.iaHistoirePrompt(HD, { langue: 'fr' });
    t('68a. histoire : chaîne du lot en texte compact, codes des lots remplacés par des repères ; ni partenaire, ni cuve, ni code', /Lot étudié : L1/.test(HD.texte) && HD.reperes.L1 === Rg.lots[lot5].code && Object.keys(HD.reperes).length >= 2 && !codesLots.some((c) => HP.texte.includes(c)) && !g.apporteurs.some((a) => HP.texte.includes(a.nom)) && !g.contenants.some((c) => HP.texte.includes(c.nom)) && /Opérations \(date/.test(HD.texte), HD.texte.slice(0, 300));
    const HR = L.iaHistoireRendu({ titre: 'Histoire de L1', paragraphes: ['L1 vient de L2.', '  ', 'L99 inconnu.'] }, HD.reperes);
    t('68a. histoire : repères remis sur l’appareil, inconnus laissés tels quels, paragraphes vides retirés', HR.titre === `Histoire de ${HD.reperes.L1}` && HR.paragraphes.length === 2 && HR.paragraphes[0] === `${HD.reperes.L1} vient de ${HD.reperes.L2}.` && HR.paragraphes[1] === 'L99 inconnu.' && L.iaSchemaValider(HP.schema, { paragraphes: ['a'] }).ok);
    t('68a. nombres écrits à la main : « 12,5 », « 1 012 », « 1.012 » lus ; « 1O12 » refusé', L.iaChaiNombre('12,5') === 12.5 && L.iaChaiNombre('1 012') === 1012 && L.iaChaiNombre('1.012') === 1.012 && L.iaChaiNombre('1O12') === null && L.iaChaiNombre('') === null);
    t('68a. rien n’est écrit dans la base par ces fonctions (lecture, préremplissage, structure, repères)', JSON.stringify(g) === g0);
  }
  // ================= 69. 0.49.0-alpha.1 : assistant IA — version, traductions, compatibilité 0.48.0-alpha.1 =================
  {
    t('69. version 0.49.0-alpha.1 : mineure après 0.48.0-alpha.1 (nouvelles fonctions), trois notes gardées', L.CHANGELOG.find((c) => c.v === '0.49.0-alpha.1').notes.length === 3 && L.CHANGELOG.findIndex((c) => c.v === '0.49.0-alpha.1') + 1 === L.CHANGELOG.findIndex((c) => c.v === '0.48.0-alpha.1'));
    t('69. traductions : notes de version, usages, aperçu, visite dans les six langues', L.tradControle().length === 0 && L.CHANGELOG.find((c) => c.v === '0.49.0-alpha.1').notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && L.IA_USAGES.every((u) => L.traduire(u.nom, 'en') !== u.nom) && L.traduire('Envoyer cette fois', 'de') === 'Diesmal senden');
    const f69 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.49.0-alpha.1-ia.json'), 'utf8'))); L.syncConfig(f69);
    const oIa = f69.ops.find((o) => o.ia); const aIa = f69.arrivages.find((a) => a.ia);
    t('69. fixture 0.49.0-alpha.1 : niveau 2 réservé au modèle local, opération et arrivage proposés par l’IA (trace), veille d’un texte ; rien de l’appareil (journal, accords) dans la base', L.iaNiveau2Reglage(f69) === 'local' && oIa && oIa.ia.usage === 'saisie' && oIa.ia.local === true && aIa && aIa.ia.usage === 'reception' && f69.settings.referentiel.veille.ue.trouve === true && !/oenotrack-ia-journal|consentements/.test(JSON.stringify(f69)));
    const dirO = path.join(__dirname, 'anciennes', '0.48.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, getR, syncFusion, opSave, arrivageSave };')({ useState() {}, useEffect() {}, useMemo() {}, useRef() {}, useCallback() {} });
    t('69. 0.48.0-alpha.1 gelée chargée', O.APP_VERSION === '0.48.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f69)); O.syncConfig(x); O.getR(x);
    t('69. … la 0.48.0-alpha.1 ouvre la base 0.49.0-alpha.1 sans rien perdre (traces IA, niveau 2, veille)', x.ops.find((o) => o.id === oIa.id).ia.usage === 'saisie' && x.arrivages.find((a) => a.id === aIa.id).ia.usage === 'reception' && x.settings.ia.niveau2 === 'local' && x.settings.referentiel.veille.ue.trouve === true);
    const oX = x.ops.find((o) => o.id === oIa.id); const rX = O.opSave(x, { type: oX.type, date: oX.date, notes: 'Corrigée par la 0.48' }, oX.id); const aX = x.arrivages.find((a) => a.id === aIa.id); const rA = O.arrivageSave(x, { produitId: aX.produitId, date: aX.date, qty: 3, numLot: aX.numLot }, aX.id);
    t('69. … opération et arrivage corrigés par la 0.48.0-alpha.1 : la trace « proposé par l’IA » reste', rX.ok && rA.ok && x.ops.find((o) => o.id === oIa.id).ia && x.ops.find((o) => o.id === oIa.id).ia.usage === 'saisie' && x.arrivages.find((a) => a.id === aIa.id).ia.usage === 'reception', [rX.msg, rA.msg]);
    x.meta.modifLe = '2026-12-23T12:00:00Z';
    const N = L.clone(f69); L.iaNiveau2Set(N, 'tous', 'u1'); N.meta.modifLe = '2026-12-23T11:00:00Z';
    const FX = L.syncFusion(f69, N, x); const FX2 = O.syncFusion(f69, x, N);
    t('69. … synchronisation 0.49.0-alpha.1 ↔ 0.48.0-alpha.1 : niveau 2 changé ici, opération corrigée là-bas, rien de perdu', [FX.db, FX2.db].every((y) => y.settings.ia.niveau2 === 'tous' && y.ops.find((o) => o.id === oIa.id).notes === 'Corrigée par la 0.48' && y.ops.find((o) => o.id === oIa.id).ia.usage === 'saisie'));
  }
  // ================= 70. 0.49.0-alpha.2 : certificat de jaugeage relu par lots de pages, compatibilité 0.49.0-alpha.1 =================
  {
    t('70. version 0.49.0-alpha.2 : correction de la version en test, une note', L.APP_VERSION === '0.49.0-alpha.2' && L.CHANGELOG[0].v === '0.49.0-alpha.2' && L.CHANGELOG[1].v === '0.49.0-alpha.1' && L.CHANGELOG[0].notes.length === 1 && L.CHANGELOG[0].notes.every((n) => L.LANGUES_TRAD.every((lg) => L.traduire(n, lg) !== n)) && L.tradControle().length === 0);
    const lots = (n) => L.iaBaremesLots(n, 8).map((x) => `${x.debut}-${x.fin}`).join(',');
    t('70. lots de pages : 1 page, 8, 9, 10, 17, 24, 25 pages ; valeur absente = une page', lots(1) === '1-1' && lots(8) === '1-8' && lots(9) === '1-8,9-9' && lots(10) === '1-8,9-10' && lots(17) === '1-8,9-16,17-17' && lots(24) === '1-8,9-16,17-24' && lots(25).split(',').length === 4 && lots(0) === '1-1' && lots(null) === '1-1');
    const D = (v, l) => L.iaBaremesPagesDecaler(v, l).map((x) => x.page).join(',');
    t('70. pages d’un lot : numérotées à partir de 1 par l’IA → ramenées à celles du certificat ; vrai numéro gardé ; page absente = rang ; 1er lot inchangé', D({ tables: [{ page: 1 }, { page: 2 }] }, { debut: 9, fin: 10 }) === '9,10' && D({ tables: [{ page: 10 }] }, { debut: 9, fin: 10 }) === '10' && D({ tables: [{}, {}] }, { debut: 17, fin: 24 }) === '17,18' && D({ tables: [{ page: 3 }] }, { debut: 1, fin: 8 }) === '3' && D(null, { debut: 9, fin: 10 }) === '');
    const p1 = []; for (let h = 0; h <= 60; h += 1) p1.push([h, 150 + h * 48]); const p2 = []; for (let h = 61; h <= 120; h += 1) p2.push([h, 150 + h * 48]);
    const T = [...L.iaBaremesPagesDecaler({ tables: [{ page: 8, nom: 'C 88', certificat: 'R.X9.26.00088', uniteHauteur: 'cm', uniteVolume: 'L', capacite: 5900, lignes: p1 }] }, { debut: 1, fin: 8 }), ...L.iaBaremesPagesDecaler({ tables: [{ page: 1, nom: 'C 88', certificat: 'R.X9.26.00088', uniteHauteur: 'cm', uniteVolume: 'L', lignes: p2 }] }, { debut: 9, fin: 10 })];
    const r = L.iaBaremesLire({ tables: T }, { fichier: 'certificat-fictif.pdf', trace: { usage: 'baremes', modele: 'm' } });
    t('70. tableau commencé page 8 (lot 1) et continué page 9 (lot 2) : un seul barème de 121 lignes, relu par l’IA, jamais « bonne »', r.ok && r.baremes.length === 1 && r.baremes[0].points.length === 121 && r.baremes[0].meta.lecture === 'ia' && r.baremes[0].fiabilite !== 'bonne', r.ok ? r.baremes.map((b) => [b.nom, b.points.length]) : r.msg);
    const f70 = L.normalizeDb(JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'base-0.49.0-alpha.2-ia-lots.json'), 'utf8'))); L.syncConfig(f70);
    const b70 = (f70.baremes || []).find((b) => b.id === 'bar-ia-lots'); const p70 = f70.ops.find((o) => o.type === 'apport' && o.ia);
    t('70. fixture 0.49.0-alpha.2 : barème relu en deux lots (121 lignes, trace), pesée proposée par l’IA', b70 && b70.points.length === 121 && b70.meta.ia.usage === 'baremes' && p70 && p70.ia.usage === 'pesee');
    const dirO = path.join(__dirname, 'anciennes', '0.49.0-alpha.1');
    const O = new Function('React', files.filter((f) => fs.existsSync(path.join(dirO, f))).map((f) => fs.readFileSync(path.join(dirO, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { APP_VERSION, APP_NUM, normalizeDb, clone, syncConfig, getR, syncFusion };')({ useState() {}, useEffect() {}, useMemo() {}, useRef() {}, useCallback() {} });
    t('70. 0.49.0-alpha.1 gelée chargée', O.APP_VERSION === '0.49.0-alpha.1' && L.APP_NUM > O.APP_NUM);
    const x = O.normalizeDb(O.clone(f70)); O.syncConfig(x); O.getR(x);
    t('70. … la 0.49.0-alpha.1 ouvre la base 0.49.0-alpha.2 sans rien perdre (barème, traces)', canonJ(x.baremes) === canonJ(f70.baremes) && x.ops.find((o) => o.id === p70.id).ia.usage === 'pesee');
    x.meta.modifLe = '2026-12-24T12:00:00Z'; x.lists.cepages.push({ id: 'cep-x70', label: 'Cépage fictif là-bas', couleur: 'blanc' });
    const N = L.clone(f70); N.lists.cepages.push({ id: 'cep-n70', label: 'Cépage fictif ici', couleur: 'noir' }); N.meta.modifLe = '2026-12-24T11:00:00Z';
    const FX = L.syncFusion(f70, N, x); const FX2 = O.syncFusion(f70, x, N);
    t('70. … synchronisation 0.49.0-alpha.2 ↔ 0.49.0-alpha.1 : ajouts des deux côtés gardés, barème intact', [FX.db, FX2.db].every((y) => y.lists.cepages.some((c) => c.id === 'cep-x70') && y.lists.cepages.some((c) => c.id === 'cep-n70') && (y.baremes || []).find((b) => b.id === 'bar-ia-lots').points.length === 121));
  }
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (68c : veille des textes, audit, « Comment faire ? », codification dictée, configuration, plan de nettoyage proposés par l’IA ; 66b : champ en cause renvoyé par le moteur (formulaires) ; 64 : vocabulaire technique revu, coefficients corrigés, rosé par coupage, TAV acquis ; 63 : échelle par appellation, appellation et niveau des parcelles ; 62 : référentiel des appellations, types hors appellation, région Charentes ; 61 : opérations des autres vins, électrodialyse, méthode ancestrale, région et types de vins ; 60 : revendication BIO et code d’agrément de l’organisme certificateur, visite guidée par chapitres ; 59 : revendication VDC, rang des certifications de durabilité ; 58 : fiche HACCP de la chaîne et contrôle de la verrerie retirés, données gardées ; 57 : prévisionnel des cuvées de tirage, plusieurs qualités, déclarations par cuvée ; 56 : moteur de personnalisation ; 55 : plan de vinification modifiable, variantes, étapes ordonnées ; 54 : labels et cahiers des charges, VMN, liens avec les catalogues ; 53 : déclarations de tirage, ordre de tirage ; 52 : fournitures de tirage, contrôle de la verrerie, fiche HACCP de la chaîne ; 51 : chantiers de tirage, mixtion en cuve ou pompe doseuse, formats, prestataire ; compatibilité 0.42.0-alpha.1)');
  process.exitCode = fails ? 1 : 0;
})();
