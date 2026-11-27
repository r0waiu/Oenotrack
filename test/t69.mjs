// 0.36.0-alpha.1 : Intrants — régularisation manuelle d'un lot fournisseur (inventaire compté), historique des mouvements ; fiche du produit
// avec allergènes à cocher et revendications Oui / Non (même donnée que « Produits & règles par revendication ») ; dépôt d'une FT : allergènes
// et revendications repérés ; fiche récapitulative à colonnes choisies (CSV) ; Équipements › Maintenance › Produits de maintenance (catalogue,
// suivi du stock, mouvement, fiche récapitulative) ; anglais.
// Données fictives : test/fixtures/base-0.36.0-alpha.1-intrants.json.
import { open } from './ui.mjs'; import fs from 'fs'; import path from 'path';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const db0 = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'base-0.36.0-alpha.1-intrants.json'), 'utf8'));
db0.settings.securite = { ...db0.settings.securite, actif: false };
const init = { content: `if (!sessionStorage.getItem('semee')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(db0))}); sessionStorage.setItem('semee', '1'); } window.print = () => {};
  window.showSaveFilePicker = undefined; window.__fichiers = []; const c0 = URL.createObjectURL; URL.createObjectURL = (b) => { window.__fichiers.push(b); return c0.call(URL, b); };` };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const ov = () => page.locator('.overlay').last();
