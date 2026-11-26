// 0.21.0-alpha.1 (revu en 0.22.0-alpha.1) : informations légales — liens du pied de page, cinq pages, adresses directes (#cgu…),
// plus de réglage dans les Paramètres (ancien réglage de l'appareil effacé), mentions lues dans le config.json du site et gardées
// par le config.json des identifiants Drive, lien vers le dépôt et code-source.zip, écran de connexion, téléphone
import { open } from './ui.mjs'; import fs from 'fs'; import path from 'path';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
const log = (...a) => console.log(...a); const ok = (n, c, x) => log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined ? x : '');
const ancien = `try { if (!sessionStorage.getItem('t42m')) { localStorage.setItem('oenotrack-mentions', ${JSON.stringify(JSON.stringify({ editeur: { statut: 'particulier', nom: 'Ancien Réglage', email: 'ancien@exemple-oeno.fr' } }))}); sessionStorage.setItem('t42m', '1'); } } catch (e) {}`;
const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 }, init: ancien });
const top = () => page.locator('.overlay').last(); const txt = async () => (await top().innerText()).replace(/\s+/g, ' ');
const onglet = async (nom) => { await top().locator('[role=tab]', { hasText: nom }).click(); await page.waitForTimeout(150); };

// 1. liens du pied de page et les cinq pages
const liens = await page.locator('.appfoot .legal-liens button').allInnerTexts();
ok('pied de page : mentions légales, confidentialité, CGU, code source & licence', liens.join('|') === 'Mentions légales|Confidentialité|CGU|Code source & licence', liens);
await page.locator('.appfoot .legal-liens button', { hasText: 'Mentions légales' }).click(); await page.waitForTimeout(300);
ok('cinq pages', (await top().locator('[role=tab]').allInnerTexts()).join('|') === 'Mentions légales|Confidentialité|CGU|Code source & licence|Réglementation');
let t = await txt();
ok('mentions non renseignées : à compléter, rien d’inventé', /Mentions en cours de mise en place : nom de l’hébergeur, adresse de l’hébergeur/.test(t) && /hébergeur du site à compléter/.test(t) && /adresse de contact à compléter/.test(t) && /article 1-1 de la loi n° 2004-575/.test(t) && !/Ancien Réglage/.test(t));
await onglet('Confidentialité'); t = await txt();
ok('confidentialité : données dans le navigateur, aucun cookie, services cités, IA et Drive facultatifs, droits, CNIL', /sur votre appareil/.test(t) && /aucun cookie/.test(t) && /Google Fonts/.test(t) && /cdnjs/.test(t) && /jsDelivr/.test(t) && /votre propre compte et votre clé/.test(t) && /Jamais vos volumes/.test(t) && /articles 15 à 21/.test(t) && /cnil\.fr/.test(t));
await onglet('CGU'); t = await txt();
ok('CGU : gratuit, version de test, sauvegardes, outil d’aide, responsabilité, droit français', /gratuit/.test(t) && /alpha/.test(t) && /seul responsable de leur conservation/.test(t) && /ne remplace ni vos registres/.test(t) && /Sauf faute lourde ou intentionnelle/.test(t) && /droit français/.test(t));
await onglet('Code source & licence'); t = await txt();
ok('licence : AGPL v3 ou ultérieure, article 13, nom et logo réservés, composants', /GNU Affero General Public License, version 3/.test(t) && /article 13/.test(t) && /article 7 e/.test(t) && (await top().locator('.legal-tableau tbody tr').count()) >= 7 && (await top().locator('a[href="https://github.com/r0waiu/Oenotrack"]').count()) >= 1 && /github\.com\/r0waiu\/Oenotrack/.test(t) && !/Télécharger le code source/.test(t));
await onglet('Réglementation'); t = await txt();
ok('réglementation : registres, pratiques œnologiques, FDS, hygiène', /2018\/273/.test(t) && /2019\/934/.test(t) && /1907\/2006/.test(t) && /852\/2004/.test(t));
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), top().locator('button', { hasText: '⬇ HTML' }).click()]);
const html = fs.readFileSync(await dl.path(), 'utf8'); ok('page téléchargeable (HTML)', /Réglementation/.test(html) && /2018\/273/.test(html), dl.suggestedFilename());
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
// 2. adresse directe : …/#licence ouvre la page
await page.evaluate(() => { window.location.hash = '#licence'; }); await page.waitForTimeout(400);
ok('adresse #licence : page « Code source & licence » ouverte', (await page.locator('.overlay').count()) === 1 && (await top().locator('[role=tab][aria-selected=true], [role=tab].on, [role=tab][data-on]').first().innerText().catch(() => '')).includes('licence') || /Code source & licence/.test(await top().locator('.legal-doc h2').innerText()));
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
ok('fermée : l’adresse revient sans #licence', !(await page.evaluate(() => window.location.hash)));
// 3. 0.22.0-alpha.1 : plus de réglage des mentions dans les Paramètres (elles viennent du config.json du site) ; l'ancien réglage de l'appareil est effacé
await page.click('#tab-params'); await page.waitForTimeout(250);
const sous = await page.locator('main [role=tab]').allInnerTexts();
ok('Paramètres : plus de réglage « Mentions légales & licence »', sous.length >= 5 && !sous.some((x) => /Mentions|licence/i.test(x)), sous);
ok('ancien réglage des mentions sur l’appareil (0.21.0-alpha.1) ignoré et effacé', (await page.evaluate(() => localStorage.getItem('oenotrack-mentions'))) === null);
// identifiants Drive : le config.json proposé n'invente pas de mentions
await page.locator('main [role=tab]', { hasText: 'Sauvegarde & Drive' }).click(); await page.waitForTimeout(300);
const ouvrirGuide = async (pg) => { const det = pg.locator('details.sync-guide').first(); if ((await det.count()) && !(await det.evaluate((e) => e.open))) { await det.locator('summary').click(); await pg.waitForTimeout(150); } };
await ouvrirGuide(page);
{ const btnCfg = page.locator('main button', { hasText: 'Télécharger config.json' });
  if (await btnCfg.count()) { const [d2] = await Promise.all([page.waitForEvent('download', { timeout: 20000 }), btnCfg.first().click()]); const c2 = JSON.parse(fs.readFileSync(await d2.path(), 'utf8')); ok('config.json des identifiants Drive : sans mentions inventées', 'google' in c2 && 'microsoft' in c2 && 'dropbox' in c2 && !('mentions' in c2), c2); }
  else ok('config.json des identifiants Drive : bouton trouvé', false); }
