// 0.10.0-alpha.1 : synchronisation Drive par glisser-déposer (fusion à trois voies, conflits, mise à jour automatique simulée)
import { open } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const init = () => {
  window.__saved = []; delete window.showSaveFilePicker;
  const downloads = { save: async ({ filename, data }) => { const text = typeof data === 'string' ? data : await data.text(); window.__saved.push({ filename, text }); return { status: 'saved' }; } };
  window.claude = { use: async (n) => (n === 'downloads' ? downloads : null) };
  // fichier « relié » simulé (File System Access) : contenu en mémoire, autorisation demandée puis accordée
  window.__fake = { text: '', lm: 1000, perm: 'prompt', writes: 0 };
  const fake = { kind: 'file', name: 'Oenotrack-exploitation.json',
    getFile: async () => new File([window.__fake.text], 'Oenotrack-exploitation.json', { type: 'application/json', lastModified: window.__fake.lm }),
    createWritable: async () => { let buf = ''; return { write: async (t) => { buf += typeof t === 'string' ? t : await t.text(); }, close: async () => { window.__fake.text = buf; window.__fake.lm += 1000; window.__fake.writes += 1; } }; },
    queryPermission: async () => window.__fake.perm, requestPermission: async () => { window.__fake.perm = 'granted'; return 'granted'; } };
  window.__useFake = false;
  const orig = DataTransferItem.prototype.getAsFileSystemHandle;
  DataTransferItem.prototype.getAsFileSystemHandle = function () { return window.__useFake ? Promise.resolve(fake) : (orig ? orig.call(this) : Promise.resolve(null)); };
};
const { browser, page, errors } = await open({ init });
const top = () => page.locator('.overlay').last();
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗', name, x !== undefined ? `→ ${String(x).replace(/\s+/g, ' ').slice(0, 160)}` : ''); };
const deposer = async (text, name = 'Oenotrack-exploitation.json', type = 'application/json') => page.evaluate(({ text, name, type }) => {
  const dt = new DataTransfer(); dt.items.add(new File([text], name, { type, lastModified: Date.now() }));
  for (const t of ['dragenter', 'dragover', 'drop']) document.querySelector('main').dispatchEvent(new DragEvent(t, { bubbles: true, cancelable: true, dataTransfer: dt }));
}, { text, name, type });
const modifier = (text, fn, meta) => { const j = JSON.parse(text); fn(j.db); j.db.meta.modifLe = '2099-01-01T00:00:00.000Z'; j.sync = { id: meta.id, ancetres: [JSON.parse(text).sync.id, ...(JSON.parse(text).sync.ancetres || [])], appareil: 'zzz', appareilNom: meta.nom || 'Tablette chai', ecritLe: new Date().toISOString() }; return JSON.stringify(j); };
const puce = async () => (await page.locator('[data-drive-etat]').innerText().catch(() => '—'));
const carte = () => page.locator('main section.sync-card[aria-labelledby="svd"]'); // carte « Synchronisation par fichier » (la carte « Stockage sur votre Drive » est au-dessus)

