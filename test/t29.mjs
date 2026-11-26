// 0.11.0-alpha.1 : stockage sur le Drive (services simulés) — Google Drive (fenêtre GIS), OneDrive (PKCE + If-Match), Dropbox (PKCE + rev, documents)
import fs from 'fs';
import { open } from './ui.mjs';
import { services } from './mocks-cloud.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
const init = () => { localStorage.setItem('oenotrack-config', JSON.stringify({ google: { clientId: 'g-id.apps.googleusercontent.com' }, microsoft: { clientId: 'ms-id' }, dropbox: { appKey: 'dbx-key' } })); };
const vraies = (errs) => errs.filter((x) => !/Failed to load resource: the server responded with a status of (404|409|412)/.test(x)); // réponses « introuvable / conflit » attendues
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗', name, x !== undefined ? `→ ${String(x).replace(/\s+/g, ' ').slice(0, 170)}` : ''); };
const allerSauvegarde = async (page) => { await page.click('#tab-params'); await page.click('main button:has-text("Sauvegarde")'); await page.waitForTimeout(400); };
const toast = async (page) => page.locator('.toast').innerText().catch(() => '');
const etatCarte = async (page) => page.locator('main [data-cloud]').getAttribute('data-cloud').catch(() => '');

// ===== Google Drive =====
{
  const S = services(); const { browser, page, errors } = await open({ https: true, routes: S.routes, init });
  const top = () => page.locator('.overlay').last();
  await allerSauvegarde(page);
  await page.locator('[data-fournisseur="google"] button').click(); await page.waitForTimeout(900);
  const ch = (await top().innerText()).replace(/\s+/g, ' ');
  ok('Google : connexion puis choix du dossier', ch.includes('Choisir le dossier sur Google Drive') && ch.includes('vigneron@gmail.com') && ch.includes('Compta') && ch.includes('Vendanges 2026'), ch.slice(0, 160));
  await top().locator('button', { hasText: 'Partagés avec moi' }).click(); await page.waitForTimeout(400);
  ok('Google : dossiers partagés avec moi', (await top().innerText()).includes('Partagé par le chef de cave'));
  await top().locator('button', { hasText: 'Mon Drive' }).click(); await page.waitForTimeout(400);
  await top().locator('input[aria-label="Nom du nouveau dossier"]').fill('Œnotrack – Domaine'); await top().locator('button', { hasText: 'Créer ici' }).click(); await page.waitForTimeout(700);
  ok('Google : dossier créé et ouvert, prêt', (await top().innerText()).includes('« Œnotrack – Domaine » est prêt'));
  await page.screenshot({ path: SH + '/t29-choix.png' });
  await top().locator('.sheet-f button', { hasText: 'Utiliser' }).click(); await page.waitForTimeout(1500);
  const gb = S.gBase(); const gj = gb && JSON.parse(gb.contenu.toString('utf8'));
  const dos = Object.values(S.google.fichiers).find((f) => f.name === 'Œnotrack – Domaine');
  ok('Google : base écrite dans le dossier choisi', gb && gb.parents[0] === dos.id && gj.format === 'oenotrack-sauvegarde' && gj.sync && gj.documentsSepares && gj.db.ops.length > 50, gb && `${gb.name} v${gb.version}`);
  ok('Google : copie du jour dans historique/', Object.values(S.google.fichiers).some((f) => f.name.startsWith('oenotrack-base-') && f.parents[0] === Object.values(S.google.fichiers).find((x) => x.name === 'historique').id));
  ok('Google : état « à jour »', (await etatCarte(page)) === 'ok' && (await page.locator('[data-cloud-etat]').innerText()).includes('Google Drive · à jour'), await page.locator('[data-cloud-etat]').innerText());
  await page.screenshot({ path: SH + '/t29-google.png' });
  // saisie locale → envoyée seule
  await page.click('main button:has-text("Revendications, stades & listes")'); await page.waitForTimeout(300);
  await page.locator('main input[aria-label^="Nouveau stade"]').fill('Sur lies fines'); await page.locator('main input[aria-label^="Nouveau stade"]').press('Enter'); await page.waitForTimeout(4500);
  ok('Google : saisie envoyée automatiquement', S.gBase().version === 2 && JSON.parse(S.gBase().contenu.toString('utf8')).db.lists.stades.some((x) => x.label === 'Sur lies fines'), `v${S.gBase().version}`);
  // modification faite sur un autre appareil → reçue au retour sur la page
  S.gModifier((d) => { d.contenants.find((c) => c.nom === 'Cuve 05').nom = 'Cuve 05 (tablette)'; });
  await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await page.waitForTimeout(1200);
  ok('Google : modification d’un autre appareil reçue', (await toast(page)).includes('Google Drive') && (await toast(page)).includes('1 contenant'), await toast(page));
  await page.click('#tab-cuverie'); await page.waitForTimeout(300); ok('Google : visible sur le plan', await page.locator('.pitem', { hasText: 'Cuve 05 (tablette)' }).count() >= 1);
  // jeton expiré (1 h) → « se reconnecter » → 1 clic
  await page.evaluate(() => { const g = jetonsLire('google'); g.exp = 0; jetonsEcrire('google', g); window.dispatchEvent(new Event('focus')); }); // 0.38 : jetons dans le coffre de l’appareil (chiffrés) await page.waitForTimeout(800);
  ok('Google : connexion expirée signalée', (await page.locator('[data-cloud-etat]').innerText()).includes('se reconnecter'), await page.locator('[data-cloud-etat]').innerText());
  await page.locator('[data-cloud-etat]').click(); await page.waitForTimeout(1200);
  ok('Google : reconnecté en 1 clic', (await page.locator('[data-cloud-etat]').innerText()).includes('à jour'), await page.locator('[data-cloud-etat]').innerText());
  console.log('ERREURS Google:', vraies(errors).join(' | ') || 'aucune'); if (vraies(errors).length) ko++; await browser.close();
}

