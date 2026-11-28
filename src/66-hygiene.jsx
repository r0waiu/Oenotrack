/* ============ ONGLET 6 : HYGIÈNE — journal des nettoyages, rinçages, désinfections · produits d'hygiène (0.18.0-alpha.1, 66b) ============
   0.48.0-alpha.1 : cartes « dernière action » avec le nom entier (deux lignes, title) et le type dessous ; « 🖨 Imprimer / PDF » du journal. */
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
    methode: h ? (v19 && !(modifie && !h.produits.length) ? h.methode || '' : h.produit || '') : '', operateur: ancien, operateurs: h ? (h.operateurs || []) : (moi ? [moi] : []), notes: h ? h.notes : '',
    // plan d'hygiène (0.26.0-alpha.1) : ligne du plan suivie, contrôle après rinçage, changement de revendication
    planId: h ? h.planId || '' : p0.planId || '', controle: h && h.controle ? { resultat: '', valeur: '', ...h.controle } : p0.controle ? { resultat: '', valeur: '', ...p0.controle } : { type: '', resultat: '', valeur: '' },
    changementRevendication: h ? h.changementRevendication || null : p0.changementRevendication || null,
    ...(!h && p0.actionId ? { actionId: p0.actionId } : {}), ...(!h && Array.isArray(p0.produits) && p0.produits.length ? { produits: p0.produits } : {}) });
  const planL = planNettoyage(db).filter((e) => e && e.actif !== false && hygCibles(db, e.cible).some((c) => c.type === f.cibleType && c.id === f.cibleId));
  const planE = planNettoyage(db).find((e) => e.id === f.planId) || null; const ctlT = f.controle.type || (planE && planE.controle !== 'aucun' ? planE.controle : '');
  const setCtl = (patch) => setF((x) => ({ ...x, controle: { ...x.controle, type: x.controle.type || ctlT, ...patch } }));
  const choisirPlan = (pid) => { const e = planNettoyage(db).find((x) => x.id === pid); setF((x) => ({ ...x, planId: pid, ...(e && !id ? { actionId: e.actionId, controle: { type: e.controle && e.controle !== 'aucun' ? e.controle : '', resultat: '', valeur: '' } } : {}) })); };
  const [cree, setCree] = useState(false); const [voir, setVoir] = useState(null); const [ajoutCtl, setAjoutCtl] = useState(null);
  const ajouterCtl = () => { const r = act((d) => hygListeAjouter(d, 'hygControles', ajoutCtl.label, { attendu: ajoutCtl.attendu }), 'Moyen de contrôle ajouté à la liste.'); if (r && r.ok) { setAjoutCtl(null); setF((x) => ({ ...x, controle: { ...x.controle, type: r.id } })); } };
  const setL = (i, patch) => setF((x) => ({ ...x, produits: x.produits.map((l, k) => (k === i ? { ...l, ...patch } : l)) }));
  const choisir = (i, pid) => setL(i, { produitId: pid, conc: pid ? hygTxtNb(hygDerniereConc(db, pid, id)) : '', concUnite: undefined, unite: undefined });
  const ajouter = (pid) => setF((x) => { const L = x.produits.filter((l) => l.produitId || !pid); return { ...x, produits: [...L, { produitId: pid || '', conc: pid ? hygTxtNb(hygDerniereConc(db, pid, id)) : '', quantite: '' }] }; });
  const retirer = (i) => setF((x) => ({ ...x, produits: x.produits.filter((_, k) => k !== i) }));
  const ctrl = hygControles(db, R, f);
  const save = () => { const r = act((d) => hygieneSave(d, f, id), id ? 'Entrée modifiée.' : 'Entrée ajoutée au journal d’hygiène.'); if (r.ok) onClose(); };
  return (
    <FormSheet title={id ? 'Modifier l’entrée d’hygiène' : 'Nouvelle entrée d’hygiène'} onClose={onClose} onSave={save}>
      <G><Field label="Date"><DI value={f.date} onChange={(v) => set('date', v)} /></Field><Field label="Action"><SI value={f.actionId} onChange={(v) => set('actionId', v)} options={opts(db, 'actionsHygiene')} /></Field></G>
      <G><Field label="Cible"><SI value={f.cibleType} onChange={(v) => setF((x) => ({ ...x, cibleType: v, cibleId: '', planId: '' }))} options={[{ value: 'contenant', label: 'Contenant (cuve, fût…)' }, { value: 'equipement', label: 'Équipement (pressoir, filtre…)' }, { value: 'local', label: 'Local ou matériel (sol, caisses, tuyaux…)' }]} /></Field>
        <Field label={f.cibleType === 'contenant' ? 'Contenant' : f.cibleType === 'local' ? 'Local ou matériel' : 'Équipement'}><SI value={f.cibleId} onChange={(v) => setF((x) => ({ ...x, cibleId: v, planId: x.planId && planNettoyage(db).some((e) => e.id === x.planId && hygCibles(db, e.cible).some((c) => c.type === x.cibleType && c.id === v)) ? x.planId : '' }))} placeholder="Choisir…" options={f.cibleType === 'contenant' ? contOptions(db, true) : f.cibleType === 'local' ? opts(db, 'locaux') : opts(db, 'equipements')} /></Field></G>
      {planL.length ? <Field label="Selon le plan de nettoyage" help={planE ? <>{planE.mode ? <span>{planE.mode}</span> : null}{planE.contact ? <span>{` Temps de contact : ${planE.contact}.`}</span> : null}{planE.attendu ? <span>{` Contrôle attendu : ${planE.attendu}.`}</span> : null}</> : 'Ligne du plan que cette entrée applique (consignes, contrôle attendu).'}><SI plain value={f.planId} onChange={choisirPlan} options={[{ value: '', label: '— aucune —' }, ...planL.map((e) => ({ value: e.id, label: `${e.libelle} — ${lbl(db, 'actionsHygiene', e.actionId)}` }))]} aria-label="Ligne du plan de nettoyage" data-hyg-plan="" /></Field> : null}
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
      <Group label="Contrôle après rinçage" help={ctlT ? hygControleAide(ctlT) : 'Vérification de l’efficacité du nettoyage et du rinçage (méthode HACCP).'}>
        <div className="flex flex-wrap items-center gap-2" data-hyg-controle="">
          <SI plain value={ctlT} onChange={(v) => setF((x) => ({ ...x, controle: { ...x.controle, type: v } }))} options={[{ value: '', label: '— aucun —' }, ...hygOpts(HYG_CONTROLES.filter((c) => c[0] !== 'aucun'), ctlT)]} aria-label="Type de contrôle" style={{ width: 'auto' }} />
          <Btn size="sm" kind="ghost" onClick={() => setAjoutCtl(ajoutCtl ? null : { label: '', attendu: '' })} title="Ajouter un moyen de contrôle à la liste (Hygiène › Listes)" aria-label="Ajouter un moyen de contrôle" data-ajout-controle="">+</Btn>
          {ctlT ? <>{[['conforme', '✓ Conforme'], ['non_conforme', '✕ Non conforme']].map(([v, l]) => <button key={v} type="button" className={cx('opr-tog', f.controle.resultat === v && 'on')} aria-pressed={f.controle.resultat === v} onClick={() => setCtl({ resultat: f.controle.resultat === v ? '' : v })}>{l}</button>)}
            {ctlT !== 'visuel' ? <input className="inp num" style={{ width: 90 }} value={f.controle.valeur || ''} onChange={(e) => setCtl({ valeur: e.target.value })} placeholder={ctlT === 'ph' ? 'pH lu' : 'valeur lue'} aria-label="Valeur lue" /> : null}</> : null}
        </div>
        {ajoutCtl ? <div className="mt-2 flex flex-wrap items-center gap-2" data-ajout-controle-form=""><TI value={ajoutCtl.label} onChange={(v) => setAjoutCtl({ ...ajoutCtl, label: v })} placeholder="Moyen de contrôle (ex. conductimètre)" aria-label="Nouveau moyen de contrôle" autoFocus style={{ minWidth: 200, flex: 1 }} /><TI value={ajoutCtl.attendu} onChange={(v) => setAjoutCtl({ ...ajoutCtl, attendu: v })} placeholder="Résultat attendu" aria-label="Résultat attendu du contrôle" style={{ minWidth: 150, flex: 1 }} /><Btn size="sm" kind="primary" onClick={ajouterCtl}>Ajouter</Btn><Btn size="sm" onClick={() => setAjoutCtl(null)}>Annuler</Btn></div> : null}
        {ctlT && f.controle.resultat === 'non_conforme' ? <div className="mt-1 text-xs text-bad">Non conforme : rincez de nouveau jusqu’au résultat attendu, puis enregistrez une nouvelle entrée.</div> : null}
        {planE && ctlT && !f.controle.resultat && !String(f.controle.valeur || '').trim() ? <div className="mt-1 text-xs text-warn">Le plan prévoit ce contrôle : indiquez son résultat.</div> : null}
      </Group>
      <div className="flex flex-wrap items-center gap-2" data-hyg-revendication=""><Check checked={!!f.changementRevendication} onChange={(v) => set('changementRevendication', v ? (f.changementRevendication || { de: 'conv', vers: 'bio' }) : null)} label="Pour un changement de revendication" />
        {f.changementRevendication ? <><SI plain value={f.changementRevendication.de || ''} onChange={(v) => set('changementRevendication', { ...f.changementRevendication, de: v })} options={qualifOptions(db, f.changementRevendication.de)} aria-label="Revendication précédente" style={{ width: 'auto' }} /><span>→</span><SI plain value={f.changementRevendication.vers || ''} onChange={(v) => set('changementRevendication', { ...f.changementRevendication, vers: v })} options={qualifOptions(db, f.changementRevendication.vers)} aria-label="Revendication suivante" style={{ width: 'auto' }} /></> : null}</div>
      <OperateursPicker value={f.operateurs} onChange={(v) => set('operateurs', v)} label="Opérateur(s)" help={ancien ? `Saisi auparavant : « ${ancien} » (gardé tant que personne n’est choisi).` : (db.settings.operateurObligatoire ? 'Obligatoire (réglage de la société).' : '')} />
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} /></Field>
      {cree ? <HygProduitForm onClose={() => setCree(false)} onSaved={(pid) => ajouter(pid)} /> : null}
      {voir ? <HygProduitSheet id={voir} onClose={() => setVoir(null)} /> : null}
    </FormSheet>
  );
}

