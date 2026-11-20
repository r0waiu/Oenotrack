/* ============ ONGLET « À RÉALISER & FICHES » : opérations planifiées → fiches à remplir → validation ============
   Une opération est planifiée depuis n'importe quel formulaire d'opération (bouton « 📋 Planifier (à réaliser) ») :
   elle n'a aucun effet sur les stocks tant qu'elle n'est pas validée avec les valeurs réelles. */
const PREV_STATUT = { prevue: { label: 'À réaliser', tone: 'info' }, realisee: { label: 'Validée', tone: 'ok' }, annulee: { label: 'Annulée', tone: '' } };

function PrevisionsView() {
  const { db, act, confirm, openOp, openFiche, setTab, moi } = useApp(); const today = todayISO();
  const [statut, setStatut] = useState('prevue'); const [sel, setSel] = useState([]); const [q, setQ] = useState(''); const [oprF, setOprF] = useState('');
  const all = db.previsions || []; const quiDe = (p) => operateursValides(db, (p.f || {}).operateurs);
  const quiOK = (p) => !oprF || (oprF === '-' ? !quiDe(p).length : quiDe(p).includes(oprF));
  const list = all.filter((p) => (statut === 'toutes' || p.statut === statut) && quiOK(p) && (!q || norm(`${opNom(p)} ${p.resume} ${p.notes || ''} ${p.ficheOrdre || ''} ${operateursNoms(db, quiDe(p), ' ')}`).includes(norm(q))))
    .sort((a, b) => (statut === 'prevue' ? (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) : (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)));
  const late = all.filter((p) => p.statut === 'prevue' && p.date < today).length;
  const tog = (id) => setSel(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  const del = async (p) => {
    const nd = docsOf(db, 'prev', p.id).length;
    if (!(await confirm({ title: 'Supprimer cette opération à réaliser ?', body: `${opNom(p)} prévu le ${fmtDate(p.date)}. Elle disparaît de la liste (aucun effet sur les stocks).${nd ? ` ${nd > 1 ? `Ses ${nd} documents joints sont supprimés` : 'Son document joint est supprimé'} aussi.` : ''}`, ok: 'Supprimer', danger: true }))) return;
    const r = act((d) => previsionDelete(d, p.id), 'Opération à réaliser supprimée.'); setSel(sel.filter((x) => x !== p.id));
    if (r && r.ok) (r.docs || []).forEach((id) => { docDel(id).catch(() => { /* déjà absent */ }); });
  };
  const sameDay = (date) => setSel(uniq([...sel, ...list.filter((p) => p.date === date && p.statut === 'prevue').map((p) => p.id)]));
  const ouvrir = (p) => openOp(p.type, clone(p.f), null, { prevId: p.id });
  return (
    <div>
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label="À réaliser" value={all.filter((p) => p.statut === 'prevue').length} sub={`${all.filter((p) => p.statut === 'prevue' && p.date === today).length} aujourd’hui`} />
        <Kpi label="En retard" value={late} tone={late ? 'warn' : undefined} sub="date prévue dépassée" />
        <Kpi label="Validées" value={all.filter((p) => p.statut === 'realisee').length} sub="depuis la liste" />
        <Kpi label="Fiches imprimées" value={(db.fiches || []).length} />
      </div>
      <div className="mb-4"><Notice tone="info" title="Planifier une opération">Ouvrez l’opération depuis n’importe où (clic droit sur une cuve, journal, fiche d’un lot…) puis choisissez <b>« 📋 Planifier (à réaliser) »</b> au lieu de « ✓ Valider » : elle arrive ici sans toucher aux stocks. Imprimez la fiche pour les opérateurs, puis <b>« ✓ Valider… »</b> avec les valeurs réelles. <button type="button" className="linkish" onClick={() => setTab('ops')}>Nouvelle opération…</button></Notice></div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {[['prevue', 'À réaliser'], ['realisee', 'Validées'], ['annulee', 'Annulées'], ['toutes', 'Toutes']].map(([k, l]) => <Btn key={k} size="sm" kind={statut === k ? 'primary' : undefined} onClick={() => { setStatut(k); setSel([]); }}>{l}</Btn>)}
        {operateursTries(db, true).length ? <select className="inp" style={{ width: 'auto', maxWidth: 240 }} value={oprF} onChange={(e) => { setOprF(e.target.value); setSel([]); }} aria-label="Opérateur">
          <option value="">Tous les opérateurs</option>{moi ? <option value={moi}>Moi ({operateurNom(db, moi)})</option> : null}{operateursTries(db, true).filter((o) => o.id !== moi).map((o) => <option key={o.id} value={o.id}>{operateurPlein(o)}{o.actif === false ? ' (archivé)' : ''}</option>)}<option value="-">— Non attribuées</option>
        </select> : null}
        <input className="inp" style={{ width: 'auto', flex: '1 1 200px' }} placeholder="Rechercher cuve, lot, n° de fiche, opérateur…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher une opération à réaliser" />
        <Btn disabled={!sel.length} kind={sel.length ? 'primary' : undefined} onClick={() => openFiche(sel.map((id) => ({ kind: 'prev', id })))}>🖨 Fiche(s) pour la sélection ({sel.length})</Btn>
        {sel.length ? <Btn size="sm" kind="ghost" onClick={() => setSel([])}>Désélectionner</Btn> : null}
      </div>
      <Tbl rows={list} empty={statut === 'prevue' ? 'Rien à réaliser. Dans un formulaire d’opération, « 📋 Planifier (à réaliser) » l’ajoute ici.' : 'Aucune opération.'} cols={[
        { h: '', r: (p) => <input type="checkbox" className="h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={sel.includes(p.id)} onChange={() => tog(p.id)} aria-label={`Sélectionner ${OP_LABELS[p.type]} du ${fmtDate(p.date)}`} /> },
        { h: 'Date prévue', r: (p) => <div className="whitespace-nowrap"><span className="num">{fmtDate(p.date)}</span>{p.statut === 'prevue' && p.date < today ? <Chip tone="warn" className="ml-1">en retard</Chip> : null}{p.statut === 'prevue' ? <div><button type="button" className="linkish text-xs" onClick={() => sameDay(p.date)}>+ toute la journée</button></div> : null}</div> },
        { h: 'Opération', r: (p) => <Chip tone={OP_TONE[p.type]}>{opNom(p)}</Chip> },
        { h: 'Détail prévu', r: (p) => <div className="text-sm">{p.resume || '—'}{p.notes ? <div className="text-xs text-ink2">{p.notes}</div> : null}</div> },
        { h: 'Opérateur(s)', r: (p) => <OperateursChips ids={quiDe(p)} vide="non attribuée" /> },
        { h: 'Statut', r: (p) => <div><Chip tone={PREV_STATUT[p.statut].tone}>{PREV_STATUT[p.statut].label}</Chip>{p.statut === 'realisee' && p.realiseLe ? <div className="mt-1 text-xs text-ink2">le {fmtDate(p.realiseLe)}</div> : null}{p.ficheOrdre ? <div className="num mt-1 text-xs text-ink2">fiche {p.ficheOrdre}</div> : null}</div> },
        { h: '', r: (p) => <div className="flex flex-wrap gap-1">
          {p.statut === 'prevue' ? <Btn size="sm" kind="primary" onClick={() => ouvrir(p)} title="Ouvrir avec les valeurs prévues, corriger avec les valeurs réelles puis valider">✓ Valider…</Btn> : null}
          <Btn size="sm" onClick={() => openFiche([{ kind: 'prev', id: p.id }])} title="Fiche d’enregistrement à imprimer">🖨 Fiche</Btn>
          {p.statut !== 'realisee' || docsOf(db, 'prev', p.id).length ? <DocsButton cible={{ type: 'prev', id: p.id }} kind="op" title={`${opNom(p)} — ${fmtDate(p.date)}`} /> : null}
          {p.statut === 'prevue' ? <><Btn size="sm" onClick={() => ouvrir(p)}>Modifier</Btn><Btn size="sm" onClick={() => act((d) => previsionStatut(d, p.id, 'annulee'), 'Opération annulée (elle reste dans « Annulées »).')}>Annuler</Btn></> : null}
          {p.statut === 'annulee' ? <Btn size="sm" onClick={() => act((d) => previsionStatut(d, p.id, 'prevue'), 'Opération remise « à réaliser ».')}>Rétablir</Btn> : null}
          {p.statut === 'realisee' && p.opId && !db.ops.some((o) => o.id === p.opId) ? <Chip>opération supprimée</Chip> : null}
          <Btn size="sm" kind="danger" onClick={() => del(p)} aria-label="Supprimer l’opération à réaliser">✕</Btn>
        </div> }]} />
    </div>
  );
}

function TabPrevisions() {
  const { nav } = useApp(); const items = [{ id: 'previsions', label: 'Opérations à réaliser' }, { id: 'fiches', label: 'Fiches imprimées' }, { id: 'modeles', label: 'Modèles de fiches' }];
  const [sub, setSub] = useState(items.some((i) => i.id === nav.sub) ? nav.sub : 'previsions');
  return <div><SubNav value={sub} onChange={setSub} items={items} />{sub === 'previsions' ? <PrevisionsView /> : sub === 'fiches' ? <FichesLogView /> : <ModelesView />}</div>;
}
TABS_REG.previsions = TabPrevisions;
