// Base de test 0.21.0-alpha.1 (données fictives : jeu d'exemple). Les informations légales ne sont jamais dans la base (config.json du site
// ou réglage du navigateur) : cette base a le même format qu'en 0.20.0-alpha.1 → test/fixtures/base-0.21.0-alpha.1-legal.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '17-ia.js', '18-mentions.js', '19-pressoir.js', '20-engine.js', '25-trace.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '34-acces.js', '35-seed.js'];
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { sampleDb, normalizeDb, syncConfig, produitSave, APP_VERSION };')({});
const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
const p = d.produits.find((x) => x.nom === 'Lysozyme'); L.produitSave(d, { ...p, reference: 'LYS-22', lien: 'https://www.exemple-oenologie.fr/lysozyme' }, p.id);
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.21.0-alpha.1-legal.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, out, Math.round(fs.statSync(out).size / 1024), 'Ko');
