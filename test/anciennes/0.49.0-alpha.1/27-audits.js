/* ============ MODE AUDIT (0.28.0-alpha.1) : présenter aux auditeurs ce qu'ils attendent ============
   Un type d'audit = des pièces à présenter (registres, bilan matière, test de traçabilité, vérifications…) et des points de contrôle.
   Types fournis (à adapter) : agriculture biologique, Demeter, douanes, hygiène (HACCP / plan de maîtrise sanitaire), AOC (ODG,
   organisme de contrôle). Chacun se personnalise (pièces, points, réglages) ; on peut en créer d'autres.
   db.auditModeles [{ id, nom, icone, desc, pieces [id], points [{ id, texte, pieces [id] }], reglages { lattesMois, lattesMillesimeMois,
   so2Max }, base (type d'origine) }] : types personnalisés, ou types fournis modifiés (même identifiant).
   db.audits [{ id, modeleId, nom, debut, fin, date, auditeur, organisme, statut ('encours' | 'clos'), reponses { [point] : { etat
   ('conforme' | 'obs' | 'nc' | 'na'), note } }, tests [{ cible { type, id }, titre, secondes, le }], notes, closLe }].
   Les textes des types fournis sont des aide-mémoire, pas les référentiels officiels : vérifiez-les avec votre organisme. */
