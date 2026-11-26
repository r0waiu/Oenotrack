/* ============ STOCKAGE SUR VOTRE DRIVE : connexion, choix du dossier, synchronisation automatique, identifiants ============ */
const CLOUD_ETAT_KEY = 'oenotrack-cloud';
const cloudEtatLire = () => { try { return JSON.parse(window.localStorage.getItem(CLOUD_ETAT_KEY) || 'null') || {}; } catch (e) { return {}; } };
const cloudEtatEcrire = (x) => { try { window.localStorage.setItem(CLOUD_ETAT_KEY, JSON.stringify(x)); } catch (e) { /* ignoré */ } };
const CLOUD_INFOS = {
  google: { ic: '▲', aide: 'Compte Google (Gmail ou Google Workspace)' },
  onedrive: { ic: '☁', aide: 'Compte Microsoft personnel ou professionnel (Microsoft 365)' },
  dropbox: { ic: '◆', aide: 'Compte Dropbox' },
  dossier: { ic: '📁', aide: 'iCloud Drive, kDrive, pCloud… : le dossier que l’application du Drive crée sur l’ordinateur (Chrome ou Edge)' },
};

function useCloud({ db, dbRef, applyDb, toast }) {
  const [etat, setEtat0] = useState(cloudEtatLire); const etatRef = useRef(etat);
  const setEtat = useCallback((p) => { const n = typeof p === 'function' ? p(etatRef.current) : { ...etatRef.current, ...p }; etatRef.current = n; cloudEtatEcrire(n); setEtat0(n); }, []);
  const [statut, setStatut] = useState(''); const [message, setMessage] = useState(''); const [config, setConfig] = useState(cloudConfig);
  const [choix, setChoix] = useState(null); const enCours = useRef(false); const encore = useRef(null);
  const empreinte = useMemo(() => syncEmpreinte(db), [db]); const integre = cloudIntegre();
  const F = etat.fournisseur ? CLOUD_FOURNISSEURS[etat.fournisseur] : null; const lie = !!(F && etat.dossier) && !integre;
  const hote = () => ({
    lireLocale: () => dbRef.current, appliquer: (nd) => applyDb(nd), vide: (L) => baseVide(L), snapLire, snapEcrire,
    // chiffrement (0.29.0-alpha.1) : la base, ses copies du jour et les documents envoyés au Drive sont chiffrés si le réglage commun l'exige
    construire: (L, sync) => sauvTexteSortie(L, JSON.stringify({ format: SAUV_FORMAT, formatVersion: SAUV_VERSION, app: APP_ID, appVersion: APP_VERSION, schema: L.schema, exporteLe: nowISO(), contenu: { contenants: L.contenants.length, lots: L.lots.length, operations: L.ops.length, documents: (L.docs || []).length }, sync, documentsSepares: true, db: L, fichiers: [] }), false),
    lire: async (texte) => { const s = lireSauvegarde(await sauvTexteEntree(texte, false)); return { db: s.db, sync: (s.head && s.head.sync) || null }; },
    docNom: (d) => (chiffrementActif(dbRef.current) ? `${d.id}.chiffre` : docNomDistant(d)),
    docEnvoi: async (b) => { const reg = chiffrementReglage(dbRef.current); if (!reg) return b; const k = await chiffrementCleAppareil(reg.cleId); if (!k) throw { chiffre: true, sansCle: true, message: 'Chiffrement activé : saisissez le mot de passe de l’équipe sur cet appareil (Paramètres › Sauvegarde & Drive › Chiffrement).' }; return fichierChiffre(b, k); },
    docRecu: async (b) => { const u = new Uint8Array(await b.arrayBuffer()); if (!octetsChiffres(u)) return b; const k = await chiffrementCleAppareil(null); return new Blob([await dechiffrerOctets(k, u)]); },
    docLocal: async (id) => { try { return !!(await docGet(id)); } catch (e) { return false; } }, docLire: async (id) => { try { return (await docGet(id)) || null; } catch (e) { return null; } }, docEcrire: (id, b) => docPut(id, b),
    appareil: appareilInfo(), nouvelId: nouvelIdSync, maintenant: nowISO, aujourdhui: todayISO,
  });
  const synchroniser = async (opts) => {
    const e0 = etatRef.current; const P = e0.fournisseur ? CLOUD_FOURNISSEURS[e0.fournisseur] : null;
    if (!P || !e0.dossier || integre || e0.suspendu) return null;
    if (enCours.current) { encore.current = opts || {}; return null; }
    enCours.current = true; setStatut('synchro'); const e = { ...e0, docsDistants: { ...(e0.docsDistants || {}) }, lignee: [...(e0.lignee || [])] }; let r = null;
    const cleNow = (chiffrementReglage(dbRef.current) || {}).cleId || ''; if ((e.docsCle || '') !== cleNow) { e.docsDistants = {}; e.docsCle = cleNow; } // chiffrement activé ou mot de passe changé : documents renvoyés chiffrés
    try {
      r = await cloudSynchroniser(P, e.dossier, e, hote(), opts);
      setEtat({ ...e, derniereSync: nowISO() }); setStatut('ok'); setMessage('');
      if (r.adopte) toast(`Données du dossier « ${e.dossier.nom} » reprises sur cet appareil.`);
      else if (r.recu && !r.recu.identique && r.recu.nRecus) toast(`☁ ${P.nom} : ${syncResume(r.recu.recus)} reçu${r.recu.nRecus > 1 ? 's' : ''}${e.ecritPar ? ` (${e.ecritPar})` : ''}${r.recu.conflits.length ? ` · ${pl(r.recu.conflits.length, 'conflit')} au journal` : ''}.`);
      if (r.recu && r.recu.doublons && r.recu.doublons.length) toast(`Deux lots portent le même code (${r.recu.doublons.join(', ')}) : renommez l’un d’eux.`, 'bad');
    } catch (er0) {
      const er = cloudErreur(er0); setEtat({ ...e });
      if (er0 && er0.chiffre) { setStatut('chiffre'); setMessage(er0.message || 'Fichier chiffré : mot de passe de l’équipe nécessaire.'); }
      else if (er.auth) { setStatut('reconnecter'); setMessage(er.message || 'Connexion à renouveler.'); }
      else if (er.reseau) { setStatut('hors-ligne'); setMessage('Pas de réseau ou service indisponible : vos saisies restent ici et partiront dès son retour.'); }
      else if (er.introuvable) { setStatut('erreur'); setMessage('Dossier introuvable (supprimé, déplacé ou plus partagé) : choisissez-en un autre.'); }
      else { setStatut('erreur'); setMessage(er.message || 'Synchronisation impossible.'); }
    } finally {
      enCours.current = false; if (encore.current) { const o = encore.current; encore.current = null; setTimeout(() => synchroRef.current(o), 400); }
    }
    return r;
  };
  const synchroRef = useRef(synchroniser); synchroRef.current = synchroniser;
  const lier = async (fid, dossier, mode) => {
    const P = CLOUD_FOURNISSEURS[fid]; let compte = etatRef.current.compteAttente || null; try { compte = await P.compte(); } catch (e) { /* facultatif */ }
    setEtat({ fournisseur: fid, dossier, compte, rev: null, syncId: null, lignee: [], empreinteDistante: '', docsDistants: {}, historiqueJour: '', derniereSync: '', suspendu: false, compteAttente: null });
    setChoix(null); setMessage('');
    const r = await synchroRef.current({ adopter: mode === 'adopter' });
    if (r && !r.adopte) toast(r.recu && !r.recu.identique ? `Dossier « ${dossier.nom} » relié : données réunies avec celles de cet appareil.` : `Dossier « ${dossier.nom} » relié : Œnotrack y enregistre maintenant ses données.`);
  };
  // connexion (dans un clic : Google ouvre une fenêtre, Microsoft et Dropbox passent par leur page puis reviennent ici)
  const connecter = async (fid) => {
    const P = CLOUD_FOURNISSEURS[fid];
    try {
      if (fid === 'dossier') { const d = await P.connecter(); setChoix({ fournisseur: fid, local: d }); return; }
      await P.connecter();
      if (fid === 'google') { let c = null; try { c = await P.compte(); } catch (e) { c = null; } const e0 = etatRef.current; if (e0.fournisseur === fid && e0.dossier) { setStatut(''); synchroRef.current(); toast('Google Drive reconnecté.'); } else { setEtat({ compteAttente: c }); setChoix({ fournisseur: fid }); } }
    } catch (er) { if (er && er.annule) toast(er.message || 'Connexion annulée.'); else toast((er && er.message) || 'Connexion impossible.', 'bad'); }
  };
  const reconnecter = async () => {
    const e0 = etatRef.current; const P = e0.fournisseur ? CLOUD_FOURNISSEURS[e0.fournisseur] : null; if (!P) return;
    if (P.renouveler) { try { await P.renouveler(); setStatut(''); synchroRef.current(); } catch (er) { toast((er && er.message) || 'Accès refusé.', 'bad'); } return; }
    await connecter(P.id);
  };
  const deconnecter = async () => { const P = F; if (P) await P.deconnecter(); setEtat(() => ({})); setStatut(''); setMessage(''); toast('Œnotrack n’utilise plus ce dossier : les données restent sur cet appareil et dans le dossier.'); };
  const changerDossier = () => { if (F) setChoix({ fournisseur: F.id }); };
  const suspendre = () => { if (etatRef.current.dossier) setEtat({ suspendu: true }); };
  const reprendre = async (mode) => { setEtat({ suspendu: false, syncId: null, rev: null, lignee: [], empreinteDistante: '' }); await synchroRef.current({ adopter: mode === 'adopter' }); };
  const enregistrerConfig = (cfg) => { try { window.localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(cfg)); } catch (e) { /* ignoré */ } const c = cloudConfig(); setConfig(c); return c; };

  // au démarrage : identifiants (config.json), retour d'une connexion Microsoft / Dropbox
  useEffect(() => {
    let vivant = true;
    (async () => {
      const c = await cloudChargerConfig(); if (!vivant) return; setConfig(c);
      if (integre) return;
      const P0 = etatRef.current.fournisseur && CLOUD_FOURNISSEURS[etatRef.current.fournisseur]; if (P0) P0.precharger();
      const r = await cloudRetourConnexion(); if (!r || !vivant) return;
      if (r.erreur) { toast(r.erreur, 'bad'); return; }
      const P = CLOUD_FOURNISSEURS[r.fournisseur]; let compte = null; try { compte = await P.compte(); } catch (e) { compte = null; }
      const e0 = etatRef.current;
      if (e0.fournisseur === r.fournisseur && e0.dossier) { setEtat({ compte: compte || e0.compte }); setStatut(''); toast(`${P.nom} reconnecté.`); synchroRef.current(); }
      else { setEtat({ compteAttente: compte }); setChoix({ fournisseur: r.fournisseur }); }
    })();
    return () => { vivant = false; };
  }, []);
  // synchronisation automatique : à l'ouverture, toutes les 30 s, au retour sur la page ou du réseau, 3 s après chaque saisie
  useEffect(() => {
    if (!lie || etat.suspendu) return undefined;
    const tick = () => { if (document.visibilityState === 'visible') synchroRef.current(); };
    const t = setInterval(tick, 30000); window.addEventListener('focus', tick); window.addEventListener('online', tick); document.addEventListener('visibilitychange', tick); tick();
    return () => { clearInterval(t); window.removeEventListener('focus', tick); window.removeEventListener('online', tick); document.removeEventListener('visibilitychange', tick); };
  }, [lie, etat.suspendu, etat.fournisseur, etat.dossier && etat.dossier.id]);
  useEffect(() => { if (!lie || etat.suspendu || empreinte === etat.empreinteDistante) return undefined; const t = setTimeout(() => synchroRef.current(), 3000); return () => clearTimeout(t); }, [lie, etat.suspendu, empreinte, etat.empreinteDistante]);

  // Google donne un jeton d'une heure : il est renouvelé au clic suivant dans Œnotrack (petite fenêtre Google qui se referme seule)
  useEffect(() => {
    if (!lie || etat.fournisseur !== 'google') return undefined; let dernier = 0;
    const clic = (ev) => { if (ev && ev.target && ev.target.closest && ev.target.closest('[data-cloud-etat],[data-cloud-reco],[data-fournisseur]')) return; const j = jetonsLire('google'); if (j && j.exp > Date.now() + 120000) return; if (Date.now() - dernier < 30000) return; dernier = Date.now(); GD.connecter().then(() => { setStatut(''); synchroRef.current(); }).catch(() => null); };
    document.addEventListener('click', clic, true); return () => document.removeEventListener('click', clic, true);
  }, [lie, etat.fournisseur]);
  const aEnvoyer = lie && !etat.suspendu && empreinte !== etat.empreinteDistante;
  return { etat, statut, message, config, choix, setChoix, integre, lie, F, aEnvoyer, connecter, reconnecter, deconnecter, changerDossier, lier, suspendre, reprendre, synchroniser: () => synchroRef.current({}), enregistrerConfig, fermerChoix: () => { setChoix(null); setEtat({ compteAttente: null }); } };
}

