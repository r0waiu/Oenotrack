/* ============ TIRAGES › PRÉPARER (0.42.0-alpha.1) : calculateur, fonte de liqueur, levains (étapes, propagation, recalibrage) ============
   Calculateur dans les deux sens : vin de base → volume de mixtion et équivalent bouteilles, ou cols à tirer → vin, liqueur, levain,
   adjuvants. Levain : fiche avec besoins par étape, plan de propagation (prévu / réalisé), recalibrage du jour (le tirage n'avance jamais
   au rythme annoncé), journal des étapes, alimentations et relevés (opérations « alimentation »), plan imprimable.
   0.48.0-alpha.1 : pieds de cuve malolactiques créés ici aussi (toutes les préparations de tirage), liqueurs modifiables ; calculateur :
   aide neutre tant que ni cols ni vin ne sont saisis. */

const hl2 = (L) => `${fmt(num(L) / 100, 2)} hL`;
const litres = (L) => `${fmt(num(L), num(L) < 100 ? 1 : 0)} L`;
// fonte de la liqueur de tirage dans le formulaire de préparation : titre, sucre ⇄ volume, vin de fonte, densité
function LiqueurFonteBox({ db, f, upd }) {
  const p = tirageProfil(db); const fo = f.fonte || {}; const set = (patch) => upd({ fonte: { titreGL: p.titreLiqueurGL, volSucreLkg: p.volSucreLkg, ...fo, ...patch } });
  const r = liqueurFonte(num(fo.sucreKg) > 0 ? { sucreKg: fo.sucreKg } : { volL: f.volL }, hasNum(fo.titreGL) ? fo.titreGL : p.titreLiqueurGL, hasNum(fo.volSucreLkg) ? fo.volSucreLkg : p.volSucreLkg);
  const appliquer = () => { if (r.ok) upd({ volL: String(Math.round(r.volL * 100) / 100), fonte: { titreGL: r.titreGL, volSucreLkg: hasNum(fo.volSucreLkg) ? num(fo.volSucreLkg) : p.volSucreLkg, ...fo, sucreKg: Math.round(r.sucreKg * 100) / 100, vinL: Math.round(r.vinL * 100) / 100 } }); };
  return (<div className="rounded-md border border-line p-3 grid gap-2" data-fonte-liqueur="">
    <div className="lbl">Fonte de la liqueur de tirage</div>
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Field label="Titre (g/L)"><NI value={hasNum(fo.titreGL) ? fo.titreGL : p.titreLiqueurGL} onChange={(v) => set({ titreGL: v })} aria-label="Titre de la liqueur" /></Field>
      <Field label="Sucre (kg)" help="Vide : déduit du volume préparé."><NI value={fo.sucreKg ?? ''} onChange={(v) => set({ sucreKg: v })} aria-label="Sucre de la liqueur" /></Field>
      <Field label="Augmentation de volume du sucre (L/kg)"><NI value={hasNum(fo.volSucreLkg) ? fo.volSucreLkg : p.volSucreLkg} onChange={(v) => set({ volSucreLkg: v })} aria-label="Augmentation de volume du sucre" /></Field>
      <Field label="Acide citrique (g)"><NI value={fo.acideCitriqueG ?? ''} onChange={(v) => set({ acideCitriqueG: v })} placeholder="facultatif" /></Field>
      <Field label="Densité relevée"><NI value={fo.densite ?? ''} onChange={(v) => set({ densite: v })} aria-label="Densité relevée de la liqueur" /></Field>
      <Field label="Température (°C)"><NI value={fo.tempC ?? ''} onChange={(v) => set({ tempC: v })} /></Field>
      <Field label="Densité corrigée à 20 °C"><NI value={fo.densite20 ?? ''} onChange={(v) => set({ densite20: v })} /></Field>
    </div>
    {r.ok ? <p className="text-sm" data-fonte-resultat=""><span>{`Pour ${litres(r.volL)} de liqueur à ${fmt(r.titreGL)} g/L : ${fmt(r.sucreKg, 1)} kg de sucre et ${litres(r.vinL)} de vin de base (le sucre ajoute ${litres(r.augmentationL)}).`}</span> <Btn size="sm" onClick={appliquer}>Reporter dans la préparation</Btn></p> : <p className="help">{r.msg}</p>}
    <p className="help">Le vin de fonte se prélève comme « vin prélevé » ; le sucre et l’acide citrique se notent dans les ingrédients (n° de lot fournisseur).</p>
  </div>);
}

