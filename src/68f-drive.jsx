/* ============ DRIVE : synchronisation du fichier Œnotrack par glisser-déposer ============ */
// Le fichier Œnotrack (base + documents) vit dans le Drive choisi. Le déposer sur Œnotrack (ou le copier puis Ctrl + V)
// réunit les modifications des deux côtés (fusion à trois voies, voir 32-sync.js). Si le navigateur le permet (Chrome, Edge
// sur ordinateur), Œnotrack garde le lien vers le fichier et le met ensuite à jour tout seul ; sinon « Envoyer vers le Drive ».
const SYNC_DB = 'oenotrack-sync'; const SYNC_KEY = 'oenotrack-sync'; const APPAREIL_KEY = 'oenotrack-appareil';
let _sdb = null;
function sdb() {
  if (_sdb) return _sdb;
  _sdb = new Promise((res, rej) => {
    try { const r = window.indexedDB.open(SYNC_DB, 1); r.onupgradeneeded = () => { const d = r.result; ['instantanes', 'lien'].forEach((n) => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n); }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error || new Error('IndexedDB')); } catch (e) { rej(e); }
  });
  _sdb.catch(() => { _sdb = null; });
  return _sdb;
}
const sdbRun = (store, mode, fn) => sdb().then((d) => new Promise((res, rej) => { const tx = d.transaction(store, mode); const rq = fn(tx.objectStore(store)); tx.oncomplete = () => res(rq ? rq.result : undefined); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); }));
// versions communes (instantanés) : les 8 dernières, pour retrouver l'ancêtre commun d'un fichier reçu
async function snapEcrire(id, db) {
  try {
    const texte = await coffreTexteChiffrer(JSON.stringify(db)); // 0.38.0-alpha.1 : chiffré par le coffre de l'appareil
    await sdbRun('instantanes', 'readwrite', (s) => s.put({ id, date: new Date().toISOString(), db: texte }, id));
    const all = (await sdbRun('instantanes', 'readonly', (s) => s.getAll())) || [];
    for (const x of all.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(8)) await sdbRun('instantanes', 'readwrite', (s) => s.delete(x.id));
  } catch (e) { /* stockage indisponible : la prochaine synchronisation se fera sans version commune */ }
}
const snapLire = async (id) => { try { const x = await sdbRun('instantanes', 'readonly', (s) => s.get(id)); return x ? JSON.parse(await coffreTexteDechiffrer(x.db)) : null; } catch (e) { return null; } };
const lienLire = async () => { try { return (await sdbRun('lien', 'readonly', (s) => s.get('fichier'))) || null; } catch (e) { return null; } };
const lienEcrire = async (h) => { try { await sdbRun('lien', 'readwrite', (s) => (h ? s.put(h, 'fichier') : s.delete('fichier'))); return true; } catch (e) { return false; } };
// identité de cet appareil : marque des identifiants (« op124-k7f ») et nom affiché dans le fichier
const appareilNomDefaut = () => { const u = (window.navigator && navigator.userAgent) || ''; const os = /iPad/.test(u) ? 'iPad' : /iPhone/.test(u) ? 'iPhone' : /Android/.test(u) ? 'Android' : /Mac OS X/.test(u) ? 'Mac' : /Windows/.test(u) ? 'PC Windows' : /Linux/.test(u) ? 'PC Linux' : 'Appareil'; const nv = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Firefox\//.test(u) ? 'Firefox' : /Safari\//.test(u) ? 'Safari' : ''; return `${os}${nv ? ` · ${nv}` : ''}`; };
function appareilInfo() {
  let a = null; try { a = JSON.parse(window.localStorage.getItem(APPAREIL_KEY) || 'null'); } catch (e) { a = null; }
  if (!a || !a.tag) { a = { tag: Math.random().toString(36).slice(2, 5).padEnd(3, '0'), nom: appareilNomDefaut() }; try { window.localStorage.setItem(APPAREIL_KEY, JSON.stringify(a)); } catch (e) { /* ignoré */ } }
  return a;
}
try { NID_SUFFIXE = `-${appareilInfo().tag}`; } catch (e) { /* ignoré */ }
const etatLire = () => { try { return JSON.parse(window.localStorage.getItem(SYNC_KEY) || 'null') || {}; } catch (e) { return {}; } };
const etatEcrire = (x) => { try { window.localStorage.setItem(SYNC_KEY, JSON.stringify(x)); } catch (e) { /* ignoré */ } };
const nowISO = () => new Date().toISOString();
const nouvelIdSync = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const fmtQuand = (iso) => { if (!iso) return ''; const d = new Date(iso); if (isNaN(d)) return ''; return `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`; };
const nomFichierSync = (db) => `Oenotrack-${(norm((db.entreprise && db.entreprise.nom) || db.settings.domaine || 'exploitation').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'exploitation').slice(0, 40)}.json`;
const baseVide = (db) => !!(db.meta && db.meta.exemple) || (!db.ops.length && !db.lots.length && !db.contenants.length);
const lectureFichier = (f) => (typeof f.text === 'function' ? f.text() : new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(String(rd.result)); rd.onerror = () => rej(rd.error); rd.readAsText(f); }));

