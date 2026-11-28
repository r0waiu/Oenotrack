/* ============ CATALOGUE DES OPÉRATIONS : types intégrés, variantes et opérations personnalisées ============ */
// Chaque entrée s'appuie sur un « comportement » du moteur (base) : la variante n'est qu'une façon de la présenter
// (nom, aide, groupe, fiche, stade automatique). Une opération enregistrée garde type = base et sousType = id de la variante :
// toutes les versions d'Œnotrack savent donc la rejouer, même celles qui ne connaissent pas la variante.
const OP_LABELS0 = { ...OP_LABELS, sortie: 'Sortie de vin', suivi: 'Suivi de cuve' };
const OP_GROUPES = ['Vendange & moûts', 'Vinification', 'Élevage & stabilisation', 'Assemblage & stock', 'Tirage & bouteilles', 'Sorties de cave'];
// comportements proposés pour créer une opération (les autres types intégrés ont des formulaires trop spécifiques)
const OP_COMPORTEMENTS = [
  ['suivi', 'Suivi sur une cuve, sans mouvement', 'remontage, bâtonnage, contrôle de température… intrants facultatifs'],
  ['intrant', 'Traitement sur une cuve avec intrants', 'collage, sulfitage, enrichissement, acidification…'],
  ['transfert', 'Transfert vers un autre contenant', 'soutirage, ouillage, changement de contenant… avec pertes'],
  ['filtration', 'Clarification sur place avec pertes', 'filtration, centrifugation…'],
  ['froid', 'Traitement physique sur place', 'froid, chauffage, flash-détente… température et durée'],
  ['sortie', 'Sortie de cave', 'vente en vrac, distillerie, destruction… volume retiré du stock'],
  ['etape', 'Étape sur un lot, sans mouvement', 'remuage, mise sur pointes, dégustation… avec changement de stade'],
];
const OP_BASES_ICONES = { alimentation: '🧫', apport: '🍇', pressurage: '🍇', entree_mout: '🫗', debourbage: '≋', soutirage: '⇩', transfert: '⇢', intrant: '＋', froid: '❄', filtration: '⧖', jaugeage: '📏', assemblage: '⛙', etape: '⇄', declassement: '⚠', preparation: '⚗', tirage: '🍾', degorgement: '🍾', reprise: '📦', sortie: '🚚', suivi: '🌡' };
// menu : raccourci dans le menu d'une cuve (clic droit) · ficheId : modèle de fiche associé (sinon celui du comportement)
// masque : proposé mais masqué par défaut (pratiques d'autres régions ou des vins rouges : à afficher dans Paramètres › Opérations)
const DEFAULT_OPERATIONS = () => ([
  // Vendange & moûts
  { id: 'apport', base: 'apport', label: 'Pesée de vendange', groupe: 'Vendange & moûts' },
  { id: 'pressurage', base: 'pressurage', label: 'Pressurage', groupe: 'Vendange & moûts' },
  { id: 'entree_mout', base: 'entree_mout', label: 'Entrée de moûts', groupe: 'Vendange & moûts' },
  { id: 'entree_vin', base: 'reprise', label: 'Entrée de vin', groupe: 'Vendange & moûts', icone: '⇲', aide: 'Vin acheté ou reçu d’un partenaire (vendeur de vins) : en contenant ou en bouteilles sur lattes.' },
  { id: 'debourbage', base: 'debourbage', label: 'Débourbage', groupe: 'Vendange & moûts', menu: true, stadeAuto: { actif: true, stade: 'mout_debourbe' } },
  // 0.47.0-alpha.2 : débourbage à froid (opération sur moût, distincte de la stabilisation tartrique par le froid)
  { id: 'debourbage_froid', base: 'debourbage', label: 'Débourbage à froid', groupe: 'Vendange & moûts', icone: '❄', aide: 'Débourbage statique du moût maintenu au froid (quelques degrés) ; les bourbes sont enregistrées comme perte.', stadeAuto: { actif: true, stade: 'mout_debourbe' } },
  { id: 'flottation', base: 'debourbage', label: 'Flottation', groupe: 'Vendange & moûts', icone: '≋', aide: 'Clarification rapide du moût par flottation (alternative au débourbage statique) ; les bourbes sont enregistrées comme perte.', stadeAuto: { actif: true, stade: 'mout_debourbe' } },
  { id: 'enzymage', base: 'intrant', label: 'Enzymage', groupe: 'Vendange & moûts', icone: '✲', aide: 'Ajout d’enzymes pectolytiques au moût : facilite le débourbage et la clarification.', motif: 'Enzymage' },
  { id: 'enrichissement', base: 'intrant', label: 'Enrichissement', groupe: 'Vendange & moûts', icone: '⬆', aide: 'Augmentation du titre alcoométrique volumique naturel par ajout de saccharose (chaptalisation), de moût concentré ou de MCR, dans les limites autorisées et déclarées.', motif: 'Enrichissement' },
  { id: 'maceration', base: 'suivi', label: 'Macération (cuvaison)', groupe: 'Vendange & moûts', icone: '◔', aide: 'Vins rouges et rosés de macération : encuvage des raisins, durée et température de macération relevées.', motif: 'Macération', masque: true },
  { id: 'saignee', base: 'transfert', label: 'Saignée', groupe: 'Vendange & moûts', icone: '⤼', aide: 'Rosé de saignée : jus tiré d’une cuve de macération de raisins noirs après quelques heures de contact (précisez la couleur rosé).', masque: true },
  // 0.46.0-alpha.1 — vins rouges et rosés, vins doux : masqués par défaut, proposés par le profil viticole (types de vins)
  { id: 'eraflage', base: 'suivi', label: 'Éraflage / foulage', groupe: 'Vendange & moûts', icone: '⚙', aide: 'Vendange éraflée (égrappée) et foulée à l’encuvage : proportion de vendange entière gardée et observations.', motif: 'Éraflage / foulage', masque: true },
  { id: 'mpf_froid', base: 'froid', label: 'Macération préfermentaire à froid', groupe: 'Vendange & moûts', icone: '❄', aide: 'Vendange encuvée maintenue au froid avant la fermentation (extraction des arômes et de la couleur) : température et durée.', masque: true },
  { id: 'mac_carbonique', base: 'suivi', label: 'Macération carbonique', groupe: 'Vendange & moûts', icone: '◔', aide: 'Raisins entiers en cuve saturée de CO₂ (fermentation intracellulaire), puis pressurage : durée et température relevées.', motif: 'Macération carbonique', masque: true },
  { id: 'mac_semi_carbonique', base: 'suivi', label: 'Macération semi-carbonique', groupe: 'Vendange & moûts', icone: '◔', aide: 'Raisins entiers en cuve fermée, sans ajout de CO₂ (celui des baies écrasées qui fermentent) : durée et température relevées.', motif: 'Macération semi-carbonique', masque: true },
  { id: 'thermovinification', base: 'froid', label: 'Thermovinification', groupe: 'Vendange & moûts', icone: '♨', aide: 'Vendange chauffée avant le pressurage pour extraire la couleur, puis fermentation en phase liquide : température et durée.', masque: true },
  { id: 'flash_detente', base: 'froid', label: 'Flash-détente', groupe: 'Vendange & moûts', icone: '♨', aide: 'Vendange chauffée puis placée brutalement sous vide (éclatement des pellicules, extraction rapide) : température et durée.', masque: true },
  // Vinification
  { id: 'levurage', base: 'intrant', label: 'Levurage', groupe: 'Vinification', icone: '✳', aide: 'Ensemencement en levures sélectionnées ou en levain (pied de cuve) : démarre la fermentation alcoolique.', motif: 'Levurage', menu: true, ficheId: 'levurage', stadeAuto: { actif: true, stade: 'fa' } },
  { id: 'nutrition', base: 'intrant', label: 'Nutrition (activateur, azote)', groupe: 'Vinification', icone: '✚', aide: 'Ajout d’activateur de fermentation, de phosphate diammonique (DAP), de sulfate d’ammonium ou de nutriments organiques pendant la FA.', motif: 'Nutrition' },
  { id: 'suivi', base: 'suivi', label: 'Suivi de fermentation', groupe: 'Vinification', menu: true, aide: 'Densité et température relevées sur la cuve ; intrants facultatifs (activateur, nutriments). La fiche liste toutes les cuves en fermentation.', motif: 'Densité / température' },
  { id: 'remontage', base: 'suivi', label: 'Remontage', groupe: 'Vinification', icone: '↻', aide: 'Vins rouges et macérations : extraction, aération, homogénéisation ; densité et température relevées.', motif: 'Remontage' },
  { id: 'delestage', base: 'suivi', label: 'Délestage', groupe: 'Vinification', icone: '⤵', aide: 'Vins rouges : le jus est vidé puis remonté sur le chapeau de marc.', motif: 'Délestage', masque: true },
  { id: 'pigeage', base: 'suivi', label: 'Pigeage', groupe: 'Vinification', icone: '⤓', aide: 'Vins rouges : le chapeau de marc est enfoncé dans le jus (extraction) ; densité et température relevées.', motif: 'Pigeage', masque: true },
  { id: 'mfc', base: 'froid', label: 'Macération finale à chaud', groupe: 'Vinification', icone: '♨', aide: 'Cuve de vin rouge réchauffée en fin de fermentation pour prolonger l’extraction (tanins, couleur) : température et durée.', masque: true },
  { id: 'arret_fermentation', base: 'froid', label: 'Arrêt de fermentation (froid)', groupe: 'Vinification', icone: '❄', aide: 'Vins moelleux et liquoreux : fermentation arrêtée par le froid (puis sulfitage, filtration) pour garder des sucres : température et durée.', masque: true },
  { id: 'mutage', base: 'intrant', label: 'Mutage', groupe: 'Vinification', icone: '⊕', aide: 'Vins doux naturels et vins de liqueur : ajout d’alcool neutre d’origine viticole (ou d’eau-de-vie de vin) pour arrêter la fermentation, dans les limites du cahier des charges ; le volume ajouté se recale par un jaugeage.', motif: 'Mutage', masque: true },
  { id: 'rechauffage', base: 'froid', label: 'Réchauffage (relance FA / FML)', groupe: 'Vinification', icone: '♨', aide: 'Cuve chauffée ou thermorégulée pour démarrer ou relancer une fermentation (souvent la malolactique) : température et durée.', ficheId: 'suivi' },
  { id: 'ensemencement_fml', base: 'intrant', label: 'Ensemencement malolactique', groupe: 'Vinification', icone: '✳', aide: 'Ajout de bactéries lactiques (ou d’un pied de cuve) : démarre la fermentation malolactique.', motif: 'Ensemencement bactérien', stadeAuto: { actif: true, stade: 'fml' } },
  { id: 'fin_fa', base: 'etape', label: 'Fin de FA constatée', groupe: 'Vinification', icone: '✓', aide: 'Sucres (glucose + fructose) < 2 g/L, confirmés par analyse ; densité sous le seuil de fin de FA (0,994 par défaut, à vérifier) : le lot passe en « Fin de FA ».', stadeAuto: { actif: true, stade: 'fin_fa' } },
  { id: 'fin_fml', base: 'etape', label: 'FML terminée', groupe: 'Vinification', icone: '✓', aide: 'Acide malique dégradé (≤ 0,2 g/L) : le lot passe en « FML terminée ».', stadeAuto: { actif: true, stade: 'fin_fml' } },
  { id: 'ecoulage', base: 'transfert', label: 'Écoulage', groupe: 'Vinification', icone: '⇣', aide: 'Vins rouges : le vin de goutte est séparé du marc en fin de cuvaison (le marc part au pressoir).', masque: true },
  { id: 'pressurage_marcs', base: 'transfert', label: 'Pressurage des marcs (vin de presse)', groupe: 'Vinification', icone: '⇊', aide: 'Après l’écoulage, le marc est pressé : le vin de presse va dans un autre contenant (assemblé ou non au vin de goutte) ; le marc est enregistré comme perte.', masque: true },
  { id: 'sulfitage', base: 'intrant', label: 'Sulfitage', groupe: 'Vinification', icone: 'S', aide: 'Ajout de SO₂ (métabisulfite, solution sulfureuse) : protection contre l’oxydation et les micro-organismes, blocage de la FML.', motif: 'Sulfitage', menu: true },
  { id: 'acidification', base: 'intrant', label: 'Acidification / désacidification', groupe: 'Vinification', icone: '±', aide: 'Ajustement de l’acidité (acide tartrique, carbonate de calcium…) dans les limites autorisées.', motif: 'Ajustement de l’acidité' },
  { id: 'intrant', base: 'intrant', label: 'Ajout d’intrants', groupe: 'Vinification', menu: true },
  // Élevage & stabilisation
  { id: 'soutirage', base: 'soutirage', label: 'Soutirage', groupe: 'Élevage & stabilisation', menu: true, stadeAuto: { actif: true, stade: 'vin_soutire' } },
  { id: 'transfert', base: 'transfert', label: 'Transfert', groupe: 'Élevage & stabilisation', menu: true },
  { id: 'entonnage', base: 'transfert', label: 'Mise en fût (entonnage)', groupe: 'Élevage & stabilisation', icone: '🛢', aide: 'Vin (ou moût) mis en fût, demi-muid ou foudre pour la fermentation ou l’élevage sous bois.', stadeAuto: { actif: true, stade: 'elevage' } },
  { id: 'ouillage', base: 'transfert', label: 'Ouillage', groupe: 'Élevage & stabilisation', icone: '⤓', aide: 'Complément d’un fût ou d’un foudre pour éviter le contact avec l’air, avec du vin pris dans un autre contenant.' },
  { id: 'batonnage', base: 'suivi', label: 'Bâtonnage', groupe: 'Élevage & stabilisation', icone: '〰', aide: 'Remise en suspension des lies fines (élevage sur lies).', motif: 'Bâtonnage' },
  { id: 'elevage_bois', base: 'suivi', label: 'Contrôle d’élevage sous bois', groupe: 'Élevage & stabilisation', icone: '🛢', aide: 'Fûts, demi-muids, foudres : dégustation, niveau, ouillage à prévoir, observations.', motif: 'Élevage sous bois' },
  { id: 'elevage_voile', base: 'suivi', label: 'Élevage sous voile', groupe: 'Élevage & stabilisation', icone: '◌', aide: 'Vin jaune et vins sous voile : fût non ouillé, voile de levures en surface ; état du voile, éthanal, niveau relevés.', motif: 'Élevage sous voile', masque: true },
  { id: 'micro_oxygenation', base: 'suivi', label: 'Micro-oxygénation', groupe: 'Élevage & stabilisation', icone: '○', aide: 'Apport d’oxygène dosé et continu pour stabiliser la couleur et assouplir les tanins : dose (mL/L/mois) et durée relevées.', motif: 'Micro-oxygénation', masque: true },
  { id: 'copeaux', base: 'intrant', label: 'Morceaux de bois de chêne', groupe: 'Élevage & stabilisation', icone: '▤', aide: 'Copeaux ou douelles de chêne : pratique autorisée par le règlement (UE) 2019/934, mais interdite par certains cahiers des charges et labels (à vérifier).', motif: 'Morceaux de bois de chêne', masque: true },
  { id: 'degustation', base: 'suivi', label: 'Dégustation / contrôle', groupe: 'Élevage & stabilisation', icone: '◉', aide: 'Dégustation ou contrôle de la cuve (aspect, odeur, goût, température) : observations dans les notes.', motif: 'Dégustation' },
  { id: 'inertage', base: 'intrant', label: 'Inertage (azote, CO₂)', groupe: 'Élevage & stabilisation', icone: '○', aide: 'Ciel de cuve ou contenant inerté au gaz pour protéger le vin de l’oxygène.', motif: 'Inertage' },
  { id: 'collage', base: 'intrant', label: 'Collage', groupe: 'Élevage & stabilisation', icone: '◍', aide: 'Clarification par une colle (bentonite, gélatine, protéines végétales, colle de poisson…).', motif: 'Collage', menu: true, stadeAuto: { actif: true, stade: 'vin_colle' } },
  { id: 'froid', base: 'froid', label: 'Passage au froid', groupe: 'Élevage & stabilisation', menu: true, aide: 'Stabilisation tartrique par le froid : cuve, température, durée et intrants éventuels.', stadeAuto: { actif: false, stade: 'stabilise' } },
  { id: 'stab_tartrique', base: 'intrant', label: 'Stabilisation tartrique (CMC, KPA…)', groupe: 'Élevage & stabilisation', icone: '❖', aide: 'Stabilisation par additif (carboxyméthylcellulose, polyaspartate de potassium, mannoprotéines…) au lieu ou en complément du froid.', motif: 'Stabilisation tartrique', stadeAuto: { actif: false, stade: 'stabilise' } },
  { id: 'stab_electrodialyse', base: 'filtration', label: 'Stabilisation tartrique par électrodialyse', groupe: 'Élevage & stabilisation', icone: '⚡', aide: 'Extraction d’ions (potassium, tartrates) au travers de membranes sous champ électrique : stabilisation sans passage au froid ; le volume rejeté est enregistré comme perte.' },
  { id: 'stab_cations', base: 'filtration', label: 'Traitement par échangeurs de cations', groupe: 'Élevage & stabilisation', icone: '⚡', aide: 'Stabilisation tartrique sur résines échangeuses de cations, pratique encadrée par le règlement (UE) 2019/934 : volume traité et pertes.', masque: true },
  { id: 'stab_proteique', base: 'intrant', label: 'Stabilisation protéique (bentonite)', groupe: 'Élevage & stabilisation', icone: '◍', aide: 'Élimination des protéines instables (casse protéique) par la bentonite, d’après le test de stabilité.', motif: 'Stabilisation protéique' },
  { id: 'filtration', base: 'filtration', label: 'Filtration', groupe: 'Élevage & stabilisation', menu: true, stadeAuto: { actif: true, stade: 'vin_filtre' } },
  { id: 'centrifugation', base: 'filtration', label: 'Centrifugation', groupe: 'Élevage & stabilisation', icone: '◎', aide: 'Clarification par centrifugeuse ; les dépôts sont enregistrés comme perte.' },
  { id: 'jaugeage', base: 'jaugeage', label: 'Jaugeage', groupe: 'Élevage & stabilisation', menu: true },
  { id: 'etape', base: 'etape', label: 'Changement de stade', groupe: 'Élevage & stabilisation' },
  // Assemblage & stock
  { id: 'assemblage', base: 'assemblage', label: 'Assemblage', groupe: 'Assemblage & stock', stadeAuto: { actif: true, stade: 'assemble' } },
  { id: 'regroupement', base: 'assemblage', label: 'Regroupement de cuves', groupe: 'Assemblage & stock', icone: '⛙', aide: 'Réunion de plusieurs cuves d’un même vin : le stade suit les règles de mélange (ex. vin filtré + vin clarifié = vin clarifié), sans passer en « assemblé ».', stadeAuto: { actif: false, stade: '' } },
  { id: 'assemblage_millesimes', base: 'assemblage', label: 'Assemblage de millésimes', groupe: 'Assemblage & stock', icone: '⛙', aide: 'Vins de plusieurs millésimes réunis (vin non millésimé, vins de réserve ; coupage au sens du règlement délégué (UE) 2019/934, art. 7) : choisissez le millésime du lot (ou « non millésimé ») selon les règles de l’appellation.' },
  { id: 'mise_reserve', base: 'etape', label: 'Mise en vins de réserve', groupe: 'Assemblage & stock', icone: '◈', aide: 'Le lot devient un vin de réserve (conservé pour les assemblages des années suivantes).', nature: 'vin_reserve' },
  { id: 'reprise', base: 'reprise', label: 'Reprise de stock', groupe: 'Assemblage & stock' },
  // Tirage & bouteilles
  { id: 'preparation', base: 'preparation', label: 'Préparation', groupe: 'Tirage & bouteilles' },
  { id: 'alimentation', base: 'alimentation', label: 'Suivi du levain', groupe: 'Tirage & bouteilles', interne: true, aide: 'Étape, alimentation ou relevé d’un levain de tirage.' },
  { id: 'tirage', base: 'tirage', label: 'Tirage (mixtion)', groupe: 'Tirage & bouteilles', stadeAuto: { actif: true, stade: 'tire' } },
  { id: 'remuage', base: 'etape', label: 'Remuage', groupe: 'Tirage & bouteilles', icone: '↯', aide: 'Bouteilles remuées (gyropalettes ou pupitres) puis mises sur pointes : le dépôt est amené au col avant le dégorgement.', stadeAuto: { actif: true, stade: 'sur_pointes' } },
  { id: 'degorgement', base: 'degorgement', label: 'Dégorgement', groupe: 'Tirage & bouteilles' },
  { id: 'mise_bouteille', base: 'tirage', label: 'Mise en bouteille', groupe: 'Tirage & bouteilles', icone: '🍷', interne: true, aide: 'Vin tranquille ou doux mis en bouteille : saisi dans l’onglet « Mise en bouteille » (lot fini, bouchage, DDM, contrôles).' }, // 0.50.0-alpha.2
  // Sorties de cave
  { id: 'sortie', base: 'sortie', label: 'Vente de vin en vrac', groupe: 'Sorties de cave', menu: true, aide: 'Vin ou moût vendu en vrac et enlevé (DAE) : le volume sort du stock de la cave.', motif: 'Vente en vrac' },
  { id: 'distillerie', base: 'sortie', label: 'Prestations viniques (distillerie)', groupe: 'Sorties de cave', icone: '⚗', aide: 'Lies, bourbes ou vins livrés à la distillerie (obligation réglementaire) : le volume sort du stock.', motif: 'Prestations viniques' },
  { id: 'echantillon', base: 'sortie', label: 'Prélèvement d’échantillons', groupe: 'Sorties de cave', icone: '⚲', aide: 'Échantillons prélevés pour un laboratoire, un concours ou un client : le volume sort du stock.', motif: 'Échantillons' },
  { id: 'perte', base: 'sortie', label: 'Perte accidentelle', groupe: 'Sorties de cave', icone: '⚠', aide: 'Fuite, casse ou vin détruit : le volume perdu sort du stock (à déclarer).', motif: 'Perte accidentelle' },
  { id: 'declassement', base: 'declassement', label: 'Déclassement validé', groupe: 'Élevage & stabilisation', interne: true },
]);
const OP_BASES_VISIBLES_MENU = ['soutirage', 'transfert', 'debourbage', 'intrant', 'froid', 'filtration', 'jaugeage', 'suivi', 'sortie']; // opérations sur une portion (menu d'une cuve)

