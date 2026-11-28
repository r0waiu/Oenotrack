// 0.25.0-alpha.2 : relevés de pourriture selon l'état sanitaire (formulaire, éditeur, ticket, base) ; Opérations reliées au Pressoir
// (« Pesée de vendange » et « Pressurage » ouvrent la pesée et le marc, journal avec n°, menu d'une cuve) ; indicateur d'enregistrement
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 500) : ''); };
const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 } });
const ov = () => page.locator('.overlay').last();
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const fermer = async () => { for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
const coche = (l) => l.locator('input[type=checkbox]').isChecked();

// 1. indicateur d'enregistrement : où sont les données
let t = await txt(page.locator('header'));
ok('en-tête : « Sur cet appareil seulement » (aucune synchronisation), plus de « Enregistrement auto · 100 % local »', (await page.locator('[data-stockage="appareil"]').count()) === 1 && /Sur cet appareil seulement/.test(t) && !/Enregistrement auto/.test(t), t.slice(0, 300));
await page.locator('[data-stockage="appareil"]').click(); await page.waitForTimeout(400);
ok('… un clic ouvre Paramètres › Sauvegarde & Drive', (await page.locator('#tab-params').getAttribute('aria-selected')) === 'true' && /Dernière sauvegarde/i.test(await txt(page.locator('main'))));

// 2. pesée : relevés de pourriture seulement si l'état sanitaire n'est pas « Sain »
await page.click('#tab-pressoir'); await page.waitForTimeout(400);
await page.locator('[aria-label="Année des vendanges"]').selectOption('2026'); await page.waitForTimeout(250);
await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300); let f = ov();
ok('nouvelle pesée « Sain » : pourriture acide masquée, aide affichée', (await f.locator('[data-etat]').inputValue()) === 'sain' && (await f.locator('[data-pourriture]').count()) === 0 && /Les relevés de pourriture apparaissent/.test(await txt(f)));
await f.locator('[data-personnaliser-pesee]').click(); await page.waitForTimeout(300); const e = ov();
ok('éditeur : pourriture acide marquée « si non sain »', /si non sain/.test(await e.locator('[data-fe-champ="pourritureAcide"]').innerText()));
await e.locator('[data-fe-champ="pourritureAcide"] button[aria-label^="Détails"]').click(); await page.waitForTimeout(150);
ok('… case « Seulement si l’état sanitaire n’est pas « Sain » » cochée', await coche(e.locator('[data-fe-champ="pourritureAcide"] label', { hasText: 'Seulement si l’état sanitaire' })));
const ajout = async (nom, type) => {
  await e.locator('button', { hasText: '＋ Ajouter un champ' }).click(); await page.waitForTimeout(250); const c = ov();
  await c.locator('[aria-label="Nom du champ"]').fill(nom); if (type) await c.locator('[aria-label="Type de champ"]').selectOption(type); await page.waitForTimeout(100);
  const x = await coche(c.locator('label', { hasText: 'Seulement si l’état sanitaire' })); await c.locator('.sheet-f .btn-primary', { hasText: 'Ajouter le champ' }).click(); await page.waitForTimeout(250); return x;
};
const cg = await ajout('Pourriture grise', 'nombre'); const ct = await ajout('Raisins triés', 'ouinon');
ok('champ personnalisé : « Pourriture grise » coché d’après son nom, « Raisins triés » non', cg === true && ct === false, [cg, ct]);
ok('… « si non sain » sur la ligne de « Pourriture grise »', /si non sain/.test(await e.locator('[data-fe-perso="Pourriture grise"]').innerText()) && !/si non sain/.test(await e.locator('[data-fe-perso="Raisins triés"]').innerText()));
await e.locator('.sheet-f .btn-primary', { hasText: 'Enregistrer le formulaire' }).click(); await page.waitForTimeout(400);
f = ov();
ok('« Sain » : seul « Raisins triés » proposé', (await f.locator('[data-champ-perso]').count()) === 1 && /Raisins triés/.test(await txt(f)));
await f.locator('[data-etat]').selectOption('altere'); await page.waitForTimeout(150);
ok('« Altéré » : pourriture acide et pourriture grise proposées', (await f.locator('[data-pourriture]').count()) === 1 && (await f.locator('[data-champ-perso]').count()) === 2);
await f.locator('[data-pourriture]').fill('4'); await f.locator('[data-champ-perso]', { hasText: 'Pourriture grise' }).locator('input').fill('6');
await f.locator('[data-etat]').selectOption('sain'); await page.waitForTimeout(150);
ok('retour à « Sain » : relevés de pourriture masqués', (await f.locator('[data-pourriture]').count()) === 0 && (await f.locator('[data-champ-perso]').count()) === 1);
await f.locator('[data-heure]').fill('10:20'); await f.locator('[data-brut]').fill('3200'); await f.locator('[data-tare]').fill('200');
await f.locator('.sheet-f .btn-primary', { hasText: 'Peser et valider' }).click(); await page.waitForTimeout(500);
const tk = await txt(ov());
ok('bon de pesée d’une pesée « Sain » : aucune ligne de pourriture', /Ticket de pesée n° 5/.test(tk) && !/Pourriture/i.test(tk), tk.slice(0, 700));
await fermer();
let d = await db(); const o5 = d.ops.find((x) => x.type === 'apport' && x.pesee && x.pesee.num === 5 && x.date.startsWith('2026'));
ok('base : pesée « Sain » sans pourriture acide ni pourriture grise', o5 && o5.pesee.etat === 'sain' && o5.pesee.pourritureAcide === undefined && !(o5.champs || []).some((c) => /Pourriture/.test(c.label)), o5 && { pesee: o5.pesee, champs: o5.champs });
await page.screenshot({ path: SC + '/shots/t48-pressoir.png' });

