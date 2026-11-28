/* ============ ONGLET TRAÇABILITÉ : rappel de lot d'intrant (HACCP), crus, apporteurs, échelle ; conformité réglementaire (0.40.0-alpha.1) ============
   0.48.0-alpha.1 : une seule recherche filtrée par pastilles (Tout · Intrant · Cru · Parcelle · Partenaire ; anciens sous-onglets repris par
   setTab('trace', id)), recherche reprise de l'en-tête (TRACE_RECHERCHE_DEMANDE), « Rapports imprimables » = sommaire de tous les documents.
   0.49.0-alpha.1 : « Poser la question… » (IA12, recherche en langage courant, exécutée sur l'appareil). */
// registre des alertes a posteriori : lots dont les intrants, les teneurs ou le SO₂ total ne respectent pas les référentiels de leur revendication et de leurs labels visés
function ConformiteRegistre({ liste }) {
  const { db, R } = useApp();
  return (
    <div className="space-y-3" data-conformite-registre="">
      <Notice tone={liste.some((x) => x.alertes.some((a) => !a.justifie)) ? 'bad' : 'info'} title="Conformité des lots au référentiel réglementaire">
        <span>Recalculée à chaque modification : intrants ajoutés ou hérités, revendication changée (déclassement, passage en bio…), labels visés. Valeurs d’exemple à vérifier (Intrants › Référentiel réglementaire).</span>
      </Notice>
      <Tbl rows={liste.map((x) => ({ ...x, id: x.lotId }))} empty="Aucun lot en alerte." cols={[
        { h: 'Lot', r: (x) => <LotLink id={x.lotId} /> }, { h: 'Revendication', r: (x) => <QChip id={(R.lots[x.lotId] || {}).qualif} /> }, { h: 'Référentiels', r: (x) => <LabelsChips lotId={x.lotId} /> },
        { h: 'Alertes', r: (x) => <ul className="list-disc pl-4 text-sm">{x.alertes.map((a, i) => <li key={i}><span>{refAlerteTexte(db, a)}</span>{a.justifie ? <> <Chip tone="warn">justifié</Chip></> : null}</li>)}</ul> },
        { h: '', r: (x) => <ConformiteChip alertes={x.alertes} /> },
      ]} />
    </div>
  );
}
function TraceLotsTable({ rows, showApps }) {
  const { db, R } = useApp();
  return <Tbl rows={rows} empty="Aucun lot concerné." cols={[
    { h: 'Lot', r: (r) => <LotLink id={r.lotId} /> }, { h: 'Désignation', cls: 'hm', r: (r) => r.lot.designation },
    { h: 'Stade', cls: 'hm', r: (r) => <StadeChip id={(R.lots[r.lot.id] || r.lot).stade} compact /> },
    { h: 'Lien', r: (r) => (r.direct === undefined ? null : r.direct ? <Chip tone="bad">ajout direct</Chip> : <Chip tone="warn">par assemblage{r.from && r.from.length ? ` (${uniq(r.from).map((x) => lotCode(db, R, x)).join(', ')})` : ''}</Chip>) },
    { h: 'Part estimée', cls: 'r', r: (r) => <span className="num">{pct(r.share, r.share < 0.1 ? 1 : 0)}</span> },
    { h: 'En stock', cls: 'r', r: (r) => <span className="num">{r.vol > 0.5 ? fmtL(r.vol) : ''}{r.bottles ? `${r.vol > 0.5 ? ' · ' : ''}${fmt(r.bottles)} bt` : ''}{r.vol <= 0.5 && !r.bottles ? '—' : ''}</span> },
    { h: 'Où ?', r: (r) => <span className="flex flex-wrap gap-1">{r.conts.map((c) => <ContLink key={c} id={c} />)}</span> },
    { h: 'Conformité', r: (r) => <ConformiteChip alertes={lotConformite(db, R, r.lot.id)} /> },
    ...(showApps ? [{ h: 'Ajouts', cls: 'hm', r: (r) => r.apps.map((a) => `${fmtDate(a.date)} ${fmt(a.qty, 2)} ${a.unite}`).join(' · ') }] : []),
  ]} />;
}

