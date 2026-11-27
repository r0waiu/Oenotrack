/* ============ RÉFÉRENTIEL RÉGLEMENTAIRE DES INTRANTS (0.40.0-alpha.1, sources vérifiées le 27/11/2026) ============
   Base préétablie, dans le code (jamais dans la base) : réglementation de l'UE, cahier des charges de l'appellation (selon le vignoble du
   profil régional), labels et démarches (Bio UE, Demeter, Biodyvin, Terra Vitis, Nature & Progrès, AVN, S.A.I.N.S.).
   Pour chaque couple composé actif × référentiel : statut (oui | non | condition), dose maximale d'emploi (g/hL du composé),
   teneur maximale résiduelle ou cumulée dans le vin (mg/L de l'espèce dosée : acide sorbique, cuivre…), condition, texte et article.
   Chaque règle est « vérifiée » (aVerifier: false) seulement si elle a été relue dans le texte officiel en vigueur cité (référence exacte
   dans « ref ») ; sinon elle reste « à vérifier » (CLAUDE.md). Textes relus : règlement délégué (UE) 2019/934 consolidé au 29/12/2024
   (annexe I, tableau 2, dont la note 9 rend applicables les fiches du Code OIV ; annexe I partie B ; annexe II), Code international des
   pratiques œnologiques de l'OIV, édition 2026 ; règlement (UE) 1308/2013 consolidé au 18/08/2026 (annexe VIII ; appendice 1 de
   l'annexe VII) ; règlement d'exécution (UE) 2021/1165 consolidé au 01/01/2026 (annexe V partie D) ; cahier des charges de l'AOC
   « Champagne » homologué par l'arrêté du 31/07/2025 ; cahiers des charges Demeter France (janvier 2024), Biodyvin (26/11/2024),
   Nature & Progrès Vinification (édition 2025), charte S.A.I.N.S. ; AVN (2017, association inactive) et Terra Vitis (diffusé sur
   demande, non consulté) restent « à vérifier ». Le règlement (CE) 1333/2008 (catégorie 14.2.2) renvoie, pour le vin, au 2019/934.
   Corrections de l'exploitation : db.settings.referentiel = { actif (absent = oui), exceptions: { 'label|composé' | 'label|so2t|vin':
     { statut, doseMax, teneurMax, valeur, condition, par, le } } } (réglage commun, droit Intrants ; les champs inconnus sont gardés).
   Revendications de l'exploitation → référentiels : lists.qualifs[].referentiels (absent : deviné d'après l'identifiant et le nom).
   Lot : lots[].labelsVises = [ids du référentiel] (labels visés en plus de la revendication).
   Produit : produits[].composes = [{ id, part }] (part : g de composé par g — ou par mL — de produit ; absent : deviné d'après le nom,
     « 2 % » dans le nom → 0,02, sinon produit solide supposé pur ; produit liquide de teneur inconnue : dose et teneur non estimées). */
