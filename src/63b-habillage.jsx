/* ============ DÉGORGEMENT › HABILLAGE ET MISE EN CARTON / EXPÉDITION (0.41.0-alpha.1) ============
   Habillage : sous-lot d'un lot fini (bouteilles habillées, date, heure, code) ; un même lot fini peut être habillé plusieurs fois.
   Réétiquetage : nouvel habillage d'un lot déjà habillé — le précédent reste intact, le lien est gardé.
   Mise en carton / expédition : bouteilles d'un lot habillé (ou d'un lot fini) mises en carton, avec cartons, destinataire et référence.
   Le code suit la règle de codification du stade (Paramètres › Codification des lots), sinon H26-001 / C26-001 ; toujours modifiable. */

// changer le code d'un lot à la main (exception, réétiquetage) : motif exigé, l'ancien code reste cherchable
function RenommerLot({ kind, id, code, onFin }) {
  const { act, uid } = useApp(); const [c, setC] = useState(code || ''); const [m, setM] = useState('');
  return (<FormSheet title={`Changer le code — ${code}`} sub="L’ancien code est gardé et reste cherchable en traçabilité." onClose={onFin} onSave={() => { const r = act((d) => lotRenommer(d, kind, id, c, m, uid), 'Code du lot changé.'); if (r && r.ok) onFin(); }}>
    <Field label="Nouveau code"><TI value={c} onChange={setC} aria-label="Nouveau code" /></Field>
    <Field label="Motif"><TI value={m} onChange={setM} placeholder="ex. réétiquetage, erreur de saisie" aria-label="Motif du changement de code" /></Field>
  </FormSheet>);
}
const habSourceNom = (db, s) => { const x = habillageSource(db, s); return x ? x.code : '—'; };
function HabillageForm({ type, editId, preset, onClose }) {
  const { db, R, act, defaultDate, moi, uid } = useApp(); const old = editId ? habillages(db).find((h) => h.id === editId) : null; const T = old ? old.type : type;
  const stade = T === 'carton' ? 'expedition' : 'habillage';
  const [f, setF] = useState(() => (old ? { ...old, codifChoix: { ...((old.codif || {}).choix || {}) }, codifAuto: null } : { type: T, date: defaultDate, heure: '', source: null, nb: '', code: '', designation: '', notes: '', operateurs: moi ? [moi] : [], nbCartons: '', parCarton: T === 'carton' ? '6' : '', destinataire: '', ref: '', codifChoix: {}, ...(preset || {}) }));
  const upd = (p) => setF((x) => ({ ...x, ...p }));
  const sources = useMemo(() => {
    const L = []; const libre = (s) => habillageRestant(db, s, T, old && old.id);
    (db.lotsFinis || []).forEach((x) => { const s = { type: 'fini', id: x.id }; const n = libre(s); if (n > 0 || (old && old.source.id === x.id)) L.push({ value: `fini:${x.id}`, label: `${x.code} · lot fini · ${fmt(n)} bouteille(s) libre(s)`, donnee: true }); });
    habillages(db).filter((h) => h.type !== 'carton' && (!old || h.id !== old.id)).forEach((h) => { const s = { type: 'habillage', id: h.id }; const n = libre(s); if (n > 0 || (old && old.source.id === h.id)) L.push({ value: `habillage:${h.id}`, label: `${h.code} · ${T === 'carton' ? 'habillé' : 'à réétiqueter'} · ${fmt(n)} bouteille(s) libre(s)`, donnee: true }); });
    return L;
  }, [db, T, old]);
  const srcVal = f.source ? `${f.source.type}:${f.source.id}` : '';
  const choisirSource = (v) => { const [t, id] = v.split(':'); const s = id ? { type: t, id } : null; upd({ source: s, ...(s && !old && !f.nb ? { nb: String(habillageRestant(db, s, T)) } : {}) }); };
  const ctx = useMemo(() => codifCtxHabillage(db, R, { ...f, id: old && old.id, choix: f.codifChoix }), [db, R, f, old]);
  const regle = codifActif(db, stade, f.date);
  useEffect(() => { if (old || regle || f.codifAuto === null) return; const c = habillageCodeDefaut(db, T, f.date); if (!f.code || f.code === f.codifAuto) upd({ code: c, codifAuto: c }); }, [f.date, regle]);
  const enregistrer = () => {
    const g = regle ? codifGenerer(db, stade, ctx) : null; const keep = old && old.codif && old.code === String(f.code).trim() ? old.codif : null;
    const tr = keep || codifTrace(g, String(f.code || '').trim(), f.codifChoix); const { codifAuto, codifChoix, ...h } = f;
    const r = act((d) => habillageSave(d, { ...h, ...(tr ? { codif: tr } : { codif: undefined }), nbCartons: T === 'carton' && !hasNum(f.nbCartons) && num(f.parCarton) > 0 && num(f.nb) > 0 ? String(Math.ceil(num(f.nb) / num(f.parCarton))) : f.nbCartons }, old && old.id, { par: uid }), old ? 'Opération modifiée.' : T === 'carton' ? 'Mise en carton enregistrée.' : 'Habillage enregistré.');
    if (r && r.ok) onClose();
  };
  return (<FormSheet title={`${old ? 'Modifier — ' : ''}${T === 'carton' ? 'Mise en carton / expédition' : 'Habillage'}`} sub={T === 'carton' ? 'Bouteilles habillées (ou dégorgées) mises en carton : cartons, destinataire, référence.' : 'Bouteilles d’un lot fini habillées (ou réétiquetées) : un lot habillé, avec son code.'} onClose={onClose} onSave={enregistrer} wide>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
      <Field label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} aria-label="Date" /></Field>
      <Field label="Heure"><TI value={f.heure || ''} onChange={(v) => upd({ heure: v })} placeholder="hh:mm" aria-label="Heure" /></Field>
      <Field label={T === 'carton' ? 'Lot mis en carton' : 'Lot habillé'} className="sm:col-span-2"><SI value={srcVal} onChange={choisirSource} placeholder="Lot…" options={sources} aria-label="Lot source" /></Field>
      <Field label="Bouteilles"><NI value={f.nb} onChange={(v) => upd({ nb: v })} aria-label="Nombre de bouteilles" /></Field>
    </div>
    {T === 'carton' ? <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
      <Field label="Bouteilles par carton"><NI value={f.parCarton} onChange={(v) => upd({ parCarton: v })} aria-label="Bouteilles par carton" /></Field>
      <Field label="Cartons" help={num(f.parCarton) > 0 && num(f.nb) > 0 ? `Calculé : ${Math.ceil(num(f.nb) / num(f.parCarton))}` : undefined}><NI value={f.nbCartons} onChange={(v) => upd({ nbCartons: v })} aria-label="Nombre de cartons" /></Field>
      <Field label="Destinataire"><TI value={f.destinataire} onChange={(v) => upd({ destinataire: v })} aria-label="Destinataire" /></Field>
      <Field label="Référence (commande, DAE…)"><TI value={f.ref} onChange={(v) => upd({ ref: v })} aria-label="Référence" /></Field>
    </div> : null}
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
      <Field label="Code du lot"><TI value={f.code} onChange={(v) => upd({ code: v })} aria-label="Code du lot" /></Field>
      <Field label="Désignation"><TI value={f.designation} onChange={(v) => upd({ designation: v })} placeholder="ex. Brut — étiquette export" /></Field>
    </div>
    <CodifCode db={db} Rd={R} type={stade} f={f} upd={upd} old={old} stadeFixe={stade} ctxFixe={ctx} />
    <OperateursPicker value={f.operateurs} onChange={(v) => upd({ operateurs: v })} />
    <Field label="Notes"><TA value={f.notes} onChange={(v) => upd({ notes: v })} rows={2} /></Field>
  </FormSheet>);
}
function HabillageSec() {
  const { db, camp, confirm, act, showFini } = useApp(); const lect = useLectureSeule('degorgement'); const [form, setForm] = useState(null); const [ren, setRen] = useState(null);
  const H = [...habillages(db)].sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.code).localeCompare(String(a.code)));
  const suppr = async (h) => { if (await confirm({ title: `Supprimer « ${h.code} » ?`, body: 'Cette suppression est définitive.', ok: 'Supprimer', danger: true })) act((d) => habillageDelete(d, h.id), 'Opération supprimée.'); };
  return (<Sec title="Habillage & mise en carton" right={lect || camp.figee ? null : <><Btn kind="primary" disabled={!(db.lotsFinis || []).length} onClick={() => setForm({ type: 'habillage' })}>＋ Habillage</Btn><Btn disabled={!(db.lotsFinis || []).length} onClick={() => setForm({ type: 'carton' })}>＋ Mise en carton</Btn></>}>
    <div data-habillages="">
      <Tbl rows={H} empty="Aucun habillage ni mise en carton enregistré." cols={[
        { h: 'Opération', r: (h) => (h.type === 'carton' ? 'Mise en carton' : h.source && h.source.type === 'habillage' ? 'Réétiquetage' : 'Habillage') },
        { h: 'Code', r: (h) => <b translate="no">{h.code}</b> }, { h: 'Date', r: (h) => <span className="num">{fmtDate(h.date)}{h.heure ? ` ${h.heure}` : ''}</span> },
        { h: 'Lot d’origine', r: (h) => { const f = habillageFini(db, h); return <span translate="no">{habSourceNom(db, h.source)}{f && !(h.source.type === 'fini') ? <button type="button" className="ml-1 text-xs text-ink2 underline" onClick={() => showFini(f.id)}>{f.code}</button> : null}</span>; } },
        { h: 'Bouteilles', cls: 'r', r: (h) => <span className="num">{fmt(h.nb)}</span> },
        { h: 'Cartons', cls: 'r', r: (h) => (h.type === 'carton' ? <span className="num">{h.nbCartons != null ? fmt(h.nbCartons) : '—'}</span> : <span className="text-xs text-ink2">{fmt(habillageRestant(db, { type: 'habillage', id: h.id }, 'carton'))} à cartonner</span>) },
        { h: 'Opérateur(s)', r: (h) => <OperateursChips ids={h.operateurs} /> },
        { h: '', r: (h) => (lect ? null : <div className="flex flex-wrap gap-1">
          <Btn size="sm" onClick={() => setForm({ editId: h.id, type: h.type })}>Modifier</Btn>
          {h.type !== 'carton' ? <><Btn size="sm" onClick={() => setForm({ type: 'carton', preset: { source: { type: 'habillage', id: h.id }, nb: String(habillageRestant(db, { type: 'habillage', id: h.id }, 'carton')) } })}>Mettre en carton</Btn><Btn size="sm" onClick={() => setForm({ type: 'habillage', preset: { source: { type: 'habillage', id: h.id }, nb: String(habillageRestant(db, { type: 'habillage', id: h.id }, 'habillage')) } })}>Réétiqueter</Btn></> : null}
          <Btn size="sm" onClick={() => setRen(h)}>Changer le code</Btn><Btn size="sm" kind="ghost" onClick={() => suppr(h)}>Supprimer</Btn></div>) }]} />
      <p className="help mt-2">Un réétiquetage crée un nouveau lot habillé lié au précédent, qui reste intact. Le code suit la règle « Habillage » ou « Mise en carton » de Paramètres › Codification des lots.</p>
    </div>
    {form ? <HabillageForm type={form.type} editId={form.editId} preset={form.preset} onClose={() => setForm(null)} /> : null}
    {ren ? <RenommerLot kind="habillage" id={ren.id} code={ren.code} onFin={() => setRen(null)} /> : null}
  </Sec>);
}

