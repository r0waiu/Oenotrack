/* ============ CATALOGUES DE PRODUITS ŒNOLOGIQUES (0.30.0-alpha.1) ============
   Choix d'un intrant : fournisseur (ou « En stock ») choisi à chaque saisie, puis ses produits (ceux de la cave, puis ceux de ses
   catalogues) ; un produit du catalogue choisi rejoint les produits de la cave avec des règles d'exemple « à vérifier ».
   Intrants › Catalogues : catalogues affichés (masquer un fournisseur ou une marque), recherche, import d'un catalogue (tableur,
   PDF lu par le script ou par l'assistant IA) dont les lignes restent « à vérifier » jusqu'à leur validation. */
const FO_STOCK = '@stock'; const FO_TOUS = '@tous';
// identifiants activés : module en lecture seule pour l'utilisateur connecté
const useLectureSeule = (mod) => { const { secu, niveau } = useApp(); return !!secu && niveau(mod) !== 'ecriture'; };
// confirmation avant de retirer (même message que les autres suppressions)
function useRetirer() {
  const { act, confirm } = useApp();
  return async (title, fn, okMsg, body) => { const ok = await confirm({ title, body: body || 'Cette suppression est définitive.', ok: 'Retirer', danger: true }); if (ok) act(fn, okMsg); };
}
// fournisseur à choisir à chaque saisie (« En stock » : tous les produits dont il reste un lot fournisseur)
function FournisseurChoix({ value, onChange, ...p }) {
  const { db } = useApp(); const fos = useMemo(() => intrantFournisseurs(db), [db]);
  return <SI value={value || ''} onChange={onChange} placeholder="Fournisseur ou « En stock »…" options={[{ value: FO_STOCK, label: 'En stock', t: true }, ...fos.map((f) => ({ value: f, label: f })), { value: FO_TOUS, label: 'Tous les produits', t: true }]} aria-label="Fournisseur" {...p} />;
}
// produits du fournisseur choisi : ceux de la cave, puis ceux de ses catalogues (ajoutés aux produits de la cave une fois choisis)
function ProduitFournisseurChoix({ fo, value, onChange, cats, Rd, ...p }) {
  const { db, R, act } = useApp(); const RR = Rd || R;
  const L = useMemo(() => (fo ? intrantProduitsPour(db, RR, fo, cats) : { produits: [], catalogue: [] }), [db, RR, fo, cats]);
  const opts = [...L.produits.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map((x) => ({ value: x.id, label: `${x.nom} (${x.unite})` })),
    ...L.catalogue.sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map((e) => ({ value: `cat:${e.id}`, label: `${e.nom} · ${e.marque} (catalogue)` }))];
  if (value && !opts.some((o) => o.value === value)) { const pr = prodOf(db, value); opts.unshift({ value, label: `${pr.nom} (${pr.unite})` }); }
  const choisir = (v) => {
    if (!String(v || '').startsWith('cat:')) { onChange(v); return; }
    let id = null; const r = act((d) => { const x = produitDepuisCatalogue(d, v.slice(4)); if (x.ok) id = x.id; return x; }, 'Produit ajouté à vos produits depuis le catalogue (règles d’exemple à vérifier).');
    if (r && r.ok !== false && id) onChange(id);
  };
  return <SI value={value || ''} onChange={choisir} placeholder={fo ? (opts.length ? 'Produit…' : 'Aucun produit') : 'Choisissez d’abord le fournisseur'} options={opts} disabled={!fo} aria-label="Produit" {...p} />;
}
const foDeLigne = (db, l) => (l._fo !== undefined ? l._fo : l.produitId ? (fournisseurNom(db, prodOf(db, l.produitId).fournisseurId) || FO_TOUS) : '');