const REG_TEXTES = {
  ue: 'Règlement délégué (UE) 2019/934, annexe I partie A, tableau 2 (version consolidée du 29/12/2024) et fiches du Code international des pratiques œnologiques de l’OIV qu’il rend applicables (note 9 ; Code OIV, édition 2026)',
  ue_t1: 'Règlement délégué (UE) 2019/934, annexe I partie A, tableau 1 (version consolidée du 29/12/2024)',
  ue_so2: 'Règlement délégué (UE) 2019/934, annexe I partie B (teneurs maximales en anhydride sulfureux)',
  ue_zones: 'Règlement (UE) n° 1308/2013, annexe VIII partie I (version consolidée du 18/08/2026) ; règlement délégué (UE) 2019/934, annexe II partie A (vins mousseux)',
  champagne: 'Cahier des charges de l’AOC « Champagne » homologué par l’arrêté du 31 juillet 2025 (JORF du 5 août 2025)',
  bio: 'Règlement d’exécution (UE) 2021/1165, annexe V partie D (version consolidée du 01/01/2026)',
  bio_so2: 'Règlement d’exécution (UE) 2021/1165, annexe V partie D, ligne « Anhydride sulfureux » (version consolidée du 01/01/2026)',
  bio_sucre: 'Règlement (UE) 2018/848, annexe II partie VI (origine biologique des produits d’enrichissement) — à vérifier',
  bio_pratiques: 'Règlement (UE) 2018/848, annexe II partie VI (pratiques et procédés : filtration) — à vérifier',
  demeter: 'Cahier des charges Demeter France, édition janvier 2024, § 7.12.2 « Règles de transformation – vin » (tableau 27) ; fiche technique Viticulture 2026',
  biodyvin: 'Cahier des charges Biodyvin (SIVCBD), seconde partie « Vinification – élevage », version du 26 novembre 2024',
  terravitis: 'Cahier des charges Terra Vitis (diffusé sur demande, non consulté) — à vérifier',
  np: 'Cahier des charges Vinification Nature & Progrès, édition 2025',
  vmn: 'Charte d’engagement « Vin Méthode Nature » du Syndicat de défense des vins nature’l (16 points), mise à jour du 23 mars 2023',
  sains: 'Charte de l’Association des Vins S.A.I.N.S. (vins-sains.org, consultée le 27/11/2026)',
};
// herite : référentiels dont les règles s'appliquent aussi (la plus restrictive l'emporte) ; defaut 'non' : tout intrant non listé est refusé
// (liste fermée du cahier des charges : Bio UE, Demeter, Nature & Progrès, VMN, S.A.I.N.S.) ; inconnu 'non' : un produit dont aucun composé
// n'est reconnu est aussi refusé (« aucun intrant » : VMN, S.A.I.N.S.) — 0.43.0-alpha.1 : VMN (Vin Méthode Nature) remplace AVN
const REG_LABELS = [
  { id: 'ue', label: 'Réglementation UE', court: 'UE', type: 'reglement', herite: [], texte: 'ue', note: 'S’applique à tous les vins ; seuls les composés du tableau 2 de l’annexe I du règlement 2019/934 sont autorisés (article 3).' },
  { id: 'aoc-champagne', label: 'AOC Champagne', court: 'AOC', type: 'appellation', regions: ['champagne'], herite: ['ue'], texte: 'champagne', note: 'Appliqué quand le vignoble du profil régional est la Champagne (zone viticole B).' },
  { id: 'bio-ue', verifie: true, label: 'Bio européen (UE)', court: 'BIO', type: 'label', herite: ['ue'], texte: 'bio', defaut: 'non', note: 'Seuls les produits et substances de l’annexe V partie D du règlement 2021/1165 sont utilisables.' },
  { id: 'demeter', verifie: true, label: 'Demeter', court: 'DEM', type: 'label', herite: ['bio-ue'], texte: 'demeter', defaut: 'non', note: 'Tous les produits et méthodes non mentionnés sont interdits ; au plus 5 interventions tolérées par cuvée ; certification bio exigée.' },
  { id: 'biodyvin', label: 'Biodyvin', court: 'BDV', type: 'label', herite: ['bio-ue'], texte: 'biodyvin', note: 'Raisins bio et biodynamiques ; produits issus de l’agriculture biologique quand ils existent, conformes au Codex et non OGM.' },
  { id: 'terra-vitis', label: 'Terra Vitis', court: 'TV', type: 'label', herite: ['ue'], texte: 'terravitis', note: 'Cahier des charges non consulté (diffusé sur demande) : règles de l’UE seulement.' },
  { id: 'nature-progres', verifie: true, label: 'Nature & Progrès', court: 'N&P', type: 'label', herite: ['bio-ue'], texte: 'np', defaut: 'non', note: 'Raisins N&P ou bio ; tout procédé ou intrant non « recommandé » ou « autorisé » est interdit.' },
  { id: 'vmn', verifie: true, label: 'Vin Méthode Nature', court: 'VMN', type: 'label', herite: ['bio-ue'], texte: 'vmn', defaut: 'non', inconnu: 'non', note: 'Raisins 100 % bio certifiés (AB ou Nature & Progrès), vendange manuelle, levures indigènes ; aucun intrant œnologique ; ni filtration ni technique physique brutale ; aucun sulfite avant et pendant les fermentations, au plus 30 mg/L de SO₂ total dans le vin fini ; effervescent : seul du jus de raisin apporte le sucre de la prise de mousse.' },
  { id: 'sains', verifie: true, label: 'Vins S.A.I.N.S.', court: 'SAINS', type: 'label', herite: ['ue'], texte: 'sains', defaut: 'non', inconnu: 'non', note: 'Vendange manuelle sans produits de synthèse ; levures et bactéries indigènes ; aucun intrant ni sulfite ajouté.' },
];
const refLabel = (id) => REG_LABELS.find((l) => l.id === id) || null;
const refLabelNom = (id) => (refLabel(id) || { label: id || '—' }).label;
// espèces dosées dans le vin (teneur résiduelle ou cumulée)
const REG_ESPECES = { sorbique: 'acide sorbique', cuivre: 'cuivre', metatartrique: 'acide métatartrique', cmc: 'carboxyméthylcellulose', polyaspartate: 'polyaspartate de potassium', ascorbique: 'acide ascorbique', citrique: 'acide citrique ajouté', fumarique: 'acide fumarique', argent: 'argent' };
// composés actifs : [id, libellé, mots (catCle du nom et de la composition), familles du catalogue, espèce dosée, facteur (g d'espèce par g de composé)]
const REG_COMPOSES = [
  ['so2', 'Anhydride sulfureux (SO₂, sulfites)', /\b(sulfit|bisulfite|metabisulfite|anhydride sulfureux|so2|solution sulfureuse|efferbaktol|oenosteryl|meche|soufre)/, ['sulfitage', 'méchage']],
  ['bisulfite-ammonium', 'Bisulfite d’ammonium', /\bbisulfite (d )?ammonium|\bbisulfite nh4/],
  ['levures', 'Levures sélectionnées', /\b(levure(?!s? inactiv)|saccharomyces|bayanus|zymaflore)/, ['levure']],
  ['levures-inactivees', 'Levures inactivées, autolysats, écorces de levures', /\b(levures? inactiv|ecorces? de levure|autolysat|derives? de levure|parois de levure)/, ['produit de levure']],
  ['mannoproteines', 'Mannoprotéines de levures', /\bmannoprot/],
  ['dap', 'Phosphate diammonique, sulfate d’ammonium', /\b(phosphate (di)?ammonique|phosphate diammonique|sulfate d ammonium|dap)\b/],
  ['thiamine', 'Thiamine (vitamine B1)', /\bthiamine/],
  ['enzymes', 'Enzymes (pectolytiques, glucanases…)', /\b(enzym|pectinase|pectolyt|glucanase)/, ['enzyme']],
  ['bacteries', 'Bactéries lactiques', /\b(bacteri|oenococcus|malolact)/, ['bactérie']],
  ['bentonite', 'Bentonite', /\bbentonite/, ['bentonite']],
  ['gelatine', 'Gélatine', /\bgelatine/],
  ['colle-poisson', 'Colle de poisson (ichtyocolle)', /\b(ichtyocolle|colle de poisson)/],
  ['caseine', 'Caséine, caséinate de potassium', /\bcasein/],
  ['albumine', 'Albumine d’œuf', /\b(albumin|ovalbumin|blanc d oeuf)/],
  ['proteines-vegetales', 'Protéines végétales (pois, pomme de terre, blé)', /\bproteines? (vegetales?|de pois|de pomme de terre|de ble)\b/],
  ['silice', 'Dioxyde de silicium (gel, solution colloïdale)', /\b(silice|dioxyde de silicium|kieselsol)/],
  ['kaolin', 'Kaolin', /\bkaolin/],
  ['pvpp', 'PVPP', /\b(pvpp|polyvinylpolypyrrolidone)/, ['pvpp']],
  ['charbon', 'Charbon œnologique', /\bcharbon/, ['charbon']],
  ['tanins', 'Tanins œnologiques', /\b(tanin|tannin)/, ['tanin']],
  ['chitosane', 'Chitosane (Aspergillus niger, Agaricus bisporus)', /\bchitosan/],
  ['copeaux', 'Morceaux de bois de chêne (copeaux, douelles)', /\b(copeau|chips|douelle|stave|morceaux de bois)/, ['bois']],
  ['acide-ascorbique', 'Acide L-ascorbique', /\bascorbique/, [], 'ascorbique'],
  ['acide-citrique', 'Acide citrique', /\bacide citrique/, [], 'citrique'],
  ['acide-tartrique', 'Acide L(+) tartrique (acidification)', /\bacide (l )?tartrique/],
  ['acide-malique', 'Acide malique', /\bacide (dl |l )?malique/],
  ['acide-lactique', 'Acide lactique', /\bacide lactique/],
  ['desacidifiants', 'Désacidifiants (bicarbonate de potassium, carbonate de calcium)', /\b(bicarbonate de potassium|carbonate de calcium|tartrate neutre de potassium|desacid)/, ['désacidifiant']],
  ['bitartrate', 'Hydrogénotartrate de potassium (bitartrate, crème de tartre)', /\b(bitartrate|hydrogenotartrate|creme de tartre)/],
  ['alginates', 'Alginates (adjuvants de remuage)', /\balginate/, ['adjuvant de remuage']],
  ['acide-metatartrique', 'Acide métatartrique', /\bmetatartrique/, [], 'metatartrique'],
  ['gomme-arabique', 'Gomme arabique', /\b(gomme arabique|gomme|arabique)/, ['gomme arabique'], 'gomme'],
  ['cmc', 'Carboxyméthylcellulose (CMC)', /\b(cmc|carboxymethylcellulose|carboxymethyl cellulose)\b/, [], 'cmc'],
  ['polyaspartate', 'Polyaspartate de potassium', /\b(polyaspartate|kpa)\b/, [], 'polyaspartate'],
  ['sorbate', 'Sorbate de potassium', /\bsorbate/, [], 'sorbique', 0.7464], // C6H7KO2 (150,22) → C6H8O2 (112,13)
  ['acide-sorbique', 'Acide sorbique', /\bacide sorbique/, [], 'sorbique'],
  ['lysozyme', 'Lysozyme', /\blysozym/],
  ['dmdc', 'Dicarbonate de diméthyle (DMDC)', /\b(dicarbonate|dmdc|velcorin)/],
  ['sulfate-cuivre', 'Sulfate de cuivre', /\bsulfate de cuivre/, [], 'cuivre', 0.2545], // CuSO₄·5H₂O (249,69) → Cu (63,55)
  ['citrate-cuivre', 'Citrate de cuivre', /\bcitrate de cuivre/, [], 'cuivre', 0.3528], // Cu₂C₆H₄O₇·2,5H₂O (360,2) → 2 Cu (127,1)
  ['acide-fumarique', 'Acide fumarique', /\bfumari/, [], 'fumarique'],
  ['ferrocyanure', 'Ferrocyanure de potassium', /\bferrocyanure/],
  ['phytate', 'Phytate de calcium', /\bphytate/],
  ['chlorure-argent', 'Chlorure d’argent', /\bchlorure d argent/, [], 'argent', 0.7527], // AgCl (143,32) → Ag (107,87)
  ['filtration', 'Adjuvants de filtration (perlite, terre de diatomées, cellulose)', /\b(perlite|diatom|kieselgu|terre d infusoires|plaques? filtrantes?|plaques? de filtration|cellulose en poudre)/, ['filtration']],
  ['sucre', 'Saccharose, moût concentré (rectifié) : enrichissement, liqueurs', /\b(sucre|saccharose|mcr|mout concentre)/, ['sucre / MCR']],
].map(([id, label, re, familles, espece, facteur]) => ({ id, label, re, familles: familles || [], espece: espece === 'gomme' ? null : espece || null, facteur: facteur || 1 }));
const refCompose = (id) => REG_COMPOSES.find((c) => c.id === id) || null;
// règles : composé|référentiel|statut|dose max (g/hL de composé)|teneur max (mg/L de l'espèce)|condition|texte|article ou ligne|v (vérifié)
const REG_REGLES_TXT = `so2|ue|oui|||Teneur maximale en SO₂ total selon le type de vin (plafonds ci-dessous)|ue|lignes 2.1 à 2.3 ; annexe I partie B|v
bisulfite-ammonium|ue|condition|20||Fermentation alcoolique seulement ; 0,2 g/L exprimé en sels, dans la limite globale des sels d’ammonium (1 g/L)|ue|ligne 4.4 et appendice 3|v
levures|ue|oui||||ue|lignes 1.11 et 9.1|v
levures-inactivees|ue|oui||||ue|lignes 4.6 à 4.8 et 10.5|v
mannoproteines|ue|oui|||Doses déterminées par le responsable du traitement|ue|ligne 6.10 ; fiche OIV 3.3.13|v
dap|ue|condition|100||Fermentation alcoolique seulement ; 1 g/L exprimé en sels (sels d’ammonium ensemble) ; 0,3 g/L pour la seconde fermentation des vins mousseux (prise de mousse)|ue|lignes 4.2 et 4.3 ; appendice 3|v
thiamine|ue|condition|0.06||Fermentation alcoolique seulement ; 0,6 mg/L exprimée en thiamine pour chaque traitement|ue|ligne 4.5|v
enzymes|ue|condition|||Uniquement pour la macération, la clarification, la stabilisation, la filtration et la révélation des précurseurs aromatiques|ue|lignes 7.2 à 7.8|v
bacteries|ue|oui||||ue|lignes 1.12 et 9.2|v
bentonite|ue|oui||||ue|ligne 5.9 ; fiche OIV 3.3.5|v
gelatine|ue|oui||||ue|ligne 5.1|v
colle-poisson|ue|oui||||ue|ligne 5.5|v
caseine|ue|oui||||ue|lignes 5.6 et 5.7|v
albumine|ue|oui||||ue|ligne 5.8|v
proteines-vegetales|ue|oui||||ue|lignes 5.2 à 5.4|v
silice|ue|oui||||ue|ligne 5.10|v
kaolin|ue|oui||||ue|ligne 5.11|v
pvpp|ue|oui|80|||ue|ligne 5.16 ; fiche OIV 3.4.9|v
charbon|ue|condition|100||Moûts, MCR et vins blancs seulement ; moins de 100 g de charbon sec par hL ; ni décoloration des vins rouges ou rosés, ni traitement successif du moût et du vin|ue|ligne 3.1 ; fiches OIV 2.1.9 et 3.5.9|v
tanins|ue|oui||||ue|lignes 5.12 et 6.4|v
chitosane|ue|condition|100||Chitosane d’Aspergillus niger ou d’Agaricus bisporus ; 100 g/hL (clarification, métaux lourds), 500 g/hL (contaminants), 10 g/hL (Brettanomyces)|ue|lignes 5.13 et 10.3 ; fiche OIV 3.4.16|v
copeaux|ue|condition|||Morceaux de bois de chêne (Quercus) non brûlés, sans traitement chimique (prescriptions de l’appendice 7)|ue_t1|tableau 1, ligne 11 ; appendice 7|v
acide-ascorbique|ue|oui|25|300|250 mg/L par traitement ; 300 mg/L au plus dans le vin (acides ascorbique et déhydroascorbique) quand le raisin ou le moût ont aussi été traités|ue|ligne 2.6 ; fiches OIV 2.2.7 et 3.4.7 (règlement délégué 2024/3085)|v
acide-citrique|ue|oui||1000|1 g/L au plus dans le vin traité mis sur le marché|ue|lignes 1.10 et 6.3 ; fiche OIV 3.3.8|v
acide-tartrique|ue|condition|400||Acidification ≤ 4 g/L exprimée en acide tartrique ; cuvée de vins mousseux ≤ 1,5 g/L (2,5 g/L les années exceptionnelles) ; acidification et enrichissement s’excluent|ue_zones|1308/2013 annexe VIII I C ; 2019/934 annexe II A 8 et 9 ; ligne 1.1|v
acide-malique|ue|condition|||Acidification ≤ 4 g/L exprimée en acide tartrique (soit 53,3 meq/L)|ue_zones|1308/2013 annexe VIII I C ; ligne 1.2|v
acide-lactique|ue|condition|||Acidification ≤ 4 g/L exprimée en acide tartrique (soit 53,3 meq/L)|ue_zones|1308/2013 annexe VIII I C ; ligne 1.3|v
desacidifiants|ue|condition|||Désacidification des vins ≤ 1 g/L exprimée en acide tartrique ; acidification et désacidification d’un même produit s’excluent|ue_zones|1308/2013 annexe VIII I C 3 et 5 ; lignes 1.4 à 1.6 et 1.9|v
bitartrate|ue|condition|||Uniquement pour favoriser la précipitation des sels tartriques|ue|ligne 6.1|v
acide-metatartrique|ue|oui|10||Au dernier moment, avant la mise en bouteille ; 10 g/hL au plus|ue|ligne 6.7 ; fiche OIV 3.3.7|v
gomme-arabique|ue|oui|30||Après la dernière filtration ou juste avant l’embouteillage ; 0,3 g/L au plus (0,8 g/L pour les vins de liqueur rouges)|ue|ligne 6.8 ; fiche OIV 3.3.6 (2022)|v
cmc|ue|condition|20||Stabilisation tartrique seulement ; vins blancs, rosés et mousseux ; moins de 200 mg/L|ue|ligne 6.11 ; fiche OIV 3.3.14|v
polyaspartate|ue|condition|10||Stabilisation tartrique seulement ; 10 g/hL au plus|ue|ligne 6.13 ; fiche OIV 3.3.15|v
alginates|ue|condition|||Uniquement pour les vins mousseux et pétillants obtenus par fermentation en bouteille, avec séparation des lies par dégorgement|ue|lignes 5.17 et 5.18|v
sorbate|ue|oui||200|Peu avant la mise en bouteille ; 200 mg/L au plus exprimés en acide sorbique|ue|ligne 2.4 ; fiche OIV 3.4.5|v
acide-sorbique|ue|non|||Seul le sorbate de potassium (ligne 2.4) figure au tableau 2|ue|ligne 2.4 ; article 3|v
lysozyme|ue|oui|50||500 mg/L au plus, moût et vin cumulés|ue|ligne 2.5 ; fiche OIV 3.4.12|v
dmdc|ue|condition|20||Inscription au registre ; peu avant l’embouteillage ; 200 mg/L au plus ; vin mis sur le marché seulement quand le DMDC n’est plus décelable|ue|ligne 2.7 ; fiche OIV 3.4.13|v
sulfate-cuivre|ue|oui|1|1|1 g/hL ; cuivre du vin traité ≤ 1 mg/L (2 mg/L pour certains vins de liqueur)|ue|ligne 10.1 ; fiche OIV 3.5.8|v
citrate-cuivre|ue|oui|1|1|1 g/hL ; cuivre du vin traité ≤ 1 mg/L (2 mg/L pour certains vins de liqueur)|ue|ligne 10.2 ; fiche OIV 3.5.14|v
acide-fumarique|ue|condition|60||Inhibition de la fermentation malolactique ; 300 à 600 mg/L|ue|ligne 6.14 ; fiches OIV 3.4.2 et 3.4.23|v
ferrocyanure|ue|condition|||Conditions de l’appendice 4 (sous la responsabilité d’un œnologue ; traces de fer obligatoires après traitement)|ue|ligne 6.5 ; appendice 4|v
phytate|ue|condition|8||Vins rouges seulement ; 8 g/hL au plus ; conditions de l’appendice 4|ue|ligne 6.6 ; appendice 4|v
chlorure-argent|ue|non|||Ne figure pas au tableau 2 : non autorisé dans l’Union|ue|article 3 et tableau 2|v
filtration|ue|oui|||Adjuvants de filtration inertes, sans résidus indésirables dans le produit traité|ue_t1|tableau 1, ligne 3 ; fiches OIV 2.1.11 et 3.2.2|v
sucre|ue|condition|||Enrichissement par saccharose, MC ou MCR : +2 % vol en zone B (Champagne), +3 en A, +1,5 en C ; sucrage à sec exclu dans certains départements du Sud ; liqueur de tirage ≤ +1,5 % vol ; liqueur d’expédition ≤ +0,5 % vol ; édulcoration de la cuvée interdite|ue_zones|1308/2013 annexe VIII I A et B ; 2019/934 annexe II A 4 à 7|v
copeaux|aoc-champagne|non|||L’utilisation de morceaux de bois est interdite|champagne|chapitre Ier, IX, 1° f)|v
sucre|aoc-champagne|condition|||Après enrichissement, titre alcoométrique volumique total ≤ 13 % après prise de mousse ; augmentation du volume ≤ 1,12 % pour 1 % vol (enrichissement, liqueur de tirage)|champagne|chapitre Ier, IX, 1° f) et 2° d)|v
so2|bio-ue|condition|||Anhydride sulfureux, bisulfite et métabisulfite de potassium seulement ; plafonds de SO₂ total réduits (ci-dessous)|bio_so2||v
bisulfite-ammonium|bio-ue|non|||Ne figure pas à l’annexe V partie D|bio||v
levures|bio-ue|condition|||Pour les différentes souches de levure : biologiques si disponibles|bio||v
levures-inactivees|bio-ue|oui|||Autolysats, écorces de levures, levures inactivées|bio||v
mannoproteines|bio-ue|oui||||bio||v
dap|bio-ue|condition|||Seul l’hydrogénophosphate de diammonium (le sulfate d’ammonium ne figure pas à l’annexe)|bio||v
thiamine|bio-ue|oui||||bio||v
enzymes|bio-ue|condition|||Pectines lyases, pectine méthylestérase, polygalacturonase, hémicellulase, cellulase : à des fins de clarification seulement|bio||v
bacteries|bio-ue|oui||||bio||v
bentonite|bio-ue|oui||||bio||v
gelatine|bio-ue|condition|||Provenant de matières premières biologiques si elles sont disponibles|bio||v
colle-poisson|bio-ue|condition|||Provenant de matières premières biologiques si elles sont disponibles|bio||v
caseine|bio-ue|condition|||Caséine biologique si disponible ; caséinates de potassium sans condition|bio||v
albumine|bio-ue|condition|||Ovalbumine biologique si disponible|bio||v
proteines-vegetales|bio-ue|condition|||Protéines de blé, de pois ou de pomme de terre biologiques si disponibles|bio||v
silice|bio-ue|oui||||bio||v
kaolin|bio-ue|non|||Ne figure pas à l’annexe V partie D|bio||v
pvpp|bio-ue|non||||bio||v
charbon|bio-ue|oui||||bio||v
tanins|bio-ue|condition|||Provenant de matières premières biologiques si elles sont disponibles|bio||v
chitosane|bio-ue|condition|||Seul le chitosane dérivé d’Aspergillus niger|bio||v
copeaux|bio-ue|oui||||bio||v
acide-ascorbique|bio-ue|oui||||bio||v
acide-citrique|bio-ue|oui||||bio||v
acide-tartrique|bio-ue|oui||||bio||v
acide-malique|bio-ue|non||||bio||v
acide-lactique|bio-ue|oui||||bio||v
desacidifiants|bio-ue|condition|||Tartrate de potassium, bicarbonate de potassium, carbonate de calcium (pas le carbonate de potassium)|bio||v
bitartrate|bio-ue|oui||||bio||v
acide-metatartrique|bio-ue|oui||||bio||v
gomme-arabique|bio-ue|condition|||Provenant de matières premières biologiques si elles sont disponibles|bio||v
cmc|bio-ue|non||||bio||v
polyaspartate|bio-ue|non||||bio||v
alginates|bio-ue|condition|||Alginate de potassium seulement (l’alginate de calcium ne figure pas à l’annexe)|bio||v
sorbate|bio-ue|non||||bio||v
acide-sorbique|bio-ue|non||||bio||v
lysozyme|bio-ue|non||||bio||v
dmdc|bio-ue|non||||bio||v
sulfate-cuivre|bio-ue|non||||bio||v
citrate-cuivre|bio-ue|oui||||bio||v
acide-fumarique|bio-ue|non||||bio||v
ferrocyanure|bio-ue|non||||bio||v
phytate|bio-ue|non||||bio||v
chlorure-argent|bio-ue|non||||bio||v
filtration|bio-ue|condition|||Filtration autorisée (taille des pores d’au moins 0,2 µm)|bio_pratiques||
sucre|bio-ue|condition|||Saccharose, moût concentré et MCR d’origine biologique|bio_sucre||
so2|demeter|condition|||SO₂ pur gazeux ou en solution, bisulfite et métabisulfite de potassium ; pastilles effervescentes interdites|demeter|7.12.2.11|v
levures|demeter|condition|||Levures indigènes ; levurage exogène (souche bio) seulement pour la prise de mousse ou en cas d’arrêt ou de fermentation languissante (intervention tolérée)|demeter|7.12.2.8|v
levures-inactivees|demeter|condition|||Écorces de levures (Demeter ou bio) en cas d’arrêt de fermentation ; autolysats ou levures inactivées si carence avérée (< 100 mg/L d’azote assimilable)|demeter|7.12.2.8|v
dap|demeter|non|||Aucun nutriment pour levures, hors écorces et autolysats|demeter|7.12.2.8|v
thiamine|demeter|non|||Aucun nutriment pour levures, hors écorces et autolysats|demeter|7.12.2.8|v
enzymes|demeter|non|||Enzymes interdites quel que soit leur usage œnologique|demeter|7.12.2.6|v
bacteries|demeter|condition|||Ensemencement en cas de difficulté de départ ou d’arrêt de la fermentation malolactique ; bactéries sans OGM|demeter|7.12.2.10|v
sucre|demeter|condition|||Sucre, MC ou MCR Demeter (à défaut bio) : jusqu’à +0,9 % vol (1 intervention) ou +1,5 % vol (2) ; liqueur de tirage ≤ +1,5 % vol ; liqueur d’expédition pour les effervescents|demeter|7.12.2.7|v
bitartrate|demeter|condition|||Bitartrate de potassium biodynamique ou bio si possible (intervention tolérée)|demeter|7.12.2.12|v
albumine|demeter|condition|||Blanc d’œuf Demeter ou bio (intervention tolérée)|demeter|7.12.2.13|v
proteines-vegetales|demeter|condition|||Protéines de pois, de blé ou de pomme de terre, biologiques si disponibles (intervention tolérée)|demeter|7.12.2.13|v
caseine|demeter|condition|||Caséine (intervention tolérée)|demeter|7.12.2.13|v
bentonite|demeter|condition|||Bentonite, de préférence sodique (intervention tolérée)|demeter|7.12.2.13|v
charbon|demeter|condition|||Charbon végétal sur moût uniquement (intervention tolérée)|demeter|7.12.2.13|v
chitosane|demeter|condition|10||Sous dérogation de Demeter France, uniquement contre Brettanomyces bruxellensis ; utilisable en bio ; compte pour 2 interventions|demeter|7.12.2.13|v
acide-tartrique|demeter|condition|150||Acidification à l’acide tartrique seulement, 1,5 g/L au plus ; analyse requise|demeter|7.12.2.15|v
desacidifiants|demeter|condition|||Bicarbonate de potassium seulement ; analyse requise|demeter|7.12.2.15|v
filtration|demeter|condition|||Cellulose, polypropylène, perlite, terre de diatomées, céramique ; une intervention quel que soit le nombre de passages|demeter|7.12.2.14|v
tanins|demeter|non|||Ajout de tanins interdit|demeter|7.12.2.16|v
copeaux|demeter|non|||Tout ajout de bois au vin ou au moût est interdit (tonneaux autorisés)|demeter|7.12.2.16|v
copeaux|biodyvin|non|||Aromatisation avec des douelles ou des copeaux de bois interdite|biodyvin|seconde partie, préambule|v
desacidifiants|biodyvin|non|||Désacidification interdite|biodyvin|seconde partie, préambule|v
so2|nature-progres|condition|||Solutions sulfureuses à 6 %, SO₂ pur liquéfié, mèches (récipients vides) et pastilles de soufre (récipients en bois secs) seulement ; apports à l’encuvage, en fin de FML et à la mise|np|IV.1 et IV.2|v
levures|nature-progres|condition|||En cas de difficultés de fermentation : levures bio, non OGM, non aromatiques ; levurage systématique interdit|np|III|v
tanins|nature-progres|condition|||Tanins sur vendange seulement, sous contrôle d’un œnologue|np|V.1|v
albumine|nature-progres|condition|||Albumine de blancs d’œufs biologiques (poudre non biologique tolérée provisoirement)|np|VI.1|v
caseine|nature-progres|condition|||Caséine pure (lactique) garantie sans résidus|np|VI.1|v
bentonite|nature-progres|condition|||Bentonites sodiques déconseillées|np|VI.1|v
kaolin|nature-progres|condition|||Autorisé mais déconseillé|np|VI.1|v
sucre|nature-progres|condition|||+1 % vol au plus : sucre de canne ou de betterave bio, sucre de raisin, MC ou MCR N&P ou bio|np|VIII|v
acide-tartrique|nature-progres|condition|100||Dans le Midi, en dernier recours, sur moût seulement, avec l’accord d’un œnologue : 1 g/L sur blancs, 0,5 g/L sur rouges|np|IX.1|v
filtration|nature-progres|condition|||Plaques cellulosiques, perlite (filtre presse), kieselguhr à titre provisoire ; filtration stérilisante systématique interdite|np|VI.2|v
desacidifiants|nature-progres|condition|||Bicarbonate de potassium ; carbonate de calcium toléré si une analyse le justifie|np|IX.2|v
filtration|vmn|non|||Aucune technique physique brutale : osmose inverse, filtration, filtration tangentielle, flash-pasteurisation, centrifugation (toute autre technique : avis préalable du Syndicat)|vmn|point 6|v
so2|vmn|condition|||Aucun sulfite avant et pendant les fermentations ni dans les pieds de cuve ; ajustement du vin fini seulement, 30 mg/L de SO₂ total au plus (analyse Frantz Paul), mention et logo « < 30 mg/L de sulfites » ; sans sulfites ajoutés : 20 mg/L au plus|vmn|points 7 et 11|v
levures|vmn|non|||Levures indigènes uniquement|vmn|point 3|v
sucre|vmn|non|||Aucun intrant œnologique ; effervescent : seul du jus de raisin apporte le sucre de la prise de mousse (levain « maison » de jus frais ou de vin en fermentation), mise à niveau au dégorgement avec du Vin Méthode Nature|vmn|points 4 et 8|v
so2|sains|non|||Aucun sulfite ajouté|sains||v`;
const REG_REGLES = REG_REGLES_TXT.split('\n').map((l) => { const [compose, label, statut, d, t, condition, texte, ref, v] = l.split('|'); return { compose, label, statut, doseMax: d ? Number(d) : null, teneurMax: t ? Number(t) : null, condition: condition || '', source: REG_TEXTES[texte] || '', ref: ref || '', verifie: v === 'v' }; });
// plafonds de SO₂ total (mg/L) : référentiel|vin|valeur|précision|texte|article|v (vérifié)
const REG_SO2_TXT = `ue|rouge|150|sucres < 5 g/L (200 au-delà)|ue_so2|A.1 a) et A.2 a)|v
ue|blanc_rose|200|sucres < 5 g/L (250 au-delà)|ue_so2|A.1 b) et A.2 b)|v
ue|effervescent|185|vins mousseux de qualité (235 pour les autres vins mousseux)|ue_so2|C.1|v
bio-ue|rouge|100|sucres < 2 g/L (plafond de l’UE réduit de 30 mg/L au-delà)|bio_so2||v
bio-ue|blanc_rose|150|sucres < 2 g/L (plafond de l’UE réduit de 30 mg/L au-delà)|bio_so2||v
bio-ue|effervescent|155|plafond de l’UE (185) réduit de 30 mg/L ; 205 pour les autres vins mousseux|bio_so2||v
demeter|rouge|70|sucres < 5 g/L ; 100 en dérogation (2 interventions)|demeter|7.12.2.11|v
demeter|blanc_rose|90|sucres < 5 g/L ; 120 en dérogation (2 interventions)|demeter|7.12.2.11|v
demeter|effervescent|70|sucres < 12 g/L (100 au-delà) ; 100 en dérogation (2 interventions)|demeter|7.12.2.11|v
biodyvin|rouge|80|sucres ≤ 5 g/L ; 110 après un élevage de plus de 9 mois|biodyvin|seconde partie|v
biodyvin|blanc_rose|105|sucres ≤ 5 g/L ; 135 après un élevage de plus de 9 mois|biodyvin|seconde partie|v
biodyvin|effervescent|96|Champagnes, Crémants, mousseux ≤ 15 g/L de sucre (104 au-delà) ; +30 après un élevage de plus de 9 mois|biodyvin|seconde partie|v
nature-progres|rouge|40|vins rouges|np|IV.3|v
nature-progres|blanc_rose|40|rosés et blancs secs (100 pour les demi-secs et moelleux)|np|IV.3|v
nature-progres|effervescent|40|mousseux et effervescents|np|IV.3|v
vmn|rouge|30|vin fini, analyse Frantz Paul ; 20 mg/L pour « sans sulfites ajoutés »|vmn|points 7 et 11|v
vmn|blanc_rose|30|vin fini, analyse Frantz Paul ; 20 mg/L pour « sans sulfites ajoutés »|vmn|points 7 et 11|v
vmn|effervescent|30|vin fini, analyse Frantz Paul ; 20 mg/L pour « sans sulfites ajoutés »|vmn|points 7 et 11|v`;
const REG_SO2 = REG_SO2_TXT.split('\n').map((l) => { const [label, vin, v, note, texte, ref, ok] = l.split('|'); return { label, vin, valeur: Number(v), note, source: REG_TEXTES[texte] || '', ref: ref || '', verifie: ok === 'v' }; });
const REG_STATUTS = { oui: 'autorisé', non: 'interdit', condition: 'sous condition' };
const REG_POIDS = { oui: 0, condition: 1, non: 2 };

