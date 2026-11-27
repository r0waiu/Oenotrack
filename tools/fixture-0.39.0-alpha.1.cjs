// Base de test 0.39.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.38.0-alpha.3 rouverte par cette version, avec
// - un plan de vinification enregistré (exemple d'Œnotrack, doses génériques « à vérifier », 12 colonnes) ;
// - une clé d'accès de l'opérateur « chai » dont l'accès a été retiré par l'administrateur, et son droit d'enregistrer ses appareils refusé ;
// - l'ordre des onglets enregistré avec le nouveau module « plan ».
// → test/fixtures/base-0.39.0-alpha.1-plan.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, planVinifSave, PLANV_EXEMPLE, cleModifier, clesEnregistrerRegler, modulesOrdre, clone, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.38.0-alpha.3-audit.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const adm = d.utilisateurs.find((u) => u.identifiant !== 'chai') || d.utilisateurs[0]; const chai = d.utilisateurs.find((u) => u.identifiant === 'chai');
const p = L.clone(L.PLANV_EXEMPLE()[0]); delete p.exemple; p.nom = 'Vinification en blanc (fictif)'; p.reference = 'OE-INS-00'; p.version = 'V1.0';
must(L.planVinifSave(d, p, null, adm.id));
const k = (chai.cles || [])[0]; must(L.cleModifier(d, chai.id, k.id, { acceptee: false, par: adm.id })); must(L.clesEnregistrerRegler(d, chai.id, false));
d.settings.modulesOrdre = L.modulesOrdre(d);
d.meta.modifLe = '2026-11-26T20:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.39.0-alpha.1-plan.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko');
