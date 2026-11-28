/* ============ SAISIE AVEC AUTOCOMPLÉTION (données préenregistrées : crus, apporteurs, contenants, produits, lots…) ============ */
// Au-delà de COMBO_MIN choix, une liste déroulante devient un champ où l'on commence à écrire (« Lou » → Louvois)
const COMBO_MIN = 8;

// Surligne la partie tapée (recherche sans accents ni majuscules)
function comboHl(label, q) {
  const t = norm(q).trim().split(/\s+/)[0]; if (!t) return label;
  const chars = [...String(label)]; const nl = chars.map((c) => norm(c)); if (nl.some((x) => x.length !== 1)) return label;
  const i = nl.join('').indexOf(t); if (i < 0) return label;
  return <>{chars.slice(0, i).join('')}<mark>{chars.slice(i, i + t.length).join('')}</mark>{chars.slice(i + t.length).join('')}</>;
}

function Combo({ value, onChange, options, placeholder, className, disabled, autoFocus, required, onCreate, createLabel, 'aria-label': ariaLabel, maxShown = 80 }) {
  const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const [typed, setTyped] = useState(false); const [hi, setHi] = useState(0);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, ''); const box = useRef(null); const lst = useRef(null); const inp = useRef(null);
  const sel = options.find((o) => o.value === value) || null;
  // libellé d'interface (o.t, 0.30.0-alpha.1) : affiché et cherché dans la langue choisie ; les données (noms…) restent telles quelles
  const lg = useLangue(); const lb = (o) => (o.t && lg !== 'fr' ? traduire(o.label, lg) : o.label);
  const list = useMemo(() => {
    const t = norm(q).trim(); if (!typed || !t) return options;
    const words = t.split(/\s+/).filter(Boolean);
    return options.map((o, i) => {
      const L = norm(lb(o)); const all = norm(`${lb(o)} ${o.t && lg !== 'fr' ? o.label : ''} ${o.sub || ''} ${o.keys || ''} ${o.group || ''}`);
      if (!words.every((w) => all.includes(w))) return null;
      const s = L.startsWith(t) ? 0 : L.split(/[\s\-'’().·/]+/).some((x) => x.startsWith(words[0])) ? 1 : L.includes(words[0]) ? 2 : 3;
      return { o, s, i };
    }).filter(Boolean).sort((a, b) => a.s - b.s || a.i - b.i).map((x) => x.o);
  }, [options, q, typed, lg]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = list.slice(0, maxShown);
  useEffect(() => { if (!open || !lst.current) return; const el = lst.current.querySelector(`[data-i="${hi}"]`); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }, [hi, open]);
  const reset = () => { setOpen(false); setTyped(false); setQ(''); };
  const choose = (o) => { if (!o || o.disabled) return; onChange(o.value); reset(); };
  const key = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) setOpen(true); else setHi((h) => Math.min(shown.length - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') { if (open && shown[hi]) { e.preventDefault(); choose(shown[hi]); } }
    else if (e.key === 'Tab') { if (open && typed && q.trim() && shown[hi]) choose(shown[hi]); else reset(); }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); e.stopPropagation(); reset(); } }
  };
  const text = typed ? q : (sel ? lb(sel) : (value ? `(${value})` : ''));
  return (
    <div ref={box} className={cx('combo', className)} onBlur={(e) => { if (box.current && !box.current.contains(e.relatedTarget)) reset(); }}>
      <input ref={inp} className="inp" role="combobox" aria-expanded={open} aria-controls={`cb${uid}`} aria-autocomplete="list" aria-label={ariaLabel} autoComplete="off" spellCheck={false}
        aria-activedescendant={open && shown[hi] ? `cb${uid}-${hi}` : undefined} value={text} placeholder={placeholder || 'Commencez à écrire…'} disabled={disabled} autoFocus={autoFocus} title={sel ? `${lb(sel)}${sel.sub ? ' · ' + sel.sub : ''}` : undefined}
        onFocus={(e) => { if (typeof FOCUS_DOUX !== 'undefined' && FOCUS_DOUX.actif) return; /* focus posé par la fiche (0.48.0-alpha.1) : liste fermée */ setOpen(true); setHi(Math.max(0, options.findIndex((o) => o.value === value))); e.target.select(); }}
        onMouseDown={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setTyped(true); setOpen(true); setHi(0); }} onKeyDown={key} />
      {value && !disabled && !required ? <button type="button" tabIndex={-1} className="combo-x" aria-label="Effacer la saisie" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(''); reset(); }}>×</button> : null}
      {open && !disabled ? (
        <ul id={`cb${uid}`} ref={lst} role="listbox" className="combo-list" aria-label={ariaLabel}>
          {shown.length ? shown.map((o, i) => [
            o.group && (i === 0 || shown[i - 1].group !== o.group) ? <li key={`g${i}`} role="presentation" className="combo-g">{o.group}</li> : null,
            <li key={`o${o.value}`} id={`cb${uid}-${i}`} data-i={i} role="option" aria-selected={o.value === value} aria-disabled={o.disabled || undefined}
              className={cx('combo-o', i === hi && 'hi', o.value === value && 'sel', o.disabled && 'dis')} onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setHi(i)} onClick={() => choose(o)}>
              <span className="min-w-0 truncate">{typed ? comboHl(lb(o), q) : lb(o)}</span>{o.sub ? <span className="combo-sub">{o.sub}</span> : null}
            </li>,
          ]) : <li className="combo-none">Aucun résultat{typed && q ? ` pour « ${q} »` : ''}</li>}
          {list.length > shown.length ? <li className="combo-none">… et {list.length - shown.length} autres : précisez la saisie</li> : null}
          {onCreate && typed && q.trim() ? <li className="combo-o combo-new" onMouseDown={(e) => e.preventDefault()} onClick={() => { const t = q.trim(); reset(); onCreate(t); }}>+ {createLabel || 'Ajouter'} « {q.trim()} »</li> : null}
        </ul>
      ) : null}
    </div>
  );
}
