// 0.46.0-alpha.2 : types de vins « hors appellation » dans Paramètres › Région & types de vins (Champagne : méthode ancestrale et vins
// moelleux ; Suisse : rien), nombre d'appellations de la région ; Paramètres › Listes › Appellations : recherche dans le référentiel
// officiel et ajout ; anglais. Données fictives (jeu d'exemple).
import { open, vignoble, vignobleRegion, reglerVignoble } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await vignoble(page, 'Types de vins'); // 0.50.0-alpha.1 : Paramètres › Vignoble, étape des types
  const hors = async () => page.locator('[data-hors-appellation]').evaluateAll((e) => e.map((x) => x.getAttribute('data-hors-appellation')));
  let h = await hors(); t = await txt(page.locator('[data-profil-appellations]'));
  ok('Champagne : méthode ancestrale et vins moelleux « hors appellation », pas l’effervescent ni les tranquilles ; 6 appellations dans le référentiel', h.sort().join() === 'ancestrale,doux' && /6 appellation\(s\)/.test(t) && /AOP : 3/.test(t), { h, t });
  await page.screenshot({ path: `${SC}/shots/t88-profil.png` });
  await vignobleRegion(page, 'rhone'); await vignoble(page, 'Types de vins');
  h = await hors(); ok('Vallée du Rhône : méthode ancestrale possible (Clairette de Die) ; rien hors appellation', h.length === 0, h);
  await vignobleRegion(page, 'suisse'); await vignoble(page, 'Types de vins');
  h = await hors(); t = await txt(page.locator('[data-profil-appellations]'));
  ok('Suisse : indications qui ne restreignent pas le type de vin, rien de signalé', h.length === 0 && /ne restreignent pas/.test(t), { h, t });
  await vignobleRegion(page, 'charentes'); await vignoble(page, 'Types de vins');
  ok('nouvelle région Charentes proposée', (await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')).settings.profilViticole.region)) === 'charentes' && /2 appellation\(s\)/.test(await txt(page.locator('[data-profil-appellations]'))));
  // ---- appellations : référentiel
  await page.locator('[data-params-item="listes"]').click(); await page.waitForTimeout(500);
  const box = page.locator('[data-appref]');
  ok('Listes › Appellations : recherche dans le référentiel officiel (1 692 appellations)', (await box.count()) === 1 && /1\s?692 appellations/.test(await txt(box)));
  await box.getByLabel('Chercher une appellation').fill('chablis'); await page.waitForTimeout(300);
  t = await txt(box.locator('[data-appref-resultats]'));
  ok('« chablis » : Chablis, Petit Chablis, Chablis Grand Cru avec leur signe et leur région', /Chablis/.test(t) && /Petit Chablis/.test(t) && /AOP/.test(t) && /Bourgogne/.test(t), t.slice(0, 300));
  await box.locator('[data-appref-ajouter]').first().click(); await page.waitForTimeout(500);
  const ap = (await db()).lists.appellations.find((a) => a.label === 'Chablis');
  ok('… ajoutée à la liste avec sa référence ; marquée « déjà dans la liste »', ap && ap.ref && ap.ref.signe === 'AOP' && /déjà dans la liste/.test(await txt(box.locator('li').first())), ap);
  await box.getByLabel('Chercher une appellation').fill('napa'); await page.waitForTimeout(300);
  ok('« napa » : Napa Valley (AVA, États-Unis)', /Napa Valley/.test(await txt(box.locator('[data-appref-resultats]'))) && /AVA/.test(await txt(box.locator('[data-appref-resultats]'))));
  await page.screenshot({ path: `${SC}/shots/t88-appellations.png` });
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ init: { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" }, viewport: { width: 1280, height: 900 } });
  await vignoble(page, 'Wine types');
  t = await txt(page.locator('[data-profil-types]'));
  ok('en anglais : « outside any appellation »', /outside any appellation/.test(t), t.slice(0, 300));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t88)'); process.exitCode = ko ? 1 : 0;
