// Base de test 0.47.0-alpha.2 (données fictives) : la base 0.47.0-alpha.1 rouverte par cette version (libellés et coefficients d'origine
// corrigés une fois, tracés dans settings.termes047) ; sous-fraction « Cœur de cuvée » (rôle cuvée) ajoutée ; analyse d'un vin avec son
// TAV acquis → test/fixtures/base-0.47.0-alpha.2-termes.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, replay, fractionCont, analyseSave, tavParamId, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.47.0-alpha.1-echelles.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
must(L.fractionCont(d, 'add', null, { label: 'Cœur de cuvée', suffix: 'CC', pressurage: true, role: 'cuvee' }));
const R = L.replay(d); const vin = Object.values(R.lots).find((l) => (R.lotVol[l.id] || 0) > 0 && !/mout|moût/i.test(String(l.stade || '')));
must(L.analyseSave(d, { date: '2026-12-01', lotId: vin.id, modeleId: 'm_clair', valeurs: { [L.tavParamId(d)]: 11.4, ph: 3.12, so2l: 24, so2t: 70 }, notes: 'Analyse fictive (TAV acquis)' }));
d.meta.modifLe = '2026-12-17T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.47.0-alpha.2-termes.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, 'vin', vin.code, 'changements', d.settings.termes047.changements.length);
