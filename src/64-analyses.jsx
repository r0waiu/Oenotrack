/* ============ ONGLET 4 : ANALYSES (paramètres et modèles personnalisables) ============ */
const sugarOf = (db, v) => (v && v.dbase != null && v.dmix != null ? r2((v.dmix - v.dbase) * 1000 * num(db.settings.coefSucre)) : null);
const valText = (db, pid, v) => { const p = db.analysesParams.find((x) => x.id === pid); return p ? `${p.nom} ${fmt(v, p.dec)}${p.unite ? ' ' + p.unite : ''}` : `${pid} ${v}`; };

function AnalyseForm({ id, preset, onClose }) {
  const { db, act, defaultDate } = useApp();
  const a = id ? db.analyses.find((x) => x.id === id) : null;
  const [f, set, setF] = useDraft({ date: a ? a.date : defaultDate, lotId: a ? a.lotId : (preset && preset.lotId) || '', contenantId: a ? a.contenantId : (preset && preset.contenantId) || '', modeleId: a ? a.modeleId : (db.analysesModeles[0] || {}).id || '', valeurs: a ? Object.fromEntries(Object.entries(a.valeurs).map(([k, v]) => [k, String(v)])) : {}, notes: a ? a.notes : '' });
  const Rd = useMemo(() => getR(db, isoOK(f.date) ? f.date : undefined), [db, f.date]);
  const model = db.analysesModeles.find((m) => m.id === f.modeleId);
  const shown = uniq([...(model ? model.paramIds : db.analysesParams.map((p) => p.id)), ...Object.keys(f.valeurs).filter((k) => f.valeurs[k] !== '')]).map((pid) => db.analysesParams.find((p) => p.id === pid)).filter(Boolean);
  const holding = Object.values(Rd.portions).filter((p) => p.lotId === f.lotId).map((p) => p.contenantId);
  const contOpts = [...contOptions(db, true).filter((o) => holding.includes(o.value)).map((o) => ({ ...o, label: `${o.label} — contient le lot` })), ...contOptions(db, true).filter((o) => !holding.includes(o.value))];
  const vals = {}; Object.keys(f.valeurs).forEach((k) => { if (hasNum(f.valeurs[k])) vals[k] = num(f.valeurs[k]); }); const sucre = sugarOf(db, vals);
  const pickLot = (v) => { const hc = Object.values(Rd.portions).filter((p) => p.lotId === v).map((p) => p.contenantId); setF((x) => ({ ...x, lotId: v, contenantId: hc.length === 1 ? hc[0] : x.contenantId })); };
  const lots = Object.values(Rd.lots).sort((x, y) => x.code.localeCompare(y.code, 'fr', { numeric: true }));
  const save = () => { const r = act((d) => analyseSave(d, { ...f, valeurs: f.valeurs }, id), 'Analyse enregistrée.'); if (r.ok) onClose(); };
  return (
    <FormSheet title={id ? 'Modifier l’analyse' : 'Nouvelle analyse'} sub="Rattachée à un lot et au contenant prélevé" onClose={onClose} onSave={save} wide>
      <G n={3}><Field label="Date du prélèvement"><DI value={f.date} onChange={(v) => set('date', v)} /></Field>
        <Field label="Modèle de fiche"><SI value={f.modeleId} onChange={(v) => set('modeleId', v)} placeholder="Libre (tous les paramètres)" options={db.analysesModeles.map((m) => ({ value: m.id, label: `${m.nom}${m.etape ? ' · ' + m.etape : ''}` }))} /></Field><div /></G>
      <G><Field label="Lot analysé"><SI value={f.lotId} onChange={pickLot} placeholder="Lot…" options={lots.map((l) => ({ value: l.id, label: `${l.code} · ${l.designation || LOT_TYPES[l.type]}${(Rd.lotVol[l.id] || 0) > 0 ? ' · ' + fmtL(Rd.lotVol[l.id]) : ''}` }))} /></Field>
        <Field label="Contenant prélevé" help="Une analyse est liée à la cuve précise d’où vient l’échantillon."><SI value={f.contenantId} onChange={(v) => set('contenantId', v)} placeholder="Contenant (facultatif)" options={contOpts} /></Field></G>
      <Group label="Résultats"><div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>{shown.map((p) => <Field key={p.id} label={`${p.nom}${p.unite ? ' (' + p.unite + ')' : ''}`}><NI value={f.valeurs[p.id] ?? ''} onChange={(v) => setF((x) => ({ ...x, valeurs: { ...x.valeurs, [p.id]: v } }))} placeholder={p.dec ? '0,' + '0'.repeat(p.dec) : '0'} /></Field>)}</div></Group>
      {sucre != null ? <Notice tone="info" title={`Sucre de la mixtion ≈ ${fmt(sucre, 1)} g/L`}>(densité mixtion − densité vin de base) × 1000 × {fmt(db.settings.coefSucre, 2)} g/L par point de densité (objectif {fmt(db.settings.objectifTirageGL)} g/L).</Notice> : null}
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} /></Field>
    </FormSheet>
  );
}

