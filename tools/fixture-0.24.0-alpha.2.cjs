// Base de test 0.24.0-alpha.2 (données fictives : jeu d'exemple) : la base 0.24.0-alpha.1 rouverte par cette version, avec des libellés
// personnalisés (matière, type de perte, fonction d'opérateur) qui ne doivent jamais être traduits, un contenant créé et une pesée de plus
// → test/fixtures/base-0.24.0-alpha.2-langues.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, contSave, peseeSave, APP_VERSION, APP_NUM };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.24.0-alpha.1-pressoir.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const must = (r) => { if (!r.ok) throw new Error(r.msg); return r; };
// libellés saisis par l'utilisateur : gardés tels quels dans toutes les langues
d.lists.matieres.push({ id: 'inox316', label: 'Inox 316L poli miroir', couleur: '#C9D2D8', finition: 'metal' });
d.lists.typesPerte.push({ id: 'lies_lourdes', label: 'Lies lourdes du foudre' });
const opr = d.operateurs.find((o) => o.actif !== false); if (opr) opr.fonction = 'Responsable cuverie et pressoir';
must(L.contSave(d, { nom: 'Cuve 31 – réserve perpétuelle', type: 'cuve', matiere: 'inox316', volMax: 3500, annee: 2026, fabricant: 'Ateliers du Grand Est' }));
must(L.peseeSave(d, { date: '2026-09-21', heure: '07:15', cepageId: 'pn', kg: 2100, etat: 'sain' }, null, { maintenant: '2026-09-21T07:16:00', par: '' }));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.24.0-alpha.2-langues.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko');
