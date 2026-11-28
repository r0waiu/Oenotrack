// 0.49.0-alpha.2 : session verrouillée sur un appareil qui a sa clé d'accès — l'empreinte, le visage ou le code PIN d'abord (bouton
// principal), mot de passe à un clic (« Utiliser le mot de passe ») ; déverrouillage par clé et par mot de passe ; anglais.
// Authentificateur virtuel de Chromium (empreinte vérifiée). Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
for (const lg of ['fr', 'en']) {
  const init = lg === 'en' ? { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" } : undefined;
  const { browser, page, errors, ctx } = await open({ https: true, init, viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last();
  const cdp = await ctx.newCDPSession(page); await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main [data-params-menu] button').filter({ hasText: lg === 'en' ? /Users/ : /Utilisateurs & droits/ }).first().click(); await page.waitForTimeout(350);
  const fa = page.locator('main [data-activation] form'); const MDP = 'Essai-2026!zz';
  await fa.locator('input[aria-label="Identifiant"], input[aria-label="Username"]').first().fill('admin'); await fa.locator('label').nth(1).locator('input').fill('Admin Essai');
  const mdps = fa.locator('input[type=password]'); await mdps.nth(0).fill(MDP); await mdps.nth(1).fill(MDP);
  await fa.locator('button[type=submit]').click(); await page.waitForTimeout(1800);
  await ov().locator('input[type=checkbox]').last().check(); await ov().locator('.sheet-f .btn-primary, .sheet-f button').last().click(); await page.waitForTimeout(400);
  await page.locator('[data-cle-ajouter]').first().click(); await page.waitForTimeout(1800);
  ok(`${lg} : clé de cet appareil enregistrée et retenue sur l’appareil (hors de la base)`, await page.evaluate(() => { const ici = JSON.parse(localStorage.getItem('oenotrack-cles-ici') || '{}'); const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const k = d.utilisateurs[0].cles[0]; return !!ici[k.id] && !JSON.stringify(d).includes('cles-ici'); }));
  const verrouiller = async () => { await page.evaluate(() => document.querySelector('[data-utilisateur]').click()); await page.waitForTimeout(250); await ov().locator('button', { hasText: lg === 'en' ? /Lock/ : /Verrouiller/ }).first().click(); await page.waitForTimeout(600); };
  await verrouiller();
  const v = page.locator('[data-verrou]');
  const t1 = await txt(v);
  ok(`${lg} : écran verrouillé — empreinte d’abord (bouton principal, focus), pas de champ de mot de passe, « Utiliser le mot de passe »`,
    (await v.locator('[data-cle-connexion][data-cle-principal].btn-primary').count()) === 1 && (await v.locator('input[type=password]').count()) === 0 && (await v.locator('button[type=submit]').count()) === 0 && (await v.locator('[data-mdp-afficher]').count()) === 1
    && await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-cle-connexion'))
    && (lg === 'en' ? /Admin Essai: unlock with your fingerprint, face or PIN\./.test(t1) && /Use the password/.test(t1) : /Admin Essai : déverrouillez avec votre empreinte, votre visage ou votre code PIN\./.test(t1) && /Utiliser le mot de passe/.test(t1)), t1);
  await page.screenshot({ path: `${SC}/shots/t103-verrou-${lg}.png` });
  await v.locator('[data-cle-connexion]').click(); await page.waitForTimeout(2500);
  ok(`${lg} : déverrouillé par l’empreinte (sans mot de passe)`, (await page.locator('[data-verrou]').count()) === 0 && (await page.locator('[data-utilisateur]').count()) === 1);
  await verrouiller();
  await v.locator('[data-mdp-afficher]').click(); await page.waitForTimeout(250);
  ok(`${lg} : « Utiliser le mot de passe » — champ (focus), « Déverrouiller », empreinte en second, « Mot de passe oublié ? »`, (await v.locator('input[type=password]').count()) === 1 && await page.evaluate(() => document.activeElement && document.activeElement.type === 'password') && (await v.locator('button[type=submit]').count()) === 1 && (await v.locator('[data-cle-connexion]:not([data-cle-principal])').count()) === 1 && (await v.locator('details.login-aide').count()) === 1);
  await v.locator('input[type=password]').fill(MDP); await v.locator('button[type=submit]').click(); await page.waitForTimeout(1200);
  ok(`${lg} : déverrouillé par le mot de passe`, (await page.locator('[data-verrou]').count()) === 0);
  await verrouiller();
  ok(`${lg} : verrouillé de nouveau — l’empreinte revient d’abord`, (await v.locator('[data-cle-connexion][data-cle-principal]').count()) === 1);
  ok(`${lg} : aucune erreur`, errors.length === 0, errors);
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t103)'); process.exitCode = ko ? 1 : 0;
