// Base de test 0.25.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.24.0-alpha.2 rouverte par cette version, avec le formulaire
// de pesée personnalisé (caisses repliées, TAP obligatoire, état sanitaire proposé, relevé « Pourriture grise (%) ») et deux pesées
// portant TAP, pourriture acide et relevé personnalisé (l'une sous le minimum de richesse en sucre)
// → test/fixtures/base-0.25.0-alpha.1-pesee.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, formulaireSave, formulaireDe, peseeSave, APP_VERSION, APP_NUM };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.24.0-alpha.2-langues.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const must = (r) => { if (!r.ok) throw new Error(r.msg); return r; };
must(L.formulaireSave(d, 'pesee', { champs: { caisses: { vis: 'replie' }, tap: { obligatoire: true }, etat: { defaut: 'sain' } }, perso: [{ label: 'Pourriture grise', type: 'nombre', unite: '%', min: 0, max: 100 }] }));
const pg = L.formulaireDe(d, 'pesee').perso[0].id; const ap = (d.apporteurs[0] || {}).id;
must(L.peseeSave(d, { date: '2026-09-22', heure: '07:30', cepageId: 'chard', brutKg: 4150, tareKg: 150, apporteurId: ap, etat: 'faible', tap: 8.2, pourritureAcide: 3, champs: { [pg]: '5' } }, null, { maintenant: '2026-09-22T07:31:00', par: '' }));
must(L.peseeSave(d, { date: '2026-09-22', heure: '08:10', cepageId: 'pn', kg: 3000, etat: 'sain', tap: 10.1 }, null, { maintenant: '2026-09-22T08:11:00', par: '' }));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.25.0-alpha.1-pesee.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko');
