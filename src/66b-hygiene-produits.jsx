/* ============ HYGIÈNE : PRODUITS D'HYGIÈNE (0.18.0-alpha.1) — répertoire, FDS et fiches techniques, sécurité, fiches de poste ============
   Moteur : 16-hygiene.js. La FDS déposée est lue (texte du PDF, ou reconnaissance de caractères d'un scan) pour pré-remplir la fiche ;
   le fichier est joint au produit (documents : FDS, fiche technique, attestations). */

/* ---------- pictogrammes de danger (losange rouge, règlement CLP) et pictogrammes d'obligation (EPI, rond bleu) ---------- */
const SGH_GLYPHES = {
  SGH01: '<circle cx="14.5" cy="19.5" r="4.2"/><path d="M18.5 15.2l2.6-2.6M20.2 18l3.3-.6M17 12.8l.4-3.2M21.6 13.6l2-1.4" stroke="#111" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
  SGH02: '<path d="M16 7.6c1.6 3.4 5.2 5.2 5.2 9.6a5.2 5.2 0 0 1-10.4 0c0-2.4 1.3-3.8 2.5-5 .2 1.7 1 2.7 2.2 3.1-.6-2.8-.4-5.3.5-7.7z"/><path d="M10 24.2h12" stroke="#111" stroke-width="1.6" stroke-linecap="round"/>',
  SGH03: '<path d="M16 7.4c1 2.1 3.1 3.3 3.1 6a3.1 3.1 0 0 1-6.2 0c0-1.5.8-2.3 1.5-3 .1 1 .6 1.7 1.3 1.9-.4-1.7-.2-3.2.3-4.9z"/><circle cx="16" cy="20.2" r="3.4" fill="none" stroke="#111" stroke-width="1.8"/><path d="M10 25h12" stroke="#111" stroke-width="1.6" stroke-linecap="round"/>',
  SGH04: '<rect x="13" y="10" width="6.4" height="13" rx="3" transform="rotate(-35 16.2 16.5)"/><rect x="18.6" y="8" width="2.6" height="3" rx=".6" transform="rotate(-35 19.9 9.5)"/>',
  SGH05: '<rect x="8.6" y="6.2" width="3" height="7.4" rx=".7" transform="rotate(-38 10.1 9.9)"/><rect x="20.4" y="6.2" width="3" height="7.4" rx=".7" transform="rotate(38 21.9 9.9)"/><circle cx="12.6" cy="15.4" r=".95"/><circle cx="12.6" cy="18" r=".8"/><circle cx="19.4" cy="15.4" r=".95"/><circle cx="19.4" cy="18" r=".8"/><path d="M7.6 21h7.2v3.2H7.6z"/><circle cx="12.6" cy="21" r="1.5" fill="#fff"/><path d="M17.2 21.2h6.3c.8 0 1.4.6 1.4 1.4s-.6 1.4-1.4 1.4h-6.3z"/><circle cx="19.4" cy="21.3" r="1.2" fill="#fff"/>',
  SGH06: '<circle cx="16" cy="12.6" r="4.4"/><rect x="13.6" y="15.6" width="4.8" height="2.6" rx=".6"/><circle cx="14.4" cy="12.4" r="1.1" fill="#fff"/><circle cx="17.6" cy="12.4" r="1.1" fill="#fff"/><path d="M10.4 19.4l11.2 4.4M21.6 19.4l-11.2 4.4" stroke="#111" stroke-width="2" stroke-linecap="round"/>',
  SGH07: '<rect x="14.6" y="8.4" width="2.8" height="10.4" rx="1.3"/><circle cx="16" cy="22.4" r="1.7"/>',
  SGH08: '<circle cx="16" cy="9.6" r="2.6"/><path d="M10.6 24.4c0-5.6 2.2-9.6 5.4-9.6s5.4 4 5.4 9.6z"/><path d="M16 15.8l.8 1.8 1.9.2-1.4 1.3.4 1.9-1.7-1-1.7 1 .4-1.9-1.4-1.3 1.9-.2z" fill="#fff"/>',
  SGH09: '<path d="M11 24V12.5M11 15.4l-2.6-2.6M11 17.6l2.8-2.8M11 13.2l1.6-2" stroke="#111" stroke-width="1.6" stroke-linecap="round" fill="none"/><ellipse cx="19.6" cy="21.2" rx="3.4" ry="1.7"/><path d="M22.6 21.2l2.4-1.8v3.6z"/><path d="M7.5 24.4h17" stroke="#111" stroke-width="1.4" stroke-linecap="round"/>',
};
function PictoSGH({ code, size = 30, titre }) {
  const nom = hygLib(HYG_PICTOS, code);
  return <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={`${code} ${nom}`} className="shrink-0"><title>{titre || `${code} — ${nom}`}</title><path d="M16 1.6L30.4 16 16 30.4 1.6 16z" fill="#fff" stroke="#D3201F" strokeWidth="2.6" strokeLinejoin="round" /><g fill="#111" dangerouslySetInnerHTML={{ __html: SGH_GLYPHES[code] || '' }} /></svg>;
}
const EPI_GLYPHE_AUTRE = '<path d="M16 6.8l7.2 3v5.3c0 4.5-3.1 8.4-7.2 9.6-4.1-1.2-7.2-5.1-7.2-9.6V9.8z"/>'; // protection ajoutée (0.27.0-alpha.2) : écusson
const EPI_GLYPHES = {
  gants: '<rect x="11" y="14" width="10" height="9.5" rx="2.2"/><rect x="11" y="8.6" width="2.2" height="7" rx="1.1"/><rect x="13.6" y="7" width="2.2" height="8.4" rx="1.1"/><rect x="16.2" y="7.4" width="2.2" height="8" rx="1.1"/><rect x="18.8" y="9" width="2.2" height="7" rx="1.1"/><rect x="20" y="14.5" width="2.4" height="6" rx="1.2" transform="rotate(38 21.2 17.5)"/><rect x="10.6" y="23" width="10.8" height="2.6" rx=".7"/>',
  lunettes: '<circle cx="11.4" cy="16.4" r="3.7" fill="none" stroke="#fff" stroke-width="2.2"/><circle cx="20.6" cy="16.4" r="3.7" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M15.1 15.8h1.8M7.7 15.4 5.8 13.8M24.3 15.4l1.9-1.6" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>',
  visiere: '<path d="M9 9.4h14" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/><path d="M9.8 10.4v8.2c0 2.8 2.8 5 6.2 5s6.2-2.2 6.2-5v-8.2" fill="none" stroke="#fff" stroke-width="1.9"/><circle cx="16" cy="15.6" r="3.2"/>',
  masque: '<circle cx="16" cy="12.6" r="5.4"/><path d="M8.6 27c.9-3.6 3.8-5.6 7.4-5.6s6.5 2 7.4 5.6z"/><path d="M11.4 13.8h9.2l-1.1 4.6c-.4 1.4-1.6 2.3-3 2.3h-1c-1.4 0-2.6-.9-3-2.3z" fill="#1F5FAD"/><circle cx="10.4" cy="18.4" r="2.3"/><circle cx="21.6" cy="18.4" r="2.3"/><circle cx="10.4" cy="18.4" r=".9" fill="#1F5FAD"/><circle cx="21.6" cy="18.4" r=".9" fill="#1F5FAD"/>',
  tablier: '<path d="M12.6 10h6.8l.5 4.3 3.3.9-.9 9.4H9.7l-.9-9.4 3.3-.9z"/><path d="M12.9 10.2c.2-2.8 6-2.8 6.2 0" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M8.6 15.2 6.4 16.6M23.4 15.2l2.2 1.4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>',
  bottes: '<path d="M10.4 7.6h5.4v10.6l6.4 2.6c.9.4 1.4 1.2 1.4 2.1v1.4H10.4z"/>',
};
function EpiIcone({ id, size = 28 }) {
  const nom = hygLib(HYG_EPI, id);
  return <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-label={nom} className="shrink-0"><title>{`Obligatoire : ${nom.toLowerCase()}`}</title><circle cx="16" cy="16" r="15" fill="#1F5FAD" /><g fill="#fff" dangerouslySetInnerHTML={{ __html: EPI_GLYPHES[id] || EPI_GLYPHE_AUTRE }} /></svg>;
}
const MentionChip = ({ m }) => (m ? <span className={cx('chip font-semibold', m === 'danger' ? 'chip-bad' : 'chip-warn')}>{hygLib(HYG_MENTIONS, m)}</span> : null);
// pictogrammes + mention + EPI, en une ligne
function HygSecurite({ p, size = 26, epi = true }) {
  if (!p) return null; const pi = p.pictos || []; const e = p.epi || [];
  if (!pi.length && !e.length && !p.mention) return <span className="text-xs text-ink2">—</span>;
  return <span className="inline-flex flex-wrap items-center gap-1" data-securite="">{pi.map((c) => <PictoSGH key={c} code={c} size={size} />)}<MentionChip m={p.mention} />{epi && e.length ? <span className="ml-1 inline-flex gap-0.5">{e.map((x) => <EpiIcone key={x} id={x} size={size - 4} />)}</span> : null}</span>;
}
const FdsChip = ({ db, p }) => { const e = hygFdsEtat(db, p); return <Chip tone={e.tone === 'ok' ? 'ok' : e.tone} title={e.n ? `${e.n} FDS jointe${e.n > 1 ? 's' : ''}` : 'Joignez la fiche de données de sécurité du fournisseur'}>{e.label}</Chip>; };