/* ---------- choix du dossier sur le Drive ---------- */
function DossierChoix() {
  const { cloud, db } = useApp(); const ch = cloud.choix; const P = ch ? CLOUD_FOURNISSEURS[ch.fournisseur] : null;
  const [vue, setVue] = useState('mon'); const [chemin, setChemin] = useState([]); const [liste, setListe] = useState(null); const [err, setErr] = useState('');
  const [info, setInfo] = useState(undefined); const [nouveau, setNouveau] = useState(''); const [busy, setBusy] = useState(false);
  const courant = ch && ch.local ? ch.local : chemin.length ? chemin[chemin.length - 1] : null;
  const charger = async () => {
    if (!P || (ch && ch.local)) return; setListe(null); setErr('');
    try { setListe(await P.dossiers(vue === 'partages' && !chemin.length ? 'partages' : courant)); } catch (e) { setErr((e && e.message) || 'Liste des dossiers indisponible.'); setListe([]); }
  };
  useEffect(() => { charger(); }, [ch && ch.fournisseur, vue, chemin.length]);
  useEffect(() => { let vivant = true; setInfo(undefined); if (!P || !courant) return undefined; (async () => { try { const x = await P.infoBase(courant); if (vivant) setInfo(!!x); } catch (e) { if (vivant) setInfo(null); } })(); return () => { vivant = false; }; }, [ch && ch.fournisseur, courant && courant.id]);
  if (!ch || !P) return null;
  const vide = baseVide(db); const exemple = !!db.meta.exemple;
  const creer = async () => { const n = nouveau.trim(); if (!n) return; setBusy(true); try { const d = await P.creerDossier(courant, n); setNouveau(''); setChemin([...chemin, d]); } catch (e) { setErr((e && e.message) || 'Création impossible.'); } setBusy(false); };
  const utiliser = async (mode) => { setBusy(true); try { await cloud.lier(P.id, courant, mode); } finally { setBusy(false); } };
  const compte = cloud.etat.compteAttente || cloud.etat.compte;
  const pied = courant ? (info && !vide ? <><Btn onClick={cloud.fermerChoix}>Annuler</Btn><Btn kind="danger" disabled={busy} onClick={() => utiliser('adopter')}>Utiliser seulement les données du dossier</Btn><Btn kind="primary" disabled={busy} onClick={() => utiliser('reunir')}>Réunir avec cet appareil</Btn></>
    : <><Btn onClick={cloud.fermerChoix}>Annuler</Btn><Btn kind="primary" disabled={busy || info === undefined} onClick={() => utiliser(info ? 'adopter' : 'reunir')}>{busy ? 'Liaison…' : `Utiliser « ${courant.nom} »`}</Btn></>) : <Btn onClick={cloud.fermerChoix}>Annuler</Btn>;
  return (
    <Sheet title={`Choisir le dossier ${P.id === 'dossier' ? 'de l’ordinateur' : `sur ${P.nom}`}`} sub={compte ? `Connecté : ${compte.nom || ''}${compte.email ? ` (${compte.email})` : ''}` : P.nom} onClose={cloud.fermerChoix} footer={pied}>
      <div className="space-y-3" data-dossier-choix="">
        {ch.local ? null : (<>
          {P.partages ? <div className="flex flex-wrap gap-1.5" role="group" aria-label="Emplacement"><Btn size="sm" kind={vue === 'mon' ? 'primary' : undefined} aria-pressed={vue === 'mon'} onClick={() => { setVue('mon'); setChemin([]); }}>{P.id === 'google' ? 'Mon Drive' : 'Mes fichiers'}</Btn><Btn size="sm" kind={vue === 'partages' ? 'primary' : undefined} aria-pressed={vue === 'partages'} onClick={() => { setVue('partages'); setChemin([]); }}>Partagés avec moi</Btn></div> : null}
          <nav className="flex flex-wrap items-center gap-1 text-sm" aria-label="Chemin"><button type="button" className="linkish" onClick={() => setChemin([])}>{vue === 'partages' ? 'Partagés avec moi' : P.nom}</button>{chemin.map((d, i) => <Fragment key={d.id}><span className="text-ink2">›</span><button type="button" className="linkish" onClick={() => setChemin(chemin.slice(0, i + 1))}>{d.nom}</button></Fragment>)}</nav>
          <div className="cloud-liste" role="list" aria-label="Dossiers">{liste === null ? <div className="p-3 text-sm text-ink2">Chargement…</div> : !liste.length ? <div className="p-3 text-sm text-ink2">{err || 'Aucun sous-dossier ici.'}</div> : liste.map((d) => <button type="button" role="listitem" key={`${d.driveId || ''}${d.id}`} className="cloud-item" onClick={() => setChemin([...chemin, d])}><span aria-hidden="true">📁</span><span className="min-w-0 flex-1 truncate">{d.nom}</span><span className="text-ink2" aria-hidden="true">›</span></button>)}</div>
          {err && liste && liste.length ? <Notice tone="bad">{err}</Notice> : null}
          {vue !== 'partages' || chemin.length ? <div className="flex flex-wrap items-center gap-2"><input className="inp" style={{ maxWidth: 280 }} value={nouveau} onChange={(e) => setNouveau(e.target.value)} placeholder="Nouveau dossier (ex. Œnotrack – Domaine)" aria-label="Nom du nouveau dossier" onKeyDown={(e) => { if (e.key === 'Enter') creer(); }} /><Btn size="sm" disabled={busy || !nouveau.trim()} onClick={creer}>＋ Créer ici</Btn></div> : null}
        </>)}
        {courant ? (info === undefined ? <p className="help">Vérification du dossier « {courant.nom} »…</p>
          : info ? <Notice tone="info" title={`« ${courant.nom} » contient déjà des données Œnotrack`}>{vide ? 'Cet appareil est vide ou contient le jeu d’exemple : il reprend les données du dossier.' : 'Choisissez : réunir les données de cet appareil avec celles du dossier (rien n’est supprimé), ou utiliser seulement celles du dossier (les données de cet appareil sont remplacées).'}</Notice>
            : info === null ? <Notice tone="bad">Ce dossier n’est pas accessible : choisissez-en un autre.</Notice>
              : <Notice tone="ok" title={`« ${courant.nom} » est prêt`}>Œnotrack y enregistrera ses données (oenotrack-base.json, documents, historique) et les tiendra à jour automatiquement.{exemple ? ' Attention : cet appareil contient le jeu d’exemple, qui sera copié dans le dossier ; pour démarrer vide, « Réinitialiser à vide » d’abord.' : ''}</Notice>)
          : <p className="help">Ouvrez le dossier à utiliser (ou créez-en un), puis validez en bas. Partagez ce dossier avec les autres personnes : chacune s’y connecte avec son propre compte.</p>}
      </div>
    </Sheet>
  );
}

