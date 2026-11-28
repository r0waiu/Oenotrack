// 0.48.0-alpha.1 : page Opérations (« ＋ Nouvelle opération » : recherche, favoris, dernières utilisées ; journal de 50 lignes puis « Afficher plus » ;
// actions de ligne dans « ⋯ » ; sous-onglet « Journal » ; aide repliable), libellés longs sans débordement, menu des contenants (bouton « ⋯ »,
// clavier : focus, flèches, Échap, touche Menu), « ⋯ » des lots, fiche du lot (barre d'actions, un seul « Fermer », volume avant le stade),
// états vides (cuverie, journal, pressoir), téléphone 390 px sans débordement horizontal, anglais. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const debord = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const actif = (page) => page.evaluate(() => { const a = document.activeElement; return a ? { role: a.getAttribute('role'), txt: (a.innerText || '').trim().slice(0, 60), cls: a.className, nouv: a.hasAttribute('data-nouvelle-op'), menu: a.hasAttribute('data-op-menu'), pitem: a.classList.contains('pitem') } : null; });
// ouvre Opérations sans passer par le harnais (qui ouvre le sélecteur) : page telle que l'utilisateur la voit
const ops = async (page) => { if (!(await page.locator('#tab-ops').isVisible())) { await page.locator('#tab-vinification').click(); await page.waitForTimeout(200); } await page.locator('#tab-ops').click(); await page.waitForTimeout(400); };
const cuverie = async (page) => { if (!(await page.locator('#tab-cuverie').isVisible())) { await page.locator('#tab-vinification').click(); await page.waitForTimeout(200); } await page.locator('#tab-cuverie').click(); await page.waitForTimeout(400); };
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last();
  const choix = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-ops-choix') || '{}'));
  await ops(page);
  ok('sous-onglet « Journal » (plus « Opérations ») sélectionné', (await page.locator('main [role=tab][aria-selected="true"]', { hasText: /^Journal$/ }).count()) === 1 && !(await page.locator('main [role=tab]', { hasText: /^Opérations$/ }).count()));
  ok('page fermée : « ＋ Nouvelle opération », familles masquées', (await page.locator('main [data-nouvelle-op][aria-expanded="false"]').count()) === 1 && !(await page.locator('main [data-groupe]').count()));
  const yJ = await page.locator('[data-journal]').evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
  ok('journal près du haut de la page (moins de 900 px)', yJ < 900, yJ);
  ok('aide « Dans chaque formulaire… » repliable', (await page.locator('details[data-aide="ops-nouvelle"]').count()) === 1 && /Dans chaque formulaire/.test(await page.locator('details[data-aide="ops-nouvelle"]').innerText()));
  ok('texte d’aide de la recherche raccourci « Rechercher… »', (await page.locator('main [data-journal] input[aria-label="Rechercher"]').getAttribute('placeholder')) === 'Rechercher…');
  // journal : 50 lignes puis « Afficher plus »
  const n0 = await page.locator('main tbody tr').count();
  ok('journal : 50 lignes et « Afficher plus »', n0 === 50 && (await page.locator('[data-journal-plus]').count()) === 1 && /50 opérations affichées sur 55/.test(await txt(page.locator('[data-journal-plus]'))), n0);
  await page.locator('[data-journal-plus] button', { hasText: 'Afficher plus' }).click(); await page.waitForTimeout(300);
  ok('… « Afficher plus » : les 55 lignes, plus de bouton', (await page.locator('main tbody tr').count()) === 55 && !(await page.locator('[data-journal-plus]').count()));
  // actions de ligne : « Modifier » + « ⋯ », plus de « Supprimer » rouge sur chaque ligne
  const l1 = page.locator('main tbody tr').first();
  ok('ligne : « Modifier » et « ⋯ », aucun « Supprimer » visible', (await l1.locator('button:text-is("Modifier")').count()) === 1 && (await l1.locator('[data-op-menu]').count()) === 1 && !(await page.locator('main tbody button', { hasText: 'Supprimer' }).count()));
  const hRow = await l1.evaluate((e) => e.getBoundingClientRect().height);
  await l1.locator('[data-op-menu]').click(); await page.waitForTimeout(250);
  let a = await actif(page);
  ok('« ⋯ » : menu ouvert, focus sur la première entrée', (await page.locator('main [role=menu]').count()) === 1 && a && a.role === 'menuitem', a);
  const items = await page.locator('main [role=menu] [role=menuitem]').allInnerTexts();
  ok('… entrées : documents, fiche d’enregistrement, supprimer', items.some((x) => /Joindre des documents|Documents/.test(x)) && items.some((x) => /Fiche d’enregistrement/.test(x)) && items.some((x) => /Supprimer/.test(x)), items);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80); const a2 = await actif(page);
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp'); await page.waitForTimeout(80); const a3 = await actif(page);
  ok('… flèches bas / haut (en boucle)', a2 && a2.role === 'menuitem' && a2.txt !== a.txt && a3 && /Supprimer/.test(a3.txt), [a, a2, a3]);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200); a = await actif(page);
  ok('… Échap : menu fermé, focus rendu au bouton « ⋯ »', !(await page.locator('main [role=menu]').count()) && a && a.menu, a);
  await l1.locator('[data-op-menu]').click(); await page.waitForTimeout(200); await page.locator('main [role=menu] [role=menuitem]', { hasText: 'Supprimer' }).click(); await page.waitForTimeout(300);
  ok('… « Supprimer… » demande confirmation', /Supprimer cette opération/.test(await txt(ov())));
  await ov().locator('button', { hasText: 'Annuler' }).first().click(); await page.waitForTimeout(250);
  ok('rangée d’une seule hauteur de bouton (moins de 90 px)', hRow < 90, hRow);
  // tuile « À vérifier » (Kpi cliquable après intégration de 40-ui)
  if (await page.locator('[data-kpi-clic]').count()) {
    await page.locator('[data-kpi-clic]', { hasText: 'À vérifier' }).click(); await page.waitForTimeout(300);
    ok('tuile « À vérifier » : journal filtré sur les opérations à vérifier', (await page.locator('[data-filtre-verifier]').count()) === 1 && (await page.locator('main tbody tr').count()) >= 1 && (await page.locator('main tbody tr').count()) < 50);
    await page.locator('[data-filtre-verifier]').click(); await page.waitForTimeout(250);
  }
  // sélecteur
  await page.locator('main [data-nouvelle-op]').click(); await page.waitForTimeout(300); a = await actif(page);
  ok('« ＋ Nouvelle opération » : sélecteur ouvert, focus dans la recherche, familles affichées', (await page.locator('[data-nouvelle-op-panneau]').count()) === 1 && (await page.locator('main [data-groupe]').count()) >= 5 && (await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-nouvelle-op-recherche'))));
  const deb = await page.evaluate(() => [...document.querySelectorAll('main [data-groupe]')].flatMap((c) => { const r = c.getBoundingClientRect(); return [...c.querySelectorAll('.op-choix')].map((b) => ({ t: b.innerText.trim(), d: Math.round(b.getBoundingClientRect().right - r.right) })).filter((x) => x.d > 0); }));
  ok('libellés longs sans débordement de leur carte (électrodialyse…)', !deb.length, deb);
  await page.screenshot({ path: `${SC}/shots/t93-selecteur.png` });
  await page.keyboard.type('souti'); await page.waitForTimeout(250);
  const tr = await page.locator('[data-nouvelle-op-trouves] [data-op-choix]').allInnerTexts();
  ok('recherche « souti » : Soutirage proposé, familles masquées', tr.some((x) => /Soutirage/.test(x)) && !(await page.locator('main [data-groupe]').count()), tr);
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  ok('Entrée : formulaire de la 1re opération trouvée', /Soutirage/.test(await ov().locator('h2').first().innerText()));
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  ok('formulaire fermé : le sélecteur reste ouvert (saisies enchaînées)', (await page.locator('[data-nouvelle-op-panneau]').count()) === 1 && !(await page.locator('.overlay').count()));
  await page.locator('[data-nouvelle-op-recherche]').fill(''); await page.waitForTimeout(200);
  ok('« Dernières utilisées » : ↺ Soutirage, retenu sur cet appareil', /↺ Soutirage/.test(await txt(page.locator('[data-ops-recentes]'))) && ((await choix()).recentes || []).includes('soutirage'), await choix());
  await page.locator('main button[aria-label="Ajouter Levurage aux favoris"]').click(); await page.waitForTimeout(200);
  ok('☆ Levurage : favori (★ Levurage), retenu sur cet appareil, jamais dans la base', /★ Levurage/.test(await txt(page.locator('[data-ops-favoris]'))) && ((await choix()).favoris || []).length === 1 && !JSON.stringify(await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')))).includes('ops-choix'));
  await page.locator('[data-ops-favoris] [data-op-choix]').first().click(); await page.waitForTimeout(400);
  ok('… favori : ouvre le formulaire Levurage', /Levurage/.test(await ov().locator('h2').first().innerText()));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.locator('[data-nouvelle-op-recherche]').focus(); await page.keyboard.press('Escape'); await page.waitForTimeout(200); a = await actif(page);
  ok('Échap dans le sélecteur : fermé, focus rendu au bouton', !(await page.locator('[data-nouvelle-op-panneau]').count()) && a && a.nouv, a);
  await page.reload(); await page.waitForTimeout(1500); await ops(page); await page.locator('main [data-nouvelle-op]').click(); await page.waitForTimeout(300);
  ok('rechargement : favori et dernières gardés', /★ Levurage/.test(await txt(page.locator('[data-ops-favoris]'))) && /Soutirage/.test(await txt(page.locator('[data-ops-recentes]'))));
  for (const w of [1440, 1280]) {
    await page.setViewportSize({ width: w, height: 900 }); await page.waitForTimeout(300);
    const d = await page.evaluate(() => [...document.querySelectorAll('main [data-groupe]')].flatMap((c) => { const r = c.getBoundingClientRect(); return [...c.querySelectorAll('.op-choix')].filter((b) => b.getBoundingClientRect().right > r.right + 0.5).map((b) => b.innerText.trim()); }));
    ok(`${w} px : aucun bouton d’opération ne déborde de sa carte`, !d.length, d);
  }
  await page.setViewportSize({ width: 1360, height: 900 }); await page.waitForTimeout(200);
  // cuverie : « ⋯ » de chaque contenant, clavier
  await cuverie(page);
  const nPi = await page.locator('main .pitem').count(); const nDots = await page.locator('main .pitem [data-plan-menu]').count();
  ok('plan de cave : un « ⋯ » sur chaque contenant', nPi > 3 && nDots === nPi, [nPi, nDots]);
  await page.locator('main .pitem [data-plan-menu]').nth(1).click(); await page.waitForTimeout(300); a = await actif(page);
  ok('« ⋯ » : menu du contenant, focus sur la première entrée', (await page.locator('[data-ctxmenu]').count()) === 1 && a && a.role === 'menuitem' && /Fiche du contenant/.test(a.txt), a);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(80); const b2 = await actif(page);
  await page.keyboard.press('End'); await page.waitForTimeout(80); const b3 = await actif(page);
  ok('… flèche bas, Fin (dernière entrée : Archiver)', b2 && b2.role === 'menuitem' && b2.txt !== a.txt && b3 && /Archiver|Réactiver/.test(b3.txt), [b2, b3]);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('… Échap : menu fermé', !(await page.locator('[data-ctxmenu]').count()));
  await page.locator('main .pitem').nth(2).focus(); await page.keyboard.press('ContextMenu'); await page.waitForTimeout(300); a = await actif(page);
  ok('touche Menu sur un contenant : menu, focus dans le menu', (await page.locator('[data-ctxmenu]').count()) === 1 && a && a.role === 'menuitem', a);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150); a = await actif(page);
  ok('… Échap : focus rendu au contenant', a && a.pitem, a);
  await page.keyboard.press('Shift+F10'); await page.waitForTimeout(300);
  ok('… Maj+F10 aussitôt après : menu rouvert (plus de délai qui l’empêchait)', (await page.locator('[data-ctxmenu]').count()) === 1);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  ok('aide du plan : « ⋯ », clic droit, appui long ou touche Menu', /« ⋯ », clic droit, appui long ou touche Menu/.test(await txt(page.locator('main'))));
  // lots : « ⋯ » d'une ligne = menu du contenant, portion du lot présélectionnée
  await page.locator('main [role=tab]', { hasText: /^Lots$/ }).click(); await page.waitForTimeout(300);
  const lotRow = page.locator('main tbody tr').filter({ has: page.locator('[data-lot-menu]') }).first(); const code = (await lotRow.locator('td').first().innerText()).trim();
  await lotRow.locator('[data-lot-menu]').click(); await page.waitForTimeout(300);
  ok('lots : « ⋯ » ouvre le menu du contenant du lot', (await page.locator('[data-ctxmenu]').count()) === 1 && (await page.locator('[data-ctxmenu]').innerText()).includes(`Fiche du lot ${code}`), code);
  await page.keyboard.press('Escape'); await page.waitForTimeout(150);
  // fiche du lot
  await lotRow.locator('td').first().click(); await page.waitForTimeout(500);
  const fiche = ov();
  ok('fiche du lot : barre « Opération sur ce lot ▾ · Analyse · Rapport »', (await fiche.locator('[data-lot-barre] [data-lot-ops]').count()) === 1 && (await fiche.locator('[data-lot-barre] [data-lot-analyse]').count()) === 1 && (await fiche.locator('[data-lot-barre] [data-lot-rapport]').count()) === 1);
  ok('… un seul « Fermer » (plus dans le pied)', (await fiche.locator('button', { hasText: /Fermer/ }).count()) === 1 && !(await fiche.locator('.sheet-f button', { hasText: /Fermer/ }).count()));
  const ord = await fiche.evaluate((o) => { const r = o.querySelector('[data-lot-resume]'); const s = [...o.querySelectorAll('h3')].find((h) => /Stade du vin/.test(h.textContent)); return r && s ? r.getBoundingClientRect().top < s.getBoundingClientRect().top : null; });
  ok('… volume et contenants avant le stade', ord === true, ord);
  await fiche.locator('[data-lot-ops]').click(); await page.waitForTimeout(300); a = await actif(page);
  ok('« Opération sur ce lot ▾ » : menu, focus sur la première entrée', (await fiche.locator('[role=menu]').count()) === 1 && a && a.role === 'menuitem', a);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('… Échap ferme le menu, pas la fiche', !(await fiche.locator('[role=menu]').count()) && (await page.locator('[data-lot-barre]').count()) === 1);
  await fiche.locator('[data-lot-ops]').click(); await page.waitForTimeout(250);
  await fiche.locator('[role=menu] [role=menuitem]', { hasText: 'Changer de stade / couleur…' }).click(); await page.waitForTimeout(500);
  ok('… « Changer de stade / couleur… » : formulaire', /stade/i.test(await ov().locator('h2').first().innerText()));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // états vides
  await page.locator('button', { hasText: 'Réinitialiser à vide' }).first().click(); await page.waitForTimeout(300); await ov().locator('button', { hasText: 'Tout effacer' }).click(); await page.waitForTimeout(800);
  await cuverie(page); await page.locator('main [role=tab]', { hasText: /^Plan de cave$/ }).click(); await page.waitForTimeout(300);
  let t = await txt(page.locator('main'));
  ok('cuverie vide : phrase, « ＋ Créer votre premier contenant », barèmes, configuration guidée', (await page.locator('[data-cuverie-vide]').count()) === 1 && /Votre cuverie est vide/.test(t) && (await page.locator('[data-vide-baremes]').count()) === 1 && (await page.locator('[data-vide-questionnaire]').count()) === 1);
  ok('… plus de message « pour ce filtre », ni d’outils sans objet (scanner, sélection, impression, plan, légende)', !/pour ce filtre/.test(t) && !/Scanner|Sélection multiple|Imprimer le plan|Modifier le plan/.test(t) && !(await page.locator('[data-legende]').count()), t.slice(0, 400));
  await page.screenshot({ path: `${SC}/shots/t93-cuverie-vide.png` });
  await page.locator('[data-cuverie-vide] button', { hasText: 'Créer votre premier contenant' }).click(); await page.waitForTimeout(400);
  ok('… « ＋ Créer votre premier contenant » : formulaire « Nouveau contenant »', /Nouveau contenant/.test(await ov().locator('h2').first().innerText()));
  await ov().locator('input').first().fill('Cuve T93'); await ov().locator('input[inputmode=decimal]').first().fill('20'); await ov().locator('button', { hasText: 'Enregistrer' }).last().click(); await page.waitForTimeout(500);
  ok('… contenant créé : plan affiché', !(await page.locator('[data-cuverie-vide]').count()) && (await page.locator('main .pitem').count()) === 1);
  await page.locator('main input[aria-label="Rechercher un contenant"]').fill('zzz'); await page.waitForTimeout(300);
  ok('recherche sans résultat : « Aucun contenant ne correspond à ce filtre » + « Effacer le filtre »', /Aucun contenant ne correspond à ce filtre/.test(await txt(page.locator('main'))) && (await page.locator('[data-effacer-filtre]').count()) === 1);
  await page.locator('[data-effacer-filtre]').click(); await page.waitForTimeout(250);
  ok('… filtre effacé', (await page.locator('main .pitem').count()) === 1);
  await ops(page);
  ok('journal vide : phrase et « ＋ Saisir une première opération »', (await page.locator('[data-journal-vide]').count()) === 1 && /Saisir une première opération/.test(await txt(page.locator('[data-journal]'))));
  await page.locator('[data-journal] button', { hasText: 'Saisir une première opération' }).click(); await page.waitForTimeout(300);
  ok('… ouvre le sélecteur', (await page.locator('[data-nouvelle-op-panneau]').count()) === 1);
  await page.locator('#tab-pressoir').click(); await page.waitForTimeout(400);
  const sansPressoir = await page.evaluate(() => !pressoirsDe(JSON.parse(localStorage.getItem('oenotrack-db-v2'))).length);
  ok('pressoir vide : « Aucune pesée », « ＋ Enregistrer la première pesée » (pressoirs et balances à déclarer s’il n’y en a aucun)', (await page.locator('[data-pressoir-vide="pesees"]').count()) === 1 && /Enregistrer la première pesée/.test(await txt(page.locator('main'))) && (await page.locator('[data-vide-reglages]').count()) === (sansPressoir ? 1 : 0), sansPressoir);
  await page.locator('main [role=tab]', { hasText: /^Pressurages/ }).click(); await page.waitForTimeout(300);
  ok('pressurages vides : « ＋ Nouveau pressurage »', (await page.locator('[data-pressoir-vide="marcs"]').count()) === 1);
  if (sansPressoir) { await page.locator('[data-vide-reglages]').click(); await page.waitForTimeout(400);
    ok('… « Déclarer pressoirs et balances » : réglages du pressoir', /Pressoirs et balances/.test(await txt(page.locator('main')))); }
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{ // téléphone 390 px
  const { browser, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
  const ov = () => page.locator('.overlay').last();
  await ops(page);
  ok('téléphone : Opérations sans débordement horizontal', (await debord(page)) <= 0, await debord(page));
  const yJ = await page.locator('[data-journal]').evaluate((e) => e.getBoundingClientRect().top + window.scrollY);
  ok('téléphone : journal en haut de page (moins de 1 300 px, avant : 2 400)', yJ < 1300, yJ);
  await page.locator('main [data-nouvelle-op]').click(); await page.waitForTimeout(300);
  ok('téléphone : sélecteur ouvert sans débordement', (await debord(page)) <= 0, await debord(page));
  await page.screenshot({ path: `${SC}/shots/t93-tel-selecteur.png` });
  await page.locator('main [data-nouvelle-op]').click(); await page.waitForTimeout(200);
  const carte = page.locator('[data-journal] .card').first(); await carte.locator('[data-op-menu]').click(); await page.waitForTimeout(300);
  const bm = await page.evaluate(() => { const m = document.querySelector('main [role=menu]'); if (!m) return null; const r = m.getBoundingClientRect(); return { l: r.left, r: r.right, b: r.bottom, w: window.innerWidth, h: window.innerHeight }; });
  ok('téléphone : « ⋯ » d’une opération en bas de l’écran, dans la largeur', bm && bm.l >= 0 && bm.r <= bm.w && bm.b <= bm.h + 1, bm);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await cuverie(page);
  ok('téléphone : cuverie sans débordement', (await debord(page)) <= 0, await debord(page));
  await page.locator('main [role=tab]', { hasText: /^Lots$/ }).click(); await page.waitForTimeout(300);
  await page.locator('main tbody tr').filter({ has: page.locator('[data-lot-menu]') }).first().locator('td').first().click(); await page.waitForTimeout(500);
  const pos = await ov().evaluate((o) => { const r = o.querySelector('[data-lot-resume]'); const s = [...o.querySelectorAll('h3')].find((h) => /Stade du vin/.test(h.textContent)); const b = o.querySelector('[data-lot-barre]'); return { resume: r && r.getBoundingClientRect().top, stade: s && s.getBoundingClientRect().top, barre: b && b.getBoundingClientRect().top, sw: o.querySelector('.sheet').scrollWidth - o.querySelector('.sheet').clientWidth }; });
  ok('téléphone : fiche du lot — barre, puis volume et contenants avant le stade, sans débordement', pos.barre != null && pos.resume != null && pos.stade != null && pos.barre < pos.resume && pos.resume < pos.stade && pos.sw <= 0, pos);
  await page.screenshot({ path: `${SC}/shots/t93-tel-lot.png` });
  ok('aucune erreur (téléphone)', errors.length === 0, errors);
  await browser.close();
}
{ // anglais
  const { browser, page, errors } = await open({ init: { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" }, viewport: { width: 1360, height: 900 } });
  await ops(page);
  let t = await txt(page.locator('main'));
  ok('anglais : « ＋ New operation », sous-onglet « Log », aide traduite', /＋ New operation/.test(t) && (await page.locator('main [role=tab]', { hasText: /^Log$/ }).count()) === 1 && /“✓ Validate” records the operation as done/.test(t) && /50 of 55 operations shown/.test(t), t.slice(0, 600));
  await page.locator('main [data-nouvelle-op]').click(); await page.waitForTimeout(300);
  ok('anglais : recherche et favoris', (await page.locator('[data-nouvelle-op-recherche]').getAttribute('placeholder')) === 'Search for an operation…' && /pin it as a favourite/.test(await txt(page.locator('[data-nouvelle-op-panneau]'))));
  await page.locator('main tbody tr').first().locator('[data-op-menu]').click(); await page.waitForTimeout(250);
  ok('anglais : menu « ⋯ » (Delete…)', /Delete…/.test(await txt(page.locator('main [role=menu]'))));
  await page.keyboard.press('Escape');
  await cuverie(page); await page.locator('main [role=tab]', { hasText: /^Lots$/ }).click(); await page.waitForTimeout(300);
  await page.locator('main tbody tr').filter({ has: page.locator('[data-lot-menu]') }).first().locator('td').first().click(); await page.waitForTimeout(500);
  ok('anglais : fiche du lot « Operation on this lot ▾ », « 🔬 Analysis »', /Operation on this lot ▾/.test(await txt(page.locator('[data-lot-barre]'))) && /Analysis/.test(await txt(page.locator('[data-lot-barre]'))));
  ok('aucune erreur (anglais)', errors.length === 0, errors);
  await browser.close();
}
console.log(ko ? `✗ ${ko} échec(s)` : 'tout est vert');
