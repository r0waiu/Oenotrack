/* ============ CRUD simples : contenants, produits, arrivages, listes, analyses, hygiène ============ */
/* ============ PLAN DE CAVE : formes, tailles, positions ============ */
const FORME_VB = { cuve: [80, 104], conique: [80, 104], citerne: [140, 80], fut: [104, 80], foudre: [100, 108], jarre: [80, 96], amphore: [76, 104], oeuf: [80, 104], bombonne: [70, 92] };
const FORME_ORDER = { cuve: 1, conique: 1, citerne: 2, foudre: 3, fut: 3, oeuf: 4, jarre: 4, amphore: 4, bombonne: 5 };
const PLAN_W = 1100, GRID = 10;
const formeOf = (db, c) => { const t = (db.lists.typesContenant || []).find((x) => x.id === c.type); return (t && t.forme) || 'cuve'; };
const matOf = (db, c) => (db.lists.matieres || []).find((x) => x.id === c.matiere) || { couleur: '#B9C4CC', finition: 'lisse' };
function tileSize(db, c) { // dimension du dessin (sw × sh) et de la vignette complète (w × h, avec l'étiquette)
  const vb = FORME_VB[formeOf(db, c)] || [80, 104]; const k = clamp(Math.pow((num(c.volMax) || 1000) / 3000, 0.3), 0.72, 1.5);
  const sw = Math.round(vb[0] * k), sh = Math.round(vb[1] * k); return { sw, sh, w: Math.max(sw, 108), h: sh + 54 };
}
function freeSlot(rects, w, h) {
  for (let y = 24; y < 6000; y += 10) for (let x = 24; x + w <= PLAN_W - 24; x += 10) {
    if (!rects.some((r) => x < r.x + r.w + 14 && x + w + 14 > r.x && y < r.y + r.h + 14 && y + h + 14 > r.y)) return { x, y };
  }
  return { x: 24, y: 24 };
}
// Place les contenants d'un site : seulement ceux sans position (onlyMissing) ou tous (réorganisation automatique)
function planAuto(db, siteId, onlyMissing) {
  const mine = db.contenants.filter((c) => c.siteId === siteId);
  const rects = []; const todo = [];
  mine.forEach((c) => { if (onlyMissing && c.x != null && c.y != null) { const t = tileSize(db, c); rects.push({ x: c.x, y: c.y, w: t.w, h: t.h }); } else todo.push(c); });
  todo.sort((a, b) => (FORME_ORDER[formeOf(db, a)] || 9) - (FORME_ORDER[formeOf(db, b)] || 9) || a.nom.localeCompare(b.nom, 'fr', { numeric: true }));
  todo.forEach((c) => { const t = tileSize(db, c); const p = freeSlot(rects, t.w, t.h); c.x = p.x; c.y = p.y; rects.push({ x: p.x, y: p.y, w: t.w, h: t.h }); });
}
function contMove(db, id, x, y) { const c = db.contenants.find((k) => k.id === id); if (!c) return fail('Contenant introuvable.'); c.x = Math.max(0, Math.round(num(x) / GRID) * GRID); c.y = Math.max(0, Math.round(num(y) / GRID) * GRID); return okr(); }

/* ---------- sites (stock commun : un site n'isole jamais les stocks) ---------- */
function siteSave(db, s, id) {
  const nom = String(s.nom || '').trim(); if (!nom) return fail('Le nom du site est obligatoire.');
  if (nameTaken(db.sites, nom, id)) return fail(`Le site « ${nom} » existe déjà.`);
  if (id) Object.assign(db.sites.find((x) => x.id === id), { nom, adresse: s.adresse || '' });
  else { let sid = nid(db, 'site'); while (db.sites.some((x) => x.id === sid)) sid = nid(db, 'site'); db.sites.push({ id: sid, nom, adresse: s.adresse || '', zones: [] }); }
  return okr();
}
function siteDelete(db, id) {
  if (db.sites.length <= 1) return fail('Il faut conserver au moins un site.');
  const n = db.contenants.filter((c) => c.siteId === id).length; if (n) return fail(`Ce site contient encore ${n} contenant(s) : déplacez-les vers un autre site (fiche du contenant › Modifier) avant de le supprimer.`);
  db.sites = db.sites.filter((x) => x.id !== id); if (db.settings.siteActif === id) db.settings.siteActif = 'all'; return okr();
}
function zoneSave(db, siteId, z) {
  const st = db.sites.find((x) => x.id === siteId); if (!st) return fail('Site introuvable.');
  const item = { label: String(z.label || '').trim(), x: Math.max(0, Math.round(num(z.x) / GRID) * GRID), y: Math.max(0, Math.round(num(z.y) / GRID) * GRID), w: Math.max(60, Math.round(num(z.w) / GRID) * GRID), h: Math.max(40, Math.round(num(z.h) / GRID) * GRID), couleur: z.couleur || '#9AA39B' };
  if (z.id) { const cur = st.zones.find((q) => q.id === z.id); if (cur) Object.assign(cur, item); } else st.zones.push({ id: nid(db, 'zn'), ...item });
  return okr();
}
function zoneDelete(db, siteId, id) { const st = db.sites.find((x) => x.id === siteId); if (st) st.zones = st.zones.filter((z) => z.id !== id); return okr(); }

/* ---------- crus (villages) ---------- */
/* ---------- parcelles (reliées à un cru) ---------- */
const parcelleName = (db, id) => { const p = (db.parcelles || []).find((x) => x.id === id); return p ? p.nom : (id && id !== '?' ? '(parcelle supprimée)' : 'Non renseignée'); };
function parcelleUsage(db, id) { return db.ops.filter((o) => (o.type === 'apport' && o.parcelleId === id) || (o.type === 'entree_mout' && (o.entrees || []).some((e) => e.parcelleId === id))).length; }
function parcelleSave(db, s, id) {
  if (!Array.isArray(db.parcelles)) db.parcelles = [];
  const nom = String(s.nom || '').trim(); if (!nom) return fail('Le nom de la parcelle est obligatoire.');
  if (!s.cruId || !db.crus.some((c) => c.id === s.cruId)) return fail('Choisissez le cru (village) de la parcelle.');
  if (db.parcelles.some((p) => p.id !== id && p.cruId === s.cruId && norm(p.nom).trim() === norm(nom).trim())) return fail(`La parcelle « ${nom} » existe déjà dans ce cru.`);
  const item = { nom, cruId: s.cruId, lieuDit: String(s.lieuDit || '').trim(), cadastre: String(s.cadastre || '').trim(), surface: hasNum(s.surface) ? num(s.surface) : null, cepageId: s.cepageId || '', annee: String(s.annee || '').trim(), apporteurId: s.apporteurId || '', notes: String(s.notes || '').trim(), masque: !!s.masque };
  // 0.47.0-alpha.1 : appellation de la parcelle et son niveau dans la hiérarchie de l'appellation (absents du formulaire : gardés)
  if ('appellationId' in s) {
    const appId = s.appellationId && ((db.lists && db.lists.appellations) || []).some((a) => a && a.id === s.appellationId) ? s.appellationId : '';
    if (s.appellationId && !appId) return fail('Appellation introuvable dans la liste.');
    const niv = appId && s.niveau ? s.niveau : ''; if (niv && typeof appellationNiveaux === 'function' && !appellationNiveaux(db, appId).some((i) => i.id === niv)) return fail('Niveau inconnu dans la hiérarchie de cette appellation.');
    item.appellationId = appId; item.niveau = niv;
  }
  if (id) { const p = db.parcelles.find((x) => x.id === id); if (!p) return fail('Parcelle introuvable.'); Object.assign(p, item); return okr({ id }); }
  const nid_ = nid(db, 'parc'); db.parcelles.push({ id: nid_, ...item }); return okr({ id: nid_ });
}
function parcelleDelete(db, id) { const n = parcelleUsage(db, id); if (n) return fail(`Parcelle utilisée par ${n} opération(s) : masquez-la plutôt que de la supprimer.`); db.parcelles = (db.parcelles || []).filter((p) => p.id !== id); return okr(); }

function cruUsage(db, id) {
  return db.ops.filter((o) => (o.type === 'apport' && o.cruId === id) || (o.type === 'entree_mout' && (o.entrees || []).some((e) => e.cruId === id)) || (o.type === 'reprise' && o.lotSpec && o.lotSpec.crus && o.lotSpec.crus[id] != null)).length;
}
function cruSave(db, s, id) {
  let nid_ = null;
  const nom = String(s.nom || '').trim(); if (!nom) return fail('Le nom du cru (village) est obligatoire.');
  if (nameTaken(db.crus, nom, id)) return fail(`Le cru « ${nom} » existe déjà dans la liste.`);
  if (!eDef(s.echelle)) return fail(`Choisissez le classement (${ECH.nom.toLowerCase()}) : ${ECHELLES.map((e) => e.un).join(', ')}.`);
  const item = { nom, echelle: s.echelle, dep: String(s.dep || '').trim(), alias: String(s.alias || '').trim(), masque: !!s.masque };
  if (id) { const c = db.crus.find((x) => x.id === id); if (!c) return fail('Cru introuvable.'); Object.assign(c, item); }
  else { nid_ = nid(db, 'cru'); db.crus.push({ id: nid_, ...item, custom: true }); }
  db.crus.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')); return okr({ id: id || nid_ });
}
function cruMask(db, ids, masque) { const set = new Set(ids); let n = 0; db.crus.forEach((c) => { if (set.has(c.id) && !!c.masque !== !!masque) { c.masque = !!masque; n += 1; } }); return okr({ n }); }
function cruDelete(db, id) {
  const np = (db.parcelles || []).filter((p) => p.cruId === id).length; if (np) return fail(`${np} parcelle(s) sont rattachées à ce cru : changez-les de cru ou supprimez-les d’abord.`);
  const n = cruUsage(db, id); if (n) return fail(`Ce cru est utilisé par ${n} opération(s) : changez-le dans ces opérations ou renommez-le plutôt que de le supprimer.`);
  db.crus = db.crus.filter((c) => c.id !== id); return okr();
}
function cruRestore(db) { // restaure la liste du fichier d'origine : réajoute les villages manquants et rétablit leur échelle (les crus personnalisés sont conservés)
  const def = DEFAULT_CRUS(); let added = 0, reset = 0;
  def.forEach((d) => { const c = db.crus.find((x) => x.id === d.id); if (!c) { db.crus.push(d); added += 1; } else if (c.echelle !== d.echelle) { c.echelle = d.echelle; reset += 1; } });
  db.crus.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')); return okr({ added, reset });
}

