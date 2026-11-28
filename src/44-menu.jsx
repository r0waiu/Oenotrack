/* ============ MENU CONTEXTUEL DES CONTENANTS (clic droit / appui long / bouton ⋯ / touche Menu) · MENUS DÉROULANTS · SITES · ZONES DU PLAN ============
   0.48.0-alpha.1 : clavier (focus sur la première entrée, flèches, Début / Fin, Échap), MenuDeroulant (journal, fiche du lot), menu ouvert depuis un lot */
const useLayoutEffect = React.useLayoutEffect;

const MenuItem = ({ ic, children, onClick, disabled, hint, tone, ...p }) => (
  <button type="button" role="menuitem" className="mi" disabled={disabled} onClick={onClick} style={tone === 'bad' ? { color: 'var(--bad)' } : undefined} {...p}><span className="ic" aria-hidden="true">{ic}</span><span className="min-w-0">{children}</span>{hint ? <small>{hint}</small> : null}</button>
);

/* 0.48.0-alpha.1 — menus au clavier : flèches haut / bas (en boucle), Début / Fin parmi les entrées actives ; focus sur la première entrée */
const menuEntrees = (el) => (el ? [...el.querySelectorAll('[role=menuitem]')].filter((b) => !b.disabled && b.offsetParent !== null) : []);
function menuClavier(e, el) {
  const L = menuEntrees(el); if (!L.length) return false;
  const i = L.indexOf(document.activeElement);
  const k = e.key === 'ArrowDown' ? (i + 1) % L.length : e.key === 'ArrowUp' ? (i <= 0 ? L.length - 1 : i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? L.length - 1 : -1;
  if (k < 0) return false;
  e.preventDefault(); L[k].focus(); return true;
}
const menuFocusPremiere = (el) => { const L = menuEntrees(el); if (L[0]) { try { L[0].focus({ preventScroll: true }); } catch (er) { L[0].focus(); } } };
// portion à présélectionner dans le menu d'un contenant ouvert depuis une ligne de lot (« ⋯ » de la liste des lots)
const CTX_PORTION = { id: null, t: 0 };
function ouvrirMenuLot(openMenu, R, lotId, x, y) {
  const ps = Object.values(R.portions).filter((p) => p.lotId === lotId && p.vol > 0).sort((a, b) => b.vol - a.vol);
  if (!ps.length) return false;
  CTX_PORTION.id = ps[0].id; CTX_PORTION.t = Date.now(); openMenu(ps[0].contenantId, x, y, { portionId: ps[0].id }); return true;
}

/* Menu déroulant (bouton « ⋯ », « Opération sur ce lot ▾ ») : mêmes entrées et même clavier que le menu d'un contenant ; Échap le ferme
   sans fermer la fiche qui le contient, le focus revient au bouton. children(fermer) rend les <MenuItem>. */
function MenuDeroulant({ label, title, children, className, kind, size = 'sm', menuLabel, ...p }) {
  const [ouvert, setOuvert] = useState(null); const btn = useRef(null); const ref = useRef(null);
  const fermer = (rendre) => { setOuvert(null); if (rendre !== false && btn.current) btn.current.focus(); };
  const ouvrir = () => { const r = btn.current.getBoundingClientRect(); setOuvert({ x: r.left, y: r.bottom + 4, r: r.right, h: r.top }); };
  const [pos, setPos] = useState(null); const narrow = typeof window !== 'undefined' && window.innerWidth < 560;
  useLayoutEffect(() => {
    if (!ouvert) { setPos(null); return; }
    const el = ref.current; if (!el || narrow) { setPos({}); return; }
    const r = el.getBoundingClientRect(); const vw = window.innerWidth, vh = window.innerHeight;
    const left = clamp(ouvert.r - r.width, 8, Math.max(8, vw - r.width - 8)); const top = ouvert.y + r.height > vh - 8 && ouvert.h - r.height - 4 > 8 ? ouvert.h - r.height - 4 : clamp(ouvert.y, 8, Math.max(8, vh - r.height - 8));
    setPos({ left, top });
  }, [ouvert]);
  useEffect(() => { if (ouvert && pos) menuFocusPremiere(ref.current); }, [!!ouvert, !!pos]);
  useEffect(() => {
    if (!ouvert) return undefined;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target) && btn.current && !btn.current.contains(e.target)) fermer(false); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); fermer(); } };
    // défilement de la page ou redimensionnement : le menu suit son bouton (fermé si le bouton n'est plus affiché)
    const suivre = (e) => { if (ref.current && e && e.target && e.target.nodeType === 1 && ref.current.contains(e.target)) return; const b = btn.current; if (!b || !b.isConnected || !b.offsetParent) { fermer(false); return; } const r = b.getBoundingClientRect(); setOuvert({ x: r.left, y: r.bottom + 4, r: r.right, h: r.top }); };
    document.addEventListener('pointerdown', down, true); window.addEventListener('keydown', key, true); window.addEventListener('resize', suivre); window.addEventListener('scroll', suivre, true);
    return () => { document.removeEventListener('pointerdown', down, true); window.removeEventListener('keydown', key, true); window.removeEventListener('resize', suivre); window.removeEventListener('scroll', suivre, true); };
  }, [!!ouvert]);
  const style = narrow ? { left: 8, right: 8, bottom: 8, top: 'auto', maxHeight: '80vh' } : (pos && pos.left != null ? pos : { left: ouvert ? ouvert.x : 0, top: ouvert ? ouvert.y : 0, visibility: 'hidden' });
  return (
    <>
      <button ref={btn} type="button" className={cx('btn', size === 'sm' && 'btn-sm', kind && `btn-${kind}`, className)} aria-haspopup="menu" aria-expanded={!!ouvert} title={title} onClick={(e) => { e.stopPropagation(); if (ouvert) fermer(false); else ouvrir(); }}
        onKeyDown={(e) => { if (!ouvert && (e.key === 'ArrowDown' || e.key === 'ContextMenu')) { e.preventDefault(); ouvrir(); } }} {...p}>{label}</button>
      {ouvert ? <div ref={ref} className="ctxmenu menu-deroulant" role="menu" aria-label={menuLabel || (typeof label === 'string' ? label : title)} style={style} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => menuClavier(e, ref.current)} onContextMenu={(e) => e.preventDefault()}>{children(() => fermer(false))}</div> : null}
    </>
  );
}

