/* ============ ONGLET 2 : OPÉRATIONS & ASSEMBLAGES · ONGLET DÉCLASSEMENTS ============ */
function OpWarns({ r, open, setOpen }) {
  const { act } = useApp(); const op = r.op;
  if (!r.warns.length) return <span className="text-xs text-ink2">—</span>;
  return (
    <div>
      <button type="button" className="rounded-full" onClick={(e) => { e.stopPropagation(); setOpen(!open); }} aria-expanded={open} title="Afficher le détail des avertissements"><WarnChip n={r.warns.length} verified={op.verifie} /></button>
      {open ? <div className="mt-1 space-y-1"><ul className="list-disc pl-4 text-xs text-warn">{r.warns.map((w, i) => <li key={i}>{w}</li>)}</ul>{!r.locked ? <Btn size="sm" onClick={() => act((d) => opToggleVerified(d, op.id), op.verifie ? 'Marqueur « à vérifier » rétabli.' : 'Opération marquée comme vérifiée.')}>{op.verifie ? 'Remettre « à vérifier »' : '✓ Marquer comme vérifiée'}</Btn> : null}</div> : null}
    </div>
  );
}

function TabOps() {
  const { db, R, camp, act, confirm, setTab, openFiche, uid, openTrace } = useApp();
  // déclassements (0.27.0-alpha.2) : sous-onglet de « Opérations & Assemblages » (module activable, droits gardés)
  const voirDeclass = moduleActif(db, 'declass') && moduleAutorise(db, uid, 'declass'); const nDeclass = db.alertes.filter((a) => a.statut === 'attente').length;
  const sousItems = [{ id: 'journal', label: 'Opérations' }, ...(voirDeclass ? [{ id: 'declass', label: 'Déclassements', badge: nDeclass || null }] : [])];
  const [sousOnglet, setSousOnglet] = useSousOnglet(sousItems, 'journal');
  const [form, setForm] = useState(null); const [scope, setScope] = useState('camp'); const [typeF, setTypeF] = useState(''); const [oprF, setOprF] = useState(''); const [q, setQ] = useState(''); const [openW, setOpenW] = useState({});
  const quiOK = (o) => !oprF || (oprF === '-' ? !operateursValides(db, o.operateurs).length : Array.isArray(o.operateurs) && o.operateurs.includes(oprF));
  const inCamp = (o) => o.date >= camp.debut && o.date <= camp.fin;
  const kOf = (o) => (o.sousType && opDef(db, o.sousType) ? o.sousType : o.type);
  const rows = [...db.ops].filter((o) => (scope === 'all' || inCamp(o)) && quiOK(o) && (!typeF || kOf(o) === typeF || (typeF.startsWith('g:') && (opDef(db, kOf(o)) || {}).groupe === typeF.slice(2))))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.seq || 0) - (a.seq || 0)))
    .map((op) => ({ id: op.id, op, lots: opLots(op, R), conts: opConts(op, R), text: opSummary(db, R, op), vol: opVolume(op), warns: R.warn[op.id] || [], locked: isLocked(db, op.date) }))
    .filter((r) => !q || norm(`${opNom(r.op)} ${r.text} ${r.op.notes || ''} ${r.lots.map((l) => lotCode(db, R, l)).join(' ')} ${r.conts.map((c) => contName(db, c)).join(' ')} ${operateursNoms(db, r.op.operateurs, ' ')}`).includes(norm(q)));
  const oprs = operateursTries(db, true);
  const nCamp = db.ops.filter(inCamp).length; const nPlan = (db.previsions || []).filter((p) => p.statut === 'prevue').length; const toCheck = db.ops.filter((o) => inCamp(o) && (R.warn[o.id] || []).length && !o.verifie).length;
  const pending = db.alertes.filter((a) => a.statut === 'attente').length;
  const del = async (op) => { const ok = await confirm({ title: 'Supprimer cette opération ?', body: `${opNom(op)} du ${fmtDate(op.date)} — ${opSummary(db, R, op)}. Les stocks seront recalculés.`, ok: 'Supprimer', danger: true }); if (ok) act((d) => opDelete(d, op.id), 'Opération supprimée.'); };
  const acts = (r) => (
    <div className="flex flex-wrap gap-1">
      <DocsButton cible={{ type: 'op', id: r.op.id }} kind="op" title={`${opNom(r.op)} du ${fmtDate(r.op.date)}`} />
      {traceOpOk(r.op) ? <Btn size="sm" kind="ghost" onClick={() => openTrace({ k: 'export', opId: r.op.id })} title="Fichier de traçabilité pour le destinataire" aria-label="Fichier de traçabilité pour le destinataire" data-trace-export-btn={r.op.id}>📤{(r.op.traceExports || []).length ? ' ✓' : ''}</Btn> : null}
      {(r.op.amont || []).length ? <Btn size="sm" kind="ghost" onClick={() => openTrace({ k: 'amont', opId: r.op.id })} title="Traçabilité amont (fichier de l’expéditeur)" aria-label="Traçabilité amont" data-trace-amont-btn={r.op.id}>📥</Btn> : null}
      {r.op.type !== 'declassement' ? <Btn size="sm" kind="ghost" onClick={() => openFiche([{ kind: 'op', id: r.op.id }])} title="Fiche d’enregistrement à imprimer" aria-label="Fiche d’enregistrement">🖨</Btn> : null}
      {r.locked ? <Chip title="Campagne figée">🔒 figée</Chip> : <>{r.op.type !== 'declassement' ? <Btn size="sm" onClick={() => setForm({ editId: r.op.id })}>Modifier</Btn> : null}<Btn size="sm" kind="danger" onClick={() => del(r.op)} aria-label="Supprimer l’opération">Supprimer</Btn></>}
    </div>);
  if (sousOnglet === 'declass') return <div><SubNav value={sousOnglet} onChange={setSousOnglet} items={sousItems} /><TabDeclass /></div>;
  const lotsOf = (r) => <div className="flex flex-wrap gap-x-2">{r.lots.map((id) => <LotLink key={id} id={id} />)}</div>;
  const contsOf = (r) => <div className="flex flex-wrap gap-x-2">{r.conts.map((id) => <ContLink key={id} id={id} />)}</div>;
  return (
    <div>
      {sousItems.length > 1 ? <SubNav value={sousOnglet} onChange={setSousOnglet} items={sousItems} /> : null}
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label={`Opérations ${camp.nom}`} value={fmt(nCamp)} /><Kpi label="À vérifier" value={fmt(toCheck)} tone={toCheck ? 'warn' : undefined} sub="avertissements non bloquants" />
        <Kpi label="Volume en cuve" value={`${fmtL(R.totalVol)}`} />{voirDeclass ? <button type="button" className="text-left" onClick={() => setSousOnglet('declass')}><Kpi label="Déclassements à valider" value={fmt(pending)} tone={pending ? 'bad' : undefined} sub={pending ? 'voir « Déclassements »' : 'aucun'} /></button> : <Kpi label="Déclassements à valider" value={fmt(pending)} tone={pending ? 'bad' : undefined} sub={moduleActif(db, 'declass') ? 'non accessible avec votre profil' : 'module Déclassements désactivé'} />}
      </div>
      <Sec title="Nouvelle opération" right={<>{camp.figee ? <Chip tone="bad">Campagne figée : saisie impossible</Chip> : null}<Btn size="sm" kind="ghost" onClick={() => setTab('params', 'operations')} title="Renommer, masquer, créer des opérations ; stade automatique et fiche associée">⚙ Personnaliser les opérations</Btn></>}>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,270px),1fr))' }}>
          {opGroupes(db, (x) => x.base !== 'apport' && !opViaPressoir(db, { type: x.id })).map((g) => (<div key={g.title} className="card p-3" data-groupe={g.title}><div className="lbl">{g.title}</div>{g.title === OP_GROUPES[0] && moduleActif(db, 'pressoir') && moduleAutorise(db, uid, 'pressoir') ? <div className="mb-2 text-sm" data-vers-pressoir=""><span className="text-ink2">Pesées et pressurages : </span><button type="button" className="linkish" onClick={() => setTab('pressoir')}>onglet Pressoir</button></div>
            : g.title === OP_GROUPES[0] ? <div className="mb-2 text-sm" data-vers-pressoir=""><span className="text-ink2">{`Pesées de vendange : onglet Pressoir${moduleActif(db, 'pressoir') ? '' : ' (masqué)'}`}</span>{!moduleActif(db, 'pressoir') && moduleAutorise(db, uid, 'params') ? <> — <button type="button" className="linkish" onClick={() => setTab('params', 'modules')}>l’afficher</button></> : null}</div> : null}<div className="flex flex-wrap gap-2">{g.items.map((t) => { const x = opDef(db, t); return <Btn key={t} disabled={camp.figee} title={x.aide || OP_HELP[x.base] || ''} onClick={() => setForm({ type: t })}><span aria-hidden="true" className="mr-1 opacity-70">{opIcone(db, t)}</span>{x.label}</Btn>; })}</div></div>))}
        </div>
        <p className="help mt-2">Dans chaque formulaire : « ✓ Valider » enregistre l’opération faite (stocks mis à jour) ou « 📋 Planifier (à réaliser) » la garde en attente, sans toucher aux stocks{nPlan && moduleActif(db, 'previsions') ? <> — <button type="button" className="linkish" onClick={() => setTab('previsions')}>{nPlan} opération{nPlan > 1 ? 's' : ''} à réaliser</button></> : null}. Préparations, tirage et dégorgement : onglet « Tirage & Dégorgement ». Astuce : clic droit (ou appui long) sur un contenant du plan de cave pour lancer une opération directement dessus.</p>
      </Sec>
      <Sec title="Journal des opérations" right={<>
        <SI value={scope} onChange={setScope} options={[{ value: 'camp', label: `Campagne ${camp.nom}` }, { value: 'all', label: 'Toutes les campagnes' }]} style={{ width: 'auto' }} aria-label="Période" />
        <select className="inp" style={{ width: 'auto', maxWidth: 260 }} value={typeF} onChange={(e) => setTypeF(e.target.value)} aria-label="Type d’opération">
          <option value="">Tous les types</option>
          {opGroupes(db, null, true).map((g) => <optgroup key={g.title} label={g.title}><option value={`g:${g.title}`}>Tout le groupe « {g.title} »</option>{g.items.map((k) => <option key={k} value={k}>{OP_LABELS[k] || k}</option>)}</optgroup>)}
        </select>
        {oprs.length ? <select className="inp" style={{ width: 'auto', maxWidth: 230 }} value={oprF} onChange={(e) => setOprF(e.target.value)} aria-label="Opérateur">
          <option value="">Tous les opérateurs</option>{oprs.map((o) => <option key={o.id} value={o.id}>{operateurPlein(o)}{o.actif === false ? ' (archivé)' : ''}</option>)}<option value="-">— Sans opérateur</option>
        </select> : null}
        <TI value={q} onChange={setQ} placeholder="Rechercher lot, cuve, produit, opérateur…" style={{ width: 230 }} aria-label="Rechercher" /></>}>
        {!rows.length ? <Empty>Aucune opération pour ces critères.</Empty> : (<>
          <div className="hidden md:block"><div className="tblwrap"><table className="tbl"><thead><tr><th>Date</th><th>Opération</th><th>Lots</th><th>Contenants</th><th>Détail</th><th className="r">Volume</th><th>Opérateur(s)</th><th>Contrôle</th><th /></tr></thead>
            <tbody>{rows.map((r) => (<tr key={r.id}><td className="num whitespace-nowrap">{fmtDate(r.op.date)}</td><td><Chip tone={OP_TONE[r.op.type]}>{opNom(r.op)}</Chip></td><td>{lotsOf(r)}</td><td>{contsOf(r)}</td><td className="max-w-md">{r.text}{r.op.notes ? <div className="text-xs text-ink2">{r.op.notes}</div> : null}</td><td className="r num whitespace-nowrap">{r.vol != null ? `${fmtL(r.vol)}` : ''}</td><td><OperateursChips ids={r.op.operateurs} />{r.op.saisiPar ? <div className="mt-0.5 text-xs text-ink2" title={r.op.modifiePar ? `corrigée par ${utilisateurNom(db, r.op.modifiePar)}` : undefined}>saisie : {utilisateurNom(db, r.op.saisiPar)}{r.op.modifiePar ? ' · corrigée' : ''}</div> : null}</td><td><OpWarns r={r} open={!!openW[r.id]} setOpen={(v) => setOpenW((s) => ({ ...s, [r.id]: v }))} /></td><td>{acts(r)}</td></tr>))}</tbody></table></div></div>
          <div className="space-y-2 md:hidden">{rows.map((r) => (<div key={r.id} className="card p-3"><div className="flex flex-wrap items-center gap-2"><Chip tone={OP_TONE[r.op.type]}>{opNom(r.op)}</Chip><span className="num text-sm">{fmtDate(r.op.date)}</span>{r.vol != null ? <span className="num ml-auto text-sm">{fmtL(r.vol)}</span> : null}</div>
            <div className="mt-1 text-sm">{r.text}</div><div className="mt-1 flex flex-wrap gap-x-3 text-sm">{lotsOf(r)}{contsOf(r)}</div>
            {operateursValides(db, r.op.operateurs).length ? <div className="mt-1.5"><OperateursChips ids={r.op.operateurs} /></div> : null}
            {r.op.saisiPar ? <div className="mt-1 text-xs text-ink2">saisie : {utilisateurNom(db, r.op.saisiPar)}{r.op.modifiePar ? ` · corrigée par ${utilisateurNom(db, r.op.modifiePar)}` : ''}</div> : null}
            <div className="mt-2"><OpWarns r={r} open={!!openW[r.id]} setOpen={(v) => setOpenW((s) => ({ ...s, [r.id]: v }))} /></div><div className="mt-2">{acts(r)}</div></div>))}</div>
        </>)}
      </Sec>
      {form ? <OpForm type={form.type} editId={form.editId} onClose={() => setForm(null)} /> : null}
    </div>
  );
}
TABS_REG.ops = TabOps;

