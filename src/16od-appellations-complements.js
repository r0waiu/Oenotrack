/* ============ RÉFÉRENTIEL DES APPELLATIONS — COMPLÉMENTS (0.50.0-alpha.1) ============
   Ajouts écrits à la main, à côté du relevé généré (16oa, jamais modifié à la main) ; tous « à vérifier » (verifie: false) tant qu'ils
   n'ont pas été relus dans le cahier des charges :
   - appellations absentes du relevé (Crémant de Savoie) ;
   - dénominations rattachées à une appellation du relevé (genre « dgc » : dénomination géographique complémentaire, cru communal,
     unité géographique plus petite d'une IGP, mention d'une appellation — Beaujolais-Villages, Côtes du Rhône Villages + commune,
     Côtes de Provence Sainte-Victoire, Muscadet Sèvre et Maine + cru communal, Val de Loire + département, Blanquette de Limoux…) :
     parent = nom de l'appellation dans le relevé, même région ;
   - Vin de France (genre « vsig » : vin sans indication géographique, toutes régions de France) ;
   - anciens noms (alias) d'appellations du relevé : Corbières-Boutenac → Boutenac, Minervois-La Livinière → La Livinière…
   Une ligne : nom | région | signe | AOP|IGP|SIG | sous-région | catégories (codes de 16oa ; * : non restreintes) | couleurs | genre |
   parent | alias (séparés par « ; ») | source. Rien n'entre dans la base : appellationDepuisRef y recopie { id, label, ref }. */
