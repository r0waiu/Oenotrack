// Pages fixes du site (0.23.0-alpha.1), rendues par Œnotrack lui-même (Playwright, comme les tests) avec le config.json du paquet :
//   - confidentialite.html, mentions-legales.html, cgu.html, licence.html : informations légales lisibles sans JavaScript
//     (adresses à donner aux écrans de connexion Google, Microsoft et Dropbox, et pour les moteurs de recherche) ;
//   - accueil-noscript.html : la page d'accueil sans JavaScript, insérée par paquet-web.py dans index.html (<noscript>).
// Usage : node tools/pages-statiques.mjs dist/web/oenotrack-web   (appelé par tools/paquet-web.py)
import { open } from '../test/ui.mjs'; import fs from 'fs'; import path from 'path';
const dossier = path.resolve(process.argv[2] || 'dist/web/oenotrack-web');
const conf = fs.existsSync(path.join(dossier, 'config.json')) ? fs.readFileSync(path.join(dossier, 'config.json'), 'utf8') : '{}';
const routes = async (route, u) => {
  if (/config\.json/.test(u)) { await route.fulfill({ contentType: 'application/json', body: conf }); return true; }
  if (/code-source\.zip/.test(u)) { await route.fulfill({ contentType: 'application/zip', body: 'PK' }); return true; } // le paquet contient le code source
  return false;
};
const PAGES = [['mentions', 'mentions-legales', 'Mentions légales'], ['confidentialite', 'confidentialite', 'Politique de confidentialité'], ['cgu', 'cgu', 'Conditions générales d’utilisation'], ['licence', 'licence', 'Code source & licence']];
const echap = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CSS = `:root{color-scheme:light dark;--bg:#F9F8F6;--surface:#FFFFFF;--ink:#1E242B;--ink2:#5B636D;--line:#E5E2DC;--accent:#8C6E2F}
@media (prefers-color-scheme:dark){:root{--bg:#15171B;--surface:#1D2026;--ink:#ECEDEF;--ink2:#A7ADB5;--line:#30343B;--accent:#D8B46A}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
a{color:var(--accent)}header,main,footer{max-width:820px;margin:0 auto;padding:16px}
header{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;border-bottom:1px solid var(--line)}header a{font-weight:700;font-size:20px;text-decoration:none;color:var(--ink)}header span{color:var(--ink2);font-size:14px}
h2{font-size:28px;line-height:1.2;margin:12px 0 16px}h3{font-size:18px;margin:22px 0 6px}ul{padding-left:22px}
.legal-bref{border:1px solid var(--line);background:var(--surface);border-radius:8px;padding:10px 16px;margin:0 0 12px}.legal-note{border-left:3px solid var(--accent);padding:6px 12px;background:var(--surface);margin:0 0 12px}
.legal-petit{font-size:13px;color:var(--ink2)}.legal-vide{color:var(--ink2);font-style:italic}table{border-collapse:collapse;width:100%;font-size:14px}th,td{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}
footer{border-top:1px solid var(--line);font-size:13px;color:var(--ink2);display:flex;flex-wrap:wrap;gap:6px 16px}footer a{color:inherit}`;
const nav = (cur) => PAGES.map(([, f, t]) => (f === cur ? `<span>${echap(t)}</span>` : `<a href="${f}.html">${echap(t)}</a>`)).join('');
const { browser, page, errors } = await open({ accueil: true, routes, viewport: { width: 1200, height: 900 } });
try {
  for (const [id, fichier, titre] of PAGES) {
    await page.evaluate((h) => { window.location.hash = h; }, `#${fichier}`); await page.waitForTimeout(450);
    const doc = await page.locator('.overlay .legal-doc').first().evaluate((e) => e.innerHTML);
    const html = `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${echap(titre)} — Œnotrack</title>\n<meta name="description" content="${echap(titre)} d’Œnotrack, logiciel libre de traçabilité de cuverie et de chai">\n<link rel="icon" type="image/png" href="icone-192.png">\n<style>${CSS}</style>\n</head>\n<body>\n<header><a href="./">Œnotrack</a><span>Traçabilité de cuverie et de chai</span></header>\n<main data-page="${id}">\n${doc}\n</main>\n<footer><a href="./">Accueil</a>${nav(fichier)}</footer>\n</body>\n</html>\n`;
    fs.writeFileSync(path.join(dossier, `${fichier}.html`), html);
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  }
  // page d'accueil sans JavaScript : liens vers les pages fixes, pas de bouton (l'application a besoin de JavaScript)
  const accueil = await page.locator('[data-accueil]').evaluate((root) => {
    const c = root.cloneNode(true); const lien = (txt, href) => { const a = document.createElement('a'); a.href = href; a.textContent = txt; return a; };
    const boutons = c.querySelectorAll('[data-accueil-ouvrir]');
    boutons.forEach((b, i) => { const zone = b.closest('.accueil-action'); if (i === 0 && zone) { zone.innerHTML = ''; const p = document.createElement('p'); p.className = 'accueil-js'; p.textContent = 'Œnotrack s’ouvre dans votre navigateur : activez JavaScript pour l’utiliser.'; zone.appendChild(p); } else if (zone) zone.remove(); });
    const fichiers = { 'Mentions légales': 'mentions-legales', 'Confidentialité': 'confidentialite', 'CGU': 'cgu', 'Code source & licence': 'licence' };
    c.querySelectorAll('.legal-liens button').forEach((b) => { const f = fichiers[b.textContent.trim()]; if (f) b.replaceWith(lien(b.textContent, `${f}.html`)); });
    c.querySelectorAll('.accueil-donnees button').forEach((b) => b.replaceWith(lien(b.textContent, 'confidentialite.html')));
    c.querySelectorAll('.accueil-pied a[href^="https://oenotrack.fr"]').forEach((a) => { const s = a.parentElement; if (s) s.innerHTML = s.innerHTML.replace(/ · site officiel : .*$/, ''); });
    c.querySelectorAll('.langue-choix').forEach((x) => x.remove()); // choix de la langue : besoin de JavaScript
    c.removeAttribute('data-accueil'); c.setAttribute('data-accueil-statique', '');
    return c.outerHTML;
  });
  fs.writeFileSync(path.join(dossier, 'accueil-noscript.html'), accueil);
  if (errors.length) { console.error('erreurs de page :', errors.slice(0, 3)); process.exitCode = 1; }
  console.log('pages fixes :', PAGES.map((p) => `${p[1]}.html`).join(', '), '+ accueil sans JavaScript');
} finally { await browser.close(); }