function CtxMenu({ m, onClose }) {
  const { db, R, camp, act, showCont, showLot, openOp, openAnalyse, openHyg, openReport, editCont } = useApp();
  const c = db.contenants.find((x) => x.id === m.cid);
  const ps = c ? contParts(R, c.id).sort((a, b) => (a.since < b.since ? -1 : 1)) : [];
  const [sel, setSel] = useState(() => { const voulu = m.portionId || (Date.now() - CTX_PORTION.t < 1500 ? CTX_PORTION.id : null); return ps.some((q) => q.portionId === voulu) ? voulu : ps[0] ? ps[0].portionId : null; });
  const ref = useRef(null); const [pos, setPos] = useState(null); const [tout, setTout] = useState(false);
  // 0.48.0-alpha.1 : focus sur la première entrée à l'ouverture, flèches haut / bas, focus rendu à l'élément d'origine à la fermeture
  const origine = useRef(typeof document !== 'undefined' ? document.activeElement : null);
  const narrow = typeof window !== 'undefined' && window.innerWidth < 560;
  const vu = narrow || !!pos;
  useEffect(() => { if (vu) menuFocusPremiere(ref.current); }, [vu]);
  useEffect(() => () => { const o = origine.current; if (o && o.isConnected && typeof o.focus === 'function' && (!document.activeElement || document.activeElement === document.body)) { try { o.focus({ preventScroll: true }); } catch (e) { /* ignoré */ } } }, []);
  useLayoutEffect(() => {
    const el = ref.current; if (!el || narrow) return;
    const r = el.getBoundingClientRect(); const vw = window.innerWidth, vh = window.innerHeight;
    setPos({ left: clamp(m.x, 8, Math.max(8, vw - r.width - 8)), top: clamp(m.y, 8, Math.max(8, vh - r.height - 8)) });
  }, [sel, tout]);
  useEffect(() => {
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const key = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    const away = () => onClose();
    document.addEventListener('pointerdown', down, true); window.addEventListener('keydown', key, true); window.addEventListener('resize', away); window.addEventListener('blur', away);
    return () => { document.removeEventListener('pointerdown', down, true); window.removeEventListener('keydown', key, true); window.removeEventListener('resize', away); window.removeEventListener('blur', away); };
  }, []);
  if (!c) return null;
  const p = ps.find((q) => q.portionId === sel) || ps[0] || null;
  const lot = p ? R.lots[p.lotId] : null; const vol = R.contVol[c.id] || 0; const lock = camp.figee;
  const go = (fn) => () => { onClose(); fn(); };
  const op = (type, preset) => go(() => openOp(type, preset));
  // raccourcis du catalogue (Paramètres › Opérations) puis, sur demande, toutes les opérations sur une portion, par groupe
  const OPS = opMenu(db); const autres = opSurPortion(db).filter((x) => !OPS.includes(x));
  const IC = { assemblage: opIcone(db, 'assemblage'), etape: opIcone(db, 'etape') };
  const fracPreset = () => ({ frac: Object.fromEntries(fracPress(db).map((fr) => [fr.id, { volL: '', contenantId: fr.id === 'cuvee' ? c.id : '', code: '' }])) });
  const style = narrow ? { left: 8, right: 8, bottom: 8, top: 'auto', maxHeight: '80vh' } : (pos || { left: m.x, top: m.y, visibility: 'hidden' });
  return (
    <div ref={ref} className="ctxmenu" role="menu" aria-label={`Actions sur ${c.nom}`} style={style} onContextMenu={(e) => e.preventDefault()} onKeyDown={(e) => menuClavier(e, ref.current)} data-ctxmenu={c.id}>
      <div className="mh">
        <div className="flex items-center gap-2"><div className="disp min-w-0 flex-1 truncate text-lg leading-tight">{c.nom}</div><button type="button" className="btn btn-sm btn-ghost" onClick={onClose} aria-label="Fermer le menu">✕</button></div>
        <div className="text-xs text-ink2">{lbl(db, 'typesContenant', c.type)} · {lbl(db, 'matieres', c.matiere)}{db.sites.length > 1 ? ` · ${siteName(db, c.siteId)}` : ''} · <span className="num">{fmtHL(vol)} / {fmtL(c.volMax)}</span></div>
        {ps.length ? <div className="mt-1 flex flex-wrap gap-1">{ps.map((q) => { const l = R.lots[q.lotId] || {}; return <Fragment key={q.portionId}><span className={`chip chip-c q-${qDef(l.qualif).id}`} style={qStyle(l.qualif)}>{l.code} · {fmtL(q.vol)}</span><StadeChip id={l.stade} compact /></Fragment>; })}</div> : <div className="mt-1 text-xs text-ink2">Contenant vide</div>}
      </div>
      {ps.length > 1 ? (<>
        <div className="ms">Lot concerné par les opérations</div>
        <div className="flex flex-wrap gap-1 px-2.5 pb-1">{ps.map((q) => <button key={q.portionId} type="button" aria-pressed={p && q.portionId === p.portionId} className={cx('btn btn-sm', p && q.portionId === p.portionId && 'btn-primary')} onClick={() => setSel(q.portionId)}>{(R.lots[q.lotId] || {}).code}</button>)}</div>
      </>) : null}
      <div className="ms">Consulter</div>
      <MenuItem ic="▦" onClick={go(() => showCont(c.id))}>Fiche du contenant (composition, intrants)</MenuItem>
      {ps.map((q) => (ps.length === 1 || (p && q.portionId === p.portionId)) ? <MenuItem key={q.portionId} ic="◍" onClick={go(() => showLot(q.lotId))}>Fiche du lot {(R.lots[q.lotId] || {}).code}</MenuItem> : null)}
      <MenuItem ic="🖨" onClick={go(() => openReport({ kind: 'cont', ids: [c.id] }))}>Rapport imprimable…</MenuItem>
      {p ? (<>
        <div className="ms">Opérations sur {lot ? lot.code : 'le lot'} · {fmtL(p.vol)}{lock ? ' (campagne figée)' : ''}</div>
        {OPS.map((x) => <MenuItem key={x.id} ic={opIcone(db, x.id)} disabled={lock} onClick={op(x.id, { portionId: p.portionId })}>{x.label}</MenuItem>)}
        {autres.length ? (tout ? OP_GROUPES.concat(uniq(autres.map((x) => x.groupe)).filter((g) => !OP_GROUPES.includes(g))).map((g) => { const L = autres.filter((x) => x.groupe === g); return L.length ? <Fragment key={g}><div className="ms" style={{ fontSize: 11, opacity: 0.8 }}>{g}</div>{L.map((x) => <MenuItem key={x.id} ic={opIcone(db, x.id)} disabled={lock} onClick={op(x.id, { portionId: p.portionId })}>{x.label}</MenuItem>)}</Fragment> : null; })
          : <MenuItem ic="⋯" onClick={() => setTout(true)}>Autres opérations ({autres.length})…</MenuItem>) : null}
        <MenuItem ic={IC.assemblage} disabled={lock} onClick={op('assemblage', { sources: [{ portionId: p.portionId, volL: String(r2(p.vol)) }, { portionId: '', volL: '' }] })}>Assemblage (ce lot comme source)</MenuItem>
        {(() => { const nx = lot ? stadeNext(db, lot.stade) : null; return nx ? <MenuItem ic="➜" disabled={lock} onClick={op(opEtapePour(db, nx.id), { lotId: p.lotId, newStade: nx.id })}>Passer en « {nx.court || nx.label} »</MenuItem> : null; })()}
        <MenuItem ic={IC.etape} disabled={lock} onClick={op('etape', { lotId: p.lotId, newStade: lot ? lot.stade : '' })}>Changer de stade / couleur…</MenuItem>
        <MenuItem ic="🧪" onClick={go(() => openAnalyse({ lotId: p.lotId, contenantId: c.id }))}>Analyse sur ce contenant</MenuItem>
      </>) : null}
      <div className="ms">Remplir ce contenant{lock ? ' (campagne figée)' : ''}</div>
      <MenuItem ic="🍇" disabled={lock} onClick={op('pressurage', fracPreset())}>Pressurage → cuvée ici</MenuItem>
      <MenuItem ic="🫗" disabled={lock} onClick={op('entree_mout', { entrees: [moutLine(db, c.id)] })}>Entrée de moûts ici</MenuItem>
      <MenuItem ic="⇢" disabled={lock} onClick={op('transfert', { destId: c.id })}>Recevoir un transfert / soutirage</MenuItem>
      <MenuItem ic="📦" disabled={lock} onClick={op('reprise', { kind: 'vin', contenantId: c.id })}>Reprise de stock ici</MenuItem>
      <div className="ms">Contenant</div>
      <MenuItem ic="🧽" onClick={go(() => openHyg({ cibleType: 'contenant', cibleId: c.id }))}>Hygiène (nettoyage, rinçage…)</MenuItem>
      <MenuItem ic="✎" onClick={go(() => editCont(c.id))}>Modifier le contenant</MenuItem>
      <MenuItem ic={c.statut === 'archive' ? '↺' : '🗄'} onClick={go(() => act((d) => contSave(d, { ...c, statut: c.statut === 'archive' ? 'actif' : 'archive' }, c.id), c.statut === 'archive' ? 'Contenant réactivé.' : 'Contenant archivé.'))}>{c.statut === 'archive' ? 'Réactiver' : 'Archiver'}</MenuItem>
    </div>
  );
}

