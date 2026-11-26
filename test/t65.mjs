// 0.32.0-alpha.1 : DRM (Registres › 📮 DRM) — balance par produit (exemples champenois), contrôles, réglages (n° d'accise, produits,
// rattachement manuel), bouteilles finies sorties saisies à la DRM, fichier XML DTI+ pour CIEL et pour le CIVC (validé par le schéma de la
// douane si OENOTRACK_XSD_DTI indique son chemin), CSV, impression, « déposée » ; DRA ; registre d'enrichissement ; anglais. Données fictives.
import { open } from './ui.mjs'; import fs from 'fs'; import { execFileSync } from 'child_process';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true }); fs.mkdirSync(SC + '/dl', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const init = () => { window.__saved = []; window.__imp = [];
  window.claude = { use: async (n) => (n === 'downloads' ? { save: async ({ filename, data }) => { const text = typeof data === 'string' ? data : await data.text(); window.__saved.push({ filename, text }); return { status: 'saved' }; } } : null) };
  window.print = () => { window.dispatchEvent(new Event('beforeprint')); const z = document.getElementById('zone-impression'); window.__imp.push({ texte: z ? z.textContent.replace(/\s+/g, ' ').slice(0, 4000) : '', orientation: z ? z.dataset.orientation || '' : '' }); window.dispatchEvent(new Event('afterprint')); }; };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const ov = () => page.locator('.overlay').last();
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const sous = async (t) => { await page.locator('main [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(400); };
const fermer = async () => { for (let i = 0; i < 5 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
const saved = () => page.evaluate(() => window.__saved);
const vide = () => page.evaluate(() => { window.__saved = []; window.__imp = []; });
const toast = async () => page.locator('.toast').last().innerText().catch(() => '');
const xsd = process.env.OENOTRACK_XSD_DTI && fs.existsSync(process.env.OENOTRACK_XSD_DTI) ? process.env.OENOTRACK_XSD_DTI : '';
const valide = (texte, nom) => { const f = `${SC}/dl/${nom}`; fs.writeFileSync(f, texte); if (!xsd) return true; try { execFileSync('xmllint', ['--noout', '--schema', xsd, f], { stdio: 'pipe' }); return true; } catch (e) { console.log(String(e.stderr || e.message).slice(0, 800)); return false; } };
const cellule = async (ligne, col) => page.locator(`[data-drm-balance] tr[data-drm-ligne="${ligne}"] td`).nth(col).innerText().catch(() => '');

// 1. Registres › DRM : octobre 2026 par défaut (mois précédent), exemples champenois, contrôles
await page.click('#tab-registres'); await page.waitForTimeout(400); await sous('DRM');
let t = await txt(page.locator('main'));
const hP = await page.locator('[data-drm-balance] thead th[data-drm-produit]').allInnerTexts();
ok('DRM d’octobre 2026 par défaut, « à déposer » ; produits en colonnes : vins tranquilles et mousseux (exemples champenois)', /octobre 2026/i.test(await page.locator('select[aria-label="Période de la DRM"] option:checked').innerText()) && /à déposer/.test(t) && hP.length === 2 && /vins tranquilles/i.test(hP[0]) && /VT_IG_AOP/.test(hP[0]) && /mousseux/i.test(hP[1]), hP);
ok('… stocks : tranquilles 226,30 hL ; mousseux 141,90 hL (bouteilles sur lattes et dégorgées) ; « dont bouteilles finies » 3 000', (await cellule('s0', 1)) === '226,30' && (await cellule('s1', 2)) === '141,90' && /3\s000/.test(t), [await cellule('s0', 1), await cellule('s1', 2)]);
ok('… contrôles : n° d’accise à indiquer (bloquant), produits d’exemple à vérifier', /N° d’accise \(13 caractères\) à indiquer/.test(t) && /produit d’exemple à vérifier/.test(t) && await page.locator('[data-drm-deposer]').isDisabled());
await vide(); await page.locator('[data-drm-xml]').click(); await page.waitForTimeout(500);
ok('« ⬇ XML douane (CIEL) » sans n° d’accise : refusé, rien d’enregistré', !(await saved()).length && /N° d’accise/.test(await toast()));
await page.screenshot({ path: SC + '/shots/t65-drm.png' });
// 2. réglages : n° d'accise, CVI, CIVC ; produit mousseux (code INAO, code CIVC, vérifié) ; rattachement manuel d'un lot
await page.locator('[data-drm-reglages]').click(); await page.waitForTimeout(400);
await ov().locator('input[aria-label="N° d’accise"]').fill('FR12345'); await ov().locator('input[aria-label="N° CVI"]').click(); await page.waitForTimeout(300);
ok('n° d’accise incomplet refusé (13 caractères)', /13 caractères/.test(await toast()) && !((await db()).settings.drm || {}).accise);
await ov().locator('input[aria-label="N° d’accise"]').fill('FR012345E6789'); await ov().locator('input[aria-label="N° CVI"]').click(); await page.waitForTimeout(300);
await ov().locator('input[aria-label="N° CVI"]').fill('5101234567'); await ov().locator('input[aria-label="N° CIVC"]').click(); await page.waitForTimeout(300);
await ov().locator('input[aria-label="N° CIVC"]').fill('CIVC-0042'); await ov().locator('input[aria-label="N° d’accise"]').click(); await page.waitForTimeout(300);
let d = await db(); ok('identifiants enregistrés (accise, CVI, CIVC)', d.settings.drm.accise === 'FR012345E6789' && d.settings.drm.cvi === '5101234567' && d.settings.drm.civc === 'CIVC-0042', d.settings.drm);
ok('produits : 6 exemples (tranquilles, mousseux, rebêches, lies et bourbes, Coteaux champenois, Rosé des Riceys) « exemple à vérifier »', (await ov().locator('[data-drm-produits] tbody tr').count()) === 6 && ((await txt(ov().locator('[data-drm-produits]'))).match(/exemple à vérifier/g) || []).length === 6);
await ov().locator('[data-drm-produits] tbody tr', { hasText: 'mousseux' }).locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(400);
let f = ov(); await f.getByRole('textbox', { name: /^Code INAO/ }).fill('1S001M');
await f.getByRole('textbox', { name: /^Code CIVC/ }).fill('CIV');
await f.locator('label', { hasText: 'Vérifié (sinon : à vérifier)' }).locator('input[type=checkbox]').check();
await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('code CIVC trop court refusé', /Code CIVC : 5 à 8 caractères/.test(await toast()) && (await page.locator('.overlay').count()) >= 2);
await f.getByRole('textbox', { name: /^Code CIVC/ }).fill('CHMOUS01'); await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
d = await db(); const pM = d.drmProduits.find((p) => p.id === 'ex-champ-vm');
ok('produit mousseux : code INAO, code CIVC, vérifié ; exemples copiés dans la base', d.drmProduits.length === 6 && pM.codeInao === '1S001M' && pM.codeCivc === 'CHMOUS01' && !pM.aVerifier && !!pM.verifiePar !== undefined, pM);
const lotT = ov().locator('[data-drm-lots] tbody tr', { hasText: 'AS25-03' });
ok('rattachement : lot AS25-03 (tailles) au produit automatique « vins tranquilles »', /vins tranquilles/.test(await txt(lotT)), await txt(lotT));
await lotT.locator('select').selectOption({ label: 'Coteaux champenois' }); await page.waitForTimeout(400);
d = await db(); ok('… rattaché à la main à « Coteaux champenois »', (d.drmRattachements || []).some((r) => r.produitId === 'ex-coteaux' && d.lots.find((l) => l.id === r.id).code === 'AS25-03'));
await page.screenshot({ path: SC + '/shots/t65-reglages.png' });
await fermer();
t = await txt(page.locator('main'));
ok('balance : trois produits (Coteaux champenois avec AS25-03, 8,00 hL) ; plus de contrôle bloquant', (await page.locator('[data-drm-balance] thead th[data-drm-produit]').count()) === 3 && /Coteaux champenois/i.test(await txt(page.locator('[data-drm-balance] thead'))) && (await cellule('s1', 3)) === '8,00' && !(await page.locator('[data-drm-deposer]').isDisabled()), t.slice(0, 400));
// 3. bouteilles finies sorties en octobre : 1 200 en France, 300 à l'export, 12 en dégustation
const sl = page.locator('[data-drm-saisie="ex-champ-vm"]');
ok('saisie des bouteilles finies : produit mousseux, 0 en stock au début (dégorgement du 05/10)', (await sl.count()) === 1 && /^0$/.test((await sl.locator('td').nth(1).innerText()).trim()));
const cases = sl.locator('input[inputmode=numeric]');
await cases.nth(0).fill('1200'); await cases.nth(1).click(); await cases.nth(1).fill('300'); await cases.nth(2).click(); await cases.nth(2).fill('12'); await cases.nth(0).click(); await page.waitForTimeout(500);
d = await db(); const sv = (d.drmSorties || []).find((x) => x.periode === 'M:2026-10' && x.produitId === 'ex-champ-vm');
ok('… enregistrées (bouteilles) pour octobre', !!sv && sv.ventesFrance === 1200 && sv.definitives === 300 && sv.degustation === 12, sv);
ok('… balance : ventes France 9,00 hL, sorties définitives 2,25 hL, dégustation 0,09 hL ; stock de fin 130,56 hL ; bouteilles finies 1 488', (await cellule('ventesFrance', 2)) === '9,00' && (await cellule('definitives', 2)) === '2,25' && (await cellule('degustation', 2)) === '0,09' && (await cellule('s1', 2)) === '130,56' && /1\s488/.test(await txt(page.locator('[data-drm-balance]'))), [await cellule('ventesFrance', 2), await cellule('s1', 2)]);
// 4. fichiers : XML pour CIEL (schéma de la douane), XML pour le CIVC (codes CIVC), CSV, impression
await vide(); await page.locator('[data-drm-xml]').click(); await page.waitForTimeout(700); let S = await saved();
const x1 = S.find((x) => /\.xml$/.test(x.filename)) || { text: '' };
ok('« ⬇ XML douane (CIEL) » : drm-2026-10.xml — racine mouvements-balances (espace de noms DTI+), période, n° d’accise, 3 produits', x1.filename === 'drm-2026-10.xml' && /<mouvements-balances xmlns="http:\/\/douane\.finances\.gouv\.fr\/app\/ciel\/dtiplus\/v1">/.test(x1.text) && /<mois>10<\/mois>\s*<annee>2026<\/annee>/.test(x1.text) && /<identification-redevable>FR012345E6789</.test(x1.text) && (x1.text.match(/<produit>/g) || []).length === 3, x1.text.slice(0, 500));
ok('… produit mousseux : code INAO, ventes France sous CRD (année courante) 9 hL, sorties définitives 2,25 hL, stock de fin 130,56 hL', /<code-inao>1S001M<\/code-inao>/.test(x1.text) && /<ventes-france-crd-suspendus>\s*<annee-courante>9<\/annee-courante>/.test(x1.text) && /<sorties-definitives>2\.25<\/sorties-definitives>/.test(x1.text) && /<stock-fin-periode>130\.56<\/stock-fin-periode>/.test(x1.text));
ok(`… conforme au schéma de la douane${xsd ? ' (xmllint)' : ' (schéma non fourni : contrôle de structure seulement)'}`, valide(x1.text, 'drm-2026-10.xml'));
await vide(); await page.locator('[data-drm-xml-civc]').click(); await page.waitForTimeout(700); S = await saved(); const x2 = S.find((x) => /\.xml$/.test(x.filename)) || { text: '' };
ok('« ⬇ XML CIVC » : drm-civc-2026-10.xml, code CIVC à la place du code INAO, le reste identique', x2.filename === 'drm-civc-2026-10.xml' && /<code-inao>CHMOUS01<\/code-inao>/.test(x2.text) && !/1S001M/.test(x2.text) && valide(x2.text, 'drm-civc-2026-10.xml'));
await vide(); await page.locator('[data-drm-actions] button', { hasText: '⬇ CSV' }).click(); await page.waitForTimeout(700); S = await saved(); const c1 = S.find((x) => /\.csv$/.test(x.filename)) || { text: '' };
ok('« ⬇ CSV » : identifiants, une ligne par produit (stocks et rubriques en hL)', c1.filename === 'drm-2026-10.csv' && /N° d’accise;FR012345E6789/.test(c1.text) && /2026-10;Champagne — vins mousseux \(bouteilles tirées\);1S001M;CHMOUS01;141,9;/.test(c1.text), c1.text.slice(0, 600));
await page.locator('[data-drm-actions] button', { hasText: '🖨 Imprimer…' }).click(); await page.waitForTimeout(500);
t = await txt(ov().locator('[data-drm-impression]'));
ok('impression : DRM — octobre 2026, identifiants, rubriques, produits, observations', /DRM — octobre 2026/i.test(t) && /N° d’accise FR012345E6789/.test(t) && /Stock de début/.test(t) && /Ventes France sous CRD/.test(t) && /Coteaux champenois/.test(t), t.slice(0, 400));
await vide(); await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1500); const imp = await page.evaluate(() => window.__imp);
ok('… « 🖨 Imprimer » : le document seul', imp.length === 1 && /DRM — octobre 2026/i.test(imp[0].texte), imp);
await fermer();
// 5. déposée : chiffres figés, saisies verrouillées ; novembre repart des stocks de fin d'octobre
await page.locator('[data-drm-deposer]').click(); await page.waitForTimeout(300); await ov().locator('button', { hasText: 'Marquer comme déposée' }).click(); await page.waitForTimeout(500);
d = await db(); const dec = (d.drmDeclarations || []).find((x) => x.periode === 'M:2026-10');
ok('« ✓ Marquer comme déposée » : déclaration figée (produits, stocks, rubriques), saisies verrouillées', !!dec && dec.produits.length === 3 && dec.produits.find((p) => p.produitId === 'ex-champ-vm').s1 === 13056 && (await page.locator('[data-drm-deposee]').count()) === 1 && await page.locator('[data-drm-saisie] input').first().isDisabled(), dec);
await page.locator('select[aria-label="Période de la DRM"]').selectOption('M:2026-11'); await page.waitForTimeout(500);
ok('novembre : repart des stocks de fin d’octobre (130,56 hL de mousseux), sortie en vrac du 03/11 en sorties définitives', (await cellule('s0', 2)) === '130,56' && /10,00/.test(await cellule('definitives', 1)) && !/diffère/.test(await txt(page.locator('main'))), [await cellule('s0', 2), await cellule('definitives', 1)]);
// 6. DRA (annuelle) : campagne 2025-2026
await page.locator('select[aria-label="Périodicité"]').selectOption('annuelle'); await page.waitForTimeout(500);
t = await txt(page.locator('main'));
ok('DRA : campagne 2025-2026 (close), reprises de stock, récolte, transferts du tirage ; contrôle « à vérifier »', /DRA 2025-2026/.test(await page.locator('select[aria-label="Période de la DRM"] option:checked').innerText()) && /Reprise de stock/.test(t) && /Transferts/.test(t) && /DRA \(annuelle\)/.test(t), t.slice(0, 300));
await vide(); await page.locator('[data-drm-xml]').click(); await page.waitForTimeout(700); S = await saved(); const x3 = S.find((x) => /\.xml$/.test(x.filename)) || { text: '' };
ok('… fichier de la DRA (période : juillet 2026) conforme au schéma', x3.filename === 'drm-dra-2025-2026.xml' && /<mois>7<\/mois>\s*<annee>2026<\/annee>/.test(x3.text) && valide(x3.text, 'drm-dra-2025-2026.xml'), x3.filename);
await page.locator('select[aria-label="Périodicité"]').selectOption('mensuelle'); await page.waitForTimeout(300);
// 7. registre d'enrichissement : opération préparée par le simulateur de la fiche de cuve
await page.click('#tab-cuverie'); await page.waitForTimeout(400); await sous('Cartes');
await page.locator('.tankcard', { hasText: 'Cuve 08' }).first().click(); await page.waitForTimeout(500);
await ov().locator('button', { hasText: '🧪 Calculs' }).click(); await page.waitForTimeout(300); await ov().locator('button', { hasText: '⬆ Enrichissement' }).click(); await page.waitForTimeout(300);
const en = ov().locator('[data-calcul=enrichissement]'); const ie = en.locator('input');
await ie.nth(0).fill('20'); await ie.nth(1).fill('9,5'); await ie.nth(2).fill('10,5'); await page.waitForTimeout(200);
await en.locator('input[placeholder="Sucre, MCR…"]').click(); await en.locator('input[placeholder="Sucre, MCR…"]').fill('Sucre de'); await page.waitForTimeout(150); await en.locator('[role=option]', { hasText: 'Sucre de canne' }).first().click(); await page.waitForTimeout(100);
await en.locator('button', { hasText: 'Préparer l’opération d’enrichissement' }).click(); await page.waitForTimeout(600);
await ov().locator('.btn-primary', { hasText: 'Valider' }).last().click(); await page.waitForTimeout(700);
await fermer();
await page.click('#tab-registres'); await page.waitForTimeout(400); await sous('Registres (CSV / Excel)');
await page.locator('main button', { hasText: 'Registre d’enrichissement' }).first().click(); await page.waitForTimeout(400);
t = await txt(page.locator('main'));
ok('registre d’enrichissement : la chaptalisation de la cuve 08 (TAP 9,5 → 10,5 % vol, +1, saccharose, sucre de canne 34 kg)', /Registre d’enrichissement/.test(t) && /Cuve 08/.test(t) && /9,5/.test(t) && /10,5/.test(t) && /Saccharose/.test(t) && /Sucre de canne 34/.test(t), t.slice(t.indexOf('Registre d’enrichissement'), t.indexOf('Registre d’enrichissement') + 500));
await vide(); await page.locator('main button', { hasText: 'Exporter CSV' }).click(); await page.waitForTimeout(700); S = await saved();
ok('… export CSV du registre d’enrichissement', S.some((x) => /registre-enrichissement-/.test(x.filename) && /TAP avant \(% vol\)/.test(x.text)), S.map((x) => x.filename));
// 8. anglais
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(400); await sous('DRM');
t = await txt(page.locator('main'));
ok('anglais : DRM traduite (rubriques, saisies, boutons, contrôles)', /Opening stock/.test(t) && /Closing stock/.test(t) && /Finished bottles leaving the cellar/.test(t) && /CIEL customs XML/.test(t) && !/Stock de début|Bouteilles finies sorties|à déposer|déposée le|Rubrique/.test(t), t.slice(0, 700));
await page.locator('[data-drm-reglages]').click(); await page.waitForTimeout(400); t = await txt(ov());
ok('anglais : réglages de la DRM traduits', /Excise number/i.test(t) && /Declared products/i.test(t) && /Lot assignment/i.test(t) && !/Produits déclarés|Rattachement des lots|N° d’accise|Automatique|rattachement manuel|fractions :|sauf |à vérifier|Statut/i.test(t), t);
await fermer(); await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
ok('aucune erreur', !errors.length, errors.slice(0, 3));
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt65 : TOUT PASSE');
process.exitCode = ko ? 1 : 0;
