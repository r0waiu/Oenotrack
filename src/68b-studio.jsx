/* ============ PARAMÈTRES : atelier des contenants & couleurs · crus (villages) · apporteurs · sites ============ */
// 0.38.0-alpha.3 : la couleur est enregistrée après une pause du sélecteur (plus à chaque mouvement de la souris)
const ColorInp = ({ value, onChange, label }) => { const [v, changer, envoyer] = useDiffere(value || '#999999', onChange, 250); return (<input type="color" className="h-9 w-12 cursor-pointer rounded border border-line bg-surface p-0.5" aria-label={label} value={v || '#999999'} onChange={(e) => changer(e.target.value)} onBlur={envoyer} />); };

function StudioView() {
  const { db, act } = useApp(); const ap = db.apparence;
  const [nt, setNt] = useState({ label: '', forme: 'cuve' }); const [nm, setNm] = useState({ label: '', couleur: '#B9C4CC', finition: 'lisse' });
  const [mx, setMx] = useState({ nom: '', cepages: [], couleur: '#B5835A' });
  const setAp = (patch, msg) => act((d) => apparenceSet(d, patch), msg);
  const prevBands = [{ vol: 60, color: cepageColor(db, (db.lists.cepages[0] || {}).id) }];
  const firstMat = db.lists.matieres[0] || {};
  return (
    <div className="space-y-6">
      <Sec title="Types de contenants (forme du dessin)">
        <p className="mb-3 text-sm text-ink2">Chaque type est dessiné avec la forme choisie. Ajoutez vos propres types (ex. « Cuve tronconique bois ») et associez-leur une forme.</p>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))' }}>
          {db.lists.typesContenant.map((t) => (
            <div key={t.id} className="card flex items-center gap-3 p-3">
              <ContainerSVG forme={t.forme} matColor={firstMat.couleur} finition={firstMat.finition} bands={prevBands} volMax={100} width={54} />
              <div className="min-w-0 flex-1 space-y-1">
                <input className="inp" defaultValue={t.label} aria-label="Libellé du type" onBlur={(e) => { if (e.target.value.trim() !== t.label) act((d) => typeCont(d, 'edit', t.id, { label: e.target.value }), 'Type renommé.'); }} />
                <SI value={t.forme} onChange={(v) => act((d) => typeCont(d, 'edit', t.id, { forme: v }))} options={FORMES.map((f) => ({ value: f.id, label: f.label }))} aria-label="Forme" />
                <div className="flex items-center justify-between text-xs text-ink2"><span>{listUsage(db, 'typesContenant', t.id)} contenant(s)</span><button type="button" className="linkish text-bad" onClick={() => act((d) => typeCont(d, 'del', t.id), 'Type supprimé.')}>Supprimer</button></div>
              </div>
            </div>))}
          <div className="card space-y-2 p-3"><div className="lbl">Nouveau type</div><TI value={nt.label} onChange={(v) => setNt({ ...nt, label: v })} placeholder="ex. Cuve tronconique" /><SI value={nt.forme} onChange={(v) => setNt({ ...nt, forme: v })} options={FORMES.map((f) => ({ value: f.id, label: f.label }))} /><Btn kind="primary" size="sm" onClick={() => { const r = act((d) => typeCont(d, 'add', null, nt), 'Type ajouté.'); if (r.ok) setNt({ label: '', forme: 'cuve' }); }}>＋ Ajouter</Btn></div>
        </div>
      </Sec>
      <Sec title="Matières (couleur et finition du dessin)">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))' }}>
          {db.lists.matieres.map((m) => (
            <div key={m.id} className="card flex items-center gap-3 p-3">
              <ContainerSVG forme="cuve" matColor={m.couleur} finition={m.finition} bands={prevBands} volMax={100} width={48} />
              <div className="min-w-0 flex-1 space-y-1">
                <input className="inp" defaultValue={m.label} aria-label="Libellé de la matière" onBlur={(e) => { if (e.target.value.trim() !== m.label) act((d) => matiereCont(d, 'edit', m.id, { label: e.target.value }), 'Matière renommée.'); }} />
                <div className="flex items-center gap-2"><ColorInp label="Couleur" value={m.couleur} onChange={(v) => act((d) => matiereCont(d, 'edit', m.id, { couleur: v }))} /><SI value={m.finition} onChange={(v) => act((d) => matiereCont(d, 'edit', m.id, { finition: v }))} options={FINITIONS.map((f) => ({ value: f.id, label: f.label }))} aria-label="Finition" /></div>
                <div className="flex items-center justify-between text-xs text-ink2"><span>{listUsage(db, 'matieres', m.id)} contenant(s)</span><button type="button" className="linkish text-bad" onClick={() => act((d) => matiereCont(d, 'del', m.id), 'Matière supprimée.')}>Supprimer</button></div>
              </div>
            </div>))}
          <div className="card space-y-2 p-3"><div className="lbl">Nouvelle matière</div><TI value={nm.label} onChange={(v) => setNm({ ...nm, label: v })} placeholder="ex. Polyéthylène" /><div className="flex gap-2"><ColorInp label="Couleur" value={nm.couleur} onChange={(v) => setNm({ ...nm, couleur: v })} /><SI value={nm.finition} onChange={(v) => setNm({ ...nm, finition: v })} options={FINITIONS.map((f) => ({ value: f.id, label: f.label }))} /></div><Btn kind="primary" size="sm" onClick={() => { const r = act((d) => matiereCont(d, 'add', null, nm), 'Matière ajoutée.'); if (r.ok) setNm({ label: '', couleur: '#B9C4CC', finition: 'lisse' }); }}>＋ Ajouter</Btn></div>
        </div>
      </Sec>
      <Sec title="Ce que montrent les contenants (plan et cartes)">
        <div className="card space-y-3 p-4" data-section="vue-contenants">
          <div className="flex flex-wrap items-center gap-3"><VueChoix /></div>
          <p className="help">Le <b>contour</b> et la <b>couleur de l’intérieur</b> suivent chacun un critère ; le <b>motif</b> (uni, hachures, pointillés…) ajoute un second critère dans l’intérieur : par exemple couleur = cépages et motif = fractions (cuvée unie, tailles hachurées, rebêche pointillée). Les mêmes réglages servent au plan imprimé.</p>
          <MotifsEditeur />
        </div>
      </Sec>
      <Sec title="Couleur de l’intérieur : fractions">
        <div className="flex flex-wrap gap-4">{fracList(db).map((x) => <label key={x.id} className="flex items-center gap-2 text-sm"><ColorInp label={x.label} value={valColor(db, 'fraction', x.id)} onChange={(v) => setAp({ fractionColors: { ...(ap.fractionColors || {}), [x.id]: v } })} />{x.label}</label>)}</div>
        <p className="help mt-2">Utilisées quand l’intérieur ou le contour montre les fractions (un lot de plusieurs fractions prend la couleur du mélange).</p>
      </Sec>
      <Sec title="Couleur de l’intérieur : cépages">
        <div className="flex flex-wrap gap-4">{db.lists.cepages.map((c) => <label key={c.id} className="flex items-center gap-2 text-sm"><ColorInp label={c.label} value={cepageColor(db, c.id)} onChange={(v) => setAp({ cepageColors: { ...ap.cepageColors, [c.id]: v } })} />{c.label}</label>)}
          <label className="flex items-center gap-2 text-sm"><ColorInp label="Origine inconnue" value={ap.inconnuColor} onChange={(v) => setAp({ inconnuColor: v })} />Composition inconnue</label></div>
        <p className="help mt-2">Un contenant qui contient plusieurs cépages prend la couleur du mélange (moyenne pondérée), sauf si vous avez défini une couleur pour cet assemblage précis ci-dessous.</p>
      </Sec>
      <Sec title="Couleur de l’intérieur : assemblages de cépages">
        <Tbl rows={ap.melanges || []} empty="Aucune couleur d’assemblage personnalisée : la couleur est calculée automatiquement." cols={[
          { h: 'Couleur', r: (m) => <ColorInp label={m.nom} value={m.couleur} onChange={(v) => setAp({ melanges: ap.melanges.map((x) => (x.id === m.id ? { ...x, couleur: v } : x)) })} /> },
          { h: 'Nom', r: (m) => <b>{m.nom}</b> }, { h: 'Cépages (exactement)', r: (m) => m.cepages.map((c) => lbl(db, 'cepages', c)).join(' + ') },
          { h: '', r: (m) => <Btn size="sm" kind="danger" onClick={() => setAp({ melanges: ap.melanges.filter((x) => x.id !== m.id) }, 'Couleur d’assemblage retirée.')}>Retirer</Btn> }]} />
        <div className="card mt-3 flex flex-wrap items-end gap-3 p-3">
          <Field label="Nom" className="min-w-[160px] flex-1"><TI value={mx.nom} onChange={(v) => setMx({ ...mx, nom: v })} placeholder="ex. Blanc de noirs" /></Field>
          <Group label="Cépages de l’assemblage"><div className="flex flex-wrap gap-3">{db.lists.cepages.map((c) => <Check key={c.id} checked={mx.cepages.includes(c.id)} onChange={(v) => setMx({ ...mx, cepages: v ? [...mx.cepages, c.id] : mx.cepages.filter((x) => x !== c.id) })} label={c.label} />)}</div></Group>
          <Group label="Couleur"><ColorInp label="Couleur" value={mx.couleur} onChange={(v) => setMx({ ...mx, couleur: v })} /></Group>
          <Btn kind="primary" onClick={() => { if (mx.cepages.length < 2) return act(() => fail('Cochez au moins deux cépages.')); const key = [...mx.cepages].sort().join('|'); if ((ap.melanges || []).some((m) => [...m.cepages].sort().join('|') === key)) return act(() => fail('Cet assemblage a déjà une couleur.')); setAp({ melanges: [...(ap.melanges || []), { id: `mx${Date.now()}`, nom: mx.nom.trim() || mx.cepages.map((c) => lbl(db, 'cepages', c)).join(' + '), cepages: mx.cepages, couleur: mx.couleur }] }, 'Couleur d’assemblage ajoutée.'); setMx({ nom: '', cepages: [], couleur: '#B5835A' }); return null; }}>＋ Ajouter</Btn>
        </div>
      </Sec>
      <Sec title="Couleur du contour">
        <p className="help mb-3">Le critère du contour se choisit plus haut (« Ce que montrent les contenants ») ; voici les couleurs de la revendication et du classement.</p>
        <div className="grid2">
          <Group label="Revendications"><div className="flex flex-wrap gap-4">{QUALIFS.map((q) => <label key={q.id} className="flex items-center gap-2 text-sm"><ColorInp label={q.code} value={qColor(db, q.id)} onChange={(v) => act((d) => richListCont(d, 'qualifs', 'edit', q.id, { couleur: v }))} />{q.code}</label>)}</div></Group>
          <Group label={ECH.nom}><div className="flex flex-wrap gap-4">{ECHELLES.map((e) => <label key={e.id} className="flex items-center gap-2 text-sm"><ColorInp label={e.label} value={eColor(db, e.id)} onChange={(v) => act((d) => richListCont(d, 'echelles', 'edit', e.id, { couleur: v }))} />{e.label}</label>)}</div></Group>
        </div>
        <div className="mt-3"><Btn size="sm" onClick={() => setAp(DEFAULT_APPARENCE(), 'Couleurs par défaut rétablies.')}>Rétablir les couleurs par défaut</Btn></div>
      </Sec>
    </div>
  );
}

