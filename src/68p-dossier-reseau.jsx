/* ============ PARAMÈTRES › SAUVEGARDE & DRIVE : DOSSIER RÉSEAU DE L'ENTREPRISE (0.34.0-alpha.1) ============
   Chemin commun du dossier partagé (serveur interne, NAS, lecteur réseau) enregistré dans la base : chaque poste le voit et le choisit
   dans la fenêtre du système (le navigateur ne peut pas ouvrir seul un chemin tapé) ; connecteur « reseau » (34-cloud-fournisseurs.js).
   Moteur : 33c-dossier-reseau.js. Réglage : droit « Sauvegardes et Drive ». */
function DossierReseauReglage() {
  const { db, act, uid, secu, toast, cloud } = useApp(); const r = dossierReseau(db); const peutRegler = !secu || peut(db, uid, 'sauvegarde');
  const [f, setF] = useState({ chemin: r.chemin, consigne: r.consigne }); useEffect(() => setF({ chemin: r.chemin, consigne: r.consigne }), [r.chemin, r.consigne]);
  const change = f.chemin.trim() !== r.chemin || f.consigne.trim() !== r.consigne; const conseil = reseauConseil(f.chemin);
  const enregistrer = () => act((d) => dossierReseauSet(d, f, uid), f.chemin.trim() ? 'Dossier réseau de l’entreprise enregistré : tous les postes le voient.' : 'Dossier réseau de l’entreprise retiré.');
  const copier = async () => { try { await navigator.clipboard.writeText(r.chemin); toast('Chemin copié : collez-le dans la fenêtre de choix du dossier.'); } catch (e) { toast('Copie impossible : sélectionnez le chemin à la main.', 'bad'); } };
  const relie = cloud && cloud.lie && cloud.F && cloud.F.id === 'reseau'; const [ouvert, setOuvert] = useState(!!r.chemin && !relie);
  return (
    <details className="sync-guide" data-reseau-reglage="" open={ouvert} onToggle={(e) => setOuvert(e.currentTarget.open)}>
      <summary>🖧 Dossier réseau de l’entreprise (serveur interne, NAS, lecteur réseau)</summary>
      <div className="space-y-3 pt-2">
        <p className="text-sm">Synchronisez les données entre les postes de l’exploitation sur votre propre serveur, sans cloud externe : chaque poste choisit le même dossier partagé avec la tuile <b>« Dossier réseau de l’entreprise »</b>. Œnotrack y lit et écrit <code>oenotrack-base.json</code> (et les dossiers <code>documents</code> et <code>historique</code>) ; les saisies faites en même temps sur plusieurs postes sont réunies, rien n’est perdu.</p>
        {r.chemin ? <div className="card flex flex-wrap items-center gap-2 p-3" data-reseau-chemin=""><span className="lbl mb-0">Dossier de l’entreprise</span><code className="min-w-0 break-all" translate="no">{r.chemin}</code><Btn size="sm" onClick={copier}>📋 Copier le chemin</Btn>{relie ? <Chip tone="ok">relié sur ce poste</Chip> : null}{r.consigne ? <div className="w-full text-sm text-ink2" translate="no">{r.consigne}</div> : null}{reseauConseil(r.chemin) ? <div className="help w-full">{reseauConseil(r.chemin)}</div> : null}</div> : null}
        {peutRegler ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
            <Field label="Chemin du dossier partagé" help={conseil || 'Ex. \\\\serveur\\vinification\\Œnotrack, Z:\\Œnotrack, smb://nas.local/oenotrack ou /Volumes/oenotrack'}><TI value={f.chemin} onChange={(v) => setF({ ...f, chemin: v })} placeholder="\\serveur\partage\Œnotrack" aria-label="Chemin du dossier partagé" /></Field>
            <Field label="Consigne pour les postes (facultatif)"><TI value={f.consigne} onChange={(v) => setF({ ...f, consigne: v })} placeholder="ex. connecter d’abord le lecteur Z: (identifiant du NAS)" aria-label="Consigne pour les postes" /></Field>
            <div className="flex items-end gap-2"><Btn kind="primary" disabled={!change} onClick={enregistrer}>Enregistrer pour tous les postes</Btn>{r.chemin ? <Btn kind="ghost" onClick={() => act((d) => dossierReseauSet(d, { chemin: '', consigne: '' }, uid), 'Dossier réseau de l’entreprise retiré.')}>Retirer</Btn> : null}</div>
          </div>) : !r.chemin ? <p className="help">Aucun dossier réseau renseigné : un profil « Sauvegardes et Drive » peut l’indiquer ici.</p> : null}
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Sur le serveur ou le NAS : créez un dossier partagé (ex. <code>Œnotrack</code>) avec les droits de lecture et d’écriture pour chaque poste.</li>
          <li>Sur chaque poste, rendez-le accessible : Windows, « Connecter un lecteur réseau » (ou le chemin <code>\\serveur\partage</code>) ; Mac, Finder › Aller › Se connecter au serveur (<code>smb://…</code>) ; Linux, montage SMB ou NFS.</li>
          <li>Dans Œnotrack (Chrome ou Edge), tuile « Dossier réseau de l’entreprise » › « Choisir le dossier », puis ouvrez ce dossier. Le navigateur demande l’autorisation une fois ; elle se renouvelle en un clic.</li>
          <li>Firefox, Safari, tablettes : utilisez la synchronisation par fichier (plus bas) avec un fichier posé dans ce dossier.</li>
        </ol>
        <p className="help">Pour des raisons de sécurité, un navigateur ne peut pas ouvrir seul un chemin tapé au clavier : le chemin enregistré ici sert de repère commun pour choisir le bon dossier dans la fenêtre du système. Les données ne quittent pas votre réseau ; le chiffrement des sauvegardes (plus haut) s’applique aussi à ce dossier.</p>
      </div>
    </details>
  );
}
