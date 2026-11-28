/* ============ PRESSOIR (0.24.0-alpha.1) : registre des pesées, carnet de pressoir, contrôles, profil régional ============
   Règles vérifiées (recherche du 20/11/2026, sources primaires) — cahier des charges de l'AOC Champagne homologué par l'arrêté du
   31 juillet 2025 (vendanges 2025-2026) :
   - ch. II-1° : registre des pesées DISTINCT du carnet de pressoir ; mentions : date et heure de la pesée, poids constaté, revendications
     particulières (mention, lieu-dit…), nom de l'apporteur pour le pressurage à façon ; ticket reprenant ces indications remis à l'apporteur ;
   - ch. II-2° : carnet de pressoir obligatoire, rempli au fur et à mesure ; par marc : date et heure du début, poids par cépage, origine en cas
     de revendication particulière, apporteur, volumes de moûts obtenus, TAV en puissance, volumes de rebêches, bourbes (globalement en fin de
     débourbage) ;
   - VIII-5° : 102 litres de moûts débourbés pour 160 kg (un arrêté peut les réduire) ; rebêches : taux minimum fixé chaque année entre 0 et
     10 % (0 % en 2024 et 2025), distillerie avant le 15 décembre de l'année suivant la récolte ; bourbes : 1 à 4 %, éliminées avant le 31 janvier ;
   - tableau 1 : 6 marcs au plus par 24 h de fonctionnement et par pressoir ; moyennes 5 (agrément simple), 4 (qualitatif), 6 (24 h/24) ;
     pressoirs de 2 000 à 12 000 kg, chargés en une fois à leur capacité agréée (sous-chargement exceptionnel) ; pas de VCI en Champagne.
   Usages (non réglementaires : alertes seulement) : marc de 4 000 kg, 20,50 hl de cuvée et 5,00 hl de taille pour 4 000 kg.
   Pesée = opération « apport » portant pesee { num, heure, brutKg, tareKg, caisses, etat, mention, heureCueillette, balanceId, saisiLe, valide,
   tap, pourritureAcide } (0.25.0-alpha.1 : relevés à la réception, hors mentions du registre) ; formulaire de pesée personnalisable (14-formulaires.js,
   id 'pesee') : champs personnalisés dans op.champs ;
   marc = opération « pressurage » portant marc { num, heureDebut, heureFin, tavp, bourbesL, sousCharge, enCours, saisiLe, valide }.
   Journal (db.journalPressoir, ajout seul) : validations, corrections (motif, avant / après) et annulations (motif, copie) ; chaque ligne
   porte son empreinte SHA-256. Les pesées et marcs validés ne sont jamais modifiés ni supprimés sans motif. */

/* ---------- profil régional ---------- */
// settings.region : 'champagne' (spécificités champenoises) ou 'autre' (autres régions viticoles). Réglage de l'exploitation (base, synchronisé).
const REGIONS = [{ id: 'champagne', label: 'Champagne' }, { id: 'autre', label: 'Autre région viticole' }];
const regionDe = (db) => ((((db && db.settings) || {}).region) === 'autre' ? 'autre' : 'champagne');
const champenois = (db) => regionDe(db) === 'champagne';
// opts.crus : hors Champagne, masquer dans les listes de saisie les villages champenois d'origine jamais utilisés (repère masqueRegion :
// ils reviennent en repassant en Champagne ; rien n'est supprimé, les crus utilisés et personnalisés restent proposés)
function regionSet(db, region, opts) {
  if (!REGIONS.some((r) => r.id === region)) return fail('Région inconnue.');
  db.settings.region = region;
  const p = db.settings.pressoir || {};
  if (!p.profil || (region === 'autre' && p.profil === 'champagne') || (region === 'champagne' && p.profil !== 'champagne')) db.settings.pressoir = { ...p, profil: region === 'champagne' ? 'champagne' : 'libre', valeurs: {} };
  let n = 0;
  if (region === 'autre' && opts && opts.crus) (db.crus || []).forEach((c) => { if (!c.custom && !c.masque && !cruUsage(db, c.id)) { c.masque = true; c.masqueRegion = true; n += 1; } });
  if (region === 'champagne') (db.crus || []).forEach((c) => { if (c.masqueRegion) { c.masque = false; delete c.masqueRegion; n += 1; } });
  return okr({ crus: n });
}
const crusMasquesRegion = (db) => (db.crus || []).filter((c) => c.masqueRegion).length;

/* ---------- profils de pressurage (valeurs modifiables dans l'onglet Pressoir › Réglages) ---------- */
const PRESSOIR_PROFILS = {
  champagne: { nom: 'AOC Champagne', ratioKg: 160, ratioL: 102, volume: 'moûts débourbés', marcKg: 4000, cuveeL: 2050, tailleL: 500,
    rebechesPct: { 2024: 0, 2025: 0 }, rebechesDefaut: 0, rebechesMax: 10, bourbesMin: 1, bourbesMax: 4, cadenceMax: 6,
    moyennes: { simple: 5, qualitatif: 4, h24: 6 }, capaciteMin: 2000, capaciteMax: 12000, chargementPlein: true, registre: true,
    rebechesLimite: '12-15', bourbesLimite: '01-31', tavpMin: 8.5, saisieDiffereeMin: 60 },
  cremant: { nom: 'Crémant (Alsace, Bourgogne, Loire, Die…)', ratioKg: 150, ratioL: 100, volume: 'moûts', marcKg: 0, cuveeL: 0, tailleL: 0,
    rebechesPct: {}, rebechesDefaut: 0, rebechesMax: 10, bourbesMin: 0, bourbesMax: 0, cadenceMax: 0, moyennes: null, capaciteMin: 0, capaciteMax: 0,
    chargementPlein: false, registre: false, rebechesLimite: '', bourbesLimite: '', tavpMin: 0, saisieDiffereeMin: 0 },
  libre: { nom: 'Sans plafond (autres vins)', ratioKg: 0, ratioL: 0, volume: 'moûts', marcKg: 0, cuveeL: 0, tailleL: 0, rebechesPct: {}, rebechesDefaut: 0,
    rebechesMax: 0, bourbesMin: 0, bourbesMax: 0, cadenceMax: 0, moyennes: null, capaciteMin: 0, capaciteMax: 0, chargementPlein: false, registre: false,
    rebechesLimite: '', bourbesLimite: '', tavpMin: 0, saisieDiffereeMin: 0 },
};
const PRESSOIR_CHAMPS = ['ratioKg', 'ratioL', 'marcKg', 'cuveeL', 'tailleL', 'rebechesDefaut', 'bourbesMin', 'bourbesMax', 'cadenceMax', 'capaciteMin', 'capaciteMax', 'tavpMin', 'saisieDiffereeMin'];
// réglages : settings.pressoir = { profil, valeurs: { champ: nombre }, rebechesPct: { année: % }, registre, chargementPlein, dates: { année: { finPressurage, remiseCarnets } } }
function pressoirParams(db) {
  const s = ((db && db.settings) || {}).pressoir || {};
  const id = PRESSOIR_PROFILS[s.profil] ? s.profil : (champenois(db) ? 'champagne' : 'libre');
  const b = PRESSOIR_PROFILS[id]; const v = s.valeurs || {}; const p = { ...b, id };
  PRESSOIR_CHAMPS.forEach((k) => { if (hasNum(v[k])) p[k] = num(v[k]); });
  p.rebechesPct = { ...b.rebechesPct, ...(s.rebechesPct || {}) };
  if (typeof s.registre === 'boolean') p.registre = s.registre;
  if (typeof s.chargementPlein === 'boolean') p.chargementPlein = s.chargementPlein;
  p.dates = s.dates || {};
  return p;
}
function pressoirParamsSet(db, patch) {
  const s = { ...(db.settings.pressoir || {}) };
  if (patch.profil !== undefined) { if (!PRESSOIR_PROFILS[patch.profil]) return fail('Profil de pressurage inconnu.'); s.profil = patch.profil; s.valeurs = {}; }
  if (patch.valeurs) {
    const v = { ...(s.valeurs || {}) };
    for (const k of Object.keys(patch.valeurs)) { if (!PRESSOIR_CHAMPS.includes(k)) continue; const x = patch.valeurs[k]; if (x === '' || x === null) delete v[k]; else if (!hasNum(x) || num(x) < 0) return fail('Valeur invalide : nombre positif attendu.'); else v[k] = num(x); }
    s.valeurs = v;
  }
  if (patch.rebechesPct) { const r = { ...(s.rebechesPct || {}) }; for (const a of Object.keys(patch.rebechesPct)) { const x = patch.rebechesPct[a]; if (!/^\d{4}$/.test(a)) continue; if (x === '' || x === null) delete r[a]; else if (!hasNum(x) || num(x) < 0 || num(x) > 10) return fail('Taux de rebêches : entre 0 et 10 %.'); else r[a] = num(x); } s.rebechesPct = r; }
  if (patch.dates) { const d = { ...(s.dates || {}) }; for (const a of Object.keys(patch.dates)) { if (!/^\d{4}$/.test(a)) continue; const x = { ...(d[a] || {}), ...patch.dates[a] }; Object.keys(x).forEach((k) => { if (!x[k]) delete x[k]; else if (!isoOK(x[k])) delete x[k]; }); if (Object.keys(x).length) d[a] = x; else delete d[a]; } s.dates = d; }
  ['registre', 'chargementPlein'].forEach((k) => { if (typeof patch[k] === 'boolean') s[k] = patch[k]; });
  db.settings.pressoir = s; return okr();
}
const rebechesTaux = (p, annee) => (hasNum((p.rebechesPct || {})[annee]) ? num(p.rebechesPct[annee]) : num(p.rebechesDefaut));
// date limite « MM-JJ » de l'année suivant la récolte → ISO
const limiteApres = (mmjj, annee) => (/^\d{2}-\d{2}$/.test(String(mmjj || '')) ? `${annee + 1}-${mmjj}` : '');

