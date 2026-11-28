/* ============ ASSISTANT IA AU CHAI (0.49.0-alpha.1) : saisie en langage courant, fiche papier relue, alerte de fermentation expliquée,
   recherche de traçabilité en langage courant, histoire d'un lot ============
   Audit IA validé par l'exploitation : IA01 (usage « saisie »), IA17 (« ficheRelue »), IA08 (« fermentation »), IA12 (« traceRecherche »),
   IA20 (« histoireLot »). Fonctions pures, testables en Node : consignes et schémas envoyés au service (iaUsage, 17a), lecture contrôlée
   des réponses, préremplissage des formulaires. S4 : l'IA ne fait que proposer — rien ici n'écrit dans la base.
   Minimisation (IA_USAGES[].envoie) :
   - saisie (niveau 2) : la phrase, les opérations du catalogue (nom, famille), les contenants (nom) et les produits en stock (nom, unité),
     désignés par des codes courts (O1, C1, P1) traduits sur l'appareil ; jamais un code de lot, un volume ni un partenaire ;
   - ficheRelue (niveau 2) : la photo et la structure de la fiche (lignes : opération, cuve, lot, valeurs prévues, cases à lire) ;
   - fermentation (niveau 2) : jours relatifs (J0, J+1…), densités, températures, intrants du lot (nom, dose, jour), seuils de l'alerte ;
     ni code de lot, ni nom de cuve, ni date du calendrier ;
   - traceRecherche (niveau 0) : la question et la liste des filtres possibles ; jamais les résultats ni un nom de la base ;
   - histoireLot (niveau 2) : la chaîne du lot sous des repères (L1, F1…) remplacés sur l'appareil par les vrais codes ; ni partenaire,
     ni nom de cuve, ni destinataire, ni désignation. */

/* ---------- commun ---------- */
const IA_CHAI_LANGUES = { fr: 'français', en: 'anglais', es: 'espagnol', it: 'italien', de: 'allemand', pt: 'portugais' };
const iaChaiLangue = (lg) => IA_CHAI_LANGUES[lg] || IA_CHAI_LANGUES.fr;
const iaChaiCourt = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n || 120);
// nombre écrit à la main ou dit : « 12,5 », « 1 012 », « 1.012 », 12.5 → nombre ; sinon null (jamais deviné)
function iaChaiNombre(x) {
  if (x == null || x === '') return null; if (typeof x === 'number') return Number.isFinite(x) ? x : null;
  const s = String(x).replace(/[\s  ]/g, '').replace(',', '.'); return /^-?\d+(?:\.\d+)?$/.test(s) ? Number(s) : null;
}
const iaChaiDec = (x) => (x == null || x === '' ? '' : String(x).replace('.', ','));
const iaChaiDensite = (v) => (v == null ? null : v > 100 ? v / 1000 : v); // 1012 (sans virgule) = 1,012
const iaChaiArrondi = (q, unite) => (q == null ? null : unite === 'kg' || unite === 'L' ? Math.round(q * 1000) / 1000 : q >= 10 ? Math.round(q) : Math.round(q * 10) / 10);
const iaChaiIso = (s) => (typeof s === 'string' && isoValide(s.trim()) ? s.trim() : '');
const iaChaiJours = (a, b) => Math.round((Date.parse(`${String(b).slice(0, 10)}T00:00:00Z`) - Date.parse(`${String(a).slice(0, 10)}T00:00:00Z`)) / 86400000);
const iaChaiCont = (db, id) => (db.contenants || []).find((c) => c && c.id === id) || null;
const iaChaiProd = (db, id) => (db.produits || []).find((p) => p && p.id === id) || null;
// lots fournisseurs d'un produit, le plus ancien à date de durabilité d'abord (comme le formulaire) ; le premier qui a du stock
function iaChaiArrivage(db, R, produitId) {
  const L = (db.arrivages || []).filter((a) => a && a.produitId === produitId).map((a) => ({ a, rest: arrivalRest(R, a) })).sort((x, y) => ((x.a.dluo || '9999') < (y.a.dluo || '9999') ? -1 : 1));
  const x = L.find((y) => y.rest > 1e-6) || L[0]; return x ? x.a.id : '';
}