// où sont les données (0.25.0-alpha.2) : sans synchronisation, elles ne sont que dans ce navigateur, sur cet appareil ;
// avec le Drive ou la sauvegarde en ligne, leur pastille (ci-dessous et 68f-drive.jsx) dit déjà où elles vont
function StockageLocalChip() {
  const { cloud, sync, setTab } = useApp();
  if ((cloud && cloud.lie) || (sync && sync.mode && sync.mode !== 'aucun')) return null;
  return <button type="button" className="chip" style={{ cursor: 'pointer' }} data-stockage="appareil" onClick={() => setTab('params', 'sauvegarde')}
    title="Chaque modification est enregistrée automatiquement dans ce navigateur, sur cet appareil seulement : aucune base partagée ni synchronisation n’est active. Pour retrouver vos données sur un autre appareil ou les protéger, activez la synchronisation ou exportez une sauvegarde (Paramètres › Sauvegarde & Drive).">💻 Sur cet appareil seulement</button>;
}
function CloudChip() {
  const { cloud, setTab } = useApp(); if (!cloud || !cloud.lie) return null; const s = cloud.statut; const e = cloud.etat;
  const txt = e.suspendu ? 'en pause' : s === 'reconnecter' ? 'se reconnecter' : s === 'hors-ligne' ? 'hors ligne' : s === 'erreur' ? 'à vérifier' : s === 'chiffre' ? 'mot de passe' : s === 'synchro' || cloud.aEnvoyer ? 'envoi…' : 'à jour';
  const ton = s === 'erreur' || s === 'chiffre' ? 'chip-bad' : e.suspendu || s === 'reconnecter' || s === 'hors-ligne' ? 'chip-warn' : 'chip-ok';
  return <button type="button" className={cx('chip', ton)} style={{ cursor: 'pointer' }} data-cloud-etat={e.suspendu ? 'suspendu' : s || 'attente'} title={`${cloud.F.nom} · dossier « ${e.dossier.nom} »`} onClick={() => (s === 'reconnecter' ? cloud.reconnecter() : setTab('params', 'sauvegarde'))}>☁ {cloud.F.nom} · {txt}</button>;
}

