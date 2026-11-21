/* ============ IDENTIFIANTS, MOTS DE PASSE ET DROITS (0.15.0-alpha.1) ============
   db.utilisateurs [{ id 'usr…', identifiant, nom, operateurId, profilId, actif, mdp: { algo, iter, sel, cle }, doitChanger, creeLe }]
   db.profils [{ id 'pf_…', nom, description, modules: { moduleId: 'aucun' | 'lecture' | 'ecriture' }, speciaux: { droitId: true }, fixe }]
   (Paramètres en « saisie » = droit de modifier les paramètres ; droits spéciaux : corriger, supprimer, déclasser, campagnes, sauvegardes, utilisateurs)
   db.settings.securite = { actif, verrouMin, longueurMin, secours: { empreinte du code de secours }, activeLe }
   db.audit [{ id, date (ISO), uid, action, type, cibleId, resume }] : connexions, échecs, créations, modifications, suppressions.
   Sans chiffrement (choix de l'utilisateur) : le mot de passe n'est jamais enregistré, seulement son empreinte PBKDF2-SHA256 salée
   (irréversible) ; les données restent lisibles dans les fichiers ; les droits sont appliqués par l'application (gardeDroits dans act). */

/* ---------- empreinte des mots de passe : PBKDF2-HMAC-SHA256 (Web Crypto, sinon calcul en JavaScript, résultats identiques) ---------- */
const MDP_ITER = 120000;
const K256 = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
const SHA_H0 = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
function shaBloc(st, w) {
  for (let i = 16; i < 64; i += 1) { const a = w[i - 15], b = w[i - 2]; const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3); const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0; }
  let a = st[0], b = st[1], c = st[2], d = st[3], e = st[4], f = st[5], g = st[6], h = st[7];
  for (let i = 0; i < 64; i += 1) {
    const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7)); const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K256[i] + w[i]) | 0;
    const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10)); const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) | 0;
    h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
  }
  st[0] = (st[0] + a) | 0; st[1] = (st[1] + b) | 0; st[2] = (st[2] + c) | 0; st[3] = (st[3] + d) | 0; st[4] = (st[4] + e) | 0; st[5] = (st[5] + f) | 0; st[6] = (st[6] + g) | 0; st[7] = (st[7] + h) | 0;
}
function sha256(bytes) {
  const n = bytes.length; const nb = (n + 9 + 63) >> 6; const buf = new Uint8Array(nb * 64); buf.set(bytes); buf[n] = 0x80;
  const dv = new DataView(buf.buffer); dv.setUint32(buf.length - 4, (n * 8) >>> 0); dv.setUint32(buf.length - 8, Math.floor((n * 8) / 0x100000000));
  const st = new Int32Array(SHA_H0); const w = new Int32Array(64);
  for (let i = 0; i < nb; i += 1) { for (let j = 0; j < 16; j += 1) w[j] = dv.getInt32(i * 64 + j * 4); shaBloc(st, w); }
  const out = new Uint8Array(32); const dvo = new DataView(out.buffer); for (let j = 0; j < 8; j += 1) dvo.setInt32(j * 4, st[j]); return out;
}
const concatU8 = (a, b) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
function pbkdf2Js(mdp, sel, iter, nOct) {
  const k = new Uint8Array(64); k.set(mdp.length > 64 ? sha256(mdp) : mdp);
  const ipad = new Uint8Array(64), opad = new Uint8Array(64); for (let i = 0; i < 64; i += 1) { ipad[i] = k[i] ^ 0x36; opad[i] = k[i] ^ 0x5c; }
  const w = new Int32Array(64);
  const etat = (blk) => { const st = new Int32Array(SHA_H0); const dv = new DataView(blk.buffer); for (let j = 0; j < 16; j += 1) w[j] = dv.getInt32(j * 4); shaBloc(st, w); return st; };
  const sti = etat(ipad), sto = etat(opad);
  const hmac32 = (u, out) => { // HMAC d'un message de 32 octets, états ipad / opad précalculés
    const s1 = new Int32Array(sti); for (let j = 0; j < 8; j += 1) w[j] = u[j]; w[8] = 0x80000000; for (let j = 9; j < 15; j += 1) w[j] = 0; w[15] = 768; shaBloc(s1, w);
    const s2 = new Int32Array(sto); for (let j = 0; j < 8; j += 1) w[j] = s1[j]; w[8] = 0x80000000; for (let j = 9; j < 15; j += 1) w[j] = 0; w[15] = 768; shaBloc(s2, w);
    for (let j = 0; j < 8; j += 1) out[j] = s2[j];
  };
  const nBlocs = Math.ceil(nOct / 32); const out = new Uint8Array(nBlocs * 32); const dvo = new DataView(out.buffer);
  for (let b = 1; b <= nBlocs; b += 1) {
    const s = new Uint8Array(sel.length + 4); s.set(sel); new DataView(s.buffer).setUint32(sel.length, b);
    const u1 = sha256(concatU8(opad, sha256(concatU8(ipad, s)))); const dv = new DataView(u1.buffer);
    const u = new Int32Array(8); for (let j = 0; j < 8; j += 1) u[j] = dv.getInt32(j * 4); const t = new Int32Array(u); const nx = new Int32Array(8);
    for (let i = 1; i < iter; i += 1) { hmac32(u, nx); for (let j = 0; j < 8; j += 1) { u[j] = nx[j]; t[j] ^= nx[j]; } }
    for (let j = 0; j < 8; j += 1) dvo.setInt32((b - 1) * 32 + j * 4, t[j]);
  }
  return out.slice(0, nOct);
}
const u8b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i += 1) s += String.fromCharCode(u8[i]); return btoa(s); };
const b64u8 = (b) => { const s = atob(String(b || '')); const o = new Uint8Array(s.length); for (let i = 0; i < s.length; i += 1) o[i] = s.charCodeAt(i); return o; };
const alea = (n) => { const o = new Uint8Array(n); try { crypto.getRandomValues(o); } catch (e) { for (let i = 0; i < n; i += 1) o[i] = Math.floor(Math.random() * 256); } return o; };
async function pbkdf2(mdp, sel, iter, opts) {
  const pw = new TextEncoder().encode(String(mdp).normalize('NFC'));
  const subtle = !(opts && opts.js) && typeof crypto !== 'undefined' && crypto && crypto.subtle ? crypto.subtle : null;
  if (subtle) { try { const k = await subtle.importKey('raw', pw, 'PBKDF2', false, ['deriveBits']); return new Uint8Array(await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: sel, iterations: iter }, k, 256)); } catch (e) { /* repli JavaScript */ } }
  return pbkdf2Js(pw, sel, iter, 32);
}
// empreinte à enregistrer : { algo, iter, sel, cle } — jamais le mot de passe lui-même
async function mdpEmpreinte(mdp, iter, opts) { const sel = alea(16); const it = iter || MDP_ITER; return { algo: 'PBKDF2-SHA256', iter: it, sel: u8b64(sel), cle: u8b64(await pbkdf2(mdp, sel, it, opts)) }; }
async function mdpVerifier(mdp, e, opts) {
  if (!e || e.algo !== 'PBKDF2-SHA256' || !e.sel || !e.cle) return false;
  const a = u8b64(await pbkdf2(mdp, b64u8(e.sel), num(e.iter) || MDP_ITER, opts)); const b = String(e.cle);
  let diff = a.length ^ b.length; for (let i = 0; i < Math.max(a.length, b.length); i += 1) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0); return diff === 0;
}
// code de secours (réinitialiser le mot de passe d'un administrateur) : 4 groupes de 4 caractères sans ambiguïté
const SECOURS_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const codeSecoursNouveau = () => { const r = alea(16); let s = ''; for (let i = 0; i < 16; i += 1) s += SECOURS_ALPHABET[r[i] % SECOURS_ALPHABET.length]; return s.match(/.{4}/g).join('-'); };
const codeSecoursNorm = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
// qualité d'un mot de passe : 0 (refusé) à 4
function mdpQualite(mdp, longueurMin) {
  const s = String(mdp || ''); const min = Math.max(6, num(longueurMin) || 8); if (s.length < min) return { note: 0, msg: `Au moins ${min} caractères.` };
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(s)).length;
  if (classes < 2) return { note: 1, msg: 'Mélangez lettres et chiffres (ou signes).' };
  const note = Math.min(4, 2 + (classes >= 3 ? 1 : 0) + (s.length >= min + 4 ? 1 : 0)); return { note, msg: ['', 'faible', 'correct', 'bon', 'très bon'][note] };
}

