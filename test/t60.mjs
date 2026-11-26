// 0.29.0-alpha.1 : chiffrement (activation, mot de passe trop court, sauvegarde chiffrée, export en clair, restauration avec le mot de
// passe sur un autre appareil, Drive chiffré — OneDrive simulé — : mot de passe demandé puis données reprises, base réécrite chiffrée),
// rappel de sauvegarde (données seulement dans ce navigateur), module Excel chargé à la demande, options de compilation. Données fictives.
import fs from 'fs'; import path from 'path'; import { execFileSync, spawnSync } from 'child_process';
import { open } from './ui.mjs'; import { services } from './mocks-cloud.mjs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true }); fs.mkdirSync(SC + '/dl', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const vraies = (errs) => errs.filter((x) => !/Failed to load resource: the server responded with a status of (404|409|412)/.test(x));
const MDP = 'Essai-0290-chiffrement';
const telecharger = async (page, clic) => { const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }).catch(() => null), clic()]); if (!dl) return null; const p = path.join(SC, 'dl', dl.suggestedFilename()); await dl.saveAs(p); return { nom: dl.suggestedFilename(), texte: fs.readFileSync(p, 'utf8'), p }; };
const allerSauvegarde = async (page) => { await page.click('#tab-params'); await page.locator('main [role=tab]', { hasText: 'Sauvegarde' }).click(); await page.waitForTimeout(400); };
let fichierChiffre = null;
// 1. activation, sauvegarde chiffrée, export en clair
{
  const { browser, page, errors } = await open({ https: true, viewport: { width: 1280, height: 900 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last(); const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  await allerSauvegarde(page);
  ok('carte « Chiffrement des sauvegardes et du Drive » : désactivé, explication', (await page.locator('[data-chiffrement=inactif]').count()) === 1 && /AES-256/.test(await txt(page.locator('[data-chiffrement]'))));
  await page.locator('[data-chiffrement] button', { hasText: 'Activer le chiffrement…' }).click(); await page.waitForTimeout(300);
  ok('activation : avertissement « Mot de passe perdu = fichiers illisibles »', /Mot de passe perdu = fichiers illisibles/.test(await txt(ov())));
  await ov().locator('input[type=password]').nth(0).fill('court'); await ov().locator('input[type=password]').nth(1).fill('court'); await ov().locator('button', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(300);
  ok('… mot de passe trop court refusé', /trop court/.test(await txt(ov())));
  await ov().locator('input[type=password]').nth(0).fill(MDP); await ov().locator('input[type=password]').nth(1).fill(MDP + 'x'); await ov().locator('button', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(300);
  ok('… confirmation différente refusée', /pas identiques/.test(await txt(ov())));
  await ov().locator('input[type=password]').nth(1).fill(MDP); await ov().locator('button', { hasText: 'Enregistrer' }).click(); await page.waitForTimeout(4000);
  const d = await db(); const cle = await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-chiffrement-cle') || 'null'));
  ok('chiffrement activé : réglage commun (sel, empreinte, témoin), clé gardée sur l’appareil, ni mot de passe ni clé dans la base', d.settings.chiffrement.actif && d.settings.chiffrement.iter === 600000 && cle && cle.cleId === d.settings.chiffrement.cleId && !JSON.stringify(d).includes(MDP) && !JSON.stringify(d).includes(cle.brut) && (await page.locator('[data-chiffrement=actif]').count()) === 1);
  const f1 = await telecharger(page, () => page.locator('main button', { hasText: '⬇ Exporter la base complète (chiffrée)' }).click());
  const j1 = f1 && JSON.parse(f1.texte);
  ok('sauvegarde complète chiffrée : « …-chiffree.json », enveloppe sans données lisibles', f1 && /-chiffree\.json$/.test(f1.nom) && j1.format === 'oenotrack-chiffre' && j1.chiffrement.cleId === d.settings.chiffrement.cleId && !j1.db && !j1.ops && !f1.texte.includes('Cuve D1') && !f1.texte.includes('Amphore'), f1 && f1.nom);
  fichierChiffre = f1 && f1.p;
  await page.locator('main button', { hasText: 'Exporter sans chiffrement…' }).click(); await page.waitForTimeout(300);
  const f2 = await telecharger(page, () => page.locator('.overlay').last().locator('button', { hasText: 'Exporter en clair' }).click());
  ok('… « Exporter sans chiffrement » (après confirmation) : fichier lisible', f2 && JSON.parse(f2.texte).format === 'oenotrack-sauvegarde' && f2.texte.includes('Cuve D1'), f2 && f2.nom);
  await page.screenshot({ path: SC + '/shots/t60-chiffrement.png' });
  console.log('ERREURS', vraies(errors).length ? vraies(errors) : 'aucune'); if (vraies(errors).length) ko++;
  await browser.close();
}
// 2. restauration sur un autre appareil (sans la clé) : mot de passe demandé
{
  const { browser, page, errors } = await open({ https: true, viewport: { width: 1280, height: 900 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  await allerSauvegarde(page);
  await page.locator('input[type=file][aria-label="Fichier de sauvegarde à importer"]').setInputFiles(fichierChiffre); await page.waitForTimeout(1200);
  ok('restauration d’une sauvegarde chiffrée : mot de passe demandé', /Ce fichier est chiffré/.test(await txt(ov())) && (await ov().locator('input[type=password]').count()) === 1);
  await ov().locator('input[type=password]').fill('Mauvais-mot-de-passe'); await ov().locator('button', { hasText: 'Déverrouiller' }).click(); await page.waitForTimeout(4000);
  ok('… mauvais mot de passe : « Mot de passe incorrect. »', /Mot de passe incorrect\./.test(await txt(ov())));
  await ov().locator('input[type=password]').fill(MDP); await ov().locator('button', { hasText: 'Déverrouiller' }).click(); await page.waitForTimeout(4000);
  ok('… bon mot de passe : confirmation de restauration (sauvegarde lisible)', /Restaurer cette sauvegarde/.test(await txt(ov())), (await txt(ov())).slice(0, 120));
  await ov().locator('button', { hasText: 'Restaurer' }).last().click(); await page.waitForTimeout(1500);
  const d = await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2'))); const cle = await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-chiffrement-cle') || 'null'));
  ok('… base restaurée, chiffrement toujours actif, clé gardée sur ce nouvel appareil', /Sauvegarde restaurée/.test((await page.locator('.toast').allInnerTexts()).join(' ')) && d.settings.chiffrement.actif && cle && cle.cleId === d.settings.chiffrement.cleId);
  console.log('ERREURS', vraies(errors).length ? vraies(errors) : 'aucune'); if (vraies(errors).length) ko++;
  await browser.close();
}
// 3. Drive chiffré (OneDrive simulé) : un appareil sans la clé reprend les données après le mot de passe ; base réécrite chiffrée
{
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'src'); global.window = { localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } };
  const files = fs.readdirSync(dir).filter((f) => /\.js$/.test(f) && !/^(32-sync|33-cloud)/.test(f)).sort();
  const L = new Function('React', files.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n').replace(/const \{ useState[^\n]*\n/, '') + '\n;return { normalizeDb, sampleDb, chiffrementDeriver, chiffrementReglageNouveau, chiffrerTexte, enveloppeChiffree };')({});
  const base = L.normalizeDb(L.sampleDb()); base.meta.exemple = false; base.contenants[0].nom = 'Cuve du Drive chiffré';
  const k = await L.chiffrementDeriver(MDP, null, 1000); base.settings.chiffrement = await L.chiffrementReglageNouveau(k);
  const env = await L.chiffrerTexte(k, JSON.stringify({ format: 'oenotrack-sauvegarde', formatVersion: 1, app: 'oenotrack', sync: { id: 'sDRIVE1', ancetres: [], appareil: 'autre', appareilNom: 'Autre appareil' }, documentsSepares: true, db: base, fichiers: [] }));
  const S = services(); S.msSemer('Œnotrack', env);
  const init = () => { localStorage.setItem('oenotrack-config', JSON.stringify({ google: { clientId: 'g-id.apps.googleusercontent.com' }, microsoft: { clientId: 'ms-id' }, dropbox: { appKey: 'dbx-key' } })); };
  const { browser, page, errors } = await open({ https: true, routes: S.routes, init });
  const top = () => page.locator('.overlay').last();
  await allerSauvegarde(page);
  await page.locator('[data-fournisseur="onedrive"] button').click(); await page.waitForTimeout(2200);
  await top().locator('.cloud-item', { hasText: 'Œnotrack' }).click(); await page.waitForTimeout(900);
  await top().locator('.sheet-f button', { hasText: 'Utiliser' }).click(); await page.waitForTimeout(2200);
  await allerSauvegarde(page);
  ok('Drive chiffré, appareil sans la clé : arrêt « mot de passe », rien d’écrit sur le Drive', (await page.locator('main [data-cloud]').getAttribute('data-cloud')) === 'chiffre' && /mot de passe/.test(await txt(page.locator('[data-cloud-etat]'))) && L.enveloppeChiffree(S.msBase().contenu.toString('utf8')) && S.msBase().contenu.toString('utf8') === env, await page.locator('main [data-cloud]').getAttribute('data-cloud'));
  await page.locator('[data-cloud-mdp]').click(); await page.waitForTimeout(800);
  ok('… « 🔑 Saisir le mot de passe de chiffrement » : demande depuis l’en-tête du fichier du Drive', /Le fichier de votre Drive est chiffré/.test(await txt(top())));
  await top().locator('input[type=password]').fill(MDP); await top().locator('button', { hasText: 'Déverrouiller' }).click(); await page.waitForTimeout(4500);
  await allerSauvegarde(page);
  const d = await page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  ok('… mot de passe accepté : données du Drive reprises sur cet appareil', d.contenants.some((c) => c.nom === 'Cuve du Drive chiffré') && (await page.locator('main [data-cloud]').getAttribute('data-cloud')) === 'ok', await page.locator('main [data-cloud]').getAttribute('data-cloud'));
  await page.click('#tab-params'); await page.click('main button:has-text("Revendications, stades & listes")'); await page.waitForTimeout(300);
  await page.locator('main input[aria-label^="Nouveau stade"]').fill('Sur lies (chiffré)'); await page.locator('main input[aria-label^="Nouveau stade"]').press('Enter'); await page.waitForTimeout(5000);
  const ecrit = S.msBase().contenu.toString('utf8');
  ok('… saisie envoyée : fichier du Drive réécrit chiffré (rien en clair)', ecrit !== env && !!L.enveloppeChiffree(ecrit) && !ecrit.includes('Sur lies (chiffré)') && !ecrit.includes('Cuve du Drive chiffré'));
  console.log('ERREURS', vraies(errors).length ? vraies(errors) : 'aucune'); if (vraies(errors).length) ko++;
  await browser.close();
}
// 4. rappel de sauvegarde (pas de Drive), module Excel chargé à la demande
{
  const { browser, page, errors } = await open({ viewport: { width: 1280, height: 900 }, date: '2026-11-21T10:00:00' });
  ok('ouverture : le module Excel n’est pas chargé, le code source n’est plus joint à la page', (await page.locator('script[src*="xlsx"]').count()) === 0 && (await page.locator('#jsx-source').count()) === 0);
  ok('jeu d’exemple : pas de rappel de sauvegarde', (await page.locator('[data-rappel-sauvegarde]').count()) === 0);
  await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('oenotrack-db-v2')); d.meta.exemple = false; d.meta.creeLe = '2026-10-01'; d.meta.derniereExport = null; d.meta.derniereSync = null; d.meta.derniereEnLigne = null; localStorage.setItem('oenotrack-db-v2', JSON.stringify(d)); });
  await page.reload(); await page.waitForTimeout(1200);
  const bd = page.locator('[data-rappel-sauvegarde]');
  ok('base gardée seulement dans ce navigateur, jamais sauvegardée : rappel discret avec « ⬇ Sauvegarder maintenant »', (await bd.count()) === 1 && /jamais été sauvegardées/.test(await txt(bd)) && /Sauvegarder maintenant/.test(await txt(bd)));
  await bd.locator('button', { hasText: 'Plus tard' }).click(); await page.waitForTimeout(300);
  ok('… « Plus tard » : masqué (jusqu’à demain)', (await page.locator('[data-rappel-sauvegarde]').count()) === 0 && !!(await page.evaluate(() => localStorage.getItem('oenotrack-rappel-sauvegarde'))));
  await page.evaluate(() => localStorage.removeItem('oenotrack-rappel-sauvegarde')); await page.reload(); await page.waitForTimeout(1200);
  const f = await telecharger(page, () => page.locator('[data-rappel-sauvegarde] button', { hasText: 'Sauvegarder maintenant' }).click()); await page.waitForTimeout(500);
  ok('… « Sauvegarder maintenant » : sauvegarde complète téléchargée, rappel retiré', f && /^oenotrack-sauvegarde-2026-11-21\.json$/.test(f.nom) && (await page.locator('[data-rappel-sauvegarde]').count()) === 0, f && f.nom);
  await page.click('#tab-registres'); await page.waitForTimeout(500);
  ok('… module Excel toujours pas chargé en ouvrant les registres', (await page.locator('script[src*="xlsx"]').count()) === 0);
  const bx = page.locator('main button', { hasText: 'Tout exporter (Excel' }).first();
  if (await bx.count()) { await bx.click(); await page.waitForTimeout(1500); }
  ok('export Excel : module chargé à la première utilisation', (await page.locator('script[src*="xlsx"]').count()) === 1 && await page.evaluate(() => !!window.XLSX));
  console.log('ERREURS', vraies(errors).length ? vraies(errors) : 'aucune'); if (vraies(errors).length) ko++;
  await browser.close();
}
// 5. compilation réglable (sans toucher dist/cuverie.html)
{
  const racine = path.join(path.dirname(new URL(import.meta.url).pathname), '..'); const B = path.join(racine, 'build.mjs');
  const sDev = path.join(SC, 'build-dev.html'); const sSrc = path.join(SC, 'build-source.html'); const sDef = path.join(SC, 'build-defaut.html');
  execFileSync('node', [B, `--sortie=${sDef}`, '--silencieux']); execFileSync('node', [B, '--dev', `--sortie=${sDev}`, '--silencieux']); execFileSync('node', [B, '--source', `--sortie=${sSrc}`, '--silencieux']);
  const def = fs.readFileSync(sDef, 'utf8'); const dev = fs.readFileSync(sDev, 'utf8'); const srcH = fs.readFileSync(sSrc, 'utf8');
  const mauvais = spawnSync('node', [B, '--inconnue'], { encoding: 'utf8' });
  ok('compilation : compactée par défaut (plus légère que --dev), sans code source ; --source le joint ; option inconnue refusée', def.length < dev.length && !def.includes('id="jsx-source"') && srcH.includes('id="jsx-source"') && srcH.length > def.length + 1000000 && def.includes('function qrMatrice') && mauvais.status === 2 && /Option inconnue/.test(mauvais.stderr), [def.length, dev.length, srcH.length, mauvais.status]);
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUT EST BON');
process.exitCode = ko ? 1 : 0;
