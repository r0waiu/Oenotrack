/* ============ FICHIER DE TRAÇABILITÉ DES EXPÉDITIONS : export, import à l'entrée, affichage (0.27.0-alpha.1) ============
   Moteur : 16g-trace-fichier.js. Export depuis le journal (📤 sur une sortie vers un partenaire) ou juste après l'enregistrement de
   l'expédition ; import dans les formulaires d'entrée de moût et de vin (fichier vérifié par la garde des importations) ;
   traçabilité amont affichée dans le journal (📥) et sur la fiche des lots. */
const TRACE_SECTIONS_KEY = 'oenotrack-trace-sections';
const traceSectionsLues = () => { try { const v = JSON.parse(window.localStorage.getItem(TRACE_SECTIONS_KEY) || 'null'); return Array.isArray(v) ? v.filter((s) => TRACE_SECTIONS.some((x) => x.id === s)) : traceSectionsDefaut(); } catch (e) { return traceSectionsDefaut(); } };
const traceSectionsGarder = (L) => { try { window.localStorage.setItem(TRACE_SECTIONS_KEY, JSON.stringify(L)); } catch (e) { /* ignoré */ } };
const tracePctTexte = (L) => (L || []).map((x) => `${x.nom} ${String(x.pct).replace('.', ',')} %`).join(' · ');

function TraceExportSheet({ opId, onClose }) {
  const { db, act, toast } = useApp(); const op = db.ops.find((o) => o.id === opId);
  const [S, setS] = useState(traceSectionsLues); const [busy, setBusy] = useState(false);
  const x = useMemo(() => (op ? traceExport(db, opId, S) : null), [db, opId, S]);
  const basculer = (id, v) => setS((L) => { const n = v ? uniq([...L, id]) : L.filter((s) => s !== id); traceSectionsGarder(n); return n; });
  const telecharger = async () => {
    if (!x || !x.ok) return; setBusy(true);
    try {
      const texte = JSON.stringify(x.data, null, 1); const r = await saveFile(x.nom, new Blob([texte], { type: 'application/json' }), 'application/json');
      if (r.ok) { act((d) => traceExportNoter(d, opId, { sections: x.data.sections, empreinte: x.data.empreinte }), `Fichier de traçabilité enregistré : ${x.nom}. Transmettez-le au destinataire avec le moût ou le vin.`); onClose(); }
      else if (r.declined) toast('Export annulé.'); else toast(failMsg(r), 'bad');
    } catch (e) { toast('Export impossible.', 'bad'); }
    setBusy(false);
  };
  if (!op) return <Sheet title="Expédition introuvable" onClose={onClose}><Empty>Cette opération n’existe plus.</Empty></Sheet>;
  const d = x && x.ok ? x.data : null; const deja = (op.traceExports || []).slice(-1)[0];
  return (
    <Sheet wide title="📤 Fichier de traçabilité pour le destinataire" sub={`${opNom(op)} du ${fmtDate(op.date)}${op.destinataire ? ` — ${op.destinataire}` : ''}`} onClose={onClose}
      footer={<><Btn onClick={onClose}>Fermer</Btn><Btn kind="primary" onClick={telecharger} disabled={busy || !d}>{busy ? 'Enregistrement…' : '⬇ Télécharger le fichier'}</Btn></>}>
      <div className="space-y-4" data-trace-export="">
        {x && !x.ok ? <Notice tone="bad">{x.msg}</Notice> : null}
        <p className="text-sm">Le destinataire dépose ce fichier dans son entrée de moût ou de vin (Œnotrack) : la traçabilité d’avant la réception est gardée chez lui. Choisissez ce que vous partagez — le produit et l’expédition sont toujours inclus, jamais les opérateurs.</p>
        <Group label="Données partagées"><div className="grid gap-x-4 gap-y-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
          {TRACE_SECTIONS.map((s) => <Check key={s.id} checked={S.includes(s.id)} onChange={(v) => basculer(s.id, v)} label={s.label} />)}</div>
          <div className="mt-2 flex flex-wrap gap-2"><Btn size="sm" kind="ghost" onClick={() => { const n = traceSectionsDefaut(); traceSectionsGarder(n); setS(n); }}>Choix conseillé</Btn><Btn size="sm" kind="ghost" onClick={() => { traceSectionsGarder([]); setS([]); }}>Le minimum (produit et expédition)</Btn><Btn size="sm" kind="ghost" onClick={() => { const n = TRACE_SECTIONS.map((t) => t.id); traceSectionsGarder(n); setS(n); }}>Tout partager</Btn></div></Group>
        {d ? <TraceAmontVue rec={d} titre="Aperçu du fichier" ouvert /> : null}
        {deja ? <p className="help">Dernier fichier exporté pour cette expédition le {fmtQuand(deja.le)}.</p> : null}
      </div>
    </Sheet>
  );
}

