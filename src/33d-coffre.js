/* ============ COFFRE DE L'APPAREIL : CHIFFREMENT AU REPOS DANS LE NAVIGATEUR (0.38.0-alpha.1) ============
   Tout ce qu'Œnotrack garde dans le navigateur est chiffré (AES-256-GCM) avec une clé de données (DEK) propre à l'appareil :
   - la base (localStorage « oenotrack-db-v2 », enveloppe { format: 'oenotrack-coffre', coffre: { id }, nom, iv, donnees }) ;
   - les secrets de l'appareil (localStorage « oenotrack-coffre-secrets ») : clés d'API de l'IA, clé de chiffrement de l'équipe,
     jetons des services cloud — jamais plus en clair dans le stockage du navigateur ;
   - les points de restauration, les instantanés de synchronisation et les documents joints (IndexedDB).
   La DEK n'est jamais enregistrée en clair. Elle est emballée (AES-GCM) :
   - mode « appareil » (par défaut, sans rien demander) : par une clé maîtresse NON EXTRACTIBLE (Web Crypto) rangée dans IndexedDB
     « oenotrack-coffre » — aucun script, aucune extension ne peut en lire les octets ; une copie des fichiers du navigateur, du
     localStorage ou d'une sauvegarde du profil reste illisible sans elle ;
   - mode « mot de passe » (choix de l'appareil) : par une clé dérivée d'un mot de passe (PBKDF2-SHA-256, 600 000 itérations) qui
     n'est gardé nulle part : Œnotrack le demande à l'ouverture. Protège aussi contre un accès direct à la session Windows / Android.
   Migration transparente : une base ou un secret trouvés en clair (version antérieure, autre onglet) sont chiffrés à la première
   ouverture, après vérification de la relecture ; rien n'est effacé avant. Navigateur sans Web Crypto ou sans IndexedDB : rien
   n'est chiffré (comme avant) et Paramètres › Chiffrement le signale.
   Retour à une version antérieure à 0.38 sur le même navigateur : elle ne lit pas la base chiffrée ; si elle y écrit, ses données
   sont réunies à la base chiffrée à la réouverture (syncFusion sans base commune : rien n'est perdu). */
const COFFRE_FORMAT = 'oenotrack-coffre'; const COFFRE_VERSION = 1;
const COFFRE_IDB = 'oenotrack-coffre'; const COFFRE_STORE = 'cles'; const COFFRE_REC = 'coffre';
const COFFRE_SECRETS_KEY = 'oenotrack-coffre-secrets';
const COFFRE_MAGIC = [0x4f, 0x45, 0x43, 0x4f, 0x46, 0x31]; // « OECOF1 » : document joint chiffré par le coffre
const COFFRE_ITER = 600000; const COFFRE_MDP_MIN = 10;
const COFFRE_ENV_CHAMPS = ['format', 'formatVersion', 'appVersion', 'coffre', 'nom', 'iv', 'donnees'];
const _coffre = { etat: 'inactif', dek: null, id: '', rec: null, clair: {}, secrets: {}, attente: {}, file: Promise.resolve(), demarre: null, bruts: null, ancien: null, erreur: '' };

