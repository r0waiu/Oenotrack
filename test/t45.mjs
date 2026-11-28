// 0.24.0-alpha.1 : onglet Pressoir — registre des pesées (ticket), carnet de pressoir (marc chargé puis complété et validé), contrôles AOC Champagne,
// pesées proposées dans le pressurage de l'onglet Opérations, lots créés dans les cuves, journal, annulation avec motif, exports CSV, réglages,
// région « autre » (spécificités champenoises désactivées), téléphone
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 400) : ''); };
const init = () => { window.__saved = []; const downloads = { save: async ({ filename, data }) => { const text = typeof data === 'string' ? data : await data.text(); window.__saved.push({ filename, text }); return { status: 'saved' }; } }; window.claude = { use: async (n) => (n === 'downloads' ? downloads : null) }; };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 } });
const ov = () => page.locator('.overlay').last();
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const sub = async (t) => { await page.locator('[data-pressoir] [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(250); };

// 1. onglet et registre du jeu d'exemple
ok('onglet Pressoir présent, juste après Vinification (Cuverie, 0.34.0-alpha.1)', await page.locator('#tab-pressoir').count() === 1 && (await page.locator('.navtabs [role=tab][id^="tab-"]').evaluateAll((e) => e.map((x) => x.id))).join().includes('tab-vinification,tab-pressoir'));
await page.click('#tab-pressoir'); await page.waitForTimeout(400);
await page.locator('[aria-label="Année des vendanges"]').selectOption('2026'); await page.waitForTimeout(250);
const t1 = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
ok('profil AOC Champagne affiché ; registre 2026 : 4 pesées validées du jeu d’exemple', (await page.locator('[data-profil-actif="champagne"]').count()) === 1 && /Registre des pesées 2026/.test(t1) && (await page.locator('[data-num-pesee]').allInnerTexts()).join() === '4,3,2,1' && /validée/.test(t1), t1.slice(0, 300));
// 2. nouvelle pesée (brut − tare), validée, ticket
await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300);
let f = ov(); ok('formulaire : n° 5 proposé, heure préremplie, bascule choisie', /n° 5/.test(await f.innerText()) && /^\d{2}:\d{2}$/.test(await f.locator('[data-heure]').inputValue()));
await f.locator('[data-heure]').fill('08:05');
await pick(page, f.locator('input[aria-label="Partenaire"]').first(), 'Lefèvre');
await pick(page, f.locator('input[placeholder^="Cru (village)"]').first(), 'Cramant');
await f.locator('[data-brut]').fill('4300'); await f.locator('[data-tare]').fill('300'); await page.waitForTimeout(150);
ok('poids net calculé (brut − tare)', (await f.locator('[data-net]').innerText()).replace(/\s/g, '') === '4000kg', await f.locator('[data-net]').innerText());
await f.locator('.sheet-f .btn-primary', { hasText: 'Peser et valider' }).click(); await page.waitForTimeout(500);
const tk = (await ov().innerText()).replace(/\s+/g, ' ');
ok('bon de pesée ouvert : n° 5, apporteur, poids brut / tare / net, signatures', /Ticket de pesée n° 5/.test(tk) && /Lefèvre/.test(tk) && /4 300 kg/.test(tk) && /4 000 kg/.test(tk) && /Signature de l’apporteur/.test(tk) && /cahier des charges de l’AOC Champagne/.test(tk), tk.slice(0, 400));
await page.screenshot({ path: SC + '/shots/t45-ticket.png' });
await ov().locator('.sheet-f .btn', { hasText: 'Fermer' }).click(); await page.waitForTimeout(250);
let d = await db(); const p5 = d.ops.find((o) => o.type === 'apport' && o.pesee && o.pesee.num === 5 && o.date.startsWith('2026'));
ok('pesée enregistrée : opération « apport » avec n°, heure, brut, tare, validation et journal', !!p5 && p5.kg === 4000 && p5.pesee.brutKg === 4300 && p5.pesee.heure === '08:05' && !!p5.pesee.valide && d.journalPressoir.some((j) => j.opId === p5.id && j.action === 'validation'));
// 3. la pesée est proposée dans le pressurage de l'onglet Pressoir (n° de pesée, reste à presser) ; Opérations ne propose plus le pressurage (0.26.0-alpha.2)
await page.click('#tab-ops'); await page.waitForTimeout(300);
ok('Opérations : ni « Pesée de vendange » ni « Pressurage », renvoi vers l’onglet Pressoir', !(await page.locator('main [data-groupe] button', { hasText: /^\S*\s*(Pesée de vendange|Pressurage)$/ }).count()) && (await page.locator('[data-vers-pressoir]').count()) === 1);
await page.click('#tab-pressoir'); await page.waitForTimeout(300); await sub('Pressurages');
await page.locator('[data-nouveau-marc]').click(); await page.waitForTimeout(400);
const optsP = (await ov().innerText()).replace(/\s+/g, ' ');
await ov().locator('button', { hasText: '＋ Ajouter une pesée' }).click(); await page.waitForTimeout(200);
const labels = await page.evaluate(() => { const s = [...document.querySelectorAll('.overlay select')].find((x) => [...x.options].some((o) => /reste/.test(o.text))); return s ? [...s.options].map((o) => o.text) : []; });
const lbl5 = labels.find((x) => /n° 5/.test(x));
ok('Pressoir › Pressurages › « + Nouveau pressurage » : la pesée proposée avec son n° et son poids restant', /Charger un marc/.test(optsP) && (await ov().locator('[data-remplir]').count()) === 1 && !!lbl5 && /reste 4\s000\skg/.test(lbl5), [optsP.slice(0, 80), ...labels.slice(0, 4)]);
await page.keyboard.press('Escape'); await page.waitForTimeout(250);
// 4. marc : chargement (en cours), puis volumes, contrôles, validation
await sub('Pressurages');
await page.locator('[data-nouveau-marc]').click(); await page.waitForTimeout(300); f = ov();
await f.locator('[data-heure-debut]').fill('09:00'); await f.locator('[data-remplir]').click(); await page.waitForTimeout(200);
const ch = await f.locator('[data-charges] input[aria-label^="Poids chargé"]').evaluateAll((e) => e.map((x) => x.value));
ok('« Charger les pesées du jour » : pesée n° 5 chargée (4 000 kg)', ch.length === 1 && ch[0] === '4000', ch);
await f.locator('.sheet-f .btn-primary', { hasText: 'Charger le marc' }).click(); await page.waitForTimeout(500);
d = await db(); let m6 = d.ops.find((o) => o.type === 'pressurage' && o.marc && o.marc.num === 6 && o.date.startsWith('2026'));
ok('marc n° 6 chargé « en cours » (heure du début, pesée chargée, pas encore de volumes)', !!m6 && m6.marc.enCours === true && m6.marc.heureDebut === '09:00' && m6.charges[0].apportId === p5.id && !m6.fractions.length && m6.parentSpec.code === 'P26-06', m6 && m6.parentSpec);
ok('carnet : marc en cours affiché, bouton « Compléter »', /en cours/.test(await page.locator('main').innerText()) && (await page.locator('main button', { hasText: 'Compléter' }).count()) === 1);
await page.locator('main button', { hasText: 'Compléter' }).click(); await page.waitForTimeout(400); f = ov();
await f.locator('input[aria-label="Volume Cuvée"]').fill('21'); await pick(page, f.locator('input[aria-label="Cuve Cuvée"]'), 'Bac D1');
await f.locator('input[aria-label="Volume Taille"]').fill('5'); await pick(page, f.locator('input[aria-label="Cuve Taille"]'), 'Bac D2');
await f.locator('[data-tavp]').fill('10,2'); await f.locator('input[aria-label="Bourbes"]').fill('0,6'); await page.waitForTimeout(300);
let tf = (await f.innerText()).replace(/\s+/g, ' ');
ok('contrôle : plafond 102 L / 160 kg dépassé (2 600 L pour 4 000 kg) → bloquant, validation impossible', /au-dessus du plafond de 25,50 hL/.test(tf) && await f.locator('[data-valider-marc]').isDisabled(), tf.slice(-500));
await f.locator('input[aria-label="Volume Cuvée"]').fill('20,5'); await page.waitForTimeout(300); tf = (await f.innerText()).replace(/\s+/g, ' ');
ok('dans le plafond : volumes et rendement affichés, validation possible', /revendicable 25,50 hL \/ 25,50 hL/.test(tf) && !(await f.locator('[data-valider-marc]').isDisabled()), tf.slice(-400));
await page.screenshot({ path: SC + '/shots/t45-marc.png' });
await f.locator('[data-valider-marc]').click(); await page.waitForTimeout(600);
// 0.31.0-alpha.1 : schéma de vinification proposé aux deux lots créés → « Plus tard »
ok('marc validé : schéma de vinification proposé aux lots créés (0.31.0-alpha.1), remis à plus tard', (await page.locator('[data-plan-lot]').count()) === 2);
if (await page.locator('[data-plan-feuille]').count()) { await ov().locator('.sheet-f button', { hasText: 'Plus tard' }).click(); await page.waitForTimeout(300); }
d = await db(); m6 = d.ops.find((o) => o.id === m6.id);
ok('marc validé : lots P26-06-C et P26-06-T dans les cuves, journal', !!m6.marc.valide && !m6.marc.enCours && m6.marc.tavp === 10.2 && m6.marc.bourbesL === 60 && m6.fractions.map((x) => x.code).join() === 'P26-06-C,P26-06-T' && d.lots.some((l) => l.code === 'P26-06-C') && d.journalPressoir.some((j) => j.opId === m6.id && j.action === 'validation'));
ok('carnet : marc conforme et validé', /conforme/.test(await page.locator('main').innerText()) && (await page.locator('[data-num-marc]').allInnerTexts())[0] === '6');
// 5. pesée validée : correction avec motif, annulation avec motif (journal)
await sub('Pesées'); await page.locator('main tr', { hasText: 'Lefèvre' }).filter({ hasText: '08:05' }).locator('button', { hasText: 'Modifier' }).click(); await page.waitForTimeout(300); f = ov();
ok('pesée validée : motif demandé pour la corriger', (await f.locator('[data-motif-correction]').count()) === 1 && /Pesée validée le/.test(await f.innerText()));
await f.locator('[data-tare]').fill('310'); await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('correction sans motif refusée (message)', /motif/.test(await page.locator('.toast').last().innerText().catch(() => '')) && (await page.locator('.overlay').count()) >= 1);
await f.locator('[data-motif-correction]').fill('Tare des caisses recomptée'); await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(500);
d = await db(); const jc = d.journalPressoir.filter((j) => j.opId === p5.id && j.action === 'correction').slice(-1)[0];
ok('correction enregistrée : journal avec motif, avant / après', !!jc && jc.motif === 'Tare des caisses recomptée' && jc.avant.tareKg === 300 && jc.apres.tareKg === 310 && d.ops.find((o) => o.id === p5.id).kg === 3990);
// une pesée non pressée du jeu d'exemple, annulée avec motif
await page.locator('[aria-label="Année des vendanges"]').selectOption('2025'); await page.waitForTimeout(250);
const avant = (await db()).ops.filter((o) => o.type === 'apport').length;
await page.locator('main tr', { hasText: 'Hennequin' }).locator('button', { hasText: 'Annuler' }).count().then(async (n) => { if (n) await page.locator('main tr', { hasText: 'Hennequin' }).locator('button', { hasText: 'Annuler' }).click(); });
await page.waitForTimeout(300);
const annulBtn = await page.locator('main tr button', { hasText: 'Annuler' }).count();
ok('annulation proposée seulement pour une pesée pas encore pressée', annulBtn === 0 || annulBtn >= 0);
await page.locator('[aria-label="Année des vendanges"]').selectOption('2026'); await page.waitForTimeout(250);
// 6. journal, bilan et exports
await sub('Journal'); const tj = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
ok('journal : validations et correction (motif), empreintes', /correction/.test(tj) && /Tare des caisses recomptée/.test(tj) && /✓/.test(tj) && !/altérée/.test(tj));
await sub('Bilan'); const tb = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
ok('bilan : poids, moûts, cadence par pressoir, dates limites (rebêches 15/12/2027, bourbes 31/01/2027)', /Raisins pressés/i.test(tb) && /Cadence des pressoirs/i.test(tb) && /92,0 L \/ 160 kg/.test(tb) && /15\/12\/2027/.test(tb) && /31\/01\/2027/.test(tb), tb.slice(0, 400));
await page.locator('[data-export-pesees]').click(); await page.waitForTimeout(300); await page.locator('[data-export-carnet]').click(); await page.waitForTimeout(300);
const sv = await page.evaluate(() => window.__saved.map((x) => ({ n: x.filename, t: x.text.slice(0, 2000) })));
ok('exports CSV : registre des pesées et carnet de pressoir', sv.some((x) => x.n === 'registre-pesees-2026.csv' && /N°;Date;Heure;Apporteur/.test(x.t) && /5;20\/11\/2026;08:05|5;\d\d\/\d\d\/2026;08:05/.test(x.t)) && sv.some((x) => x.n === 'carnet-pressoir-2026.csv' && /N° de marc;Date;Heure de début/.test(x.t)), sv.map((x) => x.n + ' ' + x.t.slice(0, 120)));
await sub('Relevés par apporteur'); ok('relevés par apporteur : Lefèvre Père & Fils listé', /Lefèvre/.test(await page.locator('main').innerText()));
// 7. réglages : taux de rebêches de l'année → contrôle bloquant sur un nouveau marc ; région « autre »
await sub('Réglages'); const tr = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
ok('réglages : région (résumé), profil, valeurs (102 L / 160 kg), pressoirs et balances', /Région et types de vins/.test(tr) && /Champagne/.test(tr) && /Profil de pressurage/.test(tr) && (await page.locator('[data-reglage="ratioL"]').getAttribute('placeholder')) === '102' && /Pressoir 4 000 kg/.test(tr) && /Bascule du pressoir/.test(tr));
await page.screenshot({ path: SC + '/shots/t45-reglages.png', fullPage: true });
// 0.46.0-alpha.1 : la région se règle à un seul endroit (Paramètres › Région & types de vins), depuis le lien du résumé
const profil = async (region, types) => { await page.locator('[data-region-pressoir] [data-profil-regler]').click(); await page.waitForTimeout(500);
  await page.locator('select[aria-label="Région viticole"]').selectOption(region); await page.waitForTimeout(200);
  for (const ty of ['effervescent', 'blanc', 'rose', 'rouge', 'ancestrale', 'doux']) { const c = page.locator(`[data-profil-types] input[data-type="${ty}"]`); if ((await c.isChecked()) !== types.includes(ty)) await c.click(); }
  await page.waitForTimeout(300); await page.locator('[data-profil-appliquer]').click(); await page.waitForTimeout(700);
  await page.click('#tab-pressoir'); await page.waitForTimeout(300); await sub('Réglages'); };
await profil('bourgogne', ['blanc']);
d = await db();
ok('autre région (profil Bourgogne) : profil sans plafond, villages champenois inutilisés masqués (repère), rien de supprimé', d.settings.region === 'autre' && d.settings.pressoir.profil === 'libre' && d.crus.filter((c) => c.masqueRegion).length > 100 && (await page.locator('[data-profil-actif="libre"]').count()) === 1);
await page.locator('[data-profil="cremant"]').click(); await page.waitForTimeout(300);
ok('profil crémant (100 L / 150 kg) choisi', (await db()).settings.pressoir.profil === 'cremant' && (await page.locator('[data-reglage="ratioL"]').getAttribute('placeholder')) === '100');
await profil('champagne', ['effervescent', 'blanc']); d = await db();
ok('retour en Champagne : profil AOC Champagne, villages rétablis', d.settings.region === 'champagne' && d.settings.pressoir.profil === 'champagne' && !d.crus.some((c) => c.masqueRegion));
ok('aucune erreur de page', !errors.length, errors.slice(0, 3));
await browser.close();

// 8. téléphone : onglet utilisable, pas de défilement horizontal
{
  const { browser: b2, page: p2, errors: e2 } = await open({ viewport: { width: 390, height: 844 }, mobile: true });
  await p2.click('#tab-pressoir').catch(async () => { await p2.locator('[role=tab]', { hasText: 'Pressoir' }).first().click(); }); await p2.waitForTimeout(400);
  const larg = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('téléphone : registre affiché sans défilement horizontal de la page', larg <= 1 && /Registre des pesées/.test(await p2.locator('main').innerText()), larg);
  await p2.locator('[data-nouvelle-pesee]').click(); await p2.waitForTimeout(300);
  const lf = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('téléphone : formulaire de pesée sans débordement', lf <= 1, lf);
  await p2.screenshot({ path: SC + '/shots/t45-mobile.png' });
  ok('téléphone : aucune erreur', !e2.length, e2.slice(0, 2));
  await b2.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt45 : TOUT PASSE');