/* ---------- calculateur ---------- */
function TirageCalculateur({ onPreparer }) {
  const { db } = useApp(); const base = tirageProfil(db);
  const [mode, setMode] = useState('cols'); const [vinL, setVinL] = useState(''); const [formats, setFormats] = useState([{ format: 'bouteille', nb: '' }]);
  const [sur, setSur] = useState({}); const p = useMemo(() => tirageFusion(base, sur), [base, sur]);
  const r = useMemo(() => tirageCalcul(mode === 'vin' ? { mode: 'vin', vinL } : { mode: 'cols', formats }, p), [mode, vinL, formats, p]);
  const saisi = mode === 'vin' ? String(vinL || '').trim() !== '' : formats.some((x) => String(x.nb || '').trim() !== ''); // U13 : pas de reproche avant la saisie
  const S = (k, label, help) => <Field label={label} help={help}><NI value={sur[k] ?? p[k] ?? ''} onChange={(v) => setSur({ ...sur, [k]: v })} aria-label={label} placeholder={k === 'pointGL' ? 'ex. 24' : undefined} /></Field>;
  return (<div className="card p-4 grid gap-3" data-tirage-calcul="">
    <div className="flex flex-wrap items-center gap-2"><b>🧮 Calculateur de tirage</b>
      <SubNav value={mode} onChange={setMode} items={[{ id: 'cols', label: 'Je veux tirer x cols' }, { id: 'vin', label: 'J’ai x hL de vin' }]} /></div>
    {mode === 'vin' ? <Field label="Vin de base disponible (hL)"><VI value={vinL} onChange={setVinL} aria-label="Vin de base disponible" /></Field> : (
      <div className="grid gap-2">{formats.map((x, i) => (<div key={i} className="flex flex-wrap items-end gap-2">
        <Field label="Format"><SI plain value={x.format} onChange={(v) => setFormats(formats.map((y, k) => (k === i ? { ...y, format: v } : y)))} options={TIRAGE_FORMATS.map((t) => ({ value: t.id, label: t.label }))} aria-label="Format" /></Field>
        <Field label="Cols"><NI value={x.nb} onChange={(v) => setFormats(formats.map((y, k) => (k === i ? { ...y, nb: v } : y)))} aria-label={`Cols ${i + 1}`} /></Field>
        {formats.length > 1 ? <Btn size="sm" kind="ghost" onClick={() => setFormats(formats.filter((y, k) => k !== i))} aria-label="Retirer le format">✕</Btn> : null}</div>))}
        <div><Btn size="sm" onClick={() => setFormats([...formats, { format: 'magnum', nb: '' }])}>＋ Format</Btn></div></div>)}
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      {S('pointGL', 'Point de tirage de la cuvée (g/L)', 'Sucre apporté par la liqueur, choisi pour chaque cuvée (24 g/L ≈ 6 bar de pression relative, environ 7 bar de pression absolue, dans la bouteille à 20 °C).')}{S('levainPct', 'Levain (%)')}{S('titreLiqueurGL', 'Liqueur (g/L)')}{S('remplissagePct', 'Volume en plus (%)', 'Casse, remplissage, fond de cuve.')}
    </div>
    {r.ok ? <div className="grid gap-2" data-tirage-resultat="">
      <div className="tblwrap"><table className="tbl"><tbody>
        <tr><td>Mixtion à préparer</td><td className="r"><b className="num" data-calc="mix">{hl2(r.mixL)}</b></td><td className="text-xs text-ink2">{`${fmt(r.nbCols)} cols · ${fmt(r.eqBouteilles, 0)} équivalent bouteilles (75 cL)`}</td></tr>
        <tr><td>Vin de base</td><td className="r"><b className="num" data-calc="vin">{hl2(r.vinL)}</b></td><td className="text-xs text-ink2">{`+ ${litres(r.vinFonteL)} pour fondre la liqueur`}</td></tr>
        <tr><td>Liqueur de tirage</td><td className="r"><b className="num" data-calc="liqueur">{litres(r.liqueurL)}</b></td><td className="text-xs text-ink2">{`${fmt(r.sucreKg, 1)} kg de sucre · ${fmt(r.sucreKgHL, 2)} kg/hL`}</td></tr>
        <tr><td>Levain</td><td className="r"><b className="num" data-calc="levain">{litres(r.levainL)}</b></td><td className="text-xs text-ink2">{`dont ${litres(r.levainL * num(p.levainEauPct) / 100)} d’eau, ${litres(r.liqLevainL)} de liqueur`}</td></tr>
        {r.adjuvants.map((a) => <tr key={a.id || a.nom}><td translate="no">{a.nom}</td><td className="r num">{litres(a.L)}</td><td className="text-xs text-ink2">{`${fmt(a.doseLhL, 2)} L/hL`}</td></tr>)}
        <tr><td>VRTP prévisionnel</td><td className="r"><b className={cx('num', r.vrtpPct > TIRAGE_VRTP_MAX_PCT && 'text-bad')} data-calc="vrtp">{litres(r.vrtpL)}</b></td><td className="text-xs text-ink2">{`${fmt(r.vrtpPct, 2)} % des volumes mis en œuvre, vins et liqueurs (${hl2(r.volMisEnOeuvreL)}) — limite ${TIRAGE_VRTP_MAX_PCT} %`}</td></tr>
      </tbody></table></div>
      {r.alertes.map((a, i) => <Notice key={i} tone="warn">{a}</Notice>)}
      <div className="flex flex-wrap gap-2"><Btn onClick={() => onPreparer({ type: 'preparation', preset: { ptype: 'liqueur_tirage', volL: String(Math.round(r.liqueurTotaleL * 100) / 100), fonte: { titreGL: num(p.titreLiqueurGL), volSucreLkg: num(p.volSucreLkg) } } })}>⚗ Fondre cette liqueur</Btn>
        <Btn onClick={() => onPreparer({ type: 'preparation', preset: { ptype: 'levain', levainPlan: { mixTotalL: Math.round(r.mixL), jours: [{ date: addDays(todayISO(), 5), cols: Math.round(r.mixL / 0.75) }], sur: { pointGL: num(p.pointGL), levainPct: num(p.levainPct), titreLiqueurGL: num(p.titreLiqueurGL) } } } })}>🧫 Préparer le levain</Btn></div>
      <p className="help">VRTP = volume tiré − liqueur utilisée − vin (levain + mixtion) ; cahier des charges AOC Champagne : au plus {TIRAGE_VRTP_MAX_PCT} % des volumes mis en œuvre. Taux et doses « à vérifier » : Paramètres › Calculs œnologiques.</p>
    </div> : <p className="help" data-tirage-aide="">{!hasNum(p.pointGL) && !saisi ? 'Choisissez le point de tirage de la cuvée pour lancer le calcul.' : r.msg}</p>}
  </div>);
}

