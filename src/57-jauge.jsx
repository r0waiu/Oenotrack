/* ============ JAUGEAGE : import des tables d'épalement, vérification, calculs hauteur ⇄ volume (0.17.0-alpha.1) ============
   Lecture dans le navigateur : PDF « texte » et PDF déjà reconnus (Adobe Scan…) par pdf.js ; scans et photos par la reconnaissance
   de caractères (Tesseract), après effacement des traits du tableau ; tableurs (Excel, CSV) et tableaux collés.
   Le moteur (15-baremes.js) comprend le tableau, corrige les valeurs mal lues et contrôle le tout ; l'utilisateur vérifie avant d'enregistrer. */
// 0.38.0-alpha.1 : bibliothèques vérifiées (16r-bibliotheques.js) — sur le site, copiées dans vendor/ ; fichier seul : CDN, empreintes contrôlées
const PDFJS_BASE = bibPdfjsBase(); // décodeurs des images scannées (JBIG2, JPEG 2000) et polices standard
const JAUGE_ACCEPT = '.pdf,application/pdf,image/*,.xlsx,.xls,.ods,.csv,.txt,.json,text/csv,text/plain,application/json';
let _pdfjsP = null;
// pdf.js (module) ; son « worker » est chargé dans la page même : rien à autoriser de plus que le script
function chargerPdfjs() {
  if (_pdfjsP) return _pdfjsP;
  _pdfjsP = (async () => {
    const m = await bibModule('pdfjs'); const L = m && m.getDocument ? m : (m && m.default) || m;
    const wurl = await bibModuleUrl('pdfjsWorker'); // octets vérifiés (fichier seul) ou fichier du site
    try { await import(/* webpackIgnore: true */ wurl); } catch (e) { /* le worker classique prendra le relais */ }
    try { L.GlobalWorkerOptions.workerSrc = wurl; } catch (e) { /* ignoré */ }
    return L;
  })();
  _pdfjsP.catch(() => { _pdfjsP = null; });
  return _pdfjsP;
}
let _tessP = null;
function chargerTesseract() {
  if (window.Tesseract && window.Tesseract.createWorker) return Promise.resolve(window.Tesseract);
  if (!_tessP) _tessP = bibScript('tesseract').then(() => { if (!window.Tesseract || !window.Tesseract.createWorker) throw new Error('module incomplet'); return window.Tesseract; });
  _tessP.catch(() => { _tessP = null; });
  return _tessP;
}
// ouverture d'un PDF (0.38.0-alpha.3 : réglages communs aux cinq lectures de PDF) ; fn(doc) puis doc.destroy() dans tous les cas :
// la mémoire du document (et du worker) est rendue même si la lecture échoue
async function pdfAvecDocument(file, fn) {
  const L = await chargerPdfjs();
  const doc = await L.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false, wasmUrl: `${PDFJS_BASE}wasm/`, standardFontDataUrl: `${PDFJS_BASE}standard_fonts/`, cMapUrl: `${PDFJS_BASE}cmaps/`, cMapPacked: true }).promise;
  try { return await fn(doc); } finally { try { doc.destroy(); } catch (e) { /* ignoré */ } }
}
// texte positionné d'une page PDF (unités de la page, origine en haut à gauche)
async function pdfPageItems(page) {
  const vp = page.getViewport({ scale: 1 }); const tc = await page.getTextContent();
  const items = tc.items.filter((it) => it.str && it.str.trim()).map((it) => { const [a, b, c, d, e, f] = it.transform; const [x, y] = vp.convertToViewportPoint(e, f); return { s: it.str, x, y, w: it.width, h: Math.hypot(c, d) || Math.hypot(a, b) }; });
  return { w: vp.width, h: vp.height, items };
}
// scan : niveaux de gris, seuil, traits du tableau effacés (longs traits horizontaux et verticaux) → texte noir sur blanc
function nettoyerScan(canvas) {
  const W = canvas.width, H = canvas.height; const ctx = canvas.getContext('2d', { willReadFrequently: true }); const img = ctx.getImageData(0, 0, W, H); const d = img.data;
  const encre = new Uint8Array(W * H); for (let p = 0, i = 0; p < W * H; p += 1, i += 4) encre[p] = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) < 160 ? 1 : 0;
  const trait = new Uint8Array(W * H); const minH = Math.round(W * 0.08), minV = Math.round(H * 0.05);
  for (let y = 0; y < H; y += 1) { const o = y * W; let x = 0; while (x < W) { if (!encre[o + x]) { x += 1; continue; } let e = x; while (e < W && encre[o + e]) e += 1; if (e - x >= minH) for (let k = x; k < e; k += 1) trait[o + k] = 1; x = e; } }
  for (let x = 0; x < W; x += 1) { let y = 0; while (y < H) { if (!encre[y * W + x]) { y += 1; continue; } let e = y; while (e < H && encre[e * W + x]) e += 1; if (e - y >= minV) for (let k = y; k < e; k += 1) trait[k * W + x] = 1; y = e; } }
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const p = y * W + x; let t = 0; for (let dy = -1; dy <= 1 && !t; dy += 1) { const yy = y + dy; if (yy < 0 || yy >= H) continue; for (let dx = -1; dx <= 1; dx += 1) { const xx = x + dx; if (xx >= 0 && xx < W && trait[yy * W + xx]) { t = 1; break; } } }
    const v = encre[p] && !t ? 0 : 255; const i = p * 4; d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0); return canvas;
}
// reconnaissance de caractères d'une image (canvas) → page de texte positionné ; echelle : px → unités de la page
let _tessWorker = null; let _tessLog = null;
async function ocrCanvas(canvas, n, echelle, onLog) {
  const T = await chargerTesseract();
  // sur le site : moteur, « worker » et données de langue copiés dans vendor/ (aucun CDN) ; fichier seul : réglages d'origine de Tesseract
  const L = bibLocal(); const abs = (x) => new URL(`${L}${x}`, document.baseURI).href.replace(/\/$/, '');
  const chemins = L ? { workerPath: abs(BIB_TABLE.tesseractWorker.local), corePath: abs(BIB_DOSSIERS.tesseractCore), langPath: abs(BIB_DOSSIERS.tesseractLangue), workerBlobURL: false } : {};
  // 0.38.0-alpha.3 : le suivi d'avancement suit l'appel en cours (plus celui du premier appel) ; un échec de création ne bloque plus les suivants
  _tessLog = onLog || null;
  if (!_tessWorker) { _tessWorker = T.createWorker('fra', 1, { ...chemins, logger: (m) => { if (_tessLog && m && m.status) _tessLog(m); } }); _tessWorker.catch(() => { _tessWorker = null; }); }
  const w = await _tessWorker; const r = await w.recognize(canvas); const tsv = (r && r.data && r.data.tsv) || '';
  return { ...jaugePageDeTsv(tsv, n, echelle), ocr: true };
}
async function renduPage(page, dpi = 300) {
  const k = dpi / 72; let vp = page.getViewport({ scale: k }); if (vp.height > 3600) vp = page.getViewport({ scale: (k * 3600) / vp.height });
  const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height); const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp, canvas: c }).promise; return { canvas: c, echelle: 1 / (vp.width / page.getViewport({ scale: 1 }).width) };
}
async function imageCanvas(file) {
  const url = URL.createObjectURL(file); try {
    const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image illisible')); im.src = url; });
    const k = Math.min(1, 3600 / Math.max(img.naturalHeight, img.naturalWidth)) || 1; const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height); return c;
  } finally { URL.revokeObjectURL(url); }
}
const estPdf = (f) => /pdf/.test(f.type || '') || /\.pdf$/i.test(f.name || '');
const estImage = (f) => /^image\//.test(f.type || '') || /\.(png|jpe?g|webp|gif|bmp|tiff?)$/i.test(f.name || '');
const estTableur = (f) => /\.(xlsx|xls|ods)$/i.test(f.name || '') || /spreadsheet|excel/.test(f.type || '');
const estJson = (f) => /\.json$/i.test(f.name || '') || /json/.test(f.type || '');

