// Base de test 0.28.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.27.0-alpha.2 rouverte par cette version, avec
// - des identifiants activés : un administrateur et un opérateur de chai, chacun avec une clé d'accès (clé publique générée ici,
//   au hasard) — celle de l'administrateur acceptée, celle de l'opérateur en attente ; réglage « accepté par un administrateur » ;
// - le parc de matériel : fiches complètes (marque, modèle, n° de série, site, garantie, informations ajoutées), vérifications
//   périodiques (réfractomètre, extincteur échu, vignette de la bascule), matériel à l'arrêt et réformé, catégorie ajoutée,
//   panne en cours, notice jointe (métadonnées seulement) ;
// - le mode audit : type fourni personnalisé (AOC), type créé, un audit clos (réponses, test de traçabilité) et un audit en cours
// → test/fixtures/base-0.28.0-alpha.1-audits.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, mdpEmpreinte, securiteActiver, utilisateurSave, cleAjouter, clesRegler, clesB64, clesB64u, equipementSave, hygListeAjouter, maintInterventionSave, docMetaAdd, auditModele, auditModeleSave, auditSave, auditRepondre, auditTest, auditClore, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
(async () => {
  const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.27.0-alpha.2-listes.json'), 'utf8'));
  const d = L.normalizeDb(base); L.syncConfig(d);
  // identifiants et clés d'accès (mots de passe et clés fictifs)
  const mdp = await L.mdpEmpreinte('Essai-0280', 1000);
  must(L.securiteActiver(d, { identifiant: 'admin', nom: 'Administrateur (fictif)', mdp }));
  const admin = d.utilisateurs[0].id;
  const op = must(L.utilisateurSave(d, { identifiant: 'chai', nom: 'Opérateur de chai (fictif)', profilId: 'pf_operateur', mdp })).id;
  const S = globalThis.crypto.subtle;
  const cle = async (nom, appareil) => { const kp = await S.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']); const spki = new Uint8Array(await S.exportKey('spki', kp.publicKey)); return { id: L.clesB64u(globalThis.crypto.getRandomValues(new Uint8Array(16))), cle: L.clesB64(spki), alg: -7, rp: 'app.test', nom, appareil, le: '2026-11-21T08:00:00.000Z' }; };
  must(L.clesRegler(d, { actif: true, validation: 'admin' }));
  const ka = must(L.cleAjouter(d, admin, await cle('PC Windows', 'PC Windows'))); const ko = must(L.cleAjouter(d, op, await cle('Android', 'Android')));
  if (!ka.acceptee || ko.acceptee) throw new Error('acceptation des clés inattendue');
  // parc de matériel
  const site = (d.sites || [])[0];
  must(L.equipementSave(d, 'pompe', { label: 'Pompe à pistons', categorie: 'transfert', marque: 'Marque fictive', modele: 'PX 30', numSerie: 'SN-0001 (fictif)', annee: '2019', fournisseur: 'Fournisseur fictif', siteId: site ? site.id : '', emplacement: 'Quai de réception', etat: 'service', garantieJusquau: '2027-06-30', champs: [{ label: 'Puissance', valeur: '3 kW' }, { label: 'Contrat d’entretien', valeur: 'n° 0000 (fictif)' }], notes: 'Fiche de test (données fictives).' }));
  const refracto = must(L.equipementSave(d, null, { label: 'Réfractomètre de poche', categorie: 'mesure', verif: { periodeMois: 12, derniere: '2026-01-15', organisme: 'Laboratoire fictif' } })).id;
  const extinct = must(L.equipementSave(d, null, { label: 'Extincteur CO₂ du chai', categorie: 'securite', verif: { periodeMois: 12, derniere: '2025-11-10', organisme: 'Prestataire fictif' } })).id;
  must(L.equipementSave(d, 'bascule', { label: 'Bascule du pressoir', verif: { periodeMois: 12, valideJusquau: '2027-06-30', organisme: 'Organisme agréé (fictif)' } }));
  must(L.equipementSave(d, 'tangent', { label: 'Filtre tangentiel', etat: 'arret' }));
  const vieille = must(L.equipementSave(d, null, { label: 'Ancienne pompe centrifuge', categorie: 'transfert', etat: 'reforme' })).id;
  const cat = must(L.hygListeAjouter(d, 'equipCategories', 'Matériel viticole')).id;
  const enj = must(L.equipementSave(d, null, { label: 'Enjambeur', categorie: cat })).id;
  must(L.maintInterventionSave(d, { date: '2026-11-20', equipementId: refracto, type: 'curative', statut: 'ouverte', probleme: 'Prisme rayé (fictif)', libelle: '' }));
  must(L.docMetaAdd(d, { id: 'doc-eq-notice', nom: 'notice-pompe.pdf', mime: 'application/pdf', taille: 1234, cat: 'notice', cible: { type: 'equipement', id: 'pompe' }, date: '2026-11-21' }));
  // mode audit
  const aoc = L.auditModele(d, 'aoc');
  must(L.auditModeleSave(d, 'aoc', { ...aoc, points: [...aoc.points, { texte: 'Point ajouté pour la base de test (fictif)', pieces: ['lattes'] }], reglages: { lattesMois: 15, lattesMillesimeMois: 36 } }));
  const perso = must(L.auditModeleSave(d, null, { nom: 'Audit client export (fictif)', icone: '🚢', desc: 'Type créé pour la base de test.', pieces: ['identite', 'tracabilite', 'lotsfinis', 'sorties'], points: [{ texte: 'Lot tracé jusqu’à l’expédition', pieces: ['tracabilite', 'sorties'] }, { texte: 'Lots finis identifiés', pieces: ['lotsfinis'] }], reglages: {} })).id;
  const a1 = must(L.auditSave(d, null, { modeleId: 'douanes', debut: '2025-08-01', fin: '2026-07-31', date: '2026-11-18', auditeur: 'Auditeur fictif', organisme: 'Douane (fictif)', notes: 'Visite de test.' })).id;
  must(L.auditRepondre(d, a1, 'p1', { etat: 'conforme' })); must(L.auditRepondre(d, a1, 'p2', { etat: 'obs', note: 'Un DSA à classer (fictif).' })); must(L.auditRepondre(d, a1, 'p3', { etat: 'nc', note: 'Écart de stock à justifier (fictif).' }));
  const fini = (d.lotsFinis || [])[0];
  must(L.auditTest(d, a1, { cible: { type: 'fini', id: fini ? fini.id : '' }, titre: fini ? fini.code : 'Lot', secondes: 42, le: '2026-11-18T10:30:00.000Z' }));
  must(L.auditClore(d, a1, true));
  const a2 = must(L.auditSave(d, null, { modeleId: perso, debut: '2026-01-01', fin: '2026-11-21', date: '2026-11-21', auditeur: 'Client fictif' })).id;
  must(L.auditRepondre(d, a2, 'p1', { etat: 'conforme', note: 'Chaîne présentée en 1 min.' }));
  const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.28.0-alpha.1-audits.json');
  fs.writeFileSync(out, JSON.stringify(d));
  console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', '· utilisateurs', d.utilisateurs.length, '· matériel', d.lists.equipements.length, [refracto, extinct, vieille, enj].join(','), '· audits', d.audits.length, '· types', (d.auditModeles || []).length);
})().catch((e) => { console.error(e); process.exit(1); });
