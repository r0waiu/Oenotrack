// 0.42.0-alpha.2 : Tirages › Tirer — prestataire de tirage (rôle d'un fournisseur), chantier (ligne, prestataire, documents),
// lot de tirage par pompe doseuse (formats, consignes, contrôles, VRTP), exclusivité mixtion / pompe doseuse, cuve de mixtion.
// Données fictives (jeu d'exemple ; préparations créées par le test).
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  // préparation : une liqueur et un levain fictifs (conventionnels), un fournisseur prestataire de tirage
  const prep = await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const date = d.campagnes.find((c) => !c.figee).debut > '2026-11-20' ? d.campagnes.find((c) => !c.figee).debut : '2026-11-20';
    const R = replay(d, date); const pv = Object.values(R.portions).filter((p) => p.vol > 1500 && (R.lots[p.lotId] || {}).qualif === 'conv' && (R.lots[p.lotId] || {}).type !== 'mout').sort((a, b) => b.vol - a.vol)[0];
    opSave(d, { type: 'preparation', date, ptype: 'liqueur_tirage', qualifId: 'conv', code: 'LT-T79', volL: 300, lignes: [] }); opSave(d, { type: 'preparation', date, ptype: 'levain', qualifId: 'conv', code: 'LEV-T79', volL: 300, lignes: [] });
    fournisseurSave(d, { nom: 'Prestataire fictif de tirage', contact: '', roles: ['prestataire_tirage'] });
    localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); return { cont: contName(d, pv.contenantId), lot: (R.lots[pv.lotId] || {}).code, date };
  });
  await page.reload(); await page.waitForTimeout(1200);
  await page.click('#tab-tirage'); await page.waitForTimeout(300); await page.getByRole('tab', { name: /Tirer/ }).click(); await page.waitForTimeout(300);
  // ---- chantier
  await page.getByRole('button', { name: '＋ Chantier' }).click(); await page.waitForTimeout(300);
  await ov().getByLabel('Début du chantier').fill(prep.date); await ov().getByLabel('Nom du chantier').fill('Tirage fictif');
  await ov().getByLabel('Réalisation').selectOption('prestataire'); await page.waitForTimeout(100);
  await ov().getByLabel('Prestataire', { exact: true }).selectOption({ label: 'Prestataire fictif de tirage' });
  await ov().getByLabel('Injecteuse (pompe doseuse)').check(); await ov().getByLabel('Becs de la tireuse').fill('32'); await ov().getByLabel('Marquage').selectOption('laser');
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  let d = await db(); const ch = (d.chantiersTirage || [])[0];
  ok('chantier créé : prestataire, ligne (injecteuse, 32 becs, laser), n° automatique', ch && ch.realisation === 'prestataire' && ch.ligne.injecteuse === true && ch.ligne.nbBecs === 32 && ch.ligne.marquage === 'laser' && /^CH-\d{4}-01$/.test(ch.numero), ch);
  t = await txt(page.locator('[data-chantier]')); ok('fiche du chantier : documents de prestation (ordre de fabrication, attestation de nettoyage…)', /Documents de prestation/.test(t) && /Ordre de fabrication/.test(await txt(ov())), t.slice(0, 300));
  // ---- lot de tirage par pompe doseuse
  await ov().getByRole('button', { name: '＋ Lot de tirage' }).click(); await page.waitForTimeout(500);
  const f = ov();
  t = await f.getByLabel('Mode de tirage').inputValue(); ok('nouveau lot : rattaché au chantier, mode pompe doseuse proposé (pas de cuve de mixtion)', t === 'pompe' && (await f.getByLabel('Chantier de tirage').inputValue()) === ch.id, t);
  await pick(page, f.locator('input[placeholder="Cuve · lot · volume…"]').first(), prep.lot, prep.lot); await page.waitForTimeout(150);
  await f.locator('input[placeholder="0"]').first().fill('6,7');
  for (const [i, code, vol] of [[0, 'LT-T79', '0,36'], [1, 'LEV-T79', '0,375']]) {
    await f.getByRole('button', { name: '+ Ajouter une préparation' }).click(); await page.waitForTimeout(100);
    const sel = f.locator('select').filter({ hasText: 'Préparation…' }).nth(i);
    if (await sel.count()) await sel.selectOption(await sel.locator('option', { hasText: code }).first().getAttribute('value')); else await pick(page, f.locator('input[placeholder="Préparation…"]').nth(i), code, code);
    await f.locator('input[placeholder="0"]').nth(1 + i).fill(vol);
  }
  await f.getByLabel('Consigne liqueur').fill('4,8'); await f.getByLabel('Consigne levain').fill('5');
  await f.getByLabel('Cols format 1').fill('900'); await f.getByRole('button', { name: '＋ Format' }).click(); await f.getByLabel('Format 2', { exact: true }).selectOption('magnum'); await f.getByLabel('Cols format 2').fill('50');
  await f.getByRole('button', { name: '＋ Contrôle' }).click(); await f.getByLabel('Mesure du contrôle 1').fill('36,5'); await f.getByLabel('Opérateur du contrôle 1').fill('Opérateur fictif');
  await f.getByLabel('Casse').fill('4'); await f.getByLabel('Point de tirage du lot').fill('24'); await page.waitForTimeout(300);
  t = await txt(f.locator('[data-pompe]')); ok('pompe doseuse : consignes en mL par col (bouteille 36 mL, magnum 72 mL de liqueur), théorique / réel, écart du contrôle', /36,0 mL/.test(t) && /72,0 mL/.test(t) && /Théorique/i.test(t), t.slice(0, 500));
  t = await txt(f.locator('[data-tirage-vrtp]')); ok('volume tiré (900 × 0,75 + 50 × 1,5 = 750 L) et VRTP affichés', /7,50 hL/.test(t) && /VRTP/.test(t), t);
  // exclusivité : mode mixtion sans cuve de mixtion → refusé
  await f.getByLabel('Mode de tirage').selectOption('mixtion'); await page.waitForTimeout(200);
  ok('mode mixtion : liqueur et levain en ligne retirés, alerte « aucune cuve de mixtion »', /Aucune cuve de mixtion disponible/.test(await txt(f)) && (await f.locator('[data-pompe]').count()) === 0);
  await f.getByRole('button', { name: /Valider/ }).last().click(); await page.waitForTimeout(300);
  ok('… validation refusée : le vin d’un tirage par mixtion doit venir d’une cuve de mixtion', (await page.locator('.overlay').count()) >= 2 && (await db()).ops.filter((o) => o.type === 'tirage' && o.chantierId).length === 0);
  await f.getByLabel('Mode de tirage').selectOption('pompe'); await page.waitForTimeout(150);
  for (const [i, code, vol] of [[0, 'LT-T79', '0,36'], [1, 'LEV-T79', '0,375']]) { await f.getByRole('button', { name: '+ Ajouter une préparation' }).click(); await page.waitForTimeout(100); const sel = f.locator('select').filter({ hasText: 'Préparation…' }).nth(i); if (await sel.count()) await sel.selectOption(await sel.locator('option', { hasText: code }).first().getAttribute('value')); else await pick(page, f.locator('input[placeholder="Préparation…"]').nth(i), code, code); await f.locator('input[placeholder="0"]').nth(1 + i).fill(vol); }
  await f.getByRole('button', { name: /Valider/ }).last().click(); await page.waitForTimeout(600);
  d = await db(); const op = d.ops.find((o) => o.type === 'tirage' && o.chantierId === ch.id);
  ok('lot de tirage enregistré : mode pompe, formats (900 bouteilles, 50 magnums), total et volume moyen pour les versions antérieures, casse, point de tirage, contrôle', op && op.mode === 'pompe' && op.formats.length === 2 && op.nbBouteilles === 950 && Math.abs(op.nbBouteilles * op.volBouteilleL - 750) < 0.01 && op.casse === 4 && op.pointGL === 24 && op.pompe.consignes.liqueurPct === 4.8 && op.pompe.controles[0].mesure === 36.5, op);
  t = await txt(page.locator('[data-chantier-bilan]')); ok('bilan du chantier : 950 cols, 1 000 équivalent bouteilles, casse 4', /950 cols/.test(t) && /1 000 équivalent bouteilles/.test(t) && /casse 4/.test(t), t);
  await page.screenshot({ path: `${SC}/shots/t79-chantier.png`, fullPage: true });
  // ---- cuve de mixtion (assemblage marqué mixtion)
  await ov().getByRole('button', { name: '＋ Cuve de mixtion' }).click(); await page.waitForTimeout(500);
  ok('cuve de mixtion : formulaire d’assemblage avec liqueur et levain versés, point de tirage, densités', (await ov().locator('[data-mixtion]').count()) === 1 && /Cuve de mixtion/.test(await txt(ov())));
  await ov().getByLabel('Point de tirage de la mixtion').fill('24'); await ov().getByLabel('Densité du vin de base').fill('993'); await ov().getByLabel('Densité de la mixtion').fill('1001,6'); await page.waitForTimeout(200);
  t = await txt(ov().locator('[data-mixtion-volume]')); ok('correction : densité visée 1 002,6 → il manque 2,5 g/L', /1 002,6/.test(t) && /il manque 2,5 g\/L/.test(t), t);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
// ---- prestataire : rôle d'un fournisseur (Intrants › Fournisseurs)
{
  const { browser, page, errors } = await open({ viewport: { width: 1280, height: 900 } });
  ok('aucune erreur (2)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t79)'); process.exitCode = ko ? 1 : 0;
