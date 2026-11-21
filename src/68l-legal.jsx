/* ============ INFORMATIONS LÉGALES (0.21.0-alpha.1, réglage retiré en 0.22.0-alpha.1) : Mentions légales, Confidentialité, CGU, Code source & licence, Réglementation ============
   Moteur : 18-mentions.js. Les coordonnées du site (éditeur, hébergeur, contact) viennent de config.json (rubrique « mentions », déposé
   à côté d'index.html) : elles seront ajoutées à la mise en ligne du site officiel ; une copie mise en ligne par quelqu'un d'autre y met les siennes.
   Pages ouvertes depuis le pied de page, l'écran de connexion ou une adresse directe : …/#mentions-legales, #confidentialite, #cgu, #licence, #reglementation. */
const MENTIONS_KEY = 'oenotrack-mentions';
try { window.localStorage.removeItem(MENTIONS_KEY); } catch (e) { /* ancien réglage de l'appareil (0.21.0-alpha.1), retiré */ }
const mentionsDuFichier = () => ((CLOUD_CONFIG_FICHIER && typeof CLOUD_CONFIG_FICHIER === 'object' && CLOUD_CONFIG_FICHIER.mentions) || null);
const mentionsActives = () => mentionsFusion(mentionsDuFichier());
// relit les mentions quand config.json arrive
function useMentions() {
  const [, setN] = useState(0);
  useEffect(() => { const f = () => setN((x) => x + 1); window.addEventListener('oenotrack-config', f); return () => window.removeEventListener('oenotrack-config', f); }, []);
  return mentionsActives();
}
const legalCadre = () => { try { return window.self !== window.top; } catch (e) { return true; } };
// code source de cette version, déposé avec le site (paquet « Œnotrack en ligne » : code-source.zip)
function useCodeSourceLocal() {
  const [ok, setOk] = useState(false);
  useEffect(() => { if (legalCadre() || !/^https?:$/.test(window.location.protocol)) return undefined; let vivant = true; fetch('code-source.zip', { method: 'HEAD', cache: 'no-store' }).then((r) => { if (vivant) setOk(!!r.ok && !/text\/html/.test(r.headers.get('content-type') || '')); }).catch(() => { /* absent */ }); return () => { vivant = false; }; }, []);
  return ok;
}
const Ext = ({ href, children }) => (href ? <a className="linkish break-words" href={href} target="_blank" rel="noopener noreferrer">{children || href}</a> : null);
const Mail = ({ m }) => (m.editeur.email ? <a className="linkish" href={`mailto:${m.editeur.email}`}>{m.editeur.email}</a> : <span className="legal-vide">adresse de contact à compléter</span>);
const AComp = ({ children }) => <span className="legal-vide">{children || 'à compléter'}</span>;
const nomSite = (m) => (m.site ? lienCourt(m.site).replace(/\/…$/, '') : 'ce site');

