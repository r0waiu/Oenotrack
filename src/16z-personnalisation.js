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
  { id: 'bio', label: 'FR-BIO-01', court: 'BIO', couleur: '#3E8E4E', referentiels: ['bio-ue'] },
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
  { id: 'tirage', mode: 'basique', section: 'vins', type: 'choix', texte: 'Le tirage de vos effervescents se fait…', si: (r) => _persoMousse(r), options: () => [{ id: 'sur_place', label: 'Chez vous, avec votre matériel' }, { id: 'prestataire', label: 'Chez vous, par un prestataire de tirage' }, { id: 'aucun', label: 'Pas chez vous (vente de vins clairs)' }], requis: true, secondes: 10 },
  { id: 'pressoir', mode: 'basique', section: 'chai', type: 'oui_non', texte: 'Pressurez-vous des raisins sur place ?', aide: 'Registre des pesées, carnet de pressoir, marcs.', secondes: 8 },
  { id: 'revendications', mode: 'basique', section: 'revendications', type: 'multi', texte: 'Sous quelles revendications produisez-vous ?', aide: 'Les règles d’intrants et les plafonds de chaque label s’appliquent d’office (à vérifier).', options: () => PERSO_REVENDICATIONS.map((q) => ({ id: q.id, label: q.label })), requis: true, secondes: 15 },
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
    acces: securiteActive(db) ? 'equipe' : 'seul', donnees: 'vide', adresse: e.adresse || '', evv: d.cvi || '', accise: d.accise || '', civc: d.civc || '', codeRecoltant: dt.codeRecoltant || '', cave: moduleActif(db, 'cave'), degorgement: moduleActif(db, 'degorgement'), equipements: moduleActif(db, 'equipements'),
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
