// Stades / couleurs / échelles : éditeurs, plan par stade, fiche lot (frise + stade suivant), propositions dans les formulaires
import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
const top = () => page.locator('.overlay').last();
const log = (...a) => console.log(...a);
// 1. plan : intérieur par stade
await page.locator('main select[aria-label="Couleur de l’intérieur des contenants"]').selectOption('stade'); await page.waitForTimeout(300);
log('légende stades :', (await page.locator('main .legend').first().innerText()).replace(/\s+/g, ' ').slice(0, 220));
await page.screenshot({ path: SH + '/t23-plan-stade.png' });
await page.locator('main select[aria-label="Couleur de l’intérieur des contenants"]').selectOption('couleur'); await page.waitForTimeout(300);
log('légende couleurs :', (await page.locator('main .legend').first().innerText()).replace(/\s+/g, ' ').slice(0, 200));
await page.locator('main select[aria-label="Couleur de l’intérieur des contenants"]').selectOption('cepage');
// 2. lots : filtre par stade
await page.click('main button:text-is("Lots")'); await page.waitForTimeout(300);
log('stades en stock :', (await page.locator('main [aria-label="Lots en stock par stade"]').innerText()).replace(/\s+/g, ' '));
await page.locator('main [aria-label="Lots en stock par stade"] button', { hasText: 'En FA' }).click(); await page.waitForTimeout(200);
log('lots en FA :', (await page.locator('main tbody tr td:first-child').allInnerTexts()).join(', '));
// 3. fiche lot ROS-26-01 : puces, frise, passage au stade suivant
await page.locator('main [aria-label="Lots en stock par stade"] button', { hasText: 'En FA' }).click();
await page.locator('main tbody tr', { hasText: 'ROS-26-01' }).click(); await page.waitForTimeout(400);
log('fiche :', (await top().locator('.sheet-h').innerText()).replace(/\s+/g, ' '));
log('frise :', (await top().locator('.frise').innerText()).replace(/\s+/g, ' '));
await page.screenshot({ path: SH + '/t23-fiche-lot.png' });
const nxt = top().locator('button', { hasText: '→ ' }).first(); log('bouton :', await nxt.innerText());
await nxt.click(); await page.waitForTimeout(400);
log('formulaire :', await top().locator('h2').innerText(), '| nouveau stade :', await top().locator('select[aria-label="Nouveau stade"]').inputValue());
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
log('toast :', await page.locator('.toast').innerText().catch(() => '-'));
log('stade après :', (await top().locator('.frise li[aria-current="step"]').innerText()).replace(/\s+/g, ' '));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 4. assemblage blanc + rouge : couleur proposée
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.click('main button:text-is("Assemblage")'); await page.waitForTimeout(400);
const cb = top().locator('input[role=combobox]');
await pick(page, cb.nth(0), 'ROU', 'ROU-25'); await top().locator('input[inputmode=decimal]').nth(0).fill('0,2');
await pick(page, cb.nth(1), 'JAR', 'JAR-01'); await top().locator('input[inputmode=decimal]').nth(1).fill('1');
await page.waitForTimeout(300);
log('assemblage → couleur :', await top().locator('select[aria-label="Couleur du vin"]').inputValue(), '| stade :', await top().locator('select[aria-label="Stade du vin"]').inputValue());
log('aide couleur :', (await top().locator('select[aria-label="Couleur du vin"]').locator('xpath=ancestor::label[1]').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 120));
await page.screenshot({ path: SH + '/t23-assemblage.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 5. ajout d'intrants : levure sur un moût débourbé → « En fermentation alcoolique » proposé
await page.click('main button:text-is("Ajout d’intrants")'); await page.waitForTimeout(400);
await pick(page, top().locator('input[role=combobox]').first(), 'Cuve 09', 'M26-01-T1-1');
log('stade avant :', await top().locator('select[aria-label="Stade du lot après l’opération"]').inputValue() || '(inchangé)');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 6. listes : stades / couleurs ; échelles : préréglage Bourgogne
await page.click('#tab-params'); await page.click('main button:has-text("Revendications, stades & listes")'); await page.waitForTimeout(300);
await page.screenshot({ path: SH + '/t23-listes.png', fullPage: false });
await page.locator('main input[aria-label^="Nouveau stade"]').fill('Sur lies'); await page.locator('main input[aria-label^="Nouveau stade"]').press('Enter'); await page.waitForTimeout(200);
log('stades :', (await page.locator('main input[aria-label="Libellé"]').evaluateAll((els) => els.map((e) => e.value))).join(' · '));
await page.click('[data-params-item="profil"]'); await page.click('[data-vignoble] [role=tab]:has-text("Crus")'); await page.waitForTimeout(300);
await page.locator('main details summary').click(); await page.waitForTimeout(200);
await page.locator('main details button', { hasText: 'Bourgogne' }).click(); await page.waitForTimeout(300);
await top().locator('button', { hasText: 'Appliquer' }).click(); await page.waitForTimeout(400);
log('classement :', (await page.locator('main details summary').innerText()).replace(/\s+/g, ' '));
log('KPI :', (await page.locator('main .kpi, main [class*="kpi"]').allInnerTexts().catch(() => [])).slice(0, 6).join(' | ').replace(/\s+/g, ' '));
await page.screenshot({ path: SH + '/t23-echelle.png' });
await page.locator('main details button', { hasText: 'Champagne' }).click(); await top().locator('button', { hasText: 'Appliquer' }).click(); await page.waitForTimeout(300);
log('retour :', (await page.locator('main details summary').innerText()).replace(/\s+/g, ' ').slice(0, 80));
log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