/* ---------- réglage, revendications de l'exploitation, labels d'un lot ---------- */
function refReglage(db) { const r = db && db.settings && db.settings.referentiel && typeof db.settings.referentiel === 'object' ? db.settings.referentiel : {}; return { actif: r.actif !== false, exceptions: r.exceptions && typeof r.exceptions === 'object' ? r.exceptions : {} }; }
const refActif = (db) => refReglage(db).actif;
// référentiels d'une revendication de l'exploitation : choisis (lists.qualifs[].referentiels), sinon devinés d'après l'identifiant et le nom
function refDeviner(q) {
  if (!q) return []; const s = catCle(`${q.id || ''} ${q.label || q.code || ''} ${q.court || ''}`);
  if (/\bsains\b/.test(s)) return ['sains']; if (/\bvmn\b|\bavn\b|vins? naturels?|methode nature/.test(s)) return ['vmn']; if (/biodyvin/.test(s)) return ['biodyvin'];
  if (/demeter|\bdem\b/.test(s)) return ['demeter']; if (/nature (et |and )?progres|\bn p\b/.test(s)) return ['nature-progres']; if (/terra ?vitis/.test(s)) return ['terra-vitis'];
  if (/\bbio\b|biolog|organic|\bab\b|fr bio/.test(s)) return ['bio-ue']; return [];
}
// 0.43.0-alpha.1 : référentiels renommés (AVN → VMN, Vin Méthode Nature) ; les rattachements existants basculent, la bascule est tracée
const REG_LABELS_RENOMMES = { avn: 'vmn' };
function refMigrerLabels(db) {
  if (!db) return 0; let n = 0; const ren = (x) => { if (REG_LABELS_RENOMMES[x]) { n += 1; return REG_LABELS_RENOMMES[x]; } return x; };
  ((db.lists && db.lists.qualifs) || []).forEach((q) => { if (q && Array.isArray(q.referentiels) && q.referentiels.some((x) => REG_LABELS_RENOMMES[x])) q.referentiels = uniq(q.referentiels.map(ren)); });
  [...(db.lots || []), ...(db.lotsFinis || [])].forEach((l) => { if (l && Array.isArray(l.labelsVises) && l.labelsVises.some((x) => REG_LABELS_RENOMMES[x])) l.labelsVises = uniq(l.labelsVises.map(ren)); });
  const rg = db.settings && db.settings.referentiel; const ex = rg && rg.exceptions;
  if (ex) Object.keys(ex).forEach((k) => { const [a, ...b] = k.split('|'); if (REG_LABELS_RENOMMES[a]) { const nk = [REG_LABELS_RENOMMES[a], ...b].join('|'); if (!ex[nk]) ex[nk] = ex[k]; delete ex[k]; n += 1; } });
  if (n) { db.settings = db.settings || {}; db.settings.referentiel = db.settings.referentiel || {}; const t = db.settings.referentiel.renommes || []; Object.keys(REG_LABELS_RENOMMES).forEach((de) => { if (!t.some((x) => x.de === de)) t.push({ de, vers: REG_LABELS_RENOMMES[de], le: todayISO(), n }); }); db.settings.referentiel.renommes = t; }
  return n;
}
function qualifReferentiels(db, qid) {
  const q = (qualifList(db) || []).find((x) => x.id === qid); if (!q) return [];
  if (Array.isArray(q.referentiels)) return q.referentiels.filter((x) => refLabel(x) && refLabel(x).type === 'label');
  return refDeviner(q);
}
function qualifReferentielsSet(db, qid, ids) {
  const q = (db.lists.qualifs || []).find((x) => x && x.id === qid); if (!q) return fail('Revendication introuvable.');
  q.referentiels = uniq((ids || []).filter((x) => refLabel(x) && refLabel(x).type === 'label')); return okr();
}
// appellation : référentiel de l'appellation du vignoble choisi dans le profil régional (Champagne par défaut, comme le reste de l'application)
function refAppellation(db) {
  const pv = (db && db.settings && db.settings.profilViticole) || {}; const reg = pv.region || (regionDe(db) === 'champagne' ? 'champagne' : '');
  const l = REG_LABELS.find((x) => x.type === 'appellation' && (x.regions || []).includes(reg)); return l ? l.id : null;
}
// chaîne d'héritage : le label, puis ceux dont il reprend les règles
function refChaine(ids) { const out = []; const add = (id) => { const l = refLabel(id); if (!l || out.includes(id)) return; out.push(id); (l.herite || []).forEach(add); }; (ids || []).forEach(add); return out; }
const refLotDe = (db, R, lotId) => (R && R.lots && R.lots[lotId]) || (db.lots || []).find((x) => x.id === lotId) || (db.lotsFinis || []).find((x) => x.id === lotId) || null;
// référentiels d'un lot : UE, appellation, ceux de sa revendication, labels visés (lots[].labelsVises) — avec leur origine
function refLabelsPour(db, qualifId, vises) {
  const base = ['ue']; const ap = refAppellation(db); if (ap) base.push(ap);
  const rev = qualifId ? qualifReferentiels(db, qualifId) : []; const vis = (Array.isArray(vises) ? vises : []).filter((x) => refLabel(x));
  const ids = refChaine([...vis, ...rev, ...base]);
  return ids.map((id) => ({ id, origine: vis.includes(id) ? 'vise' : rev.includes(id) ? 'revendication' : id === ap ? 'appellation' : id === 'ue' ? 'base' : 'herite' }));
}
function refLabelsLot(db, R, lotId) { const l = refLotDe(db, R, lotId); return l ? refLabelsPour(db, l.qualif, l.labelsVises) : []; }
function lotLabelsVises(db, lotId, ids) {
  const l = (db.lots || []).find((x) => x.id === lotId) || (db.lotsFinis || []).find((x) => x.id === lotId); if (!l) return fail('Lot introuvable.');
  const L = uniq((ids || []).filter((x) => refLabel(x) && refLabel(x).type === 'label')); if (L.length) l.labelsVises = L; else delete l.labelsVises; return okr();
}

