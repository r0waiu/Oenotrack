// Base de test 0.50.0-alpha.2 (données fictives) : la base 0.50.0-alpha.1 rouverte par cette version ; un chantier de mise (prestataire
// fictif), une mise en bouteille (deux formats, casse, bouchage vis + capsule CRD, DDM, filtration, azote, contrôles) → lot fini, habillé
// → test/fixtures/base-0.50.0-alpha.2-mise.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, replay, chantierMiseSave, miseSave, fournisseurSave, habillageSave, misesListe, APP_VERSION };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.50.0-alpha.1-vignoble.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const ok = (r, m) => { if (!r.ok) throw new Error(`${m} : ${r.msg}`); return r; };
ok(L.fournisseurSave(d, { nom: 'Embouteilleur fictif', roles: ['prestataire_mise'] }), 'prestataire'); const pr = d.fournisseurs.find((f) => f.nom === 'Embouteilleur fictif');
const date = '2026-11-25'; const R = L.replay(d, date); const p = Object.values(R.portions).filter((x) => x.vol > 400).sort((a, b) => b.vol - a.vol)[0];
const ch = ok(L.chantierMiseSave(d, { nom: 'Mise fictive', dateDebut: date, realisation: 'prestataire', prestataireId: pr.id, ligne: { tireuse: true, boucheuse: true, capsuleuse: true } }, null, 'u1'), 'chantier');
ok(L.miseSave(d, { date, heure: '08:00', chantierId: ch.id, sources: [{ portionId: p.id, volL: 380 }], formats: [{ format: 'bouteille', nb: 480 }, { format: 'magnum', nb: 12 }], casse: 4, code: 'MB26-FX1', designation: 'Vin fictif mis en bouteille', ddm: '2031-12-31',
  bouchage: { type: 'vis', capsule: 'crd' }, filtration: 'sterilisante', gaz: ['azote'], controles: [{ heure: '08:30', type: 'so2l', mesure: 31, cible: 30 }, { heure: '09:00', type: 'niveau', mesure: 63, cible: 63 }] }), 'mise');
const op = L.misesListe(d)[0]; const fini = d.lotsFinis.find((f) => f.opId === op.id);
if (typeof L.habillageSave === 'function') ok(L.habillageSave(d, { type: 'habillage', date: '2026-11-26', source: { type: 'fini', id: fini.id }, nb: 200, code: 'H26-FX1' }, null, { par: 'u1' }), 'habillage');
d.meta.modifLe = '2026-12-26T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.50.0-alpha.2-mise.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, fini.code, fini.nb);
