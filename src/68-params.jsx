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
      <SnapTable title="Intrants en stock" rows={snap.intrants} cols={[{ h: 'Produit', r: (i) => i.produit }, { h: 'N° lot fournisseur', r: (i) => <span className="num">{i.numLot}</span> }, { h: 'DDM', r: (i) => fmtDate(i.dluo) }, { h: 'Restant', cls: 'r', r: (i) => <span className="num">{fmt(i.restant, 2)} {i.unite}</span> }]} />
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
  const anterieure = isoOK(nf.fin) && db.campagnes.length > 0 && db.campagnes.every((c) => nf.fin < c.debut); // 0.34.0-alpha.1 : démarre vide
  const snap = vc ? (vc.figee ? (phase === 'ouverture' ? vc.ouverture : vc.snapshot) : snapshotAt(db, phase === 'ouverture' ? addDays(vc.debut, -1) : vc.fin)) : null;
  return (
    <div>
      <Sec title="Campagnes viticoles"><Tbl rows={db.campagnes} cols={[
        { h: 'Campagne', r: (c) => <span><b>{c.nom}</b>{c.id === camp.id ? <Chip tone="info" className="ml-2">active</Chip> : null}{c.anterieure ? <Chip className="ml-2" title="Créée avant les campagnes existantes : elle montre seulement ses propres lots et volumes">antérieure</Chip> : null}</span> }, { h: 'Période', r: (c) => <span className="num">{fmtDate(c.debut)} → {fmtDate(c.fin)}</span> },
        { h: 'Statut', r: (c) => (c.figee ? <Chip tone="bad">🔒 Figée le {fmtDate(c.figeLe)}</Chip> : <Chip tone="ok">Ouverte</Chip>) }, { h: 'Opérations', cls: 'r', r: (c) => <span className="num">{db.ops.filter((o) => o.date >= c.debut && o.date <= c.fin).length}</span> },
        { h: 'Stocks', r: (c) => <Btn size="sm" onClick={() => { setView(c.id); setPhase('ouverture'); }}>{c.figee ? 'Photo figée' : 'Voir (direct)'}</Btn> },
        { h: '', r: (c) => <div className="flex flex-wrap gap-1"><Btn size="sm" kind={c.figee ? undefined : 'primary'} onClick={() => toggle(c)}>{c.figee ? 'Rouvrir la campagne' : 'Figer la campagne'}</Btn>{c.id !== camp.id ? <Btn size="sm" onClick={() => act((d) => { d.settings.campagneActive = c.id; return okr(); })}>Rendre active</Btn> : null}</div> }]} />
        <p className="help mt-2">Figer verrouille les opérations, arrivages, analyses et entrées d’hygiène de la période et conserve une photo des stocks. Rouvrir est possible à tout moment (dans l’ordre inverse des campagnes).</p></Sec>
      {vc ? <Sec title={`Stocks — campagne ${vc.nom}`} right={<><SubNav value={phase} onChange={setPhase} items={[{ id: 'ouverture', label: `Ouverture (${fmtDate(addDays(vc.debut, -1))})` }, { id: 'cloture', label: `Clôture (${fmtDate(vc.fin)})` }]} /><Btn size="sm" onClick={() => setView(null)}>Fermer</Btn></>}><SnapshotView snap={snap} live={!vc.figee} /></Sec> : null}
      <Sec title="Créer une campagne"><div className="card p-3"><div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}><Field label="Nom"><TI value={nf.nom} onChange={(v) => setNf({ ...nf, nom: v })} /></Field><Field label="Début"><DI value={nf.debut} onChange={(v) => setNf({ ...nf, debut: v })} /></Field><Field label="Fin"><DI value={nf.fin} onChange={(v) => setNf({ ...nf, fin: v })} /></Field><div className="flex items-end"><Btn kind="primary" onClick={() => act((d) => campCreate(d, nf.nom, nf.debut, nf.fin), anterieure ? `Campagne ${nf.nom} créée : antérieure aux campagnes existantes, elle démarre vide (aucun lot ni volume en cuve).` : `Campagne ${nf.nom} créée.`)}>＋ Créer la campagne</Btn></div></div>
        {anterieure ? <div className="mt-3" data-camp-anterieure=""><Notice tone="info" title="Campagne antérieure aux campagnes existantes">Elle démarre complètement vide : aucun lot ni volume en cuve. Seules les opérations que vous y saisirez apparaîtront ; les lots, volumes et opérations des campagnes suivantes ne changent pas.</Notice></div> : null}</div></Sec>
    </div>
  );
}

