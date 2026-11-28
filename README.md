<p align="center">
  <img src="icone-192.png" width="96" height="96" alt="Logo Œnotrack">
</p>

<h1 align="center">Œnotrack</h1>

<p align="center">
  <b>Traçabilité de cuverie et de chai, pour les vignerons.</b><br>
  Logiciel libre et gratuit, qui s’ouvre dans le navigateur, sur ordinateur, tablette et téléphone.
</p>

<p align="center">
  <a href="https://oenotrack.pages.dev">oenotrack.pages.dev</a> ·
  <a href="CHANGELOG.md">Nouveautés</a> ·
  <a href="#mettre-œnotrack-en-ligne">Mettre en ligne</a> ·
  <a href="#développement">Développement</a> ·
  <a href="#licence">Licence AGPL-3.0</a> ·
  <a href="#in-english">English</a>
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-0.48.0--alpha.1-8C6E2F">
  <img alt="Licence" src="https://img.shields.io/badge/licence-AGPL--3.0--or--later-1E242B">
  <img alt="Langues" src="https://img.shields.io/badge/langues-FR%20%C2%B7%20EN%20%C2%B7%20ES%20%C2%B7%20IT%20%C2%B7%20DE%20%C2%B7%20PT-5B636D">
</p>

> [!NOTE]
> Œnotrack est en **version de test (alpha)** : gardez vos registres habituels en parallèle et faites des sauvegardes régulières.

---

## Sommaire

