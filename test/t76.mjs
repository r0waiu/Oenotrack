// 0.40.0-alpha.1 : référentiel réglementaire des intrants (matrice, revendications → labels, corrections), sous-onglets « Produits & règles
// par revendication » et « Revendications & plafonds » liés (synthèse commune, « Aligner »), composés actifs de la fiche du produit,
// alerte à la saisie (motif exigé), alerte persistante sur le lot (labels visés) et dans Traçabilité › Conformité réglementaire.
// Données fictives (base de test 0.40.0-alpha.1).
import { open, pick } from './ui.mjs'; import fs from 'fs'; import path from 'path';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db0 = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures', 'base-0.40.0-alpha.1-referentiel.json'), 'utf8'));
db0.settings.securite = { ...db0.settings.securite, actif: false };
const lotV = db0.lots.find((l) => Array.isArray(l.labelsVises)); const so = db0.produits.find((p) => /Sorbate de potassium \(fictif\)/.test(p.nom));
const init = { content: `if (!sessionStorage.getItem('semee')) { localStorage.setItem('oenotrack-db-v2', ${JSON.stringify(JSON.stringify(db0))}); sessionStorage.setItem('semee', '1'); } window.print = () => {};` };
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 } });
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const ov = () => page.locator('.overlay').last();
const choisir = async (loc, label, tape) => { const el = loc.first(); if ((await el.evaluate((e) => e.tagName)) === 'SELECT') await el.selectOption({ label }); else await pick(page, el, tape || label, label); await page.waitForTimeout(250); };
const sous = async (lib) => { await page.locator('button', { hasText: lib }).first().click(); await page.waitForTimeout(400); };

// ---- 1. Intrants › Référentiel réglementaire
await page.click('#tab-intrants'); await page.waitForTimeout(400);
await sous('⚖ Labels & cahiers des charges'); await page.locator('[data-labels-vue="revendications"]').click(); await page.waitForTimeout(300);
let t = await txt(page.locator('[data-referentiel]'));
ok('référentiel : avertissement « valeurs d’exemple à vérifier », appellation du vignoble (AOC Champagne)', /à vérifier/i.test(t) && /AOC Champagne/.test(t));
await page.locator('[data-labels-vue="substances"]').click(); await page.waitForTimeout(400);
const nCols = await page.locator('[data-ref-matrice] thead th').count(); const nLignes = await page.locator('[data-ref-matrice] tbody tr').count();
ok('… matrice composés × 9 référentiels (UE, AOC, BIO, DEM, BDV, TV, N&P, VMN, SAINS)', nCols === 10 && nLignes >= 40, { nCols, nLignes });
const cPv = await txt(page.locator('[data-ref-cellule="bio-ue|pvpp"]')); const cSo = await txt(page.locator('[data-ref-cellule="ue|sorbate"]'));
ok('… PVPP interdite en Bio UE ; sorbate en UE : teneur max corrigée par l’exploitation (150 mg/L, « corrigé »)', /interdit/i.test(cPv) && /150 mg\/L/.test(cSo) && /corrigé/i.test(cSo), [cPv, cSo]);
await page.locator('[data-labels-vue="revendications"]').click(); await page.waitForTimeout(300);
const rev = await txt(page.locator('[data-ref-revendications]'));
ok('… revendications : Demeter → Demeter + S.A.I.N.S. (choisis), FR-BIO-01 → Bio UE (deviné)', /Vins S\.A\.I\.N\.S\./.test(rev) && /Bio européen/.test(rev), rev.slice(0, 300));
// correction d'une valeur
await page.locator('[data-labels-vue="substances"]').click(); await page.waitForTimeout(400);
await page.locator('[data-ref-cellule="ue|pvpp"] button', { hasText: 'Corriger' }).click(); await page.waitForTimeout(300);
await ov().locator('input[inputmode="decimal"]').first().fill('60'); await ov().locator('button', { hasText: 'Enregistrer' }).last().click(); await page.waitForTimeout(500);
let d = await db();
ok('correction de l’exploitation enregistrée (PVPP UE : 60 g/hL), tracée', d.settings.referentiel.exceptions['ue|pvpp'] && d.settings.referentiel.exceptions['ue|pvpp'].doseMax === 60 && !!d.settings.referentiel.exceptions['ue|pvpp'].le);

