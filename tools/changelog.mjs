// CHANGELOG.md (format GitHub) fabriqué à partir du journal des nouveautés de l'application (CHANGELOG de src/10-core.js)
// Usage : node tools/changelog.mjs [fichier de sortie]   (appelé par tools/paquet-web.py ; par défaut : CHANGELOG.md à la racine)
import fs from 'fs'; import path from 'path';
const racine = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const core = fs.readFileSync(path.join(racine, 'src', '10-core.js'), 'utf8');
const m = /const CHANGELOG = (\[[\s\S]*?\n\]);/.exec(core); if (!m) throw new Error('CHANGELOG introuvable dans src/10-core.js');
const journal = new Function(`return ${m[1]};`)();
const date = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const md = ['# Nouveautés d’Œnotrack', '', 'Toutes les versions publiées, de la plus récente à la plus ancienne (numérotation `X.Y.Z-étiquette.N` : voir le [README](README.md#numérotation-des-versions)). Le même journal est dans l’application : *Nouveautés*, en bas de l’écran.', '',
  ...journal.flatMap((c) => [`## ${c.v} — ${date(c.date)}`, '', ...c.notes.map((n) => `- ${n}`), ''])].join('\n');
const sortie = process.argv[2] ? path.resolve(process.argv[2]) : path.join(racine, 'CHANGELOG.md');
fs.writeFileSync(sortie, md); console.log('CHANGELOG.md :', journal.length, 'versions →', path.relative(racine, sortie) || sortie);
