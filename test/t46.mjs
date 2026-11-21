// 0.24.0-alpha.1 : langue de l'interface — page d'accueil dans la langue du navigateur, choix sur l'accueil, la connexion, le pied de page et
// dans Paramètres ; onglets et Pressoir traduits ; retour au français ; choix gardé sur l'appareil ; qui utilisait déjà Œnotrack reste en français ;
// données jamais traduites ; région « autre » depuis Paramètres › Société ; 0.24.0-alpha.2 : Cuverie, fiches, Opérations et formulaires
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 400) : ''); };
const txt = async (pg, sel) => (await pg.locator(sel).first().innerText()).replace(/\s+/g, ' ');
const onglets = (pg) => pg.locator('[role=tab][id^="tab-"]').allInnerTexts();

// 1. toute première ouverture avec un navigateur en anglais : accueil en anglais, puis espagnol choisi sur l'accueil
{
  const { browser, page, errors } = await open({ accueil: true, locale: 'en-US', viewport: { width: 1280, height: 900 } });
  let t = await txt(page, '[data-accueil]');
  ok('navigateur en anglais : page d’accueil en anglais (nom Œnotrack inchangé)', /What Œnotrack does/.test(t) && /How it works/.test(t) && /Your data/.test(t) && (await page.locator('h1').innerText()) === 'Œnotrack' && (await page.locator('[data-accueil-ouvrir]').first().innerText()) === 'Open Œnotrack', t.slice(0, 300));
  ok('langue proposée : English, gardée sur l’appareil', (await page.locator('[data-accueil] [data-langue]').inputValue()) === 'en' && (await page.evaluate(() => localStorage.getItem('oenotrack-langue'))) === 'en' && (await page.evaluate(() => document.documentElement.lang)) === 'en');
  const noms = await page.locator('[data-accueil] [data-langue] option').allInnerTexts();
  ok('six langues proposées, chacune sous son propre nom', noms.join('|') === 'Français|English|Español|Italiano|Deutsch|Português', noms);
  await page.locator('[data-accueil] [data-langue]').selectOption('es'); await page.waitForTimeout(300);
  t = await txt(page, '[data-accueil]');
  ok('espagnol choisi sur l’accueil : textes en espagnol', /Qué hace Œnotrack/.test(t) && /Cómo funciona/.test(t) && (await page.locator('[data-accueil-ouvrir]').first().innerText()) === 'Abrir Œnotrack', t.slice(0, 200));
  await page.screenshot({ path: SC + '/shots/t46-accueil-es.png' });
  await page.locator('[data-accueil-ouvrir]').first().click(); await page.waitForTimeout(600);
  const o = await onglets(page);
  ok('application en espagnol : onglets traduits', o.includes('Prensa') && o.includes('Depósitos y lotes') && o.includes('Configuración'), o);
  await page.click('#tab-pressoir'); await page.waitForTimeout(400);
  await page.locator('[aria-label="Année des vendanges"], [aria-label="Annee des vendanges"]').first().selectOption('2026').catch(() => {});
  await page.locator('select').filter({ has: page.locator('option[value="2026"]') }).first().selectOption('2026').catch(() => {}); await page.waitForTimeout(300);
  t = await txt(page, 'main');
  ok('onglet Prensa : sous-onglets, titres et boutons en espagnol', /Pesadas/.test(t) && /Prensados/.test(t) && /Registro de pesadas 2026/.test(t) && /\+ Nueva pesada/.test(t), t.slice(0, 300));
  ok('données jamais traduites (apporteurs, cépages restent tels quels)', /Lefèvre Père & Fils/.test(t) && /Chardonnay/.test(t));
  await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300);
  const f = await txt(page, '.overlay');
  ok('formulaire de pesée en espagnol, placeholders compris', /Nueva pesada/.test(f) && /Hora de la pesada/i.test(f) && /Peso bruto \(kg\)/i.test(f) && (await page.locator('.overlay [data-tare]').getAttribute('placeholder')) === 'cajas, palés', [f.slice(0, 200), await page.locator('.overlay [data-tare]').getAttribute('placeholder')]);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  // retour au français depuis le pied de page
  await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
  t = await txt(page, 'main');
  ok('pied de page : retour au français, textes d’origine rétablis', /Registre des pesées 2026/.test(t) && /\+ Nouvelle pesée/.test(t) && (await onglets(page)).includes('Pressoir') && (await page.evaluate(() => document.documentElement.lang)) === 'fr');
  await page.locator('footer [data-langue]').selectOption('de'); await page.waitForTimeout(300);
  ok('allemand : onglets et Pressoir traduits', (await onglets(page)).includes('Kelter') && /Wägeregister 2026/.test(await txt(page, 'main')));
  await page.reload(); await page.waitForTimeout(1200);
  ok('rechargement : langue gardée (allemand)', (await onglets(page)).includes('Kelter') && (await page.locator('footer [data-langue]').inputValue()) === 'de');
  ok('aucune erreur de page', !errors.length, errors.slice(0, 3));
  await browser.close();
}

