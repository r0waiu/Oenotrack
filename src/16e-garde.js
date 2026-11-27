/* ============ GARDE DES IMPORTATIONS (0.27.0-alpha.1) ============
   Tout fichier qui entre dans Œnotrack (documents joints, fiches FT et FDS, barèmes de jaugeage, bulletins d'analyses, logo,
   sauvegardes et fichiers du Drive, fichiers de traçabilité) est vérifié en arrière-plan avant d'être gardé :
   - taille (vide, trop gros), nom trompeur (inversion du sens d'écriture, extension dangereuse cachée derrière une autre) ;
   - type réel lu dans le contenu (signature), comparé à l'extension : programmes, scripts, pages web, archives refusés partout ;
   - PDF : code JavaScript, actions automatiques, lancement de programme, fichiers incorporés, formulaires XFA, médias… → le PDF est
     « désarmé » (contenu actif retiré avec pdf-lib, puis revérifié) ; refusé s'il ne peut pas l'être ;
   - documents Office : macros (VBA), contrôles ActiveX, objets OLE incorporés, modèle distant → refusés ; RTF avec objets → refusé ;
   - images : dimensions démesurées (bombe de décompression) → refusées ; SVG accepté pour le logo seulement (redessiné en PNG) ;
   - données (JSON) : clés piégées (__proto__, constructor, prototype) retirées, profondeur limitée, structure vérifiée ; logo d'une
     base importée : seulement une image PNG, JPEG, WebP ou GIF ;
   - tableurs : la bibliothèque de lecture est surveillée (pollution des prototypes JavaScript : fichier refusé, dégâts réparés) ;
   - exports CSV : cellules commençant par = + - @ neutralisées (pas de formule exécutée à l'ouverture dans un tableur).
   Refus, désarmements et avertissements : journal de sécurité (db.gardeJournal, 300 dernières entrées, synchronisé). */
const GARDE_MO = 1024 * 1024;
const GARDE_USAGES = {
  document: { max: 40 * GARDE_MO, familles: ['pdf', 'image', 'office', 'texte', 'json', 'xml'] },
  fiche: { max: 40 * GARDE_MO, familles: ['pdf', 'image', 'office', 'texte'] },
  bareme: { max: 40 * GARDE_MO, familles: ['pdf', 'image', 'office', 'texte', 'json'] },
  bulletin: { max: 40 * GARDE_MO, familles: ['pdf', 'image', 'office', 'texte', 'json', 'xml'] },
  logo: { max: 10 * GARDE_MO, familles: ['image', 'svg'] },
  sauvegarde: { max: 1024 * GARDE_MO, familles: ['json'] },
  tracabilite: { max: 20 * GARDE_MO, familles: ['json'] },
  catalogue: { max: 60 * GARDE_MO, familles: ['pdf', 'office', 'texte'] }, // catalogues de produits, cahiers des charges (0.30.0-alpha.1)
  cahier: { max: 60 * GARDE_MO, familles: ['pdf', 'office', 'texte'] },
  codification: { max: 5 * GARDE_MO, familles: ['json'] }, // codification des lots exportée (0.41.0-alpha.1)
};
const GARDE_USAGE_ICI = { codification: 'codifications des lots', document: 'documents joints', fiche: 'fiches produits', bareme: 'barèmes de jaugeage', bulletin: 'bulletins d’analyses', logo: 'logo', sauvegarde: 'sauvegardes', tracabilite: 'fichiers de traçabilité', catalogue: 'catalogues de produits', cahier: 'cahiers des charges' };
const GARDE_USAGE_LIB = { codification: 'Codification des lots', document: 'Document joint', fiche: 'Fiche produit (FT, FDS)', bareme: 'Barème de jaugeage', bulletin: 'Bulletin d’analyses', logo: 'Logo', sauvegarde: 'Sauvegarde ou base', tracabilite: 'Fichier de traçabilité', catalogue: 'Catalogue de produits', cahier: 'Cahier des charges' };
const GARDE_EXT_DANGER = new Set(('exe com scr pif bat cmd vbs vbe js jse mjs cjs wsf wsh wsc ps1 psm1 psd1 ps1xml msi msp mst msix appx jar hta htm html xhtml '
  + 'mht mhtml shtml svgz lnk url reg dll sys cpl ocx scf inf iso img vhd vhdx apk ipa app dmg pkg deb rpm sh bash zsh csh ksh command py pyw pyc '
  + 'pl rb php phtml asp aspx jsp chm gadget application appref-ms xbap website library-ms settingcontent-ms ade adp mde accde accda mda mdb accdb crx xpi swf').split(' '));
const GARDE_EXT_MACRO = new Set('docm dotm xlsm xltm xlam pptm potm ppam ppsm sldm'.split(' '));
const GARDE_EXT_ARCHIVE = new Set('zip 7z rar gz tgz bz2 xz tar cab arj lz lzh zst'.split(' '));
const GARDE_EXT_FAMILLE = {
  pdf: 'pdf', jpg: 'image', jpeg: 'image', jpe: 'image', jfif: 'image', png: 'image', gif: 'image', webp: 'image', bmp: 'image', tif: 'image', tiff: 'image', heic: 'image', heif: 'image', avif: 'image', svg: 'svg',
  doc: 'office', docx: 'office', dot: 'office', dotx: 'office', odt: 'office', ott: 'office', rtf: 'office', xls: 'office', xlsx: 'office', xlsb: 'office', xlt: 'office', xltx: 'office', ods: 'office', ots: 'office',
  ppt: 'office', pptx: 'office', pps: 'office', ppsx: 'office', odp: 'office', msg: 'office', csv: 'texte', tsv: 'texte', txt: 'texte', text: 'texte', eml: 'texte', md: 'texte', log: 'texte', json: 'json', xml: 'xml',
};
const GARDE_FAMILLES_DANGER = ['programme', 'script', 'html', 'archive', 'binaire', 'video'];
const gardeTaille = (n) => (n >= GARDE_MO ? `${String(Math.round((n / GARDE_MO) * 10) / 10).replace('.', ',')} Mo` : `${Math.max(1, Math.round(n / 1024))} Ko`);
const GARDE_BIDI = /[‪-‮⁦-⁩‎‏؜]/;
const gardeExt = (nom) => { const m = /\.([a-z0-9-]{1,20})$/i.exec(String(nom || '').trim()); return m ? m[1].toLowerCase() : ''; };
const gardeNomPropre = (nom) => String(nom || 'fichier').replace(/[\u0000-\u001f\u007f]/g, '').replace(/[‪-‮⁦-⁩‎‏؜]/g, '').trim().slice(0, 200) || 'fichier';

