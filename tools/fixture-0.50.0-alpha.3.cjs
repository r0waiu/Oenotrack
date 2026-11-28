// Base de test 0.50.0-alpha.3 (données fictives) : la base 0.50.0-alpha.2 rouverte par cette version ; appellations Champagne et Sauternes
// reliées au référentiel, parcelles rattachées (dont une plantée d'un cépage hors cahier des charges), cépages ajoutés depuis le cahier
// des charges de Champagne → test/fixtures/base-0.50.0-alpha.3-cahiers.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, appellationDepuisRef, cdcCepagesAjouter, parcelleSave, APP_VERSION };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.50.0-alpha.2-mise.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const ok = (r, m) => { if (!r.ok) throw new Error(`${m} : ${r.msg}`); return r; };
const ch = ok(L.appellationDepuisRef(d, 'champagne:champagne'), 'Champagne'); ok(L.appellationDepuisRef(d, 'bordeaux:sauternes'), 'Sauternes');
ok(L.cdcCepagesAjouter(d, ch.id, ['Arbane', 'Petit meslier']), 'cépages');
(d.parcelles || []).slice(0, 3).forEach((p) => { p.appellationId = ch.id; });
if (!d.lists.cepages.some((c) => c.id === 'cep-fx-merlot')) d.lists.cepages.push({ id: 'cep-fx-merlot', label: 'Merlot' });
ok(L.parcelleSave(d, { nom: 'Parcelle fictive hors cahier', cruId: d.crus[0].id, cepageId: 'cep-fx-merlot', surface: 30, appellationId: ch.id }), 'parcelle');
d.meta.modifLe = '2026-12-27T10:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.50.0-alpha.3-cahiers.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, '→', out);
