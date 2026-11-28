// 0.28.0-alpha.1 : impression directe et PDF en parallèle — « 🖨 Imprimer » ouvre la boîte d'impression de l'appareil et n'imprime
// que le document (zone d'impression), « ⬇ PDF » enregistre le fichier ; là où l'impression est bloquée (aperçu dans claude.ai), le
// PDF prend le relais (partagé sur téléphone : Partager › Imprimer). Clés d'accès : appareil activé depuis le compte, accepté par un
// administrateur, connexion et déverrouillage par empreinte, visage ou code PIN (authentificateur virtuel de Chromium), mot de passe
// toujours possible ; aperçu non sécurisé (http) : explication. Données fictives (jeu d'exemple).
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 900) : ''); };
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
// impression simulée : « ok » (boîte ouverte puis fermée), « bloque » (rien ne s'ouvre, comme dans un cadre sans droit d'impression),
// « garde » (boîte ouverte, pas encore fermée) ; enregistrements et partages relevés
const init = () => {
  window.__saved = []; window.__imp = []; window.__mode = 'ok'; window.__partages = [];
  window.claude = { use: async (n) => (n === 'downloads' ? { save: async ({ filename, data }) => { window.__saved.push({ filename, taille: (data && (data.size || data.length)) || 0 }); return { status: 'saved' }; } } : null) };
  window.print = () => {
    if (window.__mode === 'bloque') return;
    window.dispatchEvent(new Event('beforeprint'));
    const z = document.getElementById('zone-impression');
    window.__imp.push({ classe: document.documentElement.className, titre: document.title, texte: z ? z.textContent.replace(/\s+/g, ' ').slice(0, 600) : null, n: z ? z.children.length : 0, format: z ? z.dataset.format || '' : '' });
    if (window.__mode === 'ok') window.dispatchEvent(new Event('afterprint'));
  };
};
{
  const { browser, page, errors } = await open({ init, viewport: { width: 1360, height: 900 }, date: '2026-11-21T10:00:00' });
  const ov = () => page.locator('.overlay').last();
  const etat = () => page.evaluate(() => ({ imp: window.__imp, saved: window.__saved, zone: !!document.getElementById('zone-impression'), classe: document.documentElement.className, titre: document.title }));
  const toasts = async () => page.locator('.toast').allInnerTexts();
  const titre0 = await page.title();
  // 1. bon de pesée : impression directe
  await page.click('#tab-pressoir'); await page.waitForTimeout(400);
  await page.locator('[aria-label="Année des vendanges"]').selectOption('2026'); await page.waitForTimeout(250);
  await page.locator('main [data-bon-pesee-btn]:visible').first().click(); await page.waitForTimeout(400);
  const pied = await txt(ov().locator('.sheet-f'));
  ok('bon de pesée : « ⬇ HTML », « ⬇ PDF » et « 🖨 Imprimer » (principal) côte à côte', /⬇ HTML/.test(pied) && /⬇ PDF/.test(pied) && /🖨 Imprimer/.test(pied) && (await ov().locator('[data-sortie-imprimer].btn-primary').count()) === 1, pied);
  await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1200);
  let e = await etat();
  ok('« 🖨 Imprimer » : boîte d’impression ouverte avec le seul bon (zone d’impression, titre du document), rien d’enregistré', e.imp.length === 1 && /impression-zone/.test(e.imp[0].classe) && e.imp[0].n === 1 && /pesée/i.test(e.imp[0].texte) && e.imp[0].titre !== titre0 && !e.saved.length, e);
  ok('… puis la page revient à l’écran (zone retirée, titre rétabli)', !e.zone && !/impression-zone/.test(e.classe) && e.titre === titre0, e);
  // 2. rendu imprimé : seul le document est imprimé
  await page.evaluate(() => { window.__mode = 'garde'; });
  await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(300);
  await page.emulateMedia({ media: 'print' });
  const rendu = await page.evaluate(() => { const z = document.getElementById('zone-impression'); const autres = Array.from(document.body.children).filter((x) => x !== z && x.tagName !== 'SCRIPT'); return { zone: z ? getComputedStyle(z).display : 'absente', masques: autres.every((x) => getComputedStyle(x).display === 'none'), n: autres.length }; });
  await page.screenshot({ path: SC + '/shots/t55-impression.png' });
  await page.emulateMedia({ media: 'screen' });
  ok('rendu imprimé : la zone du document seule (tout le reste masqué)', rendu.zone !== 'none' && rendu.zone !== 'absente' && rendu.masques && rendu.n >= 1, rendu);
  ok('… à l’écran, la zone reste invisible pendant la boîte', await page.evaluate(() => getComputedStyle(document.getElementById('zone-impression')).display === 'none'));
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint'))); await page.waitForTimeout(700);
  ok('… boîte fermée : zone retirée', !(await etat()).zone);
  // 3. impression bloquée : le PDF prend le relais
  await page.evaluate(() => { window.__mode = 'bloque'; window.__imp = []; });
  await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(4500);
  e = await etat(); let T = await toasts();
  ok('impression bloquée (aperçu claude.ai) : PDF enregistré à la place, avec l’explication', e.saved.length === 1 && /\.pdf$/.test(e.saved[0].filename) && e.saved[0].taille > 1000 && T.some((x) => /Impression directe impossible dans cette vue : le PDF est enregistré/.test(x)) && !e.zone, [e, T]);
  // 4. « ⬇ PDF » en parallèle ; « ⬇ HTML »
  await page.evaluate(() => { window.__mode = 'ok'; window.__saved = []; });
  await ov().locator('[data-sortie-pdf]').click(); await page.waitForTimeout(3500);
  e = await etat(); T = await toasts();
  ok('« ⬇ PDF » : PDF enregistré (« PDF enregistré. »), sans boîte d’impression', e.saved.length === 1 && /^bon-pesee-.*\.pdf$/.test(e.saved[0].filename) && !e.imp.length && T.some((x) => /PDF enregistré\./.test(x)), [e, T]);
  await ov().locator('button', { hasText: '⬇ HTML' }).click(); await page.waitForTimeout(800);
  e = await etat(); ok('« ⬇ HTML » : page web enregistrée', e.saved.some((x) => /\.html$/.test(x.filename)), e.saved);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  // 5. ailleurs : rapport de traçabilité, plan de cave (A3), fiche d'enregistrement, chaîne de traçabilité
  await page.evaluate(() => { window.__imp = []; window.__saved = []; });
  await page.click('#tab-cuverie'); await page.waitForTimeout(400);
  await page.locator('main button', { hasText: '🖨 Imprimer le plan' }).first().click(); await page.waitForTimeout(800);
  const piedPlan = await txt(ov().locator('.sheet-f'));
  ok('plan de cave : « N page(s) de plan · « ⬇ PDF » en parallèle de l’impression »', /\d+ pages? de plan · « ⬇ PDF » en parallèle de l’impression\./.test(piedPlan), piedPlan);
  const a3 = ov().locator('select').filter({ has: page.locator('option[value="A3"]') }).first();
  if (await a3.count()) { await a3.selectOption('A3'); await page.waitForTimeout(300); }
  await ov().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(1500);
  e = await etat();
  ok('… « 🖨 Imprimer » : une page par site, au format A3 choisi', e.imp.length === 1 && e.imp[0].n >= 1 && (!(await a3.count()) || e.imp[0].format === 'A3'), e.imp);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  await page.click('#tab-previsions'); await page.waitForTimeout(400);
  await page.locator('main [role=tab]', { hasText: 'Modèles de fiches' }).click(); await page.waitForTimeout(400);
  const bf = page.locator('main button[title="Fiche à remplir entièrement à la main"]').first();
  if (await bf.count()) {
    await bf.click(); await page.waitForTimeout(700);
    ok('fiche d’enregistrement : aide « 🖨 Imprimer » / « ⬇ PDF »', /« 🖨 Imprimer » ouvre la boîte d’impression ; « ⬇ PDF » enregistre le fichier\./.test(await txt(ov().locator('.sheet-f'))));
    await page.evaluate(() => { window.__imp = []; });
    await ov().locator('.sheet-f button', { hasText: '🖨 Imprimer' }).click(); await page.waitForTimeout(1500);
    e = await etat(); ok('… imprimée directement (fiche seule)', e.imp.length === 1 && e.imp[0].n === 1 && !e.saved.some((x) => /\.pdf$/.test(x.filename)), e.imp);
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  } else ok('fiche d’enregistrement : modèle de fiche vierge', false);
  await page.click('#tab-trace'); await page.waitForTimeout(400);
  await page.locator('input[aria-label="Rechercher une étape"]').fill('LF-26-001'); await page.waitForTimeout(400);
  await page.locator('[data-resultat]').first().click(); await page.waitForTimeout(500);
  await page.evaluate(() => { window.__imp = []; });
  await page.locator('[data-chaine] [data-sortie-imprimer], main [data-sortie-imprimer]').first().click(); await page.waitForTimeout(1500);
  e = await etat(); ok('chaîne de traçabilité : imprimée directement', e.imp.length === 1 && /LF-26-001/.test(e.imp[0].texte), e.imp);
  ok('aucune erreur de page (impression)', errors.length === 0, errors);
  await browser.close();
}
// 6. téléphone (Android) : impression bloquée → PDF partagé (Partager › Imprimer)
{
  const initTel = () => {
    window.__partages = []; window.__saved = [];
    window.print = () => {}; // vue sans impression
    Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36' });
    navigator.canShare = (x) => !!(x && x.files && x.files.length);
    navigator.share = async (x) => { window.__partages.push({ n: x.files.length, nom: x.files[0].name, type: x.files[0].type, taille: x.files[0].size }); };
    window.claude = { use: async (n) => (n === 'downloads' ? { save: async ({ filename }) => { window.__saved.push(filename); return { status: 'saved' }; } } : null) };
  };
  const { browser, page, errors } = await open({ init: initTel, viewport: { width: 400, height: 860 }, mobile: true, date: '2026-11-21T10:00:00' });
  await page.locator('#tab-pressoir').click(); await page.waitForTimeout(400);
  await page.locator('[aria-label="Année des vendanges"]').selectOption('2026'); await page.waitForTimeout(250);
  await page.locator('main [data-bon-pesee-btn]:visible').first().click(); await page.waitForTimeout(400);
  await page.locator('.overlay').last().locator('[data-sortie-imprimer]').click(); await page.waitForTimeout(4500);
  const p = await page.evaluate(() => ({ partages: window.__partages, saved: window.__saved }));
  ok('téléphone : impression impossible dans la vue → PDF proposé au partage (Imprimer depuis Partager), pas de fichier en plus', p.partages.length === 1 && p.partages[0].type === 'application/pdf' && /\.pdf$/.test(p.partages[0].nom) && p.partages[0].taille > 1000 && !p.saved.length, p);
  ok('aucune erreur de page (téléphone)', errors.length === 0, errors);
  await browser.close();
}
// 7. clés d'accès : page sécurisée (https), authentificateur virtuel (empreinte vérifiée)
{
  const { browser, page, errors, ctx } = await open({ https: true, viewport: { width: 1360, height: 900 } });
  const ov = () => page.locator('.overlay').last();
  const db = () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
  const toasts = async () => page.locator('.toast').allInnerTexts();
  const cdp = await ctx.newCDPSession(page); await cdp.send('WebAuthn.enable');
  const { authenticatorId } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  // options demandées au navigateur (authentificateur intégré ou externe), relevées à chaque appel
  await page.evaluate(() => { window.__webauthn = []; const c = navigator.credentials; const cr = c.create.bind(c); const gt = c.get.bind(c);
    c.create = (o) => { window.__webauthn.push({ quoi: 'create', sel: o.publicKey.authenticatorSelection, hints: o.publicKey.hints, exclure: (o.publicKey.excludeCredentials || []).map((x) => x.transports || null) }); return cr(o); };
    c.get = (o) => { window.__webauthn.push({ quoi: 'get', hints: o.publicKey.hints || null, transports: (o.publicKey.allowCredentials || []).map((x) => x.transports || null) }); return gt(o); }; });
  const wa = () => page.evaluate(() => window.__webauthn);
  const params = async (s) => { await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: s }).first().click(); await page.waitForTimeout(350); };
  await params('Utilisateurs & droits');
  const fa = page.locator('main [data-activation] form'); const MDP = 'Essai-2026!zz';
  await fa.locator('input[aria-label="Identifiant"]').fill('admin'); await fa.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Admin Essai');
  await fa.locator('input[aria-label="Mot de passe"]').fill(MDP); await fa.locator('input[aria-label="Confirmer le mot de passe"]').fill(MDP);
  await fa.locator('button[type=submit]').click(); await page.waitForTimeout(1800);
  await ov().locator('label', { hasText: 'J’ai noté ce code' }).locator('input').check(); await ov().locator('button:text-is("Terminer")').click(); await page.waitForTimeout(400);
  let t = (await page.locator('[data-appareils]').innerText()).replace(/\s+/g, ' ');
  ok('Utilisateurs & droits : « Appareils acceptés (clés d’accès) », réglages et activation sur cet appareil', /Connexion par empreinte, visage ou code PIN/.test(t) && /Chaque nouvel appareil doit être accepté par un administrateur/.test(t) && (await page.locator('[data-cle-ajouter]').count()) >= 1 && /Aucun appareil enregistré/.test(t), t.slice(0, 500));
  await page.locator('[data-cle-ajouter]').first().click(); await page.waitForTimeout(1800);
  let d = await db(); const u0 = d.utilisateurs[0];
  ok('administrateur : appareil activé (clé publique ES256, domaine), accepté d’office', (u0.cles || []).length === 1 && u0.cles[0].acceptee === true && u0.cles[0].alg === -7 && u0.cles[0].rp === 'app.test' && !!u0.cles[0].cle && (await toasts()).some((x) => /Appareil enregistré : connexion simplifiée activée\./.test(x)), u0.cles);
  let w = await wa();
  ok('« Activer sur cet appareil » : authentificateur intégré demandé (empreinte, visage, code PIN — pas seulement USB / NFC / autre appareil), clé découvrable', w.length === 1 && w[0].sel.authenticatorAttachment === 'platform' && w[0].sel.residentKey === 'required' && w[0].sel.userVerification === 'required' && JSON.stringify(w[0].hints) === '["client-device"]', w);
  ok('… clé enregistrée comme intégrée, avec ses transports (internal)', u0.cles[0].type === 'appareil' && (u0.cles[0].transports || []).includes('internal'), u0.cles[0]);
  ok('… deux choix : cet appareil, ou clé de sécurité / autre téléphone', (await page.locator('[data-appareils] [data-cle-ajouter-externe]').count()) === 1 && /＋ Clé de sécurité ou autre téléphone/.test(await txt(page.locator('[data-appareils]'))));
  ok('… journal des accès : « Clé d’accès ajoutée »', (d.audit || []).some((a) => a.action === 'cle' && /Clé d’accès ajoutée/.test(a.resume)));
  // un opérateur : son appareil attend l'accord de l'administrateur
  await page.locator('main button', { hasText: '＋ Nouvel utilisateur' }).first().click(); await page.waitForTimeout(400);
  let f = ov(); await f.locator('input[aria-label="Identifiant"]').fill('chai'); await f.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Opérateur Essai');
  await f.locator('input[aria-label="Mot de passe provisoire"]').fill('Chai-2026!zz'); await f.locator('select[aria-label="Profil de droits"]').selectOption('pf_operateur');
  await f.locator('label', { hasText: 'À changer à la première connexion' }).locator('input').uncheck();
  await f.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(1500);
  d = await db(); const op = d.utilisateurs.find((u) => u.identifiant === 'chai');
  ok('opérateur créé', !!op && op.profilId === 'pf_operateur', d.utilisateurs.map((u) => [u.identifiant, u.profilId]));
  // déconnexion, connexion de l'opérateur par mot de passe, activation de son appareil (authentificateur distinct)
  // l'opérateur a son propre appareil : clé de sécurité USB avec code PIN (comme sous Linux), l'empreinte de l'administrateur n'est plus là
  await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId });
  const { authenticatorId: auth2 } = await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'usb', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
  await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(600);
  const cx = page.locator('[data-connexion]');
  ok('écran de connexion : « 🔑 Se connecter par empreinte, visage ou code PIN » (un appareil accepté)', (await page.locator('[data-cle-connexion]').count()) === 1 && /🔑 Se connecter par empreinte, visage ou code PIN/.test(await txt(page.locator('[data-cle-connexion]'))));
  await cx.locator('input[aria-label="Identifiant"]').fill('chai'); await cx.locator('input[aria-label="Mot de passe"]').fill('Chai-2026!zz'); await cx.locator('button[type=submit]').click(); await page.waitForTimeout(1500);
  if (await page.locator('.overlay').count() && /nouveau mot de passe/i.test(await txt(ov()))) { const o = ov(); const ins = o.locator('input[type=password]'); for (let k = 0; k < await ins.count(); k++) await ins.nth(k).fill('Chai-2027!zz'); await o.locator('.btn-primary').last().click(); await page.waitForTimeout(1500); }
  ok('opérateur connecté par mot de passe', (await page.locator('[data-utilisateur]').count()) === 1);
  await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(300);
  const mc = ov().locator('[data-mes-cles]');
  ok('« Mon compte » : connexion simplifiée, « ＋ Activer sur cet appareil (…) » et « ＋ Clé de sécurité ou autre téléphone »', (await mc.count()) === 1 && /Connexion simplifiée \(clés d’accès\)/i.test(await txt(mc)) && (await mc.locator('[data-cle-ajouter]').count()) === 1 && (await mc.locator('[data-cle-ajouter-externe]').count()) === 1);
  await mc.locator('[data-cle-ajouter-externe]').click(); await page.waitForTimeout(1800);
  d = await db(); const opk = d.utilisateurs.find((u) => u.identifiant === 'chai').cles || [];
  w = await wa();
  ok('clé de sécurité : authentificateur externe demandé (USB, NFC, QR code), enregistrée comme externe', w[w.length - 1].sel.authenticatorAttachment === 'cross-platform' && opk.length === 1 && opk[0].type === 'externe' && opk[0].nom === 'Clé de sécurité' && (opk[0].transports || []).includes('usb'), [w[w.length - 1], opk]);
  ok('opérateur : appareil enregistré, en attente d’un administrateur', opk.length === 1 && opk[0].acceptee === false && (await toasts()).some((x) => /un administrateur doit l’accepter/.test(x)) && /en attente d’un administrateur/.test(await txt(ov().locator('[data-mes-cles]'))), opk);
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(600);
  // l'appareil de l'opérateur n'est pas encore accepté : bouton seulement si un appareil accepté existe pour ce domaine (administrateur, retiré du navigateur)
  await page.locator('[data-cle-connexion]').click(); await page.waitForTimeout(2500);
  // la seule clé acceptée est intégrée à l'appareil de l'administrateur (transport internal) : la clé USB de l'opérateur n'est pas sollicitée,
  // la demande reste ouverte (le système affiche « aucune clé d'accès ») ou échoue ; la demande suivante l'annule
  ok('… clé non acceptée : connexion refusée (« attend l’accord d’un administrateur », appareil inconnu ou demande sans réponse)', (await page.locator('[data-utilisateur]').count()) === 0 && ((await page.locator('[data-connexion] [role=alert], [data-connexion] .text-bad').count()) >= 1 || /Vérification sur l’appareil/.test(await txt(page.locator('[data-cle-connexion]')))), await page.locator('[data-connexion]').innerText());
  // l'administrateur accepte l'appareil (connexion par mot de passe)
  await cx.locator('input[aria-label="Identifiant"]').fill('admin'); await cx.locator('input[aria-label="Mot de passe"]').fill(MDP); await cx.locator('button[type=submit]').click(); await page.waitForTimeout(1500);
  await params('Utilisateurs & droits');
  t = (await page.locator('[data-appareils]').innerText()).replace(/\s+/g, ' ');
  ok('administrateur : « — 1 en attente », bouton « Accepter »', /Appareils acceptés \(clés d’accès\) — 1 en attente/.test(await txt(page.locator('main'))) && (await page.locator(`[data-appareil="${opk[0].id}"] button`, { hasText: 'Accepter' }).count()) === 1, t.slice(0, 400));
  await page.locator(`[data-appareil="${opk[0].id}"] button`, { hasText: 'Accepter' }).click(); await page.waitForTimeout(500);
  d = await db(); ok('… appareil accepté', d.utilisateurs.find((u) => u.identifiant === 'chai').cles[0].acceptee === true && (await toasts()).some((x) => /Appareil accepté\./.test(x)));
  await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(600);
  await page.locator('[data-cle-connexion]').click(); await page.waitForTimeout(2500);
  d = await db();
  ok('connexion par empreinte, visage ou code PIN : l’opérateur est connecté sans mot de passe', (await page.locator('[data-utilisateur]').count()) === 1 && /Opérateur Essai/.test(await txt(page.locator('[data-utilisateur]'))), await page.locator('body').innerText().then((x) => x.slice(0, 300)));
  w = await wa(); const wg = w.filter((x) => x.quoi === 'get').pop();
  ok('… connexion : transports de chaque clé repris (internal pour l’appareil intégré, usb pour la clé)', !!wg && wg.transports.some((x) => x && x.includes('internal')) && wg.transports.some((x) => x && x.includes('usb')), wg);
  ok('… journal des accès : « Connexion par clé d’accès (Android|PC…) »', (d.audit || []).some((a) => /Connexion par clé d’accès \(/.test(a.resume || '')), (d.audit || []).slice(-3));
  // réglage : désactiver la connexion par clé → le bouton disparaît, le mot de passe reste
  await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId: auth2 });
  await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(600);
  await cx.locator('input[aria-label="Identifiant"]').fill('admin'); await cx.locator('input[aria-label="Mot de passe"]').fill(MDP); await cx.locator('button[type=submit]').click(); await page.waitForTimeout(1500);
  await params('Utilisateurs & droits');
  await page.locator('[data-appareils] label', { hasText: 'Connexion par empreinte, visage ou code PIN' }).locator('input').uncheck(); await page.waitForTimeout(400);
  d = await db(); ok('réglage : connexion par clé désactivée (« Connexion par clé d’accès désactivée. »)', d.settings.securite.cles.actif === false && (await toasts()).some((x) => /Connexion par clé d’accès désactivée\./.test(x)));
  await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(600);
  ok('… écran de connexion : plus de bouton de clé, mot de passe toujours là', (await page.locator('[data-cle-connexion]').count()) === 0 && (await cx.locator('input[aria-label="Mot de passe"]').count()) === 1);
  await page.screenshot({ path: SC + '/shots/t55-connexion.png' });
  ok('aucune erreur de page (clés d’accès)', errors.length === 0, errors);
  await browser.close();
}
// 8. aperçu non sécurisé (http, comme un fichier ouvert hors ligne) : explication au lieu du bouton
{
  const { browser, page, errors } = await open({ viewport: { width: 1360, height: 900 } });
  await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: 'Utilisateurs & droits' }).first().click(); await page.waitForTimeout(300);
  const fa = page.locator('main [data-activation] form'); const MDP = 'Essai-2026!zz';
  await fa.locator('input[aria-label="Identifiant"]').fill('admin'); await fa.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Admin Essai');
  await fa.locator('input[aria-label="Mot de passe"]').fill(MDP); await fa.locator('input[aria-label="Confirmer le mot de passe"]').fill(MDP);
  await fa.locator('button[type=submit]').click(); await page.waitForTimeout(1800);
  await page.locator('.overlay').last().locator('label', { hasText: 'J’ai noté ce code' }).locator('input').check(); await page.locator('.overlay').last().locator('button:text-is("Terminer")').click(); await page.waitForTimeout(400);
  const t = (await page.locator('[data-cle-indispo]').first().innerText()).replace(/\s+/g, ' ');
  ok('page non sécurisée : pas d’activation, explication (« … page sécurisée (https) … version en ligne »)', (await page.locator('[data-cle-ajouter]').count()) === 0 && /https/.test(t) && /version en ligne/.test(t), t);
  // anglais
  await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1500);
  const cx = page.locator('[data-connexion]');
  if (await cx.count()) { await cx.locator('input[aria-label]').first().fill('admin'); await cx.locator('input[type=password]').fill(MDP); await cx.locator('button[type=submit]').click(); await page.waitForTimeout(1500); }
  await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button').filter({ hasText: /Users & rights/ }).first().click(); await page.waitForTimeout(400);
  const te = (await page.locator('[data-appareils]').innerText()).replace(/\s+/g, ' ');
  ok('anglais : « Accepted devices (passkeys) », « Sign-in with fingerprint, face or PIN », « Simplified sign-in (passkeys) »', /Accepted devices \(passkeys\)/i.test(await page.locator('main').innerText()) && /Sign-in with fingerprint, face or PIN/.test(te) && /Simplified sign-in \(passkeys\)/i.test(te) && /Passkeys require a secure page \(https\)/.test(te), te.slice(0, 700));
  ok('aucune erreur de page (http, anglais)', errors.length === 0, errors);
  await browser.close();
}
console.log(ko ? `\n${ko} ÉCHEC(S)` : '\nTOUT EST BON (t55 : impression directe, PDF en parallèle, clés d’accès)');
process.exitCode = ko ? 1 : 0;
