// Base de test 0.25.0-alpha.2 (données fictives : jeu d'exemple) : la base 0.25.0-alpha.1 rouverte par cette version, avec
// les relevés de pourriture selon l'état sanitaire (pesée « Sain » : pourriture non gardée), un relevé personnalisé proposé même
// si « Sain », un marc rosé avec un champ personnalisé du pressurage → test/fixtures/base-0.25.0-alpha.2-ops.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, formulaireSave, formulaireDe, peseeSave, marcSave, APP_VERSION, APP_NUM };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.25.0-alpha.1-pesee.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const must = (r) => { if (!r.ok) throw new Error(r.msg); return r; };
const c0 = L.formulaireDe(d, 'pesee');
must(L.formulaireSave(d, 'pesee', { champs: c0.champs, perso: [...c0.perso.map((p) => ({ ...p, siAltere: true })), { label: 'Raisins triés', type: 'ouinon', siAltere: false }] }));
must(L.formulaireSave(d, 'pressurage', { champs: {}, perso: [{ label: 'Programme du pressoir', type: 'liste', options: ['Champagne 1', 'Champagne 2'] }] }));
const [pg, tri] = L.formulaireDe(d, 'pesee').perso; const prog = L.formulaireDe(d, 'pressurage').perso[0].id;
const p = must(L.peseeSave(d, { date: '2026-09-23', heure: '07:20', cepageId: 'pn', kg: 4000, etat: 'sain', tap: 9.8, pourritureAcide: 2, champs: { [pg.id]: '4', [tri.id]: true } }, null, { maintenant: '2026-09-23T07:21:00', par: '' })).op;
must(L.marcSave(d, { date: '2026-09-23', heureDebut: '08:00', equipementId: 'pressoir', charges: [{ apportId: p.id, kg: 4000 }], code: 'PF-27', couleur: 'rose', champs: { [prog]: 'Champagne 2' } }, null, { maintenant: '2026-09-23T08:01:00', par: '' }));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.25.0-alpha.2-ops.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko');
