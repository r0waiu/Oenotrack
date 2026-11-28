/* ============ ONGLET « MISE EN BOUTEILLE » (0.50.0-alpha.2) : vins tranquilles et doux ============
   Sous-onglets : « 🍷 Mettre » (chantiers de mise, mises, lots en bouteilles), « 📦 Fournitures » (les intrants : bouteilles, bouchons,
   capsules, étiquettes — même vue que les Tirages), « 🏷 Habillage & cartons » (repris du Dégorgement). Sous-onglet retenu sur cet
   appareil (oenotrack-mise-vue). Moteur : 16wb-mise-bouteille.js. */
const MISE_VUES = [{ id: 'mettre', label: '🍷 Mettre' }, { id: 'fournitures', label: '📦 Fournitures' }, { id: 'habillage', label: '🏷 Habillage & cartons' }];
function TabMise() {
  const { nav } = useApp(); const ids = MISE_VUES.map((v) => v.id);
  const [vue, setVue] = useState(() => { if (nav && ids.includes(nav.sub)) return nav.sub; try { const v = window.localStorage.getItem('oenotrack-mise-vue'); return ids.includes(v) ? v : 'mettre'; } catch (e) { return 'mettre'; } });
  const choisir = (v) => { setVue(v); try { window.localStorage.setItem('oenotrack-mise-vue', v); } catch (e) { /* stockage indisponible */ } };
  useEffect(() => { if (nav && ids.includes(nav.sub)) choisir(nav.sub); }, [nav]);
  return (<div data-mise="">
    <div className="no-print"><SubNav value={vue} onChange={choisir} items={MISE_VUES} /></div>
    {vue === 'fournitures' ? <TirageFournitures /> : vue === 'habillage' ? <HabillageSec /> : <MiseMettre />}
  </div>);
}
TABS_REG.mise = TabMise;

