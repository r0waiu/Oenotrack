// Build: concatène src/*.js(x) -> compile JSX (esbuild) -> injecte dans src/head.html -> dist/cuverie.html
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const esbuild = require('/opt/npm-tools/node_modules/esbuild');

const dir = path.dirname(new URL(import.meta.url).pathname);
const srcDir = path.join(dir, 'src');
const files = fs.readdirSync(srcDir).filter(f => /\.(js|jsx)$/.test(f)).sort();
let jsx = '';
for (const f of files) jsx += `\n// ===== ${f} =====\n` + fs.readFileSync(path.join(srcDir, f), 'utf8') + '\n';

fs.writeFileSync(path.join(dir, 'dist', 'app.src.jsx'), jsx);
let out;
try {
  out = esbuild.transformSync(jsx, { loader: 'jsx', jsx: 'transform', target: 'es2019', minify: false, legalComments: 'none' });
} catch (e) {
  console.error('ERREUR DE COMPILATION'); console.error(e.errors ? e.errors.map(x => `${x.location ? x.location.line + ':' + x.location.column : ''} ${x.text}`).join('\n') : e);
  process.exit(1);
}
fs.writeFileSync(path.join(dir, 'dist', 'app.js'), out.code);

let head = fs.readFileSync(path.join(srcDir, 'head.html'), 'utf8');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
head = head.replace('/*__APPJS__*/', () => safe(out.code)).replace('<!--__JSXSRC__-->', () => safe(jsx));
fs.writeFileSync(path.join(dir, 'dist', 'cuverie.html'), head);
console.log('OK', files.length, 'fichiers;', (head.length / 1024).toFixed(0), 'Ko');