const opList = (db) => (db && db.lists && Array.isArray(db.lists.operations) && db.lists.operations.length ? db.lists.operations : DEFAULT_OPERATIONS());
const opDef = (db, id) => opList(db).find((x) => x.id === id) || (OP_LABELS0[id] ? { id, base: id, label: OP_LABELS0[id] } : null);
const opIcone = (db, id) => { const d = opDef(db, id) || {}; return d.icone || OP_BASES_ICONES[d.base || id] || '•'; };
const opNom = (o) => { if (!o) return ''; const k = o.sousType || (o.f && o.f.sousType) || ''; return (k && OP_LABELS[k]) || OP_LABELS[o.type] || o.type || ''; };
const opBaseLabel = (b) => OP_LABELS0[b] || b;
const opComportement = (b) => (OP_COMPORTEMENTS.find((x) => x[0] === b) || [b, opBaseLabel(b), ''])[1];
// raccourcis du menu d'une cuve : opérations sur une portion marquées « menu »
const opMenu = (db) => opList(db).filter((x) => OP_BASES_VISIBLES_MENU.includes(x.base) && !x.masque && !x.interne && x.menu);
const opSurPortion = (db) => opList(db).filter((x) => OP_BASES_VISIBLES_MENU.includes(x.base) && !x.masque && !x.interne);
// opération « étape » du catalogue qui mène à ce stade (fin de FA constatée, remuage…), sinon le changement de stade générique
const opEtapePour = (db, stade) => { const v = opList(db).find((x) => x.base === 'etape' && !x.masque && x.stadeAuto && x.stadeAuto.actif && x.stadeAuto.stade === stade); return v ? v.id : 'etape'; };
/* module où une opération se saisit (0.39.0-alpha.1) : préparations et mixtions au Tirage, remuage (et autres étapes « Tirage & bouteilles »)
   en Cave, dégorgement au Dégorgement ; le reste dans « Opérations & Assemblages » (vinification en cuve ou en fût). Le journal des
   opérations reste complet ; un module désactivé ou interdit rend la saisie à « Opérations & Assemblages ». */