function CrusView() {
  const { db, act, confirm } = useApp(); const [q, setQ] = useState(''); const [f, setF] = useState('all'); const [form, setForm] = useState(null);
  const rows = db.crus.filter((c) => (f === 'all' || (f === 'custom' ? c.custom : f === 'masques' ? c.masque : f === 'visibles' ? !c.masque : f === '' ? !eDef(c.echelle) : c.echelle === f)) && cruMatch(c, q));
  const nMask = db.crus.filter((c) => c.masque).length; const vis = rows.filter((c) => !c.masque).length;
  const n = (e) => db.crus.filter((c) => (e ? c.echelle === e : !eDef(c.echelle))).length;
  const colsCrus = [
        { h: 'Cru (village)', r: (c) => <b>{c.nom}</b> }, { h: 'Classement', r: (c) => <EChip id={c.echelle} /> }, { h: 'Département', cls: 'hm', r: (c) => c.dep || '' },
        { h: 'Autres noms', cls: 'hm', r: (c) => c.alias || '' }, { h: 'Origine', r: (c) => (c.custom ? <Chip tone="info">personnalisé</Chip> : <span className="text-xs text-ink2">fichier</span>) },
        { h: 'Utilisé', cls: 'r', r: (c) => cruUsage(db, c.id) || '' },
        { h: 'Listes de saisie', r: (c) => <button type="button" className={cx('chip', c.masque ? '' : 'chip-ok')} aria-pressed={!c.masque} title={c.masque ? 'Masqué : cliquez pour le proposer à nouveau' : 'Proposé à la saisie : cliquez pour le masquer'} onClick={(e) => { e.stopPropagation(); act((d) => cruMask(d, [c.id], !c.masque)); }}>{c.masque ? '◌ masqué' : '● visible'}</button> },
        { h: '', r: (c) => <Btn size="sm" kind="danger" onClick={(e) => { e.stopPropagation(); act((d) => cruDelete(d, c.id), 'Cru supprimé.'); }}>Supprimer</Btn> }];
  /* 0.48.0-alpha.1 : crus regroupés par département, repliés quand la liste est longue (plus de 60 crus sans recherche) ; une recherche les déplie */
  const groupes = useMemo(() => { const G = new Map(); rows.forEach((c) => { const k = String(c.dep || '').trim(); if (!G.has(k)) G.set(k, []); G.get(k).push(c); }); return [...G.entries()].sort((x, y) => (!x[0] ? 1 : !y[0] ? -1 : x[0].localeCompare(y[0], 'fr'))); }, [rows]);
  const [ouv, setOuv] = useState({}); useEffect(() => setOuv({}), [q, f]); const auto = !!q.trim() || rows.length <= 60;
  const ouvert = (k) => (ouv[k] !== undefined ? ouv[k] : auto); const tousOuv = (v) => setOuv(Object.fromEntries(groupes.map(([k]) => [k, v])));
  const restore = async () => { if (await confirm({ title: 'Rétablir la liste d’origine ?', body: 'Les villages du fichier « Échelle des crus » manquants sont réajoutés et leur échelle d’origine est rétablie. Vos crus personnalisés sont conservés.', ok: 'Rétablir' })) act((d) => cruRestore(d), 'Liste des crus rétablie.'); };
  return (
    <div>
      <details className="card mb-4 p-4" open={db.settings.echellePreset && db.settings.echellePreset !== 'champagne' ? true : undefined}><summary className="cursor-pointer text-lg font-semibold">{ECH.nom} : {[...ECHELLES].map((e) => e.un).join(' < ')} <span className="text-sm font-normal text-ink2">— personnaliser pour une autre région viticole</span></summary><div className="mt-3"><EchellesEditor /></div></details>
      <div className="mb-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>{[...ECHELLES].reverse().map((e) => <Kpi key={e.id} label={e.label} value={n(e.id)} />)}{n('') ? <Kpi label="Non classés" value={n('')} /> : null}<Kpi label="Masqués des listes" value={nMask} sub={`${db.crus.length - nMask} visibles à la saisie`} /></div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className="inp" style={{ width: 'auto', flex: '1 1 220px' }} placeholder="Rechercher un village…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher un village" data-crus-recherche="" />
        {[['all', 'Tous'], ...[...ECHELLES].reverse().map((e) => [e.id, e.label]), ...(n('') ? [['', 'Non classés']] : []), ['custom', 'Personnalisés'], ['visibles', 'Visibles'], ['masques', 'Masqués']].map(([k, l]) => <Btn key={k} size="sm" kind={f === k ? 'primary' : undefined} onClick={() => setF(k)}>{l}</Btn>)}
        <Btn kind="primary" onClick={() => setForm({})}>＋ Cru personnalisé</Btn><Btn onClick={restore}>Rétablir la liste d’origine</Btn>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm"><span className="text-ink2">Pour ne garder dans les listes de saisie que vos villages : filtrez, puis</span><Btn size="sm" disabled={!vis} onClick={() => act((d) => cruMask(d, rows.map((c) => c.id), true), `${vis} cru(s) masqué(s) des listes.`)}>Masquer les {vis} crus affichés</Btn><Btn size="sm" disabled={vis === rows.length} onClick={() => act((d) => cruMask(d, rows.map((c) => c.id), false), 'Crus de nouveau proposés à la saisie.')}>Réafficher les {rows.length - vis} crus masqués affichés</Btn></div>
      <p className="mb-2 text-xs text-ink2">Liste de départ issue du fichier « Échelle des crus en Champagne » (sans les pourcentages) : pour une autre région, masquez ces villages et ajoutez les vôtres (« + Cru personnalisé »). Le classement d’un lot est celui du cru de rang le plus bas qui le compose.</p>
      {groupes.length > 1 ? <div className="mb-2 flex flex-wrap items-center gap-2 text-sm" data-crus-replis=""><span className="text-ink2">{`${groupes.length} départements`}</span><Btn size="sm" onClick={() => tousOuv(true)} data-crus-deplier="">Tout déplier</Btn><Btn size="sm" onClick={() => tousOuv(false)} data-crus-replier="">Tout replier</Btn></div> : null}
      {groupes.length > 1 ? groupes.map(([k, L]) => (<div key={k || '-'} className="mb-2" data-crus-groupe={k || '-'}>
        <button type="button" className="liste-tete crus-tete" aria-expanded={ouvert(k)} onClick={() => setOuv((o) => ({ ...o, [k]: !ouvert(k) }))} data-crus-basculer={k || '-'}><span className="liste-fleche" aria-hidden="true">{ouvert(k) ? '▾' : '▸'}</span><span translate="no">{k || 'Sans département'}</span><span className="chip">{L.length}</span></button>
        {ouvert(k) ? <div className="mt-1"><Tbl rows={L} onRow={(c) => setForm({ id: c.id })} cols={colsCrus} /></div> : null}</div>))
        : <Tbl rows={rows} onRow={(c) => setForm({ id: c.id })} empty="Aucun cru ne correspond." cols={colsCrus} />}
      {form ? <CruForm id={form.id} onClose={() => setForm(null)} /> : null}
    </div>
  );
}

