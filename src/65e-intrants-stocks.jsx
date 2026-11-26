/* ============ INTRANTS (0.36.0-alpha.1) : régularisations de stock, historique des mouvements, allergènes et revendications Oui / Non
   sur la fiche du produit, fiche récapitulative à colonnes choisies (impression, PDF, CSV) — aussi pour les produits de maintenance.
   Moteur : 16p-intrants-stocks.js, 16q-produits-maintenance.js. */

// choix explicite Oui / Non (value : 'oui' | 'non' | '' ; ou booléen avec bool)
function OuiNon({ value, onChange, label, bool, vide }) {
  const v = bool ? (value ? 'oui' : 'non') : value || '';
  const b = (x, t) => <button type="button" className={cx('btn btn-sm', v === x && (x === 'oui' ? 'btn-primary' : 'btn-danger'))} aria-pressed={v === x} onClick={() => onChange(bool ? x === 'oui' : v === x && vide ? '' : x)} data-oui-non={x}>{t}</button>;
  return <span className="inline-flex items-center gap-1" role="group" aria-label={label}>{b('oui', 'Oui')}{b('non', 'Non')}</span>;
}
// allergènes à cocher, « aucun allergène », suggestions lues dans la fiche (nom, famille, composition)
function AllergenesChoix({ liste, aucun, onChange, suggestions }) {
  const L = liste || []; const tog = (id) => { const n = L.includes(id) ? L.filter((x) => x !== id) : [...L, id]; onChange(n, n.length ? false : aucun); };
  const sug = (suggestions || []).filter((x) => !L.includes(x));
  return (
    <div data-allergenes="">
      <div className="flex flex-wrap gap-x-4 gap-y-1">{ALLERGENES.map(([id, lab]) => <Check key={id} checked={L.includes(id)} onChange={() => tog(id)} label={lab} />)}</div>
      <div className="mt-1"><Check checked={!!aucun && !L.length} disabled={!!L.length} onChange={(c) => onChange(L, c)} label="Aucun allergène (déclaré par le fournisseur)" /></div>
      {sug.length ? <div className="mt-1 flex flex-wrap items-center gap-1 text-xs" data-allergenes-suggeres=""><span className="text-ink2">Repérés dans la fiche :</span>{sug.map((x) => <Btn key={x} size="sm" onClick={() => onChange([...L, x], false)}>+ {allergeneCourt(x)}</Btn>)}</div> : null}
    </div>
  );
}
// revendications (bio, Demeter, personnalisées) : Oui / Non = règle du produit (onglet « Produits & règles par revendication »)
function RevendicationsChoix({ p, value, onChange }) {
  const { db } = useApp(); const Q = revendicationsFiche(db, p);
  if (!Q.length) return <p className="help">Aucune revendication autre que « Conventionnel » : ajoutez-en dans Paramètres › Listes.</p>;
  return (
    <div className="space-y-1" data-revendications-choix="">
      {Q.map((q) => { const r = p ? ruleFor(db, p.id, q.id) : null; const v = value[q.id] !== undefined ? value[q.id] : revChoix(db, p, q.id); return (
        <div key={q.id} className="flex flex-wrap items-center gap-2 text-sm" data-rev={q.id}><span className="min-w-0" style={{ minWidth: 190 }}><span>Utilisable en</span> <QChip id={q.id} /></span>
          <OuiNon bool value={v} onChange={(x) => onChange({ ...value, [q.id]: x })} label={`Utilisable en ${q.label}`} />
          {r && r.aVerifier && value[q.id] === undefined ? <Chip tone="warn" title={r.source || ''}>{/lu dans/.test(r.source || '') ? 'lu dans un document : à vérifier' : 'exemple à vérifier'}</Chip> : null}</div>); })}
    </div>
  );
}

