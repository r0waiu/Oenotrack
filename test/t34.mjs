// 0.15.0-alpha.1 : identifiants, mots de passe (empreintes seulement), profils de droits, garde des saisies, journal des accès,
// verrouillage, code de secours, désactivation
import { open, pick } from './ui.mjs';
const SH = (process.env.OENOTRACK_TESTS || '/tmp/oenotrack-tests') + '/shots';
let ko = 0; const ok = (name, c, x) => { if (!c) ko++; console.log(c ? '✓' : '✗', name, x !== undefined ? `→ ${String(x).replace(/\s+/g, ' ').slice(0, 220)}` : ''); };
const { browser, page, errors } = await open();
const toast = async () => page.locator('.toast').last().innerText().catch(() => '');
const sheet = () => page.locator('.overlay').last();
const dbLS = async () => page.evaluate(() => JSON.parse(localStorage.getItem('oenotrack-db-v2')));
const brut = async () => page.evaluate(() => localStorage.getItem('oenotrack-db-v2'));
const onglets = async () => page.$$eval('.navtabs [role=tab]', (b) => b.map((x) => x.id.replace('tab-', '')));
const MDP_ADMIN = 'Cave-2026!xy', MDP_THOMAS = 'Chai-Thomas-26', MDP_COMPTA = 'Compta-Lect-99';
const login = async (ident, mdp) => {
  const f = page.locator('[data-connexion] form');
  if (await f.locator('input[aria-label="Identifiant"]').count()) await f.locator('input[aria-label="Identifiant"]').fill(ident);
  await f.locator('input[aria-label="Mot de passe"]').fill(mdp); await f.locator('button[type=submit]').click(); await page.waitForTimeout(900);
};
const deconnexion = async () => { await page.locator('[data-utilisateur]').click(); await page.waitForTimeout(250); await sheet().locator('button:text-is("Se déconnecter")').click(); await page.waitForTimeout(400); };
const allerUtilisateurs = async () => { await page.click('#tab-params'); await page.waitForTimeout(250); await page.locator('main button', { hasText: 'Utilisateurs & droits' }).first().click(); await page.waitForTimeout(300); };

// 1. activation : premier administrateur + code de secours
await allerUtilisateurs();
ok('sans identifiants : présentation et activation', (await page.locator('main [data-activation]').count()) === 1 && (await page.locator('main').innerText()).includes('jamais enregistrés'));
const fa = page.locator('main [data-activation] form');
await fa.locator('input[aria-label="Identifiant"]').fill('julien');
await fa.locator('label', { hasText: 'Nom affiché' }).locator('input').fill('Julien Morel');
await fa.locator('select[aria-label="Opérateur correspondant"]').selectOption({ label: 'Julien Morel' });
await fa.locator('input[aria-label="Mot de passe"]').fill('court');
ok('jauge : mot de passe trop court', (await fa.locator('.mdp-jauge').innerText()).includes('Au moins 8'));
await fa.locator('input[aria-label="Mot de passe"]').fill(MDP_ADMIN); await fa.locator('input[aria-label="Confirmer le mot de passe"]').fill('autre-chose-1');
await fa.locator('button[type=submit]').click(); await page.waitForTimeout(400);
ok('confirmation différente refusée', (await fa.locator('[role=alert]').innerText()).includes('pas identiques'));
await fa.locator('input[aria-label="Confirmer le mot de passe"]').fill(MDP_ADMIN); await fa.locator('button[type=submit]').click(); await page.waitForTimeout(1500);
const codeSecours = (await page.locator('.code-secours').innerText()).trim();
ok('code de secours affiché une fois (4 × 4)', /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(codeSecours), codeSecours);
ok('« Terminer » attend la case « J’ai noté »', await sheet().locator('button:text-is("Terminer")').isDisabled());
await sheet().locator('label', { hasText: 'J’ai noté ce code' }).locator('input').check(); await sheet().locator('button:text-is("Terminer")').click(); await page.waitForTimeout(400);
ok('connecté : « 🔐 Julien Morel · Administrateur » dans l’en-tête', (await page.locator('[data-utilisateur]').innerText()).includes('Julien Morel · Administrateur'));
let d = await dbLS(); let raw = await brut();
ok('base : sécurité active, 5 profils, empreinte PBKDF2, jamais le mot de passe', d.settings.securite.actif === true && d.profils.length === 5 && d.utilisateurs[0].mdp.algo === 'PBKDF2-SHA256' && d.utilisateurs[0].mdp.iter === 120000 && !raw.includes(MDP_ADMIN) && !raw.includes(codeSecours) && !raw.includes(codeSecours.replace(/-/g, '')));
ok('« Qui saisit ? » remplacé par l’utilisateur (opérateur relié)', (await page.locator('[data-operateur-appareil]').count()) === 0);
await page.screenshot({ path: SH + '/t34-admin.png' });

