/* ============ RAPPORTS IMPRIMABLES (lots / contenants, sections au choix) ============ */
const RPT_SECTIONS = [
  { id: 'ident', label: 'Identification' }, { id: 'contenu', label: 'Contenu / portions' }, { id: 'comp', label: 'Composition (cépages, millésimes, fractions, revendications)' },
  { id: 'origine', label: 'Origines (échelle, crus, apporteurs)' }, { id: 'intrants', label: 'Intrants cumulés (n° de lots fournisseurs)' }, { id: 'ops', label: 'Historique des opérations' },
  { id: 'analyses', label: 'Analyses' }, { id: 'hygiene', label: 'Hygiène' }, { id: 'genea', label: 'Généalogie (lots d’origine / dérivés)' },
];
const RPT_KEY = 'oenotrack-rapport-sections';

function RBar({ items }) {
  const l = items.filter((i) => i.share > 0.0005);
  if (!l.length) return <div className="muted">—</div>;
  return (<div><div className="cbar">{l.map((i) => <i key={i.key} style={{ width: `${i.share * 100}%`, background: i.color }} />)}</div>
    <div className="muted" style={{ fontSize: 11.5 }}>{l.map((i) => `${i.label} ${pct(i.share, i.share < 0.1 ? 1 : 0)}`).join(' · ')}</div></div>);
}
function RComp({ comp, keys }) {
  const { db } = useApp(); const it = compItems(db, comp);
  const T = { cepages: 'Cépages', millesimes: 'Millésimes', fractions: 'Fractions de moût', qualifs: 'Revendications', echelles: ECH.nom, crus: 'Crus (villages)', apporteurs: 'Partenaires' };
  return <div className="rcols">{keys.map((k) => <div key={k}><b>{T[k]}</b><RBar items={it[k]} /></div>)}</div>;
}
function RTable({ head, rows, empty }) {
  if (!rows.length) return <div className="muted">{empty || 'Aucune donnée.'}</div>;
  return <table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>;
}
const rIntrants = (db, rows) => rows.map((r) => [prodOf(db, r.produitId).nom || '?', r.numLot || '—', `${fmt(r.qty, 2)} ${r.unite || ''}`, r.n, r.direct ? 'sur ce contenu' : 'en amont (lots d’origine)', r.unauth ? 'non autorisé' : '']);
const rAnalyses = (db, list) => list.map((a) => [fmtDate(a.date), lotCode(db, null, a.lotId), a.contenantId ? contName(db, a.contenantId) : '', db.analysesParams.filter((p) => a.valeurs && a.valeurs[p.id] != null).map((p) => `${p.nom} ${fmt(a.valeurs[p.id], p.dec)}${p.unite ? ' ' + p.unite : ''}`).join(' · ')]);
const rHyg = (db, list) => list.map((h) => [fmtDate(h.date), h.cibleType === 'contenant' ? contName(db, h.cibleId) : lbl(db, 'equipements', h.cibleId), lbl(db, 'actionsHygiene', h.actionId), h.produit || '', operateursNoms(db, h.operateurs) || h.operateur || '']);

