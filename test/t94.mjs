// 0.48.0-alpha.1 : formulaires et fiches — erreur de validation sous le champ (aria-invalid, focus, message au-dessus du pied),
// focus retenu dans la fiche et rendu au déclencheur, page inerte, libellés des lignes de portions, téléphone (titre sur une ligne,
// pied « Valider » + « ⋯ », sections facultatives repliées avec leur compteur), anglais. Données fictives (jeu d'exemple).
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const top = (page) => page.locator('.overlay').last();
// élément actif : dans la fiche au premier plan ? (texte, aria-label, data-champ du champ englobant)
const actif = (page) => page.evaluate(() => { const a = document.activeElement; const ov = [...document.querySelectorAll('.overlay')].pop();
  return { dans: !!(ov && ov.contains(a)), tag: a ? a.tagName : '', texte: a ? (a.innerText || '').trim().slice(0, 40) : '', label: a ? a.getAttribute('aria-label') || '' : '', champ: a && a.closest('[data-champ]') ? a.closest('[data-champ]').getAttribute('data-champ') : '', invalide: a ? a.getAttribute('aria-invalid') : null, titre: !!(a && a.classList.contains('sheet-title')) }; });
{
  const { browser, page, errors } = await open({ viewport: { width: 1280, height: 900 } });
  // 1. soutirage : focus initial, page inerte, erreur sous le champ
  await page.click('#tab-ops'); await page.waitForTimeout(300);
  await page.click('main button:text-is("Soutirage")'); await page.waitForTimeout(500);
  let a = await actif(page);
  ok('ouverture : focus sur le premier champ de la fiche (date)', a.dans && a.tag === 'INPUT' && a.champ === 'date', a);
  ok('… le reste de la page est inerte (en-tête, onglets)', await page.evaluate(() => !!document.querySelector('.topbar').closest('[inert]') && !document.querySelector('.overlay').closest('[inert]')));
  await top(page).locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
  const err = top(page).locator('[data-champ="portionId"] .champ-erreur');
  a = await actif(page);
  ok('« Valider » sans portion : message sous le champ « Portion source »', (await err.count()) === 1 && /Choisissez la portion concernée/.test(await err.innerText()));
  ok('… focus sur le champ en erreur, aria-invalid="true"', a.dans && a.champ === 'portionId' && a.invalide === 'true', a);
  ok('… liste de choix pas ouverte d’office', (await top(page).locator('[data-champ="portionId"] [role=listbox]').count()) === 0);
  const al = top(page).locator('.sheet-f [role=alert][data-sheet-erreur]');
  ok('… message aussi au-dessus du pied de la fiche (role=alert), le message du bas de page est masqué', (await al.count()) === 1 && /Choisissez la portion concernée/.test(await al.innerText())
    && await page.evaluate(() => { const t = [...document.querySelectorAll('.toast.bad')]; return t.length > 0 && t.every((x) => getComputedStyle(x).display === 'none'); }));
  await page.screenshot({ path: `${SC}/shots/t94-erreur-champ.png` });
  await pick(page, top(page).locator('[data-champ="portionId"] input[role=combobox]'), 'Cuve 03', 'Cuve 03'); await page.waitForTimeout(250);
  ok('champ corrigé : message et aria-invalid retirés', (await top(page).locator('.champ-erreur').count()) === 0 && (await top(page).locator('[aria-invalid="true"]').count()) === 0);
  await top(page).locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
  a = await actif(page);
  ok('volume vide → message sous le champ suivant (contenant de destination)', /Choisissez le contenant de destination/.test(await top(page).locator('[data-champ="destId"] .champ-erreur').innerText().catch(() => '')) && a.champ === 'destId', a);
  // 2. focus retenu dans la fiche : Tab et Maj+Tab ne sortent jamais de la fiche
  let sorties = 0; for (let i = 0; i < 45; i += 1) { await page.keyboard.press('Tab'); if (!(await actif(page)).dans) sorties += 1; }
  for (let i = 0; i < 15; i += 1) { await page.keyboard.press('Shift+Tab'); if (!(await actif(page)).dans) sorties += 1; }
  ok('Tab / Maj+Tab : le focus reste dans la fiche (60 tabulations)', sorties === 0, sorties);
  await top(page).locator('.sheet-h button[aria-label="Fermer"]').focus(); await page.keyboard.press('Shift+Tab'); a = await actif(page);
  ok('Maj+Tab depuis le premier bouton : retour au dernier élément de la fiche', a.dans && a.texte !== '✕ Fermer', a);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  a = await actif(page);
  ok('fermeture : focus rendu au déclencheur (« Soutirage »), page de nouveau active', (await page.locator('.overlay').count()) === 0 && a.tag === "BUTTON" && /Soutirage$/.test(a.texte) && await page.evaluate(() => !document.querySelector('[inert]')), a);
  // 3. assemblage : libellés des lignes de portions, en-têtes de colonnes
  await page.click('main button:text-is("Assemblage")'); await page.waitForTimeout(500);
  const f = top(page); const L = await f.locator('[data-champ="sources"] [aria-label]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  ok('assemblage : « Portion source 1 », « Volume (hL), portion 1 »…', L.includes('Portion source 1') && L.includes('Volume (hL), portion 1') && (L.length < 4 || (L.includes('Portion source 2') && L.includes('Volume (hL), portion 2'))), L);
  ok('… en-têtes de colonnes visibles au-dessus des lignes', /Portions sources/i.test(await f.locator('[data-champ="sources"] [data-lignes-tete]').innerText()) && /Volume \(hL\)/i.test(await f.locator('[data-champ="sources"] [data-lignes-tete]').innerText()));
  ok('… texte indicatif en couleur secondaire (contraste suffisant)', await page.evaluate(() => { const i = document.querySelector('.overlay input[placeholder]'); const c = getComputedStyle(i, '::placeholder').color; const t = getComputedStyle(document.documentElement).getPropertyValue('--ink2').trim(); const hex = (h) => `rgb(${parseInt(h.slice(1, 3), 16)}, ${parseInt(h.slice(3, 5), 16)}, ${parseInt(h.slice(5, 7), 16)})`; return c === hex(t); }));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // 4. pesée : fiche empilée (nouveau partenaire) — seule la dernière est active ; à sa fermeture, la pesée le redevient
  await page.click('#tab-pressoir'); await page.waitForTimeout(400);
  await page.locator('main [data-nouvelle-pesee]').click(); await page.waitForTimeout(500);
  await top(page).locator('button[aria-label="Ajouter un partenaire"]').first().click(); await page.waitForTimeout(500);
  const pile = await page.evaluate(() => { const O = [...document.querySelectorAll('.overlay')]; return { n: O.length, bas: !!O[0].closest('[inert]'), haut: !O[O.length - 1].closest('[inert]'), focus: O[O.length - 1].contains(document.activeElement) }; });
  ok('fiche empilée : la pesée est inerte, la nouvelle fiche active (focus dedans)', pile.n === 2 && pile.bas && pile.haut && pile.focus, pile);
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  a = await actif(page);
  ok('… fermée : la pesée redevient active, focus rendu au bouton « + »', (await page.locator('.overlay').count()) === 1 && a.dans && a.label === 'Ajouter un partenaire' && await page.evaluate(() => !document.querySelector('.overlay').closest('[inert]')), a);
  await top(page).locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
  a = await actif(page);
  ok('pesée sans poids : erreur du moteur sous « Poids net », focus et aria-invalid', /Indiquez le poids net/.test(await top(page).locator('[data-champ="kg"] .champ-erreur').innerText().catch(() => '')) && a.champ === 'kg' && a.invalide === 'true', a);
  ok('… message habituel gardé (texte du message en bas de page)', /Indiquez le poids net/.test(await page.locator('.toast').last().innerText().catch(() => '')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // 5. analyse : rattachement au lot
  await page.click('#tab-analyses'); await page.waitForTimeout(400);
  await page.locator('main [data-vg="analyse-nouvelle"]').click(); await page.waitForTimeout(500);
  await top(page).locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
  a = await actif(page);
  ok('analyse sans lot : message sous « Lot analysé », focus', /Rattachez l’analyse à un lot/.test(await top(page).locator('[data-champ="lotId"] .champ-erreur').innerText().catch(() => '')) && a.champ === 'lotId', a);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok('aucune erreur de page (bureau)', !errors.length, errors);
  await browser.close();
}
{ // 6. téléphone (390 px) : titre sur une ligne, sous-titre replié, pied « ✓ Valider » + « ⋯ », sections facultatives repliées
  const { browser, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
  await page.click('#tab-ops'); await page.waitForTimeout(300);
  await page.click('main button:text-is("Soutirage")'); await page.waitForTimeout(500);
  const f = top(page);
  const a = await actif(page);
  ok('ouverture au téléphone : focus sur le titre (pas de clavier ouvert d’office)', a.dans && a.titre, a);
  const g = await f.evaluate((ov) => { const h = ov.querySelector('.sheet-title'); const s = ov.querySelector('.sheet-sub'); return { taille: getComputedStyle(h).fontSize, haut: h.getBoundingClientRect().height, sub: s ? getComputedStyle(s).display : 'absent', entete: ov.querySelector('.sheet-h').getBoundingClientRect().height }; });
  ok('titre de la fiche sur une ligne (18 px), sous-titre replié', g.taille === '18px' && g.haut < 32 && g.sub === 'none' && g.entete < 80, g);
  await f.locator('[data-sheet-sub]').click(); await page.waitForTimeout(150);
  ok('… « ⓘ » déplie le sous-titre', (await f.locator('.sheet-sub').evaluate((s) => getComputedStyle(s).display)) !== 'none' && (await f.locator('[data-sheet-sub]').getAttribute('aria-expanded')) === 'true');
  const vis = await f.locator('.sheet-f .btn').evaluateAll((els) => els.filter((e) => e.getClientRects().length).map((e) => e.innerText.trim()));
  ok('pied réduit : « ⋯ » et « ✓ Valider » seulement', vis.length === 2 && vis[0] === '⋯' && /Valider/.test(vis[1]), vis);
  ok('… pied sur une rangée', (await f.locator('.sheet-f').evaluate((x) => x.getBoundingClientRect().height)) < 70);
  await f.locator('[data-sheet-plus]').click(); await page.waitForTimeout(150);
  const M = await f.locator('[data-sheet-plus-menu] [role=menuitem]').allInnerTexts();
  ok('menu « ⋯ » : Planifier, Fiche à remplir, Annuler (dans cet ordre)', M.length === 3 && /Planifier/.test(M[0]) && /Fiche à remplir/.test(M[1]) && /^Annuler$/.test(M[2].trim()), M);
  await page.screenshot({ path: `${SC}/shots/t94-tel-menu.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  ok('… Échap ferme le menu, pas la fiche', (await f.locator('[data-sheet-plus-menu]').count()) === 0 && (await page.locator('.overlay').count()) === 1);
  const rep = await f.locator('[data-cf-tel]').evaluateAll((els) => els.map((e) => ({ k: e.getAttribute('data-cf-tel'), ouvert: e.open, titre: e.querySelector('summary').innerText.replace(/\s+/g, ' ').trim() })));
  const lg = rep.find((x) => x.k === 'lignes'); const eq = rep.find((x) => x.k === 'equipementIds'); const dc = rep.find((x) => x.k === 'docs');
  ok('sections facultatives vides repliées, avec leur compteur (intrants, équipements, documents)', lg && !lg.ouvert && /\(0\)$/.test(lg.titre) && eq && !eq.ouvert && /Équipements utilisés \(0\)/.test(eq.titre) && dc && !dc.ouvert && /\(0\)$/.test(dc.titre), rep);
  await f.locator('[data-cf-tel="lignes"] > summary').click(); await page.waitForTimeout(150);
  await f.locator('[data-cf-tel="lignes"] button', { hasText: '+ Ajouter un intrant' }).click(); await page.waitForTimeout(150);
  ok('… une section dépliée s’utilise (ligne d’intrant ajoutée, section restée ouverte)', (await f.locator('[data-cf-tel="lignes"] [data-ligne-intrant]').count()) === 1 && await f.locator('[data-cf-tel="lignes"]').evaluate((d) => d.open));
  await page.screenshot({ path: `${SC}/shots/t94-tel-sections.png`, fullPage: false });
  // menu : « Annuler » ferme la fiche
  await f.locator('[data-sheet-plus]').click(); await page.waitForTimeout(150); await f.locator('[data-sheet-plus-menu] [role=menuitem]', { hasText: 'Annuler' }).click(); await page.waitForTimeout(300);
  ok('menu « ⋯ » › Annuler : fiche fermée', (await page.locator('.overlay').count()) === 0);
  ok('aucune erreur de page (téléphone)', !errors.length, errors);
  await browser.close();
}
{ // 7. anglais
  const { browser, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
  await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1300);
  await page.click('#tab-ops'); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: /^.?\s*Blend$/ }).first().click(); await page.waitForTimeout(600);
  const f = top(page); const L = await f.locator('[data-champ="sources"] [aria-label]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  ok('anglais : « Source portion 1 », « Volume (hL), portion 1 »', L.includes('Source portion 1') && L.includes('Volume (hL), portion 1'), L);
  ok('anglais : menu « More actions », « Details »', (await f.locator('[data-sheet-plus]').getAttribute('aria-label')) === 'More actions' && (await f.locator('[data-sheet-sub]').getAttribute('aria-label')) === 'Details');
  await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
  const al = await f.locator('[data-sheet-erreur]').innerText().catch(() => '');
  ok('anglais : message d’erreur dans la fiche, traduit', al.length > 5 && !/Sélectionnez|Choisissez/.test(al), al);
  ok('aucune erreur de page (anglais)', !errors.length, errors);
  await browser.close();
}
console.log(ko ? `${ko} ÉCHEC(S)` : 'TOUT EST BON');
