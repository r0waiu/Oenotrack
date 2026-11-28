// 0.43.0-alpha.1 : Intrants › Labels & cahiers des charges (vues réunies), SO₂ comparé, plafond lié aux produits des catalogues (délier,
// lier), composé d'un produit des catalogues, VMN dans la matrice, logo → page de présentation (application et écran de connexion).
// Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await page.click('#tab-intrants'); await page.waitForTimeout(400);
  const nav = await txt(page.locator('main [role=tablist]').first());
  ok('Intrants : un seul sous-onglet « Labels & cahiers des charges » (plus « Revendications & plafonds » ni « Référentiel réglementaire »)', /Labels & cahiers des charges/.test(nav) && !/Revendications & plafonds/.test(nav) && !/Référentiel réglementaire/.test(nav), nav);
  await page.locator('main [role=tab]', { hasText: 'Labels & cahiers des charges' }).click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-labels]'));
  ok('vue « Revendications & labels » : activation, appellation, référentiels des revendications', /Revendications & labels/.test(t) && /AOC Champagne/.test(t) && (await page.locator('[data-ref-revendications]').count()) === 1, t.slice(0, 300));
  ok('… VMN (Vin Méthode Nature) proposé, plus d’AVN', /Vin Méthode Nature/.test(t) && !/AVN/.test(t));
  // ---- SO₂ comparé
  await page.locator('[data-labels-vue="so2"]').click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-labels-so2]'));
  ok('SO₂ total : exploitation, labels et plafond retenu côte à côte (BIO, vins rouges : 100 mg/L)', /BIO/.test(t) && /100 mg\/L/.test(t) && /Retenu/i.test(t), t.slice(0, 400));
  ok('… plafonds de l’exploitation et des labels dans la même vue', (await page.locator('[data-plafonds-so2]').count()) === 1 && (await page.locator('[data-ref-so2]').count()) === 1);
  // ---- plafond lié aux produits des catalogues
  const b = page.locator('[data-plafonds-so2] [data-plafond-catalogue]').first(); const pid = await b.getAttribute('data-plafond-catalogue'); const lib0 = await b.innerText();
  await b.click(); await page.waitForTimeout(500);
  const L = ov().locator(`[data-plafond-liens="${pid}"] tbody tr`); const n0 = await L.count();
  ok('plafond de SO₂ : produits des catalogues apportant du SO₂ liés d’office', n0 > 0 && /automatique/.test(await txt(L.first())) && /\d+ lié/.test(lib0), { n0, lib0 });
  const nom0 = (await L.first().locator('b').innerText()).trim();
  await L.first().locator('button', { hasText: 'Délier' }).click(); await page.waitForTimeout(500);
  let d = await db(); let P = (d.plafonds || []).find((p) => p.id === pid);
  ok('« Délier » : exemple copié dans la base, produit retiré (lien tracé)', P && P.liens && P.liens.retraits.length === 1 && /retiré/.test(await txt(ov().locator(`[data-plafond-liens="${pid}"] tbody tr`, { hasText: nom0 }).first())), P && P.liens);
  await ov().getByLabel('Chercher un produit des catalogues').fill('bentonite'); await page.waitForTimeout(400);
  await ov().locator('button', { hasText: '＋ Lier' }).first().click(); await page.waitForTimeout(500);
  d = await db(); P = d.plafonds.find((p) => p.id === pid);
  ok('lier un autre produit à la main (recherche dans les catalogues)', P.liens.ajouts.length === 1 && /ajouté à la main/.test(await txt(ov())));
  await ov().getByRole('button', { name: 'Fermer' }).last().click(); await page.waitForTimeout(300);
  // ---- substances et composés
  await page.locator('[data-labels-vue="substances"]').click(); await page.waitForTimeout(500);
  const nCols = await page.locator('[data-ref-matrice] thead th').count(); const ths = await txt(page.locator('[data-ref-matrice] thead'));
  ok('matrice composés × référentiels : 9 référentiels avec VMN', nCols === 10 && /VMN/.test(ths) && !/AVN/.test(ths), ths);
  await page.locator('[data-compose-catalogue="tanins"]').click(); await page.waitForTimeout(500);
  const C = ov().locator('[data-compose-liens="tanins"] tbody tr'); const nc = await C.count();
  ok('composé « tanins » : produits des catalogues reconnus d’après le nom', nc > 0 && /automatique/.test(await txt(C.first())), nc);
  await C.first().locator('button', { hasText: 'Retirer ce composé' }).click(); await page.waitForTimeout(500);
  d = await db(); const cc = (d.settings.referentiel || {}).composesCatalogue || {};
  ok('« Retirer ce composé » : composés de l’entrée choisis (liste sans tanins), le produit quitte la liste', Object.keys(cc).length === 1 && !Object.values(cc)[0].some((x) => x.id === 'tanins') && (await C.count()) === nc - 1, cc);
  await ov().getByRole('button', { name: 'Fermer' }).last().click(); await page.waitForTimeout(300);
  await page.screenshot({ path: `${SC}/shots/t82-labels.png`, fullPage: true });
  // ---- produits par revendication, textes
  await page.locator('[data-labels-vue="produits"]').click(); await page.waitForTimeout(400);
  ok('vue « Produits par revendication » : synthèse commune', (await page.locator('[data-ref-synthese]').count()) === 1);
  await page.locator('[data-labels-vue="textes"]').click(); await page.waitForTimeout(400);
  ok('vue « Textes de référence » : charte Vin Méthode Nature du 23 mars 2023', /23 mars 2023/.test(await txt(page.locator('[data-labels]'))));
  // ---- logo → page de présentation
  await page.locator('header [data-brand-presentation]').click(); await page.waitForTimeout(500);
  ok('logo de l’en-tête → page de présentation (« Revenir à Œnotrack »)', (await page.locator('[data-accueil="revoir"]').count()) === 1);
  await page.locator('[data-accueil-ouvrir]').first().click(); await page.waitForTimeout(500);
  ok('… retour à l’application', (await page.locator('#tab-intrants').count()) === 1);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  // ---- écran de connexion : le logo ramène aussi à la présentation
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); d.settings.securite = { actif: true }; d.utilisateurs = [...(d.utilisateurs || []), { id: 'u-t82', identifiant: 'fictif', nom: 'Fictif', profilId: 'admin', actif: true }]; localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); });
  await page.reload(); await page.waitForTimeout(1200);
  ok('identifiants activés : écran de connexion', (await page.locator('[data-connexion]').count()) === 1);
  await page.locator('[data-connexion] [data-brand-presentation]').click(); await page.waitForTimeout(500);
  ok('logo de l’écran de connexion → page de présentation, puis retour à la connexion', (await page.locator('[data-accueil="revoir"]').count()) === 1 && (await (async () => { await page.locator('[data-accueil-ouvrir]').first().click(); await page.waitForTimeout(500); return page.locator('[data-connexion]').count(); })()) === 1);
  ok('aucune erreur (connexion)', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ viewport: { width: 1280, height: 900 } });
  await page.evaluate(() => localStorage.setItem('oenotrack-langue', 'en')); await page.reload(); await page.waitForTimeout(1200);
  await page.click('#tab-intrants'); await page.waitForTimeout(400);
  await page.locator('main [role=tab]', { hasText: 'Labels & specifications' }).click(); await page.waitForTimeout(400);
  await page.locator('[data-labels-vue="so2"]').click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-labels]')); ok('en anglais : « Total SO₂ applied by claim », « Estate maximum total SO₂ »', /Total SO₂ applied by claim/.test(t) && /Estate maximum total SO₂/.test(t), t.slice(0, 300));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t82)'); process.exitCode = ko ? 1 : 0;
