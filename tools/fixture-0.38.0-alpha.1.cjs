// Base de test 0.38.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.37.0-alpha.1 rouverte par cette version, avec
// - le chiffrement de l'équipe activé (mot de passe fictif « mot de passe fictif 0.38 », itérations réduites pour les tests) ;
// - l'assistant IA de l'espace de travail : service Claude, modèle commun, clé commune FICTIVE chiffrée avec la clé de l'équipe,
//   clés personnelles autorisées pour certains utilisateurs seulement.
// → test/fixtures/base-0.38.0-alpha.1-securite.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, chiffrementDeriver, chiffrementReglageNouveau, chiffrerTexte, iaEspaceRegler, iaMasque, APP_VERSION, APP_NUM };')({});
(async () => {
  const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
  const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.37.0-alpha.1-bulletins.json'), 'utf8'));
  const d = L.normalizeDb(base); L.syncConfig(d);
  const k = await L.chiffrementDeriver('mot de passe fictif 0.38', null, 10000);
  d.settings.chiffrement = await L.chiffrementReglageNouveau(k, '');
  const cle = 'sk-ant-FICTIVE-0-38-cle-commune';
  must(L.iaEspaceRegler(d, { fournisseur: 'anthropic', modele: 'claude-fictif-commun', cle: await L.chiffrerTexte(k, cle), cleId: k.cleId, masque: L.iaMasque(cle), perso: 'choisis', persoUtilisateurs: ['usrfx38'] }, ''));
  d.settings.ia.le = '2026-11-26T10:00:00.000Z';
  d.meta.modifLe = '2026-11-26T10:00:00Z';
  const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.38.0-alpha.1-securite.json');
  fs.writeFileSync(out, JSON.stringify(d));
  console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko · clé de l’équipe', k.cleId);
})();
