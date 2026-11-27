// Base de test 0.40.0-alpha.2 (données fictives : jeu d'exemple) : la base 0.40.0-alpha.1 rouverte par cette version, avec
// - deux analyses enregistrées depuis un bulletin fictif à plusieurs tableaux (même échantillon réuni par son n° de laboratoire),
//   avec les nouveaux paramètres créés à la lecture : azote ammoniacal, azote alpha-aminé, chaptalisation (calcul du laboratoire).
// → test/fixtures/base-0.40.0-alpha.2-bulletins.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, bulletinEnregistrer, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.40.0-alpha.1-referentiel.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const R = L.getR(d); const P = Object.values(R.portions).filter((x) => x.vol > 500).sort((a, b) => b.vol - a.vol).slice(0, 2);
const params = [{ cle: 'azoteAmmoniacal', nom: 'Azote ammoniacal', unite: 'mg/L', dec: 0 }, { cle: 'azoteAmine', nom: 'Azote alpha-aminé', unite: 'mg/L', dec: 0 }, { cle: 'chaptalisation', nom: 'Chaptalisation (calcul du laboratoire)', unite: 'kg/hL', dec: 3 }];
const valeurs = [{ ph: 3.05, '+azoteAmmoniacal': 81, '+azoteAmine': 131, '+chaptalisation': 0.412 }, { ph: 3.21, '+azoteAmmoniacal': 64, '+azoteAmine': 148, '+chaptalisation': 0 }];
must(L.bulletinEnregistrer(d, { doc: { id: 'docfx402', nom: 'bulletin-fictif-plusieurs-tableaux.pdf', mime: 'application/pdf', taille: 4096 }, params, analyses: P.map((p, k) => ({ ref: `FX 40${k + 1}`, date: '2026-11-26', lotId: p.lotId, contenantId: p.contenantId || '', valeurs: valeurs[k], notes: `n° de laboratoire 26FX00040${k + 1} (fictif)` })) }));
d.meta.modifLe = '2026-11-27T21:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.40.0-alpha.2-bulletins.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', 'analyses', d.analyses.length);
