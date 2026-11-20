/* ============ SAUVEGARDE & SYNCHRONISATION : fichier complet (base + documents + logo), Drive ============ */
// (0.17.0-alpha.1 : la sauvegarde « en ligne, avec cette page » dans le compte Claude est retirée ; meta.derniereEnLigne des bases anciennes reste lue)
// Format « tout en un », lisible par toutes les versions : { format, formatVersion, appVersion, exporteLe, contenu, db, fichiers: [{ id, nom, mime, taille, b64 }] }
const SAUV_FORMAT = 'oenotrack-sauvegarde'; const SAUV_VERSION = 1;
const b64FromBytes = (bytes) => { let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(bin); };
const bytesFromB64 = (b64) => { const bin = atob(b64 || ''); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i += 1) u[i] = bin.charCodeAt(i); return u; };
const DRIVES = [
  { id: 'gdrive', nom: 'Google Drive', url: 'https://drive.google.com/drive/my-drive', appli: 'Google Drive pour ordinateur', dossier: 'lecteur « Google Drive » › Mon Drive', mobile: 'l’application Fichiers (iPhone, iPad) ou le sélecteur Android, rubrique Drive' },
  { id: 'onedrive', nom: 'OneDrive', url: 'https://onedrive.live.com/', appli: 'OneDrive (déjà intégré à Windows)', dossier: 'dossier « OneDrive » de l’Explorateur', mobile: 'l’application Fichiers (iPhone, iPad) ou le sélecteur Android, rubrique OneDrive' },
  { id: 'dropbox', nom: 'Dropbox', url: 'https://www.dropbox.com/home', appli: 'Dropbox pour ordinateur', dossier: 'dossier « Dropbox »', mobile: 'l’application Fichiers (iPhone, iPad) ou le sélecteur Android, rubrique Dropbox' },
  { id: 'icloud', nom: 'iCloud Drive', url: 'https://www.icloud.com/iclouddrive/', appli: 'iCloud (Mac) ou iCloud pour Windows', dossier: '« iCloud Drive » dans le Finder ou l’Explorateur', mobile: 'l’application Fichiers, rubrique iCloud Drive' },
  { id: 'kdrive', nom: 'kDrive', url: 'https://kdrive.infomaniak.com/', appli: 'kDrive pour ordinateur (Infomaniak)', dossier: 'dossier « kDrive »', mobile: 'l’application Fichiers (iPhone, iPad) ou le sélecteur Android, rubrique kDrive' },
  { id: 'pcloud', nom: 'pCloud', url: 'https://my.pcloud.com/', appli: 'pCloud Drive', dossier: 'lecteur « pCloud Drive »', mobile: 'l’application Fichiers (iPhone, iPad) ou le sélecteur Android, rubrique pCloud' },
];

const B64_CACHE = new Map();
async function buildSauvegarde(db0, marque, extra) {
  const db = { ...db0, meta: { ...db0.meta, [marque || 'derniereExport']: todayISO() } }; // la sauvegarde se sait sauvegardée
  const fichiers = []; const manquants = [];
  for (const d of (db.docs || [])) {
    let b = null; try { b = await docGet(d.id); } catch (e) { b = null; }
    if (!b) { manquants.push(d.nom); continue; }
    const ck = `${d.id}:${b.size}`; let b64 = B64_CACHE.get(ck); if (!b64) { b64 = b64FromBytes(await blobToBytes(b)); B64_CACHE.set(ck, b64); } // déjà encodé : la synchronisation reste rapide
    fichiers.push({ id: d.id, nom: d.nom, mime: d.mime || b.type || '', taille: b.size, b64 });
  }
  const head = { format: SAUV_FORMAT, formatVersion: SAUV_VERSION, app: APP_ID, appVersion: APP_VERSION, schema: db.schema, exporteLe: new Date().toISOString(),
    contenu: { contenants: db.contenants.length, lots: db.lots.length, operations: db.ops.length, documents: fichiers.length, logo: !!(db.entreprise && db.entreprise.logo) }, ...(extra || {}) };
  return { text: JSON.stringify({ ...head, db, fichiers }), head, manquants };
}
// Lit toute sauvegarde Œnotrack, quelle que soit sa version : fichier complet, base seule (.json des versions précédentes,
// « Cuverie champenoise » compris) ou ancienne sauvegarde de documents
function lireSauvegarde(text) {
  let j; try { j = JSON.parse(text); } catch (e) { throw new Error('Fichier illisible : ce n’est pas une sauvegarde Œnotrack (JSON attendu).'); }
  if (j && j.format === SAUV_FORMAT) return { kind: 'complet', db: importObj(j.db), fichiers: Array.isArray(j.fichiers) ? j.fichiers : [], head: j, recente: num(j.formatVersion) > SAUV_VERSION };
  if (j && j.kind === 'documents' && Array.isArray(j.files)) return { kind: 'documents', fichiers: j.files.filter((x) => x && x.meta).map((x) => ({ ...x.meta, b64: x.b64 })) };
  return { kind: 'base', db: importObj(j), fichiers: [], head: { appVersion: (j.meta && j.meta.appVersion) || (j.app === 'cuverie-champenoise' || (j.schema || 1) < 2 ? 'Cuverie champenoise' : 'version précédente') } };
}
async function ecrireFichiers(fichiers) { let n = 0; for (const x of fichiers) { try { await docPut(x.id, new Blob([bytesFromB64(x.b64)], { type: x.mime || '' })); n += 1; } catch (e) { /* stockage plein ou indisponible */ } } return n; }
const pl = (n, s, p) => `${n} ${n > 1 ? (p || `${s}s`) : s}`;
const resumeBase = (db) => `${pl(db.contenants.length, 'contenant')} · ${pl(db.lots.length, 'lot')} · ${pl(db.ops.length, 'opération')} · ${pl((db.docs || []).length, 'document')}`;
const ilYa = (iso) => { if (!iso) return null; const d = Math.round((Date.parse(todayISO()) - Date.parse(String(iso).slice(0, 10))) / 86400000); return d <= 0 ? 'aujourd’hui' : d === 1 ? 'hier' : `il y a ${d} jours`; };
const joursDepuis = (iso) => (iso ? Math.round((Date.parse(todayISO()) - Date.parse(String(iso).slice(0, 10))) / 86400000) : Infinity);
const derniereSauvegarde = (db) => [db.meta.derniereExport, db.meta.derniereEnLigne, db.meta.derniereSync].filter(Boolean).sort().pop() || null;

