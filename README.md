<p align="center">
  <img src="icone-192.png" width="96" height="96" alt="Logo Œnotrack">
</p>

<h1 align="center">Œnotrack</h1>

<p align="center">
  <b>Traçabilité de cuverie et de chai, pour les vignerons.</b><br>
  Logiciel libre et gratuit, qui s’ouvre dans le navigateur, sur ordinateur, tablette et téléphone.
</p>

<p align="center">
  <a href="https://oenotrack.fr">oenotrack.fr</a> ·
  <a href="CHANGELOG.md">Nouveautés</a> ·
  <a href="#mettre-œnotrack-en-ligne">Mettre en ligne</a> ·
  <a href="#développement">Développement</a> ·
  <a href="#licence">Licence AGPL-3.0</a> ·
  <a href="#in-english">English</a>
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-0.26.0--alpha.1-8C6E2F">
  <img alt="Licence" src="https://img.shields.io/badge/licence-AGPL--3.0--or--later-1E242B">
  <img alt="Langues" src="https://img.shields.io/badge/langues-FR%20%C2%B7%20EN%20%C2%B7%20ES%20%C2%B7%20IT%20%C2%B7%20DE%20%C2%B7%20PT-5B636D">
</p>

> [!NOTE]
> Œnotrack est en **version de test (alpha)** : gardez vos registres habituels en parallèle et faites des sauvegardes régulières.

---

## Sommaire