/* ---------- composés d'un produit ---------- */
const REF_CACHE = new WeakMap();
function refComposesDe(p) {
  if (!p || p.categorie === 'sec') return [];
  if (Array.isArray(p.composes)) return p.composes.filter((x) => x && refCompose(x.id)).map((x) => ({ id: x.id, part: num(x.part) > 0 ? Math.min(1, num(x.part)) : 1, choisi: true, supposee: !(num(x.part) > 0) }));
  const sig = `${p.nom}|${p.famille}|${p.composition}`; const c = REF_CACHE.get(p); if (c && c.sig === sig) return c.val;
  const t = ` ${catCle(`${p.nom || ''} ${p.composition || ''}`)} `; const pc = /(\d+(?:[.,]\d+)?)\s*%/.exec(String(p.nom || '')); const part = pc && num(pc[1]) > 0 && num(pc[1]) < 100 ? num(pc[1]) / 100 : null;
  let val = REG_COMPOSES.filter((k) => k.re.test(t) || (p.famille && k.familles.includes(p.famille))).map((k) => ({ id: k.id, part: part || 1, supposee: !part, devine: true }));
  if (val.some((x) => x.id === 'bisulfite-ammonium')) val = val.filter((x) => x.id !== 'dap'); // « bisulfite d'ammonium » n'est pas un sel nutritif
  if (val.some((x) => x.id === 'levures-inactivees')) val = val.filter((x) => x.id !== 'levures');
  if (val.some((x) => x.id === 'acide-sorbique')) val = val.filter((x) => x.id !== 'sorbate');
  if (val.some((x) => x.id === 'citrate-cuivre')) val = val.filter((x) => x.id !== 'acide-citrique');
  if (val.some((x) => x.id === 'gomme-arabique') && val.length > 1 && !/gomme/.test(t)) val = val.filter((x) => x.id !== 'gomme-arabique');
  REF_CACHE.set(p, { sig, val }); return val;
}

