// 0.43.0-alpha.3 : configuration guidée — à la première ouverture (après la page de présentation) : mode basique, questions une par une,
// aperçu, base vide, revendications, onglets, compte administrateur (connexion, code de secours), visite guidée ; depuis Paramètres :
// questionnaire avancé relancé (réponses reprises, pas de choix de la base), opérateurs, campagne, onglet d'ouverture ; anglais.
// 0.44.0-alpha.3 : VDC proposée à côté de HVE. Données fictives.
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const repondre = async (page, ov, reponses) => {
  const vus = [];
  for (let k = 0; k < 40; k++) {
    if (await page.locator('[data-perso-apercu]').count()) break;
    const id = await page.locator('[data-perso-question]').getAttribute('data-perso-question'); vus.push(id);
    const f = reponses[id]; if (f) await f(ov()); await page.locator('[data-perso-suivant]').click(); await page.waitForTimeout(120);
  }
  return vus;
};
{
  const { browser, page, errors } = await open({ accueil: true, viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  ok('première ouverture : page de présentation', (await page.locator('[data-accueil="premier"]').count()) === 1);
  await page.locator('[data-accueil-ouvrir]').first().click(); await page.waitForTimeout(600);
  t = await txt(ov()); ok('… puis « Configurer Œnotrack » : modes Basique et Avancé avec leur durée', /Configurer Œnotrack/.test(t) && /Basique/.test(t) && /Avancé/.test(t) && /environ \d+ min/.test(t), t.slice(0, 400));
  const nB = Number(((await txt(page.locator('[data-perso-mode="basique"]'))).match(/(\d+) questions/) || [])[1]); const nA = Number(((await txt(page.locator('[data-perso-mode="avance"]'))).match(/(\d+) questions/) || [])[1]);
  ok('… le basique est plus court que l’avancé', nB > 5 && nA > nB + 8, [nB, nA]);
  await page.locator('[data-perso-mode="basique"]').click(); await page.waitForTimeout(300);
  await page.locator('[data-perso-suivant]').click(); await page.waitForTimeout(200);
  ok('réponse obligatoire : le nom vide est refusé', /Réponse attendue/.test(await txt(ov())));
  let vdcVu = false;
  const vus = await repondre(page, ov, {
    nom: async (f) => { await f.getByLabel('Nom de votre exploitation').fill('Domaine fictif T84'); },
    pressoir: async (f) => { await f.locator('label.perso-choix', { hasText: 'Non' }).click(); },
    revendications: async (f) => { vdcVu = (await f.locator('label', { hasText: 'VDC' }).count()) === 1 && (await f.locator('label', { hasText: 'HVE' }).count()) === 1; await f.locator('label', { hasText: 'Vin Méthode Nature' }).click(); },
    acces: async (f) => { await f.locator('label', { hasText: 'Une équipe' }).click(); },
    compte: async (f) => { await f.getByLabel('Identifiant').fill('fictif'); await f.getByLabel('Nom affiché').fill('Utilisateur Fictif'); await f.getByLabel('Mot de passe', { exact: true }).fill('MotDePasse-T84'); await f.getByLabel('Confirmer le mot de passe').fill('MotDePasse-T84'); },
  });
  ok('revendications proposées : HVE et VDC (0.44.0-alpha.3)', vdcVu);
  ok('questions du mode basique, une par écran, dans l’ordre ; « compte » parce que l’équipe se connecte ; « base de départ » à la première ouverture', vus[0] === 'nom' && vus.includes('compte') && vus.includes('donnees') && vus.includes('tirage') && !vus.includes('evv'), vus);
  t = await txt(page.locator('[data-perso-apercu]'));
  ok('aperçu : nom, profil viticole, onglet Pressoir masqué, revendications, base vide, identifiants', /Domaine fictif T84/.test(t) && /Champagne/.test(t) && /Onglet Pressoir : masqué/.test(t) && /Vin Méthode Nature/.test(t) && /base vide|vide/.test(t) && /Identifiants/.test(t), t.slice(0, 700));
  await page.screenshot({ path: `${SC}/shots/t84-apercu.png` });
  await page.locator('[data-perso-appliquer]').click(); await page.waitForTimeout(2500);
  t = await txt(ov()); ok('terminé : réglages appliqués, code de secours affiché une fois', /Œnotrack est configuré/.test(t) && /Code de secours/.test(t), t.slice(0, 300));
  let d = await db();
  ok('base vide (plus de lots d’exemple), nom de l’exploitation, onglet Pressoir masqué', (d.lots || []).length === 0 && d.entreprise.nom === 'Domaine fictif T84' && (await page.locator('#tab-pressoir').count()) === 0, { lots: (d.lots || []).length, nom: d.entreprise.nom });
  ok('revendications : VMN ajoutée avec son référentiel ; identifiants activés, administrateur connecté', d.lists.qualifs.some((q) => q.id === 'vmn' && q.referentiels[0] === 'vmn') && d.settings.securite.actif === true && d.utilisateurs.some((u) => u.identifiant === 'fictif' && u.profilId === 'pf_admin') && (await page.locator('[data-utilisateur]').count()) === 1);
  ok('réponses gardées sans le mot de passe', d.settings.personnalisation.mode === 'basique' && !JSON.stringify(d.settings.personnalisation).includes('MotDePasse') && d.settings.personnalisation.reponses.nom === 'Domaine fictif T84');
  // visite guidée (0.45.0-alpha.1 : par chapitres)
  await page.locator('[data-perso-visite]').click(); await page.waitForTimeout(700);
  const chaps = await page.locator('[data-visite-chapitre]').evaluateAll((e) => e.map((x) => x.getAttribute('data-visite-chapitre')));
  ok('visite guidée : sommaire des chapitres ; l’onglet masqué (Pressoir) n’est pas présenté', chaps[0] === 'prise' && chaps.includes('cuverie') && chaps.includes('params') && !chaps.includes('pressoir'), chaps);
  await page.locator('[data-visite-chapitre="prise"]').click(); await page.waitForTimeout(700);
  ok('chapitre « Prise en main » : bulle « étape 1 / n » pointant le logo', (await page.locator('[data-visite="1"]').count()) === 1 && /étape 1 \/ \d+/.test(await txt(page.locator('.visite-bulle'))) && /Œnotrack/.test(await txt(page.locator('.visite-bulle'))));
  await page.locator('[data-visite-suivant]').click(); await page.waitForTimeout(400); await page.keyboard.press('ArrowRight'); await page.waitForTimeout(400);
  ok('… Suivant et flèche → : étape 3', (await page.locator('[data-visite="3"]').count()) === 1);
  await page.locator('[data-visite-retour]').click(); await page.waitForTimeout(300);
  ok('… retour au sommaire', (await page.locator('[data-visite-sommaire]').count()) === 1);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok('Échap : visite fermée ; bouton « ❓ Visite guidée » dans l’en-tête', (await page.locator('.visite').count()) === 0 && (await page.locator('[data-visite-bouton]').count()) === 1);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
// ---- questionnaire avancé relancé depuis Paramètres (jeu d'exemple gardé)
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const lots0 = (await db()).lots.length;
  ok('ouverture ordinaire (base existante) : pas de questionnaire', (await page.locator('[data-questionnaire]').count()) === 0);
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="base"]').click(); await page.waitForTimeout(400);
  await page.locator('[data-config-relancer]').click(); await page.waitForTimeout(400);
  await page.locator('[data-perso-mode="avance"]').click(); await page.waitForTimeout(300);
  const vus = await repondre(page, ov, {
    nom: async (f) => { await f.getByLabel('Nom de votre exploitation').fill('Maison fictive'); },
    operateurs: async (f) => { await f.getByLabel(/Personnes qui réalisent/).fill('Jeanne Fictive\nPaul Fictif\nJeanne Fictive'); },
    campagne: async (f) => { await f.getByLabel('Début de votre campagne (vendanges)').fill('2028-08-20'); },
    onglet: async (f) => { await f.locator('label', { hasText: 'Intrants & Stocks' }).click(); },
    evv: async (f) => { await f.getByLabel('N° EVV (CVI)').fill('5100000000'); },
  });
  ok('mode avancé : questions en plus (EVV, opérateurs, campagne, onglet), pas de choix de la base hors première ouverture', ['evv', 'operateurs', 'campagne', 'onglet', 'plan'].every((x) => vus.includes(x)) && !vus.includes('donnees'), vus);
  await page.locator('[data-perso-appliquer]').click(); await page.waitForTimeout(1200);
  const d = await db();
  ok('appliqué sur la base actuelle (lots gardés) : nom, EVV, 2 opérateurs (doublon écarté), campagne 2028-2029, onglet d’ouverture', d.lots.length === lots0 && d.entreprise.nom === 'Maison fictive' && d.settings.drm.cvi === '5100000000' && d.operateurs.filter((o) => /Fictiv|Fictif/.test(o.nom)).length === 2 && d.campagnes.some((c) => c.nom === '2028-2029') && d.settings.ongletDefaut === 'intrants', { ops: d.operateurs.map((o) => o.nom), camps: d.campagnes.map((c) => c.nom) });
  await page.locator('.overlay .btn', { hasText: 'Plus tard' }).click(); await page.waitForTimeout(300);
  await page.locator('[data-config-relancer]').click(); await page.waitForTimeout(300); await page.locator('[data-perso-mode="basique"]').click(); await page.waitForTimeout(300);
  ok('relancé : réponses précédentes reprises (nom)', (await ov().getByLabel('Nom de votre exploitation').inputValue()) === 'Maison fictive');
  ok('aucune erreur (avancé)', errors.length === 0, errors); await browser.close();
}
{
  const { browser, page, errors } = await open({ accueil: true, init: { content: "try { if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}" }, viewport: { width: 1280, height: 900 } });
  await page.locator('[data-accueil-ouvrir]').first().click(); await page.waitForTimeout(600);
  t = await txt(page.locator('.overlay').last()); ok('en anglais : « Set up Œnotrack », Basic / Advanced', /Set up Œnotrack/.test(t) && /Basic/.test(t) && /Advanced/.test(t), t.slice(0, 300));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t84)'); process.exitCode = ko ? 1 : 0;
