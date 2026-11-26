// 0.30.0-alpha.1 : revendications et plafonds (exemples « à vérifier », vérification, correction, règle de substance), import d'un
// cahier des charges (texte fictif collé, propositions relues puis appliquées), doses cumulées et SO₂ total estimé sur les fiches,
// dépassement d'un plafond : motif exigé (formulaire d'opération et saisie groupée), tracé au journal et au registre des intrants ;
// anglais. Données fictives.
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const choisir = async (page, loc, label, tape) => { const el = loc.first(); if ((await el.evaluate((e) => e.tagName)) === 'SELECT') await el.selectOption({ label }); else await pick(page, el, tape || label, label); await page.waitForTimeout(250); };
const CAHIER = 'Article 4 — Sulfitage. La teneur maximale en SO2 total des vins rouges est fixée à 100 mg/l ; elle est de 150 mg/l pour les vins blancs et rosés et de 155 mg/L pour les vins mousseux.\nArticle 7 — L’utilisation de charbon œnologique est interdite. Le PVPP est limité à 30 g/hl.';
{
  const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await page.click('#tab-intrants'); await page.waitForTimeout(500);
  await page.locator('main [role=tab]', { hasText: 'Revendications & plafonds' }).click(); await page.waitForTimeout(500);
  const so2 = page.locator('[data-plafonds-so2]'); let v = await txt(page.locator('main'));
  ok('plafonds : 9 exemples (Conventionnel, Bio, Demeter × 3 types de vins), « exemple à vérifier », source citée', (await so2.locator('tbody tr').count()) === 9 && (await so2.locator('.chip', { hasText: 'exemple à vérifier' }).count()) === 9 && /Règlement délégué \(UE\) 2019\/934/.test(v) && /Les valeurs proposées sont des exemples non officiels/.test(v), v.slice(0, 400));
  ok('… pas encore dans la base (exemples virtuels)', !(await db()).plafonds);
  const lEff = so2.locator('tbody tr').filter({ hasText: 'Vins effervescents' }).first();
  await lEff.locator('button', { hasText: '✓ Vérifié' }).click(); await page.waitForTimeout(400);
  let d = await db(); const pv = (d.plafonds || []).find((p) => p.id === 'ex-conv-effervescent');
  ok('« ✓ Vérifié » : exemples copiés dans la base, celui-ci vérifié (par, le)', d.plafonds.length === 9 && pv && !pv.aVerifier && pv.verifieLe === '2026-11-21' && /vérifié/.test(await txt(lEff)), pv);
  await so2.locator('tbody tr').filter({ hasText: 'Vins rouges' }).first().locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(300);
  await ov().locator('label', { hasText: 'SO₂ total maximal (mg/L)' }).locator('input').fill('140'); await ov().locator('label', { hasText: 'Vérifié (sinon' }).locator('input').check();
  await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
  d = await db();
  ok('plafond corrigé (Conventionnel, vins rouges → 140 mg/L), vérifié', d.plafonds.find((p) => p.id === 'ex-conv-rouge').valeur === 140 && !d.plafonds.find((p) => p.id === 'ex-conv-rouge').aVerifier);
  // règle de substance : PVPP interdit en Demeter
  await page.locator('main button', { hasText: '+ Règle de substance' }).click(); await page.waitForTimeout(300);
  await choisir(page, ov().locator('label', { hasText: 'Revendication' }).locator('select, input').first(), 'Demeter');
  await ov().locator('input[placeholder="ex. PVPP"]').fill('Charbon'); await ov().locator('input[placeholder="ex. pvpp, polyvinylpolypyrrolidone"]').fill('charbon');
  await ov().locator('label', { hasText: 'Autorisé' }).locator('input').uncheck(); await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
  d = await db(); const sub = d.plafonds.find((p) => p.objet === 'substance');
  ok('règle de substance : charbon interdit en Demeter, listée avec ses mots-clés', sub && sub.qualifId === 'dem' && sub.mot === 'charbon' && sub.autorise === false && /charbon/.test(await txt(page.locator('[data-plafonds-substances]'))) && /interdit/.test(await txt(page.locator('[data-plafonds-substances]'))), sub);
  // cahier des charges : texte collé, propositions, application à Bio
  await page.locator('main button', { hasText: '📥 Importer un cahier des charges…' }).click(); await page.waitForTimeout(400);
  await ov().locator('textarea[aria-label="Texte du cahier des charges"]').fill(CAHIER);
  await ov().locator('button', { hasText: 'Analyser le texte' }).click(); await page.waitForTimeout(500);
  const props = await ov().locator('[data-cahier-props] tbody tr').evaluateAll((trs) => trs.map((tr) => tr.innerText.replace(/\s+/g, ' ')));
  ok('cahier des charges (texte fictif) : 5 propositions (rouges 100, blancs et rosés 150, mousseux 155, charbon interdit, PVPP 30 g/hL), extraits affichés', props.length === 5 && props.some((p) => /Vins rouges : 100 mg\/L/.test(p)) && props.some((p) => /Vins blancs et rosés : 150 mg\/L/.test(p)) && props.some((p) => /Vins effervescents : 155 mg\/L/.test(p)) && props.some((p) => /Charbon œnologique : interdit/.test(p)) && props.some((p) => /PVPP : dose max 30 g\/hL/.test(p)), props);
  ok('… rien d’appliqué tant que rien n’est coché', await ov().locator('.sheet-f .btn-primary').isDisabled());
  await ov().locator('label', { hasText: 'Tout cocher' }).locator('input').check(); await ov().locator('input[aria-label="Source"], label:has-text("Source") input').first().fill('Cahier des charges fictif 2026');
  await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
  d = await db(); const bio = d.plafonds.filter((p) => p.qualifId === 'bio');
  ok('… appliqué à Bio : plafonds remplacés (100 / 150 / 155), 2 substances, vérifiés, source', bio.filter((p) => p.objet === 'so2t').map((p) => `${p.vin}:${p.valeur}`).sort().join() === 'blanc_rose:150,effervescent:155,rouge:100' && bio.filter((p) => p.objet === 'substance').length === 2 && bio.every((p) => !p.aVerifier && p.source === 'Cahier des charges fictif 2026'), bio.map((p) => [p.objet, p.vin || p.mot, p.valeur || p.doseMax]));
  await page.screenshot({ path: SC + '/shots/t62-plafonds.png' });
  // fiche de cuve : doses cumulées (assemblage), SO₂ total estimé
  await page.click('#tab-cuverie'); await page.waitForTimeout(400); await page.locator('main [role=tab]', { hasText: 'Cartes' }).click(); await page.waitForTimeout(300);
  await page.locator('.tankcard', { hasText: 'AS25-02' }).first().click(); await page.waitForTimeout(600);
  const cum = await txt(ov().locator('[data-rubrique=intrants]'));
  ok('fiche de cuve : doses cumulées du lot assemblé (part héritée, plafond), sulfitant contrôlé par le SO₂ total', (await ov().locator('[data-doses-cumulees]').count()) >= 1 && /Doses cumulées du lot AS25-02/i.test(cum) && /dont héritée/i.test(cum) && /Métabisulfite de potassium/.test(cum) && /contrôlé par le SO₂ total/.test(cum), cum.slice(0, 600));
  const s2 = await txt(ov().locator('[data-rubrique=so2]'));
  ok('… SO₂ total estimé (mg/L) et plafond de la revendication (vérifié ou exemple à vérifier)', /SO₂ total estimé/.test(s2) && /mg\/L/.test(s2) && /Plafond/.test(s2) && /(vérifié|exemple à vérifier)/.test(s2), s2.slice(0, 400));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // dépassement : motif exigé dans le formulaire d'opération
  await page.locator('.tankcard', { hasText: 'Cuve D1' }).first().click(); await page.waitForTimeout(600);
  await ov().locator('[data-rubrique=lots] button', { hasText: 'Intrant' }).first().click(); await page.waitForTimeout(600);
  if (!(await ov().locator('[data-ligne-intrant]').count())) { await ov().locator('button', { hasText: '+ Ajouter un intrant' }).first().click(); await page.waitForTimeout(250); }
  const lg = ov().locator('[data-ligne-intrant="0"]');
  await choisir(page, lg.locator('[aria-label="Fournisseur"]'), 'En stock');
  await pick(page, lg.locator('input[aria-label="Produit"]'), 'Métabisulfite', 'Métabisulfite de potassium'); await page.waitForTimeout(400);
  const lots = lg.locator('select').last(); if ((await lots.locator('option').count()) > 1 && !(await lots.inputValue())) await lots.selectOption({ index: 1 });
  await lg.locator('input[placeholder="0"]').fill('400'); await page.waitForTimeout(600);
  let f = await txt(ov());
  ok('formulaire : dose au-delà du maximum (≈ 20 g/hL pour 15) → « Dépassement d’un plafond : motif obligatoire »', /Dépassement d’un plafond : motif obligatoire/.test(f) && /dose de l’opération/.test(f) && (await ov().locator('[data-depassements] li').count()) >= 1, f.slice(0, 500));
  await ov().locator('.sheet-f .btn-primary').last().click(); await page.waitForTimeout(500);
  ok('… enregistrement refusé sans motif', !(await db()).ops.some((o) => o.depassement) && (await page.locator('.overlay').count()) >= 1);
  await ov().locator('textarea[aria-label="Motif du dépassement"]').fill('Correction décidée après analyse (essai)'); await ov().locator('.sheet-f .btn-primary').last().click(); await page.waitForTimeout(800);
  d = await db(); const od = d.ops.find((o) => o.depassement);
  ok('… avec un motif : opération enregistrée, motif tracé (auteur, date, détail du dépassement)', od && od.depassement.motif === 'Correction décidée après analyse (essai)' && od.depassement.le === '2026-11-21' && od.depassement.details.some((x) => x.type === 'dose' && x.max === 15), od && od.depassement);
  for (let i = 0; i < 3; i++) { if (!(await page.locator('.overlay').count())) break; await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
  // journal et registre des intrants
  await page.click('#tab-ops'); await page.waitForTimeout(500);
  ok('journal : pastille « dépassement justifié » (motif en infobulle)', (await page.locator('main [data-depassement-chip]').count()) >= 1 && (await page.locator('main [data-depassement-chip]').first().getAttribute('title')) === 'Correction décidée après analyse (essai)');
  await page.click('#tab-registres'); await page.waitForTimeout(500);
  await page.locator('main button', { hasText: 'Registre des intrants & traitements' }).first().click(); await page.waitForTimeout(500);
  const hd = await page.locator('main table thead').first().innerText(); const lr = await page.locator('main table tbody tr', { hasText: 'Correction décidée après analyse (essai)' }).count();
  ok('registre des intrants : colonnes « Dose cumulée du lot » et « Motif du dépassement », motif sur la ligne', /Dose cumulée du lot/i.test(hd) && /Motif du dépassement/i.test(hd) && lr === 1, hd);
  // saisie groupée : motif exigé
  await page.click('#tab-cuverie'); await page.waitForTimeout(400); await page.locator('main [role=tab]', { hasText: 'Cartes' }).click(); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: '☑ Sélection multiple' }).click(); await page.waitForTimeout(300);
  for (const n of ['Cuve 10', 'Jarre 01']) await page.locator('.tankcard', { hasText: n }).first().click();
  await page.locator('[data-selbar] button', { hasText: 'Sulfitage' }).click(); await page.waitForTimeout(500);
  await choisir(page, ov().locator('[aria-label="Fournisseur"]'), 'En stock');
  await pick(page, ov().locator('input[placeholder="Produit…"]'), 'Métabisulfite', 'Métabisulfite de potassium');
  await ov().locator('input[placeholder="ex. 3"]').fill('20'); await page.waitForTimeout(500);
  ok('saisie groupée : 20 g/hL → encadré du dépassement (motif obligatoire)', /Dépassement d’un plafond : motif obligatoire/.test(await txt(ov())));
  await ov().locator('button', { hasText: '✓ Valider (2)' }).click(); await page.waitForTimeout(500);
  ok('… refusé sans motif', !(await db()).ops.some((o) => o.groupe && o.depassement));
  await ov().locator('textarea[aria-label="Motif du dépassement"]').fill('Essai groupé'); await ov().locator('button', { hasText: '✓ Valider (2)' }).click(); await page.waitForTimeout(800);
  d = await db(); const gd = d.ops.filter((o) => o.groupe && o.depassement);
  ok('… avec un motif : les opérations qui dépassent le gardent', gd.length >= 1 && gd.every((o) => o.depassement.motif === 'Essai groupé'), gd.length);
  console.log('ERREURS', errors.length ? errors : 'aucune'); if (errors.length) ko++;
  await browser.close();
}
// anglais : plafonds, fiche (doses cumulées), encadré du dépassement
{
  const { browser, page, errors } = await open({ locale: 'en-US', viewport: { width: 1280, height: 900 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  await page.click('#tab-intrants'); await page.waitForTimeout(400);
  await page.locator('main [role=tab]', { hasText: 'Designations & limits' }).click(); await page.waitForTimeout(500);
  const v = await txt(page.locator('main'));
  ok('anglais : « Designation limits », « Maximum total SO₂ (mg/L) », « example to check », types de vins, notes', /Designation limits/.test(v) && /Maximum total SO₂ \(mg\/L\)/.test(v) && /example to check/.test(v) && /Sparkling wines/.test(v) && /quality sparkling wines \(235 for other sparkling wines\)/.test(v) && /\+ Substance rule/.test(v), v.slice(0, 700));
  await page.click('#tab-cuverie'); await page.waitForTimeout(400); await page.locator('main [role=tab]', { hasText: 'Cards' }).click(); await page.waitForTimeout(300);
  await page.locator('.tankcard', { hasText: 'AS25-02' }).first().click(); await page.waitForTimeout(600);
  const cum = await txt(ov().locator('[data-rubrique=intrants]')); const s2 = await txt(ov().locator('[data-rubrique=so2]'));
  ok('… fiche : « Cumulative doses of lot », « Cumulative dose », « of which inherited », « checked via total SO₂ », « Estimated total SO₂ »', /Cumulative doses of lot AS25-02/i.test(cum) && /Cumulative dose/i.test(cum) && /of which inherited/i.test(cum) && /checked via total SO₂/.test(cum) && /Estimated total SO₂/.test(s2), [cum.slice(0, 300), s2.slice(0, 200)]);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.locator('.tankcard', { hasText: 'Cuve D1' }).first().click(); await page.waitForTimeout(600);
  await ov().locator('[data-rubrique=lots] button', { hasText: 'Additive' }).first().click(); await page.waitForTimeout(600);
  if (!(await ov().locator('[data-ligne-intrant]').count())) { await ov().locator('button', { hasText: '+ Add an additive' }).first().click(); await page.waitForTimeout(250); }
  const lg = ov().locator('[data-ligne-intrant="0"]');
  await choisir(page, lg.locator('[aria-label="Supplier"], [aria-label="Fournisseur"]'), 'In stock');
  await pick(page, lg.locator('input[aria-label="Product"], input[aria-label="Produit"]').first(), 'Métabisulfite', 'Métabisulfite de potassium'); await page.waitForTimeout(400);
  await lg.locator('input[placeholder="0"]').fill('400'); await page.waitForTimeout(600);
  const f = await txt(ov());
  ok('… encadré : « Limit exceeded: reason required », « operation dose », « Reason for exceeding »', /Limit exceeded: reason required/.test(f) && /operation dose/.test(f) && /Reason for exceeding/i.test(f) && /limit 15,0 g\/hL \(Conventional\)/.test(f), f.slice(0, 600));
  console.log('ERREURS', errors.length ? errors : 'aucune'); if (errors.length) ko++;
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUT EST BON');
process.exitCode = ko ? 1 : 0;