function SiteForm({ id, onClose, onSaved }) {
  const { db, act, confirm } = useApp(); const s = id ? db.sites.find((x) => x.id === id) : null;
  const [f, set] = useDraft({ nom: s ? s.nom : '', adresse: s ? s.adresse : '' });
  const n = id ? db.contenants.filter((c) => c.siteId === id).length : 0;
  const save = () => { const r = act((d) => siteSave(d, f, id), id ? 'Site modifié.' : 'Site ajouté.'); if (r.ok) { if (onSaved && !id) onSaved(); onClose(); } };
  const del = async () => { const ok = await confirm({ title: `Supprimer le site ${s.nom} ?`, body: 'Possible seulement si aucun contenant n’y est rattaché.', ok: 'Supprimer', danger: true }); if (ok) { const r = act((d) => siteDelete(d, id), 'Site supprimé.'); if (r.ok) onClose(); } };
  return (
    <FormSheet title={id ? `Modifier le site ${s.nom}` : 'Nouveau site de cuverie'} sub="Les stocks restent communs à tous les sites : un site ne fait que regrouper des contenants et leur plan." onClose={onClose} onSave={save} extraFooter={id ? <Btn kind="danger" onClick={del} className="mr-auto">Supprimer</Btn> : null}>
      <Field label="Nom du site" help={f.nom.trim() && nameTaken(db.sites, f.nom, id) ? '⚠ Ce nom existe déjà.' : ''}><TI value={f.nom} onChange={(v) => set('nom', v)} autoFocus placeholder="ex. Chai de Vertus" /></Field>
      <Field label="Adresse / commentaire"><TI value={f.adresse} onChange={(v) => set('adresse', v)} /></Field>
      {id ? <div className="help">{n} contenant(s) rattaché(s) à ce site. Pour en déplacer un : fiche du contenant › Modifier › Site.</div> : null}
    </FormSheet>
  );
}