const miseFormatsTexte = (op) => tirageFormatsDe(op).map((f) => `${fmt(f.nb)} × ${(tirageFormat(f.format) || { label: f.format }).label}`).join(' · ');
const miseLabel = (L, id) => ((L.find((x) => x.id === id) || {}).label || '');
function MiseMettre() {
  const { db, R, act, confirm, camp } = useApp(); const lect = useLectureSeule('mise'); const [form, setForm] = useState(null); const [chf, setChf] = useState(null); const [ouv, setOuv] = useState(null);
  const M = useMemo(() => misesListe(db), [db]); const C = useMemo(() => [...chantiersMise(db)].sort((a, b) => String(b.dateDebut).localeCompare(String(a.dateDebut))), [db]);
  const B = useMemo(() => miseBilan(db, R, M), [db, R, M]); const finis = (db.lotsFinis || []).filter((f) => f && f.mise);
  const suppr = async (op) => { if (await confirm({ title: 'Supprimer cette mise en bouteille ?', body: 'Le vin revient dans ses cuves et le lot fini est retiré (refusé s’il est déjà habillé).', ok: 'Supprimer', danger: true })) act((d) => opDelete(d, op.id), 'Mise supprimée.'); };
  return (<div className="space-y-4" data-mise-mettre="">
    <Aide id="mise" resume="Le vin pris en cuve devient un lot fini en bouteilles : habillage, cartons et DRM le reprennent.">
      <span>Chaque mise prend le vin dans une ou plusieurs cuves et crée aussitôt le lot fini (n° de lot, DDM, bouchage), repris par l’habillage, la mise en carton et la DRM (vrac → conditionné).</span>{' '}
      <span>Un chantier de mise regroupe une journée de mise, en interne ou chez un prestataire, avec sa ligne et ses documents.</span>
    </Aide>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Kpi label="Mises" value={M.length} /><Kpi label="Cols mis" value={fmt(B.cols)} sub={`${fmt(B.eqBouteilles)} équivalent bouteilles`} /><Kpi label="Volume mis" value={fmtL(B.volL)} sub={`pertes ${fmtL(B.perteL)}`} /><Kpi label="Lots en bouteilles" value={finis.length} />
    </div>
    <Sec title="Chantiers de mise" right={lect || camp.figee ? null : <Btn onClick={() => setChf({})} data-chantier-mise-nouveau="">＋ Chantier de mise</Btn>}>
      <TblCartes rows={C} onRow={(c) => setOuv(c.id)} empty="Aucun chantier : facultatif, il regroupe les mises d’une journée (interne ou prestataire)." cols={[
        { h: 'N°', r: (c) => <b translate="no">{c.numero}</b> }, { h: 'Nom', r: (c) => <span translate="no">{c.nom || ''}</span> }, { h: 'Dates', r: (c) => <span className="num">{`${fmtDate(c.dateDebut)}${c.dateFin ? ` → ${fmtDate(c.dateFin)}` : ''}`}</span> },
        { h: 'Réalisation', r: (c) => (c.realisation === 'prestataire' ? <span translate="no">{((db.fournisseurs || []).find((f) => f.id === c.prestataireId) || { nom: 'Prestataire' }).nom}</span> : 'Interne') },
        { h: 'Cols', cls: 'r', r: (c) => <span className="num">{fmt(chantierMiseBilan(db, R, c.id).cols)}</span> }]} />
    </Sec>
    <Sec title={`Mises en bouteille (${M.length})`} right={lect || camp.figee ? null : <Btn kind="primary" onClick={() => setForm({})} data-mise-nouvelle="">＋ Nouvelle mise</Btn>}>
      <TblCartes rows={M} empty="Aucune mise en bouteille." onRow={(o) => (lect ? null : setForm({ id: o.id }))} cols={[
        { h: 'Date', r: (o) => <span className="num">{fmtDate(o.date)}</span> }, { h: 'N° de lot', r: (o) => <b translate="no">{((db.lots.find((l) => l.id === o.lotId)) || {}).code || ''}</b> },
        { h: 'Vin', r: (o) => <span className="text-sm" translate="no">{uniq((o.sources || []).map((s) => (R.lots[s.lotId] || lotById(db, s.lotId) || {}).code)).join(', ')}</span> },
        { h: 'Cols', r: (o) => <span className="num text-sm">{miseFormatsTexte(o)}</span> }, { h: 'Bouchage', r: (o) => <span className="text-sm">{miseLabel(MISE_BOUCHAGES, ((o.mise || {}).bouchage || {}).type)}{((o.mise || {}).bouchage || {}).capsule === 'crd' ? <Chip>CRD</Chip> : null}</span> },
        { h: 'DDM', r: (o) => <span className="num">{(o.mise || {}).ddm ? fmtDate(o.mise.ddm) : ''}</span> }, { h: 'Chantier', r: (o) => <span translate="no">{(chantierMise(db, o.chantierId) || {}).numero || ''}</span> },
        { h: '', r: (o) => (lect || isLocked(db, o.date) ? null : <Btn size="sm" kind="danger" onClick={(e) => { e.stopPropagation(); suppr(o); }} data-mise-supprimer={o.id}>Supprimer</Btn>) }]} />
    </Sec>
    {chf ? <ChantierMiseForm id={chf.id} onClose={(id) => { setChf(null); if (id) setOuv(id); }} /> : null}
    {ouv ? <ChantierMiseSheet id={ouv} onClose={() => setOuv(null)} onMise={(p) => setForm({ preset: p })} onModifier={() => { setChf({ id: ouv }); }} /> : null}
    {form ? <MiseForm id={form.id} preset={form.preset} onClose={() => setForm(null)} /> : null}
  </div>);
}