// Parcelles : chacune reliée à un cru (village) ; sert aux apports et entrées de moûts, à la composition et à la traçabilité
function ParcellesView() {
  const { db, R, act } = useApp(); const [q, setQ] = useState(''); const [cru, setCru] = useState(''); const [form, setForm] = useState(null);
  const P = db.parcelles || [];
  const rows = P.filter((p) => (!cru || p.cruId === cru) && (!q || norm(`${p.nom} ${p.lieuDit || ''} ${p.cadastre || ''} ${cruName(db, p.cruId)}`).includes(norm(q)))).sort((a, b) => cruName(db, a.cruId).localeCompare(cruName(db, b.cruId), 'fr') || a.nom.localeCompare(b.nom, 'fr'));
  const kg = (id) => sum(Object.values(R.raisins).filter((r) => r.parcelleId === id), (r) => r.kg);
  const surf = sum(P, (p) => num(p.surface));
  return (
    <div>
      <div className="mb-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}><Kpi label="Parcelles" value={P.length} sub={`${P.filter((p) => !p.masque).length} proposées à la saisie`} /><Kpi label="Surface renseignée" value={surf ? `${fmt(surf / 100, 2)} ha` : '—'} /><Kpi label="Crus concernés" value={uniq(P.map((p) => p.cruId)).length} /></div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input className="inp" style={{ width: 'auto', flex: '1 1 220px' }} placeholder="Rechercher une parcelle, un lieu-dit, un cadastre…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher une parcelle" />
        <div style={{ width: 240 }}><CruSelect value={cru} onChange={setCru} allowAdd={false} placeholder="Tous les crus" includeHidden /></div>{cru ? <Btn size="sm" kind="ghost" onClick={() => setCru('')}>Tous les crus</Btn> : null}
        <Btn kind="primary" onClick={() => setForm({ preset: cru ? { cruId: cru } : {} })}>＋ Nouvelle parcelle</Btn>
      </div>
      <Tbl rows={rows} onRow={(p) => setForm({ id: p.id })} empty={P.length ? 'Aucune parcelle ne correspond.' : 'Aucune parcelle : « + Nouvelle parcelle » (nom, cru, lieu-dit, cadastre, surface, cépage). Vous pourrez ensuite la choisir dans un apport de vendange.'} cols={[
        { h: 'Parcelle', r: (p) => <b>{p.nom}</b> }, { h: 'Cru (village)', r: (p) => <span className="inline-flex flex-wrap items-center gap-1">{cruName(db, p.cruId)} <EChip id={cruEchelle(db, p.cruId)} compact /></span> },
        { h: 'Lieu-dit', cls: 'hm', r: (p) => p.lieuDit || '' }, { h: 'Cadastre', cls: 'hm', r: (p) => p.cadastre || '' }, { h: 'Surface', cls: 'r', r: (p) => (p.surface ? <span className="num">{fmt(p.surface, 2)} a</span> : '') },
        { h: 'Cépage', cls: 'hm', r: (p) => (p.cepageId ? lbl(db, 'cepages', p.cepageId) : '') }, { h: 'Exploitant', cls: 'hm', r: (p) => (p.apporteurId ? apporteurName(db, p.apporteurId) : '') },
        { h: 'Vendanges', cls: 'r', r: (p) => (kg(p.id) ? <span className="num">{fmt(kg(p.id))} kg</span> : '') },
        { h: 'Listes de saisie', r: (p) => <button type="button" className={cx('chip', p.masque ? '' : 'chip-ok')} aria-pressed={!p.masque} onClick={(e) => { e.stopPropagation(); act((d) => parcelleSave(d, { ...p, masque: !p.masque }, p.id)); }}>{p.masque ? '◌ masquée' : '● visible'}</button> },
        { h: '', r: (p) => <Btn size="sm" kind="danger" onClick={(e) => { e.stopPropagation(); act((d) => parcelleDelete(d, p.id), 'Parcelle supprimée.'); }}>Supprimer</Btn> }]} />
      {form ? <ParcelleForm id={form.id} preset={form.preset} onClose={() => setForm(null)} /> : null}
    </div>
  );
}
function CrusEtParcelles() {
  const { db, nav } = useApp(); const [v, setV] = useState(nav.sub2 === 'parcelles' ? 'parcelles' : 'crus');
  return (<div><SubNav value={v} onChange={setV} items={[{ id: 'crus', label: `Crus (villages) · ${db.crus.length}` }, { id: 'parcelles', label: `Parcelles · ${(db.parcelles || []).length}` }]} />{v === 'parcelles' ? <ParcellesView /> : <CrusView />}</div>);
}

