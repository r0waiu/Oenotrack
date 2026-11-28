/* ============ PAGE D'ACCUEIL (0.23.0-alpha.1 ; textes mis à jour en 0.47.0-alpha.3) : présentation publique d'Œnotrack ============
   Nom exact, ce que fait l'application, comment elle fonctionne, ce qu'elle fait de vos données, liens vers les informations légales.
   Affichée à la toute première ouverture sur un appareil (accueilDecision, 18-mentions.js) jusqu'au clic sur « Ouvrir Œnotrack », puis
   seulement depuis le lien « Présentation » du pied de page. Sert aussi de page d'accueil publique pour les écrans de connexion
   Google, Microsoft et Dropbox (même site que la politique de confidentialité : …/#confidentialite). */
const ACCUEIL_FONCTIONS = [
  ['🍇', 'Pressoir et vendange', 'Registre des pesées, carnet et bons de pressoir (cuvée, tailles, rebêches), marcs et rendements, entrées de moûts, partenaires et analyses par lot.'],
  ['🛢️', 'Cuverie et lots', 'Plan de cave, cuves, fûts et autres contenants avec leurs barèmes de jaugeage, lots et leur composition (crus, parcelles, millésimes, revendications).'],
  ['⚙️', 'Opérations, tous les vins', 'Champagne et vins tranquilles, rouges, rosés ou doux : débourbage, macérations, pigeage, élevage sous bois, stabilisation, électrodialyse, assemblages… avec des formulaires adaptables.'],
  ['🗂️', 'Plan de vinification', 'Votre instruction de travail par cépage, revendication et fraction, importée d’un tableur et modifiable directement ; ses étapes sont proposées à la création de chaque lot.'],
  ['🍾', 'Tirage et prise de mousse', 'Levains et liqueurs, chantiers de tirage et cuvées prévues, cuve de mixtion ou pompe doseuse, fournitures, VRTP, déclarations préalable et de fin de tirage.'],
  ['🥂', 'Cave et dégorgement', 'Bouteilles sur lattes, remuage, dégorgement et liqueur d’expédition, habillage et mise en carton ; codification des lots selon vos propres règles.'],
  ['⚖️', 'Intrants et cahiers des charges', 'Stocks avec fiches techniques et FDS, allergènes, règles de l’UE, de l’appellation et des labels (bio, Demeter…), plafonds de SO₂ et conformité des lots.'],
  ['🧪', 'Analyses, hygiène, équipements', 'Bulletins de laboratoire lus automatiquement, plan HACCP et journal d’hygiène, équipements, maintenance et ses produits.'],
  ['🗺️', 'Votre vignoble', 'Région sur la carte de France, appellations cochées dans le référentiel officiel (1 692 appellations, dénominations, Vin de France), types de vins déduits : Œnotrack s’adapte aussitôt à vos vins.'],
  ['🔎', 'Traçabilité, registres, DRM', 'Traçabilité ascendante et descendante, registres et exports, DRM et DRA pour les douanes, fiches d’enregistrement à imprimer.'],
  ['👥', 'À plusieurs', 'Opérateurs, comptes et droits par profil, clés d’accès, partage entre appareils par votre Drive ou par le dossier réseau de l’entreprise.'],
  ['🧭', 'Prise en main guidée', 'Quelques questions configurent Œnotrack pour votre exploitation ; une visite guidée présente chaque module. En six langues.'],
];
function AccueilPage({ revoir, onOuvrir, onLegal }) {
  let hote = ''; try { hote = window.location.hostname; } catch (e) { /* ignoré */ }
  const ouvrir = (cls) => <Btn kind="primary" className={cls} onClick={onOuvrir} data-accueil-ouvrir="">{revoir ? 'Revenir à Œnotrack' : 'Ouvrir Œnotrack'}</Btn>;
  return (
    <div className="accueil" data-accueil={revoir ? 'revoir' : 'premier'}>
      <main className="accueil-page" aria-labelledby="accueil-titre">
        <header className="accueil-tete">
          <Logo size={64} />
          <div className="min-w-0">
            <h1 id="accueil-titre" className="accueil-titre">Œnotrack</h1>
            <p className="accueil-sous">Traçabilité de cuverie et de chai, pour les vignerons</p>
          </div>
          <LangueChoix className="accueil-langue" />
        </header>
        <p className="accueil-intro">Œnotrack est un logiciel <b>libre et gratuit</b> qui aide à enregistrer et à tracer le travail de la cave, de l’entrée de la vendange jusqu’à la bouteille.</p>
        <div className="accueil-action">{ouvrir('accueil-btn')}<span className="text-sm text-ink2">{revoir ? 'Vos données sont restées telles quelles.' : 'Au premier lancement, un jeu de données d’exemple permet de tout essayer.'}</span></div>
        <section aria-labelledby="accueil-fonctions"><h2 id="accueil-fonctions" className="accueil-h2">Ce que fait Œnotrack</h2>
          <ul className="accueil-grille">{ACCUEIL_FONCTIONS.map(([ic, t, d]) => <li key={t} className="accueil-carte"><span className="accueil-ic" aria-hidden="true">{ic}</span><b>{t}</b><span>{d}</span></li>)}</ul>
        </section>
        <section aria-labelledby="accueil-comment"><h2 id="accueil-comment" className="accueil-h2">Comment ça marche</h2>
          <ol className="accueil-etapes">
            <li><b>Dans votre navigateur.</b> Œnotrack s’ouvre sur ordinateur, tablette ou téléphone, sans compte à créer. Il s’installe comme une application et fonctionne aussi sans connexion.</li>
            <li><b>Prêt en quelques minutes.</b> Une configuration guidée vous demande votre région, vos types de vins, vos revendications et vos modules, puis une visite guidée vous montre où tout se trouve.</li>
            <li><b>Vos données restent chez vous.</b> Tout ce que vous saisissez est enregistré et chiffré sur votre appareil, jamais chez l’éditeur. Une sauvegarde complète tient dans un seul fichier.</li>
            <li><b>À plusieurs, si vous le souhaitez.</b> Reliez Œnotrack à votre Google Drive, OneDrive ou Dropbox, ou au dossier réseau de l’entreprise : il enregistre ses fichiers dans le dossier que vous choisissez, sur votre propre compte, et réunit les saisies de chacun.</li>
            <li><b>Assistant IA facultatif.</b> Avec votre propre compte et votre clé (Claude, ChatGPT, Gemini, Mistral…) ou un modèle installé sur votre ordinateur : dictez une opération, photographiez une étiquette, un ticket de pesée ou une fiche remplie, posez une question. L’IA ne fait que proposer : vous relisez avant d’enregistrer, et chaque envoi reste à votre main.</li>
          </ol>
        </section>
        <section className="accueil-donnees" aria-labelledby="accueil-donnees"><h2 id="accueil-donnees" className="accueil-h2">Vos données</h2>
          <p>Œnotrack ne reçoit aucune de vos données : pas de publicité, pas de mesure d’audience, pas de cookie. Si vous le reliez à votre Google Drive (ou à OneDrive, Dropbox), cet accès sert uniquement à lire et écrire les fichiers d’Œnotrack dans le dossier choisi, directement depuis votre navigateur ; vous pouvez le retirer à tout moment. Détails dans la <button type="button" className="linkish" onClick={() => onLegal('confidentialite')}>politique de confidentialité</button>.</p>
        </section>
        <div className="accueil-action accueil-action-bas">{ouvrir('')}</div>
      </main>
      <footer className="accueil-pied">
        <LegalLiens onOuvrir={onLegal} />
        <span>Logiciel libre (GNU AGPL v3) · version de test {APP_VERSION}{siteOfficielIci(hote) ? '' : <> · site officiel : <a className="linkish" href={OENOTRACK_SITE} target="_blank" rel="noopener noreferrer">{OENOTRACK_SITE.replace(/^https:\/\//, '')}</a></>}</span>
      </footer>
    </div>
  );
}