/* ---------- lecture des octets ---------- */
const gardeOct = (b, i, sig) => { if (i + sig.length > b.length) return false; for (let k = 0; k < sig.length; k += 1) if (b[i + k] !== sig[k]) return false; return true; };
const gardeAscii = (b, i, n) => { let s = ''; const f = Math.min(b.length, i + n); for (let k = i; k < f; k += 1) s += String.fromCharCode(b[k]); return s; };
function gardeLatin1(b, max) { const n = Math.min(b.length, max || b.length); let s = ''; for (let i = 0; i < n; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, Math.min(n, i + 0x8000))); return s; }
// texte d'un fichier quelconque (0.38.0-alpha.3) : UTF-8 (avec ou sans BOM), UTF-16 (« Texte Unicode » d'Excel : BOM ou octets nuls
// alternés), sinon Windows-1252 (CSV d'Excel en français) — les accents (« Acidité ») ne deviennent plus « Acidit� »
function texteDeOctets(b) {
  b = b instanceof Uint8Array ? b : new Uint8Array(b || []); if (!b.length) return '';
  const dec = (enc, x, fatal) => new TextDecoder(enc, { fatal: !!fatal }).decode(x);
  try {
    if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) return dec('utf-8', b.subarray(3));
    if (b[0] === 0xff && b[1] === 0xfe) return dec('utf-16le', b.subarray(2));
    if (b[0] === 0xfe && b[1] === 0xff) return dec('utf-16be', b.subarray(2));
    const n = Math.min(b.length, 4000); let z0 = 0, z1 = 0; for (let i = 0; i < n; i += 1) if (!b[i]) { if (i % 2) z1 += 1; else z0 += 1; }
    if (z1 > n / 4 && z0 < n / 50) return dec('utf-16le', b); if (z0 > n / 4 && z1 < n / 50) return dec('utf-16be', b);
    try { return dec('utf-8', b, true); } catch (e) { return dec('windows-1252', b); }
  } catch (e) { return gardeLatin1(b); }
}
function gardeDecoder(b, utf16) {
  try { if (typeof TextDecoder === 'function') return new TextDecoder(utf16 ? (b[0] === 0xfe ? 'utf-16be' : 'utf-16le') : 'utf-8', { fatal: false }).decode(b); } catch (e) { /* plus bas */ }
  return gardeLatin1(b);
}
// recherche d'une suite d'octets (motif court) dans un tampon
function gardeChercher(b, motif, depuis) { const m0 = motif[0]; const L = motif.length; for (let i = depuis || 0; i <= b.length - L; i += 1) { if (b[i] !== m0) continue; let k = 1; while (k < L && b[i + k] === motif[k]) k += 1; if (k === L) return i; } return -1; }
const gardeUtf16 = (s) => { const out = []; for (let i = 0; i < s.length; i += 1) { out.push(s.charCodeAt(i) & 0xff, s.charCodeAt(i) >> 8); } return out; };

