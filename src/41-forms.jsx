/* ============ FORMULAIRES : éditeurs partagés (portions, intrants, pertes, préparations) ============ */

// Base de rejeu « avant l'opération éditée » à une date donnée
function useRd(db, date, editingId) {
  return useMemo(() => {
    const base = editingId ? { ...db, ops: db.ops.filter((o) => o.id !== editingId) } : db;
    return getR(base, isoOK(date) ? date : undefined);
  }, [db, date, editingId]);
}
function portionOptions(db, Rd, filter) {
  return Object.values(Rd.portions).filter((p) => !filter || filter(p)).sort((a, b) => contName(db, a.contenantId).localeCompare(contName(db, b.contenantId), 'fr', { numeric: true }))
    .map((p) => { const l = Rd.lots[p.lotId] || {}; return { value: p.id, label: `${contName(db, p.contenantId)} · ${l.code || '?'} · ${stadeCourt(db, l.stade)}${l.couleur && l.couleur !== couleurDefaut(db) ? ` ${couleurLabel(db, l.couleur).toLowerCase()}` : ''} · ${fmtL(p.vol)} · ${qDef(l.qualif).court}` }; });
}
const contOptions = (db, withArchived) => db.contenants.filter((c) => withArchived || c.statut !== 'archive').sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true })).map((c) => ({ value: c.id, label: `${c.nom} (${fmtL(c.volMax)})${c.statut === 'archive' ? ' – archivé' : ''}` }));

function PortionSelect({ db, Rd, value, onChange, filter, placeholder = 'Choisir la portion (cuve · lot · volume)…' }) {
  const o = portionOptions(db, Rd, filter);
  return <SI value={value} onChange={onChange} options={o} placeholder={placeholder} />;
}

/* ---------- lignes d'intrants (produit + lot fournisseur + quantité) ---------- */
function LignesEditor({ db, Rd, lignes, onChange, qualif, vol, cats, hideDose, addLabel = '+ Ajouter un intrant' }) {
  const prods = db.produits.filter((p) => p.actif !== false && (!cats || cats.includes(p.categorie))).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const arrivals = (pid) => db.arrivages.filter((a) => a.produitId === pid).map((a) => ({ a, rest: arrivalRest(Rd, a) })).sort((x, y) => (x.a.dluo || '9999') < (y.a.dluo || '9999') ? -1 : 1);
  const upd = (i, patch) => onChange(lignes.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const setProd = (i, pid) => { const first = arrivals(pid).find((x) => x.rest > 0) || arrivals(pid)[0]; upd(i, { produitId: pid, arrivageId: first ? first.a.id : '' }); };
  return (
    <div className="space-y-2">
      {lignes.map((l, i) => {
        const pr = prodOf(db, l.produitId); const arrs = l.produitId ? arrivals(l.produitId) : [];
        const dose = !hideDose && l.produitId && vol ? doseHL(l.qty, pr.unite, vol) : null;
        const rule = qualif && pr.categorie && pr.categorie !== 'sec' ? ruleFor(db, l.produitId, qualif) : null;
        const unauth = !!(qualif && pr.categorie && pr.categorie !== 'sec' && !(rule && rule.autorise));
        const over = !!(rule && rule.autorise && rule.doseMax != null && rule.doseMax !== '' && dose != null && dose > num(rule.doseMax));
        const sel = arrs.find((x) => x.a.id === l.arrivageId);
        const ds = sel ? dluoState(sel.a.dluo) : null;
        return (
          <div key={i} className="rounded-md border border-line p-2">
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
              <Group label="Produit"><SI value={l.produitId} onChange={(v) => setProd(i, v)} placeholder="Produit…" options={prods.map((p) => ({ value: p.id, label: `${p.nom} (${p.unite})` }))} /></Group>
              <Group label="Lot fournisseur (arrivage)"><SI value={l.arrivageId} onChange={(v) => upd(i, { arrivageId: v })} placeholder={l.produitId ? (arrs.length ? 'Lot fournisseur…' : 'Aucun arrivage') : '—'} options={arrs.map((x) => ({ value: x.a.id, label: `${x.a.numLot} · reste ${fmt(x.rest, 2)} ${pr.unite}${x.a.dluo ? ' · DLUO ' + fmtDate(x.a.dluo) : ''}` }))} /></Group>
              <Group label={`Quantité${pr.unite ? ` (${pr.unite})` : ''}`}><div className="flex gap-2"><NI value={l.qty} onChange={(v) => upd(i, { qty: v })} placeholder="0" /><Btn kind="danger" size="sm" aria-label="Retirer la ligne" onClick={() => onChange(lignes.filter((_, k) => k !== i))}>✕</Btn></div></Group>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              {dose != null && num(l.qty) > 0 ? <Chip tone={over ? 'bad' : ''}>{fmt(dose, 1)} {doseUnit(pr.unite)}{rule && rule.autorise && rule.doseMax != null && rule.doseMax !== '' ? ` / max ${fmt(rule.doseMax, 1)}` : ''}</Chip> : null}
              {unauth ? <Chip tone="bad">Non autorisé en {qLabel(qualif)} → alerte de déclassement</Chip> : null}
              {ds && ds.k !== 'ok' && ds.k !== 'none' ? <Chip className={ds.cls}>{ds.label}</Chip> : null}
              {sel && num(l.qty) > sel.rest + 1e-6 ? <Chip tone="warn">Dépasse le restant du lot</Chip> : null}
            </div>
          </div>
        );
      })}
      <Btn size="sm" onClick={() => onChange([...lignes, { produitId: '', arrivageId: '', qty: '' }])}>{addLabel}</Btn>
    </div>
  );
}
const cleanLignes = (l) => (l || []).filter((x) => x.produitId && num(x.qty) > 0).map((x) => ({ produitId: x.produitId, arrivageId: x.arrivageId || '', qty: num(x.qty) }));

/* ---------- pertes typées (bourbes, lies, …) ---------- */
function PertesEditor({ db, pertes, onChange, defaultType }) {
  const upd = (i, patch) => onChange(pertes.map((p, k) => (k === i ? { ...p, ...patch } : p)));
  return (
    <div className="space-y-2">
      {pertes.map((p, i) => (
        <div key={i} className="grid items-end gap-2" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) auto' }}>
          <Group label="Type de perte"><SI value={p.typeId} onChange={(v) => upd(i, { typeId: v })} options={opts(db, 'typesPerte')} /></Group>
          <Group label="Volume (hL)"><VI value={p.volL} onChange={(v) => upd(i, { volL: v })} placeholder="0" /></Group>
          <Btn kind="danger" size="sm" aria-label="Retirer la perte" onClick={() => onChange(pertes.filter((_, k) => k !== i))}>✕</Btn>
        </div>
      ))}
      <Btn size="sm" onClick={() => onChange([...pertes, { typeId: defaultType || (db.lists.typesPerte[0] || {}).id, volL: '' }])}>+ Ajouter une perte</Btn>
    </div>
  );
}
const cleanPertes = (p) => (p || []).filter((x) => num(x.volL) > 0).map((x) => ({ typeId: x.typeId, volL: num(x.volL) }));

