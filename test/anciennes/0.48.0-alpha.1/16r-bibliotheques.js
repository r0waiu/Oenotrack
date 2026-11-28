/* ============ BIBLIOTHÈQUES TIERCES : versions figées, empreintes vérifiées (0.38.0-alpha.1) ============
   Protection contre une compromission d'un CDN (chaîne d'approvisionnement) :
   - Œnotrack en ligne (paquet web, tools/paquet-web.py) : toutes les bibliothèques sont copiées à côté de la page (dossier vendor/,
     même origine) et la page annonce <meta name="oenotrack-bibliotheques" content="vendor/"> ; une politique de sécurité du contenu
     (CSP) n'autorise plus que les scripts de la page elle-même (empreintes) et de son site : aucun CDN n'est contacté ;
   - fichier seul (dist/cuverie.html, claude.ai) : chargées depuis jsDelivr (/npm/ : octets identiques au paquet npm), chaque fichier
     de code est vérifié avant exécution — attribut integrity (SRI) pour les scripts, empreinte SHA-384 calculée sur les octets reçus
     pour les modules (pdf.js) : un fichier modifié est refusé.
   React est chargé par la page (head.html, attribut integrity) ; Tailwind est précompilé à la construction (build.mjs) : plus de
   compilateur chargé à l'ouverture. Empreintes recalculées et comparées aux paquets npm installés par build.mjs (« bibliothèques
   vérifiées »), qui s'arrête si une empreinte ne correspond plus. */
