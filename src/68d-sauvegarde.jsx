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
// 0.27.0-alpha.1 : lecture protégée (jsonSur : clés piégées retirées, profondeur limitée) ; base nettoyée (gardeBase : logo, noms) ;
// fichiers joints aux identifiants douteux écartés — chaque fichier est ensuite vérifié à l'écriture (ecrireFichiers)
const SAUV_ID_OK = /^[A-Za-z0-9_-]{1,80}$/;
const sauvFichierOk = (x) => !!(x && typeof x === 'object' && typeof x.id === 'string' && SAUV_ID_OK.test(x.id) && typeof x.b64 === 'string');
function lireSauvegarde(text) {
  const js = jsonSur(text); if (!js.ok) throw new Error(js.code === 'json' ? 'Fichier illisible : ce n’est pas une sauvegarde Œnotrack (JSON attendu).' : js.msg);
  const j = js.valeur; const garde = { retires: js.retires, fixes: [], ecartes: 0 };
  const fin = (r) => { if (r.db) garde.fixes.push(...gardeBase(r.db)); return { ...r, garde }; };
  const fich = (L) => { const a = Array.isArray(L) ? L : []; const ok = a.filter(sauvFichierOk); garde.ecartes += a.length - ok.length; return ok; };
  if (j && j.format === SAUV_FORMAT) return fin({ kind: 'complet', db: importObj(j.db), fichiers: fich(j.fichiers), head: j, recente: num(j.formatVersion) > SAUV_VERSION });
  if (j && j.kind === 'documents' && Array.isArray(j.files)) return fin({ kind: 'documents', fichiers: fich(j.files.filter((x) => x && x.meta && typeof x.meta === 'object').map((x) => ({ ...x.meta, b64: x.b64 }))) });
  return fin({ kind: 'base', db: importObj(j), fichiers: [], head: { appVersion: (j.meta && j.meta.appVersion) || (j.app === 'cuverie-champenoise' || (j.schema || 1) < 2 ? 'Cuverie champenoise' : 'version précédente') } });
}
// fichiers d'une sauvegarde (ou du Drive) : vérifiés un par un (garde des importations) avant d'être rangés dans ce navigateur ;
// rapport : { ok: { id: résumé }, refus: [{ id, nom, raisons }] }
async function ecrireFichiers(fichiers, rapport) {
  let n = 0;
  for (const x of fichiers) {
    let octets; try { octets = bytesFromB64(x.b64); } catch (e) { if (rapport) rapport.refus.push({ id: x.id, nom: x.nom, raisons: ['contenu illisible'] }); continue; }
    let v; try { v = await gardeAnalyser(octets, x.nom, 'document', GARDE_OUTILS); } catch (e) { v = { statut: 'refuse', raisons: ['vérification impossible'], avertissements: [] }; }
    if (v.statut === 'refuse') { if (rapport) rapport.refus.push({ id: x.id, nom: x.nom, taille: octets.length, raisons: v.raisons }); continue; }
    try { await docPut(x.id, new Blob([v.octets || octets], { type: v.type || '' })); n += 1; if (rapport) rapport.ok[x.id] = gardeResume(v); } catch (e) { /* stockage plein ou indisponible */ }
  }
  return n;
}
const sauvRapport = () => ({ ok: {}, refus: [] });
// verdicts reportés sur les fiches des documents de la base importée ; refus notés au journal de sécurité
function sauvRapportAppliquer(db, rap, usage) {
  if (!db || !rap) return 0;
  (db.docs || []).forEach((d) => { if (rap.ok[d.id]) d.garde = rap.ok[d.id]; const r = rap.refus.find((y) => y.id === d.id); if (r) d.garde = { statut: 'suspect', le: todayISO(), famille: '', notes: r.raisons.slice(0, 3) }; });
  if (rap.refus.length) gardeJournaliser(db, rap.refus.map((r) => ({ statut: 'refuse', usage: usage || 'sauvegarde', nom: r.nom, taille: r.taille, raisons: r.raisons, appareil: appareilNom() })));
  return rap.refus.length;
}
const sauvGardeMsg = (s, nRefus) => { const g = s.garde || {}; const L = [...(g.retires ? [`${g.retires} clé(s) piégée(s) retirée(s)`] : []), ...(g.fixes || []), ...(g.ecartes ? [`${g.ecartes} fichier(s) joint(s) mal formé(s) écarté(s)`] : []), ...(nRefus ? [`${nRefus} document(s) refusé(s) par la protection des importations`] : [])]; return L.length ? ` 🛡 ${L.join(' ; ')}.` : ''; }; // traduit par le motif « {a} 🛡 {b}. »
const pl = (n, s, p) => `${n} ${n > 1 ? (p || `${s}s`) : s}`;
const resumeBase = (db) => `${pl(db.contenants.length, 'contenant')} · ${pl(db.lots.length, 'lot')} · ${pl(db.ops.length, 'opération')} · ${pl((db.docs || []).length, 'document')}`;
const ilYa = (iso) => { if (!iso) return null; const d = Math.round((Date.parse(todayISO()) - Date.parse(String(iso).slice(0, 10))) / 86400000); return d <= 0 ? 'aujourd’hui' : d === 1 ? 'hier' : `il y a ${d} jours`; };
const joursDepuis = (iso) => (iso ? Math.round((Date.parse(todayISO()) - Date.parse(String(iso).slice(0, 10))) / 86400000) : Infinity);
const derniereSauvegarde = (db) => [db.meta.derniereExport, db.meta.derniereEnLigne, db.meta.derniereSync].filter(Boolean).sort().pop() || null;

