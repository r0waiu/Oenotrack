// 0.49.0-alpha.1 : socle de l'assistant IA dans Paramètres › Assistant IA — usages (interrupteurs, niveaux, valeurs par défaut), niveau 2
// réservé au modèle local (administrateur, réglage commun), journal des envois (affichage, vidage) ; aperçu avant le premier envoi de
// niveau 2 (« Annuler » : rien n'est envoyé) ; anglais. Service simulé, données fictives.
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const IA = { fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-essai' }, modeles: { anthropic: 'modele-essai' } };
const JOURNAL = [{ le: '2026-11-28T09:00:00Z', usage: 'reception', niveau: 1, fournisseur: 'anthropic', modele: 'modele-essai', taille: 120000, images: 1, ok: true }, { le: '2026-11-28T08:00:00Z', usage: 'aide', niveau: 0, fournisseur: 'anthropic', modele: 'modele-essai', taille: 4000, images: 0, ok: false, erreur: 'refus' }];
const init = (en) => ({ content: `if (!sessionStorage.getItem('t100')) { localStorage.setItem('oenotrack-ia', ${JSON.stringify(JSON.stringify(IA))}); localStorage.setItem('oenotrack-ia-journal', ${JSON.stringify(JSON.stringify(JOURNAL))}); ${en ? "localStorage.setItem('oenotrack-langue', 'en');" : ''} sessionStorage.setItem('t100', '1'); }` });
let envois = 0;
const routes = async (route, u) => { if (u.startsWith('https://api.anthropic.com/')) { envois += 1; await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: '{"texte":"Histoire fictive."}' }] }) }); return true; } return false; };
{
  const { browser, page, errors } = await open({ init: init(false), routes, viewport: { width: 1360, height: 900 } });
  const cfg = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-ia') || '{}'));
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="ia"]').click(); await page.waitForTimeout(500);
  const U = page.locator('[data-ia-usages]');
  ok('usages listés avec leur niveau ; niveau 2 désactivé par défaut, niveaux 0 et 1 activés', (await U.locator('tr[data-ia-usage]').count()) >= 24 && /Niveau 2/.test(await txt(U.locator('tr[data-ia-usage="saisie"]'))) && !(await U.locator('tr[data-ia-usage="saisie"] input[type=checkbox]').isChecked()) && (await U.locator('tr[data-ia-usage="reception"] input[type=checkbox]').isChecked()) && (await U.locator('tr[data-ia-usage="aide"] input[type=checkbox]').isChecked()));
  await U.locator('tr[data-ia-usage="histoireLot"] input[type=checkbox]').check(); await page.waitForTimeout(200);
  await U.locator('tr[data-ia-usage="aide"] input[type=checkbox]').uncheck(); await page.waitForTimeout(200);
  let c = await cfg(); ok('… interrupteurs gardés sur cet appareil (oenotrack-ia › usages), clé conservée', c.usages && c.usages.histoireLot === true && c.usages.aide === false && !!(c.cles || {}).anthropic);
  await page.locator('[data-ia-niveau2]').selectOption('local'); await page.waitForTimeout(400);
  const db = await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  ok('niveau 2 réservé au modèle local : réglage commun de la base (administrateur)', db.settings.ia && db.settings.ia.niveau2 === 'local');
  await page.locator('[data-ia-niveau2]').selectOption('tous'); await page.waitForTimeout(400);
  const J = page.locator('[data-ia-journal]'); const tj = await txt(J);
  ok('journal : envois listés (usage, niveau, service, taille, résultat), jamais le contenu', /2 envoi/.test(tj) && /Photo d’un sac/.test(tj) && /reçu/.test(tj) && /échec/.test(tj) && /117 ko · 1 image/.test(tj));
  await J.getByRole('button', { name: 'Vider le journal' }).click(); await page.waitForTimeout(300);
  ok('… « Vider le journal » : plus rien sur l’appareil', /Aucun envoi/.test(await txt(J)) && (await page.evaluate(() => localStorage.getItem('oenotrack-ia-journal'))) === null);
  await page.screenshot({ path: `${SC}/shots/t100-usages.png`, fullPage: false });
  // aperçu avant le premier envoi de niveau 2 : histoire d'un lot
  await page.click('#tab-vinification'); await page.waitForTimeout(300); await page.click('#tab-cuverie'); await page.waitForTimeout(300);
  await page.getByRole('tab', { name: 'Lots', exact: true }).click(); await page.waitForTimeout(400);
  await page.locator('main tbody tr').first().click(); await page.waitForTimeout(600);
  await page.locator('[data-ia-histoire-btn]').click(); await page.waitForTimeout(500);
  const ap = page.locator('[data-ia-apercu="histoireLot"]');
  ok('niveau 2 : aperçu de ce qui part avant le premier envoi (niveau, service, texte), rien d’envoyé', (await ap.count()) === 1 && /Niveau 2/.test(await txt(page.locator('.overlay').last())) && /modele-essai/.test(await txt(page.locator('.overlay').last())) && envois === 0);
  await page.locator('.overlay').last().getByRole('button', { name: 'Annuler', exact: true }).click(); await page.waitForTimeout(400);
  c = await cfg(); ok('… « Annuler » : rien n’est envoyé, aucun accord gardé', envois === 0 && !(c.consentements || {}).histoireLot && (await page.locator('[data-ia-apercu]').count()) === 0);
  await page.locator('[data-ia-histoire-btn]').click(); await page.waitForTimeout(500);
  await page.locator('[data-ia-toujours]').click(); await page.waitForTimeout(800);
  c = await cfg(); ok('… « Envoyer et ne plus demander » : envoyé, accord gardé sur l’appareil, journal tenu', envois === 1 && !!(c.consentements || {}).histoireLot && (await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-ia-journal') || '[]').length)) === 1);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ init: init(true), routes, viewport: { width: 390, height: 844 }, mobile: true });
  await page.locator('#tab-params').scrollIntoViewIfNeeded(); await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="ia"]').click(); await page.waitForTimeout(500);
  const t = await txt(page.locator('[data-ia-usages]'));
  ok('en anglais, au téléphone : « AI uses », « Level 2 », sans débordement', /AI uses/.test(t) && /Level 2/.test(t) && (await page.evaluate(() => document.documentElement.scrollWidth)) <= 391, t.slice(0, 300));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t100)'); process.exitCode = ko ? 1 : 0;
