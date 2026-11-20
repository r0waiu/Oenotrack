// Base de test 0.22.0-alpha.1 (données fictives : jeu d'exemple + cahier d'épalement de démonstration test/fixtures/jauge) : contenant
// « Cuve 42 » créé avec son barème de jaugeage (cahier lu, document d'origine rattaché au barème), puis barème remplacé lors d'une
// modification du contenant (l'ancien archivé) → test/fixtures/base-0.22.0-alpha.1-contenant-bareme.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '17-ia.js', '18-mentions.js', '19-pressoir.js', '20-engine.js', '25-trace.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '34-acces.js', '35-seed.js'];
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { sampleDb, normalizeDb, syncConfig, contSave, baremeSave, docMetaAdd, jaugeAnalyser, jaugePageDeTexte, matierePourBareme, baremeCapacite, APP_VERSION };')({});
const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
const texte = fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'jauge', 'cahier-demo-cuve-42.txt'), 'utf8');
const b = L.jaugeAnalyser([L.jaugePageDeTexte(texte)], { fichier: 'cahier-demo-cuve-42.txt' }).baremes[0];
// création : nom, capacité, fabricant et matière repris du cahier, barème enregistré dans la même action
const rc = L.contSave(d, { nom: b.reservoir, type: d.lists.typesContenant[0].id, matiere: (L.matierePourBareme(d, b.meta.materiau) || {}).id, volMax: String(L.baremeCapacite(b)), statut: 'actif', siteId: d.sites[0].id, fabricant: b.meta.constructeur, annee: '', notes: '' }, null);
const { reservoir, fiabilite, ...bb } = b;
const rb = L.baremeSave(d, { ...bb, cible: 'contenant', contenantId: rc.id, docId: 'doc-demo-42', meta: { ...b.meta, fiabilite } });
L.docMetaAdd(d, { id: 'doc-demo-42', nom: 'cahier-demo-cuve-42.txt', mime: 'text/plain', taille: texte.length, cat: 'autre', cible: { type: 'bareme', id: rb.id } });
// modification : nouveau barème (valeur corrigée à la main), l'ancien archivé
const pts = bb.points.map((p) => (p[0] === 100 ? [100, 2130] : p));
L.baremeSave(d, { ...bb, points: pts, corrections: [{ h: 100, lu: '2125', v: 2130, mode: 'manuel' }], cible: 'contenant', contenantId: rc.id, meta: { ...b.meta, fiabilite } });
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.22.0-alpha.1-contenant-bareme.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, out, Math.round(fs.statSync(out).size / 1024), 'Ko');
