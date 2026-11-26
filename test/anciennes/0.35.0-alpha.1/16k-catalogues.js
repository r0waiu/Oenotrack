/* ============ CATALOGUES DE PRODUITS ŒNOLOGIQUES (0.30.0-alpha.1) ============
   Base préinstallée : données factuelles relevées dans les catalogues des fournisseurs (nom, famille, unité, dose conseillée,
   conditionnements, mentions bio UE / NOP et vegan, dose maximale ou teneur en SO₂ quand le catalogue les indique), chacune avec sa
   source (catalogue, année, page). Aucune description, aucune image, aucun catalogue joint : les valeurs sont à vérifier sur la fiche
   technique du produit. Sofralab = Oenofrance, Station Œnotechnique de Champagne (SOEC) et Martin Vialatte.
   Catalogues importés par l'utilisateur (tableur, PDF lu par le script ou par l'assistant IA) : db.catalogues, lignes « à vérifier »
   jusqu'à leur validation. Masquage de fournisseurs ou de marques : db.catalogueReglage.masques (réglage commun, droit Intrants). */
const CATALOGUES = [
  { id: 'laffort', fournisseur: 'Laffort', marque: 'Laffort', titre: 'Catalogue LAFFORT® 2026', annee: '2026' },
  { id: 'ioc', fournisseur: 'IOC', marque: 'IOC', titre: 'Catalogue IOC « Produits œnologiques »', annee: '2026' },
  { id: 'oenofrance', fournisseur: 'Sofralab', marque: 'Oenofrance', titre: 'Catalogue Oenofrance 2025-2026', annee: '2025-2026' },
  { id: 'soec', fournisseur: 'Sofralab', marque: 'SOEC', titre: 'Catalogue SOEC 2024/2025', annee: '2024-2025' },
  { id: 'martinvialatte', fournisseur: 'Sofralab', marque: 'Martin Vialatte', titre: 'Catalogue Martin Vialatte 2026', annee: '2026' },
];
// familles des produits (catégorie de l'application : œnologique ou auxiliaire)
const CATALOGUE_FAMILLES = [
  ['levure', 'Levures', 'oeno'], ['nutriment', 'Nutriments', 'oeno'], ['nutriment bactéries', 'Nutriments des bactéries', 'oeno'], ['produit de levure', 'Dérivés de levure', 'oeno'],
  ['enzyme', 'Enzymes', 'oeno'], ['bactérie', 'Bactéries', 'oeno'], ['colle', 'Colles', 'aux'], ['bentonite', 'Bentonites', 'aux'], ['pvpp', 'PVPP', 'aux'], ['charbon', 'Charbons', 'aux'],
  ['tanin', 'Tanins', 'oeno'], ['bois', 'Bois (copeaux, douelles)', 'oeno'], ['gomme arabique', 'Gommes arabiques', 'oeno'], ['stabilisant tartrique', 'Stabilisants tartriques', 'oeno'],
  ['stabilisant microbiologique', 'Stabilisants microbiologiques', 'oeno'], ['traitement métaux / oxydation', 'Métaux et oxydation', 'oeno'], ['traitement spécifique', 'Traitements spécifiques', 'oeno'],
  ['antioxydant', 'Antioxydants', 'oeno'], ['acidifiant', 'Acidifiants', 'oeno'], ['désacidifiant', 'Désacidifiants', 'oeno'], ['sulfitage', 'Sulfitage (SO₂)', 'oeno'], ['conservateur', 'Conservateurs', 'oeno'],
  ['sucre / MCR', 'Sucre, MCR', 'oeno'], ['adjuvant de remuage', 'Adjuvants de remuage', 'aux'], ['filtration', 'Filtration', 'aux'], ['méchage', 'Méchage', 'oeno'],
];
// catalogue|NOM|famille|unité|dose conseillée|conditionnements|page(s)|ue,nop,vegan|dose maximale indiquée|teneur en SO₂
const CATALOGUE_TXT = `laffort|ZYMAFLORE ÉGIDE|levure|g|3-5 g/hL||4
laffort|ZYMAFLORE KHIO|levure|g|3-5 g/hL||4
laffort|ZYMAFLORE OMEGA|levure|g|20 g/hL||4
laffort|ZYMAFLORE ALPHA|levure|g|30-40 g/hL||4
laffort|ZYMAFLORE KLIMA|levure|g|20-30 g/hL|500 g, 10 kg|5-6, 32
laffort|ZYMAFLORE 011 BIO|levure|g|20-30 g/hL|500 g|6, 32|ue
laffort|ZYMAFLORE BO213|levure|g|||6
laffort|ZYMAFLORE XAROM|levure|g|||6
laffort|ZYMAFLORE CEREVISIAE|levure|g|||6
laffort|ZYMAFLORE EDEN|levure|g|||6
laffort|ZYMAFLORE F15|levure|g|||6
laffort|ZYMAFLORE F33|levure|g|||6
laffort|ZYMAFLORE F83|levure|g|||6
laffort|ZYMAFLORE FX10|levure|g|||6
laffort|ZYMAFLORE RB2|levure|g|||6
laffort|ZYMAFLORE RB4|levure|g|||6
laffort|ZYMAFLORE RX60|levure|g|||6
laffort|ZYMAFLORE XPURE|levure|g|||6
laffort|ZYMAFLORE CGN24|levure|g|20-30 g/hL|500 g|7, 32
laffort|ZYMAFLORE CX9|levure|g|20-30 g/hL|500 g, 10 kg|7, 32
laffort|ZYMAFLORE DELTA|levure|g|||7
laffort|ZYMAFLORE F5|levure|g|||7
laffort|ZYMAFLORE RMS2|levure|g|||7
laffort|ZYMAFLORE ROSÉ|levure|g|||7
laffort|ZYMAFLORE SPARK|levure|g|20-30 g/hL|500 g|7, 31
laffort|ZYMAFLORE ST|levure|g|||7
laffort|ZYMAFLORE VL1|levure|g|20-30 g/hL|500 g, 10 kg|7, 32
laffort|ZYMAFLORE VL2|levure|g|||7
laffort|ZYMAFLORE VL3|levure|g|||7
laffort|ZYMAFLORE X16|levure|g|20-30 g/hL|500 g, 10 kg|7, 32
laffort|ZYMAFLORE X5|levure|g|20-30 g/hL|500 g, 10 kg|7, 32
laffort|ZYMAFLORE XORIGIN|levure|g|||7
laffort|LACTOENOS BERRY DIRECT|bactérie|u||dose 2,5 hL, 25 hL, 250 hL|9
laffort|LACTOENOS B7 DIRECT|bactérie|u||dose 2,5 hL, 25 hL, 250 hL|9
laffort|LACTOENOS B16 STANDARD|bactérie|u||dose 50 hL, 250 hL|9
laffort|LACTOENOS 450 PREAC|bactérie|u||dose 50 hL, 250 hL|9
laffort|MALOBOOST|nutriment bactéries|g|20-40 g/hL|1 kg|9
laffort|SUPERSTART|nutriment|g|20-30 g/hL|10 kg|11
laffort|SUPERSTART BLANC & ROSÉ|nutriment|g|20-30 g/hL|1 kg, 5 kg|11
laffort|SUPERSTART ROUGE|nutriment|g|20-30 g/hL|1 kg, 5 kg|11
laffort|SUPERSTART SPARK|nutriment|g|20-30 g/hL|1 kg|11
laffort|NUTRISTART THIOLS|nutriment|g|20-60 g/hL|1 kg, 10 kg|11
laffort|NUTRISTART AROM|nutriment|g|20-60 g/hL|1 kg, 5 kg|11
laffort|NUTRISTART ORG|nutriment|g|20-60 g/hL|1 kg, 5 kg, 20 kg|11
laffort|NUTRIFLOW|nutriment|L|10-30 cL/hL|20 L, 300 L, 1000 L|11
laffort|NUTRISTART|nutriment|g|20-60 g/hL|1 kg, 5 kg, 20 kg|11
laffort|THIAZOTE|nutriment|g|10-50 g/hL|1 kg, 5 kg, 25 kg|11
laffort|THIAZOTE PH|nutriment|g|10-50 g/hL|1 kg, 5 kg, 25 kg|11
laffort|BI-ACTIV|produit de levure|g|30-60 g/hL|1 kg|12
laffort|OENOCELL|produit de levure|g|20-40 g/hL|1 kg|12
laffort|OENOCELL BIO|produit de levure|g|20-40 g/hL|1 kg|12|ue
laffort|TURBICEL|traitement spécifique|g|20-50 g/hL|5 kg|12
laffort|FRESHAROM|produit de levure|g|20-30 g/hL|1 kg, 5 kg|14
laffort|POWERLEES LIFE|produit de levure|g|10-40 g/hL|1 kg, 5 kg|14
laffort|MANNOFEEL|produit de levure|L|2,5-15 cL/hL|1 L, 10 L|14
laffort|MANNOSPARK|produit de levure|L|2-20 cL/hL|1 L, 10 L|14
laffort|MANNOSTAB LIQUIDE 200|stabilisant tartrique|L|5-15 cL/hL|1 L, 10 L|14
laffort|MANNOSWEET|produit de levure|g|5-36 g/hL|1 kg|14
laffort|OENOFEEL|produit de levure|g|10-30 g/hL|1 kg, 10 kg|14
laffort|OENOLEES|produit de levure|g|20-40 g/hL|1 kg, 5 kg|14
laffort|OENOLEES MP|produit de levure|g|10-30 g/hL|1 kg|14
laffort|POWERLEES|produit de levure|g|15-40 g/hL|1 kg|14
laffort|VOLUMAX|produit de levure|L|10-30 cL/hL|5 L, 20 L|14
laffort|LAFASE XL PRESS|enzyme|mL|1-4 mL/100 kg|1 L, 10 L|16
laffort|LAFASE XL CLARIF|enzyme|mL|1-5 mL/hL|1 L, 10 L|16
laffort|LAFAZYM 600 XLICE|enzyme|mL|0,5-2 mL/hL|250 mL, 10 L|16
laffort|LAFASE XL FLOT|enzyme|mL|1-4 mL/hL|10 L|16
laffort|LAFASE XL REDY|enzyme|mL|2-4 mL/100 kg|1 L, 10 L|16
laffort|EXTRACLEAR|enzyme|mL|3-6 mL/hL|1 L|16
laffort|LAFAZYM EXTRACT|enzyme|g|2-3 g/100 kg|250 g|16
laffort|LAFAZYM PRESS|enzyme|g|2-5 g/100 kg|100 g, 500 g|16
laffort|LAFAZYM CL|enzyme|g|0,5-2 g/hL|100 g, 500 g|16
laffort|LAFASE HE GRAND CRU|enzyme|g|3-5 g/100 kg|100 g, 500 g|16
laffort|LAFASE FRUIT|enzyme|g|3-5 g/100 kg|250 g|16
laffort|LAFAZYM THIOLS[+]|enzyme|g|3-6 g/hL|250 g|16
laffort|LAFAZYM AROM|enzyme|g|2-4 g/hL|100 g|16
laffort|EXTRALYSE|enzyme|g|6-10 g/hL|250 g|16
laffort|OPTIZYM|enzyme|g|2-5 g/hL|2,5 kg|16
laffort|LYSOZYM|stabilisant microbiologique|g|10-50 g/hL|1 kg|16
laffort|OENOFINE REDY|colle|g|5-30 g/hL|1 kg, 5 kg|17-18|vegan
laffort|OENOFINE NATURE|colle|g|10-50 g/hL|1 kg, 5 kg|18|ue,vegan
laffort|OENOFINE PINK|colle|g|10-70 g/hL|1 kg, 10 kg|18|ue,vegan
laffort|POLYMUST ROSÉ|colle|g|30-80 g/hL|1 kg, 10 kg|18
laffort|POLYMUST BLANC|colle|g|30-80 g/hL|1 kg, 10 kg|18
laffort|POLYMUST NATURE|colle|g|10-100 g/hL|1 kg, 10 kg|18
laffort|POLYMUST PRESS|colle|g|15-100 g/hL|1 kg, 10 kg|18
laffort|VEGECOLL|colle|g|1-30 g/hL|500 g, 5 kg|18|vegan
laffort|VEGEFINE|colle|g|2-50 g/hL|1 kg, 10 kg|18|vegan
laffort|VEGEFLOT|colle|g|5-40 g/hL|1 kg, 10 kg|18|vegan
laffort|VEGEFLOT LIQUIDE|colle|L|5-40 cL/hL|20 L|18|vegan
laffort|GECOLL SUPRA|colle|L|4-10 cL/hL|1 L, 5 L, 20 L|19
laffort|GECOLL FLOTTATION|colle|L|4-10 cL/hL|10 L|19
laffort|GELAROM|colle|L|3-6 cL/hL|1 L, 5 L, 20 L|19
laffort|GELAFFORT|colle|L|1-3 cL/hL|20 L|19
laffort|GECOLL|colle|g|8-10 g/hL|1 kg, 20 kg|19
laffort|GÉLATINE EXTRA N°1|colle|g|6-10 g/hL|1 kg|19
laffort|VINICLAR|pvpp|g|15-80 g/hL|25 kg|19
laffort|VINICLAR P|pvpp|g|20-50 g/hL|1 kg, 22,7 kg|19
laffort|ALBUCOLL|colle|L|3-8 cL/hL|1 L|19
laffort|OVOCLARYL|colle|g|6-10 g/hL|1 kg|19
laffort|ICHTYOCOLLE|colle|g|0,5-1,5 g/hL|250 g|19
laffort|CASEI PLUS|colle|g|5-60 g/hL|1 kg, 20 kg|19
laffort|POLYLACT|colle|g|20-100 g/hL|1 kg, 10 kg|19
laffort|SILIGEL|colle|L|2-10 cL/hL|1 L, 5 L, 20 L|19
laffort|OAK PROTECT BY EXCELL|tanin|g|10 g/barrique|250 g, 1 kg|21
laffort|TANIN VR SUPRA|tanin|g|10-80 g/hL|1 kg, 5 kg|21
laffort|TANIN VR COLOR|tanin|g|10-80 g/hL|1 kg, 5 kg|21
laffort|TANIN VR GRAPE|tanin|g|10-80 g/hL|500 g|21
laffort|TANIN GALALCOOL|tanin|g|5-20 g/hL|1 kg|21
laffort|TANIN OENOLOGIQUE|tanin|g|5-20 g/hL|5 kg|21
laffort|TANIN VR SUPRA ÉLÉGANCE|tanin|g|10-80 g/hL|1 kg, 5 kg|21
laffort|TANIN VR SKIN|tanin|g|10-80 g/hL|500 g|21
laffort|TAN'COR|tanin|g|10-80 g/hL|1 kg, 5 kg|21
laffort|TAN'COR GRAND CRU|tanin|g|10-80 g/hL|1 kg|21
laffort|TANIN GALALCOOL SP|tanin|g|2-5 g/hL|1 kg|21
laffort|TANFRESH|tanin|g|0,5-6 g/hL|250 g|21
laffort|QUERTANIN|tanin|g|2-30 g/hL|500 g|22
laffort|QUERTANIN INTENSE|tanin|g|2-30 g/hL|500 g|22
laffort|QUERTANIN SWEET|tanin|g|2-30 g/hL|500 g|22
laffort|QUERTANIN PLUS|tanin|g|2-30 g/hL|500 g|22
laffort|QUERTANIN Q2|tanin|g|2-30 g/hL|250 g|22
laffort|FLORACONTROL|stabilisant microbiologique|g|20-30 g/hL|1 kg|23
laffort|OENOBRETT|stabilisant microbiologique|g|10 g/hL|23 g (dose barrique), 250 g, 2,5 kg|23
laffort|OENOBRETT ORG|stabilisant microbiologique|g|4-10 g/hL|100 g|23
laffort|FUMARICTRL|stabilisant microbiologique|g|30-60 g/hL|2,5 kg, 25 kg|23
laffort|OENOGOM BIO|gomme arabique|g|20-30 g/hL|2,5 kg|24|ue
laffort|OENOGOM INSTANT|gomme arabique|g|20-30 g/hL|2,5 kg, 25 kg|24
laffort|STABIFIX|gomme arabique|L|7-10 cL/hL|20 L|24
laffort|STABIVIN|gomme arabique|L|7-10 cL/hL|1 L, 5 L, 20 L|24
laffort|STABIMAX|gomme arabique|L|7-10 cL/hL|5 L, 20 L|24
laffort|STABIVIN SP|gomme arabique|L|10-15 cL/hL|1 L, 5 L, 20 L|24
laffort|CA2+STAB|stabilisant tartrique|g||2,5 kg|24
laffort|CELSTAB|stabilisant tartrique|L|5-20 cL/hL|1 L, 5 L, 20 L|24
laffort|POLYTARTRYL|stabilisant tartrique|g|10 g/hL|1 kg, 5 kg|24
laffort|MICROCOL ALPHA|bentonite|g|10-80 g/hL|1 kg, 5 kg, 25 kg|24
laffort|MICROCOL FT|bentonite|g|30-80 g/hL|15 kg|24
laffort|MICROCOL CLG|bentonite|g|20-100 g/hL|15 kg|24
laffort|CHARBON ACTIF LIQUIDE HP|charbon|L|10-60 cL/hL|10 L|25
laffort|CHARBON ACTIF PLUS GR|charbon|g|20-100 g/hL|5 kg|25
laffort|CHARBON ACTIF SUPRA 4|charbon|g|20-100 g/hL|15 kg|25
laffort|FENOSORB|charbon|g|10-70 g/hL|2,5 kg|25
laffort|GEOSORB GR|charbon|g|15-45 g/hL|5 kg, 15 kg|25
laffort|SUPRAROM|antioxydant|g|10-25 g/100 kg|1 kg|25
laffort|SULFIREDOX|traitement spécifique|L|0,2-1 cL/hL|1 L, 5 L|25
laffort|BISULFITE 15|sulfitage|L||1 L, 5 L, 20 L|26|||150 g/L
laffort|BISULFITE 18|sulfitage|L||5 L, 20 L|26|||180 g/L
laffort|BISULFITE NH4 150|sulfitage|L||20 L|26|||150 g/L
laffort|BISULFITE NH4 200|sulfitage|L||10 L|26|||200 g/L
laffort|BISULFITE NH4 400|sulfitage|L||20 L|26|||400 g/L
laffort|SOLUTION 6|sulfitage|L||10 L, 20 L|26|||60 g/L
laffort|SOLUTION 10|sulfitage|L||1 L, 5 L, 20 L|26|||100 g/L
laffort|MÉTABISULFITE DE POTASSIUM|sulfitage|g||1 kg, 25 kg|26|||0,5 g/g
laffort|OENOSTERYL 2|sulfitage|u||boîte de 48 comprimés|26|||2 g/u
laffort|OENOSTERYL 5|sulfitage|u||boîte de 42 comprimés|26|||5 g/u
laffort|SOUFRE PASTILLES|méchage|u|2-4 g/hL (foudres et barriques vides)|boîte de 1 kg (2,5 g, 5 g, 10 g)|26
laffort|DIATOMYL R|filtration|kg||10 kg|27
laffort|DIATOMYL B|filtration|kg||10 kg|27
laffort|DIATOMYL P00|filtration|kg|||27
laffort|DIATOMYL P0|filtration|kg|||27
laffort|DIATOMYL P2|filtration|kg|||27
laffort|DIATOMYL P5|filtration|kg|||27
laffort|PERL 10|filtration|kg|||28
laffort|PERL 8|filtration|kg|||28
laffort|PERL 6|filtration|kg|||28
laffort|CLEANSPARK LIQUID|adjuvant de remuage|L|8-10 cL/hL|1 L, 5 L, 10 L|31
laffort|CLEANSPARK NATURE|adjuvant de remuage|L|8-10 cL/hL|10 L|31
laffort|NOBISPARK FRESH|bois|u|1 bidule/bouteille|sac de 500 bidules|31
laffort|NOBISPARK SENSATION|bois|u|1 bidule/bouteille|sac de 500 bidules|31
laffort|TANSPARK|tanin|L|2-6 cL/hL|1 L, 5 L|31
laffort|NOBILE FRESH GRANULAR 24M (COPEAUX)|bois|kg|||37
laffort|NOBILE AMERICAN FRESH GRANULAR (COPEAUX)|bois|kg|||37
laffort|NOBILE SOFT (COPEAUX)|bois|kg|||37
laffort|NOBILE BASE (COPEAUX)|bois|kg|||37
laffort|NOBILE FRESH THERMO TRAITÉ (COPEAUX)|bois|kg|||37
laffort|NOBILE DARK ALMOND (COPEAUX)|bois|kg|||37
laffort|NOBILE SWEET VANILLA (COPEAUX)|bois|kg|||37
laffort|NOBILE CHERRY SPICE (COPEAUX)|bois|kg|||37
laffort|NOBILE SWEET (COPEAUX)|bois|kg|||37
laffort|NOBILE INTENSE (COPEAUX)|bois|kg|||37
laffort|NOBILE AMERICAN BLEND (COPEAUX)|bois|kg|||37
laffort|NOBILE BOURBON CASK (COPEAUX)|bois|kg|||37
laffort|NOBILE FRUIT SHINE (COPEAUX)|bois|kg|||37
laffort|NOBILE OLD RESERVE (COPEAUX)|bois|kg|||37
laffort|NOBILE FRESH (STAVES)|bois|u|||38
laffort|NOBILE SENSATION (STAVES)|bois|u|||38
laffort|NOBILE INTENSE (STAVES)|bois|u|||38
laffort|NOBILE RÉVÉLATION (STAVES)|bois|u|||38
laffort|NOBILE AMERICAN RÉVÉLATION (STAVES)|bois|u|||38
laffort|NOBILE 18-XBASE (STAVES)|bois|u|||38
laffort|NOBILE 18-DULCE (STAVES)|bois|u|||38
laffort|NOBILE 18-XTREME (STAVES)|bois|u|||38
laffort|NOBILE 18-DIVINE (STAVES)|bois|u|||38
laffort|NOBILE 18-ELITE (STAVES)|bois|u|||38
ioc|IOC FLAMINGO|levure|g|20 g/hL|500 g|1, 13|ue
ioc|AFFINITY FRESH|levure|g|1 kit/250 hL|kit levure (5 kg) + nutriment (10 kg) pour 250 hL|1
ioc|IOC SUNNY|levure|g|20 g/hL|500 g|1, 13|ue
ioc|HEDONYS|produit de levure|g|5-30 g/hL|1 kg|1
ioc|ACTIVIT READY CH|nutriment|mL|40-50 mL/hL|10 kg|2
ioc|HYDRA PC+|nutriment|kg|1 kg/kg de levure|1 kg|2, 19|ue
ioc|EASY'UP|colle|L|5-15 cL/hL|22 kg|2
ioc|IOC GAÏA|levure|g|5-20 g/hL|500 g|5|ue
ioc|IOC CALYPSO|levure|g|5-20 g/hL|500 g|5|ue
ioc|LEVEL² INITIA|levure|g|5-20 g/hL|500 g|5|ue
ioc|LEVEL² SALVA|levure|g|5 g/hL|500 g|5|ue
ioc|LEVEL² LAKTIA|levure|g|25 g/hL|500 g|6|ue
ioc|AFFINITY 5|levure|g|20 g/hL|kit pour 250 hL|6
ioc|IOC BIO|levure|g|20 g/hL|500 g|6|ue
ioc|IOC DIRECT UNIVERSE|levure|g|20 g/hL|10 kg|6|ue
ioc|IOC DI-VINA|levure|g|20 g/hL|500 g|7|ue
ioc|IOC DYNAMIX|levure|g|20 g/hL|500 g|7|ue
ioc|IONYS|levure|g|20 g/hL|500 g|7|ue
ioc|LEVEL² BIODIVA|levure|g|20 g/hL|500 g|7|ue
ioc|VELLUTO EVOLUTION|levure|g|20 g/hL|500 g|7|ue
ioc|IOC BE FRESH|levure|g|20 g/hL|500 g|8|ue
ioc|IOC PRIMROUGE R 9001|levure|g|20 g/hL|500 g, 10 kg|8|ue
ioc|IOC R 9002|levure|g|20 g/hL|500 g, 10 kg|8|ue
ioc|IOC R 9008|levure|g|20 g/hL|500 g, 10 kg|9|ue
ioc|IOC RÉVÉLATION TERROIR|levure|g|20 g/hL|500 g, 10 kg|9|ue
ioc|IOC RP15|levure|g|20 g/hL|500 g|9|ue
ioc|IOC SMOOZBERRY|levure|g|20 g/hL|500 g|9|ue
ioc|IOC BE THIOLS|levure|g|20 g/hL|500 g, 10 kg|10|ue
ioc|IOC EXENCE|levure|g|20 g/hL|500 g|11
ioc|IOC RÉVÉLATION THIOLS|levure|g|20 g/hL|500 g, 10 kg|11
ioc|SAUVY|levure|g|20 g/hL|500 g|11|ue
ioc|IOC BE FRUIT|levure|g|20 g/hL|500 g, 10 kg|12|ue
ioc|IOC B 2000|levure|g|20 g/hL|500 g, 10 kg|12|ue
ioc|IOC B 3000|levure|g|20 g/hL|500 g|12|ue
ioc|IOC FRESH ROSÉ|levure|g|20 g/hL|500 g, 10 kg|13|ue
ioc|IOC INFINI'TWICE|levure|g|20 g/hL|500 g|13|ue
ioc|IOC TWICE|levure|g|20 g/hL|500 g|13|ue
ioc|IOC 18-2007|levure|g|20 g/hL|500 g, 10 kg|14|ue
ioc|IOC FIZZ|levure|g|10-20 g/hL|500 g|14|ue
ioc|IOC FIZZ+|levure|g|10-20 g/hL|500 g|14|ue
ioc|IOC 11-1002|levure|g|10-20 g/hL|500 g|16|ue
ioc|IOC 11-1002 K|levure|g|10-20 g/hL|500 g, 10 kg|16|ue
ioc|IOC BY|levure|g|20 g/hL|500 g, 10 kg|16|ue
ioc|IOC HARMONIE|levure|g|20 g/hL|500 g|16|ue
ioc|ACTIPROTECT EXPRESS|nutriment|g|20-30 g/hL|1 kg, 15 kg|19|ue
ioc|ACTIPROTECT+|nutriment|g|20-30 g/hL|1 kg|19|ue
ioc|ACTIPROTECT ROSÉ|nutriment|g|30 g/hL|1 kg|19|ue
ioc|ACTICLEAN|produit de levure|g|20-60 g/hL|1 kg, 5 kg, 10 kg|19
ioc|BIO YEAST CELL WALLS|produit de levure|g|20-40 g/hL|1 kg, 5 kg, 15 kg|20
ioc|CELLCLEAN|produit de levure|g|10-40 g/hL|500 g, 5 kg, 15 kg|20
ioc|RESKUE|produit de levure|g|20-40 g/hL|1 kg|20|ue
ioc|NATJJA FIZZ|nutriment|g|20 g/hL|1 kg, 10 kg|20
ioc|STIMULA CABERNET|nutriment|g|40 g/hL|1 kg, 10 kg|20|ue
ioc|STIMULA CHENIN BLANC|nutriment|g|40 g/hL|1 kg|21
ioc|STIMULA CHARDONNAY|nutriment|g|40 g/hL|1 kg, 10 kg|21
ioc|STIMULA PINOT NOIR|nutriment|g|40 g/hL|1 kg|21|ue
ioc|STIMULA SAUVIGNON BLANC|nutriment|g|40 g/hL|1 kg, 10 kg|21|ue
ioc|STIMULA SYRAH|nutriment|g|40 g/hL|1 kg, 10 kg|21|ue
ioc|ACTIVIT NAT|nutriment|g|10-40 g/hL|1 kg, 5 kg|22|ue
ioc|ACTIVIT O|nutriment|g|10-40 g/hL|1 kg, 5 kg, 15 kg|22
ioc|ACTIVIT SAFE|nutriment|g|20-40 g/hL|1 kg, 5 kg, 15 kg|22
ioc|EXTRA PM|nutriment|g|20-40 g/hL|1kg, 10 kg|22
ioc|ACTIVIT|nutriment|g|20-40 g/hL|1 kg, 5 kg, 15 kg|22
ioc|VITISTART|nutriment|g|10-40 g/hL|1 kg, 5 kg, 15 kg|23
ioc|FOSFOVIT|nutriment|g|5-40 g/hL|1 kg, 15 kg|23
ioc|PHOSPHATES COMPLETS|nutriment|g|10-80 g/hL|1 kg, 5 kg|23
ioc|PHOSPHATE DIAMMONIQUE|nutriment|g|10-80 g/hL|1 kg, 5 kg, 25 kg|23
ioc|PHOSPHATES TITRÉS|nutriment|g|5g/hL|1 kg, 5 kg|23
ioc|THIAMINE|nutriment|g|0,05 g/hL|1 kg|23
ioc|MYZYM CLARIF|enzyme|g|1-3 g/hL|50 g, 250 g, 1 kg, 10 kg|26
ioc|MYZYM ULTRA CLARIF|enzyme|g|1-2 g/hL|50 g, 250 g, 1 kg, 10 kg|26
ioc|MYZYM CLEAR|enzyme|g|1-3 g/hL|100 g|26, 29
ioc|MYZYM READY CLARIFICATION|enzyme|mL|1-2 mL/hL|500 mL, 1 L, 10 L|26
ioc|MYZYM READY EXTREM|enzyme|mL|1-2 mL/hL|500 mL, 1 L, 10 L, 20 kg|26
ioc|MYZYM READY'UP|enzyme|mL|2-3 mL/hL|1 L, 10 L, 20 kg|27
ioc|MYZYM READY CH|enzyme|L|0,5-2 cL/hL|500 mL, 1 L, 5 L|27
ioc|MYZYM EXTRACT|enzyme|g|3 g/hL|100 g, 250 g, 1 kg, 10 kg|27
ioc|MYZYM ULTRA EXTRACT|enzyme|g|1-2 g/hL|100 g, 250 g|27
ioc|MYZYM MPF|enzyme|g|1-3 g/hL|100 g, 1 kg|28
ioc|MYZYM RED FRUITS|enzyme|g|1-2 g/hL|100 g|28
ioc|MYZYM WHITE FRUITS|enzyme|g|1-3 g/hL|100 g, 250 g, 1 kg, 10 kg|28
ioc|MYZYM READY EXTRACTION|enzyme|mL|1-2 mL/hL|500 mL, 1L, 10 L|28
ioc|MYZYM READY PRESS|enzyme|mL|2-3 mL/hL|1 L, 20 L|28
ioc|MYZYM AROMA|enzyme|g|2-5 g/hL|100 g|29
ioc|MYZYM ELEVAGE|enzyme|g|1-3 g/hL|100 g|29
ioc|LACTOLYSE|enzyme|g|10-50 g/hL|500 g|29
ioc|BENTOSTAB GRANULÉS|bentonite|g|20-100 g/hL|1 kg, 5 kg, 15kg|34
ioc|BENTOSTAB POUDRE|bentonite|g|20-100 g/hL|1 kg, 5 kg, 25 kg|34
ioc|INOBENT|bentonite|g|20-100 g/hL|1 kg, 25 kg|34
ioc|BENTONITE L100|bentonite|L|20-100 cL/hL|10 L, 1000 L|34
ioc|INOBENT NAT|bentonite|g|20-100 g/hL|1 kg, 25 kg|34|ue
ioc|GEL'UP|colle|g||15 kg|36
ioc|Qi UP XC|colle|g|2-10 g/hL|1 kg, 15 kg|37, 42
ioc|Qi UP XC MES|colle|L|2-10 cL/hL|10 L|37, 42
ioc|UNIFYNE|colle|g|10-50 g/hL|1 kg, 15 kg|37, 40
ioc|BENT'UP|bentonite|g|10-20 g/hL|15 kg|37
ioc|PHENOX-FREE|colle|g|20-60 g/hL|1 kg, 15 kg|38
ioc|TRAP'METALS|traitement métaux / oxydation|g|20-80 g/hL|1 kg|38
ioc|COLORPROTECT V|colle|g|20-80 g/hL|1 kg, 5 kg, 15 kg|39
ioc|COLORPROTECT V MES|colle|L|20-80 cL/hL|10 L|39
ioc|FRESHPROTECT NEO|colle|g|20-100 g/hL|1 kg, 5 kg, 15 kg|39
ioc|POLYOXYL|colle|g|20-70 g/hL|1 kg, 5 kg, 20 kg|39
ioc|POLYOXYL L 100|colle|L|20-70 cL/hL|10 L, 1 000 L|39
ioc|CASEINATE DE POTASSIUM|colle|g|10-80 g/hL|1 kg, 5 kg, 20 kg|39
ioc|PVPP GRANULÉS|pvpp|g|10-70 g/hL|20 kg|39
ioc|PVPP POUDRE|pvpp|g|10-70 g/hL|1 kg, 19,96 kg|39
ioc|INOFINE V|colle|g|10-50 g/hL|1 kg, 5 kg, 15 kg|40|ue
ioc|INOFINE V MES|colle|L|10-50 cL/hL|10 L, 22 kg, 1000 kg|40
ioc|Qi FINE|colle|g|10-35 g/hL|1 kg, 15 kg|43
ioc|Qi FINE MES|colle|L|10-35 cL/hL|10 kg|43
ioc|Qi NO OX|colle|g|20-80 g/hL|1 kg, 5 kg, 15 kg|43
ioc|CLARIFIANT BK|adjuvant de remuage|g|4-8 g/hL|1 kg|46
ioc|CLARIFIANT XL|adjuvant de remuage|L|7-8 cL/hL|1 L, 5 L, 10 L|46
ioc|CLARIFIANT NAT|adjuvant de remuage|L|8-10 cL/hL|10 L|46|ue
ioc|CLARIFIANT S|adjuvant de remuage|L|8 cL/hL|1 L, 5 L, 10 L|46
ioc|PHOSPHATES MAZURE|adjuvant de remuage|L|2-3 cL/hL|1 L, 5 L, 10 L|46
ioc|INOCLAIR 2|adjuvant de remuage|g|3-4 g/hL||46
ioc|ML RED BOOST|nutriment bactéries|g|20 g/hL|1 kg|57|ue
ioc|NUTRIFLORE FML|nutriment bactéries|g|20 g/hL|1 kg|57|ue
ioc|NUTRIFLORE PDC|nutriment bactéries|g|25 g/hL|250 g|57|ue
ioc|CAUDALYS|produit de levure|g|5-30 g/hL|1 kg|60|ue
ioc|FULLPROTECT|produit de levure|g|15-30 g/hL|1 kg|60|ue
ioc|GLUTASTAR|produit de levure|g|15-30 g/hL|1 kg, 10 kg|60
ioc|GLUTAROM|produit de levure|g|25-30 g/hL|1 kg, 10 kg|60
ioc|GLUTAROM EXTRA|produit de levure|g|20-30 g/hL|1 kg|61
ioc|OPTI-MUM RED|produit de levure|g|20-40 g/hL|1 kg|61|ue
ioc|PURE-LEES LONGEVITY|produit de levure|g|20-40 g/hL|1 kg|61|ue
ioc|SPHERE BLANC|produit de levure|g|10-20 g/hL|1 kg|62|ue
ioc|SPHERE ROUGE|produit de levure|g|10-20 g/hL|1 kg|62|ue
ioc|SPHERE EXPRESS|produit de levure|g|5-20 g/hL|1 kg|62|ue
ioc|PURE-LEES DELICACY|produit de levure|g|20-40 g/hL|1 kg|62|ue
ioc|PURE-LEES ELEGANCY|produit de levure|g|20-40 g/hL|1 kg|62|ue
ioc|ULTIMA FRESH|produit de levure|g|5-25 g/hL|500 g, 1 kg|63
ioc|ULTIMA JUMP|produit de levure|g|5-20 g/hL|500 g, 1 kg|63
ioc|ULTIMA READY EXPRESSION|produit de levure|mL|20-150 mL/hL|1 L, 5 L|64
ioc|ULTIMA READY FIZZ|produit de levure|mL|50-200 mL/hL|1 L, 5 L|64
ioc|ULTIMA READY LIFE|produit de levure|mL|20-150 mL/hL|1 L, 5 L|64
ioc|ULTIMA SOFT|produit de levure|g|5-25 g/hL|500 g, 1kg|64|ue
ioc|TANIN TC|tanin|g|5-8 g/hL|1 kg, 5 kg, 25 kg|68|ue
ioc|SOLUTION TC|tanin|L|4-6 cL/hL|1L, 5L, 10L|68
ioc|TANIN SR|tanin|g|15-40 g/hL|1 kg, 5 kg, 15 kg|68|ue
ioc|ESSENTIAL ANTIOXIDANT|tanin|g|1-10 g/hL|1 kg, 5 kg|69|ue
ioc|TANIN CRISTALLIN|tanin|g|3-5 g/hL|1 kg, 12,5 kg|69|ue
ioc|FULLCOLOR|tanin|g|20-60 g/hL|1 kg, 10 kg|69|ue
ioc|MANN BOUQUET R 16|tanin|g|10-40 g/hL|1 kg|70
ioc|ESSENTIAL FRESH|tanin|g|1-10 g/hL|500 g|70|ue
ioc|ESSENTIAL PASSION|tanin|g|1-15 g/hL|500 g|70|ue
ioc|INFINITY GREEN T|tanin|g|0,5-5 g/hL|1 kg|70|ue
ioc|VOLUTAN|tanin|g|2-20 g/hL|1 kg|70|ue
ioc|ESSENTIAL OAK SWEET|tanin|g|0,5-10 g/hL|500 g|71|ue
ioc|ESSENTIAL FOR BARREL|tanin|g|0,5-10 g/hL|500 g|71|ue
ioc|NOVITAN DOLCE|tanin|g|2-10 g/hL|250 g|71|ue
ioc|NOVITAN LIVELY|tanin|g|0,5-2 g/hL|250 g|71|ue
ioc|NOVITAN BUBBLY|tanin|g|0,5-2 g/hL|250 g|71|ue
ioc|PRIVILÈGE BLEU|tanin|g|0,5-5 g/hL|250 g|72|ue
ioc|PRIVILÈGE NOIR|tanin|g|0,5-5 g/hL|250 g|72|ue
ioc|SOLUTION ST|tanin|L|2-4 cL/hL|1 L, 5 L, 10 L|72
ioc|VINOFINE ROUGE|colle|g|2-15 g/hL|1 kg, 15 kg|74
ioc|FYNEO|colle|g|2-30 g/hL|500 g, 1 kg, 10 kg|74|ue
ioc|INOCOLLE|colle|L|3-10 cL/hL|1 L, 5 L, 10 L, 22 kg, 1100 kg|74
ioc|COLFINE POUDRE|colle|g|2,5-10 g/hL|1 kg, 25 kg|74|ue
ioc|COLFINE LIQUIDE|colle|L|3-10 cL/hL|23 kg|75
ioc|CRISTALLINE LIQUIDE|colle|L|5-12 cL/hL|1 L, 10 L|75
ioc|CRISTALLINE PLUS|colle|g|1,5-3 g/hL|100 g, 1 kg|75
ioc|CRISTALLINE SUPRA|colle|g|1,5-3 g/hL|100 g, 1 kg|75
ioc|FISHANGEL|colle|g|2-4 g/hL|1 kg|75
ioc|FISHANGEL MES|colle|L|8-12,5 cL/hL|1 L, 10 L|75
ioc|TRADICOLLLE|colle|g|5-15 g/hL|1 kg|76|ue
ioc|GELOCOLLE|colle|L|2-10 cL/hL|1 L, 5 L, 10 L, 25 kg, 1200 kg|76
ioc|INOGUM 300|gomme arabique|L|4-10 cL/hL|1 L, 5 L, 22 kg, 1 100 kg|78
ioc|INOGUM MF|gomme arabique|L|4-15 cL/hL|1 L, 10 L, 25 kg|78
ioc|GOMME ARABIQUE SD|gomme arabique|L||1 L|78
ioc|FLASHGUM|gomme arabique|g|5-30 g/hL|1 kg|78
ioc|FLASHGUM R|gomme arabique|g|5-30 g/hL|1 kg|78
ioc|FLASHGUM R LIQUIDE|gomme arabique|L|4-11 cL/hL|1 L, 5 L, 22 kg|78
ioc|FLASHGUM R MF|gomme arabique|L|2-10 cL/hL|1 L, 10 L, 25 kg, 1 100 kg|79
ioc|GOMME ARABIQUE 300|gomme arabique|L|10-40 cL/hL|22 kg, 1 100 kg|79
ioc|CRÈME DE TARTRE MICRONISÉE|stabilisant tartrique|g|100-400 g/hL|1 kg, 5 kg, 25 kg|79
ioc|TARTRATE DE CALCIUM|stabilisant tartrique|g|100-200 g/hL|25 kg|80
ioc|DUOSTAB|stabilisant tartrique|g|200-400 g/hL|25 kg|80
ioc|ACIDE MÉTATARTRIQUE|stabilisant tartrique|g|10 g/hL|1 kg|81
ioc|INOSTAB G|stabilisant tartrique|g|2-20 g/hL|1 kg, 5 kg|81
ioc|INOSTAB MES|stabilisant tartrique|L|8-40 cL/hL|1 L, 5 L, 10 L, 21 kg, 1 000 L|81
ioc|ACTICARBONE ENO|charbon|g||15 kg|83|ue
ioc|CARBION ENO|charbon|g||1 kg|83
ioc|CARBOCLEAN|charbon|g||5 kg, 15 kg|83|ue
ioc|CARBION ENO-H|charbon|g||1 kg|83|ue
ioc|CARBION POUDRE|charbon|g||5 kg|83|ue
ioc|CARBION GRANULÉS|charbon|g||1 kg, 15 kg|83
ioc|FLAVOCLEAN|traitement spécifique|g||1 kg|84|ue
ioc|OTACLEAN|traitement spécifique|g|20 g/hL|1 kg|84|ue
ioc|Qi SMOKE|traitement spécifique|g|20-60 g/hL|1 kg|84
ioc|NETAROM|traitement spécifique|g|20-40 g/hL|1 kg|85|ue
ioc|EXTRA|traitement spécifique|g|5-30 g/hL|1 kg|85
ioc|SOLUTION 700|traitement spécifique|L|1-4 cL/hL|1 L, 10 L|85
ioc|REDOXYL|traitement spécifique|mL|3-8 mL/hL|5 L, 10 L|85
ioc|REDUCIT|traitement spécifique|L|2-8 cL/hL|1 L|85
ioc|ALLIANCE|stabilisant microbiologique|g|10-30 g/hL|2,5 kg|87
ioc|NO BRETT INSIDE|stabilisant microbiologique|g|4 g/hL||87
ioc|BACTILESS NATURE|stabilisant microbiologique|g|20-50 g/hL|500 g|87
ioc|ACIDE FUMARIQUE|stabilisant microbiologique|g|30-60 g/hL|1 kg|87
ioc|ACIDE TARTRIQUE L(+)|acidifiant|g||1 kg, 5 kg, 25 kg|88|ue
ioc|ACIDE MALIQUE D,L|acidifiant|g||5 kg, 25 kg|88
ioc|ACIDE LACTIQUE ŒNO|acidifiant|L||1 L, 10 L, 25 kg|88|ue
ioc|ACIDE CITRIQUE|acidifiant|g||1 kg, 5 kg, 25 kg|88|ue|1 g/L
ioc|BICARBONATE DE POTASSIUM|désacidifiant|g||1 kg, 25 kg|89
ioc|CARBONATE DE CALCIUM|désacidifiant|g||1 kg, 5 kg, 25 kg|89|ue
ioc|ACIDE ASCORBIQUE|antioxydant|g|5-10 g/hL|1 kg, 25 kg|89|ue
ioc|FEELWOOD SWEET & FRESH|bois|kg|0,5-3 g/L||91
ioc|FEELWOOD BALANCE & STRUCTURE|bois|kg|0,5-3 g/L||91
ioc|FEELWOOD FRUIT & SOFT|bois|kg|0,5-3 g/L||91
ioc|FEELWOOD FULL & COMPLEX|bois|kg|0,5-5 g/L||91
ioc|FEELWOOD RICH & SUBTLE|bois|kg|0,5-5 g/L||91
ioc|FEELWOOD CHOC & TOASTED|bois|kg|0,5-5 g/L||92
ioc|BISULFITE D'AMMONIUM 150 g/L|sulfitage|L||1 L, 5 L, 10 L|93|||150 g/L
ioc|BISULFITE DE POTASSIUM 150 g/L|sulfitage|L||1 L, 5 L, 10 L|93|||150 g/L
ioc|METABISULFITE DE POTASSIUM|sulfitage|g||1 kg, 25 kg|93
ioc|SULFIDÉGORGEMENT|sulfitage|L||1 L, 10 L|93|||180 g/L
ioc|SULFITAMINE C|sulfitage|L||250 mL, 500 mL, 1 L|94
ioc|SULFITANIN|sulfitage|L||1 L, 5 L, 10 L|94|||100 g/L
ioc|SULFIVIN A|sulfitage|L||se renseigner (50, 100, 180, 400 ou 600 g/L de SO₂)|94
ioc|SULFIVIN K|sulfitage|L||se renseigner (100, 150 ou 180 g/L de SO₂)|94
ioc|SUCRAISIN MCR BIO|sucre / MCR|L||20 L, 300L, 1 000 L|95|ue
ioc|SUCRAISIN MCR LIQUEUR EXPÉDITION|sucre / MCR|L||10 L, 20 L, 300 L, 1 000 L|95
ioc|EXTRAFLORE CO-IN'|bactérie|u||doses pour 25 hL, 250 hL|54
ioc|EXTRAFLORE COMPLEXITY|bactérie|u||doses pour 2,5 hL, 25 hL, 250 hL|54
ioc|EXTRAFLORE PURE FRUIT|bactérie|u||doses pour 25 hL, 100 hL|54
ioc|EXTRAFLORE DENSITY|bactérie|u||doses pour 25 hL, 100 hL|54
ioc|MAXIFLORE ELITE|bactérie|u||doses pour 25 hL, 100 hL, 500 hL|55
ioc|MAXIFLORE SATINE|bactérie|u||doses pour 25 hL, 100 hL|55
ioc|ACIDOPHIL+|bactérie|u||doses pour 50 hL|55
ioc|INOBACTER|bactérie|u||doses pour 25 hL, 100 hL, 500 hL, 1000 hL, 2000 hL|55
ioc|MALOTABS|bactérie|u||1 pastille par barrique|56
ioc|ML PRIME|bactérie|u||doses pour 25 hL, 100 hL, 250 hL|56
oenofrance|SELECTYS THIOL|levure|g|20 g/hL|500 g, 10 kg|9|ue,nop,vegan
oenofrance|SELECTYS LA PERLA|levure|g|20 g/hL|500 g|10|ue,nop,vegan
oenofrance|SELECTYS LA PERSANE|levure|g|20 g/hL|500 g|10|ue,nop,vegan
oenofrance|SELECTYS LA FRUITÉE|levure|g|20 g/hL|500 g|10|ue,nop,vegan
oenofrance|SELECTYS L'ÉCLATANTE|levure|g|20 g/hL|500 g, 10 kg|10|ue,nop,vegan
oenofrance|SELECTYS LA CROQUANTE|levure|g|20 g/hL|500 g|10|ue,nop,vegan
oenofrance|SELECTYS SR|levure|g|20 g/hL|500 g|11|ue,nop,vegan
oenofrance|SELECTYS LA CEREVISIAE|levure|g|20 g/hL|500 g, 10 kg|11|ue,nop,vegan
oenofrance|SELECTYS K|levure|g|20 g/hL|500 g, 10 kg|11|ue,nop,vegan
oenofrance|SELECTYS THIOL ROUGE|levure|g|20 g/hL|500 g|13|ue,nop,vegan
oenofrance|SELECTYS LA BAYANUS|levure|g|20 g/hL|500 g, 10 kg|14|ue,nop,vegan
oenofrance|SELECTYS LA DÉLICIEUSE|levure|g|20 g/hL|500 g|15|ue,nop,vegan
oenofrance|SELECTYS LA RAFFINÉE|levure|g|20 g/hL|500 g|15|ue,nop,vegan
oenofrance|SELECTYS L'AUTHENTIQUE|levure|g|20 g/hL|500 g|15|ue,nop,vegan
oenofrance|SELECTYS ITALICA CR1|levure|g|20 g/hL|500 g|15|ue,nop,vegan
oenofrance|SELECTYS LA MARQUISE|levure|g|20 g/hL|500 g, 10 kg|16|ue,nop,vegan
oenofrance|NEVEA|levure|g||500 g|18|ue,nop,vegan
oenofrance|LEVULINE ALS|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE ARPÈGE|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE BRG YSEO|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE BRIO|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE CHP|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE C19 YSEO|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE FB|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE GALA YSEO|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE LUMAÏ|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE PRIMEUR|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE RIBERA YSEO|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE SEWA|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE SYMBIOSE|levure|g||500 g|21|ue,nop
oenofrance|LEVULINE SYNERGIE|levure|g||500 g|21|ue,nop
oenofrance|HOP|levure|g|||22
oenofrance|CLIMAX PRIME|nutriment|g|20-40 g/hL|1 kg, 10 kg|27|ue,nop,vegan
oenofrance|VIVACTIV ARÔME|nutriment|g|20-40 g/hL|1 kg, 10 kg|27|ue,nop,vegan
oenofrance|VIVACTIV PREMIER|nutriment|g|20-40 g/hL|1 kg, 10 kg|27|ue,vegan
oenofrance|VIVACTIV PERFORMANCE|nutriment|g|20-40 g/hL|1 kg, 10 kg|28|ue,vegan
oenofrance|VIVACTIV|nutriment|g|10-20 g/hL|1 kg, 5 kg|28|vegan
oenofrance|VIVACTIV ACTION|nutriment|g|20-40 g/hL|1 kg|28|ue,nop,vegan
oenofrance|VIVACTIV 100|nutriment|g|20-60 g/hL|1 kg, 5 kg, 25 kg|28|vegan
oenofrance|VIVACTIV CONTRÔLE|nutriment|g|20-40 g/hL|1 kg, 10 kg|28|ue,nop,vegan
oenofrance|VIVACTIV ECORCE|nutriment|g||500 g|28|ue,nop,vegan
oenofrance|VIVACTIV MALO|nutriment bactéries|g|20-30 g/hL|1 kg, 5 kg|28|vegan
oenofrance|THIAMINE|nutriment|g|||29|ue
oenofrance|SULFATE D'AMMONIUM|nutriment|g|||29
oenofrance|PHOSPHATE DIAMMONIQUE|nutriment|g|||29|ue
oenofrance|NUTRIMENT S|nutriment|g|||29
oenofrance|NUTRIMENT P|nutriment|g|||29|ue
oenofrance|PHYLIA LF|produit de levure|g|10-30 g/hL|500 g|32|ue,nop,vegan
oenofrance|PHYLIA CYS|produit de levure|g|15-30 g/hL|1 kg|32|ue,nop,vegan
oenofrance|PHYLIA EXEL|produit de levure|g|5-30 g/hL|500 g|33|ue,nop,vegan
oenofrance|PHYLIA AR|produit de levure|g|25-35 g/hL|1 kg, 10 kg|33|ue,nop,vegan
oenofrance|PHYLIA ICÔNE|produit de levure|g|0,5-5 g/hL|250 g|33|ue,nop,vegan
oenofrance|PHYLIA EPL|colle|g|0,5-30 g/hL|500 g|33|ue,nop,vegan
oenofrance|OENOVEGAN SBS|produit de levure|g|10-30 g/hL||36|ue,nop,vegan
oenofrance|DIWINE THIOL|traitement métaux / oxydation|g|30-70 g/hL|1 kg, 5 kg|39|vegan
oenofrance|DIWINE ARÔME|traitement métaux / oxydation|g|30-70 g/hL|1 kg, 5 kg|40|vegan
oenofrance|DIWINE SR|traitement métaux / oxydation|g|20-100 g/hL|1 kg|41|vegan
oenofrance|DIWINE 2+/3+|traitement métaux / oxydation|g|5-50 g/hL|1 kg, 5 kg|42|vegan
oenofrance|OENOVEGAN EPL|colle|g|5-30 g/hL|1 kg|45|ue,nop,vegan|60 g/hL
oenofrance|OENOVEGAN PURE|colle|g|5-50 g/hL|1 kg, 10 kg|45|ue,nop,vegan
oenofrance|OENOCLAR|colle|L|5-20 cL/hL|20 L|45
oenofrance|OENOVEGAN F|colle|L|5-15 cL/hL|20 L|45|ue,vegan|60 cL/hL
oenofrance|ALTOCASE|colle|g|20-100 g/hL|15 kg|46
oenofrance|CASEINE SOLUBLE|colle|g|20-100 g/hL|1 kg, 5 kg, 25 kg|46|ue,nop
oenofrance|VINIFICATEUR N|colle|g|30-120 g/hL|5 kg, 20 kg|46|ue,vegan
oenofrance|VINIFICATEUR SR-3D|colle|g|50-70 g/hL|1 kg, 5 kg|48|vegan
oenofrance|VINIFICATEUR SR|colle|g|40-100 g/hL|1 kg, 5 kg|48|vegan
oenofrance|FORMULE 1-CF|colle|g|15-70 g/hL|1 kg, 5 kg|48|vegan
oenofrance|SPECTRA THIOL|enzyme|mL|2-4 mL/hL|100 mL, 1 L|51|ue,vegan
oenofrance|SPECTRA QUERCETIN FREE|enzyme|g|3-10 g/hL|100 g|52|ue,vegan
oenofrance|LYSIS ESSENTIA|enzyme|g|2-4 g/hL|100 g|53|nop,vegan
oenofrance|LYSIS INTENSE|enzyme|g|2-4 g/100 kg|100 g|53|nop,vegan
oenofrance|LYSIS ACTIV 60|enzyme|mL|2-5 mL/hL|1 L, 10 L|53|ue,nop,vegan
oenofrance|LYSIS ELITE|enzyme|mL|2-4 mL/hL|100 mL, 1 L|53|ue,nop,vegan
oenofrance|LYSIS ALLEGRO|enzyme|g|1-4 g/hL|100 g|53|nop,vegan
oenofrance|LYSIS ULTRA|enzyme|mL|0,3-1 mL/hL|100 mL, 1 L|53|ue,nop,vegan
oenofrance|LYSIS UC|enzyme|g|0,3-2 g/hL|50 g, 100 g, 1 kg|54|ue,nop,vegan
oenofrance|LYSIS IMPACT|enzyme|mL|2-4 mL/hL|120 mL, 1 L|54|ue,nop,vegan
oenofrance|LYSIS SPÉCIAL R|enzyme|mL|3-4 mL/hL|1 L|54|ue,nop,vegan
oenofrance|LYSIS GRENAT|enzyme|g|1-4 g/hL|100 g|54|ue,nop,vegan
oenofrance|LYSIS MPC|enzyme|g|2-4 g/hL|100 g, 1 kg|54|nop,vegan
oenofrance|LYSIS FIRST|enzyme|g|2-5 g/100 kg|100 g|54|nop,vegan
oenofrance|LYSIS COULEUR|enzyme|g|1,5-5 g/100 kg|100 g, 1 kg|54|nop,vegan
oenofrance|LYSIS ELEVAGE|enzyme|g|2-4 g/hL|100 g|55|nop,vegan
oenofrance|LYSIS FILTRAB|enzyme|mL|3-5 mL/hL|1 L, 10 L|55|nop,vegan
oenofrance|LYSIS FLASH D|enzyme|mL|2-5 mL/hL|20 L|55|vegan
oenofrance|BACTÉLIA CRESCENDO|bactérie|u||sachet 25 hL|58|ue,nop,vegan
oenofrance|BACTÉLIA ALTA|bactérie|u||sachet 25 hL, 250 hL|58|ue,nop,vegan
oenofrance|BACTÉLIA TEMPO|bactérie|u||sachet 25 hL, 250 hL|58|ue,nop,vegan
oenofrance|FML EXPERTISE C|bactérie|u||sachet 100 hL|59|ue,vegan
oenofrance|FML EXPERTISE S|bactérie|u||sachet 2,5 hL, 25 hL, 250 hL|59|ue,nop,vegan
oenofrance|FML EXPERTISE EXTRÊME|bactérie|u||kit 25 hL, 250 hL|59|ue,nop,vegan
oenofrance|FML EXPERTISE VIVA|bactérie|u||sachet 25 hL, 100 hL|59|ue,nop,vegan
oenofrance|OENOTANNIN STABRED|tanin|g|10-30 g/hL|500 g, 5 kg|61|ue,nop,vegan
oenofrance|OENOTANNIN OENOGAL|tanin|g|2-20 g/hL|1 kg|61|ue,nop,vegan
oenofrance|OENOTANNIN MIXTE MG|tanin|g|10-50 g/hL|1 kg, 12,5 kg|61|ue,nop,vegan
oenofrance|OENOTANNIN PERFECT|tanin|g|5-20 g/hL|500 g|61|ue,nop,vegan
oenofrance|OENOTANNIN VB 105|tanin|g|2-20 g/hL|500 g|62|ue,nop,vegan
oenofrance|OENOTANNIN VB TOUCH|tanin|g|2-20 g/hL|500 g|62|ue,nop,vegan
oenofrance|OENOTANNIN VELVET|tanin|g|5-20 g/hL|500 g|62|ue,nop,vegan
oenofrance|OENOTANNIN FRAÎCHEUR|tanin|g|1-5 g/hL|250 g|62|ue,nop,vegan
oenofrance|OENOTANNIN INITIAL|tanin|g|5-20 g/hL|500 g|62|ue,nop,vegan
oenofrance|OENOTANNIN CÉLESTE|tanin|g|1-20 g/hL|500 g|62|ue,nop,vegan
oenofrance|NOQUERCUS|tanin|g|0,2-0,6 g/L|500 g, 5 kg|65|ue,nop,vegan
oenofrance|NOQUERCUS BLANC|tanin|g|0,05-0,2 g/L|500 g, 5 kg|65|ue,nop,vegan
oenofrance|NOQUERCUS DOUCEUR|tanin|g|0,05-0,5 g/L|500 g, 5 kg|65|ue,nop,vegan
oenofrance|IS 15|colle|g|6-12 g/hL|1 kg|68|ue,nop
oenofrance|OENOVEGAN EXTRA|colle|g||5 kg|68|vegan|100 g/hL
oenofrance|AFFIMENTO|colle|L|5-15 cL/hL|5 L|68|ue
oenofrance|COLLE DE POISSON OF|colle|L|10-20 cL/hL|10 L, 250 g|68|ue
oenofrance|GÉLATINE N|colle|L|3-10 cL/hL|1 L, 5 L, 20 L, 120 L, 1000 L|68|ue
oenofrance|COLLE H|colle|L|2-5 cL/hL|1 L, 20 L|68|ue,nop
oenofrance|COLLOGEL|colle|L|3-10 cL/hL|10 L|69|ue
oenofrance|OENOGEL 30|colle|L|3-10 cL/hL|1 L, 20 L|69|nop,vegan
oenofrance|OENOVEGAN MICRO FA|stabilisant microbiologique|g|15-20 g/hL|1 kg, 10 kg|70|ue,vegan
oenofrance|OENOVEGAN MICRO|stabilisant microbiologique|g|2-10 g/hL|100 g, 500 g|71|ue,vegan
oenofrance|LYSOGRAM+|stabilisant microbiologique|g|10-50 g/hL|500 g|73||50 g/hL
oenofrance|PERFORMA|bentonite|g|5-50 g/hL|1 kg, 5 kg, 10 kg|73|ue,vegan
oenofrance|BENTONITE S|bentonite|g|20-80 g/hL|1 kg, 5 kg, 25 kg|73|ue,vegan
oenofrance|CRISTADOLCINE EF|bentonite|g|30-100 g/hL|1 kg, 5 kg|73|vegan
oenofrance|PERFECTA|bentonite|g||1 kg, 10 kg|74|vegan
oenofrance|KYOCELL|stabilisant tartrique|L|8-40 cL/hL|5 L, 20 L, 1000 L|77|vegan
oenofrance|KYOCELL 2.0|stabilisant tartrique|L||1 L, 20 L|77|vegan|10 cL/hL
oenofrance|BITARTRYL|stabilisant tartrique|g|10 g/hL|1 kg|77|ue,vegan
oenofrance|BITARTRATE DE POTASSIUM|stabilisant tartrique|g|400 g/hL|5 kg, 25 kg|77|ue,nop,vegan
oenofrance|KYLMÄ PURE|stabilisant tartrique|L|2,5-5 cL/hL|1 L, 5 L, 20 L, 1000 L|80|vegan
oenofrance|KYLMÄ INTENSE|stabilisant tartrique|L|10-20 cL/hL|1 L, 5 L, 20 L, 1000 L|80|vegan
oenofrance|KYLMÄ SR|stabilisant tartrique|L|10-20 cL/hL|5 L, 20 L|81|vegan
oenofrance|ARABINA|gomme arabique|L|5-10 cL/hL|20 L|83|ue,nop,vegan|10 cL/hL
oenofrance|KORDOFAN|gomme arabique|L|3-12 cL/hL|1 L, 5 L, 20 L, 120 L, 1000 L|83|ue,nop,vegan|12 cL/hL
oenofrance|GOMME VEREK BIO|gomme arabique|g|10-30 g/hL|1 kg|83|ue,nop,vegan|30 g/hL
oenofrance|GOMME SR|gomme arabique|L|10-15 cL/hL|5 L, 20 L, 1000 L|83|ue,nop,vegan|15 cL/hL
oenofrance|GOMME FRAÎCHEUR|gomme arabique|L|10-14 cL/hL|1 L, 20 L, 1000 L|84|ue,vegan|14 cL/hL
oenofrance|OENOQUERCUS ECLAT CL FR|bois|kg|0,5-10 g/L|10 kg|88
oenofrance|OENOQUERCUS ECLAT CM FR|bois|kg|0,5-10 g/L|10 kg|88
oenofrance|OENOQUERCUS ECLAT CM+ FR|bois|kg|0,5-10 g/L|10 kg|88
oenofrance|OENOQUERCUS ECLAT CF FR|bois|kg|0,5-10 g/L|10 kg|88
oenofrance|OENOQUERCUS ECLAT CI FR (ÉCLAT INTENSE)|bois|kg|0,5-4 g/L|10 kg|91
oenofrance|OENOQUERCUS ECLAT BF|bois|kg|0,5-3 g/L|10 kg|88
oenofrance|OENOQUERCUS SELECTION BC3 (BLANC)|bois|kg|1-3 g/L|10 kg|90
oenofrance|OENOQUERCUS SELECTION RG7 (ROUGE)|bois|kg|2-4 g/L|10 kg|90
oenofrance|OENOQUERCUS SELECTION SR (ROSÉ)|bois|kg|0,5-2 g/L|10 kg|90
oenofrance|OENOQUERCUS ECLAT DUO|bois|kg|1-4 g/L|10 kg|91
oenofrance|OENOQUERCUS ECLAT DOUCEUR|bois|kg|1-5 g/L|10 kg|91
oenofrance|OENOQUERCUS ECLAT FR|bois|kg|2-5 g/L|10 kg|91
oenofrance|OENOQUERCUS ECLAT Q1|bois|kg|0,5-10 g/L|10 kg|88
oenofrance|OENOQUERCUS STAVE Q1 27 MM|bois|u|0,5-5 u/hL|10 staves/sac|88
oenofrance|OENOQUERCUS STAVE CL FR 7MM|bois|u|0,5-5 u/hL|50 staves/sac|88
oenofrance|OENOQUERCUS STAVE CM FR 7MM|bois|u|0,5-5 u/hL|50 staves/sac|88
oenofrance|OENOQUERCUS STAVE CM+ FR 7MM|bois|u|0,5-5 u/hL|50 staves/sac|88
oenofrance|OENOQUERCUS DOMINO CM FR|bois|kg|2-10 g/L|10 kg|88
oenofrance|OENOQUERCUS DOMINO CM US|bois|kg|2-10 g/L|10 kg|88
oenofrance|OENOQUERCUS DOMINO CM + FR|bois|kg|2-10 g/L|10 kg|88
oenofrance|OENOQUERCUS INSERT Q1|bois|u|1 u/barrique|10 inserts/carton|88
oenofrance|CHARBON GOTA|charbon|g|20-40 g/hL|2,5 kg, 10 kg|97|ue,nop,vegan
oenofrance|POLYEX PVPP|pvpp|g|20-80 g/hL|1 kg, 5 kg, 20 kg|97|vegan
oenofrance|PVPP GRANULÉE|pvpp|g|20-80 g/hL|20 kg|97|vegan
oenofrance|DELICARBONE GRAINS|charbon|g|100 g/hL|1 kg, 5 kg|97|ue,nop,vegan|100 g/hL
oenofrance|CHARBON SUPER D|charbon|g|100 g/hL|1 kg, 5 kg|97|ue,nop,vegan|100 g/hL
oenofrance|CHARBON ULTRA D|charbon|g|100 g/hL|1 kg, 5 kg, 12,5 kg|97|ue,nop,vegan|100 g/hL
oenofrance|MERCAPTOL|traitement spécifique|L|0,3-1,5 cL/hL|1 L, 10 L|97|vegan
oenofrance|ACIDE ASCORBIQUE|antioxydant|g|5-15 g/hL|250 g, 500 g, 1 kg, 25 kg|97|ue,nop,vegan
oenofrance|REDOXINE|antioxydant|g|10-30 g/hL|1 kg|97|ue,nop,vegan
oenofrance|ACIDE CITRIQUE|acidifiant|g|1 g/L|1 kg, 5 kg, 25 kg|97|ue,nop,vegan|1 g/L
oenofrance|CITRATE DE CUIVRE 2%|traitement spécifique|g|3,5-14 g/hL|1 kg|97|ue,vegan
oenofrance|ACIDE FUMARIQUE|traitement spécifique|g|30-60 g/hL|5 kg, 25 kg|97|vegan|60 g/hL
oenofrance|ACIDE MÉTATARTRIQUE V40|stabilisant tartrique|g|10 g/hL|500 g, 1 kg, 25 kg|97|ue,vegan|10 g/hL
oenofrance|ACIDE TARTRIQUE|acidifiant|g|150-250 g/hL|1 kg, 5 kg, 25 kg|98|ue,nop,vegan|moût 150 g/hL, vin 250 g/hL
oenofrance|ACIDE MALIQUE|acidifiant|g|1,3-2,3 g/L|1 kg, 5 kg, 25 kg|98|vegan|moût 1,3 g/L, vin 2,3 g/L
oenofrance|ACIDE LACTIQUE|acidifiant|g|1,8-3 g/L|5 kg, 25 kg|98|ue,vegan|moût 1,8 g/L, vin 3 g/L
oenofrance|BICARBONATE DE POTASSIUM|désacidifiant|g||1 kg, 25 kg|98|ue,vegan
oenofrance|CARBONATE DE CALCIUM|désacidifiant|g||1 kg, 25 kg|98|ue,nop,vegan
oenofrance|DESACID|désacidifiant|g||10 kg|98|ue,vegan
oenofrance|BAKTOL POUDRE (MÉTABISULFITE DE POTASSIUM)|sulfitage|g||1 kg, 25 kg|99|ue,vegan
oenofrance|EFFERBAKTOL 2 ET 5 GRANULÉS|sulfitage|u||40 sachets/boîte, 25 sachets/boîte|99|ue,vegan
oenofrance|EFFERBAKTOL 50|sulfitage|u||125 g|99|ue,vegan||50 g/u
oenofrance|EFFERBAKTOL 100|sulfitage|u||250 g|99|ue,vegan||100 g/u
oenofrance|EFFERBAKTOL 125|sulfitage|u||300 g|99|ue,vegan||125 g/u
oenofrance|EFFERBAKTOL 400|sulfitage|u||1 kg|99|ue,vegan||400 g/u
oenofrance|BAKTOL (BISULFITE DE POTASSIUM)|sulfitage|L||1 L, 5 L, 10 L, 20 L, 1000 L|99|ue,vegan
oenofrance|SULFOSSOL (BISULFITE D'AMMONIUM)|sulfitage|L||1 L, 5 L, 10 L, 20 L, 1000 L|99|vegan
oenofrance|PASTEURIL / PASTEURIL FLASH|sulfitage|g||500 g, 267 g|99|ue,vegan
oenofrance|SOLUTION SULFUREUSE 6%|sulfitage|L||1 L, 5 L, 10 L, 20 L, 1000 L|99|ue,nop,vegan||60 g/L
oenofrance|SORBATE DE POTASSIUM|conservateur|g|20-25 g/hL|1 kg, 25 kg|99|vegan|27 g/hL
oenofrance|SULFIGAL|conservateur|L|4-8 cL/hL|10 L|99|vegan
oenofrance|VELCORIN|conservateur|L|||100
oenofrance|ACIDE MÉTATARTRIQUE|stabilisant tartrique|g||1 kg, 25 kg|103|ue,vegan
oenofrance|CMC GRANULÉ|stabilisant tartrique|g||20 kg|103|vegan
oenofrance|CMC POUDRE|stabilisant tartrique|g||25 kg|103|vegan
oenofrance|MÉTABISULFITE DE POTASSIUM|sulfitage|g||1 kg, 25 kg|103|ue,vegan
oenofrance|PVPP POUDRE|pvpp|g||20 kg|103|vegan
soec|SOEC 7|levure|g|20 g/hL|500 g, 10 kg|16|ue,vegan
soec|SOEC 1971|levure|g|20 g/hL|100 g, 500 g, 10 kg|16|ue,vegan
soec|VITILEVURE QUARTZ|levure|g|20 g/hL|500 g|16|ue,vegan
soec|SOEC ORGANIC|levure|g|20-30 g/hL|500 g|16|ue,nop,vegan
soec|NEVEA|levure|g||500 g|16|vegan
soec|SOEC 39|levure|g|20 g/hL|500 g|21|ue,vegan
soec|SOEC 49|levure|g|20 g/hL|500 g|21|ue,vegan
soec|START Y SP|nutriment|g||1 kg, 10 kg|22|vegan|260 g/hL
soec|START Y FRESH|nutriment|g|5-30 g/hL|1 kg, 10 kg|22|vegan
soec|START ML 5|nutriment bactéries|g|5 g/L (volume de réactivation)|500 g, 2,5 kg|22|vegan
soec|NUTRIEFF AA|nutriment|g|20-40 g/hL|1 kg, 10 kg|23|ue,nop,vegan
soec|NUTRICELL FML|nutriment bactéries|g|20-30 g/hL|1 kg, 5 kg|23|vegan
soec|CHARM ACTIV|nutriment|g|15-20 g/hL|1 kg|23|vegan
soec|NUTRICELL START|nutriment|g|20-60 g/hL|1 kg, 10 kg|23|ue,vegan
soec|PHOSPHATE DIAMMONIQUE|nutriment|g|5-30 g/hL|1 kg, 5 kg, 25 kg|24|ue,vegan
soec|PHOSPHATE COMPOSÉ|nutriment|g|jusqu'à 12 g/hL|1 kg, 5 kg|24|ue,vegan
soec|NOIR ACTIVA +|charbon|g||1 kg, 5 kg (granulé), 15 kg (poudre), 20 L, 1000 L (liquide)|27|vegan
soec|CARBINE T|charbon|g|20-100 g/hL|1 kg|27|ue,nop
soec|NOIR ACTIVA MAX|charbon|g||1 kg, 5 kg, 15 kg|27|vegan
soec|NOIR CAPTIVA|charbon|g|10-50 g/hL|5 kg|27|vegan
soec|CHARBON ENO ANTICROMOS|charbon|g|10-30 g/hL|15 kg|27|ue,vegan
soec|PROVGREEN PURE MUST|colle|g|15-50 g/hL|1 kg, 5 kg, 10 kg|29|ue,nop,vegan
soec|PROVGREEN L100|colle|L|5-40 cL/hL|20 L|29|ue,vegan
soec|POLYGREEN|colle|g|30-75 g/hL|1 kg, 5 kg, 10 kg|29|vegan
soec|CRISTAL CLEAR|colle|g|5-20 g/hL|1 kg, 10 kg|32|ue,vegan|100 g/hL
soec|ORIGIN F-MAX|colle|g|30-100 g/hL|1 kg, 5 kg|32|vegan
soec|DELTA CHARM AF|colle|g|20-200 g/hL|1 kg, 10 kg|32|vegan
soec|KTS FLOT|colle|L|5-15 cL/hL|5 L, 20 L, 1000 L|32|ue,nop,vegan
soec|E CATAL CLARIF|enzyme|g|2 g/hL (flottation)|50 g, 1 kg|34|ue,nop,vegan
soec|E CATAL CLARIF LIQUIDE|enzyme|mL|100 mL/4000 kg (cuvée), 25 mL (taille)|1 L, 5 L|34|ue,nop,vegan
soec|VITILACTIC STARTER BL01|bactérie|g|0,5-1 g/hL|25 g, 100 g, 500 g|34|ue,vegan
soec|CRISTALINE|colle|g|1-4 g/hL|200 g, 1 kg|37|ue
soec|CRISTAL|colle|L|10-20 cL/hL|10 L|37|ue
soec|PROVGREEN PURE WINE|colle|g|5-15 g/hL|1 kg, 5 kg|37|ue,nop,vegan
soec|AQUACOL|colle|g|2-5 g/hL (poudre), 1-2,5 cL/hL (liquide)|5 kg, 1 L, 20 L, 1000 L|38|ue
soec|GELISOL|colle|L|4-15 cL/hL (flottation)|1 L, 5 L, 10 L, 20 L, 1000 L|38|ue
soec|SILISOL|colle|L|1-5 cL/hL|1 L, 5 L, 20 L|38|ue,vegan
soec|CRISTALSOL|colle|L||20 L|39|vegan
soec|CRISTALGREEN|colle|L||20 L|39|vegan
soec|CALCISTAB 2.0|stabilisant tartrique|g|100 g/hL|5 kg, 25 kg|41|vegan
soec|OPTIBENT|bentonite|g|20-100 g/hL|25 kg|42|ue,vegan
soec|OPTIBENT LIQUIDE 100|bentonite|L|10-30 cL/hL|10 L, 1000 L|42|ue,vegan
soec|ELECTRA|bentonite|g|20-100 g/hL|1 kg, 5 kg, 25 kg|42|ue,vegan
soec|GRANULA|bentonite|g|20-100 g/hL|1 kg, 25 kg|42|ue,vegan
soec|BENTEFF|bentonite|g|10-25 g/hL|25 kg|42|ue,vegan
soec|CRÈME DE TACKT|stabilisant tartrique|g|400 g/hL|5 kg, 25 kg|45|vegan
soec|CRISTAB GC|stabilisant tartrique|g|10 g/hL (granulé), 20 cL/hL (liquide)|1 kg, 5 L, 20 L, 1000 L|45|vegan|10 g/hL
soec|GOMMEFF|gomme arabique|L|5-10 cL/hL|20 L, 1000 L|46|ue,nop,vegan
soec|GOMME VEREK BIO|gomme arabique|g|10-50 g/hL|1 kg|46|ue,nop,vegan
soec|ACIDE FUMARIQUE|stabilisant microbiologique|g|30-60 g/hL|5 kg, 25 kg|46|vegan|60 g/hL
soec|KTS FA|stabilisant microbiologique|g|15-20 g/hL|1 kg, 10 kg|46|ue,nop,vegan
soec|TANIGAL|tanin|g|2-8 g/hL|1 kg, 25 kg|47|ue,nop,vegan
soec|CLAR T VINIF|tanin|L|2-6 cL/hL|5 L, 10 L|47|ue,nop,vegan
soec|VITANIL B|tanin|g|2-20 g/hL|1 kg|47|ue,nop,vegan
soec|SUBLITAN TIRAGE|tanin|g|5 g/hL|500 g|48|ue,vegan
soec|CLAR T SPECIAL TIRAGE|tanin|L|2-6 cL/hL|1 L, 5 L, 10 L|48|vegan
soec|CLAR T TIRAGE|tanin|L|2-6 cL/hL|1 L, 5 L, 10 L|48|ue,vegan
soec|TANIN TIRAGE POUDRE|tanin|g|1-3 g/hL|1 kg|48|ue,nop,vegan
soec|CHARM REDOX T|tanin|g|2-15 g/hL|1 kg|49|ue,nop,vegan
soec|SUBLI CHARM|tanin|g|0,5-15 g/hL|1 kg|49|ue,nop,vegan
soec|ADJUVANT 83|adjuvant de remuage|L|2-3 g/hL (poudre), 6 cL/hL (liquide)|1 kg, 1 L, 5 L, 10 L|50|vegan
soec|ADJUVANT 92|adjuvant de remuage|L|3-4 g/hL (poudre), 8 cL/hL (liquide)|1 kg, 5 kg, 20 kg, 1 L, 10 L|50|vegan
soec|ADJUVANT MC|adjuvant de remuage|g|3,5-5,5 g/hL (poudre), 8 cL/hL (liquide)|1 kg, 10 kg, 1 L, 10 L, 20 L|50|vegan
soec|ADJUVANT M.O.|adjuvant de remuage|g|4 g/hL (poudre), 6-8 cL/hL (liquide)|1 kg, 10 L|50|vegan
soec|COMPLEXE A.N.|adjuvant de remuage|L|2-3 cL/hL|1 L, 5 L|51|vegan
soec|SOLUTION 64|traitement spécifique|L|2 cL/hL (prise de mousse), 0,5-2 cL/100 bouteilles (dégorgement)|1 L, 5 L|51|vegan
soec|ADJUVANT GT|adjuvant de remuage|L|6 cL/hL (liquide), 5-7 g/hL (poudre)|10 L, 1 kg|51|vegan
soec|ADJUVANT 100%|adjuvant de remuage|g|4-7 g/hL|1 kg|51|ue,vegan
soec|CHARM AGE|produit de levure|g|10-20 g/hL|1 kg|55|ue,nop,vegan
soec|CHARM ELEVAGE|produit de levure|g|15-30 g/hL|1 kg|55|ue,nop,vegan
soec|CHARM VIVA|produit de levure|g|0,5-5 g/hL|250 g|55|vegan
soec|SUBLIWHITE|tanin|g|0,5-1 g/100 bouteilles|1 kg, 5 kg|56|ue,vegan
soec|GOMIXEL|gomme arabique|L|3-5 cL/100 bouteilles|1 L, 5 L, 20 L, 909 L|56|ue,nop,vegan
soec|CLAR T DÉGORGEMENT|tanin|L|0,5-1 cL/100 bouteilles|1 L, 5 L|56|vegan
soec|FILTROSTABIL|gomme arabique|L|10-50 g/hL (poudre), 3-20 cL/100 bouteilles|25 kg, 1 L, 5 L, 20 L, 1000 L|56|ue,vegan
soec|ACIDE METATARTRIQUE V40|stabilisant tartrique|g|jusqu'à 10 g/hL|1 kg, 25 kg|56|ue,vegan|10 g/hL
soec|MCR|sucre / MCR|L|0,5-4,3 cL/bouteille (liqueur d'expédition)|10 L, 120 L, 1000 L|57|vegan
soec|OPEN PURE|produit de levure|g|0,5-1,5 g/100 bouteilles|250 g|57|ue,nop,vegan
soec|SUCRE DE RAISIN CRISTALLISÉ|sucre / MCR|kg||5 kg, 20 kg|57|ue,nop,vegan
soec|ANTARTIKA V40|stabilisant tartrique|L|2-5 cL/hL|1 L, 10 L, 20 L, 1000 L|57|vegan
soec|MCR BIO|sucre / MCR|L|0,5-4,3 cL/bouteille (liqueur d'expédition)|10 L, 1000 L|58|ue,nop,vegan
soec|SULFOSSOL (BISULFITE D'AMMONIUM)|sulfitage|L||5 L, 10 L, 20 L, 120 L, 1000 L|60
soec|BIDOSES BISULFITE|sulfitage|u||coffret de 2 doses|60
soec|TRIDOSES BISULFITE|sulfitage|u||coffret de 3 doses|60
soec|SULFI VENDANGE NOIX DE GALLES|sulfitage|L||5 L, 10 L|60
soec|BIDOSES SULFIVENDANGE|sulfitage|u||coffret de 2 doses|60
soec|TRIDOSES SULFIVENDANGE|sulfitage|u||coffret de 3 doses|60
soec|EFFERBAKTOL|sulfitage|u||2 g, 5 g, 50 g, 100 g, 125 g, 400 g|60
soec|BAKTOL (BISULFITE DE POTASSIUM)|sulfitage|L||1 L, 5 L, 10 L, 20 L, 1000 L|60
soec|SOLUTION SULFUREUSE 6%|sulfitage|L||10 L|60|ue,vegan||60 g/L
martinvialatte|SO.COOL|levure|g|20 g/hL|500 g|11|ue,nop,vegan
martinvialatte|SO.THIOL|levure|g|20 g/hL|500 g|11|ue,nop,vegan
martinvialatte|SO.DELIGHT|levure|g|20 g/hL|500 g, 10 kg|11|ue,nop,vegan
martinvialatte|VIALATTE FERM W58|levure|g|20 g/hL|500 g|12|ue,nop,vegan
martinvialatte|VIALATTE FERM R26|levure|g|20 g/hL|500 g|12|ue,nop,vegan
martinvialatte|VIALATTE FERM HD18|levure|g|20 g/hL|500 g|12|ue,nop,vegan
martinvialatte|VIALATTE FERM R71|levure|g|||14|ue,nop
martinvialatte|VIALATTE FERM R82|levure|g|||14|ue,nop
martinvialatte|VIALATTE FERM R96|levure|g|||14|ue,nop
martinvialatte|VIALATTE FERM R100|levure|g|||14|ue,nop
martinvialatte|VIALATTE FERM W12|levure|g|||14|ue,nop
martinvialatte|VIALATTE FERM W28|levure|g|||14|ue,nop
martinvialatte|SO.FLAVOUR|levure|g|||14|ue,nop
martinvialatte|SO.FRUITY|levure|g|||14|ue,nop
martinvialatte|LEVURE CLASSIC CE|levure|g|||14|ue,nop
martinvialatte|LEVURE CLASSIC BY|levure|g|||14|ue,nop
martinvialatte|LEVURE CLASSIC K|levure|g|||14|ue,nop
martinvialatte|NEVEA|levure|g||500 g|16|ue,nop,vegan
martinvialatte|LEVEL2 FLAVIA|levure|g||500 g|16|ue,nop,vegan
martinvialatte|HOP|levure|g|20 g/hL|500 g, 10 kg|16|ue,nop,vegan
martinvialatte|VITILEVURE CHARDONNAY YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE SAUVIGNON|levure|g|||17|ue,nop
martinvialatte|VITILEVURE 58W3 YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE ELIXIR YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE TONIC YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE LB ROSÉ|levure|g|||17|ue,nop
martinvialatte|VITILEVURE 3001 YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE CSM YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE GY YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE SENSATION|levure|g|||17|ue,nop
martinvialatte|VITILEVURE SYRAH YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE GRENACHE|levure|g|||17|ue,nop
martinvialatte|VITILEVURE AZUR YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE MT YSEO|levure|g|||17|ue,nop
martinvialatte|VITILEVURE LB ROUGE|levure|g|||17|ue,nop
martinvialatte|VITILEVURE B+C|levure|g|||17|ue,nop
martinvialatte|VITILEVURE QUARTZ|levure|g|||17|ue,nop
martinvialatte|VITILEVURE AUGEO|levure|g|||17|ue,nop
martinvialatte|NUTRIMUST B+|nutriment|g|20-40 g/hL|1 kg, 10 kg|21|ue,nop,vegan
martinvialatte|NUTRICELL INITIAL|nutriment|g|20-40 g/hL|1 kg, 10 kg|21|ue,vegan
martinvialatte|NUTRICELL AA|nutriment|g|20-40 g/hL|1 kg, 10 kg|21|ue,nop,vegan
martinvialatte|NUTRICELL FULLAROM|nutriment|g|20-40 g/hL|1 kg, 10 kg|21|ue,vegan
martinvialatte|NUTRICELL START|nutriment|g|20-60 g/hL|1 kg, 10 kg|21|ue,vegan
martinvialatte|NUTRICELL FLOT|nutriment|g|20-60 g/hL|10 kg|21|vegan
martinvialatte|NUTRICELL|nutriment|g|20-60 g/hL|1 kg, 10 kg|21|vegan
martinvialatte|NUTRICELL FINISH|nutriment|g|20-40 g/hL|1 kg, 10 kg|22|ue,nop,vegan
martinvialatte|NUTRICELL MIDFERM|nutriment|g|20-60 g/hL|1 kg, 10 kg|22|ue,vegan
martinvialatte|NUTRICELL FML|nutriment bactéries|g|20-30 g/hL|1 kg, 5 kg|22|vegan
martinvialatte|THIAMINE|nutriment|g|||24|ue
martinvialatte|SULFATE D'AMMONIUM|nutriment|g|||24
martinvialatte|PHOSPHATE DIAMMONIQUE|nutriment|g|||24|ue
martinvialatte|NUTRIMENT S|nutriment|g|||24
martinvialatte|NUTRIMENT P|nutriment|g|||24|ue
martinvialatte|VITIAMINE|nutriment|g|||24|ue
martinvialatte|VITIAMINE 2|nutriment|g|||24
martinvialatte|ÉCORCES DE LEVURES|nutriment|g|||24|ue,nop
martinvialatte|ACTIFERM OR|nutriment|g|||24|ue,nop
martinvialatte|ACTIFERM|nutriment|g|||24
martinvialatte|ACTIFERM 1|nutriment|g|||24
martinvialatte|ACTIFERM 2|nutriment|g|||24
martinvialatte|ACTIFERM MVR|nutriment|g|||24
martinvialatte|OPEN PURE FRAÎCHEUR|produit de levure|g|0,5-20 g/hL|250 g|26|ue,nop,vegan
martinvialatte|OPEN PURE|produit de levure|g|0,5-5 g/hL|250 g|26|ue,nop,vegan
martinvialatte|NEO CRISPY|produit de levure|g|15-30 g/hL|1 kg, 5 kg|26|ue,nop,vegan
martinvialatte|NEO2 XC|produit de levure|g|20-40 g/hL|1 kg, 5 kg|26|ue,nop,vegan
martinvialatte|NEO LEES|produit de levure|g|0,5-30 g/hL|500 g|26|ue,nop,vegan
martinvialatte|NEO SWEET|produit de levure|g|15-30 g/hL|1 kg, 5 kg|26|ue,nop,vegan
martinvialatte|NEO NATURA|colle|g|0,5-30 g/hL|500 g|26|ue,nop,vegan
martinvialatte|KTS FLOT|colle|L|5-15 cL/hL (liquide), 3-15 g/hL (poudre)|5 L, 20 L, 1000 L, 1 kg|29|ue,vegan
martinvialatte|PROVGREEN PURE MUST|colle|g|15-50 g/hL|1 kg, 5 kg, 10 kg|30|ue,nop,vegan
martinvialatte|PROVGREEN COLOR|colle|g|20-50 g/hL|5 kg|30|ue,nop,vegan
martinvialatte|PROVGREEN L100|colle|L|15-40 cL/hL (moût), 30 cL/hL (vin)|20 L|30|ue,vegan
martinvialatte|POLYPRESSE AF|colle|g|30-180 g/hL|5 kg|30
martinvialatte|ORIGIN FRESH|colle|g|10-50 g/hL|5 kg|30|vegan
martinvialatte|ORIGIN SH|colle|g|30-70 g/hL|1 kg, 5 kg|30|vegan
martinvialatte|BENTOGREEN|colle|g|20-60 g/hL|5 kg|31|ue,vegan
martinvialatte|DELTAGREEN|colle|g|30-200 g/hL|1 kg, 10 kg|31|vegan
martinvialatte|POLYGREEN|colle|g|20-120 g/hL|1 kg, 5 kg, 10 kg|31|vegan
martinvialatte|ORIGIN CAPTUR|colle|g|5-50 g/hL|1 kg|52|vegan|50 g/hL
martinvialatte|VIAZYM MP|enzyme|g|1-4 g/100 kg|100 g, 1 kg|34|nop,vegan
martinvialatte|VIAZYM AROMA|enzyme|g|2-5 g/hL|100 g|34|nop,vegan
martinvialatte|VIAZYM CLARIF ONE|enzyme|mL|2-5 mL/hL, 2-5 g/hL|1 L, 10 L, 20 L, 1 kg|34|ue,nop,vegan
martinvialatte|VIAZYM CLARIF PLUS|enzyme|mL|1-2 mL/hL, 1-2 g/hL|100 mL, 1 L, 10 L, 100 g|34|ue,nop,vegan
martinvialatte|VIAZYM CLARIF EXTREM|enzyme|mL|0,3-1 mL/hL|1 L|34|ue,nop,vegan
martinvialatte|VIAZYM EXTRACT ONE|enzyme|g|2-5 g/100 kg|1 kg|34|nop,vegan
martinvialatte|VIAZYM EXTRACT PREMIUM|enzyme|g|2-3 g/100 kg|100 g|34|nop,vegan
martinvialatte|VIAZYM EXTRACT|enzyme|mL|1-3 mL/100 kg, 1-3 g/100 kg|100 mL, 1 L, 10 L, 100 g, 1 kg|34|nop,vegan
martinvialatte|VIAZYM FLUX|enzyme|mL|3-5 mL/hL|1 L|35|nop,vegan
martinvialatte|VIAZYM THERMO|enzyme|mL|2-5 mL/hL|1 L, 10 L|35|ue,nop,vegan
martinvialatte|VIAZYM FLOT|enzyme|mL|2-4 mL/hL|1 L|35|ue,nop,vegan
martinvialatte|VIAZYM ROUGE|enzyme|g|2-5 g/hL|100 g|35|ue,nop,vegan
martinvialatte|VIAZYM ELEVAGE|enzyme|g|3-5 g/hL|100 g|35|nop,vegan
martinvialatte|REFLEX MALO 360|bactérie|u||dose 25 hL, 250 hL|38|ue,nop,vegan
martinvialatte|REFLEX MALO HD|bactérie|u||dose 25 hL, 250 hL|38|ue,nop,vegan
martinvialatte|REFLEX MALO PH|bactérie|u||dose 25 hL, 250 hL|38|ue,nop,vegan
martinvialatte|VITILACTIC PRIMEUR|bactérie|u||dose 250 hL|38|ue,nop,vegan
martinvialatte|VITILACTIC H+|bactérie|u||dose 50 hL|38|ue,nop,vegan
martinvialatte|VITILACTIC EXPRESSION|bactérie|u||dose 100 hL|38|ue,nop,vegan
martinvialatte|VITILACTIC R|bactérie|u||dose 25 hL|38|ue,nop,vegan
martinvialatte|VITILACTIC F|bactérie|u||dose 2,5 hL, 25 hL, 100 hL, 250 hL|39|ue,nop
martinvialatte|VITILACTIC CO-FA|bactérie|u||dose 250 hL|39|ue,nop
martinvialatte|SUBLIFRESH|tanin|g|2-15 g/hL|1 kg|40|ue,nop,vegan
martinvialatte|SUBLITAN VINIF|tanin|g|10-40 g/hL|1 kg|40|ue,nop,vegan
martinvialatte|SUBLISTAB|tanin|g|10-40 g/hL|1 kg, 15 kg|40|ue,nop,vegan
martinvialatte|SUBLIWHITE|tanin|g|5-15 g/hL|1 kg, 5 kg|40|ue,nop,vegan
martinvialatte|SUBLIRED|tanin|g|2-15 g/hL|1 kg|41|ue,nop,vegan
martinvialatte|VITANIL VR|tanin|g|5-20 g/hL|1 kg, 10 kg|41|ue,nop,vegan
martinvialatte|TANIXEL|tanin|g|5-50 g/hL|1 kg, 12,5 kg|41|ue,nop,vegan
martinvialatte|VITANIL B|tanin|g|2-20 g/hL|1 kg|41|ue,nop,vegan
martinvialatte|TANIGAL|tanin|g|2-8 g/hL|1 kg, 25 kg|41|ue,nop,vegan
martinvialatte|SUBLIPROTECT|tanin|g|5-20 g/hL|1 kg|42|ue,nop,vegan
martinvialatte|SUBLIOAK|tanin|g|1-30 g/hL|500 g|42|ue,nop,vegan
martinvialatte|TANIRAISIN|tanin|g|3-30 g/hL|500 g|42|ue,nop,vegan
martinvialatte|TANIPEPIN|tanin|g|1-15 g/hL|500 g|42|ue,nop,vegan
martinvialatte|VIAOAK NATUR|bois|kg|1-4 g/L|copeaux : sac de 10 kg (2 filets de 5 kg)|44|ue,nop,vegan
martinvialatte|VIAOAK CHAUFFE LÉGÈRE|bois|kg|1-3 g/L|copeaux : sac de 10 kg (2 filets de 5 kg)|44|ue,nop,vegan
martinvialatte|VIAOAK FINESSE|bois|kg|2-6 g/L|copeaux : sac de 10 kg (2 filets de 5 kg)|44|ue,nop,vegan
martinvialatte|VIAOAK WHITE CHOCOLATE|bois|kg|2-6 g/L|copeaux : sac de 10 kg (2 filets de 5 kg)|44|ue,nop,vegan
martinvialatte|VIAOAK HIGH SWEET|bois|kg|2-6 g/L|copeaux : sac de 10 kg (2 filets de 5 kg)|45|ue,nop,vegan
martinvialatte|VIAOAK HIGH MOKA|bois|kg|2-6 g/L|copeaux : sac de 10 kg (2 filets de 5 kg)|45|ue,nop,vegan
martinvialatte|VIAOAK F 500|bois|kg|0,5-1,5 g/L|sac de 10 kg (2 filets de 5 kg)|45|ue,nop,vegan
martinvialatte|VIAOAK CHIPS INTENSO|bois|kg|2-4 g/L|sac de 10 kg (2 filets de 5 kg)|46|ue,nop,vegan
martinvialatte|VIAOAK CUBE INTENSO|bois|kg|4-6 g/L|sac de 10 kg (2 filets de 5 kg)|46|ue,nop,vegan
martinvialatte|VIAOAK DÉLICE|bois|u|0,5-2 douelles/hL||46|ue,nop,vegan
martinvialatte|VIAOAK STAVE 27 INTENSO|bois|u|0,5-2 douelles/hL||46|ue,nop,vegan
martinvialatte|VIAOAK KIT NEWLIFE INTENSO|bois|u|1 kit/barrique|chapelet de 24 ministaves|46
martinvialatte|VIAOAK BLANC COMPLEX|bois|kg|1-3 g/L|sac de 10 kg|48|ue,nop,vegan
martinvialatte|VIAOAK BLANC VARIETAL|bois|kg|1-3 g/L|sac de 10 kg|48|ue,nop,vegan
martinvialatte|VIAOAK ROSÉ FRESH|bois|kg|1 g/L|sac de 10 kg|48|ue,nop,vegan
martinvialatte|VIAOAK BOUQUET|bois|kg|1-2 g/L|sac de 10 kg|48|ue,nop,vegan
martinvialatte|VIAOAK ROUGE FRUITÉ|bois|kg|2-4 g/L|sac de 10 kg|48|ue,nop,vegan
martinvialatte|SIMILIOAK|tanin|g|0,2-0,6 g/L|500 g, 5 kg|50|ue,nop,vegan
martinvialatte|SIMILIOAK WHITE|tanin|g|0,05-0,2 g/L|5 kg|50|ue,nop,vegan
martinvialatte|SIMILIOAK TOASTED|tanin|g|0,05-0,5 g/L|5 kg|50|ue,nop,vegan
martinvialatte|QALISOL|colle|L|3-5 cL/hL|1 L, 20 L|52|ue
martinvialatte|PROVGREEN PURE WINE|colle|g|5-15 g/hL|1 kg, 5 kg|52|ue,nop,vegan
martinvialatte|PRZ AF|colle|g|30-150 g/hL|5 kg|52
martinvialatte|ALBUMINOCOL|colle|L|||53|ue
martinvialatte|GÉLATINE LIQUIDE|colle|L|||53|ue
martinvialatte|SOLUGEL|colle|g|||53
martinvialatte|AQUACOL|colle|g|||53|ue
martinvialatte|OVOCOL|colle|L|||53|ue,nop
martinvialatte|CRISTALINE|colle|g|||53|ue
martinvialatte|SILICE 30|colle|L|||53|nop
martinvialatte|KTS FA|stabilisant microbiologique|g|15-20 g/hL|1 kg, 10 kg|54|ue,vegan
martinvialatte|KTS CONTROL|stabilisant microbiologique|g|2-10 g/hL|100 g, 500 g|55|ue,vegan
martinvialatte|KTS MB|stabilisant microbiologique|g|15 g/hL|1 kg, 10 kg|55|vegan
martinvialatte|KTS CLEAR|colle|g|5-40 g/hL|1 kg|55|vegan
martinvialatte|VELCORIN|conservateur|L|||56
martinvialatte|GOMIXEL|gomme arabique|L|10-15 cL/hL|1 L, 5 L, 20 L, 909 L|57|ue,nop,vegan
martinvialatte|FILTROSTABIL|gomme arabique|L|3-12 cL/hL, 10-30 g/hL|1 L, 5 L, 20 L, 1000 L, 25 kg|57|ue,nop,vegan
martinvialatte|SUPERFILTROSTABIL|gomme arabique|L|3-11 cL/hL|20 L, 1000 L|57|ue
martinvialatte|SUPERNEOSTABIL|gomme arabique|L|5-10 cL/hL|20 L, 1000 L|57|ue,nop,vegan
martinvialatte|DUOGOM MAX|gomme arabique|L|10-14 cL/hL|5 L, 20 L, 1000 L|57|ue,vegan
martinvialatte|GOMME VEREK BIO|gomme arabique|g|10-30 g/hL|1 kg|57|ue,nop,vegan
martinvialatte|MIRACOL|bentonite|g|5-25 g/hL|1 kg, 25 kg|58|ue,vegan
martinvialatte|ELECTRA|bentonite|g|20-100 g/hL|1 kg, 5 kg, 25 kg|58|ue,vegan
martinvialatte|GRANULA|bentonite|g|20-100 g/hL|1 kg, 25 kg|58|ue,vegan
martinvialatte|OPTIBENT|bentonite|g|20-100 g/hL|25 kg, 10 L|58|ue,vegan
martinvialatte|CALCICA|bentonite|g|20-150 g/hL|25 kg|58|ue,nop,vegan
martinvialatte|ANTARTIKA VR|stabilisant tartrique|L|5-20 cL/hL|1 L, 10 L, 20 L, 1000 L|60|vegan
martinvialatte|ANTARTIKA V40|stabilisant tartrique|L|2,5-5 cL/hL|1 L, 10 L, 20 L, 1000 L|60|vegan
martinvialatte|ANTARTIKA DUO|stabilisant tartrique|L|10-20 cL/hL|20 L, 1000 L|60|vegan
martinvialatte|ANTARTIKA FRESH|stabilisant tartrique|L|10-20 cL/hL|10 L, 20 L|60|vegan
martinvialatte|CRISTAB BV|stabilisant tartrique|L|10 cL/hL|20 L, 909 L|60|vegan
martinvialatte|CRISTAB GC|stabilisant tartrique|g|20 g/hL (granulé), 40 cL/hL (liquide)|5 L, 20 L, 1000 L, 1 kg|60|vegan
martinvialatte|NOIR CAPTIVA|charbon|g|10-50 g/hL|5 kg|62|ue,nop,vegan
martinvialatte|NOIR ACTIVA MAX|charbon|g||1 kg, 5 kg, 15 kg|62|ue,nop,vegan
martinvialatte|NOIR ACTIVA + GRANULÉ|charbon|g||1 kg, 5 kg|63|ue,nop,vegan
martinvialatte|NOIR ACTIVA + POUDRE|charbon|g||10 kg|63|ue,nop,vegan
martinvialatte|NOIR ACTIVA + LIQUIDE|charbon|L||20 L, 1000 L|63|ue,nop,vegan
martinvialatte|PVPP|pvpp|g||1 kg, 5 kg, 20 kg|63|vegan
martinvialatte|ACIDE CITRIQUE|acidifiant|g||1 kg, 25 kg|63|ue,nop,vegan
martinvialatte|ACIDE METATARTRIQUE V40|stabilisant tartrique|g||1 kg, 25 kg|63|ue,vegan
martinvialatte|BITARTRATE DE K|stabilisant tartrique|g||25 kg|63|ue,nop,vegan
martinvialatte|CITRATE DE CUIVRE 2%|traitement spécifique|g||1 kg|63|ue,vegan
martinvialatte|ACIDE FUMARIQUE|stabilisant microbiologique|g||5 kg, 25 kg|63
martinvialatte|ACIDE LACTIQUE|acidifiant|g||5 kg, 25 kg|63|ue,vegan
martinvialatte|ACIDE MALIQUE|acidifiant|g||1 kg, 5 kg, 25 kg|63
martinvialatte|ACIDE TARTRIQUE|acidifiant|g||1 kg, 5 kg, 25 kg|63|ue,nop,vegan
martinvialatte|BICARBONATE DE K|désacidifiant|g||1 kg, 25 kg|63|ue,vegan
martinvialatte|CARBONATE DE CALCIUM|désacidifiant|g||1 kg, 25 kg|63|ue,nop,vegan
martinvialatte|DESACID|désacidifiant|g||10 kg|63|ue,nop,vegan
martinvialatte|BAKTOL P|sulfitage|g||1 kg, 25 kg|64|ue,vegan
martinvialatte|BAKTOL (BISULFITE DE POTASSIUM)|sulfitage|L||1 L, 5 L, 10 L, 20 L, 1000 L (50 à 200 g/L de SO₂)|64|ue,vegan
martinvialatte|SULFOSSOL (BISULFITE D'AMMONIUM)|sulfitage|L||1 L, 5 L, 10 L, 20 L, 120 L, 1000 L (50 à 600 g/L de SO₂)|64
martinvialatte|ACIDE ASCORBIQUE|antioxydant|g|10 g/hL (vin), 2-5 g/100 kg (raisin), 5-8 g/100 bouteilles (dégorgement)|1 kg, 5 kg, 25 kg|65|ue,nop,vegan
martinvialatte|BACTOLYSE LYSOZYME|stabilisant microbiologique|g|10-50 g/hL|500 g|65
martinvialatte|BAKTOSSOL 225|sulfitage|L||10 L|65
martinvialatte|EFFERBAKTOL 2 ET 5 GRANULÉS|sulfitage|u||40 sachets/boîte, 25 sachets/boîte|65|ue,vegan
martinvialatte|EFFERBAKTOL 50 GRANULÉS|sulfitage|u||125 g|65|ue,vegan||50 g/u
martinvialatte|EFFERBAKTOL 100 GRANULÉS|sulfitage|u||250 g|65|ue,vegan||100 g/u
martinvialatte|EFFERBAKTOL 125 GRANULÉS|sulfitage|u||300 g|65|ue,vegan||125 g/u
martinvialatte|EFFERBAKTOL 400 GRANULÉS|sulfitage|u||1 kg|65|ue,vegan||400 g/u
martinvialatte|SOLUTION SULFUREUSE 6%|sulfitage|L||10 L|65|ue,nop,vegan||60 g/L
martinvialatte|SORBATE DE POTASSIUM|conservateur|g|20-26 g/hL|1 kg, 25 kg|65
martinvialatte|SULFISCORBATE POUDRE|sulfitage|g|2-5 g/100 kg (raisin), 10 g/hL (vin), 5-8 g/100 bouteilles (dégorgement)|500 g|65|ue,vegan
martinvialatte|CASEINE SOLUBLE|colle|g|||31|ue,nop`;
const CAT_FAM = Object.fromEntries(CATALOGUE_FAMILLES.map(([id, label, cat]) => [id, { id, label, cat }]));
const famLabel = (f) => (CAT_FAM[f] ? CAT_FAM[f].label : f || '—');
const famCategorie = (f) => (CAT_FAM[f] ? CAT_FAM[f].cat : 'oeno');
const catCle = (s) => norm(s).replace(/[^a-z0-9+]+/g, ' ').trim();
const fournisseurNom = (db, id) => ((db.fournisseurs || []).find((f) => f.id === id) || {}).nom || '';
let _catIntegre = null;
// catalogues préinstallés (lus une fois)
function catalogueIntegre() {
  if (_catIntegre) return _catIntegre;
  const meta = Object.fromEntries(CATALOGUES.map((c) => [c.id, c]));
  _catIntegre = CATALOGUE_TXT.split('\n').filter(Boolean).map((l) => {
    const [cat, nom, famille, unite, dose, cond, page, drap, max, so2] = l.split('|'); const c = meta[cat]; const fl = String(drap || '').split(',');
    return { id: `${cat}:${slug(nom.replace(/\+/g, ' plus '))}`, cat, fournisseur: c.fournisseur, marque: c.marque, titre: c.titre, annee: c.annee, nom, famille, unite, dose: dose || '', cond: cond || '', page: page || '',
      ue: fl.includes('ue'), nop: fl.includes('nop'), vegan: fl.includes('vegan'), max: max || '', so2: so2 || '', integre: true, etat: 'valide' };
  });
  return _catIntegre;
}
// réglage commun : catalogues (cat:id) et fournisseurs (fo:nom) masqués
const catalogueReglage = (db) => { const r = db && db.catalogueReglage && typeof db.catalogueReglage === 'object' ? db.catalogueReglage : {}; return { masques: Array.isArray(r.masques) ? r.masques.filter((x) => typeof x === 'string') : [] }; };
const catalogueMasqueCle = (e) => [`cat:${e.cat}`, `fo:${catCle(e.fournisseur)}`];
const catalogueEstMasque = (db, e) => { const m = catalogueReglage(db).masques; return catalogueMasqueCle(e).some((k) => m.includes(k)); };
function catalogueMasquer(db, cle, masque) {
  if (!/^(cat|fo):./.test(String(cle || ''))) return fail('Catalogue ou fournisseur inconnu.');
  const s = new Set(catalogueReglage(db).masques); if (masque) s.add(cle); else s.delete(cle);
  db.catalogueReglage = { ...(db.catalogueReglage && typeof db.catalogueReglage === 'object' ? db.catalogueReglage : {}), masques: [...s].sort() }; return okr();
}
// catalogues importés (tableur, PDF, assistant IA) : lignes « à vérifier », « validée » ou « écartée »
const CAT_ETATS = { aVerifier: 'à vérifier', valide: 'validée', ecarte: 'écartée' };
const catalogueImportes = (db) => (Array.isArray(db && db.catalogues) ? db.catalogues.filter((c) => c && c.id && Array.isArray(c.lignes)) : []);
const catalogueImporteEntrees = (c) => c.lignes.filter((l) => l && l.nom).map((l) => ({ id: `imp:${c.id}:${l.id}`, cat: c.id, fournisseur: c.fournisseur, marque: c.marque || c.fournisseur, titre: c.titre, annee: c.annee || '',
  nom: l.nom, famille: l.famille || '', unite: l.unite || 'g', dose: l.dose || '', cond: l.cond || '', page: l.page || '', ue: !!l.ue, nop: !!l.nop, vegan: !!l.vegan, max: l.max || '', so2: l.so2 || '', integre: false, etat: l.etat || 'aVerifier', importId: c.id, ligneId: l.id }));