const errs = errors.slice(); ok('aucune erreur de page', !errs.length, errs.slice(0, 3));
await browser.close();

// 4. site en ligne : mentions lues dans config.json, lien vers le dépôt, code-source.zip proposé ; config.json des identifiants Drive qui garde les mentions ; téléphone
{
  const conf = { google: { clientId: '' }, mentions: { editeur: { statut: 'particulier', nom: 'Jean Démo', email: 'contact@exemple-oeno.fr' }, hebergeur: { id: 'ovh' }, site: 'https://www.exemple-oeno.fr', depot: 'https://github.com/demo/oenotrack' } };
  const routes = async (route, u) => {
    if (/config\.json/.test(u)) { await route.fulfill({ contentType: 'application/json', body: JSON.stringify(conf) }); return true; }
    if (/code-source\.zip/.test(u)) { await route.fulfill({ contentType: 'application/zip', body: 'PK' }); return true; }
    return false;
  };
  const { browser: b1, page: p1, errors: e1 } = await open({ routes, viewport: { width: 1440, height: 950 } });
  await p1.locator('.appfoot .legal-liens button', { hasText: 'Mentions légales' }).click(); await p1.waitForTimeout(300);
  const t1 = (await p1.locator('.overlay').last().innerText()).replace(/\s+/g, ' ');
  ok('mentions du config.json : éditeur, contact, directeur, hébergeur', /Site édité à titre non professionnel par Jean Démo/.test(t1) && /Contact : contact@exemple-oeno\.fr/.test(t1) && /Directeur de la publication : Jean Démo/.test(t1) && /OVH SAS \(OVHcloud\)/.test(t1) && /RCS Lille Métropole 424 761 419/.test(t1) && !/Mentions en cours de mise en place/.test(t1) && (await p1.locator('.overlay a[href="mailto:contact@exemple-oeno.fr"]').count()) >= 1);
  await p1.locator('.overlay [role=tab]', { hasText: 'Code source' }).click(); await p1.waitForTimeout(300);
  ok('licence : lien vers le dépôt du config.json', (await p1.locator('.overlay a[href="https://github.com/demo/oenotrack"]').count()) >= 1);
  await p1.screenshot({ path: SC + '/shots/t42-licence.png' });
  await p1.keyboard.press('Escape'); await p1.waitForTimeout(200);
  await p1.click('#tab-params'); await p1.waitForTimeout(250); await p1.locator('main [role=tab]', { hasText: 'Sauvegarde & Drive' }).click(); await p1.waitForTimeout(300);
  await ouvrirGuide(p1); await p1.locator('input[aria-label="ID client Google"]').fill('123-demo.apps.googleusercontent.com');
  const [d3] = await Promise.all([p1.waitForEvent('download', { timeout: 20000 }), p1.locator('main button', { hasText: 'Télécharger config.json' }).first().click()]);
  const c3 = JSON.parse(fs.readFileSync(await d3.path(), 'utf8'));
  ok('config.json des identifiants Drive : mentions du site conservées', c3.mentions && c3.mentions.editeur.nom === 'Jean Démo' && c3.mentions.depot === 'https://github.com/demo/oenotrack' && c3.google.clientId === '123-demo.apps.googleusercontent.com', c3);
  ok('site en ligne (ordinateur) : aucune erreur', !e1.length, e1.slice(0, 2));
  await b1.close();
  const { browser: b2, page: p2, errors: e2 } = await open({ routes, viewport: { width: 390, height: 844 }, mobile: true });
  await p2.evaluate(() => { window.location.hash = '#mentions-legales'; }); await p2.waitForTimeout(500);
  const t2 = (await p2.locator('.overlay').last().innerText()).replace(/\s+/g, ' ');
  ok('site en ligne : mentions lues dans config.json', /Jean Démo/.test(t2) && /OVH SAS/.test(t2) && /exemple-oeno\.fr/.test(t2));
  const larg = await p2.evaluate(() => { const s = document.querySelector('.overlay .sheet'); return s ? s.scrollWidth <= s.clientWidth + 2 : false; });
  await p2.locator('.overlay [role=tab]', { hasText: 'Code source' }).click(); await p2.waitForTimeout(400);
  ok('code source de cette version proposé (code-source.zip)', (await p2.locator('.overlay a[href="code-source.zip"]').count()) === 1);
  ok('téléphone : pages lisibles sans défilement horizontal', larg && await p2.evaluate(() => { const s = document.querySelector('.overlay .sheet'); return s.scrollWidth <= s.clientWidth + 2; }));
  await p2.screenshot({ path: SC + '/shots/t42-mobile.png' });
  ok('téléphone : aucune erreur', !e2.length, e2.slice(0, 2));
  await b2.close();
}

