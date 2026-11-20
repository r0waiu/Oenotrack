// 0.16.0-alpha.1 : formulaires d'opération personnalisables — champs affichés / repliés / masqués, obligatoires, libellés, valeurs par défaut,
// champs personnalisés (nombre, calcul, case, liste), contrôles, journal, fiches, copie, rétablissement, accès depuis le formulaire, mobile
import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗', name, x !== undefined ? `→ ${String(x).replace(/\s+/g, ' ').slice(0, 220)}` : ''); };
const { browser, page, errors } = await open();
const toast = async () => page.locator('.toast').last().innerText().catch(() => '');
const sheet = () => page.locator('.overlay').last();
const dbLS = async () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const has = (t, x) => t.toLowerCase().includes(x.toLowerCase()); // libellés en capitales (CSS)
const allerOps = async () => { await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: 'Opérations' }).first().click(); await page.waitForTimeout(300); };
const ajout = async (f) => {
  await sheet().locator('button', { hasText: '+ Ajouter un champ' }).click(); await page.waitForTimeout(250); const d = sheet();
  await d.locator('input[aria-label="Nom du champ"]').fill(f.label); await d.locator('select[aria-label="Type de champ"]').selectOption(f.type);
  if (f.unite) await d.locator('input[aria-label="Unité"]').fill(f.unite); if (f.dec != null) await d.locator('select[aria-label="Décimales"]').selectOption(String(f.dec));
  if (f.min != null) await d.locator('input[aria-label="Minimum"]').fill(String(f.min)); if (f.max != null) await d.locator('input[aria-label="Maximum"]').fill(String(f.max));
  if (f.options) await d.locator('textarea[aria-label="Choix proposés"]').fill(f.options.join('\n'));
  if (f.vars) { for (const v of f.vars) await d.locator('[aria-label="Variables disponibles"] button', { hasText: new RegExp(`^${v}$`) }).click(); }
  if (f.formule) await d.locator('input[aria-label="Formule"]').fill(f.formule);
  if (f.obl) await d.locator('label', { hasText: 'Obligatoire' }).locator('input').check(); if (f.debut) await d.locator('select[aria-label="Place du champ"]').selectOption('debut');
  if (f.verif) await f.verif(d);
  await d.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(250);
};

// 1. éditeur du formulaire « Soutirage »
await allerOps();
await page.locator('main [data-op="soutirage"] button', { hasText: 'Formulaire' }).click(); await page.waitForTimeout(400);
let s = sheet();
ok('éditeur : champs indispensables verrouillés', await s.locator('[data-fe-champ="volL"] button[role=radio]', { hasText: 'Masqué' }).isDisabled() && (await s.locator('[data-fe-champ="portionId"]').innerText()).includes('indispensable'));
await s.locator('[data-fe-champ="pertes"] button[role=radio]', { hasText: 'Masqué' }).click();
ok('champ masqué : « obligatoire » impossible', await s.locator('[data-fe-champ="pertes"] input[type=checkbox]').isDisabled());
await s.locator('[data-fe-champ="equipementIds"] input[type=checkbox]').check();
await s.locator('[data-fe-champ="equipementIds"] button[aria-label^="Détails"]').click();
await s.locator('[role=group][aria-label="Valeur par défaut : Équipements utilisés"] button', { hasText: 'Pompe à pistons' }).click();
await s.locator('[data-fe-champ="notes"] button[role=radio]', { hasText: 'Replié' }).click();
await s.locator('[data-fe-champ="volL"] button[aria-label^="Détails"]').click();
await s.locator('input[aria-label="Libellé : Volume repris (hL)"]').fill('Volume soutiré (hL)');
await ajout({ label: 'Température début', type: 'nombre', unite: '°C', min: -5, max: 30, debut: true });
await ajout({ label: 'Température fin', type: 'nombre', unite: '°C', min: -5, max: 30 });
await ajout({ label: 'Écart de température', type: 'calcul', unite: '°C', dec: 1, vars: ['temperaturefin'], formule: 'temperaturefin - temperaturedebut', verif: async (d) => ok('formule : essai affiché', (await d.innerText()).includes('Essai avec 10')) });
await ajout({ label: 'Contrôle visuel effectué', type: 'ouinon', obl: true });
await ajout({ label: 'Aspect', type: 'liste', options: ['Limpide', 'Voilé', 'Trouble'] });
// formule invalide refusée
await sheet().locator('button', { hasText: '+ Ajouter un champ' }).click(); await page.waitForTimeout(200);
await sheet().locator('input[aria-label="Nom du champ"]').fill('Faux calcul'); await sheet().locator('select[aria-label="Type de champ"]').selectOption('calcul'); await sheet().locator('input[aria-label="Formule"]').fill('inconnue * 2');
ok('formule : variable inconnue signalée', (await sheet().innerText()).includes('variable inconnue « inconnue »'));
await sheet().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(200);
ok('… et le champ n’est pas ajouté', (await sheet().locator('[role=alert]').innerText().catch(() => '')).includes('Formule'));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
s = sheet();
ok('5 champs personnalisés dans l’éditeur', (await s.locator('[data-fe-perso]').count()) === 5);
await s.locator('button[aria-label="Monter Aspect"]').click(); await page.waitForTimeout(100);
ok('ordre des champs personnalisés modifiable', (await s.locator('[data-fe-perso]').nth(3).getAttribute('data-fe-perso')) === 'Aspect');
await page.screenshot({ path: SH + '/t36-editeur.png' });
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('formulaire enregistré', /Formulaire « Soutirage » enregistré/.test(await toast()), await toast());
ok('catalogue : pastille « formulaire perso »', (await page.locator('main [data-op="soutirage"]').innerText()).includes('formulaire perso'));
const F = (await dbLS()).formulaires.find((x) => x.id === 'soutirage');
ok('base : réglages et 5 champs (codes pour les formules)', F.champs.pertes.vis === 'masque' && F.champs.equipementIds.obligatoire && F.champs.equipementIds.defaut.length === 1 && F.champs.notes.vis === 'replie' && F.perso.length === 5 && F.perso.find((p) => p.type === 'calcul').formule === 'temperaturefin - temperaturedebut');

