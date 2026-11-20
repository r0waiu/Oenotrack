/* ============ ONGLET 6 : HYGIÈNE — journal des nettoyages, rinçages, désinfections · produits d'hygiène (0.18.0-alpha.1, 66b) ============ */
// dernière concentration employée pour un produit (journal), sinon le bas de sa plage d'emploi
function hygDerniereConc(db, pid, sauf) {
  const E = (db.hygiene || []).filter((x) => x.id !== sauf && Array.isArray(x.produits)).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  for (const x of E) { const l = x.produits.find((y) => y && y.produitId === pid && y.conc != null); if (l) return l.conc; }
  const p = hygDef(db, pid); return p && hasNum(p.concMin) ? p.concMin : '';
}
const hygTxtNb = (v) => (v == null || v === '' ? '' : String(v).replace('.', ','));
function HygieneForm({ id, preset, onClose }) {
  const { db, R, act, defaultDate, moi } = useApp(); const h = id ? db.hygiene.find((x) => x.id === id) : null; const p0 = preset || {};
  // opérateurs : choisis dans la liste de la société ; un ancien nom écrit à la main (versions précédentes) est conservé tant qu'on ne choisit personne
  const ancien = h && !(Array.isArray(h.operateurs) && h.operateurs.length) && h.operateur ? h.operateur : '';
  // produits (0.18.0-alpha.1) : une entrée d'une version antérieure garde son texte comme méthode
  const v19 = h && Array.isArray(h.produits); const modifie = h && hygTexteModifie(db, h);
  const aDesProduits = hygListe(db).some((x) => !x.archive);
  const [f, set, setF] = useDraft({ date: h ? h.date : defaultDate, cibleType: h ? h.cibleType : (p0.cibleType || 'contenant'), cibleId: h ? h.cibleId : (p0.cibleId || ''), actionId: h ? h.actionId : (db.lists.actionsHygiene[0] || {}).id,
    produits: v19 ? h.produits.map((l) => ({ ...l, conc: hygTxtNb(l.conc), quantite: hygTxtNb(l.quantite) })) : (aDesProduits ? [{ produitId: '', conc: '', quantite: '' }] : []),
    methode: h ? (v19 && !(modifie && !h.produits.length) ? h.methode || '' : h.produit || '') : '', operateur: ancien, operateurs: h ? (h.operateurs || []) : (moi ? [moi] : []), notes: h ? h.notes : '' });
  const [cree, setCree] = useState(false); const [voir, setVoir] = useState(null);
  const setL = (i, patch) => setF((x) => ({ ...x, produits: x.produits.map((l, k) => (k === i ? { ...l, ...patch } : l)) }));
  const choisir = (i, pid) => setL(i, { produitId: pid, conc: pid ? hygTxtNb(hygDerniereConc(db, pid, id)) : '', concUnite: undefined, unite: undefined });
  const ajouter = (pid) => setF((x) => { const L = x.produits.filter((l) => l.produitId || !pid); return { ...x, produits: [...L, { produitId: pid || '', conc: pid ? hygTxtNb(hygDerniereConc(db, pid, id)) : '', quantite: '' }] }; });
  const retirer = (i) => setF((x) => ({ ...x, produits: x.produits.filter((_, k) => k !== i) }));
  const ctrl = hygControles(db, R, f);
  const save = () => { const r = act((d) => hygieneSave(d, f, id), id ? 'Entrée modifiée.' : 'Entrée ajoutée au journal d’hygiène.'); if (r.ok) onClose(); };
  return (
    <FormSheet title={id ? 'Modifier l’entrée d’hygiène' : 'Nouvelle entrée d’hygiène'} onClose={onClose} onSave={save}>
      <G><Field label="Date"><DI value={f.date} onChange={(v) => set('date', v)} /></Field><Field label="Action"><SI value={f.actionId} onChange={(v) => set('actionId', v)} options={opts(db, 'actionsHygiene')} /></Field></G>
      <G><Field label="Cible"><SI value={f.cibleType} onChange={(v) => setF((x) => ({ ...x, cibleType: v, cibleId: '' }))} options={[{ value: 'contenant', label: 'Contenant (cuve, fût…)' }, { value: 'equipement', label: 'Équipement (pressoir, filtre…)' }]} /></Field>
        <Field label={f.cibleType === 'contenant' ? 'Contenant' : 'Équipement'}><SI value={f.cibleId} onChange={(v) => set('cibleId', v)} placeholder="Choisir…" options={f.cibleType === 'contenant' ? contOptions(db, true) : opts(db, 'equipements')} /></Field></G>
      {modifie ? <Notice tone="warn" title="Entrée modifiée avec une version antérieure d’Œnotrack">Texte enregistré : « {h.produit} ». Vérifiez les produits et la méthode ci-dessous avant d’enregistrer.</Notice> : null}
      <Group label="Produits utilisés">
        <div className="space-y-2" data-hyg-produits="">
          {f.produits.map((l, i) => { const p = hygDef(db, l.produitId); const e = p ? hygFdsEtat(db, p) : null; return (
            <div key={i} className="rounded-md border border-line p-2" data-hyg-ligne={i}>
              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[200px] flex-1"><SI value={l.produitId} onChange={(v) => choisir(i, v)} placeholder="Produit d’hygiène…" options={hygOptions(db, f.produits.map((x) => x.produitId))} aria-label={`Produit ${i + 1}`} /></div>
                {p && (p.concUnite || '%') !== 'pur' ? <label className="flex items-center gap-1 text-sm"><input className="inp num" style={{ width: 84 }} inputMode="decimal" value={l.conc} onChange={(ev) => setL(i, { conc: ev.target.value })} placeholder={hygPlage(p) || 'conc.'} aria-label={`Concentration du produit ${i + 1}`} />{p.concUnite || '%'}</label> : p ? <Chip>pur</Chip> : null}
                {p ? <label className="flex items-center gap-1 text-sm"><input className="inp num" style={{ width: 84 }} inputMode="decimal" value={l.quantite} onChange={(ev) => setL(i, { quantite: ev.target.value })} placeholder="quantité" aria-label={`Quantité du produit ${i + 1}`} />{hygLib(HYG_UNITES, p.unite)}</label> : null}
                <Btn size="sm" kind="danger" onClick={() => retirer(i)} aria-label={`Retirer le produit ${i + 1}`}>✕</Btn>
              </div>
              {p ? <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs"><HygSecurite p={p} size={22} />{p.rincage === 'oui' ? <Chip tone="info">rinçage obligatoire</Chip> : null}
                {hygPlage(p) || p.temperature || p.contact ? <span className="text-ink2">emploi : {[hygPlage(p), p.temperature, p.contact].filter(Boolean).join(' · ')}</span> : null}
                {e && e.k !== 'ok' ? <Chip tone={e.tone}>{e.label}</Chip> : null}<button type="button" className="linkish" onClick={() => setVoir(p.id)}>fiche du produit</button></div> : null}
              {p && p.incompatibilites ? <div className="mt-1 text-xs text-bad">Ne jamais mélanger avec : {p.incompatibilites}</div> : null}
            </div>); })}
          <div className="flex flex-wrap items-center gap-2"><Btn size="sm" onClick={() => ajouter('')}>+ Ajouter un produit</Btn><Btn size="sm" kind="ghost" onClick={() => setCree(true)}>+ Nouveau produit d’hygiène…</Btn>
            {!aDesProduits ? <span className="help">Aucun produit enregistré : créez-le (avec sa FDS) ou décrivez simplement la méthode ci-dessous.</span> : null}</div>
        </div>
      </Group>
      {ctrl.map((c, i) => <Notice key={i} tone={c.tone}>{c.msg}</Notice>)}
      <Field label="Méthode / précisions" help="Eau chaude, vapeur, température, durée, rinçage…"><TI value={f.methode} onChange={(v) => set('methode', v)} placeholder="ex. eau chaude 60 °C, 20 min, puis rinçage" /></Field>
      <OperateursPicker value={f.operateurs} onChange={(v) => set('operateurs', v)} label="Opérateur(s)" help={ancien ? `Saisi auparavant : « ${ancien} » (gardé tant que personne n’est choisi).` : (db.settings.operateurObligatoire ? 'Obligatoire (réglage de la société).' : '')} />
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} /></Field>
      {cree ? <HygProduitForm onClose={() => setCree(false)} onSaved={(pid) => ajouter(pid)} /> : null}
      {voir ? <HygProduitSheet id={voir} onClose={() => setVoir(null)} /> : null}
    </FormSheet>
  );
}