// ===== OneDrive : connexion par redirection (PKCE), dossier existant avec des données, écriture conditionnelle =====
{
  const S = services(); const fx = fs.readFileSync(new URL('./fixtures/sync-drive-0.10.0-alpha.1.json', import.meta.url), 'utf8'); S.msSemer('Œnotrack', fx);
  const { browser, page, errors } = await open({ https: true, routes: S.routes, init });
  const top = () => page.locator('.overlay').last();
  await allerSauvegarde(page);
  await page.locator('[data-fournisseur="onedrive"] button').click(); await page.waitForTimeout(2200);
  ok('OneDrive : PKCE (S256), droits et adresse de retour', S.msAuth && S.msAuth.code_challenge_method === 'S256' && /Files\.ReadWrite\.All/.test(S.msAuth.scope) && S.msAuth.redirect_uri === 'https://app.test/' && S.msToken && S.msToken.code_verifier && S.msToken.grant_type === 'authorization_code', S.msAuth && S.msAuth.scope);
  const ch = (await top().innerText()).replace(/\s+/g, ' ');
  ok('OneDrive : retour dans Œnotrack, choix du dossier', ch.includes('Choisir le dossier sur OneDrive') && ch.includes('vigneron@outlook.fr') && ch.includes('Cave') && ch.includes('Œnotrack'), ch.slice(0, 160));
  await top().locator('.cloud-item', { hasText: 'Œnotrack' }).click(); await page.waitForTimeout(900);
  ok('OneDrive : dossier avec des données détecté', (await top().innerText()).includes('contient déjà des données Œnotrack'));
  await top().locator('.sheet-f button', { hasText: 'Utiliser' }).click(); await page.waitForTimeout(1800);
  ok('OneDrive : données du dossier reprises (appareil avec l’exemple)', (await toast(page)).includes('reprises sur cet appareil') && await page.locator('text=Jeu de données d’exemple chargé').count() === 0, await toast(page));
  const e0 = S.msBase().eTag;
  // saisie ici + modification sur un autre appareil avant l'envoi → 412 → relecture, réunion, réécriture
  await page.click('#tab-params'); await page.click('main button:has-text("Revendications, stades & listes")'); await page.waitForTimeout(300);
  await page.locator('main input[aria-label^="Nouveau stade"]').fill('Sur latte'); await page.locator('main input[aria-label^="Nouveau stade"]').press('Enter'); await page.waitForTimeout(300);
  S.msModifier((d) => { d.contenants.find((c) => c.nom === 'Cuve 03').nom = 'Cuve 03 (bureau)'; });
  await page.waitForTimeout(5000);
  const fin = JSON.parse(S.msBase().contenu.toString('utf8'));
  ok('OneDrive : écriture conditionnelle refusée puis réunion des deux saisies', S.appels.some((a) => /PUT .*oenotrack-base\.json:\/content/.test(a)) && fin.db.lists.stades.some((x) => x.label === 'Sur latte') && fin.db.contenants.some((c) => c.nom === 'Cuve 03 (bureau)') && S.msBase().eTag !== e0, fin.sync.appareilNom);
  await page.click('#tab-cuverie'); await page.waitForTimeout(300); ok('OneDrive : modification de l’autre appareil visible', await page.locator('.pitem', { hasText: 'Cuve 03 (bureau)' }).count() >= 1);
  console.log('ERREURS OneDrive:', vraies(errors).join(' | ') || 'aucune'); if (vraies(errors).length) ko++; await browser.close();
}

