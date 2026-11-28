/* ============ ONGLET ÉQUIPEMENTS (0.28.0-alpha.1) : parc, maintenance, vérifications périodiques ============
   Moteur : 16i-equipements.js (fiches), 16c-plans-hygiene.js (plan de maintenance, interventions : mêmes données que l'Hygiène). */
const EQUIP_TONS = { reforme: '', panne: 'bad', arret: 'warn', retard: 'bad', bientot: 'warn', ok: 'ok' };
const EquipEtatChip = ({ k }) => <Chip tone={EQUIP_TONS[k]}>{EQUIP_ETAT_TXT[k] || k}</Chip>;
const VERIF_TXT = { ok: 'valide', bientot: 'à renouveler', retard: 'échue', inconnue: 'date à saisir', aucune: '' };
function VerifChip({ v }) { if (!v || v.k === 'aucune') return null; return <Chip tone={v.k === 'ok' ? 'ok' : v.k === 'bientot' ? 'warn' : v.k === 'retard' ? 'bad' : ''}>{v.valideJusquau ? `${VERIF_TXT[v.k]} · ${fmtDate(v.valideJusquau)}` : VERIF_TXT[v.k]}</Chip>; }
function useEquipTaches() { const { db } = useApp(); return useMemo(() => equipTaches(db, todayISO()), [db]); }

