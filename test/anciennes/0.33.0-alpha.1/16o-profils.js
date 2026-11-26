/* ============ PROFILS VITICOLES (0.33.0-alpha.1) : région (bassins français, pays) et types de vins produits ============
   Un profil propose des changements, présentés un par un dans une liste à cocher (aperçu) avant d'être appliqués :
   - onglets : Tirages, Cave et Dégorgement affichés si l'exploitation produit des vins effervescents, masqués sinon ;
   - opérations : celles des vins rouges et rosés (macération, délestage, écoulage, saignée) et le remuage, affichées ou masquées ;
   - stades : « En macération (cuvaison) » ajouté pour les rouges ;
   - listes : cépages et appellations de la région ajoutés ; fractions « goutte » et « presse » hors Champagne ; fractions champenoises
     (tailles, rebêche) retirées du formulaire de pressurage hors Champagne (gardées dans la liste) ;
   - pressoir (profil de pressurage), région (spécificités champenoises, villages champenois inutilisés masqués), échelle de classement ;
   - seuil indicatif : enrichissement maximal (exemple « à vérifier »).
   Personnalisations jamais écrasées : rien n'est supprimé ni renommé ; une opération, une fraction ou un seuil réglés à la main ne
   changent pas (seuls ceux encore à leur valeur d'origine, ou déjà changés par un profil, sont proposés) ; seuls les éléments cochés
   sont appliqués. settings.profilViticole { region, types, le, par, ops: [ids changés], fractions: [ids changés], chaptalMax } :
   champs inconnus gardés ; settings.region (champagne | autre) reste celui que lisent les versions antérieures. */