// Rapports imprimables (0.48.0-alpha.1, U32) : sommaire de tous les documents imprimables de l'application, avec un lien vers chacun ;
// les rapports de lots et de contenants s'ouvrent ici, les autres dans leur onglet (module désactivé ou non autorisé : signalé)
const DOCS_IMPRIMABLES = [
  ['Traçabilité', [
    { id: 'lots', titre: '🍷 Rapport de lots', txt: 'Un ou plusieurs lots : composition, origine (crus, partenaires, parcelles), intrants, opérations et analyses.', rapport: 'lot' },
    { id: 'conts', titre: '🛢 Rapport de contenants', txt: 'Un ou plusieurs contenants : contenu, historique, hygiène.', rapport: 'cont' },
    { id: 'trace', titre: '🔎 Rapport de traçabilité', txt: 'Rappel de lot d’intrant, recherche par cru, parcelle ou partenaire, chaîne complète d’un lot : « 🖨 Rapport imprimable » après la recherche.', recherche: true },
  ]],
  ['Vinification', [
    { id: 'plan-cave', titre: '🗺 Plan de cave', txt: 'Plan imprimable avec les couleurs de contour, d’intérieur et les motifs : « 🖨 Imprimer le plan ».', tab: 'cuverie', sub: 'plan' },
    { id: 'qr', titre: '🏷 Étiquettes QR des contenants', txt: 'Planches A4 ou A6 : sélectionnez les contenants de la liste, puis « 🏷 Étiquettes QR ».', tab: 'cuverie', sub: 'liste' },
    { id: 'fiches', titre: '📋 Fiches d’enregistrement', txt: 'Fiches à remplir des opérations à réaliser, fiche du jour.', tab: 'previsions', sub: 'previsions' },
    { id: 'modeles', titre: '📄 Modèles de fiches vierges', txt: 'Chaque modèle de fiche, imprimé vierge.', tab: 'previsions', sub: 'modeles' },
    { id: 'plan-vinif', titre: '🗂 Plan de vinification', txt: 'Instruction de travail par cépage, revendication et fraction (A4 paysage).', tab: 'plan' },
  ]],
  ['Pressoir', [
    { id: 'carnet', titre: '📒 Carnet de pressoir', txt: 'Marcs de l’année, fractions et rendements : « 🖨 Imprimer le carnet ».', tab: 'pressoir', sub: 'marcs' },
    { id: 'releves', titre: '🧾 Relevés par apporteur', txt: 'Moûts de chaque marc au prorata du poids apporté : « 🖨 Imprimer les relevés ».', tab: 'pressoir', sub: 'releves' },
    { id: 'pesees', titre: '🎫 Tickets de pesée et bons de pressoir', txt: 'Depuis chaque pesée ou chaque marc.', tab: 'pressoir', sub: 'pesees' },
  ]],
  ['Tirage, cave et dégorgement', [
    { id: 'levain', titre: '🧫 Plan du levain', txt: 'Préparation et propagation d’un levain (fiche du levain).', tab: 'tirage', sub: 'preparer' },
    { id: 'ordre', titre: '🍾 Ordre de tirage', txt: 'Lots, vin, liqueur, levain, formats et fournitures d’un chantier (fiche du chantier).', tab: 'tirage', sub: 'tirer' },
    { id: 'declarations', titre: '📄 Déclarations de tirage', txt: 'Déclaration préalable et déclaration de fin de tirage.', tab: 'tirage', sub: 'declarations' },
    { id: 'cave', titre: '🍾 Bouteilles en cave', txt: 'Lots de tirage sur lattes, âge et mouvements : « 🖨 Imprimer / PDF ».', tab: 'cave' },
    { id: 'degorgement', titre: '🥂 Dégorgement et lots finis', txt: 'Lots à dégorger et lots finis : « 🖨 Imprimer / PDF ».', tab: 'degorgement' },
  ]],
  ['Intrants, hygiène et équipements', [
    { id: 'recap', titre: '🧪 Fiche récapitulative des intrants', txt: 'Stocks, lots fournisseurs, allergènes et revendications, colonnes au choix.', tab: 'intrants', sub: 'stocks' },
    { id: 'hygiene', titre: '🧽 Journal d’hygiène', txt: 'Nettoyages, désinfections et contrôles : « 🖨 Imprimer / PDF ».', tab: 'hygiene', sub: 'journal' },
    { id: 'nettoyage', titre: '🧹 Plan de nettoyage', txt: 'Tâches, produits, fréquences et contrôles.', tab: 'hygiene', sub: 'plan' },
    { id: 'securite', titre: '⚠ Fiches de sécurité des produits d’hygiène', txt: 'Pictogrammes, précautions et premiers secours.', tab: 'hygiene', sub: 'produits' },
    { id: 'maintenance', titre: '🔧 Plan de maintenance', txt: 'Interventions prévues et réalisées, produits de maintenance.', maintenance: true },
  ]],
  ['Registres', [
    { id: 'drm', titre: '📮 DRM', txt: 'Déclaration récapitulative mensuelle ou annuelle, à imprimer ou en XML.', tab: 'registres', sub: 'drm' },
  ]],
];
function RapportsPanel({ onRecherche }) {
  const { db, R, uid, openReport, setTab } = useApp();
  const nLots = Object.keys(R.lotVol).filter((l) => R.lotVol[l] > 0.5).length + Object.values(R.tir).filter((t) => t.nb > 0).length;
  const lien = (x) => {
    if (x.rapport) return <Btn kind="primary" onClick={() => openReport({ kind: x.rapport, ids: [] })}>{x.rapport === 'lot' ? 'Choisir les lots…' : 'Choisir les contenants…'}</Btn>;
    if (x.recherche) return <Btn onClick={onRecherche}>Ouvrir la recherche…</Btn>;
    const eq = x.maintenance ? maintDansEquipements(db, uid) : false; const tab = x.maintenance ? (eq ? 'equipements' : 'hygiene') : x.tab; const sub = x.maintenance ? 'maintenance' : x.sub;
    if (!moduleActif(db, tab)) return <span className="help">{`module ${moduleNom(tab)} désactivé`}</span>;
    if (!moduleAutorise(db, uid, tab)) return <span className="help">accès non autorisé</span>;
    return <Btn onClick={() => setTab(tab, sub)} data-sommaire-lien={`${tab}${sub ? `:${sub}` : ''}`}>{`Ouvrir → ${moduleNom(tab)}`}</Btn>;
  };
  return (
    <div className="space-y-5" data-sommaire-impression="">
      <p className="text-sm text-ink2">Tous les documents à imprimer ou à enregistrer en PDF, et où les trouver. Les rapports de lots ({fmt(nLots)} en stock) et de contenants ({fmt(db.contenants.filter((c) => !c.archive).length)}) se composent ici, rubrique par rubrique.</p>
      {DOCS_IMPRIMABLES.map(([g, L]) => (<section key={g}><h3 className="sec-t mb-2 text-lg font-semibold">{g}</h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))' }}>{L.map((x) => (
          <div key={x.id} className="card flex flex-col gap-2 p-4" data-document={x.id}><div className="font-semibold">{x.titre}</div><div className="text-sm text-ink2">{x.txt}</div><div className="mt-auto flex flex-wrap gap-2 pt-1">{lien(x)}</div></div>))}</div>
      </section>))}
    </div>
  );
}

