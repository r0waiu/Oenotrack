/* ============ MODULES TIRAGES · CAVE · DÉGORGEMENT : des préparations et de la mixtion jusqu'au lot fini ============
   Trois onglets indépendants (chacun peut être désactivé ou déplacé dans Paramètres › Modules) qui lisent les mêmes données :
   R.preps (préparations), R.tir (bouteilles par lot de tirage), db.lotsFinis (dégorgements). */
function OpBtns({ op, onEdit }) {
  const { db, R, act, confirm } = useApp();
  if (isLocked(db, op.date)) return <Chip title="Campagne figée">🔒 figée</Chip>;
  const del = async () => { const ok = await confirm({ title: 'Supprimer cette opération ?', body: `${opNom(op)} du ${fmtDate(op.date)} — ${opSummary(db, R, op)}.`, ok: 'Supprimer', danger: true }); if (ok) act((d) => opDelete(d, op.id), 'Opération supprimée.'); };
  return <div className="flex flex-wrap gap-1"><Btn size="sm" onClick={() => onEdit(op.id)}>Modifier</Btn><Btn size="sm" kind="danger" onClick={del}>Supprimer</Btn></div>;
}

const PREPS_DEGORGEMENT = ['liqueur_exp']; // les autres préparations (levain, pied de cuve, liqueur de tirage) sont au module Tirages
const desc_ = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
// âge en mois révolus depuis une date (bouteilles sur lattes)
const moisDepuis = (d, ref) => {
  if (!d) return null; const a = new Date(`${d}T00:00:00`), b = new Date(`${ref || todayISO()}T00:00:00`);
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()); if (b.getDate() < a.getDate()) m -= 1; return Math.max(0, m);
};
const ageTxt = (m) => (m == null ? '—' : m < 1 ? 'moins d’un mois' : m < 24 ? `${m} mois` : `${Math.floor(m / 12)} ans${m % 12 ? ` ${m % 12} mois` : ''}`);
function useBouteilles() {
  const { db, R } = useApp();
  const opOf = (id) => db.ops.find((o) => o.id === id);
  return {
    opOf, prepIn: (id) => R.prepUse.filter((u) => u.prepId === id),
    preps: Object.values(R.preps).sort(desc_), tirs: Object.values(R.tir).sort(desc_),
    tirOps: db.ops.filter((o) => o.type === 'tirage').sort(desc_), finis: [...(db.lotsFinis || [])].sort(desc_),
    // continuité de la traçabilité (0.39.0-alpha.1) : mixtion qui a créé un lot de tirage → vins de base (lots de la vinification)
    tirageDe: (lotId) => db.ops.find((o) => o.type === 'tirage' && o.lotId === lotId) || null,
  };
}
// lien discret vers un autre module (seulement s'il est actif)
function VersModule({ id, children }) {
  const { db, setTab } = useApp(); if (!moduleActif(db, id)) return null;
  return <button type="button" className="linkish" onClick={() => setTab(id)}>{children}</button>;
}