// entrées proposées : catalogues préinstallés + lignes validées des catalogues importés, hors catalogues ou fournisseurs masqués
function catalogueEntrees(db, o) {
  o = o || {}; const imp = catalogueImportes(db).flatMap(catalogueImporteEntrees).filter((e) => o.tous || e.etat === 'valide');
  return [...catalogueIntegre(), ...imp].filter((e) => o.masques === false || !catalogueEstMasque(db, e));
}
const catalogueEntree = (db, id) => [...catalogueIntegre(), ...catalogueImportes(db).flatMap(catalogueImporteEntrees)].find((e) => e.id === id) || null;
// recherche : fournisseur, catalogue (marque), famille, bio, texte
function catalogueChercher(db, o) {
  o = o || {}; const q = catCle(o.q || ''); const fo = o.fournisseur ? catCle(o.fournisseur) : '';
  return catalogueEntrees(db, { masques: o.masques }).filter((e) => (!fo || catCle(e.fournisseur) === fo) && (!o.cat || e.cat === o.cat) && (!o.famille || e.famille === o.famille) && (!o.bio || e.ue || e.nop) && (!o.vegan || e.vegan)
    && (!q || catCle(`${e.nom} ${e.marque} ${famLabel(e.famille)}`).includes(q)));
}
// liste des catalogues (préinstallés et importés) pour les réglages
function catalogueListe(db) {
  const m = catalogueReglage(db).masques; const I = catalogueIntegre();
  const integres = CATALOGUES.map((c) => ({ ...c, integre: true, n: I.filter((e) => e.cat === c.id).length, masque: m.includes(`cat:${c.id}`) || m.includes(`fo:${catCle(c.fournisseur)}`) }));
  const importes = catalogueImportes(db).map((c) => ({ id: c.id, fournisseur: c.fournisseur, marque: c.marque || c.fournisseur, titre: c.titre, annee: c.annee || '', integre: false, fichier: c.fichier || '', mode: c.mode || '', le: c.le || '', par: c.par || '',
    n: c.lignes.filter((l) => l.etat === 'valide').length, aVerifier: c.lignes.filter((l) => (l.etat || 'aVerifier') === 'aVerifier').length, ecartes: c.lignes.filter((l) => l.etat === 'ecarte').length, masque: m.includes(`cat:${c.id}`) || m.includes(`fo:${catCle(c.fournisseur)}`) }));
  return [...integres, ...importes];
}
// produit de la cave relié à une entrée (créé depuis elle, ou même nom chez le même fournisseur)
function catalogueProduitLie(db, e) {
  if (!e) return null;
  return db.produits.find((p) => p.catalogue && p.catalogue.id === e.id) || db.produits.find((p) => catCle(p.nom) === catCle(e.nom) && (!p.fournisseurId || catCle(fournisseurNom(db, p.fournisseurId)) === catCle(e.fournisseur))) || null;
}
// dose maximale indiquée par le catalogue, dans l'unité de dose du produit (g/hL ou mL/hL) ; pour un vin si moût et vin sont distingués
function catalogueMaxDose(e) {
  const t = String((e && e.max) || '').trim(); if (!t) return null;
  const m = /vin (\d+(?:[.,]\d+)?) ?(g|mL|cL)\/(hL|L)\b/i.exec(t) || /^(\d+(?:[.,]\d+)?) ?(g|mL|cL)\/(hL|L)$/i.exec(t); if (!m) return null;
  let v = num(m[1]); if (m[2] === 'cL') v *= 10; if (m[3] === 'L') v *= 100;
  const du = doseUnit(e.unite); if (!du || (du === 'g/hL') !== (m[2] === 'g')) return null;
  return Math.round(v * 1000) / 1000;
}
const catalogueBioTexte = (e) => [e.ue ? 'utilisable en bio (UE)' : '', e.nop ? 'NOP (États-Unis)' : '', e.vegan ? 'vegan' : ''].filter(Boolean).join(' · ');
const catalogueSource = (e) => `${e.titre}${e.page ? `, p. ${e.page}` : ''}`;
// produit créé depuis le catalogue : fournisseur ajouté s'il manque, informations et règles d'exemple « à vérifier »
function produitDepuisCatalogue(db, id) {
  const e = catalogueEntree(db, id); if (!e) return fail('Produit du catalogue introuvable.');
  const deja = catalogueProduitLie(db, e); if (deja) return okr({ id: deja.id, deja: true });
  let fo = db.fournisseurs.find((f) => catCle(f.nom) === catCle(e.fournisseur));
  if (!fo) { const r = fournisseurSave(db, { nom: e.fournisseur }); if (!r.ok) return r; fo = db.fournisseurs[db.fournisseurs.length - 1]; }
  const nom = nameTaken(db.produits, e.nom) ? `${e.nom} (${e.marque})` : e.nom;
  const r = produitSave(db, { nom, categorie: famCategorie(e.famille), unite: UNITES.includes(e.unite) ? e.unite : 'g', fournisseurId: fo.id, fabricant: e.marque, doseEmploi: e.dose ? `${e.dose} (${catalogueSource(e)})` : '', usageBio: catalogueBioTexte(e) });
  if (!r.ok) return r;
  const p = db.produits.find((x) => x.id === r.id);
  p.famille = e.famille || ''; p.catalogue = { id: e.id, titre: e.titre, annee: e.annee, page: e.page, conditionnements: e.cond, le: todayISO() };
  if (e.so2) p.so2 = e.so2;
  const mx = catalogueMaxDose(e); const src = `catalogue : ${catalogueSource(e)}`;
  regleSet(db, p.id, 'conv', { autorise: true, doseMax: mx, aVerifier: true, source: src });
  if (e.ue) regleSet(db, p.id, 'bio', { autorise: true, doseMax: mx, aVerifier: true, source: src });
  return okr({ id: p.id });
}
// fournisseurs proposés à la saisie d'un intrant : ceux de la cave et ceux des catalogues affichés
function intrantFournisseurs(db) {
  const s = new Map(); (db.fournisseurs || []).forEach((f) => { if (f && f.nom) s.set(catCle(f.nom), f.nom); });
  catalogueEntrees(db).forEach((e) => { const k = catCle(e.fournisseur); if (!s.has(k) && !catalogueReglage(db).masques.includes(`fo:${k}`)) s.set(k, e.fournisseur); });
  return [...s.values()].sort((a, b) => a.localeCompare(b, 'fr'));
}
// produits proposés : « @stock » (en stock), « @tous », ou un fournisseur (ses produits puis ceux de ses catalogues pas encore dans la cave)
function intrantProduitsPour(db, R, fo, cats) {
  const okCat = (c) => !cats || cats.includes(c);
  const mes = db.produits.filter((p) => p.actif !== false && okCat(p.categorie));
  const reste = (p) => db.arrivages.filter((a) => a.produitId === p.id).reduce((t, a) => t + Math.max(0, arrivalRest(R, a)), 0);
  if (fo === '@stock') return { produits: mes.filter((p) => reste(p) > 1e-6), catalogue: [] };
  if (!fo || fo === '@tous') return { produits: mes, catalogue: [] };
  const k = catCle(fo);
  const produits = mes.filter((p) => catCle(fournisseurNom(db, p.fournisseurId)) === k);
  const catalogue = catalogueEntrees(db).filter((e) => catCle(e.fournisseur) === k && okCat(famCategorie(e.famille)) && !catalogueProduitLie(db, e));
  return { produits, catalogue };
}

