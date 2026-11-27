// Base de test 0.42.0-alpha.2 (données fictives : jeu d'exemple) : la base 0.42.0-alpha.1 rouverte par cette version, avec
// - un fournisseur au rôle « prestataire de tirage » et un chantier (prestataire, ligne : injecteuse, 32 becs, marquage laser) ;
// - une cuve de mixtion (assemblage marqué mixtion : vin + liqueur + levain, point de tirage, densités) et un lot tiré de cette cuve
//   (mode mixtion, bouteilles et magnums, casse) ;
// - un lot tiré par pompe doseuse (consignes, contrôle à l'éprouvette) rattaché au même chantier.
// → test/fixtures/base-0.42.0-alpha.2-chantier.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, replay, opSave, fournisseurSave, chantierTirageSave, tirageFormatsCompat, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.42.0-alpha.1-tirage.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
must(L.fournisseurSave(d, { nom: 'Prestataire fictif de tirage', contact: '', roles: ['prestataire_tirage'] }));
const pr = d.fournisseurs.find((f) => f.nom === 'Prestataire fictif de tirage');
const ch = must(L.chantierTirageSave(d, { nom: 'Tirage fictif', dateDebut: '2026-12-02', dateFin: '2026-12-03', realisation: 'prestataire', prestataireId: pr.id, ligne: { tireuse: true, injecteuse: true, capsuleuse: true, nbBecs: 32, marquage: 'laser' } }, null, '')).id;
const R = L.replay(d, '2026-12-02'); const P = Object.values(R.portions).filter((p) => p.vol > 900 && (R.lots[p.lotId] || {}).qualif === 'conv' && !['mout', 'cuvee_tirage'].includes((R.lots[p.lotId] || {}).type)).sort((a, b) => b.vol - a.vol);
const liq = Object.values(R.preps).find((p) => p.code === 'LT-FX-01'); const lev = Object.values(R.preps).find((p) => p.code === 'LEV-FX-01');
const vide = d.contenants.find((c) => !Object.values(R.portions).some((p) => p.contenantId === c.id && p.vol > 0.5) && num(c.capaciteL || c.capacite || 0) >= 1000) || d.contenants.find((c) => !Object.values(R.portions).some((p) => p.contenantId === c.id && p.vol > 0.5));
function num(x) { return Number(String(x == null ? '' : x).replace(',', '.')) || 0; }
const mix = must(L.opSave(d, { type: 'assemblage', date: '2026-12-02', sources: [{ portionId: P[0].id, lotId: P[0].lotId, volL: 900 }], destId: vide.id, pertes: [], lignes: [], mixtion: true, prepUses: [{ prepId: liq.id, volL: 45 }, { prepId: lev.id, volL: 50 }], pointGL: 24, densBase: 993, densMix: 1002.4, lotSpec: { code: 'MIX-FX-01', designation: 'Cuve de mixtion fictive', millesime: '2026', type: 'assemblage' } })).op;
const R2 = L.replay(d, '2026-12-03'); const pm = Object.values(R2.portions).find((p) => p.lotId === mix.lotId);
const F1 = [{ format: 'bouteille', nb: 1100, L: 0.75 }, { format: 'magnum', nb: 60, L: 1.5 }];
must(L.opSave(d, { type: 'tirage', date: '2026-12-03', sources: [{ portionId: pm.id, lotId: mix.lotId, volL: 915 }], prepUses: [], lignes: [], formats: F1, ...L.tirageFormatsCompat(F1), mode: 'mixtion', chantierId: ch, casse: 6, pointGL: 24, lotSpec: { code: 'T-FX-MIX', designation: 'Tirage fictif (mixtion)', millesime: '2026' } }));
const F2 = [{ format: 'bouteille', nb: 300, L: 0.75 }];
must(L.opSave(d, { type: 'tirage', date: '2026-12-03', sources: [{ portionId: P[1].id, lotId: P[1].lotId, volL: 205 }], prepUses: [{ prepId: liq.id, volL: 10.8 }, { prepId: lev.id, volL: 11.25 }], lignes: [], formats: F2, ...L.tirageFormatsCompat(F2), mode: 'pompe', chantierId: ch, pointGL: 24, pompe: { consignes: { liqueurPct: 4.8, levainPct: 5 }, debitColsH: 3000, tolerancePct: 2, controles: [{ heure: '09:30', type: 'eprouvette', nCols: 1, mesure: 36.4, cible: 36, operateur: 'Opérateur fictif' }] }, lotSpec: { code: 'T-FX-POMPE', designation: 'Tirage fictif (pompe doseuse)', millesime: '2026' } }));
d.meta.modifLe = '2026-12-03T20:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.42.0-alpha.2-chantier.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'mixtion', pm && pm.vol);
