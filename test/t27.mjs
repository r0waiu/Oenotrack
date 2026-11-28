// 0.9.0-alpha.1 : hL, catalogue d'opérations (panneau, formulaire, création + fiche), stade automatique, mélanges, sorties, menu cuve
import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const { browser, page, errors } = await open();
const top = () => page.locator('.overlay').last();
const log = (...a) => console.log(...a);
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; log(c ? '✓' : '✗', name, x !== undefined ? `→ ${x}` : ''); };
// 1. plan : volumes en hL
const tile = (await page.locator('.pitem', { hasText: 'Cuve 01' }).first().innerText()).replace(/\s+/g, ' ');
ok('plan en hL (2 décimales)', /\d+,\d{2}\s*hL/.test(tile) && !/\d L\b/.test(tile), tile.slice(0, 90));
// 2. onglet Opérations : panneau par groupes du catalogue
await page.click('#tab-ops'); await page.waitForTimeout(300);
const grp = await page.locator('main [data-groupe]').evaluateAll((els) => els.map((e) => e.getAttribute('data-groupe')));
ok('panneau : 6 groupes', grp.length === 6, grp.join(' | '));
const nb = await page.locator('main [data-groupe] button').count(); ok('panneau : opérations proposées (masquées exclues)', nb >= 40 && !(await page.locator('main [data-groupe] button', { hasText: 'Délestage' }).count()), nb);
await page.screenshot({ path: SH + '/t27-panneau.png' });
// 3. levurage : formulaire de la variante, stade automatique « En FA » proposé sur un moût débourbé
await page.locator('main [data-groupe] button', { hasText: 'Levurage' }).click(); await page.waitForTimeout(400);
ok('levurage : titre', (await top().locator('h2').innerText()).includes('Levurage'));
ok('levurage : objet pré-rempli', (await top().locator('input[placeholder^="Levurage, sulfitage"]').inputValue()) === 'Levurage');
await pick(page, top().locator('input[role=combobox]').first(), 'Cuve 09', 'M26-01-T1-1'); await page.waitForTimeout(200);
const st = await top().locator('select[aria-label="Stade du lot après l’opération"]').inputValue();
const help = (await top().locator('select[aria-label="Stade du lot après l’opération"]').locator('xpath=ancestor::label[1]').innerText()).replace(/\s+/g, ' ');
ok('levurage : stade auto « fa »', st === 'fa', `${st} · ${help.slice(0, 110)}`);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 4. soutirage d'un lot en FA : pas de « vin soutiré » (seulement après la FA)
await page.locator('main [data-groupe] button', { hasText: /^.?\s*Soutirage$/ }).first().click(); await page.waitForTimeout(400);
await pick(page, top().locator('input[role=combobox]').first(), 'Cuve 08', 'M26-01-C'); await page.waitForTimeout(200);
ok('soutirage pendant la FA : stade inchangé', (await top().locator('select[aria-label="Stade du lot après l’opération"]').inputValue()) === '');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.locator('main [data-groupe] button', { hasText: /^.?\s*Soutirage$/ }).first().click(); await page.waitForTimeout(400);
await pick(page, top().locator('input[role=combobox]').first(), 'Cuve B1', 'P26-04-C'); await page.waitForTimeout(200);
ok('soutirage après la FA : « vin soutiré » proposé', (await top().locator('select[aria-label="Stade du lot après l’opération"]').inputValue()) === 'vin_soutire');
ok('soutirage : volume pré-rempli en hL', (await top().locator('input[inputmode=decimal]').first().inputValue()) === '19,95', await top().locator('input[inputmode=decimal]').first().inputValue());
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 5. regroupement : vin filtré + vin clair → vin clair (règle de mélange)
await page.locator('main [data-groupe] button', { hasText: 'Regroupement de cuves' }).click(); await page.waitForTimeout(400);
const cb = top().locator('input[role=combobox]');
await pick(page, cb.nth(0), 'Cuve 01', 'RG26-02'); await page.waitForTimeout(150);
await pick(page, cb.nth(1), 'Jarre', 'JAR-01'); await page.waitForTimeout(250);
const sr = await top().locator('select[aria-label="Stade du vin"]').inputValue(); const hs = (await top().locator('select[aria-label="Stade du vin"]').locator('xpath=ancestor::label[1]').innerText()).replace(/\s+/g, ' ');
ok('regroupement : stade = règle de mélange (pas « assemblé »)', sr === 'vin_clair', `${sr} · ${hs.slice(0, 120)}`);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 6. sortie de cave : formulaire, contrôle du volume, enregistrement
await page.locator('main [data-groupe] button', { hasText: 'Vente de vin en vrac' }).click(); await page.waitForTimeout(400);
await pick(page, top().locator('input[role=combobox]').first(), 'Cuve 10', 'AS25-02'); await page.waitForTimeout(200);
const vs = top().locator('input[inputmode=decimal]').first(); ok('sortie : stock proposé en hL', (await vs.inputValue()) === '26,95', await vs.inputValue());
await vs.fill('40'); await page.waitForTimeout(200); ok('sortie : volume > stock refusé', (await top().innerText()).includes('Volume supérieur au stock'));
await vs.fill('5'); await top().locator('input[placeholder^="ex. Distillerie"]').fill('Négoce Martin'); await top().locator('input[aria-label]').filter({ hasText: '' }).first();
await page.screenshot({ path: SH + '/t27-sortie.png' });
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('sortie : enregistrée', (await page.locator('main tbody tr').first().innerText()).includes('Vente de vin en vrac'), (await page.locator('main tbody tr').first().innerText()).replace(/\s+/g, ' ').slice(0, 120));
// 7. menu d'une cuve : raccourcis du catalogue + autres opérations
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await page.locator('.pitem', { hasText: 'Cuve 03' }).first().click({ button: 'right' }); await page.waitForTimeout(300);
const mi = await page.locator('.ctxmenu .mi').allInnerTexts(); ok('menu : raccourcis (levurage, sulfitage, suivi, vente)', ['Levurage', 'Sulfitage', 'Suivi de fermentation', 'Vente de vin en vrac'].every((x) => mi.some((m) => m.includes(x))), mi.length);
await page.locator('.ctxmenu .mi', { hasText: 'Autres opérations' }).click(); await page.waitForTimeout(200);
const mi2 = await page.locator('.ctxmenu .mi').allInnerTexts(); ok('menu : toutes les opérations sur une cuve', mi2.some((m) => m.includes('Bâtonnage')) && mi2.some((m) => m.includes('Collage')), mi2.length);
await page.screenshot({ path: SH + '/t27-menu.png' });
await page.locator('.ctxmenu .mi', { hasText: 'Suivi de fermentation' }).click(); await page.waitForTimeout(400);
await top().locator('input[placeholder="ex. 1,012"]').fill('1,004'); await top().locator('input[placeholder="ex. 18"]').fill('19');
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400); log('toast :', await page.locator('.toast').innerText().catch(() => '-'));
// 8. Paramètres › Opérations : créer une opération (fiche associée), stade automatique
await page.click('#tab-params'); await page.click('main button:has-text("⚙ Opérations")'); await page.waitForTimeout(300);
await page.screenshot({ path: SH + '/t27-catalogue.png' });
await page.click('main button:has-text("+ Nouvelle opération")'); await page.waitForTimeout(300);
await top().locator('input[aria-label="Nom de l’opération"]').fill('Tanisage');
await top().locator('label', { hasText: 'Traitement sur une cuve avec intrants' }).click();
await top().locator('select[aria-label="Groupe"]').selectOption('Élevage & stabilisation');
await top().locator('label', { hasText: 'Le lot traité passe au stade' }).locator('input').check();
await top().locator('select[aria-label="Stade appliqué automatiquement"]').selectOption('elevage');
await page.screenshot({ path: SH + '/t27-nouvelle-op.png' });
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
log('toast :', await page.locator('.toast').innerText().catch(() => '-'));
const row = page.locator('main [data-op="perso_tanisage"]'); ok('catalogue : opération créée', await row.count() === 1, (await row.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160));
ok('catalogue : fiche « Tanisage » créée', (await row.innerText()).includes('fiche : Tanisage'));
// modifier le soutirage : désactiver le stade auto
await page.locator('main [data-op="soutirage"] button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(300);
await top().locator('label', { hasText: 'Le lot traité passe au stade' }).locator('input').uncheck(); await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(300);
ok('catalogue : soutirage sans stade auto', (await page.locator('main [data-op="soutirage"]').innerText()).includes('pas de changement de stade'));
// 9. la nouvelle opération dans le panneau + son formulaire + sa fiche (0.39 : le catalogue est un sous-onglet d'Opérations & Assemblages)
await page.click('#tab-ops'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: /^Journal$/ }).click(); await page.waitForTimeout(300);
await page.locator('main [data-nouvelle-op]').click(); await page.waitForTimeout(300); // 0.48.0-alpha.1 : sélecteur « ＋ Nouvelle opération »
await page.locator('main [data-groupe] button', { hasText: 'Tanisage' }).click(); await page.waitForTimeout(400);
ok('nouvelle opération : formulaire', (await top().locator('h2').innerText()).includes('Tanisage'));
await pick(page, top().locator('input[role=combobox]').first(), 'Cuve 06', 'P25-02-T'); await page.waitForTimeout(200);
ok('nouvelle opération : stade auto « élevage » proposé', (await top().locator('select[aria-label="Stade du lot après l’opération"]').inputValue()) === 'elevage');
await top().locator('button', { hasText: 'Fiche à remplir' }).click(); await page.waitForTimeout(600);
ok('nouvelle opération : fiche associée', (await top().innerText()).includes('Tanisage'), (await top().locator('h2').innerText()).slice(0, 80));
await page.screenshot({ path: SH + '/t27-fiche.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
// 10. mélanges de stades : éditeur + test
await page.click('#tab-params'); await page.click('main button:has-text("Revendications, stades & listes")'); await page.waitForTimeout(300);
ok('mélanges : règles affichées', await page.locator('main [data-regle]').count() >= 10, await page.locator('main [data-regle]').count());
await page.locator('main select[aria-label="Tester : stade A"]').selectOption('vin_filtre'); await page.locator('main select[aria-label="Tester : stade B"]').selectOption('vin_clair'); await page.waitForTimeout(150);
ok('mélanges : test vin filtré + vin clarifié', (await page.locator('main [data-test="mix-resultat"]').innerText()).includes('Vin clarifié'), await page.locator('main [data-test="mix-resultat"]').innerText());
await page.locator('main [data-regle]').first().scrollIntoViewIfNeeded(); await page.screenshot({ path: SH + '/t27-melanges.png' });
// 11. registres : sorties de cave en hL (module Registres, séparé des Paramètres depuis la 0.13.0-alpha.1)
await page.click('#tab-registres'); await page.click('main button:has-text("Registres (CSV / Excel)")'); await page.waitForTimeout(300);
const reg = (await page.locator('main').innerText()); ok('registres : sorties de cave et suivi des cuves', reg.includes('Sorties de cave') && reg.includes('Suivi des cuves'));
ok('version en pied de page (X.Y.Z-étiquette.N)', /^Œnotrack \d+\.\d+\.\d+(-(alpha|beta|rc)\.\d+)?$/.test(await page.locator('.appfoot-v').last().innerText()), await page.locator('.appfoot-v').last().innerText());
log(ko ? `${ko} ÉCHEC(S)` : 'T27 OK'); log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