// 0.47.0-alpha.1 : hiérarchie de chaque appellation (proposée d'après le nom et la région, à confirmer ou à changer)
function AppEchellesSec() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('params'); const A = db.lists.appellations || [];
  if (!A.length) return null;
  return (<div className="mt-3 border-t border-line pt-3" data-app-echelles="">
    <div className="lbl">Hiérarchie de chaque appellation</div>
    <ul className="space-y-2">{A.map((a) => { const e = appellationEchelle(db, a.id) || {}; const h = e.hierarchie || {};
      return (<li key={a.id} className="flex flex-wrap items-center gap-2 text-sm" data-app-echelle={a.id}>
        <b className="min-w-0" translate="no">{a.label}</b>
        <select className="inp" style={{ width: 'auto' }} value={e.id || ''} disabled={lect} aria-label={`Hiérarchie de ${a.label}`} onChange={(ev) => act((d) => appellationEchelleSet(d, a.id, ev.target.value, uid), 'Hiérarchie enregistrée.')}>{ECHELLE_HIERARCHIES.map((x) => <option key={x.id} value={x.id}>{x.nom}</option>)}</select>
        {e.confirmee ? <Chip tone="ok">confirmée</Chip> : <><Chip tone="warn">proposée</Chip>{lect ? null : <Btn size="sm" onClick={() => act((d) => appellationEchelleSet(d, a.id, e.id, uid), 'Hiérarchie confirmée.')} data-app-echelle-confirmer={a.id}>✓ Confirmer</Btn>}</>}
        {h.aVerifier ? <Chip title="Repère réglementaire à vérifier pour votre appellation">à vérifier</Chip> : null}
        <span className="w-full text-xs text-ink2">{(h.items || []).map((i) => i.label).join(' < ')}</span>
      </li>); })}</ul>
  </div>);
}
// 0.46.0-alpha.2 : ajout d'une appellation depuis le référentiel (France, UE, Suisse, États-Unis, Australie), la région du profil d'abord
function AppRefAjout() {
  const { db, act } = useApp(); const lect = useLectureSeule('params'); const [q, setQ] = useState(''); const region = profilViticole(db).region;
  const R = useMemo(() => appChercher(q, { region, limite: 25 }), [q, region]);
  const pris = new Set((db.lists.appellations || []).map((x) => norm(x.label)));
  if (lect) return null;
  return (<div className="mt-3 border-t border-line pt-3" data-appref="">
    <label className="lbl" htmlFor="appref-q">Ajouter depuis le référentiel officiel</label>
    <input id="appref-q" className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex. Chablis, Rioja, Napa…" aria-label="Chercher une appellation" />
    {q.trim() ? <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto" data-appref-resultats="">{R.length ? R.map((a) => <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm">
      <span translate="no"><b>{a.nom}</b></span><span className="text-xs text-ink2" translate="no">{[a.signe, a.sousRegion, (PROFIL_REGIONS.find((x) => x.id === a.region) || {}).nom].filter(Boolean).join(' · ')}</span>{a.etat ? <Chip tone="warn">{APP_ETATS[a.etat] || a.etat}</Chip> : null}
      <span className="ml-auto" />{pris.has(norm(a.nom)) ? <Chip tone="ok">déjà dans la liste</Chip> : <Btn size="sm" onClick={() => act((d) => appellationDepuisRef(d, a.id), 'Appellation ajoutée.')} data-appref-ajouter={a.id}>＋ Ajouter</Btn>}</li>) : <li className="help">Aucune appellation trouvée.</li>}</ul> : <p className="help mt-1">{`${appRef().length} appellations : France (AOP, IGP), Italie, Espagne, Portugal, Allemagne, Autriche, Suisse, États-Unis, Australie — relevé officiel du 27/11/2026.`}</p>}
  </div>);
}
function ListCard({ meta, q, replie, onBasculer }) {
  const { db, act } = useApp(); const [nv, setNv] = useState(''); const [ed, setEd] = useState(null); const tous = db.lists[meta.key] || []; const items = q ? tous.filter((it) => norm(it.label).includes(q) || norm(meta.title).includes(q)) : tous;
  const add = () => { const r = act((d) => listAdd(d, meta.key, nv), 'Élément ajouté.'); if (r.ok) setNv(''); };
  const ren = () => { const r = act((d) => listRename(d, meta.key, ed.id, ed.label), 'Élément renommé.'); if (r.ok) setEd(null); };
  return (
    <div className="card p-3" data-liste-section={meta.key}><h4 className="text-lg font-semibold"><ListeTete titre={meta.title} n={tous.length} replie={replie} onBasculer={onBasculer} id={meta.key} /></h4>
      {replie ? null : <>
      <ul className="mt-2 space-y-1">{items.map((it) => { const n = listUsage(db, meta.key, it.id); return (
        <li key={it.id} className="flex items-center gap-2">{ed && ed.id === it.id ? <><TI value={ed.label} onChange={(v) => setEd({ ...ed, label: v })} autoFocus onKeyDown={(e) => { if (e.key === 'Enter') ren(); if (e.key === 'Escape') setEd(null); }} /><Btn size="sm" kind="primary" onClick={ren}>OK</Btn><Btn size="sm" onClick={() => setEd(null)}>✕</Btn></>
          : <><span className="min-w-0 flex-1 truncate">{it.label}</span>{n ? <Chip title="Nombre d’utilisations">{n}×</Chip> : null}<Btn size="sm" kind="ghost" onClick={() => setEd({ id: it.id, label: it.label })}>Renommer</Btn><Btn size="sm" kind="ghost" disabled={n > 0} title={n > 0 ? 'Utilisé : renommez plutôt que supprimer' : 'Supprimer'} onClick={() => act((d) => listRemove(d, meta.key, it.id), 'Élément supprimé.')}>Supprimer</Btn></>}</li>); })}</ul>
      <div className="mt-3 flex gap-2"><TI value={nv} onChange={setNv} placeholder="Nouvel élément…" onKeyDown={(e) => { if (e.key === 'Enter') add(); }} aria-label={`Ajouter à ${meta.title}`} /><Btn onClick={add}>Ajouter</Btn></div>
      {meta.key === 'appellations' ? <><AppEchellesSec /><AppRefAjout /></> : null}
      </>}
    </div>
  );
}
/* 0.48.0-alpha.1 : recherche dans toutes les listes et repli liste par liste (souvenir sur cet appareil : oenotrack-listes-replis, jamais
   dans la base) ; une recherche déplie les listes qui contiennent le texte et masque les autres. */
