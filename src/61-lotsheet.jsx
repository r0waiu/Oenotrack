/* ============ FICHE LOT (traçabilité) & FICHE LOT FINI ============ */
function LotEditForm({ id, onClose }) {
  const { db, act } = useApp(); const l = db.lots.find((x) => x.id === id);
  const [f, set] = useDraft({ code: l.code, designation: l.designation || '', millesime: l.millesime || '' });
  const save = () => { const r = act((d) => lotEdit(d, id, f), 'Lot modifié.'); if (r.ok) onClose(); };
  return (<FormSheet title={`Modifier le lot ${l.code}`} onClose={onClose} onSave={save}>
    <Field label="Code du lot (unique)"><TI value={f.code} onChange={(v) => set('code', v)} /></Field>
    <Field label="Désignation"><TI value={f.designation} onChange={(v) => set('designation', v)} /></Field>
    <Field label="Millésime"><TI value={f.millesime} onChange={(v) => set('millesime', v)} /></Field>
    <div className="help">Le stade, la couleur, la nature et la revendication évoluent uniquement par des opérations (changement de stade, déclassement validé) : l’historique reste tracé.</div>
  </FormSheet>);
}

// Frise des stades : progression habituelle (liste personnalisable), stades franchis datés, passage au stade suivant
function StadesFrise({ lotId, onEtape }) {
  const { db, R, camp } = useApp(); const lot = R.lots[lotId]; const ref = useRef(null);
  useEffect(() => { const w = ref.current; const el = w && w.querySelector('[aria-current="step"]'); if (el && w.scrollWidth > w.clientWidth) w.scrollLeft = el.offsetLeft - w.clientWidth / 2 + el.offsetWidth / 2; }, [lot && lot.stade]);
  if (!lot) return null;
  const hist = R.stadeHist[lotId] || []; const L = stadeList(db).filter((x) => !x.masque || hist.some((h) => h.stade === x.id) || x.id === lot.stade);
  const cur = L.findIndex((x) => x.id === lot.stade); const nx = stadeNext(db, lot.stade); const dateOf = (sid) => { const h = [...hist].reverse().find((x) => x.stade === sid); return h ? h.date : null; };
  const vivant = (R.lotVol[lotId] || 0) > 0 || (R.tir[lotId] && R.tir[lotId].nb > 0);
  return (
    <Sec title="Stade du vin" className="mb-5" right={vivant && !camp.figee ? <div className="flex flex-wrap gap-1">{nx ? <Btn size="sm" kind="primary" onClick={() => onEtape({ lotId, newStade: nx.id })}>→ {nx.label}</Btn> : null}<Btn size="sm" onClick={() => onEtape({ lotId, newStade: lot.stade })}>Changer de stade…</Btn></div> : null}>
      <ol ref={ref} className="frise" aria-label="Progression des stades">
        {L.map((x, i) => { const d = dateOf(x.id); const etat = i === cur ? 'cur' : (i < cur ? 'done' : 'todo'); return (
          <li key={x.id} className={`fr-${etat}`} style={{ '--c': x.couleur }} aria-current={i === cur ? 'step' : undefined} title={x.label}>
            <span className="fr-dot" /><span className="fr-l">{x.court || x.label}</span>{d && etat !== 'todo' ? <span className="fr-d num">{fmtDate(d).slice(0, 5)}</span> : null}
          </li>); })}
      </ol>
      {hist.length > 1 ? <div className="help mt-1">Historique : {hist.map((h, k) => <span key={k}>{k ? ' → ' : ''}{stadeCourt(db, h.stade)}{h.date ? ` (${fmtDate(h.date)})` : ''}{k && h.couleur !== hist[k - 1].couleur ? ` · ${couleurLabel(db, h.couleur).toLowerCase()}` : ''}</span>)}</div> : <div className="help mt-1">Le stade évolue avec les opérations (débourbage, levurage, assemblage, tirage…) ou par « Changer de stade ».</div>}
    </Sec>
  );
}