// 2. Œnotrack déjà utilisé sur cet appareil (base présente, aucune langue choisie), navigateur en anglais : reste en français
{
  const fx = fs.readFileSync(new URL('./fixtures/base-0.23.0-alpha.1-accueil.json', import.meta.url), 'utf8');
  const init = `try { if (!sessionStorage.getItem('t46')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(fx)}); localStorage.setItem('oenotrack-accueil', 'vu'); sessionStorage.setItem('t46', '1'); } } catch (e) {}`;
  const { browser, page, errors } = await open({ accueil: true, init, locale: 'en-US' });
  ok('base existante, navigateur en anglais : l’interface reste en français', (await onglets(page)).includes('Pressoir') && (await page.evaluate(() => localStorage.getItem('oenotrack-langue'))) === 'fr');
  // Paramètres › Société : langue et région
  await page.click('#tab-params'); await page.waitForTimeout(300);
  ok('Paramètres › Société : choix de la langue et de la région viticole', (await page.locator('[data-langue-societe] [data-langue]').count()) === 1 && (await page.locator('[data-region-societe] [data-region="autre"]').count()) === 1);
  await page.locator('[data-region-societe] [data-region="autre"]').click(); await page.waitForTimeout(300);
  await page.locator('[role=alertdialog] .btn-primary').click(); await page.waitForTimeout(400);
  const d = await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  ok('région « autre » choisie depuis la Société : profil sans plafond', d.settings.region === 'autre' && d.settings.pressoir.profil === 'libre' && /Spécificités champenoises désactivées/.test(await txt(page, '[data-region-societe]')));
  ok('aucune erreur', !errors.length, errors.slice(0, 3));
  await browser.close();
}

