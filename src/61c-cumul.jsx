/* ============ DOSES CUMULÉES, SO₂ TOTAL ESTIMÉ, DÉPASSEMENTS (0.30.0-alpha.1) ============ */
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
            {x.type === 'so2t' ? <><span>SO₂ total estimé</span> <b className="num" translate="no">{fmt(x.valeur, 0)} mg/L</b></> : <><b translate="no">{p ? p.nom : '?'}</b> : <span>{x.type === 'cumul' ? 'dose cumulée' : 'dose de l’opération'}</span> <b>{doseOuTiret(x.valeur, x.unite)}</b></>}
            {code ? <> <span>dans le lot</span> <span translate="no">{code}</span></> : null}, <span>plafond</span> {x.type === 'so2t' ? <span className="num" translate="no">{fmt(x.max, 0)} mg/L</span> : doseOuTiret(x.max, x.unite)} (<span>{qLabel(x.qualif)}</span>){x.aVerifier ? <> <Chip tone="warn">plafond d’exemple à vérifier</Chip></> : null}
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
const depassementSpec = (deps, motif, uid) => ({ motif: String(motif || '').trim().slice(0, 500), par: uid || '', le: todayISO(), details: deps.map((x) => ({ type: x.type, produitId: x.produitId || null, lotId: x.lotId || null, valeur: Math.round(num(x.valeur) * 1000) / 1000, max: x.max, unite: x.unite, qualif: x.qualif || null, aVerifier: !!x.aVerifier })) });
// journal, fiche de l'opération : dépassement justifié
function DepassementChip({ op }) {
  if (!op || !op.depassement || !op.depassement.motif) return null;
  return <Chip tone="warn" title={op.depassement.motif} data-depassement-chip=""><span>dépassement justifié</span></Chip>;
}
