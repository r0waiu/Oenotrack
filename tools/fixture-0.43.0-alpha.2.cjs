// Base de test 0.43.0-alpha.2 (données fictives : jeu d'exemple) : la base 0.43.0-alpha.1 rouverte par cette version, avec
// - un schéma de vinification enregistré (copie d'un exemple) converti en variante du plan à l'ouverture ;
// - une variante du plan pour un partenaire fictif du jeu d'exemple, une case et une opération liée modifiées directement ;
// - les étapes du plan appliquées à un lot (opérations à réaliser sans date, dans l'ordre).
// → test/fixtures/base-0.43.0-alpha.2-plans.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, replay, SCHEMAS_EXEMPLES, plansVinifDe, planVinifVariante, planVinifCellule, planVinifCellules, planVinifLigne, planVinifPourLotChoix, planVinifColonnePourLot, planVinifEtapes, planVinifAppliquer, opDef, lotCriteresPlan, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.43.0-alpha.1-labels.json'), 'utf8'));
base.schemas = [{ ...L.SCHEMAS_EXEMPLES()[0], id: 'sc-fictif', nom: 'Schéma fictif (chardonnay)' }];
const d = L.normalizeDb(base); L.syncConfig(d); const R = L.replay(d);
const lot = Object.values(R.lots).find((l) => (R.lotVol[l.id] || 0) > 100 && l.type !== 'mout' && L.lotCriteresPlan(d, R, l.id).apporteur && L.lotCriteresPlan(d, R, l.id).cepage);
const k = L.lotCriteresPlan(d, R, lot.id); const gen = L.plansVinifDe(d).find((p) => !p.conditions && !/^pv-sch-/.test(p.id));
const v = must(L.planVinifVariante(d, gen.id, { apporteurs: [k.apporteur] }, '')).id;
const P = L.plansVinifDe(d).find((p) => p.id === v); const l0 = P.lignes.find((l) => l.type === 'etape');
must(L.planVinifCellule(d, v, l0.id, L.planVinifCellules(P, l0)[0].key, '4 g/hL', '')); must(L.planVinifLigne(d, v, l0.id, 'operation', 'sulfitage', ''));
const R2 = L.replay(d); const ch = L.planVinifPourLotChoix(d, R2, lot.id); const pl = ch.meilleur; const c = L.planVinifColonnePourLot(d, R2, pl, lot.id);
const col = c.col || require('assert').fail('colonne'); const E = L.planVinifEtapes(d, R2, pl, col, R2.lotVol[lot.id]).filter((e) => e.opId).slice(0, 4);
const date = lot.date || '2026-09-20';
must(L.planVinifAppliquer(d, lot.id, pl, col.key, E.map((e) => ({ type: L.opDef(d, e.opId).base, date, f: { date }, resume: `${e.ligne.etape} · ${lot.code}`, notes: e.valeur, ligneId: e.ligne.id }))));
d.meta.modifLe = '2026-12-08T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.43.0-alpha.2-plans.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'plan retenu', pl.nom, 'étapes', E.length, 'convertis', d.plansVinif.filter((p) => /^pv-sch-/.test(p.id)).length);
