/* ============ PLAN DE VINIFICATION : MODIFICATION DIRECTE, VARIANTES, PROPOSITION À LA CRÉATION D'UN LOT (0.43.0-alpha.2) ============
   - le tableau se modifie case par case sur la page (enregistrement en quittant la case ou par Entrée ; Échap annule) ;
   - variantes : copie du plan avec des conditions (partenaires, crus, échelle des crus, revendications, cépages, fractions, état sanitaire) ;
     la plus précise qui correspond au lot l'emporte, sinon le plan général ;
   - à la création d'un lot (pressurage, marc validé, entrée de moûts) : les étapes de sa colonne, dans l'ordre du tableau, deviennent des
     opérations « à réaliser » sans date (« Étape 1 / 8 »…). */

const planCritereItems = (db, cle) => {
  if (cle === 'apporteurs') return (db.apporteurs || []).filter((a) => a && a.id).map((a) => ({ id: a.id, label: a.nom || a.id }));
  if (cle === 'crus') return (db.crus || []).filter((c) => c && c.id).map((c) => ({ id: c.id, label: c.nom || c.id }));
  if (cle === 'echelles') return echList(db).map((e) => ({ id: e.id, label: e.label }));
  if (cle === 'revendications') return qualifList(db).map((q) => ({ id: q.id, label: qLabel(q.id) }));
  if (cle === 'cepages') return ((db.lists && db.lists.cepages) || []).map((c) => ({ id: c.id, label: c.label }));
  if (cle === 'fractions') return fracList(db).map((f) => ({ id: f.id, label: f.label }));
  if (cle === 'etats') return SCHEMA_ETATS.map((e) => ({ id: e.id, label: e.label }));
  return [];
};
// résumé lisible des conditions : « Partenaires : X · Échelle des crus : Grands Crus » ou « plan général »
function planConditionsTexte(db, p) {
  const c = planVinifConditions(p); const L = PLANV_CRITERES.filter(([k]) => (c[k] || []).length).map(([k, lib]) => { const it = planCritereItems(db, k); return `${lib} : ${c[k].map((id) => (it.find((x) => x.id === id) || { label: id }).label).join(', ')}`; });
  return L.length ? L.join(' · ') : '';
}

// case modifiable : valeur locale, enregistrée en quittant la case (une seule modification de la base par case)
function PlanCellule({ valeur, onCommit, lect, label, className, multi }) {
  const [v, setV] = useState(valeur || ''); const ed = useRef(false);
  useEffect(() => { if (!ed.current) setV(valeur || ''); }, [valeur]);
  if (lect) return <span className={className}>{valeur}</span>;
  const P = { className: cx('planv-inp', multi && 'planv-multi', className), value: v, 'aria-label': label, onFocus: () => { ed.current = true; }, onChange: (e) => setV(e.target.value),
    onBlur: () => { ed.current = false; if (v.trim() !== String(valeur || '').trim()) onCommit(v); },
    onKeyDown: (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } else if (e.key === 'Escape') { setV(valeur || ''); ed.current = false; setTimeout(() => e.target.blur(), 0); } } };
  return multi ? <textarea rows={2} {...P} /> : <input {...P} />;
}

