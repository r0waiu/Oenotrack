/* ============ APPLICATION INSTALLABLE (0.17.0-alpha.1) ============
   Œnotrack en ligne (paquet « oenotrack-web ») s'installe comme une application, sans passer par un magasin d'applications :
   Chrome sur Android (menu ⋮ › « Installer l'application »), Chrome ou Edge sur ordinateur, Safari sur iPhone (« Sur l'écran d'accueil »).
   Le paquet fournit manifest.webmanifest, les icônes et sw.js (l'application s'ouvre même sans réseau). Dans claude.ai, la page est
   affichée dans un cadre : l'installation se fait depuis Œnotrack en ligne. */
let _installEvt = null; const INSTALL_ABONNES = new Set();
const installMaj = () => INSTALL_ABONNES.forEach((f) => { try { f(); } catch (e) { /* ignoré */ } });
try {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); _installEvt = e; installMaj(); });
  window.addEventListener('appinstalled', () => { _installEvt = null; installMaj(); });
} catch (e) { /* environnement sans fenêtre */ }
// service worker : seulement pour Œnotrack en ligne (page principale, avec son manifeste)
(function enregistrerSW() {
  try {
    if (!('serviceWorker' in navigator) || window.self !== window.top || !document.querySelector('link[rel="manifest"]')) return;
    if (!(location.protocol === 'https:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))) return;
    const go = () => navigator.serviceWorker.register('sw.js').catch(() => null);
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  } catch (e) { /* ignoré */ }
})();
const estInstallee = () => { try { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; } catch (e) { return false; } };
const dansUnCadre = () => { try { return window.self !== window.top; } catch (e) { return true; } };
function useInstallation() {
  const [, maj] = useState(0);
  useEffect(() => { const f = () => maj((x) => x + 1); INSTALL_ABONNES.add(f); return () => { INSTALL_ABONNES.delete(f); }; }, []);
  const installer = async () => { const e = _installEvt; if (!e) return null; try { e.prompt(); const r = await e.userChoice; _installEvt = null; installMaj(); return r && r.outcome; } catch (er) { return null; } };
  return { peut: !!_installEvt, installer, installee: estInstallee(), cadre: dansUnCadre(), enLigne: !!document.querySelector('link[rel="manifest"]') };
}
function InstallerBouton({ className }) {
  const { toast } = useApp(); const I = useInstallation(); if (!I.peut) return null;
  return <button type="button" className={cx('appfoot-v', className)} onClick={async () => { const r = await I.installer(); if (r === 'accepted') toast('Œnotrack est installé : retrouvez-le sur votre écran d’accueil.'); }} title="Installer Œnotrack comme une application (sans magasin d’applications)">📲 Installer l’application</button>;
}
function InstallerCard() {
  const { toast } = useApp(); const I = useInstallation();
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || ''; const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && 'ontouchend' in document); const android = /Android/.test(ua);
  return (
    <Sec title="📲 Application sur téléphone, tablette et ordinateur">
      <div className="card space-y-3 p-4" data-installer="">
        {I.installee ? <Notice tone="ok" title="Œnotrack est installé">Vous l’utilisez en ce moment comme une application : il s’ouvre depuis l’écran d’accueil, en plein écran, même sans réseau dans la cave.</Notice>
          : I.cadre || !I.enLigne ? <Notice tone="info" title="À installer depuis Œnotrack en ligne">Ici, Œnotrack est affiché dans une autre page (claude.ai ou fichier ouvert) : un navigateur ne peut pas l’installer depuis cet endroit. Ouvrez votre adresse d’Œnotrack en ligne (Paramètres › 💾 Sauvegarde &amp; Drive › « Mettre Œnotrack en ligne ») sur le téléphone, puis installez-le comme ci-dessous.</Notice>
            : I.peut ? <div className="flex flex-wrap items-center gap-3"><Btn kind="primary" onClick={async () => { const r = await I.installer(); if (r === 'accepted') toast('Œnotrack est installé : retrouvez-le sur votre écran d’accueil.'); }}>📲 Installer l’application</Btn><span className="help">Aucun magasin d’applications : Œnotrack s’ajoute à l’écran d’accueil et s’ouvre en plein écran.</span></div>
              : <p className="text-sm">Votre navigateur propose l’installation dans son menu (voir ci-dessous).</p>}
        <ul className="ml-5 list-disc space-y-1 text-sm">
          <li className={android ? 'font-semibold' : ''}><b>Android (Chrome)</b> : menu <b>⋮</b> › <b>« Installer l’application »</b> (ou « Ajouter à l’écran d’accueil »). Œnotrack apparaît avec les autres applications.</li>
          <li className={ios ? 'font-semibold' : ''}><b>iPhone, iPad (Safari)</b> : bouton <b>Partager</b> › <b>« Sur l’écran d’accueil »</b>.</li>
          <li><b>Ordinateur (Chrome, Edge)</b> : icône d’installation à droite de la barre d’adresse, ou menu › « Installer Œnotrack ».</li>
        </ul>
        <p className="help">Installée, l’application utilise les mêmes données que le navigateur pour cette adresse, s’ouvre même sans réseau (vignes, cave) et se met à jour toute seule quand une nouvelle version est mise en ligne. Pour retrouver les données sur plusieurs appareils : synchronisation par votre Drive.</p>
      </div>
    </Sec>
  );
}