/* ---------- enveloppes (testables dans Node : Web Crypto seul) ---------- */
const coffreAad = (id, nom) => new TextEncoder().encode(`${COFFRE_FORMAT}|${id}|${nom}`);
// texte en clair → enveloppe JSON (la clé de stockage fait partie des données authentifiées : une enveloppe déplacée est refusée)
async function coffreChiffrerAvec(dek, id, nom, texte) {
  const iv = chAleatoire(12); const d = await chAes(dek, iv, new TextEncoder().encode(String(texte)), 'chiffrer', coffreAad(id, nom));
  return JSON.stringify({ format: COFFRE_FORMAT, formatVersion: COFFRE_VERSION, appVersion: APP_VERSION, coffre: { id, alg: 'AES-GCM' }, nom, iv: chB64(iv), donnees: chB64(d) });
}
// enveloppe du coffre ? → objet lu (avec, s'il y en a, les champs écrits à côté par une version antérieure) ou null
function coffreEnveloppe(texte) {
  // 0.38.0-alpha.3 : marqueur cherché dans tout le texte — une version antérieure qui réécrit l'enveloppe (normalizeDb) place ses
  // listes par défaut AVANT « format » : l'enveloppe n'était plus reconnue et la base, prise pour vide, était rechiffrée telle quelle
  if (typeof texte !== 'string' || texte.length < 40 || texte.indexOf(`"${COFFRE_FORMAT}"`) < 0) return null;
  let j; try { j = JSON.parse(texte); } catch (e) { return null; }
  return j && j.format === COFFRE_FORMAT && j.coffre && j.iv && typeof j.donnees === 'string' ? j : null;
}
async function coffreDechiffrerAvec(dek, env, nom) {
  const j = typeof env === 'string' ? coffreEnveloppe(env) : env; if (!j) throw { coffre: true, message: 'Enveloppe du coffre illisible.' };
  if (num(j.formatVersion) > COFFRE_VERSION) throw { coffre: true, message: 'Données chiffrées par une version plus récente d’Œnotrack : mettez à jour cet appareil.' };
  const d = await chAes(dek, chDeB64(j.iv), chDeB64(j.donnees), 'dechiffrer', coffreAad(j.coffre.id, nom || j.nom));
  return new TextDecoder().decode(d);
}
// données écrites par une version antérieure à côté de l'enveloppe (elle a lu l'enveloppe comme une base vide)
function coffreAncien(env) {
  if (!env || typeof env !== 'object') return null; const o = {}; Object.keys(env).forEach((k) => { if (!COFFRE_ENV_CHAMPS.includes(k)) o[k] = env[k]; });
  const n = (k) => (Array.isArray(o[k]) ? o[k].length : 0);
  return n('ops') || n('lots') || n('contenants') || n('produits') || n('analyses') ? o : null;
}
// DEK : 32 octets aléatoires, emballés par une clé (maîtresse de l'appareil ou dérivée du mot de passe) ; utilisée non extractible
async function coffreEmballer(kek, brut) { const iv = chAleatoire(12); return { iv: chB64(iv), ct: chB64(await chAes(kek, iv, brut, 'chiffrer', new TextEncoder().encode(`${COFFRE_FORMAT}|dek`))) }; }
async function coffreDeballerBrut(kek, emb) {
  try { return await chAes(kek, chDeB64(emb.iv), chDeB64(emb.ct), 'dechiffrer', new TextEncoder().encode(`${COFFRE_FORMAT}|dek`)); }
  catch (e) { throw { coffre: true, mauvaiseCle: true, message: 'Mot de passe incorrect.' }; }
}
const coffreImporterDek = async (brut) => chSubtle().subtle.importKey('raw', brut, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
async function coffreKekMdp(mdp, sel, iter) {
  const c = chSubtle(); const base = await c.subtle.importKey('raw', new TextEncoder().encode(String(mdp || '').normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return c.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: chDeB64(sel), iterations: Math.max(10000, Math.floor(num(iter) || COFFRE_ITER)) }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const coffreMdpErreur = (mdp, conf) => { const s = String(mdp || ''); if (s.length < COFFRE_MDP_MIN) return `Mot de passe trop court : au moins ${COFFRE_MDP_MIN} caractères (une phrase facile à retenir convient).`; if (conf !== undefined && s !== String(conf || '')) return 'Les deux mots de passe ne sont pas identiques.'; return ''; };

/* ---------- IndexedDB « oenotrack-coffre » : l'enregistrement du coffre { id, mode, kek?, dek: { iv, ct }, sel?, iter?, cree, modifie } ---------- */
let _coffreIdb = null;
function coffreIdb() {
  if (_coffreIdb) return _coffreIdb;
  _coffreIdb = new Promise((res, rej) => { try { const r = window.indexedDB.open(COFFRE_IDB, 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(COFFRE_STORE)) r.result.createObjectStore(COFFRE_STORE); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('base bloquée')); } catch (e) { rej(e); } });
  _coffreIdb.catch(() => { _coffreIdb = null; }); return _coffreIdb;
}
const coffreIdbRun = (mode, fn) => coffreIdb().then((d) => new Promise((res, rej) => { const tx = d.transaction(COFFRE_STORE, mode); const rq = fn(tx.objectStore(COFFRE_STORE)); tx.oncomplete = () => res(rq ? rq.result : undefined); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); }));
const coffreRecLire = () => coffreIdbRun('readonly', (s) => s.get(COFFRE_REC));
const coffreRecEcrire = (rec) => coffreIdbRun('readwrite', (s) => s.put(rec, COFFRE_REC));
const coffreDisponible = () => { try { return typeof window !== 'undefined' && !!window.indexedDB && !!chSubtle(); } catch (e) { return false; } };
async function coffreCreer() {
  const c = chSubtle(); const kek = await c.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); // non extractible
  const brut = chAleatoire(32); const id = Array.from(chAleatoire(8)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const rec = { id, mode: 'appareil', kek, dek: await coffreEmballer(kek, brut), cree: new Date().toISOString(), modifie: new Date().toISOString() };
  await coffreRecEcrire(rec); const relu = await coffreRecLire(); if (!relu || relu.id !== id) throw new Error('clé de l’appareil non enregistrée');
  const dek = await coffreImporterDek(brut); brut.fill(0); return { rec: relu, dek };
}

/* ---------- démarrage : avant le premier affichage (CoffrePorte, 68q-coffre.jsx) ---------- */
const coffreLsLire = (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } };
const coffreLsEcrire = (k, v) => { try { if (v == null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); return true; } catch (e) { return false; } };
// → 'pret' | 'verrouille' (mot de passe demandé) | 'illisible' (clé perdue) | 'indisponible' (rien n'est chiffré sur ce navigateur)
function coffreDemarrer() {
  if (_coffre.demarre) return _coffre.demarre;
  _coffre.demarre = (async () => {
    const bruts = { [STORAGE_KEY]: coffreLsLire(STORAGE_KEY), [COFFRE_SECRETS_KEY]: coffreLsLire(COFFRE_SECRETS_KEY) }; _coffre.bruts = bruts;
    const chiffres = Object.keys(bruts).filter((k) => coffreEnveloppe(bruts[k]));
    let rec = null; let dispo = coffreDisponible();
    // IndexedDB muet (cadre intégré, navigateur bloqué) : sans données chiffrées, ouverture comme avant au bout de 6 s ; avec, on attend
    const delai = (p) => (chiffres.length ? p : Promise.race([p, new Promise((res, rej) => setTimeout(() => rej(new Error('délai')), 6000))]));
    if (dispo) { try { rec = await delai(coffreRecLire()); } catch (e) { dispo = false; } }
    if (!dispo) { _coffre.etat = chiffres.length ? 'illisible' : 'indisponible'; _coffre.erreur = chiffres.length ? 'clé du coffre inaccessible sur ce navigateur' : ''; return _coffre.etat; }
    if (rec && rec.mode === 'mdp') { _coffre.rec = rec; _coffre.etat = 'verrouille'; return _coffre.etat; }
    let dek = null;
    try {
      if (rec && rec.kek) dek = await coffreImporterDek(await coffreDeballerBrut(rec.kek, rec.dek));
      else if (!chiffres.length) { const n = await coffreCreer(); rec = n.rec; dek = n.dek; }
    } catch (e) { dek = null; }
    if (!dek) { _coffre.etat = chiffres.length ? 'illisible' : 'indisponible'; _coffre.erreur = 'clé de l’appareil absente ou effacée'; return _coffre.etat; }
    return coffreOuvrir(rec, dek);
  })();
  return _coffre.demarre;
}
// clé de données obtenue : lecture des enveloppes, migration de ce qui est encore en clair
async function coffreOuvrir(rec, dek) {
  const bruts = _coffre.bruts || {}; _coffre.rec = rec; _coffre.dek = dek; _coffre.id = rec.id;
  for (const k of Object.keys(bruts)) {
    const env = coffreEnveloppe(bruts[k]); if (!env) { if (bruts[k] != null) _coffre.clair[k] = bruts[k]; continue; }
    if (env.coffre.id !== rec.id) { _coffre.etat = 'illisible'; _coffre.erreur = 'données chiffrées avec une autre clé'; _coffre.dek = null; return _coffre.etat; }
    try { _coffre.clair[k] = await coffreDechiffrerAvec(dek, env, k); } catch (e) { _coffre.etat = 'illisible'; _coffre.erreur = 'déchiffrement impossible (données abîmées ?)'; _coffre.dek = null; return _coffre.etat; }
    if (k === STORAGE_KEY) _coffre.ancien = coffreAncien(env);
  }
  try { const s = JSON.parse(_coffre.clair[COFFRE_SECRETS_KEY] || '{}'); _coffre.secrets = s && typeof s === 'object' && !Array.isArray(s) ? s : {}; } catch (e) { _coffre.secrets = {}; }
  _coffre.etat = 'pret';
  // migration : base encore en clair → chiffrée (relue avant d'écraser) ; secrets en clair des versions antérieures → coffre
  if (bruts[STORAGE_KEY] != null && !coffreEnveloppe(bruts[STORAGE_KEY])) await coffreEcrireMaintenant(STORAGE_KEY, bruts[STORAGE_KEY], true);
  coffreMigrerSecrets();
  return _coffre.etat;
}
const coffrePret = () => _coffre.etat === 'pret' && !!_coffre.dek;
const coffreInfo = () => ({ etat: _coffre.etat, mode: (_coffre.rec && _coffre.rec.mode) || '', id: _coffre.id, depuis: (_coffre.rec && _coffre.rec.cree) || '', erreur: _coffre.erreur });

