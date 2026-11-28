// 0.13.0-alpha.1 : modules réorganisables et désactivables (Paramètres toujours actif), Tirages / Cave / Dégorgement, Registres / Paramètres
import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗', name, x !== undefined ? `→ ${String(x).replace(/\s+/g, ' ').slice(0, 200)}` : ''); };
const { browser, page, errors } = await open();
const onglets = async () => page.$$eval('.navtabs [role=tab]', (b) => b.map((x) => x.id.replace('tab-', '')));
const toast = async () => page.locator('.toast').innerText().catch(() => '');
const ligne = (id) => page.locator(`main [data-module="${id}"], main [data-module-dans="${id}"]`);
const allerModules = async () => { await page.click('#tab-params'); await page.click('main button:has-text("Modules")'); await page.waitForTimeout(300); };

// 1. onglets par défaut
const o0 = await onglets();
ok('12 onglets dans l’ordre d’origine (Cuverie, Opérations et À réaliser réunis dans Vinification depuis 0.34.0-alpha.1 ; Pressoir après ; Déclassements dans Opérations depuis 0.27.0-alpha.2 ; Équipements après Hygiène depuis 0.28.0-alpha.1), Paramètres en dernier', o0.join() === 'vinification,pressoir,tirage,cave,degorgement,analyses,intrants,hygiene,equipements,trace,registres,params', o0.join());
ok('démarrage sur le premier module (Cuverie)', (await page.locator('#tab-cuverie').getAttribute('aria-selected')) === 'true');
// 2. Tirages / Cave / Dégorgement et Registres / Paramètres
await page.click('#tab-tirage'); await page.waitForTimeout(300); const tPrep = await page.locator('main').innerText(); await page.getByRole('tab', { name: /Tirer/ }).click(); await page.waitForTimeout(300); const tTir = tPrep + (await page.locator('main').innerText()); // 0.42.0-alpha.1 : sous-onglets Préparer / Tirer
ok('Tirages : préparations de tirage et mixtions (pas de liqueur d’expédition)', tTir.includes('Tirages (mixtions)') && /Liqueurs? de tirage/.test(tPrep) && tPrep.includes('Pied de cuve malolactique') && !tTir.includes('Lots finis') && !/\+ Liqueur d.expédition/.test(tTir));
await page.click('#tab-cave'); await page.waitForTimeout(300); const tCave = await page.locator('main').innerText();
ok('Cave : bouteilles sur lattes, âge, sur pointes, mouvements', tCave.includes('Bouteilles en cave') && /15\s?900/.test(tCave) && tCave.includes('Mouvements en cave') && tCave.includes('mois') && tCave.includes('Sur pointes'), tCave.slice(0, 140));
await page.click('#tab-degorgement'); await page.waitForTimeout(300); const tDeg = await page.locator('main').innerText();
ok('Dégorgement : lots à dégorger, lots finis, liqueurs d’expédition', tDeg.includes('Lots à dégorger') && tDeg.includes('Lots finis') && tDeg.includes('Liqueurs d’expédition') && tDeg.includes('LF-26-001'));
await page.locator('main tbody tr', { hasText: 'T26-01' }).first().locator('button:text-is("Dégorger")').click(); await page.waitForTimeout(400);
ok('Dégorgement : « Dégorger » ouvre le formulaire prérempli', (await page.locator('.overlay').last().innerText()).includes('Dégorgement'));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.click('#tab-registres'); await page.waitForTimeout(300);
ok('Registres : seulement les registres et le bilan matière', (await page.locator('main .subnav, main [role=tablist]').first().innerText().catch(() => '')).replace(/\s+/g, ' ').includes('Bilan matière') && !(await page.locator('main').innerText()).includes('Société & opérateurs'));
// lien d'en-tête vers la sauvegarde (ancien chemin « Registres & Paramètres ») → Paramètres
await page.locator('header button', { hasText: 'sauvegarde' }).first().click(); await page.waitForTimeout(300);
ok('lien « sauvegarde » → Paramètres › Sauvegarde & Drive', (await page.locator('#tab-params').getAttribute('aria-selected')) === 'true' && (await page.locator('main').innerText()).includes('Stockage sur votre Drive'));

