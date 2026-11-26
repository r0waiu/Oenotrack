// 0.38.0-alpha.1 : assistant IA de l'espace de travail (service, modèle et clé communs réglés par l'administrateur ; clé chiffrée avec
// la clé de l'équipe, jamais en clair dans la base ni dans le navigateur) ; droit des autres utilisateurs d'ajouter leurs propres clés ;
// clés personnelles dans le coffre de l'appareil (chiffrées) ou pour la session seulement. Page en https (Web Crypto) ; service simulé.
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 600) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const IA = { appels: [] }; const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS' };
const routes = async (route, u) => {
  if (!u.startsWith('https://api.anthropic.com/')) return false;
  const rq = route.request(); if (rq.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return true; }
  IA.appels.push({ url: u, cle: rq.headers()['x-api-key'], body: rq.postData() || '' });
  await route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify({ content: [{ type: 'text', text: 'Connexion réussie — claude-commun' }], stop_reason: 'end_turn' }) });
  return true;
};
const MDP_EQUIPE = 'Mot de passe de l’équipe 2026'; const CLE_COMMUNE = 'sk-ant-COMMUNE-0077-cle-fictive'; const CLE_PERSO = 'sk-ant-PERSO-0011-cle-fictive';
const { browser, page, errors } = await open({ https: true, routes, viewport: { width: 1360, height: 950 } });
const ov = () => page.locator('.overlay').last(); const toast = async () => page.locator('.toast').last().innerText().catch(() => '');
const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
// tout le stockage du navigateur tel qu'il est écrit (enveloppes comprises)
const brut = () => page.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i += 1) { const k = localStorage.key(i); o[k] = localStorage.__brut(k); } return o; });
const allerIa = async () => { await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main [role=tab]', { hasText: 'Assistant IA' }).click(); await page.waitForTimeout(400); };
const carte = () => page.locator('[data-ia-espace]');

// 1. administrateur (sans identifiants) : le chiffrement de l'équipe est exigé avant la clé commune
await allerIa();
ok('carte « Espace de travail : assistant commun » (non réglé)', (await carte().count()) === 1 && /non réglé/.test(await txt(carte())));
await carte().locator('button', { hasText: 'Régler l’assistant commun…' }).click(); await page.waitForTimeout(200);
await carte().locator('input[aria-label="Clé API commune"]').fill(CLE_COMMUNE); await page.waitForTimeout(150);
ok('… sans chiffrement de l’équipe : clé commune impossible (bouton désactivé, explication)', /Chiffrement de l’équipe nécessaire/.test(await txt(carte())) && await carte().locator('button', { hasText: 'Enregistrer pour l’espace de travail' }).isDisabled());
await page.click('#tab-params'); await page.waitForTimeout(200); await page.locator('main [role=tab]', { hasText: 'Sauvegarde' }).first().click(); await page.waitForTimeout(400);
ok('Sauvegarde & Drive : carte « Coffre de cet appareil » (données chiffrées)', (await page.locator('[data-coffre-carte="appareil"]').count()) === 1 && /données chiffrées/.test(await txt(page.locator('[data-coffre-carte]'))));
await page.locator('[data-chiffrement] button', { hasText: 'Activer le chiffrement…' }).click(); await page.waitForTimeout(300);
await ov().locator('input[type=password]').nth(0).fill(MDP_EQUIPE); await ov().locator('input[type=password]').nth(1).fill(MDP_EQUIPE); await ov().locator('button', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(5000);
ok('chiffrement de l’équipe activé', (await page.locator('[data-chiffrement="actif"]').count()) === 1);

// 2. clé commune : chiffrée avec la clé de l'équipe, jamais en clair
await allerIa(); if (await carte().locator('button', { hasText: 'Régler l’assistant commun…' }).count()) { await carte().locator('button', { hasText: 'Régler l’assistant commun…' }).click(); await page.waitForTimeout(200); }
await carte().locator('input[aria-label="Modèle commun"]').fill('claude-commun'); await carte().locator('input[aria-label="Clé API commune"]').fill(CLE_COMMUNE);
await carte().locator('button', { hasText: 'Enregistrer pour l’espace de travail' }).click(); await page.waitForTimeout(1500);
let d = await db(); let b = await brut();
ok('enregistrée pour toute l’équipe : service, modèle, clé chiffrée (enveloppe de l’équipe), masque', /Assistant IA de l’espace de travail enregistré/.test(await toast()) && d.settings.ia.fournisseur === 'anthropic' && d.settings.ia.modele === 'claude-commun' && /"oenotrack-chiffre"/.test(d.settings.ia.cle) && d.settings.ia.cleId === d.settings.chiffrement.cleId && d.settings.ia.masque === 'sk-ant…tive', d.settings.ia);
ok('… jamais en clair : ni dans la base, ni nulle part dans le stockage du navigateur', !JSON.stringify(d).includes('COMMUNE-0077') && !Object.values(b).some((v) => String(v).includes('COMMUNE-0077')), Object.keys(b));
ok('… base de l’appareil chiffrée par le coffre (aucune donnée lisible)', /"oenotrack-coffre"/.test(b['oenotrack-db-v2']) && Object.keys(JSON.parse(b['oenotrack-db-v2'])).sort().join() === ['appVersion', 'coffre', 'donnees', 'format', 'formatVersion', 'iv', 'nom'].join());
for (let i = 0; i < 20 && !/clé commune/.test(await txt(carte())); i += 1) await page.waitForTimeout(200);
ok('clé commune déchiffrée sur cet appareil (clé de l’équipe présente)', /clé commune sk-ant…tive/.test(await txt(carte())), await txt(carte()));
ok('sans clé personnelle : l’assistant utilise la clé commune', /En ce moment : clé commune · Claude · claude-commun/.test(await txt(page.locator('[data-ia-en-cours]'))), await txt(page.locator('[data-ia-en-cours]')));
await carte().locator('button', { hasText: /^Tester$/ }).click(); await page.waitForTimeout(800);
ok('« Tester » : appel avec la clé commune', /Connexion réussie/.test(await txt(carte())) && IA.appels.some((a) => a.cle === CLE_COMMUNE), IA.appels.map((a) => a.cle));

// 3. clé personnelle : dans le coffre (chiffrée), choix de la clé utilisée
await page.locator('[data-ia-perso] input[aria-label="Clé API Claude"]').fill(CLE_PERSO); await page.waitForTimeout(400);
b = await brut(); const secrets = await page.evaluate(() => JSON.parse(window.__coffreClair('oenotrack-coffre-secrets') || '{}'));
ok('clé personnelle : dans le coffre de l’appareil, jamais en clair dans le stockage', (secrets.iaCles || {}).anthropic === CLE_PERSO && !Object.values(b).some((v) => String(v).includes('PERSO-0011')) && !/cles/.test(b['oenotrack-ia'] || ''), { ia: b['oenotrack-ia'], s: Object.keys(secrets) });
ok('« Ma clé si elle est réglée, sinon la clé commune » : la sienne', /En ce moment : votre clé/.test(await txt(page.locator('[data-ia-en-cours]'))));
await page.locator('[data-ia-source] button', { hasText: 'Clé commune de l’espace de travail' }).click(); await page.waitForTimeout(250);
ok('… « Clé commune » choisie : la clé commune', /En ce moment : clé commune/.test(await txt(page.locator('[data-ia-en-cours]'))));
await page.locator('[data-ia-source] button', { hasText: 'Ma propre clé' }).click(); await page.waitForTimeout(200);
await page.locator('[data-ia-perso] label', { hasText: 'Garder ma clé pour cette session seulement' }).locator('input').check(); await page.waitForTimeout(400);
const s2 = await page.evaluate(() => JSON.parse(window.__coffreClair('oenotrack-coffre-secrets') || '{}'));
ok('« pour cette session seulement » : retirée du coffre, gardée en mémoire', !(s2.iaCles || {}).anthropic && /Gardée pour cette session seulement/.test(await txt(page.locator('[data-ia-perso]'))));
await page.reload(); await page.waitForTimeout(1500); await allerIa();
ok('… après réouverture : clé personnelle à recoller, la clé commune reste disponible', (await page.locator('[data-ia-perso] input[aria-label="Clé API Claude"]').inputValue()) === '' && /aucune clé utilisable|clé commune/.test(await txt(page.locator('[data-ia-en-cours]'))), await txt(page.locator('[data-ia-en-cours]')));
await page.locator('[data-ia-source] button', { hasText: 'Ma clé si elle est réglée' }).click(); await page.waitForTimeout(400);
for (let i = 0; i < 20 && !/clé commune ·/.test(await txt(page.locator('[data-ia-en-cours]'))); i += 1) await page.waitForTimeout(200);
ok('… réouverture : clé commune déchiffrée de nouveau (clé de l’équipe dans le coffre)', /En ce moment : clé commune · Claude · claude-commun/.test(await txt(page.locator('[data-ia-en-cours]'))), await txt(page.locator('[data-ia-en-cours]')));

// 4. droits des clés personnelles (avec identifiants)
await carte().locator('[data-ia-droits] button', { hasText: 'Interdits (clé commune seulement)' }).click(); await page.waitForTimeout(400);
d = await db(); ok('droit retiré à tous (réglage commun)', d.settings.ia.perso === 'aucun' && /Droits des clés personnelles enregistrés/.test(await toast()));
await page.evaluate(async () => {
  const x = JSON.parse(localStorage.getItem('oenotrack-db-v2')); const e = await mdpEmpreinte('Admin-Fictif-2026', 1000);
  securiteActiver(x, { identifiant: 'admin', nom: 'Admin fictif', mdp: e, secours: e }); utilisateurSave(x, { identifiant: 'chai', nom: 'Opérateur fictif', profilId: 'pf_chef', mdp: e, doitChanger: false });
  x.utilisateurs.forEach((u) => { u.doitChanger = false; }); localStorage.setItem('oenotrack-db-v2', JSON.stringify(x)); localStorage.removeItem('oenotrack-session');
  localStorage.setItem('oenotrack-ia', JSON.stringify({ fournisseur: 'anthropic', modeles: { anthropic: 'claude-perso' } }));
});
await page.reload(); await page.waitForTimeout(2000);
b = await brut(); ok('base écrite en clair par une autre voie : chiffrée de nouveau à l’ouverture', /"oenotrack-coffre"/.test(b['oenotrack-db-v2']) && Object.keys(JSON.parse(b['oenotrack-db-v2'])).sort().join() === ['appVersion', 'coffre', 'donnees', 'format', 'formatVersion', 'iv', 'nom'].join());
const login = async (ident) => { const f = page.locator('[data-connexion] form'); await f.locator('input[aria-label="Identifiant"]').fill(ident); await f.locator('input[aria-label="Mot de passe"]').fill('Admin-Fictif-2026'); await f.locator('button[type=submit]').click(); await page.waitForTimeout(1500); };
await login('chai');
await page.evaluate(() => { iaConfigEcrire({ ...iaConfigLire(), fournisseur: 'anthropic', cles: { anthropic: 'sk-ant-perso-chai' } }); });
for (let i = 0; i < 20 && !(await page.evaluate(() => iaActive().pret)); i += 1) await page.waitForTimeout(200);
const aChai = await page.evaluate(() => { const a = iaActive(); return { source: a.source, cle: a.cle, modele: a.modele }; });
ok('utilisateur (chef de cave, non administrateur) sans le droit : clé personnelle ignorée, clé commune imposée', aChai.source === 'espace' && aChai.cle === CLE_COMMUNE && aChai.modele === 'claude-commun', aChai);
await allerIa();
ok('… réglages IA de l’opérateur : explication, pas de champ de clé personnelle', /Votre administrateur n’a pas autorisé les clés et modèles personnels/.test(await txt(page.locator('main'))) && (await page.locator('[data-ia-perso]').count()) === 0 && (await carte().locator('button', { hasText: 'Régler l’assistant commun…' }).count()) === 0);
await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(500);
await login('admin');
const aAdm = await page.evaluate(() => { const a = iaActive(); return { source: a.source, cle: a.cle }; });
ok('administrateur : garde toujours le droit (sa clé sur cet appareil est utilisée)', aAdm.source === 'perso' && aAdm.cle === 'sk-ant-perso-chai', aAdm);
await allerIa(); const chai = await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')).utilisateurs.find((u) => u.identifiant === 'chai').id);
await carte().locator('[data-ia-droits] button', { hasText: 'Autorisés pour certains' }).click(); await page.waitForTimeout(300);
await carte().locator('[data-ia-droits] label', { hasText: 'Opérateur fictif' }).locator('input').check(); await page.waitForTimeout(400);
d = await db(); ok('droit accordé à un utilisateur choisi, noté au journal', d.settings.ia.perso === 'choisis' && d.settings.ia.persoUtilisateurs.includes(chai) && d.audit.some((a) => /Assistant IA de l’espace de travail/.test(a.resume || '')));
await page.screenshot({ path: SC + '/shots/t72-ia-espace.png', fullPage: true });
await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(500);
await login('chai');
for (let i = 0; i < 10 && (await page.evaluate(() => iaActive().source)) !== 'perso'; i += 1) await page.waitForTimeout(200);
ok('… l’opérateur choisi utilise de nouveau sa propre clé', (await page.evaluate(() => iaActive().source)) === 'perso');
const vraies = errors.filter((e) => !/favicon|ERR_FAILED|Failed to load resource|net::/.test(e));
ok('aucune erreur dans la console', !vraies.length, vraies);
await browser.close();
console.log(ko ? `\n${ko} ÉCHEC(S) (t72)` : '\nTOUS LES TESTS PASSENT (t72)');
process.exitCode = ko ? 1 : 0;