/* ---------- IA01 : saisie dictée ou tapée en langage courant (usage « saisie », niveau 2) ---------- */
const IA_SAISIE_UNITES_DOSE = ['g/hL', 'mL/hL', 'g/L', 'mg/L', 'cL/hL'];
const IA_SAISIE_UNITES_QTE = ['g', 'kg', 'mL', 'cL', 'L', 'u'];
const IA_SAISIE_PORTION = ['debourbage', 'soutirage', 'transfert', 'intrant', 'suivi', 'sortie', 'froid', 'filtration', 'jaugeage'];
const IA_SAISIE_LIGNES = ['debourbage', 'soutirage', 'transfert', 'intrant', 'suivi', 'froid', 'filtration', 'assemblage'];
const IA_SAISIE_SCHEMA = {
  type: 'object', required: ['operation'], properties: {
    operation: { type: 'string', nullable: true, maxLength: 12 },
    autres: { type: 'array', maxItems: 6, items: { type: 'string', maxLength: 12 } },
    date: { type: 'string', nullable: true, maxLength: 10 },
    contenant: { type: 'string', nullable: true, maxLength: 12 },
    destination: { type: 'string', nullable: true, maxLength: 12 },
    sources: { type: 'array', maxItems: 12, items: { type: 'object', required: ['contenant'], properties: { contenant: { type: 'string', maxLength: 12 }, volumeL: { type: 'number', nullable: true, minimum: 0 } } } },
    volumeL: { type: 'number', nullable: true, minimum: 0 },
    produits: { type: 'array', maxItems: 8, items: { type: 'object', required: ['produit'], properties: { produit: { type: 'string', maxLength: 12 }, dose: { type: 'number', nullable: true, minimum: 0 }, uniteDose: { type: 'string', nullable: true, enum: IA_SAISIE_UNITES_DOSE }, quantite: { type: 'number', nullable: true, minimum: 0 }, unite: { type: 'string', nullable: true, enum: IA_SAISIE_UNITES_QTE } } } },
    densite: { type: 'number', nullable: true, minimum: 0 },
    temperature: { type: 'number', nullable: true, minimum: -20, maximum: 80 },
    notes: { type: 'string', nullable: true, maxLength: 300 },
    question: { type: 'string', nullable: true, maxLength: 300 },
  },
};
// listes envoyées (codes courts) : opIds = opérations proposées par le sélecteur (sinon : toutes les opérations visibles du catalogue)
function iaSaisieContexte(db, R, opIds) {
  const ops = (Array.isArray(opIds) && opIds.length ? opIds : opList(db).filter((x) => x && !x.masque && !x.interne && OP_LABELS0[x.base] !== undefined && x.base !== 'apport').map((x) => x.id)).map((id) => opDef(db, id)).filter(Boolean);
  const conts = (db.contenants || []).filter((c) => c && c.statut !== 'archive' && !c.archive);
  const prods = (db.produits || []).filter((p) => p && p.actif !== false && p.categorie !== 'sec' && (db.arrivages || []).some((a) => a && a.produitId === p.id && arrivalRest(R, a) > 1e-6));
  const codes = { ops: {}, conts: {}, prods: {} };
  ops.forEach((x, i) => { codes.ops[`O${i + 1}`] = x.id; }); conts.forEach((c, i) => { codes.conts[`C${i + 1}`] = c.id; }); prods.forEach((p, i) => { codes.prods[`P${i + 1}`] = p.id; });
  return { ops, conts, prods, codes };
}
function iaSaisiePrompt(db, R, phrase, o) {
  const opt = o || {}; const ctx = iaSaisieContexte(db, R, opt.opIds); const date = iaChaiIso(opt.date) || todayISO();
  const lo = ctx.ops.map((x, i) => `O${i + 1} | ${iaChaiCourt(x.label, 80)} | ${iaChaiCourt(x.groupe || '', 40)}`);
  const lc = ctx.conts.map((c, i) => `C${i + 1} | ${iaChaiCourt(c.nom, 60)}`);
  const lp = ctx.prods.map((p, i) => `P${i + 1} | ${iaChaiCourt(p.nom, 80)} | ${p.unite || ''}`);
  const system = 'Tu aides une cave (vinification, Champagne et autres régions) à saisir une opération de chai dite ou tapée en langage courant. Tu choisis l’opération dans le catalogue fourni, les contenants et les produits dans les listes fournies, toujours par leur code. Tu ne devines jamais : si l’opération n’est pas claire ou si plusieurs conviennent, mets la plus probable dans « operation » et les autres dans « autres » ; si aucune ne convient, operation = null et explique dans « question ». Ne mets un contenant ou un produit que s’il est nommé dans la phrase. Vocabulaire : moût, débourbage, bourbes, lies, soutirage, sulfitage, levurage, collage, vin clair, remontage, relevé de densité.';
  const texte = `Aujourd’hui : ${date}.\nPhrase : « ${iaChaiCourt(phrase, 600)} »\n\nOpérations (code | nom | famille) :\n${lo.join('\n') || '(aucune)'}\n\nContenants (code | nom) :\n${lc.join('\n') || '(aucun)'}\n\nProduits en stock (code | nom | unité) :\n${lp.join('\n') || '(aucun)'}\n\nRéponds par l’objet JSON demandé : operation (code), autres (codes des autres opérations possibles, si la phrase est ambiguë), date (AAAA-MM-JJ si une date, « hier », « lundi »… est dite, sinon null), contenant (contenant traité, ou de départ d’un soutirage ou d’un transfert), destination (contenant d’arrivée), sources (assemblage : contenants et volumes en litres), volumeL (volume dit, en litres : 1 hL = 100 L), produits (code, dose et uniteDose si une dose est dite, quantite et unite si une quantité est dite), densite, temperature (°C), notes (ce qui reste de la phrase), question (ce qu’il faudrait préciser).`;
  return { system, texte, schema: IA_SAISIE_SCHEMA, nom: 'saisie', codes: ctx.codes };
}
// réponse contrôlée → opération reconnue (type) ou liste de choix (jamais de supposition silencieuse)
function iaSaisieLire(codes, valeur) {
  const v = valeur || {}; const C = (codes && codes.ops) || {};
  const op = C[v.operation] || null; const autres = uniq((v.autres || []).map((k) => C[k]).filter((x) => x && x !== op));
  const choix = autres.length ? uniq([op, ...autres].filter(Boolean)) : [];
  return { type: autres.length ? null : op, choix, inconnue: !op && !autres.length, question: iaChaiCourt(v.question || '', 300), lu: v };
}
// quantité dans l'unité du produit, d'après une dose (par hL) et le volume, ou une quantité dite
function iaSaisieQuantite(pr, x, volL) {
  const u = pr.unite || ''; const masse = ['g', 'kg'].includes(u); const vol = ['mL', 'L'].includes(u);
  if (x.quantite != null && x.unite) {
    const q = num(x.quantite); const k = { g: 1, kg: 1000, mL: 1, cL: 10, L: 1000, u: 1 };
    if (x.unite === u) return { q };
    if (u !== 'u' && x.unite !== 'u' && ((masse && ['g', 'kg'].includes(x.unite)) || (vol && ['mL', 'cL', 'L'].includes(x.unite)))) return { q: iaChaiArrondi((q * k[x.unite]) / k[u], u) };
    return { erreur: 'unite' };
  }
  if (x.dose != null && x.uniteDose) {
    if (!(num(volL) > 0)) return { erreur: 'volume' };
    const d = num(x.dose); const parHL = x.uniteDose === 'g/L' ? d * 100 : x.uniteDose === 'mg/L' ? d / 10 : x.uniteDose === 'cL/hL' ? d * 10 : d;
    const dm = ['g/hL', 'g/L', 'mg/L'].includes(x.uniteDose);
    if ((dm && !masse) || (!dm && !vol)) return { erreur: 'unite' };
    return { q: iaChaiArrondi(qteDeDose(parHL, u, volL), u) };
  }
  return { q: null };
}
// préremplissage du formulaire de l'opération choisie (champs d'opInit) → { preset, notes: [texte] } ; R = état à la date de l'opération
function iaSaisiePreset(db, R, codes, lu, type, trace) {
  const v = lu || {}; const def = opDef(db, type); const base = def ? def.base : type; const P = {}; const notes = [];
  const cid = (k) => (codes && codes.conts && codes.conts[k]) || ''; const pid = (k) => (codes && codes.prods && codes.prods[k]) || '';
  const nomC = (id) => (iaChaiCont(db, id) || {}).nom || '';
  const portionDe = (id) => {
    if (!id) return null; const ps = contParts(R, id).filter((p) => p.vol > 0.5);
    if (ps.length === 1) return ps[0];
    notes.push(ps.length ? `La cuve « ${nomC(id)} » contient plusieurs lots : choisissez le lot dans le formulaire.` : `La cuve « ${nomC(id)} » est vide à cette date : choisissez le contenant dans le formulaire.`); return null;
  };
  const d = iaChaiIso(v.date); if (d) P.date = d; else if (v.date) notes.push(`Date « ${iaChaiCourt(v.date, 20)} » non reconnue : date du jour gardée.`);
  const c0 = cid(v.contenant); const dest = cid(v.destination); const vol = v.volumeL != null ? num(v.volumeL) : null;
  if (v.contenant && !c0) notes.push('Contenant non reconnu : choisissez-le dans le formulaire.');
  let p0 = null; if (IA_SAISIE_PORTION.includes(base) || base === 'etape') { p0 = portionDe(c0); if (p0 && base !== 'etape') P.portionId = p0.portionId; }
  if (base === 'etape' && p0) P.lotId = p0.lotId;
  if (['debourbage', 'soutirage', 'transfert'].includes(base)) { if (dest) P.destId = dest; if (vol != null) P.volL = String(Math.round(vol)); }
  if (base === 'sortie' && vol != null) P.volL = String(Math.round(vol));
  if (base === 'jaugeage' && vol != null) P.volMesure = String(Math.round(vol));
  if (base === 'suivi') { const de = iaChaiDensite(v.densite != null ? num(v.densite) : null); if (de != null) P.densite = iaChaiDec(de); if (v.temperature != null) P.tempC = iaChaiDec(num(v.temperature)); }
  let volRef = p0 ? p0.vol : 0;
  if (base === 'assemblage') {
    const S = (v.sources || []).map((s) => { const id = cid(s.contenant); const p = portionDe(id); return p ? { portionId: p.portionId, volL: s.volumeL != null ? String(Math.round(num(s.volumeL))) : '' } : null; }).filter(Boolean);
    if (S.length) P.sources = S.length > 1 ? S : [...S, { portionId: '', volL: '' }];
    if (dest) P.destId = dest; volRef = sum(S, (s) => s.volL);
  }
  if (IA_SAISIE_LIGNES.includes(base) && (v.produits || []).length) {
    const L = [];
    (v.produits || []).forEach((x) => {
      const id = pid(x.produit); const pr = id ? iaChaiProd(db, id) : null; if (!pr) { notes.push('Un produit n’a pas été reconnu dans vos produits en stock : ajoutez-le dans le formulaire.'); return; }
      const r = iaSaisieQuantite(pr, x, volRef);
      if (r.erreur === 'volume') notes.push(`« ${pr.nom} » : dose dite sans volume connu, indiquez la quantité.`);
      if (r.erreur === 'unite') notes.push(`« ${pr.nom} » : unité incompatible avec celle du produit (${pr.unite || '—'}), indiquez la quantité.`);
      L.push({ produitId: pr.id, arrivageId: iaChaiArrivage(db, R, pr.id), qty: r.q == null ? '' : String(r.q) });
    });
    if (L.length) P.lignes = L;
  } else if ((v.produits || []).length) notes.push('Les produits dits ne s’ajoutent pas à ce type d’opération : vérifiez le choix de l’opération.');
  if (v.notes) P.notes = iaChaiCourt(v.notes, 300);
  const t = iaTraceNorm(trace); if (t) P.ia = t;
  return { preset: P, notes: uniq(notes) };
}

