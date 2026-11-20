/* ============ APPLICATION : état, persistance, bandeau Œnotrack, onglets, pile de fiches, menus ============ */
// Modules (onglets) : ordre et activation réglables dans Paramètres › Modules (MODULES_DEFAUT, modulesVisibles… : 31-crud.js)
const MODULE_DEFS = {
  cuverie: { label: 'Cuverie & Lots', icone: '🛢', desc: 'Plan de cave, contenants, lots et composition des cuves.' },
  pressoir: { label: 'Pressoir', icone: '🍇', desc: 'Registre des pesées et tickets, carnet de pressoir (marcs, cuvée, tailles, rebêches), relevés par apporteur, bilan et contrôles de la campagne.' },
  ops: { label: 'Opérations & Assemblages', icone: '⚗', desc: 'Saisie des opérations (vendange, vinification, élevage, assemblages…) et journal.' },
  previsions: { label: 'À réaliser & fiches', icone: '📋', desc: 'Opérations planifiées, fiches à imprimer pour l’équipe.' },
  declass: { label: 'Déclassements', icone: '⚠', desc: 'Alertes de déclassement (intrant non autorisé…) à valider ou refuser.' },
  tirage: { label: 'Tirages', icone: '🍾', desc: 'Préparations (levain, pied de cuve, liqueur de tirage) et tirages (mixtions).' },
  cave: { label: 'Cave', icone: '🕯', desc: 'Bouteilles sur lattes : stock par lot, âge, remuage et mise sur pointes.' },
  degorgement: { label: 'Dégorgement', icone: '🥂', desc: 'Liqueurs d’expédition, dégorgements et lots finis.' },
  analyses: { label: 'Analyses', icone: '🔬', desc: 'Analyses et paramètres personnalisables.' },
  intrants: { label: 'Intrants & Stocks', icone: '📦', desc: 'Produits œnologiques, arrivages, lots fournisseurs, DLUO et stocks.' },
  hygiene: { label: 'Hygiène', icone: '🧽', desc: 'Journal des nettoyages, rinçages et désinfections.' },
  trace: { label: 'Traçabilité', icone: '🔎', desc: 'Recherches ascendante et descendante, par intrant, par parcelle.' },
  registres: { label: 'Registres', icone: '📑', desc: 'Registres à exporter (CSV / Excel) et bilan matière.' },
  params: { label: 'Paramètres', icone: '⚙', desc: 'Société & opérateurs, modules, sauvegarde & Drive, campagnes, listes et réglages.' },
};
const moduleNom = (id) => (MODULE_DEFS[id] ? MODULE_DEFS[id].label : id);
// anciens liens : les réglages étaient dans l'onglet « Registres & Paramètres »
const SOUS_PARAMS = ['entreprise', 'utilisateurs', 'modules', 'sauvegarde', 'campagnes', 'sites', 'contenants', 'crus', 'apporteurs', 'operations', 'listes', 'base'];
const THEME_KEY = 'oenotrack-theme';
const Placeholder = ({ name }) => <Empty>Onglet « {name} » indisponible.</Empty>;

function ConfirmDialog({ cfm, onClose }) {
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') onClose(false); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, []);
  return (
    <div className="overlay" style={{ alignItems: 'center', zIndex: 150 }} role="alertdialog" aria-modal="true" aria-label={cfm.title}>
      <div className="sheet" style={{ maxWidth: 480 }}>
        <div className="sheet-b space-y-3"><h2 className="sheet-title text-2xl font-semibold">{cfm.title}</h2><div className="text-sm text-ink2">{cfm.body}</div></div>
        <div className="sheet-f"><Btn onClick={() => onClose(false)}>{cfm.cancel || 'Annuler'}</Btn><Btn kind={cfm.danger ? 'danger' : 'primary'} onClick={() => onClose(true)} autoFocus>{cfm.ok || 'Confirmer'}</Btn></div>
      </div>
    </div>
  );
}