// 0.40.0-alpha.1 : page du produit, fiche technique et FDS en ligne (sites des fournisseurs)
function CatalogueLiens({ e }) {
  if (!e.lien && !e.ftUrl && !e.fdsUrl) return null;
  return <span className="mt-0.5 flex flex-wrap gap-2" data-catalogue-liens="">{e.lien ? <a href={e.lien} target="_blank" rel="noopener noreferrer">🔗 Page</a> : null}{e.ftUrl ? <a href={e.ftUrl} target="_blank" rel="noopener noreferrer">📄 FT</a> : null}{e.fdsUrl ? <a href={e.fdsUrl} target="_blank" rel="noopener noreferrer">⚠ FDS</a> : null}</span>;
}
function BioChips({ e }) {
  return <>{e.ue ? <Chip tone="good">bio UE</Chip> : null}{e.bioEcocert ? <Chip tone="good" title={e.ecocertRestr || ''} data-ecocert="">liste Ecocert</Chip> : null}{e.nop ? <Chip>NOP</Chip> : null}{e.vegan ? <Chip>vegan</Chip> : null}</>;
}
// Intrants › Catalogues
function CataloguesView() {
  const { db, act } = useApp(); const lect = useLectureSeule('intrants'); const ask = useRetirer();
  const [fo, setFo] = useState(''); const [cat, setCat] = useState(''); const [fam, setFam] = useState(''); const [bio, setBio] = useState(false); const [q, setQ] = useState('');
  const [imp, setImp] = useState(false); const [relire, setRelire] = useState(null); const [vus, setVus] = useState(60);
  const liste = useMemo(() => catalogueListe(db), [db]); const reg = catalogueReglage(db);
  const fos = uniq(liste.map((c) => c.fournisseur)).sort((a, b) => a.localeCompare(b, 'fr'));
  const res = useMemo(() => catalogueChercher(db, { fournisseur: fo, cat, famille: fam, bio, q }).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')), [db, fo, cat, fam, bio, q]);
  const masquer = (cle, m) => act((d) => catalogueMasquer(d, cle, m), m ? 'Masqué dans la saisie des intrants.' : 'Affiché dans la saisie des intrants.');
  return (
    <>
      <Aide id="intrants-catalogues" titre="ℹ Catalogues des fournisseurs" resume="Données relevées dans les catalogues, à vérifier sur la fiche technique avant usage.">
        <span>Données relevées dans les catalogues (nom, famille, dose conseillée, conditionnements, mentions bio et vegan, source : catalogue et page). Vérifiez-les sur la fiche technique du produit avant usage.</span>{' '}
        <span>À la saisie d’un intrant, choisissez le fournisseur (ou « En stock ») puis le produit : un produit du catalogue rejoint vos produits, avec des règles d’exemple à vérifier.</span>
      </Aide>
      <Sec title="Catalogues affichés" right={lect ? null : <Btn onClick={() => setImp(true)}>📥 Importer un catalogue…</Btn>}>
        <div className="space-y-3" data-catalogues>
          {fos.map((f) => { const cs = liste.filter((c) => c.fournisseur === f); const foMasque = reg.masques.includes(`fo:${catCle(f)}`);
            return (
              <div key={f} className="rounded-md border border-line p-2" data-fournisseur={f}>
                <div className="flex flex-wrap items-center gap-2"><Check checked={!foMasque} disabled={lect} onChange={(c) => masquer(`fo:${catCle(f)}`, !c)} label={<b translate="no">{f}</b>} />{foMasque ? <Chip tone="warn">masqué</Chip> : null}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 pl-6 text-sm">
                  {cs.map((c) => (
                    <span key={c.id} className="flex flex-wrap items-center gap-1" data-catalogue={c.id}>
                      <Check checked={c.id === 'ecocert' ? !c.masque : !reg.masques.includes(`cat:${c.id}`)} disabled={lect || foMasque} onChange={(v) => masquer(`cat:${c.id}`, !v)} label={<span><span translate="no">{c.integre ? c.titre : c.titre}</span> <span className="text-ink2">(<span translate="no">{fmt(c.n)}</span> <span>produit(s)</span>)</span></span>} />
                      {!c.integre ? <><Chip>importé</Chip>{c.aVerifier ? <Btn size="sm" kind="primary" onClick={() => setRelire(c.id)}><span translate="no">{fmt(c.aVerifier)}</span> <span>à vérifier</span></Btn> : <Btn size="sm" onClick={() => setRelire(c.id)}>Relire</Btn>}
                        {lect ? null : <Btn size="sm" kind="danger" onClick={() => ask(`Retirer le catalogue importé « ${c.titre} » ?`, (d) => catalogueImportSupprimer(d, c.id), 'Catalogue retiré.', 'Les produits déjà ajoutés à vos produits restent.')}>Retirer</Btn>}</> : null}
                    </span>
                  ))}
                </div>
              </div>
            ); })}
        </div>
      </Sec>
      <Sec title="Rechercher dans les catalogues">
        <div className="flex flex-wrap items-center gap-2">
          <SI value={fo} onChange={(v) => { setFo(v); setCat(''); }} placeholder="Tous les fournisseurs" options={fos.map((f) => ({ value: f, label: f }))} style={{ width: 'auto' }} aria-label="Fournisseur" />
          <SI value={cat} onChange={setCat} placeholder="Tous les catalogues" options={liste.filter((c) => !fo || c.fournisseur === fo).map((c) => ({ value: c.id, label: c.titre }))} style={{ width: 'auto' }} aria-label="Catalogue" />
          <SI value={fam} onChange={setFam} placeholder="Toutes les familles" options={CATALOGUE_FAMILLES.map(([id, label]) => ({ value: id, label, t: true }))} className="combo-filtre" aria-label="Famille" />
          <Check checked={bio} onChange={setBio} label="Utilisable en bio" />
          <TI value={q} onChange={setQ} placeholder="Rechercher un produit…" style={{ width: 220 }} aria-label="Rechercher un produit" />
          <span className="text-sm text-ink2"><span translate="no">{fmt(res.length)}</span> <span>produit(s)</span></span>
        </div>
        <div className="mt-2" data-catalogue-res><Tbl rows={res.slice(0, vus)} empty="Aucun produit pour ces critères (catalogues masqués exclus)." cols={[
          { h: 'Produit', r: (e) => <div><b translate="no">{e.nom}</b> <span className="text-xs text-ink2" translate="no">{e.marque}</span></div> },
          { h: 'Famille', r: (e) => famLabel(e.famille) },
          { h: 'Dose conseillée', r: (e) => (e.dose ? <span translate="no">{e.dose}</span> : '—') },
          { h: 'Conditionnements', r: (e) => (e.cond ? <span className="text-xs" translate="no">{e.cond}</span> : '—') },
          { h: 'Mentions', r: (e) => <span className="flex flex-wrap gap-1"><BioChips e={e} />{e.max ? <Chip><span>max</span> <span translate="no">{e.max}</span></Chip> : null}{e.so2 ? <Chip><span>SO₂</span> <span translate="no">{e.so2}</span></Chip> : null}</span> },
          { h: 'Source', r: (e) => <span className="text-xs text-ink2"><span translate="no">{e.titre}</span>{e.page ? <> · <span>p.</span> <span translate="no">{e.page}</span></> : null}{e.ecocertCategorie ? <> · <span translate="no">{e.ecocertCategorie}</span></> : null}
            <CatalogueLiens e={e} /></span> },
          { h: '', r: (e) => { const p = catalogueProduitLie(db, e); return p ? <Chip tone="good">✓ dans vos produits</Chip> : lect ? null : <Btn size="sm" onClick={() => act((d) => produitDepuisCatalogue(d, e.id), 'Produit ajouté à vos produits (règles d’exemple à vérifier).')}>＋ Ajouter à mes produits</Btn>; } },
        ]} /></div>
        {res.length > vus ? <div className="mt-2"><Btn size="sm" onClick={() => setVus(vus + 120)}><span>Afficher plus</span> (<span translate="no">{fmt(res.length - vus)}</span> <span>restant(s)</span>)</Btn></div> : null}
      </Sec>
      {imp ? <CatalogueImportSheet onClose={() => setImp(false)} onFait={(id) => { setImp(false); setRelire(id); }} /> : null}
      {relire ? <CatalogueRelireSheet id={relire} onClose={() => setRelire(null)} /> : null}
    </>
  );
}
// texte d'un PDF (catalogue, cahier des charges) : toutes les pages qui portent du texte ; un PDF fait d'images n'en donne pas
async function lireTextePdf(file, { onEtape, maxPages } = {}) {
  return pdfAvecDocument(file, async (doc) => {
    const n = Math.min(doc.numPages, maxPages || 200); const pages = []; let vides = 0;
    for (let i = 1; i <= n; i += 1) { if (onEtape) onEtape(`Lecture de la page ${i} / ${n}…`); const pg = await doc.getPage(i); const t = await pdfPageItems(pg); if (t.items.map((it) => it.s).join('').replace(/[^A-Za-zÀ-ÿ]/g, '').length < 40) vides += 1; pages.push({ n: i, ...t }); }
    return { texte: pages.map((p) => `${fdsTexteDePages([p])}\n`).join(''), nbPages: doc.numPages, vides, lues: n };
  });
}
// texte d'un fichier CSV : UTF-8, sinon Windows-1252 (exports d'Excel en français)
const texteCsv = (file) => lectureFichier(file); // UTF-8, UTF-16 ou Windows-1252 (68f-drive)
// découpe d'un long texte pour l'assistant IA (morceaux de lignes entières)
const texteMorceaux = (t, n) => { const out = []; let cur = ''; String(t || '').split('\n').forEach((l) => { if ((cur + l).length > n && cur) { out.push(cur); cur = ''; } cur += `${l}\n`; }); if (cur.trim()) out.push(cur); return out; };
function CatalogueImportSheet({ onClose, onFait }) {
  const { db, act, uid, toast } = useApp(); const garde = useGarde(); const ia = iaActive();
  const [f, set] = useDraft({ fournisseur: '', marque: '', titre: '', annee: String(new Date().getFullYear()) });
  const [lu, setLu] = useState(null); const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const fichier = useRef(null);
  const lire = async (file0, avecIa) => {
    setErr(''); const ok = await garde([file0], 'catalogue'); const file = ok[0]; if (!file) return; fichier.current = file;
    try {
      let lignes = []; let mode = 'tableur'; let texte = ''; let info = '';
      if (/\.csv$/i.test(file.name || '') || /text\/csv/.test(file.type || '')) { // CSV lu ici (UTF-8, sinon Windows-1252 des exports Excel)
        setBusy('Lecture du tableur…'); const r = catalogueDepuisTableau(catalogueCsvLignes(await texteCsv(file))); if (!r.lignes.length) throw new Error(r.msg || 'aucun produit reconnu'); lignes = r.lignes;
      } else if (estTableur(file)) {
        setBusy('Lecture du tableur…'); try { await loadXlsx(); } catch (e) { /* message ci-dessous */ }
        if (!window.XLSX || !window.XLSX.read) throw new Error('lecture Excel indisponible (bibliothèque non chargée, hors ligne ?) : enregistrez le tableau en CSV');
        const ab = await file.arrayBuffer(); const rows = gardeSurveiller(() => { const wb = window.XLSX.read(ab, { type: 'array' }); return wb.SheetNames.slice(0, 6).flatMap((sn) => window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' })); });
        const r = catalogueDepuisTableau(rows.slice(0, 5000)); if (!r.lignes.length) throw new Error(r.msg || 'aucun produit reconnu'); lignes = r.lignes;
      } else {
        if (estPdf(file)) { mode = 'pdf'; const r = await lireTextePdf(file, { onEtape: (t) => setBusy(t) }); texte = r.texte; if (r.vides === r.lues) throw new Error('ce PDF ne contient que des images, sans texte : demandez au fournisseur son catalogue en tableur, ou ajoutez les produits à la main'); if (r.vides) info = `${r.vides} page(s) sans texte (images) ignorée(s).`; }
        else { mode = 'texte'; texte = String(await lectureFichier(file) || ''); }
        if (avecIa && ia.pret) {
          mode = 'ia'; const M = texteMorceaux(texte, 12000).slice(0, 12); const vu = new Set();
          for (let i = 0; i < M.length; i += 1) { setBusy(`${ia.nom} relève les produits (partie ${i + 1} / ${M.length})…`); const P = catalogueIaPrompt(M[i], { fournisseur: f.fournisseur, fichier: file.name }); const R0 = await iaDemander(ia, { system: P.system, texte: P.texte, max: 8000 });
            catalogueIaLire(iaJson(R0.texte)).forEach((l) => { const k = catCle(l.nom); if (!vu.has(k)) { vu.add(k); lignes.push({ ...l, id: `l${lignes.length + 1}` }); } }); }
        } else lignes = catalogueDepuisTexte(texte);
        if (!lignes.length) throw new Error('aucun produit reconnu dans le texte');
      }
      setLu({ lignes, mode, fichier: file.name, info }); if (!f.titre) set('titre', file.name.replace(/\.[a-z0-9]+$/i, ''));
    } catch (e) { setErr((e && e.message) || String(e)); } finally { setBusy(''); }
  };
  const enregistrer = () => {
    if (!lu) return; let id = null;
    const r = act((d) => { const x = catalogueImportSave(d, { ...f, fichier: lu.fichier, mode: lu.mode, lignes: lu.lignes, par: uid || '' }); if (x.ok) id = x.id; return x; }, 'Catalogue importé : relisez les lignes « à vérifier » avant de les valider.');
    if (r && r.ok !== false && id) onFait(id);
  };
  return (
    <FormSheet title="Importer un catalogue de produits" sub="Tableur (Excel, CSV), PDF ou texte. Les produits reconnus restent « à vérifier » jusqu’à leur validation." onClose={onClose} onSave={enregistrer} disabled={!lu || !!busy} saveLabel="Enregistrer (à vérifier)">
      <G><Field label="Fournisseur"><TI value={f.fournisseur} onChange={(v) => set('fournisseur', v)} placeholder="ex. Fournisseur œnologique" list="cat-fos" /><datalist id="cat-fos">{intrantFournisseurs(db).map((x) => <option key={x} value={x} />)}</datalist></Field>
        <Field label="Marque (si différente)"><TI value={f.marque} onChange={(v) => set('marque', v)} /></Field></G>
      <G><Field label="Titre du catalogue"><TI value={f.titre} onChange={(v) => set('titre', v)} /></Field><Field label="Année"><TI value={f.annee} onChange={(v) => set('annee', v)} /></Field></G>
      <Group label="Fichier">
        <div className="flex flex-wrap items-center gap-2">
          <label className="btn">📄 Lire le fichier (script)<input type="file" className="hidden" accept=".xlsx,.xls,.csv,.ods,.pdf,.txt" onChange={(e) => { const x = e.target.files[0]; e.target.value = ''; if (x) lire(x, false); }} /></label>
          {ia.pret ? <label className="btn">✨ Lire avec <span translate="no">{ia.nom}</span><input type="file" className="hidden" accept=".pdf,.txt" onChange={(e) => { const x = e.target.files[0]; e.target.value = ''; if (x) lire(x, true); }} /></label> : <span className="text-xs text-ink2">Assistant IA : réglez-le dans Paramètres › Assistant IA pour une lecture plus fine des PDF.</span>}
        </div>
        {busy ? <div className="mt-2 text-sm" role="status">⏳ {busy}</div> : null}
        {err ? <Notice tone="bad" title="Lecture impossible"><span>{err}</span></Notice> : null}
      </Group>
      {lu ? (
        <Group label="Produits reconnus (à vérifier)">
          <div className="text-sm"><span translate="no">{fmt(lu.lignes.length)}</span> <span>produit(s) reconnu(s)</span>{lu.info ? <> · <span>{lu.info}</span></> : null}</div>
          <div className="mt-1 max-h-72 overflow-auto"><Tbl rows={lu.lignes.slice(0, 300).map((l) => ({ ...l, id: l.id }))} cols={[{ h: 'Produit', r: (l) => <b translate="no">{l.nom}</b> }, { h: 'Famille', r: (l) => famLabel(l.famille) }, { h: 'Dose', r: (l) => <span translate="no">{l.dose || '—'}</span> }, { h: 'Unité', r: (l) => <span translate="no">{l.unite}</span> }, { h: 'Conditionnements', r: (l) => <span className="text-xs" translate="no">{l.cond || '—'}</span> }]} /></div>
        </Group>
      ) : null}
    </FormSheet>
  );
}
// relecture d'un catalogue importé : valider, écarter, corriger les lignes
function CatalogueRelireSheet({ id, onClose }) {
  const { db, act } = useApp(); const c = catalogueImportes(db).find((x) => x.id === id); const lect = useLectureSeule('intrants');
  const [sel, setSel] = useState([]); const [filtre, setFiltre] = useState('aVerifier'); const [ed, setEd] = useState(null);
  if (!c) return null;
  const L = c.lignes.filter((l) => !filtre || (l.etat || 'aVerifier') === filtre);
  const tous = L.length > 0 && L.every((l) => sel.includes(l.id));
  const etat = (e) => { const ids = sel.filter((x) => L.some((l) => l.id === x)); if (!ids.length) return; const r = act((d) => catalogueLignesEtat(d, id, ids, e), e === 'valide' ? 'Lignes validées : elles sont proposées à la saisie des intrants.' : 'Lignes écartées.'); if (r && r.ok !== false) setSel([]); };
  return (
    <Sheet title={`Catalogue importé — ${c.titre}`} onClose={onClose}>
      <div className="text-sm text-ink2"><span translate="no">{c.fournisseur}</span>{c.fichier ? <> · <span translate="no">{c.fichier}</span></> : null} · <span>{c.mode === 'ia' ? 'lu par l’assistant IA' : c.mode === 'pdf' ? 'PDF lu par le script' : c.mode === 'texte' ? 'texte' : 'tableur'}</span></div>
      <div className="mt-2 flex flex-wrap items-center gap-2" data-relire>
        <SI value={filtre} onChange={(v) => { setFiltre(v); setSel([]); }} plain options={[{ value: 'aVerifier', label: 'À vérifier' }, { value: 'valide', label: 'Validées' }, { value: 'ecarte', label: 'Écartées' }, { value: '', label: 'Toutes les lignes' }]} style={{ width: 'auto' }} aria-label="Lignes" />
        <Check checked={tous} onChange={(v) => setSel(v ? L.map((l) => l.id) : [])} label="Tout sélectionner" />
        {lect ? null : <><Btn kind="primary" disabled={!sel.length} onClick={() => etat('valide')}>✓ Valider la sélection</Btn><Btn disabled={!sel.length} onClick={() => etat('ecarte')}>Écarter</Btn>{filtre !== 'aVerifier' ? <Btn disabled={!sel.length} onClick={() => etat('aVerifier')}>Remettre à vérifier</Btn> : null}</>}
      </div>
      <div className="mt-2"><Tbl rows={L} empty="Aucune ligne." cols={[
        { h: '', r: (l) => <input type="checkbox" checked={sel.includes(l.id)} onChange={(e) => setSel(e.target.checked ? [...sel, l.id] : sel.filter((x) => x !== l.id))} aria-label={`Sélectionner ${l.nom}`} /> },
        { h: 'Produit', r: (l) => <b translate="no">{l.nom}</b> }, { h: 'Famille', r: (l) => famLabel(l.famille) }, { h: 'Dose', r: (l) => <span translate="no">{l.dose || '—'}</span> }, { h: 'Unité', r: (l) => <span translate="no">{l.unite}</span> },
        { h: 'Conditionnements', r: (l) => <span className="text-xs" translate="no">{l.cond || '—'}</span> }, { h: 'État', r: (l) => <Chip tone={l.etat === 'valide' ? 'good' : l.etat === 'ecarte' ? '' : 'warn'}>{CAT_ETATS[l.etat || 'aVerifier']}</Chip> },
        { h: '', r: (l) => (lect ? null : <Btn size="sm" onClick={() => setEd(l)}>Corriger</Btn>) },
      ]} /></div>
      {ed ? <CatalogueLigneForm c={c} l={ed} onClose={() => setEd(null)} /> : null}
    </Sheet>
  );
}
function CatalogueLigneForm({ c, l, onClose }) {
  const { act } = useApp(); const [f, set] = useDraft({ nom: l.nom, famille: l.famille || '', unite: l.unite || 'g', dose: l.dose || '', cond: l.cond || '', page: l.page || '', ue: !!l.ue, vegan: !!l.vegan, max: l.max || '', so2: l.so2 || '' });
  const save = () => { const r = act((d) => catalogueLigneModifier(d, c.id, l.id, f), 'Ligne corrigée.'); if (r && r.ok !== false) onClose(); };
  return (
    <FormSheet title="Corriger la ligne du catalogue" onClose={onClose} onSave={save}>
      <Field label="Produit"><TI value={f.nom} onChange={(v) => set('nom', v)} /></Field>
      <G n={3}><Field label="Famille"><SI value={f.famille} onChange={(v) => set('famille', v)} placeholder="—" options={CATALOGUE_FAMILLES.map(([id, label]) => ({ value: id, label, t: true }))} /></Field><Field label="Unité"><SI value={f.unite} onChange={(v) => set('unite', v)} options={UNITES.map((u) => ({ value: u, label: u }))} /></Field><Field label="Page"><TI value={f.page} onChange={(v) => set('page', v)} /></Field></G>
      <G><Field label="Dose conseillée"><TI value={f.dose} onChange={(v) => set('dose', v)} placeholder="ex. 20-30 g/hL" /></Field><Field label="Conditionnements"><TI value={f.cond} onChange={(v) => set('cond', v)} placeholder="ex. 500 g, 10 kg" /></Field></G>
      <G><Field label="Dose maximale indiquée"><TI value={f.max} onChange={(v) => set('max', v)} placeholder="ex. 60 g/hL" /></Field><Field label="Teneur en SO₂"><TI value={f.so2} onChange={(v) => set('so2', v)} placeholder="ex. 150 g/L" /></Field></G>
      <div className="flex flex-wrap gap-4"><Check checked={f.ue} onChange={(v) => set('ue', v)} label="Utilisable en bio (UE)" /><Check checked={f.vegan} onChange={(v) => set('vegan', v)} label="Vegan" /></div>
    </FormSheet>
  );
}
