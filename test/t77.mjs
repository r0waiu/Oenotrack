// 0.41.0-alpha.1 : pressoir — volumes sortie pressoir non débourbés (préremplis d'après l'usage débourbé et le taux de bourbes de chaque
// fraction, réglé dans Paramètres › Fractions de moût), plafond et usages contrôlés sur le débourbé (alerte avant débourbage, bloquant avec
// les bourbes du marc), marc chargé sans cuve malgré le préremplissage, bon de pressoir, bilan ; anglais
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 500) : ''); };
const { browser, page, errors } = await open({ viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
const ov = () => page.locator('.overlay').last();
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const sub = async (t) => { await page.locator('[data-pressoir] [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(250); };
const fermer = async () => { for (let i = 0; i < 5 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };

// 1. Paramètres › Revendications, stades & listes › Fractions de moût : taux de bourbes de la cuvée
await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="listes"]').click(); await page.waitForTimeout(400);
const champ = page.locator('[data-bourbes-fraction="cuvee"]');
ok('Fractions de moût : taux de bourbes par fraction (cuvée, tailles, rebêche), vide = taux du profil (2,5)', (await champ.count()) === 1 && (await champ.getAttribute('placeholder')) === '2,5' && (await page.locator('[data-bourbes-fraction="taille1"]').count()) === 1 && (await page.locator('[data-bourbes-fraction="lies"]').count()) === 0);
await champ.fill('3'); await champ.blur(); await page.waitForTimeout(400);
let d = await db(); ok('… enregistré dans la fraction (3 %)', d.lists.fractions.find((f) => f.id === 'cuvee').bourbesPct === 3);
await champ.fill('70'); await champ.blur(); await page.waitForTimeout(400);
d = await db(); ok('… 70 % refusé (entre 0 et 50 %)', d.lists.fractions.find((f) => f.id === 'cuvee').bourbesPct === 3);

// 2. pesée de 4 000 kg puis marc : volumes non débourbés préremplis
async function peser(heure) {
  await page.click('#tab-pressoir'); await page.waitForTimeout(400);
  await page.locator('[aria-label="Année des vendanges"]').selectOption('2026'); await page.waitForTimeout(250);
  await sub('Pesées'); await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300);
  const f = ov(); await f.locator('[data-heure]').fill(heure);
  await pick(page, f.locator('input[aria-label="Partenaire"]').first(), 'Lefèvre');
  await pick(page, f.locator('input[placeholder^="Cru (village)"]').first(), 'Cramant');
  await f.locator('[data-brut]').fill('4300'); await f.locator('[data-tare]').fill('300'); await page.waitForTimeout(150);
  await f.locator('.sheet-f .btn-primary', { hasText: 'Peser et valider' }).click(); await page.waitForTimeout(500);
  await ov().locator('.sheet-f .btn', { hasText: 'Fermer' }).click(); await page.waitForTimeout(250);
}
await peser('08:05');
await sub('Pressurages'); await page.locator('[data-nouveau-marc]').click(); await page.waitForTimeout(300); let f = ov();
await f.locator('[data-heure-debut]').fill('08:05'); await f.locator('[data-remplir]').click(); await page.waitForTimeout(400);
const vC = await f.locator('[data-volume-fraction="cuvee"]').inputValue(); const vT = await f.locator('[data-volume-fraction="taille1"]').inputValue();
ok('marc de 4 000 kg : cuvée préremplie 2 050 ÷ 0,97 = 21,13 hL, 1ère taille 500 ÷ 0,975 = 5,13 hL (non débourbés)', vC === '21,13' && vT === '5,13', [vC, vT]);
let t = await txt(f);
ok('… libellé « Moûts obtenus (sortie pressoir, non débourbés) », repère « Prérempli … remplacez par le volume mesuré »', /Moûts obtenus \(sortie pressoir, non débourbés\)/i.test(t) && (await f.locator('[data-prerempli="cuvee"]').count()) === 1 && /remplacez par le volume mesuré/.test(t));
await page.screenshot({ path: SC + '/shots/t77-prerempli.png' });
// chargé sans cuve : les volumes préremplis ne sont pas enregistrés (marc en cours)
await f.locator('.sheet-f .btn-primary').last().click(); await page.waitForTimeout(700);
d = await db(); let m = d.ops.filter((o) => o.type === 'pressurage').slice(-1)[0];
ok('« Charger le marc » sans cuve : enregistré en cours, sans volumes (préremplissage non retenu)', m.marc.enCours === true && !(m.fractions || []).length && m.charges[0].kg === 4000, m.fractions);
// compléter : volumes mesurés (22 hL et 5,5 hL non débourbés), sans bourbes → alerte « à confirmer au débourbage », validable
await page.locator('main tbody tr', { hasText: 'à compléter' }).first().locator('button', { hasText: 'Compléter' }).click(); await page.waitForTimeout(400); f = ov();
ok('… « Compléter » : volumes de nouveau préremplis', (await f.locator('[data-volume-fraction="cuvee"]').inputValue()) === '21,13');
await f.locator('[data-volume-fraction="cuvee"]').fill('22'); await pick(page, f.locator('input[aria-label="Cuve Cuvée"]'), 'Bac D1');
await f.locator('[data-volume-fraction="taille1"]').fill('5,5'); await pick(page, f.locator('input[aria-label="Cuve 1ère taille"]'), 'Bac D2');
await f.locator('[data-tavp]').fill('10,2'); await page.waitForTimeout(400);
t = await txt(f);
ok('volumes saisis (27,50 hL non débourbés, ≈ 26,70 hL estimés) : alerte « à confirmer au débourbage », pas de blocage', /à confirmer au débourbage/.test(t) && (await f.locator('[data-valider-marc]').isEnabled()) && (await f.locator('[data-debourbe="estimation"]').count()) === 1 && (await f.locator('[data-prerempli="cuvee"]').count()) === 0, t.slice(0, 400));
await f.locator('input[aria-label="Bourbes"]').fill('0,6'); await page.waitForTimeout(400); t = await txt(f);
ok('bourbes du marc saisies (60 L) : débourbé 26,90 hL au-dessus du plafond de 25,50 hL → bloquant, validation impossible', /Volume revendicable débourbé 26,90 hL \(estimé avec les bourbes du marc\) au-dessus du plafond de 25,50 hL/.test(t) && !(await f.locator('[data-valider-marc]').isEnabled()) && (await f.locator('[data-debourbe="bourbes"]').count()) === 1, t.slice(0, 600));
await page.screenshot({ path: SC + '/shots/t77-plafond.png' });
await f.locator('[data-volume-fraction="cuvee"]').fill('21,2'); await page.waitForTimeout(400);
ok('… cuvée ramenée à 21,20 hL (26,70 − 0,60 = 26,10 hL débourbés > 25,50 hL) : toujours bloquant', !(await f.locator('[data-valider-marc]').isEnabled()));
await f.locator('[data-volume-fraction="taille1"]').fill('4,9'); await page.waitForTimeout(400);
ok('… taille ramenée à 4,90 hL (26,10 − 0,60 = 25,50 hL débourbés) : validable', await f.locator('[data-valider-marc]').isEnabled());
await f.locator('[data-valider-marc]').click(); await page.waitForTimeout(900); await fermer();
d = await db(); m = d.ops.find((o) => o.id === m.id);
ok('marc validé : volumes non débourbés tels que saisis (2 120 L et 490 L), bourbes 60 L', !!m.marc.valide && m.fractions.find((x) => x.fractionId === 'cuvee').volL === 2120 && m.fractions.find((x) => x.fractionId === 'taille1').volL === 490 && m.marc.bourbesL === 60);
// bon de pressoir et bilan
await sub('Pressurages'); await page.locator('main tbody tr').first().locator('[data-bon-pressoir-btn]').click(); await page.waitForTimeout(500);
t = await txt(ov());
ok('bon de pressoir : revendicable non débourbé (26,10 hL) et débourbé (25,50 hL, bourbes du marc)', /Revendicable \(cuvée \+ tailles\), non débourbé 26,10 hL/i.test(t) && /Revendicable débourbé 25,50 hL \(estimé avec les bourbes du marc\)/i.test(t), t.slice(0, 900));
await fermer();
await sub('Bilan'); await page.waitForTimeout(300); t = await txt(page.locator('main'));
ok('bilan : « Revendicables non débourbés » et « Revendicables débourbés »', /Revendicables non débourbés/i.test(t) && /Revendicables débourbés/i.test(t));
// réglages du pressoir : usages débourbés, bourbes par défaut
await sub('Réglages'); await page.waitForTimeout(300); t = await txt(page.locator('main'));
ok('réglages : « Cuvée d’usage (débourbée) », « Taille d’usage (débourbée) », « Bourbes par défaut (préremplissage) »', /Cuvée d’usage \(débourbée\)/i.test(t) && /Taille d’usage \(débourbée\)/i.test(t) && /Bourbes par défaut \(préremplissage\)/i.test(t));
// 3. anglais
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1200);
await page.click('#tab-pressoir'); await page.waitForTimeout(400); await page.locator('[aria-label="Année des vendanges"], [aria-label="Harvest year"]').first().selectOption('2026'); await page.waitForTimeout(250);
await page.locator('[data-pressoir] [role=tab]').nth(1).click(); await page.waitForTimeout(300);
await page.locator('[data-nouveau-marc]').click(); await page.waitForTimeout(400); t = await txt(ov());
ok('anglais : « Musts obtained (press output, unsettled) »', /Musts obtained \(press output, unsettled\)/i.test(t), t.slice(0, 300));
await fermer();
ok('aucune erreur', !errors.length, errors);
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS PASSENT (t77)'); console.log('ERREURS:', errors.length ? errors.join(' | ') : 'aucune');
await browser.close(); process.exitCode = ko ? 1 : 0;
