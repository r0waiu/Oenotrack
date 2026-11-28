// 0.46.0-alpha.1 : région et types de vins réglés à un seul endroit (résumé dans l'identité de la société et les réglages du pressoir,
// lien vers Paramètres › Région & types de vins) ; profil Bordeaux rouges → opérations de vinification en rouge proposées ; électrodialyse
// proposée d'office ; méthode ancestrale au tirage ; anglais. Données fictives (jeu d'exemple).
import { open, vignoble, vignobleRegion, reglerVignoble } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  // ---- identité : résumé et lien
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="entreprise"]').click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-region-societe]'));
  ok('identité de la société : « Région et types de vins » en résumé (plus de choix Champagne / autre)', /Champagne/.test(t) && /Spécificités champenoises actives/.test(t) && (await page.locator('[data-region-societe] [data-region]').count()) === 0, t);
  await page.locator('[data-region-societe] [data-profil-regler]').click(); await page.waitForTimeout(500);
  ok('… le lien ouvre Paramètres › Vignoble', (await page.locator('[data-params-rubrique="profil"] [data-profil]').count()) === 1);
  // ---- profil Bordeaux rouges
  await reglerVignoble(page, 'bordeaux', ['rouge']); await vignoble(page, 'Adaptations'); // 0.50.0-alpha.1 : en direct
  t = await txt(page.locator('[data-vignoble-adaptations]'));
  ok('adaptations Bordeaux rouges : pigeage, macération carbonique, thermovinification, pressurage des marcs proposés', (await Promise.all(['pigeage', 'mac_carbonique', 'thermovinification', 'pressurage_marcs'].map(async (id) => /proposée/.test(await txt(page.locator(`[data-adaptation="op:${id}"]`)))))).every(Boolean) && /Pigeage/.test(t) && /Macération carbonique/.test(t) && /Thermovinification/.test(t) && /Pressurage des marcs/.test(t), t.slice(0, 600));
  ok('… appliqué : pigeage proposé dans le catalogue', (await db()).lists.operations.find((o) => o.id === 'pigeage').masque === false);
  // ---- opérations : nouvelles opérations proposées
  await page.click('#tab-vinification'); await page.waitForTimeout(300); await page.click('#tab-ops'); await page.waitForTimeout(500);
  t = await txt(page.locator('main'));
  ok('Opérations : pigeage, macération finale à chaud ; électrodialyse et stabilisation protéique proposées d’office', /Pigeage/.test(t) && /Macération finale à chaud/.test(t) && /Stabilisation tartrique par électrodialyse/.test(t) && /Stabilisation protéique/.test(t), t.slice(0, 500));
  await page.screenshot({ path: `${SC}/shots/t87-operations.png` });
  await page.locator('main button', { hasText: 'Stabilisation tartrique par électrodialyse' }).first().click(); await page.waitForTimeout(500);
  t = await txt(page.locator('.overlay').last());
  ok('électrodialyse : formulaire de traitement avec pertes, aide affichée', /électrodialyse/i.test(t) && /membranes/.test(t), t.slice(0, 300));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); if ((await page.locator('.overlay').count())) { await page.locator('.overlay').last().getByRole('button', { name: /Annuler|Fermer/ }).first().click().catch(() => {}); await page.waitForTimeout(300); }
  // ---- pressoir : résumé
  await page.click('#tab-pressoir'); await page.waitForTimeout(300); await page.getByRole('tab', { name: 'Réglages' }).click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-region-pressoir]'));
  ok('Pressoir › Réglages : même résumé (Bordeaux, vins rouges, spécificités champenoises désactivées)', /Bordeaux/.test(t) && /rouges/i.test(t) && /désactivées/.test(t), t);
  // ---- tirage : méthode ancestrale
  await page.click('#tab-tirage').catch(() => {}); await page.waitForTimeout(200);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  await page.click('#tab-tirage'); await page.waitForTimeout(300); await page.getByRole('tab', { name: /Tirer/ }).click(); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: 'Nouveau tirage' }).first().click(); await page.waitForTimeout(600);
  ok('aide du tirage : méthode ancestrale citée', /méthode ancestrale/.test(await txt(page.locator('main'))));
  const sel = page.locator('.overlay').last().getByLabel('Mode de tirage');
  const opts = await sel.locator('option').evaluateAll((e) => e.map((x) => x.value));
  ok('tirage : mode « Méthode ancestrale » proposé', opts.includes('ancestrale'), opts);
  ok('aucune erreur (tirage)', errors.length === 0, errors); await browser.close();
}
{
  const { browser, page, errors } = await open({ init: { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" }, viewport: { width: 1280, height: 900 } });
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="entreprise"]').click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-region-societe]'));
  ok('en anglais : « Set up the vineyard », « Champagne specifics active »', /Set up the vineyard/.test(t) && /Champagne specifics active/.test(t), t);
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t87)'); process.exitCode = ko ? 1 : 0;
