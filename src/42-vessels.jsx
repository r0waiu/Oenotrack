/* ============ CONTENANTS : couleurs, formes (cuve, fût, foudre, jarre, amphore, œuf, bombonne…), logo ============ */
const hex2rgb = (h) => { let m = String(h || '#999999').replace('#', ''); if (m.length === 3) m = m.split('').map((c) => c + c).join(''); m = m.padEnd(6, '0'); return [parseInt(m.slice(0, 2), 16) || 0, parseInt(m.slice(2, 4), 16) || 0, parseInt(m.slice(4, 6), 16) || 0]; };
const rgb2hex = (r) => `#${r.map((x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0')).join('')}`;
const mixHex = (pairs) => { const t = sum(pairs, (p) => p[1]) || 1; const a = [0, 0, 0]; pairs.forEach(([h, w]) => { const c = hex2rgb(h); for (let i = 0; i < 3; i++) a[i] += (c[i] * w) / t; }); return rgb2hex(a); };
const shade = (hex, f) => (f >= 0 ? mixHex([[hex, 1 - f], ['#ffffff', f]]) : mixHex([[hex, 1 + f], ['#000000', -f]]));
const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };

/* ---------- couleurs d'intérieur : par cépage, ou par assemblage de cépages (règle personnalisée, sinon mélange) ---------- */
function cepageColor(db, id) {
  const c = db.apparence.cepageColors[id]; const dflt = DEFAULT_APPARENCE().cepageColors[id];
  const th = typeof charteDef === 'function' ? charteDef(db.settings && db.settings.charte).cepages : null;
  if (c && (c !== dflt || !th || !th[id])) return c; if (th && th[id]) return th[id]; if (c) return c;
  const l = norm(lbl(db, 'cepages', id));
  return l.includes('chard') ? '#E6D58A' : l.includes('pinot') ? '#8E3A4B' : l.includes('meunier') ? '#C27D7A' : CEPAGE_FALLBACK[hashStr(String(id)) % CEPAGE_FALLBACK.length];
}
function compColorInfo(db, comp) {
  const ap = db.apparence; const ce = (comp && comp.cepages) || {};
  const ids = Object.keys(ce).filter((k) => ce[k] >= 0.03);
  if (!ids.length) return { color: ap.inconnuColor || '#B7BDB9', rule: null, ids };
  const key = [...ids].sort().join('|');
  const rule = (ap.melanges || []).find((m) => [...m.cepages].sort().join('|') === key);
  if (rule) return { color: rule.couleur, rule: rule.nom, ids };
  if (ids.length === 1) return { color: cepageColor(db, ids[0]), rule: null, ids };
  return { color: mixHex(ids.map((k) => [cepageColor(db, k), ce[k]])), rule: null, ids };
}
const compColor = (db, comp) => compColorInfo(db, comp).color;
const cepColor = (db, id) => cepageColor(db, id);
const MILL_COLORS = ['#6E8FB8', '#B8956E', '#8FB86E', '#B86E9A', '#6EB8AE', '#B8B06E'];

/* ---------- vue des contenants : un critère pour le contour, un pour la couleur de l'intérieur, un pour le motif ----------
   db.apparence.contourMode / interieurMode / interieurMotif ('' = pas de motif) ; couleurs et motifs personnalisables. */
