import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
const log = (...a) => console.log(...a);
// ouvrir l'entrée de moûts depuis le menu d'une cuve vide (Bac D1)
const tile = page.locator('.pitem', { hasText: 'Bac D1' }).first();
await tile.click({ button: 'right' }); await page.waitForTimeout(250);
await page.locator('[role=menuitem]', { hasText: /moût/i }).first().click(); await page.waitForTimeout(400);
const sh = page.locator('.overlay').last();
await sh.locator('input[placeholder="ex. AB-123-CD"]').fill('ab-123-cd');
// moût 1 : C1 Chardonnay cuvée Avize, 1500 L → Bac D1 1000 + Bac D2 500
await sh.locator('[aria-label="Compartiment du moût 1"]').fill('C1');
await pick(page, sh.locator('input[aria-label="Cru (village)"]').nth(0), 'Aviz', 'Avize');
await sh.locator('[aria-label="Volume vers la cuve 1 du moût 1"]').fill('10');
await sh.locator('button:has-text("＋ Répartir sur une autre cuve")').first().click();
await pick(page, sh.locator('input[aria-label="Cuve de destination 2 du moût 1"]'), 'Bac D2', 'Bac D2');
await sh.locator('[aria-label="Volume vers la cuve 2 du moût 1"]').fill('5');
// moût 2 : C2 Pinot Noir taille, Bouzy, Bio → Bac D1 300 (mélange)
await sh.locator('button:has-text("＋ Ajouter un moût")').click(); await page.waitForTimeout(150);
await sh.locator('[aria-label="Compartiment du moût 2"]').fill('C2');
await sh.locator('[aria-label="Cépage du moût 2"]').selectOption({ label: 'Pinot noir' });
await sh.locator('[aria-label="Fraction du moût 2"]').selectOption({ label: 'Taille' });
await sh.locator('[aria-label="Revendication du moût 2"]').selectOption('bio');
await pick(page, sh.locator('input[aria-label="Cru (village)"]').nth(1), 'Bouz', 'Bouzy');
await pick(page, sh.locator('input[aria-label="Cuve de destination 1 du moût 2"]'), 'Bac D1', 'Bac D1');
await sh.locator('[aria-label="Volume vers la cuve 1 du moût 2"]').fill('3');
await page.waitForTimeout(300);
const lots = await sh.locator('text=/Lots créés/').locator('..').innerText(); log('plan:', lots.replace(/\n/g, ' | ').slice(0, 700));
await page.screenshot({ path: SH + '/mout-multi.png', fullPage: false });
await sh.locator('.sheet-b').evaluate((el) => el.closest('.overlay').scrollTo(0, 99999)); await page.waitForTimeout(200);
await page.screenshot({ path: SH + '/mout-multi-bas.png' });
log('aperçu:', (await sh.locator('[role=alert], .rounded-md.px-3').last().innerText()).replace(/\n/g, ' | ').slice(0, 300));
await sh.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
log('toast:', await page.locator('.toast').innerText().catch(() => '-'));
// 0.31.0-alpha.1 : schéma de vinification proposé aux lots créés (moûts de Chardonnay cuvée) → « Plus tard »
log('schéma proposé :', await page.locator('[data-plan-feuille]').count(), (await page.locator('[data-plan-lot] select[aria-label^="Plan du lot"]').evaluateAll((L) => L.map((x) => x.options[x.selectedIndex].text))).join(' / '));
if (await page.locator('[data-plan-feuille]').count()) { await page.locator('.overlay').last().locator('.sheet-f button', { hasText: 'Plus tard' }).click(); await page.waitForTimeout(300); }
for (const n of ['Bac D1', 'Bac D2']) log(n, '→', (await page.locator('.pitem', { hasText: n }).first().innerText()).replace(/\n/g, ' | '));
// réouvrir l'entrée d'exemple en modification depuis l'onglet Opérations
await page.click('#tab-ops'); await page.waitForTimeout(400);
const row = page.locator('tr', { hasText: 'GH-482-KT' }).first(); log('ligne journal:', (await row.innerText()).replace(/\s+/g, ' ').slice(0, 260));
log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
