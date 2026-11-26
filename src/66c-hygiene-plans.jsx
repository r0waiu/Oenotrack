/* ============ HYGIÈNE › À FAIRE, PLAN DE NETTOYAGE, MAINTENANCE (0.26.0-alpha.1) ============
   Moteur : 16c-plans-hygiene.js (plans, règles, tâches, contrôles à la saisie). */
const ETAT_TACHE = { nonconforme: ['bad', 'Non-conformité'], retard: ['warn', 'En retard'], afaire: ['info', 'À faire'] };
function usePlanTaches() { const { db } = useApp(); return useMemo(() => planTaches(db, todayISO()), [db]); }

// tâches et alertes : nettoyages dus, non-conformités à justifier, maintenance
// quoi (0.28.0-alpha.1) : 'hygiene' (sans la maintenance, dans l'onglet Équipements), 'equipements' (maintenance et vérifications), sinon tout
function HygAFaire({ quoi }) {
  const { db, act, openHyg } = useApp(); const T0 = usePlanTaches(); const [filtre, setFiltre] = useState(''); const [acq, setAcq] = useState(null); const [mt, setMt] = useState(null); const [eq, setEq] = useState(null);
  const T = useMemo(() => (quoi === 'equipements' ? [...T0.filter((x) => x.origine === 'maintenance'), ...equipAlertes(db, todayISO())] : quoi === 'hygiene' ? T0.filter((x) => x.origine !== 'maintenance') : T0), [T0, db, quoi]);
  const L = T.filter((x) => !filtre || x.origine === filtre || (filtre === 'nonconforme' && x.etat === 'nonconforme'));
  const n = (k) => T.filter((x) => x.etat === k).length; const actif = planHygieneActif(db);
  const faire = (x) => (x.origine === 'verif' ? setEq(x.equipementId) : x.origine === 'maintenance' ? setMt(x.interventionId ? { id: x.interventionId, cloturer: true } : { preset: { entreeId: x.entreeId || '', type: 'preventive' } }) : openHyg(hygPresetTache(db, x)));
  return (
    <div>
      {!actif ? <Notice tone="info" title="Plans d’hygiène en pause">{quoi === 'equipements' ? 'Aucune échéance de maintenance n’est calculée. Réactivez les plans dans Hygiène › Plan de nettoyage.' : 'Aucune tâche ni alerte n’est calculée. Réactivez-les dans l’onglet Plan de nettoyage.'}</Notice> : null}
      <Sec title={`À faire (${L.length})`} right={<SI plain value={filtre} onChange={setFiltre} options={quoi === 'equipements' ? [{ value: '', label: 'Tout' }, { value: 'maintenance', label: 'Maintenance' }, { value: 'verif', label: 'Vérifications périodiques' }] : [{ value: '', label: 'Tout' }, { value: 'nettoyage', label: 'Nettoyage et désinfection' }, ...(quoi === 'hygiene' ? [] : [{ value: 'maintenance', label: 'Maintenance' }]), { value: 'nonconforme', label: 'Non-conformités' }]} aria-label="Filtre des tâches" style={{ width: 'auto' }} />}>
        <div className="mb-3 flex flex-wrap gap-2 text-sm" data-hyg-compteurs="">{n('nonconforme') ? <Chip tone="bad"><b>{n('nonconforme')}</b> non-conformité(s)</Chip> : null}{n('retard') ? <Chip tone="warn"><b>{n('retard')}</b> en retard</Chip> : null}{n('afaire') ? <Chip tone="info"><b>{n('afaire')}</b> à faire</Chip> : null}{!T.length && actif ? <Chip tone="ok">Rien en attente</Chip> : null}</div>
        {L.length ? <div className="space-y-2" data-hyg-taches="">{L.map((x) => { const [tone, et] = ETAT_TACHE[x.etat] || ['', x.etat]; return (
          <div key={x.cle} className="card flex flex-wrap items-center gap-2 p-3" data-tache={x.cle} data-etat={x.etat}>
            <Chip tone={tone}>{et}</Chip><Chip>{x.origine === 'verif' ? '📏 vérification' : x.origine === 'maintenance' ? '🔧 maintenance' : '🧽 hygiène'}</Chip>
            <span className="min-w-0 flex-1" style={{ flexBasis: 260 }}><span>{x.msg}</span>{x.echeance && x.etat !== 'nonconforme' ? <span className="ml-2 text-xs text-ink2">{`échéance ${fmtDate(x.echeance)}`}</span> : null}</span>
            <span className="flex flex-wrap gap-1">
              <Btn size="sm" kind={x.etat === 'nonconforme' ? '' : 'primary'} onClick={() => faire(x)}>{x.origine === 'verif' ? 'Mettre à jour la vérification' : x.origine === 'maintenance' ? (x.interventionId ? 'Clore la panne' : 'Enregistrer l’intervention') : 'Enregistrer'}</Btn>
              {x.etat === 'nonconforme' ? <Btn size="sm" onClick={() => setAcq(x)} title="Non-conformité vue : indiquez pourquoi (elle ne sera plus signalée)">Justifier</Btn> : null}
            </span>
          </div>); })}</div> : <p className="help">{actif ? 'Aucune tâche : le plan de nettoyage et le plan de maintenance sont à jour.' : ''}</p>}
        {quoi === 'equipements' ? <p className="help mt-2">Les tâches viennent du plan de maintenance (échéances, pannes signalées) et des vérifications périodiques du matériel (bascules, balances, instruments, extincteurs…). Elles disparaissent dès que l’intervention ou la vérification est enregistrée.</p>
          : <p className="help mt-2"><span>{quoi === 'hygiene' ? 'Les tâches viennent du plan de nettoyage (après une vidange, avant un remplissage, au changement de revendication, chaque soir de vendange, avant et après les vendanges…) ; la maintenance est dans l’onglet Équipements. Elles disparaissent dès que l’entrée correspondante est au journal.' : 'Les tâches viennent du plan de nettoyage (après une vidange, avant un remplissage, au changement de revendication, chaque soir de vendange, avant et après les vendanges…) et du plan de maintenance. Elles disparaissent dès que l’entrée correspondante est au journal.'}</span> <span>{`Seuls les événements depuis la mise en place du plan (${fmtDate(planDepuis(db))}) sont contrôlés.`}</span></p>}
      </Sec>
      {quoi !== 'equipements' && (db.hygieneAcquits || []).length ? <Sec title={`Non-conformités justifiées (${db.hygieneAcquits.length})`}>
        <Tbl rows={[...db.hygieneAcquits].reverse().slice(0, 50)} cols={[{ h: 'Date', r: (a) => <span className="num">{fmtDate(a.date)}</span> }, { h: 'Alerte', r: (a) => <span className="text-sm">{a.msg || a.id}</span> }, { h: 'Justification', r: (a) => <span className="text-sm">{a.motif}</span> }]} />
      </Sec> : null}
      {acq ? <FormSheet title="Justifier une non-conformité" sub={acq.msg} onClose={() => setAcq(null)} onSave={() => { const r = act((d) => hygAcquitter(d, acq.cle, { motif: acq.motif, msg: acq.msg, date: todayISO() }), 'Non-conformité justifiée.'); if (r && r.ok) setAcq(null); }} saveLabel="Justifier">
        <Field label="Justification (gardée dans l’historique)" help="ex. rinçage fait mais pas enregistré ; cuve neuve ; nettoyage fait par le prestataire…"><TA value={acq.motif || ''} onChange={(v) => setAcq({ ...acq, motif: v })} rows={3} aria-label="Justification" /></Field>
      </FormSheet> : null}
      {mt ? <MaintInterventionForm id={mt.id} cloturer={mt.cloturer} preset={mt.preset} onClose={() => setMt(null)} /> : null}
      {eq ? <EquipForm id={eq} onClose={() => setEq(null)} /> : null}
    </div>
  );
}

