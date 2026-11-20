/* ============ PRODUITS D'HYGIÈNE (alpha V16.0) : répertoire des produits de nettoyage et de désinfection ============
   db.produitsHygiene [{ id, nom, type, fabricant, fournisseur, reference, composition, forme, unite,
     concMin, concMax, concUnite, temperature, contact, rincage ('oui' | 'non' | ''), contactAlimentaire, modeEmploi,
     revendications [ids] (vide = non renseigné), mention ('danger' | 'attention' | ''), pictos ['SGH05'…], phrasesH, epi ['gants'…],
     incompatibilites, stockage, secours, urgence, fdsDate, fdsVersion, notes, archive, creeLe, modifLe }]
   Documents : db.docs, cible { type: 'produitHygiene', id } (FDS, fiche technique, attestations…).
   Entrée du journal d'hygiène : produits [{ produitId, nom, conc, concUnite, quantite, unite }] et methode (texte) ; le texte
   « produit » reste le résumé lisible (« Soude 2 % + Peracide 0,2 % · eau chaude 60 °C ») que les versions antérieures affichent.
   Lecture d'une FDS (fdsAnalyser) : nom, fabricant, date de révision, mentions de danger, pictogrammes, EPI… proposés à vérifier. */
const HYG_TYPES = [
  ['alcalin', 'Détergent alcalin (soude, potasse…)'], ['alcalin_chlore', 'Détergent alcalin chloré'], ['acide', 'Détergent ou détartrant acide'],
  ['desinfectant', 'Désinfectant (peracétique, peroxyde…)'], ['neutre', 'Détergent neutre'], ['soufre', 'Soufre, SO₂ (mèches, solution)'], ['autre', 'Autre'],
];
const HYG_FORMES = [['liquide', 'Liquide'], ['poudre', 'Poudre, granulés'], ['gel', 'Gel, mousse'], ['pastille', 'Pastilles'], ['meche', 'Mèches, disques'], ['gaz', 'Gaz'], ['autre', 'Autre']];
const HYG_UNITES = [['L', 'L'], ['kg', 'kg'], ['u', 'unité(s)']];
const HYG_CONC = [['%', '%'], ['g/L', 'g/L'], ['mL/L', 'mL/L'], ['pur', 'pur']];
// pictogrammes de danger (règlement CLP / SGH) et équipements de protection individuelle
const HYG_PICTOS = [['SGH01', 'Explosif'], ['SGH02', 'Inflammable'], ['SGH03', 'Comburant'], ['SGH04', 'Gaz sous pression'], ['SGH05', 'Corrosif'], ['SGH06', 'Toxique'], ['SGH07', 'Nocif, irritant'], ['SGH08', 'Danger pour la santé'], ['SGH09', 'Dangereux pour l’environnement']];
const HYG_EPI = [['gants', 'Gants'], ['lunettes', 'Lunettes'], ['visiere', 'Écran facial'], ['masque', 'Protection respiratoire'], ['tablier', 'Tablier, combinaison'], ['bottes', 'Bottes']];
const HYG_MENTIONS = [['danger', 'Danger'], ['attention', 'Attention']];
const HYG_FDS_ANS = 3; // FDS révisée il y a plus de 3 ans : à vérifier auprès du fournisseur (pas d'obligation de délai, une bonne pratique)
const hygLib = (L, id) => (L.find((x) => x[0] === id) || [id, id || ''])[1];
const hygListe = (db) => (db && Array.isArray(db.produitsHygiene) ? db.produitsHygiene : []);
const hygDef = (db, id) => hygListe(db).find((p) => p.id === id) || null;
const hygNom = (db, id) => (hygDef(db, id) || {}).nom || (id ? `(${id})` : '');
const hygNb = (v) => num(v).toLocaleString('fr-FR', { maximumFractionDigits: 3 });
const hygConcTxt = (v, u) => (u === 'pur' ? 'pur' : hasNum(v) ? `${hygNb(v)} ${u || '%'}` : '');
// concentration d'emploi : « 1 à 2 % », « 2 % », « jusqu'à 2 % », « pur »
function hygPlage(p) {
  if (!p) return ''; const u = p.concUnite || '%'; if (u === 'pur') return 'pur';
  const a = hasNum(p.concMin) ? num(p.concMin) : null; const b = hasNum(p.concMax) ? num(p.concMax) : null;
  if (a == null && b == null) return '';
  if (a != null && b != null) return a === b ? `${hygNb(a)} ${u}` : `${hygNb(a)} à ${hygNb(b)} ${u}`;
  return a != null ? `${hygNb(a)} ${u}` : `jusqu’à ${hygNb(b)} ${u}`;
}
// documents en vigueur (tous : y compris les versions archivées par une plus récente, alpha V18.0)
const hygDocs = (db, id, cat, tous) => (db.docs || []).filter((x) => x && x.cible && x.cible.type === 'produitHygiene' && x.cible.id === id && (!cat || x.cat === cat) && (tous || !x.archive));
// état de la fiche de données de sécurité : manquante, ancienne (plus de 3 ans), à jour
function hygFdsEtat(db, p, today) {
  const n = p ? hygDocs(db, p.id, 'fds').length : 0; const t = today || todayISO();
  const age = p && isoOK(p.fdsDate) ? daysBetween(p.fdsDate, t) / 365.25 : null;
  if (!n) return { k: 'manquante', tone: 'bad', label: 'FDS manquante', n, age };
  if (age != null && age > HYG_FDS_ANS) return { k: 'ancienne', tone: 'warn', label: `FDS du ${fmtDate(p.fdsDate)} (plus de ${HYG_FDS_ANS} ans)`, n, age };
  return { k: 'ok', tone: 'ok', label: isoOK(p.fdsDate) ? `FDS du ${fmtDate(p.fdsDate)}` : 'FDS jointe', n, age };
}
// produits proposés dans une entrée : actifs, triés par nom (+ ceux déjà choisis)
const hygOptions = (db, garder) => hygListe(db).filter((p) => !p.archive || (garder || []).includes(p.id)).slice().sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr'))
  .map((p) => ({ value: p.id, label: `${p.nom}${hygPlage(p) ? ` (${hygPlage(p)})` : ''}${p.archive ? ' — archivé' : ''}` }));

