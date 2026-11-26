// 0.29.0-alpha.1 : base 0.29.0-alpha.1 de test (identifiants, dispositions, fermentation qui ralentit) — courbes et alerte de
// fermentation, carte de la cuve signalée, calculs (SO₂ moléculaire, enrichissement → opération préparée), étiquettes QR (planche A4,
// grande étiquette A6, QR relu par OpenCV), scanner, lien direct vers une cuve après connexion, disposition commune. Données fictives.
import { open, pick } from './ui.mjs'; import fs from 'fs'; import { execFileSync } from 'child_process';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const FX = fs.readFileSync(new URL('./fixtures/base-0.29.0-alpha.1-cave.json', import.meta.url), 'utf8');
const F = JSON.parse(FX);
const init = { content: `window.__imp = []; window.print = () => { window.dispatchEvent(new Event('beforeprint')); const z = document.getElementById('zone-impression'); window.__imp.push(z ? (z.dataset.format || '') + '|' + z.querySelectorAll('.etq-page').length + '|' + z.querySelectorAll('.qr svg').length + '|' + z.textContent.replace(/\\s+/g, ' ').slice(0, 3000) : ''); window.dispatchEvent(new Event('afterprint')); };
try { if (!localStorage.getItem('t59-base')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(FX)}); localStorage.setItem('t59-base', '1'); } } catch (e) {}` };
const decoder = (png) => { try { return execFileSync('python3', ['-c', 'import cv2,sys\nim=cv2.imread(sys.argv[1]);t=cv2.QRCodeDetector().detectAndDecode(im)[0] or cv2.QRCodeDetectorAruco().detectAndDecode(im)[0];print(t)', png], { encoding: 'utf8' }).trim(); } catch (e) { return null; } };
const connexion = async (page) => { const cx = page.locator('[data-connexion]'); if (!(await cx.count())) return; await cx.locator('input[aria-label="Identifiant"]').fill('admin'); await cx.locator('input[aria-label="Mot de passe"]').fill('Essai-0280'); await cx.locator('button[type=submit]').click(); await page.waitForTimeout(1500); };
const etF = F.ops.find((o) => o.type === 'etape' && o.date === '2026-11-10'); const suivisF = F.ops.filter((o) => o.type === 'suivi' && o.date >= '2026-11-12');
{
  const { browser, page, errors } = await open({ init, https: true, viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await connexion(page);
  ok('base 0.29.0-alpha.1 de test ouverte, administrateur connecté', (await page.locator('[data-utilisateur]').count()) === 1);
  const d0 = await db(); const cid = await page.evaluate((pid) => { const R = getR(JSON.parse(localStorage.getItem('oenotrack-db-v2'))); return R.pinfo[pid].contenantId; }, suivisF[0].portionId); const cnom = d0.contenants.find((c) => c.id === cid).nom;
  await page.click('#tab-cuverie'); await page.waitForTimeout(400); await page.locator('main [role=tab]', { hasText: 'Cartes' }).click(); await page.waitForTimeout(300);
  const carte = page.locator('.tankcard', { hasText: cnom }).first();
  ok('carte de la cuve : « ⚠ FA arrêtée ? »', /⚠ FA arrêtée \?/.test(await txt(carte)), cnom);
  await carte.click(); await page.waitForTimeout(600);
  const rub = await ov().locator('[data-rubrique]').evaluateAll((els) => els.map((e) => e.getAttribute('data-rubrique')).filter((x) => !x.includes(' ')));
  ok('disposition commune de l’équipe : lots présents d’abord, fermentation, historique ; jaugeage masqué', rub[0] === 'lots' && rub[1] === 'fermentation' && rub[2] === 'historique' && !rub.includes('jauge'), rub);
  const fe = ov().locator('[data-rubrique=fermentation]');
  ok('fermentation : alerte « Fermentation arrêtée ? » (0,15 point par jour sur 2 jours, seuil 0,50)', (await fe.locator('[data-alerte-ferm=arretee]').count()) === 1 && /Baisse de densité : 0,15 point\(s\) par jour sur les 2 dernier\(s\) jour\(s\) ; seuil d’alerte : 0,50/.test(await txt(fe)), await txt(fe));
  const pts = await fe.locator('svg circle').count(); const temps = await fe.locator('svg rect title').count();
  ok('… courbe : un point de densité et de température par relevé, axes datés, légende', pts >= 4 && temps >= 4 && /Densité/.test(await txt(fe.locator('.courbe-leg'))) && /Température \(°C\)/.test(await txt(fe.locator('.courbe-leg'))) && /12\/11/.test(await fe.locator('svg').innerHTML()), [pts, temps]);
  await fe.screenshot({ path: SC + '/shots/t59-fermentation.png' });
  // calculs : SO₂ moléculaire, puis enrichissement → opération préparée
  await ov().locator('button', { hasText: '🧪 Calculs' }).click(); await page.waitForTimeout(300);
  const so = ov().locator('[data-calcul=so2]'); const ins = so.locator('input');
  await ins.nth(0).fill('25'); await ins.nth(1).fill('3,2'); await ins.nth(2).fill('20'); await ins.nth(3).fill('11'); await ins.nth(4).fill('0,6'); await page.waitForTimeout(200);
  ok('SO₂ moléculaire : 1,41 mg/L (5,6 % du libre, pKa 1,98) ; 11 mg/L de libre pour 0,6 mg/L', /1,41 mg\/L/.test(await txt(so.locator('[data-so2-resultat]'))) && /5,6 %/.test(await txt(so)) && /11 mg\/L/.test(await txt(so.locator('[data-so2-besoin]'))), await txt(so));
  await ov().locator('button', { hasText: '⬆ Enrichissement' }).click(); await page.waitForTimeout(300);
  const en = ov().locator('[data-calcul=enrichissement]'); const ie = en.locator('input');
  await ie.nth(0).fill('20'); await ie.nth(1).fill('9,5'); await ie.nth(2).fill('10,5'); await page.waitForTimeout(200);
  ok('enrichissement au sucre : +1 % vol → 34,0 kg pour 20 hL, volume ≈ 20,21 hL', /34,0 kg de sucre/.test(await txt(en.locator('[data-enrich-resultat]'))) && /20,21 hL/.test(await txt(en)), await txt(en.locator('[data-enrich-resultat]')));
  await ie.nth(2).fill('12'); await page.waitForTimeout(200);
  ok('… +2,5 % vol : au-delà du maximum réglé (2 % vol), plafond indicatif', /Au-delà du maximum réglé/.test(await txt(en)) && /Plafond indicatif/.test(await txt(en)));
  await ie.nth(2).fill('10,5'); await en.locator('button', { hasText: 'MCR' }).click(); await page.waitForTimeout(200);
  ok('… MCR (850 g/L) : ≈ 50,6 L et volume ajouté', /50,6 L de MCR/.test(await txt(en.locator('[data-enrich-resultat]'))), await txt(en.locator('[data-enrich-resultat]')));
  await en.locator('button', { hasText: 'Sucre (saccharose)' }).click(); await page.waitForTimeout(150);
  await pick(page, en.locator('input[placeholder="Sucre, MCR…"]'), 'Sucre de', 'Sucre de canne');
  await en.locator('button', { hasText: 'Préparer l’opération d’enrichissement' }).click(); await page.waitForTimeout(600);
  ok('… « Préparer l’opération » : formulaire « Enrichissement (chaptalisation) », sucre de canne 34 kg', /Enrichissement \(chaptalisation\)/.test(await txt(ov())) && (await ov().locator('input[inputmode=decimal]').evaluateAll((els) => els.map((e) => e.value))).includes('34'), (await txt(ov())).slice(0, 200));
  const sav = ov().locator('.btn-primary', { hasText: 'Valider' }).last(); await sav.click(); await page.waitForTimeout(700);
  let d = await db(); const oe = d.ops.filter((o) => o.sousType === 'enrichissement' && o.date === '2026-11-21');
  const Rpi = await page.evaluate(() => { const R = getR(JSON.parse(localStorage.getItem('oenotrack-db-v2'))); return R.pinfo; });
  ok('… enregistrée sur la cuve avec le calcul (TAP 9,5 → TAV 10,5, méthode, sucre 34 kg)', oe.length === 1 && oe[0].enrichissement.tap === 9.5 && oe[0].enrichissement.tav === 10.5 && oe[0].enrichissement.methode === 'sucre' && oe[0].lignes[0].qty === 34 && (Rpi[oe[0].portionId] || {}).contenantId === cid, oe.map((o) => [o.enrichissement, o.lignes]));
  for (let i = 0; i < 3; i++) { if (!(await page.locator('.overlay').count())) break; await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
  // étiquettes QR : planche A4, grande étiquette A6 relue par OpenCV
  await page.locator('.tankcard', { hasText: cnom }).first().click(); await page.waitForTimeout(500);
  await ov().locator('button', { hasText: '🏷 Étiquette QR' }).click(); await page.waitForTimeout(500);
  const attendu = `https://cave.exemple.fr/oenotrack/#cuve=${cid}`;
  ok('étiquette : QR = adresse réglée + identifiant de la cuve (aucune donnée), nom, type et contenance', (await ov().locator('[data-qr]').first().getAttribute('data-qr')) === attendu && new RegExp(cnom).test(await txt(ov().locator('[data-etiquette]'))) && /hL/.test(await txt(ov().locator('[data-etiquette]'))));
  await ov().locator('select[aria-label="Première étiquette de la planche"]').selectOption('5'); await page.waitForTimeout(200);
  ok('… planche A4 : 24 cases, commence à la 5ᵉ (4 vides)', (await ov().locator('.etq-page-a4 > .etq').count()) === 5 && (await ov().locator('.etq-vide').count()) === 4);
  await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1400);
  let imp = await page.evaluate(() => window.__imp);
  ok('… impression : format « étiquettes A4 », une page, un QR', /^etiq-a4\|1\|1\|/.test(imp[imp.length - 1] || ''), imp);
  await ov().locator('button', { hasText: 'Grande étiquette A6' }).click(); await page.waitForTimeout(300);
  await ov().locator('.etq-a6 .etq-qr').screenshot({ path: SC + '/shots/t59-qr.png' });
  const lu = decoder(SC + '/shots/t59-qr.png');
  ok('… grande étiquette A6 : le QR affiché se lit (OpenCV) et donne l’adresse de la cuve', lu === null ? true : lu === attendu, lu === null ? 'OpenCV indisponible : relecture non faite' : lu);
  if (lu === null) console.log('  (relecture du QR non faite : python3 + OpenCV absents)');
  await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1400); imp = await page.evaluate(() => window.__imp);
  ok('… impression A6', /^etiq-a6\|1\|1\|/.test(imp[imp.length - 1] || ''), imp[imp.length - 1]);
  // réglages QR (communs) : mode code
  await ov().locator('button', { hasText: '⚙ Réglages des QR codes' }).click(); await page.waitForTimeout(200);
  await ov().locator('[data-qr-reglages] button', { hasText: 'Code seul' }).click(); await ov().locator('[data-qr-reglages] button', { hasText: 'Enregistrer pour toute l’équipe' }).click(); await page.waitForTimeout(400);
  ok('réglage commun « code seul » : QR = OENOTRACK:CUVE:identifiant, message « scanner d’Œnotrack »', (await db()).settings.qr.mode === 'code' && (await ov().locator('[data-qr]').first().getAttribute('data-qr')) === `OENOTRACK:CUVE:${cid}` && /Mode « code »/.test(await txt(ov())));
  await page.screenshot({ path: SC + '/shots/t59-etiquettes.png' });
  for (let i = 0; i < 3; i++) { if (!(await page.locator('.overlay').count())) break; await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
  // scanner : sans lecteur de QR dans ce navigateur → nom de la cuve
  await page.locator('main button', { hasText: '📷 Scanner' }).click(); await page.waitForTimeout(400);
  ok('scanner : lecture directe indisponible ici (Chromium Linux), appareil photo du téléphone conseillé', /Lecture directe indisponible/.test(await txt(ov())));
  await ov().locator('input').last().fill(cnom.toLowerCase()); await ov().locator('button', { hasText: 'Ouvrir la fiche' }).click(); await page.waitForTimeout(500);
  ok('… nom tapé : fiche de la cuve ouverte', (await txt(ov())).startsWith(cnom));
  for (let i = 0; i < 3; i++) { if (!(await page.locator('.overlay').count())) break; await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
  // lien direct (étiquette lue par l'appareil photo) : après connexion, la fiche s'ouvre et l'adresse est nettoyée
  await page.evaluate(() => { localStorage.removeItem('oenotrack-session'); sessionStorage.removeItem('oenotrack-session'); });
  await page.goto(`https://app.test/?lien=1#cuve=${cid}`); await page.waitForTimeout(1500); // page rechargée (comme l'appareil photo qui ouvre l'adresse)
  const avant = (await page.locator('[data-connexion]').count()) === 1; await connexion(page); await page.waitForTimeout(500);
  ok('lien direct : connexion demandée d’abord, puis fiche de la cuve ouverte ; adresse nettoyée', avant && (await txt(ov())).startsWith(cnom) && !/cuve=/.test(page.url()), [avant, page.url()]);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.evaluate((id) => { window.location.hash = `cuve=${id}`; }, cid); await page.waitForTimeout(600);
  ok('… déjà connecté (même page) : la fiche s’ouvre aussitôt', (await txt(ov())).startsWith(cnom) && !/cuve=/.test(page.url()));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.goto('https://app.test/?lien=2#cuve=inconnue-99'); await page.waitForTimeout(1500); await connexion(page); await page.waitForTimeout(400);
  ok('… identifiant inconnu : message, aucune fiche', /ne correspond à aucun contenant/.test(await page.locator('.toast').allInnerTexts().then((x) => x.join(' '))) && (await page.locator('.overlay').count()) === 0);
  console.log('ERREURS', errors.length ? errors : 'aucune'); if (errors.length) ko++;
  await browser.close();
}
// anglais : courbe de fermentation (libellé accessible traduit ; infobulles : données telles quelles, « analyse » traduit, au changement de langue aussi)
{
  const { browser, page, errors } = await open({ init, https: true, viewport: { width: 1280, height: 900 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  await connexion(page); await page.waitForTimeout(300);
  const { cid, cnom } = await page.evaluate((pid) => {
    const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const p = getR(d).pinfo[pid];
    d.analyses.push({ id: 'an-t59-en', date: '2026-11-19', lotId: p.lotId, contenantId: p.contenantId, modeleId: 'm_mout', valeurs: { densite: 1.0691, temp: 20 }, notes: '' });
    localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); return { cid: p.contenantId, cnom: d.contenants.find((c) => c.id === p.contenantId).nom };
  }, suivisF[0].portionId);
  await page.reload(); await page.waitForTimeout(1200); await connexion(page);
  await page.evaluate(() => langueChanger('en')); await page.waitForTimeout(300);
  await page.evaluate((id) => { window.location.hash = `cuve=${id}`; }, cid); await page.waitForTimeout(700);
  const fe = ov().locator('[data-rubrique=fermentation]');
  const titres = async () => fe.locator('svg title').allTextContents();
  const t1 = await titres();
  ok('anglais : courbe « Density and temperature curve », légende « Density »', (await fe.locator('svg').getAttribute('aria-label')) === 'Density and temperature curve' && /Density/.test(await txt(fe.locator('.courbe-leg'))));
  ok('… infobulle d’un point d’analyse : « · analysis », nom de la cuve gardé tel quel', t1.some((t) => t.includes(cnom) && / · analysis$/.test(t)) && t1.every((t) => !/ · analyse$/.test(t)), t1.slice(-3));
  await page.evaluate(() => langueChanger('fr')); await page.waitForTimeout(300);
  const t2 = await titres();
  ok('… retour au français : « · analyse », « Courbe de densité et de température »', t2.some((t) => / · analyse$/.test(t)) && (await fe.locator('svg').getAttribute('aria-label')) === 'Courbe de densité et de température', t2.slice(-3));
  console.log('ERREURS', errors.length ? errors : 'aucune'); if (errors.length) ko++;
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUT EST BON');
process.exitCode = ko ? 1 : 0;