function useDriveSync({ db, dbRef, applyDb, toast }) {
  const [etat, setEtat0] = useState(etatLire); const etatRef = useRef(etat);
  const setEtat = useCallback((p) => { const n = typeof p === 'function' ? p(etatRef.current) : { ...etatRef.current, ...p }; etatRef.current = n; etatEcrire(n); setEtat0(n); }, []);
  const [lien, setLien0] = useState(null); const lienRef = useRef(null); const setLien = useCallback((l) => { lienRef.current = l; setLien0(l); }, []);
  const [survol, setSurvol] = useState(false); const [rapport, setRapport] = useState(null); const [occupe, setOccupe] = useState('');
  const busy = useRef(false); const empreinte = useMemo(() => syncEmpreinte(db), [db]);
  const [appareil, setAppareil] = useState(appareilInfo);
  const marquer = () => { const d0 = dbRef.current; if (d0.meta.derniereSync !== todayISO()) applyDb({ ...d0, meta: { ...d0.meta, derniereSync: todayISO() } }); };

  const analyser = async (text0, fichier) => {
    const text = await sauvTexteEntree(text0, true); // fichier chiffré (0.29.0-alpha.1) : clé de l'appareil, sinon mot de passe demandé
    const s = lireSauvegarde(text); if (s.kind === 'documents') return { s };
    const sync = (s.head && s.head.sync) || null; const idF = sync && sync.id ? String(sync.id) : `f${hash36(text)}`;
    const chaine = [idF, ...((sync && sync.ancetres) || [])].filter((x, i, a) => x && a.indexOf(x) === i);
    let base = null; for (const id of chaine) { base = await snapLire(id); if (base) break; } // dernière version commune connue
    // sans version commune : un appareil vide ou avec le jeu d'exemple prend la base du Drive ; sinon on réunit
    const L = dbRef.current; const vide = !base && baseVide(L);
    const fusion = vide ? null : syncFusion(base, L, s.db);
    return { s, sync, idF, chaine, base: !!base, baseDb: base, L, vide, fusion, remote: s.db, fichier };
  };
  const ecrire = async (h, dbx) => {
    const e = etatRef.current; const id = nouvelIdSync(); const ap = appareilInfo();
    const anc = [e.syncId, ...(e.lignee || [])].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 20);
    const b = await buildSauvegarde(dbx, 'derniereSync', { sync: { id, ancetres: anc, appareil: ap.tag, appareilNom: ap.nom, ecritLe: nowISO() } });
    const texte = await sauvTexteSortie(dbx, b.text, true); // chiffré si le réglage commun l'exige
    const w = await h.createWritable(); await w.write(texte); await w.close();
    let lm = null; try { lm = (await h.getFile()).lastModified; } catch (er) { lm = Date.now(); }
    await snapEcrire(id, normalizeDb(clone(dbx)));
    setEtat({ fichierNom: h.name || e.fichierNom, syncId: id, lignee: anc, empreinteFichier: syncEmpreinte(dbx), fichierModifie: lm, derniereSync: nowISO(), derniereEcriture: nowISO(), appareilFichier: ap.nom, fichierEcritLe: nowISO(), suspendu: false, exportEnAttente: false, erreur: '' });
    marquer();
  };
  // applique une analyse : « fusion » (réunir), « remplacer » (prendre la base du Drive)
  const appliquerAnalyse = async (a, choix, h, lm) => {
    // d'abord les fichiers joints et la version commune (asynchrone), puis la base en une fois sur l'état le plus récent
    const docsR = new Set(((a.remote && a.remote.docs) || []).map((x) => x.id)); const fich = (a.s.fichiers || []).filter((x) => docsR.has(x.id));
    const rap = sauvRapport(); if (fich.length) await ecrireFichiers(fich, rap); // chaque fichier vérifié (garde des importations)
    await snapEcrire(a.idF, a.remote);
    const L = dbRef.current; if (choix === 'fusion' && a.fusion && a.L !== L) a.fusion = syncFusion(a.baseDb || null, L, a.remote); // saisie faite entre-temps : on refait la fusion
    const nd = choix === 'fusion' && a.fusion ? normalizeDb(clone(a.fusion.db)) : normalizeDb(clone(a.remote));
    sauvRapportAppliquer(nd, rap, 'sauvegarde'); if (choix !== 'fusion' || !a.fusion) { pointRetourEcrire(L, 'Base remplacée par le fichier du Drive'); gardeJournalGarder(L, nd); }
    if (choix === 'fusion' && a.fusion && a.fusion.conflits.length) nd.meta.syncConflits = [...a.fusion.conflits.map((c) => ({ ...c, date: nowISO(), fichier: a.fichier })), ...((L.meta && L.meta.syncConflits) || [])].slice(0, 60);
    else if (L.meta && L.meta.syncConflits && choix === 'fusion') nd.meta.syncConflits = L.meta.syncConflits;
    nd.meta.derniereSync = todayISO();
    setEtat({ fichierNom: a.fichier || etatRef.current.fichierNom, syncId: a.idF, lignee: a.chaine.slice(0, 20), empreinteFichier: syncEmpreinte(a.remote), derniereSync: nowISO(), appareilFichier: (a.sync && a.sync.appareilNom) || '', fichierEcritLe: (a.sync && a.sync.ecritLe) || (a.s.head && a.s.head.exporteLe) || '', suspendu: false, exportEnAttente: false, erreur: '', ...(lm ? { fichierModifie: lm } : {}) });
    applyDb(nd);
    if (h) await lier(h, lm);
    return nd;
  };
  const lier = async (h, lm) => {
    let perm = 'prompt'; try { perm = await h.queryPermission({ mode: 'readwrite' }); } catch (e) { perm = 'erreur'; }
    await lienEcrire(h); setLien({ handle: h, perm, nom: h.name || '' }); if (lm) setEtat({ fichierModifie: lm });
    return perm;
  };
  // fichier déposé, collé ou choisi
  const recevoir = async (file, hp) => {
    if (!file) return;
    if (!/\.json$/i.test(file.name || '') && !/json/i.test(file.type || '')) { toast('Déposez ici le fichier Œnotrack (.json) de votre Drive. Pour joindre un document à une opération, utilisez 📎 Documents.', 'bad'); return; }
    setOccupe('lecture'); let h = null; try { h = hp ? await hp : null; } catch (e) { h = null; } if (h && h.kind !== 'file') h = null;
    // garde des importations (0.27.0-alpha.1) : type réel et taille vérifiés avant la lecture
    const g = await gardeFichier(file, 'sauvegarde'); if (!g.file) { toast(`🛡 « ${gardeNomPropre(file.name)} » refusé : ${g.v.raisons[0]}.`, 'bad'); const d0 = clone(dbRef.current); gardeJournaliser(d0, { statut: 'refuse', usage: 'sauvegarde', nom: file.name, taille: file.size, raisons: g.v.raisons, appareil: appareilNom() }); applyDb(d0); setOccupe(''); return; }
    try {
      const text = await lectureFichier(g.file); const a = await analyser(text, file.name || 'Oenotrack.json');
      if (a.s.kind === 'documents') { toast('Ancienne sauvegarde de documents : importez-la avec « Importer une sauvegarde ».', 'bad'); setOccupe(''); return; }
      setRapport({ ...a, handle: h, lastModified: file.lastModified || null });
    } catch (er) { toast(er && er.message ? er.message : 'Lecture du fichier impossible.', 'bad'); }
    setOccupe('');
  };
  const appliquer = async (choix) => {
    const r = rapport; if (!r) return; setOccupe('application');
    try {
      await appliquerAnalyse(r, choix, r.handle, r.lastModified);
      setRapport(null);
      const f = r.fusion; const msg = choix !== 'fusion' || !f ? `Base du Drive reprise sur cet appareil (« ${r.fichier} »).` : f.identique ? 'Déjà à jour : rien à recevoir ni à envoyer.' : `Synchronisé : ${syncResume(f.recus) || 'rien'} reçu${f.nRecus > 1 ? 's' : ''}${f.nEnvoyes ? ` · ${syncResume(f.envoyes)} à renvoyer` : ''}${f.conflits.length ? ` · ${f.conflits.length} conflit(s) au journal` : ''}.`;
      toast(msg);
      const l = lienRef.current; if (l && l.perm === 'granted') setTimeout(() => { pousserRef.current(); }, 60); // après fermeture du rapport
    } catch (er) { toast(`Synchronisation impossible : ${er && er.message ? er.message : 'erreur'}.`, 'bad'); }
    setOccupe('');
  };
  // mise à jour automatique (lien vers le fichier autorisé en écriture)
  const verifier = async (force) => {
    const l = lienRef.current; const e = etatRef.current; if (!l || l.perm !== 'granted' || e.suspendu || busy.current || rapport) return;
    busy.current = true;
    try {
      const f = await l.handle.getFile(); if (!force && f.lastModified === e.fichierModifie) return;
      const a = await analyser(await lectureFichier(f), f.name || e.fichierNom);
      if (a.s.kind === 'documents') return;
      if (!a.fusion || !a.base || a.fusion.supprRecues > 10 || a.fusion.supprEnvoyees > 10) { setRapport({ ...a, handle: l.handle, lastModified: f.lastModified, auto: true }); return; } // garde-fou : on demande
      if (a.fusion.identique) { await snapEcrire(a.idF, a.remote); setEtat({ syncId: a.idF, lignee: a.chaine.slice(0, 20), empreinteFichier: syncEmpreinte(a.remote), fichierModifie: f.lastModified, derniereSync: nowISO(), appareilFichier: (a.sync && a.sync.appareilNom) || e.appareilFichier, fichierEcritLe: (a.sync && a.sync.ecritLe) || e.fichierEcritLe, erreur: '' }); return; }
      await appliquerAnalyse(a, 'fusion', null, f.lastModified);
      if (a.fusion.nRecus) toast(`⇅ Drive : ${syncResume(a.fusion.recus)} reçu${a.fusion.nRecus > 1 ? 's' : ''}${a.sync && a.sync.appareilNom ? ` (${a.sync.appareilNom})` : ''}.`);
    } catch (er) {
      if (er && er.name === 'NotAllowedError') setLien({ ...l, perm: 'prompt' });
      else if (er && er.name === 'NotFoundError') { setLien({ ...l, perm: 'introuvable' }); setEtat({ erreur: 'Fichier introuvable (déplacé ou supprimé) : déposez-le à nouveau.' }); }
    } finally { busy.current = false; }
  };
  const pousser = async () => {
    const l = lienRef.current; const e = etatRef.current; if (!l || l.perm !== 'granted' || e.suspendu || busy.current || rapport) return;
    const dbx = dbRef.current; if (syncEmpreinte(dbx) === e.empreinteFichier) return;
    busy.current = true; setOccupe('ecriture'); let relire = false;
    try {
      const f = await l.handle.getFile();
      if (e.fichierModifie && f.lastModified !== e.fichierModifie) relire = true; // modifié ailleurs : d'abord recevoir
      else await ecrire(l.handle, dbx);
    } catch (er) {
      if (er && er.name === 'NotAllowedError') setLien({ ...l, perm: 'prompt' });
      else if (er && er.name === 'NotFoundError') { setLien({ ...l, perm: 'introuvable' }); setEtat({ erreur: 'Fichier introuvable (déplacé ou supprimé) : déposez-le à nouveau.' }); }
      else setEtat({ erreur: 'Écriture du fichier impossible pour le moment.' });
    } finally { busy.current = false; setOccupe(''); }
    if (relire) await verifier(true);
  };
  const autoriser = async () => {
    const l = lienRef.current; if (!l || !l.handle) return;
    try {
      const p = await l.handle.requestPermission({ mode: 'readwrite' }); setLien({ ...l, perm: p });
      if (p === 'granted') { setEtat({ autoImpossible: false }); toast('Mise à jour automatique activée : Œnotrack tient ce fichier à jour.'); await verifier(true); await pousser(); }
      else toast('Autorisation refusée : utilisez « Envoyer vers le Drive » après vos saisies.', 'bad');
    } catch (er) { setLien({ ...l, perm: 'erreur' }); setEtat({ autoImpossible: true }); toast('Ce navigateur ne permet pas à la page de modifier le fichier : utilisez « Envoyer vers le Drive » après vos saisies.', 'bad'); }
  };
  const envoyer = async () => {
    const dbx = dbRef.current; const e = etatRef.current; const nom = e.fichierNom || nomFichierSync(dbx); const id = nouvelIdSync(); const ap = appareilInfo();
    const anc = [e.syncId, ...(e.lignee || [])].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 20);
    setOccupe('envoi');
    try {
      const b = await buildSauvegarde(dbx, 'derniereSync', { sync: { id, ancetres: anc, appareil: ap.tag, appareilNom: ap.nom, ecritLe: nowISO() } });
      const texte = await sauvTexteSortie(dbx, b.text, true);
      const r = await saveFile(nom, new Blob([texte], { type: 'application/json' }), 'application/json');
      if (r.ok) { await snapEcrire(id, normalizeDb(clone(dbx))); setEtat({ fichierNom: nom, syncId: id, lignee: anc, empreinteFichier: syncEmpreinte(dbx), derniereEcriture: nowISO(), derniereSync: nowISO(), appareilFichier: ap.nom, fichierEcritLe: nowISO(), exportEnAttente: true, suspendu: false, erreur: '' }); marquer(); toast(`« ${nom} » enregistré : placez-le dans votre Drive à la place de l’ancien.`); }
      else if (r.declined) toast('Envoi annulé.'); else toast(failMsg(r), 'bad');
    } catch (er) { toast('Préparation du fichier impossible.', 'bad'); }
    setOccupe('');
  };
  const creer = async () => {
    if (typeof window.showSaveFilePicker === 'function') {
      try {
        const h = await window.showSaveFilePicker({ suggestedName: nomFichierSync(dbRef.current), types: [{ description: 'Fichier Œnotrack', accept: { 'application/json': ['.json'] } }] });
        await lienEcrire(h); setLien({ handle: h, perm: 'granted', nom: h.name }); setEtat({ fichierNom: h.name, suspendu: false });
        busy.current = true; try { await ecrire(h, dbRef.current); } finally { busy.current = false; }
        toast(`« ${h.name} » créé : Œnotrack le tient à jour.`); return;
      } catch (er) { if (er && er.name === 'AbortError') return; /* page intégrée : le fichier est téléchargé */ }
    }
    await envoyer();
  };
  const delier = async () => { await lienEcrire(null); setLien(null); setEtat(() => ({})); toast('Synchronisation arrêtée sur cet appareil (le fichier du Drive n’est pas modifié).'); };
  const suspendre = () => { if (etatRef.current.fichierNom) setEtat({ suspendu: true }); };
  const renommer = (nom) => { const a = { ...appareilInfo(), nom: String(nom || '').slice(0, 40) || appareilNomDefaut() }; try { window.localStorage.setItem(APPAREIL_KEY, JSON.stringify(a)); } catch (e) { /* ignoré */ } setAppareil(a); };

  // lien enregistré lors d'une visite précédente
  useEffect(() => { let vivant = true; (async () => { const h = await lienLire(); if (!h || !vivant) return; let perm = 'prompt'; try { perm = await h.queryPermission({ mode: 'readwrite' }); } catch (e) { perm = 'erreur'; } if (vivant) setLien({ handle: h, perm, nom: h.name || '' }); })(); return () => { vivant = false; }; }, []);
  // dépôt (glisser-déposer) ou collage (Ctrl + V) d'un fichier n'importe où dans Œnotrack
  const recevoirRef = useRef(recevoir); recevoirRef.current = recevoir; const toastRef = useRef(toast); toastRef.current = toast;
  useEffect(() => {
    // 0.17.0-alpha.1 : quand une zone de dépôt est à l'écran (documents, logo, barèmes…), elle prend la main (44b-depot.jsx) :
    // pas de grand cadre « fichier du Drive », les zones s'allument ; un fichier lâché à côté est ignoré avec un message
    let n = 0; const html = document.documentElement;
    const natif = (e) => e.target && e.target.tagName === 'INPUT' && e.target.type === 'file';
    const fin = () => { n = 0; setSurvol(false); html.classList.remove('depot-fichiers'); };
    const enter = (e) => { if (!aDesFichiers(e) || natif(e)) return; n += 1; html.classList.add('depot-fichiers'); if (!DEPOT.zones) setSurvol(true); };
    const over = (e) => { if (!aDesFichiers(e) || natif(e)) return; e.preventDefault(); try { e.dataTransfer.dropEffect = 'copy'; } catch (er) { /* ignoré */ } };
    const leave = (e) => { if (!aDesFichiers(e)) return; n = Math.max(0, n - 1); if (!n) fin(); };
    const dropCapture = () => fin(); // aussi pour les fichiers lâchés dans une zone (qui arrête la propagation)
    const drop = (e) => {
      if (!aDesFichiers(e) || natif(e)) return;
      e.preventDefault();
      if (DEPOT.zones) { toastRef.current('Déposez le fichier dans un cadre en pointillés (« Joindre… »).'); return; }
      const f = e.dataTransfer.files && e.dataTransfer.files[0]; let hp = null;
      try { const it = e.dataTransfer.items && e.dataTransfer.items[0]; if (it && it.kind === 'file' && typeof it.getAsFileSystemHandle === 'function') hp = it.getAsFileSystemHandle(); } catch (er) { hp = null; }
      if (hp && typeof hp.catch === 'function') hp.catch(() => null);
      recevoirRef.current(f, hp);
    };
    const paste = (e) => { const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return; if (DEPOT.zones) return; const f = e.clipboardData && e.clipboardData.files && e.clipboardData.files[0]; if (f) { e.preventDefault(); recevoirRef.current(f, null); } };
    window.addEventListener('dragenter', enter); window.addEventListener('dragover', over); window.addEventListener('dragleave', leave); window.addEventListener('drop', dropCapture, true); window.addEventListener('drop', drop); window.addEventListener('paste', paste);
    return () => { window.removeEventListener('dragenter', enter); window.removeEventListener('dragover', over); window.removeEventListener('dragleave', leave); window.removeEventListener('drop', dropCapture, true); window.removeEventListener('drop', drop); window.removeEventListener('paste', paste); };
  }, []);
  // mise à jour automatique : vérifie le fichier (retour sur la page, toutes les 15 s) et l'écrit 2,5 s après chaque modification
  const verifierRef = useRef(verifier); verifierRef.current = verifier; const pousserRef = useRef(pousser); pousserRef.current = pousser;
  const auto = !!(lien && lien.perm === 'granted' && etat.fichierNom && !etat.suspendu);
  useEffect(() => {
    if (!auto) return undefined;
    const tick = () => { if (document.visibilityState === 'visible') verifierRef.current(false); };
    const t = setInterval(tick, 15000); window.addEventListener('focus', tick); document.addEventListener('visibilitychange', tick); tick();
    return () => { clearInterval(t); window.removeEventListener('focus', tick); document.removeEventListener('visibilitychange', tick); };
  }, [auto]);
  useEffect(() => { if (!auto || empreinte === etat.empreinteFichier) return undefined; const t = setTimeout(() => pousserRef.current(), 2500); return () => clearTimeout(t); }, [auto, empreinte, etat.empreinteFichier]);

  const mode = !etat.fichierNom ? 'aucun' : etat.suspendu ? 'suspendu' : auto ? 'auto' : lien && lien.handle && lien.perm === 'prompt' && !etat.autoImpossible ? 'reconnecter' : 'manuel';
  const aEnvoyer = !!etat.fichierNom && !etat.suspendu && empreinte !== etat.empreinteFichier;
  return { etat, lien, mode, aEnvoyer, survol, rapport, occupe, appareil, fsAuto: typeof window.showSaveFilePicker === 'function' || typeof window.FileSystemFileHandle !== 'undefined',
    recevoir, appliquer, fermer: () => setRapport(null), envoyer, creer, autoriser, delier, suspendre, renommer, synchroniser: () => verifier(true) };
}