function ParamForm({ id, onClose }) {
  const { db, act } = useApp(); const p = id ? db.analysesParams.find((x) => x.id === id) : null;
  const [f, set] = useDraft({ nom: p ? p.nom : '', unite: p ? p.unite : '', dec: p ? String(p.dec) : '1' });
  const save = () => { const r = act((d) => paramSave(d, f, id), id ? 'Paramètre modifié.' : 'Paramètre créé.'); if (r.ok) onClose(); };
  return (<FormSheet title={id ? 'Modifier le paramètre' : 'Nouveau paramètre d’analyse'} onClose={onClose} onSave={save}>
    <Field label="Nom"><TI value={f.nom} onChange={(v) => set('nom', v)} placeholder="ex. Acide malique" autoFocus /></Field>
    <G><Field label="Unité"><TI value={f.unite} onChange={(v) => set('unite', v)} placeholder="g/L, mg/L, % vol., …" /></Field><Field label="Décimales affichées"><NI value={f.dec} onChange={(v) => set('dec', v)} /></Field></G></FormSheet>);
}
function ModeleForm({ id, onClose }) {
  const { db, act } = useApp(); const m = id ? db.analysesModeles.find((x) => x.id === id) : null;
  const [f, set] = useDraft({ nom: m ? m.nom : '', etape: m ? m.etape : '', paramIds: m ? m.paramIds : [] });
  const save = () => { const r = act((d) => modeleSave(d, f, id), id ? 'Modèle modifié.' : 'Modèle créé.'); if (r.ok) onClose(); };
  return (<FormSheet title={id ? 'Modifier le modèle de fiche' : 'Nouveau modèle de fiche d’analyse'} onClose={onClose} onSave={save}>
    <G><Field label="Nom du modèle"><TI value={f.nom} onChange={(v) => set('nom', v)} placeholder="ex. Contrôle malo" autoFocus /></Field><Field label="Étape associée" help="Libre : débourbage, vinification, tirage…"><TI value={f.etape} onChange={(v) => set('etape', v)} /></Field></G>
    <Group label="Paramètres de la fiche"><div className="grid gap-x-4 gap-y-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))' }}>{db.analysesParams.map((p) => <Check key={p.id} checked={f.paramIds.includes(p.id)} label={`${p.nom}${p.unite ? ' (' + p.unite + ')' : ''}`} onChange={(c) => set('paramIds', c ? [...f.paramIds, p.id] : f.paramIds.filter((x) => x !== p.id))} />)}</div></Group></FormSheet>);
}

function TabAnalyses() {
  const { db, R, act, confirm, camp, openOp } = useApp();
  const [sub, setSub] = useState('saisies'); const [form, setForm] = useState(null); const [vueDoc, setVueDoc] = useState(null); const [lotF, setLotF] = useState(''); const [modF, setModF] = useState(''); const [contF, setContF] = useState('');
  const rows = db.analyses.filter((a) => (!lotF || a.lotId === lotF) && (!modF || a.modeleId === modF) && (!contF || a.contenantId === contF)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const pivotIds = lotF ? uniq(rows.flatMap((a) => Object.keys(a.valeurs))).filter((k) => db.analysesParams.some((p) => p.id === k)) : [];
  const delA = async (a) => { const ok = await confirm({ title: 'Supprimer cette analyse ?', body: `Analyse du ${fmtDate(a.date)} sur ${lotCode(db, R, a.lotId)}.`, ok: 'Supprimer', danger: true }); if (ok) act((d) => analyseDelete(d, a.id), 'Analyse supprimée.'); };
  const delX = async (title, fn, okMsg) => { const ok = await confirm({ title, body: 'Cette suppression est définitive.', ok: 'Supprimer', danger: true }); if (ok) act(fn, okMsg); };
  return (
    <div>
      <SubNav value={sub} onChange={setSub} items={[{ id: 'saisies', label: 'Saisies d’analyses' }, { id: 'modeles', label: 'Paramètres & modèles de fiches' }]} />
      {sub === 'saisies' ? (<>
        {camp.figee ? null : <BulletinsImport />}
        <Sec title={`Analyses (${rows.length})`} right={<><SI value={lotF} onChange={setLotF} placeholder="Tous les lots" style={{ width: 'auto', maxWidth: 220 }} options={Object.values(R.lots).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true })).map((l) => ({ value: l.id, label: l.code }))} aria-label="Lot" />
          <SI value={modF} onChange={setModF} placeholder="Tous les modèles" style={{ width: 'auto' }} options={db.analysesModeles.map((m) => ({ value: m.id, label: m.nom }))} aria-label="Modèle" />
          <SI value={contF} onChange={setContF} placeholder="Tous les contenants" style={{ width: 'auto' }} options={contOptions(db, true)} aria-label="Contenant" />
          <Btn kind="primary" onClick={() => setForm({})} data-vg="analyse-nouvelle">+ Nouvelle analyse</Btn></>}>
          <Tbl rows={rows} empty="Aucune analyse pour ces critères." cols={[
            { h: 'Date', r: (a) => <span className="num">{fmtDate(a.date)}</span> }, { h: 'Lot', r: (a) => <LotLink id={a.lotId} /> }, { h: 'Contenant prélevé', r: (a) => (a.contenantId ? <ContLink id={a.contenantId} /> : '—') },
            { h: 'Modèle', r: (a) => { const b = analyseBulletin(db, a); return <span className="inline-flex flex-wrap items-center gap-1">{(db.analysesModeles.find((m) => m.id === a.modeleId) || {}).nom || 'Libre'}{b ? <button type="button" className="chip" style={{ cursor: 'pointer' }} onClick={() => setVueDoc(b)} title={`Bulletin d’analyses : ${b.nom}`} data-bulletin-doc="">📄 bulletin</button> : null}</span>; } },
            { h: 'Résultats', r: (a) => <div className="flex flex-wrap gap-1">{Object.keys(a.valeurs).map((k) => <Chip key={k}>{valText(db, k, a.valeurs[k])}</Chip>)}{sugarOf(db, a.valeurs) != null ? <Chip tone="info">Sucre mixtion {fmt(sugarOf(db, a.valeurs), 1)} g/L</Chip> : null}{(() => { const sg = camp.figee ? null : stadeSuggestion(db, R, a); return sg ? <button type="button" className="chip chip-c" style={{ '--c': stadeColor(db, sg.stade), cursor: 'pointer' }} title={`${sg.why} : enregistrer le passage en « ${stadeLabel(db, sg.stade)} »`} onClick={() => openOp(opEtapePour(db, sg.stade), { lotId: sg.lotId, newStade: sg.stade, date: a.date, notes: `D’après l’analyse du ${fmtDate(a.date)} : ${sg.why}.` })}>→ {stadeCourt(db, sg.stade)} ?</button> : null; })()}</div> },
            { h: '', r: (a) => (isLocked(db, a.date) ? <Chip>🔒 figée</Chip> : <div className="flex gap-1"><Btn size="sm" onClick={() => setForm({ id: a.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => delA(a)}>Supprimer</Btn></div>) }]} />
        </Sec>
        {lotF && rows.length > 1 ? <Sec title={`Évolution du lot ${lotCode(db, R, lotF)}`}><div className="tblwrap"><table className="tbl"><thead><tr><th>Date</th><th>Contenant</th>{pivotIds.map((k) => { const p = db.analysesParams.find((x) => x.id === k); return <th key={k} className="r">{p.nom}{p.unite ? ` (${p.unite})` : ''}</th>; })}</tr></thead>
          <tbody>{[...rows].reverse().map((a) => (<tr key={a.id}><td className="num">{fmtDate(a.date)}</td><td>{a.contenantId ? contName(db, a.contenantId) : '—'}</td>{pivotIds.map((k) => { const p = db.analysesParams.find((x) => x.id === k); return <td key={k} className="r num">{a.valeurs[k] != null ? fmt(a.valeurs[k], p.dec) : ''}</td>; })}</tr>))}</tbody></table></div></Sec> : null}
        <AnalysesEntreesSection />
      </>) : (<>
        <Sec title="Paramètres d’analyse" right={<Btn kind="primary" onClick={() => setForm({ param: true })}>+ Nouveau paramètre</Btn>}><Tbl rows={db.analysesParams} cols={[
          { h: 'Paramètre', r: (p) => <b>{p.nom}</b> }, { h: 'Unité', r: (p) => p.unite || '—' }, { h: 'Décimales', cls: 'r', r: (p) => <span className="num">{p.dec}</span> }, { h: 'Analyses', cls: 'r', r: (p) => <span className="num">{db.analyses.filter((a) => a.valeurs[p.id] != null).length}</span> },
          { h: '', r: (p) => <div className="flex gap-1"><Btn size="sm" onClick={() => setForm({ param: true, id: p.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => delX(`Supprimer « ${p.nom} » ?`, (d) => paramDelete(d, p.id), 'Paramètre supprimé.')}>Supprimer</Btn></div> }]} /></Sec>
        <Sec title="Modèles de fiches d’analyse" right={<Btn kind="primary" onClick={() => setForm({ modele: true })}>+ Nouveau modèle</Btn>}>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))' }}>{db.analysesModeles.map((m) => (<div key={m.id} className="card p-3"><div className="flex items-center justify-between gap-2"><b className="text-base">{m.nom}</b>{m.etape ? <Chip tone="info">{m.etape}</Chip> : null}</div>
            <div className="mt-2 flex flex-wrap gap-1">{m.paramIds.map((pid) => { const p = db.analysesParams.find((x) => x.id === pid); return p ? <Chip key={pid}>{p.nom}</Chip> : null; })}</div>
            <div className="mt-3 flex gap-1"><Btn size="sm" onClick={() => setForm({ modele: true, id: m.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => delX(`Supprimer le modèle « ${m.nom} » ?`, (d) => modeleDelete(d, m.id), 'Modèle supprimé.')}>Supprimer</Btn></div></div>))}</div></Sec>
      </>)}
      {vueDoc ? <DocViewer doc={vueDoc} onClose={() => setVueDoc(null)} /> : null}
      {form && form.param ? <ParamForm id={form.id} onClose={() => setForm(null)} /> : form && form.modele ? <ModeleForm id={form.id} onClose={() => setForm(null)} /> : form ? <AnalyseForm id={form.id} preset={form.preset} onClose={() => setForm(null)} /> : null}
    </div>
  );
}
TABS_REG.analyses = TabAnalyses;