// contenu d'un fichier de traçabilité (aperçu à l'export, traçabilité amont reçue)
function TraceAmontVue({ rec, titre, ouvert, niveau = 0 }) {
  const [plus, setPlus] = useState(!!ouvert); const P = rec.produit || {}; const E = rec.expedition || {}; const ex = rec.expediteur || {};
  const Ligne = ({ l, children }) => (children ? <div className="flex flex-wrap gap-x-2 text-sm"><span className="text-ink2">{l}</span><span className="min-w-0">{children}</span></div> : null);
  return (
    <div className={cx('card space-y-2 p-3', niveau && 'ml-3')} data-trace-amont={P.lot || ''}>
      <div className="flex flex-wrap items-center gap-2"><b>{titre || `📥 ${ex.nom || 'Expéditeur non précisé'}`}</b><Chip>{P.designation || P.lot || 'produit'}</Chip>{P.lot ? <Chip title="Lot chez l’expéditeur">{`lot ${P.lot}`}</Chip> : null}
        {rec.integre === true ? <Chip tone="ok" title="Empreinte vérifiée : le fichier n’a pas été modifié depuis son export">✓ fichier intact</Chip> : rec.integre === false ? <Chip tone="warn" title="L’empreinte ne correspond pas : le fichier a été modifié après son export">⚠ fichier modifié après l’export</Chip> : null}
        <button type="button" className="linkish ml-auto text-sm" onClick={() => setPlus(!plus)} aria-expanded={plus}>{plus ? 'Masquer le détail' : 'Voir le détail'}</button></div>
      <div className="text-sm">{[E.date ? `expédié le ${fmtDate(E.date)}` : '', E.volumeL != null ? fmtL(E.volumeL) : '', E.ref ? (/^(?:DAE|DSA|DSAC|DAA)\b/i.test(E.ref) ? E.ref : `DAE / DSA ${E.ref}`) : '', P.nature === 'mout' ? 'moût' : P.nature === 'bouteilles' ? 'bouteilles' : 'vin', P.millesime, P.revendication].filter(Boolean).join(' · ')}</div>
      {plus ? (<div className="space-y-1">
        <Ligne l="Expéditeur">{[ex.nom, ex.adresse].filter(Boolean).join(' — ')}</Ligne>
        <Ligne l="Produit">{[P.type, P.stade, P.couleur].filter(Boolean).join(' · ')}</Ligne>
        {rec.composition ? <><Ligne l="Cépages">{tracePctTexte(rec.composition.cepages)}</Ligne><Ligne l="Millésimes">{tracePctTexte(rec.composition.millesimes)}</Ligne><Ligne l="Fractions">{tracePctTexte(rec.composition.fractions)}</Ligne><Ligne l="Revendications">{tracePctTexte(rec.composition.revendications)}</Ligne></> : null}
        {rec.crus ? <><Ligne l="Crus">{tracePctTexte(rec.crus.crus)}</Ligne><Ligne l="Échelle des crus">{tracePctTexte(rec.crus.echelles)}</Ligne></> : null}
        <Ligne l="Apporteurs">{tracePctTexte(rec.apporteurs)}</Ligne><Ligne l="Parcelles">{tracePctTexte(rec.parcelles)}</Ligne>
        {(rec.intrants || []).length ? <div><div className="lbl mt-2">Intrants ({rec.intrants.length})</div><ul className="list-disc pl-5 text-sm">{rec.intrants.map((i, k) => <li key={k}>{`${i.produit}${i.quantite != null ? ` — ${fmt(i.quantite, 2)} ${i.unite}` : ''}${i.lotFournisseur ? ` · lot ${i.lotFournisseur}` : ''}${i.allergenes ? ` · allergènes : ${i.allergenes}` : ''}`}</li>)}</ul></div> : null}
        {(rec.analyses || []).length ? <div><div className="lbl mt-2">Analyses ({rec.analyses.length})</div><ul className="list-disc pl-5 text-sm">{rec.analyses.slice(0, 12).map((a, k) => <li key={k}><span className="num">{fmtDate(a.date)}</span>{a.lot ? ` · ${a.lot}` : ''} — {a.valeurs.map((v) => `${v.nom} ${String(v.valeur).replace('.', ',')}${v.unite ? ` ${v.unite}` : ''}`).join(' · ')}</li>)}</ul></div> : null}
        {(rec.historique || []).length ? <div><div className="lbl mt-2">{rec.historique.length > 1 ? `Historique (${rec.historique.length} opérations)` : 'Historique (1 opération)'}</div><ul className="list-disc pl-5 text-sm">{rec.historique.slice(-15).map((h, k) => <li key={k}>{`${fmtDate(h.date)} — ${h.operation}${(h.lots || []).length ? ` · ${h.lots.join(', ')}` : ''}${(h.contenants || []).length ? ` · ${h.contenants.join(', ')}` : ''}`}</li>)}</ul>{rec.historique.length > 15 ? <p className="help">… et {rec.historique.length - 15} opérations plus anciennes.</p> : null}</div> : null}
        {(rec.amont || []).length ? <div><div className="lbl mt-2">Avant l’expéditeur ({rec.amont.length})</div><div className="space-y-2">{rec.amont.map((a, k) => <TraceAmontVue key={k} rec={a} niveau={niveau + 1} />)}</div></div> : null}
        {rec.sections ? <p className="help">Données partagées par l’expéditeur : {rec.sections.length ? rec.sections.map((s) => ((TRACE_SECTIONS.find((t) => t.id === s) || {}).label || s).split(' :')[0]).join(', ') : 'produit et expédition seulement'}.</p> : null}
      </div>) : null}
    </div>
  );
}
function TraceAmontSheet({ opId, onClose }) {
  const { db } = useApp(); const op = db.ops.find((o) => o.id === opId); const A = op && Array.isArray(op.amont) ? op.amont : [];
  return (<Sheet wide title="📥 Traçabilité amont (avant la réception)" sub={op ? `${opNom(op)} du ${fmtDate(op.date)}` : ''} onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Fermer</Btn>}>
    {A.length ? <div className="space-y-3">{A.map((r, k) => <div key={k}><TraceAmontVue rec={r} ouvert={A.length === 1} /><p className="help mt-1">Fichier « {r.fichier} » reçu le {fmtQuand(r.recuLe)}.</p></div>)}</div> : <Empty>Aucun fichier de traçabilité pour cette entrée.</Empty>}
  </Sheet>);
}

