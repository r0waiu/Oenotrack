/* ============ OPÉRATEURS : liste de la société, choix dans les opérations, fiche d'activité, opérateur de l'appareil ============
   Données : db.operateurs (31-crud.js) ; op.operateurs, hygiene.operateurs, alerte.decidePar, prevision.f.operateurs = [ids].
   L'opérateur « de cet appareil » (téléphone du chai, ordinateur du bureau…) est mémorisé dans ce navigateur seulement : il est
   proposé d'office dans chaque nouvelle opération saisie ici. */
const MOI_KEY = 'oenotrack-operateur';
const moiLire = () => { try { return window.localStorage.getItem(MOI_KEY) || ''; } catch (e) { return ''; } };
const moiEcrire = (id) => { try { if (id) window.localStorage.setItem(MOI_KEY, id); else window.localStorage.removeItem(MOI_KEY); } catch (e) { /* stockage indisponible : choix gardé pour la séance */ } };
const oprTitre = (o) => (o ? `${operateurPlein(o)}${o.fonction ? ` · ${o.fonction}` : ''}${o.actif === false ? ' (archivé)' : ''}` : '');

function OperateurForm({ id, preset, onClose, onSaved }) {
  const { db, act } = useApp(); const o = id ? operateurDe(db, id) : null; const p = preset || {};
  const [f, set] = useDraft({ prenom: o ? o.prenom || '' : p.prenom || '', nom: o ? o.nom || '' : p.nom || '', fonction: o ? o.fonction || '' : p.fonction || '', initiales: o ? o.initiales || '' : '', contact: o ? o.contact || '' : '', notes: o ? o.notes || '' : '', actif: o ? o.actif !== false : true });
  const dup = !!(f.prenom.trim() || f.nom.trim()) && (db.operateurs || []).some((x) => x && x.id !== id && operateurCle(x.prenom, x.nom) === operateurCle(f.prenom, f.nom));
  const save = () => { const r = act((d) => operateurSave(d, f, id), id ? 'Opérateur modifié.' : `Opérateur ajouté : ${[f.prenom.trim(), f.nom.trim()].filter(Boolean).join(' ')}.`); if (r.ok) { if (onSaved) onSaved(r.id); onClose(); } };
  const auto = operateurInitiales({ prenom: f.prenom, nom: f.nom });
  return (
    <FormSheet title={o ? `Modifier ${operateurPlein(o)}` : 'Nouvel opérateur'} sub="Personne qui réalise des opérations : salarié, saisonnier, apprenti, prestataire, œnologue…" onClose={onClose} onSave={save}>
      <div className="grid2"><Field label="Prénom"><TI value={f.prenom} onChange={(v) => set('prenom', v)} autoFocus={!o} autoComplete="off" /></Field><Field label="Nom" help={dup ? '⚠ Cet opérateur existe déjà.' : ''}><TI value={f.nom} onChange={(v) => set('nom', v)} autoComplete="off" /></Field></div>
      <div className="grid2"><Field label="Fonction" help="Choisissez dans la liste ou écrivez librement."><TI value={f.fonction} onChange={(v) => set('fonction', v)} list="opr-fonctions" placeholder="ex. Caviste" autoComplete="off" /></Field>
        <Field label="Initiales" help={`Pastilles et fiches (automatique : ${auto || '—'}).`}><TI value={f.initiales} onChange={(v) => set('initiales', v.toUpperCase().slice(0, 4))} placeholder={auto} autoComplete="off" /></Field></div>
      <datalist id="opr-fonctions">{OPERATEUR_FONCTIONS.map((x) => <option key={x} value={x} />)}</datalist>
      <Field label="Contact (facultatif)"><TI value={f.contact} onChange={(v) => set('contact', v)} placeholder="Téléphone, e-mail…" /></Field>
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} placeholder="ex. saisonnier des vendanges, habilitations, société du prestataire…" /></Field>
      {o ? <Check checked={!f.actif} onChange={(v) => set('actif', !v)} label="Archivé : n’est plus proposé dans les opérations (son historique reste visible)" /> : null}
    </FormSheet>
  );
}