/* ---------- plan de nettoyage et de désinfection ---------- */
// moments et produits d'une ligne du plan : chaque partie dans son élément (traduite seule ; noms de produits gardés)
const QuandPlan = ({ e }) => <>{(e.quand || []).map((q, i) => <span key={i}>{i ? ' ; ' : ''}<span>{hygLibQuand(q)}</span></span>)}</>;
const ProduitsPlan = ({ e }) => { const { db } = useApp(); const L = e.produits || []; return L.length ? <>{L.map((p, i) => { const d = p.produitId ? hygDef(db, p.produitId) : null; return <span key={i}>{i ? ' + ' : ''}{d ? <span translate="no">{d.nom}</span> : <span>{hygLib(HYG_TYPES, p.type)}</span>}{hasNum(p.conc) ? <span className="num">{` ${hygConcTxt(p.conc, p.concUnite)}`}</span> : null}</span>; })}</> : '—'; };
function PlanNettoyageView() {
  const { db, act, confirm } = useApp(); const [ed, setEd] = useState(null); const [imp, setImp] = useState(false); const actif = planHygieneActif(db); const P = planNettoyage(db);
  const charger = async () => { if (await confirm({ title: 'Rétablir le plan d’origine ?', body: 'Le plan de nettoyage reprend le modèle Œnotrack (à adapter ensuite à votre exploitation) ; vos lignes ajoutées ou modifiées sont remplacées. Le journal d’hygiène ne change pas.', ok: 'Rétablir' })) act((d) => planModeleCharger(d, 'nettoyage', true), 'Plan de nettoyage d’origine rétabli.'); };
  const del = async (e) => { if (await confirm({ title: `Retirer « ${e.libelle} » (${lbl(db, 'actionsHygiene', e.actionId)}) du plan ?`, body: 'Le journal d’hygiène ne change pas.', ok: 'Retirer', danger: true })) act((d) => planEntreeDelete(d, e.id), 'Ligne retirée du plan.'); };
  return (
    <div>
      <Notice tone="info" title="Plan de nettoyage et de désinfection (méthode HACCP)">Pour chaque zone : ce qui se nettoie, quand, avec quoi, comment, le contrôle après rinçage et qui l’enregistre. Œnotrack en tire les tâches à faire et les alertes (onglet À faire) et vous propose le rinçage dès qu’une cuve se vide. Les lignes « consigne » rappellent la bonne pratique sans alerte.</Notice>
      <div className="my-3 flex flex-wrap items-center gap-2" data-plan-reglages="">
        <Check checked={actif} onChange={(v) => act((d) => planReglages(d, { actif: v }), v ? 'Plans d’hygiène actifs.' : 'Plans d’hygiène en pause.')} label="Plans actifs (tâches et alertes)" />
        <span className="inline-flex items-center gap-2 text-sm">mis en place le<DI value={planDepuis(db)} onChange={(v) => act((d) => planReglages(d, { depuis: v }))} aria-label="Date de mise en place du plan" /></span>
        <span className="ml-auto flex flex-wrap gap-2"><Btn onClick={() => setImp(true)}>🖨 Imprimer le plan</Btn><Btn onClick={charger}>Rétablir l’origine</Btn><Btn kind="primary" onClick={() => setEd({})}>+ Ajouter une ligne</Btn></span>
      </div>
      {HYG_ZONES.map(([z, zl]) => { const L = P.filter((e) => (e.zone || 'autre') === z); if (!L.length) return null; return (
        <Sec key={z} title={`${zl} (${L.length})`}>
          <div className="space-y-2">{L.map((e) => (
            <div key={e.id} className={cx('card p-3', e.actif === false && 'opacity-60')} data-plan-ligne={e.id}>
              <div className="flex flex-wrap items-center gap-2"><b>{e.libelle}</b><Chip tone="info">{lbl(db, 'actionsHygiene', e.actionId)}</Chip>{e.enregistrer === false ? <Chip title="Rappel de bonne pratique, sans alerte">consigne</Chip> : <Chip tone="ok" title="Trace attendue au journal : alerte si elle manque">enregistré</Chip>}{e.actif === false ? <Chip>désactivée</Chip> : null}{e.danger ? <Chip title="Danger maîtrisé">{hygLib(HYG_DANGERS, e.danger).split(' (')[0]}</Chip> : null}
                <span className="ml-auto flex gap-1"><Btn size="sm" onClick={() => setEd({ id: e.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => del(e)} aria-label={`Retirer ${e.libelle}`}>✕</Btn></span></div>
              <div className="mt-1 grid gap-x-4 gap-y-0.5 text-sm" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
                <span><span className="text-ink2">Quand : </span><QuandPlan e={e} /></span><span><span className="text-ink2">Cible : </span><span>{hygCibleTexte(db, e.cible)}</span></span>
                {(e.produits || []).length ? <span><span className="text-ink2">Produits : </span><ProduitsPlan e={e} />{e.contact ? <span>{` · ${e.contact}`}</span> : null}</span> : null}
                {e.controle && e.controle !== 'aucun' ? <span><span className="text-ink2">Contrôle : </span>{hygLib(HYG_CONTROLES, e.controle)}{e.attendu ? ` (${e.attendu})` : ''}</span> : null}
                {e.responsable ? <span><span className="text-ink2">Responsable : </span>{e.responsable}</span> : null}{e.enregistrement ? <span><span className="text-ink2">Enregistrement : </span>{e.enregistrement}</span> : null}
              </div>
              {e.mode ? <div className="mt-1 text-xs text-ink2">{e.mode}</div> : null}
            </div>))}</div>
        </Sec>); })}
      {!P.length ? <p className="help">Plan vide : « Rétablir l’origine » charge le modèle Œnotrack, ou ajoutez vos lignes.</p> : null}
      {ed ? <PlanEntreeForm id={ed.id} onClose={() => setEd(null)} /> : null}
      {imp ? <PlanImpression onClose={() => setImp(false)} /> : null}
    </div>
  );
}
const QUAND_VIDE = (type) => ({ type, ...(type === 'periodique' ? { jours: 7 } : type === 'vidange' ? { delai: 1 } : type === 'avantRemplissage' ? { heures: 24 } : type === 'apresOp' ? { ops: ['pressurage'] } : type === 'texte' ? { texte: '' } : {}) });
function PlanEntreeForm({ id, onClose }) {
  const { db, act } = useApp(); const e0 = id ? planNettoyage(db).find((x) => x.id === id) : null;
  const [f, set, setF] = useDraft(() => (e0 ? clone(e0) : { zone: 'cuverie', libelle: '', cible: { type: 'contenants', formes: [], ids: [], motCle: '' }, actionId: 'rincage', quand: [QUAND_VIDE('vidange')], produits: [], mode: '', contact: '', controle: 'visuel', attendu: '', enregistrement: '', enregistrer: true, responsable: '', danger: 'biologique', actif: true }));
  const c = f.cible || { type: 'contenants' }; const setC = (patch) => set('cible', { ...c, ...patch });
  const setQ = (i, patch) => set('quand', f.quand.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const setP = (i, patch) => set('produits', f.produits.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  const tog = (L, v) => (L.includes(v) ? L.filter((x) => x !== v) : [...L, v]);
  const save = () => { const r = act((d) => planEntreeSave(d, f, id), id ? 'Ligne du plan modifiée.' : 'Ligne ajoutée au plan de nettoyage.'); if (r && r.ok) onClose(); };
  const choix = c.type === 'contenants' ? (db.contenants || []).filter((x) => x.statut !== 'archive').map((x) => [x.id, x.nom]) : c.type === 'equipements' ? (db.lists.equipements || []).map((x) => [x.id, x.label]) : locauxDe(db).map((x) => [x.id, x.label]);
  return (
    <FormSheet wide title={id ? `Plan de nettoyage — ${e0 ? e0.libelle : ''}` : 'Nouvelle ligne du plan de nettoyage'} sub="Quoi, quand, avec quoi, comment, contrôle et responsable : la trace attendue au journal déclenche les tâches et les alertes." onClose={onClose} onSave={save}>
      <G n={3}><Field label="Zone"><SI plain value={f.zone} onChange={(v) => set('zone', v)} options={hygOpts(HYG_ZONES, f.zone)} aria-label="Zone" /></Field>
        <Field label="Équipement ou local nettoyé"><TI value={f.libelle} onChange={(v) => set('libelle', v)} placeholder="ex. Intérieur des cuves vides" aria-label="Équipement ou local nettoyé" /></Field>
        <Field label="Action"><SI plain value={f.actionId} onChange={(v) => set('actionId', v)} options={opts(db, 'actionsHygiene')} aria-label="Action du plan" /></Field></G>
      <Group label="Cible (ce qui reçoit l’entrée au journal)">
        <div className="flex flex-wrap items-center gap-2"><SI plain value={c.type} onChange={(v) => set('cible', { type: v, formes: [], ids: [], motCle: '' })} options={[{ value: 'contenants', label: 'Contenants' }, { value: 'equipements', label: 'Équipements' }, { value: 'locaux', label: 'Locaux et matériel' }]} aria-label="Type de cible" style={{ width: 'auto' }} />
          {c.type === 'contenants' ? <span className="flex flex-wrap gap-1.5" aria-label="Types de contenants">{(db.lists.typesContenant || []).map((t) => <button key={t.id} type="button" className={cx('opr-tog', (c.formes || []).includes(t.id) && 'on')} aria-pressed={(c.formes || []).includes(t.id)} onClick={() => setC({ formes: tog(c.formes || [], t.id), ids: [] })}>{t.label}</button>)}</span> : null}
          {c.type === 'equipements' ? <input className="inp" style={{ width: 200 }} value={c.motCle || ''} onChange={(e) => setC({ motCle: e.target.value })} placeholder="mot du nom (ex. pressoir)" aria-label="Mot du nom des équipements" /> : null}</div>
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Cibles choisies">{choix.map(([v, l]) => <button key={v} type="button" className={cx('opr-tog', (c.ids || []).includes(v) && 'on')} aria-pressed={(c.ids || []).includes(v)} onClick={() => setC({ ids: tog(c.ids || [], v) })}>{l}</button>)}</div>
        <div className="help mt-1">Sans choix précis : {c.type === 'contenants' ? 'tous les contenants des types cochés (ou tous)' : c.type === 'equipements' ? 'les équipements dont le nom contient le mot indiqué' : 'tous les locaux de la liste'}. Retenu : {hygCibleTexte(db, c)}.</div>
      </Group>
      <Group label="Quand">
        <div className="space-y-2">{f.quand.map((q, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2" data-quand={i}>
            <SI plain value={q.type === 'texte' && q.momentId && HYG_MOMENTS.some((x) => x[0] === q.momentId) ? `m:${q.momentId}` : q.type} onChange={(v) => { if (v.startsWith('m:')) { const mm = HYG_MOMENTS.find((x) => x[0] === v.slice(2)); set('quand', f.quand.map((x, k) => (k === i ? { type: 'texte', texte: mm ? mm[1] : '', momentId: v.slice(2) } : x))); } else set('quand', f.quand.map((x, k) => (k === i ? QUAND_VIDE(v) : x))); }} options={[...HYG_QUAND.map(([v, l]) => ({ value: v, label: l })), ...hygOpts(HYG_MOMENTS, q.momentId).map((o) => ({ value: `m:${o.value}`, label: o.label }))]} aria-label={`Moment ${i + 1}`} style={{ width: 'auto' }} />
            {q.type === 'periodique' ? <><span className="text-sm">tous les</span><input className="inp num" style={{ width: 70 }} inputMode="numeric" value={q.jours ?? ''} onChange={(e) => setQ(i, { jours: e.target.value })} aria-label="Nombre de jours" /><span className="text-sm">jours</span><Check checked={!!q.pendantVendanges} onChange={(v) => setQ(i, { pendantVendanges: v })} label="pendant les vendanges seulement" /><Check checked={!!q.siVide} onChange={(v) => setQ(i, { siVide: v })} label="contenant vide seulement" /></> : null}
            {q.type === 'vidange' ? <><span className="text-sm">en retard après</span><input className="inp num" style={{ width: 60 }} inputMode="numeric" value={q.delai ?? 1} onChange={(e) => setQ(i, { delai: e.target.value })} aria-label="Délai en jours" /><span className="text-sm">jour(s)</span></> : null}
            {q.type === 'avantRemplissage' ? <><span className="text-sm">si le dernier passage a plus de</span><input className="inp num" style={{ width: 60 }} inputMode="numeric" value={q.heures ?? 24} onChange={(e) => setQ(i, { heures: e.target.value })} aria-label="Heures" /><span className="text-sm">h</span></> : null}
            {q.type === 'texte' && !(q.momentId && HYG_MOMENTS.some((x) => x[0] === q.momentId)) ? <input className="inp min-w-0 flex-1" value={q.texte || ''} onChange={(e) => setQ(i, { texte: e.target.value })} placeholder="ex. en cas de salissure, après les soutirages de fin de FML" aria-label="Moment (texte)" style={{ minWidth: 220 }} /> : null}
            <Btn size="sm" kind="danger" onClick={() => set('quand', f.quand.filter((_, k) => k !== i))} aria-label={`Retirer le moment ${i + 1}`}>✕</Btn>
          </div>))}
          <Btn size="sm" onClick={() => set('quand', [...f.quand, QUAND_VIDE('periodique')])}>+ Ajouter un moment</Btn></div>
      </Group>
      <Group label="Produits">
        <div className="space-y-2">{f.produits.map((p, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <SI plain value={p.produitId ? `p:${p.produitId}` : `t:${p.type || ''}`} onChange={(v) => setP(i, v.startsWith('p:') ? { produitId: v.slice(2), type: undefined } : { type: v.slice(2), produitId: undefined })} options={[...hygOpts(HYG_TYPES, p.type).map((o) => ({ value: `t:${o.value}`, label: `Type : ${o.label}` })), ...hygListe(db).filter((x) => !x.archive).map((x) => ({ value: `p:${x.id}`, label: x.nom }))]} aria-label={`Produit ${i + 1}`} style={{ width: 'auto', maxWidth: 360 }} />
            <input className="inp num" style={{ width: 80 }} inputMode="decimal" value={p.conc ?? ''} onChange={(e) => setP(i, { conc: e.target.value })} placeholder="conc." aria-label={`Concentration ${i + 1}`} /><span className="text-sm">%</span>
            <Btn size="sm" kind="danger" onClick={() => set('produits', f.produits.filter((_, k) => k !== i))} aria-label={`Retirer le produit ${i + 1}`}>✕</Btn></div>))}
          <Btn size="sm" onClick={() => set('produits', [...f.produits, { type: 'alcalin', conc: '' }])}>+ Ajouter un produit</Btn>
          <div className="help">Un type de produit : à l’enregistrement, Œnotrack propose vos produits d’hygiène de ce type.</div></div>
      </Group>
      <Field label="Mode opératoire"><TA value={f.mode} onChange={(v) => set('mode', v)} rows={3} /></Field>
      <G n={3}><Field label="Temps de contact"><TI value={f.contact} onChange={(v) => set('contact', v)} placeholder="ex. 15 à 20 min" /></Field>
        <Field label="Contrôle après rinçage"><SI plain value={f.controle} onChange={(v) => setF((x) => ({ ...x, controle: v, attendu: x.attendu && x.attendu !== (HYG_CONTROLE_ATTENDU[x.controle] || '') ? x.attendu : HYG_CONTROLE_ATTENDU[v] || '' }))} options={hygOpts(HYG_CONTROLES, f.controle)} aria-label="Contrôle après rinçage" /></Field>
        <Field label="Résultat attendu"><TI value={f.attendu} onChange={(v) => set('attendu', v)} placeholder="ex. pH 7" /></Field></G>
      <G n={3}><Field label="Responsable"><TI value={f.responsable} onChange={(v) => set('responsable', v)} placeholder="ex. Opérateur de cuverie" /></Field>
        <Field label="Enregistrement (fiche, cahier)"><TI value={f.enregistrement} onChange={(v) => set('enregistrement', v)} placeholder="ex. cahier « Nettoyages cuverie »" /></Field>
        <Field label="Danger maîtrisé"><SI plain value={f.danger} onChange={(v) => set('danger', v)} options={hygOpts(HYG_DANGERS, f.danger)} aria-label="Danger maîtrisé" /></Field></G>
      <div className="flex flex-wrap gap-x-6 gap-y-2"><Check checked={f.enregistrer !== false} onChange={(v) => set('enregistrer', v)} label="Trace attendue au journal (tâches et alertes si elle manque)" /><Check checked={f.actif !== false} onChange={(v) => set('actif', v)} label="Ligne active" /></div>
    </FormSheet>
  );
}

/* ---------- plan de maintenance du matériel ---------- */
const MAINT_ETAT = { retard: ['bad', 'en retard'], bientot: ['warn', 'à prévoir'], ok: ['ok', 'à jour'], inconnue: ['', 'aucune intervention enregistrée'] };
function PlanMaintenanceView() {
  const { db, act, confirm } = useApp(); const [ed, setEd] = useState(null); const [mt, setMt] = useState(null); const [imp, setImp] = useState(false); const t = todayISO();
  const P = planMaintenance(db); const J = [...(db.maintenance || [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const charger = async () => { if (await confirm({ title: 'Rétablir le plan de maintenance d’origine ?', body: 'Le plan reprend le modèle Œnotrack ; vos lignes ajoutées ou modifiées sont remplacées. Les interventions enregistrées ne changent pas.', ok: 'Rétablir' })) act((d) => planModeleCharger(d, 'maintenance', true), 'Plan de maintenance d’origine rétabli.'); };
  const del = async (e) => { if (await confirm({ title: `Retirer « ${e.libelle} » du plan ?`, ok: 'Retirer', danger: true })) act((d) => maintEntreeDelete(d, e.id), 'Ligne retirée du plan.'); };
  const delI = async (m) => { if (!(await confirm({ title: 'Supprimer cette intervention ?', body: `${nomI(m)} — ${fmtDate(m.date)}.`, ok: 'Supprimer', danger: true }))) return; const r = act((d) => maintInterventionDelete(d, m.id), 'Intervention supprimée.'); if (r && r.ok) (r.docs || []).forEach((id) => { docDel(id).catch(() => { /* déjà absent */ }); }); };
  const nomI = (m) => { const e = P.find((x) => x.id === m.entreeId); return m.equipementId ? lbl(db, 'equipements', m.equipementId) : (e && e.libelle) || m.libelle || '—'; };
  return (
    <div>
      <Notice tone="info" title="Plan de maintenance du matériel">Préventive (planifiée pour éviter les pannes), réglementaire (imposée par la loi : vérifications, registre de sécurité) et curative (en cas de panne). Les échéances et les pannes signalées apparaissent dans l’onglet À faire.</Notice>
      <div className="my-3 flex flex-wrap gap-2"><Btn kind="primary" onClick={() => setMt({ preset: { type: 'curative', statut: 'ouverte' } })} data-signaler-panne="">⚠ Signaler une panne</Btn><Btn onClick={() => setMt({ preset: { type: 'preventive' } })}>+ Enregistrer une intervention</Btn>
        <span className="ml-auto flex flex-wrap gap-2"><Btn onClick={() => setImp(true)}>🖨 Imprimer le plan</Btn><Btn onClick={charger}>Rétablir l’origine</Btn><Btn onClick={() => setEd({})}>+ Ajouter du matériel</Btn></span></div>
      <Sec title={`Matériel suivi (${P.length})`}>
        <Tbl rows={P} empty="Plan vide : « Rétablir l’origine » charge le modèle Œnotrack." cols={[
          { h: 'Matériel', r: (e) => <span className={cx(e.actif === false && 'opacity-60')}><b>{e.libelle}</b>{maintEquipements(db, e).length ? <span className="block text-xs text-ink2">{maintEquipements(db, e).map((x) => x.nom).join(', ')}</span> : null}</span> },
          { h: 'Type', r: (e) => <Chip tone={e.type === 'reglementaire' ? 'warn' : ''}>{hygLib(MAINT_TYPES, e.type)}</Chip> }, { h: 'Fréquence', r: (e) => <span className="text-sm"><span>{maintFreqTexte(e.frequence)}</span>{e.avantVendanges ? <span className="block text-xs text-ink2">avant vendanges</span> : null}</span> },
          { h: 'Interventions', r: (e) => <span className="text-xs">{e.interventions}{e.intervenant ? <span className="block text-ink2">{e.intervenant}</span> : null}</span> },
          { h: 'Dernière / prochaine', r: (e) => { const s = maintEtat(db, e, t); const [tone, l] = MAINT_ETAT[s.etat] || ['', '']; return <span className="text-sm" data-maint-etat={s.etat}>{s.derniere ? fmtDate(s.derniere) : '—'}{s.echeance ? ` → ${fmtDate(s.echeance)}` : ''} <Chip tone={tone}>{l}</Chip></span>; } },
          { h: '', r: (e) => <span className="flex flex-wrap gap-1"><Btn size="sm" onClick={() => setMt({ preset: { entreeId: e.id, type: e.type } })}>Intervention</Btn><Btn size="sm" onClick={() => setEd({ id: e.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => del(e)} aria-label={`Retirer ${e.libelle}`}>✕</Btn></span> }]} />
      </Sec>
      <Sec title={`Interventions (${J.length})`}>
        <Tbl rows={J} empty="Aucune intervention enregistrée." cols={[
          { h: 'Date', r: (m) => <span className="num">{fmtDate(m.date)}</span> }, { h: 'Matériel', r: (m) => <b>{nomI(m)}</b> },
          { h: 'Type', r: (m) => <span className="flex flex-wrap gap-1"><Chip tone={m.type === 'curative' ? 'warn' : ''}>{hygLib(MAINT_TYPES, m.type)}</Chip>{m.statut === 'ouverte' ? <Chip tone="bad">panne en cours</Chip> : null}</span> },
          { h: 'Détail', r: (m) => <span className="text-xs">{[m.probleme, m.interventions].filter(Boolean).join(' — ')}{m.intervenant ? <span className="block text-ink2">{m.intervenant}</span> : null}</span> },
          { h: 'Résultat', r: (m) => <Chip tone={m.resultat === 'hors_service' ? 'bad' : m.resultat === 'a_suivre' ? 'warn' : 'ok'}>{hygLib(MAINT_RESULTATS, m.resultat)}</Chip> },
          { h: '', r: (m) => (isLocked(db, m.date) ? <Chip>🔒 figée</Chip> : <span className="flex gap-1"><Btn size="sm" onClick={() => setMt({ id: m.id, cloturer: m.statut === 'ouverte' })}>{m.statut === 'ouverte' ? 'Clore' : 'Modifier'}</Btn><Btn size="sm" kind="danger" onClick={() => delI(m)} aria-label="Supprimer l’intervention">✕</Btn></span>) }]} />
      </Sec>
      {ed ? <MaintEntreeForm id={ed.id} onClose={() => setEd(null)} /> : null}
      {mt ? <MaintInterventionForm id={mt.id} cloturer={mt.cloturer} preset={mt.preset} onClose={() => setMt(null)} /> : null}
      {imp ? <PlanImpression quoi="maintenance" onClose={() => setImp(false)} /> : null}
    </div>
  );
}
function MaintEntreeForm({ id, onClose }) {
  const { db, act, uid } = useApp(); const e0 = id ? planMaintenance(db).find((x) => x.id === id) : null;
  const [f, set] = useDraft(() => (e0 ? { ...clone(e0), frequence: { n: String((e0.frequence || {}).n || 1), unite: (e0.frequence || {}).unite || 'an' } } : { libelle: '', equipementIds: [], motCle: '', annee: '', type: 'preventive', frequence: { n: '1', unite: 'an' }, avantVendanges: false, interventions: '', enregistrement: '', intervenant: 'Interne', derniere: '', actif: true }));
  const save = () => { const r = act((d) => maintEntreeSave(d, f, id), id ? 'Matériel modifié.' : 'Matériel ajouté au plan de maintenance.'); if (r && r.ok) onClose(); };
  return (
    <FormSheet title={id ? `Maintenance — ${e0 ? e0.libelle : ''}` : 'Nouveau matériel suivi'} onClose={onClose} onSave={save}>
      <G><Field label="Matériel"><TI value={f.libelle} onChange={(v) => set('libelle', v)} placeholder="ex. Pompes à vin" aria-label="Matériel" /></Field><Field label="Année de mise en service"><TI value={f.annee} onChange={(v) => set('annee', v)} placeholder="ex. 2017" /></Field></G>
      <Group label={maintDansEquipements(db, uid) ? 'Équipements concernés (parc de l’onglet Équipements)' : 'Équipements concernés (liste Paramètres › Listes)'}><div className="flex flex-wrap gap-1.5">{(db.lists.equipements || []).map((x) => <button key={x.id} type="button" className={cx('opr-tog', (f.equipementIds || []).includes(x.id) && 'on')} aria-pressed={(f.equipementIds || []).includes(x.id)} onClick={() => set('equipementIds', (f.equipementIds || []).includes(x.id) ? f.equipementIds.filter((y) => y !== x.id) : [...(f.equipementIds || []), x.id])}>{x.label}</button>)}</div></Group>
      <G n={3}><Field label="Type"><SI plain value={f.type} onChange={(v) => set('type', v)} options={hygOpts(MAINT_TYPES.filter((x) => x[0] !== 'curative'), f.type)} aria-label="Type de maintenance" /></Field>
        <Field label="Fréquence : tous les"><div className="flex gap-2"><input className="inp num" style={{ width: 70 }} inputMode="numeric" value={f.frequence.n} onChange={(e) => set('frequence', { ...f.frequence, n: e.target.value })} aria-label="Fréquence" /><SI plain value={f.frequence.unite} onChange={(v) => set('frequence', { ...f.frequence, unite: v })} options={MAINT_UNITES.map(([v, l]) => ({ value: v, label: l }))} aria-label="Unité de la fréquence" /></div></Field>
        <Field label="Dernière intervention connue" help="Avant Œnotrack : sert de départ à l’échéance."><DI value={f.derniere} onChange={(v) => set('derniere', v)} /></Field></G>
      <Field label="Interventions"><TA value={f.interventions} onChange={(v) => set('interventions', v)} rows={2} /></Field>
      <G><Field label="Intervenant"><TI value={f.intervenant} onChange={(v) => set('intervenant', v)} placeholder="Interne, constructeur, prestataire…" /></Field><Field label="Enregistrement"><TI value={f.enregistrement} onChange={(v) => set('enregistrement', v)} placeholder="ex. fiche « Maintenance interne », rapport d’intervention" /></Field></G>
      <div className="flex flex-wrap gap-x-6 gap-y-2"><Check checked={!!f.avantVendanges} onChange={(v) => set('avantVendanges', v)} label="À vérifier avant les vendanges" /><Check checked={f.actif !== false} onChange={(v) => set('actif', v)} label="Suivi actif" /></div>
    </FormSheet>
  );
}
function MaintInterventionForm({ id, preset, cloturer, onClose }) {
  const { db, act, defaultDate, moi } = useApp(); const m0 = id ? (db.maintenance || []).find((x) => x.id === id) : null; const p0 = preset || {};
  const [f, set] = useDraft(() => (m0 ? { ...clone(m0), operateurs: m0.operateurs || [], ...(cloturer ? { statut: 'faite', resultat: 'conforme', date: m0.date } : {}) } : { date: defaultDate, entreeId: p0.entreeId || '', equipementId: p0.equipementId || '', libelle: '', type: p0.type || 'preventive', statut: p0.statut || 'faite', probleme: '', interventions: '', intervenant: (planMaintenance(db).find((x) => x.id === p0.entreeId) || {}).intervenant || '', resultat: p0.statut === 'ouverte' ? 'hors_service' : 'conforme', notes: '', operateurs: moi ? [moi] : [] }));
  const panne = f.type === 'curative' && f.statut === 'ouverte';
  const save = () => { const r = act((d) => maintInterventionSave(d, f, id), panne ? 'Panne signalée : elle reste dans l’onglet À faire jusqu’à sa réparation.' : id ? 'Intervention enregistrée.' : 'Intervention ajoutée.'); if (r && r.ok) onClose(); };
  return (
    <FormSheet title={panne ? 'Signaler une panne' : cloturer ? 'Clore la panne (réparation faite)' : id ? 'Modifier l’intervention' : 'Intervention de maintenance'} onClose={onClose} onSave={save} saveLabel={panne ? 'Signaler' : 'Enregistrer'}>
      <G n={3}><Field label="Date"><DI value={f.date} onChange={(v) => set('date', v)} /></Field>
        <Field label="Matériel (plan)"><SI plain value={f.entreeId} onChange={(v) => set('entreeId', v)} options={[{ value: '', label: '— hors plan —' }, ...planMaintenance(db).map((e) => ({ value: e.id, label: e.libelle }))]} aria-label="Matériel du plan" /></Field>
        <Field label="Équipement"><SI plain value={f.equipementId} onChange={(v) => set('equipementId', v)} options={[{ value: '', label: '—' }, ...(db.lists.equipements || []).map((x) => ({ value: x.id, label: x.label }))]} aria-label="Équipement" /></Field></G>
      {!f.entreeId && !f.equipementId ? <Field label="Matériel (texte)"><TI value={f.libelle} onChange={(v) => set('libelle', v)} placeholder="ex. Extracteur de CO₂" /></Field> : null}
      <G><Field label="Type"><SI plain value={f.type} onChange={(v) => set('type', v)} options={hygOpts(MAINT_TYPES, f.type)} aria-label="Type d’intervention" /></Field>
        {f.type === 'curative' ? <Field label="État"><SI plain value={f.statut} onChange={(v) => set('statut', v)} options={[{ value: 'ouverte', label: 'Panne en cours (à réparer)' }, { value: 'faite', label: 'Réparation faite' }]} aria-label="État de la panne" /></Field> : <div />}</G>
      {f.type === 'curative' ? <Field label="Panne, dysfonctionnement"><TA value={f.probleme} onChange={(v) => set('probleme', v)} rows={2} placeholder="ex. fuite au presse-étoupe" aria-label="Panne" /></Field> : null}
      {!panne ? <><Field label="Interventions réalisées"><TA value={f.interventions} onChange={(v) => set('interventions', v)} rows={2} /></Field>
        <G><Field label="Intervenant"><TI value={f.intervenant} onChange={(v) => set('intervenant', v)} /></Field><Field label="Résultat"><SI plain value={f.resultat} onChange={(v) => set('resultat', v)} options={hygOpts(MAINT_RESULTATS, f.resultat)} aria-label="Résultat" /></Field></G></> : null}
      <OperateursPicker value={f.operateurs} onChange={(v) => set('operateurs', v)} label={panne ? 'Signalée par' : 'Opérateur(s)'} />
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} rows={2} /></Field>
      {id ? <DocsPanel cible={{ type: 'maintenance', id }} kind="op" locked={isLocked(db, f.date)} /> : null}
    </FormSheet>
  );
}

/* ---------- impression des plans (classeur HACCP) : tableau, logigramme vertical ou frise (0.31.0-alpha.1), au choix ---------- */
// moments du plan de nettoyage dans l'ordre de l'année de vinification (frise)
const PLAN_FRISE_MOMENTS = [['avantVendanges', 'Avant les vendanges'], ['vendangesSoir', 'Soir de vendanges'], ['apresOp', 'Après chaque marc ou opération'], ['vidange', 'Après vidange'], ['avantRemplissage', 'Avant remplissage'],
  ['changementRevendication', 'Changement de revendication'], ['periodique', 'Périodique'], ['apresVendanges', 'Après les vendanges'], ['avantAssemblages', 'Avant les assemblages'], ['apresAssemblages', 'Après les assemblages'], ['apresTirage', 'Après le tirage'], ['texte', 'Autre moment']];
const moisCourt = (iso) => { try { return new Date(`${iso.slice(0, 7)}-15T12:00:00Z`).toLocaleDateString(LANGUE, { month: 'short', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return iso.slice(0, 7); } };
function PlanImpression({ quoi, onClose }) {
  const { db } = useApp(); const maint = quoi === 'maintenance';
  const th = { textAlign: 'left', fontSize: 11 }; const td = { fontSize: 11, verticalAlign: 'top' };
  const titre = maint ? 'Plan de maintenance du matériel' : 'Plan de nettoyage et de désinfection';
  const ctl = (e) => (e.controle && e.controle !== 'aucun' ? `${hygLib(HYG_CONTROLES, e.controle)}${e.attendu ? ` (${e.attendu})` : ''}` : '');
  const enr = (e) => (e.enregistrer === false ? '' : e.enregistrement || 'Journal d’hygiène');
  const M = planMaintenance(db).filter((e) => e.actif !== false); const N = planNettoyage(db).filter((e) => e.actif !== false);
  const parZone = (rendu) => HYG_ZONES.map(([z, zl]) => { const L = N.filter((e) => (e.zone || 'autre') === z); return L.length ? <div key={z} style={{ marginBottom: 12 }}><h3 style={{ fontSize: 14, margin: '10px 0 4px' }}>{zl}</h3>{rendu(L)}</div> : null; });
  const tableau = () => (maint ? <table><thead><tr>{['Matériel', 'Mise en service', 'Type', 'Fréquence', 'Interventions', 'Intervenant', 'Enregistrement', 'Dernière', 'Prochaine'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
    <tbody>{M.map((e) => { const st = maintEtat(db, e); return <tr key={e.id}>{[e.libelle, e.annee || '—', hygLib(MAINT_TYPES, e.type), <><span>{maintFreqTexte(e.frequence)}</span>{e.avantVendanges ? <><br /><span>avant vendanges</span></> : null}</>, e.interventions, e.intervenant, e.enregistrement || '—', st.derniere ? fmtDate(st.derniere) : '—', st.echeance ? fmtDate(st.echeance) : '—'].map((v, i) => <td key={i} style={td}>{v}</td>)}</tr>; })}</tbody></table>
    : parZone((L) => <table><thead><tr>{['Équipement ou local', 'Objectif', 'Fréquence', 'Produit(s)', 'Actions / consignes', 'Temps de contact', 'Contrôle', 'Enregistrement', 'Responsable'].map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
      <tbody>{L.map((e) => <tr key={e.id}>{[e.libelle, lbl(db, 'actionsHygiene', e.actionId), <QuandPlan e={e} />, <ProduitsPlan e={e} />, e.mode, e.contact || '—', ctl(e) || '—', enr(e) || '—', e.responsable || '—'].map((v, i) => <td key={i} style={td}>{v}</td>)}</tr>)}</tbody></table>));
  const logigramme = () => (maint ? <Logigramme colonnes={M.map((e) => { const st = maintEtat(db, e); return { titre: e.libelle, boites: [
      { haut: 'Type et fréquence', titre: hygLib(MAINT_TYPES, e.type), lignes: [maintFreqTexte(e.frequence), e.avantVendanges ? <span>avant vendanges</span> : ''] },
      { haut: 'Interventions', lignes: [e.interventions || '—'] }, { haut: 'Intervenant', lignes: [e.intervenant || '—'] },
      { haut: 'Enregistrement', lignes: [e.enregistrement || (st.derniere || st.echeance ? '' : '—'), st.derniere ? <><span>dernière :</span> <span translate="no">{fmtDate(st.derniere)}</span></> : '', st.echeance ? <><span>prochaine :</span> <span translate="no">{fmtDate(st.echeance)}</span></> : ''] }] }; })} />
    : parZone((L) => <Logigramme colonnes={L.map((e) => ({ titre: e.libelle, boites: [
      { haut: 'Quand', lignes: [<QuandPlan e={e} />] }, { haut: 'Action', titre: lbl(db, 'actionsHygiene', e.actionId), lignes: [<ProduitsPlan e={e} />, e.contact ? <><span>temps de contact :</span> {e.contact}</> : ''] },
      ...(e.mode ? [{ haut: 'Consignes', lignes: [e.mode] }] : []), { haut: 'Contrôle', lignes: [ctl(e) || '—'] }, { haut: 'Enregistrement', lignes: [enr(e) || '—', e.responsable ? <><span>responsable :</span> {e.responsable}</> : ''] }] }))} />));
  const frise = () => {
    if (!maint) {
      const cols = PLAN_FRISE_MOMENTS.map(([k, label]) => { const L = N.filter((e) => (e.quand || []).some((q) => q && q.type === k)); return { haut: label, sous: '', boites: L.map((e) => ({ titre: e.libelle, lignes: [lbl(db, 'actionsHygiene', e.actionId), k === 'periodique' || k === 'texte' ? (e.quand || []).filter((q) => q && q.type === k).map((q) => hygLibQuand(q)).join(' ; ') : ''] })) }; }).filter((c) => c.boites.length);
      return <Frise colonnes={cols} parLigne={6} />;
    }
    const auj = todayISO(); const mois = []; for (let k = 0; k < 12; k += 1) { const d = new Date(`${auj.slice(0, 7)}-15T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + k); mois.push(d.toISOString().slice(0, 7)); }
    const E = M.map((e) => ({ e, st: maintEtat(db, e) })); const bx = (x) => ({ titre: x.e.libelle, lignes: [hygLib(MAINT_TYPES, x.e.type), x.st.echeance ? <span translate="no">{fmtDate(x.st.echeance)}</span> : ''] });
    const retard = E.filter((x) => x.st.echeance && x.st.echeance < auj); const sans = E.filter((x) => !x.st.echeance || x.st.echeance.slice(0, 7) > mois[11]);
    const cols = [...(retard.length ? [{ haut: 'En retard', sous: '', boites: retard.map(bx) }] : []), ...mois.map((m) => ({ haut: <span translate="no">{moisCourt(m)}</span>, sous: '', boites: E.filter((x) => x.st.echeance && x.st.echeance >= auj && x.st.echeance.slice(0, 7) === m).map(bx) })),
      ...(sans.length ? [{ haut: 'Plus tard ou sans échéance', sous: '', boites: sans.map(bx) }] : [])];
    return <Frise colonnes={cols} parLigne={7} />;
  };
  return (
    <ImpressionVisuelle cle={maint ? 'plan-maintenance' : 'plan-nettoyage'} formeDefaut="tableau" titre={titre} sous={`Mis en place le ${fmtDate(planDepuis(db))}`} nomFichier={maint ? 'plan-de-maintenance' : 'plan-de-nettoyage'} onClose={onClose} attrs={{ 'data-plan-impression': '' }} aide="À imprimer pour le classeur qualité (HACCP)"
      rendu={(forme) => (forme === 'logigramme' ? logigramme() : forme === 'frise' ? frise() : tableau())}
      note={maint ? 'Préventive : planifiée pour éviter les pannes ; réglementaire : imposée par la réglementation (registre de sécurité) ; curative : en cas de panne.' : 'Porter les protections indiquées sur la FDS de chaque produit ; ne jamais mélanger de produits purs ; rincer systématiquement après le temps de contact.'} />
  );
}

/* ---------- contrôles à la saisie d'une opération et suite proposée après l'enregistrement ---------- */
function HygControlesNotices({ spec, editId, pv }) {
  const { db, openHyg } = useApp(); const L = useMemo(() => { try { return hygControlesSaisie(db, spec, editId, null, pv && pv.ok && pv.R ? { R: pv.R, opId: pv.op.id } : null); } catch (e) { return []; } }, [db, spec, editId, pv]);
  if (!L.length) return null;
  return <div className="space-y-1" data-hyg-saisie="">{L.map((x, i) => <Notice key={i} tone={x.tone}><span>{x.msg} </span>{x.faire ? <button type="button" className="linkish" onClick={() => openHyg(hygPresetTache(db, x.faire))}>Enregistrer maintenant</button> : null}</Notice>)}</div>;
}
// après une opération : les nouvelles tâches d'hygiène qu'elle crée (cuve vide → rinçage…) sont proposées tout de suite
function SuiteHygiene() {
  const { db, openHyg } = useApp(); const T = usePlanTaches(); const prec = useRef(null); const [L, setL] = useState([]); const [vu, setVu] = useState({});
  useEffect(() => {
    const cles = new Set(T.map((x) => x.cle)); const p = prec.current; prec.current = { cles, ops: db.ops };
    if (!p || p.ops === db.ops) return; // premier calcul, ou rien de changé dans les opérations
    const nouv = T.filter((x) => !p.cles.has(x.cle) && x.origine === 'nettoyage' && x.etat !== 'nonconforme' && x.opId && !vu[x.cle]);
    if (nouv.length) setL((l) => [...l.filter((y) => !nouv.some((z) => z.cle === y.cle)), ...nouv].slice(-5));
  }, [T]);
  const reste = L.filter((x) => T.some((y) => y.cle === x.cle)); if (!reste.length) return null;
  const fermer = () => { setVu((v) => ({ ...v, ...Object.fromEntries(reste.map((x) => [x.cle, true])) })); setL([]); };
  return (
    <div className="suite-hygiene card p-3" role="status" data-suite-hygiene="">
      <div className="mb-1 flex items-center gap-2"><b>🧽 À faire ensuite</b><button type="button" className="linkish ml-auto" onClick={fermer}>Plus tard</button></div>
      {reste.map((x) => <div key={x.cle} className="flex flex-wrap items-center gap-2 text-sm"><span className="min-w-0 flex-1">{x.msg}</span><Btn size="sm" kind="primary" onClick={() => { openHyg(hygPresetTache(db, x)); setL((l) => l.filter((y) => y.cle !== x.cle)); }}>Enregistrer</Btn></div>)}
    </div>
  );
}
