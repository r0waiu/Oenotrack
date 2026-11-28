// 0.48.0-alpha.1 : en-tête et navigation (audit d'interface validé, U01–U04, U06, U08, U14, U16, U17, U22, U24, U27) — en-tête compact au
// téléphone (« ⋯ »), menu de la campagne (plus de bouton « Figer » permanent), recherche globale (Ctrl+K, fiche ouverte directement,
// « Tout voir dans Traçabilité »), sous-onglets (.subtab), bandes défilantes, pastilles explicites, confirmation (focus sur « Annuler »),
// « Annuler » après une suppression, contrastes ≥ 4,5:1, cibles tactiles, aucune page plus large que l'écran, lien d'évitement, titre,
// libellés harmonisés ; anglais. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  ok('en-tête : pas de bouton « Figer la campagne » permanent ; pastille de la campagne', (await page.locator('header button', { hasText: /^Figer la campagne$/ }).count()) === 0 && (await page.locator('[data-camp-etat]').count()) === 1);
  await page.locator('[data-camp-etat]').click(); await page.waitForTimeout(200);
  const items = await page.locator('.camp-pop [role=menuitem]').allInnerTexts();
  ok('… menu de la pastille : « Figer la campagne… », « Gérer les campagnes ↗ »', items.join('|') === 'Figer la campagne…|Gérer les campagnes ↗', items);
  await page.locator('[data-camp-figer]').click(); await page.waitForTimeout(300);
  ok('… « Figer la campagne… » demande confirmation', /Figer la campagne/.test(await txt(page.locator('[role=alertdialog]'))));
  await page.locator('[data-cfm-annuler]').click(); await page.waitForTimeout(200);
  // recherche globale
  await page.keyboard.press('Control+k'); await page.waitForTimeout(150);
  ok('Ctrl+K : focus dans la recherche de l’en-tête', await page.evaluate(() => document.activeElement && document.activeElement.closest('[data-recherche-globale]') !== null));
  await page.keyboard.type('P25-01'); await page.waitForTimeout(300);
  const nRes = await page.locator('.recherche-pop [role=option]').count();
  ok('… résultats (lot) et « Tout voir dans Traçabilité »', nRes >= 2 && (await page.locator('.recherche-pop [data-rg="lot"]').count()) >= 1 && (await page.locator('.recherche-pop [data-rg="trace"]').count()) === 1);
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  ok('… Entrée : la fiche du lot s’ouvre directement', /P25-01/.test(await txt(page.locator('.overlay').last())));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.locator('[data-recherche-globale] input').fill('Cuve'); await page.waitForTimeout(300);
  await page.locator('.recherche-pop [data-rg="trace"]').click(); await page.waitForTimeout(500);
  ok('… « Tout voir dans Traçabilité » : onglet Traçabilité, recherche reprise', (await page.locator('#tab-trace').getAttribute('aria-selected')) === 'true' && (await page.locator('main input[type=search], main input').evaluateAll((L) => L.some((x) => x.value === 'Cuve'))));
  // sous-onglets, pastilles, titre, repères
  await page.click('#tab-vinification'); await page.waitForTimeout(300);
  ok('sous-onglets : style propre (.subtab), pas de .btn-primary', (await page.locator('[data-onglet-groupe] [role=tab].subtab').count()) >= 3 && (await page.locator('[data-onglet-groupe] .btn-primary').count()) === 0);
  const titres = await page.locator('.navtabs .chip').evaluateAll((L) => L.map((x) => x.getAttribute('title') || ''));
  ok('pastilles des onglets : un titre qui dit ce qu’elles comptent', titres.length > 0 && titres.every((x) => /\d+ \D{6,}/.test(x)), titres);
  ok('titre du navigateur et h1 du module ; lien « Aller au contenu »', /Cuverie & Lots · Vinification · Œnotrack/.test(await page.title()) && /Vinification — Cuverie & Lots/.test(await page.locator('h1[data-titre-module]').innerText()) && (await page.locator('a.saut-contenu[href="#contenu"]').count()) === 1);
  // tuile cliquable
  await page.click('#tab-ops'); await page.waitForTimeout(400);
  ok('tuile « À vérifier » cliquable', (await page.locator('[data-kpi-clic]').count()) >= 1);
  // confirmation : focus sur « Annuler » ; « Annuler » après suppression
  const n0 = (await db()).ops.length;
  const menu = page.locator('[data-op-menu]').first(); await menu.click(); await page.waitForTimeout(200);
  await page.getByRole('menuitem', { name: /Supprimer/ }).first().click(); await page.waitForTimeout(300);
  ok('confirmation de suppression : focus sur « Annuler » (Entrée n’efface rien)', await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-cfm-annuler')));
  await page.keyboard.press('Enter'); await page.waitForTimeout(300);
  ok('… Entrée : rien de supprimé', (await db()).ops.length === n0);
  await menu.click(); await page.waitForTimeout(200); await page.getByRole('menuitem', { name: /Supprimer/ }).first().click(); await page.waitForTimeout(300);
  await page.locator('[data-cfm-ok]').click(); await page.waitForTimeout(500);
  ok('… supprimée ; message avec « Annuler »', (await db()).ops.length === n0 - 1 && (await page.locator('[data-toast-action]').count()) === 1);
  await page.locator('[data-toast-action]').click(); await page.waitForTimeout(500);
  ok('… « Annuler » : opération rétablie', (await db()).ops.length === n0 && /annulée/.test(await txt(page.locator('[data-toast]'))));
  // contrastes des pastilles (mode clair)
  const cr = await page.evaluate(() => {
    const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
    const out = {}; ['chip-info', 'chip-warn', 'chip-ok', 'chip-bad'].forEach((k) => { const e = document.createElement('span'); e.className = `chip ${k}`; e.textContent = 'x'; document.querySelector('main').appendChild(e); const s = getComputedStyle(e); const a = lum(s.color); const b = lum(s.backgroundColor); out[k] = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); e.remove(); });
    return out; });
  ok('contrastes des pastilles ≥ 4,5:1 (charte par défaut, mode clair)', Object.values(cr).every((v) => v >= 4.5), cr);
  ok('libellés harmonisés : aucune création « + » ASCII dans les boutons affichés', (await page.locator('button').evaluateAll((L) => L.filter((b) => /^\+ \p{L}/u.test((b.innerText || '').trim())).length)) === 0);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{ // téléphone
  const { browser, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
  const nav = await page.evaluate(() => document.querySelector('.navbar').getBoundingClientRect().top);
  ok('téléphone : barre d’onglets à moins de 200 px du haut (en-tête compact)', nav < 200, nav);
  ok('… statuts et thème derrière « ⋯ »', !(await page.locator('#hdr-status').isVisible()) && (await page.locator('[data-hdr-plus]').isVisible()));
  await page.locator('[data-hdr-plus]').click(); await page.waitForTimeout(200);
  ok('… « ⋯ » les affiche', await page.locator('[data-visite-bouton]').isVisible());
  await page.locator('[data-hdr-plus]').click(); await page.waitForTimeout(200);
  ok('… bande d’onglets : flèche au bord quand d’autres onglets sont cachés', (await page.locator('.navbar .bande-defil[data-apres] .bande-btn.d').isVisible()));
  const h = await page.locator('.btn').first().evaluate((e) => e.getBoundingClientRect().height);
  ok('… cibles tactiles : boutons d’au moins 40 px', h >= 40, h);
  const larges = [];
  for (const id of ['vinification', 'pressoir', 'tirage', 'cave', 'degorgement', 'analyses', 'intrants', 'hygiene', 'equipements', 'trace', 'registres', 'params']) {
    await page.locator(`#tab-${id}`).scrollIntoViewIfNeeded().catch(() => {}); await page.locator(`#tab-${id}`).click().catch(() => {}); await page.waitForTimeout(350);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth); if (sw > 391) larges.push([id, sw]);
  }
  ok('… aucune page plus large que l’écran (12 onglets)', larges.length === 0, larges);
  await page.screenshot({ path: `${SC}/shots/t92-telephone.png` });
  ok('aucune erreur (téléphone)', errors.length === 0, errors);
  await browser.close();
}
{ // anglais
  const { browser, page, errors } = await open({ init: { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" }, viewport: { width: 1360, height: 900 } });
  await page.locator('[data-camp-etat]').click(); await page.waitForTimeout(200);
  const t = await txt(page.locator('.camp-pop'));
  ok('en anglais : « Freeze the season… », « Manage seasons ↗ », recherche « Search (Ctrl+K) »', /Freeze the season…/.test(t) && /Manage seasons/.test(t) && (await page.locator('[data-recherche-globale] input').getAttribute('placeholder')) === 'Search (Ctrl+K)', t);
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t92)'); process.exitCode = ko ? 1 : 0;
