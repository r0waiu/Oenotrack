#!/usr/bin/env node
// Libellés de boutons hors règle (0.48.0-alpha.1, constat U27 de l'audit d'interface) :
//   création « ＋ Nouveau X » / « ＋ X » (signe pleine chasse, jamais « + » ASCII ni création sans signe « Nouveau X ») ;
//   suppression « Supprimer » (jamais « Suppr. ») ; export « ⬇ Exporter (CSV) », « ⬇ Exporter (Excel) » (jamais « Export CSV », « ⬇ CSV »…).
// Usage : node tools/libelles-boutons.cjs [fichiers.jsx…] (par défaut : src/*.jsx) ; code de sortie 1 s'il y a des écarts.
const fs = require('fs'); const path = require('path');
const dir = path.join(__dirname, '..', 'src');
const fichiers = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(dir).filter((f) => f.endsWith('.jsx')).map((f) => path.join(dir, f));
const REGLES = [
  [/^\+ \p{L}/u, 'création : « ＋ » pleine chasse'],
  [/^(Nouveau|Nouvelle|Nouvel) \p{L}/u, 'création sans signe : « ＋ Nouveau … »'],
  [/^Suppr\.$/, '« Supprimer » en entier'],
  [/^(⬇ )?(Export|Exporter) ?(CSV|Excel)$|^⬇ (CSV|Excel)$/, 'export : « ⬇ Exporter (CSV) » ou « ⬇ Exporter (Excel) »'],
];
let n = 0;
for (const f of fichiers) {
  const lignes = fs.readFileSync(f, 'utf8').split('\n');
  lignes.forEach((l, i) => {
    // texte direct d'un bouton : <Btn …>texte</Btn> ou <button …>texte</button>
    const re = /<(Btn|button)\b[^>]*>([^<{}]+)<\/(Btn|button)>/g; let m;
    while ((m = re.exec(l))) { const t = m[2].trim(); const r = REGLES.find(([x]) => x.test(t)); if (r) { n += 1; console.log(`${path.relative(process.cwd(), f)}:${i + 1}\t${t}\t→ ${r[1]}`); } }
  });
}
console.log(n ? `\n${n} libellé(s) hors règle.` : 'Aucun libellé hors règle.'); process.exitCode = n ? 1 : 0;