/* ---------- levain : plan, prévu / réalisé, recalibrage, étapes, journal ---------- */
function levainPlanDe(db, prepId) { const op = (db.ops || []).find((o) => o && o.type === 'preparation' && o.prepId === prepId); return { op, plan: (op && op.levainPlan) || { jours: [], sur: {} } }; }
function LevainPlanEditeur({ plan, onSave, lect }) {
  const [J, setJ] = useState(() => (plan.jours || []).map((j) => ({ date: j.date, cols: String(j.cols ?? '') })));
  const [mix, setMix] = useState(String(plan.mixTotalL ?? '')); const [sur, setSur] = useState(plan.sur || {});
  const set = (i, patch) => setJ(J.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (<div className="grid gap-2" data-levain-plan-ed="">
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Field label="Mixtion totale servie (hL)" help="Pour les quantités de levure et d’activateur."><VI value={mix} onChange={setMix} aria-label="Mixtion totale servie" /></Field>
      <Field label="Levain (%)"><NI value={sur.levainPct ?? ''} onChange={(v) => setSur({ ...sur, levainPct: v })} placeholder="profil" aria-label="Taux de levain du plan" /></Field>
      <Field label="Alimentation (%)"><NI value={(sur.propagation || {}).alimPct ?? ''} onChange={(v) => setSur({ ...sur, propagation: { ...(sur.propagation || {}), alimPct: v } })} placeholder="profil" aria-label="Alimentation du plan" /></Field>
    </div>
    <div className="lbl">Jours de tirage prévus</div>
    {J.map((x, i) => <div key={i} className="flex flex-wrap items-end gap-2"><Field label="Date"><DI value={x.date} onChange={(v) => set(i, { date: v })} aria-label={`Date du jour ${i + 1}`} /></Field><Field label="Cols (75 cL)"><NI value={x.cols} onChange={(v) => set(i, { cols: v })} aria-label={`Cols du jour ${i + 1}`} /></Field>{lect ? null : <Btn size="sm" kind="ghost" onClick={() => setJ(J.filter((y, k) => k !== i))} aria-label="Retirer le jour">✕</Btn>}</div>)}
    {lect ? null : <div className="flex flex-wrap gap-2"><Btn size="sm" onClick={() => setJ([...J, { date: J.length ? addDays(J[J.length - 1].date, 1) : todayISO(), cols: J.length ? J[J.length - 1].cols : '' }])}>＋ Jour</Btn>
      <Btn size="sm" kind="primary" onClick={() => onSave({ mixTotalL: hasNum(mix) ? num(mix) : null, jours: J.filter((x) => isoOK(x.date) && num(x.cols) > 0).map((x) => ({ date: x.date, cols: num(x.cols) })), sur })}>Enregistrer le plan</Btn></div>}
  </div>);
}
function LevainTableau({ db, R, prepId, profil, plan }) {
  const prev = levainPropagation(plan.jours || [], profil); const real = levainRealise(db, R, prepId);
  const dates = uniq([...prev.rows.map((r) => r.date), ...real.map((r) => r.date)]).sort();
  return (<div className="tblwrap" data-levain-propagation=""><table className="tbl"><thead><tr><th>Date</th><th className="r">Cols prévus</th><th className="r">Levain avant tirage</th><th className="r">Tiré prévu / réel</th><th className="r">Restant prévu</th><th className="r">Liqueur</th><th className="r">Vin de base</th><th className="r">Eau déchlorée</th><th className="r">Phosphates</th><th className="r">Alimentation réelle</th></tr></thead>
    <tbody>{dates.map((d) => { const p = prev.rows.find((r) => r.date === d) || {}; const x = real.find((r) => r.date === d) || {}; return (<tr key={d}><td className="num">{fmtDate(d)}</td><td className="r num">{p.cols ? fmt(p.cols) : '—'}</td><td className="r num">{p.avantL != null ? litres(p.avantL) : '—'}</td>
      <td className="r num">{p.tireL != null ? litres(p.tireL) : '—'} / {x.tireL ? litres(x.tireL) : '—'}</td><td className="r num">{p.restantL != null ? litres(p.restantL) : '—'}</td><td className="r num">{p.liqueurL ? litres(p.liqueurL) : '—'}</td><td className="r num">{p.vinL ? litres(p.vinL) : '—'}</td><td className="r num">{p.eauL ? litres(p.eauL) : '—'}</td><td className="r num">{p.phosG ? `${fmt(p.phosG)} g` : '—'}</td><td className="r num">{x.alimL ? litres(x.alimL) : '—'}</td></tr>); })}</tbody>
    <tfoot><tr><td>Total</td><td className="r num">{fmt(prev.total.mixL / 0.75)}</td><td /><td className="r num">{litres(prev.total.tireL)}</td><td /><td className="r num">{litres(prev.total.liqueurL)}</td><td className="r num">{litres(prev.total.vinL)}</td><td className="r num">{litres(prev.total.eauL)}</td><td className="r num">{`${fmt(prev.total.phosG)} g`}</td><td /></tr></tfoot></table></div>);
}
function LevainEtapesTable({ etapes, onSaisir }) {
  return (<Tbl rows={etapes.map((e) => ({ ...e, id: e.etape }))} cols={[
    { h: 'Étape', r: (e) => <b>{levainEtapeLabel(e.etape)}</b> }, { h: 'Volume total', cls: 'r', r: (e) => <span className="num">{litres(e.totalL)}</span> },
    { h: 'Apports', r: (e) => <span className="text-sm">{[e.lsaKg ? `levure sèche ${fmt(e.lsaKg, 2)} kg` : '', e.activateurKg ? `activateur ${fmt(e.activateurKg, 2)} kg` : '', e.eauL ? `eau ${litres(e.eauL)}` : '', e.liqueurL ? `liqueur ${litres(e.liqueurL)}` : '', e.vinL ? `vin ${litres(e.vinL)}` : '', e.dapG ? `phosphates ${fmt(e.dapG)} g` : ''].filter(Boolean).join(' · ')}</span> },
    { h: 'Température', r: (e) => <span className="num">{e.temp ? `${fmt(e.temp)} °C${e.tempMax ? ` (≤ ${fmt(e.tempMax)})` : ''}` : '—'}</span> },
    { h: '', r: (e) => (onSaisir ? <Btn size="sm" onClick={() => onSaisir(e)}>Saisir</Btn> : null) }]} />);
}
function LevainRapport({ db, R, prepId, refEl }) {
  const p = R.preps[prepId] || {}; const { plan } = levainPlanDe(db, prepId); const profil = tirageProfil(db, plan.sur); const prev = levainPropagation(plan.jours || [], profil);
  const et = levainEtapes({ mixTotalL: num(plan.mixTotalL) || prev.total.mixL, levainJour1L: prev.levainJour1L }, profil);
  return (<div ref={refEl} className="report" data-levain-rapport="">
    <ReportHead title={`Levain ${p.code || ''}`} sub={`Plan de préparation et de propagation · ${qLabel(p.qualif)} · levain ${fmt(num(profil.levainPct), 1)} %`} />
    <h3>Préparation</h3><LevainEtapesTable etapes={et} />
    <h3>Propagation</h3><LevainTableau db={db} R={R} prepId={prepId} profil={profil} plan={plan} />
    <p className="muted" style={{ fontSize: 10.5 }}>Densité au mustimètre matin et soir avant l’aération : au-dessus de {fmt(num(profil.etapes.densiteMin))} ; sinon ajouter {fmt(num(profil.etapes.rechargeGL))} g/L de sucre. Valeurs à vérifier avec votre œnologue.</p>
  </div>);
}
function LevainImpression({ prepId, onClose }) {
  const { db, R } = useApp(); const ref = useRef(null); const out = useReportOutput(ref, `levain-${slug((R.preps[prepId] || {}).code || 'levain')}`, { orientation: 'paysage' });
  return <Sheet wide title="Imprimer le plan du levain" sub="A4 paysage" onClose={onClose} footer={<><Btn onClick={onClose}>Fermer</Btn><BoutonsSortie out={out} /></>}><div className="overflow-x-auto"><LevainRapport db={db} R={R} prepId={prepId} refEl={ref} /></div></Sheet>;
}
// étape, alimentation ou relevé d'un levain (opération « alimentation »)
function AlimentationForm({ prepId: prepId0, editId, preset, onClose }) {
  const { db, R, act, confirm, defaultDate, moi, uid, toast } = useApp(); const old = editId ? db.ops.find((o) => o.id === editId) : null;
  const [f, setF] = useState(() => { const o = old || {}; const pr = preset || {}; return { date: o.date || pr.date || defaultDate, heure: o.heure || pr.heure || '', prepId: o.prepId || prepId0 || pr.prepId || '', etape: o.etape || pr.etape || 'alimentation',
    sourcePortionId: o.sourcePortionId || pr.sourcePortionId || '', sourceVolL: S_(o.sourceVolL ?? pr.sourceVolL), liqueurId: ((o.prepUses || [])[0] || {}).prepId || pr.liqueurId || '', liqueurL: S_(((o.prepUses || [])[0] || {}).volL ?? pr.liqueurL),
    eauL: S_(o.eauL ?? pr.eauL), autreL: S_(o.autreL ?? pr.autreL), volMesureL: S_(o.volMesureL), lignes: LGN(o.lignes || pr.lignes), notes: o.notes || pr.notes || '', operateurs: o.operateurs || (moi ? [moi] : []),
    m: { ...(o.mesures || {}), ...(pr.mesures || {}) } }; });
  const upd = (p) => setF((x) => ({ ...x, ...p })); const setM = (p) => setF((x) => ({ ...x, m: { ...x.m, ...p } }));
  const Rd = useRd(db, f.date, editId); const lev = Rd.preps[f.prepId] || R.preps[f.prepId] || {};
  const liqueurs = Object.values(Rd.preps).filter((p) => p.ptype === 'liqueur_tirage' && (p.remaining > 0.05 || p.id === f.liqueurId));
  const enregistrer = async () => {
    if (!isoOK(f.date)) { toast('Choisissez une date.', 'bad'); return; } if (!f.prepId) { toast('Choisissez le levain.', 'bad'); return; }
    if (f.sourceVolL && num(f.sourceVolL) > 0 && !f.sourcePortionId) { toast('Choisissez la cuve du vin de base.', 'bad'); return; }
    if (num(f.liqueurL) > 0 && !f.liqueurId) { toast('Choisissez la liqueur de tirage.', 'bad'); return; }
    const al = num(f.liqueurL) > 0 ? tirageRevendicationAlertes(db, Rd, lev.qualif, [f.liqueurId]) : [];
    if (al.length && !(await confirm({ title: 'Revendication incompatible', body: al.join(' '), ok: 'Enregistrer quand même', danger: true }))) return;
    const mes = {}; Object.keys(f.m || {}).forEach((k) => { const v = f.m[k]; if (typeof v === 'boolean' ? v : String(v ?? '').trim() !== '') mes[k] = typeof v === 'boolean' ? v : hasNum(v) ? num(v) : String(v).trim(); });
    const spec = { type: 'alimentation', date: f.date, prepId: f.prepId, etape: f.etape, ...(f.heure ? { heure: f.heure } : {}), notes: f.notes, ...(f.sourcePortionId && num(f.sourceVolL) > 0 ? { sourcePortionId: f.sourcePortionId, sourceVolL: num(f.sourceVolL) } : {}),
      ...(f.liqueurId && num(f.liqueurL) > 0 ? { prepUses: [{ prepId: f.liqueurId, volL: num(f.liqueurL) }] } : {}), ...(num(f.eauL) > 0 ? { eauL: num(f.eauL) } : {}), ...(num(f.autreL) > 0 ? { autreL: num(f.autreL) } : {}),
      ...(hasNum(f.volMesureL) ? { volMesureL: num(f.volMesureL) } : {}), lignes: cleanLignes(f.lignes), ...(Object.keys(mes).length ? { mesures: mes } : {}), ...(operateursValides(db, f.operateurs).length ? { operateurs: operateursValides(db, f.operateurs) } : {}) };
    const r = act((d) => opSave(d, spec, editId, { par: uid }), old ? 'Suivi du levain modifié.' : 'Suivi du levain enregistré.'); if (r && r.ok) onClose();
  };
  return (<FormSheet wide title={`${old ? 'Modifier — ' : ''}Suivi du levain ${lev.code || ''}`} sub="Étape, alimentation ou relevé : vin, liqueur et eau ajoutés, levures et phosphates (n° de lot), températures, densité, aérations, contrôle du laboratoire." onClose={onClose} onSave={enregistrer}>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))' }}>
      <Field label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} aria-label="Date" /></Field><Field label="Heure"><TI value={f.heure} onChange={(v) => upd({ heure: v })} placeholder="hh:mm" aria-label="Heure" /></Field>
      <Field label="Étape"><SI plain value={f.etape} onChange={(v) => upd({ etape: v })} options={LEVAIN_ETAPES.map((x) => ({ value: x.id, label: x.label }))} aria-label="Étape du levain" /></Field>
      {prepId0 ? null : <Field label="Levain"><SI plain value={f.prepId} onChange={(v) => upd({ prepId: v })} options={[{ value: '', label: 'Levain…' }, ...Object.values(Rd.preps).filter((p) => p.ptype === 'levain').map((p) => ({ value: p.id, label: p.code, donnee: true }))]} aria-label="Levain" /></Field>}
    </div>
    <Group label="Ajouts"><div className="grid gap-2">
      <div className="grid2"><PortionSelect db={db} Rd={Rd} value={f.sourcePortionId} onChange={(v) => upd({ sourcePortionId: v })} placeholder="Vin de base : aucun" /><VI value={f.sourceVolL} onChange={(v) => upd({ sourceVolL: v })} placeholder="Vin (hL)" aria-label="Vin de base ajouté" /></div>
      <div className="grid2"><SI plain value={f.liqueurId} onChange={(v) => upd({ liqueurId: v })} options={[{ value: '', label: 'Liqueur : aucune' }, ...liqueurs.map((p) => ({ value: p.id, label: `${p.code} · ${qLabel(p.qualif)} · reste ${fmtL(p.remaining)}`, donnee: true }))]} aria-label="Liqueur de tirage" /><VI value={f.liqueurL} onChange={(v) => upd({ liqueurL: v })} placeholder="Liqueur (hL)" aria-label="Liqueur ajoutée" /></div>
      <div className="grid2"><Field label="Eau déchlorée (hL)"><VI value={f.eauL} onChange={(v) => upd({ eauL: v })} aria-label="Eau ajoutée" /></Field><Field label="Autres ajouts (hL)" help="Levures réhydratées, activateur… s’ils changent le volume."><VI value={f.autreL} onChange={(v) => upd({ autreL: v })} aria-label="Autres ajouts" /></Field></div>
      <LignesEditor db={db} Rd={Rd} lignes={f.lignes} onChange={(l) => upd({ lignes: l })} qualif={lev.qualif} vol={num(lev.remaining)} cats={['oeno', 'aux']} hideDose addLabel="＋ Levures, activateur, phosphates…" />
    </div></Group>
    <Group label="Relevés"><div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
      <Field label="Température visée (°C)"><NI value={f.m.tempCible ?? ''} onChange={(v) => setM({ tempCible: v })} /></Field><Field label="Température relevée (°C)"><NI value={f.m.tempReleve ?? ''} onChange={(v) => setM({ tempReleve: v })} aria-label="Température relevée" /></Field>
      <Field label="Densité (mustimètre)"><NI value={f.m.densite ?? ''} onChange={(v) => setM({ densite: v })} aria-label="Densité du levain" /></Field>
      <Field label="Levures (millions/mL)"><NI value={f.m.populationMml ?? ''} onChange={(v) => setM({ populationMml: v })} /></Field><Field label="Viabilité (%)"><NI value={f.m.viabilitePct ?? ''} onChange={(v) => setM({ viabilitePct: v })} /></Field>
      <Field label="Volume mesuré (hL)" help="Recale le levain disponible."><VI value={f.volMesureL} onChange={(v) => upd({ volMesureL: v })} aria-label="Volume mesuré du levain" /></Field>
    </div>
    <div className="mt-2 flex flex-wrap gap-4"><Check checked={f.m.aerationMatin} onChange={(v) => setM({ aerationMatin: v })} label="Aération du matin" /><Check checked={f.m.aerationSoir} onChange={(v) => setM({ aerationSoir: v })} label="Aération du soir" /></div>
    {hasNum(f.m.densite) && num(f.m.densite) < num(tirageProfil(db).etapes.densiteMin) ? <Notice tone="warn">{`Densité sous ${fmt(num(tirageProfil(db).etapes.densiteMin))} : ajouter environ ${fmt(num(tirageProfil(db).etapes.rechargeGL))} g/L de sucre (1 L de liqueur à 500 g/L pour 25 L de levain).`}</Notice> : null}</Group>
    <OperateursPicker value={f.operateurs} onChange={(v) => upd({ operateurs: v })} />
    <Field label="Notes"><TA value={f.notes} onChange={(v) => upd({ notes: v })} rows={2} /></Field>
  </FormSheet>);
}
function LevainSheet({ prepId, onClose }) {
  const { db, R, act, uid, confirm } = useApp(); const lect = useLectureSeule('tirage'); const p = R.preps[prepId];
  const [form, setForm] = useState(null); const [imp, setImp] = useState(false); const [ed, setEd] = useState(false); const [jour, setJour] = useState(todayISO());
  if (!p) return <Sheet title="Levain introuvable" onClose={onClose}><Empty>Ce levain n’existe plus.</Empty></Sheet>;
  const { plan } = levainPlanDe(db, prepId); const profil = tirageProfil(db, plan.sur); const prev = levainPropagation(plan.jours || [], profil);
  const etapes = levainEtapes({ mixTotalL: num(plan.mixTotalL) || prev.total.mixL, levainJour1L: prev.levainJour1L }, profil);
  const Rj = getR(db, jour); const dispo = ((Rj.preps || {})[prepId] || {}).remaining || 0; const rc = levainRecalibrer(plan.jours || [], profil, { date: jour, restantL: dispo });
  const c = prepCompo(R, prepId); const suivi = levainSuivi(db, prepId);
  const saisirEtape = (e) => setForm({ preset: { etape: e.etape, eauL: e.eauL ? String(Math.round(e.eauL * 100) / 100) : '', liqueurL: e.liqueurL ? String(Math.round(e.liqueurL * 100) / 100) : '', sourceVolL: e.vinL ? String(Math.round(e.vinL * 100) / 100) : '', mesures: { tempCible: e.temp || '' } } });
  const suppr = async (o) => { if (await confirm({ title: 'Supprimer ce suivi ?', body: `Suivi du levain du ${fmtDate(o.date)} (${levainEtapeLabel(o.etape)}).`, ok: 'Supprimer', danger: true })) act((d) => opDelete(d, o.id), 'Suivi supprimé.'); };
  return (<Sheet wide title={<span>🧫 Levain <span translate="no">{p.code}</span></span>} sub={`${qLabel(p.qualif)} · préparé le ${fmtDate(p.date)} · disponible aujourd’hui ${litres(p.remaining)}`} onClose={onClose}
    footer={<><Btn onClick={() => setImp(true)}>🖨 Plan du levain…</Btn><Btn onClick={onClose}>Fermer</Btn></>}>
    <div data-levain={prepId}>
      <div className="mb-4 flex flex-wrap gap-2"><QChip id={p.qualif} /><Chip>{`Disponible : ${litres(p.remaining)}`}</Chip><Chip>{`Vin ${fmt(c.vin * 100, 0)} % · liqueur ${fmt(c.liqueur * 100, 0)} % · eau ${fmt(c.eau * 100, 0)} %`}</Chip>{p.ecartL ? <Chip tone="warn">{`Écart de mesure : ${litres(p.ecartL)}`}</Chip> : null}</div>
      <Sec title="Plan de propagation (prévu / réalisé)" right={lect ? null : <Btn size="sm" onClick={() => setEd(!ed)}>{ed ? 'Fermer le plan' : '✎ Jours et taux'}</Btn>}>
        {ed ? <LevainPlanEditeur plan={plan} lect={lect} onSave={(pl) => { const r = act((d) => levainPlanSet(d, prepId, pl), 'Plan du levain enregistré.'); if (r && r.ok) setEd(false); }} /> : null}
        {(plan.jours || []).length ? <LevainTableau db={db} R={R} prepId={prepId} profil={profil} plan={plan} /> : <Empty>Indiquez les jours de tirage prévus pour calculer la propagation.</Empty>}
      </Sec>
      <Sec title="Recalibrer"><div className="grid gap-2" data-levain-recalibrer="">
        <div className="flex flex-wrap items-end gap-2"><Field label="Après le tirage du"><DI value={jour} onChange={setJour} aria-label="Date du recalibrage" /></Field><span className="text-sm">{`Levain disponible : ${litres(dispo)} · besoin pour la suite : ${litres(rc.besoinL)}`}</span></div>
        {(plan.jours || []).length && jour < plan.jours[0].date && !R.prepUse.some((u) => u.prepId === prepId && u.date <= jour) ? <p className="text-sm" data-levain-avant="">{`Avant le premier jour de tirage (${fmtDate(plan.jours[0].date)}) : suivez la préparation par étapes ci-dessous pour avoir ${litres(rc.plan.rows.length ? levainPropagation(plan.jours, profil).levainJour1L : 0)} le premier jour.`}</p> : rc.alimL > 0 ? <p className="text-sm" data-levain-alim="">{`À ajouter : ${litres(rc.liqueurL)} de liqueur, ${litres(rc.vinL)} de vin de base, ${litres(rc.eauL)} d’eau déchlorée, ${fmt(rc.phosG)} g de phosphates.`} {lect ? null : <Btn size="sm" onClick={() => setForm({ preset: { date: jour, etape: 'alimentation', liqueurL: String(Math.round(rc.liqueurL * 100) / 100), sourceVolL: String(Math.round(rc.vinL * 100) / 100), eauL: String(Math.round(rc.eauL * 100) / 100) } })}>Saisir cette alimentation</Btn>}</p>
          : <p className="text-sm">{rc.excedentL > 0 ? `Levain suffisant (${litres(rc.excedentL)} d’avance) : pas d’alimentation nécessaire pour le plan restant.` : 'Plus de tirage prévu après cette date.'}</p>}
        {rc.alertes.map((a, i) => <Notice key={i} tone="warn">{a}</Notice>)}
        <p className="help">Le plan restant se recalcule à partir du levain réellement disponible (tirages enregistrés, alimentations, volume mesuré) : modifiez les jours et les cols prévus dès que le rythme change.</p></div></Sec>
      <Sec title="Préparation par étapes"><LevainEtapesTable etapes={etapes} onSaisir={lect ? null : saisirEtape} /></Sec>
      <Sec title="Journal du levain" right={lect ? null : <Btn size="sm" kind="primary" onClick={() => setForm({})}>＋ Étape, alimentation ou relevé</Btn>}>
        <Tbl rows={suivi} empty="Aucune étape enregistrée." cols={[{ h: 'Date', r: (o) => <span className="num">{fmtDate(o.date)}{o.heure ? ` ${o.heure}` : ''}</span> }, { h: 'Étape', r: (o) => levainEtapeLabel(o.etape) },
          { h: 'Ajouts', r: (o) => <span className="text-xs">{[num(o.sourceVolL) ? `vin ${fmtL(o.sourceVolL)}` : '', (o.prepUses || []).length ? `liqueur ${fmtL(sum(o.prepUses, (u) => u.volL))}` : '', num(o.eauL) ? `eau ${fmtL(o.eauL)}` : '', lignesText(db, o.lignes)].filter(Boolean).join(' · ') || '—'}</span> },
          { h: 'Relevés', r: (o) => { const m = o.mesures || {}; return <span className="text-xs">{[hasNum(m.tempReleve) ? `${fmt(m.tempReleve, 1)} °C` : '', hasNum(m.densite) ? `d ${fmt(m.densite, 1)}` : '', m.aerationMatin ? 'aération matin' : '', m.aerationSoir ? 'aération soir' : '', hasNum(m.populationMml) ? `${fmt(m.populationMml)} M/mL` : '', hasNum(m.viabilitePct) ? `viabilité ${fmt(m.viabilitePct)} %` : '', hasNum(o.volMesureL) ? `mesuré ${fmtL(o.volMesureL)}` : ''].filter(Boolean).join(' · ') || '—'}</span>; } },
          { h: 'Opérateur(s)', r: (o) => <OperateursChips ids={o.operateurs} /> },
          { h: '', r: (o) => (lect || isLocked(db, o.date) ? null : <div className="flex gap-1"><Btn size="sm" onClick={() => setForm({ editId: o.id })}>Modifier</Btn><Btn size="sm" kind="ghost" onClick={() => suppr(o)}>Supprimer</Btn></div>) }]} />
      </Sec>
    </div>
    {form ? <AlimentationForm prepId={prepId} editId={form.editId} preset={form.preset} onClose={() => setForm(null)} /> : null}
    {imp ? <LevainImpression prepId={prepId} onClose={() => setImp(false)} /> : null}
  </Sheet>);
}
function TiragePreparer({ onForm }) {
  const { db, R } = useApp(); const [lev, setLev] = useState(null);
  const L = Object.values(R.preps).filter((p) => p.ptype === 'levain').sort(desc_); const Q = Object.values(R.preps).filter((p) => p.ptype === 'liqueur_tirage').sort(desc_);
  const M = Object.values(R.preps).filter((p) => p.ptype === 'pied_mlf').sort(desc_); // 0.48.0-alpha.1 (U07) : pieds de cuve créés ici aussi
  const opDe = (p) => (db.ops || []).find((x) => x.id === p.opId) || (db.ops || []).find((x) => x.prepId === p.id && x.type === 'preparation');
  return (<div data-tirage-preparer="">
    <Sec title="Calculer"><TirageCalculateur onPreparer={onForm} /></Sec>
    <Sec title="Levains de tirage" data-vg="levains" right={<Btn kind="primary" onClick={() => onForm({ type: 'preparation', preset: { ptype: 'levain' } })}>＋ Levain</Btn>}>
      <TblCartes rows={L} empty="Aucun levain : partez du calculateur ou créez-en un." onRow={(p) => setLev(p.id)} cols={[{ h: 'Levain', r: (p) => <b translate="no">{p.code}</b> }, { h: 'Revendication', r: (p) => <QChip id={p.qualif} /> }, { h: 'Préparé le', r: (p) => <span className="num">{fmtDate(p.date)}</span> },
        { h: 'Disponible', cls: 'r', r: (p) => <b className={cx('num', p.remaining < -0.01 && 'text-bad')}>{litres(p.remaining)}</b> }, { h: 'Lots servis', r: (p) => <span className="flex flex-wrap gap-x-2">{uniq(R.prepUse.filter((u) => u.prepId === p.id).map((u) => u.lotId).filter(Boolean)).map((id) => <LotLink key={id} id={id} />)}</span> },
        { h: 'Suivi', r: (p) => `${levainSuivi(db, p.id).length} étape(s)` }, { h: '', r: (p) => <Btn size="sm" onClick={(e) => { e.stopPropagation(); setLev(p.id); }}>Ouvrir</Btn> }]} />
    </Sec>
    <Sec title="Liqueurs de tirage" data-liqueurs-tirage="" right={<Btn onClick={() => onForm({ type: 'preparation', preset: { ptype: 'liqueur_tirage' } })}>＋ Fonte de liqueur</Btn>}>
      <TblCartes rows={Q} empty="Aucune liqueur de tirage." cols={[{ h: 'Liqueur', r: (p) => <b translate="no">{p.code}</b> }, { h: 'Revendication', r: (p) => <QChip id={p.qualif} /> }, { h: 'Date', r: (p) => <span className="num">{fmtDate(p.date)}</span> },
        { h: 'Titre', r: (p) => { const o = (db.ops || []).find((x) => x.prepId === p.id && x.type === 'preparation') || {}; return o.fonte && o.fonte.titreGL ? `${fmt(o.fonte.titreGL)} g/L${o.fonte.sucreKg ? ` · ${fmt(o.fonte.sucreKg, 1)} kg` : ''}` : '—'; } },
        { h: 'Préparé', cls: 'r', r: (p) => <span className="num">{litres(p.vol)}</span> }, { h: 'Reste', cls: 'r', r: (p) => <b className="num">{litres(p.remaining)}</b> },
        { h: 'Utilisée pour', r: (p) => <span className="flex flex-wrap gap-x-2">{uniq(R.prepUse.filter((u) => u.prepId === p.id).map((u) => u.lotId).filter(Boolean)).map((id) => <LotLink key={id} id={id} />)}</span> },
        { h: '', r: (p) => (opDe(p) ? <OpBtns op={opDe(p)} onEdit={(id) => onForm({ editId: id })} /> : null) }]} />
    </Sec>
    <Sec title="Pieds de cuve malolactiques" data-pieds-cuve="" right={<Btn onClick={() => onForm({ type: 'preparation', preset: { ptype: 'pied_mlf' } })}>＋ Pied de cuve malolactique</Btn>}>
      <PrepsTable rows={M} onEdit={(id) => onForm({ editId: id })} empty="Aucun pied de cuve malolactique." />
    </Sec>
    {lev ? <LevainSheet prepId={lev} onClose={() => setLev(null)} /> : null}
  </div>);
}

