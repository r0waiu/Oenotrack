// 0.50.0-alpha.2 : onglet « Mise en bouteille » — sous-onglets, chantier de mise, nouvelle mise (cuve, formats, bouchage, contrôle),
// lot fini créé et habillé, onglet selon le réglage Vignoble (Bordeaux : Mise sans Tirages ; Champagne seul : Tirages sans Mise),
// anglais, téléphone. Données fictives (jeu d'exemple).
import { open, reglerVignoble } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
const init = () => { window.claude = { use: async () => null }; window.print = () => {}; };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const onglets = async () => page.locator('[id^="tab-"]').evaluateAll((L) => L.map((x) => x.id.slice(4)));
const ov = () => page.locator('.overlay').last();

// 1. onglet et sous-onglets
await page.click('#tab-mise'); await page.waitForTimeout(400);
let t = await txt(page.locator('main'));
ok('onglet « Mise en bouteille » : Mettre, Fournitures, Habillage & cartons ; chantiers et mises vides', /Mettre/.test(t) && /Fournitures/.test(t) && /Habillage & cartons/.test(t) && /Aucune mise en bouteille/.test(t) && /Chantiers de mise/.test(t), t.slice(0, 300));
// 2. chantier de mise
await page.locator('[data-chantier-mise-nouveau]').click(); await page.waitForTimeout(400);
await ov().getByLabel('Nom du chantier').fill('Mise fictive de printemps');
await ov().getByRole('button', { name: /Enregistrer/ }).click(); await page.waitForTimeout(600);
let d = await db();
ok('chantier de mise créé (n° MB-AAAA-NN, interne, ligne par défaut) et sa fiche ouverte', (d.chantiersMise || []).length === 1 && /^MB-\d{4}-\d\d$/.test(d.chantiersMise[0].numero) && d.chantiersMise[0].ligne.tireuse && (await page.locator('[data-chantier-mise]').count()) === 1);
await ov().getByRole('button', { name: /Mise sur ce chantier/ }).click(); await page.waitForTimeout(500);
// 3. nouvelle mise
const f = ov(); const opts = await f.getByLabel('Cuve prélevée 1').locator('option').evaluateAll((L) => L.map((x) => x.value).filter(Boolean));
await f.getByLabel('Cuve prélevée 1').selectOption(opts[opts.length - 1]); await page.waitForTimeout(200);
await f.getByLabel('Volume pris dans la cuve 1').fill('300');
await f.getByLabel('Cols format 1').fill('390');
await f.getByLabel('Type de bouchage').selectOption('vis'); await f.getByLabel('Capsule de surbouchage').selectOption('crd');
await f.locator('[data-mise-controle-ajout]').click(); await f.getByLabel('Mesure du contrôle 1').fill('63');
t = await txt(f);
ok('formulaire : chantier repris, n° de lot proposé (MB), volumes pris / mis, rappel des analyses', (await f.getByLabel('Chantier de mise').inputValue()) === d.chantiersMise[0].id && /^MB\d\d-\d\d$/.test(await f.getByLabel('N° de lot de la mise').inputValue()) && /Vin pris : [^·]+ · mis : [^·]+ · pertes : /.test(t) && (await f.locator('[data-mise-avant]').count()) === 1, t.slice(0, 500));
await page.screenshot({ path: SC + '/shots/t104-mise.png' });
await f.getByRole('button', { name: /Enregistrer/ }).click(); await page.waitForTimeout(800);
for (let i = 0; i < 3 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
d = await db(); const op = d.ops.find((o) => o.sousType === 'mise_bouteille'); const fini = (d.lotsFinis || []).find((x) => x.opId === (op || {}).id);
ok('mise enregistrée : lot fini créé (390 cols), bouchage vis + CRD, contrôle, rattachée au chantier', op && op.chantierId === d.chantiersMise[0].id && fini && fini.nb === 390 && fini.mise && op.mise.bouchage.type === 'vis' && op.mise.bouchage.capsule === 'crd' && op.mise.controles.length === 1, op);
t = await txt(page.locator('[data-mise-mettre]'));
ok('liste : la mise et ses chiffres (390 cols, Capsule à vis, CRD)', /390/.test(t) && /Capsule à vis/.test(t) && /CRD/.test(t), t.slice(0, 500));
// 4. habillage du lot en bouteilles
await page.locator('main [role=tab]', { hasText: 'Habillage' }).first().click(); await page.waitForTimeout(400);
await page.locator('main button', { hasText: '＋ Habillage' }).first().click(); await page.waitForTimeout(400);
const so = await ov().locator('select').first().locator('option').evaluateAll((L) => L.map((x) => x.textContent));
ok('habillage : le lot en bouteilles proposé comme lot fini', so.some((x) => x.includes(fini.code)), so);
for (let i = 0; i < 3 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); }
// 5. Vignoble : onglet selon les types de vins
await reglerVignoble(page, 'bordeaux', ['rouge', 'blanc']); let O = await onglets();
ok('Bordeaux rouges et blancs : Mise en bouteille affichée, Tirages masqués', O.includes('mise') && !O.includes('tirage'), O);
await reglerVignoble(page, 'champagne', ['effervescent']); O = await onglets();
ok('Champagne seul : Tirages affichés, Mise en bouteille masquée (lot fini gardé)', !O.includes('mise') && O.includes('tirage') && (await db()).lotsFinis.some((x) => x.id === fini.id), O);
await reglerVignoble(page, 'champagne', ['effervescent', 'blanc']); O = await onglets();
ok('Champagne + Coteaux champenois (blancs) : les deux onglets', O.includes('mise') && O.includes('tirage'), O);
// 6. anglais
await page.click('#tab-mise'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Mettre' }).first().click(); await page.waitForTimeout(300);
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(400);
t = await txt(page.locator('main'));
ok('anglais : Bottle, Supplies, Bottling runs, Bottlings ; n° de lot non traduit', /Bottle/.test(t) && /Bottling runs/.test(t) && /Bottlings/.test(t) && t.includes(fini.code) && !/Chantiers de mise/.test(t), t.slice(0, 400));
await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
ok('aucune erreur', !errors.length, errors);
await browser.close();
// 7. téléphone
{
  const { browser: b2, page: p2, errors: e2 } = await open({ init, viewport: { width: 390, height: 844 }, mobile: true, date: '2026-11-26T10:00:00' });
  await p2.click('#tab-mise'); await p2.waitForTimeout(400); await p2.locator('[data-mise-nouvelle]').click(); await p2.waitForTimeout(500);
  const w = await p2.evaluate(() => document.documentElement.scrollWidth);
  await p2.screenshot({ path: SC + '/shots/t104-mobile.png', fullPage: true });
  ok('téléphone : formulaire de mise sans débordement horizontal', w <= 392 && !e2.length, [w, e2]);
  await b2.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt104 : TOUT PASSE'); process.exitCode = ko ? 1 : 0;
