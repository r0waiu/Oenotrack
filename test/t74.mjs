// 0.38.0-alpha.3 : audit — un seul onglet actif (écran de blocage, « Reprendre la main ici »), rôle explicite des fractions du pressoir
// (proposé d'après le nom, modifiable), SO₂ total estimé du lot fini, défilement rendu après la fermeture de plusieurs fiches.
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 600) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const { browser, page, errors, ctx } = await open({ https: true, viewport: { width: 1360, height: 950 } });
const db = (p) => (p || page).evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));

// 1. onglet unique : un second onglet est bloqué, n'écrit rien ; « Reprendre la main ici » bloque le premier et recharge le second
ok('premier onglet actif (application affichée)', (await page.locator('#tab-params').count()) === 1 && (await page.locator('[data-onglet="bloque"]').count()) === 0);
const err2 = []; const p2 = await ctx.autreOnglet(err2);
await p2.goto('https://app.test/'); await p2.waitForTimeout(1800);
ok('second onglet : « Œnotrack est déjà ouvert dans un autre onglet », application non chargée', (await p2.locator('[data-onglet="bloque"]').count()) === 1 && /déjà ouvert dans un autre onglet/i.test(await txt(p2.locator('body'))) && (await p2.locator('#tab-params').count()) === 0);
await p2.screenshot({ path: `${SC}/shots/t74-bloque.png` });
// une saisie dans le premier onglet, puis reprise dans le second : il relit la base à jour
await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Revendications, stades' }).click(); await page.waitForTimeout(500);
const nv = page.locator('input[aria-label="Nouvelle fraction"]');
await nv.fill('Taille de presse'); await page.waitForTimeout(150);
ok('rôle proposé d’après le nom (« Taille de presse » → Taille)', (await page.locator('select[aria-label="Rôle de la nouvelle fraction"]').inputValue()) === 'taille');
await nv.fill('Vin de goutte'); await page.waitForTimeout(100);
ok('… nom changé : proposition suivie (autre)', (await page.locator('select[aria-label="Rôle de la nouvelle fraction"]').inputValue()) === 'autre');
await page.locator('select[aria-label="Rôle de la nouvelle fraction"]').selectOption('cuvee'); await nv.fill('Vin de goutte fin'); await page.waitForTimeout(100);
ok('… rôle choisi à la main : gardé quand le nom change', (await page.locator('select[aria-label="Rôle de la nouvelle fraction"]').inputValue()) === 'cuvee');
await nv.locator('xpath=..').locator('button', { hasText: '+ Ajouter' }).click(); await page.waitForTimeout(600);
let d1 = await db(); const fG = d1.lists.fractions.find((f) => f.label === 'Vin de goutte fin');
ok('fraction ajoutée avec son rôle (cuvée)', !!fG && fG.role === 'cuvee');
await page.locator(`select[aria-label="Rôle de la fraction (Vin de goutte fin)"]`).selectOption('rebeche'); await page.waitForTimeout(500);
d1 = await db(); ok('rôle modifié dans la liste (rebêche)', d1.lists.fractions.find((f) => f.label === 'Vin de goutte fin').role === 'rebeche');
ok('fractions par défaut : rôles déduits (Cuvée, Taille, Rebêche, Lies)', (await page.locator('select[aria-label="Rôle de la fraction (Cuvée)"]').inputValue()) === 'cuvee' && (await page.locator('select[aria-label="Rôle de la fraction (Taille)"]').inputValue()) === 'taille' && (await page.locator('select[aria-label="Rôle de la fraction (Rebêche)"]').inputValue()) === 'rebeche' && (await page.locator('select[aria-label="Rôle de la fraction (Lies)"]').inputValue()) === 'autre');
await page.waitForTimeout(400);
await p2.locator('button', { hasText: 'Reprendre la main ici' }).click(); await p2.waitForTimeout(3500);
ok('« Reprendre la main ici » : le second onglet se recharge et s’ouvre', (await p2.locator('#tab-params').count()) === 1 && (await p2.locator('[data-onglet="bloque"]').count()) === 0);
ok('… le premier onglet est bloqué (plus d’application)', (await page.locator('[data-onglet="bloque"]').count()) === 1 && (await page.locator('#tab-params').count()) === 0);
const d2 = await db(p2); ok('… la saisie du premier onglet est relue (base à jour)', d2.lists.fractions.some((f) => f.label === 'Vin de goutte fin' && f.role === 'rebeche'));
// le premier onglet bloqué n'écrit plus rien
const avant = await p2.evaluate(() => localStorage.__brut('oenotrack-db-v2'));
await page.waitForTimeout(800); ok('… onglet bloqué : la base n’est plus réécrite', (await p2.evaluate(() => localStorage.__brut('oenotrack-db-v2'))) === avant);
// et il peut reprendre la main à son tour
await page.locator('button', { hasText: 'Reprendre la main ici' }).click(); await page.waitForTimeout(3500);
ok('reprise dans l’autre sens : premier onglet rouvert, second bloqué', (await page.locator('#tab-params').count()) === 1 && (await p2.locator('[data-onglet="bloque"]').count()) === 1);
await p2.close();

// 2. lot fini : SO₂ total estimé (lot de tirage + liqueur d'expédition)
const fin = (await db()).lotsFinis[0];
await page.click('#tab-degorgement'); await page.waitForTimeout(500);
await page.locator('main tbody tr', { hasText: fin.code }).first().click(); await page.waitForTimeout(600);
ok('fiche du lot fini : SO₂ total estimé (lot de tirage + liqueur d’expédition)', (await page.locator(`[data-so2-estime="${fin.id}"]`).count()) === 1 && /SO₂ total estimé \(lot de tirage \+ liqueur/.test(await txt(page.locator('.overlay').last())));

// 3. plusieurs fiches ouvertes l'une sur l'autre puis fermées ensemble : la page défile de nouveau
await page.locator('.overlay').last().locator('dd .linkish').first().click(); await page.waitForTimeout(600);
const nFiches = await page.locator('.overlay').count();
ok('deux fiches ouvertes l’une sur l’autre (lot fini, lot de tirage), défilement de la page bloqué', nFiches >= 2 && (await page.evaluate(() => document.body.style.overflow)) === 'hidden', nFiches);
await page.evaluate(() => document.querySelector('#tab-params').click()); // changement d'onglet : toutes les fiches se ferment ensemble
await page.waitForTimeout(500);
ok('… toutes fermées : la page défile de nouveau', (await page.locator('.overlay').count()) === 0 && (await page.evaluate(() => document.body.style.overflow)) === '', [await page.locator('.overlay').count(), await page.evaluate(() => document.body.style.overflow)]);

ok('aucune erreur dans la page', !errors.length && !err2.length, [...errors, ...err2]);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT');
process.exitCode = ko ? 1 : 0;
