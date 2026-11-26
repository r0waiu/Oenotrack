/* ============ ONGLET 1 : CUVERIE & LOTS (sites · plan de cave modifiable · clic droit · lots) ============ */
function ContForm({ id, onClose, siteId }) {
  const { db, act, setTab, uid, secu } = useApp();
  const peutBareme = !secu || estAdmin(db, uid) || niveauModule(db, uid, 'params') === 'ecriture'; // identifiants activés : les barèmes relèvent des Paramètres
  const c = id ? db.contenants.find((x) => x.id === id) : null;
  const [f, set, setF] = useDraft({ nom: c ? c.nom : '', type: c ? c.type : (db.lists.typesContenant[0] || {}).id, matiere: c ? c.matiere : (db.lists.matieres[0] || {}).id, annee: c && c.annee ? String(c.annee) : '', volMax: c ? String(c.volMax) : '', statut: c ? c.statut : 'actif', notes: c ? c.notes : '', fabricant: c ? c.fabricant || '' : '', siteId: c ? c.siteId : (siteId && siteId !== 'all' ? siteId : (db.sites[0] || {}).id) });
  const dup = f.nom.trim() && nameTaken(db.contenants, f.nom, id);
  const forme = ((db.lists.typesContenant.find((x) => x.id === f.type)) || {}).forme || 'cuve';
  const mat = db.lists.matieres.find((x) => x.id === f.matiere) || { couleur: '#B9C4CC', finition: 'lisse' };
  // barème de jaugeage importé dans la fiche (0.22.0-alpha.1) : nom, capacité, fabricant (et matière à la création) repris du cahier s'ils sont vides ;
  // une valeur reprise suit le tableau choisi (cahier de plusieurs réservoirs) tant qu'elle n'a pas été modifiée à la main
  const [bar, setBar] = useState(null); const [repris, setRepris] = useState([]); const fRef = useRef(f); fRef.current = f;
  const init = useRef(f); const auto = useRef({});
  const reprise = (b) => {
    const x = fRef.current; const m = b.meta || {}; const n = { ...x }; const L = [];
    const libre = (k) => { const v = String(x[k] == null ? '' : x[k]).trim(); return !v || (k === 'volMax' && !(num(x[k]) > 0)) || x[k] === auto.current[k] || (k === 'matiere' && x[k] === init.current[k]); };
    const prendre = (k, v, nom) => { if (!v || !libre(k)) return; n[k] = v; auto.current[k] = v; L.push(nom); };
    prendre('nom', String((b.reservoir != null ? b.reservoir : b.nom) || '').trim().slice(0, 60), 'nom'); // fichier de barèmes Œnotrack : son nom
    const cap = baremeCapacite(b); prendre('volMax', cap > 0 ? String(cap) : '', 'capacité');
    prendre('fabricant', m.constructeur && m.constructeur !== '-' ? String(m.constructeur).trim() : '', 'fabricant');
    if (!id) { const mt = matierePourBareme(db, m.materiau); prendre('matiere', mt ? mt.id : '', 'matière'); }
    setF(n); setRepris(L);
  };
  const avecB = !!(bar && bar.phase === 'pret'); const capB = avecB ? baremeCapacite(bar.baremes[bar.i]) : 0;
  const enCours = useRef(false); // double clic sur « Enregistrer » pendant le rangement du document : un seul enregistrement
  const save = async () => {
    if (enCours.current) return; enCours.current = true;
    try {
      let doc = null; // document d'origine rangé dans ce navigateur avec le barème
      if (avecB && bar.garderDoc && bar.fichier && bar.fichier.size <= DOC_MAX) { const did = newDocId(); try { await docPut(did, bar.fichier); doc = { id: did, nom: bar.fichier.name, mime: bar.fichier.type, taille: bar.fichier.size }; } catch (e) { doc = null; } }
      const r = act((d) => { const rc = contSave(d, f, id); if (!rc.ok) return rc; if (avecB) { const rb = contBaremeEnregistrer(d, bar, rc.id, doc); if (!rb.ok) return rb; } return okr(); }, `${id ? 'Contenant modifié' : 'Contenant créé'}${avecB ? ', barème de jaugeage enregistré' : ''}.`);
      if (r.ok) onClose(); else if (doc) docDel(doc.id).catch(() => null);
    } finally { enCours.current = false; }
  };
  return (
    <FormSheet title={id ? `Modifier ${c.nom}` : 'Nouveau contenant'} sub="Cuve, fût, foudre, jarre, amphore, œuf, bombonne…" onClose={onClose} onSave={save}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-md border border-line bg-surface2 p-2"><ContainerSVG forme={forme} matColor={mat.couleur} finition={mat.finition} bands={[{ frac: 0.55, color: cepageColor(db, 'chard') }]} width={78} /></div>
        <div className="min-w-0 flex-1 space-y-3">
          <Field label="Nom (unique)" help={dup ? '⚠ Ce nom est déjà utilisé : il doit être unique.' : ''}><TI value={f.nom} onChange={(v) => set('nom', v)} placeholder="ex. Cuve 12" autoFocus /></Field>
          <G><Field label="Type (forme du dessin)"><SI value={f.type} onChange={(v) => set('type', v)} options={opts(db, 'typesContenant')} /></Field><Field label="Matière (couleur, finition)"><SI value={f.matiere} onChange={(v) => set('matiere', v)} options={opts(db, 'matieres')} /></Field></G>
        </div>
      </div>
      <div className="help">Le dessin suit le type et la matière. Ajoutez vos propres types et matières, ou changez leurs couleurs, dans <button type="button" className="linkish" onClick={() => { onClose(); setTab('params', 'contenants'); }}>Paramètres › Contenants</button>.</div>
      <G><Field label="Site de cuverie"><SI value={f.siteId} onChange={(v) => set('siteId', v)} options={db.sites.map((s) => ({ value: s.id, label: s.nom }))} /></Field><Field label="Capacité (hL)"><VI value={f.volMax} onChange={(v) => set('volMax', v)} placeholder="ex. 40" /></Field></G>
      <G><Field label="Fabricant"><input className="inp" list="fabricants-list" value={f.fabricant} onChange={(e) => set('fabricant', e.target.value)} placeholder="ex. nom du constructeur" aria-label="Fabricant" /><datalist id="fabricants-list">{fabricantsConnus(db).map((x) => <option key={x} value={x} />)}</datalist></Field><Field label="Année de fabrication"><NI value={f.annee} onChange={(v) => set('annee', v)} placeholder="ex. 2019" /></Field></G>
      <G><Field label="Statut"><SI value={f.statut} onChange={(v) => set('statut', v)} options={[{ value: 'actif', label: 'Actif' }, { value: 'archive', label: 'Archivé' }]} /></Field><div /></G>
      {id && c.siteId !== f.siteId ? <Notice tone="info">Le contenant sera placé automatiquement sur le plan du nouveau site (vous pourrez le déplacer ensuite).</Notice> : null}
      <Group label="📏 Barème de jaugeage (facultatif)">
        <ContBareme contId={id} nomCont={f.nom} val={bar} onVal={(v) => { setBar(v); if (!v || v.phase !== 'pret') setRepris([]); }} onReprise={reprise} lecture={!peutBareme} />
        {avecB && repris.length ? <p className="help mt-1" data-cont-repris="">Repris du cahier : {repris.map((x, i) => <span key={x}>{i ? ', ' : ''}<span>{x}</span></span>)} — vérifiez-les ci-dessus.</p> : null}
        {avecB && capB > 0 && num(f.volMax) > 0 && Math.abs(capB - num(f.volMax)) / capB > 0.03 ? <div className="mt-2"><Notice tone="info">Capacité d’après le barème : <b className="num">{fmtHL(capB)} hL</b> (fiche : {fmtHL(num(f.volMax))} hL). <Btn size="sm" onClick={() => set('volMax', String(capB))}>Utiliser la capacité du barème</Btn></Notice></div> : null}
      </Group>
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} /></Field>
    </FormSheet>
  );
}

