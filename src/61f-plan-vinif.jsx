/* ============ PLAN DE VINIFICATION : INTERFACE (0.39.0-alpha.1) ============
   Module « plan » (onglet Vinification, sous-onglet « Plan de vinification ») : moteur 16s-plans-vinif.js.
   - Plan : le tableau (groupes de cépages × revendications × fractions ; étapes, produits, doses), à imprimer en A4 paysage comme
     l'instruction de travail de la cave ; modification, duplication, vérification, import d'un tableur (.xlsx, .xls, .ods, .csv).
   - Appliquer à un lot : colonne du plan qui s'applique au lot (cépage majoritaire, revendication, fraction), quantités calculées pour son
     volume (doses en g/hL, cL/hL, mL/hL, g/L), fiche à imprimer.
   - Schémas par lot : les schémas de vinification (avant : Paramètres › Schémas de vinification).
   0.48.0-alpha.1 : sous-onglet « Tableau du plan » (plus le nom du module répété) ; explication repliable (Aide « plan-vinif »). */
const PLANV_TYPES_LIB = { etape: 'Étape', section: 'Titre de section', note: 'Note (toute la largeur)' };
const PLANV_ETENDUES_LIB = { colonne: 'Une dose par colonne', revendication: 'Cuvée et tailles réunies', groupe: 'Tout le groupe de cépages' };
const planVinifEtat = (p) => (p.aVerifier ? <Chip tone="warn">{p.exemple ? 'exemple à vérifier' : 'à vérifier'}</Chip> : <Chip tone="good">vérifié</Chip>);
const planVinifTitre = (p) => [p.reference, p.version].filter(Boolean).join(' · ');

// le tableau (écran et impression) ; colKey : colonne d'un lot à mettre en évidence
function PlanVinifTableau({ plan, colKey }) {
  const cols = planVinifColonnes(plan); const G = planVinifListe(plan.groupes); const Rv = planVinifListe(plan.revendications); const F = planVinifListe(plan.fractions);
  const n = cols.length + 2; const lignes = plan.lignes || [];
  // étape répétée sur des lignes qui se suivent (un produit par ligne) : une seule cellule, comme dans le tableur ; sans produit, l'étape
  // prend aussi la colonne des produits
  const grp = []; lignes.forEach((l, i) => { const prec = grp[i - 1]; if (l.type === 'etape' && l.etape && prec && prec.etape === l.etape && lignes[i - 1].type === 'etape') { grp.push({ ...prec, debut: false }); prec.racine.n += 1; if (l.produit) prec.racine.prod = true; } else { const r = { n: 1, prod: !!l.produit }; grp.push({ etape: l.type === 'etape' ? l.etape : null, debut: true, racine: r }); } });
  const enLot = (c, etendue) => !!colKey && cols.some((x) => x.key === colKey && planVinifCle(etendue, x) === c.key);
  return (
    <table className="planv" data-planv-tableau="">
      <thead>
        <tr><th rowSpan={3} colSpan={2} className="planv-coin">{plan.sousTitre ? <span className="planv-st">{plan.sousTitre}</span> : null}</th>{G.map((g) => <th key={g.id} colSpan={Rv.length * F.length} className="planv-g">{g.label}</th>)}</tr>
        <tr>{G.map((g) => Rv.map((r) => <th key={`${g.id}|${r.id}`} colSpan={F.length} className="planv-r" translate="no">{r.label}</th>))}</tr>
        <tr>{cols.map((c) => <th key={c.key} className={cx('planv-f', colKey === c.key && 'planv-lot')}>{c.f.label}</th>)}</tr>
      </thead>
      <tbody>
        {lignes.map((l, i) => (l.type !== 'etape' ? <tr key={l.id} className={l.type === 'section' ? 'planv-section' : 'planv-note'} data-planv-ligne={l.id}><td colSpan={n}>{l.etape}</td></tr> : (
          <tr key={l.id} data-planv-ligne={l.id}>
            {grp[i].debut ? <td rowSpan={grp[i].racine.n} colSpan={grp[i].racine.prod ? 1 : 2} className="planv-e">{l.etape}</td> : null}
            {grp[i].racine.prod ? <td className="planv-p" translate="no">{l.produit}</td> : null}
            {planVinifCellules(plan, l).map((c) => <td key={c.key} colSpan={c.span} className={cx(!c.valeur && 'planv-vide', enLot(c, l.etendue) && 'planv-lot')}>{c.valeur}</td>)}
          </tr>)))}
      </tbody>
    </table>
  );
}
// page imprimable : en-tête de l'entreprise, référence du document, tableau
function PlanVinifRapport({ plan, colKey, refEl }) {
  const t = planVinifTitre(plan);
  return (
    <div ref={refEl} className="report" data-planv-rapport="">
      <ReportHead title={plan.nom} sub={`Plan de vinification${t ? ` · ${t}` : ''}`} />
      <PlanVinifTableau plan={plan} colKey={colKey} />
      {plan.note ? <p className="muted" style={{ fontSize: 11 }}>{plan.note}</p> : null}
      {plan.aVerifier ? <p className="muted" style={{ fontSize: 10.5 }}>Doses à vérifier avec votre œnologue et sur la fiche technique des produits.</p> : plan.verifieLe ? <p className="muted" style={{ fontSize: 10.5 }}>{`Vérifié le ${fmtDate(plan.verifieLe)}`}</p> : null}
    </div>
  );
}
function PlanVinifImpression({ plan, onClose }) {
  const ref = useRef(null); const out = useReportOutput(ref, `plan-vinification-${slug(plan.nom)}`, { orientation: 'paysage' });
  return <Sheet wide title={`Imprimer : ${plan.nom}`} sub="A4 paysage, couleurs imprimées comme à l’écran" onClose={onClose} footer={<><Btn onClick={onClose}>Fermer</Btn><BoutonsSortie out={out} /></>}><div className="overflow-x-auto"><PlanVinifRapport plan={plan} refEl={ref} /></div></Sheet>;
}

