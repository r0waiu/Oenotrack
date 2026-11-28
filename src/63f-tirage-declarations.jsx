/* ============ TIRAGES › DÉCLARATIONS (0.42.0-alpha.4) : déclaration préalable (formulaire de l'AIDAC, PDF), déclaration de fin de tirage
   et de revendication (récapitulatif dans l'ordre de la saisie Innov OI, CSV, PDF), VRTP distinct, ventilations ;
   impression du chantier : ordre de tirage (0.44.0-alpha.2 : fiche d'enregistrement de la chaîne retirée) ============ */

const declHL = (v) => `${fmt(num(v), 2)} hL`;
const declTypeLabel = (t) => (DECL_TIRAGE_TYPES.find((x) => x.id === t) || { label: t }).label;

// rapport imprimable d'une déclaration (calcul en direct, ou figé au dépôt)
function DeclarationRapport({ db, R, d, refEl }) {
  const ch = d.champs || {}; const dec = d.instantane ? d.instantane.declarant : { ...declDeclarant(db), ...(ch.declarant || {}) };
  const cht = d.chantierId ? chantierTirage(db, d.chantierId) : null;
  const ligne = (l, v) => <tr><th style={{ width: '42%', textAlign: 'left', textTransform: 'none', letterSpacing: 0, fontSize: 11 }}>{l}</th><td translate="no">{v || '—'}</td></tr>;
  if (d.type === 'prealable') {
    const pc = d.instantane ? (d.instantane.calcul.parCuvee ? d.instantane.calcul : null) : (d.chantierId ? declPrealableCuvees(db, R, d.chantierId) : null); // 0.44.0-alpha.1 : une ligne par cuvée prévue
    const k = pc ? { ok: true, vinHL: pc.vinHL, sucreHL: pc.sucreHL, sucreKg: pc.sucreKg, totalHL: pc.totalHL, vrtpHL: pc.vrtpHL, vrtpPct: pc.vinHL + num(pc.liqueurHL) > 0 ? pc.vrtpHL / (pc.vinHL + num(pc.liqueurHL)) * 100 : 0, liqueurHL: num(pc.liqueurHL) } : d.instantane ? { ok: true, ...d.instantane.calcul } : declPrealableCalcul(db, ch);
    return (<div ref={refEl} className="report" data-declaration-rapport="prealable">
      <ReportHead title="Déclaration d’intention de tirage (déclaration préalable)" sub={cht ? `Chantier ${cht.numero} · à déposer au moins ${DECL_PREALABLE_DELAI_H} h avant le tirage` : `À déposer au moins ${DECL_PREALABLE_DELAI_H} h avant le tirage`} />
      <table className="rtbl"><tbody>
        {ligne('Numéro EVV', dec.evv)}{ligne('Code récoltant', dec.codeRecoltant)}{ligne('Nom ou raison sociale du déclarant', dec.nom)}{ligne('Adresse', dec.adresse)}
        {ligne('Lieu du tirage (s’il est différent de l’adresse du siège social)', ch.lieuTirage || dec.lieuTirage)}{ligne('Date du tirage', ch.dateTirage ? fmtDate(ch.dateTirage) : '')}
        {ligne('Volume prévisionnel de vin à mettre en œuvre', k.ok ? declHL(k.vinHL) : '')}{ligne('Volume prévisionnel de sucre à mettre en œuvre', k.ok ? `${declHL(k.sucreHL)} (${fmt(k.sucreKg, 1)} kg)` : '')}
        {ligne('Volume total à tirer', k.ok ? declHL(k.totalHL) : '')}{ligne('Mentions diverses, revendications particulières', [ch.mentions, ...(pc ? uniq(pc.lignes.flatMap((l) => [couleurLabel(db, l.couleur), l.qualif && l.qualif !== 'conv' ? qLabel(l.qualif) : '', ...(l.mentions || [])]).filter(Boolean)) : [])].filter(Boolean).join(' · '))}
      </tbody></table>
      {pc ? <><h3>Cuvées prévues</h3><RTable head={['Cuvée', 'Couleur', 'Revendication', 'Échelle des crus', 'Mentions', 'Vin (hL)', 'Sucre (hL)', 'Total à tirer (hL)']} rows={[...pc.lignes.map((l) => [l.nom, couleurLabel(db, l.couleur), l.qualif ? qLabel(l.qualif) : '', l.echelle ? (eDef(l.echelle) || { label: l.echelle }).label : '', (l.mentions || []).join(' – '), l.ok ? fmt(l.vinHL, 2) : '—', l.ok ? fmt(l.sucreHL, 2) : '—', l.ok ? fmt(l.totalHL, 2) : '—']), ['Total', '', '', '', '', fmt(pc.vinHL, 2), fmt(pc.sucreHL, 2), fmt(pc.totalHL, 2)]]} />
        {pc.rougeHL > 0 ? <p style={{ fontSize: 11 }}>{`Rosé d’assemblage : vins rouges ${declHL(pc.rougeHL)}, vins blancs ${declHL(pc.blancHL)}.`}</p> : null}</> : null}
      {!pc && (hasNum(ch.rougeHL) || hasNum(ch.blancHL)) ? <><h3>Vin rosé par assemblage de vins rouges et de vins blancs</h3><table className="rtbl"><tbody>{ligne('Volume de vin rouge à mettre en œuvre', hasNum(ch.rougeHL) ? declHL(ch.rougeHL) : '')}{ligne('Volume de vins blancs à mettre en œuvre', hasNum(ch.blancHL) ? declHL(ch.blancHL) : '')}</tbody></table></> : null}
      {k.ok && !pc ? <p className="muted" style={{ fontSize: 10.5 }}>{`Calcul d’Œnotrack (profil de tirage, à vérifier) : point de tirage ${fmt(num(ch.pointGL), 1)} g/L, liqueur ${declHL(k.liqueurHL)}, VRTP prévisionnel ${declHL(k.vrtpHL)} (${fmt(k.vrtpPct, 2)} %).`}</p> : null}
      <p style={{ marginTop: 18 }}><span>Fait à :</span> <span translate="no">{ch.faitA || dec.faitA || '……………'}</span> · <span>Le :</span> <span translate="no">{fmtDate(d.date)}</span> · <span>Signature :</span> <span translate="no">{ch.signataire || dec.signataire || ''}</span></p>
      <p className="muted" style={{ fontSize: 10.5 }}>À établir en 3 exemplaires : le premier pour l’AIDAC, le second pour la recette locale des douanes ou la recette de domiciliation, le troisième à conserver dans le registre.</p>
      {d.statut === 'deposee' ? <p className="muted" style={{ fontSize: 10.5 }}><span>{`Déposée le ${fmtDate(d.deposeLe)}`}</span>{d.reference ? <span>{` · référence ${d.reference}`}</span> : null}</p> : null}
    </div>);
  }
  const c = d.instantane ? d.instantane.calcul : declFinaleCalcul(db, R, d); const autresF = uniq(c.lots.flatMap((l) => l.autres.map((a) => a.format)));
  const fa = DECL_FACON.find((x) => x.id === (ch.facon || '')) || DECL_FACON[0];
  return (<div ref={refEl} className="report" data-declaration-rapport="finale">
    <ReportHead title="Déclaration de revendication en appellation Champagne (valant déclaration de tirage)" sub={cht ? `Chantier ${cht.numero} · tirage du ${fmtDate(c.dateDebut)} au ${fmtDate(c.dateFin)} · à saisir sur Innov OI` : `Tirage du ${fmtDate(c.dateDebut)} au ${fmtDate(c.dateFin)} · à saisir sur Innov OI`} />
    <table className="rtbl"><tbody>
      {ligne('Nom ou raison sociale du déclarant', dec.nom)}{ligne('Adresse complète du siège social', dec.adresse)}{ligne('N° EVV ou à défaut n° d’accise', dec.evv || dec.accise)}{ligne('N° de ressortissant CIVC', dec.civc)}
      {ligne('Tirage', ch.facon ? `${fa.label} : ${ch.proprietaire || '…'}` : `Vins appartenant au déclarant (${(DECL_STATUTS_DECLARANT.find((x) => x.id === (dec.statut || 'recoltant')) || {}).label || ''})`)}
      {ligne('Adresse du lieu de tirage', ch.lieuTirage || dec.lieuTirage)}{ligne('Date de fin de tirage', c.dateFin ? fmtDate(c.dateFin) : '')}{ligne('Adresse complète du lieu de stockage (après tirage)', ch.lieuStockage || dec.lieuStockage)}
    </tbody></table>
    <h3>Volume effectif mis en œuvre</h3>
    <table className="rtbl" data-declaration-volumes=""><tbody>
      {ligne('Vins', declHL(c.vinHL))}{ligne('Sucres et liqueurs', declHL(c.liqueurHL))}{ligne('Volume total tiré', declHL(c.totalHL))}
      {ligne('Volume résultant d’exigences techniques particulières (VRTP)', `${declHL(c.vrtpHL)} · ${fmt(c.vrtpPct, 2)} % des volumes mis en œuvre, vins et liqueurs (au plus ${TIRAGE_VRTP_MAX_PCT} %)`)}
      {ligne('Titre alcoométrique avant tirage', hasNum(ch.tav) ? `${fmt(num(ch.tav), 2)} % vol.` : '')}{ligne('Nombre de flacons tirés', `${fmt(c.nbCols)} (${fmt(c.eqBouteilles, 0)} équivalent bouteilles)`)}
    </tbody></table>
    <h3>Lots (ordre de la saisie en ligne)</h3>
    <RTable head={['Lot', 'Produit', 'Couleur', 'Revendication', 'Millésime', 'Cuvée', 'Demies', 'Bouteilles', 'Magnums', ...autresF.map((f) => (tirageFormat(f) || { label: f }).label), 'Revendications particulières']}
      rows={c.lots.map((l) => [l.code, l.produit, couleurLabel(db, l.couleur), l.qualif ? qLabel(l.qualif) : '', l.millesime || 'non millésimé', l.cuvee, fmt(l.colonnes.demie), fmt(l.colonnes.bouteille), fmt(l.colonnes.magnum), ...autresF.map((f) => fmt(sum(l.autres.filter((a) => a.format === f), (a) => a.nb))), l.revendications || '—'])} empty="Aucun lot." />
    <h3>Ventilation</h3>
    <RTable head={['Par revendication', 'Cols', 'Équivalent bouteilles', 'Volume tiré']} rows={c.parRevendication.map((x) => [x.label, fmt(x.nbCols), fmt(x.eqBouteilles, 0), declHL(x.tireL / 100)])} />
    <RTable head={['Par échelle des crus', 'Cols', 'Équivalent bouteilles', 'Volume tiré']} rows={c.parEchelle.map((x) => [x.label, fmt(x.nbCols), fmt(x.eqBouteilles, 0), declHL(x.tireL / 100)])} />
    <RTable head={['Par couleur', 'Cols', 'Équivalent bouteilles', 'Volume tiré']} rows={c.parCouleur.map((x) => [x.label, fmt(x.nbCols), fmt(x.eqBouteilles, 0), declHL(x.tireL / 100)])} />
    {c.alertes.length ? <p style={{ color: '#9b1c1c', fontSize: 11 }}>{c.alertes.map((a) => `⚠ ${a}`).join(' ')}</p> : null}
    <p style={{ marginTop: 18 }}><span>Fait à :</span> <span translate="no">{ch.faitA || dec.faitA || '……………'}</span> · <span>Le :</span> <span translate="no">{fmtDate(d.date)}</span> · <span>Prénom, nom et qualité du signataire :</span> <span translate="no">{ch.signataire || dec.signataire || ''}</span></p>
    {d.statut === 'deposee' ? <p className="muted" style={{ fontSize: 10.5 }}><span>{`Déposée le ${fmtDate(d.deposeLe)}`}</span>{d.reference ? <span>{` · référence ${d.reference}`}</span> : null}</p> : null}
  </div>);
}

