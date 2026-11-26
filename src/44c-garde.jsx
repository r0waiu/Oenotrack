/* ============ GARDE DES IMPORTATIONS : vérification en arrière-plan, journal, points de restauration (0.27.0-alpha.1) ============
   Le moteur (16e-garde.js) rend un verdict par fichier ; ici : lecture des octets, décompression (DecompressionStream, avec un
   budget contre les bombes), désarmement des PDF (pdf-lib, chargé à la demande), messages, journal de sécurité et compteur de
   l'appareil, points de restauration (IndexedDB « oenotrack-garde ») avant qu'une base importée remplace la base de l'appareil,
   vérification des documents déjà joints, écran Paramètres › Sécurité des importations. */
const GARDE_VERDICTS = new WeakMap(); // fichier → verdict (le document joint garde son résumé)
const GARDE_COMPTE_KEY = 'oenotrack-garde-compte';
const gardeCompte = () => { try { return Math.max(0, parseInt(window.localStorage.getItem(GARDE_COMPTE_KEY) || '0', 10) || 0); } catch (e) { return 0; } };
const gardeCompter = (n) => { try { window.localStorage.setItem(GARDE_COMPTE_KEY, String(gardeCompte() + n)); } catch (e) { /* ignoré */ } };
// décompression avec un budget (un flux de quelques Ko ne doit pas devenir des Go)
async function gardeInflate(octets, brut, max) {
  if (typeof DecompressionStream !== 'function') throw new Error('décompression indisponible');
  const ds = new DecompressionStream(brut ? 'deflate-raw' : 'deflate'); const w = ds.writable.getWriter();
  w.write(octets).catch(() => { /* données corrompues : la lecture échoue aussi */ }); w.close().catch(() => { /* idem */ });
  const r = ds.readable.getReader(); const parts = []; let n = 0; const lim = max || 64 * GARDE_MO;
  for (;;) { const x = await r.read(); if (x.done) break; n += x.value.length; if (n > lim) { r.cancel().catch(() => null); throw new Error('trop gros une fois décompressé'); } parts.push(x.value); }
  const out = new Uint8Array(n); let o = 0; parts.forEach((p) => { out.set(p, o); o += p.length; }); return out;
}
const GARDE_OUTILS = { inflate: gardeInflate, chargerPdfLib: () => loadPdfLib() };
// un fichier → { file (éventuellement désarmé ou retypé), v (verdict) } ; file absent si refusé
async function gardeFichier(file, usage) {
  let b; try { b = new Uint8Array(await file.arrayBuffer()); } catch (e) { return { v: { statut: 'refuse', usage, raisons: ['lecture du fichier impossible'], avertissements: [], famille: '', taille: file.size || 0 } }; }
  let v; try { v = await gardeAnalyser(b, file.name, usage, GARDE_OUTILS); } catch (e) { console.error(e); v = { statut: 'refuse', usage, raisons: ['vérification impossible (fichier illisible)'], avertissements: [], famille: '', taille: b.length }; }
  if (v.statut === 'refuse') return { v };
  let f = file; const type = v.type || file.type || '';
  if (v.octets || (v.type && v.type !== file.type)) { try { f = new File([v.octets || b], gardeNomPropre(file.name), { type, lastModified: file.lastModified || Date.now() }); } catch (e) { f = file; } }
  GARDE_VERDICTS.set(f, v); return { file: f, v };
}
const gardeEntree = (f, v, appareil, uid) => ({ statut: v.statut === 'ok' ? 'averti' : v.statut, usage: v.usage, nom: f.name, taille: f.size || v.taille, raisons: [...v.raisons, ...v.avertissements], appareil, uid });
const gardeMsgRefus = (L) => (L.length === 1 ? `🛡 « ${gardeNomPropre(L[0].f.name)} » refusé : ${L[0].v.raisons[0]}.` : `🛡 ${L.length} fichiers refusés : ${L.slice(0, 4).map((x) => `« ${gardeNomPropre(x.f.name)} »`).join(', ')}${L.length > 4 ? '…' : ''} — détail dans Paramètres › Sécurité des importations.`);
// vérification d'une liste de fichiers : refus et désarmements annoncés et notés au journal de sécurité
function useGarde() {
  const { act, toast, uid } = useApp();
  return useCallback(async (files, usage = 'document') => {
    const ok = []; const refus = []; const notes = [];
    for (const f of Array.from(files || [])) { const r = await gardeFichier(f, usage); if (r.file) { ok.push(r.file); if (r.v.statut === 'nettoye' || r.v.avertissements.length) notes.push({ f: r.file, v: r.v }); } else refus.push({ f, v: r.v }); }
    gardeCompter(ok.length + refus.length);
    const ent = [...refus, ...notes.filter((x) => x.v.statut === 'nettoye' || x.v.avertissements.some((a) => !/type corrigé/.test(a)))].map((x) => gardeEntree(x.f, x.v, appareilNom(), uid));
    if (ent.length) act((d) => gardeJournaliser(d, ent), null, { systeme: true });
    if (refus.length) toast(gardeMsgRefus(refus), 'bad');
    const net = notes.filter((x) => x.v.statut === 'nettoye');
    if (net.length) toast(net.length === 1 ? `🛡 « ${net[0].f.name} » : ${net[0].v.raisons[0]} ; le document propre est gardé.` : `🛡 ${net.length} PDF désarmés (contenu actif retiré) ; les documents propres sont gardés.`, refus.length ? 'bad' : undefined);
    return ok;
  }, [act, toast, uid]);
}
// verdict d'un texte déjà lu (sauvegarde, Drive, fichier de traçabilité) : refus noté au journal
function useGardeJournal() {
  const { act, uid } = useApp();
  return useCallback((e) => { act((d) => gardeJournaliser(d, { ...e, appareil: appareilNom(), uid }), null, { systeme: true }); }, [act, uid]);
}

