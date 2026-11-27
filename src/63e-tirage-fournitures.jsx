/* ============ TIRAGES › FOURNITURES (0.42.0-alpha.3) : fournitures de tirage, contrôle de réception de la verrerie, retours,
   fournitures d'un lot de tirage, fiche d'enregistrement de la chaîne (HACCP) ============
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
function FournituresTirageBox({ db, Rd, f, upd, F0 }) {
  const L = f.fournitures || []; const t = { formats: F0, casse: num(f.casse) }; const setL = (i, p) => upd({ fournitures: L.map((x, k) => (k === i ? { ...x, ...p } : x)) });
  const P = fournituresTirage(db).filter((p) => p.actif !== false || L.some((x) => x.produitId === p.id)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const arrs = (pid) => (db.arrivages || []).filter((a) => a.produitId === pid).map((a) => ({ a, rest: arrivalRest(Rd, a) })).sort((x, y) => (x.a.date < y.a.date ? -1 : 1));
  const proposer = () => { const N = tirageFournituresProposees(db, Rd, t).filter((x) => !L.some((y) => y.produitId === x.produitId)); upd({ fournitures: [...L, ...N] }); };
  const al = fournituresAlertes(db, Rd, L.map((x) => ({ ...x, calc: fournitureQteTirage(db, prodOf(db, x.produitId), t) })), t);
  return (<div className="rounded-md border border-line p-3 grid gap-2" data-fournitures-tirage="">
    <div className="flex flex-wrap items-center gap-2"><span className="lbl">Fournitures du lot (bouteilles, obturateurs, capsules…)</span>
      <Btn size="sm" onClick={proposer} disabled={!F0.length}>Proposer d’après les formats</Btn><Btn size="sm" onClick={() => upd({ fournitures: [...L, { produitId: '', arrivageId: '' }] })}>＋ Fourniture</Btn></div>
    {L.map((x, i) => { const p = prodOf(db, x.produitId); const calc = x.produitId ? fournitureQteTirage(db, p, t) : null; const A = x.produitId ? arrs(x.produitId) : []; const man = !!x.manuel || calc == null;
      return (<div key={i} className="flex flex-wrap items-end gap-2" data-fourniture-ligne={i}>
        <Field label="Fourniture"><SI plain value={x.produitId} onChange={(v) => { const a = arrs(v).find((y) => y.rest > 0 && !(y.a.controleReception && y.a.controleReception.decision === 'refuse')); setL(i, { produitId: v, arrivageId: a ? a.a.id : '', manuel: false, qty: '' }); }} options={[{ value: '', label: 'Fourniture…' }, ...P.map((q) => ({ value: q.id, label: `${q.nom} · ${(fournitureTypeDef(fournitureTypeDe(q)) || {}).label || ''}`, donnee: true }))]} aria-label={`Fourniture n° ${i + 1}`} /></Field>
        <Field label="Lot fournisseur"><SI plain value={x.arrivageId} onChange={(v) => setL(i, { arrivageId: v })} options={[{ value: '', label: A.length ? 'Lot fournisseur…' : 'Aucun arrivage' }, ...A.map((y) => ({ value: y.a.id, label: `${y.a.numLot} · reste ${fmt(y.rest)} · ${arrivageControleEtat(y.a).label}`, donnee: true }))]} aria-label={`Lot fournisseur de la fourniture ${i + 1}`} /></Field>
        <Field label={man ? 'Quantité' : 'Quantité (cols + casse)'}><NI value={man ? (x.qty ?? '') : String(calc)} onChange={(v) => setL(i, { qty: v, manuel: true })} aria-label={`Quantité de la fourniture ${i + 1}`} /></Field>
        {x.manuel && calc != null ? <Btn size="sm" kind="ghost" onClick={() => setL(i, { manuel: false, qty: '' })}>{`↺ ${fmt(calc)}`}</Btn> : null}
        {x.produitId && !fournitureSuivi(p) ? <Chip>non décompté</Chip> : null}
        <Btn size="sm" kind="ghost" onClick={() => upd({ fournitures: L.filter((y, k) => k !== i) })} aria-label="Retirer la fourniture">✕</Btn>
      </div>); })}
    {!L.length ? <p className="help">Aucune fourniture : « Proposer d’après les formats » choisit la bouteille de chaque format, l’obturateur et la capsule les plus en stock.</p> : null}
    {al.length ? <ul className="text-sm text-warn" data-fournitures-alertes="">{al.map((a) => <li key={a}>{`⚠ ${a}`}</li>)}</ul> : null}
  </div>);
}

// contrôle de réception de la verrerie (échantillon selon la taille du lot, mesures, défauts, décision, visa)
function ControleVerreForm({ arrivageId, onClose }) {
  const { db, act, uid, defaultDate } = useApp(); const a = (db.arrivages || []).find((x) => x.id === arrivageId) || {}; const c0 = a.controleReception || {}; const r = controleVerreReglages(db);
  const [f, set] = useDraft({ date: c0.date || (a.date > defaultDate ? a.date : defaultDate), heure: c0.heure || '', echantillon: String(c0.echantillon || controleVerreEchantillon(db, a.qty)), mesures: (c0.mesures || []).map((m) => ({ ...m })), defauts: { ...(c0.defauts || {}) }, decision: c0.decision || '', note: c0.note || '', visa: c0.visa || '' });
  const ev = controleVerreEvaluer(db, f); const M = f.mesures.length ? f.mesures : []; const setM = (i, p) => set('mesures', M.map((m, k) => (k === i ? { ...m, ...p } : m)));
  const save = () => { const x = act((d) => arrivageControleSave(d, arrivageId, f, uid), 'Contrôle de réception enregistré.'); if (x && x.ok) onClose(); };
  return (<FormSheet wide title={<span>Contrôle de réception — <span translate="no">{`${prodOf(db, a.produitId).nom || ''} · lot ${a.numLot || ''}`}</span></span>} sub={`Lot de ${fmt(a.qty)} : échantillon de ${fmt(controleVerreEchantillon(db, a.qty))} cols ; non conforme à partir de ${fmt(r.defautsMax)} défauts.`} onClose={onClose} onSave={save}>
    <div data-controle-verre="">
      <G n={3}><Field label="Date du contrôle"><DI value={f.date} onChange={(v) => set('date', v)} /></Field><Field label="Heure"><TI value={f.heure} onChange={(v) => set('heure', v)} placeholder="hh:mm" /></Field><Field label="Cols contrôlés"><NI value={f.echantillon} onChange={(v) => set('echantillon', v)} aria-label="Cols contrôlés" /></Field></G>
      <Group label="Mesures (hauteur, diamètre, bague en mm)"><div className="grid gap-1">
        {M.map((m, i) => <div key={i} className="flex flex-wrap items-center gap-2"><span className="w-8 text-xs text-ink2">{i + 1}</span>{['hauteur', 'diametre', 'bague'].map((k) => <NI key={k} value={m[k] ?? ''} onChange={(v) => setM(i, { [k]: v })} placeholder={k === 'hauteur' ? 'hauteur' : k === 'diametre' ? 'diamètre' : 'bague'} aria-label={`${k === 'hauteur' ? 'Hauteur' : k === 'diametre' ? 'Diamètre' : 'Bague'} ${i + 1}`} style={{ width: 110 }} />)}<Btn size="sm" kind="ghost" onClick={() => set('mesures', M.filter((y, k) => k !== i))} aria-label="Retirer la mesure">✕</Btn></div>)}
        <div><Btn size="sm" onClick={() => set('mesures', [...M, {}])}>＋ Mesure</Btn></div>
        {['hauteur', 'diametre', 'bague'].filter((k) => ev.stats[k]).length ? <p className="text-sm" data-controle-stats="">{['hauteur', 'diametre', 'bague'].filter((k) => ev.stats[k]).map((k) => <span key={k} className="mr-3"><span>{k === 'hauteur' ? 'Hauteur' : k === 'diametre' ? 'Diamètre' : 'Bague'}</span><span translate="no">{` : ${fmt(ev.stats[k].min, 2)} → ${fmt(ev.stats[k].max, 2)} · x̄ ${fmt(ev.stats[k].moy, 2)}`}</span>{ev.stats[k].hors ? <span className="text-bad">{` — hors tolérance : ${ev.stats[k].hors}`}</span> : null}</span>)}</p> : null}
      </div></Group>
      <Group label="Défauts visuels (nombre de cols)"><div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        {CONTROLE_VERRE_DEFAUTS.map(([k, l]) => <Field key={k} label={l}><NI value={f.defauts[k] ?? ''} onChange={(v) => set('defauts', { ...f.defauts, [k]: v })} aria-label={l} /></Field>)}
      </div></Group>
      <p className={cx('my-2 text-sm font-semibold', ev.conforme ? 'text-ok' : 'text-bad')} data-controle-resultat="">{ev.conforme ? `Conforme : ${fmt(ev.nDefauts)} défaut(s), aucune mesure hors tolérance.` : `Non conforme : ${fmt(ev.nDefauts)} défaut(s), ${fmt(ev.hors)} mesure(s) hors tolérance.`}</p>
      <G n={3}><Field label="Décision"><SI plain value={f.decision} onChange={(v) => set('decision', v)} options={[{ value: '', label: 'Décision…' }, ...CONTROLE_DECISIONS.map((d) => ({ value: d.id, label: d.label }))]} aria-label="Décision" /></Field><Field label="Visa"><TI value={f.visa} onChange={(v) => set('visa', v)} aria-label="Visa du contrôle" /></Field><div /></G>
      <Field label="Note" help={f.decision === 'derogation' ? 'Raison de la dérogation (obligatoire).' : undefined}><TA value={f.note} onChange={(v) => set('note', v)} rows={2} aria-label="Note du contrôle" /></Field>
    </div>
  </FormSheet>);
}

// retour au fournisseur : sortie de stock tracée (régularisation « retour ») avec le bon et la raison
function RetourFournisseurForm({ arrivageId, onClose }) {
  const { db, R, act, uid, defaultDate } = useApp(); const a = (db.arrivages || []).find((x) => x.id === arrivageId) || {};
  const [f, set] = useDraft({ date: a.date > defaultDate ? a.date : defaultDate, qty: '', bon: '', raison: a.controleReception && a.controleReception.decision === 'refuse' ? 'Lot refusé au contrôle de réception.' : '' });
  const save = () => { const x = act((d) => fournitureRetourSave(d, { ...f, arrivageId }, uid), 'Retour au fournisseur enregistré.'); if (x && x.ok) onClose(); };
  return (<FormSheet title={<span>Retour au fournisseur — <span translate="no">{`${prodOf(db, a.produitId).nom || ''} · lot ${a.numLot || ''}`}</span></span>} sub={`Restant : ${fmt(arrivalRest(R, a))}`} onClose={onClose} onSave={save}>
    <G n={3}><Field label="Date"><DI value={f.date} onChange={(v) => set('date', v)} /></Field><Field label="Quantité retournée"><NI value={f.qty} onChange={(v) => set('qty', v)} aria-label="Quantité retournée" /></Field><Field label="N° de bon de retour"><TI value={f.bon} onChange={(v) => set('bon', v)} aria-label="N° de bon de retour" /></Field></G>
    <Field label="Raison du retour"><TA value={f.raison} onChange={(v) => set('raison', v)} rows={2} aria-label="Raison du retour" /></Field>
  </FormSheet>);
}

// réglages du contrôle de la verrerie (valeurs d'exemple à vérifier)
function ControleVerreReglagesCard() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('tirage'); const r = controleVerreReglages(db);
  const [f, set] = useDraft({ seuilLot: String(r.seuilLot), nPetit: String(r.nPetit), nGrand: String(r.nGrand), defautsMax: String(r.defautsMax), tolerances: JSON.parse(JSON.stringify(r.tolerances)) });
  const T = (k, b, v) => set('tolerances', { ...f.tolerances, [k]: { ...(f.tolerances[k] || {}), [b]: v } });
  return (<div className="card p-3" data-controle-reglages="">
    <div className="mb-2 flex flex-wrap items-center gap-2"><b>Contrôle de réception de la verrerie</b>{r.aVerifier ? <Chip tone="warn">à vérifier</Chip> : null}</div>
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
      <Field label="Lot au-delà duquel l’échantillon est grand (cols)"><NI value={f.seuilLot} onChange={(v) => set('seuilLot', v)} aria-label="Seuil de taille du lot" /></Field>
      <Field label="Échantillon d’un petit lot"><NI value={f.nPetit} onChange={(v) => set('nPetit', v)} aria-label="Échantillon petit lot" /></Field>
      <Field label="Échantillon d’un grand lot"><NI value={f.nGrand} onChange={(v) => set('nGrand', v)} aria-label="Échantillon grand lot" /></Field>
      <Field label="Non conforme à partir de (défauts)"><NI value={f.defautsMax} onChange={(v) => set('defautsMax', v)} aria-label="Défauts maximum" /></Field>
      {['hauteur', 'diametre', 'bague'].map((k) => <Field key={k} label={`${k === 'hauteur' ? 'Hauteur' : k === 'diametre' ? 'Diamètre' : 'Bague'} : min / max (mm)`}><div className="flex gap-1"><NI value={(f.tolerances[k] || {}).min ?? ''} onChange={(v) => T(k, 'min', v)} aria-label={`Tolérance ${k} min`} /><NI value={(f.tolerances[k] || {}).max ?? ''} onChange={(v) => T(k, 'max', v)} aria-label={`Tolérance ${k} max`} /></div></Field>)}
    </div>
    {lect ? null : <div className="mt-2 flex gap-2"><Btn onClick={() => act((d) => controleVerreReglagesSet(d, { ...f, aVerifier: true }, uid), 'Réglages enregistrés.')}>Enregistrer</Btn><Btn kind="ghost" onClick={() => act((d) => controleVerreReglagesSet(d, { ...f, aVerifier: false }, uid), 'Réglages vérifiés.')}>✓ Vérifiés</Btn></div>}
  </div>);
}

// sous-onglet Fournitures : articles de tirage (filtrés depuis les intrants), lots fournisseurs, contrôle, retours
function TirageFournitures() {
  const { db, R, openDocs } = useApp(); const lect = useLectureSeule('intrants'); const [type, setType] = useState(''); const [ctl, setCtl] = useState(null); const [ret, setRet] = useState(null); const [prod, setProd] = useState(null); const [arr, setArr] = useState(null);
  const P = fournituresTirage(db, type).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const lots = (p) => (db.arrivages || []).filter((a) => a.produitId === p.id).map((a) => ({ a, rest: arrivalRest(R, a) })).sort((x, y) => (x.a.date < y.a.date ? 1 : -1));
  const RT = fournitureRetours(db).filter((x) => P.some((p) => p.id === x.produitId));
  return (<div data-tirage-fournitures="">
    <Notice tone="info" title="Fournitures = intrants">Bouteilles, obturateurs, capsules et adjuvants sont les intrants de l’exploitation (Intrants › Produits) : une fourniture se crée ou se reçoit ici comme là-bas, sans stock en double.</Notice>
    <div className="my-3 flex flex-wrap items-center gap-2"><SI plain value={type} onChange={setType} style={{ width: 'auto' }} options={[{ value: '', label: 'Toutes les fournitures' }, ...FOURNITURE_TYPES.map((t) => ({ value: t.id, label: t.label }))]} aria-label="Type de fourniture" />
      {lect ? null : <><Btn onClick={() => setProd({})}>＋ Article</Btn><Btn onClick={() => setArr({})}>＋ Réception</Btn></>}</div>
    {!P.length ? <Empty>Aucune fourniture de tirage : créez un article (matière sèche) et choisissez son type.</Empty> : P.map((p) => { const L = lots(p); const c = fournitureCaracs(p); const def = fournitureTypeDef(fournitureTypeDe(p)) || { caracs: [] };
      return (<div key={p.id} className="card mb-3 p-3" data-fourniture={p.id}>
        <div className="flex flex-wrap items-center gap-2"><b translate="no">{p.nom}</b><Chip>{def.label}</Chip>{fournitureSuivi(p) ? <Chip tone="ok">{`stock ${fmt(sum(L, (x) => x.rest))} ${p.unite}`}</Chip> : <Chip>suivi par lot, sans décompte</Chip>}{p.actif === false ? <Chip>inactif</Chip> : null}
          {lect ? null : <Btn size="sm" className="ml-auto" onClick={() => setProd({ id: p.id })}>Modifier</Btn>}</div>
        {def.caracs.some((k) => c[k]) || fournitureFormat(p) ? <div className="mt-1 text-sm text-ink2" translate="no">{def.caracs.filter((k) => c[k] || (k === 'format' && fournitureFormat(p))).map((k) => `${FOURNITURE_CARACS[k]} : ${k === 'format' ? (tirageFormat(c.format || fournitureFormat(p)) || {}).label : c[k]}`).join(' · ')}</div> : null}
        <Tbl rows={L.map((x) => ({ ...x, id: x.a.id }))} empty="Aucun lot fournisseur reçu." cols={[{ h: 'Lot fournisseur', r: (x) => <b translate="no">{x.a.numLot}</b> }, { h: 'Reçu le', r: (x) => <span className="num">{fmtDate(x.a.date)}</span> }, { h: 'Reçu', cls: 'r', r: (x) => <span className="num">{fmt(x.a.qty)}</span> }, { h: 'Restant', cls: 'r', r: (x) => <span className="num">{fmt(x.rest)}</span> },
          { h: 'Contrôle', r: (x) => { const e = arrivageControleEtat(x.a); return fournitureTypeDe(p) === 'bouteille' || x.a.controleReception ? <Chip tone={e.tone}>{e.label}</Chip> : <span className="text-xs text-ink2">—</span>; } }, { h: 'Documents', cls: 'r', r: (x) => docsOf(db, 'arrivage', x.a.id).length },
          { h: '', r: (x) => (lect ? null : <div className="flex flex-wrap gap-1"><Btn size="sm" onClick={() => setCtl(x.a.id)}>Contrôle</Btn><Btn size="sm" onClick={() => setRet(x.a.id)} disabled={x.rest <= 0}>↩ Retour</Btn><Btn size="sm" kind="ghost" onClick={() => openDocs({ type: 'arrivage', id: x.a.id }, 'arrivage', `${p.nom} · lot ${x.a.numLot}`)}>📎</Btn></div>) }]} />
      </div>); })}
    {RT.length ? <Sec title="Retours au fournisseur"><Tbl rows={RT} cols={[{ h: 'Date', r: (x) => <span className="num">{fmtDate(x.date)}</span> }, { h: 'Fourniture', r: (x) => <span translate="no">{prodOf(db, x.produitId).nom}</span> }, { h: 'Lot', r: (x) => <span translate="no">{((db.arrivages || []).find((a) => a.id === x.arrivageId) || {}).numLot}</span> }, { h: 'Quantité', cls: 'r', r: (x) => <span className="num">{fmt(-x.qty)}</span> }, { h: 'Bon', r: (x) => <span translate="no">{(x.retour || {}).bon || '—'}</span> }, { h: 'Raison', r: (x) => x.notes }]} /></Sec> : null}
    <div className="mt-4"><ControleVerreReglagesCard /></div>
    {ctl ? <ControleVerreForm arrivageId={ctl} onClose={() => setCtl(null)} /> : null}
    {ret ? <RetourFournisseurForm arrivageId={ret} onClose={() => setRet(null)} /> : null}
    {prod ? <ProduitForm id={prod.id} categorie0="sec" onClose={() => setProd(null)} /> : null}
    {arr ? <ArrivageForm onClose={() => setArr(null)} /> : null}
  </div>);
}

// fiche d'enregistrement de la chaîne de tirage (HACCP) : démarrage, contrôles toutes les 2 h, fournitures par lot, fin de journée,
// conditionnement par format et par contenant, incidents, visas
function ChaineHaccp({ ch }) {
  const { db, R, act, uid } = useApp(); const lect = useLectureSeule('tirage') || isLocked(db, ch.dateDebut); const h0 = chantierHaccp(ch);
  const [h, setH] = useState(() => JSON.parse(JSON.stringify(h0))); const [modif, setModif] = useState(false); const u = (p) => { setH((x) => ({ ...x, ...p })); setModif(true); };
  const enr = () => { const r = act((d) => chantierHaccpSet(d, ch.id, h, uid), 'Fiche de la chaîne enregistrée.'); if (r && r.ok) setModif(false); };
  const chV = { ...ch, haccp: h }; const ecarts = chantierHaccpEcarts(db, R, chV); const FO = chantierFournitures(db, ch.id); const cond = chantierConditionnement(db, R, chV);
  const etat = (phase, k) => { const e = (h[phase] || {})[k] || {}; const set = (p) => u({ [phase]: { ...h[phase], [k]: { ...e, ...p } } });
    return (<span className="flex flex-wrap items-center gap-1"><SI plain value={e.ok === true ? 'ok' : e.ok === false ? 'nok' : ''} onChange={(v) => set({ ok: v === 'ok' ? true : v === 'nok' ? false : null })} options={[{ value: '', label: '—' }, { value: 'ok', label: 'Conforme' }, { value: 'nok', label: 'Non conforme' }]} aria-label={`Conformité du point : ${k}`} disabled={lect} /><TI value={e.note || ''} onChange={(v) => set({ note: v })} placeholder="note" aria-label={`Remarque sur le point : ${k}`} style={{ width: 180 }} disabled={lect} /></span>); };
  const liste = (phase, titre) => (<Group label={titre}><div className="grid gap-1" data-chaine-phase={phase}>{chainePoints(chV, phase).map(([k, l]) => <div key={k} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-1"><span className="text-sm">{l}</span>{etat(phase, k)}</div>)}
    {lect ? null : <AjoutPoint onAjout={(label) => u({ ajouts: [...h.ajouts, { id: `aj${Date.now().toString(36)}`, label, phase }] })} />}</div></Group>);
  const K = h.controles; const setK = (i, p) => u({ controles: K.map((c, k) => (k === i ? { ...c, ...p } : c)) }); const PC = chainePoints(chV, 'controles');
  return (<div data-chaine-haccp="">
    {liste('demarrage', 'Démarrage de la ligne')}
    <Group label={`Contrôles en cours de chantier (toutes les ${CHAINE_INTERVALLE_H} h)`}><div className="tblwrap"><table className="tbl" data-chaine-controles=""><thead><tr><th>Date</th><th>Heure</th>{PC.map(([k, l]) => <th key={k} className="text-xs">{l}</th>)}<th>Opérateur</th><th /></tr></thead><tbody>
      {K.map((c, i) => <tr key={i}><td><DI value={c.date || ch.dateDebut} onChange={(v) => setK(i, { date: v })} disabled={lect} /></td><td><TI value={c.heure || ''} onChange={(v) => setK(i, { heure: v })} placeholder="hh:mm" aria-label={`Heure du contrôle de chaîne ${i + 1}`} style={{ width: 80 }} disabled={lect} /></td>
        {PC.map(([k]) => <td key={k}><SI plain value={(c.points || {})[k] === true ? 'ok' : (c.points || {})[k] === false ? 'nok' : ''} onChange={(v) => setK(i, { points: { ...(c.points || {}), [k]: v === 'ok' ? true : v === 'nok' ? false : null } })} options={[{ value: '', label: '—' }, { value: 'ok', label: 'C' }, { value: 'nok', label: 'NC' }]} aria-label={`Point ${k} du contrôle ${i + 1}`} disabled={lect} /></td>)}
        <td><TI value={c.operateur || ''} onChange={(v) => setK(i, { operateur: v })} aria-label={`Opérateur du contrôle de chaîne ${i + 1}`} disabled={lect} /></td><td>{lect ? null : <Btn size="sm" kind="ghost" onClick={() => u({ controles: K.filter((y, k) => k !== i) })} aria-label="Retirer le contrôle">✕</Btn>}</td></tr>)}
    </tbody></table></div>{lect ? null : <Btn size="sm" onClick={() => u({ controles: [...K, { date: K.length ? K[K.length - 1].date : ch.dateDebut, heure: '', points: Object.fromEntries(PC.map(([k]) => [k, true])) }] })}>＋ Contrôle de chaîne</Btn>}</Group>
    <Group label="Fournitures par lot (changement de lot)"><div data-chaine-fournitures="">{FO.length ? FO.map((l) => <div key={l.opId} className="text-sm"><b translate="no">{l.code}</b>{` · ${fmtDate(l.date)} : `}<span translate="no">{l.fournitures.length ? l.fournitures.map((x) => `${x.nom} (lot ${x.numLot || '?'}) ${fmt(x.qty)}`).join(' · ') : '—'}</span></div>) : <p className="help">Aucun lot tiré sur ce chantier.</p>}</div></Group>
    {liste('fin', 'Fin de journée')}
    <Group label="Conditionnement (par format et par contenant)"><div className="grid gap-1" data-chaine-conditionnement="">
      {h.conditionnement.map((c, i) => { const set = (p) => u({ conditionnement: h.conditionnement.map((y, k) => (k === i ? { ...y, ...p } : y)) }); return <div key={i} className="grid items-end gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr)) auto' }}>
        <SI plain value={c.format || 'bouteille'} onChange={(v) => set({ format: v })} options={TIRAGE_FORMATS.map((t) => ({ value: t.id, label: t.label }))} aria-label={`Format du conditionnement ${i + 1}`} disabled={lect} />
        <SI plain value={c.contenant || 'caisse_fil'} onChange={(v) => set({ contenant: v })} options={CHAINE_CONTENANTS.map((t) => ({ value: t.id, label: t.label }))} aria-label={`Contenant ${i + 1}`} disabled={lect} />
        <NI value={c.nb ?? ''} onChange={(v) => set({ nb: v })} placeholder="nombre" aria-label={`Nombre de contenants ${i + 1}`} disabled={lect} /><NI value={c.parUnite ?? ''} onChange={(v) => set({ parUnite: v })} placeholder="cols par contenant" aria-label={`Cols par contenant ${i + 1}`} disabled={lect} />
        {lect ? null : <Btn size="sm" kind="ghost" onClick={() => u({ conditionnement: h.conditionnement.filter((y, k) => k !== i) })} aria-label="Retirer">✕</Btn>}</div>; })}
      {lect ? null : <div><Btn size="sm" onClick={() => u({ conditionnement: [...h.conditionnement, { format: 'bouteille', contenant: 'caisse_fil', nb: '', parUnite: '' }] })}>＋ Contenant</Btn></div>}
      {cond.formats.length ? <p className="text-sm" data-chaine-bilan="">{cond.formats.map((f) => <span key={f.format} className="mr-3"><span>{(tirageFormat(f.format) || { label: f.format }).label}</span> — <span>{`cols tirés : ${fmt(f.cols)}`}</span>{f.contenus != null ? <span>{` · rangés : ${fmt(f.contenus)}`}</span> : null}</span>)}<span>{`Casse : ${fmt(cond.casse)}`}</span></p> : null}
    </div></Group>
    <Group label="Incidents et actions correctives"><div className="grid gap-1" data-chaine-incidents="">
      {h.incidents.map((c, i) => { const set = (p) => u({ incidents: h.incidents.map((y, k) => (k === i ? { ...y, ...p } : y)) }); return <div key={i} className="grid items-end gap-2" style={{ gridTemplateColumns: '90px 1fr 1fr auto' }}><TI value={c.heure || ''} onChange={(v) => set({ heure: v })} placeholder="hh:mm" disabled={lect} /><TI value={c.description || ''} onChange={(v) => set({ description: v })} placeholder="incident" aria-label={`Incident n° ${i + 1}`} disabled={lect} /><TI value={c.action || ''} onChange={(v) => set({ action: v })} placeholder="action corrective" aria-label={`Action corrective ${i + 1}`} disabled={lect} />{lect ? null : <Btn size="sm" kind="ghost" onClick={() => u({ incidents: h.incidents.filter((y, k) => k !== i) })} aria-label="Retirer">✕</Btn>}</div>; })}
      {lect ? null : <div><Btn size="sm" onClick={() => u({ incidents: [...h.incidents, { date: ch.dateDebut, heure: '', description: '', action: '' }] })}>＋ Incident</Btn></div>}
    </div></Group>
    <Group label="Visas"><div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>{CHAINE_VISAS.map((v) => { const x = h.visas.find((y) => y.role === v.id) || {}; return <Field key={v.id} label={v.label}><TI value={x.nom || ''} onChange={(n) => u({ visas: [...h.visas.filter((y) => y.role !== v.id), { role: v.id, nom: n, le: x.le || '' }] })} aria-label={`Visa — ${v.label}`} disabled={lect} /></Field>; })}</div></Group>
    {ecarts.length ? <ul className="my-2 text-sm text-bad" data-chaine-ecarts="">{ecarts.map((e) => <li key={e}>{`⚠ ${e}`}</li>)}</ul> : <p className="my-2 text-sm text-ok" data-chaine-ecarts="">Aucun écart relevé.</p>}
    {lect ? null : <Btn kind="primary" onClick={enr} disabled={!modif}>Enregistrer la fiche de la chaîne</Btn>}
  </div>);
}
function AjoutPoint({ onAjout }) {
  const [v, setV] = useState(''); return (<div className="flex flex-wrap items-center gap-2 pt-1"><TI value={v} onChange={setV} placeholder="Point de contrôle de l’exploitation" aria-label="Point ajouté" style={{ width: 260 }} /><Btn size="sm" onClick={() => { if (v.trim()) { onAjout(v.trim()); setV(''); } }} disabled={!v.trim()}>＋ Point</Btn></div>);
}