function ApporteursView() {
  const { db, R, act } = useApp(); const [form, setForm] = useState(null);
  const stat = (id) => {
    const r = Object.values(R.raisins).filter((x) => x.apporteurId === id);
    const m = db.ops.filter((o) => o.type === 'entree_mout').flatMap((o) => (o.entrees || []).map((e) => ({ e, a: ligneApporteurs(e, o).find((x) => x.id === id) })).filter((x) => x.a));
    const v = db.ops.filter((o) => o.type === 'reprise' && o.apporteurId === id);
    return { kg: sum(r, (x) => x.kg), L: sum(m, (x) => num(x.e.volL) * x.a.part), vins: sum(v, (o) => num(o.volL)), bt: sum(v, (o) => num(o.nbBouteilles)), crus: uniq([...r.map((x) => x.cruId), ...m.map((x) => x.e.cruId)].filter(Boolean)) };
  };
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2"><p className="mr-auto text-sm text-ink2">Viticulteurs, coopératives ou négociants : <b>apporteurs</b> de raisins ou de moûts (apports, entrées de moûts, plusieurs par compartiment) et <b>vendeurs de vins</b> (entrées de vin). Des crus par défaut peuvent être proposés à la saisie.</p><Btn kind="primary" onClick={() => setForm({})}>＋ Partenaire</Btn></div>
      <Tbl rows={db.apporteurs} onRow={(a) => setForm({ id: a.id })} empty="Aucun partenaire." cols={[
        { h: 'Partenaire', r: (a) => <b>{a.nom}</b> }, { h: 'Rôles', r: (a) => <span className="flex flex-wrap gap-1">{apporteurRoles(a).map((x) => <Chip key={x}>{x}</Chip>)}</span> }, { h: 'Commune', cls: 'hm', r: (a) => a.commune },
        { h: 'Crus par défaut', cls: 'hm', r: (a) => (a.crusDefaut || []).length ? <span className="flex flex-wrap items-center gap-1">{a.crusDefaut.map((c) => <CruBadge key={c} id={c} />)}{a.cruAuto ? <span className="text-xs text-ink2">· proposé</span> : null}</span> : '—' },
        { h: 'Raisin livré', cls: 'r', r: (a) => <span className="num">{fmt(stat(a.id).kg)} kg</span> }, { h: 'Moûts', cls: 'r', r: (a) => <span className="num">{fmtL(stat(a.id).L)}</span> },
        { h: 'Vins achetés', cls: 'r hm', r: (a) => { const s = stat(a.id); return <span className="num">{s.vins ? fmtL(s.vins) : ''}{s.vins && s.bt ? ' · ' : ''}{s.bt ? `${fmt(s.bt)} bt` : ''}{!s.vins && !s.bt ? '—' : ''}</span>; } },
        { h: 'Crus livrés', cls: 'hm', r: (a) => <span className="flex flex-wrap gap-1">{stat(a.id).crus.map((c) => <CruBadge key={c} id={c} />)}</span> },
        { h: '', r: (a) => <Btn size="sm" kind="danger" onClick={(e) => { e.stopPropagation(); act((d) => apporteurDelete(d, a.id), 'Partenaire supprimé.'); }}>Supprimer</Btn> }]} />
      {form ? <ApporteurForm id={form.id} onClose={() => setForm(null)} /> : null}
    </div>
  );
}