// 3. Opérations : « Pesée de vendange » et « Pressurage » retirés (saisis dans l'onglet Pressoir, 0.26.0-alpha.2) ; journal relié au Pressoir
await page.click('#tab-ops'); await page.waitForTimeout(400);
ok('Opérations : ni « Pesée de vendange » ni « Pressurage » ni « Apport vendange » ; renvoi « onglet Pressoir »', !(await page.locator('main [data-groupe] button', { hasText: /^\S*\s*(Pesée de vendange|Pressurage|Apport vendange)$/ }).count()) && (await page.locator('[data-vers-pressoir]').count()) === 1 && (await page.locator('main [data-groupe] button', { hasText: 'Entrée de moûts' }).count()) === 1);
t = await txt(page.locator('main'));
ok('journal : n° de pesée et de marc affichés', /Pesée n° 5/.test(t) && /Marc n° \d+/.test(t), t.slice(0, 300));
await page.locator('main tbody tr', { hasText: 'Pesée n° 5' }).first().locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400); f = ov(); t = await txt(f);
ok('« Modifier » une pesée du journal : formulaire de pesée du registre', /Pesée n° 5/.test(t) && (await f.locator('[data-tap]').count()) === 1, t.slice(0, 160));
await fermer();
await page.locator('main tbody tr', { hasText: /Marc n° \d+/ }).first().locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400); f = ov(); t = await txt(f);
ok('« Modifier » un pressurage du journal : marc du carnet de pressoir', /Marc n° \d+/.test(t) && (await f.locator('[data-tavp]').count()) === 1, t.slice(0, 160));
await fermer();
await page.locator('[data-vers-pressoir] button').click(); await page.waitForTimeout(400);
ok('« onglet Pressoir » : ouvre le Pressoir (pesées)', (await page.locator('#tab-pressoir').getAttribute('aria-selected')) === 'true' && (await page.locator('[data-nouvelle-pesee]').count()) === 1);
ok('Pressoir : sous-onglet « Pressurages », « + Nouveau pressurage »', /Pressurages/.test(await txt(page.locator('[data-pressoir] [role=tablist]'))) && (await (async () => { await page.locator('[data-pressoir] [role=tab]', { hasText: 'Pressurages' }).click(); await page.waitForTimeout(300); return /＋ Nouveau pressurage/.test(await txt(page.locator('[data-nouveau-marc]'))); })()));
await page.locator('[data-pressoir] [role=tab]', { hasText: 'Pesées' }).first().click(); await page.waitForTimeout(300);
await page.locator('[data-presser="5"]').click(); await page.waitForTimeout(400); f = ov(); t = await txt(f);
const ch5 = await f.evaluate((el) => [...el.querySelectorAll('select')].map((x) => (x.options[x.selectedIndex] || {}).text || '').concat([...el.querySelectorAll('input[role=combobox]')].map((x) => x.value)).filter((x) => /n° 5\b/.test(x)));
ok('pesée « Presser » : marc chargé avec la pesée n° 5 et son reste (3 000 kg), désignation proposée', /Charger un marc/.test(t) && ch5.length === 1 && /^3\s?000$/.test(await f.locator('input[aria-label="Poids chargé 1"]').inputValue()) && (await f.locator('[data-couleur-marc]').count()) === 1, [ch5, t.slice(0, 200)]);
await fermer();