/* ---------- affichage : zone de dépôt plein écran, rapport de synchronisation, puce d'état, carte des paramètres ---------- */
function SyncDepot() {
  const { sync } = useApp(); if (!sync || !sync.survol) return null;
  return (<div className="sync-depot" aria-hidden="true"><div className="sync-depot-in"><div className="sync-depot-ic">⇅</div><div className="text-xl font-semibold">Déposez le fichier Œnotrack de votre Drive</div><div className="mt-1 text-sm text-ink2">Les modifications faites ici et sur les autres appareils sont réunies.</div></div></div>);
}
function SyncSheet() {
  const { sync, db } = useApp(); const r = sync && sync.rapport; if (!r) return null; const f = r.fusion; const busy = !!sync.occupe;
  const src = r.sync ? `écrit par « ${r.sync.appareilNom || 'un autre appareil'} » le ${fmtQuand(r.sync.ecritLe)}` : r.s.head && r.s.head.exporteLe ? `sauvegarde du ${fmtQuand(r.s.head.exporteLe)}` : 'base Œnotrack';
  const remplacer = <Btn kind="danger" disabled={busy} onClick={() => sync.appliquer('remplacer')} title="Toute la base de cet appareil est remplacée par celle du fichier">Remplacer par la base du Drive</Btn>;
  const pied = r.vide ? <><Btn onClick={sync.fermer}>Annuler</Btn><Btn kind="primary" disabled={busy} onClick={() => sync.appliquer('remplacer')}>Utiliser la base du Drive</Btn></>
    : f.identique ? <><Btn kind="primary" disabled={busy} onClick={() => sync.appliquer('fusion')}>{r.handle ? 'Lier ce fichier' : 'Fermer'}</Btn></>
      : <><Btn onClick={sync.fermer}>Annuler</Btn>{remplacer}<Btn kind="primary" disabled={busy} onClick={() => sync.appliquer('fusion')}>{busy ? 'Synchronisation…' : '⇅ Synchroniser'}</Btn></>;
  const Ligne = ({ titre, txt, suppr, ton }) => (<div className={cx('sync-bloc', ton && `sync-${ton}`)}><div className="lbl mb-0.5">{titre}</div><div className="text-sm font-semibold">{txt || 'rien'}</div>{suppr ? <div className="text-xs text-ink2">dont {suppr} suppression{suppr > 1 ? 's' : ''}</div> : null}</div>);
  return (
    <Sheet title="Synchroniser avec le Drive" sub={`« ${r.fichier} » · ${src}`} onClose={sync.fermer} footer={pied}>
      <div className="space-y-3" data-sync-rapport="">
        {r.auto ? <Notice tone="warn" title="Le fichier du Drive a changé">Œnotrack préfère vous demander avant de réunir : {!r.base ? 'aucune version commune n’est connue sur cet appareil' : 'beaucoup d’éléments seraient supprimés'}.</Notice> : null}
        {r.vide ? (<>
          <Notice tone="info" title={db.meta.exemple ? 'Cet appareil contient le jeu d’exemple' : 'La base de cet appareil est vide'}>Elle sera remplacée par la base du Drive : {resumeBase(r.remote)}{r.s.fichiers && r.s.fichiers.length ? ` et ${pl(r.s.fichiers.length, 'fichier joint', 'fichiers joints')}` : ''}.</Notice>
          {r.handle ? <p className="help">Ensuite, si votre navigateur le permet, Œnotrack pourra tenir ce fichier à jour tout seul.</p> : null}
        </>) : f.identique ? (
          <Notice tone="ok" title="Déjà à jour">Ce fichier et cet appareil contiennent exactement les mêmes données.{r.handle ? ' Liez-le pour qu’Œnotrack le tienne à jour.' : ''}</Notice>
        ) : (<>
          <div className="sync-blocs">
            <Ligne titre="Reçu du Drive" txt={syncResume(f.recus)} suppr={f.supprRecues} ton="recu" />
            <Ligne titre="Gardé de cet appareil" txt={syncResume(f.envoyes)} suppr={f.supprEnvoyees} ton="envoye" />
          </div>
          {f.nEnvoyes ? <p className="help">{sync.lien && sync.lien.perm === 'granted' ? 'Vos modifications seront écrites dans le fichier du Drive.' : 'Vos modifications restent sur cet appareil : renvoyez ensuite le fichier vers le Drive (Paramètres › Sauvegarde & Drive), ou activez la mise à jour automatique.'}</p> : null}
          {!r.base ? <Notice tone="info" title="Première synchronisation de cet appareil avec ce fichier">Ce qui n’existe que d’un côté est gardé ; un élément différent des deux côtés garde sa version la plus récente. Les suppressions seront reconnues dès la prochaine synchronisation.</Notice> : null}
          {f.conflits.length ? (<details className="sync-conflits" open={f.conflits.length <= 5}><summary><b>{pl(f.conflits.length, 'conflit')}</b> : modifié des deux côtés — version {f.gagnant === 'drive' ? 'du Drive' : 'de cet appareil'} gardée (la plus récente), l’autre reste au journal</summary>
            <ul>{f.conflits.slice(0, 30).map((c, i) => <li key={i}>{(SYNC_NOMS[c.cle.split('.')[0]] || ['élément'])[0]} · <b>{c.libelle || c.id}</b>{c.nature === 'suppression' ? ' — supprimé d’un côté, modifié de l’autre : conservé' : ''}</li>)}</ul></details>) : null}
          {f.doublons.length ? <Notice tone="warn" title="Codes de lots en double">{f.doublons.join(', ')} : deux lots portent le même code (créés sur deux appareils). Renommez l’un d’eux après la synchronisation.</Notice> : null}
        </>)}
      </div>
    </Sheet>
  );
}
function DriveChip() {
  const { sync, setTab } = useApp(); if (!sync || sync.mode === 'aucun') return null; const m = sync.mode;
  const txt = m === 'suspendu' ? '⇅ Drive en pause' : m === 'reconnecter' ? '⇅ Drive : reconnecter' : sync.occupe === 'ecriture' ? '⇅ Drive : envoi…' : sync.etat.erreur ? '⇅ Drive : à vérifier' : sync.aEnvoyer ? (m === 'auto' ? '⇅ Drive : envoi…' : '⇅ Drive : à envoyer') : m === 'auto' ? '⇅ Drive synchronisé' : '⇅ Drive à jour';
  const ton = sync.etat.erreur ? 'chip-bad' : m === 'suspendu' || m === 'reconnecter' || (sync.aEnvoyer && m !== 'auto') ? 'chip-warn' : 'chip-ok';
  return <button type="button" className={cx('chip', ton)} style={{ cursor: 'pointer' }} data-drive-etat={m} title={sync.etat.fichierNom ? `Fichier « ${sync.etat.fichierNom} »` : 'Synchronisation Drive'} onClick={() => (m === 'reconnecter' ? sync.autoriser() : setTab('params', 'sauvegarde'))}>{txt}</button>;
}