// 2. saisie d'un soutirage avec ce formulaire
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await page.locator('.pitem', { hasText: 'Cuve 08' }).first().click({ button: 'right' }); await page.waitForTimeout(250);
await page.locator('[role=menuitem]', { hasText: 'Soutirage' }).first().click(); await page.waitForTimeout(500);
s = sheet(); let t = await s.innerText();
ok('formulaire : pertes masquées, libellé renommé, champs personnalisés', !has(t, 'Pertes (lies)') && has(t, 'Volume soutiré (hL)') && has(t, 'Température début') && has(t, 'Écart de température') && has(t, 'Contrôle visuel effectué'));
ok('formulaire : « Afficher tous les champs (1 masqué) » et lien de personnalisation', t.includes('Afficher tous les champs (1 masqué)') && t.includes('Personnaliser ce formulaire'));
ok('valeur par défaut : Pompe à pistons cochée', await s.locator('label', { hasText: 'Pompe à pistons' }).locator('input').isChecked());
ok('notes repliées', (await s.locator('details.cf-replie[data-champ="notes"]').count()) === 1);
ok('champ « en haut » avant la date', (await s.locator('[data-champs-perso]').first().innerText()).toLowerCase().includes('température début'));
await s.locator('input[aria-label="Température début"]').fill('14'); await s.locator('input[aria-label="Température fin"]').fill('12,5'); await page.waitForTimeout(150);
ok('calcul en direct : −1,5 °C', /[-−]1,5 °C/.test(await s.locator('[data-calcul]').innerText()), await s.locator('[data-calcul]').innerText());
await s.locator('input[aria-label="Température début"]').fill('40'); await page.waitForTimeout(100);
ok('hors limites signalé', (await s.locator('[data-champ-perso].hors').count()) === 1);
await s.locator('input[aria-label="Température début"]').fill('14');
await s.locator('label', { hasText: /Volume soutiré/i }).locator('input').fill('5');
await pick(page, s.locator('label', { hasText: /Contenant de destination/i }).locator('input'), 'Cuve 1', 'Cuve 12').catch(async () => { await pick(page, s.locator('label', { hasText: /Contenant de destination/i }).locator('input'), 'Bac', 'Bac D2'); });
await s.locator('label', { hasText: 'Pompe à pistons' }).locator('input').uncheck();
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(300);
ok('obligatoire : équipements', /Équipements utilisés.*obligatoire/.test(await toast()), await toast());
await s.locator('label', { hasText: 'Pompe à pistons' }).locator('input').check(); await page.waitForTimeout(100);
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(300);
ok('obligatoire : case « Contrôle visuel effectué » à cocher', /doit être coché/.test(await toast()), await toast());
await s.locator('label', { hasText: 'Contrôle visuel effectué' }).locator('input').check();
await s.locator('select[aria-label="Aspect"]').selectOption('Limpide');
// afficher tous les champs : le champ masqué revient
await s.locator('button', { hasText: 'Afficher tous les champs' }).click(); await page.waitForTimeout(150);
ok('« Afficher tous les champs » : pertes visibles (marquées masqué)', has(await s.innerText(), 'Pertes (lies)') && has(await s.innerText(), '· masqué'));
await s.locator('button', { hasText: 'Cacher les champs masqués' }).click(); await page.waitForTimeout(100);
await page.screenshot({ path: SH + '/t36-form.png' });
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
ok('soutirage validé', /validée/.test(await toast()), await toast());
const d1 = await dbLS(); const op = d1.ops.filter((o) => o.type === 'soutirage').pop();
ok('opération : valeurs des champs personnalisés', op.champs.find((c) => c.label === 'Température fin').valeur === 12.5 && op.champs.find((c) => c.type === 'calcul').valeur === -1.5 && op.champs.find((c) => c.label === 'Contrôle visuel effectué').valeur === true && op.champs.find((c) => c.label === 'Aspect').valeur === 'Limpide', JSON.stringify(op.champs));
// journal
await page.click('#tab-ops'); await page.waitForTimeout(400);
const ligne = page.locator('main table tbody tr').filter({ hasText: 'Température fin' }).first();
const tl = await ligne.innerText().catch(() => '');
ok('journal : champs dans le détail', tl.includes('Température début : 14 °C') && /Écart de température : [-−]1,5 °C/.test(tl) && tl.includes('Aspect : Limpide'), tl);
// modification : les valeurs reviennent
await ligne.locator('button:text-is("Modifier")').click(); await page.waitForTimeout(400); s = sheet();
ok('modification : valeurs reprises', (await s.locator('input[aria-label="Température fin"]').inputValue()) === '12,5' && (await s.locator('select[aria-label="Aspect"]').inputValue()) === 'Limpide');
// personnaliser depuis le formulaire : notes de nouveau affichées
await s.locator('button', { hasText: 'Personnaliser ce formulaire' }).click(); await page.waitForTimeout(400);
await sheet().locator('[data-fe-champ="notes"] button[role=radio]', { hasText: 'Affiché' }).click(); await sheet().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('réglage modifié depuis le formulaire : appliqué tout de suite', (await sheet().locator('details.cf-replie[data-champ="notes"]').count()) === 0 && has(await sheet().innerText(), 'Notes'));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// 3. fiches à imprimer : les champs personnalisés sont des données pré-remplies
await page.click('#tab-previsions'); await page.waitForTimeout(300);
await page.locator('main button', { hasText: 'Modèles de fiches' }).click(); await page.waitForTimeout(300);
await page.locator('main tr, main .card', { hasText: /Mouvements/ }).first().locator('button', { hasText: /Modifier|Personnaliser/ }).first().click(); await page.waitForTimeout(400);
const optTxt = await sheet().locator('select[aria-label="Contenu de la colonne"]').first().locator('option').allInnerTexts();
ok('fiches : « Pré-rempli : Température fin (Soutirage) » proposé', optTxt.some((x) => x.includes('Température fin (Soutirage)')), optTxt.filter((x) => /Temp/.test(x)).join(' | '));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// 4. copie vers « Transfert », puis rétablissement
await allerOps();
await page.locator('main [data-op="transfert"] button', { hasText: 'Formulaire' }).click(); await page.waitForTimeout(400); s = sheet();
await s.locator('select[aria-label="Copier le formulaire d’une autre opération"]').selectOption({ label: 'Soutirage' }); await page.waitForTimeout(200);
ok('copie : champs repris', (await s.locator('[data-fe-perso]').count()) === 5);
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
const d2 = await dbLS(); const ft = d2.formulaires.find((x) => x.id === 'transfert');
ok('copie enregistrée (nouveaux identifiants)', ft && ft.perso.length === 5 && ft.perso[0].id !== F.perso[0].id);
await page.locator('main [data-op="transfert"] button', { hasText: 'Formulaire' }).click(); await page.waitForTimeout(400); s = sheet();
await s.locator('button', { hasText: 'Rétablir l’origine' }).click(); await page.waitForTimeout(200); await page.locator('[role=alertdialog] button:text-is("Rétablir")').click(); await page.waitForTimeout(200);
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
ok('rétabli : plus de pastille « formulaire perso »', !(await page.locator('main [data-op="transfert"]').innerText()).includes('formulaire perso'));

// 5. téléphone
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(200);
await page.locator('main [data-op="soutirage"] button', { hasText: 'Formulaire' }).click(); await page.waitForTimeout(400);
const ov = await page.evaluate(() => { const o = [...document.querySelectorAll('.overlay')].pop(); const sh = o && o.querySelector('.sheet'); return Math.max(document.documentElement.scrollWidth - window.innerWidth, sh ? sh.scrollWidth - sh.clientWidth : 0); });
ok('téléphone : éditeur sans débordement', ov <= 1, ov);
await page.screenshot({ path: SH + '/t36-mobile.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
console.log('ERREURS:', errors.join(' | ') || 'aucune'); if (errors.length) ko++;
await browser.close();
console.log(ko ? `${ko} ÉCHEC(S)` : 'T36 OK');