// ---- 2. vues liées
await sous('⚖ Labels & cahiers des charges'); await page.locator('[data-labels-vue="produits"]').click(); await page.waitForTimeout(400);
t = await txt(page.locator('[data-ref-synthese="bio"]'));
ok('« Revendications & plafonds » : synthèse des produits du catalogue pour FR-BIO-01 (règle du produit, référentiel, règle effective)', /Sorbate de potassium \(fictif\)/.test(t) && /référentiel : interdit/i.test(t) && /Citrate de cuivre 2 % \(fictif\)/.test(t));
await sous('Produits & règles par revendication');
const nAvis = await page.locator('[data-ref-avis]').count();
ok('« Produits & règles par revendication » : avis du référentiel dans les cellules', nAvis > 10, nAvis);
const al = page.locator('[data-ref-aligner]').first(); const cleAl = await al.getAttribute('data-ref-aligner');
await al.click(); await page.waitForTimeout(500); d = await db();
const [pidA, qA] = cleAl.split('|'); const rA = d.regles.find((r) => r.produitId === pidA && r.qualifId === qA);
ok('« Aligner » dans une cellule : règle du produit alignée sur le référentiel, à vérifier, avec sa source', rA && rA.aVerifier === true && /Référentiel/.test(rA.source || ''), rA);
await sous('⚖ Labels & cahiers des charges'); await page.locator('[data-labels-vue="produits"]').click(); await page.waitForTimeout(400);
const t2 = await txt(page.locator('[data-ref-synthese="bio"]'));
ok('… même donnée vue aussitôt depuis « Revendications & plafonds »', t2.length > 0 && (qA !== 'bio' || !(await page.locator(`[data-ref-synthese="bio"] [data-ref-aligner="${pidA}"]`).count())));

// ---- 3. composés actifs de la fiche du produit
await sous('Produits & règles par revendication');
await page.locator('tr', { hasText: 'Citrate de cuivre 2 % (fictif)' }).locator('button', { hasText: 'Modifier' }).first().click(); await page.waitForTimeout(400);
const comp = await txt(ov().locator('[data-produit-composes]'));
ok('fiche du produit : composés actifs (citrate de cuivre à 2 %, choisis)', /Citrate de cuivre/.test(comp) && (await ov().locator('[data-composes] input').first().inputValue()) === '2', comp);
await ov().locator('[data-composes] input').first().fill('3'); await ov().locator('button', { hasText: 'Enregistrer' }).last().click(); await page.waitForTimeout(500);
d = await db(); ok('… teneur modifiée enregistrée (3 % → 0,03)', d.produits.find((p) => /Citrate de cuivre 2 %/.test(p.nom)).composes[0].part === 0.03);

