// Icônes de l'application installable (PWA) : le logo Œnotrack du modèle de base (charte « Œnotrack » : anthracite et or),
// rendu en PNG par Chromium — 192 et 512 (coins arrondis), « maskable » 512 (Android : fond plein, logo dans la zone sûre),
// Apple 180 (fond plein, iOS arrondit lui-même) — puis réduit à 256 couleurs avec tramage (fichiers légers, dégradés sans paliers).
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const require = createRequire(import.meta.url); const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), 'icones');
// mêmes tracés et mêmes couleurs que le composant Logo (42-vessels.jsx) avec la charte de base (head.html : --logo1, --logo2, --logoG1, --logoG2, --logoDot)
const C = { fond1: '#2A323B', fond2: '#1E242B', or1: '#E3C88A', or2: '#B49249', point: '#FFF8E6' };
const GLYPHE = `<circle cx="25" cy="34" r="14" fill="none" stroke="url(#g)" stroke-width="4.6"/>
<g clip-path="url(#c)"><path d="M8 35Q16 31 24 35T40 35V52H8Z" fill="url(#g)"/></g>
<circle cx="21" cy="30.5" r="1.6" fill="${C.point}"/><circle cx="28" cy="27" r="1.1" fill="${C.point}" opacity=".85"/>
<path d="M39.6 22H55M40.4 34H51M39.6 46H55" stroke="url(#g)" stroke-width="4.6" stroke-linecap="round"/>
<circle cx="46" cy="12" r="1.6" fill="${C.or1}" opacity=".9"/><circle cx="51" cy="8" r="2.2" fill="${C.or1}" opacity=".8"/><circle cx="57" cy="5.4" r="1.2" fill="${C.or1}" opacity=".7"/>`;
const DEFS = `<defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.fond1}"/><stop offset="1" stop-color="${C.fond2}"/></linearGradient>
<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.or1}"/><stop offset="1" stop-color="${C.or2}"/></linearGradient>
<clipPath id="c"><circle cx="25" cy="34" r="11.6"/></clipPath></defs>`;
// forme : 'arrondi' (le logo tel quel), 'plein' (fond carré, logo à sa place), 'zone-sure' (fond carré, logo recentré et réduit pour rester dans le cercle de 80 % d'Android)
const logo = (forme) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${DEFS}
${forme === 'arrondi' ? '<rect width="64" height="64" rx="15" fill="url(#b)"/>' : '<rect width="64" height="64" fill="url(#b)"/>'}
<g${forme === 'zone-sure' ? ' transform="translate(32 32) scale(.76) translate(-33 -27.25)"' : ''}>${GLYPHE}</g></svg>`;
fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'icone.svg'), logo('arrondi'));
const b = await chromium.launch(); const p = await b.newPage();
const liste = [['icone-192.png', 192, 'arrondi'], ['icone-512.png', 512, 'arrondi'], ['icone-maskable-512.png', 512, 'zone-sure'], ['apple-touch-icon.png', 180, 'plein']];
for (const [nom, taille, forme] of liste) {
  await p.setViewportSize({ width: taille, height: taille });
  await p.setContent(`<html><body style="margin:0;background:transparent">${logo(forme).replace('<svg ', `<svg width="${taille}" height="${taille}" `)}</body></html>`);
  await p.screenshot({ path: path.join(dir, nom), omitBackground: true, clip: { x: 0, y: 0, width: taille, height: taille } });
}
await b.close();
execFileSync('python3', ['-c', `
from PIL import Image
import os, sys
d = sys.argv[1]
for n, plein in [('icone-192.png', 0), ('icone-512.png', 0), ('icone-maskable-512.png', 1), ('apple-touch-icon.png', 1)]:
    p = os.path.join(d, n); im = Image.open(p).convert('RGBA')
    if plein: q = im.convert('RGB').quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG)
    else:
        q = im.convert('RGB').quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).convert('RGBA'); q.putalpha(im.getchannel('A'))
    q.save(p, optimize=True)
`, dir]);
console.log('icônes :', fs.readdirSync(dir).map((n) => `${n} ${Math.round(fs.statSync(path.join(dir, n)).size / 1024)} Ko`).join(', '));
