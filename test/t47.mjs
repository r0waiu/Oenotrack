// 0.25.0-alpha.1 : formulaire de pesée personnalisable (champs affichés, masqués, obligatoires, valeurs proposées, relevés personnalisés),
// mentions obligatoires du ticket toujours affichées ; pourriture acide et TAP relevés à la réception (ticket, registre, bilan, relevés,
// carnet) ; correction d'un relevé sans motif ; traduction
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 400) : ''); };
const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 } });
const ov = () => page.locator('.overlay').last();
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const sub = async (t) => { await page.locator('[data-pressoir] [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(250); };
const fermer = async () => { for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };

await page.click('#tab-pressoir'); await page.waitForTimeout(400);
await page.locator('[aria-label="Année des vendanges"]').selectOption('2026'); await page.waitForTimeout(250);
// 1. nouvelle pesée : pourriture acide et TAP proposés
await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300);
let f = ov(); let t = await txt(f);
ok('formulaire de pesée : TAP proposé ; pourriture acide masquée tant que l’état est « Sain » (0.25.0-alpha.2)', (await f.locator('[data-pourriture]').count()) === 0 && (await f.locator('[data-tap]').count()) === 1 && /TAP \(% vol\.\)/i.test(t) && /Les relevés de pourriture apparaissent/i.test(t), t.slice(0, 300));
await f.locator('[data-etat]').selectOption('faible'); await page.waitForTimeout(150); t = await txt(f);
ok('… état « Faiblement altéré » : pourriture acide proposée', (await f.locator('[data-pourriture]').count()) === 1 && /Pourriture acide \(%\)/i.test(t), t.slice(0, 300));
ok('… lien « Personnaliser ce formulaire »', (await f.locator('[data-personnaliser-pesee]').count()) === 1);
// 2. personnalisation : mentions du ticket verrouillées, caisses masquées, TAP obligatoire, valeur proposée, relevé personnalisé
await f.locator('[data-personnaliser-pesee]').click(); await page.waitForTimeout(300);
let e = ov(); t = await txt(e);
ok('éditeur du formulaire de pesée ouvert', /Formulaire — Pesée \(onglet Pressoir\)/.test(t) && /Champs de la pesée/i.test(t), t.slice(0, 200));
const verrou = async (k) => (await e.locator(`[data-fe-champ="${k}"] [role=radio]`).evaluateAll((L) => L.every((b) => b.disabled)));
ok('mentions obligatoires du registre et du ticket : jamais masquables (date, heure, cépage, poids net, apporteur, revendication particulière)', (await verrou('date')) && (await verrou('heure')) && (await verrou('cepageId')) && (await verrou('kg')) && (await verrou('apporteurId')) && (await verrou('mention')));
ok('… repérées « obligatoire au registre » ou « ticket »', /obligatoire au registre/i.test(await e.locator('[data-fe-champ="heure"]').innerText()) && /ticket|bon de pesée/i.test(await e.locator('[data-fe-champ="mention"]').innerText()), [await e.locator('[data-fe-champ="heure"]').innerText(), await e.locator('[data-fe-champ="mention"]').innerText()]); // libellés des pastilles en capitales (CSS)
ok('… les autres champs restent masquables (caisses, TAP, pourriture acide)', !(await verrou('caisses')) && !(await verrou('tap')) && !(await verrou('pourritureAcide')));
await e.locator('[data-fe-champ="caisses"] [role=radio][aria-label="Masqué"]').click();
await e.locator('[data-fe-champ="tap"] input[type=checkbox]').check();
await e.locator('[data-fe-champ="etat"] button[aria-label^="Détails"]').click(); await page.waitForTimeout(100);
await e.locator('[data-fe-champ="etat"] select[aria-label^="Valeur par défaut"]').selectOption('faible');
await e.locator('button', { hasText: '＋ Ajouter un champ' }).click(); await page.waitForTimeout(200);
let c = ov(); await c.locator('[aria-label="Nom du champ"]').fill('Pourriture grise'); await c.locator('[aria-label="Type de champ"]').selectOption('nombre'); await c.locator('[aria-label="Unité"]').fill('%');
await c.locator('.sheet-f .btn-primary', { hasText: 'Ajouter le champ' }).click(); await page.waitForTimeout(200);
await ov().locator('.sheet-f .btn-primary', { hasText: 'Enregistrer le formulaire' }).click(); await page.waitForTimeout(400);
const cfg = ((await db()).formulaires || []).find((x) => x.id === 'pesee');
ok('formulaire de pesée enregistré dans la base (caisses masquées, TAP obligatoire, état proposé, relevé personnalisé)', cfg && cfg.champs.caisses.vis === 'masque' && cfg.champs.tap.obligatoire === true && cfg.champs.etat.defaut === 'faible' && cfg.perso.length === 1 && cfg.perso[0].label === 'Pourriture grise' && cfg.perso[0].unite === '%', cfg);
// 3. la pesée en cours suit le nouveau formulaire
f = ov(); t = await txt(f);
ok('formulaire mis à jour : caisses masquées, TAP obligatoire (*), relevé personnalisé, lien « Afficher tous les champs (1 masqué) »', !(await f.locator('[aria-label="Nombre de caisses"]').count()) && /Afficher tous les champs \(1 masqué\)/i.test(t) && (await f.locator('[data-champ-perso]').count()) === 1 && /TAP \(% vol\.\) \*/i.test(t), t.slice(0, 500));
await f.locator('[data-heure]').fill('09:10');
await pick(page, f.locator('input[aria-label="Partenaire"]').first(), 'Lefèvre');
await pick(page, f.locator('input[placeholder^="Cru (village)"]').first(), 'Cramant');
await f.locator('[data-brut]').fill('4250'); await f.locator('[data-tare]').fill('250'); await page.waitForTimeout(100);
await f.locator('.sheet-f .btn-primary', { hasText: 'Peser et valider' }).click(); await page.waitForTimeout(400);
ok('TAP obligatoire : pesée refusée sans TAP (message)', /« TAP \(% vol\.\) » est obligatoire/.test(await page.locator('.toast').last().innerText().catch(() => '')) && (await page.locator('.overlay').count()) >= 1);
await f.locator('[data-tap]').fill('8,1'); await f.locator('[data-pourriture]').fill('3'); await f.locator('[data-champ-perso] input').first().fill('5'); await page.waitForTimeout(150);
t = await txt(f);
ok('TAP sous le minimum de richesse en sucre : alerte dans le formulaire (non bloquante)', /TAP de 8,1 % vol\. sous le minimum de richesse en sucre \(143 g\/L, soit 8,5 % vol\.\)/.test(t), t.slice(0, 600));
await page.screenshot({ path: SC + '/shots/t47-pesee.png' });
await f.locator('.sheet-f .btn-primary', { hasText: 'Peser et valider' }).click(); await page.waitForTimeout(500);
// 4. ticket : mentions obligatoires, relevés, champ masqué vide omis
const tk = await txt(ov());
ok('bon de pesée : mentions obligatoires (n°, apporteur, date et heure, cépage, revendication particulière, poids net)', /Ticket de pesée n° 5/.test(tk) && /Lefèvre/.test(tk) && /09:10/.test(tk) && /Chardonnay/.test(tk) && /Revendication particulière/i.test(tk) && /4 000 kg/.test(tk), tk);
ok('bon de pesée : pourriture acide, TAP et relevé personnalisé ; caisses (masquées, vides) omises', /Pourriture acide 3,0 %/i.test(tk) && /TAP \(titre alcoométrique volumique en puissance\) 8,1 % vol\./i.test(tk) && /Pourriture grise 5 %/i.test(tk) && !/Caisses/i.test(tk), tk);
await page.screenshot({ path: SC + '/shots/t47-ticket.png' });
await fermer();
let d = await db(); let o = d.ops.find((x) => x.type === 'apport' && x.pesee && x.pesee.num === 5 && x.date.startsWith('2026'));
ok('base : TAP, pourriture acide et relevé personnalisé enregistrés avec la pesée (validée)', o && o.pesee.tap === 8.1 && o.pesee.pourritureAcide === 3 && !!o.pesee.valide && (o.champs || []).some((x) => x.label === 'Pourriture grise' && x.valeur === 5 && x.unite === '%'), o && { pesee: o.pesee, champs: o.champs });
// 5. registre : colonnes TAP (alerte) et pourriture acide
t = await txt(page.locator('main'));
ok('registre : colonnes TAP et pourriture acide, TAP bas signalé', /TAP/.test(t) && /Pourr\. acide/i.test(t) && /8,1 %/.test(t) && (await page.locator('[data-tap-pesee].text-warn').count()) === 1, t.slice(0, 400));
// 6. correction d'un relevé (hors registre) : sans motif ; valeur effacée
await page.locator('tr', { has: page.locator('[data-num-pesee]', { hasText: /^5$/ }) }).locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(300);
f = ov(); ok('pesée validée rouverte : relevés repris (TAP 8,1 ; pourriture acide 3 ; relevé personnalisé 5)', (await f.locator('[data-tap]').inputValue()) === '8,1' && (await f.locator('[data-pourriture]').inputValue()) === '3' && (await f.locator('[data-champ-perso] input').first().inputValue()) === '5');
await f.locator('[data-pourriture]').fill(''); await f.locator('[data-tap]').fill('9,2');
await f.locator('.sheet-f .btn-primary', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(400);
d = await db(); o = d.ops.find((x) => x.id === o.id);
ok('relevés corrigés sans motif (hors registre) : pourriture acide effacée, TAP 9,2, pesée toujours validée', (await page.locator('.overlay').count()) === 0 && o.pesee.tap === 9.2 && o.pesee.pourritureAcide === undefined && !!o.pesee.valide, o && o.pesee);
// 7. nouvelle pesée : valeur proposée (état sanitaire) ; afficher les champs masqués
await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300); f = ov();
ok('nouvelle pesée : état sanitaire proposé « Faiblement altéré »', (await f.locator('select').filter({ has: page.locator('option[value="faible"]') }).first().inputValue()) === 'faible');
await f.locator('button', { hasText: /Afficher tous les champs/ }).click(); await page.waitForTimeout(150);
ok('« Afficher tous les champs » : les caisses masquées redeviennent saisissables', (await f.locator('[aria-label="Nombre de caisses"]').count()) === 1 && /masqué/.test(await txt(f)));
await fermer();
// 8. bilan, relevés, carnet
await sub('Bilan'); t = await txt(page.locator('main'));
ok('bilan : TAP moyen et pourriture acide', /TAP moyen/i.test(t) && /% vol\./.test(t) && /Pourriture acide/i.test(t), t.slice(0, 500));
await sub('Relevés'); t = await txt(page.locator('main'));
ok('relevés par apporteur : colonne TAP moyen', /TAP moyen/i.test(t));
await sub('Pressurages'); await page.locator('[data-nouveau-marc]').click(); await page.waitForTimeout(300); f = ov();
await f.locator('[data-remplir]').click().catch(() => {}); await page.waitForTimeout(300);
t = await txt(f);
ok('carnet : TAP moyen des pesées chargées proposé sous le TAV en puissance', /TAP moyen des pesées chargées : \d+,\d % vol\./.test(t), t.slice(0, 300));
await fermer();
// 9. réglages : résumé du formulaire de pesée
await sub('Réglages'); t = await txt(page.locator('[data-resume-formulaire-pesee]'));
ok('réglages : formulaire de pesée personnalisé résumé (1 masqué, 1 obligatoire, 1 champ personnalisé)', /Formulaire personnalisé : 1 champ\(s\) masqué\(s\), 1 obligatoire\(s\), 1 champ\(s\) personnalisé\(s\)\./.test(t), t);
ok('… bouton « Personnaliser le formulaire »', (await page.locator('[data-reglage-formulaire-pesee]').count()) === 1);
// 10. traduction (anglais, allemand)
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(300);
await sub('Weighings'); await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300); f = ov(); t = await txt(f);
ok('anglais : formulaire de pesée traduit (sour rot, PAV, personnaliser)', /Sour rot \(%\)/i.test(t) && /Potential alcohol \(% vol\.\)/i.test(t) && /Customise this form/.test(t) && /Show all fields \(1 hidden\)/.test(t) && !/Pourriture acide|Personnaliser/.test(t), t.slice(0, 500));
await f.locator('[data-personnaliser-pesee]').click(); await page.waitForTimeout(300); t = await txt(ov());
ok('anglais : éditeur du formulaire de pesée traduit', /Form — Weighing \(Press tab\)/.test(t) && /mandatory in the register/i.test(t) && !/Champs de la pesée/.test(t), t.slice(0, 400));
await fermer();
await page.locator('footer [data-langue]').selectOption('de'); await page.waitForTimeout(300);
await sub('Bilanz'); t = await txt(page.locator('main'));
ok('allemand : bilan (TAP moyen, pourriture acide) traduit', /Mittlerer potenzieller Alkohol/i.test(t) && /Essigfäule/i.test(t), t.slice(0, 400));
await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
ok('aucune erreur', !errors.length, errors.slice(0, 3));
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt47 : TOUT PASSE');