- [Ce que fait Œnotrack](#ce-que-fait-œnotrack)
- [Le pressoir](#le-pressoir)
- [Bulletins d’analyses et fichiers de traçabilité](#bulletins-danalyses-et-fichiers-de-traçabilité)
- [Protection des importations](#protection-des-importations)
- [Hygiène (méthode HACCP)](#hygiène-méthode-haccp)
- [Équipements](#équipements)
- [Au chai : fiches, saisie groupée, fermentation, étiquettes QR](#au-chai--fiches-saisie-groupée-fermentation-étiquettes-qr)
- [Intrants : catalogues, doses cumulées, plafonds](#intrants--catalogues-doses-cumulées-plafonds)
- [Plan de vinification](#plan-de-vinification)
- [Tirage et prise de mousse](#tirage-et-prise-de-mousse)
- [Labels et cahiers des charges](#labels-et-cahiers-des-charges)
- [DRM (douane) et registre d’enrichissement](#drm-douane-et-registre-denrichissement)
- [Traçabilité à chaque étape et mode audit](#traçabilité-à-chaque-étape-et-mode-audit)
- [Connexion simplifiée et impression](#connexion-simplifiée-et-impression)
- [Région, types de vins et appellations](#région-types-de-vins-et-appellations)
- [Prise en main : configuration et visite guidées](#prise-en-main--configuration-et-visite-guidées)
- [Langues](#langues)
- [Vos données](#vos-données)
- [Essayer](#essayer)
- [Mettre Œnotrack en ligne](#mettre-œnotrack-en-ligne)
- [Développement](#développement)
- [Numérotation des versions](#numérotation-des-versions)
- [Licence](#licence)
- [In English](#in-english)

## Ce que fait Œnotrack

| | |
|---|---|
| 🍇 **Pressoir et vendange** | Registre des pesées et tickets, carnet de pressoir (cuvée, tailles, rebêches), entrées de moûts par compartiment, crus, partenaires, analyses par lot. |
| 🛢️ **Cuverie et lots** | Plan de cave, cuves, fûts, foudres, citernes avec leurs barèmes de jaugeage (cahier d’épalement lu en PDF, photo ou tableur), lots, portions et composition (cépages, crus, millésimes, revendications) ; fiches personnalisables, courbes de fermentation et alertes, calculs (SO₂ moléculaire, enrichissement), étiquettes QR. |
| ⚙️ **Opérations, tous les vins** | Champagne et vins tranquilles, rouges, rosés ou doux : débourbage, levurage, macérations, pigeage, mutage, élevage sous bois ou sous voile, stabilisation (dont l’électrodialyse), soutirages, assemblages, froid, filtration… avec des formulaires personnalisables et des fiches d’enregistrement à imprimer ; saisie groupée sur plusieurs cuves, doses dans l’unité du produit. |
| 🗂️ **Plan de vinification** | L’instruction de travail par cépage, revendication et fraction, importée d’un tableur, modifiable case par case, avec des variantes selon l’apporteur, le cru ou l’état sanitaire ; ses étapes sont proposées à la création de chaque lot. |
| 🍾 **Tirage et prise de mousse** | Calculateur de tirage, levains (plan, suivi, recalibrage) et liqueurs, chantiers de tirage à plusieurs cuvées, cuve de mixtion ou pompe doseuse, fournitures prises dans les intrants, VRTP, déclarations préalable et de fin de tirage, ordre de tirage imprimé. |
| 🥂 **Cave, dégorgement, expédition** | Bouteilles sur lattes, remuage, dégorgement et liqueur d’expédition (SO₂ imputé au lot fini), habillage, réétiquetage et mise en carton ; codification des lots selon vos propres règles, sans jamais renommer un lot existant. |
| 🔎 **Traçabilité et registres** | Une seule recherche à n’importe quelle étape (pesée, marc, lot, cuve, lot fini, DAE, lot d’un produit, date) et la chaîne complète du raisin au dégorgé ; traçabilité par intrant, par parcelle ; registres et bilan matière exportés en CSV ou Excel (dont le registre d’enrichissement) ; **DRM** mensuelle ou DRA annuelle calculée d’après les opérations, fichier XML pour CIEL (douane) et pour le CIVC ; fichier de traçabilité remis au destinataire d’un moût ou d’un vin, et repris à la réception. |
| 🧾 **Mode audit** | Visites d’audit préparées et présentées chapitre par chapitre : agriculture biologique, Demeter, douanes, hygiène (HACCP), appellation, ou vos propres types ; points de contrôle notés, test de traçabilité chronométré, dossier imprimable. |
| 🧪 **Intrants, analyses** | Stocks d’intrants avec fiches techniques et FDS (lues à leur dépôt, ou photographiées depuis un téléphone), allergènes, règles par revendication (BIO avec le code d’agrément de votre organisme, Demeter…), déclassements (à valider dans **Opérations & Assemblages › Déclassements**), analyses et import des bulletins du laboratoire (plusieurs échantillons, plusieurs tableaux). |
| ⚖️ **Labels et cahiers des charges** | Référentiel réglementaire des intrants (UE, AOC Champagne, bio UE, Demeter, Biodyvin, Nature & Progrès, Vin Méthode Nature, S.A.I.N.S.) avec le texte source de chaque règle, plafonds de SO₂ comparés, conformité de chaque lot. |
| 🗺️ **Appellations et régions** | Référentiel officiel de 1 692 appellations (France AOP et IGP, Union européenne, Suisse, États-Unis, Australie) ; types de vins « hors appellation » signalés ; hiérarchie des crus propre à chaque appellation (Chablis, Bourgogne, Médoc, DOCG, pyramide allemande…), proposée puis confirmée. |
| 🛡 **Importations protégées** | Chaque fichier importé est vérifié avant d’être gardé : programmes et pages web déguisés refusés, PDF désarmés, macros refusées, sauvegardes nettoyées, journal de sécurité et points de restauration. |
| 🧽 **Hygiène (HACCP)** | Plan de nettoyage et de désinfection, journal d’hygiène avec contrôles après rinçage, tâches et alertes (cuve vidée sans rinçage, changement de revendication…), produits d’hygiène et leurs FDS. |
| 🛠 **Équipements** | Parc de matériel (une fiche par équipement, documents), maintenance préventive et réglementaire, pannes, vérifications périodiques des bascules, balances, instruments et extincteurs. |
| 👥 **À plusieurs** | Opérateurs, identifiants et droits par profil, connexion par empreinte, visage ou code PIN sur les appareils acceptés (gérés utilisateur par utilisateur), journal des accès ; partage entre appareils et personnes par votre Google Drive, OneDrive, Dropbox ou le dossier réseau de l’entreprise. |
| 🧭 **Prise en main guidée** | Une configuration guidée (basique ou avancée) règle Œnotrack pour votre exploitation ; une visite guidée par chapitres présente chaque module ; onglet ouvert au démarrage, à la connexion et au déverrouillage au choix (dont « dernière page visitée »). |
| 🤖 **Assistant IA facultatif** | Avec votre propre compte et votre clé (Claude, ChatGPT, Gemini, Mistral…) : identification et lecture des FT, FDS et certificats (fiches produits complétées), suivi de leurs mises à jour. |

## Le pressoir

L’onglet **Pressoir** tient les documents du centre de pressurage :

- **Registre des pesées** : numéro continu dans l’année, date et heure, apporteur, cru et son **échelle des crus** (Grand Cru, 1er Cru, Autre cru : affichée dès la saisie, dans le registre et dans la recherche), parcelle, revendication particulière (mention, lieu-dit), poids brut, tare et net, caisses, état sanitaire, bascule utilisée.
- **Bon de pesée**, remis à l’apporteur à chaque livraison : centre de pressurage et apporteur (avec leurs identifiants officiels : CVI, accise…, réglés dans **Paramètres › Société** et sur la fiche du partenaire), ce qui est livré (cépage, cru, échelle, parcelle, caisses, poids), les relevés de qualité et le **cumul de la campagne** de cet apporteur (pesées, caisses, poids ; par cépage et par échelle des crus).
- **Pourriture acide** (%) et **TAP** (titre alcoométrique probable, % vol.) relevés à la réception : repris sur le bon de pesée, dans le registre, le bilan (TAP moyen pondéré par le poids), les relevés par apporteur et le carnet (TAP moyen des pesées chargées) ; alerte quand le TAP est sous le minimum de richesse en sucre (143 g/L, soit 8,5 % vol.).
- **Formulaire de pesée personnalisable** (« ⚙ Personnaliser ce formulaire », ou **Pressoir › Réglages**) : champs affichés, repliés ou masqués, obligatoires, renommés, valeurs proposées et relevés à vous (pourriture grise, acidité…). Les mentions obligatoires du registre et du bon de pesée (date et heure, poids, cépage, apporteur, revendication particulière) restent toujours affichées.
- Les relevés de pourriture (pourriture acide, vos relevés comme la pourriture grise) n’apparaissent que si l’état sanitaire n’est pas « Sain ».
- **Pesées et pressurages se saisissent seulement ici** : l’onglet **Opérations** ne propose ni « Pesée de vendange » ni « Pressurage » (un lien y mène à l’onglet Pressoir), même quand l’onglet Pressoir est masqué ; son journal garde l’historique, et « Modifier » ouvre le formulaire du Pressoir.
- **Pressurages** (le carnet de pressoir), rempli au fur et à mesure : « + Nouveau pressurage » charge un marc avec les pesées pressées (choisies par leur numéro, avec le poids restant à presser) et les cuves des moûts ; sur chaque pesée, **« Presser »** ouvre le pressurage avec le reste de la pesée déjà chargé. Le marc est enregistré dès son chargement (heure du début), puis complété (volumes de cuvée, de tailles et de rebêches et leurs cuves, TAV en puissance, bourbes) et validé. Un marc validé crée ses lots dans les cuves.
- **Bon de pressoir** de chaque marc, distinct du bon de pesée : heures du pressurage, pressoir, raisins chargés (pesée, apporteur, cru, échelle, cépage, poids) et leur répartition, moûts obtenus avec leurs cuves et lots, revendicable, plafond, rendement, contrôles et signatures.
- **Corrections et annulations avec motif**, gardées dans un **journal** dont chaque ligne porte une empreinte SHA-256 : une modification faite hors d’Œnotrack se voit. Les numéros ne sont jamais réattribués.
- **Relevés par apporteur** (répartition des moûts au prorata du poids), **bilan de campagne**, exports CSV du registre et du carnet.

Contrôles du profil **AOC Champagne**, d’après le cahier des charges homologué par l’arrêté du 31 juillet 2025 :

| Règle | Contrôle |
|---|---|
| 102 litres de moûts débourbés pour 160 kg de raisins (réglable si un arrêté le réduit) | bloquant ; le surplus passe en rebêches |
| Taux minimum de rebêches fixé chaque année (0 à 10 %) | bloquant |
| 6 marcs au plus par 24 heures et par pressoir ; moyennes selon l’agrément | bloquant / alerte |
| Pressoirs de 2 000 à 12 000 kg, chargés à leur capacité agréée | alerte, motif du sous-chargement |
| Bourbes de 1 à 4 % ; rebêches en distillerie avant le 15 décembre, bourbes éliminées avant le 31 janvier de l’année suivante | alertes et rappels |
| Usages : 20,50 hl de cuvée et 5,00 hl de taille pour un marc de 4 000 kg | alerte seulement |
| Heure de début, TAV en puissance, vignette de la bascule, saisie tardive | contrôles du carnet |
| Richesse en sucre des raisins : au moins 143 g/L (TAP de 8,5 % vol.) | alerte à la pesée et au bilan |

> [!IMPORTANT]
> Œnotrack aide à tenir ces documents ; il ne remplace ni vos registres officiels ni les textes en vigueur. Aucun format d’échange officiel n’étant publié, les exports servent de copie et de contrôle.

## Bulletins d’analyses et fichiers de traçabilité

- **Bulletins d’analyses** (onglet **Analyses**) : déposez les bulletins du laboratoire (PDF, scan, photo, tableur ou CSV). Les paramètres, valeurs et unités sont reconnus (acidités converties en g/L H₂SO₄, « < 0,10 » gardé), chaque échantillon est rattaché au lot ou à la cuve cité, à la date du prélèvement. Vous vérifiez avant d’enregistrer ; les paramètres inconnus sont proposés, et le bulletin est joint à chaque analyse (📄). Avec un assistant IA configuré, l’IA complète la lecture : elle reçoit le texte du bulletin et la liste de vos paramètres, jamais vos codes de lots ni vos noms de cuves (réglage dans **Paramètres › Assistant IA**).
- **Fichier de traçabilité** : sur une sortie vers un partenaire (vente en vrac…), « 📤 » prépare un fichier pour le destinataire. Vous choisissez ce que vous partagez : expéditeur, composition, crus, apporteurs, parcelles, intrants, analyses, historique, noms des cuves, traçabilité reçue de vos fournisseurs (le minimum : le produit et l’expédition ; jamais les opérateurs). Une empreinte SHA-256 montre si le fichier a été modifié.
- **À la réception**, le destinataire dépose ce fichier dans l’entrée de moût ou de vin : le formulaire est prérempli (un expéditeur inconnu se crée en partenaire d’un clic) et la traçabilité d’avant la réception est gardée : journal (📥), fiche des lots qui en descendent, et transmise à son tour s’il réexpédie.

## Protection des importations

Chaque fichier qui entre dans Œnotrack (documents joints, FT et FDS, barèmes, bulletins, logo, sauvegardes, fichier du Drive, fichiers de traçabilité) est vérifié sur l’appareil avant d’être gardé :

- le **type réel** est lu dans le contenu : programmes, scripts, pages web et archives sont refusés, même renommés en .pdf ou .jpg ; les noms trompeurs aussi ;
- les **PDF** avec du contenu actif (JavaScript, actions automatiques, lancement de programme, fichiers incorporés) sont désarmés : seul le document propre est gardé ;
- les documents **Office** avec macros, contrôles ActiveX, objets incorporés ou modèle chargé depuis internet sont refusés ;
- les **données importées** (sauvegardes, Drive, traçabilité) sont nettoyées des clés piégées et leur structure est vérifiée ; un **point de restauration** est créé avant qu’une base importée remplace celle de l’appareil ;
- les documents s’ouvrent **sans exécuter leur contenu**, et les exports CSV ne lancent aucune formule à l’ouverture dans un tableur.

Refus et désarmements sont notés dans le **journal de sécurité** (**Paramètres › 🛡 Sécurité des importations**), qui suit l’appareil même quand une autre base est restaurée ; les documents déjà joints sont vérifiés une fois en arrière-plan.

## Hygiène (méthode HACCP)

L’onglet **Hygiène** tient le plan de nettoyage et de désinfection et son suivi (le plan de maintenance est dans l’onglet **Équipements** ; il revient dans l’Hygiène si cet onglet est désactivé) :

- **Plan de nettoyage** : pour chaque zone (pressoir et réception, cuverie, tirage, dégorgement…), ce qui se nettoie (cuves par type, équipements, locaux et matériel), quand (après chaque vidange, avant chaque remplissage, au changement de revendication, chaque soir de vendange, avant et après les vendanges, avant les assemblages, périodiquement…), avec quels produits, comment, le temps de contact, le contrôle après rinçage (visuel, papier pH, papier peroxyde), le responsable et l’enregistrement. Un modèle d’origine est fourni, à adapter ; les lignes « consigne » rappellent la bonne pratique sans alerte. Imprimable pour le classeur qualité, au choix en tableau, en logigramme vertical (une colonne par équipement : quand, action, consignes, contrôle, enregistrement) ou en frise des moments de l’année ; le plan de maintenance s’imprime de même (frise des échéances sur douze mois).
- **À faire** : tâches et alertes tirées du plan et des opérations enregistrées (vidanges et remplissages rejoués) : cuve vidée à rincer, remplissage sans rinçage récent, changement de revendication (par exemple Conventionnel → Bio) sans nettoyage, nettoyages périodiques et des soirs de vendange, maintenance échue, pannes. Une non-conformité se justifie (motif gardé). Seuls les événements depuis la mise en place du plan sont contrôlés.
- **À la saisie** : les formulaires d’opération et le carnet de pressoir préviennent avant d’enregistrer (cuve à rincer avant remplissage, changement de revendication), et le rinçage est proposé dès qu’une opération vide une cuve.
- **Journal d’hygiène** : entrées par contenant, équipement ou local, avec la ligne du plan suivie, le contrôle après rinçage et le changement de revendication.
- **Listes personnalisables** (**Hygiène › ⚙ Listes**) : contrôles après rinçage (avec le résultat attendu : conductimètre, bandelette ATP…), zones, dangers, natures, formes et unités des produits, protections individuelles, moments du plan. Renommez, masquez, réordonnez, ajoutez vos éléments ; un élément utilisé se masque (l’historique le garde). Un moyen de contrôle s’ajoute aussi depuis le journal.

## Équipements

L’onglet **Équipements** (après l’Hygiène) rassemble le matériel et son entretien :

- **Parc** : une fiche par équipement, rangée par catégorie (pressoirs, réception, pompes, filtration, froid, cuverie, tirage, dégorgement, pesage et mesure, nettoyage, sécurité, levage…) : marque, modèle, n° de série, année, fournisseur, site et emplacement, garantie, état (en service, à l’arrêt, réformé), **vos informations** (puissance, contrat d’entretien…), documents joints (notice, certificat, facture, contrat, photo). Recherche et filtres ; la fiche s’imprime.
- **Maintenance** : le plan de maintenance (préventive, réglementaire, curative), les interventions et les pannes signalées jusqu’à leur réparation.
- **Vérifications** : vérifications périodiques des bascules et balances (vignette), instruments de mesure, extincteurs, appareils de levage ; la validité se calcule d’après la dernière vérification et la périodicité, et l’échéance arrive dans **À faire** un mois avant.
- **Listes** : catégories du parc, types et résultats des interventions, personnalisables. Un matériel déjà utilisé ne se supprime pas : il passe en « Réformé » et son historique reste lisible.

## Au chai : fiches, saisie groupée, fermentation, étiquettes QR

- **Fiches personnalisables** : « ⚙ Personnaliser la fiche » sur une fiche de cuve ou de lot choisit les rubriques affichées et leur ordre ; un réglage commun à l’équipe, que chacun peut ajuster pour lui-même.
- **Saisie groupée** : « ☑ Sélection multiple » dans la **Cuverie**, puis sulfitage, levurage, collage, autre intrant, relevé densité / température ou changement de stade en une fois — une opération par cuve (quantité = dose × volume), corrigées, annulées ou imprimées ensemble, planifiables puis validées en groupe. « 🖨 Fiche du jour… » imprime une fiche multi-lignes (une ligne par cuve, colonne visa).
- **Fermentation** : courbes densité et température, vitesse de baisse de la densité, alerte « fermentation lente » ou « arrêtée » (seuils réglables), signalée sur les cartes des cuves.
- **🧪 Calculs** : SO₂ moléculaire et SO₂ libre nécessaire pour un objectif ; simulateur d’enrichissement au sucre ou au MCR qui prépare l’opération (plafonds donnés à titre indicatif, à vérifier dans la réglementation en vigueur).
- **Étiquettes QR** des cuves (planche A4 de 24 étiquettes ou grande étiquette A6) : l’appareil photo du téléphone ouvre directement la fiche de la cuve dans Œnotrack en ligne ; « 📷 Scanner » dans la cuverie. L’étiquette ne contient que l’adresse et l’identifiant de la cuve.

## Intrants : catalogues, doses cumulées, plafonds

- **Catalogues des fournisseurs** préinstallés (Laffort, IOC, Sofralab : Oenofrance, SOEC, Martin Vialatte — 906 produits œnologiques) : nom, famille, dose conseillée, conditionnements, mentions bio et vegan, avec leur source (catalogue, page). Seules des données factuelles sont reprises ; à vérifier sur la fiche technique du produit avant usage. Un fournisseur ou une marque peut être masqué pour toute l’équipe ; un autre catalogue s’importe (tableur, CSV, PDF lu par le script ou par l’assistant IA) et ses lignes restent « à vérifier » jusqu’à leur validation.
- **Saisie d’un intrant** : on choisit d’abord le fournisseur (ou « En stock »), puis le produit — y compris ceux de ses catalogues, ajoutés à vos produits avec des règles d’exemple « à vérifier ». « ＋ Réception… » enregistre le lot fournisseur sans quitter l’opération.
- **Doses cumulées** de chaque produit dans un lot, héritées des lots d’origine au prorata des volumes (assemblages, tirage, liqueurs), et **SO₂ total estimé** = dernière analyse + ajouts depuis (produits dont la teneur en SO₂ est connue), sur les fiches de lot et de cuve.
- **Revendications & plafonds** : plafonds de SO₂ total d’exemple (UE, bio, Demeter) et règles de substances, à vérifier ; import d’un cahier des charges dont chaque limite est relue avant d’être appliquée. Un dépassement n’est jamais bloqué : l’opération demande un motif, tracé au journal et au registre des intrants.

## Plan de vinification

**Vinification › Plan de vinification** : l’instruction de travail de la cave, sous la forme d’un tableau — pour chaque étape (sulfitage, enzymage, débourbage, levurage, thermorégulation, chaptalisation, FML, passage au froid, filtration, tirage…) et chaque produit, la dose selon le **groupe de cépages** (blancs, noirs), la **revendication** (conventionnel, BIO, Demeter…) et la **fraction** (cuvée, tailles). Doses par colonne, réunies pour la cuvée et les tailles ou pour tout un groupe, titres de section et notes, comme dans votre document qualité (référence, version).

- **Importer votre tableur** (Excel, LibreOffice, CSV) : titre, en-têtes fusionnés (cépages, revendications, fractionnement), étapes et produits sont reconnus ; le plan lu se vérifie avant d’être enregistré.
- **Modifier directement** le tableau : chaque case s’enregistre en la quittant (Échap annule) ; insérer, monter, descendre ou retirer une ligne, la relier à une opération du catalogue.
- **Variantes** selon l’apporteur, le cru, l’échelle, la revendication, le cépage, la fraction ou l’état sanitaire : la plus précise qui correspond au lot est retenue.
- **Proposé à la création d’un lot** (marc validé, entrée de moûts) : les étapes de sa colonne, dans l’ordre du tableau, avec les produits en stock et les quantités calculées sur le volume du lot, s’ajoutent en un clic dans **À réaliser** (sans date) ; la fiche du lot suit « étape n / m ».
- **Imprimer** en A4 paysage, couleurs comprises. L’exemple fourni (doses génériques) est **à vérifier** avec votre œnologue. Les anciens schémas par lot ont été convertis en variantes du plan.

## Tirage et prise de mousse

**Tirages** se partage en quatre sous-onglets :

- **⚗ Préparer** : calculateur de tirage dans les deux sens (volume de vin ou nombre de cols par format, du quart au nabuchodonosor), liqueur de tirage (fonte du sucre), correction du point de tirage, plan du levain (étapes, propagation jour par jour, recalibrage d’après le levain réellement disponible), suivi des alimentations, VRTP prévisionnel. Le point de tirage se choisit pour chaque cuvée ; le profil (levain, titre de liqueur, adjuvants) est **à vérifier**.
- **🍾 Tirer** : chantiers de tirage (interne ou prestataire, ligne de tirage, documents), **cuvées prévues** d’un même chantier avec leur qualité calculée depuis les vins de base (couleur, revendication, échelle, millésime, mentions comme Blanc de blancs ou Blanc de noirs), cuve de mixtion ou pompe doseuse (contrôles en cours de tirage), méthode ancestrale ; bilan par lot (cols par format, casse, VRTP limité à 1 % des volumes mis en œuvre).
- **📦 Fournitures** : bouteilles, obturateurs, capsules, bouchons, agrafes et adjuvants sont des intrants (aucun stock en double), décomptés au tirage d’après les cols et la casse, retours au fournisseur.
- **📄 Déclarations** : déclaration préalable (au moins 48 h avant, une ligne par cuvée) et déclaration de fin de tirage et de revendication (ventilations, VRTP distinct, CSV), figées une fois déposées ; ordre de tirage imprimé.

## DRM (douane) et registre d’enrichissement

**Registres › 📮 DRM (douane)** : la déclaration récapitulative des entrées et sorties de vins, **mensuelle (DRM) ou annuelle (DRA)** au choix, calculée d’après vos opérations — stocks de début et de fin par produit (vrac en cuve, bouteilles sur lattes, bouteilles finies), récolte, entrées de moûts, transferts entre produits au tirage et à l’assemblage, liqueurs, pertes (bourbes, lies, soutirages), sorties en vrac ou à la distillerie, échantillons.

- **Bouteilles finies** : les bouteilles dégorgées restent dans votre stock (droits suspendus) jusqu’à leur sortie, que vous saisissez à chaque DRM — ventes en France sous capsules (CRD), export et UE (DAE), dégustation, casse, retours — en équivalent 75 cl.
- **Produits** : pré-remplis selon la région (Champagne : vins tranquilles, vins mousseux, rebêches, lies et bourbes, Coteaux champenois, Rosé des Riceys) et **à vérifier** : le libellé doit être exactement celui de votre compte CIEL, avec le code INAO (à défaut, le libellé fiscal) et, si besoin, votre code CIVC. Chaque lot va au produit dont la règle lui convient (nature, fractions), ou à celui que vous choisissez.
- **Trois moyens** : le **fichier XML** à importer dans CIEL (format DTI+ de la douane, vérifié avec son schéma), le **même fichier avec vos codes CIVC** pour la plateforme de l’interprofession (à vérifier avec le CIVC), ou l’**impression** et le **CSV** pour reporter les chiffres. Pas de compte CRD.
- **Contrôles** avant le dépôt (n° d’accise, codes, stock négatif, écarts, continuité avec la DRM déposée précédente) ; **« ✓ Marquer comme déposée »** fige les chiffres et verrouille les saisies ; une opération modifiée ensuite est signalée.
- **Registre d’enrichissement** (Registres) : chaque enrichissement enregistré — lot, contenant, volume traité, TAP avant et TAV visé, méthode (saccharose ou MCR), produits et quantités.
- Œnotrack prépare la déclaration ; **vous la vérifiez et la validez dans CIEL**, et vous en restez responsable.

## Traçabilité à chaque étape et mode audit

- **Toutes les étapes** (onglet **Traçabilité**) : une seule recherche — n° de pesée (« pesée 12 ») ou de marc (« marc 3 »), code de lot, lot fini, cuve, apporteur, cru, lieu-dit, n° de DAE, n° de lot d’un produit, date — puis la chaîne complète, étape par étape : raisins (pesées), pressurage (marcs), moûts et vins, assemblages et vins de réserve, tirage, dégorgé, expéditions. Chaque carte peut devenir le centre de la chaîne ; la chaîne s’imprime.
- **Mode audit** : des types d’audit fournis — agriculture biologique, Demeter, douanes (contributions indirectes), hygiène (HACCP, plan de maîtrise sanitaire), appellation (ODG, contrôle AOC) — et les vôtres. Chaque type réunit les **pièces** attendues (registres, bilan matière, stocks, intrants et leurs fiches, SO₂ total, durée sur lattes, lots finis, plan de nettoyage, équipements, test de traçabilité…) et ses **points de contrôle**. Pendant la visite, tout se présente chapitre par chapitre sur la période choisie ; les réponses (conforme, observation, non-conformité, sans objet) et les notes sont gardées, le test de traçabilité est chronométré, le dossier s’imprime, puis l’audit se clôt.
- Les types fournis sont des **aide-mémoire, pas les référentiels officiels** : les réglages proposés (durée sur lattes, SO₂ maximum…) sont à vérifier avec votre organisme et votre cahier des charges.

## Connexion simplifiée et impression

- **Appareils par utilisateur** : chaque clé d’accès appartient à un seul compte (vérifié à chaque connexion). L’administrateur voit les appareils de chacun, les accepte, retire ou rétablit leur accès, choisit qui peut enregistrer ses propres appareils, et peut enregistrer l’appareil du poste pour un autre compte.
- **Clés d’accès** : sur un appareil accepté, connexion et déverrouillage par **empreinte, visage ou code PIN** — Windows Hello, Touch ID et Face ID (Mac, iPhone, iPad), déverrouillage Android ; sous Linux et ChromeOS : clé de sécurité, téléphone (QR code) ou code PIN du navigateur. Chacun active ses appareils depuis **Mon compte** ; un administrateur les accepte dans **Paramètres › Utilisateurs & droits** (réglable). Œnotrack ne garde que la clé publique ; le mot de passe reste toujours possible. Les clés d’accès demandent la version en ligne (https) ou l’application installée.
- **Impression** : « 🖨 Imprimer » ouvre la boîte d’impression de l’appareil (ordinateur, Android, iPhone, iPad) et n’imprime que le document ; « ⬇ PDF » enregistre le PDF en parallèle. Là où l’impression directe n’est pas possible, le PDF prend le relais (sur téléphone : Partager › Imprimer).

## Région, types de vins et appellations

**Paramètres › 🍇 Région & types de vins** : choisissez votre **région** — 13 bassins viticoles français (Champagne, Alsace, Bourgogne, Beaujolais, Bordeaux, Val de Loire, Vallée du Rhône, Languedoc-Roussillon, Provence, Sud-Ouest, Jura et Savoie, Corse, Charentes), 8 pays (Italie, Espagne, Portugal, Allemagne, Suisse, Autriche, États-Unis, Australie) ou « Autre région » — et les **types de vins** produits (tranquilles blancs, rosés, rouges, effervescents en méthode traditionnelle ou ancestrale, vins moelleux, liquoreux, vins doux naturels et vins de liqueur). Un type qu’aucune appellation de la région n’autorise est signalé **« hors appellation »** (vin sans indication géographique), jamais interdit. Des raccourcis règlent un domaine mixte en un clic (Champagne, Crémant + vins tranquilles, vins tranquilles, vins rouges).

Œnotrack montre alors, dans une **liste à cocher**, chaque changement proposé avant de l’appliquer :

- **onglets** Tirages, Cave et Dégorgement affichés ou masqués selon les effervescents ;
- **opérations** des vins rouges et rosés (éraflage, macérations, pigeage, délestage, écoulage, saignée, thermovinification…), des vins doux (mutage, arrêt de fermentation), de l’élevage (bois, voile, micro-oxygénation) et remuage, proposées ou masquées ; stade « En macération (cuvaison) » ;
- **cépages** et **appellations** de la région ajoutés aux listes ; fractions « goutte » et « presse » ; hors Champagne, tailles et rebêche retirées du formulaire de pressurage ;
- **pressoir** (profil AOC Champagne, crémant — 100 litres pour 150 kg — ou sans plafond), spécificités champenoises (registre des pesées, villages de l’échelle des crus jamais utilisés masqués), échelle de classement ;
- **seuil indicatif** d’enrichissement maximal : exemple non officiel, **à vérifier**.

Vos personnalisations ne sont jamais écrasées : rien n’est supprimé ni renommé, et une opération, une fraction ou un seuil réglés à la main ne changent pas. La région et les types de vins se règlent à un seul endroit ; l’identité de la société et **Pressoir › Réglages** en montrent le résumé, avec un lien.

**Appellations** (Paramètres › Listes) : recherche dans le **référentiel officiel de 1 692 appellations** relevé sur les sources officielles (INAO et eAmbrosia pour la France et l’Union européenne, OFAG, TTB, Wine Australia) et ajout à votre liste. Chaque appellation reçoit sa **hiérarchie des crus** (Champagne, Bourgogne, Chablis, Beaujolais, Côtes du Rhône, Médoc, Saint-Émilion, Sauternes, Graves, Alsace, Loire, Languedoc, DOC / DOCG, DO / DOCa, pyramide allemande de 2021, DAC autrichiennes, Portugal, Suisse…), proposée d’après son nom et sa région puis confirmée ; chaque parcelle porte son appellation et son niveau, et la fiche d’un lot en montre la répartition. Hiérarchies et repères sont **à vérifier**.

## Prise en main : configuration et visite guidées

- **Configuration guidée** à la première ouverture (ou depuis **Paramètres › Affichage & application**) : une question par écran, en mode basique ou avancé — entreprise, région et types de vins, revendications (HVE, VDC, BIO et son code d’agrément…), modules, identifiants DRM, opérateurs, campagne, verrouillage, base vide ou exemple. Un aperçu liste chaque changement ; rien n’est supprimé.
- **Visite guidée par chapitres** (« ❓ Visite guidée » dans l’en-tête) : « Prise en main » puis un chapitre par module affiché, le parcours « ★ L’essentiel » (10 étapes) ou « Tout voir ».
- **Recherche dans l’en-tête** (Ctrl+K) : un lot, une cuve, une pesée, un n° de lot fournisseur… ouvre directement sa fiche ; « Tout voir dans Traçabilité » pour la chaîne complète.
- **Au téléphone** : en-tête compact, tableaux du chai en cartes, fiches de saisie compactes ; une suppression peut être annulée pendant 10 secondes.
- **Onglet ouvert** (Paramètres › Modules) : un réglage pour le démarrage, un pour la connexion et un pour le déverrouillage — un onglet, le premier de la barre, ou la **dernière page visitée** (retenue sur l’appareil, pour chaque personne).

## Langues

Français, English, Español, Italiano, Deutsch, Português : la langue se choisit sur la page d’accueil, l’écran de connexion et dans **Paramètres**. À la première ouverture, Œnotrack propose celle du navigateur. La traduction de l’interface se fait par étapes : la page d’accueil, la connexion, les onglets, le **Pressoir**, la **Cuverie**, les **Opérations** (journal, déclassements, tous les formulaires), les fiches des contenants et des lots, les **Équipements**, la **Traçabilité** (toutes les étapes, mode audit), les registres, **Utilisateurs & droits** et les **Intrants** (stocks, produits et règles, catalogues, revendications et plafonds) sont traduits ; ce qui ne l’est pas encore reste en français. Ce que vous saisissez (noms des cuves, désignations, produits, libellés personnalisés) n’est jamais traduit.

## Vos données

- Tout ce que vous saisissez est enregistré et **chiffré sur votre appareil** (AES-256, coffre de l’appareil, mot de passe de l’appareil en option), jamais chez l’éditeur : pas de compte à créer, pas de publicité, pas de mesure d’audience, pas de cookie.
- Une sauvegarde complète tient dans un seul fichier ; toutes les sauvegardes, de toutes les versions, s’importent.
- **À plusieurs** : reliez Œnotrack à votre Google Drive, OneDrive ou Dropbox, ou au dossier réseau de l’entreprise (serveur interne, NAS) ; il lit et écrit ses fichiers dans le dossier que vous choisissez, directement depuis votre navigateur. Vous pouvez retirer cet accès à tout moment.
- **Chiffrement** (facultatif, **Paramètres › Sauvegarde & Drive**) : un mot de passe commun à l’équipe chiffre les sauvegardes, le fichier du Drive, ses copies et documents (AES-256). Le mot de passe et la clé restent sur chaque appareil : un mot de passe perdu rend les fichiers chiffrés illisibles.
- Quand les données ne sont que dans ce navigateur, un **rappel de sauvegarde** propose « ⬇ Sauvegarder maintenant » si aucune sauvegarde n’est récente.
- Les clés des assistants IA restent sur votre appareil ; elles ne vont ni dans la base, ni dans les sauvegardes, ni sur le Drive.

Détails : [politique de confidentialité](https://oenotrack.pages.dev/confidentialite.html).

## Essayer

Ouvrez **[oenotrack.pages.dev](https://oenotrack.pages.dev)** : au premier lancement, un jeu de données d’exemple permet de tout essayer. Œnotrack s’installe comme une application (Android, iPhone, ordinateur) et fonctionne aussi sans connexion.

## Mettre Œnotrack en ligne

Le paquet `oenotrack-web` (fabriqué par `tools/paquet-web.py`) contient Œnotrack prêt à être mis en ligne :

| Fichier | Rôle |
|---|---|
| `index.html` | l’application, avec sa page d’accueil |
| `config.json` | les identifiants publics de Google, Microsoft et Dropbox, et les mentions du site (étapes 3 et 6) |
| `confidentialite.html`, `mentions-legales.html`, `cgu.html`, `licence.html` | les informations légales en pages fixes, lisibles sans JavaScript (écrans de connexion, moteurs de recherche) |
| `manifest.webmanifest`, `sw.js`, icônes | pour installer Œnotrack comme une application |
| `code-source.zip`, `LICENCE.txt` | le code source de cette version et sa licence |
| `vendor/` | les bibliothèques (React, SheetJS, pdf-lib, PDF.js, Tesseract) et les polices, embarquées et vérifiées : le site ne contacte aucun CDN (depuis 0.38.0-alpha.1) ; leurs licences dans `vendor/LICENCES/` |

**Mise à jour** : remplacez `index.html`, `sw.js`, les pages `.html` et le dossier `vendor/` (ajoutez les fichiers nouveaux) et gardez votre `config.json`.

**Sécurité** : `index.html` porte une politique de sécurité du contenu (CSP) stricte : seuls les scripts de la page et du site s’exécutent, et les connexions sont limitées aux services d’Œnotrack (Google Drive, OneDrive, Dropbox, services d’IA proposés, `localhost`). Pour un service d’IA « compatible OpenAI » hébergé ailleurs, ajoutez son adresse dans `config.json` (`"securite": { "connexions": ["https://ia.exemple.fr"] }`) **avant** de fabriquer le paquet.

### 1. Mettre en ligne (gratuit, environ 5 minutes)

- **Netlify** : créez un compte sur [netlify.com](https://www.netlify.com), ouvrez [app.netlify.com/drop](https://app.netlify.com/drop) et glissez-y le dossier `oenotrack-web` décompressé. Renommez ensuite l’adresse proposée (*Site configuration › Change site name*).
- **GitHub Pages** : mettez les fichiers du paquet à la racine d’un dépôt, puis *Settings › Pages › Deploy from a branch*.
- **Hébergeur classique** (OVHcloud, o2switch, Scaleway…) : envoyez tous les fichiers dans le dossier du site (souvent `www`) par le gestionnaire de fichiers ou un logiciel FTP. L’adresse doit être en **https**.

### 2. Ouvrir Œnotrack en ligne

Ouvrez votre adresse, puis **Paramètres › Sauvegarde & Drive › Stockage sur votre Drive**. La rubrique *Identifiants des services* affiche l’adresse exacte à déclarer et les guides pas à pas.

### 3. Déclarer Œnotrack chez votre Drive (une fois, environ 10 minutes par service)

- **Google Drive** : [console.cloud.google.com](https://console.cloud.google.com) — projet, API Google Drive, écran de consentement, utilisateurs test, ID client OAuth « Application Web » avec votre adresse en origine autorisée.
- **OneDrive** : [portal.azure.com](https://portal.azure.com) › Inscriptions d’applications — application monopage, adresse de retour, autorisation `Files.ReadWrite.All`.
- **Dropbox** : [dropbox.com/developers/apps](https://www.dropbox.com/developers/apps) — Scoped access, Full Dropbox, Redirect URI, PKCE autorisé.

Collez chaque identifiant dans Œnotrack, puis **Télécharger config.json** : remplacez le `config.json` du dossier et remettez-le en ligne pour que tous les appareils l’aient.

### 4. Choisir le dossier du Drive

**Se connecter**, puis choisir (ou créer) le dossier : Œnotrack y enregistre `oenotrack-base.json`, `documents/` et `historique/`. Partagez ce dossier en modification avec vos collaborateurs : chacun se connecte avec son compte et choisit le même dossier.

Autres Drive (iCloud Drive, kDrive, pCloud…) : **Dossier de l’ordinateur** (Chrome ou Edge sur ordinateur), avec le dossier que l’application du Drive crée sur l’ordinateur.

### 5. Installer l’application (sans magasin d’applications)

- **Android** : dans Chrome, menu ⋮ › *Installer l’application*.
- **iPhone / iPad** : dans Safari, bouton Partager › *Sur l’écran d’accueil*.
- **Ordinateur** (Chrome, Edge) : icône d’installation à droite de la barre d’adresse.

### 6. Mentions légales (obligatoires pour un site en ligne)

Les coordonnées du site se mettent dans `config.json`, rubrique `mentions` :

```json
{
  "google": { "clientId": "" },
  "mentions": {
    "editeur": { "statut": "particulier", "nom": "…", "email": "…" },
    "hebergeur": { "id": "ovh" },
    "site": "https://…",
    "depot": "https://github.com/…"
  }
}
```

- `statut` : `particulier`, `pro` ou `association` ; un professionnel ajoute `adresse`, `tel` et `immatriculation`.
- Hébergeurs connus : `ovh`, `o2switch`, `scaleway`, `netlify`, `github`, `cloudflare` ; sinon `nom`, `adresse`, `tel`.
- Gardez les identifiants Drive déjà présents dans le même fichier. Après un changement de la rubrique `mentions`, refaites le paquet pour mettre à jour les pages fixes.

### 7. Connexion Google, Microsoft et Dropbox pour tous (site officiel : oenotrack.pages.dev)

- Les identifiants du site officiel sont dans le `config.json` de la racine et repris par `tools/paquet-web.py` (`CONFIG_VIDE=1` : paquet sans identifiants, pour un autre hébergement). Ils désignent l’application, pas une personne : **communs à tous les utilisateurs**, qui se connectent chacun à leur propre compte et n’autorisent que l’accès à leurs fichiers. Ce ne sont pas des secrets (jamais de « client secret » ni d’« App secret »).
- Ils ne fonctionnent qu’à l’adresse déclarée (`https://oenotrack.pages.dev`) : un autre hébergement déclare la sienne ou crée ses propres identifiants (Paramètres › Sauvegarde & Drive › Identifiants des services).
- Page d’accueil déclarée : `https://oenotrack.pages.dev/` ; politique de confidentialité : `https://oenotrack.pages.dev/confidentialite.html` ; conditions d’utilisation : `https://oenotrack.pages.dev/cgu.html`.
- **Google** : l’accès au Drive est une autorisation « restreinte » ; au-delà des utilisateurs de test, la vérification de l’application est nécessaire (justification, vidéo de démonstration). **Dropbox** : 500 utilisateurs en mode développement, puis demande de production. **Microsoft** (Entra ID) : multi-annuaire et comptes personnels.

## Développement

Œnotrack est une application d’une seule page, en React, sans serveur : les fichiers de `src/` sont concaténés dans l’ordre de leur nom puis compilés par esbuild en un fichier HTML autonome.

```bash
node build.mjs                 # src/*.js(x) + src/head.html → dist/cuverie.html (compacté ; --dev : lisible, --source : code source joint, --sortie=chemin)
node test/engine.test.js       # tests du moteur (dont la compatibilité des bases de toutes les versions)
node test/t45.mjs              # un test d’interface (Playwright) ; test/t*.mjs pour tous
python3 tools/paquet-web.py    # dist/web/oenotrack-web/ : site prêt à mettre en ligne (+ zip)
node tools/textes-a-traduire.cjs [fichiers]   # textes de l’interface pas encore traduits (npm install --no-save typescript)
```

| Dossier | Contenu |
|---|---|
| `src/1x-*.js`, `src/2x-*.js`, `src/3x-*.js` | le moteur (sans interface) : listes, crus, vin, pressoir, rejeu des opérations, traçabilité, stockage, synchronisation, droits, jeu d’exemple |
| `src/4x-*.jsx` à `src/9x-*.jsx` | l’interface : composants, formulaires, onglets, paramètres, application |
| `src/head.html` | styles et en-tête de la page |
| `test/` | tests du moteur et de l’interface ; `test/anciennes/` : moteurs des versions précédentes, gelés, pour vérifier que chaque version ouvre et synchronise les bases des autres |
| `tools/` | paquet du site, pages fixes, icônes, données de test, textes à traduire |

Les tests d’interface utilisent Playwright (Chromium), pdf-lib et pdfjs-dist installés dans `/opt/npm-tools/node_modules` (chemin à adapter à votre machine) ; les captures et fichiers produits par les tests vont dans `$OENOTRACK_TESTS` (par défaut `/tmp/oenotrack-tests`).

Les fichiers de la DRM peuvent être vérifiés avec le schéma XML de la douane (schéma DTI+ des entrepositaires agréés viticoles ; il n’est pas fourni ici) : indiquez son chemin dans `OENOTRACK_XSD_DTI` et les tests (`test/engine.test.js`, `test/t65.mjs`) le passent à `xmllint`.

Règles du projet :

- **Compatibilité** : toute base, de toute version, s’ouvre dans toutes les autres sans rien perdre (champs inconnus gardés, une base d’essai par version, moteur précédent gelé et testé).
- **Langues** : toute modification de l’interface est traduite dans les six langues (tables `src/17c-…` à `src/17p-…`, une ligne par texte : français, anglais, espagnol, italien, allemand, portugais ; `tools/textes-a-traduire.cjs` liste ce qui manque).
- **Confidentialité** : aucune donnée n’est envoyée à l’éditeur ; les clés d’API restent sur l’appareil.

Signalez un problème ou proposez une amélioration dans les [Issues](https://github.com/r0waiu/Oenotrack/issues).

## Numérotation des versions

`X.Y.Z-étiquette.N` : **X** majeure (refonte profonde, rupture de compatibilité — jamais pour un changement graphique ou une nouvelle fonctionnalité), **Y** mineure (nouvelle fonctionnalité rétrocompatible, amélioration notable, refonte graphique), **Z** correctif (correction, performance, sécurité, retouche de texte). Étiquettes : `-alpha.N` (développement), `-beta.N` (test par les utilisateurs), `-rc.N` (candidate) ; aucune pour une version finale. Le détail de chaque version est dans [CHANGELOG.md](CHANGELOG.md) et dans l’application (*Nouveautés*).

## Licence

Œnotrack est distribué sous licence **GNU Affero General Public License v3.0 ou ultérieure** ([LICENCE.txt](LICENCE.txt), [texte de la licence](https://www.gnu.org/licenses/agpl-3.0.html)). Si vous mettez en ligne une version modifiée, vous devez en proposer le code source à ses utilisateurs.

Le nom « Œnotrack » et son logo ne sont pas couverts par la licence : une version modifiée diffusée doit porter un autre nom et un autre logo (elle peut se dire « basée sur Œnotrack »). Les composants d’autres auteurs restent sous leur propre licence (liste dans l’application : *Informations légales › Code source & licence*).

## In English

**Œnotrack** is free, open-source cellar traceability software for winegrowers, running entirely in the browser (computer, tablet, phone; installable, works offline). Data stays on your device, encrypted at rest; optional sharing goes through your own Google Drive, OneDrive or Dropbox folder, or the company network folder.

It covers the **press house** (weighing register with the cru scale and weighing slips showing each supplier’s campaign total, press logbook filled as you go with a pressing slip per press load, AOC Champagne pressing rules: 102 litres of settled must per 160 kg, minimum *rebêches* rate, at most 6 press cycles per 24 hours per press…), the **tank room** (tanks and barrels with calibration tables, lots and their composition), **cellar operations**, **traceability and registers** (CSV/Excel), **additives and analyses** (technical and safety data sheets read when added, or photographed from a phone; laboratory analysis reports imported from PDF, scans, photos or spreadsheets), **traceability files** handed to the buyer of a must or wine and read back at reception (you choose what you share; a SHA-256 fingerprint shows any change), **protected imports** (every imported file is checked: disguised programs and web pages refused, PDFs disarmed, macros refused, backups cleaned, security log and restore points), **hygiene following the HACCP method** (cleaning and disinfection plan, tasks and alerts such as a tank emptied without rinsing or a switch from conventional to organic without cleaning), an **equipment** tab (fleet records, maintenance plan, breakdowns, periodic checks of weighbridges, scales and instruments), **traceability at any stage** (one search, then the full chain from grapes to disgorged bottles and shipments), an **audit mode** (organic, Demeter, customs, HACCP, appellation or your own audit types, presented chapter by chapter with checkpoints, a timed traceability test and a printable file), **direct printing** with a PDF alongside, **multi-user rights** with sign-in by fingerprint, face or PIN (passkeys) on accepted devices, and day-to-day cellar tools: customisable tank and lot sheets, grouped entry over several tanks (sulphiting, yeast, readings…), fermentation curves with slow / stuck fermentation alerts, molecular SO₂ and enrichment calculators, QR labels that open a tank’s sheet from a phone camera, optional encryption of backups and of the shared Drive file with a team password, and additive tracking with preinstalled supplier catalogues (906 oenological products, facts only, to be checked against the technical data sheet), supplier-first entry, cumulative doses inherited through blends, an estimated total SO₂ and example limits per designation (to be checked), any exceedance requiring a recorded reason, and a **winemaking plan** (the cellar’s work instruction by grape variety, claim and fraction, imported from a spreadsheet, edited cell by cell, with variants by supplier, cru or grape health; its steps are suggested when a lot is created), **tirage and second fermentation** (tirage calculator, yeast starters and liqueurs, tirage runs with several planned cuvées, mixtion tank or dosing pump, supplies, VRTP, advance and end-of-tirage declarations), disgorging, dressing and packing with your own lot coding rules, a **regulatory register of additives** (EU, AOC Champagne, organic, Demeter, Biodyvin, Nature & Progrès, Vin Méthode Nature, S.A.I.N.S.) with lot compliance, the French **customs return (DRM)**, monthly or annual, calculated from your operations with finished bottles leaving the cellar entered each month, exported as the customs XML file for CIEL (DTI+ format, checked against the customs schema), the same file with CIVC product codes, a printout or a CSV, and an **enrichment register**. A **wine-region profile** (13 French regions, 8 countries), an official register of **1,692 appellations** (France, EU, Switzerland, United States, Australia) with the cru hierarchy of each, and the **wine types** produced (red, rosé, white, sparkling, sweet and fortified wines; types no appellation allows are flagged) adapt the tabs, operations, stages, grape varieties, appellations, fractions, press rules and indicative thresholds, each change listed in a preview with tick boxes and your own settings never overwritten; Champagne-specific rules can be switched off for other wine regions (no cap, or *crémant*: 100 litres per 150 kg).

The interface is available in French, English, Spanish, Italian, German and Portuguese (translated in stages: welcome page, sign-in, tabs, press house, tank room, operations and their forms, equipment, traceability and audit mode, registers, users & rights, additives — stock, products, catalogues and limits — so far). A guided setup and a guided tour by chapter help you get started. Try it at **[oenotrack.pages.dev](https://oenotrack.pages.dev)**. Licence: AGPL-3.0-or-later; the name and logo are not covered by the licence.
