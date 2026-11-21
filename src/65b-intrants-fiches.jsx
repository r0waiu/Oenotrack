/* ============ INTRANTS › FICHES FT & FDS (0.20.0-alpha.1) : dépôt groupé, lien fournisseur, alertes FDS, veille en ligne (assistant IA) ============
   Moteur : 16b-intrants-fiches.js (lecture, rapprochement, remplacement avec archivage) et 17-ia.js (assistant IA, clé de l'utilisateur). */
const FICHES_ACCEPT = '.pdf,application/pdf,image/*,.txt,text/plain,.doc,.docx,.odt';
const rechercheWeb = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

// lecture d'un document déposé : texte du PDF (ou des deux premières pages d'un scan), titre en gros caractères, analyse
async function lireFicheProduit(file, { onEtape } = {}) {
  const nom = file.name || 'document'; const et = (t) => { if (onEtape) onEtape(t); };
  const base = { fichier: nom, taille: file.size || 0, mime: file.type || '', ocr: false, nbPages: 0 };
  if (estPdf(file)) {
    et('Ouverture du PDF…'); const L = await chargerPdfjs();
    const doc = await L.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, wasmUrl: `${PDFJS_BASE}wasm/`, standardFontDataUrl: `${PDFJS_BASE}standard_fonts/`, cMapUrl: `${PDFJS_BASE}cmaps/`, cMapPacked: true }).promise;
    try {
      const n = Math.min(doc.numPages, 10); const pages = [];
      for (let i = 1; i <= n; i += 1) { et(`Lecture de la page ${i} / ${n}…`); const pg = await doc.getPage(i); const t = await pdfPageItems(pg); pages.push({ n: i, ...t, pg, vide: t.items.map((it) => it.s).join('').replace(/[^A-Za-zÀ-ÿ]/g, '').length < 40 }); } // page sans texte (scan) : moins de 40 lettres
      let ocr = false;
      if (pages.length && pages.every((p) => p.vide)) { // scan : reconnaissance de caractères des deux premières pages (nom, fournisseur, date)
        ocr = true; const max = Math.min(pages.length, 2);
        for (let i = 0; i < max; i += 1) { et(`Scan : reconnaissance du texte, page ${i + 1} / ${max} (la première fois, le module de lecture se télécharge)…`); const r = await renduPage(pages[i].pg, 200); nettoyerScan(r.canvas); pages[i] = { ...(await ocrCanvas(r.canvas, i + 1, r.echelle)), n: i + 1 }; r.canvas.width = 0; }
        pages.splice(max);
      }
      const texte = fdsTexteDePages(pages); return { ...base, ...ficheAnalyser(texte, { titre: ficheTitreDePage(pages[0]), fichier: nom }), texte: texte.slice(0, 20000), ocr, nbPages: doc.numPages };
    } finally { try { doc.destroy(); } catch (e) { /* ignoré */ } }
  }
  if (estImage(file)) { et('Photo : reconnaissance du texte (la première fois, le module de lecture se télécharge)…'); const c = nettoyerScan(await imageCanvas(file)); const p = await ocrCanvas(c, 1, 1); const texte = fdsTexteDePages([p]); return { ...base, ...ficheAnalyser(texte, { titre: ficheTitreDePage(p), fichier: nom }), texte: texte.slice(0, 20000), ocr: true, nbPages: 1 }; }
  if (/^text\//.test(file.type || '') || /\.txt$/i.test(nom)) { const texte = await lectureFichier(file); return { ...base, ...ficheAnalyser(texte, { fichier: nom }), texte: String(texte || '').slice(0, 20000), nbPages: 1 }; }
  return { ...base, ...ficheAnalyser('', { fichier: nom }) }; // Word, OpenDocument… : type d'après le nom du fichier
}
const lectureEchec = (f, e) => { const m = (e && e.message) || String(e || ''); return /fetch|import|module|réseau|network|script|worker/i.test(m) && (estPdf(f) || estImage(f)) ? 'module de lecture injoignable (connexion internet ? page affichée dans claude.ai ?) : choisissez le produit et la date à la main' : `lecture impossible (${m || 'fichier illisible'}) : choisissez le produit et la date à la main`; };

// formulaire ouvert pendant qu'un dépôt complète la fiche du produit : les champs que l'utilisateur n'a pas modifiés suivent la base
// (sinon « Enregistrer » remettrait les anciennes valeurs) — 0.26.0-alpha.1
function useSuiviFiche(obj, setF, cles) {
  const val = (o, k) => (o && o[k] != null ? o[k] : ''); const sig = cles.map((k) => JSON.stringify(val(obj, k))).join('\u0001');
  const prec = useRef({ sig, obj });
  useEffect(() => {
    const avant = prec.current; if (avant.sig === sig) return; prec.current = { sig, obj };
    setF((x) => { const o = { ...x }; cles.forEach((k) => { const cur = x[k] == null ? '' : x[k]; if (cur === '' || JSON.stringify(cur) === JSON.stringify(val(avant.obj, k))) o[k] = val(obj, k); }); return o; });
  }, [sig]);
}
// informations d'un document proposées pour la fiche du produit (0.26.0-alpha.1) : lecture du script, complétée par l'assistant IA
function FicheInfos({ r, props: P, coche, onCoche, ia }) {
  if (!r.cle || (!P.length && !r.iaInfos)) return null;
  return (
    <div className="mt-2 rounded-md border border-line p-2" style={{ background: 'var(--surface2)' }} data-fiche-infos="">
      <div className="flex flex-wrap items-center gap-2 text-xs"><b>Pour la fiche du produit</b>{r.iaInfos === 'enCours' ? <span className="text-accent">{`🤖 ${ia} complète la lecture…`}</span> : r.iaInfos && r.iaInfos.err ? <span className="text-bad">🤖 {r.iaInfos.err}</span> : r.iaInfos ? <span className="text-accent">{`🤖 complété par ${ia}`}</span> : null}</div>
      {P.length ? <ul className="mt-1 space-y-1">{P.map((x) => (
        <li key={x.k}><label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 h-4 w-4" style={{ accentColor: 'var(--accent)' }} checked={coche(x)} onChange={(e) => onCoche(x, e.target.checked)} data-info={x.k} />
          <span className="min-w-0"><span className="text-xs text-ink2">{x.src === 'ia' ? <span title="Lu par l’assistant IA : à vérifier">🤖 </span> : null}{x.lab}{x.actuel ? ' (remplace la valeur actuelle)' : ''}</span><span className="block break-words" translate="no">{x.v}</span></span></label></li>))}</ul>
        : r.iaInfos !== 'enCours' ? <div className="help">Rien de nouveau pour la fiche.</div> : null}
    </div>
  );
}

