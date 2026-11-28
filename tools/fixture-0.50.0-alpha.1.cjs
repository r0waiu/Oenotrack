// Base de test 0.50.0-alpha.1 (données fictives) : la base 0.49.0-alpha.2 rouverte par cette version, passée au réglage Vignoble en
// direct — région Bordeaux, appellations du référentiel (Sauternes, Castillon Côtes de Bordeaux, Vin de France), types déduits, une
// exception forcée (Cave toujours affiché), valeurs du pressoir champenois gardées → test/fixtures/base-0.50.0-alpha.1-vignoble.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, appRef, profilEnregistrer, profilForcer, vignobleAppellationAjouter, APP_VERSION };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.49.0-alpha.2-ia-lots.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
d.settings.pressoir = { ...(d.settings.pressoir || {}), profil: 'champagne', valeurs: { marcKg: 4100 } };
const ref = (nom) => { const a = L.appRef().find((x) => x.nom === nom); if (!a) throw new Error(nom); return a.id; };
const ok = (r, m) => { if (!r.ok) throw new Error(`${m} : ${r.msg}`); };
ok(L.profilEnregistrer(d, { region: 'bordeaux', typesAuto: true, types: ['rouge'] }, 'u1'), 'région');
['Sauternes', 'Castillon Côtes de Bordeaux', 'Vin de France'].forEach((n) => ok(L.vignobleAppellationAjouter(d, ref(n), 'u1'), n));
ok(L.profilForcer(d, 'module:cave', 'affiche', 'u1'), 'exception');
d.meta.modifLe = '2026-12-25T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.50.0-alpha.1-vignoble.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, d.settings.profilViticole.types.join(','), JSON.stringify(d.settings.profilViticole.forces));
