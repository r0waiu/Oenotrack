/* ============ CLÉS D'ACCÈS : CONNEXION SIMPLIFIÉE PAR L'APPAREIL (0.28.0-alpha.1, multiplateforme 0.38.0-alpha.2) ============
   Empreinte digitale, visage ou code PIN de l'appareil (Windows Hello, Touch ID et Face ID sur Mac, iPhone et iPad, déverrouillage
   Android, Gestionnaire de mots de passe de Chrome sous Linux et ChromeOS, clé de sécurité USB/NFC, ou téléphone par QR code), grâce
   aux clés d'accès (norme WebAuthn). La clé privée ne quitte jamais l'appareil ; Œnotrack garde seulement la clé publique :
   db.utilisateurs[].cles [{ id (identifiant de la clé, base64url), nom, cle (clé publique SPKI, base64), alg (-7 ES256 | -257 RS256),
   rp (domaine du site), creeLe, acceptee (false : en attente d'un administrateur), appareil,
   type (0.38.0-alpha.2 : 'appareil' = empreinte, visage ou code PIN intégrés | 'externe' = clé de sécurité USB / NFC ou autre téléphone | '' inconnu),
   transports (0.38.0-alpha.2 : moyens annoncés par l'appareil, CLES_TRANSPORTS ; repris à la connexion pour que le téléphone ou l'ordinateur
   propose d'abord son propre déverrouillage),
   0.39.0-alpha.1 — rattachement strict et gestion par utilisateur : uid (compte propriétaire, vérifié à la connexion avec l'identifiant
   d'utilisateur renvoyé par l'appareil), ajoutePar (administrateur qui l'a enregistrée pour ce compte), acceptePar / accepteLe,
   revoquePar / revoqueLe (accès retiré par un administrateur : la clé reste listée, acceptee = false, une version antérieure la refuse
   aussi) }]
   db.utilisateurs[].clesEnregistrer (0.39.0-alpha.1) : true (peut enregistrer ses appareils) | false (non) | absent (réglage commun).
   Une clé dont l'identifiant figure sous deux comptes (fusion de synchronisations) n'est plus utilisable : à retirer par un administrateur.
   Options WebAuthn (0.38.0-alpha.2, clesOptionsCreation / clesOptionsConnexion) : « cet appareil » demande l'authentificateur intégré
   (authenticatorAttachment 'platform', clé d'accès découvrable, indice 'client-device') — sur Android, sans cela Chrome ne proposait que
   les clés USB / NFC ou un autre appareil ; « clé de sécurité ou autre téléphone » demande un authentificateur externe ('cross-platform').
   Navigateur sans getPublicKey() : la clé publique est lue dans l'objet d'attestation (CBOR, COSE → SPKI, cleDepuisAttestation).
   db.settings.securite.cles = { actif (vrai par défaut), validation : 'admin' (par défaut : un administrateur accepte chaque nouvel
   appareil) | 'libre', inscription (0.39.0-alpha.1) : 'tous' (par défaut : chacun peut enregistrer ses appareils) | 'choisis' (seuls
   les utilisateurs autorisés un par un) }. La vérification est locale, sans serveur : l'appareil signe un défi aléatoire, contrôlé avec la clé publique
   (origine, domaine, présence et vérification de l'utilisateur). Le mot de passe reste toujours possible. */