/* ---------- revue du dépôt : un fichier par carte (type, produit reconnu, date de révision, action) ---------- */
const FICHE_ACTIONS = [['ajouter', 'Joindre (version en vigueur)'], ['remplacer', 'Remplacer la version en vigueur (l’ancienne est archivée)'], ['archiver', 'Joindre comme version précédente (archivée)'], ['ignorer', 'Ne pas joindre']];
function FichesDepot({ fichiers, cible, onClose, onFini }) {
  const { db, act, toast, setTab } = useApp(); const dbR = useRef(db); dbR.current = db; const fixe = cible || null;
  const [rows, setRows] = useState(() => (fichiers || []).map((f, i) => ({ k: `${i}:${f.name}:${f.size}`, file: f, etat: 'attente', etape: '', lu: null, genre: '', cle: fixe ? ficheCibleCle(fixe) : '', nom: '', categorie: 'oeno', date: '', version: '', action: '', raison: '', alerte: false, manuel: false, cands: [], ia: null, err: '', infosScript: null, iaVals: null, iaInfos: null, choix: {} })));
  const rowsR = useRef(rows); rowsR.current = rows;
  const [busy, setBusy] = useState(false); const [iaBusy, setIaBusy] = useState(false); const vivant = useRef(true); useEffect(() => () => { vivant.current = false; }, []);
  const maj = (k, patch) => setRows((L) => L.map((r) => (r.k === k ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r)));
  const avecAction = (r) => {
    if (r.manuel) return r;
    if (r.cle === 'nouveau') return { ...r, action: 'ajouter', raison: 'le produit sera créé (catégorie et unité à vérifier ensuite)', alerte: false };
    const c = ficheCibleDeCle(r.cle);
    const a = c ? ficheActionDefaut(dbR.current, c, r.genre, r.date, { nom: r.file.name, taille: r.file.size }) : { action: 'ignorer', raison: 'produit à choisir' };
    return { ...r, action: a.action, raison: a.raison, alerte: !!a.alerte || !c };
  };
  useEffect(() => { (async () => {
    for (const r0 of rows) {
      if (!vivant.current) return; maj(r0.k, { etat: 'lecture', etape: 'Lecture…' });
      let lu; let err = '';
      try { lu = await lireFicheProduit(r0.file, { onEtape: (t) => { if (vivant.current) maj(r0.k, { etape: t }); } }); } catch (e) { err = lectureEchec(r0.file, e); lu = { fichier: r0.file.name, taille: r0.file.size, mime: r0.file.type, ...ficheAnalyser('', { fichier: r0.file.name }) }; }
      if (!vivant.current) return;
      const cands = fixe ? [] : ficheCorrespondances(dbR.current, lu); const rec = fixe || ficheReconnu(cands);
      maj(r0.k, (r) => avecAction({ ...r, etat: 'pret', etape: '', err, lu, cands, genre: lu.genre || 'autre', date: lu.date || '', version: lu.version || '', nom: nomProduitCasse(lu.nom || r.file.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ')), cle: rec ? ficheCibleCle(rec) : '', infosScript: ficheInfosScript(lu.texte || lu.extrait, lu.genre) }));
    }
    // informations de la fiche complétées par l'assistant IA (s'il est configuré) : d'office jusqu'à 10 documents, sinon sur demande
    const A1 = iaActive(); if (vivant.current && A1.pret && A1.completer && rows.length <= 10) { await new Promise((res) => setTimeout(res, 60)); completer(rows.map((r) => r.k)); } // après l'affichage des lectures
  })(); }, []);
  const texteDe = (r) => String((r.lu && (r.lu.texte || r.lu.extrait)) || '');
  const completer = async (keys) => {
    const A1 = iaActive(); if (!A1.pret) { toast('Configurez d’abord l’assistant IA : Paramètres › 🤖 Assistant IA.', 'bad'); return; }
    setIaBusy(true);
    for (const k of keys) {
      if (!vivant.current) break; let r = rowsR.current.find((x) => x.k === k);
      for (let i = 0; i < 20 && r && r.etat !== 'pret'; i += 1) { await new Promise((res) => setTimeout(res, 50)); r = rowsR.current.find((x) => x.k === k); } // lecture encore en cours d'affichage
      if (!r || r.etat !== 'pret' || texteDe(r).replace(/\s+/g, '').length < 80) continue;
      maj(k, { iaInfos: 'enCours' });
      try {
        const c = ficheCibleDeCle(r.cle); const o = c ? ficheCibleObj(dbR.current, c) : null;
        const P = iaPromptInfos({ ...r.lu, genre: r.genre }, PRODUIT_INFOS, (o && o.nom) || r.nom, r.infosScript); const R = await iaDemander(A1, { system: P.system, texte: P.texte, max: P.max });
        const v = iaLireInfos(iaJson(R.texte), PRODUIT_INFOS); if (!v) throw new Error('réponse illisible'); maj(k, { iaVals: v, iaInfos: { n: Object.keys(v).length } });
      } catch (e) { maj(k, { iaInfos: { err: (e && e.message) || String(e) } }); if (e && (e.reseau || e.config || [401, 402, 403, 404].includes(e.statut))) { toast(e.message, 'bad'); break; } }
    }
    setIaBusy(false);
  };
  // informations lues pour la fiche du produit : cochées si elles complètent la fiche, décochées si elles changeraient une valeur saisie
  const cibleInfos = (r, base) => (r.cle === 'nouveau' ? null : ficheCibleDeCle(r.cle));
  // seulement d'un document joint comme version en vigueur (ni ignoré, ni rangé dans les versions précédentes)
  const propositions = (r, base) => (r.cle && !['ignorer', 'archiver'].includes(r.action || 'ignorer') ? infosPropositions(base || db, cibleInfos(r), infosFusion(r.infosScript, r.iaVals)) : []);
  const coche = (r, x) => (r.choix[x.k] !== undefined ? r.choix[x.k] : x.complete);
  const nInfos = (r) => propositions(r).filter((x) => coche(r, x)).length;
  const choisir = (k, champ, v) => maj(k, (r) => avecAction({ ...r, [champ]: v, manuel: champ === 'action' ? true : champ === 'cle' ? false : r.manuel, ...(champ === 'action' ? { raison: v === 'ignorer' ? '' : r.raison } : {}) }));
  // listes de produits : les candidats reconnus d'abord (avec leur score), puis tous les intrants et produits d'hygiène
  const tous = useMemo(() => [...(db.produits || []).slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map((p) => ({ value: `produit:${p.id}`, label: `${p.nom}${p.actif === false ? ' (inactif)' : ''}` })),
    ...hygListe(db).filter((p) => !p.archive).slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map((p) => ({ value: `produitHygiene:${p.id}`, label: `${p.nom} (produit d’hygiène)` }))], [db.produits, db.produitsHygiene]);
  const optionsDe = (r) => { const cs = r.cands.map((c) => ({ value: `${c.type}:${c.id}`, label: `${c.nom}${c.type === 'produitHygiene' ? ' (hygiène)' : ''} — reconnu à ${Math.round(c.score * 100)} %` })); const vus = new Set(cs.map((x) => x.value)); return [...cs, ...tous.filter((x) => !vus.has(x.value)), { value: 'nouveau', label: `➕ Nouveau produit : « ${r.nom || 'à nommer'} »` }]; };
  const A = iaActive(); const pretes = rows.filter((r) => r.etat === 'pret'); const enCours = rows.some((r) => r.etat !== 'pret');
  const aIdentifier = pretes.filter((r) => !r.ia && (!r.cle || !r.date || r.genre === 'autre') && r.lu && String(r.lu.extrait || '').trim().length > 40);
  const aCompleter = pretes.filter((r) => !r.iaVals && r.iaInfos !== 'enCours' && texteDe(r).replace(/\s+/g, '').length >= 80);
  const aJoindre = pretes.filter((r) => r.cle && r.action !== 'ignorer' && (r.cle !== 'nouveau' || String(r.nom || '').trim()));
  const identifier = async (liste) => {
    if (!A.pret) { toast('Configurez d’abord l’assistant IA : Paramètres › 🤖 Assistant IA.', 'bad'); return; }
    setIaBusy(true);
    for (const r of liste) {
      if (!vivant.current) break; maj(r.k, { ia: 'enCours' });
      try {
        const P = iaPromptIdentifier(dbR.current, r.lu); const R = await iaDemander(A, { system: P.system, texte: P.texte, max: 500 }); const x = iaLireIdentification(iaJson(R.texte), P.codes);
        if (!x) throw new Error('réponse illisible');
        maj(r.k, (q) => avecAction({ ...q, ia: { confiance: x.confiance, nom: x.nom }, manuel: false,
          genre: x.genre && (!q.genre || q.genre === 'autre') ? x.genre : q.genre, cle: fixe ? q.cle : x.cible && (x.confiance == null || x.confiance >= 0.5) ? ficheCibleCle(x.cible) : q.cle,
          nom: x.nom || q.nom, date: q.date || x.date, version: q.version || x.version }));
      } catch (e) { maj(r.k, { ia: { err: (e && e.message) || String(e) } }); if (e && (e.reseau || e.config || [401, 402, 403, 404].includes(e.statut))) { toast(e.message, 'bad'); break; } }
    }
    setIaBusy(false);
  };
  const joindre = async () => {
    setBusy(true); const pieces = [];
    for (const r of aJoindre) { const id = newDocId(); try { await docPut(id, r.file); pieces.push({ r, meta: { id, nom: r.file.name, mime: r.file.type || r.lu.mime || '', taille: r.file.size } }); } catch (e) { toast('Impossible d’enregistrer les fichiers dans ce navigateur (stockage indisponible ou plein).', 'bad'); pieces.forEach((x) => docDel(x.meta.id).catch(() => { /* ignoré */ })); setBusy(false); return; } }
    // dans l'ordre des dates de révision : la plus récente d'un même produit remplace les précédentes, même déposées ensemble
    pieces.sort((a, b) => `${a.r.cle}|${a.r.genre}|${a.r.date || ''}`.localeCompare(`${b.r.cle}|${b.r.genre}|${b.r.date || ''}`));
    const ignores = []; let bilan = null;
    const res = act((d) => {
      const crees = {}; const B = { joints: 0, remplaces: 0, archives: 0, crees: 0, ignores: 0 };
      for (const { r, meta } of pieces) {
        let c = ficheCibleDeCle(r.cle);
        if (r.cle === 'nouveau') { const key = norm(r.nom).trim(); if (!crees[key]) { const x = ficheProduitCreer(d, { nom: nomProduitCasse(String(r.nom || '').trim()), fabricant: r.lu && r.lu.fabricant, categorie: r.categorie }); if (!x.ok) return x; crees[key] = x.id; if (!x.existant) B.crees += 1; } c = { type: 'produit', id: crees[key] }; }
        const fic = { nom: meta.nom, taille: meta.taille }; const action = r.manuel ? r.action : ficheActionDefaut(d, c, r.genre, r.date, fic).action; // recalculée au fil du dépôt
        if (action === 'ignorer') { ignores.push(meta.id); B.ignores += 1; continue; }
        const avantArch = ficheDocs(d, c.type, c.id, null, true).length;
        const x = ficheJoindre(d, { cible: c, meta, genre: r.genre, date: r.date, version: r.version, action }); if (!x.ok) return x;
        B.joints += 1; if (action === 'archiver') B.archives += 1; else B.remplaces += Math.max(0, ficheDocs(d, c.type, c.id, null, true).length - avantArch);
      }
      // informations cochées reprises sur la fiche du produit (même si le document n'est pas joint : déjà présent)
      B.infos = 0;
      for (const r of rowsR.current) {
        if (r.etat !== 'pret' || !r.cle) continue; const c = r.cle === 'nouveau' ? (crees[norm(r.nom).trim()] ? { type: 'produit', id: crees[norm(r.nom).trim()] } : null) : ficheCibleDeCle(r.cle); if (!c) continue;
        const L = propositions(r, d).filter((x) => coche(r, x)); if (L.length) B.infos += produitInfosAppliquer(d, c, Object.fromEntries(L.map((x) => [x.k, x.v])));
      }
      bilan = B; return okr(B);
    });
    if (!res || !res.ok) { pieces.forEach((x) => docDel(x.meta.id).catch(() => { /* ignoré */ })); setBusy(false); return; }
    ignores.forEach((id) => docDel(id).catch(() => { /* ignoré */ }));
    const B = bilan || {}; toast([`${B.joints} document${B.joints > 1 ? 's' : ''} joint${B.joints > 1 ? 's' : ''}`, B.remplaces ? `${B.remplaces} ancienne${B.remplaces > 1 ? 's' : ''} version${B.remplaces > 1 ? 's' : ''} archivée${B.remplaces > 1 ? 's' : ''}` : '', B.crees ? `${B.crees} produit${B.crees > 1 ? 's' : ''} créé${B.crees > 1 ? 's' : ''}` : '', B.ignores ? `${B.ignores} déjà présent${B.ignores > 1 ? 's' : ''}` : '', B.infos ? `${B.infos} information${B.infos > 1 ? 's' : ''} reprise${B.infos > 1 ? 's' : ''} sur les fiches` : ''].filter(Boolean).join(' · ') + '.');
    setBusy(false); onClose(); if (onFini) onFini(B);
  };
  // « Remplacer » n'est proposé que si le produit a déjà une version en vigueur de ce type de document
  const actionsPour = (r) => { const c = ficheCibleDeCle(r.cle); const n = c ? ficheDocs(db, c.type, c.id, ficheCat(c.type, r.genre)).length : 0; return FICHE_ACTIONS.filter(([v]) => v !== 'remplacer' || n || r.action === 'remplacer').map(([v, l]) => ({ value: v, label: l })); };
  const etatChip = (r) => (r.etat === 'lecture' || r.etat === 'attente' ? <Chip tone="info">{r.etat === 'attente' ? 'en attente' : 'lecture…'}</Chip> : !r.cle ? <Chip tone="warn">produit à choisir</Chip> : r.action === 'ignorer' ? <Chip>non joint</Chip> : r.action === 'remplacer' ? <Chip tone="ok">remplace l’ancienne</Chip> : r.action === 'archiver' ? <Chip>version précédente</Chip> : <Chip tone="ok">à joindre</Chip>);
  const titreFixe = fixe ? (ficheCibleObj(db, fixe) || {}).nom : '';
  return (
    <Sheet wide title={fixe ? `Documents de « ${titreFixe} »` : 'Dépôt de fiches techniques et FDS'} sub={`${rows.length} fichier${rows.length > 1 ? 's' : ''} · ${pretes.length} lu${pretes.length > 1 ? 's' : ''}${enCours ? '…' : ''} — vérifiez le produit, le type et la date de révision avant de joindre`} onClose={onClose}
      footer={<><Btn className="mr-auto" onClick={onClose}>Annuler</Btn>{aIdentifier.length ? <Btn disabled={iaBusy || enCours || busy} onClick={() => identifier(aIdentifier)} title={A.pret ? `Envoie le début du texte des documents non reconnus et la liste de vos produits à ${A.nom}` : 'Assistant IA à configurer (Paramètres › 🤖 Assistant IA)'}>{iaBusy ? '🤖 Identification…' : `🤖 Identifier avec l’IA (${aIdentifier.length})`}</Btn> : null}{A.pret && aCompleter.length ? <Btn disabled={iaBusy || enCours || busy} onClick={() => completer(aCompleter.map((r) => r.k))} title={`Envoie le texte des documents et le nom des produits à ${A.nom}`} data-completer-ia="">{iaBusy ? '🤖 Lecture en cours…' : `🤖 Compléter les fiches avec l’IA (${aCompleter.length})`}</Btn> : null}<Btn kind="primary" disabled={busy || enCours || (!aJoindre.length && !rows.some((r) => r.etat === 'pret' && nInfos(r)))} onClick={joindre}>{busy ? 'Enregistrement…' : !aJoindre.length && rows.some((r) => r.etat === 'pret' && nInfos(r)) ? 'Reprendre les informations' : `Joindre ${aJoindre.length} document${aJoindre.length > 1 ? 's' : ''}`}</Btn></>}>
      {aIdentifier.length && !A.pret && !enCours ? <div className="mb-3"><Notice tone="info" title={`${aIdentifier.length} document${aIdentifier.length > 1 ? 's' : ''} sans produit ou sans date reconnus`}>Choisissez-les à la main, ou laissez une IA les identifier avec votre propre compte (Claude, ChatGPT, Gemini, Mistral…). <button type="button" className="linkish" onClick={() => { onClose(); setTab('params', 'ia'); }}>Configurer l’assistant IA…</button></Notice></div> : null}
      <div className="space-y-2" data-fiches-depot="">
        {rows.map((r) => (
          <div key={r.k} className="card p-3" data-fiche-depot={r.file.name}>
            <div className="flex flex-wrap items-center gap-2"><span aria-hidden="true">{docIcon(r.file.type || (/\.pdf$/i.test(r.file.name) ? 'application/pdf' : ''))}</span><b className="min-w-0 break-all">{r.file.name}</b><span className="text-xs text-ink2">{fmtSize(r.file.size)}{r.lu && r.lu.nbPages ? ` · ${r.lu.nbPages} p.` : ''}</span>{r.lu && r.lu.ocr ? <Chip tone="warn" title="Texte reconnu sur l’image : vérifiez">scan</Chip> : null}<span className="ml-auto">{etatChip(r)}</span></div>
            {r.etat !== 'pret' ? <div className="mt-1 text-sm text-ink2">{r.etape || 'En attente…'}</div> : (<>
              <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,180px),1fr))' }}>
                <Field label="Document"><SI plain value={r.genre} onChange={(v) => choisir(r.k, 'genre', v)} options={FICHE_GENRES.map(([v, l]) => ({ value: v, label: l }))} aria-label={`Type de document — ${r.file.name}`} /></Field>
                {fixe ? null : <Field label={r.cands[0] && r.cle === `${r.cands[0].type}:${r.cands[0].id}` ? `Produit (reconnu à ${Math.round(r.cands[0].score * 100)} %)` : 'Produit'} className="sm:col-span-2"><SI value={r.cle} onChange={(v) => choisir(r.k, 'cle', v)} options={optionsDe(r)} placeholder="— Choisir le produit —" aria-label={`Produit — ${r.file.name}`} /></Field>}
                {r.cle === 'nouveau' ? <Field label="Nom du produit à créer"><TI value={r.nom} onChange={(v) => maj(r.k, { nom: v })} aria-label={`Nom du nouveau produit — ${r.file.name}`} /></Field> : null}
                <Field label="Date de révision"><DI value={r.date} onChange={(v) => choisir(r.k, 'date', v)} aria-label={`Date de révision — ${r.file.name}`} /></Field>
                <Field label="Version"><TI value={r.version} onChange={(v) => maj(r.k, { version: v })} placeholder="—" aria-label={`Version — ${r.file.name}`} /></Field>
                <Field label="Action" className="sm:col-span-2"><SI plain value={r.action || 'ignorer'} onChange={(v) => choisir(r.k, 'action', v)} options={actionsPour(r)} aria-label={`Action — ${r.file.name}`} /></Field>
              </div>
              {r.raison || r.err ? <div className={cx('help mt-1', (r.alerte || r.err) && 'text-warn')}>{[r.err, r.raison].filter(Boolean).join(' · ')}</div> : null}
              {r.lu && (r.lu.nom || r.lu.fabricant) && !fixe ? <div className="mt-1 text-xs text-ink2">Lu : {[r.lu.nom ? `« ${r.lu.nom} »` : '', r.lu.fabricant].filter(Boolean).join(' · ')}</div> : null}
              <FicheInfos r={r} props={propositions(r)} coche={(x) => coche(r, x)} onCoche={(x, v) => maj(r.k, (q) => ({ choix: { ...q.choix, [x.k]: v } }))} ia={A.nom} />
              {r.ia === 'enCours' ? <div className="mt-1 text-xs text-accent">🤖 Identification en cours…</div> : r.ia && r.ia.err ? <div className="mt-1 text-xs text-bad">🤖 {r.ia.err}</div> : r.ia ? <div className="mt-1 text-xs text-accent">🤖 Identifié par {A.nom}{r.ia.confiance != null ? ` (confiance ${Math.round(r.ia.confiance * 100)} %)` : ''}{r.ia.nom ? ` : « ${r.ia.nom} »` : ''} — à vérifier</div> : null}
            </>)}
          </div>))}
      </div>
    </Sheet>
  );
}

/* ---------- veille en ligne : une demande à l'IA par produit, résultat rangé sur le produit ---------- */
function useVeille() {
  const { db, act, toast } = useApp(); const dbR = useRef(db); dbR.current = db; const [etat, setEtat] = useState(null); const ctrl = useRef(null);
  const lancer = async (ids) => {
    const c = iaActive(); if (!c.pret) { toast('Configurez d’abord l’assistant IA : Paramètres › 🤖 Assistant IA.', 'bad'); return null; }
    const ab = typeof AbortController !== 'undefined' ? new AbortController() : null; ctrl.current = ab;
    const B = { total: ids.length, fait: 0, nouvelles: 0, trouves: 0, erreurs: [], courant: '', fin: false, service: c.nom }; setEtat({ ...B });
    for (const id of ids) {
      if (ab && ab.signal.aborted) break; const p = (dbR.current.produits || []).find((x) => x.id === id); const P = iaPromptVeille(dbR.current, id); if (!p || !P) { B.fait += 1; continue; }
      B.courant = p.nom; setEtat({ ...B });
      try {
        const R = await iaDemander(c, { ...P, signal: ab ? ab.signal : undefined }); const v = iaLireVeille(iaJson(R.texte), R.sources, c);
        if (prodVeilleEtat(dbR.current, { ...p, veille: v }).k === 'nouvelle') B.nouvelles += 1; if (v.trouve) B.trouves += 1;
        act((d) => prodVeilleEnregistrer(d, id, v));
      } catch (e) { if (e && e.arret) break; B.erreurs.push({ id, nom: p.nom, msg: (e && e.message) || String(e) }); if (e && (e.reseau || e.config || [401, 402, 403, 404].includes(e.statut))) { B.bloque = e.message; B.fait += 1; break; } }
      B.fait += 1; setEtat({ ...B });
    }
    B.fin = true; B.courant = ''; setEtat({ ...B }); ctrl.current = null; return B;
  };
  return { etat, lancer, arreter: () => { if (ctrl.current) ctrl.current.abort(); }, fermer: () => setEtat(null), enCours: !!etat && !etat.fin };
}
function VeilleProgres({ v }) {
  const { etat, arreter, fermer } = v; if (!etat) return null;
  if (!etat.fin) return <Notice tone="info" title={`🔎 Vérification en ligne avec ${etat.service} : ${etat.fait} / ${etat.total}`}><div className="flex flex-wrap items-center gap-2"><span>{etat.courant ? `« ${etat.courant} »…` : '…'} (jusqu’à une minute par produit)</span><Btn size="sm" onClick={arreter}>Arrêter</Btn></div></Notice>;
  return <Notice tone={etat.bloque ? 'bad' : etat.nouvelles ? 'warn' : 'ok'} title={etat.bloque ? 'Vérification interrompue' : `Vérification terminée : ${etat.fait} produit${etat.fait > 1 ? 's' : ''}`}>
    <div className="flex flex-wrap items-center gap-2"><span>{etat.bloque || [`${etat.trouves} avec des documents trouvés en ligne`, etat.nouvelles ? `${etat.nouvelles} nouvelle${etat.nouvelles > 1 ? 's' : ''} version${etat.nouvelles > 1 ? 's' : ''} à télécharger (colonne « En ligne »)` : 'aucune version plus récente que les vôtres', etat.erreurs.length ? `${etat.erreurs.length} erreur${etat.erreurs.length > 1 ? 's' : ''} : ${etat.erreurs.slice(0, 2).map((e) => `${e.nom} (${e.msg})`).join(' ; ')}` : ''].filter(Boolean).join(' · ')}</span><Btn size="sm" onClick={fermer}>Fermer</Btn></div></Notice>;
}
const FdsChipProd = ({ p }) => { const { db } = useApp(); const e = prodFdsEtat(db, p); return <Chip tone={e.tone || undefined} title={e.n ? `${e.n} FDS en vigueur jointe${e.n > 1 ? 's' : ''}` : e.k === 'sansobjet' ? '' : 'Joignez la fiche de données de sécurité du fournisseur'}>{e.label}</Chip>; };
function VeilleChip({ p, onClick }) {
  const { db } = useApp(); const e = prodVeilleEtat(db, p);
  return <button type="button" className={cx('chip', e.tone && `chip-${e.tone}`)} onClick={onClick} title={p.veille ? `Dernière vérification en ligne le ${fmtDate(p.veille.date)} — voir le résultat` : 'Vérifier en ligne les dernières FT et FDS'} data-veille={e.k}>{e.k === 'nouvelle' ? '⚠ ' : e.k === 'ajour' ? '✓ ' : ''}{e.label}</button>;
}
const LienProduit = ({ url, court }) => (lienNorm(url) ? <a className="linkish" href={lienNorm(url)} target="_blank" rel="noopener noreferrer" title={lienNorm(url)}>🔗 {court ? lienCourt(url) : 'Ouvrir'}</a> : null);

// résultat de la dernière vérification d'un produit, nouvelle vérification, dépôt du document téléchargé
function VeilleSheet({ id, onClose }) {
  const { db, act, setTab } = useApp(); const p = (db.produits || []).find((x) => x.id === id); const V = useVeille(); const [depot, setDepot] = useState(null); const A = iaActive();
  if (!p) return null;
  const v = p.veille || null; const e = prodVeilleEtat(db, p); const fo = ficheFournisseur(db, { type: 'produit', id }, p); const fd = prodFdsDate(db, p); const td = prodFtDate(db, p);
  const ligne = (lab, url0, ok, extra) => { const url = lienNorm(url0); return (<><dt>{lab}</dt><dd>{url ? <span className="inline-flex flex-wrap items-center gap-2"><a className="linkish break-all" href={url} target="_blank" rel="noopener noreferrer">{lienCourt(url)}</a>{ok ? <Chip tone="ok" title="Adresse vue dans les résultats de recherche ou les pages consultées">✓ vue</Chip> : <Chip tone="warn" title="Adresse donnée par l’IA sans être vue dans ses sources : vérifiez-la">à vérifier</Chip>}{extra}</span> : <span className="text-ink2">non trouvée</span>}</dd></>); }; // adresses toujours revérifiées (base importée ou synchronisée)
  const cmp = (date, cur) => (!date ? null : !cur ? <Chip tone="warn">vous n’en avez pas</Chip> : date > cur ? <Chip tone="warn">plus récente que la vôtre ({fmtDate(cur)})</Chip> : date === cur ? <Chip tone="ok">identique à la vôtre</Chip> : <Chip>la vôtre est plus récente</Chip>);
  return (
    <Sheet wide title={`En ligne — ${p.nom}`} sub={[fo, p.reference ? `réf. ${p.reference}` : ''].filter(Boolean).join(' · ') || 'Dernières fiches techniques et FDS du fournisseur'} onClose={onClose}
      footer={<><Btn className="mr-auto" onClick={onClose}>Fermer</Btn>{A.pret ? <Btn kind="primary" disabled={V.enCours} onClick={() => V.lancer([p.id])}>{V.enCours ? '🔎 Vérification…' : v ? '🔎 Vérifier à nouveau' : `🔎 Vérifier en ligne avec ${A.nom}`}</Btn> : <Btn kind="primary" onClick={() => { onClose(); setTab('params', 'ia'); }}>Configurer l’assistant IA…</Btn>}</>}>
      {V.etat ? <div className="mb-3"><VeilleProgres v={V} /></div> : null}
      {v ? (<div className="card p-4" data-veille-resultat="">
        <div className="mb-2 flex flex-wrap items-center gap-2"><Chip tone={e.tone || undefined}>{e.label}</Chip><span className="text-xs text-ink2">vérifié le {fmtDate(v.date)}{v.service ? ` avec ${iaFournisseur(v.service).court}${v.modele ? ` (${v.modele})` : ''}` : ''}</span></div>
        <dl className="kv">
          {ligne('Page du produit', v.page, v.verifie && v.verifie.page, v.page && lienNorm(p.lien) !== v.page ? <Btn size="sm" onClick={() => act((d) => produitSave(d, { ...d.produits.find((x) => x.id === p.id), lien: v.page }, p.id), 'Lien du produit enregistré.')}>En faire le lien du produit</Btn> : v.page ? <Chip>lien du produit</Chip> : null)}
          {ligne('FDS en ligne', v.fds && v.fds.url, v.verifie && v.verifie.fds, <>{v.fds && v.fds.date ? <span className="text-sm">révision du {fmtDate(v.fds.date)}{v.fds.version ? `, version ${v.fds.version}` : ''}</span> : null}{cmp(v.fds && v.fds.date, fd)}</>)}
          {ligne('Fiche technique', v.ft && v.ft.url, v.verifie && v.verifie.ft, <>{v.ft && v.ft.date ? <span className="text-sm">du {fmtDate(v.ft.date)}</span> : null}{cmp(v.ft && v.ft.date, td)}</>)}
          {v.fabricant ? <><dt>Fabricant</dt><dd>{v.fabricant}</dd></> : null}
          {v.remarque ? <><dt>Remarque</dt><dd>{v.remarque}</dd></> : null}
        </dl>
        {(v.sources || []).filter((s) => s && lienNorm(s.url)).length ? <details className="mt-2 text-sm"><summary className="cursor-pointer text-ink2">Sources consultées ({v.sources.filter((s) => s && lienNorm(s.url)).length})</summary><ul className="mt-1 space-y-0.5">{v.sources.filter((s) => s && lienNorm(s.url)).map((s) => <li key={s.url}><a className="linkish break-all" href={lienNorm(s.url)} target="_blank" rel="noopener noreferrer">{String(s.titre || '') || lienCourt(s.url)}</a></li>)}</ul></details> : null}
        <p className="help mt-2">Les adresses viennent de l’IA : ouvrez-les, téléchargez le PDF chez le fournisseur, puis déposez-le ci-dessous (il remplacera l’ancienne version, archivée).</p>
      </div>) : <Empty>Pas encore vérifié en ligne.{A.pret ? ` « Vérifier en ligne » demande à ${A.nom} de chercher la page du produit, la dernière FDS et la dernière fiche technique.` : ' Configurez l’assistant IA (votre propre compte Claude, ChatGPT, Gemini, Mistral…) pour chercher automatiquement les dernières versions, ou cherchez vous-même ci-dessous.'}</Empty>}
      <div className="mt-3"><ZoneDepot onFiles={setDepot} accept={FICHES_ACCEPT} icon="📄" kind="primary" label="Déposer la FDS ou la fiche technique téléchargée" sub="lue, datée et rangée ; l’ancienne version est archivée" inputLabel={`Documents de ${p.nom}`} /></div>
      <div className="mt-3 flex flex-wrap gap-3 text-sm"><span className="text-ink2">Chercher sur le web :</span><a className="linkish" href={rechercheWeb(`${p.nom} ${fo} fiche de données de sécurité FDS pdf`)} target="_blank" rel="noopener noreferrer">🌐 FDS</a><a className="linkish" href={rechercheWeb(`${p.nom} ${fo} fiche technique pdf`)} target="_blank" rel="noopener noreferrer">🌐 fiche technique</a>{lienNorm(p.lien) ? <LienProduit url={p.lien} /> : null}</div>
      {depot ? <FichesDepot fichiers={depot} cible={{ type: 'produit', id: p.id }} onClose={() => setDepot(null)} /> : null}
    </Sheet>
  );
}

/* ---------- onglet Intrants › Fiches FT & FDS ---------- */
const FICHES_FILTRES = [['revoir', 'À revoir'], ['tous', 'Tous les intrants'], ['manquante', 'FDS manquante'], ['ancienne', `FDS de plus de ${PROD_FDS_ANS} ans`], ['nouvelle', 'Nouvelle version en ligne'], ['sansft', 'Sans fiche technique'], ['sanslien', 'Sans lien fournisseur'], ['jamais', 'Jamais vérifiés en ligne']];
function IntrantsFichesView() {
  const { db, confirm, setTab } = useApp(); const [q, setQ] = useState(''); const [cat, setCat] = useState(''); const [filtre, setFiltre] = useState('tous'); const [inactifs, setInactifs] = useState(false);
  const [depot, setDepot] = useState(null); const [form, setForm] = useState(null); const [voir, setVoir] = useState(null); const dossierRef = useRef(null); const V = useVeille(); const A = iaActive();
  const R = prodFichesResume(db); const fo = (p) => ficheFournisseur(db, { type: 'produit', id: p.id }, p);
  const passe = (p) => { const e = prodFdsEtat(db, p); const v = prodVeilleEtat(db, p);
    return filtre === 'tous' ? true : filtre === 'revoir' ? prodARevoir(db, p) : filtre === 'manquante' || filtre === 'ancienne' ? e.k === filtre : filtre === 'nouvelle' ? v.k === 'nouvelle' : filtre === 'sansft' ? p.categorie !== 'sec' && !prodDocs(db, p.id, 'ft').length : filtre === 'sanslien' ? !lienNorm(p.lien) : filtre === 'jamais' ? v.k === 'jamais' && p.categorie !== 'sec' : true; };
  const rows = (db.produits || []).filter((p) => (inactifs || p.actif !== false) && (!cat || p.categorie === cat) && (!q || norm(`${p.nom} ${p.reference || ''} ${fo(p)}`).includes(norm(q))) && passe(p)).slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const aVerifier = rows.filter((p) => p.categorie !== 'sec');
  const verifier = async () => {
    if (!A.pret) { setTab('params', 'ia'); return; } if (!aVerifier.length) return;
    if (aVerifier.length > 1 && !(await confirm({ title: `Vérifier en ligne ${aVerifier.length} produit${aVerifier.length > 1 ? 's' : ''} ?`, body: `${A.nom} cherche, pour chaque produit, sa page chez le fournisseur, la dernière FDS et la dernière fiche technique (nom du produit, fournisseur, référence et dates de vos fiches sont envoyés). Une demande par produit, facturée sur votre compte ${A.nom}, recherche web comprise. Comptez jusqu’à une minute par produit.`, ok: 'Vérifier' }))) return;
    V.lancer(aVerifier.map((p) => p.id));
  };
  const choisirDossier = (ev) => { const fs = Array.from(ev.target.files || []).filter((f) => fichierAccepte(f, FICHES_ACCEPT) && !/^\./.test(f.name)); ev.target.value = ''; if (fs.length) setDepot(fs.slice(0, 300)); };
  return (
    <div>
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label="FDS manquantes" value={fmt(R.manquantes)} tone={R.manquantes ? 'bad' : 'ok'} sub={`sur ${fmt(R.suivis)} intrants concernés`} />
        <Kpi label={`FDS de plus de ${PROD_FDS_ANS} ans`} value={fmt(R.anciennes)} tone={R.anciennes ? 'warn' : undefined} sub="demandez la dernière version" />
        <Kpi label="Nouvelles versions en ligne" value={fmt(R.nouvelles)} tone={R.nouvelles ? 'warn' : undefined} sub={A.pret ? `veille avec ${A.nom}` : 'assistant IA à configurer'} />
        <Kpi label="Fiches techniques" value={`${fmt(R.ft)} / ${fmt(R.n)}`} sub="intrants avec FT jointe" />
        <Kpi label="Liens fournisseur" value={`${fmt(R.liens)} / ${fmt(R.n)}`} sub="page du produit en ligne" />
      </div>
      <div className="mb-3 flex flex-wrap items-stretch gap-2">
        <div className="min-w-0 flex-1"><ZoneDepot onFiles={setDepot} accept={FICHES_ACCEPT} dossiers icon="📚" kind="primary" label="Déposer des FT et FDS (plusieurs fichiers ou un dossier)" sub="chaque document est lu, rattaché au bon produit et daté ; une version plus récente archive l’ancienne" inputLabel="Fiches techniques et FDS à déposer" /></div>
        <Btn onClick={() => dossierRef.current && dossierRef.current.click()} title="Choisir un dossier entier (sous-dossiers compris)">📁 Choisir un dossier</Btn>
        <input ref={dossierRef} type="file" hidden multiple webkitdirectory="" directory="" onChange={choisirDossier} aria-label="Dossier de fiches à déposer" />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <TI value={q} onChange={setQ} placeholder="Rechercher un produit, une référence…" style={{ width: 240 }} aria-label="Rechercher un intrant" />
        <SI plain value={filtre} onChange={setFiltre} style={{ width: 'auto' }} options={FICHES_FILTRES.map(([v, l]) => ({ value: v, label: l }))} aria-label="Filtre des fiches" />
        <SI value={cat} onChange={setCat} placeholder="Toutes catégories" style={{ width: 'auto' }} options={Object.keys(CATEGORIES).map((k) => ({ value: k, label: CATEGORIES[k] }))} aria-label="Catégorie d’intrant" />
        <Check checked={inactifs} onChange={setInactifs} label="Inactifs" />
        <span className="ml-auto" />
        <Btn kind={A.pret ? 'primary' : undefined} disabled={V.enCours || (A.pret && !aVerifier.length)} onClick={verifier} title={A.pret ? `Chercher en ligne, avec ${A.nom}, les dernières FT et FDS des produits affichés` : 'Configurer l’assistant IA (votre propre clé)'}>{A.pret ? `🔎 Vérifier en ligne (${aVerifier.length})` : '🤖 Configurer l’assistant IA…'}</Btn>
      </div>
      {V.etat ? <div className="mb-3"><VeilleProgres v={V} /></div> : null}
      <div className="hidden md:block"><Tbl rows={rows} empty={filtre === 'revoir' ? 'Rien à revoir : toutes les FDS sont jointes et récentes.' : 'Aucun intrant ne correspond.'} cols={[
        { h: 'Produit', r: (p) => <div><button type="button" className="linkish text-left font-semibold" onClick={() => setForm(p.id)}>{p.nom}</button>{p.actif === false ? <Chip className="ml-1">inactif</Chip> : null}<div className="text-xs text-ink2">{[CATEGORIES[p.categorie], fo(p), p.reference ? `réf. ${p.reference}` : ''].filter(Boolean).join(' · ')}</div></div> },
        { h: 'Lien fournisseur', r: (p) => (lienNorm(p.lien) ? <LienProduit url={p.lien} court /> : <button type="button" className="linkish text-xs text-ink2" onClick={() => setForm(p.id)}>+ ajouter</button>) },
        { h: 'FDS', r: (p) => <FdsChipProd p={p} /> },
        { h: 'Fiche technique', r: (p) => { const e = prodFtEtat(db, p); return p.categorie === 'sec' && !e.n ? <span className="text-xs text-ink2">—</span> : <span className={cx('text-sm', !e.n && 'text-ink2')}>{e.label}</span>; } },
        { h: 'En ligne', r: (p) => (p.categorie === 'sec' && !p.veille ? <span className="text-xs text-ink2">—</span> : <VeilleChip p={p} onClick={() => setVoir(p.id)} />) },
        { h: 'Docs', r: (p) => <DocsButton cible={{ type: 'produit', id: p.id }} kind="produit" title={p.nom} /> },
        { h: '', r: (p) => <Btn size="sm" onClick={() => setForm(p.id)}>Modifier</Btn> }]} /></div>
      <div className="space-y-2 md:hidden">{rows.map((p) => (
        <div key={p.id} className="card p-3" data-fiche-produit={p.nom}>
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><b>{p.nom}</b><div className="text-xs text-ink2">{[fo(p), p.reference ? `réf. ${p.reference}` : ''].filter(Boolean).join(' · ') || CATEGORIES[p.categorie]}</div></div><Btn size="sm" onClick={() => setForm(p.id)}>Modifier</Btn></div>
          <div className="mt-2 flex flex-wrap items-center gap-2"><FdsChipProd p={p} />{p.categorie !== 'sec' ? <span className="text-xs text-ink2">{prodFtEtat(db, p).label}</span> : null}{p.categorie !== 'sec' || p.veille ? <VeilleChip p={p} onClick={() => setVoir(p.id)} /> : null}<span className="ml-auto flex items-center gap-2"><LienProduit url={p.lien} /><DocsButton cible={{ type: 'produit', id: p.id }} kind="produit" title={p.nom} /></span></div>
        </div>))}{!rows.length ? <Empty>{filtre === 'revoir' ? 'Rien à revoir.' : 'Aucun intrant ne correspond.'}</Empty> : null}</div>
      <p className="help mt-3">Le fournisseur doit vous remettre la fiche de données de sécurité (FDS) de chaque produit dangereux, et vous envoyer gratuitement toute nouvelle version (règlement REACH, art. 31) : elle doit être à disposition des personnes qui utilisent le produit. Œnotrack signale les FDS manquantes et celles révisées il y a plus de {PROD_FDS_ANS} ans. Matières sèches : sans objet. Un produit non classé dangereux sans FDS : cochez « FDS non requise » sur sa fiche.</p>
      {depot ? <FichesDepot fichiers={depot} onClose={() => setDepot(null)} /> : null}
      {form ? <ProduitForm id={form} onClose={() => setForm(null)} /> : null}
      {voir ? <VeilleSheet id={voir} onClose={() => setVoir(null)} /> : null}
    </div>
  );
}

/* ---------- veille automatique (réglage de l'assistant IA, sur cet appareil) : une fois par jour, 5 produits au plus ---------- */
function VeilleAuto() {
  const { db, uid, act, toast } = useApp(); const dbR = useRef(db); dbR.current = db; const fait = useRef(false);
  useEffect(() => {
    if (fait.current) return undefined; fait.current = true;
    const c = iaActive(); if (!c.pret || !c.auto) return undefined;
    const t0 = todayISO(); let dern = ''; try { dern = window.localStorage.getItem(IA_AUTO_KEY) || ''; } catch (e) { return undefined; } if (dern === t0) return undefined;
    let peut = true; try { peut = peutModule(dbR.current, uid, 'intrants', 'ecriture'); } catch (e) { peut = false; } if (!peut) return undefined;
    const ids = iaVeilleAFaire(dbR.current, c.autoJours, t0, 5); if (!ids.length) return undefined;
    const minuterie = setTimeout(async () => {
      try { window.localStorage.setItem(IA_AUTO_KEY, t0); } catch (e) { /* ignoré */ }
      let nouv = 0;
      for (const id of ids) {
        const P = iaPromptVeille(dbR.current, id); if (!P) continue;
        try { const R = await iaDemander(c, P); const v = iaLireVeille(iaJson(R.texte), R.sources, c); const p = (dbR.current.produits || []).find((x) => x.id === id); if (p && prodVeilleEtat(dbR.current, { ...p, veille: v }).k === 'nouvelle') nouv += 1; act((d) => prodVeilleEnregistrer(d, id, v)); } catch (e) { break; }
      }
      if (nouv) toast(`Veille FT / FDS : ${nouv} nouvelle${nouv > 1 ? 's' : ''} version${nouv > 1 ? 's' : ''} repérée${nouv > 1 ? 's' : ''} en ligne (Intrants › Fiches FT & FDS).`);
    }, 15000);
    return () => clearTimeout(minuterie);
  }, []);
  return null;
}