/* ---------- lecture d'une FDS déposée (PDF texte, scan, photo, texte) ---------- */
const FDS_ACCEPT = '.pdf,application/pdf,image/*,.txt,text/plain';
async function lireFds(file, { onEtape } = {}) {
  const nom = file.name || 'FDS'; const et = (t) => { if (onEtape) onEtape(t); };
  if (estPdf(file)) {
    et('Ouverture du PDF…');
    return pdfAvecDocument(file, async (doc) => {
    const pages = []; const n = Math.min(doc.numPages, 40);
    for (let i = 1; i <= n; i += 1) { et(`Lecture de la page ${i} / ${n}…`); const pg = await doc.getPage(i); const t = await pdfPageItems(pg); pages.push({ n: i, ...t, pg, vide: t.items.filter((it) => /[A-Za-z]/.test(it.s)).length < 10 }); }
    let ocr = false;
    if (pages.length && pages.every((p) => p.vide)) { // scan sans texte : reconnaissance de caractères des premières pages (rubriques 1 à 10 en général)
      const max = Math.min(pages.length, 8); ocr = true;
      for (let i = 0; i < max; i += 1) { et(`Page ${i + 1} / ${max} : reconnaissance du texte du scan (la première fois, le module de lecture se télécharge)…`); const r = await renduPage(pages[i].pg, 220); nettoyerScan(r.canvas); pages[i] = { ...(await ocrCanvas(r.canvas, i + 1, r.echelle)), n: i + 1 }; r.canvas.width = 0; }
      pages.splice(max);
    }
    const texte = fdsTexteDePages(pages); return { res: fdsAnalyser(texte), texte: texte.slice(0, 20000), fichier: nom, ocr, nbPages: doc.numPages };
    });
  }
  if (estImage(file)) { et('Reconnaissance du texte de la photo (la première fois, le module de lecture se télécharge)…'); const c = nettoyerScan(await imageCanvas(file)); const p = await ocrCanvas(c, 1, 1); const texte = fdsTexteDePages([p]); return { res: fdsAnalyser(texte), texte: texte.slice(0, 20000), fichier: nom, ocr: true, nbPages: 1 }; }
  const texte = await lectureFichier(file); return { res: fdsAnalyser(texte), texte: String(texte || '').slice(0, 20000), fichier: nom, ocr: false, nbPages: 1 };
}
// lecture complétée par l'assistant IA s'il est configuré (Paramètres › 🤖 Assistant IA, « Compléter les fiches produits ») — 0.26.0-alpha.1
async function lireFdsComplete(file, o = {}) { return fdsCompleterIa(await lireFds(file, o), o); }
async function fdsCompleterIa(r, { onEtape, nom } = {}) {
  const A = iaActive();
  if (!A.pret || !A.completer || String(r.texte || '').replace(/\s+/g, '').length < 80) return { ...r, res: fdsFusionIa(r.res, null) };
  if (onEtape) onEtape(`🤖 ${A.nom} complète la lecture…`);
  try { const P = iaPromptFds(r, nom); const R = await iaDemander(A, { system: P.system, texte: P.texte, max: P.max }); const ia = iaLireFds(iaJson(R.texte)); if (!ia) throw new Error('réponse illisible'); return { ...r, res: fdsFusionIa(r.res, ia), ia: A.nom }; }
  catch (e) { return { ...r, res: fdsFusionIa(r.res, null), iaErr: (e && e.message) || String(e) }; }
}
// fichier choisi avant que le produit existe : rangé tout de suite dans ce navigateur, rattaché à l'enregistrement (docsJoindre)
async function pieceEnAttente(file, cat) { const id = newDocId(); await docPut(id, file); return { id, nom: file.name || 'document', mime: file.type || '', taille: file.size || 0, cat, date: todayISO() }; }
// valeurs lues → champs du formulaire (libellés pour la revue)
// informations que l'assistant IA peut ajouter (0.26.0-alpha.1) : emploi et premiers secours, en plus des rubriques lues par le script
const FDS_CHAMPS_IA = [['secours', 'Premiers secours'], ['concMin', 'Concentration d’emploi minimale'], ['concMax', 'Concentration d’emploi maximale'], ['concUnite', 'Unité de concentration'], ['temperature', 'Température d’emploi'], ['contact', 'Temps de contact'], ['modeEmploi', 'Mode d’emploi']];
const FDS_CHAMPS = [['nom', 'Nom du produit'], ['fabricant', 'Fabricant / fournisseur de la FDS'], ['type', 'Nature'], ['forme', 'Forme'], ['composition', 'Composition'], ['fdsDate', 'Date de révision de la FDS'], ['fdsVersion', 'Version de la FDS'],
  ['mention', 'Mention d’avertissement'], ['pictos', 'Pictogrammes de danger'], ['phrasesH', 'Mentions de danger'], ['epi', 'Protections individuelles'], ['incompatibilites', 'Matières incompatibles'], ['stockage', 'Stockage'], ['urgence', 'Numéro d’appel d’urgence']];
