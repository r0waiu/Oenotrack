/* ============ DOCUMENTS JOINTS (fichiers dans IndexedDB) · LOGO ET IDENTITÉ DE L'ENTREPRISE ============ */
const DOC_DB = 'oenotrack-docs'; const DOC_STORE = 'fichiers'; const DOC_MAX = 40 * 1024 * 1024;
const DOC_CATS = {
  op: [['enregistrement', 'Fiche d’enregistrement remplie'], ['bon', 'Bon / DAE'], ['analyse', 'Bulletin d’analyse'], ['photo', 'Photo'], ['autre', 'Autre document']],
  arrivage: [['certificat', 'Certificat de conformité'], ['fiche_technique', 'Fiche technique'], ['fds', 'Fiche de données de sécurité (FDS)'], ['bon', 'Bon de livraison'], ['autre', 'Autre document']],
  produitHygiene: [['fds', 'Fiche de données de sécurité (FDS)'], ['ft', 'Fiche technique'], ['contact', 'Attestation contact alimentaire'], ['certif', 'Attestation bio, Demeter… (revendications)'], ['autre', 'Autre document']],
  produit: [['fds', 'Fiche de données de sécurité (FDS)'], ['ft', 'Fiche technique'], ['certificat', 'Certificat / attestation (bio, allergènes, OGM…)'], ['autre', 'Autre document']], // intrants (0.20.0-alpha.1)
  produitMaintenance: [['fds', 'Fiche de données de sécurité (FDS)'], ['ft', 'Fiche technique'], ['certificat', 'Attestation contact alimentaire (NSF H1…)'], ['autre', 'Autre document']], // produits de maintenance (0.36.0-alpha.1)
  equipement: [['notice', 'Notice, manuel'], ['verification', 'Certificat de vérification, étalonnage'], ['facture', 'Facture, garantie'], ['contrat', 'Contrat d’entretien'], ['photo', 'Photo'], ['autre', 'Autre document']], // équipements (0.28.0-alpha.1)
};
const docCatLabel = (kind, id) => ((DOC_CATS[kind] || DOC_CATS.op).find((c) => c[0] === id) || [id, id === 'autre' ? 'Autre document' : id])[1];
const fmtSize = (n) => (n >= 1048576 ? `${fmt(n / 1048576, 1)} Mo` : `${fmt(Math.max(1, n / 1024))} Ko`);
const docIcon = (mime) => (/pdf/.test(mime) ? '📄' : /^image\//.test(mime) ? '🖼' : /sheet|excel|csv/.test(mime) ? '📊' : /word|document|text/.test(mime) ? '📝' : '📎');

let _idb = null;
function idb() {
  if (_idb) return _idb;
  _idb = new Promise((res, rej) => {
    try { const r = window.indexedDB.open(DOC_DB, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(DOC_STORE)) r.result.createObjectStore(DOC_STORE); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error || new Error('IndexedDB indisponible')); } catch (e) { rej(e); }
  });
  _idb.catch(() => { _idb = null; });
  return _idb;
}
const idbRun = (mode, fn) => idb().then((d) => new Promise((res, rej) => { const tx = d.transaction(DOC_STORE, mode); const rq = fn(tx.objectStore(DOC_STORE)); tx.oncomplete = () => res(rq ? rq.result : undefined); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('Écriture interrompue (espace insuffisant ?)')); }));
const docPut = (id, blob) => idbRun('readwrite', (s) => s.put(blob, id));
const docGet = (id) => idbRun('readonly', (s) => s.get(id));
const docDel = (id) => idbRun('readwrite', (s) => s.delete(id));
const docKeys = () => idbRun('readonly', (s) => s.getAllKeys());
const newDocId = () => `doc${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const blobToBytes = async (b) => new Uint8Array(await b.arrayBuffer());

// Ajout de fichiers : contenu → IndexedDB, puis métadonnées → base (sauvegardées avec le reste)
function useDocActions() {
  const { act, toast, confirm } = useApp();
  const add = async (files, cible, cat, extra) => { // extra (0.34.0-alpha.1) : { partId } — partenaire d'une entrée de moûts
    let n = 0;
    for (const file of Array.from(files || [])) {
      if (file.size > DOC_MAX) { toast(`« ${file.name} » dépasse ${fmtSize(DOC_MAX)} : non joint.`, 'bad'); continue; }
      const id = newDocId();
      try { await docPut(id, file); } catch (e) { toast('Impossible d’enregistrer le fichier dans ce navigateur (stockage indisponible ou plein).', 'bad'); return n; }
      const r = act((d) => docMetaAdd(d, { id, nom: gardeNomPropre(file.name), mime: file.type, taille: file.size, cat, cible, garde: gardeResume(GARDE_VERDICTS.get(file)), ...(extra || {}) }));
      if (r.ok) n += 1;
    }
    if (n) toast(n > 1 ? `${n} documents joints.` : 'Document joint.');
    return n;
  };
  const download = async (doc) => {
    try { const b = await docGet(doc.id); if (!b) { toast('Fichier introuvable dans ce navigateur (sauvegarde des documents à restaurer ?).', 'bad'); return; } const r = await saveFile(doc.nom, await blobToBytes(b), doc.mime || 'application/octet-stream'); if (!r.ok && !r.declined) toast(failMsg(r), 'bad'); } catch (e) { toast('Lecture du document impossible.', 'bad'); }
  };
  const remove = async (doc) => {
    if (!(await confirm({ title: 'Retirer ce document ?', body: `« ${doc.nom} » sera supprimé de ce navigateur.`, ok: 'Retirer', danger: true }))) return;
    try { await docDel(doc.id); } catch (e) { /* fichier déjà absent */ }
    act((d) => docMetaDel(d, doc.id), 'Document retiré.');
  };
  return { add, download, remove };
}

// verdict de la garde des importations sur un document joint
const GardeChip = ({ d }) => (d && d.garde && d.garde.statut === 'suspect' ? <Chip tone="bad" title={(d.garde.notes || []).join(' ; ')}>⚠ signalé</Chip> : d && d.garde && d.garde.statut === 'nettoye' ? <Chip tone="warn" title={(d.garde.notes || []).join(' ; ')}>🛡 désarmé</Chip> : null);
// Visionneuse (0.27.0-alpha.1) : l'aperçu suit le type RÉEL du fichier (lu dans son contenu), jamais le type annoncé — image (hors SVG)
// affichée comme image, PDF dans le lecteur PDF du navigateur, texte affiché comme texte (jamais interprété comme une page web) ;
// document signalé par la garde : pas d'aperçu, téléchargement après confirmation.
function DocViewer({ doc, onClose }) {
  const [vue, setVue] = useState(null); const [err, setErr] = useState(null); const { download } = useDocActions(); const { confirm } = useApp();
  const suspect = !!(doc.garde && doc.garde.statut === 'suspect');
  useEffect(() => {
    let u = null; let vivant = true;
    (async () => {
      let b = null; try { b = await docGet(doc.id); } catch (e) { if (vivant) setErr('Lecture impossible (stockage indisponible).'); return; }
      if (!b) { if (vivant) setErr('Fichier introuvable dans ce navigateur.'); return; }
      if (suspect) { if (vivant) setVue({ kind: 'bloque' }); return; }
      const tete = new Uint8Array(await b.slice(0, 65536).arrayBuffer()); const sig = gardeSignature(tete);
      if (sig.famille === 'image' && sig.type) { u = URL.createObjectURL(new Blob([b], { type: sig.type })); if (vivant) setVue({ kind: 'image', url: u }); return; }
      if (sig.famille === 'pdf') { u = URL.createObjectURL(new Blob([b], { type: 'application/pdf' })); if (vivant) setVue({ kind: 'pdf', url: u }); return; }
      if (['texte', 'json', 'xml'].includes(sig.famille)) { const t = gardeDecoder(new Uint8Array(await b.slice(0, 2 * GARDE_MO).arrayBuffer()), sig.utf16); if (vivant) setVue({ kind: 'texte', texte: t, coupe: b.size > 2 * GARDE_MO }); return; }
      if (vivant) setVue({ kind: 'aucun' });
    })();
    return () => { vivant = false; if (u) URL.revokeObjectURL(u); };
  }, [doc.id]);
  const telecharger = async () => { if (suspect && !(await confirm({ title: 'Télécharger ce document signalé ?', danger: true, ok: 'Télécharger quand même', body: `« ${doc.nom} » a été signalé par la protection des importations (${(doc.garde.notes || []).join(' ; ') || 'contenu dangereux'}). Ne l’ouvrez que si vous connaissez son origine.` }))) return; download(doc); };
  return (
    <Sheet wide title={doc.nom} sub={`${fmtSize(doc.taille)} · ajouté le ${fmtDate(doc.date)}`} onClose={onClose} footer={<><Btn onClick={telecharger}>⬇ Télécharger</Btn><Btn kind="primary" onClick={onClose}>Fermer</Btn></>}>
      {err ? <Notice tone="bad">{err}</Notice> : !vue ? <div className="text-sm text-ink2">Chargement…</div>
        : vue.kind === 'bloque' ? <Notice tone="bad" title="🛡 Document signalé : aperçu désactivé"><div>{(doc.garde.notes || []).join(' ; ') || 'Contenu actif ou type dangereux.'}</div><div>Retirez-le (Paramètres › Sécurité des importations) ou remplacez-le par une version propre.</div></Notice>
          : vue.kind === 'image' ? <img src={vue.url} alt={doc.nom} style={{ maxWidth: '100%', maxHeight: '75vh', display: 'block', margin: '0 auto' }} />
            : vue.kind === 'pdf' ? <iframe title={doc.nom} src={vue.url} referrerPolicy="no-referrer" style={{ width: '100%', height: '75vh', border: '1px solid var(--line)', borderRadius: 6, background: '#fff' }} />
              : vue.kind === 'texte' ? <><pre className="doc-texte" data-doc-texte="">{vue.texte}</pre>{vue.coupe ? <p className="help">Aperçu limité aux 2 premiers Mo : téléchargez le fichier pour le lire en entier.</p> : null}</>
                : <Empty>Aperçu indisponible pour ce type de fichier : utilisez « Télécharger ».</Empty>}
    </Sheet>
  );
}

const DOC_ACCEPT = 'application/pdf,image/*,.pdf,.doc,.docx,.odt,.xls,.xlsx,.ods,.csv,.txt,.json,text/*';
// date de révision / version d'un document (FT, FDS) : affichée, et corrigeable sur les fiches produit
function DocRevision({ d, editable, avertir }) {
  const { act } = useApp(); const [ed, setEd] = useState(false); const [r, setR] = useState(d.revision || ''); const [v, setV] = useState(d.version || '');
  if (ed) return <span className="inline-flex flex-wrap items-center gap-1" data-doc-revision=""><input className="inp" type="date" style={{ width: 150, minHeight: 30, padding: '2px 6px' }} value={r} onChange={(e) => setR(e.target.value)} aria-label="Date de révision du document" /><input className="inp" style={{ width: 80, minHeight: 30, padding: '2px 6px' }} value={v} onChange={(e) => setV(e.target.value)} placeholder="version" aria-label="Version du document" /><Btn size="sm" kind="primary" onClick={() => { const x = act((db) => ficheDocReviser(db, d.id, { revision: r, version: v }), 'Révision du document enregistrée.'); if (x && x.ok) setEd(false); }}>OK</Btn><Btn size="sm" kind="ghost" onClick={() => setEd(false)}>Annuler</Btn></span>;
  const txt = [d.revision ? `rév. ${fmtDate(d.revision)}` : '', d.version ? `v${String(d.version).replace(/^v/i, '')}` : ''].filter(Boolean).join(' · ');
  if (!editable) return txt ? <Chip>{txt}</Chip> : null;
  return <button type="button" className={cx('chip', !txt && avertir && 'chip-warn')} onClick={() => { setR(d.revision || ''); setV(d.version || ''); setEd(true); }} title="Corriger la date de révision ou la version">{txt || (avertir ? 'date de révision ?' : 'dater')} ✎</button>;
}
// filtre / extra (0.34.0-alpha.1) : documents montés (ceux d'un partenaire d'une entrée de moûts) et champs donnés aux fichiers ajoutés
function DocsPanel({ cible, kind = 'op', locked, deposer: deposerPerso, aide, filtre, extra, inputLabel, catDefaut }) {
  const { db, act } = useApp(); const tous = docsOf(db, cible.type, cible.id).filter((d) => !filtre || filtre(d)); const list = tous.filter((d) => !d.archive); const arch = tous.filter((d) => d.archive).sort((a, b) => String(b.revision || b.date).localeCompare(String(a.revision || a.date)));
  const { add, download, remove } = useDocActions();
  const cats = DOC_CATS[kind] || DOC_CATS.op; const [cat, setCat] = useState(catDefaut && cats.some((c) => c[0] === catDefaut) ? catDefaut : cats[0][0]); const [view, setView] = useState(null); const [busy, setBusy] = useState(false);
  const revisable = kind === 'produit' || kind === 'produitHygiene' || kind === 'produitMaintenance';
  const deposer = async (fs) => { if (!fs.length) return; if (deposerPerso) { deposerPerso(fs); return; } setBusy(true); await add(fs, cible, cat, extra); setBusy(false); };
  const dep = useDepot(deposer, { disabled: locked || busy }); // tout le bloc accepte le dépôt (liste comprise)
  const ligne = (d, ancien) => (
    <li key={d.id} className={cx('flex flex-wrap items-center gap-2 px-3 py-2 text-sm', ancien && 'opacity-80')}>
      <span aria-hidden="true">{docIcon(d.mime)}</span>
      <button type="button" className="linkish min-w-0 truncate" style={{ maxWidth: '100%' }} onClick={() => setView(d)} title="Ouvrir">{d.nom}</button>
      <Chip>{docCatLabel(kind, d.cat)}</Chip><GardeChip d={d} />{revisable && ['fds', 'ft'].includes(d.cat) ? <DocRevision d={d} editable={!locked && !ancien} avertir={kind === 'produit'} /> : d.revision ? <DocRevision d={d} /> : null}
      <span className="text-xs text-ink2">{fmtSize(d.taille)} · {ancien ? `archivé le ${fmtDate(d.archive)}` : fmtDate(d.date)}</span>
      <span className="ml-auto flex gap-1">{ancien && !locked ? <Btn size="sm" onClick={() => act((x) => ficheDocArchiver(x, d.id, false), 'Version rétablie : elle est de nouveau en vigueur.')} title="Remettre cette version en vigueur">Rétablir</Btn> : null}{!ancien && revisable && !locked && ['fds', 'ft'].includes(d.cat) ? <Btn size="sm" kind="ghost" onClick={() => act((x) => ficheDocArchiver(x, d.id, true), 'Document archivé (versions précédentes).')} title="Ranger dans les versions précédentes">Archiver</Btn> : null}<Btn size="sm" onClick={() => download(d)} aria-label={`Télécharger ${d.nom}`}>⬇</Btn>{!locked ? <Btn size="sm" kind="danger" onClick={() => remove(d)} aria-label={`Retirer ${d.nom}`}>✕</Btn> : null}</span>
    </li>);
  return (
    <div className="space-y-2" {...dep.props} data-docs-panel="">
      {list.length ? <ul className="divide-y divide-[var(--line)] rounded-md border border-line">{list.map((d) => ligne(d, false))}</ul> : <div className="text-sm text-ink2">Aucun document joint.</div>}
      {arch.length ? <details className="rounded-md border border-line" data-docs-archives=""><summary className="cursor-pointer px-3 py-2 text-sm">Versions précédentes archivées <Chip>{arch.length}</Chip></summary><ul className="divide-y divide-[var(--line)] border-t border-line">{arch.map((d) => ligne(d, true))}</ul></details> : null}
      {!locked ? <div className="flex flex-wrap items-center gap-2">
        {deposerPerso ? null : <div style={{ minWidth: 220 }}><SI plain value={cat} onChange={setCat} options={cats.map(([v, l]) => ({ value: v, label: l }))} aria-label="Type de document" /></div>}
        <ZoneDepot onFiles={deposer} depot={dep} busy={busy} kind="primary" accept={DOC_ACCEPT} inputLabel={inputLabel} label={deposerPerso ? 'Déposer FT, FDS, certificats…' : 'Joindre des fichiers'} sub={deposerPerso ? 'lus pour reconnaître le type et la date de révision' : undefined} />
        <span className="help w-full">{aide || <>PDF, photos, documents… conservés dans ce navigateur (sauvegarde complète : Paramètres › 💾 Sauvegarde &amp; Drive).</>}</span>
      </div> : null}
      {view ? <DocViewer doc={view} onClose={() => setView(null)} /> : null}
    </div>
  );
}
// Documents choisis pendant la saisie d'une opération, avant qu'elle existe : le fichier est rangé tout de suite dans ce navigateur,
// sa fiche (métadonnées) est créée avec l'opération validée ou planifiée (docsJoindre) ; formulaire fermé sans enregistrer → fichiers effacés
function DocsAttente({ items: tous, onChange, kind = 'op', filtre, extra, inputLabel, catDefaut }) {
  const items = filtre ? tous.filter(filtre) : tous;
  const { toast } = useApp(); const cats = DOC_CATS[kind] || DOC_CATS.op; const [cat, setCat] = useState(catDefaut && cats.some((c) => c[0] === catDefaut) ? catDefaut : cats[0][0]); const [busy, setBusy] = useState(false);
  const deposer = async (fs) => {
    if (!fs.length) return; setBusy(true); const plus = [];
    for (const file of fs) {
      if (file.size > DOC_MAX) { toast(`« ${file.name} » dépasse ${fmtSize(DOC_MAX)} : non joint.`, 'bad'); continue; }
      const id = newDocId();
      try { await docPut(id, file); } catch (er) { toast('Impossible d’enregistrer le fichier dans ce navigateur (stockage indisponible ou plein).', 'bad'); break; }
      plus.push({ id, nom: gardeNomPropre(file.name), mime: file.type, taille: file.size, cat, date: todayISO(), garde: gardeResume(GARDE_VERDICTS.get(file)), ...(extra || {}) });
    }
    setBusy(false); if (plus.length) onChange((L) => [...L, ...plus]);
  };
  const dep = useDepot(deposer, { disabled: busy });
  const retirer = (x) => { docDel(x.id).catch(() => { /* déjà absent */ }); onChange((L) => L.filter((y) => y.id !== x.id)); };
  return (
    <div className="space-y-2" data-docs-attente="" {...dep.props}>
      {items.length ? <ul className="divide-y divide-[var(--line)] rounded-md border border-line">{items.map((d) => (
        <li key={d.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm">
          <span aria-hidden="true">{docIcon(d.mime)}</span><span className="min-w-0 truncate" style={{ maxWidth: '100%' }}>{d.nom}</span>
          <Chip>{docCatLabel(kind, d.cat)}</Chip><span className="text-xs text-ink2">{fmtSize(d.taille)}</span>
          <span className="ml-auto"><Btn size="sm" kind="danger" onClick={() => retirer(d)} aria-label={`Retirer ${d.nom}`}>✕</Btn></span>
        </li>))}</ul> : null}
      <div className="flex flex-wrap items-center gap-2">
        <div style={{ minWidth: 220 }}><SI plain value={cat} onChange={setCat} options={cats.map(([v, l]) => ({ value: v, label: l }))} aria-label="Type de document" /></div>
        <ZoneDepot onFiles={deposer} depot={dep} busy={busy} accept={DOC_ACCEPT} inputLabel={inputLabel} label="Joindre des fichiers" />
      </div>
    </div>
  );
}
// Bouton « 📎 n » qui ouvre la liste des documents d'une opération ou d'un arrivage
function DocsButton({ cible, kind, title }) {
  const { db, openDocs } = useApp(); const n = docsOf(db, cible.type, cible.id).filter((d) => !d.archive).length; // versions archivées non comptées
  return <Btn size="sm" kind={n ? undefined : 'ghost'} onClick={(e) => { e.stopPropagation(); openDocs(cible, kind, title); }} title={n ? `${n} document(s) joint(s)` : 'Joindre des documents'} aria-label={`Documents${title ? ' — ' + title : ''}`}>📎{n ? ` ${n}` : ''}</Btn>;
}
function DocsSheet({ cible, kind, title, onClose }) {
  const { db } = useApp(); const locked = cible.type === 'op' ? (() => { const o = db.ops.find((x) => x.id === cible.id); return !!(o && isLocked(db, o.date)); })() : false;
  const [depot, setDepot] = useState(null); const intrant = cible.type === 'produit'; // FT / FDS d'un intrant : lues, datées, l'ancienne version archivée (0.20.0-alpha.1)
  return <Sheet title="Documents joints" sub={title} onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Fermer</Btn>}><DocsPanel cible={cible} kind={kind} locked={locked} deposer={intrant ? setDepot : undefined} aide={intrant ? 'Chaque fichier est lu : type (FDS, fiche technique…), date de révision ; une version plus récente remplace la précédente, qui reste dans les versions archivées.' : undefined} />{locked ? <div className="help mt-2">Campagne figée : consultation seule.</div> : null}{depot ? <FichesDepot fichiers={depot} cible={cible} onClose={() => setDepot(null)} /> : null}</Sheet>;
}

/* ---------- logo : redimensionné automatiquement (600 × 240 px maximum) ---------- */
function resizeLogo(file, maxW = 600, maxH = 240) {
  return new Promise((res, rej) => {
    const rd = new FileReader();
    rd.onload = () => {
      const img = new Image();
      img.onload = () => {
        const nw = img.naturalWidth || maxW, nh = img.naturalHeight || maxH; const k = Math.min(1, maxW / nw, maxH / nh);
        const w = Math.max(1, Math.round(nw * k)), h = Math.max(1, Math.round(nh * k));
        const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h);
        let url = c.toDataURL('image/png'); if (url.length > 350000) url = c.toDataURL('image/jpeg', 0.9);
        res({ url, w, h });
      };
      img.onerror = () => rej(new Error('Image illisible : utilisez un PNG, JPG ou SVG.'));
      img.src = rd.result;
    };
    rd.onerror = () => rej(rd.error); rd.readAsDataURL(file);
  });
}
const CompanyLogo = ({ maxH = 48, maxW = 170 }) => { const { db } = useApp(); const e = db.entreprise || {}; return e.logo ? <img src={e.logo} alt={e.nom || 'Logo'} style={{ maxHeight: maxH, maxWidth: maxW, objectFit: 'contain', display: 'block' }} /> : null; };

function EntrepriseView() {
  const { db, act, toast, confirm } = useApp(); const e = db.entreprise || {}; const ref = useRef(null);
  const [nom, setNom] = useState(e.nom || ''); const [adr, setAdr] = useState(e.adresse || ''); const [ids, setIds] = useState(e.identifiants || ''); const [orph, setOrph] = useState(null);
  useEffect(() => { setNom(e.nom || ''); setAdr(e.adresse || ''); }, [e.nom, e.adresse]);
  const docs = db.docs || []; const total = sum(docs, (d) => d.taille);
  const logoDe = async (f) => { if (!f) return; try { const r = await resizeLogo(f); act((d) => entrepriseSet(d, { logo: r.url, logoW: r.w, logoH: r.h }), `Logo enregistré (${r.w} × ${r.h} px).`); } catch (er) { toast(er.message, 'bad'); } };
  const verifier = useGarde(); // logo vérifié (type réel, taille, SVG redessiné en PNG)
  const onLogo = async (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return; const ok = await verifier([f], 'logo'); if (ok[0]) logoDe(ok[0]); };
  const depLogo = useDepot((fs) => logoDe(fs[0]), { multiple: false, accept: 'image/*,.svg', refus: 'Le logo doit être une image (PNG, JPG ou SVG).', garde: 'logo' });
  const scan = async () => { try { const keys = await docKeys(); const ids = new Set(docs.map((d) => d.id)); setOrph(keys.filter((k) => !ids.has(k))); } catch (er) { toast('Stockage des documents indisponible.', 'bad'); } };
  const clean = async () => { if (!orph || !orph.length) return; if (!(await confirm({ title: `Supprimer ${orph.length} fichier(s) orphelin(s) ?`, body: 'Ces fichiers ne sont plus rattachés à aucune opération ni aucun arrivage.', ok: 'Supprimer', danger: true }))) return; for (const k of orph) { try { await docDel(k); } catch (er) { /* ignoré */ } } setOrph([]); toast('Fichiers orphelins supprimés.'); };
  return (
    <div className="space-y-6">
      <Sec title="Identité de la société (en-tête des fiches et rapports)">
        <div className="card grid gap-4 p-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
          <div className="space-y-3">
            <Field label="Nom de l’entreprise"><input className="inp" value={nom} onChange={(ev) => setNom(ev.target.value)} onBlur={() => nom !== (e.nom || '') && act((d) => entrepriseSet(d, { nom: nom.trim() }), 'Nom enregistré.')} placeholder="ex. Champagne …" /></Field>
            <Field label="Adresse / mentions"><textarea className="inp" value={adr} onChange={(ev) => setAdr(ev.target.value)} onBlur={() => adr !== (e.adresse || '') && act((d) => entrepriseSet(d, { adresse: adr }), 'Adresse enregistrée.')} /></Field>
            <Field label="Identifiants officiels (facultatif)" help="Imprimés sur les bons de pesée et de pressoir : n° CVI, n° d’accise, n° interprofessionnel…"><input className="inp" value={ids} onChange={(ev) => setIds(ev.target.value)} onBlur={() => ids !== (e.identifiants || '') && act((d) => entrepriseSet(d, { identifiants: ids.trim().slice(0, 300) }), 'Identifiants enregistrés.')} placeholder="ex. CVI 51… · Accise FR0…" aria-label="Identifiants officiels" /></Field>
          </div>
          <div>
            <span className="lbl">Logo</span>
            <div {...depLogo.props} className={cx('logo-depot flex min-h-[96px] items-center justify-center rounded-md border border-dashed border-line bg-white p-3', depLogo.sur && 'sur')} data-zone-depot="logo">{depLogo.sur ? <span className="text-sm font-semibold" style={{ color: '#333' }}>Lâchez l’image pour en faire le logo</span> : e.logo ? <img src={e.logo} alt="Logo de l’entreprise" style={{ maxHeight: 90, maxWidth: '100%', objectFit: 'contain' }} /> : <span className="text-sm text-ink2">Aucun logo — glissez-déposez une image ici</span>}</div>
            <div className="mt-2 flex flex-wrap gap-2"><Btn kind="primary" onClick={() => ref.current && ref.current.click()}>{e.logo ? 'Changer le logo' : 'Télécharger le logo'}</Btn>{e.logo ? <Btn kind="danger" onClick={() => act((d) => entrepriseSet(d, { logo: '', logoW: 0, logoH: 0 }), 'Logo retiré.')}>Retirer</Btn> : null}</div>
            <input ref={ref} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif" hidden onChange={onLogo} aria-label="Fichier du logo" />
            <p className="help">PNG, JPG ou SVG. Le logo est redimensionné automatiquement (600 × 240 px maximum) puis ajusté à la case d’en-tête de chaque fiche et rapport.{e.logoW ? ` Taille actuelle : ${e.logoW} × ${e.logoH} px.` : ''}</p>
          </div>
        </div>
      </Sec>
      <Sec title="Langue de l’interface"><div className="card p-4" data-langue-societe=""><LangueChoix /><p className="help mt-2">Réglage de cet appareil (chaque personne choisit la sienne). Français, English, Español, Italiano, Deutsch, Português : la traduction se fait par étapes ; ce qui n’est pas encore traduit reste en français. Les données saisies et les registres exportés ne sont pas traduits.</p></div></Sec>
      <Sec title="Région viticole"><div className="card p-4" data-region-societe=""><RegionChoix /></div></Sec>
      <OperateursSection />
      <Sec title="Documents joints">
        <div className="card space-y-3 p-4">
          <dl className="kv"><dt>Documents</dt><dd>{docs.length} ({fmtSize(total)}) — {docs.filter((d) => d.cible.type === 'op').length} sur des opérations{docs.some((d) => d.cible.type === 'prev') ? `, ${docs.filter((d) => d.cible.type === 'prev').length} sur des opérations à réaliser` : ''}, {docs.filter((d) => d.cible.type === 'arrivage').length} sur des arrivages d’intrants{docs.some((d) => d.cible.type === 'produitHygiene') ? `, ${docs.filter((d) => d.cible.type === 'produitHygiene').length} sur des produits d’hygiène` : ''}{docs.some((d) => d.cible.type === 'produit') ? `, ${docs.filter((d) => d.cible.type === 'produit').length} sur des produits œnologiques (FT, FDS…)` : ''}{docs.some((d) => d.archive) ? ` (dont ${docs.filter((d) => d.archive).length} version(s) archivée(s))` : ''}{docs.some((d) => d.cible.type === 'bareme') ? `, ${docs.filter((d) => d.cible.type === 'bareme').length} de barèmes de jaugeage` : ''}</dd></dl>
          <p className="help">Les fichiers sont conservés dans ce navigateur et sont inclus dans la <b>sauvegarde complète</b> (Paramètres › 💾 Sauvegarde & Drive), avec la base et le logo.</p>
          <div className="flex flex-wrap gap-2"><Btn onClick={scan}>Rechercher les fichiers orphelins</Btn>{orph && orph.length ? <Btn kind="danger" onClick={clean}>Supprimer {orph.length} fichier(s) orphelin(s)</Btn> : orph ? <Chip tone="ok">aucun fichier orphelin</Chip> : null}</div>
        </div>
      </Sec>
    </div>
  );
}
