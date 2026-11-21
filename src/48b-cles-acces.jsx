/* ============ CLÉS D'ACCÈS : INTERFACE (0.28.0-alpha.1) ============
   Moteur : 34b-cles-acces.js. Sur un appareil accepté, connexion par empreinte, visage ou code PIN (Windows Hello, Touch ID / Face ID,
   Android, Linux par clé de sécurité, téléphone ou Gestionnaire de mots de passe de Chrome). Le mot de passe reste toujours possible.
   Les clés d'accès exigent une page sécurisée (https) ouverte seule : la version en ligne (votre site, oenotrack.fr) ou l'application
   installée ; pas l'aperçu dans claude.ai (cadre d'un autre site). */
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
  if (/iPhone|iPad|iPod/.test(ua)) return { nom: /iPad/.test(ua) ? 'iPad' : 'iPhone', moyen: 'Face ID, Touch ID ou code' };
  if (/Android/.test(ua)) return { nom: 'Android', moyen: 'empreinte, visage ou code de déverrouillage' };
  if (/Windows/.test(ua)) return { nom: 'PC Windows', moyen: 'Windows Hello : empreinte, visage ou code PIN' };
  if (/Macintosh|Mac OS/.test(ua)) return { nom: 'Mac', moyen: 'Touch ID ou mot de passe du Mac' };
  if (/CrOS/.test(ua)) return { nom: 'Chromebook', moyen: 'code PIN ou empreinte' };
  if (/Linux/.test(ua)) return { nom: 'Linux', moyen: 'clé de sécurité, téléphone (QR code) ou code PIN du navigateur' };
  return { nom: 'Appareil', moyen: 'empreinte, visage ou code PIN' };
}
const cleErreur = (e) => (e && e.name === 'NotAllowedError' ? 'Opération annulée ou délai dépassé.' : e && e.name === 'InvalidStateError' ? 'Cet appareil est déjà enregistré pour ce compte.' : e && e.name === 'SecurityError' ? 'Clés d’accès refusées sur cette adresse (domaine non sécurisé).' : `Clé d’accès impossible : ${(e && e.message) || e}`);
// enregistre une clé d'accès de cet appareil pour l'utilisateur
async function cleCreer(db, u) {
  const E = clesEtat(); if (!E.ok) throw new Error(E.raison);
  const ap = cleAppareil();
  const cred = await navigator.credentials.create({ publicKey: {
    rp: { name: 'Œnotrack', id: E.rp }, user: { id: new TextEncoder().encode(String(u.id)).slice(0, 64), name: u.identifiant, displayName: u.nom || u.identifiant },
    challenge: alea(32), pubKeyCredParams: CLES_ALGS.map((alg) => ({ type: 'public-key', alg })), timeout: 120000, attestation: 'none',
    authenticatorSelection: { userVerification: 'required', residentKey: 'preferred' },
    excludeCredentials: (u.cles || []).filter((k) => k && k.id).map((k) => ({ type: 'public-key', id: clesDeB64u(k.id) })) } });
  const r = cred && cred.response; const spki = r && typeof r.getPublicKey === 'function' ? r.getPublicKey() : null; const alg = r && typeof r.getPublicKeyAlgorithm === 'function' ? r.getPublicKeyAlgorithm() : null;
  if (!spki || !CLES_ALGS.includes(alg)) throw new Error('Ce navigateur ne fournit pas une clé utilisable (mettez-le à jour).');
  return { id: clesB64u(new Uint8Array(cred.rawId)), cle: clesB64(new Uint8Array(spki)), alg, rp: E.rp, nom: ap.nom, appareil: ap.nom, le: new Date().toISOString() };
}
// connexion : l'appareil signe un défi ; la signature est vérifiée avec la clé publique enregistrée
async function cleConnexion(db, uid) {
  const E = clesEtat(); if (!E.ok) throw new Error(E.raison);
  const L = clesUtilisables(db, E.rp, uid); if (!L.length) throw new Error('Aucun appareil accepté pour ce compte.');
  const defi = alea(32);
  const a = await navigator.credentials.get({ publicKey: { challenge: defi, rpId: E.rp, userVerification: 'required', timeout: 60000, allowCredentials: L.slice(0, 64).map(({ k }) => ({ type: 'public-key', id: clesDeB64u(k.id) })) } });
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
  const go = async () => { if (busy) return; setBusy(true); try { const t = await cleConnexion(db, uid); onOk(t); } catch (e) { onErr(e && e.name ? cleErreur(e) : (e && e.message) || String(e)); } setBusy(false); };
  return <Btn className="w-full" onClick={go} disabled={disabled || busy} data-cle-connexion="">{busy ? 'Vérification sur l’appareil…' : uid ? '🔑 Déverrouiller par empreinte, visage ou code PIN' : '🔑 Se connecter par empreinte, visage ou code PIN'}</Btn>;
}
// « Mes appareils » : clés d'accès de l'utilisateur connecté
function MesClesBloc() {
  const { db, uid, act, confirm, toast } = useApp(); const u = utilisateurDe(db, uid); const [busy, setBusy] = useState(false); const E = clesEtat(); const R0 = clesReglages(db); const ap = cleAppareil();
  if (!u) return null; const L = clesDe(db, uid);
  const ajouter = async () => { setBusy(true); try { const k = await cleCreer(db, u); const r = act((d) => cleAjouter(d, uid, k)); if (r && r.ok) toast(r.acceptee ? 'Appareil enregistré : connexion simplifiée activée.' : 'Appareil enregistré : un administrateur doit l’accepter.'); } catch (e) { toast(e && e.name ? cleErreur(e) : (e && e.message) || String(e), 'bad'); } setBusy(false); };
  const retirer = async (k) => { if (await confirm({ title: `Retirer « ${k.nom} » ?`, body: 'Cet appareil ne pourra plus servir à se connecter sans mot de passe.', ok: 'Retirer', danger: true })) act((d) => cleRetirer(d, uid, k.id), 'Appareil retiré.'); };
  return (
    <div className="space-y-2" data-mes-cles="">
      <div className="lbl">Connexion simplifiée (clés d’accès)</div>
      {!R0.actif ? <p className="help">Désactivée par un administrateur.</p> : <>
        <p className="help">{`Sur un appareil accepté : ${ap.moyen}. Le mot de passe reste possible.`}</p>
        {L.length ? <ul className="space-y-1">{L.map((k) => <li key={k.id} className="flex flex-wrap items-center gap-2 text-sm" data-cle={k.id}><b>{k.nom}</b>{k.acceptee === false ? <Chip tone="warn">en attente d’un administrateur</Chip> : <Chip tone="ok">acceptée</Chip>}<span className="text-xs text-ink2">{fmtDateHeure(k.creeLe)}</span><Btn size="sm" kind="ghost" onClick={() => retirer(k)}>Retirer</Btn></li>)}</ul> : null}
        {E.ok ? <Btn onClick={ajouter} disabled={busy} data-cle-ajouter="">{busy ? 'Attente de l’appareil…' : `＋ Activer sur cet appareil (${ap.nom})`}</Btn> : <p className="help" data-cle-indispo="">{E.raison}</p>}
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
        <p className="help">Connexion par empreinte, visage ou code PIN de l’appareil (Windows Hello, Touch ID et Face ID, Android ; sous Linux : clé de sécurité, téléphone par QR code ou code PIN du navigateur). Chacun active ses appareils depuis son compte ; {R0.validation === 'admin' ? 'un administrateur les accepte ici.' : 'ils sont acceptés d’office.'}</p>
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