// 2. comptes de l'équipe
const creer = async (ident, nom, profil, opr) => {
  await page.locator('main button', { hasText: '＋ Nouvel utilisateur' }).click(); await page.waitForTimeout(300); const s = sheet();
  await s.locator('input[aria-label="Identifiant"]').fill(ident); await s.locator('label', { hasText: 'Nom affiché' }).locator('input').fill(nom);
  await s.locator('select[aria-label="Profil de droits"]').selectOption({ label: profil }); if (opr) await s.locator('select[aria-label="Opérateur correspondant"]').selectOption({ label: opr });
  const mdp = await s.locator('input[aria-label="Mot de passe provisoire"]').inputValue(); await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(700); return mdp;
};
const provThomas = await creer('thomas', 'Thomas Girard', 'Opérateur de chai', 'Thomas Girard');
ok('utilisateur créé avec un mot de passe provisoire', /créé/.test(await toast()) && /^[A-Z][a-z]{3}-\d{4}$/.test(provThomas), provThomas);
const provCompta = await creer('compta', 'Cabinet comptable', 'Consultation');
d = await dbLS(); raw = await brut();
ok('3 utilisateurs, provisoires à changer, aucun mot de passe en clair', d.utilisateurs.length === 3 && d.utilisateurs.filter((u) => u.doitChanger).length === 2 && !raw.includes(provThomas) && !raw.includes(provCompta));
const tU = await page.locator('main').innerText();
ok('liste : profils et « mot de passe provisoire »', tU.includes('Opérateur de chai') && tU.includes('Consultation') && tU.includes('mot de passe provisoire'));
ok('journal : activation, connexion, créations', tU.includes('Identifiants activés') && /Connexion/.test(tU) && tU.includes('Thomas Girard (thomas)'));

// 3. déconnexion → écran de connexion ; mauvais mot de passe
await deconnexion();
ok('déconnecté : écran de connexion seul (aucun onglet)', (await page.locator('[data-connexion]').count()) === 1 && (await page.locator('.navtabs').count()) === 0);
await page.screenshot({ path: SH + '/t34-connexion.png' });
await login('thomas', 'mauvais-mot-2');
ok('mauvais mot de passe refusé', (await page.locator('[data-connexion] [role=alert]').innerText()).includes('incorrect'));
await login('inconnu', 'nimporte-quoi-3');
ok('identifiant inconnu : même message', (await page.locator('[data-connexion] [role=alert]').innerText()).includes('Identifiant ou mot de passe incorrect'));