function RptLot({ id, S, brk }) {
  const { db, R } = useApp(); const l = R.lots[id] || lotById(db, id); if (!l) return null;
  const comp = composition(db, R, id); const ei = echelleInfo(comp); const ps = Object.values(R.portions).filter((p) => p.lotId === id); const tir = R.tir[id];
  const ops = (R.opsByLot[id] || []).map((oid) => db.ops.find((o) => o.id === oid)).filter(Boolean).sort(byDate);
  const conts = uniq(Object.values(R.pinfo).filter((p) => p.lotId === id).map((p) => p.contenantId));
  return (
    <div className={cx('rpt-item', brk && 'pdf-break')}>
      <h2>Lot {l.code} <span className="muted" style={{ fontWeight: 400 }}>— {l.designation}</span></h2>
      {S.ident ? <table><tbody>
        <tr><th>Nature</th><td>{LOT_TYPES[l.type]}{l.fractionId ? ` · ${fracLabel(db, l.fractionId)}` : ''}</td><th>Millésime</th><td>{l.millesime || '—'}</td></tr>
        <tr><th>Revendication</th><td>{qLabel(l.qualif)}</td><th>{ECH.nom}</th><td>{eLabel(ei.id)}{ei.partiel ? ' (origine partielle)' : ''}</td></tr>
        <tr><th>Stade</th><td>{stadeLabel(db, l.stade)}</td><th>Couleur</th><td>{couleurLabel(db, l.couleur)}</td></tr>
        <tr><th>Volume en cuverie</th><td>{fmtL(R.lotVol[id] || 0)}</td><th>Bouteilles</th><td>{tir ? `${fmt(tir.nb)} sur lattes${tir.deg ? ` · ${fmt(tir.deg)} dégorgées` : ''}` : '—'}</td></tr>
      </tbody></table> : null}
      {S.contenu ? <><h3>Portions en contenants</h3><RTable head={['Contenant', 'Site', 'Volume', 'Depuis']} rows={ps.map((p) => [contName(db, p.contenantId), siteName(db, (db.contenants.find((c) => c.id === p.contenantId) || {}).siteId), fmtL(p.vol), fmtDate(p.since)])} empty="Aucune portion en cuverie à ce jour." /></> : null}
      {S.comp ? <><h3>Composition calculée</h3><RComp comp={comp} keys={['cepages', 'millesimes', 'fractions', 'qualifs']} /></> : null}
      {S.origine ? <><h3>Origines</h3><RComp comp={comp} keys={['echelles', 'crus', 'apporteurs']} /></> : null}
      {S.intrants ? <><h3>Intrants cumulés</h3><RTable head={['Produit', 'N° lot fournisseur', 'Quantité', 'Ajouts', 'Portée', 'Contrôle']} rows={rIntrants(db, intrantsForLots(db, R, [id], true))} empty="Aucun intrant." /></> : null}
      {S.ops ? <><h3>Opérations</h3><RTable head={['Date', 'Opération', 'Détail', 'Opérateur(s)']} rows={ops.map((o) => [fmtDate(o.date), opNom(o), opSummary(db, R, o), operateursNoms(db, o.operateurs)])} /></> : null}
      {S.analyses ? <><h3>Analyses</h3><RTable head={['Date', 'Lot', 'Contenant', 'Résultats']} rows={rAnalyses(db, db.analyses.filter((a) => a.lotId === id).sort(byDate))} empty="Aucune analyse." /></> : null}
      {S.hygiene ? <><h3>Hygiène des contenants utilisés</h3><RTable head={['Date', 'Cible', 'Action', 'Produit', 'Opérateur(s)']} rows={rHyg(db, db.hygiene.filter((h) => h.cibleType === 'contenant' && conts.includes(h.cibleId)).sort(byDate))} empty="Aucune entrée." /></> : null}
      {S.genea ? <><h3>Généalogie</h3><table><tbody><tr><th>Lots d’origine</th><td>{[...ancestors(db, id)].map((x) => lotCode(db, R, x)).join(', ') || '—'}</td></tr><tr><th>Lots dérivés</th><td>{[...descendants(db, id)].map((x) => lotCode(db, R, x)).concat(finisOf(db, id).map((f) => f.code)).join(', ') || '—'}</td></tr></tbody></table></> : null}
    </div>
  );
}
function RptCont({ id, S, brk }) {
  const { db, R } = useApp(); const c = db.contenants.find((x) => x.id === id); if (!c) return null;
  const ps = Object.values(R.portions).filter((p) => p.contenantId === id); const vol = R.contVol[id] || 0; const comp = ps.length ? contentComp(db, R, id) : null;
  const ops = db.ops.filter((o) => opConts(o, R).includes(id)).sort(byDate);
  return (
    <div className={cx('rpt-item', brk && 'pdf-break')}>
      <h2>{c.nom} <span className="muted" style={{ fontWeight: 400 }}>— {lbl(db, 'typesContenant', c.type)} · {lbl(db, 'matieres', c.matiere)}</span></h2>
      {S.ident ? <table><tbody>
        <tr><th>Site</th><td>{siteName(db, c.siteId)}</td><th>Capacité</th><td>{fmtL(c.volMax)}</td></tr>
        <tr><th>Volume</th><td>{fmtL(vol)} ({pct(c.volMax ? vol / c.volMax : 0)})</td><th>Statut / année</th><td>{c.statut === 'archive' ? 'archivé' : 'actif'}{c.annee ? ` · ${c.annee}` : ''}</td></tr>
        {c.fabricant || baremeDe(db, c.id) ? <tr><th>Fabricant</th><td>{c.fabricant || '—'}</td><th>Barème de jaugeage</th><td>{baremeResume(db, c.id) || '—'}</td></tr> : null}
        {comp ? <tr><th>Revendication</th><td>{uniq(ps.map((p) => (R.lots[p.lotId] || {}).qualif)).map(qLabel).join(' + ')}</td><th>{ECH.nom}</th><td>{eLabel(echelleInfo(comp).id)}</td></tr> : null}
        {ps.length ? <tr><th>Stade</th><td>{uniq(ps.map((p) => stadeLabel(db, (R.lots[p.lotId] || {}).stade))).join(' + ')}</td><th>Couleur</th><td>{uniq(ps.map((p) => couleurLabel(db, (R.lots[p.lotId] || {}).couleur))).join(' + ')}</td></tr> : null}
      </tbody></table> : null}
      {S.contenu ? <><h3>Lots présents</h3><RTable head={['Lot', 'Désignation', 'Revendication', 'Volume', 'Depuis']} rows={ps.map((p) => { const l = R.lots[p.lotId] || {}; return [l.code, l.designation, qLabel(l.qualif), fmtL(p.vol), fmtDate(p.since)]; })} empty="Contenant vide." /></> : null}
      {S.comp && comp ? <><h3>Composition du contenu{ps.length > 1 ? ` (mélange de ${ps.length} lots)` : ''}</h3><RComp comp={comp} keys={['cepages', 'millesimes', 'fractions', 'qualifs']} /></> : null}
      {S.origine && comp ? <><h3>Origines</h3><RComp comp={comp} keys={['echelles', 'crus', 'apporteurs']} /></> : null}
      {S.intrants && ps.length ? <><h3>Intrants cumulés du contenu</h3><RTable head={['Produit', 'N° lot fournisseur', 'Quantité', 'Ajouts', 'Portée', 'Contrôle']} rows={rIntrants(db, intrantsForLots(db, R, ps.map((p) => p.lotId), true))} empty="Aucun intrant." /></> : null}
      {S.ops ? <><h3>Opérations sur ce contenant</h3><RTable head={['Date', 'Opération', 'Détail', 'Opérateur(s)']} rows={ops.map((o) => [fmtDate(o.date), opNom(o), opSummary(db, R, o), operateursNoms(db, o.operateurs)])} /></> : null}
      {S.analyses ? <><h3>Analyses prélevées ici</h3><RTable head={['Date', 'Lot', 'Contenant', 'Résultats']} rows={rAnalyses(db, db.analyses.filter((a) => a.contenantId === id).sort(byDate))} empty="Aucune analyse." /></> : null}
      {S.hygiene ? <><h3>Hygiène</h3><RTable head={['Date', 'Cible', 'Action', 'Produit', 'Opérateur(s)']} rows={rHyg(db, db.hygiene.filter((h) => h.cibleType === 'contenant' && h.cibleId === id).sort(byDate))} empty="Aucune entrée." /></> : null}
    </div>
  );
}

