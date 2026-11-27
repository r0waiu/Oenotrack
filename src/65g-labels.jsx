/* ============ INTRANTS › LABELS & CAHIERS DES CHARGES (0.43.0-alpha.1) ============
   Réunit « Revendications & plafonds » et « Référentiel réglementaire » : revendications et labels appliqués, SO₂ total (plafonds de
   l'exploitation et des labels côte à côte), substances et composés, produits par revendication, textes de référence.
   Les plafonds et les composés sont liés aux produits des catalogues (automatique, ajustable), repris par les produits mis en stock. */

const LABELS_VUES = [{ id: 'revendications', label: 'Revendications & labels' }, { id: 'so2', label: 'SO₂ total' }, { id: 'substances', label: 'Substances & composés' }, { id: 'produits', label: 'Produits par revendication' }, { id: 'textes', label: 'Textes de référence' }];
function LabelsView() {
  const [vue, setVue] = useState(() => { try { const v = window.localStorage.getItem('oenotrack-labels-vue'); return LABELS_VUES.some((x) => x.id === v) ? v : 'revendications'; } catch (e) { return 'revendications'; } });
  const choisir = (v) => { setVue(v); try { window.localStorage.setItem('oenotrack-labels-vue', v); } catch (e) { /* stockage indisponible */ } };
  return (<div data-labels="">
    <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Labels & cahiers des charges">{LABELS_VUES.map((x) => <button key={x.id} type="button" role="tab" aria-selected={vue === x.id} className={cx('btn btn-sm', vue === x.id && 'btn-primary')} onClick={() => choisir(x.id)} data-labels-vue={x.id}>{x.label}</button>)}</div>
    {vue === 'revendications' ? <ReferentielView partie="revendications" /> : null}
    {vue === 'so2' ? <><LabelsSo2Synthese /><PlafondsView partie="so2" /><ReferentielView partie="so2" /></> : null}
    {vue === 'substances' ? <><PlafondsView partie="substances" /><ReferentielView partie="matrice" /></> : null}
    {vue === 'produits' ? <RevendicationSyntheseSec /> : null}
    {vue === 'textes' ? <ReferentielView partie="textes" /> : null}
  </div>);
}
// SO₂ total par revendication et type de vin : exploitation, labels, plafond retenu (les deux sources côte à côte)
function LabelsSo2Synthese() {
  const { db } = useApp(); const S = useMemo(() => labelsSo2Synthese(db), [db]);
  return (<Sec title="SO₂ total retenu par revendication">
    <p className="help">Le plus bas s’applique ; un plafond vérifié par l’exploitation pour la revendication l’emporte sur ceux des labels.</p>
    <div data-labels-so2=""><Tbl rows={S.map((x) => ({ ...x, id: `${x.qualifId}|${x.vin}` }))} empty="Aucun plafond de SO₂." cols={[
      { h: 'Revendication', r: (x) => <QChip id={x.qualifId} /> }, { h: 'Vins', r: (x) => vinTypeLabel(x.vin) },
      { h: 'Exploitation', cls: 'r', r: (x) => (x.exploitation ? <span className="num" translate="no">{`${fmt(x.exploitation.valeur, 0)} mg/L`}</span> : '—') },
      { h: 'Labels et cahiers des charges', cls: 'r', r: (x) => (x.referentiel ? <span className="num"><span translate="no">{`${fmt(x.referentiel.valeur, 0)} mg/L`}</span> <span className="text-xs text-ink2" translate="no">{`(${refLabelNom(x.referentiel.label)})`}</span></span> : '—') },
      { h: 'Retenu', cls: 'r', r: (x) => (x.retenu ? <b className="num" translate="no">{`${fmt(x.retenu.valeur, 0)} mg/L`}</b> : '—') },
      { h: '', r: (x) => (x.ecart ? <Chip tone="warn" title="Le plafond de l’exploitation est plus haut que celui des labels">écart</Chip> : null) },
    ]} /></div>
  </Sec>);
}
// produits des catalogues liés à un plafond : automatiques (retirables), ajoutés à la main, recherche pour en lier d'autres
function PlafondCatalogueSheet({ id, onClose }) {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('intrants'); const [q, setQ] = useState(''); const x = plafondsDe(db).find((p) => p.id === id);
  const L = useMemo(() => (x ? plafondProduitsCatalogue(db, x) : []), [db, x]);
  const res = useMemo(() => (q.trim().length >= 3 ? catalogueChercher(db, { q }).filter((e) => !L.some((y) => y.e.id === e.id)).slice(0, 12) : []), [db, q, L]);
  if (!x) return null; const set = (eid, etat, msg) => act((d) => plafondLienSet(d, id, eid, etat, uid), msg);
  return (<Sheet wide title={<span>Produits des catalogues — <span translate="no">{x.objet === 'so2t' ? `SO₂ total ${vinTypeLabel(x.vin)} · ${qLabel(x.qualifId)}` : `${x.libelle || x.mot} · ${qLabel(x.qualifId)}`}</span></span>} sub="Liés d’office d’après le mot-clé (ou l’apport de SO₂) ; ajustables. Un produit mis en stock depuis un catalogue suit ce choix." onClose={onClose}>
    <div data-plafond-liens={id}><Tbl rows={L.map((y) => ({ ...y, id: y.e.id }))} empty="Aucun produit des catalogues lié." cols={[
      { h: 'Produit', r: (y) => <div><b translate="no">{y.e.nom}</b><div className="text-xs text-ink2" translate="no">{`${y.e.fournisseur || ''}${y.e.marque && y.e.marque !== y.e.fournisseur ? ` · ${y.e.marque}` : ''}`}</div></div> },
      { h: 'Liaison', r: (y) => (y.manuel === 'ajout' ? <Chip tone="info">ajouté à la main</Chip> : y.manuel === 'retrait' ? <Chip>retiré</Chip> : <Chip tone="good">automatique</Chip>) },
      { h: '', r: (y) => (lect ? null : y.lie ? <Btn size="sm" onClick={() => set(y.e.id, y.auto ? 'retrait' : null, 'Produit délié.')}>Délier</Btn> : <Btn size="sm" onClick={() => set(y.e.id, y.auto ? null : 'ajout', 'Produit lié.')}>Rétablir</Btn>) },
    ]} /></div>
    {lect ? null : <div className="mt-3"><Field label="Lier un autre produit des catalogues"><TI value={q} onChange={setQ} placeholder="Nom du produit (3 lettres au moins)…" aria-label="Chercher un produit des catalogues" /></Field>
      {res.map((e) => <div key={e.id} className="flex flex-wrap items-center gap-2 border-b border-line py-1"><span translate="no">{e.nom}</span><span className="text-xs text-ink2" translate="no">{e.fournisseur}</span><Btn size="sm" className="ml-auto" onClick={() => set(e.id, 'ajout', 'Produit lié.')}>＋ Lier</Btn></div>)}</div>}
  </Sheet>);
}
// produits des catalogues portant un composé actif : reconnus d'après le nom (retirables) ou choisis
function ComposeCatalogueSheet({ composeId, onClose }) {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('intrants'); const [q, setQ] = useState(''); const k = refCompose(composeId) || {};
  const L = useMemo(() => refCatalogueParCompose(db, composeId), [db, composeId]);
  const res = useMemo(() => (q.trim().length >= 3 ? catalogueChercher(db, { q }).filter((e) => !L.some((y) => y.e.id === e.id)).slice(0, 12) : []), [db, q, L]);
  const changer = (e, avec) => { const cur = refComposesCatalogue(db, e).map((c) => ({ id: c.id, ...(c.supposee ? {} : { part: c.part }) })); const nv = avec ? [...cur.filter((c) => c.id !== composeId), { id: composeId }] : cur.filter((c) => c.id !== composeId); act((d) => refComposesCatalogueSet(d, e.id, nv, uid), avec ? 'Composé ajouté au produit.' : 'Composé retiré du produit.'); };
  return (<Sheet wide title={<span>Produits des catalogues — <span translate="no">{k.label || composeId}</span></span>} sub="Reconnus d’après le nom et la famille ; ajustables. Un produit mis en stock depuis un catalogue reprend ces composés." onClose={onClose}>
    <div data-compose-liens={composeId}><Tbl rows={L.map((y) => ({ ...y, id: y.e.id }))} empty="Aucun produit des catalogues." cols={[
      { h: 'Produit', r: (y) => <div><b translate="no">{y.e.nom}</b><div className="text-xs text-ink2" translate="no">{y.e.fournisseur || ''}</div></div> },
      { h: 'Composés', r: (y) => <span className="text-xs" translate="no">{refComposesCatalogue(db, y.e).map((c) => (refCompose(c.id) || {}).label).join(', ')}</span> },
      { h: 'Liaison', r: (y) => (y.choisi ? <Chip tone="info">choisie</Chip> : <Chip tone="good">automatique</Chip>) },
      { h: '', r: (y) => (lect ? null : <span className="flex gap-1"><Btn size="sm" onClick={() => changer(y.e, false)}>Retirer ce composé</Btn>{y.choisi ? <Btn size="sm" kind="ghost" onClick={() => act((d) => refComposesCatalogueSet(d, y.e.id, null, uid), 'Liaison automatique rétablie.')}>↺ Automatique</Btn> : null}</span>) },
    ]} /></div>
    {lect ? null : <div className="mt-3"><Field label="Ajouter ce composé à un produit des catalogues"><TI value={q} onChange={setQ} placeholder="Nom du produit (3 lettres au moins)…" aria-label="Chercher un produit des catalogues" /></Field>
      {res.map((e) => <div key={e.id} className="flex flex-wrap items-center gap-2 border-b border-line py-1"><span translate="no">{e.nom}</span><span className="text-xs text-ink2" translate="no">{e.fournisseur}</span><Btn size="sm" className="ml-auto" onClick={() => changer(e, true)}>＋ Ajouter</Btn></div>)}</div>}
  </Sheet>);
}