/* ---------- pressoirs et balances : équipements (Paramètres › Listes › Équipements) ---------- */
const capaciteDeLibelle = (s) => { const m = /(\d[\d\s  .]*)\s*kg/i.exec(String(s || '')); return m ? num(m[1].replace(/[\s  .]/g, '')) : 0; };
const estPressoir = (e) => !!(e && (e.pressoir || e.id === 'pressoir' || /^pressoir/i.test(String(e.label || '').trim())));
const estBalance = (e) => !!(e && (e.balance || /^(balance|bascule|pont[- ]bascule)/i.test(norm(e.label).trim())));
const equipementsDe = (db) => ((db && db.lists && db.lists.equipements) || []);
const pressoirsDe = (db) => equipementsDe(db).filter(estPressoir).map((e) => { const p = e.pressoir || {}; return { id: e.id, nom: e.label, capaciteKg: num(p.capaciteKg) || capaciteDeLibelle(e.label), agrement: p.agrement === 'simple' ? 'simple' : 'qualitatif', h24: !!p.h24 }; });
const balancesDe = (db) => equipementsDe(db).filter(estBalance).map((e) => ({ id: e.id, nom: e.label, valideJusquau: (e.balance || {}).valideJusquau || '', ref: (e.balance || {}).ref || '' }));
const pressoirDe = (db, id) => pressoirsDe(db).find((p) => p.id === id) || null;
function equipementPressoirSet(db, id, patch) {
  const L = db.lists.equipements || []; const i = L.findIndex((e) => e.id === id); if (i < 0) return fail('Équipement introuvable.');
  const e = { ...L[i] }; const p = pressoirParams(db);
  if (patch.pressoir) {
    const x = { ...(e.pressoir || {}), ...patch.pressoir };
    if (x.capaciteKg !== undefined) { if (!(num(x.capaciteKg) > 0)) return fail('Indiquez la capacité agréée du pressoir (kg).'); if (p.capaciteMin && num(x.capaciteKg) < p.capaciteMin) return fail(`Capacité inférieure au minimum du profil (${fmt(p.capaciteMin)} kg).`); if (p.capaciteMax && num(x.capaciteKg) > p.capaciteMax) return fail(`Capacité supérieure au maximum du profil (${fmt(p.capaciteMax)} kg).`); x.capaciteKg = num(x.capaciteKg); }
    if (x.agrement !== undefined && !['simple', 'qualitatif'].includes(x.agrement)) return fail('Agrément : simple ou qualitatif.');
    x.h24 = !!x.h24; e.pressoir = x;
  }
  if (patch.balance) { const x = { ...(e.balance || {}), ...patch.balance }; if (x.valideJusquau && !isoOK(x.valideJusquau)) return fail('Date de validité de la vignette invalide.'); if (!x.valideJusquau) delete x.valideJusquau; x.ref = String(x.ref || '').trim(); e.balance = x; }
  L[i] = e; return okr();
}
function equipementAjouter(db, label, sorte) {
  const nom = String(label || '').trim(); if (!nom) return fail('Indiquez le nom de l’équipement.');
  if (!Array.isArray(db.lists.equipements)) db.lists.equipements = [];
  const id = nid(db, sorte === 'balance' ? 'bal' : 'prs');
  db.lists.equipements.push(sorte === 'balance' ? { id, label: nom, balance: {} } : { id, label: nom, pressoir: { capaciteKg: capaciteDeLibelle(nom) || 4000, agrement: 'qualitatif', h24: false } });
  return okr({ id });
}

