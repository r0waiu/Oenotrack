/* ============ DOSSIER RÉSEAU DE L'ENTREPRISE (0.34.0-alpha.1) : synchronisation sur un serveur interne, un NAS, un lecteur réseau ============
   Les données sont lues et écrites dans un dossier partagé de l'entreprise (oenotrack-base.json, documents/, historique/ : le même
   format que pour Google Drive, OneDrive ou Dropbox), sans passer par un cloud externe. Le navigateur y accède par l'API File System Access
   (Chrome, Edge sur ordinateur) : connecteur « reseau » de 34-cloud-fournisseurs.js ; fusion à 3 voies comme pour les autres (32-sync.js).
   Un navigateur ne peut pas ouvrir seul un chemin tapé au clavier (sécurité) : le chemin renseigné ici est un repère commun, enregistré
   dans la base (settings.dossierReseau = { chemin, consigne, par, le }) et donc vu par tous les postes, pour choisir le bon dossier dans la
   fenêtre du système. Réglage soumis au droit « Sauvegardes et Drive ». */
const RESEAU_CHEMIN_MAX = 260;
// nature d'un chemin : partage Windows (\\serveur\partage), lecteur réseau (Z:\…), smb:// / afp:// / nfs://, dossier monté (/Volumes, /mnt…), file://
function reseauCheminType(chemin) {
  const c = String(chemin || '').trim();
  if (!c) return '';
  if (/^\\\\[^\\/]+[\\/][^\\/]+/.test(c) || /^\/\/[^/]+\/[^/]+/.test(c)) return 'unc';
  if (/^[a-z]:[\\/]?/i.test(c)) return 'lecteur';
  if (/^(smb|afp|nfs|cifs):\/\/[^/]+/i.test(c)) return 'smb';
  if (/^file:\/\//i.test(c)) return 'fichier';
  if (/^\/(Volumes|mnt|media|net|srv|run\/user\/\d+\/gvfs)\//.test(c)) return 'monte';
  if (/^[/~]/.test(c)) return 'local';
  return 'autre';
}
// dernier élément du chemin : nom du dossier attendu dans la fenêtre de choix (le navigateur ne donne que le nom du dossier choisi)
function reseauNomDossier(chemin) {
  const c = String(chemin || '').trim().replace(/^[a-z]+:\/\//i, '').replace(/[\\/]+$/, '');
  const p = c.split(/[\\/]+/).filter(Boolean); const n = p[p.length - 1] || '';
  return /^[a-z]:$/i.test(n) ? '' : n;
}
// le dossier choisi correspond-il au chemin de l'entreprise ? (comparaison du nom seulement, sans accents ni casse)
function reseauCorrespond(chemin, nomChoisi) {
  const a = norm(reseauNomDossier(chemin)); const b = norm(String(nomChoisi || '').trim());
  return !a || !b ? null : a === b;
}
// conseil d'accès selon le système et la nature du chemin
function reseauConseil(chemin) {
  const t = reseauCheminType(chemin);
  if (t === 'unc') return 'Partage Windows : dans la fenêtre, collez le chemin dans la barre d’adresse (Windows) ou connectez d’abord le partage (Mac : Finder › Aller › Se connecter au serveur, en smb://).';
  if (t === 'lecteur') return 'Lecteur réseau : ouvrez ce lecteur dans la fenêtre (Ce PC), puis le dossier.';
  if (t === 'smb') return 'Partage réseau : connectez-le d’abord (Mac : Finder › Aller › Se connecter au serveur ; Linux : gestionnaire de fichiers), puis choisissez-le dans la fenêtre.';
  if (t === 'monte' || t === 'local' || t === 'fichier') return 'Dossier monté sur cet ordinateur : ouvrez-le dans la fenêtre.';
  return t ? 'Ouvrez ce dossier dans la fenêtre du système.' : '';
}
const dossierReseau = (db) => { const x = ((db && db.settings) || {}).dossierReseau; return x && typeof x === 'object' ? { chemin: String(x.chemin || ''), consigne: String(x.consigne || ''), par: x.par || '', le: x.le || '' } : { chemin: '', consigne: '', par: '', le: '' }; };
function dossierReseauSet(db, x, uid) {
  const chemin = String((x && x.chemin) || '').trim(); const consigne = String((x && x.consigne) || '').trim();
  if (chemin.length > RESEAU_CHEMIN_MAX) return fail(`Chemin trop long (${RESEAU_CHEMIN_MAX} caractères au plus).`);
  if (/[\u0000-\u001f\u007f]/.test(chemin)) return fail('Le chemin contient des caractères invalides.');
  if (consigne.length > 500) return fail('Consigne trop longue (500 caractères au plus).');
  if (!chemin && !consigne) { delete db.settings.dossierReseau; return okr(); }
  const av = db.settings.dossierReseau || {};
  db.settings.dossierReseau = { ...av, chemin, consigne, par: uid || av.par || '', le: todayISO() }; // champs inconnus gardés (rétrocompatibilité)
  return okr();
}