function AncTree({ lotId, depth = 0, vol, share }) {
  const { db, R } = useApp(); const l = R.lots[lotId]; if (!l) return null;
  const srcs = l.sources && l.sources.length ? l.sources : (l.parentIds || []).map((p) => ({ lotId: p }));
  const tot = sum(srcs, (s) => s.volL); const preps = R.prepUse.filter((u) => u.lotId === lotId && l.type === 'cuvee_tirage');
  return (
    <li>
      <LotLink id={lotId} /> <span className="text-xs text-ink2">{stadeCourt(db, l.stade)} · {couleurLabel(db, l.couleur).toLowerCase()}{l.millesime ? ` · ${l.millesime}` : ''}</span> <QChip id={l.qualif} />
      {vol != null ? <span className="num ml-1 text-xs">{fmtL(vol)}{share != null ? ` · ${pct(share)}` : ''}</span> : null}
      {l.apports && l.apports.length ? <ul>{l.apports.map((a, i) => <li key={i} className="text-sm text-ink2">🍇 Apport : {fmt(a.kg)} kg {lbl(db, 'cepages', a.cepageId)} · {qLabel(a.qualifId)}</li>)}</ul> : null}
      {depth < 8 && (srcs.length || preps.length) ? <ul>{srcs.map((s) => <AncTree key={s.lotId} lotId={s.lotId} depth={depth + 1} vol={s.volL} share={tot > 0 && s.volL != null ? s.volL / tot : null} />)}{preps.map((u, i) => { const p = prepOf(R, u.prepId); return <li key={'p' + i} className="text-sm text-ink2">⚗ {PREP_TYPES[p.ptype]} <b>{p.code}</b> · {qLabel(p.qualif)} · {fmtL(u.volL)}</li>; })}</ul> : null}
    </li>
  );
}
function DescTree({ lotId, depth = 0 }) {
  const { db, R, showFini } = useApp();
  const kids = childrenOf(db, lotId); const fins = finisOf(db, lotId);
  if (!kids.length && !fins.length) return null;
  return (<ul>
    {kids.map((k) => <li key={k.id}><LotLink id={k.id} /> <span className="text-xs text-ink2">{stadeCourt(db, (R.lots[k.id] || k).stade)}</span> <QChip id={(R.lots[k.id] || k).qualif} />{depth < 8 ? <DescTree lotId={k.id} depth={depth + 1} /> : null}</li>)}
    {fins.map((f) => <li key={f.id}>🍾 Lot fini <button type="button" className="linkish" onClick={() => showFini(f.id)}>{f.code}</button> <span className="num text-xs">{fmt(f.nb)} bouteilles · {fmtDate(f.date)}</span> <QChip id={f.qualif} /></li>)}
  </ul>);
}

