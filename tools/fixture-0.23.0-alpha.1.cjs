// Base de test 0.23.0-alpha.1 (données fictives : jeu d'exemple, même format qu'en 0.22.0-alpha.2 ; la page d'accueil ne laisse rien dans la base)
// ouverte en 0.22.0-alpha.2 puis 0.23.0-alpha.1, une opération enregistrée par cette version
// (av = 23 000 001) → test/fixtures/base-0.23.0-alpha.1-accueil.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '17-ia.js', '18-mentions.js', '19-pressoir.js', '20-engine.js', '25-trace.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '34-acces.js', '35-seed.js'];
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { sampleDb, normalizeDb, syncConfig, opSave, APP_VERSION, APP_NUM };')({});
const d0 = L.sampleDb(); d0.meta.creeAvec = '0.22.0-alpha.2'; d0.meta.appVersion = '0.22.0-alpha.2'; d0.meta.versions = ['0.22.0-alpha.2'];
const d = L.normalizeDb(d0); L.syncConfig(d);
const fo = d.ops.find((o) => o.type === 'jaugeage');
const r = L.opSave(d, { type: 'jaugeage', date: fo.date, portionId: fo.portionId, volMesure: fo.volMesure, typeId: fo.typeId, notes: 'enregistrée en 0.23.0-alpha.1' }, fo.id);
if (!r.ok || r.op.av !== L.APP_NUM) throw new Error('opération non enregistrée');
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.23.0-alpha.1-accueil.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), out, Math.round(fs.statSync(out).size / 1024), 'Ko');