/* ---------- profils et droits ---------- */
const DROITS_NIVEAUX = [['aucun', 'Aucun accès'], ['lecture', 'Lecture'], ['ecriture', 'Lecture et saisie']];
const DROITS_SPECIAUX = [
  ['modifier', 'Corriger une opération validée', 'Modifier une opération déjà enregistrée (sinon : création seulement).'],
  ['supprimer', 'Supprimer', 'Supprimer des opérations, documents, opérations à réaliser et autres enregistrements.'],
  ['declasser', 'Décider des déclassements', 'Valider ou refuser les alertes de déclassement.'],
  ['campagnes', 'Campagnes', 'Créer, figer et rouvrir les campagnes.'],
  ['sauvegarde', 'Sauvegardes et Drive', 'Sauvegardes complètes, import, stockage Drive, réinitialisation.'],
  ['utilisateurs', 'Utilisateurs et droits', 'Créer les identifiants, attribuer les profils, consulter le journal des accès.'],
];
function PROFILS_DEFAUT() {
  const tous = (niv) => Object.fromEntries(MODULES_DEFAUT.map((m) => [m, niv])); const sp = (...ids) => Object.fromEntries(ids.map((x) => [x, true]));
  return [
    { id: 'pf_admin', nom: 'Administrateur', description: 'Tous les droits, dont la gestion des utilisateurs et des droits.', modules: tous('ecriture'), speciaux: sp(...DROITS_SPECIAUX.map((d) => d[0])), fixe: true },
    { id: 'pf_chef', nom: 'Chef de cave', description: 'Toutes les saisies, corrections, suppressions et paramètres ; pas la gestion des utilisateurs.', modules: tous('ecriture'), speciaux: sp('modifier', 'supprimer', 'declasser', 'campagnes', 'sauvegarde') },
    { id: 'pf_operateur', nom: 'Opérateur de chai', description: 'Saisie des opérations, analyses, intrants, hygiène et opérations à réaliser ; consultation du reste ; ni correction ni suppression.', modules: { ...tous('lecture'), ops: 'ecriture', pressoir: 'ecriture', previsions: 'ecriture', tirage: 'ecriture', cave: 'ecriture', degorgement: 'ecriture', analyses: 'ecriture', intrants: 'ecriture', hygiene: 'ecriture', params: 'aucun' }, speciaux: {} },
    { id: 'pf_labo', nom: 'Laboratoire / œnologue', description: 'Saisie des analyses ; consultation de la cuverie, des opérations et de la traçabilité.', modules: { ...tous('lecture'), analyses: 'ecriture', registres: 'aucun', params: 'aucun' }, speciaux: {} },
    { id: 'pf_consult', nom: 'Consultation', description: 'Lecture seule : contrôle, comptabilité, stagiaire…', modules: { ...tous('lecture'), params: 'aucun' }, speciaux: {} },
  ];
}
const securiteActive = (db) => !!(db && db.settings && db.settings.securite && db.settings.securite.actif && (db.utilisateurs || []).some((u) => u && u.actif !== false));
const securiteReglages = (db) => { const s = (db && db.settings && db.settings.securite) || {}; return { actif: !!s.actif, verrouMin: hasNum(s.verrouMin) ? Math.max(0, num(s.verrouMin)) : 15, longueurMin: Math.max(6, num(s.longueurMin) || 8) }; };
const utilisateurDe = (db, id) => (id ? ((db && db.utilisateurs) || []).find((u) => u && u.id === id) || null : null);
const identifiantNorm = (s) => norm(String(s || '').trim()).replace(/\s+/g, '.');
const utilisateurParIdentifiant = (db, ident) => { const k = identifiantNorm(ident); return k ? ((db && db.utilisateurs) || []).find((u) => u && identifiantNorm(u.identifiant) === k) || null : null; };
const profilDe = (db, idOuUser) => { const id = idOuUser && typeof idOuUser === 'object' ? idOuUser.profilId : idOuUser; return ((db && db.profils) || []).find((p) => p && p.id === id) || null; };
const utilisateurNom = (db, id) => { const u = utilisateurDe(db, id); return u ? (u.nom || u.identifiant) : (id ? 'utilisateur supprimé' : ''); };
// niveau d'accès à un module (sécurité inactive : tout est permis)
function niveauModule(db, uid, mod) {
  if (!securiteActive(db)) return 'ecriture';
  const u = utilisateurDe(db, uid); if (!u || u.actif === false) return 'aucun'; const p = profilDe(db, u); if (!p) return 'aucun';
  if (p.speciaux && p.speciaux.utilisateurs) return 'ecriture';
  let v = (p.modules || {})[mod]; if (v === undefined && mod === 'pressoir') v = (p.modules || {}).ops; // profil d'avant l'onglet Pressoir : droits des opérations
  return v === 'ecriture' || v === 'lecture' || v === 'aucun' ? v : (MODULES_DEFAUT.includes(mod) ? 'lecture' : 'ecriture');
}
const peutModule = (db, uid, mod, niv) => { const n = niveauModule(db, uid, mod); return niv === 'ecriture' ? n === 'ecriture' : n !== 'aucun'; };
function peut(db, uid, droit) {
  if (!securiteActive(db)) return true;
  const u = utilisateurDe(db, uid); if (!u || u.actif === false) return false; const p = profilDe(db, u); return !!(p && p.speciaux && (p.speciaux[droit] || p.speciaux.utilisateurs));
}
const estAdmin = (db, uid) => { const p = profilDe(db, utilisateurDe(db, uid)); return !!(p && p.speciaux && p.speciaux.utilisateurs); };
// au moins un administrateur actif (sinon plus personne ne peut gérer les droits)
const adminsActifs = (db) => (db.utilisateurs || []).filter((u) => u && u.actif !== false && (() => { const p = profilDe(db, u); return !!(p && p.speciaux && p.speciaux.utilisateurs); })());
// module visible pour l'utilisateur (Paramètres : aussi avec les droits « sauvegardes » ou « utilisateurs »)
function moduleAutorise(db, uid, mod) {
  if (!securiteActive(db)) return true;
  if (mod === 'params') return niveauModule(db, uid, 'params') !== 'aucun' || peut(db, uid, 'sauvegarde') || peut(db, uid, 'utilisateurs');
  return niveauModule(db, uid, mod) !== 'aucun';
}
// module concerné par une opération
const moduleDeType = (type, x) => (type === 'preparation' ? ((x && x.ptype) === 'liqueur_exp' ? 'degorgement' : 'tirage') : ({ tirage: 'tirage', degorgement: 'degorgement', declassement: 'declass', apport: 'pressoir', pressurage: 'pressoir' })[type] || 'ops');

