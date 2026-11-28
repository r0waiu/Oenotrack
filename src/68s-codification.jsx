/* ============ PARAMÈTRES › CODIFICATION DES LOTS (0.41.0-alpha.1) ============
   Une règle par stade, composée librement de briques (texte, séparateur, date, millésime, compteur, donnée du lot, choix dans une
   table, reprise du code précédent), avec conditions et mise en forme ; aperçu en direct sur un lot réel ou un exemple ; versions
   datées (une version qui a servi n'est plus modifiable : on en crée une nouvelle à partir d'une date) ; tables de correspondance ;
   export et import d'une codification complète (JSON). */

const CODIF_ENCODAGES = [{ value: 'chiffres', label: 'Chiffres' }, { value: 'champenois', label: 'Code champenois (C-H-A-M-P-E-N-O-I-S)' }, { value: 'lettres', label: 'Lettres (1 = A, 2 = B…)' }, { value: 'table', label: 'Table de correspondance' }];
const codifNomBrique = (b, i) => String(b.nom || '').trim() || `${b.type}${i + 1}`;
// résumé d'une brique (liste de la règle)
function codifBriqueTexte(db, b) {
  const t = (id) => (codifTable(db, id) || {}).nom || '?';
  switch (b.type) {
    case 'texte': return `« ${b.valeur || ''} »`;
    case 'sep': return `séparateur « ${b.valeur || ''} »`;
    case 'date': { const d = CODIF_DATES.find((x) => x.id === b.champ) || {}; const e = b.encodage === 'table' ? `table ${t(b.tableId)}` : (CODIF_ENCODAGES.find((x) => x.value === (b.encodage || 'chiffres')) || {}).label; return `${d.label || 'Date'} · ${b.encodage && b.encodage !== 'chiffres' ? e : `${num(b.chiffres) || d.chiffres || 2} chiffre(s)`}`; }
    case 'millesime': return `Millésime(s) · ${b.encodage === 'champenois' ? 'code champenois' : `${num(b.chiffres) || 2} chiffre(s)`}`;
    case 'compteur': return `Compteur · ${b.alphabet === 'alpha' ? 'A, B, C…' : b.alphabet === 'alphaInv' ? 'Z, Y, X…' : b.alphabet === 'perso' ? `« ${b.caracteres || ''} »` : `${num(b.chiffres) || 1} chiffre(s)`} · remise à zéro : ${((CODIF_RAZ.find((x) => x.id === (b.raz || 'jamais')) || {}).label || '').toLowerCase()}${(b.razParties || []).length ? ` + ${b.razParties.join(' + ')}` : ''}`;
    case 'variable': { const v = CODIF_VARS.find((x) => x.id === b.variable) || {}; return `${v.label || 'Donnée'}${b.rendu === 'table' ? ` · table ${t(b.tableId)}` : b.rendu === 'court' ? ' · code court' : ''}`; }
    case 'choix': return `Choix : ${t(b.tableId)}`;
    case 'herite': return b.mode === 'partie' ? `Reprise de la partie « ${b.partie || '?'} »` : b.mode === 'position' ? `Reprise des caractères ${num(b.debut) || 1} à ${num(b.fin) || 'fin'}` : 'Reprise du code entier';
    default: return b.type;
  }
}
const codifBriqueNeuve = (type) => ({ type, ...(type === 'texte' ? { valeur: 'L' } : type === 'sep' ? { valeur: '-' } : type === 'date' ? { champ: 'annee', chiffres: 2, encodage: 'chiffres' } : type === 'millesime' ? { chiffres: 2, sep: '/', nv: 'NV' } : type === 'compteur' ? { chiffres: 2, alphabet: 'num', raz: 'annee', depart: 1, pas: 1 } : type === 'variable' ? { variable: 'cepage', rendu: 'court' } : type === 'herite' ? { mode: 'tout' } : {}) });