/* ---------- plan de cave : positions réelles, déverrouillage → glisser-déposer → verrouillage ---------- */
function useWidth(ref) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const upd = () => setW(el.clientWidth); upd();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', upd); return () => window.removeEventListener('resize', upd); }
    const ro = new ResizeObserver(upd); ro.observe(el); return () => ro.disconnect();
  }, []);
  return w;
}
const lotsOfCont = (R, id) => contParts(R, id).sort((a, b) => (a.since < b.since ? -1 : 1));
const lotsShort = (R, id) => { const ps = lotsOfCont(R, id); return ps.length ? `${(R.lots[ps[0].lotId] || {}).code}${ps.length > 1 ? ` +${ps.length - 1}` : ''}` : ''; };

function PlanView({ site, conts, edit, onOpen, onMenu, onZone, sel }) {
  const { db, R, act } = useApp();
  const wrapRef = useRef(null); const wrapW = useWidth(wrapRef);
  const [zoom, setZoom] = useState(null); const [ghost, setGhost] = useState(null);
  const dragRef = useRef(null); const gRef = useRef(null); const lp = useRef(null); const suppress = useRef(0);
  const zones = site.zones || [];
  const items = conts.map((c) => ({ c, t: tileSize(db, c) }));
  const posOf = (c) => (ghost && ghost.kind === 'c' && ghost.id === c.id ? ghost : { x: c.x || 0, y: c.y || 0 });
  let maxR = 0, maxB = 0;
  items.forEach((it) => { const p = posOf(it.c); maxR = Math.max(maxR, p.x + it.t.w); maxB = Math.max(maxB, p.y + it.t.h); });
  zones.forEach((zn) => { const g = ghost && ghost.kind === 'z' && ghost.id === zn.id ? ghost : zn; maxR = Math.max(maxR, g.x + g.w); maxB = Math.max(maxB, g.y + g.h); });
  const planW = Math.max(edit ? PLAN_W : 420, maxR + (edit ? 200 : 28)); const planH = Math.max(edit ? 460 : 160, maxB + (edit ? 200 : 20));
  const fit = wrapW ? clamp((wrapW - 2) / planW, 0.42, 1) : 1; const z = zoom == null ? fit : zoom;
  const cancelLP = () => { if (lp.current) { clearTimeout(lp.current.t); lp.current = null; } };
  const openMenuAt = (id, x, y) => { if (Date.now() < suppress.current) return; suppress.current = Date.now() + 800; cancelLP(); onMenu(id, x, y); };

  const down = (e, kind, id, o) => {
    if (e.button != null && e.button !== 0) return;
    if (!edit) { if (kind === 'c' && e.pointerType === 'touch') { cancelLP(); const x = e.clientX, y = e.clientY; lp.current = { x, y, t: setTimeout(() => { lp.current = null; openMenuAt(id, x, y); }, 520) }; } return; }
    e.stopPropagation(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) { /* ignoré */ }
    dragRef.current = { kind, id, sx: e.clientX, sy: e.clientY, ...o, moved: false };
  };
  const move = (e) => {
    if (lp.current && Math.hypot(e.clientX - lp.current.x, e.clientY - lp.current.y) > 10) cancelLP();
    const d = dragRef.current; if (!d) return;
    const dx = (e.clientX - d.sx) / z, dy = (e.clientY - d.sy) / z;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 4) return; d.moved = true;
    const g = d.kind === 'zr' ? { kind: 'z', id: d.id, x: d.x0, y: d.y0, w: Math.max(60, d.w0 + dx), h: Math.max(40, d.h0 + dy) } : { kind: d.kind, id: d.id, x: Math.max(0, d.x0 + dx), y: Math.max(0, d.y0 + dy), w: d.w0, h: d.h0 };
    gRef.current = g; setGhost(g);
  };
  const up = () => {
    cancelLP(); const d = dragRef.current; dragRef.current = null; const g = gRef.current; gRef.current = null; setGhost(null);
    if (!d) return;
    if (!d.moved) { if (d.kind === 'c') onOpen(d.id); else if (d.kind === 'z') onZone(d.id); return; }
    if (d.kind === 'c') act((x) => contMove(x, d.id, g.x, g.y));
    else { const zn = zones.find((q) => q.id === d.id); if (zn) act((x) => zoneSave(x, site.id, { ...zn, x: g.x, y: g.y, w: g.w, h: g.h })); }
  };
  const key = (e, c) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(c.id); }
    else if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); const r = e.currentTarget.getBoundingClientRect(); openMenuAt(c.id, r.left + r.width / 2, r.top + r.height / 2); }
    else if (edit && e.key.startsWith('Arrow')) { e.preventDefault(); const dx = e.key === 'ArrowLeft' ? -GRID : e.key === 'ArrowRight' ? GRID : 0; const dy = e.key === 'ArrowUp' ? -GRID : e.key === 'ArrowDown' ? GRID : 0; act((x) => contMove(x, c.id, (c.x || 0) + dx, (c.y || 0) + dy)); }
  };

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-1 no-print">
        <span className="text-xs text-ink2">Zoom</span>
        <Btn size="sm" onClick={() => setZoom(clamp(+(z - 0.1).toFixed(2), 0.3, 1.6))} aria-label="Zoom arrière">−</Btn><span className="num w-12 text-center text-xs">{Math.round(z * 100)} %</span><Btn size="sm" onClick={() => setZoom(clamp(+(z + 0.1).toFixed(2), 0.3, 1.6))} aria-label="Zoom avant">+</Btn><Btn size="sm" onClick={() => setZoom(null)}>Ajuster</Btn>
      </div>
      <div className="planwrap" ref={wrapRef} aria-label={`Plan de cave — ${site.nom}`}>
        <div style={{ width: planW * z, height: planH * z, position: 'relative' }}>
          <div className={cx('plan', edit ? 'unlocked' : 'locked')} style={{ width: planW, height: planH, transform: `scale(${z})`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0 }}>
            {zones.map((zn) => {
              const g = ghost && ghost.kind === 'z' && ghost.id === zn.id ? ghost : zn;
              return (
                <div key={zn.id} className="pzone" style={{ left: g.x, top: g.y, width: g.w, height: g.h, color: zn.couleur, borderColor: zn.couleur, background: `color-mix(in srgb, ${zn.couleur} 7%, transparent)`, zIndex: 0 }}
                  onPointerDown={(e) => down(e, 'z', zn.id, { x0: zn.x, y0: zn.y, w0: zn.w, h0: zn.h })} onPointerMove={move} onPointerUp={up} onPointerCancel={up} title={edit ? 'Glisser pour déplacer · toucher pour modifier' : undefined}>
                  {zn.label}
                  {edit ? <span className="rz" onPointerDown={(e) => down(e, 'zr', zn.id, { x0: zn.x, y0: zn.y, w0: zn.w, h0: zn.h })} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Redimensionner la zone" /> : null}
                </div>
              );
            })}
            {items.map(({ c, t }) => {
              const p = posOf(c); const vol = R.contVol[c.id] || 0;
              return (
                <div key={c.id} role="button" tabIndex={0} aria-pressed={sel ? sel.includes(c.id) : undefined} className={cx('pitem', ghost && ghost.kind === 'c' && ghost.id === c.id && 'drag', c.statut === 'archive' && 'opacity-60', sel && sel.includes(c.id) && 'is-sel')} style={{ left: p.x, top: p.y, width: t.w, height: t.h, zIndex: ghost && ghost.id === c.id ? 30 : 1 }}
                  aria-label={`${c.nom}, ${fmtHL(vol)} hectolitres sur ${fmtHL(c.volMax)}. Clic droit ou appui long pour les opérations.`}
                  onPointerDown={(e) => down(e, 'c', c.id, { x0: c.x || 0, y0: c.y || 0, w0: t.w, h0: t.h })} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
                  onClick={edit ? undefined : () => { if (Date.now() < suppress.current) return; onOpen(c.id); }}
                  onContextMenu={(e) => { e.preventDefault(); openMenuAt(c.id, e.clientX, e.clientY); }} onKeyDown={(e) => key(e, c)}>
                  <ContainerGlyph db={db} R={R} c={c} width={t.sw} />
                  <div className="pname" title={c.nom}>{c.nom}</div>
                  <div className="psub num">{fmtHL(vol)} / {fmtL(c.volMax)}</div>
                  <div className="psub">{vol > 0 ? lotsShort(R, c.id) : 'vide'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// légende du plan : contour, couleur de l'intérieur et motif ; seulement les valeurs présentes en cuve (sauf revendication / classement)
const lotsEnCuve_ = (R) => uniq(Object.values(R.portions).filter((p) => p.vol > 0.5).map((p) => p.lotId));
function PlanLegend() {
  const { db, R, setTab } = useApp(); const ap = db.apparence; const mc = ap.contourMode || 'qualif'; const mi = ap.interieurMode || 'cepage'; const mm = ap.interieurMotif || '';
  const lots = lotsEnCuve_(R);
  const contour = mc === 'aucun' ? [] : mc === 'qualif' ? QUALIFS.map((q) => q.id) : mc === 'echelle' ? [...ECHELLES].reverse().map((e) => e.id) : valeursPresentes(db, R, lots, mc, true);
  const cLabel = (v) => (mc === 'qualif' ? qDef(v).code : mc === 'echelle' ? (eDef(v) || {}).un || valLabel(db, mc, v) : valLabel(db, mc, v));
  return (
    <div className="legend mb-3" data-legende="plan">
      <span className="font-semibold text-ink">Contour{mc !== 'aucun' ? ` · ${critLabel(mc).toLowerCase()}` : ''}</span>
      {mc === 'aucun' ? <span>aucun</span> : contour.map((v) => <span key={v}><MotifSwatch ring color={valColor(db, mc, v)} />{cLabel(v)}</span>)}
      <span className="font-semibold text-ink">Intérieur · {critLabel(mi).toLowerCase()}</span>
      {mi === 'cepage' ? <>{db.lists.cepages.map((c) => <span key={c.id}><MotifSwatch color={cepageColor(db, c.id)} />{String(c.label).replace(/ \(.*$/, '')}</span>)}<span>· assemblages : couleur choisie ou mélange</span></>
        : valeursPresentes(db, R, lots, mi).map((v) => <span key={v}><MotifSwatch color={valColor(db, mi, v)} />{valLabel(db, mi, v)}</span>)}
      {mm ? <><span className="font-semibold text-ink">Motif · {critLabel(mm).toLowerCase()}</span>{valeursPresentes(db, R, lots, mm).map((v) => <span key={v} data-motif={motifDe(db, mm, v)}><MotifSwatch color="#CFC6B4" motif={motifDe(db, mm, v)} />{valLabel(db, mm, v)}</span>)}</> : null}
      <button type="button" className="linkish" onClick={() => setTab('params', 'contenants')}>Personnaliser couleurs et motifs</button>
    </div>
  );
}
// choix de la vue : contour, intérieur (couleur) et motif
function VueChoix({ compact }) {
  const { db, act } = useApp(); const ap = db.apparence; const opts = VUE_CRITERES.map((c) => <option key={c.id} value={c.id}>{critLabel(c.id)}</option>);
  const set = (patch) => act((d) => apparenceSet(d, patch));
  const L = ({ t, children }) => <label className="flex items-center gap-2 text-sm"><span className="lbl mb-0">{t}</span>{children}</label>;
  return (<>
    <L t="Contour"><select className="inp" style={{ width: 'auto' }} value={ap.contourMode || 'qualif'} onChange={(e) => set({ contourMode: e.target.value })} aria-label="Ce que montre le contour des contenants">{opts}<option value="aucun">Aucun</option></select></L>
    <L t="Intérieur"><select className="inp" style={{ width: 'auto' }} value={ap.interieurMode || 'cepage'} onChange={(e) => set({ interieurMode: e.target.value })} aria-label="Couleur de l’intérieur des contenants">{opts}</select></L>
    <L t="Motif intérieur"><select className="inp" style={{ width: 'auto' }} value={ap.interieurMotif || ''} onChange={(e) => set({ interieurMotif: e.target.value })} aria-label="Motif de l’intérieur des contenants"><option value="">Aucun</option>{opts}</select></L>
  </>);
}

/* ---------- cartes (grille automatique, pratique sur téléphone) ---------- */
function TankCards({ conts, onOpen, onMenu, sel }) {
  const { db, R } = useApp(); const suppress = useRef(0); const lp = useRef(null);
  const arm = (e, id) => { if (e.pointerType !== 'touch') return; const x = e.clientX, y = e.clientY; clearTimeout(lp.current); lp.current = setTimeout(() => { suppress.current = Date.now() + 800; onMenu(id, x, y); }, 520); };
  const stop = () => clearTimeout(lp.current);
  if (!conts.length) return <Empty>Aucun contenant. Ajoutez votre première cuve avec « + Nouveau contenant ».</Empty>;
  return (
    <div className="tankgrid">{conts.map((c) => {
      const ps = lotsOfCont(R, c.id); const vol = R.contVol[c.id] || 0; const ov = !!R.capOver[c.id]; const t = tileSize(db, c); const ei = ps.length ? echelleInfo(contentComp(db, R, c.id)) : null;
      return (
        <div key={c.id} role="button" tabIndex={0} aria-pressed={sel ? sel.includes(c.id) : undefined} className={cx('tankcard', c.statut === 'archive' && 'arch', sel && sel.includes(c.id) && 'is-sel')} onClick={() => { if (Date.now() < suppress.current) return; onOpen(c.id); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(c.id); } }}
          onContextMenu={(e) => { e.preventDefault(); if (Date.now() < suppress.current) return; suppress.current = Date.now() + 800; onMenu(c.id, e.clientX, e.clientY); }}
          onPointerDown={(e) => arm(e, c.id)} onPointerUp={stop} onPointerMove={stop} onPointerCancel={stop} aria-label={`${c.nom}, ${fmtHL(vol)} hectolitres sur ${fmtHL(c.volMax)}`}>
          <button type="button" className="dots" aria-label={`Opérations sur ${c.nom}`} title="Opérations (ou clic droit)" onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); onMenu(c.id, r.right - 8, r.bottom + 4); }} onPointerDown={(e) => e.stopPropagation()}>⋯</button>
          <div className="min-w-0 w-full pr-6"><div className="disp break-words text-lg leading-tight">{c.nom}</div><div className="text-xs text-ink2">{lbl(db, 'typesContenant', c.type)} · {lbl(db, 'matieres', c.matiere)}{c.annee ? ` · ${c.annee}` : ''}</div>{db.sites.length > 1 ? <div className="text-xs text-ink2">{siteName(db, c.siteId)}</div> : null}</div>
          <div className="flex items-center gap-3">
            <div className="flex w-[84px] shrink-0 justify-center"><ContainerGlyph db={db} R={R} c={c} width={Math.min(t.sw, 84)} /></div>
            <div className="min-w-0 flex-1"><div className="num whitespace-nowrap text-sm font-medium">{fmtL(vol)}</div><div className="num whitespace-nowrap text-xs text-ink2">/ {fmtL(c.volMax)}</div><div className="whitespace-nowrap text-xs text-ink2">{pct(vol / c.volMax)} rempli</div></div>
          </div>
          {(() => { const al = fermentationAlerte(db, R, { contId: c.id }, todayISO()); return al ? <div><Chip tone={al.etat === 'arretee' ? 'bad' : 'warn'}>{al.etat === 'arretee' ? '⚠ FA arrêtée ?' : '⚠ FA lente'}</Chip></div> : null; })()}
          <div className="flex flex-wrap gap-1">{ps.map((p) => { const l = R.lots[p.lotId] || {}; return <Fragment key={p.portionId}><span className={`chip chip-c q-${qDef(l.qualif).id}`} style={qStyle(l.qualif)} title={`${l.designation || ''} — ${qLabel(l.qualif)}`}>{l.code} · {fmtL(p.vol)}</span><StadeChip id={l.stade} compact />{l.couleur && l.couleur !== couleurDefaut(db) ? <CouleurChip id={l.couleur} /> : null}</Fragment>; })}{ei ? <EChip info={ei} compact /> : null}{c.statut === 'archive' ? <Chip>Archivé</Chip> : null}{ov ? <Chip tone="bad">⚠ à vérifier : capacité</Chip> : null}</div>
        </div>
      );
    })}</div>
  );
}

function TabCuverie() {
  const { db, R, act, confirm, showCont, showLot, openMenu, setTab } = useApp();
  const [sub, setSub] = useState('plan'); const [filter, setFilter] = useState('actif'); const [q, setQ] = useState(''); const [form, setForm] = useState(null);
  const [lotF, setLotF] = useState('stock'); const [lq, setLq] = useState(''); const [edit, setEdit] = useState(false); const [siteForm, setSiteForm] = useState(null); const [zoneForm, setZoneForm] = useState(null); const [printPlan, setPrintPlan] = useState(false);
  // saisie groupée (0.29.0-alpha.1) : sélection de plusieurs cuves, action commune ; étiquettes QR ; scanner
  const [selMode, setSelMode] = useState(false); const [sel, setSel] = useState([]); const [grp, setGrp] = useState(null); const [etiq, setEtiq] = useState(null); const [scan, setScan] = useState(false);
  const ouvrir = (id) => (selMode ? setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])) : showCont(id));
  const finSel = () => { setSelMode(false); setSel([]); };
  const siteActif = db.settings.siteActif; const multi = db.sites.length > 1;
  const setSite = (id) => { setEdit(false); act((d) => { d.settings.siteActif = id; return okr(); }); };
  const nat = (a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true });
  const inSite = (c) => siteActif === 'all' || c.siteId === siteActif;
  const conts = db.contenants.filter((c) => inSite(c) && (filter === 'tous' || (filter === 'actif' ? c.statut !== 'archive' : c.statut === 'archive')) && (!q || norm(c.nom).includes(norm(q)))).sort(nat);
  const scope = db.contenants.filter(inSite); const active = scope.filter((c) => c.statut !== 'archive');
  const capTot = sum(active, (c) => c.volMax); const volTot = sum(scope, (c) => R.contVol[c.id] || 0);
  const occupied = scope.filter((c) => (R.contVol[c.id] || 0) > 0).length; const over = scope.filter((c) => R.capOver[c.id]).length;
  const scopeIds = new Set(scope.map((c) => c.id)); const lotsIn = new Set(Object.values(R.portions).filter((p) => scopeIds.has(p.contenantId)).map((p) => p.lotId));
  const bottles = sum(Object.values(R.tir), (t) => t.nb);
  const enStock = (l) => (siteActif === 'all' ? ((R.lotVol[l.id] || 0) > 0 || (R.tir[l.id] && R.tir[l.id].nb > 0)) : lotsIn.has(l.id));
  // filtre : en stock / tous / par stade (s:), couleur (c:) ou nature (t:) — stade et couleur parmi les lots en stock
  const lotOk = (l) => { if (lotF === 'stock') return enStock(l); if (lotF === 'tous') return true; const [k, v] = lotF.split(':'); return k === 's' ? enStock(l) && l.stade === v : k === 'c' ? enStock(l) && l.couleur === v : k === 't' ? l.type === v : l.type === lotF; };
  const lots = Object.values(R.lots).filter((l) => lotOk(l) && (!lq || norm(`${l.code} ${l.designation}`).includes(norm(lq)))).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const stock = Object.values(R.lots).filter(enStock);
  const parStade = stadeList(db).map((x) => ({ x, n: stock.filter((l) => l.stade === x.id).length, v: sum(stock.filter((l) => l.stade === x.id), (l) => R.lotVol[l.id] || 0) })).filter((g) => g.n);
  const sitesShown = siteActif === 'all' ? db.sites : db.sites.filter((s) => s.id === siteActif);
  const siteStat = (s) => { const cs = db.contenants.filter((c) => c.siteId === s.id); return { n: cs.filter((c) => c.statut !== 'archive').length, vol: sum(cs, (c) => R.contVol[c.id] || 0) }; };
  const reorg = async () => { const ok = await confirm({ title: 'Réorganiser automatiquement ?', body: `Les contenants ${siteActif === 'all' ? 'de tous les sites' : 'de ce site'} seront replacés en rangées (cuves, citernes, fûts…). Vos positions actuelles seront perdues.`, ok: 'Réorganiser', danger: true }); if (ok) act((d) => { sitesShown.forEach((s) => planAuto(d, s.id, false)); return okr(); }, 'Plan réorganisé.'); };
  const zoneEdit = (sid, zid) => setZoneForm({ siteId: sid, zone: (db.sites.find((s) => s.id === sid).zones || []).find((z) => z.id === zid) });
  return (
    <div>
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label={`Vin en cuverie${siteActif === 'all' ? '' : ' (site)'}`} value={fmtL(volTot)} sub={`sur ${fmtL(capTot)} de capacité`} />
        <Kpi label="Contenants occupés" value={`${occupied} / ${active.length}`} sub="actifs" />
        <Kpi label="Lots en stock" value={lotsIn.size} sub={`${fmt(bottles)} bouteilles sur lattes`} />
        <Kpi label="Capacités dépassées" value={over} tone={over ? 'bad' : 'ok'} sub={over ? 'à vérifier' : 'aucune'} />
      </div>
      <div className="sitebar" role="group" aria-label="Sites de cuverie">
        <button type="button" className="sitebtn" aria-pressed={siteActif === 'all'} onClick={() => setSite('all')}><b>Tous les sites</b><span className="text-xs text-ink2">{db.contenants.filter((c) => c.statut !== 'archive').length} contenants · {fmtL(R.totalVol)}</span></button>
        {db.sites.map((s) => { const st = siteStat(s); return <button key={s.id} type="button" className="sitebtn" aria-pressed={siteActif === s.id} onClick={() => setSite(s.id)}><b>{s.nom}</b><span className="text-xs text-ink2">{st.n} contenants · {fmtL(st.vol)}</span></button>; })}
        <button type="button" className="sitebtn" onClick={() => setSiteForm('new')} title="Ajouter un site de cuverie"><b>+ Site</b><span className="text-xs text-ink2">stock commun</span></button>
        {siteActif !== 'all' ? <button type="button" className="sitebtn" onClick={() => setSiteForm(siteActif)} title="Renommer ou supprimer ce site"><b>✎ Modifier</b><span className="text-xs text-ink2">ce site</span></button> : null}
      </div>
      <SubNav value={sub} onChange={(v) => { setSub(v); if (v !== 'plan') setEdit(false); }} items={[{ id: 'plan', label: 'Plan de cave' }, { id: 'cartes', label: 'Cartes' }, { id: 'lots', label: 'Lots' }, { id: 'liste', label: 'Contenants (liste)' }]} />
      {sub !== 'lots' ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-1">{[['actif', 'Actifs'], ['archive', 'Archivés'], ['tous', 'Tous']].map(([k, l]) => <button key={k} type="button" className={cx('btn btn-sm', filter === k && 'btn-primary')} onClick={() => setFilter(k)}>{l}</button>)}</div>
          <div className="w-44"><TI value={q} onChange={setQ} placeholder="Rechercher une cuve…" aria-label="Rechercher un contenant" /></div>
          {sub === 'plan' || sub === 'cartes' ? <VueChoix /> : null}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {!edit ? <><Btn onClick={() => setScan(true)} title="Lire l’étiquette QR d’une cuve">📷 Scanner</Btn><Btn kind={selMode ? 'primary' : undefined} aria-pressed={selMode} onClick={() => (selMode ? finSel() : setSelMode(true))} title="Choisir plusieurs cuves pour une saisie groupée (sulfitage, levurage, relevés…) ou leurs étiquettes">{selMode ? '✓ Sélection en cours' : '☑ Sélection multiple'}</Btn></> : null}
            {sub === 'plan' ? (edit
              ? <><Btn onClick={() => setZoneForm({ siteId: (sitesShown[0] || db.sites[0]).id, zone: null })}>+ Zone</Btn><Btn onClick={reorg}>Réorganiser</Btn><Btn kind="primary" onClick={() => setEdit(false)}>🔒 Verrouiller le plan</Btn></>
              : <><Btn onClick={() => setPrintPlan(true)} title="Plan imprimable (PDF) avec les légendes de votre choix">🖨 Imprimer le plan</Btn><Btn onClick={() => setEdit(true)} title="Déplacer les contenants pour reproduire l’organisation réelle de la cuverie">🔓 Modifier le plan</Btn></>) : null}
            <Btn kind="primary" onClick={() => setForm('new')}>+ Nouveau contenant</Btn>
          </div>
        </div>
      ) : null}
      {sub === 'plan' ? (<>
        {edit ? <div className="mb-3"><Notice tone="info" title="Plan déverrouillé">Glissez les contenants (ou les zones) pour reproduire l’organisation réelle ; au clavier : flèches. Un toucher ouvre la fiche. Quand c’est fini, « Verrouiller le plan » pour éviter tout déplacement accidentel.</Notice></div> : <PlanLegend />}
        {!edit ? <div className="mb-2 text-xs text-ink2">{selMode ? 'Sélection multiple : touchez les cuves à traiter ensemble, puis choisissez l’opération en bas de l’écran.' : 'Clic droit (ou appui long) sur un contenant : opérations directes. Clic : fiche avec composition et intrants.'}</div> : null}
        <div className="space-y-5">
          {sitesShown.map((s) => (
            <section key={s.id} aria-label={`Plan ${s.nom}`}>
              {sitesShown.length > 1 ? <div className="mb-1 flex flex-wrap items-baseline gap-2"><h3 className="disp text-xl">{s.nom}</h3><span className="text-xs text-ink2">{s.adresse}</span></div> : (s.adresse ? <div className="mb-1 text-xs text-ink2">{s.nom} — {s.adresse}</div> : null)}
              {conts.filter((c) => c.siteId === s.id).length || (s.zones || []).length ? <PlanView site={s} conts={conts.filter((c) => c.siteId === s.id)} edit={edit} onOpen={ouvrir} onMenu={openMenu} onZone={(zid) => zoneEdit(s.id, zid)} sel={selMode ? sel : null} /> : <Empty>Aucun contenant sur ce site pour ce filtre.</Empty>}
            </section>
          ))}
        </div>
      </>) : null}
      {sub === 'cartes' ? <><PlanLegend /><TankCards conts={conts} onOpen={ouvrir} onMenu={openMenu} sel={selMode ? sel : null} /></> : null}
      {sub === 'liste' ? (
        <Tbl rows={conts} onRow={(c) => ouvrir(c.id)} onCtx={(c, e) => openMenu(c.id, e.clientX, e.clientY)} empty="Aucun contenant." cols={[
          ...(selMode ? [{ h: '', r: (c) => <input type="checkbox" className="h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={sel.includes(c.id)} onChange={() => ouvrir(c.id)} onClick={(e) => e.stopPropagation()} aria-label={`Sélectionner la cuve ${c.nom}`} /> }] : []),
          { h: 'Nom', r: (c) => <span className="inline-flex items-center gap-2"><ContainerGlyph db={db} R={R} c={c} width={22} /><b>{c.nom}</b></span> }, ...(multi ? [{ h: 'Site', r: (c) => siteName(db, c.siteId) }] : []), { h: 'Type', r: (c) => lbl(db, 'typesContenant', c.type) }, { h: 'Matière', r: (c) => lbl(db, 'matieres', c.matiere) }, { h: 'Fabricant', cls: 'hm', r: (c) => c.fabricant || '—' }, { h: 'Année', cls: 'hm', r: (c) => c.annee || '—' },
          { h: 'Volume max', cls: 'r', r: (c) => <span className="num">{fmtL(c.volMax)}</span> }, { h: 'Volume actuel', cls: 'r', r: (c) => <span className={cx('num', R.capOver[c.id] && 'text-bad font-semibold')}>{fmtL(R.contVol[c.id] || 0)}</span> },
          { h: 'Contenu', r: (c) => lotsOfCont(R, c.id).map((p) => (R.lots[p.lotId] || {}).code).join(', ') || '—' }, { h: 'Statut', cls: 'hm', r: (c) => (c.statut === 'archive' ? <Chip>Archivé</Chip> : <Chip tone="ok">Actif</Chip>) },
          { h: '', r: (c) => <button type="button" className="btn btn-sm" aria-label={`Opérations sur ${c.nom}`} onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); openMenu(c.id, r.right - 8, r.bottom + 4); }}>⋯</button> },
        ]} />
      ) : null}
      {sub === 'lots' ? (<>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="w-56"><SI plain value={lotF} onChange={setLotF} options={[{ value: 'stock', label: 'En stock' }, { value: 'tous', label: 'Tous les lots' }, ...stadeList(db).filter((x) => stock.some((l) => l.stade === x.id)).map((x) => ({ value: `s:${x.id}`, label: `Stade : ${x.label}` })), ...couleurList(db).filter((x) => stock.some((l) => l.couleur === x.id)).map((x) => ({ value: `c:${x.id}`, label: `Couleur : ${x.label}` })), ...Object.keys(LOT_TYPES).map((k) => ({ value: `t:${k}`, label: `Nature : ${LOT_TYPES[k]}` }))]} aria-label="Filtrer les lots" /></div>
          <div className="w-56"><TI value={lq} onChange={setLq} placeholder="Code ou désignation…" aria-label="Rechercher un lot" /></div>
          {parStade.length ? <div className="flex w-full flex-wrap items-center gap-1.5 text-xs" role="group" aria-label="Lots en stock par stade"><span className="text-ink2">En stock par stade :</span>{parStade.map((g) => <button key={g.x.id} type="button" className={cx('chip chip-c', lotF === `s:${g.x.id}` && 'font-bold')} style={{ '--c': g.x.couleur, cursor: 'pointer' }} aria-pressed={lotF === `s:${g.x.id}`} onClick={() => setLotF(lotF === `s:${g.x.id}` ? 'stock' : `s:${g.x.id}`)} title={`${g.n} lot(s) · ${fmtL(g.v)}`}>{g.x.court || g.x.label} · {g.n}{g.v > 0 ? ` · ${fmtL(g.v)}` : ''}</button>)}</div> : null}
          <span className="ml-auto text-sm text-ink2">{lots.length} lot(s){siteActif !== 'all' && lotF === 'stock' ? ' présents sur ce site' : ''} — les lots naissent des opérations (pressurage, entrée de moûts, assemblage, tirage, reprise de stock).</span>
        </div>
        <Tbl rows={lots} onRow={(l) => showLot(l.id)} empty="Aucun lot pour ce filtre." cols={[
          { h: 'Code', r: (l) => <b>{l.code}</b> }, { h: 'Désignation', r: (l) => l.designation }, { h: 'Millésime', cls: 'hm', r: (l) => l.millesime || '—' }, { h: 'Stade', r: (l) => <StadeChip id={l.stade} compact /> }, { h: 'Couleur', cls: 'hm', r: (l) => <CouleurChip id={l.couleur} /> }, { h: 'Nature', cls: 'hm', r: (l) => LOT_TYPES[l.type] },
          { h: 'Revendication', r: (l) => <QChip id={l.qualif} /> }, { h: ECH.nom, r: (l) => <EChip info={lotEchelle(db, R, l.id)} /> },
          { h: 'Volume / stock', cls: 'r', r: (l) => <span className="num">{(R.lotVol[l.id] || 0) > 0 ? fmtL(R.lotVol[l.id]) : ''}{R.tir[l.id] && R.tir[l.id].nb > 0 ? ` ${fmt(R.tir[l.id].nb)} btl` : ''}{!(R.lotVol[l.id] > 0) && !(R.tir[l.id] && R.tir[l.id].nb > 0) ? '—' : ''}</span> },
          { h: 'Contenants', cls: 'hm', r: (l) => uniq(Object.values(R.portions).filter((p) => p.lotId === l.id).map((p) => contName(db, p.contenantId))).join(', ') || '—' },
          { h: 'Origine', cls: 'hm', r: (l) => ((l.parentIds || []).length ? (l.parentIds || []).map((p) => lotCode(db, R, p)).join(', ') : '—') },
        ]} />
      </>) : null}
      {form ? <ContForm id={form === 'new' ? null : form} siteId={siteActif} onClose={() => setForm(null)} /> : null}
      {siteForm ? <SiteForm id={siteForm === 'new' ? null : siteForm} onClose={() => setSiteForm(null)} onSaved={() => act((d) => { d.settings.siteActif = d.sites[d.sites.length - 1].id; return okr(); })} /> : null}
      {zoneForm ? <ZoneForm siteId={zoneForm.siteId} zone={zoneForm.zone} onClose={() => setZoneForm(null)} /> : null}
      {printPlan ? <PlanPrintDialog siteIds={sitesShown.map((s) => s.id)} onClose={() => setPrintPlan(false)} /> : null}
      {selMode && sub !== 'lots' ? <SelectionBar sel={sel} setSel={setSel} conts={conts} onAction={(a) => setGrp({ action: a, contIds: sel.slice() })} onEtiquettes={() => setEtiq(sel.slice())} onFin={finSel} /> : null}
      {grp ? <GroupeForm action={grp.action} contIds={grp.contIds} onClose={() => setGrp(null)} onFait={finSel} /> : null}
      {etiq ? <EtiquettesSheet contIds={etiq} onClose={() => setEtiq(null)} /> : null}
      {scan ? <ScannerSheet onClose={() => setScan(false)} /> : null}
    </div>
  );
}
TABS_REG.cuverie = TabCuverie;

