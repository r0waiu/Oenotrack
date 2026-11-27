// Textes d'interface à traduire : liste, fichier par fichier, les textes français (JSX, chaînes, gabarits `…${x}…`)
// que les tables de traduction (src/17b… à 17z…) ne savent pas encore rendre dans les six langues.
// Usage : node tools/textes-a-traduire.cjs [fichiers…]   (sans argument : tous les fichiers de src/)
// Nécessite le paquet « typescript » (npm install --no-save typescript, dans le dossier du projet), utilisé seulement pour lire le JSX.
const fs = require('fs'); const path = require('path');
let ts; for (const p of ['typescript', '/opt/npm-tools/node_modules/typescript']) { try { ts = require(p); break; } catch (e) { /* suivant */ } }
if (!ts) { console.error('Installez d’abord TypeScript dans le dossier du projet : npm install --no-save typescript'); process.exit(1); }
const SRC = path.join(__dirname, '..', 'src');
const tables = fs.readdirSync(SRC).filter((f) => /^17[b-z][a-z]?-/.test(f)).sort(); // 17za…, 17zb… compris
const L = new Function(tables.map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n') + '\n;return { traduire, TRAD_TABLE, TRAD_MOTIFS };')();
const LGS = ['en', 'es', 'it', 'de', 'pt'];
const motifsConnus = new Set(L.TRAD_MOTIFS.map((r) => r[0])); const lignes = new Set(L.TRAD_TABLE.map((r) => r[0]));
// termes gardés en français dans les autres langues (vocabulaire champenois, noms propres)
const GARDES = /\b(cuvée|cuvées|rebêches?|tailles?|sur lattes|pied de cuve|blanc de noirs|liqueur d’expédition|liqueur de tirage|négociant|bâtonnage|entonnage|saignée|délestage|débourbage|chaptalisation|remuage|demi-muids?|Échelle des crus|Grands? Crus?|Premiers? Crus?|1er Cru|Champagne|Coteaux champenois|Œnotrack|Œno|Côte des Blancs|Épernay|Vertus|Marne)\b/gi;
const FR = /[éèêàùçôîûœ]|\b(le|la|les|des|du|de|un|une|et|pour|par|avec|sans|sur|dans|est|au|aux|ce|cette|ou)\b/i;
// traduit = ligne ou motif exact, ou rendu anglais sans reste de français (un motif « Modifier {a} » ne suffit pas si {a} reste en français)
const traduit = (t) => {
  if (lignes.has(t) || motifsConnus.has(t)) return true;
  const en = L.traduire(t, 'en', 0, true); if (en === t && LGS.every((lg) => L.traduire(t, lg, 0, true) === t)) return false;
  return !FR.test(en.replace(/\{[a-j]\}/g, ' ').replace(GARDES, ' '));
};
const PH = (i) => `{${'abcdefghij'[Math.min(i, 9)]}}`;
// ce qui ressemble à du code, à une classe CSS ou à un identifiant n'est pas un texte d'interface
const CSS = /(^|\s)(flex|grid|text-|mt-|mb-|ml-|mr-|p-|px-|py-|pt-|pb-|gap-|btn|chip|inp|hm|num|card|space-y|items-|justify-|min-w|max-w|w-|h-|rounded|border|bg-|font-|whitespace|overflow|sr-only|block|inline|hidden|relative|absolute|opacity|truncate|break-|leading|tracking|uppercase|shrink|grow|col-|row-|order-|self-|place-|z-|top-|left-|right-|bottom-|cursor|select-|ring|shadow|transition|duration|ease|var\(|rgba?\(|minmax\(|color-mix\(|#[0-9a-f]{3})/i;
function texteUI(t) {
  const s = t.replace(/\{[a-j]\}/g, ' ').trim();
  if (!/[A-Za-zÀ-ÿ]{2}/.test(s)) return false;
  if (CSS.test(t) && !/[À-ÿ’]/.test(t)) return false;
  if (/^[a-z][a-zA-Z0-9_.-]*$/.test(s) && !/[À-ÿ]/.test(s)) return false; // identifiant, clé
  if (/^[A-Z][A-Za-z]+$/.test(s) && /^(Escape|Enter|Arrow\w*|Tab|Backspace|Delete|Home|End|Page\w*)$/.test(s)) return false; // touches du clavier
  if (/^(https?:|data:|oenotrack-|mailto:)/.test(s) || /^[.#][\w-]/.test(s) || /^\/\S*$/.test(s) || /^M [\d.-]/.test(s)) return false; // adresse, sélecteur, chemin SVG
  if (/^(repeat|scale|translate|rotate|minmax|calc)\(/.test(s) || /^-?\d+(\.\d+)?(px|vh|vw|em|rem|%)(\s|$)/.test(s) || /^\[[\w-]+/.test(s) || /^_\w+$/.test(s)) return false; // CSS, sélecteur, clé interne
  if (/^[a-z]+\/[a-z0-9.+-]+$/.test(s) || /^[A-Z][a-z]+[A-Z]\w*$/.test(s) || /^(list|space|divide)-/.test(s)) return false; // type MIME, nom de composant, classe
  if (/^[\w-]+(\s[\w-]+)*$/.test(s) && !/[À-ÿ’]/.test(s) && !/\s/.test(s.trim()) && s.length < 3) return false;
  return true;
}
const ENTITES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0', rsquo: '’', laquo: '«', raquo: '»', hellip: '…', mdash: '—', ndash: '–' };
const entites = (t) => t.replace(/&(#x?[0-9a-f]+|\w+);/gi, (x, e) => (e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENTITES[e] !== undefined ? ENTITES[e] : x));
function jsxTexte(txt) { // règles d'espacement du JSX : lignes rognées, lignes vides supprimées, jointes par une espace ; entités HTML décodées
  txt = entites(txt);
  if (!txt.includes('\n')) return txt;
  const ls = txt.split(/\r?\n/); const out = [];
  ls.forEach((l, i) => { let x = l; if (i) x = x.replace(/^\s+/, ''); if (i < ls.length - 1) x = x.replace(/\s+$/, ''); if (x) out.push(x); });
  return out.join(' ');
}
// une valeur qui affiche un élément (JSX, ou fonction qui en renvoie : …Chip(), …Link()…) coupe la phrase en deux
const ELEMENT = /Chip|Link|Btn|Icon|Badge|Swatch|^render|^[A-Z]/;
const contientJsx = (n) => { let r = false; const v = (x) => { if (r) return; if (ts.isJsxElement(x) || ts.isJsxSelfClosingElement(x) || ts.isJsxFragment(x)) { r = true; return; } if (ts.isCallExpression(x) && ts.isIdentifier(x.expression) && ELEMENT.test(x.expression.text)) { r = true; return; } ts.forEachChild(x, v); }; v(n); return r; };
function gabarit(n, k0) { // `a ${x} b` → « a {a} b »
  let s = n.head.text; let k = k0 || 0; n.templateSpans.forEach((sp) => { s += PH(k++) + sp.literal.text; }); return s;
}
function extraire(fichier) {
  const code = fs.readFileSync(fichier, 'utf8');
  const sf = ts.createSourceFile(fichier, code, ts.ScriptTarget.Latest, true, fichier.endsWith('.jsx') ? ts.ScriptKind.JSX : ts.ScriptKind.JS);
  const res = []; const vu = new Set(); const dansPhrase = new Set(); // textes JSX traduits avec leur phrase
  const ajouter = (t, n, genre) => { t = t.replace(/ /g, ' ').trim(); if (!t || vu.has(t) || !texteUI(t)) return; vu.add(t); res.push({ t, ligne: sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1, genre }); };
  const visite = (n) => {
    if (ts.isJsxElement(n) || ts.isJsxFragment(n)) {
      let run = []; const vider = () => {
        if (run.length) {
          let s = ''; let k = 0; let lit = '';
          for (const p of run) {
            if (p.texte !== undefined) { s += p.texte; lit += p.texte; } else if (ts.isStringLiteral(p.e) || ts.isNoSubstitutionTemplateLiteral(p.e)) { s += p.e.text; lit += p.e.text; } else if (ts.isTemplateExpression(p.e)) { const g = gabarit(p.e, k); k += p.e.templateSpans.length; s += g; lit += g.replace(/\{[a-j]\}/g, ''); } else s += PH(k++);
          }
          if (/[A-Za-zÀ-ÿ]{2}/.test(lit) && k > 0) { ajouter(s, run[0].n, 'phrase'); run.forEach((p) => { if (p.texte !== undefined) dansPhrase.add(p.n); }); } // phrase JSX avec des valeurs : traduite d'un bloc
        }
        run = [];
      };
      for (const c of n.children) {
        if (ts.isJsxText(c)) { const t = jsxTexte(c.text); if (t) run.push({ texte: t, n: c }); } else if (ts.isJsxExpression(c)) { if (!c.expression) continue; if (contientJsx(c.expression)) vider(); else run.push({ e: c.expression, n: c }); } else vider();
      }
      vider();
    }
    if (ts.isJsxText(n)) { if (!dansPhrase.has(n)) ajouter(jsxTexte(n.text), n, 'jsx'); }
    else if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { if (!ts.isImportDeclaration(n.parent) && !(ts.isPropertyAssignment(n.parent) && n.parent.name === n) && !ts.isElementAccessExpression(n.parent)) ajouter(n.text, n, 'chaîne'); } else if (ts.isTemplateExpression(n)) ajouter(gabarit(n), n, 'gabarit');
    ts.forEachChild(n, visite);
  };
  visite(sf);
  return res;
}
const fichiers = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(SRC).filter((f) => /\.(js|jsx)$/.test(f) && !/^17[b-z]-/.test(f)).sort();
let total = 0;
for (const f of fichiers) {
  const p = fs.existsSync(f) ? f : path.join(SRC, f);
  const manque = extraire(p).filter((x) => !traduit(x.t)); total += manque.length;
  if (!manque.length) continue;
  console.log(`==== ${path.basename(p)} (${manque.length})`);
  for (const x of manque) console.log(`${x.ligne}\t${x.genre}\t${x.t}`);
}
console.log(`\n${total} texte(s) à traduire.`);
