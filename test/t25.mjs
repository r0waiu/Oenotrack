// Sauvegarde complète : export (base + document + logo) → réinitialisation → import ; anciennes sauvegardes
// (0.17.0-alpha.1 : plus de sauvegarde « en ligne » dans le compte Claude — la capacité « assets » ne doit plus être demandée)
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '';
// window.claude simulé : téléchargements gardés en mémoire, stockage « en ligne » en mémoire (mêmes formes que les définitions de types)
const init = () => {
  const store = []; window.__saved = [];
  const assets = {
    upload: async (blob, o) => { const id = Math.random().toString(16).slice(2).padEnd(32, '0'); const url = URL.createObjectURL(blob); store.push({ id, url, contentType: (o && o.type) || blob.type, sizeBytes: blob.size, createdAt: new Date().toISOString() }); return { id, url, sizeBytes: blob.size, contentType: (o && o.type) || blob.type }; },
    list: async () => ({ assets: store.slice(), usage: { files: store.length, bytes: store.reduce((a, x) => a + x.sizeBytes, 0), maxFiles: 500, maxBytes: 500 * 1048576 } }),
    delete: async (id) => { const i = store.findIndex((x) => x.id === id); if (i >= 0) store.splice(i, 1); return { deleted: i >= 0 }; },
  };
  const downloads = { save: async ({ filename, data }) => { const text = typeof data === 'string' ? data : await data.text(); window.__saved.push({ filename, text }); return { status: 'saved' }; } };
  window.__use = []; window.claude = { use: async (n) => { window.__use.push(n); return n === 'assets' ? assets : n === 'downloads' ? downloads : null; } };
};
const { browser, page, errors } = await open({ init });
const top = () => page.locator('.overlay').last(); const log = (...a) => console.log(...a);
log('en-tête :', (await page.locator('header .hdr-actions').innerText()).replace(/\s+/g, ' '));
log('pied :', (await page.locator('footer').innerText()).replace(/\s+/g, ' '));
// document joint + logo
fs.writeFileSync(SC + '/fiche-remplie.pdf', '%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF');
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.locator('main tbody tr').first().locator('[data-op-menu]').click(); await page.waitForTimeout(150); await page.locator('main tbody tr').first().locator('button[aria-label^="Documents"]').first().click(); await page.waitForTimeout(300);
await top().locator('input[aria-label="Fichiers à joindre"]').setInputFiles(SC + '/fiche-remplie.pdf'); await page.waitForTimeout(600);
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// page Sauvegarde : statut via la puce de l'en-tête
await page.locator('header button', { hasText: 'Aucune sauvegarde' }).click(); await page.waitForTimeout(500);
await page.screenshot({ path: SC + '/shots/t25-sauvegarde.png' });
await page.locator('main button', { hasText: 'Exporter la base complète' }).first().click(); await page.waitForTimeout(1200);
const saved = await page.evaluate(() => window.__saved.map((x) => ({ filename: x.filename, size: x.text.length, head: JSON.parse(x.text) })).map((x) => ({ filename: x.filename, size: x.size, format: x.head.format, v: x.head.appVersion, contenu: x.head.contenu, fichiers: x.head.fichiers.map((f) => f.nom) })));
log('export :', JSON.stringify(saved));
const text = await page.evaluate(() => window.__saved[0].text); fs.writeFileSync(SC + '/sauvegarde-complete.json', text);
log('puce après export :', await page.locator('header button', { hasText: 'Sauvegardé' }).innerText());
// plus de sauvegarde en ligne (0.17.0-alpha.1)
log('section en ligne absente :', (await page.locator('main', { hasText: 'avec cette page' }).count()) === 0 && (await page.locator('main button', { hasText: 'en ligne maintenant' }).count()) === 0 ? '✓' : '✗ ÉCHEC');
// réinitialisation à vide puis import du fichier complet
await page.locator('main button', { hasText: 'Réinitialiser à vide' }).click(); await top().locator('button', { hasText: 'Tout effacer' }).click(); await page.waitForTimeout(500);
await page.evaluate(async () => { for (const k of await docKeys()) await docDel(k); });
log('après remise à zéro :', (await page.locator('main .card').first().innerText()).replace(/\s+/g, ' ').slice(0, 120));
await page.locator('input[aria-label="Fichier de sauvegarde à importer"]').setInputFiles(SC + '/sauvegarde-complete.json'); await page.waitForTimeout(800);
log('confirmation :', (await top().innerText()).replace(/\s+/g, ' ').slice(0, 330));
await top().locator('button', { hasText: 'Restaurer' }).last().click(); await page.waitForTimeout(1000);
log('restauré :', (await page.locator('main .card').first().innerText()).replace(/\s+/g, ' ').slice(0, 160));
log('fichiers IndexedDB :', await page.evaluate(async () => (await docKeys()).length), '| logo :', await page.evaluate(() => !!JSON.parse(localStorage.getItem('oenotrack-db-v2')).entreprise.logo));
log('capacité assets jamais demandée :', (await page.evaluate(() => window.__use.includes('assets'))) ? '✗ ÉCHEC' : '✓');
// ancienne sauvegarde (base seule 0.7.0-alpha.1) : import direct
await page.locator('input[aria-label="Fichier de sauvegarde à importer"]').setInputFiles(new URL('./fixtures/base-0.7.0-alpha.1-exemple.json', import.meta.url).pathname); await page.waitForTimeout(600);
log('ancienne base :', (await top().innerText()).replace(/\s+/g, ' ').slice(0, 260));
await top().locator('button', { hasText: 'Restaurer' }).last().click(); await page.waitForTimeout(800);
log('lots après import 0.7.0-alpha.1 :', await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')).lots.length), '| version :', await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')).meta.versions.join(',')));
// fenêtre « Nouveautés »
await page.locator('footer button', { hasText: 'Œnotrack' }).click(); await page.waitForTimeout(300);
log('nouveautés :', (await top().innerText()).replace(/\s+/g, ' ').slice(0, 200));
log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
