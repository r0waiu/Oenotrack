// 0.19.0-alpha.1 : fiches d'enregistrement génériques (18 modèles, en-tête compact, prévu / relevé, fiche vierge, n° de fiche),
// modèles personnalisés d'une version antérieure conservés, éditeur (champs pré-remplis, zones), téléphone
import { open } from './ui.mjs'; import fs from 'fs'; import path from 'path';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
const { browser, page, errors } = await open({ viewport: { width: 1500, height: 1000 } });
const top = () => page.locator('.overlay').last(); const log = (...a) => console.log(...a); const ok = (n, c, x) => log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined ? x : '');
const dbj = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const echap = async (n = 1) => { for (let i = 0; i < n; i += 1) { await page.keyboard.press('Escape'); await page.waitForTimeout(200); } };
const modeles = async () => { await page.click('#tab-previsions'); await page.waitForTimeout(250); await page.locator('main [role=tab]', { hasText: 'Modèles de fiches' }).click(); await page.waitForTimeout(300); };
const ligne = (titre) => page.locator('main table tbody tr').filter({ has: page.locator('td:first-child b', { hasText: new RegExp(`^${titre}$`) }) });

// 1. les 18 modèles d'origine, sans rien de propre à une entreprise
await modeles();
const titres = await page.locator('main table tbody tr td:first-child b').allInnerTexts();
ok('18 modèles génériques', titres.length === 18 && ['Réception de vendange', 'Pressurage', 'Réception de moûts', 'Débourbage', 'Soutirages et transferts', 'Assemblage', 'Traitements et ajouts de produits', 'Levurage', 'Préparation', 'Stabilisation par le froid', 'Filtration', 'Suivi des fermentations', 'Jaugeage et inventaire des cuves', 'Tirage', 'Dégorgement', 'Sorties de vin et de sous-produits', 'Changements de stade', 'Nettoyage et désinfection'].every((t) => titres.includes(t)), titres.join(' | '));
let tout = '';
for (const t of titres) { await ligne(t).locator('button', { hasText: 'Aperçu' }).click(); await page.waitForTimeout(150); tout += ` ${await top().locator('.fiche').innerText()}`; await echap(); }
const interdits = ['RECM', 'Kieselguhr', 'Électrodialyse', 'C-AB-X', 'Bisulfite de potassium', '3,5 °C', 'crème de tartre', 'Désox', 'Code échantillon', 'hL / cm', 'Heure de fin', 'Version :', 'Créé le', 'bâtissage', 'Terre blanche'];
ok('aucune mention propre à une entreprise dans les 18 aperçus', interdits.every((x) => !tout.includes(x)), interdits.filter((x) => tout.includes(x)).join(', '));
ok('chaque fiche : observations, visa et case « saisi dans Œnotrack »', (tout.match(/Saisi dans Œnotrack le/g) || []).length === 18 && (tout.match(/Visa de l’opérateur/g) || []).length === 18);
// 2. en-tête compact (vierge) et fiche vierge imprimée
await ligne('Nettoyage et désinfection').locator('button', { hasText: 'Vierge' }).click(); await page.waitForTimeout(600);
const h = await top().locator('.fiche .fh2').first().evaluate((el) => el.getBoundingClientRect().height);
ok('en-tête compact (moins de 12 mm)', h < 12 * 3.78, `${Math.round(h)} px`);
ok('fiche vierge : n° et date à écrire à la main', (await top().locator('.fiche .fh2-no b').innerText()).trim() === '' && (await top().locator('.fiche .fh-ch').first().innerText()).replace(/\s+/g, ' ').trim() === 'Date :');
ok('fiche vierge : 14 lignes avec case « rinçage »', (await top().locator('.fiche .ft tbody tr').count()) === 14 && (await top().locator('.fiche .ft tbody tr').first().innerText()).includes('☐'));
const nf0 = (await dbj()).fiches.length;
const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), top().locator('button', { hasText: 'Imprimer (PDF)' }).click()]);
await dl.saveAs(SC + '/fiche-vierge.pdf'); const pdf = fs.readFileSync(SC + '/fiche-vierge.pdf');
ok('PDF de la fiche vierge', pdf.slice(0, 5).toString() === '%PDF-' && pdf.length > 5000, `${pdf.length} octets`);
ok('fiche vierge sans n° : pas notée dans « Fiches imprimées »', (await dbj()).fiches.length === nf0);
await page.screenshot({ path: SC + '/shots/t40-vierge.png' });
await echap();