/* ---------- gestion des utilisateurs et des profils (mots de passe déjà transformés en empreinte par l'appelant) ---------- */
function securiteActiver(db, s) {
  if (securiteActive(db)) return fail('Les identifiants sont déjà activés.');
  if (!s || !s.mdp || !s.mdp.cle) return fail('Mot de passe manquant.');
  const ident = String(s.identifiant || '').trim(); if (!ident) return fail('Choisissez un identifiant.');
  if (!Array.isArray(db.profils) || !db.profils.length) db.profils = PROFILS_DEFAUT();
  if (!db.profils.some((p) => p.id === 'pf_admin')) db.profils.unshift(PROFILS_DEFAUT()[0]);
  if (!Array.isArray(db.utilisateurs)) db.utilisateurs = [];
  let u = utilisateurParIdentifiant(db, ident);
  if (u) Object.assign(u, { nom: s.nom || u.nom || ident, profilId: 'pf_admin', actif: true, mdp: s.mdp, doitChanger: false, operateurId: s.operateurId || u.operateurId || '' });
  else { u = { id: nid(db, 'usr'), identifiant: ident, nom: String(s.nom || '').trim() || ident, operateurId: s.operateurId || '', profilId: 'pf_admin', actif: true, mdp: s.mdp, doitChanger: false, creeLe: todayISO() }; db.utilisateurs.push(u); }
  db.settings.securite = { ...(db.settings.securite || {}), actif: true, verrouMin: hasNum((db.settings.securite || {}).verrouMin) ? db.settings.securite.verrouMin : 15, longueurMin: (db.settings.securite || {}).longueurMin || 8, secours: s.secours || null, activeLe: todayISO() };
  return okr({ id: u.id });
}
function securiteDesactiver(db) { if (!db.settings.securite) return okr(); db.settings.securite = { ...db.settings.securite, actif: false }; return okr(); } // utilisateurs et profils gardés pour une réactivation
function securiteRegler(db, patch) { const s = db.settings.securite || {}; const p = {}; if (patch.verrouMin != null) p.verrouMin = Math.max(0, Math.min(480, Math.round(num(patch.verrouMin)))); if (patch.longueurMin != null) p.longueurMin = Math.max(6, Math.min(32, Math.round(num(patch.longueurMin)))); if (patch.secours) p.secours = patch.secours; db.settings.securite = { ...s, ...p }; return okr(); }
function utilisateurSave(db, s, id) {
  const ident = String(s.identifiant || '').trim(); if (!ident) return fail('L’identifiant est obligatoire.');
  if (!/^[\p{L}\p{N}._@-]+$/u.test(ident)) return fail('Identifiant : lettres, chiffres, point, tiret ou @, sans espace.');
  const autre = utilisateurParIdentifiant(db, ident); if (autre && autre.id !== id) return fail(`L’identifiant « ${ident} » est déjà utilisé.`);
  if (!profilDe(db, s.profilId)) return fail('Choisissez un profil de droits.');
  if (s.operateurId && !(db.operateurs || []).some((o) => o.id === s.operateurId)) return fail('Opérateur introuvable.');
  if (!Array.isArray(db.utilisateurs)) db.utilisateurs = [];
  const item = { identifiant: ident, nom: String(s.nom || '').trim() || ident, operateurId: s.operateurId || '', profilId: s.profilId, actif: s.actif !== false };
  if (id) {
    const u = utilisateurDe(db, id); if (!u) return fail('Utilisateur introuvable.');
    const avant = { ...u }; Object.assign(u, item); if (s.mdp) { u.mdp = s.mdp; u.doitChanger = !!s.doitChanger; }
    if (!adminsActifs(db).length) { Object.assign(u, avant); return fail('Il faut garder au moins un administrateur actif.'); }
    return okr({ id });
  }
  if (!s.mdp) return fail('Choisissez un mot de passe provisoire.');
  const rid = nid(db, 'usr'); db.utilisateurs.push({ id: rid, ...item, mdp: s.mdp, doitChanger: s.doitChanger !== false, creeLe: todayISO() }); return okr({ id: rid });
}
function utilisateurMotDePasse(db, id, mdp, doitChanger) { const u = utilisateurDe(db, id); if (!u) return fail('Utilisateur introuvable.'); if (!mdp || !mdp.cle) return fail('Mot de passe manquant.'); u.mdp = mdp; u.doitChanger = !!doitChanger; return okr(); }
function utilisateurActif(db, id, actif) {
  const u = utilisateurDe(db, id); if (!u) return fail('Utilisateur introuvable.'); const av = u.actif; u.actif = !!actif;
  if (!adminsActifs(db).length) { u.actif = av; return fail('Il faut garder au moins un administrateur actif.'); } return okr();
}
// un identifiant qui a servi (journal) n'est pas supprimé : il est désactivé
function utilisateurDelete(db, id) {
  const u = utilisateurDe(db, id); if (!u) return fail('Utilisateur introuvable.');
  if ((db.audit || []).some((a) => a.uid === id && a.action !== 'echec') || db.ops.some((o) => o.saisiPar === id || o.modifiePar === id)) return fail('Cet identifiant a déjà servi : désactivez-le plutôt (le journal garde son nom).');
  const reste = (db.utilisateurs || []).filter((x) => x.id !== id); if (!reste.some((x) => x.actif !== false && (() => { const p = profilDe(db, x); return !!(p && p.speciaux && p.speciaux.utilisateurs); })())) return fail('Il faut garder au moins un administrateur actif.');
  db.utilisateurs = reste; return okr();
}
function profilSave(db, s, id) {
  const nom = String(s.nom || '').trim(); if (!nom) return fail('Le nom du profil est obligatoire.');
  if ((db.profils || []).some((p) => p.id !== id && norm(p.nom) === norm(nom))) return fail(`Le profil « ${nom} » existe déjà.`);
  const modules = {}; Object.keys(s.modules || {}).forEach((k) => { if (['aucun', 'lecture', 'ecriture'].includes(s.modules[k])) modules[k] = s.modules[k]; });
  const speciaux = {}; DROITS_SPECIAUX.forEach(([k]) => { if (s.speciaux && s.speciaux[k]) speciaux[k] = true; }); Object.keys((s.speciaux || {})).forEach((k) => { if (!DROITS_SPECIAUX.some((d) => d[0] === k) && s.speciaux[k]) speciaux[k] = true; });
  if (!Array.isArray(db.profils)) db.profils = [];
  if (id) {
    const p = profilDe(db, id); if (!p) return fail('Profil introuvable.'); if (p.fixe && !speciaux.utilisateurs) return fail('Le profil Administrateur garde tous les droits.');
    const avant = clone(p); Object.assign(p, { nom, description: s.description || '', modules, speciaux });
    if (!adminsActifs(db).length) { Object.assign(p, avant); return fail('Il faut garder au moins un administrateur actif.'); } return okr({ id });
  }
  const rid = nid(db, 'pf'); db.profils.push({ id: rid, nom, description: s.description || '', modules, speciaux }); return okr({ id: rid });
}
function profilDelete(db, id) { const p = profilDe(db, id); if (!p) return fail('Profil introuvable.'); if (p.fixe) return fail('Le profil Administrateur ne peut pas être supprimé.'); const n = (db.utilisateurs || []).filter((u) => u.profilId === id).length; if (n) return fail(`Ce profil est attribué à ${n} utilisateur(s).`); db.profils = db.profils.filter((x) => x.id !== id); return okr(); }

