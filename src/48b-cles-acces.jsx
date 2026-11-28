/* ============ CLÉS D'ACCÈS : INTERFACE (0.28.0-alpha.1, multiplateforme 0.38.0-alpha.2) ============
   Moteur : 34b-cles-acces.js. Sur un appareil accepté, connexion par empreinte, visage ou code PIN (Windows Hello, Touch ID / Face ID,
   Android, Linux par clé de sécurité, téléphone ou Gestionnaire de mots de passe de Chrome). Le mot de passe reste toujours possible.
   Les clés d'accès exigent une page sécurisée (https) ouverte seule : la version en ligne (votre site, oenotrack.pages.dev) ou l'application
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
  const raison = !sur ? 'Les clés d’accès demandent une page sécurisée (https) : utilisez la version en ligne d’Œnotrack.' : !api ? 'Ce navigateur ne gère pas les clés d’accès : mettez-le à jour.' : cadre ? 'Les clés d’accès fonctionnent dans la version en ligne d’Œnotrack (votre site ou oenotrack.pages.dev) et dans l’application installée, pas dans cet aperçu.' : !rp ? 'Les clés d’accès fonctionnent dans la version en ligne d’Œnotrack (votre site ou oenotrack.pages.dev) et dans l’application installée, pas dans un fichier ouvert depuis l’ordinateur.' : /^\d+\.\d+\.\d+\.\d+$/.test(rp) || /^\[/.test(rp) ? 'Les clés d’accès demandent une adresse avec un nom de domaine (pas une adresse IP).' : '';
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
// 0.49.0-alpha.2 : clés intégrées à cet appareil (créées ou utilisées ici) — commodité de l'appareil, jamais dans la base
const CLES_ICI_KEY = 'oenotrack-cles-ici';
function clesIciLire() { try { const o = JSON.parse(window.localStorage.getItem(CLES_ICI_KEY) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (e) { return {}; } }
function clesIciMarquer(k) { if (!k || !k.id || k.type === 'externe') return; try { const o = clesIciLire(); o[k.id] = 1; window.localStorage.setItem(CLES_ICI_KEY, JSON.stringify(o)); } catch (e) { /* ignoré */ } }
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
  const k = { id: clesB64u(new Uint8Array(cred.rawId)), cle: clesB64(new Uint8Array(spki)), alg, rp: E.rp, nom, appareil: ap.nom, type, transports: clesTransports(transports), le: new Date().toISOString() };
  clesIciMarquer(k); return k;
}
// connexion : l'appareil signe un défi ; la signature est vérifiée avec la clé publique enregistrée
async function cleConnexion(db, uid) {
  const E = clesEtat(); if (!E.ok) throw new Error(E.raison);
  const L = clesUtilisables(db, E.rp, uid); if (!L.length) throw new Error('Aucun appareil accepté pour ce compte.');
  const defi = alea(32);
  const a = await navigator.credentials.get({ publicKey: clesOptionsConnexion({ rp: E.rp, defi, cles: L.map(({ k }) => k) }), signal: cleSignal() });
  const id = clesB64u(new Uint8Array(a.rawId)); const t = L.find(({ k }) => k.id === id);
  if (!t) { const att = (db.utilisateurs || []).find((u) => (u.cles || []).some((k) => k && k.id === id)); const k0 = att && (att.cles || []).find((k) => k && k.id === id); throw new Error(att && att.actif !== false ? (k0 && k0.revoqueLe ? 'L’accès de cet appareil a été retiré par un administrateur.' : k0 && k0.acceptee !== false ? 'Cette clé d’accès n’est pas rattachée à un seul compte : demandez à un administrateur de la vérifier.' : 'Cet appareil attend l’accord d’un administrateur.') : 'Clé d’accès inconnue ou retirée.'); }
  // rattachement strict (0.39.0-alpha.1) : l'identifiant d'utilisateur gardé par l'appareil doit être celui du compte de la clé
  if (!cleProprietaireOk(t.u, a.response && a.response.userHandle)) throw new Error('Cette clé d’accès appartient à un autre compte.');
  const v = await cleVerifier(t.k, a.response, { defi, origine: location.origin, rp: E.rp });
  if (!v.ok) throw new Error(v.msg);
  return t;
}
// bouton de l'écran de connexion (et du verrouillage)
function CleBoutonConnexion({ uid, onOk, onErr, disabled, principal }) {
  const { db } = useApp(); const [busy, setBusy] = useState(false); const E = clesEtat();
  if (!securiteActive(db) || !clesReglages(db).actif || !E.ok || !clesUtilisables(db, E.rp, uid).length) return null;
  const go = async () => { if (busy) return; setBusy(true); try { const t = await cleConnexion(db, uid); clesIciMarquer(t.k); onOk(t); } catch (e) { if (e && e.name === 'AbortError') { setBusy(false); return; } onErr(e && e.name ? cleErreur(e) : (e && e.message) || String(e)); } setBusy(false); };
  return <Btn kind={principal ? 'primary' : undefined} className="w-full" onClick={go} disabled={disabled || busy} autoFocus={!!principal} data-cle-connexion="" data-cle-principal={principal ? '' : undefined}>{busy ? 'Vérification sur l’appareil…' : uid ? '🔑 Déverrouiller par empreinte, visage ou code PIN' : '🔑 Se connecter par empreinte, visage ou code PIN'}</Btn>;
}
// état d'une clé, en clair
const CLE_ETATS = { acceptee: ['ok', 'acceptée'], attente: ['warn', 'en attente d’un administrateur'], revoquee: ['bad', 'accès retiré'], 'autre-compte': ['bad', 'rattachée à un autre compte'], doublon: ['bad', 'enregistrée sous plusieurs comptes'] };
const CleEtatChip = ({ etat, court }) => { const e = CLE_ETATS[etat] || CLE_ETATS.attente; return <Chip tone={e[0]}>{court && etat === 'attente' ? 'en attente' : court && etat === 'acceptee' ? 'accepté' : e[1]}</Chip>; };
const cleTypeTexte = (k) => (k.type === 'externe' ? 'clé de sécurité ou autre téléphone' : k.type === 'appareil' ? 'empreinte, visage ou code PIN de l’appareil' : '');
// « Mes appareils » : clés d'accès de l'utilisateur connecté
function MesClesBloc() {
  const { db, uid, act, confirm, toast } = useApp(); const u = utilisateurDe(db, uid); const [busy, setBusy] = useState(false); const E = clesEtat(); const R0 = clesReglages(db); const ap = cleAppareil();
  const integre = useClesIntegre();
  if (!u) return null; const L = clesDe(db, uid); const peutAjouter = clesPeutEnregistrer(db, uid); const dbl = clesDoublons(db);
  // authentificateur intégré absent (Linux sans gestionnaire, PC sans Windows Hello) : le navigateur choisit parmi ce qu'il propose
  const ajouter = async (mode) => { setBusy(true); try { const k = await cleCreer(db, u, mode === 'appareil' && integre === false ? 'auto' : mode); const r = act((d) => cleAjouter(d, uid, k)); if (r && r.ok) toast(r.acceptee ? 'Appareil enregistré : connexion simplifiée activée.' : 'Appareil enregistré : un administrateur doit l’accepter.'); } catch (e) { if (!(e && e.name === 'AbortError')) toast(e && e.name ? cleErreur(e) : (e && e.message) || String(e), 'bad'); } setBusy(false); };
  const retirer = async (k) => { if (await confirm({ title: `Retirer « ${k.nom} » ?`, body: 'Cet appareil ne pourra plus servir à se connecter sans mot de passe.', ok: 'Retirer', danger: true })) act((d) => cleRetirer(d, uid, k.id), 'Appareil retiré.'); };
  return (
    <div className="space-y-2" data-mes-cles="">
      <div className="lbl">Connexion simplifiée (clés d’accès)</div>
      {!R0.actif ? <p className="help">Désactivée par un administrateur.</p> : <>
        <p className="help">{`Sur un appareil accepté : ${ap.moyen}. Le mot de passe reste possible.`}</p>
        {L.length ? <ul className="space-y-1">{L.map((k) => <li key={k.id} className="flex flex-wrap items-center gap-2 text-sm" data-cle={k.id}><b>{k.nom}</b>{cleTypeTexte(k) ? <span className="text-xs text-ink2">{cleTypeTexte(k)}</span> : null}<CleEtatChip etat={cleEtat(db, u, k, dbl)} /><span className="text-xs text-ink2">{fmtDateHeure(k.creeLe)}</span><Btn size="sm" kind="ghost" onClick={() => retirer(k)}>Retirer</Btn></li>)}</ul> : null}
        {!peutAjouter ? <p className="help" data-cle-interdit="">Votre compte n’est pas autorisé à enregistrer ses appareils : demandez-le à un administrateur.</p> : E.ok ? <div className="flex flex-wrap gap-2">
          <Btn onClick={() => ajouter('appareil')} disabled={busy} data-cle-ajouter="">{busy ? 'Attente de l’appareil…' : `＋ Activer sur cet appareil (${ap.nom})`}</Btn>
          <Btn kind="ghost" onClick={() => ajouter('externe')} disabled={busy} data-cle-ajouter-externe="">＋ Clé de sécurité ou autre téléphone</Btn>
        </div> : <p className="help" data-cle-indispo="">{E.raison}</p>}
        {peutAjouter && E.ok && integre === false ? <p className="help" data-cle-integre-absent="">Aucune empreinte, aucun visage ni code PIN intégré n’a été détecté pour les clés d’accès sur cet appareil : activez le verrouillage de l’écran (ou Windows Hello), sinon le navigateur proposera une clé de sécurité, un autre téléphone ou son gestionnaire de mots de passe.</p> : null}
      </>}
    </div>
  );
}
// administrateurs : appareils de chaque utilisateur (0.39.0-alpha.1 : utilisateur par utilisateur) — accepter, retirer l'accès, rétablir,
// supprimer ; droit de chacun d'enregistrer ses propres appareils ; enregistrer cet appareil pour un autre compte
function AppareilsAcceptes() {
  const { db, uid, act, confirm, toast } = useApp(); const R0 = clesReglages(db); const E = clesEtat(); const [busy, setBusy] = useState(''); const dbl = clesDoublons(db);
  const users = [...(db.utilisateurs || [])].filter((u) => u && u.id).sort((a, b) => (a.actif === false) - (b.actif === false) || String(a.nom || a.identifiant).localeCompare(String(b.nom || b.identifiant), 'fr'));
  const L = users.flatMap((u) => (u.cles || []).filter((k) => k && k.id).map((k) => ({ u, k, etat: cleEtat(db, u, k, dbl) })));
  const attente = L.filter((x) => x.etat === 'attente').length;
  const nomU = (u) => u.nom || u.identifiant;
  const supprimer = async (x) => { if (await confirm({ title: `Supprimer « ${x.k.nom} » de ${nomU(x.u)} ?`, body: 'Cet appareil ne pourra plus servir à se connecter sans mot de passe ; il faudra l’enregistrer de nouveau.', ok: 'Supprimer', danger: true })) act((d) => cleRetirer(d, x.u.id, x.k.id), 'Appareil retiré.'); };
  const revoquer = async (x) => { if (await confirm({ title: `Retirer l’accès de « ${x.k.nom} » (${nomU(x.u)}) ?`, body: 'L’appareil reste listé mais ne permet plus de se connecter ; vous pourrez le rétablir.', ok: 'Retirer l’accès', danger: true })) act((d) => cleModifier(d, x.u.id, x.k.id, { acceptee: false, par: uid }), 'Accès de l’appareil retiré.'); };
  const pour = async (u, mode) => { setBusy(u.id); try { const k = await cleCreer(db, u, mode); const r = act((d) => cleAjouter(d, u.id, k, uid)); if (r && r.ok) toast(`Appareil enregistré pour ${nomU(u)}.`); } catch (e) { if (!(e && e.name === 'AbortError')) toast(e && e.name ? cleErreur(e) : (e && e.message) || String(e), 'bad'); } setBusy(''); };
  const droitVal = (u) => (u.clesEnregistrer === true ? 'oui' : u.clesEnregistrer === false ? 'non' : '');
  const actions = (x) => (<span className="flex flex-wrap gap-1" data-appareil={x.k.id}>
    {x.etat === 'attente' ? <Btn size="sm" kind="primary" onClick={() => act((d) => cleModifier(d, x.u.id, x.k.id, { acceptee: true, par: uid }), 'Appareil accepté.')}>Accepter</Btn> : null}
    {x.etat === 'revoquee' ? <Btn size="sm" onClick={() => act((d) => cleModifier(d, x.u.id, x.k.id, { acceptee: true, par: uid }), 'Accès de l’appareil rétabli.')} data-cle-retablir="">Rétablir l’accès</Btn> : null}
    {x.etat === 'acceptee' ? <Btn size="sm" onClick={() => revoquer(x)} data-cle-revoquer="">Retirer l’accès</Btn> : null}
    <Btn size="sm" kind="danger" onClick={() => supprimer(x)} data-cle-supprimer="">Retirer</Btn></span>);
  return (
    <Sec title={`Appareils acceptés (clés d’accès)${attente ? ` — ${attente} en attente` : ''}`}>
      <div className="card space-y-3 p-4" data-appareils="">
        <MesClesBloc />
        <p className="help">Connexion par empreinte, visage ou code PIN de l’appareil (Windows Hello, Touch ID et Face ID, Android ; sous Linux : code PIN du Gestionnaire de mots de passe, clé de sécurité ou téléphone par QR code), ou par une clé de sécurité USB / NFC. Chaque clé d’accès appartient à un seul compte : l’appareil le confirme à chaque connexion. {R0.validation === 'admin' ? 'Un administrateur accepte ici chaque nouvel appareil.' : 'Les nouveaux appareils sont acceptés d’office.'}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Check checked={R0.actif} onChange={(v) => act((d) => clesRegler(d, { actif: v }), v ? 'Connexion par clé d’accès activée.' : 'Connexion par clé d’accès désactivée.')} label="Connexion par empreinte, visage ou code PIN" />
          <Check checked={R0.validation === 'admin'} onChange={(v) => act((d) => clesRegler(d, { validation: v ? 'admin' : 'libre' }), 'Réglage enregistré.')} label="Chaque nouvel appareil doit être accepté par un administrateur" />
          <Check checked={R0.inscription !== 'choisis'} onChange={(v) => act((d) => clesRegler(d, { inscription: v ? 'tous' : 'choisis' }), 'Réglage enregistré.')} label="Chacun peut enregistrer ses propres appareils (sinon : seulement les comptes autorisés ci-dessous)" />
        </div>
        {!L.length ? <p className="text-sm text-ink2">Aucun appareil enregistré.</p> : null}
        <div className="space-y-3" data-appareils-utilisateurs="">
          {users.map((u) => { const K = L.filter((x) => x.u.id === u.id); const admin = estAdmin(db, u.id); return (
            <div key={u.id} className="rounded-md border border-line p-3" data-appareils-utilisateur={u.id}>
              <div className="flex flex-wrap items-center gap-2">
                <b>{nomU(u)}</b><span className="text-xs text-ink2">{u.identifiant} · {profilNom(db, u)}</span>{u.actif === false ? <Chip>compte désactivé</Chip> : null}
                <Chip tone={K.some((x) => x.etat === 'acceptee') ? 'ok' : undefined}>{`Appareils acceptés : ${K.filter((x) => x.etat === 'acceptee').length}`}</Chip>
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  {admin ? <span className="text-xs text-ink2">administrateur : enregistre toujours ses appareils</span>
                    : <label className="flex items-center gap-1 text-sm"><span className="text-ink2">Enregistrer ses appareils :</span><select className="inp" style={{ width: 'auto' }} value={droitVal(u)} data-cles-droit={u.id} aria-label={`Enregistrement des appareils de ${nomU(u)}`} onChange={(e) => act((d) => clesEnregistrerRegler(d, u.id, e.target.value === 'oui' ? true : e.target.value === 'non' ? false : null), 'Réglage enregistré.')}>
                      <option value="">{`réglage commun (${R0.inscription === 'choisis' ? 'non autorisé' : 'autorisé'})`}</option><option value="oui">autorisé</option><option value="non">non autorisé</option></select></label>}
                  {E.ok && R0.actif && u.id !== uid && u.actif !== false ? <Btn size="sm" kind="ghost" disabled={!!busy} onClick={() => pour(u, 'auto')} data-cle-pour={u.id} title="L’utilisateur pose son doigt, son visage ou saisit le code PIN de cet appareil">{busy === u.id ? 'Attente de l’appareil…' : '＋ Enregistrer cet appareil pour ce compte'}</Btn> : null}
                </span>
              </div>
              {K.length ? <div className="mt-2"><Tbl rows={K.map((x) => ({ ...x, id: x.k.id }))} cols={[
                { h: 'Appareil', r: (x) => <span><b>{x.k.nom}</b>{cleTypeTexte(x.k) ? <div className="text-xs text-ink2">{cleTypeTexte(x.k)}</div> : null}</span> },
                { h: 'Ajouté le', cls: 'hm', r: (x) => <span className="num text-sm">{fmtDateHeure(x.k.creeLe)}{x.k.ajoutePar ? <div className="text-xs text-ink2">par {utilisateurNom(db, x.k.ajoutePar)}</div> : null}</span> },
                { h: 'Dernière utilisation', cls: 'hm', r: (x) => <span className="num text-sm">{fmtDateHeure(cleDerniereUtilisation(db, x.k.id)) || '—'}</span> },
                { h: 'État', r: (x) => <span><CleEtatChip etat={x.etat} court />{x.etat === 'revoquee' && x.k.revoqueLe ? <div className="text-xs text-ink2">{`le ${fmtDateHeure(x.k.revoqueLe)}${x.k.revoquePar ? ` par ${utilisateurNom(db, x.k.revoquePar)}` : ''}`}</div> : null}</span> },
                { h: '', r: actions }]} /></div> : <p className="mt-1 text-xs text-ink2">Aucun appareil.</p>}
            </div>); })}
        </div>
      </div>
    </Sec>
  );
}
