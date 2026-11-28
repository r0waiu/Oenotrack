// 0.26.0-alpha.1 : appareil photo sur téléphone (zones de dépôt), noms des nouveaux produits (casse), informations du produit lues dans
// les documents (script, assistant IA simulé), réglage de l'assistant ; anglais
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 600) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const JPEG = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AVN//2Q==', 'base64');

// 1. téléphone : « 📷 Photo » à côté des zones de dépôt (appareil photo arrière), photo nommée d'après la date
{
  const { browser, page, errors } = await open({ mobile: true, viewport: { width: 390, height: 844 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  await page.click('#tab-ops'); await page.waitForTimeout(400);
  await page.locator('main button:text-is("Soutirage")').click(); await page.waitForTimeout(500); const f = ov();
  // 0.48.0-alpha.1 : au téléphone, la section « Documents joints » (vide) est repliée avec son compteur : on la déplie
  await f.locator('[data-cf-tel="docs"] > summary').click(); await page.waitForTimeout(150);
  const ph = f.locator('[data-photo]');
  ok('téléphone : bouton « 📷 Photo » à côté de « Joindre des fichiers »', (await ph.count()) === 1 && await ph.isVisible() && /Photo/.test(await ph.innerText()) && (await f.locator('[data-zone-depot]').count()) === 1);
  const inp = f.locator('input[aria-label="Photo à joindre"]');
  ok('… ouvre l’appareil photo (image, caméra arrière) ; le choix de fichiers reste possible', (await inp.getAttribute('accept')) === 'image/*' && (await inp.getAttribute('capture')) === 'environment' && (await f.locator('input[aria-label="Fichiers à joindre"]').count()) === 1);
  await inp.setInputFiles({ name: 'image.jpg', mimeType: 'image/jpeg', buffer: JPEG }); await page.waitForTimeout(700);
  ok('photo jointe, nommée « photo-20261121-100000.jpg »', /photo-20261121-100000\.jpg/.test(await txt(f)), (await txt(f)).slice(-400));
  await page.screenshot({ path: SC + '/shots/t50-photo.png' });
  ok('téléphone : aucune erreur', !errors.length, errors);
  await browser.close();
}

// 2. ordinateur : pas de bouton photo ; noms des nouveaux produits ; informations du produit ; documents lus (script + IA simulée)
const IA = { appels: [] };
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
const routes = async (route, u) => {
  if (!u.startsWith('https://api.anthropic.com/')) return false;
  const rq = route.request(); if (rq.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return true; }
  const b = JSON.parse(rq.postData() || '{}'); const m = (b.messages || [])[0] ? b.messages[0].content : ''; IA.appels.push(m);
  const rep = /produits de nettoyage et de désinfection/.test(b.system || '') ? { secours: 'Rincer abondamment à l’eau.', contact: '20 min', stockage: null }
    : { fabricant: 'Faux Fabricant', conservation: '3 ans en emballage d’origine fermé', allergenes: null, doseEmploi: 'non précisé' };
  await route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: '```json\n' + JSON.stringify(rep) + '\n```' }] }) });
  return true;
};
const init = () => { try { localStorage.setItem('oenotrack-ia', JSON.stringify({ fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-essai' }, modeles: { anthropic: 'claude-essai' } })); } catch (e) { /* ignoré */ } };
const { browser, page, errors } = await open({ routes, init, viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
const ov = () => page.locator('.overlay').last();
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const fermer = async () => { for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
await page.click('#tab-ops'); await page.waitForTimeout(300); await page.locator('main button:text-is("Soutirage")').click(); await page.waitForTimeout(400);
ok('ordinateur : pas de bouton photo (glisser-déposer, choix de fichiers)', !(await ov().locator('[data-photo]').count()) && (await ov().locator('[data-zone-depot]').count()) === 1);
await fermer();

// noms : casse harmonisée à la création
await page.click('#tab-intrants'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Produits & règles' }).click(); await page.waitForTimeout(300);
await page.locator('main button', { hasText: '＋ Nouveau produit' }).click(); await page.waitForTimeout(300); let f = ov();
await f.locator('input').first().fill('PROVINHY OX2'); await page.waitForTimeout(150);
ok('nouveau produit : « Enregistré sous « Provinhy OX2 » » annoncé', /Enregistré sous « Provinhy OX2 »/.test(await txt(f)));
await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
let d = await db();
ok('… enregistré « Provinhy OX2 » (sigles et codes gardés)', d.produits.some((p) => p.nom === 'Provinhy OX2') && !d.produits.some((p) => p.nom === 'PROVINHY OX2'));
const pr = d.produits.find((p) => p.nom === 'Provinhy OX2');
await page.locator('main tr', { hasText: 'Provinhy OX2' }).first().locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(300); f = ov();
await f.locator('input').first().fill('PROVINHY OX2 (lot test)'); await page.waitForTimeout(150);
ok('modification d’un produit : nom gardé tel quel (pas de casse imposée)', !/Enregistré sous/.test(await txt(f)));
await f.locator('input').first().fill('Provinhy OX2');
// informations du produit (fiche)
await f.locator('[data-produit-infos] button[aria-expanded]').click(); await page.waitForTimeout(150);
ok('fiche du produit : « Informations du produit (fiche technique, FDS) » — fabricant, composition, dose et mode d’emploi, stockage, conservation, allergènes, bio', /Fabricant/i.test(await txt(f.locator('[data-produit-infos]'))) && /Dose d’emploi/i.test(await txt(f.locator('[data-produit-infos]'))) && /Utilisation en bio/i.test(await txt(f.locator('[data-produit-infos]'))) && /0 \/ 8/.test(await txt(f.locator('[data-produit-infos]'))));
await f.locator('[data-produit-infos] label', { hasText: 'Dose d’emploi' }).locator('input').fill('5 à 15 g/hL');
// document déposé sur le produit : lu (script) et complété par l'IA (simulée)
const ft = ['FICHE TECHNIQUE', 'PROVINHY OX2', 'Composition : levures inactivées spécifiques', 'Doses d’emploi :', '10 à 30 g/hL', '', 'Mode d’emploi', 'Disperser dans 10 fois son poids d’eau, incorporer lors d’un remontage.', 'Conditions de stockage : local frais et sec.', 'Allergènes : aucun', 'Fabricant : Œnologie Exemple SAS', 'Date : 03/2026'].join('\n');
await f.locator('input[aria-label="Fichiers à joindre"]').setInputFiles({ name: 'FT_provinhy_ox2.txt', mimeType: 'text/plain', buffer: Buffer.from(ft, 'utf8') }); await page.waitForTimeout(1500);
let dep = ov(); const inf = dep.locator('[data-fiche-infos]');
ok('document lu : « Pour la fiche du produit » avec les informations du script', (await inf.count()) === 1 && (await inf.locator('[data-info="composition"]').isChecked()) && (await inf.locator('[data-info="modeEmploi"]').isChecked()) && /Œnologie Exemple SAS/.test(await txt(inf)), await txt(dep).catch(() => ''));
ok('… dose d’emploi déjà saisie dans le formulaire mais pas encore enregistrée : proposée (case cochée)', (await inf.locator('[data-info="doseEmploi"]').count()) === 1);
ok('… IA (simulée) : complète ce que le script n’a pas trouvé (conservation 🤖), « non précisé » écarté ; le script garde la main (fabricant)', /🤖 complété par Claude/.test(await txt(inf)) && /3 ans en emballage d’origine fermé/.test(await txt(inf)) && !/Faux Fabricant/.test(await txt(inf)) && !/non précisé/.test(await txt(inf)) && IA.appels.length === 1 && /PROVINHY OX2/.test(IA.appels[0]) && /Produit : Provinhy OX2/.test(IA.appels[0]));
await inf.locator('[data-info="allergenes"]').uncheck();
await page.screenshot({ path: SC + '/shots/t50-infos.png' });
await dep.locator('.sheet-f .btn-primary, .sheet-f button', { hasText: 'Joindre 1 document' }).first().click(); await page.waitForTimeout(600);
d = await db(); const p2 = d.produits.find((p) => p.id === pr.id);
ok('joint : informations cochées reprises sur l’intrant (allergènes décochés : non repris)', p2.composition === 'levures inactivées spécifiques' && /^Disperser/.test(p2.modeEmploi) && p2.stockage === 'local frais et sec.' && p2.fabricant === 'Œnologie Exemple SAS' && p2.conservation === '3 ans en emballage d’origine fermé' && !p2.allergenes && (d.docs || []).some((x) => x.cible && x.cible.id === pr.id && x.nom === 'FT_provinhy_ox2.txt'), p2);
f = ov();
ok('formulaire resté ouvert : champs non modifiés mis à jour, saisie en cours gardée', (await f.locator('[data-produit-infos] label', { hasText: 'Composition' }).locator('textarea').inputValue()) === 'levures inactivées spécifiques' && (await f.locator('[data-produit-infos] label', { hasText: 'Dose d’emploi' }).locator('input').inputValue()) === '5 à 15 g/hL');
await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
d = await db(); const p3 = d.produits.find((p) => p.id === pr.id);
ok('enregistré : informations du document gardées, dose saisie enregistrée', p3.composition === 'levures inactivées spécifiques' && p3.doseEmploi === '5 à 15 g/hL' && p3.conservation === '3 ans en emballage d’origine fermé');

// produit d'hygiène : nom à la création, FDS relue avec l'IA (simulée)
await page.click('#tab-hygiene'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Produits d’hygiène' }).click(); await page.waitForTimeout(300);
await page.locator('main button', { hasText: '＋ Nouveau produit' }).click(); await page.waitForTimeout(300); f = ov();
await f.locator('label', { hasText: 'Nom du produit' }).locator('input').fill('HYDROSANT SP'); await page.waitForTimeout(150);
ok('produit d’hygiène : « Enregistré sous « Hydrosant SP » »', /Enregistré sous « Hydrosant SP »/.test(await txt(f)));
await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500); await fermer();
d = await db(); const hy = d.produitsHygiene.find((p) => p.nom === 'Hydrosant SP');
ok('… créé « Hydrosant SP »', !!hy);
const fds = ['FICHE DE DONNÉES DE SÉCURITÉ', 'RUBRIQUE 1 : Identification', 'Nom du produit : HYDROSANT SP', 'Fournisseur : Hygiène Exemple SA', 'RUBRIQUE 2 : Identification des dangers', 'H314 Provoque de graves brûlures de la peau et de graves lésions des yeux.', 'RUBRIQUE 3 : Composition', 'Hydroxyde de sodium 10-25 %', 'RUBRIQUE 4 : Premiers secours', 'RUBRIQUE 7 : Manipulation et stockage', 'Stocker au frais.', 'RUBRIQUE 8 : Contrôles de l’exposition', 'Gants, lunettes.'].join('\n');
await page.locator('main tr, main .card', { hasText: 'Hydrosant SP' }).first().click(); await page.waitForTimeout(400);
await ov().locator('button', { hasText: 'Modifier' }).first().click(); await page.waitForTimeout(400); f = ov();
const n0 = IA.appels.length;
await f.locator('input[aria-label="Fiche de données de sécurité à lire"]').setInputFiles({ name: 'FDS_hydrosant.txt', mimeType: 'text/plain', buffer: Buffer.from(fds, 'utf8') }); await page.waitForTimeout(1500);
const rv = f.locator('[data-fds-revue]');
ok('FDS relue : revue avec les lignes de l’IA marquées 🤖 (premiers secours, temps de contact)', (await rv.count()) === 1 && /🤖 Premiers secours/.test(await txt(rv)) && /🤖 Temps de contact/.test(await txt(rv)) && IA.appels.length === n0 + 1 && /HYDROSANT SP/.test(IA.appels[n0]), (await rv.count()) ? await txt(rv) : '');
await rv.locator('button', { hasText: 'Reprendre la sélection' }).click(); await page.waitForTimeout(400);
ok('… reprises dans la fiche (premiers secours, temps de contact)', /Rincer abondamment/.test(await f.locator('textarea').allInnerTexts().then((a) => a.join(' ')).catch(() => '') + await f.evaluate((el) => Array.from(el.querySelectorAll('textarea,input')).map((x) => x.value).join(' '))) && (await f.evaluate((el) => Array.from(el.querySelectorAll('input')).some((x) => x.value === '20 min'))));
await fermer();

// réglage de l'assistant : compléter les fiches (activé par défaut)
await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Assistant IA' }).click(); await page.waitForTimeout(300);
const chk = page.locator('main label', { hasText: 'Compléter les fiches produits avec l’IA' }).locator('input');
ok('Assistant IA : « Compléter les fiches produits avec l’IA à chaque lecture de document » activé par défaut, et décrit', (await chk.isChecked()) && /Compléter les fiches produits/.test(await txt(page.locator('main'))));
await chk.uncheck(); await page.waitForTimeout(200);
ok('… décoché : réglage gardé sur cet appareil seulement (jamais dans la base)', (await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-ia')).completer)) === false && !JSON.stringify(await db()).includes('sk-ant-essai'));

// anglais
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(300);
await page.click('#tab-intrants'); await page.waitForTimeout(300); await page.locator('main [role=tab]').nth(1).click(); await page.waitForTimeout(300);
await page.locator('main tr', { hasText: 'Provinhy OX2' }).first().locator('button', { hasText: /^(Edit|Modifier)$/ }).first().click(); await page.waitForTimeout(300); f = ov();
ok('anglais : « Product information (technical data sheet, SDS) », « Dosage »', /Product information \(technical data sheet, SDS\)/.test(await txt(f)) && !/Informations du produit/.test(await txt(f)));
if ((await f.locator('[data-produit-infos] button[aria-expanded]').getAttribute('aria-expanded')) !== 'true') await f.locator('[data-produit-infos] button[aria-expanded]').click(); await page.waitForTimeout(150);
ok('… champs traduits', /Dosage/i.test(await txt(f)) && /Shelf life/i.test(await txt(f)) && /Use in organic production/i.test(await txt(f)));
await fermer(); await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
ok('aucune erreur', !errors.length, errors);
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt50 : TOUT PASSE');
await browser.close();
process.exitCode = ko ? 1 : 0;