// produits d'une entrée : pastilles (nom + concentration) et méthode ; une entrée d'une version antérieure : son texte
function HygProduitsCell({ h, onVoir }) {
  const { db } = useApp();
  if (!Array.isArray(h.produits) || !h.produits.length || hygTexteModifie(db, h)) return h.produit || '—';
  return (<span className="flex flex-wrap items-center gap-1">{h.produits.map((l, i) => { const p = hygDef(db, l.produitId); return <button key={i} type="button" className={cx('chip', p && p.mention === 'danger' && 'chip-warn')} onClick={(e) => { e.stopPropagation(); if (p) onVoir(p.id); }} title={p ? 'Fiche du produit' : 'Produit supprimé'}>{(p && p.nom) || l.nom || '?'}{hygConcTxt(l.conc, l.concUnite) ? ` ${hygConcTxt(l.conc, l.concUnite)}` : ''}</button>; })}{h.methode ? <span className="text-xs text-ink2">{h.methode}</span> : null}</span>);
}

function HygJournal() {
  const { db, R, act, confirm, camp } = useApp();
  const [form, setForm] = useState(null); const [cibleF, setCibleF] = useState(''); const [actF, setActF] = useState(''); const [prodF, setProdF] = useState(''); const [scope, setScope] = useState('camp'); const [voir, setVoir] = useState(null);
  const targetName = (h) => (h.cibleType === 'contenant' ? contName(db, h.cibleId) : lbl(db, 'equipements', h.cibleId));
  const rows = db.hygiene.filter((h) => (scope === 'all' || (h.date >= camp.debut && h.date <= camp.fin)) && (!cibleF || `${h.cibleType}:${h.cibleId}` === cibleF) && (!actF || h.actionId === actF) && (!prodF || (Array.isArray(h.produits) && h.produits.some((l) => l && l.produitId === prodF)))).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const lastOf = (type, id) => db.hygiene.filter((h) => h.cibleType === type && h.cibleId === id).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const today = todayISO();
  const cards = [...db.contenants.filter((c) => c.statut !== 'archive').map((c) => ({ key: `contenant:${c.id}`, type: 'contenant', id: c.id, nom: c.nom, full: (R.contVol[c.id] || 0) > 0 })), ...db.lists.equipements.map((e) => ({ key: `equipement:${e.id}`, type: 'equipement', id: e.id, nom: e.label, full: false }))]
    .map((x) => ({ ...x, last: lastOf(x.type, x.id) }));
  const del = async (h) => { const ok = await confirm({ title: 'Supprimer cette entrée ?', body: `${lbl(db, 'actionsHygiene', h.actionId)} — ${targetName(h)} du ${fmtDate(h.date)}.`, ok: 'Supprimer', danger: true }); if (ok) act((d) => hygieneDelete(d, h.id), 'Entrée supprimée.'); };
  const tgtOptions = [...db.contenants.map((c) => ({ value: `contenant:${c.id}`, label: c.nom })), ...db.lists.equipements.map((e) => ({ value: `equipement:${e.id}`, label: `${e.label} (équipement)` }))];
  const prodOptions = hygListe(db).filter((p) => !p.archive || hygUsages(db, p.id).length).map((p) => ({ value: p.id, label: p.nom }));
  return (
    <div>
      <Sec title="Dernière action par cuve et équipement" right={<Btn kind="primary" disabled={camp.figee} onClick={() => setForm({})}>+ Nouvelle entrée</Btn>}>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))' }}>{cards.map((x) => { const d = x.last ? daysBetween(x.last.date, today) : null;
          return (<button key={x.key} type="button" className="card p-2 text-left hover:border-ink2" disabled={camp.figee} onClick={() => setForm({ preset: { cibleType: x.type, cibleId: x.id } })} title="Ajouter une entrée pour cette cible">
            <div className="flex items-center justify-between gap-1"><b className="truncate">{x.nom}</b>{x.type === 'equipement' ? <Chip>équipement</Chip> : x.full ? <Chip tone="info">plein</Chip> : null}</div>
            <div className="text-xs text-ink2">{x.last ? `${lbl(db, 'actionsHygiene', x.last.actionId)} · ${fmtDate(x.last.date)}` : 'Aucune entrée'}</div>
            {x.last ? <div className="mt-1"><Chip tone={d > 180 ? 'warn' : ''}>il y a {d} j</Chip></div> : null}</button>); })}</div>
        <p className="help mt-2">Cliquez sur une cuve ou un équipement pour ajouter une entrée. Les cuves actuellement pleines sont signalées.</p>
      </Sec>
      <Sec title={`Journal d’hygiène (${rows.length})`} right={<><SI value={scope} onChange={setScope} style={{ width: 'auto' }} options={[{ value: 'camp', label: `Campagne ${camp.nom}` }, { value: 'all', label: 'Toutes les campagnes' }]} aria-label="Période" />
        <SI value={cibleF} onChange={setCibleF} placeholder="Toutes les cibles" style={{ width: 'auto' }} options={tgtOptions} aria-label="Cible" /><SI value={actF} onChange={setActF} placeholder="Toutes les actions" style={{ width: 'auto' }} options={opts(db, 'actionsHygiene')} aria-label="Action" />
        {prodOptions.length ? <SI value={prodF} onChange={setProdF} placeholder="Tous les produits" style={{ width: 'auto' }} options={prodOptions} aria-label="Produit d’hygiène" /> : null}</>}>
        <Tbl rows={rows} empty="Aucune entrée d’hygiène pour ces critères." cols={[
          { h: 'Date', r: (h) => <span className="num">{fmtDate(h.date)}</span> }, { h: 'Cible', r: (h) => <span><b>{targetName(h)}</b> <span className="text-xs text-ink2">{h.cibleType === 'equipement' ? 'équipement' : 'contenant'}</span></span> },
          { h: 'Action', r: (h) => <Chip tone="info">{lbl(db, 'actionsHygiene', h.actionId)}</Chip> }, { h: 'Produits / méthode', r: (h) => <HygProduitsCell h={h} onVoir={setVoir} /> }, { h: 'Opérateur(s)', r: (h) => (Array.isArray(h.operateurs) && h.operateurs.length ? <OperateursChips ids={h.operateurs} /> : h.operateur || '—') }, { h: 'Notes', r: (h) => <span className="text-xs">{h.notes}</span> },
          { h: '', r: (h) => (isLocked(db, h.date) ? <Chip>🔒 figée</Chip> : <div className="flex gap-1"><Btn size="sm" onClick={() => setForm({ id: h.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => del(h)}>Supprimer</Btn></div>) }]} />
      </Sec>
      {form ? <HygieneForm id={form.id} preset={form.preset} onClose={() => setForm(null)} /> : null}
      {voir ? <HygProduitSheet id={voir} onClose={() => setVoir(null)} /> : null}
    </div>
  );
}

function TabHygiene() {
  const { db } = useApp(); const nMq = hygListe(db).filter((p) => !p.archive && hygFdsEtat(db, p).k === 'manquante').length;
  const items = [{ id: 'journal', label: 'Journal d’hygiène' }, { id: 'produits', label: 'Produits d’hygiène', badge: nMq || null }];
  const [sub, setSub] = useSousOnglet(items, 'journal');
  return (<div><SubNav value={sub} onChange={setSub} items={items} />{sub === 'produits' ? <HygProduitsView /> : <HygJournal />}</div>);
}
TABS_REG.hygiene = TabHygiene;
