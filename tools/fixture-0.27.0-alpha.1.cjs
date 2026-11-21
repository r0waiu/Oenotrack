// Base de test 0.27.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.26.0-alpha.2 rouverte par cette version, avec
// - le journal de sécurité des importations (un programme refusé, un PDF désarmé) et des documents vérifiés (désarmé, signalé) ;
// - un bulletin d'analyses importé (nouveau paramètre « TAV acquis », analyse rattachée au bulletin joint) ;
// - un fichier de traçabilité exporté sur une vente en vrac (volume en litres : volumeL), puis repris dans une entrée de vin (traçabilité amont gardée)
// → test/fixtures/base-0.27.0-alpha.1-imports.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, opSave, gardeJournaliser, gardeDocsNoter, docMetaAdd, bulletinEnregistrer, traceExport, traceExportNoter, traceLire, traceAmontRec, APP_VERSION, APP_NUM };')({});
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.26.0-alpha.2-pressurage.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
// journal de sécurité et documents vérifiés
must(L.gardeJournaliser(d, [{ date: '2026-11-21T08:10:00.000Z', statut: 'refuse', usage: 'document', nom: 'facture.pdf', taille: 208, raisons: ['contenu réel : programme Windows déguisé en « .pdf »'], appareil: 'Linux' },
  { date: '2026-11-21T08:11:00.000Z', statut: 'nettoye', usage: 'fiche', nom: 'fiche-active.pdf', taille: 2048, raisons: ['PDF désarmé : code JavaScript, fichier incorporé retiré'], appareil: 'Linux' }]));
const op0 = d.ops.find((o) => o.type !== 'declassement');
must(L.docMetaAdd(d, { id: 'docgarde27a', nom: 'fiche-active.pdf', mime: 'application/pdf', taille: 2048, cat: 'autre', cible: { type: 'op', id: op0.id }, garde: { statut: 'nettoye', le: '2026-11-21', famille: 'pdf', notes: ['PDF désarmé : code JavaScript retiré'] } }));
must(L.docMetaAdd(d, { id: 'docgarde27b', nom: 'ancien.html', mime: 'text/html', taille: 300, cat: 'autre', cible: { type: 'op', id: op0.id } }));
L.gardeDocsNoter(d, { docgarde27b: { statut: 'suspect', le: '2026-11-21', famille: 'html', notes: ['contenu réel : page web (HTML)'] } });
// bulletin d'analyses : analyse sur un lot présent le 18/11/2026, nouveau paramètre « TAV acquis »
const R = L.getR(d, '2026-11-18'); const p = Object.values(R.portions).filter((x) => x.vol > 1).sort((a, b) => b.vol - a.vol)[0];
must(L.bulletinEnregistrer(d, { doc: { id: 'docbul27', nom: 'bulletin-26-0777.pdf', mime: 'application/pdf', taille: 1800, garde: { statut: 'ok', le: '2026-11-21', famille: 'pdf' } }, params: [{ cle: 'tav', nom: 'TAV acquis', unite: '% vol.', dec: 2 }],
  analyses: [{ ref: 'Cuve', date: '2026-11-18', lotId: p.lotId, contenantId: p.contenantId, modeleId: 'm_clair', valeurs: { ph: 3.08, so2l: 21, so2t: 64, '+tav': 11.62 }, notes: 'Bulletin (Laboratoire de démonstration, bulletin n° 26-0777) — Cuve' }] }));
// fichier de traçabilité : exporté sur une vente en vrac, repris dans une entrée de vin
const so = d.ops.find((o) => o.type === 'sortie' && (o.sousType || '') !== 'perte' && (o.sousType || '') !== 'distillerie') || d.ops.find((o) => o.type === 'sortie' && (o.sousType || '') !== 'perte');
const x = must(L.traceExport(d, so.id, null, { maintenant: '2026-11-21T09:00:00.000Z' }));
must(L.traceExportNoter(d, so.id, { le: '2026-11-21T09:00:00.000Z', sections: x.data.sections, empreinte: x.data.empreinte }));
const lu = must(L.traceLire(JSON.stringify(x.data)));
const R2 = L.getR(d, '2026-11-20'); const vides = d.contenants.filter((c) => c.statut !== 'archive' && !Object.values(R2.portions).some((q) => q.contenantId === c.id && q.vol > 0.001) && num(c.volMax) >= 10);
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
const ap = (d.apporteurs || [])[0];
must(L.opSave(d, { type: 'reprise', sousType: 'entree_vin', date: '2026-11-20', notes: '', contenantId: vides[0].id, volL: 8, apporteurId: ap ? ap.id : '', lotSpec: { code: 'RV27-01', designation: `${lu.data.produit.designation} (reçu)`, millesime: lu.data.produit.millesime || 'NV', type: 'vin_reserve', qualifId: 'conv', cepages: { chard: 60, pn: 40 }, crus: {}, echelle: '' },
  amont: [L.traceAmontRec(lu.data, 'tracabilite-expedition.json', lu.integre, '2026-11-21T09:05:00.000Z')] }, null));
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.27.0-alpha.1-imports.json');
fs.writeFileSync(out, JSON.stringify(d)); console.log(L.APP_VERSION, L.APP_NUM, d.meta.versions.join(' | '), '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko', '· sortie', so.id, '· cuve', vides[0].nom);