const fdsVide = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
const fdsTexte = (k, v) => (k === 'type' ? hygLib(HYG_TYPES, v) : k === 'forme' ? hygLib(HYG_FORMES, v) : k === 'mention' ? hygLib(HYG_MENTIONS, v) : k === 'fdsDate' ? fmtDate(v) : k === 'pictos' ? v.map((c) => `${c} ${hygLib(HYG_PICTOS, c)}`).join(', ') : k === 'epi' ? v.map((x) => hygLib(HYG_EPI, x)).join(', ') : String(v));
// lecture du script complétée par l'assistant IA : le script d'abord, l'IA pour ce qu'il n'a pas trouvé (res.ia : clés venues de l'IA)
function fdsFusionIa(res, ia) { const o = { ...res, ia: [] }; if (!ia) return o; [...FDS_CHAMPS, ...FDS_CHAMPS_IA].forEach(([k]) => { if (fdsVide(o[k]) && !fdsVide(ia[k])) { o[k] = ia[k]; o.ia.push(k); } }); o.trouves = [...FDS_CHAMPS, ...FDS_CHAMPS_IA].filter(([k]) => !fdsVide(o[k])).length; return o; }
function fdsAppliquer(f, res, cles) { const o = { ...f }; (cles || [...FDS_CHAMPS, ...FDS_CHAMPS_IA].map((c) => c[0])).forEach((k) => { if (!fdsVide(res[k])) o[k] = Array.isArray(res[k]) ? [...res[k]] : res[k]; }); return o; }

// revue d'une FDS relue sur une fiche existante : chaque information trouvée, cochée si elle complète ou change la fiche
function FdsRevue({ lu, f, onAppliquer, onFermer }) {
  const r = lu.res; const lignes = [...FDS_CHAMPS, ...FDS_CHAMPS_IA].filter(([k]) => !fdsVide(r[k])); const deIa = (k) => (r.ia || []).includes(k);
  const egal = (k) => JSON.stringify(Array.isArray(f[k]) ? [...f[k]].sort() : f[k] == null ? '' : String(f[k])) === JSON.stringify(Array.isArray(r[k]) ? [...r[k]].sort() : String(r[k]));
  const [pris, setPris] = useState(() => lignes.filter(([k]) => !egal(k)).map(([k]) => k));
  return (
    <div className="rounded-md border border-line p-3" style={{ background: 'var(--surface2)' }} data-fds-revue="">
      <div className="mb-2 flex flex-wrap items-center gap-2"><b>Lu dans « {lu.fichier} »</b>{lu.ocr ? <Chip tone="warn">scan : lecture à vérifier</Chip> : null}<span className="text-xs text-ink2">{lignes.length} information{lignes.length > 1 ? 's' : ''} trouvée{lignes.length > 1 ? 's' : ''}</span></div>
      {!lignes.length ? <Notice tone="warn">Aucune information reconnue dans ce fichier : est-ce bien une fiche de données de sécurité ?{lu.ocr ? ' Le scan est peut-être trop flou.' : ''}</Notice> : (
        <ul className="space-y-1">{lignes.map(([k, lab]) => { const same = egal(k); return (
          <li key={k} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={pris.includes(k)} onChange={(e) => setPris(e.target.checked ? [...pris, k] : pris.filter((x) => x !== k))} aria-label={`Reprendre : ${lab}`} />
            <span className="min-w-0"><span className="text-xs text-ink2">{deIa(k) ? <span title="Lu par l’assistant IA : à vérifier">🤖 </span> : null}{lab}{same ? ' (identique)' : !fdsVide(f[k]) ? ' (remplace la valeur actuelle)' : ''}{k === 'pictos' && r.pictosDeduits ? ' — déduits des mentions de danger' : ''}</span><span className="block whitespace-pre-line break-words">{fdsTexte(k, r[k])}</span></span></li>); })}</ul>)}
      <div className="mt-2 flex flex-wrap gap-2">{lignes.length ? <Btn kind="primary" size="sm" disabled={!pris.length} onClick={() => onAppliquer(pris)}>Reprendre la sélection ({pris.length})</Btn> : null}<Btn size="sm" onClick={onFermer}>Ignorer</Btn></div>
    </div>
  );
}

/* ---------- fiche produit : création, modification ---------- */
const HYG_VIDE = () => ({ nom: '', type: 'alcalin', fabricant: '', fournisseur: '', reference: '', composition: '', forme: 'liquide', unite: 'L', concMin: '', concMax: '', concUnite: '%', temperature: '', contact: '', rincage: 'oui', contactAlimentaire: false, modeEmploi: '',
  revendications: [], mention: '', pictos: [], phrasesH: '', epi: [], incompatibilites: '', stockage: '', secours: '', urgence: '', fdsDate: '', fdsVersion: '', notes: '' });