// tableau modifiable (écran) ; l'impression garde PlanVinifRapport
function PlanVinifTableauEdit({ plan, lect }) {
  const { db, act, uid } = useApp(); const [outils, setOutils] = useState(null);
  const cols = planVinifColonnes(plan); const G = planVinifListe(plan.groupes); const Rv = planVinifListe(plan.revendications); const F = planVinifListe(plan.fractions);
  const n = cols.length + 2; const id = plan.id;
  const cel = (ligneId, cle, v) => act((d) => planVinifCellule(d, id, ligneId, cle, v, uid));
  const ent = (liste, eid, v) => act((d) => planVinifEntete(d, id, liste, eid, v, uid));
  return (<>
    <table className="planv planv-edit" data-planv-edit={id}>
      <thead>
        <tr><th rowSpan={3} className="planv-outil no-print" /><th rowSpan={3} colSpan={2} className="planv-coin">{plan.sousTitre ? <span className="planv-st">{plan.sousTitre}</span> : null}</th>{G.map((g) => <th key={g.id} colSpan={Rv.length * F.length} className="planv-g"><PlanCellule valeur={g.label} lect={lect} label={`En-tête du groupe : ${g.label}`} onCommit={(v) => ent('groupes', g.id, v)} /></th>)}</tr>
        <tr>{G.map((g) => Rv.map((r) => <th key={`${g.id}|${r.id}`} colSpan={F.length} className="planv-r"><PlanCellule valeur={r.label} lect={lect} label={`En-tête de la revendication : ${r.label}`} onCommit={(v) => ent('revendications', r.id, v)} /></th>))}</tr>
        <tr>{cols.map((c) => <th key={c.key} className="planv-f"><PlanCellule valeur={c.f.label} lect={lect} label={`En-tête de la fraction : ${c.f.label}`} onCommit={(v) => ent('fractions', c.f.id, v)} /></th>)}</tr>
      </thead>
      <tbody>
        {(plan.lignes || []).map((l) => {
          const outil = <td className="planv-outil no-print">{lect ? null : <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOutils(l.id)} aria-label={`Outils de la ligne ${l.etape || ''}`} data-planv-outils={l.id}>⋮</button>}</td>;
          if (l.type !== 'etape') return <tr key={l.id} className={l.type === 'section' ? 'planv-section' : 'planv-note'} data-planv-ligne={l.id}>{outil}<td colSpan={n}><PlanCellule valeur={l.etape} lect={lect} label={l.type === 'section' ? 'Titre de section' : 'Note'} onCommit={(v) => cel(l.id, 'etape', v)} /></td></tr>;
          const op = planVinifOpDe(db, l); const def = op ? opDef(db, op) : null;
          return (<tr key={l.id} data-planv-ligne={l.id}>{outil}
            <td className="planv-e"><PlanCellule multi valeur={l.etape} lect={lect} label={`Libellé de l’étape : ${l.etape || ''}`} onCommit={(v) => cel(l.id, 'etape', v)} /><div className="planv-op no-print">{def ? <span>{`→ ${def.label}`}</span> : <span className="text-ink2">sans opération</span>}</div></td>
            <td className="planv-p"><PlanCellule multi valeur={l.produit} lect={lect} label={`Produit de l’étape : ${l.etape || ''}`} onCommit={(v) => cel(l.id, 'produit', v)} /></td>
            {planVinifCellules(plan, l).map((c) => <td key={c.key} colSpan={c.span} className={cx(!c.valeur && 'planv-vide')} data-planv-case={`${l.id}|${c.key}`}><PlanCellule valeur={c.valeur} lect={lect} label={`${l.etape || 'Étape'} · ${c.col.g.label} · ${c.col.r.label}${c.span === 1 ? ` · ${c.col.f.label}` : ''}`} onCommit={(v) => cel(l.id, c.key, v)} /></td>)}
          </tr>);
        })}
      </tbody>
    </table>
    {lect ? null : <div className="mt-2 flex flex-wrap gap-2 no-print"><Btn size="sm" onClick={() => act((d) => planVinifLigne(d, id, '', 'inserer', 'etape', uid))}>+ Étape</Btn><Btn size="sm" onClick={() => act((d) => planVinifLigne(d, id, '', 'inserer', 'section', uid))}>+ Titre de section</Btn><Btn size="sm" onClick={() => act((d) => planVinifLigne(d, id, '', 'inserer', 'note', uid))}>+ Note</Btn></div>}
    {outils ? <PlanLigneOutils plan={plan} ligneId={outils} onClose={() => setOutils(null)} /> : null}
  </>);
}
// outils d'une ligne : type, étendue des doses, opération créée à la création d'un lot, déplacer, insérer, retirer
function PlanLigneOutils({ plan, ligneId, onClose }) {
  const { db, act, uid } = useApp(); const l = (plan.lignes || []).find((x) => x.id === ligneId); if (!l) return null;
  const go = (action, val, msg) => act((d) => planVinifLigne(d, plan.id, ligneId, action, val, uid), msg);
  const devine = planVinifOpDevine(db, l.etape); const ops = opList(db).filter((o) => !['apport', 'pressurage', 'entree_mout', 'reprise', 'tirage', 'degorgement', 'preparation', 'alimentation', 'declassement', 'assemblage', 'regroupement'].includes(o.id));
  return (<Sheet title={<span>Ligne du plan — <span translate="no">{l.etape || '…'}</span></span>} onClose={onClose} footer={<Btn onClick={onClose}>Fermer</Btn>}>
    <div className="grid gap-3" data-planv-ligne-outils={ligneId}>
      <G><Field label="Type de ligne"><SI plain value={l.type} onChange={(v) => go('type', v)} options={Object.keys(PLANV_TYPES_LIB).map((k) => ({ value: k, label: PLANV_TYPES_LIB[k] }))} aria-label="Type de ligne" /></Field>
        {l.type === 'etape' ? <Field label="Doses"><SI plain value={l.etendue} onChange={(v) => go('etendue', v)} options={Object.keys(PLANV_ETENDUES_LIB).map((k) => ({ value: k, label: PLANV_ETENDUES_LIB[k] }))} aria-label="Étendue des doses" /></Field> : <div />}</G>
      {l.type === 'etape' ? <Field label="Opération à réaliser créée pour un nouveau lot" help={devine && !l.opId ? `Devinée d’après l’étape : ${(opDef(db, devine) || {}).label}.` : 'Sans opération : l’étape reste dans le tableau sans être proposée.'}>
        <SI plain value={l.opId || ''} onChange={(v) => go('operation', v, 'Opération liée.')} options={[{ value: '', label: devine ? `Automatique (${(opDef(db, devine) || {}).label})` : 'Aucune' }, ...ops.map((o) => ({ value: o.id, label: o.label }))]} aria-label="Opération liée" /></Field> : null}
      <div className="flex flex-wrap gap-2"><Btn onClick={() => go('monter')}>↑ Monter</Btn><Btn onClick={() => go('descendre')}>↓ Descendre</Btn>
        <Btn onClick={() => go('inserer', 'etape')}>＋ Étape après</Btn><Btn onClick={() => go('inserer', 'section')}>＋ Section après</Btn><Btn onClick={() => go('inserer', 'note')}>＋ Note après</Btn>
        <Btn kind="danger" onClick={() => { const r = go('retirer', null, 'Ligne retirée.'); if (r && r.ok) onClose(); }}>Retirer la ligne</Btn></div>
    </div>
  </Sheet>);
}

