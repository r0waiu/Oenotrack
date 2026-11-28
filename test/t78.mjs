// 0.42.0-alpha.1 : Tirages › Préparer — calculateur dans les deux sens (cols → besoins, vin → cols), fonte de liqueur, levain
// (création depuis le calculateur, plan de propagation, recalibrage, étape saisie, journal), profil de tirage. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await page.click('#tab-tirage'); await page.waitForTimeout(400);
  ok('Tirages : sous-onglets « Préparer » et « Tirer »', (await page.getByRole('tab', { name: /Préparer/ }).count()) === 1 && (await page.getByRole('tab', { name: /Tirer/ }).count()) === 1);
  // ---- calculateur : 10 000 bouteilles
  const calc = page.locator('[data-tirage-calcul]');
  await calc.getByLabel('Cols 1').fill('10000'); await page.waitForTimeout(200);
  ok('point de tirage à choisir pour la cuvée (rien de calculé sans lui)', /Indiquez le point de tirage de la cuvée/.test(await txt(calc)));
  await calc.getByLabel('Point de tirage de la cuvée (g/L)').fill('24'); await page.waitForTimeout(250);
  const v = async (k) => (await calc.locator(`[data-calc="${k}"]`).innerText()).replace(/\s/g, ' ');
  ok('cols → besoins : 75,00 hL de mixtion, 67,65 hL de vin, 360 L de liqueur, 375 L de levain', /75,00/.test(await v('mix')) && /67,65/.test(await v('vin')) && /360/.test(await v('liqueur')) && /375/.test(await v('levain')), [await v('mix'), await v('vin'), await v('liqueur'), await v('levain')]);
  t = await txt(calc); ok('… sucre 180 kg, VRTP prévisionnel sous 1 %', /180,0 kg/.test(t) && /0,91 % des volumes mis en œuvre/.test(t), t.slice(0, 600));
  // ---- dans l'autre sens : 67,65 hL de vin → 10 000 cols
  await calc.getByRole('tab', { name: /J’ai x hL de vin/ }).click(); await calc.getByLabel('Vin de base disponible').fill('67,65'); await page.waitForTimeout(250);
  t = await txt(calc); ok('vin → mixtion : 75,00 hL, 10 000 cols', /75,00 hL/.test(t) && /10 000 cols/.test(t), t.slice(0, 400));
  await page.screenshot({ path: `${SC}/shots/t78-calcul.png` });
  // ---- fonte de la liqueur depuis le calculateur
  await calc.getByRole('button', { name: /Fondre cette liqueur/ }).click(); await page.waitForTimeout(400);
  t = await txt(ov().locator('[data-fonte-resultat]')); ok('fonte de liqueur préremplie : 386 L à 500 g/L → 193 kg de sucre et 264 L de vin (0,6329 L/kg)', /386/.test(t) && /193,1 kg/.test(t) && /264 L/.test(t), t);
  await ov().getByRole('button', { name: /Fermer|Annuler/ }).first().click(); await page.waitForTimeout(300);
  // ---- levain depuis le calculateur
  await calc.getByRole('tab', { name: /Je veux tirer x cols/ }).click(); await calc.getByLabel('Cols 1').fill('10000'); await page.waitForTimeout(200);
  await calc.getByRole('button', { name: /Préparer le levain/ }).click(); await page.waitForTimeout(400);
  await ov().getByLabel(/Volume préparé/).fill('0,5'); await ov().getByLabel('Eau déchlorée (hL)').fill('0,1'); await page.waitForTimeout(200);
  await ov().getByRole('button', { name: /Valider/ }).last().click(); await page.waitForTimeout(500);
  let d = await db(); const opL = d.ops.find((o) => o.type === 'preparation' && o.ptype === 'levain' && o.levainPlan);
  ok('levain créé avec son plan (jour de tirage, 10 000 cols) et son eau', opL && opL.levainPlan.jours[0].cols === 10000 && opL.eauL === 10, opL);
  // ---- fiche du levain
  await page.locator('[data-tirage-preparer] tr', { hasText: opL.code }).first().click(); await page.waitForTimeout(400);
  const lev = page.locator('[data-levain]');
  t = await txt(lev.locator('[data-levain-propagation]')); ok('fiche du levain : tableau de propagation (375 L à tirer le jour prévu)', /375/.test(t), t.slice(0, 300));
  await lev.getByRole('button', { name: '✎ Jours et taux' }).click(); await page.waitForTimeout(200);
  await lev.getByRole('button', { name: '＋ Jour' }).click(); await lev.getByLabel('Cols du jour 2').fill('8000'); await lev.getByRole('button', { name: 'Enregistrer le plan' }).click(); await page.waitForTimeout(400);
  d = await db(); const pl = d.ops.find((o) => o.id === opL.id).levainPlan;
  ok('plan modifié (2e jour, 8 000 cols) : enregistré avec l’opération, la propagation remonte (alimentation la veille)', pl.jours.length === 2 && pl.jours[1].cols === 8000 && /Total/.test(await txt(lev.locator('[data-levain-propagation]'))), pl);
  t = await txt(lev.locator('[data-levain-recalibrer]')); ok('recalibrage avant le 1er jour de tirage : suivre la préparation par étapes', /Avant le premier jour de tirage/.test(t), t);
  await lev.getByLabel('Date du recalibrage').fill(pl.jours[0].date); await page.waitForTimeout(250);
  t = await txt(lev.locator('[data-levain-recalibrer]')); ok('… le jour du tirage : besoin pour la suite (300 L) et alimentation proposée (liqueur, vin, eau, phosphates)', /besoin pour la suite : 300 L/.test(t) && /À ajouter/.test(t), t);
  await lev.getByLabel('Date du recalibrage').fill('2026-11-27'); await page.waitForTimeout(150);
  // étape saisie depuis la préparation par étapes
  await lev.getByRole('button', { name: 'Saisir', exact: true }).first().click(); await page.waitForTimeout(400);
  await ov().getByLabel('Température relevée').fill('34'); await ov().getByLabel('Densité du levain').fill('994'); await page.waitForTimeout(200);
  ok('densité sous le minimum : rappel de la recharge en sucre', /ajouter environ 20 g\/L/i.test(await txt(ov())));
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  d = await db(); const al = d.ops.find((o) => o.type === 'alimentation');
  ok('étape « Réhydratation » enregistrée (opération « alimentation » : eau, relevés)', al && al.etape === 'rehydratation' && al.prepId === opL.prepId && al.mesures.tempReleve === 34 && al.eauL > 0, al);
  t = await txt(lev); ok('journal du levain : étape listée, volume disponible augmenté', /Réhydratation/.test(t), t.slice(0, 200));
  await page.screenshot({ path: `${SC}/shots/t78-levain.png`, fullPage: true });
  await lev.page().getByRole('button', { name: '🖨 Plan du levain…' }).click(); await page.waitForTimeout(400);
  ok('plan du levain imprimable (préparation, propagation)', (await page.locator('[data-levain-rapport]').count()) === 1 && /Propagation/.test(await txt(page.locator('[data-levain-rapport]'))));
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // ---- profil de tirage (Paramètres › Calculs œnologiques)
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="calculs"]').click(); await page.waitForTimeout(300);
  const pf = page.locator('[data-tirage-profil]'); await pf.getByLabel('Levain incorporé (%)').fill('4'); await pf.getByRole('button', { name: 'Enregistrer le profil' }).click(); await page.waitForTimeout(300);
  d = await db(); ok('profil de tirage enregistré (levain 4 %), sans point de tirage (choisi pour chaque cuvée)', d.settings.tirageProfil && d.settings.tirageProfil.levainPct === 4 && d.settings.tirageProfil.pointGL === undefined && (await pf.getByLabel(/Point de tirage/).count()) === 0, d.settings.tirageProfil);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t78)'); process.exitCode = ko ? 1 : 0;