// formulaire d'une déclaration (préalable ou de fin de tirage)
function DeclarationForm({ id, type0, chantierId0, onClose }) {
  const { db, R, act, uid, defaultDate, camp } = useApp(); const old = id ? declarationTirage(db, id) : null; const type = old ? old.type : type0 || 'finale';
  const dd = declDeclarant(db); const cht0 = chantierId0 ? chantierTirage(db, chantierId0) : null;
  const [f, setF] = useState(() => (old ? { chantierId: old.chantierId || '', opIds: old.opIds || [], date: old.date, champs: JSON.parse(JSON.stringify(old.champs || {})) }
    : { chantierId: chantierId0 || '', opIds: [], date: defaultDate, champs: type === 'prealable' ? { dateTirage: cht0 ? cht0.dateDebut : '', lieuTirage: dd.lieuTirage, faitA: dd.faitA, signataire: dd.signataire } : { lieuTirage: dd.lieuTirage, lieuStockage: dd.lieuStockage, faitA: dd.faitA, signataire: dd.signataire, facon: '' } }));
  const setC = (p) => setF((x) => ({ ...x, champs: { ...x.champs, ...p } })); const ch = f.champs; const decl = ch.declarant || {}; const setD = (p) => setC({ declarant: { ...decl, ...p } });
  const T = useMemo(() => (db.ops || []).filter((o) => o.type === 'tirage' && !estMise(o) && o.date >= camp.debut && o.date <= camp.fin).sort(byDate), [db, camp]);
  const dv = { ...old, type, ...f }; const pcF = type === 'prealable' && f.chantierId ? declPrealableCuvees(db, R, f.chantierId) : null; const k = type === 'prealable' && !pcF ? declPrealableCalcul(db, ch) : null; const c = type === 'finale' ? declFinaleCalcul(db, R, dv) : null;
  const delai = type === 'prealable' ? declDelaiHeures(f.date, ch.dateTirage) : null;
  const save = () => { const r = act((d) => declarationTirageSave(d, { ...f, type }, id, uid), 'Déclaration enregistrée.'); if (r && r.ok) onClose(r.id); };
  const setLot = (opId, p) => setC({ lots: { ...(ch.lots || {}), [opId]: { ...((ch.lots || {})[opId] || {}), ...p } } });
  return (<FormSheet wide title={old ? `Modifier : ${declTypeLabel(type)}` : declTypeLabel(type)} sub={type === 'prealable' ? `Formulaire de l’AIDAC, au moins ${DECL_PREALABLE_DELAI_H} h avant le tirage, en 3 exemplaires.` : 'Récapitulatif à reporter sur Innov OI (saisie en ligne de l’AIDAC), avec CSV et PDF archivé.'} onClose={() => onClose()} onSave={save}>
    <div data-declaration-form={type} className="grid gap-3">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <Field label="Date de la déclaration"><DI value={f.date} onChange={(v) => setF((x) => ({ ...x, date: v }))} aria-label="Date de la déclaration" /></Field>
        <Field label="Chantier de tirage"><SI plain value={f.chantierId} onChange={(v) => setF((x) => ({ ...x, chantierId: v, opIds: [] }))} options={[{ value: '', label: type === 'finale' ? 'Lots choisis un à un' : 'Aucun' }, ...chantiersTirage(db).map((x) => ({ value: x.id, label: `${x.numero}${x.nom ? ` · ${x.nom}` : ''}`, donnee: true }))]} aria-label="Chantier de la déclaration" /></Field>
      </div>
      <Group label="Déclarant (réglages de la DRM et de la société, modifiables ici)"><div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        {[['nom', 'Nom ou raison sociale'], ['adresse', 'Adresse'], ['evv', 'N° EVV'], ['codeRecoltant', 'Code récoltant'], ...(type === 'finale' ? [['accise', 'N° d’accise'], ['civc', 'N° de ressortissant CIVC']] : [])].map(([kk, l]) => <Field key={kk} label={l}><TI value={decl[kk] !== undefined ? decl[kk] : dd[kk]} onChange={(v) => setD({ [kk]: v })} aria-label={`Déclarant : ${l}`} /></Field>)}
        {type === 'finale' ? <Field label="Statut du déclarant"><SI plain value={decl.statut || dd.statut} onChange={(v) => setD({ statut: v })} options={DECL_STATUTS_DECLARANT.map((x) => ({ value: x.id, label: x.label }))} aria-label="Statut du déclarant" /></Field> : null}
      </div></Group>
      {type === 'prealable' ? <>
        {pcF ? <div data-prealable-cuvees=""><Notice tone={pcF.incompletes.length ? 'warn' : 'info'} title={`${pcF.lignes.length} cuvée(s) prévue(s) sur ce chantier`}><span>Les volumes de la déclaration viennent des cuvées prévues du chantier (une ligne par qualité).</span>{pcF.incompletes.length ? <span>{` Volume de vin ou point de tirage manquant : ${pcF.incompletes.join(', ')}.`}</span> : null}</Notice>
          <Tbl rows={pcF.lignes} cols={[{ h: 'Cuvée', r: (l) => <b translate="no">{l.nom}</b> }, { h: 'Qualité', r: (l) => <span className="text-xs" translate="no">{[couleurLabel(db, l.couleur), l.qualif ? qLabel(l.qualif) : '', l.echelle ? (eDef(l.echelle) || {}).label : '', ...(l.mentions || [])].filter(Boolean).join(' · ')}</span> }, { h: 'Vin', cls: 'r', r: (l) => <span className="num">{declHL(l.vinHL)}</span> }, { h: 'Sucre', cls: 'r', r: (l) => <span className="num">{l.ok ? declHL(l.sucreHL) : '—'}</span> }, { h: 'Total à tirer', cls: 'r', r: (l) => <span className="num">{l.ok ? declHL(l.totalHL) : '—'}</span> }]} />
          <p className="text-sm" data-prealable-total="">{`Total : vin ${declHL(pcF.vinHL)} · sucre ${declHL(pcF.sucreHL)} · total à tirer ${declHL(pcF.totalHL)}`}</p></div> : null}
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
          <Field label="Date du tirage" help={delai != null && delai < DECL_PREALABLE_DELAI_H ? `⚠ Moins de ${DECL_PREALABLE_DELAI_H} h avant le tirage.` : undefined}><DI value={ch.dateTirage || ''} onChange={(v) => setC({ dateTirage: v })} aria-label="Date du tirage" /></Field>
          <Field label="Lieu du tirage"><TI value={ch.lieuTirage || ''} onChange={(v) => setC({ lieuTirage: v })} aria-label="Lieu du tirage" /></Field>
          {pcF ? null : <><Field label="Vin de base prévu (hL)"><NI value={ch.vinHL ?? ''} onChange={(v) => setC({ vinHL: v })} aria-label="Vin de base prévu" /></Field>
          <Field label="Point de tirage de la cuvée (g/L)"><NI value={ch.pointGL ?? ''} onChange={(v) => setC({ pointGL: v })} placeholder="ex. 24" aria-label="Point de tirage de la déclaration" /></Field>
          <Field label="Vin rouge (rosé d’assemblage, hL)"><NI value={ch.rougeHL ?? ''} onChange={(v) => setC({ rougeHL: v })} aria-label="Vin rouge" /></Field>
          <Field label="Vins blancs (rosé d’assemblage, hL)"><NI value={ch.blancHL ?? ''} onChange={(v) => setC({ blancHL: v })} aria-label="Vins blancs" /></Field></>}
        </div>
        {pcF ? null : <p className="text-sm" data-prealable-calcul="">{k && k.ok ? <><span>{`Vin à mettre en œuvre : ${declHL(k.vinHL)} · sucre : ${declHL(k.sucreHL)} (${fmt(k.sucreKg, 1)} kg) · total à tirer : ${declHL(k.totalHL)}`}</span> <span className="text-ink2">{`VRTP prévisionnel ${declHL(k.vrtpHL)} (${fmt(k.vrtpPct, 2)} %)`}</span></> : <span className="text-ink2">{(k && k.msg) || ''}</span>}</p>}
      </> : <>
        {!f.chantierId ? <Group label="Lots de tirage déclarés"><div className="grid gap-1" data-declaration-lots-choix="">{T.length ? T.map((o) => <Check key={o.id} checked={f.opIds.includes(o.id)} onChange={(v) => setF((x) => ({ ...x, opIds: v ? [...x.opIds, o.id] : x.opIds.filter((y) => y !== o.id) }))} label={<span><span translate="no">{`${(lotById(db, o.lotId) || {}).code || (o.lotSpec || {}).code || ''} · ${fmtDate(o.date)} · `}</span><span>{`cols : ${fmt(num(o.nbBouteilles))}`}</span></span>} />) : <p className="help">Aucun tirage sur la campagne.</p>}</div></Group> : null}
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
          <Field label="Propriété des vins"><SI plain value={ch.facon || ''} onChange={(v) => setC({ facon: v })} options={DECL_FACON.map((x) => ({ value: x.id, label: x.label }))} aria-label="Propriété des vins" /></Field>
          {ch.facon ? <Field label={ch.facon === 'caf_coll' ? 'Numéro de la collective' : 'Nom et adresse du propriétaire des vins'}><TI value={ch.proprietaire || ''} onChange={(v) => setC({ proprietaire: v })} aria-label="Propriétaire des vins" /></Field> : null}
          <Field label="Lieu du tirage"><TI value={ch.lieuTirage || ''} onChange={(v) => setC({ lieuTirage: v })} aria-label="Lieu du tirage" /></Field>
          <Field label="Lieu de stockage après tirage"><TI value={ch.lieuStockage || ''} onChange={(v) => setC({ lieuStockage: v })} aria-label="Lieu de stockage" /></Field>
          <Field label="Titre alcoométrique avant tirage (% vol.)"><NI value={ch.tav ?? ''} onChange={(v) => setC({ tav: v })} aria-label="Titre alcoométrique avant tirage" /></Field>
        </div>
        {c && c.lots.length ? <div className="tblwrap"><table className="tbl" data-declaration-lots=""><thead><tr><th>Lot</th><th>Produit</th><th>Millésime</th><th>Cuvée</th><th>Flacons</th><th>Revendications particulières</th></tr></thead><tbody>
          {c.lots.map((l) => <tr key={l.opId}><td><b translate="no">{l.code}</b><div className="text-xs text-ink2">{fmtDate(l.date)}</div></td>
            <td><SI plain value={l.produit} onChange={(v) => setLot(l.opId, { produit: v })} options={['Champagne', 'Champagne rosé'].map((x) => ({ value: x, label: x }))} aria-label={`Produit du lot ${l.code}`} /></td>
            <td><TI value={l.millesime} onChange={(v) => setLot(l.opId, { millesime: v })} placeholder="non millésimé" aria-label={`Millésime du lot ${l.code}`} style={{ width: 110 }} /></td>
            <td><TI value={l.cuvee} onChange={(v) => setLot(l.opId, { cuvee: v })} aria-label={`Cuvée du lot ${l.code}`} /></td>
            <td className="text-sm"><span translate="no">{l.formats.filter((x) => num(x.nb) > 0).map((x) => `${fmt(x.nb)} × ${(tirageFormat(x.format) || { label: x.format }).label}`).join(' · ')}</span></td>
            <td><TI value={l.revendications} onChange={(v) => setLot(l.opId, { revendications: v })} aria-label={`Revendications particulières du lot ${l.code}`} /></td></tr>)}
        </tbody></table></div> : null}
        {c ? <p className="text-sm" data-finale-totaux=""><span>{`Vins ${declHL(c.vinHL)} · sucres et liqueurs ${declHL(c.liqueurHL)} · total tiré ${declHL(c.totalHL)} · ${fmt(c.nbCols)} flacons`}</span> <b className={c.vrtpPct > TIRAGE_VRTP_MAX_PCT ? 'text-bad' : ''}>{`VRTP ${declHL(c.vrtpHL)} (${fmt(c.vrtpPct, 2)} %)`}</b></p> : null}
        {c && c.alertes.length ? <ul className="text-sm text-warn">{c.alertes.map((a) => <li key={a}>{`⚠ ${a}`}</li>)}</ul> : null}
      </>}
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
        <Field label="Mentions diverses"><TI value={ch.mentions || ''} onChange={(v) => setC({ mentions: v })} aria-label="Mentions diverses" /></Field>
        <Field label="Fait à"><TI value={ch.faitA || ''} onChange={(v) => setC({ faitA: v })} aria-label="Fait à" /></Field>
        <Field label="Signataire (prénom, nom, qualité)"><TI value={ch.signataire || ''} onChange={(v) => setC({ signataire: v })} aria-label="Signataire" /></Field>
      </div>
    </div>
  </FormSheet>);
}