// 4. opérateur de chai : changement du provisoire, droits
await login('thomas', provThomas);
ok('mot de passe provisoire : choix obligatoire d’un mot de passe personnel', (await sheet().innerText()).includes('Choisissez votre mot de passe') && (await sheet().locator('button:text-is("Annuler")').count()) === 1);
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
ok('… impossible d’y échapper', (await sheet().innerText()).includes('Choisissez votre mot de passe'));
await sheet().locator('input[aria-label="Nouveau mot de passe"]').fill(provThomas); await sheet().locator('input[aria-label="Confirmer le nouveau mot de passe"]').fill(provThomas);
await sheet().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(700);
ok('… différent du provisoire', (await sheet().innerText()).includes('différent du mot de passe provisoire'));
await sheet().locator('input[aria-label="Nouveau mot de passe"]').fill(MDP_THOMAS); await sheet().locator('input[aria-label="Confirmer le nouveau mot de passe"]').fill(MDP_THOMAS);
await sheet().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(800);
ok('mot de passe changé', /Mot de passe changé/.test(await toast()) && (await page.locator('[data-utilisateur]').innerText()).includes('Thomas Girard · Opérateur de chai'));
const oT = await onglets();
ok('onglets de l’opérateur : pas de Paramètres', !oT.includes('params') && oT.includes('vinification'), oT.join()); // Cuverie et Opérations : dans Vinification (0.34.0-alpha.1)
ok('pas de « Figer la campagne »', (await page.locator('header button', { hasText: /Figer la campagne|Rouvrir la campagne/ }).count()) === 0);
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
ok('Cuverie en consultation : bandeau', (await page.locator('main').innerText()).includes('permet de consulter ce module'));
// saisie d'un jaugeage (Opérations en saisie)
await page.locator('.pitem', { hasText: 'Cuve 08' }).first().click({ button: 'right' }); await page.waitForTimeout(250);
if (!(await page.locator('[role=menuitem]', { hasText: /^.*Jaugeage/ }).count())) { await page.locator('[role=menuitem]', { hasText: 'Autres opérations' }).click(); await page.waitForTimeout(200); }
await page.locator('[role=menuitem]', { hasText: 'Jaugeage' }).first().click(); await page.waitForTimeout(400);
let s = sheet();
ok('opérateur proposé d’office : celui de l’utilisateur', (await s.locator('.opr-tog[aria-pressed="true"]', { hasText: 'Thomas Girard' }).count()) === 1);
await s.locator('label', { hasText: 'Volume mesuré' }).locator('input').fill('19,9'); await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(600);
ok('jaugeage validé par l’opérateur', /validée/.test(await toast()), await toast());
d = await dbLS(); const opT = d.ops.filter((o) => o.type === 'jaugeage').pop(); const uT = d.utilisateurs.find((u) => u.identifiant === 'thomas');
ok('opération marquée « saisie par » Thomas, journal complété', opT.saisiPar === uT.id && !!opT.saisiLe && d.audit.some((a) => a.uid === uT.id && a.action === 'creation' && a.cibleId === opT.id));
// correction et suppression refusées
await page.click('#tab-ops'); await page.waitForTimeout(400);
const ligne = page.locator('main table tbody tr').filter({ hasText: 'Jaugeage' }).first();
await ligne.locator('button:text-is("Modifier")').click(); await page.waitForTimeout(400); s = sheet();
const tc = await s.innerText();
ok('opération validée ouverte en consultation (« Fermer » seulement), saisie par Thomas', tc.includes('Consultation') && tc.includes('Saisie par Thomas Girard') && (await s.locator('button:text-is("Enregistrer")').count()) === 0 && (await s.locator('button:text-is("Fermer")').count()) >= 1);
await s.locator('.sheet-f button:text-is("Fermer")').click(); await page.waitForTimeout(200);
await ligne.locator('[data-op-menu]').click(); await page.waitForTimeout(150); await ligne.locator('button[aria-label="Supprimer l’opération"]').first().click(); // 0.48.0-alpha.1 : « Supprimer » dans « ⋯ » await page.waitForTimeout(250);
if (await page.locator('[role=alertdialog]').count()) { await page.locator('[role=alertdialog] button:text-is("Supprimer")').click(); await page.waitForTimeout(400); }
ok('suppression refusée (droits insuffisants)', /Droits insuffisants/.test(await toast()) && /supprimer/.test(await toast()), await toast());
ok('… l’opération est toujours là', (await dbLS()).ops.some((o) => o.id === opT.id));
// verrouillage manuel : rien n'est perdu
await page.locator('main button:text-is("Soutirage")').click(); await page.waitForTimeout(400);
await sheet().locator('label', { hasText: 'Notes' }).locator('textarea').fill('saisie en cours avant verrouillage');
await page.evaluate(() => document.querySelector('[data-utilisateur]').click()); await page.waitForTimeout(250);
await page.locator('.overlay').last().locator('button', { hasText: 'Verrouiller' }).click(); await page.waitForTimeout(500);
ok('verrouillé : écran « Session verrouillée » au-dessus', (await page.locator('[data-verrou] [data-connexion]').innerText()).includes('Session verrouillée'));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.locator('[data-verrou] input[aria-label="Mot de passe"]').fill(MDP_THOMAS); await page.locator('[data-verrou] button[type=submit]').click(); await page.waitForTimeout(900);
ok('déverrouillé : le formulaire en cours est intact', (await page.locator('[data-verrou]').count()) === 0 && (await page.locator('.overlay textarea').last().inputValue().catch(() => '')) === 'saisie en cours avant verrouillage');
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await deconnexion();

