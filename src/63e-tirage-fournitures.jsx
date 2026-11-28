/* ============ TIRAGES › FOURNITURES (0.42.0-alpha.3) : fournitures de tirage, retours, fournitures d'un lot de tirage ============
   0.44.0-alpha.2 : contrôle de réception de la verrerie et fiche d'enregistrement de la chaîne (HACCP) retirés.
   Les fournitures sont les intrants (matières sèches et adjuvants) : aucun stock en double, la vue Fournitures les présente filtrées. */

// fiche du produit (Intrants) : type de fourniture, caractéristiques, suivi du stock
function FournitureProduitBox({ f, set }) {
  const fo = f.fourniture || {}; const auto = fournitureTypeDe({ categorie: f.categorie, nom: f.nom }); const type = fo.type !== undefined ? fo.type : auto; const def = fournitureTypeDef(type);
  const setFo = (p) => set('fourniture', { type, caracs: fo.caracs || {}, ...p });
  return (<div className="rounded-md border border-line px-3 py-2" data-produit-fourniture="">
    <div className="mb-1 text-sm font-semibold">Fourniture de tirage</div>
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
      <Field label="Type de fourniture" help={fo.type === undefined && auto ? 'Proposé d’après le nom.' : undefined}><SI plain value={type || ''} onChange={(v) => setFo({ type: v })} options={[{ value: '', label: 'Pas une fourniture de tirage' }, ...FOURNITURE_TYPES.map((t) => ({ value: t.id, label: t.label }))]} aria-label="Type de fourniture" /></Field>
      {def ? def.caracs.map((k) => <Field key={k} label={FOURNITURE_CARACS[k]}>{k === 'format' ? <SI plain value={(fo.caracs || {}).format || ''} onChange={(v) => setFo({ caracs: { ...(fo.caracs || {}), format: v } })} options={[{ value: '', label: '—' }, ...TIRAGE_FORMATS.map((t) => ({ value: t.id, label: t.label }))]} aria-label="Format de la bouteille" />
        : <TI value={(fo.caracs || {})[k] || ''} onChange={(v) => setFo({ caracs: { ...(fo.caracs || {}), [k]: v } })} aria-label={FOURNITURE_CARACS[k]} />}</Field>) : null}
    </div>
    <div className="mt-2"><Check checked={f.suiviStock !== false} onChange={(v) => set('suiviStock', v)} label="Suivi du stock : décompter les quantités utilisées (sinon, suivi par lot fournisseur sans décompte)" /></div>
  </div>);
}