function App() {
  const first = useRef(null); if (!first.current) { const l = loadDb(); first.current = { db: l.db || normalizeDb(sampleDb()), migrated: !!l.migrated, neuf: !l.db }; }
  const [db, setDb] = useState(first.current.db);
  const dbRef = useRef(db); dbRef.current = db;
  const [storeOK, setStoreOK] = useState(true);
  const [showMig, setShowMig] = useState(first.current.migrated);
  const [nav, setNav] = useState(() => ({ tab: moduleAccueil(first.current.db), sub: null })); // premier module actif
  const [toastMsg, setToastMsg] = useState(null);
  const [cfm, setCfm] = useState(null);
  // identifiants (0.15.0-alpha.1) : session de cet appareil { uid, garder, t, verrou } — sécurité inactive tant qu'aucun compte n'est activé
  const [session, setSession0] = useState(() => { const s = sessionLire(); if (s && !s.verrou) { const m = securiteReglages(first.current.db).verrouMin; if (m > 0 && s.t && Date.now() - s.t > m * 60000) return { ...s, verrou: true }; } return s; });
  const setSession = useCallback((s) => { setSession0(s); sessionEcrire(s); }, []);
  const secu = securiteActive(db);
  const uSession = secu && session ? utilisateurDe(db, session.uid) : null;
  const uid = uSession && uSession.actif !== false ? uSession.id : ''; // reste le même pendant le verrouillage : la page dessous garde son état
  const verrouille = !!(uid && session.verrou);
  const sessionRef = useRef(''); sessionRef.current = uid;
  const [stack, setStack] = useState([]); // fiches ouvertes : { k: 'lot' | 'cont' | 'fini', id } — la dernière ouverte est au premier plan
  const [opDlg, setOpDlg] = useState(null); const [misc, setMisc] = useState(null); const [menu, setMenu] = useState(null); const [contEdit, setContEdit] = useState(null); const [report, setReport] = useState(null); const [docsDlg, setDocsDlg] = useState(null); const [ficheDlg, setFicheDlg] = useState(null);
  const [theme, setTheme] = useState(() => { try { return window.localStorage.getItem(THEME_KEY) || window.localStorage.getItem('cuverie-champenoise-theme') || 'auto'; } catch (e) { return 'auto'; } });

  useEffect(() => { setStoreOK(saveDb(db)); }, [db]);
  const [sysDark, setSysDark] = useState(() => { try { return window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) { return false; } });
  useEffect(() => { let mq = null; const f = (e) => setSysDark(!!e.matches); try { mq = window.matchMedia('(prefers-color-scheme: dark)'); if (mq.addEventListener) mq.addEventListener('change', f); else mq.addListener(f); } catch (e) { /* ignoré */ } return () => { try { if (mq) { if (mq.removeEventListener) mq.removeEventListener('change', f); else mq.removeListener(f); } } catch (e) { /* ignoré */ } }; }, []);
  syncConfig(db); // échelle des crus personnalisée → variables globales
  const charte = charteDef(db.settings.charte);
  const mode = theme === 'auto' ? (sysDark ? 'dark' : 'light') : theme; // toutes les chartes existent en clair et en sombre
  useEffect(() => { const el = document.documentElement; el.setAttribute('data-charte', charte.id); el.setAttribute('data-mode', mode); el.setAttribute('data-band', (charte.bands || {})[mode] || 'dark'); el.style.colorScheme = mode; }, [charte.id, mode]);
  const [apparence, setApparence] = useState(false); const [versionOpen, setVersionOpen] = useState(false);
  // informations légales (0.21.0-alpha.1) : ouvertes depuis le pied de page, l'écran de connexion ou une adresse …/#mentions-legales
  const [legal, setLegal] = useState(() => legalOngletDeHash(window.location.hash) || null);
  useEffect(() => { const f = () => { const o = legalOngletDeHash(window.location.hash); if (o) setLegal(o); }; window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  // page d'accueil (0.23.0-alpha.1) : présentation à la toute première ouverture sur cet appareil, jusqu'à « Ouvrir Œnotrack » ; ensuite
  // seulement depuis le lien « Présentation » du pied de page ('revoir')
  const [accueil, setAccueil] = useState(() => {
    let marque = ''; try { marque = window.localStorage.getItem(ACCUEIL_KEY) || ''; } catch (e) { /* stockage indisponible */ }
    const d = accueilDecision({ marque, base: !first.current.neuf, recherche: window.location.search });
    try { if (d.marque !== marque) window.localStorage.setItem(ACCUEIL_KEY, d.marque); } catch (e) { /* ignoré */ }
    return d.montrer ? 'premier' : null;
  });
  const entrer = () => { try { window.localStorage.setItem(ACCUEIL_KEY, 'vu'); } catch (e) { /* ignoré */ } setAccueil(null); try { window.scrollTo(0, 0); } catch (e) { /* ignoré */ } };
  const revoirAccueil = () => { setAccueil('revoir'); try { window.scrollTo(0, 0); } catch (e) { /* ignoré */ } };
  const fermerLegal = () => { setLegal(null); if (legalOngletDeHash(window.location.hash)) { try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* ignoré */ } } };
  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    try { window.localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignoré */ }
  }, [theme]);
  useEffect(() => { // couleurs personnalisées (revendications, échelle) → variables CSS des pastilles
    const st = document.documentElement.style; const ap = db.apparence;
    QUALIFS.forEach((q) => st.setProperty(`--q${q.id}`, qColor(db, q.id))); ECHELLES.forEach((e) => st.setProperty(`--e${e.id}`, eColor(db, e.id)));
  }, [db.apparence, db.lists.qualifs, db.lists.echelles]);
  useEffect(() => { if (!toastMsg) return undefined; const t = setTimeout(() => setToastMsg(null), toastMsg.kind === 'bad' ? 8000 : 4500); return () => clearTimeout(t); }, [toastMsg]);

  const toast = useCallback((msg, kind) => setToastMsg({ msg, kind, id: Date.now() }), []);
  const confirm = useCallback((o) => new Promise((res) => setCfm({ ...o, res })), []);
  const act = useCallback((fn, okMsg, opts) => {
    const avant = dbRef.current; const d = clone(avant); let r;
    try { r = fn(d); } catch (e) { console.error(e); r = fail('Erreur interne : ' + e.message); }
    if (r && r.ok === false) { toast(r.msg, 'bad'); return r; }
    // identifiants activés : chaque modification est contrôlée (droits du profil) puis tracée (journal, saisi / corrigé par)
    if (!(opts && opts.systeme) && securiteActive(avant)) {
      let g; try { g = gardeDroits(avant, d, sessionRef.current); } catch (e) { console.error(e); g = { ok: false, msg: 'Erreur interne (droits) : ' + e.message }; }
      if (!g.ok) { try { syncConfig(avant); } catch (e) { /* listes globales : remises comme avant la modification refusée */ } toast(g.msg, 'bad'); return fail(g.msg); }
      gardeAppliquer(d, g, sessionRef.current);
    }
    d.meta.modifLe = new Date().toISOString(); // départage les conflits de synchronisation (la modification la plus récente gagne)
    dbRef.current = d; setDb(d); if (okMsg) toast(okMsg); return r || okr();
  }, [toast]);
  const applyDb = useCallback((nd) => { dbRef.current = nd; setDb(nd); }, []); // remplacement en douceur (synchronisation) : les fiches ouvertes restent
  const sync = useDriveSync({ db, dbRef, applyDb, toast });
  const cloud = useCloud({ db, dbRef, applyDb, toast }); // stockage dans un dossier Google Drive / OneDrive / Dropbox / de l'ordinateur

  const R = useMemo(() => getR(db), [db]);
  const camp = db.campagnes.find((c) => c.id === db.settings.campagneActive) || db.campagnes[0];
  const defaultDate = (() => { const t = todayISO(); return t >= camp.debut && t <= camp.fin ? t : (t < camp.debut ? camp.debut : camp.fin); })();
  const setTab = useCallback((tab0, sub) => {
    const tab = tab0 === 'registres' && SOUS_PARAMS.includes(sub) ? 'params' : tab0;
    if (!moduleActif(dbRef.current, tab)) { toast(`Le module « ${moduleNom(tab)} » est désactivé : réactivez-le dans Paramètres › Modules.`, 'bad'); return; }
    if (!moduleAutorise(dbRef.current, sessionRef.current, tab)) { toast(`Votre profil ne donne pas accès au module « ${moduleNom(tab)} ».`, 'bad'); return; }
    setNav({ tab, sub: sub || null }); setStack([]); window.scrollTo({ top: 0 });
  }, [toast]);
  // module ouvert désactivé (ici ou sur un autre appareil) : retour au premier module actif
  const visibles = modulesVisibles(db).filter((m) => moduleAutorise(db, uid, m));
  useEffect(() => { if (!visibles.includes(nav.tab)) setNav({ tab: visibles[0] || MODULE_FIXE, sub: null }); }, [visibles.join(), nav.tab]);
  const push = useCallback((k, id) => setStack((s) => { const top = s[s.length - 1]; if (top && top.k === k && top.id === id) return s; return [...s.filter((x) => !(x.k === k && x.id === id)), { k, id }]; }), []);
  const showLot = useCallback((id) => push('lot', id), [push]); const showCont = useCallback((id) => push('cont', id), [push]); const showFini = useCallback((id) => push('fini', id), [push]);
  const showOperateur = useCallback((id) => push('opr', id), [push]);
  // opérateur de cet appareil : proposé d'office dans les nouvelles opérations (mémorisé dans ce navigateur seulement)
  const [moi0, setMoi0] = useState(moiLire); const oMoi = operateurDe(db, moi0);
  const oUser = uid && uSession.operateurId ? operateurDe(db, uSession.operateurId) : null; // utilisateur connecté relié à un opérateur : c'est lui qui saisit
  const moi = oUser && oUser.actif !== false ? oUser.id : oMoi && oMoi.actif !== false ? moi0 : '';
  const setMoi = useCallback((id) => { setMoi0(id || ''); moiEcrire(id || ''); }, []);

  // connexion, verrouillage (manuel ou après inactivité), déconnexion
  const derniereActivite = useRef(Date.now());
  const connecter = useCallback((id, garder) => { derniereActivite.current = Date.now(); setSession({ uid: id, garder: !!garder, t: Date.now(), verrou: false }); }, [setSession]);
  const verrouiller = useCallback((auto) => { const id = sessionRef.current; if (!id) return; act((d) => auditAjouter(d, { uid: id, action: 'verrouillage', resume: auto ? 'Verrouillage automatique (inactivité)' : 'Session verrouillée', appareil: appareilNom() }), null, { systeme: true }); setSession({ uid: id, garder: !!(session && session.garder), t: Date.now(), verrou: true }); }, [act, session, setSession]);
  const deconnecter = useCallback(() => { const id = sessionRef.current || (session && session.uid); if (id && utilisateurDe(dbRef.current, id)) act((d) => auditAjouter(d, { uid: id, action: 'deconnexion', resume: 'Déconnexion', appareil: appareilNom() }), null, { systeme: true }); setSession(null); setStack([]); setOpDlg(null); setMisc(null); setMenu(null); setContEdit(null); setReport(null); setDocsDlg(null); setToastMsg(null); }, [act, session, setSession]);
  useEffect(() => { // verrouillage automatique
    if (!uid || verrouille) return undefined;
    const bouge = () => { const n = Date.now(); if (n - derniereActivite.current > 20000) sessionEcrire({ uid, garder: !!(session && session.garder), t: n, verrou: false }); derniereActivite.current = n; };
    const ev = ['pointerdown', 'keydown', 'wheel', 'touchstart']; ev.forEach((x) => window.addEventListener(x, bouge, { passive: true }));
    const iv = setInterval(() => { const m = securiteReglages(dbRef.current).verrouMin; if (m > 0 && Date.now() - derniereActivite.current > m * 60000) verrouiller(true); }, 15000);
    return () => { ev.forEach((x) => window.removeEventListener(x, bouge)); clearInterval(iv); };
  }, [uid, verrouille, verrouiller]);
  useEffect(() => { // écran verrouillé : le reste de la page est inerte (clavier, lecteurs d'écran), Échap ne ferme rien dessous
    if (!verrouille) return undefined;
    const echap = (e) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); e.preventDefault(); } };
    window.addEventListener('keydown', echap, true);
    const els = [...document.body.children].filter((el) => !el.hasAttribute('data-verrou') && el.tagName !== 'SCRIPT'); els.forEach((el) => el.setAttribute('inert', ''));
    return () => { window.removeEventListener('keydown', echap, true); els.forEach((el) => el.removeAttribute('inert')); };
  }, [verrouille]);
  // session d'un compte désactivé ou supprimé (depuis un autre appareil) : retour à l'écran de connexion
  useEffect(() => { if (secu && session && !uid) { setSession(null); setStack([]); setOpDlg(null); } }, [secu, session, uid]);
  const ctx = {
    db, R, act, toast, confirm, camp, defaultDate, nav, setTab, showLot, showCont, showFini, showOperateur, moi, setMoi, storeOK, sync, cloud, applyDb,
    uid, secu, niveau: (m) => niveauModule(db, uid, m), droit: (k) => peut(db, uid, k), connecter, deconnecter, verrouiller,
    openOp: (type, preset, editId, opts) => { setMenu(null); setOpDlg({ type, preset, editId, ...(opts || {}) }); },
    openDocs: (cible, kind, title) => { setMenu(null); setDocsDlg({ cible, kind, title, k: Date.now() }); }, openLegal: (o) => { setMenu(null); setLegal(o || 'mentions'); }, openFiche: (sources) => { setMenu(null); setFicheDlg({ sources, k: Date.now() }); },
    openAnalyse: (preset) => { setMenu(null); setMisc({ kind: 'analyse', preset }); }, openHyg: (preset) => { setMenu(null); setMisc({ kind: 'hyg', preset }); },
    openMenu: (cid, x, y) => setMenu({ cid, x, y, k: Date.now() }), editCont: (id) => { setMenu(null); setContEdit(id); }, openReport: (init) => { setMenu(null); setReport(init || { kind: 'lot', ids: [] }); },
  };

  /* ----- sauvegarde / restauration / réinitialisation ----- */
  // remplacer toute la base (réinitialiser, exemple, restauration) : droit « Sauvegardes et Drive » ; une base sans identifiants garde ceux d'ici
  const autoriseBase = () => { if (!securiteActive(dbRef.current) || peut(dbRef.current, sessionRef.current, 'sauvegarde')) return true; toast('Droits insuffisants : réservé aux profils « Sauvegardes et Drive ».', 'bad'); return false; };
  const garderSecurite = (nd, quoi) => {
    const av = dbRef.current; if (!securiteActive(av)) return nd;
    const garde = securiteActive(nd) ? nd : { ...nd, utilisateurs: av.utilisateurs, profils: av.profils, audit: [...(av.audit || [])], settings: { ...nd.settings, securite: av.settings.securite } };
    auditAjouter(garde, { uid: sessionRef.current, action: 'securite', resume: quoi, appareil: appareilNom() }); return garde;
  };
  const resetEmpty = async () => {
    if (!autoriseBase()) return;
    const ok = await confirm({ title: 'Réinitialiser à vide ?', body: 'Toutes les données (contenants, lots, opérations, stocks…) seront effacées de ce navigateur ; la liste des crus (villages) est rétablie. Pensez à exporter la base complète avant (Paramètres › Sauvegarde & Drive).', ok: 'Tout effacer', danger: true });
    if (ok) { const d = garderSecurite(emptyDb(), 'Base réinitialisée à vide (comptes gardés)'); dbRef.current = d; setDb(d); setStack([]); sync.suspendre(); cloud.suspendre(); toast('Base réinitialisée à vide.'); }
  };
  const loadSample = async () => {
    if (!autoriseBase()) return;
    const ok = await confirm({ title: 'Recharger le jeu d’exemple ?', body: 'Les données actuelles seront remplacées par le jeu de démonstration (2 sites, apporteurs, crus, entrée de moûts, jarre, amphore, œuf…).', ok: 'Recharger l’exemple', danger: true });
    if (ok) { const d = garderSecurite(normalizeDb(sampleDb()), 'Jeu d’exemple chargé (comptes gardés)'); dbRef.current = d; setDb(d); setStack([]); sync.suspendre(); cloud.suspendre(); toast('Jeu d’exemple rechargé.'); }
  };
  ctx.replaceDb = (nd0, msg) => { if (!autoriseBase()) return false; const nd = garderSecurite(nd0, 'Sauvegarde restaurée'); dbRef.current = nd; setDb(nd); setStack([]); sync.suspendre(); cloud.suspendre(); if (msg) toast(msg); return true; };
  ctx.resetEmpty = resetEmpty; ctx.loadSample = loadSample; ctx.theme = theme; ctx.setTheme = setTheme; ctx.mode = mode;

  const toggleFreeze = async () => {
    if (camp.figee) {
      const ok = await confirm({ title: `Rouvrir la campagne ${camp.nom} ?`, body: 'Les opérations, arrivages, analyses et entrées d’hygiène de la période redeviennent modifiables et la photo des stocks est supprimée.', ok: 'Rouvrir' });
      if (ok) act((d) => campReopen(d, camp.id), `Campagne ${camp.nom} rouverte.`);
    } else {
      const ok = await confirm({ title: `Figer la campagne ${camp.nom} ?`, body: `Les opérations du ${fmtDate(camp.debut)} au ${fmtDate(camp.fin)} ne pourront plus être modifiées ni supprimées, et une photo des stocks d’ouverture et de clôture sera conservée. Vous pourrez rouvrir la campagne à tout moment.`, ok: 'Figer la campagne' });
      if (ok) act((d) => campFreeze(d, camp.id), `Campagne ${camp.nom} figée.`);
    }
  };

  const pendingAlerts = db.alertes.filter((a) => a.statut === 'attente').length;
  const toCheck = Object.keys(R.warn).filter((id) => { const o = db.ops.find((x) => x.id === id); return o && !o.verifie && o.date >= camp.debut && o.date <= camp.fin; }).length;
  const dluoIssues = db.arrivages.filter((a) => { const rest = arrivalRest(R, a); const k = dluoState(a.dluo).k; return rest > 0.0001 && (k === 'expire' || k === 'bientot'); }).length;
  const prevLate = (db.previsions || []).filter((p) => p.statut === 'prevue' && p.date <= todayISO()).length;
  const badge = { previsions: prevLate ? { n: prevLate, tone: 'warn' } : null, declass: pendingAlerts ? { n: pendingAlerts, tone: 'bad' } : null, ops: toCheck ? { n: toCheck, tone: 'warn' } : null, intrants: dluoIssues ? { n: dluoIssues, tone: 'warn' } : null };
  const Cmp = TABS_REG[nav.tab];
  const sheetLabel = (sh) => (sh.k === 'cont' ? contName(db, sh.id) : sh.k === 'lot' ? lotCode(db, R, sh.id) : sh.k === 'opr' ? operateurNom(db, sh.id) || 'opérateur' : ((db.lotsFinis || []).find((f) => f.id === sh.id) || {}).code || 'lot fini');

  if (accueil) {
    return (
      <Ctx.Provider value={ctx}>
        <AccueilPage revoir={accueil === 'revoir'} onOuvrir={entrer} onLegal={setLegal} />
        {legal ? <LegalSheet onglet={legal} onClose={fermerLegal} /> : null}
        {toastMsg ? <div className={`toast ${toastMsg.kind === 'bad' ? 'bad' : ''}`} role="status" aria-live="polite">{toastMsg.msg}</div> : null}
      </Ctx.Provider>
    );
  }
  // identifiants activés et personne de connecté sur cet appareil : écran de connexion seul (les synchronisations continuent)
  if (secu && !uid) {
    return (
      <Ctx.Provider value={ctx}>
        <EcranConnexion key="connexion" onConnecte={connecter} />
        <LegalLiens className="legal-liens-connexion" onOuvrir={setLegal} />
        {legal ? <LegalSheet onglet={legal} onClose={fermerLegal} /> : null}
        <SyncSheet />
        {cfm ? <ConfirmDialog cfm={cfm} onClose={(v) => { const r = cfm.res; setCfm(null); r(v); }} /> : null}
        {toastMsg ? <div className={`toast ${toastMsg.kind === 'bad' ? 'bad' : ''}`} role="status" aria-live="polite">{toastMsg.msg}</div> : null}
      </Ctx.Provider>
    );
  }
  return (
    <Ctx.Provider value={ctx}>
      {verrouille ? ReactDOM.createPortal(<div className="login-voile" data-verrou=""><EcranConnexion key={`verrou-${session.uid}`} verrou={session} onConnecte={connecter} onChanger={deconnecter} />{toastMsg ? <div className={`toast ${toastMsg.kind === 'bad' ? 'bad' : ''}`} role="status" aria-live="polite">{toastMsg.msg}</div> : null}</div>, document.body) : null}
      {uid && uSession.doitChanger ? <ChangerMdpSheet force onClose={() => {}} /> : null}
      <header className="topbar">
        <div className="wrap flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
          <Brand size={50} />
          <div className="hdr-camp ml-auto flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2"><span className="lbl mb-0">Campagne</span>
              <select className="inp" style={{ width: 'auto', minWidth: 130 }} value={camp.id} onChange={(e) => act((d) => { d.settings.campagneActive = e.target.value; return okr(); })}>{db.campagnes.map((c) => <option key={c.id} value={c.id}>{c.nom}{c.figee ? ' 🔒' : ''}</option>)}</select></label>
            <Chip tone={camp.figee ? 'bad' : 'ok'}>{camp.figee ? '🔒 Figée' : 'Ouverte'}</Chip>
            {!secu || peut(db, uid, 'campagnes') ? <Btn onClick={toggleFreeze} title="Figer / Rouvrir la campagne">{camp.figee ? 'Rouvrir la campagne' : 'Figer la campagne'}</Btn> : null}
          </div>
        </div>
        <div className="wrap hdr-actions pb-3">
          <span className="hdr-status ml-auto flex flex-wrap items-center gap-2 text-xs">
            {secu ? <UtilisateurChip /> : <OperateurChip />}
            <CloudChip />
            <DriveChip />
            {secu && !peut(db, uid, 'sauvegarde') ? null : (() => { const der = derniereSauvegarde(db); const late = joursDepuis(der) > (num(db.settings.rappelSauvegardeJours) || 7); return <button type="button" className={cx('chip', late ? 'chip-warn' : 'chip-ok')} style={{ cursor: 'pointer' }} onClick={() => setTab('params', 'sauvegarde')} title="Sauvegarde complète, Drive, sauvegarde en ligne">💾 {der ? `Sauvegardé ${ilYa(der)}` : 'Aucune sauvegarde'}{late ? ' · à faire' : ''}</button>; })()}
            {storeOK ? <Chip tone="ok" title="Chaque modification est enregistrée automatiquement dans le localStorage de ce navigateur.">✓ Enregistrement auto · 100 % local</Chip> : <Chip tone="bad" title="Le navigateur refuse le stockage local.">⚠ Stockage local indisponible</Chip>}
            <button type="button" className="btn btn-sm" onClick={() => setApparence(true)} title="Choisir la charte graphique et le mode clair / sombre">🎨 Thème : {charte.nom} · {theme === 'auto' ? 'auto' : theme === 'light' ? 'clair' : 'sombre'}</button>
          </span>
        </div>
        {!storeOK ? <div className="wrap pb-3"><Notice tone="bad" title="Les données ne sont pas conservées entre deux visites">Le stockage local du navigateur est indisponible (navigation privée ou blocage). Exportez régulièrement la base complète (Paramètres › Sauvegarde & Drive) pour ne rien perdre.</Notice></div> : null}
        {showMig ? <div className="wrap pb-3"><Notice tone="ok" title="Bienvenue dans Œnotrack">Vos données de « Cuverie champenoise » ont été reprises automatiquement (revendications, sites, liste des crus et apporteurs ajoutés). <button type="button" className="linkish" onClick={() => setShowMig(false)}>Masquer</button></Notice></div> : null}
        {db.meta.exemple ? <div className="wrap pb-3"><Notice tone="info" title="Jeu de données d’exemple chargé"><span className="hidden sm:inline">Vous pouvez tout tester librement (plan de cave, clic droit, entrée de moûts, traçabilité, rapports…). Quand vous voulez repartir de zéro : </span><span className="sm:hidden">Testez librement, puis repartez de zéro : </span><button type="button" className="linkish" onClick={resetEmpty}>Réinitialiser à vide</button>.</Notice></div> : null}
      </header>
      <nav className="navbar" aria-label="Onglets principaux"><div className="wrap"><div className="navtabs" role="tablist">
        {visibles.map((id) => (<button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={nav.tab === id} className="tab" onClick={() => setTab(id)}>{moduleNom(id)}{badge[id] ? <span className={`chip chip-${badge[id].tone}`}>{badge[id].n}</span> : null}</button>))}
      </div></div></nav>
      <main className="wrap py-5" role="tabpanel" aria-labelledby={`tab-${nav.tab}`}>
        {camp.figee ? <div className="mb-4"><Notice tone="warn" title={`Campagne ${camp.nom} figée`}>Les opérations du {fmtDate(camp.debut)} au {fmtDate(camp.fin)} sont verrouillées. Rouvrez la campagne pour les modifier.</Notice></div> : null}
        {secu && uid && !visibles.length ? <Notice tone="warn" title="Aucun module accessible">Votre profil « {profilNom(db, uid)} » ne donne accès à aucun module : adressez-vous à un administrateur.</Notice> : <>
          {nav.tab !== 'params' ? <LectureSeuleBandeau mod={nav.tab} /> : null}
          {Cmp ? <Cmp key={nav.tab} /> : <Placeholder name={nav.tab} />}</>}
      </main>
      <footer className="appfoot"><div className="wrap"><span>Œnotrack — traçabilité de cuverie &amp; de chai{(db.entreprise || {}).nom ? ` · ${db.entreprise.nom}` : ''}</span><span>Données enregistrées dans ce navigateur</span><span className="appfoot-n">Campagne {camp.nom}</span><InstallerBouton /><LangueChoix compact /><button type="button" className="appfoot-presentation" onClick={revoirAccueil}>Présentation</button><LegalLiens onOuvrir={setLegal} /><button type="button" className="appfoot-v" onClick={() => setVersionOpen(true)} title="Nouveautés et compatibilité des données">Œnotrack {APP_VERSION}</button></div></footer>
      {versionOpen ? <VersionSheet onClose={() => setVersionOpen(false)} /> : null}
      {legal ? <LegalSheet onglet={legal} onClose={fermerLegal} /> : null}
      {stack.map((sh, i) => {
        const top = i === stack.length - 1; const prev = stack[i - 1];
        const p = { id: sh.id, onClose: () => setStack((s) => s.slice(0, i)), onBack: prev ? () => setStack((s) => s.slice(0, i)) : null, backLabel: prev ? sheetLabel(prev) : '', onCloseAll: () => setStack([]) };
        return (
          <div key={`${sh.k}:${sh.id}`} style={top ? undefined : { visibility: 'hidden' }} aria-hidden={top ? undefined : true}>
            {sh.k === 'lot' ? <LotSheet {...p} /> : sh.k === 'cont' ? <ContSheet {...p} /> : sh.k === 'opr' ? <OperateurSheet {...p} /> : <FiniSheet {...p} />}
          </div>
        );
      })}
      {contEdit ? <ContForm id={contEdit} onClose={() => setContEdit(null)} /> : null}
      {opDlg ? <OpForm key={`${opDlg.type}|${opDlg.prevId || opDlg.fromPrev || ''}|${opDlg.editId || ''}`} type={opDlg.type} preset={opDlg.preset} editId={opDlg.editId} prevId={opDlg.prevId || opDlg.fromPrev} onClose={() => setOpDlg(null)} /> : null}
      {misc && misc.kind === 'analyse' ? <AnalyseForm preset={misc.preset} onClose={() => setMisc(null)} /> : null}
      {misc && misc.kind === 'hyg' ? <HygieneForm preset={misc.preset} onClose={() => setMisc(null)} /> : null}
      {report ? <ReportDialog init={report} onClose={() => setReport(null)} /> : null}
      {apparence ? <ApparenceSheet onClose={() => setApparence(false)} /> : null}
      {docsDlg ? <DocsSheet key={docsDlg.k} cible={docsDlg.cible} kind={docsDlg.kind} title={docsDlg.title} onClose={() => setDocsDlg(null)} /> : null}
      {ficheDlg ? <FicheDialog key={ficheDlg.k} sources={ficheDlg.sources} onClose={() => setFicheDlg(null)} /> : null}
      <VeilleAuto />
      {menu ? <CtxMenu key={menu.k} m={menu} onClose={() => setMenu(null)} /> : null}
      <SyncSheet />
      <DossierChoix />
      <SyncDepot />
      {cfm ? <ConfirmDialog cfm={cfm} onClose={(v) => { const r = cfm.res; setCfm(null); r(v); }} /> : null}
      {toastMsg ? <div className={`toast ${toastMsg.kind === 'bad' ? 'bad' : ''}`} role="status" aria-live="polite">{toastMsg.msg}</div> : null}
    </Ctx.Provider>
  );
}

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { e: null }; }
  static getDerivedStateFromError(e) { return { e }; }
  render() { return this.state.e ? <div className="wrap py-8"><Notice tone="bad" title="Erreur d’affichage">{String(this.state.e && this.state.e.message || this.state.e)}<div className="mt-2"><button className="btn" onClick={() => { try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignoré */ } window.location.reload(); }}>Effacer les données locales et recharger</button></div></Notice></div> : this.props.children; }
}

ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>);