/* ---------- pesées et marcs (opérations) ---------- */
const codeLotPris = (db, code, sauf) => (db.lots || []).some((l) => norm(l.code).trim() === norm(code).trim() && !(sauf || []).includes(l.id));
// qui a fait la saisie (liste des opérateurs) : obligatoire pour une nouvelle saisie si le réglage est activé
function quiSaisit(db, ids, nouveau) { const qui = operateursValides(db, ids); if (!qui.length && nouveau && (db.settings || {}).operateurObligatoire) return { msg: 'Indiquez qui a réalisé l’opération (opérateur).' }; return { qui }; }
const estPesee = (o) => !!(o && o.type === 'apport' && o.pesee);
const estMarc = (o) => !!(o && o.type === 'pressurage' && o.marc);
const heureOK = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const heureNow = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const instantDe = (date, heure) => (isoOK(date) ? new Date(`${date}T${heureOK(heure) ? heure : '00:00'}:00`).getTime() : NaN);
// numéros des pesées et des marcs : suite continue par année (annulés compris, gardés au journal)
function numerosPris(db, objet, annee, sauf) {
  const t = objet === 'pesee' ? 'apport' : 'pressurage'; const n = [];
  (db.ops || []).forEach((o) => { const x = o[objet]; if (o.type === t && o.id !== sauf && x && num(x.num) > 0 && yearOf(o.date) === annee) n.push(num(x.num)); });
  (db.journalPressoir || []).forEach((j) => { if (j.objet === objet && j.action === 'annulation' && num(j.annee) === annee && num(j.num) > 0) n.push(num(j.num)); });
  return n;
}
const numeroSuivant = (db, objet, annee) => Math.max(0, ...numerosPris(db, objet, annee)) + 1;
// ce qui compte pour le registre (une différence = correction)
const PESEE_CLES = ['date', 'kg', 'cepageId', 'qualifId', 'apporteurId', 'cruId', 'parcelleId', 'ref'];
const PESEE_SOUS = ['num', 'heure', 'brutKg', 'tareKg', 'caisses', 'etat', 'mention', 'heureCueillette', 'balanceId'];
const MARC_SOUS = ['num', 'heureDebut', 'heureFin', 'tavp', 'bourbesL', 'sousCharge'];
function resumeRegistre(o) {
  if (!o) return null;
  if (o.type === 'apport') { const r = {}; PESEE_CLES.forEach((k) => { if (o[k] !== undefined && o[k] !== '') r[k] = o[k]; }); const p = o.pesee || {}; PESEE_SOUS.forEach((k) => { if (p[k] !== undefined && p[k] !== '') r[k] = p[k]; }); return r; }
  if (o.type === 'pressurage') { const m = o.marc || {}; const r = { date: o.date, equipementId: o.equipementId || '', charges: (o.charges || []).map((c) => ({ apportId: c.apportId, kg: num(c.kg) })), fractions: (o.fractions || []).map((f) => ({ fractionId: f.fractionId, volL: num(f.volL), contenantId: f.contenantId || '' })) }; MARC_SOUS.forEach((k) => { if (m[k] !== undefined && m[k] !== '') r[k] = m[k]; }); return r; }
  return null;
}
const sha256Hex = (s) => Array.from(sha256(new TextEncoder().encode(String(s)))).map((b) => b.toString(16).padStart(2, '0')).join('');
const journalEmpreinte = (j) => { const { h, ...x } = j; return sha256Hex(JSON.stringify(x)).slice(0, 32); };
function journalAjouter(db, e) {
  if (!Array.isArray(db.journalPressoir)) db.journalPressoir = [];
  const x = { id: nid(db, 'jp'), quand: e.quand || new Date().toISOString(), objet: e.objet, opId: e.opId, num: e.num || null, annee: e.annee || null, action: e.action, motif: String(e.motif || '').trim(), par: e.par || '', avant: e.avant === undefined ? null : e.avant, apres: e.apres === undefined ? null : e.apres };
  x.h = journalEmpreinte(x); db.journalPressoir.push(x); return x;
}
// lignes du journal dont le contenu ne correspond plus à leur empreinte (modifiées hors de l'application)
const journalAlteres = (db) => (db.journalPressoir || []).filter((j) => !j || j.h !== journalEmpreinte(j));
const journalTrie = (db) => [...(db.journalPressoir || [])].filter(Boolean).sort((a, b) => (String(a.quand) < String(b.quand) ? -1 : String(a.quand) > String(b.quand) ? 1 : 0));
// pesées et marcs validés dont le contenu diffère de leur dernière validation ou correction au journal
// (modifiés par une version antérieure d'Œnotrack, ou à la main dans un fichier) : à vérifier
function registreEcarts(db) {
  const der = {}; journalTrie(db).forEach((j) => { if (j.opId && (j.action === 'validation' || j.action === 'correction')) der[j.opId] = j; });
  return (db.ops || []).filter((o) => (estPesee(o) && o.pesee.valide) || (estMarc(o) && o.marc.valide)).filter((o) => der[o.id] && JSON.stringify(der[o.id].apres) !== JSON.stringify(resumeRegistre(o))).map((o) => ({ op: o, j: der[o.id] }));
}
// n° en double (saisies faites en même temps sur deux appareils, puis réunies par la synchronisation)
function registreDoublons(db, objet, annee) {
  const t = objet === 'pesee' ? 'apport' : 'pressurage'; const m = {};
  (db.ops || []).forEach((o) => { if (o.type === t && o[objet] && num(o[objet].num) > 0 && yearOf(o.date) === annee) (m[o[objet].num] || (m[o[objet].num] = [])).push(o); });
  return Object.keys(m).filter((k) => m[k].length > 1).map((k) => ({ num: num(k), ops: m[k] }));
}
// appelé par opSave : numéros, marques de saisie, motif obligatoire et journal pour les pesées et marcs validés
// opts : { motif, par, maintenant (ISO, saisie depuis l'onglet Pressoir), apercu (aperçu du formulaire : rien d'obligatoire) }
function registreAvantEnregistrer(db, old, op, opts) {
  opts = opts || {};
  if (op.type !== 'apport' && op.type !== 'pressurage') return okr();
  const objet = op.type === 'apport' ? 'pesee' : 'marc';
  if (old && old[objet] && !op[objet]) op[objet] = clone(old[objet]); // formulaire des opérations : les données du registre sont gardées
  const p = pressoirParams(db);
  if (!op[objet] && !old && p.registre) op[objet] = {}; // profil réglementaire : toute nouvelle pesée, tout nouveau marc entre au registre
  if (!op[objet]) return okr();
  const x = op[objet]; const annee = yearOf(op.date);
  if (!(num(x.num) > 0) || (old && yearOf(old.date) !== annee)) x.num = numeroSuivant(db, objet, annee);
  else if (numerosPris(db, objet, annee, op.id).includes(num(x.num))) x.num = numeroSuivant(db, objet, annee); // n° déjà pris (copie d'un autre appareil)
  if (!old && opts.maintenant && !x.saisiLe) x.saisiLe = opts.maintenant;
  // pesée : poids net changé directement (formulaire des opérations) → brut et tare retirés (ils ne correspondent plus)
  if (objet === 'pesee' && hasNum(x.brutKg) && hasNum(x.tareKg) && Math.abs(r2(num(x.brutKg) - num(x.tareKg)) - num(op.kg)) > 0.01) { delete x.brutKg; delete x.tareKg; }
  if (objet === 'marc') x.enCours = !x.valide && !(op.fractions || []).some((f) => num(f.volL) > 0); // en cours tant que les volumes manquent
  const valide = old && old[objet] && old[objet].valide;
  if (valide) {
    x.valide = old[objet].valide; // la validation ne se retire pas
    const a = resumeRegistre(old); const b = resumeRegistre(op);
    if (JSON.stringify(a) !== JSON.stringify(b) && !opts.apercu) {
      if (!String(opts.motif || '').trim()) return fail(`${objet === 'pesee' ? 'Pesée' : 'Marc'} n° ${old[objet].num} validé${objet === 'pesee' ? 'e' : ''} : indiquez le motif de la correction (elle est gardée au journal du pressoir).`, { champ: 'motif' });
      journalAjouter(db, { quand: opts.maintenant, objet, opId: op.id, num: x.num, annee, action: 'correction', motif: opts.motif, par: opts.par, avant: a, apres: b });
    }
  }
  return okr();
}
// appelé par opDelete
function registreAvantSupprimer(db, op, opts) {
  opts = opts || {};
  if (!(estPesee(op) || estMarc(op))) return okr();
  const objet = op.type === 'apport' ? 'pesee' : 'marc'; const x = op[objet];
  if (x.valide && !String(opts.motif || '').trim()) return fail(`${objet === 'pesee' ? 'Pesée' : 'Marc'} n° ${x.num} validé${objet === 'pesee' ? 'e' : ''} : annulez-l${objet === 'pesee' ? 'a' : 'e'} depuis l’onglet Pressoir, avec le motif de l’annulation (gardé au journal).`);
  if (num(x.num) > 0) journalAjouter(db, { quand: opts.maintenant, objet, opId: op.id, num: x.num, annee: yearOf(op.date), action: 'annulation', motif: opts.motif || 'Saisie non validée supprimée', par: opts.par, avant: resumeRegistre(op) });
  return okr();
}