function HygProduitForm({ id, onClose, onSaved, depart }) {
  const { db, act, toast } = useApp(); const p = id ? hygDef(db, id) : null;
  const [f, setF] = useState(() => { const b = { ...HYG_VIDE(), ...(p ? clone(p) : {}) }; ['concMin', 'concMax'].forEach((k) => { b[k] = b[k] == null ? '' : String(b[k]).replace('.', ','); }); return depart && depart.lu ? fdsAppliquer(b, depart.lu.res) : b; });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v })); const [depot, setDepot] = useState(null); useSuiviFiche(p, setF, ['fabricant', 'composition', 'modeEmploi', 'stockage', 'fdsDate', 'fdsVersion']);
  const tog = (k, v) => setF((x) => ({ ...x, [k]: (x[k] || []).includes(v) ? x[k].filter((y) => y !== v) : [...(x[k] || []), v] }));
  // documents choisis avant l'enregistrement d'un nouveau produit (la FDS déposée en tête)
  const [pieces, setPieces] = useState(() => (depart && depart.piece ? [depart.piece] : [])); const piecesRef = useRef(pieces); piecesRef.current = pieces; const engage = useRef(false);
  useEffect(() => () => { if (!engage.current) piecesRef.current.forEach((x) => { docDel(x.id).catch(() => { /* déjà absent */ }); }); }, []);
  const [lu, setLu] = useState(() => (depart && depart.lu ? { ...depart.lu, applique: true } : null)); const [busy, setBusy] = useState(''); const { add } = useDocActions();
  const lire = async (fs) => {
    const file = fs[0]; if (!file) return; setBusy('Lecture de la FDS…');
    try {
      const r = await lireFdsComplete(file, { onEtape: setBusy, nom: f.nom || (p && p.nom) });
      if (p) { setLu({ ...r, file }); } // fiche existante : revue avant de reprendre
      else { setF((x) => fdsAppliquer(x, r.res)); setLu({ ...r, file, applique: true }); const pc = await pieceEnAttente(file, 'fds'); setPieces((L) => [...L, pc]); toast(`FDS lue : ${r.res.trouves} information${r.res.trouves > 1 ? 's' : ''} reprise${r.res.trouves > 1 ? 's' : ''}, à vérifier. Le fichier est joint comme FDS.`); }
      if (r.iaErr) toast(`Assistant IA : ${r.iaErr}`, 'bad');
    } catch (e) { toast(`Lecture impossible : ${e.message || e}`, 'bad'); }
    setBusy('');
  };
  const dep = useDepot(lire, { disabled: !!busy, multiple: false, accept: FDS_ACCEPT });
  const appliquer = async (cles) => { setF((x) => fdsAppliquer(x, lu.res, cles)); if (lu.file && p && !hygDocs(db, p.id, 'fds').some((d) => d.nom === lu.fichier && d.taille === lu.file.size)) await add([lu.file], { type: 'produitHygiene', id: p.id }, 'fds'); setLu(null); toast('Informations reprises : vérifiez-les puis enregistrez.'); };
  const save = () => {
    const nom = id ? f.nom : nomProduitCasse(f.nom.trim()); // nouveau produit : casse du nom harmonisée (0.26.0-alpha.1)
    const r = act((d) => { const r1 = hygProduitSave(d, { ...f, nom }, id); if (r1.ok && !id) docsJoindre(d, piecesRef.current, { type: 'produitHygiene', id: r1.id }); return r1; });
    if (r && r.ok) { engage.current = true; toast(id ? 'Produit d’hygiène modifié.' : `Produit d’hygiène « ${nom.trim()} » créé${piecesRef.current.length ? ` (${piecesRef.current.length > 1 ? `${piecesRef.current.length} documents joints` : '1 document joint'})` : ''}.`); onClose(); if (onSaved) onSaved(r.id); }
  };
  const fds = p ? hygFdsEtat(db, p) : null; const uC = f.concUnite === 'pur';
  return (
    <FormSheet wide title={id ? `Modifier « ${p ? p.nom : ''} »` : 'Nouveau produit d’hygiène'} sub="Produit de nettoyage, de désinfection ou de détartrage : sécurité (FDS), emploi, documents." onClose={onClose} onSave={save}>
      <div {...dep.props} className={cx('rounded-md border border-dashed border-line p-3', dep.sur && 'sur')} data-fds-zone="">
        <div className="flex flex-wrap items-center gap-3">
          <ZoneDepot onFiles={lire} depot={dep} busy={!!busy} multiple={false} accept={FDS_ACCEPT} icon="📄" kind="primary" label={p ? 'Relire une FDS (nouvelle version)' : 'Lire la FDS pour remplir la fiche'} inputLabel="Fiche de données de sécurité à lire" />
          <span className="help min-w-0 flex-1">{busy || 'Déposez la fiche de données de sécurité (PDF, scan ou photo) : nom, fabricant, date de révision, pictogrammes, mentions de danger, protections, incompatibilités… sont repris. Vérifiez-les toujours.'}</span>
        </div>
        {lu && lu.applique ? <div className="mt-2"><Notice tone="info" title={`Lu dans « ${lu.fichier} »${lu.ocr ? ' (scan : à vérifier attentivement)' : ''}`}>{lu.res.trouves ? `${lu.res.trouves} information${lu.res.trouves > 1 ? 's' : ''} reprise${lu.res.trouves > 1 ? 's' : ''} ci-dessous.` : 'Aucune information reconnue : est-ce bien une FDS ?'}{lu.res.pictosDeduits ? ' Pictogrammes déduits des mentions de danger (la FDS ne les nomme pas).' : ''} Le fichier sera joint comme FDS.{lu.ia && (lu.res.ia || []).length ? <span>{` 🤖 ${lu.ia} en a complété ${lu.res.ia.length}.`}</span> : null}</Notice></div> : null}
        {lu && !lu.applique ? <div className="mt-2"><FdsRevue lu={lu} f={f} onAppliquer={appliquer} onFermer={() => setLu(null)} /></div> : null}
      </div>
      <h4 className="mt-1 font-semibold">Identification</h4>
      <G><Field label="Nom du produit" help={f.nom.trim() && nameTaken(hygListe(db), id ? f.nom : nomProduitCasse(f.nom), id) ? '⚠ Ce produit existe déjà.' : !id && f.nom.trim() && nomProduitCasse(f.nom.trim()) !== f.nom.trim() ? `Enregistré sous « ${nomProduitCasse(f.nom.trim())} »` : ''}><TI value={f.nom} onChange={(v) => set('nom', v)} autoFocus={!depart} placeholder="ex. Soude caustique 30 %" /></Field>
        <Field label="Nature"><SI plain value={f.type} onChange={(v) => set('type', v)} options={hygOpts(HYG_TYPES, f.type)} aria-label="Nature" /></Field></G>
      <G n={3}><Field label="Fabricant / marque"><TI value={f.fabricant} onChange={(v) => set('fabricant', v)} list="hyg-fab" /></Field><Field label="Fournisseur"><TI value={f.fournisseur} onChange={(v) => set('fournisseur', v)} list="hyg-fou" /></Field><Field label="Référence"><TI value={f.reference} onChange={(v) => set('reference', v)} placeholder="code article" /></Field></G>
      <datalist id="hyg-fab">{uniq(hygListe(db).map((x) => x.fabricant).filter(Boolean)).map((x) => <option key={x} value={x} />)}</datalist>
      <datalist id="hyg-fou">{uniq([...hygListe(db).map((x) => x.fournisseur), ...(db.fournisseurs || []).map((x) => x.nom)].filter(Boolean)).map((x) => <option key={x} value={x} />)}</datalist>
      <G n={3}><Field label="Forme"><SI plain value={f.forme} onChange={(v) => set('forme', v)} options={hygOpts(HYG_FORMES, f.forme)} aria-label="Forme" /></Field><Field label="Unité (quantités)"><SI plain value={f.unite} onChange={(v) => set('unite', v)} options={hygOpts(HYG_UNITES, f.unite)} aria-label="Unité" /></Field><Field label="Composition / matière active"><TI value={f.composition} onChange={(v) => set('composition', v)} placeholder="ex. Hydroxyde de sodium (30 %)" /></Field></G>
      <h4 className="mt-2 font-semibold">Emploi</h4>
      <G n={3}><Group label="Concentration d’emploi"><div className="flex items-center gap-1"><input className="inp num" style={{ width: 80 }} inputMode="decimal" disabled={uC} value={uC ? '' : f.concMin} onChange={(e) => set('concMin', e.target.value)} placeholder="min" aria-label="Concentration minimale" /><span className="text-sm text-ink2">à</span><input className="inp num" style={{ width: 80 }} inputMode="decimal" disabled={uC} value={uC ? '' : f.concMax} onChange={(e) => set('concMax', e.target.value)} placeholder="max" aria-label="Concentration maximale" /><select className="inp" style={{ width: 'auto' }} value={f.concUnite} onChange={(e) => set('concUnite', e.target.value)} aria-label="Unité de concentration">{hygOpts(HYG_CONC, f.concUnite).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div></Group>
        <Field label="Température"><TI value={f.temperature} onChange={(v) => set('temperature', v)} placeholder="ex. 40 à 60 °C" /></Field><Field label="Temps de contact"><TI value={f.contact} onChange={(v) => set('contact', v)} placeholder="ex. 15 à 30 min" /></Field></G>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2"><Group label="Rinçage à l’eau potable après usage"><SI plain value={f.rincage} onChange={(v) => set('rincage', v)} options={[{ value: 'oui', label: 'Obligatoire' }, { value: 'non', label: 'Sans rinçage' }, { value: '', label: 'Non précisé' }]} aria-label="Rinçage après usage" /></Group>
        <div className="pt-5"><Check checked={!!f.contactAlimentaire} onChange={(v) => set('contactAlimentaire', v)} label="Apte au contact des denrées alimentaires (après rinçage)" /></div></div>
      <Group label="Utilisable pour les vins (d’après la fiche technique ou l’attestation du fournisseur)" help="Rien de coché : non renseigné. Coché : un nettoyage d’une cuve contenant un vin d’une autre revendication est signalé."><div className="flex flex-wrap gap-x-4 gap-y-1">{QUALIFS.filter((q) => !q.masque || (f.revendications || []).includes(q.id)).map((q) => <Check key={q.id} checked={(f.revendications || []).includes(q.id)} onChange={() => tog('revendications', q.id)} label={q.code} />)}</div></Group>
      <Field label="Mode d’emploi"><TA value={f.modeEmploi} onChange={(v) => set('modeEmploi', v)} placeholder="Préparation de la solution, application, rinçage…" /></Field>
      <h4 className="mt-2 font-semibold">Sécurité (fiche de données de sécurité)</h4>
      <G n={3}><Field label="Date de révision de la FDS"><DI value={f.fdsDate} onChange={(v) => set('fdsDate', v)} /></Field><Field label="Version de la FDS"><TI value={f.fdsVersion} onChange={(v) => set('fdsVersion', v)} /></Field>
        <Field label="Mention d’avertissement"><SI plain value={f.mention} onChange={(v) => set('mention', v)} options={[{ value: '', label: 'Aucune' }, ...HYG_MENTIONS.map(([v, l]) => ({ value: v, label: l }))]} /></Field></G>
      <Group label="Pictogrammes de danger"><div className="flex flex-wrap gap-1.5" role="group" aria-label="Pictogrammes de danger">{HYG_PICTOS.map(([c, l]) => { const on = (f.pictos || []).includes(c); return <button key={c} type="button" className={cx('flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-xs', on ? 'border-bad' : 'border-line opacity-50')} style={on ? { background: 'var(--badSoft)' } : undefined} aria-pressed={on} onClick={() => tog('pictos', c)} title={`${c} — ${l}`}><PictoSGH code={c} size={24} />{l}</button>; })}</div></Group>
      <Field label="Mentions de danger (H)"><TA value={f.phrasesH} onChange={(v) => set('phrasesH', v)} rows={3} placeholder="ex. H314 : Provoque de graves brûlures de la peau et de graves lésions des yeux." /></Field>
      <Group label="Protections individuelles obligatoires"><div className="flex flex-wrap gap-1.5" role="group" aria-label="Protections individuelles">{HYG_EPI.filter((x) => !(x[2] && x[2].masque) || (f.epi || []).includes(x[0])).map(([c, l]) => { const on = (f.epi || []).includes(c); return <button key={c} type="button" className={cx('flex items-center gap-1.5 rounded-md border px-1.5 py-1 text-xs', on ? 'border-accent' : 'border-line opacity-50')} style={on ? { background: 'var(--accentSoft)' } : undefined} aria-pressed={on} onClick={() => tog('epi', c)}><EpiIcone id={c} size={22} />{l}</button>; })}</div></Group>
      <G><Field label="Matières incompatibles (ne jamais mélanger avec)"><TA value={f.incompatibilites} onChange={(v) => set('incompatibilites', v)} rows={2} placeholder="ex. Acides : dégagement de chlore" /></Field><Field label="Stockage"><TA value={f.stockage} onChange={(v) => set('stockage', v)} rows={2} placeholder="Lieu, rétention, à l’écart de…" /></Field></G>
      <G><Field label="Premiers secours"><TA value={f.secours} onChange={(v) => set('secours', v)} rows={2} placeholder="Yeux, peau, ingestion, inhalation…" /></Field><Field label="Numéro d’appel d’urgence" help="En cas d’urgence : 15 (SAMU) ou 112."><TI value={f.urgence} onChange={(v) => set('urgence', v)} placeholder="centre antipoison, fabricant…" /></Field></G>
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} rows={2} /></Field>
      <Group label={`Documents : FDS, fiche technique, attestations${fds ? ` — ${fds.label}` : ''}`}>{p ? <DocsPanel cible={{ type: 'produitHygiene', id: p.id }} kind="produitHygiene" deposer={setDepot} aide="Chaque fichier déposé est lu (type, date de révision, informations pour la fiche) ; une version plus récente remplace la précédente, qui reste dans les versions archivées." /> : <DocsAttente items={pieces} onChange={setPieces} kind="produitHygiene" />}</Group>
      {depot && p ? <FichesDepot fichiers={depot} cible={{ type: 'produitHygiene', id: p.id }} onClose={() => setDepot(null)} /> : null}
    </FormSheet>
  );
}

