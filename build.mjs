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

let head = fs.readFileSync(path.join(srcDir, 'head.html'), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
head = head.replace('/*__APPJS__*/', () => safe(out.code)).replace('<!--__JSXSRC__-->', () => (avecSource ? `<script type="text/plain" id="jsx-source">\n${safe(jsx)}\n</script>` : ''));
fs.writeFileSync(sortie, head);
if (!silencieux) {
  const ko = (n) => `${(n / 1024).toFixed(0)} Ko`; const gz = zlib.gzipSync(Buffer.from(head, 'utf8'), { level: 9 }).length;
  console.log('OK', files.length, 'fichiers;', ko(Buffer.byteLength(head, 'utf8')), `(${ko(gz)} compressé pour le réseau)`, dev ? '· lisible (--dev)' : '· compacté', avecSource ? '· source jointe' : '', '→', path.relative(process.cwd(), sortie) || sortie);
}
