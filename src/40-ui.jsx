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
const Field = ({ label, help, children, className }) => (<label className={cx('block min-w-0', className)}><span className="lbl">{label}</span>{children}{help ? <span className="help block">{help}</span> : null}</label>);
const Group = ({ label, help, children, className }) => (<div className={cx('min-w-0', className)}><span className="lbl">{label}</span>{children}{help ? <span className="help block">{help}</span> : null}</div>);
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
const Sec = ({ title, right, children, className }) => (<section className={cx('mb-6', className)}><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><h3 className="sec-t text-xl font-semibold">{title}</h3>{right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}</div>{children}</section>);
const Kpi = ({ label, value, sub, tone }) => (<div className="card px-3 py-2 min-w-0"><div className="lbl mb-0">{label}</div><div className={cx('disp text-2xl leading-tight', tone === 'bad' && 'text-bad', tone === 'warn' && 'text-warn', tone === 'ok' && 'text-ok')}>{value}</div>{sub ? <div className="text-xs text-ink2">{sub}</div> : null}</div>);
const SubNav = ({ value, onChange, items }) => (
  <div className="mb-4 flex gap-1 overflow-x-auto pb-1" role="tablist">
    {items.map((it) => (<button key={it.id} type="button" role="tab" aria-selected={value === it.id} onClick={() => onChange(it.id)} className={cx('btn shrink-0', value === it.id && 'btn-primary')}>{it.label}{it.badge ? <span className={cx('chip', value === it.id ? '' : 'chip-warn')}>{it.badge}</span> : null}</button>))}
  </div>
);

const SHEETS = []; // feuilles ouvertes (la dernière est au premier plan : seule elle réagit à Échap)
function Sheet({ title, sub, onClose, onBack, backLabel, onCloseAll, children, footer, wide }) {
  const me = useRef({}); const cb = useRef(onClose); cb.current = onClose;
  useEffect(() => {
    SHEETS.push(me.current);
    const k = (e) => { if (e.key === 'Escape' && SHEETS[SHEETS.length - 1] === me.current) cb.current(); };
    window.addEventListener('keydown', k); const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); const i = SHEETS.indexOf(me.current); if (i >= 0) SHEETS.splice(i, 1); document.body.style.overflow = prev; };
  }, []);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : 'Fiche'}>
      <div className={cx('sheet', wide && 'wide')}>
        <div className="sheet-h"><div className="min-w-0">{onBack ? <button type="button" className="linkish mb-0.5 text-xs" onClick={onBack}>← Retour{backLabel ? ` : ${backLabel}` : ''}</button> : null}<h2 className="sheet-title break-words text-2xl font-semibold leading-tight">{title}</h2>{sub ? <div className="text-sm text-ink2">{sub}</div> : null}</div><Btn size="sm" kind="ghost" className="shrink-0" onClick={onCloseAll || onClose} aria-label="Fermer">✕ Fermer</Btn></div>
        <div className="sheet-b">{children}</div>
        {footer ? <div className="sheet-f">{footer}</div> : null}
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