// fiche modifiable d'un équipement (identité, état, vérification périodique, champs à vous)
function EquipForm({ id, onClose, onSaved }) {
  const { db, act } = useApp(); const e0 = id ? equipementsDe(db).find((x) => x.id === id) : null;
  const [f, set, setF] = useDraft(() => { const v = e0 ? equipVerif(e0) : {}; return e0 ? { label: e0.label, categorie: equipCategorie(e0), marque: e0.marque || '', modele: e0.modele || '', numSerie: e0.numSerie || '', annee: e0.annee || '', fournisseur: e0.fournisseur || '', siteId: e0.siteId || '', emplacement: e0.emplacement || '', etat: e0.etat || 'service', garantieJusquau: e0.garantieJusquau || '', notes: e0.notes || '', verif: { periodeMois: v.periodeMois || '', derniere: v.derniere || '', valideJusquau: (e0.balance && isoOK(e0.balance.valideJusquau) ? e0.balance.valideJusquau : (e0.verif || {}).valideJusquau) || '', organisme: v.organisme || '' }, champs: (e0.champs || []).map((c) => ({ ...c })) }
    : { label: '', categorie: 'autre', marque: '', modele: '', numSerie: '', annee: '', fournisseur: '', siteId: '', emplacement: '', etat: 'service', garantieJusquau: '', notes: '', verif: { periodeMois: '', derniere: '', valideJusquau: '', organisme: '' }, champs: [] }; });
  // nouvelle date de vérification ou périodicité : la validité suit (modifiable ensuite)
  const setV = (k, v) => setF((x) => { const w = { ...x.verif, [k]: v }; if ((k === 'derniere' || k === 'periodeMois') && isoOK(w.derniere) && num(w.periodeMois) > 0) w.valideJusquau = maintAjout(w.derniere, { n: Math.round(num(w.periodeMois)), unite: 'mois' }); return { ...x, verif: w }; });
  const setC = (i, p) => setF((x) => ({ ...x, champs: x.champs.map((c, j) => (j === i ? { ...c, ...p } : c)) }));
  const save = () => { const r = act((d) => equipementSave(d, id, f), id ? 'Fiche enregistrée.' : 'Équipement ajouté.'); if (r && r.ok) { if (onSaved) onSaved(r.id); onClose(); } };
  return (
    <FormSheet title={id ? `Fiche — ${e0 ? e0.label : ''}` : 'Nouvel équipement'} onClose={onClose} onSave={save}>
      <G><Field label="Nom"><TI value={f.label} onChange={(v) => set('label', v)} placeholder="ex. Pressoir 8 000 kg, Pompe à rotor" aria-label="Nom de l’équipement" /></Field>
        <Field label="Catégorie"><SI plain value={f.categorie} onChange={(v) => set('categorie', v)} options={hygOpts(EQUIP_CATEGORIES, f.categorie)} aria-label="Catégorie" /></Field></G>
      <G n={3}><Field label="Marque"><TI value={f.marque} onChange={(v) => set('marque', v)} /></Field><Field label="Modèle"><TI value={f.modele} onChange={(v) => set('modele', v)} /></Field><Field label="N° de série"><TI value={f.numSerie} onChange={(v) => set('numSerie', v)} aria-label="N° de série" /></Field></G>
      <G n={3}><Field label="Mise en service (année)"><TI value={f.annee} onChange={(v) => set('annee', v)} placeholder="ex. 2019" aria-label="Année de mise en service" /></Field><Field label="Fournisseur, installateur"><TI value={f.fournisseur} onChange={(v) => set('fournisseur', v)} /></Field><Field label="Garantie jusqu’au"><DI value={f.garantieJusquau} onChange={(v) => set('garantieJusquau', v)} /></Field></G>
      <G n={3}><Field label="Site"><SI plain value={f.siteId} onChange={(v) => set('siteId', v)} options={[{ value: '', label: '—' }, ...(db.sites || []).map((s) => ({ value: s.id, label: s.nom }))]} aria-label="Site" /></Field><Field label="Emplacement"><TI value={f.emplacement} onChange={(v) => set('emplacement', v)} placeholder="ex. quai de réception" /></Field>
        <Field label="État"><SI plain value={f.etat} onChange={(v) => set('etat', v)} options={EQUIP_ETATS.map(([v, l]) => ({ value: v, label: l }))} aria-label="État de l’équipement" /></Field></G>
      <Group label="Vérification périodique (métrologie, contrôle réglementaire)" help="Bascules et balances (vignette), instruments de mesure, extincteurs, appareils de levage… Laissez vide si ce matériel n’en demande pas.">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,170px),1fr))' }} data-equip-verif="">
          <Field label="Tous les (mois)"><input className="inp num" inputMode="numeric" value={f.verif.periodeMois} onChange={(ev) => setV('periodeMois', ev.target.value)} aria-label="Périodicité en mois" /></Field>
          <Field label="Dernière vérification"><DI value={f.verif.derniere} onChange={(v) => setV('derniere', v)} /></Field>
          <Field label="Valable jusqu’au"><DI value={f.verif.valideJusquau} onChange={(v) => setV('valideJusquau', v)} /></Field>
          <Field label="Organisme, vérificateur"><TI value={f.verif.organisme} onChange={(v) => setV('organisme', v)} aria-label="Organisme de vérification" /></Field>
        </div>
      </Group>
      <Group label="Vos informations" help="Ce que vous voulez suivre en plus : puissance, contrat d’entretien, n° d’agrément, consommables…">
        <div className="space-y-2" data-equip-champs="">{f.champs.map((c, i) => <div key={i} className="flex flex-wrap items-center gap-2"><TI value={c.label} onChange={(v) => setC(i, { label: v })} placeholder="Intitulé" aria-label={`Intitulé ${i + 1}`} style={{ flex: '1 1 140px' }} /><TI value={c.valeur} onChange={(v) => setC(i, { valeur: v })} placeholder="Valeur" aria-label={`Valeur ${i + 1}`} style={{ flex: '2 1 180px' }} /><Btn size="sm" kind="danger" onClick={() => setF((x) => ({ ...x, champs: x.champs.filter((_, j) => j !== i) }))} aria-label={`Retirer ${i + 1}`}>✕</Btn></div>)}
          <Btn size="sm" onClick={() => setF((x) => ({ ...x, champs: [...x.champs, { label: '', valeur: '' }] }))}>＋ Ajouter une information</Btn></div>
      </Group>
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} rows={2} /></Field>
    </FormSheet>
  );
}

