/* ============ REGISTRES & PARAMÈTRES : campagnes, listes, données ============ */
function SnapTable({ title, rows, cols }) {
  return (<details className="card p-3" open={rows.length > 0 && rows.length <= 25}><summary>{title} <span className="chip">{rows.length}</span></summary><div className="mt-2"><Tbl rows={rows.map((r, i) => ({ ...r, id: i }))} cols={cols} empty="Rien à cette date." /></div></details>);
}
function SnapshotView({ snap, live }) {
  if (!snap) return <Empty>Aucune photo disponible.</Empty>;
  return (
    <div className="space-y-3">
      <Notice tone={live ? 'warn' : 'info'} title={live ? 'Calcul en direct (campagne non figée)' : `Photo figée le ${fmtDate(snap.creeLe)}`}>Situation au {fmtDate(snap.date)} : <b>{fmtL(snap.totalL)}</b> de vin en contenants · <b>{fmt(snap.totalBouteilles)}</b> bouteilles sur lattes.</Notice>
      <SnapTable title="Vin en contenants" rows={snap.portions} cols={[{ h: 'Contenant', r: (p) => p.contenant }, { h: 'Lot', r: (p) => <b>{p.code}</b> }, { h: 'Revendication', r: (p) => (p.qualif ? <QChip id={p.qualif} /> : '—') }, { h: 'Volume', cls: 'r', r: (p) => <span className="num">{fmtL(p.volL)}</span> }]} />
      <SnapTable title="Bouteilles sur lattes" rows={snap.bouteilles} cols={[{ h: 'Lot de tirage', r: (b) => <b>{b.code}</b> }, { h: 'Bouteilles', cls: 'r', r: (b) => <span className="num">{fmt(b.nb)}</span> }]} />
      <SnapTable title="Préparations" rows={snap.preparations} cols={[{ h: 'Code', r: (p) => <b>{p.code}</b> }, { h: 'Type', r: (p) => PREP_TYPES[p.type] }, { h: 'Revendication', r: (p) => <QChip id={p.qualif} /> }, { h: 'Reste', cls: 'r', r: (p) => <span className="num">{fmtL(p.restantL)}</span> }]} />
      <SnapTable title="Intrants en stock" rows={snap.intrants} cols={[{ h: 'Produit', r: (i) => i.produit }, { h: 'N° lot fournisseur', r: (i) => <span className="num">{i.numLot}</span> }, { h: 'DLUO', r: (i) => fmtDate(i.dluo) }, { h: 'Restant', cls: 'r', r: (i) => <span className="num">{fmt(i.restant, 2)} {i.unite}</span> }]} />
    </div>
  );
}