// 4. menu d'une cuve : « Pressurage → cuvée ici » préremplit la cuve de la cuvée dans le carnet
await page.click('#tab-cuverie'); await page.waitForTimeout(400);
await page.locator('.pitem', { hasText: 'Cuve 02' }).first().click({ button: 'right' }); await page.waitForTimeout(300);
await page.getByRole('menuitem', { name: /Pressurage/ }).click(); await page.waitForTimeout(400); f = ov();
const cv = await f.locator('[aria-label="Cuve Cuvée"]').evaluate((el) => (el.tagName === 'SELECT' ? el.options[el.selectedIndex].text : el.value));
ok('menu d’une cuve « Pressurage → cuvée ici » : carnet de pressoir, cuve de la cuvée préremplie', /Charger un marc/.test(await txt(f)) && /Cuve 02/.test(cv), cv);
await fermer();

// 5. anglais
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(300);
await page.click('#tab-ops'); await page.waitForTimeout(300); t = await txt(page.locator('body'));
ok('anglais : « Grape weighing », « On this device only »', /Grape weighing/.test(t) && /On this device only/.test(t) && !/Pesée de vendange|Sur cet appareil/.test(t), t.slice(0, 300));
await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);

// 6. onglet Pressoir désactivé : formulaire général des opérations
await page.evaluate(() => { const x = JSON.parse(localStorage.getItem('oenotrack-db-v2')); x.settings.modulesOff = [...(x.settings.modulesOff || []), 'pressoir']; localStorage.setItem('oenotrack-db-v2', JSON.stringify(x)); });
await page.reload(); await page.waitForTimeout(800);
await page.click('#tab-ops'); await page.waitForTimeout(400);
// 0.27.0-alpha.2 : la pesée de vendange n'est plus proposée dans Opérations, même onglet Pressoir masqué (les pesées : onglet Pressoir)
ok('Pressoir désactivé : plus de « Pesée de vendange » parmi les nouvelles opérations ; renvoi vers l’onglet Pressoir (masqué)', (await page.locator('main [data-groupe] button', { hasText: 'Pesée de vendange' }).count()) === 0 && /Pesées de vendange : onglet Pressoir \(masqué\)/.test(await txt(page.locator('[data-vers-pressoir]'))));
await page.locator('main tbody tr', { hasText: 'Pesée de vendange' }).first().locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400); t = await txt(ov());
ok('… une pesée déjà saisie se modifie dans le formulaire général (poids reçu)', !/Nouvelle pesée/.test(t) && /Poids reçu/i.test(t), t.slice(0, 200));
await fermer();
await page.locator('[data-vers-pressoir] button', { hasText: 'l’afficher' }).click(); await page.waitForTimeout(400);
ok('… « l’afficher » ouvre Paramètres › Modules', (await page.locator('#tab-params').getAttribute('aria-selected')) === 'true' && (await page.locator('main [data-module="pressoir"]').count()) === 1);
ok('aucune erreur', !errors.length, errors);
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt48 : TOUT PASSE');
await browser.close();
process.exitCode = ko ? 1 : 0;
