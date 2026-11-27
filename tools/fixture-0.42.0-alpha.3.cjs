// Base de test 0.42.0-alpha.3 (données fictives : jeu d'exemple) : la base 0.42.0-alpha.2 rouverte par cette version, avec
// - des fournitures de tirage : bouteille 75 cl (type, verrier fictif, format), magnum fictif, capsule suivie par lot sans décompte ;
// - des lots fournisseurs reçus, un contrôle de réception de la verrerie accepté, un lot refusé et retourné au fournisseur ;
// - un lot tiré par pompe doseuse avec ses fournitures (bouteilles et magnums décomptés, capsules tracées sans décompte) ;
// - la fiche d'enregistrement de la chaîne (HACCP) du chantier : démarrage, contrôles, conditionnement, incident, visas.
// → test/fixtures/base-0.42.0-alpha.3-fournitures.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, replay, opSave, produitSave, arrivageSave, arrivageControleSave, fournitureRetourSave, tirageFournituresSpec, chantierHaccpSet, tirageFormatsCompat, APP_VERSION };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.42.0-alpha.2-chantier.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const pB = must(L.produitSave(d, { nom: 'Bouteille fictive 75 cl', categorie: 'sec', unite: 'u', fourniture: { type: 'bouteille', caracs: { verrier: 'Verrier fictif', modele: 'Champenoise fictive', format: 'bouteille', teinte: 'feuille morte', bague: '29' } } })).id;
const pM = must(L.produitSave(d, { nom: 'Magnum fictif', categorie: 'sec', unite: 'u', fourniture: { type: 'bouteille', caracs: { verrier: 'Verrier fictif', format: 'magnum' } } })).id;
const pC = must(L.produitSave(d, { nom: 'Capsule fictive 29 mm', categorie: 'sec', unite: 'u', suiviStock: false, fourniture: { type: 'capsule', caracs: { diametre: '29', matiere: 'inox' } } })).id;
const aB = must(L.arrivageSave(d, { produitId: pB, numLot: 'VF-2611', date: '2026-11-25', qty: 6000 })).id;
const aB2 = must(L.arrivageSave(d, { produitId: pB, numLot: 'VF-2612', date: '2026-11-26', qty: 1200 })).id;
const aM = must(L.arrivageSave(d, { produitId: pM, numLot: 'VFM-2611', date: '2026-11-25', qty: 300 })).id;
const aC = must(L.arrivageSave(d, { produitId: pC, numLot: 'CF-2611', date: '2026-11-25', qty: 10000 })).id;
must(L.arrivageControleSave(d, aB, { date: '2026-11-25', echantillon: 20, mesures: [{ hauteur: 300.2, diametre: 82.9, bague: 29.1 }, { hauteur: 300.4, diametre: 83.1, bague: 29 }], defauts: { bulle: 1 }, decision: 'accepte', visa: 'Contrôleur fictif' }, ''));
must(L.arrivageControleSave(d, aB2, { date: '2026-11-26', echantillon: 20, defauts: { glacure: 3, bague: 2 }, decision: 'refuse', note: 'Glaçures et bagues ébréchées.', visa: 'Contrôleur fictif' }, ''));
must(L.fournitureRetourSave(d, { arrivageId: aB2, date: '2026-11-27', qty: 1200, bon: 'RET-FX-01', raison: 'Lot refusé au contrôle de réception.' }, ''));
const ch = d.chantiersTirage[0]; const R = L.replay(d, '2026-12-03');
const lot = Object.values(R.portions).filter((p) => p.vol > 300 && (R.lots[p.lotId] || {}).qualif === 'conv' && !['mout', 'cuvee_tirage'].includes((R.lots[p.lotId] || {}).type) && !(R.lots[p.lotId] || {}).mixtion).sort((a, b) => b.vol - a.vol)[0];
const liq = Object.values(R.preps).find((p) => p.code === 'LT-FX-01'); const lev = Object.values(R.preps).find((p) => p.code === 'LEV-FX-01');
const F = [{ format: 'bouteille', nb: 200, L: 0.75 }, { format: 'magnum', nb: 20, L: 1.5 }];
const fo = L.tirageFournituresSpec(d, [{ produitId: pB, arrivageId: aB }, { produitId: pM, arrivageId: aM }, { produitId: pC, arrivageId: aC }], { formats: F, casse: 2 });
must(L.opSave(d, { type: 'tirage', date: '2026-12-03', sources: [{ portionId: lot.id, lotId: lot.lotId, volL: 165 }], prepUses: [{ prepId: liq.id, volL: 8.6 }, { prepId: lev.id, volL: 9 }], lignes: fo.lignes, fournitures: fo.fournitures, formats: F, ...L.tirageFormatsCompat(F), mode: 'pompe', chantierId: ch.id, casse: 2, pointGL: 24, pompe: { consignes: { liqueurPct: 4.8, levainPct: 5 } }, lotSpec: { code: 'T-FX-FOUR', designation: 'Tirage fictif (fournitures)', millesime: '2026' } }));
must(L.chantierHaccpSet(d, ch.id, { demarrage: { nettoyage: { ok: true }, verre: { ok: true }, niveau: { ok: true, note: 'Réglé à 70 mm' } }, ajouts: [{ id: 'ajfx', label: 'Point fictif de l’exploitation', phase: 'controles' }], controles: [{ date: '2026-12-03', heure: '08:00', points: { niveau: true, sertissage: true, ajfx: true }, operateur: 'Opérateur fictif' }, { date: '2026-12-03', heure: '10:00', points: { niveau: true, sertissage: false }, operateur: 'Opérateur fictif', note: 'Capsuleuse réglée' }], fin: { nettoyage: { ok: true } }, conditionnement: [{ format: 'bouteille', contenant: 'caisse_fil', nb: 2, parUnite: 500 }, { format: 'magnum', contenant: 'palette', nb: 1 }], incidents: [{ date: '2026-12-03', heure: '10:00', description: 'Sertissage irrégulier', action: 'Capsuleuse réglée, 20 cols recapsulés' }], visas: [{ role: 'chef_ligne', nom: 'Chef fictif' }] }, ''));
d.meta.modifLe = '2026-12-03T21:00:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.42.0-alpha.3-fournitures.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', fo.fournitures.map((x) => `${x.qty}${x.decompte ? '' : ' (non décompté)'}`).join(', '));