// Paramètres › Calculs œnologiques › profil de tirage (valeurs « à vérifier », enregistrées d'un bloc)
function TirageProfilCard() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('params'); const p0 = tirageProfil(db);
  const [p, setP] = useState(() => clone(p0)); const set = (k, v) => setP({ ...p, [k]: v }); const setE = (k, v) => setP({ ...p, etapes: { ...p.etapes, [k]: v } }); const setPr = (k, v) => setP({ ...p, propagation: { ...p.propagation, [k]: v } });
  const F = (label, v, on, help) => <Field label={label} help={help}><NI value={v ?? ''} onChange={on} aria-label={label} /></Field>;
  const adj = p.adjuvants || []; const setA = (i, patch) => set('adjuvants', adj.map((a, k) => (k === i ? { ...a, ...patch } : a)));
  return (<div className="card p-4 grid gap-3" data-tirage-profil="">
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
{F('Levain incorporé (%)', p.levainPct, (v) => set('levainPct', v))}
      {F('Liqueur de tirage (g/L)', p.titreLiqueurGL, (v) => set('titreLiqueurGL', v))}{F('Augmentation de volume du saccharose — calculs (L/kg)', p.volSucreLkg, (v) => set('volSucreLkg', v), 'Valeur physique, calculs (0,6329) : calculateur de tirage, fonte de liqueur, simulateur d’enrichissement ; 1 kg de sucre + 1,37 L de vin ≈ 2 L de liqueur à 500 g/L.')}{F('Augmentation de volume du saccharose — déclarations (L/kg)', p.volSucreDeclLkg, (v) => set('volSucreDeclLkg', v), 'Valeur douanière, déclarations (0,66) : volume du sucre de la déclaration préalable de tirage.')}
      {F('Part d’eau du levain (%)', p.levainEauPct, (v) => set('levainEauPct', v), 'VRTP prévisionnel.')}{F('Part de liqueur du levain (%)', p.levainLiqueurPct, (v) => set('levainLiqueurPct', v))}
      {F('Volume préparé en plus (%)', p.remplissagePct, (v) => set('remplissagePct', v))}<Field label="Points de densité par g/L (déduits)" help="Correction du point de tirage : 1 ÷ le coefficient « g/L de sucre par point de densité » (Paramètres de calcul ci-dessus)."><div className="num pt-2" data-dens-pt-gl="">{fmt(densPtParGL(db), 3)}</div></Field>
      {F('Repère sucre (kg/hL)', p.sucreMaxKgHL, (v) => set('sucreMaxKgHL', v), 'Avertissement au-delà.')}
    </div>
    <div className="lbl">Préparation du levain</div>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
      {F('Levure sèche (g/hL de mixtion)', p.etapes.lsaGhL, (v) => setE('lsaGhL', v))}{F('Activateur (g/hL de mixtion)', p.etapes.activateurGhL, (v) => setE('activateurGhL', v))}{F('Eau de réhydratation (L/kg de levure)', p.etapes.eauRehydLkg, (v) => setE('eauRehydLkg', v))}
      {F('Densité minimale du levain', p.etapes.densiteMin, (v) => setE('densiteMin', v))}
    </div>
    <div className="lbl">Propagation</div>
    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
      {F('Alimentation quotidienne (%)', p.propagation.alimPct, (v) => setPr('alimPct', v))}{F('dont liqueur (%)', p.propagation.liqueurPct, (v) => setPr('liqueurPct', v))}{F('dont eau (%)', p.propagation.eauPct, (v) => setPr('eauPct', v))}
      {F('Alimentation maximale (%)', p.propagation.alimMaxPct, (v) => setPr('alimMaxPct', v), 'Au-delà : second levain conseillé.')}
    </div>
    <Group label="Adjuvants de remuage (dose par hL de mixtion)"><div className="grid gap-2">
      {adj.map((a, i) => <div key={i} className="flex flex-wrap items-end gap-2"><Field label="Adjuvant"><TI value={a.nom || ''} onChange={(v) => setA(i, { nom: v })} aria-label="Adjuvant" /></Field><Field label="Dose (L/hL)"><NI value={a.doseLhL ?? ''} onChange={(v) => setA(i, { doseLhL: v })} aria-label="Dose de l’adjuvant" /></Field>{lect ? null : <Btn size="sm" kind="ghost" onClick={() => set('adjuvants', adj.filter((x, k) => k !== i))} aria-label="Retirer l’adjuvant">✕</Btn>}</div>)}
      {lect ? null : <div><Btn size="sm" onClick={() => set('adjuvants', [...adj, { id: `adj${Date.now().toString(36)}`, nom: '', doseLhL: '' }])}>＋ Adjuvant</Btn></div>}</div></Group>
    {lect ? null : <div className="flex flex-wrap gap-2"><Btn kind="primary" onClick={() => act((d) => tirageProfilSet(d, { ...p, adjuvants: adj.filter((a) => String(a.nom || '').trim()).map((a) => ({ ...a, nom: String(a.nom).trim(), doseLhL: num(a.doseLhL) })) }, uid), 'Profil de tirage enregistré.')}>Enregistrer le profil</Btn><Btn onClick={() => setP(clone(TIRAGE_PROFIL_DEFAUT()))}>Valeurs par défaut</Btn></div>}
    <p className="help">Valeurs par défaut tirées des méthodes de cave courantes, à vérifier avec votre œnologue ; chaque levain et chaque calcul peut les ajuster. VRTP au tirage : au plus {TIRAGE_VRTP_MAX_PCT} % des volumes mis en œuvre ({TIRAGE_SOURCE_VRTP}).</p>
  </div>);
}
