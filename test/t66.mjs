// 0.33.0-alpha.1 : Paramètres › 🍇 Région & types de vins — aperçu à cocher (onglets, opérations, stades, cépages, appellations,
// fractions, pressoir, seuil), application partielle, onglets masqués, opérations proposées, retour à Champagne, raccourci « Crémant +
// vins tranquilles », appellations proposées pour la DRM, personnalisations gardées, anglais, téléphone. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const init = () => { window.claude = { use: async () => null }; window.print = () => {}; };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const sous = async (t) => { await page.locator('main [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(400); };
const onglets = async () => page.locator('[id^="tab-"]').evaluateAll((L) => L.map((x) => x.id.slice(4)));
const plan = () => page.locator('[data-profil-plan] [data-changement]').evaluateAll((L) => L.map((x) => x.dataset.changement));
const toast = async () => page.locator('.toast').last().innerText().catch(() => '');

// 1. Paramètres › Région & types de vins : jeu d'exemple champenois, seules les appellations à ajouter
await page.click('#tab-params'); await page.waitForTimeout(400); await sous('Région & types de vins');
let t = await txt(page.locator('main'));
ok('écran : région (Champagne), 6 types (effervescents et blancs cochés), raccourcis ; aperçu : les 3 appellations champenoises', /Région et types de vins produits/.test(t) && (await page.locator('select[aria-label="Région viticole"]').inputValue()) === 'champagne' && (await page.locator('[data-profil-types] input:checked').count()) === 2 && (await page.locator('[data-raccourci]').count()) === 4 && (await plan()).join() === 'appellation:Champagne,appellation:Coteaux champenois,appellation:Rosé des Riceys', await plan());
ok('… régions groupées : France (13), Étranger (8), Autre', (await page.locator('select[aria-label="Région viticole"] optgroup').count()) === 3 && (await page.locator('select[aria-label="Région viticole"] option').count()) === 22);
// 2. Bordeaux, rouges et blancs : aperçu détaillé ; on décoche une appellation et l'enrichissement
await page.locator('select[aria-label="Région viticole"]').selectOption('bordeaux'); await page.waitForTimeout(300);
await page.locator('[data-type=effervescent]').uncheck(); await page.locator('[data-type=rouge]').check(); await page.waitForTimeout(300);
let P = await plan(); t = await txt(page.locator('[data-profil-plan]'));
ok('aperçu Bordeaux : onglets, opérations, stade, cépages, appellations, fractions, pressoir, région, villages, enrichissement « exemple à vérifier »', ['module:tirage', 'module:cave', 'module:degorgement', 'op:maceration', 'op:ecoulage', 'op:remuage', 'stade:maceration', 'cepage:merlot', 'appellation:Saint-Émilion', 'fraction:goutte', 'pressfrac:rebeche', 'pressoir', 'region', 'crus', 'chaptal'].every((x) => P.includes(x)) && /exemple à vérifier/.test(t) && /Tirages affiché → masqué/.test(t) && /\+2,0 % vol → \+1,5 % vol/.test(t), P);
await page.locator('[data-changement="appellation:Sauternes"] input').uncheck(); await page.locator('[data-changement="chaptal"] input').uncheck();
ok('… décoché : le bouton compte les changements retenus', /Appliquer \(39\)/.test(await page.locator('[data-profil-appliquer]').innerText()) && P.length === 41, await page.locator('[data-profil-appliquer]').innerText());
await page.screenshot({ path: SC + '/shots/t66-apercu.png' });
await page.locator('[data-profil-appliquer]').click(); await page.waitForTimeout(500);
let d = await db(); const op = (id) => d.lists.operations.find((o) => o.id === id);
ok('appliqué : profil Bordeaux enregistré ; onglets Tirages, Cave, Dégorgement retirés ; opérations des rouges proposées ; Merlot, goutte, stade ajoutés ; Sauternes et seuil non appliqués', /39 changement/.test(await toast()) && d.settings.profilViticole.region === 'bordeaux' && !(await onglets()).includes('tirage') && !(await onglets()).includes('degorgement') && !op('maceration').masque && op('remuage').masque
  && d.lists.cepages.some((c) => c.id === 'merlot') && d.lists.fractions.some((f) => f.id === 'goutte') && d.lists.stades.some((s) => s.id === 'maceration') && !d.lists.appellations.some((a) => a.label === 'Sauternes') && d.lists.appellations.some((a) => a.label === 'Médoc') && d.settings.chaptalMax == null && d.settings.region === 'autre', await onglets());