const CLES_ALGS = [-7, -257];
const CLES_TRANSPORTS = ['internal', 'hybrid', 'usb', 'nfc', 'ble', 'smart-card'];
const clesTransports = (t) => (Array.isArray(t) ? [...new Set(t.map((x) => String(x || '')).filter((x) => CLES_TRANSPORTS.includes(x)))] : []);
const clesType = (t) => (t === 'appareil' || t === 'externe' ? t : '');
const clesB64 = (u8) => { let s = ''; const b = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8); for (let i = 0; i < b.length; i += 1) s += String.fromCharCode(b[i]); return btoa(s); };
const clesDeB64 = (s) => { const t = atob(String(s || '')); const o = new Uint8Array(t.length); for (let i = 0; i < t.length; i += 1) o[i] = t.charCodeAt(i); return o; };
const clesB64u = (u8) => clesB64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const clesDeB64u = (s) => { const t = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); return clesDeB64(t + '==='.slice((t.length + 3) % 4)); };
const clesReglages = (db) => { const c = ((db && db.settings && db.settings.securite) || {}).cles || {}; return { actif: c.actif !== false, validation: c.validation === 'libre' ? 'libre' : 'admin', inscription: c.inscription === 'choisis' ? 'choisis' : 'tous' }; };
const clesDe = (db, uid) => { const u = utilisateurDe(db, uid); return u && Array.isArray(u.cles) ? u.cles.filter((k) => k && k.id) : []; };
// état d'une clé : 'acceptee' | 'attente' (jamais acceptée) | 'revoquee' (accès retiré par un administrateur) | 'autre-compte' | 'doublon'
const clesDoublons = (db) => { const n = {}; (db.utilisateurs || []).forEach((u) => uniq(((u && u.cles) || []).filter((k) => k && k.id).map((k) => k.id)).forEach((id) => { n[id] = (n[id] || 0) + 1; })); return Object.keys(n).filter((id) => n[id] > 1); };
function cleEtat(db, u, k, doublons) {
  if (k.uid && u && k.uid !== u.id) return 'autre-compte';
  if ((doublons || clesDoublons(db)).includes(k.id)) return 'doublon';
  return k.acceptee !== false ? 'acceptee' : k.revoqueLe ? 'revoquee' : 'attente';
}
// l'utilisateur peut-il enregistrer lui-même ses appareils ? (administrateurs : toujours)
function clesPeutEnregistrer(db, uid) {
  const u = utilisateurDe(db, uid); if (!u) return false; if (!securiteActive(db) || estAdmin(db, uid)) return true;
  if (u.clesEnregistrer === true || u.clesEnregistrer === false) return u.clesEnregistrer;
  return clesReglages(db).inscription !== 'choisis';
}
// clés utilisables pour se connecter sur ce site : utilisateurs actifs, clés acceptées, même domaine, rattachées à ce seul compte
function clesUtilisables(db, rp, uid) {
  if (!securiteActive(db) || !clesReglages(db).actif) return []; const dbl = clesDoublons(db);
  return (db.utilisateurs || []).filter((u) => u && u.actif !== false && (!uid || u.id === uid)).flatMap((u) => (u.cles || []).filter((k) => k && k.id && cleEtat(db, u, k, dbl) === 'acceptee' && (!rp || !k.rp || k.rp === rp)).map((k) => ({ u, k })));
}
// 0.49.0-alpha.2 : l'empreinte d'abord ? Oui si l'une des clés utilisables du compte est intégrée à CET appareil (empreinte, visage ou
// code PIN) : clé créée ou utilisée ici (ici[id], mémoire de l'appareil), ou clé « appareil » enregistrée avant cette mémoire sous le même
// nom d'appareil quand l'appareil a un authentificateur intégré. Une clé de sécurité ou un autre téléphone (externe) ne compte pas.
function clesEmpreinteDabord(L, o) {
  const x = o || {}; const ici = x.ici || {};
  return (L || []).some((t) => { const k = t && (t.k || t); if (!k || !k.id || k.type === 'externe') return false; return !!ici[k.id] || (x.integre === true && !!k.appareil && k.appareil === x.appareil); });
}
// identifiant d'utilisateur renvoyé par l'appareil (userHandle) : doit être celui du compte de la clé (clé d'un autre compte refusée)
function cleProprietaireOk(u, userHandle) {
  if (!userHandle || !u) return true; let h = ''; try { h = new TextDecoder().decode(userHandle instanceof Uint8Array ? userHandle : new Uint8Array(userHandle)); } catch (e) { return false; }
  return !h || h === String(u.id || '').slice(0, 64);
}
// dernière connexion faite avec cette clé (journal des accès)
function cleDerniereUtilisation(db, id) { let d = ''; (db.audit || []).forEach((a) => { if (a && a.action === 'connexion' && a.type === 'cle' && a.cibleId === id && String(a.date) > d) d = String(a.date); }); return d; }
// réglage par utilisateur (administrateurs) : true | false | null (réglage commun)
function clesEnregistrerRegler(db, uid, v) {
  const u = utilisateurDe(db, uid); if (!u) return fail('Utilisateur introuvable.');
  if (v === true || v === false) u.clesEnregistrer = v; else delete u.clesEnregistrer; return okr();
}
function cleAjouter(db, uid, s, par) {
  const u = utilisateurDe(db, uid); if (!u) return fail('Utilisateur introuvable.');
  if (!clesReglages(db).actif) return fail('La connexion par clé d’accès est désactivée (Paramètres › Appareils & clés d’accès).');
  const pour = par && par !== uid; // un administrateur enregistre cet appareil pour un autre compte
  if (pour && securiteActive(db) && !estAdmin(db, par)) return fail('Seul un administrateur peut enregistrer un appareil pour un autre compte.');
  if (!pour && !clesPeutEnregistrer(db, uid)) return fail('Votre compte n’est pas autorisé à enregistrer ses appareils : demandez-le à un administrateur.');
  const id = String((s && s.id) || ''); const cle = String((s && s.cle) || '');
  if (!/^[A-Za-z0-9_-]{8,1400}$/.test(id) || !/^[A-Za-z0-9+/]+=*$/.test(cle) || cle.length > 2000) return fail('Clé d’accès illisible.');
  if (!CLES_ALGS.includes(Number(s.alg))) return fail('Type de clé non pris en charge par Œnotrack (algorithmes ES256 ou RS256).');
  if ((db.utilisateurs || []).some((x) => x && (x.cles || []).some((k) => k && k.id === id))) return fail('Cette clé d’accès est déjà enregistrée.');
  const k = { id, uid: u.id, nom: String((s && s.nom) || 'Appareil').trim().slice(0, 60) || 'Appareil', cle, alg: Number(s.alg), rp: String((s && s.rp) || '').slice(0, 253), creeLe: (s && s.le) || new Date().toISOString(), acceptee: clesReglages(db).validation === 'libre' || estAdmin(db, pour ? par : uid), appareil: String((s && s.appareil) || '').slice(0, 60) };
  if (pour) k.ajoutePar = par; if (k.acceptee && (pour || estAdmin(db, uid))) { k.acceptePar = pour ? par : uid; k.accepteLe = k.creeLe; }
  const tr = clesTransports(s && s.transports); if (tr.length) k.transports = tr; const ty = clesType(s && s.type); if (ty) k.type = ty;
  if (!Array.isArray(u.cles)) u.cles = []; u.cles.push(k); return okr({ id, acceptee: k.acceptee });
}
function cleModifier(db, uid, id, patch) {
  const u = utilisateurDe(db, uid); const k = u && (u.cles || []).find((x) => x && x.id === id); if (!k) return fail('Clé d’accès introuvable.');
  if (patch.nom !== undefined) { const n = String(patch.nom || '').trim().slice(0, 60); if (!n) return fail('Donnez un nom à cet appareil.'); k.nom = n; }
  if (patch.acceptee !== undefined) {
    const le = new Date().toISOString(); const par = patch.par || '';
    if (patch.acceptee) { k.acceptee = true; k.acceptePar = par; k.accepteLe = le; delete k.revoquePar; delete k.revoqueLe; if (!k.uid) k.uid = u.id; }
    else { k.acceptee = false; k.revoquePar = par; k.revoqueLe = le; } // accès retiré : la clé reste listée, réactivable par un administrateur
  }
  return okr();
}
function cleRetirer(db, uid, id) { const u = utilisateurDe(db, uid); if (!u || !(u.cles || []).some((x) => x && x.id === id)) return fail('Clé d’accès introuvable.'); u.cles = u.cles.filter((x) => !(x && x.id === id)); return okr(); }
function clesRegler(db, patch) {
  db.settings.securite = db.settings.securite || {}; const c = { ...(db.settings.securite.cles || {}) };
  if (patch.actif !== undefined) c.actif = !!patch.actif; if (patch.validation !== undefined) c.validation = patch.validation === 'libre' ? 'libre' : 'admin';
  if (patch.inscription !== undefined) { if (patch.inscription === 'choisis') c.inscription = 'choisis'; else delete c.inscription; }
  db.settings.securite = { ...db.settings.securite, cles: c }; return okr();
}
// signature ECDSA de WebAuthn (DER) → format brut r‖s attendu par Web Crypto
function clesDerVersBrut(der, n = 32) {
  const b = der instanceof Uint8Array ? der : new Uint8Array(der); if (b[0] !== 0x30) return null;
  let i = 2; if (b[1] & 0x80) i = 2 + (b[1] & 0x7f);
  const lire = () => { if (b[i] !== 0x02) return null; const l = b[i + 1]; let v = b.slice(i + 2, i + 2 + l); i += 2 + l; while (v.length > n && v[0] === 0) v = v.slice(1); if (v.length > n) return null; const o = new Uint8Array(n); o.set(v, n - v.length); return o; };
  const r = lire(); const s = lire(); if (!r || !s) return null; const o = new Uint8Array(2 * n); o.set(r, 0); o.set(s, n); return o;
}
const clesEgaux = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
// vérifie la réponse de l'appareil : défi, origine, domaine, présence et vérification de l'utilisateur, signature
async function cleVerifier(k, rep, att) {
  try {
    const S = (globalThis.crypto || {}).subtle; if (!S) return { ok: false, msg: 'Vérification impossible : page non sécurisée (https requis).' };
    const cd = rep.clientDataJSON instanceof Uint8Array ? rep.clientDataJSON : new Uint8Array(rep.clientDataJSON);
    const ad = rep.authenticatorData instanceof Uint8Array ? rep.authenticatorData : new Uint8Array(rep.authenticatorData);
    const sig = rep.signature instanceof Uint8Array ? rep.signature : new Uint8Array(rep.signature);
    let c = null; try { c = JSON.parse(new TextDecoder().decode(cd)); } catch (e) { c = null; }
    if (!c || c.type !== 'webauthn.get') return { ok: false, msg: 'Réponse de l’appareil illisible.' };
    if (c.challenge !== clesB64u(att.defi)) return { ok: false, msg: 'Défi différent : réponse rejouée ou périmée.' };
    if (att.origine && c.origin !== att.origine) return { ok: false, msg: `Origine inattendue (${String(c.origin).slice(0, 80)}).` };
    if (ad.length < 37) return { ok: false, msg: 'Réponse de l’appareil incomplète.' };
    const rpHash = new Uint8Array(await S.digest('SHA-256', new TextEncoder().encode(att.rp || k.rp || '')));
    if (!clesEgaux(ad.slice(0, 32), rpHash)) return { ok: false, msg: 'Clé d’accès d’un autre site.' };
    const fl = ad[32]; if (!(fl & 0x01)) return { ok: false, msg: 'Présence de l’utilisateur non confirmée.' }; if (!(fl & 0x04)) return { ok: false, msg: 'Empreinte, visage ou code PIN non vérifiés par l’appareil.' };
    const h = new Uint8Array(await S.digest('SHA-256', cd)); const donnees = new Uint8Array(ad.length + h.length); donnees.set(ad, 0); donnees.set(h, ad.length);
    const spki = clesDeB64(k.cle); let bon = false;
    if (Number(k.alg) === -7) { const cle = await S.importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']); const brut = clesDerVersBrut(sig, 32); bon = !!brut && await S.verify({ name: 'ECDSA', hash: 'SHA-256' }, cle, brut, donnees); }
    else if (Number(k.alg) === -257) { const cle = await S.importKey('spki', spki, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']); bon = await S.verify({ name: 'RSASSA-PKCS1-v1_5' }, cle, sig, donnees); }
    return bon ? { ok: true } : { ok: false, msg: 'Signature de l’appareil invalide.' };
  } catch (e) { return { ok: false, msg: `Vérification impossible : ${(e && e.message) || e}` }; }
}

// ---- options WebAuthn (0.38.0-alpha.2) : identiques sur Windows, macOS, iOS, Android, Linux ; le navigateur ignore les champs qu'il ne connaît pas
// mode 'appareil' : authentificateur intégré (Windows Hello, Touch ID / Face ID, empreinte ou verrouillage Android, Gestionnaire de mots de passe)
// mode 'externe' : clé de sécurité USB / NFC / Bluetooth ou téléphone par QR code ; mode 'auto' : au choix du navigateur (intégré d'abord)
const clesDescripteur = (k) => { const d = { type: 'public-key', id: clesDeB64u(k.id) }; const t = clesTransports(k.transports); if (t.length) d.transports = t; return d; };
function clesOptionsCreation(o) {
  const mode = ['appareil', 'externe'].includes(o && o.mode) ? o.mode : 'auto'; const u = (o && o.user) || {};
  const sel = { userVerification: 'required' };
  if (mode === 'appareil') Object.assign(sel, { authenticatorAttachment: 'platform', residentKey: 'required', requireResidentKey: true });
  else if (mode === 'externe') Object.assign(sel, { authenticatorAttachment: 'cross-platform', residentKey: 'preferred', requireResidentKey: false });
  else Object.assign(sel, { residentKey: 'preferred', requireResidentKey: false });
  return {
    rp: { name: 'Œnotrack', id: o.rp }, user: { id: new TextEncoder().encode(String(u.id || '')).slice(0, 64), name: String(u.identifiant || u.id || ''), displayName: String(u.nom || u.identifiant || '') },
    challenge: o.defi, pubKeyCredParams: CLES_ALGS.map((alg) => ({ type: 'public-key', alg })), timeout: 180000, attestation: 'none',
    authenticatorSelection: sel, hints: mode === 'appareil' ? ['client-device'] : mode === 'externe' ? ['security-key', 'hybrid'] : ['client-device', 'hybrid', 'security-key'],
    excludeCredentials: ((o && o.exclure) || []).filter((k) => k && k.id).map(clesDescripteur),
  };
}
// connexion : clés acceptées avec leurs transports ; seulement des clés intégrées → l'appareil propose d'abord son propre déverrouillage
function clesOptionsConnexion(o) {
  const L = ((o && o.cles) || []).filter((k) => k && k.id).slice(0, 64);
  const r = { challenge: o.defi, rpId: o.rp, userVerification: 'required', timeout: 120000, allowCredentials: L.map(clesDescripteur) };
  if (L.length && L.every((k) => k.type === 'appareil' || clesTransports(k.transports).includes('internal'))) r.hints = ['client-device'];
  else if (L.length && L.every((k) => k.type === 'externe')) r.hints = ['security-key', 'hybrid'];
  return r;
}
// ---- lecture de la clé publique dans l'objet d'attestation (navigateurs sans getPublicKey : anciens Safari, Firefox, WebView)
function clesCbor(u8) {
  const b = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8); let i = 0;
  const lg = (inf) => { if (inf < 24) return inf; let n = 0; const t = inf === 24 ? 1 : inf === 25 ? 2 : inf === 26 ? 4 : inf === 27 ? 8 : -1; if (t < 0 || i + t > b.length) throw new Error('CBOR'); for (let j = 0; j < t; j += 1) n = n * 256 + b[i++]; return n; };
  const lire = (prof) => {
    if (prof > 16 || i >= b.length) throw new Error('CBOR'); const o = b[i++]; const maj = o >> 5; const n = lg(o & 31);
    if (maj === 0) return n; if (maj === 1) return -1 - n;
    if (maj === 2) { if (i + n > b.length) throw new Error('CBOR'); const v = b.slice(i, i + n); i += n; return v; }
    if (maj === 3) { if (i + n > b.length) throw new Error('CBOR'); const v = new TextDecoder().decode(b.slice(i, i + n)); i += n; return v; }
    if (maj === 4) { const a = []; for (let j = 0; j < n; j += 1) a.push(lire(prof + 1)); return a; }
    if (maj === 5) { const m = new Map(); for (let j = 0; j < n; j += 1) { const k = lire(prof + 1); m.set(k, lire(prof + 1)); } return m; }
    if (maj === 7) return n === 20 ? false : n === 21 ? true : null;
    throw new Error('CBOR');
  };
  const v = lire(0); return { v, fin: i };
}
const clesDerLong = (n) => (n < 128 ? [n] : n < 256 ? [0x81, n] : [0x82, n >> 8, n & 255]);
const clesDer = (tag, octets) => [tag, ...clesDerLong(octets.length), ...octets];
const clesDerEntier = (u8) => { let v = Array.from(u8); while (v.length > 1 && v[0] === 0) v = v.slice(1); if (v[0] & 0x80) v = [0, ...v]; return clesDer(0x02, v); };
// clé COSE (Map CBOR) → clé publique SPKI (DER), pour ES256 (EC2 P-256) et RS256
function clesCoseVersSpki(m) {
  if (!(m instanceof Map)) return null; const alg = m.get(3);
  if (alg === -7 && m.get(1) === 2 && m.get(-1) === 1) {
    const x = m.get(-2); const y = m.get(-3); if (!(x instanceof Uint8Array) || !(y instanceof Uint8Array) || x.length !== 32 || y.length !== 32) return null;
    const ent = [0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07];
    return { alg, spki: Uint8Array.from(clesDer(0x30, [...ent, ...clesDer(0x03, [0, 0x04, ...x, ...y])])) };
  }
  if (alg === -257 && m.get(1) === 3) {
    const n = m.get(-1); const e = m.get(-2); if (!(n instanceof Uint8Array) || !(e instanceof Uint8Array) || n.length < 128) return null;
    const ent = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
    return { alg, spki: Uint8Array.from(clesDer(0x30, [...ent, ...clesDer(0x03, [0, ...clesDer(0x30, [...clesDerEntier(n), ...clesDerEntier(e)])])])) };
  }
  return null;
}
// objet d'attestation (CBOR { fmt, attStmt, authData }) → { alg, spki, flags } ; null si illisible
function cleDepuisAttestation(att) {
  try {
    const m = clesCbor(att).v; const ad = m instanceof Map ? m.get('authData') : null; if (!(ad instanceof Uint8Array) || ad.length < 55) return null;
    const flags = ad[32]; if (!(flags & 0x40)) return null; const l = (ad[53] << 8) | ad[54]; const p = 55 + l; if (p >= ad.length) return null;
    const r = clesCoseVersSpki(clesCbor(ad.slice(p)).v); return r ? { ...r, flags } : null;
  } catch (e) { return null; }
}
