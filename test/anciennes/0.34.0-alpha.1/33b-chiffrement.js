/* ============ CHIFFREMENT DES SAUVEGARDES ET DU DRIVE (0.29.0-alpha.1) ============
   Un mot de passe commun à l'équipe (réglage commun) protège les fichiers qui quittent l'appareil : sauvegarde complète, fichier du
   Drive (base, copies du jour, documents joints) et synchronisation par fichier. AES-GCM 256 bits, clé dérivée du mot de passe par
   PBKDF2-SHA-256 (600 000 itérations, sel aléatoire). Le mot de passe et la clé ne sont jamais dans la base, ni dans les sauvegardes,
   ni sur le Drive : chaque appareil garde sa clé dérivée dans son stockage local. Mot de passe perdu = fichiers chiffrés illisibles.
   Compatibilité : l'enveloppe chiffrée n'a ni opérations ni lots ni contenants — une version antérieure la refuse (« ne ressemble pas
   à une sauvegarde Œnotrack ») au lieu de la lire comme une base vide : elle ne peut ni la mal lire ni l'écraser.
   Base : db.settings.chiffrement = { actif, sel, iter, cleId, temoin, temoinIv, depuis, par } (témoin = « oenotrack » chiffré : vérifie
   un mot de passe sans fichier) ; clé de l'appareil : localStorage « oenotrack-chiffrement-cle » = { cleId, brut, sel, iter }. */
