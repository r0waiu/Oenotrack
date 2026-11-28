/* ============ ONGLET « À RÉALISER & FICHES » : opérations planifiées → fiches à remplir → validation ============
   Une opération est planifiée depuis n'importe quel formulaire d'opération (bouton « 📋 Planifier (à réaliser) ») :
   elle n'a aucun effet sur les stocks tant qu'elle n'est pas validée avec les valeurs réelles.
   0.49.0-alpha.1 : « 🤖 Relire une fiche remplie (photo) » (IA17). */
const PREV_STATUT = { prevue: { label: 'À réaliser', tone: 'info' }, realisee: { label: 'Validée', tone: 'ok' }, annulee: { label: 'Annulée', tone: '' } };

function PrevisionsView() {
  const { db, act, confirm, openOp, openFiche, setTab, moi } = useApp(); const today = todayISO();
  const [statut, setStatut] = useState('prevue'); const [sel, setSel] = useState([]); const [q, setQ] = useState(''); const [oprF, setOprF] = useState(''); const [jour, setJour] = useState(false); const [relire, setRelire] = useState(null);
  const all = db.previsions || []; const quiDe = (p) => operateursValides(db, (p.f || {}).operateurs);
  const quiOK = (p) => !oprF || (oprF === '-' ? !quiDe(p).length : quiDe(p).includes(oprF));
  const list = all.filter((p) => (statut === 'toutes' || p.statut === statut) && quiOK(p) && (!q || norm(`${opNom(p)} ${p.resume} ${p.notes || ''} ${p.ficheOrdre || ''} ${operateursNoms(db, quiDe(p), ' ')}`).includes(norm(q))))
    .sort((a, b) => (statut === 'prevue' ? (a.date < b.date ? -1 : a.date > b.date ? 1 : (num(a.ordre) - num(b.ordre))) : (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))); // 0.43.0-alpha.2 : étapes d'un plan dans l'ordre
  const late = all.filter((p) => p.statut === 'prevue' && !p.sansDate && p.date < today).length;
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
        <Btn onClick={() => setJour(true)} data-vg="fiche-jour" title="Une fiche multi-lignes par type d’opération et par jour : prévu et relevé, une ligne par cuve">🖨 Fiche du jour…</Btn>
        <IaBouton usage="ficheRelue" onClick={() => setRelire({ sel: sel.filter((id) => all.some((p) => p.id === id && p.statut === 'prevue')) })} data-ia-relire-fiche="">Relire une fiche remplie (photo)</IaBouton>
        {sel.length ? <Btn size="sm" kind="ghost" onClick={() => setSel([])}>Désélectionner</Btn> : null}
      </div>
      <Tbl rows={list} empty={statut === 'prevue' ? 'Rien à réaliser. Dans un formulaire d’opération, « 📋 Planifier (à réaliser) » l’ajoute ici.' : 'Aucune opération.'} cols={[
        { h: '', r: (p) => <input type="checkbox" className="h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={sel.includes(p.id)} onChange={() => tog(p.id)} aria-label={`Sélectionner ${OP_LABELS[p.type]} du ${fmtDate(p.date)}`} /> },
        { h: 'Date prévue', r: (p) => <div className="whitespace-nowrap">{p.sansDate ? <span data-prev-ordre="">{`Étape ${p.ordre || (p.schema || {}).rang || ''} / ${(p.schema || {}).nb || ''}`}</span> : <span className="num">{fmtDate(p.date)}</span>}{p.statut === 'prevue' && !p.sansDate && p.date < today ? <Chip tone="warn" className="ml-1">en retard</Chip> : null}{p.statut === 'prevue' ? <div><button type="button" className="linkish text-xs" onClick={() => sameDay(p.date)}>＋ toute la journée</button></div> : null}</div> },
        { h: 'Opération', r: (p) => <div className="flex flex-wrap items-center gap-1"><Chip tone={OP_TONE[p.type]}>{opNom(p)}</Chip><GroupeChip x={p} /><SchemaChip x={p} /></div> },
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
      {jour ? <FicheJourDialog onClose={() => setJour(false)} /> : null}
      {relire ? <FicheRelueDialog ficheId={relire.ficheId} selection={relire.sel} onClose={() => setRelire(null)} /> : null}
    </div>
  );
}

/* fiche multi-lignes du jour (0.29.0-alpha.1) : toutes les opérations d'un même type prévues (et, au choix, déjà validées) ce jour-là,
   une ligne par cuve dans le modèle de fiche du type (prévu en gris, relevé en cases teintées) ; la fiche individuelle reste disponible */
const FICHE_JOUR_TYPES = ['intrant', 'suivi', 'etape', 'soutirage', 'transfert', 'debourbage', 'froid', 'filtration', 'sortie', 'jaugeage', 'assemblage'];
function FicheJourDialog({ onClose }) {
  const { db, openFiche } = useApp(); const [date, setDate] = useState(todayISO()); const [avecOps, setAvecOps] = useState(true);
  const cle = (x) => (x.f ? x.f.sousType : x.sousType) || x.type;
  const prevs = (db.previsions || []).filter((p) => p.statut === 'prevue' && p.date === date && FICHE_JOUR_TYPES.includes(p.type));
  const ops = avecOps ? db.ops.filter((o) => o.date === date && FICHE_JOUR_TYPES.includes(o.type)) : [];
  const types = uniq([...prevs.map(cle), ...ops.map(cle)]);
  const [choix, setChoix] = useState(''); const t = types.includes(choix) ? choix : types[0] || '';
  const nom = (k) => (opDef(db, k) || {}).label || OP_LABELS[k] || k;
  const imprimer = () => { const src = [...prevs.filter((p) => cle(p) === t).map((p) => ({ kind: 'prev', id: p.id })), ...ops.filter((o) => cle(o) === t).map((o) => ({ kind: 'op', id: o.id }))]; if (!src.length) return; onClose(); openFiche(src); };
  return (
    <Sheet title="Fiche du jour" sub="Une fiche multi-lignes par type d’opération" onClose={onClose} footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" disabled={!t} onClick={imprimer}>🖨 Préparer la fiche</Btn></>}>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        <Field label="Jour"><DI value={date} onChange={setDate} /></Field>
        <div className="self-end"><Check checked={avecOps} onChange={setAvecOps} label="Ajouter les opérations déjà validées ce jour-là" /></div>
      </div>
      <div className="mt-4 space-y-1" role="radiogroup" aria-label="Type d’opération">
        {types.length ? types.map((k) => { const np = prevs.filter((p) => cle(p) === k).length; const no = ops.filter((o) => cle(o) === k).length; return (
          <label key={k} className="flex items-center gap-2 text-sm"><input type="radio" name="fj-type" checked={t === k} onChange={() => setChoix(k)} /><b>{nom(k)}</b>{np ? <Chip tone="info"><span className="num">{np}</span> <span>à réaliser</span></Chip> : null}{no ? <Chip tone="ok"><span className="num">{no}</span> <span>validée(s)</span></Chip> : null}</label>); })
          : <Empty>Rien de prévu ce jour-là. Planifiez des opérations (bouton « 📋 Planifier » d’un formulaire, ou saisie groupée depuis la cuverie).</Empty>}
      </div>
      <p className="help mt-3">Une ligne par cuve : valeurs prévues par Œnotrack en gris, cases teintées pour les quantités réelles, l’heure et le visa. Chaque opération garde aussi sa fiche individuelle (« 🖨 Fiche » de la ligne).</p>
    </Sheet>
  );
}

/* 0.49.0-alpha.1 (IA17, usage « ficheRelue », niveau 2) — relire une fiche papier remplie au chai : photo + structure de la fiche
   (iaFicheStructure : une ligne par opération à réaliser, cuve, lot, valeurs prévues, cases à lire ; suivi des fermentations : les autres cuves
   en fermentation imprimées sur la fiche) → valeurs relevées par ligne ; vérification ligne par ligne (valeur lue, case à cocher, correction),
   puis validation des opérations à réaliser et création des relevés par les mécanismes existants (buildSpec, opSave, previsionStatut),
   chacune avec la trace « ia » ; dépassement d'un plafond, erreur ou opération sans relecture champ par champ : formulaire de l'opération. */
const ficheColsTexte = (nodes, pere) => nodes.flatMap((n) => (n.c.length ? ficheColsTexte(n.c, n.h) : [pere ? `${pere} › ${n.h}` : n.h]));
function FicheRelueDialog({ ficheId: f0, selection, onClose }) {
  const { db, act, toast, openOp, uid, moi } = useApp(); const ia = useIaUsage(); const M = fichesModeles(db);
  const fiches = useMemo(() => [...(db.fiches || [])].filter((x) => (x.sources || []).some((s) => s.kind === 'prev' && (db.previsions || []).some((p) => p.id === s.id && p.statut === 'prevue'))).sort((a, b) => ((a.creeLe || a.date || '') < (b.creeLe || b.date || '') ? 1 : -1)), [db]);
  const [choix, setChoix] = useState(() => (f0 ? f0 : (selection || []).length ? 'sel' : (fiches[0] || {}).id || ''));
  const fiche = choix === 'sel' ? null : (db.fiches || []).find((x) => x.id === choix) || null;
  const sources = choix === 'sel' ? (selection || []).map((id) => ({ kind: 'prev', id })) : fiche ? fiche.sources || [] : [];
  const [fichiers, setFichiers] = useState([]); const [busy, setBusy] = useState(false); const [lu, setLu] = useState(null); const [erreurs, setErreurs] = useState([]);
  const tpl = fiche ? M.find((m) => m.id === fiche.modele) : null;
  const lire = async () => {
    if (!fichiers.length || busy) return; setErreurs([]);
    let images = []; try { images = await iaImagesDepuisFichiers(fichiers, { pages: 2 }); } catch (e) { toast((e && e.message) || 'Photo illisible.', 'bad'); return; }
    if (!images.length) { toast('Aucune image lisible dans ce fichier.', 'bad'); return; }
    const st = iaFicheStructure(db, sources); if (!st.lignes.length) { toast('Aucune opération à réaliser sur cette fiche.', 'bad'); return; }
    const colonnes = tpl ? (tpl.tableaux || []).flatMap((t) => ficheColsTexte(parseCols(t.cols))) : [];
    const P = iaFichePrompt(st, { titre: tpl ? tpl.titre : 'Fiche d’enregistrement', ordre: fiche ? fiche.ordre : '', date: fiche ? fiche.date : '', colonnes });
    setBusy(true); const r = await ia.demander('ficheRelue', { ...P, images }); setBusy(false); if (!r) return;
    const L = iaFicheLire(st, r.valeur); const etat = {};
    st.lignes.forEach((l) => { const x = L.lignes[l.n] || { fait: null, valeurs: {}, remarque: '', douteux: [] }; etat[l.n] = { on: x.fait !== false && (x.fait === true || Object.keys(x.valeurs).length > 0) && !l.formulaire, vals: { ...x.valeurs }, lus: { ...x.valeurs }, remarque: x.remarque, fait: x.fait, douteux: x.douteux }; });
    setLu({ st, etat, trace: r.trace, illisible: L.illisible, ecartes: L.ecartes });
  };
  const maj = (n, patch) => setLu((x) => ({ ...x, etat: { ...x.etat, [n]: { ...x.etat[n], ...patch } } }));
  const formDe = (l) => { const e = lu.etat[l.n]; const x = iaFicheForm(db, l, e.vals, e.remarque, lu.trace); if (l.kind === 'nouveau') return { f: { ...opInit('suivi', null, db, l.date), ...x.patch, operateurs: moi ? [moi] : [] }, x }; return { f: x.f, x }; };
  const ouvrir = (l) => { const { f } = formDe(l); if (!f) return; if (f.ia) IA_PREREMPLI[f.ia.le] = { source: 'fiche', notes: [] }; onClose(); openOp(l.type, f, null, l.prevId ? { prevId: l.prevId } : {}); };
  const valider = () => {
    const items = []; const errs = [];
    lu.st.lignes.filter((l) => lu.etat[l.n].on).forEach((l) => {
      const { f, x } = formDe(l); const nom = `Ligne ${l.n}${l.cuve ? ` (${l.cuve})` : ''}`;
      if (!f) { errs.push(`${nom} : ${x.avert[0] || 'opération introuvable'}`); return; }
      if (l.kind === 'nouveau' && x.vide) { errs.push(`${nom} : aucune valeur relevée.`); return; }
      const b = buildSpec(l.type, f, db, getR(db, f.date), null); if (b.error) { errs.push(`${nom} : ${b.error}`); return; }
      const p = l.prevId ? (db.previsions || []).find((y) => y.id === l.prevId) : null;
      const spec = { ...b.spec, ...(p && p.groupe ? { groupe: p.groupe } : {}), ...(p && p.schema ? { schema: p.schema } : {}) };
      const pv = previewOp(db, spec, null); if (pv && pv.ok && (pv.depassements || []).length) { errs.push(`${nom} : dépassement d’un plafond, ouvrez le formulaire pour indiquer le motif.`); return; }
      items.push({ l, spec });
    });
    setErreurs(errs); if (errs.length) return; if (!items.length) { toast('Cochez au moins une ligne à valider.', 'bad'); return; }
    const r = act((d) => { for (const it of items) { const r1 = opSave(d, it.spec, null, { par: uid, maintenant: new Date().toISOString() }); if (!r1 || !r1.ok) return fail(`Ligne ${it.l.n} : ${(r1 && r1.msg) || 'enregistrement impossible.'}`); if (it.l.prevId) previsionStatut(d, it.l.prevId, 'realisee', r1.op.id); } return okr(); },
      `${items.length} opération(s) enregistrée(s) depuis la fiche relue.`);
    if (r && r.ok) onClose();
  };
  const st0 = useMemo(() => iaFicheStructure(db, sources), [db, choix]); // aperçu de la structure avant l'envoi
  const nCoches = lu ? lu.st.lignes.filter((l) => lu.etat[l.n].on).length : 0;
  return (
    <Sheet wide title="Relire une fiche remplie" sub="Photo de la fiche → valeurs relevées à vérifier ligne par ligne" onClose={onClose}
      footer={<><Btn onClick={onClose}>Annuler</Btn>{lu ? <Btn kind="primary" onClick={valider} disabled={!nCoches} data-ia-fiche-valider="">{`✓ Valider les lignes cochées (${nCoches})`}</Btn> : <IaBouton usage="ficheRelue" size="" busy={busy} disabled={!fichiers.length || !st0.lignes.length} onClick={lire} data-ia-fiche-lire="">Lire la fiche</IaBouton>}</>}>
      {!lu ? <div className="space-y-3" data-ia-fiche-etape="photo">
        <Field label="Fiche imprimée">
          <select className="inp" value={choix} onChange={(e) => setChoix(e.target.value)} aria-label="Fiche imprimée" data-ia-fiche-choix="">
            {(selection || []).length ? <option value="sel">{`Opérations sélectionnées (${selection.length})`}</option> : null}
            {fiches.map((x) => <option key={x.id} value={x.id}>{`${x.ordre || '—'} · ${ficheTitre(M, x.modele)} · ${fmtDate(x.date)}`}</option>)}
            {!fiches.length && !(selection || []).length ? <option value="">Aucune fiche imprimée avec des opérations à réaliser</option> : null}
          </select>
        </Field>
        {st0.lignes.length ? <p className="flex flex-wrap gap-x-3 text-sm text-ink2"><span>{`${st0.lignes.length} ligne(s) à relire`}</span>{st0.ignorees.length ? <span>{`${st0.ignorees.length} élément(s) déjà validé(s) ou annulé(s), laissé(s) de côté`}</span> : null}</p> : <Empty>Imprimez d’abord une fiche des opérations à réaliser (« 🖨 Fiche »), faites-la remplir au chai, puis relisez-la ici.</Empty>}
        <Field label="Photo de la fiche remplie (ou PDF scanné)"><input type="file" accept="image/*,application/pdf" multiple className="inp" onChange={(e) => setFichiers(Array.from(e.target.files || []))} aria-label="Photo de la fiche remplie" data-ia-fiche-photo="" /></Field>
        <p className="help">L’IA reçoit la photo et la structure de la fiche (opérations, cuves, lots, valeurs prévues) ; elle renvoie les valeurs relevées, que vous vérifiez ligne par ligne. Rien n’est enregistré avant « ✓ Valider ».</p>
      </div> : <div className="space-y-3" data-ia-fiche-etape="verif">
        <Notice tone="warn" title="Valeurs lues par l’IA : vérifiez chaque ligne">Corrigez une valeur mal lue, décochez une ligne non faite. Les lignes cochées sont validées comme si vous les saisissiez vous-même (mêmes contrôles), avec la mention « 🤖 IA ».</Notice>
        {lu.illisible ? <p className="text-sm text-warn"><span>Illisible : </span><span translate="no">{lu.illisible}</span></p> : null}
        <div className="space-y-2">{lu.st.lignes.map((l) => { const e = lu.etat[l.n]; return (
          <div key={l.n} className={cx('card p-3', !e.on && 'opacity-60')} data-ia-fiche-ligne={l.n}>
            <div className="flex flex-wrap items-center gap-2">
              {l.formulaire ? <Chip>formulaire</Chip> : <input type="checkbox" className="h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={e.on} onChange={(ev) => maj(l.n, { on: ev.target.checked })} aria-label={`Valider la ligne ${l.n}`} data-ia-fiche-coche={l.n} />}
              <b className="num">{l.n}</b><Chip tone={OP_TONE[l.type]}>{l.label}</Chip>{l.cuve ? <b translate="no">{l.cuve}</b> : null}{l.lot ? <span className="text-ink2" translate="no">{l.lot}</span> : null}
              {l.kind === 'nouveau' ? <Chip tone="info">nouveau relevé</Chip> : null}
              {e.fait === true ? <Chip tone="ok">fait</Chip> : e.fait === false ? <Chip tone="bad">non fait</Chip> : <Chip>non coché</Chip>}
              {l.kind === 'prev' ? <button type="button" className="linkish ml-auto text-sm" onClick={() => ouvrir(l)} data-ia-fiche-ouvrir={l.n}>Ouvrir le formulaire…</button> : null}
            </div>
            {l.champs.length ? <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>{l.champs.map((c) => (
              <Field key={c.id} label={`${c.label}${c.unite ? ` (${c.unite})` : ''}`} help={<span className="flex flex-wrap gap-x-2">{c.prevu ? <span><span>prévu : </span><span translate="no">{c.prevu}</span></span> : null}{e.lus[c.id] !== undefined && e.lus[c.id] !== e.vals[c.id] ? <span><span>lu par l’IA : </span><span translate="no">{e.lus[c.id]}</span></span> : null}{e.douteux.includes(c.id) ? <span className="text-warn">à vérifier</span> : null}</span>}>
                <TI value={e.vals[c.id] || ''} onChange={(v) => maj(l.n, { vals: { ...e.vals, [c.id]: v } })} aria-label={`${c.label}, ligne ${l.n}`} data-ia-fiche-val={`${l.n}:${c.id}`} />
              </Field>))}</div> : <p className="mt-1 text-sm text-ink2">{l.formulaire ? 'Opération à valider dans son formulaire (volumes et lots à vérifier).' : 'Case « fait » seulement.'}</p>}
            {l.kind === 'prev' ? iaFicheForm(db, l, e.vals, '', null).avert.map((a, i) => <div key={i} className="mt-1 text-sm text-warn" data-ia-fiche-avert={l.n}>{a}</div>) : null}
            <div className="mt-2"><TI value={e.remarque || ''} onChange={(v) => maj(l.n, { remarque: v })} placeholder="Remarque écrite sur la ligne" aria-label={`Remarque, ligne ${l.n}`} /></div>
          </div>); })}</div>
        {erreurs.length ? <Notice tone="bad" title="À corriger avant de valider">{erreurs.map((x, i) => <div key={i}>{x}</div>)}</Notice> : null}
        {lu.st.ignorees.length ? <p className="help">{`${lu.st.ignorees.length} élément(s) déjà validé(s) ou annulé(s), laissé(s) de côté`}</p> : null}
      </div>}
    </Sheet>
  );
}

function TabPrevisions() {
  const { nav } = useApp(); const items = [{ id: 'previsions', label: 'Opérations à réaliser' }, { id: 'fiches', label: 'Fiches imprimées' }, { id: 'modeles', label: 'Modèles de fiches' }];
  const [sub, setSub] = useState(items.some((i) => i.id === nav.sub) ? nav.sub : 'previsions');
  return <div><SubNav value={sub} onChange={setSub} items={items} />{sub === 'previsions' ? <PrevisionsView /> : sub === 'fiches' ? <FichesLogView /> : <ModelesView />}</div>;
}
TABS_REG.previsions = TabPrevisions;