// formulaire d'une mise
function miseFormDe(db, op) {
  const M = op.mise || {}; const lo = db.lots.find((l) => l.id === op.lotId) || {};
  return { date: op.date, heure: op.heure || '', chantierId: op.chantierId || '', sources: (op.sources || []).map((s) => ({ portionId: s.portionId, volL: String(s.volL) })), formats: tirageFormatsDe(op).map((f) => ({ format: f.format, nb: String(f.nb) })), casse: op.casse ? String(op.casse) : '',
    code: lo.code || '', designation: lo.designation || '', ddm: M.ddm || '', bouchage: { ...(M.bouchage || {}) }, filtration: M.filtration || '', gaz: [...(M.gaz || [])], controles: (M.controles || []).map((c) => ({ ...c, mesure: c.mesure ?? '', cible: c.cible ?? '' })),
    fournitures: (op.fournitures || []).map((x) => ({ ...x })), lignes: tirageLignesHorsFournitures(op), operateurs: op.operateurs || [], notes: op.notes || '' };
}
const miseCodeDefaut = (db, date) => { const a = String(yearOf(isoOK(date) ? date : todayISO())).slice(2); let n = (db.lots || []).filter((l) => l.type === 'mise_bouteille' && String(l.code || '').startsWith(`MB${a}-`)).length + 1; let c = `MB${a}-${pad(n)}`; while ((db.lots || []).some((l) => l.code === c)) { n += 1; c = `MB${a}-${pad(n)}`; } return c; };
function MiseForm({ id, preset, onClose }) {
  const { db, act, defaultDate, moi } = useApp(); const old = id ? (db.ops || []).find((o) => o.id === id) : null;
  const [f, setF] = useState(() => (old ? miseFormDe(db, old) : { date: defaultDate, heure: '', chantierId: '', sources: [{ portionId: '', volL: '' }], formats: [{ format: 'bouteille', nb: '' }], casse: '', code: miseCodeDefaut(db, defaultDate), designation: '', ddm: '', bouchage: { type: '', capsule: '' }, filtration: '', gaz: [], controles: [], fournitures: [], lignes: [], operateurs: moi ? [moi] : [], notes: '', ...(preset || {}) }));
  const upd = (p) => setF((x) => ({ ...x, ...p }));
  const Rd = useMemo(() => replay(old ? { ...db, ops: db.ops.filter((o) => o.id !== id) } : db, isoOK(f.date) ? f.date : undefined), [db, f.date, old, id]);
  const P = useMemo(() => Object.values(Rd.portions).filter((p) => p.vol > 0.5).map((p) => ({ value: p.id, label: `${(db.contenants.find((c) => c.id === p.contenantId) || {}).nom || 'Contenant'} · ${(Rd.lots[p.lotId] || {}).code || ''} · ${fmt(p.vol)} L`, donnee: true })), [Rd, db]);
  const setS = (i, p) => upd({ sources: f.sources.map((x, k) => (k === i ? { ...x, ...p } : x)) });
  const F0 = (f.formats || []).filter((x) => num(x.nb) > 0).map((x) => ({ format: x.format, nb: num(x.nb), L: (tirageFormat(x.format) || {}).L || 0.75 }));
  const vinL = sum(f.sources, (s) => num(s.volL)); const volL = tirageVolFormats(F0);
  const lots = uniq(f.sources.map((s) => (Rd.portions[s.portionId] || {}).lotId).filter(Boolean)); const avant = useMemo(() => miseAnalysesAvant(db, lots, f.date), [db, lots.join(), f.date]);
  const params = db.analysesParams || []; const pLab = (k) => (params.find((p) => p.id === k) || {}).label || k;
  const setC = (i, p) => upd({ controles: f.controles.map((x, k) => (k === i ? { ...x, ...p } : x)) });
  const save = () => { const r = act((d) => miseSave(d, f, id), old ? 'Mise modifiée.' : 'Mise enregistrée : lot fini créé.'); if (r && r.ok) onClose(); return r; };
  return (<FormSheet wide title={old ? 'Modifier la mise en bouteille' : 'Nouvelle mise en bouteille'} sub="Le vin pris en cuve devient un lot fini : n° de lot, DDM, bouchage, contrôles et fournitures." onClose={onClose} onSave={save}>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }} data-mise-form="">
      <Field label="Date" champ="date"><DI value={f.date} onChange={(v) => upd({ date: v })} aria-label="Date de la mise" /></Field>
      <Field label="Heure"><TI value={f.heure} onChange={(v) => upd({ heure: v })} placeholder="08:00" aria-label="Heure de la mise" /></Field>
      <Field label="Chantier de mise" champ="chantierId"><SI plain value={f.chantierId} onChange={(v) => upd({ chantierId: v })} options={[{ value: '', label: 'Aucun' }, ...chantiersMise(db).map((c) => ({ value: c.id, label: `${c.numero}${c.nom ? ` · ${c.nom}` : ''}`, donnee: true }))]} aria-label="Chantier de mise" /></Field>
      <Field label="N° de lot" champ="code"><TI value={f.code} onChange={(v) => upd({ code: v })} aria-label="N° de lot de la mise" /></Field>
      <Field label="Désignation"><TI value={f.designation} onChange={(v) => upd({ designation: v })} placeholder="ex. Bourgogne blanc 2025" aria-label="Désignation du lot" /></Field>
      <Field label="DDM (facultative)" champ="ddm"><DI value={f.ddm} onChange={(v) => upd({ ddm: v })} aria-label="DDM" /></Field>
    </div>
    <Group label="Vin mis en bouteille" champ="sources"><div className="grid gap-2" data-mise-sources="">
      {f.sources.map((s, i) => <div key={i} className="flex flex-wrap items-end gap-2">
        <SI plain value={s.portionId} onChange={(v) => setS(i, { portionId: v, ...(!s.volL && Rd.portions[v] ? { volL: String(Math.round(Rd.portions[v].vol)) } : {}) })} options={[{ value: '', label: 'Cuve…' }, ...P]} aria-label={`Cuve prélevée ${i + 1}`} />
        <NI value={s.volL} onChange={(v) => setS(i, { volL: v })} placeholder="L" aria-label={`Volume pris dans la cuve ${i + 1}`} />
        {f.sources.length > 1 ? <Btn size="sm" kind="ghost" onClick={() => upd({ sources: f.sources.filter((y, k) => k !== i) })} aria-label="Retirer la cuve">✕</Btn> : null}</div>)}
      <div className="flex flex-wrap items-center gap-2"><Btn size="sm" onClick={() => upd({ sources: [...f.sources, { portionId: '', volL: '' }] })}>＋ Cuve</Btn><span className="text-sm text-ink2" data-mise-volumes="">{vinL > volL && volL > 0 ? `Vin pris : ${fmtL(vinL)} · mis : ${fmtL(volL)} · pertes : ${fmtL(vinL - volL)}` : `Vin pris : ${fmtL(vinL)} · mis : ${fmtL(volL)}`}</span></div>
    </div></Group>
    {avant.length ? <Group label="Avant la mise : dernières analyses"><ul className="space-y-1 text-sm" data-mise-avant="">{avant.map((a) => <li key={a.lotId}><b translate="no">{(Rd.lots[a.lotId] || {}).code}</b>{' · '}{Object.keys(a.valeurs).length ? Object.entries(a.valeurs).map(([k, v]) => `${pLab(k)} ${fmt(v.v, 2)}`).join(' · ') : <span className="text-warn">aucune analyse</span>}{a.ageJ != null && a.ageJ > 30 ? <Chip tone="warn">{`analyse de ${a.ageJ} jours`}</Chip> : null}</li>)}</ul></Group> : null}
    <FormatsEditor formats={f.formats} onChange={(v) => upd({ formats: v })} label="Cols mis par format" />
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
      <Field label="Casse"><NI value={f.casse} onChange={(v) => upd({ casse: v })} placeholder="cols" aria-label="Casse" /></Field>
      <Field label="Bouchage" champ="bouchage"><SI plain value={f.bouchage.type || ''} onChange={(v) => upd({ bouchage: { ...f.bouchage, type: v } })} options={[{ value: '', label: '—' }, ...MISE_BOUCHAGES.map((b) => ({ value: b.id, label: b.label }))]} aria-label="Type de bouchage" /></Field>
      <Field label="Capsule de surbouchage"><SI plain value={f.bouchage.capsule || ''} onChange={(v) => upd({ bouchage: { ...f.bouchage, capsule: v } })} options={MISE_CAPSULES.map((b) => ({ value: b.id, label: b.label }))} aria-label="Capsule de surbouchage" /></Field>
      <Field label="Filtration à la mise"><SI plain value={f.filtration} onChange={(v) => upd({ filtration: v })} options={MISE_FILTRATIONS.map((b) => ({ value: b.id, label: b.label }))} aria-label="Filtration à la mise" /></Field>
    </div>
    <Group label="Inertage (gaz)"><div className="flex flex-wrap gap-4">{MISE_GAZ.map((g) => <Check key={g.id} checked={f.gaz.includes(g.id)} onChange={(v) => upd({ gaz: v ? [...f.gaz, g.id] : f.gaz.filter((x) => x !== g.id) })} label={g.label} />)}</div></Group>
    <Group label="Contrôles en ligne"><div className="grid gap-2" data-mise-controles="">
      {f.controles.map((c, i) => { const def = MISE_CONTROLES.find((x) => x.id === c.type) || {}; return (<div key={i} className="flex flex-wrap items-end gap-2">
        <TI value={c.heure || ''} onChange={(v) => setC(i, { heure: v })} placeholder="hh:mm" aria-label={`Heure du contrôle ${i + 1}`} style={{ width: 80 }} />
        <SI plain value={c.type} onChange={(v) => setC(i, { type: v })} options={MISE_CONTROLES.map((x) => ({ value: x.id, label: x.label }))} aria-label={`Contrôle ${i + 1}`} />
        <NI value={c.mesure} onChange={(v) => setC(i, { mesure: v })} placeholder={def.unite || 'mesure'} aria-label={`Mesure du contrôle ${i + 1}`} />
        <NI value={c.cible} onChange={(v) => setC(i, { cible: v })} placeholder="cible" aria-label={`Cible du contrôle ${i + 1}`} />
        <TI value={c.action || ''} onChange={(v) => setC(i, { action: v })} placeholder="action corrective" aria-label={`Action du contrôle ${i + 1}`} />
        <Btn size="sm" kind="ghost" onClick={() => upd({ controles: f.controles.filter((y, k) => k !== i) })} aria-label="Retirer le contrôle">✕</Btn></div>); })}
      <div><Btn size="sm" onClick={() => upd({ controles: [...f.controles, { type: 'niveau', heure: '', mesure: '', cible: '' }] })} data-mise-controle-ajout="">＋ Contrôle</Btn></div>
    </div></Group>
    <FournituresTirageBox db={db} Rd={Rd} f={f} upd={upd} F0={F0} types={['bouchon_mise', 'capsule_surbouchage']} titre="Fournitures de la mise (bouteilles, bouchons, capsules, étiquettes…)" />
    <Field label="Notes"><TA value={f.notes} onChange={(v) => upd({ notes: v })} rows={2} /></Field>
  </FormSheet>);
}

