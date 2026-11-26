// Base de test 0.37.0-alpha.1 (données fictives : jeu d'exemple) : la base 0.36.0-alpha.1 rouverte par cette version, avec
// - une table d'épalement lue en deux morceaux (0 à 1,59 m et 1,60 à 3,19 m) puis fusionnée : le premier barème garde les deux plages
//   (champ « fusions »), le second est archivé (champ « fusionneDans ») ;
// - deux analyses enregistrées depuis un rapport fictif à plusieurs échantillons (n° d'échantillon du laboratoire dans les notes), bulletin joint.
// → test/fixtures/base-0.37.0-alpha.1-bulletins.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, getR, baremeSave, baremeFusionner, bulletinEnregistrer, APP_VERSION, APP_NUM };')({});
const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.36.0-alpha.1-intrants.json'), 'utf8'));
const d = L.normalizeDb(base); L.syncConfig(d);
const c = d.contenants.find((x) => !(d.baremes || []).some((b) => b.contenantId === x.id && !b.archive));
const pts = (h0, h1) => { const P = []; for (let h = h0; h <= h1; h += 1) P.push([h, Math.round(h * 94.04 * 1000) / 1000]); return P; };
const meta = { organisme: 'Organisme fictif de jaugeage', certificat: 'R.FX.26.00042', fichier: 'epalement-fictif.pdf' };
const a = must(L.baremeSave(d, { nom: 'Cuve fictive', cible: 'contenant', contenantId: c.id, mesure: 'hauteur', points: pts(0, 159), meta: { ...meta, pages: [1] } }));
const b = must(L.baremeSave(d, { nom: 'Tableau p. 2', cible: 'contenant', contenantId: '', mesure: 'hauteur', points: pts(160, 319), meta: { ...meta, pages: [2] } }));
must(L.baremeFusionner(d, a.id, b.id));
const R = L.getR(d); const lots = Object.values(R.lots).filter((l) => (R.lotVol[l.id] || 0) > 0).slice(0, 2);
must(L.bulletinEnregistrer(d, { doc: { id: 'docfx-bul37', nom: 'rapport-multi-echantillons-fictif.pdf', mime: 'application/pdf', taille: 2048 }, params: [], analyses: lots.map((l, k) => ({ ref: `FX ${5002 + k}`, date: '2026-11-20', lotId: l.id, contenantId: '', modeleId: '', valeurs: { ph: 3.1 + k / 10, at: 6 + k }, notes: `Bulletin (Laboratoire fictif, bulletin n° FX-261120-000042.1) — FX ${5002 + k} (échantillon 26FX00010${k})` })) }));
d.meta.modifLe = '2026-11-26T09:30:00Z';
const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.37.0-alpha.1-bulletins.json');
fs.writeFileSync(out, JSON.stringify(d));
console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko · barèmes', a.id, b.id, '· contenant', c.id, '· lots', lots.map((l) => l.code).join(', '));
