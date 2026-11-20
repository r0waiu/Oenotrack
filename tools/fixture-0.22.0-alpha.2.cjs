// Base de test 0.22.0-alpha.2 (données fictives : jeu d'exemple) : étiquettes de version des deux numérotations précédentes et de la nouvelle
// (créée avec « alpha V1.9 », ouverte avec « alpha V2.2 » et « alpha V18.2 », puis 0.22.0-alpha.2) et une opération enregistrée par cette version
// (av = 22 000 002) → test/fixtures/base-0.22.0-alpha.2-versions.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '17-ia.js', '18-mentions.js', '19-pressoir.js', '20-engine.js', '25-trace.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '34-acces.js', '35-seed.js'];
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { sampleDb, normalizeDb, syncConfig, opSave, APP_VERSION, APP_NUM };')({});
const d0 = L.sampleDb(); d0.meta.creeAvec = 'alpha V1.9'; d0.meta.appVersion = 'alpha V18.2'; d0.meta.versions = ['alpha V1.9', 'alpha V2.2', 'alpha V18.2'];
const d = L.normalizeDb(d0); L.syncConfig(d);
const fo = d.ops.find((o) => o.type === 'jaugeage');
const r = L.opSave(d, { type: 'jaugeage', date: fo.date, portionId: fo.portionId, volMesure: fo.volMesure, typeId: fo.typeId, notes: 'enregistrée en 0.22.0-alpha.2' }, fo.id);
if (!r.ok || r.op.av !== L.APP_NUM) throw new Error('opération non enregistrée');
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.22.0-alpha.2-versions.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), out, Math.round(fs.statSync(out).size / 1024), 'Ko');