function lotBilanCols(db, lot, lotId) {
  const kids = childrenOf(db, lotId).filter((ch) => ch.type !== 'cuvee_tirage');
  return db.campagnes.map((c) => {
    const R0 = getR(db, addDays(c.debut, -1)), R1 = getR(db, c.fin); const inC = (d) => d >= c.debut && d <= c.fin;
    const fl = R1.flows.filter((f) => f.lotId === lotId && inC(f.date)); const k = (kind) => sum(fl.filter((f) => f.kind === kind), (f) => f.L);
    const recu = k('entree') + (lot.type !== 'cuvee_tirage' && lot.date && inC(lot.date) ? sum(lot.sources || [], (s) => s.volL) : 0);
    const sorti = -sum(kids.filter((ch) => ch.date && inC(ch.date)), (ch) => (ch.sources.find((s) => s.lotId === lotId) || {}).volL);
    const v = { c, open: R0.lotVol[lotId] || 0, recu, ajout: k('ajout'), perte: k('perte'), jau: k('jaugeage'), prel: k('prelevement'), tir: k('tirage'), vente: k('sortie'), sorti, close: R1.lotVol[lotId] || 0 };
    v.calc = v.open + v.recu + v.ajout + v.perte + v.jau + v.prel + v.tir + v.vente + v.sorti; v.ecart = v.close - v.calc;
    v.any = [v.open, v.recu, v.ajout, v.perte, v.jau, v.prel, v.tir, v.vente, v.sorti, v.close].some((x) => Math.abs(x) > 0.004);
    return v;
  }).filter((v) => v.any);
}
/* Bilan matière du lot, campagne par campagne (affiché en hL) : ouverture + entrées − sorties − pertes = clôture, contrôlé sur le stock réel */
function LotBilan({ lotId }) {
  const { db, R } = useApp(); const lot = R.lots[lotId];
  // 0.38.0-alpha.3 : deux rejeux par campagne, refaits seulement quand la base change (plus à chaque rendu : toasts, synchronisation)
  const cols = useMemo(() => (!lot ? [] : lotBilanCols(db, lot, lotId)), [db, lot, lotId]);
  if (!lot || !cols.length) return null;
  const LINES = [['open', 'Stock à l’ouverture'], ['recu', '+ Reçu (pressurage, reprise, assemblage)'], ['ajout', '+ Préparations ajoutées'], ['perte', '− Pertes (bourbes, lies…)'], ['jau', '± Écart de jaugeage'], ['prel', '− Prélevé pour préparations'], ['tir', '− Mis en bouteilles (tirage)'], ['vente', '− Sorties de cave (vente, distillerie…)'], ['sorti', '− Sorti vers d’autres assemblages'], ['calc', '= Stock de clôture calculé'], ['close', 'Stock en cuve à la clôture'], ['ecart', 'Contrôle']].filter(([key]) => ['open', 'calc', 'close', 'ecart'].includes(key) || cols.some((v) => Math.abs(v[key]) > 0.004));
  const bold = (key) => ['open', 'calc', 'close'].includes(key);
  return (
    <Sec title="Bilan matière du lot par campagne" className="mb-5">
      <Tbl rows={LINES} cols={[{ h: 'Volumes (hL)', r: (l) => <span className={bold(l[0]) ? 'font-semibold' : ''}>{l[1]}</span> }, ...cols.map((v) => ({ h: v.c.nom, cls: 'r', r: (l) => (l[0] === 'ecart' ? (Math.abs(v.ecart) < 0.5 ? <Chip tone="ok">équilibré</Chip> : <Chip tone="bad">écart {fmtL(v.ecart)}</Chip>) : <span className={cx('num', bold(l[0]) && 'font-semibold')}>{fmt(v[l[0]], 1)}</span>) }))]} />
    </Sec>
  );
}