- [Ce que fait Œnotrack](#ce-que-fait-œnotrack)
- [Le pressoir](#le-pressoir)
- [Champagne ou autre région viticole](#champagne-ou-autre-région-viticole)
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
| 🛢️ **Cuverie et lots** | Plan de cave, cuves, fûts, foudres, citernes avec leurs barèmes de jaugeage (cahier d’épalement lu en PDF, photo ou tableur), lots, portions et composition (cépages, crus, millésimes, revendications). |
| ⚙️ **Opérations** | Débourbage, levurage, soutirages, assemblages, froid, filtration, tirage, remuage, dégorgement… avec des formulaires personnalisables et des fiches d’enregistrement à imprimer. |
| 🔎 **Traçabilité et registres** | Traçabilité ascendante et descendante, par intrant, par parcelle ; registres et bilan matière exportés en CSV ou Excel. |
| 🧪 **Intrants, analyses** | Stocks d’intrants avec fiches techniques et FDS (lues à leur dépôt, ou photographiées depuis un téléphone), règles par revendication (bio, Demeter…), déclassements, analyses. |
| 🧽 **Hygiène (HACCP)** | Plan de nettoyage et de désinfection, plan de maintenance du matériel, journal d’hygiène avec contrôles après rinçage, tâches et alertes (cuve vidée sans rinçage, changement de revendication, pannes…), produits d’hygiène et leurs FDS. |
| 👥 **À plusieurs** | Opérateurs, identifiants et droits par profil, journal des accès ; partage entre appareils et personnes par votre Google Drive, OneDrive ou Dropbox. |
| 🤖 **Assistant IA facultatif** | Avec votre propre compte et votre clé (Claude, ChatGPT, Gemini, Mistral…) : identification et lecture des FT, FDS et certificats (fiches produits complétées), suivi de leurs mises à jour. |

## Le pressoir

L’onglet **Pressoir** tient les documents du centre de pressurage :

- **Registre des pesées** : numéro continu dans l’année, date et heure, apporteur, cru, parcelle, revendication particulière (mention, lieu-dit), poids brut, tare et net, caisses, état sanitaire, bascule utilisée. Un **ticket de pesée** s’imprime pour l’apporteur.
- **Pourriture acide** (%) et **TAP** (titre alcoométrique probable, % vol.) relevés à la réception : repris sur le ticket, dans le registre, le bilan (TAP moyen pondéré par le poids), les relevés par apporteur et le carnet (TAP moyen des pesées chargées) ; alerte quand le TAP est sous le minimum de richesse en sucre (143 g/L, soit 8,5 % vol.).
- **Formulaire de pesée personnalisable** (« ⚙ Personnaliser ce formulaire », ou **Pressoir › Réglages**) : champs affichés, repliés ou masqués, obligatoires, renommés, valeurs proposées et relevés à vous (pourriture grise, acidité…). Les mentions obligatoires du registre et du ticket (date et heure, poids, cépage, apporteur, revendication particulière) restent toujours affichées.
- Les relevés de pourriture (pourriture acide, vos relevés comme la pourriture grise) n’apparaissent que si l’état sanitaire n’est pas « Sain ».
- Dans **Opérations**, « Pesée de vendange » et « Pressurage » ouvrent directement la pesée du registre et le marc du carnet de pressoir : une seule saisie, pesées choisies par leur numéro.
- **Carnet de pressoir**, rempli au fur et à mesure : le marc est enregistré dès son chargement (heure du début, pesées chargées), puis complété (volumes de cuvée, de tailles et de rebêches et leurs cuves, TAV en puissance, bourbes) et validé. Un marc validé crée ses lots dans les cuves.
- Les pesées sont **aussitôt proposées dans les pressurages** de l’onglet Opérations, avec leur numéro et le poids restant à presser.
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

## Hygiène et maintenance (méthode HACCP)

L’onglet **Hygiène** tient le plan de nettoyage et de désinfection, le plan de maintenance du matériel et leur suivi :

- **Plan de nettoyage** : pour chaque zone (pressoir et réception, cuverie, tirage, dégorgement…), ce qui se nettoie (cuves par type, équipements, locaux et matériel), quand (après chaque vidange, avant chaque remplissage, au changement de revendication, chaque soir de vendange, avant et après les vendanges, avant les assemblages, périodiquement…), avec quels produits, comment, le temps de contact, le contrôle après rinçage (visuel, papier pH, papier peroxyde), le responsable et l’enregistrement. Un modèle d’origine est fourni, à adapter ; les lignes « consigne » rappellent la bonne pratique sans alerte. Imprimable pour le classeur qualité.
- **À faire** : tâches et alertes tirées du plan et des opérations enregistrées (vidanges et remplissages rejoués) : cuve vidée à rincer, remplissage sans rinçage récent, changement de revendication (par exemple Conventionnel → Bio) sans nettoyage, nettoyages périodiques et des soirs de vendange, maintenance échue, pannes. Une non-conformité se justifie (motif gardé). Seuls les événements depuis la mise en place du plan sont contrôlés.
- **À la saisie** : les formulaires d’opération et le carnet de pressoir préviennent avant d’enregistrer (cuve à rincer avant remplissage, changement de revendication), et le rinçage est proposé dès qu’une opération vide une cuve.
- **Plan de maintenance** : préventive, réglementaire (vérifications obligatoires, registre de sécurité) et curative ; échéances, vérifications avant vendanges, pannes signalées jusqu’à leur réparation, interventions avec leurs documents.
- **Journal d’hygiène** : entrées par contenant, équipement ou local, avec la ligne du plan suivie, le contrôle après rinçage et le changement de revendication.

## Champagne ou autre région viticole

Dans **Paramètres › Société** (ou **Pressoir › Réglages**), choisissez **Champagne** ou **Autre région viticole**. Hors Champagne :

- les règles champenoises sont désactivées ; le profil de pressurage devient **sans plafond** ou **crémant** (100 litres pour 150 kg) ;
- le registre des pesées devient facultatif ;
- les villages de l’échelle des crus en Champagne jamais utilisés sont masqués des listes de saisie (rien n’est supprimé ; ils reviennent si vous repassez en Champagne) ; d’autres classements sont proposés (Bourgogne, Alsace, Saint-Émilion, IGP / AOP…).

## Langues

Français, English, Español, Italiano, Deutsch, Português : la langue se choisit sur la page d’accueil, l’écran de connexion et dans **Paramètres**. À la première ouverture, Œnotrack propose celle du navigateur. La traduction de l’interface se fait par étapes : la page d’accueil, la connexion, les onglets, le **Pressoir**, la **Cuverie**, les **Opérations** (journal, déclassements, tous les formulaires), les fiches des contenants et des lots sont traduits ; ce qui ne l’est pas encore reste en français. Ce que vous saisissez (noms des cuves, désignations, produits, libellés personnalisés) n’est jamais traduit.

## Vos données

- Tout ce que vous saisissez est enregistré **sur votre appareil**, jamais chez l’éditeur : pas de compte à créer, pas de publicité, pas de mesure d’audience, pas de cookie.
- Une sauvegarde complète tient dans un seul fichier ; toutes les sauvegardes, de toutes les versions, s’importent.
- **À plusieurs** : reliez Œnotrack à votre Google Drive, OneDrive ou Dropbox ; il lit et écrit ses fichiers dans le dossier que vous choisissez, directement depuis votre navigateur. Vous pouvez retirer cet accès à tout moment.
- Les clés des assistants IA restent sur votre appareil ; elles ne vont ni dans la base, ni dans les sauvegardes, ni sur le Drive.

Détails : [politique de confidentialité](https://oenotrack.fr/confidentialite.html).

## Essayer

Ouvrez **[oenotrack.fr](https://oenotrack.fr)** : au premier lancement, un jeu de données d’exemple permet de tout essayer. Œnotrack s’installe comme une application (Android, iPhone, ordinateur) et fonctionne aussi sans connexion.

## Mettre Œnotrack en ligne

Le paquet `oenotrack-web` (fabriqué par `tools/paquet-web.py`) contient Œnotrack prêt à être mis en ligne :

| Fichier | Rôle |
|---|---|
| `index.html` | l’application, avec sa page d’accueil |
| `config.json` | les identifiants publics de Google, Microsoft et Dropbox, et les mentions du site (étapes 3 et 6) |
| `confidentialite.html`, `mentions-legales.html`, `cgu.html`, `licence.html` | les informations légales en pages fixes, lisibles sans JavaScript (écrans de connexion, moteurs de recherche) |
| `manifest.webmanifest`, `sw.js`, icônes | pour installer Œnotrack comme une application |
| `code-source.zip`, `LICENCE.txt` | le code source de cette version et sa licence |

**Mise à jour** : remplacez `index.html`, `sw.js` et les pages `.html` (ajoutez les fichiers nouveaux) et gardez votre `config.json`.

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
- Hébergeurs connus : `ovh`, `o2switch`, `scaleway`, `netlify`, `github` ; sinon `nom`, `adresse`, `tel`.
- Gardez les identifiants Drive déjà présents dans le même fichier. Après un changement de la rubrique `mentions`, refaites le paquet pour mettre à jour les pages fixes.

### 7. Connexion Google, Microsoft et Dropbox pour tous (site officiel : oenotrack.fr)

- Page d’accueil à déclarer : `https://oenotrack.fr/` ; politique de confidentialité : `https://oenotrack.fr/confidentialite.html` ; conditions d’utilisation : `https://oenotrack.fr/cgu.html`.
- **Google** : nom de l’application « Œnotrack », domaine `oenotrack.fr` vérifié dans Google Search Console. L’accès complet au Drive est une autorisation « restreinte » : la vérification de l’application est plus poussée (justification, vidéo de démonstration).
- **Microsoft** (Entra ID) et **Dropbox** : mêmes adresses dans les réglages de l’application.

## Développement

Œnotrack est une application d’une seule page, en React, sans serveur : les fichiers de `src/` sont concaténés dans l’ordre de leur nom puis compilés par esbuild en un fichier HTML autonome.

```bash
node build.mjs                 # src/*.js(x) + src/head.html → dist/cuverie.html
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

Règles du projet :

- **Compatibilité** : toute base, de toute version, s’ouvre dans toutes les autres sans rien perdre (champs inconnus gardés, une base d’essai par version, moteur précédent gelé et testé).
- **Langues** : toute modification de l’interface est traduite dans les six langues (tables `src/17c-…` à `src/17h-…`, une ligne par texte : français, anglais, espagnol, italien, allemand, portugais ; `tools/textes-a-traduire.cjs` liste ce qui manque).
- **Confidentialité** : aucune donnée n’est envoyée à l’éditeur ; les clés d’API restent sur l’appareil.

Signalez un problème ou proposez une amélioration dans les [Issues](https://github.com/r0waiu/Oenotrack/issues).

## Numérotation des versions

`X.Y.Z-étiquette.N` : **X** majeure (refonte profonde, rupture de compatibilité — jamais pour un changement graphique ou une nouvelle fonctionnalité), **Y** mineure (nouvelle fonctionnalité rétrocompatible, amélioration notable, refonte graphique), **Z** correctif (correction, performance, sécurité, retouche de texte). Étiquettes : `-alpha.N` (développement), `-beta.N` (test par les utilisateurs), `-rc.N` (candidate) ; aucune pour une version finale. Le détail de chaque version est dans [CHANGELOG.md](CHANGELOG.md) et dans l’application (*Nouveautés*).

## Licence

Œnotrack est distribué sous licence **GNU Affero General Public License v3.0 ou ultérieure** ([LICENCE.txt](LICENCE.txt), [texte de la licence](https://www.gnu.org/licenses/agpl-3.0.html)). Si vous mettez en ligne une version modifiée, vous devez en proposer le code source à ses utilisateurs.

Le nom « Œnotrack » et son logo ne sont pas couverts par la licence : une version modifiée diffusée doit porter un autre nom et un autre logo (elle peut se dire « basée sur Œnotrack »). Les composants d’autres auteurs restent sous leur propre licence (liste dans l’application : *Informations légales › Code source & licence*).

## In English

**Œnotrack** is free, open-source cellar traceability software for winegrowers, running entirely in the browser (computer, tablet, phone; installable, works offline). Data stays on your device; optional sharing goes through your own Google Drive, OneDrive or Dropbox folder.

It covers the **press house** (weighing register with tickets, press logbook filled as you go, AOC Champagne pressing rules: 102 litres of settled must per 160 kg, minimum *rebêches* rate, at most 6 press cycles per 24 hours per press…), the **tank room** (tanks and barrels with calibration tables, lots and their composition), **cellar operations**, **traceability and registers** (CSV/Excel), **additives and analyses** (technical and safety data sheets read when added, or photographed from a phone), **hygiene following the HACCP method** (cleaning and disinfection plan, equipment maintenance plan, tasks and alerts such as a tank emptied without rinsing or a switch from conventional to organic without cleaning), and **multi-user rights**. Champagne-specific rules can be switched off for other wine regions (no cap, or *crémant*: 100 litres per 150 kg).

The interface is available in French, English, Spanish, Italian, German and Portuguese (translated in stages: welcome page, sign-in, tabs, press house, tank room, operations and their forms so far). Try it at **[oenotrack.fr](https://oenotrack.fr)**. Licence: AGPL-3.0-or-later; the name and logo are not covered by the licence.
