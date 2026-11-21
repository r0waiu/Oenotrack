// Base de test 0.26.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.25.0-alpha.2 rouverte par cette version, avec les plans
// d'hygiène (une ligne ajoutée au plan de nettoyage, une ligne du modèle modifiée, du matériel ajouté au plan de maintenance), des
// interventions (préventive, panne en cours), des entrées d'hygiène avec contrôle après rinçage, ligne du plan, changement de
// revendication et local, une non-conformité justifiée, un intrant avec ses informations (FT, FDS) → test/fixtures/base-0.26.0-alpha.1-plans.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, planEntreeSave, planNettoyage, maintEntreeSave, maintInterventionSave, hygieneSave, hygAcquitter, produitSave, planTaches, APP_VERSION, APP_NUM };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.25.0-alpha.2-ops.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const must = (r) => { if (!r.ok) throw new Error(r.msg); return r; };
d.settings.planHygieneDepuis = '2026-09-01';
const cuves = d.contenants.filter((c) => c.statut !== 'archive'); const c1 = cuves[0]; const c2 = cuves[1];
// plan de nettoyage : une ligne ajoutée, une ligne du modèle modifiée (délai de rinçage)
must(L.planEntreeSave(d, { zone: 'cuverie', libelle: 'Bacs de débourbage', cible: { type: 'contenants', ids: [c2.id] }, actionId: 'nettoyage', quand: [{ type: 'apresOp', ops: ['debourbage'] }, { type: 'texte', texte: 'Après chaque débourbage' }], produits: [{ type: 'alcalin', conc: 2 }], mode: 'Brosser, solution alcaline, rincer.', contact: '15 min', controle: 'ph', attendu: 'pH 7', enregistrement: 'Journal d’hygiène', enregistrer: true, responsable: 'Opérateur de cuverie', danger: 'chimique' }));
const ri = L.planNettoyage(d).find((e) => e.id === 'pn_cuves_rincage');
must(L.planEntreeSave(d, { ...ri, quand: [{ type: 'vidange', delai: 2 }, { type: 'avantRemplissage', heures: 48 }] }, ri.id));
// plan de maintenance : matériel ajouté ; interventions
must(L.maintEntreeSave(d, { libelle: 'Compresseur d’air', type: 'reglementaire', frequence: { n: 1, unite: 'an' }, interventions: 'Vérification du réservoir sous pression.', intervenant: 'Organisme agréé', derniere: '2025-10-01' }));
must(L.maintInterventionSave(d, { date: '2026-10-15', entreeId: 'pm_pompes', equipementId: 'pompe', type: 'preventive', interventions: 'Garnitures changées, essai.', intervenant: 'Interne', resultat: 'conforme' }));
must(L.maintInterventionSave(d, { date: '2026-11-02', entreeId: 'pm_agitateurs', type: 'curative', statut: 'ouverte', probleme: 'Agitateur bruyant.' }));
// journal d'hygiène : contrôle, ligne du plan, changement de revendication, local
must(L.hygieneSave(d, { date: '2026-10-20', cibleType: 'contenant', cibleId: c1.id, actionId: 'rincage', produits: [], methode: 'eau chaude', planId: 'pn_cuves_revendication', controle: { type: 'ph', resultat: 'conforme', valeur: '7' }, changementRevendication: { de: 'conv', vers: 'bio' } }));
must(L.hygieneSave(d, { date: '2026-10-21', cibleType: 'local', cibleId: 'sol_cuverie', actionId: 'nettoyage', produits: [], methode: 'balai-brosse', planId: 'pn_sol_cuverie', controle: { type: 'visuel', resultat: 'conforme' } }));
// une non-conformité justifiée
const nc = L.planTaches(d, '2026-11-21').find((x) => x.etat === 'nonconforme');
must(L.hygAcquitter(d, nc ? nc.cle : 'pn:test:remp:x:y', { motif: 'Cuve neuve, rincée à la livraison.', msg: nc ? nc.msg : 'test', date: '2026-11-21' }));
// intrant : informations de la FT et de la FDS
const pr = d.produits[0];
must(L.produitSave(d, { ...pr, fabricant: 'Fabricant fictif', doseEmploi: '10 à 30 g/hL', allergenes: 'aucun', usageBio: 'autorisé (règlement (UE) 2018/848)' }, pr.id));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.26.0-alpha.1-plans.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', '·', L.planTaches(d, '2026-11-21').length, 'tâches');