/* ---------- fiche de consultation ---------- */
function HygProduitSheet({ id, onClose }) {
  const { db, act, confirm, camp } = useApp(); const p = hygDef(db, id); const [edit, setEdit] = useState(false); const [imp, setImp] = useState(false); const [depot, setDepot] = useState(null);
  if (!p) return null;
  const C = hygConso(db, p.id, camp.debut, camp.fin); const T = hygConso(db, p.id); const E = hygUsages(db, p.id).slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12);
  const unite = hygLib(HYG_UNITES, p.unite); const cible = (h) => (h.cibleType === 'contenant' ? contName(db, h.cibleId) : lbl(db, 'equipements', h.cibleId));
  const suppr = async () => {
    if (!(await confirm({ title: `Supprimer « ${p.nom} » ?`, body: `Le produit et ses ${hygDocs(db, p.id, null, true).length} document(s) joint(s) sont supprimés.`, ok: 'Supprimer', danger: true }))) return;
    const r = act((d) => hygProduitDelete(d, p.id), 'Produit d’hygiène supprimé.'); if (r && r.ok) { (r.docs || []).forEach((k) => docDel(k).catch(() => { /* déjà absent */ })); onClose(); }
  };
  const L = (lab, v) => (v ? <><dt>{lab}</dt><dd className="whitespace-pre-line">{v}</dd></> : null);
  return (
    <Sheet wide title={p.nom} sub={[hygLib(HYG_TYPES, p.type), p.fabricant, p.reference].filter(Boolean).join(' · ')} onClose={onClose}
      footer={<>{T.n ? null : <Btn kind="danger" onClick={suppr} className="mr-auto">Supprimer</Btn>}<Btn className={T.n ? 'mr-auto' : ''} onClick={() => act((d) => hygProduitArchiver(d, p.id, !p.archive), p.archive ? 'Produit de nouveau proposé.' : 'Produit archivé : il n’est plus proposé dans le journal.')}>{p.archive ? 'Réactiver' : 'Archiver'}</Btn><Btn onClick={() => setImp(true)}>🖨 Fiche de sécurité</Btn><Btn kind="primary" onClick={() => setEdit(true)}>Modifier</Btn></>}>
      <div className="mb-4 flex flex-wrap items-center gap-2">{p.archive ? <Chip>archivé</Chip> : null}<FdsChip db={db} p={p} />{p.contactAlimentaire ? <Chip tone="ok">contact alimentaire</Chip> : null}{p.rincage === 'oui' ? <Chip tone="info">rinçage obligatoire</Chip> : p.rincage === 'non' ? <Chip>sans rinçage</Chip> : null}{(p.revendications || []).map((q) => <QChip key={q} id={q} />)}</div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))' }}>
        <div className="card p-4" data-fiche-securite="">
          <h3 className="mb-2 font-semibold">Sécurité</h3>
          {(p.pictos || []).length || p.mention ? <div className="mb-3 flex flex-wrap items-center gap-2">{(p.pictos || []).map((c) => <span key={c} className="flex items-center gap-1 text-xs"><PictoSGH code={c} size={40} />{hygLib(HYG_PICTOS, c)}</span>)}<MentionChip m={p.mention} /></div> : <p className="mb-2 text-sm text-ink2">Pictogrammes et mention d’avertissement non renseignés.</p>}
          {p.phrasesH ? <div className="mb-3 whitespace-pre-line text-sm">{p.phrasesH}</div> : null}
          {(p.epi || []).length ? <div className="mb-3"><div className="lbl">Protections obligatoires</div><div className="flex flex-wrap gap-2">{p.epi.map((x) => <span key={x} className="flex items-center gap-1.5 text-sm"><EpiIcone id={x} size={30} />{hygLib(HYG_EPI, x)}</span>)}</div></div> : null}
          {p.incompatibilites ? <Notice tone="bad" title="Ne jamais mélanger avec">{p.incompatibilites}</Notice> : null}
          <dl className="kv mt-3">{L('Stockage', p.stockage)}{L('Premiers secours', p.secours)}{L('Urgence', [p.urgence, '15 (SAMU) ou 112'].filter(Boolean).join(' · '))}</dl>
        </div>
        <div className="space-y-4">
          <div className="card p-4"><h3 className="mb-2 font-semibold">Emploi</h3>
            <dl className="kv">{L('Concentration', hygPlage(p) || '—')}{L('Température', p.temperature)}{L('Temps de contact', p.contact)}{L('Rinçage', p.rincage === 'oui' ? 'Obligatoire, à l’eau potable' : p.rincage === 'non' ? 'Sans rinçage' : '')}{L('Mode d’emploi', p.modeEmploi)}{L('Composition', p.composition)}{L('Forme', `${hygLib(HYG_FORMES, p.forme)} · ${unite}`)}{L('Fournisseur', p.fournisseur)}{L('FDS', [isoOK(p.fdsDate) ? `révisée le ${fmtDate(p.fdsDate)}` : '', p.fdsVersion ? `version ${p.fdsVersion}` : ''].filter(Boolean).join(', '))}{L('Notes', p.notes)}</dl></div>
          <div className="card p-4"><h3 className="mb-2 font-semibold">Utilisation</h3>
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}><Kpi label={`Campagne ${camp.nom}`} value={fmt(C.n)} sub="utilisations" /><Kpi label="Quantité" value={C.nQuantite ? `${hygNb(C.quantite)} ${unite}` : '—'} sub="campagne" /><Kpi label="Dernière" value={T.derniere ? fmtDate(T.derniere) : '—'} /></div>
            {E.length ? <ul className="mt-2 divide-y divide-[var(--line)] text-sm">{E.map((h) => <li key={h.id} className="flex flex-wrap gap-x-2 py-1"><span className="num">{fmtDate(h.date)}</span><b>{cible(h)}</b><span className="text-ink2">{lbl(db, 'actionsHygiene', h.actionId)}</span><span className="ml-auto text-xs">{h.produits.filter((l) => l.produitId === p.id).map((l) => hygConcTxt(l.conc, l.concUnite)).filter(Boolean).join(', ')}</span></li>)}</ul> : <p className="mt-2 text-sm text-ink2">Pas encore utilisé dans le journal d’hygiène.</p>}
          </div>
        </div>
      </div>
      <Sec title="Documents" className="mt-4"><DocsPanel cible={{ type: 'produitHygiene', id: p.id }} kind="produitHygiene" deposer={setDepot} aide="Chaque fichier déposé est lu (type, date de révision, informations pour la fiche) ; une version plus récente remplace la précédente, qui reste dans les versions archivées." /></Sec>
      {depot ? <FichesDepot fichiers={depot} cible={{ type: 'produitHygiene', id: p.id }} onClose={() => setDepot(null)} /> : null}
      {edit ? <HygProduitForm id={p.id} onClose={() => setEdit(false)} /> : null}
      {imp ? <HygFichesImpression ids={[p.id]} onClose={() => setImp(false)} /> : null}
    </Sheet>
  );
}