function SitesView() {
  const { db, R, act } = useApp(); const [form, setForm] = useState(null);
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2"><p className="mr-auto text-sm text-ink2">Les sites ne séparent pas les stocks : un transfert peut passer d’un site à l’autre et les registres restent communs. Le site sert à organiser le plan de cave.</p><Btn kind="primary" onClick={() => setForm('new')}>＋ Site</Btn></div>
      <Tbl rows={db.sites} onRow={(s) => setForm(s.id)} cols={[
        { h: 'Site', r: (s) => <b>{s.nom}</b> }, { h: 'Adresse', cls: 'hm', r: (s) => s.adresse },
        { h: 'Contenants', cls: 'r', r: (s) => db.contenants.filter((c) => c.siteId === s.id && c.statut !== 'archive').length },
        { h: 'Volume', cls: 'r', r: (s) => <span className="num">{fmtL(sum(db.contenants.filter((c) => c.siteId === s.id), (c) => R.contVol[c.id] || 0))}</span> },
        { h: '', r: (s) => <Btn size="sm" kind="danger" onClick={(e) => { e.stopPropagation(); act((d) => siteDelete(d, s.id), 'Site supprimé.'); }}>Supprimer</Btn> }]} />
      {form ? <SiteForm id={form === 'new' ? null : form} onClose={() => setForm(null)} /> : null}
    </div>
  );
}