// vins de base d'un lot de tirage (lots de la cuverie), avec leur volume dans la mixtion
function VinsDeBase({ lotId }) {
  const { tirageDe } = useBouteilles(); const o = tirageDe(lotId);
  if (!o) return <span className="text-xs text-ink2">—</span>;
  return <span className="flex flex-wrap gap-x-2" data-vins-base={lotId}>{(o.sources || []).map((x, i) => <span key={i}><LotLink id={x.lotId} /> <span className="num text-xs">{fmtL(x.volL)}</span></span>)}</span>;
}
// autres opérations du catalogue saisies dans ce module (opérations personnalisées du groupe « Tirage & bouteilles »)
function AutresOpsModule({ mod, sauf, onForm }) {
  const { db, camp } = useApp(); const L = opsDuModule(db, mod).filter((x) => !(sauf || []).includes(x.id));
  if (!L.length) return null;
  return <div className="card p-3" data-autres-ops={mod}><div className="lbl">Autres opérations</div><div className="flex flex-wrap gap-2">{L.map((x) => <Btn key={x.id} disabled={camp.figee} title={x.aide || ''} onClick={() => onForm({ type: x.id })}><span aria-hidden="true" className="mr-1 opacity-70">{opIcone(db, x.id)}</span>{x.label}</Btn>)}</div></div>;
}
function PrepsTable({ rows, onEdit, empty }) {
  const { db, R } = useApp(); const { opOf, prepIn } = useBouteilles();
  return (
    <Tbl rows={rows} empty={empty} cols={[
      { h: 'Code', r: (p) => <b>{p.code}</b> }, { h: 'Type', r: (p) => PREP_TYPES[p.ptype] }, { h: 'Revendication', r: (p) => <QChip id={p.qualif} /> }, { h: 'Date', r: (p) => <span className="num">{fmtDate(p.date)}</span> },
      { h: 'Préparé', cls: 'r', r: (p) => <span className="num">{fmtL(p.vol)}</span> }, { h: 'Reste', cls: 'r', r: (p) => <b className={`num ${p.remaining < -0.01 ? 'text-bad' : ''}`}>{fmtL(p.remaining)}</b> },
      { h: 'Ingrédients (lots fournisseurs)', r: (p) => <span className="text-xs">{lignesText(db, (opOf(p.opId) || {}).lignes) || '—'}</span> },
      { h: 'Utilisée pour', r: (p) => <span className="flex flex-wrap gap-x-2">{uniq(prepIn(p.id).map((u) => u.lotId).filter(Boolean)).map((id) => <LotLink key={id} id={id} />)}</span> },
      { h: 'Opérateur(s)', r: (p) => <OperateursChips ids={(opOf(p.opId) || {}).operateurs} /> },
      { h: '', r: (p) => (opOf(p.opId) ? <OpBtns op={opOf(p.opId)} onEdit={onEdit} /> : null) }]} />
  );
}