const VUE_CRITERES = [
  { id: 'cepage', label: 'Cépages', comp: 'cepages' }, { id: 'fraction', label: 'Fractions', comp: 'fractions' }, { id: 'millesime', label: 'Millésimes', comp: 'millesimes' },
  { id: 'qualif', label: 'Revendication' }, { id: 'echelle', label: '', comp: 'echelles' }, { id: 'stade', label: 'Stade du vin' }, { id: 'couleur', label: 'Couleur du vin' }, { id: 'cru', label: 'Crus (villages)', comp: 'crus' },
];
const critLabel = (id) => (id === 'echelle' ? ECH.nom : (VUE_CRITERES.find((c) => c.id === id) || { label: id }).label);
const FRACTION_COULEURS = { cuvee: '#E8D48B', taille1: '#D7A85B', taille2: '#B97C3C', rebeche: '#8A5A2E', lies: '#7B6C58', bourbes: '#5C5245' };
const FRACTION_PALETTE = ['#E8D48B', '#D7A85B', '#B97C3C', '#8A5A2E', '#7B6C58', '#5C5245', '#9AA39B', '#6F8FB8'];
const MOTIFS = [['uni', 'Uni'], ['oblique', 'Hachures ╱'], ['oblique2', 'Hachures ╲'], ['croix', 'Croisillons'], ['points', 'Pointillés'], ['quadrillage', 'Quadrillage'], ['horizontal', 'Rayures horizontales'], ['vertical', 'Rayures verticales']];
const MOTIFS_FRACTION = { cuvee: 'uni', taille1: 'oblique', taille2: 'croix', rebeche: 'points', lies: 'horizontal', bourbes: 'vertical' };
const MOTIF_SUITE = ['uni', 'oblique', 'croix', 'points', 'oblique2', 'quadrillage', 'horizontal', 'vertical'];
const inconnu_ = (v) => v === '?' || v === 'inconnu' || v === '' || v == null;
// valeurs connues d'un critère, dans l'ordre de référence (listes, rang, millésime décroissant…)
function critOrdre(db, crit, R) {
  switch (crit) {
    case 'cepage': return db.lists.cepages.map((c) => c.id);
    case 'fraction': return fracList(db).map((x) => x.id);
    case 'qualif': return QUALIFS.map((q) => q.id);
    case 'echelle': return [...ECHELLES].reverse().map((e) => e.id);
    case 'stade': return stadeList(db).map((x) => x.id);
    case 'couleur': return couleurList(db).map((x) => x.id);
    case 'millesime': return uniq(Object.values((R || {}).lots || {}).map((l) => String(l.millesime || '')).flatMap((m) => m.split(' + ')).filter(Boolean)).sort().reverse();
    case 'cru': return db.crus.map((c) => c.id);
    default: return [];
  }
}
// répartition d'un lot pour un critère : { valeur: part } (le contour suit la revendication et le classement du lot lui-même)
function lotDistrib(db, R, lotId, crit, pourContour) {
  const L = R.lots[lotId] || {};
  if (crit === 'stade' || crit === 'couleur') return L[crit] ? { [L[crit]]: 1 } : {};
  if (crit === 'qualif') return L.qualif ? { [L.qualif]: 1 } : {};
  if (crit === 'echelle' && pourContour) return { [lotEchelle(db, R, lotId).id || 'inconnu']: 1 };
  const def = VUE_CRITERES.find((c) => c.id === crit); if (!def || !def.comp) return {};
  const d = composition(db, R, lotId)[def.comp] || {}; const out = {}; Object.keys(d).forEach((k) => { if (d[k] > 0.0005) out[k] = d[k]; }); return out;
}
function valColor(db, crit, v) {
  const ap = db.apparence; if (inconnu_(v) && crit !== 'echelle') return ap.inconnuColor || '#B7BDB9';
  switch (crit) {
    case 'cepage': return cepageColor(db, v);
    case 'fraction': { const c = (ap.fractionColors || {})[v]; if (c) return c; if (FRACTION_COULEURS[v]) return FRACTION_COULEURS[v]; const i = fracList(db).findIndex((x) => x.id === v); return FRACTION_PALETTE[(i >= 0 ? i : hashStr(String(v))) % FRACTION_PALETTE.length]; }
    case 'millesime': return (ap.millesimeColors || {})[v] || (/^\d{4}$/.test(v) ? MILL_COLORS[Number(v) % MILL_COLORS.length] : '#9AA39B');
    case 'qualif': return qColor(db, v);
    case 'echelle': return eColor(db, inconnu_(v) ? null : v);
    case 'stade': return stadeColor(db, v);
    case 'couleur': return couleurColor(db, v);
    case 'cru': return ORIGIN_COLORS[hashStr(String(v)) % ORIGIN_COLORS.length];
    default: return '#9AA39B';
  }
}
function valLabel(db, crit, v) {
  if (inconnu_(v)) return crit === 'echelle' ? 'Non classé' : 'Non renseigné';
  switch (crit) {
    case 'cepage': return String(lbl(db, 'cepages', v)).replace(/ \(.*$/, ''); case 'fraction': return fracLabel(db, v); case 'qualif': return qLabel(v);
    case 'echelle': return eLabel(v); case 'stade': return stadeLabel(db, v); case 'couleur': return couleurLabel(db, v); case 'cru': return cruName(db, v);
    default: return String(v);
  }
}
function motifDe(db, crit, v) {
  const m = ((db.apparence.motifs || {})[crit] || {})[v]; if (m && MOTIFS.some((x) => x[0] === m)) return m;
  if (crit === 'fraction' && MOTIFS_FRACTION[v]) return MOTIFS_FRACTION[v];
  if (inconnu_(v)) return 'quadrillage';
  const o = critOrdre(db, crit); const i = o.indexOf(v); return MOTIF_SUITE[(i >= 0 ? i : hashStr(String(v))) % MOTIF_SUITE.length];
}
// ordre d'affichage des valeurs d'une répartition : ordre de référence du critère, inconnues à la fin
const valeursOrdonnees = (db, crit, d, R) => { const o = critOrdre(db, crit, R); const rk = (v) => { const i = o.indexOf(v); return inconnu_(v) ? 1e6 : i >= 0 ? i : 1e5; }; return Object.keys(d).sort((a, b) => rk(a) - rk(b) || String(a).localeCompare(String(b))); };
// intérieur : couleur d'un lot selon le critère choisi (cépages : couleur d'assemblage ou mélange ; autres : mélange pondéré)
const lotColor = (db, R, lotId) => {
  const m = db.apparence.interieurMode || 'cepage';
  if (m === 'cepage') return compColor(db, composition(db, R, lotId));
  const d = lotDistrib(db, R, lotId, m); const ks = Object.keys(d);
  return ks.length ? (ks.length === 1 ? valColor(db, m, ks[0]) : mixHex(ks.map((k) => [valColor(db, m, k), d[k]]))) : (db.apparence.inconnuColor || '#B7BDB9');
};
// valeurs d'un critère présentes dans un ensemble de lots (légendes)
function valeursPresentes(db, R, lotIds, crit, pourContour) {
  const acc = {}; lotIds.forEach((id) => { const d = lotDistrib(db, R, id, crit, pourContour); Object.keys(d).forEach((k) => { if (d[k] >= 0.02) acc[k] = (acc[k] || 0) + d[k]; }); });
  return valeursOrdonnees(db, crit, acc, R);
}
const qColor = (db, id) => (((db && db.apparence) || {}).qualifColors || {})[id] || (qualifDef(db, id) || {}).couleur || '#7C8A84';
const eColor = (db, id) => { const e = id ? eDef(id) : null; return (e && e.couleur) || (id && (db.apparence.echelleColors || {})[id]) || '#8C9792'; };
const ORIGIN_COLORS = ['#3F7F6B', '#B5833A', '#7B5EA7', '#C0626B', '#4F86B8', '#8D9A3F', '#B0703D', '#5E8F9C'];
const originColor = (k, i) => (k === '?' || k === 'inconnu' ? '#B7BDB9' : ORIGIN_COLORS[i % ORIGIN_COLORS.length]);

// contour d'un contenant : revendication / classement (rang le plus bas d'abord) ou tout autre critère (part la plus grande d'abord)
function contourOf(db, R, cid) {
  const mode = db.apparence.contourMode || 'qualif'; if (mode === 'aucun') return { colors: [], mode, label: '' };
  const ps = contParts(R, cid); if (!ps.length) return { colors: [], mode, label: '' };
  const acc = {}; ps.forEach((p) => { const d = lotDistrib(db, R, p.lotId, mode, true); Object.keys(d).forEach((k) => { acc[k] = (acc[k] || 0) + d[k] * p.vol; }); });
  let ids = Object.keys(acc).filter((k) => acc[k] > 0);
  if (mode === 'qualif' || mode === 'echelle') { const rk = (id) => (mode === 'echelle' ? eRang(id) : rang(id)); ids.sort((a, b) => rk(a) - rk(b)); } else ids.sort((a, b) => acc[b] - acc[a]);
  return { colors: ids.map((i) => valColor(db, mode, i)), mode, label: ids.map((i) => valLabel(db, mode, i)).join(' + ') };
}

/* ---------- formes ---------- */
const VESSELS = {
  cuve: { vb: [80, 104], d: 'M18 14H62A8 8 0 0 1 70 22V80A8 8 0 0 1 62 88H18A8 8 0 0 1 10 80V22A8 8 0 0 1 18 14Z', y0: 14, y1: 88, o: 'v', hl: [15, 16, 5, 62],
    back: (c) => <g fill={c.ink} opacity=".6"><rect x="18" y="88" width="8" height="12" rx="1.5" /><rect x="54" y="88" width="8" height="12" rx="1.5" /><rect x="32" y="6" width="16" height="8" rx="2" opacity=".85" /></g>,
    front: (c) => <g stroke={c.ink} strokeOpacity=".22" strokeWidth="1"><line x1="10" x2="70" y1="36" y2="36" /><line x1="10" x2="70" y1="62" y2="62" /><circle cx="61" cy="79" r="3" fill={c.ink} fillOpacity=".4" /></g> },
  conique: { vb: [80, 104], d: 'M14 14H66L57 86Q56.5 88 54 88H26Q23.5 88 23 86Z', y0: 14, y1: 88, o: 'v', hl: [20, 14, 5, 60],
    back: (c) => <g fill={c.ink} opacity=".6"><rect x="24" y="88" width="7" height="12" rx="1.5" /><rect x="49" y="88" width="7" height="12" rx="1.5" /><rect x="32" y="6" width="16" height="8" rx="2" opacity=".85" /></g>,
    front: (c) => <g stroke={c.ink} strokeOpacity=".22" strokeWidth="1"><line x1="17" x2="63" y1="38" y2="38" /><line x1="21" x2="59" y1="62" y2="62" /></g> },
  citerne: { vb: [140, 80], d: 'M28 18H112A21 21 0 0 1 112 60H28A21 21 0 0 1 28 18Z', y0: 18, y1: 60, o: 'h', hl: [24, 22, 92, 4],
    back: (c) => <g fill={c.ink} opacity=".6"><rect x="34" y="60" width="14" height="12" rx="2" /><rect x="92" y="60" width="14" height="12" rx="2" /><rect x="62" y="10" width="16" height="8" rx="3" opacity=".85" /></g>,
    front: (c) => <g stroke={c.ink} strokeOpacity=".22" strokeWidth="1"><line x1="42" x2="42" y1="18" y2="60" /><line x1="98" x2="98" y1="18" y2="60" /><circle cx="127" cy="51" r="3" fill={c.ink} fillOpacity=".4" stroke="none" /></g> },
  fut: { vb: [104, 80], d: 'M10 26Q52 8 94 26V54Q52 72 10 54Z', y0: 17, y1: 63, o: 'h', hl: [18, 24, 68, 4],
    back: (c) => <g fill={c.ink} opacity=".55"><rect x="14" y="62" width="14" height="10" rx="2" /><rect x="76" y="62" width="14" height="10" rx="2" /><rect x="8" y="70" width="88" height="5" rx="2" /></g>,
    front: (c) => <g><g stroke={c.ink} strokeOpacity=".55" strokeWidth="3"><line x1="26" x2="26" y1="20.5" y2="59.5" /><line x1="78" x2="78" y1="20.5" y2="59.5" /></g><ellipse cx="52" cy="20" rx="4" ry="2" fill={c.ink} fillOpacity=".5" /></g> },
  foudre: { vb: [100, 108], d: 'M24 14Q10 53 24 92H76Q90 53 76 14Z', y0: 14, y1: 92, o: 'v', hl: [24, 18, 5, 70],
    back: (c) => <g fill={c.ink} opacity=".55"><rect x="12" y="92" width="76" height="9" rx="2" /><rect x="46" y="8" width="8" height="6" rx="1.5" opacity=".9" /></g>,
    front: (c) => <g><g stroke={c.ink} strokeOpacity=".55" strokeWidth="3"><line x1="19.5" x2="80.5" y1="30" y2="30" /><line x1="17.5" x2="82.5" y1="53" y2="53" /><line x1="19.5" x2="80.5" y1="76" y2="76" /></g><rect x="41" y="64" width="18" height="16" rx="3" fill={c.ink} fillOpacity=".28" stroke={c.ink} strokeOpacity=".5" strokeWidth="1" /><circle cx="55" cy="72" r="1.6" fill={c.ink} fillOpacity=".6" /></g> },
  jarre: { vb: [80, 96], d: 'M28 14H52V22C70 28 74 46 70 62C67 78 58 88 40 88C22 88 13 78 10 62C6 46 10 28 28 22Z', y0: 22, y1: 88, o: 'v', hl: [16, 32, 5, 40],
    back: (c) => <g fill={c.ink}><rect x="23" y="6" width="34" height="8" rx="4" opacity=".6" /><ellipse cx="40" cy="90" rx="22" ry="4" opacity=".16" /></g>,
    front: (c) => <g fill="none" stroke={c.ink} strokeOpacity=".25" strokeWidth="1.2"><path d="M12 42Q40 52 68 42" /><path d="M11 50Q40 60 69 50" /></g> },
  amphore: { vb: [76, 104], d: 'M30 10H46V24C66 30 70 54 56 74L46 90H30L20 74C6 54 10 30 30 24Z', y0: 24, y1: 90, o: 'v', hl: [18, 32, 5, 42],
    back: (c) => <g><g fill="none" stroke={c.ink} strokeOpacity=".7" strokeWidth="3.6" strokeLinecap="round"><path d="M30 14C13 14 11 30 21 37" /><path d="M46 14C63 14 65 30 55 37" /></g><g fill={c.ink}><rect x="26" y="4" width="24" height="7" rx="3.5" opacity=".6" /><path d="M26 90L21 100H55L50 90Z" opacity=".4" /></g></g>,
    front: (c) => <g fill="none" stroke={c.ink} strokeOpacity=".25" strokeWidth="1.2"><path d="M16 50Q38 58 60 50" /><path d="M22 66Q38 72 54 66" /></g> },
  oeuf: { vb: [80, 104], d: 'M40 8C58 8 72 40 72 62C72 82 58 94 40 94C22 94 8 82 8 62C8 40 22 8 40 8Z', y0: 8, y1: 94, o: 'v', hl: [16, 30, 5, 44],
    back: (c) => <g fill={c.ink}><path d="M20 92L14 102H66L60 92Z" opacity=".4" /><rect x="33" y="3" width="14" height="7" rx="3" opacity=".6" /></g>,
    front: (c) => <g fill="none" stroke={c.ink} strokeOpacity=".5" strokeWidth="1.4"><circle cx="40" cy="68" r="7" /><circle cx="40" cy="68" r="2.4" fill={c.ink} fillOpacity=".5" stroke="none" /></g> },
  bombonne: { vb: [70, 92], d: 'M28 10H42V22C42 28 62 34 62 56C62 78 50 86 35 86C20 86 8 78 8 56C8 34 28 28 28 22Z', y0: 22, y1: 86, o: 'v', hl: [14, 40, 5, 34],
    back: (c) => <g><g fill="none" stroke={c.ink} strokeOpacity=".6" strokeWidth="2.6" strokeLinecap="round"><path d="M28 16C19 16 19 27 27 29" /><path d="M42 16C51 16 51 27 43 29" /></g><rect x="26" y="4" width="18" height="7" rx="3" fill="#B98A5A" /></g>,
    front: () => null },
};
const formeLabel = (id) => (FORMES.find((f) => f.id === id) || { label: id }).label;

/* Dessin d'un contenant : forme (type), matière (couleur + finition), niveau par lot (couleur = cépages), contour (revendication / échelle) */
function ContainerSVG({ forme, matColor = '#B9C4CC', finition = 'lisse', bands = [], volMax = 1, contour = [], over, width = 80, empty }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const G = VESSELS[forme] || VESSELS.cuve; const [vw, vh] = G.vb; const H = G.y1 - G.y0;
  const c = { ink: 'var(--ink2)' };
  const pats = {}; // motifs utilisés : un <pattern> par motif et par encre (claire sur fond foncé, foncée sur fond clair)
  let acc = 0; const rects = bands.filter((b) => b.frac > 0).map((b, i) => {
    const f = clamp(Math.min(b.frac, 1 - acc), 0, 1); const y = G.y1 - (acc + f) * H; acc += f; const h = Math.max(0, f * H);
    const liq = <rect key={i} className="tankliq" x="0" y={y} width={vw} height={h} fill={b.color} opacity={finition === 'verre' ? 0.95 : 0.92} />;
    if (!b.motif || b.motif === 'uni') return liq;
    const ink = encreSur(b.color); const pid = `mt${id}${b.motif}${ink === '#ffffff' ? 'c' : 'f'}`; pats[pid] = { motif: b.motif, ink };
    return <Fragment key={i}>{liq}<rect x="0" y={y} width={vw} height={h} fill={`url(#${pid})`} /></Fragment>;
  });
  const top = G.y1 - acc * H;
  const [hx, hy, hw, hh] = G.hl;
  const lines = []; // finitions : motifs au-dessus du liquide, très discrets
  if (finition === 'bois') for (let t = 8; t < (G.o === 'v' ? vw : vh); t += 8) lines.push(G.o === 'v' ? <line key={t} x1={t} x2={t} y1="0" y2={vh} /> : <line key={t} x1="0" x2={vw} y1={t} y2={t} />);
  if (finition === 'terre') for (let t = G.y0 + 10; t < G.y1; t += 11) lines.push(<line key={t} x1="0" x2={vw} y1={t} y2={t} />);
  const patt = finition === 'mineral' || finition === 'terre';
  const dash = contour.length > 1;
  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} width={width} height={Math.round((width * vh) / vw)} aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <clipPath id={`cp${id}`}><path d={G.d} /></clipPath>
        <linearGradient id={`gr${id}`} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor={shade(matColor, 0.3)} /><stop offset="0.45" stopColor={matColor} /><stop offset="1" stopColor={shade(matColor, -0.28)} /></linearGradient>
        <pattern id={`pt${id}`} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1.6" cy="2" r=".8" fill="#000" opacity=".28" /><circle cx="5.2" cy="5" r=".7" fill="#fff" opacity=".35" /><circle cx="4.4" cy="1" r=".5" fill="#000" opacity=".2" /></pattern>
        {Object.keys(pats).map((pid) => <MotifPattern key={pid} id={pid} motif={pats[pid].motif} ink={pats[pid].ink} />)}
      </defs>
      {G.back(c)}
      <path d={G.d} fill={`url(#gr${id})`} opacity={finition === 'verre' ? 0.55 : 1} />
      <g clipPath={`url(#cp${id})`}>
        {rects}
        {acc > 0 ? <line x1="0" x2={vw} y1={top} y2={top} stroke="#fff" strokeOpacity=".4" strokeWidth="1.4" /> : null}
        {patt ? <rect x="0" y="0" width={vw} height={vh} fill={`url(#pt${id})`} opacity={finition === 'terre' ? 0.7 : 0.55} /> : null}
        {lines.length ? <g stroke={finition === 'bois' ? '#2b1a0a' : '#000'} strokeOpacity={finition === 'bois' ? 0.3 : 0.14} strokeWidth="0.9">{lines}</g> : null}
        {finition === 'metal' ? <g fill="#fff"><rect x={hx + 14} y={G.y0} width={G.o === 'v' ? 3 : vw} height={G.o === 'v' ? H : 3} opacity=".16" /></g> : null}
        <rect x={hx} y={hy} width={hw} height={hh} rx={Math.min(hw, hh) / 2} fill="#fff" opacity={finition === 'email' ? 0.42 : finition === 'verre' ? 0.38 : 0.2} />
        {finition === 'verre' || finition === 'email' ? <path d={G.d} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="2" /> : null}
      </g>
      {G.front(c)}
      <path d={G.d} fill="none" stroke={contour.length ? contour[0] : 'var(--ink2)'} strokeWidth={contour.length ? 3.4 : 1.4} strokeLinejoin="round" />
      {dash ? <path d={G.d} fill="none" stroke={contour[1]} strokeWidth="3.4" strokeDasharray="7 7" strokeLinejoin="round" /> : null}
      {over ? <path d={`M${vw - 10} 1 L${vw - 2} 15 L${vw - 18} 15 Z`} fill="var(--bad)" /> : null}
      {empty ? <text x={vw / 2} y={(G.y0 + G.y1) / 2 + 3} textAnchor="middle" fontSize="9" fill="var(--ink2)" opacity=".85">vide</text> : null}
    </svg>
  );
}

