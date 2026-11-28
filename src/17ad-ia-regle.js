/* ============ ASSISTANT IA — RÈGLES, AUDITS, AIDE, CONFIGURATION, NETTOYAGE (0.49.0-alpha.1, audit IA validé : IA07, IA09, IA10, IA11, IA14, IA21) ============
   Fonctions pures (testables en Node) : consignes envoyées, schémas des réponses, lecture contrôlée des réponses. L'IA ne fait que
   proposer : rien de ce fichier n'écrit dans la base, sauf les fonctions « …Set » / « …Ajouter » appelées après relecture.
   - IA14 veille des textes réglementaires (usage veilleTextes, niveau 0, recherche web) : textes de REG_TEXTES (16t) ; résultat gardé dans
     settings.referentiel.veille = { [texteId]: { date, trouve, url, version, remarque, dateRelue, sourceVue, le, par, relu?, reluPar?, reluLe? } }
     (droit d'écriture Intrants, comme settings.referentiel : gardeDroits) ; un texte plus récent marque ses règles « à relire » à
     l'affichage — aucune valeur du référentiel ne change ;
   - IA09 préparer un audit (usage audit, niveau 2) : type, points de contrôle, réponses, pièces présentes / manquantes, notes ; synthèse et
     brouillon de notes par chapitre, repris dans les notes de l'audit seulement après validation (a.ia = trace) ;
   - IA07 « Comment faire… ? » (usage aide, niveau 0) : question + documentation intégrée (visite guidée, modules, rubriques de Paramètres,
     notes de version) ; liens { module, sub, libelle } gardés seulement vers les modules permis ;
   - IA10 règle de codification dictée (usage codification, niveau 0) : briques au format de 16u, contrôlées par codifValider ;
   - IA11 configuration guidée depuis une description (usage configuration, niveau 0) : réponses contrôlées par persoValider (jamais le
     compte ni le choix de la base) ;
   - IA21 plan de nettoyage proposé (usage planNettoyage, niveau 0) : lignes au format de planEntreeSave, ajoutées après validation,
     marquées ia (trace) et aVerifier (« proposé par l'IA, à vérifier ») ; champs ignorés par les versions antérieures. */

