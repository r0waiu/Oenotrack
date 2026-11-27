# Nouveautés d’Œnotrack

Toutes les versions publiées, de la plus récente à la plus ancienne (numérotation `X.Y.Z-étiquette.N` : voir le [README](README.md#numérotation-des-versions)). Le même journal est dans l’application : *Nouveautés*, en bas de l’écran.

## 0.43.0-alpha.3 — 27/11/2026

- Configuration guidée : à la toute première ouverture (après la page de présentation), ou depuis Paramètres › Affichage & application, un questionnaire Basique (l’essentiel, quelques minutes) ou Avancé (identifiants douaniers, cave et dégorgement, plan de vinification, alertes de conformité, opérateurs, campagne, onglet d’ouverture) règle l’application d’avance : profil viticole de la région, onglets affichés ou masqués, revendications et labels, base vide ou jeu d’exemple ; aperçu des changements avant de les appliquer, rien n’est supprimé, réponses reprises si on le relance.
- Le questionnaire crée aussi le compte administrateur quand une équipe se connecte (code de secours affiché une fois) ; il se termine par une visite guidée de l’écran — bulles qui pointent les vrais onglets et boutons (Suivant, Précédent, Passer, flèches, Échap) — relançable à tout moment par « ❓ Visite guidée » dans l’en-tête.

## 0.43.0-alpha.2 — 27/11/2026

- Vinification › Plan de vinification : le tableau se modifie directement sur la page, case par case (étapes, produits, doses, en-têtes ; ⋮ pour le type de ligne, l’étendue des doses, l’opération liée, déplacer, insérer ou retirer une ligne), sans bouton « Modifier » ; variantes du plan avec des conditions (partenaires, crus, échelle des crus, revendications, cépages, fractions, état sanitaire) : la plus précise qui correspond au lot l’emporte, sinon le plan général.
- À la création d’un lot (pressurage, marc validé, entrée de moûts), les étapes de la colonne du lot dans le plan retenu sont proposées dans l’ordre du tableau, sans jours, avec l’opération, le produit en stock et la quantité pour le volume du lot : elles deviennent des opérations à réaliser (« Étape 2 / 8 »), jamais en retard ; les schémas de vinification enregistrés deviennent des variantes du plan (sous-onglet « Schémas par lot » retiré, données d’origine gardées pour les versions antérieures).

## 0.43.0-alpha.1 — 27/11/2026

- Intrants › « ⚖ Labels & cahiers des charges » réunit « Revendications & plafonds » et « Référentiel réglementaire » : revendications et labels appliqués, SO₂ total (plafond de l’exploitation, plafond des labels et plafond retenu côte à côte), substances et composés actifs, produits par revendication, textes de référence ; chaque plafond et chaque composé est lié aux produits des catalogues (d’office d’après le mot-clé, le composé ou l’apport de SO₂, ajustable produit par produit), et un produit mis en stock depuis un catalogue reprend ces liens.
- Le référentiel « Vin Méthode Nature » (VMN, charte d’engagement du 23 mars 2023) remplace AVN : raisins bio certifiés, levures indigènes, aucun intrant œnologique, ni filtration ni technique physique brutale, SO₂ ajouté seulement au vin fini et 30 mg/L de SO₂ total au plus, sucre de prise de mousse apporté par du jus de raisin ; les revendications, lots et corrections rattachés à AVN basculent vers VMN (bascule tracée) ; le logo d’Œnotrack ramène à la page de présentation, aussi depuis l’écran de connexion.

## 0.42.0-alpha.4 — 27/11/2026

- Tirages › « 📄 Déclarations » : déclaration préalable de tirage sur le modèle du formulaire de l’AIDAC (n° EVV, code récoltant, déclarant, lieu et date du tirage, volumes prévisionnels de vin, de sucre et total à tirer calculés par le profil de tirage, rosé d’assemblage, mentions ; alerte à moins de 48 h du tirage ; PDF à établir en 3 exemplaires) et déclaration de fin de tirage et de revendication prête à reporter sur Innov OI — volumes effectivement mis en œuvre (vins, sucres et liqueurs, total tiré), VRTP affiché à part avec sa limite de 1 %, titre alcoométrique, flacons, puis lot par lot dans l’ordre de la saisie (produit, millésime, cuvée, demies, bouteilles, magnums et autres formats, revendications particulières proposées : grand ou premier cru, blanc de blancs ou de noirs, monocépage, revendication, tirage à façon ou CAF) et ventilation par revendication, échelle des crus et couleur ; export CSV et PDF.
- Déclarations : dépôt marqué avec sa référence (accusé, DREV), déclaration alors figée telle qu’elle a été envoyée, réouverture motivée (rectificative, ancienne version gardée), lots de tirage encore sans déclaration signalés ; chantier : impression de l’ordre de tirage (lots, vin, liqueur et levain, formats, point de tirage, pompe doseuse, fournitures et intrants avec leurs lots) et de la fiche d’enregistrement de la chaîne (HACCP), en A4 paysage.

## 0.42.0-alpha.3 — 27/11/2026

- Tirages › « 📦 Fournitures » : les fournitures de tirage sont les intrants de l’exploitation, sans stock en double — type d’article (bouteille, obturateur, capsule, bouchon de tirage, agrafe, adjuvant de remuage, caisses et palettes) et caractéristiques (verrier, modèle, format, teinte, bague, diamètre, matière, couleur, marquage), suivi du stock au choix pour chaque article (décompté au tirage, ou suivi par lot fournisseur sans décompte), contrôle de réception de la verrerie (échantillon selon la taille du lot, mesures, défauts visuels, non conforme à partir du nombre de défauts réglé, décision et visa — réglages à vérifier), retours au fournisseur tracés, documents (alimentarité, certificat d’analyse du lot, fiche de contrôle de réception).
- Lot de tirage : fournitures proposées d’après les formats (bouteille de chaque format, obturateur et capsule les plus en stock), quantités calculées (cols tirés + casse) ou saisies, alertes (lot refusé, verrerie non contrôlée, format absent, stock insuffisant) ; chantier : fiche d’enregistrement de la chaîne (HACCP) — démarrage de la ligne, contrôles toutes les 2 heures, fournitures de chaque lot, fin de journée, conditionnement par format et par contenant (caisses-fils, caisses-bois, palettes, gyropalettes), incidents et actions correctives, visas, écarts signalés.

## 0.42.0-alpha.2 — 27/11/2026

- Tirages › « 🍾 Tirer » : chantiers de tirage — interne ou prestataire sur site (fournisseur au rôle « Prestataire de tirage »), composition de la ligne (dépalettiseur, tireuse et ses becs, injecteuse, biduleuse, capsuleuse, marquage laser ou jet d’encre, emboxeur, robot, vision), lots tirés et bilan (cols par format, équivalent bouteilles, volume, casse, VRTP par lot), documents de prestation (ordre de fabrication, attestation de nettoyage et de désinfection, fiche de chantier signée, bon d’intervention).
- Lot de tirage : mode exclusif — mixtion en cuve (cuve de mixtion : vin, liqueur, levain et adjuvants assemblés, point de tirage de la cuvée, densités et liqueur à ajouter) ou pompe doseuse / injecteuse en ligne (consignes en % du volume converties en mL par col pour chaque format, débit, tolérance, contrôles horodatés à l’éprouvette ou par pesée, théorique comparé au réellement consommé) — jamais les deux pour un même lot ; plusieurs formats par lot (de la demie au nabuchodonosor), casse, point de tirage du lot, VRTP du lot (composition des levains et des cuves de mixtion).

## 0.42.0-alpha.1 — 27/11/2026

- Tirages › « ⚗ Préparer » : calculateur de tirage dans les deux sens — à partir d’un volume de vin de base, le volume de mixtion et l’équivalent bouteilles ; à partir des cols à tirer (plusieurs formats, de la demie au nabuchodonosor), le vin, la liqueur (sucre et vin de fonte, augmentation de volume du saccharose comprise), le levain et les adjuvants — avec le VRTP prévisionnel (volume tiré − liqueur − vin du levain et de la mixtion ; au plus 1 % des volumes mis en œuvre, cahier des charges AOC Champagne) ; fonte de liqueur de tirage (titre, sucre, vin, acide citrique, densités) ; point de tirage choisi pour chaque cuvée ; profil de tirage (levain, liqueur, étapes, propagation) réglable dans Paramètres › Calculs œnologiques (valeurs à vérifier).
- Levains de tirage : fiche par levain avec la préparation par étapes (réhydratation, acclimatation à l’alcool, 1re et 2e multiplication : levures, activateur, eau déchlorée, liqueur, vin, phosphates, températures), le plan de propagation jour par jour (levain avant tirage, prélevé, restant, alimentation en liqueur, vin, eau et phosphates) comparé au réalisé, le recalibrage quand le tirage n’avance pas au rythme prévu, et le journal des étapes, alimentations et relevés (densité, température, aérations, laboratoire, volume mesuré) ; un levain sert plusieurs tirages, avec confirmation avant d’utiliser un levain ou une liqueur d’une revendication inférieure (alerte de déclassement) ; plan du levain imprimable.

## 0.41.0-alpha.1 — 27/11/2026

- Paramètres › Vin & cuverie › « 🏷 Codification des lots » : chaque exploitation compose librement le code de ses lots à chaque stade (lot du marc, fractions, moûts reçus, entrées de vin, changement de stade, levains et pieds de cuve, assemblages, tirages, liqueurs, achats sur lattes, lots finis, habillage, mise en carton) avec des briques — texte fixe, séparateur, date (année sur 1, 2 ou 4 chiffres, mois, jour, quantième, semaine, heure, en chiffres, en code champenois C-H-A-M-P-E-N-O-I-S, en lettres ou par table), millésime(s), compteur (chiffres, lettres, lettres à rebours ou alphabet personnalisé, remis à zéro jamais, par campagne, par année, par mois, par semaine, par jour ou par combinaison de parties), donnée du lot (cépage, fraction, cru, échelle, revendication, couleur, stade, site, cuve, partenaire, n° de marc, code du fournisseur, dosage, format…), choix dans une table faite à la saisie (marque, cuvée, bouchon, étui…) et reprise de tout ou partie du code de l’étape précédente — avec conditions, largeur fixe et aperçu en direct sur un lot réel.
- Codification : chaque règle vaut à partir de sa date d’effet (une version qui a servi ne se modifie plus : on en crée une nouvelle) ; aucun lot existant n’est jamais renommé ; sans règle, le code d’Œnotrack reste inchangé. À la saisie, l’encadré « 🏷 Code du lot » propose le code (choix repris de l’étape précédente), toujours modifiable ; un changement de code garde l’ancien, cherchable en traçabilité ; tables de correspondance libres ; export et import d’une codification complète (fichier JSON).
- Dégorgement › « Habillage & mise en carton » : habillage d’un lot fini (plusieurs possibles), réétiquetage d’un lot habillé (nouveau lot lié, le précédent intact) et mise en carton / expédition (cartons, destinataire, référence), chacun avec son code ; entrée de vin : code du lot chez le fournisseur gardé à part.

## 0.40.0-alpha.2 — 27/11/2026

- Bulletins d’analyses : un rapport à plusieurs échantillons dont les paramètres sont répartis sur plusieurs tableaux (la suite des paramètres sous le premier tableau, ou sur les pages suivantes) est lu en entier — chaque tableau avec son propre en-tête, et les résultats d’un même échantillon réunis d’après son n° de laboratoire (deux n° différents restent deux échantillons, même avec la même référence).
- Bulletins d’analyses : nouveaux paramètres reconnus — azote ammoniacal, azote alpha-aminé et chaptalisation calculée par le laboratoire (kg/hL) ; valeurs suivies d’un renvoi à une note du laboratoire (« 6,9/ (**) ») lues.

## 0.40.0-alpha.1 — 27/11/2026

- Intrants › « ⚖ Référentiel réglementaire » : base préétablie des intrants et composés actifs (SO₂, acide sorbique et sorbate, sels de cuivre, acide métatartrique, gomme arabique, CMC, polyaspartate, lysozyme, chitosane, PVPP, charbon, DMDC, acides, colles, levures, nutriments…) pour la réglementation de l’UE, l’AOC Champagne (selon le vignoble du profil régional) et les labels Bio UE, Demeter, Biodyvin, Terra Vitis, Nature & Progrès, AVN et Vins S.A.I.N.S. : autorisé, interdit ou sous condition, dose maximale, teneur maximale dans le vin, plafonds de SO₂ total, avec le texte et l’article de chaque valeur, relue dans les textes officiels en vigueur (« ✓ vérifié », sinon « à vérifier »), corrigeable par l’exploitation (tracé) ; enrichissement maximal des régions aligné sur les zones viticoles de l’UE (Bourgogne : 1,5 % vol).
- « Produits & règles par revendication » et « Revendications & plafonds » liés : une même règle effective (règle du produit, règles de substance du cahier des charges, avis du référentiel — la plus restrictive l’emporte) dans les deux vues, avec les produits réellement enregistrés, les écarts signalés et « Aligner sur le référentiel » ; chaque revendication choisit ses labels.
- Fiche du produit : composés actifs reconnus d’après le nom et la composition (ex. « Citrate de cuivre 2 % »), teneur modifiable ; les doses cumulées par lot sont converties en teneurs dans le vin (acide sorbique, cuivre, acide métatartrique, CMC…).
- Alerte à la saisie : un intrant refusé par un label du lot, une dose ou une teneur maximale franchie pour l’une des revendications visées demande un motif avant validation (tracé avec l’opération) ; labels visés par lot en plus de sa revendication.
- Alerte persistante sur le lot (fiche du lot et du lot fini) et dans Traçabilité › « ⚖ Conformité réglementaire » : intrant non conforme, dose cumulée, teneur ou SO₂ total au-delà du plafond, recalculés quand la revendication change (déclassement, passage en Bio, Demeter, S.A.I.N.S.…).
- Catalogues : liste Ecocert des intrants utilisables en œnologie biologique (plus de 1 700 produits, règlement (UE) 2018/848) — mention « liste Ecocert » et restrictions d’emploi sur les produits des catalogues, et catalogue « Ecocert » des autres fournisseurs (Lallemand, Agrovin, Lamothe-Abiet, Erbslöh, Enartis…), à afficher dans Intrants › Catalogues ; page du produit, fiche technique et FDS en ligne relevées sur les sites Laffort, Martin Vialatte et Oenofrance, préremplies à l’ajout dans vos produits.

## 0.39.0-alpha.1 — 26/11/2026

- Paramètres réorganisés en quatre rubriques — Exploitation, Vin & cuverie, Équipe & sécurité, Données & application — dans un menu latéral (rangées sur téléphone) ; les calculs œnologiques (tirage, enrichissement, fermentation) ont leur page « 🧪 Calculs œnologiques », la charte et le mode d’affichage la page « 🖥 Affichage & application ».
- Réglages métier rangés dans l’onglet Vinification : le catalogue des opérations dans Opérations & Assemblages (« ⚙ Catalogue des opérations »), les barèmes de jaugeage dans Cuverie & Lots, les schémas de vinification dans le Plan de vinification ; les liens de Paramètres y mènent, et le réglage reste dans Paramètres si le module est désactivé.
- Clés d’accès rattachées à un seul compte : l’appareil confirme le compte à chaque connexion ; l’administrateur gère les appareils utilisateur par utilisateur — accepter, retirer l’accès (l’appareil reste listé), rétablir, supprimer, dernière utilisation —, décide qui peut enregistrer ses propres appareils et peut enregistrer cet appareil pour un autre compte.
- Préparations et mixtions se saisissent dans l’onglet Tirages, le remuage dans la Cave, le dégorgement dans l’onglet Dégorgement ; « Opérations & Assemblages » reste dédié à la vinification en cuve ou en fût et garde le journal complet. Vins de base affichés en cave et au dégorgement, suite de chaque tirage (bouteilles en cave, dégorgées).
- Plan de vinification (Vinification › Plan de vinification) : instruction de travail de la cave — étapes, produits et doses par groupe de cépages, revendication et fraction — à modifier, vérifier, imprimer en A4 paysage, ou à importer depuis votre tableur (Excel, LibreOffice, CSV) ; « Appliquer à un lot » donne la colonne du lot et les quantités pour son volume.

## 0.38.0-alpha.3 — 26/11/2026

- Un seul onglet actif à la fois : un second onglet d’Œnotrack affiche « Œnotrack est déjà ouvert dans un autre onglet » et n’enregistre rien ; « Reprendre la main ici » bloque l’autre onglet (ses enregistrements se terminent) et recharge celui-ci avec la base à jour — deux onglets ne s’effacent plus leurs saisies.
- Dégorgement : le SO₂ de la liqueur d’expédition est imputé au lot fini dégorgé (SO₂ du lot de tirage à cette date + apport de la liqueur sur le volume dégorgé), plus au lot de tirage entier — des dégorgements partiels ne cumulent plus de faux dépassements de plafond ; SO₂ total estimé affiché dans la fiche du lot fini.
- Pressoir : rôle explicite de chaque fraction (Cuvée, Taille, Rebêche, Autre) dans Paramètres, proposé d’après le nom et modifiable ; une fraction ajoutée compte maintenant dans les marcs, les plafonds et les rendements.
- Sûreté des données : une base chiffrée réécrite par une version antérieure est de nouveau reconnue ; une base illisible n’est plus remplacée par l’exemple ; une synchronisation en cours ne relance plus l’envoi après une restauration ; les versions écartées par une fusion sont toutes gardées au journal des conflits ; « Repartir » n’efface plus rien si la copie de côté échoue ; fermeture de l’onglet pendant un enregistrement chiffré : confirmation demandée.
- Corrections : teneurs en SO₂ en « mg/mL » ou « g/KG » ; filtration avec pertes totales (cuve vide) ; régularisation par comptage avec un motif de sortie ; mouvements de produits de maintenance du même jour ; arrivage avec régularisations protégé ; « 1 234 » lu 1 234 ; acidité totale déjà en H₂SO₄ ; CSV d’Excel (Windows-1252, UTF-16) ; n° de bulletin ; caractères interdits retirés du XML de la DRM ; fichiers trop gros refusés avant lecture ; défilement bloqué après la fermeture de plusieurs fiches ; bouton « Identifier avec l’IA » affiché « en cours » pendant le complément automatique des fiches FT / FDS.
- Fluidité et poids : aperçu du formulaire d’opération recalculé après la frappe, notes d’audit et couleurs enregistrées après une pause, listes et cartes de cuves mémorisées, PDF libérés après lecture ; page allégée d’environ 70 Ko et installation hors ligne d’environ 1,4 Mo (polices des autres chartes mises en cache à leur premier usage).

## 0.38.0-alpha.2 — 26/11/2026

- Clés d’accès : « ＋ Activer sur cet appareil » demande maintenant l’empreinte, le visage ou le code PIN intégrés au téléphone ou à l’ordinateur (Android, iPhone et iPad, Windows Hello, Mac, Linux avec le Gestionnaire de mots de passe) au lieu de ne proposer que des clés USB / NFC ou un autre appareil ; « ＋ Clé de sécurité ou autre téléphone » garde les clés externes au choix
- Connexion et déverrouillage par clé d’accès : l’appareil propose d’abord son propre déverrouillage (moyens retenus à l’enregistrement) ; clé publique lue aussi sur les navigateurs plus anciens ; iPad reconnu comme tel

## 0.38.0-alpha.1 — 26/11/2026

- Impression : les couleurs des fiches d’opération à remplir (cases « relevé », en-têtes, bandeaux, lignes alternées) et des rapports sont imprimées telles qu’à l’écran, même quand « Graphiques d’arrière-plan » est décoché, et dans les fichiers HTML enregistrés
- Étiquettes QR des cuves : en plus de la planche A4 de 24 étiquettes et de la grande étiquette A6, une planche A4 personnalisée — colonnes × lignes, largeur × hauteur, marges et espacements en millimètres, modèles courants à vérifier et contour d’alignement
- Assistant IA de l’espace de travail : l’administrateur règle un service, un modèle et une clé API communs (clé chiffrée avec la clé de l’équipe, jamais en clair dans la base ni sur le Drive) et accorde ou retire aux autres utilisateurs le droit d’utiliser leurs propres clés et modèles
- Sécurité sans serveur : la base, les documents, les points de restauration et les secrets (clés d’API, clé de l’équipe, connexions aux services) sont chiffrés dans le navigateur par le coffre de l’appareil, avec en option un mot de passe demandé à l’ouverture ; les données déjà enregistrées sont chiffrées d’office à la première ouverture
- Bibliothèques : Œnotrack en ligne embarque React, SheetJS, pdf-lib, PDF.js, Tesseract et ses polices (plus aucun CDN au chargement) avec une politique de sécurité du contenu stricte ; le fichier seul vérifie l’empreinte de chaque bibliothèque avant de l’exécuter ; Tailwind est précompilé

## 0.37.0-alpha.1 — 26/11/2026

- Entrée de moûts : un bulletin d’analyses (PDF, scan, tableur ou CSV) se glisse directement dans l’opération ou dans l’onglet d’un partenaire ; chaque échantillon d’un bulletin à plusieurs échantillons est reporté sur son moût (n° de lot, compartiment, mêmes nombres), avec une affectation guidée en cas de doute
- Onglet Analyses : lecture des rapports d’analyses à plusieurs échantillons (n° d’échantillon du laboratoire et référence du client, en-têtes de colonnes sur plusieurs lignes, valeurs suivies de leur incertitude) et des exports de laboratoire en tableur à une ligne par résultat ; l’IA distingue aussi chaque échantillon
- Tables d’épalement : les pages d’une même cuve lues séparément sont réunies en une seule table (hauteurs à la suite, même certificat, volumes dans le prolongement) ; deux tables peuvent aussi être fusionnées à la main, à l’import ou depuis la fiche du barème (Paramètres › 📏 Barèmes de jaugeage), l’autre étant archivée

## 0.36.0-alpha.1 — 26/11/2026

- Intrants › Stocks & arrivages : régularisation manuelle du stock d’un lot fournisseur — inventaire (quantité comptée), casse, perte, péremption, écart, échantillon, retour, avec motif et notes — tracée dans le nouvel historique des mouvements (réceptions, utilisations, régularisations, solde)
- Fiche des produits œnologiques : allergènes à cocher (œuf, lait, gluten, sulfites, enzymes, poisson…) et choix Oui / Non par revendication (bio, Demeter, revendications personnalisées), le même que dans « Produits & règles par revendication » ; repérés d’office dans les FT et FDS déposées, à vérifier
- Fiches récapitulatives des produits œnologiques et des produits de maintenance : colonnes au choix (fournisseur, stock actuel, revendications compatibles, allergènes…), à imprimer ou à télécharger en PDF, HTML ou CSV
- Équipements › Maintenance › Produits de maintenance : catalogue avec fournisseur, usage, agrément contact alimentaire, utilisation en cave de vinification, composition et champs personnalisés ; suivi du stock activable par produit (entrées, sorties, régularisations) ; FT, FDS et attestations jointes

## 0.35.0-alpha.1 — 26/11/2026

- Entrée de moûts : plusieurs partenaires dans une même citerne — en-tête commun (date, immatriculation, millésime par défaut), puis un onglet par partenaire avec son n° de bon / DAE et ses moûts (Moût 1, Moût 2…) ; ajout et retrait d’onglets ; les lots créés en cuve, les registres, la fiche de réception et la traçabilité reprennent le partenaire et le n° de bon de chaque moût
- Documents et bulletins d’analyses par partenaire : chaque onglet a ses documents joints, et un bulletin d’analyses déposé dans l’onglet est lu et reporté sur les moûts de ce partenaire (n° de lot, compartiment, sinon dans l’ordre), puis joint à l’onglet
- Analyses des lots reçus : le modèle « Moût · Débourbage » est imposé (plus de liste à choisir) et ses champs sont affichés directement pour chaque moût ; les analyses déjà saisies avec un autre modèle sont gardées
- Volume en centimètres : quand la cuve de destination a une table d’épalement, la hauteur (ou le creux) mesurée après réception calcule le volume reçu (contenu mesuré moins le contenu d’avant, y compris les moûts déjà versés dans la même entrée) ; le volume reste modifiable à la main et la mesure est gardée avec l’opération
- Compatibilité : une entrée à un seul partenaire est enregistrée comme avant ; les versions antérieures ouvrent et modifient les entrées à plusieurs partenaires sans rien perdre (partenaire et n° de bon écrits dans chaque moût, onglets retrouvés ensuite)

## 0.34.0-alpha.1 — 26/11/2026

- Onglet « Vinification » : Cuverie & Lots, Opérations & Assemblages et À réaliser & fiches réunis en sous-onglets d’un seul onglet ; le dernier sous-onglet ouvert est retrouvé ; activation, droits et ordre de chaque module inchangés.
- Onglet ouvert à la connexion et au déverrouillage : le premier onglet de la barre, ou celui choisi dans Paramètres › Modules (indépendant de l’ordre des onglets) — plus « Société & opérateurs » ; un déverrouillage garde la page en cours.
- Campagne antérieure : créée avant les campagnes existantes, elle démarre complètement vide (aucun lot ni volume en cuve) ; les campagnes suivantes ne changent pas.
- Dossier réseau de l’entreprise (Paramètres › Sauvegarde & Drive) : synchronisation sur un serveur interne, un NAS ou un lecteur réseau, sans cloud externe ; chemin commun à tous les postes, écritures protégées par un jeton, saisies de plusieurs postes réunies.

## 0.33.0-alpha.1 — 26/11/2026

- Région et types de vins (Paramètres › 🍇 Région & types de vins) : 12 bassins viticoles français et 8 pays, types de vins produits (tranquilles blancs, rosés, rouges, effervescents, méthode ancestrale, moelleux et liquoreux) ; raccourcis : Champagne, Crémant + vins tranquilles, vins tranquilles, vins rouges
- Aperçu à cocher avant d’appliquer : onglets Tirages, Cave et Dégorgement selon les effervescents, opérations des rouges et des rosés (macération, délestage, écoulage, saignée), stade « En macération », cépages et appellations de la région, fractions goutte et presse, profil de pressurage, spécificités champenoises, échelle de classement, enrichissement maximal (exemple à vérifier)
- Personnalisations jamais écrasées : rien n’est supprimé ni renommé, les réglages faits à la main restent ; nouvelle liste « Appellations » (Paramètres › Revendications, stades & listes), proposée pour le libellé des produits de la DRM

## 0.32.0-alpha.1 — 26/11/2026

- DRM (Registres › 📮 DRM) : déclaration récapitulative des entrées et sorties de vins, mensuelle (DRM) ou annuelle (DRA) au choix, calculée d’après les opérations — stocks de début et de fin (vrac, bouteilles sur lattes, bouteilles finies), récolte, achats, transferts entre produits au tirage et à l’assemblage, pertes, sorties — avec ses contrôles (n° d’accise, codes, stock négatif, écarts, continuité avec la DRM déposée précédente)
- Trois moyens : fichier XML DTI+ à importer dans CIEL (format de la douane, vérifié avec son schéma), le même fichier avec vos codes produits CIVC pour la plateforme du CIVC, impression et CSV ; pas de compte CRD ; « ✓ Marquer comme déposée » fige les chiffres
- Bouteilles finies : les bouteilles dégorgées restent dans le stock de la DRM jusqu’à leur sortie, saisie à chaque DRM (ventes France sous CRD, export et UE, dégustation, autres sorties, entrées)
- Produits de la DRM pré-remplis selon la région (Champagne : vins tranquilles, vins mousseux, rebêches, lies et bourbes, Coteaux champenois, Rosé des Riceys), « à vérifier » : libellé de votre compte CIEL, code INAO ou libellé fiscal, code CIVC ; lots rattachés automatiquement (nature, fractions) ou à la main
- Registre d’enrichissement (Registres) : les enrichissements enregistrés, avec le titre avant et le titre visé, la méthode, les produits et quantités

## 0.31.0-alpha.1 — 26/11/2026

- Schémas de vinification (Paramètres › Schémas de vinification) : suites d’étapes types — jour après la création du lot, opération, famille de produit, dose par hL de produit ou de SO₂ apporté, consigne — choisies selon le cépage majoritaire, la fraction et l’état sanitaire des raisins ; quatre exemples non officiels « à vérifier » (cuvée de Chardonnay, cuvée de noirs avec FML, tailles, raisins altérés), à dupliquer et adapter
- Proposés à la création d’un lot (marc validé au pressoir ou depuis le carnet, entrée de moûts) : le schéma le plus proche est présélectionné, avec les produits en stock et les quantités calculées sur le volume du lot ; « ✓ Créer les opérations à réaliser » les ajoute en un clic à « À réaliser », où chacune se valide avec les quantités réelles
- Fiche du lot : rubrique « Schéma de vinification » (étapes prévues et validées, impression, retrait des étapes à réaliser) ; « 📋 Appliquer un schéma… » pour un lot déjà créé ; pastille « 📋 schéma » dans « À réaliser » et dans le journal
- Impressions au choix : logigramme vertical, frise ou tableau — pour un schéma, les opérations prévues d’un lot (dates, quantités, colonne visa), le plan de nettoyage et de désinfection (frise par moment de l’année) et le plan de maintenance (frise des échéances sur douze mois) ; la forme choisie est gardée pour la prochaine impression

## 0.30.0-alpha.1 — 26/11/2026

- Catalogues de produits œnologiques préinstallés : Laffort, IOC et Sofralab (Oenofrance, SOEC, Martin Vialatte) — 906 produits, avec leur famille, la dose conseillée, les conditionnements, les mentions bio et vegan et leur source (catalogue, page) ; à vérifier sur la fiche technique avant usage
- Intrants › Catalogues : masquer un fournisseur ou une marque, rechercher (fournisseur, famille, bio), ajouter un produit à vos produits ; importer un autre catalogue (tableur, PDF lu par le script ou par l’assistant IA) dont les lignes restent « à vérifier » jusqu’à leur validation
- Saisie d’un intrant : le fournisseur (ou « En stock ») se choisit à chaque ligne, puis ses produits, y compris ceux de ses catalogues ; « ＋ Réception… » enregistre le lot fournisseur sans quitter l’opération
- Doses cumulées par lot : dose de chaque produit par hL du lot, héritée des lots d’origine au prorata des volumes (assemblages, tirage, liqueurs) ; affichées sur les fiches de lot et de cuve, contrôlées à chaque ajout
- SO₂ total estimé = dernière analyse + ajouts depuis (produits dont la teneur en SO₂ est connue : « 150 g/L », « 0,5 g/g »…), comparé au plafond de la revendication
- Intrants › Revendications & plafonds : plafonds de SO₂ total d’exemple (UE, bio, Demeter) « à vérifier », règles de substances (interdiction, dose maximale) ; import d’un cahier des charges (PDF ou texte, script ou assistant IA) dont chaque limite est relue avant d’être appliquée
- Dépassement d’un plafond (dose, dose cumulée, SO₂ total estimé) : jamais bloqué, mais l’opération exige un motif, tracé avec elle (journal, registre des intrants) ; aussi en saisie groupée
- Règles d’exemple venues des catalogues marquées « à vérifier » dans « Produits & règles par revendication », avec « ✓ Vérifiée »
- Onglet Intrants & Stocks traduit dans les six langues (stocks et arrivages, produits et règles, fournisseurs), avec les messages des lignes d’intrants

## 0.29.0-alpha.1 — 26/11/2026

- Fiches de cuve et de lot personnalisables (« ⚙ Personnaliser la fiche ») : rubriques affichées ou masquées et leur ordre, réglage commun à l’équipe et ajustement de chacun (sur son compte, ou sur l’appareil) ; le stade du vin s’affiche sur la fiche de la cuve
- Doses dans l’unité du produit (g/hL, mL/hL, kg/hL ou L/hL au-delà de 1 000) dans l’historique des opérations, les ajouts d’intrants et les récapitulatifs (doses de chaque ajout et leur total)
- Saisie groupée : « ☑ Sélection multiple » sur le plan, les cartes ou la liste des cuves, puis sulfitage, levurage, collage, autre intrant, relevé densité / température ou changement de stade en une fois — une opération par cuve, quantité = dose × volume de chaque cuve, mêmes contrôles qu’une saisie seule ; groupe corrigé, annulé ou imprimé ensemble ; planifiable puis validé en groupe
- Fiches multi-lignes : « 🖨 Fiche du jour… » (À réaliser & fiches) réunit les opérations d’un même type prévues (et validées) ce jour-là, une ligne par cuve, prévu en gris et relevé en cases teintées, colonne visa ; la fiche individuelle reste disponible
- Fermentation : courbes densité et température sur les fiches de cuve et de lot, vitesse de baisse de la densité, alerte « fermentation lente » ou « arrêtée » (seuils réglables dans Paramètres › Données & paramètres), signalée aussi sur les cartes des cuves
- « 🧪 Calculs » sur les fiches : SO₂ moléculaire (SO₂ libre, pH, température, alcool) et SO₂ libre nécessaire pour un objectif ; simulateur d’enrichissement au sucre ou au MCR (quantité, volume final, plafond indicatif) qui prépare l’opération d’enrichissement
- Étiquettes QR des cuves (planche A4 de 24 étiquettes 70 × 37 mm ou grande étiquette A6) : l’adresse d’Œnotrack en ligne et l’identifiant de la cuve seulement ; l’appareil photo du téléphone ouvre directement la fiche ; « 📷 Scanner » dans la cuverie
- Chiffrement (Paramètres › Sauvegarde & Drive) : un mot de passe commun à l’équipe chiffre les sauvegardes, le fichier du Drive, ses copies et documents, et la synchronisation par fichier (AES-256, clé dérivée par PBKDF2, jamais enregistrée dans la base) ; les versions antérieures refusent un Drive chiffré sans rien écraser
- Rappel de sauvegarde : quand les données ne sont que dans ce navigateur (pas de Drive) et qu’aucune sauvegarde n’est récente, un bandeau propose « ⬇ Sauvegarder maintenant »
- Page plus légère (2,8 Mo au lieu de 6,5 Mo) : code compacté, code source publié à part (code-source.zip, GitHub), module Excel chargé seulement à la première utilisation ; compilation réglable (--dev, --source, --sortie)

## 0.28.0-alpha.1 — 22/11/2026

- Impression : « 🖨 Imprimer » ouvre maintenant la boîte d’impression de l’appareil (Windows, Mac, Linux, Android, iPhone et iPad) et n’imprime que le document ; « ⬇ PDF » enregistre le PDF en parallèle. Là où l’impression directe est impossible (aperçu dans claude.ai), le PDF prend le relais.
- Connexion simplifiée : sur un appareil accepté, connexion et déverrouillage par empreinte, visage ou code PIN (Windows Hello, Touch ID et Face ID, Android ; sous Linux : clé de sécurité, téléphone ou code PIN du navigateur) grâce aux clés d’accès. Chacun active ses appareils depuis son compte ; un administrateur les accepte (Paramètres › Utilisateurs & droits). Le mot de passe reste possible.
- Nouvel onglet Équipements : parc de matériel avec une fiche par équipement (catégorie, marque, modèle, n° de série, site, état, garantie, vos informations, documents), maintenance (plan et interventions, déplacés depuis l’Hygiène), pannes, vérifications périodiques (bascules, balances, instruments, extincteurs) et tâches à faire ; catégories, types et résultats d’intervention personnalisables.
- Traçabilité › Toutes les étapes : une seule recherche (n° de pesée ou de marc, lot, lot fini, cuve, apporteur, cru, lieu-dit, DAE, lot d’un produit, date) puis la chaîne complète, des pesées aux expéditions, en amont et en aval de ce qui est choisi ; imprimable.
- Traçabilité › Mode audit : types d’audit fournis et personnalisables (agriculture biologique, Demeter, douanes, hygiène HACCP, appellation) ou créés par vous ; pendant la visite, chaque pièce attendue (registres, bilan matière, stocks, SO₂, durée sur lattes, test de traçabilité chronométré…) est présentée chapitre par chapitre, les points de contrôle sont notés et le dossier s’imprime.

## 0.27.0-alpha.2 — 21/11/2026

- Pressoir : le cru et son échelle (Grand Cru, 1er Cru, Autre cru) s’affichent à la pesée, au registre et sur les bons ; le « ticket » devient un bon de pesée (livraison, relevés de qualité, cumul de la campagne de l’apporteur par cépage et par échelle) et chaque marc a son bon de pressoir (raisins chargés et leur origine, moûts obtenus et leurs cuves, rendement, contrôles). Identifiants officiels (CVI, accise…) de la société et des partenaires imprimés sur les bons.
- Opérations & Assemblages : « Pesée de vendange » n’y est plus proposée, même onglet Pressoir masqué (les pesées se font dans l’onglet Pressoir) ; les déclassements y deviennent un sous-onglet (le module reste activable dans Paramètres › Modules).
- Hygiène › Listes : toutes les listes de l’hygiène se personnalisent — contrôles après rinçage (avec le résultat attendu), zones, dangers, natures, formes et unités des produits, protections individuelles, moments du plan, types et résultats de maintenance ; un moyen de contrôle s’ajoute aussi directement depuis le journal.
- Écran de connexion : logo de la société centré sous l’en-tête, choix de la langue toujours visible.

## 0.27.0-alpha.1 — 21/11/2026

- Protection des importations : chaque fichier qui entre dans Œnotrack (documents, fiches FT et FDS, barèmes, bulletins, logo, sauvegardes, Drive, traçabilité) est vérifié en arrière-plan — type réel lu dans le contenu (programmes, scripts, pages web et archives refusés même renommés), PDF à contenu actif désarmés (JavaScript, actions automatiques, fichiers incorporés retirés), documents Office avec macros refusés, données nettoyées des clés piégées ; journal de sécurité et points de restauration dans Paramètres › 🛡 Sécurité des importations.
- Documents : aperçu selon le type réel du fichier (une page web jointe n’est jamais exécutée, un texte s’affiche comme texte) ; documents déjà joints vérifiés une fois en arrière-plan, les suspects signalés ; exports CSV sans formule exécutée à l’ouverture dans un tableur.
- Analyses : import des bulletins d’analyses (PDF, scan, photo, tableur, CSV) — paramètres, valeurs et unités reconnus (acidités converties en g/L H₂SO₄), échantillons rattachés aux lots et aux cuves cités, date de prélèvement ; l’IA complète la lecture si elle est configurée ; vérification avant d’enregistrer, nouveaux paramètres proposés, bulletin joint aux analyses.
- Expéditions : sur une sortie vers un partenaire, « 📤 » prépare un fichier de traçabilité du moût ou du vin ; vous choisissez ce que vous partagez (composition, crus, apporteurs, parcelles, intrants, analyses, historique…), une empreinte garantit qu’il n’a pas été modifié.
- Réceptions : dans l’entrée de moût ou de vin, le fichier de traçabilité de l’expéditeur préremplit le formulaire (partenaire, désignation, millésime, revendication, cépages, crus, n° de lot, analyses, volume) (un expéditeur inconnu se crée en partenaire d’un clic) et la traçabilité d’avant la réception est gardée : journal (📥), fiche des lots qui en descendent, et transmise à votre tour si vous réexpédiez.

## 0.26.0-alpha.2 — 21/11/2026

- Opérations : « Pesée de vendange » et « Pressurage » ne sont plus proposés dans l’onglet Opérations quand l’onglet Pressoir est actif (ils y faisaient double emploi) ; un lien « Pesées et pressurages : onglet Pressoir » y mène. Le journal des opérations garde l’historique des pesées et des marcs, et « Modifier » ouvre le formulaire du Pressoir.
- Pressoir › Pressurages (ancien sous-onglet « Carnet de pressoir ») : « + Nouveau pressurage » charge un marc en choisissant les pesées pressées et les cuves des moûts ; sur chaque pesée du registre, « Presser » ouvre le pressurage avec la pesée déjà chargée (son n°, le poids restant à presser, le cépage et la désignation du marc proposés).
- Onglet Pressoir désactivé (Paramètres › Modules) : les opérations « Pesée de vendange » et « Pressurage » restent proposées dans l’onglet Opérations, comme avant.

## 0.26.0-alpha.1 — 21/11/2026

- Hygiène › Plan de nettoyage : plan de nettoyage et de désinfection (méthode HACCP) d’après un modèle à adapter à votre exploitation : ce qui se nettoie (cuves, pressoir, locaux et matériel), quand (après une vidange, avant un remplissage, au changement de revendication, chaque soir de vendange…), avec quels produits, comment, le contrôle après rinçage (visuel, papier pH, papier peroxyde) et le responsable. Imprimable pour le classeur qualité.
- Hygiène › À faire : tâches et alertes tirées du plan et des opérations enregistrées : cuve vidée sans rinçage, remplissage sans rinçage récent, changement de revendication (Conventionnel → Bio…) sans nettoyage, nettoyages périodiques et de vendanges ; une non-conformité se justifie. Après une opération qui vide une cuve, le rinçage est proposé tout de suite, et les formulaires d’opération préviennent avant d’enregistrer.
- Hygiène › Maintenance : plan de maintenance du matériel (préventive, réglementaire, curative) avec ses échéances, les vérifications avant vendanges, les pannes signalées jusqu’à leur réparation et l’historique des interventions (documents joints) ; imprimable.
- Photo : sur téléphone et tablette, « 📷 Photo » à côté des zones de dépôt de documents photographie directement une FT, une FDS, un bon ou une fiche remplie ; le choix de fichiers reste possible.
- Fiches produits : chaque FT, FDS ou certificat déposé sur un intrant ou un produit d’hygiène est lu et ses informations sont proposées en complément de la fiche (fabricant, composition, dose et mode d’emploi, stockage, conservation, allergènes, utilisation en bio) ; avec un assistant IA configuré, l’IA complète ce que la lecture automatique n’a pas trouvé.
- Nouveaux produits : le nom est harmonisé à la création (FRESH → Fresh) ; sigles, abréviations et codes restent en majuscules (PROVINHY OX2 → Provinhy OX2, NUTRIEFF AA FRESH → Nutrieff AA Fresh).

## 0.25.0-alpha.2 — 20/11/2026

- Pesée : la pourriture acide et vos relevés de pourriture (pourriture grise…) n’apparaissent que si l’état sanitaire n’est pas « Sain » ; réglable champ par champ dans le formulaire de pesée (« Seulement si l’état sanitaire n’est pas « Sain » »). Une pesée « Sain » ne garde pas ces relevés.
- Opérations reliées au Pressoir : « Pesée de vendange » (anciennement « Apport vendange ») et « Pressurage » ouvrent directement la pesée du registre et le marc du carnet de pressoir (pesées choisies par leur n°) ; le journal affiche les n° de pesée et de marc. Le carnet de pressoir propose aussi la couleur des moûts et les champs personnalisés du pressurage.
- En haut de l’écran, « 💻 Sur cet appareil seulement » remplace « ✓ Enregistrement auto · 100 % local » : sans synchronisation, vos données ne sont que dans ce navigateur ; avec le Drive ou la sauvegarde en ligne, leur pastille indique où elles vont.

## 0.25.0-alpha.1 — 20/11/2026

- Formulaire de pesée personnalisable (Pressoir › Nouvelle pesée › « ⚙ Personnaliser ce formulaire », ou Pressoir › Réglages › Formulaire de pesée) : chaque champ affiché, replié ou masqué, rendu obligatoire, renommé, avec son aide et sa valeur proposée (état sanitaire, balance…), et vos propres relevés (pourriture grise, acidité, température des raisins…), repris sur le ticket, dans le registre exporté et le journal. Les mentions obligatoires du registre et du ticket de pesée (date et heure, poids, cépage, apporteur, revendication particulière) restent toujours affichées.
- Pourriture acide (%) et TAP (titre alcoométrique probable, % vol.) relevés à la réception : sur le ticket de pesée, dans le registre des pesées, le bilan (TAP moyen pondéré par le poids, pourriture acide moyenne), les relevés par apporteur et le carnet de pressoir (TAP moyen des pesées chargées) ; alerte quand le TAP est sous le minimum de richesse en sucre (143 g/L, soit 8,5 % vol. en Champagne). Corriger ces relevés sur une pesée validée ne demande pas de motif : ils ne font pas partie des mentions du registre.
- Correction : effacer un champ facultatif (caisses, heure de cueillette…) d’une pesée déjà enregistrée est désormais pris en compte.

## 0.24.0-alpha.2 — 20/11/2026

- Langues, deuxième étape : onglets Cuverie & Lots et Opérations & Assemblages, fiches du contenant et du lot, menu des contenants, déclassements et tous les formulaires d’opération traduits dans les six langues, avec le catalogue des opérations, les stades, les couleurs, les listes fournies d’origine, les opérateurs et les documents joints ; derniers textes du Pressoir complétés.
- Les phrases qui mêlent texte et valeurs sont traduites d’un seul tenant ; ce que vous avez saisi (noms des cuves, désignations, produits, libellés personnalisés) n’est jamais traduit.
- Plan de cave : le réglage « Motif » s’appelle désormais « Motif intérieur ».

## 0.24.0-alpha.1 — 20/11/2026

- Onglet Pressoir : registre des pesées (n° continu par année, date et heure, poids brut, tare et net, caisses, état sanitaire, apporteur, cru, mention ou lieu-dit, bascule), ticket de pesée à remettre à l’apporteur ; carnet de pressoir rempli au fur et à mesure (marc chargé à son début, puis volumes de cuvée, tailles et rebêches, TAV en puissance, bourbes), validation, corrections avec motif et annulations gardées dans un journal à empreintes ; relevés par apporteur, bilan de campagne et exports CSV.
- Contrôles de l’AOC Champagne (cahier des charges homologué le 31 juillet 2025) : 102 litres de moûts débourbés pour 160 kg (bloquant, réglable si un arrêté le réduit), taux minimum de rebêches de l’année, 6 marcs au plus par 24 heures et par pressoir, chargement à la capacité agréée, bourbes de 1 à 4 %, dates limites d’envoi des rebêches et d’élimination des bourbes, vignette de la bascule ; usages cuvée et taille en simple alerte.
- Les pesées enregistrées au pressoir sont directement proposées dans les opérations de pressurage (et inversement), avec leur n° de pesée et le poids restant à presser ; un marc validé crée les lots de cuvée, de tailles et de rebêches dans les cuves.
- Région viticole (Paramètres › Société, ou Pressoir › Réglages) : « Champagne » ou « Autre région viticole » — hors Champagne, les règles champenoises sont désactivées (profils de pressurage crémant ou sans plafond, registre facultatif) et les villages de l’échelle des crus peuvent être masqués.
- Choix de la langue (français, English, Español, Italiano, Deutsch, Português) sur la page d’accueil, l’écran de connexion et dans Paramètres, proposé d’après la langue du navigateur ; traduction de l’interface par étapes.
- README au format GitHub (à la place du LISEZ-MOI) et journal des nouveautés CHANGELOG ; code source prêt pour le dépôt GitHub du projet (github.com/r0waiu/Oenotrack), lien dans « Code source & licence ».

## 0.23.0-alpha.1 — 19/11/2026

- Page d’accueil : présentation d’Œnotrack (ce qu’il fait, comment il fonctionne, ce qu’il fait de vos données, liens vers les informations légales), affichée seulement à la toute première ouverture sur un appareil, jusqu’au clic sur « Ouvrir Œnotrack » ; jamais pour qui utilisait déjà Œnotrack sur cet appareil ; à revoir quand on veut depuis le lien « Présentation » en bas de l’écran
- Site officiel : oenotrack.fr ; sa page d’accueil et sa politique de confidentialité (…/#confidentialite) servent de pages publiques pour les écrans de connexion Google, Microsoft et Dropbox
- Confidentialité : ce qu’Œnotrack fait de l’accès à votre Google Drive, OneDrive ou Dropbox (nom du compte, liste des dossiers, ses propres fichiers dans le dossier choisi seulement), comment le retirer, respect de la politique de Google sur les données des utilisateurs

## 0.22.0-alpha.2 — 19/11/2026

- Numérotation des versions X.Y.Z-étiquette.N : X majeure (refonte profonde, rupture de compatibilité), Y mineure (nouvelle fonctionnalité, amélioration notable), Z correctif (correction d’une version finale) ; étiquette alpha (développement, test interne), beta (test par les utilisateurs) ou rc (candidate à la production), retirée à la version finale ; N : nouvelle itération de la même version
- Tout l’historique est renuméroté selon ces règles, de 0.1.0-alpha.1 (première version) à 0.22.0-alpha.1 (barème importé à la création d’un contenant) ; les bases, sauvegardes et fichiers existants affichent le nouveau numéro de la version qui les a créés, sans que leurs données changent

## 0.22.0-alpha.1 — 19/11/2026

- Contenants : le barème de jaugeage peut être importé dès la création (ou la modification) d’un contenant — cahier d’épalement en PDF, scan, photo, Excel, CSV ou fichier de barèmes Œnotrack ; nom, capacité, fabricant et matière repris du document, tableau et courbe vérifiables (et corrigeables) avant d’enregistrer ; dans un cahier de plusieurs réservoirs, le tableau du contenant est choisi d’après son nom ; en modification, le nouveau barème remplace l’actuel, qui reste archivé
- Tableau des barèmes : les lignes corrigées, douteuses ou modifiées ne se superposent plus
- Lecture des cahiers : les volumes écrits avec une espace entre les milliers (« 1 050 », « 11 264 ») sont lus en entier (ils étaient lus « 1 » ou « 11 » dans certains PDF, tableurs et tableaux collés)
- Informations légales : réglage des mentions retiré des Paramètres (les coordonnées du site seront ajoutées à sa mise en ligne) ; les pages restent en bas de chaque écran

## 0.21.0-alpha.1 — 19/11/2026

- Informations légales, en bas de chaque écran et sur l’écran de connexion : mentions légales (éditeur, directeur de la publication, hébergeur), politique de confidentialité (données gardées dans le navigateur, aucun cookie ni mesure d’audience, services sollicités, Drive et assistant IA facultatifs, droits RGPD), conditions générales d’utilisation (service gratuit en test, sauvegardes, outil d’aide, responsabilité, droit français), code source & licence (GNU AGPL v3 ou ultérieure, nom et logo réservés, composants d’autres auteurs) et réglementation (registres, pratiques œnologiques, FDS, hygiène) ; impression en PDF, adresses directes …/#mentions-legales, #confidentialite, #cgu, #licence
- Paramètres › ⚖ Mentions légales & licence : coordonnées du site où Œnotrack est mis en ligne (éditeur particulier, professionnel ou association, contact, hébergeur en un clic : OVHcloud, o2switch, Scaleway, Netlify, GitHub Pages), contrôle des mentions obligatoires, config.json à déposer à côté d’index.html (identifiants Drive gardés) ; chaque copie mise en ligne indique les siennes
- Paquet « Œnotrack en ligne » : LICENCE.txt, code source de la version (code-source.zip, proposé depuis la page « Code source & licence »), consignes pour un hébergeur web classique (OVHcloud, o2switch…) et pour les mentions légales

## 0.20.0-alpha.1 — 19/11/2026

- Intrants › Fiches FT & FDS : dépôt groupé des fiches techniques, FDS et certificats (plusieurs fichiers ou un dossier entier) ; chaque document est lu (PDF, scan ou photo), son type, le nom du produit, la date de révision et la version sont reconnus, et il est rattaché au bon produit (intrant ou produit d’hygiène) — à vérifier avant de joindre ; un produit absent peut être créé d’après le document
- Nouvelle version d’une FT ou d’une FDS : elle remplace la version en vigueur, qui est archivée et reste consultable (versions précédentes) ; une version plus ancienne déposée par erreur est rangée directement dans les archives, un fichier déjà joint est ignoré
- Sur chaque intrant : lien vers la page du produit chez le fournisseur (« Ouvrir », « Chercher »), référence, date de révision de la FDS et de la FT, alertes « FDS manquante » et « FDS de plus de 3 ans » (comme pour les produits d’hygiène), case « FDS non requise » ; matières sèches sans objet
- Assistant IA au choix (Paramètres › 🤖 Assistant IA) : Claude, ChatGPT, Gemini, Mistral, OpenRouter ou tout service compatible, avec la propre clé API de chaque utilisateur, gardée sur son appareil (jamais dans la base, la synchronisation, les sauvegardes ni le Drive) ; liste des modèles et test de connexion
- L’assistant identifie les documents non reconnus et fait la veille en ligne : page du produit, dernière FDS et dernière fiche technique chez le fournisseur, avec leurs dates (« 🔎 Vérifier en ligne », ou veille automatique à l’ouverture) ; une version plus récente que la vôtre est signalée

## 0.19.0-alpha.1 — 19/11/2026

- Fiches d’enregistrement à imprimer refaites pour tous les vignerons : 18 modèles (réception de vendange, pressurage, réception de moûts, débourbage, soutirages et transferts, assemblage, traitements, levurage, préparations, stabilisation par le froid, filtration, suivi des fermentations, jaugeage et inventaire des cuves, tirage, dégorgement, sorties, changements de stade, nettoyage et désinfection)
- En-tête compact (logo, titre, n° de fiche) ; plus aucun code ni réglage propre à une entreprise (version et dates du document devenues facultatives) ; impression sobre, économe en encre
- Colonnes « prévu / relevé » : Œnotrack pré-remplit cuves, lots, volumes, doses et n° de lot prévus, l’opérateur note ce qu’il relève (en hL, ou en cm avec un barème) ; dernier relevé de densité sur le suivi des fermentations ; toutes les cuves occupées sur la fiche de jaugeage et d’inventaire
- Case « Saisi dans Œnotrack le … par … » sur chaque fiche ; fiches vierges imprimables depuis « Modèles de fiches » ; n° de fiche lisible (ex. MVT-261119-1)
- Vos modèles personnalisés sont conservés (« Rétablir » reprend le nouveau modèle d’origine)

## 0.18.0-alpha.1 — 19/11/2026

- Produits d’hygiène (Hygiène › Produits d’hygiène) : répertoire des produits de nettoyage, de désinfection et de détartrage, avec leur fiche de données de sécurité (FDS), leur fiche technique et leurs attestations (glisser-déposer) ; nature, fabricant, concentration d’emploi, température, temps de contact, rinçage, contact alimentaire, revendications pour lesquelles le produit est utilisable
- Lecture automatique de la FDS déposée (PDF, scan ou photo) : nom, fabricant, date de révision, version, mention d’avertissement, pictogrammes de danger (ou déduits des mentions H), mentions de danger, protections individuelles, matières incompatibles, stockage, numéro d’urgence et composition sont repris, à vérifier
- Sécurité : pictogrammes de danger et protections obligatoires affichés partout, FDS manquantes ou de plus de 3 ans signalées, fiches de sécurité au poste imprimables (une page par produit)
- Journal d’hygiène : chaque nettoyage indique les produits utilisés (concentration, quantité) et la méthode ; rappels de sécurité, alerte « chloré + acide », concentration hors plage, produit non utilisable pour le vin présent ; filtre par produit ; registre « Produits d’hygiène (FDS) »
- Revendications modifiables (Paramètres › Revendications, stades & listes) : renommer, abréviation, couleur, ajouter (HVE, conversion bio…) au rang voulu en reprenant les règles d’intrants d’une revendication existante, ordre des rangs, masquer ; supprimer une revendication jamais utilisée
- Compatibilité : les bases 0.17.0-alpha.2 et antérieures s’ouvrent sans rien perdre (revendications d’origine et leurs couleurs) ; une version antérieure garde les produits d’hygiène, les nouvelles revendications et le détail des produits utilisés

## 0.17.0-alpha.2 — 19/11/2026

- Application installée (Android, iPhone, ordinateur) : son icône est le logo Œnotrack du modèle de base (anthracite et or), adaptée aux formes d’icônes d’Android ; même logo dans l’onglet du navigateur et sur l’écran de démarrage
- Mise à jour de l’application installée : les nouvelles icônes et la nouvelle version sont reprises automatiquement

## 0.17.0-alpha.1 — 18/11/2026

- Barèmes de jaugeage (Paramètres › 📏 Barèmes de jaugeage) : déposez le cahier d’épalement ou le certificat de jaugeage (PDF, scan, photo, Excel, CSV ou tableau collé) ; Œnotrack lit les tableaux (hauteur → volume, volume → hauteur, creux des citernes), le nom de chaque réservoir ou le compartiment de la citerne, le constructeur, la capacité et les dates, corrige les chiffres mal lus des scans d’après les lignes voisines et vérifie le tout avec la table volumétrique ou les volumes du certificat
- Vérification avant enregistrement : rattachement à vos contenants (reconnus par leur nom) ou création des contenants manquants, valeurs signalées surlignées, tableau corrigeable, courbe ; document d’origine gardé avec le barème
- Calculs partout : dans la fiche de chaque cuve (hauteur ⇄ volume, volume entre deux hauteurs, niveau attendu du contenu), bouton 📏 à côté du volume des transferts, soutirages, débourbages et sorties, hauteur mesurée dans le jaugeage, creux de chaque compartiment de citerne dans l’entrée de moûts, niveau attendu des cuves de destination
- Glisser-déposer des fichiers partout où l’on joint des documents (opérations, arrivages, opérations à réaliser) et pour le logo
- Contenants : fabricant (proposé d’après les fabricants déjà saisis et les barèmes), dans la fiche, la liste, le registre et le rapport
- Œnotrack en ligne installable comme une application (Chrome sur Android : « Installer l’application » ; iPhone : « Sur l’écran d’accueil » ; ordinateur), sans magasin d’applications, et utilisable sans réseau
- Sauvegarde « en ligne, avec cette page » (compte Claude) retirée : sauvegarde complète en fichier et Drive
- Compatibilité : les versions précédentes ouvrent, modifient et synchronisent une base 0.17.0-alpha.1 sans rien perdre (barèmes, fabricant, mesures de jaugeage)

## 0.16.0-alpha.1 — 18/11/2026

- Formulaires d’opération personnalisables (Paramètres › Opérations › ⚙ Formulaire, ou « Personnaliser ce formulaire » dans le formulaire) : chaque champ affiché, replié ou masqué, obligatoire ou facultatif, renommé, avec son aide et sa valeur par défaut ; les champs indispensables aux stocks restent toujours affichés
- Champs personnalisés par opération : texte, texte long, nombre (unité, minimum, maximum), calcul (formule à partir des autres champs : + − × ÷, min, max, abs, arrondi), date, heure, case à cocher, liste de choix, choix multiples ; obligatoires, valeur par défaut, en haut ou en bas du formulaire
- Les champs personnalisés apparaissent dans le journal, les fiches de lot et de cuve, les rapports, le registre des opérations (« Informations complémentaires ») et comme données pré-remplies des fiches à imprimer
- « Afficher tous les champs » dans le formulaire pour remplir quand même un champ masqué ; copie du formulaire d’une opération à une autre de même comportement

## 0.15.0-alpha.1 — 18/11/2026

- Identifiants et droits (Paramètres › Utilisateurs & droits) : à l’activation, un compte administrateur et un code de secours ; puis un identifiant et un mot de passe par personne, reliés à son opérateur
- Profils de droits modifiables (Administrateur, Chef de cave, Opérateur de chai, Laboratoire / œnologue, Consultation…) : pour chaque module aucun accès, lecture ou saisie, et droits particuliers (corriger une opération validée, supprimer, déclassements, campagnes, sauvegardes, utilisateurs)
- Chaque saisie est contrôlée selon le profil et tracée : « saisie par / corrigée par » sur les opérations et dans le registre, journal des accès (connexions, échecs, créations, corrections, suppressions) exportable
- Écran de connexion, mot de passe provisoire à changer, verrouillage automatique après inactivité (réglable), « rester connecté », code de secours pour l’administrateur
- Mots de passe jamais enregistrés : seule leur empreinte salée (PBKDF2-SHA256, 120 000 itérations) est gardée dans la base et les sauvegardes

## 0.14.0-alpha.1 — 18/11/2026

- Vue de la cuverie personnalisable : le contour et l’intérieur des contenants montrent au choix cépages, fractions, millésimes, revendications, classement des crus, stade, couleur ou crus ; l’intérieur peut combiner une couleur et un motif (ex. couleur = cépages, motif = fractions : cuvée unie, taille hachurée, rebêche pointillée), avec légende et plan imprimable
- Partenaires (anciennement « apporteurs ») : apporteurs de raisins ou de moûts et/ou vendeurs de vins (opération « Entrée de vin ») ; crus par défaut proposés à la saisie, appliqués d’office si on l’active
- Entrées de moûts (sortie pressoir ou citerne) : un ou plusieurs partenaires par compartiment (avec leur part), n° de lot et analyses par lot ; moyenne pondérée des analyses par cuve et enrichissement (chaptalisation) à réaliser pour le TAV visé, réglable dans Paramètres
- Fiches à imprimer : colonnes pré-remplies personnalisées — choisissez et ordonnez les données de chaque colonne (ex. partenaire · fraction · cépage · cru · millésime) ; données disponibles pour toutes les fiches
- Documents joints dès la saisie d’une opération (et sur les opérations à réaliser) : ils sont rattachés à l’opération à sa validation
- Rapports imprimables déplacés dans Traçabilité ; boutons d’en-tête « Exporter les registres » et « Rapports » retirés (doublons des onglets)

## 0.13.0-alpha.1 — 18/11/2026

- Modules réorganisables et désactivables (Paramètres › Modules) : glisser-déposer ou flèches, interrupteur par module ; un module désactivé masque son onglet et ses raccourcis sans rien supprimer ; Paramètres reste toujours actif ; le premier module actif s’ouvre au démarrage ; réglage partagé par tous les appareils
- Tirage & Dégorgement séparé en trois modules : Tirages (préparations, mixtions), Cave (bouteilles sur lattes, âge, remuage, mise sur pointes, mouvements) et Dégorgement (lots à dégorger, liqueurs d’expédition, lots finis)
- Registres et Paramètres séparés : Registres (exports, bilan matière) ; Paramètres (société & opérateurs, modules, sauvegarde & Drive, campagnes, listes…)

## 0.12.0-alpha.1 — 18/11/2026

- Opérateurs : liste des personnes de la société (salariés, saisonniers, apprentis, prestataires, œnologue) dans Registres & Paramètres › Société & opérateurs ; un opérateur qui a servi est archivé, jamais supprimé
- Chaque opération indique qui l’a réalisée (une ou plusieurs personnes), proposée d’office selon l’appareil (« 👤 Qui saisit ? ») ; aussi dans le journal d’hygiène, les décisions de déclassement et les opérations à réaliser (qui doit la faire)
- Journal filtrable par opérateur, fiche de chaque opérateur avec toute son activité et export, registres « Activité des opérateurs » et « Opérateurs », colonne Opérateur(s) dans les registres, rapports et fiches imprimées ; réglage « opérateur obligatoire »

## 0.11.0-alpha.1 — 18/11/2026

- Stockage sur votre Drive : Œnotrack en ligne se connecte à Google Drive, OneDrive ou Dropbox (ou à un dossier de l’ordinateur) et y enregistre automatiquement toutes ses données
- Plusieurs appareils et plusieurs personnes sur le même dossier partagé : saisies réunies, conflits gardés au journal, copie quotidienne dans historique/
- Hors réseau : les saisies restent sur l’appareil et partent au retour de la connexion
- Paquet de mise en ligne (Netlify) et guides pour déclarer Œnotrack chez Google, Microsoft et Dropbox

## 0.10.0-alpha.1 — 18/11/2026

- Synchronisation avec votre Drive par glisser-déposer : déposez (ou collez) le fichier Œnotrack du Drive n’importe où, Œnotrack réunit les modifications faites ici et sur les autres appareils
- Mise à jour automatique du fichier relié quand le navigateur le permet (Chrome, Edge sur ordinateur) ; sinon « Envoyer vers le Drive »
- Conflits : la modification la plus récente est gardée, l’autre reste au journal et peut être reprise
- Google Drive, OneDrive, Dropbox, iCloud Drive, kDrive, pCloud ; nom de chaque appareil ; identifiants propres à chaque appareil

## 0.9.0-alpha.1 — 18/11/2026

- Volumes des vins et des contenants en hectolitres (hL, 2 décimales)
- Catalogue d’opérations personnalisable : 49 opérations (levurage, sulfitage, collage, suivi de fermentation, réchauffage, bâtonnage, mise en fût, remuage, regroupement de cuves, ventes en vrac, distillerie…), création d’opérations avec leur fiche
- Changement de stade automatique réglable par opération (soutirage → vin soutiré, filtration → vin filtré…)
- Nouveaux stades (vin soutiré, collé, filtré, sur pointes) et règles de mélange des stades personnalisables
- Sorties de cave (bilan matière, registre), suivi des cuves (densité, température)

## 0.8.0-alpha.1 — 18/11/2026

- Parcelles reliées aux crus (apports, entrées de moûts, composition, traçabilité)
- Sauvegarde complète en un seul fichier (base + documents joints + logo), guide Google Drive / OneDrive / Dropbox / iCloud et sauvegarde en ligne, regroupés dans Registres & Paramètres
- Cartouche des fiches (version, création, modification) modifiable
- Compatibilité : toute base ou sauvegarde d’une version précédente s’ouvre dans les versions suivantes

## 0.7.0-alpha.1 — 18/11/2026

- Stades et couleurs du vin personnalisables, intégrés aux opérations
- Classement des crus personnalisable (préréglages par région)
- Les 9 thèmes en clair et en sombre

## 0.6.0-alpha.1 — 17/11/2026

- Impression en PDF, plan de cave imprimable
- Opérations à réaliser ou à valider depuis n’importe quel formulaire

## 0.5.0-alpha.1 — 17/11/2026

- Chartes graphiques, fiches d’enregistrement imprimables, documents joints, logo

## 0.4.0-alpha.1 — 17/11/2026

- Entrées de moûts par compartiment, fractions, millésime par moût, saisie semi-automatique

## 0.3.0-alpha.1 — 16/11/2026

- Crus (villages), apporteurs, échelle des crus

## 0.2.0-alpha.1 — 16/11/2026

- Œnotrack : sites, plan de cave modifiable, contenants personnalisés, traçabilité des intrants, rapports

## 0.1.0-alpha.1 — 13/11/2026

- Première version (« Cuverie champenoise »)
