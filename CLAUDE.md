# CLAUDE.md — Œnotrack

Mémoire du projet pour Claude et pour le vigneron. Œnotrack sert à la traçabilité de la cuverie et du chai (Champagne d'abord, puis toutes régions). Toujours répondre en **français**, de façon concise.

> **Règle permanente** : mettre à jour ce fichier dans le même commit dès qu'une fonctionnalité majeure, une règle d'architecture, une clé de stockage, une commande ou une convention change. Le détail par version va dans `CHANGELOG.md` (généré) ; le journal privé de développement va dans `NOTES.md`.

## 1. Architecture et stack

- **Local-first, sans serveur.** L'application tient en une seule page React : `dist/cuverie.html`. Tout se calcule dans le navigateur, et aucune donnée n'est envoyée à l'éditeur.
- **Bibliothèques** (0.38 : versions figées et vérifiées, `16r-bibliotheques.js` → `BIB_TABLE` entre `/*BIB-DEBUT*/` et `/*BIB-FIN*/`) :
  - React 18.3.1 UMD (balises avec `integrity`) ; Tailwind 3.4.17 **précompilé** par `build.mjs` (`<style id="oenotrack-tailwind">`, configuration `TW_CONFIG` dans `build.mjs`), plus de compilateur chargé ;
  - à la demande : pdf-lib 1.17.1, xlsx 0.18.5, pdfjs-dist 6.2.108, tesseract.js 5.1.1 — `bibScript(nom)` (attribut `integrity`), `bibModule` / `bibModuleUrl` (octets vérifiés en SHA-256 puis importés depuis la mémoire), `bibPdfjsBase()` ;
  - fichier seul (`dist/cuverie.html`) : jsDelivr `/npm/` (octets du paquet npm) + Google Fonts ; Œnotrack en ligne : tout dans `vendor/` (`<meta name="oenotrack-bibliotheques" content="vendor/">`), aucun CDN ;
  - `build.mjs` compare chaque empreinte aux paquets installés et s'arrête si l'une diffère ; changer de version = mettre à jour `BIB_TABLE` (sri, sha256) ;
  - Build : esbuild, tailwindcss (`/opt/npm-tools/node_modules`). Tests : Playwright/Chromium.
- **Stockage navigateur** :
  - `localStorage` (0.38 : la base et les secrets y sont des **enveloppes chiffrées** du coffre de l'appareil, voir § Sécurité) :
    - `oenotrack-db-v2` : la base JSON (enveloppe `{ format: 'oenotrack-coffre', coffre: { id }, nom, iv, donnees }`) ; l'ancienne clé `cuverie-champenoise-db-v1` est migrée ;
    - `oenotrack-coffre-secrets` : secrets chiffrés (`iaCles`, `chiffrementCle`, `cloudJetons`) ; `oenotrack-ia` ne garde que les choix (service, modèles, `source`, `memoire`) ;
    - `oenotrack-langue` ;
    - `oenotrack-config` ;
    - commodités de cet appareil : `oenotrack-recap-intrants` / `oenotrack-recap-maintenance` (colonnes des fiches récapitulatives), `oenotrack-maint-vue`, `oenotrack-etiquettes` (format des étiquettes QR, planche personnalisée `perso`, `contour`).
  - IndexedDB : documents joints (`45-docs`), instantanés de synchronisation et liens vers les dossiers choisis (`68f-drive` : clés `dossier`, `reseau`), points de restauration (`44c-garde`) — textes et documents chiffrés par le coffre (`coffreTexteChiffrer`, `coffreBlobChiffrer`, ceux d'avant 0.38 lus tels quels) ; `oenotrack-coffre` (enregistrement du coffre : clé maîtresse **non extractible**, clé de données emballée, mode).
- **Moteur rejoué.** La base stocke des *opérations*. `replay()` / `getR(db, date)` (`20-engine.js`) recalcule les lots, les portions, les volumes, les bouteilles sur lattes, les flux et les doses cumulées. On ne stocke jamais d'état dérivé.
  - L'interface affiche `campEtatR(db, camp)` (`30-store.js`) : état complet, sauf pour une campagne **antérieure** (`anterieure: true`, posé par `campCreate` quand elle finit avant toutes les autres), rejouée jusqu'à sa fin — elle démarre vide.
- **Synchronisation** (`32-sync.js`, `33-cloud.js`, `33c-dossier-reseau.js`, `34-cloud-fournisseurs.js`, `68f-drive.jsx`, `68g-stockage.jsx`, `68p-dossier-reseau.jsx`) :
  - fournisseurs : Google Drive, OneDrive, Dropbox, dossier de l'ordinateur (`dossier`) ou **dossier réseau de l'entreprise** (`reseau` : serveur interne, NAS, lecteur réseau, sans cloud externe) ; OAuth dans le navigateur (GIS pour Google, PKCE pour les autres) ; identifiants publics dans `config.json` ;
  - dossiers locaux et réseau : API File System Access (Chrome, Edge), connecteurs créés par `dossierFournisseur()` ; le connecteur `reseau` pose un jeton d'écriture `oenotrack-verrou.json` (expire après 30 s) ; le chemin commun (`settings.dossierReseau = { chemin, consigne, par, le }`, droit « Sauvegardes et Drive ») n'est qu'un repère : un navigateur ne peut pas ouvrir seul un chemin tapé ;
  - le dossier contient `oenotrack-base.json`, `documents/` et `historique/` ;
  - fusion à 3 voies élément par élément (`syncFusion`) : en cas de conflit, la version la plus récente est gardée et l'autre est journalisée ;
  - chiffrement optionnel AES-256-GCM avec PBKDF2 (`33b-chiffrement.js`, réglage commun).
- **Authentification et verrouillage** (`34-acces.js`, `34b-cles-acces.js`, `48-acces.jsx`) :
  - comptes et profils de droits par module (`aucun` / `lecture` / `ecriture`) et droits spéciaux ; mots de passe hachés en PBKDF2 ;
  - clés d'accès WebAuthn (`34b-cles-acces.js`, `48b-cles-acces.jsx`, 0.38.0-alpha.2 multiplateforme) ; verrouillage automatique ; code de secours :
    - options construites par le moteur (`clesOptionsCreation`, `clesOptionsConnexion`) : mode `appareil` (« ＋ Activer sur cet appareil », `authenticatorAttachment: 'platform'`, `residentKey: 'required'`, indice `client-device` — sans cela Android ne proposait que USB / NFC / autre appareil), `externe` (« ＋ Clé de sécurité ou autre téléphone », `cross-platform`), `auto` quand `isUserVerifyingPlatformAuthenticatorAvailable()` répond non ;
    - chaque clé garde `type` (`appareil` | `externe`) et `transports` (`CLES_TRANSPORTS`, repris dans `allowCredentials` à la connexion) ; anciennes clés sans ces champs inchangées ;
    - clé publique : `getPublicKey()`, sinon lue dans l'objet d'attestation (`cleDepuisAttestation` : CBOR → COSE → SPKI, ES256 / RS256) ;
    - jamais d'`await` entre le clic et `navigator.credentials.create/get` (Safari exige le geste de l'utilisateur) : disponibilité lue à l'affichage (`useClesIntegre`) ; une nouvelle demande annule la précédente (`cleSignal`, AbortController) ;
    - t55 : authentificateurs virtuels CDP `internal` (cet appareil) et `usb` (clé de sécurité) ;
  - `gardeDroits(avant, après, uid)` contrôle **toute** modification et alimente le journal d'audit.
- **Hors-ligne** : `sw.js` (précache) et `manifest.webmanifest` sont générés par `tools/paquet-web.py` et enregistrés dans `68j-installation.jsx` (PWA installable).
- **Imports protégés** (`16e-garde.js`) : le type réel du fichier est vérifié, les PDF sont désarmés, les macros refusées et les formules CSV neutralisées (`csvSansFormule`).
- **Entrée de moûts** (`entree_mout`, 0.35) :
  - plusieurs partenaires par citerne : `op.partenaires = [{ id, apporteurId, ref, lignes: [cleLigne…] }]` (seulement à partir de 2 partenaires) et `e.partId` sur chaque moût ; `op.apporteurId` (1er partenaire) et `op.ref` (n° de bon joints par « / ») restent remplis, et le partenaire est écrit dans chaque moût pour les versions antérieures ;
  - lecture : `moutPartenaires`, `lignePartId` (partId → clé de ligne → partenaire), `ligneRef`, `moutRefs` (`11-crus`) ; dans le formulaire, le 1er onglet garde ses valeurs dans `f.apporteurId` / `f.ref` (`moutOnglets`, `ongletDe`, `51-opspec`) ;
  - documents d'un partenaire : `doc.partId` (cible inchangée `{ type: 'op' }`) ; `DocsPanel` / `DocsAttente` acceptent `filtre`, `extra`, `inputLabel`, `catDefaut` ; bulletin déposé dans un onglet → `bulletinPourMouts` (`16f`) ;
  - analyses imposées : `moutModeleImpose` (« Moût · Débourbage », `m_mout`), plus de choix de modèle ;
  - volume à l'épalement : `jaugeEntreeCuve` (`15-baremes`), composant `HauteurCuve` (`57-jauge`), mesures gardées dans `op.jaugesCuves = [{ cle, contenantId, mesure, apres, volAvant, volL, baremeId }]`.
- **Bulletins d'analyses** (`16f-bulletins.js`, lecture commune `bulletinLireAnalyser` dans `64b-bulletins.jsx` : script puis IA si configurée) :
  - formats : liste, tableau (une colonne par échantillon), export en lignes, **rapport à plusieurs échantillons** (0.37, `bulletinColonnes` : une ligne par échantillon, en-tête de colonnes sur plusieurs lignes, lu d'après la position des mots et des cases du PDF / scan — `l.y`, `l.mots`, `l.elems` posés par `bulletinLignesDePages`), **format long** (0.37, `bulletinFormatLong` : une ligne par résultat, colonnes « Paramètre » / « Résultat ») ;
  - valeurs « x / incertitude » et « x ± y » lues par `bulletinNombre` ; chaque échantillon garde son n° de laboratoire `e.numero` (aussi demandé à l'IA : `numero_echantillon`, rapprochement `bulletinFusion` par ce n° d'abord) ;
  - entrée de moûts : bulletin déposé dans l'opération (tous les moûts) ou dans l'onglet d'un partenaire ; `bulletinPourMouts` note le rapprochement (`sur` : `lot`, `compartiment`, `chiffres`, `unique`, `ordre`) ; `bulletinAffectationDouteuse` → affectation guidée `BulletinMoutsGuide` (`52b-mout`) ; document joint au partenaire, ou à l'entrée (`partId` vide) s'il vise plusieurs partenaires.
- **Barèmes de jaugeage** (`15-baremes.js`, `57-jauge.jsx`) : à l'import, les pages d'une même cuve lues séparément sont réunies (`baremeGroupesContinus` : nom, certificat — `jaugeMeta` lit « N° R . X1 . 26 . 00042 » —, volume total, hauteurs à la suite, volumes dans le prolongement) ; fusion manuelle (`baremeFusionApercu`, `baremeFusionner` : `a.fusions = [{ id, nom, plage, le }]`, l'autre archivé avec `fusionneDans` ; `baremesListeFusion` avant enregistrement, dans l'import et dans la fiche d'un contenant).
- **Intrants et stocks** (0.36, `16p-intrants-stocks.js`, `65e-intrants-stocks.jsx`) :
  - régularisations manuelles : `db.regulStocks = [{ id, arrivageId, produitId, date, qty (signée), motif (REGUL_MOTIFS : inventaire, casse, perte, peremption, ecart, echantillon, retour, autre), compte?, restantAvant, notes, par, le }]` ; le rejeu les ajoute au restant du lot (`R.arrRegul`, `arrivalRest`) ; `intrantMouvements` = historique (réceptions, utilisations, régularisations, solde) ; « Autre » exige une note, les motifs de sortie sont toujours retirés ;
  - allergènes : `p.allergenesListe` (ids d'`ALLERGENES`, liste « à vérifier »), `p.allergenesAucun` ; `p.allergenes` devient « précisions » ; `allergenesTexte(p)` alimente la traçabilité et les fiches ;
  - revendications Oui / Non (bio, Demeter, personnalisées) : **même donnée que `db.regles`** (`autorise`), donc synchronisée d'office avec « Produits & règles par revendication » ; `produitSave(s.revendications)` → `revendicationsAppliquer` ; `p.usageBio` devient « précisions » ;
  - détection à l'import d'une FT / FDS (`ficheDetections` → clés `allergenesListe`, `rev:<id>`, `contactAlimentaire`) : propositions cochées dans la revue du dépôt (`detectionPropositions`), décochées si elles changeraient un choix vérifié ; reprise par `produitInfosAppliquer` (allergènes ajoutés, jamais retirés ; règle marquée « lu dans une FT / FDS déposée », à vérifier) ;
  - fiches récapitulatives à colonnes choisies (`RECAP_INTRANTS_COLS`, `recapIntrants`, `RecapSheet` : impression, PDF, HTML, CSV via `recapCsv`).
- **Produits de maintenance** (0.36, `16q-produits-maintenance.js`, `66f-produits-maintenance.jsx`, Équipements › Maintenance › Produits de maintenance) : `db.produitsMaintenance = [{ id, nom, fournisseur, fabricant, reference, usage, contactAlimentaire, caveVinif ('oui' | 'non' | ''), composition, stockage, unite, suiviStock, seuil, champs [{ label, valeur }], fdsNonRequise, actif, notes }]` ; stock recalculé depuis `db.mouvementsMaintenance = [{ id, produitId, date, type (entree | sortie | regul), qty, motif, numLot, compte?, notes, par, le }]`, jamais négatif ; documents `cible { type: 'produitMaintenance' }` (FDS, FT, attestation contact alimentaire), même dépôt groupé que les intrants ; fiche récapitulative `recapMaintenance`. Droits : module `equipements` ; régularisations d'intrants : module `intrants`.
- **IA optionnelle** (`17-ia.js`, `68k-ia.jsx`) : Claude, OpenAI, Gemini, Mistral, OpenRouter ou service compatible :
  - clé **personnelle** dans le coffre de l'appareil (secret `iaCles`, chiffré) ou en mémoire seulement (`memoire`) ; jamais dans la base, la synchronisation ou les sauvegardes ;
  - **espace de travail** (0.38) : `db.settings.ia = { fournisseur, modele, url, cle, cleId, masque, perso: 'tous' | 'aucun' | 'choisis', persoUtilisateurs, par, le }` réglé par les administrateurs (`gardeDroits` : droit « utilisateurs ») ; `cle` = enveloppe `oenotrack-chiffre` chiffrée avec la **clé de l'équipe** (chiffrement des sauvegardes obligatoire), déchiffrée en mémoire par `useIaEspace` (App) → `_iaEspace` ; rechiffrée au changement du mot de passe de l'équipe (`iaCleReChiffrer`) ;
  - `iaPersoAutorise(db, uid)` (sans identifiants : oui ; administrateurs : toujours) ; `iaActive()` choisit la clé (`source` : `auto` / `perso` / `espace`).
- **Étiquettes QR** (`60e-qr.jsx`, `16j-cave.js`) : A4 24 × 70 × 37 mm, A6, et planche A4 personnalisée (`etiqPersoNorm`, `etiqPersoMise` : colonnes × lignes, largeur × hauteur, marges, espacements, `ETIQ_PERSO_MODELES` « à vérifier »).
- **Impression des couleurs** : `print-color-adjust: exact` sur tout en `@media print` (`head.html`) et dans les fichiers HTML exportés (fiches, rapports) — les fonds s'impriment même sans « graphiques d'arrière-plan ».

### Sécurité (architecture sans serveur, 0.38)

- **Chiffrement au repos sur l'appareil** (`33d-coffre.js`, `68q-coffre.jsx`) : AES-256-GCM avec une clé de données (DEK) emballée par une clé maîtresse non extractible (IndexedDB `oenotrack-coffre`, mode `appareil`) ou par une clé PBKDF2 (600 000 it.) d'un **mot de passe de l'appareil** demandé à l'ouverture (mode `mdp`, `CoffrePorte` avant `App`). Lecture synchrone de la copie claire en mémoire (`coffreLire`, `coffreEcrire` : chiffrement en arrière-plan, événement `oenotrack-stockage`). Données authentifiées : `oenotrack-coffre|id|clé de stockage`.
  - Migration transparente : base et secrets en clair (versions antérieures, autre voie) chiffrés à l'ouverture après relecture ; données écrites à côté de l'enveloppe par une version antérieure réunies (`coffreAncien` + `syncFusion(null, …)`).
  - Clé perdue : écran « illisible », rien n'est écrasé, `coffreRepartir` met l'enveloppe de côté (`oenotrack-db-v2-illisible-<date>`).
  - Sans Web Crypto ni IndexedDB (page en http hors localhost) : rien n'est chiffré, comme avant (signalé dans Paramètres).
- **Hors de l'appareil** : chiffrement de l'équipe (`33b`) pour sauvegardes, Drive, dossier partagé ; sa clé est désormais dans le coffre (plus en clair).
- **Clé d'API** : coffre ou mémoire ; clé commune chiffrée avec la clé de l'équipe ; CSP `connect-src` limitée (exfiltration par un script injecté). Limite connue : une extension compromise s'exécutant dans la page peut toujours utiliser une clé déchiffrée — l'option « session seulement » et la clé commune révocable réduisent l'exposition.
- **Chaîne d'approvisionnement** : `tools/paquet-web.py` copie les bibliothèques et polices (Fontsource) dans `vendor/` en vérifiant les empreintes, écrit la CSP (`script-src 'self'` + empreintes SHA-256 des scripts en ligne + `'wasm-unsafe-eval'` + GIS ; `connect-src` : services d'Œnotrack + `localhost` + `config.json › securite.connexions`), et le service worker met `vendor/` en cache (hors-ligne).

## 2. Structure

```
src/        concaténé dans l'ordre alphabétique → esbuild → injecté dans src/head.html (styles + @media print)
  1x–3x *.js   MOTEUR sans interface (testable en Node)
  4x–9x *.jsx  INTERFACE
test/       engine.test.js (moteur) · tNN.mjs (interface Playwright, harnais ui.mjs) · fixtures/ (une base fictive par version)
            anciennes/<version>/ (moteurs gelés, pour les tests de compatibilité)
tools/      paquet-web.py (site + zip), depot-github.py (copie publique), changelog.mjs, textes-a-traduire.cjs, fixture-X.cjs
dist/       sortie (non versionnée)
```

| Domaine | Moteur | Interface |
|---|---|---|
| Socle, listes, constantes, `APP_VERSION`, `CHANGELOG` | `10-core` | `40-ui` (composants), `41-forms` |
| Crus et échelle des crus, vin (stades, couleurs, échelles) | `11-crus`, `12-vin` | `68c-vin-listes` |
| Catalogue des opérations, formulaires | `13-operations`, `14-formulaires` | `51-opspec`, `52-opform`, `62-ops`, `68e-operations` |
| Barèmes de jaugeage (épalement, tables réunies et fusionnées) | `15-baremes` | `57-jauge` |
| Pressoir (pesées, marcs, carnet), profil régional | `19-pressoir`, `16o-profils` | `60b-pressoir`, `68o-profil` |
| Rejeu, assemblages, tirage, dégorgement | `20-engine` | `60-cuverie`, `61-lotsheet`, `63-tirage` |
| Intrants, catalogues, plafonds, SO₂, cumuls | `16b`, `16k`, `16l` | `65*`, `61c-cumul` |
| Régularisations de stock, allergènes, revendications Oui / Non, fiches récapitulatives | `16p-intrants-stocks` | `65e-intrants-stocks` |
| Analyses et bulletins (rapports à plusieurs échantillons, format long, affectation aux moûts) | `16f-bulletins` | `64*`, `52b-mout` (`BulletinMoutsGuide`) |
| Hygiène (HACCP), équipements | `16`, `16c`, `16h`, `16i` | `66*` |
| Produits de maintenance (catalogue, stock, FT / FDS) | `16q-produits-maintenance` | `66f-produits-maintenance` |
| Cave au quotidien (fiches, fermentation, QR) | `16j`, `10b-qr` | `60c`, `60d`, `60e` |
| Schémas de vinification | `16m-schemas` | `61e-schemas` |
| DRM / DRA (XML DTI+ CIEL, CIVC) | `16n-drm` | `67b-drm` |
| Traçabilité, audits | `25*`, `27-audits` | `69*` |
| Stockage, CRUD, campagnes, droits | `30-store`, `31-crud`, `34-acces` | `68d`, `68-params` (campagnes), `48-acces` |
| Langues (6) | `17b-langues`, tables `17c…17w-trad-*` | `40c-langue` (traducteur DOM) |
| Impression, PDF | `49-pdf` | `70-report`, `61d-visuel`, `46-fiches` |
| Navigation, onglets, modules, onglet d'ouverture | `31-crud` (`MODULES_DEFAUT`, `MODULES_DANS`, `ONGLETS_GROUPES`, `ongletOuverture`) | `90-app` (`TABS_REG`, `ONGLET_GROUPE_DEFS`), `68h-modules` |
| Synchronisation, dossier réseau de l'entreprise | `32-sync`, `33-cloud`, `33c-dossier-reseau`, `34-cloud-fournisseurs` | `68f-drive`, `68g-stockage`, `68p-dossier-reseau` |
| Coffre de l'appareil (chiffrement au repos, mot de passe de l'appareil) | `33d-coffre` | `68q-coffre` (`CoffrePorte`, `CoffreCard`) |
| Bibliothèques vérifiées (versions, empreintes, vendor/) | `16r-bibliotheques` | `49-pdf`, `57-jauge` ; `build.mjs`, `tools/paquet-web.py` |
| Assistant IA (clés personnelles, espace de travail, droits) | `17-ia` | `68k-ia` (`IaEspaceCard`, `useIaEspace`) |
| Étiquettes QR (A4, A6, planche personnalisée) | `16j-cave` | `60e-qr` |

### Navigation (0.34.0-alpha.1)

- **Onglets regroupés** : `ONGLETS_GROUPES = { vinification: ['cuverie', 'ops', 'previsions'] }`. L'onglet « Vinification » prend la place du premier de ses modules affichés ; ses modules deviennent des sous-onglets (ids `#tab-cuverie`, `#tab-ops`, `#tab-previsions` gardés, barre `[data-onglet-groupe]`). Chaque module garde son identifiant, son activation, ses droits et sa place dans `modulesOrdre` : `nav.tab` reste un identifiant de **module** (`setTab('ops')` marche toujours) ; le dernier sous-onglet ouvert est retenu. Une version antérieure affiche simplement les trois onglets.
- **Onglet d'ouverture** : `settings.ongletDefaut` (onglet ou groupe ; absent = premier onglet de la barre), réglé dans Paramètres › Modules, indépendant de l'ordre. Appliqué au démarrage et à chaque connexion ; un déverrouillage de la même session garde la page en cours (formulaire intact) ; l'activation des identifiants reste dans Paramètres (`connecter(id, garder, { rester: true })`).

## 3. Règles métier et contraintes strictes

- **Rétrocompatibilité totale** :
  - toute base, de toute version, s'ouvre dans toutes les autres **sans rien perdre** ;
  - `normalizeDb` ne supprime jamais un champ ni une clé inconnus ;
  - une nouveauté = de nouveaux champs ou de nouvelles collections, jamais une rupture ;
  - les campagnes figées ne sont pas modifiées ; les pesées et marcs validés ne changent qu'avec un motif tracé ;
  - une campagne créée avant les campagnes existantes démarre vide (`anterieure: true`) : jamais de lots ni de volumes repris des campagnes suivantes, et leur état ne change pas ;
  - à chaque version : une fixture `test/fixtures/base-X.json`, le moteur précédent gelé dans `test/anciennes/`, et un bloc de compatibilité dans `engine.test.js` (ouvrir, modifier et synchroniser dans les deux sens).
- **Sécurité** : jamais de secret en clair dans le navigateur ni dans la base (coffre de l'appareil, clé de l'équipe) ; jamais de bibliothèque non vérifiée ; un nouvel hôte appelé par l'application doit être ajouté à `CONNECT` de `tools/paquet-web.py` (CSP).
- **Synchronisation** : rien n'est jamais perdu. Un conflit se résout en gardant la version la plus récente et en journalisant l'autre. Toute nouvelle collection est déclarée dans `SYNC_NOMS`, et dans `GARDE_CLES` ou `GARDE_PARAMS`.
- **Vocabulaire champenois exact** (ne pas traduire ni « simplifier » en français) :
  - vendange et pressurage : moût, débourbage, bourbes, lies, cuvée, 1ère et 2ème taille, rebêches, marc, carnet de pressoir, registre des pesées ;
  - cuverie et stocks : épalement / barème de jaugeage, revendication, intrants, vins clairs, vins de réserve, échelle des crus ;
  - prise de mousse et expédition : tirage (mixtion), liqueur de tirage et d'expédition, sur lattes, remuage, dégorgement, DAE, DRM, CRD.
- **Données réglementaires** : toute valeur d'exemple (plafonds, enrichissement, codes INAO ou CIVC, schémas) est marquée **« à vérifier »** et n'est jamais présentée comme officielle. Ne pas intégrer les pourcentages de l'échelle des crus.
- **Impression** :
  - préserver les mises en page et couleurs `@media print` de `head.html` et les rapports (`ReportHead`, formes logigramme / frise / tableau) ;
  - garder l'impression directe par zone (`#zone-impression`, `html.impression-zone`), les pages `@page` A4 portrait / paysage / A3, `.no-print`, et les sauts de page `.rpt-item` / `.fiche` ;
  - l'orientation s'écrit `paysage` / `portrait`, jamais `landscape` ;
  - les couleurs s'impriment telles qu'à l'écran : garder `print-color-adjust: exact` (règle globale de `@media print` et en-tête des HTML exportés).
- **Traductions obligatoires** : toute modification d'interface est traduite dans les 6 langues (fr, en, es, it, de, pt), dans une nouvelle table `17x-trad-NNN.js` :
  - lignes exactes, ou `TRAD_MOTIFS` avec `{a}`…`{j}` (éviter `{b}` = « s » de pluriel : reformuler) ;
  - les données sont marquées `translate="no"` (libellés de produits, lots, appellations).
- **Confidentialité** :
  - NOTES.md, `test/t37.mjs`, les PDF et données réelles de l'exploitation et le schéma XSD des douanes ne vont **jamais** dans le dépôt public ni dans les fixtures (données fictives uniquement) ;
  - la clé de chiffrement et les clés d'API personnelles restent sur l'appareil (coffre) ; la clé IA commune n'entre dans la base que chiffrée avec la clé de l'équipe.

## 4. Conventions de développement

```bash
node build.mjs [--dev|--silencieux]          # → dist/cuverie.html
node test/engine.test.js                     # moteur (OENOTRACK_XSD_DTI=chemin.xsd : validation xmllint de la DRM)
OENOTRACK_TESTS=/tmp/x node test/tNN.mjs     # un test d'interface (relancer toute la suite tNN avant publication)
node tools/textes-a-traduire.cjs [fichiers]  # textes non traduits (comparer avec la version précédente)
node tools/changelog.mjs                     # CHANGELOG.md depuis CHANGELOG de 10-core.js
python3 tools/paquet-web.py                  # site + zip (dist/web, avec vendor/ et CSP) ; à la livraison, recopier index.html, sw.js, licence.html et vendor/ à la racine
python3 tools/depot-github.py <dépôt>        # copie publique (sans fichiers privés)
```

- **Versions** `X.Y.Z-étiquette.N` :
  - MAJEURE seulement en cas de rupture profonde (jamais pour une fonctionnalité ou un changement graphique) ;
  - mineure pour une nouvelle fonctionnalité ; correctif pour une correction ;
  - une nouveauté repart à `-alpha.1` ; une correction de la version en test passe à `-alpha.N+1` ;
  - chaque réponse de livraison annonce « ancienne → nouvelle version » et une justification courte.
- **Style de code** :
  - JS sans modules ni import : fonctions et constantes globales, uniques dans tout `src/` (préfixer : `drm*`, `profil*`, `schema*`…) ;
  - le moteur renvoie `okr({...})` ou `fail('message en français.')` ;
  - modifications par `act((d) => fn(d, …), 'toast')` (copie, contrôle des droits, sauvegarde) ;
  - tout en français (identifiants et commentaires) ; un en-tête de commentaire par fichier, avec sa version ;
  - un fichier ajouté conserve l'ordre alphabétique de concaténation.
- **Tests** :
  - tout nouveau comportement du moteur a son bloc dans `engine.test.js` (exposer les fonctions dans la liste `return {…}` et ajouter le fichier à `files`) ;
  - toute nouvelle interface a un `tNN.mjs` (le CSS met en capitales `th`, `.lbl` et les pastilles : utiliser des regex `/i`) ; le harnais `ui.mjs` passe par « Vinification » quand un test clique `#tab-cuverie` / `#tab-ops` / `#tab-previsions` depuis un autre onglet ;
  - outils attendus dans `/opt/npm-tools/node_modules` : esbuild, tailwindcss@3.4.17, react@18.3.1, react-dom@18.3.1, pdf-lib@1.17.1, xlsx@0.18.5, pdfjs-dist@6.2.108, tesseract.js@5.1.1, tesseract.js-core, @tesseract.js-data/fra, @fontsource/* (16 familles), jszip, typescript, playwright (lien vers l'installation globale) ;
  - harnais `ui.mjs` (0.38) : attributs `integrity` retirés et propriété neutralisée (copies de test), sauf `open({ sri: true })` ; `localStorage.getItem` d'une enveloppe du coffre rend la copie claire (`window.__coffreClair`, crochet posé seulement si `window.__oenotrackTests`) ; `localStorage.__brut(k)` lit l'enveloppe ; le coffre n'est actif qu'en `https: true` (Web Crypto) ;
  - `t38`, `t73` testent le paquet web : lancer `python3 tools/paquet-web.py` avant ;
  - vérifier aussi l'absence de « ✗ » dans les journaux.
- **Collaboration** :
  - carte blanche sur la technique ;
  - pour l'ergonomie, le métier ou la présentation, poser des questions à choix avant d'implémenter ;
  - livrer par lots en listant les choix par défaut retenus.
- **Git** :
  - une branche par version (`oenotrack-X.Y.Z-alpha.N`) ; une PR vers `main`, que l'utilisateur fusionne ;
  - pas de force-push ;
  - commits signés `Co-Authored-By: Claude …`.