// 3. fiches pré-remplies depuis les opérations de l'exemple
await page.click('#tab-ops'); await page.waitForTimeout(300); await page.locator('main select').first().selectOption({ label: 'Toutes les campagnes' }); await page.waitForTimeout(300);
const ficheDe = async (re) => { await page.locator('main tbody tr', { hasText: re }).first().locator('button[aria-label="Fiche d’enregistrement"]').click(); await page.waitForTimeout(700); return top().locator('.fiche').first(); };
let f = await ficheDe(/08\/11\/2026[^]*Transfert/);
let t = (await f.innerText()).replace(/\s+/g, ' ');
ok('transfert : modèle « Soutirages et transferts », n° MVT-261108-1', t.startsWith('Soutirages et transferts') && t.includes('MVT-261108-1'), t.slice(0, 120));
ok('transfert : volumes prévus (avant, transféré, après) en gris', /Cuve 02 P26-02-C 19,75 4,00 15,75 Œuf 01 0,00 4,00/.test(t) && (await f.locator('td.pre').count()) >= 7);
ok('transfert : cases « relevé » teintées', (await f.locator('tbody tr').first().locator('td.saisie').count()) === 5);
const nf1 = (await dbj()).fiches.length;
const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), top().locator('button', { hasText: 'Imprimer (PDF)' }).click()]); await dl2.path(); await page.waitForTimeout(800);
const fi = (await dbj()).fiches; ok('imprimée : notée dans « Fiches imprimées » avec son n°', fi.length === nf1 + 1 && fi[fi.length - 1].ordre === 'MVT-261108-1' && fi[fi.length - 1].modele === 'mouvements', JSON.stringify([nf1, fi.length, fi[fi.length - 1]]));
await echap();
f = await ficheDe(/15\/09\/2026[^]*Pressurage/); t = (await f.innerText()).replace(/\s+/g, ' ');
ok('pressurage : pressoir, n° de marc, raisins chargés et moûts obtenus', t.includes('Pressoir : Pressoir 4 000 kg') && t.includes('N° de marc / pressée : P26-05') && /EARL Marchand Vincelles Meunier Conventionnel 4 000/.test(t) && /Cuvée Bac D1 P26-05-C 20,50/.test(t), t.slice(0, 400));
await page.screenshot({ path: SC + '/shots/t40-pressurage.png' }); await echap();
f = await ficheDe(/15\/09\/2026[^]*Sulfitage/); t = (await f.innerText()).replace(/\s+/g, ' ');
ok('traitement : dose calculée et n° de lot prévu', /Cuve 08 M26-01-C 20,00 Métabisulfite de potassium 4,5 g\/hL 90 g SK-2609/.test(t), t.slice(t.indexOf('Cuve 08'), t.indexOf('Cuve 08') + 90)); await echap();
f = await ficheDe(/24\/09\/2026[^]*Suivi de fermentation/); t = (await f.innerText()).replace(/\s+/g, ' ');
ok('suivi des fermentations : toutes les cuves en fermentation, dernier relevé des jours précédents', (await f.locator('tbody tr td.pre').count()) > 10 && /Bac T RG26-01 10,00 En FA 1,031 · 18,0 °C \(21\/09\)/.test(t));
await echap();
f = await ficheDe(/05\/11\/2026[^]*Jaugeage/); t = (await f.innerText()).replace(/\s+/g, ' ');
const nInv = await f.locator('tbody tr').filter({ has: page.locator('td.pre') }).count();
ok('jaugeage : inventaire de toutes les cuves occupées, cuve jaugée en premier', nInv >= 10 && t.indexOf('Cuve 02') < t.indexOf('Amphore 01') && t.includes('Contenance (hL)'), nInv);
await echap();
f = await ficheDe(/05\/10\/2026[^]*Dégorgement/); t = (await f.innerText()).replace(/\s+/g, ' ');
ok('dégorgement : lot tiré, liqueur, dosage, matières sèches', t.includes('Lot tiré : T24-01') && t.includes('Liqueur d’expédition : LE-26-01') && t.includes('Dosage (g/L) : 8,0') && /Bouchon liège champenois 3 000 u BCH-2609/.test(t));
await echap();

