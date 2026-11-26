/* ============ SAISIE GROUPÉE SUR PLUSIEURS CUVES (0.29.0-alpha.1) ============
   Sélection de cuves (plan, cartes, liste) → sulfitage, levurage, collage, autre intrant, relevé densité / température ou changement
   de stade en une seule saisie : une opération par cuve (quantité = dose × volume de chaque cuve), reliées par op.groupe, corrigées,
   annulées ou imprimées ensemble (fiche multi-lignes). Planifiable : une opération à réaliser par cuve, validée ensuite en groupe. */
const groupeActionDe = (x) => { if (!x) return null; if (x.groupe && x.groupe.action && GROUPE_ACTIONS[x.groupe.action]) return x.groupe.action; const st = (x.f ? x.f.sousType : x.sousType) || ''; if (x.type === 'intrant') return GROUPE_ACTIONS[st] ? st : 'intrant'; return GROUPE_ACTIONS[x.type] ? x.type : null; };
const qteArrondie = (q, unite) => (q == null ? null : unite === 'kg' || unite === 'L' ? r3(q) : q >= 10 ? Math.round(q) : Math.round(q * 10) / 10);

// barre de la sélection multiple (onglet Cuverie)
function SelectionBar({ sel, setSel, conts, onAction, onEtiquettes, onFin }) {
  const { db, R, camp } = useApp(); const vol = sum(sel, (id) => R.contVol[id] || 0); const vides = sel.filter((id) => !(R.contVol[id] > 0.5)).length;
  const acts = ['sulfitage', 'levurage', 'collage', 'intrant', 'suivi', 'etape'];
  return (
    <div className="selbar" role="region" aria-label="Cuves sélectionnées" data-selbar="">
      <div className="wrap flex flex-wrap items-center gap-2">
        <b><span className="num">{sel.length}</span> <span>cuve(s) sélectionnée(s)</span></b><span className="num text-sm text-ink2">{fmtL(vol)}</span>{vides ? <Chip><span className="num">{vides}</span> <span>vide(s)</span></Chip> : null}
        <span className="flex flex-wrap gap-1">{acts.map((a) => <Btn key={a} size="sm" kind={a === 'sulfitage' ? 'primary' : undefined} disabled={!sel.length || camp.figee} onClick={() => onAction(a)}>{GROUPE_ACTIONS[a].sousType ? (opDef(db, a) || {}).label || GROUPE_ACTIONS[a].label : GROUPE_ACTIONS[a].label}</Btn>)}</span>
        <Btn size="sm" disabled={!sel.length} onClick={onEtiquettes}>🏷 Étiquettes QR</Btn>
        <span className="ml-auto flex flex-wrap gap-1"><Btn size="sm" kind="ghost" onClick={() => setSel(uniq([...sel, ...conts.filter((c) => c.statut !== 'archive').map((c) => c.id)]))}>Tout sélectionner</Btn><Btn size="sm" kind="ghost" disabled={!sel.length} onClick={() => setSel([])}>Vider</Btn><Btn size="sm" onClick={onFin}>Terminer</Btn></span>
      </div>
    </div>
  );
}

/* ---------- formulaire de saisie groupée ----------
   mode « nouveau » (cuves choisies), « corriger » (opérations d'un groupe), « valider » (opérations à réaliser d'un groupe) */
