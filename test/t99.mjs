// 0.49.0-alpha.1 : assistant IA (audit IA validé : IA07, IA09, IA10, IA11, IA14, IA21) — veille des textes réglementaires (Labels & cahiers
// des charges › Textes de référence), préparation d'un audit (mode audit, aperçu avant envoi du niveau 2), « 💬 Comment faire ? » (en-tête,
// Paramètres, liens vers les modules permis), règle de codification dictée, configuration guidée préremplie depuis une description, plan de
// nettoyage proposé. Service d'IA simulé (aucun réseau) ; rien n'est enregistré avant validation ; aucune valeur du référentiel ne change ;
// téléphone 390 px ; anglais. Jeu d'exemple (fictif).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests'); fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const IA = { fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-essai' }, modeles: { anthropic: 'modele-essai' }, usages: { audit: true }, consentements: {} };
const init = (lg) => `try { localStorage.setItem('oenotrack-ia', ${JSON.stringify(JSON.stringify(IA))}); ${lg ? `if (!localStorage.getItem('oenotrack-langue')) localStorage.setItem('oenotrack-langue', '${lg}');` : ''} } catch (e) {}`;
// réponses simulées, choisies d'après les consignes envoyées
const REPONSES = [
  [/veille réglementaire/, { textes: [{ id: 'ue', trouve: true, version: 'Règlement délégué (UE) 2019/934 consolidé (fictif)', date: '2026-06-01', url: 'https://eur-lex.europa.eu/eli/reg_del/2019/934/2026-06-01', remarque: 'Version d’essai.' }, { id: 'champagne', trouve: false, version: null, date: null, url: null, remarque: null }] },
    [{ type: 'web_search_tool_result', content: [{ type: 'web_search_result', url: 'https://eur-lex.europa.eu/eli/reg_del/2019/934/2026-06-01', title: 'EUR-Lex (essai)' }] }]],
  [/visite d’un auditeur/, { synthese: 'Synthèse fictive : registres à compléter.', pointsFaibles: [{ point: 'p1', texte: 'Registre des entrées à revoir (fictif).' }], piecesAPreparer: [{ piece: 'stocks', texte: 'Imprimer les stocks (fictif).' }], chapitres: [{ chapitre: 'synthese', notes: 'Note de chapitre fictive.' }, { chapitre: 'stocks', notes: 'Stocks à jour (fictif).' }] }],
  [/assistant d’Œnotrack/, { reponse: 'Ouvrez Paramètres › Codification des lots (réponse fictive).', liens: [{ module: 'params', sub: 'codification', libelle: 'Codification des lots' }, { module: 'module-inconnu', sub: null, libelle: 'Lien refusé' }, { module: 'intrants', sub: 'labels', libelle: 'Labels' }] }],
  [/règle de codification/, { briques: [{ type: 'texte', valeur: 'T' }, { type: 'date', champ: 'annee', chiffres: 2, encodage: 'chiffres' }, { type: 'sep', valeur: '-' }, { type: 'compteur', chiffres: 3, alphabet: 'num', raz: 'annee', depart: 1, pas: 1 }] }],
  [/configurer l’application/, { reponses: [{ id: 'nom', valeur: 'Domaine Fictif des Essais' }, { id: 'region', valeur: 'champagne' }, { id: 'pressoir', valeur: 'oui' }, { id: 'compte', valeur: 'pirate' }, { id: 'onglet', valeur: 'nulle-part' }] }],
  [/plan de nettoyage/, { lignes: [{ zone: 'cuverie', libelle: 'Cuves (proposition fictive)', cible: { type: 'contenants', formes: ['cuve'] }, action: 'nettoyage', quand: [{ type: 'vidange' }], produits: [{ nom: 'Soude caustique lessive 30 %', conc: 2, concUnite: '%' }], mode: 'Rincer, nettoyer, rincer (fictif).', controle: 'ph', attendu: 'pH 7', responsable: 'Caviste', danger: 'chimique' },
    { zone: 'cuverie', libelle: 'Ligne refusée', cible: { type: 'locaux', locaux: ['introuvable'] }, action: 'magie', quand: [{ type: 'vidange' }] }] }],
];
const envois = [];
const routes = async (route, u) => {
  if (!u.startsWith('https://api.anthropic.com/')) return false;
  const b = JSON.parse(route.request().postData() || '{}'); envois.push(b); const sys = String(b.system || '');
  const r = REPONSES.find(([re]) => re.test(sys)); const val = r ? r[1] : {};
  await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ content: [...((r && r[2]) || []), { type: 'text', text: JSON.stringify(val) }], stop_reason: 'end_turn' }) });
  return true;
};
const dernier = (re) => [...envois].reverse().find((b) => re.test(String(b.system || ''))) || null;
const contenu = (b) => (b ? `${b.system}\n${typeof b.messages[0].content === 'string' ? b.messages[0].content : JSON.stringify(b.messages[0].content)}` : '');
{
  const { browser, page, errors } = await open({ init: init(), routes, viewport: { width: 1360, height: 900 } });
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const ov = () => page.locator('.overlay').last();
  const d00 = await db(); const nom0 = d00.entreprise.nom; const nomEx = ((d00.apporteurs || [])[0] || {}).nom || 'sans-nom'; // donnée de l'exploitation (fictive) qui ne doit jamais partir
  // ---- IA14 : veille des textes réglementaires
  await page.click('#tab-intrants'); await page.waitForTimeout(300);
  await page.locator('main [role=tab]', { hasText: 'Labels & cahiers des charges' }).first().click(); await page.waitForTimeout(300);
  await page.locator('[data-labels-vue="textes"]').click(); await page.waitForTimeout(300);
  ok('Textes de référence : tableau de veille (un texte par ligne), bouton « 🤖 Vérifier les textes »', (await page.locator('[data-veille-ligne]').count()) >= 10 && (await page.locator('[data-ia-bouton="veilleTextes"]').isEnabled()));
  const ref0 = JSON.stringify((await db()).settings.referentiel || {});
  await page.locator('[data-ia-bouton="veilleTextes"]').click(); await page.waitForSelector('[data-veille-proposition]', { timeout: 8000 }).catch(() => {});
  const bV = dernier(/veille réglementaire/);
  ok('… envoi : recherche web, intitulés et dates des textes seulement (rien de l’exploitation)', !!bV && (bV.tools || []).some((t) => /web_search/.test(t.type)) && /ue \| Règlement délégué/.test(contenu(bV)) && !contenu(bV).includes(nomEx));
  ok('… résultat affiché d’abord (version plus récente, sources consultées) ; rien d’enregistré', /version plus récente/.test(await txt(page.locator('[data-veille-proposition]'))) && (await page.locator('[data-veille-sources] a').count()) === 1 && JSON.stringify((await db()).settings.referentiel || {}) === ref0);
  await page.locator('[data-veille-garder]').click(); await page.waitForTimeout(400);
  let d = await db(); const ref1 = d.settings.referentiel || {};
  const sansVeille = (r) => { const x = { ...(r || {}) }; delete x.veille; return JSON.stringify(x); };
  ok('« Garder ce résultat » : settings.referentiel.veille ; aucune valeur du référentiel changée (corrections, activation)', ref1.veille && ref1.veille.ue && ref1.veille.ue.trouve && ref1.veille.ue.sourceVue && !ref1.veille.champagne.trouve && sansVeille(ref1) === sansVeille(JSON.parse(ref0)), ref1);
  ok('… le texte plus récent et ses règles sont « à relire » (affichage)', (await page.locator('[data-veille-ligne="ue"][data-a-relire="oui"]').count()) === 1 && (await page.locator('[data-regles-a-relire="ue"]').count()) === 1 && (await page.locator('[data-veille-ligne="champagne"][data-a-relire="non"]').count()) === 1);
  await page.locator('[data-veille-relu="ue"]').click(); await page.waitForTimeout(300);
  ok('… « ✓ Relu » : plus à relire', (await page.locator('[data-veille-ligne="ue"][data-a-relire="non"]').count()) === 1 && (await db()).settings.referentiel.veille.ue.relu === true);
  // ---- IA09 : préparer un audit (niveau 2 : aperçu avant le premier envoi)
  await page.click('#tab-trace'); await page.waitForTimeout(300);
  await page.locator('main [role=tab]', { hasText: 'Mode audit' }).first().click(); await page.waitForTimeout(300);
  await page.locator('[data-audit-type="douanes"] button', { hasText: 'Préparer un audit' }).click(); await page.waitForTimeout(300);
  await ov().locator('input[aria-label="Auditeur"]').fill('Auditeur Fictif'); await ov().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
  await page.locator('[data-ia-bouton="audit"]').click(); await page.waitForTimeout(400);
  ok('Préparer un audit : aperçu de ce qui part (niveau 2), sans le nom de l’auditeur', (await page.locator('[data-ia-apercu="audit"]').count()) === 1 && !/Auditeur Fictif/.test(await txt(page.locator('[data-ia-apercu="audit"]'))) && /Points de contrôle/.test(await txt(page.locator('[data-ia-apercu="audit"]'))));
  await page.locator('[data-ia-unefois]').click(); await page.waitForSelector('[data-audit-proposition]', { timeout: 8000 }).catch(() => {});
  d = await db(); const a0 = d.audits[d.audits.length - 1];
  ok('… proposition affichée (synthèse, points faibles, pièces, chapitres) ; notes de l’audit inchangées', /Synthèse fictive/.test(await txt(page.locator('[data-audit-proposition]'))) && (await page.locator('[data-audit-chapitre-ia]').count()) === 2 && !a0.notes);
  await page.locator('[data-audit-chapitre-ia="stocks"] input[type=checkbox]').uncheck(); await page.locator('[data-audit-reprendre]').click(); await page.waitForTimeout(500);
  d = await db(); const a1 = d.audits[d.audits.length - 1];
  ok('« Reprendre dans les notes » : parties cochées seulement, trace de l’IA (🤖)', /Synthèse fictive/.test(a1.notes) && /Note de chapitre fictive/.test(a1.notes) && !/Stocks à jour/.test(a1.notes) && a1.ia && a1.ia.usage === 'audit' && (await page.locator('[data-mode-audit] [data-ia-trace]').count()) >= 1, a1);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // ---- IA10 : règle de codification dictée
  await page.click('#tab-params'); await page.waitForTimeout(300); await page.locator('[data-params-item="codification"]').click(); await page.waitForTimeout(400);
  await page.locator('[data-codif-choix-stade="tirage"]').click(); await page.waitForTimeout(200);
  await page.getByRole('button', { name: '＋ Nouvelle règle' }).click(); await page.waitForTimeout(200);
  await page.locator('[data-codif-dicter] textarea').fill('T, l’année sur deux chiffres, un tiret, un compteur sur trois chiffres remis à zéro chaque année');
  await page.locator('[data-ia-bouton="codification"]').click(); await page.waitForTimeout(800);
  const bC = dernier(/règle de codification/);
  ok('Codification dictée : la phrase part, briques chargées dans l’éditeur avec l’aperçu ; rien d’enregistré', !!bC && /compteur sur trois chiffres/.test(contenu(bC)) && (await page.locator('[data-codif-brique]').count()) === 4 && /^T\d{2}-\d{3}$/.test((await page.locator('[data-codif-resultat]').innerText()).trim()) && !((await db()).codifRegles || []).length, await page.locator('[data-codif-resultat]').innerText().catch(() => ''));
  await page.getByRole('button', { name: 'Enregistrer la règle' }).click(); await page.waitForTimeout(400);
  d = await db(); ok('… « Enregistrer la règle » par l’utilisateur : version enregistrée (4 briques)', (d.codifRegles || []).some((r) => r.id === 'tirage' && (r.versions || []).some((v) => (v.briques || []).length === 4)));
  // ---- IA11 : configuration guidée depuis une description
  await page.locator('[data-params-item="base"]').click(); await page.waitForTimeout(300); await page.locator('[data-config-relancer]').click(); await page.waitForTimeout(400);
  await page.locator('[data-perso-description] textarea').fill('Récoltant fictif en Champagne, nous pressurons sur place.');
  await page.locator('[data-ia-bouton="configuration"]').click(); await page.waitForTimeout(800);
  const bQ = dernier(/configurer l’application/);
  ok('Configuration : description et questions envoyées (sans le compte) ; réponses préremplies annoncées', !!bQ && /Récoltant fictif/.test(contenu(bQ)) && !/\ncompte \|/.test(contenu(bQ)) && /réponse\(s\) préremplie\(s\)/.test(await txt(page.locator('[data-perso-description]'))));
  await page.locator('[data-perso-mode="basique"]').click(); await page.waitForTimeout(300);
  { const v = await page.locator('[data-perso-question="nom"] input').inputValue().catch((e) => String(e).slice(0, 80)); const np = await page.locator('[data-perso-propose="nom"]').count(); const ne = (await db()).entreprise.nom;
  ok('… question relue écran par écran : nom prérempli, marqué « 🤖 proposé par l’IA, à relire » ; base inchangée', v === 'Domaine Fictif des Essais' && np === 1 && ne === nom0, [v, np, ne, nom0]); }
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  // ---- IA21 : plan de nettoyage proposé
  await page.click('#tab-hygiene'); await page.waitForTimeout(300); await page.locator('main [role=tab]', { hasText: 'Plan de nettoyage' }).first().click(); await page.waitForTimeout(300);
  const n0 = (await db()).planNettoyage.length;
  await page.locator('[data-ia-bouton="planNettoyage"]').click(); await page.waitForSelector('[data-plan-ia-ligne]', { timeout: 8000 }).catch(() => {});
  const bN = dernier(/plan de nettoyage/); const nomsCuves = (await db()).contenants.slice(0, 6).map((c) => c.nom).filter((n) => n && n.length > 4);
  ok('Plan de nettoyage proposé : liste à cocher (ligne invalide non cochable) ; types et produits envoyés, pas les noms des cuves ; rien d’ajouté', (await page.locator('[data-plan-ia-ligne]').count()) === 2 && (await page.locator('[data-plan-ia-ligne="1"] input[type=checkbox]').isDisabled()) && /Soude caustique/.test(contenu(bN)) && nomsCuves.every((n) => !contenu(bN).includes(`| ${n} |`)) && (await db()).planNettoyage.length === n0);
  await page.locator('[data-plan-ia-ajouter]').click(); await page.waitForTimeout(500);
  d = await db(); const ln = d.planNettoyage.find((e) => e.libelle === 'Cuves (proposition fictive)');
  ok('… ajoutée après validation, marquée « proposé par l’IA, à vérifier »', d.planNettoyage.length === n0 + 1 && ln && ln.aVerifier && ln.ia && ln.ia.usage === 'planNettoyage' && (await page.locator(`[data-plan-a-verifier="${ln.id}"]`).count()) === 1);
  await page.locator(`[data-plan-verifiee="${ln.id}"]`).click(); await page.waitForTimeout(300);
  ok('… « ✓ Vérifiée » : mention retirée, trace gardée', !(await db()).planNettoyage.find((e) => e.id === ln.id).aVerifier && (await page.locator(`[data-plan-a-verifier="${ln.id}"]`).count()) === 0);
  // ---- IA07 : « 💬 Comment faire ? »
  await page.locator('[data-aide-bouton]').click(); await page.waitForTimeout(300);
  await ov().locator('input[aria-label="Votre question"]').fill('Comment régler les codes de lots ?'); await page.locator('[data-ia-bouton="aide"]').click(); await page.waitForSelector('[data-aide-echange]', { timeout: 8000 }).catch(() => {});
  const bA = dernier(/assistant d’Œnotrack/);
  ok('« 💬 Comment faire ? » (en-tête) : question et documentation intégrée envoyées, rien de l’exploitation', !!bA && /Comment régler les codes de lots/.test(contenu(bA)) && /# Visite guidée/.test(bA.system) && /codification — /.test(bA.system) && !contenu(bA).includes(nomEx));
  const liens = await page.locator('[data-aide-lien]').evaluateAll((L) => L.map((x) => x.getAttribute('data-aide-lien')));
  ok('… réponse et boutons vers les modules permis seulement (module inconnu écarté)', /réponse fictive/.test(await txt(page.locator('[data-assistant-aide]'))) && liens.join() === 'params|codification,intrants|labels', liens);
  await page.locator('[data-aide-lien="params|codification"]').click(); await page.waitForTimeout(500);
  ok('… le bouton ouvre Paramètres › Codification des lots et ferme l’assistant', (await page.locator('#tab-params').getAttribute('aria-selected')) === 'true' && (await page.locator('[data-codif-choix-stade]').count()) > 0 && (await page.locator('[data-assistant-aide]').count()) === 0);
  await page.locator('[data-params-item="base"]').click(); await page.waitForTimeout(300); await page.locator('[data-aide-params]').click(); await page.waitForTimeout(300);
  ok('… depuis Paramètres › Affichage & application ; conversation gardée en mémoire seulement', (await page.locator('[data-aide-echange]').count()) === 1 && !JSON.stringify(await page.evaluate(() => ({ ...localStorage }))).includes('Comment régler les codes de lots'));
  await page.screenshot({ path: `${SC}/shots/t99-aide.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('aucune erreur dans la page', errors.length === 0, errors);
  await browser.close();
}
{ // téléphone
  const { browser, page, errors } = await open({ init: init(), routes, viewport: { width: 390, height: 844 }, mobile: true });
  await page.locator('[data-hdr-plus]').click(); await page.waitForTimeout(200);
  ok('téléphone : « 💬 Comment faire ? » derrière « ⋯ »', await page.locator('[data-aide-bouton]').isVisible());
  await page.locator('[data-aide-bouton]').click(); await page.waitForTimeout(300);
  await page.locator('.overlay input[aria-label="Votre question"]').fill('Où sont les labels ?'); await page.locator('[data-ia-bouton="aide"]').click(); await page.waitForSelector('[data-aide-echange]', { timeout: 8000 }).catch(() => {});
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  ok('… réponse et boutons dans l’écran (aucune page plus large que 390 px)', (await page.locator('[data-aide-lien]').count()) === 2 && sw <= 391, sw);
  await page.screenshot({ path: `${SC}/shots/t99-telephone.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.click('#tab-intrants').catch(() => {}); await page.waitForTimeout(300);
  await page.locator('main [role=tab]', { hasText: 'Labels & cahiers des charges' }).first().click(); await page.waitForTimeout(300); await page.locator('[data-labels-vue="textes"]').click(); await page.waitForTimeout(300);
  const sw2 = await page.evaluate(() => document.documentElement.scrollWidth);
  ok('… textes de référence : aucune page plus large que l’écran', sw2 <= 391, sw2);
  ok('aucune erreur (téléphone)', errors.length === 0, errors); await browser.close();
}
{ // anglais
  const { browser, page, errors } = await open({ init: init('en'), routes, viewport: { width: 1360, height: 900 } });
  ok('en anglais : « 💬 How do I…? » dans l’en-tête', /How do I…\?/.test(await page.locator('[data-aide-bouton]').innerText()));
  await page.locator('[data-aide-bouton]').click(); await page.waitForTimeout(300);
  ok('… assistant : « Clear the conversation », « Your question »', /Clear the conversation/.test(await txt(page.locator('.overlay').last())) && /Your question/i.test(await txt(page.locator('.overlay').last())));
  await page.locator('.overlay input').last().fill('Where are the labels?'); await page.locator('[data-ia-bouton="aide"]').click(); await page.waitForSelector('[data-aide-echange]', { timeout: 8000 }).catch(() => {});
  ok('… consigne : répondre en anglais', /en anglais/.test(String((dernier(/assistant d’Œnotrack/) || {}).system || '')));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.click('#tab-intrants'); await page.waitForTimeout(300); await page.locator('main [role=tab]').nth(4).click(); await page.waitForTimeout(300); await page.locator('[data-labels-vue="textes"]').click(); await page.waitForTimeout(300);
  ok('… Labels : « 🤖 Check the texts », « Version read »', /Check the texts/.test(await page.locator('[data-ia-bouton="veilleTextes"]').innerText()) && /Version read/i.test(await txt(page.locator('[data-veille-textes]'))));
  ok('aucune erreur (anglais)', errors.length === 0, errors); await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUS LES TESTS D’INTERFACE PASSENT (t99)'); process.exitCode = ko ? 1 : 0;