/* ---------- les textes ---------- */
function MentionsDoc({ m }) {
  const e = m.editeur; const h = m.hebergeur; const manque = mentionsManquantes(m); const part = e.statut === 'particulier';
  return (
    <div className="legal-doc" data-legal="mentions">
      <h2>Mentions légales</h2>
      {manque.length ? <div className="legal-note">Mentions en cours de mise en place : {manque.join(', ')}.</div> : null}
      <p>{m.site ? <><Ext href={m.site}>{nomSite(m)}</Ext> permet</> : 'Ce site permet'} d’utiliser Œnotrack, logiciel libre de traçabilité de cuverie et de chai.</p>
      <h3>Éditeur du site</h3>
      {part ? <p>Site édité à titre non professionnel{e.nom ? <> par <b>{e.nom}</b></> : null}.{!e.nom ? ' Conformément à l’article 1-1 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique, ses coordonnées ont été communiquées à l’hébergeur.' : ''}{e.adresse ? <> Adresse : {e.adresse}.</> : null}</p>
        : <p><b>{e.nom || <AComp>nom ou raison sociale</AComp>}</b>{e.statut === 'association' ? ' (association)' : ''}<br />{e.adresse || <AComp>adresse</AComp>}{e.tel ? <><br />Téléphone : {e.tel}</> : e.statut === 'pro' ? <><br />Téléphone : <AComp /></> : null}{e.immatriculation ? <><br />{e.immatriculation}</> : null}</p>}
      <p>Contact : <Mail m={m} /></p>
      <p>Directeur de la publication : {e.directeur || e.nom || (part ? 'l’éditeur du site' : <AComp />)}</p>
      <h3>Hébergeur</h3>
      {h.nom ? <p><b>{h.nom}</b>{h.details ? <><br />{h.details}</> : null}<br />{h.adresse || <AComp>adresse</AComp>}{h.tel ? <><br />Téléphone : {h.tel}</> : null}{h.web ? <><br /><Ext href={h.web}>{lienCourt(h.web).replace(/\/…$/, '')}</Ext></> : null}</p> : <p><AComp>hébergeur du site à compléter</AComp></p>}
      {legalCadre() ? <p className="legal-petit">Cette copie d’Œnotrack est affichée dans claude.ai (Anthropic) : les mentions ci-dessus concernent le site en ligne.</p> : null}
      <h3>Propriété intellectuelle</h3>
      <p>Le code d’Œnotrack est un logiciel libre, diffusé sous licence GNU Affero General Public License version 3 ou ultérieure (voir « Code source &amp; licence »). Le nom « Œnotrack » et son logo ne sont pas couverts par cette licence. Les composants d’autres auteurs restent sous leur propre licence.</p>
      <h3>Données personnelles</h3>
      <p>Œnotrack enregistre vos données dans votre navigateur, pas chez l’éditeur : voir la page « Confidentialité ».</p>
      <h3>Signaler un problème</h3>
      <p>Erreur, contenu illicite, faille de sécurité : écrivez à <Mail m={m} />.</p>
      <p className="legal-petit">Mise à jour : {fmtDate(m.maj || LEGAL_DATE)}.</p>
    </div>
  );
}
function ConfidentialiteDoc({ m }) {
  const h = m.hebergeur;
  return (
    <div className="legal-doc" data-legal="confidentialite">
      <h2>Politique de confidentialité</h2>
      <div className="legal-bref"><b>En bref</b><ul>
        <li>Œnotrack fonctionne dans votre navigateur : tout ce que vous saisissez (contenants, lots, opérations, partenaires, opérateurs, analyses, documents…) est enregistré <b>sur votre appareil</b>, pas sur un serveur de l’éditeur.</li>
        <li>L’éditeur ne reçoit, ne voit ni ne conserve aucune de ces données. Il n’y a pas de compte à créer chez lui.</li>
        <li>Pas de publicité, pas de mesure d’audience, pas de cookie.</li>
        <li>Vos données ne quittent votre appareil que si vous le décidez : sauvegarde, synchronisation avec votre Drive, assistant IA.</li>
      </ul></div>
      <h3>1. Qui est responsable ?</h3>
      <p>Pour la mise à disposition du site : son éditeur{m.editeur.nom ? <> ({m.editeur.nom})</> : null}, joignable à <Mail m={m} />. Pour les données que vous saisissez dans Œnotrack : vous-même (votre exploitation), qui les enregistrez sur vos appareils et décidez de leur usage.</p>
      <h3>2. Données techniques de connexion</h3>
      <p>Pour vous envoyer le site, l’hébergeur{h.nom ? <> ({h.nom})</> : null} reçoit des données techniques : adresse IP, date et heure, fichier demandé, type de navigateur. Il les conserve pour la sécurité et le bon fonctionnement du service et pour ses obligations légales, selon sa propre politique. L’éditeur ne s’en sert à aucune autre fin. Base légale : intérêt légitime (faire fonctionner et sécuriser le site).{mentionsHorsUE(m) ? ' Cet hébergeur est situé hors de l’Union européenne.' : ''}</p>
      <h3>3. Services sollicités au chargement</h3>
      <p>Certaines bibliothèques et polices sont téléchargées depuis des services spécialisés, qui reçoivent alors votre adresse IP et des informations sur votre navigateur ; ils peuvent être situés hors de l’Union européenne :</p>
      <ul>{SERVICES_CHARGEMENT.map((s) => <li key={s.nom}><b>{s.nom}</b> ({s.societe}) : {s.quoi}, {s.quand}.</li>)}</ul>
      <p>Base légale : intérêt légitime (faire fonctionner l’application). L’application installée les garde ensuite en mémoire sur l’appareil.</p>
      <h3>4. Vos données dans Œnotrack</h3>
      <p>Elles sont enregistrées dans le stockage de votre navigateur (localStorage et IndexedDB pour les documents joints), sur l’appareil utilisé. Elles n’y sont pas chiffrées : protégez l’accès à l’appareil et à votre session. Si vous activez les identifiants (Paramètres › Utilisateurs &amp; droits), les mots de passe ne sont jamais conservés, seule leur empreinte l’est (PBKDF2). Durée : jusqu’à ce que vous les effaciez (« Réinitialiser », suppression des données du navigateur). Les sauvegardes sont des fichiers que vous gardez sous votre responsabilité.</p>
      <h3>5. Si vous enregistrez des personnes</h3>
      <p>Opérateurs, partenaires (apporteurs), utilisateurs : vous êtes responsable de ces données personnelles. Informez les personnes concernées, n’enregistrez que le nécessaire, supprimez ce qui ne sert plus et protégez vos appareils. Œnotrack permet de consulter, corriger, exporter et supprimer ces informations.</p>
      <h3>6. Synchronisation dans votre Drive (facultatif)</h3>
      <p>Si vous reliez Œnotrack à votre Google Drive, Microsoft OneDrive ou Dropbox, les données sont envoyées directement de votre navigateur vers <b>votre propre compte</b> chez ce service, selon ses conditions ; ces services peuvent traiter les données hors de l’Union européenne. Les autorisations de connexion restent sur votre appareil. L’éditeur n’y a pas accès.</p>
      <p data-legal-drive=""><b>Ce qu’Œnotrack fait de l’accès à votre compte</b> Google, Microsoft ou Dropbox, donné dans la fenêtre de connexion du service :</p>
      <ul>
        <li>il lit le nom et l’adresse e-mail du compte, pour indiquer à quel compte il est relié ;</li>
        <li>il affiche la liste de vos dossiers (et de ceux partagés avec vous) pour que vous choisissiez le sien ;</li>
        <li>dans ce dossier seulement, il lit et écrit ses propres fichiers : les données, leurs copies quotidiennes (dossier « historique ») et les documents joints.</li>
      </ul>
      <p>Il n’ouvre pas vos autres fichiers. Ces données circulent seulement entre votre navigateur et votre compte : elles ne sont transmises ni à l’éditeur ni à des tiers (sauf un document que vous demandez vous-même à votre assistant IA de lire, voir 7), ne servent pas à la publicité, ni à entraîner un modèle d’intelligence artificielle, et ne sont lues par personne d’autre que vous et les personnes avec qui vous partagez le dossier. Vous pouvez retirer cet accès à tout moment : Paramètres › 💾 Sauvegarde &amp; Drive › « Se déconnecter », et dans les réglages de sécurité de votre compte (applications connectées).</p>
      <p>L’utilisation par Œnotrack des informations reçues des API Google respecte la <Ext href="https://developers.google.com/terms/api-services-user-data-policy">Politique relative aux données utilisateur des services d’API Google</Ext>, y compris les exigences d’utilisation limitée.</p>
      <h3>7. Assistant IA (facultatif)</h3>
      <p>Si vous configurez l’assistant (Paramètres › 🤖 Assistant IA) avec <b>votre propre compte et votre clé</b> chez Anthropic (Claude), OpenAI (ChatGPT), Google (Gemini), Mistral AI, OpenRouter ou un autre service, Œnotrack lui envoie, directement depuis votre navigateur et seulement quand vous le demandez (ou pour la veille automatique, si vous l’activez) : le début du texte d’un document fournisseur et la liste des noms de vos produits (identification d’un document), ou le nom d’un produit, son fournisseur, sa référence et les dates de vos fiches (veille des FT et FDS). Jamais vos volumes, lots, cuves, analyses ni votre traçabilité. Le service les traite selon ses conditions, éventuellement hors de l’Union européenne (États-Unis notamment). La clé reste sur votre appareil ; l’éditeur n’y a pas accès.</p>
      <h3>8. Cookies et stockage local</h3>
      <p>Œnotrack n’utilise <b>aucun cookie</b>. Il garde dans votre navigateur seulement ce qui est nécessaire au service que vous utilisez : votre base et vos documents ; vos préférences (thème, affichage, choix d’impression) ; votre session et votre identifiant de connexion ; les liaisons avec votre Drive ; le réglage de l’assistant IA ; la copie de l’application pour un usage hors connexion. Ces éléments, strictement nécessaires, ne demandent pas de consentement. Vous pouvez les effacer depuis les réglages du navigateur : vos données Œnotrack seront alors supprimées de cet appareil.</p>
      <h3>9. Vos droits</h3>
      <p>Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité (articles 15 à 21 du règlement général sur la protection des données). L’éditeur ne détenant pas vos données Œnotrack, vous les exercez directement dans l’application (consultation, correction, export, suppression). Pour les données de connexion ou toute question : <Mail m={m} />. Vous pouvez aussi adresser une réclamation à la CNIL (<Ext href="https://www.cnil.fr">www.cnil.fr</Ext>).</p>
      <h3>10. Sécurité</h3>
      <p>Verrouillez vos appareils, activez les identifiants si plusieurs personnes utilisent Œnotrack, et faites des sauvegardes régulières (Paramètres › 💾 Sauvegarde &amp; Drive).</p>
      <p className="legal-petit">Mise à jour : {fmtDate(m.maj || LEGAL_DATE)}. Cette politique peut évoluer avec Œnotrack ; la date ci-dessus indique la version en vigueur.</p>
    </div>
  );
}
function CguDoc({ m }) {
  return (
    <div className="legal-doc" data-legal="cgu">
      <h2>Conditions générales d’utilisation</h2>
      <h3>1. Objet</h3>
      <p>Ces conditions encadrent l’utilisation d’Œnotrack sur {m.site ? <Ext href={m.site}>{nomSite(m)}</Ext> : 'ce site'} et de l’application installée depuis ce site. Utiliser Œnotrack vaut acceptation de ces conditions.</p>
      <h3>2. Le service</h3>
      <p>Œnotrack est un logiciel libre qui aide à enregistrer et tracer le travail de la cuverie et du chai : contenants, lots, opérations, assemblages, tirage, dégorgement, intrants, hygiène, analyses, registres. Il est <b>gratuit</b> et ne demande aucun compte auprès de l’éditeur. C’est une version <b>en cours de test (alpha)</b> : des fonctions peuvent changer et des erreurs subsister.</p>
      <h3>3. Accès</h3>
      <p>Une connexion internet est nécessaire pour ouvrir le site la première fois ; l’application installée fonctionne ensuite aussi hors connexion. L’éditeur peut faire évoluer, interrompre ou arrêter le site à tout moment (maintenance, évolution), sans préavis ni indemnité, et ne garantit pas sa disponibilité.</p>
      <h3>4. Vos données et vos sauvegardes</h3>
      <p>Vos données sont enregistrées sur vos appareils. Vous êtes seul responsable de leur conservation et de leurs sauvegardes (Paramètres › 💾 Sauvegarde &amp; Drive) : l’effacement des données du navigateur, un changement d’appareil ou un incident peut les faire disparaître, et l’éditeur ne peut pas les récupérer.</p>
      <h3>5. Bon usage</h3>
      <p>Vous utilisez Œnotrack conformément aux lois et règlements, sans chercher à perturber le site ni à porter atteinte aux droits d’autrui, et dans le respect de sa licence. Vous êtes responsable des informations que vous y saisissez et de la protection des accès (identifiants, mots de passe, appareils).</p>
      <h3>6. Un outil d’aide, pas une obligation remplie</h3>
      <p>Œnotrack ne remplace ni vos registres et déclarations officiels (douane, appellation, certification…), ni les fiches de données de sécurité et fiches techniques des fournisseurs, ni le conseil d’un œnologue. Les calculs, contrôles, alertes, lectures automatiques de documents et suggestions de l’assistant IA sont des aides à vérifier. Les valeurs données en exemple (doses maximales, règles par revendication…) ne sont pas officielles. Vous restez seul responsable de vos pratiques, de vos déclarations et de votre conformité (voir « Réglementation »).</p>
      <h3>7. Services d’autres sociétés</h3>
      <p>Drive (Google, Microsoft, Dropbox), services d’IA et réseaux de diffusion des bibliothèques sont régis par leurs propres conditions. Les frais éventuels (par exemple ceux de l’assistant IA, facturés sur votre compte) sont à votre charge. L’éditeur n’est pas responsable de leur disponibilité ni de leurs traitements.</p>
      <h3>8. Responsabilité</h3>
      <p>Œnotrack est fourni gratuitement, « en l’état », sans garantie d’aucune sorte (absence d’erreur, adéquation à un usage particulier, continuité), dans les limites permises par la loi ; la licence du logiciel l’exclut aussi (articles 15 et 16 de l’AGPL). Sauf faute lourde ou intentionnelle, l’éditeur, qui le met à disposition à titre non professionnel et gracieux, ne peut être tenu pour responsable des dommages directs ou indirects liés à son utilisation ou à l’impossibilité de l’utiliser : perte de données, erreur de calcul ou de registre, conséquences réglementaires, perte d’exploitation.</p>
      <h3>9. Propriété intellectuelle</h3>
      <p>Les droits d’utiliser, d’étudier, de modifier et de redistribuer le code d’Œnotrack vous sont accordés par sa licence (GNU AGPL v3 ou ultérieure). Le nom « Œnotrack » et son logo restent réservés : voir « Code source &amp; licence ».</p>
      <h3>10. Évolution des conditions</h3>
      <p>Ces conditions peuvent être modifiées ; la version en vigueur est celle affichée ici, avec sa date. Continuer à utiliser Œnotrack après une modification vaut acceptation.</p>
      <h3>11. Droit applicable</h3>
      <p>Ces conditions sont soumises au droit français. En cas de différend, une solution amiable sera recherchée en premier lieu (<Mail m={m} />) ; à défaut, les tribunaux français seront compétents.</p>
      <p className="legal-petit">Mise à jour : {fmtDate(m.maj || LEGAL_DATE)}.</p>
    </div>
  );
}
function LicenceDoc({ m }) {
  const depot = m.depot || OENOTRACK_DEPOT; const zip = useCodeSourceLocal();
  return (
    <div className="legal-doc" data-legal="licence">
      <h2>Code source &amp; licence</h2>
      <p>Œnotrack est un <b>logiciel libre</b> : © 2026 {legalAuteur()} et les contributeurs. Il est distribué sous licence <b>GNU Affero General Public License, version 3</b> ou (à votre choix) toute version ultérieure publiée par la Free Software Foundation.</p>
      <h3>Code source</h3>
      <ul>
        <li>Dépôt : {depot ? <Ext href={depot}>{depot.replace(/^https?:\/\//, '').replace(/\/$/, '')}</Ext> : <AComp>adresse du dépôt à compléter</AComp>}</li>
        {zip ? <li><a className="linkish" href="code-source.zip" download>Télécharger le code source de cette version</a> ({APP_VERSION})</li> : null}
        <li>Version affichée : Œnotrack {APP_VERSION}.</li>
      </ul>
      <h3>Ce que la licence vous permet</h3>
      <ul><li>utiliser Œnotrack pour tout usage, y compris professionnel ;</li><li>étudier son fonctionnement et le modifier ;</li><li>le redistribuer, modifié ou non, et le mettre en ligne.</li></ul>
      <h3>Ce qu’elle demande en échange</h3>
      <ul><li>conserver les mentions de droits d’auteur et la licence ;</li><li>diffuser toute version modifiée sous la même licence ;</li><li>si vous mettez en ligne une version modifiée, proposer à ses utilisateurs d’en obtenir le code source (article 13 de l’AGPL).</li></ul>
      <p>Le logiciel est fourni sans garantie (articles 15 et 16). Texte officiel de la licence (en anglais) : <Ext href="https://www.gnu.org/licenses/agpl-3.0.html">gnu.org/licenses/agpl-3.0.html</Ext>. Ce résumé n’a pas de valeur juridique : seul le texte de la licence fait foi.</p>
      <h3>Nom et logo « Œnotrack »</h3>
      <p>Le nom « Œnotrack » et son logo ne sont pas couverts par la licence (article 7 e de l’AGPL). Une version modifiée que vous diffusez ou mettez en ligne doit porter un autre nom et un autre logo, et ne pas laisser croire qu’elle est la version officielle. Vous pouvez indiquer qu’elle est « basée sur Œnotrack ».</p>
      <h3>Composants d’autres auteurs</h3>
      <div className="legal-tableau"><table><thead><tr><th>Composant</th><th>Rôle</th><th>Auteur</th><th>Licence</th></tr></thead><tbody>{COMPOSANTS_TIERS.map((c) => <tr key={c.nom}><td><Ext href={c.web}>{c.nom}</Ext></td><td>{c.role}</td><td>{c.auteur}</td><td>{c.licence}</td></tr>)}</tbody></table></div>
      <h3>Contribuer</h3>
      <p>Remarques, erreurs, propositions d’amélioration : {depot ? <>sur le dépôt (<Ext href={depot}>{depot.replace(/^https?:\/\//, '').replace(/\/$/, '')}</Ext>) ou </> : null}à <Mail m={m} />.</p>
    </div>
  );
}
function ReglementationDoc() {
  return (
    <div className="legal-doc" data-legal="reglementation">
      <h2>Réglementation : ce qu’Œnotrack fait, et ne fait pas</h2>
      <p>Œnotrack vous aide à tenir et à retrouver vos informations ; il ne transmet rien à l’administration et ne remplace aucune obligation. En cas de doute, la réglementation et les organismes compétents (douane, INAO, organisme certificateur, interprofession) font foi.</p>
      <h3>Registres et déclarations</h3>
      <p>Les registres d’Œnotrack (entrées et sorties, manipulations, intrants et traitements, bilan matière…) et leurs exports CSV et Excel aident à tenir les registres vitivinicoles prévus par le règlement délégué (UE) 2018/273 et le règlement d’exécution (UE) 2018/274. Les déclarations (récolte, stock, déclarations récapitulatives mensuelles…) restent à faire auprès de la douane ; vérifiez auprès d’elle que la forme de vos registres lui convient.</p>
      <h3>Pratiques œnologiques et revendications</h3>
      <p>Les autorisations et doses maximales enregistrées par revendication sont <b>vos réglages</b> : les valeurs d’exemple ne sont pas officielles. Référez-vous au règlement délégué (UE) 2019/934 (pratiques œnologiques), aux règlements (UE) 2018/848 et d’exécution (UE) 2021/1165 (agriculture biologique), au cahier des charges de votre appellation et, le cas échéant, à celui de Demeter ou de votre certification.</p>
      <h3>Produits et sécurité</h3>
      <p>Le fournisseur doit vous remettre la fiche de données de sécurité (FDS) de chaque produit dangereux et ses mises à jour (règlement (CE) n° 1907/2006, REACH, article 31 ; étiquetage selon le règlement (CE) n° 1272/2008, CLP). La lecture automatique des FDS et la veille par l’assistant IA sont des aides : la FDS du fournisseur fait foi.</p>
      <h3>Hygiène et traçabilité</h3>
      <p>Le journal d’hygiène et la traçabilité des lots et des intrants aident à répondre aux règlements (CE) n° 852/2004 (hygiène des denrées alimentaires, démarche HACCP) et n° 178/2002 (article 18 : traçabilité). Ils ne remplacent pas votre plan de maîtrise sanitaire.</p>
      <h3>Données personnelles</h3>
      <p>Voir la page « Confidentialité » : vos données restent sur vos appareils, et vous êtes responsable de celles que vous enregistrez sur des personnes.</p>
    </div>
  );
}
const LEGAL_DOCS = { mentions: MentionsDoc, confidentialite: ConfidentialiteDoc, cgu: CguDoc, licence: LicenceDoc, reglementation: ReglementationDoc };

/* ---------- fenêtre des informations légales ---------- */
function LegalSheet({ onglet, onClose }) {
  const m = useMentions(); const [o, setO] = useState(LEGAL_DOCS[onglet] ? onglet : 'mentions'); const ref = useRef(null);
  useEffect(() => { if (LEGAL_DOCS[onglet]) setO(onglet); }, [onglet]);
  const out = useReportOutput(ref, `oenotrack-${(LEGAL_ONGLETS.find((t) => t[0] === o) || [o, o, o])[2]}`);
  const Doc = LEGAL_DOCS[o];
  return (
    <Sheet wide title="Informations légales" sub="Œnotrack — mentions légales, confidentialité, conditions d’utilisation, licence" onClose={onClose}
      footer={<><Btn className="mr-auto" onClick={onClose}>Fermer</Btn><BoutonsSortie out={out} /></>}>
      <SubNav value={o} onChange={setO} items={LEGAL_ONGLETS.map(([id, label]) => ({ id, label }))} />
      <div ref={ref} className="report legal-rapport"><Doc m={m} /></div>
    </Sheet>
  );
}
// liens du pied de page et de l'écran de connexion
function LegalLiens({ onOuvrir, className }) {
  return <nav className={cx('legal-liens', className)} aria-label="Informations légales">{LEGAL_ONGLETS.filter((t) => t[0] !== 'reglementation').map(([id, label]) => <button key={id} type="button" onClick={() => onOuvrir(id)}>{label}</button>)}</nav>;
}