/* ---------- préparations consommées (liqueur, levain, pied de cuve…) ---------- */
function PrepUsesEditor({ db, Rd, uses, onChange, types }) {
  const preps = Object.values(Rd.preps).filter((p) => (!types || types.includes(p.ptype)));
  const upd = (i, patch) => onChange(uses.map((u, k) => (k === i ? { ...u, ...patch } : u)));
  return (
    <div className="space-y-2">
      {uses.map((u, i) => (
        <div key={i} className="grid items-end gap-2" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) auto' }}>
          <Group label="Préparation"><SI value={u.prepId} onChange={(v) => upd(i, { prepId: v })} placeholder="Préparation…" options={preps.map((p) => ({ value: p.id, label: `${p.code} · ${PREP_TYPES[p.ptype]} · ${qDef(p.qualif).court} · reste ${fmtL(p.remaining)}` }))} /></Group>
          <Group label="Volume (hL)"><VI value={u.volL} onChange={(v) => upd(i, { volL: v })} placeholder="0" /></Group>
          <Btn kind="danger" size="sm" aria-label="Retirer" onClick={() => onChange(uses.filter((_, k) => k !== i))}>✕</Btn>
        </div>
      ))}
      <Btn size="sm" onClick={() => onChange([...uses, { prepId: '', volL: '' }])}>+ Ajouter une préparation</Btn>
      {!preps.length ? <div className="help">Aucune préparation disponible à cette date : créez-en dans l’onglet Tirage & Dégorgement.</div> : null}
    </div>
  );
}
const cleanPrepUses = (u) => (u || []).filter((x) => x.prepId && num(x.volL) > 0).map((x) => ({ prepId: x.prepId, volL: num(x.volL) }));

/* ---------- aperçu des avertissements / alertes avant enregistrement ---------- */
function PreviewBox({ pv }) {
  if (!pv) return null;
  if (!pv.ok) return <Notice tone="bad" title="Enregistrement impossible">{pv.msg}</Notice>;
  if (!pv.warnings.length && !pv.alerts.length) return <Notice tone="ok">Aucun avertissement : l’opération est cohérente avec les stocks et les règles.</Notice>;
  return (
    <div className="space-y-2">
      {pv.alerts.length ? <Notice tone="bad" title="Alerte de déclassement à valider (jamais appliquée automatiquement)"><ul className="list-disc pl-5">{pv.alerts.map((a) => <li key={a.id}>{a.motif} : {qLabel(a.from)} → {qLabel(a.to)}</li>)}</ul><div className="mt-1 text-xs">Vous la validerez dans l’onglet « Déclassements ».</div></Notice> : null}
      {pv.warnings.length ? <Notice title="Avertissements non bloquants (l’opération sera marquée « à vérifier »)"><ul className="list-disc pl-5">{pv.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></Notice> : null}
    </div>
  );
}

/* ---------- petit formulaire en feuille : enveloppe commune ---------- */
// Une fiche ouverte depuis un formulaire (nouveau cru, nouvel apporteur, nouvel opérateur…) est rendue hors du formulaire
// parent (portail) : sinon les formulaires seraient imbriqués et « Entrée » rechargerait la page au lieu d'enregistrer.
const FormDepth = createContext(0);
function FormSheet({ title, sub, onClose, onSave, saveLabel = 'Enregistrer', saveTitle, children, wide, extraFooter, secondary, disabled, readOnly }) {
  const depth = useContext(FormDepth);
  const sheet = ( // readOnly : consultation (droits insuffisants) — pas d'enregistrement
    <Sheet title={title} sub={sub} onClose={onClose} wide={wide} footer={readOnly ? <>{extraFooter}<Btn kind="primary" onClick={onClose}>Fermer</Btn></> : <>{extraFooter}<Btn onClick={onClose}>Annuler</Btn>{secondary}<Btn kind="primary" onClick={onSave} disabled={disabled} title={saveTitle}>{saveLabel}</Btn></>}>
      <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); if (!readOnly) onSave(); }} className="space-y-4">{children}<button type="submit" hidden /></form>
    </Sheet>
  );
  return <FormDepth.Provider value={depth + 1}>{depth && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal ? ReactDOM.createPortal(sheet, document.body) : sheet}</FormDepth.Provider>;
}