const AUDIT_PIECES = [
  ['identite', 'Société, identifiants et certificats'], ['bilan', 'Bilan matière (comptabilité matière)'], ['apports', 'Registre des apports (raisins, moûts, vins)'],
  ['pesees', 'Registre des pesées'], ['carnet', 'Carnet de pressoir'], ['operations', 'Journal des opérations (manipulations)'],
  ['entrees_sorties', 'Registre des entrées et sorties'], ['sorties', 'Sorties de cave et documents d’accompagnement'], ['stocks', 'Stocks en fin de période'],
  ['intrants', 'Intrants utilisés et traitements'], ['arrivages', 'Achats d’intrants (lots des fournisseurs)'], ['intrants_fiches', 'Fiches techniques, FDS et certificats des intrants'],
  ['analyses', 'Analyses'], ['so2', 'Teneurs en SO₂ total'], ['declassements', 'Déclassements et changements de revendication'],
  ['lotsfinis', 'Lots finis (dégorgements)'], ['lattes', 'Durée sur lattes'], ['tracabilite', 'Test de traçabilité (amont, aval)'],
  ['hygiene', 'Journal d’hygiène'], ['plan_hygiene', 'Plan de nettoyage et non-conformités'], ['produits_hygiene', 'Produits d’hygiène (FDS)'],
  ['equipements', 'Équipements : maintenance et vérifications périodiques'], ['operateurs', 'Opérateurs et activité'],
];
const AUDIT_ETATS = [['conforme', 'Conforme'], ['obs', 'Observation'], ['nc', 'Non-conformité'], ['na', 'Sans objet']];
const AUDIT_MODELES = [
  { id: 'bio', nom: 'Agriculture biologique', icone: '🌿', desc: 'Contrôle bio (règlement (UE) 2018/848 et règles de vinification) : comptabilité matière, intrants autorisés, séparation bio / non bio, traçabilité.',
    pieces: ['identite', 'bilan', 'apports', 'intrants', 'arrivages', 'intrants_fiches', 'declassements', 'so2', 'tracabilite', 'hygiene', 'sorties'],
    points: [['Certificat bio de l’exploitation en cours de validité', ['identite']], ['Comptabilité matière tenue à jour : entrées, sorties, stocks concordants', ['bilan', 'apports', 'sorties']],
      ['Raisins et moûts achetés : certificats bio des fournisseurs', ['apports']], ['Intrants utilisés autorisés en bio (liste du règlement), justificatifs disponibles', ['intrants', 'intrants_fiches']],
      ['Lots des fournisseurs d’intrants enregistrés (n° de lot, facture)', ['arrivages']], ['Séparation bio / non bio : pas de mélange, nettoyage avant passage en bio', ['declassements', 'hygiene']],
      ['Teneurs en SO₂ total sous les limites bio', ['so2']], ['Test de traçabilité amont / aval réussi', ['tracabilite']], ['Étiquetage bio conforme (logo, n° de l’organisme)', []]].map(([texte, pieces], i) => ({ id: `p${i + 1}`, texte, pieces })),
    reglages: { so2Max: '' } },
  { id: 'demeter', nom: 'Demeter (biodynamie)', icone: '🌙', desc: 'Contrôle Demeter : exigences bio plus le cahier des charges de vinification Demeter (intrants, procédés, SO₂, traçabilité).',
    pieces: ['identite', 'bilan', 'apports', 'operations', 'intrants', 'arrivages', 'intrants_fiches', 'so2', 'declassements', 'tracabilite'],
    points: [['Certification Demeter et bio en cours de validité', ['identite']], ['Raisins et moûts certifiés Demeter (certificats des fournisseurs)', ['apports']],
      ['Intrants et procédés de vinification autorisés par le cahier des charges Demeter', ['intrants', 'operations', 'intrants_fiches']], ['Teneurs en SO₂ total sous les limites Demeter', ['so2']],
      ['Comptabilité matière et séparation des produits non Demeter', ['bilan', 'declassements']], ['Test de traçabilité amont / aval réussi', ['tracabilite']]].map(([texte, pieces], i) => ({ id: `p${i + 1}`, texte, pieces })),
    reglages: { so2Max: '' } },
  { id: 'douanes', nom: 'Douanes (contributions indirectes)', icone: '🏛', desc: 'Contrôle des registres vitivinicoles et des stocks : entrées, sorties, manipulations, documents d’accompagnement, concordance avec les déclarations (DRM).',
    pieces: ['identite', 'entrees_sorties', 'apports', 'operations', 'sorties', 'stocks', 'bilan', 'lotsfinis', 'lattes'],
    points: [['Registres d’entrées, de sorties et de manipulations tenus et à jour', ['entrees_sorties', 'operations']], ['Chaque sortie couverte par un document d’accompagnement (DAE, DSA…)', ['sorties']],
      ['Stock physique conforme au stock comptable et aux déclarations récapitulatives (DRM)', ['stocks', 'bilan']], ['Pertes et écarts de jaugeage justifiés', ['bilan']],
      ['Manipulations inscrites : enrichissement, édulcoration, tirage, dégorgement…', ['operations', 'lotsfinis']], ['Identifiants (n° d’accise, CVI) et habilitations à jour', ['identite']]].map(([texte, pieces], i) => ({ id: `p${i + 1}`, texte, pieces })),
    reglages: {} },
  { id: 'haccp', nom: 'Hygiène (HACCP, plan de maîtrise sanitaire)', icone: '🧽', desc: 'Contrôle sanitaire : bonnes pratiques d’hygiène, plan de nettoyage, maîtrise des dangers, traçabilité et procédure de retrait-rappel (règlements (CE) n° 852/2004 et 178/2002).',
    pieces: ['plan_hygiene', 'hygiene', 'produits_hygiene', 'equipements', 'intrants', 'arrivages', 'intrants_fiches', 'tracabilite', 'operateurs'],
    points: [['Plan de maîtrise sanitaire à jour (bonnes pratiques, HACCP, traçabilité, non-conformités)', ['plan_hygiene']], ['Plan de nettoyage appliqué ; contrôles après rinçage enregistrés', ['plan_hygiene', 'hygiene']],
      ['Non-conformités traitées et justifiées', ['plan_hygiene']], ['Fiches de données de sécurité des produits d’hygiène disponibles', ['produits_hygiene']],
      ['Intrants aptes au contact alimentaire ; allergènes (œuf, lait) maîtrisés et étiquetés', ['intrants', 'intrants_fiches']], ['Matériel entretenu, instruments vérifiés', ['equipements']],
      ['Procédure de retrait-rappel : test de traçabilité réussi (un pas en amont, un pas en aval)', ['tracabilite']], ['Personnel formé aux règles d’hygiène', ['operateurs']]].map(([texte, pieces], i) => ({ id: `p${i + 1}`, texte, pieces })),
    reglages: {} },
  { id: 'aoc', nom: 'Appellation d’origine (ODG, contrôle AOC)', icone: '🏷', desc: 'Contrôle du cahier des charges de l’appellation : registres des pesées et de pressoir, rendements, pratiques œnologiques, élevage et durée sur lattes, déclarations.',
    pieces: ['identite', 'pesees', 'carnet', 'apports', 'operations', 'intrants', 'lotsfinis', 'lattes', 'analyses', 'declassements', 'stocks'],
    points: [['Habilitation de l’opérateur à jour', ['identite']], ['Registre des pesées tenu (mentions obligatoires)', ['pesees']], ['Carnet de pressoir tenu ; rendement au pressurage respecté ; rebêches séparées', ['carnet']],
      ['Pratiques œnologiques et intrants autorisés par le cahier des charges', ['operations', 'intrants']], ['Durées minimales respectées : 12 mois en bouteille avant dégorgement, 15 mois (36 mois millésimés) depuis le tirage avant mise en marché', ['lattes', 'lotsfinis']],
      ['Déclarations (récolte, revendication) cohérentes avec les registres', ['apports', 'stocks']], ['Déclassements enregistrés', ['declassements']]].map(([texte, pieces], i) => ({ id: `p${i + 1}`, texte, pieces })),
    reglages: { lattesMois: 15, lattesMillesimeMois: 36 } },
];
const auditPieceNom = (id) => (AUDIT_PIECES.find((p) => p[0] === id) || [id, id])[1];
// types d'audit : fournis (éventuellement modifiés) puis personnalisés
function auditModeles(db) {
  const P = Array.isArray(db.auditModeles) ? db.auditModeles.filter((m) => m && m.id) : [];
  const fournis = AUDIT_MODELES.map((m) => { const x = P.find((y) => y.id === m.id); return x ? { ...m, ...x, fourni: true, modifie: true } : { ...m, fourni: true }; });
  return [...fournis, ...P.filter((m) => !AUDIT_MODELES.some((y) => y.id === m.id)).map((m) => ({ icone: '📋', pieces: [], points: [], reglages: {}, ...m }))];
}
const auditModele = (db, id) => auditModeles(db).find((m) => m.id === id) || null;
function auditModeleSave(db, id, s) {
  const nom = String((s && s.nom) || '').trim().slice(0, 80); if (!nom) return fail('Donnez un nom au type d’audit.');
  if (auditModeles(db).some((m) => m.id !== id && norm(m.nom) === norm(nom))) return fail(`Le type d’audit « ${nom} » existe déjà.`);
  const pieces = uniq((s.pieces || []).filter((p) => AUDIT_PIECES.some((x) => x[0] === p)));
  const pts = (s.points || []).filter((p) => p && String(p.texte || '').trim()).slice(0, 80);
  const ids = new Set(); const points = pts.map((p, i) => { let pid = String(p.id || '') || `p${i + 1}`; while (ids.has(pid)) pid = `${pid}b`; ids.add(pid); return { id: pid, texte: String(p.texte).trim().slice(0, 300), pieces: uniq((p.pieces || []).filter((x) => pieces.includes(x))) }; });
  const r = s.reglages || {}; const reglages = {};
  if (r.lattesMois !== undefined && r.lattesMois !== '') reglages.lattesMois = Math.max(0, Math.round(num(r.lattesMois)));
  if (r.lattesMillesimeMois !== undefined && r.lattesMillesimeMois !== '') reglages.lattesMillesimeMois = Math.max(0, Math.round(num(r.lattesMillesimeMois)));
  if (r.so2Max !== undefined && r.so2Max !== '') reglages.so2Max = Math.max(0, num(r.so2Max));
  const m = { id: id || nid(db, 'aud'), nom, icone: String((s && s.icone) || '📋').slice(0, 4), desc: String((s && s.desc) || '').trim().slice(0, 600), pieces, points, reglages, ...(s.base ? { base: s.base } : {}) };
  if (!Array.isArray(db.auditModeles)) db.auditModeles = [];
  const i = db.auditModeles.findIndex((x) => x && x.id === m.id); if (i >= 0) db.auditModeles[i] = { ...db.auditModeles[i], ...m }; else db.auditModeles.push(m);
  return okr({ id: m.id });
}
// type fourni : retour à l'original ; type personnalisé : suppression (s'il n'a servi à aucun audit)
function auditModeleRetablir(db, id) {
  const fourni = AUDIT_MODELES.some((m) => m.id === id);
  if (!fourni && (db.audits || []).some((a) => a && a.modeleId === id)) return fail('Ce type a servi à des audits : gardez-le (l’historique en dépend).');
  db.auditModeles = (db.auditModeles || []).filter((m) => m && m.id !== id); return okr();
}
function auditSave(db, id, s) {
  if (!Array.isArray(db.audits)) db.audits = [];
  const a0 = id ? db.audits.find((x) => x && x.id === id) : null; if (id && !a0) return fail('Audit introuvable.');
  const m = auditModele(db, (s && s.modeleId) || (a0 && a0.modeleId)); if (!m) return fail('Choisissez le type d’audit.');
  const debut = (s && s.debut) || (a0 && a0.debut); const fin = (s && s.fin) || (a0 && a0.fin);
  if (!isoValide(debut) || !isoValide(fin) || debut > fin) return fail('Période de l’audit invalide.');
  const date = (s && s.date) || (a0 && a0.date) || todayISO(); if (!isoValide(date)) return fail('Date de l’audit invalide.');
  const item = { modeleId: m.id, nom: m.nom, debut, fin, date, auditeur: String((s && s.auditeur) != null ? s.auditeur : (a0 && a0.auditeur) || '').trim().slice(0, 120), organisme: String((s && s.organisme) != null ? s.organisme : (a0 && a0.organisme) || '').trim().slice(0, 120), notes: String((s && s.notes) != null ? s.notes : (a0 && a0.notes) || '').slice(0, 3000) };
  if (a0) { if (a0.statut === 'clos') return fail('Audit clos : rouvrez-le pour le modifier.'); Object.assign(a0, item); return okr({ id }); }
  const a = { id: nid(db, 'au'), ...item, statut: 'encours', reponses: {}, tests: [], creeLe: new Date().toISOString() }; db.audits.push(a); return okr({ id: a.id });
}
function auditRepondre(db, id, pointId, rep) {
  const a = (db.audits || []).find((x) => x && x.id === id); if (!a) return fail('Audit introuvable.'); if (a.statut === 'clos') return fail('Audit clos : rouvrez-le pour le modifier.');
  const m = auditModele(db, a.modeleId); if (!m || !m.points.some((p) => p.id === pointId)) return fail('Point de contrôle introuvable.');
  const cur = { ...((a.reponses || {})[pointId] || {}) };
  if (rep.etat !== undefined) { if (rep.etat && !AUDIT_ETATS.some((e) => e[0] === rep.etat)) return fail('État inconnu.'); cur.etat = rep.etat || ''; }
  if (rep.note !== undefined) cur.note = String(rep.note || '').slice(0, 1000);
  a.reponses = { ...(a.reponses || {}), [pointId]: cur }; return okr();
}
function auditTest(db, id, t) {
  const a = (db.audits || []).find((x) => x && x.id === id); if (!a) return fail('Audit introuvable.'); if (a.statut === 'clos') return fail('Audit clos : rouvrez-le pour le modifier.');
  a.tests = [...(a.tests || []), { cible: t.cible, titre: String(t.titre || '').slice(0, 120), secondes: Math.max(0, Math.round(num(t.secondes))), le: t.le || new Date().toISOString() }].slice(-20); return okr();
}
function auditClore(db, id, clore) {
  const a = (db.audits || []).find((x) => x && x.id === id); if (!a) return fail('Audit introuvable.');
  if (clore) { a.statut = 'clos'; a.closLe = new Date().toISOString(); } else { a.statut = 'encours'; delete a.closLe; }
  return okr();
}
function auditSupprimer(db, id) { if (!(db.audits || []).some((x) => x && x.id === id)) return fail('Audit introuvable.'); db.audits = db.audits.filter((x) => !(x && x.id === id)); return okr(); }
// bilan d'un audit : réponses par état
function auditResume(db, a) {
  const m = auditModele(db, a.modeleId) || { points: [] }; const R0 = { conforme: 0, obs: 0, nc: 0, na: 0, attente: 0, total: m.points.length };
  m.points.forEach((p) => { const e = ((a.reponses || {})[p.id] || {}).etat; if (e && R0[e] !== undefined) R0[e] += 1; else R0.attente += 1; });
  return R0;
}
// durée sur lattes de chaque lot fini : tirage (ou date du lot de tirage) → dégorgement, en mois
// mois entiers entre deux dates (calendrier) : 2 avril → 2 juillet de l'année suivante = 15 mois
function moisEntre(a, b) {
  if (!isoOK(a) || !isoOK(b) || b < a) return null;
  const [y1, m1, d1] = a.split('-').map(Number); const [y2, m2, d2] = b.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
}
// durée sur lattes des lots finis dégorgés sur la période : du tirage au dégorgement. Bouteilles reprises en stock (reprise) : date
// de tirage inconnue, sauf si elle est notée sur le lot (dateTirage) ; elles ne sont alors ni conformes ni en défaut.
function auditLattes(db, reglages, debut, fin) {
  const r = reglages || {};
  return (db.lotsFinis || []).filter((f) => f && (!debut || !isoOK(f.date) || f.date >= debut) && (!fin || !isoOK(f.date) || f.date <= fin)).map((f) => {
    const l = (db.lots || []).find((x) => x.id === f.sourceLotId) || {}; const tir = (db.ops || []).find((o) => o && o.type === 'tirage' && o.lotId === l.id) || null;
    const tirage = tir ? tir.date : isoOK(l.dateTirage) ? l.dateTirage : ''; const mois = moisEntre(tirage, f.date);
    const mill = !!(l.millesime && /^\d{4}$/.test(String(l.millesime)) && /mill[eé]sim/i.test(`${f.designation || ''} ${l.designation || ''}`));
    const min = mill ? num(r.lattesMillesimeMois) : num(r.lattesMois);
    return { f, l, debut: tirage, reprise: !tir, mois, millesime: mill, min: min || 0, ok: mois == null || !min ? null : mois >= min };
  });
}
function auditSo2(db, debut, fin, max) {
  const L = (db.analyses || []).filter((a) => a && a.lotId && a.valeurs && hasNum(a.valeurs.so2t) && (!debut || a.date >= debut) && (!fin || a.date <= fin));
  const par = {}; L.forEach((a) => { if (!par[a.lotId] || a.date > par[a.lotId].date) par[a.lotId] = a; });
  return Object.values(par).map((a) => ({ a, lot: (db.lots || []).find((l) => l.id === a.lotId), v: num(a.valeurs.so2t), depasse: num(max) > 0 && num(a.valeurs.so2t) > num(max) })).sort((x, y) => y.v - x.v);
}