/* ---------- journal des accès et des actions ---------- */
const AUDIT_ACTIONS = { connexion: 'Connexion', deconnexion: 'Déconnexion', verrouillage: 'Verrouillage', echec: 'Échec de connexion', secours: 'Code de secours utilisé', creation: 'Création', modification: 'Modification', suppression: 'Suppression', mdp: 'Mot de passe changé', securite: 'Sécurité' };
function auditAjouter(db, e) {
  if (!Array.isArray(db.audit)) db.audit = [];
  const L = Array.isArray(e) ? e : [e]; L.filter(Boolean).forEach((x) => db.audit.push({ id: nid(db, 'au'), date: x.date || new Date().toISOString(), uid: x.uid || '', action: x.action, type: x.type || '', cibleId: x.cibleId || '', resume: String(x.resume || '').slice(0, 300), ...(x.appareil ? { appareil: x.appareil } : {}) }));
  return okr();
}

/* ---------- garde : ce qui a changé dans la base pendant une action, et les droits que cela demande ----------
   Appelée par act() quand les identifiants sont activés : refuse l'action si un droit manque, sinon renvoie les entrées du journal
   et les opérations à marquer (saisiPar / modifiePar). Les réglages de vue (campagne, site, contour…) restent libres. */
const GARDE_VUE = { settings: ['campagneActive', 'siteActif'], apparence: ['contourMode', 'interieurMode', 'interieurMotif'] };
const GARDE_CLES = { journalPressoir: 'pressoir', contenants: 'cuverie', sites: 'cuverie', lots: 'cuverie', lotsFinis: 'degorgement', analyses: 'analyses', produits: 'intrants', arrivages: 'intrants', fournisseurs: 'intrants', regles: 'intrants', hygiene: 'hygiene', produitsHygiene: 'hygiene', planNettoyage: 'hygiene', planMaintenance: 'hygiene', maintenance: 'hygiene', hygieneAcquits: 'hygiene', previsions: 'previsions', alertes: 'declass' };
const GARDE_PARAMS = ['crus', 'apporteurs', 'parcelles', 'operateurs', 'modelesFiches', 'lists', 'entreprise', 'analysesParams', 'analysesModeles', 'formulaires', 'baremes'];
const GARDE_NOMS = { baremes: 'barèmes de jaugeage', produitsHygiene: 'produits d’hygiène', contenants: 'contenants', sites: 'sites', lots: 'lots', lotsFinis: 'lots finis', analyses: 'analyses', produits: 'produits', arrivages: 'arrivages d’intrants', fournisseurs: 'fournisseurs', regles: 'règles d’intrants', hygiene: 'hygiène', planNettoyage: 'plan de nettoyage', planMaintenance: 'plan de maintenance', maintenance: 'interventions de maintenance', hygieneAcquits: 'non-conformités justifiées', previsions: 'opérations à réaliser', alertes: 'déclassements', crus: 'crus', apporteurs: 'partenaires', parcelles: 'parcelles', operateurs: 'opérateurs', modelesFiches: 'modèles de fiches', lists: 'listes', entreprise: 'société', analysesParams: 'paramètres d’analyse', analysesModeles: 'modèles d’analyse', campagnes: 'campagnes', settings: 'réglages', apparence: 'apparence', utilisateurs: 'utilisateurs', profils: 'profils de droits', docs: 'documents', formulaires: 'formulaires d’opérations', journalPressoir: 'journal du pressoir' };
const sansCles = (o, ks) => { if (!o || typeof o !== 'object') return o; const c = { ...o }; ks.forEach((k) => { delete c[k]; }); return c; };
const OP_MARQUES = ['ficheOrdre', 'saisiPar', 'saisiLe', 'modifiePar', 'modifieLe'];
const parId = (L) => { const m = new Map(); (Array.isArray(L) ? L : []).forEach((x) => { if (x && x.id != null) m.set(x.id, x); }); return m; };
function diffParId(a, b, ignore) {
  const A = parId(a), B = parId(b); const cree = [], modif = [], suppr = []; const j = (x) => JSON.stringify(ignore ? sansCles(x, ignore) : x);
  B.forEach((x, id) => { if (!A.has(id)) cree.push(x); else if (j(A.get(id)) !== j(x)) modif.push({ avant: A.get(id), apres: x }); });
  A.forEach((x, id) => { if (!B.has(id)) suppr.push(x); }); return { cree, modif, suppr, n: cree.length + modif.length + suppr.length };
}
function gardeDroits(avant, apres, uid) {
  const db = avant; const refus = (m) => ({ ok: false, msg: `Droits insuffisants : ${m}.` });
  const u = utilisateurDe(db, uid); if (!u || u.actif === false) return refus('aucun utilisateur connecté');
  const p = profilDe(db, u); const nomP = p ? `« ${p.nom} »` : '(sans profil)'; const admin = estAdmin(db, uid);
  const ecr = (m) => admin || niveauModule(db, uid, m) === 'ecriture'; const sp = (d) => admin || peut(db, uid, d);
  const audit = []; const marques = { cree: [], modif: [] };
  const cles = uniq([...Object.keys(avant || {}), ...Object.keys(apres || {})]).filter((k) => !['meta', 'audit', 'fiches', 'app', 'schema'].includes(k));
  const change = (k) => JSON.stringify(avant[k]) !== JSON.stringify(apres[k]);
  const ch = cles.filter(change); if (!ch.length) return { ok: true, audit, marques };
  const nomMod = (m) => (typeof moduleNom === 'function' ? moduleNom(m) : m);
  // opérations (et ce qu'elles entraînent : lots, lots finis, alertes, opérations à réaliser, documents)
  let opsCh = false;
  if (ch.includes('ops')) {
    const d = diffParId(avant.ops, apres.ops, OP_MARQUES); opsCh = d.n > 0; // n° de fiche imprimée seulement : pas une saisie
    for (const o of d.cree) { const m = moduleDeType(o.type, o); if (!(ecr(m) || ecr('ops'))) return refus(`le profil ${nomP} ne permet pas de saisir dans « ${nomMod(m)} »`); if (o.type === 'declassement' && !sp('declasser')) return refus(`le profil ${nomP} ne permet pas de décider des déclassements`); }
    // pesée ou marc pas encore validé au registre du pressoir (marc en cours : volumes, TAV, validation) : se complète sans le droit de correction
    const enCoursRegistre = (o) => !!(o && ((o.type === 'apport' && o.pesee && !o.pesee.valide) || (o.type === 'pressurage' && o.marc && !o.marc.valide)));
    for (const x of d.modif) { const m = moduleDeType(x.apres.type, x.apres); if (!(ecr(m) || ecr('ops'))) return refus(`le profil ${nomP} ne permet pas de saisir dans « ${nomMod(m)} »`); if (!sp('modifier') && !enCoursRegistre(x.avant)) return refus(`le profil ${nomP} ne permet pas de corriger une opération validée`); }
    if (d.suppr.length && !sp('supprimer')) return refus(`le profil ${nomP} ne permet pas de supprimer une opération`);
    d.cree.forEach((o) => { marques.cree.push(o.id); audit.push({ uid, action: 'creation', type: 'op', cibleId: o.id, resume: `${opNom(o)} du ${fmtDate(o.date)}` }); });
    d.modif.forEach((x) => { marques.modif.push(x.apres.id); audit.push({ uid, action: 'modification', type: 'op', cibleId: x.apres.id, resume: `${opNom(x.apres)} du ${fmtDate(x.apres.date)}` }); });
    d.suppr.forEach((o) => audit.push({ uid, action: 'suppression', type: 'op', cibleId: o.id, resume: `${opNom(o)} du ${fmtDate(o.date)}` }));
  }
  for (const k of ch) {
    if (k === 'ops') continue;
    if (k === 'utilisateurs' || k === 'profils') {
      if (k === 'utilisateurs' && !sp('utilisateurs')) { // seul changement permis : son propre mot de passe
        const d = diffParId(avant.utilisateurs, apres.utilisateurs); const soi = d.n === 1 && d.modif.length === 1 && d.modif[0].apres.id === uid && JSON.stringify(sansCles(d.modif[0].avant, ['mdp', 'doitChanger'])) === JSON.stringify(sansCles(d.modif[0].apres, ['mdp', 'doitChanger']));
        if (!soi) return refus(`le profil ${nomP} ne permet pas de gérer les utilisateurs`);
        audit.push({ uid, action: 'mdp', type: 'utilisateur', cibleId: uid, resume: 'Mot de passe changé' }); continue;
      }
      if (!sp('utilisateurs')) return refus(`le profil ${nomP} ne permet pas de gérer les utilisateurs et les droits`);
      const d = diffParId(avant[k], apres[k]); const nm = (x) => (k === 'utilisateurs' ? `${x.nom || x.identifiant} (${x.identifiant})` : x.nom);
      d.cree.forEach((x) => audit.push({ uid, action: 'creation', type: k === 'utilisateurs' ? 'utilisateur' : 'profil', cibleId: x.id, resume: nm(x) }));
      d.modif.forEach((x) => audit.push({ uid, action: 'modification', type: k === 'utilisateurs' ? 'utilisateur' : 'profil', cibleId: x.apres.id, resume: `${nm(x.apres)}${k === 'utilisateurs' && JSON.stringify(x.avant.mdp) !== JSON.stringify(x.apres.mdp) ? ' — mot de passe réinitialisé' : ''}${k === 'utilisateurs' && x.avant.actif !== x.apres.actif ? (x.apres.actif === false ? ' — désactivé' : ' — réactivé') : ''}${k === 'utilisateurs' && x.avant.profilId !== x.apres.profilId ? ` — profil « ${(profilDe(apres, x.apres.profilId) || {}).nom || '?'} »` : ''}` }));
      d.suppr.forEach((x) => audit.push({ uid, action: 'suppression', type: k === 'utilisateurs' ? 'utilisateur' : 'profil', cibleId: x.id, resume: nm(x) }));
      continue;
    }
    if (k === 'settings' || k === 'apparence') {
      const libres = GARDE_VUE[k]; const A = avant[k] || {}, B = apres[k] || {};
      const sk = uniq([...Object.keys(A), ...Object.keys(B)]).filter((x) => !libres.includes(x) && JSON.stringify(A[x]) !== JSON.stringify(B[x]));
      if (!sk.length) continue;
      if (sk.includes('securite')) { if (!sp('utilisateurs')) return refus(`le profil ${nomP} ne permet pas de régler la sécurité`); audit.push({ uid, action: 'securite', type: 'reglage', resume: (B.securite || {}).actif === false && (A.securite || {}).actif ? 'Identifiants désactivés' : 'Réglages de sécurité modifiés' }); }
      if (sk.some((x) => x !== 'securite')) { if (!ecr('params')) return refus(`le profil ${nomP} ne permet pas de modifier les paramètres`); audit.push({ uid, action: 'modification', type: 'parametres', resume: `${GARDE_NOMS[k]} : ${sk.filter((x) => x !== 'securite').slice(0, 6).join(', ')}` }); }
      continue;
    }
    if (k === 'campagnes') { if (!sp('campagnes')) return refus(`le profil ${nomP} ne permet pas de gérer les campagnes`); const d = diffParId(avant.campagnes, apres.campagnes); [...d.cree, ...d.modif.map((x) => x.apres)].forEach((c) => audit.push({ uid, action: d.cree.includes(c) ? 'creation' : 'modification', type: 'campagne', cibleId: c.id, resume: `Campagne ${c.nom}${c.figee ? ' (figée)' : ''}` })); if (d.suppr.length && !sp('supprimer')) return refus(`le profil ${nomP} ne permet pas de supprimer`); continue; }
    if (GARDE_PARAMS.includes(k)) {
      // listes de l'hygiène (0.27.0-alpha.2 : Hygiène › Listes, moyen de contrôle ajouté depuis le journal) : le droit de saisie dans l'Hygiène suffit
      const sous = k === 'lists' ? uniq([...Object.keys(avant.lists || {}), ...Object.keys(apres.lists || {})]).filter((x) => JSON.stringify((avant.lists || {})[x]) !== JSON.stringify((apres.lists || {})[x])) : [];
      const hyg = sous.length > 0 && sous.every((x) => /^(hyg|maint)[A-Z]/.test(x));
      if (hyg ? !(ecr('hygiene') || ecr('params')) : !ecr('params')) return refus(`le profil ${nomP} ne permet pas de modifier les paramètres (${GARDE_NOMS[k]})`);
      if (Array.isArray(apres[k]) && Array.isArray(avant[k]) && diffParId(avant[k], apres[k]).suppr.length && !sp('supprimer')) return refus(`le profil ${nomP} ne permet pas de supprimer (${GARDE_NOMS[k]})`);
      audit.push({ uid, action: 'modification', type: 'parametres', resume: `Paramètres : ${GARDE_NOMS[k]}` }); continue;
    }
    if (k === 'docs') {
      const d = diffParId(avant.docs, apres.docs);
      const modDoc = (x) => (x.cible && (x.cible.type === 'arrivage' || x.cible.type === 'produit') ? 'intrants' : x.cible && (x.cible.type === 'produitHygiene' || x.cible.type === 'maintenance') ? 'hygiene' : x.cible && x.cible.type === 'bareme' ? 'params' : x.cible && x.cible.type === 'bulletin' ? 'analyses' : x.cible && x.cible.type === 'prev' ? 'previsions' : (() => { const o = (apres.ops || []).find((y) => y.id === (x.cible || {}).id) || (avant.ops || []).find((y) => y.id === (x.cible || {}).id); return o ? moduleDeType(o.type, o) : 'ops'; })());
      if (opsCh) { if (d.suppr.length && !sp('supprimer') && d.suppr.some((x) => !(x.cible && x.cible.type === 'op' && !(apres.ops || []).some((o) => o.id === x.cible.id)))) return refus(`le profil ${nomP} ne permet pas de retirer un document`); }
      else {
        for (const x of [...d.cree, ...d.modif.map((y) => y.apres)]) { const m = modDoc(x); if (!(ecr(m) || (!['intrants', 'hygiene'].includes(m) && ecr('ops')))) return refus(`le profil ${nomP} ne permet pas de joindre un document dans « ${nomMod(m)} »`); }
        if (d.suppr.length && !sp('supprimer')) return refus(`le profil ${nomP} ne permet pas de retirer un document`);
      }
      d.cree.forEach((x) => audit.push({ uid, action: 'creation', type: 'document', cibleId: x.id, resume: `Document « ${x.nom} »` })); d.suppr.forEach((x) => audit.push({ uid, action: 'suppression', type: 'document', cibleId: x.id, resume: `Document « ${x.nom} »` }));
      continue;
    }
    if (k === 'gardeJournal') { // journal de sécurité des importations (0.27.0-alpha.1) : les entrées s'y ajoutent d'office ; le vider demande le droit de gérer les utilisateurs
      const d = diffParId(avant.gardeJournal, apres.gardeJournal); if ((d.suppr.length || d.modif.length) && !sp('utilisateurs')) return refus(`le profil ${nomP} ne permet pas de vider le journal de sécurité`);
      if (d.suppr.length) audit.push({ uid, action: 'suppression', type: 'gardeJournal', resume: `Journal de sécurité vidé (${d.suppr.length} entrée(s))` }); continue;
    }
    const m = GARDE_CLES[k];
    if (m) {
      // conséquences d'une opération (lots créés, alertes recalculées, opération à réaliser validée…) : couvertes par le droit sur l'opération
      if (opsCh && ['lots', 'lotsFinis', 'previsions', 'journalPressoir'].includes(k)) continue;
      if (k === 'alertes') {
        const d = diffParId(avant.alertes, apres.alertes); const decide = d.modif.some((x) => x.avant.statut !== x.apres.statut);
        if (decide && !(sp('declasser') && ecr('declass'))) return refus(`le profil ${nomP} ne permet pas de décider des déclassements`);
        if (!opsCh && !decide && !ecr('declass')) return refus(`le profil ${nomP} ne permet pas de saisir dans « ${nomMod('declass')} »`);
        if (decide) d.modif.filter((x) => x.avant.statut !== x.apres.statut).forEach((x) => audit.push({ uid, action: 'modification', type: 'alerte', cibleId: x.apres.id, resume: `Déclassement ${x.apres.statut === 'valide' ? 'validé' : x.apres.statut === 'refuse' ? 'refusé' : x.apres.statut}` }));
        continue;
      }
      const d = Array.isArray(apres[k]) ? diffParId(avant[k], apres[k], k === 'previsions' ? ['ficheOrdre'] : null) : null;
      if (d && !d.n) continue; // seulement le n° d'une fiche imprimée
      if (!ecr(m)) return refus(`le profil ${nomP} ne permet pas de saisir dans « ${nomMod(m)} »`);
      if (d && d.suppr.length && !sp('supprimer')) return refus(`le profil ${nomP} ne permet pas de supprimer (${GARDE_NOMS[k]})`);
      if (d) { if (d.cree.length) audit.push({ uid, action: 'creation', type: k, resume: `${GARDE_NOMS[k]} : ${d.cree.length} ajout(s)` }); if (d.modif.length) audit.push({ uid, action: 'modification', type: k, resume: `${GARDE_NOMS[k]} : ${d.modif.length} modification(s)` }); if (d.suppr.length) audit.push({ uid, action: 'suppression', type: k, resume: `${GARDE_NOMS[k]} : ${d.suppr.length} suppression(s)` }); }
      continue;
    }
    // autre donnée (version future, réglage inconnu) : réservée aux paramètres
    if (!ecr('params')) return refus(`le profil ${nomP} ne permet pas de modifier ces données`);
  }
  return { ok: true, audit, marques };
}
// après une action permise : qui a saisi / corrigé chaque opération, et entrées du journal
function gardeAppliquer(db, g, uid) {
  if (!g || !g.ok) return; const now = new Date().toISOString();
  (g.marques.cree || []).forEach((id) => { const o = db.ops.find((x) => x.id === id); if (o) { o.saisiPar = o.saisiPar || uid; o.saisiLe = o.saisiLe || now; } });
  (g.marques.modif || []).forEach((id) => { const o = db.ops.find((x) => x.id === id); if (o) { o.modifiePar = uid; o.modifieLe = now; } });
  if (g.audit.length) auditAjouter(db, g.audit.map((x) => ({ ...x, date: now })));
}