// Sorties d'un rapport (0.28.0-alpha.1) : « 🖨 Imprimer » (boîte d'impression de l'appareil ; à défaut le PDF), « ⬇ PDF », « ⬇ HTML »
function useReportOutput(ref, filename, opts = {}) {
  const { toast, db } = useApp();
  // opts : { orientation, format (zone d'impression : 'etiq-a4', 'etiq-a6'…), units(racine) → pages du PDF (0.29.0-alpha.1 : étiquettes) }
  const meta = () => ({ units: opts.units ? opts.units(ref.current) : [{ el: ref.current, orientation: opts.orientation || 'portrait', fit: 'width' }], root: ref.current, filename: `${filename}.pdf`, title: filename, author: (db.entreprise || {}).nom, toast });
  const pdf = async () => { if (!ref.current) return; await printPdf(meta()); };
  const print = async () => { if (!ref.current) return; const r = await imprimerZone(ref.current, { titre: filename, orientation: opts.orientation, format: opts.format }); if (r === 'bloque') await pdfRepli(meta()); };
  const direct = print;
  const download = async () => {
    const css = Array.from(document.querySelectorAll('style')).map((s) => s.textContent).join('\n').split('/* rapports imprimables */')[1] || '';
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${filename}</title><style>*,*::before,*::after{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}body{margin:0;font-family:Barlow,Arial,sans-serif}${css.split('@media (max-width')[0]}@page{size:A4${opts.orientation === 'paysage' ? ' landscape' : ''};margin:12mm}.report .rpt-item+.rpt-item{break-before:page}</style></head><body>${ref.current ? ref.current.outerHTML : ''}</body></html>`;
    const r = await saveFile(`${filename}.html`, html, 'text/html'); if (r.ok) toast('Rapport enregistré : ouvrez-le puis imprimez-le (Ctrl/Cmd + P).'); else if (!r.declined) toast(failMsg(r), 'bad');
  };
  return { print, pdf, download, direct };
}
// boutons de sortie d'un rapport : « 🖨 Imprimer » ouvre la boîte d'impression ; « ⬇ PDF » et « ⬇ HTML » en parallèle
function BoutonsSortie({ out, html = true }) {
  return <>{html ? <Btn onClick={out.download} title="Page web prête à imprimer, à garder ou à envoyer">⬇ HTML</Btn> : null}<Btn onClick={out.pdf} title="Enregistrer le PDF (à envoyer, archiver ou imprimer plus tard)" data-sortie-pdf="">⬇ PDF</Btn><Btn kind="primary" onClick={out.print} title="Ouvrir la boîte d’impression de l’appareil" data-sortie-imprimer="">🖨 Imprimer</Btn></>;
}
const ReportHead = ({ title, sub }) => { const { db } = useApp(); const e = db.entreprise || {}; return (<div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>{e.logo ? <img src={e.logo} alt={e.nom || 'Logo'} style={{ maxHeight: 54, maxWidth: 170, objectFit: 'contain' }} /> : <Logo size={40} />}<div><h1>{title}</h1><div className="muted" style={{ fontSize: 12 }}>{e.nom ? `${e.nom} · ` : ''}Œnotrack · {sub} · édité le {fmtDate(todayISO())}{db.sites.length ? ` · ${db.sites.map((s) => s.nom).join(', ')}` : ''}</div></div></div>); };

function ReportDialog({ init, onClose }) {
  const { db, R } = useApp();
  const [kind, setKind] = useState(init.kind === 'cont' ? 'cont' : 'lot');
  const [ids, setIds] = useState(() => (init.ids && init.ids.length ? init.ids : []));
  const [q, setQ] = useState('');
  const [secs, setSecs] = useState(() => { try { const s = JSON.parse(window.localStorage.getItem(RPT_KEY) || 'null'); if (Array.isArray(s)) return s; } catch (e) { /* ignoré */ } return ['ident', 'contenu', 'comp', 'origine', 'intrants', 'ops']; });
  const [view, setView] = useState(!!(init.ids && init.ids.length));
  const ref = useRef(null);
  useEffect(() => { try { window.localStorage.setItem(RPT_KEY, JSON.stringify(secs)); } catch (e) { /* ignoré */ } }, [secs]);
  const all = kind === 'lot'
    ? Object.values(R.lots).filter((l) => (R.lotVol[l.id] || 0) > 0.5 || (R.tir[l.id] || {}).nb > 0 || ids.includes(l.id)).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true })).map((l) => ({ id: l.id, label: `${l.code} — ${l.designation || ''}`, sub: `${fmtL(R.lotVol[l.id] || 0)} · ${qDef(l.qualif).court}` }))
    : db.contenants.filter((c) => c.statut !== 'archive' || ids.includes(c.id)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true })).map((c) => ({ id: c.id, label: c.nom, sub: `${siteName(db, c.siteId)} · ${fmtL(R.contVol[c.id] || 0)}` }));
  const shown = all.filter((x) => norm(x.label + ' ' + x.sub).includes(norm(q)));
  const S = Object.fromEntries(secs.map((s) => [s, true]));
  const tog = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const title = kind === 'lot' ? (ids.length === 1 ? `Rapport du lot ${lotCode(db, R, ids[0])}` : `Rapport de ${ids.length} lots`) : (ids.length === 1 ? `Rapport — ${contName(db, ids[0])}` : `Rapport de ${ids.length} contenants`);
  const out = useReportOutput(ref, `oenotrack-rapport-${todayISO()}`);
  return (
    <Sheet wide title="Rapport imprimable" sub={view ? title : 'Choisissez les éléments et les rubriques à imprimer'} onClose={onClose}
      footer={view ? <><Btn onClick={() => setView(false)} className="mr-auto">← Modifier la sélection</Btn><BoutonsSortie out={out} /></>
        : <><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" disabled={!ids.length || !secs.length} onClick={() => setView(true)}>Aperçu du rapport ({ids.length})</Btn></>}>
      {!view ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">{[['lot', 'Lots'], ['cont', 'Contenants']].map(([k, l]) => <Btn key={k} kind={kind === k ? 'primary' : undefined} onClick={() => { if (k !== kind) { setKind(k); setIds([]); } }}>{l}</Btn>)}</div>
          <div className="grid2">
            <Group label={`Éléments (${ids.length} sélectionné${ids.length > 1 ? 's' : ''})`}>
              <div className="mb-2 flex flex-wrap gap-2"><input className="inp" style={{ flex: '1 1 160px', width: 'auto' }} placeholder="Filtrer…" value={q} onChange={(e) => setQ(e.target.value)} /><Btn size="sm" onClick={() => setIds(uniq([...ids, ...shown.map((x) => x.id)]))}>Tout cocher</Btn><Btn size="sm" onClick={() => setIds([])}>Aucun</Btn></div>
              <div className="card max-h-72 overflow-y-auto p-2">{shown.length ? shown.map((x) => <div key={x.id} className="py-1"><Check checked={ids.includes(x.id)} onChange={() => tog(ids, setIds, x.id)} label={<span>{x.label} <span className="text-xs text-ink2">· {x.sub}</span></span>} /></div>) : <div className="text-sm text-ink2">Aucun élément.</div>}</div>
            </Group>
            <Group label="Rubriques à intégrer">
              <div className="card p-2">{RPT_SECTIONS.filter((s) => kind === 'lot' || s.id !== 'genea').map((s) => <div key={s.id} className="py-1"><Check checked={secs.includes(s.id)} onChange={() => tog(secs, setSecs, s.id)} label={s.label} /></div>)}</div>
              <div className="help">Vos rubriques sont mémorisées pour les prochains rapports. Chaque {kind === 'lot' ? 'lot' : 'contenant'} commence sur une nouvelle page.</div>
            </Group>
          </div>
        </div>
      ) : (
        <div ref={ref} className="report">
          <ReportHead title={title} sub={kind === 'lot' ? 'rapport de lots' : 'rapport de contenants'} />
          {ids.map((id, i) => (kind === 'lot' ? <RptLot key={id} id={id} S={S} brk={i > 0} /> : <RptCont key={id} id={id} S={S} brk={i > 0} />))}
        </div>
      )}
    </Sheet>
  );
}