// mise en forme et condition, communes à toutes les briques
function CodifBriqueForme({ db, b, set, autres }) {
  const vars = [...CODIF_VARS.map((v) => ({ value: v.id, label: v.label })), ...codifTables(db).filter((t) => t.source === 'libre').map((t) => ({ value: `choix:${t.id}`, label: `Choix : ${t.nom}` })), ...autres.map((n) => ({ value: `partie:${n}`, label: `Partie « ${n} »` }))];
  const si = b.si || {};
  return (<div className="grid gap-2">
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))' }}>
      <Field label="Largeur fixe"><NI value={b.largeur || ''} onChange={(v) => set({ largeur: v })} placeholder="libre" aria-label="Largeur fixe" /></Field>
      <Field label="Compléter avec"><TI value={b.remplir === undefined ? '' : b.remplir} onChange={(v) => set({ remplir: v.slice(0, 1) })} placeholder="espace" maxLength={1} aria-label="Caractère de remplissage" /></Field>
      <Field label="Alignement"><SI plain value={b.aligne || 'gauche'} onChange={(v) => set({ aligne: v })} options={[{ value: 'gauche', label: 'À gauche' }, { value: 'droite', label: 'À droite' }]} /></Field>
      <Field label="Casse"><SI plain value={b.casse || ''} onChange={(v) => set({ casse: v })} options={[{ value: '', label: 'Inchangée' }, { value: 'maj', label: 'MAJUSCULES' }, { value: 'min', label: 'minuscules' }]} /></Field>
      <Field label="Garder seulement"><NI value={b.garder || ''} onChange={(v) => set({ garder: v })} placeholder="tout" aria-label="Nombre de caractères gardés" /></Field>
      <Field label="… caractères"><SI plain value={b.garderDe || 'debut'} onChange={(v) => set({ garderDe: v })} options={[{ value: 'debut', label: 'du début' }, { value: 'fin', label: 'de la fin' }]} /></Field>
    </div>
    <Check checked={b.sansAccents} onChange={(v) => set({ sansAccents: v })} label="Sans accents" />
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Field label="Seulement si"><SI plain value={si.variable || ''} onChange={(v) => set({ si: v ? { test: 'rempli', ...si, variable: v } : undefined })} options={[{ value: '', label: 'Toujours' }, ...vars]} aria-label="Condition" /></Field>
      {si.variable ? <Field label="Condition"><SI plain value={si.test || 'rempli'} onChange={(v) => set({ si: { ...si, test: v } })} options={CODIF_TESTS.map((x) => ({ value: x.id, label: x.label }))} /></Field> : null}
      {si.variable && ['egal', 'different'].includes(si.test) ? <Field label="Valeur"><TI value={si.valeur || ''} onChange={(v) => set({ si: { ...si, valeur: v } })} aria-label="Valeur de la condition" /></Field> : null}
    </div>
    {si.variable && num(b.largeur) > 0 ? <Check checked={b.reserver} onChange={(v) => set({ reserver: v })} label="Si la condition n’est pas remplie, réserver la place (caractères de remplissage)" /> : null}
  </div>);
}
function CodifBriqueEditeur({ db, stade, b, set, autres }) {
  const tablesLibres = codifTables(db).filter((t) => t.source === 'libre'); const tOpts = (L) => [{ value: '', label: 'Table…' }, ...L.map((t) => ({ value: t.id, label: t.nom }))];
  const def = CODIF_VARS.find((v) => v.id === b.variable) || {}; const parties = uniq(CODIF_STADES.flatMap((s) => codifParties(db, s.id)));
  return (<div className="grid gap-3 rounded-md border border-line p-3" data-codif-brique-ed="">
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Field label="Nom de la partie" help="Sert à la reprendre à l’étape suivante, ou dans une condition."><TI value={b.nom || ''} onChange={(v) => set({ nom: v })} placeholder="ex. cuvée" aria-label="Nom de la partie" /></Field>
      {b.type === 'texte' || b.type === 'sep' ? <Field label={b.type === 'sep' ? 'Séparateur' : 'Texte'}><TI value={b.valeur || ''} onChange={(v) => set({ valeur: v })} aria-label="Texte de la brique" /></Field> : null}
      {b.type === 'date' ? <><Field label="Élément"><SI plain value={b.champ || 'annee'} onChange={(v) => set({ champ: v, chiffres: (CODIF_DATES.find((x) => x.id === v) || {}).chiffres })} options={CODIF_DATES.map((x) => ({ value: x.id, label: x.label }))} aria-label="Élément de date" /></Field>
        <Field label="Écriture"><SI plain value={b.encodage || 'chiffres'} onChange={(v) => set({ encodage: v })} options={CODIF_ENCODAGES} aria-label="Écriture" /></Field>
        {b.encodage === 'table' ? <Field label="Table"><SI plain value={b.tableId || ''} onChange={(v) => set({ tableId: v })} options={tOpts(codifTables(db))} /></Field> : b.encodage !== 'lettres' ? <Field label="Chiffres">{b.champ === 'annee' ? <SI plain value={String(b.chiffres || 2)} onChange={(v) => set({ chiffres: +v })} options={[{ value: '1', label: '1 (6)' }, { value: '2', label: '2 (26)' }, { value: '4', label: '4 (2026)' }]} aria-label="Chiffres" /> : <NI value={b.chiffres || ''} onChange={(v) => set({ chiffres: v })} aria-label="Chiffres" />}</Field> : null}</> : null}
      {b.type === 'millesime' ? <><Field label="Chiffres"><SI plain value={String(b.chiffres || 2)} onChange={(v) => set({ chiffres: +v })} options={[{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '4', label: '4' }]} aria-label="Chiffres du millésime" /></Field>
        <Field label="Écriture"><SI plain value={b.encodage || 'chiffres'} onChange={(v) => set({ encodage: v })} options={CODIF_ENCODAGES} /></Field>
        {b.encodage === 'table' ? <Field label="Table"><SI plain value={b.tableId || ''} onChange={(v) => set({ tableId: v })} options={tOpts(codifTables(db))} /></Field> : null}
        <Field label="Plusieurs millésimes"><SI plain value={b.mode || 'tous'} onChange={(v) => set({ mode: v })} options={[{ value: 'tous', label: 'Tous (19/20)' }, { value: 'majoritaire', label: 'Le majoritaire' }, { value: 'premier', label: 'Le plus ancien' }, { value: 'dernier', label: 'Le plus récent' }]} /></Field>
        <Field label="Entre deux millésimes"><TI value={b.sep === undefined ? '/' : b.sep} onChange={(v) => set({ sep: v })} aria-label="Séparateur des millésimes" /></Field>
        <Field label="Sans millésime"><TI value={b.nv === undefined ? 'NV' : b.nv} onChange={(v) => set({ nv: v })} aria-label="Texte sans millésime" /></Field></> : null}
      {b.type === 'compteur' ? <><Field label="Écriture"><SI plain value={b.alphabet || 'num'} onChange={(v) => set({ alphabet: v })} options={[{ value: 'num', label: 'Chiffres (01, 02…)' }, { value: 'alpha', label: 'Lettres (A, B… Z, AA)' }, { value: 'alphaInv', label: 'Lettres à rebours (Z, Y, X…)' }, { value: 'perso', label: 'Alphabet personnalisé' }]} aria-label="Écriture du compteur" /></Field>
        {b.alphabet === 'perso' ? <Field label="Caractères, dans l’ordre"><TI value={b.caracteres || ''} onChange={(v) => set({ caracteres: v })} placeholder="ABCDEFGHJKLMNPRSTUVWXYZ" aria-label="Alphabet personnalisé" /></Field> : null}
        <Field label="Longueur minimale"><NI value={b.chiffres || ''} onChange={(v) => set({ chiffres: v })} aria-label="Longueur du compteur" /></Field>
        <Field label="Départ"><NI value={b.depart === undefined ? '' : b.depart} onChange={(v) => set({ depart: v })} placeholder="1" aria-label="Départ du compteur" /></Field>
        <Field label="Pas"><NI value={b.pas || ''} onChange={(v) => set({ pas: v })} placeholder="1" aria-label="Pas du compteur" /></Field>
        <Field label="Remise à zéro"><SI plain value={b.raz || 'jamais'} onChange={(v) => set({ raz: v })} options={CODIF_RAZ.map((x) => ({ value: x.id, label: x.label }))} aria-label="Remise à zéro" /></Field></> : null}
      {b.type === 'variable' ? <><Field label="Donnée"><SI plain value={b.variable || ''} onChange={(v) => set({ variable: v })} options={CODIF_VARS.map((x) => ({ value: x.id, label: x.label }))} aria-label="Donnée du lot" /></Field>
        <Field label="Écrite comme"><SI plain value={b.rendu || 'valeur'} onChange={(v) => set({ rendu: v })} options={[{ value: 'valeur', label: def.liste ? 'Libellé' : 'Valeur' }, ...(def.liste ? [{ value: 'court', label: 'Code court de la liste' }] : []), { value: 'table', label: 'Table de correspondance' }]} aria-label="Écriture de la donnée" /></Field>
        {b.rendu === 'table' ? <Field label="Table"><SI plain value={b.tableId || ''} onChange={(v) => set({ tableId: v })} options={tOpts(codifTables(db))} aria-label="Table de la donnée" /></Field> : null}
        {def.ensemble ? <Field label="Entre deux valeurs"><TI value={b.sep || ''} onChange={(v) => set({ sep: v })} placeholder="(rien)" /></Field> : null}
        <Field label="Si inconnue"><TI value={b.defaut || ''} onChange={(v) => set({ defaut: v })} placeholder="(rien)" aria-label="Valeur si inconnue" /></Field></> : null}
      {b.type === 'choix' ? <><Field label="Table" help={tablesLibres.length ? 'La valeur est choisie à la saisie de l’opération.' : 'Créez d’abord une table « à choisir à la saisie ».'}><SI plain value={b.tableId || ''} onChange={(v) => set({ tableId: v })} options={tOpts(tablesLibres)} aria-label="Table à choisir" /></Field>
        <Field label="Si rien n’est choisi"><TI value={b.defaut || ''} onChange={(v) => set({ defaut: v })} placeholder="(rien)" /></Field></> : null}
      {b.type === 'herite' ? <><Field label="Reprendre"><SI plain value={b.mode || 'tout'} onChange={(v) => set({ mode: v })} options={[{ value: 'tout', label: 'Le code entier' }, { value: 'partie', label: 'Une partie nommée' }, { value: 'position', label: 'Des caractères (position)' }]} aria-label="Reprise du code" /></Field>
        {b.mode === 'partie' ? <Field label="Partie"><TI value={b.partie || ''} onChange={(v) => set({ partie: v })} list="codif-parties" aria-label="Partie reprise" /><datalist id="codif-parties">{parties.map((p) => <option key={p} value={p} />)}</datalist></Field> : null}
        {b.mode === 'position' ? <><Field label="Du caractère"><NI value={b.debut || ''} onChange={(v) => set({ debut: v })} placeholder="1" /></Field><Field label="Au caractère"><NI value={b.fin || ''} onChange={(v) => set({ fin: v })} placeholder="fin" /></Field></> : null}
        <Field label="Si absent"><TI value={b.defaut || ''} onChange={(v) => set({ defaut: v })} placeholder="(rien)" /></Field></> : null}
    </div>
    {b.type === 'compteur' && autres.length ? <Group label="Remettre aussi à zéro pour chaque combinaison de" help="ex. marque + cuvée + format : un compteur par combinaison."><div className="flex flex-wrap gap-3">{autres.map((n) => <Check key={n} checked={(b.razParties || []).includes(n)} onChange={(v) => set({ razParties: v ? uniq([...(b.razParties || []), n]) : (b.razParties || []).filter((x) => x !== n) })} label={n} />)}</div></Group> : null}
    {b.type === 'herite' && !(codifStadeDef(stade) || {}).parent ? <Notice tone="warn">Ce stade n’a pas d’étape précédente : rien à reprendre.</Notice> : null}
    <CodifBriqueForme db={db} b={b} set={set} autres={autres} />
  </div>);
}

