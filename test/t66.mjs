// 0.33.0-alpha.1 : Région & types de vins ; 0.50.0-alpha.1 (réécrit) : Paramètres › 🍇 Vignoble — région sur la carte de France,
// appellations du référentiel (recherche, ancien nom, Vin de France), types déduits, adaptations en direct (onglets, opérations) et
// exceptions forcées, communes et parcelles dans la même rubrique, retour à Champagne avec confirmation, DRM, anglais, téléphone.
// Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const init = () => { window.claude = { use: async () => null }; window.print = () => {}; };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const onglets = async () => page.locator('[id^="tab-"]').evaluateAll((L) => L.map((x) => x.id.slice(4)));
const etape = async (id) => { await page.locator('[data-vignoble] [role=tab]', { hasText: id }).first().click(); await page.waitForTimeout(400); };
const vignoble = async () => { await page.click('#tab-params'); await page.waitForTimeout(400); await page.locator('[data-params-item="profil"]').click(); await page.waitForTimeout(400); };

// 1. rubrique unique : étapes, carte, liste des régions ; « Crus & parcelles » n'est plus une rubrique à part
await vignoble();
let t = await txt(page.locator('main'));
ok('Vignoble : six étapes (région, appellations, types, crus, parcelles, adaptations), carte de 13 bassins, 22 régions, plus de raccourcis ni de rubrique « Crus & parcelles »', (await page.locator('[data-vignoble] [role=tab]').count()) >= 6 && (await page.locator('[data-carte-region]').count()) === 13 && (await page.locator('select[aria-label="Région viticole"] option').count()) === 22 && !(await page.locator('[data-raccourci]').count()) && !(await page.locator('[data-params-item="crus"]').count()) && /Crus \(villages\)/.test(t), t.slice(0, 400));
// 2. Bordeaux sur la carte : appliqué aussitôt (profil pas encore défini : pas de confirmation), étape des appellations ouverte
await page.locator('[data-carte-region="bordeaux"]').click(); await page.waitForTimeout(600);
let d = await db(); let O = await onglets();
ok('carte : Bordeaux appliqué aussitôt (rouges et blancs), Tirages, Cave, Dégorgement retirés, passage aux appellations', d.settings.profilViticole.region === 'bordeaux' && d.settings.profilViticole.direct && !O.includes('tirage') && !O.includes('cave') && !O.includes('degorgement') && (await page.locator('[data-vignoble-etape="appellations"]').count()) === 1, O);
await etape('Région'); ok('… carte : Bordeaux marqué choisi', (await page.locator('[data-carte-region="bordeaux"]').getAttribute('aria-pressed')) === 'true'); await etape('Appellations');
// 3. appellations : liste de la région, Vin de France, recherche par ancien nom (autres régions)
t = await txt(page.locator('[data-vignoble-etape]'));
ok('appellations de la région Bordeaux (Pauillac, Sauternes…), Vin de France proposé', /Pauillac/.test(t) && /Sauternes/.test(t) && (await page.locator('[data-vignoble-ref="france:vin de france"]').count()) === 1, t.slice(0, 300));
await page.locator('[data-vignoble-recherche]').fill('Médoc'); await page.waitForTimeout(300);
await page.locator('[data-vignoble-ref="bordeaux:medoc"] input').check(); await page.waitForTimeout(500);
await page.locator('[data-vignoble-recherche]').fill('Saint-Emilion'); await page.waitForTimeout(300);
await page.locator('[data-vignoble-ref="bordeaux:saint-emilion"] input').check(); await page.waitForTimeout(500);
d = await db();
ok('… Médoc et Saint-Émilion cochés : ajoutés à la liste avec leur référence', ['Médoc', 'Saint-Emilion'].every((n) => d.lists.appellations.some((a) => a.label === n && a.ref && a.ref.id)) && (await page.locator('[data-vignoble-mes] [data-vignoble-app]').count()) >= 2);
await page.locator('[data-vignoble-recherche]').fill('Corbières-Boutenac'); await page.waitForTimeout(300);
t = await txt(page.locator('[data-vignoble-etape]'));
ok('… recherche par ancien nom : Boutenac trouvée dans les autres régions', /Autres régions/i.test(t) && /Boutenac/.test(t), t.slice(-300));
await page.locator('[data-vignoble-recherche]').fill('');
// 4. types déduits des appellations
await etape('Types de vins'); await page.locator('[data-types-auto]').check(); await page.waitForTimeout(500); d = await db();
ok('types déduits : Médoc (blanc, rouge) + Saint-Émilion (rouge) → blancs et rouges, cases grisées', d.settings.profilViticole.typesAuto && d.settings.profilViticole.types.join() === 'blanc,rouge' && await page.locator('[data-profil-types] input[data-type="rouge"]').isDisabled(), d.settings.profilViticole);
// 5. adaptations : Cave forcé « toujours affiché », opérations des rouges proposées
await etape('Adaptations'); t = await txt(page.locator('[data-vignoble-adaptations]'));
ok('adaptations : onglets, opérations, fractions, spécificités champenoises ; Tirages masqué ; pigeage proposé pour les rouges', /Onglets/.test(t) && /Opérations/.test(t) && /Fractions au pressurage/.test(t) && /Spécificités champenoises/.test(t) && /Vins tranquilles rouges/.test(await txt(page.locator('[data-adaptation="op:pigeage"]'))), t.slice(0, 300));
await page.locator('[data-adaptation-force="module:cave"]').selectOption('affiche'); await page.waitForTimeout(500);
ok('… Cave forcé « toujours affiché » : onglet revenu, marqué « forcé »', (await onglets()).includes('cave') && /forcé/.test(await txt(page.locator('[data-adaptation="module:cave"]'))));
await page.screenshot({ path: SC + '/shots/t66-adaptations.png' });
// 6. communes et parcelles dans la même rubrique
await etape('Communes'); ok('communes & crus : liste des crus dans la rubrique (hors Champagne : « Communes & crus »)', (await page.locator('[data-crus-recherche]').count()) === 1 && /Communes & crus/.test(await txt(page.locator('[data-vignoble] [role=tablist], [data-vignoble]').first())));
await etape('Parcelles'); ok('parcelles : liste et « ＋ Nouvelle parcelle » dans la rubrique', /Nouvelle parcelle/.test(await txt(page.locator('[data-vignoble-etape]'))));
// 7. saisie et DRM
await page.click('#tab-ops'); await page.waitForTimeout(400);
t = (await page.locator('main [data-groupe]').allInnerTexts()).join(' ');
ok('saisie : « Macération (cuvaison) » et « Écoulage » proposés, « Remuage » plus proposé ici (Cave forcé : saisi dans la Cave)', /Macération \(cuvaison\)/.test(t) && /Écoulage/.test(t) && !/Remuage\s*☆/.test(t) && /Remuage : onglet Cave/.test(t), t.slice(0, 300));
for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
await page.click('#tab-registres'); await page.waitForTimeout(400); await page.locator('main [role=tab]', { hasText: 'DRM' }).first().click(); await page.waitForTimeout(400); await page.locator('[data-drm-reglages]').click(); await page.waitForTimeout(400);
await page.locator('.overlay').last().locator('button', { hasText: '＋ Nouveau produit' }).click(); await page.waitForTimeout(400);
const opts = await page.locator('datalist#drm-appellations option').evaluateAll((L) => L.map((x) => x.value));
ok('DRM : les appellations cochées proposées pour le libellé d’un produit', opts.includes('Médoc') && opts.includes('Saint-Emilion'), opts);
for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
// 8. retour à Champagne : confirmation, onglets rétablis, appellations gardées, exception gardée
await vignoble(); await page.locator('select[aria-label="Région viticole"]').selectOption('champagne'); await page.waitForTimeout(300);
ok('changement de région : confirmation demandée', (await page.locator('[data-cfm-ok]').count()) === 1);
await page.locator('[data-cfm-ok]').click(); await page.waitForTimeout(600); d = await db(); O = await onglets();
ok('… Champagne appliqué, étape des appellations ouverte ; types toujours déduits des appellations cochées (Médoc, Saint-Émilion : pas d’effervescent, Tirages masqué)', d.settings.profilViticole.region === 'champagne' && d.settings.region === 'champagne' && (await page.locator('[data-vignoble-etape="appellations"]').count()) === 1 && !O.includes('tirage'), O);
await page.locator('[data-vignoble-ref="champagne:champagne"] input').check(); await page.waitForTimeout(600); d = await db(); O = await onglets();
ok('… Champagne cochée : Tirages, Dégorgement revenus, spécificités champenoises, Médoc gardé, Cave toujours forcé', d.settings.profilViticole.region === 'champagne' && O.includes('tirage') && O.includes('degorgement') && O.includes('cave') && d.settings.region === 'champagne' && d.lists.appellations.some((a) => a.label === 'Médoc') && d.settings.profilViticole.forces['module:cave'] === 'affiche', O);
// 9. anglais
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(400);
t = await txt(page.locator('main'));
ok('anglais : rubrique et étapes traduites, noms des régions et appellations non traduits', /Vineyard/.test(t) && /1\. Region/.test(t) && /2\. Appellations/.test(t) && /6\. Adjustments/.test(t) && /Champagne/.test(t) && !/Choisissez votre région/.test(t), t.slice(0, 400));
await page.screenshot({ path: SC + '/shots/t66-en.png' });
await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
ok('aucune erreur', !errors.length, errors);
await browser.close();
// 10. téléphone : l'écran tient dans la largeur
{
  const { browser: b2, page: p2, errors: e2 } = await open({ init, viewport: { width: 390, height: 844 }, mobile: true, date: '2026-11-26T10:00:00' });
  await p2.click('#tab-params'); await p2.waitForTimeout(400); await p2.locator('[data-params-item="profil"]').click(); await p2.waitForTimeout(400);
  await p2.locator('[data-carte-region="provence"]').click(); await p2.waitForTimeout(500);
  await p2.locator('[data-vignoble] [role=tab]', { hasText: 'Adaptations' }).first().click(); await p2.waitForTimeout(400);
  const w = await p2.evaluate(() => document.documentElement.scrollWidth);
  await p2.screenshot({ path: SC + '/shots/t66-mobile.png', fullPage: true });
  ok('téléphone : carte, appellations et adaptations sans débordement horizontal', w <= 392 && (await p2.locator('[data-adaptation]').count()) > 10 && !e2.length, [w, e2]);
  await b2.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt66 : TOUT PASSE'); process.exitCode = ko ? 1 : 0;
