// Base de test 0.43.0-alpha.3 (données fictives) : la base 0.43.0-alpha.2 rouverte par cette version, avec la configuration guidée
// appliquée en mode avancé (nom fictif, revendications avec VMN et HVE, opérateurs fictifs, campagne suivante, onglet d'ouverture)
// → test/fixtures/base-0.43.0-alpha.3-configuration.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, persoDefauts, persoPlan, persoAppliquer, persoMemoriser, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.43.0-alpha.2-plans.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const rep = { ...L.persoDefauts(d, {}), nom: 'Exploitation fictive', revendications: ['conv', 'bio', 'vmn', 'hve'], operateurs: 'Opératrice Fictive\nOpérateur Fictif', campagne: '2027-08-25', onglet: 'previsions', evv: '5100000000' };
const plan = L.persoPlan(d, 'avance', rep, {});
must(L.persoAppliquer(d, plan, '')); must(L.persoMemoriser(d, 'avance', rep, ''));
d.meta.modifLe = '2026-12-09T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.43.0-alpha.3-configuration.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', plan.changements.length, 'changements', d.lists.qualifs.map((q) => q.id + (q.masque ? '(m)' : '')).join(','));