/* ---------- fiche contenant : contenu, composition (tous lots), intrants cumulés ---------- */
function ContSheet({ id, onClose, onBack, backLabel, onCloseAll }) {
  const { db, R, act, confirm, showLot, camp, openMenu, openReport, editCont, openAnalyse, openHyg } = useApp();
  const [perso, setPerso] = useState(false); const [calc, setCalc] = useState(null); const [etiq, setEtiq] = useState(false);
  const { dispo } = useFicheDispo('cont');
  const c = db.contenants.find((x) => x.id === id);
  const ps = lotsOfCont(R, id);
  const comp = useMemo(() => contentComp(db, R, id), [db, R, id]);
  const cumul = useMemo(() => intrantsForLots(db, R, ps.map((p) => p.lotId), true), [db, R, id]);
  if (!c) return null;
  const vol = R.contVol[id] || 0; const mat = matOf(db, c); const ei = comp ? echelleInfo(comp) : null;
  const ops = db.ops.filter((o) => opConts(o, R).includes(id)).sort(byDate).reverse();
  const hyg = db.hygiene.filter((h) => h.cibleType === 'contenant' && h.cibleId === id).sort(byDate).reverse();
  const apps = R.apps.filter((a) => a.contenantId === id && a.produitId).slice().reverse();
  const ans = db.analyses.filter((a) => a.contenantId === id).sort(byDate).reverse();
  const del = async () => { const ok = await confirm({ title: `Supprimer ${c.nom} ?`, body: 'Possible uniquement si ce contenant n’a aucun historique.', ok: 'Supprimer', danger: true }); if (ok) { const r = act((d) => contDelete(d, id), 'Contenant supprimé.'); if (r.ok) onClose(); } };
  const lotIdsPresents = ps.map((p) => p.lotId);
  // doses de chaque application, par produit et lot fournisseur (lots présents et lots d'origine) : dans l'unité du produit
  const dosesDe = (r) => R.apps.filter((a) => a.produitId === r.produitId && (a.arrivageId || '') === (r.arrivageId || '') && a.lotId && r.lots.has(a.lotId) && a.dose != null).map((a) => a.dose);
  const blocs = {
    fermentation: <FermentationSection contId={id} />,
    jauge: <JaugeSection contId={id} />,
    lots: <Sec title={`Lots présents (${ps.length})`} className="mb-5">
      <Tbl rows={ps.map((p) => ({ ...p, id: p.portionId }))} empty="Contenant vide." onRow={(p) => showLot(p.lotId)} cols={[
        { h: 'Lot', r: (p) => <LotLink id={p.lotId} /> }, { h: 'Désignation', cls: 'hm', r: (p) => (R.lots[p.lotId] || {}).designation }, { h: 'Stade', r: (p) => <StadeChip id={(R.lots[p.lotId] || {}).stade} compact /> }, { h: 'Revendication', r: (p) => <QChip id={(R.lots[p.lotId] || {}).qualif} /> }, { h: ECH.nom, r: (p) => <EChip info={lotEchelle(db, R, p.lotId)} compact /> },
        { h: 'Volume', cls: 'r', r: (p) => <span className="num">{fmtL(p.vol)}</span> }, { h: 'Part', cls: 'r hm', r: (p) => <span className="num">{pct(p.vol / (vol || 1))}</span> }, { h: 'Depuis', cls: 'hm', r: (p) => fmtDate(p.since) },
        { h: 'Agir', r: (p) => <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>{['intrant', 'transfert', 'jaugeage'].map((t) => <ActBtn key={t} type={t} portionId={p.portionId} />)}</div> },
      ]} />
    </Sec>,
    composition: <Sec title="Composition du contenu" right={ps.length > 1 ? <span className="text-xs text-ink2">mélange de {ps.length} lots, au prorata des volumes</span> : null} className="mb-5"><CompBlock comp={comp} empty="Contenant vide : aucune composition." /></Sec>,
    intrants: <Sec title="Intrants du contenu (cumulés, lots d’origine inclus)" className="mb-5">
      <Tbl rows={cumul.map((r, i) => ({ ...r, id: `${r.produitId}|${r.arrivageId}|${i}` }))} empty={ps.length ? 'Aucun intrant enregistré sur ces lots ni sur leurs lots d’origine.' : 'Contenant vide.'} cols={[
        { h: 'Produit', r: (r) => <b>{prodOf(db, r.produitId).nom}</b> }, { h: 'Lot fournisseur', r: (r) => r.numLot || '—' }, { h: 'Quantité cumulée', cls: 'r', r: (r) => <span className="num">{fmt(r.qty, 2)} {r.unite}</span> },
        { h: 'Doses à l’application', cls: 'r', r: (r) => { const t = dosesTexte(dosesDe(r), r.unite); return t ? <span className="num" title="Dose de chaque ajout, dans l’unité du produit, au volume traité ce jour-là">{t}</span> : '—'; } },
        { h: 'Lots concernés', r: (r) => <div className="flex flex-wrap gap-x-2">{[...r.lots].map((l) => <LotLink key={l} id={l} />)}</div> }, { h: 'Origine', cls: 'hm', r: (r) => (r.direct ? <Chip tone="info">appliqué sur le lot présent</Chip> : <Chip>lot d’origine</Chip>) },
        { h: '', r: (r) => (r.unauth ? <Chip tone="bad">non autorisé</Chip> : null) },
      ]} />
    </Sec>,
    ajouts: <Sec title="Ajouts d’intrants réalisés dans ce contenant" className="mb-5"><Tbl rows={apps.slice(0, 40)} empty="Aucun intrant enregistré." cols={[
      { h: 'Date', r: (a) => fmtDate(a.date) }, { h: 'Lot de vin', r: (a) => <LotLink id={a.lotId} /> }, { h: 'Produit', r: (a) => prodOf(db, a.produitId).nom }, { h: 'Quantité', cls: 'r', r: (a) => <span className="num">{fmt(a.qty, 2)} {a.unite}</span> },
      { h: 'Dose', cls: 'r', r: (a) => (a.dose != null ? <span className={cx('num', a.over && 'text-bad')}>{doseTexte(a.dose, a.unite)}</span> : '—') }, { h: 'Lot fournisseur', r: (a) => a.numLot || '—' },
    ]} /></Sec>,
    hygiene: <Sec title="Hygiène" right={<Btn size="sm" onClick={() => openHyg({ cibleType: 'contenant', cibleId: id })}>+ Ajouter</Btn>}><Tbl rows={hyg.slice(0, 12)} empty="Aucune action d’hygiène." cols={[{ h: 'Date', r: (h) => fmtDate(h.date) }, { h: 'Action', r: (h) => lbl(db, 'actionsHygiene', h.actionId) }, { h: 'Produit', r: (h) => h.produit || '—' }, { h: 'Par', r: (h) => (Array.isArray(h.operateurs) && h.operateurs.length ? <OperateursChips ids={h.operateurs} /> : <span className="text-xs">{h.operateur || '—'}</span>) }]} /></Sec>,
    analyses: <Sec title="Analyses prélevées ici" right={ps.length ? <Btn size="sm" onClick={() => openAnalyse({ lotId: ps[0].lotId, contenantId: id })}>+ Ajouter</Btn> : null}><Tbl rows={ans.slice(0, 12)} empty="Aucune analyse." cols={[{ h: 'Date', r: (a) => fmtDate(a.date) }, { h: 'Lot', r: (a) => <LotLink id={a.lotId} /> }, { h: 'Valeurs', r: (a) => Object.keys(a.valeurs).map((k) => `${(db.analysesParams.find((p) => p.id === k) || {}).nom} ${fmt(a.valeurs[k], (db.analysesParams.find((p) => p.id === k) || {}).dec || 0)}`).join(' · ') }]} /></Sec>,
    mouts: <MoutsRecusSection cid={id} />,
    historique: <Sec title="Historique des opérations"><Tbl rows={ops.slice(0, 30)} empty="Aucune opération." cols={[{ h: 'Date', r: (o) => fmtDate(o.date) }, { h: 'Opération', r: (o) => <span className="inline-flex flex-wrap items-center gap-1"><Chip tone={OP_TONE[o.type]}>{opNom(o)}</Chip><GroupeChip x={o} /></span> }, { h: 'Détail', r: (o) => opSummary(db, R, o) }, { h: 'Opérateur(s)', r: (o) => <OperateursChips ids={o.operateurs} /> }, { h: '', r: (o) => <WarnChip n={(R.warn[o.id] || []).length} verified={o.verifie} /> }]} /></Sec>,
  };
  return (
    <Sheet title={c.nom} sub={`${lbl(db, 'typesContenant', c.type)} · ${lbl(db, 'matieres', c.matiere)}${c.fabricant || c.annee ? ` · fabriqué${c.fabricant ? ` par ${c.fabricant}` : ''}${c.annee ? ` en ${c.annee}` : ''}` : ''}${db.sites.length > 1 ? ` · ${siteName(db, c.siteId)}` : ''}`} onClose={onClose} onBack={onBack} backLabel={backLabel} onCloseAll={onCloseAll} wide
      footer={<><Btn kind="danger" onClick={del} className="mr-auto">Supprimer</Btn><Btn onClick={() => setEtiq(true)} title="Étiquette QR de ce contenant (fiche ouverte d’un scan)">🏷 Étiquette QR</Btn><Btn onClick={() => openReport({ kind: 'cont', ids: [id] })}>🖨 Rapport…</Btn><Btn onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); openMenu(id, r.left, r.top - 8, true); }}>Opérations ▾</Btn><Btn onClick={() => act((d) => contSave(d, { ...c, statut: c.statut === 'archive' ? 'actif' : 'archive' }, id), c.statut === 'archive' ? 'Contenant réactivé.' : 'Contenant archivé.')}>{c.statut === 'archive' ? 'Réactiver' : 'Archiver'}</Btn><Btn kind="primary" onClick={() => editCont(id)}>Modifier</Btn></>}>
      <div className="mb-5 flex flex-wrap items-center gap-5">
        <ContainerGlyph db={db} R={R} c={c} width={Math.max(96, tileSize(db, c).sw)} />
        <dl className="kv"><dt>Contenu</dt><dd className="num">{fmtL(vol)} / {fmtL(c.volMax)} ({pct(vol / c.volMax)})</dd><dt>Statut</dt><dd>{c.statut === 'archive' ? 'Archivé' : 'Actif'}</dd>
          {ps.length ? <><dt>Stade</dt><dd className="flex flex-wrap gap-1" data-stade-cuve="">{uniq(ps.map((p) => (R.lots[p.lotId] || {}).stade).filter(Boolean)).map((st) => <StadeChip key={st} id={st} />)}</dd><dt>Revendication</dt><dd className="flex flex-wrap gap-1">{uniq(ps.map((p) => (R.lots[p.lotId] || {}).qualif)).map((qq) => <QChip key={qq} id={qq} />)}</dd><dt>{ECH.nom}</dt><dd><EChip info={ei} /></dd></> : null}
          <dt>Apparence</dt><dd className="flex items-center gap-2"><span className="swatch" style={{ background: mat.couleur }} />{lbl(db, 'matieres', c.matiere)} · {formeLabel(formeOf(db, c))}</dd>{c.notes ? <><dt>Notes</dt><dd>{c.notes}</dd></> : null}</dl>
        {R.capOver[id] ? <Notice tone="bad" title="À vérifier">Le volume dépasse la capacité maximale du contenant.</Notice> : null}
        <div className="ml-auto flex flex-wrap gap-1 self-start no-print"><Btn size="sm" onClick={() => setCalc('so2')} disabled={!ps.length} title="SO₂ moléculaire, enrichissement">🧪 Calculs</Btn><Btn size="sm" onClick={() => setPerso(true)} title="Rubriques affichées et leur ordre">⚙ Personnaliser la fiche</Btn></div>
      </div>
      <RubriquesRendu dispo={dispo} blocs={blocs} paires={[['hygiene', 'analyses']]} />
      {perso ? <FicheRubriquesSheet kind="cont" onClose={() => setPerso(false)} /> : null}
      {calc ? <CalculsSheet contId={id} onglet={calc} onClose={() => setCalc(null)} /> : null}
      {etiq ? <EtiquettesSheet contIds={[id]} onClose={() => setEtiq(false)} /> : null}
    </Sheet>
  );
}
function ActBtn({ type, portionId }) { const { camp, openOp } = useApp(); return <Btn size="sm" disabled={camp.figee} onClick={() => openOp(type, { portionId })}>{OP_LABELS[type]}</Btn>; }
