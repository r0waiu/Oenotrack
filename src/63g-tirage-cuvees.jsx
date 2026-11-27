/* ============ TIRAGES › CHANTIER : CUVÉES PRÉVUES (0.44.0-alpha.1) ============
   Prévisionnel des cuvées tirées sur le chantier (plusieurs qualités : couleurs, revendications, échelles, cépages), décrites depuis leurs
   vins de base ; la cuve de mixtion ou le lot tiré par pompe doseuse se créent depuis la ligne, qui passe « en mixtion » puis « tirée »,
   avec l'écart au prévu. La déclaration préalable du chantier en reprend une ligne par cuvée. */

const cuveeQualiteTexte = (db, ce) => [couleurLabel(db, ce.couleur), ce.qualif ? qLabel(ce.qualif) : '', ce.echelle ? (eDef(ce.echelle) || { label: ce.echelle }).label : '', ce.millesime || ''].filter(Boolean).join(' · ');
function CuveeForm({ chantierId, id, onClose }) {
  const { db, R, act, uid } = useApp(); const ch = chantierTirage(db, chantierId); const c0 = id ? chantierCuvee(db, chantierId, id) : null;
  const [f, setF] = useState(() => ({ nom: c0 ? c0.nom : '', sources: c0 && c0.sources.length ? c0.sources.map((s) => ({ portionId: s.portionId, volL: s.volL ? String(r2(s.volL)) : '' })) : [{ portionId: '', volL: '' }], vinHL: c0 && hasNum(c0.vinHL) ? String(c0.vinHL) : '', pointGL: c0 && c0.pointGL != null ? String(c0.pointGL) : '',
    mode: c0 ? c0.mode : 'pompe', formats: c0 && c0.formats.length ? c0.formats.map((x) => ({ format: x.format, nb: String(x.nb) })) : [{ format: 'bouteille', nb: '' }], couleur: c0 ? c0.couleur : '', qualif: c0 ? c0.qualif : '', echelle: c0 ? c0.echelle : '', millesime: c0 ? c0.millesime : '', mentions: c0 ? (c0.mentions || []).join(', ') : '', notes: c0 ? c0.notes : '' }));
  const set = (p) => setF((x) => ({ ...x, ...p }));
  const srcs = f.sources.filter((s) => s.portionId).map((s) => ({ portionId: s.portionId, lotId: (R.portions[s.portionId] || {}).lotId || '', volL: num(s.volL) }));
  const ce = cuveeEffective(db, R, { ...f, sources: srcs, mentions: f.mentions ? f.mentions.split(',') : [], vinHL: hasNum(f.vinHL) ? num(f.vinHL) : undefined, pointGL: hasNum(f.pointGL) ? num(f.pointGL) : null });
  const k = hasNum(f.pointGL) && ce.vinHL > 0 ? declPrealableCalcul(db, { vinHL: ce.vinHL, pointGL: num(f.pointGL) }) : null;
  const save = () => { const r = act((d) => chantierCuveeSave(d, chantierId, { ...f, sources: srcs, vinHL: f.vinHL, formats: f.formats }, id, uid), id ? 'Cuvée prévue modifiée.' : 'Cuvée prévue ajoutée.'); if (r && r.ok) onClose(); };
  return (<FormSheet wide title={id ? `Cuvée prévue — ${c0.nom}` : 'Nouvelle cuvée prévue'} sub={`Chantier ${ch ? ch.numero : ''} : qualité calculée depuis les vins de base, corrigeable.`} onClose={onClose} onSave={save}>
    <div className="grid gap-3" data-cuvee-form="">
      <G><Field label="Nom de la cuvée"><TI value={f.nom} onChange={(v) => set({ nom: v })} placeholder="ex. Blanc de blancs 2026" aria-label="Nom de la cuvée" autoFocus /></Field>
        <Field label="Mode de tirage"><SI plain value={f.mode} onChange={(v) => set({ mode: v })} options={TIRAGE_MODES.map((m) => ({ value: m.id, label: m.label }))} aria-label="Mode de tirage prévu" /></Field></G>
      <SourcesEditor db={db} Rd={R} sources={f.sources} onChange={(v) => set({ sources: v })} label="Vins de base (cuves, lots)" />
      <div className="rounded-md border border-line p-3 text-sm" data-cuvee-qualite=""><b>Qualité calculée :</b> <span translate="no">{cuveeQualiteTexte(db, ce) || '—'}</span>{ce.mentionsAuto.length ? <> · <span translate="no">{ce.mentionsAuto.join(', ')}</span></> : null}</div>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        <Field label="Couleur"><SI plain value={f.couleur} onChange={(v) => set({ couleur: v })} options={[{ value: '', label: `Calculée (${couleurLabel(db, ce.caracteres.couleur) || '—'})` }, ...couleurList(db).map((x) => ({ value: x.id, label: x.label }))]} aria-label="Couleur de la cuvée" /></Field>
        <Field label="Revendication"><SI plain value={f.qualif} onChange={(v) => set({ qualif: v })} options={[{ value: '', label: `Calculée (${ce.caracteres.qualif ? qLabel(ce.caracteres.qualif) : '—'})` }, ...qualifList(db).map((q) => ({ value: q.id, label: qLabel(q.id) }))]} aria-label="Revendication de la cuvée" /></Field>
        <Field label="Échelle des crus"><SI plain value={f.echelle} onChange={(v) => set({ echelle: v })} options={[{ value: '', label: `Calculée (${ce.caracteres.echelle ? (eDef(ce.caracteres.echelle) || {}).label : '—'})` }, ...echList(db).map((x) => ({ value: x.id, label: x.label }))]} aria-label="Échelle de la cuvée" /></Field>
        <Field label="Millésime"><TI value={f.millesime} onChange={(v) => set({ millesime: v })} placeholder={ce.caracteres.millesime || 'non millésimé'} aria-label="Millésime de la cuvée" /></Field>
      </div>
      <Field label="Mentions (blanc de blancs, blanc de noirs, monocépage, bio…)" help={`Vide : ${ce.mentionsAuto.join(', ') || 'aucune'} (calculées).`}><TI value={f.mentions} onChange={(v) => set({ mentions: v })} placeholder={ce.mentionsAuto.join(', ')} aria-label="Mentions de la cuvée" /></Field>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        <Field label="Vin de base prévu (hL)" help={`Vins de base choisis : ${fmtL(ce.caracteres.volL)}`}><NI value={f.vinHL} onChange={(v) => set({ vinHL: v })} placeholder={fmt(ce.caracteres.volL / 100, 2)} aria-label="Vin de base prévu de la cuvée" /></Field>
        <Field label="Point de tirage (g/L)"><NI value={f.pointGL} onChange={(v) => set({ pointGL: v })} placeholder="ex. 24" aria-label="Point de tirage de la cuvée prévue" /></Field>
      </div>
      <FormatsEditor formats={f.formats} onChange={(v) => set({ formats: v })} label="Cols prévus par format" />
      {k && k.ok ? <p className="text-sm" data-cuvee-calcul="">{`Prévu : vin ${fmt(k.vinHL, 2)} hL · sucre ${fmt(k.sucreHL, 2)} hL (${fmt(k.sucreKg, 1)} kg) · total à tirer ${fmt(k.totalHL, 2)} hL · ${fmt(k.eqBouteilles, 0)} équivalent bouteilles`}</p> : <p className="help">Volume de vin et point de tirage : volumes de la déclaration préalable calculés par le profil de tirage (à vérifier).</p>}
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set({ notes: v })} rows={2} /></Field>
    </div>
  </FormSheet>);
}
function CuveesSec({ ch, lect, onForm }) {
  const { db, R, act, confirm } = useApp(); const [form, setForm] = useState(null); const C = chantierCuvees(ch);
  const rows = C.map((c) => ({ id: c.id, c, ce: cuveeEffective(db, R, c), re: cuveeRealise(db, R, ch.id, c) }));
  const suppr = async (c) => { if (await confirm({ title: `Retirer la cuvée prévue « ${c.nom} » ?`, ok: 'Retirer', danger: true })) act((d) => chantierCuveeDelete(d, ch.id, c.id), 'Cuvée prévue retirée.'); };
  return (<Sec title="Cuvées prévues (prévisionnel)" right={lect ? null : <Btn kind="primary" onClick={() => setForm({})} data-cuvee-ajouter="">＋ Cuvée prévue</Btn>}>
    <p className="help">Chaque qualité tirée sur le chantier (couleur, revendication, échelle des crus, cépages) ; la cuve de mixtion ou le lot de tirage se créent depuis la ligne ; la déclaration préalable en reprend une ligne par cuvée.</p>
    <div data-cuvees=""><Tbl rows={rows} empty="Aucune cuvée prévue : ajoutez les qualités à tirer sur ce chantier." cols={[
      { h: 'Cuvée', r: (x) => <div><b translate="no">{x.c.nom}</b><div className="text-xs text-ink2" translate="no">{cuveeQualiteTexte(db, x.ce)}</div>{x.ce.mentions.length ? <div className="text-xs" translate="no">{x.ce.mentions.join(' – ')}</div> : null}</div> },
      { h: 'Vins de base', r: (x) => <span className="text-xs" translate="no">{x.c.sources.map((s) => ((R.lots[s.lotId] || lotById(db, s.lotId) || {}).code || '?')).join(', ') || '—'}</span> },
      { h: 'Prévu', r: (x) => <span className="num text-sm">{[`${fmt(x.ce.vinHL, 2)} hL`, x.ce.pointGL != null ? `${fmt(num(x.ce.pointGL), 1)} g/L` : '', `${fmt(x.re.prevCols)} cols`].filter(Boolean).join(' · ')}</span> },
      { h: 'Mode', r: (x) => (TIRAGE_MODES.find((m) => m.id === x.c.mode) || {}).label },
      { h: 'Réalisé', r: (x) => <div><Chip tone={x.re.statut === 'tiree' ? 'good' : x.re.statut === 'en_cours' ? 'warn' : ''}>{CUVEE_STATUTS[x.re.statut]}</Chip>{x.re.statut === 'tiree' ? <div className="num text-xs">{[`${fmt(x.re.cols)} cols`, x.re.ecartCols != null ? `(écart ${(x.re.ecartCols > 0 ? '+' : '') + fmt(x.re.ecartCols)})` : ''].filter(Boolean).join(' ')}</div> : null}</div> },
      { h: '', r: (x) => (lect ? null : <div className="flex flex-wrap gap-1">{x.c.mode === 'mixtion' && x.re.statut === 'prevue' ? <Btn size="sm" onClick={() => onForm({ type: 'assemblage', preset: cuveePreset(db, R, ch, x.c, 'assemblage') })} data-cuvee-mixtion={x.c.id}>＋ Cuve de mixtion</Btn> : null}
        {x.c.mode === 'pompe' || x.re.statut === 'en_cours' ? <Btn size="sm" kind="primary" onClick={() => onForm({ type: 'tirage', preset: cuveePreset(db, R, ch, x.c, 'tirage') })} data-cuvee-tirer={x.c.id}>＋ Lot de tirage</Btn> : null}
        <Btn size="sm" onClick={() => setForm({ id: x.c.id })}>Modifier</Btn>{x.re.statut === 'prevue' ? <Btn size="sm" kind="ghost" onClick={() => suppr(x.c)}>Retirer</Btn> : null}</div>) },
    ]} /></div>
    {form ? <CuveeForm chantierId={ch.id} id={form.id} onClose={() => setForm(null)} /> : null}
  </Sec>);
}
