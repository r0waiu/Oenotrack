// 0.23.0-alpha.1 : page d'accueil — présentée à la toute première ouverture seulement (jusqu'à « Ouvrir Œnotrack »), jamais pour qui utilisait
// déjà Œnotrack, ni au retour d'une connexion Drive ; liens légaux et politique de confidentialité (accès au Drive détaillé) ; « Présentation »
// dans le pied de page pour la revoir ; adresse directe #cgu ; téléphone et mode sombre
import { open } from './ui.mjs'; import fs from 'fs'; import path from 'path';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 300) : ''); };
const marque = (pg) => pg.evaluate(() => localStorage.getItem('oenotrack-accueil'));
const accueil = (pg) => pg.locator('[data-accueil]');

// 1. toute première ouverture
{
  const { browser, page, errors } = await open({ accueil: true, viewport: { width: 1440, height: 950 } });
  const t = (await accueil(page).innerText().catch(() => '')).replace(/\s+/g, ' ');
  ok('première ouverture : page d’accueil seule (pas d’onglets ni d’en-tête de l’application)', (await accueil(page).count()) === 1 && (await page.locator('[role=tab]').count()) === 0 && (await page.locator('header.topbar').count()) === 0);
  ok('nom exact et présentation : Œnotrack, traçabilité de cuverie et de chai, ce qu’il fait, comment ça marche, vos données', (await page.locator('h1').innerText()) === 'Œnotrack' && /Traçabilité de cuverie et de chai/.test(t) && /logiciel libre et gratuit/.test(t) && /Ce que fait Œnotrack/.test(t) && (await page.locator('.accueil-carte').count()) === 12 && /Comment ça marche/.test(t) && /Vos données restent chez vous/.test(t) && /Google Drive/.test(t) && /pas de cookie/.test(t), t.slice(0, 300));
  ok('liens : mentions légales, confidentialité, CGU, code source & licence ; site officiel oenotrack.pages.dev', (await page.locator('.accueil-pied .legal-liens button').allInnerTexts()).join('|') === 'Mentions légales|Confidentialité|CGU|Code source & licence' && (await page.locator('.accueil-pied a[href="https://oenotrack.pages.dev"]').count()) === 1);
  ok('marque « a-voir » ; rien d’autre de la page dans la base', (await marque(page)) === 'a-voir' && !(await page.evaluate(() => (localStorage.getItem('oenotrack-db-v2') || '').includes('oenotrack-accueil'))));
  await page.locator('.accueil-donnees button', { hasText: 'politique de confidentialité' }).click(); await page.waitForTimeout(300);
  const tc = (await page.locator('.overlay').last().innerText()).replace(/\s+/g, ' ');
  ok('politique de confidentialité ouverte depuis l’accueil : accès au Drive détaillé, retrait, utilisation limitée des données Google', /Politique de confidentialité/.test(tc) && /Ce qu’Œnotrack fait de l’accès à votre compte/.test(tc) && /dans ce dossier seulement/.test(tc) && /Il n’ouvre pas vos autres fichiers/.test(tc) && /utilisation limitée/.test(tc) && (await page.locator('.overlay a[href="https://developers.google.com/terms/api-services-user-data-policy"]').count()) === 1, tc.slice(0, 200));
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  ok('politique fermée : retour à l’accueil', (await accueil(page).count()) === 1 && (await page.locator('.overlay').count()) === 0);
  await page.reload(); await page.waitForTimeout(1200);
  ok('rouverte avant d’être entré : l’accueil est encore là', (await accueil(page).count()) === 1 && (await marque(page)) === 'a-voir');
  await page.screenshot({ path: SC + '/shots/t44-accueil.png' });
  await page.locator('[data-accueil-ouvrir]').first().click(); await page.waitForTimeout(500);
  ok('« Ouvrir Œnotrack » : l’application s’ouvre (jeu d’exemple), marque « vu »', (await accueil(page).count()) === 0 && (await page.locator('[role=tab]').count()) > 5 && /Jeu de données d’exemple/.test(await page.locator('header').innerText()) && (await marque(page)) === 'vu');
  await page.reload(); await page.waitForTimeout(1200);
  ok('ouvertures suivantes : directement l’application', (await accueil(page).count()) === 0 && (await page.locator('[role=tab]').count()) > 5);
  // revoir la présentation depuis le pied de page, sans rien perdre
  await page.click('#tab-params'); await page.waitForTimeout(250);
  await page.locator('footer .appfoot-presentation').click(); await page.waitForTimeout(300);
  const tr = (await accueil(page).innerText()).replace(/\s+/g, ' ');
  ok('pied de page « Présentation » : la page revient, avec « Revenir à Œnotrack »', (await accueil(page).getAttribute('data-accueil')) === 'revoir' && /Revenir à Œnotrack/.test(tr) && /Vos données sont restées telles quelles/.test(tr));
  await page.locator('[data-accueil-ouvrir]').first().click(); await page.waitForTimeout(400);
  ok('« Revenir à Œnotrack » : même onglet qu’avant (Paramètres)', (await accueil(page).count()) === 0 && (await page.locator('#tab-params').getAttribute('aria-selected')) === 'true' && (await marque(page)) === 'vu');
  ok('aucune erreur de page', !errors.length, errors.slice(0, 3));
  await browser.close();
}

