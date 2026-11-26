/* ============ SCHÉMAS DE VINIFICATION — interface (0.31.0-alpha.1) ============
   Proposition à la création d'un lot (pressurage validé, entrée de moûts) : schéma le plus proche des critères du lot, étapes cochées,
   produits et quantités calculées → « ✓ Créer les opérations à réaliser » (un clic). Fiche du lot : rubrique « Schéma de vinification »
   (étapes prévues et réalisées, impression, retrait des étapes à réaliser). Paramètres › Schémas de vinification. Impressions : logigramme
   vertical, frise ou tableau (61d-visuel.jsx). */
const fracNom = (db, id) => (fracList(db).find((f) => f.id === id) || {}).label || id;
const schemaEtatLabel = (e) => (SCHEMA_ETATS.find((x) => x.id === e) || {}).label || e;
const schemaEtatChip = (s) => (s.aVerifier ? <Chip tone="warn">{s.exemple ? 'exemple à vérifier' : 'à vérifier'}</Chip> : <Chip tone="good">vérifié</Chip>);
// critères lisibles : « Chardonnay · Cuvée · Sain »
const criteresTexte = (db, c) => [(c.cepages || []).map((x) => lbl(db, 'cepages', x)).join(', '), (c.fractions || []).map((x) => fracNom(db, x)).join(', '), (c.etats || []).map(schemaEtatLabel).join(', ')].filter(Boolean).join(' · ') || 'tous les lots';
const joursEcart = (a, b) => Math.round((new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`)) / 86400000);
// lignes à imprimer d'un schéma type (sans dates ni quantités)
const schemaLignesDef = (db, s) => [...(s.etapes || [])].sort((a, b) => a.jour - b.jour).map((e) => ({ jour: e.jour, date: '', label: (opDef(db, e.opId) || {}).label || e.opId, produit: e.famille ? famLabel(e.famille) : '', fam: !!e.famille, dose: schemaDoseTexte(e), qte: '', note: e.note || '' }));
// rendu d'un schéma dans la forme choisie (o.avecDates : opérations prévues d'un lot, avec dates, quantités et colonne visa)
// produit : nom du produit (donnée, non traduite) ou famille du catalogue (l.fam, traduite)
const schemaProduitEl = (l) => (!l.produit ? '' : l.fam ? <span>{l.produit}</span> : <span translate="no">{l.produit}</span>);
function schemaRendu(lignes, forme, o) {
  o = o || {}; const det = (l) => [l.produit || l.dose ? <>{schemaProduitEl(l)}{l.produit && l.dose ? ' — ' : null}{l.dose ? <span>{l.dose}</span> : null}</> : '', l.qte ? <span translate="no">{l.qte}</span> : '', l.note, l.statut];
  if (forme === 'logigramme') return <Logigramme colonnes={[{ titre: o.titreCol || '', boites: lignes.map((l) => ({ haut: <><span>{`J+${l.jour}`}</span>{l.date ? <> · <span translate="no">{fmtDate(l.date)}</span></> : null}</>, titre: l.label, lignes: det(l) })) }]} />;
  if (forme === 'frise') {
    const jours = uniq(lignes.map((l) => l.jour)).sort((a, b) => a - b);
    return <Frise colonnes={jours.map((j) => { const L = lignes.filter((l) => l.jour === j); return { haut: `J+${j}`, sous: L[0].date ? fmtDate(L[0].date) : '', boites: L.map((l) => ({ titre: l.label, lignes: det(l) })) }; })} />;
  }
  return <TableauVis entetes={o.avecDates ? ['Jour', 'Date', 'Opération', 'Produit', 'Dose', 'Quantité', 'Consignes', 'Fait le / visa'] : ['Jour', 'Opération', 'Famille de produit', 'Dose', 'Consignes']}
    lignes={lignes.map((l) => (o.avecDates ? [`J+${l.jour}`, l.date ? <span translate="no">{fmtDate(l.date)}</span> : '', l.label, schemaProduitEl(l), l.dose, l.qte ? <span translate="no">{l.qte}</span> : '', l.note, l.statut || ''] : [`J+${l.jour}`, l.label, schemaProduitEl(l), l.dose, l.note]))} />;
}
// lots d'une opération qui en crée : fractions d'un pressurage, lots d'une entrée de moûts (avec du volume)
const lotsCreesPar = (op) => (!op ? [] : op.type === 'pressurage' ? (op.fractions || []).filter((x) => num(x.volL) > 0).map((x) => x.lotId) : op.type === 'entree_mout' ? moutLots(op).filter((l) => l.vol > 0).map((l) => l.lotId) : []).filter(Boolean);

/* ---------- proposition : appliquer un schéma à un ou plusieurs lots ---------- */
function SchemaFeuille({ lotIds: ids0, opId, auto, onClose }) {
  const { db, R, act, toast } = useApp(); const lect = useLectureSeule('previsions');
  const op = opId ? db.ops.find((o) => o.id === opId) : null;
  const lotIds = useMemo(() => { const L = op ? lotsCreesPar(op) : (ids0 || []); return auto ? lotsSansSchema(db, L) : L; }, [op, ids0, auto]); // eslint-disable-line react-hooks/exhaustive-deps
  const lots = useMemo(() => lotIds.map((id) => { const l = R.lots[id]; if (!l) return null; const ps = Object.values(R.portions).filter((p) => p.lotId === id && p.vol > 0.5).sort((a, b) => b.vol - a.vol);
    return { id, l, vol: sum(ps, (p) => p.vol), portion: ps[0] || null, date: (op && op.date) || l.date || todayISO(), crit: lotCriteres(db, R, id) }; }).filter((x) => x && x.vol > 0 && x.portion), [lotIds, R]); // eslint-disable-line react-hooks/exhaustive-deps
  const [sel, setSel] = useState(() => Object.fromEntries(lots.map((x) => [x.id, (schemasPourLot(db, R, x.id).meilleur || {}).id || ''])));
  const [exclus, setExclus] = useState({}); const [prods, setProds] = useState({}); const [imp, setImp] = useState(null);
  const S = schemasDe(db);
  const plans = lots.map((x) => { const s = S.find((y) => y.id === sel[x.id]); if (!s) return { x, s: null, plan: [] };
    const ch = {}; s.etapes.forEach((e) => { const k = `${x.id}|${e.id}`; if (prods[k] !== undefined) ch[e.id] = { produitId: prods[k] }; });
    return { x, s, plan: schemaPlan(db, R, s, { date: x.date, vol: x.vol }, ch) }; });
  const retenues = (p) => p.plan.filter((y) => !exclus[`${p.x.id}|${y.e.id}`] && !y.inconnue);
  const nb = sum(plans, (p) => retenues(p).length);
  const item = (x, y) => {
    const f0 = opInit(y.base, null, db, y.date); if (y.def.id !== y.base) f0.sousType = y.def.id;
    if (y.base !== 'etape') f0.portionId = x.portion.id;
    if (y.base === 'etape') { f0.lotId = x.id; if (y.def.stadeAuto && y.def.stadeAuto.actif && stadeDef(db, y.def.stadeAuto.stade)) f0.newStade = y.def.stadeAuto.stade; if (y.def.nature) f0.newType = y.def.nature; }
    if (['intrant', 'suivi'].includes(y.base)) { if (y.def.motif) f0.motif = y.def.motif;
      if (y.produit) { const a = (db.arrivages || []).filter((z) => z.produitId === y.produit.id).map((z) => ({ z, r: arrivalRest(R, z) })).filter((q) => q.r > 1e-6).sort((p1, p2) => ((p1.z.dluo || '9999') < (p2.z.dluo || '9999') ? -1 : 1))[0];
        f0.lignes = [{ produitId: y.produit.id, arrivageId: a ? a.z.id : '', qty: y.qty == null ? '' : String(y.qty) }]; } }
    f0.notes = y.e.note || '';
    return { type: y.base, date: y.date, f: { ...f0, date: y.date }, resume: `${y.label} · ${x.l.code}${y.produit ? ` · ${y.produit.nom}${y.qty != null ? ` ${fmt(y.qty, 2)} ${y.produit.unite}` : ''}` : ''}`, notes: y.e.note || '', etapeId: y.e.id };
  };
  const creer = () => {
    const P = plans.filter((p) => p.s && retenues(p).length); if (!P.length) { toast('Choisissez un schéma et au moins une étape.', 'bad'); return; }
    const r = act((d) => { for (const p of P) { const x = schemaAppliquer(d, p.x.id, p.s, retenues(p).map((y) => item(p.x, y))); if (!x.ok) return fail(`${p.x.l.code} : ${x.msg}`); } return okr(); },
      `${nb} opération(s) à réaliser créée(s) d’après le schéma : elles attendent dans « À réaliser ».`);
    if (r && r.ok) onClose();
  };
  const lignesImp = (p) => retenues(p).map((y) => ({ jour: y.e.jour, date: y.date, label: y.label, produit: y.produit ? y.produit.nom : (y.e.famille ? famLabel(y.e.famille) : ''), fam: !y.produit && !!y.e.famille, dose: schemaDoseTexte(y.e), qte: y.qty != null && y.produit ? `${fmt(y.qty, 2)} ${y.produit.unite}` : '', note: y.e.note || '' }));
  // proposition automatique (création du lot) : rien à proposer (lots déjà dotés d'un schéma, aucun schéma correspondant) → pas de feuille
  const rien = !!auto && (!lots.length || !lots.some((x) => sel[x.id]));
  useEffect(() => { if (rien) onClose(); }, [rien]); // eslint-disable-line react-hooks/exhaustive-deps
  if (rien) return null;
  if (!lots.length) return <Sheet title="Schéma de vinification" onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Fermer</Btn>}><Empty>Aucun lot avec du volume à qui proposer un schéma.</Empty></Sheet>;
  return (
    <Sheet wide title="Schéma de vinification proposé" sub="Le schéma le plus proche de chaque lot (cépage, fraction, état sanitaire des raisins) ; un clic crée ses opérations à réaliser." onClose={onClose}
      footer={<><Btn onClick={onClose} className="mr-auto">{auto ? 'Plus tard' : 'Annuler'}</Btn>{lect ? null : <Btn kind="primary" disabled={!nb} onClick={creer}>✓ Créer les opérations à réaliser ({nb})</Btn>}</>}>
      <p className="help mb-3">Les opérations créées restent à valider une à une dans « À réaliser », avec les quantités réelles ; rien n’est déduit des stocks avant. Les doses des exemples sont des valeurs courantes non officielles, à adapter.</p>
      <div className="space-y-4" data-schema-feuille="">
        {plans.map((p) => (
          <div key={p.x.id} className="rounded-md border border-line p-3" data-schema-lot={p.x.id}>
            <div className="flex flex-wrap items-center gap-2"><b translate="no">{p.x.l.code}</b><span className="num text-sm text-ink2" translate="no">{fmtL(p.x.vol)}</span>
              {p.x.crit.cepage ? <Chip>{lbl(db, 'cepages', p.x.crit.cepage)}</Chip> : null}{p.x.crit.fraction ? <Chip>{fracNom(db, p.x.crit.fraction)}</Chip> : null}{p.x.crit.etat ? <Chip tone={p.x.crit.etat === 'sain' ? 'good' : 'warn'}>{schemaEtatLabel(p.x.crit.etat)}</Chip> : null}
              <span className="ml-auto" /><SI value={sel[p.x.id] || ''} onChange={(v) => setSel({ ...sel, [p.x.id]: v })} plain style={{ width: 'auto', maxWidth: '100%' }} aria-label="Schéma"
                options={[...schemasPourLot(db, R, p.x.id).proposes.map((s, i) => ({ value: s.id, label: i ? s.nom : `${s.nom} (proposé)` })), ...S.filter((s) => !schemasPourLot(db, R, p.x.id).proposes.some((y) => y.id === s.id)).map((s) => ({ value: s.id, label: s.nom })), { value: '', label: 'Aucun schéma' }]} />
              {p.s ? <Btn size="sm" onClick={() => setImp(p)}>🖨 Imprimer…</Btn> : null}</div>
            {p.s ? (
              <div className="mt-2"><Tbl rows={p.plan.map((y) => ({ ...y, id: y.e.id }))} cols={[
                { h: '', r: (y) => <input type="checkbox" checked={!exclus[`${p.x.id}|${y.e.id}`] && !y.inconnue} disabled={y.inconnue} onChange={(e) => setExclus({ ...exclus, [`${p.x.id}|${y.e.id}`]: !e.target.checked })} aria-label={`Retenir l’étape ${y.label}`} /> },
                { h: 'Jour', r: (y) => <span className="num whitespace-nowrap"><span>{`J+${y.e.jour}`}</span> <span className="text-xs text-ink2" translate="no">{fmtDate(y.date)}</span></span> },
                { h: 'Opération', r: (y) => (y.inconnue ? <span className="text-bad"><span>Opération inconnue</span> <span translate="no">({y.e.opId})</span></span> : <b>{y.label}</b>) },
                { h: 'Produit', r: (y) => (y.e.famille ? (y.produits.length ? <SI value={y.produitId || ''} onChange={(v) => setProds({ ...prods, [`${p.x.id}|${y.e.id}`]: v })} placeholder="—" aria-label={`Produit de l’étape ${y.label}`} options={y.produits.map((x) => ({ value: x.id, label: `${x.nom} (${x.unite})` }))} />
                  : <span className="text-xs text-ink2"><span>aucun produit de la famille</span> <span>{famLabel(y.e.famille)}</span></span>) : '—') },
                { h: 'Dose', r: (y) => (y.e.dose != null ? <span className="whitespace-nowrap">{schemaDoseTexte(y.e)}</span> : '—') },
                { h: 'Quantité', cls: 'r', r: (y) => (y.qty != null && y.produit ? <b className="num" translate="no">{fmt(y.qty, 2)} {y.produit.unite}</b> : y.sansTeneur ? <span className="text-xs text-warn">teneur en SO₂ du produit inconnue</span> : y.incompatible ? <span className="text-xs text-warn">unité de dose incompatible</span> : '—') },
                { h: 'Consigne', r: (y) => (y.e.note ? <span className="text-xs">{y.e.note}</span> : '') },
              ]} /></div>
            ) : <p className="help mt-2">Aucun schéma : rien ne sera créé pour ce lot.</p>}
          </div>
        ))}
      </div>
      {imp ? <ImpressionVisuelle cle="schema-lot" titre={`${imp.s.nom} — ${imp.x.l.code}`} sous={`${fmtL(imp.x.vol)} · ${criteresTexte(db, { cepages: imp.x.crit.cepage ? [imp.x.crit.cepage] : [], fractions: imp.x.crit.fraction ? [imp.x.crit.fraction] : [], etats: imp.x.crit.etat ? [imp.x.crit.etat] : [] })}`}
        nomFichier={`schema-${imp.x.l.code}`} rendu={(f) => schemaRendu(lignesImp(imp), f, { avecDates: true, titreCol: imp.x.l.code })} note={imp.s.note} onClose={() => setImp(null)} /> : null}
    </Sheet>
  );
}

/* ---------- fiche du lot : schéma appliqué (étapes prévues et réalisées) ---------- */
function SchemaLotBloc({ lotId }) {
  const { db, R, act, confirm, openSchema } = useApp(); const lect = useLectureSeule('previsions'); const [imp, setImp] = useState(false);
  const P = schemaPrevsDuLot(db, lotId); const l = R.lots[lotId] || {}; const d0 = l.date || (P[0] && P[0].date) || todayISO();
  if (!P.length) return <div className="flex flex-wrap items-center gap-2 text-sm" data-schema-bloc={lotId}><span className="text-ink2">Aucun schéma appliqué à ce lot.</span>{lect ? null : <Btn size="sm" onClick={() => openSchema({ lotIds: [lotId] })}>📋 Appliquer un schéma…</Btn>}</div>;
  const nom = P[0].schema.nom; const aFaire = P.filter((p) => p.statut === 'prevue');
  // lignes à imprimer : produit et quantité prévus (1re ligne d'intrant), dose et consigne de l'étape du schéma (s'il existe encore)
  const S0 = schemasDe(db).find((x) => x.id === P[0].schema.id);
  const lignes = P.map((p) => { const li = ((p.f || {}).lignes || [])[0]; const pr = li && (db.produits || []).find((x) => x.id === li.produitId); const et = S0 && S0.etapes.find((e) => e.id === p.schema.etapeId);
    return { jour: joursEcart(d0, p.date), date: p.date, label: opNom(p), produit: pr ? pr.nom : '', dose: et ? schemaDoseTexte(et) : '', qte: pr && li.qty !== '' && li.qty != null ? `${fmt(num(li.qty), 2)} ${pr.unite}` : '', note: p.notes || '', statut: (PREV_STATUT[p.statut] || {}).label }; });
  const retirer = async () => { if (!(await confirm({ title: 'Retirer les étapes à réaliser ?', body: `${aFaire.length} opération(s) à réaliser du schéma « ${nom} » seront supprimées ; les opérations déjà validées restent.`, ok: 'Retirer', danger: true }))) return; act((d) => schemaRetirer(d, lotId), 'Étapes à réaliser retirées.'); };
  return (
    <div data-schema-bloc={lotId}>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm"><span>📋</span><b>{nom}</b><span className="text-ink2"><span translate="no">{fmt(P.length - aFaire.length)} / {fmt(P.length)}</span> <span>étape(s) validée(s)</span></span>
        <span className="ml-auto flex flex-wrap gap-1"><Btn size="sm" onClick={() => setImp(true)}>🖨 Imprimer…</Btn>{!lect && aFaire.length ? <Btn size="sm" kind="danger" onClick={retirer}>Retirer les étapes à réaliser</Btn> : null}</span></div>
      <Tbl rows={P.map((p, i) => ({ ...p, l: lignes[i] }))} cols={[{ h: 'Date', r: (p) => <span className="num whitespace-nowrap"><span>{`J+${joursEcart(d0, p.date)}`}</span> <span className="text-xs text-ink2" translate="no">{fmtDate(p.date)}</span></span> },
        { h: 'Étape', r: (p) => <><b>{p.l.label}</b>{p.l.produit ? <> · <span translate="no">{p.l.produit}{p.l.qte ? ` ${p.l.qte}` : ''}</span></> : null}{p.l.note ? <div className="text-xs text-ink2">{p.l.note}</div> : null}</> },
        { h: 'Statut', r: (p) => <Chip tone={(PREV_STATUT[p.statut] || {}).tone}>{(PREV_STATUT[p.statut] || {}).label}</Chip> }]} />
      {imp ? <ImpressionVisuelle cle="schema-lot" titre={`${nom} — ${l.code || ''}`} sous="Opérations prévues et réalisées" nomFichier={`schema-${l.code || 'lot'}`}
        rendu={(f) => schemaRendu(lignes, f, { avecDates: true, titreCol: l.code })} onClose={() => setImp(false)} /> : null}
    </div>
  );
}
// pastille dans « À réaliser » et dans le journal : étape d'un schéma
function SchemaChip({ x }) { if (!x || !x.schema || !x.schema.nom) return null; return <Chip title={x.schema.nom} data-schema-chip=""><span>📋 schéma</span></Chip>; }

/* ---------- Paramètres › Schémas de vinification ---------- */
function SchemasView() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('params'); const ask = useRetirer(); const [form, setForm] = useState(null); const [imp, setImp] = useState(null);
  const L = schemasDe(db); const reg = schemasReglage(db); const nv = L.filter((s) => s.aVerifier).length;
  return (
    <>
      <Notice tone={nv ? 'warn' : 'info'} title="Schémas de vinification">
        <span>Suites d’opérations types (sulfitage, enzymage, débourbage, levurage, nutrition, suivis, fin de FA…) proposées à la création d’un lot selon son cépage, sa fraction et l’état sanitaire des raisins. Validé en un clic, un schéma devient des opérations à réaliser, quantités calculées sur le volume du lot.</span>{' '}
        <span>Les exemples sont des valeurs courantes non officielles : adaptez-les avec votre œnologue.</span>{nv ? <>{' '}<span translate="no">{fmt(nv)}</span> <span>schéma(s) à vérifier.</span></> : null}
      </Notice>
      <div className="my-3"><Check checked={reg.proposer} disabled={lect} onChange={(v) => act((d) => { d.settings.schemas = { ...((d.settings && d.settings.schemas) || {}), proposer: v }; return okr(); }, v ? 'Un schéma sera proposé à la création des lots.' : 'Plus de proposition automatique : appliquez un schéma depuis la fiche du lot.')} label="Proposer un schéma à la création d’un lot (pressurage validé, entrée de moûts)" /></div>
      <Sec title="Schémas" right={lect ? null : <Btn kind="primary" onClick={() => setForm({})}>+ Nouveau schéma</Btn>}>
        <div data-schemas=""><Tbl rows={L} empty="Aucun schéma." cols={[
          { h: 'Schéma', r: (s) => <b>{s.nom}</b> }, { h: 'Pour', r: (s) => <span className="text-sm">{criteresTexte(db, s.criteres || {})}</span> },
          { h: 'Étapes', r: (s) => <span className="num whitespace-nowrap"><span translate="no">{fmt(s.etapes.length)}</span> · <span>{`J+${Math.max(0, ...s.etapes.map((e) => e.jour))}`}</span></span> }, { h: 'État', r: schemaEtatChip },
          { h: '', r: (s) => <div className="flex flex-wrap gap-1"><Btn size="sm" onClick={() => setImp(s)}>🖨 Imprimer…</Btn>{lect ? null : <>{s.aVerifier ? <Btn size="sm" kind="primary" onClick={() => act((d) => schemaValider(d, s.id, uid), 'Schéma vérifié.')}>✓ Vérifié</Btn> : null}
            <Btn size="sm" onClick={() => setForm({ id: s.id })}>Modifier</Btn><Btn size="sm" onClick={() => act((d) => schemaDupliquer(d, s.id, uid), 'Schéma dupliqué : modifiez la copie.')}>Dupliquer</Btn>
            <Btn size="sm" kind="danger" onClick={() => ask('Retirer ce schéma ?', (d) => schemaSupprimer(d, s.id), 'Schéma retiré.', 'Les opérations à réaliser déjà créées d’après lui restent.')}>Retirer</Btn></>}</div> },
        ]} /></div>
      </Sec>
      {form ? <SchemaForm id={form.id} onClose={() => setForm(null)} /> : null}
      {imp ? <ImpressionVisuelle cle="schema" titre={imp.nom} sous={`Pour : ${criteresTexte(db, imp.criteres || {})}`} nomFichier={`schema-${slug(imp.nom)}`} rendu={(f) => schemaRendu(schemaLignesDef(db, imp), f, { titreCol: imp.nom })} note={imp.note} onClose={() => setImp(null)} /> : null}
    </>
  );
}
const SCHEMA_BASES = ['intrant', 'suivi', 'debourbage', 'soutirage', 'transfert', 'etape', 'froid', 'filtration'];
function SchemaForm({ id, onClose }) {
  const { db, act, uid } = useApp(); const s0 = id ? schemasDe(db).find((x) => x.id === id) : null;
  const E = (e) => ({ ...e, jour: String(e.jour == null ? 0 : e.jour), dose: e.dose == null ? '' : String(e.dose) });
  const [f, set] = useDraft(s0 ? { nom: s0.nom, criteres: { cepages: [...((s0.criteres || {}).cepages || [])], fractions: [...((s0.criteres || {}).fractions || [])], etats: [...((s0.criteres || {}).etats || [])] }, etapes: s0.etapes.map(E), note: s0.note || '', verifie: !s0.aVerifier }
    : { nom: '', criteres: { cepages: [], fractions: [], etats: [] }, etapes: [E({ id: 'e1', jour: 0, opId: 'sulfitage', famille: 'sulfitage', dose: null, unite: 'so2', note: '' })], note: '', verifie: true });
  const ops = opList(db).filter((o) => SCHEMA_BASES.includes(o.base) && (!o.masque || f.etapes.some((e) => e.opId === o.id)));
  const crit = (k, v, on) => set('criteres', { ...f.criteres, [k]: on ? uniq([...f.criteres[k], v]) : f.criteres[k].filter((x) => x !== v) });
  const etape = (i, patch) => set('etapes', f.etapes.map((e, k) => (k === i ? { ...e, ...patch } : e)));
  const bouge = (i, d) => { const L = [...f.etapes]; const j = i + d; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; set('etapes', L); };
  const save = () => { const r = act((d) => schemaSave(d, { ...f, etapes: f.etapes.map((e) => ({ ...e, jour: num(e.jour), dose: String(e.dose).trim() === '' ? null : num(e.dose) })), aVerifier: !f.verifie }, id, uid), id ? 'Schéma modifié.' : 'Schéma créé.'); if (r && r.ok !== false) onClose(); };
  const groupe = (k, titre, items) => <Group label={titre}><div className="flex flex-wrap gap-x-4 gap-y-1">{items.map((x) => <Check key={x.id} checked={f.criteres[k].includes(x.id)} onChange={(v) => crit(k, x.id, v)} label={x.label} />)}</div></Group>;
  return (
    <FormSheet wide title={id ? 'Modifier le schéma' : 'Nouveau schéma de vinification'} onClose={onClose} onSave={save}>
      <Field label="Nom du schéma"><TI value={f.nom} onChange={(v) => set('nom', v)} placeholder="ex. Cuvée de Chardonnay, raisins sains" autoFocus /></Field>
      <p className="help">Critères (rien de coché : tous les lots). Le schéma est proposé aux lots qui les remplissent ; le plus précis d’abord.</p>
      {groupe('cepages', 'Cépage majoritaire', (db.lists.cepages || []).map((c) => ({ id: c.id, label: c.label })))}
      {groupe('fractions', 'Fraction', fracList(db).map((x) => ({ id: x.id, label: x.label })))}
      {groupe('etats', 'État sanitaire des raisins', SCHEMA_ETATS)}
      <Group label="Étapes (jour après la création du lot)">
        <div className="space-y-2" data-schema-etapes="">
          {f.etapes.map((e, i) => (
            <div key={i} className="rounded-md border border-line p-2" data-schema-etape={i}>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
                <Field label="Jour (J+)"><NI value={e.jour} onChange={(v) => etape(i, { jour: v })} /></Field>
                <Field label="Opération"><SI value={e.opId} onChange={(v) => etape(i, { opId: v })} options={ops.map((o) => ({ value: o.id, label: o.label }))} /></Field>
                <Field label="Famille de produit"><SI value={e.famille || ''} onChange={(v) => etape(i, { famille: v })} placeholder="—" options={CATALOGUE_FAMILLES.map(([k, label]) => ({ value: k, label, t: true }))} /></Field>
                <Field label="Dose"><NI value={e.dose} onChange={(v) => etape(i, { dose: v })} placeholder="—" /></Field>
                <Field label="Unité de dose"><SI value={e.unite || ''} onChange={(v) => etape(i, { unite: v })} plain options={[{ value: '', label: '—' }, ...SCHEMA_UNITES.map((u) => ({ value: u.id, label: u.label }))]} /></Field>
              </div>
              <div className="mt-2 flex flex-wrap items-end gap-2"><div className="min-w-0 flex-1"><Field label="Consigne"><TI value={e.note || ''} onChange={(v) => etape(i, { note: v })} placeholder="ex. au pressurage, au fur et à mesure de l’écoulement des jus" /></Field></div>
                <Btn size="sm" aria-label="Monter l’étape" onClick={() => bouge(i, -1)} disabled={!i}>▲</Btn><Btn size="sm" aria-label="Descendre l’étape" onClick={() => bouge(i, 1)} disabled={i === f.etapes.length - 1}>▼</Btn>
                <Btn size="sm" kind="danger" aria-label="Retirer l’étape" onClick={() => set('etapes', f.etapes.filter((_, k) => k !== i))}>✕</Btn></div>
            </div>
          ))}
          <Btn size="sm" onClick={() => set('etapes', [...f.etapes, E({ id: `e${Date.now().toString(36)}`, jour: f.etapes.length ? f.etapes[f.etapes.length - 1].jour : 0, opId: 'suivi', famille: '', dose: null, unite: '', note: '' })])}>+ Ajouter une étape</Btn>
        </div>
      </Group>
      <Field label="Note"><TA value={f.note} onChange={(v) => set('note', v)} rows={2} /></Field>
      <Check checked={!!f.verifie} onChange={(v) => set('verifie', v)} label="Vérifié (sinon : à vérifier)" />
    </FormSheet>
  );
}