// lecture d'un fichier → { baremes, journal, sansTexte: [pages], doc (pdf.js, pour la reconnaissance), fichier }
async function lireFichierJauge(file, { onEtape, ocr } = {}) {
  const nom = file.name || 'document';
  if (estJson(file)) {
    const txt = await lectureFichier(file); const j = jaugeLireFichier(txt);
    if (!j) throw new Error('Ce fichier JSON n’est pas un fichier de barèmes Œnotrack.');
    return { baremes: j.baremes.map((b) => ({ ...b, meta: { ...(b.meta || {}), fichier: (b.meta || {}).fichier || nom } })), journal: [], sansTexte: [], fichier: nom, prepare: true };
  }
  if (estTableur(file)) {
    if (onEtape) onEtape('Lecture du tableur…'); try { await loadXlsx(); } catch (e) { /* message ci-dessous */ } if (!window.XLSX || !window.XLSX.read) throw new Error('lecture Excel indisponible (bibliothèque non chargée, hors ligne ?) : enregistrez le tableau en CSV ou collez-le');
    const ab = await file.arrayBuffer(); // lecture surveillée (garde des importations) : un classeur piégé ne peut pas modifier le cœur de l'application
    const pages = gardeSurveiller(() => { const wb = window.XLSX.read(ab, { type: 'array' }); return wb.SheetNames.map((sn, i) => jaugePageDeLignes(window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' }), i + 1)); });
    return { ...jaugeAnalyser(pages, { fichier: nom }), sansTexte: [], fichier: nom };
  }
  if (estImage(file)) {
    if (onEtape) onEtape('Préparation de la photo…'); const c = nettoyerScan(await imageCanvas(file));
    if (onEtape) onEtape('Reconnaissance des chiffres (la première fois, le module de lecture se télécharge)…');
    const p = await ocrCanvas(c, 1, 1, (m) => onEtape && m.status === 'recognizing text' && onEtape(`Reconnaissance des chiffres… ${Math.round((m.progress || 0) * 100)} %`));
    return { ...jaugeAnalyser([p], { fichier: nom }), sansTexte: [], fichier: nom, ocr: true };
  }
  if (estPdf(file)) {
    if (onEtape) onEtape('Ouverture du PDF…');
    return pdfAvecDocument(file, async (doc) => {
    const lirePages = async (avecOcr) => {
      const pages = []; const sansTexte = [];
      for (let n = 1; n <= doc.numPages; n += 1) {
        if (onEtape) onEtape(`Lecture de la page ${n} / ${doc.numPages}…`); const pg = await doc.getPage(n); const t = await pdfPageItems(pg);
        const sansCouche = t.items.filter((it) => /[A-Za-z0-9]/.test(it.s)).length < 10; // page scannée sans texte (image seule)
        if (sansCouche && avecOcr) { if (onEtape) onEtape(`Page ${n} / ${doc.numPages} : reconnaissance des chiffres du scan (la première fois, le module de lecture se télécharge)…`); const r = await renduPage(pg); nettoyerScan(r.canvas); pages.push(await ocrCanvas(r.canvas, n, r.echelle)); r.canvas.width = 0; }
        else { if (sansCouche) sansTexte.push(n); pages.push({ n, ...t }); }
      }
      return { pages, sansTexte };
    };
    let L1 = await lirePages(!!ocr);
    if (!ocr && L1.sansTexte.length === doc.numPages) L1 = await lirePages(true); // scan sans aucun texte : lu tout de suite
    return { ...jaugeAnalyser(L1.pages, { fichier: nom }), sansTexte: L1.sansTexte, fichier: nom, nbPages: doc.numPages, ocr: !!ocr || !L1.sansTexte.length };
    });
  }
  const txt = await lectureFichier(file); return { ...jaugeAnalyser([jaugePageDeTexte(txt)], { fichier: nom }), sansTexte: [], fichier: nom };
}

/* ---------- petits éléments ---------- */
const FIAB = { bonne: ['ok', 'lecture sûre'], moyenne: ['warn', 'à vérifier'], faible: ['bad', 'lecture incertaine'] };
const mesureLabel = (b) => (b && b.mesure === 'creux' ? 'Creux' : 'Hauteur');
// courbe volume = f(mesure), avec un point repère
function BaremeCourbe({ b, h, height = 150 }) {
  const P = baremePts(b); if (P.length < 2) return null; const W = 600, H = height, m = { l: 46, r: 10, t: 10, b: 24 };
  const x0 = P[0][0], x1 = P[P.length - 1][0]; const vs = P.map((p) => p[1]); const y0 = Math.min(0, ...vs), y1 = Math.max(...vs) || 1;
  const X = (x) => m.l + ((x - x0) / ((x1 - x0) || 1)) * (W - m.l - m.r); const Y = (y) => H - m.b - ((y - y0) / ((y1 - y0) || 1)) * (H - m.t - m.b);
  const pas = Math.max(1, Math.floor(P.length / 300)); const pts = P.filter((p, i) => i % pas === 0 || i === P.length - 1).map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
  const r = hasNum(h) ? baremeVolume(b, h) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="jg-courbe" role="img" aria-label={`Courbe du barème : de ${fmtL(Math.min(...vs))} à ${fmtL(y1)}`}>
      <line x1={m.l} y1={H - m.b} x2={W - m.r} y2={H - m.b} className="jg-axe" /><line x1={m.l} y1={m.t} x2={m.l} y2={H - m.b} className="jg-axe" />
      <text x={m.l} y={H - 6} className="jg-txt">{fmt(x0, x0 % 1 ? 1 : 0)} cm</text><text x={W - m.r} y={H - 6} className="jg-txt" textAnchor="end">{fmt(x1, x1 % 1 ? 1 : 0)} cm</text>
      <text x={m.l - 4} y={m.t + 8} className="jg-txt" textAnchor="end">{fmtHL(y1)}</text><text x={m.l - 4} y={H - m.b} className="jg-txt" textAnchor="end">{fmtHL(y0)}</text>
      <polyline points={pts} className="jg-ligne" />
      {r && !r.hors ? <><line x1={X(num(h))} y1={H - m.b} x2={X(num(h))} y2={Y(r.v)} className="jg-repere" /><line x1={m.l} y1={Y(r.v)} x2={X(num(h))} y2={Y(r.v)} className="jg-repere" /><circle cx={X(num(h))} cy={Y(r.v)} r="5" className="jg-point" /></> : null}
    </svg>
  );
}
// calculatrice : hauteur ⇄ volume, et volume entre deux hauteurs
function JaugeCalc({ b, volActuel, compact }) {
  const [h, setH] = useState(''); const [v, setV] = useState(''); const [mode, setMode] = useState('niveau'); const [h1, setH1] = useState(''); const [h2, setH2] = useState('');
  const rv = hasNum(h) ? baremeVolume(b, h) : null; const rh = hasNum(v) ? baremeHauteur(b, num(v) * 100) : null; const att = hasNum(volActuel) && volActuel > 0 ? baremeHauteur(b, volActuel) : null;
  const ec = hasNum(h1) && hasNum(h2) ? baremeEcart(b, h1, h2) : null; const M = mesureLabel(b);
  const horsTxt = (r) => (r && r.hors ? <span className="text-warn"> · hors barème ({baremePlage(b)})</span> : null);
  return (
    <div className="space-y-3" data-jauge-calc="">
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Calcul">{[['niveau', `${M} ⇄ volume`], ['ecart', 'Avant / après']].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={mode === k} className={cx('opr-tog', mode === k && 'on')} onClick={() => setMode(k)}>{l}</button>)}</div>
      {mode === 'niveau' ? <div className="jg-calc">
        <Field label={`${M} mesuré${b.mesure === 'creux' ? '' : 'e'} (cm)`}><NI value={h} onChange={(x) => { setH(x); setV(''); }} placeholder="ex. 152,5" aria-label={`${M} en cm`} /></Field>
        <div className="jg-egal" aria-hidden="true">⇄</div>
        <Field label="Volume (hL)"><NI value={v} onChange={(x) => { setV(x); setH(''); }} placeholder="ex. 45,20" aria-label="Volume en hL" /></Field>
        <div className="jg-res" aria-live="polite">{rv ? <><b className="num">{fmtL(rv.v)}</b>{horsTxt(rv)}</> : rh ? <><b className="num">{cmTxt(rh.h)}</b> {b.mesure === 'creux' ? 'de creux' : 'attendus'}{horsTxt(rh)}</> : <span className="text-ink2">Saisissez une mesure ou un volume.</span>}</div>
      </div> : <div className="jg-calc">
        <Field label={`${M} avant (cm)`}><NI value={h1} onChange={setH1} placeholder={att ? fmt(att.h, 1) : 'ex. 20'} aria-label={`${M} avant en cm`} /></Field>
        <div className="jg-egal" aria-hidden="true">→</div>
        <Field label={`${M} après (cm)`}><NI value={h2} onChange={setH2} placeholder="ex. 152,5" aria-label={`${M} après en cm`} /></Field>
        <div className="jg-res" aria-live="polite">{ec ? <><b className="num">{ec.v >= 0 ? '+' : '−'}{fmtL(Math.abs(ec.v))}</b> {ec.v >= 0 ? 'entrés' : 'sortis'}{horsTxt(ec)}</> : <span className="text-ink2">Deux mesures : avant et après le mouvement.</span>}</div>
      </div>}
      {att && !compact ? <p className="help">Contenu actuel {fmtL(volActuel)} → {b.mesure === 'creux' ? 'creux attendu' : 'niveau attendu'} : <b className="num">{cmTxt(att.h)}</b>{att.hors ? ' (hors barème)' : ''}.</p> : null}
      {!compact ? <BaremeCourbe b={b} h={mode === 'niveau' ? (rv ? h : rh ? rh.h : att ? att.h : null) : hasNum(h2) ? h2 : null} /> : null}
    </div>
  );
}
// niveau attendu dans un contenant après un mouvement (aide sous un champ)
function NiveauAttendu({ contId, volL, label }) {
  const { db } = useApp(); const r = contId && hasNum(volL) && num(volL) > 0 ? hauteurAttendue(db, contId, num(volL)) : null; if (!r) return null;
  return <span className="jg-attendu" data-niveau-attendu={contId}>📏 {label || 'Niveau attendu'} : <b className="num">{cmTxt(r.h)}</b>{r.bareme.mesure === 'creux' ? ' de creux' : ''}{r.hors ? ' (hors barème)' : ''}</span>;
}
// champ de volume avec le bouton 📏 (calcul par le barème du contenant)
function VolJauge({ value, onChange, contIds, onJauge, ariaLabel, placeholder, sortieDe }) {
  const { db } = useApp(); const [dlg, setDlg] = useState(false); const ids = (contIds || []).filter(Boolean);
  const avec = (db.baremes || []).some((b) => !b.archive && b.cible !== 'citerne' && b.contenantId);
  return (
    <div className="flex items-center gap-1">
      <VI value={value} onChange={onChange} aria-label={ariaLabel} placeholder={placeholder} />
      {avec ? <button type="button" className="btn btn-sm jg-btn" onClick={() => setDlg(true)} title="Calculer le volume avec le barème de jaugeage (hauteurs mesurées)" aria-label={`Jauger${ariaLabel ? ` : ${ariaLabel}` : ''}`}>📏</button> : null}
      {dlg ? <JaugeDialog contIds={ids} sortieDe={sortieDe} onClose={() => setDlg(false)} onUse={(r) => { onChange(String(Math.round(r.volL))); if (onJauge) onJauge(r); setDlg(false); }} /> : null}
    </div>
  );
}
function JaugeDialog({ contIds, onUse, onClose, sortieDe }) {
  const { db, R } = useApp(); const avec = db.contenants.filter((c) => baremeDe(db, c.id));
  const prem = (contIds || []).find((id) => baremeDe(db, id)) || (avec[0] || {}).id || '';
  const [cid, setCid] = useState(prem); const b = baremeDe(db, cid); const volActuel = (R.contVol || {})[cid] || 0;
  const [mode, setMode] = useState('ecart'); const [h1, setH1] = useState(''); const [h2, setH2] = useState('');
  const att = b && volActuel > 0 ? baremeHauteur(b, volActuel) : null;
  const r = !b ? null : mode === 'niveau' ? (hasNum(h2) ? baremeVolume(b, h2) : null) : (hasNum(h2) && (hasNum(h1) || att || volActuel <= 0) ? (() => { const a = hasNum(h1) ? baremeVolume(b, h1) : { v: att ? volActuel : 0 }; const c = baremeVolume(b, h2); return c ? { v: c.v - a.v, hors: c.hors || a.hors } : null; })() : null);
  const vol = r ? Math.abs(r.v) : null; const M = mesureLabel(b); const sortie = sortieDe ? cid === sortieDe : null;
  const use = () => onUse({ volL: vol, contenantId: cid, baremeId: b.id, mesure: b.mesure, avant: mode === 'ecart' ? (hasNum(h1) ? num(h1) : att ? Math.round(att.h * 10) / 10 : null) : null, apres: num(h2), mode });
  return (
    <Sheet title="📏 Calcul par jaugeage" sub="Volume calculé avec le barème de jaugeage du contenant" onClose={onClose} footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" disabled={!vol} onClick={use}>{vol ? `Utiliser ${fmtL(vol)}` : 'Utiliser'}</Btn></>}>
      <div className="space-y-3" data-jauge-dialog="">
        <Field label="Contenant jaugé"><SI value={cid} onChange={(v) => { setCid(v); setH1(''); setH2(''); }} options={avec.map((c) => ({ value: c.id, label: `${c.nom}${(contIds || []).includes(c.id) ? ' ★' : ''}` }))} aria-label="Contenant jaugé" /></Field>
        {!b ? <Notice tone="info">Aucun contenant n’a encore de barème : importez les tables d’épalement dans Vinification › Cuverie & Lots › 📏 Barèmes de jaugeage.</Notice> : <>
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Méthode">{[['ecart', `${M} avant et après`], ['niveau', `Une seule mesure (volume contenu)`]].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={mode === k} className={cx('opr-tog', mode === k && 'on')} onClick={() => setMode(k)}>{l}</button>)}</div>
          <div className="grid2">
            {mode === 'ecart' ? <Field label={`${M} avant (cm)`} help={att ? `Contenu actuel ${fmtL(volActuel)} ≈ ${cmTxt(att.h)} (laissez vide pour l’utiliser)` : volActuel <= 0 ? 'Contenant vide : laissez vide.' : ''}><NI value={h1} onChange={setH1} placeholder={att ? fmt(att.h, 1) : volActuel <= 0 ? 'vide' : ''} aria-label={`${M} avant`} /></Field> : null}
            <Field label={mode === 'ecart' ? `${M} après (cm)` : `${M} mesuré${b.mesure === 'creux' ? '' : 'e'} (cm)`}><NI value={h2} onChange={setH2} autoFocus aria-label={mode === 'ecart' ? `${M} après` : `${M} mesurée`} /></Field>
          </div>
          <div className="jg-res" aria-live="polite">{r ? <><b className="num">{fmtL(Math.abs(r.v))}</b> {mode === 'ecart' ? (r.v >= 0 ? 'entrés dans le contenant' : 'sortis du contenant') : 'dans le contenant'}{r.hors ? <span className="text-warn"> · mesure hors barème ({baremePlage(b)})</span> : null}{mode === 'ecart' && sortie != null && r.v !== 0 && (r.v < 0) !== !!sortie ? <div className="help">Le sens ne correspond pas au mouvement saisi : vérifiez les mesures.</div> : null}</> : <span className="text-ink2">Saisissez {mode === 'ecart' ? 'la mesure après le mouvement' : 'la mesure'}.</span>}</div>
          <p className="help">Barème : {baremeTexte(b)}.</p>
        </>}
      </div>
    </Sheet>
  );
}
// hauteur (ou creux) mesurée dans la cuve de destination après réception (entrée de moûts, 0.34.0-alpha.1) : le volume reçu se calcule
// d'après la table d'épalement (contenu mesuré − contenu d'avant) ; il reste modifiable à la main
function HauteurCuve({ contId, hauteur, volL, volAvant, onChange, n, j }) {
  const { db } = useApp(); const b = baremeDe(db, contId); if (!b) return null;
  const M = mesureLabel(b); const r = hasNum(hauteur) ? jaugeEntreeCuve(b, hauteur, volAvant) : null; const manuel = r && hasNum(volL) && Math.abs(num(volL) - r.v) > 1;
  return (
    <div className="jg-creux flex flex-wrap items-center gap-2 text-sm" data-hauteur-cuve={`${n}-${j}`}>
      <span className="lbl">📏 {b.mesure === 'creux' ? 'Creux après réception (cm)' : 'Hauteur après réception (cm)'}</span>
      <input className="inp num" style={{ width: 100 }} inputMode="decimal" value={hauteur ?? ''} placeholder="cm" aria-label={`${M} en cuve ${j} du moût ${n} (cm)`} onChange={(e) => { const h = e.target.value; const x = hasNum(h) ? jaugeEntreeCuve(b, h, volAvant) : null; onChange(h, x ? x.v : null); }} />
      {r ? <span data-hauteur-calcul="">{r.avant > 0.5 ? `${fmtL(r.total)} en cuve − ${fmtL(r.avant)} déjà présents = ${fmtL(r.v)} reçus` : `${fmtL(r.total)} en cuve = ${fmtL(r.v)} reçus`}{r.hors ? <span className="text-warn"> · hors barème</span> : null}{r.negatif ? <span className="text-bad"> · mesure inférieure au contenu d’avant</span> : null}
        {manuel ? <> <Chip tone="warn">volume ajusté à la main</Chip> <button type="button" className="linkish" onClick={() => onChange(hauteur, r.v)}>Reprendre le calcul</button></> : null}</span>
        : <span className="text-xs text-ink2">{`Barème ${baremePlage(b)} : le volume se calcule et reste modifiable.`}</span>}
    </div>
  );
}
// creux d'un compartiment de citerne (entrée de moûts)
function CreuxCiterne({ immat, compartiment, creux, onChange, onVolume, n }) {
  const { db } = useApp(); const L = baremesCiterne(db, immat); if (!L.length) return null;
  const b = L.find((x) => String(x.compartiment) === String(compartiment).replace(/^c/i, '').trim()) || (L.length === 1 ? L[0] : null);
  const r = b && hasNum(creux) ? baremeVolume(b, creux) : null;
  return (
    <div className="jg-creux" data-creux-citerne={n}>
      <span className="lbl">📏 Creux mesuré{b ? ` (compartiment ${b.compartiment})` : ''}</span>
      <div className="flex flex-wrap items-center gap-2">
        {!b ? <select className="inp" style={{ width: 'auto' }} value="" onChange={(e) => onChange({ compartiment: e.target.value })} aria-label={`Compartiment du moût ${n}`}><option value="">Compartiment…</option>{L.map((x) => <option key={x.id} value={x.compartiment}>{x.compartiment}</option>)}</select> : null}
        <input className="inp num" style={{ width: 110 }} inputMode="decimal" value={creux ?? ''} onChange={(e) => onChange({ creux: e.target.value })} placeholder="cm" aria-label={`Creux du moût ${n} (cm)`} disabled={!b} />
        {r ? <><b className="num">= {fmtL(r.v)}</b>{r.hors ? <span className="text-xs text-warn">hors barème</span> : null}<Btn size="sm" onClick={() => onVolume(r.v, b)}>Utiliser ce volume</Btn></> : <span className="text-xs text-ink2">{b ? `barème ${baremePlage(b)}` : 'choisissez le compartiment'}</span>}
      </div>
    </div>
  );
}

/* ---------- import : dépôt → lecture → vérification → enregistrement ---------- */
function BaremeImport({ onClose, contIdPreset, fichiers: fichiers0 }) {
  const { db, act, toast } = useApp(); const [etat, setEtat] = useState({ phase: 'depot' }); const [colle, setColle] = useState(''); const [garderDoc, setGarderDoc] = useState(true); const [site, setSite] = useState((db.settings && db.settings.siteActif) || (db.sites[0] || {}).id);
  const fileRef = useRef(null);
  const lire = async (fs, opts = {}) => {
    const out = []; const journal = []; let sansTexte = []; let pdfOcr = null;
    for (const f of fs) {
      try { setEtat({ phase: 'lecture', msg: `« ${f.name} » : lecture…` }); const r = await lireFichierJauge(f, { ocr: opts.ocr, onEtape: (m) => setEtat({ phase: 'lecture', msg: `« ${f.name} » : ${m}` }) });
        r.baremes.forEach((b) => out.push({ ...b, _fichier: f, _cle: `${f.name}|${out.length}` })); (r.journal || []).forEach((j) => journal.push({ ...j, fichier: f.name }));
        if (r.sansTexte && r.sansTexte.length) { sansTexte = [...sansTexte, ...r.sansTexte.map((n) => ({ fichier: f.name, n }))]; pdfOcr = pdfOcr || []; pdfOcr.push(f); }
      } catch (er) { const reseau = !er || !er.message || /fetch|import|module|réseau|network|script|worker/i.test(er.message || ''); journal.push({ fichier: f.name, msg: reseau && (estImage(f) || estPdf(f)) ? 'module de lecture injoignable (connexion internet ? page affichée dans claude.ai ?)' : er.message || 'lecture impossible', grave: true, ocr: estImage(f) || estPdf(f) }); }
    }
    const pris = new Set(); // un contenant reconnu une seule fois par import (deux réservoirs du même nom → le second à créer)
    const props = out.map((b) => { const p = proposition(db, b, contIdPreset && out.length === 1 ? contIdPreset : null); if (p.lien) { if (pris.has(p.lien)) return { ...p, lien: '', creer: true }; pris.add(p.lien); } return p; });
    setEtat({ phase: 'revue', props, journal, sansTexte, pdfOcr, fichiers: fs });
  };
  const deposer = (fs) => lire(fs);
  useEffect(() => { if (fichiers0 && fichiers0.length) lire(fichiers0); }, []); // fichiers déposés sur la page des barèmes
  const dep = useDepot(deposer, { disabled: etat.phase === 'lecture', accept: JAUGE_ACCEPT, refus: 'Déposez un PDF, une photo, un tableur (Excel, CSV) ou un fichier de barèmes.' });
  const lireColle = () => { const r = jaugeAnalyser([jaugePageDeTexte(colle)], { fichier: 'tableau collé' }); setEtat({ phase: 'revue', props: r.baremes.map((b, i) => proposition(db, { ...b, _cle: `colle|${i}` }, contIdPreset)), journal: r.baremes.length ? [] : [{ fichier: 'tableau collé', msg: 'aucun tableau hauteur / volume reconnu', grave: true }], sansTexte: [], fichiers: [] }); };
  const enregistrer = async () => {
    const choisis = etat.props.filter((p) => p.ok); if (!choisis.length) { toast('Cochez au moins un barème à enregistrer.', 'bad'); return; }
    const pb = choisis.find((p) => p.b.cible === 'citerne' ? !immatNorm(p.b.immat) : p.lien === '' && !p.creer); if (pb) { toast(`« ${pb.b.nom} » : ${pb.b.cible === 'citerne' ? 'indiquez l’immatriculation' : 'choisissez le contenant ou « créer »'}.`, 'bad'); return; }
    // documents d'origine : rangés dans ce navigateur (une seule fois par fichier)
    const docs = {}; if (garderDoc) for (const p of choisis) { const f = p.b._fichier; if (!f || docs[f.name] || f.size > DOC_MAX) continue; const id = newDocId(); try { await docPut(id, f); docs[f.name] = { id, nom: f.name, mime: f.type, taille: f.size }; } catch (er) { /* stockage plein : sans document */ } }
    let n = 0, nc = 0;
    const r = act((d) => {
      for (const p of choisis) {
        const { _fichier, _cle, reservoir, compartimentIncertain, fiabilite, ...b } = p.b; let contenantId = '';
        if (b.cible !== 'citerne') {
          if (p.creer) { const m = b.meta || {}; const type = ((d.lists.typesContenant || []).find((t) => t.forme === 'cuve') || d.lists.typesContenant[0] || {}).id; const mat = matierePourBareme(d, m.materiau) || d.lists.matieres[0] || {};
            let nom = String(p.nomCree || reservoir || b.nom || 'Cuve').trim(); let k = 2; while (nameTaken(d.contenants, nom)) { nom = `${String(p.nomCree || reservoir || b.nom).trim()} (${k})`; k += 1; }
            const vmax = Math.max(num(m.capacite) || 0, ...baremePts(b).map((x) => x[1]));
            const rc = contSave(d, { nom, type, matiere: mat.id, annee: '', volMax: Math.round(vmax), statut: 'actif', notes: '', siteId: site, fabricant: m.constructeur && m.constructeur !== '-' ? m.constructeur : '' }); if (!rc.ok) return rc;
            contenantId = d.contenants[d.contenants.length - 1].id; nc += 1;
          } else contenantId = p.lien;
          const c = d.contenants.find((x) => x.id === contenantId); if (c && !c.fabricant && b.meta && b.meta.constructeur && b.meta.constructeur !== '-') c.fabricant = b.meta.constructeur;
        }
        const doc = _fichier && docs[_fichier.name];
        const rb = baremeSave(d, { ...b, contenantId, mesure: p.mesure || b.mesure, docId: doc ? doc.id : undefined, meta: { ...(b.meta || {}), fiabilite } }); if (!rb.ok) return rb; n += 1;
        if (doc && !(d.docs || []).some((x) => x.id === doc.id)) docMetaAdd(d, { ...doc, cat: 'autre', cible: { type: 'bareme', id: rb.id } });
      }
      return okr();
    });
    if (r.ok) { toast(`${n} barème${n > 1 ? 's' : ''} de jaugeage enregistré${n > 1 ? 's' : ''}${nc ? `, ${nc} contenant${nc > 1 ? 's' : ''} créé${nc > 1 ? 's' : ''}` : ''}.`); onClose(); }
    else { Object.values(docs).forEach((x) => docDel(x.id).catch(() => null)); toast(r.msg, 'bad'); }
  };
  const setP = (i, patch) => setEtat((e) => ({ ...e, props: e.props.map((p, k) => (k === i ? { ...p, ...patch } : p)) }));
  // deux tableaux lus séparément réunis en une seule table (0.37.0-alpha.1) : le tableau j complète le tableau i, qui garde son rattachement
  const fusionP = (i, j) => setEtat((e) => { const L = baremesListeFusion(e.props.map((p) => p.b), i, j); if (!L) return e; const ni = i < j ? i : i - 1; return { ...e, props: e.props.filter((p, k) => k !== j).map((p, k) => (k === ni ? { ...p, b: L[ni] } : p)) }; });
  const revue = etat.phase === 'revue'; const nOk = revue ? etat.props.filter((p) => p.ok).length : 0;
  return (
    <Sheet wide title="📏 Importer des barèmes de jaugeage" sub="Tables d’épalement des cuves, certificats de jaugeage des citernes" onClose={onClose}
      footer={revue ? <><Btn onClick={() => setEtat({ phase: 'depot' })} className="mr-auto">← Autre fichier</Btn><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" disabled={!nOk} onClick={enregistrer}>Enregistrer {nOk} barème{nOk > 1 ? 's' : ''}</Btn></> : <Btn onClick={onClose}>Fermer</Btn>}>
      {etat.phase === 'depot' ? (
        <div className="space-y-4" {...dep.props}>
          <ZoneDepot onFiles={deposer} depot={dep} kind="primary" icon="📏" accept={JAUGE_ACCEPT} label="Déposer le cahier d’épalement ou le certificat" sub="PDF, scan, photo, Excel, CSV" inputLabel="Fichiers de barèmes" />
          <p className="help">Œnotrack lit les tableaux (hauteur en cm → volume en litres, volume → hauteur, creux des citernes en mètres), reconnaît le nom de chaque réservoir ou le compartiment de la citerne, le constructeur, la capacité et la date du jaugeage. Vous vérifiez tout avant d’enregistrer.</p>
          <details className="rounded-md border border-line p-3"><summary className="cursor-pointer text-sm font-semibold">Ou coller un tableau (Excel, texte)</summary>
            <div className="mt-2 space-y-2"><TA value={colle} onChange={setColle} rows={6} placeholder={'Hauteur (cm)\tVolume (L)\n1\t97\n2\t103\n…'} aria-label="Tableau collé" /><Btn disabled={!colle.trim()} onClick={lireColle}>Lire le tableau collé</Btn></div></details>
        </div>
      ) : etat.phase === 'lecture' ? (
        <div className="jg-lecture" role="status"><div className="jg-sablier" aria-hidden="true">📏</div><div className="font-semibold">Lecture en cours…</div><div className="text-sm text-ink2">{etat.msg}</div></div>
      ) : (
        <BaremeRevue etat={etat} setP={setP} fusionP={fusionP} site={site} setSite={setSite} garderDoc={garderDoc} setGarderDoc={setGarderDoc} relireOcr={() => lire(etat.fichiers, { ocr: true })} />
      )}
    </Sheet>
  );
}
// proposition d'enregistrement pour un barème lu : contenant reconnu par son nom, sinon à créer
function proposition(db, b, contId) {
  if (b.cible === 'citerne') return { b, ok: b.fiabilite !== 'faible', mesure: b.mesure };
  const c = contId ? db.contenants.find((x) => x.id === contId) : contenantPourReservoir(db, b.reservoir || b.nom);
  return { b, ok: b.fiabilite !== 'faible', lien: c ? c.id : '', creer: !c, nomCree: b.reservoir || b.nom, mesure: b.mesure };
}
function BaremeRevue({ etat, setP, fusionP, site, setSite, garderDoc, setGarderDoc, relireOcr }) {
  const { db } = useApp(); const [ouvert, setOuvert] = useState(null); const props = etat.props || [];
  const graves = (etat.journal || []).filter((j) => j.grave); const creer = props.some((p) => p.ok && p.creer);
  const contOpts = [{ value: '', label: 'Contenant…' }, ...db.contenants.filter((c) => c.statut !== 'archive').map((c) => ({ value: c.id, label: `${c.nom}${baremeDe(db, c.id) ? ' (a déjà un barème)' : ''}` }))];
  return (
    <div className="space-y-3" data-bareme-revue="">
      {!props.length ? <Notice tone="bad" title="Aucun barème reconnu">{graves.length ? graves.map((j) => `« ${j.fichier} » : ${j.msg}`).join(' · ') : 'Ce document ne contient pas de tableau hauteur / volume lisible.'}{(etat.sansTexte || []).length ? ' Le document est une image scannée.' : ''}</Notice> : <p className="text-sm">{props.length} barème{props.length > 1 ? 's' : ''} reconnu{props.length > 1 ? 's' : ''}. Vérifiez le rattachement de chacun, ouvrez le tableau pour contrôler les valeurs signalées, puis enregistrez.</p>}
      {(etat.sansTexte || []).length ? <Notice tone="info" title={`${etat.sansTexte.length} page${etat.sansTexte.length > 1 ? 's' : ''} scannée${etat.sansTexte.length > 1 ? 's' : ''} sans texte`}>
        Pages {etat.sansTexte.map((x) => x.n).join(', ')}{uniq(etat.sansTexte.map((x) => x.fichier)).length > 1 ? ' (plusieurs fichiers)' : ''} : Œnotrack peut en lire les chiffres (reconnaissance de caractères, quelques secondes par page ; le module de lecture se télécharge la première fois).
        <div className="mt-2"><Btn kind="primary" size="sm" onClick={relireOcr}>🔎 Lire les pages scannées</Btn></div></Notice> : null}
      {graves.length && props.length ? <Notice tone="warn" title="Fichiers non lus">{graves.map((j) => `« ${j.fichier} » : ${j.msg}`).join(' · ')}{graves.some((j) => j.ocr) ? ' — sans accès au module de lecture, collez le tableau ou utilisez un fichier de barèmes préparé.' : ''}</Notice> : null}
      {props.map((p, i) => <BaremeProp key={p.b._cle || i} p={p} i={i} setP={setP} contOpts={contOpts} ouvert={ouvert === i} onOuvrir={() => setOuvert(ouvert === i ? null : i)} liste={props.map((x) => x.b)} onFusion={(a, b) => { setOuvert(null); fusionP(a, b); }} />)}
      {props.length ? <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-line p-3">
        {creer && db.sites.length > 1 ? <label className="flex items-center gap-2 text-sm">Site des contenants créés <select className="inp" style={{ width: 'auto' }} value={site} onChange={(e) => setSite(e.target.value)} aria-label="Site des contenants créés">{db.sites.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></label> : null}
        {(etat.fichiers || []).length ? <Check checked={garderDoc} onChange={setGarderDoc} label="Garder le document d’origine avec les barèmes" /> : null}
      </div> : null}
    </div>
  );
}
function BaremeProp({ p, i, setP, contOpts, ouvert, onOuvrir, liste, onFusion }) {
  const b = p.b; const P = baremePts(b); const m = b.meta || {}; const [ton, txt] = FIAB[b.fiabilite || m.fiabilite] || FIAB.moyenne; const alertes = baremeControle({ ...b, mesure: p.mesure });
  const setB = (patch) => setP(i, { b: { ...b, ...patch } });
  return (
    <div className={cx('jg-prop', !p.ok && 'off')} data-bareme-prop={i}>
      <div className="flex flex-wrap items-center gap-2">
        <Check checked={p.ok} onChange={(v) => setP(i, { ok: v })} label={<b>{b.nom}</b>} />
        <Chip tone={ton}>{txt}</Chip>{b.cible === 'citerne' ? <Chip tone="info">citerne</Chip> : null}
        <span className="text-xs text-ink2">{P.length} lignes · {baremePlage(b)}{m.pages && m.pages.length ? ` · page${m.pages.length > 1 ? 's' : ''} ${m.pages.join(', ')}` : ''}{m.fichier ? ` · ${m.fichier}` : ''}</span>
        <Btn size="sm" className="ml-auto" onClick={onOuvrir} aria-expanded={ouvert}>{ouvert ? 'Fermer le tableau' : 'Voir le tableau'}</Btn>
      </div>
      <div className="jg-prop-g">
        {b.cible === 'citerne' ? <>
          <Field label="Immatriculation"><TI value={b.immat} onChange={(v) => setB({ immat: v.toUpperCase(), nom: `${v.toUpperCase()} · compartiment ${b.compartiment || '?'}` })} aria-label={`Immatriculation — ${b.nom}`} /></Field>
          <Field label="Compartiment" help={b.compartimentIncertain ? 'Numéro illisible : à vérifier' : ''}><TI value={b.compartiment} onChange={(v) => setB({ compartiment: v, nom: `${b.immat} · compartiment ${v || '?'}`, compartimentIncertain: false })} aria-label={`Compartiment — ${b.nom}`} /></Field>
        </> : <>
          <Field label="Contenant"><SI value={p.creer ? '__creer' : p.lien} onChange={(v) => setP(i, v === '__creer' ? { creer: true, lien: '' } : { creer: false, lien: v })} options={[...contOpts, { value: '__creer', label: `➕ Créer « ${p.nomCree} »` }]} aria-label={`Contenant de ${b.nom}`} /></Field>
          {p.creer ? <Field label="Nom du contenant créé"><TI value={p.nomCree} onChange={(v) => setP(i, { nomCree: v })} aria-label={`Nom du contenant créé — ${b.nom}`} /></Field> : null}
        </>}
        <Field label="Mesure"><select className="inp" value={p.mesure} onChange={(e) => setP(i, { mesure: e.target.value })} aria-label={`Mesure — ${b.nom}`}><option value="hauteur">Hauteur de liquide (depuis le fond)</option><option value="creux">Creux (vide depuis le haut)</option></select></Field>
      </div>
      <div className="text-xs text-ink2">{[m.organisme && titreCourt(m.organisme), m.date && `jaugé le ${fmtDate(m.date)}`, m.validite && `valable jusqu’au ${fmtDate(m.validite)}`, m.certificat && `certificat ${m.certificat}`, m.constructeur && `constructeur ${m.constructeur}`, m.forme, m.materiau, hasNum(m.capacite) && `capacité ${fmtL(m.capacite)}`].filter(Boolean).join(' · ')}</div>
      {b.controle ? <div className={cx('text-xs', b.controle.ok ? 'text-ok' : 'text-warn')}>{b.controle.ok ? '✓' : '⚠'} {b.controle.certificat ? 'Volumes du certificat (nominal, minimal) retrouvés par le tableau' : 'Table volumétrique du cahier retrouvée par le tableau'} : écart maximal {fmt(b.controle.ecartMax, 2)} %.</div> : null}
      {alertes.length ? <ul className="jg-alertes">{alertes.map((a, k) => <li key={k} className={`jg-${a.niveau}`}>{a.msg}</li>)}</ul> : null}
      {liste && liste.length > 1 && onFusion ? <BaremeFusionChoix liste={liste} i={i} onFusion={onFusion} /> : null}
      {ouvert ? <div className="mt-2 space-y-2"><BaremeCourbe b={b} /><BaremeTableau b={b} onChange={(patch) => setB(patch)} /></div> : null}
    </div>
  );
}
// fusion de deux tableaux d'un même document, avant enregistrement (0.37.0-alpha.1) : choix du tableau, aperçu, fusion
function BaremeFusionChoix({ liste, i, onFusion }) {
  const [j, setJ] = useState(''); const a = liste[i]; const autres = liste.map((b, k) => ({ b, k })).filter((x) => x.k !== i && (x.b.cible === 'citerne') === (a.cible === 'citerne'));
  if (!autres.length) return null; const ap = j !== '' && liste[Number(j)] ? baremeFusionApercu(a, liste[Number(j)]) : null;
  return (
    <details className="rounded-md border border-line px-2 py-1.5" data-bareme-fusion-choix={i}>
      <summary className="cursor-pointer text-sm">⧉ Fusionner avec un autre tableau du document</summary>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <Field label="Tableau à réunir à celui-ci"><SI plain value={j} onChange={setJ} options={[{ value: '', label: 'Tableau…' }, ...autres.map((x) => ({ value: String(x.k), label: `${x.b.nom} · ${baremePlage(x.b)}` }))]} aria-label={`Tableau à fusionner avec ${a.nom}`} /></Field>
        <Btn size="sm" kind="primary" disabled={!ap || !!ap.refus} onClick={() => { const k = Number(j); setJ(''); onFusion(i, k); }}>⧉ Fusionner en une seule table</Btn>
      </div>
      {ap ? <BaremeFusionResume ap={ap} /> : null}
    </details>
  );
}
function BaremeFusionResume({ ap }) {
  if (ap.refus) return <Notice tone="bad">{ap.refus}</Notice>;
  return (
    <div className="mt-2 space-y-1 text-sm" data-bareme-fusion-apercu="">
      <div>{`Table fusionnée : ${ap.plage} · ${ap.ajout} ligne(s) ajoutée(s)`}</div>
      {ap.alertes.length ? <ul className="jg-alertes">{ap.alertes.map((x, k) => <li key={k} className="jg-warn">{x}</li>)}</ul> : null}
    </div>
  );
}
// tableau éditable (valeurs corrigées surlignées)
function BaremeTableau({ b, onChange, lecture }) {
  const P = baremePts(b); const corr = new Map((b.corrections || []).map((c) => [String(Math.round(c.h * 1000) / 1000), c]));
  const [ajout, setAjout] = useState({ h: '', v: '' }); const [seuls, setSeuls] = useState(false);
  const maj = (k, v) => { const pts = P.map((p, j) => (j === k ? [p[0], num(v)] : p)); const h = P[k][0]; const cs = (b.corrections || []).filter((c) => Math.abs(c.h - h) > 1e-6); const avant = corr.get(String(Math.round(h * 1000) / 1000)); onChange({ points: pts, corrections: [...cs, { h, lu: avant ? avant.lu : fmt(P[k][1]), v: num(v), mode: 'manuel' }] }); };
  const suppr = (k) => onChange({ points: P.filter((_, j) => j !== k) });
  const ajouter = () => { if (!hasNum(ajout.h) || !hasNum(ajout.v)) return; onChange({ points: baremeNettoyer({ points: [...P, [num(ajout.h), num(ajout.v)]] }) }); setAjout({ h: '', v: '' }); };
  const lignes = P.map((p, k) => ({ p, k, c: corr.get(String(Math.round(p[0] * 1000) / 1000)) })).filter((x) => !seuls || x.c);
  return (
    <div data-bareme-tableau="">
      <div className="mb-1 flex flex-wrap items-center gap-3 text-xs text-ink2"><span><span className="jg-c-chiffre">  </span> corrigée d’après les voisines</span><span><span className="jg-c-douteux">  </span> douteuse</span><span><span className="jg-c-manuel">  </span> modifiée à la main</span>{(b.corrections || []).length ? <Check checked={seuls} onChange={setSeuls} label="Seulement les valeurs signalées" /> : null}</div>
      <div className="jg-tab"><table className="tbl"><thead><tr><th>{mesureLabel(b)} (cm)</th><th className="r">Volume (L)</th><th className="r">hL</th><th>Lu sur le document</th>{!lecture ? <th /> : null}</tr></thead>
        <tbody>{lignes.map(({ p, k, c }) => (
          <tr key={k} className={c ? `jg-c-${c.mode}` : ''}><td className="num">{fmt(p[0], p[0] % 1 ? 2 : 0)}</td>
            <td className="r">{lecture ? <span className="num">{fmt(p[1], p[1] % 1 ? 1 : 0)}</span> : <input className="inp num jg-inp" inputMode="decimal" defaultValue={String(p[1]).replace('.', ',')} onBlur={(e) => { const v = e.target.value; if (hasNum(v) && Math.abs(num(v) - p[1]) > 1e-9) maj(k, v); }} aria-label={`Volume à ${fmt(p[0], 1)} cm`} />}</td>
            <td className="r num">{fmtHL(p[1])}</td><td className="text-xs">{c ? (c.mode === 'manuel' ? `modifiée (avant : ${c.lu})` : c.lu ? `« ${c.lu} »` : 'case vide') : ''}</td>
            {!lecture ? <td><button type="button" className="btn btn-sm" aria-label={`Retirer la ligne ${fmt(p[0], 1)} cm`} onClick={() => suppr(k)}>✕</button></td> : null}</tr>))}</tbody></table></div>
      {!lecture ? <div className="mt-2 flex flex-wrap items-end gap-2"><Field label="Ajouter : hauteur (cm)"><NI value={ajout.h} onChange={(v) => setAjout({ ...ajout, h: v })} aria-label="Hauteur de la ligne ajoutée" /></Field><Field label="volume (L)"><NI value={ajout.v} onChange={(v) => setAjout({ ...ajout, v })} aria-label="Volume de la ligne ajoutée" /></Field><Btn onClick={ajouter} disabled={!hasNum(ajout.h) || !hasNum(ajout.v)}>＋ Ajouter la ligne</Btn></div> : null}
    </div>
  );
}

/* ---------- barème importé dans la fiche du contenant, dès sa création (0.22.0-alpha.1) ---------- */
// lecture d'un cahier d'épalement pour CE contenant : tableau choisi (cahier de plusieurs réservoirs), vérifié, puis enregistré avec le contenant
const lectureErreurJauge = (f, er) => { const reseau = !er || !er.message || /fetch|import|module|réseau|network|script|worker/i.test(er.message || ''); return reseau && (estImage(f) || estPdf(f)) ? 'module de lecture injoignable (connexion internet ? page affichée dans claude.ai ?) : collez le tableau ou utilisez un fichier Excel ou CSV' : er.message || 'lecture impossible'; };
function ContBareme({ contId, nomCont, val, onVal, onReprise, lecture }) {
  const { db } = useApp(); const actuel = contId ? baremeDe(db, contId) : null; const [ouvert, setOuvert] = useState(false); const [voir, setVoir] = useState(false); const [colle, setColle] = useState('');
  const pret = (baremes, f, extra) => { const L = baremes.filter((b) => b.cible !== 'citerne'); const i = Math.max(0, baremePourNom(L, nomCont)); const v = { phase: 'pret', fichier: f || null, baremes: L.map((b, k) => ({ ...b, _cle: `${f ? f.name : 'colle'}|${k}` })), i, mesure: L[i].mesure || 'hauteur', garderDoc: true, ...(extra || {}) }; onVal(v); onReprise(L[i]); setOuvert(false); };
  const lire = async (fs, opts = {}) => {
    const f = fs && fs[0]; if (!f) return; onVal({ phase: 'lecture', msg: `« ${f.name} » : lecture…` });
    try {
      const r = await lireFichierJauge(f, { ocr: opts.ocr, onEtape: (m) => onVal({ phase: 'lecture', msg: `« ${f.name} » : ${m}` }) });
      if (!r.baremes.some((b) => b.cible !== 'citerne')) { onVal({ phase: 'erreur', fichier: f, sansTexte: r.sansTexte || [], msg: r.baremes.length ? 'C’est un certificat de jaugeage de citerne : importez-le dans Paramètres › 📏 Barèmes de jaugeage.' : (r.sansTexte || []).length ? 'Document scanné : ses chiffres n’ont pas encore été lus.' : 'Aucun tableau hauteur / volume reconnu dans ce document.' }); return; }
      pret(r.baremes, f, { sansTexte: r.sansTexte || [] });
    } catch (er) { onVal({ phase: 'erreur', fichier: f, msg: lectureErreurJauge(f, er) }); }
  };
  const lireColle = () => { const r = jaugeAnalyser([jaugePageDeTexte(colle)], { fichier: 'tableau collé' }); if (!r.baremes.some((x) => x.cible !== 'citerne')) { onVal({ phase: 'erreur', msg: r.baremes.length ? 'C’est un certificat de jaugeage de citerne : importez-le dans Paramètres › 📏 Barèmes de jaugeage.' : 'Aucun tableau hauteur / volume reconnu dans le texte collé.' }); return; } pret(r.baremes, null); };
  const b = val && val.phase === 'pret' ? val.baremes[val.i] : null; const bm = b ? { ...b, mesure: val.mesure } : null;
  const m = (b && b.meta) || {}; const [ton, txt] = b ? FIAB[b.fiabilite || m.fiabilite] || FIAB.moyenne : []; const alertes = bm ? baremeControle(bm) : [];
  const majB = (patch) => onVal({ ...val, baremes: val.baremes.map((x, k) => (k === val.i ? { ...x, ...patch } : x)) });
  return (
    <div className="space-y-2" data-cont-bareme="">
      {actuel && !b ? <div className="flex flex-wrap items-center gap-2 text-sm"><span>Barème actuel : {baremeTexte(actuel)}</span><Btn size="sm" onClick={() => setVoir(true)}>Voir le barème</Btn></div> : null}
      {val && val.phase === 'lecture' ? <div className="jg-lecture" role="status"><div className="jg-sablier" aria-hidden="true">📏</div><div className="font-semibold">Lecture en cours…</div><div className="text-sm text-ink2">{val.msg}</div></div> : null}
      {lecture && !b ? <p className="help" data-cont-bareme-droits="">{actuel ? '' : 'Aucun barème. '}Votre profil ne permet pas d’importer un barème de jaugeage (il faut le droit de modifier les Paramètres).</p> : null}
      {!lecture && !b && !(val && val.phase === 'lecture') ? <>
        <ZoneDepot onFiles={lire} accept={JAUGE_ACCEPT} multiple={false} icon="📏" label={actuel ? 'Déposer un nouveau cahier d’épalement' : 'Importer le barème de jaugeage'} sub={actuel ? 'il remplacera le barème actuel, archivé' : 'cahier d’épalement : PDF, scan, photo, Excel, CSV'} inputLabel="Cahier d’épalement du contenant" />
        {val && val.phase === 'erreur' ? <Notice tone="warn" title="Barème non lu">{val.msg}{(val.sansTexte || []).length && val.fichier ? <div className="mt-2"><Btn size="sm" kind="primary" onClick={() => lire([val.fichier], { ocr: true })}>🔎 Lire les pages scannées</Btn></div> : null}</Notice> : null}
        <details className="rounded-md border border-line p-3"><summary className="cursor-pointer text-sm">Ou coller un tableau (Excel, texte)</summary>
          <div className="mt-2 space-y-2"><TA value={colle} onChange={setColle} rows={5} placeholder={'Hauteur (cm)\tVolume (L)\n1\t97\n2\t103\n…'} aria-label="Tableau du barème collé" /><Btn disabled={!colle.trim()} onClick={lireColle}>Lire le tableau collé</Btn></div></details>
      </> : null}
      {b ? (
        <div className="jg-prop" data-cont-bareme-lu="">
          <div className="flex flex-wrap items-center gap-2"><b>{b.nom}</b><Chip tone={ton}>{txt}</Chip><span className="text-xs text-ink2">{baremePts(b).length} lignes · {baremePlage(bm)} · {val.fichier ? val.fichier.name : 'tableau collé'}</span>
            <span className="ml-auto flex gap-1"><Btn size="sm" onClick={() => setOuvert(!ouvert)} aria-expanded={ouvert}>{ouvert ? 'Fermer le tableau' : 'Voir le tableau'}</Btn><Btn size="sm" kind="ghost" onClick={() => onVal(null)}>Retirer</Btn></span></div>
          <div className="jg-prop-g">
            {val.baremes.length > 1 ? <Field label={`Tableau du document (${val.baremes.length} réservoirs)`}><SI plain value={String(val.i)} onChange={(v) => { const i = Number(v); onVal({ ...val, i, mesure: val.baremes[i].mesure || 'hauteur' }); onReprise(val.baremes[i]); }} options={val.baremes.map((x, k) => ({ value: String(k), label: `${x.nom} · ${baremePlage(x)}` }))} aria-label="Tableau du document" /></Field> : null}
            <Field label="Mesure"><select className="inp" value={val.mesure} onChange={(e) => onVal({ ...val, mesure: e.target.value })} aria-label="Mesure du barème"><option value="hauteur">Hauteur de liquide (depuis le fond)</option><option value="creux">Creux (vide depuis le haut)</option></select></Field>
          </div>
          <div className="text-xs text-ink2">{[m.organisme && titreCourt(m.organisme), m.date && `jaugé le ${fmtDate(m.date)}`, m.constructeur && `constructeur ${m.constructeur}`, m.forme, m.materiau, hasNum(m.capacite) && `capacité ${fmtL(m.capacite)}`].filter(Boolean).join(' · ')}</div>
          {alertes.length ? <ul className="jg-alertes">{alertes.map((a, k) => <li key={k} className={`jg-${a.niveau}`}>{a.msg}</li>)}</ul> : null}
          {val.baremes.length > 1 ? <BaremeFusionChoix liste={val.baremes} i={val.i} onFusion={(i, j) => { const L = baremesListeFusion(val.baremes, i, j); if (!L) return; const ni = i < j ? i : i - 1; onVal({ ...val, baremes: L, i: ni, mesure: L[ni].mesure || val.mesure }); onReprise(L[ni]); }} /> : null}
          {ouvert ? <div className="mt-2 space-y-2"><BaremeCourbe b={bm} /><BaremeTableau b={b} onChange={majB} /></div> : null}
          {val.fichier ? <Check checked={val.garderDoc} onChange={(v) => onVal({ ...val, garderDoc: v })} label="Garder le document d’origine avec le barème" /> : null}
          <p className="help">{actuel ? 'Enregistré avec le contenant ; le barème actuel est archivé (consultable dans Vinification › Cuverie & Lots › 📏 Barèmes de jaugeage).' : 'Enregistré avec le contenant.'}</p>
        </div>) : null}
      {voir && actuel ? <BaremeSheet id={actuel.id} onClose={() => setVoir(false)} /> : null}
    </div>
  );
}
// enregistre le barème lu avec le contenant (dans la même action) ; doc : document d'origine déjà rangé dans ce navigateur
function contBaremeEnregistrer(d, val, contId, doc) {
  const { _fichier, _cle, reservoir, compartimentIncertain, fiabilite, ...b } = val.baremes[val.i];
  const rb = baremeSave(d, { ...b, cible: 'contenant', contenantId: contId, mesure: val.mesure || b.mesure, docId: doc ? doc.id : undefined, meta: { ...(b.meta || {}), fiabilite } }); if (!rb.ok) return rb;
  if (doc && !(d.docs || []).some((x) => x.id === doc.id)) docMetaAdd(d, { ...doc, cat: 'autre', cible: { type: 'bareme', id: rb.id } });
  return rb;
}

/* ---------- Barèmes de jaugeage (0.39.0-alpha.1 : Vinification › Cuverie & Lots ; Paramètres si le module est désactivé) ---------- */
function BaremesView() {
  const { db, act, toast, confirm } = useApp(); const [imp, setImp] = useState(false); const [vue, setVue] = useState(null); const [arch, setArch] = useState(false);
  const L = (db.baremes || []).filter((b) => arch || !b.archive); const cuves = L.filter((b) => b.cible !== 'citerne'); const cits = L.filter((b) => b.cible === 'citerne');
  const cn = (id) => (db.contenants.find((c) => c.id === id) || {}).nom;
  const exporter = async () => { const txt = jaugeExporter(db.baremes.filter((b) => !b.archive), (db.entreprise && db.entreprise.nom) || ''); const r = await saveFile(`oenotrack-baremes-${todayISO()}.json`, new Blob([txt], { type: 'application/json' }), 'application/json'); if (r.ok) toast('Barèmes exportés.'); else if (!r.declined) toast(failMsg(r), 'bad'); };
  const dep = useDepot((fs) => setImp({ fichiers: fs }), { accept: JAUGE_ACCEPT, disabled: !!imp, refus: 'Déposez un PDF, une photo, un tableur (Excel, CSV) ou un fichier de barèmes.' });
  const sansB = db.contenants.filter((c) => c.statut !== 'archive' && !baremeDe(db, c.id));
  return (
    <div className="space-y-5" {...dep.props}>
      <div className="card space-y-3 p-4">
        <p className="text-sm">Les <b>tables d’épalement</b> (cahiers de jaugeage) donnent le volume d’une cuve pour chaque hauteur de liquide. Une fois importées, Œnotrack calcule le volume à partir des centimètres mesurés — ou, à l’inverse, la hauteur attendue — dans la fiche de chaque cuve, les transferts, les jaugeages et les entrées de moûts (creux des compartiments de citerne).</p>
        <div className="flex flex-wrap gap-2"><Btn kind="primary" onClick={() => setImp({})}>⬆ Importer des barèmes…</Btn>{(db.baremes || []).length ? <Btn onClick={exporter}>⬇ Exporter les barèmes</Btn> : null}{(db.baremes || []).some((b) => b.archive) ? <Check checked={arch} onChange={setArch} label="Afficher les barèmes archivés" /> : null}</div>
      </div>
      <Sec title={`Cuves et contenants (${cuves.length})`}>
        <Tbl rows={cuves} onRow={(b) => setVue(b.id)} empty="Aucun barème : importez un cahier d’épalement (PDF, scan, Excel)." cols={[
          { h: 'Contenant', r: (b) => (b.contenantId && cn(b.contenantId) ? <b>{cn(b.contenantId)}</b> : <Chip tone="warn">non rattaché</Chip>) }, { h: 'Réservoir (document)', cls: 'hm', r: (b) => b.nom },
          { h: 'Plage', r: (b) => baremePlage(b) }, { h: 'Jaugeage', cls: 'hm', r: (b) => [(b.meta || {}).organisme ? titreCourt(b.meta.organisme) : null, (b.meta || {}).date ? fmtDate(b.meta.date) : null].filter(Boolean).join(' · ') || '—' },
          { h: '', r: (b) => <span className="flex flex-wrap gap-1">{b.archive ? <Chip>{b.fusionneDans ? 'fusionné' : 'archivé'}</Chip> : null}{(b.fusions || []).length ? <Chip tone="info">{`${b.fusions.length + 1} tables réunies`}</Chip> : null}{(b.corrections || []).some((c) => c.mode !== 'manuel') ? <Chip tone="warn">{(b.corrections || []).filter((c) => c.mode !== 'manuel').length} à vérifier</Chip> : null}</span> },
        ]} />
        {sansB.length && cuves.length ? <p className="help mt-1">Sans barème : {sansB.slice(0, 12).map((c) => c.nom).join(', ')}{sansB.length > 12 ? '…' : ''}.</p> : null}
      </Sec>
      <Sec title={`Citernes (${citernesConnues({ baremes: L }).length})`}>
        <Tbl rows={cits} onRow={(b) => setVue(b.id)} empty="Aucun certificat de jaugeage de citerne." cols={[
          { h: 'Citerne', r: (b) => <b>{b.immat}</b> }, { h: 'Compartiment', r: (b) => b.compartiment || '?' }, { h: 'Plage (creux)', r: (b) => baremePlage(b) },
          { h: 'Validité', r: (b) => ((b.meta || {}).validite ? <span className={(b.meta.validite < todayISO()) ? 'text-bad' : ''}>{fmtDate(b.meta.validite)}</span> : '—') },
          { h: '', r: (b) => <span className="flex flex-wrap gap-1">{b.archive ? <Chip>archivé</Chip> : null}{(b.corrections || []).some((c) => c.mode !== 'manuel') ? <Chip tone="warn">{(b.corrections || []).filter((c) => c.mode !== 'manuel').length} à vérifier</Chip> : null}</span> },
        ]} />
      </Sec>
      {imp ? <BaremeImport onClose={() => setImp(false)} fichiers={imp.fichiers} /> : null}
      {vue ? <BaremeSheet id={vue} onClose={() => setVue(null)} /> : null}
    </div>
  );
}
function BaremeSheet({ id, onClose }) {
  const { db, R, act, confirm } = useApp(); const b = (db.baremes || []).find((x) => x.id === id); const [edit, setEdit] = useState(false); const [brouillon, setBrouillon] = useState(null); const [voirDoc, setVoirDoc] = useState(null); const [fusion, setFusion] = useState(false);
  if (!b) return null; const m = b.meta || {}; const c = db.contenants.find((x) => x.id === b.contenantId); const vol = c ? (R.contVol || {})[c.id] || 0 : 0;
  const doc = b.docId ? (db.docs || []).find((x) => x.id === b.docId) : null; // document d'origine (un seul pour tous les barèmes d'un même cahier)
  const suppr = async () => {
    if (!(await confirm({ title: 'Supprimer ce barème ?', body: `« ${b.nom} » sera supprimé (les volumes déjà enregistrés ne changent pas).`, ok: 'Supprimer', danger: true }))) return;
    const seul = doc && !(db.baremes || []).some((x) => x.id !== id && x.docId === doc.id);
    const r = act((d) => { const rr = baremeDelete(d, id); if (rr.ok && seul) docMetaDel(d, doc.id); return rr; }, 'Barème supprimé.');
    if (r.ok) { if (seul) docDel(doc.id).catch(() => null); onClose(); }
  };
  const garder = () => { const r = act((d) => baremeSave(d, { ...b, ...brouillon }, id), 'Barème modifié.'); if (r.ok) { setEdit(false); setBrouillon(null); } };
  const contOpts = [{ value: '', label: 'Non rattaché' }, ...db.contenants.filter((x) => x.statut !== 'archive' || x.id === b.contenantId).map((x) => ({ value: x.id, label: x.nom }))];
  return (
    <Sheet wide title={b.cible === 'citerne' ? `Citerne ${b.immat} · compartiment ${b.compartiment || '?'}` : `Barème de jaugeage — ${c ? c.nom : b.nom}`} sub={baremeTexte(b)} onClose={onClose}
      footer={edit ? <><Btn onClick={() => { setEdit(false); setBrouillon(null); }}>Annuler</Btn><Btn kind="primary" disabled={!brouillon} onClick={garder}>Enregistrer les modifications</Btn></> : <><Btn kind="danger" className="mr-auto" onClick={suppr}>Supprimer</Btn><Btn onClick={() => act((d) => baremeArchiver(d, id, !b.archive), b.archive ? 'Barème remis en service.' : 'Barème archivé.')}>{b.archive ? 'Remettre en service' : 'Archiver'}</Btn>{!b.archive ? <Btn onClick={() => setFusion(true)} data-bareme-fusionner="">⧉ Fusionner…</Btn> : null}<Btn onClick={() => setEdit(true)}>✎ Corriger le tableau</Btn><Btn kind="primary" onClick={onClose}>Fermer</Btn></>}>
      <div className="space-y-4" data-bareme-sheet={id}>
        {b.cible !== 'citerne' ? <Field label="Contenant"><SI value={b.contenantId || ''} onChange={(v) => act((d) => baremeLier(d, id, v), v ? 'Barème rattaché.' : 'Barème détaché.')} options={contOpts} aria-label="Contenant du barème" /></Field> : null}
        <dl className="kv">{[['Réservoir (document)', b.nom], ['Organisme', m.organisme && titreCourt(m.organisme)], ['Certificat', m.certificat], ['Date du jaugeage', m.date && fmtDate(m.date)], ['Validité', m.validite && fmtDate(m.validite)], ['Constructeur', m.constructeur], ['N° de série', m.numeroSerie], ['Forme', m.forme], ['Matériau', m.materiau], ['Capacité annoncée', hasNum(m.capacite) && fmtL(m.capacite)], ['Hauteur totale (témoin)', hasNum(m.hauteurTotale) && cmTxt(m.hauteurTotale)], ['Volume au débordement', hasNum(m.volumeDebordement) && fmtL(m.volumeDebordement)], ['Volume nominal', hasNum(m.volumeNominal) && `${fmtL(m.volumeNominal)}${hasNum(m.creuxNominal) ? ` (creux ${cmTxt(m.creuxNominal)})` : ''}`], ['Volume minimal', hasNum(m.volumeMinimal) && `${fmtL(m.volumeMinimal)}${hasNum(m.creuxMinimal) ? ` (creux ${cmTxt(m.creuxMinimal)})` : ''}`], ['Mesure', b.mesure === 'creux' ? 'creux (vide depuis le haut)' : 'hauteur de liquide'], ['Source', [m.fichier, m.pages && m.pages.length ? `page${m.pages.length > 1 ? 's' : ''} ${m.pages.join(', ')}` : null].filter(Boolean).join(' · ')], ['Tables réunies', (b.fusions || []).map((x) => `${x.nom || '—'} (${x.plage})`).join(' ; ')], ['Fusionné dans', b.fusionneDans ? ((db.baremes || []).find((x) => x.id === b.fusionneDans) || {}).nom || b.fusionneDans : '']].filter((x) => x[1]).map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
        {doc ? <Btn size="sm" onClick={() => setVoirDoc(doc)}>📎 Document d’origine : {doc.nom}</Btn> : null}
        {voirDoc ? <DocViewer doc={voirDoc} onClose={() => setVoirDoc(null)} /> : null}
        {fusion ? <BaremeFusionSheet id={id} onClose={() => setFusion(false)} /> : null}
        {baremeControle(b).map((a, k) => <Notice key={k} tone={a.niveau === 'bad' ? 'bad' : a.niveau === 'warn' ? 'warn' : 'info'}>{a.msg}</Notice>)}
        {!edit ? <><Sec title="Calcul"><JaugeCalc b={b} volActuel={vol} /></Sec><Sec title={`Tableau (${baremePts(b).length} lignes)`}><BaremeTableau b={b} lecture /></Sec></>
          : <Sec title="Corriger le tableau"><BaremeTableau b={{ ...b, ...(brouillon || {}) }} onChange={(patch) => setBrouillon({ ...(brouillon || {}), ...patch })} /></Sec>}
      </div>
    </Sheet>
  );
}
// fusion de deux barèmes enregistrés (0.37.0-alpha.1) : celui-ci reçoit les lignes de l'autre, qui est archivé
function BaremeFusionSheet({ id, onClose }) {
  const { db, act } = useApp(); const a = (db.baremes || []).find((x) => x.id === id); const [j, setJ] = useState('');
  if (!a) return null; const cn = (x) => (db.contenants.find((c) => c.id === x.contenantId) || {}).nom || '';
  const autres = (db.baremes || []).filter((x) => x.id !== id && !x.archive && (x.cible === 'citerne') === (a.cible === 'citerne') && (a.cible !== 'citerne' || immatNorm(x.immat) === immatNorm(a.immat)));
  const b = autres.find((x) => x.id === j); const ap = b ? baremeFusionApercu(a, b) : null;
  const ok = () => { const r = act((d) => baremeFusionner(d, id, j), 'Barèmes fusionnés en une seule table.'); if (r && r.ok) onClose(); };
  return (
    <Sheet title="⧉ Fusionner deux tables de jaugeage" sub={`${cn(a) ? `${cn(a)} · ` : ''}${a.nom} · ${baremePlage(a)}`} onClose={onClose}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" disabled={!ap || !!ap.refus} onClick={ok}>⧉ Fusionner en une seule table</Btn></>}>
      <div className="space-y-3" data-bareme-fusion={id}>
        <p className="text-sm">Les lignes du barème choisi complètent celui-ci ; aux hauteurs communes, les valeurs de celui-ci sont gardées. Le barème réuni est archivé : il reste consultable dans les barèmes archivés.</p>
        {autres.length ? <Field label="Barème à réunir à celui-ci"><SI value={j} onChange={setJ} placeholder="Barème…" options={autres.map((x) => ({ value: x.id, label: `${cn(x) ? `${cn(x)} · ` : ''}${x.nom} · ${baremePlage(x)}` }))} aria-label="Barème à fusionner" /></Field>
          : <Notice tone="info">Aucun autre barème en service à fusionner.</Notice>}
        {ap ? <BaremeFusionResume ap={ap} /> : null}
        {ap && !ap.refus ? <BaremeCourbe b={{ ...a, points: ap.points }} /> : null}
      </div>
    </Sheet>
  );
}
// fiche d'un contenant : section « Jaugeage »
function JaugeSection({ contId }) {
  const { db, R } = useApp(); const b = baremeDe(db, contId); const [imp, setImp] = useState(false); const [vue, setVue] = useState(false);
  return (
    <Sec title="📏 Jaugeage" className="mb-5" right={b ? <Btn size="sm" onClick={() => setVue(true)}>Voir le barème</Btn> : <Btn size="sm" onClick={() => setImp(true)}>⬆ Importer le barème…</Btn>}>
      {b ? <div className="card p-4"><JaugeCalc b={b} volActuel={(R.contVol || {})[contId] || 0} /><p className="help mt-2">Barème : {baremeTexte(b)}.</p></div>
        : <div className="text-sm text-ink2">Aucun barème de jaugeage : importez la table d’épalement de ce contenant pour calculer les volumes à partir des centimètres mesurés.</div>}
      {imp ? <BaremeImport contIdPreset={contId} onClose={() => setImp(false)} /> : null}
      {vue && b ? <BaremeSheet id={b.id} onClose={() => setVue(false)} /> : null}
    </Sec>
  );
}
