// Parcelles (registre, création, apport → cru déduit, traçabilité) ; cartouche des fiches modifiable
import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
const top = () => page.locator('.overlay').last(); const log = (...a) => console.log(...a);
// 1. registre des parcelles
await page.click('#tab-params'); await page.click('main button:has-text("Crus & parcelles")'); await page.waitForTimeout(300);
await page.locator('main button', { hasText: 'Parcelles ·' }).click(); await page.waitForTimeout(300);
log('parcelles :', (await page.locator('main tbody tr').allInnerTexts()).map((r) => r.replace(/\s+/g, ' ').slice(0, 90)).join(' || '));
await page.locator('main button', { hasText: '+ Nouvelle parcelle' }).click(); await page.waitForTimeout(300);
await top().locator('input').first().fill('Le Clos du Puits');
await pick(page, top().locator('input[aria-label="Cru (village)"]'), 'Ambo', 'Ambonnay');
await top().locator('input[inputmode=decimal]').first().fill('18,4');
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(300);
log('toast :', await page.locator('.toast').innerText().catch(() => '-'));
await page.screenshot({ path: SH + '/t26-parcelles.png' });
// 2. apport : la parcelle renseigne le cru, le cépage et l'apporteur
await page.click('#tab-pressoir'); await page.waitForTimeout(300);
await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(400);
await pick(page, top().locator('input[aria-label="Parcelle"]'), 'Chéti', 'Les Chétillons');
log('apport → cru :', await top().locator('input[aria-label="Cru (village)"]').inputValue(), '| apporteur :', await top().locator('input[aria-label="Partenaire"]').inputValue());
await top().locator('[data-netkg]').fill('32');
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
log('ticket après la pesée :', (await top().innerText()).replace(/\s+/g, ' ').slice(0, 60)); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
log('journal :', (await page.locator('main tbody tr').first().innerText()).replace(/\s+/g, ' ').slice(0, 140));
// 3. traçabilité par parcelle
await page.click('#tab-trace'); await page.waitForTimeout(300);
await page.locator('main button', { hasText: 'Parcelle' }).first().click(); await page.waitForTimeout(200);
await pick(page, page.locator('main input[aria-label="Parcelle"]'), 'Cray', 'Les Crayères'); await page.waitForTimeout(300);
log('trace parcelle :', (await page.locator('main tbody tr td:first-child').allInnerTexts()).slice(0, 8).join(', '));
// 4. cartouche des fiches
await page.click('#tab-previsions'); await page.waitForTimeout(200); await page.locator('main button', { hasText: 'Modèles de fiches' }).click(); await page.waitForTimeout(300);
await page.locator('main button', { hasText: /Personnaliser|Modifier/ }).first().click(); await page.waitForTimeout(400);
const v = top().locator('input[aria-label="Libellé de la ligne 1 du cartouche"]'); await v.fill('Indice');
await top().locator('button', { hasText: '+ Ligne libre' }).click(); await page.waitForTimeout(100);
await top().locator('input[aria-label="Valeur de la ligne 5 du cartouche"]').fill('ENR-CUV-07');
await top().locator('input[aria-label="Valeur de la ligne 1 du cartouche"]').fill('3');
log('aperçu cartouche :', (await top().locator('.fiche .fh-ver').first().innerText()).replace(/\s+/g, ' '));
await page.screenshot({ path: SH + '/t26-cartouche.png' });
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(300);
log('toast :', await page.locator('.toast').innerText().catch(() => '-'));
log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