/* ---------- Tirages : préparations qualifiées et mixtions ---------- */
// 0.42.0-alpha.1 : sous-onglets « Préparer » (calculateur, levains, liqueurs) et « Tirer » (mixtions, lots de tirage)
function TabTirage() {
  const { db, camp } = useApp(); const [vue, setVue] = useState(() => { try { return window.localStorage.getItem('oenotrack-tirage-vue') || 'preparer'; } catch (e) { return 'preparer'; } });
  const [form, setForm] = useState(null);
  const choisir = (v) => { setVue(v); try { window.localStorage.setItem('oenotrack-tirage-vue', v); } catch (e) { /* stockage indisponible */ } };
  return (<div>
    <div className="no-print"><SubNav value={vue} onChange={choisir} items={[{ id: 'preparer', label: '⚗ Préparer' }, { id: 'tirer', label: '🍾 Tirer' }, { id: 'fournitures', label: '📦 Fournitures' }, { id: 'declarations', label: '📄 Déclarations' }]} /></div>
    {vue === 'declarations' ? <TirageDeclarations /> : vue === 'fournitures' ? <TirageFournitures /> : vue === 'tirer' ? <TabTirageTirer /> : <TiragePreparer onForm={camp.figee ? () => {} : setForm} />}
    {form ? <OpForm type={form.type} editId={form.editId} preset={form.preset} onClose={() => setForm(null)} /> : null}
  </div>);
}
function TabTirageTirer() {
  const { db, R, camp } = useApp(); const [form, setForm] = useState(null); const edit = (id) => setForm({ editId: id });
  const { preps, tirOps } = useBouteilles();
  const pT = preps.filter((p) => !PREPS_DEGORGEMENT.includes(p.ptype)); const tirC = tirOps.filter((o) => o.date >= camp.debut && o.date <= camp.fin);
  return (
    <div>
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label={`Tirages ${camp.nom}`} value={fmt(tirC.length)} /><Kpi label="Bouteilles tirées" value={fmt(sum(tirC, (o) => num(o.nbBouteilles)))} sub={`campagne ${camp.nom}`} />
        <Kpi label="Préparations disponibles" value={fmt(pT.filter((p) => p.remaining > 0.05).length)} sub="levain, pied de cuve, liqueur de tirage" /><Kpi label="Tirages (toutes campagnes)" value={fmt(tirOps.length)} />
      </div>
      <ChantiersSec onForm={setForm} />
      <Sec title="Saisir" right={camp.figee ? <Chip tone="bad">Campagne figée : saisie impossible</Chip> : null}>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))' }}>
          <div className="card p-3"><div className="lbl">Préparations qualifiées</div><div className="flex flex-wrap gap-2">{Object.keys(PREP_TYPES).filter((k) => !PREPS_DEGORGEMENT.includes(k)).map((k) => <Btn key={k} disabled={camp.figee} onClick={() => setForm({ type: 'preparation', preset: { ptype: k } })}>+ {PREP_TYPES[k]}</Btn>)}</div></div>
          <div className="card p-3"><div className="lbl">Lot de tirage</div><Btn kind="primary" disabled={camp.figee} onClick={() => setForm({ type: 'tirage' })}>Nouveau tirage</Btn><p className="help">Mixtion en cuve ou pompe doseuse (jamais les deux) → lot de tirage, en bouteilles sur lattes ; à rattacher de préférence à un chantier.</p></div>
          <AutresOpsModule mod="tirage" sauf={['tirage', 'preparation']} onForm={setForm} />
        </div>
        <p className="help mt-2">Les bouteilles tirées se suivent ensuite dans <VersModule id="cave">la Cave</VersModule>{moduleActif(db, 'cave') ? null : 'la Cave'} puis au <VersModule id="degorgement">Dégorgement</VersModule>{moduleActif(db, 'degorgement') ? null : 'Dégorgement'}.</p>
      </Sec>
      <Sec title="Tirages (mixtions)"><Tbl rows={tirOps} empty="Aucun tirage enregistré." cols={[
        { h: 'Date', r: (o) => <span className="num">{fmtDate(o.date)}</span> }, { h: 'Lot', r: (o) => <LotLink id={o.lotId} /> }, { h: 'Bouteilles', cls: 'r', r: (o) => <span className="num">{fmt(o.nbBouteilles)}</span> }, { h: 'Formats, VRTP', r: (o) => <span className="text-xs">{tirageFormatsDe(o).map((x) => `${fmt(x.nb)} × ${((tirageFormat(x.format) || { label: x.format }).label)}`).join(' · ')}<br /><TirageBilanBox db={db} R={R} op={o} /></span> }, { h: 'Mode', r: (o) => (TIRAGE_MODES.find((m) => m.id === o.mode) || { label: '—' }).label },
        { h: 'Sucre mixtion', cls: 'r', r: (o) => <span className="num">{(() => { const v = o.sucreGL != null ? o.sucreGL : (hasNum(o.densBase) && hasNum(o.densMix) ? (num(o.densMix) - num(o.densBase)) * 1000 * num(db.settings.coefSucre) : null); return v != null ? `${fmt(v, 1)} g/L` : '—'; })()}</span> },
        { h: 'Vin de base', r: (o) => <span className="flex flex-wrap gap-x-2">{(o.sources || []).map((s, i) => <span key={i}><LotLink id={s.lotId} /> <span className="num text-xs">{fmtL(s.volL)}</span></span>)}</span> },
        { h: 'Préparations', r: (o) => (o.prepUses || []).map((u) => `${prepOf(R, u.prepId).code || '?'} ${fmtL(u.volL)}`).join(' · ') || '—' },
        { h: 'Adjuvants & matières sèches', r: (o) => <span className="text-xs">{lignesText(db, o.lignes) || '—'}</span> },
        { h: 'Suite (cave, dégorgement)', r: (o) => { const t = R.tir[o.lotId]; return t ? <span className="num whitespace-nowrap text-sm" data-suite-tirage={o.lotId}>{`En cave : ${fmt(t.nb)} · dégorgées : ${fmt(t.deg || 0)}`}</span> : '—'; } },
        { h: 'Opérateur(s)', r: (o) => <OperateursChips ids={o.operateurs} /> }, { h: '', r: (o) => <OpBtns op={o} onEdit={edit} /> }]} /></Sec>
      <Sec title="Préparations (levain, pied de cuve, liqueur de tirage)"><PrepsTable rows={pT} onEdit={edit} empty="Aucune préparation enregistrée." /></Sec>
      {form ? <OpForm type={form.type} editId={form.editId} preset={form.preset} onClose={() => setForm(null)} /> : null}
    </div>
  );
}
TABS_REG.tirage = TabTirage;