const CHIFFRE_FORMAT = 'oenotrack-chiffre';
const CHIFFRE_VERSION = 1;
const CHIFFRE_ITER = 600000;
const CHIFFRE_CLE_KEY = 'oenotrack-chiffrement-cle';
const CHIFFRE_TEMOIN = 'oenotrack';
const CHIFFRE_MAGIC = [0x4f, 0x45, 0x4e, 0x43, 0x48, 0x31]; // « OENCH1 » : document joint chiffré (binaire)
const CHIFFRE_MDP_MIN = 10;
const chB64 = (u8) => { let s = ''; const a = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000)); return btoa(s); };
const chDeB64 = (s) => { const b = atob(String(s || '')); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i += 1) u[i] = b.charCodeAt(i); return u; };
const chSubtle = () => { const c = (typeof crypto !== 'undefined' && crypto) || (typeof window !== 'undefined' && window.crypto) || null; if (!c || !c.subtle) throw { chiffre: true, message: 'Chiffrement indisponible dans ce navigateur (connexion sécurisée https nécessaire).' }; return c; };
const chAleatoire = (n) => { const u = new Uint8Array(n); chSubtle().getRandomValues(u); return u; };
const chiffrementReglage = (db) => { const c = (db && db.settings && db.settings.chiffrement) || null; return c && c.actif && c.sel && c.cleId ? c : null; };
const chiffrementActif = (db) => !!chiffrementReglage(db);
// mot de passe : au moins 10 caractères ; retour = message d'erreur ou ''
function chiffrementMdpErreur(mdp, conf) {
  const s = String(mdp || '');
  if (s.length < CHIFFRE_MDP_MIN) return `Mot de passe trop court : au moins ${CHIFFRE_MDP_MIN} caractères (une phrase facile à retenir convient).`;
  if (conf !== undefined && s !== String(conf || '')) return 'Les deux mots de passe ne sont pas identiques.';
  return '';
}
// empreinte publique de la clé (repère « bonne clé / clé changée », ne permet pas de retrouver la clé)
async function chiffrementEmpreinte(brut) {
  const c = chSubtle(); const m = new Uint8Array(brut.length + 10); m.set(brut, 0); m.set(Array.from('oenotrack!').map((x) => x.charCodeAt(0)), brut.length);
  const h = new Uint8Array(await c.subtle.digest('SHA-256', m)); return Array.from(h.slice(0, 8)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
// clé dérivée du mot de passe → { cle (CryptoKey), brut (Uint8Array), cleId, sel, iter }
async function chiffrementDeriver(mdp, selB64, iter) {
  const c = chSubtle(); const sel = selB64 ? chDeB64(selB64) : chAleatoire(16); const it = Math.max(10000, Math.floor(Number(iter) || CHIFFRE_ITER));
  const base = await c.subtle.importKey('raw', new TextEncoder().encode(String(mdp || '').normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const brut = new Uint8Array(await c.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sel, iterations: it }, base, 256));
  const cle = await c.subtle.importKey('raw', brut, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  return { cle, brut, cleId: await chiffrementEmpreinte(brut), sel: chB64(sel), iter: it };
}
async function chiffrementCleDeBrut(k) { const c = chSubtle(); const brut = chDeB64(k.brut); return { cle: await c.subtle.importKey('raw', brut, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']), brut, cleId: k.cleId, sel: k.sel, iter: k.iter }; }
async function chAes(cle, iv, octets, sens, aad) {
  const c = chSubtle(); const p = { name: 'AES-GCM', iv, tagLength: 128, ...(aad ? { additionalData: aad } : {}) };
  try { return new Uint8Array(await c.subtle[sens === 'dechiffrer' ? 'decrypt' : 'encrypt'](p, cle, octets)); }
  catch (e) { if (sens === 'dechiffrer') throw { chiffre: true, mauvaiseCle: true, message: 'Mot de passe incorrect, ou fichier abîmé : déchiffrement impossible.' }; throw e; }
}
// réglage commun à écrire dans la base à l'activation (ou au changement de mot de passe)
async function chiffrementReglageNouveau(k, par) {
  const iv = chAleatoire(12); const t = await chAes(k.cle, iv, new TextEncoder().encode(CHIFFRE_TEMOIN));
  return { actif: true, sel: k.sel, iter: k.iter, cleId: k.cleId, temoin: chB64(t), temoinIv: chB64(iv), depuis: todayISO(), ...(par ? { par } : {}) };
}
// le mot de passe (sa clé) correspond-il au réglage de la base ?
async function chiffrementVerifier(k, reg) {
  if (!k || !reg) return false; if (reg.cleId && k.cleId !== reg.cleId) return false;
  if (!reg.temoin || !reg.temoinIv) return true;
  try { const t = await chAes(k.cle, chDeB64(reg.temoinIv), chDeB64(reg.temoin), 'dechiffrer'); return new TextDecoder().decode(t) === CHIFFRE_TEMOIN; } catch (e) { return false; }
}
// texte (base, sauvegarde) → enveloppe JSON chiffrée
async function chiffrerTexte(k, texte) {
  const iv = chAleatoire(12); const entete = { format: CHIFFRE_FORMAT, formatVersion: CHIFFRE_VERSION, appVersion: APP_VERSION, chiffrement: { alg: 'AES-GCM', kdf: 'PBKDF2-SHA256', iter: k.iter, sel: k.sel, cleId: k.cleId } };
  const aad = new TextEncoder().encode(`${CHIFFRE_FORMAT}|${k.cleId}`);
  const d = await chAes(k.cle, iv, new TextEncoder().encode(String(texte)), 'chiffrer', aad);
  return JSON.stringify({ ...entete, iv: chB64(iv), donnees: chB64(d) });
}
// enveloppe chiffrée ? (sans tout lire) → en-tête { chiffrement, iv, donnees } ou null
function enveloppeChiffree(texte) {
  if (typeof texte !== 'string' || texte.length < 40) return null;
  const tete = texte.slice(0, 400); if (tete.indexOf(`"${CHIFFRE_FORMAT}"`) < 0) return null;
  let j; try { j = JSON.parse(texte); } catch (e) { return null; }
  return j && j.format === CHIFFRE_FORMAT && j.chiffrement && j.iv && typeof j.donnees === 'string' ? j : null;
}
async function dechiffrerTexte(k, texte) {
  const j = typeof texte === 'string' ? enveloppeChiffree(texte) : texte; if (!j) throw { chiffre: true, message: 'Ce fichier n’est pas un fichier chiffré Œnotrack.' };
  if (num(j.formatVersion) > CHIFFRE_VERSION) throw { chiffre: true, message: 'Fichier chiffré par une version plus récente d’Œnotrack : mettez à jour cet appareil.' };
  if (!k) throw { chiffre: true, sansCle: true, message: 'Fichier chiffré : saisissez le mot de passe de chiffrement de l’équipe.' };
  if (j.chiffrement.cleId && k.cleId !== j.chiffrement.cleId) throw { chiffre: true, autreCle: true, message: 'Fichier chiffré avec un autre mot de passe (changé depuis ?) : saisissez le mot de passe actuel de l’équipe.' };
  const aad = new TextEncoder().encode(`${CHIFFRE_FORMAT}|${j.chiffrement.cleId || k.cleId}`);
  const d = await chAes(k.cle, chDeB64(j.iv), chDeB64(j.donnees), 'dechiffrer', aad);
  return new TextDecoder().decode(d);
}
// documents joints (binaire) : « OENCH1 » + longueur de l'en-tête (2 octets) + en-tête JSON { cleId } + IV (12) + données chiffrées
async function chiffrerOctets(k, octets) {
  const iv = chAleatoire(12); const e = new TextEncoder().encode(JSON.stringify({ cleId: k.cleId }));
  const d = await chAes(k.cle, iv, octets instanceof Uint8Array ? octets : new Uint8Array(octets), 'chiffrer', e);
  const out = new Uint8Array(CHIFFRE_MAGIC.length + 2 + e.length + 12 + d.length); let p = 0;
  out.set(CHIFFRE_MAGIC, p); p += CHIFFRE_MAGIC.length; out[p] = e.length >> 8; out[p + 1] = e.length & 0xff; p += 2; out.set(e, p); p += e.length; out.set(iv, p); p += 12; out.set(d, p);
  return out;
}
const octetsChiffres = (u8) => !!u8 && u8.length > CHIFFRE_MAGIC.length + 14 && CHIFFRE_MAGIC.every((b, i) => u8[i] === b);
async function dechiffrerOctets(k, u8) {
  if (!octetsChiffres(u8)) return u8; // document envoyé avant l'activation : en clair
  let p = CHIFFRE_MAGIC.length; const n = (u8[p] << 8) | u8[p + 1]; p += 2; const e = u8.slice(p, p + n); p += n; let h = {}; try { h = JSON.parse(new TextDecoder().decode(e)); } catch (er) { h = {}; }
  if (!k) throw { chiffre: true, sansCle: true, message: 'Document chiffré : mot de passe de chiffrement nécessaire.' };
  if (h.cleId && h.cleId !== k.cleId) throw { chiffre: true, autreCle: true, message: 'Document chiffré avec un autre mot de passe.' };
  return chAes(k.cle, u8.slice(p, p + 12), u8.slice(p + 12), 'dechiffrer', e);
}
// clé de cet appareil (stockage local) : jamais dans la base
const chiffrementCleLire = () => { try { const k = JSON.parse(window.localStorage.getItem(CHIFFRE_CLE_KEY) || 'null'); return k && k.brut && k.cleId ? k : null; } catch (e) { return null; } };
const chiffrementCleEcrire = (k) => { try { if (k) window.localStorage.setItem(CHIFFRE_CLE_KEY, JSON.stringify({ cleId: k.cleId, brut: chB64(k.brut), sel: k.sel, iter: k.iter, le: todayISO() })); else window.localStorage.removeItem(CHIFFRE_CLE_KEY); return true; } catch (e) { return false; } };
let _chCle = null; // clé importée (CryptoKey) en mémoire
async function chiffrementCleAppareil(cleId) {
  const k = chiffrementCleLire(); if (!k || (cleId && k.cleId !== cleId)) return null;
  if (_chCle && _chCle.cleId === k.cleId) return _chCle;
  try { _chCle = await chiffrementCleDeBrut(k); return _chCle; } catch (e) { return null; }
}
const chiffrementOublierCle = () => { _chCle = null; chiffrementCleEcrire(null); };
const chiffrementRetenir = (k) => { _chCle = k; return chiffrementCleEcrire(k); };