/* ---------- lecture et écriture (synchrones pour l'application : copie claire en mémoire, chiffrement en arrière-plan) ---------- */
function coffreLire(k) {
  if (Object.prototype.hasOwnProperty.call(_coffre.clair, k)) return _coffre.clair[k];
  const v = coffreLsLire(k); return coffreEnveloppe(v) ? null : v;
}
async function coffreEcrireMaintenant(k, texte, verifier) {
  if (!coffrePret()) return coffreLsEcrire(k, texte);
  if (texte == null) return coffreLsEcrire(k, null);
  const env = await coffreChiffrerAvec(_coffre.dek, _coffre.id, k, texte);
  if (verifier && (await coffreDechiffrerAvec(_coffre.dek, env, k)) !== texte) throw new Error('relecture du coffre différente');
  return coffreLsEcrire(k, env);
}
// écriture : la copie claire est à jour tout de suite (relue par l'application), l'enveloppe suit en quelques millisecondes ;
// des écritures rapprochées ne chiffrent que la dernière
function coffreEcrire(k, texte) {
  _coffre.clair[k] = texte;
  if (!coffrePret()) return _coffre.etat === 'indisponible' || _coffre.etat === 'inactif' ? coffreLsEcrire(k, texte) : false;
  const deja = Object.prototype.hasOwnProperty.call(_coffre.attente, k); _coffre.attente[k] = texte; if (deja) return true;
  _coffre.file = _coffre.file.then(async () => {
    const t = _coffre.attente[k]; delete _coffre.attente[k];
    let ok = false; try { ok = await coffreEcrireMaintenant(k, t); } catch (e) { ok = false; }
    try { window.dispatchEvent(new CustomEvent('oenotrack-stockage', { detail: { cle: k, ok } })); } catch (e) { /* ignoré */ }
  });
  return true;
}
const coffreAttendre = () => _coffre.file; // fin des écritures en cours (tests, sauvegarde avant fermeture)