// fournitures d'un lot de tirage : quantités calculées (cols + casse) ou saisies, lot fournisseur, alertes
function FournituresTirageBox({ db, Rd, f, upd, F0, types, titre }) { // 0.50.0-alpha.2 : types proposés (mise en bouteille : bouchon de mise, capsule de surbouchage)
  const L = f.fournitures || []; const t = { formats: F0, casse: num(f.casse) }; const setL = (i, p) => upd({ fournitures: L.map((x, k) => (k === i ? { ...x, ...p } : x)) });
  const P = fournituresTirage(db).filter((p) => p.actif !== false || L.some((x) => x.produitId === p.id)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const arrs = (pid) => (db.arrivages || []).filter((a) => a.produitId === pid).map((a) => ({ a, rest: arrivalRest(Rd, a) })).sort((x, y) => (x.a.date < y.a.date ? -1 : 1));
  const proposer = () => { const N = tirageFournituresProposees(db, Rd, t, types).filter((x) => !L.some((y) => y.produitId === x.produitId)); upd({ fournitures: [...L, ...N] }); };
  const al = fournituresAlertes(db, Rd, L.map((x) => ({ ...x, calc: fournitureQteTirage(db, prodOf(db, x.produitId), t) })), t);
  return (<div className="rounded-md border border-line p-3 grid gap-2" data-fournitures-tirage="">
    <div className="flex flex-wrap items-center gap-2"><span className="lbl">{titre || 'Fournitures du lot (bouteilles, obturateurs, capsules…)'}</span>
      <Btn size="sm" onClick={proposer} disabled={!F0.length}>Proposer d’après les formats</Btn><Btn size="sm" onClick={() => upd({ fournitures: [...L, { produitId: '', arrivageId: '' }] })}>＋ Fourniture</Btn></div>
    {L.map((x, i) => { const p = prodOf(db, x.produitId); const calc = x.produitId ? fournitureQteTirage(db, p, t) : null; const A = x.produitId ? arrs(x.produitId) : []; const man = !!x.manuel || calc == null;
      return (<div key={i} className="flex flex-wrap items-end gap-2" data-fourniture-ligne={i}>
        <Field label="Fourniture"><SI plain value={x.produitId} onChange={(v) => { const a = arrs(v).find((y) => y.rest > 0); setL(i, { produitId: v, arrivageId: a ? a.a.id : '', manuel: false, qty: '' }); }} options={[{ value: '', label: 'Fourniture…' }, ...P.map((q) => ({ value: q.id, label: `${q.nom} · ${(fournitureTypeDef(fournitureTypeDe(q)) || {}).label || ''}`, donnee: true }))]} aria-label={`Fourniture n° ${i + 1}`} /></Field>
        <Field label="Lot fournisseur"><SI plain value={x.arrivageId} onChange={(v) => setL(i, { arrivageId: v })} options={[{ value: '', label: A.length ? 'Lot fournisseur…' : 'Aucun arrivage' }, ...A.map((y) => ({ value: y.a.id, label: `${y.a.numLot} · reste ${fmt(y.rest)}`, donnee: true }))]} aria-label={`Lot fournisseur de la fourniture ${i + 1}`} /></Field>
        <Field label={man ? 'Quantité' : 'Quantité (cols + casse)'}><NI value={man ? (x.qty ?? '') : String(calc)} onChange={(v) => setL(i, { qty: v, manuel: true })} aria-label={`Quantité de la fourniture ${i + 1}`} /></Field>
        {x.manuel && calc != null ? <Btn size="sm" kind="ghost" onClick={() => setL(i, { manuel: false, qty: '' })}>{`↺ ${fmt(calc)}`}</Btn> : null}
        {x.produitId && !fournitureSuivi(p) ? <Chip>non décompté</Chip> : null}
        <Btn size="sm" kind="ghost" onClick={() => upd({ fournitures: L.filter((y, k) => k !== i) })} aria-label="Retirer la fourniture">✕</Btn>
      </div>); })}
    {!L.length ? <p className="help">Aucune fourniture : « Proposer d’après les formats » choisit la bouteille de chaque format, l’obturateur et la capsule les plus en stock.</p> : null}
    {al.length ? <ul className="text-sm text-warn" data-fournitures-alertes="">{al.map((a) => <li key={a}>{`⚠ ${a}`}</li>)}</ul> : null}
  </div>);
}

// retour au fournisseur : sortie de stock tracée (régularisation « retour ») avec le bon et la raison
function RetourFournisseurForm({ arrivageId, onClose }) {
  const { db, R, act, uid, defaultDate } = useApp(); const a = (db.arrivages || []).find((x) => x.id === arrivageId) || {};
  const [f, set] = useDraft({ date: a.date > defaultDate ? a.date : defaultDate, qty: '', bon: '', raison: '' });
  const save = () => { const x = act((d) => fournitureRetourSave(d, { ...f, arrivageId }, uid), 'Retour au fournisseur enregistré.'); if (x && x.ok) onClose(); };
  return (<FormSheet title={<span>Retour au fournisseur — <span translate="no">{`${prodOf(db, a.produitId).nom || ''} · lot ${a.numLot || ''}`}</span></span>} sub={`Restant : ${fmt(arrivalRest(R, a))}`} onClose={onClose} onSave={save}>
    <G n={3}><Field label="Date"><DI value={f.date} onChange={(v) => set('date', v)} /></Field><Field label="Quantité retournée"><NI value={f.qty} onChange={(v) => set('qty', v)} aria-label="Quantité retournée" /></Field><Field label="N° de bon de retour"><TI value={f.bon} onChange={(v) => set('bon', v)} aria-label="N° de bon de retour" /></Field></G>
    <Field label="Raison du retour"><TA value={f.raison} onChange={(v) => set('raison', v)} rows={2} aria-label="Raison du retour" /></Field>
  </FormSheet>);
}

// sous-onglet Fournitures : articles de tirage (filtrés depuis les intrants), lots fournisseurs, retours
function TirageFournitures() {
  const { db, R, openDocs } = useApp(); const lect = useLectureSeule('intrants'); const [type, setType] = useState(''); const [ret, setRet] = useState(null); const [prod, setProd] = useState(null); const [arr, setArr] = useState(null);
  const P = fournituresTirage(db, type).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const lots = (p) => (db.arrivages || []).filter((a) => a.produitId === p.id).map((a) => ({ a, rest: arrivalRest(R, a) })).sort((x, y) => (x.a.date < y.a.date ? 1 : -1));
  const RT = fournitureRetours(db).filter((x) => P.some((p) => p.id === x.produitId));
  return (<div data-tirage-fournitures="">
    <Aide id="tirage-fournitures" titre="ℹ Fournitures = intrants" resume="Vos fournitures sont vos intrants : aucun stock en double."><span>Bouteilles, obturateurs, capsules et adjuvants sont les intrants de l’exploitation (Intrants › Produits) : une fourniture se crée ou se reçoit ici comme là-bas, sans stock en double.</span></Aide>
    <div className="my-3 flex flex-wrap items-center gap-2"><SI plain value={type} onChange={setType} style={{ width: 'auto' }} options={[{ value: '', label: 'Toutes les fournitures' }, ...FOURNITURE_TYPES.map((t) => ({ value: t.id, label: t.label }))]} aria-label="Type de fourniture" />
      {lect ? null : <><Btn onClick={() => setProd({})}>＋ Article</Btn><Btn onClick={() => setArr({})}>＋ Réception</Btn></>}</div>
    {!P.length ? <Empty>Aucune fourniture de tirage : créez un article (matière sèche) et choisissez son type.</Empty> : P.map((p) => { const L = lots(p); const c = fournitureCaracs(p); const def = fournitureTypeDef(fournitureTypeDe(p)) || { caracs: [] };
      return (<div key={p.id} className="card mb-3 p-3" data-fourniture={p.id}>
        <div className="flex flex-wrap items-center gap-2"><b translate="no">{p.nom}</b><Chip>{def.label}</Chip>{fournitureSuivi(p) ? <Chip tone="ok">{`stock ${fmt(sum(L, (x) => x.rest))} ${p.unite}`}</Chip> : <Chip>suivi par lot, sans décompte</Chip>}{p.actif === false ? <Chip>inactif</Chip> : null}
          {lect ? null : <Btn size="sm" className="ml-auto" onClick={() => setProd({ id: p.id })}>Modifier</Btn>}</div>
        {def.caracs.some((k) => c[k]) || fournitureFormat(p) ? <div className="mt-1 text-sm text-ink2" translate="no">{def.caracs.filter((k) => c[k] || (k === 'format' && fournitureFormat(p))).map((k) => `${FOURNITURE_CARACS[k]} : ${k === 'format' ? (tirageFormat(c.format || fournitureFormat(p)) || {}).label : c[k]}`).join(' · ')}</div> : null}
        <Tbl rows={L.map((x) => ({ ...x, id: x.a.id }))} empty="Aucun lot fournisseur reçu." cols={[{ h: 'Lot fournisseur', r: (x) => <b translate="no">{x.a.numLot}</b> }, { h: 'Reçu le', r: (x) => <span className="num">{fmtDate(x.a.date)}</span> }, { h: 'Reçu', cls: 'r', r: (x) => <span className="num">{fmt(x.a.qty)}</span> }, { h: 'Restant', cls: 'r', r: (x) => <span className="num">{fmt(x.rest)}</span> },
          { h: 'Documents', cls: 'r', r: (x) => docsOf(db, 'arrivage', x.a.id).length },
          { h: '', r: (x) => (lect ? null : <div className="flex flex-wrap gap-1"><Btn size="sm" onClick={() => setRet(x.a.id)} disabled={x.rest <= 0}>↩ Retour</Btn><Btn size="sm" kind="ghost" onClick={() => openDocs({ type: 'arrivage', id: x.a.id }, 'arrivage', `${p.nom} · lot ${x.a.numLot}`)}>📎</Btn></div>) }]} />
      </div>); })}
    {RT.length ? <Sec title="Retours au fournisseur"><Tbl rows={RT} cols={[{ h: 'Date', r: (x) => <span className="num">{fmtDate(x.date)}</span> }, { h: 'Fourniture', r: (x) => <span translate="no">{prodOf(db, x.produitId).nom}</span> }, { h: 'Lot', r: (x) => <span translate="no">{((db.arrivages || []).find((a) => a.id === x.arrivageId) || {}).numLot}</span> }, { h: 'Quantité', cls: 'r', r: (x) => <span className="num">{fmt(-x.qty)}</span> }, { h: 'Bon', r: (x) => <span translate="no">{(x.retour || {}).bon || '—'}</span> }, { h: 'Raison', r: (x) => x.notes }]} /></Sec> : null}
    {ret ? <RetourFournisseurForm arrivageId={ret} onClose={() => setRet(null)} /> : null}
    {prod ? <ProduitForm id={prod.id} categorie0="sec" onClose={() => setProd(null)} /> : null}
    {arr ? <ArrivageForm onClose={() => setArr(null)} /> : null}
  </div>);
}
