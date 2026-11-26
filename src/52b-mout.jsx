/* ============ ENTRÉES DE MOÛTS : partenaires par compartiment, n° de lot, analyses, moyennes et enrichissement (0.14.0-alpha.1) ; bulletins à plusieurs échantillons (0.37.0-alpha.1) ============ */
// paramètres d'analyse des lots reçus : modèle imposé « Moût · Débourbage » (moutModeleImpose, 0.34.0-alpha.1)
const paramDe = (db, pid) => db.analysesParams.find((p) => p.id === pid) || { id: pid, nom: pid, unite: '', dec: 1 };
const valeurAnalyse = (db, pid, v) => { const p = paramDe(db, pid); return `${p.nom} ${fmt(v, p.dec)}${p.unite ? ` ${p.unite}` : ''}`; };
const analysesTexte = (db, an) => Object.keys(an || {}).filter((k) => hasNum(an[k])).map((k) => valeurAnalyse(db, k, num(an[k]))).join(' · ');

// partenaires d'un compartiment : un ou plusieurs, avec leur part (%) quand il y en a plusieurs
function PartenairesLigne({ value, onChange, onAjout, n }) {
  const { db } = useApp(); const L = value || [];
  return (
    <div className="space-y-1.5" data-partenaires={n}>
      {L.map((a, k) => (
        <div key={a.id} className="flex flex-wrap items-center gap-2">
          <span className="chip" style={{ maxWidth: '100%' }}>{apporteurName(db, a.id)}</span>
          {L.length > 1 ? <span className="flex items-center gap-1"><input className="inp" style={{ width: 74 }} inputMode="decimal" value={a.pct || ''} placeholder="%" aria-label={`Part de ${apporteurName(db, a.id)} (moût ${n})`} onChange={(e) => onChange(L.map((x, j) => (j === k ? { ...x, pct: e.target.value } : x)))} /><span className="text-xs text-ink2">%</span></span> : null}
          <button type="button" className="linkish text-sm" aria-label={`Retirer ${apporteurName(db, a.id)} du moût ${n}`} onClick={() => onChange(L.filter((_, j) => j !== k))}>✕</button>
        </div>))}
      <ApporteurSelect value="" role="apporteur" ariaLabel={`Partenaire du moût ${n}`} placeholder={L.length ? 'Ajouter un partenaire…' : 'Partenaire : commencez à écrire…'} onChange={(id) => { if (id && !L.some((x) => x.id === id)) { onChange([...L, { id, pct: '' }]); if (onAjout) onAjout(id); } }} />
      {L.length > 1 ? <div className="help">Parts en % (total 100) ou laissées vides : parts égales.{(() => { const t = sum(L, (x) => x.pct); return L.some((x) => hasNum(x.pct)) ? ` Total : ${fmt(t)} %.` : ''; })()}</div> : null}
    </div>
  );
}
// crus par défaut des partenaires choisis : un appui pour les prendre
function CrusProposes({ ids, cruId, onPick }) {
  const { db } = useApp(); const crus = uniq((ids || []).flatMap((id) => (apporteurDe(db, id) || {}).crusDefaut || [])).filter((c) => c !== cruId);
  if (!crus.length) return null;
  return <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs"><span className="text-ink2">Crus des partenaires :</span>{crus.map((c) => <button key={c} type="button" className="chip" style={{ cursor: 'pointer' }} onClick={() => onPick(c)}>{cruName(db, c)}</button>)}</div>;
}
// saisie des analyses d'un lot reçu (paramètres du modèle)
function AnalysesLigne({ paramIds, value, onChange, n }) {
  const { db } = useApp(); const v = value || {};
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))' }}>
      {uniq([...paramIds, ...Object.keys(v).filter((k) => hasNum(v[k]))]).map((pid) => { const p = paramDe(db, pid); return <Field key={pid} label={`${p.nom}${p.unite ? ` (${p.unite})` : ''}`}><NI value={v[pid] ?? ''} onChange={(x) => onChange({ ...v, [pid]: x })} aria-label={`${p.nom} du moût ${n}`} /></Field>; })}
    </div>
  );
}
// moyennes pondérées + enrichissement nécessaire pour atteindre le TAV visé
function MoyennesEnrichissement({ parts, volL, compact, tavVise, onTav }) {
  const { db } = useApp(); const moy = moyennesPonderees(parts); const ks = Object.keys(moy);
  if (!ks.length) return compact ? null : <div className="text-sm text-ink2">Aucune analyse saisie pour ces lots.</div>;
  const tap = tapMoyen(db, moy); const en = enrichissement(db, tap, volL, tavVise); const tot = sum(parts, (p) => p.vol);
  return (
    <div className={cx('rounded-md border border-line p-2 text-sm', compact ? '' : 'space-y-2')} style={{ background: 'var(--surface)' }} data-moyennes="">
      <div><b>Moyenne pondérée</b> <span className="text-ink2">({fmtL(tot)} reçus)</span> : {ks.map((k) => `${valeurAnalyse(db, k, moy[k].moy)}${moy[k].vol < tot - 0.5 ? ` (sur ${fmtL(moy[k].vol)})` : ''}`).join(' · ')}</div>
      {en ? (en.ecart > 0
        ? <div data-enrichissement=""><b>Enrichissement</b> pour {fmt(en.tav, 1)} % vol : +{fmt(en.ecart, 2)} % vol × {fmt(en.coef)} g/L = <b>{fmt(en.gL, 1)} g/L</b>, soit <b className="num">{fmt(en.kg, 1)} kg de sucre</b> pour {fmtL(en.volL)}{en.depasse ? <span className="text-bad"> · ⚠ au-delà de l’enrichissement maximal réglé ({fmt(en.max, 1)} % vol)</span> : null}{onTav ? <> · <label className="inline-flex items-center gap-1">TAV visé <input className="inp" style={{ width: 70, minHeight: 28, padding: '2px 6px' }} inputMode="decimal" value={tavVise ?? ''} placeholder={fmt(chaptalReglages(db).tav, 1)} onChange={(e) => onTav(e.target.value)} aria-label="TAV visé (% vol)" /></label></> : null}</div>
        : <div data-enrichissement="">TAP moyen {fmt(en.tap, 2)} % vol : <b>pas d’enrichissement nécessaire</b> pour {fmt(en.tav, 1)} % vol.</div>)
        : <div className="text-xs text-ink2">Renseignez le TAP (ou les sucres en g/L) pour calculer l’enrichissement.</div>}
      {!compact && en ? <div className="text-xs text-ink2">Réglages (TAV visé, g/L de sucre pour 1 % vol, enrichissement maximal) : Paramètres › Données & paramètres — valeurs indicatives à adapter à la réglementation de la campagne.</div> : null}
    </div>
  );
}
// fiches lot / cuve : lots reçus (n° de lot, partenaires, analyses) et enrichissement
function MoutsRecusSection({ lotId, cid }) {
  const { db, R } = useApp(); const [tav, setTav] = useState('');
  const parts = cid ? moutAnalysesCuve(db, R, cid) : moutAnalysesLot(db, lotId);
  if (!parts.length) return null;
  const vol = cid ? R.contVol[cid] || 0 : R.lotVol[lotId] || 0; const pids = uniq(parts.flatMap((p) => Object.keys(p.analyses || {}).filter((k) => hasNum(p.analyses[k]))));
  return (
    <Sec title="Moûts reçus : lots d’entrée, analyses et enrichissement">
      <Tbl rows={parts.map((p, i) => ({ ...p, id: `${p.op.id}-${p.i}-${i}` }))} cols={[
        { h: 'Reçu le', r: (p) => <span className="num whitespace-nowrap">{fmtDate(p.op.date)}</span> }, { h: 'N° de lot', r: (p) => <b>{p.numLot || '—'}</b> },
        { h: 'Compartiment', cls: 'hm', r: (p) => p.e.compartiment || '—' }, { h: 'Partenaire(s)', r: (p) => <span className="text-sm">{ligneApporteursNoms(db, p.e, p.op) || '—'}</span> },
        { h: 'Fraction · cépage', cls: 'hm', r: (p) => <span className="text-sm">{[fracLabel(db, p.e.fractionId), lbl(db, 'cepages', p.e.cepageId)].join(' · ')}</span> },
        { h: 'Volume', cls: 'r', r: (p) => <span className="num">{fmtL(p.vol)}</span> },
        ...pids.map((k) => ({ h: paramDe(db, k).nom, cls: 'r', r: (p) => <span className="num">{hasNum((p.analyses || {})[k]) ? fmt(p.analyses[k], paramDe(db, k).dec) : '—'}</span> }))]} />
      <div className="mt-2"><MoyennesEnrichissement parts={parts} volL={vol} tavVise={tav} onTav={setTav} /></div>
    </Sec>
  );
}
// module Analyses : analyses saisies sur les lots reçus (entrées de moûts)
function AnalysesEntreesSection() {
  const { db, camp } = useApp(); const [tous, setTous] = useState(false);
  const rows = db.ops.filter((o) => o.type === 'entree_mout' && (tous || (o.date >= camp.debut && o.date <= camp.fin))).flatMap((o) => (o.entrees || []).map((e, i) => ({ id: `${o.id}-${i}`, o, e, i, an: ligneAnalyses(o, e, i), numLot: ligneNumLot(o, e, i) })))
    .filter((r) => Object.keys(r.an).length).sort((a, b) => (a.o.date < b.o.date ? 1 : -1));
  if (!rows.length && !tous) return null;
  return (
    <Sec title={`Analyses des moûts reçus (${rows.length})`} right={<Check checked={tous} onChange={setTous} label="Toutes les campagnes" />}>
      <Tbl rows={rows} empty="Aucune analyse saisie à l’entrée des moûts." cols={[
        { h: 'Reçu le', r: (r) => <span className="num whitespace-nowrap">{fmtDate(r.o.date)}</span> }, { h: 'N° de lot', r: (r) => <b>{r.numLot || '—'}</b> },
        { h: 'Partenaire(s)', r: (r) => <span className="text-sm">{ligneApporteursNoms(db, r.e, r.o) || '—'}</span> }, { h: 'Cuve(s)', cls: 'hm', r: (r) => <span className="flex flex-wrap gap-x-2">{(r.e.dests || []).map((d) => <ContLink key={d.contenantId} id={d.contenantId} />)}</span> },
        { h: 'Volume', cls: 'r', r: (r) => <span className="num">{fmtL(r.e.volL)}</span> }, { h: 'Résultats', r: (r) => <span className="text-sm">{analysesTexte(db, r.an)}</span> }]} />
    </Sec>
  );
}

