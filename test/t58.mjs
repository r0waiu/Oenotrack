// 0.29.0-alpha.1 : fiches de cuve et de lot personnalisables (rubriques, ordre, commun / personnel), stade sur la fiche de la cuve,
// doses dans l'unité du produit ; saisie groupée (sélection multiple → sulfitage, relevés, stade), groupe dans le journal, correction,
// annulation, planification puis validation en groupe ; fiche multi-lignes du jour ; téléphone ; anglais. Données fictives.
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const init = () => { window.__imp = []; window.print = () => { window.dispatchEvent(new Event('beforeprint')); const z = document.getElementById('zone-impression'); window.__imp.push(z ? z.textContent.replace(/\s+/g, ' ').slice(0, 20000) : ''); window.dispatchEvent(new Event('afterprint')); }; };
{
  const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const rub = async () => ov().locator('[data-rubrique]').evaluateAll((els) => els.map((e) => e.getAttribute('data-rubrique')).filter((x) => !x.includes(' ')));
  await page.click('#tab-cuverie'); await page.waitForTimeout(400);
  await page.locator('main [role=tab]', { hasText: 'Cartes' }).click(); await page.waitForTimeout(300);
  // 1. fiche de la cuve : stade, rubriques dans l'ordre d'origine, doses dans l'unité du produit
  await page.locator('.tankcard', { hasText: 'Cuve D1' }).first().click(); await page.waitForTimeout(500);
  let r = await rub();
  ok('fiche de la cuve : stade affiché dans l’en-tête', /Stade/.test(await txt(ov().locator('dl.kv').first())) && (await ov().locator('[data-stade-cuve] .chip').count()) >= 1);
  ok('… rubriques dans l’ordre d’origine (fermentation, jaugeage, lots… historique)', r[0] === 'fermentation' && r.indexOf('lots') < r.indexOf('composition') && r[r.length - 1] === 'historique' && r.includes('intrants'), r);
  const hist = await txt(ov().locator('[data-rubrique=historique]'));
  ok('historique : dose de chaque produit dans son unité (g/hL)', /Métabisulfite de potassium [\d ,]+ g \([\d,]+ g\/hL\)/.test(hist), hist.slice(0, 300));
  const recap = await txt(ov().locator('[data-rubrique=intrants]'));
  ok('récapitulatif des intrants : « Doses à l’application » (doses de chaque ajout et total)', /Doses à l’application/i.test(recap) && /g\/hL/.test(recap), recap.slice(0, 400));
  // 2. personnaliser pour moi : masquer la composition, monter l'historique
  await ov().locator('button', { hasText: '⚙ Personnaliser la fiche' }).click(); await page.waitForTimeout(300);
  ok('personnaliser : « Pour moi » choisi, rubriques à cocher et à déplacer', /Pour moi/.test(await txt(ov())) && (await ov().locator('[data-rub]').count()) === 10);
  await ov().locator('[data-rub=composition] input[type=checkbox]').uncheck();
  for (let k = 0; k < 9; k++) await ov().locator('[data-rub=historique] button[aria-label^="Monter"]').click();
  await ov().locator('button', { hasText: 'Enregistrer pour moi' }).click(); await page.waitForTimeout(400);
  r = await rub();
  ok('… enregistré sur cet appareil : historique en tête, composition masquée', r[0] === 'historique' && !r.includes('composition'), r);
  ok('… gardé dans le navigateur (sans identifiants), pas dans la base', await page.evaluate(() => !!JSON.parse(localStorage.getItem('oenotrack-fiches-perso')).cont) && !(await db()).settings.fichesRubriques);
  // 3. disposition commune : jaugeage masqué pour l'équipe ; l'ajustement personnel l'emporte, puis retour au commun
  await ov().locator('button', { hasText: '⚙ Personnaliser la fiche' }).click(); await page.waitForTimeout(300);
  await ov().locator('button', { hasText: 'Pour toute l’équipe' }).click(); await page.waitForTimeout(200);
  await ov().locator('[data-rub=jauge] input[type=checkbox]').uncheck(); await ov().locator('button', { hasText: 'Enregistrer pour toute l’équipe' }).click(); await page.waitForTimeout(400);
  ok('disposition commune enregistrée dans la base (réglage de l’équipe)', ((await db()).settings.fichesRubriques.cont.masques || []).includes('jauge'));
  r = await rub(); ok('… mon ajustement l’emporte (historique en tête, jaugeage encore là)', r[0] === 'historique' && r.includes('jauge'), r);
  await ov().locator('button', { hasText: '⚙ Personnaliser la fiche' }).click(); await page.waitForTimeout(300);
  await ov().locator('button', { hasText: 'Revenir à la disposition commune' }).click(); await page.waitForTimeout(400);
  r = await rub(); ok('… revenu à la disposition commune : jaugeage masqué, ordre d’origine', !r.includes('jauge') && r[0] === 'fermentation' && r.includes('composition'), r);
  await page.screenshot({ path: SC + '/shots/t58-fiche.png' });
  // fiche du lot : rubriques et bouton
  await ov().locator('[data-rubrique=lots] table .linkish').first().click(); await page.waitForTimeout(500);
  r = await rub(); ok('fiche du lot : rubriques (stade, fermentation, composition… opérations) et « ⚙ Personnaliser la fiche »', r[0] === 'stades' && r.includes('fermentation') && r[r.length - 1] === 'operations' && (await ov().locator('button', { hasText: '⚙ Personnaliser la fiche' }).count()) === 1, r);
  for (let i = 0; i < 3; i++) { if (!(await page.locator('.overlay').count())) break; await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
  // 4. saisie groupée : sélection multiple, sulfitage à 5 g/hL sur trois cuves
  await page.locator('main button', { hasText: '☑ Sélection multiple' }).click(); await page.waitForTimeout(300);
  for (const n of ['Amphore 01', 'Bac T', 'Bombonne 01']) await page.locator('.tankcard', { hasText: n }).first().click();
  ok('sélection : trois cartes marquées, barre en bas avec les actions', (await page.locator('.tankcard.is-sel').count()) === 3 && /3 cuve\(s\) sélectionnée\(s\)/.test(await txt(page.locator('[data-selbar]'))) && /Sulfitage Levurage Collage/.test(await txt(page.locator('[data-selbar]'))));
  await page.locator('[data-selbar] button', { hasText: 'Sulfitage' }).click(); await page.waitForTimeout(500);
  ok('formulaire groupé : une ligne par cuve, rien d’enregistrable sans produit', (await ov().locator('[data-groupe-lignes] tbody tr').count()) === 3);
  await ov().locator('button', { hasText: '✓ Valider' }).click(); await page.waitForTimeout(300);
  ok('… « Choisissez le produit. »', /Choisissez le produit/.test(await txt(ov())));
  await pick(page, ov().locator('input[placeholder="Produit…"]'), 'Métabisulfite', 'Métabisulfite de potassium');
  await ov().locator('input[placeholder="ex. 3"]').fill('5'); await page.waitForTimeout(300);
  const qs = await ov().locator('[data-groupe-lignes] tbody tr').evaluateAll((trs) => trs.map((tr) => tr.querySelectorAll('input')[2].value));
  ok('quantités = dose × volume de chaque cuve (2,80 hL → 14 g, 10 hL → 50 g, 0,52 hL → 2,6 g), total', qs.join('|') === '14|50|2,6' && /Total 66,6 g/.test(await txt(ov().locator('[data-groupe-lignes] tfoot'))), qs);
  await ov().locator('[data-groupe-lignes] tbody tr').nth(1).locator('input').nth(2).fill('60'); await page.waitForTimeout(200);
  ok('… quantité corrigée sur une ligne : dose recalculée (6,0 g/hL)', /6,0 g\/hL/.test(await txt(ov().locator('[data-groupe-lignes] tbody tr').nth(1))));
  await ov().locator('button', { hasText: '✓ Valider (3)' }).click(); await page.waitForTimeout(800);
  let d = await db(); let g = d.ops.filter((o) => o.groupe); const gid = g[0] && g[0].groupe.id;
  ok('3 opérations « Sulfitage » enregistrées, reliées par un groupe (rang, nombre)', g.length === 3 && g.every((o) => o.sousType === 'sulfitage' && o.groupe.id === gid && o.groupe.nb === 3 && o.groupe.action === 'sulfitage') && g.map((o) => o.lignes[0].qty).join('|') === '14|60|2.6', g.map((o) => o.lignes[0].qty));
  ok('… fiche du groupe ouverte : les 3 cuves, « Corriger », « Annuler », « Fiche multi-lignes »', /Saisie groupée — Sulfitage/.test(await txt(ov())) && (await ov().locator('tbody tr').count()) === 3 && /Annuler le groupe/.test(await txt(ov())) && /Corriger le groupe/.test(await txt(ov())));
  await page.screenshot({ path: SC + '/shots/t58-groupe.png' });
  // fiche multi-lignes du groupe
  await ov().locator('button', { hasText: '🖨 Fiche multi-lignes' }).click(); await page.waitForTimeout(800);
  ok('fiche multi-lignes : une fiche « Traitements » pour les 3 cuves, dose et quantité prévues, colonne visa', /3 élément\(s\) → 1 fiche\(s\)/.test(await txt(ov())) && (await ov().locator('.fiche').count()) === 1 && /Bac T/.test(await txt(ov().locator('.fiche'))) && /Visa/i.test(await txt(ov().locator('.fiche thead'))) && /5,0 g\/hL/.test(await txt(ov().locator('.fiche'))));
  await ov().locator('button', { hasText: '🖨 Imprimer' }).last().click(); await page.waitForTimeout(1200);
  ok('… imprimée : les trois cuves', ((await page.evaluate(() => window.__imp))[0] || '').includes('Bombonne 01'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // journal : pastille groupe → correction du groupe (une ligne retirée)
  await page.click('#tab-ops'); await page.waitForTimeout(500);
  ok('journal : pastille « ⛓ groupe (3) » sur chaque opération du groupe', (await page.locator(`main [data-groupe="${gid}"]`).count()) >= 3);
  await page.locator(`main [data-groupe="${gid}"]`).first().click(); await page.waitForTimeout(400);
  await ov().locator('button', { hasText: '✎ Corriger le groupe' }).click(); await page.waitForTimeout(500);
  ok('correction : formulaire pré-rempli (produit, quantités enregistrées)', /Corriger la saisie groupée/.test(await txt(ov())) && (await ov().locator('[data-groupe-lignes] tbody tr').count()) === 3);
  await ov().locator('[data-groupe-lignes] tbody tr').nth(2).locator('input[type=checkbox]').uncheck();
  await ov().locator('button', { hasText: '✓ Valider (2)' }).click(); await page.waitForTimeout(800);
  d = await db(); g = d.ops.filter((o) => o.groupe && o.groupe.id === gid);
  ok('… 2 opérations gardées (mêmes identifiants), la 3ᵉ supprimée', g.length === 2 && g.every((o) => o.groupe.nb === 2), g.length);
  await ov().locator('button', { hasText: 'Annuler le groupe' }).click(); await page.waitForTimeout(300);
  await page.locator('.overlay').last().locator('button', { hasText: 'Annuler le groupe' }).last().click(); await page.waitForTimeout(800);
  ok('annulation du groupe : plus aucune opération du groupe', !(await db()).ops.some((o) => o.groupe && o.groupe.id === gid));
  // 5. relevés groupés (densité / température) planifiés puis validés en groupe ; fiche du jour
  await page.click('#tab-cuverie'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Cartes' }).click(); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: '☑ Sélection multiple' }).click(); await page.waitForTimeout(200);
  for (const n of ['Cuve D1', 'Cuve 10']) await page.locator('.tankcard', { hasText: n }).first().click();
  await page.locator('[data-selbar] button', { hasText: 'Relevé densité / température' }).click(); await page.waitForTimeout(500);
  await ov().locator('input[type=date]').fill('2026-11-21');
  await ov().locator('button', { hasText: '📋 Planifier (à réaliser)' }).click(); await page.waitForTimeout(800);
  d = await db(); const pv = (d.previsions || []).filter((p) => p.groupe); const pgid = pv[0] && pv[0].groupe.id;
  ok('relevés planifiés : 2 opérations à réaliser reliées par un groupe', pv.length === 2 && pv.every((p) => p.type === 'suivi' && p.groupe.id === pgid && p.statut === 'prevue'), pv.length);
  ok('… fiche du groupe (à réaliser) : « ✓ Valider le groupe… »', /Valider le groupe/.test(await txt(ov())));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok('… sélection terminée après la saisie groupée', (await page.locator('[data-selbar]').count()) === 0);
  await page.click('#tab-previsions'); await page.waitForTimeout(500);
  await page.locator('main button', { hasText: '🖨 Fiche du jour…' }).click(); await page.waitForTimeout(400);
  ok('fiche du jour : types prévus ce jour-là, avec le nombre à réaliser', /Suivi de fermentation/.test(await txt(ov())) && /2 à réaliser/.test(await txt(ov())), await txt(ov()));
  await ov().locator('button', { hasText: '🖨 Préparer la fiche' }).click(); await page.waitForTimeout(800);
  const fj = await txt(ov().locator('.fiche'));
  ok('… fiche « Suivi des fermentations » multi-lignes : les deux cuves (et les autres en fermentation)', (await ov().locator('.fiche').count()) === 1 && /Suivi des fermentations/.test(fj) && /Cuve D1/.test(fj) && /Cuve 10/.test(fj), fj.slice(0, 300));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.locator(`main [data-groupe="${pgid}"]`).first().click(); await page.waitForTimeout(400);
  await ov().locator('button', { hasText: '✓ Valider le groupe…' }).click(); await page.waitForTimeout(500);
  const lig = ov().locator('[data-groupe-lignes] tbody tr');
  await lig.nth(0).locator('input').nth(1).fill('1,012'); await lig.nth(0).locator('input').nth(2).fill('18'); await lig.nth(1).locator('input').nth(1).fill('0,996');
  await ov().locator('button', { hasText: '✓ Valider (2)' }).click(); await page.waitForTimeout(800);
  d = await db(); const su = d.ops.filter((o) => o.groupe && o.groupe.id === pgid);
  ok('validées en groupe : 2 suivis (densité, température), opérations à réaliser passées « validées »', su.length === 2 && su.some((o) => o.densite === 1.012 && o.tempC === 18) && su.some((o) => o.densite === 0.996) && d.previsions.filter((p) => p.groupe && p.groupe.id === pgid).every((p) => p.statut === 'realisee' && p.opId), su.map((o) => [o.densite, o.tempC]));
  console.log('ERREURS', errors.length ? errors : 'aucune'); if (errors.length) ko++;
  await browser.close();
}
// téléphone : sélection et saisie groupée, sans défilement horizontal de la page
{
  const { browser, page, errors } = await open({ mobile: true, viewport: { width: 390, height: 844 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  await page.click('#tab-cuverie'); await page.waitForTimeout(400); await page.locator('main [role=tab]', { hasText: 'Cartes' }).click(); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: '☑ Sélection multiple' }).click(); await page.waitForTimeout(200);
  for (const n of ['Cuve D1', 'Cuve 10']) await page.locator('.tankcard', { hasText: n }).first().click();
  const sw = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  await page.locator('[data-selbar] button', { hasText: 'Changement de stade' }).click(); await page.waitForTimeout(500);
  ok('téléphone : barre de sélection et formulaire groupé (changement de stade), page sans défilement horizontal', sw && /Changement de stade/.test(await txt(ov())) && (await ov().locator('[data-groupe-lignes] tbody tr').count()) === 2 && await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.screenshot({ path: SC + '/shots/t58-mobile.png' });
  console.log('ERREURS', errors.length ? errors : 'aucune'); if (errors.length) ko++;
  await browser.close();
}
// anglais : sélection, formulaire groupé, personnalisation
{
  const { browser, page, errors } = await open({ locale: 'en-US', viewport: { width: 1280, height: 900 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  await page.click('#tab-cuverie'); await page.waitForTimeout(400); await page.locator('main [role=tab]', { hasText: 'Cards' }).click(); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: '☑ Multiple selection' }).click(); await page.waitForTimeout(200);
  await page.locator('.tankcard', { hasText: 'Cuve D1' }).first().click();
  const bar = await txt(page.locator('[data-selbar]'));
  ok('anglais : barre « 1 tank(s) selected », « Density / temperature reading », « Select all »', /1 tank\(s\) selected/.test(bar) && /Density \/ temperature reading/.test(bar) && /Select all/.test(bar), bar);
  await page.locator('[data-selbar] button').first().click(); await page.waitForTimeout(500);
  const f = await txt(ov());
  ok('… formulaire « Grouped entry — Sulphiting », « Common to all tanks »', /Grouped entry — Sulphiting/i.test(f) && /Common to all tanks/.test(f), f.slice(0, 300));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200); await page.locator('main button', { hasText: '✓ Selecting' }).click(); await page.waitForTimeout(200);
  await page.locator('.tankcard', { hasText: 'Cuve D1' }).first().click(); await page.waitForTimeout(500);
  await ov().locator('button', { hasText: '⚙ Customise the sheet' }).click(); await page.waitForTimeout(300);
  ok('… « Customise the sheet » : « For me », « For the whole team », rubriques traduites', /For me/.test(await txt(ov())) && /For the whole team/.test(await txt(ov())) && /Fermentation \(density and temperature curves, alert\)/.test(await txt(ov())));
  console.log('ERREURS', errors.length ? errors : 'aucune'); if (errors.length) ko++;
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUT EST BON');
process.exitCode = ko ? 1 : 0;