// choix multiple avec recherche (crus, partenaires…)
function ChoixMultiple({ items, value, onChange, label, recherche }) {
  const [q, setQ] = useState(''); const V = value || []; const L = items.filter((x) => V.includes(x.id) || !q || norm(x.label).includes(norm(q))).slice(0, recherche ? 40 : 400);
  return (<div className="grid gap-1" data-choix-multiple={label}>
    {recherche ? <TI value={q} onChange={setQ} placeholder="Rechercher…" aria-label={`Rechercher : ${label}`} style={{ maxWidth: 260 }} /> : null}
    <div className="flex flex-wrap gap-x-4 gap-y-1">{L.map((x) => <Check key={x.id} checked={V.includes(x.id)} onChange={(c) => onChange(c ? uniq([...V, x.id]) : V.filter((y) => y !== x.id))} label={<span translate="no">{x.label}</span>} />)}</div>
  </div>);
}
// conditions d'une variante
function PlanConditionsForm({ plan, onClose }) {
  const { db, act, uid } = useApp(); const [c, setC] = useState(() => JSON.parse(JSON.stringify(planVinifConditions(plan))));
  const save = () => { const r = act((d) => planVinifConditionsSet(d, plan.id, c, uid), 'Conditions du plan enregistrées.'); if (r && r.ok) onClose(); };
  return (<FormSheet wide title={<span>Conditions d’application — <span translate="no">{plan.nom}</span></span>} sub="Sans condition : plan général (tous les lots). Avec des conditions : variante, retenue pour les lots qui les remplissent toutes ; la plus précise l’emporte." onClose={onClose} onSave={save}>
    <div className="grid gap-3" data-planv-conditions="">
      {PLANV_CRITERES.map(([k, lib]) => <Group key={k} label={lib}><ChoixMultiple items={planCritereItems(db, k)} value={c[k] || []} onChange={(v) => setC((x) => ({ ...x, [k]: v }))} label={lib} recherche={k === 'crus' || k === 'apporteurs'} /></Group>)}
    </div>
  </FormSheet>);
}

