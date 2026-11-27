// 0.42.0-alpha.3 : Tirages › Fournitures — articles (type, suivi du stock), contrôle de réception de la verrerie, retour au fournisseur,
// fournitures proposées dans un lot de tirage (quantités cols + casse, non décompté), fiche d'enregistrement de la chaîne (HACCP).
// Données fictives (jeu d'exemple ; articles et préparations créés par le test).
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const prep = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const cp = d.campagnes.find((c) => !c.figee); const date = cp.debut > '2026-11-20' ? cp.debut : '2026-11-20';
    const R = replay(d, date); const pv = Object.values(R.portions).filter((p) => p.vol > 1500 && (R.lots[p.lotId] || {}).qualif === 'conv' && (R.lots[p.lotId] || {}).type !== 'mout').sort((a, b) => b.vol - a.vol)[0];
    opSave(d, { type: 'preparation', date, ptype: 'liqueur_tirage', qualifId: 'conv', code: 'LT-T80', volL: 300, lignes: [] }); opSave(d, { type: 'preparation', date, ptype: 'levain', qualifId: 'conv', code: 'LEV-T80', volL: 300, lignes: [] });
    const pB = produitSave(d, { nom: 'Bouteille fictive T80 75 cl', categorie: 'sec', unite: 'u', fourniture: { type: 'bouteille', caracs: { verrier: 'Verrier fictif', format: 'bouteille' } } }).id;
    const pC = produitSave(d, { nom: 'Capsule fictive T80', categorie: 'sec', unite: 'u', suiviStock: false, fourniture: { type: 'capsule' } }).id;
    const aB = arrivageSave(d, { produitId: pB, numLot: 'VF-T80', date, qty: 5000 }).id; const aB2 = arrivageSave(d, { produitId: pB, numLot: 'VF-T80-B', date, qty: 3000 }).id; arrivageSave(d, { produitId: pC, numLot: 'CF-T80', date, qty: 8000 });
    const ch = chantierTirageSave(d, { dateDebut: date, nom: 'Chantier fictif T80', realisation: 'interne' }).id;
    localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); return { lot: (R.lots[pv.lotId] || {}).code, date, pB, pC, aB, aB2, ch };
  });
  await page.reload(); await page.waitForTimeout(1200);
  await page.click('#tab-tirage'); await page.waitForTimeout(300); await page.getByRole('tab', { name: /Fournitures/ }).click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-tirage-fournitures]'));
  ok('sous-onglet Fournitures : articles de tirage filtrés des intrants (bouteille du jeu d’exemple et du test), stock, suivi sans décompte', /Bouteille fictive T80/.test(t) && /Verrier fictif/.test(t) && /suivi par lot, sans décompte/.test(t) && /Bouteille champenoise/.test(t), t.slice(0, 600));
  // ---- contrôle de réception : non conforme accepté → refusé ; refus enregistré
  const carte = page.locator(`[data-fourniture="${prep.pB}"]`);
  await carte.locator('tr', { hasText: 'VF-T80-B' }).getByRole('button', { name: 'Contrôle' }).click(); await page.waitForTimeout(300);
  t = await txt(ov()); ok('contrôle : échantillon de 20 cols proposé pour un lot de 3 000', /échantillon de 20 cols/.test(t) && (await ov().getByLabel('Cols contrôlés').inputValue()) === '20', t.slice(0, 300));
  await ov().getByLabel('Glaçure, fêlure').fill('3'); await ov().getByLabel('Bulle, soufflure').fill('1'); await ov().getByRole('button', { name: '＋ Mesure' }).click(); await ov().getByLabel('Hauteur 1').fill('300,2');
  t = await txt(ov().locator('[data-controle-resultat]')); ok('4 défauts → non conforme', /Non conforme : 4 défaut/.test(t), t);
  await ov().getByLabel('Décision').selectOption('accepte'); await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(400);
  ok('… acceptation sans dérogation refusée', !((await db()).arrivages.find((a) => a.id === prep.aB2).controleReception));
  await ov().getByLabel('Décision').selectOption('refuse'); await ov().getByLabel('Note du contrôle').fill('Glaçures'); await ov().getByLabel('Visa du contrôle').fill('Contrôleur fictif'); await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  let d = await db(); let c = d.arrivages.find((a) => a.id === prep.aB2).controleReception;
  ok('lot refusé enregistré (défauts, mesure, visa) ; pastille « refusé »', c && c.decision === 'refuse' && c.nDefauts === 4 && c.mesures[0].hauteur === 300.2 && c.visa === 'Contrôleur fictif' && /refusé/.test(await txt(carte.locator('tr', { hasText: 'VF-T80-B' }))), c);
  await carte.locator('tr', { hasText: /VF-T80(?!-B)/ }).getByRole('button', { name: 'Contrôle' }).click(); await page.waitForTimeout(300);
  await ov().getByLabel('Décision').selectOption('accepte'); await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(400);
  // ---- retour au fournisseur
  await carte.locator('tr', { hasText: 'VF-T80-B' }).getByRole('button', { name: /Retour/ }).click(); await page.waitForTimeout(300);
  ok('retour : raison reprise du refus', /refusé au contrôle/.test(await ov().getByLabel('Raison du retour').inputValue()));
  await ov().getByLabel('Quantité retournée').fill('3000'); await ov().getByLabel('N° de bon de retour').fill('RET-T80'); await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  d = await db(); const rg = (d.regulStocks || []).find((x) => x.arrivageId === prep.aB2);
  ok('retour enregistré (sortie de 3 000, bon) et listé', rg && rg.qty === -3000 && rg.motif === 'retour' && rg.retour.bon === 'RET-T80' && /RET-T80/.test(await txt(page.locator('[data-tirage-fournitures]'))), rg);
  // ---- article : type et suivi du stock dans la fiche du produit
  await carte.getByRole('button', { name: 'Modifier' }).first().click(); await page.waitForTimeout(400);
  ok('fiche de l’article : type « Bouteille », verrier, suivi du stock coché', (await ov().getByLabel('Type de fourniture').inputValue()) === 'bouteille' && (await ov().getByLabel('Verrier').inputValue()) === 'Verrier fictif' && (await ov().getByLabel(/Suivi du stock/).isChecked()));
  await ov().getByLabel('Teinte').fill('feuille morte'); await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(400);
  ok('… caractéristique enregistrée', (await db()).produits.find((p) => p.id === prep.pB).fourniture.caracs.teinte === 'feuille morte');
  await page.screenshot({ path: `${SC}/shots/t80-fournitures.png`, fullPage: true });
  // ---- lot de tirage : fournitures proposées
  await page.getByRole('tab', { name: /Tirer/ }).click(); await page.waitForTimeout(300);
  await page.locator('tr', { hasText: 'Chantier fictif T80' }).click(); await page.waitForTimeout(400);
  await ov().getByRole('button', { name: '＋ Lot de tirage' }).click(); await page.waitForTimeout(500);
  const f = ov();
  await pick(page, f.locator('input[placeholder="Cuve · lot · volume…"]').first(), prep.lot, prep.lot); await page.waitForTimeout(150);
  await f.locator('input[placeholder="0"]').first().fill('6,7');
  for (const [i, code, vol] of [[0, 'LT-T80', '0,36'], [1, 'LEV-T80', '0,375']]) {
    await f.getByRole('button', { name: '+ Ajouter une préparation' }).click(); await page.waitForTimeout(100);
    const sel = f.locator('select').filter({ hasText: 'Préparation…' }).nth(i);
    if (await sel.count()) await sel.selectOption(await sel.locator('option', { hasText: code }).first().getAttribute('value')); else await pick(page, f.locator('input[placeholder="Préparation…"]').nth(i), code, code);
    await f.locator('input[placeholder="0"]').nth(1 + i).fill(vol);
  }
  await f.getByLabel('Cols format 1').fill('1000'); await f.getByLabel('Casse').fill('10'); await f.getByLabel('Point de tirage du lot').fill('24');
  await f.getByRole('button', { name: 'Proposer d’après les formats' }).click(); await page.waitForTimeout(300);
  const box = f.locator('[data-fournitures-tirage]'); t = await txt(box);
  const sels = await box.locator('select[aria-label^="Fourniture n°"]').evaluateAll((L) => L.map((s) => s.value));
  ok('fournitures proposées : une bouteille 75 cl et une capsule (non décomptée)', sels.length >= 2 && sels.includes(prep.pC) && /non décompté/.test(t), { sels, t: t.slice(0, 400) });
  // choisir la bouteille du test (lot accepté) et vérifier la quantité calculée
  const iB = sels.findIndex((v) => v !== prep.pC); await box.getByLabel(`Fourniture n° ${iB + 1}`).selectOption(prep.pB); await page.waitForTimeout(150);
  ok('bouteille : lot accepté choisi d’office (le lot refusé et retourné n’est pas proposé), quantité 1 000 + casse 10', (await box.getByLabel(`Lot fournisseur de la fourniture ${iB + 1}`).inputValue()) === prep.aB && (await box.getByLabel(`Quantité de la fourniture ${iB + 1}`).inputValue()) === '1010');
  await f.getByRole('button', { name: /Valider/ }).last().click(); await page.waitForTimeout(700);
  d = await db(); const op = d.ops.find((o) => o.type === 'tirage' && o.chantierId === prep.ch);
  const fB = op && op.fournitures.find((x) => x.produitId === prep.pB); const fC = op && op.fournitures.find((x) => x.produitId === prep.pC);
  ok('tirage enregistré : fournitures tracées, bouteilles décomptées (ligne marquée), capsules non décomptées', op && fB.qty === 1010 && fB.decompte && fC.decompte === false && fC.qty === 1010 && op.lignes.some((l) => l.fourniture && l.produitId === prep.pB && l.qty === 1010) && !op.lignes.some((l) => l.produitId === prep.pC), op && op.fournitures);
  // ---- fiche de la chaîne (HACCP)
  const chs = page.locator('[data-chaine-haccp]');
  t = await txt(chs.locator('[data-chaine-fournitures]')); ok('fiche de la chaîne : fournitures du lot (n° de lot fournisseur)', /VF-T80/.test(t) && /CF-T80/.test(t), t);
  await chs.locator('[data-chaine-phase="demarrage"]').getByLabel('Conformité du point : nettoyage').selectOption('ok');
  await chs.getByRole('button', { name: '＋ Contrôle de chaîne' }).click(); await chs.getByLabel('Heure du contrôle de chaîne 1').fill('08:00');
  await chs.getByRole('button', { name: '＋ Contrôle de chaîne' }).click(); await chs.getByLabel('Heure du contrôle de chaîne 2').fill('11:00'); await chs.getByLabel('Point sertissage du contrôle 2').selectOption('nok');
  await chs.getByRole('button', { name: '＋ Contenant' }).click(); await chs.getByLabel('Nombre de contenants 1').fill('2'); await chs.getByLabel('Cols par contenant 1').fill('500');
  await chs.getByLabel('Visa — Chef de ligne').fill('Chef fictif');
  t = await txt(chs.locator('[data-chaine-ecarts]')); ok('écarts en direct : contrôle non conforme, plus de 2 h entre deux contrôles', /Sertissage/.test(t) && /plus de 2 h/.test(t), t);
  await chs.getByRole('button', { name: 'Enregistrer la fiche de la chaîne' }).click(); await page.waitForTimeout(600);
  d = await db(); const H = d.chantiersTirage.find((x) => x.id === prep.ch).haccp;
  ok('fiche enregistrée : démarrage, 2 contrôles, conditionnement 2 × 500, visa', H && H.demarrage.nettoyage.ok === true && H.controles.length === 2 && H.controles[1].points.sertissage === false && H.conditionnement[0].nb === 2 && H.visas[0].nom === 'Chef fictif', H);
  t = await txt(page.locator('[data-chaine-bilan]')); ok('bilan : 1 000 cols tirés, 1 000 rangés, casse 10', /cols tirés : 1 000/.test(t) && /rangés : 1 000/.test(t) && /Casse : 10/.test(t), t);
  await page.screenshot({ path: `${SC}/shots/t80-chaine.png`, fullPage: true });
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
// ---- traduction : l'onglet en anglais
{
  const { browser, page, errors } = await open({ viewport: { width: 1280, height: 900 } });
  await page.evaluate(() => localStorage.setItem('oenotrack-langue', 'en')); await page.reload(); await page.waitForTimeout(1200);
  await page.click('#tab-tirage'); await page.waitForTimeout(300); await page.getByRole('tab', { name: /Supplies/ }).click(); await page.waitForTimeout(400);
  t = await txt(page.locator('[data-tirage-fournitures]')); ok('en anglais : « Supplies = inputs », glass receiving inspection', /Supplies = inputs/.test(t) && /Glass receiving inspection/.test(t), t.slice(0, 300));
  ok('aucune erreur (2)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t80)'); process.exitCode = ko ? 1 : 0;