// ===== Dropbox : PKCE hors ligne (jeton renouvelable), dossier vide, document joint =====
{
  const S = services(); const { browser, page, errors } = await open({ https: true, routes: S.routes, init });
  const top = () => page.locator('.overlay').last();
  await allerSauvegarde(page);
  await page.locator('[data-fournisseur="dropbox"] button').click(); await page.waitForTimeout(2200);
  ok('Dropbox : PKCE avec jeton renouvelable', S.dbxAuth && S.dbxAuth.token_access_type === 'offline' && S.dbxAuth.code_challenge_method === 'S256' && S.dbxToken && S.dbxToken.code_verifier, S.dbxAuth && S.dbxAuth.redirect_uri);
  await top().locator('.cloud-item', { hasText: 'Cave' }).click(); await page.waitForTimeout(900);
  await top().locator('.sheet-f button', { hasText: 'Utiliser' }).click(); await page.waitForTimeout(1800);
  ok('Dropbox : base écrite dans /Cave', !!S.dbx.f['/cave/oenotrack-base.json'] && Object.keys(S.dbx.f).some((k) => k.startsWith('/cave/historique/')), Object.keys(S.dbx.f).filter((k) => k.startsWith('/cave')).join(', '));
  // un document joint part dans documents/
  await page.click('#tab-ops'); await page.waitForTimeout(300);
  await page.locator('main tbody tr').first().locator('button[aria-label*="ocument"], button:has-text("📎")').first().click(); await page.waitForTimeout(500);
  const inp = top().locator('input[type=file]').first();
  await inp.setInputFiles({ name: 'bon de livraison.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') }); await page.waitForTimeout(800);
  await page.keyboard.press('Escape'); await page.waitForTimeout(4500);
  const docs = Object.keys(S.dbx.f).filter((k) => k.startsWith('/cave/documents/'));
  ok('Dropbox : document joint envoyé dans documents/', docs.length === 1 && /\.pdf$/.test(docs[0]) && S.dbx.f[docs[0]].contenu.toString() === '%PDF-1.4 test', docs.join(', '));
  const b = JSON.parse(S.dbx.f['/cave/oenotrack-base.json'].contenu.toString('utf8'));
  ok('Dropbox : base à jour avec le document', (b.db.docs || []).some((d) => d.nom === 'bon de livraison.pdf') && b.fichiers.length === 0);
  await allerSauvegarde(page); await page.screenshot({ path: SH + '/t29-dropbox.png' });
  console.log('ERREURS Dropbox:', vraies(errors).join(' | ') || 'aucune'); if (vraies(errors).length) ko++; await browser.close();
}
console.log(ko ? `${ko} ÉCHEC(S)` : 'T29 OK');