/* ---------- proposition à la création d'un lot : étapes du plan → opérations à réaliser (sans date, dans l'ordre) ---------- */
function PlanFeuille({ lotIds: ids0, opId, auto, onClose }) {
  const { db, R, act, toast } = useApp();
  const op = opId ? db.ops.find((o) => o.id === opId) : null;
  const lotIds = useMemo(() => { const L = op ? lotsCreesPar(op) : (ids0 || []); return auto ? lotsSansSchema(db, L) : L; }, [op, ids0, auto]); // eslint-disable-line react-hooks/exhaustive-deps
  const lots = useMemo(() => lotIds.map((id) => { const l = R.lots[id]; if (!l) return null; const ps = Object.values(R.portions).filter((p) => p.lotId === id && p.vol > 0.5).sort((a, b) => b.vol - a.vol);
    return { id, l, vol: sum(ps, (p) => p.vol), portion: ps[0] || null, date: (op && op.date) || l.date || todayISO() }; }).filter((x) => x && x.vol > 0 && x.portion), [lotIds, R]); // eslint-disable-line react-hooks/exhaustive-deps
  const [planSel, setPlanSel] = useState(() => Object.fromEntries(lots.map((x) => [x.id, (planVinifPourLotChoix(db, R, x.id).meilleur || {}).id || ''])));
  const [force, setForce] = useState({}); const [exclus, setExclus] = useState({}); const [opSel, setOpSel] = useState({}); const [prods, setProds] = useState({});
  const P = plansVinifDe(db).filter((p) => p.actif !== false);
  const prep = lots.map((x) => {
    const plan = P.find((p) => p.id === planSel[x.id]) || null; if (!plan) return { x, plan: null, col: null, etapes: [] };
    const c = planVinifColonnePourLot(db, R, plan, x.id); const fk = force[x.id] || {}; const pick = (k, d) => (fk[k] !== undefined ? fk[k] : d ? d.id : '');
    const col = planVinifColonnes(plan).find((cc) => cc.g.id === pick('g', c.groupe) && cc.r.id === pick('r', c.revendication) && cc.f.id === pick('f', c.fraction)) || null;
    const etapes = planVinifEtapes(db, R, plan, col, x.vol).map((e) => { const k = `${x.id}|${e.ligne.id}`; const oid = opSel[k] !== undefined ? opSel[k] : e.opId; const def = oid ? opDef(db, oid) : null;
      const pr = e.famille ? schemaProduits(db, R, { famille: e.famille }) : []; const pid = prods[k] !== undefined ? prods[k] : (pr[0] ? pr[0].id : ''); const p = pid ? (db.produits || []).find((y) => y.id === pid) : null;
      return { ...e, k, opId: oid, def, base: def ? def.base : '', produits: pr, produitId: pid, produit: p, qty: p ? planVinifQteProduit(e.quantite, p.unite) : null, retenue: !!def && exclus[k] !== true && (exclus[k] === false || e.retenue) }; });
    return { x, plan, c, col, etapes, fk };
  });
  const nb = sum(prep, (p) => p.etapes.filter((e) => e.retenue).length);
  /* proposition automatique : rien à proposer (aucun lot avec une colonne et des étapes) → fermée d'elle-même */
  const rien = !!auto && !prep.some((p) => p.plan && p.col && p.etapes.length);
  useEffect(() => { if (rien) onClose(); }, [rien]); // eslint-disable-line react-hooks/exhaustive-deps
  const item = (x, e) => {
    const f0 = opInit(e.base, null, db, x.date); if (e.def.id !== e.base) f0.sousType = e.def.id;
    if (e.base !== 'etape') f0.portionId = x.portion.id; else { f0.lotId = x.id; if (e.def.stadeAuto && e.def.stadeAuto.actif && stadeDef(db, e.def.stadeAuto.stade)) f0.newStade = e.def.stadeAuto.stade; }
    if (['intrant', 'suivi'].includes(e.base)) { if (e.def.motif) f0.motif = e.def.motif;
      if (e.produit) { const a = (db.arrivages || []).filter((z) => z.produitId === e.produit.id).map((z) => ({ z, r: arrivalRest(R, z) })).filter((q) => q.r > 1e-6).sort((p1, p2) => ((p1.z.dluo || '9999') < (p2.z.dluo || '9999') ? -1 : 1))[0];
        f0.lignes = [{ produitId: e.produit.id, arrivageId: a ? a.z.id : '', qty: e.qty == null ? '' : String(e.qty) }]; } }
    const note = `${e.ligne.etape}${e.ligne.produit ? ` — ${e.ligne.produit}` : ''} : ${e.valeur}`; f0.notes = note;
    return { type: e.base, date: x.date, f: { ...f0, date: x.date }, resume: `${e.def.label} · ${x.l.code}${e.produit ? ` · ${e.produit.nom}${e.qty != null ? ` ${fmt(e.qty, 2)} ${e.produit.unite}` : ''}` : ` · ${e.valeur}`}`, notes: note, ligneId: e.ligne.id };
  };
  const creer = () => {
    const L = prep.filter((p) => p.plan && p.col && p.etapes.some((e) => e.retenue)); if (!L.length) { toast('Choisissez un plan, la colonne du lot et au moins une étape.', 'bad'); return; }
    const r = act((d) => { for (const p of L) { const x = planVinifAppliquer(d, p.x.id, p.plan, p.col.key, p.etapes.filter((e) => e.retenue).map((e) => item(p.x, e))); if (!x.ok) return fail(`${p.x.l.code} : ${x.msg}`); } return okr(); },
      `${nb} opération(s) à réaliser créée(s) d’après le plan de vinification : elles attendent dans « À réaliser », dans l’ordre.`);
    if (r && r.ok) onClose();
  };
  if (!lots.length) return <Sheet title="Plan de vinification" onClose={onClose}><Empty>Aucun lot en cuve à qui proposer le plan.</Empty></Sheet>;
  return (<Sheet wide title="🗂 Étapes du plan de vinification pour les lots créés" sub="Dans l’ordre du tableau, sans date : chaque étape devient une opération à réaliser, validée quand elle est faite." onClose={onClose}
    footer={<><Btn onClick={onClose}>Plus tard</Btn><Btn kind="primary" onClick={creer} disabled={!nb} data-plan-creer="">{`✓ Créer les opérations à réaliser (${nb})`}</Btn></>}>
    <div data-plan-feuille="">{prep.map((p) => (<div key={p.x.id} className="card mb-3 p-3" data-plan-lot={p.x.id}>
      <div className="mb-2 flex flex-wrap items-end gap-2"><b translate="no">{p.x.l.code}</b><span className="text-sm text-ink2">{fmtL(p.x.vol)}</span>
        <Field label="Plan"><SI plain value={planSel[p.x.id] || ''} onChange={(v) => { setPlanSel((s) => ({ ...s, [p.x.id]: v })); setForce((s) => ({ ...s, [p.x.id]: {} })); }} options={[{ value: '', label: 'Aucun' }, ...planVinifPourLotChoix(db, R, p.x.id).proposes.map((x, i) => ({ value: x.id, label: `${x.nom}${i ? '' : ' (retenu)'}`, donnee: true })), ...P.filter((x) => !planVinifPourLotChoix(db, R, p.x.id).proposes.includes(x)).map((x) => ({ value: x.id, label: `${x.nom} (conditions non remplies)`, donnee: true }))]} aria-label={`Plan du lot ${p.x.l.code}`} /></Field>
        {p.plan ? [['g', 'groupes', 'Groupe de cépages', p.c.groupe, `Groupe de cépages du lot ${p.x.l.code}`], ['r', 'revendications', 'Revendication', p.c.revendication, `Revendication du lot ${p.x.l.code}`], ['f', 'fractions', 'Fraction', p.c.fraction, `Fraction du lot ${p.x.l.code}`]].map(([k, liste, lib, d, aria]) => <Field key={k} label={lib}><SI plain value={p.fk[k] !== undefined ? p.fk[k] : d ? d.id : ''} onChange={(v) => setForce((s) => ({ ...s, [p.x.id]: { ...(s[p.x.id] || {}), [k]: v } }))} options={[{ value: '', label: '— à choisir —' }, ...planVinifListe(p.plan[liste]).map((y) => ({ value: y.id, label: y.label }))]} aria-label={aria} /></Field>) : null}
      </div>
      {p.plan && p.plan.conditions ? <p className="help" translate="no">{planConditionsTexte(db, p.plan)}</p> : null}
      {!p.plan ? <p className="help">Aucun plan pour ce lot.</p> : !p.col ? <Notice tone="warn" title="Colonne à choisir">Le lot ne correspond à aucune colonne du plan : choisissez le groupe de cépages, la revendication et la fraction.</Notice> : (
        <Tbl rows={p.etapes.map((e) => ({ ...e, id: e.k }))} empty="Aucune étape renseignée dans cette colonne." cols={[
          { h: '', r: (e) => <input type="checkbox" className="h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={e.retenue} disabled={!e.def} onChange={(ev) => setExclus((s) => ({ ...s, [e.k]: !ev.target.checked }))} aria-label={`Retenir l’étape ${e.ligne.etape}`} /> },
          { h: 'Étape', r: (e) => <div><b>{e.ligne.etape}</b>{e.section ? <div className="text-xs text-ink2">{e.section}</div> : null}</div> },
          { h: 'Dose', r: (e) => <span translate="no">{`${e.ligne.produit ? `${e.ligne.produit} : ` : ''}${e.valeur}`}</span> },
          { h: 'Opération', r: (e) => <SI plain value={e.opId || ''} onChange={(v) => setOpSel((s) => ({ ...s, [e.k]: v }))} options={[{ value: '', label: 'Aucune' }, ...opList(db).filter((o) => ['intrant', 'suivi', 'froid', 'filtration', 'debourbage', 'soutirage', 'etape'].includes(o.base)).map((o) => ({ value: o.id, label: o.label }))]} aria-label={`Opération de l’étape ${e.ligne.etape}`} /> },
          { h: 'Produit et quantité', r: (e) => (e.produits.length ? <span className="flex flex-wrap items-center gap-1"><SI plain value={e.produitId} onChange={(v) => setProds((s) => ({ ...s, [e.k]: v }))} options={[{ value: '', label: '—' }, ...e.produits.map((y) => ({ value: y.id, label: y.nom, donnee: true }))]} aria-label={`Produit de l’étape ${e.ligne.etape}`} />{e.qty != null ? <span className="num text-sm" translate="no">{`${fmt(e.qty, 2)} ${e.produit.unite}`}</span> : null}</span> : e.quantite ? <span className="num text-sm" translate="no">{`${fmt(e.quantite.qte, 2)} ${e.quantite.unite}`}</span> : <span className="text-ink2">—</span>) },
        ]} />)}
    </div>))}</div>
  </Sheet>);
}
