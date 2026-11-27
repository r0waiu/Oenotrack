// Base de test 0.42.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.41.0-alpha.1 rouverte par cette version, avec
// - un profil de tirage (levain 5 %, liqueur 500 g/L, un adjuvant de remuage fictif) ;
// - une liqueur de tirage fondue (fonte : titre, sucre, vin de fonte, densité) ;
// - un levain avec son eau, sa liqueur et son plan de propagation (deux jours de tirage), suivi par trois opérations « alimentation »
//   (réhydratation, alimentation en vin, liqueur et eau, relevé avec volume mesuré) ;
// - un tirage qui utilise ce levain et cette liqueur (VRTP calculable).
// → test/fixtures/base-0.42.0-alpha.1-tirage.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, opSave, tirageProfilSet, levainPlanSet, liqueurFonte, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.41.0-alpha.1-codification.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
must(L.tirageProfilSet(d, { levainPct: 5, titreLiqueurGL: 500, adjuvants: [{ id: 'adjfx', nom: 'Adjuvant de remuage fictif', doseLhL: 0.1 }] }, ''));
const R = L.getR(d, '2026-11-27'); const P = Object.values(R.portions).filter((p) => p.vol > 2000 && (R.lots[p.lotId] || {}).type !== 'mout' && (R.lots[p.lotId] || {}).qualif === 'conv').sort((a, b) => b.vol - a.vol);
const pv = P[0]; const pv2 = P[1] || P[0];
const fo = L.liqueurFonte({ volL: 200 }, 500, 0.66);
const liq = must(L.opSave(d, { type: 'preparation', date: '2026-11-27', ptype: 'liqueur_tirage', qualifId: 'conv', code: 'LT-FX-01', volL: 200, sourcePortionId: pv.id, sourceVolL: Math.round(fo.vinL), lignes: [], fonte: { titreGL: 500, sucreKg: fo.sucreKg, volSucreLkg: 0.66, vinL: Math.round(fo.vinL), densite: 1220, tempC: 18, densite20: 1219.4 } })).op;
const lev = must(L.opSave(d, { type: 'preparation', date: '2026-11-27', ptype: 'levain', qualifId: 'conv', code: 'LEV-FX-01', volL: 100, eauL: 20, prepUses: [{ prepId: liq.prepId, volL: 10 }], sourcePortionId: pv.id, sourceVolL: 60, lignes: [] })).op;
must(L.levainPlanSet(d, lev.prepId, { mixTotalL: 3000, jours: [{ date: '2026-12-01', cols: 2000 }, { date: '2026-12-02', cols: 2000 }], sur: { levainPct: 5 } }));
must(L.opSave(d, { type: 'alimentation', date: '2026-11-28', heure: '08:00', prepId: lev.prepId, etape: 'rehydratation', eauL: 4, lignes: [], mesures: { tempCible: 35, tempReleve: 34 } }));
must(L.opSave(d, { type: 'alimentation', date: '2026-11-29', heure: '17:30', prepId: lev.prepId, etape: 'mult2', sourcePortionId: pv2.id, sourceVolL: 40, prepUses: [{ prepId: liq.prepId, volL: 8 }], eauL: 10, lignes: [], mesures: { densite: 1004, aerationMatin: true, aerationSoir: true } }));
must(L.opSave(d, { type: 'alimentation', date: '2026-11-30', prepId: lev.prepId, etape: 'releve', volMesureL: 160, lignes: [], mesures: { densite: 1002, populationMml: 45, viabilitePct: 92 } }));
const R2 = L.getR(d, '2026-12-01'); const pt = Object.values(R2.portions).filter((p) => p.vol > 1500 && (R2.lots[p.lotId] || {}).qualif === 'conv' && (R2.lots[p.lotId] || {}).type !== 'mout').sort((a, b) => b.vol - a.vol)[0];
must(L.opSave(d, { type: 'tirage', date: '2026-12-01', sources: [{ portionId: pt.id, lotId: pt.lotId, volL: 1350 }], prepUses: [{ prepId: lev.prepId, volL: 75 }, { prepId: liq.prepId, volL: 72 }], lignes: [], nbBouteilles: 2000, volBouteilleL: 0.75, densBase: 0.993, densMix: 1.0026, lotSpec: { code: 'T-FX-LEV', designation: 'Tirage fictif (levain suivi)', millesime: '2026' } }));
d.meta.modifLe = '2026-12-01T20:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.42.0-alpha.1-tirage.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'levain restant', L.getR(d).preps[lev.prepId].remaining);