const LISTES_REPLIS_KEY = 'oenotrack-listes-replis';
const listesReplisLire = () => { try { const v = JSON.parse(window.localStorage.getItem(LISTES_REPLIS_KEY) || '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []; } catch (e) { return []; } };
const listesReplisEcrire = (L) => { try { window.localStorage.setItem(LISTES_REPLIS_KEY, JSON.stringify(L)); } catch (e) { /* ignoré */ } };
function ListeTete({ id, titre, n, replie, onBasculer }) {
  return (<button type="button" className="liste-tete" aria-expanded={!replie} onClick={onBasculer} data-liste-basculer={id}><span className="liste-fleche" aria-hidden="true">{replie ? '▸' : '▾'}</span><span>{titre}</span>{n != null ? <span className="chip">{n}</span> : null}</button>);
}
function ListeSection({ id, titre, n, replie, onBasculer, children, ...p }) {
  return (<div className="card mb-4 p-4" data-liste-section={id} {...p}><h3 className="text-lg font-semibold"><ListeTete id={id} titre={titre} n={n} replie={replie} onBasculer={onBasculer} /></h3>{replie ? null : <div className="mt-2">{children}</div>}</div>);
}
function ListesView() {
  const { db } = useApp(); const [q0, setQ] = useState(''); const q = norm(q0.trim()); const [replis, setReplis] = useState(listesReplisLire);
  const sections = useMemo(() => [
    { id: 'qualifs', titre: 'Revendications', labels: qualifList(db).map((x) => x.label) },
    { id: 'vin', titre: 'Stades, mélanges et couleurs du vin', labels: [...stadeList(db), ...couleurList(db)].map((x) => x.label) },
    { id: 'fractions', titre: 'Fractions de moût', labels: (db.lists.fractions || []).map((x) => x.label) },
    ...LIST_META.map((m) => ({ id: m.key, titre: m.title, meta: m, labels: (db.lists[m.key] || []).map((x) => x.label) })),
  ], [db]);
  const trouve = (x) => !q || norm(x.titre).includes(q) || x.labels.some((l) => norm(l).includes(q));
  const replie = (id) => !q && replis.includes(id);
  const basculer = (id) => { const L = replis.includes(id) ? replis.filter((x) => x !== id) : [...replis, id]; setReplis(L); listesReplisEcrire(L); };
  const tous = (r) => { const L = r ? sections.map((x) => x.id) : []; setReplis(L); listesReplisEcrire(L); };
  const S = Object.fromEntries(sections.map((x) => [x.id, x])); const vis = sections.filter(trouve);
  const sec = (id, children, p) => (trouve(S[id]) ? <ListeSection id={id} titre={S[id].titre} n={S[id].labels.length} replie={replie(id)} onBasculer={() => basculer(id)} {...p}>{children}</ListeSection> : null);
  return (<div>
    <p className="mb-3 text-sm text-ink2">Ces listes alimentent les formulaires. Un élément déjà utilisé peut être renommé ou masqué (l’historique suit) mais pas supprimé.</p>
    <div className="liste-outils mb-4 flex flex-wrap items-center gap-2" data-listes-outils="">
      <input className="inp" style={{ width: 'auto', flex: '1 1 240px' }} value={q0} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un élément ou une liste…" aria-label="Rechercher dans les listes" data-listes-recherche="" />
      {q ? <Btn size="sm" kind="ghost" onClick={() => setQ('')}>Effacer</Btn> : <><Btn size="sm" onClick={() => tous(true)} data-listes-replier="">Tout replier</Btn><Btn size="sm" onClick={() => tous(false)} data-listes-deplier="">Tout déplier</Btn></>}
    </div>
    {q && !vis.length ? <Empty>Aucune liste ne contient ce texte.</Empty> : null}
    {sec('qualifs', <QualifsEditor />, { 'data-qualifs-editor': '' })}
    {sec('vin', <VinListesView />)}
    {sec('fractions', <FractionsEditor />)}
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))' }}>{LIST_META.filter((m) => trouve(S[m.key])).map((m) => <ListCard key={m.key} meta={m} q={norm(S[m.key].titre).includes(q) ? '' : q} replie={replie(m.key)} onBasculer={() => basculer(m.key)} />)}</div>
  </div>);
}

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
      <ConfigurationGuideeCard />
      <Sec title="Données"><div className="card space-y-2 p-4">
        <dl className="kv"><dt>Enregistrement automatique</dt><dd>{storeOK ? <Chip tone="ok">actif (dans ce navigateur)</Chip> : <Chip tone="bad">indisponible</Chip>}</dd><dt>Dernière sauvegarde</dt><dd>{derniereSauvegarde(db) ? `${fmtDate(derniereSauvegarde(db))} (${ilYa(derniereSauvegarde(db))})` : <span className="text-warn">jamais</span>}</dd><dt>Taille de la base</dt><dd className="num">{kb} Ko (+ {fmtSize(sum(db.docs || [], (d) => d.taille))} de documents)</dd><dt>Version</dt><dd>Œnotrack {APP_VERSION} · base créée avec {versionAffichee(db.meta.creeAvec) || '—'}</dd></dl>
        <div className="flex flex-wrap items-center gap-2"><Btn kind="primary" onClick={() => setTab('params', 'sauvegarde')}>💾 Sauvegarde, import et Drive…</Btn><span className="help">Export / import de la base complète (documents compris), Google Drive, OneDrive, Dropbox, iCloud, sauvegarde en ligne.</span></div>
      </div></Sec>
      <Sec title="Langue de l’interface"><div className="card p-4" data-langue-params=""><LangueChoix /><p className="help mt-2">Réglage de cet appareil (chaque personne choisit la sienne). Français, English, Español, Italiano, Deutsch, Português : la traduction se fait par étapes ; ce qui n’est pas encore traduit reste en français. Les données saisies et les registres exportés ne sont pas traduits.</p></div></Sec>
      <InstallerCard />
      <Sec title="Charte graphique"><ChartePicker /></Sec>
      <Sec title="Mode d’affichage"><ModePicker /></Sec>
    </div>
  );
}
// Paramètres › Calculs œnologiques (0.39.0-alpha.1 : séparés de « Données & paramètres ») : tirage, enrichissement, fermentation
function CalculsView() {
  const { db, setTab, uid } = useApp();
  return (
    <div className="space-y-6" data-params-calculs="">
      <Sec title="Paramètres de calcul" right={moduleActif(db, 'tirage') && moduleAutorise(db, uid, 'tirage') ? <Btn size="sm" kind="ghost" onClick={() => setTab('tirage')}>🍾 Onglet Tirages</Btn> : null}><div className="card p-4"><div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <Setting label="Sucre : g/L par point de densité" k="coefSucre" defaut={COEF_SUCRE_DEFAUT} help="Un seul coefficient : sucre de la mixtion = (densité mixtion − densité base) × 1000 × ce coefficient ; la correction du point de tirage en déduit les points de densité par g/L (1 ÷ coefficient). 2,5 par défaut (0,4 point par g/L), à vérifier." /><Setting label="Volume d’une bouteille (L)" k="volBouteilleL" /></div></div></Sec>
      <Sec title="Tirage : levain, liqueur et calculateur"><TirageProfilCard /></Sec>
      <Sec title="Enrichissement des moûts (saccharose, MCR)"><div className="card p-4"><div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <Setting label="TAV visé après enrichissement (% vol)" k="chaptalTAV" defaut={10.5} help="Valeur proposée par défaut (10,5) ; modifiable sur chaque fiche de cuve." />
        <Setting label="Sucre à ajouter pour +1 % vol, enrichissement (g/L)" k="chaptalCoef" defaut={17} help="Rendement pratique d’un enrichissement : environ 17 g/L pour 1 % vol (vins blancs), 18 g/L (vins rouges)." />
        <Setting label="Conversion sucres → TAP (g/L par % vol)" k="sucresTapCoef" defaut={16.83} help="Titre alcoométrique volumique en puissance déduit des sucres analysés : 16,83 g/L par % vol (convention réglementaire, à vérifier)." />
        <Setting label="Enrichissement maximal (% vol)" k="chaptalMax" defaut={2} zero help="Avertissement au-delà ; 0 = pas de contrôle. À adapter à la réglementation de la campagne." /></div>
        <p className="help mt-2">Le calcul part de la moyenne pondérée des analyses saisies à l’entrée des moûts (TAP, ou sucres en g/L) : sucre à ajouter = (TAV visé − TAP) × g/L par % vol × volume ; augmentation de volume du saccharose : valeur physique du profil de tirage ci-dessus (0,6329 L/kg). <span>Simulateur (sucre ou MCR) : bouton « 🧪 Calculs » des fiches de cuve et de lot.</span></p></div></Sec>
      <FermReglagesCard />
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
  const items = [{ id: 'registres', label: 'Registres (CSV / Excel)' }, { id: 'bilan', label: 'Bilan matière' }, { id: 'drm', label: '📮 DRM (douane)' }];
  const [sub, setSub] = useSousOnglet(items, 'registres');
  return (<div><SubNav value={sub} onChange={setSub} items={items} />{sub === 'bilan' ? <BilanView /> : sub === 'drm' ? <DrmView /> : <RegistresView />}</div>);
}
TABS_REG.registres = TabRegistres;
// Module « Paramètres » : toujours actif (c'est là qu'on réactive les modules)
/* 0.39.0-alpha.1 : rubriques regroupées (menu latéral sur ordinateur, rangées sur téléphone). Les réglages métier qui ont leur place
   ailleurs y sont déplacés (PARAMS_DEPLACES) : le lien de Paramètres y mène, et le réglage s'affiche ici si le module d'arrivée est
   désactivé ou interdit (rien n'est perdu). Les identifiants de rubriques sont inchangés : setTab('params', 'operations') marche toujours. */
/* 0.48.0-alpha.1 : une icône par rubrique ; groupe « Réglages des modules » (dernier sous-onglet « ⚙ Réglages » de chaque module, ouvert dans
   son onglet, ↗) à la place des trois rubriques qui faisaient sortir de Paramètres ; au téléphone, liste simple des rubriques puis la rubrique
   choisie (« ‹ Rubriques » pour revenir). Identifiants inchangés : setTab('params', 'operations' | 'schemas' | 'jaugeage') marche toujours. */
const PARAMS_ITEMS = [{ id: 'entreprise', label: '🏢 Société & opérateurs' }, { id: 'codification', label: '🏷 Codification des lots' }, { id: 'utilisateurs', label: '🔐 Utilisateurs & droits' }, { id: 'modules', label: '🧩 Modules' }, { id: 'profil', label: '🍇 Région & types de vins' }, { id: 'sauvegarde', label: '💾 Sauvegarde & Drive' }, { id: 'garde', label: '🛡 Sécurité des importations' }, { id: 'campagnes', label: '📅 Campagnes' }, { id: 'sites', label: '📍 Sites' }, { id: 'contenants', label: '🎨 Contenants & couleurs' }, { id: 'jaugeage', label: '📏 Barèmes de jaugeage' }, { id: 'crus', label: '🗺 Crus & parcelles' }, { id: 'apporteurs', label: '🤝 Partenaires' }, { id: 'operations', label: '⚙ Opérations' }, { id: 'schemas', label: '🗂 Plan de vinification' }, { id: 'listes', label: '📋 Revendications, stades & listes' }, { id: 'calculs', label: '🧪 Calculs œnologiques' }, { id: 'ia', label: '🤖 Assistant IA' }, { id: 'base', label: '🖥 Affichage & application' },
  { id: 'reglages-pressoir', label: '🍇 Pressoir', module: true }, { id: 'reglages-analyses', label: '🔬 Analyses', module: true }, { id: 'reglages-hygiene', label: '🧽 Hygiène', module: true }, { id: 'reglages-equipements', label: '🛠 Équipements', module: true }];
const PARAMS_GROUPES = [
  { id: 'exploitation', label: 'Exploitation', items: ['entreprise', 'sites', 'apporteurs', 'crus', 'campagnes'] },
  { id: 'vin', label: 'Vin & cuverie', items: ['profil', 'listes', 'codification', 'contenants', 'calculs'] },
  { id: 'equipe', label: 'Équipe & sécurité', items: ['utilisateurs', 'garde', 'ia'] },
  { id: 'donnees', label: 'Données & application', items: ['sauvegarde', 'modules', 'base'] },
  { id: 'modules-reglages', label: 'Réglages des modules', items: ['operations', 'schemas', 'jaugeage', 'reglages-pressoir', 'reglages-analyses', 'reglages-hygiene', 'reglages-equipements'] },
];
// réglages rangés dans l'onglet d'un module (module, sous-onglet) ; `module` : sans vue de repli dans Paramètres (proposé seulement si le module est affiché)
const PARAMS_DEPLACES = { operations: { tab: 'ops', sub: 'catalogue', ou: 'Vinification › Opérations & Assemblages' }, schemas: { tab: 'plan', sub: 'plan', ou: 'Vinification › Plan de vinification' }, jaugeage: { tab: 'cuverie', sub: 'jaugeage', ou: 'Vinification › Cuverie & Lots' },
  'reglages-pressoir': { tab: 'pressoir', sub: 'reglages', ou: 'Pressoir › ⚙ Réglages', module: true }, 'reglages-analyses': { tab: 'analyses', sub: 'modeles', ou: 'Analyses › ⚙ Réglages', module: true },
  'reglages-hygiene': { tab: 'hygiene', sub: 'listes', ou: 'Hygiène › ⚙ Réglages', module: true }, 'reglages-equipements': { tab: 'equipements', sub: 'listes', ou: 'Équipements › ⚙ Réglages', module: true } };
const paramsDeplaceOk = (db, uid, id) => { const v = PARAMS_DEPLACES[id]; return !!v && moduleActif(db, v.tab) && moduleAutorise(db, uid, v.tab); };
// consultation seulement (droits des paramètres en lecture) : rappel en tête des réglages déplacés dans un autre onglet
function ParamsLecture() {
  const { db, uid, secu } = useApp(); if (!secu || niveauModule(db, uid, 'params') !== 'lecture') return null;
  return <div className="mb-4"><Notice tone="info" title="Consultation des paramètres">Votre profil « {profilNom(db, uid)} » permet de consulter ces réglages, pas de les modifier.</Notice></div>;
}
const PARAMS_VUES = { codification: CodificationView, utilisateurs: UtilisateursView, modules: ModulesView, profil: ProfilViticoleView, sauvegarde: SauvegardeView, garde: GardeView, campagnes: CampagnesView, listes: ListesView, operations: OperationsView, schemas: PlanVinifVue, crus: CrusEtParcelles, apporteurs: ApporteursView, sites: SitesView, contenants: StudioView, jaugeage: BaremesView, base: BaseView, calculs: CalculsView, ia: IaView, entreprise: EntrepriseView };
function TabParams() {
  const { db, uid, secu, setTab, nav } = useApp();
  // identifiants activés : paramètres selon le profil (sauvegarde et utilisateurs : droits particuliers ; « Utilisateurs & droits » montre au moins son compte)
  const niv = secu ? niveauModule(db, uid, 'params') : 'ecriture';
  const items = PARAMS_ITEMS.filter((i) => (i.module ? paramsDeplaceOk(db, uid, i.id) : (!secu || i.id === 'utilisateurs' || i.id === 'ia' || i.id === 'garde' || (i.id === 'sauvegarde' ? peut(db, uid, 'sauvegarde') : niv !== 'aucun')))); // assistant IA : réglage personnel, sur l'appareil
  const [sub, setSub] = useSousOnglet(items.filter((i) => !i.module), items[0].id);
  // téléphone : la liste des rubriques d'abord (nouvel accès à Paramètres), puis la rubrique choisie ; un lien vers une rubrique l'ouvre directement
  const [liste, setListe] = useState(!(nav && nav.sub)); useEffect(() => { setListe(!(nav && nav.sub)); }, [nav]);
  const lectureP = secu && niv === 'lecture' && !['utilisateurs', 'sauvegarde', 'ia', 'garde'].includes(sub);
  const choisir = (id) => { if (paramsDeplaceOk(db, uid, id)) setTab(PARAMS_DEPLACES[id].tab, PARAMS_DEPLACES[id].sub); else { setSub(id); setListe(false); } };
  const groupes = PARAMS_GROUPES.map((g) => ({ ...g, L: g.items.map((id) => items.find((x) => x.id === id)).filter(Boolean) })).filter((g) => g.L.length);
  const V = PARAMS_VUES[sub] || EntrepriseView; const dep = PARAMS_DEPLACES[sub]; const cour = items.find((i) => i.id === sub);
  return (
    <div className={cx('md:flex md:items-start md:gap-5', liste ? 'params-tel-liste' : 'params-tel-rubrique')} data-params="" data-params-vue-tel={liste ? 'liste' : 'rubrique'}>
      <nav className="params-menu no-print mb-4 space-y-3 md:mb-0 md:w-60 md:shrink-0 md:space-y-2" aria-label="Rubriques des paramètres" data-params-menu="">
        {groupes.map((g) => (
          <div key={g.id} data-params-groupe={g.id}>
            <div className="lbl mb-1">{g.label}</div>
            <div className="params-menu-liste flex flex-col gap-1" role="tablist" aria-label={g.label}>
              {g.L.map((it) => { const ail = paramsDeplaceOk(db, uid, it.id); return (
                <button key={it.id} type="button" role="tab" aria-selected={sub === it.id} onClick={() => choisir(it.id)} data-params-item={it.id} title={ail ? `Réglage rangé dans ${PARAMS_DEPLACES[it.id].ou}` : undefined}
                  className={cx('btn w-full justify-start text-left', sub === it.id && 'btn-primary')}>{it.label}{ail ? <span className="ml-auto pl-1 text-xs opacity-70" aria-hidden="true">↗</span> : null}</button>); })}
            </div>
          </div>))}
      </nav>
      <div className="params-contenu min-w-0 flex-1" data-params-rubrique={sub}>
        <div className="params-retour no-print mb-3 flex items-center gap-2 md:hidden"><Btn size="sm" onClick={() => { setListe(true); window.scrollTo({ top: 0 }); }} data-params-retour="">‹ Rubriques</Btn><b className="min-w-0 truncate">{cour ? cour.label : ''}</b></div>
        {lectureP ? <div className="mb-4"><Notice tone="info" title="Consultation des paramètres">Votre profil « {profilNom(db, uid)} » permet de consulter les paramètres, pas de les modifier.</Notice></div> : null}
        {dep ? <div className="mb-4"><Notice tone="info" title={`Réglage rangé dans ${dep.ou}`}>Il s’affiche ici parce que ce module est désactivé ou non accessible avec votre profil.</Notice></div> : null}
        <V />
      </div>
    </div>
  );
}
TABS_REG.params = TabParams;