/* ---------- secrets de l'appareil : clés d'API, clé de l'équipe, jetons cloud (jamais dans la base ni en clair dans le navigateur) ---------- */
const coffreSecret = (nom) => (Object.prototype.hasOwnProperty.call(_coffre.secrets, nom) ? _coffre.secrets[nom] : undefined);
function coffreSecretEcrire(nom, valeur) {
  if (valeur === undefined || valeur === null) delete _coffre.secrets[nom]; else _coffre.secrets[nom] = valeur;
  return coffreEcrire(COFFRE_SECRETS_KEY, JSON.stringify(_coffre.secrets));
}
// secrets en clair laissés par une version antérieure (ou réécrits par elle) : repris dans le coffre puis retirés du stockage
function coffreMigrerSecrets() {
  if (!coffrePret()) return false; let n = 0;
  const ia = (() => { try { return JSON.parse(coffreLsLire(IA_KEY) || 'null'); } catch (e) { return null; } })();
  if (ia && typeof ia === 'object' && ia.cles && typeof ia.cles === 'object') {
    const cles = { ...(coffreSecret('iaCles') || {}) }; Object.keys(ia.cles).forEach((f) => { if (ia.cles[f]) cles[f] = String(ia.cles[f]); });
    coffreSecretEcrire('iaCles', cles); const reste = { ...ia }; delete reste.cles; coffreLsEcrire(IA_KEY, JSON.stringify(reste)); n += 1;
  }
  const ch = (() => { try { return JSON.parse(coffreLsLire(CHIFFRE_CLE_KEY) || 'null'); } catch (e) { return null; } })();
  if (ch && ch.brut && ch.cleId) { coffreSecretEcrire('chiffrementCle', ch); coffreLsEcrire(CHIFFRE_CLE_KEY, null); n += 1; }
  const jt = (() => { try { return JSON.parse(coffreLsLire(CLOUD_JETONS_KEY) || 'null'); } catch (e) { return null; } })();
  if (jt && typeof jt === 'object' && Object.keys(jt).length) { coffreSecretEcrire('cloudJetons', { ...(coffreSecret('cloudJetons') || {}), ...jt }); coffreLsEcrire(CLOUD_JETONS_KEY, null); n += 1; }
  return n > 0;
}