// fiche d'une déclaration : aperçu, impression, CSV, dépôt (figée), réouverture motivée
function DeclarationSheet({ id, onClose }) {
  const { db, R, act, uid, confirm, toast, defaultDate } = useApp(); const lect = useLectureSeule('tirage'); const d = declarationTirage(db, id); const ref = useRef(null);
  const [ed, setEd] = useState(false); const [dep, setDep] = useState(null); const [motif, setMotif] = useState(null);
  const out = useReportOutput(ref, `${d && d.type === 'prealable' ? 'declaration-prealable' : 'declaration-fin-tirage'}-${d ? d.date : ''}`, { orientation: d && d.type === 'finale' ? 'paysage' : 'portrait' });
  if (!d) return <Sheet title="Déclaration introuvable" onClose={onClose}><Empty>Cette déclaration n’existe plus.</Empty></Sheet>;
  const csv = async () => { const r = await saveFile(`declaration-fin-tirage-${d.date}.csv`, toCSV(declFinaleCsv(db, R, d)), 'text/csv;charset=utf-8'); if (r.ok) toast('Export CSV enregistré.'); else if (!r.declined) toast(failMsg(r), 'bad'); };
  const suppr = async () => { if (await confirm({ title: 'Supprimer la déclaration ?', ok: 'Supprimer', danger: true })) { const r = act((x) => declarationTirageDelete(x, id), 'Déclaration supprimée.'); if (r && r.ok) onClose(); } };
  return (<Sheet wide title={declTypeLabel(d.type)} sub={d.statut === 'deposee' ? `Déclaration du ${fmtDate(d.date)} · déposée le ${fmtDate(d.deposeLe)}` : `Déclaration du ${fmtDate(d.date)} · brouillon`} onClose={onClose}
    footer={<>{lect ? null : d.statut === 'deposee' ? <Btn onClick={() => setMotif('')}>Rouvrir (rectificative)</Btn> : <><Btn onClick={() => setEd(true)}>Modifier</Btn><Btn onClick={() => setDep({ deposeLe: defaultDate, reference: '' })}>Marquer déposée</Btn><Btn kind="ghost" onClick={suppr}>Supprimer</Btn></>}
      {d.type === 'finale' ? <Btn onClick={csv}>⬇ Exporter (CSV)</Btn> : null}<BoutonsSortie out={out} /><Btn onClick={onClose}>Fermer</Btn></>}>
    <div data-declaration={id} className="overflow-x-auto"><DeclarationRapport db={db} R={R} d={d} refEl={ref} /></div>
    {dep ? <FormSheet title="Déclaration déposée" sub="La déclaration est figée telle qu’elle a été envoyée ; une rectification passe par une réouverture motivée." onClose={() => setDep(null)} onSave={() => { const r = act((x) => declarationTirageDeposer(x, getR(x), id, dep, uid), 'Déclaration marquée déposée.'); if (r && r.ok) setDep(null); }}>
      <G><Field label="Déposée le"><DI value={dep.deposeLe} onChange={(v) => setDep({ ...dep, deposeLe: v })} aria-label="Déposée le" /></Field><Field label="Référence (accusé de réception, DREV…)"><TI value={dep.reference} onChange={(v) => setDep({ ...dep, reference: v })} aria-label="Référence du dépôt" /></Field></G>
    </FormSheet> : null}
    {motif !== null ? <FormSheet title="Rouvrir la déclaration" onClose={() => setMotif(null)} onSave={() => { const r = act((x) => declarationTirageRouvrir(x, id, motif, uid), 'Déclaration rouverte.'); if (r && r.ok) setMotif(null); }}>
      <Field label="Motif de la rectification"><TA value={motif} onChange={setMotif} rows={2} aria-label="Motif de la rectification" /></Field>
    </FormSheet> : null}
    {ed ? <DeclarationForm id={id} onClose={() => setEd(false)} /> : null}
  </Sheet>);
}