// 5. consultation : aucune saisie
await login('compta', provCompta);
await sheet().locator('input[aria-label="Nouveau mot de passe"]').fill(MDP_COMPTA); await sheet().locator('input[aria-label="Confirmer le nouveau mot de passe"]').fill(MDP_COMPTA); await sheet().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(800);
await page.click('#tab-ops'); await page.waitForTimeout(300);
ok('Opérations en consultation : bandeau', (await page.locator('main').innerText()).includes('permet de consulter ce module'));
await page.locator('main button:text-is("Soutirage")').click(); await page.waitForTimeout(400);
ok('nouvelle opération : « Droits insuffisants »', (await sheet().innerText()).includes('Droits insuffisants'));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.click('#tab-cuverie'); await page.waitForTimeout(300);
await page.locator('main select[aria-label="Ce que montre le contour des contenants"]').selectOption('cepage'); await page.waitForTimeout(300);
ok('réglage de vue (contour) permis en consultation', !/Droits insuffisants/.test(await toast()) && (await dbLS()).apparence.contourMode === 'cepage');
await deconnexion();

// 6. administrateur : journal, profils, désactivation d'un compte
await login('julien', MDP_ADMIN);
await allerUtilisateurs();
const tJ = await page.locator('main').innerText();
ok('journal : échecs, connexions, verrouillage, saisie de Thomas', tJ.includes('Échec de connexion') && tJ.includes('Identifiant « inconnu »') && tJ.includes('Verrouillage') && tJ.includes('Jaugeage du'));
await page.locator('main [data-profil="pf_consult"] button:text-is("Modifier")').click(); await page.waitForTimeout(300); s = sheet();
await s.locator('[data-droit-module="analyses"] button[role=radio]', { hasText: 'Saisie' }).click();
await s.locator('label', { hasText: 'Supprimer' }).locator('input').check();
await s.locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(400);
const pc = (await dbLS()).profils.find((p) => p.id === 'pf_consult');
ok('profil modifié : analyses en saisie, droit de supprimer', pc.modules.analyses === 'ecriture' && pc.speciaux.supprimer === true);
await page.locator('main [data-profil="pf_admin"] button:text-is("Voir")').click(); await page.waitForTimeout(300);
ok('profil Administrateur verrouillé', (await sheet().locator('[data-droit-module="ops"] button[role=radio]').first().isDisabled()));
await page.keyboard.press('Escape'); await page.waitForTimeout(200);
await page.locator('main tr', { hasText: 'compta' }).locator('button', { hasText: 'Désactiver' }).click(); await page.waitForTimeout(250);
await page.locator('[role=alertdialog] button:text-is("Désactiver")').click(); await page.waitForTimeout(400);
ok('compte désactivé', (await dbLS()).utilisateurs.find((u) => u.identifiant === 'compta').actif === false);
await page.screenshot({ path: SH + '/t34-utilisateurs.png', fullPage: true });
// rechargement : la session reste (même onglet)
await page.reload(); await page.waitForTimeout(1500);
ok('après rechargement : toujours connecté', (await page.locator('[data-utilisateur]').count()) === 1 && (await page.locator('[data-connexion]').count()) === 0);
// inactivité : session ancienne → verrouillée à l'ouverture
await page.evaluate(() => { const k = 'oenotrack-session'; const s = JSON.parse(sessionStorage.getItem(k)); s.t = Date.now() - 3600 * 1000; sessionStorage.setItem(k, JSON.stringify(s)); });
await page.reload(); await page.waitForTimeout(1500);
ok('inactivité (> 15 min) : ouverture verrouillée', (await page.locator('[data-verrou] [data-connexion]').innerText().catch(() => '')).includes('Session verrouillée'));
// 0.45.0-alpha.1 : le logo de l'écran verrouillé ouvre la présentation ; au retour, toujours verrouillé
await page.locator('[data-verrou] [data-brand-presentation]').click(); await page.waitForTimeout(500);
ok('logo de « Session verrouillée » → page de présentation (rien de l’application affiché)', (await page.locator('[data-accueil="revoir"]').count()) === 1 && (await page.locator('main[role=tabpanel]').count()) === 0 && (await page.locator('[data-utilisateur]').count()) === 0);
await page.locator('[data-accueil-ouvrir]').first().click(); await page.waitForTimeout(600);
ok('… retour : session toujours verrouillée', (await page.locator('[data-verrou] [data-connexion]').innerText().catch(() => '')).includes('Session verrouillée'));
await page.locator('[data-verrou] input[aria-label="Mot de passe"]').fill(MDP_ADMIN); await page.locator('[data-verrou] button[type=submit]').click(); await page.waitForTimeout(900);
await deconnexion();
// compte désactivé : connexion refusée
await login('compta', MDP_COMPTA);
ok('compte désactivé : connexion refusée', (await page.locator('[data-connexion] [role=alert]').innerText()).includes('désactivé'));