// Restauration commune (fichier, Drive) : confirmation détaillée, fichiers d'abord, puis la base
function useRestaurer() {
  const { db, confirm, toast, replaceDb, act } = useApp();
  return async (text, source) => {
    let s; try { s = lireSauvegarde(text); } catch (er) { toast(er.message, 'bad'); return false; }
    if (s.kind === 'documents') {
      if (!(await confirm({ title: 'Ajouter ces documents ?', body: `${s.fichiers.length} document(s) d’une ancienne sauvegarde de documents seront ajoutés à la base actuelle (rien n’est remplacé).`, ok: 'Ajouter' }))) return false;
      const n = await ecrireFichiers(s.fichiers); act((d) => { s.fichiers.forEach((x) => { const { b64, ...meta } = x; if (!(d.docs || []).some((y) => y.id === meta.id)) docMetaAdd(d, meta); }); return okr(); }, `${n} document(s) restauré(s).`); return true;
    }
    const sans = s.kind === 'base' ? (s.db.docs || []).length : 0;
    const ok = await confirm({ title: `Restaurer cette sauvegarde ${source || ''} ?`.replace(/\s+\?/, ' ?'), danger: true, ok: 'Restaurer',
      body: `${s.head && s.head.exporteLe ? `Sauvegarde du ${fmtDate(String(s.head.exporteLe).slice(0, 10))}, ` : ''}créée avec ${!s.head || !s.head.appVersion || s.head.appVersion === 'version précédente' ? 'une version précédente d’Œnotrack' : s.head.appVersion === 'Cuverie champenoise' ? '« Cuverie champenoise »' : `Œnotrack ${versionAffichee(s.head.appVersion)}`} : ${resumeBase(s.db)}${s.kind === 'complet' ? ` (${pl(s.fichiers.length, 'fichier joint inclus', 'fichiers joints inclus')})` : ''}. Elle remplace TOUTES les données actuelles de ce navigateur (${resumeBase(db)}).${s.recente ? ' Elle vient d’une version plus récente : tout est conservé, les nouveautés seront utilisables en mettant Œnotrack à jour.' : ''}${sans ? ` Les ${sans} document(s) cités ne sont pas dans ce fichier (base seule) : ils restent ceux de ce navigateur.` : ''}` });
    if (!ok) return false;
    const n = s.fichiers.length ? await ecrireFichiers(s.fichiers) : 0;
    replaceDb(s.db, `Sauvegarde restaurée${n ? ` avec ${n} document(s)` : ''}.`); return true;
  };
}