// Choix des opérateurs d'une opération : un bouton par personne (un appui = choisi / retiré), plusieurs possibles
function OperateursPicker({ value, onChange, label = 'Opérateur(s)', help, allowAdd = true }) {
  const { db, moi } = useApp(); const [add, setAdd] = useState(false);
  const sel = Array.isArray(value) ? value.filter((id) => operateurDe(db, id)) : [];
  const actifs = operateursTries(db, false);
  const liste = [...actifs, ...sel.filter((id) => !actifs.some((o) => o.id === id)).map((id) => operateurDe(db, id))]; // archivés déjà choisis
  const grand = actifs.length > 14; const montres = grand ? liste.filter((o) => sel.includes(o.id)) : liste;
  const tog = (id) => onChange(sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
  return (
    <Group label={label} help={help}>
      {!liste.length ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-ink2"><span>Aucun opérateur dans la liste de la société.</span>{allowAdd ? <Btn size="sm" onClick={() => setAdd(true)}>＋ Ajouter un opérateur</Btn> : null}</div>
      ) : (
        <div className="opr-pick" role="group" aria-label={label}>
          {montres.map((o) => { const on = sel.includes(o.id); return (
            <button key={o.id} type="button" className={cx('opr-tog', on && 'on', o.actif === false && 'arch')} aria-pressed={on} onClick={() => tog(o.id)} title={oprTitre(o)} data-operateur={o.id}>
              <span className="opr-av" aria-hidden="true">{on ? '✓' : operateurInitiales(o)}</span><span>{operateurPlein(o)}</span>{o.id === moi ? <span className="opr-sub">· cet appareil</span> : null}
            </button>); })}
          {grand ? <div style={{ flex: '1 1 220px', minWidth: 0 }}><Combo value="" onChange={(id) => { if (id && !sel.includes(id)) onChange([...sel, id]); }} options={actifs.filter((o) => !sel.includes(o.id)).map((o) => ({ value: o.id, label: operateurPlein(o), sub: o.fonction || '' }))} placeholder="Ajouter un opérateur : commencez à écrire…" aria-label="Ajouter un opérateur" /></div> : null}
          {allowAdd ? <Btn size="sm" kind="ghost" onClick={() => setAdd(true)} title="Nouvel opérateur : il rejoint la liste de la société">＋ Nouveau</Btn> : null}
        </div>
      )}
      {add ? <OperateurForm onClose={() => setAdd(false)} onSaved={(id) => onChange([...sel, id])} /> : null}
    </Group>
  );
}

// Pastilles « Julien M. » (clic : fiche de l'opérateur)
function OperateursChips({ ids, vide = '—', lien = true }) {
  const { db, showOperateur } = useApp(); const L = operateursValides(db, ids);
  if (!L.length) return vide ? <span className="text-xs text-ink2">{vide}</span> : null;
  return (
    <span className="opr-chips">{L.map((id) => { const o = operateurDe(db, id); const inner = <><span className="opr-av" aria-hidden="true">{operateurInitiales(o)}</span>{operateurCourt(db, id)}</>;
      return lien ? <button key={id} type="button" className={cx('opr-chip', o.actif === false && 'arch')} title={oprTitre(o)} onClick={(e) => { e.stopPropagation(); showOperateur(id); }}>{inner}</button> : <span key={id} className={cx('opr-chip', o.actif === false && 'arch')} title={oprTitre(o)}>{inner}</span>; })}</span>
  );
}