/* ---------- partenaires (db.apporteurs) : apporteurs de raisins ou de moûts, vendeurs de vins (viticulteurs, coopératives, négoce) ----------
   0.14.0-alpha.1 : rôles (apporteur / vendeur), crus par défaut proposés à la saisie (cruAuto), plusieurs partenaires par compartiment. */
function apporteurUsage(db, id) {
  return db.ops.filter((o) => ((o.type === 'apport' || o.type === 'reprise') && o.apporteurId === id) || (o.type === 'entree_mout' && (o.apporteurId === id || (o.entrees || []).some((e) => ligneApporteurs(e, o).some((a) => a.id === id))))).length
    + (db.parcelles || []).filter((p) => p.apporteurId === id).length;
}
const apporteurDe = (db, id) => (id ? (db.apporteurs || []).find((a) => a.id === id) || null : null);
const apporteurRoles = (a) => [a && a.apporteur !== false ? 'apporteur' : null, a && a.vendeur ? 'vendeur de vins' : null].filter(Boolean);
// cru proposé quand on choisit un partenaire (s'il a des crus par défaut et que la proposition est activée)
const apporteurCruAuto = (db, id) => { const a = apporteurDe(db, id); return a && a.cruAuto && Array.isArray(a.crusDefaut) && a.crusDefaut.length ? a.crusDefaut[0] : ''; };
function apporteurSave(db, s, id) {
  const nom = String(s.nom || '').trim(); if (!nom) return fail('Le nom du partenaire est obligatoire.');
  if (nameTaken(db.apporteurs, nom, id)) return fail(`Le partenaire « ${nom} » existe déjà.`);
  if (s.apporteur === false && !s.vendeur) return fail('Choisissez au moins un rôle : apporteur (raisins, moûts) ou vendeur de vins.');
  const crus = uniq((Array.isArray(s.crusDefaut) ? s.crusDefaut : []).filter((c) => c && db.crus.some((x) => x.id === c)));
  const item = { nom, commune: s.commune || '', ...(s.ident !== undefined ? { ident: String(s.ident || '').trim().slice(0, 120) } : {}), contact: s.contact || '', notes: s.notes || '', apporteur: s.apporteur !== false, vendeur: !!s.vendeur, crusDefaut: crus, cruAuto: !!s.cruAuto && crus.length > 0 };
  let rid = id; if (id) Object.assign(db.apporteurs.find((x) => x.id === id), item); else { rid = nid(db, 'apt'); db.apporteurs.push({ id: rid, ...item }); }
  db.apporteurs.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')); return okr({ id: rid });
}
function apporteurDelete(db, id) { const n = apporteurUsage(db, id); if (n) return fail(`Ce partenaire est utilisé par ${n} opération(s) ou parcelle(s) : il ne peut pas être supprimé.`); db.apporteurs = db.apporteurs.filter((a) => a.id !== id); return okr(); }

/* ---------- opérateurs : personnes qui réalisent les opérations (salariés, saisonniers, prestataires, œnologue…) ----------
   db.operateurs [{ id, prenom, nom, initiales, fonction, contact, notes, actif, creeLe }] ; une opération garde la liste des
   opérateurs qui l'ont faite (op.operateurs = [ids]) ; un opérateur qui a servi n'est jamais supprimé : il est archivé. */
