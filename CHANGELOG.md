# Nouveautés d’Œnotrack

Toutes les versions publiées, de la plus récente à la plus ancienne (numérotation `X.Y.Z-étiquette.N` : voir le [README](README.md#numérotation-des-versions)). Le même journal est dans l’application : *Nouveautés*, en bas de l’écran.

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