/* ---------- textes et documents rangés dans IndexedDB (points de restauration, instantanés, documents joints) ---------- */
const coffreTexteNom = 'idb';
async function coffreTexteChiffrer(texte) { return coffrePret() ? coffreChiffrerAvec(_coffre.dek, _coffre.id, coffreTexteNom, texte) : texte; }
async function coffreTexteDechiffrer(t) { const env = coffreEnveloppe(t); if (!env) return t; if (!coffrePret()) throw { coffre: true, message: 'Coffre de l’appareil verrouillé.' }; return coffreDechiffrerAvec(_coffre.dek, env, coffreTexteNom); }
async function coffreBlobChiffrer(blob) {
  if (!coffrePret() || !blob) return blob; const u = new Uint8Array(await blob.arrayBuffer()); const iv = chAleatoire(12);
  const h = new TextEncoder().encode(JSON.stringify({ id: _coffre.id, type: blob.type || '', ...(blob.name ? { nom: String(blob.name) } : {}) }));
  const d = await chAes(_coffre.dek, iv, u, 'chiffrer', h);
  const out = new Uint8Array(COFFRE_MAGIC.length + 2 + h.length + 12 + d.length); let p = 0;
  out.set(COFFRE_MAGIC, p); p += COFFRE_MAGIC.length; out[p] = h.length >> 8; out[p + 1] = h.length & 0xff; p += 2; out.set(h, p); p += h.length; out.set(iv, p); p += 12; out.set(d, p);
  return new Blob([out], { type: 'application/octet-stream' });
}
async function coffreBlobDechiffrer(blob) {
  if (!blob || typeof blob.arrayBuffer !== 'function' || blob.size < COFFRE_MAGIC.length + 14) return blob;
  const u = new Uint8Array(await blob.slice(0, COFFRE_MAGIC.length).arrayBuffer()); if (!COFFRE_MAGIC.every((b, i) => u[i] === b)) return blob; // document rangé avant 0.38 : en clair
  if (!coffrePret()) throw { coffre: true, message: 'Coffre de l’appareil verrouillé.' };
  const a = new Uint8Array(await blob.arrayBuffer()); let p = COFFRE_MAGIC.length; const n = (a[p] << 8) | a[p + 1]; p += 2; const h = a.slice(p, p + n); p += n;
  let H = {}; try { H = JSON.parse(new TextDecoder().decode(h)) || {}; } catch (e) { H = {}; }
  const d = await chAes(_coffre.dek, a.slice(p, p + 12), a.slice(p + 12), 'dechiffrer', h);
  if (H.nom && typeof File === 'function') { try { return new File([d], H.nom, { type: H.type || '' }); } catch (e) { /* Blob simple */ } }
  return new Blob([d], { type: H.type || '' });
}