// 4. modèles personnalisés avec une version antérieure : conservés ; « Rétablir » reprend le nouveau modèle
const d0 = await dbj();
d0.modelesFiches = [{ id: 'mouvements', titre: 'Mouvements (ma version)', prefixe: 'MVT', version: '3', orientation: 'paysage', logo: true, remarque: true, types: ['soutirage', 'transfert'], champs: ['n°Ordre', 'Date', 'Opérateur(s)'], tableaux: [{ titre: '', fill: 'mouvements', lignes: 8, zebre: true, fixes: '', cols: 'Opération {op}\nCuve de départ {dep}\nVolume avant\n  théo. {depAvT}\n  réel' }], notes: '' },
  { id: 'kieselguhr', titre: 'Filtration Kieselguhr', prefixe: 'FKG', version: '1', orientation: 'paysage', logo: true, remarque: true, types: [], champs: ['n°Ordre', 'Date'], tableaux: [{ titre: '', fill: 'filtration', lignes: 4, zebre: false, fixes: '', cols: 'Cuve de départ {dep}' }], notes: '' }];
await page.evaluate((x) => localStorage.setItem('oenotrack-db-v2', JSON.stringify(x)), d0); await page.reload(); await page.waitForTimeout(1500);
await modeles();
ok('anciens modèles personnalisés conservés (et signalés)', (await ligne('Mouvements \\(ma version\\)').count()) === 1 && (await ligne('Filtration Kieselguhr').count()) === 1 && (await page.locator('main').innerText()).includes('d’après les anciens modèles'));
await page.click('#tab-ops'); await page.waitForTimeout(300); await page.locator('main select').first().selectOption({ label: 'Toutes les campagnes' }); await page.waitForTimeout(300);
f = await ficheDe(/08\/11\/2026[^]*Transfert/);
ok('ancien modèle personnalisé : utilisé pour le transfert, sous-colonnes « réel » teintées', (await f.innerText()).startsWith('Mouvements (ma version)') && (await f.locator('td.saisie').count()) >= 8);
await echap();
await modeles();
await ligne('Mouvements \\(ma version\\)').locator('button', { hasText: 'Rétablir' }).click(); await page.waitForTimeout(200); await top().locator('button', { hasText: 'Rétablir' }).last().click(); await page.waitForTimeout(300);
ok('« Rétablir » : nouveau modèle d’origine', (await ligne('Soutirages et transferts').count()) === 1 && !(await dbj()).modelesFiches.some((m) => m.id === 'mouvements'));

// 5. éditeur : champ pré-rempli ajouté depuis la liste, visa du responsable, couleurs
await ligne('Changements de stade').locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400);
await top().locator('select[aria-label="Ajouter un champ pré-rempli"]').selectOption('cuve'); await page.waitForTimeout(150);
ok('champ pré-rempli ajouté (« Cuve {cuve} »)', (await top().locator('textarea[aria-label="Champs sous l’en-tête"]').inputValue()).split('\n').includes('Cuve {cuve}'));
await top().locator('label', { hasText: 'Visa du responsable' }).locator('input').check(); await page.waitForTimeout(150);
ok('aperçu : visa du responsable', (await top().locator('.fiche').innerText()).includes('Visa du responsable'));
await top().locator('button', { hasText: 'Noir et blanc contrasté' }).click(); await page.waitForTimeout(150);
ok('couleurs : noir et blanc contrasté', (await top().locator('.fiche .ft th').first().evaluate((el) => getComputedStyle(el).backgroundColor)) === 'rgb(0, 0, 0)');
await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(300);
const mo = (await dbj()).modelesFiches.find((m) => m.id === 'etapes');
ok('modèle enregistré (champ, visa, couleurs)', mo && mo.champs.includes('Cuve {cuve}') && mo.visaResp === true && mo.couleurs.th === '#000000');
await page.click('#tab-previsions'); await page.waitForTimeout(200); await page.locator('main [role=tab]', { hasText: 'Fiches imprimées' }).click(); await page.waitForTimeout(300);
log('erreurs :', errors.length ? errors : 'aucune');
await browser.close();

// 6. téléphone : la fiche défile dans sa boîte, la page ne déborde pas
{
  const { browser: b2, page: p2, errors: e2 } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
  await p2.click('#tab-previsions'); await p2.waitForTimeout(250); await p2.locator('main [role=tab]', { hasText: 'Modèles de fiches' }).click(); await p2.waitForTimeout(300);
  await p2.locator('main table tbody tr').first().locator('button', { hasText: 'Vierge' }).click(); await p2.waitForTimeout(600);
  const larg = await p2.evaluate(() => document.documentElement.scrollWidth);
  ok('téléphone : fiche vierge sans débordement de la page', larg <= 392, larg);
  await p2.screenshot({ path: SC + '/shots/t40-mobile.png' });
  log('erreurs (téléphone) :', e2.length ? e2 : 'aucune'); await b2.close();
}