const OP_MODULES_SAISIE = { preparation: 'tirage', alimentation: 'tirage', tirage: 'tirage', degorgement: 'degorgement' };
function opModuleSaisie(db, x) {
  const d = typeof x === 'string' ? opDef(db, x) : x; if (!d) return 'ops';
  if (d.id === 'mise_bouteille') return 'mise'; // 0.50.0-alpha.2
  if (OP_MODULES_SAISIE[d.base]) return OP_MODULES_SAISIE[d.base];
  return d.id === 'remuage' || d.groupe === OP_GROUPES[4] ? 'cave' : 'ops';
}
// opérations du catalogue saisies dans un module (Cave : remuage et étapes personnalisées du groupe « Tirage & bouteilles »)
const opsDuModule = (db, mod) => opList(db).filter((x) => !x.masque && !x.interne && OP_LABELS0[x.base] !== undefined && opModuleSaisie(db, x) === mod);
// opérations proposées à la saisie (hors types internes et masqués), groupées
const opGroupes = (db, filtre, tous) => [...OP_GROUPES, ...uniq(opList(db).map((x) => x.groupe).filter((g) => g && !OP_GROUPES.includes(g)))].map((g) => ({ title: g, items: opList(db).filter((x) => (x.groupe || OP_GROUPES[1]) === g && OP_LABELS0[x.base] !== undefined && (tous || (!x.masque && !x.interne)) && (!filtre || filtre(x))).map((x) => x.id) })).filter((g) => g.items.length);
// libellés et tons : le catalogue complète OP_LABELS / OP_TONE (utilisés partout) — appelé par syncConfig
function syncOps(db) {
  Object.keys(OP_LABELS).forEach((k) => { if (!(k in OP_LABELS0)) delete OP_LABELS[k]; });
  Object.assign(OP_LABELS, OP_LABELS0);
  opList(db).forEach((x) => { if (x && x.id) { OP_LABELS[x.id] = x.label || OP_LABELS0[x.base] || x.id; if (typeof OP_TONE !== 'undefined' && !OP_TONE[x.id]) OP_TONE[x.id] = OP_TONE[x.base] || ''; } });
  if (typeof OP_TONE !== 'undefined') { OP_TONE.sortie = OP_TONE.sortie || 'bad'; OP_TONE.suivi = OP_TONE.suivi || ''; }
}