// 2. Œnotrack déjà utilisé sur cet appareil (base d'une version précédente, sans marque) : jamais d'accueil
{
  const fx = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'base-0.22.0-alpha.2-versions.json'), 'utf8');
  const init = `try { if (!sessionStorage.getItem('t44')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(fx)}); sessionStorage.setItem('t44', '1'); } } catch (e) {}`;
  const { browser, page, errors } = await open({ accueil: true, init, viewport: { width: 1280, height: 900 } });
  ok('base existante : directement l’application, marque « vu »', (await accueil(page).count()) === 0 && (await page.locator('[role=tab]').count()) > 5 && (await marque(page)) === 'vu');
  ok('base existante : aucune erreur', !errors.length, errors.slice(0, 2));
  await browser.close();
}

// 3. adresse directe (#cgu) et retour d'une connexion Drive (?code=…&state=…)
{
  const { browser, page, errors } = await open({ accueil: true, viewport: { width: 1280, height: 900 } });
  await page.goto('http://app.test/#cgu'); await page.waitForTimeout(1000);
  ok('…/#cgu à la première ouverture : CGU ouvertes par-dessus l’accueil', (await accueil(page).count()) === 1 && /Conditions générales d’utilisation/.test(await page.locator('.overlay').last().innerText()));
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  await page.goto('http://app.test/?code=abc&state=xyz'); await page.waitForTimeout(1200);
  ok('retour d’une connexion Microsoft ou Dropbox : pas d’accueil (on était déjà entré)', (await accueil(page).count()) === 0 && (await marque(page)) === 'vu');
  ok('adresses directes : aucune erreur de page', !errors.filter((e) => !/connexion|PKCE|state|code/i.test(e)).length, errors.slice(0, 3));
  await browser.close();
}

// 4. téléphone (bouton visible d'emblée, pas de défilement horizontal) et mode sombre
{
  const { browser, page, errors } = await open({ accueil: true, viewport: { width: 390, height: 844 }, mobile: true });
  const m = await page.evaluate(() => { const b = document.querySelector('[data-accueil-ouvrir]').getBoundingClientRect(); return { large: document.documentElement.scrollWidth - window.innerWidth, bas: Math.round(b.bottom) }; });
  ok('téléphone : « Ouvrir Œnotrack » visible sans faire défiler, pas de défilement horizontal', m.large <= 1 && m.bas < 844, m);
  await page.screenshot({ path: SC + '/shots/t44-mobile.png' });
  ok('téléphone : aucune erreur', !errors.length, errors.slice(0, 2));
  await browser.close();
  const { browser: b2, page: p2, errors: e2 } = await open({ accueil: true, dark: true, viewport: { width: 1280, height: 900 } });
  const c = await p2.evaluate(() => { const s = getComputedStyle(document.querySelector('.accueil')); const t = getComputedStyle(document.querySelector('.accueil-titre')); return { fond: s.backgroundColor, texte: t.color, mode: document.documentElement.getAttribute('data-mode') }; });
  ok('mode sombre : fond sombre, titre clair', c.mode === 'dark' && /rgb\((\d+), (\d+), (\d+)\)/.test(c.fond) && Number(c.fond.match(/\d+/)[0]) < 60 && Number(c.texte.match(/\d+/)[0]) > 180, c);
  ok('mode sombre : aucune erreur', !e2.length, e2.slice(0, 2));
  await b2.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt44 : TOUT PASSE');