// Drive chiffré, clé absente de cet appareil : mot de passe demandé (en-tête du fichier du Drive), puis synchronisation
function CloudMdpBouton() {
  const { cloud } = useApp(); const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try { const P = CLOUD_FOURNISSEURS[cloud.etat.fournisseur]; const r = P && cloud.etat.dossier ? await P.lireBase(cloud.etat.dossier) : null; const env = r ? enveloppeChiffree(r.texte) : null;
      const k = CHIFFRE_DEMANDER ? await CHIFFRE_DEMANDER(env ? env.chiffrement : chiffrementReglage(cloud.dbRef ? cloud.dbRef.current : null) || {}, 'Le fichier de votre Drive est chiffré : saisissez le mot de passe de chiffrement de l’équipe.') : null;
      if (k) cloud.synchroniser();
    } catch (e) { /* message de la synchronisation */ }
    setBusy(false);
  };
  return <Btn kind="primary" size="sm" disabled={busy} onClick={go} data-cloud-mdp="">🔑 Saisir le mot de passe de chiffrement</Btn>;
}
function CloudCard() {
  const { cloud, confirm } = useApp(); const c = cloud; const e = c.etat; const cfg = c.config;
  const [ids, setIds] = useState({ google: cfg.google.clientId, microsoft: cfg.microsoft.clientId, dropbox: cfg.dropbox.appKey });
  useEffect(() => { setIds({ google: cfg.google.clientId, microsoft: cfg.microsoft.clientId, dropbox: cfg.dropbox.appKey }); }, [cfg.google.clientId, cfg.microsoft.clientId, cfg.dropbox.appKey]);
  useEffect(() => { if (!c.integre) GD.precharger(); }, [cfg.google.clientId]);
  const adresse = c.integre ? `${OENOTRACK_SITE}/` : cloudRetourUrl(); const fichierConfig = configFichierAvec({ google: { clientId: ids.google.trim() }, microsoft: { clientId: ids.microsoft.trim() }, dropbox: { appKey: ids.dropbox.trim() } }); // le reste du config.json du site (mentions légales…) est gardé
  const tuile = (fid) => { const P = CLOUD_FOURNISSEURS[fid]; const ok = P.pret(); return (
    <div key={fid} className={cx('cloud-tuile', !ok && 'off')} data-fournisseur={fid}><div className="flex items-center gap-2"><span className="cloud-ic" aria-hidden="true">{CLOUD_INFOS[fid].ic}</span><b>{P.nom}</b></div><div className="text-xs text-ink2">{CLOUD_INFOS[fid].aide}</div>
      <Btn kind={ok ? 'primary' : undefined} size="sm" disabled={!ok || c.integre} onClick={() => c.connecter(fid)}>{fid === 'dossier' ? 'Choisir le dossier' : 'Se connecter'}</Btn>
      {!ok ? <div className="text-xs text-ink2">{fid === 'dossier' ? 'Chrome ou Edge sur ordinateur' : 'Identifiant à renseigner ci-dessous'}</div> : null}</div>); };
  const statut = c.lie ? (
    <div className={cx('sync-etat', c.statut === 'ok' || (!c.statut && !c.aEnvoyer) ? 'ok' : 'warn')} data-cloud={c.statut || 'attente'}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><b>{CLOUD_INFOS[c.F.id].ic} {c.F.nom}</b>{e.compte && (e.compte.email || e.compte.nom) ? <span className="text-sm">{e.compte.email || e.compte.nom}</span> : null}<Chip>📁 {e.dossier.nom}</Chip></div>
      <div className="text-sm">{e.suspendu ? 'Synchronisation en pause : la base de cet appareil a été remplacée (restauration, exemple ou remise à zéro).'
        : c.statut === 'reconnecter' ? (c.message || 'Connexion à renouveler.') : c.statut === 'hors-ligne' || c.statut === 'erreur' || c.statut === 'chiffre' ? c.message
          : c.statut === 'synchro' ? 'Synchronisation en cours…' : c.aEnvoyer ? 'Modifications en attente d’envoi…' : 'Données enregistrées sur votre Drive et à jour sur cet appareil.'}</div>
      <div className="text-xs text-ink2">{e.derniereSync ? `Dernière synchronisation le ${fmtQuand(e.derniereSync)}` : 'Pas encore synchronisé'}{e.ecritPar ? ` · dernière écriture par « ${e.ecritPar} »${e.ecritLe ? ` le ${fmtQuand(e.ecritLe)}` : ''}` : ''}</div>
      <div className="mt-1 flex flex-wrap gap-2">
        {e.suspendu ? <><Btn kind="primary" size="sm" onClick={() => c.reprendre('adopter')}>Reprendre les données du dossier</Btn><Btn size="sm" onClick={() => c.reprendre('reunir')}>Réunir avec cet appareil</Btn></>
          : c.statut === 'reconnecter' ? <Btn kind="primary" size="sm" data-cloud-reco="" onClick={c.reconnecter}>Se reconnecter à {c.F.nom}</Btn> : c.statut === 'chiffre' ? <CloudMdpBouton /> : <Btn size="sm" onClick={c.synchroniser} disabled={c.statut === 'synchro'}>⇅ Synchroniser maintenant</Btn>}
        {c.F.id !== 'dossier' ? <Btn size="sm" onClick={c.changerDossier}>Changer de dossier</Btn> : <Btn size="sm" onClick={() => c.connecter('dossier')}>Changer de dossier</Btn>}
        <Btn size="sm" kind="ghost" onClick={async () => { if (await confirm({ title: `Ne plus utiliser ${c.F.nom} ?`, body: `Les données restent sur cet appareil et dans le dossier « ${e.dossier.nom} ». Les autres appareils reliés continuent de l’utiliser.`, ok: 'Se déconnecter' })) c.deconnecter(); }}>Se déconnecter</Btn>
      </div>
    </div>) : null;
  return (
    <section className="card sync-card p-4" aria-labelledby="svc">
      <div className="flex flex-wrap items-center gap-3"><div className="sauv-ic" aria-hidden="true">☁️</div><h3 id="svc" className="text-lg font-semibold">Stockage sur votre Drive</h3></div>
      {c.integre ? <Notice tone="info" title="À utiliser dans Œnotrack en ligne">Ici, dans claude.ai, la page ne peut pas se connecter à Google Drive, OneDrive ou Dropbox. Mettez Œnotrack en ligne à sa propre adresse (guide ci-dessous) : la connexion s’y fait en un clic et le dossier choisi devient le stockage de vos données, partagé entre vos appareils et vos collaborateurs. En attendant, la synchronisation par fichier (plus bas) fonctionne ici.</Notice>
        : !c.lie ? <p className="text-sm">Reliez Œnotrack à votre Drive et choisissez un dossier : les données y sont enregistrées automatiquement et partagées entre vos appareils. Chaque personne se connecte avec son propre compte au même dossier partagé ; les saisies faites en même temps sont réunies.</p> : null}
      {statut}
      {!c.lie && !c.integre ? <div className="cloud-tuiles">{['google', 'onedrive', 'dropbox', 'dossier'].map(tuile)}</div> : null}
      <details className="sync-guide" open={c.integre ? undefined : !c.lie && !cfg.google.clientId && !cfg.microsoft.clientId && !cfg.dropbox.appKey}><summary>Identifiants des services (à faire une fois)</summary>
        <div className="space-y-3">
          <p className="text-sm">Google, Microsoft et Dropbox demandent de déclarer Œnotrack une fois. Chaque service vous donne un identifiant public à coller ici. {c.integre ? <>Adresse à déclarer : celle d’Œnotrack en ligne, par exemple <code className="cloud-code" data-adresse="">{adresse}</code> pour le site officiel.</> : <>Adresse d’Œnotrack à déclarer : <code className="cloud-code" data-adresse="">{adresse}</code> <Btn size="sm" kind="ghost" onClick={() => { try { navigator.clipboard.writeText(adresse); } catch (er) { /* ignoré */ } }}>Copier</Btn></>}</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))' }}>
            <label className="block"><span className="lbl">Google : ID client OAuth</span><input className="inp" value={ids.google} onChange={(ev) => setIds({ ...ids, google: ev.target.value })} placeholder="1234…apps.googleusercontent.com" aria-label="ID client Google" /></label>
            <label className="block"><span className="lbl">Microsoft : ID d’application (client)</span><input className="inp" value={ids.microsoft} onChange={(ev) => setIds({ ...ids, microsoft: ev.target.value })} placeholder="00000000-0000-0000-0000-000000000000" aria-label="ID d’application Microsoft" /></label>
            <label className="block"><span className="lbl">Dropbox : clé de l’application</span><input className="inp" value={ids.dropbox} onChange={(ev) => setIds({ ...ids, dropbox: ev.target.value })} placeholder="ex. a1b2c3d4e5f6g7h" aria-label="Clé de l’application Dropbox" /></label>
          </div>
          <div className="flex flex-wrap gap-2">{c.integre ? null : <Btn kind="primary" size="sm" onClick={() => { c.enregistrerConfig(fichierConfig); }}>Enregistrer sur cet appareil</Btn>}
            <Btn size="sm" onClick={async () => { const r = await saveFile('config.json', new Blob([JSON.stringify(fichierConfig, null, 2)], { type: 'application/json' }), 'application/json'); if (!r.ok && !r.declined) c.enregistrerConfig(fichierConfig); }}>⬇ Télécharger config.json</Btn></div>
          <p className="help">Pour que tous les appareils les aient, déposez <b>config.json</b> à côté d’index.html lors de la mise en ligne (Netlify : glissez le dossier avec les deux fichiers). Ces identifiants ne sont pas secrets.</p>
          <GuideServices adresse={adresse} />
        </div>
      </details>
    </section>
  );
}