/* ---------- Cave : bouteilles sur lattes, âge, remuage et mise sur pointes ---------- */
function TabCave() {
  const { db, R, camp } = useApp(); const [form, setForm] = useState(null); const [tous, setTous] = useState(false); const edit = (id) => setForm({ editId: id });
  const { tirs } = useBouteilles();
  const pointe = ((opDef(db, 'remuage') || {}).stadeAuto || {}).stade || 'sur_pointes';
  const enCave = tirs.filter((t) => t.nb > 0); const vus = tous ? tirs : enCave;
  const stade = (t) => (R.lots[t.lotId] || {}).stade; const surPointes = enCave.filter((t) => stade(t) === pointe);
  const plusVieux = enCave.length ? enCave.reduce((a, b) => (a.date < b.date ? a : b)) : null;
  const lotsCave = new Set(tirs.map((t) => t.lotId));
  const mouvements = db.ops.filter((o) => (o.type === 'tirage' && lotsCave.has(o.lotId)) || (o.type === 'reprise' && num(o.nbBouteilles) > 0) || (o.type === 'etape' && lotsCave.has(o.lotId)) || (o.type === 'degorgement' && lotsCave.has(o.sourceLotId)))
    .sort((a, b) => desc_(a, b) || (b.seq || 0) - (a.seq || 0)).slice(0, 40);
  const remuage = (lotId) => setForm({ type: 'remuage', preset: lotId ? { lotId } : {} });
  return (
    <div>
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label="Bouteilles sur lattes" value={fmt(sum(enCave, (t) => t.nb))} sub={`${enCave.length} lot${enCave.length > 1 ? 's' : ''} de tirage`} />
        <Kpi label="Sur pointes" value={fmt(sum(surPointes, (t) => t.nb))} sub="remuées, prêtes à dégorger" />
        <Kpi label="Plus ancien tirage" value={plusVieux ? ageTxt(moisDepuis(plusVieux.date)) : '—'} sub={plusVieux ? `${lotCode(db, R, plusVieux.lotId)} · ${fmtDate(plusVieux.date)}` : ''} />
        <Kpi label="Bouteilles dégorgées" value={fmt(sum(tirs, (t) => t.deg || 0))} sub="sorties de la cave" />
      </div>
      <Sec title="Saisir" right={camp.figee ? <Chip tone="bad">Campagne figée : saisie impossible</Chip> : null}>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))' }}>
          <div className="card p-3"><div className="lbl">Remuage</div><Btn kind="primary" disabled={camp.figee || !enCave.length} onClick={() => remuage('')}>Remuage / mise sur pointes</Btn><p className="help">Gyropalettes ou pupitres : le lot passe au stade « {stadeLabel(db, pointe)} ».</p></div>
          <div className="card p-3"><div className="lbl">Entrée de bouteilles</div><Btn disabled={camp.figee} onClick={() => setForm({ type: 'reprise', preset: { kind: 'bouteilles' } })}>Reprise de bouteilles sur lattes</Btn><p className="help">Stock de départ, achat ou retour de bouteilles déjà tirées.</p></div>
          <div className="card p-3"><div className="lbl">Changement de stade</div><Btn disabled={camp.figee || !enCave.length} onClick={() => setForm({ type: 'etape' })}>Autre étape en cave</Btn><p className="help">Mise en cave, retournement, contrôle… sur un lot de tirage.</p></div>
          <AutresOpsModule mod="cave" sauf={['remuage']} onForm={setForm} />
        </div>
      </Sec>
      <Sec title="Bouteilles en cave (lots de tirage)" right={<Check checked={tous} onChange={setTous} label="Afficher aussi les lots soldés" />}>
        <Tbl rows={vus.map((t) => ({ ...t, id: t.lotId }))} empty={tous ? 'Aucun lot de tirage.' : 'Aucune bouteille sur lattes. Enregistrez un tirage ou une reprise de bouteilles.'} cols={[
          { h: 'Lot de tirage', r: (t) => <LotLink id={t.lotId} /> }, { h: 'Vins de base', cls: 'hm', r: (t) => <VinsDeBase lotId={t.lotId} /> }, { h: 'Revendication', r: (t) => <QChip id={(R.lots[t.lotId] || {}).qualif} /> }, { h: 'Stade', r: (t) => <StadeChip id={stade(t)} compact /> },
          { h: 'Tirage / entrée', r: (t) => <span className="num">{fmtDate(t.date)}{t.reprise ? <span className="text-xs text-ink2"> (reprise)</span> : null}</span> },
          { h: 'Âge', r: (t) => <span className="num whitespace-nowrap">{ageTxt(moisDepuis(t.date))}</span> },
          { h: 'Mises', cls: 'r', r: (t) => <span className="num">{fmt(t.mis)}</span> }, { h: 'Dégorgées', cls: 'r', r: (t) => <span className="num">{fmt(t.deg || 0)}</span> }, { h: 'En stock', cls: 'r', r: (t) => <b className="num">{fmt(t.nb)}</b> },
          { h: '', r: (t) => (t.nb > 0 ? <div className="flex flex-wrap gap-1">{stade(t) !== pointe ? <Btn size="sm" disabled={camp.figee} onClick={() => remuage(t.lotId)}>Remuage</Btn> : null}{moduleActif(db, 'degorgement') ? <Btn size="sm" disabled={camp.figee} onClick={() => setForm({ type: 'degorgement', preset: { sourceLotId: t.lotId, nb: String(t.nb) } })}>Dégorger</Btn> : null}</div> : <Chip>soldé</Chip>) }]} />
      </Sec>
      <Sec title="Mouvements en cave"><Tbl rows={mouvements} empty="Aucun mouvement." cols={[
        { h: 'Date', r: (o) => <span className="num whitespace-nowrap">{fmtDate(o.date)}</span> }, { h: 'Opération', r: (o) => <Chip tone={OP_TONE[o.type]}>{opNom(o)}</Chip> },
        { h: 'Lot', r: (o) => <span className="whitespace-nowrap"><LotLink id={o.type === 'degorgement' ? o.sourceLotId : o.lotId} /></span> }, { h: 'Détail', r: (o) => <span className="text-sm">{opSummary(db, R, o)}</span> },
        { h: 'Opérateur(s)', r: (o) => <OperateursChips ids={o.operateurs} /> }, { h: '', r: (o) => <OpBtns op={o} onEdit={edit} /> }]} /></Sec>
      {form ? <OpForm type={form.type} editId={form.editId} preset={form.preset} onClose={() => setForm(null)} /> : null}
    </div>
  );
}
TABS_REG.cave = TabCave;

