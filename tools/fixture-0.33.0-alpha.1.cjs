// Base de test 0.33.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.32.0-alpha.1 rouverte par cette version, avec
// - des réglages faits à la main avant le profil : délestage proposé, 2e taille hors du formulaire de pressurage, une appellation saisie ;
// - le profil « Champagne » appliqué (effervescents, blancs, rosés), l'appellation « Rosé des Riceys » décochée dans l'aperçu
// → test/fixtures/base-0.33.0-alpha.1-profil.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, profilPlan, profilAppliquer, listAdd, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.32.0-alpha.1-drm.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const ad = d.utilisateurs.find((u) => u.profilId === 'pf_admin').id;
// réglages faits à la main (jamais écrasés par un profil)
d.lists.operations.find((o) => o.id === 'delestage').masque = false;
d.lists.fractions.find((f) => f.id === 'taille2').pressurage = false;
must(L.listAdd(d, 'appellations', 'Appellation fictive (jeu d’essai)'));
// profil Champagne : effervescents, blancs et rosés ; « Rosé des Riceys » décochée
const types = ['effervescent', 'blanc', 'rose']; const plan = L.profilPlan(d, 'champagne', types);
const r = must(L.profilAppliquer(d, 'champagne', types, plan.map((x) => x.id).filter((id) => id !== 'appellation:Rosé des Riceys'), ad));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.33.0-alpha.1-profil.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko · changements', r.n, '·', plan.map((x) => x.id).join(', '));
