/* ============ TIRAGES › TIRER (0.42.0-alpha.2) : chantiers de tirage, cuves de mixtion, lots tirés, pompe doseuse, prestation ============
   Un chantier (interne ou prestataire sur site) regroupe les lots tirés, la composition de la ligne et les documents de prestation ;
   chaque lot de tirage est tiré soit d'une cuve de mixtion, soit par pompe doseuse / injecteuse (jamais les deux). */

// formats tirés (de la demie au nabuchodonosor) : un lot peut en avoir plusieurs
function FormatsEditor({ formats, onChange, label = 'Cols tirés par format' }) {
  const F = formats && formats.length ? formats : [{ format: 'bouteille', nb: '' }]; const set = (i, p) => onChange(F.map((x, k) => (k === i ? { ...x, ...p } : x)));
  return (<Group label={label}><div className="grid gap-2" data-formats="">
    {F.map((x, i) => <div key={i} className="flex flex-wrap items-end gap-2">
      <SI plain value={x.format} onChange={(v) => set(i, { format: v })} options={TIRAGE_FORMATS.map((t) => ({ value: t.id, label: t.label }))} aria-label={`Format ${i + 1}`} />
      <NI value={x.nb} onChange={(v) => set(i, { nb: v })} placeholder="cols" aria-label={`Cols format ${i + 1}`} />
      {F.length > 1 ? <Btn size="sm" kind="ghost" onClick={() => onChange(F.filter((y, k) => k !== i))} aria-label="Retirer le format">✕</Btn> : null}</div>)}
    <div className="flex flex-wrap items-center gap-2"><Btn size="sm" onClick={() => onChange([...F, { format: 'magnum', nb: '' }])}>＋ Format</Btn><span className="text-sm text-ink2">{`${fmt(sum(F, (x) => x.nb))} cols · ${fmt(tirageEqBouteilles(F.map((x) => ({ ...x, L: (tirageFormat(x.format) || {}).L }))), 0)} équivalent bouteilles · ${fmtL(tirageVolFormats(F))}`}</span></div>
  </div></Group>);
}
// pompe doseuse : consignes (% du volume tiré → mL/col), débit, contrôles en cours de tirage, théorique / réel
function TiragePompeBox({ db, Rd, f, upd }) {
  const P = f.pompe || {}; const C = P.consignes || {}; const setP = (p) => upd({ pompe: { ...P, ...p } }); const setC = (p) => setP({ consignes: { ...C, ...p } });
  const prof = tirageProfil(db); const F = (f.formats || []).filter((x) => num(x.nb) > 0); const ctrl = P.controles || []; const setK = (i, p) => setP({ controles: ctrl.map((c, k) => (k === i ? { ...c, ...p } : c)) });
  const b = tiragePompeBilan(db, Rd, { ...f, formats: F.map((x) => ({ ...x, L: (tirageFormat(x.format) || {}).L })), prepUses: cleanPrepUses(f.prepUses), pompe: { ...P, controles: ctrl.map((c) => ({ ...c, nCols: num(c.nCols), mesure: c.mesure, cible: c.cible })) } });
  return (<div className="rounded-md border border-line p-3 grid gap-3" data-pompe="">
    <div className="lbl">Pompe doseuse / injecteuse</div>
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Field label="Liqueur (% du volume)"><NI value={C.liqueurPct ?? ''} onChange={(v) => setC({ liqueurPct: v })} placeholder={fmt(tirageFractions(prof).fLiq * 100, 2)} aria-label="Consigne liqueur" /></Field>
      <Field label="Levain (% du volume)"><NI value={C.levainPct ?? ''} onChange={(v) => setC({ levainPct: v })} placeholder={fmt(num(prof.levainPct), 2)} aria-label="Consigne levain" /></Field>
      <Field label="Débit (cols/h)"><NI value={P.debitColsH ?? ''} onChange={(v) => setP({ debitColsH: v })} aria-label="Débit" /></Field>
      <Field label="Tolérance (%)"><NI value={P.tolerancePct ?? ''} onChange={(v) => setP({ tolerancePct: v })} placeholder="2" aria-label="Tolérance" /></Field>
    </div>
    {b.lignes.length ? <div className="tblwrap"><table className="tbl"><thead><tr><th>Dosé en ligne</th><th className="r">Consigne</th><th>mL par col</th><th className="r">Théorique</th><th className="r">Réel</th><th className="r">Écart</th></tr></thead><tbody>
      {b.lignes.map((l) => <tr key={l.nom}><td>{l.nom}</td><td className="r num">{`${fmt(l.pct, 2)} %`}</td><td className="text-xs">{l.mLcol.map((m) => `${(tirageFormat(m.format) || {}).label || m.format} : ${fmt(m.mL, 1)} mL`).join(' · ')}</td><td className="r num">{fmtL(l.theoL)}</td><td className="r num">{l.reelL != null ? fmtL(l.reelL) : '—'}</td><td className={cx('r num', l.ecartPct != null && Math.abs(l.ecartPct) > num(P.tolerancePct || 2) && 'text-bad')}>{l.ecartPct != null ? `${fmt(l.ecartPct, 1)} %` : '—'}</td></tr>)}
    </tbody></table></div> : <p className="help">Indiquez les consignes et les cols tirés pour comparer le théorique au réellement consommé.</p>}
    <Group label="Contrôles en cours de tirage"><div className="grid gap-2" data-pompe-controles="">
      {ctrl.map((c, i) => <div key={i} className="flex flex-wrap items-end gap-2">
        <Field label="Heure"><TI value={c.heure || ''} onChange={(v) => setK(i, { heure: v })} placeholder="hh:mm" aria-label={`Heure du contrôle ${i + 1}`} /></Field>
        <Field label="Contrôle"><SI plain value={c.type || 'eprouvette'} onChange={(v) => setK(i, { type: v })} options={POMPE_CONTROLES.map((x) => ({ value: x.id, label: x.label }))} aria-label={`Type du contrôle ${i + 1}`} /></Field>
        <Field label="Cols"><NI value={c.nCols ?? ''} onChange={(v) => setK(i, { nCols: v })} aria-label={`Cols du contrôle ${i + 1}`} /></Field>
        <Field label="Mesure (mL ou g)"><NI value={c.mesure ?? ''} onChange={(v) => setK(i, { mesure: v })} aria-label={`Mesure du contrôle ${i + 1}`} /></Field>
        <Field label="Cible par col"><NI value={c.cible ?? ''} onChange={(v) => setK(i, { cible: v })} aria-label={`Cible du contrôle ${i + 1}`} /></Field>
        <Field label="Densité"><NI value={c.densite ?? ''} onChange={(v) => setK(i, { densite: v })} /></Field>
        <Field label="Opérateur"><TI value={c.operateur || ''} onChange={(v) => setK(i, { operateur: v })} aria-label={`Opérateur du contrôle ${i + 1}`} /></Field>
        <Field label="Action"><TI value={c.action || ''} onChange={(v) => setK(i, { action: v })} placeholder="réglage, aucun…" /></Field>
        {b.controles[i] && b.controles[i].ecartPct != null ? <Chip tone={Math.abs(b.controles[i].ecartPct) > num(P.tolerancePct || 2) ? 'bad' : 'ok'}>{`${fmt(b.controles[i].ecartPct, 1)} %`}</Chip> : null}
        <Btn size="sm" kind="ghost" onClick={() => setP({ controles: ctrl.filter((x, k) => k !== i) })} aria-label="Retirer le contrôle">✕</Btn></div>)}
      <div><Btn size="sm" onClick={() => setP({ controles: [...ctrl, { heure: new Date().toTimeString().slice(0, 5), type: 'eprouvette', nCols: '1', cible: C.liqueurPct ? String(Math.round(pompeMlCol(C.liqueurPct, (F[0] || {}).format) * 10) / 10) : '' }] })}>＋ Contrôle</Btn></div>
      {b.derive.length ? <Notice tone="warn">{`${b.derive.length} contrôle(s) hors tolérance : réglez la pompe et notez l’action.`}</Notice> : null}
    </div></Group>
  </div>);
}
// bilan d'un tirage enregistré : volumes, VRTP
function TirageBilanBox({ db, R, op }) {
  const b = tirageBilan(db, R, { ...op, formats: tirageFormatsDe(op) });
  return <span className={cx('num text-sm', b.depasse && 'text-bad')} data-vrtp={op.id}>{`${fmtL(b.tireL)} · VRTP ${fmt(b.vrtpL, 1)} L (${fmt(b.vrtpPct, 2)} %)`}{b.compoIncomplete ? <span className="block text-xs text-warn">composition du levain incomplète (vin, liqueur, eau non saisis)</span> : null}</span>;
}

