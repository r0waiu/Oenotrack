/* ============ VIGNOBLE : RÉGION, APPELLATIONS ET TYPES DE VINS EN DIRECT (0.50.0-alpha.1) ============
   Le réglage « Vignoble » (Paramètres › 🍇 Vignoble) adapte Œnotrack aussitôt, sans liste à cocher : dès que la région, les appellations
   produites ou les types de vins changent, les adaptations du profil (profilPlan, 16o) sont appliquées, sauf :
   - les éléments forcés à la main (« toujours affiché » / « toujours masqué ») : settings.profilViticole.forces = { clé: 'affiche' | 'masque' }
     — clés : module:<id> (Tirages, Cave, Dégorgement), op:<id> (opérations des PROFIL_OPS), pressfrac:<id> (tailles et rebêche proposées
     au pressurage), region (spécificités champenoises), sub:declarationsTirage (sous-onglet « Déclarations » des Tirages, AIDAC et Innov OI) ;
   - les opérations et fractions réglées à la main hors du profil (logique « libre » de profilPlan, inchangée) ;
   - les appellations d'exemple de la région (profilPlan « appellation: ») : en direct, l'exploitation choisit ses appellations.
   Un module masqué ou affiché dans Paramètres › Modules, une opération masquée dans le catalogue ou une fraction réglée à la main contre ce
   que veut le profil devient une exception forcée (profilNoterMain) ; revenir à la valeur voulue retire l'exception.
   Types de vins : déduits des appellations de la liste de l'exploitation qui ont une référence (profilTypesDeduits : AOP, IGP, dénominations
   en vigueur ; Vin de France et indications non restreintes ne restreignent rien) quand settings.profilViticole.typesAuto est vrai ; cochés à
   la main sinon. Rien n'est supprimé : masquer un onglet ou une opération ne touche aucune donnée. Les versions antérieures lisent les mêmes
   champs qu'avant (settings.modulesOff, lists.operations[].masque, lists.fractions[].pressurage, settings.region, settings.profilViticole). */
