// Base de test 0.26.0-alpha.2 (données fictives : jeu d'exemple) : la base 0.26.0-alpha.1 rouverte par cette version, avec une pesée
// pressée en deux marcs, comme dans l'onglet Pressoir — le premier chargé par « + Nouveau pressurage » (une partie de la pesée), le second
// par « Presser » sur la pesée (le reste, désignation proposée d'après le cépage) → test/fixtures/base-0.26.0-alpha.2-pressurage.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, peseeSave, peseeReste, marcSave, lbl, APP_VERSION, APP_NUM };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.26.0-alpha.1-plans.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const must = (r) => { if (!r.ok) throw new Error(r.msg); return r; };
const ctx = (h) => ({ maintenant: `2026-09-24T${h}:00`, par: '' });
const p = must(L.peseeSave(d, { date: '2026-09-24', heure: '07:40', cepageId: 'chard', kg: 6000, etat: 'sain', tap: 10.1 }, null, ctx('07:41'))).op;
must(L.marcSave(d, { date: '2026-09-24', heureDebut: '08:10', equipementId: 'pressoir', charges: [{ apportId: p.id, kg: 4000 }], code: 'PF-28', designation: 'Chardonnay 2026 – marc' }, null, ctx('08:11')));
// « Presser » sur la pesée : le reste est chargé, désignation proposée d'après le cépage
const reste = L.peseeReste(d, p.id);
must(L.marcSave(d, { date: '2026-09-24', heureDebut: '11:30', equipementId: 'pressoir', charges: [{ apportId: p.id, kg: reste }], code: 'PF-29', designation: `${L.lbl(d, 'cepages', 'chard')} 2026 – marc`, sousCharge: 'Fin de la pesée' }, null, ctx('11:31')));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.26.0-alpha.2-pressurage.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', '· pressé :', 6000 - L.peseeReste(d, p.id), 'kg');