function CampagnesView() {
  const { db, act, confirm, camp } = useApp(); const last = db.campagnes[db.campagnes.length - 1]; const y = yearOf(addDays(last.fin, 1));
  const [nf, setNf] = useState({ nom: `${y}-${y + 1}`, debut: addDays(last.fin, 1), fin: `${y + 1}-07-31` }); const [view, setView] = useState(null); const [phase, setPhase] = useState('ouverture');
  const toggle = async (c) => {
    if (c.figee) { if (await confirm({ title: `Rouvrir la campagne ${c.nom} ?`, body: 'Les opérations, arrivages, analyses et entrées d’hygiène de la période redeviennent modifiables ; la photo des stocks est supprimée.', ok: 'Rouvrir' })) act((d) => campReopen(d, c.id), `Campagne ${c.nom} rouverte.`); }
    else if (await confirm({ title: `Figer la campagne ${c.nom} ?`, body: `Les opérations du ${fmtDate(c.debut)} au ${fmtDate(c.fin)} ne pourront plus être modifiées ni supprimées. Une photo des stocks d’ouverture et de clôture est conservée.`, ok: 'Figer la campagne' })) act((d) => campFreeze(d, c.id), `Campagne ${c.nom} figée.`);
  };
  const vc = view && db.campagnes.find((c) => c.id === view);
  const snap = vc ? (vc.figee ? (phase === 'ouverture' ? vc.ouverture : vc.snapshot) : snapshotAt(db, phase === 'ouverture' ? addDays(vc.debut, -1) : vc.fin)) : null;
  return (
    <div>
      <Sec title="Campagnes viticoles"><Tbl rows={db.campagnes} cols={[
        { h: 'Campagne', r: (c) => <span><b>{c.nom}</b>{c.id === camp.id ? <Chip tone="info" className="ml-2">active</Chip> : null}</span> }, { h: 'Période', r: (c) => <span className="num">{fmtDate(c.debut)} → {fmtDate(c.fin)}</span> },
        { h: 'Statut', r: (c) => (c.figee ? <Chip tone="bad">🔒 Figée le {fmtDate(c.figeLe)}</Chip> : <Chip tone="ok">Ouverte</Chip>) }, { h: 'Opérations', cls: 'r', r: (c) => <span className="num">{db.ops.filter((o) => o.date >= c.debut && o.date <= c.fin).length}</span> },
        { h: 'Stocks', r: (c) => <Btn size="sm" onClick={() => { setView(c.id); setPhase('ouverture'); }}>{c.figee ? 'Photo figée' : 'Voir (direct)'}</Btn> },
        { h: '', r: (c) => <div className="flex flex-wrap gap-1"><Btn size="sm" kind={c.figee ? undefined : 'primary'} onClick={() => toggle(c)}>{c.figee ? 'Rouvrir la campagne' : 'Figer la campagne'}</Btn>{c.id !== camp.id ? <Btn size="sm" onClick={() => act((d) => { d.settings.campagneActive = c.id; return okr(); })}>Rendre active</Btn> : null}</div> }]} />
        <p className="help mt-2">Figer verrouille les opérations, arrivages, analyses et entrées d’hygiène de la période et conserve une photo des stocks. Rouvrir est possible à tout moment (dans l’ordre inverse des campagnes).</p></Sec>
      {vc ? <Sec title={`Stocks — campagne ${vc.nom}`} right={<><SubNav value={phase} onChange={setPhase} items={[{ id: 'ouverture', label: `Ouverture (${fmtDate(addDays(vc.debut, -1))})` }, { id: 'cloture', label: `Clôture (${fmtDate(vc.fin)})` }]} /><Btn size="sm" onClick={() => setView(null)}>Fermer</Btn></>}><SnapshotView snap={snap} live={!vc.figee} /></Sec> : null}
      <Sec title="Créer une campagne"><div className="card p-3"><div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}><Field label="Nom"><TI value={nf.nom} onChange={(v) => setNf({ ...nf, nom: v })} /></Field><Field label="Début"><DI value={nf.debut} onChange={(v) => setNf({ ...nf, debut: v })} /></Field><Field label="Fin"><DI value={nf.fin} onChange={(v) => setNf({ ...nf, fin: v })} /></Field><div className="flex items-end"><Btn kind="primary" onClick={() => act((d) => campCreate(d, nf.nom, nf.debut, nf.fin), `Campagne ${nf.nom} créée.`)}>+ Créer la campagne</Btn></div></div></div></Sec>
    </div>
  );
}

function ListCard({ meta }) {
  const { db, act } = useApp(); const [nv, setNv] = useState(''); const [ed, setEd] = useState(null); const items = db.lists[meta.key] || [];
  const add = () => { const r = act((d) => listAdd(d, meta.key, nv), 'Élément ajouté.'); if (r.ok) setNv(''); };
  const ren = () => { const r = act((d) => listRename(d, meta.key, ed.id, ed.label), 'Élément renommé.'); if (r.ok) setEd(null); };
  return (
    <div className="card p-3"><h4 className="mb-2 text-lg font-semibold">{meta.title}</h4>
      <ul className="space-y-1">{items.map((it) => { const n = listUsage(db, meta.key, it.id); return (
        <li key={it.id} className="flex items-center gap-2">{ed && ed.id === it.id ? <><TI value={ed.label} onChange={(v) => setEd({ ...ed, label: v })} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') ren(); if (e.key === 'Escape') setEd(null); }} /><Btn size="sm" kind="primary" onClick={ren}>OK</Btn><Btn size="sm" onClick={() => setEd(null)}>✕</Btn></>
          : <><span className="min-w-0 flex-1 truncate">{it.label}</span>{n ? <Chip title="Nombre d’utilisations">{n}×</Chip> : null}<Btn size="sm" kind="ghost" onClick={() => setEd({ id: it.id, label: it.label })}>Renommer</Btn><Btn size="sm" kind="ghost" disabled={n > 0} title={n > 0 ? 'Utilisé : renommez plutôt que supprimer' : 'Supprimer'} onClick={() => act((d) => listRemove(d, meta.key, it.id), 'Élément supprimé.')}>Supprimer</Btn></>}</li>); })}</ul>
      <div className="mt-3 flex gap-2"><TI value={nv} onChange={setNv} placeholder="Nouvel élément…" onKeyDown={(e) => { if (e.key === 'Enter') add(); }} aria-label={`Ajouter à ${meta.title}`} /><Btn onClick={add}>Ajouter</Btn></div>
    </div>
  );
}
const ListesView = () => (<div><p className="mb-3 text-sm text-ink2">Ces listes alimentent les formulaires. Un élément déjà utilisé peut être renommé ou masqué (l’historique suit) mais pas supprimé.</p><div className="card mb-4 p-4" data-qualifs-editor=""><h3 className="mb-2 text-lg font-semibold">Revendications</h3><QualifsEditor /></div><VinListesView /><div className="card mb-4 p-4"><h3 className="mb-2 text-lg font-semibold">Fractions de moût</h3><FractionsEditor /></div><div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>{LIST_META.map((m) => <ListCard key={m.key} meta={m} />)}</div></div>);

