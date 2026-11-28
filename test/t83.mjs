// 0.43.0-alpha.2 : Vinification › Plan de vinification — tableau modifiable directement (case, en-tête, étape), outils d'une ligne
// (opération liée, insertion, retrait), variante conditionnelle (partenaire), plus de « Schémas par lot » ni de bouton « Modifier ».
// Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
let t; const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
{
  const { browser, page, errors } = await open({ viewport: { width: 1500, height: 950 } });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await page.click('#tab-cuverie').catch(() => {}); await page.waitForTimeout(200); await page.click('#tab-plan'); await page.waitForTimeout(500);
  t = await txt(page.locator('main'));
  ok('Plan de vinification : sous-onglets « Plan » et « Appliquer à un lot » seulement (plus de « Schémas par lot »), pas de bouton « Modifier »', !/Schémas par lot/.test(t) && (await page.locator('[data-planv] button', { hasText: /^Modifier$/ }).count()) === 0 && (await page.locator('[data-planv-edit]').count()) === 1, t.slice(0, 300));
  // ---- case modifiée directement
  const ligne = page.locator('[data-planv-edit] tbody tr').nth(1); const lid = await ligne.getAttribute('data-planv-ligne');
  const c0 = ligne.locator('[data-planv-case] input').first(); const cle = await ligne.locator('[data-planv-case]').first().getAttribute('data-planv-case');
  await c0.fill('6 g/hL'); await c0.press('Enter'); await page.waitForTimeout(500);
  let d = await db(); let P = (d.plansVinif || [])[0];
  ok('case modifiée (Entrée) : exemple copié dans la base, valeur enregistrée', P && P.lignes.find((l) => l.id === lid).valeurs[cle.split('|').slice(1).join('|')] === '6 g/hL', P && P.lignes.find((l) => l.id === lid));
  const c1 = ligne.locator('[data-planv-case] input').nth(1); const v1 = await c1.inputValue(); await c1.fill('99 g/hL'); await c1.press('Escape'); await page.waitForTimeout(300);
  ok('Échap : modification annulée, rien d’enregistré', (await c1.inputValue()) === v1 && JSON.stringify((await db()).plansVinif[0].lignes) === JSON.stringify(P.lignes));
  // en-tête et étape
  const g0 = page.locator('[data-planv-edit] thead tr').first().locator('input').first(); await g0.fill('Chardonnay'); await g0.blur(); await page.waitForTimeout(400);
  const e0 = ligne.locator('.planv-e textarea'); await e0.fill('Sulfitage à la presse'); await e0.blur(); await page.waitForTimeout(400);
  d = await db(); P = d.plansVinif[0];
  ok('en-tête du groupe renommé, étape renommée en quittant la case', P.groupes[0].label === 'Chardonnay' && P.lignes.find((l) => l.id === lid).etape === 'Sulfitage à la presse');
  ok('… opération liée toujours devinée (→ Sulfitage)', /→ Sulfitage/.test(await txt(ligne.locator('.planv-e'))));
  // ---- outils d'une ligne
  await page.locator(`[data-planv-outils="${lid}"]`).click(); await page.waitForTimeout(300);
  await ov().getByLabel('Opération liée').selectOption('levurage'); await page.waitForTimeout(300);
  await ov().getByRole('button', { name: '＋ Section après' }).click(); await page.waitForTimeout(300);
  d = await db(); P = d.plansVinif[0]; const i0 = P.lignes.findIndex((l) => l.id === lid);
  ok('outils : opération liée choisie (levurage), section insérée après la ligne', P.lignes[i0].opId === 'levurage' && P.lignes[i0 + 1].type === 'section');
  await ov().getByRole('button', { name: 'Fermer' }).last().click(); await page.waitForTimeout(300);
  const sid = P.lignes[i0 + 1].id; await page.locator(`[data-planv-outils="${sid}"]`).click(); await page.waitForTimeout(300);
  await ov().getByRole('button', { name: 'Retirer la ligne' }).click(); await page.waitForTimeout(400);
  d = await db(); ok('… section retirée', !d.plansVinif[0].lignes.some((l) => l.id === sid));
  // ---- variante conditionnelle
  await page.locator('[data-planv-variante]').click(); await page.waitForTimeout(500);
  ok('« ＋ Variante » : copie créée, conditions demandées', (await page.locator('[data-planv-conditions]').count()) === 1);
  await ov().getByLabel('Rechercher : Partenaires').fill('Hennequin'); await page.waitForTimeout(200);
  await ov().locator('[data-choix-multiple="Partenaires"] label', { hasText: 'Domaine Hennequin' }).locator('input').check();
  await ov().locator('[data-choix-multiple="Revendications"] label', { hasText: 'BIO' }).locator('input').check();
  await ov().getByRole('button', { name: 'Enregistrer', exact: true }).click(); await page.waitForTimeout(500);
  d = await db(); const V = d.plansVinif.find((p) => p.conditions);
  ok('variante enregistrée : partenaire et revendication, copie du plan modifié', V && V.conditions.apporteurs.length === 1 && V.conditions.revendications[0] === 'bio' && /variante/.test(V.nom) && V.lignes.some((l) => l.etape === 'Sulfitage à la presse'), V && V.conditions);
  t = await txt(page.locator('[data-planv-conditions-texte]'));
  ok('… conditions affichées au-dessus du tableau', /Variante/.test(t) && /Domaine Hennequin/.test(t) && /BIO/.test(t), t);
  const opts = await page.locator('[data-planv] select[aria-label="Plan de vinification"] option').allInnerTexts();
  ok('… sélecteur : plan général et variante (↳)', opts.length === 2 && opts.some((o) => /^↳ /.test(o)), opts);
  await page.screenshot({ path: `${SC}/shots/t83-plan.png`, fullPage: false });
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  await page.evaluate(() => localStorage.setItem('oenotrack-langue', 'en')); await page.reload(); await page.waitForTimeout(1200);
  await page.click('#tab-cuverie').catch(() => {}); await page.waitForTimeout(200); await page.click('#tab-plan'); await page.waitForTimeout(500);
  t = await txt(page.locator('[data-planv]')); ok('en anglais : « 🎯 Conditions », « ＋ Variant », proposition à la création d’un lot', /Conditions/.test(t) && /Variant/.test(t) && /Suggest the plan steps when a lot is created/.test(t), t.slice(0, 400));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t83)'); process.exitCode = ko ? 1 : 0;
