/* ============ DOSES CUMULÉES, SO₂ TOTAL ESTIMÉ, DÉPASSEMENTS (0.30.0-alpha.1 ; 0.40.0-alpha.1 : référentiel, teneurs, conformité du lot) ============ */
const doseOuTiret = (v, u) => (v != null && u ? <span className="num" translate="no">{doseTexte(v, u === 'mL/hL' ? 'mL' : 'g')}</span> : '—');
// doses cumulées au prorata : dose du produit par hL du lot (héritée des lots d'origine + apportée directement), plafond de la revendication
function DosesCumuleesTable({ lotId, titre }) {
  const { db, R } = useApp(); const L = useMemo(() => lotIntrantsCumul(db, R, lotId), [db, R, lotId]);
  if (!L.length) return null;
  return (
    <div className="mb-3" data-doses-cumulees={lotId}>
      <div className="lbl">{titre || 'Doses cumulées (dose du produit par hL du lot, lots d’origine au prorata des volumes)'}</div>
      <Tbl rows={L.map((x) => ({ ...x, id: x.produitId }))} cols={[
        { h: 'Produit', r: (x) => <b translate="no">{x.p.nom}</b> },
        { h: 'Dose cumulée', cls: 'r', r: (x) => <span className={cx(x.depasse && 'text-bad font-semibold')}>{doseOuTiret(x.dose, x.unite)}</span> },
        { h: 'dont héritée', cls: 'r hm', r: (x) => (x.herite > 1e-6 ? doseOuTiret(x.herite, x.unite) : '—') },
        { h: 'Plafond', cls: 'r', r: (x) => (x.so2 ? <span className="text-xs text-ink2">contrôlé par le SO₂ total</span> : x.max != null ? <span className="flex flex-wrap items-center justify-end gap-1">{doseOuTiret(x.max, x.unite)}{x.aVerifier ? <Chip tone="warn">à vérifier</Chip> : null}</span> : '—') },
        { h: '', r: (x) => (x.interdit ? <Chip tone="bad">non autorisé</Chip> : x.depasse ? <Chip tone="bad">dépassement</Chip> : null) },
      ]} />
    </div>
  );
}
// SO₂ total estimé = dernière analyse + ajouts depuis (produits dont la teneur en SO₂ est connue)
function So2EstimeBloc({ lotId, court }) {
  const { db, R } = useApp(); const e = useMemo(() => so2TotalEstime(db, R, lotId), [db, R, lotId]); const inc = useMemo(() => so2TeneurInconnue(db, R, lotId), [db, R, lotId]);
  const pf = e.plafond; const mg = (v) => <span className="num" translate="no">{fmt(v, 0)} mg/L</span>;
  return (
    <div className="space-y-1 text-sm" data-so2-estime={lotId}>
      {e.estime != null ? (
        <div className="flex flex-wrap items-center gap-2"><span>SO₂ total estimé :</span> <b className={cx(e.depasse && 'text-bad')}>{mg(e.estime)}</b>
          {e.analyse ? <span className="text-ink2">(<span>analyse du</span> <span translate="no">{fmtDate(e.analyse.date)}</span> : {mg(e.base)} + <span>ajouts depuis</span> : {mg(e.depuis)})</span> : <span className="text-ink2">(<span>sans analyse : ajouts cumulés depuis l’origine, lots d’origine compris</span>)</span>}
          {e.depasse ? <Chip tone="bad">au-delà du plafond</Chip> : null}</div>
      ) : <div className="text-ink2">{e.analyse ? <><span>SO₂ total :</span> {mg(e.base)} (<span>analyse du</span> <span translate="no">{fmtDate(e.analyse.date)}</span>)</> : 'Aucune analyse de SO₂ total ni ajout de SO₂ connu pour ce lot.'}</div>}
      {pf ? <div className="text-xs text-ink2"><span>Plafond</span> <span>{qLabel(pf.qualifId)}</span> · <span>{vinTypeLabel(pf.typeVin)}</span> : {mg(pf.valeur)}{pf.note ? <> (<span>{pf.note}</span>)</> : null} {pf.aVerifier ? <Chip tone="warn">exemple à vérifier</Chip> : <Chip tone="good">vérifié</Chip>}</div> : <div className="text-xs text-ink2">Pas de plafond de SO₂ total pour la revendication de ce lot (Intrants › Revendications & plafonds).</div>}
      {!court && inc.length ? <div className="text-xs text-warn"><span>Teneur en SO₂ inconnue (non comptée) :</span> <span translate="no">{inc.map((p) => p.nom).join(', ')}</span> — <span>renseignez-la dans la fiche du produit.</span></div> : null}
    </div>
  );
}
// liste des dépassements d'une opération (aperçu du formulaire, journal)
function DepassementsListe({ deps, R }) {
  const { db } = useApp(); const RR = R || {};
  return (
    <ul className="list-disc pl-5" data-depassements>
      {deps.map((x, i) => { const p = x.produitId ? prodOf(db, x.produitId) : null; const code = ((RR.lots || {})[x.lotId] || (db.lots || []).find((l) => l.id === x.lotId) || {}).code || '';
        return (
          <li key={i}>
            {x.type === 'interdit' ? <><b translate="no">{p ? p.nom : '?'}</b> : <span>intrant non autorisé</span>{code ? <> <span>dans le lot</span> <span translate="no">{code}</span></> : null} (<span translate="no">{refLabelNom(x.label)}</span>){x.aVerifier ? <> <Chip tone="warn">référentiel à vérifier</Chip></> : null}</>
              : <>{x.type === 'so2t' ? <><span>SO₂ total estimé</span> <b className="num" translate="no">{fmt(x.valeur, 0)} mg/L</b></> : x.type === 'teneur' ? <><span>Teneur dans le vin</span> · <span translate="no">{REG_ESPECES[x.espece] || x.espece}</span> <b className="num" translate="no">{fmt(x.valeur, 1)} mg/L</b></> : <><b translate="no">{p ? p.nom : '?'}</b> : <span>{x.type === 'cumul' ? 'dose cumulée' : 'dose de l’opération'}</span> <b>{doseOuTiret(x.valeur, x.unite)}</b></>}
              {code ? <> <span>dans le lot</span> <span translate="no">{code}</span></> : null}, <span>plafond</span> {x.type === 'so2t' || x.type === 'teneur' ? <span className="num" translate="no">{fmt(x.max, x.max < 1 ? 2 : 0)} mg/L</span> : doseOuTiret(x.max, x.unite)} ({x.label ? <span translate="no">{refLabelNom(x.label)}</span> : <span>{qLabel(x.qualif)}</span>}){x.aVerifier ? <> <Chip tone="warn">plafond d’exemple à vérifier</Chip></> : null}</>}
          </li>
        ); })}
    </ul>
  );
}
// formulaire : dépassement d'un plafond → avertir et demander le motif, tracé avec l'opération
function DepassementBox({ deps, R, motif, setMotif }) {
  if (!deps || !deps.length) return null;
  return (
    <Notice tone="bad" title="Dépassement d’un plafond : motif obligatoire">
      <DepassementsListe deps={deps} R={R} />
      <div className="mt-2"><Field label="Motif du dépassement (tracé avec l’opération)"><TA value={motif} onChange={setMotif} rows={2} placeholder="ex. correction décidée après analyse, dérogation…" aria-label="Motif du dépassement" data-motif-depassement="" /></Field></div>
    </Notice>
  );
}
const depassementSpec = (deps, motif, uid) => ({ motif: String(motif || '').trim().slice(0, 500), par: uid || '', le: todayISO(), details: deps.map((x) => ({ type: x.type, produitId: x.produitId || null, lotId: x.lotId || null, valeur: Math.round(num(x.valeur) * 1000) / 1000, max: x.max, unite: x.unite, qualif: x.qualif || null, aVerifier: !!x.aVerifier, ...(x.label ? { label: x.label } : {}), ...(x.espece ? { espece: x.espece } : {}) })) });
// journal, fiche de l'opération : dépassement justifié
function DepassementChip({ op }) {
  if (!op || !op.depassement || !op.depassement.motif) return null;
  return <Chip tone="warn" title={op.depassement.motif} data-depassement-chip=""><span>dépassement justifié</span></Chip>;
}

