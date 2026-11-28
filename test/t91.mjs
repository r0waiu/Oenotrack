// 0.47.0-alpha.3 : onglet ouvert au démarrage, à la connexion et au déverrouillage — trois réglages séparés (Paramètres › Modules), choix
// « Dernière page visitée » (retenue sur cet appareil, par personne, hors de la base) ; anglais. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const choisi = async (id) => (await page.locator(`#tab-${id}`).getAttribute('aria-selected')) === 'true';
  const ov = () => page.locator('.overlay').last();
  const params = async (s) => { await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: s }).first().click(); await page.waitForTimeout(350); };
  await params('Modules');
  const sel = (m) => page.locator(`main select[data-onglet-moment="${m}"]`);
  const o = { d: await sel('demarrage').locator('option').allInnerTexts(), c: await sel('connexion').locator('option').allInnerTexts(), v: await sel('deverrouillage').locator('option').allInnerTexts() };
  ok('trois réglages : démarrage (premier onglet, dernière page…), connexion (comme au démarrage…), déverrouillage (dernière page visitée par défaut…)',
    /Premier onglet/.test(o.d[0]) && o.d[1] === 'Dernière page visitée' && o.c[0] === 'Comme au démarrage' && o.c.includes('Dernière page visitée') && o.v[0] === 'Dernière page visitée' && o.v[1] === 'Comme au démarrage' && o.d.includes('Tirages'), o);
  await page.screenshot({ path: `${SC}/shots/t91-reglages.png` });
  // démarrage : dernière page visitée
  await sel('demarrage').selectOption('derniere'); await page.waitForTimeout(400);
  ok('… démarrage « dernière page visitée » enregistré dans la base', (await db()).settings.ongletDefaut === 'derniere' && /Dernière page visitée/.test(await txt(page.locator('.toast').last())));
  await page.click('#tab-hygiene'); await page.waitForTimeout(400);
  await page.reload(); await page.waitForTimeout(1500);
  ok('rechargement : retour sur la dernière page visitée (Hygiène)', await choisi('hygiene'));
  ok('… retenue sur cet appareil, pas dans la base', !JSON.stringify(await db()).includes('derniere-page') && (await page.evaluate(() => localStorage.getItem('oenotrack-derniere-page') || '')).includes('hygiene'));
  // connexion : Tirages ; déverrouillage : Analyses
  await params('Modules'); await sel('connexion').selectOption('tirage'); await page.waitForTimeout(300); await sel('deverrouillage').selectOption('analyses'); await page.waitForTimeout(300);
  let d = await db(); ok('connexion « Tirages » et déverrouillage « Analyses » enregistrés séparément', d.settings.ongletConnexion === 'tirage' && d.settings.ongletDeverrouillage === 'analyses' && d.settings.ongletDefaut === 'derniere', d.settings);
  // identifiants
  await params('Utilisateurs & droits');
  const fa = page.locator('main [data-activation] form'); const MDP = 'Essai-2026!zz';
  await fa.locator('input[aria-label="Identifiant"]').fill('admin'); await fa.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Admin Essai');
  await fa.locator('input[aria-label="Mot de passe"]').fill(MDP); await fa.locator('input[aria-label="Confirmer le mot de passe"]').fill(MDP);
  await fa.locator('button[type=submit]').click(); await page.waitForTimeout(1800);
  await ov().locator('label', { hasText: 'J’ai noté ce code' }).locator('input').check(); await ov().locator('button:text-is("Terminer")').click(); await page.waitForTimeout(400);
  const login = async (mdp) => { const f = page.locator('[data-connexion] form'); if (await f.locator('input[aria-label="Identifiant"]').count()) await f.locator('input[aria-label="Identifiant"]').fill('admin'); await f.locator('input[aria-label="Mot de passe"]').fill(mdp); await f.locator('button[type=submit]').click(); await page.waitForTimeout(1200); };
  const deconnexion = async () => { await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(500); };
  const verrou = async () => { await page.evaluate(() => document.querySelector('[data-utilisateur]').click()); await page.waitForTimeout(250); await ov().locator('button', { hasText: 'Verrouiller' }).click(); await page.waitForTimeout(500);
    await page.locator('[data-verrou] input[aria-label="Mot de passe"]').fill(MDP); await page.locator('[data-verrou] button[type=submit]').click(); await page.waitForTimeout(900); };
  await deconnexion(); await login(MDP);
  ok('connexion : Tirages (réglage de la connexion, pas celui du démarrage)', await choisi('tirage'));
  await page.click('#tab-cave'); await page.waitForTimeout(300); await verrou();
  ok('déverrouillage : Analyses (réglage du déverrouillage)', (await page.locator('[data-verrou]').count()) === 0 && await choisi('analyses'));
  await params('Modules'); await sel('deverrouillage').selectOption(''); await sel('connexion').selectOption('derniere'); await page.waitForTimeout(300);
  await page.click('#tab-registres'); await page.waitForTimeout(300); await verrou();
  ok('déverrouillage par défaut (dernière page visitée) : la page en cours reste (Registres)', await choisi('registres') && !('ongletDeverrouillage' in (await db()).settings));
  await page.click('#tab-equipements'); await page.waitForTimeout(300); await deconnexion(); await login(MDP);
  ok('connexion « dernière page visitée » : Équipements, dernière page de cette personne', await choisi('equipements'));
  await params('Modules'); await sel('connexion').selectOption(''); await page.waitForTimeout(300); await deconnexion(); await login(MDP);
  ok('connexion « comme au démarrage » (démarrage : dernière page) : Paramètres, dernière page visitée', await choisi('params') && !('ongletConnexion' in (await db()).settings));
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ init: { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" }, viewport: { width: 1280, height: 900 } });
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="modules"]').click(); await page.waitForTimeout(500);
  const t = await txt(page.locator('[data-onglet-defaut]'));
  ok('en anglais : « On start-up », « On sign-in », « On unlock », « Last page visited »', /On start-up/i.test(t) && /On sign-in/i.test(t) && /On unlock/i.test(t) && /Last page visited/.test(t), t.slice(0, 600));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t91)'); process.exitCode = ko ? 1 : 0;
