/* ============ ÉQUIPEMENTS › MAINTENANCE › PRODUITS DE MAINTENANCE (0.36.0-alpha.1) ============
   Catalogue (graisses et huiles alimentaires, lubrifiants, joints, produits d'entretien du matériel…), suivi du stock activable par
   produit (entrées, sorties, régularisations), FT / FDS / attestations jointes (dépôt lu comme pour les intrants), fiche récapitulative.
   Moteur : 16q-produits-maintenance.js. */
function MaintenanceOnglet() {
  const [vue, setVue0] = useState(() => { try { return window.localStorage.getItem('oenotrack-maint-vue') || 'plan'; } catch (e) { return 'plan'; } });
  const setVue = (v) => { setVue0(v); try { window.localStorage.setItem('oenotrack-maint-vue', v); } catch (e) { /* ignoré */ } };
  const b = (v, t) => <button type="button" className={cx('btn btn-sm', vue === v && 'btn-primary')} aria-pressed={vue === v} onClick={() => setVue(v)} data-maint-vue={v}>{t}</button>;
  return <div><div className="mb-3 flex flex-wrap gap-1" role="group" aria-label="Maintenance">{b('plan', 'Plan & interventions')}{b('produits', 'Produits de maintenance')}</div>{vue === 'produits' ? <MaintProduitsView /> : <PlanMaintenanceView />}</div>;
}
const MP_VIDE = () => ({ nom: '', fournisseur: '', fabricant: '', reference: '', usage: '', contactAlimentaire: '', caveVinif: '', composition: '', stockage: '', unite: 'u', suiviStock: false, seuil: '', champs: [], fdsNonRequise: false, actif: true, notes: '' });
function MaintProduitForm({ id, onClose }) {
  const { db, act } = useApp(); const p = id ? maintProdDef(db, id) : null; const [depot, setDepot] = useState(null);
  const [f, set, setF] = useDraft(() => ({ ...MP_VIDE(), ...(p ? clone(p) : {}), seuil: p && hasNum(p.seuil) ? String(p.seuil).replace('.', ',') : '', champs: p && Array.isArray(p.champs) ? clone(p.champs) : [] }));
  useSuiviFiche(p, setF, ['fabricant', 'composition', 'stockage', 'contactAlimentaire']);
  const save = () => { const r = act((d) => maintProduitSave(d, f, id), id ? 'Produit de maintenance modifié.' : 'Produit de maintenance ajouté au catalogue.'); if (r && r.ok) onClose(); };
  const ch = (i, k, v) => set('champs', f.champs.map((c, j) => (j === i ? { ...c, [k]: v } : c)));
  const fds = p ? maintFdsEtat(db, p) : null;
  return (
    <FormSheet wide={!!id} title={id ? 'Modifier le produit de maintenance' : 'Nouveau produit de maintenance'} onClose={onClose} onSave={save}>
      <G><Field label="Nom"><TI value={f.nom} onChange={(v) => set('nom', v)} autoFocus aria-label="Nom du produit de maintenance" /></Field><Field label="Référence"><TI value={f.reference} onChange={(v) => set('reference', v)} /></Field></G>
      <G><Field label="Fournisseur"><TI value={f.fournisseur} onChange={(v) => set('fournisseur', v)} aria-label="Fournisseur du produit de maintenance" /></Field><Field label="Fabricant"><TI value={f.fabricant} onChange={(v) => set('fabricant', v)} /></Field></G>
      <Field label="Usage" help="ex. graissage des pompes et du pressoir, joints de portes de cuves, entretien des tireuses…"><TI value={f.usage} onChange={(v) => set('usage', v)} aria-label="Usage" /></Field>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <Group label="Agréé contact alimentaire"><OuiNon value={f.contactAlimentaire} vide onChange={(v) => set('contactAlimentaire', v)} label="Agréé contact alimentaire" /></Group>
        <Group label="Utilisation en cave de vinification"><OuiNon value={f.caveVinif} vide onChange={(v) => set('caveVinif', v)} label="Utilisation en cave de vinification" /></Group>
      </div>
      {f.caveVinif === 'oui' && f.contactAlimentaire === 'non' ? <Notice tone="warn">Produit utilisé en cave sans agrément contact alimentaire : à éviter sur les surfaces en contact avec le vin.</Notice> : null}
      <Field label="Composition"><TA value={f.composition} onChange={(v) => set('composition', v)} rows={2} aria-label="Composition" /></Field>
      <Field label="Stockage"><TI value={f.stockage} onChange={(v) => set('stockage', v)} /></Field>
      <div className="rounded-md border border-line px-3 py-2" data-suivi-stock="">
        <Check checked={f.suiviStock} onChange={(v) => set('suiviStock', v)} label="Suivre le stock de ce produit (entrées, sorties, régularisations)" />
        {f.suiviStock ? <G><Field label="Unité de stock"><SI value={f.unite} onChange={(v) => set('unite', v)} options={PMAINT_UNITES.map((u) => ({ value: u, label: u === 'u' ? 'u (pièces)' : u }))} aria-label="Unité de stock" /></Field><Field label="Stock minimal (alerte)"><NI value={f.seuil} onChange={(v) => set('seuil', v)} aria-label="Stock minimal" /></Field></G> : null}
        {p && !f.suiviStock && mouvementsMaint(db, p.id).length ? <p className="help">Suivi désactivé : les mouvements déjà enregistrés sont gardés et reviennent si vous le réactivez.</p> : null}
      </div>
      <Group label="Champs personnalisés"><div className="space-y-1" data-champs-perso="">{f.champs.map((c, i) => <div key={i} className="flex flex-wrap gap-1"><input className="inp" style={{ maxWidth: 200 }} value={c.label} onChange={(e) => ch(i, 'label', e.target.value)} placeholder="Nom du champ" aria-label={`Nom du champ ${i + 1}`} /><input className="inp min-w-0 flex-1" value={c.valeur} onChange={(e) => ch(i, 'valeur', e.target.value)} placeholder="Valeur" aria-label={`Valeur du champ ${i + 1}`} /><Btn size="sm" kind="danger" onClick={() => set('champs', f.champs.filter((_, j) => j !== i))} aria-label={`Retirer le champ ${i + 1}`}>✕</Btn></div>)}
        <Btn size="sm" onClick={() => set('champs', [...f.champs, { label: '', valeur: '' }])}>+ Champ</Btn></div></Group>
      <div className="flex flex-wrap gap-x-5 gap-y-2"><Check checked={f.actif} onChange={(v) => set('actif', v)} label="Produit actif" /><Check checked={f.fdsNonRequise} onChange={(v) => set('fdsNonRequise', v)} label="FDS non requise (produit non classé dangereux)" /></div>
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} /></Field>
      {p ? <Group label={`Fiches techniques, FDS et attestations${fds ? ` — ${fds.label}` : ''}`}><DocsPanel cible={{ type: 'produitMaintenance', id: p.id }} kind="produitMaintenance" deposer={setDepot} aide="Chaque fichier déposé est lu (type, date de révision, contact alimentaire) ; une version plus récente remplace la précédente, qui reste dans les versions archivées." /></Group>
        : <div className="help">FT, FDS et attestations : enregistrez le produit, puis déposez-les ici.</div>}
      {depot && p ? <FichesDepot fichiers={depot} cible={{ type: 'produitMaintenance', id: p.id }} onClose={() => setDepot(null)} /> : null}
    </FormSheet>
  );
}
function MaintMouvForm({ produitId, id, onClose }) {
  const { db, act, uid, defaultDate } = useApp(); const m = id ? mouvementsMaint(db).find((x) => x.id === id) : null; const p = maintProdDef(db, m ? m.produitId : produitId) || {};
  const [f, set, setF] = useDraft({ produitId: p.id, type: m ? m.type : 'entree', date: m ? m.date : defaultDate, qty: m ? String(m.qty).replace('.', ',') : '', mode: m && m.compte != null ? 'compte' : 'ecart', compte: m && m.compte != null ? String(m.compte).replace('.', ',') : '', motif: m ? m.motif || 'inventaire' : 'inventaire', numLot: m ? m.numLot || '' : '', notes: m ? m.notes || '' : '' });
  const st = maintStock(db, p.id, f.date) - (m && m.date <= f.date ? maintMouvSigne(m) : 0);
  const save = () => { const r = act((d) => maintMouvementSave(d, f, id, uid), id ? 'Mouvement modifié.' : 'Mouvement de stock enregistré.'); if (r && r.ok) onClose(); };
  return (
    <FormSheet title={`${id ? 'Modifier le mouvement' : 'Mouvement de stock'} — ${p.nom || ''}`} onClose={onClose} onSave={save}>
      <G><Field label="Mouvement"><SI value={f.type} onChange={(v) => setF((x) => ({ ...x, type: v }))} options={PMAINT_MOUV_TYPES.map(([k, l]) => ({ value: k, label: l }))} aria-label="Type de mouvement" /></Field><Field label="Date"><DI value={f.date} onChange={(v) => set('date', v)} aria-label="Date du mouvement" /></Field></G>
      {f.type === 'regul' ? <><Field label="Motif"><SI value={f.motif} onChange={(v) => setF((x) => ({ ...x, motif: v, mode: v === 'inventaire' ? 'compte' : 'ecart' }))} options={REGUL_MOTIFS.map(([k, l]) => ({ value: k, label: l }))} aria-label="Motif de la régularisation" /></Field>
        <div className="flex flex-wrap gap-3"><Check checked={f.mode === 'compte'} onChange={() => set('mode', 'compte')} label="Quantité comptée (inventaire physique)" /><Check checked={f.mode === 'ecart'} onChange={() => set('mode', 'ecart')} label="Écart constaté (+ entrée, − sortie)" /></div></> : null}
      {f.type === 'regul' && f.mode === 'compte' ? <Field label={`Quantité comptée (${p.unite || 'u'})`}><NI value={f.compte} onChange={(v) => set('compte', v)} aria-label="Quantité comptée" /></Field>
        : <G><Field label={`Quantité (${p.unite || 'u'})`}><NI value={f.qty} onChange={(v) => set('qty', v)} aria-label="Quantité du mouvement" /></Field>{f.type === 'entree' ? <Field label="N° de lot"><TI value={f.numLot} onChange={(v) => set('numLot', v)} /></Field> : <span />}</G>}
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} rows={2} aria-label="Notes du mouvement" /></Field>
      <p className="text-sm" data-maint-stock-apercu=""><span>Stock calculé au</span> <span className="num">{fmtDate(f.date)}</span> : <b className="num" translate="no">{fmt(st, 2)} {p.unite || 'u'}</b></p>
    </FormSheet>
  );
}
function MaintProduitFiche({ id, onClose, onModifier, onMouv }) {
  const { db, act, confirm } = useApp(); const p = maintProdDef(db, id); if (!p) return null; const H = maintMouvHistorique(db, p.id).reverse();
  const del = async (m) => { if (await confirm({ title: 'Supprimer ce mouvement ?', body: `${hygLib(PMAINT_MOUV_TYPES, m.type)} — ${fmtDate(m.date)}.`, ok: 'Supprimer', danger: true })) act((d) => maintMouvementDelete(d, m.id), 'Mouvement supprimé.'); };
  return (
    <Sheet wide title={p.nom} sub="Historique du stock" onClose={onClose} footer={<><Btn onClick={onClose} className="mr-auto">Fermer</Btn><Btn onClick={onModifier}>Modifier la fiche</Btn>{p.suiviStock ? <Btn kind="primary" onClick={() => onMouv({ produitId: p.id })}>+ Mouvement</Btn> : null}</>}>
      <p className="mb-2 text-sm">{p.suiviStock ? <><span>Stock actuel :</span> <b className="num" translate="no">{fmt(maintStock(db, p.id), 2)} {p.unite || 'u'}</b>{maintStockBas(db, p) ? <Chip tone="warn" className="ml-1">stock bas</Chip> : null}</> : <span>Suivi du stock désactivé pour ce produit.</span>}</p>
      <Tbl rows={H} empty="Aucun mouvement." cols={[{ h: 'Date', r: (m) => <span className="num">{fmtDate(m.date)}</span> }, { h: 'Mouvement', r: (m) => <span>{m.type === 'regul' ? `Régularisation : ${regulMotifLib(m.motif)}` : hygLib(PMAINT_MOUV_TYPES, m.type)}</span> },
        { h: 'Détail', r: (m) => <span className="text-xs" translate="no">{[m.numLot ? `lot ${m.numLot}` : '', m.compte != null ? `compté : ${fmt(m.compte, 2)}` : '', m.notes].filter(Boolean).join(' — ')}</span> },
        { h: 'Quantité', cls: 'r', r: (m) => <span className={cx('num', m.signe < 0 && 'text-bad')}>{m.signe > 0 ? '+' : ''}{fmt(m.signe, 2)}</span> }, { h: 'Solde', cls: 'r', r: (m) => <b className="num">{fmt(m.solde, 2)}</b> },
        { h: '', r: (m) => (isLocked(db, m.date) ? <Chip>🔒 figée</Chip> : <span className="flex gap-1"><Btn size="sm" onClick={() => onMouv({ id: m.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => del(m)} aria-label="Supprimer le mouvement">✕</Btn></span>) }]} />
    </Sheet>
  );
}
function MaintProduitsView() {
  const { db, act, confirm } = useApp(); const [ed, setEd] = useState(null); const [mv, setMv] = useState(null); const [fi, setFi] = useState(null); const [recap, setRecap] = useState(false); const [q, setQ] = useState(''); const [inactifs, setInactifs] = useState(false);
  const P = produitsMaint(db).filter((p) => (inactifs || p.actif !== false) && (!q || norm(`${p.nom} ${p.fournisseur} ${p.usage}`).includes(norm(q)))).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const nBas = produitsMaint(db).filter((p) => maintStockBas(db, p)).length; const nFds = produitsMaint(db).filter((p) => p.actif !== false && ['manquante', 'ancienne'].includes(maintFdsEtat(db, p).k)).length;
  const del = async (p) => { if (!(await confirm({ title: `Supprimer « ${p.nom} » ?`, body: 'Cette suppression est définitive (documents compris).', ok: 'Supprimer', danger: true }))) return; const r = act((d) => maintProduitDelete(d, p.id), 'Produit de maintenance supprimé.'); if (r && r.ok) (r.docs || []).forEach((k) => docDel(k).catch(() => { /* déjà absent */ })); };
  const on = (v) => (v ? <Chip tone={v === 'oui' ? 'ok' : 'bad'}>{onLib(v)}</Chip> : <span className="text-ink2">—</span>);
  return (
    <div data-produits-maintenance="">
      <Notice tone="info" title="Produits de maintenance">Graisses et huiles, lubrifiants, joints, produits d’entretien du matériel : fournisseur, usage, agrément contact alimentaire, utilisation en cave de vinification, FT et FDS. Le suivi du stock s’active produit par produit.</Notice>
      <div className="my-3 flex flex-wrap items-center gap-2"><TI value={q} onChange={setQ} placeholder="Rechercher un produit, un usage…" style={{ width: 240 }} aria-label="Rechercher un produit de maintenance" /><Check checked={inactifs} onChange={setInactifs} label="Inclure les inactifs" />
        {nBas ? <Chip tone="warn">{nBas > 1 ? `${nBas} stocks bas` : '1 stock bas'}</Chip> : null}{nFds ? <Chip tone="bad">{nFds > 1 ? `${nFds} FDS à revoir` : '1 FDS à revoir'}</Chip> : null}
        <span className="ml-auto flex flex-wrap gap-2"><Btn onClick={() => setRecap(true)} data-recap-maint="">🖨 Fiche récapitulative</Btn><Btn kind="primary" onClick={() => setEd({})} data-maint-produit-nouveau="">+ Nouveau produit</Btn></span></div>
      <Tbl rows={P} empty="Aucun produit de maintenance : « + Nouveau produit » pour commencer le catalogue." cols={[
        { h: 'Produit', r: (p) => <span className={cx(p.actif === false && 'opacity-60')}><b translate="no">{p.nom}</b>{p.actif === false ? <Chip className="ml-1">inactif</Chip> : null}{p.reference ? <span className="block text-xs text-ink2" translate="no">{p.reference}</span> : null}</span> },
        { h: 'Fournisseur', r: (p) => <span translate="no">{p.fournisseur || '—'}</span> }, { h: 'Usage', r: (p) => <span className="text-xs" translate="no">{p.usage || '—'}</span> },
        { h: 'Contact alimentaire', r: (p) => on(p.contactAlimentaire) }, { h: 'Cave de vinification', r: (p) => on(p.caveVinif) },
        { h: 'FDS', r: (p) => { const e = maintFdsEtat(db, p); return <Chip tone={e.tone}>{e.label}</Chip>; } },
        { h: 'Stock', cls: 'r', r: (p) => (p.suiviStock ? <button type="button" className="linkish num whitespace-nowrap" onClick={() => setFi(p.id)} data-maint-stock={p.id}>{fmt(maintStock(db, p.id), 2)} {p.unite || 'u'}{maintStockBas(db, p) ? ' ⚠' : ''}</button> : <span className="text-xs text-ink2">non suivi</span>) },
        { h: 'Docs', r: (p) => <DocsButton cible={{ type: 'produitMaintenance', id: p.id }} kind="produitMaintenance" title={p.nom} /> },
        { h: '', r: (p) => <span className="flex flex-wrap gap-1">{p.suiviStock ? <Btn size="sm" onClick={() => setMv({ produitId: p.id })} data-maint-mouv={p.id}>± Stock</Btn> : null}<Btn size="sm" onClick={() => setEd({ id: p.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => del(p)} aria-label={`Supprimer ${p.nom}`}>✕</Btn></span> }]} />
      {ed ? <MaintProduitForm id={ed.id} onClose={() => setEd(null)} /> : null}
      {mv ? <MaintMouvForm produitId={mv.produitId} id={mv.id} onClose={() => setMv(null)} /> : null}
      {fi ? <MaintProduitFiche id={fi} onClose={() => setFi(null)} onModifier={() => { setEd({ id: fi }); setFi(null); }} onMouv={(o) => setMv(o)} /> : null}
      {recap ? <RecapMaintSheet onClose={() => setRecap(false)} /> : null}
    </div>
  );
}
function RecapMaintSheet({ onClose }) {
  const { db } = useApp(); const [inactifs, setInactifs] = useState(false);
  return <RecapSheet cle="maintenance" titre="Fiche récapitulative des produits de maintenance" nomFichier="produits-de-maintenance" colonnes={RECAP_MAINT_COLS} defaut={RECAP_MAINT_DEFAUT} onClose={onClose}
    calcul={(cols) => recapMaintenance(db, cols, { inactifs })} filtres={<Check checked={inactifs} onChange={setInactifs} label="Inclure les produits inactifs" />} />;
}