/* ---------- imports : tableur, texte d'un PDF (script), réponse de l'assistant IA ---------- */
const CAT_FAM_MOTS = [
  ['sulfitage', /sulfit|bisulfite|metabisulfite|efferbaktol|anhydride sulfureux|\bso2\b|solution sulfureuse/], ['levure', /levure(?!s? inactiv)|saccharomyces|yeast|bayanus/], ['bactérie', /bacteri|oenococcus|malolact/],
  ['enzyme', /enzym|pectin|pectolyt|glucanase/], ['nutriment', /nutri|activateur|phosphate|thiamine|azote|ammonium/], ['produit de levure', /levures? inactiv|mannoprot|ecorces? de levure|autolysat|derives? de levure/],
  ['tanin', /tanin|tannin/], ['bentonite', /bentonite/], ['pvpp', /pvpp|polyvinylpolypyrrolidone/], ['charbon', /charbon/], ['gomme arabique', /gomme|arabique/],
  ['stabilisant tartrique', /metatartrique|cmc|carboxymethyl|cellulose|polyaspartate|kpa|bitartrate|creme de tartre/], ['stabilisant microbiologique', /chitosan|lysozym|fumarique/],
  ['colle', /gelatine|colle|casein|albumin|ichtyocolle|proteine|pois|clarifiant|silice/], ['acidifiant', /acide (tartrique|malique|lactique|citrique)/], ['désacidifiant', /bicarbonate|carbonate de calcium|desacid/],
  ['antioxydant', /ascorbique/], ['conservateur', /sorbat|sorbique|dicarbonate|velcorin/], ['sucre / MCR', /sucre|saccharose|mcr|mout concentre/], ['bois', /copeau|chips|douelle|stave|chene|oak|bois/],
  ['adjuvant de remuage', /adjuvant|remuage/], ['filtration', /diatom|perlite|kieselguhr|plaque filtr/],
];
function catFamilleDevine(t) { const s = catCle(t); const x = CAT_FAM_MOTS.find(([, re]) => re.test(s)); return x ? x[0] : ''; }
const CAT_DOSE_RE = /(\d+(?:[.,]\d+)?(?:\s*(?:à|-|–)\s*\d+(?:[.,]\d+)?)?)\s*(g|mg|mL|ml|cL|cl|L|kg)\s*\/\s*(hL|hl|100\s*kg|L|kg|t)\b/;
function catDoseTexte(t) { const m = CAT_DOSE_RE.exec(String(t || '')); return m ? `${m[1].replace(/\s*(à|–)\s*/g, '-').replace(/\s+/g, '')} ${m[2].replace('ml', 'mL').replace('cl', 'cL')}/${m[3].replace('hl', 'hL').replace(/\s+/g, ' ')}` : ''; }
function catUniteDe(dose, cond) { const d = String(dose || ''); if (/\b(mL|cL|L)\//i.test(d)) return 'mL'; if (/\bkg\//.test(d)) return 'kg'; if (/\bg\//.test(d)) return 'g'; const c = String(cond || ''); if (/\d\s*(L|mL)\b/.test(c)) return 'L'; if (/\d\s*kg\b/.test(c)) return 'kg'; return 'g'; }
function catLigne(o, i) {
  const nom = String(o.nom || '').replace(/[®™]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120); if (!nom) return null;
  const dose = String(o.dose || '').trim().slice(0, 120); const cond = String(o.cond || '').trim().slice(0, 160);
  const famille = CAT_FAM[o.famille] ? o.famille : catFamilleDevine(`${o.famille || ''} ${nom}`);
  return { id: o.id || `l${i + 1}`, nom, famille, unite: UNITES.includes(o.unite) ? o.unite : catUniteDe(dose, cond), dose, cond, page: String(o.page || '').trim().slice(0, 20), ue: !!o.ue, nop: !!o.nop, vegan: !!o.vegan,
    max: String(o.max || '').trim().slice(0, 60), so2: String(o.so2 || '').trim().slice(0, 30), etat: ['valide', 'ecarte'].includes(o.etat) ? o.etat : 'aVerifier' };
}
// en-têtes reconnus (français et langues de l'interface) ; « dose max » avant « dose », pour ne pas les confondre
const CAT_COLS = [['max', /^(dose max|dose maximale|maximum|max)/], ['so2', /^(so2|teneur en so2|so2 content|contenido de so2|tenore di so2|so2 gehalt|teor de so2)/],
  ['nom', /^(nom|name|produ|designation|article|artikel|libelle|denomination|bezeichnung)/], ['famille', /^(famil|categor|kategor|gamme|type|tipo|typ)/], ['unite', /^(unite|unit|unidad|unita|einheit|unidade|u)$/],
  ['dose', /^(dos)/], ['cond', /^(conditionnement|emballage|packaging|pack|format|contenance|envase|confezione|verpackung|gebinde|embalagem)/], ['page', /^(page|p|pag|pagina|seite)$/],
  ['bio', /^(bio|ab|agriculture biologique|organic|ecologico|biologico|oko)/]];
// fichier CSV : séparateur deviné sur la 1re ligne (point-virgule, tabulation ou virgule), guillemets doublés, 5 000 lignes au plus
function catalogueCsvLignes(texte) {
  const t = String(texte || '').replace(/^\uFEFF/, ''); const l0 = t.split(/\r?\n/, 1)[0] || '';
  const sep = [';', '\t', ','].map((x) => [x, l0.split(x).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = []; let row = []; let cell = ''; let q = false;
  for (let i = 0; i < t.length && rows.length < 5000; i += 1) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i += 1; } else q = false; } else cell += ch; continue; }
    if (ch === '"' && cell.trim() === '') { q = true; cell = ''; continue; }
    if (ch === sep) { row.push(cell); cell = ''; continue; }
    if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i += 1; row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim())).map((r) => r.map((c) => String(c).trim()));
}
// tableur : ligne d'en-têtes cherchée dans les 10 premières lignes (« produit », « dose »…)
function catalogueDepuisTableau(rows) {
  const R0 = (rows || []).filter(Array.isArray); let h = -1; let map = null;
  for (let i = 0; i < Math.min(10, R0.length) && h < 0; i += 1) {
    const m = {}; R0[i].forEach((c, j) => { const t = catCle(String(c == null ? '' : c).replace(/₂/g, '2')); const k = CAT_COLS.find(([, re]) => re.test(t)); if (k && m[k[0]] === undefined) m[k[0]] = j; });
    if (m.nom !== undefined && Object.keys(m).length >= 2) { h = i; map = m; }
  }
  if (h < 0) return { lignes: [], colonnes: [], msg: 'Colonnes non reconnues : la première ligne doit nommer au moins « Produit » et « Dose » (ou « Famille », « Conditionnement »).' };
  const v = (r, k) => (map[k] === undefined ? '' : String(r[map[k]] == null ? '' : r[map[k]]).trim());
  const lignes = R0.slice(h + 1).map((r, i) => catLigne({ nom: v(r, 'nom'), famille: v(r, 'famille'), unite: v(r, 'unite'), dose: v(r, 'dose'), cond: v(r, 'cond'), page: v(r, 'page'), ue: /^(oui|x|1|ue|bio|vrai|yes)/i.test(v(r, 'bio')), max: v(r, 'max'), so2: v(r, 'so2') }, i)).filter(Boolean);
  return { lignes, colonnes: Object.keys(map) };
}
// texte d'un PDF : chaque dose (« 20 g/hL ») est rattachée au nom de produit (ligne en majuscules) qui la précède ; colonnes séparées
// par plusieurs espaces (mise en page du PDF) : « NOM   20-30 g/hL   500 g » ; conditionnement repris de la ligne « Conditionnement : … »
function catalogueDepuisTexte(texte) {
  const L = String(texte || '').split(/\r?\n/).map((x) => x.replace(/\t/g, '  ').trim()).filter(Boolean); const out = []; const vus = new Set();
  const un = (s) => s.replace(/\s+/g, ' ').trim();
  const estNom = (s0) => { const t = un(s0.replace(/[®™©*]/g, '')); const lettres = t.replace(/[^A-Za-zÀ-ÿ]/g, ''); if (t.length < 3 || t.length > 48 || lettres.length < 3) return false;
    const maj = lettres.replace(/[^A-ZÀ-Þ]/g, '').length; return maj / lettres.length > 0.7 && !/^(DOSE|CONDITIONNEMENT|PRODUIT|DESCRIPTION|APPLICATION|PAGE|SOMMAIRE|INDEX|NOUVEAU|NEW|VIN|VINS|MOÛTS?|BLANC|ROUGE|ROSÉ|BIO|UE|NOP)\b/i.test(t); };
  const COND = /(\d+(?:[.,]\d+)?\s*(?:kg|g|L|mL)(?:\s*[|,/–-]\s*\d+(?:[.,]\d+)?\s*(?:kg|g|L|mL))*)\s*$/;
  let nom = ''; let cond = ''; let dernier = null;
  L.forEach((s0) => {
    const s = un(s0); const d = catDoseTexte(s); const cols = s0.split(/\s{2,}|\s[|¦]\s/).map(un).filter(Boolean);
    if (estNom(s) && !d) { nom = un(s.replace(/[®™©*]/g, '')); cond = ''; dernier = null; return; }
    const c = /^conditionnements?\s*:?\s*(.+)$/i.exec(s); if (c && nom) { cond = c[1].trim(); if (dernier && dernier.nom === nom && !dernier.cond) dernier.cond = cond.slice(0, 160); return; }
    if (!d) return;
    const n0 = cols.length > 1 && estNom(cols[0]) && !CAT_DOSE_RE.test(cols[0]) ? un(cols[0].replace(/[®™©*]/g, '')) : nom; if (!n0) return;
    const k = catCle(n0); if (vus.has(k)) return; vus.add(k);
    const cd = (n0 === nom && cond) || (cols.length > 1 ? ((COND.exec(cols[cols.length - 1]) || [])[1] || '') : ((COND.exec(s.replace(CAT_DOSE_RE, '')) || [])[1] || ''));
    const l = catLigne({ nom: n0, dose: d, cond: cd, page: '' }, out.length); if (l) { out.push(l); dernier = l; if (n0 !== nom) { nom = n0; cond = ''; } }
  });
  return out.filter(Boolean);
}
// assistant IA : liste des produits du catalogue (données factuelles), puis relecture par l'utilisateur
function catalogueIaPrompt(texte, meta) {
  const system = 'Tu relèves les produits d’un catalogue de produits œnologiques. Tu réponds uniquement par un objet JSON valide, sans texte autour. Tu ne recopies aucune description : seulement des données factuelles.';
  const familles = CATALOGUE_FAMILLES.map((f) => f[0]).join(' | ');
  const t = `Catalogue${meta && meta.fournisseur ? ` du fournisseur ${meta.fournisseur}` : ''}${meta && meta.fichier ? ` (fichier « ${meta.fichier} »)` : ''}.\nTexte :\n"""\n${String(texte || '').slice(0, 14000)}\n"""\n\nRéponds : {"produits":[{"nom":"…","famille":"${familles}","unite":"g|kg|mL|L|u","dose":"ex. 20-30 g/hL","conditionnement":"ex. 500 g, 10 kg","page":"…","bio_ue":true|false,"vegan":true|false,"dose_max":"ex. 60 g/hL ou vide","so2":"teneur en SO₂ des solutions ou comprimés, ex. 150 g/L, ou vide"}]}. N’invente rien : laisse vide ce que le texte ne dit pas.`;
  return { system, texte: t };
}
function catalogueIaLire(o) {
  const L = o && Array.isArray(o.produits) ? o.produits : [];
  return L.slice(0, 1500).map((p, i) => catLigne({ nom: iaTexte(p.nom, 120), famille: iaTexte(p.famille, 40), unite: iaTexte(p.unite, 4), dose: iaTexte(p.dose, 120), cond: iaTexte(p.conditionnement, 160), page: iaTexte(p.page, 20), ue: p.bio_ue === true, vegan: p.vegan === true, max: iaTexte(p.dose_max, 60), so2: iaTexte(p.so2, 30) }, i)).filter(Boolean);
}
function catalogueImportSave(db, imp) {
  const fournisseur = String((imp && imp.fournisseur) || '').trim().slice(0, 80); if (!fournisseur) return fail('Indiquez le fournisseur du catalogue.');
  const lignes = ((imp && imp.lignes) || []).map((l, i) => catLigne(l, i)).filter(Boolean).slice(0, 2000);
  if (!lignes.length) return fail('Aucun produit reconnu dans ce fichier.');
  const vus = {}; lignes.forEach((l) => { while (vus[l.id]) l.id = `${l.id}b`; vus[l.id] = true; });
  if (!Array.isArray(db.catalogues)) db.catalogues = [];
  const id = nid(db, 'cat');
  db.catalogues.push({ id, fournisseur, marque: String(imp.marque || fournisseur).trim().slice(0, 80), titre: String(imp.titre || imp.fichier || 'Catalogue importé').trim().slice(0, 120), annee: String(imp.annee || '').trim().slice(0, 12),
    fichier: String(imp.fichier || '').slice(0, 160), mode: ['tableur', 'pdf', 'ia', 'texte'].includes(imp.mode) ? imp.mode : 'tableur', le: imp.le || todayISO(), par: imp.par || '', lignes });
  return okr({ id, n: lignes.length });
}
function catalogueLignesEtat(db, impId, ids, etat) {
  const c = catalogueImportes(db).find((x) => x.id === impId); if (!c) return fail('Catalogue introuvable.'); if (!CAT_ETATS[etat]) return fail('État inconnu.');
  let n = 0; c.lignes.forEach((l) => { if (ids.includes(l.id) && l.etat !== etat) { l.etat = etat; n += 1; } }); return okr({ n });
}
function catalogueLigneModifier(db, impId, ligneId, patch) {
  const c = catalogueImportes(db).find((x) => x.id === impId); if (!c) return fail('Catalogue introuvable.');
  const i = c.lignes.findIndex((l) => l.id === ligneId); if (i < 0) return fail('Ligne introuvable.');
  const n = catLigne({ ...c.lignes[i], ...patch, id: ligneId }, i); if (!n) return fail('Nom du produit requis.');
  c.lignes[i] = { ...c.lignes[i], ...n }; return okr();
}
function catalogueImportSupprimer(db, impId) {
  if (!catalogueImportes(db).some((c) => c.id === impId)) return fail('Catalogue introuvable.');
  db.catalogues = db.catalogues.filter((c) => !(c && c.id === impId));
  const r = catalogueReglage(db); if (r.masques.includes(`cat:${impId}`)) db.catalogueReglage = { ...db.catalogueReglage, masques: r.masques.filter((x) => x !== `cat:${impId}`) };
  return okr(); // les produits déjà créés depuis ce catalogue gardent leurs informations
}