// 5. écran de connexion (identifiants activés, personne connectée) : liens accessibles sans se connecter
{
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src');
  const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f)).sort(); // tous les fichiers du moteur (0.30.0-alpha.1 : catalogues, plafonds…)
  globalThis.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
  const L = new Function('React', files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { sampleDb, normalizeDb, securiteActiver, mdpEmpreinte };')({});
  const d = L.normalizeDb(L.sampleDb()); L.securiteActiver(d, { identifiant: 'admin', mdp: await L.mdpEmpreinte('Admin-2026', 1000) });
  const init = `try { if (!sessionStorage.getItem('t42')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(d))}); sessionStorage.setItem('t42', '1'); } } catch (e) {}`;
  const { browser: b3, page: p3, errors: e3 } = await open({ init, viewport: { width: 1280, height: 900 } });
  ok('écran de connexion affiché', (await p3.locator('[data-connexion]').count()) === 1);
  ok('écran de connexion : liens des informations légales', (await p3.locator('.legal-liens-connexion button').count()) === 4);
  await p3.locator('.legal-liens-connexion button', { hasText: 'CGU' }).click(); await p3.waitForTimeout(300);
  ok('CGU lisibles sans se connecter', /Conditions générales d’utilisation/.test(await p3.locator('.overlay').last().innerText()));
  ok('connexion : aucune erreur', !e3.length, e3.slice(0, 2));
  await b3.close();
}
