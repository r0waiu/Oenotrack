import { open, pick } from './ui.mjs'; import fs from 'fs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
const log = (...a) => console.log(...a); const top = () => page.locator('.overlay').last();
// 0. logo de l'entreprise
await page.click('#tab-params'); await page.click('main button:has-text("Société & opérateurs")'); await page.waitForTimeout(300);
await page.locator('input[aria-label="Fichier du logo"]').setInputFiles(SH + '/00-home.png'); await page.waitForTimeout(800);
log('logo :', await page.locator('.toast').innerText().catch(() => '-'));
await page.locator('main input[placeholder^="ex. Champagne"]').fill('Champagne Démo'); await page.locator('main textarea').first().click(); await page.waitForTimeout(200);
// 1. prévision de soutirage
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.click('main button:text-is("Soutirage")'); await page.waitForTimeout(400);
log('titre :', await top().locator('h2').first().innerText());
const combos = top().locator('input[role=combobox]');
await pick(page, combos.nth(0), 'Cuve 03', 'Cuve 03'); await page.waitForTimeout(200);
await top().locator('input[inputmode=decimal]').first().fill('10');
await pick(page, combos.nth(1), 'Cuve 09', 'Cuve 09');
await top().locator('button:has-text("Planifier (à réaliser)")').click(); await page.waitForTimeout(400);
log('toast :', await page.locator('.toast').innerText().catch(() => '-'));
// 2. seconde opération planifiée (depuis le menu d'une cuve) puis fiche multiple
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await page.locator('.pitem', { hasText: 'Cuve 01' }).first().click({ button: 'right' }); await page.waitForTimeout(300);
await page.getByRole('menuitem', { name: 'Transfert', exact: true }).click(); await page.waitForTimeout(400);
const c2 = top().locator('input[role=combobox]'); await top().locator('input[inputmode=decimal]').first().fill('5'); await pick(page, c2.nth(1), 'Bac D2', 'Bac D2');
await top().locator('button:has-text("Planifier (à réaliser)")').click(); await page.waitForTimeout(400);
await page.click('#tab-previsions'); await page.waitForTimeout(300);
log('notice :', (await page.locator('main .rounded-md', { hasText: 'Planifier une opération' }).first().innerText()).slice(0, 80));
const rows = await page.locator('main tbody tr').allInnerTexts(); log('prévisions :', rows.map((r) => r.replace(/\s+/g, ' ').slice(0, 120)).join(' || '));
await page.locator('main tbody input[type=checkbox]').nth(0).check(); await page.locator('main tbody input[type=checkbox]').nth(1).check();
await page.click('main button:has-text("Fiche(s) pour la sélection")'); await page.waitForTimeout(600);
log('fiche :', (await top().locator('.fiche').first().innerText()).replace(/\s+/g, ' ').slice(0, 420));
await page.screenshot({ path: SH + '/fiche-dialog.png' });
await page.emulateMedia({ media: 'print' }); await page.screenshot({ path: SH + '/fiche-print.png', fullPage: true }); await page.emulateMedia({ media: 'screen' });
await top().locator('button:has-text("Imprimer")').click().catch(() => {}); await page.waitForTimeout(300);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 3. réaliser la première prévision
await page.locator('main tbody tr').first().locator('button:has-text("Valider…")').click(); await page.waitForTimeout(500);
log('validation :', await top().locator('h2').first().innerText(), '| boutons :', (await top().locator('.sheet-f button').allInnerTexts()).join(' / '));
await top().locator('.sheet-f button:text-is("✓ Valider")').click(); await page.waitForTimeout(500);
log('toast :', await page.locator('.toast').innerText().catch(() => '-'));
await page.click('main button:has-text("Validées")'); await page.waitForTimeout(200);
log('validées :', (await page.locator('main tbody tr').allInnerTexts()).map((r) => r.replace(/\s+/g, ' ').slice(0, 100)).join(' || '));
await page.click('main button:has-text("Fiches imprimées")'); await page.waitForTimeout(200);
log('journal des fiches :', (await page.locator('main tbody tr').allInnerTexts()).map((r) => r.replace(/\s+/g, ' ').slice(0, 100)).join(' || '));
// 4. document joint sur l'opération réalisée
await page.click('#tab-ops'); await page.waitForTimeout(300);
fs.writeFileSync((process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/fiche-remplie.pdf', '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
await page.locator('main tbody tr').first().locator('[data-op-menu]').click(); await page.waitForTimeout(150); await page.locator('main tbody tr').first().locator('button[aria-label^="Documents"]').first().click(); await page.waitForTimeout(300);
await top().locator('input[aria-label="Fichiers à joindre"]').setInputFiles((process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/fiche-remplie.pdf'); await page.waitForTimeout(700);
log('documents :', (await top().locator('.sheet-b').innerText()).replace(/\s+/g, ' ').slice(0, 200));
await page.screenshot({ path: SH + '/docs.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
log('bouton docs :', await page.locator('main tbody tr').first().locator('button[aria-label^="Documents"]').innerText());
// 5. modèle personnalisé
await page.click('#tab-previsions'); await page.click('main button:has-text("Modèles de fiches")'); await page.waitForTimeout(300);
await page.locator('main tr', { hasText: 'Mouvements' }).first().locator('button:has-text("Modifier")').click(); await page.waitForTimeout(400);
await page.screenshot({ path: SH + '/modele-editor.png' });
await top().locator('input').first().fill('Mouvements de cave'); await top().locator('button:has-text("Enregistrer le modèle")').click(); await page.waitForTimeout(300);
log('modèles :', (await page.locator('main tbody tr').allInnerTexts()).map((r) => r.replace(/\s+/g, ' ').slice(0, 60)).join(' || '));
log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
