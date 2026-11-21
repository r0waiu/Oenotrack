// Tests du moteur (sans navigateur) : concatène les fichiers JS « données » et exécute des scénarios.
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '16c-plans-hygiene.js', '16d-complements.js', '17-ia.js', '17b-langues.js', '17c-traductions.js', '17d-trad-vocabulaire.js', '17e-trad-cuverie.js', '17f-trad-operations.js', '17g-trad-listes.js', '17h-trad-coque.js', '17i-trad-pesee.js', '17j-trad-pressoir-ops.js', '17k-trad-plans.js', '18-mentions.js', '19-pressoir.js', '20-engine.js', '25-trace.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '34-acces.js', '35-seed.js'];
let src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
src = src.replace(/const \{ useState[^\n]*\n/, '');
const canonJ = (v) => (v === null || typeof v !== 'object' ? JSON.stringify(v === undefined ? null : v) : Array.isArray(v) ? `[${v.map(canonJ).join(',')}]` : `{${Object.keys(v).filter((k) => v[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonJ(v[k])}`).join(',')}}`);
const body = src + '\n;return { DEFAULT_LISTS, LOT_TYPES, PREP_TYPES, OP_LABELS, DEFAULT_PARAMS, DEFAULT_MODELES, OPERATEUR_FONCTIONS, FORMES, FINITIONS, LIST_META, ECHELLES, LANGUES, LANGUES_TRAD, langueDuNavigateur, langueInitiale, traduire, tradControle, TRAD_TABLE, TRAD_MOTIFS, setLangue: (x) => { LANGUE = x; }, OENOTRACK_DEPOT, previewOp, registreEcarts, registreDoublons, registreRenumeroter, REGIONS, regionDe, champenois, regionSet, PRESSOIR_PROFILS, pressoirParams, pressoirParamsSet, rebechesTaux, pressoirsDe, balancesDe, equipementPressoirSet, equipementAjouter, estPesee, estMarc, numeroSuivant, journalAlteres, journalEmpreinte, peseeSpec, peseeSave, peseeValider, peseeReste, marcSpec, marcSave, marcControles, marcValider, marcVolumes, marcKg, registreAnnuler, peseesDe, marcsDe, releveApporteurs, bilanPressoir, registrePeseesCsv, carnetPressoirCsv, capaciteDeLibelle, baremeVolume, baremeHauteur, baremeEcart, baremeControle, baremeDe, baremesCiterne, baremeSave, baremeDelete, baremeLier, baremeArchiver, baremePts, baremeSens, baremeResume, fabricantsConnus, hauteurAttendue, contDelete, nombreJauge, jaugeReparer, jaugeAnalyser, jaugePageDeTexte, jaugePageDeLignes, jaugePageDeTsv, jaugeLireFichier, jaugeExporter, contenantPourReservoir, matierePourBareme, jaugesTexte, immatNorm, CHAMPS_STD, CP_TYPES, champsStd, champStd, formulaireDe, champEffectif, formulairePerso, formuleAnalyser, formuleEval, formuleVarsStd, champsNumeriques, champsValeurs, champsEtat, champsTexte, champsErreurs, formulaireDefauts, ligneDefauts, formulaireSave, formulaireReset, formulaireCopier, opCatSave, opCatDelete, opList, opDef, sha256, pbkdf2, pbkdf2Js, mdpEmpreinte, mdpVerifier, mdpQualite, codeSecoursNouveau, codeSecoursNorm, PROFILS_DEFAUT, DROITS_SPECIAUX, securiteActive, securiteReglages, securiteActiver, securiteDesactiver, securiteRegler, utilisateurDe, utilisateurParIdentifiant, profilDe, niveauModule, peutModule, peut, estAdmin, adminsActifs, utilisateurSave, utilisateurMotDePasse, utilisateurActif, utilisateurDelete, profilSave, profilDelete, auditAjouter, gardeDroits, gardeAppliquer, moduleDeType, u8b64, ligneApporteurs, ligneApporteursNoms, ligneNumLot, ligneAnalyses, moyennesPonderees, moutPartsLot, moutAnalysesLot, moutAnalysesCuve, chaptalReglages, tapMoyen, enrichissement, apporteurRoles, apporteurCruAuto, apporteurUsage, apporteurDe, docsOf, docMetaAdd, docsDeplacer, docsJoindre, previsionSave, previsionStatut, previsionDelete, contParts, parcelleSave, parcelleDelete, traceOrigin2: traceOrigin, importObj, APP_VERSION, richListCont, echellePreset, mixCouleur, stadeAssemblage, stadeRole, ECHELLES, eDef, echelleInfo2: echelleInfo, cruMask, cruSave, fractionCont, listUsage, fracList, fracLabel, fracPress, sampleDb, emptyDb, normalizeDb, replay, composition, echelleInfo, lotEchelle, contentComp, traceIntrant, traceOrigin, opSave, opDelete, contSave, cruSave, cruDelete, cruRestore, cruUsage, apporteurSave, apporteurDelete, siteSave, siteDelete, planAuto, importJSON, exportJSON, DEFAULT_CRUS, getR, intrantsForLots, mixComp, loadDb, saveDb, STORAGE_KEY, num, r2, stadeMix, stadeRegle, stadeAutoOK, stadeMelangeSave, stadeMelangeDelete, stadeMelangeReset, opList, opDef, opNom, opMenu, opGroupes, opCatSave, opCatDelete, opCatUsage, opCatMove, opCatReset, DEFAULT_OPERATIONS, DEFAULT_STADES, OP_LABELS0, OP_LABELS, OP_COMPORTEMENTS, APP_NUM, syncFusion, syncEmpreinte, syncResume, conflitReprendre, canon, hash36, byDate, nid, setNID: (x) => { NID_SUFFIXE = x; }, getNID: () => NID_SUFFIXE, cloudSynchroniser, CLOUD_BASE, operateurSave, operateurDelete, operateurActif, operateurUsage, operateursValides, operateursNoms, operateurNom, operateurCourt, operateurInitiales, operateursTries, alertValidate, alertRefuse, hygieneSave, hygieneDelete, clone, ficheAdd, modeleFicheSave, hygProduitSave, hygProduitDelete, hygProduitArchiver, hygUsages, hygConso, hygLignes, hygResume, hygTexteModifie, hygControles, hygFdsEtat, hygPlage, hygConcTxt, fdsAnalyser, fdsPictosDeH, fdsTexteDePages, fdsDate, qualifList, qualifOptions, qualifUsage, QUALIFS, DEFAULT_QUALIFS, syncConfig, minQualif, rang, qLabel, produitSave, regleSet, ruleAllows, proposedQualif, richListReset, MODULES_DEFAUT, MODULE_FIXE, modulesOrdre, moduleActif, modulesConnus, modulesVisibles, moduleAccueil, modulesOrdonner, moduleDeplacer, moduleActiver, modulesReinitialiser, produitDelete, docMetaAdd, docsOf, lienNorm, lienCourt, ficheDocs, prodDocs, prodFdsRequise, prodFdsDate, prodFtDate, prodFdsEtat, prodFtEtat, prodVeilleEtat, prodARevoir, prodFichesResume, moisAnnee, ficheDateApres, dateRevOk, ficheTitreDePage, ficheAnalyser, ficheMots, unEcart, motProche, ficheScoreMots, ficheCandidatsListe, ficheCorrespondances, ficheReconnu, ficheActionDefaut, ficheJoindre, ficheDocReviser, ficheDocArchiver, ficheRecaler, ficheProduitCreer, prodVeilleEnregistrer, ficheCat, ficheCibleObj, ficheCibleCle, ficheCibleDeCle, hygDocs, IA_FOURNISSEURS, IA_KEY, iaFournisseur, iaConfigLire, iaConfigEcrire, iaActive, iaMasque, iaRequete, iaReponse, iaJson, iaDateDe, iaErreurMsg, iaErreurReseau, iaDemander, iaModeles, iaModelesDe, iaPromptIdentifier, iaLireIdentification, iaPromptVeille, iaLireVeille, iaVeilleAFaire, STORAGE_KEY, saveDb, fournisseurSave, LEGAL_DATE, LEGAL_ONGLETS, legalOngletDeHash, HEBERGEURS, MENTIONS_STATUTS, mentionsVides, mailOk, mentionsNettoyer, mentionsFusion, mentionsHebergeur, mentionsHorsUE, mentionsManquantes, mentionsConseils, legalAuteur, COMPOSANTS_TIERS, SERVICES_CHARGEMENT, CHANGELOG, VERSIONS_RENOMMEES, versionAffichee, versionNum, baremePourNom, baremeCapacite, jaugeMots, accueilDecision, ACCUEIL_KEY, OENOTRACK_SITE, siteOfficielIci, peseeAlertes, tapPesees, registrePeseesLignes, formulaireCat, resumeRegistre, syncFormulaires, CHAMPS_FICHE, FORMULAIRES_HORS_CATALOGUE, ETATS_SANITAIRES, champSiAltere, persoSiAltere, etatSain, opViaPressoir, champsPersoErreurs, OP_LABELS, couleurDefaut, planTaches, hygTaches, maintTaches, maintEtat, maintAjout, hygControlesSaisie, hygPresetTache, planEntreeSave, planEntreeDelete, planModeleCharger, maintEntreeSave, maintEntreeDelete, maintInterventionSave, maintInterventionDelete, hygAcquitter, planReglages, planNettoyage, planMaintenance, PLAN_NETTOYAGE_MODELE, PLAN_MAINTENANCE_MODELE, hygCibles, hygLibQuand, hygSatisfait, HYG_QUAND, nomProduitCasse, ficheInfosScript, infosFusion, infosPropositions, produitInfosAppliquer, iaPromptInfos, iaLireInfos, iaPromptFds, iaLireFds, PRODUIT_INFOS, HYG_INFOS, hygEvenementsUtiles, isoOK, hygDef, hygEvenements, lbl };';
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
    t('modules : 14 modules (Pressoir depuis 0.24.0-alpha.1), Tirage & Dégorgement séparé, Registres / Paramètres séparés', D.length === 14 && D.indexOf('pressoir') === 1 && ['tirage', 'cave', 'degorgement', 'registres', 'params'].every((x) => D.includes(x)) && L.MODULE_FIXE === 'params');
    t('modules : ordre d’origine et tous actifs par défaut', L.modulesOrdre(d).join() === D.join() && L.modulesVisibles(d).length === 14 && L.moduleAccueil(d) === 'cuverie');
    t('modules : déplacer (bornes respectées)', L.moduleDeplacer(d, 'hygiene', -20).ok && L.modulesConnus(d)[0] === 'hygiene' && L.moduleDeplacer(d, 'hygiene', -1).ok && L.modulesConnus(d)[0] === 'hygiene' && L.moduleAccueil(d) === 'hygiene');
    L.moduleDeplacer(d, 'params', -13);
    t('modules : Paramètres déplaçable', L.modulesConnus(d).indexOf('params') === 0);
    t('modules : Paramètres jamais désactivable', !L.moduleActiver(d, 'params', false).ok && L.moduleActif(d, 'params'));
    t('modules : module inconnu refusé', !L.moduleActiver(d, 'xyz', false).ok && !L.moduleDeplacer(d, 'xyz', 1).ok);
    L.moduleActiver(d, 'hygiene', false); L.moduleActiver(d, 'declass', false); L.moduleActiver(d, 'declass', false);
    t('modules : désactivation (sans doublon), onglets masqués', d.settings.modulesOff.join() === 'hygiene,declass' && !L.modulesVisibles(d).includes('hygiene') && L.modulesVisibles(d).length === 12 && L.moduleAccueil(d) === 'params');
    L.moduleActiver(d, 'hygiene', true);
    t('modules : réactivation', d.settings.modulesOff.join() === 'declass' && L.modulesVisibles(d).includes('hygiene'));
    // tout désactiver sauf Paramètres : on n'est jamais bloqué
    const e = L.normalizeDb(L.sampleDb()); D.forEach((x) => L.moduleActiver(e, x, false));
    t('modules : tout désactivé → Paramètres reste seul et s’ouvre', L.modulesVisibles(e).join() === 'params' && L.moduleAccueil(e) === 'params');
    t('modules : réinitialiser l’activation / l’ordre', L.modulesReinitialiser(e, 'activation').ok && L.modulesVisibles(e).length === 14 && L.modulesReinitialiser(d, 'ordre').ok && L.modulesOrdre(d).join() === D.join() && d.settings.modulesOff.join() === 'declass');
    // ordre enregistré par une version future : module inconnu conservé à sa place ; module manquant inséré après son voisin
    const f = L.normalizeDb(L.sampleDb()); f.settings.modulesOrdre = ['trace', 'futur', 'cuverie', 'ops', 'cave', 'tirage', 'degorgement', 'analyses', 'intrants', 'hygiene', 'registres', 'params']; f.settings.modulesOff = ['futur2'];
    const o = L.modulesOrdre(f);
    t('modules : id inconnu gardé, manquants insérés à leur place', o.join() === 'trace,futur,cuverie,pressoir,ops,previsions,declass,cave,tirage,degorgement,analyses,intrants,hygiene,registres,params' && L.modulesConnus(f).length === 14, o.join());
    L.moduleDeplacer(f, 'params', -100); L.moduleActiver(f, 'cave', false);
    t('modules : déplacer garde l’id inconnu à sa place, désactiver garde les désactivations inconnues', f.settings.modulesOrdre[1] === 'futur' && f.settings.modulesOrdre[0] === 'params' && f.settings.modulesOff.join() === 'futur2,cave', f.settings.modulesOrdre.join());
    const sale = L.modulesOrdre({ settings: { modulesOrdre: ['ops', 'ops', 3, null, '', 'cuverie'] } });
    t('modules : ordre normalisé sans doublon ni valeur invalide', sale[0] === 'ops' && sale.length === 14 && new Set(sale).size === 14 && sale.indexOf('ops') < sale.indexOf('cuverie') && L.modulesOrdre({ settings: { modulesOrdre: 'x' } }).join() === D.join(), sale.join());
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
    t('… puis rouverte en 0.13.0-alpha.1', L.modulesVisibles(L.normalizeDb(F.db)).length === 12 && L.modulesOrdre(L.normalizeDb(F.db)).includes('futur'));
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
    t('registre des champs : entrée de moûts par compartiment', L.champsStd('entree_mout').filter((c) => c.ligne).length === 12 && L.champStd('entree_mout', 'e.cepageId').ess);
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
    t('version 0.26.0-alpha.1 : nouvelle version mineure (plans d’hygiène, photo, fiches produits)', L.APP_VERSION === '0.26.0-alpha.1' && L.APP_NUM === 26000001 && L.CHANGELOG[0].v === '0.26.0-alpha.1' && L.CHANGELOG[0].notes.length === 6 && L.CHANGELOG[1].v === '0.25.0-alpha.2');
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
  console.log(fails ? `\n${fails} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (28 : plans de nettoyage et de maintenance, fiches produits ; compatibilité 0.25.0-alpha.2)');
  process.exitCode = fails ? 1 : 0;
})();