/* ---------- IA17 : relire une fiche papier remplie au chai (usage « ficheRelue », niveau 2) ---------- */
// types relus champ par champ ; les autres (assemblage, pressurage, tirage…) : case « fait » seulement, puis ouverture du formulaire
const IA_FICHE_TYPES = ['intrant', 'suivi', 'froid', 'filtration', 'soutirage', 'transfert', 'debourbage', 'sortie', 'jaugeage', 'etape'];
const iaFicheHL = (L) => (hasNum(L) ? iaChaiDec(Math.round(num(L)) / 100) : '');
// structure de la fiche (sources d'une fiche imprimée : [{ kind: 'prev' | 'op', id }]) → { lignes, ignorees }
function iaFicheStructure(db, sources) {
  const Rs = {}; const RdDe = (date) => Rs[date] || (Rs[date] = getR(db, date));
  const lignes = []; const ignorees = []; const vues = new Set();
  (sources || []).forEach((s) => {
    if (!s || s.kind !== 'prev') { ignorees.push({ s, raison: 'validee' }); return; }
    const p = (db.previsions || []).find((x) => x && x.id === s.id); if (!p) { ignorees.push({ s, raison: 'absente' }); return; }
    if (p.statut !== 'prevue') { ignorees.push({ s, raison: p.statut || 'absente' }); return; }
    const f = p.f || {}; const Rd = RdDe(p.date); const type = p.type; const k = f.sousType || type;
    const por = Rd.portions[f.portionId] || null; const lotId = por ? por.lotId : f.lotId || '';
    const lot = lotId ? Rd.lots[lotId] || lotById(db, lotId) : null; if (por) vues.add(por.id);
    const cuve = por ? (iaChaiCont(db, por.contenantId) || {}).nom || '' : '';
    const champs = [];
    if (['intrant', 'suivi', 'froid', 'filtration', 'soutirage', 'transfert', 'debourbage'].includes(type)) (f.lignes || []).forEach((l, i) => { const pr = iaChaiProd(db, l.produitId); if (!pr) return; const a = (db.arrivages || []).find((x) => x.id === l.arrivageId);
      champs.push({ id: `qte${i}`, label: `Quantité de ${pr.nom}`, unite: pr.unite || '', prevu: iaChaiDec(l.qty), nombre: true }); champs.push({ id: `lot${i}`, label: `N° de lot de ${pr.nom}`, unite: '', prevu: a ? a.numLot || '' : '', nombre: false }); });
    if (type === 'suivi') { champs.unshift({ id: 'densite', label: 'Densité', unite: '', prevu: iaChaiDec(f.densite), nombre: true }, { id: 'temp', label: 'Température', unite: '°C', prevu: iaChaiDec(f.tempC), nombre: true }); }
    if (['soutirage', 'transfert', 'debourbage', 'sortie'].includes(type)) champs.unshift({ id: 'vol', label: type === 'debourbage' ? 'Clair soutiré' : type === 'sortie' ? 'Volume sorti' : 'Volume transféré', unite: 'hL', prevu: iaFicheHL(f.volL), nombre: true });
    if (['soutirage', 'debourbage'].includes(type) && (f.pertes || []).length) champs.push({ id: 'pertes', label: type === 'debourbage' ? 'Bourbes' : 'Lies, pertes', unite: 'hL', prevu: iaFicheHL(f.pertes[0].volL), nombre: true });
    if (type === 'jaugeage') champs.push({ id: 'volMesure', label: 'Volume relevé', unite: 'hL', prevu: iaFicheHL(f.volMesure), nombre: true });
    lignes.push({ n: lignes.length + 1, kind: 'prev', prevId: p.id, type, sousType: f.sousType || '', label: OP_LABELS[k] || OP_LABELS[type] || type, date: p.date, cuve, lot: lot ? lot.code || '' : '', portionId: por ? por.id : '', lotId, champs, formulaire: !IA_FICHE_TYPES.includes(type) });
  });
  // fiche de suivi des fermentations : les autres cuves en fermentation y sont imprimées (relevés à créer)
  const suivi = lignes.find((l) => l.type === 'suivi');
  if (suivi) {
    const Rd = RdDe(suivi.date);
    Object.values(Rd.portions).filter((p) => p.vol > 0 && !vues.has(p.id) && stadePhase(db, (Rd.lots[p.lotId] || {}).stade) === 'ferm')
      .map((p) => ({ p, nom: (iaChaiCont(db, p.contenantId) || {}).nom || '' })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr', { numeric: true }))
      .forEach(({ p, nom }) => lignes.push({ n: lignes.length + 1, kind: 'nouveau', prevId: '', type: 'suivi', sousType: '', label: OP_LABELS.suivi || 'suivi', date: suivi.date, cuve: nom, lot: (Rd.lots[p.lotId] || {}).code || '', portionId: p.id, lotId: p.lotId,
        champs: [{ id: 'densite', label: 'Densité', unite: '', prevu: '', nombre: true }, { id: 'temp', label: 'Température', unite: '°C', prevu: '', nombre: true }], formulaire: false }));
  }
  return { lignes, ignorees };
}
const IA_FICHE_SCHEMA = {
  type: 'object', required: ['lignes'], properties: {
    lignes: { type: 'array', maxItems: 120, items: { type: 'object', required: ['ligne'], properties: {
      ligne: { type: 'integer', minimum: 1 }, fait: { type: 'boolean', nullable: true },
      valeurs: { type: 'array', maxItems: 24, items: { type: 'object', required: ['champ'], properties: { champ: { type: 'string', maxLength: 20 }, valeur: { type: 'string', nullable: true, maxLength: 40 } } } },
      remarque: { type: 'string', nullable: true, maxLength: 200 } } } },
    illisible: { type: 'string', nullable: true, maxLength: 300 },
  },
};
// o = { titre, ordre, date, colonnes: [intitulés des colonnes du modèle] }
function iaFichePrompt(struct, o) {
  const opt = o || {};
  const system = 'Tu relis la photo d’une fiche d’enregistrement remplie à la main dans un chai (cave de vinification). Chaque ligne de la fiche correspond à une ligne de la structure fournie (même cuve, même lot, dans le même ordre). Tu lis seulement ce qui est écrit à la main : cases « relevé », « pesé », « utilisé », « prélevé », cases cochées, visas, remarques. Tu ne recopies jamais une valeur prévue imprimée en gris. Case vide ou illisible : valeur null. Ne devine jamais un chiffre.';
  const L = (struct.lignes || []).map((l) => `Ligne ${l.n} : ${l.label} · cuve ${l.cuve || '—'} · lot ${l.lot || '—'}${l.champs.some((c) => c.prevu) ? ` · prévu : ${l.champs.filter((c) => c.prevu).map((c) => `${c.label} ${c.prevu}${c.unite ? ` ${c.unite}` : ''}`).join(', ')}` : ''}\n  à lire : ${l.champs.length ? l.champs.map((c) => `${c.id} (${c.label}${c.unite ? `, en ${c.unite}` : ''})`).join(' ; ') : 'case « fait » seulement'}`);
  const texte = `Fiche : ${iaChaiCourt(opt.titre || 'Fiche d’enregistrement', 80)}${opt.ordre ? ` n° ${iaChaiCourt(opt.ordre, 30)}` : ''}${opt.date ? ` du ${opt.date}` : ''}.\n${(opt.colonnes || []).length ? `Colonnes du tableau : ${opt.colonnes.map((c) => iaChaiCourt(c, 40)).join(' | ')}\n` : ''}\nLignes à lire :\n${L.join('\n')}\n\nRéponds par l’objet JSON demandé : pour chaque ligne lue, son numéro (ligne), fait (true si la ligne est cochée, visée ou remplie ; false si elle est barrée ou marquée non faite ; null sinon), valeurs [{ champ (code « à lire »), valeur telle qu’écrite }] et remarque (texte écrit à la main sur la ligne). illisible : ce que tu n’as pas pu lire.`;
  return { system, texte, schema: IA_FICHE_SCHEMA, nom: 'fiche_relue' };
}
// réponse contrôlée → { [n]: { fait, valeurs: { champ: texte }, remarque, douteux: [champ] } } ; lignes et champs inconnus écartés
function iaFicheLire(struct, valeur) {
  const v = valeur || {}; const out = {}; let ecartes = 0;
  (v.lignes || []).forEach((x) => {
    const l = (struct.lignes || []).find((y) => y.n === x.ligne); if (!l) { ecartes += 1; return; }
    const vals = {}; const douteux = [];
    (x.valeurs || []).forEach((w) => { const c = l.champs.find((y) => y.id === w.champ); if (!c) { ecartes += 1; return; } if (w.valeur == null || String(w.valeur).trim() === '') return;
      const t = iaChaiCourt(w.valeur, 40); vals[c.id] = t; if (c.nombre && iaChaiNombre(t) == null) douteux.push(c.id); });
    out[l.n] = { fait: x.fait == null ? null : !!x.fait, valeurs: vals, remarque: iaChaiCourt(x.remarque || '', 200), douteux };
  });
  return { lignes: out, illisible: iaChaiCourt(v.illisible || '', 300), ecartes };
}
// valeurs relues (et corrigées) d'une ligne → formulaire de l'opération : f complet pour une prévision, champs à ajouter à opInit('suivi') sinon
function iaFicheForm(db, ligne, valeurs, remarque, trace) {
  const V = valeurs || {}; const avert = []; const t = iaTraceNorm(trace); const n = (k) => iaChaiNombre(V[k]);
  const hl = (k) => { const x = n(k); return x == null ? null : String(Math.round(x * 100)); };
  if (ligne.kind === 'nouveau') {
    const de = iaChaiDensite(n('densite')); const T = n('temp');
    return { patch: { date: ligne.date, portionId: ligne.portionId, ...(de != null ? { densite: iaChaiDec(de) } : {}), ...(T != null ? { tempC: iaChaiDec(T) } : {}), ...(remarque ? { notes: iaChaiCourt(remarque, 200) } : {}), ...(t ? { ia: t } : {}) }, vide: de == null && T == null, avert };
  }
  const p = (db.previsions || []).find((x) => x && x.id === ligne.prevId); if (!p) return { f: null, avert: ['Opération à réaliser introuvable.'], vide: true };
  const f = { ...clone(p.f || {}), date: p.date };
  if (Array.isArray(f.lignes)) f.lignes = f.lignes.map((l, i) => {
    const q = n(`qte${i}`); const lt = V[`lot${i}`]; const x = { ...l, ...(q != null ? { qty: String(q) } : {}) };
    if (lt) { const a = (db.arrivages || []).find((y) => y && y.produitId === l.produitId && norm(y.numLot).trim() === norm(lt).trim()); if (a) x.arrivageId = a.id; else avert.push(`N° de lot « ${lt} » inconnu pour ce produit : lot prévu gardé.`); }
    return x; });
  const de = iaChaiDensite(n('densite')); if (de != null) f.densite = iaChaiDec(de); const T = n('temp'); if (T != null) f.tempC = iaChaiDec(T);
  if (hl('vol') != null) f.volL = hl('vol'); if (hl('volMesure') != null) f.volMesure = hl('volMesure');
  if (hl('pertes') != null && Array.isArray(f.pertes) && f.pertes.length) f.pertes = f.pertes.map((x, i) => (i ? x : { ...x, volL: hl('pertes') }));
  if (remarque) f.notes = f.notes ? `${f.notes} · ${iaChaiCourt(remarque, 200)}` : iaChaiCourt(remarque, 200);
  if (t) f.ia = t;
  return { f, avert, vide: false };
}

/* ---------- IA08 : expliquer une alerte de fermentation (usage « fermentation », niveau 2) ---------- */
// données envoyées : jours relatifs, densité, température, intrants du lot (nom, dose, jour), seuils — ni code de lot ni nom de cuve
function iaFermentationDonnees(db, R, cible, aujourdhui) {
  const c = cible || {}; const auj = iaChaiIso(aujourdhui) || todayISO(); const reg = fermReglages(db);
  const al = fermentationAlerte(db, R, { contId: c.contId, lotId: c.lotId }, auj);
  const lots = c.lotId ? [c.lotId] : uniq(contParts(R, c.contId).map((p) => p.lotId)); const lid = al ? al.lotId : lots.find((id) => R.lots[id] && enFA(db, R.lots[id].stade)) || lots[0];
  if (!lid) return null;
  const pts = fermentationPoints(db, R, { lotIds: [lid], contId: c.lotId ? null : c.contId }); if (!pts.length) return null;
  const j0 = pts[0].date; const J = (d) => `J+${Math.max(0, iaChaiJours(j0, d))}`;
  const lot = R.lots[lid] || {};
  const intrants = ((R.apps || []).filter((a) => a && a.lotId === lid && a.produitId && a.kind !== 'prep')).map((a) => { const pr = iaChaiProd(db, a.produitId) || {}; return { jour: a.date >= j0 ? J(a.date) : `J-${iaChaiJours(a.date, j0)}`, nom: iaChaiCourt(pr.nom || '', 80), dose: a.dose != null ? `${fmt(a.dose, 1)} ${doseUnit(pr.unite)}` : `${fmt(a.qty, 2)} ${pr.unite || ''}`.trim() }; });
  return { lotId: lid, alerte: al, points: pts.map((p) => ({ jour: J(p.date), densite: p.densite, temp: p.temp })), intrants, reglages: { fin: reg.fin, lente: reg.lente, arret: reg.arret }, stade: stadeLabel(db, lot.stade), couleur: lot.couleur ? couleurLabel(db, lot.couleur) : '', aujourdhui: J(auj) };
}
const IA_FERMENTATION_SCHEMA = {
  type: 'object', required: ['resume', 'causes'], properties: {
    resume: { type: 'string', maxLength: 600 },
    causes: { type: 'array', maxItems: 6, items: { type: 'object', required: ['cause'], properties: { cause: { type: 'string', maxLength: 160 }, explication: { type: 'string', nullable: true, maxLength: 500 }, probabilite: { type: 'string', nullable: true, enum: ['forte', 'moyenne', 'faible'] } } } },
    verifications: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 300 } },
    actions: { type: 'array', maxItems: 8, items: { type: 'string', maxLength: 300 } },
  },
};
function iaFermentationPrompt(donnees, o) {
  const D = donnees; if (!D) return null; const lg = iaChaiLangue((o || {}).langue);
  const pts1000 = (v) => (v == null ? '—' : fmt(v * 1000, 2));
  const system = `Tu es un assistant d’œnologie pour une cave. On te donne la courbe d’une fermentation alcoolique qui ralentit ou s’arrête. Tu proposes des causes possibles, les vérifications à faire et les actions à envisager, prudemment, sans affirmer de diagnostic : l’œnologue de la cave décide. Réponds en ${lg}.`;
  const texte = `Vin : ${D.couleur || 'couleur non précisée'}, stade « ${D.stade} ». Aujourd’hui : ${D.aujourdhui}.\n${D.alerte ? `Alerte : fermentation ${D.alerte.etat === 'arretee' ? 'arrêtée ?' : 'lente'} — baisse de ${pts1000(D.alerte.vitesse)} point(s) de densité par jour sur ${D.alerte.jours} jour(s).\n` : ''}Seuils de la cave : fin de fermentation à densité ${fmt(D.reglages.fin, 3)} ; lente sous ${pts1000(D.reglages.lente)} point(s) par jour ; arrêtée sous ${pts1000(D.reglages.arret)}.\n\nRelevés (jour | densité | température °C) :\n${D.points.map((p) => `${p.jour} | ${p.densite != null ? fmt(p.densite, 3) : '—'} | ${p.temp != null ? fmt(p.temp, 1) : '—'}`).join('\n')}\n\nIntrants ajoutés au lot (jour | produit | dose) :\n${D.intrants.map((x) => `${x.jour} | ${x.nom} | ${x.dose}`).join('\n') || '(aucun)'}\n\nRéponds par l’objet JSON demandé : resume (deux phrases), causes [{ cause, explication, probabilite }], verifications (à faire au chai ou au laboratoire), actions (à envisager avec l’œnologue).`;
  return { system, texte, schema: IA_FERMENTATION_SCHEMA, nom: 'fermentation' };
}