// 7. code de secours : nouveau mot de passe administrateur, nouveau code
await page.locator('[data-connexion] summary', { hasText: 'Mot de passe oublié' }).click(); await page.locator('[data-connexion] button', { hasText: 'utiliser le code de secours' }).click(); await page.waitForTimeout(200);
const fs2 = page.locator('[data-connexion] form');
await fs2.locator('input[aria-label="Identifiant"]').fill('julien'); await fs2.locator('input[aria-label="Code de secours"]').fill('AAAA-BBBB-CCCC-DDDD');
await fs2.locator('input[aria-label="Nouveau mot de passe"]').fill('Nouveau-Mdp-77'); await fs2.locator('input[aria-label="Confirmer le mot de passe"]').fill('Nouveau-Mdp-77');
await fs2.locator('button[type=submit]').click(); await page.waitForTimeout(1200);
ok('mauvais code de secours refusé', (await fs2.locator('[role=alert]').innerText()).includes('Code de secours incorrect'));
await fs2.locator('input[aria-label="Code de secours"]').fill(codeSecours.toLowerCase().replace(/-/g, ' '));
await fs2.locator('button[type=submit]').click(); await page.waitForTimeout(2500);
const nouveauCode = (await page.locator('[data-connexion] .code-secours').innerText().catch(() => '')).trim();
ok('code de secours accepté (saisi en minuscules, sans tirets) : nouveau code remis', /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(nouveauCode) && nouveauCode !== codeSecours, nouveauCode);
await page.locator('[data-connexion] button:text-is("Continuer")').click(); await page.waitForTimeout(600);
ok('connecté après réinitialisation', (await page.locator('[data-utilisateur]').innerText()).includes('Julien Morel'));
d = await dbLS(); ok('journal : code de secours utilisé', d.audit.some((a) => a.action === 'secours'));

// 8. désactiver les identifiants (mot de passe demandé)
await allerUtilisateurs();
await page.locator('main button', { hasText: 'Désactiver les identifiants' }).click(); await page.waitForTimeout(300);
await sheet().locator('input[aria-label="Votre mot de passe"]').fill('faux-mot-de-passe'); await sheet().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(900);
ok('désactivation : mauvais mot de passe refusé', (await sheet().innerText()).includes('Mot de passe incorrect'));
await sheet().locator('input[aria-label="Votre mot de passe"]').fill('Nouveau-Mdp-77'); await sheet().locator('.sheet-f .btn-primary').click(); await page.waitForTimeout(900);
d = await dbLS();
ok('identifiants désactivés : accès libre, comptes et journal gardés', d.settings.securite.actif === false && d.utilisateurs.length === 3 && d.audit.length > 10 && (await page.locator('[data-utilisateur]').count()) === 0 && (await page.locator('[data-activation]').count()) === 1);
ok('réactivation proposée avec les comptes existants', (await page.locator('main').innerText()).includes('Réactiver avec les comptes existants'));

// 9. téléphone : écran de connexion
const fa2 = page.locator('main [data-activation] form');
await fa2.locator('input[aria-label="Identifiant"]').fill('julien'); await fa2.locator('input[aria-label="Mot de passe"]').fill('Nouveau-Mdp-77'); await fa2.locator('button[type=submit]').click(); await page.waitForTimeout(1200);
ok('réactivé et connecté', (await page.locator('[data-utilisateur]').count()) === 1 && (await dbLS()).settings.securite.actif === true);
await deconnexion();
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(300);
const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok('téléphone : écran de connexion sans débordement', ov <= 1, ov);
await page.screenshot({ path: SH + '/t34-mobile.png' });
console.log('ERREURS:', errors.join(' | ') || 'aucune'); if (errors.length) ko++;
await browser.close();
console.log(ko ? `${ko} ÉCHEC(S)` : 'T34 OK');