const hexOr = (c, d) => (/^#[0-9a-fA-F]{6}$/.test(c || '') ? c : d);
const ColorInput = ({ value, onChange, ...p }) => <input type="color" className="inp" value={hexOr(value, '#9AA39B')} onChange={(e) => onChange(e.target.value)} {...p} />;
const ZONE_COLORS = ['#3E8E4E', '#5F7A8A', '#C07A2C', '#8454B3', '#B3372F', '#9AA39B'];
function ZoneForm({ siteId, zone, onClose }) {
  const { db, act } = useApp(); const z = zone || {};
  const [f, set] = useDraft({ label: z.label || '', couleur: z.couleur || ZONE_COLORS[0], w: String(z.w || 320), h: String(z.h || 200), x: z.x != null ? z.x : 20, y: z.y != null ? z.y : 20 });
  const save = () => { const r = act((d) => zoneSave(d, siteId, { ...z, ...f }), z.id ? 'Zone modifiée.' : 'Zone ajoutée au plan.'); if (r.ok) onClose(); };
  const del = () => { act((d) => zoneDelete(d, siteId, z.id), 'Zone supprimée.'); onClose(); };
  return (
    <FormSheet title={z.id ? 'Modifier la zone' : 'Nouvelle zone du plan'} sub="Étiquette d’un espace : salle, quai, chambre froide, terrasse…" onClose={onClose} onSave={save} extraFooter={z.id ? <Btn kind="danger" onClick={del} className="mr-auto">Supprimer</Btn> : null}>
      <Field label="Libellé"><TI value={f.label} onChange={(v) => set('label', v)} autoFocus placeholder="ex. Cuverie, Chai à fûts…" /></Field>
      <G><Field label="Largeur"><NI value={f.w} onChange={(v) => set('w', v)} /></Field><Field label="Hauteur"><NI value={f.h} onChange={(v) => set('h', v)} /></Field></G>
      <Group label="Couleur"><div className="flex flex-wrap items-center gap-2">{ZONE_COLORS.map((c) => <button key={c} type="button" aria-label={`Couleur ${c}`} aria-pressed={f.couleur === c} onClick={() => set('couleur', c)} className="h-8 w-8 rounded-md" style={{ background: c, outline: f.couleur === c ? '3px solid var(--ink)' : '1px solid var(--line)', outlineOffset: 1 }} /> )}<div className="w-20"><ColorInput value={f.couleur} onChange={(v) => set('couleur', v)} aria-label="Couleur personnalisée" /></div></div></Group>
    </FormSheet>
  );
}