// tout ce qu'a fait un opérateur (camp : campagne, ou null pour tout) — sert à sa fiche et au registre « Activité des opérateurs »
function operateurActivite(db, id, camp) {
  const ok = (d) => !camp || (d >= camp.debut && d <= camp.fin); const has = (a) => Array.isArray(a) && a.includes(id);
  const desc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.seq || 0) - (a.seq || 0));
  return {
    ops: db.ops.filter((o) => has(o.operateurs) && ok(o.date)).sort(desc),
    hygiene: (db.hygiene || []).filter((h) => has(h.operateurs) && ok(h.date)).sort(desc),
    previsions: (db.previsions || []).filter((p) => p.statut === 'prevue' && has((p.f || {}).operateurs)).sort((a, b) => (a.date < b.date ? -1 : 1)),
    decisions: (db.alertes || []).filter((a) => has(a.decidePar) && ok(a.decidedOn || a.date)),
  };
}
const ACTIVITE_ENTETES = ['Date', 'Campagne', 'Opérateur', 'Fonction', 'Nature', 'Opération / action', 'Lot(s)', 'Contenant(s)', 'Détail', 'Volume (hL)', 'Avec'];
function activiteLignes(db, R, id, camp) {
  const A = operateurActivite(db, id, camp); const o = operateurDe(db, id) || {}; const nom = operateurPlein(o); const avec = (ids) => operateursNoms(db, (ids || []).filter((x) => x !== id));
  const rows = [
    ...A.ops.map((op) => { const v = opVolume(op); return [op.date, campName(db, op.date), nom, o.fonction || '', 'Opération', opNom(op), opLots(op, R).map((l) => lotCode(db, R, l)).join(' + '), opConts(op, R).map((c) => contName(db, c)).join(' + '), opSummary(db, R, op), v == null ? '' : r2(v / 100), avec(op.operateurs)]; }),
    ...A.hygiene.map((h) => [h.date, campName(db, h.date), nom, o.fonction || '', 'Hygiène', lbl(db, 'actionsHygiene', h.actionId), '', h.cibleType === 'contenant' ? contName(db, h.cibleId) : lbl(db, 'equipements', h.cibleId), [h.produit, h.notes].filter(Boolean).join(' · '), '', avec(h.operateurs)]),
    ...A.decisions.map((a) => [a.decidedOn || a.date, campName(db, a.decidedOn || a.date), nom, o.fonction || '', 'Déclassement', a.statut === 'valide' ? 'Déclassement validé' : 'Déclassement refusé', lotCode(db, R, a.lotId), a.contenantId ? contName(db, a.contenantId) : '', `${a.motif} (${qLabel(a.from)} → ${qLabel(a.to)})`, '', avec(a.decidePar)]),
  ];
  return rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

function OperateurSheet({ id, onClose, onBack, backLabel, onCloseAll }) {
  const { db, R, camp, act, toast, confirm, moi, setMoi } = useApp(); const o = operateurDe(db, id);
  const [scope, setScope] = useState('camp'); const [edit, setEdit] = useState(false);
  if (!o) return <Sheet title="Opérateur introuvable" onClose={onClose} onBack={onBack} backLabel={backLabel} onCloseAll={onCloseAll}><Empty>Cet opérateur n’existe plus dans la liste.</Empty></Sheet>;
  const C = scope === 'camp' ? camp : null; const A = operateurActivite(db, id, C); const tous = operateurActivite(db, id, null);
  const derniere = [...tous.ops.map((x) => x.date), ...tous.hygiene.map((x) => x.date)].sort().pop();
  const types = {}; A.ops.forEach((op) => { const k = opNom(op); types[k] = (types[k] || 0) + 1; }); const top = Object.keys(types).sort((a, b) => types[b] - types[a]).slice(0, 6);
  const exporter = (t) => exportRegister({ id: `activite-${slug(operateurPlein(o)) || 'operateur'}`, title: `Activité de ${operateurPlein(o)}`, headers: ACTIVITE_ENTETES, rows: activiteLignes(db, R, id, C) }, t, C ? C.nom : 'toutes-campagnes', toast);
  const supprimer = async () => { if (await confirm({ title: `Supprimer ${operateurPlein(o)} ?`, body: 'Il disparaît de la liste des opérateurs.', ok: 'Supprimer', danger: true })) { const r = act((d) => operateurDelete(d, id), 'Opérateur supprimé.'); if (r.ok) onClose(); } };
  const u = operateurUsage(db, id);
  return (
    <Sheet wide title={<span className="inline-flex items-center gap-3"><span className="opr-av opr-av-l" aria-hidden="true">{operateurInitiales(o)}</span>{operateurPlein(o)}</span>} sub={[o.fonction || 'Opérateur', o.actif === false ? 'archivé' : '', id === moi ? 'opérateur de cet appareil' : ''].filter(Boolean).join(' · ')} onClose={onClose} onBack={onBack} backLabel={backLabel} onCloseAll={onCloseAll}
      footer={<><Btn className="mr-auto" onClick={() => setEdit(true)}>Modifier</Btn>
        {o.actif === false ? <Btn onClick={() => act((d) => operateurActif(d, id, true), `${operateurPlein(o)} est de nouveau proposé dans les opérations.`)}>Réactiver</Btn> : <Btn onClick={() => act((d) => operateurActif(d, id, false), `${operateurPlein(o)} archivé : il n’est plus proposé, son historique reste.`)}>Archiver</Btn>}
        {!u.total ? <Btn kind="danger" onClick={supprimer}>Supprimer</Btn> : null}
        {o.actif !== false ? (id === moi ? <Btn onClick={() => setMoi('')}>Ne plus le proposer sur cet appareil</Btn> : <Btn kind="primary" onClick={() => { setMoi(id); toast(`${operateurPlein(o)} sera proposé dans les nouvelles opérations saisies sur cet appareil.`); }}>C’est moi sur cet appareil</Btn>) : null}</>}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SI plain value={scope} onChange={setScope} options={[{ value: 'camp', label: `Campagne ${camp.nom}` }, { value: 'all', label: 'Toutes les campagnes' }]} style={{ width: 'auto' }} aria-label="Période" />
        <span className="ml-auto flex flex-wrap gap-2"><Btn size="sm" onClick={() => exporter('csv')}>⬇ Exporter (CSV)</Btn><Btn size="sm" onClick={() => exporter('xlsx')}>⬇ Exporter (Excel)</Btn></span>
      </div>
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
        <Kpi label="Opérations" value={fmt(A.ops.length)} sub={C ? `campagne ${C.nom}` : 'toutes campagnes'} /><Kpi label="Hygiène" value={fmt(A.hygiene.length)} sub="nettoyages, rinçages…" />
        <Kpi label="À réaliser" value={fmt(A.previsions.length)} sub="opérations confiées" /><Kpi label="Dernière activité" value={derniere ? fmtDate(derniere) : '—'} />
      </div>
      {o.contact || o.notes ? <dl className="kv mb-5">{o.contact ? <><dt>Contact</dt><dd>{o.contact}</dd></> : null}{o.notes ? <><dt>Notes</dt><dd>{o.notes}</dd></> : null}</dl> : null}
      {top.length ? <div className="mb-4 flex flex-wrap gap-1.5">{top.map((k) => <Chip key={k}>{k} · {types[k]}</Chip>)}</div> : null}
      {A.previsions.length ? <Sec title="Opérations à réaliser qui lui sont confiées"><Tbl rows={A.previsions} cols={[{ h: 'Date prévue', r: (p) => <span className="num">{fmtDate(p.date)}</span> }, { h: 'Opération', r: (p) => <Chip tone={OP_TONE[p.type]}>{opNom(p)}</Chip> }, { h: 'Détail prévu', r: (p) => <span className="text-sm">{p.resume || '—'}</span> }]} /></Sec> : null}
      <Sec title={`Opérations réalisées (${A.ops.length})`}>
        <Tbl rows={A.ops} empty="Aucune opération pour cette période." cols={[
          { h: 'Date', r: (op) => <span className="num whitespace-nowrap">{fmtDate(op.date)}</span> }, { h: 'Opération', r: (op) => <Chip tone={OP_TONE[op.type]}>{opNom(op)}</Chip> },
          { h: 'Lots', r: (op) => <span className="flex flex-wrap gap-x-2">{opLots(op, R).map((l) => <LotLink key={l} id={l} />)}</span> }, { h: 'Contenants', cls: 'hm', r: (op) => <span className="flex flex-wrap gap-x-2">{opConts(op, R).map((c) => <ContLink key={c} id={c} />)}</span> },
          { h: 'Détail', r: (op) => <span className="text-sm">{opSummary(db, R, op)}</span> }, { h: 'Avec', cls: 'hm', r: (op) => <OperateursChips ids={(op.operateurs || []).filter((x) => x !== id)} vide="" /> }]} />
      </Sec>
      {A.hygiene.length ? <Sec title={`Hygiène (${A.hygiene.length})`}><Tbl rows={A.hygiene} cols={[{ h: 'Date', r: (h) => <span className="num">{fmtDate(h.date)}</span> }, { h: 'Action', r: (h) => <Chip tone="info">{lbl(db, 'actionsHygiene', h.actionId)}</Chip> }, { h: 'Cible', r: (h) => (h.cibleType === 'contenant' ? contName(db, h.cibleId) : lbl(db, 'equipements', h.cibleId)) }, { h: 'Produit / méthode', r: (h) => h.produit || '—' }]} /></Sec> : null}
      {A.decisions.length ? <Sec title="Décisions de déclassement"><Tbl rows={A.decisions} cols={[{ h: 'Décidée le', r: (a) => <span className="num">{fmtDate(a.decidedOn)}</span> }, { h: 'Lot', r: (a) => <LotLink id={a.lotId} /> }, { h: 'Décision', r: (a) => (a.statut === 'valide' ? 'Déclassement validé' : 'Refusé') }, { h: 'Motif', r: (a) => a.motif }]} /></Sec> : null}
      {edit ? <OperateurForm id={id} onClose={() => setEdit(false)} /> : null}
    </Sheet>
  );
}

// Paramètres › Société & opérateurs
function OperateursSection() {
  const { db, camp, act, confirm, moi, setMoi, showOperateur } = useApp(); const [form, setForm] = useState(null); const [arch, setArch] = useState(false);
  const L = operateursTries(db, true); const nArch = L.filter((o) => o.actif === false).length; const vis = L.filter((o) => arch || o.actif !== false);
  const stat = (oid) => { const ops = db.ops.filter((x) => Array.isArray(x.operateurs) && x.operateurs.includes(oid)); const h = (db.hygiene || []).filter((x) => Array.isArray(x.operateurs) && x.operateurs.includes(oid)); return { camp: ops.filter((x) => x.date >= camp.debut && x.date <= camp.fin).length, tot: ops.length, last: [...ops, ...h].map((x) => x.date).sort().pop() }; };
  const del = async (o) => { if (await confirm({ title: `Supprimer ${operateurPlein(o)} ?`, body: 'Il disparaît de la liste des opérateurs.', ok: 'Supprimer', danger: true })) act((d) => operateurDelete(d, o.id), 'Opérateur supprimé.'); };
  const actifs = operateursTries(db, false);
  return (
    <Sec title={`Opérateurs (${L.length - nArch}${nArch ? ` + ${nArch} archivé${nArch > 1 ? 's' : ''}` : ''})`} right={<Btn kind="primary" onClick={() => setForm({})}>＋ Opérateur</Btn>}>
      <div className="card space-y-4 p-4" data-section="operateurs">
        <p className="text-sm text-ink2">Les personnes qui réalisent les opérations : salariés, saisonniers, apprentis, prestataires, œnologue… On les choisit dans chaque opération (<b>« Opérateur(s) »</b>), dans le journal d’hygiène et pour les décisions de déclassement. Cliquez sur une personne pour voir tout ce qu’elle a fait.</p>
        {L.length ? <Tbl rows={vis} onRow={(o) => showOperateur(o.id)} cols={[
          { h: 'Opérateur', r: (o) => <span className="inline-flex items-center gap-2"><span className="opr-av" aria-hidden="true">{operateurInitiales(o)}</span><span><b>{operateurPlein(o)}</b>{o.id === moi ? <span className="opr-sub"> · cet appareil</span> : null}</span></span> },
          { h: 'Fonction', r: (o) => o.fonction || '—' }, { h: 'Contact', cls: 'hm', r: (o) => <span className="text-sm">{o.contact || ''}</span> },
          { h: `Opérations ${camp.nom}`, cls: 'r', r: (o) => <span className="num">{fmt(stat(o.id).camp)}</span> }, { h: 'Total', cls: 'r hm', r: (o) => <span className="num">{fmt(stat(o.id).tot)}</span> },
          { h: 'Dernière activité', cls: 'hm', r: (o) => { const d = stat(o.id).last; return d ? <span className="num">{fmtDate(d)}</span> : '—'; } },
          { h: 'Statut', r: (o) => (o.actif === false ? <Chip>archivé</Chip> : <Chip tone="ok">actif</Chip>) },
          { h: '', r: (o) => <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            <Btn size="sm" onClick={() => setForm({ id: o.id })}>Modifier</Btn>
            {o.actif === false ? <Btn size="sm" onClick={() => act((d) => operateurActif(d, o.id, true), `${operateurPlein(o)} réactivé.`)}>Réactiver</Btn> : <Btn size="sm" onClick={() => act((d) => operateurActif(d, o.id, false), `${operateurPlein(o)} archivé : son historique reste visible.`)} title="Ne plus le proposer dans les opérations (son historique est conservé)">Archiver</Btn>}
            {!operateurUsage(db, o.id).total ? <Btn size="sm" kind="danger" onClick={() => del(o)} aria-label={`Supprimer ${operateurPlein(o)}`}>Supprimer</Btn> : null}
          </div> }]} /> : <Empty>Aucun opérateur pour l’instant. Ajoutez les personnes de l’équipe avec « + Opérateur ».</Empty>}
        {nArch ? <Check checked={arch} onChange={setArch} label={`Afficher les opérateurs archivés (${nArch})`} /> : null}
        <div className="grid gap-4 border-t border-line pt-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))' }}>
          <Field label="Opérateur de cet appareil" help="Proposé d’office dans chaque nouvelle opération saisie sur cet appareil (téléphone du chai, ordinateur du bureau…). Réglage propre à cet appareil ; modifiable dans chaque opération.">
            <SI plain value={moi || ''} onChange={(v) => setMoi(v)} options={[{ value: '', label: 'Personne : choisir à chaque opération' }, ...actifs.map((o) => ({ value: o.id, label: oprTitre(o) }))]} aria-label="Opérateur de cet appareil" />
          </Field>
          <Group label="Règle de saisie"><Check checked={!!db.settings.operateurObligatoire} onChange={(v) => act((d) => { d.settings.operateurObligatoire = !!v; return okr(); }, v ? 'Opérateur obligatoire pour valider une opération.' : 'Opérateur facultatif.')} label="Exiger au moins un opérateur pour valider une opération" /><span className="help block">S’applique aux nouvelles opérations, aux entrées d’hygiène et aux décisions de déclassement, sur tous les appareils.</span></Group>
        </div>
      </div>
      {form ? <OperateurForm id={form.id} onClose={() => setForm(null)} /> : null}
    </Sec>
  );
}

// En-tête : qui saisit sur cet appareil (affiché dès qu'il y a des opérateurs) ; la fiche s'ouvre hors du bandeau (portail),
// dont les effets visuels créeraient sinon un cadre trop étroit pour une fenêtre en position fixe
function OperateurChip() {
  const { db, moi } = useApp(); const [open, setOpen] = useState(false);
  if (!operateursTries(db, false).length) return null;
  return (<>
    <button type="button" className={cx('chip', moi && 'chip-ok')} style={{ cursor: 'pointer' }} data-operateur-appareil="" onClick={() => setOpen(true)} title="Opérateur proposé dans les nouvelles opérations saisies sur cet appareil">👤 {moi ? operateurCourt(db, moi) : 'Qui saisit ?'}</button>
    {open ? ReactDOM.createPortal(<MoiSheet onClose={() => setOpen(false)} />, document.body) : null}
  </>);
}
function MoiSheet({ onClose }) {
  const { db, moi, setMoi, setTab } = useApp(); const L = operateursTries(db, false);
  const choisir = (id) => { setMoi(id); onClose(); };
  return (
    <Sheet title="Qui saisit sur cet appareil ?" sub="Cette personne est proposée d’office comme opérateur des nouvelles opérations saisies ici ; vous pouvez toujours la changer dans l’opération." onClose={onClose}
      footer={<><Btn className="mr-auto" kind="ghost" onClick={() => { onClose(); setTab('params', 'entreprise'); }}>Gérer la liste des opérateurs</Btn><Btn onClick={onClose}>Fermer</Btn></>}>
      <div className="opr-pick" role="group" aria-label="Opérateur de cet appareil">
        {L.map((o) => <button key={o.id} type="button" className={cx('opr-tog', o.id === moi && 'on')} aria-pressed={o.id === moi} onClick={() => choisir(o.id)} title={oprTitre(o)}><span className="opr-av" aria-hidden="true">{o.id === moi ? '✓' : operateurInitiales(o)}</span><span>{operateurPlein(o)}</span>{o.fonction ? <span className="opr-sub">· {o.fonction}</span> : null}</button>)}
        <button type="button" className={cx('opr-tog', !moi && 'on')} aria-pressed={!moi} onClick={() => choisir('')}><span className="opr-av" aria-hidden="true">{!moi ? '✓' : '—'}</span><span>Personne : choisir à chaque opération</span></button>
      </div>
    </Sheet>
  );
}
