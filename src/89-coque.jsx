/* ============ COQUE DE L'APPLICATION (0.48.0-alpha.1) : bandes d'onglets défilantes, menu de la campagne, recherche globale, fil d'Ariane ============
   - BandeDefilante : dégradé et flèche aux bords d'une bande d'onglets qui déborde (téléphone), onglet actif ramené dans la vue ;
   - CampagneMenu : la pastille « Ouverte / Figée » de l'en-tête ouvre un petit menu (figer ou rouvrir, gérer les campagnes) — plus de
     bouton « Figer la campagne » permanent ;
   - RechercheGlobale : champ de l'en-tête (et Ctrl+K) qui réutilise traceChercher et ouvre directement la fiche du lot, du lot fini, du
     contenant ou de l'opération ; « Tout voir dans Traçabilité » passe la recherche à l'onglet (TRACE_RECHERCHE_DEMANDE) ;
   - FilAriane : « Vinification › Cuverie & Lots » sous la barre d'onglets (bureau). */
const TRACE_RECHERCHE_DEMANDE = { q: '' }; // recherche transmise à Traçabilité (lue puis vidée par l'onglet)

function useBandeDefilante(dep) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined; const bande = el.querySelector('[data-bande]') || el;
    const maj = () => { const avant = bande.scrollLeft > 4; const apres = bande.scrollLeft + bande.clientWidth < bande.scrollWidth - 4;
      if (avant) el.setAttribute('data-avant', ''); else el.removeAttribute('data-avant'); if (apres) el.setAttribute('data-apres', ''); else el.removeAttribute('data-apres'); };
    const actif = bande.querySelector('[aria-selected="true"]');
    if (actif && bande.scrollWidth > bande.clientWidth) { const g = actif.offsetLeft - bande.offsetLeft; const c = g - (bande.clientWidth - actif.offsetWidth) / 2; try { bande.scrollTo({ left: Math.max(0, c) }); } catch (e) { bande.scrollLeft = Math.max(0, c); } }
    maj(); bande.addEventListener('scroll', maj, { passive: true }); window.addEventListener('resize', maj);
    return () => { bande.removeEventListener('scroll', maj); window.removeEventListener('resize', maj); };
  }, [dep]);
  return ref;
}
function BandeDefilante({ dep, className, children }) {
  const ref = useBandeDefilante(dep);
  const pousser = (s) => { const b = ref.current && (ref.current.querySelector('[data-bande]') || ref.current); if (b) try { b.scrollBy({ left: s * Math.max(160, b.clientWidth * 0.7), behavior: 'smooth' }); } catch (e) { b.scrollLeft += s * 200; } };
  return (
    <div ref={ref} className={cx('bande-defil', className)}>
      <button type="button" className="bande-btn g" tabIndex={-1} aria-hidden="true" onClick={() => pousser(-1)}>‹</button>
      {children}
      <button type="button" className="bande-btn d" tabIndex={-1} aria-hidden="true" onClick={() => pousser(1)}>›</button>
    </div>
  );
}

function CampagneMenu({ camp, peutFiger, onFiger, onGerer }) {
  const [ouvert, setOuvert] = useState(false); const ref = useRef(null);
  useEffect(() => {
    if (!ouvert) return undefined;
    const hors = (e) => { if (ref.current && !ref.current.contains(e.target)) setOuvert(false); };
    const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOuvert(false); } };
    document.addEventListener('pointerdown', hors); window.addEventListener('keydown', k, true);
    const premier = ref.current && ref.current.querySelector('.camp-pop button'); if (premier) premier.focus();
    return () => { document.removeEventListener('pointerdown', hors); window.removeEventListener('keydown', k, true); };
  }, [ouvert]);
  const choisir = (fn) => { setOuvert(false); fn(); };
  return (
    <span className="camp-menu" ref={ref}>
      <button type="button" className={cx('chip', camp.figee ? 'chip-bad' : 'chip-ok')} aria-haspopup="menu" aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)} title="État de la campagne" aria-label={camp.figee ? 'Campagne figée' : 'Campagne ouverte'} data-camp-etat=""><span className="camp-ic" aria-hidden="true">{camp.figee ? '🔒' : '🔓'}</span><span className="camp-txt">{camp.figee ? 'Figée' : 'Ouverte'}</span> ▾</button>
      {ouvert ? (
        <div className="camp-pop" role="menu" aria-label="Campagne">
          {peutFiger ? <button type="button" role="menuitem" onClick={() => choisir(onFiger)} data-camp-figer="">{camp.figee ? 'Rouvrir la campagne…' : 'Figer la campagne…'}</button> : null}
          <button type="button" role="menuitem" onClick={() => choisir(onGerer)}>Gérer les campagnes ↗</button>
        </div>) : null}
    </span>
  );
}

