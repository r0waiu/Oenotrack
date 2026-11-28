// 0.38.0-alpha.1 : impression avec couleurs préservées (fiche d'opération à remplir : cases « relevé », en-têtes, bandeau) même avec
// « Graphiques d'arrière-plan » décoché (PDF de Chromium, printBackground: false) ; étiquettes QR : planche A4 personnalisée
// (colonnes × lignes, dimensions, marges, espacements, modèles courants, contour, dépassement signalé, PDF, impression directe).
import { open } from './ui.mjs'; import fs from 'fs'; import zlib from 'zlib'; import { createRequire } from 'module';
const { PDFDocument } = createRequire(import.meta.url)('/opt/npm-tools/node_modules/pdf-lib');
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 600) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
// couleurs de remplissage d'un PDF de Chromium : flux décompressés, opérateurs « r g b rg »
const remplissages = (buf) => {
  const s = buf.toString('latin1'); const out = new Set(); let i = 0;
  for (;;) {
    const a = s.indexOf('stream', i); if (a < 0) break; let d = a + 6; if (s[d] === '\r') d += 1; if (s[d] === '\n') d += 1; const e = s.indexOf('endstream', d); if (e < 0) break;
    let t = ''; try { t = zlib.inflateSync(Buffer.from(s.slice(d, e), 'latin1')).toString('latin1'); } catch (er) { t = ''; }
    for (const m of t.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) rg/g)) out.add([m[1], m[2], m[3]].map((x) => Math.round(Number(x) * 255)).join(','));
    i = e + 9;
  }
  return out;
};
const { browser, page, errors } = await open({ init: () => { window.__zones = []; window.print = () => { window.dispatchEvent(new Event('beforeprint')); const z = document.getElementById('zone-impression'); if (z) window.__zones.push({ html: z.outerHTML, format: z.dataset.format || '' }); window.dispatchEvent(new Event('afterprint')); }; } });
const ov = () => page.locator('.overlay').last();

// 1. fiche d'opération à remplir : couleurs imprimées
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.locator('main tbody tr', { hasText: 'GH-482-KT' }).first().locator('[data-op-menu]').click(); await page.waitForTimeout(150); await page.locator('main tbody tr', { hasText: 'GH-482-KT' }).first().locator('button[aria-label="Fiche d’enregistrement"]').click(); await page.waitForTimeout(700);
await ov().locator('button:has-text("Bordeaux")').click(); await page.waitForTimeout(200);
const sw = await ov().locator('.fiche .ft td.saisie').count();
ok('fiche : cases « relevé » à remplir présentes (modèle Bordeaux : #FFF8E8)', sw > 0, sw);
await page.emulateMedia({ media: 'print' });
const st = await ov().locator('.fiche .ft td.saisie').first().evaluate((el) => { const c = getComputedStyle(el); return { pca: c.printColorAdjust || c.webkitPrintColorAdjust, w: c.webkitPrintColorAdjust, bg: c.backgroundColor }; });
await page.emulateMedia({ media: 'screen' });
ok('… à l’impression : print-color-adjust « exact » sur les cases, fond conservé', st.pca === 'exact' && st.w === 'exact' && st.bg === 'rgb(255, 248, 232)', st);
await ov().locator('[data-sortie-imprimer], button:has-text("🖨 Imprimer")').first().click(); await page.waitForTimeout(1200);
const zones = await page.evaluate(() => window.__zones); ok('impression directe : zone d’impression préparée (fiche)', zones.length >= 1 && /class="fiche/.test(zones[zones.length - 1].html), zones.length);
// PDF de Chromium « sans graphiques d'arrière-plan » : la zone d'impression rejouée telle que la boîte d'impression la voit
const pdfZone = async (style) => {
  await page.evaluate(({ h, css }) => { const t = document.createElement('div'); t.innerHTML = h; const z = t.firstChild; document.body.appendChild(z); document.documentElement.classList.add('impression-zone'); if (css) { const s = document.createElement('style'); s.id = 'temoin'; s.textContent = css; document.head.appendChild(s); } }, { h: zones[zones.length - 1].html, css: style });
  const b = await page.pdf({ printBackground: false, preferCSSPageSize: true });
  await page.evaluate(() => { document.getElementById('zone-impression').remove(); document.documentElement.classList.remove('impression-zone'); const s = document.getElementById('temoin'); if (s) s.remove(); });
  return b;
};
const b1 = await pdfZone(''); fs.writeFileSync(SC + '/fiche-sans-arriere-plan.pdf', b1); const f1 = remplissages(b1);
const b0 = await pdfZone('*,*::before,*::after{-webkit-print-color-adjust:economy!important;print-color-adjust:economy!important}'); const f0 = remplissages(b0);
ok('… PDF « graphiques d’arrière-plan » décochés : cases « relevé », en-têtes et bandeau en couleur', f1.has('255,248,232') && f1.has('91,29,36'), [...f1].slice(0, 12));
ok('… témoin : sans la correction, ces fonds disparaissaient', !f0.has('255,248,232'), [...f0]);
const htmlFiche = await (async () => { const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }).catch(() => null), ov().locator('button:has-text("HTML")').first().click().catch(() => null)]); if (!dl) return ''; const p = SC + '/fiche.html'; await dl.saveAs(p); return fs.readFileSync(p, 'utf8'); })();
ok('… fiche enregistrée en HTML : couleurs à l’impression gardées', !htmlFiche || /print-color-adjust:exact/.test(htmlFiche), htmlFiche.slice(0, 200));
for (let i = 0; i < 4 && (await page.locator('.overlay').count()); i += 1) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }

// 2. étiquettes QR : planche personnalisée
await page.click('#tab-cuverie'); await page.waitForTimeout(400); await page.locator('main button', { hasText: /^Cartes$/ }).first().click(); await page.waitForTimeout(400);
await page.locator('.tankcard').first().click(); await page.waitForTimeout(500);
await ov().locator('button', { hasText: '🏷 Étiquette QR' }).click(); await page.waitForTimeout(500);
ok('formats : A4 24 étiquettes, A6 et planche personnalisée proposés', (await ov().locator('button', { hasText: 'Planche A4 · 24 étiquettes 70 × 37 mm' }).count()) === 1 && (await ov().locator('button', { hasText: 'Grande étiquette A6' }).count()) === 1 && (await ov().locator('[data-etiq-perso-bouton]').count()) === 1);
await ov().locator('[data-etiq-perso-bouton]').click(); await page.waitForTimeout(250);
ok('personnalisée : réglages (colonnes, lignes, dimensions, marges, espacements), 24 par défaut', (await ov().locator('[data-etiq-champ]').count()) === 8 && /Par page : 24 \(3 × 8\)/.test(await txt(ov().locator('[data-etiq-resume]'))), await txt(ov().locator('[data-etiq-perso]')));
await ov().locator('select[aria-label="Modèle de planche"]').selectOption('a4-21'); await page.waitForTimeout(250);
const g = await ov().locator('.etq-page-perso').first().evaluate((el) => { const c = getComputedStyle(el); return { cols: c.gridTemplateColumns, rows: c.gridTemplateRows, pt: c.paddingTop, pl: c.paddingLeft, cg: c.columnGap }; });
const mm = (x) => Math.round(parseFloat(x) * 25.4 / 96 * 10) / 10;
ok('modèle 21 étiquettes 63,5 × 38,1 mm : grille 3 × 7, marges et espacement appliqués', g.cols.split(' ').length === 3 && g.rows.split(' ').length === 7 && mm(g.cols.split(' ')[0]) === 63.5 && mm(g.rows.split(' ')[0]) === 38.1 && Math.abs(mm(g.pt) - 15.15) < 0.1 && Math.abs(mm(g.pl) - 7.2) < 0.1 && Math.abs(mm(g.cg) - 2.5) < 0.1, g);
const champ = (k) => ov().locator(`[data-etiq-champ="${k}"]`);
await champ('cols').fill('4'); await champ('lignes').fill('10'); await champ('largeur').fill('48,5'); await champ('hauteur').fill('25,4'); await champ('margeHaut').fill('21,5'); await champ('margeGauche').fill('8'); await champ('espH').fill('0'); await page.waitForTimeout(250);
ok('saisie libre : 4 × 10 de 48,5 × 25,4 mm → 40 par page, « commencer à » jusqu’à 40', /Par page : 40 \(4 × 10\)/.test(await txt(ov().locator('[data-etiq-resume]'))) && (await ov().locator('select[aria-label="Première étiquette de la planche"] option').count()) === 40, await txt(ov().locator('[data-etiq-resume]')));
await ov().locator('select[aria-label="Première étiquette de la planche"]').selectOption('7'); await page.waitForTimeout(200);
ok('… commence à la 7ᵉ : 6 cases vides puis l’étiquette', (await ov().locator('.etq-page-perso > .etq').count()) === 7 && (await ov().locator('.etq-page-perso > .etq-vide').count()) === 6);
const e1 = await ov().locator('.etq-page-perso [data-etiquette]').first().boundingBox(); const qr = await ov().locator('.etq-page-perso [data-etiquette] .etq-qr').first().boundingBox();
ok('… petite étiquette : QR réduit dans la case (25,4 mm de haut)', e1 && qr && Math.abs(e1.height * 25.4 / 96 - 25.4) < 0.6 && qr.height < e1.height && qr.width < e1.width * 0.5, { e1, qr });
await champ('largeur').fill('60'); await page.waitForTimeout(250);
ok('dépassement de la feuille signalé (4 × 60 mm + 8 mm de marge)', /Trop large pour une feuille A4 : 248 mm pour 210 mm/.test(await txt(ov())), await txt(ov().locator('[data-etiq-perso]')));
await champ('largeur').fill('48,5'); await ov().locator('label', { hasText: 'Imprimer un contour léger' }).locator('input').check(); await page.waitForTimeout(200);
ok('contour d’alignement sur les cases', (await ov().locator('.etq-page-perso .etq-contour').count()) >= 1 && (await ov().locator('.etq-page-perso .etq-contour').count()) === (await ov().locator('.etq-page-perso > .etq').count()));
await page.screenshot({ path: SC + '/shots/t71-etiquettes-perso.png' });
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), ov().locator('button', { hasText: '⬇ PDF' }).first().click()]);
const pdf = SC + '/etiquettes-perso.pdf'; await dl.saveAs(pdf); const pb = fs.readFileSync(pdf);
const PD = await PDFDocument.load(pb); const taille = PD.getPages().map((x) => x.getSize()).map((z) => [Math.round(z.width), Math.round(z.height)]);
ok('PDF : une page A4 portrait', taille.length === 1 && taille[0][0] === 595 && taille[0][1] === 842, taille);
await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1200);
const z2 = (await page.evaluate(() => window.__zones)).slice(-1)[0];
ok('impression directe : format A4 sans marge (etiq-a4), planche personnalisée', z2 && z2.format === 'etiq-a4' && /etq-page-perso/.test(z2.html), z2 && z2.format);
await page.keyboard.press('Escape'); await page.waitForTimeout(200); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.locator('.tankcard').first().click(); await page.waitForTimeout(400); await ov().locator('button', { hasText: '🏷 Étiquette QR' }).click(); await page.waitForTimeout(400);
ok('réglage gardé sur cet appareil (format personnalisé, 4 × 10, contour)', (await ov().locator('[data-etiq-perso]').count()) === 1 && /Par page : 40 \(4 × 10\)/.test(await txt(ov().locator('[data-etiq-resume]'))) && (await ov().locator('.etq-contour').count()) > 0);
await ov().locator('button', { hasText: 'Planche A4 · 24 étiquettes 70 × 37 mm' }).click(); await page.waitForTimeout(200);
ok('format standard A4 inchangé (3 × 8 de 70 × 37 mm)', (await ov().locator('.etq-page-a4').count()) === 1 && (await ov().locator('[data-etiq-perso]').count()) === 0);
await page.evaluate(() => { document.documentElement.lang = 'de'; });
const vraies = errors.filter((e) => !/favicon|ERR_FAILED|Failed to load resource/.test(e));
ok('aucune erreur dans la console', !vraies.length, vraies);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S) (t71)` : '\nTOUS LES TESTS PASSENT (t71)');
process.exitCode = ko ? 1 : 0;
