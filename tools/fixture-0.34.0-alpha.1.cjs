// Base de test 0.34.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.33.0-alpha.1 rouverte par cette version, avec
// - l'onglet d'ouverture réglé sur « Analyses » (settings.ongletDefaut) ;
// - une campagne antérieure « 2015-2016 » créée avant les campagnes existantes (marquée anterieure, vide) ;
// - le dossier réseau de l'entreprise renseigné (chemin et consigne fictifs, settings.dossierReseau)
// → test/fixtures/base-0.34.0-alpha.1-vinification.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, campCreate, ongletDefautSet, dossierReseauSet, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.33.0-alpha.1-profil.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const ad = d.utilisateurs.find((u) => u.profilId === 'pf_admin').id;
must(L.ongletDefautSet(d, 'analyses'));
const r = must(L.campCreate(d, '2015-2016', '2015-08-01', '2016-07-31'));
must(L.dossierReseauSet(d, { chemin: '\\\\serveur-fictif\\vinification\\Oenotrack', consigne: 'Connecter d’abord le lecteur Z: (consigne fictive)' }, ad));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.34.0-alpha.1-vinification.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko · campagne antérieure', r.anterieure, '·', d.campagnes.map((c) => c.id).join(', '));