// exemples pour l'aperçu : lots réels du stade précédent (ou du stade), sinon exemple vide
function codifExemples(db, R, stade) {
  const st = codifStadeDef(stade) || {}; const lots = Object.values(R.lots || {}).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const L = (f) => lots.filter(f).slice(0, 80).map((l) => ({ value: `lot:${l.id}`, label: `${l.code}${l.designation && l.designation !== l.code ? ` · ${l.designation}` : ''}` }));
  if (st.coll === 'habillages') return [...(db.lotsFinis || []).map((f) => ({ value: `fini:${f.id}`, label: `${f.code} · lot fini` })), ...(stade === 'expedition' ? habillages(db).filter((h) => h.type !== 'carton').map((h) => ({ value: `hab:${h.id}`, label: `${h.code} · habillage` })) : [])];
  if (stade === 'degorgement') return L((l) => l.type === 'cuvee_tirage');
  if (stade === 'fraction') return L((l) => l.type === 'pressee');
  return L(() => true);
}
function codifCtxExemple(db, R, stade, ex, date, heure, choix) {
  const base = { date, heure, choix };
  const [k, id] = String(ex || '').split(':'); if (!id) return base;
  if (k === 'fini' || k === 'hab') return { ...codifCtxHabillage(db, R, { date, heure, source: { type: k === 'fini' ? 'fini' : 'habillage', id }, nb: (habillageSource(db, { type: k === 'fini' ? 'fini' : 'habillage', id }) || {}).nb, choix }), date, heure, choix };
  const l = R.lots[id]; if (!l) return base; const st = codifStadeDef(stade) || {};
  const c = codifCtxLot(db, R, id); const par = st.parent ? { parent: codifParent(l), parentCtx: c } : {};
  if (stade === 'degorgement') { const tir = (db.ops || []).find((o) => o && o.type === 'tirage' && o.lotId === id); return { ...base, ...c, ...par, nb: tir ? tir.nbBouteilles : '', volBouteilleL: tir ? tir.volBouteilleL : '', choix }; }
  if (stade === 'fraction') { const fr = fracPress(db)[0]; return { ...base, ...c, ...par, fractionId: fr ? fr.id : '', comp: { ...(c.comp || {}), fractions: fr ? { [fr.id]: 1 } : {} }, choix }; }
  if (stade === 'marc') { const o = (db.ops || []).find((x) => x && x.type === 'pressurage' && x.parentLotId === id); return { ...base, ...c, marc: o && o.marc ? o.marc.num : '', choix }; }
  return { ...base, ...c, ...par, codeFournisseur: l.codeFournisseur || '', choix };
}
function CodifApercu({ db, R, stade, briques }) {
  const [ex, setEx] = useState(() => (codifExemples(db, R, stade)[0] || {}).value || ''); const [date, setDate] = useState(todayISO()); const [heure, setHeure] = useState('08:30'); const [choix, setChoix] = useState({});
  const E = useMemo(() => codifExemples(db, R, stade), [db, R, stade]);
  const T = uniq(briques.filter((b) => b.type === 'choix' && b.tableId).map((b) => b.tableId)).map((id) => codifTable(db, id)).filter(Boolean);
  const g = useMemo(() => { try { return codifGenerer(db, stade, codifCtxExemple(db, R, stade, ex, date, heure, choix), { briques }); } catch (e) { return { ok: false, msg: String(e.message || e) }; } }, [db, R, stade, ex, date, heure, choix, briques]);
  return (<div className="grid gap-2 rounded-md border border-line p-3" data-codif-apercu="">
    <div className="lbl">Aperçu en direct</div>
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
      <Field label="Sur l’exemple"><SI plain value={ex} onChange={setEx} options={[{ value: '', label: 'Exemple vide (date seule)' }, ...E.map((x) => ({ ...x, donnee: true }))]} aria-label="Exemple de l’aperçu" /></Field>
      <Field label="Date de l’opération"><DI value={date} onChange={setDate} aria-label="Date de l’aperçu" /></Field>
      <Field label="Heure"><TI value={heure} onChange={setHeure} placeholder="hh:mm" aria-label="Heure de l’aperçu" /></Field>
      {T.map((t) => <Field key={t.id} label={t.nom}><SI plain value={choix[t.id] || ''} onChange={(v) => setChoix({ ...choix, [t.id]: v })} options={[{ value: '', label: '—' }, ...(t.lignes || []).map((l) => ({ value: l.id, label: l.libelle || l.cle }))]} /></Field>)}
    </div>
    {g && g.ok ? <div className="flex flex-wrap items-baseline gap-3"><span className="disp text-2xl num" translate="no" data-codif-resultat="" style={{ whiteSpace: 'pre' }}>{g.code}</span>
      <span className="flex flex-wrap gap-1 text-xs">{Object.entries(g.parts || {}).filter(([, v]) => v !== '').map(([k, v]) => <Chip key={k}><span className="text-ink2">{k}</span> <span translate="no" style={{ whiteSpace: 'pre' }}>{v}</span></Chip>)}</span></div>
      : <Notice tone="bad">{(g && g.msg) || 'Aperçu impossible.'}</Notice>}
    {g && (g.avert || []).length ? <p className="text-warn text-sm">{g.avert.join(' ')}</p> : null}
  </div>);
}

