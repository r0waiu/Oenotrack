// 0.27.0-alpha.1 : fichier de traçabilité des expéditions vers un partenaire — export depuis le journal (données choisies : le minimum,
// le choix conseillé), import à l'entrée de vin (formulaire prérempli, traçabilité d'avant la réception gardée : 📥, fiche du lot),
// fichier modifié signalé, fichiers piégés refusés, proposition après une nouvelle vente en vrac ; anglais. Données fictives (jeu d'exemple).
import { open, pick } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); const FX = `${SC}/trace27`; fs.mkdirSync(FX, { recursive: true }); fs.mkdirSync(`${SC}/shots`, { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const init = () => { window.__saved = []; const downloads = { save: async ({ filename, data }) => { const text = typeof data === 'string' ? data : await data.text(); window.__saved.push({ filename, text }); return { status: 'saved' }; } }; window.claude = { use: async (n) => (n === 'downloads' ? downloads : null) }; };
const { browser, page, errors } = await open({ init, date: '2026-11-21T10:00:00' });
const top = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const toasts = async () => page.locator('.toast').allInnerTexts();
// raison sociale de l'expéditeur (fictive)
await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); d.entreprise = { ...(d.entreprise || {}), nom: 'Maison Démo Expéditrice', adresse: '1 rue des Essais, 51000 Exemple' }; localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); });
await page.reload(); await page.waitForTimeout(1200);
// 1. export : le minimum
await page.click('#tab-ops'); await page.waitForTimeout(500);
const d0 = await db(); const opId = await page.locator('[data-trace-export-btn]').first().getAttribute('data-trace-export-btn'); const op = d0.ops.find((o) => o.id === opId);
ok('journal : 📤 sur les expéditions vers un partenaire seulement (jamais une perte)', (await page.locator('[data-trace-export-btn]').count()) >= 1 && op && op.type === 'sortie' && op.sousType !== 'perte' && (await page.evaluate(() => [...document.querySelectorAll('[data-trace-export-btn]')].map((b) => b.getAttribute('data-trace-export-btn')))).every((id) => { const o = d0.ops.find((x) => x.id === id); return o && o.type === 'sortie' && (o.sousType || '') !== 'perte'; }));
await page.locator(`[data-trace-export-btn="${opId}"]:visible`).first().click(); await page.waitForTimeout(600);
const ex = await txt(page.locator('[data-trace-export]'));
ok('fenêtre d’export : données à choisir, jamais les opérateurs ; aperçu', /jamais les opérateurs/.test(ex) && /Noms des cuves dans l’historique/.test(ex) && /Aperçu du fichier/.test(ex) && (await page.locator('[data-trace-export] input[type=checkbox]').count()) === 10, ex.slice(0, 600));
const coches = await page.locator('[data-trace-export] input[type=checkbox]').evaluateAll((L) => L.map((x) => x.checked));
ok('choix conseillé par défaut : apporteurs, parcelles et noms des cuves non partagés', JSON.stringify(coches) === JSON.stringify([true, true, true, false, false, true, true, true, false, true]), coches);
await page.locator('[data-trace-export] button', { hasText: 'Le minimum (produit et expédition)' }).click(); await page.waitForTimeout(300);
await top().locator('button', { hasText: 'Télécharger le fichier' }).click(); await page.waitForTimeout(900);
const T1 = await toasts(); let S = await page.evaluate(() => window.__saved);
const m = S[0] ? JSON.parse(S[0].text) : {};
const opNoms = (d0.operateurs || []).map((o) => o.nom).filter((n) => n && n.length > 2);
ok('le minimum : produit et expédition seulement (volume en litres, DAE), sans opérateurs', S.length === 1 && m.format === 'oenotrack-tracabilite' && m.produit && m.expedition && m.expedition.volumeL === op.volL && Array.isArray(m.sections) && !m.sections.length && !m.composition && !m.crus && !m.historique && !m.intrants && !m.analyses && !m.expediteur && !m.apporteurs && !opNoms.some((n) => S[0].text.includes(n)) && /^[0-9a-f]{64}$/.test(m.empreinte || ''), [S.length, Object.keys(m), m.expedition, op.volL]);
ok('… fichier annoncé, 📤 marqué ✓', T1.some((x) => /Fichier de traçabilité enregistré : tracabilite-.*\.json/.test(x)) && /✓/.test(await page.locator(`[data-trace-export-btn="${opId}"]:visible`).first().innerText()), T1);
// 2. export : choix conseillé, mémorisé sur l'appareil
await page.locator(`[data-trace-export-btn="${opId}"]:visible`).first().click(); await page.waitForTimeout(600);
ok('déjà exporté : date du dernier fichier rappelée ; « le minimum » mémorisé', /Dernier fichier exporté pour cette expédition le 21\/11\/2026 à 10:00\./.test(await txt(page.locator('[data-trace-export]'))) && (await page.locator('[data-trace-export] input[type=checkbox]:checked').count()) === 0);
await page.locator('[data-trace-export] button', { hasText: 'Choix conseillé' }).click(); await page.waitForTimeout(300);
const apercu = await txt(page.locator('[data-trace-export] [data-trace-amont]').first());
ok('aperçu : expéditeur, composition et historique ; ni apporteurs ni parcelles', /Maison Démo Expéditrice/.test(apercu) && /Cépages/.test(apercu) && /Historique \(\d+ opérations\)/i.test(apercu) && !/Apporteurs|Parcelles/.test(apercu), apercu.slice(0, 700));
await top().locator('button', { hasText: 'Télécharger le fichier' }).click(); await page.waitForTimeout(900);
S = await page.evaluate(() => window.__saved); const c = S[1] ? JSON.parse(S[1].text) : {};
ok('choix conseillé : composition, crus, historique (sans noms de cuves), expéditeur ; ni apporteurs ni parcelles', c.composition && c.crus && (c.historique || []).length && c.historique.every((h) => !h.contenants || !h.contenants.length) && c.expediteur && c.expediteur.nom === 'Maison Démo Expéditrice' && !c.apporteurs && !c.parcelles && c.sections.length === 7 && !opNoms.some((n) => S[1].text.includes(n)), Object.keys(c));
ok('… choix gardé sur l’appareil', await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-trace-sections')).length === 7));
fs.writeFileSync(`${FX}/recu.json`, S[1].text);
const mod = JSON.parse(S[1].text); mod.produit.designation += ' (retouché)'; fs.writeFileSync(`${FX}/recu-modifie.json`, JSON.stringify(mod));
fs.writeFileSync(`${FX}/page.json`, '<!doctype html><html><body><script>parent.__piege = 1</script></body></html>');
fs.writeFileSync(`${FX}/autre.json`, JSON.stringify({ format: 'autre-chose', donnees: [1, 2, 3] }));
// 3. réception : entrée de vin avec le fichier de l'expéditeur
await page.locator('[data-groupe] button', { hasText: /Entrée de vin/ }).first().click(); await page.waitForTimeout(600);
await top().locator('input[aria-label="Fichier de traçabilité de l’expéditeur"]').setInputFiles(`${FX}/recu.json`); await page.waitForTimeout(1500);
const im = await txt(page.locator('[data-trace-import]')); const T3 = await toasts();
ok('fichier repris : intact, produit et expéditeur affichés ; partenaire à créer signalé', /✓ fichier intact/.test(im) && /Maison Démo Expéditrice/.test(im) && new RegExp(c.produit.designation.replace(/[()]/g, '.')).test(im) && /Non trouvé chez vous : partenaire « Maison Démo Expéditrice »/.test(await txt(top())) && T3.some((x) => /Fichier de traçabilité repris/.test(x)), [im.slice(0, 500), T3]);
const vals = await top().locator('input').evaluateAll((L) => L.filter((x) => x.type !== 'checkbox' && x.type !== 'file').map((x) => x.value));
ok('formulaire prérempli : désignation, millésime, volume reçu (hL)', vals.includes(c.produit.designation) && vals.includes(String(c.produit.millesime)) && vals.some((v) => v.replace(',', '.') === String(c.expedition.volumeL / 100)), vals.slice(0, 12));
// expéditeur inconnu chez le receveur : partenaire créé d'un clic (nom et adresse du fichier), choisi dans le formulaire
await page.locator('[data-trace-creer-partenaire]').click(); await page.waitForTimeout(500);
const pf = page.locator('.overlay').last(); const pfv = await pf.locator('input:not([type]), input[type=text], textarea').evaluateAll((L) => L.map((x) => x.value));
const vend = await pf.locator('label', { hasText: 'Vendeur de vins' }).locator('input[type=checkbox]').isChecked().catch(() => null);
ok('« Créer le partenaire » : nom et adresse repris, rôle vendeur de vins', pfv.includes('Maison Démo Expéditrice') && pfv.some((v) => /1 rue des Essais, 51000 Exemple/.test(v)) && vend === true, [pfv, vend]);
await pf.locator('button', { hasText: /^Enregistrer$/ }).click(); await page.waitForTimeout(600);
const dP = await db(); const part = (dP.apporteurs || []).find((x) => x.nom === 'Maison Démo Expéditrice');
ok('… partenaire créé et choisi ; plus signalé comme manquant', part && part.vendeur && (await top().locator('input[aria-label="Partenaire"]').inputValue()) === 'Maison Démo Expéditrice' && !/Non trouvé chez vous : partenaire/.test(await txt(top())) && (await page.locator('[data-trace-creer-partenaire]').count()) === 0, [part, await top().locator('input[aria-label="Partenaire"]').inputValue()]);
// fichier modifié après l'export : accepté mais signalé ; fichiers piégés refusés
await top().locator('input[aria-label="Fichier de traçabilité de l’expéditeur"]').setInputFiles(`${FX}/recu-modifie.json`); await page.waitForTimeout(1200);
ok('fichier modifié après l’export : gardé à part et signalé (le fichier intact reste)', /⚠ fichier modifié après l’export/.test(await txt(page.locator('[data-trace-import]'))) && /✓ fichier intact/.test(await txt(page.locator('[data-trace-import]'))) && (await page.locator('[data-trace-import] [data-trace-amont]').count()) === 2);
await page.locator('[data-trace-import] button', { hasText: 'Retirer ce fichier' }).last().click(); await page.waitForTimeout(300);
await top().locator('input[aria-label="Fichier de traçabilité de l’expéditeur"]').setInputFiles(`${FX}/page.json`); await page.waitForTimeout(1200); const T4a = await toasts();
await top().locator('input[aria-label="Fichier de traçabilité de l’expéditeur"]').setInputFiles(`${FX}/autre.json`); await page.waitForTimeout(1200);
const T4 = [...T4a, ...(await toasts())].join(' | ');
ok('page web déguisée en .json refusée ; autre fichier JSON refusé', /« page\.json » refusé : contenu réel : page web \(HTML\)/.test(T4) && /🛡 « autre\.json » : /.test(T4) && !(await page.evaluate(() => window.__piege)), T4);
ok('… un seul fichier gardé avec l’entrée', (await page.locator('[data-trace-import] [data-trace-amont]').count()) === 1);
// contenant vide, code du lot, validation
const vide = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const R = getR(d); return d.contenants.filter((x) => x.statut !== 'archive' && !Object.values(R.portions).some((p) => p.contenantId === x.id && p.vol > 0.001) && Number(x.volMax) >= 1500).sort((a, b) => Number(b.volMax) - Number(a.volMax)).map((x) => x.nom)[0]; });
await top().getByLabel('Code du lot', { exact: true }).fill('RV-T53');
await pick(page, top().locator('input[placeholder="Contenant…"]'), vide, vide);
await top().locator('button', { hasText: '✓ Valider' }).click(); await page.waitForTimeout(1000);
const d1 = await db(); const rec = d1.ops.find((o) => o.type === 'reprise' && (o.amont || []).length && o.date === '2026-11-21');
ok('entrée enregistrée avec la traçabilité amont (fichier intact, empreinte gardée), rattachée au partenaire', rec && rec.apporteurId === (part || {}).id && rec.amont.length === 1 && rec.amont[0].integre === true && rec.amont[0].empreinte === c.empreinte && rec.amont[0].fichier === 'recu.json' && rec.amont[0].produit && rec.amont[0].produit.designation === c.produit.designation, rec ? rec.amont : (await toasts()));
const J = (d1.gardeJournal || []).map((e) => `${e.nom}:${e.statut}:${e.usage}`);
ok('journal de sécurité : refus et fichier modifié notés (fichiers de traçabilité)', J.includes('page.json:refuse:tracabilite') && J.includes('autre.json:refuse:tracabilite') && J.includes('recu-modifie.json:averti:tracabilite'), J);
// 4. 📥 dans le journal, fiche du lot
if (rec) {
  await page.locator(`[data-trace-amont-btn="${rec.id}"]:visible`).first().click(); await page.waitForTimeout(600);
  const am = await txt(top());
  ok('📥 : traçabilité d’avant la réception affichée (fichier intact, reçu le…)', /📥 Traçabilité amont \(avant la réception\)/.test(am) && /✓ fichier intact/.test(am) && /Fichier « recu\.json » reçu le 21\/11\/2026 à 10:00\./.test(am) && /Données partagées par l’expéditeur : Expéditeur, Composition, Origine/.test(am), am.slice(0, 900));
  await page.screenshot({ path: `${SC}/shots/t53-amont.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await page.locator('main .linkish:visible', { hasText: 'RV-T53' }).first().click(); await page.waitForTimeout(700);
  const fl = await txt(top());
  ok('fiche du lot : traçabilité amont (avant réception)', /📥 Traçabilité amont \(avant réception\) — 1/.test(fl) && /Maison Démo Expéditrice/.test(fl), fl.slice(0, 400));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
}
// 5. nouvelle vente en vrac : le fichier est proposé
const S0 = await page.evaluate(() => window.__saved.length);
await page.locator('[data-groupe] button', { hasText: /Vente de vin en vrac/ }).first().click(); await page.waitForTimeout(600);
const combos = top().locator('input[role=combobox]'); await pick(page, combos.nth(0), 'RV-T53', 'RV-T53'); await page.waitForTimeout(200);
await top().getByLabel('Destinataire (acheteur, distillerie…)', { exact: true }).fill('Négoce Exemple');
await top().locator('input[inputmode=decimal]').first().fill('2'); await page.waitForTimeout(200);
await top().locator('button', { hasText: '✓ Valider' }).click(); await page.waitForTimeout(1000);
const se = (await page.locator('[data-suite-expedition]').count()) ? await txt(page.locator('[data-suite-expedition]')) : '';
ok('après une vente en vrac : fichier de traçabilité proposé', /📤 Expédition enregistrée/.test(se) && /Fichier de traçabilité pour Négoce Exemple \(2,00 hL, 21\/11\/2026\)/.test(se), [se, await toasts()]);
await page.locator('[data-suite-expedition] button', { hasText: 'Préparer le fichier' }).click(); await page.waitForTimeout(700);
ok('… « Préparer le fichier » ouvre l’export ; la traçabilité reçue de l’expéditeur est transmise (amont)', (await page.locator('[data-trace-export]').count()) === 1 && /Avant l’expéditeur \(1\)/i.test(await txt(page.locator('[data-trace-export]'))) && /Historique \(1 opération\)/i.test(await txt(page.locator('[data-trace-export]'))), (await txt(page.locator('[data-trace-export]'))).slice(-600));
await top().locator('button', { hasText: 'Télécharger le fichier' }).click(); await page.waitForTimeout(900);
S = await page.evaluate(() => window.__saved); const r2 = S[S0] ? JSON.parse(S[S0].text) : {};
ok('réexpédition : le fichier contient la traçabilité amont reçue (chaîne gardée)', (r2.amont || []).length === 1 && r2.amont[0].produit.designation === c.produit.designation && r2.expedition.destinataire === 'Négoce Exemple', Object.keys(r2));
ok('la proposition disparaît une fois le fichier préparé', (await page.locator('[data-suite-expedition]').count()) === 0);
// 6. anglais
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1200);
await page.click('#tab-ops'); await page.waitForTimeout(500);
await page.locator(`[data-trace-export-btn="${opId}"]:visible`).first().click(); await page.waitForTimeout(600);
const en = await txt(top());
ok('anglais : fenêtre d’export traduite', /📤 Traceability file for the recipient/.test(en) && /never the operators/.test(en) && /Recommended choice/.test(en) && /Last file exported for this shipment on 21\/11\/2026 at 10:00\./.test(en) && /Download the file/.test(en), en.slice(0, 900));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
if (rec) { await page.locator(`[data-trace-amont-btn="${rec.id}"]:visible`).first().click(); await page.waitForTimeout(600); const ea = await txt(top());
  ok('anglais : traçabilité amont traduite', /📥 Upstream traceability \(before reception\)/.test(ea) && /✓ file intact/.test(ea) && /File “recu\.json” received on 21\/11\/2026 at 10:00\./.test(ea), ea.slice(0, 700)); }
ok('aucune erreur', !errors.length, errors);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nERREURS: aucune');
process.exit(ko ? 1 : 0);