// chantier de mise : formulaire et fiche
function ChantierMiseForm({ id, onClose }) {
  const { db, act, uid, defaultDate } = useApp(); const old = id ? chantierMise(db, id) : null; const P = prestatairesMise(db);
  const [c, setC] = useState(() => (old ? clone(old) : { numero: '', nom: '', dateDebut: defaultDate, dateFin: '', realisation: 'interne', prestataireId: (P[0] || {}).id || '', ligne: { tireuse: true, boucheuse: true }, notes: '' }));
  const set = (p) => setC({ ...c, ...p }); const setL = (p) => setC({ ...c, ligne: { ...c.ligne, ...p } });
  const save = () => { const r = act((d) => chantierMiseSave(d, c, id, uid), old ? 'Chantier modifié.' : 'Chantier créé.'); if (r && r.ok) onClose(r.id); return r; };
  return (<FormSheet wide title={old ? `Modifier le chantier ${old.numero}` : 'Nouveau chantier de mise'} sub="Une journée de mise, en interne ou chez un prestataire, avec la ligne et les documents." onClose={() => onClose()} onSave={save}>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }} data-chantier-mise-form="">
      <Field label="N° de chantier" champ="numero"><TI value={c.numero} onChange={(v) => set({ numero: v })} placeholder={chantierMiseNumeroSuivant(db, c.dateDebut)} aria-label="N° de chantier" /></Field>
      <Field label="Nom"><TI value={c.nom} onChange={(v) => set({ nom: v })} placeholder="ex. Mise de printemps" aria-label="Nom du chantier" /></Field>
      <Field label="Début" champ="dateDebut"><DI value={c.dateDebut} onChange={(v) => set({ dateDebut: v })} aria-label="Début du chantier" /></Field>
      <Field label="Fin" champ="dateFin"><DI value={c.dateFin} onChange={(v) => set({ dateFin: v })} aria-label="Fin du chantier" /></Field>
      <Field label="Réalisation"><SI plain value={c.realisation} onChange={(v) => set({ realisation: v })} options={MISE_REALISATIONS.map((x) => ({ value: x.id, label: x.label }))} aria-label="Réalisation" /></Field>
      {c.realisation === 'prestataire' ? <Field label="Prestataire" champ="prestataireId" help={P.length ? undefined : 'Aucun prestataire : Intrants › Fournisseurs, cochez « Prestataire de mise en bouteille ».'}><SI plain value={c.prestataireId} onChange={(v) => set({ prestataireId: v })} options={[{ value: '', label: 'Prestataire…' }, ...P.map((x) => ({ value: x.id, label: x.nom, donnee: true }))]} aria-label="Prestataire" /></Field> : null}
    </div>
    <Group label="Composition de la ligne"><div className="flex flex-wrap gap-4">{MISE_LIGNE.map(([k, l]) => <Check key={k} checked={!!(c.ligne || {})[k]} onChange={(v) => setL({ [k]: v })} label={l} />)}</div>
      <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <Field label="Becs de la tireuse"><NI value={(c.ligne || {}).nbBecs ?? ''} onChange={(v) => setL({ nbBecs: v })} aria-label="Becs de la tireuse" /></Field>
        <Field label="Cadence (cols par heure)"><NI value={(c.ligne || {}).cadenceColsH ?? ''} onChange={(v) => setL({ cadenceColsH: v })} aria-label="Cadence" /></Field>
        <Field label="Autre matériel"><TI value={(c.ligne || {}).autres || ''} onChange={(v) => setL({ autres: v })} aria-label="Autre matériel" /></Field>
      </div></Group>
    <Field label="Notes"><TA value={c.notes} onChange={(v) => set({ notes: v })} rows={2} /></Field>
  </FormSheet>);
}
function ChantierMiseSheet({ id, onClose, onMise, onModifier }) {
  const { db, R, act, confirm, camp } = useApp(); const lect = useLectureSeule('mise'); const c = chantierMise(db, id);
  if (!c) return <Sheet title="Chantier introuvable" onClose={onClose}><Empty>Ce chantier n’existe plus.</Empty></Sheet>;
  const b = chantierMiseBilan(db, R, id);
  const suppr = async () => { if (await confirm({ title: `Supprimer le chantier ${c.numero} ?`, body: 'Refusé tant qu’une mise y est rattachée.', ok: 'Supprimer', danger: true })) { const r = act((d) => chantierMiseDelete(d, id), 'Chantier supprimé.'); if (r && r.ok) onClose(); } };
  return (<Sheet wide title={<span>🏭 Chantier <span translate="no">{c.numero}</span>{c.nom ? <span className="font-normal text-ink2"> — <span translate="no">{c.nom}</span></span> : null}</span>} sub={`${fmtDate(c.dateDebut)}${c.dateFin ? ` → ${fmtDate(c.dateFin)}` : ''}`} onClose={onClose}
    footer={lect || camp.figee ? null : <><Btn kind="primary" onClick={() => onMise({ chantierId: id, date: c.dateDebut })}>＋ Mise sur ce chantier</Btn><Btn onClick={onModifier}>Modifier</Btn><Btn kind="danger" onClick={suppr}>Supprimer</Btn></>}>
    <div data-chantier-mise={id}>
      <div className="mb-4 flex flex-wrap gap-2">{MISE_LIGNE.filter(([k]) => (c.ligne || {})[k]).map(([k, l]) => <Chip key={k}>{l}</Chip>)}{c.realisation === 'prestataire' ? <Chip tone="info" translate="no">{((db.fournisseurs || []).find((f) => f.id === c.prestataireId) || { nom: 'Prestataire' }).nom}</Chip> : <Chip>Interne</Chip>}</div>
      <Sec title="Mises du chantier"><Tbl rows={b.lots.map((l) => ({ ...l, id: l.opId }))} empty="Aucune mise sur ce chantier." cols={[{ h: 'Lot', r: (l) => <b translate="no">{l.code}</b> }, { h: 'Cols', cls: 'r', r: (l) => <span className="num">{fmt(l.cols)}</span> }, { h: 'Mis', cls: 'r', r: (l) => <span className="num">{fmtL(l.volL)}</span> }, { h: 'Vin pris', cls: 'r', r: (l) => <span className="num">{fmtL(l.vinL)}</span> }]} />
        <p className="mt-2 text-sm" data-chantier-mise-bilan="">{`Total : ${fmt(b.cols)} cols · ${fmt(b.eqBouteilles)} équivalent bouteilles · ${fmtL(b.volL)} mis · casse ${fmt(b.casse)} · pertes ${fmtL(b.perteL)}`}</p></Sec>
      <Sec title="Documents"><DocsPanel cible={{ type: 'chantierMise', id }} kind="chantierMise" locked={isLocked(db, c.dateDebut)} aide="Ordre de fabrication, attestation de nettoyage et de désinfection, bon d’intervention du prestataire, fiche de contrôle." /></Sec>
      {c.notes ? <p className="help">{c.notes}</p> : null}
    </div>
  </Sheet>);
}
