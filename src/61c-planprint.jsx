/* ============ IMPRESSION DU PLAN DE CAVE (une page par site, informations et légendes au choix) ============ */
const PLAN_INFOS = [['vol', 'Volume / capacité'], ['pct', 'Taux de remplissage'], ['lots', 'Lots (codes)'], ['stade', 'Stade du vin'], ['coul', 'Couleur du vin'], ['cep', 'Cépages (%)'], ['rev', 'Revendication'], ['ech', 'Classement (échelle)'], ['mil', 'Millésime(s)']];
const PLAN_LEG = [['cep', 'Couleurs d’intérieur (cépages, couleurs ou stades)'], ['contour', 'Signification des contours'], ['zones', 'Zones du plan'], ['stats', 'Totaux du site'], ['table', 'Tableau des contenants (page suivante)']];
const PLAN_KEY = 'oenotrack-plan-impression';
const PLAN_TXT = { s: 0.85, m: 1, l: 1.22 };

const cepCourt = (db, id) => {
  const l = String(lbl(db, 'cepages', id)).replace(/ \(.*$/, '').trim(); const n = norm(l);
  if (n.startsWith('chard')) return 'CH'; if (n.includes('meunier')) return 'PM'; if (n === 'pinot noir') return 'PN';
  const w = l.split(/\s+/).filter(Boolean); return w.length > 1 ? w.map((x) => x[0]).join('').toUpperCase() : l.slice(0, 4);
};
function planInfoLines(db, R, c, info) {
  const vol = R.contVol[c.id] || 0; const ps = lotsOfCont(R, c.id); const comp = ps.length ? contentComp(db, R, c.id) : null; const L = [];
  if (info.vol) L.push(`${fmtHL(vol)} / ${fmtL(c.volMax)}`);
  if (info.pct && c.volMax) L.push(`${pct(vol / c.volMax)} rempli`);
  if (info.lots) L.push(ps.length ? ps.map((p) => (R.lots[p.lotId] || {}).code).join(' + ') : 'vide');
  if (info.stade && ps.length) L.push(uniq(ps.map((p) => stadeCourt(db, (R.lots[p.lotId] || {}).stade))).join(' + '));
  if (info.coul && ps.length) L.push(uniq(ps.map((p) => couleurLabel(db, (R.lots[p.lotId] || {}).couleur))).join(' + '));
  if (info.cep && comp) L.push(Object.keys(comp.cepages).filter((k) => comp.cepages[k] >= 0.005).sort((a, b) => comp.cepages[b] - comp.cepages[a]).slice(0, 3).map((k) => `${cepCourt(db, k)} ${fmt(comp.cepages[k] * 100)} %`).join(' · '));
  if (info.rev && ps.length) L.push(uniq(ps.map((p) => qDef((R.lots[p.lotId] || {}).qualif).court)).join(' + '));
  if (info.ech && comp) { const e = echelleInfo(comp).id; if (e) L.push(eLabel(e)); }
  if (info.mil && comp) L.push(Object.keys(comp.millesimes || {}).sort().join(' + '));
  return L.filter(Boolean);
}
const PlanSw = ({ color, ring, dash }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" style={{ flex: 'none', display: 'block' }}>
    {ring ? (dash ? <rect x="1.5" y="1.5" width="11" height="11" rx="2" fill="none" stroke={color} strokeWidth="2" strokeDasharray="3 2" /> : <circle cx="7" cy="7" r="5" fill="#FFFFFF" stroke={color} strokeWidth="3" />)
      : <rect x="1" y="1" width="12" height="12" rx="3" fill={color} stroke="#00000040" />}
  </svg>
);

function PlanSvg({ site, conts, info, contour, interieur, motif, height, txt }) {
  const { db, R } = useApp(); const dbv = { ...db, apparence: { ...db.apparence, contourMode: contour, interieurMode: interieur || 'cepage', interieurMotif: motif || '' } };
  const k = PLAN_TXT[txt] || 1; const fsN = 12.5 * k, fsI = 10 * k, lineH = 12 * k;
  const items = conts.map((c) => ({ c, t: tileSize(db, c), x: num(c.x), y: num(c.y), lines: planInfoLines(db, R, c, info) }));
  const zones = (site && site.zones) || [];
  const bottom = (it) => it.y + it.t.sh + 22 * k + it.lines.length * lineH + 4;
  const xs = [...items.map((i) => i.x), ...zones.map((z) => z.x)], ys = [...items.map((i) => i.y), ...zones.map((z) => z.y)];
  const xe = [...items.map((i) => i.x + i.t.w), ...zones.map((z) => z.x + z.w)], ye = [...items.map((i) => Math.max(i.y + i.t.h, bottom(i))), ...zones.map((z) => z.y + z.h)];
  if (!xs.length) return <div className="pp-empty">Aucun contenant sur ce site.</div>;
  const minX = Math.min(...xs) - 14, minY = Math.min(...ys) - 14, W = Math.max(...xe) - minX + 14, H = Math.max(...ye) - minY + 14;
  return (
    <svg viewBox={`${minX} ${minY} ${W} ${H}`} width="100%" height={height} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Plan de cave ${site ? site.nom : ''}`} style={{ display: 'block' }}>
      {zones.map((z) => (
        <g key={z.id}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="10" fill={z.couleur || '#888888'} fillOpacity="0.06" stroke={z.couleur || '#888888'} strokeWidth="2" strokeDasharray="7 5" />
          <text x={z.x + 10} y={z.y + 18} fontFamily="Arial, Helvetica, sans-serif" fontSize={13 * k} fontWeight="700" fill={z.couleur || '#555555'}>{z.label}</text>
        </g>))}
      {items.map(({ c, t, x, y, lines }) => (
        <g key={c.id} transform={`translate(${x},${y})`}>
          <g transform={`translate(${(t.w - t.sw) / 2},3)`}><ContainerGlyph db={dbv} R={R} c={c} width={t.sw} /></g>
          <text x={t.w / 2} y={t.sh + 4 + fsN * 1.25} textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize={fsN} fontWeight="700" fill="#1A1A1A">{c.nom}</text>
          {lines.map((l, i) => <text key={i} x={t.w / 2} y={t.sh + 4 + fsN * 1.25 + (i + 1) * lineH} textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize={fsI} fill="#444444">{l}</text>)}
        </g>))}
    </svg>
  );
}

function PlanPage({ site, conts, opt }) {
  const { db, R, camp } = useApp(); const e = db.entreprise || {}; const portrait = opt.page === 'portrait';
  const vol = sum(conts, (c) => R.contVol[c.id] || 0), cap = sum(conts, (c) => c.volMax); const occ = conts.filter((c) => (R.contVol[c.id] || 0) > 0.5).length;
  const comps = conts.map((c) => (lotsOfCont(R, c.id).length ? contentComp(db, R, c.id) : null)).filter(Boolean);
  const ceps = uniq(comps.flatMap((cp) => Object.keys(cp.cepages).filter((k) => cp.cepages[k] >= 0.03)));
  const rules = []; comps.forEach((cp) => { const ci = compColorInfo(db, cp); if (ci.rule && !rules.some((r) => r.nom === ci.rule)) rules.push({ nom: ci.rule, couleur: ci.color }); });
  const mixed = comps.some((cp) => { const ci = compColorInfo(db, cp); return !ci.rule && ci.ids.length > 1; });
  const modeC = opt.contour; const W = opt.page === 'A3' ? 1500 : portrait ? 760 : 1100; const Hp = Math.round(portrait ? W * 1.414 : W / 1.414);
  const ac = opt.accent || '#2D4A3E';
  const lotsIci = uniq(conts.flatMap((c) => lotsOfCont(R, c.id).map((p) => p.lotId))).map((id) => R.lots[id]).filter(Boolean); const mi = opt.interieur || 'cepage'; const mm = opt.motif || '';
  const idsIci = lotsIci.map((l) => l.id); const dbv = { ...db, apparence: { ...db.apparence, interieurMode: mi, contourMode: modeC, interieurMotif: mm } };
  const contourItems = modeC === 'echelle' ? [...ECHELLES].reverse().map((x) => [x.id, x.un, eColor(db, x.id)]) : modeC === 'qualif' ? QUALIFS.map((q) => [q.id, q.code, qColor(db, q.id)])
    : valeursPresentes(dbv, R, idsIci, modeC, true).map((v) => [v, valLabel(db, modeC, v), valColor(db, modeC, v)]);
  const blocks = [
    opt.leg.cep && !['couleur', 'stade', 'cepage'].includes(mi) ? <div key="gen" className="pp-lg"><b style={{ color: ac }}>Intérieur : {critLabel(mi).toLowerCase()}</b>{valeursPresentes(dbv, R, idsIci, mi).map((v) => <div key={v} className="pp-li"><PlanSw color={valColor(db, mi, v)} />{valLabel(db, mi, v)}</div>)}<div className="pp-note">Hauteur de couleur = niveau de remplissage.</div></div> : null,
    opt.leg.cep && mm ? <div key="motif" className="pp-lg"><b style={{ color: ac }}>Motif : {critLabel(mm).toLowerCase()}</b>{valeursPresentes(dbv, R, idsIci, mm).map((v) => <div key={v} className="pp-li"><MotifSwatch color="#CFC6B4" motif={motifDe(db, mm, v)} />{valLabel(db, mm, v)}</div>)}</div> : null,
    opt.leg.cep && mi === 'couleur' ? <div key="coul" className="pp-lg"><b style={{ color: ac }}>Intérieur : couleur du vin</b>{couleurList(db).filter((x) => lotsIci.some((l) => l.couleur === x.id)).map((x) => <div key={x.id} className="pp-li"><PlanSw color={x.couleur} />{x.label}</div>)}<div className="pp-note">Hauteur de couleur = niveau de remplissage.</div></div> : null,
    opt.leg.cep && mi === 'stade' ? <div key="stade" className="pp-lg"><b style={{ color: ac }}>Intérieur : stade du vin</b>{stadeList(db).filter((x) => lotsIci.some((l) => l.stade === x.id)).map((x) => <div key={x.id} className="pp-li"><PlanSw color={x.couleur} />{x.label}</div>)}<div className="pp-note">Hauteur de couleur = niveau de remplissage.</div></div> : null,
    opt.leg.cep && mi === 'cepage' && (ceps.length || rules.length) ? <div key="cep" className="pp-lg"><b style={{ color: ac }}>Intérieur</b>{ceps.map((k) => <div key={k} className="pp-li"><PlanSw color={cepageColor(db, k)} />{String(lbl(db, 'cepages', k)).replace(/ \(.*$/, '')}{opt.info.cep ? ` (${cepCourt(db, k)})` : ''}</div>)}{rules.map((r) => <div key={r.nom} className="pp-li"><PlanSw color={r.couleur} />{r.nom}</div>)}{mixed ? <div className="pp-note">Assemblage : couleurs mélangées au prorata.</div> : null}<div className="pp-note">Hauteur de couleur = niveau de remplissage.</div></div> : null,
    opt.leg.contour && modeC !== 'aucun' ? <div key="ct" className="pp-lg"><b style={{ color: ac }}>Contour : {critLabel(modeC).toLowerCase()}</b>{contourItems.map(([k, l, col]) => <div key={k} className="pp-li"><PlanSw ring color={col} />{l}</div>)}<div className="pp-note">Contour en pointillés : contenu mixte.</div></div> : null,
    opt.leg.zones && (site.zones || []).length ? <div key="zn" className="pp-lg"><b style={{ color: ac }}>Zones</b>{site.zones.map((z) => <div key={z.id} className="pp-li"><PlanSw ring dash color={z.couleur || '#888888'} />{z.label}</div>)}</div> : null,
    opt.leg.stats ? <div key="st" className="pp-lg"><b style={{ color: ac }}>Site</b><div className="pp-li">{conts.length} contenant{conts.length > 1 ? 's' : ''} ({occ} occupé{occ > 1 ? 's' : ''})</div><div className="pp-li">{fmtL(vol)} en cuve</div><div className="pp-li">{fmtL(cap)} de capacité{cap ? ` · ${pct(vol / cap)}` : ''}</div></div> : null,
  ].filter(Boolean);
  return (
    <div className={cx('planpage', portrait ? 'portrait' : 'paysage')} style={{ width: W, height: Hp }}>
      <div className="pp-head" style={{ borderColor: ac }}>
        {e.logo ? <img src={e.logo} alt="" style={{ maxHeight: 46, maxWidth: 160, objectFit: 'contain' }} /> : null}
        <div className="min-w-0 flex-1"><div className="pp-title" style={{ color: ac }}>{opt.titre || 'Plan de cave'} — {site.nom}</div><div className="pp-sub">{[e.nom, site.adresse].filter(Boolean).join(' · ')}</div></div>
        <div className="pp-date"><div>État au {fmtDate(todayISO())}</div><div>Campagne {camp.nom}</div></div>
      </div>
      <div className={cx('pp-body', portrait && 'col')}>
        <div className="pp-plan"><PlanSvg site={site} conts={conts} info={opt.info} contour={modeC} interieur={mi} motif={mm} txt={opt.texte} height={portrait ? Math.round(Hp * (blocks.length ? 0.62 : 0.8)) : Hp - 128} /></div>
        {blocks.length ? <div className="pp-leg">{blocks}</div> : null}
      </div>
      <div className="pp-foot">Plan édité avec Œnotrack · {fmtDate(todayISO())}</div>
    </div>
  );
}
function PlanTablePage({ site, conts, opt }) {
  const { db, R } = useApp(); const ac = opt.accent || '#2D4A3E';
  return (
    <div className="planpage portrait pp-tblpage" data-fit="width" style={{ width: 760 }}>
      <div className="pp-head" style={{ borderColor: ac }}><div className="min-w-0 flex-1"><div className="pp-title" style={{ color: ac }}>Contenants — {site.nom}</div><div className="pp-sub">État au {fmtDate(todayISO())}</div></div></div>
      <table className="pp-tbl"><thead><tr><th>Contenant</th><th>Type</th><th>Capacité</th><th>Volume</th><th>Lots</th><th>Stade</th><th>Revendication</th><th>Classement</th></tr></thead>
        <tbody>{conts.map((c) => { const ps = lotsOfCont(R, c.id); const comp = ps.length ? contentComp(db, R, c.id) : null; const ei = comp ? echelleInfo(comp).id : null; return <tr key={c.id}><td><b>{c.nom}</b></td><td>{lbl(db, 'typesContenant', c.type)}</td><td className="r">{fmtL(c.volMax)}</td><td className="r">{fmtL(R.contVol[c.id] || 0)}</td><td>{ps.map((p) => (R.lots[p.lotId] || {}).code).join(' + ') || 'vide'}</td><td>{uniq(ps.map((p) => `${stadeCourt(db, (R.lots[p.lotId] || {}).stade)} ${couleurLabel(db, (R.lots[p.lotId] || {}).couleur).toLowerCase()}`)).join(' + ')}</td><td>{uniq(ps.map((p) => qLabel((R.lots[p.lotId] || {}).qualif))).join(' + ')}</td><td>{ei ? eLabel(ei) : ''}</td></tr>; })}</tbody></table>
      <div className="pp-foot">Édité avec Œnotrack · {fmtDate(todayISO())}</div>
    </div>
  );
}

function PlanPrintDialog({ siteIds, onClose }) {
  const { db, R, toast } = useApp(); const ref = useRef(null); const wrap = useRef(null); const ww = useWidth(wrap); const [busy, setBusy] = useState(false);
  const [opt, setOpt] = useState(() => {
    let saved = null; try { saved = JSON.parse(window.localStorage.getItem(PLAN_KEY) || 'null'); } catch (e) { saved = null; }
    const base = { titre: 'Plan de cave', page: 'paysage', contour: db.apparence.contourMode || 'qualif', interieur: db.apparence.interieurMode || 'cepage', motif: db.apparence.interieurMotif || '', vides: true, texte: 'm', accent: '#2D4A3E', info: { vol: true, pct: false, lots: true, cep: false, rev: false, ech: false, mil: false }, leg: { cep: true, contour: true, zones: true, stats: true, table: false } };
    const s = saved && typeof saved === 'object' ? saved : {};
    return { ...base, ...s, info: { ...base.info, ...(s.info || {}) }, leg: { ...base.leg, ...(s.leg || {}) }, sites: siteIds && siteIds.length ? siteIds : db.sites.map((x) => x.id) };
  });
  useEffect(() => { try { const { sites, ...rest } = opt; window.localStorage.setItem(PLAN_KEY, JSON.stringify(rest)); } catch (e) { /* ignoré */ } }, [opt]);
  const set = (k, v) => setOpt((o) => ({ ...o, [k]: v })); const setIn = (g, k, v) => setOpt((o) => ({ ...o, [g]: { ...o[g], [k]: v } }));
  const sites = db.sites.filter((s) => opt.sites.includes(s.id));
  const contsOf = (s) => db.contenants.filter((c) => c.siteId === s.id && c.statut !== 'archive' && (opt.vides || (R.contVol[c.id] || 0) > 0.5)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true }));
  const pageW = opt.page === 'A3' ? 1500 : opt.page === 'portrait' ? 760 : 1100; const zoom = ww ? clamp((ww - 8) / pageW, 0.3, 1) : 0.7;
  const pdf = async () => {
    if (!ref.current) return; setBusy(true);
    const units = Array.from(ref.current.querySelectorAll('.planpage')).map((el) => (el.dataset.fit === 'width'
      ? { el, orientation: 'portrait', fit: 'width', format: 'A4' }
      : { el, orientation: el.classList.contains('portrait') ? 'portrait' : 'paysage', fit: 'page', format: opt.page === 'A3' ? 'A3' : 'A4', svgScale: 2.6 }));
    await printPdf({ units, root: ref.current, filename: `plan-de-cave-${todayISO()}.pdf`, title: opt.titre || 'Plan de cave', author: (db.entreprise || {}).nom, toast });
    setBusy(false);
  };
  const imprimer = async () => { // boîte d'impression de l'appareil (0.28.0-alpha.1) ; à défaut le PDF
    if (!ref.current) return;
    const r = await imprimerZone(Array.from(ref.current.querySelectorAll('.planpage')), { titre: opt.titre || 'Plan de cave', format: opt.page === 'A3' ? 'A3' : '' });
    if (r === 'bloque') await pdf();
  };
  return (
    <Sheet wide title="Imprimer le plan de cave" sub="Choisissez les sites, ce qui s’affiche sous chaque contenant et les légendes : l’aperçu se met à jour." onClose={onClose}
      footer={<><span className="mr-auto text-xs text-ink2">{`${sites.length} page${sites.length > 1 ? 's' : ''} de plan · « ⬇ PDF » en parallèle de l’impression.`}</span><Btn onClick={onClose}>Fermer</Btn><Btn disabled={busy || !sites.length} onClick={pdf} data-sortie-pdf="">{busy ? 'Préparation…' : '⬇ PDF'}</Btn><Btn kind="primary" disabled={busy || !sites.length} onClick={imprimer} data-sortie-imprimer="">🖨 Imprimer</Btn></>}>
      <div className="mb-4 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
        <div className="space-y-2">
          <Field label="Titre"><TI value={opt.titre} onChange={(v) => set('titre', v)} /></Field>
          <Group label="Sites (une page chacun)"><div className="space-y-1">{db.sites.map((s) => <div key={s.id}><Check checked={opt.sites.includes(s.id)} onChange={(v) => set('sites', v ? [...opt.sites, s.id] : opt.sites.filter((x) => x !== s.id))} label={s.nom} /></div>)}</div></Group>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Format"><SI plain value={opt.page} onChange={(v) => set('page', v)} options={[{ value: 'paysage', label: 'A4 paysage' }, { value: 'portrait', label: 'A4 portrait' }, { value: 'A3', label: 'A3 paysage' }]} /></Field>
            <Field label="Texte"><SI plain value={opt.texte} onChange={(v) => set('texte', v)} options={[{ value: 's', label: 'Petit' }, { value: 'm', label: 'Normal' }, { value: 'l', label: 'Grand' }]} /></Field>
          </div>
          <Check checked={opt.vides} onChange={(v) => set('vides', v)} label="Afficher les contenants vides" />
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Couleur de l’intérieur"><SI plain value={opt.interieur} onChange={(v) => set('interieur', v)} options={VUE_CRITERES.map((c) => ({ value: c.id, label: critLabel(c.id) }))} /></Field>
            <Field label="Contour"><SI plain value={opt.contour} onChange={(v) => set('contour', v)} options={[...VUE_CRITERES.map((c) => ({ value: c.id, label: critLabel(c.id) })), { value: 'aucun', label: 'Aucun (neutre)' }]} /></Field>
          </div>
          <Field label="Motif de l’intérieur"><SI plain value={opt.motif || ''} onChange={(v) => set('motif', v)} options={[{ value: '', label: 'Aucun' }, ...VUE_CRITERES.map((c) => ({ value: c.id, label: critLabel(c.id) }))]} /></Field>
          <Group label="Sous chaque contenant (le nom est toujours écrit)"><div className="space-y-1">{PLAN_INFOS.map(([k, l]) => <div key={k}><Check checked={!!opt.info[k]} onChange={(v) => setIn('info', k, v)} label={l} /></div>)}</div></Group>
        </div>
        <div className="space-y-2">
          <Group label="Légendes"><div className="space-y-1">{PLAN_LEG.map(([k, l]) => <div key={k}><Check checked={!!opt.leg[k]} onChange={(v) => setIn('leg', k, v)} label={l} /></div>)}</div></Group>
          <Group label="Couleur des titres"><div className="flex flex-wrap items-center gap-1.5">{['#2D4A3E', '#7C2D36', '#1F3A5F', '#3B3B3B', '#8A6A1F'].map((c) => <button key={c} type="button" className="pp-col" aria-label={`Couleur ${c}`} aria-pressed={opt.accent === c} style={{ background: c }} onClick={() => set('accent', c)} />)}<input type="color" className="h-7 w-9 cursor-pointer rounded border border-line" value={opt.accent} onChange={(e) => set('accent', e.target.value)} aria-label="Couleur personnalisée" /></div></Group>
        </div>
      </div>
      <div ref={wrap} className="fiche-scroll rounded-md border border-line p-2" style={{ background: 'var(--surface2)' }}>
        <div ref={ref} className="planprint" style={{ zoom }}>
          {sites.map((s) => <Fragment key={s.id}><PlanPage site={s} conts={contsOf(s)} opt={opt} />{opt.leg.table ? <PlanTablePage site={s} conts={contsOf(s)} opt={opt} /> : null}</Fragment>)}
          {!sites.length ? <Empty>Cochez au moins un site.</Empty> : null}
        </div>
      </div>
    </Sheet>
  );
}
