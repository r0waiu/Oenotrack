// Base de test 0.29.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.28.0-alpha.1 rouverte par cette version, avec
// - les fiches personnalisées : disposition commune de la fiche des cuves (rubrique masquée, ordre changé, rubrique d'une version
//   future gardée) et ajustement personnel de l'opérateur (fiche des lots, sur son compte) ;
// - une saisie groupée validée (sulfitage de trois cuves, une opération par cuve reliées par op.groupe) et une saisie groupée
//   planifiée (levurage de deux cuves, opérations à réaliser reliées par p.groupe) ;
// - une fermentation qui ralentit (lot passé en FA, relevés de densité et de température), un enrichissement préparé par le simulateur ;
// - les réglages : alertes de fermentation, QR codes (adresse fictive), chiffrement (mot de passe fictif « Essai-0290-chiffrement »,
//   1 000 itérations pour des tests rapides — la base elle-même reste en clair, comme sur chaque appareil)
// → test/fixtures/base-0.29.0-alpha.1-cave.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, contParts, opsGroupeEnregistrer, previsionsGroupeEnregistrer, ficheReglageCommunSet, ficheReglagePersoSet, opSave, chiffrementDeriver, chiffrementReglageNouveau, APP_VERSION, APP_NUM, stadeRole };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
(async () => {
  const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.28.0-alpha.1-audits.json'), 'utf8'));
  const d = L.normalizeDb(base); L.syncConfig(d);
  const op = d.utilisateurs.find((u) => u.profilId === 'pf_operateur').id;
  // fiches personnalisées
  must(L.ficheReglageCommunSet(d, 'cont', { ordre: ['lots', 'fermentation', 'historique', 'composition', 'intrants', 'ajouts', 'hygiene', 'analyses', 'mouts', 'jauge', 'rubriqueFuture'], masques: ['jauge', 'rubriqueFuture'] }));
  must(L.ficheReglagePersoSet(d, op, 'lot', { ordre: ['operations', 'stades', 'fermentation'], masques: ['bilan', 'genealogie'] }));
  // saisie groupée validée : sulfitage de trois cuves (5 g/hL)
  const D0 = '2026-11-20'; const R0 = L.getR(d, D0);
  const pleines = d.contenants.filter((c) => c.statut !== 'archive').map((c) => ({ c, ps: L.contParts(R0, c.id).filter((p) => p.vol > 50) })).filter((x) => x.ps.length === 1).slice(0, 5);
  const so2 = d.produits.find((p) => /bisulfite/i.test(p.nom)); const arr = d.arrivages.find((a) => a.produitId === so2.id);
  const lignes = pleines.slice(0, 3).map((x) => ({ titre: x.c.nom, spec: { type: 'intrant', sousType: 'sulfitage', date: D0, notes: '', portionId: x.ps[0].portionId, lignes: [{ produitId: so2.id, arrivageId: arr ? arr.id : '', qty: Math.round(x.ps[0].vol * 5 / 100) }], prepUses: [], motif: 'Sulfitage', groupe: { action: 'sulfitage' } } }));
  const g1 = 'grp-fixture-0291'; must(L.opsGroupeEnregistrer(d, g1, lignes, [], {}));
  // saisie groupée planifiée : levurage de deux cuves
  const lev = d.produits.find((p) => /levure fermentation/i.test(p.nom));
  const items = pleines.slice(3, 5).map((x) => ({ type: 'intrant', date: '2026-11-23', resume: `Levurage · ${x.c.nom} (fictif)`, notes: '', groupe: { action: 'levurage' }, f: { date: '2026-11-23', sousType: 'levurage', portionId: x.ps[0].portionId, lignes: [{ produitId: lev.id, arrivageId: '', qty: String(Math.round(x.ps[0].vol * 20 / 100)) }], prepUses: [], motif: 'Levurage', operateurs: [], notes: '' } }));
  const g2 = 'grp-fixture-0292'; must(L.previsionsGroupeEnregistrer(d, g2, items, []));
  // fermentation qui ralentit : un lot passé en FA, relevés de densité et de température
  const cf = pleines[0]; const lotF = cf.ps[0].lotId; const pidF = cf.ps[0].portionId;
  must(L.opSave(d, { type: 'etape', date: '2026-11-10', notes: '', lotId: lotF, newStade: L.stadeRole(d, 'levurage') || 'fa' }));
  [['2026-11-12', 1.082, 17], ['2026-11-14', 1.071, 19], ['2026-11-16', 1.0695, 20], ['2026-11-18', 1.0692, 20.5]].forEach(([date, densite, tempC]) => must(L.opSave(d, { type: 'suivi', date, notes: '', portionId: L.getR(d, date).portions[pidF] ? pidF : pidF, lignes: [], prepUses: [], motif: 'Densité / température', densite, tempC })));
  // enrichissement préparé par le simulateur (sucre)
  const sucre = d.produits.find((p) => /sucre/i.test(p.nom)); const ce = pleines[1];
  must(L.opSave(d, { type: 'intrant', sousType: 'enrichissement', date: '2026-11-19', notes: '', portionId: ce.ps[0].portionId, lignes: [{ produitId: sucre.id, arrivageId: '', qty: 33.8 }], prepUses: [], motif: 'Enrichissement', enrichissement: { tap: 9.5, tav: 10.5, methode: 'sucre', sucreKg: 33.8, volL: Math.round(ce.ps[0].vol) } }));
  // réglages
  d.settings.fermentation = { actif: true, lente: 0.002, arret: 0.0005, fin: 0.998, recent: 3 };
  d.settings.qr = { mode: 'lien', base: 'https://cave.exemple.fr/oenotrack/' };
  const k = await L.chiffrementDeriver('Essai-0290-chiffrement', null, 1000); d.settings.chiffrement = await L.chiffrementReglageNouveau(k, d.utilisateurs[0].id);
  const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.29.0-alpha.1-cave.json');
  fs.writeFileSync(out, JSON.stringify(d));
  console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', '· groupe', d.ops.filter((o) => o.groupe).length, '· prévus', d.previsions.filter((p) => p.groupe).length, '· clé', d.settings.chiffrement.cleId);
})().catch((e) => { console.error(e); process.exit(1); });