// fiche d'un équipement : état, maintenance, historique, documents ; imprimable
function EquipFiche({ id, onClose }) {
  const { db, act, confirm } = useApp(); const ref = useRef(null); const [ed, setEd] = useState(false); const [mt, setMt] = useState(null); const t = todayISO();
  const e = equipementsDe(db).find((x) => x.id === id); const out = useReportOutput(ref, `fiche-equipement-${e ? slug(e.label) : ''}`);
  if (!e) return null;
  const S = equipEtat(db, e, t); const H = equipHistorique(db, e.id); const site = (db.sites || []).find((x) => x.id === e.siteId);
  const suppr = async () => { if (await confirm({ title: `Supprimer « ${e.label} » ?`, body: 'Possible seulement pour un matériel jamais utilisé ; sinon passez-le en « Réformé ».', ok: 'Supprimer', danger: true })) { const r = act((d) => equipementSupprimer(d, e.id), 'Équipement supprimé.'); if (r && r.ok) onClose(); } };
  const ligne = (k, v) => (v ? <tr><th style={{ width: '34%' }}>{k}</th><td translate="no">{v}</td></tr> : null); // données saisies : jamais traduites
  return (
    <Sheet wide title={e.label} sub={hygLib(EQUIP_CATEGORIES, equipCategorie(e))} onClose={onClose}
      footer={<><Btn kind="danger" className="mr-auto" onClick={suppr}>Supprimer</Btn><BoutonsSortie out={out} html={false} /></>}>
      <div className="no-print mb-3 flex flex-wrap items-center gap-2" data-equip-fiche={e.id}>
        <EquipEtatChip k={S.k} /><VerifChip v={S.verif} />
        <span className="ml-auto flex flex-wrap gap-1"><Btn size="sm" onClick={() => setEd(true)}>Modifier la fiche</Btn><Btn size="sm" kind="primary" onClick={() => setMt({ preset: { equipementId: e.id, type: 'curative', statut: 'ouverte' } })}>⚠ Signaler une panne</Btn><Btn size="sm" onClick={() => setMt({ preset: { equipementId: e.id, entreeId: S.plan.length === 1 ? S.plan[0].e.id : '', type: 'preventive' } })}>＋ Intervention</Btn><DocsButton cible={{ type: 'equipement', id: e.id }} kind="equipement" title={e.label} /></span>
      </div>
      <div ref={ref} className="report">
        <ReportHead title={`Fiche équipement — ${e.label}`} sub={hygLib(EQUIP_CATEGORIES, equipCategorie(e))} />
        <table><tbody>
          {ligne('Marque, modèle', [e.marque, e.modele].filter(Boolean).join(' · '))}{ligne('N° de série', e.numSerie)}{ligne('Mise en service', e.annee)}{ligne('Fournisseur, installateur', e.fournisseur)}
          {ligne('Site, emplacement', [site && site.nom, e.emplacement].filter(Boolean).join(' · '))}{ligne('Garantie jusqu’au', e.garantieJusquau ? fmtDate(e.garantieJusquau) : '')}
          <tr><th>État</th><td>{EQUIP_ETAT_TXT[S.k]}</td></tr>
          {S.verif.k !== 'aucune' ? <tr><th>Vérification périodique</th><td>{[S.verif.periodeMois ? `tous les ${S.verif.periodeMois} mois` : '', S.verif.derniere ? `dernière le ${fmtDate(S.verif.derniere)}` : '', S.verif.valideJusquau ? `valable jusqu’au ${fmtDate(S.verif.valideJusquau)}` : '', S.verif.organisme].filter(Boolean).join(' · ') || '—'}</td></tr> : null}
          {(e.champs || []).map((c, i) => <tr key={i} translate="no"><th>{c.label}</th><td>{c.valeur}</td></tr>)}
          {ligne('Notes', e.notes)}
        </tbody></table>
        <h3>Plan de maintenance</h3>
        {S.plan.length ? <RTable head={['Ligne du plan', 'Type', 'Fréquence', 'Dernière', 'Prochaine', 'État']} rows={S.plan.map(({ e: p, s }) => [p.libelle, hygLib(MAINT_TYPES, p.type), maintFreqTexte(p.frequence), s.derniere ? fmtDate(s.derniere) : '—', s.echeance ? fmtDate(s.echeance) : '—', (MAINT_ETAT[s.etat] || ['', s.etat])[1]])} /> : <p className="muted">Aucune ligne du plan de maintenance ne couvre ce matériel.</p>}
        <h3>{`Interventions (${H.interventions.length})`}</h3>
        <RTable head={['Date', 'Type', 'Détail', 'Intervenant', 'Résultat']} rows={H.interventions.map((m) => [fmtDate(m.date), `${hygLib(MAINT_TYPES, m.type)}${m.statut === 'ouverte' ? ' (panne en cours)' : ''}`, [m.probleme, m.interventions].filter(Boolean).join(' — '), m.intervenant || '', hygLib(MAINT_RESULTATS, m.resultat)])} empty="Aucune intervention." />
        {H.hygiene.length ? <><h3>{`Nettoyages (${H.hygiene.length})`}</h3><RTable head={['Date', 'Action', 'Produits', 'Opérateur(s)']} rows={H.hygiene.slice(0, 30).map((h) => [fmtDate(h.date), lbl(db, 'actionsHygiene', h.actionId), h.produit || '', operateursNoms(db, h.operateurs) || h.operateur || ''])} /></> : null}
        {H.ops.length ? <><h3>{`Utilisations (${H.ops.length})`}</h3><RTable head={['Date', 'Opération']} rows={H.ops.slice(0, 30).map((o) => [fmtDate(o.date), opNom(o)])} /></> : null}
        {H.docs.length ? <><h3>{`Documents (${H.docs.length})`}</h3><RTable head={['Document', 'Catégorie', 'Date']} rows={H.docs.map((d) => [d.nom, d.cat || '', fmtDate(d.date || '')])} /></> : null}
      </div>
      {ed ? <EquipForm id={e.id} onClose={() => setEd(false)} /> : null}
      {mt ? <MaintInterventionForm id={mt.id} cloturer={mt.cloturer} preset={mt.preset} onClose={() => setMt(null)} /> : null}
    </Sheet>
  );
}