/* ---------- fractions de moût (liste personnalisable) ---------- */
function FractionsEditor() {
  const { db, act } = useApp(); const L = fracList(db); const [nv, setNv] = useState({ label: '', suffix: '', pressurage: true, role: 'autre', roleManuel: false });
  // rôle (0.38.0-alpha.3) : proposé d'après le nom saisi tant qu'il n'a pas été choisi à la main
  const roleOpts = FRAC_ROLES.map(([value, label]) => ({ value, label }));
  const ed = (id, patch, msg) => act((d) => fractionCont(d, 'edit', id, patch), msg);
  return (
    <div className="space-y-2">
      {L.map((x, i) => (
        <div key={x.id} className="flex flex-wrap items-center gap-2">
          <input className="inp" style={{ flex: '1 1 200px', width: 'auto', minWidth: 150 }} defaultValue={x.label} aria-label="Libellé de la fraction" onBlur={(e) => { if (e.target.value.trim() !== x.label) ed(x.id, { label: e.target.value }, 'Fraction renommée.'); }} />
          <input className="inp num" style={{ width: 74 }} defaultValue={x.suffix} maxLength={4} aria-label={`Suffixe du code lot (${x.label})`} title="Suffixe ajouté au code lot (ex. P26-01-C)" onBlur={(e) => { if (e.target.value.trim().toUpperCase() !== (x.suffix || '')) ed(x.id, { suffix: e.target.value }, 'Suffixe enregistré.'); }} />
          <Check checked={x.pressurage !== false} onChange={(v) => ed(x.id, { pressurage: v })} label="au pressurage" />
          <label className="flex items-center gap-1 text-sm"><span className="text-ink2">Rôle</span><SI plain value={fracRole(db, x.id)} options={roleOpts} onChange={(v) => ed(x.id, { role: v }, 'Rôle de la fraction enregistré.')} aria-label={`Rôle de la fraction (${x.label})`} /></label>
          <div className="flex gap-1"><Btn size="sm" disabled={i === 0} aria-label="Monter" onClick={() => act((d) => fractionCont(d, 'up', x.id))}>↑</Btn><Btn size="sm" disabled={i === L.length - 1} aria-label="Descendre" onClick={() => act((d) => fractionCont(d, 'down', x.id))}>↓</Btn><Btn size="sm" kind="danger" aria-label={`Supprimer ${x.label}`} onClick={() => act((d) => fractionCont(d, 'del', x.id), 'Fraction supprimée.')}>✕</Btn></div>
        </div>))}
      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
        <input className="inp" style={{ flex: '1 1 200px', width: 'auto', minWidth: 150 }} value={nv.label} onChange={(e) => { const label = e.target.value; setNv({ ...nv, label, role: nv.roleManuel ? nv.role : fracRoleDevine(label) }); }} placeholder="Nouvelle fraction (ex. Vin de presse)" aria-label="Nouvelle fraction" />
        <input className="inp" style={{ width: 90 }} value={nv.suffix} onChange={(e) => setNv({ ...nv, suffix: e.target.value })} placeholder="Suffixe" maxLength={4} aria-label="Suffixe" />
        <Check checked={nv.pressurage} onChange={(v) => setNv({ ...nv, pressurage: v })} label="au pressurage" />
        <label className="flex items-center gap-1 text-sm"><span className="text-ink2">Rôle</span><SI plain value={nv.role} options={roleOpts} onChange={(v) => setNv({ ...nv, role: v, roleManuel: true })} aria-label="Rôle de la nouvelle fraction" /></label>
        <Btn kind="primary" size="sm" onClick={() => { const r = act((d) => fractionCont(d, 'add', null, { label: nv.label, suffix: nv.suffix, pressurage: nv.pressurage, role: nv.role }), 'Fraction ajoutée.'); if (r.ok) setNv({ label: '', suffix: '', pressurage: true, role: 'autre', roleManuel: false }); }}>＋ Ajouter</Btn>
      </div>
      <p className="help">Toutes les fractions sont proposées à l’entrée de moûts ; celles cochées « au pressurage » apparaissent aussi dans le formulaire de pressurage. Le suffixe complète le code lot (P26-01-<b>C</b>, M26-02-<b>T1</b>). Le rôle (cuvée, taille, rebêche ou autre) compte la fraction dans les marcs, les plafonds et les rendements : il est proposé d’après le nom, vérifiez-le. Une fraction déjà utilisée peut être renommée mais pas supprimée.</p>
      <p className="help" data-sous-fractions="">Sous-fractions (cœur de cuvée, tête de cuvée, 1re / 2e taille…) : ajoutez-les avec leur rôle (cuvée ou taille) ; elles comptent alors avec leur fraction dans les marcs, les plafonds et les rendements.</p>
      <Btn size="sm" onClick={() => act((d) => fractionCont(d, 'reset'), 'Fractions par défaut réajoutées.')}>Réajouter les fractions par défaut manquantes</Btn>
    </div>
  );
}
const FractionsDialog = ({ onClose }) => <Sheet title="Fractions de moût" sub="Liste personnalisable : cuvée, tailles, rebêche, lies, bourbes…" onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Terminé</Btn>}><FractionsEditor /></Sheet>;