// encre d'un motif : claire sur une couleur foncée, foncée sur une couleur claire
const encreSur = (hex) => { const [r, g, b] = hex2rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5 ? '#ffffff' : '#000000'; };
function MotifPattern({ id, motif, ink, taille = 6 }) {
  const t = taille; const o = ink === '#ffffff' ? 0.8 : 0.55; const S = { stroke: ink, strokeOpacity: o, strokeWidth: t / 5.2, fill: 'none', strokeLinecap: 'square' };
  const d1 = `M${-t / 6},${t / 6} l${t / 3},${-t / 3} M0,${t} l${t},${-t} M${t - t / 6},${t + t / 6} l${t / 3},${-t / 3}`; const d2 = `M${-t / 6},${t - t / 6} l${t / 3},${t / 3} M0,0 l${t},${t} M${t - t / 6},${-t / 6} l${t / 3},${t / 3}`;
  return (
    <pattern id={id} width={t} height={t} patternUnits="userSpaceOnUse">
      {motif === 'oblique' ? <path d={d1} {...S} /> : motif === 'oblique2' ? <path d={d2} {...S} /> : motif === 'croix' ? <path d={`${d1} ${d2}`} {...S} />
        : motif === 'points' ? <circle cx={t / 2} cy={t / 2} r={t / 5} fill={ink} fillOpacity={o} />
          : motif === 'quadrillage' ? <path d={`M0,${t / 2} H${t} M${t / 2},0 V${t}`} {...S} strokeWidth={t / 7} />
            : motif === 'horizontal' ? <path d={`M0,${t / 2} H${t}`} {...S} /> : motif === 'vertical' ? <path d={`M${t / 2},0 V${t}`} {...S} /> : null}
    </pattern>
  );
}
// pastille de légende : couleur, avec motif éventuel
function MotifSwatch({ color = '#D9D2C3', motif, size = 14, ring }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, ''); const ink = encreSur(color);
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true" style={{ display: 'inline-block', verticalAlign: '-2px', flex: 'none' }}>
      {motif && motif !== 'uni' ? <defs><MotifPattern id={`sw${id}`} motif={motif} ink={ink} taille={4.5} /></defs> : null}
      {ring ? <rect x="1.5" y="1.5" width="11" height="11" rx="3" fill="none" stroke={color} strokeWidth="3" />
        : <><rect x="1" y="1" width="12" height="12" rx="3" fill={color} stroke="#00000030" />{motif && motif !== 'uni' ? <rect x="1" y="1" width="12" height="12" rx="3" fill={`url(#sw${id})`} /> : null}</>}
    </svg>
  );
}
// bandes de l'intérieur : une par portion (couleur du lot) ; avec un critère de motif, la portion est partagée selon ce critère
function bandesDe(db, R, c) {
  const ps = contParts(R, c.id).sort((a, b) => (a.since < b.since ? -1 : 1)); const mc = db.apparence.interieurMotif || ''; const out = [];
  ps.forEach((p) => {
    const color = lotColor(db, R, p.lotId); const frac = p.vol / c.volMax;
    if (!mc) { out.push({ frac, color }); return; }
    const d = lotDistrib(db, R, p.lotId, mc); const vals = valeursOrdonnees(db, mc, d, R); const tot = sum(vals, (v) => d[v]) || 1;
    if (!vals.length) { out.push({ frac, color, motif: 'quadrillage' }); return; }
    [...vals].reverse().forEach((v) => out.push({ frac: (frac * d[v]) / tot, color, motif: motifDe(db, mc, v) })); // 1re valeur (ex. cuvée) en haut de la portion
  });
  return out;
}
// Contenant tel qu'il apparaît dans la base (type → forme, matière → couleur/finition, lots → intérieur (couleur + motif), critère choisi → contour)
function ContainerGlyph({ db, R, c, width }) {
  const ps = contParts(R, c.id); const mat = matOf(db, c); const t = tileSize(db, c);
  const bands = bandesDe(db, R, c);
  return <ContainerSVG forme={formeOf(db, c)} matColor={mat.couleur} finition={mat.finition} volMax={c.volMax} bands={bands} contour={contourOf(db, R, c.id).colors} over={!!R.capOver[c.id]} width={width || t.sw} empty={!ps.length} />;
}