/* ---------- pesée : saisie depuis l'onglet Pressoir ---------- */
// f : { date, heure, apporteurId, cruId, parcelleId, cepageId, qualifId, mention, brutKg, tareKg, kg, caisses, etat, pourritureAcide, tap,
//       heureCueillette, balanceId, ref, notes, operateurs, champs (champs personnalisés du formulaire de pesée : { id: valeur }) }
const ETATS_SANITAIRES = [{ id: 'sain', label: 'Sain' }, { id: 'faible', label: 'Faiblement altéré' }, { id: 'altere', label: 'Altéré' }];
// ce que le formulaire de pesée saisit dans pesee (le reste : n°, saisie, validation, champs d'une version plus récente, est gardé)
const PESEE_SAISIE = ['heure', 'brutKg', 'tareKg', 'caisses', 'etat', 'mention', 'heureCueillette', 'balanceId', 'tap', 'pourritureAcide'];
// relevés de réception (hors registre : leur correction ne demande pas de motif)
const tapOK = (x) => hasNum(x) && num(x) > 0 && num(x) <= 20;
const pourritureOK = (x) => hasNum(x) && num(x) >= 0 && num(x) <= 100;
function peseeSpec(db, f) {
  if (!isoOK(f.date)) return fail('Date de la pesée invalide.', { champ: 'date' });
  if (!heureOK(f.heure)) return fail('Indiquez l’heure de la pesée (hh:mm).', { champ: 'heure' });
  const brut = hasNum(f.brutKg) ? num(f.brutKg) : null; const tare = hasNum(f.tareKg) ? num(f.tareKg) : null;
  let net = hasNum(f.kg) ? num(f.kg) : null;
  if (brut !== null && tare !== null) { if (tare >= brut) return fail('La tare doit être inférieure au poids brut.', { champ: 'tareKg' }); net = r2(brut - tare); }
  if (!(net > 0)) return fail('Indiquez le poids net de raisin (kg), ou le poids brut et la tare.', { champ: 'kg' });
  if (!f.cepageId) return fail('Choisissez le cépage.', { champ: 'cepageId' });
  if (f.heureCueillette && !heureOK(f.heureCueillette)) return fail('Heure de cueillette invalide (hh:mm).', { champ: 'heureCueillette' });
  if (f.etat && !ETATS_SANITAIRES.some((e) => e.id === f.etat)) return fail('État sanitaire inconnu.', { champ: 'etat' });
  const rempli = (x) => x !== undefined && x !== null && String(x).trim() !== '';
  // état « Sain » : la pourriture acide est sans objet (champ masqué, valeur non gardée), sauf si le formulaire la propose toujours
  const pa = rempli(f.pourritureAcide) && !(etatSain(f) && champSiAltere(formulaireDe(db, 'pesee'), 'pourritureAcide'));
  if (rempli(f.tap) && !tapOK(f.tap)) return fail('TAP invalide : titre alcoométrique volumique en puissance entre 0 et 20 % vol.', { champ: 'tap' });
  if (pa && !pourritureOK(f.pourritureAcide)) return fail('Pourriture acide : pourcentage entre 0 et 100.', { champ: 'pourritureAcide' });
  const pesee = { heure: f.heure };
  if (rempli(f.tap)) pesee.tap = Math.round(num(f.tap) * 100) / 100; if (pa) pesee.pourritureAcide = Math.round(num(f.pourritureAcide) * 10) / 10;
  if (brut !== null) pesee.brutKg = brut; if (tare !== null) pesee.tareKg = tare;
  if (hasNum(f.caisses) && num(f.caisses) > 0) pesee.caisses = Math.round(num(f.caisses));
  if (f.etat) pesee.etat = f.etat; if (String(f.mention || '').trim()) pesee.mention = String(f.mention).trim();
  if (f.heureCueillette) pesee.heureCueillette = f.heureCueillette; if (f.balanceId) pesee.balanceId = f.balanceId;
  const q = quiSaisit(db, f.operateurs, !f.id); if (q.msg) return fail(q.msg, { champ: 'operateurs' });
  return okr({ spec: { type: 'apport', date: f.date, notes: String(f.notes || ''), ...(q.qui.length ? { operateurs: q.qui } : {}), cepageId: f.cepageId, kg: net, qualifId: f.qualifId || 'conv', apporteurId: f.apporteurId || '', cruId: f.cruId || '', parcelleId: f.parcelleId || '', ref: String(f.ref || '').trim(), pesee } });
}
function peseeSave(db, f, id, ctx) {
  ctx = ctx || {}; const r = peseeSpec(db, f); if (!r.ok) return r;
  const old = id ? db.ops.find((o) => o.id === id) : null; if (id && !old) return fail('Pesée introuvable.');
  // formulaire de pesée personnalisé : champs rendus obligatoires (nouvelle pesée), champs personnalisés
  const pb = champsErreurDetail(db, 'pesee', 'pesee', { ...f, kg: r.spec.kg }, { nouveau: !old }); if (pb) return fail(pb.msg, { champ: pb.champ }); // champ en cause (0.48.0-alpha.1)
  const spec = r.spec;
  // n°, saisie, validation (et ce qu'une version plus récente aurait ajouté) gardés ; ce que le formulaire saisit suit le formulaire
  if (old && old.pesee) { const garde = {}; Object.keys(old.pesee).forEach((k) => { if (!PESEE_SAISIE.includes(k)) garde[k] = old.pesee[k]; }); spec.pesee = { ...garde, ...spec.pesee }; }
  // relevés personnalisés ; pesée « Sain » : ceux de pourriture (condition « si altéré ») sont retirés, même déjà enregistrés
  const cfgP = formulaireDe(db, 'pesee'); const exclus = etatSain(f) ? cfgP.perso.filter(persoSiAltere).map((d) => d.id) : [];
  const anciens = old && Array.isArray(old.champs) ? old.champs.filter((c) => !(c && exclus.includes(c.id))) : null;
  if (f.champs && typeof f.champs === 'object') { const ch = champsValeurs(cfgP.perso.filter((d) => !exclus.includes(d.id)), f.champs, formuleVarsStd('pesee', { ...f, kg: spec.kg }), anciens); if (ch.length || anciens) spec.champs = ch; }
  else if (anciens && anciens.length !== old.champs.length) spec.champs = anciens;
  ['champs', 'jauges', 'sousType'].forEach((k) => { if (old && old[k] !== undefined && spec[k] === undefined) spec[k] = old[k]; });
  const s = opSave(db, spec, id || null, { motif: ctx.motif, par: ctx.par, maintenant: ctx.maintenant || new Date().toISOString() }); if (!s.ok) return s;
  if (ctx.valider !== false && !s.op.pesee.valide) { s.op.pesee.valide = { le: ctx.maintenant || new Date().toISOString(), par: ctx.par || '' }; journalAjouter(db, { quand: s.op.pesee.valide.le, objet: 'pesee', opId: s.op.id, num: s.op.pesee.num, annee: yearOf(s.op.date), action: 'validation', par: ctx.par, apres: resumeRegistre(s.op) }); }
  return okr({ op: s.op });
}
function peseeValider(db, id, ctx) {
  ctx = ctx || {}; const op = db.ops.find((o) => o.id === id); if (!op || op.type !== 'apport') return fail('Pesée introuvable.');
  if (!op.pesee) { op.pesee = { num: numeroSuivant(db, 'pesee', yearOf(op.date)) }; }
  if (op.pesee.valide) return fail('Pesée déjà validée.');
  if (!heureOK(op.pesee.heure)) return fail('Indiquez d’abord l’heure de la pesée (Modifier).');
  op.pesee.valide = { le: ctx.maintenant || new Date().toISOString(), par: ctx.par || '' };
  journalAjouter(db, { quand: op.pesee.valide.le, objet: 'pesee', opId: op.id, num: op.pesee.num, annee: yearOf(op.date), action: 'validation', par: ctx.par, apres: resumeRegistre(op) });
  return okr({ op });
}
// onglet Pressoir actif (0.25.0-alpha.2) : dans Opérations, la pesée de vendange et le pressurage s'ouvrent dans ses formulaires
// (registre des pesées, carnet de pressoir : une seule saisie, pesées choisies par leur n°). Variantes du catalogue, opérations
// planifiées et saisies d'avant le registre gardent le formulaire général. → 'pesee' | 'marc' | ''
function opViaPressoir(db, o) {
  if (!o || !moduleActif(db, 'pressoir') || o.prevId || o.fromPrev) return '';
  const old = o.editId ? (db.ops || []).find((x) => x.id === o.editId) : null;
  if (old) return old.sousType ? '' : old.type === 'apport' && old.pesee ? 'pesee' : old.type === 'pressurage' && old.marc ? 'marc' : '';
  if (o.preset && o.preset.sousType) return '';
  return o.type === 'apport' ? 'pesee' : o.type === 'pressurage' ? 'marc' : '';
}
// alertes d'une pesée (non bloquantes) : richesse en sucre sous le minimum du profil (TAP)
function peseeAlertes(db, o) {
  const p = pressoirParams(db); const x = (o && o.pesee) || {}; const L = [];
  if (p.tavpMin > 0 && hasNum(x.tap) && num(x.tap) < p.tavpMin) L.push(champenois(db) ? `TAP de ${fmt(x.tap, 1)} % vol. sous le minimum de richesse en sucre (143 g/L, soit ${fmt(p.tavpMin, 1)} % vol.).` : `TAP de ${fmt(x.tap, 1)} % vol. sous le minimum réglé (${fmt(p.tavpMin, 1)} % vol.).`);
  return L;
}
// TAP moyen (pondéré par le poids) de pesées, ou des pesées chargées dans un marc : { tap, kg } (kg : poids des pesées qui ont un TAP)
function tapPesees(db, items) {
  let k = 0; let t = 0; (items || []).forEach((it) => { const o = it && it.pesee ? it : db.ops.find((x) => x.id === (it && it.apportId)); if (!o || !o.pesee || !hasNum(o.pesee.tap)) return; const kg = it && it.apportId ? num(it.kg) : num(o.kg); if (kg > 0) { k += kg; t += kg * num(o.pesee.tap); } });
  return k > 0 ? { tap: Math.round((t / k) * 100) / 100, kg: r2(k) } : null;
}
// reste à presser d'une pesée (kg) d'après les marcs enregistrés
function peseeReste(db, id, saufMarc) { const o = db.ops.find((x) => x.id === id); if (!o) return 0; const pris = sum((db.ops || []).filter((m) => m.type === 'pressurage' && m.id !== saufMarc), (m) => sum((m.charges || []).filter((c) => c.apportId === id), (c) => c.kg)); return r2(num(o.kg) - pris); }

