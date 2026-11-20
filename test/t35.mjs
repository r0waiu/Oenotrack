// 0.15.0-alpha.1 : base avec identifiants (fixture) — écran de connexion à l'ouverture, droits du laboratoire, synchronisation d'un compte désactivé
import fs from 'fs';
import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const fx = JSON.parse(fs.readFileSync(new URL('./fixtures/base-0.15.0-alpha.1-identifiants.json', import.meta.url), 'utf8'));
const db0 = fx.db;
const init = { content: `if (!sessionStorage.getItem('semee')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(db0))}); sessionStorage.setItem('semee', '1'); }` };
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗', name, x !== undefined ? `→ ${String(x).replace(/\s+/g, ' ').slice(0, 200)}` : ''); };
const { browser, page, errors } = await open({ init });
const sheet = () => page.locator('.overlay').last();
const onglets = async () => page.$$eval('.navtabs [role=tab]', (b) => b.map((x) => x.id.replace('tab-', '')));
const login = async (ident, mdp) => { const f = page.locator('[data-connexion] form'); await f.locator('input[aria-label="Identifiant"]').fill(ident); await f.locator('input[aria-label="Mot de passe"]').fill(mdp); await f.locator('button[type=submit]').click(); await page.waitForTimeout(1000); };
ok('base avec identifiants : écran de connexion à l’ouverture, aucune donnée affichée', (await page.locator('[data-connexion]').count()) === 1 && !(await page.locator('body').innerText()).includes('Cuve 08'));
// laboratoire : mot de passe provisoire puis droits « analyses »
await login('labo', 'Provisoire-15');
await sheet().locator('input[aria-label="Nouveau mot de passe"]').fill('Labo-Claire-2026'); await sheet().locator('input[aria-label="Confirmer le nouveau mot de passe"]').fill('Labo-Claire-2026'); await sheet().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(900);
const o = await onglets();
ok('laboratoire : pas de Registres ni de Paramètres', !o.includes('registres') && !o.includes('params') && o.includes('analyses'), o.join());
await page.click('#tab-analyses'); await page.waitForTimeout(300);
ok('Analyses en saisie : pas de bandeau de consultation', !(await page.locator('main').innerText()).includes('permet de consulter ce module'));
await page.click('#tab-ops'); await page.waitForTimeout(300);
const ligne = page.locator('main table tbody tr').filter({ hasText: 'Jaugeage' }).first();
ok('journal : « saisie : Thomas Girard »', (await ligne.innerText()).includes('saisie : Thomas Girard'));
// compte désactivé depuis un autre appareil (synchronisation) : déconnexion
await page.evaluate(() => { const k = 'oenotrack-db-v2'; const d = JSON.parse(localStorage.getItem(k)); d.utilisateurs.find((u) => u.identifiant === 'labo').actif = false; localStorage.setItem(k, JSON.stringify(d)); });
await page.reload(); await page.waitForTimeout(1500);
ok('compte désactivé ailleurs : retour à l’écran de connexion', (await page.locator('[data-connexion]').count()) === 1);
await login('thomas', 'Fixture-Thomas-15');
ok('opérateur connecté (mot de passe définitif)', (await page.locator('[data-utilisateur]').innerText()).includes('Thomas Girard'));
// réinitialiser la base : réservé (pas de bouton de sauvegarde pour l'opérateur)
ok('opérateur : pas de pastille « sauvegarde »', (await page.locator('header button', { hasText: /sauvegarde/i }).count()) === 0);
await page.screenshot({ path: SH + '/t35.png' });
console.log('ERREURS:', errors.join(' | ') || 'aucune'); if (errors.length) ko++;
await browser.close();
console.log(ko ? `${ko} ÉCHEC(S)` : 'T35 OK');
