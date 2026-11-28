/* ============ QR CODE (norme ISO/IEC 18004) : encodeur autonome, mode octet (UTF-8), versions 1 à 40 (0.29.0-alpha.1) ============
   Sans bibliothèque : correction d'erreur Reed-Solomon (GF(256), polynôme 0x11D), entrelacement des blocs, motifs de repérage,
   d'alignement et de synchronisation, informations de format et de version, choix du masque (règles de pénalité de la norme).
   Les étiquettes de cuve ne contiennent qu'une adresse et un identifiant opaque : aucune donnée de la cave. */
const QR_NIVEAUX = ['L', 'M', 'Q', 'H']; // ordre des tables ; bits de format : L=1, M=0, Q=3, H=2
const QR_FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };
const QR_ECC_PAR_BLOC = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];
const QR_NB_BLOCS = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];
const qrModulesBruts = (v) => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
const qrOctetsDonnees = (v, e) => Math.floor(qrModulesBruts(v) / 8) - QR_ECC_PAR_BLOC[e][v] * QR_NB_BLOCS[e][v];
const qrBitsCompte = (v) => (v <= 9 ? 8 : 16); // mode octet
function qrRsMul(x, y) { let z = 0; for (let i = 7; i >= 0; i -= 1) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; }
function qrRsDiviseur(deg) {
  const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
  for (let i = 0; i < deg; i += 1) { for (let j = 0; j < r.length; j += 1) { r[j] = qrRsMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = qrRsMul(root, 0x02); }
  return r;
}
function qrRsReste(data, div) {
  const r = div.map(() => 0);
  data.forEach((b) => { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= qrRsMul(c, f); }); });
  return r;
}
const qrUtf8 = (s) => (typeof TextEncoder !== 'undefined' ? Array.from(new TextEncoder().encode(String(s))) : Array.from(unescape(encodeURIComponent(String(s)))).map((c) => c.charCodeAt(0)));
function qrPositionsAlignement(v) {
  if (v === 1) return []; const n = Math.floor(v / 7) + 2; const taille = v * 4 + 17;
  const pas = v === 32 ? 26 : Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2; const r = [6];
  for (let p = taille - 7; r.length < n; p -= pas) r.splice(1, 0, p);
  return r;
}
const QR_MASQUES = [
  (x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];
// pénalité (règles N1 à N4) : sert seulement à choisir le masque le plus lisible ; tout masque donne un code valide
function qrPenalite(m) {
  const n = m.length; let p = 0; const motifA = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0]; const motifB = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const ligne = (get) => { // N1 et N3 sur une ligne ou une colonne
    let run = 1; for (let i = 1; i < n; i += 1) { if (get(i) === get(i - 1)) { run += 1; if (run === 5) p += 3; else if (run > 5) p += 1; } else run = 1; }
    for (let i = 0; i + 11 <= n; i += 1) { let a = true; let b = true; for (let k = 0; k < 11; k += 1) { const v = get(i + k) ? 1 : 0; if (v !== motifA[k]) a = false; if (v !== motifB[k]) b = false; } if (a) p += 40; if (b) p += 40; }
  };
  for (let y = 0; y < n; y += 1) ligne((x) => m[y][x]);
  for (let x = 0; x < n; x += 1) ligne((y) => m[y][x]);
  for (let y = 0; y < n - 1; y += 1) for (let x = 0; x < n - 1; x += 1) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3; }
  let noirs = 0; m.forEach((r) => r.forEach((c) => { if (c) noirs += 1; })); const tot = n * n;
  p += (Math.ceil(Math.abs(noirs * 20 - tot * 10) / tot) - 1) * 10;
  return p;
}
/**
 * Matrice d'un QR code : { taille, version, niveau, masque, modules: [[bool]] } (true = module sombre).
 * opts : { niveau: 'L'|'M'|'Q'|'H' (défaut M), versionMin, versionMax, masque (0-7, sinon le meilleur), relever (true : niveau relevé si la place le permet) }
 */
