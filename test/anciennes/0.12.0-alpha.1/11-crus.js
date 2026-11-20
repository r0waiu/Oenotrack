/* ============ CRUS (VILLAGES) : liste de départ issue du fichier « Échelle des crus en Champagne » ============ */
// Les pourcentages de l'échelle des crus ne sont PAS importés : seul le classement Grand cru / 1er cru / Autre cru est conservé.
// La liste est entièrement modifiable dans Registres & Paramètres › Crus (villages) : ajout de crus personnalisés, changement d'échelle, renommage.
const CRUS_SRC = {
  grand: 'Ambonnay|Avize|Aÿ-Champagne|Beaumont-sur-Vesle|Bouzy|Chouilly|Cramant|Louvois|Mailly-Champagne|Le Mesnil-sur-Oger|Oger|Oiry|Puisieulx|Sillery|Tours-sur-Marne|Verzenay|Verzy',
  premier: 'Avenay-Val-d\'Or|Bergères-lès-Vertus|Bezannes|Billy-le-Grand|Bisseuil|Chamery|Champillon|Chigny-les-Roses|Coligny|Cormontreuil|Coulommes-la-Montagne|Cuis|Cumières|Dizy|Écueil|Étréchy|Grauves|Hautvillers|Jouy-lès-Reims|Ludes|Mareuil-sur-Ay|Les Mesneux|Montbré|Mutigny|Pargny-lès-Reims|Pierry|Rilly-la-Montagne|Sacy|Sermiers|Taissy|Tauxières-Mutry|Trépail|Trois-Puits|Vaudemange|Vertus|Ville-Dommange|Villeneuve-Renneville|Villers-Allerand|Villers-aux-Nœuds|Villers-Marmery|Voipreux|Vrigny',
  autre: {
    'Marne': 'Allemant|Arcis-le-Ponsart|Aubilly|Barbonne-Fayel|Baslieux-sous-Châtillon|Bassu|Bassuet|Baye|Beaunay|Belval-sous-Châtillon|Bergères-sous-Montmirail|Berru|Bethon|Binson-Orquigny|Bligny|Bouilly|Bouleuse|Boursault|Branscourt|Le Breuil|Brimont|Brouillet|Broussy-le-Grand|Broyes|Brugny-Vaudancourt|Cauroy-les-Hermonville|Celles-sur-Chantemerle (La)|Cernay-les-Reims|Cerseuil|Châlon-sur-Vesle|Chambrecy|Champlat-Boujacourt|Champvoisy|Changy|Chantemerle|Châtillon-sur-Marne|Chaumuzy|Chavot-Courcourt|Chenay|Coizard-Joches|Congy|Cormicy|Cormoyeux|Courcelles-Sapicourt|Courjeonnet|Courmas|Courtagnon|Courthiézy|Courville|Couvrot|Crugny|Cuchery|Cuisles|Damery|Dormans|Épernay|Étoges|Faverolles|Férébrianges|Festigny|Fleury-la-Rivière|Fontaine-Denis|Germaine|Germigny|Givry-les-Loisy|Glannes|Gueux|Hermonville|Hourges|Igny-Comblizy|Janvry|Jonchery-sur-Vesles|Jonquery|Lagery|Leuvrigny|Lhéry|Lisse-en-Champagne|Loisy-en-Brie|Loisy-sur-Marne|Mancy|Mardeuil|Mareuil-le-Port|Marfaux|Merfy|Merlaut|Méry-Prémecy|Le Mesnil-le-Hutier|Mondement|Montgenost|Monthelon|Montigny-sous-Châtillon|Montigny-sur-Vesle|Morangis|Moslins|Moussy|Nanteuil-la-Forêt|Nesle-le-Repons|La Neuville-aux-Larris|Nogent-l\'Abbesse|Œuilly|Olizy-Violaine|Orbais-l\'Abbaye|Ormes|Oyes|Passy-Grigny|Pévy|Poilly|Pontfaverger|Port-à-Binson|Pouillon|Pourcy|Prouilly|Reims|Reuil|Romery|Romigny|Rosnay|Saint-Amand-sur-Fion|Sainte-Euphraise-et-Clairizet|Sainte-Gemme|Saint-Gilles|Saint-Lumier-en-Champagne|Saint-Martin-d\'Ablois|Saint-Thierry|Sarcy|Saudoy|Savigny-sur-Ardres|Selles|Serzy-et-Prin|Sézanne|Soilly|Soulières|Talus-Saint-Prix|Thil|Tramery|Treslon|Trigny|Troissy|Unchair|Val-de-Vière|Vanault-le-Châtel|Vandeuil|Vandières|Vauciennes|Vavray-le-Grand|Vavray-le-Petit|Venteuil|Verneuil|Vert-Toulon|Ville-en-Tardenois|Villers-Franqueux|Villers-sous-Châtillon|Villevenard|Vinay|Vincelles|Vindey|Vitry-en-Perthois',
    'Aisne': 'Barzy-sur-Marne|Passy-sur-Marne|Trélou-sur-Marne|Autres crus du canton de Condé-en-Brie|Autres crus de l\'Aisne',
    'Aube': 'Villenauxe-la-Grande|Autres crus de l\'Aube',
    'Haute-Marne': 'Crus de la Haute-Marne',
    'Seine-et-Marne': 'Crus de la Seine-et-Marne',
  },
  alias: {
    'Aÿ-Champagne': 'Ay',
    'Avenay-Val-d\'Or': 'Avenay',
    'Tauxières-Mutry': 'Tauxières',
    'Vaudemange': 'Vaudemanges',
    'Ville-Dommange': 'Villedommange',
    'Le Mesnil-sur-Oger': 'Mesnil-sur-Oger, Mesnil',
    'Dormans': 'Try, Vassy, Vassieux, Chavenay',
    'Bergères-lès-Vertus': 'Bergères-les-Vertus',
    'Jouy-lès-Reims': 'Jouy-les-Reims',
    'Pargny-lès-Reims': 'Pargny-les-Reims',
    'Écueil': 'Ecueil',
    'Étréchy': 'Etrechy',
    'Épernay': 'Epernay',
    'Étoges': 'Etoges',
    'Les Mesneux': 'Mesneux',
    'Le Breuil': 'Breuil',
    'Sézanne': 'Sézannes',
    'Férébrianges': 'Ferebrianges',
    'Brugny-Vaudancourt': 'Brugny Vaudancourt',
  },
};
const slug = (s) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const cruDefId = (nom) => `cru-${slug(nom)}`;
function DEFAULT_CRUS() {
  const out = []; const A = CRUS_SRC.alias;
  const push = (nom, echelle, dep) => out.push({ id: cruDefId(nom), nom, echelle, dep, alias: A[nom] || '', custom: false });
  CRUS_SRC.grand.split('|').forEach((n) => push(n, 'grand', 'Marne'));
  CRUS_SRC.premier.split('|').forEach((n) => push(n, 'premier', 'Marne'));
  Object.keys(CRUS_SRC.autre).forEach((dep) => CRUS_SRC.autre[dep].split('|').forEach((n) => push(n, 'autre', dep)));
  return out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}
const cruById = (db, id) => (db.crus || []).find((c) => c.id === id) || null;
const cruName = (db, id) => (id ? (cruById(db, id) || { nom: `(${id})` }).nom : '—');
const cruEchelle = (db, id) => { const c = id ? cruById(db, id) : null; return c ? c.echelle : null; };
const cruMatch = (c, q) => { const t = norm(q).trim(); return !t || norm(`${c.nom} ${c.alias || ''} ${c.dep || ''}`).includes(t); };
const apporteurName = (db, id) => (id ? ((db.apporteurs || []).find((a) => a.id === id) || { nom: `(${id})` }).nom : '—');
const siteName = (db, id) => ((db.sites || []).find((s) => s.id === id) || { nom: '—' }).nom;