/* ---------- IA12 : recherche de traçabilité en langage courant (usage « traceRecherche », niveau 0) ---------- */
const IA_RECHERCHE_FILTRES = ['tout', 'intrant', 'cru', 'parcelle', 'apporteur', 'echelle'];
const iaRechercheSchema = () => ({
  type: 'object', required: ['filtre'], properties: {
    filtre: { type: 'string', enum: IA_RECHERCHE_FILTRES }, texte: { type: 'string', nullable: true, maxLength: 80 }, nom: { type: 'string', nullable: true, maxLength: 80 },
    numLot: { type: 'string', nullable: true, maxLength: 40 }, echelle: { type: 'string', nullable: true, enum: ECHELLES.map((e) => e.id) }, explication: { type: 'string', nullable: true, maxLength: 200 },
  },
});
function iaRecherchePrompt(question, o) {
  const opt = o || {}; const auj = iaChaiIso(opt.aujourdhui) || todayISO();
  const system = 'Tu traduis une question de traçabilité posée par une cave (vinification) en filtres de recherche. Tu ne connais pas la base de la cave et tu n’en vois aucun résultat : tu choisis seulement le filtre et le texte à chercher ; la recherche se fait ensuite sur l’appareil.';
  const texte = `Aujourd’hui : ${auj}.\nQuestion : « ${iaChaiCourt(question, 400)} »\n\nFiltres possibles :\n- tout : recherche à n’importe quelle étape par un repère : n° de pesée (« pesée 12 »), n° de marc (« marc 3 »), code de lot, lot fini, nom de cuve, apporteur, cru, n° de bon ou de DAE, n° de lot d’un produit, ou une date (JJ/MM/AAAA) ;\n- intrant : rappel de lot d’un produit œnologique (nom du produit, et son n° de lot s’il est donné) ;\n- cru : un cru (village) ;\n- parcelle : une parcelle ;\n- apporteur : un partenaire (apporteur de raisins, vendeur de vins) ;\n- echelle : les lots d’un classement de l’échelle des crus (${ECHELLES.map((e) => `${e.id} = ${e.un || e.label}`).join(', ')}).\n\nRéponds par l’objet JSON demandé : filtre, texte (filtre « tout » : le repère à chercher ; une date au format JJ/MM/AAAA), nom (filtres intrant, cru, parcelle, apporteur : le nom tel qu’il est dit), numLot (intrant), echelle, explication (une phrase : ce que tu as compris).`;
  return { system, texte, schema: iaRechercheSchema(), nom: 'recherche_tracabilite' };
}
// nom dit → élément de la base, sur l'appareil : égalité, sinon un seul qui contient (ou est contenu) ; plusieurs → aucun (à choisir)
function iaRechercheTrouver(liste, nom) {
  const q = norm(nom).trim(); if (!q) return { id: '', n: 0 };
  const L = (liste || []).filter((x) => x && x.id && x.nom); const eg = L.filter((x) => norm(x.nom).trim() === q); if (eg.length === 1) return { id: eg[0].id, n: 1 };
  const c = L.filter((x) => { const n = norm(x.nom).trim(); return n.includes(q) || (n.length >= 3 && q.includes(n)); });
  return c.length === 1 ? { id: c[0].id, n: 1 } : { id: '', n: c.length };
}
function iaRechercheAppliquer(db, valeur) {
  const v = valeur || {}; const f = IA_RECHERCHE_FILTRES.includes(v.filtre) ? v.filtre : 'tout'; const r = { filtre: f, q: '', prod: '', arrs: [], cru: '', parc: '', app: '', ech: '', avert: [], explication: iaChaiCourt(v.explication || '', 200) };
  const plusieurs = { intrant: 'Plusieurs produits', cru: 'Plusieurs crus', parcelle: 'Plusieurs parcelles', apporteur: 'Plusieurs partenaires' };
  const aucun = { intrant: 'Aucun produit', cru: 'Aucun cru', parcelle: 'Aucune parcelle', apporteur: 'Aucun partenaire' };
  if (f === 'tout') { const t = iaChaiCourt(v.texte || v.nom || '', 80); const iso = iaChaiIso(t); r.q = iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : t; return r; }
  if (f === 'echelle') { r.ech = ECHELLES.some((e) => e.id === v.echelle) ? v.echelle : ''; if (!r.ech) r.avert.push('Classement non reconnu : choisissez-le.'); return r; }
  const L = f === 'intrant' ? (db.produits || []).filter((p) => (db.arrivages || []).some((a) => a && a.produitId === p.id)) : f === 'cru' ? db.crus || [] : f === 'parcelle' ? db.parcelles || [] : db.apporteurs || [];
  const x = iaRechercheTrouver(L, v.nom);
  if (!x.id) r.avert.push(x.n > 1 ? `${plusieurs[f]} correspondent à « ${iaChaiCourt(v.nom, 60)} » : choisissez dans la liste.` : `${aucun[f]} ne correspond à « ${iaChaiCourt(v.nom || '', 60)} » : choisissez dans la liste.`);
  if (f === 'intrant') { r.prod = x.id; if (x.id && v.numLot) { const a = (db.arrivages || []).filter((y) => y && y.produitId === x.id && norm(y.numLot).trim() === norm(v.numLot).trim()); if (a.length) r.arrs = a.map((y) => y.id); else r.avert.push(`N° de lot « ${iaChaiCourt(v.numLot, 40)} » inconnu pour ce produit : tous ses lots sont cherchés.`); } }
  if (f === 'cru') r.cru = x.id; if (f === 'parcelle') r.parc = x.id; if (f === 'apporteur') r.app = x.id;
  return r;
}