// sous-onglet Déclarations
function TirageDeclarations() {
  const { db, camp } = useApp(); const lect = useLectureSeule('tirage'); const [form, setForm] = useState(null); const [ouv, setOuv] = useState(null);
  const D = declarationsTirage(db).filter((d) => d.date >= camp.debut && d.date <= camp.fin).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const nd = tiragesNonDeclares(db, camp);
  return (<div data-tirage-declarations="">
    <Notice tone="info" title="Déclarations à l’AIDAC">La déclaration d’intention de tirage (déclaration préalable) se dépose sur le formulaire de l’AIDAC au moins 48 h avant le tirage ; la déclaration de revendication (valant déclaration de tirage) se saisit en ligne (Innov OI) dès la fin du tirage : Œnotrack prépare le récapitulatif dans l’ordre de la saisie, le CSV et le PDF à archiver.</Notice>
    {nd.length ? <p className="my-2 text-sm text-warn" data-tirages-non-declares="">{`⚠ ${nd.length} lot(s) de tirage sans déclaration de fin de tirage.`}</p> : null}
    <Sec title="Déclarations de la campagne" right={lect || camp.figee ? null : <><Btn onClick={() => setForm({ type0: 'prealable' })}>＋ Déclaration préalable</Btn><Btn kind="primary" onClick={() => setForm({ type0: 'finale' })}>＋ Déclaration de fin de tirage</Btn></>}>
      <Tbl rows={D} onRow={(d) => setOuv(d.id)} empty="Aucune déclaration sur la campagne." cols={[{ h: 'Date', r: (d) => <span className="num">{fmtDate(d.date)}</span> }, { h: 'Déclaration', r: (d) => declTypeLabel(d.type) },
        { h: 'Chantier', r: (d) => <span translate="no">{(chantierTirage(db, d.chantierId) || {}).numero || '—'}</span> }, { h: 'État', r: (d) => (d.statut === 'deposee' ? <Chip tone="ok">{`déposée le ${fmtDate(d.deposeLe)}`}</Chip> : <Chip tone="warn">brouillon</Chip>) }, { h: 'Référence', r: (d) => <span translate="no">{d.reference || '—'}</span> }]} />
    </Sec>
    {form ? <DeclarationForm {...form} onClose={(id) => { setForm(null); if (id) setOuv(id); }} /> : null}
    {ouv ? <DeclarationSheet id={ouv} onClose={() => setOuv(null)} /> : null}
  </div>);
}

