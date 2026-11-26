// Compilation : concatène src/*.js(x) → compile le JSX (esbuild) → injecte dans src/head.html → dist/cuverie.html
// Options (0.29.0-alpha.1) :
//   --dev              code lisible (non compacté), pour déboguer ; par défaut le code est compacté (espaces et syntaxe), les noms
//                      restent intacts (les tests et la console appellent les fonctions par leur nom)
//   --source           joint le code source JSX complet dans la page (bloc <script type="text/plain" id="jsx-source">) ; par défaut
//                      il n'est plus joint : le code source est publié à part (code-source.zip du paquet web, dépôt GitHub)
//   --sortie=chemin    fichier produit (défaut : dist/cuverie.html)
//   --silencieux       n'affiche que les erreurs
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import crypto from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const esbuild = require('/opt/npm-tools/node_modules/esbuild');

const args = process.argv.slice(2); const opt = (n) => args.includes(`--${n}`); const val = (n) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : null; };
const inconnues = args.filter((a) => !/^--(dev|source|silencieux|sortie=.+)$/.test(a)); if (inconnues.length) { console.error(`Option inconnue : ${inconnues.join(' ')} (options : --dev, --source, --sortie=chemin, --silencieux)`); process.exit(2); }
const dev = opt('dev'); const avecSource = opt('source'); const silencieux = opt('silencieux');
const dir = path.dirname(new URL(import.meta.url).pathname);
const srcDir = path.join(dir, 'src'); const distDir = path.join(dir, 'dist'); fs.mkdirSync(distDir, { recursive: true });
const sortie = val('sortie') ? path.resolve(val('sortie')) : path.join(distDir, 'cuverie.html');
const files = fs.readdirSync(srcDir).filter(f => /\.(js|jsx)$/.test(f)).sort();
let jsx = '';
for (const f of files) jsx += `\n// ===== ${f} =====\n` + fs.readFileSync(path.join(srcDir, f), 'utf8') + '\n';

fs.writeFileSync(path.join(distDir, 'app.src.jsx'), jsx);
let out;
try {
  out = esbuild.transformSync(jsx, { loader: 'jsx', jsx: 'transform', target: 'es2019', legalComments: 'none', charset: 'utf8',
    ...(dev ? { minify: false } : { minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: false }) });
} catch (e) {
  console.error('ERREUR DE COMPILATION'); console.error(e.errors ? e.errors.map(x => `${x.location ? x.location.line + ':' + x.location.column : ''} ${x.text}`).join('\n') : e);
  process.exit(1);
}
fs.writeFileSync(path.join(distDir, 'app.js'), out.code);

// 0.38.0-alpha.1 : Tailwind précompilé (plus de compilateur chargé depuis un CDN à l'ouverture) et bibliothèques vérifiées
// (empreintes de src/16r-bibliotheques.js comparées aux paquets npm installés : la construction s'arrête si l'une ne correspond plus)
const NM = '/opt/npm-tools/node_modules';
const bibTexte = fs.readFileSync(path.join(srcDir, '16r-bibliotheques.js'), 'utf8');
const BIB = JSON.parse(bibTexte.slice(bibTexte.indexOf('{', bibTexte.indexOf('/*BIB-DEBUT*/')), bibTexte.lastIndexOf('}', bibTexte.indexOf('/*BIB-FIN*/')) + 1));
const bibFichier = (b) => path.join(NM, b.npm.replace(/@[^@/]+$/, ''), b.fichier);
const bibPb = [];
for (const [nom, b] of Object.entries(BIB)) {
  const f = bibFichier(b); if (!fs.existsSync(f)) { bibPb.push(`${nom} : ${f} absent (npm install ${b.npm})`); continue; }
  const v = JSON.parse(fs.readFileSync(path.join(NM, b.npm.replace(/@[^@/]+$/, ''), 'package.json'), 'utf8')).version; if (`${b.npm.replace(/@[^@/]+$/, '')}@${v}` !== b.npm) bibPb.push(`${nom} : version ${v} installée, ${b.npm} attendue`);
  const o = fs.readFileSync(f); const h = `sha384-${crypto.createHash('sha384').update(o).digest('base64')}`; if (h !== b.sri) bibPb.push(`${nom} : empreinte ${h} ≠ ${b.sri}`);
  if (b.sha256 && `sha256-${crypto.createHash('sha256').update(o).digest('base64')}` !== b.sha256) bibPb.push(`${nom} : empreinte SHA-256 différente`);
}
if (bibPb.length) { console.error('BIBLIOTHÈQUES NON VÉRIFIÉES\n' + bibPb.join('\n')); process.exit(1); }
const TW_CONFIG = {
  content: [{ raw: jsx, extension: 'jsx' }, { raw: fs.readFileSync(path.join(srcDir, 'head.html'), 'utf8'), extension: 'html' }],
  theme: { extend: {
    colors: { bg: 'var(--bg)', surface: 'var(--surface)', surface2: 'var(--surface2)', ink: 'var(--ink)', ink2: 'var(--ink2)', line: 'var(--line)', accent: 'var(--accent)', accentSoft: 'var(--accentSoft)', accentInk: 'var(--accentInk)', gold: 'var(--gold)', goldSoft: 'var(--goldSoft)', ok: 'var(--ok)', okSoft: 'var(--okSoft)', warn: 'var(--warn)', warnSoft: 'var(--warnSoft)', bad: 'var(--bad)', badSoft: 'var(--badSoft)', qconv: 'var(--qconv)', qbio: 'var(--qbio)', qdem: 'var(--qdem)' },
    borderColor: { DEFAULT: 'var(--line)' },
    fontFamily: { display: ['"Barlow Condensed"', 'Arial Narrow', 'sans-serif'], sans: ['Barlow', 'system-ui', 'sans-serif'], mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'], serif: ['"Cormorant Garamond"', 'Georgia', 'serif'] },
  } },
};
const twReq = createRequire(fs.realpathSync(path.join(NM, 'tailwindcss', 'package.json')));
const twCss = (await twReq('postcss')([twReq('tailwindcss')(TW_CONFIG)]).process('@tailwind base;@tailwind components;@tailwind utilities;', { from: undefined })).css;
const twMin = esbuild.transformSync(twCss, { loader: 'css', minify: true, legalComments: 'none' }).code;
let head = fs.readFileSync(path.join(srcDir, 'head.html'), 'utf8');
head = head.replace('/*__TAILWIND__*/', () => twMin.replace(/<\/style/gi, '<\\/style'));
for (const [nom, b] of Object.entries(BIB)) head = head.split(`__SRI_${nom}__`).join(b.sri);
const safe = s => s.replace(/<\/script/gi, '<\\/script');
head = head.replace('/*__APPJS__*/', () => safe(out.code)).replace('<!--__JSXSRC__-->', () => (avecSource ? `<script type="text/plain" id="jsx-source">\n${safe(jsx)}\n</script>` : ''));
fs.writeFileSync(sortie, head);
if (!silencieux) {
  const ko = (n) => `${(n / 1024).toFixed(0)} Ko`; const gz = zlib.gzipSync(Buffer.from(head, 'utf8'), { level: 9 }).length;
  console.log('OK', files.length, 'fichiers;', ko(Buffer.byteLength(head, 'utf8')), `(${ko(gz)} compressé pour le réseau)`, dev ? '· lisible (--dev)' : '· compacté', avecSource ? '· source jointe' : '', '→', path.relative(process.cwd(), sortie) || sortie);
}
