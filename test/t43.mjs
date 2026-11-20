// 0.22.0-alpha.1 : barème de jaugeage importé dès la création d'un contenant (cahier texte, PDF, fichier de barèmes à plusieurs réservoirs) —
// nom, capacité, fabricant et matière repris du cahier, tableau vérifiable et corrigeable avant d'enregistrer, barème enregistré avec le
// contenant (document d'origine gardé), remplacement en modification (l'ancien archivé), tableau choisi d'après le nom, valeurs reprises qui
// suivent le tableau choisi ; tableau des barèmes sans lignes superposées (lignes corrigées, douteuses, comblées, modifiées) ; téléphone.
// Données fictives uniquement (test/fixtures/jauge).
import { open } from './ui.mjs'; import fs from 'fs'; import path from 'path';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
const J = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'jauge');
const PDFJS = '/opt/npm-tools/node_modules/pdfjs-dist/';
const routes = async (route, u) => {
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'build/pdf.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && u.endsWith('pdf.worker.min.mjs')) { await route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(PDFJS + 'build/pdf.worker.min.mjs', 'utf8') }); return true; }
  if (u.includes('pdfjs-dist') && /\/(wasm|standard_fonts|cmaps)\//.test(u)) { const f = PDFJS + u.split(/pdfjs-dist@[^/]+\//)[1]; if (fs.existsSync(f)) { await route.fulfill({ body: fs.readFileSync(f) }); return true; } }
  return false;
};
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', name, x !== undefined && !c ? JSON.stringify(x).slice(0, 400) : ''); };
const toastDe = (page) => page.locator('.toast').last().innerText().catch(() => '');
const dbDe = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
// tableau d'un barème : une ligne par rangée, toute la largeur du tableau, aucune ligne posée sur une autre
const lignes = (loc) => loc.evaluate((root) => {
  const tab = root.querySelector('table'); const T = tab.getBoundingClientRect();
  const R = [...root.querySelectorAll('tbody tr')].map((tr) => { const r = tr.getBoundingClientRect(); return { x: r.left, w: r.width, top: r.top, bottom: r.bottom, h: r.height, cls: tr.className, disp: getComputedStyle(tr).display }; });
  let chev = 0; for (let i = 1; i < R.length; i += 1) if (R[i].top < R[i - 1].bottom - 1) chev += 1;
  const M = R.filter((r) => /jg-c-/.test(r.cls));
  return { n: R.length, marquees: M.length, classes: [...new Set(M.map((r) => r.cls))].sort(), chev, pleineLargeur: R.every((r) => Math.abs(r.x - T.left) < 2 && Math.abs(r.w - T.width) < 2), rangees: R.every((r) => r.disp === 'table-row'), hauteurs: Math.max(...R.map((r) => r.h)) - Math.min(...R.map((r) => r.h)) < 3, largeurTableau: Math.round(T.width) };
});
const tableauOk = (g) => g.chev === 0 && g.pleineLargeur && g.rangees && g.hauteurs && g.largeurTableau > 280;

const { browser, page, errors } = await open({ routes, viewport: { width: 1440, height: 950 } });
const top = () => page.locator('.overlay').last();
const champ = { nom: () => top().locator('input[placeholder="ex. Cuve 12"]'), cap: () => top().locator('input[placeholder="ex. 40"]'), fab: () => top().locator('input[aria-label="Fabricant"]') };
const nouveau = async (pg = page) => { await pg.click('#tab-cuverie'); await pg.waitForTimeout(300); await pg.locator('main button', { hasText: '+ Nouveau contenant' }).click(); await pg.waitForTimeout(300); };

// 1. création d'un contenant avec son cahier d'épalement (texte) : valeurs reprises, tableau corrigé à la main, enregistré avec le contenant
await nouveau();
ok('fiche « Nouveau contenant » : barème de jaugeage proposé', (await top().locator('[data-cont-bareme] [data-zone-depot]').count()) === 1 && /Importer le barème de jaugeage/.test(await top().locator('[data-cont-bareme]').innerText()));
await top().locator('input[aria-label="Cahier d’épalement du contenant"]').setInputFiles(J + '/cahier-demo-cuve-42.txt');
await top().locator('[data-cont-bareme-lu]').waitFor({ timeout: 20000 }); await page.waitForTimeout(200);
let v = { nom: await champ.nom().inputValue(), cap: await champ.cap().inputValue(), fab: await champ.fab().inputValue() };
ok('cahier lu : nom, capacité (hL) et fabricant repris', v.nom === 'Cuve 42' && /^42,5/.test(v.cap) && v.fab === 'Démo Inox', v);
ok('valeurs reprises signalées', /Repris du cahier : nom, capacité, fabricant, matière/.test(await top().locator('[data-cont-repris]').innerText()));
const lu = (await top().locator('[data-cont-bareme-lu]').innerText()).replace(/\s+/g, ' ');
ok('barème : 41 lignes, lecture sûre, constructeur et capacité', /41 lignes/.test(lu) && /lecture sûre/.test(lu) && /cahier-demo-cuve-42\.txt/.test(lu) && /constructeur Démo Inox/.test(lu), lu);
await top().locator('[data-cont-bareme-lu] button', { hasText: 'Voir le tableau' }).click(); await page.waitForTimeout(250);
ok('tableau et courbe affichés avant d’enregistrer', (await top().locator('[data-cont-bareme-lu] [data-bareme-tableau] tbody tr').count()) === 41 && (await top().locator('[data-cont-bareme-lu] svg').count()) >= 1);
await top().locator('input[aria-label="Volume à 100,0 cm"]').fill('2130'); await top().locator('input[aria-label="Volume à 100,0 cm"]').press('Tab'); await page.waitForTimeout(250);
const rm = top().locator('[data-cont-bareme-lu] [data-bareme-tableau] tbody tr.jg-c-manuel');
ok('valeur corrigée à la main : ligne signalée « modifiée »', (await rm.count()) === 1 && /modifiée \(avant : 2.?125\)/.test(await rm.innerText()));
let g = await lignes(top().locator('[data-cont-bareme-lu] [data-bareme-tableau]'));
ok('tableau : la ligne modifiée reste une ligne du tableau (pas de superposition)', tableauOk(g) && g.marquees === 1 && g.n === 41, g);
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('enregistré : « Contenant créé, barème de jaugeage enregistré »', /Contenant créé, barème de jaugeage enregistré/.test(await toastDe(page)), await toastDe(page));
let d = await dbDe(page); const c42 = d.contenants.find((c) => c.nom === 'Cuve 42'); let b42 = (d.baremes || []).filter((b) => c42 && b.contenantId === c42.id);
ok('contenant : capacité 42,5 hL, fabricant, matière inox', c42 && Number(c42.volMax) === 4250 && c42.fabricant === 'Démo Inox' && c42.matiere === 'inox', c42);
ok('barème rattaché au contenant : 41 lignes, correction à la main gardée', b42.length === 1 && b42[0].cible === 'contenant' && !b42[0].archive && b42[0].points.length === 41 && b42[0].points.find((p) => p[0] === 100)[1] === 2130 && b42[0].corrections.some((x) => x.mode === 'manuel' && x.h === 100) && b42[0].meta.constructeur === 'Démo Inox' && b42[0].nom === 'Cuve 42', b42);
ok('document d’origine gardé avec le barème', !!b42[0].docId && d.docs.some((x) => x.id === b42[0].docId && x.cible && x.cible.type === 'bareme' && x.cible.id === b42[0].id && x.nom === 'cahier-demo-cuve-42.txt'));

// 2. modification : barème actuel consultable (tableau sans superposition), nouveau fichier à plusieurs réservoirs, tableau choisi d'après le nom
await page.locator('.pitem', { hasText: 'Cuve 42' }).first().click(); await page.waitForTimeout(350);
await top().locator('.sheet-f button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(350);
ok('modification : barème actuel indiqué', /Barème actuel/.test(await top().locator('[data-cont-bareme]').innerText()) && /Déposer un nouveau cahier d’épalement/.test(await top().locator('[data-cont-bareme]').innerText()));
await top().locator('[data-cont-bareme] button', { hasText: 'Voir le barème' }).click(); await page.waitForTimeout(350);
g = await lignes(top().locator('[data-bareme-tableau]'));
ok('fiche du barème : tableau en lecture, ligne modifiée sans superposition', tableauOk(g) && g.marquees === 1 && g.n === 41, g);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
ok('fiche du barème fermée, modification du contenant toujours ouverte', /Modifier Cuve 42/.test(await top().innerText()));
await top().locator('input[aria-label="Cahier d’épalement du contenant"]').setInputFiles(J + '/baremes-demo-3-cuves.json');
await top().locator('[data-cont-bareme-lu]').waitFor({ timeout: 20000 }); await page.waitForTimeout(200);
const sel = top().locator('select[aria-label="Tableau du document"]');
ok('fichier de 3 réservoirs : tableau « Cuve 42 » choisi d’après le nom', (await sel.locator('option').count()) === 3 && (await sel.inputValue()) === '1' && /lecture sûre/.test(await top().locator('[data-cont-bareme-lu]').innerText()));
ok('modification : nom et fabricant gardés', (await champ.nom().inputValue()) === 'Cuve 42' && (await champ.fab().inputValue()) === 'Démo Inox');
const avis = top().locator('[data-cont-bareme] ~ *, .notice', { hasText: 'Capacité d’après le barème' }).first();
ok('capacité différente signalée (46 hL au barème, 42,5 hL sur la fiche)', /Capacité d’après le barème : 46,?0* hL \(fiche : 42,5/.test((await avis.innerText().catch(() => '')).replace(/\s+/g, ' ')), await avis.innerText().catch(() => ''));
await top().locator('button', { hasText: 'Utiliser la capacité du barème' }).click(); await page.waitForTimeout(200);
ok('capacité du barème reprise', /^46/.test(await champ.cap().inputValue()));
await top().locator('[data-cont-bareme-lu] button', { hasText: 'Voir le tableau' }).click(); await page.waitForTimeout(250);
g = await lignes(top().locator('[data-cont-bareme-lu] [data-bareme-tableau]'));
ok('tableau : lignes corrigée, douteuse et comblée à leur place (aucune superposition)', tableauOk(g) && g.marquees === 3 && g.classes.join() === 'jg-c-chiffre,jg-c-douteux,jg-c-interpole', g);
// fenêtre défilée à la molette : en-tête et boutons collés aux bords de l'écran (le contenu ne passe plus au-dessus de l'en-tête ni sous les boutons)
await page.mouse.move(720, 40); await page.mouse.wheel(0, 650); await page.waitForTimeout(350);
const bords = await page.evaluate(() => { const o = [...document.querySelectorAll('.overlay')].pop(); const h = o.querySelector('.sheet-h').getBoundingClientRect(); const f = o.querySelector('.sheet-f').getBoundingClientRect(); return { haut: Math.round(h.top), bas: Math.round(window.innerHeight - f.bottom), defile: o.scrollTop }; });
ok('fenêtre défilée : en-tête et boutons collés aux bords, rien ne passe au-dessus ni en dessous', bords.defile > 100 && Math.abs(bords.haut) <= 1 && Math.abs(bords.bas) <= 1, bords);
await page.screenshot({ path: SC + '/shots/t43-tableau.png' });
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('enregistré : « Contenant modifié, barème de jaugeage enregistré »', /Contenant modifié, barème de jaugeage enregistré/.test(await toastDe(page)), await toastDe(page));
d = await dbDe(page); b42 = d.baremes.filter((b) => b.contenantId === c42.id); const actif = b42.filter((b) => !b.archive);
ok('nouveau barème en service, l’ancien archivé', b42.length === 2 && actif.length === 1 && actif[0].points.length === 41 && actif[0].points.find((p) => p[0] === 200)[1] === 4600 && actif[0].corrections.length === 3 && b42.find((b) => b.archive).points.find((p) => p[0] === 100)[1] === 2130, b42.map((b) => ({ a: b.archive, n: b.points.length, c: (b.corrections || []).length })));
ok('capacité du contenant : 46 hL', Number(d.contenants.find((c) => c.id === c42.id).volMax) === 4600);
// Paramètres › Barèmes de jaugeage : même tableau, sans superposition
await page.keyboard.press('Escape'); await page.waitForTimeout(250); while ((await page.locator('.overlay').count()) > 0) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); }
await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('main button', { hasText: 'Barèmes de jaugeage' }).first().click(); await page.waitForTimeout(300);
await page.locator('main tr, main .card, main li', { hasText: 'Cuve 42' }).locator('button', { hasText: /Voir|Ouvrir|Détails/ }).first().click().catch(async () => { await page.locator('main', { hasText: 'Cuve 42' }).getByText('Cuve 42').first().click(); });
await page.waitForTimeout(350);
if ((await page.locator('.overlay [data-bareme-tableau]').count()) === 1) { g = await lignes(top().locator('[data-bareme-tableau]')); ok('Paramètres › Barèmes : tableau en lecture sans superposition', tableauOk(g) && g.marquees === 3, g); await page.keyboard.press('Escape'); await page.waitForTimeout(250); }
else ok('Paramètres › Barèmes : fiche du barème ouverte', false, (await page.locator('main').innerText()).slice(0, 300));

// 3. fichier de plusieurs réservoirs sans nom saisi : les valeurs reprises suivent le tableau choisi, sauf si on les a modifiées
await nouveau();
await top().locator('input[aria-label="Cahier d’épalement du contenant"]').setInputFiles(J + '/baremes-demo-3-cuves.json');
await top().locator('[data-cont-bareme-lu]').waitFor({ timeout: 20000 }); await page.waitForTimeout(200);
ok('sans nom : premier tableau, nom et capacité repris du fichier', (await champ.nom().inputValue()) === 'Cuve 41' && /^40/.test(await champ.cap().inputValue()));
await top().locator('select[aria-label="Tableau du document"]').selectOption('2'); await page.waitForTimeout(200);
ok('autre tableau choisi : nom et capacité suivent (Cuve 43, 50 hL)', (await champ.nom().inputValue()) === 'Cuve 43' && /^50/.test(await champ.cap().inputValue()));
await champ.nom().fill('Cuve 43 bis'); await top().locator('select[aria-label="Tableau du document"]').selectOption('0'); await page.waitForTimeout(200);
ok('nom modifié à la main : gardé ; capacité reprise : suit le tableau', (await champ.nom().inputValue()) === 'Cuve 43 bis' && /^40/.test(await champ.cap().inputValue()));
await top().locator('[data-cont-bareme-lu] button', { hasText: 'Retirer' }).click(); await page.waitForTimeout(200);
ok('barème retiré : dépôt de nouveau proposé', (await top().locator('[data-cont-bareme-lu]').count()) === 0 && (await top().locator('[data-cont-bareme] [data-zone-depot]').count()) === 1 && !(await top().locator('[data-cont-repris]').count()));
// tableau collé (Excel) : volumes écrits avec une espace entre les milliers
await top().locator('[data-cont-bareme] summary', { hasText: 'Ou coller un tableau' }).click(); await page.waitForTimeout(150);
await top().locator('textarea[aria-label="Tableau du barème collé"]').fill(['Hauteur (cm)\tVolume (L)', ...Array.from({ length: 21 }, (_, i) => `${i * 10}\t${String(i * 105).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')}`)].join('\n'));
await top().locator('[data-cont-bareme] button', { hasText: 'Lire le tableau collé' }).click(); await page.waitForTimeout(300);
const luC = (await top().locator('[data-cont-bareme-lu]').innerText().catch(() => '')).replace(/\s+/g, ' ');
ok('tableau collé : 21 lignes, « 1 050 » lu en entier (0 à 21,00 hL)', /21 lignes/.test(luC) && /tableau collé/.test(luC) && /21,00 hL/.test(luC), luC.slice(0, 200));
await top().locator('.sheet-f button', { hasText: 'Annuler' }).click(); await page.waitForTimeout(300);
d = await dbDe(page); ok('annulé : rien d’enregistré', !d.contenants.some((c) => /Cuve 4[13]/.test(c.nom)) && d.baremes.length === 2);

// 4. cahier en PDF (document fictif, texte du PDF lu par pdf.js)
await nouveau();
await top().locator('input[aria-label="Cahier d’épalement du contenant"]').setInputFiles(J + '/cahier-demo-cuve-7.pdf');
await top().locator('[data-cont-bareme-lu], [data-cont-bareme] .notice').first().waitFor({ timeout: 60000 }); await page.waitForTimeout(250);
const lu7 = (await top().locator('[data-cont-bareme]').innerText()).replace(/\s+/g, ' ');
ok('PDF lu : Cuve 7, 101 lignes, 30 hL, fabricant', (await champ.nom().inputValue()) === 'Cuve 7' && /101 lignes/.test(lu7) && /^30/.test(await champ.cap().inputValue()) && (await champ.fab().inputValue()) === 'Demo Inox', lu7.slice(0, 300));
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
d = await dbDe(page); const c7 = d.contenants.find((c) => c.nom === 'Cuve 7'); const b7 = c7 ? d.baremes.filter((b) => b.contenantId === c7.id) : [];
ok('PDF : contenant et barème enregistrés ensemble', c7 && Number(c7.volMax) === 3000 && b7.length === 1 && b7[0].points.length === 101 && b7[0].points.find((p) => p[0] === 100)[1] === 1500 && d.docs.some((x) => x.id === b7[0].docId && x.mime === 'application/pdf'), b7.map((b) => b.points.length));
ok('aucune erreur de page', !errors.length, errors.slice(0, 3));
await browser.close();

// 5. téléphone : import à la création, tableau lisible, lignes modifiées à leur place, pas de défilement horizontal
{
  const { browser: b2, page: p2, errors: e2 } = await open({ routes, viewport: { width: 390, height: 844 }, mobile: true });
  const t2 = () => p2.locator('.overlay').last();
  await nouveau(p2);
  await t2().locator('input[aria-label="Cahier d’épalement du contenant"]').setInputFiles(J + '/baremes-demo-3-cuves.json');
  await t2().locator('[data-cont-bareme-lu]').waitFor({ timeout: 20000 }); await t2().locator('select[aria-label="Tableau du document"]').selectOption('1'); await p2.waitForTimeout(200);
  await t2().locator('[data-cont-bareme-lu] button', { hasText: 'Voir le tableau' }).click(); await p2.waitForTimeout(250);
  await t2().locator('input[aria-label="Volume à 80,0 cm"]').fill('1845'); await t2().locator('input[aria-label="Volume à 80,0 cm"]').press('Tab'); await p2.waitForTimeout(250);
  const g2 = await lignes(t2().locator('[data-cont-bareme-lu] [data-bareme-tableau]'));
  ok('téléphone : tableau sans superposition (corrigée, douteuse, comblée, modifiée)', g2.chev === 0 && g2.pleineLargeur && g2.rangees && g2.marquees === 4, g2);
  const fit = await t2().locator('[data-cont-bareme-lu] [data-bareme-tableau] .jg-tab').evaluate((e) => ({ s: e.scrollWidth, c: e.clientWidth }));
  ok('téléphone : les colonnes du tableau tiennent dans la largeur (390 px)', fit.s <= fit.c + 2, fit);
  const larg = await p2.evaluate(() => { const s = document.querySelector('.overlay:last-of-type .sheet') || document.querySelector('.overlay .sheet'); return { s: s ? s.scrollWidth - s.clientWidth : 99, doc: document.documentElement.scrollWidth - window.innerWidth }; });
  ok('téléphone : fiche du contenant sans défilement horizontal', larg.s <= 2 && larg.doc <= 2, larg);
  await t2().locator('[data-cont-bareme-lu] [data-bareme-tableau] tbody tr.jg-c-manuel').evaluate((tr) => { const o = tr.closest('.overlay'); const t = tr.closest('.jg-tab'); t.scrollTop = tr.offsetTop - 60; o.scrollTop += t.getBoundingClientRect().top - 120; });
  await p2.screenshot({ path: SC + '/shots/t43-mobile.png' });
  await t2().locator('.sheet-f .btn-primary').click(); await p2.waitForTimeout(400);
  const dm = await dbDe(p2); const cm = dm.contenants.find((c) => c.nom === 'Cuve 42' && c.fabricant === 'Démo Inox');
  ok('téléphone : contenant et barème enregistrés', !!cm && dm.baremes.some((b) => b.contenantId === cm.id && b.corrections.some((x) => x.mode === 'manuel' && x.h === 80)));
  ok('téléphone : aucune erreur', !e2.length, e2.slice(0, 2));
  await b2.close();
}

// 6. identifiants activés : un profil qui crée des contenants sans pouvoir modifier les Paramètres n'a pas l'import du barème (refusé sinon à l'enregistrement)
{
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
  const files = ['10-core.js', '11-crus.js', '12-vin.js', '13-operations.js', '14-formulaires.js', '15-baremes.js', '16-hygiene.js', '16b-intrants-fiches.js', '17-ia.js', '18-mentions.js', '19-pressoir.js', '20-engine.js', '25-trace.js', '30-store.js', '31-crud.js', '32-sync.js', '33-cloud.js', '34-acces.js', '35-seed.js'];
  globalThis.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
  const L = new Function('React', files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { sampleDb, normalizeDb, securiteActiver, mdpEmpreinte, profilSave, utilisateurSave };')({});
  const d0 = L.normalizeDb(L.sampleDb()); const mdp = await L.mdpEmpreinte('Demo-2026!', 1000); L.securiteActiver(d0, { identifiant: 'admin', mdp });
  const pf = L.profilSave(d0, { nom: 'Caviste (test)', modules: { cuverie: 'ecriture', ops: 'ecriture', params: 'lecture' }, speciaux: {} }); L.utilisateurSave(d0, { identifiant: 'caviste', profilId: pf.id, mdp, doitChanger: false });
  const init = `try { if (!sessionStorage.getItem('t43')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(d0))}); sessionStorage.setItem('t43', '1'); } } catch (e) {}`;
  const { browser: b3, page: p3, errors: e3 } = await open({ init, routes, viewport: { width: 1280, height: 900 } });
  const f = p3.locator('[data-connexion] form'); if (await f.locator('input[aria-label="Identifiant"]').count()) await f.locator('input[aria-label="Identifiant"]').fill('caviste');
  await f.locator('input[aria-label="Mot de passe"]').fill('Demo-2026!'); await f.locator('button[type=submit]').click(); await p3.waitForTimeout(1000);
  await nouveau(p3); const t3 = () => p3.locator('.overlay').last();
  ok('profil sans droit sur les Paramètres : import du barème remplacé par une explication', (await t3().locator('[data-cont-bareme-droits]').count()) === 1 && (await t3().locator('[data-cont-bareme] [data-zone-depot]').count()) === 0);
  await t3().locator('input[placeholder="ex. Cuve 12"]').fill('Cuve 90'); await t3().locator('input[placeholder="ex. 40"]').fill('12');
  await t3().locator('.sheet-f .btn-primary').click(); await p3.waitForTimeout(400);
  ok('… le contenant se crée normalement', /Contenant créé\./.test(await toastDe(p3)) && (await dbDe(p3)).contenants.some((c) => c.nom === 'Cuve 90'), await toastDe(p3));
  ok('identifiants : aucune erreur', !e3.length, e3.slice(0, 2));
  await b3.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt43 : TOUT PASSE');
