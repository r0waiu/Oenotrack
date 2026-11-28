/* ============ INTRANTS › REVENDICATIONS & PLAFONDS (0.30.0-alpha.1) ============
   Plafonds de SO₂ total par revendication et type de vin (exemples « à vérifier » tant qu'ils ne sont pas validés), règles de
   substances d'un cahier des charges (interdiction, dose maximale), import d'un cahier des charges (PDF ou texte, lu par le script
   ou par l'assistant IA) : chaque proposition est relue et cochée avant d'être appliquée. */
const plafondEtatChip = (p) => (p.aVerifier ? <Chip tone="warn">{p.exemple ? 'exemple à vérifier' : 'à vérifier'}</Chip> : <Chip tone="good">vérifié</Chip>);
// 0.43.0-alpha.1 : partie 'so2' | 'substances' (sous-onglet « Labels & cahiers des charges ») ; liens avec les produits des catalogues
function PlafondsView({ partie }) {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('intrants'); const ask = useRetirer();
  const [form, setForm] = useState(null); const [cahier, setCahier] = useState(false); const [lien, setLien] = useState(null);
  const nCat = useMemo(() => Object.fromEntries(plafondsDe(db).map((p) => [p.id, plafondProduitsCatalogue(db, p).filter((y) => y.lie).length])), [db]);
  const colCat = { h: 'Produits des catalogues', r: (p) => <Btn size="sm" onClick={() => setLien(p.id)} data-plafond-catalogue={p.id}>{`${fmt(nCat[p.id] || 0)} lié(s)`}</Btn> };
  const L = plafondsDe(db); const qs = qualifList(db);
  const so2 = L.filter((p) => p.objet === 'so2t').sort((a, b) => (qs.findIndex((q) => q.id === a.qualifId) - qs.findIndex((q) => q.id === b.qualifId)) || (VINS_TYPES.findIndex((v) => v.id === a.vin) - VINS_TYPES.findIndex((v) => v.id === b.vin)));
  const subs = L.filter((p) => p.objet === 'substance').sort((a, b) => a.qualifId.localeCompare(b.qualifId) || String(a.libelle).localeCompare(String(b.libelle), 'fr'));
  const nv = L.filter((p) => p.aVerifier).length;
  const actions = (p) => (lect ? null : <div className="flex flex-wrap gap-1">{p.aVerifier ? <Btn size="sm" kind="primary" onClick={() => act((d) => plafondValider(d, p.id, uid), 'Plafond vérifié.')}>✓ Vérifié</Btn> : null}<Btn size="sm" onClick={() => setForm({ id: p.id, objet: p.objet })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => ask('Retirer ce plafond ?', (d) => plafondSupprimer(d, p.id), 'Plafond retiré.')}>Retirer</Btn></div>);
  return (
    <>
      {partie === 'substances' || !nv ? null : <div className="mb-3"><Notice tone="warn"><span translate="no">{fmt(nv)}</span> <span>plafond(s) à vérifier.</span></Notice></div>}
      {partie === 'substances' ? null : <Aide id="labels-plafonds" titre="ℹ Plafonds des revendications" resume="Exemples non officiels, à vérifier ; un dépassement demande un motif, jamais bloqué.">
        <span>Les valeurs proposées sont des exemples non officiels, à vérifier dans la réglementation et dans vos cahiers des charges avant usage.</span>{' '}
        <span>Un dépassement n’est jamais bloqué : l’opération demande un motif, tracé avec elle (journal, registre des intrants).</span>{' '}
        <span>Les plafonds des labels et cahiers des charges s’ajoutent à ceux-ci : le plus bas s’applique, sauf plafond vérifié ici pour la revendication.</span>
      </Aide>}
      {partie === 'substances' ? null : <Sec title="SO₂ total maximal de l’exploitation (mg/L)" right={lect ? null : <div className="flex flex-wrap gap-2"><Btn onClick={() => setCahier(true)}>📥 Importer un cahier des charges…</Btn><Btn kind="primary" onClick={() => setForm({ objet: 'so2t' })}>+ Plafond de SO₂</Btn></div>}>
        <div data-plafonds-so2><Tbl rows={so2} empty="Aucun plafond de SO₂ total." cols={[
          { h: 'Revendication', r: (p) => <QChip id={p.qualifId} /> }, { h: 'Vins', r: (p) => vinTypeLabel(p.vin) },
          { h: 'SO₂ total max', cls: 'r', r: (p) => <b className="num" translate="no">{fmt(p.valeur, 0)} mg/L</b> },
          { h: 'Précision', r: (p) => (p.note ? <span className="text-xs">{p.note}</span> : '—') }, { h: 'Source', r: (p) => <span className="text-xs text-ink2">{p.source || '—'}</span> },
          { h: 'État', r: (p) => <div>{plafondEtatChip(p)}{!p.aVerifier && p.verifieLe ? <div className="text-xs text-ink2"><span translate="no">{fmtDate(p.verifieLe)}</span>{p.verifiePar ? <> · <span translate="no">{utilisateurNom(db, p.verifiePar)}</span></> : null}</div> : null}</div> },
          colCat, { h: '', r: actions },
        ]} /></div>
      </Sec>}
      {partie === 'so2' ? null : <Sec title="Substances de vos cahiers des charges (interdiction, dose maximale)" right={lect ? null : <Btn onClick={() => setForm({ objet: 'substance' })}>+ Règle de substance</Btn>}>
        <p className="help">S’ajoutent aux règles de chaque produit (onglet « Produits & règles par revendication ») : un produit dont le nom, la famille ou la composition contient le mot-clé suit la règle la plus restrictive.</p>
        <div data-plafonds-substances><Tbl rows={subs} empty="Aucune règle de substance." cols={[
          { h: 'Revendication', r: (p) => <QChip id={p.qualifId} /> }, { h: 'Substance', r: (p) => <div><b>{p.libelle || p.mot}</b><div className="text-xs text-ink2"><span>mots-clés :</span> <span translate="no">{String(p.mot).split('|').join(', ')}</span></div></div> },
          { h: 'Règle', r: (p) => (p.autorise === false ? <Chip tone="bad">interdit</Chip> : p.doseMax != null ? <span><span>dose max</span> <b className="num" translate="no">{fmt(p.doseMax, Number.isInteger(p.doseMax) ? 0 : 2)} {p.unite}</b></span> : <Chip>autorisé</Chip>) },
          { h: 'Produits concernés', r: (p) => { const n = db.produits.filter((x) => plafondConcerneProduit(db, p, x)); return n.length ? <span className="text-xs" translate="no">{n.slice(0, 4).map((x) => x.nom).join(', ')}{n.length > 4 ? ` +${n.length - 4}` : ''}</span> : <span className="text-xs text-ink2">aucun pour l’instant</span>; } },
          colCat, { h: 'Source', r: (p) => <span className="text-xs text-ink2">{p.source || '—'}</span> }, { h: 'État', r: (p) => plafondEtatChip(p) }, { h: '', r: actions },
        ]} /></div>
      </Sec>}
      {partie ? null : <RevendicationSyntheseSec />}
      {lien ? <PlafondCatalogueSheet id={lien} onClose={() => setLien(null)} /> : null}
      {form ? <PlafondForm id={form.id} objet={form.objet} onClose={() => setForm(null)} /> : null}
      {cahier ? <CahierImportSheet onClose={() => setCahier(false)} /> : null}
    </>
  );
}
function PlafondForm({ id, objet, onClose }) {
  const { db, act, uid } = useApp(); const p = id ? plafondsDe(db).find((x) => x.id === id) : null; const qs = qualifList(db);
  const [f, set] = useDraft(p ? { ...p, valeur: p.valeur != null ? String(p.valeur) : '', doseMax: p.doseMax != null ? String(p.doseMax) : '', mot: String(p.mot || '').split('|').join(', '), verifie: !p.aVerifier }
    : { objet, qualifId: (qs[0] || {}).id || 'conv', vin: 'effervescent', valeur: '', note: '', source: '', mot: '', libelle: '', autorise: true, doseMax: '', unite: 'g/hL', verifie: true });
  const save = () => { const r = act((d) => plafondSave(d, { ...f, mot: String(f.mot || '').split(/[,|]/).join('|'), aVerifier: !f.verifie }, id, uid), id ? 'Plafond modifié.' : 'Plafond ajouté.'); if (r && r.ok !== false) onClose(); };
  return (
    <FormSheet title={f.objet === 'substance' ? (id ? 'Modifier la règle de substance' : 'Nouvelle règle de substance') : (id ? 'Modifier le plafond de SO₂ total' : 'Nouveau plafond de SO₂ total')} onClose={onClose} onSave={save}>
      <G><Field label="Revendication"><SI value={f.qualifId} onChange={(v) => set('qualifId', v)} options={qs.map((q) => ({ value: q.id, label: qLabel(q.id) }))} /></Field>
        {f.objet === 'substance' ? <Field label="Substance"><TI value={f.libelle} onChange={(v) => set('libelle', v)} placeholder="ex. PVPP" /></Field> : <Field label="Vins concernés"><SI value={f.vin} onChange={(v) => set('vin', v)} options={VINS_TYPES.map((v) => ({ value: v.id, label: v.label }))} /></Field>}</G>
      {f.objet === 'substance' ? (<>
        <Field label="Mots-clés (séparés par des virgules)" help="Cherchés dans le nom, la famille et la composition des produits, au début d’un mot."><TI value={f.mot} onChange={(v) => set('mot', v)} placeholder="ex. pvpp, polyvinylpolypyrrolidone" /></Field>
        <div className="flex flex-wrap items-end gap-4"><Check checked={f.autorise !== false} onChange={(v) => set('autorise', v)} label={f.autorise !== false ? 'Autorisé' : 'Interdit'} />
          {f.autorise !== false ? <><Field label="Dose maximale"><NI value={f.doseMax} onChange={(v) => set('doseMax', v)} placeholder="aucune" /></Field><Field label="Unité"><SI value={f.unite} onChange={(v) => set('unite', v)} plain options={[{ value: 'g/hL', label: 'g/hL' }, { value: 'mL/hL', label: 'mL/hL' }]} /></Field></> : null}</div>
      </>) : <G><Field label="SO₂ total maximal (mg/L)"><NI value={f.valeur} onChange={(v) => set('valeur', v)} placeholder="ex. 185" /></Field><Field label="Précision"><TI value={f.note} onChange={(v) => set('note', v)} placeholder="ex. sucres < 5 g/L" /></Field></G>}
      <Field label="Source"><TI value={f.source} onChange={(v) => set('source', v)} placeholder="ex. cahier des charges, article…" /></Field>
      <Check checked={!!f.verifie} onChange={(v) => set('verifie', v)} label="Vérifié (sinon : à vérifier)" />
    </FormSheet>
  );
}
// cahier des charges : propositions relues et cochées une à une avant d'être appliquées à la revendication choisie
function CahierImportSheet({ onClose }) {
  const { db, act, uid } = useApp(); const garde = useGarde(); const ia = iaActive(); const qs = qualifList(db);
  const [q, setQ] = useState((qs.find((x) => x.id === 'bio') || qs[0] || {}).id || 'conv'); const [src, setSrc] = useState('');
  const [props, setProps] = useState(null); const [coche, setCoche] = useState([]); const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const [texte, setTexte] = useState('');
  const analyser = async (t, avecIa, nom) => {
    setErr(''); let P = [];
    try {
      if (avecIa && ia.pret) { const M = texteMorceaux(t, 12000).slice(0, 8); for (let i = 0; i < M.length; i += 1) { setBusy(`${ia.nom} relève les limites (partie ${i + 1} / ${M.length})…`); const pr = cahierIaPrompt(M[i], qLabel(q)); const r = await iaDemander(ia, { system: pr.system, texte: pr.texte, max: 4000 }); P = [...P, ...cahierIaLire(iaJson(r.texte))]; } }
      else P = cahierPropositions(t);
      P = P.map((x, i) => ({ ...x, id: `p${i + 1}` }));
      if (!P.length) throw new Error('aucune limite reconnue (SO₂ total, substance interdite ou dose maximale) : saisissez les plafonds à la main');
      setProps(P); setCoche([]); if (!src && nom) setSrc(nom);
    } catch (e) { setErr((e && e.message) || String(e)); } finally { setBusy(''); }
  };
  const lireFichier = async (file0, avecIa) => {
    setErr(''); const ok = await garde([file0], 'cahier'); const file = ok[0]; if (!file) return;
    try { let t = ''; if (estPdf(file)) { const r = await lireTextePdf(file, { onEtape: (x) => setBusy(x), maxPages: 120 }); t = r.texte; if (r.vides === r.lues) throw new Error('ce PDF ne contient que des images, sans texte : copiez le passage utile dans la zone de texte'); } else t = String(await lectureFichier(file) || '');
      setTexte(t.slice(0, 200000)); await analyser(t, avecIa, file.name.replace(/\.[a-z0-9]+$/i, ''));
    } catch (e) { setErr((e && e.message) || String(e)); setBusy(''); }
  };
  const appliquer = () => {
    const P = (props || []).filter((x) => coche.includes(x.id)); if (!P.length) return;
    const r = act((d) => cahierAppliquer(d, q, P, src || 'cahier des charges importé', uid), `${P.length} limite(s) du cahier des charges appliquée(s) à ${qLabel(q)}.`); if (r && r.ok !== false) onClose();
  };
  return (
    <FormSheet title="Importer un cahier des charges" sub="PDF ou texte. Les limites reconnues (SO₂ total, substances interdites, doses maximales) sont proposées : cochez celles que vous avez vérifiées." onClose={onClose} onSave={appliquer} disabled={!coche.length || !!busy} saveLabel="Appliquer la sélection">
      <G><Field label="Revendication concernée"><SI value={q} onChange={setQ} options={qs.map((x) => ({ value: x.id, label: qLabel(x.id) }))} /></Field><Field label="Source"><TI value={src} onChange={setSrc} placeholder="ex. cahier des charges, version, date" /></Field></G>
      <Group label="Cahier des charges">
        <div className="flex flex-wrap items-center gap-2">
          <label className="btn">📄 Lire le fichier (script)<input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => { const x = e.target.files[0]; e.target.value = ''; if (x) lireFichier(x, false); }} /></label>
          {ia.pret ? <label className="btn">✨ Lire avec <span translate="no">{ia.nom}</span><input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => { const x = e.target.files[0]; e.target.value = ''; if (x) lireFichier(x, true); }} /></label> : null}
        </div>
        <div className="mt-2"><TA value={texte} onChange={setTexte} rows={4} placeholder="… ou collez ici le passage du cahier des charges" aria-label="Texte du cahier des charges" /></div>
        <div className="mt-1 flex flex-wrap gap-2"><Btn size="sm" disabled={!texte.trim() || !!busy} onClick={() => analyser(texte, false)}>Analyser le texte</Btn>{ia.pret ? <Btn size="sm" disabled={!texte.trim() || !!busy} onClick={() => analyser(texte, true)}>✨ Analyser avec <span translate="no">{ia.nom}</span></Btn> : null}</div>
        {busy ? <div className="mt-2 text-sm" role="status">⏳ {busy}</div> : null}
        {err ? <Notice tone="bad" title="Rien à proposer"><span>{err}</span></Notice> : null}
      </Group>
      {props ? (
        <Group label="Propositions (à vérifier puis cocher)">
          <div className="mb-1 flex flex-wrap items-center gap-2"><Check checked={props.length > 0 && coche.length === props.length} onChange={(v) => setCoche(v ? props.map((x) => x.id) : [])} label="Tout cocher" /><span className="text-xs text-ink2">Relisez l’extrait de chaque proposition avant de la cocher.</span></div>
          <div data-cahier-props><Tbl rows={props} cols={[
            { h: '', r: (x) => <input type="checkbox" checked={coche.includes(x.id)} onChange={(e) => setCoche(e.target.checked ? [...coche, x.id] : coche.filter((y) => y !== x.id))} aria-label={`Retenir la proposition ${x.id}`} /> },
            { h: 'Proposition', r: (x) => (x.objet === 'so2t' ? <span><span>SO₂ total max</span> · <span>{vinTypeLabel(x.vin)}</span> : <b className="num" translate="no">{fmt(x.valeur, 0)} mg/L</b></span>
              : <span><b>{x.libelle}</b> : {x.autorise === false ? <Chip tone="bad">interdit</Chip> : x.doseMax != null ? <><span>dose max</span> <b className="num" translate="no">{fmt(x.doseMax, Number.isInteger(x.doseMax) ? 0 : 2)} {x.unite}</b></> : <Chip>autorisé</Chip>}</span>) },
            { h: 'Extrait du texte', r: (x) => <span className="text-xs text-ink2" translate="no">{x.extrait || '—'}</span> },
            { h: '', r: (x) => (x.ia ? <Chip>assistant IA</Chip> : <Chip>script</Chip>) },
          ]} /></div>
        </Group>
      ) : null}
    </FormSheet>
  );
}
