/* ============ INTRANTS : FICHES TECHNIQUES (FT) ET FICHES DE DONNÉES DE SÉCURITÉ (FDS) — 0.20.0-alpha.1 ============
   Documents d'un produit œnologique : cible { type: 'produit', id } (catégories fds, ft, certificat, autre) ; les produits d'hygiène
   (cible 'produitHygiene') profitent du même dépôt groupé.
   Dépôt groupé : chaque fichier est lu (ficheAnalyser : FDS, FT ou certificat, nom du produit, date de révision, version), rapproché
   d'un produit (ficheCorrespondances), puis joint (ficheJoindre). Une version plus récente archive la précédente
   (doc.archive = date d'archivage, doc.remplacePar = nouveau document) : l'ancienne reste consultable et téléchargeable.
   Champs ajoutés au produit : reference, lien (page du produit chez le fournisseur), fdsDate, fdsVersion, ftDate, fdsNonRequise,
   veille (dernière vérification en ligne par l'assistant IA : voir 17-ia.js). Les versions précédentes ignorent ces champs et les gardent. */
const PROD_FDS_ANS = 3; // même règle que les produits d'hygiène : FDS révisée il y a plus de 3 ans → demander la dernière version
const FICHE_GENRES = [['fds', 'FDS'], ['ft', 'Fiche technique'], ['certificat', 'Certificat / attestation'], ['autre', 'Autre document']];
const ficheGenreLib = (g) => (FICHE_GENRES.find((x) => x[0] === g) || [g, 'Autre document'])[1];
const ficheGenreCourt = (g) => ({ fds: 'FDS', ft: 'FT', certificat: 'Certificat' }[g] || 'Document');
// catégorie du document selon la cible (les produits d'hygiène rangent les attestations sous « certif »)
const ficheCat = (type, genre) => (type === 'produitHygiene' && genre === 'certificat' ? 'certif' : ['fds', 'ft', 'certificat'].includes(genre) ? genre : 'autre');

// adresse saisie → « https://… » valide, sinon ''
function lienNorm(s) {
  let v = String(s || '').trim(); if (!v || /\s/.test(v)) return '';
  if (!/^https?:\/\//i.test(v)) { if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([/?#]|$)/i.test(v)) v = `https://${v}`; else return ''; }
  try { const u = new URL(v); return /^https?:$/.test(u.protocol) && /\.[a-z]{2,}$/i.test(u.hostname) ? u.href : ''; } catch (e) { return ''; }
}
const lienCourt = (u) => { try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + (x.pathname.length > 1 ? '/…' : ''); } catch (e) { return String(u || ''); } };

/* ---------- documents d'un produit (en vigueur ou archivés) ---------- */
const ficheDocs = (db, type, id, cat, archives) => (db.docs || []).filter((x) => x && x.cible && x.cible.type === type && x.cible.id === id && (!cat || x.cat === cat) && (archives ? !!x.archive : !x.archive));
const prodDocs = (db, id, cat, archives) => ficheDocs(db, 'produit', id, cat, archives);
const ficheCibleObj = (db, c) => (!c ? null : c.type === 'produit' ? (db.produits || []).find((p) => p.id === c.id) || null : c.type === 'produitHygiene' ? (db.produitsHygiene || []).find((p) => p.id === c.id) || null : c.type === 'produitMaintenance' ? (db.produitsMaintenance || []).find((p) => p && p.id === c.id) || null : null);
const ficheCibleCle = (c) => (c ? `${c.type}:${c.id}` : '');
const ficheCibleDeCle = (k) => { const m = /^(produit|produitHygiene|produitMaintenance):(.+)$/.exec(String(k || '')); return m ? { type: m[1], id: m[2] } : null; };
const derniereRevision = (docs) => { const d = (docs || []).map((x) => x.revision).filter(isoOK).sort(); return d.length ? d[d.length - 1] : ''; };
// fournisseur affiché : celui de la fiche intrant, ou fabricant / fournisseur du produit d'hygiène
const ficheFournisseur = (db, c, p) => { const o = p || ficheCibleObj(db, c); if (!o) return ''; if (c.type === 'produit') return ((db.fournisseurs || []).find((f) => f.id === o.fournisseurId) || {}).nom || ''; return o.fabricant || o.fournisseur || ''; };

