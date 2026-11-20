import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
const log = (...a) => console.log(...a);
// 1. clic droit
const tile = page.locator('.pitem', { hasText: 'Cuve 03' }).first();
await tile.click({ button: 'right' }); await page.waitForTimeout(300);
await page.screenshot({ path: SH + '/menu.png' });
log('menu:', (await page.locator('[role=menu]').first().innerText().catch(() => 'PAS DE MENU')).replace(/\n/g, ' | ').slice(0, 400));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.waitForTimeout(900);
// 2. fiche cuve puis lot → lot au premier plan
await tile.click(); await page.waitForTimeout(400);
const titles = async () => page.$$eval('.sheet-h h2', (h) => h.map((x) => x.innerText.split('\n')[0]));
log('fiches après clic cuve:', await titles());
await page.screenshot({ path: SH + '/contsheet.png', fullPage: false });
await page.locator('.overlay').last().locator('.linkish').first().click(); await page.waitForTimeout(400);
const z = await page.$$eval('.overlay', (o) => o.map((x) => [x.querySelector('h2').innerText.split('\n')[0], getComputedStyle(x).zIndex]));
log('pile:', JSON.stringify(z));
await page.screenshot({ path: SH + '/stack.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(200); await page.keyboard.press('Escape'); await page.waitForTimeout(200);
log('fiches restantes:', await titles());
// 3. plan : déverrouiller, glisser
await page.click('text=🔓 Modifier le plan'); await page.waitForTimeout(200);
const b = await tile.boundingBox();
await page.mouse.move(b.x + 20, b.y + 20); await page.mouse.down(); await page.mouse.move(b.x + 120, b.y + 60, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(300);
const b2 = await tile.boundingBox(); log('déplacement:', Math.round(b2.x - b.x), Math.round(b2.y - b.y));
await page.click('text=🔒 Verrouiller le plan'); await page.waitForTimeout(200);
log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