function hygNettoyer(s) {
  const t = (v, n = 200) => String(v == null ? '' : v).trim().slice(0, n);
  const nb = (v) => (hasNum(v) ? Math.round(num(v) * 1000) / 1000 : null);
  const parmi = (v, L, d) => (L.some((x) => x[0] === v) ? v : d);
  const liste = (v, L) => uniq((Array.isArray(v) ? v : []).filter((x) => L.some((y) => y[0] === x)));
  return {
    nom: t(s.nom, 120), type: parmi(s.type, HYG_TYPES, 'autre'), fabricant: t(s.fabricant, 120), fournisseur: t(s.fournisseur, 120), reference: t(s.reference, 60),
    composition: t(s.composition, 600), forme: parmi(s.forme, HYG_FORMES, 'liquide'), unite: parmi(s.unite, HYG_UNITES, 'L'),
    concMin: nb(s.concMin), concMax: nb(s.concMax), concUnite: parmi(s.concUnite, HYG_CONC, '%'), temperature: t(s.temperature, 60), contact: t(s.contact, 60),
    rincage: ['oui', 'non'].includes(s.rincage) ? s.rincage : '', contactAlimentaire: !!s.contactAlimentaire, modeEmploi: t(s.modeEmploi, 2000),
    revendications: uniq((Array.isArray(s.revendications) ? s.revendications : []).filter((x) => typeof x === 'string' && x)),
    mention: ['danger', 'attention'].includes(s.mention) ? s.mention : '', pictos: liste(s.pictos, HYG_PICTOS), phrasesH: t(s.phrasesH, 4000), epi: liste(s.epi, HYG_EPI),
    incompatibilites: t(s.incompatibilites, 1000), stockage: t(s.stockage, 1000), secours: t(s.secours, 2000), urgence: t(s.urgence, 200),
    fdsDate: isoOK(s.fdsDate) ? s.fdsDate : '', fdsVersion: t(s.fdsVersion, 30), notes: t(s.notes, 2000),
  };
}
function hygProduitSave(db, s, id) {
  if (!Array.isArray(db.produitsHygiene)) db.produitsHygiene = [];
  const it = hygNettoyer(s || {});
  if (!it.nom) return fail('Nom du produit requis.');
  if (nameTaken(db.produitsHygiene, it.nom, id)) return fail(`Le produit d’hygiène « ${it.nom} » existe déjà.`);
  if ([it.concMin, it.concMax].some((v) => v != null && v < 0)) return fail('Concentration d’emploi : valeur positive attendue.');
  if (it.concMin != null && it.concMax != null && it.concMin > it.concMax) return fail('Concentration d’emploi : le minimum dépasse le maximum.');
  const now = todayISO();
  if (id) { const p = db.produitsHygiene.find((x) => x.id === id); if (!p) return fail('Produit introuvable.'); Object.assign(p, it, { modifLe: now }); return okr({ id }); } // champs inconnus (version plus récente) gardés
  const pid = nid(db, 'ph'); db.produitsHygiene.push({ id: pid, ...it, creeLe: now, modifLe: now }); return okr({ id: pid });
}
function hygProduitArchiver(db, id, archive) {
  const p = hygListe(db).find((x) => x.id === id); if (!p) return fail('Produit introuvable.');
  if (archive) p.archive = true; else delete p.archive; p.modifLe = todayISO(); return okr();
}
const hygUsages = (db, id) => (db.hygiene || []).filter((h) => h && Array.isArray(h.produits) && h.produits.some((l) => l && l.produitId === id));
// supprimé seulement s'il n'a jamais servi ; ses documents partent avec lui (renvoyés pour effacer les fichiers)
function hygProduitDelete(db, id) {
  const p = hygDef(db, id); if (!p) return fail('Produit introuvable.');
  const n = hygUsages(db, id).length; if (n) return fail(`« ${p.nom} » figure dans ${n} entrée${n > 1 ? 's' : ''} du journal d’hygiène : archivez-le plutôt (il ne sera plus proposé).`);
  const docs = hygDocs(db, id, null, true).map((x) => x.id);
  db.produitsHygiene = db.produitsHygiene.filter((x) => x.id !== id); db.docs = (db.docs || []).filter((x) => !docs.includes(x.id));
  return okr({ docs });
}
// utilisations et quantité employée sur une période
function hygConso(db, id, debut, fin) {
  const E = hygUsages(db, id).filter((h) => (!debut || h.date >= debut) && (!fin || h.date <= fin)); let q = 0; let nq = 0;
  E.forEach((h) => h.produits.forEach((l) => { if (l && l.produitId === id && hasNum(l.quantite)) { q += num(l.quantite); nq += 1; } }));
  return { n: E.length, quantite: Math.round(q * 1000) / 1000, nQuantite: nq, derniere: E.map((h) => h.date).sort().pop() || null };
}

