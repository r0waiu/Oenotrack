/* ============ IDENTIFIANTS ET DROITS : connexion, verrouillage, compte, gestion des utilisateurs et des profils (0.15.0-alpha.1) ============
   Moteur : 34-acces.js. La session de cet appareil (qui est connecté) est rangée dans le navigateur, jamais le mot de passe. */
const SESSION_KEY = 'oenotrack-session'; const DERNIER_IDENT_KEY = 'oenotrack-identifiant';
function sessionLire() {
  for (const st of ['sessionStorage', 'localStorage']) { try { const v = window[st].getItem(SESSION_KEY); if (v) { const s = JSON.parse(v); if (s && s.uid) return { ...s, garder: st === 'localStorage' }; } } catch (e) { /* stockage indisponible */ } }
  return null;
}
function sessionEcrire(s) {
  try { window.sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignoré */ } try { window.localStorage.removeItem(SESSION_KEY); } catch (e) { /* ignoré */ }
  if (!s) return; try { window[s.garder ? 'localStorage' : 'sessionStorage'].setItem(SESSION_KEY, JSON.stringify({ uid: s.uid, t: s.t || Date.now(), verrou: !!s.verrou })); } catch (e) { /* ignoré */ }
}
// dernière page visitée (0.47.0-alpha.3) : par personne (identifiant, '' sans identifiants), sur cet appareil seulement, jamais dans la base
const DERNIERE_PAGE_KEY = 'oenotrack-derniere-page';
const dernierePageLire = (uid) => { try { const o = JSON.parse(window.localStorage.getItem(DERNIERE_PAGE_KEY) || '{}'); const x = o && o[uid || '']; return x && typeof x.tab === 'string' ? { tab: x.tab, sub: typeof x.sub === 'string' ? x.sub : null } : null; } catch (e) { return null; } };
const dernierePageEcrire = (uid, nav) => { try { const o = JSON.parse(window.localStorage.getItem(DERNIERE_PAGE_KEY) || '{}') || {}; o[uid || ''] = { tab: nav.tab, sub: typeof nav.sub === 'string' ? nav.sub : null }; window.localStorage.setItem(DERNIERE_PAGE_KEY, JSON.stringify(o)); } catch (e) { /* ignoré */ } };
const dernierIdent = () => { try { return window.localStorage.getItem(DERNIER_IDENT_KEY) || ''; } catch (e) { return ''; } };
const dernierIdentEcrire = (v) => { try { window.localStorage.setItem(DERNIER_IDENT_KEY, v || ''); } catch (e) { /* ignoré */ } };
const appareilNom = () => { try { const ua = navigator.userAgent || ''; return /iPhone|iPad/.test(ua) ? 'iPhone / iPad' : /Android/.test(ua) ? 'Android' : /Macintosh|Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'PC Windows' : /Linux/.test(ua) ? 'Linux' : 'appareil'; } catch (e) { return 'appareil'; } };
const FAUSSE_EMPREINTE = { algo: 'PBKDF2-SHA256', iter: MDP_ITER, sel: 'AAAAAAAAAAAAAAAAAAAAAA==', cle: '-' }; // même temps de réponse pour un identifiant inconnu
const mdpProvisoire = () => { const r = alea(8); const A = 'abcdefghjkmnpqrstuvwxyz'; const D = '23456789'; return `${A[r[0] % A.length].toUpperCase()}${A[r[1] % A.length]}${A[r[2] % A.length]}${A[r[3] % A.length]}-${D[r[4] % 8]}${D[r[5] % 8]}${D[r[6] % 8]}${D[r[7] % 8]}`; };
const profilNom = (db, uOuId) => { const u = typeof uOuId === 'object' ? uOuId : utilisateurDe(db, uOuId); const p = profilDe(db, u); return p ? p.nom : 'sans profil'; };
const derniereConnexion = (db, id) => { const L = (db.audit || []).filter((a) => a.uid === id && a.action === 'connexion'); return L.length ? L[L.length - 1].date : ''; };
const fmtDateHeure = (iso) => { if (!iso) return ''; const d = new Date(iso); if (Number.isNaN(d.getTime())) return iso; return `${fmtDate(iso.slice(0, 10))} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };

// Jauge de qualité du mot de passe
function MdpJauge({ mdp, min }) {
  if (!mdp) return null; const q = mdpQualite(mdp, min);
  return (<div className="mdp-jauge" data-note={q.note} aria-live="polite"><span className="mdp-barres">{[1, 2, 3, 4].map((i) => <i key={i} className={i <= q.note ? 'on' : ''} />)}</span><span className="text-xs">{q.note === 0 ? q.msg : q.note === 1 ? `Trop faible : ${q.msg}` : `Mot de passe ${q.msg}`}</span></div>);
}
// champ mot de passe avec bouton afficher / masquer
function MdpInput({ value, onChange, label, autoComplete = 'current-password', autoFocus, placeholder }) {
  const [voir, setVoir] = useState(false);
  return (
    <div className="mdp-champ">
      <input className="inp" type={voir ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} autoComplete={autoComplete} autoFocus={autoFocus} placeholder={placeholder} spellCheck={false} autoCapitalize="off" />
      <button type="button" className="mdp-voir" onClick={() => setVoir(!voir)} aria-label={voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} title={voir ? 'Masquer' : 'Afficher'}>{voir ? '🙈' : '👁'}</button>
    </div>
  );
}
// nouveau mot de passe + confirmation : renvoie l'erreur éventuelle
const mdpErreur = (db, a, b) => { const q = mdpQualite(a, securiteReglages(db).longueurMin); if (!q.note) return q.msg; if (q.note < 2) return `Mot de passe trop faible : ${q.msg.toLowerCase()}`; if (a !== b) return 'Les deux mots de passe ne sont pas identiques.'; return ''; };

/* ---------- écran de connexion (ou de déverrouillage) ---------- */
function EcranConnexion({ verrou, onConnecte, onChanger, onPresentation }) {
  const { db, act } = useApp(); const E = db.entreprise || {};
  const u0 = verrou ? utilisateurDe(db, verrou.uid) : null;
  const [mode, setMode] = useState('connexion'); // connexion | secours | nouveauCode
  const [ident, setIdent] = useState(u0 ? u0.identifiant : dernierIdent()); const [mdp, setMdp] = useState(''); const [garder, setGarder] = useState(!!(verrou && verrou.garder));
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [attente, setAttente] = useState(0); const essais = useRef(0);
  const [code, setCode] = useState(''); const [n1, setN1] = useState(''); const [n2, setN2] = useState(''); const [nouveauCode, setNouveauCode] = useState(''); const [uidSecours, setUidSecours] = useState('');
  useEffect(() => { if (!attente) return undefined; const t = setTimeout(() => setAttente((x) => Math.max(0, x - 1)), 1000); return () => clearTimeout(t); }, [attente]);
  const journal = (e) => act((d) => auditAjouter(d, { ...e, appareil: appareilNom() }), null, { systeme: true });
  const echec = (msg, resume) => { essais.current += 1; journal({ action: 'echec', resume }); if (essais.current >= 5) { setAttente(30); essais.current = 0; setErr('5 essais manqués : patientez 30 secondes.'); } else setErr(msg); };
  const connexion = async (e) => {
    if (e) e.preventDefault(); if (busy || attente) return; setErr('');
    if (!ident.trim() || !mdp) { setErr('Saisissez votre identifiant et votre mot de passe.'); return; }
    setBusy(true); const u = utilisateurParIdentifiant(db, ident); let ok = false;
    try { ok = u && u.actif !== false ? await mdpVerifier(mdp, u.mdp) : (await mdpVerifier(mdp, FAUSSE_EMPREINTE), false); } catch (er) { ok = false; }
    setBusy(false);
    if (!ok) { setMdp(''); echec(u && u.actif === false ? 'Cet identifiant est désactivé : adressez-vous à un administrateur.' : 'Identifiant ou mot de passe incorrect.', `Identifiant « ${String(ident).trim().slice(0, 60)} »${u && u.actif === false ? ' (désactivé)' : ''}`); return; }
    essais.current = 0; dernierIdentEcrire(u.identifiant);
    journal({ uid: u.id, action: 'connexion', resume: verrou ? 'Déverrouillage' : 'Connexion' });
    onConnecte(u.id, garder);
  };
  const secours = async (e) => {
    if (e) e.preventDefault(); if (busy || attente) return; setErr('');
    const sec = (db.settings.securite || {}).secours; const u = utilisateurParIdentifiant(db, ident);
    const pb = mdpErreur(db, n1, n2); if (pb) { setErr(pb); return; }
    setBusy(true); let ok = false; try { ok = !!sec && await mdpVerifier(codeSecoursNorm(code), sec); } catch (er) { ok = false; }
    if (!ok || !u || u.actif === false || !estAdmin(db, u.id)) { setBusy(false); echec(!ok ? 'Code de secours incorrect.' : 'Le code de secours réinitialise le mot de passe d’un administrateur actif : vérifiez l’identifiant.', `Code de secours (identifiant « ${String(ident).trim().slice(0, 60)} »)`); return; }
    const h = await mdpEmpreinte(n1); const nc = codeSecoursNouveau(); const hs = await mdpEmpreinte(codeSecoursNorm(nc)); setBusy(false);
    const r = act((d) => { utilisateurMotDePasse(d, u.id, h, false); securiteRegler(d, { secours: hs }); auditAjouter(d, [{ uid: u.id, action: 'secours', resume: 'Mot de passe réinitialisé avec le code de secours (nouveau code créé)', appareil: appareilNom() }, { uid: u.id, action: 'connexion', resume: 'Connexion', appareil: appareilNom() }]); return okr(); }, null, { systeme: true });
    if (r && r.ok) { dernierIdentEcrire(u.identifiant); setUidSecours(u.id); setNouveauCode(nc); setMode('nouveauCode'); }
  };
  return (
    <div className="login-wrap" data-connexion="">
      <form className="login-card card" onSubmit={mode === 'secours' ? secours : connexion} aria-label={mode === 'secours' ? 'Code de secours' : 'Connexion'}>
        <div className="login-tete"><Brand size={44} onClick={onPresentation} /><LangueChoix compact /></div>
        {E.logo ? <div className="login-societe" data-login-logo=""><CompanyLogo maxH={72} maxW={260} /></div> : null}
        {mode === 'nouveauCode' ? <>
          <h1 className="login-titre">Mot de passe réinitialisé</h1>
          <CodeSecoursBloc code={nouveauCode} />
          <Btn kind="primary" className="w-full" onClick={() => onConnecte(uidSecours, garder)}>Continuer</Btn>
        </> : <>
          <div><h1 className="login-titre">{verrou && u0 ? 'Session verrouillée' : mode === 'secours' ? 'Code de secours' : 'Connexion'}</h1>
            <p className="text-sm text-ink2">{verrou && u0 ? <>{u0.nom || u0.identifiant} : saisissez votre mot de passe pour reprendre.</> : mode === 'secours' ? 'Réinitialisez le mot de passe d’un administrateur avec le code de secours remis à l’activation des identifiants.' : <>{E.nom ? <b>{E.nom}</b> : 'Œnotrack'} : identifiez-vous pour accéder à la traçabilité.</>}</p></div>
          {!(verrou && u0) || mode === 'secours' ? <Field label={mode === 'secours' ? 'Identifiant de l’administrateur' : 'Identifiant'}><input className="inp" value={ident} onChange={(e) => setIdent(e.target.value)} autoComplete="username" autoCapitalize="off" spellCheck={false} autoFocus={!ident || mode === 'secours'} aria-label="Identifiant" /></Field> : null}
          {mode === 'secours' ? <>
            <Field label="Code de secours"><input className="inp num" value={code} onChange={(e) => setCode(e.target.value)} placeholder="XXXX-XXXX-XXXX-XXXX" autoCapitalize="characters" spellCheck={false} aria-label="Code de secours" /></Field>
            <Field label="Nouveau mot de passe"><MdpInput value={n1} onChange={setN1} label="Nouveau mot de passe" autoComplete="new-password" /><MdpJauge mdp={n1} min={securiteReglages(db).longueurMin} /></Field>
            <Field label="Confirmer le mot de passe"><MdpInput value={n2} onChange={setN2} label="Confirmer le mot de passe" autoComplete="new-password" /></Field>
          </> : <>
            <Field label="Mot de passe"><MdpInput value={mdp} onChange={setMdp} label="Mot de passe" autoFocus={!!ident} /></Field>
            <Check checked={garder} onChange={setGarder} label="Rester connecté sur cet appareil" />
          </>}
          {err ? <div className="login-err" role="alert">{err}</div> : null}
          <Btn kind="primary" type="submit" className="w-full" disabled={busy || attente > 0}>{busy ? 'Vérification…' : attente ? `Patientez ${attente} s` : mode === 'secours' ? 'Réinitialiser et se connecter' : verrou && u0 ? 'Déverrouiller' : 'Se connecter'}</Btn>
          {mode === 'connexion' ? <CleBoutonConnexion uid={verrou && u0 ? u0.id : ''} disabled={busy || attente > 0} onOk={({ u, k }) => { essais.current = 0; setErr(''); dernierIdentEcrire(u.identifiant); journal({ uid: u.id, action: 'connexion', type: 'cle', cibleId: k.id, resume: `${verrou ? 'Déverrouillage' : 'Connexion'} par clé d’accès (${k.nom})` }); onConnecte(u.id, garder); }} onErr={(m) => { setErr(m); if (!/annulée/.test(m)) journal({ action: 'echec', resume: `Clé d’accès : ${m}` }); }} /> : null}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            {mode === 'secours' ? <button type="button" className="linkish" onClick={() => { setMode('connexion'); setErr(''); }}>← Retour à la connexion</button>
              : <details className="login-aide"><summary className="linkish">Mot de passe oublié ?</summary><p className="text-xs text-ink2">Demandez à un administrateur de réinitialiser votre mot de passe (Paramètres › Utilisateurs & droits). Administrateur : <button type="button" className="linkish" onClick={() => { setMode('secours'); setErr(''); }}>utiliser le code de secours</button>.</p></details>}
            {verrou && u0 && mode === 'connexion' ? <button type="button" className="linkish" onClick={onChanger}>Changer d’utilisateur</button> : null}
          </div>
        </>}
        <p className="login-pied">🔐 Les mots de passe ne sont jamais enregistrés : seule leur empreinte (PBKDF2) est conservée.</p>
      </form>
    </div>
  );
}
// code de secours à noter (activation, renouvellement)
function CodeSecoursBloc({ code }) {
  const { toast } = useApp();
  return (
    <div className="space-y-2" data-code-secours="">
      <Notice tone="warn" title="Notez ce code de secours maintenant">Il ne sera plus affiché. Il permet de réinitialiser le mot de passe d’un administrateur si tous les mots de passe administrateur sont perdus. Gardez-le hors de l’ordinateur (papier rangé, coffre).</Notice>
      <div className="code-secours num" aria-label="Code de secours">{code}</div>
      <div className="flex flex-wrap gap-2"><Btn size="sm" onClick={() => { try { navigator.clipboard.writeText(code).then(() => toast('Code copié.'), () => toast('Copie impossible : recopiez le code.', 'bad')); } catch (e) { toast('Copie impossible : recopiez le code.', 'bad'); } }}>Copier</Btn></div>
    </div>
  );
}
function CodeSecoursSheet({ code, onClose }) {
  const [note, setNote] = useState(false);
  return <Sheet title="Code de secours" onClose={() => { if (note) onClose(); }} footer={<Btn kind="primary" disabled={!note} onClick={onClose}>Terminer</Btn>}><div className="space-y-3"><CodeSecoursBloc code={code} /><Check checked={note} onChange={setNote} label="J’ai noté ce code en lieu sûr" /></div></Sheet>;
}

/* ---------- changer son mot de passe (obligatoire après un mot de passe provisoire) ---------- */
function ChangerMdpSheet({ force, onClose }) {
  const { db, act, uid, toast } = useApp(); const u = utilisateurDe(db, uid);
  const [ancien, setAncien] = useState(''); const [a, setA] = useState(''); const [b, setB] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const save = async () => {
    if (busy || !u) return; setErr('');
    if (!force) { setBusy(true); const ok = await mdpVerifier(ancien, u.mdp); setBusy(false); if (!ok) { setErr('Mot de passe actuel incorrect.'); return; } }
    const pb = mdpErreur(db, a, b); if (pb) { setErr(pb); return; }
    if (force && await mdpVerifier(a, u.mdp)) { setErr('Choisissez un mot de passe différent du mot de passe provisoire.'); return; }
    setBusy(true); const h = await mdpEmpreinte(a); setBusy(false);
    const r = act((d) => utilisateurMotDePasse(d, uid, h, false)); if (r && r.ok) { toast('Mot de passe changé.'); onClose(); }
  };
  return (
    <FormSheet title={force ? 'Choisissez votre mot de passe' : 'Changer mon mot de passe'} sub={force ? `${u ? u.nom || u.identifiant : ''} : votre mot de passe actuel est provisoire. Choisissez-en un personnel pour continuer.` : 'Le nouveau mot de passe s’applique sur tous les appareils.'} onClose={force ? () => {} : onClose} onSave={save} saveLabel={busy ? 'Enregistrement…' : 'Enregistrer'} disabled={busy}>
      {!force ? <Field label="Mot de passe actuel"><MdpInput value={ancien} onChange={setAncien} label="Mot de passe actuel" autoFocus /></Field> : null}
      <Field label="Nouveau mot de passe" help={`${securiteReglages(db).longueurMin} caractères minimum, lettres et chiffres (ou signes) mélangés.`}><MdpInput value={a} onChange={setA} label="Nouveau mot de passe" autoComplete="new-password" autoFocus={force} /><MdpJauge mdp={a} min={securiteReglages(db).longueurMin} /></Field>
      <Field label="Confirmer le nouveau mot de passe"><MdpInput value={b} onChange={setB} label="Confirmer le nouveau mot de passe" autoComplete="new-password" /></Field>
      {err ? <div className="login-err" role="alert">{err}</div> : null}
    </FormSheet>
  );
}

/* ---------- en-tête : utilisateur connecté ---------- */
function UtilisateurChip() {
  const { db, uid, secu } = useApp(); const [open, setOpen] = useState(false);
  if (!secu || !uid) return null; const u = utilisateurDe(db, uid);
  return (<>
    <button type="button" className="chip chip-ok" style={{ cursor: 'pointer' }} data-utilisateur="" onClick={() => setOpen(true)} title="Utilisateur connecté : compte, mot de passe, verrouillage, déconnexion">🔐 {u ? u.nom || u.identifiant : '?'} · {profilNom(db, u)}</button>
    {open ? ReactDOM.createPortal(<CompteSheet onClose={() => setOpen(false)} />, document.body) : null}
  </>);
}
function CompteSheet({ onClose }) {
  const { db, uid, verrouiller, deconnecter, setTab, droit } = useApp(); const u = utilisateurDe(db, uid); const [mdp, setMdp] = useState(false);
  if (!u) return null; const p = profilDe(db, u);
  return (
    <Sheet title={u.nom || u.identifiant} sub={`Identifiant « ${u.identifiant} » · profil ${p ? `« ${p.nom} »` : 'aucun'}`} onClose={onClose}
      footer={<><Btn className="mr-auto" kind="danger" onClick={() => { onClose(); deconnecter(); }}>Se déconnecter</Btn><Btn onClick={() => { onClose(); verrouiller(); }}>🔒 Verrouiller</Btn><Btn kind="primary" onClick={onClose}>Fermer</Btn></>}>
      <div className="space-y-4">
        <dl className="kv"><dt>Profil</dt><dd>{p ? p.nom : '—'}{p && p.description ? <div className="text-xs text-ink2">{p.description}</div> : null}</dd>
          <dt>Opérateur</dt><dd>{u.operateurId ? operateurNom(db, u.operateurId) : <span className="text-ink2">non relié (les opérations proposent l’opérateur de l’appareil)</span>}</dd>
          <dt>Dernière connexion</dt><dd>{fmtDateHeure(derniereConnexion(db, uid)) || '—'}</dd>
          <dt>Verrouillage</dt><dd>{securiteReglages(db).verrouMin ? `après ${securiteReglages(db).verrouMin} min sans activité` : 'jamais automatique'}</dd></dl>
        <div className="flex flex-wrap gap-2"><Btn onClick={() => setMdp(true)}>🔑 Changer mon mot de passe</Btn>{droit('utilisateurs') ? <Btn onClick={() => { onClose(); setTab('params', 'utilisateurs'); }}>Gérer les utilisateurs et les droits</Btn> : null}</div>
        <MesClesBloc />
      </div>
      {mdp ? <ChangerMdpSheet onClose={() => setMdp(false)} /> : null}
    </Sheet>
  );
}

/* ---------- Paramètres › Utilisateurs & droits ---------- */
function UtilisateursView() {
  const { db, uid, secu, droit, toast } = useApp(); const [code, setCode] = useState(''); // code de secours à montrer juste après l'activation
  const codeSheet = code ? <CodeSecoursSheet code={code} onClose={() => { setCode(''); toast('Identifiants activés : créez maintenant les comptes de l’équipe.'); }} /> : null;
  if (!secu) return <><ActivationView onCode={setCode} />{codeSheet}</>;
  if (!droit('utilisateurs')) return <MonCompteView />;
  return (
    <div className="space-y-6" data-utilisateurs="">
      {codeSheet}
      <Notice tone="ok" title="Identifiants activés">Chaque personne se connecte avec son identifiant et son mot de passe ; ses droits dépendent de son profil. Toutes les connexions et les saisies sont tracées dans le journal des accès ci-dessous. Les mots de passe ne sont jamais enregistrés : seule leur empreinte salée (PBKDF2-SHA256, 120 000 itérations) est conservée, dans la base et dans les sauvegardes.</Notice>
      <UtilisateursListe />
      <AppareilsAcceptes />
      <ProfilsListe />
      <SecuriteReglages />
      <JournalAcces />
    </div>
  );
}
function MonCompteView() {
  const { db, uid } = useApp(); const [mdp, setMdp] = useState(false); const u = utilisateurDe(db, uid);
  return (
    <div className="space-y-4">
      <Notice tone="info" title="Gestion des utilisateurs réservée aux administrateurs">Votre profil « {profilNom(db, u)} » ne permet pas de gérer les identifiants. Vous pouvez changer votre mot de passe.</Notice>
      <Btn onClick={() => setMdp(true)}>🔑 Changer mon mot de passe</Btn>
      <div className="card p-4"><MesClesBloc /></div>
      {mdp ? <ChangerMdpSheet onClose={() => setMdp(false)} /> : null}
    </div>
  );
}
// activation (premier administrateur) ou réactivation avec les comptes existants
function ActivationView({ onCode }) {
  const { db, act, connecter, toast } = useApp(); const anciens = adminsActifs(db);
  const [mode, setMode] = useState(anciens.length ? 'reactiver' : 'nouveau');
  const [f, setF] = useState({ identifiant: '', nom: '', operateurId: '', mdp: '', mdp2: '' }); const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const activer = async () => {
    setErr(''); if (busy) return;
    if (mode === 'reactiver') {
      const u = utilisateurParIdentifiant(db, f.identifiant); setBusy(true); const ok = !!u && u.actif !== false && estAdmin(db, u.id) && await mdpVerifier(f.mdp, u.mdp); setBusy(false);
      if (!ok) { setErr('Identifiant ou mot de passe d’administrateur incorrect.'); return; }
      const r = act((d) => { d.settings.securite = { ...(d.settings.securite || {}), actif: true }; auditAjouter(d, [{ uid: u.id, action: 'securite', resume: 'Identifiants réactivés' }, { uid: u.id, action: 'connexion', resume: 'Connexion', appareil: appareilNom() }]); return okr(); }, null, { systeme: true });
      if (r && r.ok) { connecter(u.id, false, { rester: true }); toast('Identifiants réactivés : vous êtes connecté.'); } return;
    }
    if (!f.identifiant.trim()) { setErr('Choisissez votre identifiant.'); return; }
    const pb = mdpErreur(db, f.mdp, f.mdp2); if (pb) { setErr(pb); return; }
    setBusy(true); const h = await mdpEmpreinte(f.mdp); const c = codeSecoursNouveau(); const hs = await mdpEmpreinte(codeSecoursNorm(c)); setBusy(false);
    const r = act((d) => { const r1 = securiteActiver(d, { identifiant: f.identifiant, nom: f.nom, operateurId: f.operateurId, mdp: h, secours: hs }); if (r1.ok) auditAjouter(d, [{ uid: r1.id, action: 'securite', resume: 'Identifiants activés' }, { uid: r1.id, action: 'connexion', resume: 'Connexion', appareil: appareilNom() }]); return r1; }, null, { systeme: true });
    if (r && r.ok) { dernierIdentEcrire(f.identifiant.trim()); onCode(c); connecter(r.id, false, { rester: true }); }
  };
  return (
    <div className="space-y-5" data-activation="">
      <Notice tone="info" title="Identifiants et droits (comme un logiciel de traçabilité)">
        Une fois activés, chacun se connecte avec <b>son identifiant et son mot de passe</b>, et ne voit ou ne saisit que ce que son <b>profil</b> autorise (opérateur de chai, laboratoire, consultation…). Chaque connexion, saisie, correction et suppression est inscrite au <b>journal des accès</b> avec son auteur.
        Les mots de passe ne sont <b>jamais enregistrés</b> : seule une empreinte irréversible (PBKDF2-SHA256 salé, 120 000 itérations) est gardée. Les données elles-mêmes ne sont pas chiffrées : protégez aussi l’accès aux appareils et au dossier Drive.
      </Notice>
      {anciens.length ? <div className="flex flex-wrap gap-2"><Btn size="sm" kind={mode === 'reactiver' ? 'primary' : undefined} onClick={() => setMode('reactiver')}>Réactiver avec les comptes existants</Btn><Btn size="sm" kind={mode === 'nouveau' ? 'primary' : undefined} onClick={() => setMode('nouveau')}>Nouvel administrateur</Btn></div> : null}
      <form className="card grid max-w-xl gap-3 p-4" onSubmit={(e) => { e.preventDefault(); activer(); }}>
        <h3 className="text-lg font-semibold">{mode === 'reactiver' ? 'Réactiver les identifiants' : 'Créer le compte administrateur'}</h3>
        <Field label="Identifiant" help={mode === 'nouveau' ? 'Ex. prénom ou prénom.nom, sans espace.' : `Administrateurs : ${anciens.map((u) => u.identifiant).join(', ')}`}><input className="inp" value={f.identifiant} onChange={(e) => set('identifiant', e.target.value)} autoComplete="username" autoCapitalize="off" spellCheck={false} aria-label="Identifiant" /></Field>
        {mode === 'nouveau' ? <G><Field label="Nom affiché"><TI value={f.nom} onChange={(v) => set('nom', v)} placeholder="ex. Julien Morel" /></Field>
          <Field label="Opérateur correspondant (facultatif)"><select className="inp" value={f.operateurId} onChange={(e) => set('operateurId', e.target.value)} aria-label="Opérateur correspondant"><option value="">—</option>{operateursTries(db, false).map((o) => <option key={o.id} value={o.id}>{operateurPlein(o)}</option>)}</select></Field></G> : null}
        <Field label="Mot de passe"><MdpInput value={f.mdp} onChange={(v) => set('mdp', v)} label="Mot de passe" autoComplete={mode === 'nouveau' ? 'new-password' : 'current-password'} />{mode === 'nouveau' ? <MdpJauge mdp={f.mdp} min={securiteReglages(db).longueurMin} /> : null}</Field>
        {mode === 'nouveau' ? <Field label="Confirmer le mot de passe"><MdpInput value={f.mdp2} onChange={(v) => set('mdp2', v)} label="Confirmer le mot de passe" autoComplete="new-password" /></Field> : null}
        {err ? <div className="login-err" role="alert">{err}</div> : null}
        <div><Btn kind="primary" type="submit" disabled={busy}>{busy ? 'Préparation…' : mode === 'reactiver' ? 'Réactiver et me connecter' : '🔐 Activer les identifiants'}</Btn></div>
        {mode === 'nouveau' ? <p className="help">Un <b>code de secours</b> vous sera remis : il permet de retrouver l’accès si le mot de passe administrateur est perdu.</p> : null}
      </form>
    </div>
  );
}
function UtilisateursListe() {
  const { db, act, confirm, uid } = useApp(); const [form, setForm] = useState(null); const [reset, setReset] = useState(null);
  const L = [...(db.utilisateurs || [])].sort((a, b) => (a.actif === false) - (b.actif === false) || String(a.nom || a.identifiant).localeCompare(String(b.nom || b.identifiant), 'fr'));
  const basculer = async (u) => { if (u.actif !== false && !(await confirm({ title: `Désactiver « ${u.identifiant} » ?`, body: 'Cette personne ne pourra plus se connecter. Son nom reste dans le journal et sur ses saisies. Vous pourrez la réactiver.', ok: 'Désactiver', danger: true }))) return; act((d) => utilisateurActif(d, u.id, u.actif === false), u.actif === false ? 'Utilisateur réactivé.' : 'Utilisateur désactivé.'); };
  const suppr = async (u) => { if (await confirm({ title: `Supprimer « ${u.identifiant} » ?`, body: 'Possible seulement si cet identifiant n’a jamais servi.', ok: 'Supprimer', danger: true })) act((d) => utilisateurDelete(d, u.id), 'Utilisateur supprimé.'); };
  return (
    <Sec title={`Utilisateurs (${L.filter((u) => u.actif !== false).length} actifs)`} right={<Btn kind="primary" size="sm" onClick={() => setForm({ id: null })}>+ Nouvel utilisateur</Btn>}>
      <Tbl rows={L} cols={[
        { h: 'Identifiant', r: (u) => <span className="whitespace-nowrap"><b>{u.identifiant}</b>{u.id === uid ? <Chip tone="info" className="ml-1">vous</Chip> : null}</span> },
        { h: 'Nom', r: (u) => u.nom || '' }, { h: 'Profil', r: (u) => <Chip tone={estAdmin(db, u.id) ? 'warn' : undefined}>{profilNom(db, u)}</Chip> },
        { h: 'Opérateur', cls: 'hm', r: (u) => (u.operateurId ? operateurNom(db, u.operateurId) : '—') },
        { h: 'Dernière connexion', cls: 'hm', r: (u) => <span className="num whitespace-nowrap text-sm">{fmtDateHeure(derniereConnexion(db, u.id)) || '—'}</span> },
        { h: 'État', r: (u) => <span className="flex flex-wrap gap-1">{u.actif === false ? <Chip>désactivé</Chip> : <Chip tone="ok">actif</Chip>}{u.doitChanger && u.actif !== false ? <Chip tone="warn">mot de passe provisoire</Chip> : null}</span> },
        { h: '', r: (u) => <span className="flex flex-wrap gap-1"><Btn size="sm" onClick={() => setForm({ id: u.id })} aria-label={`Modifier ${u.identifiant}`}>Modifier</Btn><Btn size="sm" onClick={() => setReset(u.id)} aria-label={`Réinitialiser le mot de passe de ${u.identifiant}`} title="Réinitialiser le mot de passe">🔑</Btn>
          {u.id !== uid ? <Btn size="sm" onClick={() => basculer(u)} aria-label={`${u.actif === false ? 'Réactiver' : 'Désactiver'} ${u.identifiant}`}>{u.actif === false ? 'Réactiver' : 'Désactiver'}</Btn> : null}
          {u.id !== uid ? <Btn size="sm" kind="danger" onClick={() => suppr(u)} aria-label={`Supprimer ${u.identifiant}`}>✕</Btn> : null}</span> }]} />
      {form ? <UtilisateurForm id={form.id} onClose={() => setForm(null)} /> : null}
      {reset ? <MdpResetSheet id={reset} onClose={() => setReset(null)} /> : null}
    </Sec>
  );
}
function UtilisateurForm({ id, onClose }) {
  const { db, act, toast } = useApp(); const u = utilisateurDe(db, id);
  const [f, setF] = useState(() => ({ identifiant: u ? u.identifiant : '', nom: u ? u.nom || '' : '', profilId: u ? u.profilId : 'pf_operateur', operateurId: u ? u.operateurId || '' : '', mdp: u ? '' : mdpProvisoire(), doitChanger: true }));
  const set = (k, v) => setF((x) => ({ ...x, [k]: v })); const [busy, setBusy] = useState(false);
  const p = profilDe(db, f.profilId);
  const save = async () => {
    if (busy) return; let h = null;
    if (!u) { const q = mdpQualite(f.mdp, securiteReglages(db).longueurMin); if (!q.note) { toast(`Mot de passe provisoire : ${q.msg}`, 'bad'); return; } setBusy(true); h = await mdpEmpreinte(f.mdp); setBusy(false); }
    const r = act((d) => utilisateurSave(d, { ...f, mdp: h }, id), u ? 'Utilisateur modifié.' : `Utilisateur « ${f.identifiant.trim()} » créé : transmettez-lui son mot de passe provisoire.`); if (r && r.ok) onClose();
  };
  return (
    <FormSheet title={u ? `Modifier ${u.identifiant}` : 'Nouvel utilisateur'} sub="Identifiant de connexion, profil de droits et opérateur correspondant." onClose={onClose} onSave={save} disabled={busy}>
      <G><Field label="Identifiant" help="Sans espace : prénom, prénom.nom, initiales…"><input className="inp" value={f.identifiant} onChange={(e) => set('identifiant', e.target.value)} autoCapitalize="off" spellCheck={false} aria-label="Identifiant" autoFocus={!u} /></Field>
        <Field label="Nom affiché"><TI value={f.nom} onChange={(v) => set('nom', v)} placeholder="ex. Thomas Girard" /></Field></G>
      <G><Field label="Profil de droits" help={p ? p.description : ''}><select className="inp" value={f.profilId} onChange={(e) => set('profilId', e.target.value)} aria-label="Profil de droits">{(db.profils || []).map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select></Field>
        <Field label="Opérateur correspondant" help="Proposé d’office comme opérateur des opérations qu’il saisit."><select className="inp" value={f.operateurId} onChange={(e) => { const v = e.target.value; set('operateurId', v); if (v && !f.nom) set('nom', operateurNom(db, v)); }} aria-label="Opérateur correspondant"><option value="">—</option>{operateursTries(db, false).map((o) => <option key={o.id} value={o.id}>{operateurPlein(o)}</option>)}</select></Field></G>
      {!u ? <Group label="Mot de passe provisoire" help="À transmettre à la personne : elle choisira son propre mot de passe à la première connexion.">
        <div className="flex flex-wrap items-center gap-2"><div style={{ flex: '1 1 200px' }}><input className="inp num" value={f.mdp} onChange={(e) => set('mdp', e.target.value)} aria-label="Mot de passe provisoire" spellCheck={false} /></div><Btn size="sm" onClick={() => set('mdp', mdpProvisoire())}>↻ Autre</Btn></div>
        <div className="mt-2"><Check checked={f.doitChanger} onChange={(v) => set('doitChanger', v)} label="À changer à la première connexion" /></div></Group> : null}
    </FormSheet>
  );
}
function MdpResetSheet({ id, onClose }) {
  const { db, act } = useApp(); const u = utilisateurDe(db, id); const [mdp, setMdp] = useState(mdpProvisoire()); const [dc, setDc] = useState(true); const [busy, setBusy] = useState(false);
  const save = async () => { const q = mdpQualite(mdp, securiteReglages(db).longueurMin); if (!q.note || busy) return; setBusy(true); const h = await mdpEmpreinte(mdp); setBusy(false); const r = act((d) => utilisateurMotDePasse(d, id, h, dc), `Mot de passe de « ${u.identifiant} » réinitialisé.`); if (r && r.ok) onClose(); };
  if (!u) return null;
  return (
    <FormSheet title={`Mot de passe de ${u.identifiant}`} sub="Nouveau mot de passe provisoire à transmettre à la personne." onClose={onClose} onSave={save} saveLabel={busy ? 'Enregistrement…' : 'Réinitialiser'} disabled={busy || !mdpQualite(mdp, securiteReglages(db).longueurMin).note}>
      <div className="flex flex-wrap items-center gap-2"><div style={{ flex: '1 1 200px' }}><input className="inp num" value={mdp} onChange={(e) => setMdp(e.target.value)} aria-label="Nouveau mot de passe provisoire" spellCheck={false} /></div><Btn size="sm" onClick={() => setMdp(mdpProvisoire())}>↻ Autre</Btn></div>
      <MdpJauge mdp={mdp} min={securiteReglages(db).longueurMin} />
      <Check checked={dc} onChange={setDc} label="À changer à la prochaine connexion" />
    </FormSheet>
  );
}
// résumé d'un profil : modules en saisie / en lecture, droits spéciaux
const profilResume = (p) => { const e = MODULES_DEFAUT.filter((k) => profilNiveau(p, k) === 'ecriture').length; const l = MODULES_DEFAUT.filter((k) => profilNiveau(p, k) === 'lecture').length; const s = DROITS_SPECIAUX.filter(([k]) => p.speciaux && p.speciaux[k]).map((d) => d[1].toLowerCase()); return `${e} module(s) en saisie, ${l} en lecture${s.length ? ` · ${s.join(', ')}` : ''}`; };
function ProfilsListe() {
  const { db, act, confirm } = useApp(); const [form, setForm] = useState(null);
  const nb = (id) => (db.utilisateurs || []).filter((u) => u.profilId === id && u.actif !== false).length;
  return (
    <Sec title="Profils de droits" right={<Btn size="sm" onClick={() => setForm({ id: null })}>+ Nouveau profil</Btn>}>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))' }}>
        {(db.profils || []).map((p) => (
          <div key={p.id} className="card flex flex-col gap-2 p-3" data-profil={p.id}>
            <div className="flex items-start justify-between gap-2"><b>{p.nom}</b><Chip>{nb(p.id)} utilisateur(s)</Chip></div>
            <div className="text-sm text-ink2">{p.description}</div>
            <div className="text-xs text-ink2">{profilResume(p)}</div>
            <div className="mt-auto flex flex-wrap gap-1"><Btn size="sm" onClick={() => setForm({ id: p.id })}>{p.fixe ? 'Voir' : 'Modifier'}</Btn><Btn size="sm" onClick={() => setForm({ id: null, base: p.id })}>Dupliquer</Btn>
              {!p.fixe ? <Btn size="sm" kind="danger" onClick={async () => { if (await confirm({ title: `Supprimer le profil « ${p.nom} » ?`, ok: 'Supprimer', danger: true })) act((d) => profilDelete(d, p.id), 'Profil supprimé.'); }} aria-label={`Supprimer le profil ${p.nom}`}>✕</Btn> : null}</div>
          </div>))}
      </div>
      {form ? <ProfilForm id={form.id} base={form.base} onClose={() => setForm(null)} /> : null}
    </Sec>
  );
}
function ProfilForm({ id, base, onClose }) {
  const { db, act } = useApp(); const p0 = profilDe(db, id || base); const fixe = !!(id && p0 && p0.fixe);
  const [f, setF] = useState(() => ({ nom: id ? p0.nom : p0 ? `${p0.nom} (copie)` : '', description: p0 ? p0.description || '' : '', modules: { ...((p0 && p0.modules) || {}), ...Object.fromEntries(MODULES_DEFAUT.map((m) => [m, profilNiveau(p0, m)])) }, speciaux: { ...((p0 && p0.speciaux) || {}) } }));
  const setM = (m, v) => setF((x) => ({ ...x, modules: { ...x.modules, [m]: v } })); const setS = (k, v) => setF((x) => ({ ...x, speciaux: { ...x.speciaux, [k]: v } }));
  const save = () => { if (fixe) { onClose(); return; } const r = act((d) => profilSave(d, f, id), id ? 'Profil modifié.' : 'Profil créé.'); if (r && r.ok) onClose(); };
  const tous = (v) => setF((x) => ({ ...x, modules: Object.fromEntries(MODULES_DEFAUT.map((m) => [m, v])) }));
  return (
    <FormSheet wide title={fixe ? `Profil ${p0.nom}` : id ? `Modifier le profil ${p0.nom}` : 'Nouveau profil de droits'} sub={fixe ? 'Profil verrouillé : tous les droits, dont la gestion des utilisateurs.' : 'Accès à chaque module (aucun, lecture, saisie) et droits particuliers.'} onClose={onClose} onSave={save} saveLabel={fixe ? 'Fermer' : 'Enregistrer'}>
      <G><Field label="Nom du profil"><TI value={f.nom} onChange={(v) => setF((x) => ({ ...x, nom: v }))} disabled={fixe} /></Field><Field label="Description"><TI value={f.description} onChange={(v) => setF((x) => ({ ...x, description: v }))} disabled={fixe} /></Field></G>
      <Group label="Accès aux modules">
        {!fixe ? <div className="mb-2 flex flex-wrap gap-1 text-xs"><span className="self-center text-ink2">Tout mettre en :</span>{DROITS_NIVEAUX.map(([v, l]) => <Btn key={v} size="sm" onClick={() => tous(v)}>{l}</Btn>)}</div> : null}
        <div className="droits-grille" role="table" aria-label="Accès aux modules">
          {MODULES_DEFAUT.map((m) => (
            <div key={m} className="droits-ligne" role="row" data-droit-module={m}>
              <span className="droits-mod" role="rowheader">{(MODULE_DEFS[m] || {}).icone} {moduleNom(m)}{m === 'params' ? <span className="block text-xs text-ink2">en saisie : modifier les paramètres</span> : null}</span>
              <span className="droits-choix" role="radiogroup" aria-label={`Accès : ${moduleNom(m)}`}>
                {DROITS_NIVEAUX.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={(fixe ? 'ecriture' : f.modules[m]) === v} disabled={fixe} className={cx('droits-btn', (fixe ? 'ecriture' : f.modules[m]) === v && 'on', v)} onClick={() => setM(m, v)}>{v === 'aucun' ? '✕ Aucun' : v === 'lecture' ? '👁 Lecture' : '✎ Saisie'}</button>)}
              </span>
            </div>))}
        </div>
      </Group>
      <Group label="Droits particuliers">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))' }}>
          {DROITS_SPECIAUX.map(([k, l, aide]) => <label key={k} className="droits-sp"><input type="checkbox" className="h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={fixe || !!f.speciaux[k]} disabled={fixe} onChange={(e) => setS(k, e.target.checked)} aria-label={l} /><span><b className="text-sm">{l}</b><span className="block text-xs text-ink2">{aide}</span></span></label>)}
        </div>
      </Group>
    </FormSheet>
  );
}
function SecuriteReglages() {
  const { db, act, confirm, uid, toast, deconnecter } = useApp(); const s = securiteReglages(db); const [code, setCode] = useState(''); const [desact, setDesact] = useState(false);
  const nouveauCode = async () => { if (!(await confirm({ title: 'Créer un nouveau code de secours ?', body: 'L’ancien code ne fonctionnera plus.', ok: 'Créer' }))) return; const c = codeSecoursNouveau(); const hs = await mdpEmpreinte(codeSecoursNorm(c)); const r = act((d) => securiteRegler(d, { secours: hs })); if (r && r.ok) setCode(c); };
  return (
    <Sec title="Réglages de sécurité">
      <div className="card grid gap-4 p-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))' }}>
        <Field label="Verrouillage automatique" help="Après ce délai sans activité, l’écran se verrouille : mot de passe pour reprendre."><select className="inp" value={s.verrouMin} onChange={(e) => act((d) => securiteRegler(d, { verrouMin: e.target.value }), 'Verrouillage réglé.')} aria-label="Verrouillage automatique">{[[5, '5 minutes'], [10, '10 minutes'], [15, '15 minutes'], [30, '30 minutes'], [60, '1 heure'], [120, '2 heures'], [0, 'Jamais']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
        <Field label="Longueur minimale des mots de passe"><select className="inp" value={s.longueurMin} onChange={(e) => act((d) => securiteRegler(d, { longueurMin: e.target.value }), 'Longueur minimale réglée.')} aria-label="Longueur minimale des mots de passe">{[6, 8, 10, 12, 14, 16].map((v) => <option key={v} value={v}>{v} caractères</option>)}</select></Field>
        <div className="flex flex-col gap-2"><span className="lbl">Code de secours</span><Btn onClick={nouveauCode}>Créer un nouveau code de secours…</Btn><span className="help">À utiliser si tous les mots de passe administrateur sont perdus.</span></div>
        <div className="flex flex-col gap-2"><span className="lbl">Désactiver</span><Btn kind="danger" onClick={() => setDesact(true)}>Désactiver les identifiants…</Btn><span className="help">Plus de connexion : tout le monde a de nouveau tous les droits. Comptes et journal sont gardés.</span></div>
      </div>
      {code ? <CodeSecoursSheet code={code} onClose={() => setCode('')} /> : null}
      {desact ? <DesactiverSheet onClose={() => setDesact(false)} /> : null}
    </Sec>
  );
}
function DesactiverSheet({ onClose }) {
  const { db, act, uid, toast } = useApp(); const u = utilisateurDe(db, uid); const [mdp, setMdp] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const ok = async () => { setBusy(true); const v = u && await mdpVerifier(mdp, u.mdp); setBusy(false); if (!v) { setErr('Mot de passe incorrect.'); return; } const r = act((d) => securiteDesactiver(d)); if (r && r.ok) { toast('Identifiants désactivés : l’application s’ouvre sans connexion.'); onClose(); } };
  return (
    <FormSheet title="Désactiver les identifiants ?" sub="Confirmez avec votre mot de passe. Toutes les personnes auront de nouveau accès à tout, sans connexion." onClose={onClose} onSave={ok} saveLabel={busy ? 'Vérification…' : 'Désactiver'} disabled={busy}>
      <Field label="Votre mot de passe"><MdpInput value={mdp} onChange={setMdp} label="Votre mot de passe" autoFocus /></Field>
      {err ? <div className="login-err" role="alert">{err}</div> : null}
    </FormSheet>
  );
}
function JournalAcces() {
  const { db, toast } = useApp(); const [qui, setQui] = useState(''); const [quoi, setQuoi] = useState(''); const [q, setQ] = useState(''); const [n, setN] = useState(150);
  const L = (db.audit || []).filter((a) => (!qui || a.uid === qui) && (!quoi || a.action === quoi) && (!q || norm(`${a.resume} ${utilisateurNom(db, a.uid)} ${a.appareil || ''}`).includes(norm(q)))).slice().reverse();
  const reg = () => ({ id: 'journal-acces', title: 'Journal des accès', headers: ['Date', 'Heure', 'Utilisateur', 'Identifiant', 'Action', 'Détail', 'Appareil'], rows: L.map((a) => { const u = utilisateurDe(db, a.uid); return [a.date.slice(0, 10), a.date.slice(11, 16), u ? u.nom || '' : '', u ? u.identifiant : '', AUDIT_ACTIONS[a.action] || a.action, a.resume || '', a.appareil || '']; }) });
  const tone = (a) => (a === 'echec' || a === 'suppression' ? 'bad' : a === 'connexion' || a === 'creation' ? 'ok' : a === 'secours' || a === 'securite' ? 'warn' : undefined);
  return (
    <Sec title={`Journal des accès (${(db.audit || []).length})`} right={<span className="flex gap-1"><Btn size="sm" onClick={() => exportRegister(reg(), 'csv', todayISO(), toast)}>CSV</Btn><Btn size="sm" onClick={() => exportRegister(reg(), 'xlsx', todayISO(), toast)}>Excel</Btn></span>}>
      <div className="mb-3 flex flex-wrap gap-2">
        <select className="inp" style={{ width: 'auto' }} value={qui} onChange={(e) => setQui(e.target.value)} aria-label="Filtrer par utilisateur"><option value="">Tous les utilisateurs</option>{(db.utilisateurs || []).map((u) => <option key={u.id} value={u.id}>{u.nom || u.identifiant}</option>)}</select>
        <select className="inp" style={{ width: 'auto' }} value={quoi} onChange={(e) => setQuoi(e.target.value)} aria-label="Filtrer par action"><option value="">Toutes les actions</option>{Object.keys(AUDIT_ACTIONS).map((k) => <option key={k} value={k}>{AUDIT_ACTIONS[k]}</option>)}</select>
        <input className="inp" style={{ width: 'auto', flex: '1 1 200px' }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher dans le journal" />
      </div>
      <Tbl rows={L.slice(0, n)} empty="Aucune entrée." cols={[
        { h: 'Date', r: (a) => <span className="num whitespace-nowrap text-sm">{fmtDateHeure(a.date)}</span> }, { h: 'Utilisateur', r: (a) => (a.uid ? utilisateurNom(db, a.uid) : <span className="text-ink2">—</span>) },
        { h: 'Action', r: (a) => <Chip tone={tone(a.action)}>{AUDIT_ACTIONS[a.action] || a.action}</Chip> }, { h: 'Détail', r: (a) => <span className="text-sm">{a.resume}{a.appareil ? <span className="text-xs text-ink2"> · {a.appareil}</span> : null}</span> }]} />
      {L.length > n ? <div className="mt-2"><Btn size="sm" onClick={() => setN(n + 300)}>Afficher plus ({L.length - n} restantes)</Btn></div> : null}
    </Sec>
  );
}
// bandeau des modules en lecture seule
function LectureSeuleBandeau({ mod }) {
  const { db, uid, secu } = useApp(); if (!secu || !uid || niveauModule(db, uid, mod) !== 'lecture') return null;
  return <div className="mb-4"><Notice tone="info" title="Consultation">Votre profil « {profilNom(db, uid)} » permet de consulter ce module, pas d’y saisir ni d’y modifier.</Notice></div>;
}
