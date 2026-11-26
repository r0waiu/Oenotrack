/* ============ CRUS (VILLAGES) : liste de départ issue du fichier « Échelle des crus en Champagne » ============ */
// Les pourcentages de l'échelle des crus ne sont PAS importés : seul le classement Grand cru / 1er cru / Autre cru est conservé.
// La liste est entièrement modifiable dans Paramètres › Crus (villages) : ajout de crus personnalisés, changement d'échelle, renommage.
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
// Partenaires d'un compartiment d'entrée de moût (0.14.0-alpha.1 : plusieurs, avec leur part en %) → [{ id, part (0..1), pct }]
// Sans liste : le partenaire du compartiment, sinon celui de l'opération (versions antérieures).
/* Données propres à chaque compartiment d'une entrée de moûts (0.14.0-alpha.1 : n° de lot, analyses, plusieurs partenaires).
   Elles sont dans la ligne (op.entrees[i]) et recopiées à part (op.entreesExtra, avec la clé de la ligne) : une version antérieure
   qui réécrit les lignes sans les connaître garde la copie ; on la retrouve par la clé (compartiment, cépage, fraction, volume). */
const MOUT_CHAMPS_V14 = ['numLot', 'apporteurs', 'analyses'];
const cleLigne = (e) => [(e && e.compartiment) || '', (e && e.cepageId) || '', (e && e.fractionId) || '', r2(num(e && e.volL))].join('|');
function entreesExtraDe(entrees) {
  const ex = (entrees || []).map((e) => { const x = {}; MOUT_CHAMPS_V14.forEach((k) => { const v = e && e[k]; if (v != null && v !== '' && !(Array.isArray(v) && !v.length) && !(typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)) x[k] = clone(v); }); return Object.keys(x).length ? { cle: cleLigne(e), ...x } : {}; });
  return ex.some((x) => x.cle) ? ex : null;
}
// copie d'un compartiment : par la clé de la ligne (sûr même si les lignes ont été réordonnées), sinon par la position (copies sans clé)
function ligneExtra(op, i, e) {
  const ex = op && Array.isArray(op.entreesExtra) ? op.entreesExtra : null; if (!ex) return {};
  const ligne = e || ((op.entrees || [])[i]); const idx = i != null && i >= 0 ? i : (ligne && Array.isArray(op.entrees) ? op.entrees.indexOf(ligne) : -1);
  if (ligne) { const c = cleLigne(ligne); const mm = ex.filter((x) => x && x.cle === c); if (mm.length) return (mm.length > 1 && ex[idx] && ex[idx].cle === c ? ex[idx] : mm[0]) || {}; }
  const x = idx >= 0 ? ex[idx] : null; return x && !x.cle ? x : {};
}
// partenaires de la copie, seulement si la ligne a gardé le même partenaire principal (sinon c'est celui choisi ensuite qui compte)
function ligneExtraApporteurs(e, op) {
  if (!e || !op) return [];
  const x = ligneExtra(op, null, e); const L = Array.isArray(x.apporteurs) ? x.apporteurs.filter((a) => a && a.id) : [];
  return L.length && (!e.apporteurId || L[0].id === e.apporteurId) ? L : [];
}
function ligneApporteurs(e, op) {
  let L = Array.isArray(e && e.apporteurs) ? e.apporteurs.filter((x) => x && x.id) : [];
  if (!L.length) L = ligneExtraApporteurs(e, op);
  if (!L.length) { const id = (e && e.apporteurId) || (op && op.apporteurId) || ''; return id ? [{ id, part: 1, pct: null }] : []; }
  const parts = L.map((x) => (hasNum(x.pct) ? num(x.pct) : null)); const tous = parts.every((p) => p != null && p > 0); const tot = tous ? sum(parts) : 0;
  return L.map((x, i) => ({ id: x.id, part: tous && tot > 0 ? parts[i] / tot : 1 / L.length, pct: parts[i] }));
}
// partage des partenaires d'un lot de moût (au prorata des volumes versés et des parts de chaque compartiment)
function moutApporteursLot(op, l) { const app = {}; const add = (k, v) => { app[k] = (app[k] || 0) + v; }; (l.parts || []).forEach((p) => { const la = ligneApporteurs(p.e, op); if (la.length) la.forEach((a) => add(a.id, p.vol * a.part)); else add('?', p.vol); }); return app; }
const ligneApporteursNoms = (db, e, op) => ligneApporteurs(e, op).map((a) => `${apporteurName(db, a.id)}${a.pct != null ? ` (${fmt(a.pct)} %)` : ''}`).join(', ');
/* Plusieurs partenaires dans une même citerne (0.34.0-alpha.1) : op.partenaires = [{ id, apporteurId, ref (n° de bon / DAE), lignes: [clé de ligne…] }],
   chaque moût porte e.partId. op.apporteurId (premier partenaire) et op.ref (n° de bon de chacun, séparés par « / ») restent remplis pour les
   versions antérieures. Une version antérieure qui réécrit les moûts perd e.partId : on retrouve l'onglet par la clé de la ligne, puis par son partenaire. */
function moutPartenaires(op) {
  const L = Array.isArray(op && op.partenaires) ? op.partenaires.filter((p) => p && p.id) : [];
  if (L.length) return L.map((p) => ({ ...p, apporteurId: p.apporteurId || '', ref: p.ref || '' }));
  return [{ id: 'pa1', apporteurId: (op && op.apporteurId) || '', ref: (op && op.ref) || '' }];
}
function lignePartId(op, e, P0) {
  const P = P0 || moutPartenaires(op); if (!e) return P[0].id;
  if (e.partId && P.some((p) => p.id === e.partId)) return e.partId;
  const c = cleLigne(e); const parCle = P.find((p) => Array.isArray(p.lignes) && p.lignes.includes(c)); if (parCle) return parCle.id;
  const ids = (Array.isArray(e.apporteurs) ? e.apporteurs.map((a) => a && a.id) : []).concat(e.apporteurId ? [e.apporteurId] : []).filter(Boolean);
  const parAp = P.find((p) => p.apporteurId && ids.includes(p.apporteurId)); return (parAp || P[0]).id;
}
// n° de bon / DAE d'un moût : celui de son partenaire (onglet), sinon celui de l'opération
function ligneRef(op, e) { if (!Array.isArray(op && op.partenaires) || !op.partenaires.length) return (op && op.ref) || ''; const P = moutPartenaires(op); const p = P.find((x) => x.id === lignePartId(op, e, P)); return (p && p.ref) || (op && op.ref) || ''; }
// n° de bon de tous les partenaires d'une entrée (sans doublon)
const moutRefs = (op) => uniq(moutPartenaires(op).map((p) => String(p.ref || '').trim()).filter(Boolean));
// modèle d'analyse imposé à la réception des moûts (0.34.0-alpha.1) : « Moût · Débourbage »
function moutModeleImpose(db) {
  const M = (db && db.analysesModeles) || [];
  return M.find((m) => m.id === 'm_mout') || M.find((m) => norm(m.nom) === 'mout' && norm(m.etape) === 'debourbage') || M.find((m) => norm(m.nom) === 'mout') || { id: 'm_mout', nom: 'Moût', etape: 'Débourbage', paramIds: ['tap', 'at', 'ph', 'azote'] };
}
const siteName = (db, id) => ((db.sites || []).find((s) => s.id === id) || { nom: '—' }).nom;
