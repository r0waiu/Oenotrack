import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
const log = (...a) => console.log(...a);
// 1. entrée de moûts depuis le menu d'une cuve vide
const empty = page.locator('.pitem', { hasText: '0 /' }).first();
await empty.click({ button: 'right' }); await page.waitForTimeout(250);
await page.locator('[role=menuitem]', { hasText: /moût/i }).first().click(); await page.waitForTimeout(400);
const sh = page.locator('.overlay').last();
const fracSel = sh.locator('[aria-label="Fraction du moût 1"]');
log('fraction par défaut:', await fracSel.inputValue(), '| options:', (await fracSel.locator('option').allInnerTexts()).join(' / '));
await pick(page, sh.locator('input[aria-label="Cru (village)"]').first(), 'Cumi', 'Cumières');
await sh.locator('[aria-label="Volume vers la cuve 1 du moût 1"]').fill('4,5');
// 2. personnaliser depuis le formulaire : ajouter « Vin de presse »
await sh.locator('text=Personnaliser les fractions').click(); await page.waitForTimeout(300);
const dlg = page.locator('.overlay').last();
await dlg.locator('input[aria-label="Nouvelle fraction"]').fill('Vin de presse'); await dlg.locator('input[aria-label="Suffixe"]').fill('vp');
await dlg.locator('button:has-text("＋ Ajouter")').click(); await page.waitForTimeout(300);
await dlg.locator('button:has-text("Terminé")').click(); await page.waitForTimeout(300);
await fracSel.selectOption({ label: 'Vin de presse' }); await page.waitForTimeout(150);
log('code proposé:', await sh.locator('[aria-label^="Code du lot en"]').first().getAttribute('placeholder'));
await sh.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
log('toast:', await page.locator('.toast').innerText().catch(() => '-'));
// 3. fiche du lot créé
const tile = page.locator('.pitem', { hasText: /M26-\d+-VP/ }).first(); log('tuile créée:', await tile.count());
await page.waitForTimeout(900); await tile.click(); await page.waitForTimeout(400);
await page.locator('.overlay').last().locator('.linkish', { hasText: /M26/ }).first().click(); await page.waitForTimeout(400);
await page.screenshot({ path: SH + '/lot-fraction.png' });
log('fiche lot:', (await page.locator('.overlay').last().innerText()).slice(0, 260).replace(/\n/g, ' | '));
await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 4. pressurage (onglet Pressoir › Pressurages, 0.26.0-alpha.2) : seules les fractions « au pressurage »
await page.click('#tab-pressoir'); await page.waitForTimeout(300); await page.locator('[data-pressoir] [role=tab]', { hasText: 'Pressurages' }).click(); await page.waitForTimeout(300);
await page.locator('[data-nouveau-marc]').click(); await page.waitForTimeout(400);
log('pressurage:', (await page.locator('.overlay').last().locator('input[aria-label^="Volume "]').evaluateAll((e) => e.map((x) => x.getAttribute('aria-label')))).join(' / '));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// 5. registres › listes
await page.click('#tab-params'); await page.click('main button:has-text("Revendications, stades & listes")'); await page.waitForTimeout(300);
await page.screenshot({ path: SH + '/listes-fractions.png' });
log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