// parc : cartes par catégorie, filtres, indicateurs
function EquipParc() {
  const { db } = useApp(); const [q, setQ] = useState(''); const [cat, setCat] = useState(''); const [etat, setEtat] = useState(''); const [site, setSite] = useState(''); const [fiche, setFiche] = useState(null); const [nouveau, setNouveau] = useState(false);
  const t = todayISO(); const L = useMemo(() => equipementsListe(db, t), [db, t]);
  const vus = L.filter((x) => (!cat || x.cat === cat) && (!site || x.e.siteId === site) && (etat ? x.k === etat : x.k !== 'reforme') && (!q || norm(`${x.e.label} ${x.e.marque || ''} ${x.e.modele || ''} ${x.e.numSerie || ''} ${x.e.emplacement || ''}`).includes(norm(q))));
  const n = (k) => L.filter((x) => x.k === k).length; const nRetard = L.filter((x) => x.k !== 'reforme' && x.retard.length).length; const nBientot = L.filter((x) => x.k !== 'reforme' && !x.retard.length && x.bientot.length).length; const nVerif = L.filter((x) => x.k !== 'reforme' && ['retard', 'bientot', 'inconnue'].includes(x.verif.k)).length;
  const cats = EQUIP_CATEGORIES.filter(([c]) => vus.some((x) => x.cat === c));
  return (
    <div>
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label="Matériel en service" value={fmt(L.filter((x) => !['reforme', 'arret'].includes(x.k)).length)} sub={`${L.length} fiche(s)`} />
        <Kpi label="En panne" value={fmt(n('panne'))} tone={n('panne') ? 'bad' : undefined} sub={n('arret') ? `${n('arret')} à l’arrêt` : 'aucun à l’arrêt'} />
        <Kpi label="Maintenance en retard" value={fmt(nRetard)} tone={nRetard ? 'bad' : nBientot ? 'warn' : undefined} sub={nBientot ? `${nBientot} à prévoir sous un mois` : 'rien à prévoir sous un mois'} />
        <Kpi label="Vérifications" value={fmt(nVerif)} tone={nVerif ? 'warn' : undefined} sub="échues, proches ou à dater" />
      </div>
      <Sec title={`Parc de matériel (${vus.length})`} right={<><input className="inp" style={{ width: 180 }} value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Rechercher…" aria-label="Rechercher un équipement" />
        <SI plain value={cat} onChange={setCat} style={{ width: 'auto' }} options={[{ value: '', label: 'Toutes catégories' }, ...hygOpts(EQUIP_CATEGORIES, cat)]} aria-label="Catégorie" />
        {(db.sites || []).length > 1 ? <SI plain value={site} onChange={setSite} style={{ width: 'auto' }} options={[{ value: '', label: 'Tous les sites' }, ...db.sites.map((s) => ({ value: s.id, label: s.nom }))]} aria-label="Site" /> : null}
        <SI plain value={etat} onChange={setEtat} style={{ width: 'auto' }} options={[{ value: '', label: 'En usage' }, ...Object.keys(EQUIP_ETAT_TXT).map((k) => ({ value: k, label: EQUIP_ETAT_TXT[k] }))]} aria-label="État" />
        <Btn kind="primary" onClick={() => setNouveau(true)} data-equip-nouveau="">＋ Nouvel équipement</Btn></>}>
        {!vus.length ? <Empty>{L.length ? 'Aucun équipement pour ces critères.' : 'Aucun équipement : « + Nouvel équipement ».'}</Empty> : null}
        <div className="space-y-4" data-equip-parc="">{cats.map(([c, cl]) => (
          <div key={c}><div className="lbl mb-1.5">{`${cl} (${vus.filter((x) => x.cat === c).length})`}</div>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))' }}>
              {vus.filter((x) => x.cat === c).map((x) => (
                <button key={x.e.id} type="button" className="card p-3 text-left" onClick={() => setFiche(x.e.id)} data-equip={x.e.id} data-equip-etat={x.k}>
                  <div className="flex items-start gap-2"><b className="min-w-0 flex-1" translate="no">{x.e.label}</b><EquipEtatChip k={x.k} /></div>
                  {x.e.marque || x.e.modele || x.e.numSerie ? <div className="text-xs text-ink2" translate="no">{[x.e.marque, x.e.modele, x.e.numSerie ? `n° ${x.e.numSerie}` : ''].filter(Boolean).join(' · ')}</div> : null}
                  {x.pannes.length ? <div className="mt-1 text-xs text-bad">{`⚠ panne : ${x.pannes[0].probleme || 'en cours'}`}</div> : null}
                  {x.retard.map((p) => <div key={p.e.id} className="mt-0.5 text-xs text-bad">{`🔧 ${p.e.libelle} : échue le ${fmtDate(p.s.echeance)}`}</div>)}{x.bientot.map((p) => <div key={p.e.id} className="mt-0.5 text-xs text-warn">{`🔧 ${p.e.libelle} : avant le ${fmtDate(p.s.echeance)}`}</div>)}
                  {x.verif.k !== 'aucune' ? <div className="mt-1"><VerifChip v={x.verif} /></div> : null}
                </button>))}
            </div>
          </div>))}</div>
      </Sec>
      {fiche ? <EquipFiche id={fiche} onClose={() => setFiche(null)} /> : null}
      {nouveau ? <EquipForm onClose={() => setNouveau(false)} onSaved={(nid0) => setFiche(nid0)} /> : null}
    </div>
  );
}