/* ---------- règle d'un composé pour un référentiel, combinée sur plusieurs référentiels ---------- */
function refRegle(db, labelId, composeId) {
  const ex = refReglage(db).exceptions[`${labelId}|${composeId}`];
  const r = REG_REGLES.find((x) => x.label === labelId && x.compose === composeId);
  if (ex && REG_STATUTS[ex.statut]) return { compose: composeId, label: labelId, statut: ex.statut, doseMax: hasNum(ex.doseMax) ? num(ex.doseMax) : null, teneurMax: hasNum(ex.teneurMax) ? num(ex.teneurMax) : null, condition: String(ex.condition || (r && r.condition) || ''), source: `Correction de l’exploitation${ex.le ? ` (${ex.le})` : ''}`, exception: true, aVerifier: false, par: ex.par || '', le: ex.le || '' };
  if (r) return { ...r, exemple: !r.verifie, aVerifier: !r.verifie };
  const l = refLabel(labelId); if (l && l.defaut === 'non') return { compose: composeId, label: labelId, statut: 'non', doseMax: null, teneurMax: null, condition: 'Aucun intrant hors de ceux que le label accepte', source: REG_TEXTES[l.texte] || '', defaut: true, exemple: !l.verifie, aVerifier: !l.verifie };
  return null;
}
// combinaison sur une liste de référentiels : la plus restrictive l'emporte (statut, dose, teneur), avec ses origines
function refCombiner(db, labelIds, composeId) {
  const R0 = labelIds.map((id) => refRegle(db, id, composeId)).filter(Boolean); if (!R0.length) return null;
  const pire = R0.reduce((m, r) => (REG_POIDS[r.statut] > REG_POIDS[m.statut] ? r : m), R0[0]);
  const dm = R0.filter((r) => r.doseMax != null).sort((a, b) => a.doseMax - b.doseMax)[0] || null; const tm = R0.filter((r) => r.teneurMax != null).sort((a, b) => a.teneurMax - b.teneurMax)[0] || null;
  return { compose: composeId, statut: pire.statut, statutPar: pire.label, doseMax: dm ? dm.doseMax : null, dosePar: dm ? dm.label : null, teneurMax: tm ? tm.teneurMax : null, teneurPar: tm ? tm.label : null,
    conditions: R0.filter((r) => r.statut === 'condition' && r.condition).map((r) => ({ label: r.label, texte: r.condition })), regles: R0, aVerifier: R0.some((r) => r.aVerifier) };
}
// produit sans composé reconnu : seuls les labels « aucun intrant » le refusent
const REF_SANS_COMPOSE = '(produit sans composé reconnu)';
// avis du référentiel sur un produit, pour une revendication (et des labels visés) : interdit, dose maximale du produit (unité du produit)
function refRegleProduit(db, p, qualifId, vises) {
  if (!refActif(db) || !p || p.categorie === 'sec') return null;
  const labels = refLabelsPour(db, qualifId, vises).map((x) => x.id); const comps = refComposesDe(p); const avis = [];
  comps.forEach((c) => { const r = refCombiner(db, labels, c.id); if (r) avis.push({ ...r, part: c.part, supposee: c.supposee }); });
  if (!comps.length) { const nl = labels.filter((id) => (refLabel(id) || {}).inconnu === 'non'); if (nl.length) avis.push({ compose: null, statut: 'non', statutPar: nl[0], doseMax: null, teneurMax: null, conditions: [], regles: [], aVerifier: true, sansCompose: true }); }
  if (!avis.length) return null;
  const interdit = avis.find((a) => a.statut === 'non') || null; let doseMax = null; let dosePar = null; let doseCompose = null;
  const du = doseUnit(p.unite);
  // produit liquide de teneur inconnue (gomme arabique en solution, solution sulfureuse…) : dose du composé non estimée (sinon fausse alerte)
  const liquide = p.unite === 'mL' || p.unite === 'L'; const nonEstime = avis.filter((a) => a.supposee && liquide && a.doseMax != null).map((a) => a.compose);
  if (du) avis.forEach((a) => { if (a.doseMax == null || (a.supposee && liquide)) return; const d = a.doseMax / (a.part || 1); if (doseMax == null || d < doseMax) { doseMax = Math.round(d * 1e6) / 1e6; dosePar = a.dosePar; doseCompose = a.compose; } });
  return { labels, avis, nonEstime, interdit: !!interdit, interditPar: interdit ? interdit.statutPar : null, interditCompose: interdit ? interdit.compose : null, doseMax, dosePar, doseCompose, conditions: avis.flatMap((a) => a.conditions.map((x) => ({ ...x, compose: a.compose }))), aVerifier: avis.some((a) => a.aVerifier) };
}