// BIB_TABLE : JSON entre les deux repères (lu aussi par build.mjs, tools/paquet-web.py et le harnais de tests)
/*BIB-DEBUT*/
const BIB_TABLE = {
  "react": { "npm": "react@18.3.1", "fichier": "umd/react.production.min.js", "local": "react.production.min.js", "sri": "sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z" },
  "reactDom": { "npm": "react-dom@18.3.1", "fichier": "umd/react-dom.production.min.js", "local": "react-dom.production.min.js", "sri": "sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1" },
  "pdflib": { "npm": "pdf-lib@1.17.1", "fichier": "dist/pdf-lib.min.js", "local": "pdf-lib.min.js", "sri": "sha384-weMABwrltA6jWR8DDe9Jp5blk+tZQh7ugpCsF3JwSA53WZM9/14PjS5LAJNHNjAI" },
  "xlsx": { "npm": "xlsx@0.18.5", "fichier": "dist/xlsx.full.min.js", "local": "xlsx.full.min.js", "sri": "sha384-vtjasyidUo0kW94K5MXDXntzOJpQgBKXmE7e2Ga4LG0skTTLeBi97eFAXsqewJjw" },
  "pdfjs": { "npm": "pdfjs-dist@6.2.108", "fichier": "build/pdf.min.mjs", "local": "pdfjs/build/pdf.min.mjs", "sri": "sha384-iFreJLYJz3yZXDcGivJRXeHAo/NHOLP/QIK1neoV/fI0muPBJGNUhorvDzwNiIF/", "sha256": "sha256-4L44Y8I8ivIwWxZUj+vVjn+IdKRgJTMX13cc3bwcD20=", "module": true },
  "pdfjsWorker": { "npm": "pdfjs-dist@6.2.108", "fichier": "build/pdf.worker.min.mjs", "local": "pdfjs/build/pdf.worker.min.mjs", "sri": "sha384-TP/IyAALg2YIe4jQVEJ6WwbztilE5pDhTVEmz5gPXnu3JwDPws/1dWcJwLnX/+GJ", "sha256": "sha256-BhP0FJDdaqzu16k/u9OMhebWqmBHS2WIxudwnPvhjLM=", "module": true },
  "tesseract": { "npm": "tesseract.js@5.1.1", "fichier": "dist/tesseract.min.js", "local": "tesseract/tesseract.min.js", "sri": "sha384-GJqSu7vueQ9qN0E9yLPb3Wtpd7OrgK8KmYzC8T1IysG1bcvxvIO4qtYR/D3A991F" },
  "tesseractWorker": { "npm": "tesseract.js@5.1.1", "fichier": "dist/worker.min.js", "local": "tesseract/worker.min.js", "sri": "sha384-zxn+VqofFzXpH99dUb3fa4ywoSBQJPy6/6oEaJHPlblZXr53a0g1Jl6720vgSzB7" }
};
/*BIB-FIN*/
// dossiers de données copiés tels quels dans vendor/ (décodeurs et polices de pdf.js, moteur et langue de Tesseract)
const BIB_DOSSIERS = { pdfjsBase: 'pdfjs/', tesseractCore: 'tesseract/core/', tesseractLangue: 'tesseract/lang/' };
const BIB_CDN = 'https://cdn.jsdelivr.net/npm/';
// dossier local annoncé par la page (Œnotrack en ligne) : '' = fichier seul, bibliothèques depuis le CDN (vérifiées)
const bibLocal = () => { try { const m = typeof document !== 'undefined' && document.querySelector('meta[name="oenotrack-bibliotheques"]'); const v = m ? String(m.getAttribute('content') || '') : ''; return /^[\w./-]*$/.test(v) && !/^\/\/|\.\./.test(v) ? v : ''; } catch (e) { return ''; } };
const bibUrl = (nom) => { const b = BIB_TABLE[nom]; if (!b) throw new Error(`bibliothèque inconnue : ${nom}`); const L = bibLocal(); return L ? `${L}${b.local}` : `${BIB_CDN}${b.npm}/${b.fichier}`; };
// base des données de pdf.js (wasm/, standard_fonts/, cmaps/)
const bibPdfjsBase = () => { const L = bibLocal(); return L ? `${L}${BIB_DOSSIERS.pdfjsBase}` : `${BIB_CDN}${BIB_TABLE.pdfjs.npm}/`; };
// empreintes (format SRI) d'octets reçus : SHA-384 (Web Crypto) ; SHA-256 aussi sans Web Crypto (page en http : calcul en JavaScript, 34-acces)
const bibB64 = (h) => { let s = ''; h.forEach((x) => { s += String.fromCharCode(x); }); return btoa(s); };
async function bibEmpreinte(octets) { return `sha384-${bibB64(new Uint8Array(await crypto.subtle.digest('SHA-384', octets)))}`; }
async function bibEmpreinte256(octets) { const u = new Uint8Array(octets); const s = typeof crypto !== 'undefined' && crypto.subtle; return `sha256-${bibB64(s ? new Uint8Array(await s.digest('SHA-256', u)) : sha256(u))}`; }
const bibErreur = (nom, quoi) => ({ bibliotheque: nom, message: `${quoi === 'modifie' ? 'Bibliothèque refusée' : 'Bibliothèque injoignable'} : ${nom}${quoi === 'modifie' ? ' — le fichier reçu ne correspond pas à la version vérifiée d’Œnotrack (CDN compromis ou fichier altéré). Rien n’a été exécuté.' : ' (connexion internet ?)'}` });
// script classique : attribut integrity (le navigateur refuse un fichier modifié)
const _bibScripts = {};
function bibScript(nom, test) {
  if (test && test()) return Promise.resolve(true);
  if (_bibScripts[nom]) return _bibScripts[nom];
  _bibScripts[nom] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = bibUrl(nom); s.async = true; s.integrity = BIB_TABLE[nom].sri; s.crossOrigin = 'anonymous'; s.referrerPolicy = 'no-referrer';
    s.onload = () => res(true);
    s.onerror = () => { _bibScripts[nom] = null; s.remove(); bibVerifierEcart(nom).then((m) => rej(bibErreur(nom, m ? 'modifie' : 'reseau'))); };
    document.head.appendChild(s);
  });
  return _bibScripts[nom];
}
// échec de chargement : fichier joignable mais différent (refus de l'empreinte) ou réseau ?
async function bibVerifierEcart(nom) { if (typeof crypto === 'undefined' || !crypto.subtle) return false; try { const r = await fetch(bibUrl(nom), { cache: 'force-cache' }); if (!r.ok) return false; return (await bibEmpreinte(await r.arrayBuffer())) !== BIB_TABLE[nom].sri; } catch (e) { return false; } }
// module ES (pdf.js) : sur le site, importé depuis son dossier (CSP « self ») ; depuis le CDN, octets vérifiés puis importés depuis la mémoire
const _bibModules = {};
async function bibModuleUrl(nom) {
  if (bibLocal()) return new URL(bibUrl(nom), document.baseURI).href;
  if (_bibModules[nom]) return _bibModules[nom];
  let r; try { r = await fetch(bibUrl(nom), { mode: 'cors', credentials: 'omit' }); } catch (e) { throw bibErreur(nom, 'reseau'); }
  if (!r.ok) throw bibErreur(nom, 'reseau');
  const o = await r.arrayBuffer(); if ((await bibEmpreinte256(o)) !== BIB_TABLE[nom].sha256) throw bibErreur(nom, 'modifie');
  _bibModules[nom] = URL.createObjectURL(new Blob([o], { type: 'text/javascript' })); return _bibModules[nom];
}
async function bibModule(nom) { return import(/* webpackIgnore: true */ await bibModuleUrl(nom)); }