/* ---------- import d'un tableur ---------- */
async function planVinifLireFichier(db, file) {
  try { await loadXlsx(); } catch (e) { /* message ci-dessous */ }
  if (!window.XLSX || !window.XLSX.read) throw new Error('lecture Excel indisponible (bibliothèque non chargée, hors ligne ?)');
  const csv = /\.(csv|txt)$/i.test(file.name || '') || /text\//.test(file.type || '');
  const src = csv ? await lectureFichier(file) : await file.arrayBuffer();
  // lecture surveillée (garde des importations) : un classeur piégé ne peut pas modifier le cœur de l'application
  const feuilles = gardeSurveiller(() => { const wb = window.XLSX.read(src, { type: csv ? 'string' : 'array' }); return wb.SheetNames.slice(0, 12).map((sn) => ({ nom: sn, rows: window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' }), merges: wb.Sheets[sn]['!merges'] || [] })); });
  const lus = feuilles.map((f) => ({ f, r: planVinifDepuisFeuille(db, f.rows.map((r) => (csv ? r.map(csvSansFormule) : r)), f.merges, { fichier: file.name }) }));
  const ok = lus.filter((x) => x.r.ok);
  if (!ok.length) throw new Error(lus.length ? lus[0].r.msg : 'Classeur vide.');
  return ok.map((x) => ({ ...x.r.plan, nom: ok.length > 1 && !x.r.plan.nom ? x.f.nom : x.r.plan.nom }));
}
function PlanVinifImport({ onPlan }) {
  const { db, toast } = useApp(); const [busy, setBusy] = useState(false);
  const lire = async (files) => { const f = files[0]; if (!f) return; setBusy(true); try { const L = await planVinifLireFichier(db, f); toast(L.length > 1 ? `${L.length} plans lus : vérifiez le premier, puis importez les autres.` : 'Plan lu : vérifiez-le puis enregistrez.'); onPlan(L[0]); } catch (e) { toast(`Import impossible : ${(e && e.message) || e}`, 'bad'); } setBusy(false); };
  return <div className="space-y-3"><ZoneDepot onFiles={lire} busy={busy} multiple={false} accept=".xlsx,.xls,.ods,.csv,text/csv" icon="🗂" label="Importer un plan de vinification (tableur)" sub="Excel, LibreOffice ou CSV : titre, en-têtes (cépages, revendications, fractionnement), étapes, produits et doses" inputLabel="Tableur du plan de vinification" />
    <PlanProtocoleIa onPlan={onPlan} /></div>;
}
// 0.49.0-alpha.1 (IA05) : plan depuis un protocole libre (PDF, photo, texte) lu par l'IA (usage « planProtocole », niveau 1 : seul le
// document part) ; le plan lu est vérifié dans le même formulaire que l'import d'un tableur, marqué « à vérifier », trace « ia » gardée
function PlanProtocoleIa({ onPlan }) {
  const { db, toast } = useApp(); const ia = useIaUsage(); const [busy, setBusy] = useState(false); const [texte, setTexte] = useState(''); const [ouvert, setOuvert] = useState(false);
  const envoyer = async (o, fichier) => {
    const P = iaPlanPrompt(o.texte || '');
    const r = await ia.demander('planProtocole', { system: P.system, texte: P.texte, images: o.images || [], schema: P.schema, nom: P.nom, max: P.max }); if (!r) return;
    const x = iaPlanLire(db, r.valeur, { fichier, trace: r.trace }); if (!x.ok) { toast(x.msg, 'bad'); return; }
    toast(`Protocole lu : ${x.lignes} ligne(s), ${x.colonnes} colonne(s). Vérifiez le plan avant de l’enregistrer.`); onPlan(x.plan);
  };
  const lireFichiers = async (files) => {
    const f = files[0]; if (!f) return; setBusy(true);
    try {
      if (/^text\//.test(f.type || '') || /\.txt$/i.test(f.name || '')) { const g = await gardeFichier(f, 'document'); if (!g.file) throw { message: `« ${f.name} » refusé.` }; await envoyer({ texte: String(await lectureFichier(g.file) || '').slice(0, 15000) }, f.name); }
      else await envoyer({ images: await iaImagesDepuisFichiers([f], { pages: 6 }) }, f.name);
    } catch (e) { toast((e && e.message) || 'Lecture impossible.', 'bad'); } finally { setBusy(false); }
  };
  const lireTexte = async () => { if (!texte.trim()) return; setBusy(true); try { await envoyer({ texte }, ''); } finally { setBusy(false); } };
  return (
    <div className="rounded-md border border-line p-3 space-y-2" data-planv-protocole="">
      <div className="flex flex-wrap items-center gap-2"><IaFichierBouton usage="planProtocole" accept={`${IA_DOC_ACCEPT},.txt,text/plain`} busy={busy} onFichiers={lireFichiers}>Depuis un protocole (PDF, photo, texte)</IaFichierBouton>
        <button type="button" className="linkish text-sm" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert}>Ou coller le texte du protocole</button></div>
      <p className="help">L’IA met le protocole en tableau (groupes de cépages, revendications, fractions, étapes, produits et doses) ; vous vérifiez le plan lu avant de l’enregistrer, et il reste « à vérifier ».</p>
      {ouvert ? <div className="space-y-2"><TA value={texte} onChange={setTexte} rows={6} placeholder="Collez ici le protocole de vinification…" aria-label="Texte du protocole" data-planv-protocole-texte="" />
        <IaBouton usage="planProtocole" busy={busy} disabled={!texte.trim()} onClick={lireTexte}>Lire ce texte</IaBouton></div> : null}
    </div>
  );
}

/* ---------- formulaire ---------- */
const planVinifIdNeuf = (L, p) => { let k = L.length + 1; while (L.some((x) => x.id === `${p}${k}`)) k += 1; return `${p}${k}`; };
function PlanVinifForm({ id, base, onClose }) {
  const { db, act, uid } = useApp(); const p0 = id ? plansVinifDe(db).find((x) => x.id === id) : base;
  const [f, set, setF] = useDraft(() => { const c = clone(p0 || PLANV_EXEMPLE()[0]); if (!p0) { c.nom = ''; delete c.exemple; } return { ...c, verifie: !c.aVerifier }; });
  const [voir, setVoir] = useState(false);
  const cepages = (db.lists.cepages || []); const qualifs = (db.lists.qualifs || DEFAULT_QUALIFS()); const fracs = fracList(db);
  const liste = (k, i, patch) => set(k, f[k].map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const retirer = (k, i) => set(k, f[k].filter((x, j) => j !== i));
  const coche = (k, i, champ, v, on) => liste(k, i, { [champ]: on ? uniq([...(f[k][i][champ] || []), v]) : (f[k][i][champ] || []).filter((x) => x !== v) });
  const ligne = (i, patch) => set('lignes', f.lignes.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const valeur = (i, k, v) => ligne(i, { valeurs: { ...(f.lignes[i].valeurs || {}), [k]: v } });
  const bouge = (i, d) => { const L = [...f.lignes]; const j = i + d; if (j < 0 || j >= L.length) return; [L[i], L[j]] = [L[j], L[i]]; set('lignes', L); };
  const ajouter = (type, apres) => { const L = [...f.lignes]; const nl = { id: planVinifIdNeuf(L, 'l'), type, etape: '', produit: '', etendue: 'colonne', valeurs: {} }; L.splice(apres == null ? L.length : apres + 1, 0, nl); set('lignes', L); };
  const save = () => { const r = act((d) => planVinifSave(d, { ...f, aVerifier: !f.verifie }, id, uid), id ? 'Plan de vinification modifié.' : 'Plan de vinification enregistré.'); if (r && r.ok !== false) onClose(); };
  const apercu = planVinifNet(db, f);
  return (
    <FormSheet wide title={id ? 'Colonnes et propriétés du plan' : 'Nouveau plan de vinification'} sub={p0 && !id ? 'Vérifiez le plan lu avant de l’enregistrer.' : undefined} onClose={onClose} onSave={save}
      extraFooter={<Btn className="mr-auto" onClick={() => setVoir(!voir)} disabled={!apercu}>{voir ? 'Masquer l’aperçu' : '👁 Aperçu'}</Btn>}>
      <div data-planv-form="">
        {!id && f.ia ? <div className="mb-3"><Notice tone="info" title="🤖 Plan lu par l’IA depuis un protocole"><span data-planv-ia="">Comparez chaque ligne et chaque dose au protocole avant d’enregistrer : le plan reste « à vérifier ».</span></Notice></div> : null}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
          <Field label="Nom du plan"><TI value={f.nom} onChange={(v) => set('nom', v)} placeholder="ex. Vinification en blanc" autoFocus aria-label="Nom du plan" /></Field>
          <Field label="Référence (document qualité)"><TI value={f.reference} onChange={(v) => set('reference', v)} placeholder="ex. OE-INS-01" /></Field>
          <Field label="Version"><TI value={f.version} onChange={(v) => set('version', v)} placeholder="ex. V1.2" /></Field>
        </div>
        <Field label="Sous-titre"><TI value={f.sousTitre} onChange={(v) => set('sousTitre', v)} placeholder="ex. Les quantités d’intrants indiquées sont adaptées à chaque lot" /></Field>
        <Group label="Colonnes : groupes de cépages × revendications × fractions">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))' }}>
            <div className="card space-y-2 p-3" data-planv-groupes=""><div className="lbl">Groupes de cépages</div>
              {f.groupes.map((g, i) => <div key={g.id} className="rounded-md border border-line p-2"><div className="flex gap-1"><TI value={g.label} onChange={(v) => liste('groupes', i, { label: v })} aria-label="Groupe de cépages" /><Btn size="sm" kind="ghost" onClick={() => retirer('groupes', i)} aria-label="Retirer le groupe" disabled={f.groupes.length < 2}>✕</Btn></div>
                <div className="mt-1 flex flex-wrap gap-x-3">{cepages.map((c) => <Check key={c.id} checked={(g.cepages || []).includes(c.id)} onChange={(v) => coche('groupes', i, 'cepages', c.id, v)} label={c.label} />)}</div></div>)}
              <Btn size="sm" onClick={() => set('groupes', [...f.groupes, { id: planVinifIdNeuf(f.groupes, 'g'), label: '', cepages: [] }])}>＋ Groupe</Btn></div>
            <div className="card space-y-2 p-3" data-planv-revendications=""><div className="lbl">Revendications</div>
              {f.revendications.map((r, i) => <div key={r.id} className="flex gap-1"><select className="inp" value={qualifs.some((q) => q.id === r.id) ? r.id : ''} onChange={(e) => { const q = qualifs.find((x) => x.id === e.target.value); liste('revendications', i, q ? { id: q.id, label: qualifAffiche(q) } : { id: planVinifIdNeuf(f.revendications, 'r') }); }} aria-label="Revendication de la liste"><option value="">— autre —</option>{qualifs.map((q) => <option key={q.id} value={q.id}>{qualifAffiche(q)}</option>)}</select>
                <TI value={r.label} onChange={(v) => liste('revendications', i, { label: v })} aria-label="Libellé de la revendication" /><Btn size="sm" kind="ghost" onClick={() => retirer('revendications', i)} aria-label="Retirer la revendication" disabled={f.revendications.length < 2}>✕</Btn></div>)}
              <Btn size="sm" onClick={() => set('revendications', [...f.revendications, { id: planVinifIdNeuf(f.revendications, 'r'), label: '' }])}>＋ Revendication</Btn></div>
            <div className="card space-y-2 p-3" data-planv-fractions=""><div className="lbl">Fractions</div>
              {f.fractions.map((x, i) => <div key={x.id} className="rounded-md border border-line p-2"><div className="flex gap-1"><TI value={x.label} onChange={(v) => liste('fractions', i, { label: v })} aria-label="Fraction" /><Btn size="sm" kind="ghost" onClick={() => retirer('fractions', i)} aria-label="Retirer la fraction" disabled={f.fractions.length < 2}>✕</Btn></div>
                <div className="mt-1 flex flex-wrap gap-x-3">{fracs.map((c) => <Check key={c.id} checked={(x.fractions || []).includes(c.id)} onChange={(v) => coche('fractions', i, 'fractions', c.id, v)} label={c.label} />)}</div></div>)}
              <Btn size="sm" onClick={() => set('fractions', [...f.fractions, { id: planVinifIdNeuf(f.fractions, 'f'), label: '', fractions: [] }])}>＋ Fraction</Btn></div>
          </div>
          <p className="help mt-1">Les cépages et les fractions cochés servent à trouver la colonne d’un lot (cépage majoritaire, fraction) ; la revendication du lot choisit sa revendication.</p>
        </Group>
        <Group label="Lignes du plan">
          <div className="space-y-2" data-planv-lignes="">
            {f.lignes.map((l, i) => { const cases = planVinifCasesSaisie(f, l.etendue); return (
              <div key={l.id} className="rounded-md border border-line p-2" data-planv-ligne-form={i}>
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="Type" className="w-44"><select className="inp" value={l.type} onChange={(e) => ligne(i, { type: e.target.value })} aria-label="Type de ligne">{Object.keys(PLANV_TYPES_LIB).map((k) => <option key={k} value={k}>{PLANV_TYPES_LIB[k]}</option>)}</select></Field>
                  <Field label={l.type === 'etape' ? 'Étape' : 'Texte'} className="min-w-0 flex-1"><TI value={l.etape} onChange={(v) => ligne(i, { etape: v })} placeholder={l.type === 'etape' ? 'ex. Sulfitage' : 'ex. Débourbage'} aria-label={l.type === 'etape' ? 'Étape' : 'Texte'} /></Field>
                  {l.type === 'etape' ? <Field label="Produit" className="min-w-0 flex-1"><TI value={l.produit} onChange={(v) => ligne(i, { produit: v })} placeholder="ex. solution sulfureuse" aria-label="Produit" /></Field> : null}
                  {l.type === 'etape' ? <Field label="Doses" className="w-56"><select className="inp" value={l.etendue} onChange={(e) => ligne(i, planVinifChangerEtendue(f, l, e.target.value))} aria-label="Étendue des doses">{Object.keys(PLANV_ETENDUES_LIB).map((k) => <option key={k} value={k}>{PLANV_ETENDUES_LIB[k]}</option>)}</select></Field> : null}
                  <span className="flex gap-1"><Btn size="sm" kind="ghost" onClick={() => bouge(i, -1)} aria-label="Monter">↑</Btn><Btn size="sm" kind="ghost" onClick={() => bouge(i, 1)} aria-label="Descendre">↓</Btn><Btn size="sm" kind="ghost" onClick={() => ajouter('etape', i)} aria-label="Insérer une ligne après">＋</Btn><Btn size="sm" kind="ghost" onClick={() => set('lignes', f.lignes.filter((x, j) => j !== i))} aria-label="Retirer la ligne">✕</Btn></span>
                </div>
                {l.type === 'etape' ? <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))' }}>{cases.map((c) => <label key={c.key} className="text-xs"><span className="text-ink2">{c.label}</span><input className="inp" value={(l.valeurs || {})[c.key] || ''} onChange={(e) => valeur(i, c.key, e.target.value)} aria-label={`${l.etape || 'Étape'} — ${c.label}`} data-planv-case={c.key} /></label>)}</div> : null}
              </div>); })}
            <div className="flex flex-wrap gap-2"><Btn size="sm" onClick={() => ajouter('etape')}>＋ Étape</Btn><Btn size="sm" onClick={() => ajouter('section')}>＋ Titre de section</Btn><Btn size="sm" onClick={() => ajouter('note')}>＋ Note</Btn></div>
            <p className="help">Doses écrites comme dans votre document (« 4,3 cL/hL », « 10 g/hL », « 22 g/L », « 18 °C »…) : celles en g, cL ou mL par hL ou par L donnent une quantité calculée pour le volume d’un lot.</p>
          </div>
        </Group>
        <Field label="Note"><TI value={f.note} onChange={(v) => set('note', v)} placeholder="ex. validé par l’œnologue" /></Field>
        <Check checked={f.verifie} onChange={(v) => set('verifie', v)} label="Plan vérifié (retire la mention « à vérifier »)" />
        {voir && apercu ? <div className="overflow-x-auto"><PlanVinifRapport plan={{ ...apercu, aVerifier: !f.verifie }} /></div> : null}
      </div>
    </FormSheet>
  );
}

/* ---------- sous-onglet « Plan de vinification » ---------- */
function PlanVinifVue() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('plan'); const ask = useRetirer();
  const L = plansVinifDe(db); const [selId, setSel] = useState(''); const sel = L.find((p) => p.id === selId) || L.find((p) => p.actif !== false) || L[0] || null;
  const [form, setForm] = useState(null); const [imp, setImp] = useState(false); const [importer, setImporter] = useState(false); const [cond, setCond] = useState(false);
  const ct = sel ? planConditionsTexte(db, sel) : '';
  return (
    <div data-planv="">
      <Aide id="plan-vinif" resume="Les doses sont à adapter à chaque lot, avec votre œnologue.">
        <span>Instruction de travail de la cave : pour chaque étape (sulfitage, enzymage, débourbage, levurage, chaptalisation, FML, passage au froid, filtration, tirage…), le produit et la dose selon le groupe de cépages, la revendication et la fraction.</span>{' '}
        <span>Modifiez directement les cases du tableau. À la création d’un lot, les étapes de sa colonne lui sont proposées dans l’ordre, comme opérations à réaliser ; une variante (partenaire, cru, échelle, revendication…) remplace le plan général pour les lots qui remplissent ses conditions.</span>
      </Aide>
      <div className="my-3 flex flex-wrap items-center gap-2">
        {L.length > 1 ? <select className="inp" style={{ width: 'auto', maxWidth: 360 }} value={sel ? sel.id : ''} onChange={(e) => setSel(e.target.value)} aria-label="Plan de vinification">{L.map((p) => <option key={p.id} value={p.id}>{`${planVinifEstVariante(p) ? '↳ ' : ''}${p.nom}${planVinifTitre(p) ? ` (${planVinifTitre(p)})` : ''}${p.actif === false ? ' — archivé' : ''}`}</option>)}</select> : null}
        {sel ? <><span className="text-sm text-ink2">{planVinifTitre(sel)}</span>{planVinifEtat(sel)}</> : null}
        <span className="ml-auto flex flex-wrap gap-2">
          {sel ? <Btn onClick={() => setImp(true)} data-planv-imprimer="">🖨 Imprimer…</Btn> : null}
          {lect ? null : <>
            {sel ? <Btn onClick={() => setForm({ id: sel.id })} data-planv-modifier="">⚙ Colonnes & propriétés</Btn> : null}
            {sel ? <Btn onClick={() => setCond(true)} data-planv-conditions-ouvrir="">🎯 Conditions</Btn> : null}
            {sel ? <Btn onClick={() => { const r = act((d) => planVinifVariante(d, sel.id, null, uid), 'Variante créée : précisez ses conditions.'); if (r && r.ok && r.id) { setSel(r.id); setCond(true); } }} data-planv-variante="">＋ Variante</Btn> : null}
            {sel && sel.aVerifier ? <Btn kind="primary" onClick={() => act((d) => planVinifValider(d, sel.id, uid), 'Plan vérifié.')}>✓ Vérifié</Btn> : null}
            {sel ? <Btn onClick={() => act((d) => planVinifDupliquer(d, sel.id, uid), 'Plan dupliqué : modifiez la copie.')}>Dupliquer</Btn> : null}
            {sel ? <Btn onClick={() => act((d) => { const p = plansVinifMaterialiser(d).find((x) => x.id === sel.id); if (!p) return fail('Plan de vinification introuvable.'); p.actif = p.actif === false; return okr(); }, sel.actif === false ? 'Plan rétabli.' : 'Plan archivé.')}>{sel.actif === false ? 'Rétablir' : 'Archiver'}</Btn> : null}
            {sel ? <Btn kind="danger" onClick={() => ask('Retirer ce plan de vinification ?', (d) => planVinifSupprimer(d, sel.id), 'Plan retiré.')}>Retirer</Btn> : null}
            <Btn onClick={() => setImporter(!importer)} data-planv-importer="">⬆ Importer un tableur</Btn>
            <Btn kind="primary" onClick={() => setForm({})} data-planv-nouveau="">＋ Nouveau plan</Btn>
          </>}
        </span>
      </div>
      {importer && !lect ? <div className="mb-4"><PlanVinifImport onPlan={(p) => { setImporter(false); setForm({ base: p }); }} /></div> : null}
      <div className="mb-2" data-planv-proposer=""><Check checked={schemasReglage(db).proposer} disabled={lect} onChange={(v) => act((d) => { d.settings.schemas = { ...((d.settings && d.settings.schemas) || {}), proposer: v }; return okr(); }, v ? 'Les étapes du plan seront proposées à la création des lots.' : 'Plus de proposition à la création des lots.')} label="Proposer les étapes du plan à la création d’un lot (pressurage, marc validé, entrée de moûts)" /></div>
      {sel ? <p className="mb-2 text-sm" data-planv-conditions-texte="">{ct ? <><b>Variante</b> — <span translate="no">{ct}</span></> : <span className="text-ink2">Plan général : tous les lots qui ne remplissent les conditions d’aucune variante.</span>}</p> : null}
      {sel ? <div className="overflow-x-auto"><div className="report"><ReportHead title={sel.nom} sub={`Plan de vinification${planVinifTitre(sel) ? ` · ${planVinifTitre(sel)}` : ''}`} /><PlanVinifTableauEdit plan={sel} lect={lect} />{sel.note ? <p className="muted" style={{ fontSize: 11 }}>{sel.note}</p> : null}</div></div> : <Empty>Aucun plan de vinification : créez-en un ou importez votre tableur.</Empty>}
      {cond && sel ? <PlanConditionsForm plan={sel} onClose={() => setCond(false)} /> : null}
      {form ? <PlanVinifForm id={form.id} base={form.base} onClose={() => setForm(null)} /> : null}
      {imp && sel ? <PlanVinifImpression plan={sel} onClose={() => setImp(false)} /> : null}
    </div>
  );
}

/* ---------- sous-onglet « Appliquer à un lot » ---------- */
function PlanVinifLot() {
  const { db, R, showLot } = useApp(); const L = plansVinifDe(db).filter((p) => p.actif !== false);
  const lots = useMemo(() => Object.values(R.lots).filter((l) => (R.lotVol[l.id] || 0) > 0.5).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true })), [R]);
  const [planId, setPlan] = useState(''); const [lotId, setLot] = useState(''); const [vol, setVol] = useState(''); const [force, setForce] = useState({});
  const plan = L.find((p) => p.id === planId) || L[0] || null; const ref = useRef(null);
  const out = useReportOutput(ref, `plan-vinification-lot-${slug((R.lots[lotId] || {}).code || 'lot')}`, { orientation: 'portrait' });
  const res = useMemo(() => (plan && lotId ? planVinifPourLot(db, R, plan, lotId, hasNum(vol) ? num(vol) * 100 : null) : null), [db, R, plan, lotId, vol]);
  // choix manuel d'un groupe, d'une revendication ou d'une fraction (lot d'assemblage, cépage non rangé dans un groupe…)
  const choix = (k) => force[k] || (res && res[k === 'g' ? 'groupe' : k === 'r' ? 'revendication' : 'fraction'] ? res[k === 'g' ? 'groupe' : k === 'r' ? 'revendication' : 'fraction'].id : '');
  const col = plan && res ? planVinifColonnes(plan).find((c) => c.g.id === choix('g') && c.r.id === choix('r') && c.f.id === choix('f')) || null : null;
  const volL = res ? res.volL : 0;
  const lignes = plan && col ? (plan.lignes || []).map((l) => { const v = l.type === 'etape' ? planVinifValeur(l, col) : ''; return { ligne: l, valeur: v, quantite: v ? planVinifQuantite(v, volL) : null }; }) : [];
  if (!L.length) return <Empty>Aucun plan de vinification actif.</Empty>;
  const sel = (k, opts, label) => <Field label={label}><select className="inp" value={choix(k)} onChange={(e) => setForce((x) => ({ ...x, [k]: e.target.value }))} aria-label={label}><option value="">— à choisir —</option>{opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select></Field>;
  return (
    <div data-planv-lot="">
      <div className="card mb-4 grid gap-3 p-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        {L.length > 1 ? <Field label="Plan"><select className="inp" value={plan ? plan.id : ''} onChange={(e) => { setPlan(e.target.value); setForce({}); }} aria-label="Plan">{L.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}</select></Field> : null}
        <Field label="Lot"><select className="inp" value={lotId} onChange={(e) => { setLot(e.target.value); setForce({}); setVol(''); }} aria-label="Lot" data-planv-choix-lot=""><option value="">— choisir un lot en cuve —</option>{lots.map((l) => <option key={l.id} value={l.id}>{`${l.code}${l.designation ? ` — ${l.designation}` : ''} (${fmtL(R.lotVol[l.id] || 0)})`}</option>)}</select></Field>
        {lotId ? <Field label="Volume (hL)" help={`Volume actuel du lot : ${fmtL(R.lotVol[lotId] || 0)}`}><NI value={vol} onChange={setVol} placeholder={fmtHL(R.lotVol[lotId] || 0)} aria-label="Volume (hL)" /></Field> : null}
        {res && plan ? <>{sel('g', planVinifListe(plan.groupes), 'Groupe de cépages')}{sel('r', planVinifListe(plan.revendications), 'Revendication')}{sel('f', planVinifListe(plan.fractions), 'Fraction')}</> : null}
      </div>
      {!lotId ? <Empty>Choisissez un lot : le plan donne ses étapes, ses produits et les quantités pour son volume.</Empty> : !col ? <Notice tone="warn" title="Colonne du plan à choisir">Le lot ne correspond à aucune colonne du plan (cépage, revendication ou fraction) : choisissez-la ci-dessus.</Notice> : (<>
        <div className="mb-2 flex flex-wrap items-center gap-2"><span className="text-sm">Colonne : <b>{`${col.g.label} · ${col.r.label} · ${col.f.label}`}</b></span><span className="ml-auto flex flex-wrap gap-2"><BoutonsSortie out={out} /></span></div>
        <div className="overflow-x-auto">
          <div ref={ref} className="report" data-planv-fiche-lot="">
            <ReportHead title={`${plan.nom} — lot ${(R.lots[lotId] || {}).code || ''}`} sub={`Plan de vinification${planVinifTitre(plan) ? ` · ${planVinifTitre(plan)}` : ''}`} />
            <p style={{ fontSize: 12, margin: '0 0 6px' }}><b translate="no">{(R.lots[lotId] || {}).code}</b>{(R.lots[lotId] || {}).designation ? <span translate="no">{` — ${(R.lots[lotId] || {}).designation}`}</span> : null}{` · ${fmtL(volL)} · ${col.g.label} · ${col.r.label} · ${col.f.label}`}</p>
            <table><thead><tr><th>Étape</th><th>Produit</th><th>Dose</th><th>Quantité pour le lot</th><th>Fait le / par</th></tr></thead>
              <tbody>{lignes.map(({ ligne: l, valeur, quantite }) => (l.type !== 'etape' ? <tr key={l.id}><td colSpan={5} style={{ fontWeight: l.type === 'section' ? 700 : 400, fontStyle: l.type === 'note' ? 'italic' : 'normal', background: l.type === 'section' ? '#EEE9DB' : undefined }}>{l.etape}</td></tr>
                : <tr key={l.id} data-planv-lot-ligne={l.id} style={valeur ? undefined : { color: '#999' }}><td>{l.etape}</td><td translate="no">{l.produit}</td><td>{valeur || '—'}</td><td className="num">{quantite ? `${fmt(quantite.qte, quantite.qte < 10 ? 2 : 1)} ${quantite.unite}` : ''}</td><td /></tr>))}</tbody></table>
            <p className="muted" style={{ fontSize: 10.5 }}>Quantités calculées sur le volume indiqué, à ajuster selon les analyses du lot et la fiche technique des produits.</p>
          </div>
        </div>
        <div className="mt-2"><button type="button" className="linkish" onClick={() => showLot(lotId)}>Ouvrir la fiche du lot</button></div>
      </>)}
    </div>
  );
}

/* ---------- module « Plan de vinification » ---------- */
function TabPlan() {
  const { db, uid, secu } = useApp();
  const voirSchemas = !secu || niveauModule(db, uid, 'params') !== 'aucun';
  // 0.43.0-alpha.2 : « Schémas par lot » retiré (schémas convertis en variantes du plan) ; l'ancien identifiant mène au plan
  const items = [{ id: 'plan', label: 'Tableau du plan' }, { id: 'lot', label: 'Appliquer à un lot' }]; void voirSchemas; // 0.48.0-alpha.1 : plus le nom du module répété
  const [sub0, setSub] = useSousOnglet([...items, { id: 'schemas', label: '' }], 'plan'); const sub = sub0 === 'schemas' ? 'plan' : sub0;
  return <div><SubNav value={sub} onChange={setSub} items={items} />{sub === 'lot' ? <PlanVinifLot /> : <PlanVinifVue />}</div>;
}
TABS_REG.plan = TabPlan;