// 0.49.0-alpha.1 (IA10, usage codification, niveau 0 : moteur 17ad-ia-regle.js) : la règle dite en une phrase → briques contrôlées
// (codifValider), chargées dans l'éditeur avec l'aperçu habituel ; seuls la phrase et les noms des tables partent
function CodifDicter({ db, stade, onBriques }) {
  const ia = useIaUsage(); const [phrase, setPhrase] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(null);
  const decrire = async () => {
    if (busy || !phrase.trim()) return; setBusy(true); setErr(null);
    try { const P = iaCodifPrompt(db, stade, phrase); const r = await ia.demander('codification', P); if (!r) return; const x = iaCodifBriques(db, stade, r.valeur, P.codes);
      if (x.ok) { onBriques(x.briques, r.trace); if (x.ignores.length) setErr({ avert: true, msg: 'Des éléments de la proposition ont été écartés :', ignores: x.ignores }); } else setErr({ msg: x.msg, ignores: x.ignores }); }
    finally { setBusy(false); }
  };
  return (<div className="grid gap-2" data-codif-dicter="">
    <Field label="Décrire la règle en une phrase" help="ex. « P, l’année sur deux chiffres, un tiret, puis un compteur sur deux chiffres remis à zéro chaque année »"><TA value={phrase} onChange={setPhrase} rows={2} aria-label="Règle de codification en une phrase" /></Field>
    <div><IaBouton usage="codification" busy={busy} disabled={!phrase.trim()} onClick={decrire}>Décrire la règle</IaBouton></div>
    {err ? <Notice tone={err.avert ? 'warn' : 'bad'} title={err.avert ? 'Briques chargées, à vérifier' : 'Briques proposées refusées'}><span>{err.msg}</span>{(err.ignores || []).length ? <ul className="list-disc pl-5">{err.ignores.map((x, k) => <li key={k}>{x}</li>)}</ul> : null}</Notice> : null}
  </div>);
}
function CodifStadeEditeur({ stade, lect }) {
  const { db, R, act, uid, confirm } = useApp(); const st = codifStadeDef(stade) || { label: stade }; const r = codifRegleDe(db, stade) || {}; const V = codifVersions(db, stade);
  const vNow = codifVersion(db, stade, todayISO()); const [ed, setEd] = useState(null); const [ouv, setOuv] = useState(-1); const [ajout, setAjout] = useState('');
  const nouvelle = (src) => { setEd({ des: todayISO(), briques: clone((src && src.briques) || []), note: '' }); setOuv(-1); };
  const modifier = (v) => { setEd({ id: v.id, des: v.des, briques: clone(v.briques || []), note: v.note || '' }); setOuv(-1); };
  const setB = (i, patch) => setEd((e) => ({ ...e, briques: e.briques.map((b, k) => (k === i ? { ...b, ...patch } : b)) }));
  const bouger = (i, d) => setEd((e) => { const B = [...e.briques]; const j = i + d; if (j < 0 || j >= B.length) return e; [B[i], B[j]] = [B[j], B[i]]; return { ...e, briques: B }; });
  const enregistrer = () => { const r1 = act((d) => codifVersionSet(d, stade, ed, { par: uid }), `Règle enregistrée : elle s’applique aux lots créés à partir du ${fmtDate(ed.des)}.`); if (r1 && r1.ok) setEd(null); };
  const defaut = async () => { const d0 = todayISO(); if (await confirm({ title: 'Revenir au code d’Œnotrack ?', body: `À partir du ${fmtDate(d0)}, les nouveaux lots de ce stade reçoivent de nouveau le code d’Œnotrack. Les lots déjà codés ne changent pas.`, ok: 'Revenir au code d’Œnotrack' })) act((d) => codifVersionSet(d, stade, { des: d0, defaut: true }, { par: uid }), 'Code d’Œnotrack rétabli pour les nouveaux lots.'); };
  return (<div className="grid gap-4" data-codif-stade={stade}>
    <div><h4 className="text-lg font-semibold">{st.label}</h4>
      <p className="help">Sans règle : {st.defaut || 'code d’Œnotrack'}. {vNow ? 'Une règle est en vigueur aujourd’hui.' : 'Aujourd’hui : code d’Œnotrack.'} Les lots déjà codés ne sont jamais renommés.</p></div>
    {V.length ? <Tbl rows={V} cols={[
      { h: 'À partir du', r: (v) => <span className="num">{v.des ? fmtDate(v.des) : 'toujours'}</span> },
      { h: 'Règle', r: (v) => (v.defaut ? <i>Code d’Œnotrack</i> : <span className="text-sm">{(v.briques || []).map((b) => codifBriqueTexte(db, b)).join(' + ')}</span>) },
      { h: 'Lots codés', cls: 'num', r: (v) => codifUsage(db, stade, v.id) },
      { h: '', r: (v) => (lect ? null : <div className="flex flex-wrap gap-1">{!codifUsage(db, stade, v.id) && !v.defaut ? <Btn size="sm" onClick={() => modifier(v)}>Modifier</Btn> : null}{!v.defaut ? <Btn size="sm" onClick={() => nouvelle(v)}>Nouvelle version d’après celle-ci</Btn> : null}
        {!codifUsage(db, stade, v.id) ? <Btn size="sm" kind="ghost" onClick={() => act((d) => codifVersionDel(d, stade, v.id), 'Version retirée.')}>Retirer</Btn> : null}</div>) },
    ]} /> : <Empty>Aucune règle : les lots de ce stade reçoivent le code d’Œnotrack.</Empty>}
    {lect ? null : <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }}>
      <Field label="Code déjà utilisé"><SI plain value={r.unicite || 'refus'} onChange={(v) => act((d) => codifRegleOptions(d, stade, { unicite: v }), 'Réglage enregistré.')} options={[{ value: 'refus', label: 'Refusé (code unique)' }, { value: 'avert', label: 'Accepté avec un avertissement' }, { value: 'aucune', label: 'Accepté sans contrôle' }]} aria-label="Code déjà utilisé" /></Field>
    </div>}
    {stade === 'vinification' && !lect ? <Group label="Proposer un nouveau code quand le lot passe au stade" help="À l’opération « Changement de stade », le nouveau code est proposé ; l’ancien reste cherchable en traçabilité."><div className="flex flex-wrap gap-3">{stadeList(db).map((s) => <Check key={s.id} checked={(r.declencheurs || []).includes(s.id)} onChange={(v) => act((d) => codifRegleOptions(d, stade, { declencheurs: v ? [...(r.declencheurs || []), s.id] : (r.declencheurs || []).filter((x) => x !== s.id) }), 'Réglage enregistré.')} label={s.label} />)}</div></Group> : null}
    {!lect && !ed ? <div className="flex flex-wrap gap-2"><Btn kind="primary" onClick={() => nouvelle(vNow)}>＋ Nouvelle règle</Btn>{vNow ? <Btn onClick={defaut}>↺ Revenir au code d’Œnotrack</Btn> : null}</div> : null}
    {ed ? <div className="card grid gap-3 p-3" data-codif-editeur="">
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
        <Field label="S’applique à partir du" help="Les lots créés avant cette date gardent leur code."><DI value={ed.des} onChange={(v) => setEd({ ...ed, des: v })} aria-label="Date d’effet" /></Field>
        <Field label="Note"><TI value={ed.note} onChange={(v) => setEd({ ...ed, note: v })} placeholder="ex. nouvelle étiquette 2027" /></Field>
      </div>
      <CodifDicter db={db} stade={stade} onBriques={(B, t) => { setEd((e) => ({ ...e, briques: B, ia: t })); setOuv(-1); }} />
      {ed.ia ? <Notice tone="info" title="Briques proposées par l’IA">Vérifiez chaque brique et l’aperçu ci-dessous : la règle n’est enregistrée que par « Enregistrer la règle ».</Notice> : null}
      <div className="grid gap-2" data-codif-briques="">
        {ed.briques.map((b, i) => { const autres = ed.briques.filter((x, k) => k !== i).map((x) => codifNomBrique(x, ed.briques.indexOf(x))); return (<div key={i} className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2" data-codif-brique={i}><span className="chip">{i + 1}</span><span className="text-sm"><b>{(CODIF_BRIQUES.find((x) => x.id === b.type) || {}).label}</b> — {codifBriqueTexte(db, b)}{b.si && b.si.variable ? ' · conditionnelle' : ''}</span>
            <span className="ml-auto flex gap-1"><Btn size="sm" onClick={() => setOuv(ouv === i ? -1 : i)} aria-label={`Régler la brique ${i + 1}`}>⚙</Btn><Btn size="sm" onClick={() => bouger(i, -1)} aria-label={`Monter la brique ${i + 1}`}>↑</Btn><Btn size="sm" onClick={() => bouger(i, 1)} aria-label={`Descendre la brique ${i + 1}`}>↓</Btn><Btn size="sm" kind="ghost" onClick={() => { setEd({ ...ed, briques: ed.briques.filter((x, k) => k !== i) }); setOuv(-1); }} aria-label={`Retirer la brique ${i + 1}`}>✕</Btn></span></div>
          {ouv === i ? <CodifBriqueEditeur db={db} stade={stade} b={b} set={(p) => setB(i, p)} autres={autres} /> : null}
        </div>); })}
        <div className="flex flex-wrap items-center gap-2"><SI plain value={ajout} onChange={setAjout} options={[{ value: '', label: 'Ajouter une brique…' }, ...CODIF_BRIQUES.filter((x) => x.id !== 'herite' || st.parent).map((x) => ({ value: x.id, label: x.label }))]} aria-label="Type de brique à ajouter" />
          <Btn disabled={!ajout} onClick={() => { setEd({ ...ed, briques: [...ed.briques, codifBriqueNeuve(ajout)] }); setOuv(ed.briques.length); setAjout(''); }}>＋ Ajouter</Btn></div>
      </div>
      {ed.briques.length ? <CodifApercu db={db} R={R} stade={stade} briques={ed.briques} /> : null}
      <div className="flex flex-wrap gap-2"><Btn kind="primary" onClick={enregistrer}>Enregistrer la règle</Btn><Btn onClick={() => setEd(null)}>Annuler</Btn></div>
    </div> : null}
  </div>);
}