function ChantierForm({ id, onClose }) {
  const { db, act, uid, defaultDate } = useApp(); const old = id ? chantierTirage(db, id) : null; const P = prestatairesTirage(db);
  const [c, setC] = useState(() => (old ? clone(old) : { numero: '', nom: '', dateDebut: defaultDate, dateFin: '', realisation: P.length ? 'prestataire' : 'interne', prestataireId: (P[0] || {}).id || '', ligne: { tireuse: true, capsuleuse: true }, notes: '' }));
  const set = (p) => setC({ ...c, ...p }); const setL = (p) => setC({ ...c, ligne: { ...c.ligne, ...p } });
  const save = () => { const r = act((d) => chantierTirageSave(d, c, id, uid), old ? 'Chantier modifié.' : 'Chantier créé.'); if (r && r.ok) onClose(r.id); };
  return (<FormSheet wide title={old ? `Modifier le chantier ${old.numero}` : 'Nouveau chantier de tirage'} sub="Un chantier regroupe les lots tirés d’une ou plusieurs journées, la ligne de tirage et les documents de prestation." onClose={() => onClose()} onSave={save}>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
      <Field label="N° de chantier"><TI value={c.numero} onChange={(v) => set({ numero: v })} placeholder={chantierNumeroSuivant(db, c.dateDebut)} aria-label="N° de chantier" /></Field>
      <Field label="Nom"><TI value={c.nom} onChange={(v) => set({ nom: v })} placeholder="ex. Tirage février" aria-label="Nom du chantier" /></Field>
      <Field label="Début"><DI value={c.dateDebut} onChange={(v) => set({ dateDebut: v })} aria-label="Début du chantier" /></Field>
      <Field label="Fin"><DI value={c.dateFin} onChange={(v) => set({ dateFin: v })} aria-label="Fin du chantier" /></Field>
    </div>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
      <Field label="Réalisation"><SI plain value={c.realisation} onChange={(v) => set({ realisation: v })} options={[{ value: 'interne', label: 'Interne (matériel de la maison)' }, { value: 'prestataire', label: 'Prestataire externe sur site' }]} aria-label="Réalisation" /></Field>
      {c.realisation === 'prestataire' ? <Field label="Prestataire" help={P.length ? undefined : 'Aucun prestataire : Intrants › Fournisseurs, cochez « Prestataire de tirage ».'}><SI plain value={c.prestataireId} onChange={(v) => set({ prestataireId: v })} options={[{ value: '', label: 'Prestataire…' }, ...P.map((x) => ({ value: x.id, label: x.nom, donnee: true }))]} aria-label="Prestataire" /></Field> : null}
    </div>
    <Group label="Composition de la ligne"><div className="flex flex-wrap gap-4">{TIRAGE_LIGNE.filter(([k]) => k !== 'marquage').map(([k, l]) => <Check key={k} checked={!!(c.ligne || {})[k]} onChange={(v) => setL({ [k]: v })} label={l} />)}</div>
      <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <Field label="Becs de la tireuse"><NI value={(c.ligne || {}).nbBecs ?? ''} onChange={(v) => setL({ nbBecs: v })} aria-label="Becs de la tireuse" /></Field>
        <Field label="Marquage"><SI plain value={(c.ligne || {}).marquage || ''} onChange={(v) => setL({ marquage: v })} options={[{ value: '', label: 'Aucun' }, { value: 'laser', label: 'Laser' }, { value: 'jet', label: 'Jet d’encre' }]} aria-label="Marquage" /></Field>
        <Field label="Autre matériel"><TI value={(c.ligne || {}).autres || ''} onChange={(v) => setL({ autres: v })} /></Field>
      </div></Group>
    <Field label="Notes"><TA value={c.notes} onChange={(v) => set({ notes: v })} rows={2} /></Field>
  </FormSheet>);
}
function ChantierSheet({ id, onClose, onForm }) {
  const { db, R, act, confirm, camp } = useApp(); const lect = useLectureSeule('tirage'); const c = chantierTirage(db, id); const [ed, setEd] = useState(false);
  if (!c) return <Sheet title="Chantier introuvable" onClose={onClose}><Empty>Ce chantier n’existe plus.</Empty></Sheet>;
  const b = chantierBilan(db, R, id); const pr = (db.fournisseurs || []).find((f) => f.id === c.prestataireId);
  const mix = Object.values(R.portions).filter((p) => p.vol > 0.5 && lotEstMixtion(db, R, p.lotId));
  const suppr = async () => { if (await confirm({ title: `Supprimer le chantier ${c.numero} ?`, body: 'Ses documents sont retirés avec lui.', ok: 'Supprimer', danger: true })) { const r = act((d) => chantierTirageDelete(d, id), 'Chantier supprimé.'); if (r && r.ok) onClose(); } };
  return (<Sheet wide title={<span>🏭 Chantier <span translate="no">{c.numero}</span>{c.nom ? <span className="font-normal text-ink2"> — <span translate="no">{c.nom}</span></span> : null}</span>} sub={`${fmtDate(c.dateDebut)}${c.dateFin ? ` → ${fmtDate(c.dateFin)}` : ''} · ${c.realisation === 'prestataire' ? `prestataire ${pr ? pr.nom : '?'}` : 'interne'}`} onClose={onClose}
    footer={<>{lect ? null : <><Btn onClick={() => setEd(true)}>Modifier</Btn><Btn kind="ghost" onClick={suppr}>Supprimer</Btn></>}<Btn onClick={onClose}>Fermer</Btn></>}>
    <div data-chantier={id}>
      <div className="mb-4 flex flex-wrap gap-2">{TIRAGE_LIGNE.filter(([k]) => (c.ligne || {})[k]).map(([k, l]) => <Chip key={k}>{k === 'marquage' ? `${l} : ${c.ligne.marquage === 'laser' ? 'laser' : 'jet d’encre'}` : l}</Chip>)}{(c.ligne || {}).nbBecs ? <Chip>{`${fmt(c.ligne.nbBecs)} becs`}</Chip> : null}</div>
      <Sec title="Lots tirés" right={lect || camp.figee ? null : <><Btn onClick={() => onForm({ type: 'assemblage', preset: { mixtion: true, ltype: 'assemblage', date: c.dateDebut } })}>＋ Cuve de mixtion</Btn><Btn kind="primary" onClick={() => onForm({ type: 'tirage', preset: { chantierId: id, date: c.dateDebut, mode: mix.length ? 'mixtion' : 'pompe' } })}>＋ Lot de tirage</Btn></>}>
        <Tbl rows={b.lots.map((l) => ({ ...l, id: l.opId }))} empty="Aucun lot tiré sur ce chantier." cols={[{ h: 'Lot', r: (l) => <LotLink id={l.lotId} /> }, { h: 'Date', r: (l) => <span className="num">{fmtDate(l.date)}</span> }, { h: 'Mode', r: (l) => (TIRAGE_MODES.find((m) => m.id === l.mode) || { label: '—' }).label },
          { h: 'Formats', r: (l) => <span className="text-sm">{l.formats.map((f) => `${fmt(f.nb)} × ${(tirageFormat(f.format) || { label: f.format }).label}`).join(' · ')}</span> }, { h: 'Casse', cls: 'r', r: (l) => <span className="num">{fmt(l.casse)}</span> },
          { h: 'Volume, VRTP', r: (l) => <span className={cx('num text-sm', l.bilan.depasse && 'text-bad')}>{`${fmtL(l.bilan.tireL)} · ${fmt(l.bilan.vrtpPct, 2)} %`}</span> }, { h: '', r: (l) => (lect ? null : <Btn size="sm" onClick={() => onForm({ editId: l.opId })}>Modifier</Btn>) }]} />
        <p className="mt-2 text-sm" data-chantier-bilan="">{`Total : ${fmt(b.cols)} cols (${Object.entries(b.parFormat).map(([k, n]) => `${fmt(n)} ${((tirageFormat(k) || { label: k }).label).toLowerCase()}`).join(', ') || '—'}) · ${fmt(b.eqBouteilles, 0)} équivalent bouteilles · ${fmtL(b.volL)} · casse ${fmt(b.casse)}`}</p>
      </Sec>
      <Sec title="Fiche d’enregistrement de la chaîne (HACCP)"><ChaineHaccp key={c.maj || c.id} ch={c} /></Sec>
      <Sec title="Documents de prestation"><DocsPanel cible={{ type: 'chantier', id }} kind="chantier" locked={isLocked(db, c.dateDebut)} aide="Ordre de fabrication, attestation de nettoyage et de désinfection du matériel, fiche de chantier signée, bon d’intervention…" /></Sec>
      {c.notes ? <p className="help">{c.notes}</p> : null}
    </div>
    {ed ? <ChantierForm id={id} onClose={() => setEd(false)} /> : null}
  </Sheet>);
}
function ChantiersSec({ onForm }) {
  const { db, R, camp } = useApp(); const lect = useLectureSeule('tirage'); const [nv, setNv] = useState(false); const [ouv, setOuv] = useState(null);
  const C = [...chantiersTirage(db)].sort((a, b) => String(b.dateDebut).localeCompare(String(a.dateDebut)));
  return (<Sec title="Chantiers de tirage" right={lect || camp.figee ? null : <Btn kind="primary" onClick={() => setNv(true)}>＋ Chantier</Btn>}>
    <Tbl rows={C} onRow={(c) => setOuv(c.id)} empty="Aucun chantier : créez-en un pour regrouper les lots d’une ou plusieurs journées de tirage." cols={[{ h: 'N°', r: (c) => <b translate="no">{c.numero}</b> }, { h: 'Nom', r: (c) => <span translate="no">{c.nom || '—'}</span> }, { h: 'Dates', r: (c) => <span className="num">{`${fmtDate(c.dateDebut)}${c.dateFin ? ` → ${fmtDate(c.dateFin)}` : ''}`}</span> },
      { h: 'Réalisation', r: (c) => (c.realisation === 'prestataire' ? ((db.fournisseurs || []).find((f) => f.id === c.prestataireId) || { nom: 'Prestataire' }).nom : 'Interne') }, { h: 'Cols', cls: 'r', r: (c) => <span className="num">{fmt(chantierBilan(db, R, c.id).cols)}</span> }, { h: 'Documents', cls: 'r', r: (c) => docsOf(db, 'chantier', c.id).length }]} />
    {nv ? <ChantierForm onClose={(id) => { setNv(false); if (id) setOuv(id); }} /> : null}
    {ouv ? <ChantierSheet id={ouv} onClose={() => setOuv(null)} onForm={onForm} /> : null}
  </Sec>);
}
// cuve de mixtion : levain et liqueur versés, point de tirage de la cuvée, densités et correction de liqueur
function MixtionBox({ db, Rd, f, upd }) {
  const p = tirageProfil(db); const vin = sum(f.sources || [], (s) => s.volL); const prep = sum(f.prepUses || [], (u) => u.volL);
  const k = hasNum(f.densBase) && hasNum(f.densMix) && hasNum(f.pointGL) ? tirageCorrection({ densInit: num(f.densBase) * (num(f.densBase) < 10 ? 1000 : 1), densLue: num(f.densMix) * (num(f.densMix) < 10 ? 1000 : 1), pointGL: num(f.pointGL), volL: vin + prep }, p) : null;
  return (<div className="rounded-md border border-line p-3 grid gap-3" data-mixtion="">
    <CF k="prepUses" group label="Liqueur de tirage et levain versés"><PrepUsesEditor db={db} Rd={Rd} uses={f.prepUses || []} onChange={(v) => upd({ prepUses: v })} types={['liqueur_tirage', 'levain']} /></CF>
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
      <Field label="Point de tirage de la cuvée (g/L)"><NI value={f.pointGL ?? ''} onChange={(v) => upd({ pointGL: v })} placeholder="ex. 24" aria-label="Point de tirage de la mixtion" /></Field>
      <Field label="Densité du vin de base"><NI value={f.densBase ?? ''} onChange={(v) => upd({ densBase: v })} placeholder="ex. 993" aria-label="Densité du vin de base" /></Field>
      <Field label="Densité de la mixtion"><NI value={f.densMix ?? ''} onChange={(v) => upd({ densMix: v })} placeholder="ex. 1002,6" aria-label="Densité de la mixtion" /></Field>
    </div>
    <p className="text-sm" data-mixtion-volume=""><span>{`Mixtion : ${fmtL(vin + prep)} (vin ${fmtL(vin)}, préparations ${fmtL(prep)}).`}</span> {k ? <span>{k.manqueGL > 0.05 ? (k.liqueurL > 0.05 ? `Densité visée ${fmt(k.densTheo, 1)} : il manque ${fmt(k.manqueGL, 1)} g/L, ajouter ${fmt(k.liqueurL, 1)} L de liqueur.` : `Densité visée ${fmt(k.densTheo, 1)} : il manque ${fmt(k.manqueGL, 1)} g/L.`) : k.excesGL > 0.05 ? `Densité visée ${fmt(k.densTheo, 1)} : ${fmt(k.excesGL, 1)} g/L de trop.` : `Densité visée ${fmt(k.densTheo, 1)} atteinte.`}</span> : null}</p>
    <p className="help">Une correction de liqueur se saisit ensuite comme ajout sur la cuve (préparation versée), avec le contrôle de densité.</p>
  </div>);
}
