// Base de test 0.24.0-alpha.1 (données fictives : jeu d'exemple) : registre des pesées et carnet de pressoir du jeu d'exemple, plus une pesée
// corrigée avec motif, une pesée annulée, un marc en cours (chargé, volumes à compléter), un taux de rebêches, un pressoir et une bascule réglés
// → test/fixtures/base-0.24.0-alpha.1-pressoir.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '17-ia.js', '17b-langues.js', '17c-traductions.js', '18-mentions.js', '19-pressoir.js', '20-engine.js', '25-trace.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '34-acces.js', '35-seed.js'];
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { sampleDb, normalizeDb, syncConfig, peseeSave, marcSave, registreAnnuler, pressoirParamsSet, APP_VERSION, APP_NUM };')({});
const d0 = L.sampleDb(); d0.meta.creeAvec = '0.23.0-alpha.1'; d0.meta.appVersion = '0.23.0-alpha.1'; d0.meta.versions = ['0.23.0-alpha.1'];
const d = L.normalizeDb(d0); L.syncConfig(d);
const must = (r) => { if (!r.ok) throw new Error(r.msg); return r; };
const ctx = (h) => ({ maintenant: `2026-09-20T${h}:00`, par: '' });
const ap = d.apporteurs.find((a) => /Lefèvre/.test(a.nom)).id; const cru = d.crus.find((c) => c.nom === 'Cramant').id;
const p5 = must(L.peseeSave(d, { date: '2026-09-20', heure: '07:40', cepageId: 'chard', brutKg: 4250, tareKg: 250, caisses: 83, etat: 'sain', apporteurId: ap, cruId: cru, balanceId: 'bascule', mention: 'Lieu-dit « Les Roualles »' }, null, ctx('07:41'))).op;
must(L.peseeSave(d, { date: '2026-09-20', heure: '07:40', cepageId: 'chard', brutKg: 4250, tareKg: 260, caisses: 83, etat: 'sain', apporteurId: ap, cruId: cru, balanceId: 'bascule', mention: 'Lieu-dit « Les Roualles »' }, p5.id, { ...ctx('08:02'), motif: 'Tare des caisses recomptée' }));
const p6 = must(L.peseeSave(d, { date: '2026-09-20', heure: '08:10', cepageId: 'pm', kg: 1200, etat: 'faible' }, null, ctx('08:11'))).op;
must(L.registreAnnuler(d, p6.id, { ...ctx('08:30'), motif: 'Pesée saisie deux fois' }));
must(L.marcSave(d, { date: '2026-09-20', heureDebut: '09:00', equipementId: 'pressoir', charges: [{ apportId: p5.id, kg: 3990 }], code: 'P26-06', designation: 'Chardonnay 2026 – marc 6' }, null, ctx('09:02')));
must(L.pressoirParamsSet(d, { rebechesPct: { 2026: 0 }, dates: { 2026: { remiseCarnets: '2026-12-15' } } }));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.24.0-alpha.1-pressoir.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), d.journalPressoir.length, 'lignes de journal →', out, Math.round(fs.statSync(out).size / 1024), 'Ko');
