// 0.12.0-alpha.1 : opérateurs — liste de la société, opérateur de l'appareil, choix dans les opérations, journal, fiche, registres, déclassement
import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const init = () => {
  window.__saved = [];
  const downloads = { save: async ({ filename, data }) => { const text = typeof data === 'string' ? data : await data.text(); window.__saved.push({ filename, text }); return { status: 'saved' }; } };
  window.claude = { use: async (n) => (n === 'downloads' ? downloads : null) };
};
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗', name, x !== undefined ? `→ ${String(x).replace(/\s+/g, ' ').slice(0, 170)}` : ''); };
const { browser, page, errors } = await open({ init });
const top = () => page.locator('.overlay').last();
const toast = async () => page.locator('.toast').innerText().catch(() => '');
const puce = () => page.locator('[data-operateur-appareil]');
const pressed = (loc) => loc.getAttribute('aria-pressed');
// saisie d'un soutirage Cuve 03 → Cuve 09 (comme t12)
const soutirage = async () => {
  await page.click('#tab-ops'); await page.waitForTimeout(300);
  await page.click('main button:text-is("Soutirage")'); await page.waitForTimeout(400);
  const combos = top().locator('input[role=combobox]');
  await pick(page, combos.nth(0), 'Cuve 03', 'Cuve 03'); await page.waitForTimeout(150);
  await top().locator('input[inputmode=decimal]').first().fill('2');
  await pick(page, combos.nth(1), 'Cuve 09', 'Cuve 09'); await page.waitForTimeout(150);
};

// 1. en-tête : « Qui saisit ? » → choix de l'opérateur de cet appareil
ok('en-tête : « 👤 Qui saisit ? »', (await puce().innerText()).includes('Qui saisit'), await puce().innerText());
await puce().click(); await page.waitForTimeout(300);
ok('choix de l’opérateur de l’appareil : 5 actifs + « Personne »', (await top().locator('.opr-tog').count()) === 6, await top().locator('.opr-tog').count());
await top().locator('.opr-tog', { hasText: 'Sophie Lambert' }).click(); await page.waitForTimeout(300);
ok('en-tête : « 👤 Sophie L. »', (await puce().innerText()).includes('Sophie L.'), await puce().innerText());
ok('opérateur de l’appareil mémorisé dans ce navigateur', !!(await page.evaluate(() => localStorage.getItem('oenotrack-operateur'))));

// 2. journal : colonne, filtre, recherche
await page.click('#tab-ops'); await page.waitForTimeout(300);
await page.locator('main select[aria-label="Période"], main [aria-label="Période"]').first().selectOption('all').catch(() => {});
await page.waitForTimeout(300);
ok('journal : colonne Opérateur(s)', (await page.locator('main thead').first().innerText()).includes('OPÉRATEUR(S)') || (await page.locator('main thead').first().innerText()).toLowerCase().includes('opérateur(s)'));
const n0 = await page.locator('main tbody tr').count();
await page.locator('main select[aria-label="Opérateur"]').selectOption({ label: 'Claire Vasseur' }); await page.waitForTimeout(300);
const ops = (await page.locator('main tbody tr td:nth-child(2)').allInnerTexts()).map((x) => x.trim());
ok('journal : filtre « Claire Vasseur » = assemblages', ops.length >= 3 && ops.every((x) => /Assemblage/.test(x)) && ops.length < n0, ops.join(' | '));
await page.locator('main select[aria-label="Opérateur"]').selectOption(''); await page.locator('main input[aria-label="Rechercher"]').fill('Vasseur'); await page.waitForTimeout(300);
ok('journal : recherche par nom d’opérateur', (await page.locator('main tbody tr').count()) === ops.length, await page.locator('main tbody tr').count());
await page.locator('main input[aria-label="Rechercher"]').fill('');
await page.screenshot({ path: SH + '/t30-journal.png' });

