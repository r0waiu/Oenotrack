// Impression du plan de cave : dialogue, options de légende, PDF
import { open } from './ui.mjs'; import fs from 'fs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '';
fs.mkdirSync(SH + '/pdf', { recursive: true }); fs.mkdirSync(SH + '/shots', { recursive: true });
const { browser, page, errors } = await open();
await page.click('button:has-text("Imprimer le plan")'); await page.waitForTimeout(500);
const top = page.locator('.overlay').last();
console.log('pages:', await top.locator('.planpage').count());
await top.locator('label:has-text("Cépages (%)") input').check();
await top.locator('label:has-text("Millésime(s)") input').check();
await top.locator('label:has-text("Tableau des contenants") input').check();
await page.waitForTimeout(300);
console.log('pages après tableau:', await top.locator('.planpage').count());
await page.screenshot({ path: SH + '/shots/t20-dialog.png' });
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), top.locator('button:has-text("Imprimer (PDF)")').click()]);
await dl.saveAs(SH + '/pdf/plan.pdf'); console.log('PDF :', fs.statSync(SH + '/pdf/plan.pdf').size, 'octets');
// portrait + échelle
await top.locator('select').first().selectOption('portrait');
await top.locator('label:has-text("Tableau des contenants") input').uncheck();
const sel = top.locator('select'); for (let i = 0; i < await sel.count(); i++) { const o = await sel.nth(i).locator('option').allTextContents(); if (o.includes('l’échelle des crus')) await sel.nth(i).selectOption('echelle'); }
await page.waitForTimeout(300);
const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), top.locator('button:has-text("Imprimer (PDF)")').click()]);
await dl2.saveAs(SH + '/pdf/plan-portrait.pdf'); console.log('PDF portrait :', fs.statSync(SH + '/pdf/plan-portrait.pdf').size, 'octets');
console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