const toast = async () => page.locator('.toast').last().innerText().catch(() => '');
const fermer = async () => { for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
const a2 = db0.arrivages.find((a) => a.id === db0.regulStocks[1].arrivageId); const p2 = db0.produits.find((p) => p.id === a2.produitId);

// 1. régularisation d'un lot (inventaire compté)
await page.click('#tab-intrants'); await page.waitForTimeout(300);
await page.locator('main tr', { hasText: a2.numLot }).first().locator(`[data-regul-lot="${a2.id}"]`).click(); await page.waitForTimeout(400);
let s = ov(); let t = await txt(s);
ok('régularisation : formulaire prérempli (produit, lot), motif Inventaire, restant du lot à la date', /Régulariser le stock/.test(t) && /Restant au/.test(t) && (await s.locator('[aria-label="Quantité comptée"]').count()) === 1, t.slice(0, 400));
await s.locator('[aria-label="Quantité comptée"]').fill('100'); await page.waitForTimeout(200);
ok('… aperçu : stock après régularisation et écart', /après régularisation : 100,00/.test(await txt(s.locator('[data-regul-apercu]'))), await txt(s.locator('[data-regul-apercu]')));
await s.locator('[aria-label="Notes de la régularisation"]').fill('Inventaire test t69');
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
let d = await db(); const rg = d.regulStocks.find((x) => x.notes === 'Inventaire test t69');
ok('régularisation enregistrée (compté 100, écart tracé, auteur, date)', d.regulStocks.length === 3 && rg && rg.compte === 100 && rg.motif === 'inventaire' && rg.date === '2026-11-26' && rg.qty < 0, rg);
ok('… restant du lot affiché : 100,00', /100,00/.test(await txt(page.locator('main tr', { hasText: a2.numLot }).first())));
// 2. historique des mouvements
await page.locator('main select[aria-label="Vue"], main [aria-label="Vue"]').first().selectOption('mouv').catch(async () => { await page.locator('main [aria-label="Vue"]').first().click(); await page.locator('[role=option]', { hasText: 'Historique des mouvements' }).click(); });
await page.waitForTimeout(300);
const pick = page.locator('[data-mouvements] [aria-label="Produit de l’historique"]');
await pick.selectOption(p2.id).catch(async () => { await pick.fill(p2.nom); await page.locator('[role=option]', { hasText: p2.nom }).first().click(); }); await page.waitForTimeout(300);
t = await txt(page.locator('[data-mouvements]'));
ok('historique des mouvements : réception, régularisations (casse, inventaire), solde 100,00', /Réception/.test(t) && /Régularisation : Casse/.test(t) && /Régularisation : Inventaire/.test(t) && /100,00/.test(t), t.slice(0, 600));
// 3. fiche du produit : allergènes, revendications Oui / Non
await page.locator('main [role=tab]', { hasText: 'Produits & règles' }).click(); await page.waitForTimeout(300);
await page.locator('main tr', { hasText: p2.nom }).first().locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400); s = ov();
t = await txt(s.locator('[data-produit-allergenes-rev]'));
ok('fiche du produit : « Allergènes & revendications », Enzymes coché, BIO : Non, Demeter', /Allergènes & revendications/i.test(t) && await s.locator('[data-allergenes] label', { hasText: 'Enzymes' }).locator('input').isChecked() && (await s.locator('[data-rev="bio"] [data-oui-non="non"][aria-pressed="true"]').count()) === 1 && (await s.locator('[data-rev="dem"]').count()) === 1, t);
await s.locator('[data-allergenes] label', { hasText: 'Lait (caséine' }).locator('input').check();
await s.locator('[data-rev="dem"] [data-oui-non="oui"]').click(); await page.waitForTimeout(100);
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
d = await db(); let pp = d.produits.find((p) => p.id === p2.id); const rd = d.regles.find((r) => r.produitId === p2.id && r.qualifId === 'dem');
ok('enregistré : allergènes (enzymes, lait), Demeter Oui écrit dans la règle (vérifiée)', pp.allergenesListe.join() === 'lait,enzymes' && rd.autorise && rd.aVerifier === false, [pp.allergenesListe, rd]);
const row = page.locator('main tr', { hasText: p2.nom }).first();
ok('… onglet « Produits & règles » : Demeter « Autorisé », allergènes sous le nom', /Lait, Enzymes/.test(await txt(row)) && (await row.locator('td').nth(3).locator('input[type=checkbox]').isChecked()), await txt(row));
// 4. dépôt d'une FT : allergènes et bio repérés
await row.locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400); s = ov();
const ft = ['FICHE TECHNIQUE', p2.nom.toUpperCase(), 'Composition : préparation enzymatique, ovalbumine', 'Utilisable en agriculture biologique (règlement (UE) 2018/848)', 'Allergènes', 'Gluten : non', 'Date : 03/2026'].join('\n');
await s.locator('input[aria-label="Fichiers à joindre"]').setInputFiles({ name: 'FT_t69.txt', mimeType: 'text/plain', buffer: Buffer.from(ft, 'utf8') }); await page.waitForTimeout(1500);
let dep = ov(); const inf = dep.locator('[data-fiche-infos]'); t = await txt(inf);
ok('dépôt : « Allergènes (liste) » Œuf ajouté (coché), « Utilisable en BIO » Oui proposé — décoché : le choix Non avait été vérifié', /Allergènes \(liste\)/.test(t) && /Œuf/.test(t) && /Utilisable en BIO/.test(t) && await inf.locator('[data-info="allergenesListe"]').isChecked() && !(await inf.locator('[data-info="rev:bio"]').isChecked()), t);
await inf.locator('[data-info="rev:bio"]').check(); await inf.locator('[data-info="allergenes"]').uncheck();
await dep.locator('.sheet-f button', { hasText: 'Joindre 1 document' }).first().click(); await page.waitForTimeout(700);
d = await db(); pp = d.produits.find((p) => p.id === p2.id); const rb = d.regles.find((r) => r.produitId === p2.id && r.qualifId === 'bio');
ok('… repris : Œuf ajouté (lait, enzymes gardés), bio Oui « lu dans une FT / FDS déposée », à vérifier', pp.allergenesListe.join() === 'oeuf,lait,enzymes' && rb.autorise && rb.aVerifier && /lu dans/.test(rb.source), [pp.allergenesListe, rb]);
ok('… formulaire ouvert : la fiche suit (Œuf coché, bio Oui)', await ov().locator('[data-allergenes] label', { hasText: 'Œuf (albumine' }).locator('input').isChecked() && (await ov().locator('[data-rev="bio"] [data-oui-non="oui"][aria-pressed="true"]').count()) === 1);
await fermer();
// 5. fiche récapitulative (colonnes, CSV)
await page.locator('main [data-recap-ouvrir]').first().click(); await page.waitForTimeout(400); s = ov();
ok('fiche récapitulative : colonnes par défaut, aperçu', /Fiche récapitulative des produits œnologiques/.test(await txt(s)) && (await s.locator('[data-recap] th').count()) === 6);
await s.locator('[data-recap-colonnes] label', { hasText: 'Utilisable en bio' }).locator('input').check(); await s.locator('[data-recap-colonnes] label', { hasText: /^FDS$/ }).locator('input').uncheck(); await page.waitForTimeout(200);
const ths = await s.locator('[data-recap] th').allInnerTexts(); const lr = await txt(s.locator('[data-recap] tr', { hasText: p2.nom }).first());
ok('… colonne ajoutée et retirée, ligne du produit (stock, revendications compatibles, allergènes)', ths.length === 6 && ths.some((h) => /Utilisable en bio/i.test(h)) && !ths.some((h) => /^FDS$/i.test(h)) && /\d,\d\d g/.test(lr) && /BIO/.test(lr) && /Œuf, Lait, Enzymes/.test(lr), [ths, lr]);
await s.locator('[data-recap-csv]').click(); await page.waitForTimeout(500);
const csv = await page.evaluate(async () => { const b = window.__fichiers.filter((x) => /csv/.test(x.type)).pop(); return b ? b.text() : ''; });
ok('… CSV téléchargé (en-têtes choisis, ligne du produit)', /^﻿?Produit;Fournisseur;Stock actuel;Revendications compatibles;Utilisable en bio;Allergènes/.test(csv) && csv.includes(p2.nom), csv.slice(0, 300));
await page.screenshot({ path: SC + '/shots/t69-recap.png' });
ok('… choix des colonnes retenu (cet appareil)', await page.evaluate(() => /bio/.test(localStorage.getItem('oenotrack-recap-intrants') || '')));
await fermer();
// 6. Équipements › Maintenance › Produits de maintenance
await page.click('#tab-equipements'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Maintenance' }).click(); await page.waitForTimeout(300);
ok('maintenance : « Plan & interventions » par défaut (plan inchangé)', (await page.locator('[data-maint-vue="plan"][aria-pressed="true"]').count()) === 1 && /Plan de maintenance du matériel/.test(await txt(page.locator('main'))));
await page.locator('[data-maint-vue="produits"]').click(); await page.waitForTimeout(300);
t = await txt(page.locator('[data-produits-maintenance]'));
ok('catalogue : 2 produits, contact alimentaire, cave, FDS, stock 2,50 kg / non suivi', /Graisse alimentaire fictive H1/.test(t) && /Joint de porte de cuve fictif/.test(t) && /2,50 kg/.test(t) && /non suivi/.test(t) && /FDS du 01\/03\/2025/.test(t) && /FDS non requise/.test(t), t.slice(0, 600));
await page.locator('[data-maint-produit-nouveau]').click(); await page.waitForTimeout(300); s = ov();
await s.locator('[aria-label="Nom du produit de maintenance"]').fill('Huile de compresseur fictive'); await s.locator('[aria-label="Fournisseur du produit de maintenance"]').fill('Fournisseur test');
await s.locator('[aria-label="Usage"]').fill('Compresseur du pressoir'); await s.locator('[aria-label="Agréé contact alimentaire"] [data-oui-non="non"]').click(); await s.locator('[aria-label="Utilisation en cave de vinification"] [data-oui-non="oui"]').click();
ok('… alerte : utilisé en cave sans agrément contact alimentaire', /sans agrément contact alimentaire/.test(await txt(s)));
await s.locator('[data-suivi-stock] input[type=checkbox]').check(); await page.waitForTimeout(100); await s.locator('[aria-label="Stock minimal"]').fill('2');
await s.locator('button', { hasText: '+ Champ' }).click(); await s.locator('[aria-label="Nom du champ 1"]').fill('Viscosité'); await s.locator('[aria-label="Valeur du champ 1"]').fill('ISO VG 46');
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
d = await db(); const hp = d.produitsMaintenance.find((p) => p.nom === 'Huile de compresseur fictive');
ok('produit de maintenance créé (fournisseur, usage, contact Non, cave Oui, suivi du stock, champ perso)', hp && hp.fournisseur === 'Fournisseur test' && hp.contactAlimentaire === 'non' && hp.caveVinif === 'oui' && hp.suiviStock && hp.seuil === 2 && hp.champs[0].valeur === 'ISO VG 46', hp);
await page.locator(`[data-maint-mouv="${hp.id}"]`).click(); await page.waitForTimeout(300); s = ov();
await s.locator('[aria-label="Quantité du mouvement"]').fill('5'); await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
d = await db(); ok('… entrée de 5 enregistrée, stock affiché', d.mouvementsMaintenance.filter((m) => m.produitId === hp.id).length === 1 && /5,00 u/.test(await txt(page.locator('main tr', { hasText: 'Huile de compresseur fictive' }).first())));
await page.locator(`[data-maint-stock="${hp.id}"]`).click(); await page.waitForTimeout(300);
ok('… historique du stock (solde)', /Entrée \(réception\)/.test(await txt(ov())) && /Stock actuel : 5,00 u/.test(await txt(ov())));
await fermer();
await page.locator('[data-recap-maint]').click(); await page.waitForTimeout(300); s = ov();
t = await txt(s.locator('[data-recap="maintenance"]'));
ok('fiche récapitulative des produits de maintenance (contact alimentaire, cave, stock)', /Fiche récapitulative des produits de maintenance/.test(t) && /Huile de compresseur fictive/.test(t) && /Agréé contact alimentaire/i.test(t) && /5,00 u/.test(t), t.slice(0, 400));
await fermer();
// 7. anglais
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1200);
await page.click('#tab-equipements'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Maintenance' }).click(); await page.waitForTimeout(300);
await page.locator('[data-maint-vue="produits"]').click(); await page.waitForTimeout(300);
t = await txt(page.locator('main'));
ok('anglais : « Maintenance products », « Food contact », « Winemaking cellar », « Summary sheet »', /Maintenance products/.test(t) && /Food contact/i.test(t) && /Winemaking cellar/i.test(t) && /Summary sheet/.test(t), t.slice(0, 500));
await page.click('#tab-intrants'); await page.waitForTimeout(300);
t = await txt(page.locator('main'));
ok('anglais : « ± Adjust » sur les lots', /± Adjust/.test(t));
ok('aucune erreur de la page', errors.length === 0, errors);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (t69 : régularisations, allergènes, revendications Oui / Non, fiches récapitulatives, produits de maintenance)');
process.exitCode = ko ? 1 : 0;
