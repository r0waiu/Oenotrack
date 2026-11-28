/* ============ TRAÇABILITÉ › TOUTES LES ÉTAPES (0.28.0-alpha.1) : du raisin au dégorgé ============
   Moteur : 25b-trace-etapes.js. Un seul champ de recherche (n° de pesée ou de marc, lot, lot fini, cuve, apporteur, cru, DAE, n° de lot
   d'un produit, date) ; la chaîne s'affiche étape par étape, en amont et en aval de ce qui est choisi, et s'imprime. */
const ETAPE_ICONES = { raisin: '🍇', pressurage: '🗜', mout: '🛢', assemblage: '⚗', tirage: '🍾', fini: '🥂', sortie: '🚚' };
function TraceEtapeCarte({ x, onChoisir }) {
  const { db, R } = useApp();
  if (x.type === 'lot') { const l = x.l; const r = traceLotResume(db, R, l.id); return (
    <div className={cx('card p-2.5', x.cible && 'ring-2')} style={x.cible ? { boxShadow: '0 0 0 2px var(--accent)' } : null} data-chaine-lot={l.id}>
      <div className="flex flex-wrap items-center gap-1.5"><LotLink id={l.id} /><StadeChip id={(R.lots[l.id] || l).stade} compact />{x.cible ? <Chip tone="info">recherché</Chip> : null}</div>
      <div className="text-xs text-ink2">{[l.designation, l.date ? fmtDate(l.date) : ''].filter(Boolean).join(' · ')}</div>
      <div className="mt-1 flex flex-wrap gap-1 text-xs">{r.vol > 0.5 ? <Chip>{fmtL(r.vol)}</Chip> : null}{r.bouteilles ? <Chip>{`${fmt(r.bouteilles)} bt`}</Chip> : null}{r.cuves.map((c) => <ContLink key={c.id} id={c.id} />)}{r.intrants.length ? <span title={r.intrants.map((p) => p.nom).join(', ')}>{`🧪 ${r.intrants.length} intrant(s)`}</span> : null}{r.analyses ? <span>{`🔬 ${r.analyses} analyse(s)`}</span> : null}</div>
      {!x.cible ? <button type="button" className="linkish mt-1 text-xs" onClick={() => onChoisir({ type: 'lot', id: l.id })}>centrer ici</button> : null}
    </div>); }
  if (x.type === 'fini') { const f = x.f; return (
    <div className="card p-2.5" style={x.cible ? { boxShadow: '0 0 0 2px var(--accent)' } : null} data-chaine-fini={f.id}>
      <div className="flex flex-wrap items-center gap-1.5"><b>{f.code}</b>{x.cible ? <Chip tone="info">recherché</Chip> : null}</div>
      <div className="text-xs text-ink2">{[f.designation, fmtDate(f.date), `${fmt(f.nb)} bt`].filter(Boolean).join(' · ')}</div>
      {!x.cible ? <button type="button" className="linkish mt-1 text-xs" onClick={() => onChoisir({ type: 'fini', id: f.id })}>centrer ici</button> : null}
    </div>); }
  const o = x.o; const ap = (db.apporteurs || []).find((a) => a.id === o.apporteurId); const cru = (db.crus || []).find((c) => c.id === o.cruId);
  const titre = o.type === 'apport' && o.pesee ? `Pesée n° ${o.pesee.num}` : o.type === 'pressurage' && o.marc ? `Marc n° ${o.marc.num}` : o.type === 'sortie' ? (o.ref || opNom(o)) : opNom(o);
  const sous = o.type === 'apport' ? [ap && ap.nom, cru && `${cru.nom} (${cruEchUn(db, o.cruId)})`, lbl(db, 'cepages', o.cepageId), `${fmt(o.kg)} kg`] : o.type === 'pressurage' ? [(o.parentSpec || {}).code, `${fmt(sum(o.charges || [], (c) => c.kg))} kg chargés`] : o.type === 'sortie' ? [o.destinataire, fmtL(o.volL), o.motif] : o.type === 'entree_mout' ? [ap && ap.nom, o.ref] : [];
  return (
    <div className="card p-2.5" style={x.cible ? { boxShadow: '0 0 0 2px var(--accent)' } : null} data-chaine-op={o.id}>
      <div className="flex flex-wrap items-center gap-1.5"><b>{titre}</b><span className="text-xs text-ink2">{fmtDate(o.date)}</span>{x.cible ? <Chip tone="info">recherché</Chip> : null}</div>
      <div className="text-xs text-ink2">{sous.filter(Boolean).join(' · ')}</div>
      {!x.cible ? <button type="button" className="linkish mt-1 text-xs" onClick={() => onChoisir({ type: 'op', id: o.id })}>centrer ici</button> : null}
    </div>);
}
// qInit : recherche reprise de l'en-tête (0.48.0-alpha.1)
function TraceEtapes({ onCible, qInit }) {
  const { db, R } = useApp(); const [q, setQ] = useState(qInit || ''); const [cible, setCible0] = useState(null); const ref = useRef(null);
  const setCible = (c) => { setCible0(c); if (onCible) onCible({ ...c, titre: nomCible(c) }); }; // titre lisible (test de traçabilité d'un audit)
  const res = useMemo(() => (q.trim() ? traceChercher(db, R, q) : []), [db, R, q]);
  const ch = useMemo(() => (cible ? traceChaine(db, R, cible) : null), [db, R, cible]);
  const out = useReportOutput(ref, 'tracabilite-chaine');
  const nomCible = (c) => { const x = res.find((y) => y.type === c.type && y.id === c.id); if (x) return `${x.titre}${x.date ? ` (${fmtDate(x.date)})` : ''}`; if (c.type === 'lot') return lotCode(db, R, c.id); if (c.type === 'fini') { const f = (db.lotsFinis || []).find((y) => y.id === c.id); return f ? f.code : c.id; } const o = (db.ops || []).find((y) => y.id === c.id); return o ? `${o.type === 'apport' && o.pesee ? `Pesée n° ${o.pesee.num}` : o.type === 'pressurage' && o.marc ? `Marc n° ${o.marc.num}` : o.ref || opNom(o)} (${fmtDate(o.date)})` : c.id; };
  return (
    <div data-trace-etapes="">
      <div className="card mb-3 p-3">
        <Field label="Chercher à n’importe quelle étape, du raisin au dégorgé" help="N° de pesée (« pesée 12 ») ou de marc (« marc 3 »), code de lot, lot fini, cuve, apporteur, cru ou lieu-dit, n° de bon ou de DAE, n° de lot d’un produit, date (21/09/2026)…">
          <input className="inp" value={q} onChange={(e) => { setQ(e.target.value); }} placeholder="ex. pesée 12, P26-03, LF-26-001, Cuve 07, DAE 26FR…" aria-label="Rechercher une étape" autoFocus />
        </Field>
        {q.trim() && !res.length ? <p className="help mt-2">Rien trouvé : essayez un autre repère.</p> : null}
        {res.length ? <div className="mt-3 space-y-2" data-trace-resultats="">{ETAPES_TRACE.filter(([e]) => res.some((x) => x.etape === e)).map(([e, el]) => (
          <div key={e}><div className="lbl mb-1">{ETAPE_ICONES[e]} {el}</div>
            <div className="flex flex-wrap gap-1.5">{res.filter((x) => x.etape === e).map((x) => <button key={`${x.type}${x.id}`} type="button" className={cx('chip', cible && cible.type === x.type && cible.id === x.id && 'chip-info')} onClick={() => setCible({ type: x.type, id: x.id })} data-resultat={x.id} title={x.sous || ''}><b>{x.titre}</b>{x.date ? <span className="ml-1 text-ink2">{fmtDate(x.date)}</span> : null}</button>)}</div></div>))}</div> : null}
      </div>
      {ch ? <Sec title={`Chaîne de traçabilité — ${nomCible(cible)}`} right={<BoutonsSortie out={out} />}>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,210px),1fr))' }} data-chaine="">
          {ETAPES_TRACE.map(([e, el]) => { const L = ch.etapes[e] || []; return (
            <div key={e} data-etape={e}><div className="lbl mb-1.5">{ETAPE_ICONES[e]} {el} ({L.length})</div>
              <div className="space-y-2">{L.length ? L.map((x) => <TraceEtapeCarte key={`${x.type}${x.id}`} x={x} onChoisir={setCible} />) : <p className="help">—</p>}</div></div>); })}
        </div>
        <div className="hidden"><div ref={ref} className="report">
          <ReportHead title="Chaîne de traçabilité" sub={nomCible(cible)} />
          {ETAPES_TRACE.map(([e, el]) => { const L = ch.etapes[e] || []; if (!L.length) return null; return (
            <div key={e}><h3>{el}</h3><RTable head={['Repère', 'Date', 'Détail']} rows={L.map((x) => (x.type === 'lot' ? [x.l.code, fmtDate(x.l.date), [x.l.designation, (() => { const r = traceLotResume(db, R, x.l.id); return [r.vol > 0.5 ? fmtL(r.vol) : '', r.cuves.map((c) => c.nom).join(', '), r.intrants.length ? `intrants : ${r.intrants.map((p) => p.nom).join(', ')}` : ''].filter(Boolean).join(' · '); })()].filter(Boolean).join(' — ')]
              : x.type === 'fini' ? [x.f.code, fmtDate(x.f.date), `${x.f.designation || ''} — ${fmt(x.f.nb)} bt`]
              : [x.o.type === 'apport' && x.o.pesee ? `Pesée n° ${x.o.pesee.num}` : x.o.type === 'pressurage' && x.o.marc ? `Marc n° ${x.o.marc.num}` : x.o.ref || opNom(x.o), fmtDate(x.o.date), x.o.type === 'apport' ? [((db.apporteurs || []).find((a) => a.id === x.o.apporteurId) || {}).nom, ((db.crus || []).find((c) => c.id === x.o.cruId) || {}).nom, `${fmt(x.o.kg)} kg`].filter(Boolean).join(' · ') : x.o.type === 'sortie' ? [x.o.destinataire, fmtL(x.o.volL)].filter(Boolean).join(' · ') : (x.o.parentSpec || {}).designation || '']))} /></div>); })}
        </div></div>
      </Sec> : <p className="help">Choisissez un résultat : la chaîne complète s’affiche, des pesées aux expéditions.</p>}
    </div>
  );
}
