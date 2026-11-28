// 0.12.0-alpha.1 : base d'une version précédente (sans opérateurs) — premier opérateur créé depuis une opération, anciens noms d'hygiène
import fs from 'fs';
import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const fx = JSON.parse(fs.readFileSync(new URL('./fixtures/base-0.9.0-alpha.1-exemple.json', import.meta.url), 'utf8'));
const db0 = fx.format === 'oenotrack-sauvegarde' ? fx.db : fx; db0.meta.exemple = false;
const init = { content: `if (!sessionStorage.getItem('semee')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(db0))}); sessionStorage.setItem('semee', '1'); }` };
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗', name, x !== undefined ? `→ ${String(x).replace(/\s+/g, ' ').slice(0, 170)}` : ''); };
const { browser, page, errors } = await open({ init });
const top = () => page.locator('.overlay').last();
ok('base 0.9.0-alpha.1 ouverte, aucun opérateur : pas de « Qui saisit ? »', (await page.locator('[data-operateur-appareil]').count()) === 0 && (await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')).operateurs.length)) === 0);
// hygiène : le nom écrit à la main par l'ancienne version reste affiché
await page.click('#tab-hygiene'); await page.waitForTimeout(300);
const hy = await page.locator('main tbody').innerText();
ok('hygiène : anciens noms écrits à la main affichés', hy.includes('Équipe cave'), hy.slice(0, 120));
await page.locator('main tbody tr').first().locator('button:text-is("Modifier")').click(); await page.waitForTimeout(300);
ok('hygiène : ancien nom rappelé dans le formulaire', (await top().innerText()).includes('Saisi auparavant : « Équipe cave »'));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// opération : liste vide → « + Ajouter un opérateur » → créé et choisi, le formulaire de l'opération reste ouvert
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.click('main button:text-is("Jaugeage")'); await page.waitForTimeout(400);
ok('opération : liste vide expliquée', (await top().innerText()).includes('Aucun opérateur dans la liste de la société'));
await top().locator('button:text-is("＋ Ajouter un opérateur")').click(); await page.waitForTimeout(300);
const f = top(); await f.locator('input').nth(0).fill('Camille'); await f.locator('input').nth(1).fill('Noël'); await f.locator('input').nth(2).fill('Caviste');
await f.locator('input').nth(1).press('Enter'); await page.waitForTimeout(400); // Entrée : enregistre l'opérateur, pas l'opération
const t = await top().innerText();
ok('opérateur créé depuis l’opération, choisi, opération toujours ouverte', t.includes('Nouvelle opération') && (await top().locator('.opr-tog[aria-pressed="true"]', { hasText: 'Camille Noël' }).count()) === 1, t.slice(0, 90));
ok('aucune opération enregistrée par erreur', (await page.locator('.toast').innerText().catch(() => '')).includes('Opérateur ajouté'), await page.locator('.toast').innerText().catch(() => ''));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
ok('en-tête : « Qui saisit ? » apparaît avec le premier opérateur', (await page.locator('[data-operateur-appareil]').innerText()).includes('Qui saisit'));
const sv = await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
ok('base enregistrée : 1 opérateur, rien d’autre de changé', sv.operateurs.length === 1 && sv.ops.length === db0.ops.length && sv.hygiene.length === db0.hygiene.length);
await page.screenshot({ path: SH + '/t31.png' });
console.log('ERREURS:', errors.join(' | ') || 'aucune'); if (errors.length) ko++;
await browser.close();
console.log(ko ? `${ko} ÉCHEC(S)` : 'T31 OK');