function CodifTableEditeur({ db, t, onFin }) {
  const { act, uid } = useApp(); const [x, setX] = useState(() => clone(t)); const lies = x.source && x.source !== 'libre' && x.source !== 'date' ? codifElementsListe(db, x.source) : [];
  const ligneDe = (cle) => (x.lignes || []).find((l) => String(l.cle) === String(cle));
  const setLigneCle = (e, code) => setX((y) => { const L = [...(y.lignes || [])]; const i = L.findIndex((l) => String(l.cle) === String(e.cle)); if (i >= 0) L[i] = { ...L[i], code }; else L.push({ cle: e.cle, libelle: e.libelle, code }); return { ...y, lignes: L }; });
  const setL = (i, p) => setX((y) => ({ ...y, lignes: y.lignes.map((l, k) => (k === i ? { ...l, ...p } : l)) }));
  const autres = (x.lignes || []).map((l, i) => ({ l, i })).filter(({ l }) => !lies.some((e) => String(e.cle) === String(l.cle)));
  const def = CODIF_VARS.find((v) => v.id === x.source) || {};
  return (<div className="card grid gap-3 p-3" data-codif-table-ed="">
    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
      <Field label="Nom de la table"><TI value={x.nom || ''} onChange={(v) => setX({ ...x, nom: v })} placeholder="ex. Cuvée, Marque, Format" aria-label="Nom de la table" /></Field>
      <Field label="Valeurs" help={x.source === 'libre' ? 'Choisies à la saisie de l’opération (marque, cuvée, bouchon…).' : 'Lues dans la base, traduites en codes.'}><SI plain value={x.source || 'libre'} onChange={(v) => setX({ ...x, source: v, lignes: [] })} options={[{ value: 'libre', label: 'À choisir à la saisie' }, { value: 'date', label: 'Années, mois ou jours (date)' }, ...CODIF_VARS.filter((v) => v.liste || ['dosage', 'format', 'marc'].includes(v.id)).map((v) => ({ value: v.id, label: `Donnée : ${v.label}` }))]} aria-label="Source des valeurs" /></Field>
    </div>
    {lies.length ? <div className="tblwrap"><table className="tbl"><thead><tr><th>Valeur de la base</th><th>Code</th></tr></thead><tbody>{lies.map((e) => <tr key={e.cle}><td translate="no">{e.libelle}</td><td><TI value={(ligneDe(e.cle) || {}).code || ''} onChange={(v) => setLigneCle(e, v)} placeholder={e.court || ''} aria-label={`Code de ${e.libelle}`} /></td></tr>)}</tbody></table></div> : null}
    {def.ensemble ? <p className="help">Pour une combinaison (ex. Chardonnay + Pinot noir → CP), ajoutez une ligne dont la valeur est la liste des identifiants séparés par « + » ; à défaut, les codes de chaque valeur se suivent.</p> : null}
    <div className="grid gap-2">
      {autres.length ? <div className="lbl">{x.source === 'libre' ? 'Valeurs proposées à la saisie' : lies.length ? 'Autres valeurs (combinaisons…)' : 'Correspondances'}</div> : null}
      {autres.map(({ l, i }) => (<div key={i} className="flex flex-wrap items-end gap-2">
        {x.source !== 'libre' ? <Field label="Valeur"><TI value={l.cle || ''} onChange={(v) => setL(i, { cle: v })} placeholder={x.source === 'date' ? 'ex. 2026' : 'ex. chard+pn'} aria-label="Valeur d’origine" /></Field> : null}
        <Field label="Libellé"><TI value={l.libelle || ''} onChange={(v) => setL(i, { libelle: v })} placeholder="ex. Brut Gold" aria-label="Libellé" /></Field>
        <Field label="Code"><TI value={l.code || ''} onChange={(v) => setL(i, { code: v })} placeholder="ex. GO" aria-label="Code" /></Field>
        <Btn size="sm" kind="ghost" onClick={() => setX({ ...x, lignes: x.lignes.filter((y, k) => k !== i) })} aria-label="Retirer la ligne">✕</Btn></div>))}
      <div><Btn size="sm" onClick={() => setX({ ...x, lignes: [...(x.lignes || []), { cle: '', libelle: '', code: '' }] })}>＋ Ligne</Btn></div>
    </div>
    <div className="flex flex-wrap gap-2"><Btn kind="primary" onClick={() => { const r = act((d) => codifTableSet(d, x, { par: uid }), 'Table enregistrée.'); if (r && r.ok) onFin(); }}>Enregistrer la table</Btn><Btn onClick={onFin}>Annuler</Btn></div>
  </div>);
}
function CodifTablesView({ lect }) {
  const { db } = useApp(); const ask = useRetirer(); const [ed, setEd] = useState(null); const T = codifTables(db);
  if (ed) return <CodifTableEditeur db={db} t={ed} onFin={() => setEd(null)} />;
  return (<div className="grid gap-3" data-codif-tables="">
    <p className="help">Tables de correspondance : une valeur (cépage, revendication, cuvée choisie à la saisie, année…) devient un code. Toutes sont à vous : nommez-les et remplissez-les librement.</p>
    <Tbl rows={T} empty="Aucune table." cols={[{ h: 'Table', r: (t) => <b translate="no">{t.nom}</b> }, { h: 'Valeurs', r: (t) => (t.source === 'libre' ? 'À choisir à la saisie' : t.source === 'date' ? 'Date' : (CODIF_VARS.find((v) => v.id === t.source) || {}).label || t.source) },
      { h: 'Lignes', cls: 'num', r: (t) => (t.lignes || []).length }, { h: 'Utilisée par', r: (t) => codifTableUsages(db, t.id).map((s) => (codifStadeDef(s) || { label: s }).label).join(', ') || '—' },
      { h: '', r: (t) => (lect ? null : <div className="flex gap-1"><Btn size="sm" onClick={() => setEd(t)}>Modifier</Btn><Btn size="sm" kind="ghost" onClick={() => ask(`Retirer la table « ${t.nom} » ?`, (d) => codifTableDel(d, t.id), 'Table retirée.')}>Retirer</Btn></div>) }]} />
    {lect ? null : <div><Btn kind="primary" onClick={() => setEd({ nom: '', source: 'libre', lignes: [] })}>＋ Nouvelle table</Btn></div>}
  </div>);
}