// aide du contrôle après rinçage : consigne d'origine, sinon le résultat attendu de la liste (Hygiène › Listes)
function hygControleAide(id) {
  const att = HYG_CONTROLE_ATTENDU[id] || ''; const o = ((hygListeDef('hygControles') || { origine: [] }).origine.find((x) => x[0] === id) || [])[2] || {};
  if (id === 'ph' && att === (o.attendu || '')) return 'Papier pH sur l’eau de rinçage : pH 7 attendu (plus de produit alcalin ni acide).';
  if (id === 'peroxyde' && att === (o.attendu || '')) return 'Papier peroxyde : 0 attendu (plus de désinfectant oxydant).';
  if (id === 'visuel' && !att) return 'Propreté vérifiée à l’œil : aucun résidu, eau claire.';
  return att ? `Résultat attendu : ${att}.` : 'Indiquez le résultat du contrôle.';
}
// produits d'une entrée : pastilles (nom + concentration) et méthode ; une entrée d'une version antérieure : son texte
function HygProduitsCell({ h, onVoir }) {
  const { db } = useApp();
  if (!Array.isArray(h.produits) || !h.produits.length || hygTexteModifie(db, h)) return h.produit || '—';
  return (<span className="flex flex-wrap items-center gap-1">{h.produits.map((l, i) => { const p = hygDef(db, l.produitId); return <button key={i} type="button" className={cx('chip', p && p.mention === 'danger' && 'chip-warn')} onClick={(e) => { e.stopPropagation(); if (p) onVoir(p.id); }} title={p ? 'Fiche du produit' : 'Produit supprimé'}>{(p && p.nom) || l.nom || '?'}{hygConcTxt(l.conc, l.concUnite) ? ` ${hygConcTxt(l.conc, l.concUnite)}` : ''}</button>; })}{h.methode ? <span className="text-xs text-ink2">{h.methode}</span> : null}</span>);
}