// Restauration commune (fichier, Drive) : confirmation détaillée, fichiers d'abord, puis la base
function useRestaurer() {
  const { db, confirm, toast, replaceDb, act } = useApp();
  return async (text0, source) => {
    let text = text0; try { text = await sauvTexteEntree(text0, true); } catch (er) { toast((er && er.message) || 'Fichier chiffré illisible.', 'bad'); return false; } // sauvegarde chiffrée (0.29.0-alpha.1)
    let s; try { s = lireSauvegarde(text); } catch (er) { toast(er.message, 'bad'); return false; }
    if (s.kind === 'documents') {
      if (!(await confirm({ title: 'Ajouter ces documents ?', body: `${s.fichiers.length} document(s) d’une ancienne sauvegarde de documents seront ajoutés à la base actuelle (rien n’est remplacé).`, ok: 'Ajouter' }))) return false;
      const rap = sauvRapport(); const n = await ecrireFichiers(s.fichiers, rap);
      act((d) => { s.fichiers.forEach((x) => { const { b64, ...meta } = x; if (!(d.docs || []).some((y) => y.id === meta.id) && (rap.ok[meta.id] || rap.refus.some((r) => r.id === meta.id))) docMetaAdd(d, { ...meta, nom: gardeNomPropre(meta.nom) }); }); sauvRapportAppliquer(d, rap, 'sauvegarde'); return okr(); }, `${n} document(s) restauré(s).${sauvGardeMsg(s, rap.refus.length)}`); return true;
    }
    const sans = s.kind === 'base' ? (s.db.docs || []).length : 0;
    const ok = await confirm({ title: `Restaurer cette sauvegarde ${source || ''} ?`.replace(/\s+\?/, ' ?'), danger: true, ok: 'Restaurer',
      body: `${s.head && s.head.exporteLe ? `Sauvegarde du ${fmtDate(String(s.head.exporteLe).slice(0, 10))}, ` : ''}créée avec ${!s.head || !s.head.appVersion || s.head.appVersion === 'version précédente' ? 'une version précédente d’Œnotrack' : s.head.appVersion === 'Cuverie champenoise' ? '« Cuverie champenoise »' : `Œnotrack ${versionAffichee(s.head.appVersion)}`} : ${resumeBase(s.db)}${s.kind === 'complet' ? ` (${pl(s.fichiers.length, 'fichier joint inclus', 'fichiers joints inclus')})` : ''}. Elle remplace TOUTES les données actuelles de ce navigateur (${resumeBase(db)}).${s.recente ? ' Elle vient d’une version plus récente : tout est conservé, les nouveautés seront utilisables en mettant Œnotrack à jour.' : ''}${sans ? ` Les ${sans} document(s) cités ne sont pas dans ce fichier (base seule) : ils restent ceux de ce navigateur.` : ''}` });
    if (!ok) return false;
    const rap = sauvRapport(); const n = s.fichiers.length ? await ecrireFichiers(s.fichiers, rap) : 0; const nr = sauvRapportAppliquer(s.db, rap, 'sauvegarde');
    replaceDb(s.db, `Sauvegarde restaurée${n ? ` avec ${n} document(s)` : ''}.${sauvGardeMsg(s, nr)}`, 'Restauration d’une sauvegarde'); return true;
  };
}

