/* ============ ONGLET 5 : INTRANTS & STOCKS (produits, fournisseurs, arrivages, règles par revendication) ============ */
// produitId0, onSaved (0.30.0-alpha.1) : réception lancée depuis une ligne d'intrant d'une opération
function ArrivageForm({ id, onClose, produitId0, onSaved }) {
  const { db, act, defaultDate, openDocs } = useApp(); const a = id ? db.arrivages.find((x) => x.id === id) : null;
  const [f, set, setF] = useDraft({ produitId: a ? a.produitId : produitId0 || '', fournisseurId: a ? a.fournisseurId : (produitId0 ? prodOf(db, produitId0).fournisseurId || '' : ''), numLot: a ? a.numLot : '', date: a ? a.date : defaultDate, dluo: a ? a.dluo : '', qty: a ? String(a.qty) : '', notes: a ? a.notes : '' });
  const pr = prodOf(db, f.produitId);
  const save = (withDocs) => { const r = act((d) => arrivageSave(d, f, id), id ? 'Arrivage modifié.' : 'Arrivage enregistré.'); if (r.ok) { if (onSaved && r.id) onSaved(r.id); onClose(); if (withDocs === true && r.id) openDocs({ type: 'arrivage', id: r.id }, 'arrivage', `${prodOf(db, f.produitId).nom || 'Intrant'} · lot ${f.numLot}`); } };
  return (
    <FormSheet title={id ? 'Modifier l’arrivage' : 'Nouvel arrivage (lot fournisseur)'} sub="La quantité restante se décrémente automatiquement à chaque utilisation." onClose={onClose} onSave={save} extraFooter={!id ? <Btn className="mr-auto" onClick={() => save(true)}>Enregistrer et joindre des documents</Btn> : null}>
      <Field label="Produit"><SI value={f.produitId} onChange={(v) => setF((x) => ({ ...x, produitId: v, fournisseurId: x.fournisseurId || prodOf(db, v).fournisseurId || '' }))} placeholder="Produit…" options={db.produits.filter((p) => p.actif !== false || p.id === f.produitId).sort((x, y) => x.nom.localeCompare(y.nom, 'fr')).map((p) => ({ value: p.id, label: `${p.nom} (${p.unite})` }))} /></Field>
      <G><Field label="Fournisseur"><SI value={f.fournisseurId} onChange={(v) => set('fournisseurId', v)} placeholder="Fournisseur…" options={db.fournisseurs.map((x) => ({ value: x.id, label: x.nom }))} /></Field><Field label="N° de lot fournisseur"><TI value={f.numLot} onChange={(v) => set('numLot', v)} placeholder="ex. SK-2609" /></Field></G>
      <G n={3}><Field label="Date de réception"><DI value={f.date} onChange={(v) => set('date', v)} /></Field><Field label="DDM (date de durabilité minimale)" help="Ancienne DLUO. Alerte visuelle à 30 jours et après péremption."><DI value={f.dluo} onChange={(v) => set('dluo', v)} /></Field><Field label={`Quantité reçue${pr.unite ? ` (${pr.unite})` : ''}`}><NI value={f.qty} onChange={(v) => set('qty', v)} /></Field></G>
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} /></Field>
      {id ? <Group label="Documents : certificat de conformité, fiche technique, FDS, bon de livraison…"><DocsPanel cible={{ type: 'arrivage', id }} kind="arrivage" locked={isLocked(db, a.date)} /></Group> : <div className="help">Certificats de conformité, fiches techniques et FDS : « Enregistrer et joindre des documents ».</div>}
    </FormSheet>
  );
}
function ProduitForm({ id, onClose, categorie0 }) {
  const { db, act } = useApp(); const p = id ? db.produits.find((x) => x.id === id) : null;
  const [f, set, setF] = useDraft({ nom: p ? p.nom : '', categorie: p ? p.categorie : categorie0 || 'oeno', unite: p ? p.unite : categorie0 === 'sec' ? 'u' : 'g', fourniture: p && p.fourniture ? JSON.parse(JSON.stringify(p.fourniture)) : undefined, suiviStock: p ? p.suiviStock !== false : true, fournisseurId: p ? p.fournisseurId : '', actif: p ? p.actif !== false : true, notes: p ? p.notes : '', reference: p ? p.reference || '' : '', lien: p ? p.lien || '' : '', ftUrl: p ? p.ftUrl || '' : '', fdsUrl: p ? p.fdsUrl || '' : '', fdsNonRequise: p ? !!p.fdsNonRequise : false, famille: p ? p.famille || '' : '', so2: p ? p.so2 || '' : '', ...Object.fromEntries(PRODUIT_INFOS.map(([k]) => [k, p ? p[k] || '' : ''])),
    allergenesListe: p ? allergenesDe(p) : [], allergenesAucun: p ? !!p.allergenesAucun : false, rev: {}, composesL: composesVersChoix(p) }); // 0.40.0-alpha.1 : composés actifs // 0.36.0-alpha.1 : allergènes à cocher, revendications Oui / Non
  const [infosOuv, setInfosOuv] = useState(() => PRODUIT_INFOS.some(([k]) => p && p[k])); useSuiviFiche(p, setF, [...PRODUIT_INFOS.map((x) => x[0]), 'allergenesListe', 'allergenesAucun']);
  const { uid } = useApp();
  const [depot, setDepot] = useState(null); const [veille, setVeille] = useState(false);
  const nomCasse = nomProduitCasse(f.nom.trim()); // nouveau produit : casse du nom harmonisée (0.26.0-alpha.1)
  const save = () => { const s = { ...f, nom: id ? f.nom : nomCasse, ...(f.fourniture === undefined ? { fourniture: undefined } : {}), revendications: f.categorie === 'sec' ? null : f.rev, uid, composes: composesDepuisChoix(f.composesL) }; delete s.composesL; if (!id && s.composes === null) delete s.composes; const r = act((d) => produitSave(d, s, id), id ? 'Produit modifié.' : 'Produit créé (autorisé en Conventionnel par défaut : ajustez les règles).'); if (r.ok) onClose(); };
  const lienOk = lienNorm(f.lien); const foNom = (db.fournisseurs.find((x) => x.id === f.fournisseurId) || {}).nom || '';
  const fds = p ? prodFdsEtat(db, { ...p, categorie: f.categorie, fdsNonRequise: f.fdsNonRequise }) : null;
  return (
    <FormSheet wide={!!id} title={id ? 'Modifier le produit' : 'Nouveau produit'} onClose={onClose} onSave={save}>
      <Field label="Nom" help={f.nom.trim() && nameTaken(db.produits, id ? f.nom : nomCasse, id) ? '⚠ Ce produit existe déjà.' : !id && f.nom.trim() && nomCasse !== f.nom.trim() ? `Enregistré sous « ${nomCasse} »` : ''}><TI value={f.nom} onChange={(v) => set('nom', v)} autoFocus /></Field>
      <G><Field label="Catégorie"><SI value={f.categorie} onChange={(v) => set('categorie', v)} options={Object.keys(CATEGORIES).map((k) => ({ value: k, label: CATEGORIES[k] }))} /></Field><Field label="Unité de stock"><SI value={f.unite} onChange={(v) => set('unite', v)} options={UNITES.map((u) => ({ value: u, label: u === 'u' ? 'u (pièces)' : u }))} /></Field></G>
      <G><Field label="Fournisseur habituel"><SI value={f.fournisseurId} onChange={(v) => set('fournisseurId', v)} placeholder="—" options={db.fournisseurs.map((x) => ({ value: x.id, label: x.nom }))} /></Field><Field label="Référence (code article du fournisseur)"><TI value={f.reference} onChange={(v) => set('reference', v)} placeholder="ex. 30210" /></Field></G>
      <Field label="Page du produit chez le fournisseur" help={f.lien.trim() && !lienOk ? '⚠ Adresse web invalide (ex. https://www.fournisseur.fr/produit).' : 'Fiche du produit sur le site du fournisseur : FT et FDS à jour, documents, conditionnements.'}>
        <div className="flex flex-wrap items-center gap-2"><input className="inp min-w-0 flex-1" inputMode="url" value={f.lien} onChange={(e) => set('lien', e.target.value)} placeholder="https://…" aria-label="Lien vers la page du produit" style={{ minWidth: 200 }} />
          {lienOk ? <a className="btn btn-sm" href={lienOk} target="_blank" rel="noopener noreferrer">🔗 Ouvrir</a> : null}
          {f.nom.trim() ? <a className="btn btn-sm btn-ghost" href={rechercheWeb(`${f.nom} ${foNom}`)} target="_blank" rel="noopener noreferrer" title="Rechercher la page du produit sur le web">🌐 Chercher</a> : null}</div></Field>
      <G><Field label="Fiche technique en ligne" help={f.ftUrl.trim() && !lienNorm(f.ftUrl) ? '⚠ Adresse web invalide.' : ''}><div className="flex items-center gap-2"><input className="inp min-w-0 flex-1" inputMode="url" value={f.ftUrl} onChange={(e) => set('ftUrl', e.target.value)} placeholder="https://…" aria-label="Lien vers la fiche technique" />{lienNorm(f.ftUrl) ? <a className="btn btn-sm" href={lienNorm(f.ftUrl)} target="_blank" rel="noopener noreferrer">📄 Ouvrir</a> : null}</div></Field>
        <Field label="FDS en ligne" help={f.fdsUrl.trim() && !lienNorm(f.fdsUrl) ? '⚠ Adresse web invalide.' : ''}><div className="flex items-center gap-2"><input className="inp min-w-0 flex-1" inputMode="url" value={f.fdsUrl} onChange={(e) => set('fdsUrl', e.target.value)} placeholder="https://…" aria-label="Lien vers la FDS" />{lienNorm(f.fdsUrl) ? <a className="btn btn-sm" href={lienNorm(f.fdsUrl)} target="_blank" rel="noopener noreferrer">⚠ Ouvrir</a> : null}</div></Field></G>
      {f.categorie !== 'sec' ? <G><Field label="Famille"><SI value={f.famille} onChange={(v) => set('famille', v)} placeholder="—" options={CATALOGUE_FAMILLES.map(([k, label]) => ({ value: k, label, t: true }))} /></Field>
        <Field label="Teneur en SO₂" help="Pour estimer le SO₂ total après un ajout : ex. « 150 g/L » (solution), « 0,5 g/g » (métabisulfite), « 5 g/u » (comprimé)."><TI value={f.so2} onChange={(v) => set('so2', v)} placeholder="ex. 150 g/L" /></Field></G> : null}
      {p && p.catalogue ? <p className="help" data-produit-catalogue=""><span>Ajouté depuis le catalogue :</span> <span translate="no">{p.catalogue.titre}{p.catalogue.page ? `, p. ${p.catalogue.page}` : ''}</span>{p.catalogue.conditionnements ? <> · <span>conditionnements :</span> <span translate="no">{p.catalogue.conditionnements}</span></> : null}</p> : null}
      <div className="flex flex-wrap gap-x-5 gap-y-2"><Check checked={f.actif} onChange={(v) => set('actif', v)} label="Produit actif (proposé dans les formulaires)" />{f.categorie !== 'sec' ? <Check checked={f.fdsNonRequise} onChange={(v) => set('fdsNonRequise', v)} label="FDS non requise (produit non classé dangereux, sans fiche de données de sécurité)" /> : null}</div>
      <div className="rounded-md border border-line" data-produit-infos="">
        <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold" aria-expanded={infosOuv} onClick={() => setInfosOuv(!infosOuv)}><span aria-hidden="true">{infosOuv ? '▾' : '▸'}</span>Informations du produit (fiche technique, FDS)<span className="ml-auto text-xs font-normal text-ink2">{PRODUIT_INFOS.filter(([k]) => String(f[k] || '').trim()).length} / {PRODUIT_INFOS.length}</span></button>
        {infosOuv ? <div className="space-y-2 px-3 pb-3">
          <p className="help">Reprises des FT, FDS et certificats déposés (lecture automatique, assistant IA s’il est configuré) : vérifiez-les.</p>
          <G><Field label="Fabricant"><TI value={f.fabricant} onChange={(v) => set('fabricant', v)} /></Field><Field label="Dose d’emploi"><TI value={f.doseEmploi} onChange={(v) => set('doseEmploi', v)} placeholder="ex. 10 à 30 g/hL" /></Field></G>
          <Field label="Composition"><TA value={f.composition} onChange={(v) => set('composition', v)} rows={2} /></Field>
          <Field label="Mode d’emploi"><TA value={f.modeEmploi} onChange={(v) => set('modeEmploi', v)} rows={2} /></Field>
          <G><Field label="Stockage"><TI value={f.stockage} onChange={(v) => set('stockage', v)} /></Field><Field label="Conservation"><TI value={f.conservation} onChange={(v) => set('conservation', v)} placeholder="ex. 3 ans en emballage d’origine fermé" /></Field></G>
          <G><Field label="Allergènes : précisions"><TI value={f.allergenes} onChange={(v) => set('allergenes', v)} placeholder="ex. lysozyme issu de l’œuf…" /></Field><Field label="Utilisation en bio : précisions" help="Le choix Oui / Non se fait dans « Allergènes & revendications »."><TI value={f.usageBio} onChange={(v) => set('usageBio', v)} placeholder="ex. règlement (UE) 2018/848" /></Field></G>
        </div> : null}
      </div>
      <div className="rounded-md border border-line px-3 py-2" data-produit-allergenes-rev="">
        <div className="mb-1 text-sm font-semibold">Allergènes & revendications</div>
        <p className="help">Repris d’office des FT et FDS déposées (à vérifier) ; les revendications sont celles de l’onglet « Produits & règles par revendication ».</p>
        <Group label="Allergènes"><AllergenesChoix liste={f.allergenesListe} aucun={f.allergenesAucun} onChange={(L, a) => setF((x) => ({ ...x, allergenesListe: L, allergenesAucun: !!a && !L.length }))} suggestions={allergenesSuggeres({ ...f, famille: f.famille, allergenesListe: f.allergenesListe })} /></Group>
        {f.categorie !== 'sec' ? <Group label="Revendications" className="mt-2"><RevendicationsChoix p={p} value={f.rev} onChange={(v) => set('rev', v)} /></Group> : null}
      </div>
      {f.categorie !== 'sec' ? <div className="rounded-md border border-line px-3 py-2" data-produit-composes=""><div className="mb-1 text-sm font-semibold">Composés actifs (référentiel réglementaire)</div>
        <p className="help">Servent aux doses maximales et aux teneurs dans le vin (acide sorbique, cuivre…) : indiquez la teneur des produits formulés (ex. citrate de cuivre à 2 %).</p>
        <ComposesChoix auto={refComposesDe({ categorie: f.categorie, nom: f.nom, famille: f.famille, composition: f.composition })} liste={f.composesL} onChange={(L) => set('composesL', L)} /></div> : null}
      <FournitureProduitBox f={f} set={set} />
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} /></Field>
      {p ? (<Group label={`Fiches techniques, FDS et certificats${fds ? ` — ${fds.label}` : ''}`}>
        <DocsPanel cible={{ type: 'produit', id: p.id }} kind="produit" deposer={setDepot} aide="Chaque fichier déposé est lu (type, date de révision) ; une version plus récente remplace la précédente, qui reste dans les versions archivées." />
        {f.categorie !== 'sec' ? <div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span className="text-ink2">En ligne :</span><VeilleChip p={p} onClick={() => setVeille(true)} /></div> : null}
      </Group>) : <div className="help">FT, FDS et certificats : enregistrez le produit puis déposez-les ici, ou déposez-les en groupe dans Intrants › Fiches FT &amp; FDS.</div>}
      {depot ? <FichesDepot fichiers={depot} cible={{ type: 'produit', id: p.id }} onClose={() => setDepot(null)} onFini={(B) => { if (B && B.infos) setInfosOuv(true); }} /> : null}
      {veille ? <VeilleSheet id={p.id} onClose={() => setVeille(false)} /> : null}
    </FormSheet>
  );
}
function FournisseurForm({ id, onClose }) {
  const { db, act } = useApp(); const x = id ? db.fournisseurs.find((y) => y.id === id) : null; const [f, set] = useDraft({ nom: x ? x.nom : '', contact: x ? x.contact : '', roles: x && Array.isArray(x.roles) ? x.roles : [] });
  const save = () => { const r = act((d) => fournisseurSave(d, f, id), 'Fournisseur enregistré.'); if (r.ok) onClose(); };
  return (<FormSheet title={id ? 'Modifier le fournisseur' : 'Nouveau fournisseur'} onClose={onClose} onSave={save}><Field label="Nom"><TI value={f.nom} onChange={(v) => set('nom', v)} autoFocus /></Field><Field label="Contact"><TA value={f.contact} onChange={(v) => set('contact', v)} placeholder="Téléphone, e-mail…" /></Field><Check checked={(f.roles || []).includes('prestataire_tirage')} onChange={(v) => set('roles', v ? uniq([...(f.roles || []), 'prestataire_tirage']) : (f.roles || []).filter((r) => r !== 'prestataire_tirage'))} label="Prestataire de tirage (chantiers sur site)" /></FormSheet>);
}