/* ---------- entrées du journal : lignes de produits, résumé lisible, contrôles ---------- */
function hygLignes(db, L) {
  return (Array.isArray(L) ? L : []).filter((l) => l && l.produitId).map((l) => {
    const p = hygDef(db, l.produitId) || {}; const o = { ...l, produitId: l.produitId, nom: p.nom || l.nom || '' }; // champs inconnus (version plus récente) gardés
    ['conc', 'concUnite', 'quantite', 'unite'].forEach((k) => { delete o[k]; });
    const u = l.concUnite || p.concUnite || '%';
    if (u === 'pur') o.concUnite = 'pur'; else if (hasNum(l.conc)) { o.conc = Math.round(num(l.conc) * 1000) / 1000; o.concUnite = u; }
    if (hasNum(l.quantite)) { o.quantite = Math.round(num(l.quantite) * 1000) / 1000; o.unite = l.unite || p.unite || 'L'; }
    return o;
  });
}
// résumé : « Soude caustique 2 % + Peracide 0,2 % · eau chaude 60 °C » ; fige = noms enregistrés avec l'entrée (sinon noms actuels)
function hygResume(db, h, fige) {
  const L = (Array.isArray(h && h.produits) ? h.produits : []).filter((l) => l && l.produitId)
    .map((l) => [fige ? l.nom || hygNom(db, l.produitId) : (hygDef(db, l.produitId) || {}).nom || l.nom || hygNom(db, l.produitId), hygConcTxt(l.conc, l.concUnite)].filter(Boolean).join(' '));
  return [L.join(' + '), String((h && h.methode) || '').trim()].filter(Boolean).join(' · ');
}
// entrée réécrite par une version antérieure (texte « Produit / méthode » modifié à la main) : ce texte fait foi
const hygTexteModifie = (db, h) => !!(h && Array.isArray(h.produits) && (h.produits.length || h.methode != null) && String(h.produit || '') !== hygResume(db, h, true));
// avertissements d'une entrée : chloré + acide, concentration hors plage, produit archivé, revendications du vin présent
function hygControles(db, R, s) {
  const out = []; const L = hygLignes(db, s && s.produits).map((l) => ({ l, p: hygDef(db, l.produitId) })).filter((x) => x.p);
  const types = L.map((x) => x.p.type);
  if (types.includes('alcalin_chlore') && types.includes('acide')) out.push({ tone: 'bad', msg: 'Produit chloré et produit acide dans la même entrée : ne les mélangez jamais (dégagement de chlore) ; rincez abondamment entre les deux.' });
  L.forEach(({ l, p }) => {
    if (hasNum(l.conc) && l.concUnite === (p.concUnite || '%')) {
      const c = num(l.conc);
      if (hasNum(p.concMax) && c > num(p.concMax) + 1e-9) out.push({ tone: 'warn', msg: `${p.nom} : ${hygConcTxt(c, l.concUnite)}, au-dessus de la concentration d’emploi (${hygPlage(p)}).` });
      else if (hasNum(p.concMin) && c < num(p.concMin) - 1e-9) out.push({ tone: 'warn', msg: `${p.nom} : ${hygConcTxt(c, l.concUnite)}, en dessous de la concentration d’emploi (${hygPlage(p)}).` });
    }
    if (p.archive) out.push({ tone: 'warn', msg: `${p.nom} est archivé (plus proposé).` });
  });
  if (s && s.cibleType === 'contenant' && s.cibleId && R && R.portions) {
    const qs = uniq(Object.values(R.portions).filter((x) => x && x.contenantId === s.cibleId && num(x.vol) > 0.5).map((x) => ((R.lots || {})[x.lotId] || {}).qualif).filter(Boolean));
    L.forEach(({ p }) => { const ok = Array.isArray(p.revendications) ? p.revendications : []; if (!ok.length) return; const non = qs.filter((q) => !ok.includes(q)); if (non.length) out.push({ tone: 'warn', msg: `${p.nom} n’est pas indiqué utilisable en ${non.map(qLabel).join(', ')} (vin présent dans ce contenant).` }); });
  }
  return out;
}