function GroupeForm({ action: a0, contIds, gid: gidCorr, prevGid, onClose, onFait }) {
  const { db, act, toast, defaultDate, moi, uid, openGroupe } = useApp();
  const anciens = gidCorr ? opsDuGroupe(db, gidCorr) : []; const prevs = prevGid ? prevsDuGroupe(db, prevGid).filter((p) => p.statut === 'prevue') : [];
  const mode = gidCorr ? 'corriger' : prevGid ? 'valider' : 'nouveau';
  const actionId = a0 || groupeActionDe(anciens[0]) || groupeActionDe(prevs[0]) || 'intrant'; const A = GROUPE_ACTIONS[actionId];
  const cat = opDef(db, A.sousType || A.type) || { id: A.type, base: A.type, label: A.label };
  const first = anciens[0] || null; const pf = prevs[0] ? prevs[0].f || {} : null;
  const [date, setDate] = useState((first && first.date) || (prevs[0] && prevs[0].date) || defaultDate);
  const exclus = anciens.map((o) => o.id);
  const Rd = useMemo(() => getR(exclus.length ? { ...db, ops: db.ops.filter((o) => !exclus.includes(o.id)) } : db, isoOK(date) ? date : undefined), [db, date]);
  const l0 = (first && (first.lignes || [])[0]) || (pf && (pf.lignes || [])[0]) || {};
  const [c, setC] = useState(() => ({ produitId: l0.produitId || '', arrivageId: l0.arrivageId || '', dose: '', motif: (first && first.motif) || (pf && pf.motif) || cat.motif || '',
    newStade: (first && first.newStade) || (pf && pf.newStade) || (cat.stadeAuto && cat.stadeAuto.actif && A.stade ? cat.stadeAuto.stade : ''), operateurs: (first && first.operateurs) || (pf && pf.operateurs) || (moi ? [moi] : []), notes: (first && first.notes) || (pf && pf.notes) || '' }));
  const setCc = (k, v) => setC((x) => ({ ...x, [k]: v }));
  const pr = c.produitId ? prodOf(db, c.produitId) : null; const unite = pr ? pr.unite : '';
  // lignes : une par portion (cuve · lot) ; changement de stade : une par lot
  const lignes = useMemo(() => {
    const L = [];
    if (mode === 'nouveau') (contIds || []).forEach((cid) => contParts(Rd, cid).filter((p) => p.vol > 0.5).sort((a, b) => (a.since < b.since ? -1 : 1)).forEach((p) => L.push({ cle: `${cid}|${p.lotId}`, contId: cid, portionId: p.portionId, lotId: p.lotId, vol: p.vol })));
    else if (mode === 'corriger') anciens.forEach((o) => { const p = Rd.portions[o.portionId]; const lotId = o.type === 'etape' ? o.lotId : p && p.lotId; const pc = p || Object.values(Rd.portions).find((x) => x.lotId === lotId && x.vol > 0); L.push({ cle: o.id, editId: o.id, contId: pc ? pc.contenantId : '', portionId: o.portionId || (pc ? pc.id : ''), lotId, vol: pc ? pc.vol : 0, op: o }); });
    else prevs.forEach((pv) => { const f = pv.f || {}; const p = Rd.portions[f.portionId]; const lotId = pv.type === 'etape' ? f.lotId : p && p.lotId; const pc = p || Object.values(Rd.portions).find((x) => x.lotId === lotId && x.vol > 0); L.push({ cle: pv.id, prevId: pv.id, contId: pc ? pc.contenantId : '', portionId: f.portionId || (pc ? pc.id : ''), lotId, vol: pc ? pc.vol : 0, f }); });
    if (A.stade) { const vu = new Set(); return L.filter((l) => { if (!l.lotId || vu.has(l.lotId)) return false; vu.add(l.lotId); return true; }); }
    return L;
  }, [Rd, mode]);
  const videsSel = mode === 'nouveau' ? (contIds || []).filter((cid) => !contParts(Rd, cid).some((p) => p.vol > 0.5)) : [];
  const [ov, setOv] = useState(() => { const o = {}; lignes.forEach((l) => { const src = l.op || l.f || null; const q = src && (src.lignes || [])[0] ? String(src.lignes[0].qty).replace('.', ',') : ''; o[l.cle] = { inclus: true, qty: q, dose: '', densite: src && hasNum(src.densite) ? String(src.densite).replace('.', ',') : '', tempC: src && hasNum(src.tempC) ? String(src.tempC).replace('.', ',') : '' }; }); return o; });
  const ovDe = (l) => ov[l.cle] || { inclus: true, qty: '', dose: '', densite: '', tempC: '' };
  const setOvL = (l, patch) => setOv((x) => ({ ...x, [l.cle]: { ...ovDe(l), ...patch } }));
  const doseL = (l) => { const o = ovDe(l); return hasNum(o.dose) ? o.dose : c.dose; };
  const qteL = (l) => { const o = ovDe(l); if (o.qty !== '' && hasNum(o.qty)) return num(o.qty); return qteArrondie(qteDeDose(doseL(l), unite, l.vol), unite); };
  const doseEff = (l) => { const q = qteL(l); return q != null && pr && l.vol > 0 ? doseHL(q, unite, l.vol) : null; };
  const titreL = (l) => `${contName(db, l.contId)} · ${(Rd.lots[l.lotId] || {}).code || ''}`;
  const inclus = lignes.filter((l) => ovDe(l).inclus);
  const arrs = pr ? db.arrivages.filter((a) => a.produitId === pr.id).map((a) => ({ a, rest: arrivalRest(Rd, a) })) : [];
  const totalQ = sum(inclus, (l) => qteL(l) || 0); const arrSel = arrs.find((x) => x.a.id === c.arrivageId);
  const prods = db.produits.filter((p) => p.actif !== false && ['oeno', 'aux'].includes(p.categorie)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const choisirProduit = (pid) => { const L = db.arrivages.filter((a) => a.produitId === pid).map((a) => ({ a, rest: arrivalRest(Rd, a) })).sort((x, y) => ((x.a.dluo || '9999') < (y.a.dluo || '9999') ? -1 : 1)); const f0 = L.find((x) => x.rest > 0) || L[0]; setC((x) => ({ ...x, produitId: pid, arrivageId: f0 ? f0.a.id : '' })); };
  // spécifications (mêmes règles que le formulaire d'une opération)
  const construire = () => {
    const out = []; const erreurs = []; const ignores = [];
    if (A.intrant && !c.produitId) return { erreurs: ['Choisissez le produit.'], out, ignores };
    if (A.stade && !c.newStade) return { erreurs: ['Choisissez le nouveau stade.'], out, ignores };
    inclus.forEach((l) => {
      const o = ovDe(l); const old = l.editId ? db.ops.find((x) => x.id === l.editId) : null;
      if (A.releve && !hasNum(o.densite) && !hasNum(o.tempC)) { ignores.push(`${titreL(l)} : aucun relevé`); return; }
      if (A.stade && (Rd.lots[l.lotId] || {}).stade === c.newStade) { ignores.push(`${titreL(l)} : déjà à ce stade`); return; }
      const f = opInit(A.type, old, db, date); f.date = date; f.sousType = A.sousType || (old ? old.sousType || '' : ''); f.operateurs = c.operateurs; f.notes = c.notes;
      if (!old) formulaireDefauts(db, cat.id, A.type, f, {});
      if (A.type !== 'etape') f.portionId = l.portionId;
      if (A.intrant) { const q = qteL(l); f.motif = c.motif; f.lignes = [{ produitId: c.produitId, arrivageId: c.arrivageId || '', qty: q == null ? '' : String(q) }, ...(old ? LGN(old.lignes).slice(1) : [])]; if (!old) f.prepUses = []; }
      if (A.releve) { f.motif = c.motif; f.densite = o.densite; f.tempC = o.tempC; if (!old) f.lignes = []; }
      if (A.stade) { f.lotId = l.lotId; f.newStade = c.newStade; }
      const b = buildSpec(A.type, f, db, Rd, old);
      if (b.error) erreurs.push(`${titreL(l)} : ${b.error}`); else out.push({ spec: { ...b.spec, groupe: { action: actionId } }, editId: l.editId || null, prevId: l.prevId || null, titre: titreL(l), f });
    });
    return { erreurs, out, ignores };
  };
  const C = construire(); const [essai, setEssai] = useState(false);
  const valider = () => {
    setEssai(true); if (C.erreurs.length) { toast(C.erreurs[0], 'bad'); return; } if (!C.out.length) { toast('Aucune ligne à enregistrer.', 'bad'); return; }
    let gidFait = null;
    const r = act((d) => {
      const gid = gidCorr || prevGid || groupeNouvelId(d); gidFait = gid;
      const r1 = opsGroupeEnregistrer(d, gid, C.out, exclus, { par: uid, maintenant: new Date().toISOString() }); if (!r1.ok) return r1;
      C.out.forEach((x, i) => { if (x.prevId) previsionStatut(d, x.prevId, 'realisee', r1.ids[i]); });
      return r1;
    }, `${C.out.length} opération(s) enregistrée(s) en une saisie groupée${C.ignores.length ? ` (${C.ignores.length} ligne(s) laissée(s) de côté)` : ''}.`);
    if (r && r.ok) { onClose(); if (onFait) onFait(); if (gidFait && openGroupe) openGroupe({ gid: gidFait }); }
  };
  const planifier = () => {
    if (!isoOK(date)) { toast('Choisissez la date prévue.', 'bad'); return; }
    const items = inclus.map((l) => { const x = C.out.find((y) => (y.prevId && y.prevId === l.prevId) || y.titre === titreL(l)); const o = ovDe(l); const f = x ? x.f : (() => { const f0 = opInit(A.type, null, db, date); f0.sousType = A.sousType; f0.portionId = l.portionId; f0.operateurs = c.operateurs; f0.motif = c.motif; if (A.intrant) f0.lignes = [{ produitId: c.produitId, arrivageId: c.arrivageId || '', qty: qteL(l) == null ? '' : String(qteL(l)) }]; if (A.stade) { f0.lotId = l.lotId; f0.newStade = c.newStade; } if (A.releve) { f0.densite = o.densite; f0.tempC = o.tempC; } return f0; })();
      let resume = ''; try { resume = x ? opSummary(db, Rd, x.spec) : ''; } catch (e) { resume = ''; }
      return { type: A.type, date, f: { ...f, date }, resume: resume || `${cat.label} · ${titreL(l)}`, notes: c.notes, editId: l.prevId || null, groupe: { action: actionId } }; });
    if (!items.length) { toast('Aucune cuve à planifier.', 'bad'); return; }
    let gidFait = null;
    const r = act((d) => { const gid = prevGid || groupeNouvelId(d); gidFait = gid; return previsionsGroupeEnregistrer(d, gid, items, prevs.map((p) => p.id)); }, `${items.length} opération(s) à réaliser planifiée(s) pour le ${fmtDate(date)} : imprimez la fiche du groupe pour l’équipe.`);
    if (r && r.ok) { onClose(); if (onFait) onFait(); if (gidFait && openGroupe) openGroupe({ gid: gidFait, prev: true }); }
  };
  const tous = lignes.length && lignes.every((l) => ovDe(l).inclus);
  const titre = mode === 'corriger' ? `Corriger la saisie groupée — ${cat.label}` : mode === 'valider' ? `Valider en groupe — ${cat.label}` : `Saisie groupée — ${cat.label}`;
  return (
    <FormSheet wide title={titre} sub={`${lignes.length} ligne(s) · ${uniq(lignes.map((l) => l.contId)).length} cuve(s)`} onClose={onClose} onSave={valider} saveLabel={`✓ Valider (${C.out.length})`}
      secondary={mode !== 'corriger' ? <Btn onClick={planifier} title="Une opération à réaliser par cuve, sans effet sur les stocks : imprimez la fiche, puis validez en groupe">📋 Planifier (à réaliser)</Btn> : null}>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <Field label="Date"><DI value={date} onChange={setDate} /></Field>
        <div><OperateursPicker value={c.operateurs} onChange={(v) => setCc('operateurs', v)} /></div>
        {A.intrant || A.releve ? <Field label={A.releve ? 'Objet (facultatif)' : 'Objet de l’ajout'}><TI value={c.motif} onChange={(v) => setCc('motif', v)} placeholder={A.releve ? 'Remontage, contrôle…' : ''} /></Field> : null}
        {A.stade ? <Field label="Nouveau stade"><SI plain value={c.newStade} onChange={(v) => setCc('newStade', v)} options={[{ value: '', label: 'Choisir…' }, ...stadeOptions(db)]} /></Field> : null}
      </div>
      {A.intrant ? <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        <Group label="Produit"><SI value={c.produitId} onChange={choisirProduit} placeholder="Produit…" options={prods.map((p) => ({ value: p.id, label: `${p.nom} (${p.unite})` }))} /></Group>
        <Group label="Lot fournisseur (arrivage)"><SI value={c.arrivageId} onChange={(v) => setCc('arrivageId', v)} placeholder={pr ? (arrs.length ? 'Lot fournisseur…' : 'Aucun arrivage') : '—'} options={arrs.map((x) => ({ value: x.a.id, label: `${x.a.numLot} · reste ${fmt(x.rest, 2)} ${unite}` }))} /></Group>
        <Field label={<>Dose{doseUnit(unite) ? <span translate="no"> ({doseUnit(unite)})</span> : null}</>} help="Commune à toutes les cuves (modifiable ligne par ligne) : la quantité de chaque cuve = dose × volume."><NI value={c.dose} onChange={(v) => setCc('dose', v)} placeholder="ex. 3" disabled={!pr || !doseUnit(unite)} /></Field>
      </div> : null}
      <div className="tblwrap"><table className="tbl" data-groupe-lignes="">
        <thead><tr><th><input type="checkbox" className="h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={!!tous} onChange={(e) => { const v = e.target.checked; const o = { ...ov }; lignes.forEach((l) => { o[l.cle] = { ...ovDe(l), inclus: v }; }); setOv(o); }} aria-label="Toutes les lignes" /></th><th>Cuve</th><th>Lot</th><th className="r">Volume</th>
          {A.intrant ? <><th className="r">Dose</th><th className="r">Quantité{unite ? <span translate="no"> ({unite})</span> : null}</th><th /></> : null}{A.releve ? <><th>Densité</th><th>Température (°C)</th></> : null}{A.stade ? <><th>Stade actuel</th><th>Nouveau stade</th></> : null}</tr></thead>
        <tbody>{lignes.map((l) => { const o = ovDe(l); const lot = Rd.lots[l.lotId] || {}; const rule = pr && pr.categorie !== 'sec' ? ruleFor(db, pr.id, lot.qualif) : null; const de = doseEff(l);
          const unauth = !!(pr && pr.categorie && pr.categorie !== 'sec' && !(rule && rule.autorise)); const over = !!(rule && rule.autorise && rule.doseMax != null && rule.doseMax !== '' && de != null && de > num(rule.doseMax) + 1e-9);
          return (<tr key={l.cle} className={!o.inclus ? 'opacity-50' : ''}>
            <td><input type="checkbox" className="h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={o.inclus} onChange={(e) => setOvL(l, { inclus: e.target.checked })} aria-label={`Inclure ${contName(db, l.contId)}`} /></td>
            <td translate="no"><b>{contName(db, l.contId)}</b></td><td translate="no">{lot.code || '—'}</td><td className="r num">{fmtL(l.vol)}</td>
            {A.intrant ? <><td className="r" style={{ minWidth: 90 }}><NI value={o.dose} onChange={(v) => setOvL(l, { dose: v, qty: '' })} placeholder={c.dose || '—'} aria-label={`Dose pour ${contName(db, l.contId)}`} disabled={!pr || !doseUnit(unite)} /></td>
              <td className="r" style={{ minWidth: 100 }}><NI value={o.qty !== '' ? o.qty : (qteL(l) != null ? String(qteL(l)).replace('.', ',') : '')} onChange={(v) => setOvL(l, { qty: v })} aria-label={`Quantité pour ${contName(db, l.contId)}`} /></td>
              <td>{de != null ? <Chip tone={over ? 'bad' : ''}>{doseTexte(de, unite)}</Chip> : null}{unauth ? <Chip tone="bad">non autorisé en {qLabel(lot.qualif)}</Chip> : null}</td></> : null}
            {A.releve ? <><td style={{ minWidth: 84 }}><NI value={o.densite} onChange={(v) => setOvL(l, { densite: v })} placeholder="1,012" aria-label={`Densité relevée — ${contName(db, l.contId)}`} /></td><td style={{ minWidth: 72 }}><NI value={o.tempC} onChange={(v) => setOvL(l, { tempC: v })} placeholder="18" aria-label={`Température relevée — ${contName(db, l.contId)}`} /></td></> : null}
            {A.stade ? <><td><StadeChip id={lot.stade} compact /></td><td>{c.newStade ? <StadeChip id={c.newStade} compact /> : '—'}</td></> : null}
          </tr>); })}</tbody>
        {A.intrant && pr ? <tfoot><tr><td colSpan={5} className="r"><b>Total</b></td><td className="r num"><b>{fmt(totalQ, unite === 'kg' || unite === 'L' ? 3 : 1)} {unite}</b></td><td>{arrSel && totalQ > arrSel.rest + 1e-6 ? <Chip tone="warn">dépasse le restant du lot fournisseur ({fmt(arrSel.rest, 2)} {unite})</Chip> : null}</td></tr></tfoot> : null}
      </table></div>
      {videsSel.length ? <p className="help">Cuve(s) vide(s) à cette date, laissée(s) de côté : <span translate="no">{videsSel.map((id) => contName(db, id)).join(', ')}</span>.</p> : null}
      {C.ignores.length && essai ? <p className="help">{C.ignores.length} ligne(s) laissée(s) de côté : <span translate="no">{C.ignores.join(' · ')}</span>.</p> : null}
      {C.erreurs.length && essai ? <Notice tone="bad" title="À corriger">{C.erreurs.slice(0, 4).map((x, i) => <div key={i}>{x}</div>)}</Notice> : null}
      <Field label="Notes (communes)"><TI value={c.notes} onChange={(v) => setCc('notes', v)} /></Field>
      <p className="help">Une opération est enregistrée par cuve, avec les mêmes contrôles qu’une saisie cuve par cuve (doses maximales, produits autorisés, stocks) ; elles restent reliées : correction, annulation et fiche à imprimer en une fois.</p>
    </FormSheet>
  );
}

// fiche d'un groupe : ses opérations (ou opérations à réaliser), corriger, annuler, imprimer
function GroupeSheet({ gid, onClose }) {
  const { db, R, act, confirm, openFiche, openGroupe, camp } = useApp();
  const ops = opsDuGroupe(db, gid); const prevs = prevsDuGroupe(db, gid); const prevue = prevs.filter((p) => p.statut === 'prevue');
  const x0 = ops[0] || prevs[0]; if (!x0) return <Sheet title="Saisie groupée" onClose={onClose}><Empty>Ce groupe n’existe plus (opérations supprimées ou annulées).</Empty></Sheet>;
  const a = groupeActionDe(x0); const cat = opDef(db, (GROUPE_ACTIONS[a] || {}).sousType || x0.type) || {}; const label = cat.label || opNom(x0);
  const annuler = async () => {
    if (ops.length) { if (!(await confirm({ title: 'Annuler toute la saisie groupée ?', body: `${ops.length} opération(s) du ${fmtDate(ops[0].date)} seront supprimées et les stocks recalculés.`, ok: 'Annuler le groupe', danger: true }))) return; const r = act((d) => opsGroupeSupprimer(d, gid, {}), 'Saisie groupée annulée.'); if (r && r.ok) onClose(); return; }
    if (!(await confirm({ title: 'Supprimer ces opérations à réaliser ?', body: `${prevs.length} opération(s) à réaliser (aucun effet sur les stocks).`, ok: 'Supprimer', danger: true }))) return;
    const r = act((d) => { prevs.forEach((p) => previsionDelete(d, p.id)); return okr(); }, 'Opérations à réaliser supprimées.'); if (r && r.ok) onClose();
  };
  const fiche = () => { const src = ops.length ? ops.map((o) => ({ kind: 'op', id: o.id })) : prevs.map((p) => ({ kind: 'prev', id: p.id })); onClose(); openFiche(src); };
  const rows = ops.length ? ops.map((o) => ({ id: o.id, date: o.date, conts: opConts(o, R), lots: opLots(o, R), text: opSummary(db, R, o), qui: o.operateurs, statut: null }))
    : prevs.map((p) => { const Rd = getR(db, p.date); const pp = Rd.portions[(p.f || {}).portionId]; return { id: p.id, date: p.date, conts: pp ? [pp.contenantId] : [], lots: pp ? [pp.lotId] : (p.f && p.f.lotId ? [p.f.lotId] : []), text: p.resume, qui: (p.f || {}).operateurs, statut: p.statut }; });
  return (
    <Sheet wide title={`Saisie groupée — ${label}`} sub={`${rows.length} cuve(s) · ${fmtDate(x0.date)}${ops.length ? '' : ' · à réaliser'}`} onClose={onClose}
      footer={<><Btn kind="danger" className="mr-auto" onClick={annuler} disabled={camp.figee && !!ops.length}>{ops.length ? 'Annuler le groupe' : 'Supprimer'}</Btn><Btn onClick={fiche}>🖨 Fiche multi-lignes</Btn>
        {ops.length ? <Btn kind="primary" disabled={camp.figee} onClick={() => { onClose(); openGroupe({ form: { gid } }); }}>✎ Corriger le groupe</Btn> : prevue.length ? <Btn kind="primary" onClick={() => { onClose(); openGroupe({ form: { prevGid: gid } }); }}>✓ Valider le groupe…</Btn> : null}</>}>
      <div onClickCapture={(e) => { if (e.target && e.target.closest && e.target.closest('.linkish')) onClose(); }}><Tbl rows={rows} cols={[{ h: 'Cuve', r: (r) => <span className="flex flex-wrap gap-x-2">{r.conts.map((cid) => <ContLink key={cid} id={cid} />)}</span> }, { h: 'Lot', r: (r) => <span className="flex flex-wrap gap-x-2">{r.lots.map((l) => <LotLink key={l} id={l} />)}</span> },
        { h: 'Détail', r: (r) => r.text || '—' }, { h: 'Opérateur(s)', r: (r) => <OperateursChips ids={r.qui} /> }, ...(ops.length ? [] : [{ h: 'Statut', r: (r) => <Chip tone={(PREV_STATUT[r.statut] || {}).tone}>{(PREV_STATUT[r.statut] || {}).label}</Chip> }])]} /></div>
      <p className="help mt-2">{ops.length ? 'Chaque opération reste visible dans le journal et sur la fiche de sa cuve ; corrigez-la seule depuis le journal, ou toutes ensemble ici.' : 'Imprimez la fiche multi-lignes pour l’équipe (valeurs prévues en gris, valeurs à relever en cases teintées), puis validez le groupe avec les quantités réelles.'}</p>
    </Sheet>
  );
}
// pastille « groupe » dans le journal et les opérations à réaliser
function GroupeChip({ x }) {
  const { openGroupe } = useApp(); if (!x || !x.groupe || !x.groupe.id) return null;
  return <button type="button" className="chip chip-info" style={{ cursor: 'pointer' }} data-groupe={x.groupe.id} onClick={(e) => { e.stopPropagation(); openGroupe({ gid: x.groupe.id, prev: !!x.f }); }} title="Saisie groupée : voir, corriger ou imprimer le groupe"><span>⛓ groupe</span>{x.groupe.nb ? <span className="num"> ({x.groupe.nb})</span> : null}</button>;
}