/* ---------- mot de passe de l'appareil (mode « mot de passe ») ---------- */
async function coffreDeverrouiller(mdp) {
  const rec = _coffre.rec; if (!rec || rec.mode !== 'mdp') return coffreInfo().etat;
  const brut = await coffreDeballerBrut(await coffreKekMdp(mdp, rec.sel, rec.iter), rec.dek); const dek = await coffreImporterDek(brut); brut.fill(0);
  return coffreOuvrir(rec, dek);
}
// clé de données en clair, le temps de la réemballer (jamais gardée)
async function coffreDekBrut(mdpActuel) {
  const rec = _coffre.rec; if (!rec) throw { coffre: true, message: 'Coffre inactif sur cet appareil.' };
  return rec.mode === 'mdp' ? coffreDeballerBrut(await coffreKekMdp(mdpActuel, rec.sel, rec.iter), rec.dek) : coffreDeballerBrut(rec.kek, rec.dek);
}
async function coffreMdpActiver(mdp, mdpActuel) {
  if (!coffrePret()) return fail('Coffre de l’appareil indisponible.'); const e = coffreMdpErreur(mdp); if (e) return fail(e);
  const brut = await coffreDekBrut(mdpActuel); const sel = chB64(chAleatoire(16));
  const rec = { id: _coffre.rec.id, mode: 'mdp', dek: await coffreEmballer(await coffreKekMdp(mdp, sel, COFFRE_ITER), brut), sel, iter: COFFRE_ITER, cree: _coffre.rec.cree, modifie: new Date().toISOString() };
  brut.fill(0); await coffreRecEcrire(rec); _coffre.rec = rec; return okr();
}
async function coffreMdpRetirer(mdpActuel) {
  if (!coffrePret() || !_coffre.rec || _coffre.rec.mode !== 'mdp') return fail('Aucun mot de passe sur cet appareil.');
  const brut = await coffreDekBrut(mdpActuel); const kek = await chSubtle().subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const rec = { id: _coffre.rec.id, mode: 'appareil', kek, dek: await coffreEmballer(kek, brut), cree: _coffre.rec.cree, modifie: new Date().toISOString() };
  brut.fill(0); await coffreRecEcrire(rec); _coffre.rec = rec; return okr();
}
// clé perdue (données illisibles) : l'enveloppe est mise de côté (jamais effacée), puis départ sur une base vide ou une sauvegarde
async function coffreRepartir() {
  const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  [STORAGE_KEY, COFFRE_SECRETS_KEY].forEach((k) => { const v = coffreLsLire(k); if (coffreEnveloppe(v)) { coffreLsEcrire(`${k}-illisible-${date}`, v); coffreLsEcrire(k, null); } });
  _coffre.demarre = null; _coffre.clair = {}; _coffre.secrets = {}; _coffre.etat = 'inactif';
  try { await coffreIdbRun('readwrite', (s) => s.delete(COFFRE_REC)); } catch (e) { /* ignoré */ }
  return coffreDemarrer();
}
