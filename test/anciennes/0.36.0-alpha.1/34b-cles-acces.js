/* ============ CLÉS D'ACCÈS : CONNEXION SIMPLIFIÉE PAR L'APPAREIL (0.28.0-alpha.1) ============
   Empreinte digitale, visage ou code PIN de l'appareil (Windows Hello, Touch ID et Face ID sur Mac, iPhone et iPad, déverrouillage
   Android, Gestionnaire de mots de passe de Chrome sous Linux et ChromeOS, clé de sécurité USB/NFC, ou téléphone par QR code), grâce
   aux clés d'accès (norme WebAuthn). La clé privée ne quitte jamais l'appareil ; Œnotrack garde seulement la clé publique :
   db.utilisateurs[].cles [{ id (identifiant de la clé, base64url), nom, cle (clé publique SPKI, base64), alg (-7 ES256 | -257 RS256),
   rp (domaine du site), creeLe, acceptee (false : en attente d'un administrateur), appareil }]
   db.settings.securite.cles = { actif (vrai par défaut), validation : 'admin' (par défaut : un administrateur accepte chaque nouvel
   appareil) | 'libre' }. La vérification est locale, sans serveur : l'appareil signe un défi aléatoire, contrôlé avec la clé publique
   (origine, domaine, présence et vérification de l'utilisateur). Le mot de passe reste toujours possible. */
const CLES_ALGS = [-7, -257];
const clesB64 = (u8) => { let s = ''; const b = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8); for (let i = 0; i < b.length; i += 1) s += String.fromCharCode(b[i]); return btoa(s); };
const clesDeB64 = (s) => { const t = atob(String(s || '')); const o = new Uint8Array(t.length); for (let i = 0; i < t.length; i += 1) o[i] = t.charCodeAt(i); return o; };
const clesB64u = (u8) => clesB64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const clesDeB64u = (s) => { const t = String(s || '').replace(/-/g, '+').replace(/_/g, '/'); return clesDeB64(t + '==='.slice((t.length + 3) % 4)); };
const clesReglages = (db) => { const c = ((db && db.settings && db.settings.securite) || {}).cles || {}; return { actif: c.actif !== false, validation: c.validation === 'libre' ? 'libre' : 'admin' }; };
const clesDe = (db, uid) => { const u = utilisateurDe(db, uid); return u && Array.isArray(u.cles) ? u.cles.filter((k) => k && k.id) : []; };
// clés utilisables pour se connecter sur ce site : utilisateurs actifs, clés acceptées, même domaine
function clesUtilisables(db, rp, uid) {
  if (!securiteActive(db) || !clesReglages(db).actif) return [];
  return (db.utilisateurs || []).filter((u) => u && u.actif !== false && (!uid || u.id === uid)).flatMap((u) => (u.cles || []).filter((k) => k && k.id && k.acceptee !== false && (!rp || !k.rp || k.rp === rp)).map((k) => ({ u, k })));
}
function cleAjouter(db, uid, s) {
  const u = utilisateurDe(db, uid); if (!u) return fail('Utilisateur introuvable.');
  if (!clesReglages(db).actif) return fail('La connexion par clé d’accès est désactivée (Paramètres › Utilisateurs & droits).');
  const id = String((s && s.id) || ''); const cle = String((s && s.cle) || '');
  if (!/^[A-Za-z0-9_-]{8,1400}$/.test(id) || !/^[A-Za-z0-9+/]+=*$/.test(cle) || cle.length > 2000) return fail('Clé d’accès illisible.');
  if (!CLES_ALGS.includes(Number(s.alg))) return fail('Type de clé non pris en charge par Œnotrack (algorithmes ES256 ou RS256).');
  if ((db.utilisateurs || []).some((x) => x && (x.cles || []).some((k) => k && k.id === id))) return fail('Cette clé d’accès est déjà enregistrée.');
  const k = { id, nom: String((s && s.nom) || 'Appareil').trim().slice(0, 60) || 'Appareil', cle, alg: Number(s.alg), rp: String((s && s.rp) || '').slice(0, 253), creeLe: (s && s.le) || new Date().toISOString(), acceptee: clesReglages(db).validation === 'libre' || estAdmin(db, uid), appareil: String((s && s.appareil) || '').slice(0, 60) };
  if (!Array.isArray(u.cles)) u.cles = []; u.cles.push(k); return okr({ id, acceptee: k.acceptee });
}
function cleModifier(db, uid, id, patch) {
  const u = utilisateurDe(db, uid); const k = u && (u.cles || []).find((x) => x && x.id === id); if (!k) return fail('Clé d’accès introuvable.');
  if (patch.nom !== undefined) { const n = String(patch.nom || '').trim().slice(0, 60); if (!n) return fail('Donnez un nom à cet appareil.'); k.nom = n; }
  if (patch.acceptee !== undefined) k.acceptee = !!patch.acceptee;
  return okr();
}
function cleRetirer(db, uid, id) { const u = utilisateurDe(db, uid); if (!u || !(u.cles || []).some((x) => x && x.id === id)) return fail('Clé d’accès introuvable.'); u.cles = u.cles.filter((x) => !(x && x.id === id)); return okr(); }
function clesRegler(db, patch) {
  db.settings.securite = db.settings.securite || {}; const c = { ...(db.settings.securite.cles || {}) };
  if (patch.actif !== undefined) c.actif = !!patch.actif; if (patch.validation !== undefined) c.validation = patch.validation === 'libre' ? 'libre' : 'admin';
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