function DoseInput({ value, onCommit, label }) {
  const [v, setV] = useState(value == null ? '' : String(value)); useEffect(() => setV(value == null ? '' : String(value)), [value]);
  const commit = () => { const n = v.trim() === '' ? null : num(v); if (n !== (value == null ? null : value)) onCommit(n); };
  return <input className="inp num" style={{ minHeight: 32, padding: '2px 8px', maxWidth: 110 }} inputMode="decimal" value={v} placeholder="dose max" aria-label={label} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />;
}
// 0.30.0-alpha.1 : règle d'exemple « à vérifier » (catalogue), règles de substance du cahier des charges qui la restreignent
function RuleCell({ pid, qid, unit }) {
  const { db, act, uid } = useApp(); const r = ruleFor(db, pid, qid) || { autorise: false, doseMax: null }; const du = doseUnit(unit);
  const vu = { aVerifier: false, verifiePar: uid || '', verifieLe: todayISO() }; const pr = prodOf(db, pid); const eff = regleEffective(db, pr, qid);
  const subs = eff && eff.sources ? eff.sources : [];
  return (
    <div className="flex flex-wrap items-center gap-2"><Check checked={r.autorise} label={r.autorise ? 'Autorisé' : 'Interdit'} onChange={(c) => act((d) => regleSet(d, pid, qid, { autorise: c, ...vu }))} />
      {r.autorise && du ? <span className="flex items-center gap-1 text-xs text-ink2"><DoseInput value={r.doseMax} label={`Dose légale max ${qLabel(qid)}`} onCommit={(n) => act((d) => regleSet(d, pid, qid, { doseMax: n, ...vu }))} />{du}</span> : null}
      {r.aVerifier ? <><Chip tone="warn" title={r.source || ''}>{/lu dans/.test(r.source || '') ? 'lu dans un document : à vérifier' : 'exemple à vérifier'}</Chip><Btn size="sm" onClick={() => act((d) => regleSet(d, pid, qid, vu), 'Règle vérifiée.')}>✓ Vérifiée</Btn></> : null}
      <RefAvisCellule pr={pr} qid={qid} r={r} />
      {subs.length ? <span className="text-xs text-bad"><span>cahier des charges :</span> <span translate="no">{subs.map((x) => x.libelle || x.mot).join(', ')}</span> → {eff.autorise ? <><span>max</span> <span translate="no">{fmt(eff.doseMax, 2)} {du}</span></> : <span>interdit</span>}</span> : null}</div>
  );
}