// 0.48.0-alpha.1 (U08) : une seule recherche, filtrée par des pastilles (Tout · Intrant · Cru · Parcelle · Partenaire) ; les anciens
// identifiants de sous-onglet (`setTab('trace', 'intrant' | 'cru' | 'parcelle' | 'apporteur' | 'etapes')`) ouvrent la recherche avec ce filtre
const TRACE_FILTRES = [{ id: 'tout', label: 'Tout', aide: 'Toutes les étapes, du raisin au dégorgé' }, { id: 'intrant', label: 'Intrant', aide: 'Rappel de lot d’un intrant' }, { id: 'cru', label: 'Cru', aide: 'Cru (village)' }, { id: 'parcelle', label: 'Parcelle', aide: 'Parcelle' }, { id: 'apporteur', label: 'Partenaire', aide: 'Partenaire (apporteur, vendeur de vins)' }];
const TRACE_VUES = ['etapes', 'echelle', 'conformite', 'audit', 'rapports'];
const traceNavDe = (sub) => (sub === 'etapes' || sub === 'recherche' ? { vue: 'etapes', filtre: 'tout' } : TRACE_FILTRES.some((x) => x.id === sub && x.id !== 'tout') ? { vue: 'etapes', filtre: sub } : TRACE_VUES.includes(sub) ? { vue: sub } : null);
/* 0.49.0-alpha.1 (IA12, usage « traceRecherche », niveau 0) — « Poser la question… » : l'IA reçoit la question et la liste des filtres
   possibles (jamais les résultats ni les noms de la base) et renvoie le filtre et le texte à chercher ; les noms dits sont retrouvés sur
   l'appareil (iaRechercheAppliquer) et la recherche s'exécute sur l'appareil. */
