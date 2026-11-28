/* ============ PERSONNALISATION GUIDÉE (0.43.0-alpha.3) : questionnaire de configuration, basique ou avancé ============
   À la toute première ouverture (après la page de présentation) ou depuis Paramètres : quelques questions sur l'exploitation, ses vins,
   ses revendications, son chai et son équipe ; les réponses deviennent un plan de changements (aperçu), appliqué en une fois.
   Rien n'est jamais supprimé : on affiche ou masque des onglets, on ajoute des revendications, des opérateurs, une campagne, on règle
   des valeurs ; une revendication déjà utilisée n'est jamais masquée. Le mot de passe du premier administrateur ne passe pas par ici
   (empreinte calculée par l'interface, securiteActiver). settings.personnalisation = { mode, reponses (sans compte), le, par, version }. */

const PERSO_MODES = [{ id: 'basique', label: 'Basique' }, { id: 'avance', label: 'Avancé' }];
const PERSO_MODULES_NOMS = { pressoir: 'Pressoir', tirage: 'Tirages', cave: 'Cave', degorgement: 'Dégorgement', hygiene: 'Hygiène', equipements: 'Équipements', plan: 'Plan de vinification' };
const PERSO_SECTIONS = [['exploitation', 'Votre exploitation'], ['vins', 'Vos vins'], ['revendications', 'Revendications et labels'], ['chai', 'Cave et chai'], ['equipe', 'Équipe et accès'], ['donnees', 'Données et déclarations']];
const PERSO_REVENDICATIONS = [
  { id: 'conv', label: 'Conventionnel', court: 'CONV', couleur: '#5F7A8A', referentiels: [] },
  { id: 'bio', label: 'BIO', court: 'BIO', couleur: '#3E8E4E', referentiels: ['bio-ue'] },
  { id: 'dem', label: 'Demeter', court: 'DEM', couleur: '#8454B3', referentiels: ['demeter'] },
  { id: 'bdv', label: 'Biodyvin', court: 'BDV', couleur: '#6B8E3E', referentiels: ['biodyvin'] },
  { id: 'np', label: 'Nature & Progrès', court: 'N&P', couleur: '#4F8C77', referentiels: ['nature-progres'] },
  { id: 'vmn', label: 'Vin Méthode Nature', court: 'VMN', couleur: '#2F2F2F', referentiels: ['vmn'] },
  { id: 'hve', label: 'HVE', court: 'HVE', couleur: '#2E7DAF', referentiels: [], durable: true },
  { id: 'vdc', label: 'VDC', court: 'VDC', couleur: '#3C8D93', referentiels: [], durable: true }, /* 0.44.0-alpha.3 : Viticulture Durable en Champagne */
];
const PERSO_ONGLETS = [['vinification', 'Vinification (cuverie, opérations)'], ['pressoir', 'Pressoir'], ['previsions', 'À réaliser & fiches'], ['tirage', 'Tirages'], ['intrants', 'Intrants & Stocks'], ['trace', 'Traçabilité']];
const _persoMousse = (r) => (r.types || []).some((t) => t === 'effervescent' || t === 'ancestrale');
// questions : mode (basique ⊂ avancé), section, type (texte | choix | multi | oui_non | nombre | date | liste | compte), secondes (durée estimée),
// si (réponses, contexte) → la question s'applique ; requis ; options ; contexte { premiere : première ouverture (choix de la base) }
const PERSO_QUESTIONS = [
  { id: 'nom', mode: 'basique', section: 'exploitation', type: 'texte', texte: 'Nom de votre exploitation', aide: 'Il figure en tête des fiches, rapports et déclarations.', requis: true, secondes: 15 },
  { id: 'region', mode: 'basique', section: 'exploitation', type: 'choix', texte: 'Où se trouve votre vignoble ?', aide: 'Cépages, appellations, échelle des crus, pressurage et seuils réglementaires de la région.', options: () => PROFIL_REGIONS.map((r) => ({ id: r.id, label: r.nom })), requis: true, secondes: 10 },
  { id: 'statut', mode: 'basique', section: 'exploitation', type: 'choix', texte: 'Vous êtes…', options: () => [{ id: 'recoltant', label: 'Récoltant (vos raisins)' }, { id: 'cooperative', label: 'Coopérative' }, { id: 'negociant', label: 'Négociant (raisins, moûts ou vins achetés)' }], requis: true, secondes: 10 },
  { id: 'types', mode: 'basique', section: 'vins', type: 'multi', texte: 'Quels vins élaborez-vous ?', options: () => PROFIL_TYPES.map(([id, label]) => ({ id, label })), requis: true, secondes: 15 },
  { id: 'tirage', mode: 'basique', section: 'vins', type: 'choix', texte: 'Le tirage de vos effervescents se fait…', si: (r) => _persoMousse(r), options: () => [{ id: 'sur_place', label: 'Chez vous, avec votre matériel' }, { id: 'prestataire', label: 'Chez vous, par un prestataire de tirage' }, { id: 'aucun', label: 'Pas chez vous (vente de vins clairs, vins de base)' }], requis: true, secondes: 10 },
  { id: 'pressoir', mode: 'basique', section: 'chai', type: 'oui_non', texte: 'Pressurez-vous des raisins sur place ?', aide: 'Registre des pesées, carnet de pressoir, marcs.', secondes: 8 },
  { id: 'revendications', mode: 'basique', section: 'revendications', type: 'multi', texte: 'Sous quelles revendications produisez-vous ?', aide: 'Les règles d’intrants et les plafonds de chaque label s’appliquent d’office (à vérifier).', options: () => PERSO_REVENDICATIONS.map((q) => ({ id: q.id, label: q.label })), requis: true, secondes: 15 },
  { id: 'codeBio', mode: 'basique', section: 'revendications', type: 'texte', texte: 'Code d’agrément de votre organisme certificateur bio', aide: 'Il apparaîtra comme revendication à la place de « BIO » (ex. FR-BIO-01 pour Ecocert) ; la revendication reste du bio. Laissez vide pour afficher « BIO ».', si: (r) => Array.isArray(r.revendications) && r.revendications.includes('bio'), verifier: (v) => (codeAgrementValide(v) ? '' : 'Code d’agrément : pays, terme et numéro (ex. FR-BIO-01).'), secondes: 15 }, /* 0.45.0-alpha.1 */
  { id: 'hygiene', mode: 'basique', section: 'chai', type: 'oui_non', texte: 'Suivre l’hygiène (HACCP) : nettoyages, produits, plans ?', secondes: 8 },
  { id: 'acces', mode: 'basique', section: 'equipe', type: 'choix', texte: 'Qui utilisera Œnotrack ?', options: () => [{ id: 'seul', label: 'Moi seul, sur cet appareil' }, { id: 'equipe', label: 'Une équipe, chacun avec son identifiant' }], requis: true, secondes: 10 },
  { id: 'compte', mode: 'basique', section: 'equipe', type: 'compte', texte: 'Votre compte administrateur', aide: 'Identifiant et mot de passe (8 caractères au moins) ; un code de secours vous sera donné.', si: (r) => r.acces === 'equipe', requis: true, secondes: 45 },
  { id: 'donnees', mode: 'basique', section: 'donnees', type: 'choix', texte: 'Pour commencer…', si: (r, ctx) => !!(ctx && ctx.premiere), options: () => [{ id: 'vide', label: 'Partir d’une base vide, avec mes propres données' }, { id: 'exemple', label: 'Garder le jeu d’exemple pour découvrir' }], requis: true, secondes: 8 },
  // avancé
  { id: 'adresse', mode: 'avance', section: 'exploitation', type: 'texte', texte: 'Adresse du siège', secondes: 20 },
  { id: 'evv', mode: 'avance', section: 'donnees', type: 'texte', texte: 'N° EVV (CVI)', aide: 'Repris par la DRM et les déclarations de tirage.', secondes: 15 },
  { id: 'accise', mode: 'avance', section: 'donnees', type: 'texte', texte: 'N° d’accise (entrepositaire agréé)', aide: '13 caractères : 2 lettres puis 11 lettres ou chiffres (ex. FR012345E6789).', verifier: (v) => (typeof drmAcciseOk !== 'function' || drmAcciseOk(String(v).trim().toUpperCase()) ? '' : 'N° d’accise : 13 caractères (2 lettres puis 11 lettres ou chiffres).'), secondes: 15 },
  { id: 'civc', mode: 'avance', section: 'donnees', type: 'texte', texte: 'N° de ressortissant CIVC', si: (r) => r.region === 'champagne', secondes: 12 },
  { id: 'codeRecoltant', mode: 'avance', section: 'donnees', type: 'texte', texte: 'Code récoltant (déclaration préalable de tirage)', si: (r) => r.region === 'champagne' && _persoMousse(r) && r.tirage !== 'aucun', secondes: 12 },
  { id: 'cave', mode: 'avance', section: 'chai', type: 'oui_non', texte: 'Gardez-vous les bouteilles sur lattes dans votre cave ?', si: (r) => _persoMousse(r) && r.tirage !== 'aucun', secondes: 8 },
  { id: 'degorgement', mode: 'avance', section: 'chai', type: 'oui_non', texte: 'Dégorgez-vous sur place ?', si: (r) => _persoMousse(r) && r.tirage !== 'aucun', secondes: 8 },
  { id: 'equipements', mode: 'avance', section: 'chai', type: 'oui_non', texte: 'Suivre l’entretien et la maintenance des équipements ?', secondes: 8 },
  { id: 'plan', mode: 'avance', section: 'vins', type: 'oui_non', texte: 'Utiliser un plan de vinification (doses par cépage, revendication et fraction) ?', secondes: 10 },
  { id: 'planProposer', mode: 'avance', section: 'vins', type: 'oui_non', texte: 'Proposer ses étapes à la création de chaque lot ?', si: (r) => r.plan !== false, secondes: 8 },
  { id: 'referentiel', mode: 'avance', section: 'revendications', type: 'oui_non', texte: 'Alerter quand un intrant ou une dose dépasse un cahier des charges ?', secondes: 10 },
  { id: 'operateurs', mode: 'avance', section: 'equipe', type: 'liste', texte: 'Personnes qui réalisent les opérations (une par ligne)', aide: 'Prénom et nom ; elles signent les opérations, fiches et contrôles.', secondes: 40 },
  { id: 'verrou', mode: 'avance', section: 'equipe', type: 'nombre', texte: 'Verrouillage automatique après (minutes d’inactivité)', si: (r) => r.acces === 'equipe', min: 0, max: 480, secondes: 8 },
  { id: 'campagne', mode: 'avance', section: 'donnees', type: 'date', texte: 'Début de votre campagne (vendanges)', aide: 'Une campagne d’un an est créée à cette date si aucune ne la couvre.', secondes: 12 },
  { id: 'onglet', mode: 'avance', section: 'donnees', type: 'choix', texte: 'Onglet affiché à l’ouverture', options: () => PERSO_ONGLETS.map(([id, label]) => ({ id, label })), secondes: 8 },
];
const persoQuestion = (id) => PERSO_QUESTIONS.find((q) => q.id === id) || null;
const persoOptions = (q) => (typeof q.options === 'function' ? q.options() : q.options || []);
// questions qui s'appliquent : celles du mode (l'avancé reprend le basique) dont la condition est remplie par les réponses
function persoQuestions(mode, reponses, ctx) {
  const r = reponses || {}; return PERSO_QUESTIONS.filter((q) => (mode === 'avance' || q.mode === 'basique') && (!q.si || q.si(r, ctx || {})));
}
// durée estimée en minutes (arrondie, au moins 1)
const persoDuree = (mode, reponses, ctx) => Math.max(1, Math.round(sum(persoQuestions(mode, reponses, ctx), (q) => q.secondes || 10) * 1.8 / 60)); // lecture comprise
// réponses par défaut : réglages actuels de la base (questionnaire relancé), sinon valeurs courantes
function persoDefauts(db, ctx) {
  const e = db.entreprise || {}; const pv = (db.settings && db.settings.profilViticole) || {}; const region = pv.region || (champenois(db) ? 'champagne' : 'champagne');
  const types = Array.isArray(pv.types) && pv.types.length ? pv.types : ((PROFIL_REGIONS.find((x) => x.id === region) || {}).types || ['effervescent', 'blanc']);
  const d = typeof drmReglage === 'function' ? drmReglage(db) : {}; const dt = (db.settings && db.settings.declarationTirage) || {}; const prev = (db.settings && db.settings.personnalisation && db.settings.personnalisation.reponses) || {};
  const qs = qualifList(db).filter((q) => !q.masque).map((q) => q.id).filter((id) => PERSO_REVENDICATIONS.some((x) => x.id === id));
  const mousse = types.some((t) => t === 'effervescent' || t === 'ancestrale');
  const base = { nom: e.nom || '', region, statut: dt.statut || 'recoltant', types, tirage: !mousse ? 'aucun' : moduleActif(db, 'tirage') ? 'sur_place' : 'aucun', pressoir: moduleActif(db, 'pressoir'), revendications: qs.length ? qs : ['conv'], hygiene: moduleActif(db, 'hygiene'),
    codeBio: (qualifList(db).find((q) => q.id === 'bio') || {}).codeAgrement || '', acces: securiteActive(db) ? 'equipe' : 'seul', donnees: 'vide', adresse: e.adresse || '', evv: d.cvi || '', accise: d.accise || '', civc: d.civc || '', codeRecoltant: dt.codeRecoltant || '', cave: moduleActif(db, 'cave'), degorgement: moduleActif(db, 'degorgement'), equipements: moduleActif(db, 'equipements'),
    plan: moduleActif(db, 'plan'), planProposer: typeof schemasReglage === 'function' ? schemasReglage(db).proposer : true, referentiel: typeof refActif === 'function' ? refActif(db) : true, operateurs: '', verrou: securiteReglages(db).verrouMin, campagne: `${new Date().getFullYear()}-08-01`, onglet: (db.settings && db.settings.ongletDefaut) || 'vinification' };
  const out = { ...base, ...prev }; if (!(ctx && ctx.premiere)) delete out.donnees; return out;
}
// contrôle d'une réponse : message d'erreur, ou '' si elle convient
function persoValider(q, v) {
  if (!q) return 'Question inconnue.';
  const vide = v == null || v === '' || (Array.isArray(v) && !v.length);
  if (q.type === 'compte') { const c = v || {}; if (!String(c.identifiant || '').trim()) return 'Choisissez votre identifiant.'; if (!/^[\p{L}\p{N}._@-]+$/u.test(String(c.identifiant).trim())) return 'Identifiant : lettres, chiffres, point, tiret ou @, sans espace.'; if (String(c.mdp || '').length < 8) return 'Mot de passe : 8 caractères au moins.'; if (c.mdp !== c.mdp2) return 'Les deux mots de passe diffèrent.'; return ''; }
  if (vide) return q.requis ? 'Réponse attendue.' : '';
  if (q.type === 'choix' && !persoOptions(q).some((o) => o.id === v)) return 'Choix inconnu.';
  if (q.type === 'multi' && (!Array.isArray(v) || v.some((x) => !persoOptions(q).some((o) => o.id === x)))) return 'Choix inconnu.';
  if (q.type === 'oui_non' && typeof v !== 'boolean') return 'Répondez oui ou non.';
  if (q.type === 'nombre') { if (!hasNum(v)) return 'Nombre attendu.'; if ((q.min != null && num(v) < q.min) || (q.max != null && num(v) > q.max)) return `Entre ${q.min} et ${q.max}.`; }
  if (q.type === 'date' && !isoOK(v)) return 'Date invalide.';
  if (q.type === 'texte' && String(v).length > 200) return 'Texte trop long (200 caractères au plus).';
  if (q.verifier) return q.verifier(v) || '';
  return '';
}
// toutes les réponses : { ok, erreurs: { id: message } }
function persoValiderTout(mode, reponses, ctx) {
  const erreurs = {}; persoQuestions(mode, reponses, ctx).forEach((q) => { const m = persoValider(q, (reponses || {})[q.id]); if (m) erreurs[q.id] = m; }); return { ok: !Object.keys(erreurs).length, erreurs };
}
// personnes : « Prénom Nom » par ligne → [{ prenom, nom }] sans doublon (ni avec les opérateurs existants)
function persoOperateurs(db, texte) {
  const vus = new Set(((db && db.operateurs) || []).map((o) => operateurCle(o.prenom, o.nom))); const out = [];
  String(texte || '').split(/\n|;/).map((x) => x.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 60).forEach((l) => { const [prenom, ...reste] = l.split(' '); const o = { prenom, nom: reste.join(' ') }; const k = operateurCle(o.prenom, o.nom); if (!vus.has(k)) { vus.add(k); out.push(o); } });
  return out;
}
// plan des changements (aperçu lisible + actions) à partir des réponses ; ne modifie pas la base
function persoPlan(db, mode, reponses, ctx) {
  const r = { ...(reponses || {}) }; const Q = persoQuestions(mode, r, ctx); const a = (id) => Q.some((q) => q.id === id); const ch = [];
  const pousser = (groupe, label, apres) => ch.push({ groupe, label, apres });
  const mousse = _persoMousse(r); const modules = {};
  const plan = { mode, entreprise: {}, profil: null, modules, revendications: null, drm: {}, declaration: {}, operateurs: [], campagne: null, referentiel: null, schemasProposer: null, verrouMin: null, ongletDefaut: null, baseVide: a('donnees') && r.donnees === 'vide', changements: ch };
  if (a('nom') && String(r.nom || '').trim()) { plan.entreprise.nom = String(r.nom).trim().slice(0, 120); pousser('exploitation', 'Nom de l’exploitation', plan.entreprise.nom); }
  if (a('adresse') && String(r.adresse || '').trim()) { plan.entreprise.adresse = String(r.adresse).trim().slice(0, 200); pousser('exploitation', 'Adresse', plan.entreprise.adresse); }
  if (a('region') && PROFIL_REGIONS.some((x) => x.id === r.region) && Array.isArray(r.types) && r.types.length) { plan.profil = { region: r.region, types: r.types }; pousser('vins', 'Profil viticole', `${(PROFIL_REGIONS.find((x) => x.id === r.region) || {}).nom} · ${r.types.map((t) => (PROFIL_TYPES.find((x) => x[0] === t) || [t, t])[1]).join(', ')}`); }
  if (a('statut') && r.statut) plan.declaration.statut = r.statut;
  // onglets : pressoir, tirage / cave / dégorgement, hygiène, équipements, plan
  const on = (id, v) => { modules[id] = !!v; };
  if (a('pressoir')) on('pressoir', r.pressoir !== false);
  if (mousse) { const ici = r.tirage !== 'aucun'; on('tirage', ici); on('cave', ici && (a('cave') ? r.cave !== false : true)); on('degorgement', ici && (a('degorgement') ? r.degorgement !== false : true)); } else if (r.types) { on('tirage', false); on('cave', false); on('degorgement', false); }
  if (a('hygiene')) { on('hygiene', r.hygiene !== false); if (!a('equipements')) on('equipements', r.hygiene !== false); }
  if (a('equipements')) on('equipements', r.equipements !== false);
  if (a('plan')) on('plan', r.plan !== false);
  Object.keys(modules).forEach((id) => pousser('onglets', `Onglet ${PERSO_MODULES_NOMS[id] || id}`, modules[id] ? 'affiché' : 'masqué'));
  if (a('revendications') && Array.isArray(r.revendications)) { const L = uniq(['conv', ...r.revendications]).filter((id) => PERSO_REVENDICATIONS.some((x) => x.id === id)); plan.revendications = L; pousser('revendications', 'Revendications proposées', L.map((id) => PERSO_REVENDICATIONS.find((x) => x.id === id).label).join(', ')); }
  if (a('codeBio') && Array.isArray(plan.revendications) && plan.revendications.includes('bio')) { plan.codeBio = codeAgrementValide(r.codeBio) ? codeAgrementNorm(r.codeBio) : ''; pousser('revendications', 'Code d’agrément bio (affiché comme revendication)', plan.codeBio || 'aucun : « BIO »'); }
  if (a('referentiel')) { plan.referentiel = r.referentiel !== false; pousser('revendications', 'Alertes de conformité (labels et cahiers des charges)', plan.referentiel ? 'activées' : 'désactivées'); }
  ['evv', 'accise', 'civc'].forEach((k) => { if (a(k) && String(r[k] || '').trim()) plan.drm[k === 'evv' ? 'cvi' : k] = String(r[k]).trim().slice(0, 40); });
  if (Object.keys(plan.drm).length) pousser('donnees', 'Identifiants douaniers et interprofessionnels', Object.values(plan.drm).join(' · '));
  if (a('codeRecoltant') && String(r.codeRecoltant || '').trim()) { plan.declaration.codeRecoltant = String(r.codeRecoltant).trim().slice(0, 40); pousser('donnees', 'Code récoltant', plan.declaration.codeRecoltant); }
  if (a('planProposer')) { plan.schemasProposer = r.planProposer !== false; pousser('vins', 'Étapes du plan proposées à la création des lots', plan.schemasProposer ? 'oui' : 'non'); }
  if (a('operateurs')) { plan.operateurs = persoOperateurs(plan.baseVide ? {} : db, r.operateurs); if (plan.operateurs.length) pousser('equipe', 'Opérateurs ajoutés', plan.operateurs.map((o) => `${o.prenom} ${o.nom}`.trim()).join(', ')); }
  if (a('verrou') && hasNum(r.verrou)) { plan.verrouMin = Math.max(0, Math.min(480, Math.round(num(r.verrou)))); pousser('equipe', 'Verrouillage automatique', `${plan.verrouMin} min`); }
  if (a('campagne') && isoOK(r.campagne)) { const y = Number(r.campagne.slice(0, 4)); plan.campagne = { nom: `${y}-${y + 1}`, debut: r.campagne, fin: addDays(`${y + 1}${r.campagne.slice(4)}`, -1) }; pousser('donnees', 'Campagne', `${plan.campagne.nom} (${fmtDate(plan.campagne.debut)} → ${fmtDate(plan.campagne.fin)})`); }
  if (a('onglet') && PERSO_ONGLETS.some((x) => x[0] === r.onglet)) { plan.ongletDefaut = r.onglet; pousser('donnees', 'Onglet d’ouverture', (PERSO_ONGLETS.find((x) => x[0] === r.onglet) || [])[1]); }
  if (plan.baseVide) pousser('donnees', 'Base de départ', 'vide (le jeu d’exemple est retiré)');
  if (a('compte') && r.acces === 'equipe') pousser('equipe', 'Identifiants', 'activés, compte administrateur créé');
  return plan;
}
// application du plan (base déjà choisie : vide ou actuelle) ; rien n'est supprimé ; idempotente
function persoAppliquer(db, plan, uid) {
  if (!plan || typeof plan !== 'object') return fail('Plan de personnalisation vide.'); let n = 0;
  if (Object.keys(plan.entreprise || {}).length) { entrepriseSet(db, plan.entreprise); n += 1; }
  if (plan.profil) { const r = profilAppliquer(db, plan.profil.region, plan.profil.types, null, uid); if (!r.ok) return r; n += 1; }
  Object.keys(plan.modules || {}).forEach((id) => { if (estModule(id) && id !== MODULE_FIXE && moduleActif(db, id) !== !!plan.modules[id]) { moduleActiver(db, id, !!plan.modules[id]); n += 1; } });
  if (Array.isArray(plan.revendications)) {
    if (!Array.isArray(db.lists.qualifs) || !db.lists.qualifs.length) db.lists.qualifs = qualifList(db).map((x) => ({ ...x }));
    const Q = db.lists.qualifs;
    PERSO_REVENDICATIONS.filter((x) => plan.revendications.includes(x.id)).forEach((def) => { const id = def.id; let q = Q.find((x) => x && x.id === id); /* dans l'ordre du catalogue (HVE puis VDC) */
      if (!q) { q = { id, label: def.label, court: def.court, couleur: def.couleur, ...(def.referentiels.length ? { referentiels: def.referentiels } : {}) };
        /* 0.44.0-alpha.3 : certification de durabilité (HVE, VDC) rangée juste après Conventionnel (rang plus bas que Bio pour les assemblages) */
        const k = def.durable ? Math.max(-1, ...Q.map((x, j) => (x && (x.id === 'conv' || (PERSO_REVENDICATIONS.find((y) => y.id === x.id) || {}).durable) ? j : -1))) : -1;
        if (k >= 0) Q.splice(k + 1, 0, q); else Q.push(q); n += 1; } else if (q.masque) { q.masque = false; n += 1; } });
    Q.forEach((q) => { if (!q || q.id === 'conv' || plan.revendications.includes(q.id) || q.masque || !PERSO_REVENDICATIONS.some((x) => x.id === q.id)) return; /* une revendication propre à l'exploitation n'est jamais masquée */ if (typeof qualifUsage === 'function' && qualifUsage(db, q.id)) return; q.masque = true; n += 1; });
  }
  if (typeof plan.codeBio === 'string') { const q = qualifList(db).find((x) => x.id === 'bio'); if (q && (q.codeAgrement || '') !== plan.codeBio) { const r = qualifCodeAgrementSet(db, 'bio', { codeAgrement: plan.codeBio }, uid); if (r.ok) n += 1; } } /* 0.45.0-alpha.1 */
  if (plan.referentiel != null) { refActiver(db, plan.referentiel); n += 1; }
  if (Object.keys(plan.drm || {}).length) { let r = drmReglageSet(db, plan.drm); if (!r.ok) { const { accise, ...reste } = plan.drm; void accise; r = drmReglageSet(db, reste); } if (r.ok) n += 1; } // accise invalide : les autres identifiants sont gardés
  if (Object.keys(plan.declaration || {}).length) { declarationTirageReglagesSet(db, plan.declaration); n += 1; }
  if (plan.schemasProposer != null) { db.settings.schemas = { ...((db.settings && db.settings.schemas) || {}), proposer: !!plan.schemasProposer }; n += 1; }
  (plan.operateurs || []).forEach((o) => { if ((db.operateurs || []).some((x) => operateurCle(x.prenom, x.nom) === operateurCle(o.prenom, o.nom))) return; const r = operateurSave(db, o, null); if (r.ok) n += 1; });
  if (plan.campagne && !(db.campagnes || []).some((c) => c.debut <= plan.campagne.debut && c.fin >= plan.campagne.debut)) { const r = campCreate(db, plan.campagne.nom, plan.campagne.debut, plan.campagne.fin); if (r.ok) { db.settings.campagneActive = plan.campagne.nom; n += 1; } }
  if (plan.verrouMin != null && securiteActive(db)) { securiteRegler(db, { verrouMin: plan.verrouMin }); n += 1; }
  if (plan.ongletDefaut) { const r = ongletDefautSet(db, plan.ongletDefaut); if (r.ok) n += 1; }
  return okr({ n });
}
// trace des réponses (pour relancer le questionnaire) : jamais le compte ni le mot de passe
function persoMemoriser(db, mode, reponses, uid) {
  const r = { ...(reponses || {}) }; delete r.compte;
  db.settings.personnalisation = { mode, reponses: JSON.parse(JSON.stringify(r)), le: new Date().toISOString(), par: uid || '', version: APP_VERSION }; return okr();
}