const OPERATEUR_FONCTIONS = ['Exploitant', 'Chef de cave', 'Caviste', 'Ouvrier de chai', 'Saisonnier', 'Apprenti', 'Stagiaire', 'Œnologue', 'Prestataire', 'Laboratoire'];
const operateurDe = (db, id) => (id ? ((db && db.operateurs) || []).find((x) => x && x.id === id) || null : null);
const operateurPlein = (o) => (o ? [o.prenom, o.nom].map((x) => String(x || '').trim()).filter(Boolean).join(' ') : '');
const operateurNom = (db, id) => operateurPlein(operateurDe(db, id));
const operateurCourt = (db, id) => { const o = operateurDe(db, id); if (!o) return ''; const p = String(o.prenom || '').trim(); const n = String(o.nom || '').trim(); return p ? `${p}${n ? ` ${n[0].toUpperCase()}.` : ''}` : n; };
const operateurInitiales = (o) => (!o ? '' : String(o.initiales || '').trim().toUpperCase() || [o.prenom, o.nom].map((x) => String(x || '').trim().split(/[\s'’-]+/).filter(Boolean).map((w) => w[0]).join('')).join('').toUpperCase().slice(0, 4));
const operateursValides = (db, ids) => uniq((Array.isArray(ids) ? ids : []).filter((id) => operateurDe(db, id)));
const operateursNoms = (db, ids, sep = ', ') => operateursValides(db, ids).map((id) => operateurNom(db, id)).join(sep);
const operateurCle = (prenom, nom) => norm(`${prenom || ''} ${nom || ''}`).replace(/\s+/g, ' ').trim();
// liste triée : actifs d'abord (ordre alphabétique du prénom puis du nom), archivés ensuite
const operateursTries = (db, archives) => ((db && db.operateurs) || []).filter((o) => o && o.id && (archives || o.actif !== false))
  .sort((a, b) => ((a.actif === false) - (b.actif === false)) || operateurPlein(a).localeCompare(operateurPlein(b), 'fr', { sensitivity: 'base' }));
// ce qu'a fait un opérateur (et qui l'empêche d'être supprimé)
function operateurUsage(db, id) {
  const has = (a) => Array.isArray(a) && a.includes(id);
  const ops = db.ops.filter((o) => has(o.operateurs)).length; const hygiene = (db.hygiene || []).filter((h) => has(h.operateurs)).length;
  const previsions = (db.previsions || []).filter((p) => has((p.f || {}).operateurs)).length; const alertes = (db.alertes || []).filter((a) => has(a.decidePar)).length;
  return { ops, hygiene, previsions, alertes, total: ops + hygiene + previsions + alertes };
}
function operateurSave(db, s, id) {
  if (!Array.isArray(db.operateurs)) db.operateurs = [];
  const prenom = String(s.prenom || '').trim(); const nom = String(s.nom || '').trim();
  if (!prenom && !nom) return fail('Indiquez le prénom ou le nom de l’opérateur.');
  if (db.operateurs.some((o) => o && o.id !== id && operateurCle(o.prenom, o.nom) === operateurCle(prenom, nom))) return fail(`L’opérateur « ${[prenom, nom].filter(Boolean).join(' ')} » existe déjà.`);
  const item = { prenom, nom, initiales: String(s.initiales || '').trim().toUpperCase().replace(/[^A-ZÀ-Ý0-9]/g, '').slice(0, 4), fonction: String(s.fonction || '').trim(), contact: String(s.contact || '').trim(), notes: String(s.notes || ''), actif: s.actif !== false };
  let rid = id;
  if (id) { const o = operateurDe(db, id); if (!o) return fail('Opérateur introuvable.'); Object.assign(o, item); } // champs inconnus (versions plus récentes) conservés
  else { rid = nid(db, 'opr'); db.operateurs.push({ id: rid, ...item, creeLe: todayISO() }); }
  return okr({ id: rid });
}
function operateurActif(db, id, actif) { const o = operateurDe(db, id); if (!o) return fail('Opérateur introuvable.'); o.actif = !!actif; return okr(); }
function operateurDelete(db, id) {
  const o = operateurDe(db, id); if (!o) return fail('Opérateur introuvable.');
  const u = operateurUsage(db, id);
  if (u.total) return fail(`${operateurPlein(o)} figure dans ${u.total} enregistrement(s) (opérations, hygiène, opérations à réaliser, déclassements) : archivez-le plutôt, son historique est conservé.`);
  db.operateurs = db.operateurs.filter((x) => x.id !== id); return okr();
}

/* ---------- modules (onglets) : ordre et activation, réglage commun à tous les appareils de la base ----------
   settings.modulesOrdre = [ids] : ordre des onglets (un id inconnu — module d'une version plus récente — garde sa place) ;
   settings.modulesOff = [ids] : modules désactivés (onglet masqué, aucune donnée supprimée). « Paramètres » reste toujours actif.
   Un module ajouté par une version plus récente et absent de l'ordre enregistré se place après son voisin de l'ordre d'origine. */
const MODULES_DEFAUT = ['cuverie', 'pressoir', 'ops', 'previsions', 'plan', 'declass', 'tirage', 'cave', 'degorgement', 'analyses', 'intrants', 'hygiene', 'equipements', 'trace', 'registres', 'params'];
const MODULE_FIXE = 'params';
const estModule = (id) => MODULES_DEFAUT.includes(id);
function modulesOrdre(db) {
  const s = (db && db.settings) || {}; const brut = Array.isArray(s.modulesOrdre) ? s.modulesOrdre.filter((x) => typeof x === 'string' && x) : [];
  const out = brut.filter((x, i) => brut.indexOf(x) === i);
  MODULES_DEFAUT.forEach((id, i) => {
    if (out.includes(id)) return;
    let pos = -1; for (let j = i - 1; j >= 0 && pos < 0; j -= 1) pos = out.indexOf(MODULES_DEFAUT[j]);
    out.splice(pos + 1, 0, id);
  });
  return out;
}
const moduleActif = (db, id) => id === MODULE_FIXE || !((((db && db.settings) || {}).modulesOff) || []).includes(id);
// modules affichés dans l'onglet d'un autre module (0.27.0-alpha.2 : déclassements dans « Opérations & Assemblages ») : sans onglet ni
// place dans l'ordre ; leur activation et leurs droits restent (une version antérieure les affiche encore en onglet)
const MODULES_DANS = { declass: 'ops' };
const modulesConnus = (db) => modulesOrdre(db).filter((id) => estModule(id) && !MODULES_DANS[id]);
const modulesVisibles = (db) => modulesConnus(db).filter((id) => moduleActif(db, id));
const moduleAccueil = (db) => modulesVisibles(db)[0] || MODULE_FIXE;
/* ---------- onglets regroupés (0.34.0-alpha.1) : un onglet principal réunit plusieurs modules en sous-onglets ----------
   « Vinification » = Cuverie & Lots, Opérations & Assemblages, À réaliser & fiches, Plan de vinification (0.39.0-alpha.1, module « plan »). Chaque module garde son identifiant, son activation,
   ses droits et sa place dans l'ordre : l'onglet du groupe prend la place du premier de ses modules affichés (une version antérieure,
   qui ne connaît pas les groupes, affiche toujours les trois onglets séparés). */
const ONGLETS_GROUPES = { vinification: ['cuverie', 'ops', 'previsions', 'plan'] };
const ongletDe = (id) => Object.keys(ONGLETS_GROUPES).find((g) => ONGLETS_GROUPES[g].includes(id)) || id;
// modules affichés (déjà filtrés : actifs, autorisés) → onglets de la barre, dans l'ordre ; un groupe apparaît une seule fois
const ongletsBarre = (mods) => (Array.isArray(mods) ? mods : []).map(ongletDe).filter((x, i, a) => a.indexOf(x) === i);
const ongletMembres = (onglet, mods) => (ONGLETS_GROUPES[onglet] ? (Array.isArray(mods) ? mods : []).filter((m) => ONGLETS_GROUPES[onglet].includes(m)) : [onglet]);
/* onglet ouvert au démarrage, à la connexion et au déverrouillage (0.34.0-alpha.1 ; 0.47.0-alpha.3 : un réglage par moment) — réglages
   communs de la base, ignorés s'ils ne sont pas affichés (module désactivé, profil sans accès) :
   - démarrage : settings.ongletDefaut (absent = premier onglet de la barre ; seul réglage lu par les versions antérieures, au démarrage
     et à la connexion ; « derniere » y retombe sur le premier onglet) ;
   - connexion : settings.ongletConnexion (absent = comme au démarrage) ;
   - déverrouillage : settings.ongletDeverrouillage (absent = dernière page visitée : la page en cours reste, formulaire intact) ;
   valeurs : identifiant d'onglet ou de groupe, « premier » (premier onglet de la barre), « derniere » (dernière page visitée par la
   personne sur cet appareil, retenue hors de la base : oenotrack-derniere-page), « demarrage » (comme au démarrage). */
const ONGLET_MOMENTS = [['demarrage', 'ongletDefaut', 'Au démarrage'], ['connexion', 'ongletConnexion', 'À la connexion'], ['deverrouillage', 'ongletDeverrouillage', 'Au déverrouillage']];
const ONGLET_SPECIAUX = ['premier', 'derniere', 'demarrage'];
const ongletCle = (moment) => (ONGLET_MOMENTS.find((x) => x[0] === moment) || ONGLET_MOMENTS[0])[1];
// réglage effectif d'un moment : « premier », « derniere » ou un onglet (les valeurs par défaut résolues)
function ongletReglage(db, moment) {
  const S = (db && db.settings) || {}; const m = moment || 'demarrage'; let v = String(S[ongletCle(m)] || '');
  if (m === 'demarrage') return !v || v === 'demarrage' ? 'premier' : v;
  if (!v) v = m === 'deverrouillage' ? 'derniere' : 'demarrage';
  return v === 'demarrage' ? ongletReglage(db, 'demarrage') : v;
}
// module à ouvrir (pour un groupe : son premier module affiché) ; derniere = { tab, sub } retenu sur cet appareil (ou null)
function ongletOuverture(db, mods, moment, derniere) {
  return ongletOuvertureNav(db, mods, moment, derniere).tab;
}
function ongletOuvertureNav(db, mods, moment, derniere) {
  const L = Array.isArray(mods) ? mods : modulesVisibles(db); let pref = ongletReglage(db, moment);
  if (pref === 'derniere') {
    if (derniere && derniere.tab && L.includes(derniere.tab)) return { tab: derniere.tab, sub: derniere.sub || null, derniere: true };
    pref = moment && moment !== 'demarrage' && ongletReglage(db, 'demarrage') !== 'derniere' ? ongletReglage(db, 'demarrage') : 'premier';
  }
  const m = pref && pref !== 'premier' ? ongletMembres(pref, L).filter((x) => L.includes(x)) : [];
  return { tab: m[0] || L[0] || MODULE_FIXE, sub: null };
}
function ongletDefautSet(db, id, moment) {
  const v = String(id || ''); const m = moment || 'demarrage';
  if (!ONGLET_MOMENTS.some((x) => x[0] === m)) return fail('Moment inconnu.');
  if (v === 'demarrage' && m === 'demarrage') return fail('Onglet inconnu.');
  if (v && !ONGLET_SPECIAUX.includes(v) && !ONGLETS_GROUPES[v] && !estModule(v)) return fail('Onglet inconnu.');
  if (v && MODULES_DANS[v]) return fail('Ce module n’a pas d’onglet propre.');
  const k = ongletCle(m); const defaut = m === 'demarrage' ? (v === 'premier' || !v) : m === 'connexion' ? (!v || v === 'demarrage') : (!v || v === 'derniere');
  if (defaut) delete db.settings[k]; else db.settings[k] = v; return okr();
}
// nouvel ordre des modules connus ; les ids inconnus restent à leur place
function modulesOrdonner(db, ids) {
  const full = modulesOrdre(db); const nv = (Array.isArray(ids) ? ids : []).filter((x, i, a) => estModule(x) && a.indexOf(x) === i);
  full.filter(estModule).forEach((x) => { if (!nv.includes(x)) nv.push(x); });
  let k = 0; db.settings.modulesOrdre = full.map((x) => (estModule(x) ? nv[k++] : x)); return okr();
}
function moduleDeplacer(db, id, delta) {
  const c = modulesConnus(db); const i = c.indexOf(id); if (i < 0) return fail('Module inconnu.');
  const j = Math.max(0, Math.min(c.length - 1, i + delta)); if (j === i) return okr();
  c.splice(i, 1); c.splice(j, 0, id); return modulesOrdonner(db, c);
}
function moduleActiver(db, id, actif) {
  if (id === MODULE_FIXE) return fail('Le module « Paramètres » reste toujours actif : c’est là qu’on réactive les autres.');
  if (!estModule(id)) return fail('Module inconnu.');
  const off = (Array.isArray(db.settings.modulesOff) ? db.settings.modulesOff : []).filter((x) => x !== id);
  if (!actif) off.push(id);
  db.settings.modulesOff = off; return okr();
}
function modulesReinitialiser(db, quoi) { // 'ordre' | 'activation' | (les deux)
  if (quoi !== 'activation') delete db.settings.modulesOrdre;
  if (quoi !== 'ordre') delete db.settings.modulesOff;
  return okr();
}

/* ---------- apparence (couleurs des contenants) ---------- */
function apparenceSet(db, patch) { db.apparence = { ...db.apparence, ...patch }; return okr(); }

/* ---------- fractions de moût (cuvée, tailles, rebêche, lies, bourbes… : liste personnalisable) ---------- */
function fractionCont(db, op, id, patch) {
  if (!Array.isArray(db.lists.fractions) || !db.lists.fractions.length) db.lists.fractions = DEFAULT_FRACTIONS();
  const L = db.lists.fractions; const lab = String((patch && patch.label) || '').trim();
  const sfx = String((patch && patch.suffix) || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  if (op === 'add') {
    if (!lab) return fail('Libellé de la fraction requis.'); if (L.some((x) => norm(x.label) === norm(lab))) return fail('Cette fraction existe déjà.');
    if (sfx && L.some((x) => x.suffix === sfx)) return fail(`Le suffixe « ${sfx} » est déjà utilisé par une autre fraction.`);
    L.push({ id: nid(db, 'fr'), label: lab, suffix: sfx, pressurage: patch.pressurage !== false, role: fracRoleOk(patch.role) ? patch.role : fracRoleDevine(lab) }); return okr();
  }
  const i = L.findIndex((x) => x.id === id); const it = L[i]; if (!it) return fail('Fraction introuvable.');
  if (op === 'edit') {
    if (patch.label != null) { if (!lab) return fail('Libellé requis.'); if (L.some((x) => x.id !== id && norm(x.label) === norm(lab))) return fail('Ce libellé existe déjà.'); it.label = lab; }
    if (patch.suffix != null) { if (sfx && L.some((x) => x.id !== id && x.suffix === sfx)) return fail(`Le suffixe « ${sfx} » est déjà utilisé.`); it.suffix = sfx; }
    if (patch.pressurage != null) it.pressurage = !!patch.pressurage;
    if (patch.role != null) { if (!fracRoleOk(patch.role)) return fail('Rôle de la fraction inconnu.'); it.role = patch.role; } // 0.38.0-alpha.3
    return okr();
  }
  if (op === 'up' || op === 'down') { const j = op === 'up' ? i - 1 : i + 1; if (j < 0 || j >= L.length) return okr(); [L[i], L[j]] = [L[j], L[i]]; return okr(); }
  if (op === 'del') { const n = listUsage(db, 'fractions', id); if (n) return fail(`Fraction utilisée ${n} fois : renommez-la plutôt que de la supprimer.`); if (L.length <= 1) return fail('Gardez au moins une fraction.'); db.lists.fractions = L.filter((x) => x.id !== id); return okr(); }
  if (op === 'reset') { DEFAULT_FRACTIONS().forEach((d) => { if (!L.some((x) => x.id === d.id)) L.push(d); }); return okr(); }
  return fail('Action inconnue.');
}

/* ---------- types de contenants & matières (atelier de personnalisation) ---------- */
function typeCont(db, op, id, patch) {
  const L = db.lists.typesContenant; const lab = String((patch && patch.label) || '').trim();
  if (op === 'add') { if (!lab) return fail('Libellé requis.'); if (L.some((x) => norm(x.label) === norm(lab))) return fail('Ce type existe déjà.'); L.push({ id: nid(db, 'tc'), label: lab, forme: patch.forme || 'cuve' }); return okr(); }
  const it = L.find((x) => x.id === id); if (!it) return fail('Type introuvable.');
  if (op === 'edit') { if (patch.label != null) { if (!lab) return fail('Libellé requis.'); if (L.some((x) => x.id !== id && norm(x.label) === norm(lab))) return fail('Ce libellé existe déjà.'); it.label = lab; } if (patch.forme) it.forme = patch.forme; return okr(); }
  if (op === 'del') { const n = listUsage(db, 'typesContenant', id); if (n) return fail(`Utilisé par ${n} contenant(s) : renommez-le plutôt.`); db.lists.typesContenant = L.filter((x) => x.id !== id); return okr(); }
  return fail('Action inconnue.');
}
function matiereCont(db, op, id, patch) {
  const L = db.lists.matieres; const lab = String((patch && patch.label) || '').trim();
  if (op === 'add') { if (!lab) return fail('Libellé requis.'); if (L.some((x) => norm(x.label) === norm(lab))) return fail('Cette matière existe déjà.'); L.push({ id: nid(db, 'ma'), label: lab, couleur: patch.couleur || '#B9C4CC', finition: patch.finition || 'lisse' }); return okr(); }
  const it = L.find((x) => x.id === id); if (!it) return fail('Matière introuvable.');
  if (op === 'edit') { if (patch.label != null) { if (!lab) return fail('Libellé requis.'); if (L.some((x) => x.id !== id && norm(x.label) === norm(lab))) return fail('Ce libellé existe déjà.'); it.label = lab; } if (patch.couleur) it.couleur = patch.couleur; if (patch.finition) it.finition = patch.finition; return okr(); }
  if (op === 'del') { const n = listUsage(db, 'matieres', id); if (n) return fail(`Utilisée par ${n} contenant(s) : renommez-la plutôt.`); db.lists.matieres = L.filter((x) => x.id !== id); return okr(); }
  return fail('Action inconnue.');
}

/* ============ CRUD simples : contenants, produits, arrivages, listes, analyses, hygiène ============ */
function contSave(db, s, id) {
  const nom = String(s.nom || '').trim();
  if (!nom) return fail('Le nom du contenant est obligatoire.');
  if (nameTaken(db.contenants, nom, id)) return fail(`Le nom « ${nom} » est déjà utilisé : il doit être unique.`);
  if (!(num(s.volMax) > 0)) return fail('Le volume maximal doit être supérieur à 0 L.');
  const siteId = s.siteId && db.sites.some((x) => x.id === s.siteId) ? s.siteId : (db.sites[0] || {}).id;
  const item = { nom, type: s.type, matiere: s.matiere, annee: s.annee ? parseInt(s.annee, 10) : null, volMax: num(s.volMax), statut: s.statut || 'actif', notes: s.notes || '', siteId };
  if (s.fabricant !== undefined) item.fabricant = String(s.fabricant || '').trim(); // 0.17.0-alpha.1 (champ absent = inchangé : imports, anciennes versions)
  if (id) {
    const c = db.contenants.find((x) => x.id === id); if (!c) return fail('Contenant introuvable.');
    const moved = c.siteId !== siteId;
    Object.assign(c, item); if (moved) { c.x = null; c.y = null; planAuto(db, siteId, true); }
    return okr({ id });
  }
  const c = { id: nid(db, 'ct'), ...item, x: null, y: null }; db.contenants.push(c); planAuto(db, siteId, true);
  return okr({ id: c.id }); // identifiant renvoyé : barème enregistré avec le contenant (0.22.0-alpha.1)
}
function contDelete(db, id) {
  const used = db.ops.some((o) => JSON.stringify(o).includes(`"${id}"`)) || db.analyses.some((a) => a.contenantId === id) || db.hygiene.some((h) => h.cibleType === 'contenant' && h.cibleId === id);
  if (used) return fail('Ce contenant a un historique : archivez-le plutôt que de le supprimer.');
  db.contenants = db.contenants.filter((c) => c.id !== id); (db.baremes || []).forEach((b) => { if (b.contenantId === id) b.contenantId = ''; }); return okr();
}

function fournisseurSave(db, s, id) {
  const nom = String(s.nom || '').trim(); if (!nom) return fail('Nom du fournisseur requis.');
  if (nameTaken(db.fournisseurs, nom, id)) return fail('Ce fournisseur existe déjà.');
  const roles = Array.isArray(s.roles) ? uniq(s.roles.filter((r) => typeof r === 'string' && r)) : undefined; // rôles (0.42.0-alpha.2 : prestataire de tirage)
  if (id) Object.assign(db.fournisseurs.find((x) => x.id === id), { nom, contact: s.contact || '', ...(roles ? { roles } : {}) }); else db.fournisseurs.push({ id: nid(db, 'fo'), nom, contact: s.contact || '', ...(roles && roles.length ? { roles } : {}) });
  return okr();
}
function fournisseurDelete(db, id) {
  if (db.produits.some((p) => p.fournisseurId === id) || db.arrivages.some((a) => a.fournisseurId === id)) return fail('Fournisseur utilisé par des produits ou des arrivages.');
  db.fournisseurs = db.fournisseurs.filter((f) => f.id !== id); return okr();
}

function produitSave(db, s, id) {
  const nom = String(s.nom || '').trim(); if (!nom) return fail('Nom du produit requis.');
  if (nameTaken(db.produits, nom, id)) return fail(`Le produit « ${nom} » existe déjà.`);
  const item = { nom, categorie: s.categorie, unite: s.unite, fournisseurId: s.fournisseurId || '', actif: s.actif !== false, notes: s.notes || '' };
  // 0.20.0-alpha.1 : référence, page du produit chez le fournisseur, FDS non requise (champs repris seulement s'ils sont fournis)
  if (s.reference !== undefined) item.reference = String(s.reference || '').trim().slice(0, 60);
  if (s.lien !== undefined) { const l = String(s.lien || '').trim(); if (l && !lienNorm(l)) return fail('Lien du produit : adresse web invalide (ex. https://www.fournisseur.fr/produit).'); item.lien = lienNorm(l); }
  if (s.fdsNonRequise !== undefined) item.fdsNonRequise = !!s.fdsNonRequise;
  // 0.40.0-alpha.1 : fiche technique et FDS en ligne (site du fournisseur)
  for (const k of ['ftUrl', 'fdsUrl']) { if (s[k] !== undefined) { const l = String(s[k] || '').trim(); if (l && !lienNorm(l)) return fail('Lien de la fiche technique ou de la FDS : adresse web invalide.'); item[k] = lienNorm(l); } }
  // 0.26.0-alpha.1 : informations du produit (FT, FDS), reprises seulement si elles sont fournies
  PRODUIT_INFOS.forEach(([k, , max]) => { if (s[k] !== undefined) item[k] = String(s[k] == null ? '' : s[k]).trim().slice(0, max); });
  // 0.30.0-alpha.1 : famille (catalogues), teneur en SO₂ (« 150 g/L », « 0,5 g/g », « 5 g/u ») pour l'estimation du SO₂ total
  if (s.famille !== undefined) item.famille = CAT_FAM[s.famille] ? s.famille : '';
  if (s.so2 !== undefined) { const t = String(s.so2 || '').trim().replace(/\s+/g, ' '); if (t && !/^\d+(?:[.,]\d+)?\s*(g|mg)\s*\/\s*(L|mL|kg|g|u)$/i.test(t)) return fail('Teneur en SO₂ : indiquez par exemple « 150 g/L », « 0,5 g/g » ou « 5 g/u ».'); item.so2 = t; }
  // 0.36.0-alpha.1 : allergènes à cocher (liste ALLERGENES), « aucun allergène » ; choix Oui / Non par revendication = règles du produit
  if (s.allergenesListe !== undefined) { const L = (Array.isArray(s.allergenesListe) ? s.allergenesListe : []).filter((x) => allergeneDef(x)); item.allergenesListe = ALLERGENES.map((a) => a[0]).filter((x) => L.includes(x)); }
  // 0.40.0-alpha.1 : composés actifs (référentiel réglementaire) choisis à la main ; null = devinés d'après le nom
  if (s.composes !== undefined && s.composes !== null) { item.composes = uniq((Array.isArray(s.composes) ? s.composes : []).map((x) => x && x.id).filter((x) => typeof refCompose !== 'function' || refCompose(x))).map((cid) => { const x = s.composes.find((y) => y.id === cid); return hasNum(x.part) && num(x.part) > 0 && num(x.part) <= 1 ? { id: cid, part: num(x.part) } : { id: cid }; }); }
  // 0.42.0-alpha.3 : fourniture de tirage (type, caractéristiques) et suivi du stock (false = suivi par lot fournisseur sans décompte)
  if (s.fourniture !== undefined) { const fo = fournitureSpec(s.fourniture); if (fo) item.fourniture = fo; else if (s.fourniture === null) item.fourniture = undefined; }
  if (s.suiviStock !== undefined) item.suiviStock = s.suiviStock !== false;
  if (s.allergenesAucun !== undefined) item.allergenesAucun = !!s.allergenesAucun && !(item.allergenesListe || []).length;
  if (id) { const p = db.produits.find((x) => x.id === id); if (!p) return fail('Produit introuvable.'); Object.assign(p, item); if (s.composes === null) delete p.composes; if (item.fourniture === undefined && 'fourniture' in item) delete p.fourniture; if (s.revendications) revendicationsAppliquer(db, id, s.revendications, { uid: s.uid }); return okr({ id }); }
  const pid = nid(db, 'pr'); if (item.fourniture === undefined) delete item.fourniture; db.produits.push({ id: pid, ...item });
  QUALIFS.forEach((q) => db.regles.push({ produitId: pid, qualifId: q.id, autorise: q.id === 'conv', doseMax: null }));
  if (s.revendications) revendicationsAppliquer(db, pid, s.revendications, { uid: s.uid });
  return okr({ id: pid });
}
function produitDelete(db, id) {
  if (db.arrivages.some((a) => a.produitId === id) || JSON.stringify(db.ops).includes(`"produitId":"${id}"`)) return fail('Produit utilisé (arrivages ou opérations) : désactivez-le plutôt.');
  const docs = (db.docs || []).filter((x) => x && x.cible && x.cible.type === 'produit' && x.cible.id === id).map((x) => x.id); // FT, FDS… du produit (0.20.0-alpha.1)
  db.produits = db.produits.filter((p) => p.id !== id); db.regles = db.regles.filter((r) => r.produitId !== id); if (docs.length) db.docs = db.docs.filter((x) => !docs.includes(x.id)); return okr({ docs });
}
function regleSet(db, produitId, qualifId, patch) {
  let r = db.regles.find((x) => x.produitId === produitId && x.qualifId === qualifId);
  if (!r) { r = { produitId, qualifId, autorise: false, doseMax: null }; db.regles.push(r); }
  Object.assign(r, patch); return okr();
}

function arrivageSave(db, s, id) {
  if (!s.produitId) return fail('Choisissez un produit.');
  if (!isoOK(s.date)) return fail('Date d’arrivage invalide.');
  if (!(num(s.qty) > 0)) return fail('Quantité reçue : valeur supérieure à 0 requise.');
  if (!String(s.numLot || '').trim()) return fail('Le numéro de lot fournisseur est obligatoire pour la traçabilité.');
  if (isLocked(db, s.date)) return fail('Cette date appartient à une campagne figée.');
  const pr = db.produits.find((p) => p.id === s.produitId);
  const item = { produitId: s.produitId, fournisseurId: s.fournisseurId || (pr && pr.fournisseurId) || '', numLot: String(s.numLot).trim(), dluo: s.dluo || '', date: s.date, qty: num(s.qty), notes: s.notes || '' };
  if (id) { const a = db.arrivages.find((x) => x.id === id); if (!a) return fail('Arrivage introuvable.'); if (isLocked(db, a.date)) return fail('Arrivage verrouillé (campagne figée).'); Object.assign(a, item); }
  else { const aid = nid(db, 'ar'); db.arrivages.push({ id: aid, ...item }); return okr({ id: aid }); }
  return okr({ id });
}
function arrivageDelete(db, id) {
  const a = db.arrivages.find((x) => x.id === id); if (!a) return fail('Arrivage introuvable.');
  if (isLocked(db, a.date)) return fail('Arrivage verrouillé (campagne figée).');
  if (JSON.stringify(db.ops).includes(`"arrivageId":"${id}"`)) return fail('Cet arrivage a déjà été utilisé dans des opérations.');
  if ((db.regulStocks || []).some((x) => x && x.arrivageId === id)) return fail('Cet arrivage a des régularisations de stock : supprimez-les d’abord (la trace d’inventaire est gardée).'); // 0.38.0-alpha.3
  db.arrivages = db.arrivages.filter((x) => x.id !== id); db.docs = (db.docs || []).filter((x) => !(x.cible && x.cible.type === 'arrivage' && x.cible.id === id)); return okr();
}

/* ---------- stades du vin, couleurs du vin, échelle des crus : listes personnalisables ---------- */
const RICH_DEFAULTS = { stades: DEFAULT_STADES, couleursVin: DEFAULT_COULEURS_VIN, echelles: DEFAULT_ECHELLES, qualifs: DEFAULT_QUALIFS };
const RICH_NOMS = { stades: 'stade', couleursVin: 'couleur', echelles: 'niveau', qualifs: 'revendication' };
function richListCont(db, key, op, id, patch) {
  if (key === 'qualifs') return qualifListCont(db, op, id, patch);
  if (!Array.isArray(db.lists[key]) || !db.lists[key].length) db.lists[key] = RICH_DEFAULTS[key]();
  const L = db.lists[key]; const nom = RICH_NOMS[key]; patch = patch || {};
  const lab = String(patch.label || '').trim(); const hex = (c) => /^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : null;
  const renum = () => { if (key === 'echelles') L.forEach((x, i) => { x.rang = i + 1; }); };
  const apply = (it) => {
    if (patch.label != null) { if (!lab) return 'Libellé requis.'; if (L.some((x) => x !== it && norm(x.label) === norm(lab))) return 'Ce libellé existe déjà.'; it.label = lab; }
    if (patch.court != null) it.court = String(patch.court).trim().slice(0, 14);
    if (patch.un != null) it.un = String(patch.un).trim() || it.label;
    if (patch.couleur != null && hex(patch.couleur)) it.couleur = patch.couleur;
    if (patch.phase != null) it.phase = patch.phase;
    if (patch.role != null) { if (patch.role) L.forEach((x) => { if (x !== it && x.role === patch.role) x.role = ''; }); it.role = patch.role; }
    if (patch.masque != null) it.masque = !!patch.masque;
    if (patch.melange != null) { if (patch.melange) L.forEach((x) => { x.melange = false; }); it.melange = !!patch.melange; }
    return null;
  };
  if (op === 'add') {
    if (!lab) return fail(`Libellé du ${nom} requis.`); if (L.some((x) => norm(x.label) === norm(lab))) return fail('Cet élément existe déjà.');
    let base = norm(lab).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20) || 'x'; let nidv = base; let k = 2; while (L.some((x) => x.id === nidv)) { nidv = `${base}_${k}`; k += 1; }
    const it = { id: nidv, label: lab, couleur: hex(patch.couleur) || '#8C9792' };
    if (key === 'stades') Object.assign(it, { court: String(patch.court || lab).trim().slice(0, 14), phase: patch.phase || 'vin', role: '' });
    if (key === 'echelles') Object.assign(it, { un: String(patch.un || lab).trim(), court: String(patch.court || lab.slice(0, 4)).trim().toUpperCase().slice(0, 6), rang: L.length + 1 });
    const pos = patch.after ? L.findIndex((x) => x.id === patch.after) : -1;
    if (pos >= 0) L.splice(pos + 1, 0, it); else L.push(it); renum(); return okr({ id: nidv });
  }
  const i = L.findIndex((x) => x.id === id); const it = L[i]; if (!it) return fail('Élément introuvable.');
  if (op === 'edit') { const e = apply(it); return e ? fail(e) : okr(); }
  if (op === 'up' || op === 'down') { const j = op === 'up' ? i - 1 : i + 1; if (j < 0 || j >= L.length) return okr(); [L[i], L[j]] = [L[j], L[i]]; renum(); return okr(); }
  if (op === 'del') {
    const n = listUsage(db, key, id); if (n) return fail(`Utilisé ${n} fois : renommez-le ou masquez-le plutôt que de le supprimer.`);
    if (L.length <= 1) return fail('Gardez au moins un élément.'); db.lists[key] = L.filter((x) => x.id !== id); if (key === 'echelles') db.lists[key].forEach((x, k) => { x.rang = k + 1; });
    if (key === 'stades') db.lists.stadesMelanges = stadeMelanges(db).filter((r) => r.a !== id && r.b !== id && r.r !== id);
    return okr();
  }
  return fail('Action inconnue.');
}
/* ---------- revendications (0.18.0-alpha.1) : ajout (rang choisi, règles d'intrants copiées), nom, abréviation, couleur, ordre, masquage ---------- */
// usages d'une revendication : lots (et leur composition), opérations, lots finis, opérations à réaliser, formulaires, déclassements
function qualifUsage(db, id) {
  const e = String(id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const reV = new RegExp(`"(?:qualif|qualifId|prepQualif|defaut)":"${e}"`, 'g'); const reK = new RegExp(`"qualifs":\\{[^{}]*"${e}":`, 'g');
  const n = (arr) => { const s = JSON.stringify(arr || []); return (s.match(reV) || []).length + (s.match(reK) || []).length; };
  return n(db.lots) + n(db.ops) + n(db.lotsFinis) + n(db.previsions) + n(db.formulaires) + n(db.apporteurs) + n(db.parcelles) + (db.alertes || []).filter((a) => a.from === id || a.to === id).length;
}
function qualifListCont(db, op, id, patch) {
  patch = patch || {};
  const cols = () => { if (!db.apparence) db.apparence = DEFAULT_APPARENCE(); if (!db.apparence.qualifColors) db.apparence.qualifColors = {}; return db.apparence.qualifColors; };
  if (!Array.isArray(db.lists.qualifs) || !db.lists.qualifs.length) db.lists.qualifs = qualifList(db).map((x) => ({ ...x, couleur: cols()[x.id] || x.couleur }));
  const L0 = db.lists.qualifs.filter((x) => x && typeof x === 'object' && x.id); const conv = L0.find((x) => x.id === 'conv') || DEFAULT_QUALIFS()[0];
  const L = db.lists.qualifs = [conv, ...L0.filter((x) => x.id !== 'conv')]; // « conv » (rang 1) toujours en tête
  const hex = (c) => (/^#[0-9a-f]{6}$/i.test(String(c || '')) ? c : null);
  const lab = String(patch.label == null ? '' : patch.label).trim().replace(/\s+/g, ' ').slice(0, 40);
  const court = (v, l) => String(v || l || '').trim().toUpperCase().replace(/\s+/g, ' ').slice(0, 8);
  const fini = (r) => { syncQualifs(db); return r; };
  if (op === 'add') {
    if (!lab) return fail('Nom de la revendication requis.');
    if (L.some((x) => norm(x.label) === norm(lab))) return fail('Cette revendication existe déjà.');
    const base = norm(lab).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 20) || 'rev'; let nidv = base; let k = 2;
    while (nidv === 'conv' || L.some((x) => x.id === nidv) || qualifUsage(db, nidv)) { nidv = `${base}_${k}`; k += 1; }
    const couleur = hex(patch.couleur) || '#8C9792';
    const it = { id: nidv, label: lab, court: court(patch.court, lab.slice(0, 4)), couleur };
    const pos = patch.after ? L.findIndex((x) => x.id === patch.after) : -1;
    if (pos >= 0) L.splice(pos + 1, 0, it); else L.push(it);
    cols()[nidv] = couleur;
    // règles des intrants : copiées d'une revendication existante (sinon rien n'est autorisé : à régler dans Intrants › Produits & règles)
    const src = patch.copieDe && L.some((x) => x.id === patch.copieDe && x.id !== nidv) ? patch.copieDe : null;
    if (!Array.isArray(db.regles)) db.regles = [];
    const copies = src ? db.regles.filter((r) => r.qualifId === src).map((r) => ({ ...r, qualifId: nidv })) : [];
    copies.forEach((r) => db.regles.push(r));
    return fini(okr({ id: nidv, regles: copies.length }));
  }
  const i = L.findIndex((x) => x.id === id); const it = L[i]; if (!it) return fail('Revendication introuvable.');
  if (op === 'edit') {
    if (patch.label != null) { if (!lab) return fail('Nom de la revendication requis.'); if (L.some((x) => x !== it && norm(x.label) === norm(lab))) return fail('Ce nom est déjà pris par une autre revendication.'); it.label = lab; }
    if (patch.court != null) it.court = court(patch.court, String(it.label).slice(0, 4));
    if (patch.couleur != null && hex(patch.couleur)) { it.couleur = patch.couleur; cols()[it.id] = patch.couleur; }
    if (patch.masque != null) { if (it.id === 'conv' && patch.masque) return fail(`« ${it.label} » (rang 1) reste toujours proposée.`); if (patch.masque) it.masque = true; else delete it.masque; }
    return fini(okr());
  }
  if (op === 'up' || op === 'down') {
    if (it.id === 'conv') return fail(`« ${it.label} » reste au rang 1 (le plus bas).`);
    const j = op === 'up' ? i - 1 : i + 1; if (j < 1 || j >= L.length) return okr();
    [L[i], L[j]] = [L[j], L[i]]; return fini(okr());
  }
  if (op === 'del') {
    if (it.id === 'conv') return fail(`« ${it.label} » (rang 1) ne se supprime pas : renommez-la si besoin.`);
    const n = qualifUsage(db, id); if (n) return fail(`« ${it.label} » est utilisée ${n} fois (lots, opérations, déclassements…) : masquez-la plutôt que de la supprimer.`);
    db.lists.qualifs = L.filter((x) => x.id !== id); db.regles = (db.regles || []).filter((r) => r.qualifId !== id);
    if (db.apparence && db.apparence.qualifColors) delete db.apparence.qualifColors[id];
    return fini(okr());
  }
  return fail('Action inconnue.');
}

/* ---------- mélanges de stades (assemblages) : règles « A + B = résultat » et règle par défaut ---------- */
function stadeMelangeSave(db, i, r) {
  const L = stadeMelanges(db).map((x) => ({ ...x }));
  if (!stadeDef(db, r.a) || !stadeDef(db, r.b) || !stadeDef(db, r.r)) return fail('Choisissez les deux stades mélangés et le stade obtenu.');
  if (r.a === r.b) return fail('Choisissez deux stades différents (un même stade reste inchangé).');
  if (L.some((x, k) => k !== i && ((x.a === r.a && x.b === r.b) || (x.a === r.b && x.b === r.a)))) return fail('Une règle existe déjà pour ces deux stades.');
  const it = { ...(i != null && L[i] ? L[i] : {}), a: r.a, b: r.b, r: r.r }; if (i != null && L[i]) L[i] = it; else L.push(it);
  db.lists.stadesMelanges = L; return okr();
}
function stadeMelangeDelete(db, i) { db.lists.stadesMelanges = stadeMelanges(db).filter((_, k) => k !== i); return okr(); }
function stadeMelangeReset(db) { const L = stadeMelanges(db).map((x) => ({ ...x })); DEFAULT_STADES_MELANGES().forEach((d) => { if (stadeDef(db, d.a) && stadeDef(db, d.b) && stadeDef(db, d.r) && !L.some((x) => (x.a === d.a && x.b === d.b) || (x.a === d.b && x.b === d.a))) L.push(d); }); db.lists.stadesMelanges = L; return okr(); }

/* ---------- catalogue des opérations : variantes et opérations personnalisées ---------- */
function opCatUsage(db, id) {
  const x = opDef(db, id); if (!x) return 0; const own = (o) => (o.sousType ? o.sousType === id : o.type === id);
  return db.ops.filter(own).length + (db.previsions || []).filter((p) => (p.f && p.f.sousType ? p.f.sousType === id : p.type === id)).length;
}
const opCatEnsure = (db) => { if (!Array.isArray(db.lists.operations) || !db.lists.operations.length) db.lists.operations = DEFAULT_OPERATIONS(); return db.lists.operations; };
// x : { id?, label, base, groupe, icone, aide, motif, stadeAuto, ficheId, masque, menu } · opts.fiche : modèle de fiche à créer avec l'opération
function opCatSave(db, x, opts) {
  opts = opts || {}; const L = opCatEnsure(db); const label = String(x.label || '').trim().slice(0, 60);
  if (!label) return fail('Le nom de l’opération est obligatoire.');
  const i = x.id ? L.findIndex((y) => y.id === x.id) : -1; const cur = i >= 0 ? L[i] : null;
  if (x.id && !cur) return fail('Opération introuvable.');
  const base = cur ? cur.base : x.base;
  if (!cur && !OP_COMPORTEMENTS.some((c) => c[0] === base)) return fail('Choisissez le comportement de l’opération.');
  const dup = L.find((y) => y !== cur && norm(y.label) === norm(label)); if (dup) return fail(`Une opération « ${dup.label} » existe déjà.`);
  const sa = x.stadeAuto || (cur && cur.stadeAuto) || null;
  if (sa && sa.actif && !stadeDef(db, sa.stade)) return fail('Choisissez le stade appliqué automatiquement (ou désactivez le changement de stade).');
  const it = { ...(cur || {}), ...x, label, base, groupe: String(x.groupe || (cur && cur.groupe) || OP_GROUPES[1]).trim() || OP_GROUPES[1] };
  ['icone', 'aide', 'motif'].forEach((k) => { if (it[k] != null) it[k] = String(it[k]).trim().slice(0, k === 'aide' ? 400 : k === 'icone' ? 3 : 80); if (it[k] === '') delete it[k]; });
  if (sa) it.stadeAuto = { actif: !!sa.actif, stade: sa.stade || '' };
  if (!cur) {
    let slug = norm(label).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 24) || 'op'; let id = `perso_${slug}`; let k = 2;
    while (L.some((y) => y.id === id) || OP_LABELS0[id]) { id = `perso_${slug}_${k}`; k += 1; }
    it.id = id; it.custom = true; if (it.menu == null) it.menu = OP_BASES_VISIBLES_MENU.includes(base);
    if (opts.fiche) {
      if (!db.modelesFiches) db.modelesFiches = []; const fid = `fiche_${id}`;
      const pre = (norm(label).replace(/[^a-z]/g, '').toUpperCase().slice(0, 3) || 'OP');
      db.modelesFiches.push({ ...clone(opts.fiche), id: fid, titre: label, prefixe: pre, version: '1', creeLe: todayISO(), modifieLe: todayISO(), types: [id], auto: id });
      it.ficheId = fid;
    }
    let pos = -1; L.forEach((y, k2) => { if (y.groupe === it.groupe) pos = k2; }); if (pos >= 0) L.splice(pos + 1, 0, it); else L.push(it);
    syncOps(db); return okr({ id: it.id });
  }
  L[i] = it; syncOps(db); return okr({ id: it.id });
}
function opCatDelete(db, id) {
  const L = opCatEnsure(db); const x = L.find((y) => y.id === id); if (!x) return fail('Opération introuvable.');
  if (!x.custom) return fail('Une opération d’origine ne se supprime pas : masquez-la.');
  const n = opCatUsage(db, id); if (n) return fail(`Suppression impossible : ${n} opération(s) enregistrée(s) ou à réaliser l’utilisent. Masquez-la plutôt.`);
  db.lists.operations = L.filter((y) => y.id !== id);
  db.formulaires = (db.formulaires || []).filter((y) => y.id !== id); // son formulaire personnalisé
  if (x.ficheId) db.modelesFiches = (db.modelesFiches || []).filter((t) => !(t.id === x.ficheId && t.auto === id && !(db.fiches || []).some((f) => f.modele === t.id)));
  (db.modelesFiches || []).forEach((t) => { if (Array.isArray(t.types)) t.types = t.types.filter((k) => k !== id); });
  syncOps(db); return okr();
}
function opCatMove(db, id, dir) {
  const L = opCatEnsure(db); const i = L.findIndex((y) => y.id === id); if (i < 0) return fail('Opération introuvable.');
  const g = L[i].groupe; let j = i + dir; while (j >= 0 && j < L.length && L[j].groupe !== g) j += dir;
  if (j < 0 || j >= L.length) return okr(); [L[i], L[j]] = [L[j], L[i]]; return okr();
}
function opCatReset(db, id) {
  const D = DEFAULT_OPERATIONS().find((y) => y.id === id); if (!D) return fail('Seules les opérations d’origine peuvent être rétablies.');
  db.lists.operations = opCatEnsure(db).map((y) => (y.id === id ? { ...D } : y)); syncOps(db); return okr();
}

function richListReset(db, key) { if (!Array.isArray(db.lists[key])) db.lists[key] = []; RICH_DEFAULTS[key]().forEach((d) => { if (!db.lists[key].some((x) => x.id === d.id)) db.lists[key].push(d); }); return okr(); }
// préréglage régional d'échelle : remplace la liste ; les crus rangés dans un niveau disparu deviennent « non classés »
function echellePreset(db, presetId) {
  const p = ECHELLE_PRESETS.find((x) => x.id === presetId); if (!p) return fail('Préréglage inconnu.');
  db.lists.echelles = p.items.map((x) => ({ ...x })); const ids = p.items.map((x) => x.id); let n = 0;
  db.crus.forEach((c) => { if (c.echelle && !ids.includes(c.echelle)) { c.echelle = ''; n += 1; } });
  db.settings.echelleNom = p.titre; db.settings.echellePreset = p.id; return okr({ declasses: n });
}

/* ---------- listes modifiables ---------- */
function listAdd(db, key, label) {
  const l = String(label || '').trim(); if (!l) return fail('Libellé requis.');
  if ((db.lists[key] || []).some((x) => norm(x.label) === norm(l))) return fail('Cet élément existe déjà.');
  db.lists[key].push({ id: nid(db, 'li'), label: l }); return okr();
}
function listRename(db, key, id, label) {
  const l = String(label || '').trim(); if (!l) return fail('Libellé requis.');
  if (db.lists[key].some((x) => x.id !== id && norm(x.label) === norm(l))) return fail('Ce libellé existe déjà.');
  db.lists[key].find((x) => x.id === id).label = l; return okr();
}
function listRemove(db, key, id) {
  const n = listUsage(db, key, id); if (n > 0) return fail(`Utilisé ${n} fois : impossible de supprimer (renommez-le à la place).`);
  db.lists[key] = db.lists[key].filter((x) => x.id !== id); return okr();
}

/* ---------- analyses ---------- */
function analyseSave(db, s, id) {
  if (!s.lotId) return fail('Rattachez l’analyse à un lot.');
  if (!isoOK(s.date)) return fail('Date invalide.');
  if (isLocked(db, s.date)) return fail('Cette date appartient à une campagne figée.');
  const valeurs = {}; Object.keys(s.valeurs || {}).forEach((k) => { if (hasNum(s.valeurs[k])) valeurs[k] = num(s.valeurs[k]); });
  if (!Object.keys(valeurs).length) return fail('Saisissez au moins une valeur.');
  const item = { date: s.date, lotId: s.lotId, contenantId: s.contenantId || '', modeleId: s.modeleId || '', valeurs, notes: s.notes || '' };
  if (id) { const a = db.analyses.find((x) => x.id === id); if (isLocked(db, a.date)) return fail('Analyse verrouillée (campagne figée).'); Object.assign(a, item); } else db.analyses.push({ id: nid(db, 'an'), ...item });
  return okr();
}
function analyseDelete(db, id) { const a = db.analyses.find((x) => x.id === id); if (!a) return fail('Introuvable.'); if (isLocked(db, a.date)) return fail('Analyse verrouillée (campagne figée).'); db.analyses = db.analyses.filter((x) => x.id !== id); return okr(); }
function paramSave(db, s, id) {
  const nom = String(s.nom || '').trim(); if (!nom) return fail('Nom du paramètre requis.');
  if (nameTaken(db.analysesParams, nom, id)) return fail('Ce paramètre existe déjà.');
  const item = { nom, unite: s.unite || '', dec: clamp(parseInt(s.dec, 10) || 0, 0, 6) };
  if (id) Object.assign(db.analysesParams.find((p) => p.id === id), item); else db.analysesParams.push({ id: nid(db, 'pa'), ...item });
  return okr();
}
function paramDelete(db, id) {
  if (db.analyses.some((a) => a.valeurs && a.valeurs[id] != null)) return fail('Des analyses utilisent ce paramètre.');
  db.analysesParams = db.analysesParams.filter((p) => p.id !== id); db.analysesModeles.forEach((m) => { m.paramIds = m.paramIds.filter((x) => x !== id); }); return okr();
}
function modeleSave(db, s, id) {
  const nom = String(s.nom || '').trim(); if (!nom) return fail('Nom du modèle requis.');
  if (nameTaken(db.analysesModeles, nom, id)) return fail('Ce modèle existe déjà.');
  const item = { nom, etape: s.etape || '', paramIds: s.paramIds || [] };
  if (id) Object.assign(db.analysesModeles.find((m) => m.id === id), item); else db.analysesModeles.push({ id: nid(db, 'mo'), ...item });
  return okr();
}
function modeleDelete(db, id) { db.analysesModeles = db.analysesModeles.filter((m) => m.id !== id); return okr(); }

/* ---------- hygiène ---------- */
function hygieneSave(db, s, id) {
  if (!isoOK(s.date)) return fail('Date invalide.');
  if (!s.cibleId) return fail('Choisissez un contenant, un équipement ou un local.');
  if (isLocked(db, s.date)) return fail('Cette date appartient à une campagne figée.');
  // opérateurs choisis dans la liste (ids) ; le nom en clair reste dans « operateur » (lu par les versions antérieures)
  const ids = Array.isArray(s.operateurs) ? operateursValides(db, s.operateurs) : null;
  if (ids && !ids.length && (db.settings || {}).operateurObligatoire && !String(s.operateur || '').trim()) return fail('Indiquez qui a fait l’action (opérateur).');
  // produits d'hygiène choisis (0.18.0-alpha.1) : lignes { produitId, nom, conc, quantite } et méthode ; « produit » garde le résumé lisible (versions antérieures)
  const v19 = Array.isArray(s.produits) || s.methode != null; const lignes = v19 ? hygLignes(db, s.produits) : null;
  if (lignes && lignes.some((l) => (l.conc != null && l.conc < 0) || (l.quantite != null && l.quantite < 0))) return fail('Produits : concentration et quantité positives attendues.');
  const methode = v19 ? String(s.methode == null ? '' : s.methode).trim().slice(0, 500) : '';
  const texte = v19 ? hygResume(db, { produits: lignes, methode }, true) : (s.produit || '');
  const item = { date: s.date, cibleType: s.cibleType, cibleId: s.cibleId, actionId: s.actionId, produit: texte, operateur: ids && ids.length ? operateursNoms(db, ids) : (s.operateur || ''), notes: s.notes || '', ...(ids && ids.length ? { operateurs: ids } : {}), ...(v19 ? { produits: lignes, methode } : {}) };
  // plan d'hygiène (0.26.0-alpha.1) : contrôle après rinçage (pH, peroxyde, visuel), changement de revendication, ligne du plan suivie
  const ctl = s.controle && HYG_CONTROLES.some((c) => c[0] === s.controle.type) && s.controle.type !== 'aucun' ? { type: s.controle.type, ...(['conforme', 'non_conforme'].includes(s.controle.resultat) ? { resultat: s.controle.resultat } : {}), ...(String(s.controle.valeur || '').trim() ? { valeur: String(s.controle.valeur).trim().slice(0, 30) } : {}) } : null;
  const chg = s.changementRevendication && (s.changementRevendication === true || s.changementRevendication.vers) ? { ...(s.changementRevendication.de ? { de: s.changementRevendication.de } : {}), ...(s.changementRevendication.vers ? { vers: s.changementRevendication.vers } : {}) } : null;
  if (ctl && (ctl.resultat || ctl.valeur)) item.controle = ctl; if (chg) item.changementRevendication = chg; if (s.planId) item.planId = s.planId;
  if (id) { const h = db.hygiene.find((x) => x.id === id); if (isLocked(db, h.date)) return fail('Entrée verrouillée (campagne figée).'); Object.assign(h, item); if (ids && !ids.length) delete h.operateurs; ['controle', 'changementRevendication', 'planId'].forEach((k) => { if (s[k] !== undefined && !item[k]) delete h[k]; }); } else db.hygiene.push({ id: nid(db, 'hy'), ...item });
  return okr();
}
function hygieneDelete(db, id) { const h = db.hygiene.find((x) => x.id === id); if (!h) return fail('Introuvable.'); if (isLocked(db, h.date)) return fail('Entrée verrouillée (campagne figée).'); db.hygiene = db.hygiene.filter((x) => x.id !== id); return okr(); }

/* ---------- lots : métadonnées modifiables ---------- */
function lotEdit(db, id, s) {
  const l = db.lots.find((x) => x.id === id); if (!l) return fail('Lot introuvable.');
  const code = String(s.code || '').trim(); if (!code) return fail('Le code lot est obligatoire.');
  if (nameTaken(db.lots, code, id, 'code')) return fail(`Le code « ${code} » est déjà utilisé par un autre lot.`);
  // 0.41.0-alpha.1 : l'ancien code est gardé (cherchable) et écrit dans l'opération qui a créé le lot (sinon la réenregistrer le remettrait)
  if (code !== l.code && l.code) { l.codesPrecedents = [...(l.codesPrecedents || []), { code: l.code, jusquau: todayISO(), motif: String(s.motif || '').trim() || 'Modification manuelle', par: s.par || '', le: new Date().toISOString() }]; if (l.codif) l.codif = { ...l.codif, manuel: true }; if (typeof codifCodeDansOp === 'function') codifCodeDansOp(db, 'lot', id, code); }
  Object.assign(l, { code, designation: s.designation || '', millesime: s.millesime || '' }); return okr();
}

/* ---------- documents joints (métadonnées ; les fichiers eux-mêmes sont dans IndexedDB) ---------- */
const docsOf = (db, type, id) => (db.docs || []).filter((x) => x.cible && x.cible.type === type && x.cible.id === id);
function docMetaAdd(db, m) {
  if (!m || !m.id || !m.cible || !m.cible.id) return fail('Document invalide.');
  if (!db.docs) db.docs = [];
  db.docs.push({ id: m.id, nom: String(m.nom || 'document'), mime: m.mime || '', taille: num(m.taille), cat: m.cat || 'autre', cible: { type: m.cible.type, id: m.cible.id }, date: m.date || todayISO(),
    ...(isoOK(m.revision) ? { revision: m.revision } : {}), ...(m.version ? { version: String(m.version).slice(0, 30) } : {}), ...(m.archive ? { archive: m.archive } : {}), // 0.20.0-alpha.1 : révision, version, archivage
    ...(m.garde && typeof m.garde === 'object' ? { garde: m.garde } : {}), ...(Array.isArray(m.analyseIds) && m.analyseIds.length ? { analyseIds: m.analyseIds.map(String).slice(0, 200) } : {}), // 0.27.0-alpha.1 : verdict de la garde, analyses d'un bulletin
    ...(m.partId ? { partId: String(m.partId).slice(0, 40) } : {}) }); // 0.34.0-alpha.1 : partenaire (onglet) d'une entrée de moûts
  return okr();
}
function docMetaDel(db, id) { db.docs = (db.docs || []).filter((x) => x.id !== id); return okr(); }
// documents joints avant validation (opération à réaliser) : rattachés à l'opération quand elle est validée (0.14.0-alpha.1)
function docsDeplacer(db, de, vers) { let n = 0; (db.docs || []).forEach((x) => { if (x.cible && x.cible.type === de.type && x.cible.id === de.id) { x.cible = { type: vers.type, id: vers.id }; n += 1; } }); return n; }
// plusieurs documents déjà rangés dans ce navigateur (choisis pendant la saisie) → métadonnées rattachées à l'enregistrement créé
function docsJoindre(db, pieces, cible) { (pieces || []).forEach((x) => { if (x && x.id && !(db.docs || []).some((y) => y.id === x.id)) docMetaAdd(db, { id: x.id, nom: x.nom, mime: x.mime, taille: x.taille, cat: x.cat, cible, garde: x.garde, partId: x.partId }); }); return okr(); }

/* ---------- identité de l'entreprise (en-tête des fiches et rapports) ---------- */
function entrepriseSet(db, patch) { db.entreprise = { ...(db.entreprise || {}), ...patch }; return okr(); }

/* ---------- entrées de moûts : n° de lot et analyses par compartiment, moyennes pondérées, enrichissement (0.14.0-alpha.1) ---------- */
// moyennes pondérées par le volume : parts [{ vol, analyses: { paramId: valeur } }] → { paramId: { moy, vol (volume analysé), n } }
function moyennesPonderees(parts) {
  const acc = {};
  (parts || []).forEach((p) => { const v = num(p.vol); if (!(v > 0)) return; Object.keys(p.analyses || {}).forEach((k) => { if (!hasNum(p.analyses[k])) return; const a = acc[k] || (acc[k] = { s: 0, vol: 0, n: 0 }); a.s += num(p.analyses[k]) * v; a.vol += v; a.n += 1; }); });
  const out = {}; Object.keys(acc).forEach((k) => { out[k] = { moy: acc[k].s / acc[k].vol, vol: acc[k].vol, n: acc[k].n }; }); return out;
}
const ligneNumLot = (op, e, i) => (e && e.numLot) || ligneExtra(op, i, e).numLot || '';
const ligneAnalyses = (op, e, i) => (e && e.analyses && Object.keys(e.analyses).length ? e.analyses : ligneExtra(op, i, e).analyses || {});
// compartiments reçus qui ont formé un lot de moût, avec leur volume dans ce lot
function moutPartsLot(db, lotId) {
  const L = (db.lots || []).find((l) => l.id === lotId); if (!L || !L.opId) return [];
  const op = db.ops.find((o) => o.id === L.opId && o.type === 'entree_mout'); if (!op) return [];
  const ml = moutLots(op).find((x) => x.lotId === lotId || (!x.lotId && x.contenantId === L.contenantId)); if (!ml) return [];
  return ml.parts.map((p) => ({ op, e: p.e, i: p.i, vol: p.vol, numLot: ligneNumLot(op, p.e, p.i), analyses: ligneAnalyses(op, p.e, p.i) }));
}
// analyses d'entrée d'un lot : ses compartiments, ou (assemblage, débourbage, regroupement…) celles de ses lots sources au prorata
function moutAnalysesLot(db, lotId, vu) {
  vu = vu || {}; if (vu[lotId]) return []; vu[lotId] = true;
  const own = moutPartsLot(db, lotId); if (own.length) return own;
  const L = (db.lots || []).find((l) => l.id === lotId); if (!L || !(L.sources || []).length) return [];
  const out = [];
  L.sources.forEach((src) => { const sub = moutAnalysesLot(db, src.lotId, { ...vu }); const tot = sum(sub, (x) => x.vol); if (tot > 0) sub.forEach((x) => out.push({ ...x, vol: (x.vol * num(src.volL)) / tot })); });
  return out;
}
// analyses d'entrée de ce que contient une cuve aujourd'hui : chaque lot au prorata de son volume en cuve
function moutAnalysesCuve(db, R, cid) {
  const out = []; contParts(R, cid).forEach((p) => { const sub = moutAnalysesLot(db, p.lotId); const tot = sum(sub, (x) => x.vol); if (tot > 0) sub.forEach((x) => out.push({ ...x, vol: (x.vol * p.vol) / tot, lotId: p.lotId })); });
  return out;
}
// enrichissement (chaptalisation) pour atteindre le TAV visé : réglages Paramètres › 🧪 Calculs œnologiques
// 0.47.0-alpha.2 : deux réglages distincts — sucre à ajouter pour +1 % vol (enrichissement, 17 g/L) et conversion analytique sucres → TAP
// (16,83 g/L par % vol, convention réglementaire à vérifier : settings.sucresTapCoef)
const chaptalReglages = (db) => { const s = (db && db.settings) || {}; return { tav: hasNum(s.chaptalTAV) ? num(s.chaptalTAV) : 10.5, coef: num(s.chaptalCoef) > 0 ? num(s.chaptalCoef) : 17, max: hasNum(s.chaptalMax) ? num(s.chaptalMax) : 2, sucresTap: num(s.sucresTapCoef) > 0 ? num(s.sucresTapCoef) : 16.83 }; };
const tapMoyen = (db, moy) => (moy && moy.tap ? moy.tap.moy : moy && moy.sucres ? moy.sucres.moy / chaptalReglages(db).sucresTap : null);
function enrichissement(db, tap, volL, tavVise) {
  const g = chaptalReglages(db); const tav = hasNum(tavVise) ? num(tavVise) : g.tav;
  if (tap == null || !(num(volL) > 0)) return null;
  const ecart = Math.max(0, r2(tav - tap)); const gL = ecart * g.coef; const kg = (gL * num(volL)) / 1000;
  return { tap, tav, coef: g.coef, max: g.max, ecart, gL, kg, volL: num(volL), depasse: g.max > 0 && ecart > g.max + 1e-9 };
}

/* ---------- prévisions de mouvements (opérations planifiées, sans effet sur les stocks) ---------- */
function previsionSave(db, s, id) {
  if (!isoOK(s.date)) return fail('Date prévue invalide.');
  if (!OP_LABELS[s.type]) return fail('Type d’opération inconnu.');
  if (!db.previsions) db.previsions = [];
  const item = { type: s.type, date: s.date, f: clone(s.f || {}), resume: String(s.resume || '').slice(0, 600), notes: s.notes || '' };
  let pid = id;
  if (id) { const p = db.previsions.find((x) => x.id === id); if (!p) return fail('Prévision introuvable.'); Object.assign(p, item); }
  else { pid = nid(db, 'pv'); db.previsions.push({ id: pid, statut: 'prevue', creeLe: todayISO(), opId: null, ...item }); }
  return okr({ id: pid });
}
function previsionStatut(db, id, statut, opId) {
  const p = (db.previsions || []).find((x) => x.id === id); if (!p) return fail('Prévision introuvable.');
  p.statut = statut; if (statut === 'realisee') { p.opId = opId || p.opId || null; p.realiseLe = todayISO(); if (p.opId) docsDeplacer(db, { type: 'prev', id }, { type: 'op', id: p.opId }); } else if (statut === 'prevue') { p.opId = null; delete p.realiseLe; }
  return okr();
}
function previsionDelete(db, id) { const docs = docsOf(db, 'prev', id).map((x) => x.id); db.previsions = (db.previsions || []).filter((x) => x.id !== id); db.docs = (db.docs || []).filter((x) => !docs.includes(x.id)); return okr({ docs }); }

/* ---------- fiches d'enregistrement : journal des fiches éditées (n° d'ordre) et modèles personnalisés ---------- */
function ficheOrdre(db, tpl, date) {
  const n = (db.fiches || []).filter((x) => x.modele === tpl.id && x.date === date).length + 1;
  return `${tpl.prefixe || ''}${date.slice(8, 10)}${date.slice(5, 7)}${date.slice(2, 4)}N${n}`;
}
function ficheAdd(db, s) {
  if (!db.fiches) db.fiches = [];
  const id = nid(db, 'fi'); db.fiches.push({ id, modele: s.modele, ordre: s.ordre, date: s.date, sources: s.sources || [], creeLe: todayISO() });
  (s.sources || []).forEach((x) => { const t = x.kind === 'prev' ? (db.previsions || []).find((p) => p.id === x.id) : db.ops.find((o) => o.id === x.id); if (t) t.ficheOrdre = s.ordre; });
  return okr({ id });
}
function modeleFicheSave(db, tpl) {
  if (!tpl || !tpl.id) return fail('Modèle invalide.'); if (!String(tpl.titre || '').trim()) return fail('Le titre du modèle est obligatoire.');
  if (!db.modelesFiches) db.modelesFiches = [];
  const i = db.modelesFiches.findIndex((x) => x.id === tpl.id); const t = clone(tpl); t.modifieLe = todayISO();
  if (i >= 0) db.modelesFiches[i] = t; else db.modelesFiches.push(t);
  return okr();
}
function modeleFicheReset(db, id) { db.modelesFiches = (db.modelesFiches || []).filter((x) => x.id !== id); return okr(); }