function HygJournal({ onAFaire }) {
  const { db, R, act, confirm, camp } = useApp(); const T = usePlanTaches();
  const nT = (k) => T.filter((x) => x.etat === k).length; const RANG_T = { nonconforme: 0, retard: 1, afaire: 2 }; const tCible = {};
  T.forEach((x) => { if (!x.cible) return; const k = `${x.cible.type}:${x.cible.id}`; if (!tCible[k] || RANG_T[x.etat] < RANG_T[tCible[k].etat]) tCible[k] = x; });
  const [form, setForm] = useState(null); const [cibleF, setCibleF] = useState(''); const [actF, setActF] = useState(''); const [prodF, setProdF] = useState(''); const [scope, setScope] = useState('camp'); const [voir, setVoir] = useState(null);
  const targetName = (h) => hygCibleNom(db, h.cibleType, h.cibleId);
  const rows = db.hygiene.filter((h) => (scope === 'all' || (h.date >= camp.debut && h.date <= camp.fin)) && (!cibleF || `${h.cibleType}:${h.cibleId}` === cibleF) && (!actF || h.actionId === actF) && (!prodF || (Array.isArray(h.produits) && h.produits.some((l) => l && l.produitId === prodF)))).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const lastOf = (type, id) => db.hygiene.filter((h) => h.cibleType === type && h.cibleId === id).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const today = todayISO();
  const cards = [...db.contenants.filter((c) => c.statut !== 'archive').map((c) => ({ key: `contenant:${c.id}`, type: 'contenant', id: c.id, nom: c.nom, full: (R.contVol[c.id] || 0) > 0 })), ...db.lists.equipements.map((e) => ({ key: `equipement:${e.id}`, type: 'equipement', id: e.id, nom: e.label, full: false }))]
    .concat(locauxDe(db).map((l) => ({ key: `local:${l.id}`, type: 'local', id: l.id, nom: l.label, full: false })))
    .map((x) => ({ ...x, last: lastOf(x.type, x.id) }));
  const del = async (h) => { const ok = await confirm({ title: 'Supprimer cette entrée ?', body: `${lbl(db, 'actionsHygiene', h.actionId)} — ${targetName(h)} du ${fmtDate(h.date)}.`, ok: 'Supprimer', danger: true }); if (ok) act((d) => hygieneDelete(d, h.id), 'Entrée supprimée.'); };
  const tgtOptions = [...db.contenants.map((c) => ({ value: `contenant:${c.id}`, label: c.nom })), ...db.lists.equipements.map((e) => ({ value: `equipement:${e.id}`, label: `${e.label} (équipement)` })), ...locauxDe(db).map((l) => ({ value: `local:${l.id}`, label: `${l.label} (local)` }))];
  const prodOptions = hygListe(db).filter((p) => !p.archive || hygUsages(db, p.id).length).map((p) => ({ value: p.id, label: p.nom }));
  return (
    <div>
      {T.length ? <Notice tone={nT('nonconforme') ? 'bad' : nT('retard') ? 'warn' : 'info'} title="Plans de nettoyage et de maintenance : tâches en attente"><span className="inline-flex flex-wrap items-center gap-2" data-hyg-resume="">{nT('nonconforme') ? <Chip tone="bad"><b>{nT('nonconforme')}</b> non-conformité(s)</Chip> : null}{nT('retard') ? <Chip tone="warn"><b>{nT('retard')}</b> en retard</Chip> : null}{nT('afaire') ? <Chip tone="info"><b>{nT('afaire')}</b> à faire</Chip> : null}{onAFaire ? <button type="button" className="linkish" onClick={onAFaire}>Voir « À faire »</button> : null}</span></Notice> : null}
      <Sec title="Dernière action par cuve, équipement et local" right={<Btn kind="primary" disabled={camp.figee} onClick={() => setForm({})} data-vg="hygiene-nouvelle">+ Nouvelle entrée</Btn>}>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))' }}>{cards.map((x) => { const d = x.last ? daysBetween(x.last.date, today) : null;
          return (<button key={x.key} type="button" className="card hyg-carte p-2 text-left hover:border-ink2" data-hyg-carte={x.key} disabled={camp.figee} onClick={() => setForm({ preset: { cibleType: x.type, cibleId: x.id } })} title="Ajouter une entrée pour cette cible">
            <b className="hyg-nom" title={x.nom} translate="no">{x.nom}</b>{x.type === 'equipement' ? <div className="hyg-type"><Chip>équipement</Chip></div> : x.type === 'local' ? <div className="hyg-type"><Chip>local</Chip></div> : x.full ? <div className="hyg-type"><Chip tone="info">plein</Chip></div> : null}
            <div className="text-xs text-ink2">{x.last ? `${lbl(db, 'actionsHygiene', x.last.actionId)} · ${fmtDate(x.last.date)}` : 'Aucune entrée'}</div>
            {x.last || tCible[x.key] ? <div className="mt-1 flex flex-wrap gap-1">{x.last ? <Chip tone={d > 180 ? 'warn' : ''}>il y a {d} j</Chip> : null}{tCible[x.key] ? <span data-carte-tache={tCible[x.key].etat}><Chip tone={(ETAT_TACHE[tCible[x.key].etat] || [])[0]} title={tCible[x.key].msg}>{(ETAT_TACHE[tCible[x.key].etat] || [])[1]} : {actionNom(db, tCible[x.key].actionId)}</Chip></span> : null}</div> : null}</button>); })}</div>
        <p className="help mt-2">Cliquez sur une cuve, un équipement ou un local pour ajouter une entrée. Les cuves actuellement pleines sont signalées, ainsi que les tâches du plan de nettoyage.</p>
      </Sec>
      <Sec title={`Journal d’hygiène (${rows.length})`} right={<><SI value={scope} onChange={setScope} style={{ width: 'auto' }} options={[{ value: 'camp', label: `Campagne ${camp.nom}` }, { value: 'all', label: 'Toutes les campagnes' }]} aria-label="Période" />
        <SI value={cibleF} onChange={setCibleF} placeholder="Toutes les cibles" style={{ width: 'auto' }} options={tgtOptions} aria-label="Cible" /><SI value={actF} onChange={setActF} placeholder="Toutes les actions" style={{ width: 'auto' }} options={opts(db, 'actionsHygiene')} aria-label="Action" />
        {prodOptions.length ? <SI value={prodF} onChange={setProdF} placeholder="Tous les produits" style={{ width: 'auto' }} options={prodOptions} aria-label="Produit d’hygiène" /> : null}
        <ImprimerListe nom="journal-hygiene" titre="Journal d’hygiène" sub={`${rows.length} entrée(s) · ${scope === 'all' ? 'toutes les campagnes' : `campagne ${camp.nom}`}`} sections={() => [{ head: ['Date', 'Cible', 'Type', 'Action', 'Contrôle', 'Produits / méthode', 'Opérateur(s)'], rows: rows.map((h) => [fmtDate(h.date), targetName(h), h.cibleType === 'equipement' ? 'équipement' : h.cibleType === 'local' ? 'local' : 'contenant', lbl(db, 'actionsHygiene', h.actionId),
          h.controle && h.controle.type ? `${hygLib(HYG_CONTROLES, h.controle.type)}${h.controle.valeur ? ` ${h.controle.valeur}` : ''} ${h.controle.resultat === 'non_conforme' ? '✕' : '✓'}` : '—',
          [Array.isArray(h.produits) && h.produits.length && !hygTexteModifie(db, h) ? h.produits.map((l) => { const p = hygDef(db, l.produitId); return `${(p && p.nom) || l.nom || '?'}${hygConcTxt(l.conc, l.concUnite) ? ` ${hygConcTxt(l.conc, l.concUnite)}` : ''}`; }).join(', ') : h.produit || '', h.methode || ''].filter(Boolean).join(' — ') || '—',
          Array.isArray(h.operateurs) && h.operateurs.length ? operateursNoms(db, h.operateurs) : h.operateur || '—']) }]} /></>}>
        <Tbl rows={rows} empty="Aucune entrée d’hygiène pour ces critères." cols={[
          { h: 'Date', r: (h) => <span className="num">{fmtDate(h.date)}</span> }, { h: 'Cible', r: (h) => <span><b>{targetName(h)}</b> <span className="text-xs text-ink2">{h.cibleType === 'equipement' ? 'équipement' : h.cibleType === 'local' ? 'local' : 'contenant'}</span></span> },
          { h: 'Action', r: (h) => <span className="flex flex-wrap items-center gap-1"><Chip tone="info">{lbl(db, 'actionsHygiene', h.actionId)}</Chip>{h.controle && h.controle.type ? <Chip tone={h.controle.resultat === 'non_conforme' ? 'bad' : 'ok'} title="Contrôle après rinçage">{hygLib(HYG_CONTROLES, h.controle.type)}{h.controle.valeur ? ` ${h.controle.valeur}` : ''} {h.controle.resultat === 'non_conforme' ? '✕' : '✓'}</Chip> : null}{h.changementRevendication ? <Chip title="Changement de revendication">{[h.changementRevendication.de, h.changementRevendication.vers].filter(Boolean).map((q) => qDef(q).court || qLabel(q)).join(' → ')}</Chip> : null}</span> }, { h: 'Produits / méthode', r: (h) => <HygProduitsCell h={h} onVoir={setVoir} /> }, { h: 'Opérateur(s)', r: (h) => (Array.isArray(h.operateurs) && h.operateurs.length ? <OperateursChips ids={h.operateurs} /> : h.operateur || '—') }, { h: 'Notes', r: (h) => <span className="text-xs">{h.notes}</span> },
          { h: '', r: (h) => (isLocked(db, h.date) ? <Chip>🔒 figée</Chip> : <div className="flex gap-1"><Btn size="sm" onClick={() => setForm({ id: h.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => del(h)}>Supprimer</Btn></div>) }]} />
      </Sec>
      {form ? <HygieneForm id={form.id} preset={form.preset} onClose={() => setForm(null)} /> : null}
      {voir ? <HygProduitSheet id={voir} onClose={() => setVoir(null)} /> : null}
    </div>
  );
}