function qrMatrice(texte, opts) {
  const o = opts || {}; const octets = qrUtf8(texte); let e = Math.max(0, QR_NIVEAUX.indexOf(o.niveau || 'M'));
  const vmin = Math.max(1, o.versionMin || 1); const vmax = Math.min(40, o.versionMax || 40);
  let v = vmin; let bitsUtiles = 0;
  for (; ; v += 1) { bitsUtiles = 4 + qrBitsCompte(v) + octets.length * 8; if (bitsUtiles <= qrOctetsDonnees(v, e) * 8) break; if (v >= vmax) throw new Error('Texte trop long pour un QR code.'); }
  if (o.relever !== false) for (let k = e + 1; k < 4; k += 1) if (bitsUtiles <= qrOctetsDonnees(v, k) * 8) e = k;
  // flux de bits : mode octet (0100), nombre d'octets, données, terminaison, remplissage
  const bits = []; const ajout = (val, len) => { for (let i = len - 1; i >= 0; i -= 1) bits.push((val >>> i) & 1); };
  ajout(4, 4); ajout(octets.length, qrBitsCompte(v)); octets.forEach((b) => ajout(b, 8));
  const cap = qrOctetsDonnees(v, e) * 8;
  ajout(0, Math.min(4, cap - bits.length)); ajout(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) ajout(pad, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let k = 0; k < 8; k += 1) b = (b << 1) | bits[i + k]; data.push(b); }
  // blocs, correction d'erreur, entrelacement
  const nb = QR_NB_BLOCS[e][v]; const eccLen = QR_ECC_PAR_BLOC[e][v]; const bruts = Math.floor(qrModulesBruts(v) / 8);
  const courts = nb - (bruts % nb); const lgCourt = Math.floor(bruts / nb); const div = qrRsDiviseur(eccLen); const blocs = [];
  for (let i = 0, k = 0; i < nb; i += 1) { const d = data.slice(k, k + lgCourt - eccLen + (i < courts ? 0 : 1)); k += d.length; const ecc = qrRsReste(d, div); if (i < courts) d.push(0); blocs.push(d.concat(ecc)); }
  const flux = []; for (let i = 0; i < blocs[0].length; i += 1) blocs.forEach((b, j) => { if (i !== lgCourt - eccLen || j >= courts) flux.push(b[i]); });
  // motifs fixes
  const n = v * 4 + 17; const M = Array.from({ length: n }, () => new Array(n).fill(false)); const F = Array.from({ length: n }, () => new Array(n).fill(false));
  const fixe = (x, y, s) => { M[y][x] = !!s; F[y][x] = true; };
  for (let i = 0; i < n; i += 1) { fixe(6, i, i % 2 === 0); fixe(i, 6, i % 2 === 0); }
  const reperage = (cx, cy) => { for (let dy = -4; dy <= 4; dy += 1) for (let dx = -4; dx <= 4; dx += 1) { const x = cx + dx; const y = cy + dy; if (x >= 0 && x < n && y >= 0 && y < n) { const d = Math.max(Math.abs(dx), Math.abs(dy)); fixe(x, y, d !== 2 && d !== 4); } } };
  reperage(3, 3); reperage(n - 4, 3); reperage(3, n - 4);
  const al = qrPositionsAlignement(v); const na = al.length;
  for (let i = 0; i < na; i += 1) for (let j = 0; j < na; j += 1) { if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue; for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) fixe(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }
  const format = (masque) => {
    const d = (QR_FORMAT_BITS[QR_NIVEAUX[e]] << 3) | masque; let r = d; for (let i = 0; i < 10; i += 1) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412; const bit = (i) => ((b >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i += 1) fixe(8, i, bit(i)); fixe(8, 7, bit(6)); fixe(8, 8, bit(7)); fixe(7, 8, bit(8));
    for (let i = 9; i < 15; i += 1) fixe(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i += 1) fixe(n - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1) fixe(8, n - 15 + i, bit(i));
    fixe(8, n - 8, true);
  };
  format(0);
  if (v >= 7) { let r = v; for (let i = 0; i < 12; i += 1) r = (r << 1) ^ ((r >>> 11) * 0x1f25); const b = (v << 12) | r; for (let i = 0; i < 18; i += 1) { const s = ((b >>> i) & 1) !== 0; const a = n - 11 + (i % 3); const c = Math.floor(i / 3); fixe(a, c, s); fixe(c, a, s); } }
  // placement des données en zigzag (deux colonnes, de bas en haut puis de haut en bas)
  let i = 0;
  for (let droite = n - 1; droite >= 1; droite -= 2) {
    if (droite === 6) droite = 5;
    for (let vert = 0; vert < n; vert += 1) for (let j = 0; j < 2; j += 1) {
      const x = droite - j; const haut = ((droite + 1) & 2) === 0; const y = haut ? n - 1 - vert : vert;
      if (!F[y][x] && i < flux.length * 8) { M[y][x] = ((flux[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i += 1; }
    }
  }
  const appliquer = (k) => { const f = QR_MASQUES[k]; for (let y = 0; y < n; y += 1) for (let x = 0; x < n; x += 1) if (!F[y][x] && f(x, y)) M[y][x] = !M[y][x]; };
  let masque = o.masque;
  if (!(masque >= 0 && masque <= 7)) {
    let best = Infinity; masque = 0;
    for (let k = 0; k < 8; k += 1) { appliquer(k); format(k); const p = qrPenalite(M); if (p < best) { best = p; masque = k; } appliquer(k); }
  }
  appliquer(masque); format(masque);
  return { taille: n, version: v, niveau: QR_NIVEAUX[e], masque, modules: M };
}
// dessin SVG (modules carrés, marge de 4 modules) ; opts : { marge, couleur, fond, titre }
function qrSvg(texte, opts) {
  const o = opts || {}; const q = qrMatrice(texte, o); const mg = o.marge != null ? o.marge : 4; const t = q.taille + mg * 2; let d = '';
  q.modules.forEach((r, y) => { let x = 0; while (x < q.taille) { if (!r[x]) { x += 1; continue; } let l = 1; while (x + l < q.taille && r[x + l]) l += 1; d += `M${x + mg} ${y + mg}h${l}v1h-${l}z`; x += l; } });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges"${o.titre ? ` role="img" aria-label="${esc(o.titre)}"` : ''}><rect width="${t}" height="${t}" fill="${o.fond || '#fff'}"/><path d="${d}" fill="${o.couleur || '#000'}"/></svg>`;
}