function DriveSyncCard({ drive, setDrive }) {
  const { sync, db, act, confirm } = useApp(); const fileRef = useRef(null); const s = sync; const e = s.etat; const dv = DRIVES.find((x) => x.id === drive) || DRIVES[0];
  const busy = !!s.occupe; const conflits = (db.meta && db.meta.syncConflits) || [];
  const [nomApp, setNomApp] = useState(s.appareil.nom);
  const onFile = (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (f) s.recevoir(f, null); };
  const statut = s.mode === 'aucun' ? null : (
    <div className={cx('sync-etat', s.mode === 'auto' && !e.erreur ? 'ok' : (s.aEnvoyer || s.mode !== 'manuel' || e.erreur) ? 'warn' : 'ok')} data-mode={s.mode}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><b>📄 {e.fichierNom}</b>
        <Chip tone={s.mode === 'auto' ? 'ok' : s.mode === 'manuel' ? '' : 'warn'}>{s.mode === 'auto' ? 'mise à jour automatique' : s.mode === 'manuel' ? 'par dépôt du fichier' : s.mode === 'reconnecter' ? 'autorisation à renouveler' : 'en pause'}</Chip></div>
      <div className="text-sm">{s.mode === 'suspendu' ? 'La base de cet appareil a été remplacée (restauration, exemple ou remise à zéro) : déposez le fichier du Drive pour reprendre.'
        : e.erreur ? e.erreur
          : s.aEnvoyer ? (s.mode === 'auto' ? 'Modifications en cours d’envoi vers le fichier…' : 'Des modifications faites ici ne sont pas encore dans le fichier du Drive.')
            : e.exportEnAttente ? 'Fichier à jour envoyé : vérifiez qu’il a bien remplacé l’ancien dans votre Drive.' : 'Cet appareil et le fichier du Drive sont à jour.'}</div>
      <div className="text-xs text-ink2">{e.derniereSync ? `Dernière synchronisation le ${fmtQuand(e.derniereSync)}` : ''}{e.appareilFichier ? ` · fichier écrit par « ${e.appareilFichier} »${e.fichierEcritLe ? ` le ${fmtQuand(e.fichierEcritLe)}` : ''}` : ''}</div>
    </div>);
  return (
    <section className="card sync-card p-4" aria-labelledby="svd">
      <div className="flex flex-wrap items-center gap-3"><div className="sauv-ic" aria-hidden="true">⇅</div><h3 id="svd" className="text-lg font-semibold">Synchronisation par fichier</h3>
        <div className="ml-auto flex flex-wrap gap-1.5" role="group" aria-label="Votre service de stockage">{DRIVES.map((x) => <Btn key={x.id} size="sm" kind={drive === x.id ? 'primary' : undefined} aria-pressed={drive === x.id} onClick={() => setDrive(x.id)}>{x.nom}</Btn>)}</div></div>
      {statut}
      <div className="sync-grid">
        <button type="button" className={cx('sync-zone', s.survol && 'on')} onClick={() => fileRef.current && fileRef.current.click()} disabled={busy} aria-label={`Déposer ou choisir le fichier Œnotrack de ${dv.nom}`}>
          <span className="sync-zone-ic" aria-hidden="true">⇩</span>
          <span className="font-semibold">{busy && s.occupe === 'lecture' ? 'Lecture du fichier…' : `Glissez-déposez ici le fichier Œnotrack de ${dv.nom}`}</span>
          <span className="text-xs">depuis le dossier {dv.nom} de l’ordinateur — ou copiez-le puis Ctrl + V (⌘ + V) — ou touchez pour le choisir</span>
        </button>
        <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onFile} aria-label="Fichier Œnotrack du Drive" />
        <div className="space-y-2">
          {s.mode === 'aucun' ? <Btn kind="primary" disabled={busy} onClick={s.creer}>＋ Créer le fichier de synchronisation</Btn> : null}
          {s.mode === 'auto' ? <Btn disabled={busy} onClick={s.synchroniser}>⇅ Synchroniser maintenant</Btn> : null}
          {s.mode === 'manuel' || s.mode === 'reconnecter' ? <Btn kind={s.aEnvoyer ? 'primary' : undefined} disabled={busy} onClick={s.envoyer}>{s.occupe === 'envoi' ? 'Préparation…' : `⬆ Envoyer vers ${dv.nom}`}</Btn> : null}
          {(s.mode === 'manuel' || s.mode === 'reconnecter') && s.lien && s.lien.handle && s.lien.perm !== 'erreur' && s.lien.perm !== 'introuvable' && !e.autoImpossible ? <Btn disabled={busy} onClick={s.autoriser} title="Œnotrack modifiera lui-même ce fichier après chaque saisie">✓ Activer la mise à jour automatique</Btn> : null}
          {s.mode !== 'aucun' ? <Btn kind="ghost" size="sm" onClick={async () => { if (await confirm({ title: 'Arrêter la synchronisation sur cet appareil ?', body: 'Les données restent dans ce navigateur et le fichier du Drive n’est pas modifié. Vous pourrez reprendre en déposant à nouveau le fichier.', ok: 'Arrêter' })) s.delier(); }}>Arrêter la synchronisation</Btn> : null}
          <label className="block text-sm"><span className="lbl">Nom de cet appareil</span><input className="inp" value={nomApp} maxLength={40} onChange={(ev) => setNomApp(ev.target.value)} onBlur={() => s.renommer(nomApp)} placeholder="ex. Bureau, Tablette du chai" aria-label="Nom de cet appareil" /></label>
        </div>
      </div>
      <details className="sync-guide"><summary>Comment faire avec {dv.nom} ?</summary>
        <ol className="sauv-steps text-sm">
          <li>Sur l’ordinateur, installez <b>{dv.appli}</b> : {dv.nom} apparaît comme un dossier ({dv.dossier}).</li>
          <li>La première fois : <b>Créer le fichier de synchronisation</b> et enregistrez-le dans ce dossier (ou importez-le sur <a className="linkish" href={dv.url} target="_blank" rel="noopener noreferrer">{dv.nom} en ligne ↗</a>).</li>
          <li>Ensuite, sur chaque appareil : <b>glissez-déposez le fichier</b> depuis le dossier {dv.nom} sur Œnotrack (n’importe où dans la page), ou copiez-le puis collez-le (Ctrl + V). Œnotrack réunit ce qui a changé des deux côtés.</li>
          <li>Si le navigateur le permet (Chrome, Edge sur ordinateur), « Activer la mise à jour automatique » : Œnotrack réécrit lui-même le fichier après chaque saisie et reprend les changements des autres appareils. Sinon, après vos saisies : <b>Envoyer vers {dv.nom}</b>, puis remplacez l’ancien fichier.</li>
          <li>Téléphone ou tablette : touchez la zone de dépôt et choisissez le fichier dans {dv.mobile} ; pour renvoyer, « Envoyer » puis « Enregistrer dans Fichiers » › {dv.nom}.</li>
        </ol>
        <p className="help">Une page claude.ai ne peut pas se connecter elle-même à {dv.nom} : c’est le fichier, déposé ou relié, qui fait le lien. Vos données restent chez vous.</p>
      </details>
      {conflits.length ? (<details className="sync-guide"><summary>Journal des conflits ({conflits.length})</summary>
        <ul className="sauv-list">{conflits.slice(0, 20).map((c, i) => <li key={i}><span className="text-xs text-ink2">{fmtQuand(c.date)}</span><span className="text-sm">{(SYNC_NOMS[c.cle.split('.')[0]] || ['élément'])[0]} · <b>{c.libelle || c.id}</b> — version {c.garde === 'drive' ? 'du Drive' : 'de cet appareil'} gardée</span>
          <span className="ml-auto flex gap-1">{c.autre != null ? <Btn size="sm" onClick={() => act((d) => { const r = conflitReprendre(d, c); if (r.ok) d.meta.syncConflits = (d.meta.syncConflits || []).filter((_, k) => k !== i); return r; }, 'Autre version reprise.')}>Reprendre l’autre version</Btn> : null}<Btn size="sm" kind="ghost" aria-label="Retirer du journal" onClick={() => act((d) => { d.meta.syncConflits = (d.meta.syncConflits || []).filter((_, k) => k !== i); return okr(); })}>✕</Btn></span></li>)}</ul></details>) : null}
    </section>
  );
}