/* ---------- impressions du chantier ---------- */
function OrdreTirageRapport({ db, R, chantierId, refEl }) {
  const o = ordreTirage(db, R, chantierId); if (!o) return null; const c = o.chantier; const pr = (db.fournisseurs || []).find((f) => f.id === c.prestataireId);
  return (<div ref={refEl} className="report" data-ordre-tirage="">
    <ReportHead title={`Ordre de tirage — chantier ${c.numero}`} sub={`${fmtDate(c.dateDebut)}${c.dateFin ? ` → ${fmtDate(c.dateFin)}` : ''} · ${c.realisation === 'prestataire' ? `prestataire ${pr ? pr.nom : ''}` : 'interne'}`} />
    <p style={{ fontSize: 11 }}><span>Ligne :</span> <span>{TIRAGE_LIGNE.filter(([k]) => (c.ligne || {})[k]).map(([, l]) => l).join(', ') || '—'}</span>{(c.ligne || {}).nbBecs ? <span>{` · ${fmt(c.ligne.nbBecs)} becs`}</span> : null}</p>
    {o.lots.map((l) => <div key={l.opId} className="rpt-item" style={{ marginBottom: 10 }}>
      <h3><span translate="no">{l.code}</span>{l.designation ? <span translate="no">{` — ${l.designation}`}</span> : null}</h3>
      <RTable head={['Date', 'Mode', 'Point de tirage', 'Formats', 'Vin (cuves)', 'Liqueur et levain']} rows={[[fmtDate(l.date), (TIRAGE_MODES.find((m) => m.id === l.mode) || { label: '—' }).label, hasNum(l.pointGL) ? `${fmt(num(l.pointGL), 1)} g/L` : '—', l.formats.map((f) => `${fmt(f.nb)} × ${(tirageFormat(f.format) || { label: f.format }).label}`).join(' · '), l.sources.map((s) => `${s.code} ${fmtL(s.volL)}`).join(' · ') || '—', l.preps.map((p) => `${p.code} ${fmtL(p.volL)}`).join(' · ') || '—']]} />
      {l.pompe && l.pompe.consignes ? <p style={{ fontSize: 11 }}>{`Pompe doseuse : liqueur ${fmt(num(l.pompe.consignes.liqueurPct), 2)} %, levain ${fmt(num(l.pompe.consignes.levainPct), 2)} % du volume tiré`}</p> : null}
      <RTable head={['Fournitures et intrants', 'Lot fournisseur', 'Quantité']} rows={[...l.fournitures.map((x) => [x.nom, x.numLot || '—', `${fmt(x.qty)} ${x.unite}`]), ...l.lignes.map((x) => [x.nom, x.numLot || '—', `${fmt(x.qty, 2)} ${x.unite}`])]} empty="Aucune fourniture saisie." />
    </div>)}
    {!o.lots.length ? <p>Aucun lot rattaché à ce chantier.</p> : <p style={{ fontSize: 11 }}>{`Total : ${fmt(o.bilan.cols)} cols · ${fmt(o.bilan.eqBouteilles, 0)} équivalent bouteilles · ${fmtL(o.bilan.volL)}`}</p>}
    <p style={{ marginTop: 16, fontSize: 11 }}>Visa cave : ……………… · Visa prestataire : ………………</p>
  </div>);
}
function ChantierImpression({ id, onClose }) {
  const { db, R } = useApp(); const ref = useRef(null); const c = chantierTirage(db, id) || {};
  const out = useReportOutput(ref, `ordre-de-tirage-${slug(c.numero || 'chantier')}`, { orientation: 'paysage' });
  return <Sheet wide title="Imprimer l’ordre de tirage" sub="A4 paysage" onClose={onClose} footer={<><Btn onClick={onClose}>Fermer</Btn><BoutonsSortie out={out} /></>}><div className="overflow-x-auto"><OrdreTirageRapport db={db} R={R} chantierId={id} refEl={ref} /></div></Sheet>;
}