function LotSheet({ id, onClose }) {
  const { db, R, camp, openReport } = useApp(); const lot = R.lots[id];
  const [edit, setEdit] = useState(false); const [opForm, setOpForm] = useState(null); const [perso, setPerso] = useState(false); const [calc, setCalc] = useState(null);
  const { dispo } = useFicheDispo('lot');
  if (!lot) return <Sheet title="Lot introuvable" onClose={onClose}><Empty>Ce lot n’existe plus.</Empty></Sheet>;
  const comp = composition(db, R, id); const ps = Object.values(R.portions).filter((p) => p.lotId === id); const vol = R.lotVol[id] || 0;
  const tir = R.tir[id];
  const items = (o, colorOf, labelOf) => Object.keys(o).map((k, i) => ({ label: labelOf(k), share: o[k], color: colorOf(k, i) }));
  const myApps = R.apps.filter((a) => a.lotId === id && a.produitId);
  const byCont = {}; myApps.forEach((a) => { const k = a.contenantId || '_tirage'; (byCont[k] = byCont[k] || []).push(a); });
  const totals = {}; myApps.forEach((a) => { const k = `${a.produitId}|${a.arrivageId}`; totals[k] = totals[k] || { produitId: a.produitId, numLot: a.numLot, unite: a.unite, qty: 0, n: 0, doses: [] }; totals[k].qty += a.qty; totals[k].n += 1; if (a.dose != null) totals[k].doses.push(a.dose); });
  const anc = [...ancestors(db, id)]; const ancApps = {}; R.apps.filter((a) => anc.includes(a.lotId) && a.produitId).forEach((a) => { const k = `${a.lotId}|${a.produitId}|${a.arrivageId}`; ancApps[k] = ancApps[k] || { lotId: a.lotId, produitId: a.produitId, numLot: a.numLot, unite: a.unite, qty: 0 }; ancApps[k].qty += a.qty; });
  const opsAll = (R.opsByLot[id] || []).map((oid) => db.ops.find((o) => o.id === oid)).filter(Boolean).sort(byDate);
  const contIds = uniq(Object.values(R.pinfo).filter((p) => p.lotId === id).map((p) => p.contenantId).concat(opsAll.flatMap((o) => opConts(o, R)).filter(() => false)));
  const eqIds = uniq(opsAll.flatMap((o) => [...(o.equipementIds || []), o.equipementId].filter(Boolean)));
  const hyg = db.hygiene.filter((h) => (h.cibleType === 'contenant' && contIds.includes(h.cibleId)) || (h.cibleType === 'equipement' && eqIds.includes(h.cibleId))).sort(byDate).reverse();
  const hName = (h) => (h.cibleType === 'contenant' ? contName(db, h.cibleId) : lbl(db, 'equipements', h.cibleId));
  const ans = db.analyses.filter((a) => a.lotId === id).sort(byDate);
  const pertes = {}; R.flows.filter((f) => f.lotId === id && (f.kind === 'perte' || f.kind === 'jaugeage')).forEach((f) => { const k = `${f.kind}|${f.typeId || ''}`; pertes[k] = pertes[k] || { kind: f.kind, typeId: f.typeId, L: 0 }; pertes[k].L += f.L; });
  const preps = R.prepUse.filter((u) => u.lotId === id);
  const blocs = {
    so2: <Sec title="SO₂ total estimé (analyse + ajouts depuis)" className="mb-5"><So2EstimeBloc lotId={id} /></Sec>,
    schema: <Sec title="Schéma de vinification" className="mb-5"><SchemaLotBloc lotId={id} /></Sec>,
    stades: <StadesFrise lotId={id} onEtape={(preset) => setOpForm({ type: preset && preset.newStade ? opEtapePour(db, preset.newStade) : 'etape', preset })} />,
    fermentation: <FermentationSection lotId={id} />,
    composition: <Sec title="Composition calculée" className="mb-5">
        <CompBlock comp={comp} />
        <div className="help mt-1">Calculée récursivement au prorata des volumes engagés dans chaque assemblage, jusqu’aux apports de vendange et entrées de moûts (cru, apporteur). Le classement d’un mélange est celui du cru de rang le plus bas.</div>
      </Sec>,
    portions: <Sec title="Portions (lot + contenant + volume)" className="mb-5">
        <Tbl rows={ps} empty="Aucune portion en cuverie à ce jour." cols={[
          { h: 'Contenant', r: (p) => <ContLink id={p.contenantId} /> }, { h: 'Volume', cls: 'r', r: (p) => <span className="num">{fmtL(p.vol)}</span> }, { h: 'Depuis', cls: 'hm', r: (p) => fmtDate(p.since) },
          { h: 'Agir', r: (p) => <div className="flex flex-wrap gap-1">{opMenu(db).filter((x) => ['intrant', 'soutirage', 'filtration'].includes(x.id)).map((x) => <Btn key={x.id} size="sm" disabled={camp.figee} title={x.aide || ''} onClick={() => setOpForm({ type: x.id, preset: { portionId: p.id } })}>{x.label}</Btn>)}
            <select className="inp" style={{ width: 'auto', padding: '2px 6px', fontSize: 13 }} value="" disabled={camp.figee} onChange={(e) => { if (e.target.value) setOpForm({ type: e.target.value, preset: { portionId: p.id } }); }} aria-label={`Autre opération sur ${contName(db, p.contenantId)}`}>
              <option value="">Autre opération…</option>{opGroupes(db, (x) => OP_BASES_VISIBLES_MENU.includes(x.base)).map((g) => <optgroup key={g.title} label={g.title}>{g.items.map((k) => <option key={k} value={k}>{OP_LABELS[k] || k}</option>)}</optgroup>)}
            </select></div> },
        ]} />
      </Sec>,
    intrants: <Sec title="Intrants cumulés par portion (avec n° de lots fournisseurs)" className="mb-5">
        <DosesCumuleesTable lotId={id} />
        <TeneursTable lotId={id} />
        {Object.keys(byCont).length ? Object.keys(byCont).map((k) => (
          <div key={k} className="mb-3"><div className="mb-1 text-sm font-semibold">{k === '_tirage' ? 'Tirage (mixtion)' : <>Portion en <ContLink id={k} /></>}</div>
            <Tbl rows={byCont[k]} cols={[{ h: 'Date', r: (a) => fmtDate(a.date) }, { h: 'Opération', r: (a) => OP_LABELS[a.opSousType || a.opType] || OP_LABELS[a.opType] }, { h: 'Produit', r: (a) => prodOf(db, a.produitId).nom }, { h: 'Quantité', cls: 'r', r: (a) => <span className="num">{fmt(a.qty, 2)} {a.unite}</span> }, { h: 'Dose', cls: 'r', r: (a) => (a.dose != null ? <span className={cx('num', a.over && 'text-bad')}>{doseTexte(a.dose, a.unite)}</span> : '—') }, { h: 'N° lot fournisseur', r: (a) => <b className="num">{a.numLot || '—'}</b> }, { h: '', r: (a) => (a.unauth ? <Chip tone="bad">non autorisé</Chip> : null) }]} /></div>
        )) : <Empty>Aucun intrant enregistré directement sur ce lot.</Empty>}
        {Object.keys(totals).length ? <div className="mt-2"><div className="lbl">Cumul par produit et lot fournisseur</div><Tbl rows={Object.values(totals)} cols={[{ h: 'Produit', r: (t) => prodOf(db, t.produitId).nom }, { h: 'N° lot fournisseur', r: (t) => <b className="num">{t.numLot || '—'}</b> }, { h: 'Applications', cls: 'r', r: (t) => t.n }, { h: 'Total', cls: 'r', r: (t) => <span className="num">{fmt(t.qty, 2)} {t.unite}</span> }, { h: 'Doses à l’application', cls: 'r', r: (t) => dosesTexte(t.doses, t.unite) || '—' }]} /></div> : null}
        {Object.keys(ancApps).length ? <details className="mt-3"><summary>Intrants hérités des lots d’origine ({Object.keys(ancApps).length})</summary><div className="mt-2"><Tbl rows={Object.values(ancApps)} cols={[{ h: 'Lot d’origine', r: (a) => <LotLink id={a.lotId} /> }, { h: 'Produit', r: (a) => prodOf(db, a.produitId).nom }, { h: 'N° lot fournisseur', r: (a) => <b className="num">{a.numLot || '—'}</b> }, { h: 'Total', cls: 'r', r: (a) => <span className="num">{fmt(a.qty, 2)} {a.unite}</span> }]} /></div></details> : null}
        {preps.length ? <div className="mt-3 text-sm text-ink2">Préparations incorporées : {preps.map((u) => { const p = prepOf(R, u.prepId); return `${p.code} (${PREP_TYPES[p.ptype]}, ${qLabel(p.qualif)}, ${fmtL(u.volL)})`; }).join(' · ')}</div> : null}
      </Sec>,
    amont: <LotTraceAmont id={id} />,
    genealogie: <Sec title="Généalogie" className="mb-5">
        <div className="grid2">
          <div className="tree"><div className="lbl">Ascendance (d’où vient ce lot)</div>{(lot.sources && lot.sources.length) || (lot.parentIds || []).length || (lot.apports || []).length ? <ul style={{ borderLeft: 0, paddingLeft: 0 }}><AncTree lotId={id} /></ul> : <div className="text-sm text-ink2">Lot d’origine (aucun parent enregistré).</div>}</div>
          <div className="tree"><div className="lbl">Descendance (où est parti ce lot)</div>{childrenOf(db, id).length || finisOf(db, id).length ? <DescTree lotId={id} /> : <div className="text-sm text-ink2">Aucun lot enfant.</div>}</div>
        </div>
      </Sec>,
    pertes: Object.keys(pertes).length ? <Sec title="Pertes et écarts" className="mb-5"><div className="flex flex-wrap gap-2">{Object.values(pertes).map((p, i) => <Chip key={i} tone={p.L < 0 ? 'warn' : ''}>{p.kind === 'perte' ? lbl(db, 'typesPerte', p.typeId) : `Écart de jaugeage`} {fmtL(p.L)}</Chip>)}</div></Sec> : null,
    bilan: <LotBilan lotId={id} />,
    hygiene: <Sec title="Journal d’hygiène (cuves et équipements ayant servi à ce lot)" className="mb-5">
        <Tbl rows={hyg.slice(0, 25)} empty="Aucune entrée d’hygiène pour les contenants et équipements de ce lot." cols={[{ h: 'Date', r: (h) => fmtDate(h.date) }, { h: 'Cible', r: (h) => <span>{h.cibleType === 'contenant' ? '🛢 ' : '⚙ '}{hName(h)}</span> }, { h: 'Action', r: (h) => lbl(db, 'actionsHygiene', h.actionId) }, { h: 'Produit', r: (h) => h.produit || '—' }]} />
      </Sec>,
    mouts: <div className="mb-5"><MoutsRecusSection lotId={id} /></div>,
    analyses: <Sec title="Analyses" className="mb-5">
        <Tbl rows={ans} empty="Aucune analyse sur ce lot." cols={[{ h: 'Date', r: (a) => fmtDate(a.date) }, { h: 'Contenant prélevé', r: (a) => (a.contenantId ? contName(db, a.contenantId) : '—') }, { h: 'Valeurs', r: (a) => Object.keys(a.valeurs).map((k) => { const p = db.analysesParams.find((x) => x.id === k) || {}; return `${p.nom} ${fmt(a.valeurs[k], p.dec || 0)}${p.unite ? ' ' + p.unite : ''}`; }).join(' · ') }]} />
      </Sec>,
    operations: <Sec title="Opérations du lot">
        <Tbl rows={opsAll} empty="Aucune opération." cols={[{ h: 'Date', r: (o) => fmtDate(o.date) }, { h: 'Opération', r: (o) => <span className="inline-flex flex-wrap items-center gap-1"><Chip tone={OP_TONE[o.type]}>{opNom(o)}</Chip><GroupeChip x={o} /></span> }, { h: 'Détail', r: (o) => opSummary(db, R, o) }, { h: 'Opérateur(s)', r: (o) => <OperateursChips ids={o.operateurs} /> }, { h: '', r: (o) => <WarnChip n={(R.warn[o.id] || []).length} verified={o.verifie} /> }]} />
      </Sec>,
  };
  return (
    <Sheet wide title={<span>{lot.code} <span className="font-normal text-ink2">— {lot.designation}</span></span>} sub={`${stadeLabel(db, lot.stade)} · ${couleurLabel(db, lot.couleur).toLowerCase()} · ${LOT_TYPES[lot.type].toLowerCase()} · millésime ${lot.millesime || '—'}`} onClose={onClose}
      footer={<><Btn onClick={() => openReport({ kind: 'lot', ids: [id] })}>🖨 Rapport…</Btn><Btn onClick={() => setEdit(true)}>Modifier code / désignation</Btn><Btn onClick={onClose}>Fermer</Btn></>}>
      <div className="mb-5 flex flex-wrap items-center gap-2"><StadeChip id={lot.stade} /><CouleurChip id={lot.couleur} /><QChip id={lot.qualif} /><EChip info={echelleInfo(comp)} />{lot.fractionId ? <Chip tone="info">{fracLabel(db, lot.fractionId)}</Chip> : null}<Chip title="Nature du lot">{LOT_TYPES[lot.type]}</Chip><Chip>{fmtL(vol)} en cuves</Chip>{tir ? <Chip tone="info">{fmt(tir.nb)} bouteilles sur lattes{tir.deg ? ` · ${fmt(tir.deg)} dégorgées` : ''}</Chip> : null}{(R.opsByLot[id] || []).some((oid) => (R.warn[oid] || []).length) ? <Chip tone="warn">⚠ opérations à vérifier</Chip> : null}<span className="ml-auto flex flex-wrap gap-1 no-print"><Btn size="sm" onClick={() => setCalc('so2')} title="SO₂ moléculaire, enrichissement">🧪 Calculs</Btn><Btn size="sm" onClick={() => setPerso(true)} title="Rubriques affichées et leur ordre">⚙ Personnaliser la fiche</Btn></span></div>


      <ConformiteBloc lotId={id} modifiable />
      <RubriquesRendu dispo={dispo} blocs={blocs} />
      {perso ? <FicheRubriquesSheet kind="lot" onClose={() => setPerso(false)} /> : null}
      {calc ? <CalculsSheet lotId={id} onglet={calc} onClose={() => setCalc(null)} /> : null}
      {edit ? <LotEditForm id={id} onClose={() => setEdit(false)} /> : null}
      {opForm ? <OpForm type={opForm.type} preset={opForm.preset} onClose={() => setOpForm(null)} /> : null}
    </Sheet>
  );
}