function SauvegardeView() {
  const { db, act, toast, resetEmpty, loadSample, cloud } = useApp(); const fileRef = useRef(null); const restaurer = useRestaurer();
  const [busy, setBusy] = useState(''); const [drive, setDrive] = useState(() => { try { return window.localStorage.getItem('oenotrack-drive') || 'gdrive'; } catch (e) { return 'gdrive'; } });
  const docs = db.docs || []; const tailleDocs = sum(docs, (d) => d.taille); const der = derniereSauvegarde(db); const rappel = num(db.settings.rappelSauvegardeJours) || 7;
  const exporter = async () => {
    setBusy('export');
    try {
      const b = await buildSauvegarde(db); const name = `oenotrack-sauvegarde-${todayISO()}.json`;
      const r = await saveFile(name, new Blob([b.text], { type: 'application/json' }), 'application/json');
      if (r.ok) act((d) => { d.meta.derniereExport = todayISO(); return okr(); }, `Sauvegarde complète enregistrée : ${name} (${fmtSize(b.text.length)}, ${b.head.contenu.documents} document(s))${b.manquants.length ? ` — ${b.manquants.length} fichier(s) introuvable(s) dans ce navigateur` : ''}.`);
      else if (r.declined) toast('Sauvegarde annulée.'); else toast(failMsg(r), 'bad');
    } catch (er) { toast('Sauvegarde impossible (stockage des documents indisponible ?).', 'bad'); }
    setBusy('');
  };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; const rd = new FileReader(); rd.onload = () => restaurer(String(rd.result), `« ${f.name} »`); rd.onerror = () => toast('Lecture du fichier impossible.', 'bad'); rd.readAsText(f); };
  const pickDrive = (id) => { setDrive(id); try { window.localStorage.setItem('oenotrack-drive', id); } catch (e) { /* ignoré */ } };
  return (
    <div className="space-y-5">
      <div className={cx('card flex flex-wrap items-center gap-x-6 gap-y-2 p-4', joursDepuis(der) > rappel && 'sauv-alerte')}>
        <div><div className="lbl mb-0">Dernière sauvegarde</div><div className="text-lg font-semibold">{der ? `${fmtDate(der)} (${ilYa(der)})` : 'jamais'}</div></div>
        <div><div className="lbl mb-0">Votre base</div><div className="text-sm">{resumeBase(db)}{tailleDocs ? ` (${fmtSize(tailleDocs)})` : ''}{db.entreprise && db.entreprise.logo ? ' · logo' : ''}</div></div>
        <label className="ml-auto flex items-center gap-2 text-sm">Me rappeler de sauvegarder tous les
          <select className="inp" style={{ width: 'auto' }} value={rappel} onChange={(e) => act((d) => { d.settings.rappelSauvegardeJours = num(e.target.value); return okr(); })} aria-label="Fréquence du rappel de sauvegarde">{[1, 3, 7, 14, 30].map((n) => <option key={n} value={n}>{n} jour{n > 1 ? 's' : ''}</option>)}</select></label>
        <p className="help w-full">Chaque modification est déjà enregistrée automatiquement dans ce navigateur. Une sauvegarde protège en cas de changement d’ordinateur, de navigateur ou d’effacement des données du site.</p>
      </div>

      <CloudCard />
      {cloud.lie ? <details className="card sync-guide p-4"><summary>Synchroniser par fichier (sans connexion au Drive)</summary><div className="mt-3"><DriveSyncCard drive={drive} setDrive={pickDrive} /></div></details> : <DriveSyncCard drive={drive} setDrive={pickDrive} />}

      <div className="sauv-grid">
        <section className="card sauv-card p-4" aria-labelledby="sv1">
          <div className="sauv-ic" aria-hidden="true">💾</div><h3 id="sv1" className="text-lg font-semibold">Fichier complet</h3>
          <p className="text-sm">Un seul fichier contient <b>tout</b> : la base, les documents joints (certificats, FDS, fiches remplies, photos) et le logo.</p>
          <div className="flex flex-wrap gap-2"><Btn kind="primary" disabled={!!busy} onClick={exporter}>{busy === 'export' ? 'Préparation…' : '⬇ Exporter la base complète'}</Btn><Btn onClick={() => fileRef.current && fileRef.current.click()}>⬆ Importer une sauvegarde</Btn></div>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} aria-label="Fichier de sauvegarde à importer" />
          <p className="help">Compatible avec toutes les versions d’Œnotrack : les sauvegardes des versions précédentes (et de « Cuverie champenoise ») s’importent telles quelles.</p>
        </section>
      </div>

      <Sec title="Repartir de zéro">
        <div className="card flex flex-wrap items-center gap-2 p-4"><Btn onClick={loadSample}>Recharger le jeu d’exemple</Btn><Btn kind="danger" onClick={resetEmpty}>Réinitialiser à vide</Btn><span className="help">Pensez à exporter la base complète avant.</span></div>
      </Sec>
    </div>
  );
}

// Pied de page : version et nouveautés
function VersionSheet({ onClose }) {
  const { db } = useApp(); const m = db.meta || {};
  return (
    <Sheet title={`Œnotrack ${APP_VERSION}`} sub="Nouveautés et compatibilité des données" onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Fermer</Btn>}>
      <Notice tone="info" title="Vos données suivent toutes les versions">Chaque nouvelle version ouvre les bases et les sauvegardes des versions précédentes, documents joints compris, sans ressaisie. Base créée avec : <b>{versionAffichee(m.creeAvec) || '—'}</b>{(m.versions || []).length > 1 ? <> · ouverte depuis avec : {uniq(m.versions.map(versionAffichee)).join(', ')}</> : null}.</Notice>
      <ol className="mt-4 space-y-3">{CHANGELOG.map((c) => <li key={c.v}><div className="flex flex-wrap items-baseline gap-2"><b>{c.v}</b><span className="text-xs text-ink2">{fmtDate(c.date)}</span>{c.v === APP_VERSION ? <Chip tone="ok">version actuelle</Chip> : null}</div><ul className="ml-5 list-disc text-sm">{c.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></li>)}</ol>
    </Sheet>
  );
}
