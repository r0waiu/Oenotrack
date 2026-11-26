/* ============ COFFRE DE L'APPAREIL : démarrage (déverrouillage, clé perdue) et réglage (0.38.0-alpha.1) ============
   Moteur : 33d-coffre.js. CoffrePorte s'affiche avant l'application : il ouvre le coffre (base et secrets déchiffrés en mémoire),
   demande le mot de passe de l'appareil s'il y en a un, et ne laisse jamais une base illisible être écrasée (elle est mise de côté).
   CoffreCard : Paramètres › Sauvegarde & Drive, à côté du chiffrement des sauvegardes. */
function CoffrePorte({ children }) {
  const [etat, setEtat] = useState(() => (_coffre.etat === 'pret' || _coffre.etat === 'indisponible' ? _coffre.etat : 'attente'));
  const [mdp, setMdp] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [confirmer, setConfirmer] = useState(false);
  useEffect(() => { let vivant = true; coffreDemarrer().then((e) => { if (vivant) setEtat(e); }, () => { if (vivant) setEtat('indisponible'); }); return () => { vivant = false; }; }, []);
  if (etat === 'pret' || etat === 'indisponible') return children;
  if (etat === 'attente') return <div className="login-wrap" data-coffre="attente"><p className="text-sm text-ink2">Ouverture du coffre de l’appareil…</p></div>;
  const deverrouiller = async (e) => {
    if (e) e.preventDefault(); if (busy || !mdp) return; setBusy(true); setErr('');
    try { const x = await coffreDeverrouiller(mdp); setMdp(''); setEtat(x); } catch (er) { setErr((er && er.message) || 'Mot de passe incorrect.'); }
    setBusy(false);
  };
  const repartir = async () => { setBusy(true); const x = await coffreRepartir(); setBusy(false); setConfirmer(false); setEtat(x); };
  return (
    <div className="login-wrap" data-coffre={etat}>
      <form className="login-card card" onSubmit={deverrouiller} aria-label="Coffre de l’appareil">
        <div className="login-tete"><Brand size={44} /><LangueChoix compact /></div>
        {etat === 'verrouille' ? <>
          <div><h1 className="login-titre">Œnotrack est verrouillé</h1><p className="text-sm text-ink2">Les données de cet appareil sont chiffrées : saisissez le mot de passe de l’appareil pour les ouvrir.</p></div>
          <Field label="Mot de passe de l’appareil"><MdpInput value={mdp} onChange={setMdp} label="Mot de passe de l’appareil" autoFocus /></Field>
          {err ? <div className="login-err" role="alert">{err}</div> : null}
          <Btn kind="primary" type="submit" className="w-full" disabled={busy || !mdp}>{busy ? 'Vérification…' : 'Ouvrir'}</Btn>
          <details className="login-aide"><summary className="linkish">Mot de passe oublié ?</summary><p className="text-xs text-ink2">Personne ne peut le retrouver. Vous pouvez repartir sur cet appareil et reprendre vos données depuis le Drive, le dossier partagé ou une sauvegarde : les données chiffrées actuelles sont mises de côté (jamais effacées).</p><Btn size="sm" kind="danger" onClick={() => setConfirmer(true)}>Repartir sur cet appareil…</Btn></details>
        </> : <>
          <div><h1 className="login-titre">Données de cet appareil illisibles</h1><p className="text-sm text-ink2">La base de cet appareil est chiffrée, mais sa clé n’est plus là : données du navigateur effacées en partie, ou autre profil de navigateur.</p>{_coffre.erreur ? <p className="help">{_coffre.erreur}</p> : null}</div>
          <Notice tone="info" title="Rien n’est effacé">Repartez sur cet appareil puis reprenez vos données depuis le Drive, le dossier partagé ou une sauvegarde (Paramètres › Sauvegarde &amp; Drive). La copie chiffrée est gardée à part dans ce navigateur.</Notice>
          <Btn kind="primary" className="w-full" onClick={() => setConfirmer(true)}>Repartir sur cet appareil…</Btn>
        </>}
        {confirmer ? <div className="space-y-2" data-coffre-repartir=""><Notice tone="warn" title="Repartir sur cet appareil ?">Œnotrack s’ouvrira sur une base vide ; la copie chiffrée est mise de côté. Reprenez ensuite vos données depuis le Drive ou une sauvegarde.</Notice><div className="flex flex-wrap gap-2"><Btn onClick={() => setConfirmer(false)}>Annuler</Btn><Btn kind="danger" disabled={busy} onClick={repartir}>Repartir</Btn></div></div> : null}
        <p className="login-pied">🔐 Chiffrement AES-256 sur l’appareil : le mot de passe n’est enregistré nulle part.</p>
      </form>
    </div>
  );
}
// carte « Coffre de cet appareil » (Paramètres › Sauvegarde & Drive)
function CoffreCard() {
  const { toast } = useApp(); const [, setN] = useState(0); const I = coffreInfo(); const [dlg, setDlg] = useState(null);
  const [m1, setM1] = useState(''); const [m2, setM2] = useState(''); const [m0, setM0] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const ouvrir = (k) => { setDlg(k); setM0(''); setM1(''); setM2(''); setErr(''); };
  const valider = async () => {
    setErr(''); if (dlg !== 'retirer') { const e = coffreMdpErreur(m1, m2); if (e) { setErr(e); return; } }
    setBusy(true);
    try {
      const r = dlg === 'retirer' ? await coffreMdpRetirer(m0) : await coffreMdpActiver(m1, m0);
      if (!r.ok) setErr(r.msg); else { toast(dlg === 'retirer' ? 'Mot de passe de l’appareil retiré : le coffre s’ouvre de nouveau seul sur cet appareil.' : dlg === 'changer' ? 'Mot de passe de l’appareil changé.' : 'Mot de passe de l’appareil activé : il sera demandé à chaque ouverture d’Œnotrack sur cet appareil.'); setDlg(null); setN((x) => x + 1); }
    } catch (e) { setErr((e && e.message) || 'Opération impossible.'); }
    setBusy(false);
  };
  const pret = I.etat === 'pret'; const mdp = I.mode === 'mdp';
  return (
    <section className="card p-4" aria-labelledby="svcoffre" data-coffre-carte={pret ? (mdp ? 'mdp' : 'appareil') : I.etat}>
      <div className="flex flex-wrap items-center gap-3"><div className="sauv-ic" aria-hidden="true">🗝</div><h3 id="svcoffre" className="text-lg font-semibold">Coffre de cet appareil</h3>{pret ? <Chip tone="ok">données chiffrées</Chip> : <Chip tone="warn">non chiffré</Chip>}{pret && mdp ? <Chip tone="ok">mot de passe à l’ouverture</Chip> : null}</div>
      <p className="mt-2 text-sm">Sur cet appareil, la base, les points de restauration, les documents joints, les clés d’API de l’IA, la clé de l’équipe et les connexions aux services sont chiffrés (AES-256). La clé est gardée par le navigateur sous une forme qu’aucun script ne peut lire.</p>{mdp ? <p className="mt-1 text-sm">Elle est aussi protégée par le mot de passe de l’appareil.</p> : null}
      {pret ? <p className="help mt-1">Avec un mot de passe à l’ouverture, une personne qui accède à la session Windows, macOS ou Android ne peut pas lire les données d’Œnotrack sans lui. Il est propre à cet appareil et n’est enregistré nulle part : perdu, il faut reprendre les données depuis le Drive ou une sauvegarde.</p>
        : <div className="mt-2"><Notice tone="warn" title="Chiffrement indisponible dans ce navigateur">Il demande une connexion sécurisée (https) ou l’application installée, et le stockage IndexedDB : les données restent en clair ici.</Notice></div>}
      {pret ? <div className="mt-3 flex flex-wrap gap-2">
        {!mdp ? <Btn onClick={() => ouvrir('activer')}>Demander un mot de passe à l’ouverture…</Btn> : <><Btn onClick={() => ouvrir('changer')}>Changer le mot de passe de l’appareil…</Btn><Btn kind="danger" onClick={() => ouvrir('retirer')}>Retirer le mot de passe…</Btn></>}
      </div> : null}
      {dlg ? <FormSheet title={dlg === 'activer' ? 'Mot de passe de l’appareil' : dlg === 'changer' ? 'Changer le mot de passe de l’appareil' : 'Retirer le mot de passe de l’appareil'} onClose={() => setDlg(null)} onSave={valider} saveLabel={busy ? 'Patientez…' : dlg === 'retirer' ? 'Retirer' : 'Enregistrer'}>
        {mdp ? <Field label="Mot de passe actuel de l’appareil"><MdpInput value={m0} onChange={setM0} label="Mot de passe actuel de l’appareil" autoFocus /></Field> : null}
        {dlg !== 'retirer' ? <><Field label="Nouveau mot de passe" help={`Au moins ${COFFRE_MDP_MIN} caractères : une phrase facile à retenir convient.`}><MdpInput value={m1} onChange={setM1} label="Nouveau mot de passe" autoComplete="new-password" autoFocus={!mdp} /></Field>
          <Field label="Confirmer le mot de passe"><MdpInput value={m2} onChange={setM2} label="Confirmer le mot de passe" autoComplete="new-password" /></Field>
          <Notice tone="warn" title="Mot de passe perdu = données de l’appareil illisibles">Personne ne peut le retrouver. Gardez une sauvegarde à jour ou la synchronisation avec le Drive : les données s’y reprennent.</Notice></> : null}
        {err ? <Notice tone="bad" title="À corriger">{err}</Notice> : null}
      </FormSheet> : null}
    </section>
  );
}
// tests d'interface seulement (window.__oenotrackTests posé par le harnais avant le chargement) : lecture de la copie claire
if (typeof window !== 'undefined' && window.__oenotrackTests) window.__coffreClair = (k) => coffreLire(k);