/* ---------- alertes de déclassement : sous-onglet « Déclassements » d'Opérations & Assemblages (onglet dédié jusqu'à 0.27.0-alpha.1) ---------- */
function TabDeclass() {
  const { db, R, act, camp, defaultDate, showLot, moi } = useApp();
  const [dates, setDates] = useState({}); const [qui, setQui] = useState({});
  const quiOf = (a) => qui[a.id] || (moi ? [moi] : []);
  const pending = db.alertes.filter((a) => a.statut === 'attente'); const done = db.alertes.filter((a) => a.statut !== 'attente').sort((a, b) => ((a.decidedOn || '') < (b.decidedOn || '') ? 1 : -1));
  const dateOf = (a) => dates[a.id] || defaultDate;
  return (
    <div>
      <Notice tone="info" title="Un déclassement n’est jamais appliqué sans votre validation">Quand un intrant non autorisé est ajouté à une portion, ou qu’une préparation de rang inférieur y est incorporée, une alerte est créée ici. La revendication du lot ne change qu’au moment où vous la validez ; elle est alors tracée comme une opération « Déclassement validé ».</Notice>
      <Sec className="mt-5" title={`À valider (${pending.length})`}>
        {!pending.length ? <Empty>Aucune alerte en attente.</Empty> : <div className="space-y-3">{pending.map((a) => { const lot = R.lots[a.lotId] || {}; const op = db.ops.find((o) => o.id === a.opId);
          return (<div key={a.id} className="card p-4" style={{ borderLeft: '4px solid var(--bad)' }}>
            <div className="flex flex-wrap items-center gap-2"><b className="text-base">{a.motif}</b><Chip tone="bad">{a.kind === 'propagation' ? 'Propagation' : a.kind === 'prep' ? 'Préparation' : 'Intrant non autorisé'}</Chip></div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink2"><span>Lot <button type="button" className="linkish" onClick={() => showLot(a.lotId)}>{lot.code || '—'}</button></span>{a.contenantId ? <span>Cuve <ContLink id={a.contenantId} /></span> : null}{op ? <span>{opNom(op)} du {fmtDate(op.date)}</span> : null}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">Revendication actuelle <QChip id={a.from} /> <span aria-hidden="true">→</span> déclassement proposé <QChip id={a.to} /></div>
            {operateursTries(db, false).length ? <div className="mt-3"><OperateursPicker value={quiOf(a)} onChange={(v) => setQui((s) => ({ ...s, [a.id]: v }))} label="Décision prise par" allowAdd={false} /></div> : null}
            <div className="mt-3 flex flex-wrap items-end gap-2"><Field label="Date de la décision" className="w-44"><DI value={dateOf(a)} onChange={(v) => setDates((s) => ({ ...s, [a.id]: v }))} /></Field>
              <Btn kind="primary" onClick={() => act((d) => alertValidate(d, a.id, dateOf(a), quiOf(a)), `Lot ${lot.code} déclassé en ${qLabel(a.to)}.`)}>Valider le déclassement en {qLabel(a.to)}</Btn>
              <Btn onClick={() => act((d) => alertRefuse(d, a.id, quiOf(a)), 'Alerte refusée : la revendication est inchangée.')}>Refuser (garder {qLabel(a.from)})</Btn></div>
            <p className="help">Refuser conserve la revendication actuelle ; l’avertissement reste visible dans le journal de l’opération. {camp.figee ? ' La campagne active est figée : choisissez une date dans une campagne ouverte.' : ''}</p>
          </div>); })}</div>}
      </Sec>
      <Sec title="Historique des décisions"><Tbl rows={done} empty="Aucune décision enregistrée." cols={[
        { h: 'Décidée le', r: (a) => <span className="num">{fmtDate(a.decidedOn)}</span> }, { h: 'Lot', r: (a) => <LotLink id={a.lotId} /> }, { h: 'Motif', r: (a) => a.motif },
        { h: 'Revendication', r: (a) => <span className="flex items-center gap-1"><QChip id={a.from} />→<QChip id={a.to} /></span> },
        { h: 'Décision', r: (a) => (a.statut === 'valide' ? <Chip tone="bad">{a.dejaFait ? 'Validée (déjà déclassé)' : 'Déclassement appliqué'}</Chip> : <Chip>Refusée</Chip>) }, { h: 'Décidé par', r: (a) => <OperateursChips ids={a.decidePar} /> }]} /></Sec>
    </div>
  );
}
TABS_REG.declass = TabDeclass;