// 1. Paramètres › Sauvegarde & Drive : créer le fichier de synchronisation (téléchargement dans claude.ai)
await page.click('#tab-params'); await page.click('main button:has-text("Sauvegarde")'); await page.waitForTimeout(300);
ok('carte de synchronisation', await carte().count() === 1 && (await carte().locator('h3').innerText()).includes('Synchronisation par fichier'));
await page.screenshot({ path: SH + '/t28-carte.png' });
await page.click('main button:has-text("Créer le fichier de synchronisation")'); await page.waitForTimeout(800);
const f0 = await page.evaluate(() => window.__saved[0]); const j0 = JSON.parse(f0.text);
ok('fichier créé (format sauvegarde + en-tête sync)', f0.filename === 'Oenotrack-exploitation.json' && j0.format === 'oenotrack-sauvegarde' && j0.sync && j0.sync.id && j0.db.ops.length > 50, `${f0.filename} · ${j0.sync && j0.sync.appareilNom}`);
ok('état : à jour', (await carte().locator('.sync-etat').innerText()).includes('Fichier à jour envoyé') && (await puce()).includes('Drive à jour'), await puce());
// 2. modification locale (nouveau stade) → « à envoyer »
await page.click('main button:has-text("Revendications, stades & listes")'); await page.waitForTimeout(300);
await page.locator('main input[aria-label^="Nouveau stade"]').fill('Sur lies fines'); await page.locator('main input[aria-label^="Nouveau stade"]').press('Enter'); await page.waitForTimeout(300);
ok('puce : modification à envoyer', (await puce()).includes('à envoyer'), await puce());
// 3. le fichier a été modifié sur la tablette : un contenant renommé, une analyse ajoutée, une opération supprimée
const r1 = modifier(f0.text, (d) => { d.contenants.find((c) => c.nom === 'Cuve 01').nom = 'Cuve 01 inox'; d.analyses.push({ ...d.analyses[0], id: 'an900-zzz', date: '2026-11-17' }); d.ops = d.ops.filter((o) => o.type !== 'suivi' || o.sousType !== 'batonnage'); }, { id: 'sTAB1' });
await deposer(r1); await page.waitForTimeout(800);
const rap = (await top().innerText()).replace(/\s+/g, ' ').toLowerCase();
ok('rapport : reçu du Drive', rap.includes('reçu du drive') && rap.includes('1 contenant') && rap.includes('1 analyse') && rap.includes('1 opération') && !rap.includes('réglage'), rap.slice(rap.indexOf('reçu'), rap.indexOf('reçu') + 120));
ok('rapport : gardé de cet appareil', rap.includes('gardé de cet appareil') && rap.includes('1 élément de liste'), rap.slice(rap.indexOf('gardé'), rap.indexOf('gardé') + 80));
await page.screenshot({ path: SH + '/t28-rapport.png' });
await top().locator('button:has-text("Synchroniser")').last().click(); await page.waitForTimeout(600);
ok('toast de synchronisation', (await page.locator('.toast').innerText().catch(() => '')).includes('Synchronisé'), await page.locator('.toast').innerText().catch(() => ''));
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
ok('plan : contenant renommé reçu', await page.locator('.pitem', { hasText: 'Cuve 01 inox' }).count() >= 1);
ok('puce : à envoyer (le stade local n’est pas encore dans le fichier)', (await puce()).includes('à envoyer'), await puce());
// 4. renvoyer vers le Drive : lignée conservée
await page.click('#tab-params'); await page.click('main button:has-text("Sauvegarde")'); await page.waitForTimeout(300);
await page.click('main button:has-text("Envoyer vers Google Drive")'); await page.waitForTimeout(800);
const f1 = await page.evaluate(() => window.__saved[window.__saved.length - 1]); const j1 = JSON.parse(f1.text);
ok('fichier renvoyé : lignée + modifications des deux côtés', j1.sync.ancetres[0] === 'sTAB1' && j1.db.lists.stades.some((x) => x.label === 'Sur lies fines') && j1.db.contenants.some((c) => c.nom === 'Cuve 01 inox'), j1.sync.ancetres.slice(0, 3).join(' < '));
ok('puce : à jour', (await puce()).includes('à jour'), await puce());
// 5. conflit : le même contenant modifié des deux côtés → version la plus récente (Drive) gardée, l'autre au journal
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await page.locator('.pitem', { hasText: 'Cuve 02' }).first().click({ button: 'right' }); await page.waitForTimeout(300);
await page.locator('.ctxmenu .mi', { hasText: 'Modifier le contenant' }).click(); await page.waitForTimeout(300);
await top().locator('input').first().fill('Cuve 02 bureau'); await top().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(300);
const r2 = modifier(f1.text, (d) => { d.contenants.find((c) => c.nom === 'Cuve 02').nom = 'Cuve 02 tablette'; }, { id: 'sTAB2' });
await deposer(r2); await page.waitForTimeout(800);
const rap2 = (await top().innerText()).replace(/\s+/g, ' ');
ok('rapport : 1 conflit annoncé', rap2.includes('1 conflit') && rap2.includes('Cuve 02'), rap2.slice(rap2.indexOf('conflit') - 5, rap2.indexOf('conflit') + 120));
await top().locator('button:has-text("Synchroniser")').last().click(); await page.waitForTimeout(600);
await page.click('#tab-params'); await page.click('main button:has-text("Sauvegarde")'); await page.waitForTimeout(300);
await page.locator('main summary', { hasText: 'Journal des conflits' }).click(); await page.waitForTimeout(200);
const jr = (await carte().innerText()).replace(/\s+/g, ' ');
ok('journal : version du Drive gardée', jr.includes('Cuve 02 tablette') && jr.includes('version du Drive gardée'), jr.slice(jr.indexOf('Journal'), jr.indexOf('Journal') + 160));
await page.locator('main button:has-text("Reprendre l’autre version")').first().click(); await page.waitForTimeout(400);
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
ok('journal : autre version reprise', await page.locator('.pitem', { hasText: 'Cuve 02 bureau' }).count() >= 1);
// 6. fichier relié (navigateur compatible, simulé) : dépôt → autorisation → écrit tout seul, reçoit tout seul
await page.click('#tab-params'); await page.click('main button:has-text("Sauvegarde")'); await page.waitForTimeout(300);
await page.click('main button:has-text("Envoyer vers Google Drive")'); await page.waitForTimeout(700);
const f2 = await page.evaluate(() => window.__saved[window.__saved.length - 1].text);
await page.evaluate((t) => { window.__fake.text = t; window.__fake.lm = 5000; window.__useFake = true; }, f2);
await deposer(f2); await page.waitForTimeout(800);
const rap3 = (await top().innerText()).replace(/\s+/g, ' '); ok('fichier relié : déjà à jour → « Lier ce fichier »', rap3.includes('Déjà à jour') && rap3.includes('Lier ce fichier'), rap3.slice(0, 120));
await top().locator('button:has-text("Lier ce fichier")').click(); await page.waitForTimeout(500);
await page.click('main button:has-text("Activer la mise à jour automatique")'); await page.waitForTimeout(1500);
ok('mise à jour automatique activée', (await carte().locator('.sync-etat').innerText()).includes('mise à jour automatique') && (await puce()).includes('synchronisé'), await puce());
// modification locale → le fichier est réécrit seul (après 2,5 s)
const w0 = await page.evaluate(() => window.__fake.writes);
await page.click('main button:has-text("Revendications, stades & listes")'); await page.waitForTimeout(300);
await page.locator('main input[aria-label^="Nouveau stade"]').fill('Sur latte'); await page.locator('main input[aria-label^="Nouveau stade"]').press('Enter'); await page.waitForTimeout(3800);
const fk = await page.evaluate(() => ({ writes: window.__fake.writes, j: JSON.parse(window.__fake.text) }));
ok('écriture automatique du fichier', fk.writes > w0 && fk.j.db.lists.stades.some((x) => x.label === 'Sur latte'), `${fk.writes} écriture(s)`);
// changement fait sur un autre appareil → reçu au retour sur la page
const r3 = modifier(JSON.stringify(fk.j), (d) => { d.contenants.find((c) => c.nom === 'Cuve 03').nom = 'Cuve 03 (autre poste)'; }, { id: 'sPC2', nom: 'PC du bureau' });
await page.evaluate((t) => { window.__fake.text = t; window.__fake.lm += 1000; window.dispatchEvent(new Event('focus')); }, r3); await page.waitForTimeout(1200);
ok('réception automatique', (await page.locator('.toast').innerText().catch(() => '')).includes('Drive') , await page.locator('.toast').innerText().catch(() => ''));
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
ok('plan : modification de l’autre poste', await page.locator('.pitem', { hasText: 'Cuve 03 (autre poste)' }).count() >= 1);
// 7. fichier qui n'est pas Œnotrack
await deposer('%PDF-1.4', 'certificat.pdf', 'application/pdf'); await page.waitForTimeout(300);
ok('fichier non Œnotrack refusé', (await page.locator('.toast').innerText().catch(() => '')).includes('fichier Œnotrack'));
await page.click('#tab-params'); await page.click('main button:has-text("Sauvegarde")'); await page.waitForTimeout(300); await page.screenshot({ path: SH + '/t28-auto.png' });
console.log(ko ? `${ko} ÉCHEC(S)` : 'T28 OK'); console.log('ERREURS:', errors.join('\n') || 'aucune'); await browser.close();