/* ---------- logo Œnotrack : un « Œ » dont le O est un contenant rempli de vin (bulles), le E trois niveaux de jauge ---------- */
function Logo({ size = 40 }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Œnotrack" style={{ display: 'block', flex: 'none' }}>
      <defs>
        <linearGradient id={`lb${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: 'var(--logo1, #1F6048)' }} /><stop offset="1" style={{ stopColor: 'var(--logo2, #0E2A21)' }} /></linearGradient>
        <linearGradient id={`lg${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: 'var(--logoG1, #F4DB93)' }} /><stop offset="1" style={{ stopColor: 'var(--logoG2, #C8952B)' }} /></linearGradient>
        <clipPath id={`lc${id}`}><circle cx="25" cy="34" r="11.6" /></clipPath>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#lb${id})`} />
      <circle cx="25" cy="34" r="14" fill="none" stroke={`url(#lg${id})`} strokeWidth="4.6" />
      <g clipPath={`url(#lc${id})`}><path d="M8 35Q16 31 24 35T40 35V52H8Z" fill={`url(#lg${id})`} /></g>
      <circle cx="21" cy="30.5" r="1.6" style={{ fill: 'var(--logoDot, #FFF6D9)' }} /><circle cx="28" cy="27" r="1.1" style={{ fill: 'var(--logoDot, #FFF6D9)' }} opacity=".85" />
      <path d="M39.6 22H55M40.4 34H51M39.6 46H55" stroke={`url(#lg${id})`} strokeWidth="4.6" strokeLinecap="round" />
      <circle cx="46" cy="12" r="1.6" style={{ fill: 'var(--logoG1, #F4DB93)' }} opacity=".9" /><circle cx="51" cy="8" r="2.2" style={{ fill: 'var(--logoG1, #F4DB93)' }} opacity=".8" /><circle cx="57" cy="5.4" r="1.2" style={{ fill: 'var(--logoG1, #F4DB93)' }} opacity=".6" />
    </svg>
  );
}
const Brand = ({ size = 40, sub = true }) => (
  <div className="flex min-w-0 items-center gap-3"><Logo size={size} /><div className="min-w-0"><div className="brand"><span>Œno</span><em>track</em></div>{sub ? <div className="brand-sub">Traçabilité de cuverie &amp; de chai</div> : null}</div></div>
);