// maintenance dans l'onglet Équipements (0.28.0-alpha.1) quand il est actif et autorisé ; sinon dans l'Hygiène, comme avant
const maintDansEquipements = (db, uid) => moduleActif(db, 'equipements') && moduleAutorise(db, uid, 'equipements');
function TabHygiene() {
  const { db, uid } = useApp(); const nMq = hygListe(db).filter((p) => !p.archive && hygFdsEtat(db, p).k === 'manquante').length; const T0 = usePlanTaches();
  const eq = maintDansEquipements(db, uid); const T = eq ? T0.filter((x) => x.origine !== 'maintenance') : T0;
  const items = [{ id: 'journal', label: 'Journal d’hygiène' }, { id: 'afaire', label: 'À faire', badge: T.length || null }, { id: 'plan', label: 'Plan de nettoyage' }, ...(eq ? [] : [{ id: 'maintenance', label: 'Maintenance' }]), { id: 'produits', label: 'Produits d’hygiène', badge: nMq || null }, { id: 'listes', label: '⚙ Réglages' }];
  const [sub, setSub] = useSousOnglet(items, 'journal');
  const V = { produits: HygProduitsView, plan: PlanNettoyageView, maintenance: PlanMaintenanceView }[sub];
  return (<div data-col-figee=""><SubNav value={sub} onChange={setSub} items={items} />{sub === 'afaire' ? <HygAFaire quoi={eq ? 'hygiene' : undefined} /> : sub === 'listes' ? <HygListesView groupes={eq ? ['hygiene'] : ['hygiene', 'maintenance']} /> : V ? <V /> : <HygJournal onAFaire={() => setSub('afaire')} />}</div>);
}
TABS_REG.hygiene = TabHygiene;
