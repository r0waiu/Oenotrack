ŒNOTRACK EN LIGNE (0.23.0-alpha.1)
==============================

Ce dossier contient Œnotrack prêt à être mis en ligne :
  - index.html  : l'application, avec sa page d'accueil (présentation d'Œnotrack, à la toute première ouverture) ;
  - config.json : les identifiants publics de Google, Microsoft et Dropbox (à remplir, voir étape 3) ;
  - confidentialite.html, mentions-legales.html, cgu.html, licence.html : les informations légales en pages fixes,
    lisibles sans JavaScript (pour les écrans de connexion Google, Microsoft, Dropbox et les moteurs de recherche) ;
  - manifest.webmanifest, sw.js et les icônes : pour installer Œnotrack comme une application (étape 5).
Mise à jour : remplacez index.html, sw.js et les pages .html (et ajoutez les fichiers nouveaux), gardez votre config.json.

1. METTRE EN LIGNE (gratuit, environ 5 minutes)
   - Créez un compte sur https://www.netlify.com puis ouvrez https://app.netlify.com/drop
   - Glissez-y ce dossier « oenotrack-web » (décompressé).
   - Netlify affiche l'adresse du site (https://xxxx.netlify.app). Renommez-la :
     Site configuration > Change site name (ex. oenotrack-mondomaine).
   - Nouvelle version d'Œnotrack : remplacez SEULEMENT index.html dans votre dossier (gardez votre config.json
     rempli), puis onglet Deploys : glissez à nouveau le dossier. Vos données ne bougent pas (elles sont sur le Drive
     et dans chaque appareil).

2. OUVRIR ŒNOTRACK EN LIGNE
   - Ouvrez votre adresse : Paramètres > Sauvegarde & Drive > « Stockage sur votre Drive ».
   - Dépliez « Identifiants des services » : l'adresse exacte à déclarer y est affichée,
     avec les guides pas à pas pour Google Drive, OneDrive et Dropbox.

3. DÉCLARER ŒNOTRACK CHEZ VOTRE DRIVE (une fois, environ 10 minutes par service)
   - Google Drive : console.cloud.google.com (projet, API Google Drive, écran de consentement,
     utilisateurs test, ID client OAuth « Application Web » avec votre adresse en origine autorisée).
   - OneDrive : portal.azure.com > Inscriptions d'applications (application monopage, adresse de retour,
     autorisation Files.ReadWrite.All).
   - Dropbox : dropbox.com/developers/apps (Scoped access, Full Dropbox, Redirect URI, PKCE autorisé).
   Collez chaque identifiant dans Œnotrack (champ correspondant), puis « Télécharger config.json » :
   remplacez le config.json de ce dossier et remettez le dossier en ligne (étape 1) pour que tous
   les appareils l'aient.

4. CHOISIR LE DOSSIER DU DRIVE
   - « Se connecter » sur votre service, puis choisissez (ou créez) le dossier : Œnotrack y enregistre
     oenotrack-base.json, documents/ et historique/, et les tient à jour automatiquement.
   - Partagez ce dossier (en modification) avec vos collaborateurs : chacun se connecte avec son compte
     et choisit le même dossier (« Partagés avec moi »).

5. INSTALLER L'APPLICATION (téléphone, tablette, ordinateur — sans magasin d'applications)
   - Android : ouvrez votre adresse dans Chrome, menu ⋮ > « Installer l'application » (ou « Ajouter à l'écran d'accueil »).
   - iPhone / iPad : dans Safari, bouton Partager > « Sur l'écran d'accueil ».
   - Ordinateur (Chrome, Edge) : icône d'installation à droite de la barre d'adresse.
   Œnotrack s'ouvre alors en plein écran depuis l'écran d'accueil, même sans réseau, et se met à jour tout seul.

Autres Drive (iCloud Drive, kDrive, pCloud…) : « Dossier de l'ordinateur » (Chrome ou Edge sur ordinateur)
avec le dossier que l'application du Drive crée sur l'ordinateur.

HÉBERGEUR WEB CLASSIQUE (OVHcloud, o2switch, Scaleway…)
   Envoyez tous les fichiers de ce dossier dans le dossier du site (souvent « www ») de votre hébergement,
   avec le gestionnaire de fichiers de l'hébergeur ou un logiciel FTP (FileZilla). L'adresse doit être
   en https (certificat SSL, gratuit chez la plupart des hébergeurs).

6. MENTIONS LÉGALES (obligatoires pour un site en ligne)
   - Les pages « Mentions légales », « Confidentialité », « CGU » et « Code source & licence » s'affichent
     en bas de chaque écran, et aux adresses …/#mentions-legales, …/#confidentialite, …/#cgu, …/#licence.
   - Les coordonnées du site (éditeur, contact, hébergeur) se trouvent dans config.json, rubrique « mentions »
     (elles ne se règlent pas dans l'application) :
     "mentions": { "editeur": { "statut": "particulier", "nom": "…", "email": "…" },
                   "hebergeur": { "id": "ovh" }, "site": "https://…", "depot": "https://github.com/…" }
     (statut : particulier, pro ou association — un professionnel ajoute "adresse", "tel" et "immatriculation" ;
      hébergeurs connus : ovh, o2switch, scaleway, netlify, github ; sinon "nom", "adresse", "tel").
     Gardez les identifiants Drive déjà présents dans le même fichier (« google », « microsoft », « dropbox »).

   - Les pages fixes (confidentialite.html, mentions-legales.html…) reprennent le config.json du paquet : après un
     changement de la rubrique « mentions », refaites le paquet pour les mettre à jour.

7. CODE SOURCE ET LICENCE
   - Œnotrack est un logiciel libre (GNU AGPL v3 ou ultérieure) : voir LICENCE.txt.
   - code-source.zip : le code de cette version, proposé aux utilisateurs depuis la page
     « Code source & licence » (si vous mettez en ligne une version modifiée, la licence l'exige).
   - Le nom « Œnotrack » et son logo ne sont pas couverts par la licence.

8. CONNEXION GOOGLE, MICROSOFT ET DROPBOX POUR TOUS (site officiel : oenotrack.fr)
   - Page d'accueil à déclarer : https://oenotrack.fr/ (présentation d'Œnotrack, son nom exact et son fonctionnement).
   - Politique de confidentialité : https://oenotrack.fr/confidentialite.html ; conditions d'utilisation : https://oenotrack.fr/cgu.html.
   - Google (écran de consentement OAuth) : nom de l'application « Œnotrack », ces adresses, domaine autorisé oenotrack.fr
     vérifié dans Google Search Console. Œnotrack demande l'accès complet au Drive, une autorisation « restreinte » chez
     Google : la vérification de l'application est plus poussée (justification, vidéo de démonstration).
   - Microsoft (Entra ID) et Dropbox : mêmes adresses dans les réglages de l'application (Branding / Settings).