// Motifs (2e critère de l'intérieur) : un motif par valeur, pour le critère choisi (fractions par défaut)
function MotifsEditeur() {
  const { db, R, act } = useApp(); const ap = db.apparence; const [crit, setCrit] = useState(ap.interieurMotif || 'fraction');
  useEffect(() => { if (ap.interieurMotif) setCrit(ap.interieurMotif); }, [ap.interieurMotif]);
  const vals = uniq([...critOrdre(db, crit, R), ...valeursPresentes(db, R, Object.keys(R.lots), crit)]).slice(0, 40);
  const setMotif = (v, m) => act((d) => apparenceSet(d, { motifs: { ...(d.apparence.motifs || {}), [crit]: { ...((d.apparence.motifs || {})[crit] || {}), [v]: m } } }));
  const reset = () => act((d) => { const m = { ...(d.apparence.motifs || {}) }; delete m[crit]; return apparenceSet(d, { motifs: m }); }, 'Motifs par défaut rétablis.');
  return (
    <div className="space-y-2" data-section="motifs">
      <div className="flex flex-wrap items-center gap-2"><span className="lbl mb-0">Motifs pour</span>
        <select className="inp" style={{ width: 'auto' }} value={crit} onChange={(e) => setCrit(e.target.value)} aria-label="Critère des motifs">{VUE_CRITERES.map((c) => <option key={c.id} value={c.id}>{critLabel(c.id)}</option>)}</select>
        {crit !== (ap.interieurMotif || '') ? <span className="help">(le motif affiché actuellement : {ap.interieurMotif ? critLabel(ap.interieurMotif).toLowerCase() : 'aucun'})</span> : null}
        <Btn size="sm" kind="ghost" className="ml-auto" onClick={reset}>Motifs par défaut</Btn></div>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,230px),1fr))' }}>
        {vals.map((v) => { const m = motifDe(db, crit, v); return (
          <label key={v} className="flex items-center gap-2 rounded-md border border-line px-2 py-1.5 text-sm" data-valeur={v}>
            <MotifSwatch color={crit === 'fraction' || crit === 'cepage' ? valColor(db, crit, v) : '#CFC6B4'} motif={m} size={22} />
            <span className="min-w-0 flex-1 truncate">{valLabel(db, crit, v)}</span>
            <select className="inp" style={{ width: 'auto', minHeight: 32, paddingTop: 2, paddingBottom: 2 }} value={m} onChange={(e) => setMotif(v, e.target.value)} aria-label={`Motif pour ${valLabel(db, crit, v)}`}>{MOTIFS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </label>); })}
      </div>
    </div>
  );
}
