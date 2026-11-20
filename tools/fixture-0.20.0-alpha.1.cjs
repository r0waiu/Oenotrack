// Base de test 0.20.0-alpha.1 (données fictives : jeu d'exemple + intrants avec lien, référence, FT / FDS datées, versions archivées, veille)
// → test/fixtures/base-0.20.0-alpha.1-intrants.json. Les fichiers eux-mêmes ne sont pas dans la base (navigateur) : seules leurs fiches y figurent.
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = ['10-core.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '17-ia.js', '20-engine.js', '25-trace.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '34-acces.js', '35-seed.js'];
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { sampleDb, normalizeDb, syncConfig, produitSave, ficheJoindre, prodVeilleEnregistrer, APP_VERSION };')({});
const must = (r) => { if (!r || r.ok === false) throw new Error(r && r.msg); return r; };
const d = L.normalizeDb(L.sampleDb()); L.syncConfig(d);
const P = (nom) => d.produits.find((p) => p.nom === nom);
const so2 = P('Métabisulfite de potassium'); const lys = P('Lysozyme'); const gel = P('Gélatine liquide');
must(L.produitSave(d, { ...so2, reference: 'SK-25', lien: 'https://www.exemple-oenologie.fr/produits/metabisulfite' }, so2.id));
must(L.produitSave(d, { ...gel, reference: 'GL-30210', fdsNonRequise: true }, gel.id));
const pdf = (id, nom, taille) => ({ id, nom, mime: 'application/pdf', taille });
must(L.ficheJoindre(d, { cible: { type: 'produit', id: so2.id }, meta: pdf('docF21a', 'FDS_metabisulfite_2021.pdf', 182000), genre: 'fds', date: '2021-05-10', version: '1', action: 'ajouter', today: '2025-01-01' }));
must(L.ficheJoindre(d, { cible: { type: 'produit', id: so2.id }, meta: pdf('docF21b', 'FDS_metabisulfite_2025.pdf', 190000), genre: 'fds', date: '2025-02-14', version: '2', action: 'remplacer', today: '2026-11-19' }));
must(L.ficheJoindre(d, { cible: { type: 'produit', id: so2.id }, meta: pdf('docF21c', 'FT_metabisulfite.pdf', 95000), genre: 'ft', date: '2024-06-01', version: '3', action: 'ajouter' }));
must(L.ficheJoindre(d, { cible: { type: 'produit', id: lys.id }, meta: pdf('docF21d', 'FDS_lysozyme_2022.pdf', 120000), genre: 'fds', date: '2022-04-04', version: '1.0', action: 'ajouter' }));
must(L.ficheJoindre(d, { cible: { type: 'produit', id: lys.id }, meta: pdf('docF21e', 'Certificat_lysozyme.pdf', 40000), genre: 'certificat', date: '2025-01-10', action: 'ajouter' }));
must(L.prodVeilleEnregistrer(d, so2.id, { date: '2026-11-15', page: 'https://www.exemple-oenologie.fr/produits/metabisulfite', fds: { url: 'https://www.exemple-oenologie.fr/fds/metabisulfite-fr.pdf', date: '2026-06-01', version: '3' }, ft: { url: '', date: '' }, fabricant: 'Exemple Œnologie', remarque: '', sources: [{ url: 'https://www.exemple-oenologie.fr/produits/metabisulfite', titre: 'Métabisulfite — Exemple Œnologie' }], service: 'anthropic', modele: 'claude-sonnet-5-5', verifie: { page: true, fds: false, ft: false }, trouve: true }));
const hp = d.produitsHygiene[0];
must(L.ficheJoindre(d, { cible: { type: 'produitHygiene', id: hp.id }, meta: pdf('docF21f', 'FDS_soude_2019.pdf', 150000), genre: 'fds', date: '2019-03-01', action: 'ajouter' }));
must(L.ficheJoindre(d, { cible: { type: 'produitHygiene', id: hp.id }, meta: pdf('docF21g', 'FDS_soude_2024.pdf', 160000), genre: 'fds', date: '2024-09-01', action: 'remplacer', today: '2026-11-19' }));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.20.0-alpha.1-intrants.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, out, Math.round(fs.statSync(out).size / 1024), 'Ko', d.docs.filter((x) => x.cible.type === 'produit').length, 'document(s) d’intrants');
