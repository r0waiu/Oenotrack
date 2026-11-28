/* ============ RÉFÉRENTIEL DES APPELLATIONS — COMPLÉMENTS (0.50.0-alpha.1 ; 0.50.0-alpha.2 : vérifiés dans les cahiers des charges en vigueur) ============
   À côté du relevé principal (16oa, généré, jamais modifié à la main), les compléments sont eux aussi des données générées
   (16oda-appellations-complements-donnees.js, par tools/appellations-complements.py) : chaque ligne a été lue dans le cahier des charges
   homologué en vigueur (Bulletin officiel du ministère de l'Agriculture, atteint depuis les fiches produits de l'INAO ; Limoux : eAmbrosia),
   avec son URL et sa version :
   - dénominations rattachées à une appellation du relevé (genre « dgc » : dénomination géographique complémentaire, unité géographique
     plus petite d'une IGP, mention « Villages », « Crémant », « blanquette de Limoux », « méthode ancestrale », noms de commune du
     Beaujolais…) : catégories et couleurs propres à la dénomination, parent = nom de l'appellation dans le relevé, même région ;
   - appellations homologuées après le relevé principal (genre « aop » : Montpeyroux, 11/08/2026) ;
   - Vin de France (genre « vsig » : vin sans indication géographique, toutes régions de France ; catégories non vérifiées) ;
   - anciens noms (alias) lus dans les cahiers des charges : Corbières-Boutenac → Boutenac, Minervois-La Livinière → La Livinière,
     Anjou Villages Brissac → Anjou Brissac.
   Rien n'entre dans la base : appellationDepuisRef y recopie { id, label, ref }. */
const APP_GENRES = { aop: 'appellation', dgc: 'dénomination rattachée', vsig: 'vin sans indication géographique' };
// entrées complémentaires au format de appRef() (même id « région:nom normalisé ») ; parentId : appellation du relevé
function appComplements() {
  const S = typeof APP_COMPL_SOURCES !== 'undefined' ? APP_COMPL_SOURCES : [];
  return String(typeof APP_COMPL_TXT === 'string' ? APP_COMPL_TXT : '').split('\n').filter(Boolean).map((l) => {
    const [nom, region, signe, eu, c, k, genre, parent, alias, v, s, version] = l.split('\t');
    return { id: `${region}:${norm(nom)}`, nom, region, pays: 'france', signe, eu, sousRegion: '', libre: c === '*', cats: c === '*' ? [] : String(c || '').split('').map((x) => APP_CATS[x]).filter(Boolean),
      couleurs: String(k || '').split('').map((x) => APP_COUL[x]).filter(Boolean), verifie: v === '1', etat: '', source: S[num(s)] || '', version: version || '', complement: true, genre: genre || 'dgc',
      parentId: parent ? `${region}:${norm(parent)}` : '', alias: String(alias || '').split(';').map((x) => x.trim()).filter(Boolean) };
  });
}
// alias d'une entrée du relevé (anciens noms lus dans le cahier des charges)
const appAliasDe = (a) => (typeof APP_COMPL_ALIAS !== 'undefined' ? APP_COMPL_ALIAS : []).filter((x) => x[1] === a.nom && x[2]).map((x) => x[0]);
const appVinDeFrance = () => appRef().find((a) => a.genre === 'vsig') || null;
const appEstVsig = (a) => !!a && a.genre === 'vsig';
// dénominations rattachées à une appellation
const appDenominations = (id) => appRef().filter((a) => a.parentId === id);