/* ---------- teneurs dans le vin : espèces apportées par les intrants cumulés d'un lot ---------- */
// conc : { produitId: dose cumulée (g/hL ou mL/hL de produit) } → { espèce: mg/L }
function refTeneursDe(db, conc) {
  const out = {}; const prods = Object.fromEntries((db.produits || []).map((p) => [p.id, p]));
  Object.keys(conc || {}).forEach((pid) => { if (pid[0] === '@') return; const p = prods[pid]; if (!p || !doseUnit(p.unite)) return; const d = num(conc[pid]); if (!(d > 0)) return;
    const liquide = p.unite === 'mL' || p.unite === 'L';
    refComposesDe(p).forEach((c) => { const k = refCompose(c.id); if (!k || !k.espece || (c.supposee && liquide)) return; /* liquide de teneur inconnue : non estimé */ const o = (out[k.espece] = out[k.espece] || { espece: k.espece, mgL: 0, produits: [], supposee: false }); const v = d * c.part * k.facteur * 10; o.mgL += v; o.produits.push({ produitId: pid, compose: c.id, mgL: v }); if (c.supposee) o.supposee = true; }); });
  return out;
}
// plafond de teneur d'une espèce pour des référentiels : le plus bas des composés de cette espèce
function refTeneurMax(db, labels, espece) {
  let best = null; REG_COMPOSES.filter((k) => k.espece === espece).forEach((k) => { const r = refCombiner(db, labels, k.id); if (r && r.teneurMax != null && (!best || r.teneurMax < best.max)) best = { max: r.teneurMax, label: r.teneurPar, compose: k.id, aVerifier: r.aVerifier }; });
  return best;
}
function refTeneursLot(db, R, lotId, conc) {
  const labels = refLabelsLot(db, R, lotId).map((x) => x.id); const T = refTeneursDe(db, conc || ((R.conc || {})[lotId] || {}));
  return Object.values(T).map((t) => { const m = refTeneurMax(db, labels, t.espece); return { ...t, libelle: REG_ESPECES[t.espece] || t.espece, max: m ? m.max : null, maxPar: m ? m.label : null, aVerifier: !!(m && m.aVerifier), depasse: !!(m && t.mgL > m.max + 1e-9) }; })
    .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
}