// Documents joints (0.48.0-alpha.1 : venus de « Société & opérateurs ») : nombre, taille, fichiers orphelins
function DocumentsJointsSec() {
  const { db, toast, confirm } = useApp(); const [orph, setOrph] = useState(null);
  const docs = db.docs || []; const total = sum(docs, (d) => d.taille);
  const scan = async () => { try { const keys = await docKeys(); const ids = new Set(docs.map((d) => d.id)); setOrph(keys.filter((k) => !ids.has(k))); } catch (er) { toast('Stockage des documents indisponible.', 'bad'); } };
  const clean = async () => { if (!orph || !orph.length) return; if (!(await confirm({ title: `Supprimer ${orph.length} fichier(s) orphelin(s) ?`, body: 'Ces fichiers ne sont plus rattachés à aucune opération ni aucun arrivage.', ok: 'Supprimer', danger: true }))) return; for (const k of orph) { try { await docDel(k); } catch (er) { /* ignoré */ } } setOrph([]); toast('Fichiers orphelins supprimés.'); };
  return (
    <Sec title="Documents joints" data-docs-joints="">
      <div className="card space-y-3 p-4">
        <dl className="kv"><dt>Documents</dt><dd>{docs.length} ({fmtSize(total)}) — {docs.filter((d) => d.cible.type === 'op').length} sur des opérations{docs.some((d) => d.cible.type === 'prev') ? `, ${docs.filter((d) => d.cible.type === 'prev').length} sur des opérations à réaliser` : ''}, {docs.filter((d) => d.cible.type === 'arrivage').length} sur des arrivages d’intrants{docs.some((d) => d.cible.type === 'produitHygiene') ? `, ${docs.filter((d) => d.cible.type === 'produitHygiene').length} sur des produits d’hygiène` : ''}{docs.some((d) => d.cible.type === 'produit') ? `, ${docs.filter((d) => d.cible.type === 'produit').length} sur des produits œnologiques (FT, FDS…)` : ''}{docs.some((d) => d.archive) ? ` (dont ${docs.filter((d) => d.archive).length} version(s) archivée(s))` : ''}{docs.some((d) => d.cible.type === 'bareme') ? `, ${docs.filter((d) => d.cible.type === 'bareme').length} de barèmes de jaugeage` : ''}</dd></dl>
        <p className="help">Les fichiers sont conservés dans ce navigateur et sont inclus dans le fichier complet ci-dessus, avec la base et le logo.</p>
        <div className="flex flex-wrap gap-2"><Btn onClick={scan}>Rechercher les fichiers orphelins</Btn>{orph && orph.length ? <Btn kind="danger" onClick={clean}>Supprimer {orph.length} fichier(s) orphelin(s)</Btn> : orph ? <Chip tone="ok">aucun fichier orphelin</Chip> : null}</div>
      </div>
    </Sec>
  );
}
function SauvegardeView() {
  const { db, act, toast, resetEmpty, loadSample, cloud, confirm } = useApp(); const fileRef = useRef(null); const restaurer = useRestaurer();
  const [drive, setDrive] = useState(() => { try { return window.localStorage.getItem('oenotrack-drive') || 'gdrive'; } catch (e) { return 'gdrive'; } });
  const docs = db.docs || []; const tailleDocs = sum(docs, (d) => d.taille); const der = derniereSauvegarde(db); const rappel = num(db.settings.rappelSauvegardeJours) || 7;
  const { exporter: exporter0, busy: busyE } = useExportComplet(); const busy = busyE ? 'export' : ''; const exporter = () => exporter0(); const chiffre = chiffrementActif(db);
  const exporterClair = async () => { if (await confirm({ title: 'Exporter sans chiffrement ?', body: 'Le fichier sera lisible par toute personne qui l’obtient. À réserver à un transfert immédiat vers un support sûr.', ok: 'Exporter en clair', danger: true })) exporter0({ clair: true }); };
  const verifier = useGarde(); // fichier de sauvegarde vérifié (type réel, taille) avant d'être lu
  const onFile = async (e) => { const f0 = e.target.files && e.target.files[0]; e.target.value = ''; if (!f0) return; const [f] = await verifier([f0], 'sauvegarde'); if (!f) return; let t; try { t = await lectureFichier(f); } catch (er) { toast('Lecture du fichier impossible.', 'bad'); return; } restaurer(t, `« ${f.name} »`); };
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
      <ChiffrementCard />
      <CoffreCard />
      {cloud.lie ? <details className="card sync-guide p-4"><summary>Synchroniser par fichier (sans connexion au Drive)</summary><div className="mt-3"><DriveSyncCard drive={drive} setDrive={pickDrive} /></div></details> : <DriveSyncCard drive={drive} setDrive={pickDrive} />}

      <div className="sauv-grid">
        <section className="card sauv-card p-4" aria-labelledby="sv1">
          <div className="sauv-ic" aria-hidden="true">💾</div><h3 id="sv1" className="text-lg font-semibold">Fichier complet</h3>
          <p className="text-sm">Un seul fichier contient <b>tout</b> : la base, les documents joints (certificats, FDS, fiches remplies, photos) et le logo.</p>
          <div className="flex flex-wrap gap-2"><Btn kind="primary" disabled={!!busy} onClick={exporter}>{busy === 'export' ? 'Préparation…' : chiffre ? '⬇ Exporter la base complète (chiffrée)' : '⬇ Exporter la base complète'}</Btn><Btn onClick={() => fileRef.current && fileRef.current.click()}>⬆ Importer une sauvegarde</Btn>{chiffre ? <Btn kind="ghost" size="sm" disabled={!!busy} onClick={exporterClair}>Exporter sans chiffrement…</Btn> : null}</div>
          <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} aria-label="Fichier de sauvegarde à importer" />
          <p className="help">Compatible avec toutes les versions d’Œnotrack : les sauvegardes des versions précédentes (et de « Cuverie champenoise ») s’importent telles quelles.</p>
        </section>
      </div>

      <DocumentsJointsSec />

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