/* ---------- visite guidée par chapitres (0.45.0-alpha.1) ----------
   Un chapitre par module (seuls les modules affichés et autorisés sont proposés) ; chaque étape ouvre l'onglet du chapitre (setTab,
   avec son sous-onglet `sub` quand le module le lit), ou clique le sous-onglet de rang `clic` (modules qui gardent leur sous-onglet),
   puis met en avant la cible : sélecteur CSS, ou « @onglets » (barre des sous-onglets du module). Une cible absente (module vide,
   droits en lecture) est sautée. 0.48.0-alpha.1 : « A || B » = cibles de repli, la première affichée l'emporte (un titre de section
   plutôt que toute la section, pour que la bulle ne recouvre pas ce qu'elle montre). */
const VISITE_CHAPITRES = [
  { id: 'prise', titre: 'Prise en main', module: null, etapes: [
    { cible: '[data-brand-presentation]', titre: 'Œnotrack', texte: 'Le logo ramène à la page de présentation de l’application.' },
    { cible: '.hdr-camp', titre: 'La campagne', texte: 'Choisissez la campagne affichée ; une campagne figée n’est plus modifiable.' },
    { cible: '#tab-vinification', titre: 'Les onglets', texte: 'Chaque module a son onglet ; les modules masqués ou non autorisés n’apparaissent pas (Paramètres › Modules).' },
    { cible: '.hdr-status', titre: 'État de l’appareil', texte: 'Qui saisit, sauvegarde, synchronisation et thème de l’affichage.' },
    { cible: '[data-visite-bouton]', titre: 'Revoir la visite', texte: 'Ce bouton rouvre la visite : choisissez un chapitre ou faites tout le tour.' },
  ] },
  { id: 'cuverie', titre: 'Cuverie & lots', module: 'cuverie', etapes: [
    { cible: '.sitebar', titre: 'Sites de cuverie', texte: 'Vos cuveries et chais, chacun avec son plan.', sub: 'plan' },
    { cible: '.planwrap', titre: 'Plan de cave', texte: 'Chaque contenant montre son lot et son volume ; un clic ouvre sa fiche (lot, composition, analyses, historique).' },
    { cible: '[data-legende="plan"]', titre: 'Légende', texte: 'Couleurs et motifs au choix : cépages, fractions, millésimes, revendications, crus, stade, couleur.' },
    { cible: '[data-vg="cuverie-nouveau"]', titre: 'Contenants', texte: 'Ajoutez cuves, fûts et bacs ; le plan se modifie, le QR code d’une cuve s’imprime.' },
    { cible: '@onglets', titre: 'Autres vues', texte: 'Cartes, liste des lots, liste des contenants et barèmes de jaugeage (épalement).' },
  ] },
  { id: 'pressoir', titre: 'Pressoir', module: 'pressoir', etapes: [
    { cible: '[data-profil-actif]', titre: 'Profil viticole', texte: 'Fractions, rendements et vocabulaire de votre région.', sub: 'pesees' },
    { cible: '[data-nouvelle-pesee]', titre: 'Registre des pesées', texte: 'Chaque apport : partenaire, cru, cépage, poids, TAP (titre alcoométrique volumique en puissance) et état sanitaire.' },
    { cible: '@onglets', titre: 'Pressurages et carnet', texte: 'Marcs et carnet de pressoir (cuvée, tailles, rebêches), relevés par partenaire, bilan, journal et réglages.' },
  ] },
  { id: 'ops', titre: 'Opérations & assemblages', module: 'ops', etapes: [
    { cible: '[data-nouvelle-op] || [data-groupe]', titre: 'Saisir une opération', texte: 'Bouton « ＋ Nouvelle opération » : recherche, favoris, dernières opérations utilisées et familles d’opérations.', sub: 'journal' },
    { cible: 'select[aria-label="Type d’opération"]', titre: 'Journal des opérations', texte: 'Sous-onglet « Journal » : toutes les opérations de la campagne, filtrables, modifiables avec un motif tracé.' },
    { cible: '[data-vg="declass"] .sec-t || [data-vg="declass"]', titre: 'Déclassements', texte: 'Un intrant non autorisé propose un déclassement : rien n’est appliqué sans votre validation.', sub: 'declass' },
    { cible: '[data-vg="ops-catalogue"] || [data-ops-catalogue]', titre: 'Catalogue des opérations', texte: 'Vos opérations, leurs champs, le changement de stade et la fiche imprimée.', sub: 'catalogue' },
  ] },
  { id: 'previsions', titre: 'À réaliser & fiches', module: 'previsions', etapes: [
    { cible: 'input[aria-label="Rechercher une opération à réaliser"]', titre: 'Opérations à réaliser', texte: 'Les opérations prévues (dont les étapes du plan de vinification), validées une fois faites.' },
    { cible: '[data-vg="fiche-jour"]', titre: 'Fiches de travail', texte: 'Fiche du jour par type d’opération, fiches d’une sélection, modèles de fiches.' },
  ] },
  { id: 'plan', titre: 'Plan de vinification', module: 'plan', etapes: [
    { cible: '[data-planv-edit] thead || [data-planv-tableau] thead || [data-planv-edit], [data-planv-tableau]', titre: 'Le plan', texte: 'Étapes, produits et doses par groupe de cépages, revendication et fraction ; chaque case se modifie sur place.', sub: 'plan' },
    { cible: '[data-planv-variante]', titre: 'Variantes', texte: 'Un plan adapté à des partenaires, crus, échelles, revendications ou cépages ; la variante la plus précise s’applique.' },
    { cible: '[data-planv-importer]', titre: 'Import d’un tableur', texte: 'Reprenez votre plan Excel tel quel.' },
    { cible: '[data-planv-proposer]', titre: 'À la création d’un lot', texte: 'Les étapes du plan sont proposées, dans l’ordre, comme opérations à réaliser.' },
  ] },
  { id: 'tirage', titre: 'Tirages', module: 'tirage', etapes: [
    { cible: '[data-tirage-calcul] > :first-child || [data-tirage-calcul]', titre: 'Préparer', texte: 'Calculateur de tirage dans les deux sens, fonte de liqueur, VRTP prévisionnel.', clic: 0 },
    { cible: '[data-vg="levains"]', titre: 'Levains', texte: 'Plan de propagation, alimentations, recalibrage et suivi jour par jour.' },
    { cible: '[data-vg="chantiers"]', titre: 'Tirer', texte: 'Chantiers de tirage : cuvées prévues, cuve de mixtion ou pompe doseuse, formats, casse, bilan.', clic: 1 },
    { cible: '[data-tirage-fournitures] > :first-child || [data-tirage-fournitures]', titre: 'Fournitures', texte: 'Bouteilles, obturateurs, capsules : ce sont vos intrants, sans stock en double ; retours au fournisseur.', clic: 2 },
    { cible: '[data-tirage-declarations]', titre: 'Déclarations', texte: 'Déclaration préalable (AIDAC) et de fin de tirage (Innov OI), VRTP distinct, dépôt figé.', clic: 3 },
  ] },
  { id: 'cave', titre: 'Cave', module: 'cave', etapes: [
    { cible: '[data-vg="cave-saisir"]', titre: 'Remuage et mouvements', texte: 'Remuage, mise sur pointes et mouvements des bouteilles sur lattes.' },
    { cible: '[data-vg="cave-bouteilles"]', titre: 'Bouteilles en cave', texte: 'Chaque lot de tirage : bouteilles, âge sur lattes, étapes.' },
  ] },
  { id: 'degorgement', titre: 'Dégorgement', module: 'degorgement', etapes: [
    { cible: '[data-vg="degorgement-saisir"]', titre: 'Dégorger', texte: 'Dégorgement avec la liqueur d’expédition : le lot fini en reprend le SO₂.' },
    { cible: '[data-vg="degorgement-lots"]', titre: 'Lots à dégorger', texte: 'Les bouteilles prêtes, lot par lot.' },
    { cible: '[data-habillages]', titre: 'Habillage et expédition', texte: 'Habillage, réétiquetage et mise en carton des lots finis.' },
  ] },
  { id: 'analyses', titre: 'Analyses', module: 'analyses', etapes: [
    { cible: '[data-bulletins]', titre: 'Bulletins du laboratoire', texte: 'Déposez le PDF : les résultats sont lus et rattachés aux lots.', clic: 0 },
    { cible: '[data-vg="analyse-nouvelle"]', titre: 'Saisie', texte: 'Une analyse à la main, avec les modèles de fiches.' },
    { cible: '@onglets', titre: 'Paramètres et modèles', texte: 'Paramètres analysés, unités et modèles de fiches.' },
  ] },
  { id: 'intrants', titre: 'Intrants & stocks', module: 'intrants', etapes: [
    { cible: '[data-recap-ouvrir]', titre: 'Stocks et arrivages', texte: 'Chaque lot fournisseur, son restant et ses utilisations ; fiche récapitulative imprimable.', clic: 0 },
    { cible: '[data-regul-ouvrir]', titre: 'Régularisations', texte: 'Inventaire, casse, perte, péremption : tracées avec leur motif.' },
    { cible: '@onglets', titre: 'Produits, fiches et catalogues', texte: 'Règles par revendication, FT et FDS, catalogues des fournisseurs, labels et cahiers des charges, fournisseurs.' },
    { cible: '[data-labels] [role=tablist] || [data-labels]', titre: 'Labels & cahiers des charges', texte: 'Plafonds de SO₂, substances autorisées par label, textes de référence : les alertes de conformité en découlent.', clic: 4 },
  ] },
  { id: 'hygiene', titre: 'Hygiène', module: 'hygiene', etapes: [
    { cible: '[data-vg="hygiene-nouvelle"]', titre: 'Journal d’hygiène', texte: 'Nettoyage, désinfection et rinçage des cuves, équipements et locaux.', sub: 'journal' },
    { cible: '@onglets', titre: 'Plan de nettoyage', texte: 'Tâches à faire, plan de nettoyage, produits d’hygiène et leurs FDS.' },
  ] },
  { id: 'equipements', titre: 'Équipements', module: 'equipements', etapes: [
    { cible: '[data-equip-parc] .lbl || [data-equip-parc]', titre: 'Parc', texte: 'Pressoirs, pompes, filtres, tireuses : fiche, documents et état.', sub: 'parc' },
    { cible: '@onglets', titre: 'Maintenance et vérifications', texte: 'À faire, maintenance, produits de maintenance et vérifications périodiques.' },
  ] },
  { id: 'trace', titre: 'Traçabilité', module: 'trace', etapes: [
    { cible: '[data-trace-etapes]', titre: 'Toutes les étapes', texte: 'De la bouteille à la parcelle : cherchez un lot, une cuve ou un code.', clic: 0 },
    { cible: '@onglets', titre: 'Rappels et audits', texte: 'Rappel d’un lot d’intrant, par cru, parcelle, partenaire ou échelle, conformité réglementaire, mode audit, rapports.' },
  ] },
  { id: 'registres', titre: 'Registres & DRM', module: 'registres', etapes: [
    { cible: '[data-vg="registres-export"]', titre: 'Registres', texte: 'Tous les registres en CSV ou Excel.', sub: 'registres' },
    { cible: '[data-drm] > :first-child || [data-drm]', titre: 'DRM', texte: 'Déclaration récapitulative mensuelle : XML pour CIEL et pour le CIVC.', sub: 'drm' },
  ] },
  { id: 'params', titre: 'Paramètres', module: 'params', etapes: [
    { cible: '[data-params-menu]', titre: 'Rubriques', texte: 'Exploitation, vin et cuverie, équipe et sécurité, données et application.' },
    { cible: '[data-params-item="listes"]', titre: 'Revendications', texte: 'Revendications et leur rang ; pour le bio, le code d’agrément de l’organisme certificateur.' },
    { cible: '[data-params-item="crus"]', titre: 'Crus et parcelles', texte: 'Chaque parcelle porte son appellation et son niveau dans la hiérarchie de cette appellation.' },
    { cible: '[data-params-item="codification"]', titre: 'Codification des lots', texte: 'Vos règles de codes de lots, stade par stade.' },
    { cible: '[data-params-item="utilisateurs"]', titre: 'Utilisateurs & droits', texte: 'Comptes, profils de droits, clés d’accès et verrouillage.' },
    { cible: '[data-params-item="sauvegarde"]', titre: 'Sauvegardes et synchronisation', texte: 'Drive, dossier partagé ou réseau, chiffrement de l’équipe.' },
    { cible: '[data-region-societe]', titre: 'Région et types de vins', texte: 'Votre région et vos types de vins règlent les opérations, cépages, appellations et fractions proposés.', sub: 'entreprise' },
    { cible: '[data-config-guidee]', titre: 'Configuration guidée', texte: 'Relancez le questionnaire ou cette visite.', sub: 'base' },
  ] },
];
// chapitres proposés : modules affichés et autorisés ; `voir(module)` = niveau d'accès (aucun → masqué)
function visiteChapitres(db, voir) {
  return VISITE_CHAPITRES.filter((c) => !c.module || (moduleActif(db, c.module) && (!voir || voir(c.module))));
}
/* 0.48.0-alpha.1 : parcours « Essentiel » (une étape choisie par grand module, dans l'ordre) et durée annoncée de la visite.
   Chaque étape garde le sous-onglet (ou le rang de sous-onglet) des étapes qui la précèdent dans son chapitre. */
const VISITE_ESSENTIEL = [['prise', 2], ['cuverie', 1], ['pressoir', 1], ['ops', 0], ['previsions', 0], ['tirage', 0], ['intrants', 0], ['trace', 0], ['params', 0], ['prise', 4]];
const VISITE_SECONDES_ETAPE = 8;
const visiteDuree = (n) => Math.max(1, Math.ceil(((n || 0) * VISITE_SECONDES_ETAPE) / 60));
function visiteEssentiel(db, voir) {
  const C = visiteChapitres(db, voir);
  return VISITE_ESSENTIEL.map(([cid, i]) => {
    const c = C.find((x) => x.id === cid); const e = c && c.etapes[i]; if (!e) return null;
    let sub; let clic; c.etapes.slice(0, i + 1).forEach((x) => { if (x.sub) { sub = x.sub; clic = undefined; } if (x.clic != null) clic = x.clic; });
    const et = { ...e }; if (sub) et.sub = sub; else delete et.sub; if (clic != null) et.clic = clic; else delete et.clic;
    return { id: c.id, titre: c.titre, module: c.module, etapes: [et] };
  }).filter(Boolean);
}
