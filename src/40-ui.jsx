/* ============ UI : composants communs ============ */
const { useId } = React;
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);
const TABS_REG = {}; // chaque onglet s'enregistre ici (voir 6x-*.jsx)
const cx = (...a) => a.filter(Boolean).join(' ');
const useDraft = (init) => { const [v, setV] = useState(init); const set = (k, val) => setV((p) => ({ ...p, [k]: val })); return [v, set, setV]; };

const Chip = ({ tone, children, title, className, ...p }) => <span title={title} className={cx('chip', tone && `chip-${tone}`, className)} {...p}>{children}</span>;
// pastille de revendication : couleur de la liste (variable CSS --q<id>, posée par l'application pour chaque revendication)
const qStyle = (id) => ({ '--c': `var(--q${qDef(id).id}, #7C8A84)` });
const QChip = ({ id }) => <span className={`chip chip-c q-${qDef(id).id}`} style={qStyle(id)} title={`Revendication — rang ${rang(id)}`}>{qLabel(id)}</span>;
// échelle des crus : { id, partiel } (voir echelleInfo) ; id null = origine non renseignée
const EChip = ({ info, id, compact }) => {
  const e = info ? info.id : id; const part = !!(info && info.partiel);
  if (!e || !eDef(e)) return <span className="chip e-inconnu" title={`Origine (cru) non renseignée : ${ECH.nom.toLowerCase()} indéterminée`}>{compact ? '? ' : 'Non classé'}</span>;
  return <span className={cx('chip chip-c', e === echTop() && 'font-bold')} style={{ '--c': `var(--e${e})` }} title={`${ECH.nom} : ${eLabel(e)} (rang le plus bas des crus du lot)${part ? ` — origine partiellement renseignée (${pct(info.inconnu)} inconnu)` : ''}`}>{compact ? eDef(e).court : eLabel(e)}{part ? ' *' : ''}</span>;
};
// stade et couleur du vin
const StadeChip = ({ id, compact }) => { const { db } = useApp(); if (!id) return null; return <span className="chip chip-c" style={{ '--c': stadeColor(db, id) }} title={`Stade : ${stadeLabel(db, id)}`}>{compact ? stadeCourt(db, id) : stadeLabel(db, id)}</span>; };
const CouleurChip = ({ id }) => { const { db } = useApp(); if (!id) return null; return <span className="chip" title={`Couleur du vin : ${couleurLabel(db, id)}`}><i className="swatch" style={{ background: couleurColor(db, id), width: 10, height: 10, borderRadius: 999, marginRight: 4 }} />{couleurLabel(db, id)}</span>; };
const Btn = ({ kind, size, className, children, ...p }) => <button type="button" className={cx('btn', kind && `btn-${kind}`, size === 'sm' && 'btn-sm', className)} {...p}>{children}</button>;
// champ (0.48.0-alpha.1) : nom du champ du formulaire (data-champ) — une erreur renvoyée par le moteur (fail(msg, { champ })) s'affiche dessous
const Field = ({ label, help, children, className, champ }) => (<label className={cx('block min-w-0', className)} data-champ={champ || undefined}><span className="lbl">{label}</span>{children}{help ? <span className="help block">{help}</span> : null}</label>);
const Group = ({ label, help, children, className, champ }) => (<div className={cx('min-w-0', className)} data-champ={champ || undefined}><span className="lbl">{label}</span>{children}{help ? <span className="help block">{help}</span> : null}</div>);
const TI = ({ value, onChange, ...p }) => <input className="inp" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} />;
const NI = ({ value, onChange, ...p }) => <input className="inp num" inputMode="decimal" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} />;
// Volume saisi en hectolitres ; la valeur transmise reste en litres (texte), comme dans le reste du moteur
function VI({ value, onChange, ...p }) {
  const [txt, setTxt] = useState(() => hlTxt(value)); const sent = useRef(value);
  useEffect(() => { if (value !== sent.current) { sent.current = value; setTxt(hlTxt(value)); } }, [value]);
  return <input className="inp num" inputMode="decimal" value={txt} onChange={(e) => { const t = e.target.value; setTxt(t); const L = hasNum(t) ? String(Math.round(num(t) * 10000) / 100) : ''; sent.current = L; onChange(L); }} {...p} />;
}
const DI = ({ value, onChange, ...p }) => <input className="inp" type="date" value={value || ''} onChange={(e) => onChange(e.target.value)} {...p} />;
const TA = ({ value, onChange, ...p }) => <textarea className="inp" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} />;
// 0.38.0-alpha.3 : valeur enregistrée dans la base après une pause de frappe (ms) ou en quittant le champ, plus à chaque caractère
// (chaque enregistrement copie, contrôle et sauvegarde toute la base) ; rien n'est perdu à la fermeture : envoi au démontage
function useDiffere(value, onChange, ms = 400) {
  const [v, setV] = useState(value ?? ''); const att = useRef(null); const cb = useRef(onChange); cb.current = onChange;
  const envoyer = () => { if (att.current) { clearTimeout(att.current.t); const x = att.current.v; att.current = null; cb.current(x); } };
  useEffect(() => { if (!att.current) setV(value ?? ''); }, [value]);
  useEffect(() => () => envoyer(), []);
  const changer = (x) => { setV(x); if (att.current) clearTimeout(att.current.t); att.current = { v: x, t: setTimeout(envoyer, ms) }; };
  return [v, changer, envoyer];
}
const TAD = ({ value, onChange, ...p }) => { const [v, changer, envoyer] = useDiffere(value, onChange); return <textarea className="inp" value={v} onChange={(e) => changer(e.target.value)} onBlur={envoyer} {...p} />; };
const SI = ({ value, onChange, options, placeholder, search, plain, ...p }) => (!plain && (search || options.length >= COMBO_MIN)
  ? <Combo value={value} onChange={onChange} options={options} placeholder={placeholder || undefined} required={placeholder == null} {...p} />
  : (
  <select className="inp" value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p}>
    {placeholder != null ? <option value="">{placeholder}</option> : null}
    {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled} translate={o.donnee ? 'no' : undefined}>{o.label}</option>)}
  </select>
));
const Check = ({ checked, onChange, label, disabled }) => (<label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={!!checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />{label}</label>);
const Empty = ({ children }) => <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-ink2">{children}</div>;
const Notice = ({ tone = 'warn', title, children }) => (<div className={cx('rounded-md px-3 py-2 text-sm', tone === 'bad' ? 'bg-badSoft text-bad' : tone === 'ok' ? 'bg-okSoft text-ok' : tone === 'info' ? 'bg-accentSoft text-accent' : 'bg-warnSoft text-warn')} role={tone === 'bad' ? 'alert' : undefined}>{title ? <div className="font-semibold">{title}</div> : null}{children}</div>);
const Sec = ({ title, right, children, className, ...p }) => (<section className={cx('mb-6', className)} {...p}><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="sec-t text-xl font-semibold">{title}</h3>{right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}</div>{children}</section>);
// 0.48.0-alpha.1 : une tuile qui signale quelque chose à traiter s'ouvre au clic (onClick : onglet et filtre voulus ; va : « Voir … »)
const Kpi = ({ label, value, sub, tone, onClick, va }) => { const corps = <><div className="lbl mb-0">{label}</div><div className={cx('disp text-2xl leading-tight', tone === 'bad' && 'text-bad', tone === 'warn' && 'text-warn', tone === 'ok' && 'text-ok')}>{value}</div>{sub ? <div className="text-xs text-ink2">{sub}</div> : null}{onClick && va ? <div className="kpi-va">{va} →</div> : null}</>;
  return onClick ? <button type="button" className="card kpi-clic px-3 py-2 min-w-0" onClick={onClick} data-kpi-clic="">{corps}</button> : <div className="card px-3 py-2 min-w-0">{corps}</div>; };
// sous-onglets (0.48.0-alpha.1) : style propre (.subtab, soulignement) distinct des actions (.btn-primary), bande défilante au téléphone
const SubNav = ({ value, onChange, items }) => (
  <BandeDefilante dep={value} className="mb-4"><div className="subtabs" role="tablist" data-bande="">
    {items.map((it) => (<button key={it.id} type="button" role="tab" aria-selected={value === it.id} onClick={() => onChange(it.id)} className="subtab">{it.label}{it.badge ? <span className={cx('chip', 'chip-warn')}>{it.badge}</span> : null}</button>))}
  </div></BandeDefilante>
);

/* ---------- fiches (Sheet) : focus, clavier, page inerte, erreurs de validation, téléphone (0.48.0-alpha.1) ---------- */
const SHEET_DEFIL = { avant: '' }; // défilement de la page avant la première fiche
const SHEETS = []; // feuilles ouvertes (la dernière est au premier plan : seule elle réagit à Échap, retient le focus et affiche les erreurs)
const FOCUS_DOUX = { actif: false }; // focus posé par la fiche (ouverture, erreur) : une liste de choix (Combo) ne s'ouvre pas pour autant
const SHEET_INERTES = []; // éléments rendus inertes par la fiche au premier plan (rendus actifs quand elle change ou se ferme)
const TEL_MQ = '(max-width: 760px)'; // téléphone : même seuil que les styles
function useTel() {
  const mq = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(TEL_MQ) : null);
  const [tel, setTel] = useState(() => { const m = mq(); return !!(m && m.matches); });
  useEffect(() => { const m = mq(); if (!m) return undefined; const f = () => setTel(m.matches); f(); if (m.addEventListener) m.addEventListener('change', f); else m.addListener(f); return () => { if (m.removeEventListener) m.removeEventListener('change', f); else m.removeListener(f); }; }, []);
  return tel;
}
const focusDoux = (el, opts) => { if (!el || !el.focus) return; FOCUS_DOUX.actif = true; try { el.focus(opts); } finally { FOCUS_DOUX.actif = false; } };
const SHEET_FOCUSABLES = 'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
const visibleEl = (el) => !!(el && el.getClientRects && el.getClientRects().length) && !el.closest('[hidden],[inert]');
const sheetFocusables = (root) => (root ? [...root.querySelectorAll(SHEET_FOCUSABLES)].filter((el) => visibleEl(el) && el.tabIndex >= 0) : []);
const CHAMP_CTRL = 'input:not([type="hidden"]):not([type="file"]),select,textarea,[role="combobox"],button';
// élément du champ nommé par une erreur : data-champ, champ personnalisé (perso:<id>), moût d'une entrée (entrees.<i>.<clé>)
function ficheChampTrouver(root, champ) {
  if (!root || !champ) return null; const q = (sel, r) => { try { return (r || root).querySelector(sel); } catch (e) { return null; } };
  const c = String(champ); const esc = (x) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(x) : String(x).replace(/["\\]/g, '\\$&'));
  if (c.startsWith('perso:')) return q(`[data-champ-perso="${esc(c.slice(6))}"]`);
  const m = /^entrees\.(\d+)(?:\.(.+))?$/.exec(c);
  if (m) { const bloc = q(`[data-mout="${Number(m[1]) + 1}"]`); if (!bloc) return null; return (m[2] && q(`[data-champ="e.${esc(m[2])}"]`, bloc)) || bloc; }
  return q(`[data-champ="${esc(c)}"]`);
}
// erreur de validation affichée dans la fiche au premier plan (r = fail(msg, { champ }) ; r réussi : erreur effacée) ; renvoie r
function ficheErreur(r) { const s = SHEETS[SHEETS.length - 1]; if (s && s.erreur && r && typeof r === 'object') s.erreur(r.ok === false ? r : null); return r; }
// act de l'application, avec l'erreur affichée sous le champ de la fiche ouverte (le message habituel reste)
function useActFiche() { const { act } = useApp(); return useCallback((fn, msg, opts) => ficheErreur(act(fn, msg, opts)), [act]); }
// erreur vue par le formulaire lui-même (avant le moteur) : message habituel + affichage dans la fiche
function useErreurFiche() { const { toast } = useApp(); return useCallback((msg, champ) => { toast(msg, 'bad'); ficheErreur(fail(msg, champ ? { champ } : undefined)); }, [toast]); }
// page inerte (clavier, lecteurs d'écran) sauf la fiche au premier plan ; verrou, fenêtres de confirmation, menus et messages exclus
function sheetInerteMaj() {
  while (SHEET_INERTES.length) SHEET_INERTES.pop().removeAttribute('inert');
  const top = SHEETS[SHEETS.length - 1]; const ov = top && top.el; if (!ov || !ov.isConnected || typeof document === 'undefined') return;
  for (let n = ov; n && n.parentElement && n !== document.body; n = n.parentElement) {
    [...n.parentElement.children].forEach((x) => {
      if (x === n || x.hasAttribute('inert') || ['SCRIPT', 'STYLE', 'TEMPLATE', 'LINK'].includes(x.tagName)) return;
      if (x.matches('[data-verrou],.toast,.ctxmenu,[role="alertdialog"],[role="menu"]') || x.querySelector('[data-verrou],[role="alertdialog"]')) return;
      x.setAttribute('inert', ''); SHEET_INERTES.push(x);
    });
  }
}
// pied au téléphone : l'action principale + menu « ⋯ » (autres boutons, « Annuler » en dernier) ; inchangé s'il n'y a qu'un bouton de plus
const filsPlats = (x) => React.Children.toArray(x).flatMap((c) => (c && c.type === React.Fragment ? filsPlats(c.props.children) : [c]));
function SheetPiedTel({ footer, onClose }) {
  const [ouvert, setOuvert] = useState(false); const box = useRef(null);
  useEffect(() => { if (!ouvert) return undefined; const k = (e) => { if (box.current && !box.current.contains(e.target)) setOuvert(false); }; document.addEventListener('pointerdown', k, true); return () => document.removeEventListener('pointerdown', k, true); }, [ouvert]);
  const L = filsPlats(footer); const estBtn = (c) => !!c && (c.type === Btn || c.type === 'button');
  const prim = L.filter((c) => estBtn(c) && c.props.kind === 'primary'); const autres = L.filter((c) => !prim.includes(c));
  if (!prim.length || autres.length < 2 || !autres.every(estBtn)) return footer;
  const fin = autres.filter((c) => c.props.onClick === onClose); const menu = [...autres.filter((c) => !fin.includes(c)).reverse(), ...fin];
  return (<>
    <div className="sheet-plus mr-auto" ref={box} onKeyDown={(e) => { if (e.key === 'Escape' && ouvert) { e.preventDefault(); e.stopPropagation(); setOuvert(false); } }}>
      <Btn className="sheet-plus-btn" aria-haspopup="menu" aria-expanded={ouvert} aria-label="Autres actions" title="Autres actions" onClick={() => setOuvert(!ouvert)} data-sheet-plus="">⋯</Btn>
      {ouvert ? <div className="sheet-plus-menu" role="menu" data-sheet-plus-menu="">{menu.map((c, i) => React.cloneElement(c, { key: c.key || `m${i}`, role: 'menuitem', className: cx(String(c.props.className || '').replace(/\bmr-auto\b/g, '').trim(), 'sheet-plus-item'), onClick: (e) => { setOuvert(false); if (c.props.onClick) c.props.onClick(e); } }))}</div> : null}
    </div>
    {prim}
  </>);
}
function Sheet({ title, sub, onClose, onBack, backLabel, onCloseAll, children, footer, wide }) {
  const me = useRef({}); const cb = useRef(onClose); cb.current = onClose; const ov = useRef(null); const titre = useRef(null); const marque = useRef(null);
  const [err, setErr] = useState(null); const [subVu, setSubVu] = useState(false); const tel = useTel(); const errId = `fe${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  me.current.erreur = (r) => setErr(r ? { msg: r.msg, champ: r.champ || '', n: Date.now() } : null);
  // déclencheur : élément actif au premier rendu (avant qu'un champ autoFocus de la fiche ne prenne le focus)
  const decl = useRef(undefined); if (decl.current === undefined) decl.current = typeof document !== 'undefined' ? document.activeElement : null;
  useEffect(() => {
    const declencheur = decl.current;
    me.current.el = ov.current; SHEETS.push(me.current); sheetInerteMaj();
    const k = (e) => {
      if (SHEETS[SHEETS.length - 1] !== me.current) return;
      if (e.key === 'Escape') { cb.current(); return; }
      if (e.key !== 'Tab' || !ov.current) return; // focus retenu dans la fiche (Tab, Maj+Tab)
      const a = document.activeElement; const dans = ov.current.contains(a);
      if (!dans && a && a !== document.body && a.closest && a.closest('[role="alertdialog"],[role="dialog"],[role="menu"],[data-verrou]')) return; // autre fenêtre au-dessus
      const F = sheetFocusables(ov.current); if (!F.length) return; const i = F.indexOf(a);
      if (!dans || i < 0) { if (!dans) { e.preventDefault(); (e.shiftKey ? F[F.length - 1] : F[0]).focus(); } }
      else if (e.shiftKey && i === 0) { e.preventDefault(); F[F.length - 1].focus(); }
      else if (!e.shiftKey && i === F.length - 1) { e.preventDefault(); F[0].focus(); }
    };
    window.addEventListener('keydown', k); if (SHEETS.length === 1) SHEET_DEFIL.avant = document.body.style.overflow; document.body.style.overflow = 'hidden';
    // focus initial, une seule fois : premier champ (bureau) ou titre (téléphone : pas de clavier ouvert d'office) ; un champ autoFocus est respecté
    if (ov.current && !ov.current.contains(document.activeElement)) {
      const bureau = !(window.matchMedia && window.matchMedia(TEL_MQ).matches);
      const champ = bureau ? [...ov.current.querySelectorAll('.sheet-b input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]),.sheet-b select,.sheet-b textarea')].find((x) => visibleEl(x) && !x.disabled && !x.readOnly) : null;
      focusDoux(champ || titre.current, { preventScroll: true });
    }
    // 0.38.0-alpha.3 : défilement rendu à la fermeture de la DERNIÈRE fiche (plusieurs fiches fermées ensemble le laissaient bloqué)
    return () => {
      window.removeEventListener('keydown', k); const i = SHEETS.indexOf(me.current); if (i >= 0) SHEETS.splice(i, 1); if (!SHEETS.length) document.body.style.overflow = SHEET_DEFIL.avant || '';
      sheetInerteMaj();
      // focus rendu au déclencheur (encore affiché), si le focus était dans la fiche ou perdu
      const a = document.activeElement; const perdu = !a || a === document.body || !a.isConnected || (me.current.el && me.current.el.contains(a));
      if (perdu && declencheur && declencheur !== document.body && declencheur.isConnected && !declencheur.closest('[inert]')) { try { focusDoux(declencheur, { preventScroll: true }); } catch (e) { /* ignoré */ } }
    };
  }, []);
  // erreur de validation : message sous le champ, aria-invalid, focus sur le champ (sinon message seul au-dessus du pied)
  useEffect(() => {
    const m0 = marque.current;
    if (m0) { if (m0.noeud.parentNode) m0.noeud.parentNode.removeChild(m0.noeud); m0.el.classList.remove('champ-en-erreur'); if (m0.ctl) { m0.ctl.removeAttribute('aria-invalid'); if (m0.desc) m0.ctl.setAttribute('aria-describedby', m0.desc); else m0.ctl.removeAttribute('aria-describedby'); } marque.current = null; }
    if (!err || !err.champ || !ov.current) return;
    const el = ficheChampTrouver(ov.current, err.champ); if (!el) return;
    for (let d = el; d && d !== ov.current; d = d.parentElement) if (d.tagName === 'DETAILS' && !d.open) d.open = true; // champ replié : ouvert
    const ctl = (el.matches(CHAMP_CTRL) ? el : null) || [...el.querySelectorAll(CHAMP_CTRL)].find((x) => visibleEl(x) && !x.disabled) || null;
    const noeud = document.createElement('span'); noeud.className = 'champ-erreur'; noeud.id = `${errId}c`; noeud.setAttribute('data-champ-erreur', ''); noeud.textContent = err.msg;
    if (el.matches(CHAMP_CTRL)) el.insertAdjacentElement('afterend', noeud); else el.appendChild(noeud);
    el.classList.add('champ-en-erreur'); const m = { el, noeud, ctl, desc: ctl ? ctl.getAttribute('aria-describedby') : null }; marque.current = m;
    if (ctl) { ctl.setAttribute('aria-invalid', 'true'); if (!(el.tagName === 'LABEL' && el.contains(ctl))) ctl.setAttribute('aria-describedby', [m.desc, noeud.id].filter(Boolean).join(' ')); focusDoux(ctl, { preventScroll: true }); }
    try { (ctl || el).scrollIntoView({ block: 'center' }); } catch (e) { /* ignoré */ }
  }, [err]);
  // le champ en erreur est modifié : son message disparaît
  const saisie = (e) => { const m = marque.current; if (err && m && m.el.contains(e.target)) setErr(null); };
  const alerte = err ? <div className="sheet-erreur" role="alert" data-sheet-erreur="">{err.msg}</div> : null;
  const pied = footer ? (tel ? <SheetPiedTel footer={footer} onClose={onClose} /> : footer) : null;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Fiche'} ref={ov}>
      <div className={cx('sheet', wide && 'wide')} onInput={saisie} onChange={saisie}>
        <div className={cx('sheet-h', subVu && 'sub-vu')}><div className="min-w-0">{onBack ? <button type="button" className="linkish mb-0.5 text-xs" onClick={onBack}>← Retour{backLabel ? ` : ${backLabel}` : ''}</button> : null}<h2 className="sheet-title break-words text-2xl font-semibold leading-tight" tabIndex={-1} ref={titre}>{title}</h2>{sub ? <div className="sheet-sub text-sm text-ink2">{sub}</div> : null}</div>
          {sub && tel ? <button type="button" className="sheet-sub-btn" aria-expanded={subVu} aria-label="Détails" title="Détails" onClick={() => setSubVu(!subVu)} data-sheet-sub="">ⓘ</button> : null}
          <Btn size="sm" kind="ghost" className="shrink-0" onClick={onCloseAll || onClose} aria-label="Fermer">✕ Fermer</Btn></div>
        <div className="sheet-b">{children}</div>
        {pied || alerte ? <div className={cx('sheet-f', tel && 'sheet-f-tel')}>{alerte}{pied}</div> : null}
      </div>
    </div>
  );
}

function Tbl({ cols, rows, onRow, onCtx, empty = 'Aucune donnée.', foot }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <div className="tblwrap"><table className="tbl"><thead><tr>{cols.map((c, i) => <th key={i} className={c.cls}>{c.h}</th>)}</tr></thead>
      <tbody>{rows.map((r, ri) => (<tr key={r.id || ri} className={onRow ? 'clk' : ''} onClick={onRow ? () => onRow(r) : undefined} onContextMenu={onCtx ? (e) => { e.preventDefault(); onCtx(r, e); } : undefined}>{cols.map((c, i) => <td key={i} className={c.cls}>{c.r(r)}</td>)}</tr>))}</tbody>{foot}</table></div>
  );
}

function StackBar({ items }) {
  const list = items.filter((i) => i.share > 0.0005).sort((a, b) => b.share - a.share);
  if (!list.length) return <div className="text-sm text-ink2">Composition inconnue (aucune donnée d’origine).</div>;
  return (
    <div>
      <div className="bar" role="img" aria-label={list.map((i) => `${i.label} ${pct(i.share)}`).join(', ')}>{list.map((i) => <i key={i.label} style={{ width: `${i.share * 100}%`, background: i.color }} />)}</div>
      <ul className="mt-2 grid gap-x-4 gap-y-1 text-sm" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))' }}>
        {list.map((i) => (<li key={i.label} className="flex min-w-0 items-center gap-2"><span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: i.color }} /><span className="truncate">{i.label}</span><span className="num ml-auto">{pct(i.share, i.share < 0.1 ? 1 : 0)}</span></li>))}
      </ul>
    </div>
  );
}

/* ---------- export de fichiers (capacité « downloads » si disponible, sinon lien navigateur) ---------- */
async function saveFile(filename, data, mime) {
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  try {
    if (window.claude && typeof window.claude.use === 'function') {
      const dl = await window.claude.use('downloads');
      if (dl) { await dl.save({ filename, data }); return { ok: true }; }
    }
  } catch (e) { return { ok: false, declined: !!(e && e.code === 'declined'), error: e }; }
  if (framed && window.claude) return { ok: false, unavailable: true }; // dans claude.ai, seul le téléchargement via la capacité fonctionne
  try { // navigateur ordinaire (page enregistrée hors claude.ai) : lien de téléchargement classique
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    return { ok: true };
  } catch (e) { return { ok: false, error: e }; }
}
const failMsg = (r) => { const c = r && r.error && r.error.code; return r && r.unavailable ? 'Téléchargement indisponible dans cette vue : ouvrez la page directement dans claude.ai.' : c === 'rate_limited' ? 'Une demande de téléchargement est déjà ouverte : répondez-y, puis réessayez.' : c === 'too_large' ? 'Fichier trop volumineux pour être enregistré ici.' : c === 'unavailable' || c === 'not_granted' ? 'Téléchargement indisponible dans cette vue : ouvrez la page directement dans claude.ai.' : 'Impossible de créer le fichier.'; };

/* ---------- affichage des références ---------- */
const lotCode = (db, R, id) => ((R && R.lots[id]) || lotById(db, id) || {}).code || '—';
const contName = (db, id) => (db.contenants.find((c) => c.id === id) || {}).nom || '—';
const prodOf = (db, id) => db.produits.find((p) => p.id === id) || {};
const arrOf = (db, id) => db.arrivages.find((a) => a.id === id) || {};
const prepOf = (R, id) => (R && R.preps[id]) || {};
function LotLink({ id }) { const { db, R, showLot } = useApp(); return <button type="button" className="linkish" onClick={(e) => { e.stopPropagation(); showLot(id); }}>{lotCode(db, R, id)}</button>; }
function ContLink({ id }) { const { db, showCont } = useApp(); return <button type="button" className="linkish" onClick={(e) => { e.stopPropagation(); showCont(id); }}>{contName(db, id)}</button>; }
const WarnChip = ({ n, verified }) => (n ? <Chip tone={verified ? '' : 'warn'} title="Avertissements non bloquants">{verified ? '✓ vérifié' : `⚠ à vérifier${n > 1 ? ` (${n})` : ''}`}</Chip> : null);