/* ---------- 0.40.0-alpha.1 : conformité réglementaire d'un lot (alerte a posteriori), teneurs dans le vin, labels visés ---------- */
const refOrigineTexte = { base: 'tous les vins', appellation: 'appellation du vignoble', revendication: 'revendication du lot', vise: 'label visé', herite: 'repris par un label' };
function LabelsChips({ lotId }) {
  const { db, R } = useApp(); const L = useMemo(() => refLabelsLot(db, R, lotId), [db, R, lotId]);
  return <span className="inline-flex flex-wrap items-center gap-1" data-labels-lot={lotId}>{L.map((x) => <Chip key={x.id} tone={x.origine === 'vise' ? 'info' : ''} title={refOrigineTexte[x.origine]}><span translate="no">{refLabelNom(x.id)}</span></Chip>)}</span>;
}
// alerte persistante sur le lot : intrant non conforme, dose cumulée, teneur maximale dans le vin, SO₂ total — selon les labels du lot
function ConformiteBloc({ lotId, modifiable }) {
  const { db, R, camp } = useApp(); const A = useMemo(() => lotConformite(db, R, lotId), [db, R, lotId]); const [edit, setEdit] = useState(false);
  const nj = A.filter((a) => !a.justifie).length;
  return (
    <div className="mb-5" data-conformite={lotId}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm"><span className="text-ink2">Référentiels appliqués :</span><LabelsChips lotId={lotId} />{modifiable && !camp.figee ? <Btn size="sm" onClick={() => setEdit(true)} data-labels-vises-ouvrir="">🏷 Labels visés…</Btn> : null}</div>
      {A.length ? (
        <Notice tone={nj ? 'bad' : 'warn'} title={nj ? 'Lot non conforme au référentiel' : 'Dépassements justifiés'}>
          <ul className="list-disc pl-5" data-conformite-alertes="">{A.map((a, i) => <li key={i}><span>{refAlerteTexte(db, a)}</span>{a.justifie ? <> <Chip tone="warn">justifié</Chip></> : null}{a.aVerifier ? <> <Chip tone="warn">référentiel à vérifier</Chip></> : null}{a.supposee ? <> <Chip>teneur du produit supposée</Chip></> : null}</li>)}</ul>
          <div className="mt-1 text-xs">Revoyez les intrants ou la revendication du lot ; les valeurs d’exemple sont à vérifier dans Intrants › Référentiel réglementaire.</div>
        </Notice>
      ) : null}
      {edit ? <LabelsVisesForm lotId={lotId} onClose={() => setEdit(false)} /> : null}
    </div>
  );
}
function ConformiteChip({ alertes }) {
  if (!alertes || !alertes.length) return null; const nj = alertes.filter((a) => !a.justifie).length;
  return <Chip tone={nj ? 'bad' : 'warn'} title={alertes.map((a) => a.type).join(', ')} data-conformite-chip=""><span>{nj ? '⚠ non conforme' : 'dépassement justifié'}</span></Chip>;
}
// teneurs dans le vin (acide sorbique, cuivre…) apportées par les intrants cumulés, comparées à la plus basse des teneurs maximales des labels du lot
function TeneursTable({ lotId }) {
  const { db, R } = useApp(); const L = useMemo(() => (refActif(db) ? refTeneursLot(db, R, lotId) : []), [db, R, lotId]);
  if (!L.length) return null;
  return (
    <div className="mb-3" data-teneurs={lotId}>
      <div className="lbl">Teneurs apportées dans le vin (intrants cumulés, composés actifs)</div>
      <Tbl rows={L.map((x) => ({ ...x, id: x.espece }))} cols={[
        { h: 'Composé', r: (x) => <b translate="no">{x.libelle}</b> },
        { h: 'Teneur estimée', cls: 'r', r: (x) => <span className={cx('num', x.depasse && 'text-bad font-semibold')} translate="no">{fmt(x.mgL, x.mgL < 1 ? 2 : 1)} mg/L</span> },
        { h: 'Teneur maximale', cls: 'r', r: (x) => (x.max != null ? <span className="flex flex-wrap items-center justify-end gap-1"><span className="num" translate="no">{fmt(x.max, x.max < 1 ? 2 : 0)} mg/L</span><span className="text-xs text-ink2" translate="no">{refLabelNom(x.maxPar)}</span>{x.aVerifier ? <Chip tone="warn">à vérifier</Chip> : null}</span> : '—') },
        { h: '', r: (x) => <span className="flex flex-wrap gap-1">{x.depasse ? <Chip tone="bad">dépassement</Chip> : null}{x.supposee ? <Chip title="Composition du produit non renseignée : produit supposé pur">teneur du produit supposée</Chip> : null}</span> },
      ]} />
    </div>
  );
}
function LabelsVisesForm({ lotId, onClose }) {
  const { db, R, act } = useApp(); const l = refLotDe(db, R, lotId) || {}; const [L, setL] = useState(() => (Array.isArray(l.labelsVises) ? l.labelsVises : []));
  const rev = qualifReferentiels(db, l.qualif);
  const save = () => { const r = act((d) => lotLabelsVises(d, lotId, L), 'Labels visés enregistrés.'); if (r && r.ok !== false) onClose(); };
  return (
    <FormSheet title={<><span>Labels visés par le lot</span> <span translate="no">{l.code || ''}</span></>} sub="En plus de la revendication du lot : les règles de chaque label coché s’appliquent (la plus restrictive l’emporte), à la saisie et sur le lot." onClose={onClose} onSave={save}>
      <div className="space-y-1" data-labels-vises="">{REG_LABELS.filter((x) => x.type === 'label').map((x) => <div key={x.id}><Check checked={L.includes(x.id) || rev.includes(x.id)} disabled={rev.includes(x.id)} onChange={(v) => setL(v ? [...L, x.id] : L.filter((y) => y !== x.id))} label={x.label} />{rev.includes(x.id) ? <span className="ml-2 text-xs text-ink2">déjà appliqué par la revendication</span> : null}</div>)}</div>
    </FormSheet>
  );
}