/* ---------- lecture d'une fiche de données de sécurité (texte extrait du PDF) ---------- */
// pictogramme qui accompagne chaque mention de danger (règlement CLP) : sert quand la FDS ne nomme pas ses pictogrammes (images seules)
function fdsPictosDeH(codes) {
  const src = {}; const add = (k, c) => { (src[k] = src[k] || []).push(c); };
  codes.forEach((c) => {
    const m = /^H(\d{3})/.exec(c); if (!m) return; const n = +m[1];
    if ([200, 201, 202, 203, 204, 205, 240, 241].includes(n)) add('SGH01', n);
    if ((n >= 220 && n <= 228) || [241, 242, 250, 251, 252, 260, 261].includes(n)) add('SGH02', n);
    if (n >= 270 && n <= 272) add('SGH03', n);
    if (n === 280 || n === 281) add('SGH04', n);
    if ([290, 314, 318].includes(n)) add('SGH05', n);
    if ([300, 301, 310, 311, 330, 331].includes(n)) add('SGH06', n);
    if ([302, 312, 315, 317, 319, 332, 335, 336].includes(n)) add('SGH07', n);
    if ([304, 334, 340, 341, 350, 351, 360, 361, 370, 371, 372, 373].includes(n)) add('SGH08', n);
    if ([400, 410, 411].includes(n)) add('SGH09', n);
  });
  // règles de priorité : pas de point d'exclamation avec la tête de mort ; ni pour l'irritation avec la corrosion ou la sensibilisation respiratoire
  if (src.SGH07) {
    let reste = src.SGH07;
    if (src.SGH06) reste = [];
    if (src.SGH05) reste = reste.filter((n) => ![315, 319].includes(n));
    if (src.SGH08 && src.SGH08.includes(334)) reste = reste.filter((n) => ![315, 317, 319].includes(n));
    if (!reste.length) delete src.SGH07;
  }
  return HYG_PICTOS.map((x) => x[0]).filter((k) => src[k]);
}
const FDS_MOIS = { janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12 };
function fdsDate(s) {
  const f = plier(s); let m = /(\d{4})-(\d{1,2})-(\d{1,2})/.exec(f); let j; let mo; let a;
  if (m) { a = +m[1]; mo = +m[2]; j = +m[3]; } else if ((m = /(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4}|\d{2})(?!\d)/.exec(f))) { j = +m[1]; mo = +m[2]; a = +m[3]; if (a < 100) a += 2000; }
  else if ((m = /(\d{1,2})(?:er)?\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})/.exec(f))) { j = +m[1]; mo = FDS_MOIS[m[2]]; a = +m[3]; } else return null;
  return j >= 1 && j <= 31 && mo >= 1 && mo <= 12 && a >= 1980 && a <= 2100 ? `${a}-${String(mo).padStart(2, '0')}-${String(j).padStart(2, '0')}` : null;
}
// pages de texte positionné (pdf.js, reconnaissance de caractères) → texte ligne par ligne
const fdsTexteDePages = (pages) => (pages || []).map((p) => jaugeLignes(jaugeMots(p)).map((l) => l.texte).join('\n')).join('\n');
function fdsAnalyser(texte) {
  const T = String(texte || '').replace(/\r/g, '').replace(/[  ]/g, ' '); const lignes = T.split('\n').map((x) => x.replace(/\s+$/, ''));
  const F = lignes.map((x) => plier(x));
  // rubriques 1 à 16 (« RUBRIQUE 2 : … », « SECTION 2 », « 2. Identification des dangers ») et sous-rubriques « 1.3 »
  const reperer = (re) => { const d = {}; let dern = 0; F.forEach((f, i) => { const m = re.exec(f); if (!m) return; const k = +m[1]; if (k > dern && k <= 16 && d[k] == null) { d[k] = i; dern = k; } }); return d; };
  let debut = reperer(/^\s*(?:rubrique|section)\s*(\d{1,2})\b/); if (Object.keys(debut).length < 3) debut = reperer(/^\s*(\d{1,2})\s*[.:)]\s+[a-z]/);
  if (Object.keys(debut).length < 3) { const d2 = {}; let dern = 0; lignes.forEach((l, i) => { const m = /^\s*(\d{1,2})\s+[A-ZÀ-Ý]{4,}/.exec(l); if (!m) return; const k = +m[1]; if (k > dern && k <= 16 && d2[k] == null) { d2[k] = i; dern = k; } }); if (Object.keys(d2).length >= 3) debut = d2; } // « 2 IDENTIFICATION DES DANGERS »
  const ks = Object.keys(debut).map(Number).sort((a, b) => a - b); const fin = (k) => { const n = ks.find((x) => x > k); return n != null ? debut[n] : lignes.length; };
  const sec = (k) => (debut[k] != null ? { a: debut[k], b: fin(k) } : null);
  const sous = (k, s) => { const S = sec(k); if (!S) return null; const re = new RegExp(`^\\s*${k}\\s*\\.\\s*${s}\\b`); let a = -1; for (let i = S.a; i < S.b; i += 1) if (re.test(F[i])) { a = i; break; } if (a < 0) return null; let b = S.b; for (let i = a + 1; i < S.b; i += 1) { const m = new RegExp(`^\\s*${k}\\s*\\.\\s*(\\d{1,2})\\b`).exec(F[i]); if (m && +m[1] > s) { b = i; break; } } return { a, b }; };
  const tout = { a: 0, b: lignes.length }; const ok = ks.length >= 3; // au moins trois rubriques reconnues : lecture par rubrique
  const zone = (z) => z || tout;
  // valeur après l'étiquette, jusqu'au prochain grand blanc (colonne suivante) : « Nom du produit :   X   Code : 1 » → X
  const valeur = (i, re) => { const m = re.exec(F[i]); if (!m) return ''; return lignes[i].slice(m.index + m[0].length).replace(/^[\s:.\-–]+/, '').split(/\s{3,}/)[0].trim(); };
  const etiquette = (f) => /:\s*$/.test(f);
  // valeur d'une étiquette : sur la même ligne (« Nom du produit : X »), sinon (suivante) sur la ligne d'après (« Nom du produit : » puis « X »)
  const champ = (z, re, suivante) => {
    for (let i = z.a; i < z.b; i += 1) { if (!re.test(F[i])) continue; const v = valeur(i, re); if (v && /[a-z0-9]/i.test(v)) return v; }
    if (suivante) for (let i = z.a; i < z.b; i += 1) { if (!re.test(F[i]) || valeur(i, re)) continue; for (let j = i + 1; j < Math.min(z.b, i + 3); j += 1) { const x = lignes[j].trim(); if (!x) continue; if (!/:/.test(x) && !/^\s*\d+\s*\.\s*\d/.test(F[j])) return x.split(/\s{3,}/)[0].trim(); break; } }
    return '';
  };
  const out = {};
  // 1. identification
  const s1 = ok ? sec(1) : null;
  out.nom = champ(zone(s1), /(?:nom (?:du produit|commercial(?: du produit)?|de la preparation|du melange|de la substance)|designation commerciale|denomination commerciale|appellation commerciale|identificateur (?:du|de) produit|trade name|product name)\s*(?:\([^)]*\))?\s*[:.]?/, true);
  if (!out.nom && s1) { const z = sous(1, 1); if (z) for (let i = z.a + 1; i < z.b; i += 1) { const x = lignes[i].trim(); if (x && !/:/.test(x) && /[a-z]/i.test(x)) { out.nom = x.split(/\s{3,}/)[0]; break; } } }
  const s13 = s1 ? sous(1, 3) : null;
  out.fabricant = champ(zone(s13 || s1), /(?:^|\s)(?:fournisseur|fabricant|societe|raison sociale|distributeur|entreprise|nom de la societe)\s*[:.]/, false);
  out.fabricant = out.fabricant.replace(/\s*(?:,|\s-\s)\s*\d.*$/, '').trim(); // « ACME SAS, 12 rue… » → ACME SAS
  if (!out.fabricant && s13) for (let i = s13.a + 1; i < s13.b; i += 1) { const x = lignes[i].trim(); const f = F[i]; if (x && /[a-z]{3}/i.test(x) && !/fiche de donnees|renseignements|adresse|telephone|e-?mail|www\.|@|^\d/.test(f) && !etiquette(f)) { out.fabricant = x.split(/\s{3,}/)[0].replace(/[,;]+$/, ''); break; } }
  const zU = s1 ? (sous(1, 4) || s1) : tout; const telRe = /(\+?\(?\d[\d\s().\-/]{7,}\d)/;
  for (let i = zU.a; i < zU.b && !out.urgence; i += 1) { if (s1 && zU === s1 && !/urgence/.test(F[i])) continue; if (!s1 && !/urgence/.test(F[i])) continue; for (let j = i; j < Math.min(zU.b, i + 3); j += 1) { const m = telRe.exec(lignes[j]); const tel = m ? m[1].replace(/\s*\([^)]*$/, '').trim() : ''; if (tel.replace(/\D/g, '').length >= 9) { const apres = lignes[j].slice(m.index + m[1].replace(/\s*\([^)]*$/, '').length).trim(); const par = /^\(([^)]{2,40})\)/.exec(apres);
    const avant = lignes[j].slice(0, m.index).replace(/^.*?(?:urgence|appel)[^:]*[:.]?/i, '').replace(/[\s:–-]+$/, '').trim(); out.urgence = `${avant && avant.length <= 40 && /[a-z]/i.test(avant) ? `${avant} : ` : ''}${tel}${par && !/^\d+$/.test(par[1].trim()) ? ` (${par[1].trim()})` : ''}`; break; } } }
  // date de révision (à défaut : date d'édition / d'émission) et version
  const libDates = [/date de (?:la )?(?:revision|mise a jour|modification)|revise(?:e)? le|derniere revision|mise a jour le|date revision|revision date/, /(?:^|\s)revision\s*(?:du|le)?\s*[:.]/, /date d'(?:edition|emission|etablissement)|date de (?:creation|publication|l'edition)|edite(?:e)? le|etablie? le/, /date d'impression|imprime(?:e)? le/];
  for (const re of libDates) { for (let i = 0; i < F.length && !out.fdsDate; i += 1) { const m = re.exec(F[i]); if (!m) continue; const d = fdsDate(lignes[i].slice(m.index + m[0].length, m.index + m[0].length + 40)) || (i + 1 < lignes.length && !/\d/.test(lignes[i].slice(m.index + m[0].length)) ? fdsDate(lignes[i + 1].slice(0, 40)) : null); if (d) out.fdsDate = d; } if (out.fdsDate) break; }
  for (let i = 0; i < F.length && !out.fdsVersion; i += 1) { const m = /(?<!remplace\s(?:la\s)?)\bversion\s*(?:n\s*[°o]|no\.?)?\s*[:.]?\s*(\d+(?:[.,]\d+){0,3})\b/.exec(F[i]); if (m) out.fdsVersion = m[1]; }
  // 2. dangers : mentions H (celles du mélange, rubrique 2), pictogrammes, mention d'avertissement
  const s2 = ok ? sec(2) : null; const z2 = zone(s2); const s16 = ok ? sec(16) : null;
  const C1 = '(?:EUH\\s?\\d{3}[A-Za-z]?|H[2-4]\\d{2}(?:[A-Za-z]{1,2}(?![A-Za-z]))?)'; const codeRe = new RegExp(`\\b(${C1}(?:\\s*\\+\\s*${C1})*)`, 'g');
  const codes = []; const cles = []; const textes = {}; // cles : mentions telles qu'écrites (« H302+H332 » ensemble), codes : une par code
  const lireTextes = (z, garder) => { for (let i = z.a; i < z.b; i += 1) { const L = lignes[i]; const ms = Array.from(L.matchAll(codeRe)); ms.forEach((m, k) => {
    const cle = m[1].replace(/\s/g, ''); if (garder) { if (!cles.includes(cle)) cles.push(cle); cle.split('+').forEach((c) => { if (!codes.includes(c)) codes.push(c); }); }
    const fin2 = k + 1 < ms.length ? ms[k + 1].index : L.length; const t = L.slice(m.index + m[0].length, fin2).replace(/^[\s:.\-–—]+/, '').replace(/[\s+,;]+$/, '').trim();
    if (t.length >= 12 && /[a-zà-ÿ]{4}/i.test(t) && (!textes[cle] || (textes[cle].length < t.length && t.length < 260))) textes[cle] = t; }); } };
  lireTextes(z2, true); if (s16) lireTextes(s16, false);
  out.codesH = codes;
  // une ligne par mention ; un code sans texte déjà couvert par une mention combinée qui en a un n'est pas répété
  out.phrasesH = cles.filter((c) => textes[c] || !cles.some((d) => d !== c && textes[d] && d.split('+').includes(c))).map((c) => (textes[c] ? `${c} : ${textes[c]}` : c)).join('\n');
  const pictos = []; for (let i = z2.a; i < z2.b; i += 1) { for (const m of F[i].matchAll(/\b(?:ghs|sgh)\s?0?([1-9])\b/g)) { const k = `SGH0${m[1]}`; if (!pictos.includes(k)) pictos.push(k); } }
  out.pictosDeduits = !pictos.length && codes.length > 0;
  out.pictos = pictos.length ? HYG_PICTOS.map((x) => x[0]).filter((k) => pictos.includes(k)) : fdsPictosDeH(codes);
  for (let i = z2.a; i < z2.b && !out.mention; i += 1) {
    const m = /(?:mention d.?\s?avertissement|mot[- ]indicateur|mot de signalement)\s*(?:\([^)]*\))?\s*[:.]?\s*(?:(danger|attention)\b)?/.exec(F[i]); if (!m) continue;
    if (m[1]) out.mention = m[1]; else if (i + 1 < z2.b) { const n = /^\s*(danger|attention)\b/.exec(F[i + 1]); if (n) out.mention = n[1]; }
  }
  // 8. équipements de protection (et conseil P280, où qu'il soit)
  const s8 = ok ? sec(8) : null; const epi = new Set();
  const neg = /\b(?:non|pas)\s+(?:necessaire|requise?|obligatoire|indispensable|applicable|exigee?|prevue?)s?\b|\baucune?\b|sans objet|n'est pas (?:necessaire|requis)|not required/;
  const lire8 = (i) => { const f = F[i]; const suite = etiquette(f) && i + 1 < F.length ? ` ${F[i + 1]}` : '';
    (f + suite).split(/(?<=[.;])\s+/).forEach((g) => { if (neg.test(g)) return;
    if (/\bgants?\b/.test(g)) epi.add('gants'); if (/\blunettes\b|protection (?:des yeux|oculaire)|equipement de protection des yeux/.test(g)) epi.add('lunettes');
    if (/ecran facial|visiere|protection du visage|\/\s?du visage|protection faciale/.test(g)) epi.add('visiere'); if (/protection (?:respiratoire|des voies respiratoires)|appareil respiratoire|\bmasque\b|demi-masque/.test(g)) epi.add('masque');
    if (/vetements? de protection|\btablier\b|combinaison|protection (?:de la peau|du corps|corporelle)|vetement de travail/.test(g)) epi.add('tablier'); if (/\bbottes\b|chaussures de (?:securite|protection)/.test(g)) epi.add('bottes'); }); };
  if (s8) for (let i = s8.a + 1; i < s8.b; i += 1) lire8(i);
  F.forEach((f, i) => { if (/\bp ?280\b/.test(f)) lire8(i); });
  out.epi = HYG_EPI.map((x) => x[0]).filter((k) => epi.has(k));
  // 10.5 matières incompatibles, 7.2 stockage : quelques lignes de texte
  const texteDe = (z, n) => { if (!z) return ''; const L = []; for (let i = z.a + 1; i < z.b; i += 1) { const x = lignes[i].trim(); if (x && !/^(?:page|fiche de donnees)/i.test(plier(x))) L.push(x); } return L.join(' ').replace(/^[^:]{0,60}:\s*/, '').replace(/\s+/g, ' ').trim().slice(0, n); };
  out.incompatibilites = ok ? texteDe(sous(10, 5), 300) : ''; if (!out.incompatibilites) out.incompatibilites = champ(tout, /matieres incompatibles\s*[:.]?/, true).slice(0, 300);
  out.stockage = ok ? texteDe(sous(7, 2), 300) : '';
  // 3. composition : substances avec leur n° CAS (et la plage de concentration)
  const s3 = ok ? sec(3) : null; const comp = [];
  if (s3) for (let i = s3.a + 1; i < s3.b && comp.length < 4; i += 1) {
    const L = lignes[i]; const m = /\b(\d{2,7}-\d{2}-\d)\b/.exec(L); if (!m) continue;
    let nom = L.slice(0, m.index).replace(/\(?\s*n\s*[°o]?\s*cas\s*\)?\s*:?\s*$/i, '').replace(/\bcas\s*(?:n\s*[°o])?\s*:?\s*$/i, '').split(/\s{3,}/).filter(Boolean)[0] || '';
    nom = nom.replace(/[:;,\-–\s]+$/, '').trim(); if (!/[a-zà-ÿ]{3}/i.test(nom) && i > s3.a + 1) nom = lignes[i - 1].trim().split(/\s{3,}/)[0];
    nom = nom.replace(/^(?:nom(?: chimique| de la substance)?|substance|identite(?: chimique)?|composant)\s*[:.]\s*/i, '').trim();
    if (!/[a-zà-ÿ]{3}/i.test(nom) || /^(?:nom|substance|composant|identite|n°|numero)\b/i.test(plier(nom))) continue;
    const pc = /((?:[<>≤≥]=?\s*)?\d+(?:[.,]\d+)?\s*(?:-|–|à|a)\s*(?:[<>≤≥]=?\s*)?\d+(?:[.,]\d+)?|[<>≤≥]=?\s*\d+(?:[.,]\d+)?)\s*%/.exec(L.slice(m.index));
    comp.push(`${nom}${pc ? ` (${pc[1].replace(/\s+/g, ' ').trim()} %)` : ''}`);
  }
  out.composition = uniq(comp).join(', ');
  // nature du produit et forme (d'après le nom, l'usage, la composition, l'aspect)
  const s12 = s1 ? sous(1, 2) : null; const qui = plier([out.nom, out.composition, s12 ? lignes.slice(s12.a, s12.b).join(' ') : ''].join(' '));
  out.type = /chlor/.test(qui) && /alcalin|soude|potasse|hydroxyde|hypochlorite/.test(qui) ? 'alcalin_chlore' : /perac[eé]tique|peroxyde d.hydrogene|peracide|desinfect/.test(qui) ? 'desinfectant'
    : /hydroxyde de (?:sodium|potassium)|\bsoude\b|potasse|alcalin/.test(qui) ? 'alcalin' : /acide (?:phosphorique|nitrique|citrique|sulfurique|sulfamique|lactique|chlorhydrique|methanesulfonique|glycolique)|detartr/.test(qui) ? 'acide'
      : /soufre|metabisulfite|bisulfite|anhydride sulfureux|dioxyde de soufre/.test(qui) ? 'soufre' : '';
  const s9 = ok ? sec(9) : null; const asp = champ(zone(s9), /(?:etat physique|aspect|forme physique)\s*(?:\([^)]*\))?\s*[:.]?/, true); const fa = plier(asp);
  out.forme = /liquide/.test(fa) ? 'liquide' : /poudre|granul|solide|cristal/.test(fa) ? 'poudre' : /\bgel\b|pate|mousse/.test(fa) ? 'gel' : /\bgaz\b/.test(fa) ? 'gaz' : '';
  const n = ['nom', 'fabricant', 'urgence', 'fdsDate', 'fdsVersion', 'mention', 'phrasesH', 'incompatibilites', 'stockage', 'composition'].filter((k) => out[k]).length + (out.pictos.length ? 1 : 0) + (out.epi.length ? 1 : 0);
  out.rubriques = ks.length; out.trouves = n; out.fds = ks.length >= 3 || /fiche de donnees de securite|safety data sheet|1907\/2006/.test(plier(T));
  return out;
}