/* ---------- fiches de sécurité imprimables (une page par produit, à afficher au poste de nettoyage) ---------- */
function HygFiche({ p, brk }) {
  const { db } = useApp(); const row = (a, b) => (b ? <tr><th style={{ width: '32%' }}>{a}</th><td>{b}</td></tr> : null);
  return (
    <div className="rpt-item" style={brk ? { breakBefore: 'page' } : undefined}>
      <h2>{p.nom}</h2>
      <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{[hygLib(HYG_TYPES, p.type), p.fabricant, isoOK(p.fdsDate) ? `FDS révisée le ${fmtDate(p.fdsDate)}` : 'date de la FDS non renseignée'].filter(Boolean).join(' · ')}</div>
      {(p.pictos || []).length || p.mention ? <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 8 }}>{(p.pictos || []).map((c) => <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}><PictoSGH code={c} size={58} />{hygLib(HYG_PICTOS, c)}</span>)}{p.mention ? <b style={{ fontSize: 22, color: p.mention === 'danger' ? '#B3261E' : '#9A5B00', textTransform: 'uppercase', letterSpacing: '.04em' }}>{hygLib(HYG_MENTIONS, p.mention)}</b> : null}</div> : null}
      {p.phrasesH ? <><h3>Dangers</h3><div style={{ whiteSpace: 'pre-line', fontSize: 12.5 }}>{p.phrasesH}</div></> : null}
      {(p.epi || []).length ? <><h3>Protections obligatoires</h3><div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>{p.epi.map((x) => <span key={x} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}><EpiIcone id={x} size={44} />{hygLib(HYG_EPI, x)}</span>)}</div></> : null}
      <h3>Emploi</h3>
      <table><tbody>{row('Concentration', hygPlage(p) || 'non renseignée')}{row('Température', p.temperature)}{row('Temps de contact', p.contact)}{row('Rinçage', p.rincage === 'oui' ? 'OBLIGATOIRE, à l’eau potable' : p.rincage === 'non' ? 'sans rinçage' : '')}{row('Mode d’emploi', p.modeEmploi)}{row('Contact alimentaire', p.contactAlimentaire ? 'apte (après rinçage)' : '')}{row('Utilisable pour', (p.revendications || []).map(qLabel).join(', '))}</tbody></table>
      {p.incompatibilites ? <><h3>Ne jamais mélanger avec</h3><div style={{ fontSize: 13, fontWeight: 600, color: '#B3261E' }}>{p.incompatibilites}</div></> : null}
      {p.stockage ? <><h3>Stockage</h3><div style={{ fontSize: 12.5 }}>{p.stockage}</div></> : null}
      <h3>En cas d’accident</h3>
      <div style={{ fontSize: 12.5, whiteSpace: 'pre-line' }}>{p.secours || 'Voir la fiche de données de sécurité (rubrique 4).'}</div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>Urgences : 15 (SAMU) ou 112{p.urgence ? ` · ${p.urgence}` : ''}</div>
      <div className="muted" style={{ fontSize: 10.5, marginTop: 8 }}>Résumé établi d’après la fiche de données de sécurité du fournisseur{hygDocs(db, p.id, 'fds').length ? ' (jointe dans Œnotrack)' : ''} : en cas de doute, la FDS fait foi.</div>
    </div>
  );
}
function HygFichesImpression({ ids, onClose }) {
  const { db } = useApp(); const ref = useRef(null); const P = ids.map((i) => hygDef(db, i)).filter(Boolean);
  const out = useReportOutput(ref, `fiches-securite-hygiene-${todayISO()}`);
  return (
    <Sheet wide title="Fiches de sécurité au poste" sub={`${P.length} produit${P.length > 1 ? 's' : ''} d’hygiène — une page par produit, à afficher près du poste de nettoyage`} onClose={onClose}
      footer={<><Btn onClick={onClose} className="mr-auto">Fermer</Btn><BoutonsSortie out={out} /></>}>
      <div ref={ref} className="report">
        <ReportHead title={P.length === 1 ? `Fiche de sécurité — ${P[0].nom}` : 'Fiches de sécurité — produits d’hygiène'} sub="hygiène" />
        {P.map((p, i) => <HygFiche key={p.id} p={p} brk={i > 0} />)}
      </div>
    </Sheet>
  );
}

