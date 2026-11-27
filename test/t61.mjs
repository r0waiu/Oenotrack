// 0.30.0-alpha.1 : catalogues de produits œnologiques — Intrants › Catalogues (catalogues affichés, masquage d'un catalogue et d'un
// fournisseur, recherche, ajout à mes produits), import d'un catalogue CSV fictif créé ici (relecture, validation), saisie d'un intrant
// fournisseur d'abord (« En stock », produits du catalogue), réception depuis la ligne ; anglais. Données fictives.
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
// choix dans un SI : liste native (moins de 8 choix) ou saisie avec propositions
const choisir = async (page, loc, label, tape) => { const el = loc.first(); if ((await el.evaluate((e) => e.tagName)) === 'SELECT') await el.selectOption({ label }); else await pick(page, el, tape || label, label); await page.waitForTimeout(250); };
// catalogue fictif (fournisseur « Œnologie Test ») : en-têtes français, point-virgule, Windows-1252 comme un export d'Excel
const csv = ['Produit;Famille;Dose;Dose max;Conditionnement;Bio', 'LEVURE TEST CHAMPAGNE;levure;20-30 g/hL;;500 g;oui', 'COLLE TEST VÉGÉTALE;colle;10-30 g/hL;50 g/hL;1 kg, 5 kg;', 'PRODUIT SANS DOSE TEST;;;;10 kg;'].join('\r\n');
const fCsv = SC + '/catalogue-test.csv'; fs.writeFileSync(fCsv, Buffer.from(csv, 'latin1'));
{
  const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await page.click('#tab-intrants'); await page.waitForTimeout(500);
  const nav = await txt(page.locator('main [role=tablist]').first());
  ok('Intrants : onglets « Catalogues » et « Revendications & plafonds » (avec les exemples à vérifier)', /Catalogues/.test(nav) && /Revendications & plafonds/.test(nav), nav);
  await page.locator('main [role=tab]', { hasText: 'Catalogues' }).click(); await page.waitForTimeout(600);
  const cats = await page.locator('[data-catalogue]').evaluateAll((els) => els.map((e) => e.getAttribute('data-catalogue')));
  const vue = await txt(page.locator('main'));
  ok('catalogues affichés : Laffort, IOC, Sofralab (Oenofrance, SOEC, Martin Vialatte) et liste Ecocert, nombre de produits de chacun', cats.filter((c) => c !== 'ecocert').join() === 'ioc,laffort,oenofrance,soec,martinvialatte' && cats.includes('ecocert') /* 0.40.0-alpha.1 : liste Ecocert, masquée par défaut */ && /Catalogue LAFFORT® 2026 \(193 produit\(s\)\)/.test(vue) && /Catalogue SOEC 2024\/2025 \(90 produit\(s\)\)/.test(vue), cats);
  ok('… avertissement : données des catalogues à vérifier sur la fiche technique', /Vérifiez-les sur la fiche technique du produit avant usage/.test(vue));
  // masquer SOEC (réglage commun), puis le fournisseur Sofralab entier
  await page.locator('[data-catalogue=soec] input[type=checkbox]').uncheck(); await page.waitForTimeout(400);
  let d = await db();
  ok('SOEC masqué : réglage commun enregistré dans la base', (d.catalogueReglage.masques || []).includes('cat:soec'));
  await page.locator('main input[aria-label="Rechercher un produit"]').fill('SOEC'); await page.waitForTimeout(400);
  ok('… plus aucun produit SOEC dans la recherche', /Aucun produit pour ces critères/.test(await txt(page.locator('[data-catalogue-res]'))));
  await page.locator('[data-fournisseur="Sofralab"] input[type=checkbox]').first().uncheck(); await page.waitForTimeout(400);
  d = await db();
  ok('fournisseur Sofralab masqué : ses catalogues grisés, chip « masqué »', d.catalogueReglage.masques.includes('fo:sofralab') && /masqué/.test(await txt(page.locator('[data-fournisseur="Sofralab"]'))) && (await page.locator('[data-catalogue=oenofrance] input[type=checkbox]').isDisabled()));
  await page.locator('[data-fournisseur="Sofralab"] input[type=checkbox]').first().check(); await page.waitForTimeout(300);
  // recherche + ajout à mes produits
  await page.locator('main input[aria-label="Rechercher un produit"]').fill('MANNOSTAB'); await page.waitForTimeout(400);
  const res = await txt(page.locator('[data-catalogue-res]'));
  ok('recherche « MANNOSTAB » : produit Laffort, famille, dose conseillée, conditionnements, source (catalogue, page)', /MANNOSTAB LIQUIDE 200/.test(res) && /Stabilisants tartriques/.test(res) && /5-15 cL\/hL/.test(res) && /1 L, 10 L/.test(res) && /Catalogue LAFFORT® 2026 · p\. 14/.test(res), res.slice(0, 400));
  await page.locator('[data-catalogue-res] button', { hasText: '＋ Ajouter à mes produits' }).first().click(); await page.waitForTimeout(500);
  d = await db(); const pm = d.produits.find((p) => p.nom === 'MANNOSTAB LIQUIDE 200'); const rg = (d.regles || []).find((r) => pm && r.produitId === pm.id && r.qualifId === 'conv');
  ok('… ajouté à mes produits : fournisseur Laffort créé, famille, catalogue, règle Conventionnel « à vérifier »', !!pm && d.fournisseurs.some((f) => f.nom === 'Laffort' && f.id === pm.fournisseurId) && pm.famille === 'stabilisant tartrique' && pm.catalogue.titre === 'Catalogue LAFFORT® 2026' && rg.aVerifier && /✓ dans vos produits/.test(await txt(page.locator('[data-catalogue-res]'))), [pm, rg]);
  // filtres : famille + bio
  await page.locator('main input[aria-label="Rechercher un produit"]').fill(''); await choisir(page, page.locator('main [aria-label="Famille"]'), 'Bentonites', 'Bento');
  await page.locator('main label', { hasText: 'Utilisable en bio' }).locator('input').check(); await page.waitForTimeout(400);
  const rb = await page.locator('[data-catalogue-res] tbody tr').evaluateAll((trs) => trs.map((tr) => tr.innerText.replace(/\s+/g, ' ')));
  ok('filtres : famille « Bentonites » + utilisable en bio → bentonites marquées bio UE ou inscrites sur la liste Ecocert seulement', rb.length >= 1 && rb.every((r) => /Bentonites/.test(r) && /bio UE|NOP|liste Ecocert/.test(r)), rb.slice(0, 3));
  await page.screenshot({ path: SC + '/shots/t61-catalogues.png' });
  // import d'un catalogue CSV (fictif) : relecture, validation
  await page.locator('main button', { hasText: '📥 Importer un catalogue…' }).click(); await page.waitForTimeout(400);
  await ov().locator('input[placeholder="ex. Fournisseur œnologique"]').fill('Œnologie Test');
  await ov().locator('label', { hasText: '📄 Lire le fichier (script)' }).locator('input[type=file]').setInputFiles(fCsv); await page.waitForTimeout(1200);
  const lu = await txt(ov());
  ok('import CSV (Windows-1252) : 3 produits reconnus, accents lus, à vérifier', /3 produit\(s\) reconnu\(s\)/.test(lu) && /COLLE TEST VÉGÉTALE/.test(lu) && /Levures/.test(lu), lu.slice(0, 500));
  await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(800);
  d = await db(); const ci = (d.catalogues || [])[0];
  ok('… enregistré « à vérifier » (titre tiré du fichier) ; relecture ouverte', ci && ci.fournisseur === 'Œnologie Test' && ci.titre === 'catalogue-test' && ci.mode === 'tableur' && ci.lignes.length === 3 && ci.lignes.every((l) => l.etat === 'aVerifier') && /Catalogue importé — catalogue-test/.test(await txt(ov())), ci);
  await ov().locator('[data-relire] label', { hasText: 'Tout sélectionner' }).locator('input').check(); await page.waitForTimeout(200);
  await ov().locator('tbody tr', { hasText: 'PRODUIT SANS DOSE TEST' }).locator('input[type=checkbox]').uncheck();
  await ov().locator('button', { hasText: '✓ Valider la sélection' }).click(); await page.waitForTimeout(500);
  await choisir(page, ov().locator('[aria-label="Lignes"]'), 'À vérifier'); await ov().locator('tbody tr', { hasText: 'PRODUIT SANS DOSE TEST' }).locator('input[type=checkbox]').check();
  await ov().locator('button', { hasText: 'Écarter' }).click(); await page.waitForTimeout(500);
  d = await db(); const et = d.catalogues[0].lignes.map((l) => l.etat);
  ok('… 2 lignes validées, 1 écartée', et.filter((x) => x === 'valide').length === 2 && et.filter((x) => x === 'ecarte').length === 1, et);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok('… catalogue importé listé (2 produits proposés), bouton « Relire »', /catalogue-test \(2 produit\(s\)\)/.test(await txt(page.locator('[data-fournisseur="Œnologie Test"]'))) && /Relire/.test(await txt(page.locator('[data-fournisseur="Œnologie Test"]'))));
  // saisie d'un intrant : fournisseur d'abord
  await page.click('#tab-cuverie'); await page.waitForTimeout(400); await page.locator('main [role=tab]', { hasText: 'Cartes' }).click(); await page.waitForTimeout(300);
  await page.locator('.tankcard', { hasText: 'Cuve D1' }).first().click(); await page.waitForTimeout(600);
  await ov().locator('[data-rubrique=lots] button', { hasText: 'Intrant' }).first().click(); await page.waitForTimeout(600);
  const ajout = ov().locator('button', { hasText: '+ Ajouter un intrant' }); if (!(await ov().locator('[data-ligne-intrant]').count())) { await ajout.first().click(); await page.waitForTimeout(250); }
  const lg = ov().locator('[data-ligne-intrant="0"]');
  ok('ligne d’intrant : « Fournisseur » d’abord, produit inactif tant qu’il n’est pas choisi', (await lg.locator('[aria-label="Fournisseur"]').count()) === 1 && (await lg.locator('[aria-label="Produit"]').first().isDisabled()));
  await choisir(page, lg.locator('[aria-label="Fournisseur"]'), 'En stock');
  const so = await lg.locator('[aria-label="Produit"]').first(); const optStock = (await so.evaluate((e) => e.tagName)) === 'SELECT' ? await so.locator('option').allInnerTexts() : null;
  if (!optStock) { await so.click(); await page.waitForTimeout(200); }
  const lst = optStock || await lg.locator('[role=option]').allInnerTexts();
  ok('« En stock » : seulement des produits dont il reste un lot fournisseur (pas de catalogue)', lst.length > 3 && lst.some((x) => /Métabisulfite de potassium/.test(x)) && !lst.some((x) => /\(catalogue\)/.test(x)), lst.slice(0, 6));
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  if (!(await page.locator('.overlay').count())) { ok('formulaire resté ouvert après Échap dans la liste', false); }
  await choisir(page, lg.locator('[aria-label="Fournisseur"]'), 'Laffort', 'Laff');
  await pick(page, lg.locator('input[aria-label="Produit"]'), 'SOLUTION 6', 'SOLUTION 6 · Laffort (catalogue)'); await page.waitForTimeout(500);
  d = await db(); const ps = d.produits.find((p) => p.nom === 'SOLUTION 6');
  ok('produit du catalogue choisi : ajouté à mes produits (teneur en SO₂ 60 g/L, famille sulfitage), sélectionné sur la ligne', ps && ps.so2 === '60 g/L' && ps.famille === 'sulfitage' && /SOLUTION 6/.test(await lg.locator('[aria-label="Produit"]').first().evaluate((e) => (e.tagName === 'SELECT' ? e.options[e.selectedIndex].text : e.value))), ps);
  ok('… aucun lot fournisseur : « ＋ Réception… » proposé', (await lg.locator('button', { hasText: '＋ Réception…' }).count()) === 1);
  await lg.locator('button', { hasText: '＋ Réception…' }).click(); await page.waitForTimeout(500);
  const rec = await txt(ov());
  ok('réception : produit et fournisseur (Laffort) pré-remplis', /Nouvel arrivage \(lot fournisseur\)/.test(rec) && await ov().locator('[aria-label="Fournisseur"], select').first().count() > 0, rec.slice(0, 300));
  await ov().locator('input[placeholder="ex. SK-2609"]').fill('LF-TEST-2611'); await ov().locator('label', { hasText: 'Quantité reçue' }).locator('input').fill('10');
  await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(700);
  d = await db(); const ar = d.arrivages.find((a) => a.numLot === 'LF-TEST-2611');
  const lgTxt = await txt(ov().locator('[data-ligne-intrant="0"]'));
  ok('… arrivage enregistré chez Laffort, choisi sur la ligne (reste 10 L)', ar && ar.produitId === ps.id && d.fournisseurs.find((f) => f.id === ar.fournisseurId).nom === 'Laffort' && /LF-TEST-2611/.test(lgTxt) && (await ov().locator('[data-ligne-intrant="0"] button', { hasText: '＋ Réception…' }).count()) === 0, [ar, lgTxt]);
  await page.screenshot({ path: SC + '/shots/t61-saisie.png' });
  console.log('ERREURS', errors.length ? errors : 'aucune'); if (errors.length) ko++;
  await browser.close();
}
// anglais : catalogues et saisie d'un intrant
{
  const { browser, page, errors } = await open({ locale: 'en-US', viewport: { width: 1280, height: 900 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  await page.click('#tab-intrants'); await page.waitForTimeout(400);
  const nav = await txt(page.locator('main [role=tablist]').first());
  ok('anglais : onglets « Stock & deliveries », « Products & rules by designation », « Catalogues », « Designations & limits »', /Stock & deliveries/.test(nav) && /Products & rules by designation/.test(nav) && /Catalogues/.test(nav) && /Designations & limits/.test(nav), nav);
  await page.locator('main [role=tab]', { hasText: 'Catalogues' }).click(); await page.waitForTimeout(500);
  await page.locator('main input[aria-label="Search for a product"]').fill('MANNOSTAB'); await page.waitForTimeout(400);
  const v = await txt(page.locator('main'));
  ok('… « Supplier catalogues », « Catalogues shown », familles traduites, « ＋ Add to my products »', /Supplier catalogues/.test(v) && /Catalogues shown/.test(v) && /Tartaric stabilisers/.test(v) && /＋ Add to my products/.test(v) && /Recommended dose/i.test(v), v.slice(0, 600));
  await page.click('#tab-cuverie'); await page.waitForTimeout(400); await page.locator('main [role=tab]', { hasText: 'Cards' }).click(); await page.waitForTimeout(300);
  await page.locator('.tankcard', { hasText: 'Cuve D1' }).first().click(); await page.waitForTimeout(600);
  await ov().locator('[data-rubrique=lots] button', { hasText: 'Additive' }).first().click(); await page.waitForTimeout(600);
  if (!(await ov().locator('[data-ligne-intrant]').count())) { await ov().locator('button', { hasText: '+ Add an additive' }).first().click(); await page.waitForTimeout(250); }
  const lg = ov().locator('[data-ligne-intrant="0"]'); const ph = await lg.locator('[aria-label="Product"], [aria-label="Produit"]').first().evaluate((e) => e.getAttribute('placeholder') || (e.options && e.options[0] ? e.options[0].text : ''));
  const fph = await lg.locator('[aria-label="Supplier"], [aria-label="Fournisseur"]').first().evaluate((e) => e.getAttribute('placeholder') || (e.options && e.options[0] ? e.options[0].text : ''));
  ok('… ligne d’intrant : « Supplier or “In stock”… », « Choose the supplier first »', /Supplier or “In stock”…/.test(fph) && /Choose the supplier first/.test(ph), [fph, ph]);
  console.log('ERREURS', errors.length ? errors : 'aucune'); if (errors.length) ko++;
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUT EST BON');
process.exitCode = ko ? 1 : 0;
