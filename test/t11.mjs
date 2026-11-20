import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
const log = (...a) => console.log(...a);
// apport de vendange : cru par autocomplétion « Lou » → Louvois
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.locator('main button', { hasText: 'Apport vendange' }).first().click(); await page.waitForTimeout(400);
const sh = page.locator('.overlay').last();
const cru = sh.locator('input[aria-label="Cru (village)"]');
await cru.click(); await cru.fill('Lou'); await page.waitForTimeout(200);
log('propositions « Lou » :', (await sh.locator('[role=option]').allInnerTexts()).map((x) => x.replace(/\n/g, ' ')).join(' | '));
await page.screenshot({ path: SH + '/combo-lou.png' });
await page.keyboard.press('Enter'); await page.waitForTimeout(150);
log('valeur après Entrée :', await cru.inputValue());
// apporteur : création depuis la saisie
const ap = sh.locator('input[aria-label="Partenaire"]'); await ap.click(); await ap.fill('Domaine Test'); await page.waitForTimeout(150);
log('apporteur, option création :', await sh.locator('.combo-new').innerText().catch(() => '-'));
await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// paramètres : masquer tous les « Autres » crus, puis vérifier la liste de saisie
await page.click('#tab-params'); await page.click('main button:has-text("Crus & parcelles")'); await page.waitForTimeout(300);
await page.click('main button:has-text("Autres")'); await page.waitForTimeout(200);
await page.locator('main button', { hasText: /Masquer les \d+ crus affichés/ }).click(); await page.waitForTimeout(300);
log('après masquage :', (await page.locator('main .card').first().innerText()).replace(/\n/g, ' '), '|', await page.locator('.toast').innerText().catch(() => ''));
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.locator('main button', { hasText: 'Apport vendange' }).first().click(); await page.waitForTimeout(400);
const cru2 = page.locator('.overlay').last().locator('input[aria-label="Cru (village)"]'); await cru2.click(); await cru2.fill('Epern'); await page.waitForTimeout(150);
log('« Epern » (Épernay masqué) :', (await page.locator('.overlay').last().locator('.combo-list').innerText()).replace(/\n/g, ' '));
await cru2.fill('Cram'); await page.waitForTimeout(150);
log('« Cram » :', (await page.locator('.overlay').last().locator('[role=option]').allInnerTexts()).join(' | ').replace(/\n/g, ' '));
// contenant (liste longue → autocomplétion) dans un transfert
await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.locator('main button', { hasText: 'Transfert' }).first().click(); await page.waitForTimeout(400);
const comboCount = await page.locator('.overlay').last().locator('input[role=combobox]').count();
log('champs à autocomplétion dans le transfert :', comboCount);
log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