/* ---------- liste des produits d'hygiène ---------- */
function HygProduitsView() {
  const { db, camp, toast } = useApp(); const [q, setQ] = useState(''); const [type, setType] = useState(''); const [arch, setArch] = useState(false);
  const [form, setForm] = useState(null); const [voir, setVoir] = useState(null); const [imp, setImp] = useState(null); const [busy, setBusy] = useState('');
  const tous = hygListe(db); const actifs = tous.filter((p) => !p.archive);
  const etats = actifs.map((p) => hygFdsEtat(db, p)); const nMq = etats.filter((e) => e.k === 'manquante').length; const nAnc = etats.filter((e) => e.k === 'ancienne').length;
  const rows = tous.filter((p) => (arch || !p.archive) && (!type || p.type === type) && (!q || norm(`${p.nom} ${p.fabricant} ${p.fournisseur} ${p.reference} ${p.composition}`).includes(norm(q)))).slice().sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr'));
  // FDS déposée sur la liste : produit créé (ou fiche existante relue) d'après la fiche
  const deposer = async (fs) => {
    const file = fs[0]; if (!file) return; setBusy('Lecture de la FDS…');
    try {
      const lu0 = await lireFds(file, { onEtape: setBusy }); const ex = lu0.res.nom && tous.find((p) => norm(p.nom).trim() === norm(lu0.res.nom).trim());
      if (ex) { toast(`« ${ex.nom} » existe déjà : ouvrez sa fiche puis « Relire une FDS ».`); setVoir(ex.id); }
      else { const lu = await fdsCompleterIa(lu0, { onEtape: setBusy }); if (lu.iaErr) toast(`Assistant IA : ${lu.iaErr}`, 'bad'); const piece = await pieceEnAttente(file, 'fds'); setForm({ depart: { lu, piece } }); }
    } catch (e) { toast(`Lecture impossible : ${e.message || e}`, 'bad'); }
    setBusy('');
  };
  const cons = (p) => hygConso(db, p.id, camp.debut, camp.fin).n;
  return (
    <div>
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label="Produits d’hygiène" value={fmt(actifs.length)} sub={tous.length > actifs.length ? `+ ${tous.length - actifs.length} archivé(s)` : 'en service'} />
        <Kpi label="FDS manquantes" value={fmt(nMq)} tone={nMq ? 'bad' : 'ok'} sub="à demander au fournisseur" />
        <Kpi label={`FDS de plus de ${HYG_FDS_ANS} ans`} value={fmt(nAnc)} tone={nAnc ? 'warn' : undefined} sub="version à vérifier" />
        <Kpi label="Produits « Danger »" value={fmt(actifs.filter((p) => p.mention === 'danger').length)} sub={`${fmt(actifs.filter((p) => (p.pictos || []).length).length)} avec pictogrammes`} />
      </div>
      <div className="mb-3"><ZoneDepot onFiles={deposer} busy={!!busy} multiple={false} accept={FDS_ACCEPT} icon="📄" label="Créer un produit à partir de sa FDS" sub={busy || 'PDF, scan ou photo : la fiche du produit est pré-remplie, à vérifier'} inputLabel="Fiche de données de sécurité" /></div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <TI value={q} onChange={setQ} placeholder="Rechercher un produit, un fabricant…" style={{ width: 240 }} aria-label="Rechercher un produit d’hygiène" />
        <SI value={type} onChange={setType} placeholder="Toutes natures" style={{ width: 'auto' }} options={hygOpts(HYG_TYPES, type)} aria-label="Nature" />
        <Check checked={arch} onChange={setArch} label="Afficher les archivés" />
        <span className="ml-auto" /><Btn disabled={!actifs.length} onClick={() => setImp(rows.filter((p) => !p.archive).map((p) => p.id))}>🖨 Fiches de sécurité</Btn><Btn kind="primary" onClick={() => setForm({})}>+ Nouveau produit</Btn>
      </div>
      {!tous.length ? <Empty>Aucun produit d’hygiène : ajoutez vos produits de nettoyage et de désinfection (« + Nouveau produit »), ou déposez leur fiche de données de sécurité ci-dessus.</Empty> : (<>
        <div className="hidden md:block"><Tbl rows={rows} onRow={(p) => setVoir(p.id)} empty="Aucun produit ne correspond." cols={[
          { h: 'Produit', r: (p) => <div><b>{p.nom}</b>{p.archive ? <Chip className="ml-1">archivé</Chip> : null}<div className="text-xs text-ink2">{[hygLib(HYG_TYPES, p.type), p.fabricant].filter(Boolean).join(' · ')}</div></div> },
          { h: 'Dangers et protections', r: (p) => <HygSecurite p={p} size={24} /> },
          { h: 'Emploi', r: (p) => <span className="text-sm">{hygPlage(p) || '—'}{p.rincage === 'oui' ? <span className="block text-xs text-ink2">rinçage obligatoire</span> : null}</span> },
          { h: 'FDS', r: (p) => <FdsChip db={db} p={p} /> },
          { h: 'Docs', r: (p) => <DocsButton cible={{ type: 'produitHygiene', id: p.id }} kind="produitHygiene" title={p.nom} /> },
          { h: 'Campagne', cls: 'r', r: (p) => <span className="num" title="Utilisations sur la campagne">{fmt(cons(p))}</span> }]} /></div>
        <div className="space-y-2 md:hidden">{rows.map((p) => (
          <button key={p.id} type="button" className="card block w-full p-3 text-left" onClick={() => setVoir(p.id)}>
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><b>{p.nom}</b>{p.archive ? <Chip className="ml-1">archivé</Chip> : null}<div className="text-xs text-ink2">{[hygLib(HYG_TYPES, p.type), hygPlage(p)].filter(Boolean).join(' · ')}</div></div><FdsChip db={db} p={p} /></div>
            <div className="mt-2"><HygSecurite p={p} size={24} /></div>
          </button>))}{!rows.length ? <Empty>Aucun produit ne correspond.</Empty> : null}</div>
      </>)}
      <p className="help mt-3">La fiche de données de sécurité (FDS) de chaque produit dangereux doit être à disposition des personnes qui l’utilisent. Joignez-la à chaque produit : Œnotrack signale celles qui manquent et celles révisées il y a plus de {HYG_FDS_ANS} ans (demandez alors la dernière version au fournisseur).</p>
      {form ? <HygProduitForm id={form.id} depart={form.depart} onClose={() => setForm(null)} onSaved={(nid2) => { if (!form.id && nid2) setVoir(nid2); }} /> : null}
      {voir ? <HygProduitSheet id={voir} onClose={() => setVoir(null)} /> : null}
      {imp ? <HygFichesImpression ids={imp} onClose={() => setImp(null)} /> : null}
    </div>
  );
}