function CodifImportExport({ lect }) {
  const { db, act, toast, uid } = useApp(); const verifier = useGarde(); const ref = useRef(null); const [des, setDes] = useState(todayISO());
  const exporter = async () => { const nom = `codification-lots-${todayISO()}.json`; const r = await saveFile(nom, new Blob([JSON.stringify(codifExporter(db), null, 2)], { type: 'application/json' }), 'application/json'); if (r && r.ok) toast(`Codification exportée : ${nom}.`); };
  const onFile = async (e) => { const f0 = e.target.files && e.target.files[0]; e.target.value = ''; if (!f0) return; const [f] = await verifier([f0], 'codification'); if (!f) return; let t; try { t = await lectureFichier(f); } catch (er) { toast('Lecture du fichier impossible.', 'bad'); return; }
    const r = act((d) => codifImporter(d, t, { des, par: uid }), null); if (r && r.ok) toast(`Codification importée : ${r.regles} règle(s), ${r.tables} table(s), à partir du ${fmtDate(des)}.${(r.avert || []).length ? ` ${r.avert.join(' ')}` : ''}`); };
  return (<div className="flex flex-wrap items-end gap-2" data-codif-import="">
    <Btn onClick={exporter}>⬇ Exporter la codification</Btn>
    {lect ? null : <><Field label="Règles importées valables à partir du"><DI value={des} onChange={setDes} aria-label="Date d’effet de l’import" /></Field><Btn onClick={() => ref.current && ref.current.click()}>⬆ Importer une codification…</Btn><input ref={ref} type="file" accept=".json,application/json" className="hidden" onChange={onFile} aria-label="Fichier de codification" /></>}
  </div>);
}