/* ---------- type réel d'après le contenu ---------- */
function gardeSignature(b) {
  const A = (i, s) => gardeAscii(b, i, s.length) === s;
  if (!b || !b.length) return { famille: 'vide', nom: 'fichier vide' };
  if (A(0, 'MZ')) return { famille: 'programme', nom: 'programme Windows' };
  if (gardeOct(b, 0, [0x7f, 0x45, 0x4c, 0x46])) return { famille: 'programme', nom: 'programme Linux' };
  if ([[0xfe, 0xed, 0xfa, 0xce], [0xfe, 0xed, 0xfa, 0xcf], [0xce, 0xfa, 0xed, 0xfe], [0xcf, 0xfa, 0xed, 0xfe], [0xca, 0xfe, 0xba, 0xbe]].some((s) => gardeOct(b, 0, s))) return { famille: 'programme', nom: 'programme macOS ou Java' };
  if (gardeOct(b, 0, [0x4c, 0, 0, 0, 0x01, 0x14, 0x02, 0])) return { famille: 'programme', nom: 'raccourci Windows' };
  if (A(0, 'ITSF')) return { famille: 'programme', nom: 'aide compilée Windows' };
  if (A(0, 'CWS') || A(0, 'FWS') || A(0, 'ZWS')) return { famille: 'programme', nom: 'animation Flash' };
  if (A(0, '#!')) return { famille: 'script', nom: 'script' };
  if (A(0, 'MSCF')) return { famille: 'archive', nom: 'archive CAB' };
  if (A(0, 'Rar!')) return { famille: 'archive', nom: 'archive RAR' };
  if (gardeOct(b, 0, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return { famille: 'archive', nom: 'archive 7-Zip' };
  if (gardeOct(b, 0, [0x1f, 0x8b])) return { famille: 'archive', nom: 'archive gzip' };
  if (A(0, 'BZh') || gardeOct(b, 0, [0xfd, 0x37, 0x7a, 0x58, 0x5a, 0])) return { famille: 'archive', nom: 'archive compressée' };
  if (b.length > 0x8006 && A(0x8001, 'CD001')) return { famille: 'archive', nom: 'image disque' };
  if (gardeAscii(b, 0, 1024).indexOf('%PDF-') >= 0) return { famille: 'pdf', type: 'application/pdf', nom: 'PDF' };
  if (gardeOct(b, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { famille: 'image', type: 'image/png', nom: 'image PNG' };
  if (gardeOct(b, 0, [0xff, 0xd8, 0xff])) return { famille: 'image', type: 'image/jpeg', nom: 'image JPEG' };
  if (A(0, 'GIF87a') || A(0, 'GIF89a')) return { famille: 'image', type: 'image/gif', nom: 'image GIF' };
  if (A(0, 'RIFF') && A(8, 'WEBP')) return { famille: 'image', type: 'image/webp', nom: 'image WebP' };
  if (A(0, 'BM') && b.length > 26) return { famille: 'image', type: 'image/bmp', nom: 'image BMP' };
  if (gardeOct(b, 0, [0x49, 0x49, 0x2a, 0]) || gardeOct(b, 0, [0x4d, 0x4d, 0, 0x2a])) return { famille: 'image', type: 'image/tiff', nom: 'image TIFF' };
  if (A(4, 'ftyp')) { const br = gardeAscii(b, 8, 4); if (/^(?:heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(br)) return { famille: 'image', type: 'image/heic', nom: 'image HEIC' }; if (/^avi[fs]$/.test(br)) return { famille: 'image', type: 'image/avif', nom: 'image AVIF' }; return { famille: 'video', nom: 'vidéo' }; }
  if (gardeOct(b, 0, [0x50, 0x4b, 0x03, 0x04]) || gardeOct(b, 0, [0x50, 0x4b, 0x05, 0x06])) return { famille: 'zip', nom: 'archive ZIP' };
  if (gardeOct(b, 0, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { famille: 'ole', type: 'application/octet-stream', nom: 'document Office (ancien format)' };
  if (A(0, '{\\rtf')) return { famille: 'rtf', type: 'application/rtf', nom: 'document RTF' };
  // texte : sans octet nul (sauf UTF-16 annoncé), peu de caractères de contrôle
  const utf16 = (b[0] === 0xff && b[1] === 0xfe) || (b[0] === 0xfe && b[1] === 0xff);
  const n = Math.min(b.length, 65536); let nul = 0; let ctrl = 0;
  for (let i = 0; i < n; i += 1) { const c = b[i]; if (c === 0) nul += 1; else if (c < 9 || (c > 13 && c < 32 && c !== 27)) ctrl += 1; }
  if (!utf16 && (nul > 0 || ctrl > n * 0.01)) return { famille: 'binaire', nom: 'fichier binaire inconnu' };
  const t = gardeDecoder(b.subarray(0, Math.min(b.length, 4096)), utf16).replace(/^﻿/, '').replace(/^\s+/, '').toLowerCase();
  if (/^(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*(?:<!doctype\s+svg|<svg[\s>])/.test(t)) return { famille: 'svg', type: 'image/svg+xml', nom: 'image SVG' };
  if (/^(?:<!--[\s\S]*?-->\s*)*(?:<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>]|<script[\s>]|<iframe[\s>]|<meta[\s>]|<object[\s>]|<embed[\s>]|<form[\s>]|<style[\s>])/.test(t) || /^<\?xml[^>]*>\s*<html[\s>]/.test(t)) return { famille: 'html', nom: 'page web (HTML)' };
  if (/^<\?xml|^<[a-z_][\w.:-]*[\s>/]/.test(t)) return { famille: 'xml', type: 'application/xml', nom: 'XML' };
  if (/^[{[]/.test(t)) return { famille: 'json', type: 'application/json', nom: 'données JSON' };
  return { famille: 'texte', type: 'text/plain', nom: 'texte', utf16 };
}

/* ---------- conteneurs ZIP (Office récents, OpenDocument) : répertoire central ---------- */
function gardeZip(b) {
  const n = b.length; let e = -1;
  for (let i = n - 22; i >= Math.max(0, n - 65557); i -= 1) if (b[i] === 0x50 && b[i + 1] === 0x4b && b[i + 2] === 5 && b[i + 3] === 6) { e = i; break; }
  if (e < 0) return null;
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let nb = dv.getUint16(e + 10, true); let off = dv.getUint32(e + 16, true);
  if ((nb === 0xffff || off === 0xffffffff) && e >= 20 && dv.getUint32(e - 20, true) === 0x07064b50) { // ZIP64
    const z = Number(dv.getBigUint64 ? dv.getBigUint64(e - 12, true) : 0); if (z + 56 <= n && dv.getUint32(z, true) === 0x06064b50) { nb = Number(dv.getBigUint64(z + 32, true)); off = Number(dv.getBigUint64(z + 48, true)); }
  }
  const entrees = []; let total = 0; let p = off;
  for (let k = 0; k < nb && k < 20000; k += 1) {
    if (p + 46 > n || dv.getUint32(p, true) !== 0x02014b50) break;
    const meth = dv.getUint16(p + 10, true); const csize = dv.getUint32(p + 20, true); const usize = dv.getUint32(p + 24, true); const ln = dv.getUint16(p + 28, true); const lx = dv.getUint16(p + 30, true); const lc = dv.getUint16(p + 32, true); const loc = dv.getUint32(p + 42, true);
    entrees.push({ nom: gardeDecoder(b.subarray(p + 46, p + 46 + ln)), meth, csize, usize, loc }); total += usize; p += 46 + ln + lx + lc;
  }
  return { entrees, total, n: nb };
}
// contenu (décompressé) d'une entrée de l'archive
async function gardeZipLire(b, x, inflate) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength); const p = x.loc; if (p + 30 > b.length || dv.getUint32(p, true) !== 0x04034b50) return null;
  const d = p + 30 + dv.getUint16(p + 26, true) + dv.getUint16(p + 28, true); const data = b.subarray(d, d + x.csize);
  if (x.meth === 0) return data; if (x.meth !== 8 || !inflate) return null;
  try { return await inflate(data, true, 8 * GARDE_MO); } catch (e) { return null; }
}
async function gardeOffice(b, inflate) {
  const z = gardeZip(b); if (!z || !z.entrees.length) return { famille: 'archive', nom: 'archive ZIP illisible', raisons: [] };
  const L = z.entrees.map((x) => x.nom.toLowerCase()); const has = (re) => L.some((x) => re.test(x));
  const ooxml = has(/^\[content_types\]\.xml$/); const odf = has(/^mimetype$/) && (has(/^content\.xml$/) || has(/^meta-inf\/manifest\.xml$/));
  if (!ooxml && !odf) return { famille: 'archive', nom: 'archive ZIP', raisons: [] };
  const nom = ooxml ? (has(/^word\//) ? 'document Word' : has(/^xl\//) ? 'classeur Excel' : has(/^ppt\//) ? 'présentation PowerPoint' : 'document Office') : 'document OpenDocument';
  const type = ooxml ? (has(/^word\//) ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : has(/^xl\//) ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : has(/^ppt\//) ? 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 'application/octet-stream') : 'application/vnd.oasis.opendocument';
  const raisons = [];
  if (has(/(?:^|\/)vbaproject\.bin$/) || has(/(?:^|\/)vbadata\.xml$/) || has(/(?:^|\/)macrosheets\//) || (odf && (has(/^basic\//) || has(/^scripts\//)))) raisons.push('macros (VBA ou scripts) incorporées');
  if (has(/(?:^|\/)activex\//)) raisons.push('contrôles ActiveX');
  if (has(/(?:^|\/)embeddings\/[^/]*\.bin$/) || has(/(?:^|\/)oleobject\d*\.bin$/) || (odf && has(/^object\s?\d+\/(?:ole|objectreplacements)/))) raisons.push('objet OLE incorporé (peut cacher un programme)');
  if (z.total > 1024 * GARDE_MO || z.n > 10000) raisons.push('contenu démesuré une fois décompressé (bombe de décompression)');
  // modèle ou objet distant (injection de modèle) : relations « TargetMode="External" » de types dangereux
  if (ooxml && inflate) {
    for (const x of z.entrees.filter((y) => /_rels\/[^/]+\.rels$/i.test(y.nom)).slice(0, 40)) {
      const o = await gardeZipLire(b, x, inflate); if (!o) continue; const t = gardeDecoder(o);
      if (/Relationship[^>]+(?:attachedTemplate|oleObject|subDocument|frame)[^>]*TargetMode=["']External|Relationship[^>]+TargetMode=["']External[^>]*(?:attachedTemplate|oleObject|subDocument|frame)/i.test(t)) { raisons.push('modèle ou objet chargé depuis internet à l’ouverture'); break; }
    }
  }
  return { famille: 'office', type, nom, raisons };
}
// ancien format Office (OLE) : flux de macros ou objets « Package » (programmes cachés)
function gardeOle(b) {
  const raisons = [];
  if (gardeChercher(b, gardeUtf16('_VBA_PROJECT')) >= 0 || gardeChercher(b, gardeUtf16('VBA_PROJECT')) >= 0 || (gardeChercher(b, gardeUtf16('Macros')) >= 0 && gardeChercher(b, gardeUtf16('VBA')) >= 0)) raisons.push('macros (VBA) incorporées');
  if (gardeChercher(b, gardeUtf16('Ole10Native')) >= 0) raisons.push('objet OLE incorporé (peut cacher un programme)');
  return raisons;
}
function gardeRtf(b) { const t = gardeLatin1(b, 20 * GARDE_MO); return /\\obj(?:data|emb|link|autlink|update|ocx|html)|\\object\b/i.test(t) ? ['objet incorporé dans le RTF (moyen d’attaque connu)'] : []; }

/* ---------- images : dimensions (bombe de décompression) ---------- */
function gardeImageDims(b, type) {
  try {
    const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    if (type === 'image/png' && b.length >= 24) return { w: dv.getUint32(16), h: dv.getUint32(20) };
    if (type === 'image/gif' && b.length >= 10) return { w: dv.getUint16(6, true), h: dv.getUint16(8, true) };
    if (type === 'image/bmp' && b.length >= 26) return { w: Math.abs(dv.getInt32(18, true)), h: Math.abs(dv.getInt32(22, true)) };
    if (type === 'image/webp' && b.length >= 30) {
      const c = gardeAscii(b, 12, 4);
      if (c === 'VP8 ') return { w: dv.getUint16(26, true) & 0x3fff, h: dv.getUint16(28, true) & 0x3fff };
      if (c === 'VP8L') return { w: 1 + (((b[22] & 0x3f) << 8) | b[21]), h: 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)) };
      if (c === 'VP8X') return { w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
    }
    if (type === 'image/jpeg') {
      let i = 2; while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i += 1; continue; } const m = b[i + 1]; if (m === 0xff) { i += 1; continue; }
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { h: dv.getUint16(i + 5), w: dv.getUint16(i + 7) };
        if (m === 0xd8 || (m >= 0xd0 && m <= 0xd7) || m === 0x01) { i += 2; continue; } i += 2 + dv.getUint16(i + 2);
      }
    }
  } catch (e) { /* entête incomplète */ }
  return null;
}

/* ---------- PDF : contenu actif ---------- */
const GARDE_PDF_ACTIFS = ['JavaScript', 'JS', 'Launch', 'EmbeddedFile', 'EmbeddedFiles', 'RichMedia', 'XFA', 'AA', 'SubmitForm', 'ImportData', 'GoToR', 'GoToE', 'FileAttachment', 'Sound', 'Movie', 'Rendition'];
const GARDE_PDF_NOMS = new Set([...GARDE_PDF_ACTIFS, 'OpenAction', 'AcroForm', 'Encrypt', 'ObjStm', 'URI']);
const GARDE_PDF_LIB = { JavaScript: 'code JavaScript', JS: 'code JavaScript', Launch: 'lancement d’un programme', EmbeddedFile: 'fichier incorporé', EmbeddedFiles: 'fichier incorporé', FileAttachment: 'fichier incorporé', RichMedia: 'média interactif', XFA: 'formulaire dynamique (XFA)', AA: 'action automatique', SubmitForm: 'envoi de formulaire vers internet', ImportData: 'import de données', GoToR: 'ouverture d’un autre fichier', GoToE: 'ouverture d’un fichier incorporé', Sound: 'son ou vidéo', Movie: 'son ou vidéo', Rendition: 'son ou vidéo' };
function gardePdfNomDe(m) { let nm = m[1]; if (nm.indexOf('#') >= 0) nm = nm.replace(/#([0-9A-Fa-f]{2})/g, (x, h) => String.fromCharCode(parseInt(h, 16))); return nm; }
function gardePdfNoms(s, c) {
  const re = /\/([A-Za-z0-9#]{1,40})/g; let m;
  while ((m = re.exec(s))) { const nm = gardePdfNomDe(m); if (GARDE_PDF_NOMS.has(nm)) c[nm] = (c[nm] || 0) + 1; }
  return c;
}
// dans les données d'un flux (image, police, page…) : un nom entouré de texte compte (objet caché dans un faux flux) ; au milieu
// d'octets binaires, c'est le plus souvent le hasard (« /JS » dans une image) : noté « douteux », la structure du document tranche
function gardePdfNomsFlux(s, t, d) {
  const re = /\/([A-Za-z0-9#]{1,40})/g; let m;
  while ((m = re.exec(s))) {
    const nm = gardePdfNomDe(m); if (!GARDE_PDF_NOMS.has(nm)) continue;
    const autour = s.slice(Math.max(0, m.index - 24), m.index + m[0].length + 24); const X = /^[\t\n\r\x20-\x7e]*$/.test(autour) ? t : d; X[nm] = (X[nm] || 0) + 1;
  }
}
// analyse d'un PDF : noms des dictionnaires (hors des données des flux), y compris ceux rangés dans les flux d'objets compressés (ObjStm)
// → { actifs (certains), horsFlux (dans les dictionnaires), douteux (seulement au milieu de données binaires), chiffre, objStm, vus, illisibles }
async function gardePdfAnalyser(b, inflate) {
  const s = gardeLatin1(b); const c = {}; const t = {}; const d = {}; let vus = 0; let illisibles = 0; let total = 0; let objStm = 0; let pos = 0; let i = 0;
  while ((i = s.indexOf('stream', i)) >= 0) {
    if (s.slice(i - 3, i) === 'end') { i += 6; continue; }
    const eol = /^stream(?:\r\n|\n|\r)/.exec(s.slice(i, i + 8));
    if (!eol || !/>>\s*$/.test(s.slice(Math.max(0, i - 64), i))) { i += 6; continue; } // pas un début de flux (après son dictionnaire)
    const debutObj = s.lastIndexOf(' obj', i); const dict = debutObj >= 0 && i - debutObj < 4000 ? s.slice(debutObj, i) : s.slice(Math.max(0, i - 600), i);
    const dn = dict.replace(/#([0-9A-Fa-f]{2})/g, (x, h) => String.fromCharCode(parseInt(h, 16)));
    const d0 = i + eol[0].length; const lm = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dn); let f = lm ? d0 + parseInt(lm[1], 10) : -1;
    if (f < d0 || f > b.length || !/^\s*endstream/.test(s.slice(f, f + 40))) f = s.indexOf('endstream', d0);
    if (f < 0) break; // flux sans fin : le reste est lu comme du texte
    gardePdfNoms(s.slice(pos, i), c); // dictionnaires et objets avant ce flux
    if (/\/Type\s*\/ObjStm/.test(dn)) {
      objStm += 1;
      if (!inflate || !/\/FlateDecode/.test(dn) || /\/Filter\s*\[[^\]]*\/[A-Za-z0-9]+[^\]]*\/[A-Za-z0-9]+/.test(dn)) illisibles += 1;
      else { try { const o = await inflate(b.subarray(d0, f), false, 64 * GARDE_MO); total += o.length; gardePdfNoms(gardeLatin1(o), c); vus += 1; } catch (e) { illisibles += 1; } }
    } else gardePdfNomsFlux(s.slice(d0, f), t, d);
    pos = f; i = f + 9;
    if (vus + illisibles >= 3000 || total > 256 * GARDE_MO) { illisibles += 1; break; }
  }
  gardePdfNoms(s.slice(pos), c);
  const actifs = GARDE_PDF_ACTIFS.filter((k) => c[k] || t[k]);
  return { noms: c, actifs, horsFlux: GARDE_PDF_ACTIFS.filter((k) => c[k]), douteux: GARDE_PDF_ACTIFS.filter((k) => d[k] && !actifs.includes(k)), chiffre: !!c.Encrypt, objStm, vus, illisibles };
}
// structure du document (pdf-lib) : contenu actif réellement présent dans ses objets — tranche les noms « douteux »
async function pdfActifsStructure(b, PDFLib) {
  const { PDFDocument, PDFName, PDFDict, PDFArray, PDFStream } = PDFLib; const N = (k) => PDFName.of(k);
  const doc = await PDFDocument.load(b, { updateMetadata: false, throwOnInvalidObject: false, ignoreEncryption: true });
  const trouves = new Set(); const vus = new Set();
  const nomDe = (v) => { try { return v instanceof PDFName ? v.decodeText() : ''; } catch (e) { return ''; } };
  const ACT = { JavaScript: 'JavaScript', Launch: 'Launch', SubmitForm: 'SubmitForm', ImportData: 'ImportData', GoToR: 'GoToR', GoToE: 'GoToE', Rendition: 'Rendition', Sound: 'Sound', Movie: 'Movie', RichMediaExecute: 'RichMedia' };
  const voir = (dict) => {
    if (!dict || vus.has(dict)) return; vus.add(dict);
    const S = nomDe(dict.get(N('S'))); if (ACT[S]) trouves.add(ACT[S]);
    ['JS', 'JavaScript', 'AA', 'EmbeddedFiles', 'XFA'].forEach((k) => { if (dict.has(N(k))) trouves.add(k); });
    if (dict.has(N('RichMediaContent'))) trouves.add('RichMedia'); if (dict.has(N('EF'))) trouves.add('EmbeddedFile');
    const st = nomDe(dict.get(N('Subtype'))); const charge = { FileAttachment: 'FS', Sound: 'Sound', Movie: 'Movie', RichMedia: 'RichMediaContent' }[st]; if (charge && dict.has(N(charge))) trouves.add(st);
    dict.entries().forEach(([, v]) => { if (v instanceof PDFDict) voir(v); else if (v instanceof PDFArray) v.asArray().forEach((y) => { if (y instanceof PDFDict) voir(y); }); });
  };
  doc.context.enumerateIndirectObjects().forEach(([, obj]) => {
    const dict = obj instanceof PDFDict ? obj : obj instanceof PDFStream ? obj.dict : null; if (!dict) return;
    if (obj instanceof PDFStream && nomDe(dict.get(N('Type'))) === 'EmbeddedFile') trouves.add('EmbeddedFile');
    voir(dict);
  });
  return GARDE_PDF_ACTIFS.filter((k) => trouves.has(k));
}
const gardePdfActifsLib = (actifs) => uniq((actifs || []).map((k) => GARDE_PDF_LIB[k] || k));
// désarmement (pdf-lib) : actions dangereuses vidées, JavaScript, actions automatiques, fichiers incorporés, médias et XFA retirés
async function pdfDesarmer(b, PDFLib) {
  const { PDFDocument, PDFName, PDFDict, PDFArray, PDFStream } = PDFLib; const N = (k) => PDFName.of(k);
  const doc = await PDFDocument.load(b, { updateMetadata: false, throwOnInvalidObject: false });
  const ACTIONS = new Set(['JavaScript', 'Launch', 'SubmitForm', 'ImportData', 'GoToR', 'GoToE', 'RichMediaExecute', 'Rendition', 'Sound', 'Movie', 'Hide', 'SetOCGState', 'Trans', 'GoTo3DView']);
  const CLES = ['JS', 'JavaScript', 'AA', 'EmbeddedFiles', 'RichMediaContent', 'RichMediaSettings', 'XFA', 'EF'];
  let n = 0; const vus = new Set(); const aSupprimer = [];
  const nomDe = (v) => { try { return v instanceof PDFName ? v.decodeText() : ''; } catch (e) { return ''; } };
  const nettoyer = (dict) => {
    if (!dict || vus.has(dict)) return; vus.add(dict);
    const S = nomDe(dict.get(N('S')));
    if (S && ACTIONS.has(S)) { dict.keys().forEach((k) => dict.delete(k)); n += 1; return; }
    CLES.forEach((k) => { if (dict.has(N(k))) { dict.delete(N(k)); n += 1; } });
    const oa = dict.get(N('OpenAction')); if (oa && !(oa instanceof PDFArray)) { const t = oa instanceof PDFDict ? oa : doc.context.lookup(oa); if (!(t instanceof PDFArray)) { dict.delete(N('OpenAction')); n += 1; } }
    const st = nomDe(dict.get(N('Subtype'))); if (['FileAttachment', 'RichMedia', 'Sound', 'Movie', 'Screen'].includes(st)) { ['FS', 'Sound', 'Movie', 'A', 'RichMediaContent'].forEach((k) => { if (dict.has(N(k))) { dict.delete(N(k)); n += 1; } }); dict.set(N('Subtype'), N('Link')); } // annotation vidée, devenue inerte
    dict.entries().forEach(([, v]) => { if (v instanceof PDFDict) nettoyer(v); else if (v instanceof PDFArray) v.asArray().forEach((x) => { if (x instanceof PDFDict) nettoyer(x); }); });
  };
  doc.context.enumerateIndirectObjects().forEach(([ref, obj]) => {
    const dict = obj instanceof PDFDict ? obj : obj instanceof PDFStream ? obj.dict : null; if (!dict) return;
    if (obj instanceof PDFStream && nomDe(dict.get(N('Type'))) === 'EmbeddedFile') { aSupprimer.push(ref); n += 1; return; }
    nettoyer(dict);
  });
  aSupprimer.forEach((r) => doc.context.delete(r));
  const out = await doc.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
  return { octets: out, retires: n };
}

/* ---------- verdict d'un fichier ----------
   outils : { inflate(octets, brut, max) → Promise<Uint8Array>, PDFLib, chargerPdfLib() → Promise<PDFLib> }
   → { statut: 'ok' | 'nettoye' | 'refuse', famille, type, nomType, raisons: [texte], avertissements: [texte], octets? (PDF désarmé) } */
async function gardeAnalyser(b, nom0, usage, outils) {
  const o = outils || {}; const U = GARDE_USAGES[usage] || GARDE_USAGES.document; const nom = String(nom0 || '');
  const ext = gardeExt(nom); const parts = nom.toLowerCase().split('.').slice(1);
  const v = { statut: 'ok', usage: GARDE_USAGES[usage] ? usage : 'document', famille: '', type: '', nomType: '', raisons: [], avertissements: [], taille: b ? b.length : 0 };
  const refus = (t) => { v.statut = 'refuse'; v.raisons.push(t); return v; };
  if (!b || !b.length) return refus('fichier vide');
  if (b.length > U.max) return refus(`trop volumineux (${gardeTaille(b.length)}, au plus ${gardeTaille(U.max)} ici)`);
  if (GARDE_BIDI.test(nom)) return refus('nom de fichier trompeur (caractères qui inversent le sens d’écriture pour cacher l’extension)');
  if (ext && GARDE_EXT_DANGER.has(ext) && !(ext === 'svg' && usage === 'logo')) return refus(`extension « .${ext} » : programme, script ou page web, jamais accepté`);
  if (parts.length > 1 && parts.slice(0, -1).some((p) => GARDE_EXT_DANGER.has(p) && p.length >= 2 && !['url', 'img', 'app', 'pkg', 'com', 'sys', 'inf', 'reg', 'js'].includes(p))) v.avertissements.push('nom à double extension');
  if (ext && GARDE_EXT_MACRO.has(ext)) return refus(`document Office avec macros (« .${ext} ») : enregistrez-le sans macros (.docx, .xlsx, .pptx)`);
  if (ext && GARDE_EXT_ARCHIVE.has(ext)) return refus('archive compressée : décompressez-la et déposez les documents qu’elle contient');
  let sig = gardeSignature(b);
  if (sig.famille === 'zip') sig = await gardeOffice(b, o.inflate);
  else if (sig.famille === 'ole') sig = { ...sig, famille: 'office', raisons: gardeOle(b) };
  else if (sig.famille === 'rtf') sig = { ...sig, famille: 'office', raisons: gardeRtf(b) };
  v.famille = sig.famille; v.type = sig.type || ''; v.nomType = sig.nom || '';
  if (GARDE_FAMILLES_DANGER.includes(sig.famille)) return refus(ext && GARDE_EXT_FAMILLE[ext] && !GARDE_FAMILLES_DANGER.includes(GARDE_EXT_FAMILLE[ext]) ? `contenu réel : ${sig.nom} déguisé en « .${ext} »` : `contenu réel : ${sig.nom}`);
  if ((sig.raisons || []).length) return refus(sig.raisons.join(' ; '));
  if (sig.famille === 'svg' && usage !== 'logo') return refus('image SVG : peut contenir du code ; enregistrez-la en PNG ou en PDF');
  if (!U.familles.includes(sig.famille)) return refus(`${sig.nom} : type non accepté ici (${GARDE_USAGE_ICI[v.usage]})`);
  const fe = GARDE_EXT_FAMILLE[ext];
  if (fe && fe !== sig.famille && !(fe === 'texte' && ['json', 'xml'].includes(sig.famille)) && !(fe === 'json' && sig.famille === 'texte')) v.avertissements.push(`extension « .${ext} » mais contenu ${sig.nom} : type corrigé d’après le contenu`);
  if (sig.famille === 'image') {
    const d = gardeImageDims(b, sig.type);
    if (d && (d.w * d.h > 150e6 || d.w > 40000 || d.h > 40000)) return refus(`image démesurée (${d.w} × ${d.h} pixels) : bombe de décompression possible`);
  }
  if (sig.famille === 'xml' && /<!ENTITY/i.test(gardeLatin1(b, 65536))) return refus('XML avec entités déclarées (fichier piégé possible)');
  if (sig.famille === 'svg') { const t = gardeLatin1(b, 4 * GARDE_MO); if (/<script|\son[a-z]+\s*=|javascript:|<foreignObject|<!ENTITY/i.test(t)) v.avertissements.push('code retiré : le logo est redessiné en image PNG'); }
  if (sig.famille === 'pdf') {
    const a = await gardePdfAnalyser(b, o.inflate); let actifs = a.actifs; let L = o.PDFLib || null;
    const charger = async () => { if (!L && o.chargerPdfLib) { try { L = await o.chargerPdfLib(); } catch (e) { L = null; } } return L; };
    // noms actifs seulement au milieu de données binaires (images, polices…) : le plus souvent le hasard des octets ; la structure tranche
    if (!actifs.length && a.douteux.length) {
      if (await charger()) { try { actifs = await pdfActifsStructure(b, L); } catch (e) { v.avertissements.push('PDF en partie illisible : vérification partielle'); } }
      else v.avertissements.push('PDF : vérification approfondie impossible (module de lecture injoignable, connexion internet ?)');
    }
    v.pdf = { actifs, chiffre: a.chiffre, illisibles: a.illisibles };
    if (actifs.length) {
      const lib = gardePdfActifsLib(actifs).join(', ');
      if (a.chiffre) return refus(`PDF protégé contenant du contenu actif (${lib}) : impossible à désarmer`);
      if (!(await charger())) return refus(`PDF avec contenu actif (${lib}) : le module de désarmement est injoignable (connexion internet ?)`);
      let r; try { r = await pdfDesarmer(b, L); } catch (e) { return refus(`PDF avec contenu actif (${lib}) : illisible, impossible à désarmer`); }
      // contre-vérification du document désarmé : rien dans ses dictionnaires, et sa structure (relue) sans contenu actif
      const a2 = await gardePdfAnalyser(r.octets, o.inflate); let reste = a2.horsFlux;
      if (!reste.length) { try { reste = await pdfActifsStructure(r.octets, L); } catch (e) { reste = ['illisible']; } }
      if (reste.length) return refus(`PDF avec contenu actif (${lib}) : le désarmement n’a pas tout retiré`);
      v.statut = 'nettoye'; v.octets = r.octets; v.raisons.push(`PDF désarmé : ${lib} retiré`); v.taille = r.octets.length;
    } else if (a.chiffre && a.illisibles) v.avertissements.push('PDF protégé par chiffrement : vérification partielle');
    else if (a.illisibles) v.avertissements.push('PDF en partie illisible : vérification partielle');
  }
  return v;
}
// résumé gardé avec le document (base) : ce qui a été vérifié et quand
const gardeResume = (v, le) => (v ? { statut: v.statut === 'refuse' ? 'suspect' : v.statut, le: le || todayISO(), famille: v.famille || '', ...(v.raisons.length || v.avertissements.length ? { notes: [...v.raisons, ...v.avertissements].slice(0, 4).map((x) => String(x).slice(0, 160)) } : {}) } : null);

/* ---------- données JSON importées ---------- */
const GARDE_CLES_PIEGE = new Set(['__proto__', 'constructor', 'prototype']);
function jsonSur(texte, opts) {
  const o = opts || {}; const max = o.max || 1024 * GARDE_MO; const t = String(texte == null ? '' : texte);
  if (t.length > max) return { ok: false, code: 'taille', msg: `Fichier trop volumineux (${gardeTaille(t.length)}, au plus ${gardeTaille(max)}).` };
  let retires = 0; let v;
  try { v = JSON.parse(t.replace(/^﻿/, ''), (k, x) => { if (GARDE_CLES_PIEGE.has(k)) { retires += 1; return undefined; } return x; }); }
  catch (e) { return { ok: false, code: 'json', msg: 'Fichier illisible : ce n’est pas un fichier de données JSON valide.' }; }
  const prof = o.profondeur || 64; const pile = [[v, 1]]; let noeuds = 0; const maxN = o.noeuds || 30e6;
  while (pile.length) {
    const [x, p] = pile.pop(); if (!x || typeof x !== 'object') continue;
    if (p > prof) return { ok: false, code: 'profondeur', msg: 'Fichier refusé : données imbriquées sur trop de niveaux (fichier piégé ?).' };
    const ks = Object.keys(x); noeuds += ks.length; if (noeuds > maxN) return { ok: false, code: 'noeuds', msg: 'Fichier refusé : trop de données.' };
    for (let i = 0; i < ks.length; i += 1) { const y = x[ks[i]]; if (y && typeof y === 'object') pile.push([y, p + 1]); }
  }
  return { ok: true, valeur: v, retires };
}
// base importée (sauvegarde, Drive) : logo seulement en image matricielle, noms des documents sans caractères de contrôle
const GARDE_LOGO_OK = /^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/;
function gardeBase(db) {
  const fixes = []; if (!db || typeof db !== 'object') return fixes;
  const e = db.entreprise; if (e && typeof e === 'object' && e.logo && !(typeof e.logo === 'string' && e.logo.length < 4 * GARDE_MO && GARDE_LOGO_OK.test(e.logo))) { e.logo = ''; e.logoW = 0; e.logoH = 0; fixes.push('logo retiré (ce n’était pas une image PNG, JPEG, WebP ou GIF)'); }
  if (Array.isArray(db.docs)) { let k = 0; db.docs.forEach((d) => { if (d && typeof d === 'object' && typeof d.nom === 'string') { const p = gardeNomPropre(d.nom); if (p !== d.nom) { d.nom = p; k += 1; } } }); if (k) fixes.push(`${k} nom(s) de document nettoyé(s)`); }
  return fixes;
}

/* ---------- bibliothèques de lecture (tableurs) : pollution des prototypes surveillée ---------- */
const GARDE_PROTOS = () => [Object.prototype, Array.prototype, Function.prototype, String.prototype, Number.prototype, Boolean.prototype];
function gardeProtoEtat() { return GARDE_PROTOS().map((p) => { const m = new Map(); Reflect.ownKeys(p).forEach((k) => { const d = Object.getOwnPropertyDescriptor(p, k); m.set(k, d); }); return m; }); }
function gardeProtoReparer(avant) {
  const touches = [];
  GARDE_PROTOS().forEach((p, i) => {
    Reflect.ownKeys(p).forEach((k) => { if (!avant[i].has(k)) { touches.push(String(k)); try { delete p[k]; } catch (e) { /* non configurable */ } } });
    avant[i].forEach((d, k) => { const d2 = Object.getOwnPropertyDescriptor(p, k); if (!d2 || d2.value !== d.value || d2.get !== d.get || d2.set !== d.set) { touches.push(String(k)); try { Object.defineProperty(p, k, d); } catch (e) { /* non configurable */ } } });
  });
  return uniq(touches);
}
function gardeSurveiller(fn) {
  const av = gardeProtoEtat(); let r; let er = null;
  try { r = fn(); } catch (e) { er = e; }
  const t = gardeProtoReparer(av);
  if (t.length) { const e = new Error(`fichier piégé : il tentait de modifier le cœur de l’application (${t.slice(0, 3).join(', ')}) — refusé, dégâts réparés`); e.garde = true; throw e; }
  if (er) throw er; return r;
}

/* ---------- exports CSV : pas de formule exécutée à l'ouverture dans un tableur ---------- */
const csvSansFormule = (s) => (/^[=+\-@\t\r]/.test(s) && !/^[-+]?\d[\d\s ]*(?:[.,]\d+)?(?:e[-+]?\d+)?$/i.test(s.trim()) && !/^[-+]\s*$/.test(s) ? `'${s}` : s);

/* ---------- journal de sécurité ---------- */
function gardeJournaliser(db, entrees) {
  if (!Array.isArray(db.gardeJournal)) db.gardeJournal = [];
  (Array.isArray(entrees) ? entrees : [entrees]).filter((e) => e && e.statut).forEach((e) => db.gardeJournal.push({ id: nid(db, 'gj'), date: e.date || new Date().toISOString(), usage: GARDE_USAGES[e.usage] ? e.usage : 'document', nom: gardeNomPropre(e.nom).slice(0, 160), taille: num(e.taille), statut: e.statut,
    raisons: (e.raisons || []).slice(0, 6).map((r) => String(r).slice(0, 240)), ...(e.appareil ? { appareil: String(e.appareil).slice(0, 60) } : {}), ...(e.uid ? { uid: String(e.uid) } : {}) }));
  if (db.gardeJournal.length > 300) db.gardeJournal = db.gardeJournal.slice(-300);
  return okr();
}
function gardeJournalVider(db) { db.gardeJournal = []; return okr(); }
// le journal suit l'appareil : quand une autre base remplace celle de l'appareil (sauvegarde, Drive, jeu d'exemple, remise à zéro,
// point de restauration), les entrées de l'ancienne base y sont reportées (même entrée : même date, fichier, verdict et import)
const gardeCle = (e) => [e.date, e.nom, e.statut, e.usage].join('|');
function gardeJournalGarder(av, nd) {
  const A = Array.isArray(av && av.gardeJournal) ? av.gardeJournal : []; if (!A.length || !nd) return nd;
  const N = Array.isArray(nd.gardeJournal) ? nd.gardeJournal : []; const vus = new Set(N.map(gardeCle));
  const plus = A.filter((e) => e && e.statut && !vus.has(gardeCle(e))); if (!plus.length) return nd;
  const L = [...N, ...plus.map((e) => ({ ...e, id: nid(nd, 'gj') }))].sort((a, b) => (String(a.date) < String(b.date) ? -1 : String(a.date) > String(b.date) ? 1 : 0));
  nd.gardeJournal = L.slice(-300); return nd;
}
// verdicts des documents déjà joints (vérification en arrière-plan) : { docId: résumé }
function gardeDocsNoter(db, verdicts) { let n = 0; (db.docs || []).forEach((d) => { const v = verdicts && verdicts[d.id]; if (v) { d.garde = v; n += 1; } }); return okr({ n }); }
const gardeDocsSuspects = (db) => (db.docs || []).filter((d) => d && d.garde && d.garde.statut === 'suspect');