/* ---------- marc : chargement (début), puis volumes, TAV en puissance, validation ---------- */
// rôle des fractions : cuvée, taille (1re, 2e…), rebêches ; les autres (lies, bourbes) ne comptent pas dans le volume revendicable
// rôle d'une fraction dans les marcs, plafonds et rendements (0.38.0-alpha.3 : champ « rôle » explicite de la liste des fractions ;
// à défaut, déduit de l'identifiant des fractions par défaut puis du libellé — une fraction ajoutée « Taille » comptait comme « autre »)
const FRAC_ROLES = [['cuvee', 'Cuvée'], ['taille', 'Taille'], ['rebeche', 'Rebêche'], ['autre', 'Autre']];
const fracRoleOk = (r) => FRAC_ROLES.some((x) => x[0] === r);
function fracRoleDevine(label, id) {
  const k = norm(id || ''); if (k === 'cuvee') return 'cuvee'; if (/^taille/.test(k)) return 'taille'; if (/^rebech/.test(k)) return 'rebeche';
  const l = norm(label || ''); return /rebech/.test(l) ? 'rebeche' : /taille/.test(l) ? 'taille' : /cuvee/.test(l) ? 'cuvee' : 'autre';
}
const fracRole = (db, id) => { const f = fracDef(db, id) || {}; if (fracRoleOk(f.role)) return f.role; return fracRoleDevine(f.label, id); };
function marcVolumes(db, op) {
  const v = { cuvee: 0, taille: 0, rebeche: 0, autre: 0 };
  (op.fractions || []).forEach((f) => { v[fracRole(db, f.fractionId)] += num(f.volL); });
  return { ...v, aoc: v.cuvee + v.taille, total: v.cuvee + v.taille + v.rebeche + v.autre };
}
const marcKg = (op) => sum(op.charges || [], (c) => c.kg);
function marcCepages(db, op) { const m = {}; (op.charges || []).forEach((c) => { const a = db.ops.find((x) => x.id === c.apportId); const k = (a && a.cepageId) || '?'; m[k] = (m[k] || 0) + num(c.kg); }); return m; }
function marcApporteurs(db, op) { const m = {}; (op.charges || []).forEach((c) => { const a = db.ops.find((x) => x.id === c.apportId); const k = (a && a.apporteurId) || ''; m[k] = (m[k] || 0) + num(c.kg); }); return m; }
// f : { date, heureDebut, heureFin, equipementId, charges [{ apportId, kg }], frac { fractionId: { volL, contenantId, code } }, code, designation, millesime,
//       qualifId, tavp, bourbesL, sousCharge, notes }
function marcSpec(db, f, old) {
  if (!isoOK(f.date)) return fail('Date du marc invalide.');
  if (!heureOK(f.heureDebut)) return fail('Indiquez l’heure du début du pressurage (hh:mm).');
  if (f.heureFin && !heureOK(f.heureFin)) return fail('Heure de fin invalide (hh:mm).');
  if (!f.equipementId) return fail('Choisissez le pressoir.');
  const charges = (f.charges || []).filter((c) => c.apportId && num(c.kg) > 0).map((c) => ({ apportId: c.apportId, kg: r2(num(c.kg)) }));
  if (!charges.length) return fail('Affectez au moins une pesée au marc (poids chargé).');
  if (new Set(charges.map((c) => c.apportId)).size !== charges.length) return fail('Une même pesée apparaît deux fois dans le marc.');
  for (const c of charges) { const a = db.ops.find((x) => x.id === c.apportId); if (a && yearOf(a.date) !== yearOf(f.date)) return fail(`La pesée n° ${(a.pesee || {}).num || '?'} est de la vendange ${yearOf(a.date)} : un marc ne presse que des raisins de la même vendange.`); }
  for (const c of charges) { const reste = peseeReste(db, c.apportId, old ? old.id : null); if (c.kg > reste + 0.5) { const a = db.ops.find((x) => x.id === c.apportId); return fail(`Pesée ${a && a.pesee ? `n° ${a.pesee.num}` : ''} : ${fmt(c.kg)} kg chargés pour ${fmt(Math.max(0, reste))} kg restants.`); } }
  const code = String(f.code || '').trim(); if (!code) return fail('Indiquez le code du lot du marc (pressée).');
  const fractions = Object.keys(f.frac || {}).map((fid) => ({ fid, x: f.frac[fid] || {} })).filter(({ x }) => num(x.volL) > 0).map(({ fid, x }) => { const fr = fracDef(db, fid) || { id: fid, suffix: fid }; return { fractionId: fid, volL: r2(num(x.volL)), contenantId: x.contenantId || '', code: String(x.code || '').trim() || `${code}-${fr.suffix}` }; });
  if (fractions.some((x) => !x.contenantId)) return fail('Choisissez la cuve de chaque fraction renseignée.');
  const own = old ? opCreates(old).lots : [];
  const codes = [code, ...fractions.map((x) => x.code)];
  if (new Set(codes.map(norm)).size !== codes.length) return fail('Les codes de lots de ce marc doivent être différents.');
  const tk = codes.find((c) => codeLotPris(db, c, own)); if (tk) return fail(`Le code de lot « ${tk} » existe déjà.`);
  if (f.tavp !== '' && f.tavp !== undefined && f.tavp !== null && (!hasNum(f.tavp) || num(f.tavp) <= 0 || num(f.tavp) > 20)) return fail('TAV en puissance invalide (% vol.).');
  if (f.bourbesL !== '' && f.bourbesL !== undefined && f.bourbesL !== null && (!hasNum(f.bourbesL) || num(f.bourbesL) < 0)) return fail('Volume de bourbes invalide.');
  const marc = { heureDebut: f.heureDebut, enCours: !fractions.length };
  if (f.heureFin) marc.heureFin = f.heureFin; if (hasNum(f.tavp)) marc.tavp = r2(num(f.tavp)); if (hasNum(f.bourbesL)) marc.bourbesL = r2(num(f.bourbesL));
  if (String(f.sousCharge || '').trim()) marc.sousCharge = String(f.sousCharge).trim();
  const qualifs = charges.map((c) => (db.ops.find((x) => x.id === c.apportId) || {}).qualifId).filter(Boolean);
  const q = quiSaisit(db, f.operateurs, !old); if (q.msg) return fail(q.msg);
  // couleur des moûts choisie dans le carnet (rosé de saignée ou de macération), sinon celle du marc ou la couleur par défaut
  const vin = { stade: (old && old.stade) || stadeRole(db, 'entree') || (stadeList(db)[0] || {}).id || '', couleur: (f.couleur && couleurDef(db, f.couleur) ? f.couleur : '') || (old && old.couleur) || couleurDefaut(db) };
  Object.keys(vin).forEach((k) => { if (!vin[k]) delete vin[k]; });
  return okr({ spec: { type: 'pressurage', date: f.date, notes: String(f.notes || ''), ...(q.qui.length ? { operateurs: q.qui } : {}), ...vin, equipementId: f.equipementId, charges,
    parentSpec: { code, designation: String(f.designation || '').trim() || code, millesime: String(f.millesime || '').trim() || String(yearOf(f.date)), qualifId: f.qualifId || (qualifs.length ? minQualif(qualifs) : 'conv') }, fractions, marc } });
}
function marcSave(db, f, id, ctx) {
  ctx = ctx || {}; const old = id ? db.ops.find((o) => o.id === id) : null; if (id && !old) return fail('Marc introuvable.');
  const r = marcSpec(db, f, old); if (!r.ok) return r; const spec = r.spec;
  if (old && old.marc) spec.marc = { ...old.marc, ...spec.marc, ...(spec.marc.heureFin ? {} : { heureFin: undefined }), ...(hasNum(f.tavp) ? {} : { tavp: undefined }), ...(hasNum(f.bourbesL) ? {} : { bourbesL: undefined }), ...(String(f.sousCharge || '').trim() ? {} : { sousCharge: undefined }) };
  if (spec.marc) Object.keys(spec.marc).forEach((k) => { if (spec.marc[k] === undefined) delete spec.marc[k]; });
  // champs personnalisés du formulaire « Pressurage » (0.25.0-alpha.2) : saisis dans le carnet de pressoir
  if (f.champs && typeof f.champs === 'object') { const perso = formulaireDe(db, 'pressurage').perso; const pb = champsPersoErreurs(perso, 'pressurage', f, !old); if (pb) return fail(pb);
    const ch = champsValeurs(perso, f.champs, formuleVarsStd('pressurage', f), old && old.champs); if (ch.length || (old && old.champs)) spec.champs = ch; }
  ['champs', 'jauges', 'sousType'].forEach((k) => { if (old && old[k] !== undefined && spec[k] === undefined) spec[k] = old[k]; });
  return opSave(db, spec, id || null, { motif: ctx.motif, par: ctx.par, maintenant: ctx.maintenant || new Date().toISOString() });
}
// contrôles d'un marc : [{ niveau: 'bloquant' | 'alerte', code, msg }] ; R : état calculé (cadence sur les autres marcs)
function marcControles(db, op, opts) {
  opts = opts || {}; const p = pressoirParams(db); const out = []; const B = (code, msg) => out.push({ niveau: 'bloquant', code, msg }); const A = (code, msg) => out.push({ niveau: 'alerte', code, msg });
  const m = op.marc || {}; const kg = marcKg(op); const v = marcVolumes(db, op); const annee = yearOf(op.date); const pr = pressoirDe(db, op.equipementId);
  if (!heureOK(m.heureDebut)) B('heure', 'Heure du début du pressurage manquante.');
  if (!(kg > 0)) B('poids', 'Aucun poids chargé.');
  if (!(v.total > 0)) B('volumes', 'Volumes de moûts à renseigner.');
  if (p.registre && !hasNum(m.tavp)) B('tavp', 'TAV en puissance à renseigner (mesuré sur les moûts).');
  if (p.ratioKg > 0 && p.ratioL > 0 && kg > 0) {
    const max = (kg * p.ratioL) / p.ratioKg;
    if (v.aoc > max + 0.5) B('ratio', `Volume revendicable ${fmtL(v.aoc)} au-dessus du plafond de ${fmtL(max)} (${p.ratioL} L de ${p.volume} pour ${p.ratioKg} kg) : le surplus passe en rebêches.`);
  }
  const taux = rebechesTaux(p, annee);
  if (taux > 0 && v.aoc > 0 && v.rebeche + 0.5 < (v.aoc * taux) / 100) B('rebeches', `Rebêches ${fmtL(v.rebeche)} : au moins ${fmt(taux, 1)} % des moûts (${fmtL((v.aoc * taux) / 100)}) pour la récolte ${annee}.`);
  if (p.marcKg > 0 && kg > 0 && (p.cuveeL > 0 || p.tailleL > 0)) {
    const k = kg / p.marcKg;
    if (p.cuveeL > 0 && v.cuvee > p.cuveeL * k + 0.5) A('cuvee', `Cuvée ${fmtL(v.cuvee)} au-delà de l’usage (${fmtL(p.cuveeL * k)} pour ${fmt(kg)} kg, soit ${fmtL(p.cuveeL)} pour ${fmt(p.marcKg)} kg).`);
    if (p.tailleL > 0 && v.taille > p.tailleL * k + 0.5) A('taille', `Taille ${fmtL(v.taille)} au-delà de l’usage (${fmtL(p.tailleL * k)} pour ${fmt(kg)} kg, soit ${fmtL(p.tailleL)} pour ${fmt(p.marcKg)} kg).`);
  }
  if (pr && pr.capaciteKg > 0 && kg > 0) {
    if (kg > pr.capaciteKg * 1.02) A('surcharge', `Chargement de ${fmt(kg)} kg au-delà de la capacité agréée du pressoir (${fmt(pr.capaciteKg)} kg).`);
    else if (p.chargementPlein && kg < pr.capaciteKg * 0.98 && !m.sousCharge) A('souscharge', `Sous-chargement (${fmt(kg)} kg pour ${fmt(pr.capaciteKg)} kg agréés) : exceptionnel, indiquez-en le motif.`);
  }
  if (p.cadenceMax > 0 && heureOK(m.heureDebut)) {
    const t = instantDe(op.date, m.heureDebut); const n = (db.ops || []).filter((o) => estMarc(o) && o.equipementId === op.equipementId && heureOK(o.marc.heureDebut)).map((o) => instantDe(o.date, o.marc.heureDebut)).filter((x) => x > t - 86400000 && x <= t).length + ((db.ops || []).some((o) => o.id === op.id) ? 0 : 1);
    if (n > p.cadenceMax) B('cadence', `${n} marcs en 24 h sur ce pressoir : ${p.cadenceMax} au plus.`);
  }
  if (p.tavpMin > 0 && hasNum(m.tavp) && num(m.tavp) < p.tavpMin) A('tavp_bas', `TAV en puissance de ${fmt(m.tavp, 2)} % vol. sous le minimum de richesse en sucre (143 g/L, soit ${fmt(p.tavpMin, 1)} % vol.).`);
  if (p.bourbesMax > 0 && hasNum(m.bourbesL) && v.total > 0) { const b = (num(m.bourbesL) / (v.total)) * 100; if (b < p.bourbesMin - 0.05 || b > p.bourbesMax + 0.05) A('bourbes', `Bourbes : ${fmt(b, 1)} % des moûts (attendu entre ${fmt(p.bourbesMin)} et ${fmt(p.bourbesMax)} %).`); }
  if (p.saisieDiffereeMin > 0 && m.saisiLe && heureOK(m.heureDebut)) { const ecart = (new Date(m.saisiLe).getTime() - instantDe(op.date, m.heureDebut)) / 60000; if (ecart > p.saisieDiffereeMin) A('differe', `Marc saisi ${fmt(ecart / 60, 1)} h après le début du pressurage : le carnet se remplit au fur et à mesure.`); }
  return out;
}
function marcValider(db, id, ctx) {
  ctx = ctx || {}; const op = db.ops.find((o) => o.id === id); if (!op || op.type !== 'pressurage') return fail('Marc introuvable.');
  if (!op.marc) op.marc = { num: numeroSuivant(db, 'marc', yearOf(op.date)) };
  if (op.marc.valide) return fail('Marc déjà validé.');
  const b = marcControles(db, op).filter((c) => c.niveau === 'bloquant'); if (b.length) return fail(`Marc n° ${op.marc.num} : ${b.map((c) => c.msg).join(' ')}`);
  op.marc.valide = { le: ctx.maintenant || new Date().toISOString(), par: ctx.par || '' }; op.marc.enCours = false;
  journalAjouter(db, { quand: op.marc.valide.le, objet: 'marc', opId: op.id, num: op.marc.num, annee: yearOf(op.date), action: 'validation', par: ctx.par, apres: resumeRegistre(op) });
  return okr({ op });
}
// nouveau n° (doublon après synchronisation) : le suivant de l'année, avec le motif, gardé au journal
function registreRenumeroter(db, id, ctx) {
  ctx = ctx || {}; const op = db.ops.find((o) => o.id === id); const objet = op && (op.type === 'apport' ? 'pesee' : op.type === 'pressurage' ? 'marc' : '');
  if (!objet || !op[objet]) return fail('Saisie introuvable.');
  const motif = String(ctx.motif || '').trim() || 'Numéro en double après synchronisation';
  const avant = resumeRegistre(op); const n = numeroSuivant(db, objet, yearOf(op.date)); op[objet].num = n;
  journalAjouter(db, { quand: ctx.maintenant, objet, opId: op.id, num: n, annee: yearOf(op.date), action: 'correction', motif, par: ctx.par, avant, apres: resumeRegistre(op) });
  return okr({ num: n });
}
function registreAnnuler(db, id, ctx) {
  ctx = ctx || {}; const op = db.ops.find((o) => o.id === id); if (!op) return fail('Saisie introuvable.');
  if (!String(ctx.motif || '').trim()) return fail('Indiquez le motif de l’annulation (gardé au journal du pressoir).');
  return opDelete(db, id, { motif: ctx.motif, par: ctx.par, maintenant: ctx.maintenant });
}