/* ---------- bulletin d'analyses à plusieurs échantillons : affectation guidée aux moûts (0.37.0-alpha.1) ----------
   g : { nom, res (bulletin lu), aff (rapprochement proposé, bulletinPourMouts), mouts: [{ i, numLot, compartiment, onglet, partenaire, n }], ia }
   Pour chaque moût : l'échantillon dont il reprend les valeurs (un même échantillon peut valoir pour plusieurs moûts). */
const BUL_SUR = { lot: 'rapproché par le n° de lot', compartiment: 'rapproché par le compartiment', chiffres: 'rapproché par les mêmes nombres', unique: 'seul échantillon du bulletin', ordre: 'dans l’ordre du bulletin : à vérifier' };
function BulletinMoutsGuide({ g, reste, onAnnuler, onValider }) {
  const { db } = useApp(); const E = bulletinEchantillonsValeurs(g.res); const plusieurs = uniq(g.mouts.map((m) => m.onglet)).length > 1;
  const [choix, setChoix] = useState(() => Object.fromEntries(g.mouts.map((m) => { const a = g.aff.find((x) => x.i === m.i); return [m.i, a ? String(a.k) : '']; })));
  const sur = (m) => { const a = g.aff.find((x) => x.i === m.i); return a && String(a.k) === choix[m.i] ? a.sur : choix[m.i] ? 'manuel' : ''; };
  const resume = (e) => Object.keys(e.valeurs).slice(0, 6).map((k) => valeurAnalyse(db, k, e.valeurs[k])).join(' · ');
  const nomE = (e) => `${e.numero && e.numero !== e.ref ? `${e.numero} · ` : ''}${e.ref || `Échantillon ${e.k + 1}`}`;
  const nb = (e) => g.mouts.filter((m) => choix[m.i] === String(e.k)).length;
  const valider = () => onValider(g.mouts.filter((m) => choix[m.i]).map((m) => { const e = E.find((x) => String(x.k) === choix[m.i]); return { i: m.i, k: e.k, valeurs: e.valeurs, ref: e.ref }; }));
  const opts = [{ value: '', label: '— aucun échantillon —' }, ...E.map((e) => ({ value: String(e.k), label: nomE(e) }))];
  return (
    <Sheet wide title="🧪 Bulletin d’analyses : échantillon de chaque moût" sub={`« ${g.nom} » · ${E.length} échantillon(s)`} onClose={onAnnuler}
      footer={<><Btn onClick={onAnnuler}>Ne rien reporter</Btn><Btn kind="primary" disabled={!Object.values(choix).some(Boolean)} onClick={valider}>Reporter les analyses</Btn></>}>
      <div className="space-y-4" data-bulletin-guide="">
        <p className="text-sm">{E.length > 1 ? 'Le bulletin contient plusieurs échantillons qu’Œnotrack n’a pas tous pu rapprocher avec certitude des moûts (n° de lot, compartiment). Vérifiez l’échantillon proposé pour chaque moût ; un même échantillon peut valoir pour plusieurs moûts. Le bulletin est joint à l’entrée.' : 'Le bulletin contient un seul échantillon : choisissez les moûts dont il donne les analyses. Le bulletin est joint à l’entrée.'}</p>
        {g.ia ? (g.ia.ok ? <Chip tone="ok">🤖 lecture complétée par l’IA</Chip> : <Chip tone="warn" title={g.ia.msg}>🤖 IA indisponible</Chip>) : null}
        <Sec title={`Échantillons du bulletin (${E.length})`}>
          <div className="space-y-1">{E.map((e) => (
            <div key={e.k} className="flex flex-wrap items-center gap-2 rounded-md border border-line px-2 py-1 text-sm" data-bulletin-guide-ech={e.k + 1}>
              <b translate="no">{nomE(e)}</b><span className="min-w-0 flex-1 text-ink2">{resume(e)}</span>
              {nb(e) ? <Chip tone="ok">{`reporté sur ${nb(e)} moût(s)`}</Chip> : <Chip tone="warn">non reporté</Chip>}
            </div>))}</div>
        </Sec>
        <Sec title={`Moûts de l’entrée (${g.mouts.length})`}>
          <div className="space-y-2">{g.mouts.map((m) => (
            <div key={m.i} className="grid items-center gap-2 rounded-md border border-line p-2" style={{ gridTemplateColumns: 'minmax(180px,1fr) minmax(220px,1.3fr)' }} data-bulletin-guide-mout={m.i + 1}>
              <div className="text-sm">{plusieurs ? <span translate={m.partenaire ? 'no' : undefined}>{m.partenaire || `Partenaire n° ${m.onglet}`}</span> : null}{plusieurs ? ' · ' : ''}<b>{`Moût ${m.n}`}</b>
                {m.numLot ? <> · <span>{`lot ${m.numLot}`}</span></> : null}{m.compartiment ? <> · <span translate="no">{m.compartiment}</span></> : null}
                {sur(m) && sur(m) !== 'manuel' ? <div><Chip tone={sur(m) === 'ordre' ? 'warn' : 'ok'}>{BUL_SUR[sur(m)]}</Chip></div> : null}</div>
              <SI plain value={choix[m.i] || ''} onChange={(v) => setChoix((c) => ({ ...c, [m.i]: v }))} options={opts} aria-label={`Échantillon du moût ${m.i + 1}`} />
            </div>))}</div>
        </Sec>
        {reste ? <p className="help">{`Encore ${reste} bulletin(s) à affecter ensuite.`}</p> : null}
      </div>
    </Sheet>
  );
}
