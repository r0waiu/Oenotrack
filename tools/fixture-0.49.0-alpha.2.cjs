// Base de test 0.49.0-alpha.2 (données fictives) : la base 0.49.0-alpha.1 rouverte par cette version ; un barème relu par l'IA en deux lots
// de pages (trace meta.ia, lecture 'ia') et une pesée proposée par l'IA → test/fixtures/base-0.49.0-alpha.2-ia-lots.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, iaBaremesLire, iaBaremesPagesDecaler, APP_VERSION };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.49.0-alpha.1-ia.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const p1 = []; for (let h = 0; h <= 60; h += 1) p1.push([h, 150 + h * 48]); const p2 = []; for (let h = 61; h <= 120; h += 1) p2.push([h, 150 + h * 48]);
const trace = { usage: 'baremes', modele: 'modele-fictif', fournisseur: 'anthropic', le: '2026-12-24T09:00:00Z' };
const tables = [...L.iaBaremesPagesDecaler({ tables: [{ page: 8, nom: 'C 88', certificat: 'R.X9.26.00088', uniteHauteur: 'cm', uniteVolume: 'L', capacite: 5900, lignes: p1 }] }, { debut: 1, fin: 8 }),
  ...L.iaBaremesPagesDecaler({ tables: [{ page: 1, nom: 'C 88', certificat: 'R.X9.26.00088', uniteHauteur: 'cm', uniteVolume: 'L', lignes: p2 }] }, { debut: 9, fin: 10 })];
const r = L.iaBaremesLire({ tables }, { fichier: 'certificat-fictif.pdf', trace }); if (!r.ok || r.baremes.length !== 1) throw new Error('barème relu');
const b = r.baremes[0]; d.baremes = [...(d.baremes || []), { id: 'bar-ia-lots', nom: b.nom, points: b.points, meta: b.meta, fiabilite: b.fiabilite, cible: 'cuve' }];
const pz = d.ops.find((o) => o.type === 'apport' && o.pesee); if (pz) pz.ia = { usage: 'pesee', modele: 'modele-fictif', fournisseur: 'anthropic', le: '2026-12-24T09:05:00Z' };
d.meta.modifLe = '2026-12-24T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.49.0-alpha.2-ia-lots.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, b.points.length, 'points');