/* ---------- campagne : registre, carnet, relevés, bilan ---------- */
const parNumero = (a, b, k) => (num((a[k] || {}).num) - num((b[k] || {}).num)) || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
const peseesDe = (db, annee) => (db.ops || []).filter((o) => o.type === 'apport' && yearOf(o.date) === annee).sort((a, b) => parNumero(a, b, 'pesee'));
const marcsDe = (db, annee) => (db.ops || []).filter((o) => o.type === 'pressurage' && yearOf(o.date) === annee).sort((a, b) => parNumero(a, b, 'marc'));
const annulesDe = (db, objet, annee) => (db.journalPressoir || []).filter((j) => j.objet === objet && j.action === 'annulation' && num(j.annee) === annee);
const anneesPressoir = (db) => uniq([...(db.ops || []).filter((o) => o.type === 'apport' || o.type === 'pressurage').map((o) => yearOf(o.date)), yearOf(todayISO())]).filter(Boolean).sort((a, b) => b - a);
// relevé par apporteur (usage : répartition au prorata du poids net apporté dans chaque marc ; document commercial, pas réglementaire)
function releveApporteurs(db, annee) {
  const T = {};
  marcsDe(db, annee).forEach((op) => {
    const kg = marcKg(op); if (!(kg > 0)) return; const v = marcVolumes(db, op); const aps = marcApporteurs(db, op);
    Object.keys(aps).forEach((ap) => { const s = aps[ap] / kg; const t = T[ap] || (T[ap] = { apporteurId: ap, kg: 0, cuvee: 0, taille: 0, rebeche: 0, total: 0, marcs: [] });
      t.kg += aps[ap]; t.cuvee += v.cuvee * s; t.taille += v.taille * s; t.rebeche += v.rebeche * s; t.total += v.total * s;
      t.marcs.push({ opId: op.id, num: (op.marc || {}).num || null, date: op.date, kg: aps[ap], part: s, cuvee: v.cuvee * s, taille: v.taille * s, rebeche: v.rebeche * s }); });
  });
  const pes = peseesDe(db, annee); const tapDe = (ap) => { const m = tapPesees(db, pes.filter((o) => (o.apporteurId || '') === (ap || ''))); return m ? m.tap : null; };
  return Object.values(T).map((t) => ({ ...t, kg: r2(t.kg), cuvee: r2(t.cuvee), taille: r2(t.taille), rebeche: r2(t.rebeche), total: r2(t.total), tap: tapDe(t.apporteurId) }));
}
function bilanPressoir(db, annee, today) {
  const p = pressoirParams(db); const marcs = marcsDe(db, annee); const auj = today || todayISO();
  const jours = uniq(marcs.map((o) => o.date)); const parPressoir = {};
  marcs.forEach((o) => { const k = o.equipementId || '?'; (parPressoir[k] || (parPressoir[k] = [])).push(o); });
  const pressoirs = Object.keys(parPressoir).map((id) => {
    const L = parPressoir[id]; const pr = pressoirDe(db, id); const t = L.filter((o) => estMarc(o) && heureOK(o.marc.heureDebut)).map((o) => instantDe(o.date, o.marc.heureDebut)).sort((a, b) => a - b);
    let max24 = 0; t.forEach((x, i) => { let n = 0; for (let j = i; j < t.length && t[j] < x + 86400000; j += 1) n += 1; max24 = Math.max(max24, n); });
    const moy = jours.length ? L.length / jours.length : 0;
    const plafondMoy = p.moyennes ? (pr && pr.h24 ? p.moyennes.h24 : p.moyennes[(pr && pr.agrement) || 'qualitatif']) : 0;
    return { id, nom: pr ? pr.nom : lbl(db, 'equipements', id), nb: L.length, max24, moyenne: r2(moy), plafondMoy, agrement: pr ? pr.agrement : '', h24: !!(pr && pr.h24) };
  });
  const v = marcs.reduce((a, o) => { const x = marcVolumes(db, o); a.aoc += x.aoc; a.rebeche += x.rebeche; a.total += x.total; a.bourbes += num((o.marc || {}).bourbesL); a.kg += marcKg(o); return a; }, { aoc: 0, rebeche: 0, total: 0, bourbes: 0, kg: 0 });
  const taux = rebechesTaux(p, annee); const alertes = [];
  pressoirs.forEach((x) => { if (p.cadenceMax > 0 && x.max24 > p.cadenceMax) alertes.push({ niveau: 'bloquant', msg: `${x.nom} : ${x.max24} marcs en 24 h (${p.cadenceMax} au plus).` }); if (x.plafondMoy > 0 && x.moyenne > x.plafondMoy) alertes.push({ niveau: 'alerte', msg: `${x.nom} : ${fmt(x.moyenne, 2)} marcs par jour de vendange en moyenne (${x.plafondMoy} au plus en agrément ${x.h24 ? 'fonctionnant 24 h/24' : x.agrement}).` }); });
  if (taux > 0 && v.aoc > 0 && v.rebeche + 0.5 < (v.aoc * taux) / 100) alertes.push({ niveau: 'bloquant', msg: `Rebêches de la récolte ${annee} : ${fmtL(v.rebeche)} pour ${fmtL((v.aoc * taux) / 100)} au moins (${fmt(taux, 1)} %).` });
  const lr = limiteApres(p.rebechesLimite, annee); const lb = limiteApres(p.bourbesLimite, annee);
  if (lr && v.rebeche > 0 && auj >= addDays(lr, -30)) alertes.push({ niveau: auj > lr ? 'bloquant' : 'alerte', msg: `Rebêches à envoyer en distillerie avant le ${fmtDate(lr)} (justificatif d’enlèvement à garder).` });
  if (lb && v.bourbes > 0 && auj >= addDays(lb, -30) && auj <= addDays(lb, 30)) alertes.push({ niveau: 'alerte', msg: `Bourbes à éliminer avant le ${fmtDate(lb)}.` });
  balancesDe(db).forEach((b) => { if (b.valideJusquau && b.valideJusquau < auj) alertes.push({ niveau: 'alerte', msg: `Balance « ${b.nom} » : vignette de vérification périmée depuis le ${fmtDate(b.valideJusquau)}.` }); });
  const dts = p.dates[annee] || {};
  if (dts.remiseCarnets && auj > dts.remiseCarnets && marcs.some((o) => !(o.marc && o.marc.valide))) alertes.push({ niveau: 'alerte', msg: `Date de remise des carnets (${fmtDate(dts.remiseCarnets)}) passée : des marcs ne sont pas validés.` });
  [['pesee', 'Pesée'], ['marc', 'Marc']].forEach(([objet, nom]) => registreDoublons(db, objet, annee).forEach((x) => alertes.push({ niveau: 'alerte', msg: `${nom} n° ${x.num} en double (${x.ops.length} saisies, sans doute sur deux appareils) : donnez un nouveau numéro à l’une d’elles (bouton « Nouveau n° »).` })));
  const ecarts = registreEcarts(db).filter((x) => yearOf(x.op.date) === annee);
  if (ecarts.length) alertes.push({ niveau: 'alerte', msg: `${ecarts.length} saisie(s) validée(s) modifiée(s) sans passer par le registre (version antérieure ou fichier modifié) : voir le journal.` });
  if (journalAlteres(db).length) alertes.push({ niveau: 'bloquant', msg: `${journalAlteres(db).length} ligne(s) du journal du pressoir ne correspondent plus à leur empreinte : le fichier a été modifié hors d’Œnotrack.` });
  const pesees = peseesDe(db, annee);
  const nonValides = { pesees: p.registre ? pesees.filter((o) => !(o.pesee && o.pesee.valide)).length : 0, marcs: marcs.filter((o) => !(o.marc && o.marc.valide)).length };
  // relevés de réception : TAP moyen, pesées sous le minimum de richesse en sucre, pourriture acide
  const tap = tapPesees(db, pesees); const tapBas = p.tavpMin > 0 ? pesees.filter((o) => hasNum((o.pesee || {}).tap) && num(o.pesee.tap) < p.tavpMin) : [];
  if (tapBas.length) alertes.push({ niveau: 'alerte', msg: `${tapBas.length} pesée(s) sous le minimum de richesse en sucre (TAP inférieur à ${fmt(p.tavpMin, 1)} % vol.) : n° ${tapBas.map((o) => o.pesee.num || '?').join(', ')}.` });
  const pa = pesees.filter((o) => hasNum((o.pesee || {}).pourritureAcide) && num(o.pesee.pourritureAcide) > 0);
  const pourriture = pa.length ? { nb: pa.length, kg: r2(sum(pa, (o) => o.kg)), moyenne: Math.round((sum(pa, (o) => num(o.kg) * num(o.pesee.pourritureAcide)) / Math.max(1, sum(pa, (o) => o.kg))) * 10) / 10 } : null;
  return { annee, params: p, pressoirs, jours: jours.length, nbMarcs: marcs.length, nbPesees: pesees.length, kgPeses: r2(sum(pesees, (o) => o.kg)), kgPresses: r2(v.kg), volumes: { aoc: r2(v.aoc), rebeche: r2(v.rebeche), total: r2(v.total), bourbes: r2(v.bourbes) }, tauxRebeches: taux, limiteRebeches: lr, limiteBourbes: lb, alertes, nonValides, tap, tapBas: tapBas.length, pourriture };
}

