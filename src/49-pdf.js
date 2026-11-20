/* ============ IMPRESSION EN PDF ============
   Dans claude.ai, la page tourne dans un cadre où window.print() n'atteint pas l'imprimante : on fabrique donc un PDF
   (vectoriel : fonds, bordures, mots placés exactement comme à l'écran ; images et dessins SVG intégrés), que l'utilisateur
   enregistre puis imprime. Bibliothèque pdf-lib chargée à la demande (jsDelivr). */
// Impression directe (window.print) : seulement quand la page n'est pas dans un cadre (fichier ouvert seul dans le navigateur)
const CAN_PRINT_DIRECT = (() => { try { return window.self === window.top; } catch (e) { return false; } })();
const PDFLIB_URL = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
let _pdfLibP = null;
function loadPdfLib() {
  if (window.PDFLib) return Promise.resolve(window.PDFLib);
  if (_pdfLibP) return _pdfLibP;
  _pdfLibP = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = PDFLIB_URL; s.async = true;
    s.onload = () => (window.PDFLib ? res(window.PDFLib) : rej(new Error('module PDF incomplet')));
    s.onerror = () => { _pdfLibP = null; rej(new Error('module PDF injoignable (connexion internet ?)')); };
    document.head.appendChild(s);
  });
  return _pdfLibP;
}