const APP_COMPL_SOURCES = { inao: 'https://www.inao.gouv.fr', ue: 'https://eur-lex.europa.eu/eli/reg/2013/1308/oj', fam: 'https://www.franceagrimer.fr' };
const APP_COMPL_DGC = (parent, region, signe, sous, cats, coul, noms, prefixe) => noms.split('|').map((n) => [`${prefixe == null ? parent : prefixe} ${n}`.trim(), region, signe, signe === 'IGP' ? 'IGP' : 'AOP', sous, cats, coul, 'dgc', parent, n, 'inao']);
const APP_COMPLEMENTS = [
  ['Crémant de Savoie', 'jura_savoie', 'AOP', 'AOP', 'Savoie', 'e', 'bo', 'aop', '', '', 'inao'],
  ['Beaujolais-Villages', 'beaujolais', 'AOP', 'AOP', 'Beaujolais', 't', 'bor', 'dgc', 'Beaujolais', 'Beaujolais Villages', 'inao'],
  ['Blanquette de Limoux', 'languedoc', 'AOP', 'AOP', 'Limoux', 'e', 'b', 'dgc', 'Limoux', '', 'inao'],
  ['Blanquette méthode ancestrale', 'languedoc', 'AOP', 'AOP', 'Limoux', 'a', 'b', 'dgc', 'Limoux', '', 'inao'],
  ['Mâcon-Villages', 'bourgogne', 'AOP', 'AOP', 'Mâconnais', 't', 'b', 'dgc', 'Mâcon', 'Mâcon Villages', 'inao'],
  ['Saumur Puy-Notre-Dame', 'loire', 'AOP', 'AOP', 'Anjou-Saumur', 't', 'r', 'dgc', 'Saumur', 'Puy-Notre-Dame', 'inao'],
  ...APP_COMPL_DGC('Côtes du Rhône Villages', 'rhone', 'AOP', 'Rhône Sud', 't', '', 'Chusclan|Gadagne|Massif d’Uchaux|Nyons|Plan de Dieu|Puyméras|Roaix|Rochegude|Rousset-les-Vignes|Sablet|Saint-Andéol|Sainte-Cécile|Saint-Gervais|Saint-Maurice|Saint-Pantaléon-les-Vignes|Séguret|Signargues|Suze-la-Rousse|Vaison-la-Romaine|Valréas|Visan'),
  ...APP_COMPL_DGC('Côtes de Provence', 'provence', 'AOP', 'Provence', 't', '', 'Sainte-Victoire|Fréjus|La Londe|Pierrefeu|Notre-Dame des Anges'),
  ...APP_COMPL_DGC('Muscadet Sèvre et Maine', 'loire', 'AOP', 'Pays nantais', 't', 'b', 'Clisson|Gorges|Le Pallet|Château-Thébaud|Goulaine|Monnières-Saint-Fiacre|Mouzillon-Tillières'),
  ...APP_COMPL_DGC('Touraine', 'loire', 'AOP', 'Touraine', 't', '', 'Amboise|Azay-le-Rideau|Chenonceaux|Mesland|Oisly'),
  ...APP_COMPL_DGC('Val de Loire', 'loire', 'IGP', 'Val de Loire', 't', 'bor', 'Allier|Cher|Deux-Sèvres|Indre|Indre-et-Loire|Loir-et-Cher|Loire-Atlantique|Loiret|Maine-et-Loire|Marches de Bretagne|Nièvre|Pays de Retz|Sarthe|Vendée|Vienne'),
  ...APP_COMPL_DGC('Vaucluse', 'rhone', 'IGP', 'Vallée du Rhône', 't', 'bor', 'Aigues|Principauté d’Orange'),
  ...APP_COMPL_DGC('Bourgogne', 'bourgogne', 'AOP', 'Bourgogne', 't', '', 'Côte d’Or|Hautes Côtes de Nuits|Hautes Côtes de Beaune|Côte Chalonnaise|Côtes d’Auxerre|Chitry|Coulanges-la-Vineuse|Épineuil|Tonnerre|Côte Saint-Jacques|La Chapelle Notre-Dame|Le Chapitre|Montrecul'),
  ...APP_COMPL_DGC('Vin de Savoie / Savoie', 'jura_savoie', 'AOP', 'Savoie', 't', '', 'Abymes|Apremont|Arbin|Ayze|Chautagne|Chignin|Chignin-Bergeron|Crépy|Cruet|Jongieux|Marignan|Marin|Montmélian|Ripaille|Saint-Jean-de-la-Porte|Saint-Jeoire-Prieuré', 'Vin de Savoie'),
  ...APP_COMPL_DGC('Côtes du Roussillon Villages', 'languedoc', 'AOP', 'Roussillon', 't', 'r', 'Caramany|Latour-de-France|Lesquerde|Tautavel'),
  ...APP_COMPL_DGC('Côtes du Roussillon', 'languedoc', 'AOP', 'Roussillon', 't', 'r', 'Les Aspres'),
  ...APP_COMPL_DGC('Languedoc', 'languedoc', 'AOP', 'Languedoc', 't', '', 'Cabrières|Montpeyroux|Pézenas|Quatourze|Saint-Christol|Saint-Drézéry|Saint-Georges-d’Orques|Saint-Saturnin|Sommières|La Méjanelle'),
  ...APP_COMPL_DGC('Côtes de Bordeaux', 'bordeaux', 'AOP', 'Entre-deux-Mers & Côtes', 't', '', 'Castillon|Francs|Cadillac|Blaye|Sainte-Foy', '').map((l) => { l[0] = `${l[9]} Côtes de Bordeaux`; return l; }),
  ...APP_COMPL_DGC('Corse / Vin de Corse', 'corse', 'AOP', 'Corse', 't', '', 'Calvi|Coteaux du Cap Corse|Figari|Porto-Vecchio|Sartène', 'Vin de Corse'),
  ['Vin de France', 'france', 'VSIG', 'SIG', 'Vin sans indication géographique', '*', '', 'vsig', '', 'VSIG;Vin sans IG', 'fam'],
];
// anciens noms d'appellations du relevé (cherchables, jamais affichés à la place du nom officiel)
const APP_ALIAS = { 'languedoc|Boutenac': 'Corbières-Boutenac', 'languedoc|La Livinière': 'Minervois-La Livinière', 'loire|Anjou Brissac': 'Anjou Villages Brissac', 'rhone|Ardèche': 'Coteaux de l’Ardèche', 'corse|Corse / Vin de Corse': 'Vin de Corse' };
const APP_GENRES = { aop: 'appellation', dgc: 'dénomination rattachée', vsig: 'vin sans indication géographique' };
// entrées complémentaires au format de appRef() (même id « région:nom normalisé ») ; parentId : appellation du relevé
function appComplements() {
  return APP_COMPLEMENTS.map(([nom, region, signe, eu, sousRegion, c, k, genre, parent, alias, s]) => ({
    id: `${region}:${norm(nom)}`, nom, region, pays: 'france', signe, eu, sousRegion, libre: c === '*', cats: c === '*' ? [] : c.split('').map((x) => APP_CATS[x]).filter(Boolean),
    couleurs: (k || '').split('').map((x) => APP_COUL[x]).filter(Boolean), verifie: false, etat: '', source: APP_COMPL_SOURCES[s] || '', complement: true, genre,
    parentId: parent ? `${region}:${norm(parent)}` : '', alias: String(alias || '').split(';').map((x) => x.trim()).filter(Boolean) }));
}
// alias d'une entrée du relevé (anciens noms)
const appAliasDe = (a) => { const v = APP_ALIAS[`${a.region}|${a.nom}`]; return v ? [v] : []; };
const appVinDeFrance = () => appRef().find((a) => a.genre === 'vsig') || null;
const appEstVsig = (a) => !!a && a.genre === 'vsig';
// dénominations rattachées à une appellation
const appDenominations = (id) => appRef().filter((a) => a.parentId === id);