/* ---------- IA20 : histoire d'un lot rédigée (usage « histoireLot », niveau 2) ---------- */
// chaîne du lot en texte compact ; codes des lots et des lots finis remplacés par des repères (L1, F1…) → { texte, reperes }
function iaHistoireDonnees(db, R, lotId) {
  const ch = traceChaine(db, R, { type: 'lot', id: lotId }); const rep = {}; const parCode = {}; let nL = 0; let nF = 0;
  const repLot = (id) => { if (!id) return ''; if (parCode[`l:${id}`]) return parCode[`l:${id}`]; const l = lotById(db, id) || R.lots[id]; if (!l) return ''; nL += 1; const k = `L${nL}`; rep[k] = l.code || ''; parCode[`l:${id}`] = k; return k; };
  const repFini = (f) => { if (parCode[`f:${f.id}`]) return parCode[`f:${f.id}`]; nF += 1; const k = `F${nF}`; rep[k] = f.code || ''; parCode[`f:${f.id}`] = k; return k; };
  const lot = R.lots[lotId] || lotById(db, lotId) || {}; repLot(lotId);
  const part = (o, lab) => Object.keys(o || {}).filter((k) => k !== '?' && k !== 'inconnu' && o[k] >= 0.01).sort((a, b) => o[b] - o[a]).slice(0, 8).map((k) => `${lab(k)} ${Math.round(o[k] * 100)} %`).join(', ');
  let comp = null; try { comp = composition(db, R, lotId); } catch (e) { comp = null; }
  const L = [];
  L.push(`Lot étudié : L1 — ${LOT_TYPES[lot.type] || lot.type || 'lot'}, stade « ${stadeLabel(db, lot.stade)} »${lot.couleur ? `, ${couleurLabel(db, lot.couleur)}` : ''}${lot.millesime ? `, millésime ${millesimeAffiche(lot.millesime)}` : ''}${lot.qualif ? `, revendication ${qLabel(lot.qualif)}` : ''} ; en stock : ${fmtHL(R.lotVol[lotId] || 0)} hL${R.tir && R.tir[lotId] && R.tir[lotId].nb > 0 ? `, ${fmt(R.tir[lotId].nb)} bouteilles sur lattes` : ''}.`);
  if (comp) { const x = [part(comp.cepages, (k) => lbl(db, 'cepages', k)) && `cépages : ${part(comp.cepages, (k) => lbl(db, 'cepages', k))}`, part(comp.crus, (k) => cruName(db, k)) && `crus : ${part(comp.crus, (k) => cruName(db, k))}`, part(comp.millesimes, (k) => millesimeAffiche(k)) && `millésimes : ${part(comp.millesimes, (k) => millesimeAffiche(k))}`, part(comp.fractions, (k) => fracLabel(db, k)) && `fractions : ${part(comp.fractions, (k) => fracLabel(db, k))}`].filter(Boolean); if (x.length) L.push(`Composition : ${x.join(' ; ')}.`); }
  if (ch.pesees.length) { const d = ch.pesees.map((o) => o.date).sort(); L.push(`Raisins : ${ch.pesees.length} pesée(s), ${fmt(sum(ch.pesees, (o) => o.kg))} kg, du ${d[0]} au ${d[d.length - 1]}.`); }
  if (ch.press.length) L.push(`Pressurages : ${ch.press.length} marc(s), ${uniq(ch.press.map((o) => o.date)).sort().join(', ')}.`);
  if (ch.entrees.length) L.push(`Entrées de moûts : ${ch.entrees.length}, ${uniq(ch.entrees.map((o) => o.date)).sort().join(', ')}.`);
  const amontBase = uniq([...ch.amont, ...ch.base]);
  const opsIds = uniq(amontBase.flatMap((id) => (R.opsByLot || {})[id] || [])); const ops = opsIds.map((id) => (db.ops || []).find((o) => o && o.id === id)).filter((o) => o && o.type !== 'apport' && o.type !== 'note').sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : num(a.seq) - num(b.seq)));
  const lotsOp = (o) => uniq([...((R.pinfo || {})[o.portionId] ? [R.pinfo[o.portionId].lotId] : []), ...(o.sources || []).map((s) => s.lotId || ((R.pinfo || {})[s.portionId] || {}).lotId), o.lotId, ...(opCreates(o).lots || [])].filter((id) => id && amontBase.includes(id))).map(repLot).filter(Boolean);
  if (ops.length) {
    L.push('Opérations (date | opération | lots | volume | intrants) :');
    ops.slice(0, 120).forEach((o) => { const vol = hasNum(o.volL) ? num(o.volL) : (o.sources || []).length ? sum(o.sources, (s) => s.volL) : null;
      const ints = (R.apps || []).filter((a) => a && a.opId === o.id && a.produitId).map((a) => { const pr = iaChaiProd(db, a.produitId) || {}; return `${iaChaiCourt(pr.nom || '', 60)}${a.dose != null ? ` ${fmt(a.dose, 1)} ${doseUnit(pr.unite)}` : ''}`; });
      L.push(`${o.date} | ${OP_LABELS[o.sousType || o.type] || OP_LABELS[o.type] || o.type} | ${lotsOp(o).join(', ') || '—'} | ${vol ? `${fmtHL(vol)} hL` : '—'} | ${uniq(ints).join(', ') || '—'}`); });
    if (ops.length > 120) L.push(`… et ${ops.length - 120} autre(s) opération(s).`);
  }
  const aval = ch.aval.map((id) => lotById(db, id)).filter(Boolean);
  if (aval.length) L.push(`Lots issus de ce lot : ${aval.map((l) => `${repLot(l.id)} (${LOT_TYPES[l.type] || l.type || 'lot'}, ${l.date || '—'})`).join(', ')}.`);
  if (ch.finis.length) L.push(`Lots finis (dégorgés) : ${ch.finis.map((f) => `${repFini(f)} (${f.date || '—'}, ${fmt(f.nb)} bouteilles${hasNum(f.dosageGL) ? `, dosage ${fmt(f.dosageGL, 1)} g/L` : ''})`).join(', ')}.`);
  if (ch.sorties.length) L.push(`Sorties : ${ch.sorties.map((o) => `${o.date} ${hasNum(o.volL) ? `${fmtHL(o.volL)} hL` : ''}`.trim()).join(', ')}.`);
  return { texte: L.join('\n'), reperes: rep };
}
const IA_HISTOIRE_SCHEMA = { type: 'object', required: ['paragraphes'], properties: { titre: { type: 'string', nullable: true, maxLength: 120 }, paragraphes: { type: 'array', maxItems: 12, items: { type: 'string', maxLength: 1500 } } } };
function iaHistoirePrompt(donnees, o) {
  const lg = iaChaiLangue((o || {}).langue);
  const system = `Tu rédiges l’histoire d’un lot de vin pour la cave qui l’a élaboré (fiche de traçabilité lisible par un client, un auditeur ou l’équipe). Tu t’en tiens strictement aux faits fournis : parcours, intrants, dates, volumes ; tu n’inventes rien et tu n’ajoutes aucun jugement de qualité. Les lots sont désignés par des repères (L1, L2, F1…) : garde-les tels quels dans le texte. Réponds en ${lg}.`;
  const texte = `Chaîne de traçabilité du lot L1 :\n${donnees.texte}\n\nRéponds par l’objet JSON demandé : titre (court), paragraphes (de 3 à 8 paragraphes clairs, du raisin au lot actuel puis à ses suites).`;
  return { system, texte, schema: IA_HISTOIRE_SCHEMA, nom: 'histoire_lot' };
}
// repères remplacés par les vrais codes, sur l'appareil
function iaHistoireRendu(valeur, reperes) {
  const v = valeur || {}; const R0 = reperes || {}; const sub = (s) => String(s || '').replace(/\b([LF]\d{1,3})\b/g, (m) => (R0[m] ? R0[m] : m));
  return { titre: sub(iaChaiCourt(v.titre || '', 120)), paragraphes: (v.paragraphes || []).map((p) => sub(String(p || '').trim())).filter(Boolean) };
}
