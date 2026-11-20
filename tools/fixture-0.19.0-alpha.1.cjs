// Base de test 0.19.0-alpha.1 (données fictives : jeu d'exemple + modèle de fiche personnalisé au format 0.19.0-alpha.1 + fiches imprimées) → test/fixtures/base-0.19.0-alpha.1-fiches.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '20-engine.js', '25-trace.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '34-acces.js', '35-seed.js'];
let src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { sampleDb, normalizeDb, modeleFicheSave, ficheAdd, APP_VERSION };')({});
const must = (r) => { if (!r || r.ok === false) throw new Error(r && r.msg); return r; };
const d = L.normalizeDb(L.sampleDb());
must(L.modeleFicheSave(d, { id: 'etapes', titre: 'Changements de stade', sous: 'Fin de fermentation, vin clair, élevage…', prefixe: 'STA', orientation: 'portrait', types: ['etape'], v: 2, logo: true, remarque: true, visas: true, visaResp: true, saisie: true,
  champs: ['Date {date}', 'Opérateur(s) {operateurs}', 'Cuve {cuve}'], couleurs: { th: '#000000', thTxt: '#FFFFFF' },
  tableaux: [{ titre: '', fill: 'etape', lignes: 12, zebre: false, fixes: '', cols: 'Cuve {cuve}\nLot {code}\nVolume (hL) {volHL}\nStade actuel {stadeAv}\nNouveau stade {stadeAp}\nContrôle (analyse, dégustation)\nVisa' }], notes: '' }));
const op = d.ops.find((o) => o.type === 'transfert');
must(L.ficheAdd(d, { modele: 'mouvements', ordre: `MVT-${op.date.slice(2, 4)}${op.date.slice(5, 7)}${op.date.slice(8, 10)}-1`, date: op.date, sources: [{ kind: 'op', id: op.id }] }));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.19.0-alpha.1-fiches.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, out, Math.round(fs.statSync(out).size / 1024), 'Ko', d.modelesFiches.length, 'modèle(s)', d.fiches.length, 'fiche(s)');
