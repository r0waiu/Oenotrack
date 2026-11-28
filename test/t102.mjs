// 0.49.0-alpha.2 : renouvellement de la connexion Google Drive (jeton d'une heure, fenêtre de Google) — plus jamais sur l'écran de
// connexion ou de verrouillage ni dans un champ de saisie (la fenêtre prenait la main pendant la saisie du mot de passe) ; au premier
// clic sur un bouton ou un onglet une fois connecté. Google simulé (window.google), aucun appel réel. Données fictives (jeu d'exemple).
import { open } from './ui.mjs';
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const INIT = `try {
  localStorage.setItem('oenotrack-cloud', JSON.stringify({ fournisseur: 'google', dossier: { id: 'dossier-fictif', nom: 'Œnotrack' } }));
  localStorage.setItem('oenotrack-config', JSON.stringify({ google: { clientId: 'fictif.apps.googleusercontent.com' } }));
} catch (e) {}
window.__gis = 0;
window.google = { accounts: { oauth2: { hasGrantedAllScopes: () => true, initTokenClient: (o) => ({ requestAccessToken: () => { window.__gis += 1; setTimeout(() => o.error_callback && o.error_callback({ type: 'popup_closed' }), 10); } }) } } };`;
const { browser, page, errors } = await open({ init: { content: INIT }, viewport: { width: 1360, height: 900 }, routes: async (route, u) => { if (/googleapis\.com|accounts\.google\.com/.test(u)) { await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }); return true; } return false; } });
const gis = () => page.evaluate(() => window.__gis);
const ov = () => page.locator('.overlay').last();
await page.waitForTimeout(600);
// connecté (sans identifiants) : un champ de saisie n'ouvre rien, un onglet ouvre la fenêtre
await page.locator('[data-recherche-globale] input').click(); await page.waitForTimeout(200);
ok('clic dans un champ de saisie : pas de fenêtre Google', (await gis()) === 0);
await page.click('#tab-pressoir'); await page.waitForTimeout(300);
ok('clic sur un onglet : fenêtre de renouvellement (une fois)', (await gis()) === 1);
await page.click('#tab-tirage'); await page.waitForTimeout(300);
ok('… pas plus d’une fois en 30 s', (await gis()) === 1);
// identifiants puis verrouillage : rien sur l'écran verrouillé
await page.evaluate(() => { window.__gis = 0; });
await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: 'Utilisateurs & droits' }).first().click(); await page.waitForTimeout(350);
const fa = page.locator('main [data-activation] form'); const MDP = 'Essai-2026!zz';
await fa.locator('input[aria-label="Identifiant"]').fill('admin'); await fa.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Admin Essai');
await fa.locator('input[aria-label="Mot de passe"]').fill(MDP); await fa.locator('input[aria-label="Confirmer le mot de passe"]').fill(MDP);
await fa.locator('button[type=submit]').click(); await page.waitForTimeout(1800);
await ov().locator('label', { hasText: 'J’ai noté ce code' }).locator('input').check(); await ov().locator('button:text-is("Terminer")').click(); await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('[data-utilisateur]').click()); await page.waitForTimeout(250); await ov().locator('button', { hasText: 'Verrouiller' }).click(); await page.waitForTimeout(500);
await page.evaluate(() => { window.__gis = 0; });
ok('écran verrouillé affiché', (await page.locator('[data-verrou]').count()) === 1);
await page.waitForTimeout(31000); // délai de 30 s entre deux fenêtres écoulé (les clics de Paramètres ont renouvelé) : la suite vérifie bien l'écran, pas ce délai
await page.locator('[data-verrou] input[aria-label="Mot de passe"]').click(); await page.waitForTimeout(200);
await page.locator('[data-verrou] h2, [data-verrou] p').first().click().catch(() => {}); await page.waitForTimeout(200);
ok('écran verrouillé : clic dans le mot de passe ou ailleurs → pas de fenêtre Google', (await gis()) === 0);
await page.locator('[data-verrou] input[aria-label="Mot de passe"]').fill(MDP); await page.locator('[data-verrou] button[type=submit]').click(); await page.waitForTimeout(1000);
ok('… « Déverrouiller » non plus', (await gis()) === 0 && (await page.locator('[data-verrou]').count()) === 0);
await page.click('#tab-analyses'); await page.waitForTimeout(300);
ok('déverrouillé : premier clic sur un onglet → fenêtre de renouvellement', (await gis()) === 1);
// déconnexion : écran de connexion
await page.evaluate(() => { window.__gis = 0; });
await page.evaluate(() => document.querySelector('[data-utilisateur]').click()); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(500);
const f = page.locator('[data-connexion] form');
await page.waitForTimeout(31000); // délai de 30 s entre deux fenêtres écoulé
if (await f.locator('input[aria-label="Identifiant"]').count()) await f.locator('input[aria-label="Identifiant"]').click();
await f.locator('input[aria-label="Mot de passe"]').click(); await page.locator('[data-connexion]').first().click({ position: { x: 5, y: 5 } }); await page.waitForTimeout(200);
ok('écran de connexion : aucun clic n’ouvre la fenêtre Google', (await gis()) === 0);
const err = errors.filter((e) => !/Failed to load resource|googleapis|accounts\.google/.test(e));
ok('aucune erreur dans la page', err.length === 0, err);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t102)'); process.exitCode = ko ? 1 : 0;