/* ---------- SO₂ total : plafonds du référentiel pour un lot ---------- */
function refSo2(db, labelId, vin) {
  const ex = refReglage(db).exceptions[`${labelId}|so2t|${vin}`]; if (ex && num(ex.valeur) > 0) return { label: labelId, vin, valeur: num(ex.valeur), note: String(ex.note || ''), source: 'Correction de l’exploitation', exception: true, aVerifier: false };
  const r = REG_SO2.find((x) => x.label === labelId && x.vin === vin); return r ? { ...r, exemple: !r.verifie, aVerifier: !r.verifie } : null;
}
// candidats du référentiel : un plafond vérifié de l'exploitation pour la revendication (même type de vin) remplace celui de ses labels
function refSo2Plafonds(db, R, lotId, typeVin, verifieExploitation) {
  if (!refActif(db)) return []; const l = refLotDe(db, R, lotId); if (!l) return [];
  return refLabelsLot(db, R, lotId).filter((x) => !verifieExploitation || x.origine === 'vise').map((x) => refSo2(db, x.id, typeVin)).filter(Boolean)
    .map((r) => ({ id: `ref-${r.label}-${r.vin}`, qualifId: l.qualif, objet: 'so2t', vin: r.vin, valeur: r.valeur, unite: 'mg/L', note: r.note, source: r.source, exemple: !!r.exemple, aVerifier: r.aVerifier, referentiel: r.label }));
}

/* ---------- conformité d'un lot (alerte a posteriori) : intrants non conformes, doses, teneurs, SO₂ total ---------- */
function lotConformite(db, R, lotId) {
  if (!refLotDe(db, R, lotId)) return [];
  const just = (pid) => Object.values(R.depass || {}).some((L) => L.some((x) => x.lotId === lotId && x.justifie && (!pid || x.produitId === pid)));
  const out = [];
  lotIntrantsCumul(db, R, lotId).forEach((x) => {
    if (x.interdit) out.push({ type: 'interdit', produitId: x.produitId, p: x.p, label: x.regle && x.regle.refInterditPar, compose: x.regle && x.regle.refInterditCompose, justifie: just(x.produitId), aVerifier: x.aVerifier });
    else if (x.depasse) out.push({ type: 'cumul', produitId: x.produitId, p: x.p, valeur: x.dose, max: x.max, unite: x.unite, label: x.regle && x.regle.refDosePar, justifie: just(x.produitId), aVerifier: x.aVerifier });
  });
  if (refActif(db)) refTeneursLot(db, R, lotId).filter((t) => t.depasse).forEach((t) => out.push({ type: 'teneur', espece: t.espece, libelle: t.libelle, valeur: t.mgL, max: t.max, unite: 'mg/L', label: t.maxPar, produits: t.produits, justifie: t.produits.some((x) => just(x.produitId)), aVerifier: t.aVerifier, supposee: t.supposee }));
  const e = so2TotalEstime(db, R, lotId); if (e.depasse && e.plafond) out.push({ type: 'so2t', valeur: e.estime, max: e.plafond.valeur, unite: 'mg/L', label: e.plafond.referentiel || null, qualif: e.plafond.qualifId, justifie: just(null), aVerifier: !!e.plafond.aVerifier });
  return out;
}
// lots en alerte (registre de traçabilité, cuverie) : lots du rejeu ayant au moins une alerte non justifiée (ou toutes avec tous)
function lotsNonConformes(db, R, tous) {
  return Object.keys(R.lots || {}).map((id) => ({ lotId: id, alertes: lotConformite(db, R, id) })).filter((x) => x.alertes.length && (tous || x.alertes.some((a) => !a.justifie)));
}
const refAlerteTexte = (db, a) => {
  const L = a.label ? refLabelNom(a.label) : ''; const nom = a.p ? a.p.nom : 'Intrant';
  if (a.type === 'interdit') return L ? `${nom} : non autorisé (${L})` : `${nom} : non autorisé`;
  if (a.type === 'cumul') { const v = `${fmt(a.valeur, 1)} ${a.unite}`; const m = fmt(a.max, 1); return L ? `${nom} : dose cumulée ${v} > ${m} (${L})` : `${nom} : dose cumulée ${v} > ${m}`; }
  if (a.type === 'teneur') { const m = fmt(a.max, a.max < 1 ? 2 : 0); return L ? `${a.libelle} : ${fmt(a.valeur, 1)} mg/L > ${m} mg/L (${L})` : `${a.libelle} : ${fmt(a.valeur, 1)} mg/L > ${m} mg/L`; }
  return L ? `SO₂ total estimé ${fmt(a.valeur, 0)} mg/L > ${fmt(a.max, 0)} mg/L (${L})` : `SO₂ total estimé ${fmt(a.valeur, 0)} mg/L > ${fmt(a.max, 0)} mg/L`;
};

