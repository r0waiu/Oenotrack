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
      {!compact && en ? <div className="text-xs text-ink2">Réglages (TAV visé, g/L de sucre pour 1 % vol, enrichissement maximal) : Paramètres › 🧪 Calculs œnologiques — valeurs indicatives à adapter à la réglementation de la campagne.</div> : null}
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

/* ---------- 0.49.0-alpha.1 : documents lus par l'IA — composants communs (IA02 réception, IA03 pesée et entrée de moûts, IA04 barèmes,
   IA05 plan, IA13 composés, IA18 commentaire) ; moteur : 17ac-ia-documents.js. L'IA ne fait que proposer : le formulaire est prérempli,
   les champs incertains signalés (classe ia-doute), et rien n'est enregistré avant « Enregistrer » ; la trace « ia » suit l'enregistrement. ---------- */
const IA_DOC_ACCEPT = 'image/*,application/pdf,.pdf';
// bouton de lecture d'un document : photo (appareil photo du téléphone, capture="environment") et / ou fichier (photo ou PDF) ;
// désactivé avec sa raison quand l'usage n'est pas possible (IA non configurée, usage désactivé, niveau 2 réservé au modèle local)
function IaFichierBouton({ usage, icone = '🤖', children, accept = IA_DOC_ACCEPT, photo, busy, onFichiers, kind, size = 'sm', fichierLabel }) {
  const ia = useIaUsage(); const raison = ia.refus(usage); const u = iaUsageDef(usage); const refP = useRef(null); const refF = useRef(null);
  if (!u) return null;
  const choisi = (e) => { const L = Array.from(e.target.files || []); e.target.value = ''; if (L.length) onFichiers(L); };
  const titre = raison || `${u.nom} — ${u.envoie}`;
  const ouvrir = (r) => { if (r.current) r.current.click(); };
  return (
    <span className="inline-flex flex-wrap items-center gap-1" data-ia-lire={usage}>
      <Btn size={size} kind={kind} disabled={!!raison || busy} title={titre} onClick={() => ouvrir(photo ? refP : refF)} data-ia-bouton={usage}>{busy ? '⏳ ' : `${icone} `}{children || u.nom}</Btn>
      {photo ? <Btn size={size} kind="ghost" disabled={!!raison || busy} title={titre} onClick={() => ouvrir(refF)} data-ia-bouton-fichier={usage}>{fichierLabel || '📎 Photo ou PDF…'}</Btn> : null}
      {photo ? <input ref={refP} type="file" hidden accept="image/*" capture="environment" onChange={choisi} data-ia-photo={usage} /> : null}
      <input ref={refF} type="file" hidden accept={accept} onChange={choisi} data-ia-fichier={usage} />
    </span>
  );
}
// ce que l'IA a prérempli : champs à vérifier, noms non trouvés dans les listes, alertes (valeurs écartées) ; libelles : { champ: libellé }
function IaLectureNotice({ x, libelles, titre }) {
  if (!x) return null; const L = libelles || {}; const lib = (k) => L[k] || L[String(k).replace(/\d+$/, '')] || '';
  const inc = uniq((x.incertains || []).map(lib).filter(Boolean)); const nr = Object.keys(x.nonReconnus || {});
  return (
    <div className="ia-lecture" data-ia-lecture="">
      <div className="text-sm font-semibold">{titre || '🤖 Prérempli par l’IA : relisez chaque champ avant d’enregistrer.'}</div>
      {inc.length ? <div className="mt-1 flex flex-wrap items-center gap-1 text-sm" data-ia-incertains=""><span>Lu avec un doute :</span>{inc.map((k) => <Chip key={k} tone="warn">{k}</Chip>)}</div> : null}
      {nr.length ? <div className="mt-1 text-sm" data-ia-non-reconnus=""><span>Absent de vos listes (à choisir à la main) :</span> {nr.map((k, i) => <span key={k}>{i ? ' · ' : ''}<span>{lib(k) || k}</span> « <span translate="no">{x.nonReconnus[k]}</span> »</span>)}</div> : null}
      {(x.alertes || []).length ? <ul className="mt-1 list-disc pl-5 text-sm" data-ia-alertes="">{x.alertes.map((a) => <li key={a}>{a}</li>)}</ul> : null}
    </div>
  );
}
const iaDoute = (x, ...champs) => (x && champs.some((c) => (x.incertains || []).includes(c)) ? 'ia-doute' : undefined);