// 3. écran de connexion (identifiants activés) : choix de la langue
{
  const fx = JSON.parse(fs.readFileSync(new URL('./fixtures/base-0.15.0-alpha.1-identifiants.json', import.meta.url), 'utf8'));
  const init = `try { if (!sessionStorage.getItem('t46c')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(fx.db || fx))}); localStorage.setItem('oenotrack-langue', 'it'); sessionStorage.setItem('t46c', '1'); } } catch (e) {}`;
  const { browser, page, errors } = await open({ init });
  const t = await txt(page, '[data-connexion]');
  ok('connexion en italien, choix de la langue présent', /Accesso/.test(t) && /Password/.test(t) && /Accedi/.test(t) && (await page.locator('[data-connexion] [data-langue]').inputValue()) === 'it', t.slice(0, 200));
  await page.locator('[data-connexion] [data-langue]').selectOption('pt'); await page.waitForTimeout(300);
  ok('connexion : portugais choisi', /Iniciar sessão/.test(await txt(page, '[data-connexion]')) && /Palavra-passe/i.test(await txt(page, '[data-connexion]')));
  await page.screenshot({ path: SC + '/shots/t46-connexion-pt.png' });
  ok('aucune erreur', !errors.length, errors.slice(0, 3));
  await browser.close();
}
// 4. 0.24.0-alpha.2 : Cuverie, fiches du contenant et du lot, Opérations et formulaires traduits ; phrases faites de plusieurs nœuds traduites
// d'un bloc ; retour au français à l'identique ; données (noms des cuves, codes) jamais traduites
{
  const { browser, page, errors } = await open({ locale: 'en-US', viewport: { width: 1440, height: 1000 } });
  await page.click('#tab-cuverie'); await page.waitForTimeout(500);
  let t = await txt(page, 'main');
  ok('Cuverie en anglais : plan, boutons, indicateurs', /Cellar plan/.test(t) && /\+ New vessel/.test(t) && /Wine in the tank room/i.test(t) && /Vessels in use/i.test(t) && /\d+ \/ \d+ active/.test(t) && !/Nouveau contenant|Plan de cave|Contenants occupés|actifs/i.test(t), t.slice(0, 300));
  await page.locator('main button', { hasText: /^Lots$/ }).first().click(); await page.waitForTimeout(300);
  t = await txt(page, 'main');
  ok('phrase de plusieurs nœuds traduite d’un bloc (« {n} lot(s) — lots are created by operations… »)', /\d+ lot\(s\) — lots are created by operations \(pressing, must intake, blending, tirage, opening stock\)\./.test(t), t.slice(0, 300));
  ok('… colonnes et filtres des lots', /Vintage/i.test(t) && /Stage/i.test(t) && /In stock by stage:/i.test(t), t.slice(0, 300));
  await page.locator('main button', { hasText: 'Cellar plan' }).first().click(); await page.waitForTimeout(300);
  await page.locator('.pitem').nth(2).click({ force: true }); await page.waitForTimeout(400);
  t = await txt(page, '.overlay');
  ok('fiche du contenant en anglais', /Composition of the content/i.test(t) && /Operation history/i.test(t) && /Lots present \(\d+\)/i.test(t) && /Cuve|Fût|Bac|Foudre/.test(t), t.slice(0, 300));
  await page.locator('.overlay button.linkish').filter({ hasText: /^[A-Z0-9][\w-]+$/ }).first().click(); await page.waitForTimeout(400);
  t = (await page.locator('.overlay').last().innerText()).replace(/\s+/g, ' ');
  ok('fiche du lot en anglais', /Genealogy/i.test(t) && /Material balance of the lot by season/i.test(t) && /Lot operations/i.test(t), t.slice(0, 300));
  for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
  await page.click('#tab-ops'); await page.waitForTimeout(500);
  t = await txt(page, 'main');
  ok('Opérations en anglais : journal, nouvelle opération, résumés', /Operation log/.test(t) && /New operation/.test(t) && /→ stage: Settled/.test(t) && /Settling/.test(t), t.slice(0, 300));
  await page.locator('[data-groupe] button', { hasText: /^≋?\s*Settling$/ }).first().click(); await page.waitForTimeout(400);
  t = await txt(page, '.overlay');
  ok('formulaire d’opération en anglais (débourbage)', /New operation — Settling/.test(t) && /Source portion/i.test(t) && /Destination vessel/i.test(t) && /Losses \(deposits\)/i.test(t) && /✓ Validate/.test(t) && !/Portion source|Contenant de destination|Pertes \(bourbes\)/i.test(t), t.slice(0, 400));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  // retour au français : textes d'origine, sans espace sans largeur
  await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
  await page.click('#tab-cuverie'); await page.waitForTimeout(300); await page.locator('main button', { hasText: /^Lots$/ }).first().click(); await page.waitForTimeout(300);
  t = await page.locator('main').innerText();
  ok('retour au français : phrase d’origine rétablie, aucune espace sans largeur', /\d+ lot\(s\) — les lots naissent des opérations/.test(t) && !t.includes('​'), t.slice(0, 200));
  await page.locator('footer [data-langue]').selectOption('de'); await page.waitForTimeout(300);
  t = await txt(page, 'main');
  ok('allemand : même phrase traduite d’un bloc', /\d+ Partie\(n\) — Partien entstehen durch Arbeitsgänge/.test(t), t.slice(0, 200));
  await page.screenshot({ path: SC + '/shots/t46-cuverie-de.png' });
  ok('aucune erreur (Cuverie, Opérations)', !errors.length, errors.slice(0, 3));
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt46 : TOUT PASSE');
