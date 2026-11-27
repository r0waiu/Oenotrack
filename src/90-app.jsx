/* ============ APPLICATION : état, persistance, bandeau Œnotrack, onglets, pile de fiches, menus ============ */
// Modules (onglets) : ordre et activation réglables dans Paramètres › Modules (MODULES_DEFAUT, modulesVisibles… : 31-crud.js)
const MODULE_DEFS = {
  cuverie: { label: 'Cuverie & Lots', icone: '🛢', desc: 'Plan de cave, contenants, lots et composition des cuves.' },
  pressoir: { label: 'Pressoir', icone: '🍇', desc: 'Registre des pesées et bons de pesée, carnet de pressoir et bons de pressoir (marcs, cuvée, tailles, rebêches), relevés par apporteur, bilan et contrôles de la campagne.' },
  ops: { label: 'Opérations & Assemblages', icone: '⚗', desc: 'Saisie des opérations de vinification en cuve ou en fût (vendange, vinification, élevage, assemblages…), journal complet et catalogue des opérations.' },
  previsions: { label: 'À réaliser & fiches', icone: '📋', desc: 'Opérations planifiées, fiches à imprimer pour l’équipe.' },
  plan: { label: 'Plan de vinification', icone: '🗂', desc: 'Instruction de travail : doses par étape, groupe de cépages, revendication et fraction ; application à un lot, impression ; schémas de vinification par lot.' },
  declass: { label: 'Déclassements', icone: '⚠', desc: 'Alertes de déclassement (intrant non autorisé…) à valider ou refuser, dans l’onglet « Opérations & Assemblages ».' },
  tirage: { label: 'Tirages', icone: '🍾', desc: 'Préparations (levain, pied de cuve, liqueur de tirage) et tirages (mixtions) : saisis ici, plus dans « Opérations & Assemblages ».' },
  cave: { label: 'Cave', icone: '🕯', desc: 'Bouteilles sur lattes : stock par lot, âge, remuage et mise sur pointes (saisis ici).' },
  degorgement: { label: 'Dégorgement', icone: '🥂', desc: 'Liqueurs d’expédition, dégorgements (saisis ici) et lots finis.' },
  analyses: { label: 'Analyses', icone: '🔬', desc: 'Analyses et paramètres personnalisables.' },
  intrants: { label: 'Intrants & Stocks', icone: '📦', desc: 'Produits œnologiques, arrivages, lots fournisseurs, DLUO et stocks.' },
  hygiene: { label: 'Hygiène', icone: '🧽', desc: 'Journal des nettoyages, rinçages et désinfections.' },
  equipements: { label: 'Équipements', icone: '🛠', desc: 'Parc de matériel (fiches, documents), maintenance préventive et réglementaire, pannes, vérifications périodiques des balances et instruments.' },
  trace: { label: 'Traçabilité', icone: '🔎', desc: 'Recherches ascendante et descendante, par intrant, par parcelle.' },
  registres: { label: 'Registres', icone: '📑', desc: 'Registres à exporter (CSV / Excel) et bilan matière.' },
  params: { label: 'Paramètres', icone: '⚙', desc: 'Société & opérateurs, modules, sauvegarde & Drive, campagnes, listes et réglages.' },
};
// onglets regroupés (0.34.0-alpha.1, ONGLETS_GROUPES : 31-crud.js) : « Vinification » réunit trois modules en sous-onglets
const ONGLET_GROUPE_DEFS = { vinification: { label: 'Vinification', icone: '🍷', desc: 'Cuverie & Lots, Opérations & Assemblages, À réaliser & fiches, Plan de vinification : réunis dans un seul onglet.' } };
const moduleNom = (id) => (MODULE_DEFS[id] ? MODULE_DEFS[id].label : ONGLET_GROUPE_DEFS[id] ? ONGLET_GROUPE_DEFS[id].label : id);
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
  const first = useRef(null); if (!first.current) { const l = loadDb(); first.current = { db: l.db || normalizeDb(sampleDb()), migrated: !!l.migrated, neuf: !l.db, reunie: !!l.reunie }; }
  const [db, setDb] = useState(first.current.db);
  const dbRef = useRef(db); dbRef.current = db;
  const [storeOK, setStoreOK] = useState(true);
  const [showMig, setShowMig] = useState(first.current.migrated);
  const [nav, setNav] = useState(() => ({ tab: ongletOuverture(first.current.db), sub: null })); // onglet d'ouverture (réglage) ou premier onglet
  const groupeMemo = useRef({}); // dernier sous-onglet ouvert de chaque onglet regroupé (Vinification)
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
  useIaEspace(db, uid); // assistant IA de l'espace de travail (0.38.0-alpha.1) : clé commune déchiffrée en mémoire
  const [stack, setStack] = useState([]); // fiches ouvertes : { k: 'lot' | 'cont' | 'fini', id } — la dernière ouverte est au premier plan
  const [traceDlg, setTraceDlg] = useState(null); // fichier de traçabilité : export d'une expédition, traçabilité amont d'une entrée (0.27.0-alpha.1)
  const [opDlg, setOpDlg] = useState(null); const [misc, setMisc] = useState(null); const [menu, setMenu] = useState(null); const [contEdit, setContEdit] = useState(null); const [report, setReport] = useState(null); const [docsDlg, setDocsDlg] = useState(null); const [ficheDlg, setFicheDlg] = useState(null);
  const [schemaDlg, setSchemaDlg] = useState(null); // schéma de vinification proposé (0.31.0-alpha.1)
  const [groupeDlg, setGroupeDlg] = useState(null); const [mdpDlg, setMdpDlg] = useState(null); // saisie groupée, mot de passe de chiffrement (0.29.0-alpha.1)
  const [theme, setTheme] = useState(() => { try { return window.localStorage.getItem(THEME_KEY) || window.localStorage.getItem('cuverie-champenoise-theme') || 'auto'; } catch (e) { return 'auto'; } });

  useEffect(() => { setStoreOK(saveDb(db)); }, [db]);
  // écriture chiffrée terminée (coffre de l'appareil) : stockage plein ou refusé signalé comme avant
  useEffect(() => { const f = (e) => { if (e && e.detail && e.detail.cle === STORAGE_KEY) setStoreOK(!!e.detail.ok); }; window.addEventListener('oenotrack-stockage', f); return () => window.removeEventListener('oenotrack-stockage', f); }, []);
  useEffect(() => { if (first.current.reunie) setTimeout(() => toast('Données saisies avec une version antérieure d’Œnotrack sur cet appareil : réunies à la base chiffrée (rien n’est perdu).'), 600); }, []);
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
  // mot de passe de chiffrement demandé au besoin (sauvegarde, restauration, Drive chiffré) : (en-tête, raison) → clé ou null (0.29.0-alpha.1)
  useEffect(() => { CHIFFRE_DEMANDER = (entete, raison) => new Promise((res) => setMdpDlg({ mode: 'saisir', entete: entete || {}, raison, res })); return () => { CHIFFRE_DEMANDER = null; }; }, []);
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

  const camp = db.campagnes.find((c) => c.id === db.settings.campagneActive) || db.campagnes[0];
  const R = useMemo(() => campEtatR(db, camp), [db, camp && camp.id, campEtatDate(camp)]); // campagne antérieure : état à sa fin (0.34.0-alpha.1)
  const defaultDate = (() => { const t = todayISO(); return t >= camp.debut && t <= camp.fin ? t : (t < camp.debut ? camp.debut : camp.fin); })();
  const setTab = useCallback((tab0, sub0) => {
    let tab = tab0 === 'registres' && SOUS_PARAMS.includes(sub0) ? 'params' : tab0; let sub = sub0;
    if (MODULES_DANS[tab]) { // module rangé dans l'onglet d'un autre (déclassements → Opérations & Assemblages)
      if (!moduleActif(dbRef.current, tab)) { toast(`Le module « ${moduleNom(tab)} » est désactivé : réactivez-le dans Paramètres › Modules.`, 'bad'); return; }
      if (!moduleAutorise(dbRef.current, sessionRef.current, tab)) { toast(`Votre profil ne donne pas accès au module « ${moduleNom(tab)} ».`, 'bad'); return; }
      sub = tab; tab = MODULES_DANS[tab];
    }
    // réglage de Paramètres rangé dans un autre onglet (0.39.0-alpha.1 : opérations, schémas, barèmes) : ouvert là-bas s'il est affiché
    if (tab === 'params' && typeof paramsDeplaceOk === 'function' && paramsDeplaceOk(dbRef.current, sessionRef.current, sub)) { const v = PARAMS_DEPLACES[sub]; tab = v.tab; sub = v.sub; }
    if (!moduleActif(dbRef.current, tab)) { toast(`Le module « ${moduleNom(tab)} » est désactivé : réactivez-le dans Paramètres › Modules.`, 'bad'); return; }
    if (!moduleAutorise(dbRef.current, sessionRef.current, tab)) { toast(`Votre profil ne donne pas accès au module « ${moduleNom(tab)} ».`, 'bad'); return; }
    setNav({ tab, sub: sub || null }); setStack([]); window.scrollTo({ top: 0 });
  }, [toast]);
  // module ouvert désactivé (ici ou sur un autre appareil) : retour au premier module actif
  const visibles = modulesVisibles(db).filter((m) => moduleAutorise(db, uid, m));
  useEffect(() => { if (!visibles.includes(nav.tab)) setNav({ tab: ongletOuverture(db, visibles), sub: null }); }, [visibles.join(), nav.tab]);
  useEffect(() => { const g = ongletDe(nav.tab); if (ONGLETS_GROUPES[g]) groupeMemo.current[g] = nav.tab; }, [nav.tab]);
  const onglets = ongletsBarre(visibles);
  const ouvrirOnglet = (o) => { const M = ongletMembres(o, visibles); const m = groupeMemo.current[o]; setTab(M.includes(m) ? m : M[0] || o); };
  const push = useCallback((k, id) => setStack((s) => { const top = s[s.length - 1]; if (top && top.k === k && top.id === id) return s; return [...s.filter((x) => !(x.k === k && x.id === id)), { k, id }]; }), []);
  const showLot = useCallback((id) => push('lot', id), [push]); const showCont = useCallback((id) => push('cont', id), [push]); const showFini = useCallback((id) => push('fini', id), [push]);
  // lien direct vers la fiche d'une cuve (étiquette QR : …#cuve=identifiant, 0.29.0-alpha.1) : ouverte dès que l'application est prête (après connexion)
  const lienAttente = useRef(null);
  useEffect(() => { const lire = () => { const x = lienCuveLire(window.location.hash, window.location.search); if (x) { lienAttente.current = x.cuve; setLienN((n) => n + 1); } }; lire(); window.addEventListener('hashchange', lire); return () => window.removeEventListener('hashchange', lire); }, []);
  const [lienN, setLienN] = useState(0);
  useEffect(() => {
    const id = lienAttente.current; if (!id || accueil || (secu && (!uid || verrouille))) return;
    lienAttente.current = null; try { const u = window.location; const h = String(u.hash || '').replace(/(^#|&)cuve=[^&]*/, '').replace(/^#?&?/, ''); window.history.replaceState(null, '', u.pathname + u.search.replace(/([?&])cuve=[^&#]*&?/, '$1').replace(/[?&]$/, '') + (h ? `#${h}` : '')); } catch (e) { /* ignoré */ }
    if (dbRef.current.contenants.some((c) => c.id === id)) showCont(id); else toast('Cette étiquette ne correspond à aucun contenant de cette base (autre exploitation, ou contenant pas encore synchronisé sur cet appareil).', 'bad');
  }, [lienN, accueil, secu, uid, verrouille]);
  const showOperateur = useCallback((id) => push('opr', id), [push]);
  // opérateur de cet appareil : proposé d'office dans les nouvelles opérations (mémorisé dans ce navigateur seulement)
  const [moi0, setMoi0] = useState(moiLire); const oMoi = operateurDe(db, moi0);
  const oUser = uid && uSession.operateurId ? operateurDe(db, uSession.operateurId) : null; // utilisateur connecté relié à un opérateur : c'est lui qui saisit
  const moi = oUser && oUser.actif !== false ? oUser.id : oMoi && oMoi.actif !== false ? moi0 : '';
  const setMoi = useCallback((id) => { setMoi0(id || ''); moiEcrire(id || ''); }, []);

  // connexion, verrouillage (manuel ou après inactivité), déconnexion
  const derniereActivite = useRef(Date.now());
  // connexion (0.34.0-alpha.1) : ouverture sur l'onglet choisi (Paramètres › Modules) ou le premier de la barre — plus sur « Société &
  // opérateurs » (l'écran de connexion, sans droits, retombait sur Paramètres). Déverrouillage de la même session : la page reste telle
  // quelle (formulaire en cours intact) si elle est toujours accessible.
  const sessionEtat = useRef(session); sessionEtat.current = session; const navRef = useRef(nav); navRef.current = nav;
  const connecter = useCallback((id, garder, opts) => {
    const s0 = sessionEtat.current; const d = dbRef.current; const L = modulesVisibles(d).filter((m) => moduleAutorise(d, id, m));
    derniereActivite.current = Date.now(); setSession({ uid: id, garder: !!garder, t: Date.now(), verrou: false });
    if (opts && opts.rester) return; // activation des identifiants depuis Paramètres : on y reste (code de secours affiché)
    if (s0 && s0.verrou && s0.uid === id && L.includes(navRef.current.tab)) return;
    setNav({ tab: ongletOuverture(d, L), sub: null });
  }, [setSession]);
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
    openDocs: (cible, kind, title) => { setMenu(null); setDocsDlg({ cible, kind, title, k: Date.now() }); }, openTrace: (x) => { setMenu(null); setTraceDlg(x ? { ...x, n: Date.now() } : null); }, openLegal: (o) => { setMenu(null); setLegal(o || 'mentions'); }, openFiche: (sources) => { setMenu(null); setFicheDlg({ sources, k: Date.now() }); },
    openAnalyse: (preset) => { setMenu(null); setMisc({ kind: 'analyse', preset }); }, openHyg: (preset) => { setMenu(null); setMisc({ kind: 'hyg', preset }); },
    openGroupe: (x) => { setMenu(null); setGroupeDlg(x ? { ...x, k: Date.now() } : null); },
    openSchema: (x) => { setMenu(null); setSchemaDlg(x ? { ...x, k: Date.now() } : null); },
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
    if (ok) { pointRetourEcrire(dbRef.current, 'Remise à zéro de la base'); const d = gardeJournalGarder(dbRef.current, garderSecurite(emptyDb(), 'Base réinitialisée à vide (comptes gardés)')); dbRef.current = d; setDb(d); setStack([]); sync.suspendre(); cloud.suspendre(); toast('Base réinitialisée à vide.'); }
  };
  const loadSample = async () => {
    if (!autoriseBase()) return;
    const ok = await confirm({ title: 'Recharger le jeu d’exemple ?', body: 'Les données actuelles seront remplacées par le jeu de démonstration (2 sites, apporteurs, crus, entrée de moûts, jarre, amphore, œuf…).', ok: 'Recharger l’exemple', danger: true });
    if (ok) { pointRetourEcrire(dbRef.current, 'Chargement du jeu d’exemple'); const d = gardeJournalGarder(dbRef.current, garderSecurite(normalizeDb(sampleDb()), 'Jeu d’exemple chargé (comptes gardés)')); dbRef.current = d; setDb(d); setStack([]); sync.suspendre(); cloud.suspendre(); toast('Jeu d’exemple rechargé.'); }
  };
  // point de restauration (0.27.0-alpha.1) : la base de l'appareil est gardée avant d'être remplacée (Paramètres › Sécurité des importations)
  ctx.replaceDb = (nd0, msg, motif) => { if (!autoriseBase()) return false; loadDbDebloquer(); pointRetourEcrire(dbRef.current, motif || 'Base remplacée'); const nd = gardeJournalGarder(dbRef.current, garderSecurite(nd0, 'Sauvegarde restaurée')); dbRef.current = nd; setDb(nd); setStack([]); sync.suspendre(); cloud.suspendre(); if (msg) toast(msg); return true; };
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

  const hygTachesBadge = useMemo(() => { if (!moduleActif(db, 'hygiene')) return { n: 0, nc: 0 }; try { const T = planTaches(db, todayISO()).filter((x) => !(x.origine === 'maintenance' && maintDansEquipements(db, uid))); return { n: T.length, nc: T.filter((x) => x.etat === 'nonconforme').length }; } catch (e) { console.error(e); return { n: 0, nc: 0 }; } }, [db, uid]);
  const equipBadge = useMemo(() => { if (!maintDansEquipements(db, uid)) return null; try { const T = equipTaches(db, todayISO()); return T.length ? { n: T.length, tone: T.some((x) => x.etat === 'retard' || x.interventionId) ? 'bad' : 'warn' } : null; } catch (e) { console.error(e); return null; } }, [db, uid]);
  const pendingAlerts = db.alertes.filter((a) => a.statut === 'attente').length;
  // 0.38.0-alpha.3 : un seul parcours des opérations (plus une recherche par avertissement), refait seulement quand la base change
  const toCheck = useMemo(() => db.ops.filter((o) => (R.warn[o.id] || []).length && !o.verifie && o.date >= camp.debut && o.date <= camp.fin).length, [db, R, camp.debut, camp.fin]);
  const dluoIssues = db.arrivages.filter((a) => { const rest = arrivalRest(R, a); const k = dluoState(a.dluo).k; return rest > 0.0001 && (k === 'expire' || k === 'bientot'); }).length;
  const prevLate = (db.previsions || []).filter((p) => previsionEnRetard(p)).length; // 0.43.0-alpha.2 : étapes d'un plan (sans date) jamais en retard
  const hygT = hygTachesBadge; // plans de nettoyage et de maintenance (0.26.0-alpha.1)
  const badge = { hygiene: hygT.n ? { n: hygT.n, tone: hygT.nc ? 'bad' : 'warn' } : null, previsions: prevLate ? { n: prevLate, tone: 'warn' } : null, ops: pendingAlerts && moduleActif(db, 'declass') && moduleAutorise(db, uid, 'declass') ? { n: pendingAlerts, tone: 'bad' } : toCheck ? { n: toCheck, tone: 'warn' } : null, intrants: dluoIssues ? { n: dluoIssues, tone: 'warn' } : null, equipements: equipBadge };
  const Cmp = TABS_REG[nav.tab];
  const groupe = ONGLETS_GROUPES[ongletDe(nav.tab)] ? ongletDe(nav.tab) : null; const sousOnglets = groupe ? ongletMembres(groupe, visibles) : [];
  const badgeDe = (o) => { const B = ongletMembres(o, visibles).map((m) => badge[m]).filter(Boolean); return !B.length ? null : { n: sum(B, (b) => b.n), tone: B.some((b) => b.tone === 'bad') ? 'bad' : 'warn' }; };
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
        <EcranConnexion key="connexion" onConnecte={connecter} onPresentation={revoirAccueil} />
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
          <Brand size={50} onClick={revoirAccueil} />
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
            {storeOK ? <StockageLocalChip /> : <Chip tone="bad" title="Le navigateur refuse le stockage local.">⚠ Stockage local indisponible</Chip>}
            <button type="button" className="btn btn-sm" onClick={() => setApparence(true)} title="Choisir la charte graphique et le mode clair / sombre">🎨 Thème : {charte.nom} · {theme === 'auto' ? 'auto' : theme === 'light' ? 'clair' : 'sombre'}</button>
          </span>
        </div>
        {!storeOK && loadDbIllisible() ? <div className="wrap pb-3"><Notice tone="bad" title="Base de cet appareil illisible : rien n’est enregistré par-dessus">La base enregistrée sur cet appareil n’a pas pu être lue. Elle est gardée telle quelle : la base affichée est un exemple, et aucune modification n’est enregistrée. Restaurez une sauvegarde (Paramètres › Sauvegarde & Drive).</Notice></div> : null}
        {!storeOK && !loadDbIllisible() ? <div className="wrap pb-3"><Notice tone="bad" title="Les données ne sont pas conservées entre deux visites">Le stockage local du navigateur est indisponible (navigation privée ou blocage). Exportez régulièrement la base complète (Paramètres › Sauvegarde & Drive) pour ne rien perdre.</Notice></div> : null}
        <RappelSauvegarde />
        {showMig ? <div className="wrap pb-3"><Notice tone="ok" title="Bienvenue dans Œnotrack">Vos données de « Cuverie champenoise » ont été reprises automatiquement (revendications, sites, liste des crus et apporteurs ajoutés). <button type="button" className="linkish" onClick={() => setShowMig(false)}>Masquer</button></Notice></div> : null}
        {db.meta.exemple ? <div className="wrap pb-3"><Notice tone="info" title="Jeu de données d’exemple chargé"><span className="hidden sm:inline">Vous pouvez tout tester librement (plan de cave, clic droit, entrée de moûts, traçabilité, rapports…). Quand vous voulez repartir de zéro : </span><span className="sm:hidden">Testez librement, puis repartez de zéro : </span><button type="button" className="linkish" onClick={resetEmpty}>Réinitialiser à vide</button>.</Notice></div> : null}
      </header>
      <nav className="navbar" aria-label="Onglets principaux"><div className="wrap"><div className="navtabs" role="tablist">
        {onglets.map((id) => { const b = badgeDe(id); return (<button key={id} type="button" role="tab" id={`tab-${id}`} aria-selected={ongletDe(nav.tab) === id} className="tab" onClick={() => ouvrirOnglet(id)}>{moduleNom(id)}{b ? <span className={`chip chip-${b.tone}`}>{b.n}</span> : null}</button>); })}
      </div></div></nav>
      <main className="wrap py-5" role="tabpanel" aria-labelledby={`tab-${nav.tab}`} data-onglet={ongletDe(nav.tab)}>
        {camp.figee ? <div className="mb-4"><Notice tone="warn" title={`Campagne ${camp.nom} figée`}>Les opérations du {fmtDate(camp.debut)} au {fmtDate(camp.fin)} sont verrouillées. Rouvrez la campagne pour les modifier.</Notice></div> : null}
        {secu && uid && !visibles.length ? <Notice tone="warn" title="Aucun module accessible">Votre profil « {profilNom(db, uid)} » ne donne accès à aucun module : adressez-vous à un administrateur.</Notice> : <>
          {groupe ? <div className="sous-onglets mb-4 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label={moduleNom(groupe)} data-onglet-groupe={groupe}>{sousOnglets.map((m) => <button key={m} type="button" role="tab" id={`tab-${m}`} aria-selected={nav.tab === m} className={cx('btn shrink-0', nav.tab === m && 'btn-primary')} onClick={() => setTab(m)}><span aria-hidden="true">{(MODULE_DEFS[m] || {}).icone} </span>{moduleNom(m)}{badge[m] ? <span className={`chip chip-${badge[m].tone}`}>{badge[m].n}</span> : null}</button>)}</div> : null}
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
      {schemaDlg ? <PlanFeuille key={schemaDlg.k} lotIds={schemaDlg.lotIds} opId={schemaDlg.opId} auto={!!schemaDlg.auto} onClose={() => setSchemaDlg(null)} /> : null}
      {groupeDlg && groupeDlg.gid ? <GroupeSheet key={groupeDlg.k} gid={groupeDlg.gid} onClose={() => setGroupeDlg(null)} /> : null}
      {groupeDlg && groupeDlg.form ? <GroupeForm key={groupeDlg.k} gid={groupeDlg.form.gid} prevGid={groupeDlg.form.prevGid} onClose={() => setGroupeDlg(null)} /> : null}
      {mdpDlg ? <MdpChiffrementDialog d={mdpDlg} onFin={(k) => { const r = mdpDlg.res; setMdpDlg(null); r(k); }} /> : null}
      <VeilleAuto />
      <GardeExistants />
      {traceDlg && traceDlg.opId ? (traceDlg.k === 'amont' ? <TraceAmontSheet key={traceDlg.n} opId={traceDlg.opId} onClose={() => setTraceDlg(null)} /> : <TraceExportSheet key={traceDlg.n} opId={traceDlg.opId} onClose={() => setTraceDlg(null)} />) : null}
      <SuiteExpedition />
      {moduleActif(db, 'hygiene') && moduleAutorise(db, uid, 'hygiene') ? <SuiteHygiene /> : null}
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

// 0.38.0-alpha.1 : le coffre de l'appareil s'ouvre avant l'application (base et secrets déchiffrés en mémoire)
ReactDOM.createRoot(document.getElementById('root')).render(<OngletPorte><CoffrePorte><Boundary><App /></Boundary></CoffrePorte></OngletPorte>); // un seul onglet actif (0.38.0-alpha.3)
