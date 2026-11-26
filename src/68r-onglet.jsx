/* ============ ONGLET UNIQUE : écran de blocage (0.38.0-alpha.3) ============
   Moteur : 33e-onglet.js. OngletPorte s'affiche avant tout le reste : un second onglet d'Œnotrack ouvert sur cet appareil est bloqué
   (rien n'y est lu ni écrit) ; « Reprendre la main ici » bloque l'autre onglet et recharge celui-ci avec la base à jour. Un onglet qui
   perd la main démonte l'application (synchronisations et minuteries arrêtées). */
function OngletPorte({ children }) {
  const [etat, setEtat] = useState(() => ongletEtat()); const [busy, setBusy] = useState(false);
  useEffect(() => { const off = ongletEcouter(setEtat); ongletDemarrer().then(setEtat, () => setEtat('actif')); return off; }, []);
  if (etat === 'actif') return children;
  if (etat !== 'bloque') return <div className="login-wrap" data-onglet="attente"><p className="text-sm text-ink2">Ouverture d’Œnotrack…</p></div>;
  const reprendre = async () => { setBusy(true); try { await ongletReprendre(); } catch (e) { setBusy(false); } };
  return (
    <div className="login-wrap" data-onglet="bloque">
      <div className="login-card card" role="alertdialog" aria-label="Œnotrack est déjà ouvert dans un autre onglet">
        <div className="login-tete"><Brand size={44} /><LangueChoix compact /></div>
        <div><h1 className="login-titre">Œnotrack est déjà ouvert dans un autre onglet</h1>
          <p className="text-sm text-ink2">Un seul onglet peut travailler à la fois sur cet appareil : deux onglets enregistreraient chacun leur version de la base, et la saisie de l’un effacerait celle de l’autre. Continuez dans l’autre onglet, ou reprenez la main ici.</p></div>
        <Btn kind="primary" className="w-full" disabled={busy} onClick={reprendre}>{busy ? 'Reprise en cours…' : 'Reprendre la main ici'}</Btn>
        <p className="text-xs text-ink2">L’autre onglet termine ses enregistrements puis se bloque ; celui-ci se recharge avec la base à jour.</p>
      </div>
    </div>
  );
}