function FiniSheet({ id, onClose }) {
  const { db, R } = useApp(); const f = (db.lotsFinis || []).find((x) => x.id === id);
  if (!f) return <Sheet title="Lot fini introuvable" onClose={onClose}><Empty>Ce lot fini n’existe plus.</Empty></Sheet>;
  const op = db.ops.find((o) => o.id === f.opId) || {};
  const apps = R.apps.filter((a) => a.opId === f.opId && a.produitId);
  const preps = (op.prepUses || []).map((u) => ({ ...prepOf(R, u.prepId), use: u.volL }));
  return (
    <Sheet wide title={<span>🍾 {f.code} <span className="font-normal text-ink2">— {f.designation}</span></span>} sub={`Lot fini · dégorgé le ${fmtDate(f.date)}`} onClose={onClose}>
      <div className="mb-4 flex flex-wrap gap-2"><StadeChip id={f.stade || stadeRole(db, 'degorgement')} /><CouleurChip id={f.couleur || (R.lots[f.sourceLotId] || {}).couleur} /><QChip id={f.qualif} /><Chip tone="info">{fmt(f.nb)} bouteilles</Chip>{f.dosageGL != null ? <Chip>Dosage {fmt(f.dosageGL, 1)} g/L</Chip> : null}</div>
      <dl className="kv mb-5"><dt>Lot de tirage d’origine</dt><dd><LotLink id={f.sourceLotId} /> — {(R.lots[f.sourceLotId] || {}).designation}</dd><dt>Date du dégorgement</dt><dd>{fmtDate(f.date)}</dd>{operateursValides(db, op.operateurs).length ? <><dt>Dégorgé par</dt><dd><OperateursChips ids={op.operateurs} /></dd></> : null}</dl>
      <Sec title="Liqueur d’expédition" className="mb-5"><Tbl rows={preps} empty="Aucune liqueur d’expédition enregistrée." cols={[{ h: 'Préparation', r: (p) => <b>{p.code}</b> }, { h: 'Type', r: (p) => PREP_TYPES[p.ptype] }, { h: 'Qualification', r: (p) => <QChip id={p.qualif} /> }, { h: 'Volume utilisé', cls: 'r', r: (p) => <span className="num">{fmtL(p.use)}</span> }]} />
        {preps.map((p) => { const pa = R.apps.filter((a) => a.prepId === p.id && a.produitId); return pa.length ? <div key={p.id} className="mt-2"><div className="lbl">Ingrédients de {p.code}</div><Tbl rows={pa} cols={[{ h: 'Produit', r: (a) => prodOf(db, a.produitId).nom }, { h: 'Quantité', cls: 'r', r: (a) => <span className="num">{fmt(a.qty, 2)} {a.unite}</span> }, { h: 'N° lot fournisseur', r: (a) => <b className="num">{a.numLot || '—'}</b> }]} /></div> : null; })}
      </Sec>
      <ConformiteBloc lotId={f.id} modifiable />
      <Sec title="SO₂ total estimé (lot de tirage + liqueur d’expédition)" className="mb-5"><So2EstimeBloc lotId={f.id} /></Sec>
      <Sec title="Bouchon, muselet et autres matières sèches" className="mb-5"><Tbl rows={apps} empty="Aucune matière sèche enregistrée." cols={[{ h: 'Produit', r: (a) => prodOf(db, a.produitId).nom }, { h: 'Quantité', cls: 'r', r: (a) => <span className="num">{fmt(a.qty, 0)} {a.unite}</span> }, { h: 'N° lot fournisseur', r: (a) => <b className="num">{a.numLot || '—'}</b> }]} /></Sec>
      <Sec title="Traçabilité amont (de la bouteille à la vendange)"><div className="tree"><ul style={{ borderLeft: 0, paddingLeft: 0 }}><AncTree lotId={f.sourceLotId} /></ul></div></Sec>
    </Sheet>
  );
}