// vérifications périodiques : bascules, balances, instruments, matériel réglementaire
function EquipVerifications() {
  const { db } = useApp(); const [ed, setEd] = useState(null); const t = todayISO();
  const L = equipementsListe(db, t).filter((x) => x.k !== 'reforme' && x.verif.k !== 'aucune').sort((a, b) => String(a.verif.valideJusquau || '0').localeCompare(String(b.verif.valideJusquau || '0')));
  const autres = equipementsListe(db, t).filter((x) => x.k !== 'reforme' && x.verif.k === 'aucune' && ['mesure', 'securite', 'levage'].includes(x.cat));
  return (
    <div>
      <Notice tone="info" title="Vérifications périodiques">Bascules et balances (vérification par un organisme agréé : vignette), instruments de mesure (étalonnage), extincteurs, appareils de levage… Indiquez sur la fiche la périodicité et la date de validité : les échéances apparaissent dans « À faire » un mois avant.</Notice>
      <Sec title={`Matériel vérifié (${L.length})`}>
        <Tbl rows={L} empty="Aucune vérification suivie : renseignez-la sur la fiche du matériel." cols={[
          { h: 'Matériel', r: (x) => <b>{x.e.label}</b> }, { h: 'Périodicité', cls: 'hm', r: (x) => (x.verif.periodeMois ? `${x.verif.periodeMois} mois` : '—') },
          { h: 'Dernière', r: (x) => <span className="num">{x.verif.derniere ? fmtDate(x.verif.derniere) : '—'}</span> }, { h: 'Organisme', cls: 'hm', r: (x) => x.verif.organisme || '—' },
          { h: 'Validité', r: (x) => <VerifChip v={x.verif} /> }, { h: '', r: (x) => <Btn size="sm" onClick={() => setEd(x.e.id)}>Mettre à jour</Btn> }]} />
      </Sec>
      {autres.length ? <Sec title={`Sans vérification renseignée (${autres.length})`}><div className="flex flex-wrap gap-2">{autres.map((x) => <Btn key={x.e.id} size="sm" onClick={() => setEd(x.e.id)}>{x.e.label}</Btn>)}</div></Sec> : null}
      {ed ? <EquipForm id={ed} onClose={() => setEd(null)} /> : null}
    </div>
  );
}

function TabEquipements() {
  const T = useEquipTaches();
  const items = [{ id: 'parc', label: 'Parc' }, { id: 'afaire', label: 'À faire', badge: T.length || null }, { id: 'maintenance', label: 'Maintenance' }, { id: 'verif', label: 'Vérifications' }, { id: 'listes', label: '⚙ Réglages' }];
  const [sub, setSub] = useSousOnglet(items, 'parc');
  return (<div data-equipements=""><SubNav value={sub} onChange={setSub} items={items} />
    {sub === 'afaire' ? <HygAFaire quoi="equipements" /> : sub === 'maintenance' ? <MaintenanceOnglet /> : sub === 'verif' ? <EquipVerifications /> : sub === 'listes' ? <HygListesView groupes={['equipements', 'maintenance']} /> : <EquipParc />}</div>);
}
TABS_REG.equipements = TabEquipements;
