// 0.47.0-alpha.1 : échelle par appellation — Paramètres › Listes : hiérarchie de chaque appellation (proposée, confirmée, changée) ;
// parcelle : appellation et niveau dans la hiérarchie de l'appellation ; fiche d'un lot : appellation et niveau d'après ses parcelles ;
// anglais. Données fictives (jeu d'exemple ; test/fixtures/base-0.47.0-alpha.1-echelles.json).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const fx = JSON.parse(fs.readFileSync(new URL('./fixtures/base-0.47.0-alpha.1-echelles.json', import.meta.url), 'utf8')); fx.settings.campagneActive = '2025-2026'; fx.settings.securite = { ...(fx.settings.securite || {}), actif: false };
const semer = { content: `if (!sessionStorage.getItem('semee')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(fx))}); sessionStorage.setItem('semee', '1'); }` };
{
  const { browser, page, errors } = await open({ init: semer, viewport: { width: 1360, height: 900 } });
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="listes"]').click(); await page.waitForTimeout(500);
  const sec = page.locator('[data-app-echelles]'); t = await txt(sec);
  const idRioja = (await db()).lists.appellations.find((a) => a.label === 'Rioja').id; const idChablis = (await db()).lists.appellations.find((a) => a.label === 'Chablis').id;
  ok('hiérarchie de chaque appellation : Chablis confirmée (Petit Chablis < Chablis < premier cru < grand cru), Rioja proposée (Espagne)', /Petit Chablis < Chablis < Chablis premier cru < Chablis grand cru/.test(t) && (await sec.locator(`[data-app-echelle="${idChablis}"]`).innerText()).includes('confirmée') && /proposée/.test(await sec.locator(`[data-app-echelle="${idRioja}"]`).innerText()) && (await sec.getByLabel('Hiérarchie de Rioja').inputValue()) === 'espagne', t.slice(0, 500));
  await sec.locator(`[data-app-echelle-confirmer="${idRioja}"]`).click(); await page.waitForTimeout(400);
  ok('… Rioja confirmée', (await db()).lists.appellations.find((a) => a.id === idRioja).echelle === 'espagne' && /confirmée/.test(await sec.locator(`[data-app-echelle="${idRioja}"]`).innerText()));
  await sec.getByLabel('Hiérarchie de Rioja').selectOption('generique'); await page.waitForTimeout(400);
  ok('… hiérarchie changée (générique)', (await db()).lists.appellations.find((a) => a.id === idRioja).echelle === 'generique');
  await page.screenshot({ path: `${SC}/shots/t89-hierarchies.png` });
  // ---- parcelle : appellation et niveau
  await page.locator('[data-params-item="crus"]').click(); await page.waitForTimeout(500);
  await page.getByRole('tab', { name: /Parcelles/ }).click().catch(() => {}); await page.waitForTimeout(300);
  await page.locator('tr', { hasText: 'Les Crayères' }).first().click(); await page.waitForTimeout(500);
  const f = page.locator('.overlay').last();
  ok('fiche de la parcelle : appellation Champagne, niveau Grand cru (échelle des crus)', (await f.getByLabel('Appellation de la parcelle').inputValue()) === fx.lists.appellations.find((a) => a.label === 'Champagne').id && (await f.getByLabel('Niveau de la parcelle').inputValue()) === 'grand');
  await f.getByLabel('Appellation de la parcelle').selectOption(idChablis); await page.waitForTimeout(200);
  const niv = await f.getByLabel('Niveau de la parcelle').locator('option').evaluateAll((e) => e.map((x) => x.value));
  ok('… autre appellation : les niveaux de sa hiérarchie (Chablis)', niv.join() === ',petit_chablis,chablis,premier,grand', niv);
  await f.getByLabel('Niveau de la parcelle').selectOption('premier'); await f.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  const p = (await db()).parcelles.find((x) => x.nom === 'Les Crayères');
  ok('… enregistrée : Chablis premier cru', p.appellationId === idChablis && p.niveau === 'premier', p);
  // ---- fiche du lot
  await page.click('#tab-vinification'); await page.waitForTimeout(300); await page.click('#tab-cuverie'); await page.waitForTimeout(300);
  await page.getByRole('tab', { name: 'Lots', exact: true }).click(); await page.waitForTimeout(500);
  await page.locator('tr', { hasText: 'P25-01' }).first().click(); await page.waitForTimeout(600);
  t = await txt(page.locator('.overlay').last());
  ok('fiche du lot P25-01 : appellation et niveau d’après ses parcelles (Chablis · Chablis 1er cru)', /Chablis · Chablis 1er cru/.test(t), t.slice(0, 400));
  await page.screenshot({ path: `${SC}/shots/t89-lot.png` });
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ init: { content: semer.content.replace("sessionStorage.setItem('semee', '1');", "localStorage.setItem('oenotrack-langue', 'en'); sessionStorage.setItem('semee', '1');") }, viewport: { width: 1280, height: 900 } });
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="listes"]').click(); await page.waitForTimeout(500);
  t = await txt(page.locator('[data-app-echelles]'));
  ok('en anglais : « Hierarchy of each appellation », « confirmed »', /Hierarchy of each appellation/i.test(t) && /confirmed/.test(t), t.slice(0, 900));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t89)'); process.exitCode = ko ? 1 : 0;
