// 0.34.0-alpha.1 : onglet « Vinification » (Cuverie & Lots, Opérations & Assemblages, À réaliser & fiches en sous-onglets), onglet
// ouvert à la connexion et au déverrouillage (réglage, indépendant de l'ordre), campagne antérieure vide, dossier réseau de l'entreprise
// (chemin commun, choix du dossier, écriture avec jeton, deux postes qui se synchronisent), anglais, téléphone. Données fictives.
import { open } from './ui.mjs'; import fs from 'fs';
const SC = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + ''; fs.mkdirSync(SC + '/shots', { recursive: true });
let ko = 0; const ok = (n, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗ ÉCHEC', n, x !== undefined && !c ? JSON.stringify(x).slice(0, 700) : ''); };
// dossier partagé simulé (le « NAS ») : fichiers gardés côté Node, vus par les deux postes
const NAS = new Map(); let ecritures = 0;
const nasFns = async (page) => {
  await page.exposeFunction('__nasLire', (p) => (NAS.has(p) ? NAS.get(p) : null));
  await page.exposeFunction('__nasEcrire', (p, texte) => { ecritures += p.endsWith('oenotrack-base.json') ? 1 : 0; NAS.set(p, { texte, t: Date.now() + ecritures, size: texte.length }); return true; });
  await page.exposeFunction('__nasListe', (dir) => [...NAS.keys()].filter((k) => k.startsWith(dir + '/') && !k.slice(dir.length + 1).includes('/')).map((k) => k.slice(dir.length + 1)));
  await page.exposeFunction('__nasSuppr', (p) => NAS.delete(p));
};
const init = () => {
  window.claude = { use: async () => null }; window.print = () => {};
  const nf = () => new DOMException('Introuvable', 'NotFoundError');
  const fichier = (chemin, nom) => ({ kind: 'file', name: nom,
    async getFile() { const x = await window.__nasLire(chemin); if (!x) throw nf(); return new File([x.texte], nom, { lastModified: x.t }); },
    async createWritable() { let buf = ''; return { async write(c) { buf = typeof c === 'string' ? c : await new Blob([c]).text(); }, async close() { await window.__nasEcrire(chemin, buf); } }; } });
  const dossier = (chemin, nom) => ({ kind: 'directory', name: nom,
    async getFileHandle(n, o) { const p = `${chemin}/${n}`; if (!(await window.__nasLire(p))) { if (!(o && o.create)) throw nf(); await window.__nasEcrire(p, ''); } return fichier(p, n); },
    async getDirectoryHandle(n) { return dossier(`${chemin}/${n}`, n); },
    async removeEntry(n) { await window.__nasSuppr(`${chemin}/${n}`); },
    async *entries() { for (const n of await window.__nasListe(chemin)) yield [n, fichier(`${chemin}/${n}`, n)]; },
    async queryPermission() { return 'granted'; }, async requestPermission() { return 'granted'; } });
  window.showDirectoryPicker = async () => dossier('/nas', window.__nasNom || 'Oenotrack-NAS');
};
const { browser, page, errors } = await open({ init, viewport: { width: 1440, height: 950 }, date: '2026-11-26T10:00:00' });
await nasFns(page); await page.reload(); await page.waitForTimeout(1200);
const txt = async (l) => (await l.innerText()).replace(/\s+/g, ' ');
const db = (p = page) => p.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const toast = async (p = page) => (await p.locator('.toast').allInnerTexts()).join(' | ');
const barre = async (p = page) => p.locator('.navtabs [role=tab]').evaluateAll((L) => L.map((x) => x.id.slice(4)));
const sousOnglets = async () => page.locator('main [data-onglet-groupe] [role=tab]').evaluateAll((L) => L.map((x) => x.id.slice(4)));
const choisi = async (id) => (await page.locator(`#tab-${id}`).getAttribute('aria-selected')) === 'true';
const params = async (s, p = page) => { await p.click('#tab-params'); await p.waitForTimeout(250); await p.locator('main button', { hasText: s }).first().click(); await p.waitForTimeout(350); };
const ov = () => page.locator('.overlay').last();

// 1. barre d'onglets : « Vinification » à la place des trois onglets, sous-onglets dans l'ordre des modules
let B = await barre();
ok('barre : Vinification en premier (à la place de Cuverie, Opérations, À réaliser), puis Pressoir… Paramètres (12 onglets)', B.join() === 'vinification,pressoir,tirage,cave,degorgement,analyses,intrants,hygiene,equipements,trace,registres,params', B);
ok('démarrage : Vinification ouvert sur Cuverie & Lots ; 3 sous-onglets', await choisi('vinification') && await choisi('cuverie') && (await sousOnglets()).join() === 'cuverie,ops,previsions' && /Vinification/.test(await page.locator('#tab-vinification').innerText()));
await page.screenshot({ path: SC + '/shots/t67-vinification.png' });
await page.click('#tab-ops'); await page.waitForTimeout(300);
ok('sous-onglet Opérations & Assemblages : journal affiché, Vinification reste sélectionné', await choisi('ops') && await choisi('vinification') && /Journal|Opérations/.test(await txt(page.locator('main'))));
await page.click('#tab-pressoir'); await page.waitForTimeout(300); await page.click('#tab-vinification'); await page.waitForTimeout(300);
ok('retour sur Vinification : dernier sous-onglet ouvert (Opérations) retrouvé', await choisi('ops') && !(await page.locator('main [data-onglet-groupe]').count()) === false);
await page.click('#tab-previsions'); await page.waitForTimeout(300);
ok('sous-onglet À réaliser & fiches', await choisi('previsions') && /réaliser/i.test(await txt(page.locator('main'))));

// 2. Paramètres › Modules : onglet ouvert au démarrage, indépendant de l'ordre
await params('Modules');
const sel = page.locator('main select[aria-label="Onglet ouvert au démarrage"]');
const opts = await sel.locator('option').allInnerTexts();
ok('réglage : « Premier onglet de la barre (actuellement « Vinification ») » puis les 12 onglets ; Cuverie marquée « dans Vinification »', /Premier onglet de la barre.*Vinification/.test(opts[0]) && opts.length === 13 && opts.includes('Analyses') && !opts.includes('Cuverie & Lots') && /dans « Vinification »/.test(await txt(page.locator('main [data-module="cuverie"]'))), opts);
await sel.selectOption('analyses'); await page.waitForTimeout(300);
let d = await db();
ok('… « Analyses » choisi : enregistré dans la base, marqué « s’ouvre au démarrage », ordre inchangé', d.settings.ongletDefaut === 'analyses' && /s’ouvre au démarrage/.test(await txt(page.locator('main [data-module="analyses"]'))) && !d.settings.modulesOrdre && (await barre())[0] === 'vinification');
await page.reload(); await page.waitForTimeout(1200);
ok('rechargement : ouverture sur Analyses (pas sur le premier onglet)', await choisi('analyses'));

// 3. identifiants : connexion et déverrouillage → onglet choisi, plus « Société & opérateurs »
await params('Utilisateurs & droits');
const fa = page.locator('main [data-activation] form'); const MDP = 'Essai-2026!zz';
await fa.locator('input[aria-label="Identifiant"]').fill('admin'); await fa.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Admin Essai');
await fa.locator('input[aria-label="Mot de passe"]').fill(MDP); await fa.locator('input[aria-label="Confirmer le mot de passe"]').fill(MDP);
await fa.locator('button[type=submit]').click(); await page.waitForTimeout(1800);
ok('activation des identifiants : on reste dans Paramètres (code de secours affiché)', await choisi('params') && (await ov().locator('label', { hasText: 'J’ai noté ce code' }).count()) === 1);
await ov().locator('label', { hasText: 'J’ai noté ce code' }).locator('input').check(); await ov().locator('button:text-is("Terminer")').click(); await page.waitForTimeout(400);
const login = async (mdp) => { const f = page.locator('[data-connexion] form'); if (await f.locator('input[aria-label="Identifiant"]').count()) await f.locator('input[aria-label="Identifiant"]').fill('admin'); await f.locator('input[aria-label="Mot de passe"]').fill(mdp); await f.locator('button[type=submit]').click(); await page.waitForTimeout(1200); };
const deconnexion = async () => { await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await ov().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(500); };
await deconnexion(); await login(MDP);
ok('connexion : ouverture sur Analyses (réglage), pas sur « Société & opérateurs »', await choisi('analyses') && !(await page.locator('main [data-connexion]').count()) && !/Nom de l’entreprise/.test(await txt(page.locator('main'))));
await params('Modules'); await page.locator('main select[aria-label="Onglet ouvert au démarrage"]').selectOption(''); await page.waitForTimeout(300);
await deconnexion(); await login(MDP);
ok('réglage par défaut : connexion sur le premier onglet de la barre (Vinification › Cuverie)', await choisi('vinification') && await choisi('cuverie') && !(await db()).settings.ongletDefaut);
await page.click('#tab-hygiene'); await page.waitForTimeout(300);
await page.evaluate(() => document.querySelector('[data-utilisateur]').click()); await page.waitForTimeout(250); await ov().locator('button', { hasText: 'Verrouiller' }).click(); await page.waitForTimeout(500);
await page.locator('[data-verrou] input[aria-label="Mot de passe"]').fill(MDP); await page.locator('[data-verrou] button[type=submit]').click(); await page.waitForTimeout(900);
ok('déverrouillage de la même session : la page en cours reste (Hygiène), rien de perdu', (await page.locator('[data-verrou]').count()) === 0 && await choisi('hygiene'));
await page.reload(); await page.waitForTimeout(1200);
ok('rechargement connecté : premier onglet de la barre', await choisi('vinification'));

// 4. campagne antérieure : vide (aucun lot ni volume en cuve) ; les campagnes existantes inchangées
d = await db(); const camps0 = d.campagnes.map((c) => c.id); const premiere = d.campagnes[0];
const volumes = async () => page.locator('main .pitem').evaluateAll((L) => L.filter((x) => !/^\s*vide\b/.test(x.innerText) && /[1-9]\d*,\d{2}\s*\/\s*\d/.test(x.innerText)).length); // contenants avec du vin
await page.click('#tab-cuverie'); await page.waitForTimeout(400); const v0 = await volumes();
await params('Campagnes');
const fC = page.locator('main section', { hasText: 'Créer une campagne' });
await fC.locator('label', { hasText: 'Nom' }).locator('input').fill('2019-2020');
await fC.locator('label', { hasText: 'Début' }).locator('input').fill('2019-08-01'); await fC.locator('label', { hasText: 'Fin' }).locator('input').fill('2020-07-31'); await page.waitForTimeout(250);
ok('création avant les campagnes existantes : avertissement « démarre complètement vide »', /démarre complètement vide/.test(await txt(page.locator('main [data-camp-anterieure]'))));
await fC.locator('button', { hasText: 'Créer la campagne' }).click(); await page.waitForTimeout(400);
d = await db(); const ca = d.campagnes.find((c) => c.id === '2019-2020');
ok('… créée, marquée antérieure, en tête de liste ; toast explicite ; aucune opération, aucun lot ajouté', ca && ca.anterieure === true && d.campagnes[0].id === '2019-2020' && /démarre vide/.test(await toast()) && d.campagnes.length === camps0.length + 1 && !d.campagnes.find((c) => c.id === premiere.id).anterieure, d.campagnes.map((c) => c.id));
await page.locator('header select').first().selectOption('2019-2020'); await page.waitForTimeout(400);
await page.click('#tab-cuverie'); await page.waitForTimeout(400);
const vA = await volumes(); const kA = await txt(page.locator('main'));
ok('campagne 2019-2020 active : cuverie vide (aucun volume en cuve), les contenants restent', v0 > 0 && vA === 0 && (await page.locator('main .pitem').count()) > 0, { v0, vA });
await page.screenshot({ path: SC + '/shots/t67-campagne-anterieure.png' });
await page.click('#tab-ops'); await page.waitForTimeout(300);
ok('… journal des opérations de la campagne : vide', !(await page.locator('main tbody tr').count()) || /Aucune/.test(await txt(page.locator('main'))));
await page.locator('header select').first().selectOption(camps0[camps0.length - 1]); await page.waitForTimeout(400); await page.click('#tab-cuverie'); await page.waitForTimeout(400);
ok('retour sur la dernière campagne : volumes de nouveau en cuve, identiques', (await volumes()) === v0);

// 5. dossier réseau de l'entreprise : chemin commun, choix du dossier, écriture
await params('Sauvegarde & Drive');
const reg = page.locator('main [data-reseau-reglage]'); await reg.locator('summary').click(); await page.waitForTimeout(200);
await reg.locator('input[aria-label="Chemin du dossier partagé"]').fill('\\\\serveur\\vinification\\Autre-dossier'); await page.waitForTimeout(150);
ok('chemin \\\\serveur\\… reconnu : conseil « Partage Windows »', /Partage Windows/.test(await txt(reg)));
await reg.locator('button', { hasText: 'Enregistrer pour tous les postes' }).click(); await page.waitForTimeout(300);
d = await db();
ok('chemin enregistré dans la base (commun à tous les postes), auteur tracé', d.settings.dossierReseau && d.settings.dossierReseau.chemin === '\\\\serveur\\vinification\\Autre-dossier' && d.settings.dossierReseau.par && (d.audit || []).some((a) => /Dossier réseau/.test(a.resume || '')), d.settings.dossierReseau);
const tuile = page.locator('main [data-fournisseur="reseau"]');
ok('tuile « Dossier réseau de l’entreprise » : chemin affiché, bouton « Choisir le dossier »', /Dossier réseau de l’entreprise/.test(await txt(tuile)) && /serveur.vinification.Autre-dossier/.test(await txt(tuile)) && await tuile.locator('button', { hasText: 'Choisir le dossier' }).isEnabled());
await tuile.locator('button', { hasText: 'Choisir le dossier' }).click(); await page.waitForTimeout(600);
ok('dossier choisi d’un autre nom : avertissement avant de valider', /Choisir le dossier réseau de l’entreprise/.test(await txt(ov())) && /ne correspond|pas le dossier de l’entreprise/.test(await txt(ov().locator('[data-reseau-ecart]'))));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await reg.locator('input[aria-label="Chemin du dossier partagé"]').fill('\\\\serveur\\vinification\\Oenotrack-NAS');
await reg.locator('input[aria-label="Consigne pour les postes"]').fill('Connecter d’abord le lecteur Z: (fictif)');
await reg.locator('button', { hasText: 'Enregistrer pour tous les postes' }).click(); await page.waitForTimeout(300);
await tuile.locator('button', { hasText: 'Choisir le dossier' }).click(); await page.waitForTimeout(600);
ok('bon dossier : pas d’avertissement ; dossier prêt', !(await ov().locator('[data-reseau-ecart]').count()) && /est prêt/.test(await txt(ov())));
await ov().locator('button', { hasText: 'Utiliser « Oenotrack-NAS »' }).click(); await page.waitForTimeout(2500);
let st = await txt(page.locator('main [data-cloud]'));
ok('relié : base écrite dans le dossier réseau (oenotrack-base.json), jeton d’écriture retiré, état « dossier réseau de l’entreprise »', NAS.has('/nas/oenotrack-base.json') && NAS.get('/nas/oenotrack-base.json').texte.length > 1000 && !NAS.has('/nas/oenotrack-verrou.json') && /dossier réseau de l’entreprise/.test(st) && /Oenotrack-NAS/.test(st), st);
ok('… chemin de l’entreprise : « relié sur ce poste », copie du chemin proposée', /relié sur ce poste/.test(await txt(page.locator('main [data-reseau-chemin]'))) && (await page.locator('main [data-reseau-chemin] button', { hasText: 'Copier le chemin' }).count()) === 1);
await page.screenshot({ path: SC + '/shots/t67-reseau.png', fullPage: false });

// 6. deuxième poste (autre navigateur) : même dossier, données reprises puis saisies croisées réunies
const P2 = await open({ init, viewport: { width: 1280, height: 900 }, date: '2026-11-26T10:05:00' }); const p2 = P2.page;
await nasFns(p2); await p2.evaluate(() => localStorage.clear()); await p2.addInitScript(() => { try { localStorage.setItem('oenotrack-accueil', 'vu'); } catch (e) { /* */ } }); await p2.reload(); await p2.waitForTimeout(1200);
await params('Sauvegarde & Drive', p2);
await p2.locator('main [data-fournisseur="reseau"] button', { hasText: 'Choisir le dossier' }).click(); await p2.waitForTimeout(800);
const ov2 = p2.locator('.overlay').last(); const t2 = (await ov2.innerText()).replace(/\s+/g, ' ');
ok('poste 2 : le dossier contient déjà des données Œnotrack', /contient déjà des données Œnotrack/.test(t2), t2.slice(0, 300));
const bAdopt = ov2.locator('button', { hasText: 'Utiliser seulement les données du dossier' });
if (await bAdopt.count()) await bAdopt.click(); else await ov2.locator('.sheet-f .btn-primary').click();
await p2.waitForTimeout(2500); await p2.waitForSelector('[data-connexion]', { timeout: 8000 }).catch(() => null);
ok('poste 2 : base reprise du dossier (identifiants compris → écran de connexion, chemin de l’entreprise reçu)', (await p2.locator('[data-connexion]').count()) === 1 && (await db(p2)).settings.dossierReseau.chemin === '\\\\serveur\\vinification\\Oenotrack-NAS');
{ const f = p2.locator('[data-connexion] form'); if (await f.locator('input[aria-label="Identifiant"]').count()) await f.locator('input[aria-label="Identifiant"]').fill('admin'); await f.locator('input[aria-label="Mot de passe"]').fill(MDP); await f.locator('button[type=submit]').click(); await p2.waitForTimeout(1200); }
ok('poste 2 connecté : ouverture sur le premier onglet (Vinification), pas sur Paramètres', (await p2.locator('#tab-vinification').getAttribute('aria-selected')) === 'true');
// saisies croisées : une campagne créée au poste 2, un opérateur… au poste 1 (nom de la société)
await params('Campagnes', p2); const fC2 = p2.locator('main section', { hasText: 'Créer une campagne' });
await fC2.locator('label', { hasText: 'Nom' }).locator('input').fill('2018-2019'); await fC2.locator('label', { hasText: 'Début' }).locator('input').fill('2018-08-01'); await fC2.locator('label', { hasText: 'Fin' }).locator('input').fill('2019-07-31');
await fC2.locator('button', { hasText: 'Créer la campagne' }).click(); await p2.waitForTimeout(4500);
await params('Société & opérateurs');
await page.locator('main label', { hasText: 'Nom de l’entreprise' }).locator('input').fill('Domaine Fictif du Réseau'); await page.keyboard.press('Tab'); await page.waitForTimeout(4500);
await params('Sauvegarde & Drive', p2); await p2.locator('main button', { hasText: 'Synchroniser maintenant' }).click(); await p2.waitForTimeout(2500);
await params('Sauvegarde & Drive'); await page.locator('main button', { hasText: 'Synchroniser maintenant' }).click(); await page.waitForTimeout(2500);
const d1 = await db(); const d2 = await db(p2);
ok('synchronisation par le dossier réseau : campagne du poste 2 et société du poste 1 réunies des deux côtés, rien de perdu', d1.campagnes.some((c) => c.id === '2018-2019' && c.anterieure) && d2.campagnes.some((c) => c.id === '2019-2020') && d1.entreprise.nom === 'Domaine Fictif du Réseau' && d2.entreprise.nom === 'Domaine Fictif du Réseau' && !NAS.has('/nas/oenotrack-verrou.json'), [d1.campagnes.map((c) => c.id), d2.campagnes.map((c) => c.id), d1.entreprise.nom, d2.entreprise.nom]);
ok('poste 2 : aucune erreur', !P2.errors.length, P2.errors); await P2.browser.close();

// 7. anglais, téléphone
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'en'); }); await page.reload(); await page.waitForTimeout(1300);
{ const f = page.locator('[data-connexion] form'); if (await f.count()) { if (await f.locator('input[aria-label="Identifiant"]').count()) await f.locator('input[aria-label="Identifiant"]').fill('admin'); await f.locator('input[aria-label="Mot de passe"]').fill(MDP); await f.locator('button[type=submit]').click(); await page.waitForTimeout(1200); } }
const en = await txt(page.locator('.navtabs')); const enS = await txt(page.locator('main [data-onglet-groupe]'));
ok('anglais : onglet et sous-onglets traduits', /Winemaking|Vinification/.test(en) && /Tanks|Cellar/.test(enS) && !/Opérations & Assemblages/.test(enS), [en, enS]);
await params('Modules'); const enM = await txt(page.locator('main [data-onglet-defaut]'));
ok('anglais : réglage de l’onglet d’ouverture traduit', !/Onglet ouvert au démarrage/.test(enM) && !/Premier onglet de la barre/.test(enM), enM);
await params('Backup'); const reg2 = page.locator('main [data-reseau-reglage]'); if (!(await reg2.getAttribute('open'))) await reg2.locator('summary').click();
const enR = await txt(reg2);
ok('anglais : dossier réseau de l’entreprise traduit', !/Dossier réseau de l’entreprise/.test(enR) && !/Copier le chemin/.test(enR) && /Oenotrack-NAS/.test(enR), enR.slice(0, 400));
await page.evaluate(() => { localStorage.setItem('oenotrack-langue', 'fr'); }); await page.setViewportSize({ width: 390, height: 844 }); await page.reload(); await page.waitForTimeout(1300);
await page.click('#tab-vinification'); await page.waitForTimeout(300);
const ovf = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok('téléphone : Vinification et sous-onglets sans débordement horizontal', ovf <= 1 && (await sousOnglets()).length === 3, ovf);
await page.screenshot({ path: SC + '/shots/t67-mobile.png' });
ok('aucune erreur', !errors.length, errors);
console.log(ko ? `\nt67 : ${ko} ÉCHEC(S)` : '\nt67 : TOUT PASSE');
await browser.close(); process.exitCode = ko ? 1 : 0;