// Polices standard du PDF (WinAnsi) : on remplace les caractères qu'elles ne savent pas écrire
const PDF_WINANSI_X = '€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ';
const PDF_SUBST = { ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', '​': '', '→': '->', '⇢': '->', '←': '<-', '≤': '<=', '≥': '>=', '−': '-', '‑': '-', '✓': 'v', '✔': 'v', '✕': 'x', '₂': '2', '⚠': '!', '★': '*', '◌': 'o', '●': '*', '🔒': '', '🖨': '', '📎': '' };
function pdfSafe(s) {
  let o = '';
  for (const ch of String(s == null ? '' : s)) {
    const c = ch.codePointAt(0);
    if ((c >= 0x20 && c <= 0x7E) || (c >= 0xA0 && c <= 0xFF) || PDF_WINANSI_X.includes(ch)) o += ch;
    else if (PDF_SUBST[ch] != null) o += PDF_SUBST[ch];
    else if (c === 9 || c === 10 || c === 13) o += ' ';
  }
  return o;
}
function pdfColor(str) { // « rgb(…) » / « rgba(…) » → couleur posée sur papier blanc, ou null si transparente
  const m = /rgba?\(([^)]+)\)/.exec(str || ''); if (!m) return null;
  const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat); const a = p.length > 3 ? p[3] : 1;
  if (!(a > 0.03)) return null;
  const k = (v) => clamp((v / 255) * a + (1 - a), 0, 1);
  return { r: k(p[0]), g: k(p[1]), b: k(p[2]) };
}
// Couleurs « papier » pour les variables CSS des dessins (indépendantes du thème sombre éventuel)
const PRINT_VARS = { '--ink': '#222222', '--ink2': '#555555', '--surface': '#FFFFFF', '--surface2': '#F1F1F1', '--line': '#BBBBBB', '--bg': '#FFFFFF', '--bad': '#C62828', '--accent': '#2D4A3E' };
function resolveCssVars(txt) {
  const cs = getComputedStyle(document.documentElement);
  return txt.replace(/var\((--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/g, (m0, name, fb) => PRINT_VARS[name] || cs.getPropertyValue(name).trim() || (fb || '').trim() || '#000000');
}
// Dessin SVG → image PNG (pas de foreignObject : le canevas reste exportable)
async function svgToPng(svgEl, scale = 2) {
  const r = svgEl.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null;
  const clone = svgEl.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); clone.setAttribute('width', String(r.width)); clone.setAttribute('height', String(r.height));
  const txt = resolveCssVars(new XMLSerializer().serializeToString(clone));
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('dessin illisible')); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(txt)}`; });
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(r.width * scale)); c.height = Math.max(1, Math.ceil(r.height * scale));
  const g = c.getContext('2d'); g.scale(scale, scale); g.drawImage(img, 0, 0, r.width, r.height);
  return c.toDataURL('image/png');
}

/* Points de coupure entre pages : bas de lignes de tableaux, de titres, de paragraphes ; sauts forcés avant .pdf-break */
function pdfCuts(root, R0, pageH, H) {
  const rel = (el) => { const r = el.getBoundingClientRect(); return { top: r.top - R0.top, bottom: r.bottom - R0.top }; };
  const cand = uniq(Array.from(root.querySelectorAll('tr, h1, h2, h3, p, li, table, dl, .ft-wrap, .fh-champs, .rcols > div, .rpt-blk, .pdf-blk')).map((e) => Math.round(rel(e).bottom))).filter((y) => y > 0 && y < H).sort((a, b) => a - b);
  const forced = Array.from(root.querySelectorAll('.pdf-break')).map((e) => Math.round(rel(e).top)).filter((y) => y > 2).sort((a, b) => a - b);
  const cuts = [0]; let start = 0;
  while (start < H - 1) {
    const limit = start + pageH;
    const f = forced.find((y) => y > start + 2 && y <= limit + 1);
    let cut = f;
    if (cut == null) { if (limit >= H) cut = H; else { const ok = cand.filter((y) => y > start + 40 && y <= limit); cut = ok.length ? ok[ok.length - 1] : limit; } }
    cuts.push(Math.min(H, cut)); start = cut;
  }
  return cuts;
}

/* Rendu d'un élément du DOM (déjà affiché) dans une ou plusieurs pages PDF.
   unit = { el, orientation: 'portrait'|'paysage', fit: 'page'|'width', format: 'A4'|'A3' } */
async function drawUnit(doc, L, F, unit) {
  const root = unit.el; const R0 = root.getBoundingClientRect(); const W = R0.width, H = R0.height;
  const A = unit.format === 'A3' ? [841.89, 1190.55] : [595.28, 841.89];
  const [pw, ph] = unit.orientation === 'portrait' ? A : [A[1], A[0]]; const m = unit.marge != null ? unit.marge : 28.35;
  let s = (pw - 2 * m) / W; if (unit.fit === 'page') s = Math.min(s, (ph - 2 * m) / H);
  const cuts = unit.fit === 'page' ? [0, H] : pdfCuts(root, R0, (ph - 2 * m) / s, H);
  const all = [root, ...root.querySelectorAll('*')].filter((el) => !el.closest('.no-print'));
  const boxes = []; const imgs = []; const svgs = [];
  for (const el of all) {
    if (el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg') continue;
    if (el.tagName.toLowerCase() === 'svg' && el.parentElement && el.parentElement.closest('svg')) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect(); if (r.width < 0.5 || r.height < 0.5) continue;
    const box = { x: r.left - R0.left, y: r.top - R0.top, w: r.width, h: r.height };
    if (el.tagName.toLowerCase() === 'svg') { svgs.push({ el, box }); continue; }
    if (el.tagName === 'IMG') { imgs.push({ el, box }); continue; }
    const bg = pdfColor(cs.backgroundColor);
    const sides = ['Top', 'Right', 'Bottom', 'Left'].map((k) => ({ k, w: parseFloat(cs[`border${k}Width`]) || 0, st: cs[`border${k}Style`], c: pdfColor(cs[`border${k}Color`]) })).filter((b) => b.w > 0 && b.c && b.st !== 'none' && b.st !== 'hidden');
    if (bg || sides.length) boxes.push({ box, bg, sides });
  }
  // texte : chaque mot placé à sa position mesurée
  const words = []; const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const rg = document.createRange();
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const p = n.parentElement; if (!p || p.closest('svg') || p.closest('.no-print')) continue;
    const cs = getComputedStyle(p); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const col = pdfColor(cs.color); if (!col) continue;
    const fs = parseFloat(cs.fontSize) || 12; const fam = cs.fontFamily.toLowerCase();
    const mono = /mono|courier/.test(fam); const bold = (parseInt(cs.fontWeight, 10) || 400) >= 600; const ital = cs.fontStyle === 'italic' || cs.fontStyle === 'oblique';
    const tt = cs.textTransform; const und = /underline/.test(cs.textDecorationLine || cs.textDecoration || '');
    const re = /\S+/g; let mt;
    while ((mt = re.exec(n.data))) {
      rg.setStart(n, mt.index); rg.setEnd(n, mt.index + mt[0].length);
      const rs = rg.getClientRects(); if (!rs.length) continue; const rr = rs[0];
      let t = mt[0]; if (tt === 'uppercase') t = t.toUpperCase(); else if (tt === 'lowercase') t = t.toLowerCase();
      words.push({ t, x: rr.left - R0.left, y: rr.top - R0.top, w: rr.width, h: rr.height, fs, col, mono, bold, ital, und });
    }
  }
  const font = (w) => (w.mono ? (w.bold ? F.mb : F.m) : w.bold ? (w.ital ? F.bi : F.b) : (w.ital ? F.i : F.r));
  const imgCache = new Map();
  const embed = async (src) => {
    if (imgCache.has(src)) return imgCache.get(src);
    let im = null; try { im = /^data:image\/jpe?g/i.test(src) ? await doc.embedJpg(src) : /^data:image\/png/i.test(src) ? await doc.embedPng(src) : null; } catch (e) { im = null; }
    imgCache.set(src, im); return im;
  };
  const svgPng = new Map(); for (const sv of svgs) { try { svgPng.set(sv, await svgToPng(sv.el, unit.svgScale || 2.5)); } catch (e) { svgPng.set(sv, null); } }
  for (let k = 0; k < cuts.length - 1; k += 1) {
    const y0 = cuts[k], y1 = cuts[k + 1]; const page = doc.addPage([pw, ph]);
    const X = (x) => m + x * s; const Y = (y) => ph - m - (y - y0) * s; const inside = (b) => b.y < y1 - 0.5 && b.y + b.h > y0 + 0.5;
    const C = (c) => L.rgb(c.r, c.g, c.b);
    for (const b of boxes) {
      if (!inside(b.box) || !b.bg) continue;
      const top = Math.max(b.box.y, y0), bot = Math.min(b.box.y + b.box.h, y1);
      page.drawRectangle({ x: X(b.box.x), y: Y(bot), width: b.box.w * s, height: (bot - top) * s, color: C(b.bg) });
    }
    for (const im of imgs) {
      if (!inside(im.box)) continue; const e = await embed(im.el.currentSrc || im.el.src); if (!e) continue;
      const nw = im.el.naturalWidth || e.width, nh = im.el.naturalHeight || e.height; const k2 = Math.min(im.box.w / nw, im.box.h / nh);
      const w = nw * k2, h = nh * k2; const ox = im.box.x + (im.box.w - w) / 2, oy = im.box.y + (im.box.h - h) / 2;
      page.drawImage(e, { x: X(ox), y: Y(oy + h), width: w * s, height: h * s });
    }
    for (const sv of svgs) {
      if (!inside(sv.box)) continue; const src = svgPng.get(sv); if (!src) continue; const e = await embed(src); if (!e) continue;
      page.drawImage(e, { x: X(sv.box.x), y: Y(sv.box.y + sv.box.h), width: sv.box.w * s, height: sv.box.h * s });
    }
    for (const b of boxes) {
      if (!inside(b.box)) continue; const { x, y, w, h } = b.box;
      for (const sd of b.sides) {
        const t = sd.w * s; const dash = sd.st === 'dotted' ? [Math.max(0.6, t), 1.6] : sd.st === 'dashed' ? [3, 2] : undefined;
        const seg = sd.k === 'Top' ? [x, y, x + w, y] : sd.k === 'Bottom' ? [x, y + h, x + w, y + h] : sd.k === 'Left' ? [x, y, x, y + h] : [x + w, y, x + w, y + h];
        if (Math.max(seg[1], seg[3]) < y0 - 0.5 || Math.min(seg[1], seg[3]) > y1 + 0.5) continue;
        const cy = (v) => clamp(v, y0, y1);
        page.drawLine({ start: { x: X(seg[0]), y: Y(cy(seg[1])) }, end: { x: X(seg[2]), y: Y(cy(seg[3])) }, thickness: Math.max(0.35, t), color: C(sd.c), dashArray: dash });
      }
    }
    for (const w of words) {
      if (w.y < y0 - 0.5 || w.y + w.h > y1 + 1.5) continue;
      if (w.t === '☐') { const z = w.fs * 0.72 * s; page.drawRectangle({ x: X(w.x) + (w.w * s - z) / 2, y: Y(w.y + w.h) + (w.h * s - z) / 2, width: z, height: z, borderColor: C(w.col), borderWidth: 0.7 }); continue; }
      const t = pdfSafe(w.t); if (!t.trim()) continue;
      const f = font(w); let size = w.fs * s; const fw = f.widthOfTextAtSize(t, size); const target = w.w * s;
      if (target > 0 && fw > target * 1.04) size = Math.max(size * 0.72, size * (target / fw));
      const base = Y(w.y + w.h) + w.fs * 0.22 * s;
      page.drawText(t, { x: X(w.x), y: base, size, font: f, color: C(w.col) });
      if (w.und) page.drawLine({ start: { x: X(w.x), y: base - 1 }, end: { x: X(w.x) + Math.min(fw, target || fw), y: base - 1 }, thickness: 0.5, color: C(w.col) });
    }
  }
}
async function htmlToPdf(units, meta = {}) {
  const L = await loadPdfLib(); const doc = await L.PDFDocument.create();
  const S = L.StandardFonts;
  const F = { r: await doc.embedFont(S.Helvetica), b: await doc.embedFont(S.HelveticaBold), i: await doc.embedFont(S.HelveticaOblique), bi: await doc.embedFont(S.HelveticaBoldOblique), m: await doc.embedFont(S.Courier), mb: await doc.embedFont(S.CourierBold) };
  for (const u of units) await drawUnit(doc, L, F, u);
  doc.setTitle(pdfSafe(meta.title || 'Œnotrack')); doc.setCreator('Œnotrack'); doc.setProducer('Œnotrack'); doc.setAuthor(pdfSafe(meta.author || 'Œnotrack'));
  return doc.save();
}
// Fabrique le PDF (en police proche d'Arial pour un placement exact) puis propose de l'enregistrer
async function printPdf({ units, filename, title, author, toast, root }) {
  const host = root || (units[0] && units[0].el); if (host) host.classList.add('pdf-mode');
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  let bytes;
  try { bytes = await htmlToPdf(units, { title, author }); } catch (e) { if (host) host.classList.remove('pdf-mode'); toast(`Création du PDF impossible : ${e.message}`, 'bad'); return false; }
  if (host) host.classList.remove('pdf-mode');
  const r = await saveFile(filename, new Blob([bytes], { type: 'application/pdf' }), 'application/pdf');
  if (r.ok) { toast('PDF enregistré : ouvrez-le puis lancez l’impression (Ctrl/Cmd + P).'); return true; }
  if (!r.declined) toast(failMsg(r), 'bad');
  return false;
}