P = await plan();
ok('… nouvel aperçu : seuls les éléments décochés restent proposés ; profil actuel affiché', P.join() === 'appellation:Sauternes,chaptal' && /Profil actuel : Bordeaux · Vins tranquilles rouges, Vins tranquilles blancs|Profil actuel : Bordeaux · Vins tranquilles blancs, Vins tranquilles rouges/.test(await txt(page.locator('[data-profil-actuel]'))), P);
// 3. opérations : macération dans le menu de saisie ; pressoir sans plafond ; appellations proposées pour la DRM
await page.click('#tab-ops'); await page.waitForTimeout(400);
t = (await page.locator('main [data-groupe]').allInnerTexts()).join(' ');
ok('saisie : « Macération (cuvaison) » et « Écoulage » proposés, « Remuage » plus proposé', /Macération \(cuvaison\)/.test(t) && /Écoulage/.test(t) && !/Remuage/.test(t), t.slice(0, 300));
for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
await page.click('#tab-registres'); await page.waitForTimeout(400); await sous('DRM'); await page.locator('[data-drm-reglages]').click(); await page.waitForTimeout(400);
await page.locator('.overlay').last().locator('button', { hasText: '+ Nouveau produit' }).click(); await page.waitForTimeout(400);
const opts = await page.locator('datalist#drm-appellations option').evaluateAll((L) => L.map((x) => x.value));
ok('DRM : les appellations de la liste proposées pour le libellé d’un produit', opts.includes('Médoc') && opts.includes('Saint-Émilion') && !opts.includes('Sauternes'), opts);
for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
// 4. retour à Champagne par le raccourci : ce que le profil avait changé revient, rien n'est retiré
await page.click('#tab-params'); await page.waitForTimeout(400); await sous('Région & types de vins');
await page.locator('[data-raccourci=champagne]').click(); await page.waitForTimeout(300); P = await plan();
ok('raccourci Champagne : onglets réaffichés, opérations des rouges masquées, pressoir et spécificités champenoises ; aucun retrait de cépage ni d’appellation', ['module:tirage', 'op:maceration', 'op:remuage', 'pressfrac:rebeche', 'pressoir', 'region'].every((x) => P.includes(x)) && !P.some((x) => /^(cepage|appellation):/.test(x) && !/Champagne|Coteaux|Riceys/.test(x)), P);
await page.locator('[data-profil-appliquer]').click(); await page.waitForTimeout(500); d = await db();
ok('… appliqué : onglets Tirages, Cave, Dégorgement revenus ; Champagne ; Merlot et Médoc gardés', (await onglets()).includes('tirage') && (await onglets()).includes('degorgement') && d.settings.region === 'champagne' && d.settings.pressoir.profil === 'champagne' && d.lists.cepages.some((c) => c.id === 'merlot') && d.lists.appellations.some((a) => a.label === 'Médoc') && op('maceration') && d.lists.operations.find((o) => o.id === 'maceration').masque);
// 5. domaine mixte en un clic : Val de Loire, crémant + vins tranquilles
await page.locator('select[aria-label="Région viticole"]').selectOption('loire'); await page.locator('[data-raccourci=cremant]').click(); await page.waitForTimeout(300);
P = await plan(); t = await txt(page.locator('[data-profil-plan]'));
ok('raccourci « Crémant + vins tranquilles » (Val de Loire) : 4 types cochés, onglets des effervescents gardés (pas proposés au masquage), pressoir crémant, saignée proposée', (await page.locator('[data-profil-types] input:checked').count()) === 4 && !P.some((x) => x.startsWith('module:')) && /Crémant \(Alsace, Bourgogne, Loire, Die…\)/.test(t) && P.includes('op:saignee'), P);
// 6. anglais
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(400);
t = await txt(page.locator('main'));
ok('anglais : écran traduit (région, types, groupes, valeurs) ; appellations et cépages non traduits', /Region and wine types produced/.test(t) && /Proposed changes/.test(t) && /Loire Valley/.test(await page.locator('select[aria-label="Wine region"] option:checked').innerText()) && /Red still wines/.test(t) && /Press, region and classification/.test(t) && /offered|added/.test(t) && !/Changements proposés|Types de vins produits|ajoutée/.test(t), t.slice(0, 600));
await page.screenshot({ path: SC + '/shots/t66-en.png' });
await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
ok('aucune erreur', !errors.length, errors);
await browser.close();
// 7. téléphone : l'écran tient dans la largeur
{
  const { browser: b2, page: p2, errors: e2 } = await open({ init, viewport: { width: 390, height: 844 }, mobile: true, date: '2026-11-26T10:00:00' });
  await p2.click('#tab-params'); await p2.waitForTimeout(400); await p2.locator('main [role=tab]', { hasText: 'Région & types de vins' }).first().click(); await p2.waitForTimeout(400);
  await p2.locator('select[aria-label="Région viticole"]').selectOption('provence'); await p2.waitForTimeout(300);
  const w = await p2.evaluate(() => document.documentElement.scrollWidth);
  await p2.screenshot({ path: SC + '/shots/t66-mobile.png', fullPage: true });
  ok('téléphone : aperçu Provence affiché sans débordement horizontal', w <= 392 && (await p2.locator('[data-profil-plan] [data-changement]').count()) > 10 && !e2.length, [w, e2]);
  await b2.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt66 : TOUT PASSE'); process.exitCode = ko ? 1 : 0;