/* ---------- état des fiches d'un intrant ---------- */
const prodFdsRequise = (p) => !!p && p.categorie !== 'sec' && !p.fdsNonRequise; // matières sèches (bouteilles, bouchons…) : pas de FDS
// date de révision de la FDS en vigueur : celle lue sur le document joint (la plus récente), sinon celle saisie sur le produit
function prodFdsDate(db, p) { if (!p) return ''; return derniereRevision(prodDocs(db, p.id, 'fds')) || (isoOK(p.fdsDate) ? p.fdsDate : ''); }
function prodFtDate(db, p) { if (!p) return ''; return derniereRevision(prodDocs(db, p.id, 'ft')) || (isoOK(p.ftDate) ? p.ftDate : ''); }
function prodFdsEtat(db, p, today) {
  const n = p ? prodDocs(db, p.id, 'fds').length : 0;
  if (p && !prodFdsRequise(p)) return { k: 'sansobjet', tone: '', label: p.categorie === 'sec' ? 'FDS sans objet' : 'FDS non requise', n };
  const date = prodFdsDate(db, p); const age = isoOK(date) ? daysBetween(date, today || todayISO()) / 365.25 : null;
  if (!n) return { k: 'manquante', tone: 'bad', label: 'FDS manquante', n, date, age };
  if (age != null && age > PROD_FDS_ANS) return { k: 'ancienne', tone: 'warn', label: `FDS du ${fmtDate(date)} (plus de ${PROD_FDS_ANS} ans)`, n, date, age };
  return { k: 'ok', tone: 'ok', label: date ? `FDS du ${fmtDate(date)}` : 'FDS jointe', n, date, age };
}
function prodFtEtat(db, p) { const n = p ? prodDocs(db, p.id, 'ft').length : 0; const date = prodFtDate(db, p); return n ? { k: 'ok', label: date ? `FT du ${fmtDate(date)}` : 'FT jointe', n, date } : { k: 'manquante', label: 'pas de FT', n: 0, date }; }
// veille en ligne (assistant IA) : une FDS ou une FT plus récente que celle jointe ?
function prodVeilleEtat(db, p) {
  const v = p && p.veille; if (!v || !isoOK(v.date)) return { k: 'jamais', tone: '', label: 'jamais vérifié' };
  const fd = v.fds && isoOK(v.fds.date) ? v.fds.date : ''; const td = v.ft && isoOK(v.ft.date) ? v.ft.date : '';
  const cf = prodFdsDate(db, p); const ct = prodFtDate(db, p);
  if (fd && prodFdsRequise(p) && (!cf || fd > cf)) return { k: 'nouvelle', tone: 'warn', label: `FDS du ${fmtDate(fd)} en ligne`, quoi: 'fds', date: v.date, url: v.fds.url || v.page || '' };
  if (td && ct && td > ct) return { k: 'nouvelle', tone: 'warn', label: `FT du ${fmtDate(td)} en ligne`, quoi: 'ft', date: v.date, url: v.ft.url || v.page || '' };
  return { k: 'ajour', tone: 'ok', label: `vérifié le ${fmtDate(v.date)}`, date: v.date };
}
// liste à revoir : FDS manquante ou ancienne, ou nouvelle version repérée en ligne
const prodARevoir = (db, p, today) => { const e = prodFdsEtat(db, p, today); return e.k === 'manquante' || e.k === 'ancienne' || prodVeilleEtat(db, p).k === 'nouvelle'; };
function prodFichesResume(db, today) {
  const P = (db.produits || []).filter((p) => p.actif !== false); const E = P.map((p) => ({ p, e: prodFdsEtat(db, p, today), v: prodVeilleEtat(db, p) }));
  return { n: P.length, suivis: E.filter((x) => x.e.k !== 'sansobjet').length, manquantes: E.filter((x) => x.e.k === 'manquante').length, anciennes: E.filter((x) => x.e.k === 'ancienne').length,
    nouvelles: E.filter((x) => x.v.k === 'nouvelle').length, liens: P.filter((p) => lienNorm(p.lien)).length, ft: P.filter((p) => prodDocs(db, p.id, 'ft').length).length };
}

