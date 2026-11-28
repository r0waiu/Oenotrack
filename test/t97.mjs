// 0.49.0-alpha.1 : assistant IA au chai (audit IA validé) — IA01 saisie en langage courant (formulaire prérempli, ambiguïté → choix,
// trace « ia », pastille du journal), IA17 fiche papier relue (photo, vérification ligne par ligne, validation des opérations à réaliser),
// IA08 alerte de fermentation expliquée, IA12 recherche de traçabilité en langage courant (exécutée sur l'appareil), IA20 histoire d'un lot
// (codes remis sur l'appareil) ; aperçu avant le premier envoi de niveau 2, données interdites absentes des requêtes, rien d'enregistré
// avant validation ; téléphone 390 px ; anglais. Service simulé (aucun réseau), données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const IA = { fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-essai' }, modeles: { anthropic: 'modele-essai' }, usages: { saisie: true, ficheRelue: true, fermentation: true, traceRecherche: true, histoireLot: true }, consentements: {} };
const initIa = (langue) => ({ content: `try { localStorage.setItem('oenotrack-ia', ${JSON.stringify(JSON.stringify(IA))}); ${langue ? `if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', '${langue}');` : ''} } catch (e) {}` });
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEklEQVR4nGP4z8CAFWEXHbQSACj/P8Fu7N9hAAAAAElFTkSuQmCC', 'base64');
// service simulé : la réponse dépend de l'usage (reconnu par ses consignes) ; codes retrouvés dans la requête
const envois = []; let saisieAmbigue = false;
const code = (t, re) => { const m = t.match(re); return m ? m[1] : null; };
function reponse(body) {
  const sys = String(body.system || ''); const t = JSON.stringify(body.messages || []).replace(/\\n/g, '\n');
  if (/saisir une opération/.test(sys)) {
    const op = code(t, /(O\d+) \| Sulfitage \|/); const c8 = code(t, /(C\d+) \| Cuve 08/); const pr = code(t, /(P\d+) \| Métabisulfite/);
    return saisieAmbigue ? { operation: op, autres: [code(t, /(O\d+) \| Collage \|/)], contenant: c8, question: 'Sulfitage ou collage ?' } : { operation: op, contenant: c8, produits: [{ produit: pr, dose: 3, uniteDose: 'g/hL' }], date: null };
  }
  if (/relis la photo/.test(sys)) return { lignes: [{ ligne: 1, fait: true, valeurs: [{ champ: 'qte0', valeur: '62' }] }, { ligne: 2, fait: true, valeurs: [{ champ: 'densite', valeur: '1,0280' }, { champ: 'temp', valeur: '15' }] }], illisible: null };
  if (/assistant d’œnologie/.test(sys)) return { resume: 'Fermentation presque arrêtée à densité élevée.', causes: [{ cause: 'Température trop basse', explication: '14 °C pendant plusieurs jours.', probabilite: 'forte' }], verifications: ['Mesurer l’azote assimilable.'], actions: ['Réchauffer la cuve à 18 °C.'] };
  if (/question de traçabilité/.test(sys)) return /Question : « [^»]*pesée/.test(t) ? { filtre: 'tout', texte: 'pesée 1', explication: 'Recherche de la pesée n° 1.' } : { filtre: 'intrant', nom: 'métabisulfite', explication: 'Rappel de lot du métabisulfite.' };
  if (/histoire d’un lot/.test(sys)) return { titre: 'Histoire de L1', paragraphes: ['Le lot L1 est un moût en fermentation.', 'Il a été sulfité au débourbage.'] };
  return {};
}
const routes = async (route, u) => {
  if (!u.startsWith('https://api.anthropic.com/')) return false;
  let body = {}; try { body = JSON.parse(route.request().postData() || '{}'); } catch (e) { body = {}; }
  envois.push(body); await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ content: [{ type: 'text', text: JSON.stringify(reponse(body)) }], stop_reason: 'end_turn' }) }); return true;
};
const dernier = () => JSON.stringify(envois[envois.length - 1] || {});
const apercu = async (page, quoi) => { await page.waitForTimeout(300); const a = page.locator('[data-ia-apercu]'); if (await a.count()) { await page.locator(quoi || '[data-ia-unefois]').click(); await page.waitForTimeout(500); return true; } return false; };
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 }, routes, init: initIa() });
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  // jeu d'essai : relevés lents sur la cuve 08 (alerte de fermentation), deux opérations à réaliser et leur fiche imprimée
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const R = getR(d); const auj = todayISO(); const jour = (n) => new Date(Date.parse(`${auj}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
    const c8 = d.contenants.find((c) => c.nom === 'Cuve 08'); const p8 = contParts(R, c8.id)[0]; const met = d.produits.find((p) => /Métabisulfite/.test(p.nom)); const a = d.arrivages.find((x) => x.produitId === met.id);
    [[-6, 1.06], [-4, 1.03], [-2, 1.029], [-1, 1.0287]].forEach(([n, de]) => opSave(d, { type: 'suivi', date: jour(n), portionId: p8.portionId, densite: de, tempC: 14, lignes: [] }));
    const v1 = previsionSave(d, { type: 'intrant', date: auj, f: { date: auj, sousType: 'sulfitage', portionId: p8.portionId, lignes: [{ produitId: met.id, arrivageId: a.id, qty: '60' }], prepUses: [], motif: '', operateurs: [], notes: '' }, resume: 'Sulfitage Cuve 08' });
    const v2 = previsionSave(d, { type: 'suivi', date: auj, f: { date: auj, portionId: p8.portionId, lignes: [], prepUses: [], densite: '', tempC: '', motif: '', operateurs: [], notes: '' }, resume: 'Relevé Cuve 08' });
    ficheAdd(d, { modele: 'traitements', ordre: 'TRT-ESSAI-1', date: auj, sources: [{ kind: 'prev', id: v1.id }, { kind: 'prev', id: v2.id }] });
    localStorage.setItem('oenotrack-db-v2', JSON.stringify(d));
  });
  await page.reload(); await page.waitForTimeout(1500);
  const lotCode = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const R = getR(d); const c8 = d.contenants.find((c) => c.nom === 'Cuve 08'); return R.lots[contParts(R, c8.id)[0].lotId].code; });
  // ---- IA01 : saisie en langage courant
  await page.click('#tab-ops'); await page.waitForTimeout(400);
  ok('saisie : champ « Décrire l’opération… » et bouton 🤖 dans « ＋ Nouvelle opération »', (await page.locator('[data-ia-saisie-phrase]').count()) === 1 && (await page.locator('[data-ia-bouton="saisie"]').count()) === 1);
  const n0 = (await db()).ops.length;
  await page.locator('[data-ia-saisie-phrase]').fill('sulfitage de la cuve 08 à 3 g/hL'); await page.locator('[data-ia-saisie-ok]').click();
  const vuApercu = await apercu(page);
  ok('… niveau 2 : aperçu de ce qui part avant le premier envoi', vuApercu);
  await page.waitForTimeout(600);
  ok('… une seule requête, phrase et cuves envoyées, jamais un code de lot ni la clé dans le texte', envois.length === 1 && /sulfitage de la cuve 08/.test(dernier()) && /Cuve 08/.test(dernier()) && !dernier().includes(lotCode), dernier().slice(0, 300));
  const form = page.locator('.overlay').last();
  await page.screenshot({ path: `${SC}/shots/t97-saisie.png` });
  ok('… formulaire ouvert prérempli, encadré « Prérempli par l’IA : relisez avant de valider »', (await page.locator('[data-ia-prerempli]').count()) === 1 && /Prérempli par l’IA/.test(await txt(form)) && /sulfitage de la cuve 08/.test(await txt(form)));
  ok('… rien n’est enregistré avant « ✓ Valider »', (await db()).ops.length === n0);
  await form.getByRole('button', { name: '✓ Valider' }).click(); await page.waitForTimeout(800);
  const d1 = await db(); const op = d1.ops.find((o) => o.ia && o.ia.usage === 'saisie');
  ok('… validée : opération enregistrée avec la trace « ia » (usage, modèle) et la quantité calculée (3 g/hL × 20 hL)', d1.ops.length === n0 + 1 && op && op.sousType === 'sulfitage' && op.ia.modele === 'modele-essai' && Number(op.lignes[0].qty) === 60, op);
  await page.locator('[data-nouvelle-op]').click().catch(() => {}); await page.waitForTimeout(200);
  ok('… pastille « 🤖 IA » dans le journal', (await page.locator('[data-journal] [data-ia-trace]').count()) >= 1);
  // ambiguïté : liste de choix, aucun formulaire ouvert
  if (!(await page.locator('[data-ia-saisie-phrase]').count())) { await page.locator('[data-nouvelle-op]').click(); await page.waitForTimeout(300); }
  saisieAmbigue = true; await page.locator('[data-ia-saisie-phrase]').fill('traitement de la cuve 08'); await page.locator('[data-ia-saisie-ok]').click(); await apercu(page); await page.waitForTimeout(600);
  ok('saisie ambiguë : liste de choix (sulfitage, collage) et question de l’IA, aucun formulaire ouvert (pas de supposition)', (await page.locator('[data-ia-saisie-choix] [data-ia-choix-op]').count()) === 2 && (await page.locator('[data-ia-prerempli]').count()) === 0 && /Sulfitage ou collage/.test(await txt(page.locator('[data-ia-saisie-choix]'))));
  await page.locator('[data-ia-choix-op="sulfitage"]').click(); await page.waitForTimeout(500);
  ok('… choix fait : formulaire prérempli de l’opération choisie', (await page.locator('[data-ia-prerempli]').count()) === 1);
  await page.locator('.overlay').last().getByRole('button', { name: 'Annuler' }).click(); await page.waitForTimeout(300);
  saisieAmbigue = false;
  // ---- IA08 : alerte de fermentation expliquée, IA20 : histoire du lot (fiche du lot)
  await page.keyboard.press('Control+k'); await page.waitForTimeout(150); await page.keyboard.type(lotCode); await page.waitForTimeout(300); await page.keyboard.press('Enter'); await page.waitForTimeout(800);
  ok('fermentation : alerte affichée avec « 🤖 Pourquoi ? »', (await page.locator('[data-alerte-ferm] [data-ia-pourquoi]').count()) === 1);
  const nE = envois.length; await page.locator('[data-ia-pourquoi]').click(); await apercu(page); await page.waitForTimeout(500);
  ok('… réponse affichée (causes, vérifications, actions), « À vérifier avec votre œnologue »', (await page.locator('[data-ia-fermentation]').count()) === 1 && /À vérifier avec votre œnologue/.test(await txt(page.locator('.overlay').last())) && /Température trop basse/.test(await txt(page.locator('[data-ia-fermentation]'))));
  ok('… envoyé : courbe en jours relatifs, sans code de lot ni nom de cuve ni date', envois.length === nE + 1 && /J\+/.test(dernier()) && !dernier().includes(lotCode) && !dernier().includes('Cuve 08') && !/\d{4}-\d{2}-\d{2}/.test(JSON.stringify(envois[envois.length - 1].messages)), dernier().slice(0, 400));
  await page.locator('.overlay').last().locator('button.btn-primary', { hasText: 'Fermer' }).click(); await page.waitForTimeout(300);
  const nH = envois.length; await page.locator('[data-ia-histoire-btn]').click(); await apercu(page); await page.waitForTimeout(500);
  const hist = await txt(page.locator('[data-ia-histoire]'));
  ok('histoire du lot : texte affiché avec le vrai code du lot (remis sur l’appareil), jamais reçu par l’IA', envois.length === nH + 1 && hist.includes(`Le lot ${lotCode} est un moût`) && !dernier().includes(lotCode) && /L1/.test(dernier()), hist);
  ok('… « Copier » et « Imprimer » ; rien d’enregistré', (await page.locator('[data-ia-histoire-copier]').count()) === 1 && (await page.locator('[data-ia-histoire-imprimer]').count()) === 1 && (await db()).ops.length === n0 + 1);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250); await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  // ---- IA17 : fiche papier relue
  await page.click('#tab-previsions'); await page.waitForTimeout(500);
  await page.locator('[data-ia-relire-fiche]').click(); await page.waitForTimeout(400);
  ok('fiche relue : fiche imprimée proposée, 2 lignes et plus à relire', /TRT-ESSAI-1/.test(await txt(page.locator('[data-ia-fiche-choix]'))) && /ligne\(s\) à relire/.test(await txt(page.locator('[data-ia-fiche-etape="photo"]'))));
  await page.locator('[data-ia-fiche-photo]').setInputFiles({ name: 'fiche.png', mimeType: 'image/png', buffer: PNG }); await page.waitForTimeout(200);
  const nF = envois.length; await page.locator('[data-ia-fiche-lire]').click(); await apercu(page); await page.waitForTimeout(800);
  const env = envois[envois.length - 1] || {}; const contenu = ((env.messages || [])[0] || {}).content;
  ok('… envoyé : la photo (image) et la structure de la fiche (cuve, cases à lire)', envois.length === nF + 1 && Array.isArray(contenu) && contenu.some((x) => x.type === 'image') && /Cuve 08/.test(dernier()) && /qte0/.test(dernier()));
  ok('… vérification ligne par ligne : valeurs lues préremplies et corrigeables', (await page.locator('[data-ia-fiche-etape="verif"]').count()) === 1 && (await page.locator('[data-ia-fiche-val="1:qte0"]').inputValue()) === '62' && (await page.locator('[data-ia-fiche-val="2:densite"]').inputValue()) === '1,0280');
  await page.locator('[data-ia-fiche-val="2:temp"]').fill('15,5'); await page.screenshot({ path: `${SC}/shots/t97-fiche-relue.png` });
  const d2 = await db(); ok('… rien n’est enregistré avant la validation', d2.ops.length === n0 + 1 && d2.previsions.every((p) => p.statut === 'prevue'));
  await page.locator('[data-ia-fiche-valider]').click(); await page.waitForTimeout(900);
  const d3 = await db(); const opsF = d3.ops.filter((o) => o.ia && o.ia.usage === 'ficheRelue');
  ok('… validées : opérations à réaliser réalisées, quantité et relevé corrigé repris, trace « ia »', opsF.length === 2 && d3.previsions.every((p) => p.statut === 'realisee') && opsF.some((o) => o.type === 'intrant' && Number(o.lignes[0].qty) === 62) && opsF.some((o) => o.type === 'suivi' && Math.abs(Number(o.tempC) - 15.5) < 1e-9 && Math.abs(Number(o.densite) - 1.028) < 1e-9), opsF);
  // ---- IA12 : recherche de traçabilité (niveau 0 : pas d'aperçu)
  await page.click('#tab-trace'); await page.waitForTimeout(500);
  const nT = envois.length; await page.locator('[data-ia-recherche-question]').fill('quels lots ont reçu du métabisulfite ?'); await page.locator('[data-ia-recherche-ok]').click(); await page.waitForTimeout(800);
  ok('recherche : niveau 0, aucun aperçu ; la question et les filtres seulement (aucun nom de la base)', envois.length === nT + 1 && (await page.locator('[data-ia-apercu]').count()) === 0 && !dernier().includes('Cuve 08') && !dernier().includes(lotCode) && !dernier().includes('Métabisulfite de potassium'));
  ok('… filtre « Intrant » appliqué, produit retrouvé sur l’appareil, recherche lancée', (await page.locator('[data-trace-filtre="intrant"]').getAttribute('aria-pressed')) === 'true' && /Ajouts trouvés/i.test(await txt(page.locator('main'))) && (await page.locator('[data-ia-recherche-compris]').count()) === 1, await txt(page.locator('main')).then((x) => x.slice(0, 600)));
  await page.locator('[data-ia-recherche-question]').fill('tout sur la pesée 1'); await page.locator('[data-ia-recherche-ok]').click(); await page.waitForTimeout(800);
  ok('… « tout » : texte repris dans la recherche unique', (await page.locator('[data-trace-filtre="tout"]').getAttribute('aria-pressed')) === 'true' && (await page.locator('[data-trace-etapes] input').inputValue()) === 'pesée 1');
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{ // usage désactivé : boutons désactivés avec leur raison
  const IA0 = { ...IA, usages: { saisie: false } };
  const { browser, page, errors } = await open({ viewport: { width: 1280, height: 900 }, routes, init: { content: `try { localStorage.setItem('oenotrack-ia', ${JSON.stringify(JSON.stringify(IA0))}); } catch (e) {}` } });
  await page.click('#tab-ops'); await page.waitForTimeout(400);
  ok('usage désactivé : champ et bouton désactivés, raison au survol', (await page.locator('[data-ia-saisie-phrase]').isDisabled()) && (await page.locator('[data-ia-bouton="saisie"]').isDisabled()) && /désactivé/.test(await page.locator('[data-ia-bouton="saisie"]').getAttribute('title')));
  ok('aucune erreur (désactivé)', errors.length === 0, errors); await browser.close();
}
{ // téléphone
  const { browser, page, errors } = await open({ viewport: { width: 390, height: 844 }, mobile: true, routes, init: initIa() });
  await page.click('#tab-ops'); await page.waitForTimeout(500);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  ok('téléphone : champ « Décrire l’opération… » visible, page pas plus large que l’écran', (await page.locator('[data-ia-saisie-phrase]').isVisible()) && sw <= 391, sw);
  await page.click('#tab-previsions'); await page.waitForTimeout(400); await page.locator('[data-ia-relire-fiche]').click(); await page.waitForTimeout(400);
  const sw2 = await page.evaluate(() => document.documentElement.scrollWidth);
  ok('… fiche relue au téléphone : sans débordement', (await page.locator('[data-ia-fiche-etape="photo"]').isVisible()) && sw2 <= 391, sw2);
  await page.screenshot({ path: `${SC}/shots/t97-telephone.png` });
  ok('aucune erreur (téléphone)', errors.length === 0, errors); await browser.close();
}
{ // anglais
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 }, routes, init: initIa('en') });
  await page.click('#tab-ops'); await page.waitForTimeout(500);
  ok('en anglais : « Describe the operation… », « Prefill »', (await page.locator('[data-ia-saisie-phrase]').getAttribute('placeholder')) === 'Describe the operation…' && /Prefill/.test(await txt(page.locator('[data-ia-saisie-ok]'))));
  await page.locator('[data-ia-saisie-phrase]').fill('sulfitage de la cuve 08 à 3 g/hL'); await page.locator('[data-ia-saisie-ok]').click(); await apercu(page); await page.waitForTimeout(600);
  ok('… encadré du formulaire prérempli en anglais', /Prefilled by AI: review before validating/.test(await txt(page.locator('[data-ia-prerempli]'))));
  await page.locator('.overlay').last().getByRole('button', { name: /Cancel/ }).click(); await page.waitForTimeout(300);
  await page.click('#tab-trace'); await page.waitForTimeout(400);
  ok('… traçabilité : « Ask the question… »', (await page.locator('[data-ia-recherche-question]').getAttribute('placeholder')) === 'Ask the question…');
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t97)'); process.exitCode = ko ? 1 : 0;