function Setting({ label, help, k, step, defaut, zero }) {
  const { db, act } = useApp(); const cur = db.settings[k] != null ? db.settings[k] : defaut; const txt = cur != null ? String(cur).replace('.', ',') : '';
  const [v, setV] = useState(txt); useEffect(() => setV(txt), [cur]);
  const commit = () => { const n = num(v); if ((n > 0 || (zero && hasNum(v) && n === 0)) && n !== cur) act((d) => { d.settings[k] = n; return okr(); }, 'Paramètre enregistré.'); else setV(txt); };
  return <Field label={label} help={help}><input className="inp num" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} /></Field>;
}
function BaseView() {
  const { db, storeOK, setTab } = useApp(); const kb = Math.round(JSON.stringify(db).length / 1024);
  return (
    <div className="space-y-6">
      <Sec title="Données"><div className="card space-y-2 p-4">
        <dl className="kv"><dt>Enregistrement automatique</dt><dd>{storeOK ? <Chip tone="ok">actif (dans ce navigateur)</Chip> : <Chip tone="bad">indisponible</Chip>}</dd><dt>Dernière sauvegarde</dt><dd>{derniereSauvegarde(db) ? `${fmtDate(derniereSauvegarde(db))} (${ilYa(derniereSauvegarde(db))})` : <span className="text-warn">jamais</span>}</dd><dt>Taille de la base</dt><dd className="num">{kb} Ko (+ {fmtSize(sum(db.docs || [], (d) => d.taille))} de documents)</dd><dt>Version</dt><dd>Œnotrack {APP_VERSION} · base créée avec {versionAffichee(db.meta.creeAvec) || '—'}</dd></dl>
        <div className="flex flex-wrap items-center gap-2"><Btn kind="primary" onClick={() => setTab('params', 'sauvegarde')}>💾 Sauvegarde, import et Drive…</Btn><span className="help">Export / import de la base complète (documents compris), Google Drive, OneDrive, Dropbox, iCloud, sauvegarde en ligne.</span></div>
      </div></Sec>
      <InstallerCard />
      <Sec title="Paramètres de calcul"><div className="card p-4"><div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <Setting label="Sucre : g/L par point de densité" k="coefSucre" help="Sucre mixtion = (densité mixtion − densité base) × 1000 × ce coefficient (≈ 2,6)." /><Setting label="Objectif de sucre au tirage (g/L)" k="objectifTirageGL" /><Setting label="Volume d’une bouteille (L)" k="volBouteilleL" /></div></div></Sec>
      <Sec title="Enrichissement des moûts (chaptalisation)"><div className="card p-4"><div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <Setting label="TAV visé après enrichissement (% vol)" k="chaptalTAV" defaut={10.5} help="Valeur proposée par défaut (10,5) ; modifiable sur chaque fiche de cuve." />
        <Setting label="Sucre pour 1 % vol (g/L)" k="chaptalCoef" defaut={17} help="Usage courant : 17 g/L pour 1 % vol (vins blancs) ; sert aussi à déduire le TAP des sucres." />
        <Setting label="Enrichissement maximal (% vol)" k="chaptalMax" defaut={2} zero help="Avertissement au-delà ; 0 = pas de contrôle. À adapter à la réglementation de la campagne." /></div>
        <p className="help mt-2">Le calcul part de la moyenne pondérée des analyses saisies à l’entrée des moûts (TAP, ou sucres en g/L) : sucre à ajouter = (TAV visé − TAP) × g/L par % vol × volume.</p></div></Sec>
      <Sec title="Charte graphique"><ChartePicker /></Sec>
      <Sec title="Mode d’affichage"><ModePicker /></Sec>
    </div>
  );
}

