/* ============ PARAMÈTRES › RÉGION & TYPES DE VINS (0.33.0-alpha.1) ============
   Région (bassins français, pays) et types de vins produits → liste à cocher des changements proposés (aperçu), puis « Appliquer ».
   Personnalisations jamais écrasées (voir 16o-profils.js). Raccourcis : Champagne, Crémant + vins tranquilles, vins tranquilles, rouges. */
function ProfilViticoleView() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('params'); const pv = profilViticole(db); useLangue();
  const [region, setRegion] = useState(pv.region); const [types, setTypes] = useState(pv.types); const [decoches, setDecoches] = useState([]);
  const plan = useMemo(() => profilPlan(db, region, types), [db, region, types]);
  const R = profilRegionDef(region) || {}; const AT = useMemo(() => appTypesRegion(region), [region]); /* 0.46.0-alpha.2 : types hors appellation */
  const pris = plan.filter((x) => !decoches.includes(x.id));
  const basculer = (t) => { setTypes((L) => (L.includes(t) ? L.filter((x) => x !== t) : [...L, t])); setDecoches([]); };
  const choisirRegion = (r) => { setRegion(r); setDecoches([]); const d = profilRegionDef(r); if (d && !pv.defini) setTypes(d.types); };
  const raccourci = (x) => { if (x.region) setRegion(x.region); setTypes(x.types); setDecoches([]); };
  const appliquer = () => act((d) => profilAppliquer(d, region, types, pris.map((x) => x.id), uid), pris.length ? `Profil appliqué : ${pris.length} changement(s).` : 'Profil enregistré.');
  const groupes = ['France', 'Étranger', 'Autre'];
  return (
    <div className="space-y-5" data-profil="">
      <Aide id="profil" resume="Région et types de vins produits : onglets, opérations, cépages, fractions et seuils adaptés.">
        <span>Adaptez Œnotrack à votre exploitation : onglets, opérations, stades, cépages, appellations, fractions, pressoir et seuils indicatifs.</span>{' '}
        <span>Chaque changement est proposé dans la liste ci-dessous : décochez ce que vous ne voulez pas. Rien n’est supprimé ni renommé, et vos réglages faits à la main sont gardés.</span>
      </Aide>
      {pv.defini ? <p className="text-sm text-ink2" data-profil-actuel=""><span>Profil actuel :</span> <b>{(profilRegionDef(pv.region) || {}).nom}</b> · <span>{pv.types.map((t) => (PROFIL_TYPES.find((x) => x[0] === t) || [t, t])[1]).join(', ')}</span>{pv.le ? <span>{` · appliqué le ${fmtDate(pv.le)}`}</span> : null}</p> : null}
      <Sec title="Raccourcis">
        <div className="flex flex-wrap gap-2" data-profil-raccourcis="">{PROFIL_RACCOURCIS.map((x) => <Btn key={x.id} onClick={() => raccourci(x)} disabled={lect} data-raccourci={x.id}>{x.label}</Btn>)}</div>
        <p className="help mt-2">Un domaine mixte (ex. crémant et vins tranquilles) se règle en un clic ; ajustez ensuite la région et les types.</p>
      </Sec>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        <Field label="Région">
          <select className="inp" value={region} disabled={lect} onChange={(e) => choisirRegion(e.target.value)} aria-label="Région viticole">
            {groupes.map((g) => <optgroup key={g} label={traduire(g)}>{PROFIL_REGIONS.filter((r) => r.pays === g).map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}</optgroup>)}
          </select>
        </Field>
        <div><span className="lbl">Types de vins produits</span>
          <div className="space-y-1" data-profil-types="">{PROFIL_TYPES.map(([t, l]) => { const hors = !AT.libre && !AT.possibles.includes(t); return <label key={t} className="flex flex-wrap items-center gap-2 text-sm"><input type="checkbox" checked={types.includes(t)} disabled={lect} onChange={() => basculer(t)} data-type={t} /><span>{l}</span>{hors ? <Chip tone={types.includes(t) ? 'warn' : ''} title="Aucune appellation de la région n’autorise ce type de vin : vin sans indication géographique." data-hors-appellation={t}>hors appellation</Chip> : null}</label>; })}</div>
          <p className="help mt-2" data-profil-appellations="">{AT.nb.total ? (AT.libre ? `${AT.nb.total} appellation(s) dans le référentiel ; elles ne restreignent pas le type de vin.` : `${AT.nb.total} appellation(s) dans le référentiel (AOP : ${AT.nb.aop}, IGP : ${AT.nb.igp}) : un type qu’aucune n’autorise est signalé « hors appellation » (vins sans IG), sans être interdit.`) : 'Aucune appellation de cette région dans le référentiel.'}</p>
        </div>
      </div>
      <Sec title={`Changements proposés (${plan.length})`}>
        {!types.length ? <Empty>Choisissez au moins un type de vin.</Empty> : !plan.length ? <Empty>Rien à changer : Œnotrack est déjà réglé pour ce profil.</Empty> : (
          <div className="space-y-3" data-profil-plan="">
            {PROFIL_GROUPES.filter(([g]) => plan.some((x) => x.groupe === g)).map(([g, titre]) => (
              <div key={g} className="card p-3" data-profil-groupe={g}><h4 className="mb-2 font-semibold">{titre}</h4>
                <ul className="space-y-1">{plan.filter((x) => x.groupe === g).map((x) => (
                  <li key={x.id}><label className="flex flex-wrap items-center gap-2 text-sm" data-changement={x.id}>
                    <input type="checkbox" checked={!decoches.includes(x.id)} disabled={lect} onChange={() => setDecoches((L) => (L.includes(x.id) ? L.filter((y) => y !== x.id) : [...L, x.id]))} />
                    <span translate={['cepages', 'appellations'].includes(g) ? 'no' : undefined}><b>{x.label}</b></span>
                    {x.avant ? <><span className="text-ink2">{x.avant}</span><span>→</span></> : null}<span>{x.apres}</span>
                    {x.aVerifier ? <Chip tone="warn">exemple à vérifier</Chip> : null}
                  </label></li>))}</ul>
              </div>))}
          </div>)}
        {R.enrichMax > 0 ? <p className="help mt-2">Enrichissement maximal de la zone viticole (règlement (UE) 1308/2013, annexe VIII) : relevable de 0,5 % vol les années exceptionnelles, éventuellement restreint par le cahier des charges de l’appellation.</p> : null}
      </Sec>
      {lect ? null : <div className="flex flex-wrap gap-2"><Btn kind="primary" disabled={!types.length} onClick={appliquer} data-profil-appliquer="">{`✓ Appliquer (${pris.length})`}</Btn></div>}
    </div>
  );
}
/* 0.46.0-alpha.1 — région et types de vins : un seul réglage (Paramètres › Région & types de vins) ; l'identité de la société et les réglages
   du pressoir en montrent le résumé (région, types, spécificités champenoises) avec un lien vers ce réglage */
function ProfilResume() {
  const { db, setTab } = useApp(); const pv = profilViticole(db); const R = profilRegionDef(pv.region) || {};
  return (<div className="flex flex-wrap items-center gap-3" data-profil-resume="">
    <div className="text-sm"><b translate="no">{pv.defini ? R.nom : 'Région non précisée'}</b>{pv.types.length ? <span className="text-ink2">{` · ${pv.types.map((t) => (PROFIL_TYPES.find((x) => x[0] === t) || [t, t])[1]).join(', ')}`}</span> : null}
      <div className="help">{champenois(db) ? 'Spécificités champenoises actives (cahier des charges de l’AOC Champagne au pressoir, échelle des crus).' : 'Spécificités champenoises désactivées.'}</div></div>
    <Btn className="ml-auto" onClick={() => setTab('params', 'profil')} data-profil-regler="">🍇 Régler la région et les types de vins</Btn>
  </div>);
}