// avis du référentiel réglementaire dans la cellule (0.40.0-alpha.1) : chip, et « Aligner » si la règle du produit s'en écarte
function RefAvisCellule({ pr, qid, r }) {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('intrants'); const ref = useMemo(() => refRegleProduit(db, pr, qid), [db, pr, qid]);
  if (!ref) return null; const ecart = !!r.autorise === ref.interdit || (!ref.interdit && ref.doseMax != null && (!hasNum(r.doseMax) || num(r.doseMax) > ref.doseMax + 1e-9));
  return <span className="flex flex-wrap items-center gap-1"><RefAvisChip avis={{ ...ref, du: doseUnit(pr.unite) }} />{ecart && !lect ? <Btn size="sm" onClick={() => act((d) => regleDepuisReferentiel(d, pr.id, qid, uid), 'Règle alignée sur le référentiel (à vérifier).')} data-ref-aligner={`${pr.id}|${qid}`}>Aligner</Btn> : null}</span>;
}
function TabIntrants() {
  const { db, R, act, confirm, camp, setTab } = useApp();
  const [sub, setSub] = useState('stocks'); const [form, setForm] = useState(null); const [recap, setRecap] = useState(false); const [view, setView] = useState('lots'); const [onlyStock, setOnlyStock] = useState(true); const [cat, setCat] = useState(''); const [q, setQ] = useState('');
  const arrs = db.arrivages.map((a) => ({ id: a.id, a, pr: prodOf(db, a.produitId), rest: arrivalRest(R, a), used: R.arrUsed[a.id] || 0 })).sort((x, y) => (x.a.date < y.a.date ? 1 : -1))
    .filter((r) => (!onlyStock || r.rest > 0.0001) && (!cat || r.pr.categorie === cat) && (!q || norm(`${r.pr.nom} ${r.a.numLot}`).includes(norm(q))));
  const live = db.arrivages.map((a) => ({ a, rest: arrivalRest(R, a), st: dluoState(a.dluo) })).filter((x) => x.rest > 0.0001);
  const nExp = live.filter((x) => x.st.k === 'expire').length, nSoon = live.filter((x) => x.st.k === 'bientot').length;
  const nCatV = catalogueListe(db).reduce((t, c) => t + (c.aVerifier || 0), 0); const nPlafV = plafondsDe(db).filter((p) => p.aVerifier).length + (db.regles || []).filter((r) => r.aVerifier).length; // lignes et plafonds « à vérifier » (0.30.0-alpha.1)
  const perProd = db.produits.filter((p) => (!cat || p.categorie === cat) && (!q || norm(p.nom).includes(norm(q)))).map((p) => { const ls = live.filter((x) => x.a.produitId === p.id); const dl = ls.filter((x) => x.a.dluo).sort((x, y) => (x.a.dluo < y.a.dluo ? -1 : 1))[0]; return { id: p.id, p, total: sum(ls, (x) => x.rest), n: ls.length, dl }; }).filter((r) => !onlyStock || r.n > 0).sort((x, y) => x.p.nom.localeCompare(y.p.nom, 'fr'));
  const ask = async (title, fn, okMsg) => { const ok = await confirm({ title, body: 'Cette suppression est définitive.', ok: 'Supprimer', danger: true }); if (ok) { const r = act(fn, okMsg); if (r && r.ok && r.docs) r.docs.forEach((k) => docDel(k).catch(() => { /* déjà absent */ })); } };
  const RF = prodFichesResume(db); const nFds = RF.manquantes + RF.anciennes + RF.nouvelles;
  const dChip = (a, rest) => (rest > 0.0001 ? <Chip className={dluoState(a.dluo).cls}>{dluoState(a.dluo).label}</Chip> : <Chip>épuisé</Chip>);
  const fo = (id) => (db.fournisseurs.find((x) => x.id === id) || {}).nom || '—';
  const prodRows = db.produits.filter((p) => (!cat || p.categorie === cat) && (!q || norm(p.nom).includes(norm(q)))).sort((x, y) => x.nom.localeCompare(y.nom, 'fr'));
  return (
    <div>
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label="Lots en stock" value={fmt(live.length)} sub={`${fmt(db.produits.length)} produits référencés`} /><Kpi label="DDM dépassée" value={fmt(nExp)} tone={nExp ? 'bad' : undefined} sub="lots encore en stock" /><Kpi label="DDM < 30 jours" value={fmt(nSoon)} tone={nSoon ? 'warn' : undefined} /><Kpi label="FDS à revoir" value={fmt(RF.manquantes + RF.anciennes)} tone={RF.manquantes ? 'bad' : RF.anciennes ? 'warn' : 'ok'} sub={RF.manquantes > 1 ? `${fmt(RF.manquantes)} manquantes · ${fmt(RF.anciennes)} de plus de ${PROD_FDS_ANS} ans` : `${fmt(RF.manquantes)} manquante · ${fmt(RF.anciennes)} de plus de ${PROD_FDS_ANS} ans`} /><Kpi label="Fournisseurs" value={fmt(db.fournisseurs.length)} />
      </div>
      <SubNav value={sub === 'plafonds' || sub === 'referentiel' ? 'labels' : sub} onChange={setSub} items={[{ id: 'stocks', label: 'Stocks & arrivages', badge: nExp + nSoon || null }, { id: 'regles', label: 'Produits & règles par revendication' }, { id: 'fiches', label: 'Fiches FT & FDS', badge: nFds || null }, { id: 'catalogues', label: 'Catalogues', badge: nCatV || null }, { id: 'labels', label: '⚖ Labels & cahiers des charges', badge: nPlafV || null }, { id: 'fourn', label: 'Fournisseurs' }]} />
      {sub === 'fiches' ? <IntrantsFichesView /> : null}
      {sub === 'catalogues' ? <CataloguesView /> : null}
      {sub === 'labels' || sub === 'plafonds' || sub === 'referentiel' ? <LabelsView /> : null}
      {['stocks', 'regles'].includes(sub) ? <div className="mb-3 flex flex-wrap items-center gap-2"><TI value={q} onChange={setQ} placeholder="Rechercher produit, n° de lot…" style={{ width: 240 }} aria-label="Rechercher" /><SI value={cat} onChange={setCat} placeholder="Toutes catégories" style={{ width: 'auto' }} options={Object.keys(CATEGORIES).map((k) => ({ value: k, label: CATEGORIES[k] }))} aria-label="Catégorie" />
        {sub === 'stocks' ? <><Check checked={onlyStock} onChange={setOnlyStock} label="En stock seulement" /><SI value={view} onChange={setView} style={{ width: 'auto' }} options={[{ value: 'lots', label: 'Par lot fournisseur' }, { value: 'prod', label: 'Par produit' }, { value: 'mouv', label: 'Historique des mouvements' }]} aria-label="Vue" /><span className="ml-auto" /><Btn onClick={() => setRecap(true)} data-recap-ouvrir="">🖨 Fiche récapitulative</Btn><Btn disabled={camp.figee} onClick={() => setForm({ t: 'regul' })} data-regul-ouvrir="">± Régulariser</Btn><Btn kind="primary" disabled={camp.figee} onClick={() => setForm({ t: 'arr' })}>+ Nouvel arrivage</Btn></> : <><span className="ml-auto" /><Btn onClick={() => setRecap(true)} data-recap-ouvrir="">🖨 Fiche récapitulative</Btn><Btn kind="primary" onClick={() => setForm({ t: 'prod' })}>+ Nouveau produit</Btn></>}</div> : null}
      {sub === 'stocks' && view === 'mouv' ? <MouvementsView onRegul={(o) => setForm({ t: 'regul', ...o })} /> : null}
      {sub === 'stocks' && view === 'lots' ? <Tbl rows={arrs} empty="Aucun arrivage pour ces critères." cols={[
        { h: 'Produit', r: (r) => <b translate="no">{r.pr.nom}</b> }, { h: 'Fournisseur', r: (r) => <span translate="no">{fo(r.a.fournisseurId)}</span> }, { h: 'N° lot fournisseur', r: (r) => <span className="num" translate="no">{r.a.numLot}</span> }, { h: 'Reçu le', r: (r) => <span className="num">{fmtDate(r.a.date)}</span> },
        { h: 'DDM', r: (r) => dChip(r.a, r.rest) }, { h: 'Reçu', cls: 'r', r: (r) => <span className="num">{fmt(r.a.qty, 2)} {r.pr.unite}</span> }, { h: 'Utilisé', cls: 'r', r: (r) => <span className="num">{fmt(r.used, 2)}</span> },
        { h: 'Docs', r: (r) => <DocsButton cible={{ type: 'arrivage', id: r.a.id }} kind="arrivage" title={`${r.pr.nom} · lot ${r.a.numLot}`} /> },
        { h: 'Restant', r: (r) => <div style={{ minWidth: 120 }}><b className={`num ${r.rest < -0.001 ? 'text-bad' : ''}`}>{fmt(r.rest, 2)} {r.pr.unite}</b><div className="bar mt-1" style={{ height: 6 }}><i style={{ width: `${clamp((r.rest / r.a.qty) * 100, 0, 100)}%`, background: 'var(--accent)' }} /></div></div> },
        { h: '', r: (r) => { const rg = <Btn size="sm" disabled={camp.figee} onClick={() => setForm({ t: 'regul', arrivageId: r.a.id })} title="Inventaire, casse, perte, écart…" data-regul-lot={r.a.id}>± Régulariser</Btn>; return isLocked(db, r.a.date) ? <div className="flex flex-wrap items-center gap-1"><Chip>🔒 figée</Chip>{rg}</div> : <div className="flex gap-1">{rg}<Btn size="sm" onClick={() => setForm({ t: 'arr', id: r.a.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => ask(`Supprimer l’arrivage ${r.a.numLot} ?`, (d) => arrivageDelete(d, r.a.id), 'Arrivage supprimé.')}>Supprimer</Btn></div>; } }]} /> : null}
      {sub === 'stocks' && view === 'prod' ? <Tbl rows={perProd} empty="Aucun produit en stock." cols={[
        { h: 'Produit', r: (r) => <b translate="no">{r.p.nom}</b> }, { h: 'Catégorie', r: (r) => CATEGORIES[r.p.categorie] }, { h: 'Stock total', cls: 'r', r: (r) => <b className="num">{fmt(r.total, 2)} {r.p.unite}</b> }, { h: 'Lots en stock', cls: 'r', r: (r) => <span className="num">{r.n}</span> },
        { h: 'DDM la plus proche', r: (r) => (r.dl ? <Chip className={r.dl.st.cls}>{r.dl.st.label}</Chip> : '—') }, { h: 'Fournisseur', r: (r) => <span translate="no">{fo(r.p.fournisseurId)}</span> }]} /> : null}
      {sub === 'regles' ? (<>
        <Notice tone="info" title="Autorisation et dose légale maximale par revendication"><b>{QUALIFS.map((q) => `${q.code} (rang ${q.rang})`).join(' · ')}.</b> <span>Un intrant « Interdit » pour la revendication de la portion déclenche une alerte de déclassement (à valider dans Opérations & Assemblages › Déclassements). Les matières sèches ne sont pas soumises aux règles. Valeurs d’exemple non officielles : adaptez-les à votre cahier des charges.</span> <button type="button" className="linkish" onClick={() => setTab('params', 'listes')}>Modifier ou ajouter des revendications…</button></Notice>
        <div className="mt-3 hidden md:block"><Tbl rows={prodRows} empty="Aucun produit." cols={[{ h: 'Produit', r: (p) => <div><b translate="no">{p.nom}</b>{p.actif === false ? <Chip className="ml-1">inactif</Chip> : null}{['manquante', 'ancienne'].includes(prodFdsEtat(db, p).k) ? <span className="ml-1"><FdsChipProd p={p} /></span> : null}<div className="text-xs text-ink2">{CATEGORIES[p.categorie]} · <span translate="no">{p.unite} · {fo(p.fournisseurId)}</span></div>{allergenesTexte(p) ? <div className="text-xs" data-allergenes-produit=""><span className="text-ink2">Allergènes :</span> <span>{allergenesTexte(p)}</span></div> : null}</div> },
          ...QUALIFS.map((qd) => ({ h: `${qd.code} (rang ${qd.rang})`, r: (p) => (p.categorie === 'sec' ? <span className="text-xs text-ink2">sans objet</span> : <RuleCell pid={p.id} qid={qd.id} unit={p.unite} />) })),
          { h: '', r: (p) => <div className="flex gap-1"><Btn size="sm" onClick={() => setForm({ t: 'prod', id: p.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => ask(`Supprimer « ${p.nom} » ?`, (d) => produitDelete(d, p.id), 'Produit supprimé.')}>Supprimer</Btn></div> }]} /></div>
        <div className="mt-3 space-y-2 md:hidden">{prodRows.map((p) => (<div key={p.id} className="card p-3"><div className="flex items-start justify-between gap-2"><div><b translate="no">{p.nom}</b><div className="text-xs text-ink2">{CATEGORIES[p.categorie]} · <span translate="no">{p.unite} · {fo(p.fournisseurId)}</span></div></div><Btn size="sm" onClick={() => setForm({ t: 'prod', id: p.id })}>Modifier</Btn></div>
          {p.categorie === 'sec' ? <div className="mt-2 text-xs text-ink2">Matière sèche : sans règle de revendication.</div> : QUALIFS.map((qd) => <div key={qd.id} className="mt-2 border-t border-line pt-2"><div className="mb-1"><QChip id={qd.id} /></div><RuleCell pid={p.id} qid={qd.id} unit={p.unite} /></div>)}</div>))}</div>
      </>) : null}
      {sub === 'fourn' ? <Sec title="Fournisseurs" right={<Btn kind="primary" onClick={() => setForm({ t: 'fo' })}>+ Nouveau fournisseur</Btn>}><Tbl rows={db.fournisseurs} empty="Aucun fournisseur." cols={[{ h: 'Nom', r: (x) => <b translate="no">{x.nom}</b> }, { h: 'Contact', r: (x) => (x.contact ? <span translate="no">{x.contact}</span> : '—') }, { h: 'Produits', cls: 'r', r: (x) => <span className="num">{db.produits.filter((p) => p.fournisseurId === x.id).length}</span> }, { h: 'Arrivages', cls: 'r', r: (x) => <span className="num">{db.arrivages.filter((a) => a.fournisseurId === x.id).length}</span> },
        { h: '', r: (x) => <div className="flex gap-1"><Btn size="sm" onClick={() => setForm({ t: 'fo', id: x.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => ask(`Supprimer « ${x.nom} » ?`, (d) => fournisseurDelete(d, x.id), 'Fournisseur supprimé.')}>Supprimer</Btn></div> }]} /></Sec> : null}
      {recap ? <RecapIntrantsSheet onClose={() => setRecap(false)} /> : null}
      {form && form.t === 'regul' ? <RegulForm id={form.id} arrivageId0={form.arrivageId} produitId0={form.produitId} onClose={() => setForm(null)} /> : null}
      {form && form.t === 'arr' ? <ArrivageForm id={form.id} onClose={() => setForm(null)} /> : form && form.t === 'prod' ? <ProduitForm id={form.id} onClose={() => setForm(null)} /> : form && form.t === 'fo' ? <FournisseurForm id={form.id} onClose={() => setForm(null)} /> : null}
    </div>
  );
}
TABS_REG.intrants = TabIntrants;