// ---- 3 bis. catalogues : liste Ecocert (masquée par défaut), préremplissage depuis le site du fournisseur
await page.click('#tab-intrants'); await page.waitForTimeout(300); await sous('Catalogues');
const cEco = page.locator('[data-catalogue="ecocert"] input[type=checkbox]');
ok('catalogue « Liste Ecocert » présent, masqué par défaut', (await cEco.count()) === 1 && !(await cEco.isChecked()));
await cEco.check(); await page.waitForTimeout(500); d = await db();
ok('… affiché à la demande (réglage commun)', d.catalogueReglage && d.catalogueReglage.ecocert === true);
await page.locator('input[aria-label="Rechercher"], [data-catalogue-res]').first().waitFor();
const rech = page.locator('main input[placeholder*="Rechercher"]').last(); await rech.fill('KLIMA'); await page.waitForTimeout(500);
const lgK = page.locator('[data-catalogue-res] tr', { hasText: 'ZYMAFLORE KLIMA' }).first();
ok('recherche : ZYMAFLORE KLIMA avec « liste Ecocert » et liens vers la page, la FT et la FDS du fournisseur', (await lgK.locator('[data-ecocert]').count()) === 1 && (await lgK.locator('[data-catalogue-liens] a').count()) >= 2);
await lgK.locator('button', { hasText: 'Ajouter à mes produits' }).click(); await page.waitForTimeout(500); d = await db();
const pK = d.produits.find((p) => p.nom === 'ZYMAFLORE KLIMA');
ok('… ajouté : page du produit, fiche technique et FDS préremplies, autorisation bio (attestée par Ecocert ou à vérifier)', pK && /^https:\/\/laffort\.com\//.test(pK.lien) && /\.pdf$/.test(pK.ftUrl || '') && d.regles.some((r) => r.produitId === pK.id && r.qualifId === 'bio' && r.autorise && (r.aVerifier || r.verifiePar === 'Ecocert')), pK);

// ---- 4. Traçabilité › Conformité réglementaire (alerte a posteriori, registre)
await page.click('#tab-trace'); await page.waitForTimeout(400); await sous('⚖ Conformité réglementaire');
t = await txt(page.locator('[data-conformite-registre]'));
ok('Traçabilité › Conformité réglementaire : lot en alerte listé avec ses référentiels et ses alertes', t.includes(lotV.code) && /non autorisé/.test(t), t.slice(0, 400));
await page.screenshot({ path: SC + '/shots/t76-conformite.png' });

// ---- 5. fiche du lot : alerte persistante, labels visés
await page.locator('[data-conformite-registre] .linkish', { hasText: lotV.code }).first().click(); await page.waitForTimeout(700);
t = await txt(page.locator(`[data-conformite="${lotV.id}"]`));
ok('fiche du lot : référentiels appliqués (UE, AOC Champagne, Bio UE visé) et alerte persistante (sorbate non autorisé, dépassement justifié)', /Bio européen/.test(t) && /AOC Champagne/.test(t) && /Sorbate de potassium \(fictif\) : non autorisé/.test(t) && /justifié/i.test(t), t.slice(0, 500));
ok('… teneurs dans le vin : acide sorbique estimé', /acide sorbique/i.test(await txt(page.locator(`[data-teneurs="${lotV.id}"]`))));
await page.locator('[data-labels-vises-ouvrir]').first().click(); await page.waitForTimeout(300);
await ov().locator('[data-labels-vises] label', { hasText: 'Demeter' }).locator('input').check(); await ov().locator('button', { hasText: 'Enregistrer' }).last().click(); await page.waitForTimeout(600);
d = await db(); ok('labels visés : Demeter ajouté au lot', d.lots.find((l) => l.id === lotV.id).labelsVises.join() === 'bio-ue,demeter');
t = await txt(page.locator(`[data-conformite="${lotV.id}"]`)); ok('… recalculé aussitôt (Demeter parmi les référentiels du lot)', /Demeter/.test(t));
await page.screenshot({ path: SC + '/shots/t76-lot.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// ---- 6. alerte à la saisie : sorbate sur la cuve de ce lot (Bio UE et Demeter visés) → intrant non autorisé, motif exigé
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await page.click('#tab-cuverie'); await page.waitForTimeout(600);
const cuve = await page.evaluate((id) => { const D = normalizeDb(JSON.parse(localStorage.getItem('oenotrack-db-v2'))); syncConfig(D); const R = replay(D); const q = Object.values(R.portions).find((x) => x.lotId === id); return (D.contenants.find((c) => c.id === q.contenantId) || {}).nom; }, lotV.id);
await page.locator('button', { hasText: /^Cartes$/ }).first().click(); await page.waitForTimeout(500);
await page.locator('.tankcard', { hasText: cuve }).first().click(); await page.waitForTimeout(600);
await ov().locator('[data-rubrique=lots] button', { hasText: 'Intrant' }).first().click(); await page.waitForTimeout(600);
if (!(await ov().locator('[data-ligne-intrant]').count())) { await ov().locator('button', { hasText: '+ Ajouter un intrant' }).first().click(); await page.waitForTimeout(250); }
const lg = ov().locator('[data-ligne-intrant="0"]');
await choisir(lg.locator('[aria-label="Fournisseur"]'), 'En stock');
await pick(page, lg.locator('input[aria-label="Produit"]'), 'Sorbate de potassium (f', 'Sorbate de potassium (fictif)'); await page.waitForTimeout(400);
const lots = lg.locator('select').last(); if ((await lots.locator('option').count()) > 1 && !(await lots.inputValue())) await lots.selectOption({ index: 1 });
await lg.locator('input[placeholder="0"]').fill('100'); await page.waitForTimeout(800);
const f = await txt(ov().locator('[data-depassements]').first().locator('xpath=..'));
ok('alerte à la saisie : « intrant non autorisé » (Bio européen / Demeter visés), motif obligatoire', /intrant non autorisé/.test(f) && /(Bio européen|Demeter)/.test(f), f.slice(0, 400));
const nOps = (await db()).ops.length; await ov().locator('.sheet-f .btn-primary').last().click(); await page.waitForTimeout(500);
ok('… validation refusée sans motif', (await db()).ops.length === nOps);
await ov().locator('textarea[aria-label="Motif du dépassement"]').fill('Essai fictif (test)'); await ov().locator('.sheet-f .btn-primary').last().click(); await page.waitForTimeout(900);
d = await db(); const od = d.ops[d.ops.length - 1];
ok('… avec un motif : opération validée, détail du dépassement tracé avec le label', d.ops.length === nOps + 1 && od.depassement && od.depassement.details.some((x) => x.type === 'interdit' && ['bio-ue', 'demeter'].includes(x.label)), od && od.depassement);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
ok('aucune erreur de page', !errors.length, errors);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S) (t76)` : '\nTOUS LES TESTS PASSENT (t76)'); process.exitCode = ko ? 1 : 0;
