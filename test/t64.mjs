// 0.31.0-alpha.1 : impressions au choix — logigramme vertical, frise ou tableau — pour un schéma de vinification, les opérations prévues
// d'un lot, le plan de nettoyage et de désinfection et le plan de maintenance : forme gardée sur l'appareil, impression (portrait, frise en
// paysage), page web (styles des formes inclus) ; anglais ; téléphone. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 600) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const init = () => {
  window.__saved = []; window.__imp = [];
  window.claude = { use: async (n) => (n === 'downloads' ? { save: async ({ filename, data }) => { const text = typeof data === 'string' ? data : await data.text(); window.__saved.push({ filename, text }); return { status: 'saved' }; } } : null) };
  window.print = () => { window.dispatchEvent(new Event('beforeprint')); const z = document.getElementById('zone-impression'); window.__imp.push({ texte: z ? z.textContent.replace(/\s+/g, ' ').slice(0, 3000) : '', orientation: z ? z.dataset.orientation || '' : '' }); window.dispatchEvent(new Event('afterprint')); };
};
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-21T10:00:00' });
const ov = () => page.locator('.overlay').last();
const sous = async (t) => { await page.locator('main [role=tab]', { hasText: t }).first().click(); await page.waitForTimeout(350); };
const fermer = async () => { for (let i = 0; i < 5 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
const forme = async (f) => { await ov().locator(`[data-forme="${f}"]`).click(); await page.waitForTimeout(300); };
const etat = () => page.evaluate(() => ({ imp: window.__imp, saved: window.__saved }));
const vide = () => page.evaluate(() => { window.__imp = []; window.__saved = []; });

// 1. schéma type (Paramètres › Schémas de vinification) : logigramme par défaut, frise par jour, tableau ; forme gardée
await page.click('#tab-params'); await page.waitForTimeout(400); await sous('Schémas de vinification');
await page.locator('[data-schemas] tbody tr', { hasText: 'Cuvée de Chardonnay, raisins sains' }).locator('button', { hasText: '🖨 Imprimer…' }).click(); await page.waitForTimeout(500);
let t = await txt(ov());
ok('impression d’un schéma : choix « ⇣ Logigramme », « ⟶ Frise », « ▦ Tableau » ; logigramme par défaut', (await ov().locator('[data-forme-choix] [data-forme]').count()) === 3 && (await ov().locator('[data-impression-visuelle="logigramme"] [data-vis="logigramme"]').count()) === 1 && /Choisissez la forme : logigramme vertical, frise ou tableau\./.test(t));
ok('… logigramme : une boîte par étape (10), reliées par des flèches, J+n, opération, famille et dose, consigne', (await ov().locator('[data-vis="logigramme"] .vis-boite').count()) === 10 && (await ov().locator('[data-vis="logigramme"] .vis-fleche').count()) === 9 && /J\+0/.test(t) && /Sulfitage/.test(t) && /5 g\/hL de SO₂/.test(t) && /écoulement des jus/.test(t) && /Pour : Chardonnay · Cuvée · Sain/.test(t), t.slice(0, 500));
await page.screenshot({ path: SC + '/shots/t64-logigramme.png' });
await forme('frise'); t = await txt(ov().locator('[data-vis="frise"]'));
ok('… frise : un jalon par jour (J+0, J+1, J+3, J+4, J+6, J+9, J+12, J+15), les étapes du jour dessous', (await ov().locator('[data-vis="frise"] .vis-fcol').count()) === 8 && (await ov().locator('[data-vis="frise"] .vis-fh').allInnerTexts()).join() === 'J+0,J+1,J+3,J+4,J+6,J+9,J+12,J+15' && (await ov().locator('[data-vis="frise"] .vis-boite').count()) === 10, t.slice(0, 300));
await page.screenshot({ path: SC + '/shots/t64-frise.png' });
await vide(); await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1500);
let e = await etat();
ok('… « 🖨 Imprimer » la frise : en paysage, le document seul', e.imp.length === 1 && e.imp[0].orientation === 'paysage' && /Cuvée de Chardonnay, raisins sains/.test(e.imp[0].texte) && /J\+15/.test(e.imp[0].texte), e.imp);
await forme('tableau');
ok('… tableau : une ligne par étape (jour, opération, famille, dose, consignes)', (await ov().locator('[data-vis="tableau"] tbody tr').count()) === 10 && /Jour Opération Famille de produit Dose Consignes/i.test(await txt(ov().locator('[data-vis="tableau"] thead'))));
await vide(); await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1500); e = await etat();
ok('… « 🖨 Imprimer » le tableau : en portrait', e.imp.length === 1 && e.imp[0].orientation === 'portrait', e.imp);
await forme('logigramme'); await vide(); await ov().locator('button', { hasText: '⬇ HTML' }).click(); await page.waitForTimeout(800); e = await etat();
ok('… « ⬇ HTML » : page web du logigramme, avec les styles des boîtes et des flèches', e.saved.length === 1 && /^schema-.*-logigramme\.html$/.test(e.saved[0].filename) && /\.vis-boite/.test(e.saved[0].text) && /data-vis="logigramme"/.test(e.saved[0].text), e.saved.map((x) => x.filename));
await forme('frise'); await fermer();
ok('forme gardée sur l’appareil (par document)', await page.evaluate(() => localStorage.getItem('oenotrack-forme-schema')) === 'frise');
await page.locator('[data-schemas] tbody tr', { hasText: 'Tailles, raisins sains' }).locator('button', { hasText: '🖨 Imprimer…' }).click(); await page.waitForTimeout(500);
ok('… rouverte : frise directement', (await ov().locator('[data-impression-visuelle="frise"]').count()) === 1);
await fermer();
// 2. opérations prévues d'un lot (avec dates, quantités et colonne visa) : depuis la feuille de proposition
await page.click('#tab-cuverie'); await page.waitForTimeout(400); await sous('Cartes');
await page.locator('.tankcard', { hasText: 'Bac T' }).first().click(); await page.waitForTimeout(500);
await ov().locator('[data-rubrique=lots] table .linkish').first().click(); await page.waitForTimeout(600);
await ov().locator('[data-schema-bloc] button', { hasText: '📋 Appliquer un schéma…' }).click(); await page.waitForTimeout(600);
await page.locator('[data-schema-lot] button', { hasText: '🖨 Imprimer…' }).first().click(); await page.waitForTimeout(500);
await forme('tableau'); t = await txt(ov().locator('[data-vis="tableau"]'));
ok('lot : tableau des opérations prévues (jour, date, opération, produit, dose, quantité, consignes, « Fait le / visa »)', /Jour Date Opération Produit Dose Quantité Consignes Fait le \/ visa/i.test(t) && /\d+,\d{2} g/.test(t) && /\d{2}\/\d{2}\/20\d{2}/.test(t), t.slice(0, 400));
await forme('logigramme'); t = await txt(ov().locator('[data-vis="logigramme"]'));
ok('… logigramme du lot : « J+n · date » en tête de chaque boîte, produit et quantité', /J\+0 · \d{2}\/\d{2}\/20\d{2}/.test(t) && /\d+,\d{2} g/.test(t), t.slice(0, 300));
await fermer();
// 3. plan de nettoyage et de désinfection : tableau par défaut, logigramme par équipement, frise par moment de l'année
await page.click('#tab-hygiene'); await page.waitForTimeout(400); await sous('Plan de nettoyage');
const nLignes = await page.locator('[data-plan-ligne]').count();
await page.locator('main button', { hasText: '🖨 Imprimer le plan' }).click(); await page.waitForTimeout(500);
t = await txt(ov());
ok('plan de nettoyage : tableau par défaut (comme avant), « À imprimer pour le classeur qualité (HACCP) », mis en place le…', (await ov().locator('[data-plan-impression][data-impression-visuelle="tableau"] table').count()) >= 1 && /À imprimer pour le classeur qualité \(HACCP\)/.test(t) && /Mis en place le \d{2}\/\d{2}\/2026/.test(t) && !/édité le \d{2}\/\d{2}\/2026 · édité le/.test(t) && /Temps de contact/i.test(t), t.slice(0, 300));
await forme('logigramme'); t = await txt(ov().locator('[data-plan-impression]'));
ok('… logigramme : une colonne par ligne active du plan (quand → action → consignes → contrôle → enregistrement)', (await ov().locator('[data-plan-impression] .vis-col').count()) === nLignes && /Quand/i.test(t) && /Contrôle/i.test(t) && /Enregistrement/i.test(t) && /temps de contact :/.test(t), [nLignes, await ov().locator('[data-plan-impression] .vis-col').count()]);
await forme('frise'); const hP = await ov().locator('[data-plan-impression] .vis-fh').allInnerTexts();
ok('… frise : les moments dans l’ordre de l’année de vinification (avant les vendanges, soir de vendanges… après le tirage)', hP[0] === 'Avant les vendanges' && hP.indexOf('Soir de vendanges') === 1 && hP.indexOf('Après les vendanges') > hP.indexOf('Périodique') && hP.indexOf('Après le tirage') > hP.indexOf('Après les vendanges'), hP);
await page.screenshot({ path: SC + '/shots/t64-plan-frise.png' });
await fermer();
// 4. plan de maintenance (onglet Équipements) : frise des échéances sur douze mois, en retard d'abord
await page.click('#tab-equipements'); await page.waitForTimeout(400); await sous('Maintenance');
await page.locator('main button', { hasText: '🖨 Imprimer le plan' }).click(); await page.waitForTimeout(500);
ok('plan de maintenance : tableau par défaut (matériel, type, fréquence, dernière, prochaine)', (await ov().locator('[data-plan-impression][data-impression-visuelle="tableau"]').count()) === 1 && /Plan de maintenance du matériel/.test(await txt(ov())));
await forme('frise'); const hM = await ov().locator('[data-plan-impression] .vis-fh').allInnerTexts(); const colR = ov().locator('[data-plan-impression] .vis-fcol').first();
ok('… frise : « En retard » d’abord (pompes à vin, 12/11/2026), puis douze mois (nov. 2026…), « Plus tard ou sans échéance » à la fin', hM[0] === 'En retard' && /Pompes à vin/.test(await txt(colR)) && /nov\.? 2026/i.test(hM[1]) && hM.length === 14 && hM[13] === 'Plus tard ou sans échéance', hM);
await forme('logigramme'); t = await txt(ov().locator('[data-plan-impression]'));
ok('… logigramme : type et fréquence, interventions, intervenant, enregistrement (dernière, prochaine)', /Type et fréquence/i.test(t) && /Interventions/i.test(t) && /Intervenant/i.test(t) && /prochaine : \d{2}\/\d{2}\/20\d{2}/.test(t), t.slice(0, 300));
await fermer();
// 5. anglais
await page.locator('footer [data-langue]').selectOption('en'); await page.waitForTimeout(400);
await page.click('#tab-params'); await page.waitForTimeout(400); await sous('Winemaking protocols');
await page.locator('[data-schemas] tbody tr').first().locator('button', { hasText: 'Print' }).click(); await page.waitForTimeout(500);
await forme('logigramme'); t = await txt(ov());
ok('anglais : choix des formes, logigramme (D+n, opérations, consignes) traduits', /⇣ Flowchart/.test(t) && /⟶ Timeline/.test(t) && /▦ Table/.test(t) && /Choose the layout: vertical flowchart, timeline or table\./.test(t) && /D\+0/.test(t) && /as the juice runs off/.test(t) && /For: Chardonnay · Cuvée · Healthy/.test(t) && !/J\+|Choisissez|Logigramme|Consigne/.test(t), t.slice(0, 600));
await forme('frise'); ok('anglais : frise (D+n)', (await ov().locator('[data-vis="frise"] .vis-fh').allInnerTexts()).join() === 'D+0,D+1,D+3,D+4,D+6,D+9,D+12,D+15');
await fermer();
await page.click('#tab-hygiene'); await page.waitForTimeout(400); await sous('Cleaning plan');
await page.locator('main button', { hasText: 'Print the plan' }).click(); await page.waitForTimeout(500); await forme('frise');
const hE = await ov().locator('[data-plan-impression] .vis-fh').allInnerTexts(); t = await txt(ov());
ok('anglais : frise du plan de nettoyage (moments) traduite', hE[0] === 'Before the harvest' && hE.includes('Harvest evening') && hE.includes('Periodic') && /Started on \d{2}\/\d{2}\/2026/.test(t) && !/Avant les|Périodique|Mis en place/.test(t), [hE, t.slice(0, 200)]);
await fermer();
await page.click('#tab-equipements'); await page.waitForTimeout(400); await sous('Maintenance');
await page.locator('main button', { hasText: 'Print the plan' }).click(); await page.waitForTimeout(500); await forme('frise');
const hME = await ov().locator('[data-plan-impression] .vis-fh').allInnerTexts();
ok('anglais : frise de maintenance (en retard, mois, plus tard) traduite', hME[0] === 'Overdue' && /Nov 2026/.test(hME[1]) && hME[13] === 'Later or no due date', hME);
await forme('logigramme'); t = await txt(ov().locator('[data-plan-impression]'));
ok('anglais : logigramme de maintenance traduit', /Type and frequency/i.test(t) && /next: \d{2}\/\d{2}\/20\d{2}/.test(t) && !/prochaine|Intervenant|Type et/.test(t), t.slice(0, 300));
await fermer();
await page.locator('footer [data-langue]').selectOption('fr'); await page.waitForTimeout(300);
ok('aucune erreur', !errors.length, errors.slice(0, 3));
await browser.close();
// 6. téléphone : feuille d'impression sans débordement de la page
{
  const { browser: b2, page: p2, errors: e2 } = await open({ init, viewport: { width: 390, height: 844 }, mobile: true, date: '2026-11-21T10:00:00' });
  await p2.click('#tab-params').catch(() => {}); await p2.waitForTimeout(400);
  const sel = p2.locator('main select').first(); const opts = await sel.locator('option').allInnerTexts().catch(() => []);
  if (opts.some((x) => /Schémas de vinification/.test(x))) await sel.selectOption({ label: opts.find((x) => /Schémas de vinification/.test(x)) }); else await p2.locator('main [role=tab]', { hasText: 'Schémas de vinification' }).first().click();
  await p2.waitForTimeout(400);
  await p2.locator('[data-schemas] button', { hasText: '🖨 Imprimer…' }).first().click(); await p2.waitForTimeout(500);
  for (const f of ['logigramme', 'frise', 'tableau']) { await p2.locator('.overlay').last().locator(`[data-forme="${f}"]`).click(); await p2.waitForTimeout(250); }
  const deb = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('téléphone : formes au choix, la page ne déborde pas (le document défile dans sa feuille)', deb <= 1 && (await p2.locator('[data-impression-visuelle="tableau"]').count()) === 1, deb);
  await p2.screenshot({ path: SC + '/shots/t64-telephone.png' });
  ok('téléphone : aucune erreur', !e2.length, e2.slice(0, 3));
  await b2.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nt64 : TOUT PASSE');
process.exitCode = ko ? 1 : 0;