/* ---------- IA03 : entrée de moûts depuis le bon de livraison ou le DAE (onglet du partenaire affiché) ---------- */
const MOUT_IA_LIBELLES = { date: 'Date', apporteur: 'Partenaire', numero: 'N° de bon / DAE', immatriculation: 'Immatriculation', volume: 'Volume', cepage: 'Cépage', cru: 'Cru', fraction: 'Fraction', compartiment: 'Compartiment' };
// formulaire prérempli : en-tête (date, citerne), partenaire et n° de bon de l'onglet affiché, moûts de cet onglet (ses moûts vides sont
// remplacés, les autres gardés) ; rien n'est enregistré
function moutIaAppliquer(f0, lu, nvLigne, actif, trace) {
  const P = moutOnglets(f0); const k = Math.max(0, P.findIndex((p) => p.id === actif)); const pid = P[k].id; const multi = P.length > 1; const e = lu.entete || {};
  const f = { ...f0, ia: trace }; if (e.date) f.date = e.date; if (e.immat) f.immat = e.immat;
  const val = (p, j) => (j === 0 ? { apporteurId: f0.apporteurId || '', ref: f0.ref || '' } : { apporteurId: p.apporteurId || '', ref: p.ref || '' });
  const tab = { ...val(P[k], k), ...(e.apporteurId ? { apporteurId: e.apporteurId } : {}), ...(e.ref ? { ref: e.ref } : {}) };
  if (k === 0) { f.apporteurId = tab.apporteurId; f.ref = tab.ref; }
  if (multi || (Array.isArray(f0.partenaires) && f0.partenaires.length)) f.partenaires = P.map((p, j) => ({ id: p.id, ...(j === k ? tab : val(p, j)) }));
  const vide = (x) => !String(x.compartiment || '').trim() && !(x.dests || []).some((d) => num(d.volL) > 0);
  const garde = (f0.entrees || []).filter((x) => moutOngletDe(P, x) !== pid || !vide(x));
  const cuves = (f0.entrees || []).filter((x) => moutOngletDe(P, x) === pid && vide(x)).map((x) => ((x.dests || [])[0] || {}).contenantId || ''); // cuve déjà choisie d'un moût vide : reprise
  const nouveaux = (lu.mouts || []).map((m, i) => { const b = nvLigne(); const d0 = { ...((b.dests || [])[0] || {}), ...(cuves[i] ? { contenantId: cuves[i] } : {}) };
    return { ...b, ...(multi ? { partId: pid } : {}), compartiment: m.compartiment || '', ...(m.cepageId ? { cepageId: m.cepageId } : {}), ...(m.fractionId ? { fractionId: m.fractionId } : {}), cruId: m.cruId || '', millesime: m.millesime || '',
      apporteurs: tab.apporteurId ? [{ id: tab.apporteurId, pct: '' }] : (b.apporteurs || []), dests: [{ contenantId: d0.contenantId || '', volL: String(m.volL) }] }; });
  f.entrees = garde.length || nouveaux.length ? [...garde, ...nouveaux] : f0.entrees;
  return f;
}
function MoutIaLecture({ f, setF, nvLigne, actif }) {
  const { db, toast } = useApp(); const ia = useIaUsage(); const [busy, setBusy] = useState(false); const [lu, setLu] = useState(null);
  const lire = async (files) => {
    setBusy(true);
    try {
      const images = await iaImagesDepuisFichiers(files, { pages: 3 }); const P = iaPeseePrompt(db, 'mout');
      const r = await ia.demander('pesee', { system: P.system, texte: P.texte, images, schema: P.schema, nom: P.nom, max: P.max }); if (!r) return;
      const x = iaMoutLire(db, r.valeur, P.codes); if (!x.ok) { toast(x.msg, 'bad'); return; }
      setF((y) => moutIaAppliquer(y, x, nvLigne, actif, r.trace)); setLu(x);
      toast(`Document lu : ${x.mouts.length} moût(s) prérempli(s), à vérifier avant d’enregistrer.`);
    } catch (e) { toast((e && e.message) || 'Lecture impossible.', 'bad'); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2" data-mout-ia="">
      <div className="flex flex-wrap items-center gap-2"><IaFichierBouton usage="pesee" photo busy={busy} onFichiers={lire}>Lire le bon / le DAE</IaFichierBouton>{f.ia ? <IaTrace ia={f.ia} /> : null}</div>
      <IaLectureNotice x={lu} libelles={MOUT_IA_LIBELLES} />
    </div>
  );
}
