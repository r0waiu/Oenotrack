/* ============ CLÉS D'ACCÈS : INTERFACE (0.28.0-alpha.1, multiplateforme 0.38.0-alpha.2) ============
   Moteur : 34b-cles-acces.js. Sur un appareil accepté, connexion par empreinte, visage ou code PIN (Windows Hello, Touch ID / Face ID,
   Android, Linux par clé de sécurité, téléphone ou Gestionnaire de mots de passe de Chrome). Le mot de passe reste toujours possible.
   Les clés d'accès exigent une page sécurisée (https) ouverte seule : la version en ligne (votre site, oenotrack.fr) ou l'application
   installée ; pas l'aperçu dans claude.ai (cadre d'un autre site).
   0.38.0-alpha.2 : deux façons d'activer un appareil — « cet appareil » (authentificateur intégré : empreinte, visage ou code PIN du
   téléphone ou de l'ordinateur, y compris Android) et « clé de sécurité ou autre téléphone » (USB, NFC, QR code). La disponibilité de
   l'authentificateur intégré est lue à l'affichage (useClesIntegre), jamais pendant le clic : Safari exige que navigator.credentials.create
   suive directement le geste de l'utilisateur. */
function clesEtat() {
  let cadre = true; try { cadre = window.self !== window.top; } catch (e) { cadre = true; }
  const api = typeof window !== 'undefined' && !!window.PublicKeyCredential && !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get);
  const sur = !!window.isSecureContext; const rp = (location && location.hostname) || '';
  // ordre : page non sécurisée (le navigateur y cache les clés d'accès), navigateur trop ancien, aperçu dans un cadre, fichier ouvert depuis
  // l'ordinateur, adresse IP
  const raison = !sur ? 'Les clés d’accès demandent une page sécurisée (https) : utilisez la version en ligne d’Œnotrack.' : !api ? 'Ce navigateur ne gère pas les clés d’accès : mettez-le à jour.' : cadre ? 'Les clés d’accès fonctionnent dans la version en ligne d’Œnotrack (votre site ou oenotrack.fr) et dans l’application installée, pas dans cet aperçu.' : !rp ? 'Les clés d’accès fonctionnent dans la version en ligne d’Œnotrack (votre site ou oenotrack.fr) et dans l’application installée, pas dans un fichier ouvert depuis l’ordinateur.' : /^\d+\.\d+\.\d+\.\d+$/.test(rp) || /^\[/.test(rp) ? 'Les clés d’accès demandent une adresse avec un nom de domaine (pas une adresse IP).' : '';
  return { ok: !raison, raison, rp };
}
// nom proposé pour l'appareil et ce qu'il demande (empreinte, visage, code PIN)
function cleAppareil() {
  const ua = (navigator && navigator.userAgent) || '';
  // iPadOS 13+ se présente comme un Mac : écran tactile → iPad
  if (/Macintosh/.test(ua) && Number(navigator.maxTouchPoints) > 1) return { nom: 'iPad', moyen: 'Face ID, Touch ID ou code' };
  if (/iPhone|iPad|iPod/.test(ua)) return { nom: /iPad/.test(ua) ? 'iPad' : 'iPhone', moyen: 'Face ID, Touch ID ou code' };
  if (/Android/.test(ua)) return { nom: 'Android', moyen: 'empreinte, visage ou code de déverrouillage' };
  if (/Windows/.test(ua)) return { nom: 'PC Windows', moyen: 'Windows Hello : empreinte, visage ou code PIN' };
  if (/Macintosh|Mac OS/.test(ua)) return { nom: 'Mac', moyen: 'Touch ID ou mot de passe du Mac' };
  if (/CrOS/.test(ua)) return { nom: 'Chromebook', moyen: 'code PIN ou empreinte' };
  if (/Linux/.test(ua)) return { nom: 'Linux', moyen: 'code PIN du Gestionnaire de mots de passe, clé de sécurité ou téléphone (QR code)' };
  return { nom: 'Appareil', moyen: 'empreinte, visage ou code PIN' };
}
const cleErreur = (e) => (e && e.name === 'NotAllowedError' ? 'Opération annulée ou délai dépassé.' : e && e.name === 'InvalidStateError' ? 'Cet appareil est déjà enregistré pour ce compte.' : e && e.name === 'SecurityError' ? 'Clés d’accès refusées sur cette adresse (domaine non sécurisé).' : e && e.name === 'NotSupportedError' ? 'Cet appareil ne propose pas d’empreinte, de visage ni de code PIN pour les clés d’accès : activez le verrouillage de l’écran, ou utilisez une clé de sécurité ou un autre téléphone.' : `Clé d’accès impossible : ${(e && e.message) || e}`);
// une seule demande à la fois : une nouvelle demande annule celle restée ouverte (fenêtre du système fermée sans réponse, double appui)
let _cleDemande = null;
function cleSignal() { try { if (_cleDemande) _cleDemande.abort(); } catch (e) { /* rien */ } _cleDemande = typeof AbortController === 'function' ? new AbortController() : null; return _cleDemande ? _cleDemande.signal : undefined; }
// authentificateur intégré disponible ? (null : inconnu, true / false) — lu une fois à l'affichage
let _clesIntegre = null;
function useClesIntegre() {
  const [v, setV] = useState(_clesIntegre);
  useEffect(() => {
    if (_clesIntegre !== null) return undefined; let vivant = true; const P = typeof window !== 'undefined' ? window.PublicKeyCredential : null;
    const f = P && typeof P.isUserVerifyingPlatformAuthenticatorAvailable === 'function' ? P.isUserVerifyingPlatformAuthenticatorAvailable() : Promise.resolve(null);
    Promise.resolve(f).then((x) => { _clesIntegre = x === null ? null : !!x; if (vivant) setV(_clesIntegre); }, () => {});
    return () => { vivant = false; };
  }, []);
  return v;
}
// enregistre une clé d'accès de cet appareil pour l'utilisateur
// mode : 'appareil' (empreinte, visage ou code PIN intégrés), 'externe' (clé de sécurité, autre téléphone) ou 'auto' (choix du navigateur)
async function cleCreer(db, u, mode = 'appareil') {
  const E = clesEtat(); if (!E.ok) throw new Error(E.raison);
  const ap = cleAppareil();
  const cred = await navigator.credentials.create({ publicKey: clesOptionsCreation({ rp: E.rp, user: u, defi: alea(32), mode, exclure: u.cles || [] }), signal: cleSignal() });
  const r = cred && cred.response; let spki = null; let alg = null;
  try { spki = r && typeof r.getPublicKey === 'function' ? r.getPublicKey() : null; alg = r && typeof r.getPublicKeyAlgorithm === 'function' ? r.getPublicKeyAlgorithm() : null; } catch (e) { spki = null; }
  if ((!spki || !CLES_ALGS.includes(alg)) && r && r.attestationObject) { const x = cleDepuisAttestation(new Uint8Array(r.attestationObject)); if (x) { spki = x.spki; alg = x.alg; } }
  if (!spki || !CLES_ALGS.includes(alg)) throw new Error('Ce navigateur ne fournit pas une clé utilisable (mettez-le à jour).');
  let transports = []; try { transports = r && typeof r.getTransports === 'function' ? r.getTransports() : []; } catch (e) { transports = []; }
  const att = cred.authenticatorAttachment; const type = att === 'platform' ? 'appareil' : att === 'cross-platform' ? 'externe' : mode === 'auto' ? '' : mode;
  const nom = type === 'externe' ? (clesTransports(transports).includes('hybrid') ? 'Autre téléphone' : 'Clé de sécurité') : ap.nom;
  return { id: clesB64u(new Uint8Array(cred.rawId)), cle: clesB64(new Uint8Array(spki)), alg, rp: E.rp, nom, appareil: ap.nom, type, transports: clesTransports(transports), le: new Date().toISOString() };
}
// connexion : l'appareil signe un défi ; la signature est vérifiée avec la clé publique enregistrée
async function cleConnexion(db, uid) {
  const E = clesEtat(); if (!E.ok) throw new Error(E.raison);
  const L = clesUtilisables(db, E.rp, uid); if (!L.length) throw new Error('Aucun appareil accepté pour ce compte.');
  const defi = alea(32);
  const a = await navigator.credentials.get({ publicKey: clesOptionsConnexion({ rp: E.rp, defi, cles: L.map(({ k }) => k) }), signal: cleSignal() });
  const id = clesB64u(new Uint8Array(a.rawId)); const t = L.find(({ k }) => k.id === id);
  if (!t) { const att = (db.utilisateurs || []).find((u) => (u.cles || []).some((k) => k && k.id === id)); throw new Error(att && att.actif !== false ? 'Cet appareil attend l’accord d’un administrateur.' : 'Clé d’accès inconnue ou retirée.'); }
  const v = await cleVerifier(t.k, a.response, { defi, origine: location.origin, rp: E.rp });
  if (!v.ok) throw new Error(v.msg);
  return t;
}
// bouton de l'écran de connexion (et du verrouillage)
function CleBoutonConnexion({ uid, onOk, onErr, disabled }) {
  const { db } = useApp(); const [busy, setBusy] = useState(false); const E = clesEtat();
  if (!securiteActive(db) || !clesReglages(db).actif || !E.ok || !clesUtilisables(db, E.rp, uid).length) return null;
  const go = async () => { if (busy) return; setBusy(true); try { const t = await cleConnexion(db, uid); onOk(t); } catch (e) { if (e && e.name === 'AbortError') { setBusy(false); return; } onErr(e && e.name ? cleErreur(e) : (e && e.message) || String(e)); } setBusy(false); };
  return <Btn className="w-full" onClick={go} disabled={disabled || busy} data-cle-connexion="">{busy ? 'Vérification sur l’appareil…' : uid ? '🔑 Déverrouiller par empreinte, visage ou code PIN' : '🔑 Se connecter par empreinte, visage ou code PIN'}</Btn>;
}
// « Mes appareils » : clés d'accès de l'utilisateur connecté
function MesClesBloc() {
  const { db, uid, act, confirm, toast } = useApp(); const u = utilisateurDe(db, uid); const [busy, setBusy] = useState(false); const E = clesEtat(); const R0 = clesReglages(db); const ap = cleAppareil();
  const integre = useClesIntegre();
  if (!u) return null; const L = clesDe(db, uid);
  // authentificateur intégré absent (Linux sans gestionnaire, PC sans Windows Hello) : le navigateur choisit parmi ce qu'il propose
  const ajouter = async (mode) => { setBusy(true); try { const k = await cleCreer(db, u, mode === 'appareil' && integre === false ? 'auto' : mode); const r = act((d) => cleAjouter(d, uid, k)); if (r && r.ok) toast(r.acceptee ? 'Appareil enregistré : connexion simplifiée activée.' : 'Appareil enregistré : un administrateur doit l’accepter.'); } catch (e) { if (!(e && e.name === 'AbortError')) toast(e && e.name ? cleErreur(e) : (e && e.message) || String(e), 'bad'); } setBusy(false); };
  const retirer = async (k) => { if (await confirm({ title: `Retirer « ${k.nom} » ?`, body: 'Cet appareil ne pourra plus servir à se connecter sans mot de passe.', ok: 'Retirer', danger: true })) act((d) => cleRetirer(d, uid, k.id), 'Appareil retiré.'); };
  return (
    <div className="space-y-2" data-mes-cles="">
      <div className="lbl">Connexion simplifiée (clés d’accès)</div>
      {!R0.actif ? <p className="help">Désactivée par un administrateur.</p> : <>
        <p className="help">{`Sur un appareil accepté : ${ap.moyen}. Le mot de passe reste possible.`}</p>
        {L.length ? <ul className="space-y-1">{L.map((k) => <li key={k.id} className="flex flex-wrap items-center gap-2 text-sm" data-cle={k.id}><b>{k.nom}</b>{k.type === 'externe' ? <span className="text-xs text-ink2">clé de sécurité ou autre téléphone</span> : k.type === 'appareil' ? <span className="text-xs text-ink2">empreinte, visage ou code PIN de l’appareil</span> : null}{k.acceptee === false ? <Chip tone="warn">en attente d’un administrateur</Chip> : <Chip tone="ok">acceptée</Chip>}<span className="text-xs text-ink2">{fmtDateHeure(k.creeLe)}</span><Btn size="sm" kind="ghost" onClick={() => retirer(k)}>Retirer</Btn></li>)}</ul> : null}
        {E.ok ? <div className="flex flex-wrap gap-2">
          <Btn onClick={() => ajouter('appareil')} disabled={busy} data-cle-ajouter="">{busy ? 'Attente de l’appareil…' : `＋ Activer sur cet appareil (${ap.nom})`}</Btn>
          <Btn kind="ghost" onClick={() => ajouter('externe')} disabled={busy} data-cle-ajouter-externe="">＋ Clé de sécurité ou autre téléphone</Btn>
        </div> : <p className="help" data-cle-indispo="">{E.raison}</p>}
        {E.ok && integre === false ? <p className="help" data-cle-integre-absent="">Aucune empreinte, aucun visage ni code PIN intégré n’a été détecté pour les clés d’accès sur cet appareil : activez le verrouillage de l’écran (ou Windows Hello), sinon le navigateur proposera une clé de sécurité, un autre téléphone ou son gestionnaire de mots de passe.</p> : null}
      </>}
    </div>
  );
}
// administrateurs : appareils de tous les utilisateurs, à accepter ou retirer
function AppareilsAcceptes() {
  const { db, act, confirm } = useApp(); const R0 = clesReglages(db);
  const L = (db.utilisateurs || []).flatMap((u) => (u.cles || []).filter((k) => k && k.id).map((k) => ({ u, k }))).sort((a, b) => (a.k.acceptee !== false) - (b.k.acceptee !== false) || String(b.k.creeLe).localeCompare(String(a.k.creeLe)));
  const attente = L.filter((x) => x.k.acceptee === false).length;
  const retirer = async (x) => { if (await confirm({ title: `Retirer « ${x.k.nom} » de ${x.u.nom || x.u.identifiant} ?`, body: 'Cet appareil ne pourra plus servir à se connecter sans mot de passe.', ok: 'Retirer', danger: true })) act((d) => cleRetirer(d, x.u.id, x.k.id), 'Appareil retiré.'); };
  return (
    <Sec title={`Appareils acceptés (clés d’accès)${attente ? ` — ${attente} en attente` : ''}`}>
      <div className="card space-y-3 p-4" data-appareils="">
        <MesClesBloc />
        <p className="help">Connexion par empreinte, visage ou code PIN de l’appareil (Windows Hello, Touch ID et Face ID, Android ; sous Linux : code PIN du Gestionnaire de mots de passe, clé de sécurité ou téléphone par QR code), ou par une clé de sécurité USB / NFC. Chacun active ses appareils depuis son compte ; {R0.validation === 'admin' ? 'un administrateur les accepte ici.' : 'ils sont acceptés d’office.'}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Check checked={R0.actif} onChange={(v) => act((d) => clesRegler(d, { actif: v }), v ? 'Connexion par clé d’accès activée.' : 'Connexion par clé d’accès désactivée.')} label="Connexion par empreinte, visage ou code PIN" />
          <Check checked={R0.validation === 'admin'} onChange={(v) => act((d) => clesRegler(d, { validation: v ? 'admin' : 'libre' }), 'Réglage enregistré.')} label="Chaque nouvel appareil doit être accepté par un administrateur" />
        </div>
        <Tbl rows={L} empty="Aucun appareil enregistré." cols={[
          { h: 'Utilisateur', r: (x) => <b>{x.u.nom || x.u.identifiant}</b> }, { h: 'Appareil', r: (x) => x.k.nom }, { h: 'Ajouté le', cls: 'hm', r: (x) => <span className="num text-sm">{fmtDateHeure(x.k.creeLe)}</span> },
          { h: 'État', r: (x) => (x.k.acceptee === false ? <Chip tone="warn">en attente</Chip> : <Chip tone="ok">accepté</Chip>) },
          { h: '', r: (x) => <span className="flex flex-wrap gap-1" data-appareil={x.k.id}>{x.k.acceptee === false ? <Btn size="sm" kind="primary" onClick={() => act((d) => cleModifier(d, x.u.id, x.k.id, { acceptee: true }), 'Appareil accepté.')}>Accepter</Btn> : null}<Btn size="sm" kind="danger" onClick={() => retirer(x)}>Retirer</Btn></span> }]} />
      </div>
    </Sec>
  );
}