function CodificationView() {
  const { db } = useApp(); const lect = useLectureSeule('params'); const [vue, setVue] = useState('regles'); const [stade, setStade] = useState('marc');
  const perso = (db.codifRegles || []).filter((r) => r && String(r.id).startsWith('op:')).map((r) => r.id);
  const opsPerso = opList(db).filter((o) => o && o.id !== o.base && ['pressurage', 'entree_mout', 'assemblage', 'tirage', 'degorgement', 'reprise', 'preparation', 'etape'].includes(o.base) && !perso.includes(`op:${o.id}`));
  const etat = (id) => { const v = codifVersion(db, id, todayISO()); return v ? `depuis le ${fmtDate(v.des || '')}`.replace('depuis le —', 'en vigueur') : ''; };
  return (<div data-codification="">
    <Sec title="🏷 Codification des lots" right={<CodifImportExport lect={lect} />}>
      <p className="help mb-3">Composez librement le code de vos lots à chaque stade : texte fixe, séparateurs, dates (chiffres, code champenois, lettres ou table), millésimes, compteurs, données du lot, choix faits à la saisie et reprise du code de l’étape précédente. Une règle vaut à partir de sa date : les lots déjà codés ne changent jamais. À la saisie, le code proposé reste modifiable.</p>
      <SubNav value={vue} onChange={setVue} items={[{ id: 'regles', label: 'Règles par stade' }, { id: 'tables', label: 'Tables de correspondance' }]} />
      {vue === 'tables' ? <CodifTablesView lect={lect} /> : (
        <div className="md:flex md:items-start md:gap-4">
          <nav className="mb-4 grid min-w-0 gap-2 md:mb-0 md:w-64 md:shrink-0" aria-label="Stades de la codification" data-codif-stades="">
            {CODIF_GROUPES.map((g) => (<div key={g.id}><div className="lbl mb-1">{g.label}</div><div className="flex flex-wrap gap-1 md:flex-col">
              {CODIF_STADES.filter((s) => s.groupe === g.id).map((s) => (<button key={s.id} type="button" className={cx('btn btn-sm md:w-full md:justify-start md:text-left', stade === s.id && 'btn-primary')} aria-pressed={stade === s.id} onClick={() => setStade(s.id)} data-codif-choix-stade={s.id} style={{ whiteSpace: 'normal', height: 'auto', textAlign: 'left' }}>
                {s.label}{etat(s.id) ? <span className="ml-auto pl-1 text-xs opacity-80">●</span> : null}</button>))}</div></div>))}
            {perso.length || opsPerso.length ? <div><div className="lbl mb-1">Opérations du catalogue</div><div className="flex flex-wrap gap-1 md:flex-col">
              {perso.map((id) => <button key={id} type="button" className={cx('btn btn-sm md:w-full md:justify-start', stade === id && 'btn-primary')} onClick={() => setStade(id)}>{(opDef(db, id.slice(3)) || { label: id.slice(3) }).label}</button>)}
              {!lect && opsPerso.length ? <SI plain value="" onChange={(v) => v && setStade(`op:${v}`)} options={[{ value: '', label: '＋ Règle propre à une opération…' }, ...opsPerso.map((o) => ({ value: o.id, label: o.label }))]} aria-label="Règle propre à une opération du catalogue" /> : null}
            </div></div> : null}
          </nav>
          <div className="min-w-0 flex-1"><CodifStadeEditeur key={stade} stade={stade} lect={lect} /></div>
        </div>)}
    </Sec>
  </div>);
}