/* ---------- régularisation manuelle d'un lot fournisseur ---------- */
function RegulForm({ id, arrivageId0, produitId0, onClose }) {
  const { db, act, uid, defaultDate } = useApp(); const x = id ? regulsDe(db).find((y) => y.id === id) : null;
  const a0 = arrivageId0 ? db.arrivages.find((a) => a.id === arrivageId0) : null;
  const [f, set, setF] = useDraft({ produitId: x ? x.produitId : a0 ? a0.produitId : produitId0 || '', arrivageId: x ? x.arrivageId : arrivageId0 || '', date: x ? x.date : defaultDate, mode: x && x.compte != null ? 'compte' : x ? 'ecart' : 'compte', motif: x ? x.motif : 'inventaire', qty: x ? String(x.qty).replace('.', ',') : '', compte: x && x.compte != null ? String(x.compte).replace('.', ',') : '', notes: x ? x.notes || '' : '' });
  const pr = prodOf(db, f.produitId); const lots = db.arrivages.filter((a) => a.produitId === f.produitId).sort((p, q) => (p.date < q.date ? 1 : -1));
  const rest = useMemo(() => (f.arrivageId && isoOK(f.date) ? regulRestant(db, f.arrivageId, f.date, id || null) : null), [db, f.arrivageId, f.date, id]);
  const retire = ['casse', 'perte', 'peremption', 'echantillon', 'retour'].includes(f.motif);
  const ecart = rest == null ? null : f.mode === 'compte' ? (hasNum(f.compte) ? num(f.compte) - rest : null) : hasNum(f.qty) ? (retire ? -Math.abs(num(f.qty)) : num(f.qty)) : null;
  const save = () => { const r = act((d) => regulSave(d, f, id, uid), id ? 'Régularisation modifiée.' : 'Régularisation enregistrée dans l’historique des mouvements.'); if (r && r.ok) onClose(); };
  return (
    <FormSheet title={id ? 'Modifier la régularisation' : 'Régulariser le stock'} sub="Inventaire, casse, perte, écart… : la quantité corrige le restant du lot fournisseur et reste tracée dans l’historique des mouvements." onClose={onClose} onSave={save}>
      <G><Field label="Produit"><SI value={f.produitId} onChange={(v) => setF((y) => ({ ...y, produitId: v, arrivageId: (db.arrivages.find((a) => a.produitId === v) || {}).id || '' }))} placeholder="Produit…" options={db.produits.slice().sort((p, q) => p.nom.localeCompare(q.nom, 'fr')).map((p) => ({ value: p.id, label: `${p.nom} (${p.unite})` }))} aria-label="Produit à régulariser" /></Field>
        <Field label="Lot fournisseur"><SI value={f.arrivageId} onChange={(v) => set('arrivageId', v)} placeholder="Lot…" options={lots.map((a) => ({ value: a.id, label: `${a.numLot} — reçu le ${fmtDate(a.date)}` }))} aria-label="Lot fournisseur à régulariser" /></Field></G>
      <G><Field label="Date"><DI value={f.date} onChange={(v) => set('date', v)} aria-label="Date de la régularisation" /></Field>
        <Field label="Motif"><SI value={f.motif} onChange={(v) => setF((y) => ({ ...y, motif: v, mode: v === 'inventaire' ? 'compte' : y.mode === 'compte' ? 'ecart' : y.mode }))} options={REGUL_MOTIFS.map(([k, l]) => ({ value: k, label: l }))} aria-label="Motif de la régularisation" /></Field></G>
      <Group label="Saisie"><div className="flex flex-wrap gap-3"><Check checked={f.mode === 'compte'} onChange={() => set('mode', 'compte')} label="Quantité comptée (inventaire physique)" /><Check checked={f.mode === 'ecart'} onChange={() => set('mode', 'ecart')} label="Écart constaté (+ entrée, − sortie)" /></div></Group>
      {f.mode === 'compte' ? <Field label={`Quantité comptée${pr.unite ? ` (${pr.unite})` : ''}`}><NI value={f.compte} onChange={(v) => set('compte', v)} aria-label="Quantité comptée" /></Field>
        : <Field label={`Quantité${pr.unite ? ` (${pr.unite})` : ''}`} help={retire ? 'Ce motif retire la quantité du stock.' : 'Négative pour une sortie, positive pour une entrée.'}><NI value={f.qty} onChange={(v) => set('qty', v)} aria-label="Quantité de la régularisation" /></Field>}
      <Field label="Notes (raison, constat)"><TA value={f.notes} onChange={(v) => set('notes', v)} rows={2} aria-label="Notes de la régularisation" /></Field>
      {rest != null ? <div className="rounded-md border border-line px-3 py-2 text-sm" data-regul-apercu=""><span>Restant au</span> <span className="num">{fmtDate(f.date)}</span> : <b className="num" translate="no">{fmt(rest, 2)} {pr.unite}</b>
        {ecart != null ? <> → <span>après régularisation :</span> <b className={cx('num', rest + ecart < -1e-6 && 'text-bad')} translate="no">{fmt(rest + ecart, 2)} {pr.unite}</b> <span className="num" translate="no">({ecart > 0 ? '+' : ''}{fmt(ecart, 2)})</span></> : null}</div> : null}
    </FormSheet>
  );
}
// historique des mouvements d'un produit : réceptions, utilisations, régularisations, solde
function MouvementsView({ produitId0, onRegul }) {
  const { db, R, act, confirm } = useApp(); const [pid, setPid] = useState(produitId0 || ((db.produits.slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))[0]) || {}).id || '');
  const pr = prodOf(db, pid); const M = useMemo(() => (pid ? intrantMouvements(db, R, { produitId: pid }) : []), [db, R, pid]);
  const del = async (m) => { if (await confirm({ title: 'Supprimer cette régularisation ?', body: `${m.libelle} — ${fmtDate(m.date)}.`, ok: 'Supprimer', danger: true })) act((d) => regulDelete(d, m.id), 'Régularisation supprimée.'); };
  return (
    <div data-mouvements="">
      <div className="mb-3 flex flex-wrap items-center gap-2"><SI value={pid} onChange={setPid} style={{ minWidth: 260 }} options={db.produits.slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map((p) => ({ value: p.id, label: p.nom }))} aria-label="Produit de l’historique" /><span className="ml-auto" /><Btn kind="primary" disabled={!pid} onClick={() => onRegul({ produitId: pid })}>± Régulariser le stock</Btn></div>
      <Tbl rows={M.map((m, i) => ({ ...m, id: `${m.type}-${m.id || m.opId}-${i}` }))} empty="Aucun mouvement pour ce produit." cols={[
        { h: 'Date', r: (m) => <span className="num">{fmtDate(m.date)}</span> }, { h: 'Lot fournisseur', r: (m) => <span className="num" translate="no">{m.numLot}</span> },
        { h: 'Mouvement', r: (m) => <span data-mouvement={m.type}>{m.type === 'regul' ? <Chip tone="warn">±</Chip> : null} {m.libelle}</span> }, { h: 'Détail', r: (m) => <span className="text-xs" translate="no">{m.detail}</span> },
        { h: 'Quantité', cls: 'r', r: (m) => <span className={cx('num', m.qty < 0 && 'text-bad')}>{m.qty > 0 ? '+' : ''}{fmt(m.qty, 2)} {pr.unite}</span> }, { h: 'Solde', cls: 'r', r: (m) => <b className="num">{fmt(m.solde, 2)}</b> },
        { h: '', r: (m) => (m.type !== 'regul' ? null : isLocked(db, m.date) ? <Chip>🔒 figée</Chip> : <span className="flex gap-1"><Btn size="sm" onClick={() => onRegul({ id: m.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => del(m)} aria-label="Supprimer la régularisation">✕</Btn></span>) }]} />
    </div>
  );
}

/* ---------- fiche récapitulative : colonnes au choix, aperçu, impression, PDF, HTML, CSV ---------- */
const recapLu = (cle, defaut) => { try { const v = JSON.parse(window.localStorage.getItem(`oenotrack-recap-${cle}`) || 'null'); if (Array.isArray(v) && v.length) return v; } catch (e) { /* ignoré */ } return defaut; };
const recapGarde = (cle, v) => { try { window.localStorage.setItem(`oenotrack-recap-${cle}`, JSON.stringify(v)); } catch (e) { /* ignoré */ } };
function RecapSheet({ cle, titre, colonnes, defaut, calcul, filtres, nomFichier, onClose }) {
  const { toast } = useApp(); const ref = useRef(null);
  const [cols, setCols0] = useState(() => recapLu(cle, defaut).filter((k) => colonnes.some((c) => c[0] === k)));
  const setCols = (v) => { setCols0(v); recapGarde(cle, v); };
  const T = calcul(cols); const paysage = cols.length > 6;
  const out = useReportOutput(ref, `${nomFichier}-${todayISO()}`, { orientation: paysage ? 'paysage' : 'portrait' });
  const csv = async () => { const r = await saveFile(`${nomFichier}-${todayISO()}.csv`, recapCsv(T, (h) => traduire(h)), 'text/csv'); if (r.ok) toast('Fichier CSV enregistré.'); else if (!r.declined) toast(failMsg(r), 'bad'); };
  const tog = (k) => setCols(cols.includes(k) ? cols.filter((x) => x !== k) : colonnes.map((c) => c[0]).filter((x) => x === k || cols.includes(x)));
  const th = { textAlign: 'left', fontSize: 10, verticalAlign: 'bottom' }; const td = { fontSize: 10, verticalAlign: 'top' };
  return (
    <Sheet wide title={titre} sub="Choisissez les colonnes à inclure, puis imprimez ou téléchargez (PDF, CSV)." onClose={onClose}
      footer={<><Btn onClick={onClose} className="mr-auto">Fermer</Btn><Btn onClick={csv} disabled={!cols.length} data-recap-csv="">⬇ CSV</Btn><BoutonsSortie out={out} /></>}>
      <div className="mb-3 rounded-md border border-line p-3" data-recap-colonnes="">
        <div className="mb-1 flex flex-wrap items-center gap-2"><b className="text-sm">Colonnes</b><span className="text-xs text-ink2">{cols.length} / {colonnes.length}</span><span className="ml-auto flex gap-1"><Btn size="sm" onClick={() => setCols(colonnes.map((c) => c[0]))}>Tout</Btn><Btn size="sm" onClick={() => setCols(defaut)}>Par défaut</Btn></span></div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">{colonnes.map(([k, lab]) => <Check key={k} checked={cols.includes(k)} onChange={() => tog(k)} label={lab} />)}</div>
        {filtres ? <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-2">{filtres}</div> : null}
      </div>
      {!cols.length ? <Empty>Cochez au moins une colonne.</Empty> : (
        <div className="fiche-scroll"><div ref={ref} className="report" data-recap={cle}><ReportHead title={titre} sub={`${T.lignes.length} produit${T.lignes.length > 1 ? 's' : ''}`} />
          <table><thead><tr>{T.entetes.map((h) => <th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{T.lignes.map((l) => <tr key={l.id}>{l.cells.map((c, i) => <td key={i} style={td} translate={['nom', 'fournisseur', 'fabricant', 'reference', 'lots', 'composition', 'notes', 'champs', 'usage', 'stockage', 'conservation', 'dose', 'so2', 'stock', 'seuil'].includes(T.cles[i]) ? 'no' : undefined}>{c === '' || c == null ? '—' : c}</td>)}</tr>)}</tbody></table>
          {!T.lignes.length ? <p className="muted">Aucun produit pour ces critères.</p> : null}
          <p className="muted" style={{ fontSize: 9, marginTop: 8 }}>Revendications, allergènes et contact alimentaire : d’après les fiches des produits et les documents des fournisseurs, à vérifier.</p></div></div>)}
    </Sheet>
  );
}
function RecapIntrantsSheet({ onClose }) {
  const { db, R } = useApp(); const [o, setO] = useState({ inactifs: false, enStock: false });
  return <RecapSheet cle="intrants" titre="Fiche récapitulative des produits œnologiques" nomFichier="produits-oenologiques" colonnes={RECAP_INTRANTS_COLS} defaut={RECAP_INTRANTS_DEFAUT} onClose={onClose}
    calcul={(cols) => recapIntrants(db, R, cols, o)} filtres={<><Check checked={o.enStock} onChange={(v) => setO({ ...o, enStock: v })} label="En stock seulement" /><Check checked={o.inactifs} onChange={(v) => setO({ ...o, inactifs: v })} label="Inclure les produits inactifs" /></>} />;
}