// formulaires d'entrée (moût, vin) : dépôt du fichier de l'expéditeur, préremplissage, traçabilité gardée avec l'entrée
function TraceImport({ type, f, setF }) {
  const { db, toast } = useApp(); const journal = useGardeJournal(); const [info, setInfo] = useState(null); const [creer, setCreer] = useState(null); const A = Array.isArray(f.amont) ? f.amont : [];
  const lire = async (fs) => {
    const file = fs[0]; if (!file) return; let texte = ''; try { texte = await lectureFichier(file); } catch (e) { toast('Lecture du fichier impossible.', 'bad'); return; }
    const r = traceLire(texte); if (!r.ok) { toast(`🛡 « ${gardeNomPropre(file.name)} » : ${r.msg}`, 'bad'); journal({ statut: 'refuse', usage: 'tracabilite', nom: file.name, taille: file.size, raisons: [r.msg] }); return; }
    if (!r.integre) journal({ statut: 'averti', usage: 'tracabilite', nom: file.name, taille: file.size, raisons: ['empreinte différente : fichier modifié après son export'] });
    const rec = traceAmontRec(r.data, file.name, r.integre); const v = traceVersEntree(db, r.data, type);
    setF((x) => {
      const n = { ...x, amont: [...(Array.isArray(x.amont) ? x.amont : []).filter((a) => !(a.empreinte === rec.empreinte && a.integre === rec.integre)), rec] }; // même fichier redéposé : remplacé ; copie modifiée : gardée à part, signalée
      Object.keys(v.preset).forEach((k) => { const cur = x[k]; if (k === 'sousType' ? !cur : cur === '' || cur == null || (Array.isArray(cur) && !cur.some((c) => c && (c.cruId || c.id))) || (k === 'cepages' && !Object.keys(cur || {}).length) || k === 'qualifId' || k === 'volL' || k === 'kind') n[k] = v.preset[k]; });
      if (type === 'entree_mout' && v.ligne) { const L = Array.isArray(x.entrees) ? x.entrees : []; const vide = (e) => !e || !(e.dests || []).some((d) => d.contenantId || hasNum(d.volL)); const lg = moutLine(db, '', { ...(L[0] && vide(L[0]) ? L[0] : {}), ...v.ligne }); n.entrees = L.length && vide(L[0]) ? [lg, ...L.slice(1)] : [...L, lg]; }
      return n;
    });
    setInfo({ manquants: v.manquants, notes: v.notes, integre: r.integre, recente: r.recente, partenaire: v.partenaire });
    toast(`Fichier de traçabilité repris : ${rec.produit.designation || rec.produit.lot || 'produit'}${rec.expediteur && rec.expediteur.nom ? ` (${rec.expediteur.nom})` : ''}. Vérifiez le formulaire.`);
  };
  const retirer = (rec) => setF((x) => ({ ...x, amont: (x.amont || []).filter((a) => a !== rec) }));
  // expéditeur inconnu chez le receveur : partenaire créé d'un clic (nom et adresse du fichier), choisi dans le formulaire
  const cree = (id) => {
    setF((x) => (type === 'entree_mout' ? { ...x, apporteurId: x.apporteurId || id, entrees: (Array.isArray(x.entrees) ? x.entrees : []).map((e) => ((e.apporteurs || []).length ? e : { ...e, apporteurs: [{ id, pct: '' }] })) } : { ...x, apporteurId: id }));
    setInfo((i) => (i ? { ...i, partenaire: null, manquants: i.manquants.filter((m) => !m.startsWith(`partenaire « ${creer.nom} »`)) } : i));
  };
  return (
    <div className="space-y-2" data-trace-import="">
      {A.map((rec, k) => <div key={k}><TraceAmontVue rec={rec} /><div className="mt-1 flex flex-wrap items-center gap-2"><span className="help">Gardé avec l’entrée : affiché dans le journal (📥) et sur la fiche des lots.</span><button type="button" className="linkish text-sm" onClick={() => retirer(rec)}>Retirer ce fichier</button></div></div>)}
      {info && (info.manquants.length || info.notes.length || info.recente) ? <Notice tone="warn" title="À compléter">{[...(info.manquants.length ? [`Non trouvé chez vous : ${info.manquants.join(', ')}.`] : []), ...info.notes, ...(info.recente ? ['Fichier créé par une version plus récente d’Œnotrack : les données inconnues ne sont pas reprises.'] : [])].map((t, k) => <div key={k}>{t}</div>)}
        {info.partenaire ? <div className="mt-2"><Btn size="sm" onClick={() => setCreer(info.partenaire)} data-trace-creer-partenaire="">{`＋ Créer le partenaire « ${info.partenaire.nom} »`}</Btn></div> : null}</Notice> : null}
      {creer ? <ApporteurForm preset={{ nom: creer.nom, vendeur: type !== 'entree_mout', notes: creer.adresse || '' }} onClose={() => setCreer(null)} onSaved={cree} /> : null}
      <ZoneDepot onFiles={lire} accept=".json,application/json" multiple={false} garde="tracabilite" icon="📥" label={A.length ? 'Ajouter un autre fichier de traçabilité' : 'Fichier de traçabilité de l’expéditeur (facultatif)'} sub="fichier .json exporté par l’expéditeur avec Œnotrack : formulaire prérempli, traçabilité d’avant la réception gardée" inputLabel="Fichier de traçabilité de l’expéditeur" />
    </div>
  );
}