// 3. nouvelle opération : opérateur de l'appareil proposé, ajout d'un second
await soutirage();
const pSophie = top().locator('.opr-tog', { hasText: 'Sophie Lambert' }); const pThomas = top().locator('.opr-tog', { hasText: 'Thomas Girard' });
ok('formulaire : Sophie proposée d’office (cet appareil)', (await pressed(pSophie)) === 'true' && (await pSophie.innerText()).includes('cet appareil') && (await pressed(pThomas)) === 'false');
await pThomas.click(); await page.waitForTimeout(150);
ok('formulaire : deuxième opérateur ajouté', (await pressed(pThomas)) === 'true');
await page.screenshot({ path: SH + '/t30-form.png' });
await top().locator('.sheet-f button:text-is("✓ Valider")').click(); await page.waitForTimeout(500);
ok('opération validée', (await toast()).includes('validée'), await toast());
const r1 = page.locator('main tbody tr').first();
ok('journal : opérateurs de la nouvelle opération', (await r1.innerText()).includes('Sophie L.') && (await r1.innerText()).includes('Thomas G.'), await r1.innerText());
// modification : on retire Thomas
await r1.locator('button:text-is("Modifier")').click(); await page.waitForTimeout(400);
await top().locator('.opr-tog', { hasText: 'Thomas Girard' }).click(); await top().locator('.sheet-f button:text-is("Enregistrer")').click(); await page.waitForTimeout(400);
ok('modification : opérateur retiré', !(await page.locator('main tbody tr').first().innerText()).includes('Thomas G.') && (await page.locator('main tbody tr').first().innerText()).includes('Sophie L.'));
// fiche à imprimer : opérateurs pré-remplis
await page.locator('main tbody tr').first().locator('[data-op-menu]').click(); await page.waitForTimeout(150); await page.locator('main tbody tr').first().locator('button[aria-label="Fiche d’enregistrement"]').click(); await page.waitForTimeout(600);
ok('fiche : « Opérateur(s) : Sophie Lambert » pré-rempli', /Opérateur\(s\)\s*:\s*Sophie Lambert/.test((await top().locator('.fiche').first().innerText()).replace(/\s+/g, ' ')), (await top().locator('.fh-champs').first().innerText()).replace(/\s+/g, ' '));
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// 4. pastille → fiche de l'opérateur (activité, export)
await page.locator('main tbody tr').first().locator('.opr-chip', { hasText: 'Sophie L.' }).click(); await page.waitForTimeout(400);
const fs1 = (await top().innerText()).replace(/\s+/g, ' ');
ok('fiche opérateur : identité, fonction, appareil', fs1.includes('Sophie Lambert') && fs1.includes('Caviste') && fs1.includes('opérateur de cet appareil'), fs1.slice(0, 140));
ok('fiche opérateur : opérations réalisées', (await top().locator('tbody tr').count()) >= 3 && fs1.includes('Opérations réalisées'));
await top().locator('button:text-is("⬇ CSV")').click(); await page.waitForTimeout(500);
const sv = await page.evaluate(() => window.__saved[window.__saved.length - 1]);
ok('fiche opérateur : export CSV de l’activité', sv && /activite-sophie-lambert/.test(sv.filename) && sv.text.includes('Sophie Lambert') && sv.text.split('\n').length >= 4, sv && sv.filename);
await page.screenshot({ path: SH + '/t30-fiche-operateur.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// 5. Société & opérateurs : liste, ajout, doublon, suppression d'un inutilisé, archivés
await page.click('#tab-params'); await page.click('main button:has-text("Société & opérateurs")'); await page.waitForTimeout(400);
const sec = page.locator('main [data-section="operateurs"]');
ok('société : 5 opérateurs actifs, 1 archivé masqué', (await sec.locator('tbody tr').count()) === 5 && (await sec.innerText()).includes('Afficher les opérateurs archivés (1)'));
await sec.locator('label', { hasText: 'Afficher les opérateurs archivés' }).click(); await page.waitForTimeout(200);
ok('société : archivé affiché sur demande', (await sec.locator('tbody tr').count()) === 6 && (await sec.innerText()).includes('Marc Rivière'));
await page.locator('main button:text-is("+ Opérateur")').click(); await page.waitForTimeout(300);
const inps = top().locator('input'); await inps.nth(0).fill('Julien'); await inps.nth(1).fill('Morel'); await page.waitForTimeout(100);
ok('ajout : doublon signalé avant d’enregistrer', (await top().innerText()).includes('existe déjà'));
await inps.nth(0).fill('Hugo'); await inps.nth(1).fill('Perrin'); await inps.nth(2).fill('Apprenti');
await top().locator('.sheet-f button:text-is("Enregistrer")').click(); await page.waitForTimeout(400);
ok('ajout : Hugo Perrin dans la liste', (await toast()).includes('Hugo Perrin') && (await sec.innerText()).includes('Hugo Perrin'), await toast());
const rowH = sec.locator('tbody tr', { hasText: 'Hugo Perrin' });
ok('suppression possible seulement si inutilisé', (await rowH.locator('button', { hasText: 'Suppr.' }).count()) === 1 && (await sec.locator('tbody tr', { hasText: 'Julien Morel' }).locator('button', { hasText: 'Suppr.' }).count()) === 0);
await rowH.locator('button', { hasText: 'Suppr.' }).click(); await page.waitForTimeout(200); await page.locator('[role=alertdialog] button:text-is("Supprimer")').click(); await page.waitForTimeout(300);
ok('suppression : Hugo Perrin retiré', !(await sec.innerText()).includes('Hugo Perrin'));
await page.screenshot({ path: SH + '/t30-societe.png', fullPage: false });

// 6. opérateur obligatoire : sans opérateur, la validation est refusée
await sec.locator('label', { hasText: 'Exiger au moins un opérateur' }).click(); await page.waitForTimeout(300);
await sec.locator('select[aria-label="Opérateur de cet appareil"]').selectOption(''); await page.waitForTimeout(200);
ok('appareil sans opérateur : « Qui saisit ? »', (await puce().innerText()).includes('Qui saisit'));
await soutirage();
ok('obligatoire : aucun opérateur proposé, message', (await top().locator('.opr-tog[aria-pressed="true"]').count()) === 0 && (await top().innerText()).includes('Indiquez qui a réalisé l’opération'), (await top().locator('.sheet-b').innerText()).slice(-160));
await top().locator('.sheet-f button:text-is("✓ Valider")').click(); await page.waitForTimeout(300);
ok('obligatoire : validation refusée', (await toast()).includes('opérateur') && (await page.locator('.overlay').count()) >= 1, await toast());
await top().locator('.opr-tog', { hasText: 'Léa Fontaine' }).click(); await top().locator('.sheet-f button:text-is("✓ Valider")').click(); await page.waitForTimeout(500);
ok('obligatoire : validée avec Léa', (await toast()).includes('validée') && (await page.locator('main tbody tr').first().innerText()).includes('Léa F.'), await toast());
// planifier avec un opérateur → « À réaliser », colonne et filtre
await soutirage(); await top().locator('.opr-tog', { hasText: 'Thomas Girard' }).click();
await top().locator('button:has-text("Planifier (à réaliser)")').click(); await page.waitForTimeout(400);
await page.click('#tab-previsions'); await page.waitForTimeout(300);
ok('à réaliser : opérateur prévu affiché', (await page.locator('main tbody tr').first().innerText()).includes('Thomas G.'), await page.locator('main tbody tr').first().innerText());
await page.locator('main select[aria-label="Opérateur"]').selectOption('-'); await page.waitForTimeout(200);
ok('à réaliser : filtre « non attribuées »', (await page.locator('main tbody tr').count()) === 0 || !(await page.locator('main tbody').innerText()).includes('Thomas G.'));
await page.locator('main select[aria-label="Opérateur"]').selectOption(''); await page.waitForTimeout(200);
await page.locator('main tbody tr').first().locator('button:has-text("Valider…")').click(); await page.waitForTimeout(500);
ok('validation d’une opération à réaliser : l’opérateur prévu est repris', (await pressed(top().locator('.opr-tog', { hasText: 'Thomas Girard' }))) === 'true');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// 7. hygiène
await page.click('#tab-hygiene'); await page.waitForTimeout(300);
await page.locator('main button:has-text("+ Nouvelle entrée")').click(); await page.waitForTimeout(300);
const tg = top().locator('select, input[role=combobox]').nth(2);
await top().locator('.opr-tog', { hasText: 'Thomas Girard' }).click();
const cible = top().locator('input[role=combobox]').first();
if (await cible.count()) await pick(page, cible, 'Cuve 05', 'Cuve 05'); else await top().locator('select').nth(2).selectOption({ index: 1 });
await top().locator('.sheet-f button:text-is("Enregistrer")').click(); await page.waitForTimeout(400);
ok('hygiène : opérateur choisi dans la liste', (await page.locator('main tbody tr').first().innerText()).includes('Thomas G.'), (await page.locator('main tbody tr').first().innerText()).slice(0, 140));

// 8. déclassement : qui décide
await page.click('#tab-ops'); await page.waitForTimeout(300); await page.locator('main [role=tablist] [role=tab]', { hasText: 'Déclassements' }).click(); await page.waitForTimeout(300);
ok('déclassement : « Décision prise par »', (await page.locator('main').innerText()).includes('DÉCISION PRISE PAR') || (await page.locator('main').innerText()).toLowerCase().includes('décision prise par'));
await page.locator('main .opr-tog', { hasText: 'Julien Morel' }).first().click(); await page.waitForTimeout(150);
await page.locator('main button:has-text("Valider le déclassement")').first().click(); await page.waitForTimeout(500);
ok('déclassement : décidé par Julien (historique)', (await page.locator('main tbody tr').first().innerText()).includes('Julien M.'), await page.locator('main tbody tr').first().innerText());

// 9. registres
await page.click('#tab-registres'); await page.click('main button:has-text("Registres (CSV / Excel)")').catch(() => {}); await page.waitForTimeout(400);
ok('registres : journal des opérations avec Opérateur(s)', (await page.locator('main table thead').first().innerText()).toLowerCase().includes('opérateur(s)'));
await page.locator('main button', { hasText: 'Activité des opérateurs' }).click(); await page.waitForTimeout(300);
const act = (await page.locator('main table tbody').innerText());
ok('registre « Activité des opérateurs »', (await page.locator('main table tbody tr').count()) > 10 && act.includes('Julien Morel') && act.includes('Hygiène') && act.includes('Déclassement'), (await page.locator('main table tbody tr').count()));
await page.locator('main button', { hasText: /^Opérateurs/ }).click(); await page.waitForTimeout(300);
ok('registre « Opérateurs »', (await page.locator('main table tbody tr').count()) === 6 && (await page.locator('main table tbody').innerText()).includes('archivé'));

// 10. téléphone : pas de débordement (Société, formulaire)
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
await page.click('#tab-params'); await page.click('main button:has-text("Société & opérateurs")'); await page.waitForTimeout(300);
const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok('téléphone : Société sans débordement horizontal', ov <= 1, ov);
await page.screenshot({ path: SH + '/t30-mobile-societe.png' });
await soutirage();
const ov2 = await page.evaluate(() => { const s = document.querySelector('.overlay:last-child .sheet'); return s ? s.scrollWidth - s.clientWidth : 0; });
ok('téléphone : formulaire et choix des opérateurs sans débordement', ov2 <= 1, ov2);
await top().locator('.opr-pick').first().scrollIntoViewIfNeeded(); await page.screenshot({ path: SH + '/t30-mobile-form.png' });
console.log('ERREURS:', errors.join(' | ') || 'aucune'); if (errors.length) ko++;
await browser.close();
console.log(ko ? `${ko} ÉCHEC(S)` : 'T30 OK');
