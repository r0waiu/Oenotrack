/* ============ RÉFÉRENTIEL DES APPELLATIONS VITICOLES (0.46.0-alpha.2 ; 0.50.0-alpha.1 : compléments, alias, Vin de France) ============
   Données dans le code (16oa-appellations-donnees.js, relevé officiel du 27/11/2026), jamais dans la base : France (AOP, IGP),
   Italie, Espagne, Portugal, Allemagne, Autriche (registre de l'UE eAmbrosia), Suisse (AOC), États-Unis (AVA), Australie (IG).
   - appRef() : toutes les appellations { id, nom, region, pays, signe, eu, sousRegion, cats, couleurs, libre, verifie, etat, source }
   - appTypesRegion(région) : types de vins (PROFIL_TYPES) que les appellations de la région autorisent ; un type qu'aucune n'autorise
     est « hors appellation » (vin sans IG) — toujours choisissable, seulement signalé ; région sans données ou indications qui ne
     restreignent pas le type (Suisse, États-Unis, Australie) : rien n'est signalé
   - la liste des appellations de l'exploitation (db.lists.appellations) reste libre : appellationDepuisRef y ajoute une appellation du
     référentiel ({ id, label, ref: { region, pays, signe, eu } }) ; rien n'est retiré ni renommé */
const APP_CATS = { t: 'tranquille', e: 'effervescent', p: 'petillant', a: 'ancestrale', d: 'doux', v: 'vdn', s: 'sous_voile' };
const APP_COUL = { b: 'blanc', o: 'rose', r: 'rouge' };
const APP_ETATS = { absente_inao: 'enregistrée dans l’UE, absente de la liste de l’INAO', annulee: 'annulée dans l’UE', demande: 'demande d’enregistrement en cours' };
let _appRef = null;
function appRef() {
  if (_appRef) return _appRef;
  _appRef = String(typeof APP_REF_TXT === 'string' ? APP_REF_TXT : '').split('\n').filter(Boolean).map((l) => {
    const [nom, region, pays, signe, eu, sousRegion, c, k, v, etat, s] = l.split('\t');
    return { id: `${region}:${norm(nom)}`, nom, region, pays, signe, eu, sousRegion, libre: c === '*', cats: c === '*' ? [] : c.split('').map((x) => APP_CATS[x]).filter(Boolean),
      couleurs: (k || '').split('').map((x) => APP_COUL[x]).filter(Boolean), verifie: v === '1', etat: etat || '', source: (typeof APP_REF_SOURCES !== 'undefined' && APP_REF_SOURCES[num(s)]) || '' };
  });
  // 0.50.0-alpha.1 : anciens noms (alias), compléments écrits à la main (16od : dénominations rattachées, Vin de France), sans doublon d'id
  if (typeof appAliasDe === 'function') _appRef.forEach((a) => { a.genre = 'aop'; a.alias = appAliasDe(a); a.parentId = ''; });
  if (typeof appComplements === 'function') { const ids = new Set(_appRef.map((a) => a.id)); const parIds = Object.fromEntries(_appRef.map((a) => [a.id, a])); appComplements().forEach((a) => { if (!ids.has(a.id)) { ids.add(a.id); if (!a.sousRegion && parIds[a.parentId]) a.sousRegion = parIds[a.parentId].sousRegion; _appRef.push(a); } }); }
  if (typeof cdcAppliquerRef === 'function') cdcAppliquerRef(_appRef); // 0.50.0-alpha.3 : cahiers des charges en vigueur (16og)
  return _appRef;
}
const appRefDef = (id) => appRef().find((a) => a.id === id) || null;
const appEnVigueur = (a) => a.etat !== 'annulee' && a.etat !== 'demande';
const appRefRegion = (region) => appRef().filter((a) => a.region === region);
// types de vins (ids de PROFIL_TYPES) qu'une appellation autorise ; couleurs non précisées = blanc, rosé et rouge
function appTypes(a) {
  if (!a || a.libre) return PROFIL_TYPES.map((x) => x[0]);
  const coul = a.couleurs.length ? a.couleurs : ['blanc', 'rose', 'rouge']; const out = new Set();
  if (a.cats.includes('tranquille')) coul.forEach((c) => out.add(c));
  if (a.cats.includes('sous_voile')) out.add('blanc');
  if (a.cats.includes('effervescent') || a.cats.includes('petillant')) out.add('effervescent');
  if (a.cats.includes('ancestrale')) out.add('ancestrale');
  if (a.cats.includes('doux') || a.cats.includes('vdn')) out.add('doux');
  return [...out];
}
// types possibles d'une région d'après ses appellations en vigueur
function appTypesRegion(region) {
  const L = appRefRegion(region).filter((a) => appEnVigueur(a) && a.genre !== 'vsig');
  const libre = !L.length || L.some((a) => a.libre);
  const parType = {}; L.forEach((a) => appTypes(a).forEach((t) => { (parType[t] = parType[t] || []).push(a.nom); }));
  return { libre, possibles: libre ? PROFIL_TYPES.map((x) => x[0]) : Object.keys(parType), parType, nb: { aop: L.filter((a) => a.eu === 'AOP').length, igp: L.filter((a) => a.eu === 'IGP').length, ig: L.filter((a) => a.eu === 'IG').length, total: L.length } };
}
const profilTypeHorsAppellation = (region, type) => { const r = appTypesRegion(region); return !r.libre && !r.possibles.includes(type); };
// recherche dans le référentiel (nom, sous-région) : la région choisie d'abord, puis les autres ; noms qui commencent par la recherche d'abord
function appChercher(q, opts) {
  const o = opts || {}; const n = norm(q || ''); if (!n) return []; const lim = o.limite || 30;
  const al = (a) => (a.alias || []).map(norm); // 0.50.0-alpha.1 : anciens noms et noms courts des dénominations
  return appRef().filter((a) => (!o.pays || a.pays === o.pays) && (norm(a.nom).includes(n) || norm(a.sousRegion).includes(n) || al(a).some((x) => x.includes(n))))
    .map((a) => ({ a, k: (a.region === o.region || (a.genre === 'vsig' && (profilRegionDef(o.region) || {}).pays === 'France') ? 0 : 2) + (norm(a.nom).startsWith(n) || al(a).some((x) => x.startsWith(n)) ? 0 : 1) + (appEnVigueur(a) ? 0 : 4) + (a.genre === 'dgc' ? 0.5 : 0) }))
    .sort((x, y) => x.k - y.k || x.a.nom.localeCompare(y.a.nom, 'fr')).slice(0, lim).map((x) => x.a);
}
// ajout d'une appellation du référentiel à la liste de l'exploitation (sans doublon : même nom déjà présent → rien)
function appellationDepuisRef(db, refId) {
  const a = appRefDef(refId); if (!a) return fail('Appellation introuvable dans le référentiel.');
  if (!Array.isArray(db.lists.appellations)) db.lists.appellations = [];
  const deja = db.lists.appellations.find((x) => x && norm(x.label) === norm(a.nom));
  if (deja) { if (!deja.ref) deja.ref = { id: a.id, region: a.region, pays: a.pays, signe: a.signe, eu: a.eu }; return okr({ id: deja.id, deja: true }); }
  const id = nid(db, 'app'); db.lists.appellations.push({ id, label: a.nom, ref: { id: a.id, region: a.region, pays: a.pays, signe: a.signe, eu: a.eu } });
  return okr({ id });
}
