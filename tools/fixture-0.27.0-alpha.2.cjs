// Base de test 0.27.0-alpha.2 (données fictives : jeu d'exemple) : la base 0.27.0-alpha.1 rouverte par cette version, avec
// - des listes de l'hygiène personnalisées : moyen de contrôle ajouté (conductimètre, résultat attendu), contrôle d'origine renommé,
//   zone ajoutée, zone d'origine masquée, moment du plan, type de maintenance et protection individuelle ajoutés ;
// - une ligne du plan de nettoyage, une entrée du journal et une intervention de maintenance qui s'en servent ;
// - des identifiants (fictifs) imprimés sur les bons : société et partenaire
// → test/fixtures/base-0.27.0-alpha.2-listes.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, hygListeAjouter, hygListeModifier, planEntreeSave, hygieneSave, maintInterventionSave, apporteurSave, entrepriseSet, APP_VERSION, APP_NUM };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.27.0-alpha.1-imports.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
// listes de l'hygiène
const ctl = must(L.hygListeAjouter(d, 'hygControles', 'Conductimètre', { attendu: '< 50 µS/cm' })).id;
must(L.hygListeModifier(d, 'hygControles', 'visuel', { label: 'Visuel (lampe)' }));
const zone = must(L.hygListeAjouter(d, 'hygZones', 'Chai à barriques')).id;
must(L.hygListeModifier(d, 'hygZones', 'degorgement', { masque: true }));
const moment = must(L.hygListeAjouter(d, 'hygMoments', 'Après chaque débourbage')).id;
const mt = must(L.hygListeAjouter(d, 'maintTypes', 'Étalonnage')).id;
must(L.hygListeAjouter(d, 'hygEpi', 'Casque anti-bruit'));
// ligne du plan, journal, maintenance
const act = (d.lists.actionsHygiene || []).find((a) => a.id === 'rincage') || d.lists.actionsHygiene[0];
const loc = (d.lists.locaux || [])[0];
const pl = must(L.planEntreeSave(d, { zone, libelle: 'Barriques après soutirage', cible: { type: 'locaux', ids: loc ? [loc.id] : [] }, actionId: act.id, quand: [{ type: 'texte', texte: 'Après chaque débourbage', momentId: moment }], produits: [], mode: 'Rinçage à l’eau chaude puis froide.', controle: ctl, attendu: '< 50 µS/cm', danger: 'chimique' })).id;
const c0 = d.contenants.find((c) => c.statut !== 'archive');
must(L.hygieneSave(d, { date: '2026-11-21', cibleType: 'contenant', cibleId: c0.id, actionId: act.id, produits: [], methode: '', notes: 'Rinçage contrôlé au conductimètre', controle: { type: ctl, resultat: 'conforme', valeur: '32 µS/cm' }, planId: pl }));
const eq = (d.lists.equipements || [])[0];
must(L.maintInterventionSave(d, { date: '2026-11-21', equipementId: eq ? eq.id : '', libelle: eq ? '' : 'Réfractomètre', type: mt, interventions: 'Étalonnage à l’eau distillée.', intervenant: 'Œnologue', resultat: 'conforme' }));
// identifiants (fictifs)
must(L.entrepriseSet(d, { identifiants: 'CVI 51 000 00000 · Accise FR00000000000 (fictifs)' }));
const ap = d.apporteurs.find((a) => a.apporteur !== false) || d.apporteurs[0];
must(L.apporteurSave(d, { ...ap, ident: 'CVI 51 999 99999 (fictif)' }, ap.id));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.27.0-alpha.2-listes.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', '· contrôle', ctl, '· zone', zone, '· moment', moment, '· maintenance', mt, '· partenaire', ap.nom);