// codes d'un lot : code chez le fournisseur, anciens codes (cherchables), règle de codification ; changer le code (lot fini, habillage)
function CodesLot({ kind, x }) {
  const { db } = useApp(); const lect = useLectureSeule(kind === 'lot' ? 'cuverie' : 'degorgement'); const [ren, setRen] = useState(false);
  if (!x) return null; const P = x.codesPrecedents || []; const c = x.codif; const st = c ? codifStadeDef(c.stade) : null;
  if (!P.length && !x.codeFournisseur && !c && kind === 'lot') return null;
  return (<div className="mb-5 flex flex-wrap items-center gap-2 text-sm" data-codes-lot="">
    {x.codeFournisseur ? <Chip>Code chez le fournisseur : <b translate="no">{x.codeFournisseur}</b></Chip> : null}
    {c && st ? <Chip>🏷 {st.label}{c.manuel ? ' · modifié à la main' : ''}</Chip> : null}
    {P.map((p, i) => <Chip key={i} title={[p.motif, p.jusquau ? `jusqu’au ${fmtDate(p.jusquau)}` : ''].filter(Boolean).join(' — ')}>Ancien code : <span translate="no">{p.code}</span></Chip>)}
    {kind !== 'lot' && !lect ? <Btn size="sm" onClick={() => setRen(true)}>Changer le code</Btn> : null}
    {ren ? <RenommerLot kind={kind} id={x.id} code={x.code} onFin={() => setRen(false)} /> : null}
  </div>);
}
function HabillagesDuFini({ fini }) {
  const { db } = useApp(); const H = habillages(db).filter((h) => { const f = habillageFini(db, h); return f && f.id === fini.id; });
  if (!H.length) return null;
  return (<Sec title="Habillages et mises en carton" className="mb-5"><Tbl rows={H} cols={[{ h: 'Opération', r: (h) => (h.type === 'carton' ? 'Mise en carton' : h.source.type === 'habillage' ? 'Réétiquetage' : 'Habillage') }, { h: 'Code', r: (h) => <b translate="no">{h.code}</b> }, { h: 'Date', r: (h) => <span className="num">{fmtDate(h.date)}</span> }, { h: 'Bouteilles', cls: 'r', r: (h) => <span className="num">{fmt(h.nb)}</span> }, { h: 'Destinataire', r: (h) => h.destinataire || '—' }]} />
    <p className="help mt-1">Encore à habiller : {fmt(habillageRestant(db, { type: 'fini', id: fini.id }, 'habillage'))} bouteille(s).</p></Sec>);
}
