// Base de test 0.38.0-alpha.2 (données fictives : jeu d'exemple) : la base 0.38.0-alpha.1 rouverte par cette version, avec
// - une clé d'accès intégrée (« cet appareil » : Android, transports internal + hybrid) et une clé de sécurité externe (USB + NFC),
//   clés publiques ES256 FICTIVES générées pour le test ;
// - la clé « PC Windows » de la 0.38.0-alpha.1, sans type ni transports (inchangée).
// → test/fixtures/base-0.38.0-alpha.2-cles.json
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
const src = files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '');
global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
const L = new Function('React', src + '\n;return { normalizeDb, syncConfig, cleAjouter, cleModifier, clesB64, APP_VERSION, APP_NUM };')({});
(async () => {
  const must = (r) => { if (!r || !r.ok) throw new Error(r ? r.msg : 'échec'); return r; };
  const base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'test', 'fixtures', 'base-0.38.0-alpha.1-securite.json'), 'utf8'));
  const d = L.normalizeDb(base); L.syncConfig(d);
  const S = globalThis.crypto.subtle; const spki = async () => L.clesB64(new Uint8Array(await S.exportKey('spki', (await S.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])).publicKey)));
  const adm = d.utilisateurs.find((u) => u.identifiant === 'admin').id; const op = d.utilisateurs.find((u) => u.identifiant === 'chai').id;
  must(L.cleAjouter(d, adm, { id: 'cleFictiveAndroid-0382', cle: await spki(), alg: -7, rp: 'app.test', nom: 'Android', appareil: 'Android', type: 'appareil', transports: ['internal', 'hybrid'], le: '2026-11-26T12:00:00.000Z' }));
  must(L.cleAjouter(d, op, { id: 'cleFictiveUsb-0382', cle: await spki(), alg: -7, rp: 'app.test', nom: 'Clé de sécurité', appareil: 'Linux', type: 'externe', transports: ['usb', 'nfc'], le: '2026-11-26T12:05:00.000Z' }));
  must(L.cleModifier(d, op, 'cleFictiveUsb-0382', { acceptee: true }));
  d.meta.modifLe = '2026-11-26T12:10:00Z';
  const out = path.join(__dirname, '..', 'test', 'fixtures', 'base-0.38.0-alpha.2-cles.json');
  fs.writeFileSync(out, JSON.stringify(d));
  console.log(L.APP_VERSION, L.APP_NUM, '→', out, Math.round(fs.statSync(out).size / 1024), 'Ko');
})();