// sous-onglets mémorisés par module (nav.sub impose un sous-onglet, ex. lien « Sauvegarde & Drive »)
function useSousOnglet(items, defaut) {
  const { nav } = useApp(); const ok = (id) => items.some((i) => i.id === id);
  const [sub, setSub] = useState(ok(nav.sub) ? nav.sub : defaut); useEffect(() => { if (nav.sub && ok(nav.sub)) setSub(nav.sub); }, [nav]);
  return [ok(sub) ? sub : defaut, setSub];
}
// Module « Registres » : exports et bilan matière
function TabRegistres() {
  const items = [{ id: 'registres', label: 'Registres (CSV / Excel)' }, { id: 'bilan', label: 'Bilan matière' }];
  const [sub, setSub] = useSousOnglet(items, 'registres');
  return (<div><SubNav value={sub} onChange={setSub} items={items} />{sub === 'bilan' ? <BilanView /> : <RegistresView />}</div>);
}
TABS_REG.registres = TabRegistres;
// Module « Paramètres » : toujours actif (c'est là qu'on réactive les modules)
const PARAMS_ITEMS = [{ id: 'entreprise', label: 'Société & opérateurs' }, { id: 'utilisateurs', label: '🔐 Utilisateurs & droits' }, { id: 'modules', label: '🧩 Modules' }, { id: 'sauvegarde', label: '💾 Sauvegarde & Drive' }, { id: 'garde', label: '🛡 Sécurité des importations' }, { id: 'campagnes', label: 'Campagnes' }, { id: 'sites', label: 'Sites' }, { id: 'contenants', label: 'Contenants & couleurs' }, { id: 'jaugeage', label: '📏 Barèmes de jaugeage' }, { id: 'crus', label: 'Crus & parcelles' }, { id: 'apporteurs', label: 'Partenaires' }, { id: 'operations', label: '⚙ Opérations' }, { id: 'listes', label: 'Revendications, stades & listes' }, { id: 'ia', label: '🤖 Assistant IA' }, { id: 'base', label: 'Données & paramètres' }];
function TabParams() {
  const { db, uid, secu } = useApp();
  // identifiants activés : paramètres selon le profil (sauvegarde et utilisateurs : droits particuliers ; « Utilisateurs & droits » montre au moins son compte)
  const niv = secu ? niveauModule(db, uid, 'params') : 'ecriture';
  const items = PARAMS_ITEMS.filter((i) => !secu || i.id === 'utilisateurs' || i.id === 'ia' || i.id === 'garde' || (i.id === 'sauvegarde' ? peut(db, uid, 'sauvegarde') : niv !== 'aucun')); // assistant IA : réglage personnel, sur l'appareil
  const [sub, setSub] = useSousOnglet(items, items[0].id);
  const lectureP = secu && niv === 'lecture' && !['utilisateurs', 'sauvegarde', 'ia', 'garde'].includes(sub);
  return (<div><SubNav value={sub} onChange={setSub} items={items} />{lectureP ? <div className="mb-4"><Notice tone="info" title="Consultation des paramètres">Votre profil « {profilNom(db, uid)} » permet de consulter les paramètres, pas de les modifier.</Notice></div> : null}{sub === 'utilisateurs' ? <UtilisateursView /> : sub === 'modules' ? <ModulesView /> : sub === 'sauvegarde' ? <SauvegardeView /> : sub === 'garde' ? <GardeView /> : sub === 'campagnes' ? <CampagnesView /> : sub === 'listes' ? <ListesView /> : sub === 'operations' ? <OperationsView /> : sub === 'crus' ? <CrusEtParcelles /> : sub === 'apporteurs' ? <ApporteursView /> : sub === 'sites' ? <SitesView /> : sub === 'contenants' ? <StudioView /> : sub === 'jaugeage' ? <BaremesView /> : sub === 'base' ? <BaseView /> : sub === 'ia' ? <IaView /> : <EntrepriseView />}</div>);
}
TABS_REG.params = TabParams;
