// 0.49.0-alpha.1 : documents lus par l'IA (audit IA : IA02, IA03, IA04, IA05, IA13, IA18) — photo de l'étiquette à la réception, ticket de
// pesée (aperçu avant le premier envoi de niveau 2), barème illisible relu par l'IA, plan depuis un protocole, composés actifs d'après la
// composition, commentaire d'un bulletin ; formulaires préremplis, rien d'enregistré avant validation, trace « ia » après ; téléphone, anglais.
// Service simulé (aucun réseau), images d'essai générées (PNG), données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs'; import zlib from 'zlib';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const norm0 = (s) => String(s || '').toLowerCase();
// petite image PNG fictive (aplat de couleur)
function png(w, h, rgb) {
  const T = []; for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = T[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) { const o = y * (w * 3 + 1) + 1 + x * 3; raw[o] = rgb[0]; raw[o + 1] = rgb[1]; raw[o + 2] = rgb[2]; }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const IMG = (nom) => ({ name: nom, mimeType: 'image/png', buffer: png(48, 32, [200, 180, 120]) });
// service simulé : réponse choisie d'après les consignes envoyées
const IA = { appels: [] };
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
const pts = []; for (let h = 0; h <= 120; h += 1) pts.push([h, 150 + h * 48]);
const REP = [
  [/étiquette d’un sac/, { produitCode: null, produit: 'Enzyme pectolytique', fabricant: 'Fabricant fictif', numLot: 'Lot : EZ-2611', ddm: '03/2028', quantite: 1, unite: 'kg', nombre: 1, incertains: ['ddm'] }],
  [/ticket de pesée/, { document: 'ticket', numero: 'T-0099', date: null, heure: '07:45', apporteur: 'Lefèvre Père & Fils', cru: 'Cramant', cepage: 'Chardonnay', poidsBrutKg: 4300, tareKg: 300, poidsNetKg: 4000, caisses: 82, tap: 10.4, incertains: ['caisses'] }],
  [/citerne de moûts/, { document: 'dae', numero: 'DAE-FICTIF-1', date: null, immatriculation: 'ab-123-cd', apporteur: 'Lefèvre Père & Fils', millesime: 2026, compartiments: [{ compartiment: 'C1', volume: 52, unite: 'hL', cepage: 'Chardonnay', fraction: 'Cuvée', cru: 'Cramant' }] }],
  [/certificat de jaugeage/, { tables: [{ page: 1, nom: 'C 77', certificat: 'R.X9.26.00077', uniteHauteur: 'cm', uniteVolume: 'L', capacite: 5900, lignes: pts }] }],
  [/protocole de vinification/, { nom: 'Protocole fictif', groupes: [{ label: 'Chardonnay', cepages: ['Chardonnay'] }], revendications: ['Conventionnel'], fractions: ['Cuvée', 'Taille'], lignes: [{ type: 'section', etape: 'Débourbage' }, { type: 'etape', etape: 'Sulfitage', produit: 'Solution sulfureuse', valeurs: [{ fraction: 'Cuvée', valeur: '4 g/hL' }, { fraction: 'Taille', valeur: '6 g/hL' }] }] }],
  [/composés actifs/, { composes: [{ id: 'citrate-cuivre', partPct: 2, justification: 'citrate de cuivre 2 %' }] }],
  [/commentes un bulletin/, { synthese: 'Acidité volatile à surveiller.', points: [{ parametre: 'Acidité volatile', niveau: 'surveiller', message: 'Recontrôler dans quinze jours.' }] }],
];
const routes = async (route, u) => {
  if (!u.startsWith('https://api.anthropic.com/')) return false;
  const rq = route.request(); if (rq.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return true; }
  const b = JSON.parse(rq.postData() || '{}'); IA.appels.push(b); const r = REP.find(([re]) => re.test(b.system || '')); const rep = r ? r[1] : { rien: true };
  await route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(rep) }] }) });
  return true;
};
const init = { content: "try { localStorage.setItem('oenotrack-ia', JSON.stringify({ fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-essai' }, modeles: { anthropic: 'modele-essai' }, usages: { pesee: true, bulletinCommentaire: true }, consentements: {} })); } catch (e) {}" };
const dernier = (re) => IA.appels.filter((b) => re.test(b.system || '')).slice(-1)[0];
const images = (b) => ((b && b.messages && b.messages[0] && Array.isArray(b.messages[0].content)) ? b.messages[0].content : []).filter((x) => x.type === 'image');
{
  const { browser, page, errors } = await open({ routes, init, viewport: { width: 1360, height: 900 }, date: '2026-10-05T10:00:00' });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const fermer = async () => { for (let i = 0; i < 4 && await page.locator('.overlay').count(); i++) { await page.keyboard.press('Escape'); await page.waitForTimeout(150); } };
  // ---- IA02 : photo de l'étiquette à la réception
  await page.click('#tab-intrants'); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: '＋ Nouvel arrivage' }).click(); await page.waitForTimeout(300); let f = ov();
  const bt = f.locator('[data-ia-bouton="reception"]');
  ok('IA02 : « 📷 Photo de l’étiquette » (appareil photo : image, caméra arrière) et « Photo ou PDF… »', /📷 Photo de l’étiquette/.test(await bt.innerText()) && !(await bt.isDisabled()) && (await f.locator('[data-ia-photo="reception"]').getAttribute('capture')) === 'environment' && /pdf/.test(await f.locator('[data-ia-fichier="reception"]').getAttribute('accept')));
  const nA0 = (await db()).arrivages.length;
  await f.locator('[data-ia-photo="reception"]').setInputFiles(IMG('etiquette.png')); await page.waitForTimeout(1500);
  const rq2 = dernier(/étiquette d’un sac/);
  ok('… photo envoyée (bloc image), liste des produits par leurs noms, sans aperçu (niveau 1)', rq2 && images(rq2).length === 1 && images(rq2)[0].source.media_type === 'image/jpeg' && /Enzyme pectolytique/.test(JSON.stringify(rq2.messages)) && !(await page.locator('[data-ia-apercu]').count()));
  ok('… formulaire prérempli : n° de lot (préfixe retiré), DDM au dernier jour du mois, 1 kg → 1000 g, DDM signalée', (await f.locator('input[placeholder="ex. SK-2609"]').inputValue()) === 'EZ-2611' && (await f.locator('input[type=date]').nth(1).inputValue()) === '2028-03-31' && (await f.locator('label', { hasText: 'Quantité reçue' }).locator('input').inputValue()).replace(/\s/g, '') === '1000' && (await f.locator('.ia-doute').count()) >= 1 && (await f.locator('[data-ia-lecture]').count()) === 1);
  ok('… rien d’enregistré avant validation', (await db()).arrivages.length === nA0);
  await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
  let d = await db(); const ar = d.arrivages.find((a) => a.numLot === 'EZ-2611'); const enz = d.produits.find((p) => p.nom === 'Enzyme pectolytique');
  ok('… enregistré après relecture : produit rapproché, trace « ia » (réception)', ar && ar.produitId === enz.id && ar.dluo === '2028-03-31' && ar.qty === 1000 && ar.ia && ar.ia.usage === 'reception' && ar.ia.modele === 'modele-essai', ar);
  // ---- IA13 : composés actifs d'après la composition
  await page.locator('main [role=tab]', { hasText: 'Produits & règles' }).click(); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: '＋ Nouveau produit' }).click(); await page.waitForTimeout(300); f = ov();
  await f.locator('input').first().fill('Cuivre fictif'); await f.locator('[data-produit-infos] > button').click(); await page.waitForTimeout(150);
  await f.locator('label', { hasText: 'Composition' }).locator('textarea').fill('Citrate de cuivre 2 % sur support inerte.'); await page.waitForTimeout(200);
  await f.locator('[data-ia-bouton="composes"]').click(); await page.waitForTimeout(1200);
  const rq13 = dernier(/composés actifs/);
  ok('IA13 : composition et liste des composés connus envoyées ; proposition affichée à vérifier', rq13 && /Citrate de cuivre 2 %/.test(JSON.stringify(rq13.messages)) && /citrate-cuivre \| Citrate de cuivre/.test(JSON.stringify(rq13.messages)) && /Citrate de cuivre/.test(await txt(f.locator('[data-composes-proposition]'))));
  await f.locator('[data-composes-reprendre]').click(); await page.waitForTimeout(200);
  ok('… repris dans la liste (2 %), marqué « proposés par l’IA, à vérifier », rien d’enregistré', (await f.locator('[data-composes] input').evaluateAll((L) => L.map((x) => x.value))).includes('2') && (await f.locator('[data-composes-ia-trace]').count()) === 1 && !(await db()).produits.some((p) => norm0(p.nom) === 'cuivre fictif'));
  await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
  d = await db(); const cu = d.produits.find((p) => norm0(p.nom) === 'cuivre fictif');
  ok('… enregistré : p.composes (0,02) et trace composesIa', cu && JSON.stringify(cu.composes) === JSON.stringify([{ id: 'citrate-cuivre', part: 0.02 }]) && cu.composesIa && cu.composesIa.usage === 'composes', cu || d.produits.slice(-1));
  await fermer();
  // ---- IA03 : ticket de pesée (niveau 2 : aperçu avant le premier envoi)
  await page.click('#tab-pressoir'); await page.waitForTimeout(400);
  await page.locator('[data-nouvelle-pesee]').click(); await page.waitForTimeout(300); f = ov();
  const nO0 = (await db()).ops.length; const nAp0 = IA.appels.length;
  await f.locator('[data-ia-fichier="pesee"]').setInputFiles(IMG('ticket.png')); await page.waitForTimeout(800);
  const ap = page.locator('[data-ia-apercu="pesee"]');
  ok('IA03 : aperçu avant le premier envoi (niveau 2) : ce qui part, l’image, rien n’est encore parti', (await ap.count()) === 1 && (await ap.locator('img').count()) === 1 && /apporteurs, crus, parcelles et cépages/.test(await txt(ap)) && IA.appels.length === nAp0);
  await page.locator('[data-ia-unefois]').click(); await page.waitForTimeout(1500); f = ov();
  const rq3 = dernier(/ticket de pesée/);
  ok('… envoyé avec l’image et les noms des listes (jamais les identifiants)', rq3 && images(rq3).length === 1 && /Lefèvre Père & Fils/.test(JSON.stringify(rq3.messages)) && !/"apt\d/.test(JSON.stringify(rq3.messages)));
  ok('… pesée préremplie : brut, tare, net calculé, heure, caisses (signalées), n° de ticket', (await f.locator('[data-brut]').inputValue()).replace(/\s/g, '') === '4300' && (await f.locator('[data-tare]').inputValue()).replace(/\s/g, '') === '300' && (await f.locator('[data-net]').innerText()).replace(/\s/g, '') === '4000kg' && (await f.locator('[data-heure]').inputValue()) === '07:45' && (await f.locator('[data-champ="caisses"].ia-doute').count()) === 1 && /T-0099/.test(await f.locator('[data-champ="ref"] input').inputValue()));
  ok('… partenaire et cru rapprochés de vos listes', /Lefèvre/.test(await f.locator('input[aria-label="Partenaire"]').first().inputValue()) && /Cramant/.test(await f.locator('[data-champ="cruId"] input').first().inputValue()));
  ok('… rien d’enregistré avant validation', (await db()).ops.length === nO0);
  await f.locator('.sheet-f .btn-primary', { hasText: 'Peser et valider' }).click(); await page.waitForTimeout(700);
  d = await db(); const pe = d.ops.find((o) => o.type === 'apport' && o.ref === 'T-0099');
  ok('… validée : trace « ia » (pesée) gardée, poids 4000 kg', pe && pe.kg === 4000 && pe.ia && pe.ia.usage === 'pesee' && pe.pesee.caisses === 82, pe);
  await fermer();
  // ---- IA03 : entrée de moûts depuis le DAE (accord donné « cette fois » seulement : l'aperçu revient)
  await page.click('#tab-cuverie'); await page.waitForTimeout(300);
  await page.locator('.pitem', { hasText: 'Cuve 03' }).first().click({ button: 'right' }); await page.waitForTimeout(250);
  await page.locator('[role=menuitem]', { hasText: /moût/i }).first().click(); await page.waitForTimeout(400); f = ov();
  await f.locator('[data-ia-fichier="pesee"]').setInputFiles(IMG('dae.png')); await page.waitForTimeout(800);
  ok('IA03 (moûts) : « cette fois » seulement → l’aperçu revient au deuxième envoi', (await page.locator('[data-ia-apercu="pesee"]').count()) === 1);
  await page.locator('[data-ia-unefois]').click(); await page.waitForTimeout(1500); f = ov();
  ok('… entrée préremplie : n° de DAE du partenaire, immatriculation, compartiment, 52 hL, cuve choisie gardée', (await f.locator('[aria-label="N° de bon / DAE du partenaire 1"]').inputValue()) === 'DAE-FICTIF-1' && (await f.locator('[aria-label="Compartiment du moût 1"]').inputValue()) === 'C1' && (await f.locator('[aria-label="Volume vers la cuve 1 du moût 1"]').inputValue()).replace(',', '.') === '52' && /AB-123-CD/.test(await f.locator('[data-champ="immat"] input').inputValue()) && (await f.locator('[data-mout]').count()) === 1);
  const nO1 = (await db()).ops.length;
  await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(800);
  d = await db(); const em = d.ops.find((o) => o.type === 'entree_mout' && o.ref === 'DAE-FICTIF-1');
  ok('… enregistrée après relecture (une opération de plus) avec la trace « ia »', d.ops.length === nO1 + 1 && em && em.ia && em.ia.usage === 'pesee' && em.entrees[0].volL === 5200 && em.entrees[0].compartiment === 'C1', em || d.ops.filter((o) => o.type === 'entree_mout').slice(-1));
  await fermer();
  // ---- IA04 : barème illisible (pas de texte, reconnaissance de caractères indisponible) → relu par l'IA
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('main button', { hasText: 'Barèmes de jaugeage' }).first().click(); await page.waitForTimeout(400);
  await page.locator('main button', { hasText: 'Importer des barèmes' }).first().click(); await page.waitForTimeout(300);
  const nB0 = ((await db()).baremes || []).length;
  await ov().locator('input[aria-label="Fichiers de barèmes"]').setInputFiles(IMG('certificat-C77.png')); await page.waitForTimeout(4000);
  const rq4 = dernier(/certificat de jaugeage/);
  ok('IA04 : rien de lisible par le script → pages relues par l’IA (image envoyée), revue habituelle avec l’avertissement', rq4 && images(rq4).length === 1 && (await ov().locator('[data-bareme-ia-relu]').count()) === 1 && /C 77/.test(await txt(ov().locator('[data-bareme-revue]'))), await txt(ov()));
  ok('… rien d’enregistré avant « Enregistrer »', ((await db()).baremes || []).length === nB0);
  await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(700);
  d = await db(); const bm = (d.baremes || []).find((b) => /C 77/.test(b.nom));
  ok('… enregistré : 121 lignes, certificat, trace « ia » dans le barème', bm && bm.points.length === 121 && bm.meta.certificat === 'R.X9.26.00077' && bm.meta.ia && bm.meta.ia.usage === 'baremes', bm && { n: bm.points.length, meta: bm.meta });
  await fermer();
  // ---- IA05 : plan depuis un protocole (texte collé)
  await page.click('#tab-vinification'); await page.waitForTimeout(200); await page.click('#tab-plan'); await page.waitForTimeout(400);
  await page.locator('[data-planv-importer]').click(); await page.waitForTimeout(250);
  await page.locator('[data-planv-protocole] button', { hasText: 'Ou coller le texte du protocole' }).click();
  await page.locator('[data-planv-protocole-texte]').fill('Protocole fictif : sulfitage 4 g/hL en cuvée, 6 g/hL en taille.');
  const nP0 = ((await db()).plansVinif || []).length;
  await page.locator('[data-planv-protocole] [data-ia-bouton="planProtocole"]', { hasText: 'Lire ce texte' }).click(); await page.waitForTimeout(1200);
  ok('IA05 : seul le protocole part ; plan lu ouvert dans le formulaire de vérification, avertissement', /sulfitage 4 g\/hL/.test(JSON.stringify(dernier(/protocole de vinification/).messages)) && (await ov().locator('[data-planv-ia]').count()) === 1 && (await ov().locator('input[aria-label="Nom du plan"]').inputValue()) === 'Protocole fictif');
  ok('… rien d’enregistré avant validation', ((await db()).plansVinif || []).length === nP0);
  await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
  d = await db(); const pv = (d.plansVinif || []).find((p) => p.nom === 'Protocole fictif');
  ok('… enregistré « à vérifier » avec la trace « ia »', pv && pv.aVerifier === true && pv.ia && pv.ia.usage === 'planProtocole' && pv.lignes.length === 2, pv);
  await fermer();
  // ---- IA18 : commentaire d'une analyse (niveau 2 : aperçu, « ne plus demander »)
  await page.click('#tab-analyses'); await page.waitForTimeout(400);
  const avant = JSON.stringify((await db()).analyses);
  await page.locator('main [data-ia-bouton="bulletinCommentaire"]').first().click(); await page.waitForTimeout(500);
  const ap18 = page.locator('[data-ia-apercu="bulletinCommentaire"]');
  ok('IA18 : aperçu avant le premier envoi : résultats, stade, revendication ; ni code de lot ni cuve', (await ap18.count()) === 1 && /"resultats"/.test(await txt(ap18)) && /"stade"/.test(await txt(ap18)) && !/"code"/.test(await txt(ap18)));
  await page.locator('[data-ia-toujours]').click(); await page.waitForTimeout(1200);
  const cm = page.locator('[data-bulletin-commentaire]');
  ok('… commentaire affiché à côté des règles d’Œnotrack, « à vérifier avec votre œnologue »', /Recontrôler dans quinze jours/.test(await txt(cm)) && (await cm.locator('[data-commentaire-niveau="surveiller"]').count()) === 1 && /œnologue/.test(await txt(cm)) && (await cm.locator('[data-commentaire-moteur]').count()) === 1);
  ok('… rien n’est enregistré ; accord gardé sur cet appareil', JSON.stringify((await db()).analyses) === avant && await page.evaluate(() => !!JSON.parse(localStorage.getItem('oenotrack-ia')).consentements.bulletinCommentaire));
  await page.screenshot({ path: `${SC}/shots/t98-commentaire.png` });
  await fermer();
  await page.locator('main [data-ia-bouton="bulletinCommentaire"]').first().click(); await page.waitForTimeout(1200);
  ok('… deuxième envoi : plus d’aperçu', !(await page.locator('[data-ia-apercu]').count()) && (await page.locator('[data-bulletin-commentaire]').count()) === 1);
  await fermer();
  ok('journal local : un envoi par lecture, sans contenu', await page.evaluate(() => { const J = JSON.parse(localStorage.getItem('oenotrack-ia-journal') || '[]'); return J.length >= 7 && !JSON.stringify(J).includes('EZ-2611') && J.some((x) => x.usage === 'reception' && x.images === 1); }));
  // le harnais ne sert pas le module de reconnaissance de caractères (barème) : son chargement refusé n'est pas une erreur de la page
  const errs = errors.filter((e) => !/Failed to load resource: net::ERR_FAILED/.test(e));
  ok('aucune erreur dans la page', errs.length === 0, errs);
  await browser.close();
}
{ // téléphone : bouton photo visible, page pas plus large que l'écran
  const { browser, page, errors } = await open({ routes, init, viewport: { width: 390, height: 844 }, mobile: true, date: '2026-10-05T10:00:00' });
  await page.locator('#tab-intrants').scrollIntoViewIfNeeded().catch(() => {}); await page.click('#tab-intrants'); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: 'Nouvel arrivage' }).first().click(); await page.waitForTimeout(400);
  const b = page.locator('.overlay [data-ia-bouton="reception"]');
  ok('téléphone : « 📷 Photo de l’étiquette » visible, cible tactile ≥ 40 px, rien de plus large que l’écran', await b.isVisible() && (await b.evaluate((e) => e.getBoundingClientRect().height)) >= 40 && (await page.evaluate(() => document.documentElement.scrollWidth)) <= 391);
  await page.screenshot({ path: `${SC}/shots/t98-telephone.png` });
  ok('aucune erreur (téléphone)', errors.length === 0, errors); await browser.close();
}
{ // anglais
  const initEn = { content: `${init.content} try { localStorage.setItem('oenotrack-langue', 'en'); } catch (e) {}` };
  const { browser, page, errors } = await open({ routes, init: initEn, viewport: { width: 1360, height: 900 }, date: '2026-10-05T10:00:00' });
  await page.click('#tab-intrants'); await page.waitForTimeout(300);
  await page.locator('main button', { hasText: 'New delivery' }).first().click(); await page.waitForTimeout(300);
  await page.locator('.overlay [data-ia-photo="reception"]').setInputFiles(IMG('label.png')); await page.waitForTimeout(1500);
  const t = await txt(page.locator('.overlay').last());
  ok('en anglais : « Photo of the label », « Pre-filled by the AI », « Read with some doubt »', /Photo of the label/.test(t) && /Pre-filled by the AI/.test(t) && /Read with some doubt/.test(t) && /Best-before date given to the month/.test(t), t.slice(0, 600));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t98)'); process.exitCode = ko ? 1 : 0;