// 3. écran Modules
await allerModules();
ok('Modules : 15 lignes à ordonner (Plan de vinification depuis 0.39) + Déclassements « dans Opérations & Assemblages », Paramètres verrouillé', (await page.locator('main [data-module]').count()) === 15 && (await page.locator('main [data-module-dans="declass"]').innerText()).includes('dans « Opérations & Assemblages »') && (await ligne('params').locator('[role=switch]').isDisabled()) && (await ligne('params').innerText()).includes('toujours actif'));
ok('Modules : « s’ouvre au démarrage » sur Cuverie', (await ligne('cuverie').innerText()).includes('s’ouvre au démarrage'));
await page.screenshot({ path: SH + '/t32-modules.png', fullPage: true });
// désactiver Hygiène (rien en attente : pas de confirmation)
await ligne('hygiene').locator('[role=switch]').click(); await page.waitForTimeout(300);
ok('Hygiène désactivée : onglet masqué, données conservées', !(await onglets()).includes('hygiene') && (await toast()).includes('désactivé') && (await ligne('hygiene').locator('[role=switch]').getAttribute('aria-checked')) === 'false');
// désactiver Déclassements : 1 alerte en attente → confirmation
await ligne('declass').locator('[role=switch]').click(); await page.waitForTimeout(300);
const dlg = page.locator('[role=alertdialog]');
ok('Déclassements : confirmation (alerte en attente)', (await dlg.count()) === 1 && (await dlg.innerText()).includes('alerte de déclassement'), await dlg.innerText().catch(() => ''));
await dlg.locator('button:text-is("Désactiver")').click(); await page.waitForTimeout(300);
ok('Déclassements désactivés', !(await onglets()).includes('declass') && (await ligne('declass').innerText()).includes('en attente'));
await page.click('#tab-ops'); await page.waitForTimeout(300);
ok('… plus de sous-onglet « Déclassements » dans Opérations', (await page.locator('main [role=tablist] [role=tab]', { hasText: 'Déclassements' }).count()) === 0);
await allerModules();
// désactiver À réaliser → plus de « Planifier » dans les formulaires
await ligne('previsions').locator('[role=switch]').click(); await page.waitForTimeout(300);
await page.click('#tab-ops'); await page.waitForTimeout(300);
ok('Opérations : KPI déclassements sans lien (module désactivé)', (await page.locator('main').innerText()).includes('module Déclassements désactivé'));
await page.click('main button:text-is("Soutirage")'); await page.waitForTimeout(400);
ok('formulaire sans « Planifier » quand À réaliser est désactivé', (await page.locator('.overlay').last().locator('button:has-text("Planifier")').count()) === 0);
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// 4. réordonner : flèches puis glisser-déposer
await allerModules();
for (let i = 0; i < 4; i += 1) { await ligne('trace').locator('button[aria-label^="Monter"]').click(); await page.waitForTimeout(150); }
const o1 = await onglets();
ok('flèches : Traçabilité remontée de 4 places (au-dessus des Équipements, de l’Hygiène, des Intrants et des Analyses)', o1.indexOf('trace') === o1.indexOf('analyses') - 1 && o1.indexOf('trace') < o1.indexOf('intrants'), o1.join());
await page.setViewportSize({ width: 1280, height: 1400 }); await ligne('cuverie').scrollIntoViewIfNeeded(); await page.waitForTimeout(150);
const h = await ligne('cave').locator('.mod-poignee').boundingBox(); const cible = await ligne('cuverie').boundingBox();
await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down();
await page.mouse.move(h.x + h.width / 2, cible.y + 20, { steps: 12 }); await page.mouse.move(h.x + h.width / 2, cible.y + 4, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(400);
const o2 = await onglets();
ok('glisser-déposer : Cave en premier, ouvre au démarrage', o2[0] === 'cave' && (await ligne('cave').innerText()).includes('s’ouvre au démarrage'), o2.join());
// rechargement : le réglage est enregistré, ouverture sur le premier module actif
await page.reload(); await page.waitForTimeout(1200);
ok('après rechargement : ordre conservé, ouverture sur Cave', (await onglets())[0] === 'cave' && (await page.locator('#tab-cave').getAttribute('aria-selected')) === 'true' && !(await onglets()).includes('hygiene'));
// 5. tout désactiver : Paramètres reste ; puis tout réactiver
await allerModules();
for (const id of await page.$$eval('main [data-module] [role=switch][aria-checked=true]:not([disabled])', (b) => b.map((x) => x.closest('[data-module]').dataset.module))) {
  await ligne(id).locator('[role=switch]').click(); await page.waitForTimeout(120);
  if (await page.locator('[role=alertdialog]').count()) { await page.locator('[role=alertdialog] button:text-is("Désactiver")').click(); await page.waitForTimeout(120); }
}
ok('tout désactivé : seul Paramètres reste', (await onglets()).join() === 'params', (await onglets()).join());
ok('pas de bouton « Exporter les registres » dans l’en-tête', (await page.locator('header button', { hasText: 'Exporter les registres' }).count()) === 0);
await page.screenshot({ path: SH + '/t32-tout-off.png' });
await page.locator('main button', { hasText: 'Réactiver tous les modules' }).click(); await page.waitForTimeout(300);
ok('tout réactivé (12 onglets, Déclassements de nouveau dans Opérations)', (await onglets()).length === 12 && (await page.locator('main [data-module-dans="declass"] [role=switch]').getAttribute('aria-checked')) === 'true');
await page.locator('main button', { hasText: 'Rétablir l’ordre d’origine' }).click(); await page.waitForTimeout(300);
ok('ordre d’origine rétabli', (await onglets()).join() === o0.join());
// 6. module ouvert puis désactivé (comme depuis un autre appareil) : retour au premier module actif
await page.click('#tab-hygiene'); await page.waitForTimeout(200);
await page.evaluate(() => { const k = 'oenotrack-db-v2'; const d = JSON.parse(localStorage.getItem(k)); d.settings.modulesOff = ['cuverie', 'hygiene']; localStorage.setItem(k, JSON.stringify(d)); });
await page.reload(); await page.waitForTimeout(1200);
ok('base avec Cuverie et Hygiène désactivées : ouverture sur le premier module actif (Pressoir)', (await page.locator('#tab-pressoir').getAttribute('aria-selected')) === 'true' && !(await onglets()).includes('cuverie'));
// 7. téléphone
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(200); await allerModules();
const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok('téléphone : écran Modules sans débordement', ov <= 1, ov);
await ligne('cuverie').locator('[role=switch]').click(); await page.waitForTimeout(300);
ok('téléphone : réactivation au doigt', (await ligne('cuverie').locator('[role=switch]').getAttribute('aria-checked')) === 'true' && (await onglets()).includes('vinification'));
await page.screenshot({ path: SH + '/t32-mobile.png' });
console.log('ERREURS:', errors.join(' | ') || 'aucune'); if (errors.length) ko++;
await browser.close();
console.log(ko ? `${ko} ÉCHEC(S)` : 'T32 OK');
