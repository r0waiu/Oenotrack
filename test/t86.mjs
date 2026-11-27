// 0.45.0-alpha.1 : revendication « BIO » et code d'agrément de l'organisme certificateur (Paramètres › Revendications, stades & listes ;
// affiché comme revendication dans la cuverie), visite guidée par chapitres (sommaire, « Tout voir » de bout en bout, retour au sommaire),
// anglais. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  ok('jeu d’exemple : la revendication bio s’appelle « BIO »', (await db()).lists.qualifs.find((q) => q.id === 'bio').label === 'BIO');
  // ---- code d'agrément dans Paramètres
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="listes"]').click(); await page.waitForTimeout(400);
  const box = page.locator('[data-qualif-agrement="bio"]');
  ok('Paramètres : code d’agrément et organisme proposés pour BIO seulement', (await box.count()) === 1 && (await page.locator('[data-qualif-agrement="dem"]').count()) === 0 && (await page.locator('[data-qualif-agrement="conv"]').count()) === 0);
  await box.getByLabel('Code d’agrément de BIO').fill('Ecocert'); await box.getByLabel('Code d’agrément de BIO').press('Enter'); await page.waitForTimeout(400);
  ok('format invalide refusé (rien d’enregistré)', !(await db()).lists.qualifs.find((q) => q.id === 'bio').codeAgrement && /invalide/.test(await page.locator('.toast').last().innerText().catch(() => '')));
  await box.getByLabel('Code d’agrément de BIO').fill('fr-bio-01'); await box.getByLabel('Code d’agrément de BIO').press('Enter'); await page.waitForTimeout(400);
  await box.getByLabel('Organisme certificateur de BIO').fill('Organisme fictif'); await box.getByLabel('Organisme certificateur de BIO').press('Enter'); await page.waitForTimeout(400);
  let b = (await db()).lists.qualifs.find((q) => q.id === 'bio');
  ok('code d’agrément enregistré en majuscules, organisme ; le nom reste « BIO »', b.codeAgrement === 'FR-BIO-01' && b.organisme === 'Organisme fictif' && b.label === 'BIO', b);
  ok('… aide : affiché comme revendication, reste du bio', /Affiché comme revendication : FR-BIO-01 \(reste du bio\)/.test(await txt(box)));
  // ---- affiché partout : liste des lots de la cuverie
  await page.click('#tab-vinification'); await page.waitForTimeout(300); await page.click('#tab-cuverie'); await page.waitForTimeout(300);
  await page.getByRole('tab', { name: 'Lots', exact: true }).click(); await page.waitForTimeout(500);
  t = await txt(page.locator('main'));
  ok('cuverie › Lots : la revendication des lots bio est le code d’agrément', /FR-BIO-01/.test(t), t.slice(0, 400));
  await page.screenshot({ path: `${SC}/shots/t86-lots.png` });
  // ---- visite guidée : sommaire, tout voir
  await page.locator('[data-visite-bouton]').click(); await page.waitForTimeout(400);
  const chaps = await page.locator('[data-visite-chapitre]').evaluateAll((e) => e.map((x) => x.getAttribute('data-visite-chapitre')));
  ok('visite : sommaire avec un chapitre par module affiché', chaps[0] === 'prise' && ['cuverie', 'pressoir', 'ops', 'previsions', 'plan', 'tirage', 'cave', 'degorgement', 'analyses', 'intrants', 'hygiene', 'equipements', 'trace', 'registres', 'params'].every((c) => chaps.includes(c)), chaps);
  await page.screenshot({ path: `${SC}/shots/t86-sommaire.png` });
  await page.locator('[data-visite-tout]').click();
  const vus = []; let fin = false;
  for (let k = 0; k < 90; k++) {
    await page.waitForSelector('.visite-bulle', { timeout: 6000 }).catch(() => {}); await page.waitForTimeout(120);
    if (await page.locator('[data-visite-sommaire]').count()) { fin = true; break; }
    vus.push(await page.locator('[data-visite-chap]').getAttribute('data-visite-chap'));
    if (vus.length === 8) await page.screenshot({ path: `${SC}/shots/t86-etape.png` });
    await page.locator('[data-visite-suivant]').click();
  }
  const parcourus = [...new Set(vus)];
  ok('« Tout voir » : toutes les étapes de tous les chapitres, onglets ouverts au fur et à mesure, puis fin de la visite', fin && vus.length >= 45 && chaps.every((c) => parcourus.includes(c)) && /Fin de la visite/.test(await txt(page.locator('[data-visite-sommaire]'))), { n: vus.length, manquants: chaps.filter((c) => !parcourus.includes(c)) });
  ok('… la visite a ouvert le dernier chapitre (Paramètres)', (await page.locator('[data-params]').count()) === 1);
  await page.locator('[data-visite-chapitre="tirage"]').click(); await page.waitForTimeout(1200);
  ok('chapitre seul (Tirages) : onglet Tirages ouvert, étape 1', (await page.locator('[data-visite-chap="tirage"][data-visite="1"]').count()) === 1 && (await page.locator('[data-tirage-calcul]').count()) === 1);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok('Échap : visite fermée', (await page.locator('.visite').count()) === 0);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ init: { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" }, viewport: { width: 1280, height: 900 } });
  await page.locator('[data-visite-bouton]').click(); await page.waitForTimeout(500);
  t = await txt(page.locator('[data-visite-sommaire]'));
  ok('en anglais : « Getting started », « See everything », chapitres traduits', /Getting started/.test(t) && /See everything/.test(t) && /Cellar & lots/.test(t), t.slice(0, 300));
  await page.locator('[data-visite-chapitre="params"]').click(); await page.waitForTimeout(1200);
  ok('… étape en anglais', /Sections/.test(await txt(page.locator('.visite-bulle'))));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t86)'); process.exitCode = ko ? 1 : 0;