const PROFIL_TYPES = [
  ['blanc', 'Vins tranquilles blancs'], ['rose', 'Vins tranquilles rosés'], ['rouge', 'Vins tranquilles rouges'],
  ['effervescent', 'Vins effervescents (méthode traditionnelle)'], ['ancestrale', 'Effervescents en méthode ancestrale (pétillant naturel)'],
  ['doux', 'Vins moelleux, liquoreux, vins doux naturels'],
];
const PROFIL_RACCOURCIS = [
  { id: 'champagne', label: 'Champagne', region: 'champagne', types: ['effervescent', 'blanc'] },
  { id: 'cremant', label: 'Crémant + vins tranquilles', types: ['effervescent', 'blanc', 'rose', 'rouge'] },
  { id: 'tranquilles', label: 'Vins tranquilles', types: ['blanc', 'rose', 'rouge'] },
  { id: 'rouges', label: 'Vins rouges', types: ['rouge'] },
];
// cépages : [id, libellé] ; même id d'une région à l'autre pour un même cépage
const PROFIL_C = (s) => s.split('|').map((x) => x.split(':'));
// enrichMax : enrichissement maximal indicatif (% vol), exemple non officiel à vérifier (zones viticoles de l'UE) ; 0 = pas d'exemple
const PROFIL_REGIONS = [
  { id: 'champagne', nom: 'Champagne', pays: 'France', types: ['effervescent', 'blanc'], echelle: 'champagne', enrichMax: 2,
    cepages: PROFIL_C('chard:Chardonnay|pn:Pinot Noir|pm:Meunier'), appellations: ['Champagne', 'Coteaux champenois', 'Rosé des Riceys'] },
  { id: 'alsace', nom: 'Alsace', pays: 'France', types: ['blanc', 'effervescent'], echelle: 'alsace', enrichMax: 2,
    cepages: PROFIL_C('riesling:Riesling|gewurztraminer:Gewurztraminer|pinot_gris:Pinot Gris|pinot_blanc:Pinot Blanc|muscat:Muscat|sylvaner:Sylvaner|pn:Pinot Noir'), appellations: ['Alsace', 'Alsace grand cru', 'Crémant d’Alsace'] },
  { id: 'bourgogne', nom: 'Bourgogne', pays: 'France', types: ['blanc', 'rouge'], echelle: 'bourgogne', enrichMax: 2,
    cepages: PROFIL_C('chard:Chardonnay|pn:Pinot Noir|aligote:Aligoté|gamay:Gamay'), appellations: ['Bourgogne', 'Bourgogne Aligoté', 'Chablis', 'Mâcon', 'Crémant de Bourgogne'] },
  { id: 'beaujolais', nom: 'Beaujolais', pays: 'France', types: ['rouge'], echelle: 'generique', enrichMax: 1.5,
    cepages: PROFIL_C('gamay:Gamay|chard:Chardonnay'), appellations: ['Beaujolais', 'Beaujolais-Villages', 'Morgon', 'Fleurie'] },
  { id: 'bordeaux', nom: 'Bordeaux', pays: 'France', types: ['rouge', 'blanc'], echelle: 'saint-emilion', enrichMax: 1.5,
    cepages: PROFIL_C('merlot:Merlot|cab_sauv:Cabernet-Sauvignon|cab_franc:Cabernet Franc|petit_verdot:Petit Verdot|malbec:Malbec (Côt)|sauvignon:Sauvignon Blanc|semillon:Sémillon|muscadelle:Muscadelle'),
    appellations: ['Bordeaux', 'Bordeaux supérieur', 'Médoc', 'Saint-Émilion', 'Sauternes', 'Crémant de Bordeaux'] },
  { id: 'loire', nom: 'Val de Loire', pays: 'France', types: ['blanc', 'rouge', 'rose', 'effervescent'], echelle: 'generique', enrichMax: 2,
    cepages: PROFIL_C('chenin:Chenin|sauvignon:Sauvignon Blanc|melon:Melon de Bourgogne|cab_franc:Cabernet Franc|gamay:Gamay|grolleau:Grolleau'), appellations: ['Muscadet', 'Anjou', 'Saumur', 'Touraine', 'Vouvray', 'Sancerre', 'Crémant de Loire'] },
  { id: 'rhone', nom: 'Vallée du Rhône', pays: 'France', types: ['rouge', 'blanc'], echelle: 'generique', enrichMax: 1.5,
    cepages: PROFIL_C('syrah:Syrah|grenache:Grenache|mourvedre:Mourvèdre|cinsault:Cinsault|viognier:Viognier|marsanne:Marsanne|roussanne:Roussanne'), appellations: ['Côtes du Rhône', 'Côtes du Rhône Villages', 'Châteauneuf-du-Pape', 'Crozes-Hermitage', 'Clairette de Die'] },
  { id: 'languedoc', nom: 'Languedoc-Roussillon', pays: 'France', types: ['rouge', 'rose', 'blanc'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('grenache:Grenache|syrah:Syrah|carignan:Carignan|mourvedre:Mourvèdre|cinsault:Cinsault|picpoul:Piquepoul|muscat:Muscat'), appellations: ['Languedoc', 'Corbières', 'Minervois', 'Picpoul de Pinet', 'Côtes du Roussillon', 'Crémant de Limoux', 'Banyuls'] },
  { id: 'provence', nom: 'Provence', pays: 'France', types: ['rose', 'rouge', 'blanc'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('grenache:Grenache|cinsault:Cinsault|syrah:Syrah|mourvedre:Mourvèdre|rolle:Rolle (Vermentino)|tibouren:Tibouren'), appellations: ['Côtes de Provence', 'Coteaux d’Aix-en-Provence', 'Bandol', 'Cassis'] },
  { id: 'sud_ouest', nom: 'Sud-Ouest', pays: 'France', types: ['rouge', 'blanc'], echelle: 'generique', enrichMax: 1.5,
    cepages: PROFIL_C('malbec:Malbec (Côt)|tannat:Tannat|negrette:Négrette|fer_servadou:Fer Servadou|colombard:Colombard|gros_manseng:Gros Manseng|petit_manseng:Petit Manseng'), appellations: ['Cahors', 'Madiran', 'Jurançon', 'Gaillac', 'Bergerac'] },
  { id: 'jura_savoie', nom: 'Jura et Savoie', pays: 'France', types: ['blanc', 'rouge'], echelle: 'generique', enrichMax: 2,
    cepages: PROFIL_C('savagnin:Savagnin|chard:Chardonnay|poulsard:Poulsard|trousseau:Trousseau|pn:Pinot Noir|jacquere:Jacquère|mondeuse:Mondeuse|altesse:Altesse'), appellations: ['Côtes du Jura', 'Arbois', 'Château-Chalon', 'Crémant du Jura', 'Savoie', 'Roussette de Savoie'] },
  { id: 'corse', nom: 'Corse', pays: 'France', types: ['rouge', 'rose', 'blanc'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('nielluccio:Nielluccio|sciaccarellu:Sciaccarellu|rolle:Rolle (Vermentino)'), appellations: ['Corse', 'Patrimonio', 'Ajaccio'] },
  { id: 'italie', nom: 'Italie', pays: 'Étranger', types: ['rouge', 'blanc'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('sangiovese:Sangiovese|nebbiolo:Nebbiolo|barbera:Barbera|montepulciano:Montepulciano|glera:Glera|pinot_gris:Pinot Gris|trebbiano:Trebbiano'), appellations: ['Chianti', 'Barolo', 'Prosecco', 'Franciacorta'] },
  { id: 'espagne', nom: 'Espagne', pays: 'Étranger', types: ['rouge', 'blanc'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('tempranillo:Tempranillo|grenache:Grenache|mourvedre:Mourvèdre|albarino:Albariño|verdejo:Verdejo|macabeo:Macabeo|xarello:Xarel·lo'), appellations: ['Rioja', 'Ribera del Duero', 'Rías Baixas', 'Cava'] },
  { id: 'portugal', nom: 'Portugal', pays: 'Étranger', types: ['rouge', 'blanc'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('touriga_nacional:Touriga Nacional|touriga_franca:Touriga Franca|tempranillo:Tempranillo|baga:Baga|alvarinho:Alvarinho|arinto:Arinto'), appellations: ['Douro', 'Porto', 'Vinho Verde', 'Dão'] },
  { id: 'allemagne', nom: 'Allemagne', pays: 'Étranger', types: ['blanc', 'rouge'], echelle: 'generique', enrichMax: 3,
    cepages: PROFIL_C('riesling:Riesling|pn:Pinot Noir|muller_thurgau:Müller-Thurgau|sylvaner:Sylvaner|pinot_gris:Pinot Gris|dornfelder:Dornfelder'), appellations: ['Mosel', 'Rheingau', 'Pfalz', 'Sekt'] },
  { id: 'suisse', nom: 'Suisse', pays: 'Étranger', types: ['blanc', 'rouge'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('chasselas:Chasselas|pn:Pinot Noir|gamay:Gamay|merlot:Merlot|petite_arvine:Petite Arvine'), appellations: ['Valais', 'Vaud', 'Genève', 'Tessin'] },
  { id: 'autriche', nom: 'Autriche', pays: 'Étranger', types: ['blanc', 'rouge'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('gruner:Grüner Veltliner|blaufrankisch:Blaufränkisch|zweigelt:Zweigelt|riesling:Riesling'), appellations: ['Wachau', 'Kamptal', 'Burgenland'] },
  { id: 'etats_unis', nom: 'États-Unis', pays: 'Étranger', types: ['rouge', 'blanc'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('cab_sauv:Cabernet-Sauvignon|chard:Chardonnay|pn:Pinot Noir|zinfandel:Zinfandel|merlot:Merlot'), appellations: ['Napa Valley', 'Sonoma County', 'Willamette Valley'] },
  { id: 'australie', nom: 'Australie', pays: 'Étranger', types: ['rouge', 'blanc'], echelle: 'generique', enrichMax: 0,
    cepages: PROFIL_C('syrah:Syrah (Shiraz)|chard:Chardonnay|cab_sauv:Cabernet-Sauvignon|riesling:Riesling|semillon:Sémillon'), appellations: ['Barossa Valley', 'Hunter Valley', 'Margaret River'] },
  { id: 'autre', nom: 'Autre région', pays: 'Autre', types: ['blanc', 'rouge'], echelle: '', enrichMax: 0, cepages: [], appellations: [] },
];
const profilRegionDef = (id) => PROFIL_REGIONS.find((r) => r.id === id) || null;
const profilViticole = (db) => {
  const s = ((db && db.settings) || {}).profilViticole || {};
  const region = profilRegionDef(s.region) ? s.region : (champenois(db) ? 'champagne' : 'autre');
  const types = Array.isArray(s.types) && s.types.length ? s.types.filter((t) => PROFIL_TYPES.some((x) => x[0] === t)) : (profilRegionDef(region) || {}).types || [];
  return { ...s, region, types, defini: !!profilRegionDef(s.region) };
};
const PROFIL_MODULES_MOUSSE = ['tirage', 'cave', 'degorgement'];
const PROFIL_MODULES_NOMS = { tirage: 'Tirages', cave: 'Cave', degorgement: 'Dégorgement' };
const PROFIL_OPS = { rouge: ['maceration', 'delestage', 'ecoulage'], rose: ['maceration', 'saignee'], mousse: ['remuage'] };
const PROFIL_STADE_MACERATION = { id: 'maceration', label: 'En macération (cuvaison)', court: 'Macération', phase: 'ferm', role: '', couleur: '#8E2F45' };
const PROFIL_FRACTIONS = [{ id: 'goutte', label: 'Goutte', suffix: 'G', pressurage: true }, { id: 'presse', label: 'Presse', suffix: 'P', pressurage: true }];
const PROFIL_FRACTIONS_CHAMPAGNE = ['taille1', 'taille2', 'rebeche'];

// aperçu : les changements que le profil apporterait à cette base ({ id, groupe, label, avant, apres, aVerifier })
function profilPlan(db, region, types) {
  const R = profilRegionDef(region); if (!R) return [];
  const T = (types || []).filter((t) => PROFIL_TYPES.some((x) => x[0] === t)); const pv = profilViticole(db); const out = [];
  const mousse = T.includes('effervescent') || T.includes('ancestrale'); const champ = region === 'champagne';
  const pousser = (id, groupe, label, avant, apres, x) => out.push({ id, groupe, label, avant, apres, ...(x || {}) });
  // onglets
  PROFIL_MODULES_MOUSSE.forEach((m) => { const on = moduleActif(db, m); if (on !== mousse) pousser(`module:${m}`, 'onglets', PROFIL_MODULES_NOMS[m], on ? 'affiché' : 'masqué', mousse ? 'affiché' : 'masqué'); });
  // opérations
  const ops = opList(db); const defOps = DEFAULT_OPERATIONS(); const deja = Array.isArray(pv.ops) ? pv.ops : [];
  const voulues = uniq([...(T.includes('rouge') ? PROFIL_OPS.rouge : []), ...(T.includes('rose') ? PROFIL_OPS.rose : []), ...(mousse ? PROFIL_OPS.mousse : [])]);
  uniq([...PROFIL_OPS.rouge, ...PROFIL_OPS.rose, ...PROFIL_OPS.mousse]).forEach((id) => {
    const o = ops.find((x) => x.id === id); const d = defOps.find((x) => x.id === id); if (!o || !d) return;
    const libre = !!o.masque === !!d.masque || deja.includes(id); // à sa valeur d'origine, ou déjà changée par un profil
    const veut = voulues.includes(id); if (!libre || !!o.masque === !veut) return;
    pousser(`op:${id}`, 'operations', o.label, o.masque ? 'masquée' : 'proposée', veut ? 'proposée' : 'masquée');
  });
  // stades
  if (T.includes('rouge') && !stadeList(db).some((s) => s.id === PROFIL_STADE_MACERATION.id)) pousser('stade:maceration', 'stades', PROFIL_STADE_MACERATION.label, '', 'ajouté');
  // cépages, appellations (ajoutés s'ils manquent ; rien n'est retiré ni renommé)
  const cep = (db.lists && db.lists.cepages) || []; const has = (L, id, label) => L.some((x) => x.id === id || norm(x.label) === norm(label));
  R.cepages.forEach(([id, label]) => { if (!has(cep, id, label)) pousser(`cepage:${id}`, 'cepages', label, '', 'ajouté'); });
  const app = (db.lists && db.lists.appellations) || [];
  R.appellations.forEach((a) => { if (!app.some((x) => norm(x.label) === norm(a))) pousser(`appellation:${a}`, 'appellations', a, '', 'ajoutée'); });
  // fractions
  const fr = fracList(db); const defFr = DEFAULT_FRACTIONS(); const dejaF = Array.isArray(pv.fractions) ? pv.fractions : [];
  if (!champ) PROFIL_FRACTIONS.forEach((f) => { if (!fr.some((x) => x.id === f.id)) pousser(`fraction:${f.id}`, 'fractions', f.label, '', 'ajoutée'); });
  PROFIL_FRACTIONS_CHAMPAGNE.forEach((id) => {
    const f = fr.find((x) => x.id === id); const d = defFr.find((x) => x.id === id); if (!f || !d) return;
    const libre = (f.pressurage !== false) === (d.pressurage !== false) || dejaF.includes(id); const veut = champ; // proposée au pressurage
    if (!libre || (f.pressurage !== false) === veut) return;
    pousser(`pressfrac:${id}`, 'fractions', f.label, f.pressurage !== false ? 'au pressurage' : 'hors pressurage', veut ? 'au pressurage' : 'hors pressurage');
  });
  // pressoir, région, échelle
  const profP = champ ? 'champagne' : (mousse && R.pays === 'France' ? 'cremant' : 'libre'); const pp = pressoirParams(db);
  if (pp.id !== profP) pousser('pressoir', 'pressoir', 'Profil de pressurage', (PRESSOIR_PROFILS[pp.id] || {}).nom || pp.id, PRESSOIR_PROFILS[profP].nom);
  if (champenois(db) !== champ) pousser('region', 'pressoir', 'Spécificités champenoises', champenois(db) ? 'activées' : 'désactivées', champ ? 'activées' : 'désactivées');
  if (!champ && champenois(db)) { const n = (db.crus || []).filter((c) => !c.custom && !c.masque && !cruUsage(db, c.id)).length; if (n) pousser('crus', 'pressoir', 'Villages champenois jamais utilisés', `${n} proposés`, 'masqués'); }
  if (R.echelle && ((db.settings || {}).echellePreset || 'champagne') !== R.echelle) {
    const p = ECHELLE_PRESETS.find((x) => x.id === R.echelle); const ids = p ? p.items.map((x) => x.id) : [];
    const perte = (db.crus || []).filter((c) => c.echelle && !ids.includes(c.echelle)).length;
    if (p && !perte) pousser('echelle', 'pressoir', 'Échelle de classement', ((ECHELLE_PRESETS.find((x) => x.id === ((db.settings || {}).echellePreset || 'champagne')) || {}).nom) || '', p.nom);
  }
  // seuil indicatif : enrichissement maximal (exemple à vérifier), sauf s'il a été réglé à la main
  const st = (db.settings || {}); const libreE = !hasNum(st.chaptalMax) || (hasNum(pv.chaptalMax) && num(pv.chaptalMax) === num(st.chaptalMax));
  if (R.enrichMax > 0 && libreE && chaptalReglages(db).max !== R.enrichMax) pousser('chaptal', 'seuils', 'Enrichissement maximal', `+${fmt(chaptalReglages(db).max, 1)} % vol`, `+${fmt(R.enrichMax, 1)} % vol`, { aVerifier: true });
  return out;
}
const PROFIL_GROUPES = [['onglets', 'Onglets'], ['operations', 'Opérations'], ['stades', 'Stades'], ['cepages', 'Cépages'], ['appellations', 'Appellations'], ['fractions', 'Fractions'], ['pressoir', 'Pressoir, région et classement'], ['seuils', 'Seuils indicatifs (à vérifier)']];
// application : seuls les changements cochés (ids) ; profil enregistré (région, types, date, auteur)
function profilAppliquer(db, region, types, ids, uid) {
  const R = profilRegionDef(region); if (!R) return fail('Région inconnue.');
  const T = uniq((types || []).filter((t) => PROFIL_TYPES.some((x) => x[0] === t))); if (!T.length) return fail('Choisissez au moins un type de vin.');
  const plan = profilPlan(db, region, T); const pris = plan.filter((x) => (ids == null ? true : ids.includes(x.id)));
  const pv = profilViticole(db); const opsCh = Array.isArray(pv.ops) ? [...pv.ops] : []; const frCh = Array.isArray(pv.fractions) ? [...pv.fractions] : [];
  const champ = region === 'champagne'; let chaptalMax = hasNum(pv.chaptalMax) ? pv.chaptalMax : undefined;
  const k = (x) => x.id.slice(x.id.indexOf(':') + 1);
  pris.forEach((x) => {
    if (x.id.startsWith('module:')) moduleActiver(db, k(x), x.apres === 'affiché');
    else if (x.id.startsWith('op:')) { const o = db.lists.operations.find((y) => y.id === k(x)); if (o) { o.masque = x.apres === 'masquée'; if (!opsCh.includes(o.id)) opsCh.push(o.id); } }
    else if (x.id === 'stade:maceration') db.lists.stades.push({ ...PROFIL_STADE_MACERATION });
    else if (x.id.startsWith('cepage:')) { const c = R.cepages.find((y) => y[0] === k(x)); db.lists.cepages.push({ id: c[0], label: c[1] }); }
    else if (x.id.startsWith('appellation:')) { if (!Array.isArray(db.lists.appellations)) db.lists.appellations = []; db.lists.appellations.push({ id: nid(db, 'app'), label: k(x) }); }
    else if (x.id.startsWith('fraction:')) { if (!Array.isArray(db.lists.fractions) || !db.lists.fractions.length) db.lists.fractions = DEFAULT_FRACTIONS(); db.lists.fractions.push({ ...PROFIL_FRACTIONS.find((f) => f.id === k(x)) }); }
    else if (x.id.startsWith('pressfrac:')) { if (!Array.isArray(db.lists.fractions) || !db.lists.fractions.length) db.lists.fractions = DEFAULT_FRACTIONS(); const f = db.lists.fractions.find((y) => y.id === k(x)); if (f) { f.pressurage = x.apres === 'au pressurage'; if (!frCh.includes(f.id)) frCh.push(f.id); } }
    else if (x.id === 'region') regionSet(db, champ ? 'champagne' : 'autre', { crus: pris.some((y) => y.id === 'crus') });
    else if (x.id === 'crus' && !pris.some((y) => y.id === 'region')) (db.crus || []).forEach((c) => { if (!c.custom && !c.masque && !cruUsage(db, c.id)) { c.masque = true; c.masqueRegion = true; } });
    else if (x.id === 'echelle') echellePreset(db, R.echelle);
    else if (x.id === 'chaptal') { db.settings.chaptalMax = R.enrichMax; chaptalMax = R.enrichMax; }
  });
  // profil de pressurage en dernier (le changement de région le remet à sa valeur par défaut)
  if (pris.some((x) => x.id === 'pressoir')) { const profP = champ ? 'champagne' : (T.some((t) => t === 'effervescent' || t === 'ancestrale') && R.pays === 'France' ? 'cremant' : 'libre'); const p = db.settings.pressoir || {}; db.settings.pressoir = { ...p, profil: profP, valeurs: p.profil === profP ? (p.valeurs || {}) : {} }; }
  db.settings.profilViticole = { ...((db.settings || {}).profilViticole || {}), region, types: T, le: todayISO(), par: uid || '', ops: opsCh, fractions: frCh, ...(chaptalMax !== undefined ? { chaptalMax } : {}) };
  return okr({ n: pris.length });
}
