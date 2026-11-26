/* ============ FICHES PERSONNALISABLES, FERMENTATION, SO₂ ET ENRICHISSEMENT (0.29.0-alpha.1) ============ */

// ajustement personnel sans identifiants : gardé sur cet appareil
const fichePersoLocal = () => { try { const x = JSON.parse(window.localStorage.getItem(FICHE_PERSO_KEY) || 'null'); return x && typeof x === 'object' ? x : {}; } catch (e) { return {}; } };
const fichePersoLocalSet = (kind, cfg) => { const x = fichePersoLocal(); if (cfg) x[kind] = cfg; else delete x[kind]; try { window.localStorage.setItem(FICHE_PERSO_KEY, JSON.stringify(x)); } catch (e) { /* stockage indisponible */ } try { window.dispatchEvent(new Event('oenotrack-fiches')); } catch (e) { /* ignoré */ } };
function useFicheDispo(kind) {
  const { db, uid, secu } = useApp(); const [, setN] = useState(0);
  useEffect(() => { const f = () => setN((x) => x + 1); window.addEventListener('oenotrack-fiches', f); return () => window.removeEventListener('oenotrack-fiches', f); }, []);
  const commun = (((db.settings || {}).fichesRubriques) || {})[kind] || null;
  const u = secu && uid ? utilisateurDe(db, uid) : null;
  const perso = u ? (((u.fichesRubriques || {})[kind]) || null) : (fichePersoLocal()[kind] || null);
  return { dispo: ficheDispo(kind, commun, perso), commun, perso };
}
// rubriques dans l'ordre choisi ; deux rubriques « jumelles » qui se suivent (hygiène et analyses) partagent une rangée
function RubriquesRendu({ dispo, blocs, paires }) {
  const vis = dispo.filter((r) => r.visible && blocs[r.id]); const out = []; const P = paires || [];
  for (let i = 0; i < vis.length; i += 1) {
    const a = vis[i].id; const b = vis[i + 1] && vis[i + 1].id;
    if (b && P.some((p) => (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a))) { out.push(<div key={`${a}+${b}`} className="grid2 mb-5" data-rubrique={`${a} ${b}`}><div data-rubrique={a}>{blocs[a]}</div><div data-rubrique={b}>{blocs[b]}</div></div>); i += 1; continue; }
    out.push(<div key={a} data-rubrique={a}>{blocs[a]}</div>);
  }
  return out;
}
function FicheRubriquesSheet({ kind, onClose }) {
  const { db, act, uid, secu, niveau, toast } = useApp(); const { commun, perso } = useFicheDispo(kind);
  const peutCommun = !secu || niveau('params') === 'ecriture';
  const [portee, setPortee] = useState('moi');
  const depart = (p) => (p === 'equipe' ? ficheDispo(kind, commun) : ficheDispo(kind, commun, perso));
  const [items, setItems] = useState(() => depart('moi'));
  const choisir = (p) => { setPortee(p); setItems(depart(p)); };
  const bouger = (i, d) => { const j = i + d; if (j < 0 || j >= items.length) return; const L = items.slice(); [L[i], L[j]] = [L[j], L[i]]; setItems(L); };
  const basculer = (i) => setItems(items.map((x, k) => (k === i ? { ...x, visible: !x.visible } : x)));
  const titre = kind === 'cont' ? 'fiche du contenant' : 'fiche du lot';
  const enregistrer = () => {
    if (portee === 'equipe') { const r = act((d) => ficheReglageCommunSet(d, kind, ficheDispoReglage(kind, items, commun)), 'Disposition commune enregistrée : elle s’applique à toute l’équipe (sauf ajustement personnel).'); if (r && r.ok) onClose(); return; }
    const cfg = ficheDispoReglage(kind, items, perso);
    if (secu && uid) { const r = act((d) => ficheReglagePersoSet(d, uid, kind, cfg), 'Votre disposition est enregistrée sur votre compte.'); if (r && r.ok) onClose(); return; }
    fichePersoLocalSet(kind, cfg); toast('Votre disposition est enregistrée sur cet appareil.'); onClose();
  };
  const revenir = () => {
    if (portee === 'equipe') { const r = act((d) => ficheReglageCommunSet(d, kind, null), 'Disposition commune remise à l’origine.'); if (r && r.ok) onClose(); return; }
    if (secu && uid) { const r = act((d) => ficheReglagePersoSet(d, uid, kind, null), 'Vous retrouvez la disposition commune.'); if (r && r.ok) onClose(); return; }
    fichePersoLocalSet(kind, null); toast('Vous retrouvez la disposition commune.'); onClose();
  };
  return (
    <Sheet title="Personnaliser la fiche" sub={titre} onClose={onClose}
      footer={<><Btn onClick={revenir} className="mr-auto" disabled={portee === 'equipe' ? !commun : !perso}>{portee === 'equipe' ? 'Rétablir la disposition d’origine' : 'Revenir à la disposition commune'}</Btn><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" onClick={enregistrer}>{portee === 'equipe' ? 'Enregistrer pour toute l’équipe' : 'Enregistrer pour moi'}</Btn></>}>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Pour qui">
        <Btn size="sm" kind={portee === 'moi' ? 'primary' : undefined} aria-pressed={portee === 'moi'} onClick={() => choisir('moi')}>Pour moi</Btn>
        <Btn size="sm" kind={portee === 'equipe' ? 'primary' : undefined} aria-pressed={portee === 'equipe'} disabled={!peutCommun} onClick={() => choisir('equipe')} title={peutCommun ? '' : 'Réglage commun : droit de modifier les paramètres nécessaire'}>Pour toute l’équipe (réglage commun)</Btn>
      </div>
      <p className="help mb-3">{portee === 'equipe' ? 'La disposition commune s’applique à tous ceux qui n’ont pas fait leur propre ajustement.' : secu && uid ? 'Votre ajustement suit votre compte sur tous vos appareils ; les autres gardent la disposition commune.' : 'Votre ajustement est gardé sur cet appareil ; la disposition commune reste celle de l’équipe.'}</p>
      <ol className="rub-liste" aria-label="Rubriques de la fiche">
        {items.map((x, i) => (
          <li key={x.id} className={cx('rub-item', !x.visible && 'off')} data-rub={x.id}>
            <Check checked={x.visible} onChange={() => basculer(i)} label={x.label} />
            <span className="ml-auto flex gap-1"><Btn size="sm" onClick={() => bouger(i, -1)} disabled={i === 0} aria-label={`Monter « ${x.label} »`}>↑</Btn><Btn size="sm" onClick={() => bouger(i, 1)} disabled={i === items.length - 1} aria-label={`Descendre « ${x.label} »`}>↓</Btn></span>
          </li>))}
      </ol>
      <p className="help mt-2">L’en-tête (contenu, stade, revendication…) reste toujours en haut de la fiche.</p>
    </Sheet>
  );
}

/* ---------- courbe de fermentation (SVG) ---------- */
const COURBE_COUL = ['var(--accent)', '#C2577A', '#2E6F9E', '#6A4C9C', '#2C7C78', '#8A6A3B'];
function CourbeFermentation({ points, parCuve }) {
  const { db } = useApp(); const lg = useLangue(); // infobulles des points : données (jamais traduites) + « analyse » traduit ici
  const series = useMemo(() => { const g = {}; points.forEach((p) => { const k = parCuve ? (p.contId || '-') : '-'; (g[k] = g[k] || []).push(p); }); return Object.keys(g).map((k, i) => ({ k, nom: k === '-' ? '' : contName(db, k), pts: g[k], c: COURBE_COUL[i % COURBE_COUL.length] })); }, [points, parCuve]);
  const W = 640; const H = 230; const mg = { g: 52, d: 44, h: 12, b: 30 };
  const jour0 = points[0].date; const xj = (p, i, arr) => { const j = joursEntre(jour0, p.date); const meme = arr.filter((q) => q.date === p.date); const k = meme.indexOf(p); return j + (meme.length > 1 ? (k / meme.length) * 0.8 : 0); };
  const xs = points.map((p, i) => xj(p, i, points)); const xmax = Math.max(1, ...xs);
  const ds = points.filter((p) => p.densite != null).map((p) => p.densite); const ts = points.filter((p) => p.temp != null).map((p) => p.temp);
  const dmin0 = ds.length ? Math.min(...ds) : 0.99; const dmax0 = ds.length ? Math.max(...ds) : 1.1; const dpad = Math.max(0.002, (dmax0 - dmin0) * 0.08);
  const dmin = dmin0 - dpad; const dmax = dmax0 + dpad; const tmin = ts.length ? Math.floor(Math.min(...ts) - 1) : 10; const tmax = ts.length ? Math.ceil(Math.max(...ts) + 1) : 25;
  const X = (x) => mg.g + (x / xmax) * (W - mg.g - mg.d); const YD = (d) => mg.h + ((dmax - d) / (dmax - dmin)) * (H - mg.h - mg.b); const YT = (t) => mg.h + ((tmax - t) / Math.max(1, tmax - tmin)) * (H - mg.h - mg.b);
  const pasD = (dmax - dmin) > 0.06 ? 0.02 : (dmax - dmin) > 0.025 ? 0.01 : 0.005; const ticksD = []; for (let d = Math.ceil(dmin / pasD) * pasD; d <= dmax + 1e-9; d += pasD) ticksD.push(+d.toFixed(4));
  const pasT = tmax - tmin > 12 ? 5 : 2; const ticksT = []; for (let t = Math.ceil(tmin / pasT) * pasT; t <= tmax; t += pasT) ticksT.push(t);
  const nbX = Math.min(6, Math.floor(xmax) + 1); const ticksX = uniq(Array.from({ length: nbX }, (_, i) => Math.round((i * xmax) / Math.max(1, nbX - 1))));
  const dateDe = (j) => fmtDate(addDays(jour0, j)).slice(0, 5);
  const idx = new Map(points.map((p, i) => [p, xs[i]]));
  const ligne = (pts, f, y) => pts.filter((p) => p[f] != null).map((p) => `${X(idx.get(p)).toFixed(1)},${y(p[f]).toFixed(1)}`).join(' ');
  const etiquette = (p) => `${fmtDate(p.date)}${p.densite != null ? ` · ${fmt(p.densite, 3)}` : ''}${p.temp != null ? ` · ${fmt(p.temp, 1)} °C` : ''}${p.contId ? ` · ${contName(db, p.contId)}` : ''}${p.src === 'analyse' ? ` · ${traduire('analyse', lg)}` : ''}`;
  return (
    <div className="courbe" data-courbe="">
      <svg viewBox={`0 0 ${W} ${H}`} className="courbe-svg" role="img" aria-label="Courbe de densité et de température" preserveAspectRatio="xMidYMid meet">
        {ticksD.map((d) => <g key={`d${d}`}><line x1={mg.g} x2={W - mg.d} y1={YD(d)} y2={YD(d)} className="courbe-grille" /><text x={mg.g - 6} y={YD(d) + 4} textAnchor="end" className="courbe-axe">{fmt(d, 3)}</text></g>)}
        {ts.length ? ticksT.map((t) => <text key={`t${t}`} x={W - mg.d + 6} y={YT(t) + 4} className="courbe-axe courbe-axe-t">{t}°</text>) : null}
        {ticksX.map((j) => <text key={`x${j}`} x={X(j)} y={H - 10} textAnchor="middle" className="courbe-axe">{dateDe(j)}</text>)}
        {series.map((s) => <g key={s.k}>
          {s.pts.some((p) => p.temp != null) ? <polyline points={ligne(s.pts, 'temp', YT)} fill="none" stroke={s.c} strokeWidth="1.6" strokeDasharray="5 4" opacity="0.75" /> : null}
          {s.pts.some((p) => p.densite != null) ? <polyline points={ligne(s.pts, 'densite', YD)} fill="none" stroke={s.c} strokeWidth="2.4" /> : null}
          {s.pts.map((p, i) => <g key={i}>{p.densite != null ? <circle cx={X(idx.get(p))} cy={YD(p.densite)} r="3.6" fill={s.c}><title translate="no">{etiquette(p)}</title></circle> : null}{p.temp != null ? <rect x={X(idx.get(p)) - 2.6} y={YT(p.temp) - 2.6} width="5.2" height="5.2" fill="var(--surface)" stroke={s.c} strokeWidth="1.4"><title translate="no">{etiquette(p)}</title></rect> : null}</g>)}
        </g>)}
      </svg>
      <div className="courbe-leg text-xs text-ink2"><span><i className="courbe-l" /> <span>Densité</span></span>{ts.length ? <span><i className="courbe-l courbe-l-t" /> <span>Température (°C)</span></span> : null}{series.length > 1 ? series.map((s) => <span key={s.k} translate="no"><i className="swatch" style={{ background: s.c }} /> {s.nom}</span>) : null}</div>
    </div>
  );
}
const pts1000 = (v) => { const x = num(v) * 1000; return fmt(x, Math.abs(x) < 1 ? 2 : 1); }; // vitesse en points de densité (millièmes) par jour
const ETAT_FERM = { active: 'fermentation active', lente: 'fermentation lente', arretee: 'fermentation arrêtée', finie: 'densité de fin atteinte' };
// rubrique « Fermentation » : courbe, vitesse et alerte (lot en FA)
function FermentationSection({ contId, lotId }) {
  const { db, R, openOp, camp } = useApp();
  const lots = lotId ? [lotId] : uniq(contParts(R, contId).map((p) => p.lotId));
  const pts = useMemo(() => fermentationPoints(db, R, { lotIds: lots, contId: lotId ? null : contId }), [db, R, contId, lotId]);
  const fa = lots.filter((id) => R.lots[id] && enFA(db, R.lots[id].stade));
  if (!pts.length && !fa.length) return null;
  const reg = fermReglages(db); const etat = fermentationEtat(pts.filter((p) => !fa.length || fa.includes(p.lotId)), reg, todayISO());
  const al = fermentationAlerte(db, R, { contId, lotId }, todayISO());
  const portion = Object.values(R.portions).find((p) => (lotId ? p.lotId === lotId : p.contenantId === contId && fa.includes(p.lotId)) && p.vol > 0);
  return (
    <Sec title="Fermentation" className="mb-5" right={!camp.figee ? <Btn size="sm" onClick={() => openOp('suivi', portion ? { portionId: portion.id } : {})}>+ Relevé densité / T°</Btn> : null}>
      {al ? <div className="mb-2" data-alerte-ferm={al.etat}><Notice tone={al.etat === 'arretee' ? 'bad' : 'warn'} title={al.etat === 'arretee' ? 'Fermentation arrêtée ?' : 'Fermentation lente'}><span>Baisse de densité : </span><b className="num">{pts1000(al.vitesse)}</b><span> point(s) par jour sur les </span><span className="num">{al.jours}</span><span> dernier(s) jour(s) ; seuil d’alerte : </span><span className="num">{pts1000(al.etat === 'arretee' ? reg.arret : reg.lente)}</span><span>. Vérifiez la température, l’azote assimilable et l’aération ; voyez avec votre œnologue.</span></Notice></div> : null}
      {etat && !al && fa.length ? <div className="mb-2 flex flex-wrap items-center gap-2 text-sm"><Chip tone={etat.etat === 'active' ? 'ok' : etat.etat === 'finie' ? 'info' : ''}>{ETAT_FERM[etat.etat]}</Chip>{etat.vitesse != null ? <span className="text-ink2"><span>baisse de </span><span className="num">{pts1000(etat.vitesse)}</span><span> point(s) de densité par jour</span></span> : null}</div> : null}
      {etat && etat.ancien && fa.length ? <div className="mb-2"><Chip tone="warn">dernier relevé il y a {etat.age} jours</Chip></div> : null}
      {pts.length ? <CourbeFermentation points={pts} parCuve={!!lotId} /> : <Empty>Aucun relevé de densité ou de température pour l’instant : « + Relevé densité / T° », ou la saisie groupée depuis la cuverie.</Empty>}
    </Sec>
  );
}

/* ---------- calculs : SO₂ moléculaire et enrichissement ---------- */
// dernière valeur analysée d'un paramètre pour les lots donnés
const derniereValeur = (db, lotIds, pid) => { const L = (db.analyses || []).filter((a) => lotIds.includes(a.lotId) && a.valeurs && hasNum(a.valeurs[pid])).sort((a, b) => (a.date < b.date ? 1 : -1)); return L.length ? { v: num(L[0].valeurs[pid]), date: L[0].date } : null; };
const SO2_CIBLE_KEY = 'oenotrack-so2-cible';
function CalculsSheet({ contId, lotId, onglet, onClose }) {
  const { db, R, openOp, camp } = useApp();
  const parts = contId ? contParts(R, contId).filter((p) => p.vol > 0) : Object.values(R.portions).filter((p) => p.lotId === lotId && p.vol > 0).map((p) => ({ lotId: p.lotId, vol: p.vol, portionId: p.id }));
  const lots = uniq(parts.map((p) => p.lotId).concat(lotId ? [lotId] : [])); const vol = sum(parts, (p) => p.vol);
  const portion = parts[0] ? parts[0].portionId : '';
  const [tab, setTab] = useState(onglet || 'so2');
  const val = (pid) => { const x = derniereValeur(db, lots, pid); return x ? String(x.v).replace('.', ',') : ''; };
  const [s, setS] = useState(() => { let cible = '0,6'; try { cible = window.localStorage.getItem(SO2_CIBLE_KEY) || cible; } catch (e) { /* ignoré */ } return { libre: val('so2l'), ph: val('ph'), temp: val('temp') || '20', tav: val('tap') || '11', cible }; });
  const so2 = so2Moleculaire({ libre: s.libre, ph: s.ph, tav: s.tav, temp: s.temp }); const besoin = so2LibrePour({ cible: s.cible, ph: s.ph, tav: s.tav, temp: s.temp });
  useEffect(() => { try { window.localStorage.setItem(SO2_CIBLE_KEY, s.cible); } catch (e) { /* ignoré */ } }, [s.cible]);
  const g = chaptalReglages(db);
  const tap0 = (() => { const m = contId ? moyennesPonderees(moutAnalysesCuve(db, R, contId)) : moyennesPonderees(moutAnalysesLot(db, lotId)); const t = tapMoyen(db, m); if (t != null) return String(r2(t)).replace('.', ','); const x = derniereValeur(db, lots, 'tap'); return x ? String(x.v).replace('.', ',') : ''; })();
  const [e, setE] = useState({ volHL: vol ? String(r2(vol / 100)).replace('.', ',') : '', tap: tap0, tav: String(g.tav).replace('.', ','), methode: 'sucre', sucreMCR: '850', produitId: '' });
  const en = enrichSimuler(db, { volL: num(e.volHL) * 100, tap: e.tap, tav: e.tav, methode: e.methode, sucreMCR: e.sucreMCR });
  const prods = db.produits.filter((p) => p.actif !== false && ['oeno', 'aux'].includes(p.categorie)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const pr = e.produitId ? prodOf(db, e.produitId) : null;
  const qteProduit = () => { if (!en || !pr) return ''; const kg = en.methode === 'mcr' ? null : en.sucreKg; const l = en.methode === 'mcr' ? en.mcrL : null; if (kg != null) return pr.unite === 'kg' ? r3(kg) : pr.unite === 'g' ? Math.round(kg * 1000) : ''; if (l != null) return pr.unite === 'L' ? r3(l) : pr.unite === 'mL' ? Math.round(l * 1000) : pr.unite === 'kg' ? r3(en.sucreKg) : ''; return ''; };
  const preparer = () => {
    const q = qteProduit(); const lignes = pr ? [{ produitId: pr.id, arrivageId: '', qty: q === '' ? '' : String(q) }] : [];
    openOp('enrichissement', { portionId: portion, ...(lignes.length ? { lignes } : {}), enrichissement: { tap: num(e.tap), tav: num(e.tav), methode: en.methode, ...(en.methode === 'mcr' ? { sucreMCR: en.sucreMCR, mcrL: r3(en.mcrL) } : {}), sucreKg: r3(en.sucreKg), volL: Math.round(en.volL) } }); onClose();
  };
  const titre = contId ? contName(db, contId) : lotCode(db, R, lotId);
  return (
    <Sheet title="Calculs" sub={titre} onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Fermer</Btn>}>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Calcul">
        <Btn size="sm" role="tab" aria-selected={tab === 'so2'} kind={tab === 'so2' ? 'primary' : undefined} onClick={() => setTab('so2')}>🧪 SO₂ moléculaire</Btn>
        <Btn size="sm" role="tab" aria-selected={tab === 'enrich'} kind={tab === 'enrich' ? 'primary' : undefined} onClick={() => setTab('enrich')}>⬆ Enrichissement</Btn>
      </div>
      {tab === 'so2' ? <div className="space-y-3" data-calcul="so2">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
          <Field label="SO₂ libre (mg/L)"><NI value={s.libre} onChange={(v) => setS({ ...s, libre: v })} placeholder="ex. 25" /></Field>
          <Field label="pH"><NI value={s.ph} onChange={(v) => setS({ ...s, ph: v })} placeholder="ex. 3,15" /></Field>
          <Field label="Température (°C)"><NI value={s.temp} onChange={(v) => setS({ ...s, temp: v })} /></Field>
          <Field label="Alcool (% vol)"><NI value={s.tav} onChange={(v) => setS({ ...s, tav: v })} /></Field>
        </div>
        {so2 ? <div className="card p-3" data-so2-resultat=""><div className="lbl mb-0">SO₂ moléculaire (actif)</div><div className="disp text-2xl"><span className="num">{fmt(so2.moleculaire, 2)}</span> <span>mg/L</span></div><div className="text-sm text-ink2"><span>soit </span><span className="num">{fmt(so2.part * 100, 1)} %</span><span> du SO₂ libre · pKa estimé </span><span className="num">{fmt(so2.pka, 2)}</span></div></div> : <Empty>Indiquez le SO₂ libre et le pH.</Empty>}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <Field label="SO₂ moléculaire visé (mg/L)" help="Repère courant : 0,5 à 0,8 mg/L selon le vin ; à décider avec votre œnologue."><NI value={s.cible} onChange={(v) => setS({ ...s, cible: v })} /></Field>
          {besoin != null ? <div className="card p-3" data-so2-besoin=""><div className="lbl mb-0">SO₂ libre nécessaire</div><div className="disp text-xl"><span className="num">{fmt(besoin, 0)}</span> <span>mg/L</span></div>{hasNum(s.libre) ? <div className="text-sm text-ink2">{besoin > num(s.libre) ? <><span>soit + </span><span className="num">{fmt(besoin - num(s.libre), 0)}</span><span> mg/L de SO₂ libre (une partie de l’ajout se combine)</span></> : <span>le SO₂ libre mesuré suffit</span>}</div> : null}</div> : null}
        </div>
        <p className="help">Estimation : SO₂ moléculaire = SO₂ libre ÷ (1 + 10^(pH − pKa)), pKa ≈ 1,81 dans l’eau à 20 °C, un peu plus élevé avec l’alcool et la température. Valeurs indicatives, à confirmer par votre laboratoire.</p>
        {portion && !camp.figee ? <Btn onClick={() => { openOp('sulfitage', { portionId: portion }); onClose(); }}>Préparer le sulfitage…</Btn> : null}
      </div> : <div className="space-y-3" data-calcul="enrichissement">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
          <Field label="Volume (hL)"><NI value={e.volHL} onChange={(v) => setE({ ...e, volHL: v })} /></Field>
          <Field label="TAP actuel (% vol)" help={tap0 ? 'D’après les analyses d’entrée du moût.' : ''}><NI value={e.tap} onChange={(v) => setE({ ...e, tap: v })} placeholder="ex. 9,5" /></Field>
          <Field label="TAV visé (% vol)"><NI value={e.tav} onChange={(v) => setE({ ...e, tav: v })} /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Méthode">
          <Btn size="sm" kind={e.methode === 'sucre' ? 'primary' : undefined} aria-pressed={e.methode === 'sucre'} onClick={() => setE({ ...e, methode: 'sucre' })}>Sucre (saccharose)</Btn>
          <Btn size="sm" kind={e.methode === 'mcr' ? 'primary' : undefined} aria-pressed={e.methode === 'mcr'} onClick={() => setE({ ...e, methode: 'mcr' })}>MCR (moût concentré rectifié)</Btn>
          {e.methode === 'mcr' ? <div className="w-48"><Field label="Sucres du MCR (g/L)" help="Voir la fiche du produit."><NI value={e.sucreMCR} onChange={(v) => setE({ ...e, sucreMCR: v })} /></Field></div> : null}
        </div>
        {en ? <div className="card space-y-1 p-3" data-enrich-resultat="">
          <div className="text-sm"><span>Écart : </span><b className="num">+{fmt(en.ecart, 2)}</b><span> % vol · </span><span className="num">{fmt(en.coef)}</span><span> g/L de sucre par % vol</span></div>
          {en.impossible ? <Notice tone="bad" title="Calcul impossible">La teneur en sucres du MCR est trop faible pour atteindre ce TAV.</Notice>
            : en.methode === 'mcr' ? <div className="disp text-xl"><span className="num">{fmt(en.mcrL, 1)}</span> <span>L de MCR</span> <span className="text-sm text-ink2">(<span className="num">{fmt(en.sucreKg, 1)}</span> kg de sucres)</span></div>
              : <div className="disp text-xl"><span className="num">{fmt(en.sucreKg, 1)}</span> <span>kg de sucre</span></div>}
          {!en.impossible ? <div className="text-sm text-ink2"><span>Volume après ajout : environ </span><span className="num">{fmtL(en.volFinalL)}</span></div> : null}
          {en.depasse ? <Notice tone="warn" title="Au-delà du maximum réglé"><span>L’enrichissement dépasse </span><span className="num">{fmt(en.max, 1)}</span><span> % vol (Paramètres › Données & paramètres). Plafond indicatif : vérifiez la réglementation de la campagne et le cahier des charges de l’appellation.</span></Notice> : null}
        </div> : <Empty>Indiquez le volume, le TAP actuel et le TAV visé.</Empty>}
        <Field label="Produit utilisé (facultatif)"><SI value={e.produitId} onChange={(v) => setE({ ...e, produitId: v })} placeholder="Sucre, MCR…" options={prods.map((p) => ({ value: p.id, label: `${p.nom} (${p.unite})` }))} /></Field>
        <p className="help">Estimation à confirmer avec votre œnologue ; l’enrichissement se déclare (registre et déclaration préalable selon la réglementation).</p>
        {portion && en && !en.impossible && !camp.figee ? <Btn kind="primary" onClick={preparer}>Préparer l’opération d’enrichissement…</Btn> : null}
      </div>}
    </Sheet>
  );
}
// réglages des alertes de fermentation (Paramètres › Données & paramètres)
function FermReglagesCard() {
  const { db, act } = useApp(); const g = fermReglages(db);
  const champ = (k, label, help, mult) => { const v = g[k] * (mult || 1); return <SettingFerm key={k} k={k} label={label} help={help} valeur={v} mult={mult || 1} />; };
  return (<Sec title="Fermentations (alerte de ralentissement)"><div className="card space-y-3 p-4">
    <Check checked={g.actif} onChange={(v) => act((d) => { d.settings.fermentation = { ...(d.settings.fermentation || {}), actif: !!v }; return okr(); }, v ? 'Alertes de fermentation activées.' : 'Alertes de fermentation désactivées.')} label="Signaler les fermentations lentes ou arrêtées (lots en FA)" />
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
      {champ('lente', 'Fermentation lente sous (points de densité / jour)', 'Baisse quotidienne en millièmes : 2 = la densité perd moins de 0,002 par jour.', 1000)}
      {champ('arret', 'Fermentation arrêtée sous (points / jour)', '0,5 = moins de 0,0005 par jour.', 1000)}
      {champ('fin', 'Densité de fin de FA', 'En dessous, la fermentation est considérée comme finie (pas d’alerte).')}
      {champ('recent', 'Relevé ancien après (jours)', 'Signale un dernier relevé trop ancien pour un lot en FA.')}
    </div></div></Sec>);
}
function SettingFerm({ k, label, help, valeur, mult }) {
  const { act } = useApp(); const txt = String(r4(valeur)).replace('.', ','); const [v, setV] = useState(txt); useEffect(() => setV(txt), [txt]);
  const commit = () => { const n = num(v) / mult; if (hasNum(v) && n > 0 && Math.abs(n * mult - valeur) > 1e-9) act((d) => { d.settings.fermentation = { ...(d.settings.fermentation || {}), [k]: n }; return okr(); }, 'Paramètre enregistré.'); else setV(txt); };
  return <Field label={label} help={help}><input className="inp num" inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} /></Field>;
}