/* ---------- exports CSV (séparateur « ; », décimales à la française) ---------- */
const csvCellule = (x) => { const s = x === null || x === undefined ? '' : typeof x === 'number' ? String(r2(x)).replace('.', ',') : csvSansFormule(String(x)); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csvLignes = (rows) => rows.map((r) => r.map(csvCellule).join(';')).join('\r\n');
// lignes des registres (1re ligne : en-têtes) : exports CSV ci-dessous et onglet Registres (CSV / Excel)
function registrePeseesLignes(db, annee) {
  const perso = formulaireDe(db, 'pesee').perso; const persoVal = (o, d) => { const c = (Array.isArray(o.champs) ? o.champs : []).find((x) => x && x.id === d.id); return c ? (typeof c.valeur === 'number' ? c.valeur : champValeurTexte(c)) : ''; };
  const rows = [['N°', 'Date', 'Heure', 'Apporteur', 'Commune de l’apporteur', 'Cru (village)', 'Parcelle', 'Cépage', 'Revendication', 'Mention / lieu-dit', 'Poids brut (kg)', 'Tare (kg)', 'Poids net (kg)', 'Caisses', 'État sanitaire', 'Pourriture acide (%)', 'TAP (% vol.)', 'Heure de cueillette', 'Balance', 'Marc(s)', 'Statut', ...perso.map((d) => (d.unite && CP_NUM.includes(d.type) ? `${d.label} (${d.unite})` : d.label))]];
  const marcsDeLaPesee = (id) => marcsDe(db, annee).filter((m) => (m.charges || []).some((c) => c.apportId === id)).map((m) => (m.marc || {}).num || '?').join(' ');
  peseesDe(db, annee).forEach((o) => { const p = o.pesee || {}; const ap = (db.apporteurs || []).find((a) => a.id === o.apporteurId);
    rows.push([p.num || '', fmtDate(o.date), p.heure || '', o.apporteurId ? apporteurName(db, o.apporteurId) : 'Exploitation', ap ? ap.commune || '' : '', o.cruId ? cruName(db, o.cruId) : '', o.parcelleId ? parcelleName(db, o.parcelleId) : '', lbl(db, 'cepages', o.cepageId), qLabel(o.qualifId), p.mention || '', hasNum(p.brutKg) ? num(p.brutKg) : '', hasNum(p.tareKg) ? num(p.tareKg) : '', num(o.kg), p.caisses || '', p.etat ? (ETATS_SANITAIRES.find((e) => e.id === p.etat) || {}).label : '', hasNum(p.pourritureAcide) ? num(p.pourritureAcide) : '', hasNum(p.tap) ? num(p.tap) : '', p.heureCueillette || '', p.balanceId ? lbl(db, 'equipements', p.balanceId) : '', marcsDeLaPesee(o.id), p.valide ? 'validée' : 'à valider', ...perso.map((d) => persoVal(o, d))]); });
  annulesDe(db, 'pesee', annee).forEach((j) => rows.push([j.num, j.avant ? fmtDate(j.avant.date) : '', j.avant ? j.avant.heure || '' : '', '', '', '', '', '', '', '', '', '', j.avant ? j.avant.kg : '', '', '', '', '', '', '', '', `annulée le ${fmtDate(String(j.quand).slice(0, 10))} : ${j.motif}`, ...perso.map(() => '')]));
  return rows;
}
const registrePeseesCsv = (db, annee) => csvLignes(registrePeseesLignes(db, annee));
function carnetPressoirLignes(db, annee) {
  const fr = fracPress(db).filter((f) => fracRole(db, f.id) !== 'autre');
  const rows = [['N° de marc', 'Date', 'Heure de début', 'Heure de fin', 'Pressoir', 'Poids (kg)', 'Poids par cépage', 'Apporteur(s)', 'Origine / revendications particulières', ...fr.map((f) => `${f.label} (hL)`), 'Total moûts (hL)', 'TAV en puissance (% vol.)', 'Bourbes (hL)', 'Cuves', 'Statut']];
  marcsDe(db, annee).forEach((o) => { const m = o.marc || {}; const ce = marcCepages(db, o); const aps = marcApporteurs(db, o);
    const orig = uniq((o.charges || []).map((c) => db.ops.find((x) => x.id === c.apportId)).filter(Boolean).map((a) => [a.cruId ? cruName(db, a.cruId) : '', (a.pesee || {}).mention || ''].filter(Boolean).join(' ')).filter(Boolean)).join(' | ');
    rows.push([m.num || '', fmtDate(o.date), m.heureDebut || '', m.heureFin || '', lbl(db, 'equipements', o.equipementId), marcKg(o), Object.keys(ce).map((k) => `${lbl(db, 'cepages', k)} ${fmt(ce[k])} kg`).join(' ; '), Object.keys(aps).map((k) => (k ? apporteurName(db, k) : 'Exploitation')).join(' ; '), orig,
      ...fr.map((f) => sum((o.fractions || []).filter((x) => x.fractionId === f.id), (x) => x.volL) / 100), marcVolumes(db, o).total / 100, hasNum(m.tavp) ? num(m.tavp) : '', hasNum(m.bourbesL) ? num(m.bourbesL) / 100 : '', uniq((o.fractions || []).map((x) => (x.contenantId ? ((db.contenants || []).find((c) => c.id === x.contenantId) || {}).nom || '' : ''))).filter(Boolean).join(' ; '), m.valide ? 'validé' : m.enCours ? 'en cours' : 'à valider']); });
  annulesDe(db, 'marc', annee).forEach((j) => rows.push([j.num, j.avant ? fmtDate(j.avant.date) : '', j.avant ? j.avant.heureDebut || '' : '', '', '', '', '', '', '', ...fr.map(() => ''), '', '', '', '', `annulé le ${fmtDate(String(j.quand).slice(0, 10))} : ${j.motif}`]));
  return rows;
}
const carnetPressoirCsv = (db, annee) => csvLignes(carnetPressoirLignes(db, annee));