/* ---------- Dégorgement : liqueurs d'expédition, dégorgements, lots finis ---------- */
function TabDegorgement() {
  const { db, R, camp, showFini } = useApp(); const [form, setForm] = useState(null); const edit = (id) => setForm({ editId: id });
  const { preps, tirs, finis, opOf } = useBouteilles();
  const pD = preps.filter((p) => PREPS_DEGORGEMENT.includes(p.ptype)); const aDeg = tirs.filter((t) => t.nb > 0);
  const pointe = ((opDef(db, 'remuage') || {}).stadeAuto || {}).stade || 'sur_pointes'; const stade = (t) => (R.lots[t.lotId] || {}).stade;
  const finC = finis.filter((f) => f.date >= camp.debut && f.date <= camp.fin);
  const degorger = (t) => setForm({ type: 'degorgement', preset: t ? { sourceLotId: t.lotId, nb: String(t.nb) } : undefined });
  return (
    <div>
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label={`Dégorgées ${camp.nom}`} value={fmt(sum(finC, (f) => f.nb))} sub={`${finC.length} lot${finC.length > 1 ? 's' : ''} fini${finC.length > 1 ? 's' : ''}`} />
        <Kpi label="Bouteilles dégorgées" value={fmt(sum(finis, (f) => f.nb))} sub="toutes campagnes, tracées" />
        <Kpi label="À dégorger" value={fmt(sum(aDeg, (t) => t.nb))} sub={`dont ${fmt(sum(aDeg.filter((t) => stade(t) === pointe), (t) => t.nb))} sur pointes`} />
        <Kpi label="Liqueurs disponibles" value={fmt(pD.filter((p) => p.remaining > 0.05).length)} sub="liqueurs d’expédition" />
      </div>
      <Sec title="Saisir" right={camp.figee ? <Chip tone="bad">Campagne figée : saisie impossible</Chip> : null}>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))' }}>
          <div className="card p-3"><div className="lbl">Dégorgement</div><Btn kind="primary" disabled={camp.figee || !aDeg.length} onClick={() => degorger(null)}>Nouveau dégorgement</Btn><p className="help">Sort les bouteilles de la cave et crée un lot fini tracé (dosage, liqueur, bouchage).</p></div>
          <div className="card p-3"><div className="lbl">Liqueur d’expédition</div><Btn disabled={camp.figee} onClick={() => setForm({ type: 'preparation', preset: { ptype: 'liqueur_exp' } })}>+ {PREP_TYPES.liqueur_exp}</Btn><p className="help">MCR, sucre fondu dans du vin, ou eau ; le tout sulfité.</p></div>
          <AutresOpsModule mod="degorgement" sauf={['degorgement']} onForm={setForm} />
        </div>
        <p className="help mt-2">Parcours de chaque lot fini : vins de base (Vinification) → tirage → cave → dégorgement ; la fiche du lot fini retrace toutes les étapes.</p>
      </Sec>
      <Sec title="Lots à dégorger"><Tbl rows={aDeg.map((t) => ({ ...t, id: t.lotId }))} empty="Aucune bouteille en cave." cols={[
        { h: 'Lot de tirage', r: (t) => <LotLink id={t.lotId} /> }, { h: 'Revendication', r: (t) => <QChip id={(R.lots[t.lotId] || {}).qualif} /> }, { h: 'Stade', r: (t) => <StadeChip id={stade(t)} compact /> },
        { h: 'Âge', r: (t) => <span className="num whitespace-nowrap">{ageTxt(moisDepuis(t.date))}</span> }, { h: 'En stock', cls: 'r', r: (t) => <b className="num">{fmt(t.nb)}</b> },
        { h: '', r: (t) => <Btn size="sm" disabled={camp.figee} onClick={() => degorger(t)}>Dégorger</Btn> }]} /></Sec>
      <Sec title="Lots finis (dégorgements)"><Tbl rows={finis} onRow={(f) => showFini(f.id)} empty="Aucun dégorgement enregistré." cols={[
        { h: 'Lot fini', r: (f) => <b>{f.code}</b> }, { h: 'Désignation', r: (f) => f.designation }, { h: 'Date', r: (f) => <span className="num">{fmtDate(f.date)}</span> }, { h: 'Issu du lot', r: (f) => <LotLink id={f.sourceLotId} /> }, { h: 'Vins de base', cls: 'hm', r: (f) => <VinsDeBase lotId={f.sourceLotId} /> },
        { h: 'Bouteilles', cls: 'r', r: (f) => <span className="num">{fmt(f.nb)}</span> }, { h: 'Dosage', cls: 'r', r: (f) => <span className="num">{f.dosageGL != null ? `${fmt(f.dosageGL, 1)} g/L` : '—'}</span> }, { h: 'Revendication', r: (f) => <QChip id={f.qualif} /> },
        { h: 'Liqueur d’expédition', r: (f) => (f.prepIds || []).map((id) => prepOf(R, id).code).filter(Boolean).join(', ') || '—' }, { h: 'Bouchon, muselet…', r: (f) => <span className="text-xs">{lignesText(db, (opOf(f.opId) || {}).lignes) || '—'}</span> }, { h: 'Opérateur(s)', r: (f) => <OperateursChips ids={(opOf(f.opId) || {}).operateurs} /> },
        { h: '', r: (f) => (opOf(f.opId) ? <div onClick={(e) => e.stopPropagation()}><OpBtns op={opOf(f.opId)} onEdit={edit} /></div> : null) }]} /></Sec>
      <HabillageSec />
      <Sec title="Liqueurs d’expédition"><PrepsTable rows={pD} onEdit={edit} empty="Aucune liqueur d’expédition enregistrée." /></Sec>
      {form ? <OpForm type={form.type} editId={form.editId} preset={form.preset} onClose={() => setForm(null)} /> : null}
    </div>
  );
}
TABS_REG.degorgement = TabDegorgement;