/* ---------- lecture d'un document fournisseur : FDS, FT ou certificat ; nom du produit, date de révision, version ---------- */
// « 03/2024 », « mars 2024 » → premier jour du mois
function moisAnnee(s) {
  const f = plier(s); let m = /(?:^|[^\d/.-])(0?[1-9]|1[0-2])\s*[/.-]\s*((?:19|20)\d{2})(?![\d/.-])/.exec(f); if (m) return `${m[2]}-${String(+m[1]).padStart(2, '0')}-01`;
  m = /(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+((?:19|20)\d{2})\b/.exec(f); return m ? `${m[2]}-${String(FDS_MOIS[m[1]]).padStart(2, '0')}-01` : null;
}
const FT_LIB_DATES = [ // [étiquette, longueur lue après l'étiquette]
  [/date de (?:la )?(?:mise a jour|revision|modification|redaction|creation|publication|parution|l'edition)|mise a jour(?: le| du)?|mis(?:e)? a jour le|revise(?:e)? le|derniere (?:revision|mise a jour)|revision date|date of (?:revision|issue)|last updated?|updated on|date d'(?:edition|emission|etablissement)|edite(?:e)? le|etabli(?:e)? le|issue date/, 40],
  [/(?<!remplace\s(?:la\s)?)(?:^|\s)(?:revision|rev\.?|edition|version|ver\.|indice)\s*(?:n\s*[°o]\s*)?(?:[\w.,-]{1,6}\s+)?(?:du|le|of|:|-|–)?\s*/, 24], [/(?:^|\s)date\s*[:.]/, 40],
];
// une date de révision n'est pas dans le futur (une DLUO, si) : un mois de marge
const dateRevOk = (d) => !!d && isoOK(d) && d >= '1990-01-01' && d <= addDays(todayISO(), 31);
// date trouvée après une étiquette (même ligne, ou ligne suivante si l'étiquette est seule)
function ficheDateApres(lignes, F, libs, n) {
  const max = Math.min(F.length, n || F.length);
  for (const [re0, lg] of libs) { const re = new RegExp(re0.source, 'g'); for (let i = 0; i < max; i += 1) {
    re.lastIndex = 0; let m;
    while ((m = re.exec(F[i]))) {
      const apres = lignes[i].slice(m.index + m[0].length, m.index + m[0].length + lg);
      const d = fdsDate(apres) || moisAnnee(apres) || (i + 1 < lignes.length && !/\d/.test(lignes[i].slice(m.index + m[0].length)) ? fdsDate(lignes[i + 1].slice(0, 40)) || moisAnnee(lignes[i + 1].slice(0, 40)) : null);
      if (dateRevOk(d)) return d; if (!m[0].length) re.lastIndex += 1;
    }
  } }
  return '';
}
// titre d'une page : le texte en plus gros caractères du haut de la page (nom du produit sur une fiche technique)
function ficheTitreDePage(page) {
  const it = ((page && page.items) || []).filter((x) => x && x.s && /[A-Za-zÀ-ÿ]{2}/.test(x.s) && x.h > 0 && (!page.h || x.y <= page.h * 0.55)); if (!it.length) return '';
  const hmax = Math.max(...it.map((x) => x.h)); const hs = it.map((x) => x.h).sort((a, b) => a - b); const med = hs[Math.floor(hs.length / 2)];
  if (hmax < med * 1.25) return ''; // aucun texte nettement plus grand
  const gros = it.filter((x) => x.h >= hmax * 0.86).sort((a, b) => (Math.abs(a.y - b.y) > hmax * 0.5 ? a.y - b.y : a.x - b.x));
  return gros.map((x) => x.s.trim()).join(' ').replace(/\s+/g, ' ').trim().slice(0, 90);
}
const FICHE_ENTETES = /^(?:fiche (?:technique|produit|de donnees de securite)|technical data sheet|product data sheet|safety data sheet|fds|ft|tds|sds|msds)\b[\s:–—-]*/i;
function ficheAnalyser(texte, o = {}) {
  const T = String(texte || '').replace(/\r/g, '').replace(/[  ]/g, ' '); const lignes = T.split('\n').map((x) => x.replace(/\s+$/, '')); const F = lignes.map((x) => plier(x));
  const pleines = lignes.map((x, i) => ({ x: x.trim(), f: F[i] })).filter((x) => x.x);
  const tete = pleines.slice(0, 25).map((x) => x.f).join(' \n '); const fic = plier(String(o.fichier || '').replace(/\.[a-z0-9]{2,4}$/i, '')).replace(/[_]+/g, ' ');
  const fds = fdsAnalyser(T);
  const motFt = /fiche (?:technique|produit)|technical data sheet|product data sheet|\bfiche tech\b/; const motFds = /fiche de donnees de securite|safety data sheet|fiche de securite|1907\/2006|2020\/878|2015\/830|453\/2010/;
  const motCert = /\bcertificat\b|\battestation\b|\bcertificate\b|declaration de conformite|declaration of conformity|\bcertifie\b/;
  // rubriques d'une FDS (règlement REACH) : intitulés qu'une fiche technique n'a pas
  const sectionsFds = /identification des dangers|premiers secours|lutte contre l.incendie|manipulation et stockage|controles? de l.exposition|informations toxicologiques|hazards? identification|first.aid measures/;
  let genre = '';
  if (fds.rubriques >= 3 && sectionsFds.test(plier(T))) genre = 'fds';
  else if (motFt.test(tete)) genre = 'ft';
  else if (motFds.test(tete)) genre = 'fds';
  else if (motCert.test(tete)) genre = 'certificat';
  else if (/(?:^|[^a-z])(?:fds|sds|msds)(?:[^a-z]|$)|donnees de securite|securite/.test(fic)) genre = 'fds';
  else if (/(?:^|[^a-z])(?:ft|tds|fiche technique|fiche tech)(?:[^a-z]|$)/.test(fic)) genre = 'ft';
  else if (/certif|attestation/.test(fic)) genre = 'certificat';
  else genre = T.trim() ? 'autre' : '';
  // date de révision et version
  let date = ''; let version = '';
  if (genre === 'fds') { date = fds.fdsDate || ficheDateApres(lignes, F, FT_LIB_DATES); version = fds.fdsVersion || ''; }
  else if (genre) { date = ficheDateApres(lignes, F, FT_LIB_DATES); if (!date) { const bas = pleines.slice(-12).map((x) => x.x).join(' '); date = fdsDate(bas) || moisAnnee(bas) || ''; } }
  if (!dateRevOk(date)) date = '';
  if (!date) { const fn = String(o.fichier || '').replace(/\.[a-z0-9]{2,4}$/i, '').replace(/[_]/g, ' '); date = fdsDate(fn) || moisAnnee(fn) || ''; if (!dateRevOk(date)) date = ''; }
  if (!version) for (let i = 0; i < Math.min(F.length, 80) && !version; i += 1) { const m = /(?<!remplace\s(?:la\s)?)(?:^|\s)(?:version|indice|rev(?:ision)?\.?)\s*(?:n\s*[°o]|no\.?)?\s*[:.]?\s*(\d{1,3}(?:[.,]\d{1,3}){0,2})\b(?!\s*[/.-]\s*\d)/.exec(F[i]); if (m) version = m[1].replace(',', '.'); }
  // nom du produit : rubrique 1 de la FDS, sinon titre (gros caractères), sinon première ligne parlante
  const titre = String(o.titre || '').trim();
  let nom = genre === 'fds' ? fds.nom : '';
  if (!nom && titre && !FICHE_ENTETES.test(plier(titre)) ) nom = titre;
  if (!nom && titre) nom = titre.replace(FICHE_ENTETES, '').trim();
  if (!nom) { const l = pleines.slice(0, 12).find((x) => /[a-z]{3}/i.test(x.x) && !/:\s*$/.test(x.x) && !/\b(?:page|www\.|https?:|tel|fax|@|sas\b|sarl\b|s\.a\.)/i.test(x.f) && x.x.length <= 70 && !motFt.test(x.f) && !motFds.test(x.f)); if (l) nom = l.x.replace(FICHE_ENTETES, '').trim(); }
  return { genre, nom: nom.slice(0, 90), titre, fabricant: genre === 'fds' ? fds.fabricant : '', date, version: String(version || '').slice(0, 20), rubriques: fds.rubriques, extrait: T.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').slice(0, 4000) };
}

/* ---------- rapprochement document → produit ---------- */
const FICHE_MOTS_VIDES = new Set('fiche fiches technique techniques donnees securite fds ft sds msds tds fr fra en eng gb version rev revision de du des la le les et pour sur au aux un une product produit products data sheet safety technical page pdf scan copie doc document documents nouvelle ancienne the of and'.split(' '));
function ficheMots(s) { return plier(s).replace(/[^a-z0-9]+/g, ' ').split(' ').filter((w) => w.length >= 2 && !FICHE_MOTS_VIDES.has(w) && !/^(?:19|20)\d{2}$/.test(w) && !/^\d{1,2}$/.test(w) && !/^\d{5,}$/.test(w)); }
function unEcart(a, b) { // distance d'édition ≤ 1
  if (a === b) return true; if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
const motProche = (a, b) => a === b || (a.length >= 5 && b.length >= 5 && unEcart(a, b)) || (a.length >= 4 && (b === `${a}s` || a === `${b}s` || b === `${a}x` || a === `${b}x`));
// score d'un nom de produit dans un texte court (nom lu, titre, nom du fichier) : part des mots du produit retrouvés, et précision
function ficheScoreMots(mp, ms) {
  if (!mp.length || !ms.length) return 0;
  const cov = mp.filter((m) => ms.some((s) => motProche(m, s))).length / mp.length; if (!cov) return 0;
  const pre = ms.filter((s) => mp.some((m) => motProche(m, s))).length / ms.length; return cov * 0.8 + pre * 0.2 * cov;
}
// produits candidats : intrants (actifs d'abord) et produits d'hygiène non archivés
function ficheCandidatsListe(db, avecHygiene = true) {
  const L = (db.produits || []).map((p) => ({ type: 'produit', id: p.id, nom: p.nom, ref: p.reference || '', fo: ficheFournisseur(db, { type: 'produit', id: p.id }, p), actif: p.actif !== false }));
  if (avecHygiene) (db.produitsHygiene || []).filter((p) => !p.archive).forEach((p) => L.push({ type: 'produitHygiene', id: p.id, nom: p.nom, ref: p.reference || '', fo: p.fabricant || p.fournisseur || '', actif: true }));
  if (avecHygiene) (db.produitsMaintenance || []).filter((p) => p && p.id).forEach((p) => L.push({ type: 'produitMaintenance', id: p.id, nom: p.nom, ref: p.reference || '', fo: p.fournisseur || p.fabricant || '', actif: p.actif !== false })); // 0.36.0-alpha.1
  return L;
}
function ficheCorrespondances(db, lu, o = {}) {
  const sources = [lu.nom, lu.titre, String(lu.fichier || '').replace(/\.[a-z0-9]{2,4}$/i, '')].filter(Boolean).map(ficheMots).filter((m) => m.length);
  const debut = plier((lu.extrait || '').split('\n').slice(0, 60).join(' ')); const motsDebut = ficheMots(debut);
  const morceaux = `${debut} ${plier(lu.fichier || '').replace(/[_.]/g, ' ')}`.split(/\s+/).map((x) => x.replace(/[^a-z0-9]/g, '')).filter(Boolean);
  const compacts = [...morceaux, ...morceaux.slice(1).map((x, i) => morceaux[i] + x)]; // « GL-30210 », « SK 25 »…
  const res = [];
  for (const c of o.candidats || ficheCandidatsListe(db, o.hygiene !== false)) {
    const mp = ficheMots(c.nom); if (!mp.length) continue;
    let s = Math.max(0, ...sources.map((ms) => ficheScoreMots(mp, ms)));
    const covD = motsDebut.length ? mp.filter((m) => motsDebut.some((x) => motProche(m, x))).length / mp.length : 0;
    s = Math.max(s, covD === 1 ? (mp.length >= 2 ? 0.72 : 0.6) : covD * 0.5);
    // référence du fournisseur (au moins 4 caractères dont un chiffre) écrite telle quelle dans le document ou le nom du fichier : indice fort
    const ref = plier(c.ref).replace(/[^a-z0-9]/g, ''); if (ref.length >= 4 && /\d/.test(ref) && compacts.some((x) => x === ref)) s = Math.max(s + 0.45, 0.7);
    if (c.fo && plier(c.fo).length >= 3 && debut.includes(plier(c.fo))) s += 0.04;
    if (!c.actif) s -= 0.03;
    if (s > 0.2) res.push({ type: c.type, id: c.id, nom: c.nom, fo: c.fo, score: Math.min(1, Math.round(s * 100) / 100) });
  }
  return res.sort((a, b) => b.score - a.score || a.nom.localeCompare(b.nom, 'fr')).slice(0, o.max || 6);
}
// produit retenu d'office : score suffisant et nettement devant le suivant
function ficheReconnu(cands) { const [a, b] = cands || []; return a && a.score >= 0.62 && (!b || a.score - b.score >= 0.08) ? { type: a.type, id: a.id } : null; }

/* ---------- que faire du document déposé : joindre, remplacer la version en vigueur (archivée), ou l'archiver (plus ancienne) ---------- */
function ficheActionDefaut(db, cible, genre, date, fichier) {
  const obj = ficheCibleObj(db, cible); if (!obj) return { action: 'ignorer', raison: 'produit à choisir' };
  const cat = ficheCat(cible.type, genre); const f = fichier || {};
  const tous = [...ficheDocs(db, cible.type, cible.id, cat), ...ficheDocs(db, cible.type, cible.id, cat, true)];
  const meme = tous.find((x) => x.nom === f.nom && Number(x.taille) === Number(f.taille));
  if (meme) return { action: 'ignorer', raison: meme.archive ? 'ce fichier est déjà joint (version archivée)' : 'ce fichier est déjà joint', doublon: meme.id };
  if (!['fds', 'ft'].includes(cat)) return { action: 'ajouter', raison: '' };
  const cour = ficheDocs(db, cible.type, cible.id, cat); if (!cour.length) return { action: 'ajouter', raison: cat === 'fds' ? 'première FDS de ce produit' : 'première fiche technique de ce produit' };
  const ref = derniereRevision(cour) || (cat === 'fds' && isoOK(obj.fdsDate) ? obj.fdsDate : cat === 'ft' && isoOK(obj.ftDate) ? obj.ftDate : '');
  if (isoOK(date) && ref) {
    if (date > ref) return { action: 'remplacer', raison: `plus récente que la version jointe (${fmtDate(ref)}), qui sera archivée` };
    if (date === ref) return { action: 'ignorer', raison: `même révision (${fmtDate(ref)}) déjà jointe` };
    return { action: 'archiver', raison: `plus ancienne que la version jointe (${fmtDate(ref)}) : rangée dans les versions précédentes` };
  }
  if (isoOK(date)) return { action: 'remplacer', raison: 'la version jointe n’est pas datée : elle sera archivée' };
  return { action: 'ajouter', raison: 'date de révision non trouvée : vérifiez-la', alerte: true };
}
// joint un document déjà rangé dans ce navigateur (meta : id, nom, mime, taille) à un produit, selon l'action choisie
function ficheJoindre(db, o) {
  const cible = o && o.cible; const obj = ficheCibleObj(db, cible); if (!obj) return fail('Produit introuvable.');
  const action = o.action || 'ajouter'; if (!['ajouter', 'remplacer', 'archiver'].includes(action)) return fail('Action inconnue.');
  const cat = ficheCat(cible.type, o.genre); const t = o.today || todayISO(); const date = isoOK(o.date) ? o.date : ''; const version = String(o.version || '').trim().slice(0, 30);
  const r = docMetaAdd(db, { ...(o.meta || {}), cat, cible, revision: date, version }); if (!r.ok) return r;
  const nv = db.docs[db.docs.length - 1];
  if (action === 'archiver') nv.archive = t;
  if (action === 'remplacer') ficheDocs(db, cible.type, cible.id, cat).forEach((x) => { if (x.id !== nv.id) { x.archive = t; x.remplacePar = nv.id; } });
  if (action !== 'archiver' && cat === 'fds' && (action === 'remplacer' || (date && (!isoOK(obj.fdsDate) || date > obj.fdsDate)))) { obj.fdsDate = date; obj.fdsVersion = version; }
  if (action !== 'archiver' && cat === 'ft' && cible.type === 'produit' && (action === 'remplacer' || (date && (!isoOK(obj.ftDate) || date > obj.ftDate)))) obj.ftDate = date;
  if (cible.type === 'produitHygiene' || cible.type === 'produitMaintenance') obj.modifLe = t;
  return okr({ id: nv.id });
}
// date de révision ou version d'un document joint, corrigée à la main ; la fiche du produit suit pour la version en vigueur
function ficheDocReviser(db, docId, patch) {
  const x = (db.docs || []).find((y) => y.id === docId); if (!x) return fail('Document introuvable.');
  if (patch.revision !== undefined) { if (patch.revision && !isoOK(patch.revision)) return fail('Date de révision invalide.'); if (patch.revision) x.revision = patch.revision; else delete x.revision; }
  if (patch.version !== undefined) { const v = String(patch.version || '').trim().slice(0, 30); if (v) x.version = v; else delete x.version; }
  ficheRecaler(db, x.cible); return okr();
}
// archiver à la main une version, ou la rétablir comme version en vigueur
function ficheDocArchiver(db, docId, archiver, today) {
  const x = (db.docs || []).find((y) => y.id === docId); if (!x) return fail('Document introuvable.');
  if (archiver) x.archive = today || todayISO(); else { delete x.archive; delete x.remplacePar; }
  ficheRecaler(db, x.cible); return okr();
}
// fiche du produit recalée sur la FDS / FT en vigueur la plus récente (si elles sont datées)
function ficheRecaler(db, cible) {
  const obj = ficheCibleObj(db, cible); if (!obj) return;
  const fd = ficheDocs(db, cible.type, cible.id, 'fds').filter((x) => isoOK(x.revision)).sort((a, b) => (a.revision < b.revision ? 1 : -1))[0];
  if (fd) { obj.fdsDate = fd.revision; obj.fdsVersion = fd.version || ''; }
  if (cible.type === 'produit') { const ft = derniereRevision(ficheDocs(db, cible.type, cible.id, 'ft')); if (ft) obj.ftDate = ft; }
}
// produit créé d'après un document (nom lu), dans la catégorie Œnologique
function ficheProduitCreer(db, s) {
  const nom = String((s && s.nom) || '').trim().slice(0, 90); if (!nom) return fail('Nom du produit à créer manquant.');
  const ex = (db.produits || []).find((p) => norm(p.nom).trim() === norm(nom).trim()); if (ex) return okr({ id: ex.id, existant: true });
  const fo = s.fabricant ? (db.fournisseurs || []).find((f) => norm(f.nom).trim() && (norm(s.fabricant).includes(norm(f.nom).trim()) || norm(f.nom).includes(norm(s.fabricant).trim()))) : null;
  const r = produitSave(db, { nom, categorie: s.categorie || 'oeno', unite: s.unite || 'kg', fournisseurId: fo ? fo.id : '', actif: true, notes: s.notes || '' }); if (!r.ok) return r;
  return okr({ id: db.produits[db.produits.length - 1].id });
}
// résultat d'une vérification en ligne (veille) rangé sur le produit ; la page trouvée devient son lien s'il n'en a pas
function prodVeilleEnregistrer(db, id, veille, o = {}) {
  const p = (db.produits || []).find((x) => x.id === id); if (!p) return fail('Produit introuvable.');
  p.veille = veille; if (veille && veille.page && !lienNorm(p.lien) && o.lien !== false) p.lien = veille.page; return okr();
}