const PROFIL_FORCE_VALEURS = ['affiche', 'masque'];
const PROFIL_POUR = { rouge: 'Vins tranquilles rouges', rose: 'Vins tranquilles rosés', mousse: 'Vins effervescents', doux: 'Vins doux', jura: 'Jura et Savoie' };
const PROFIL_CIBLE_GROUPES = [['onglets', 'Onglets'], ['operations', 'Opérations'], ['fractions', 'Fractions au pressurage'], ['champagne', 'Spécificités champenoises']];
const profilForces = (db) => { const f = (((db && db.settings) || {}).profilViticole || {}).forces; const out = {}; if (f && typeof f === 'object') Object.keys(f).forEach((k) => { if (PROFIL_FORCE_VALEURS.includes(f[k])) out[k] = f[k]; }); return out; };
const profilEstDirect = (db) => !!((((db && db.settings) || {}).profilViticole || {}).direct);
// types de vins autorisés par les appellations de l'exploitation (dans l'ordre de PROFIL_TYPES) ; parType : type → libellés des appellations
function profilTypesDeduits(db) {
  const parType = {}; let n = 0;
  ((db && db.lists && db.lists.appellations) || []).forEach((a) => {
    if (!a || a.masque || !a.ref || !a.ref.id) return; const r = appRefDef(a.ref.id); if (!r || !appEnVigueur(r) || r.libre || appEstVsig(r)) return;
    n += 1; appTypes(r).forEach((t) => { (parType[t] = parType[t] || []).push(a.label); });
  });
  return { types: PROFIL_TYPES.map((x) => x[0]).filter((t) => parType[t]), parType, n };
}
const profilCleDuPlan = (id) => (/^(module|op|pressfrac):/.test(id) || id === 'region' ? id : '');
// éléments adaptés au profil : { cle, groupe, label, voulu, actuel, force, effectif, main, pour }
function profilCibles(db, region, types) {
  const pv = profilViticole(db); const reg = region || pv.region; const T = (types || pv.types || []).filter((t) => PROFIL_TYPES.some((x) => x[0] === t));
  const mousse = T.includes('effervescent') || T.includes('ancestrale'); const champ = reg === 'champagne'; const forces = profilForces(db); const out = [];
  const add = (cle, groupe, label, voulu, actuel, x) => { const f = forces[cle] || ''; const main = !!(x && x.main); out.push({ cle, groupe, label, voulu: !!voulu, actuel: actuel == null ? null : !!actuel, force: f, main, pour: (x && x.pour) || [], effectif: f ? f === 'affiche' : (main && actuel != null ? !!actuel : !!voulu) }); };
  PROFIL_MODULES_MOUSSE.forEach((m) => add(`module:${m}`, 'onglets', PROFIL_MODULES_NOMS[m], mousse, moduleActif(db, m), { pour: mousse ? ['mousse'] : [] }));
  const ops = opList(db); const defOps = DEFAULT_OPERATIONS(); const deja = Array.isArray(pv.ops) ? pv.ops : [];
  const veulent = { rouge: T.includes('rouge'), rose: T.includes('rose'), mousse, doux: T.includes('doux'), jura: reg === 'jura_savoie' };
  uniq(Object.values(PROFIL_OPS).flat()).forEach((id) => {
    const o = ops.find((y) => y.id === id); const d = defOps.find((y) => y.id === id); if (!o || !d) return;
    const pour = Object.keys(PROFIL_OPS).filter((k) => veulent[k] && PROFIL_OPS[k].includes(id));
    add(`op:${id}`, 'operations', o.label, pour.length > 0, !o.masque, { main: !(!!o.masque === !!d.masque || deja.includes(id)), pour });
  });
  const fr = fracList(db); const defFr = DEFAULT_FRACTIONS(); const dejaF = Array.isArray(pv.fractions) ? pv.fractions : [];
  PROFIL_FRACTIONS_CHAMPAGNE.forEach((id) => { const f = fr.find((y) => y.id === id); const d = defFr.find((y) => y.id === id); if (!f || !d) return;
    add(`pressfrac:${id}`, 'fractions', f.label, champ, f.pressurage !== false, { main: !((f.pressurage !== false) === (d.pressurage !== false) || dejaF.includes(id)) }); });
  add('region', 'champagne', 'Spécificités champenoises (pressoir, échelle des crus)', champ, champenois(db));
  add('sub:declarationsTirage', 'champagne', 'Déclarations de tirage (AIDAC, Innov OI)', champ, null);
  return out;
}
const profilCiblesCles = (db) => profilCibles(db).map((x) => x.cle);
// élément sans champ d'une version antérieure (sous-onglet) : forcé, sinon voulu par la région
function profilElementVisible(db, cle) {
  const f = profilForces(db)[cle]; if (f) return f === 'affiche';
  if (cle === 'sub:declarationsTirage') return profilViticole(db).region === 'champagne';
  const c = profilCibles(db).find((x) => x.cle === cle); return c ? c.effectif : true;
}
// application des adaptations (région, types) : plan du profil sans les éléments forcés ni les appellations d'exemple, puis les exceptions
function profilAdapter(db, region, T, uid) {
  const forces = profilForces(db);
  const plan = profilPlan(db, region, T).filter((x) => !x.id.startsWith('appellation:') && !(profilCleDuPlan(x.id) in forces));
  const r = profilAppliquer(db, region, T, plan.map((x) => x.id), uid); if (!r.ok) return r;
  let nf = 0;
  Object.keys(forces).forEach((cle) => {
    const aff = forces[cle] === 'affiche'; const k = cle.slice(cle.indexOf(':') + 1);
    if (cle.startsWith('module:') && estModule(k) && moduleActif(db, k) !== aff) { moduleActiver(db, k, aff, { profil: true }); nf += 1; }
    else if (cle.startsWith('op:')) { const o = opCatEnsure(db).find((y) => y.id === k); if (o && !!o.masque === aff) { o.masque = !aff; nf += 1; } }
    else if (cle.startsWith('pressfrac:')) { if (!Array.isArray(db.lists.fractions) || !db.lists.fractions.length) db.lists.fractions = DEFAULT_FRACTIONS(); const f = db.lists.fractions.find((y) => y.id === k); if (f && (f.pressurage !== false) !== aff) { f.pressurage = aff; nf += 1; } }
    else if (cle === 'region' && champenois(db) !== aff) { regionSet(db, aff ? 'champagne' : 'autre', { crus: false }); nf += 1; }
  });
  return okr({ n: plan.length, forces: nf });
}
// enregistrement du réglage (région, types cochés ou déduits) et adaptation immédiate
function profilEnregistrer(db, s, uid) {
  const o = s || {}; const pv = profilViticole(db); const region = o.region || pv.region;
  if (!profilRegionDef(region)) return fail('Région inconnue.');
  const auto = o.typesAuto != null ? !!o.typesAuto : (pv.typesAuto === true || (!pv.defini && !o.types));
  const ded = profilTypesDeduits(db).types;
  const T = uniq(((auto && ded.length ? ded : (o.types || pv.types)) || []).filter((t) => PROFIL_TYPES.some((x) => x[0] === t)));
  if (!T.length) return fail('Choisissez au moins un type de vin, ou une appellation qui en autorise.');
  db.settings.profilViticole = { ...((db.settings || {}).profilViticole || {}), direct: true, typesAuto: auto };
  return profilAdapter(db, region, T, uid);
}
// reprise des adaptations après un changement de la liste des appellations ou d'une exception (réglage en direct seulement)
function profilSynchroniser(db, uid) {
  if (!profilEstDirect(db)) return okr({ n: 0 });
  const pv = profilViticole(db); const ded = profilTypesDeduits(db).types;
  const T = pv.typesAuto === true && ded.length ? ded : pv.types; if (!T.length) return okr({ n: 0 });
  return profilAdapter(db, pv.region, T, uid);
}
// exception : 'affiche' | 'masque' | '' (automatique) ; réglage en direct activé au passage
function profilForcer(db, cle, valeur, uid) {
  if (!profilCiblesCles(db).includes(cle)) return fail('Élément inconnu du profil.');
  if (valeur && !PROFIL_FORCE_VALEURS.includes(valeur)) return fail('Valeur inconnue : « toujours affiché », « toujours masqué » ou automatique.');
  const pv = (db.settings || {}).profilViticole || {}; const f = { ...profilForces(db) };
  if (valeur) f[cle] = valeur; else delete f[cle];
  db.settings.profilViticole = { ...pv, forces: f, direct: true, ...(pv.region ? {} : { region: profilViticole(db).region, types: profilViticole(db).types }) };
  if (!valeur) { // retour à l'automatique : l'élément redevient « libre » pour le profil
    const k = cle.slice(cle.indexOf(':') + 1); const p = db.settings.profilViticole;
    if (cle.startsWith('op:')) { const d = DEFAULT_OPERATIONS().find((y) => y.id === k); const o = opCatEnsure(db).find((y) => y.id === k); if (o && d && !!o.masque !== !!d.masque && !(p.ops || []).includes(k)) p.ops = [...(p.ops || []), k]; }
    if (cle.startsWith('pressfrac:')) { if (!(p.fractions || []).includes(k)) p.fractions = [...(p.fractions || []), k]; }
  }
  return profilSynchroniser(db, uid);
}
// changement fait à la main hors du réglage Vignoble (Modules, catalogue des opérations, fractions) : exception notée si contraire au profil
function profilNoterMain(db, cle, affiche) {
  if (!profilEstDirect(db)) return;
  const c = profilCibles(db).find((x) => x.cle === cle); if (!c) return;
  const pv = db.settings.profilViticole; const f = { ...profilForces(db) };
  if (!!affiche === c.voulu) delete f[cle]; else f[cle] = affiche ? 'affiche' : 'masque';
  pv.forces = f;
}
// appellations produites : ajout depuis le référentiel et retrait (si inutilisée), puis adaptation (types déduits)
function vignobleAppellationAjouter(db, refId, uid) {
  const r = appellationDepuisRef(db, refId); if (!r.ok) return r;
  const s = profilSynchroniser(db, uid); if (!s.ok) return s; return okr({ id: r.id, deja: !!r.deja });
}
function vignobleAppellationRetirer(db, appId, uid) {
  if (!((db.lists && db.lists.appellations) || []).some((a) => a && a.id === appId)) return fail('Appellation introuvable dans la liste.');
  const r = listRemove(db, 'appellations', appId); if (!r.ok) return r; return profilSynchroniser(db, uid);
}
// résumé des appellations de l'exploitation par genre (appellations, dénominations, Vin de France, saisies à la main)
function vignobleAppellations(db) {
  return ((db.lists && db.lists.appellations) || []).filter((a) => a && a.id).map((a) => { const r = a.ref && a.ref.id ? appRefDef(a.ref.id) : null;
    return { id: a.id, label: a.label, ref: r, genre: r ? r.genre || 'aop' : 'main', types: r && !r.libre ? appTypes(r) : [], usage: listUsage(db, 'appellations', a.id) }; });
}
// appellations saisies à la main dont le nom est celui d'une appellation du référentiel : référence ajoutée (région du profil d'abord,
// sinon une seule correspondance) ; rien n'est renommé
function vignobleAppellationsRelier(db, uid) {
  const region = profilViticole(db).region; let n = 0;
  ((db.lists && db.lists.appellations) || []).forEach((a) => {
    if (!a || (a.ref && a.ref.id)) return; const k = norm(a.label).trim();
    const L = appRef().filter((r) => norm(r.nom).trim() === k || (r.alias || []).some((x) => norm(x).trim() === k));
    const r = L.find((x) => x.region === region) || (L.length === 1 ? L[0] : null); if (!r) return;
    a.ref = { id: r.id, region: r.region, pays: r.pays, signe: r.signe, eu: r.eu }; n += 1;
  });
  if (n) { const s = profilSynchroniser(db, uid); if (!s.ok) return s; }
  return okr({ n });
}
const vignobleAReliers = (db) => ((db.lists && db.lists.appellations) || []).filter((a) => a && !(a.ref && a.ref.id) && appRef().some((r) => norm(r.nom).trim() === norm(a.label).trim() || (r.alias || []).some((x) => norm(x).trim() === norm(a.label).trim()))).length;