function GuideServices({ adresse }) {
  return (
    <div className="cloud-guides">
      <details><summary>Mettre Œnotrack en ligne (Netlify, gratuit)</summary><ol className="sauv-steps text-sm">
        <li>Créez un compte sur <b>netlify.com</b> (gratuit), puis ouvrez <b>app.netlify.com/drop</b>.</li>
        <li>Glissez-y le dossier <b>oenotrack-web</b> (index.html, config.json). Netlify donne une adresse du type <code>https://….netlify.app</code> ; renommez-la dans Site configuration › Change site name (ex. <code>oenotrack-mondomaine</code>).</li>
        <li>Ouvrez cette adresse : c’est votre Œnotrack en ligne. Pour une mise à jour, Deploys › glissez à nouveau le dossier.</li>
        <li>L’adresse obtenue est celle à déclarer chez Google, Microsoft et Dropbox (étapes suivantes).</li></ol></details>
      <details><summary>Google Drive : obtenir l’ID client</summary><ol className="sauv-steps text-sm">
        <li>Ouvrez <b>console.cloud.google.com</b> avec votre compte Google › créez un projet « Œnotrack ».</li>
        <li>API et services › Bibliothèque › <b>Google Drive API</b> › Activer.</li>
        <li>Écran de consentement OAuth : type <b>Externe</b> (ou Interne avec Google Workspace), nom « Œnotrack », votre e-mail ; Accès aux données › ajoutez le champ d’application <code>…/auth/drive</code> ; Audience › <b>Utilisateurs test</b> : ajoutez l’adresse Gmail de chaque personne qui utilisera Œnotrack.</li>
        <li>Identifiants › Créer des identifiants › <b>ID client OAuth</b> › Application Web › Origines JavaScript autorisées : <code>{(() => { try { return new URL(adresse).origin; } catch (e) { return adresse; } })()}</code> (sans « / » final) › Créer.</li>
        <li>Copiez l’<b>ID client</b> (…apps.googleusercontent.com) dans le champ Google ci-dessus. À la connexion, Google affiche « application non validée » : c’est normal pour une application privée, cliquez Continuer.</li></ol></details>
      <details><summary>OneDrive : obtenir l’ID d’application</summary><ol className="sauv-steps text-sm">
        <li>Ouvrez <b>portal.azure.com</b> (ou entra.microsoft.com) avec votre compte Microsoft › <b>Inscriptions d’applications</b> › Nouvelle inscription.</li>
        <li>Nom « Œnotrack » ; types de comptes : <b>comptes dans un annuaire d’organisation et comptes Microsoft personnels</b>.</li>
        <li>URI de redirection : plateforme <b>Application monopage (SPA)</b>, adresse <code>{adresse}</code> › Inscrire.</li>
        <li>Autorisations d’API › Ajouter › Microsoft Graph › Autorisations déléguées : <b>Files.ReadWrite.All</b>, User.Read, offline_access.</li>
        <li>Copiez l’<b>ID d’application (client)</b> dans le champ Microsoft ci-dessus.</li></ol></details>
      <details><summary>Dropbox : obtenir la clé de l’application</summary><ol className="sauv-steps text-sm">
        <li>Ouvrez <b>dropbox.com/developers/apps</b> › Create app › <b>Scoped access</b> › <b>Full Dropbox</b> › nom « Oenotrack-… ».</li>
        <li>Onglet Permissions : cochez <b>files.metadata.read</b>, <b>files.content.read</b>, <b>files.content.write</b> › Submit.</li>
        <li>Onglet Settings : OAuth 2 › Redirect URIs : ajoutez <code>{adresse}</code> ; « Allow public clients (Implicit Grant & PKCE) » : <b>Allow</b>.</li>
        <li>Copiez l’<b>App key</b> dans le champ Dropbox ci-dessus. Les autres personnes : Settings › Development users, ou « Apply for production » au-delà de 50 utilisateurs.</li></ol></details>
      <details><summary>Partager le dossier avec vos collaborateurs</summary><ol className="sauv-steps text-sm">
        <li>Dans votre Drive, partagez le dossier choisi en <b>modification</b> avec chaque personne.</li>
        <li>Chacune ouvre Œnotrack en ligne, se connecte avec son propre compte, puis choisit ce dossier (Google Drive, OneDrive : « Partagés avec moi » ; Dropbox : ajoutez d’abord le dossier partagé à votre Dropbox).</li>
        <li>Les saisies faites en même temps sont réunies ; si la même chose a été modifiée des deux côtés, la plus récente est gardée et l’autre reste au journal des conflits.</li></ol></details>
    </div>
  );
}