/* ---------- points de restauration (avant qu'une base importée remplace celle de l'appareil) ---------- */
const GARDE_DB = 'oenotrack-garde'; const GARDE_RETOURS = 'retours'; const GARDE_RETOURS_MAX = 5;
let _gdb = null;
function gardeIdb() {
  if (_gdb) return _gdb;
  _gdb = new Promise((res, rej) => { try { const r = window.indexedDB.open(GARDE_DB, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(GARDE_RETOURS)) r.result.createObjectStore(GARDE_RETOURS, { keyPath: 'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error || new Error('IndexedDB indisponible')); } catch (e) { rej(e); } });
  _gdb.catch(() => { _gdb = null; }); return _gdb;
}
const gardeRun = (mode, fn) => gardeIdb().then((d) => new Promise((res, rej) => { const tx = d.transaction(GARDE_RETOURS, mode); const rq = fn(tx.objectStore(GARDE_RETOURS)); tx.oncomplete = () => res(rq ? rq.result : undefined); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); }));
// la base est copiée tout de suite (texte), puis rangée ; on garde les 5 derniers points
function pointRetourEcrire(db, motif) {
  let texte; try { texte = JSON.stringify(db); } catch (e) { return Promise.resolve(false); }
  const x = { id: `pr${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, date: new Date().toISOString(), motif: String(motif || 'Base remplacée').slice(0, 160), resume: { contenants: (db.contenants || []).length, lots: (db.lots || []).length, ops: (db.ops || []).length, docs: (db.docs || []).length }, taille: texte.length, db: texte };
  return (async () => {
    try {
      x.db = await coffreTexteChiffrer(texte); // 0.38.0-alpha.1 : point de restauration chiffré par le coffre de l'appareil
      await gardeRun('readwrite', (s) => s.put(x));
      const all = (await gardeRun('readonly', (s) => s.getAll())) || [];
      for (const y of all.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(GARDE_RETOURS_MAX)) await gardeRun('readwrite', (s) => s.delete(y.id));
      return true;
    } catch (e) { return false; }
  })();
}
const pointsRetourLire = async () => {
  try {
    const L = ((await gardeRun('readonly', (s) => s.getAll())) || []).sort((a, b) => (a.date < b.date ? 1 : -1));
    for (const p of L) { try { p.db = await coffreTexteDechiffrer(p.db); } catch (e) { p.db = ''; p.illisible = true; } }
    return L;
  } catch (e) { return []; }
};
const pointRetourSuppr = async (id) => { try { await gardeRun('readwrite', (s) => s.delete(id)); return true; } catch (e) { return false; } };

/* ---------- documents déjà joints : vérifiés une fois, en arrière-plan ---------- */
async function gardeDocsVerifier(docs, opts) {
  const o = opts || {}; const out = {}; let n = 0;
  for (const d of docs) {
    if (o.arret && o.arret()) break;
    let blob = null; try { blob = await docGet(d.id); } catch (e) { blob = null; } if (!blob) continue;
    let v; try { v = await gardeAnalyser(new Uint8Array(await blob.arrayBuffer()), d.nom, 'document', { inflate: gardeInflate }); } catch (e) { continue; }
    out[d.id] = gardeResume(v); n += 1; if (o.progres) o.progres(n);
    await new Promise((r) => setTimeout(r, 15)); // laisse respirer l'interface
  }
  return out;
}
function useGardeExistants() {
  const { db, act, toast } = useApp(); const dbRef = useRef(db); dbRef.current = db; const fait = useRef(false);
  useEffect(() => {
    if (fait.current) return undefined; let arret = false;
    const t = setTimeout(async () => {
      fait.current = true; const a = (dbRef.current.docs || []).filter((d) => d && d.id && !d.garde).slice(0, 300); if (!a.length) return;
      const res = await gardeDocsVerifier(a, { arret: () => arret }); if (arret || !Object.keys(res).length) return;
      act((d) => gardeDocsNoter(d, res), null, { systeme: true });
      const s = Object.values(res).filter((x) => x.statut === 'suspect').length;
      if (s) toast(`🛡 Documents déjà joints signalés : ${s} (contenu actif ou type dangereux) — Paramètres › Sécurité des importations.`, 'bad');
    }, 6000);
    return () => { arret = true; clearTimeout(t); };
  }, []);
}

function GardeExistants() { useGardeExistants(); return null; }

/* ---------- Paramètres › 🛡 Sécurité des importations ---------- */
const GARDE_STATUT_LIB = { refuse: 'Refusé', nettoye: 'Désarmé', averti: 'Accepté avec avertissement', suspect: 'Signalé' };
const GARDE_STATUT_TON = { refuse: 'bad', nettoye: 'warn', averti: 'info', suspect: 'bad' };
function GardeView() {
  const { db, act, toast, confirm, uid, secu, replaceDb } = useApp(); const { remove } = useDocActions();
  const admin = !secu || peut(db, uid, 'utilisateurs');
  const J = [...(db.gardeJournal || [])].reverse(); const [tout, setTout] = useState(false);
  const sus = gardeDocsSuspects(db); const nonVus = (db.docs || []).filter((d) => d && !d.garde).length;
  const [scan, setScan] = useState(null); const [points, setPoints] = useState(null);
  useEffect(() => { let vivant = true; pointsRetourLire().then((L) => { if (vivant) setPoints(L); }); return () => { vivant = false; }; }, []);
  const verifierTout = async () => {
    const docs = (db.docs || []).filter((d) => d && d.id); setScan({ n: 0, tot: docs.length });
    const res = await gardeDocsVerifier(docs, { progres: (n) => setScan({ n, tot: docs.length }) }); setScan(null);
    act((d) => gardeDocsNoter(d, res), null, { systeme: true });
    const s = Object.values(res).filter((x) => x.statut === 'suspect').length;
    toast(s ? `${Object.keys(res).length} document(s) vérifié(s) : ${s} signalé(s).` : `${Object.keys(res).length} document(s) vérifié(s) : aucun problème.`, s ? 'bad' : undefined);
  };
  const revenir = async (p) => {
    const ok = await confirm({ title: 'Revenir à ce point de restauration ?', danger: true, ok: 'Revenir', body: `La base de cet appareil sera remplacée par celle du ${fmtQuand(p.date)} (${p.motif}) : ${p.resume.contenants} contenant(s), ${p.resume.lots} lot(s), ${p.resume.ops} opération(s). La base actuelle est gardée comme nouveau point de restauration.` });
    if (!ok) return; const j = jsonSur(p.db); if (!j.ok) { toast(j.msg, 'bad'); return; }
    let nd; try { nd = importObj(j.valeur); } catch (e) { toast(e.message, 'bad'); return; }
    replaceDb(nd, 'Base revenue au point de restauration.', 'Retour à un point de restauration'); setTimeout(() => pointsRetourLire().then(setPoints), 400);
  };
  const vider = async () => { if (await confirm({ title: 'Vider le journal de sécurité ?', body: 'Les entrées sont supprimées sur tous les appareils synchronisés.', ok: 'Vider', danger: true })) act((d) => gardeJournalVider(d), 'Journal de sécurité vidé.'); };
  const L = tout ? J : J.slice(0, 30);
  return (
    <div className="space-y-5" data-garde="">
      <Sec title="🛡 Protection des importations">
        <p className="text-sm">Chaque fichier qui entre dans Œnotrack est vérifié automatiquement, sur cet appareil, avant d’être gardé : documents joints, fiches FT et FDS, barèmes, bulletins d’analyses, logo, sauvegardes et fichiers du Drive, fichiers de traçabilité.</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li><b>Type réel.</b> Il est lu dans le contenu : programmes, scripts, pages web et archives sont refusés, même renommés en .pdf ou .jpg ; les noms trompeurs aussi.</li>
          <li><b>PDF désarmés.</b> Code JavaScript, actions automatiques, lancement de programme ou fichiers incorporés : ce contenu est retiré et seul le document propre est gardé.</li>
          <li><b>Office.</b> Les documents avec macros, contrôles ActiveX, objets incorporés ou modèle chargé depuis internet sont refusés.</li>
          <li><b>Données importées.</b> Sauvegardes, Drive et traçabilité sont nettoyés des clés piégées et leur structure est vérifiée ; un point de restauration est créé avant de remplacer la base.</li>
          <li><b>Ouverture.</b> Les documents s’ouvrent sans exécuter leur contenu ; les exports CSV ne lancent aucune formule à l’ouverture dans un tableur.</li>
        </ul>
        <p className="help mt-2">{`Fichiers vérifiés sur cet appareil : ${fmt(gardeCompte())}.`}</p>
      </Sec>
      <Sec title={`Documents déjà joints (${(db.docs || []).length})`} right={<Btn size="sm" onClick={verifierTout} disabled={!!scan || !(db.docs || []).length}>{scan ? `Vérification… ${scan.n} / ${scan.tot}` : 'Vérifier maintenant'}</Btn>}>
        {sus.length ? <div className="space-y-2" data-garde-suspects="">{sus.map((d) => (<div key={d.id} className="flex flex-wrap items-center gap-2 rounded-md border border-line p-2 text-sm"><Chip tone="bad">⚠ signalé</Chip><b className="min-w-0 break-all">{d.nom}</b><span className="text-ink2">{(d.garde.notes || []).join(' ; ')}</span><Btn size="sm" kind="danger" className="ml-auto" onClick={() => remove(d)}>Retirer</Btn></div>))}</div>
          : <p className="text-sm text-ink2">{nonVus ? `${nonVus} document(s) pas encore vérifié(s) : la vérification se fait en arrière-plan peu après l’ouverture.` : 'Aucun document signalé.'}</p>}
      </Sec>
      <Sec title={`Journal de sécurité (${J.length})`} right={admin && J.length ? <Btn size="sm" kind="danger" onClick={vider}>Vider le journal</Btn> : null}>
        {!J.length ? <Empty>Aucun fichier refusé ni désarmé.</Empty> : (<>
          <Tbl rows={L} cols={[
            { h: 'Date', r: (e) => <span className="num">{fmtQuand(e.date)}</span> },
            { h: 'Fichier', r: (e) => <span className="break-all">{e.nom}</span> },
            { h: 'Import', r: (e) => GARDE_USAGE_LIB[e.usage] || e.usage },
            { h: 'Verdict', r: (e) => <Chip tone={GARDE_STATUT_TON[e.statut]}>{GARDE_STATUT_LIB[e.statut] || e.statut}</Chip> },
            { h: 'Raison', r: (e) => <span className="text-sm">{(e.raisons || []).join(' ; ')}</span> },
            { h: 'Appareil', r: (e) => e.appareil || '—' }]} />
          {J.length > 30 ? <button type="button" className="linkish mt-2 text-sm" onClick={() => setTout(!tout)}>{tout ? 'Afficher les 30 dernières entrées' : `Afficher les ${J.length} entrées`}</button> : null}
        </>)}
      </Sec>
      <Sec title="Points de restauration (sur cet appareil)">
        <p className="help mb-2">Avant qu’une sauvegarde, le fichier du Drive, le jeu d’exemple ou une remise à zéro remplace la base, la base de cet appareil est gardée ici (5 derniers points).</p>
        {points === null ? <div className="text-sm text-ink2">Chargement…</div> : !points.length ? <Empty>Aucun point de restauration pour l’instant.</Empty>
          : <Tbl rows={points} cols={[
            { h: 'Date', r: (p) => <span className="num">{fmtQuand(p.date)}</span> }, { h: 'Avant', r: (p) => p.motif },
            { h: 'Contenu', r: (p) => <span className="text-sm">{p.resume.contenants} contenant(s) · {p.resume.lots} lot(s) · {p.resume.ops} opération(s) · {p.resume.docs} document(s)</span> },
            { h: '', r: (p) => <div className="flex gap-1"><Btn size="sm" onClick={() => revenir(p)} disabled={!admin}>Revenir</Btn><Btn size="sm" kind="ghost" onClick={async () => { await pointRetourSuppr(p.id); setPoints(await pointsRetourLire()); }}>Effacer</Btn></div> }]} />}
      </Sec>
    </div>
  );
}