/* ---------- outils ---------- */
const IAR_MOIS = { janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12 };
const iarPad = (n) => String(n).padStart(2, '0');
const iarTxt = (v, n) => (v == null ? '' : String(v).replace(/\s+/g, ' ').trim().slice(0, n || 200));
const iarNul = (v) => v == null || (typeof v === 'string' && /^\s*(?:null|none|n\/?a|inconnu[e]?|-|)\s*$/i.test(v));
// date ISO d'une mention « 29/12/2024 », « 31 juillet 2025 », « janvier 2024 », « édition 2025 » (la première du texte)
function iarDateDe(texte) {
  const t = String(texte || ''); const L = [];
  let m; const re1 = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g; while ((m = re1.exec(t))) L.push({ i: m.index, d: `${m[3]}-${iarPad(m[2])}-${iarPad(m[1])}` });
  const re2 = /\b(\d{1,2})(?:er)?\s+([a-zéèûô]+)\s+(\d{4})\b/gi; while ((m = re2.exec(t))) { const mo = IAR_MOIS[norm(m[2])]; if (mo) L.push({ i: m.index, d: `${m[3]}-${iarPad(mo)}-${iarPad(m[1])}` }); }
  const re3 = /\b([a-zéèûô]+)\s+(\d{4})\b/gi; while ((m = re3.exec(t))) { const mo = IAR_MOIS[norm(m[1])]; if (mo && !L.some((x) => Math.abs(x.i - m.index) < 4 || (m.index > x.i && m.index < x.i + 4))) L.push({ i: m.index, d: `${m[2]}-${iarPad(mo)}-01` }); }
  const re4 = /(?:^|[\s(,;])(?:édition|edition|version)\s+(\d{4})\b/gi; while ((m = re4.exec(t))) L.push({ i: m.index, d: `${m[1]}-01-01` });
  const ok = L.filter((x) => isoOK(x.d)).sort((a, b) => a.i - b.i); return ok.length ? ok[0].d : '';
}
// date proposée par l'IA : AAAA-MM-JJ, AAAA-MM ou JJ/MM/AAAA, sinon ''
function iarDateIa(v) {
  if (iarNul(v)) return ''; const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return isoOK(s) ? s : ''; if (/^\d{4}-\d{2}$/.test(s)) return isoOK(`${s}-01`) ? `${s}-01` : ''; if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  return iarDateDe(s);
}
// adresse http(s) lisible, sinon ''
function iarLien(u) { if (iarNul(u)) return ''; const v = String(u).trim(); if (!/^https?:\/\/\S+$/i.test(v)) return ''; try { const x = new URL(v); return /^https?:$/.test(x.protocol) && /\./.test(x.hostname) ? x.href : ''; } catch (e) { return ''; } }
const iarSans = (u) => String(u || '').split('#')[0].replace(/\/+$/, '').toLowerCase();

/* ================= IA14 — veille des textes réglementaires ================= */
// textes du référentiel : identifiant, intitulé, référence (début de l'intitulé), date de la version relue, labels qui le citent
function veilleTextesListe() {
  return Object.keys(REG_TEXTES).map((id) => {
    const intitule = REG_TEXTES[id]; const reference = String(intitule).split(/[,;]| — /)[0].trim();
    return { id, intitule, reference, dateRelue: iarDateDe(intitule), labels: REG_LABELS.filter((l) => l.texte === id).map((l) => l.id), aVerifier: /à vérifier|non consulté/.test(intitule) };
  });
}
const veilleTexteDe = (id) => veilleTextesListe().find((x) => x.id === id) || null;
// identifiant du texte d'une source de règle (REG_REGLES[].source, REG_SO2[].source = l'intitulé)
const veilleTexteIdDeSource = (src) => { const s = String(src || ''); return Object.keys(REG_TEXTES).find((id) => REG_TEXTES[id] === s) || ''; };
const IA_VEILLE_TEXTES_SCHEMA = { type: 'object', required: ['textes'], properties: { textes: { type: 'array', maxItems: 40, items: { type: 'object', required: ['id', 'trouve'], properties: {
  id: { type: 'string', maxLength: 40 }, trouve: { type: 'boolean' }, version: { type: 'string', nullable: true, maxLength: 200 }, date: { type: 'string', nullable: true, maxLength: 40 },
  url: { type: 'string', nullable: true, maxLength: 600 }, remarque: { type: 'string', nullable: true, maxLength: 400 } } } } } };
// consignes et texte envoyés : intitulés, références et dates des versions relues (rien de l'exploitation)
function iaVeilleTextesPrompt(ids) {
  const L = veilleTextesListe().filter((x) => !ids || ids.includes(x.id));
  const system = 'Tu fais la veille réglementaire d’une cave (vinification) : pour chaque texte de la liste (règlement européen, code de l’OIV, cahier des charges d’une appellation ou d’un label), tu cherches sur internet, sur les sites officiels (EUR-Lex, Légifrance, INAO, OIV, sites des labels), s’il existe une version plus récente que celle relue par la cave : version consolidée, modification, nouvelle édition, nouvelle charte ou nouveau cahier homologué. Tu ne donnes que des adresses réellement trouvées dans tes recherches, jamais une adresse devinée. Si tu ne trouves rien de plus récent, « trouve » vaut false.';
  const texte = `Textes (identifiant | intitulé | date de la version relue par la cave) :\n${L.map((x) => `${x.id} | ${x.intitule} | ${x.dateRelue || 'date non précisée'}`).join('\n')}\n\nPour chaque identifiant, réponds : {"textes": [{"id": "<identifiant>", "trouve": true si une version plus récente existe, "version": "<intitulé de la version la plus récente trouvée ou null>", "date": "AAAA-MM-JJ de cette version ou null", "url": "<adresse officielle de cette version ou null>", "remarque": "<une phrase utile ou null>"}]}`;
  return { system, texte, web: true, max: 3000, schema: IA_VEILLE_TEXTES_SCHEMA, nom: 'veille_textes' };
}
// réponse contrôlée → { [texteId]: entrée } ; « trouve » seulement si la date trouvée est postérieure à la version relue (ou inconnue mais
// signalée avec une adresse) ; adresse gardée, marquée « vue » si elle figure dans les sources de la recherche
function iaVeilleTextesLire(valeur, sources, opts) {
  const o = opts || {}; const S = (sources || []).filter((s) => s && s.url); const out = {}; const le = o.le || new Date().toISOString();
  ((valeur && valeur.textes) || []).forEach((x) => {
    const t = veilleTexteDe(x && x.id); if (!t || out[t.id]) return;
    const date = iarDateIa(x.date); const url = iarLien(x.url); const plusRecent = !!x.trouve && (date ? (!t.dateRelue || date > t.dateRelue) : !!url);
    out[t.id] = { date, trouve: plusRecent, url, version: iarTxt(x.version, 200), remarque: iarTxt(x.remarque, 400), dateRelue: t.dateRelue, sourceVue: !!url && S.some((s) => iarSans(s.url) === iarSans(url)), le, par: o.par || '' };
  });
  return out;
}
const veilleReglage = (db) => { const r = db && db.settings && db.settings.referentiel; const v = r && r.veille; return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; };
// enregistrement (après lecture de la réponse) : seuls les textes connus ; ni les règles, ni les corrections, ni l'activation ne changent
function veilleTextesSet(db, resultats, uid) {
  const R0 = resultats && typeof resultats === 'object' ? resultats : {}; const ids = Object.keys(R0).filter((id) => REG_TEXTES[id]);
  if (!ids.length) return fail('Aucun texte du référentiel dans la réponse.');
  db.settings = db.settings || {}; const r = (db.settings.referentiel = db.settings.referentiel && typeof db.settings.referentiel === 'object' ? db.settings.referentiel : {});
  const v = { ...veilleReglage(db) }; ids.forEach((id) => { const e = R0[id] || {}; v[id] = { date: String(e.date || ''), trouve: !!e.trouve, url: String(e.url || ''), version: String(e.version || ''), remarque: String(e.remarque || ''), dateRelue: String(e.dateRelue || ''), sourceVue: !!e.sourceVue, le: e.le || new Date().toISOString(), par: uid || e.par || '' }; });
  r.veille = v; return okr({ n: ids.length, plusRecents: ids.filter((id) => v[id].trouve).length });
}
// la cave a relu le texte plus récent (et corrigé au besoin ses valeurs, tracées) : plus « à relire »
function veilleTexteRelu(db, id, uid) {
  const v = veilleReglage(db); if (!v[id]) return fail('Texte non vérifié.');
  db.settings.referentiel.veille = { ...v, [id]: { ...v[id], relu: true, reluPar: uid || '', reluLe: todayISO() } }; return okr();
}
const veilleTexteARelire = (db, id) => { const e = veilleReglage(db)[id]; return !!(e && e.trouve && !e.relu); };
// règles et plafonds de SO₂ qui citent un texte (à relire quand une version plus récente existe)
function veilleReglesDuTexte(id) {
  const src = REG_TEXTES[id]; if (!src) return [];
  return [...REG_REGLES.filter((r) => r.source === src).map((r) => ({ type: 'regle', label: r.label, compose: r.compose, ref: r.ref })), ...REG_SO2.filter((r) => r.source === src).map((r) => ({ type: 'so2', label: r.label, vin: r.vin, ref: r.ref }))];
}
const veilleRegleARelire = (db, regle) => !!regle && veilleTexteARelire(db, veilleTexteIdDeSource(regle.source));

/* ================= IA09 — préparer un audit ================= */
// pièces présentes / manquantes : regs = registres de la période ([{ id, rows }], interface), comptes des autres pièces d'après la base
function iaAuditPiecesEtat(db, a, m, regs) {
  const R0 = Array.isArray(regs) ? regs : []; const r = (m && m.reglages) || {};
  return ((m && m.pieces) || []).map((id) => {
    const reg = R0.find((x) => x && x.id === id); let n = null;
    if (reg) n = (reg.rows || []).length;
    else if (id === 'identite') n = (db.entreprise && db.entreprise.nom ? 1 : 0) + (db.docs || []).filter((d) => d && /certif|attest|habilit/i.test(`${d.cat || ''} ${d.nom || ''}`)).length;
    else if (id === 'so2') n = auditSo2(db, a.debut, a.fin, r.so2Max).length;
    else if (id === 'lattes') n = auditLattes(db, r, a.debut, a.fin).length;
    else if (id === 'tracabilite') n = (a.tests || []).length;
    else if (id === 'plan_hygiene') n = (db.planNettoyage || []).filter((e) => e && e.actif !== false).length;
    else if (id === 'equipements') n = ((db.lists && db.lists.equipements) || []).length;
    else if (id === 'bilan' || id === 'stocks') n = 1;
    return { id, nom: auditPieceNom(id), n, present: n == null ? null : n > 0 };
  });
}
// ce qui part : type d'audit, points de contrôle et réponses, pièces présentes / manquantes, notes (ni l'auditeur, ni l'organisme, ni les registres)
function iaAuditDonnees(db, a, m, pieces) {
  const etat = (e) => (AUDIT_ETATS.find((x) => x[0] === e) || [null, 'sans réponse'])[1];
  return { type: m.nom, attendu: m.desc || '', points: (m.points || []).map((p) => { const x = (a.reponses || {})[p.id] || {}; return { id: p.id, texte: p.texte, pieces: (p.pieces || []).map(auditPieceNom), reponse: etat(x.etat), note: x.note || '' }; }),
    pieces: (pieces || []).map((x) => ({ id: x.id, nom: x.nom, etat: x.present == null ? 'à vérifier' : x.present ? `présente (${x.n} élément(s))` : 'manquante ou vide sur la période' })), notes: a.notes || '' };
}
const IA_AUDIT_SCHEMA = { type: 'object', required: ['synthese'], properties: {
  synthese: { type: 'string', maxLength: 1500 },
  pointsFaibles: { type: 'array', maxItems: 20, items: { type: 'object', required: ['texte'], properties: { point: { type: 'string', nullable: true, maxLength: 20 }, texte: { type: 'string', maxLength: 400 } } } },
  piecesAPreparer: { type: 'array', maxItems: 20, items: { type: 'object', required: ['texte'], properties: { piece: { type: 'string', nullable: true, maxLength: 40 }, texte: { type: 'string', maxLength: 400 } } } },
  chapitres: { type: 'array', maxItems: 30, items: { type: 'object', required: ['chapitre', 'notes'], properties: { chapitre: { type: 'string', maxLength: 40 }, notes: { type: 'string', maxLength: 800 } } } } } };
function iaAuditPrompt(donnees) {
  const D = donnees || {};
  const system = 'Tu aides une cave (vinification) à préparer la visite d’un auditeur (organisme certificateur, douanes, contrôle sanitaire, appellation). À partir des points de contrôle, des réponses déjà notées, des pièces présentes ou manquantes et des notes, tu rédiges en français : une synthèse courte, les points faibles, les pièces à préparer, et un brouillon de notes par chapitre (« synthese » pour les points de contrôle, sinon l’identifiant de la pièce). Tu ne présentes jamais une règle comme officielle : ce sont des pistes à vérifier par la cave. N’invente aucun fait sur la cave.';
  const texte = `Type d’audit : ${D.type || ''}\nCe que l’auditeur attend : ${D.attendu || '—'}\n\nPoints de contrôle (identifiant | point | pièces | réponse | note) :\n${(D.points || []).map((p) => `${p.id} | ${p.texte} | ${p.pieces.join(', ') || '—'} | ${p.reponse} | ${p.note || '—'}`).join('\n') || '(aucun)'}\n\nPièces à présenter (identifiant | pièce | état) :\n${(D.pieces || []).map((p) => `${p.id} | ${p.nom} | ${p.etat}`).join('\n') || '(aucune)'}\n\nNotes générales : ${D.notes || '—'}\n\nRéponds par : {"synthese": "…", "pointsFaibles": [{"point": "<identifiant ou null>", "texte": "…"}], "piecesAPreparer": [{"piece": "<identifiant ou null>", "texte": "…"}], "chapitres": [{"chapitre": "synthese | <identifiant de pièce>", "notes": "…"}]}`;
  return { system, texte, schema: IA_AUDIT_SCHEMA, nom: 'audit', max: 2500 };
}
// réponse contrôlée : chapitres et pièces connus du type d'audit seulement
function iaAuditLire(valeur, m) {
  const V = valeur || {}; const P = (m && m.pieces) || []; const pts = ((m && m.points) || []).map((p) => p.id); const chaps = ['synthese', ...P];
  const chapitres = []; ((V.chapitres || [])).forEach((c) => { const id = String(c.chapitre || '').trim(); const notes = iarTxt(c.notes, 800); if (!chaps.includes(id) || !notes) return; const x = chapitres.find((y) => y.chapitre === id); if (x) x.notes = `${x.notes} ${notes}`.slice(0, 800); else chapitres.push({ chapitre: id, notes }); });
  return { synthese: iarTxt(V.synthese, 1500), pointsFaibles: (V.pointsFaibles || []).map((x) => ({ point: pts.includes(x.point) ? x.point : '', texte: iarTxt(x.texte, 400) })).filter((x) => x.texte),
    piecesAPreparer: (V.piecesAPreparer || []).map((x) => ({ piece: P.includes(x.piece) ? x.piece : '', texte: iarTxt(x.texte, 400) })).filter((x) => x.texte), chapitres };
}
// texte repris dans les notes : parties cochées par l'utilisateur ({ synthese, faibles, pieces, chapitres: [ids] })
function iaAuditNotesTexte(prop, choix, m) {
  const C = choix || {}; const L = ['— Préparation de l’audit (proposée par l’IA, relue) —'];
  if (C.synthese && prop.synthese) L.push(prop.synthese);
  if (C.faibles && prop.pointsFaibles.length) L.push(`Points faibles : ${prop.pointsFaibles.map((x) => x.texte).join(' ; ')}`);
  if (C.pieces && prop.piecesAPreparer.length) L.push(`Pièces à préparer : ${prop.piecesAPreparer.map((x) => (x.piece ? `${auditPieceNom(x.piece)} — ${x.texte}` : x.texte)).join(' ; ')}`);
  prop.chapitres.filter((c) => (C.chapitres || []).includes(c.chapitre)).forEach((c) => L.push(`${c.chapitre === 'synthese' ? 'Points de contrôle' : auditPieceNom(c.chapitre)} : ${c.notes}`));
  return L.length > 1 ? L.join('\n') : '';
}
// ajout aux notes de l'audit (après validation) ; notes limitées à 3 000 caractères (auditSave) ; trace de l'IA gardée sur l'audit
function iaAuditNotesAjouter(db, id, texte, trace) {
  const a = (db.audits || []).find((x) => x && x.id === id); if (!a) return fail('Audit introuvable.'); if (!String(texte || '').trim()) return fail('Rien à reprendre : cochez au moins une partie.');
  const avant = String(a.notes || ''); const tout = `${avant}${avant ? '\n\n' : ''}${String(texte).trim()}`; const r = auditSave(db, id, { notes: tout }); if (!r.ok) return r;
  const t = iaTraceNorm(trace); if (t) a.ia = t; return okr({ tronque: tout.length > 3000 });
}

/* ================= IA07 — assistant « Comment faire… ? » ================= */
// documentation intégrée envoyée avec la question : chapitres de la visite (16z), modules, rubriques de Paramètres, notes de version récentes
function iaAideDoc(o) {
  const O = o || {}; const L = [];
  L.push('# Modules (identifiant — nom : rôle)'); (O.modules || []).forEach((x) => L.push(`${x.id} — ${x.label} : ${x.desc || ''}`));
  L.push('', '# Visite guidée (chapitre [module] › étape [sous-onglet] : explication)');
  (O.chapitres || []).forEach((c) => { L.push(`## ${c.titre} [${c.module || 'en-tête'}]`); (c.etapes || []).forEach((e) => L.push(`- ${e.titre}${e.sub ? ` [${e.sub}]` : ''} : ${e.texte}`)); });
  L.push('', '# Paramètres (module params, sous-onglet = identifiant de la rubrique)'); (O.rubriques || []).forEach((x) => L.push(`${x.id} — ${x.label}${x.groupe ? ` (${x.groupe})` : ''}`));
  L.push('', '# Nouveautés récentes'); (O.notes || []).slice(0, 3).forEach((v) => L.push(`${v.v} : ${(v.notes || []).join(' ').slice(0, 2500)}`));
  return L.join('\n').slice(0, 40000);
}
const IA_AIDE_SCHEMA = { type: 'object', required: ['reponse'], properties: { reponse: { type: 'string', maxLength: 3000 },
  liens: { type: 'array', maxItems: 6, items: { type: 'object', required: ['module', 'libelle'], properties: { module: { type: 'string', maxLength: 40 }, sub: { type: 'string', nullable: true, maxLength: 40 }, libelle: { type: 'string', maxLength: 80 } } } } } };
// question (et questions précédentes de la conversation, au plus 3) + documentation ; rien de l'exploitation
function iaAidePrompt(question, doc, precedentes) {
  const P = (precedentes || []).map((q) => iarTxt(q, 300)).filter(Boolean).slice(-3);
  const system = `Tu es l’assistant d’Œnotrack, application de traçabilité de la cuverie et du chai (vinification). Tu réponds en français, en quelques phrases simples, à la question « comment faire… ? » d’un utilisateur, uniquement d’après la documentation ci-dessous. Si la documentation ne permet pas de répondre, dis-le franchement et propose l’onglet le plus proche. Tu proposes au plus 4 liens vers les onglets utiles : « module » est un identifiant de module de la documentation, « sub » l’identifiant d’un sous-onglet ou d’une rubrique de Paramètres quand il est donné entre crochets (sinon null). N’invente ni onglet ni bouton.\n\nDOCUMENTATION D’ŒNOTRACK\n${doc || ''}`;
  const texte = `${P.length ? `Questions précédentes : ${P.join(' / ')}\n\n` : ''}Question : ${iarTxt(question, 600)}\n\nRéponds par : {"reponse": "…", "liens": [{"module": "<identifiant>", "sub": "<sous-onglet ou null>", "libelle": "<texte du bouton>"}]}`;
  return { system, texte, schema: IA_AIDE_SCHEMA, nom: 'aide', max: 1500 };
}
// liens gardés : modules permis seulement (affichés et autorisés) ; sous-onglet au format d'un identifiant
function iaAideLire(valeur, permis) {
  const ok = Array.isArray(permis) ? (id) => permis.includes(id) : typeof permis === 'function' ? permis : () => false; const vus = new Set();
  const liens = ((valeur && valeur.liens) || []).map((l) => ({ module: String(l.module || '').trim(), sub: /^[a-z0-9_-]{1,40}$/i.test(String(l.sub || '').trim()) ? String(l.sub).trim() : '', libelle: iarTxt(l.libelle, 80) }))
    .filter((l) => l.module && ok(l.module) && l.libelle && !vus.has(`${l.module}|${l.sub}`) && vus.add(`${l.module}|${l.sub}`)).slice(0, 4);
  return { reponse: iarTxt(valeur && valeur.reponse, 3000), liens };
}

/* ================= IA10 — règle de codification dictée ================= */
const IA_CODIF_CHAMPS = {
  commun: ['type', 'nom', 'casse', 'sansAccents', 'garder', 'garderDe', 'largeur', 'remplir', 'aligne', 'reserver', 'si', 'defaut'],
  texte: ['valeur'], sep: ['valeur'], date: ['champ', 'chiffres', 'encodage', 'tableId'], millesime: ['chiffres', 'sep', 'nv', 'mode', 'encodage', 'tableId'],
  compteur: ['chiffres', 'alphabet', 'caracteres', 'depart', 'pas', 'raz', 'razParties'], variable: ['variable', 'rendu', 'tableId', 'sep'], choix: ['tableId'], herite: ['mode', 'partie', 'debut', 'fin'],
};
const IA_CODIF_ENUMS = { casse: ['maj', 'min'], garderDe: ['debut', 'fin'], aligne: ['gauche', 'droite'], encodage: ['chiffres', 'champenois', 'lettres', 'table'], alphabet: ['num', 'alpha', 'alphaInv', 'perso'], rendu: ['valeur', 'court', 'table'] };
const IA_CODIF_SCHEMA = { type: 'object', required: ['briques'], properties: { briques: { type: 'array', maxItems: 20, items: { type: 'object', required: ['type'], properties: {
  type: { type: 'string', maxLength: 20 }, nom: { type: 'string', nullable: true, maxLength: 30 }, valeur: { type: 'string', nullable: true, maxLength: 40 }, champ: { type: 'string', nullable: true, maxLength: 20 },
  chiffres: { type: 'integer', nullable: true, minimum: 1, maximum: 6 }, encodage: { type: 'string', nullable: true, maxLength: 20 }, table: { type: 'string', nullable: true, maxLength: 20 },
  sep: { type: 'string', nullable: true, maxLength: 5 }, nv: { type: 'string', nullable: true, maxLength: 10 }, mode: { type: 'string', nullable: true, maxLength: 20 },
  alphabet: { type: 'string', nullable: true, maxLength: 20 }, caracteres: { type: 'string', nullable: true, maxLength: 40 }, depart: { type: 'integer', nullable: true, minimum: 0, maximum: 100000 }, pas: { type: 'integer', nullable: true, minimum: 1, maximum: 1000 },
  raz: { type: 'string', nullable: true, maxLength: 20 }, razParties: { type: 'array', nullable: true, maxItems: 6, items: { type: 'string', maxLength: 30 } },
  variable: { type: 'string', nullable: true, maxLength: 30 }, rendu: { type: 'string', nullable: true, maxLength: 20 }, partie: { type: 'string', nullable: true, maxLength: 30 },
  debut: { type: 'integer', nullable: true, minimum: 1, maximum: 40 }, fin: { type: 'integer', nullable: true, minimum: 1, maximum: 40 },
  casse: { type: 'string', nullable: true, maxLength: 10 }, sansAccents: { type: 'boolean', nullable: true }, garder: { type: 'integer', nullable: true, minimum: 1, maximum: 40 }, garderDe: { type: 'string', nullable: true, maxLength: 10 },
  largeur: { type: 'integer', nullable: true, minimum: 1, maximum: 40 }, remplir: { type: 'string', nullable: true, maxLength: 1 }, aligne: { type: 'string', nullable: true, maxLength: 10 }, reserver: { type: 'boolean', nullable: true }, defaut: { type: 'string', nullable: true, maxLength: 20 },
  si: { type: 'object', nullable: true, properties: { variable: { type: 'string', maxLength: 40 }, test: { type: 'string', maxLength: 20 }, valeur: { type: 'string', nullable: true, maxLength: 40 } } } } } } } };
// codes des tables envoyés (T1, T2…) : seuls leurs noms partent
const iaCodifTablesCodes = (db) => Object.fromEntries(codifTables(db).map((t, i) => [`T${i + 1}`, t.id]));
function iaCodifPrompt(db, stade, phrase) {
  const st = codifStadeDef(stade) || { label: stade }; const codes = iaCodifTablesCodes(db);
  const system = 'Tu traduis en briques la règle de codification des lots d’une cave, dictée en langage courant. Le code d’un lot est la suite des briques, dans l’ordre. N’utilise que les types et valeurs listés ; une valeur inconnue est refusée. N’invente aucune table : n’utilise que les codes de tables fournis.';
  const texte = `Stade : ${st.label}${st.parent ? ' (le code de l’étape précédente peut être repris : brique « herite »)' : ''}\nRègle dictée : ${iarTxt(phrase, 600)}\n\nTypes de briques : texte (valeur = texte fixe), sep (valeur = séparateur), date (champ : ${CODIF_DATES.map((x) => x.id).join(', ')} ; chiffres ; encodage : chiffres | champenois | lettres | table), millesime (chiffres, sep entre millésimes, nv = texte d’un non millésimé, mode : tous | majoritaire | premier | dernier), compteur (chiffres, alphabet : num | alpha | alphaInv | perso + caracteres, depart, pas, raz : ${CODIF_RAZ.map((x) => x.id).join(' | ')}, razParties = noms de briques), variable (variable : ${CODIF_VARS.map((x) => x.id).join(', ')} ; rendu : valeur | court | table), choix (table = code d’une table, choisie à la saisie)${st.parent ? ', herite (mode : tout | partie + partie | position + debut, fin)' : ''}.\nMise en forme possible sur toute brique : nom, casse (maj | min), sansAccents, garder (nombre de caractères) + garderDe (debut | fin), largeur + remplir + aligne (gauche | droite), condition si { variable (identifiant de variable, choix:<code de table> ou partie:<nom>), test (${CODIF_TESTS.map((x) => x.id).join(' | ')}), valeur }.\nTables de codification (code | nom) : ${Object.keys(codes).map((k) => `${k} | ${(codifTable(db, codes[k]) || {}).nom}`).join(' ; ') || 'aucune'}\n\nRéponds par : {"briques": [{"type": "…", …}]}`;
  return { system, texte, schema: IA_CODIF_SCHEMA, nom: 'codification', max: 1500, codes };
}
// briques proposées → briques du format de 16u (champs connus seulement, tables par leur code), contrôlées par codifValider
function iaCodifBriques(db, stade, valeur, codes) {
  const C = codes || iaCodifTablesCodes(db); const tab = (x) => { const s = String(x || '').trim(); if (C[s]) return C[s]; const t = codifTables(db).find((y) => y.id === s || norm(y.nom).trim() === norm(s).trim()); return t ? t.id : ''; };
  const ignores = [];
  const briques = ((valeur && valeur.briques) || []).map((b0, i) => {
    const type = String(b0.type || '').trim(); if (!CODIF_BRIQUES.some((x) => x.id === type)) { ignores.push(`brique ${i + 1} : type « ${type} » inconnu`); return null; }
    const garder = [...IA_CODIF_CHAMPS.commun, ...(IA_CODIF_CHAMPS[type] || [])]; const b = { type };
    garder.forEach((k) => {
      if (k === 'type') return; let v = k === 'tableId' ? b0.table : b0[k]; if (v == null || v === '') return;
      if (IA_CODIF_ENUMS[k] && !IA_CODIF_ENUMS[k].includes(v)) { ignores.push(`brique ${i + 1} : ${k} « ${v} » inconnu`); return; }
      if (k === 'tableId') { v = tab(v); if (!v) { ignores.push(`brique ${i + 1} : table inconnue`); return; } }
      if (k === 'champ' && !CODIF_DATES.some((x) => x.id === v)) { ignores.push(`brique ${i + 1} : élément de date « ${v} » inconnu`); return; }
      if (k === 'variable' && !CODIF_VARS.some((x) => x.id === v)) { ignores.push(`brique ${i + 1} : donnée « ${v} » inconnue`); return; }
      if (k === 'raz' && !CODIF_RAZ.some((x) => x.id === v)) return;
      if (k === 'mode' && !(type === 'herite' ? ['tout', 'partie', 'position'] : ['tous', 'majoritaire', 'premier', 'dernier']).includes(v)) return;
      if (k === 'si') { const variable = String(v.variable || '').replace(/^choix:(T\d+)$/, (x, c) => `choix:${C[c] || c}`); if (!variable || !CODIF_TESTS.some((x) => x.id === v.test)) return; v = { variable, test: v.test, ...(v.valeur != null ? { valeur: String(v.valeur) } : {}) }; }
      if (k === 'razParties') v = (Array.isArray(v) ? v : []).map(String);
      b[k] = v;
    });
    if (type === 'date' && b.encodage === 'table' && !b.tableId) delete b.encodage;
    if (type === 'choix' && !b.tableId) { ignores.push(`brique ${i + 1} : table à choisir`); }
    return b;
  }).filter(Boolean);
  const v = codifValider(db, stade, briques);
  return { ok: v.ok, msg: v.ok ? '' : v.msg, briques, ignores };
}

/* ================= IA11 — configuration guidée depuis une description ================= */
const IA_PERSO_EXCLUES = ['compte', 'donnees']; // jamais proposées par l'IA : compte et mot de passe, choix de la base de départ
// questions envoyées : identifiant, type, texte, choix possibles (identifiants et libellés), bornes
function iaPersoQuestions() {
  return PERSO_QUESTIONS.filter((q) => !IA_PERSO_EXCLUES.includes(q.id)).map((q) => ({ id: q.id, type: q.type, texte: q.texte, ...(['choix', 'multi'].includes(q.type) ? { choix: persoOptions(q).map((o) => ({ id: o.id, label: o.label })) } : {}), ...(q.min != null ? { min: q.min, max: q.max } : {}) }));
}
const IA_PERSO_SCHEMA = { type: 'object', required: ['reponses'], properties: { reponses: { type: 'array', maxItems: 40, items: { type: 'object', required: ['id'], properties: {
  id: { type: 'string', maxLength: 40 }, valeur: { type: ['string', 'number', 'boolean', 'array'], nullable: true, maxLength: 600, items: { type: 'string', maxLength: 60 } } } } } } };
function iaPersoPrompt(description) {
  const Q = iaPersoQuestions();
  const system = 'Tu aides une cave (vinification) à configurer l’application Œnotrack. D’après la description de l’exploitation, tu proposes des réponses aux questions de la configuration guidée. Réponds seulement aux questions dont la réponse se déduit clairement de la description ; n’invente rien. Pour un choix, donne l’identifiant du choix ; pour plusieurs choix, une liste d’identifiants ; oui / non : true ou false ; nombre : un nombre ; date : AAAA-MM-JJ ; liste : une ligne par élément.';
  const texte = `Description de l’exploitation : ${iarTxt(description, 2000)}\n\nQuestions (identifiant | type | question | choix possibles) :\n${Q.map((q) => `${q.id} | ${q.type} | ${q.texte}${q.choix ? ` | ${q.choix.map((o) => `${o.id} = ${o.label}`).join(' ; ')}` : ''}`).join('\n')}\n\nRéponds par : {"reponses": [{"id": "<identifiant>", "valeur": …}]}`;
  return { system, texte, schema: IA_PERSO_SCHEMA, nom: 'configuration', max: 1500 };
}
// réponses proposées → { reponses: { id: valeur }, refusees: [{ id, msg }] } ; chaque réponse contrôlée par persoValider (choix reconnus
// aussi d'après leur libellé, « oui » / « non », nombres écrits « 3,5 ») ; jamais le compte ni le choix de la base
function iaPersoReponses(valeur) {
  const out = {}; const refusees = [];
  ((valeur && valeur.reponses) || []).forEach((x) => {
    const q = persoQuestion(x && x.id); if (!q || IA_PERSO_EXCLUES.includes(q.id) || out[q.id] !== undefined) { if (x && x.id && !q) refusees.push({ id: String(x.id), msg: 'Question inconnue.' }); return; }
    let v = x.valeur; if (v == null || v === '') return; const O = persoOptions(q);
    const choixDe = (s) => { const t = norm(String(s)).trim(); const o = O.find((y) => y.id === s || norm(y.label).trim() === t); return o ? o.id : String(s); };
    if (q.type === 'oui_non' && typeof v === 'string') v = /^(oui|yes|vrai|true)$/i.test(v.trim()) ? true : /^(non|no|faux|false)$/i.test(v.trim()) ? false : v;
    if (q.type === 'nombre' && typeof v === 'string' && hasNum(v)) v = num(v);
    if (q.type === 'choix') v = choixDe(Array.isArray(v) ? v[0] : v);
    if (q.type === 'multi') v = uniq((Array.isArray(v) ? v : String(v).split(/[;,]/)).map((s) => choixDe(String(s).trim())).filter(Boolean));
    if (q.type === 'date') v = iarDateIa(v) || String(v);
    if (q.type === 'texte' || q.type === 'liste') v = Array.isArray(v) ? v.join('\n') : String(v);
    const m = persoValider(q, v); if (m) { refusees.push({ id: q.id, msg: m }); return; }
    out[q.id] = v;
  });
  return { reponses: out, refusees };
}

/* ================= IA21 — plan de nettoyage proposé ================= */
// ce qui part : types de contenants et catégories d'équipements présents (avec leur nombre), locaux et matériel à nettoyer, noms des produits d'hygiène
function iaNettoyageDonnees(db) {
  const cont = {}; (db.contenants || []).filter((c) => c && c.statut !== 'archive').forEach((c) => { cont[c.type] = (cont[c.type] || 0) + 1; });
  const types = (db.lists && db.lists.typesContenant) || []; const eq = {}; ((db.lists && db.lists.equipements) || []).forEach((e) => { const k = equipCategorie(e); eq[k] = (eq[k] || 0) + 1; });
  return { contenants: Object.keys(cont).map((id) => ({ id, label: (types.find((t) => t.id === id) || { label: id }).label, n: cont[id] })),
    equipements: Object.keys(eq).map((id) => ({ id, label: hygLib(EQUIP_CATEGORIES, id), n: eq[id] })), locaux: locauxDe(db).map((x) => ({ id: x.id, label: x.label })),
    produits: hygListe(db).filter((p) => p && !p.archive).map((p) => ({ nom: p.nom, type: p.type || '' })), actions: ((db.lists && db.lists.actionsHygiene) || []).map((a) => ({ id: a.id, label: a.label })) };
}
const IA_NETTOYAGE_SCHEMA = { type: 'object', required: ['lignes'], properties: { lignes: { type: 'array', maxItems: 30, items: { type: 'object', required: ['libelle', 'cible', 'action', 'quand'], properties: {
  zone: { type: 'string', nullable: true, maxLength: 20 }, libelle: { type: 'string', maxLength: 120 },
  cible: { type: 'object', required: ['type'], properties: { type: { type: 'string', maxLength: 20 }, formes: { type: 'array', nullable: true, maxItems: 10, items: { type: 'string', maxLength: 30 } }, categorie: { type: 'string', nullable: true, maxLength: 30 }, locaux: { type: 'array', nullable: true, maxItems: 10, items: { type: 'string', maxLength: 60 } } } },
  action: { type: 'string', maxLength: 30 }, quand: { type: 'array', maxItems: 6, items: { type: 'object', required: ['type'], properties: { type: { type: 'string', maxLength: 30 }, jours: { type: 'integer', nullable: true, minimum: 1, maximum: 365 }, texte: { type: 'string', nullable: true, maxLength: 200 } } } },
  produits: { type: 'array', nullable: true, maxItems: 4, items: { type: 'object', properties: { nom: { type: 'string', nullable: true, maxLength: 120 }, type: { type: 'string', nullable: true, maxLength: 30 }, conc: { type: 'number', nullable: true, minimum: 0, maximum: 100 }, concUnite: { type: 'string', nullable: true, maxLength: 10 } } } },
  mode: { type: 'string', nullable: true, maxLength: 600 }, contact: { type: 'string', nullable: true, maxLength: 60 }, controle: { type: 'string', nullable: true, maxLength: 20 }, attendu: { type: 'string', nullable: true, maxLength: 60 },
  responsable: { type: 'string', nullable: true, maxLength: 120 }, danger: { type: 'string', nullable: true, maxLength: 20 } } } } } };
function iaNettoyagePrompt(donnees) {
  const D = donnees || {};
  const system = 'Tu proposes à une cave (vinification) un plan de nettoyage et de désinfection selon la méthode HACCP : pour chaque type de contenant, d’équipement ou de local présent, ce qui se nettoie, quand, avec quel produit d’hygiène de la cave (ou un type de produit), le mode opératoire, le temps de contact, le contrôle après rinçage et le responsable. Ce sont des propositions génériques que la cave vérifiera : n’invente pas de concentration réglementaire ; reprends celles d’un usage courant ou laisse null. N’utilise que les identifiants fournis.';
  const texte = `Contenants (identifiant | type | nombre) : ${(D.contenants || []).map((x) => `${x.id} | ${x.label} | ${x.n}`).join(' ; ') || 'aucun'}\nÉquipements (catégorie | libellé | nombre) : ${(D.equipements || []).map((x) => `${x.id} | ${x.label} | ${x.n}`).join(' ; ') || 'aucun'}\nLocaux et matériel à nettoyer (identifiant | libellé) : ${(D.locaux || []).map((x) => `${x.id} | ${x.label}`).join(' ; ') || 'aucun'}\nProduits d’hygiène de la cave (nom | type) : ${(D.produits || []).map((x) => `${x.nom} | ${x.type || '—'}`).join(' ; ') || 'aucun'}\n\nZones : ${HYG_ZONES.map((z) => z[0]).join(', ')}\nActions : ${(D.actions || []).map((a) => `${a.id} = ${a.label}`).join(', ')}\nMoments (quand.type) : ${HYG_QUAND.map((q) => `${q[0]} = ${q[1]}`).join(' ; ')}\nTypes de produits : ${HYG_TYPES.map((x) => x[0]).join(', ')} ; unités de concentration : ${HYG_CONC.map((x) => x[0]).join(', ')}\nContrôles : ${HYG_CONTROLES.map((x) => x[0]).join(', ')} ; dangers : ${HYG_DANGERS.map((x) => x[0]).join(', ')}\nCible : {"type": "contenants", "formes": [identifiants de contenants]} | {"type": "equipements", "categorie": "<catégorie>"} | {"type": "locaux", "locaux": [identifiants]}\n\nRéponds par : {"lignes": [{"zone", "libelle", "cible", "action", "quand": [{"type", "jours", "texte"}], "produits": [{"nom" ou "type", "conc", "concUnite"}], "mode", "contact", "controle", "attendu", "responsable", "danger"}]}`;
  return { system, texte, schema: IA_NETTOYAGE_SCHEMA, nom: 'plan_nettoyage', max: 3500 };
}
// lignes proposées → spécifications de planEntreeSave, chacune contrôlée (ok, msg) sans toucher la base
function iaNettoyageLignes(db, valeur) {
  const eqs = (db.lists && db.lists.equipements) || []; const types = ((db.lists && db.lists.typesContenant) || []).map((t) => t.id);
  const essai = { lists: { actionsHygiene: (db.lists && db.lists.actionsHygiene) || [] }, planNettoyage: [] };
  return ((valeur && valeur.lignes) || []).map((x, i) => {
    const c = x.cible || {}; let cible = null;
    if (c.type === 'contenants') cible = { type: 'contenants', formes: uniq((c.formes || []).filter((f) => types.includes(f))) };
    else if (c.type === 'equipements') { const ids = eqs.filter((e) => equipCategorie(e) === c.categorie).map((e) => e.id); cible = { type: 'equipements', ids }; }
    else if (c.type === 'locaux') { const L = locauxDe(db); const ids = uniq((c.locaux || []).map((v) => { const l = L.find((y) => y.id === v || norm(y.label) === norm(v)); return l ? l.id : ''; }).filter(Boolean)); cible = { type: 'locaux', ids }; }
    const produits = (x.produits || []).map((p) => { const h = p.nom ? hygListe(db).find((y) => y && !y.archive && norm(y.nom).trim() === norm(p.nom).trim()) : null; const type = HYG_TYPES.some((t) => t[0] === p.type) ? p.type : '';
      if (!h && !type) return null; return { ...(h ? { produitId: h.id } : { type }), ...(hasNum(p.conc) ? { conc: num(p.conc), concUnite: HYG_CONC.some((u) => u[0] === p.concUnite) ? p.concUnite : '%' } : {}) }; }).filter(Boolean);
    const quand = (x.quand || []).filter((q) => q && HYG_QUAND.some((y) => y[0] === q.type)).map((q) => ({ type: q.type, ...(q.type === 'periodique' ? { jours: Math.max(1, Math.round(num(q.jours) || 7)) } : {}), ...(q.type === 'texte' ? { texte: iarTxt(q.texte, 200) } : {}) }));
    const spec = { zone: HYG_ZONES.some((z) => z[0] === x.zone) ? x.zone : 'autre', libelle: iarTxt(x.libelle, 120), cible, actionId: String(x.action || ''), quand, produits, mode: iarTxt(x.mode, 1200), contact: iarTxt(x.contact, 60),
      controle: HYG_CONTROLES.some((y) => y[0] === x.controle) ? x.controle : 'visuel', attendu: iarTxt(x.attendu, 60), responsable: iarTxt(x.responsable, 120), danger: HYG_DANGERS.some((y) => y[0] === x.danger) ? x.danger : 'biologique', enregistrer: true };
    const r = planEntreeSave(essai, spec); const vide = cible && !((cible.formes || []).length || (cible.ids || []).length);
    return { i, spec, ok: !!r.ok && !vide, msg: r.ok ? (vide ? 'Aucune cible de la cave ne correspond.' : '') : r.msg };
  });
}
// ajout des lignes cochées (après relecture) : chaque ligne garde la trace de l'IA et la mention « à vérifier »
function iaNettoyageAjouter(db, specs, trace) {
  const L = (specs || []).filter(Boolean); if (!L.length) return fail('Cochez au moins une ligne du plan.');
  const t = iaTraceNorm(trace); const ids = [];
  for (const s of L) { const r = planEntreeSave(db, s); if (!r.ok) return r; const x = db.planNettoyage.find((y) => y.id === r.id); if (x) { if (t) x.ia = t; x.aVerifier = true; } ids.push(r.id); }
  return okr({ n: ids.length, ids });
}
// ligne vérifiée par l'exploitation : la mention « à vérifier » disparaît (la trace de l'IA reste)
function iaNettoyageVerifie(db, id, uid) {
  const x = (db.planNettoyage || []).find((y) => y && y.id === id); if (!x) return fail('Ligne du plan introuvable.');
  delete x.aVerifier; x.verifiePar = uid || ''; x.verifieLe = todayISO(); return okr();
}