const RG_TYPES = { lot: 'Lot', fini: 'Lot fini', op: 'Opération', cont: 'Contenant' };
function RechercheGlobale() {
  const { db, R, setTab, showLot, showFini, showCont, openOp } = useApp();
  const [q, setQ] = useState(''); const [ouvert, setOuvert] = useState(false); const [sel, setSel] = useState(0); const ref = useRef(null); const champ = useRef(null);
  useEffect(() => { // Ctrl+K (Cmd+K) : aller à la recherche
    const k = (e) => { if ((e.ctrlKey || e.metaKey) && !e.altKey && String(e.key).toLowerCase() === 'k') { e.preventDefault(); if (champ.current) { champ.current.focus(); champ.current.select(); } } };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, []);
  useEffect(() => { if (!ouvert) return undefined; const hors = (e) => { if (ref.current && !ref.current.contains(e.target)) setOuvert(false); }; document.addEventListener('pointerdown', hors); return () => document.removeEventListener('pointerdown', hors); }, [ouvert]);
  const res = useMemo(() => {
    const t = norm(q).trim(); if (t.length < 2) return [];
    const conts = (db.contenants || []).filter((c) => c && !c.archive && norm(c.nom || '').includes(t)).slice(0, 5).map((c) => ({ type: 'cont', id: c.id, titre: c.nom, sous: (contParts(R, c.id) || []).map((p) => lotCode(db, R, p.lotId)).filter(Boolean).join(', ') }));
    let tr = []; try { tr = traceChercher(db, R, q); } catch (e) { console.error(e); }
    return [...conts, ...tr.slice(0, 12)];
  }, [q, db, R]);
  const ouvrir = (x) => {
    setOuvert(false); setQ('');
    if (!x) return; if (x.type === 'lot') showLot(x.id); else if (x.type === 'fini') showFini(x.id); else if (x.type === 'cont') showCont(x.id);
    else if (x.type === 'op') { const o = (db.ops || []).find((y) => y.id === x.id); if (o) openOp(o.type, null, o.id); }
  };
  const toutVoir = () => { TRACE_RECHERCHE_DEMANDE.q = q; setOuvert(false); setQ(''); setTab('trace'); };
  const clavier = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(res.length, s + 1)); setOuvert(true); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (sel < res.length) ouvrir(res[sel]); else toutVoir(); }
    else if (e.key === 'Escape') { setOuvert(false); }
  };
  const trace = moduleActif(db, 'trace'); let etroit = false; try { etroit = window.innerWidth < 760; } catch (e) { /* ignoré */ }
  return (
    <div className="recherche-g" ref={ref} data-recherche-globale="">
      <input ref={champ} className="inp" type="search" value={q} placeholder={etroit ? '🔎' : 'Rechercher (Ctrl+K)'} aria-label="Rechercher un lot, une cuve, une pesée…" role="combobox" aria-expanded={ouvert && q.trim().length >= 2} aria-controls="recherche-g-liste" aria-autocomplete="list"
        onChange={(e) => { setQ(e.target.value); setSel(0); setOuvert(true); }} onFocus={() => setOuvert(true)} onKeyDown={clavier} />
      {ouvert && q.trim().length >= 2 ? (
        <div className="recherche-pop" id="recherche-g-liste" role="listbox" aria-label="Résultats">
          {res.length ? res.map((x, i) => (
            <div key={`${x.type}:${x.id}`} role="option" aria-selected={i === sel} onPointerDown={(e) => e.preventDefault()} onClick={() => ouvrir(x)} data-rg={x.type}>
              <span className="rg-type">{RG_TYPES[x.type] || x.type}</span><span className="min-w-0"><b translate="no">{x.titre}</b>{x.sous ? <span className="block text-xs text-ink2" translate="no">{x.sous}</span> : null}</span>
            </div>)) : <div className="p-2 text-sm text-ink2">Aucun résultat.</div>}
          {trace ? <div role="option" aria-selected={sel === res.length} onPointerDown={(e) => e.preventDefault()} onClick={toutVoir} data-rg="trace"><span className="rg-type">🔎</span><span>Tout voir dans Traçabilité</span></div> : null}
        </div>) : null}
    </div>
  );
}

function FilAriane({ tab, sub }) {
  const g = ongletDe(tab); const parts = [];
  if (g !== tab) parts.push(moduleNom(g));
  parts.push(moduleNom(tab));
  if (!parts.length || parts.length < 2) return null;
  return <div className="fil-ariane" data-fil-ariane="">{parts.map((p, i) => <span key={i}>{i ? ' › ' : ''}{i === parts.length - 1 ? <b>{p}</b> : p}</span>)}</div>;
}

// message passager (0.48.0-alpha.1) : erreur annoncée tout de suite (role=alert), action « Annuler » éventuelle
function ToastVue({ t, onFin }) {
  return (
    <div className={cx('toast', t.kind === 'bad' && 'bad')} role={t.kind === 'bad' ? 'alert' : 'status'} aria-live={t.kind === 'bad' ? 'assertive' : 'polite'} data-toast="">
      {t.msg}{t.action ? <button type="button" className="annuler-toast" onClick={() => { onFin(); t.action.fn(); }} data-toast-action="">{t.action.label}</button> : null}
    </div>
  );
}