/* ---------- synthèse commune aux deux sous-onglets « Produits & règles » et « Revendications & plafonds » ---------- */
// pour une revendication : chaque produit du catalogue de l'exploitation, sa règle, les règles de substance et l'avis du référentiel, la règle effective
function revendicationSynthese(db, qualifId) {
  return (db.produits || []).filter((p) => p.categorie !== 'sec').map((p) => {
    const base = ruleFor(db, p.id, qualifId); const eff = regleEffective(db, p, qualifId); const ref = refRegleProduit(db, p, qualifId);
    const conflit = !!(base && base.autorise && eff && !eff.autorise) || !!(base && base.autorise && hasNum(base.doseMax) && eff && eff.doseMax != null && num(base.doseMax) > eff.doseMax + 1e-9);
    const propose = ref ? (ref.interdit ? false : true) : null; // avis du référentiel pour la règle du produit
    return { id: p.id, p, base, eff, ref, conflit, ecartRef: !!(ref && base && propose !== !!base.autorise), composes: refComposesDe(p) };
  }).sort((a, b) => a.p.nom.localeCompare(b.p.nom, 'fr'));
}
// règle du produit alignée sur le référentiel (autorisation, dose maximale), marquée « à vérifier » avec sa source
function regleDepuisReferentiel(db, pid, qualifId, uid) {
  const p = (db.produits || []).find((x) => x.id === pid); if (!p) return fail('Produit introuvable.'); if (p.categorie === 'sec') return fail('Matière sèche : sans règle de revendication.');
  const ref = refRegleProduit(db, p, qualifId); if (!ref) return fail('Le référentiel ne se prononce pas sur ce produit (aucun composé reconnu).');
  const src = ref.interdit ? `Référentiel Œnotrack : interdit (${refLabelNom(ref.interditPar)})` : `Référentiel Œnotrack${ref.doseMax != null ? ` : dose max (${refLabelNom(ref.dosePar)})` : ''}`;
  return regleSet(db, pid, qualifId, { autorise: !ref.interdit, doseMax: ref.interdit ? null : ref.doseMax, aVerifier: true, source: src.slice(0, 200), referentiel: { le: todayISO(), par: uid || '' } });
}
function reglesDepuisReferentiel(db, qualifId, uid) {
  let n = 0; (db.produits || []).filter((p) => p.categorie !== 'sec' && p.actif !== false).forEach((p) => { const qs = qualifId ? [qualifId] : qualifList(db).map((q) => q.id); qs.forEach((q) => { const ref = refRegleProduit(db, p, q); if (!ref) return; const r = ruleFor(db, p.id, q); if (r && r.aVerifier === false && !!r.autorise === !ref.interdit && (ref.doseMax == null || (hasNum(r.doseMax) && num(r.doseMax) <= ref.doseMax))) return; if (regleDepuisReferentiel(db, p.id, q, uid).ok) n += 1; }); });
  return okr({ n });
}
// correction d'une valeur du référentiel par l'exploitation (gardée dans le réglage commun, tracée)
function refExceptionSet(db, cle, s, uid) {
  if (!/^[a-z0-9-]+\|[a-z0-9-]+(\|[a-z_]+)?$/.test(String(cle || ''))) return fail('Valeur du référentiel inconnue.');
  const [lab, comp, vin] = String(cle).split('|'); if (!refLabel(lab) || (comp !== 'so2t' && !refCompose(comp)) || (comp === 'so2t' && !VINS_TYPES.some((v) => v.id === vin))) return fail('Valeur du référentiel inconnue.');
  db.settings = db.settings || {}; const r = (db.settings.referentiel = db.settings.referentiel && typeof db.settings.referentiel === 'object' ? db.settings.referentiel : {}); r.exceptions = r.exceptions && typeof r.exceptions === 'object' ? r.exceptions : {};
  if (s == null) { delete r.exceptions[cle]; return okr(); }
  if (comp === 'so2t') { if (!(num(s.valeur) > 0)) return fail('Plafond de SO₂ total invalide (mg/L).'); r.exceptions[cle] = { valeur: num(s.valeur), note: String(s.note || '').slice(0, 200), par: uid || '', le: todayISO() }; return okr(); }
  if (!REG_STATUTS[s.statut]) return fail('Choisissez le statut (autorisé, interdit, sous condition).');
  const dm = hasNum(s.doseMax) ? num(s.doseMax) : null; const tm = hasNum(s.teneurMax) ? num(s.teneurMax) : null; if ((dm != null && dm < 0) || (tm != null && tm < 0)) return fail('Valeur invalide.');
  r.exceptions[cle] = { statut: s.statut, doseMax: s.statut === 'non' ? null : dm, teneurMax: s.statut === 'non' ? null : tm, condition: String(s.condition || '').slice(0, 240), par: uid || '', le: todayISO() }; return okr();
}
function refActiver(db, actif) { db.settings = db.settings || {}; const r = (db.settings.referentiel = db.settings.referentiel && typeof db.settings.referentiel === 'object' ? db.settings.referentiel : {}); r.actif = !!actif; return okr(); }
// composés d'un produit choisis à la main (fiche du produit)
function produitComposesSet(db, pid, L) {
  const p = (db.produits || []).find((x) => x.id === pid); if (!p) return fail('Produit introuvable.');
  if (L == null) { delete p.composes; return okr(); }
  p.composes = uniq((L || []).map((x) => x && x.id).filter((id) => refCompose(id))).map((id) => { const x = L.find((y) => y.id === id); const part = hasNum(x.part) ? num(x.part) : null; return part != null && part > 0 && part <= 1 ? { id, part } : { id }; });
  return okr();
}
// matrice du référentiel pour l'affichage : chaque composé × référentiel (règle propre, sinon héritée)
/* ---------- 0.43.0-alpha.1 : composés des produits des catalogues (liaison automatique, ajustable) ----------
   settings.referentiel.composesCatalogue = { [id d'entrée de catalogue]: [{ id, part }] } ; repris par le produit créé depuis le catalogue */
const refComposesCatalogueReglage = (db) => { const r = (db && db.settings && db.settings.referentiel) || {}; return r.composesCatalogue && typeof r.composesCatalogue === 'object' ? r.composesCatalogue : {}; };
function refComposesCatalogue(db, e) {
  if (!e) return []; const o = refComposesCatalogueReglage(db)[e.id];
  return refComposesDe({ nom: e.nom || '', famille: e.famille || '', composition: e.composition || '', categorie: typeof famCategorie === 'function' ? famCategorie(e.famille) : 'oeno', ...(Array.isArray(o) ? { composes: o } : {}) });
}
function refComposesCatalogueSet(db, entreeId, L, uid) {
  if (!catalogueEntree(db, entreeId)) return fail('Produit du catalogue introuvable.');
  db.settings = db.settings || {}; const r = (db.settings.referentiel = db.settings.referentiel && typeof db.settings.referentiel === 'object' ? db.settings.referentiel : {});
  const m = { ...(r.composesCatalogue || {}) };
  if (L == null) delete m[entreeId]; else m[entreeId] = uniq((L || []).map((x) => x && x.id).filter((id) => refCompose(id))).map((id) => { const x = L.find((y) => y.id === id); return hasNum(x.part) && num(x.part) > 0 && num(x.part) <= 1 ? { id, part: num(x.part) } : { id }; });
  r.composesCatalogue = m; r.composesCataloguePar = uid || ''; return okr();
}
// produits des catalogues portant un composé (lien automatique ou choisi) : { e, choisi }
function refCatalogueParCompose(db, composeId) {
  const o = refComposesCatalogueReglage(db);
  return catalogueEntrees(db, {}).map((e) => ({ e, c: refComposesCatalogue(db, e) })).filter((x) => x.c.some((c) => c.id === composeId)).map((x) => ({ e: x.e, choisi: Array.isArray(o[x.e.id]) }));
}
// SO₂ total maximal par revendication et type de vin : plafond de l'exploitation, plafond le plus bas des référentiels appliqués, plafond retenu
function labelsSo2Synthese(db) {
  const P = plafondsDe(db).filter((p) => p.objet === 'so2t'); const out = [];
  qualifList(db).forEach((q) => VINS_TYPES.filter((v) => v.id !== 'tous').forEach((v) => {
    const ex = P.filter((p) => p.qualifId === q.id && (p.vin === v.id || p.vin === 'tous')).sort((a, b) => a.valeur - b.valeur)[0] || null;
    const refs = refActif(db) ? refLabelsPour(db, q.id).map((l) => refSo2(db, l.id, v.id)).filter(Boolean).sort((a, b) => a.valeur - b.valeur) : [];
    const ref = refs[0] || null; const retenu = ex && !ex.aVerifier ? { valeur: ex.valeur, par: 'exploitation' } : [ex ? { valeur: ex.valeur, par: 'exploitation' } : null, ref ? { valeur: ref.valeur, par: ref.label } : null].filter(Boolean).sort((a, b) => a.valeur - b.valeur)[0] || null;
    if (ex || ref) out.push({ qualifId: q.id, vin: v.id, exploitation: ex, referentiel: ref, retenu, ecart: !!(ex && ref && ex.valeur > ref.valeur) });
  }));
  return out;
}
function refMatrice(db) {
  return REG_COMPOSES.map((k) => ({ compose: k, cellules: REG_LABELS.map((l) => { const propre = refRegle(db, l.id, k.id); const eff = refCombiner(db, refChaine([l.id]), k.id); return { label: l.id, propre, eff, herite: !propre && !!eff }; }) }));
}