function IaRechercheChamp({ onAppliquer }) {
  const { db } = useApp(); const ia = useIaUsage(); const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const [compris, setCompris] = useState(null);
  const raison = ia.refus('traceRecherche');
  const lancer = async () => {
    const t = q.trim(); if (!t || busy) return; const P = iaRecherchePrompt(t, { aujourdhui: todayISO() });
    setBusy(true); const r = await ia.demander('traceRecherche', P); setBusy(false); if (!r) return;
    const x = iaRechercheAppliquer(db, r.valeur); setCompris(x); onAppliquer(x);
  };
  const nomFiltre = (f) => (f === 'echelle' ? ECH.nom : (TRACE_FILTRES.find((y) => y.id === f) || TRACE_FILTRES[0]).label);
  return (
    <div className="mb-3" data-ia-recherche="">
      <div className="flex flex-wrap items-center gap-2">
        <input className="inp min-w-0 flex-1" style={{ minWidth: 200 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Poser la question…" aria-label="Poser une question de traçabilité" disabled={!!raison} title={raison || 'ex. « quels lots ont reçu la bentonite lot B-1234 ? », « tout ce qui vient d’Avize »'} data-ia-recherche-question=""
          onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { e.preventDefault(); lancer(); } }} />
        <IaBouton usage="traceRecherche" busy={busy} disabled={!q.trim()} onClick={lancer} data-ia-recherche-ok="">Chercher</IaBouton>
      </div>
      {compris ? <div className="mt-1 flex flex-wrap items-center gap-2 text-sm" data-ia-recherche-compris=""><span className="text-ink2">Compris :</span><Chip tone="info">{nomFiltre(compris.filtre)}</Chip>{compris.q ? <q translate="no">{compris.q}</q> : null}{compris.explication ? <span className="text-ink2" translate="no">{compris.explication}</span> : null}
        {compris.avert.map((a, i) => <Chip key={i} tone="warn">{a}</Chip>)}<span className="text-xs text-ink2">La recherche s’exécute sur cet appareil.</span></div> : null}
    </div>
  );
}
function TabTrace() {
  const { db, R, toast, nav } = useApp();
  // recherche demandée par l'en-tête (« Tout voir dans Traçabilité ») : texte repris une fois, filtre « Tout »
  const demandeLire = () => { const q = typeof TRACE_RECHERCHE_DEMANDE !== 'undefined' && TRACE_RECHERCHE_DEMANDE.q ? String(TRACE_RECHERCHE_DEMANDE.q) : ''; if (q) TRACE_RECHERCHE_DEMANDE.q = ''; return q; };
  const [demande, setDemande] = useState(() => ({ q: demandeLire(), n: 0 }));
  const n0 = demande.q ? { vue: 'etapes', filtre: 'tout' } : traceNavDe(nav && nav.sub) || { vue: 'etapes', filtre: 'tout' }; // « Recherche » d'abord (0.28.0-alpha.1 : « Toutes les étapes »)
  const [vue, setVue] = useState(n0.vue); const [filtre, setFiltre] = useState(n0.filtre || 'tout');
  const premier = useRef(true);
  useEffect(() => {
    if (premier.current) { premier.current = false; return; } // montage : déjà lu ci-dessus
    const q = demandeLire(); if (q) { setVue('etapes'); setFiltre('tout'); setDemande((d) => ({ q, n: d.n + 1 })); return; }
    const x = traceNavDe(nav && nav.sub); if (x) { setVue(x.vue); if (x.filtre) setFiltre(x.filtre); }
  }, [nav]);
  const mode = vue === 'etapes' ? (filtre === 'tout' ? 'etapes' : filtre) : vue; // mode de recherche d'avant 0.48 (etapes, intrant, cru, parcelle, apporteur, echelle…)
  const [prod, setProd] = useState(''); const [arrs, setArrs] = useState([]);
  const [cru, setCru] = useState(''); const [app, setApp] = useState(''); const [parc, setParc] = useState(''); const [ech, setEch] = useState(() => echTop() || 'grand');
  const [printing, setPrinting] = useState(false); const ref = useRef(null);
  // recherche posée en langage courant (IA12) : filtre, élément retrouvé sur l'appareil, texte à chercher
  const iaAppliquer = (x) => {
    if (x.filtre === 'echelle') { setVue('echelle'); if (x.ech) setEch(x.ech); return; }
    setVue('etapes'); setFiltre(x.filtre);
    if (x.filtre === 'tout') setDemande((d) => ({ q: x.q, n: d.n + 1 }));
    if (x.filtre === 'intrant') { setProd(x.prod); setArrs(x.arrs || []); }
    if (x.filtre === 'cru') setCru(x.cru); if (x.filtre === 'parcelle') setParc(x.parc); if (x.filtre === 'apporteur') setApp(x.app);
  };
  const nonConf = useMemo(() => lotsNonConformes(db, R, true), [db, R]); const nNonConf = nonConf.filter((x) => x.alertes.some((a) => !a.justifie)).length; // 0.40.0-alpha.1
  const prods = db.produits.filter((p) => db.arrivages.some((a) => a.produitId === p.id)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const res = useMemo(() => {
    if (mode === 'intrant') return prod ? traceIntrant(db, R, { produitId: prod, arrivageIds: arrs }) : null;
    if (mode === 'cru') return cru ? traceOrigin(db, R, 'cru', cru) : null;
    if (mode === 'apporteur') return app ? traceOrigin(db, R, 'apporteur', app) : null;
    if (mode === 'parcelle') return parc ? traceOrigin(db, R, 'parcelle', parc) : null;
    if (mode !== 'echelle') return null;
    return traceOrigin(db, R, 'echelle', ech);
  }, [db, R, mode, prod, arrs, cru, app, parc, ech]);
  const subject = mode === 'intrant' ? (prod ? `${prodOf(db, prod).nom}${arrs.length ? ` · lot(s) ${arrs.map((a) => arrOf(db, a).numLot).join(', ')}` : ' · tous lots fournisseurs'}` : '') : mode === 'cru' ? (cru ? `Cru ${cruName(db, cru)} (${eLabel(cruEchelle(db, cru))})` : '') : mode === 'apporteur' ? (app ? `Apporteur ${apporteurName(db, app)}` : '') : mode === 'parcelle' ? (parc ? `Parcelle ${parcelleName(db, parc)} (${cruName(db, ((db.parcelles || []).find((x) => x.id === parc) || {}).cruId)})` : '') : `${ECH.nom} : ${eLabel(ech)}`;
  const csv = async () => {
    if (!res) return;
    const rows = [['Recherche', subject], [], ['Lot', 'Désignation', 'Stade', 'Lien', 'Part estimée (%)', 'Volume en stock (hL)', 'Bouteilles', 'Contenants']];
    res.lots.forEach((r) => rows.push([r.lot.code, r.lot.designation, stadeLabel(db, (R.lots[r.lot.id] || r.lot).stade), r.direct === undefined ? '' : r.direct ? 'direct' : 'assemblage', r2(r.share * 100), r2(r.vol / 100), r.bottles || '', r.conts.map((c) => contName(db, c)).join(' + ')]));
    if (res.finis.length) { rows.push([], ['Lot fini', 'Désignation', 'Date', 'Bouteilles', 'Part estimée (%)']); res.finis.forEach((f) => rows.push([f.fini.code, f.fini.designation, f.fini.date, f.fini.nb, r2(f.share * 100)])); }
    const r = await saveFile(`oenotrack-tracabilite-${todayISO()}.csv`, toCSV(rows), 'text/csv'); if (r.ok) toast('Export CSV enregistré.'); else if (!r.declined) toast(failMsg(r), 'bad');
  };
  const out = useReportOutput(ref, `oenotrack-tracabilite-${todayISO()}`);
  const Body = () => !res ? <Empty>{mode === 'intrant' ? 'Choisissez un produit (et éventuellement ses n° de lots fournisseurs) pour retrouver tous les lots qui peuvent le contenir.' : 'Choisissez l’élément à tracer.'}</Empty> : (
    <div className="space-y-5">
      <div className="grid4">
        {mode === 'intrant' ? <><Kpi label="Ajouts trouvés" value={fmt(res.apps.length)} sub={`${res.arrs.length} lot(s) fournisseur(s)`} /><Kpi label="Lots concernés" value={fmt(res.tot.nLots)} sub={`${res.lots.filter((l) => l.direct).length} directs · ${res.lots.filter((l) => !l.direct).length} par assemblage`} tone={res.tot.nLots ? 'bad' : undefined} /></>
          : <><Kpi label={mode === 'echelle' ? 'Raisins / moûts' : 'Raisin reçu'} value={`${fmt(res.tot.kg)} kg`} sub={`${res.raisins.length} apport(s) · ${fmtL(res.tot.lMout)} de moût`} /><Kpi label="Lots concernés" value={fmt(res.tot.nLots)} /></>}
        <Kpi label="Volume en cuve concerné" value={fmtL(res.tot.vol)} sub={`dont ≈ ${fmtL(res.tot.volExpo)} issus de l’élément`} />
        <Kpi label="Bouteilles" value={fmt(res.tot.bottles + (mode === 'intrant' ? 0 : 0))} sub={`${res.finis.length} lot(s) fini(s) · ${fmt(sum(res.finis, (f) => f.fini.nb))} bt dégorgées`} />
      </div>
      {mode === 'intrant' ? <Sec title="Lots fournisseurs (arrivages)"><Tbl rows={res.arrs} cols={[{ h: 'N° lot', r: (x) => <b>{x.a.numLot}</b> }, { h: 'Reçu le', r: (x) => fmtDate(x.a.date) }, { h: 'DDM', cls: 'hm', r: (x) => fmtDate(x.a.dluo) }, { h: 'Reçu', cls: 'r', r: (x) => <span className="num">{fmt(x.recu, 2)}</span> }, { h: 'Utilisé', cls: 'r', r: (x) => <span className="num">{fmt(x.utilise, 2)}</span> }, { h: 'Restant (à bloquer)', cls: 'r', r: (x) => <span className="num">{fmt(x.reste, 2)} {prodOf(db, prod).unite}</span> }, { h: 'Ajouts', cls: 'r', r: (x) => x.nApps }]} /></Sec> : null}
      {mode !== 'intrant' && (res.raisins.length || res.mouts.length) ? <Sec title="Entrées d’origine (raisins et moûts)"><Tbl rows={[...res.raisins.map((r) => ({ id: 'r' + r.id, date: r.date, nat: 'Raisin', cep: r.cepageId, cru: r.cruId, ap: r.apporteurId, q: `${fmt(r.kg)} kg` })), ...res.mouts.map((m, i) => ({ id: 'm' + i, date: m.op.date, nat: `Moût${m.e.fractionId ? ` · ${fracLabel(db, m.e.fractionId)}` : ''}${m.e.compartiment ? ` · ${m.e.compartiment}` : ''}${m.op.immat ? ` · ${m.op.immat}` : ''}`, cep: m.e.cepageId, cru: m.e.cruId, apTxt: ligneApporteursNoms(db, m.e, m.op), q: fmtL(m.e.volL) }))]} cols={[
        { h: 'Date', r: (x) => fmtDate(x.date) }, { h: 'Nature', r: (x) => x.nat }, { h: 'Cépage', r: (x) => lbl(db, 'cepages', x.cep) }, { h: 'Cru', r: (x) => (x.cru ? <CruBadge id={x.cru} /> : '—') }, { h: 'Partenaire(s)', cls: 'hm', r: (x) => x.apTxt || (x.ap ? apporteurName(db, x.ap) : '—') }, { h: 'Quantité', cls: 'r', r: (x) => <span className="num">{x.q}</span> }]} /></Sec> : null}
      <Sec title="Lots pouvant contenir cet élément" right={<span className="text-xs text-ink2">part estimée au prorata des volumes engagés</span>}><TraceLotsTable rows={res.lots} showApps={mode === 'intrant'} /></Sec>
      <Sec title="Lots finis (bouteilles dégorgées)"><Tbl rows={res.finis} empty="Aucun lot fini concerné." cols={[{ h: 'Lot fini', r: (f) => <b>{f.fini.code}</b> }, { h: 'Désignation', cls: 'hm', r: (f) => f.fini.designation }, { h: 'Dégorgé le', r: (f) => fmtDate(f.fini.date) }, { h: 'Bouteilles', cls: 'r', r: (f) => <span className="num">{fmt(f.fini.nb)}</span> }, { h: 'Part estimée', cls: 'r', r: (f) => <span className="num">{pct(f.share)}</span> }, { h: 'Via', r: (f) => (f.via ? <LotLink id={f.via} /> : '—') }]} /></Sec>
    </div>
  );
  return (
    <div>
      <SubNav value={vue} onChange={setVue} items={[{ id: 'etapes', label: '🔎 Recherche' }, { id: 'echelle', label: ECH.nom }, { id: 'conformite', label: '⚖ Conformité réglementaire', badge: nNonConf || null }, { id: 'audit', label: '🧾 Mode audit' }, { id: 'rapports', label: '🖨 Rapports imprimables' }]} />
      {vue === 'etapes' || vue === 'echelle' ? <IaRechercheChamp onAppliquer={iaAppliquer} /> : null}
      {vue === 'etapes' ? <div className="trace-filtres mb-3" role="group" aria-label="Filtre de la recherche" data-trace-filtres="">{TRACE_FILTRES.map((x) => <button key={x.id} type="button" className={cx('trf', filtre === x.id && 'on')} aria-pressed={filtre === x.id} title={x.aide} onClick={() => setFiltre(x.id)} data-trace-filtre={x.id}>{x.label}</button>)}</div> : null}
      {mode === 'etapes' ? <TraceEtapes key={demande.n} qInit={demande.q} /> : mode === 'conformite' ? <ConformiteRegistre liste={nonConf} /> : mode === 'audit' ? <AuditsView /> : mode === 'rapports' ? <RapportsPanel onRecherche={() => { setVue('etapes'); setFiltre('tout'); }} /> : <>
        <div className="panel mb-5">
        {mode === 'intrant' ? <div className="grid2">
          <Field label="Produit (intrant)"><SI value={prod} onChange={(v) => { setProd(v); setArrs([]); }} placeholder="Choisir le produit…" options={prods.map((p) => ({ value: p.id, label: `${p.nom} (${CATEGORIES[p.categorie]})` }))} /></Field>
          <Group label="N° de lots fournisseurs concernés (aucun coché = tous)">{prod ? <div className="flex flex-wrap gap-x-4 gap-y-1">{db.arrivages.filter((a) => a.produitId === prod).map((a) => <Check key={a.id} checked={arrs.includes(a.id)} onChange={() => setArrs(arrs.includes(a.id) ? arrs.filter((x) => x !== a.id) : [...arrs, a.id])} label={`${a.numLot} (${fmtDate(a.date)})`} />)}</div> : <div className="help">Choisissez d’abord un produit.</div>}</Group>
        </div> : mode === 'cru' ? <Field label="Cru (village)"><CruSelect value={cru} onChange={setCru} allowAdd={false} includeHidden /></Field>
          : mode === 'parcelle' ? <Field label="Parcelle" help={(db.parcelles || []).length ? undefined : 'Aucune parcelle : ajoutez-les dans Paramètres › Crus & parcelles.'}><ParcelleSelect value={parc} onChange={setParc} allowAdd={false} /></Field>
          : mode === 'apporteur' ? <Field label="Partenaire (apporteur, vendeur de vins)"><ApporteurSelect value={app} onChange={setApp} allowAdd={false} /></Field>
            : <div className="flex flex-wrap gap-2">{ECHELLES.slice().reverse().map((e) => <Btn key={e.id} kind={ech === e.id ? 'primary' : undefined} onClick={() => setEch(e.id)}>{e.label}</Btn>)}</div>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="help mr-auto">{mode === 'intrant' ? 'Recherche descendante : ajouts directs, puis tous les assemblages, cuvées de tirage et lots finis issus de ces lots.' : 'Recherche à partir de la composition calculée de chaque lot (raisins et moûts → pressées → assemblages → tirage).'}</span>
          <Btn disabled={!res} onClick={csv}>⬇ Exporter (CSV)</Btn><Btn disabled={!res} onClick={() => setPrinting(true)}>🖨 Rapport imprimable</Btn>
        </div>
      </div>
      {Body() /* 0.38.0-alpha.3 : appelée, plus montée comme composant (recréé à chaque rendu) */}</>}
      {printing && res ? <Sheet wide title="Rapport de traçabilité" sub={subject} onClose={() => setPrinting(false)} footer={<><BoutonsSortie out={out} /></>}>
        <div ref={ref} className="report"><ReportHead title="Rapport de traçabilité" sub={subject} />
          <div className="rpt-item">
            <h2>Synthèse</h2><table><tbody><tr><th>Lots concernés</th><td>{res.lots.length}</td><th>Volume en cuve</th><td>{fmtL(res.tot.vol)}</td></tr><tr><th>Bouteilles sur lattes</th><td>{fmt(res.tot.bottles)}</td><th>Lots finis</th><td>{res.finis.length} ({fmt(sum(res.finis, (f) => f.fini.nb))} bt)</td></tr></tbody></table>
            {mode === 'intrant' ? <><h3>Lots fournisseurs</h3><RTable head={['N° lot', 'Reçu le', 'DDM', 'Reçu', 'Utilisé', 'Restant']} rows={res.arrs.map((x) => [x.a.numLot, fmtDate(x.a.date), fmtDate(x.a.dluo), fmt(x.recu, 2), fmt(x.utilise, 2), fmt(x.reste, 2)])} /></> : null}
            <h3>Lots concernés</h3><RTable head={['Lot', 'Désignation', 'Lien', 'Part estimée', 'Stock', 'Contenants']} rows={res.lots.map((r) => [r.lot.code, r.lot.designation, r.direct === undefined ? '' : r.direct ? 'direct' : 'assemblage', pct(r.share, 1), `${r.vol > 0.5 ? fmtL(r.vol) : ''}${r.bottles ? ` ${fmt(r.bottles)} bt` : ''}`, r.conts.map((c) => contName(db, c)).join(', ')])} />
            <h3>Lots finis</h3><RTable head={['Lot fini', 'Désignation', 'Dégorgé le', 'Bouteilles', 'Part estimée']} rows={res.finis.map((f) => [f.fini.code, f.fini.designation, fmtDate(f.fini.date), fmt(f.fini.nb), pct(f.share)])} empty="Aucun." />
          </div></div>
      </Sheet> : null}
    </div>
  );
}
TABS_REG.trace = TabTrace;