// après l'enregistrement d'une expédition vers un partenaire : proposer le fichier de traçabilité
function SuiteExpedition() {
  const { db, openTrace } = useApp(); const prec = useRef(null); const [L, setL] = useState([]);
  useEffect(() => {
    const ids = new Set(db.ops.map((o) => o.id)); const p = prec.current; prec.current = { ids, ops: db.ops };
    if (!p || p.ops === db.ops) return;
    const nouv = db.ops.filter((o) => !p.ids.has(o.id) && traceOpOk(o) && !(o.traceExports || []).length);
    if (nouv.length) setL((x) => [...x.filter((y) => !nouv.some((z) => z.id === y)), ...nouv.map((o) => o.id)].slice(-3));
  }, [db.ops]);
  const reste = L.map((id) => db.ops.find((o) => o.id === id)).filter((o) => o && !(o.traceExports || []).length); if (!reste.length) return null;
  return (
    <div className="suite-hygiene card p-3" role="status" data-suite-expedition="">
      <div className="mb-1 flex items-center gap-2"><b>📤 Expédition enregistrée</b><button type="button" className="linkish ml-auto" onClick={() => setL([])}>Plus tard</button></div>
      {reste.map((o) => <div key={o.id} className="flex flex-wrap items-center gap-2 text-sm"><span className="min-w-0 flex-1">Fichier de traçabilité pour {o.destinataire || 'le destinataire'} ({fmtL(num(o.volL))}, {fmtDate(o.date)})</span><Btn size="sm" kind="primary" onClick={() => { openTrace({ k: 'export', opId: o.id }); setL((x) => x.filter((y) => y !== o.id)); }}>Préparer le fichier</Btn></div>)}
    </div>
  );
}
// fiche d'un lot : traçabilité d'avant la réception (le lot ou ses origines viennent d'une entrée avec un fichier de l'expéditeur)
function LotTraceAmont({ id }) {
  const { db } = useApp(); const L = useMemo(() => traceAmontDuLot(db, id), [db, id]); if (!L.length) return null;
  return (<Sec title={`📥 Traçabilité amont (avant réception) — ${L.length}`} className="mb-5"><div className="space-y-2">{L.map((x, k) => <div key={k}>{x.lotId !== id ? <p className="help mb-1">Par le lot d’origine <LotLink id={x.lotId} /></p> : null}<TraceAmontVue rec={x.rec} /></div>)}</div></Sec>);
}
