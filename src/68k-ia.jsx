/* ============ PARAMÈTRES › 🤖 ASSISTANT IA (0.20.0-alpha.1) : service et clé API propres à chaque utilisateur, sur son appareil ============
   Réglage enregistré dans ce navigateur seulement (iaConfigLire / iaConfigEcrire, 17-ia.js) : jamais dans la base ni les sauvegardes. */
function IaView() {
  const { toast, confirm } = useApp(); const [c, setC] = useState(() => iaConfigLire()); const A = iaActive(c); const F = iaFournisseur(A.fournisseur);
  const [voir, setVoir] = useState(false); const [modeles, setModeles] = useState([]); const [busy, setBusy] = useState(''); const [test, setTest] = useState(null);
  const maj = (patch) => { const n = { ...c, ...patch }; setC(n); if (!iaConfigEcrire(n)) toast('Impossible d’enregistrer le réglage dans ce navigateur (stockage indisponible).', 'bad'); };
  const majCle = (v) => { maj({ cles: { ...(c.cles || {}), [F.id]: String(v || '').trim() } }); setTest(null); };
  const majModele = (v) => { maj({ modeles: { ...(c.modeles || {}), [F.id]: String(v || '').trim() } }); setTest(null); };
  const choisir = (id) => { maj({ fournisseur: id }); setModeles([]); setTest(null); setVoir(false); };
  const charger = async () => { setBusy('modeles'); try { const L = await iaModeles(A); setModeles(L); toast(L.length ? `${L.length} modèle${L.length > 1 ? 's' : ''} disponible${L.length > 1 ? 's' : ''} : choisissez dans la liste du champ « Modèle ».` : 'Aucun modèle renvoyé par le service.'); } catch (e) { toast((e && e.message) || String(e), 'bad'); } setBusy(''); };
  const tester = async () => {
    setBusy('test'); setTest(null);
    try { const R = await iaDemander(A, { system: 'Tu réponds en français, en une phrase courte.', texte: 'Test de connexion depuis Œnotrack : réponds « Connexion réussie » suivi du nom de ton modèle.', max: 80, delai: 60000 }); setTest({ ok: true, msg: R.texte.slice(0, 240) || 'Réponse vide (connexion établie).' }); }
    catch (e) { setTest({ ok: false, msg: (e && e.message) || String(e) }); }
    setBusy('');
  };
  const effacerTout = async () => { if (!(await confirm({ title: 'Effacer les clés de cet appareil ?', body: 'Toutes les clés API enregistrées dans ce navigateur sont supprimées (les autres appareils ne sont pas concernés).', ok: 'Effacer', danger: true }))) return; maj({ cles: {} }); setTest(null); toast('Clés API effacées de cet appareil.'); };
  let cadre = false; try { cadre = window.self !== window.top; } catch (e) { cadre = true; }
  const nCles = Object.values(c.cles || {}).filter(Boolean).length;
  return (
    <div className="space-y-4" data-ia-reglages="">
      <Notice tone="info" title="Votre IA, avec votre propre compte">Œnotrack ne fournit ni intelligence artificielle ni clé : chacun peut utiliser son propre compte Claude, ChatGPT, Gemini, Mistral… avec sa clé API. La clé reste <b>sur cet appareil</b> (ce navigateur) : elle n’est jamais enregistrée dans la base, la synchronisation, les sauvegardes ni le Drive, et chaque utilisateur règle la sienne. Les demandes partent directement de ce navigateur vers le service choisi.</Notice>
      {cadre ? <Notice tone="warn" title="Page affichée dans claude.ai">Ici, claude.ai bloque en général les appels vers les services extérieurs : si « Tester la connexion » échoue, réglez et utilisez l’assistant dans Œnotrack en ligne (Paramètres › 💾 Sauvegarde &amp; Drive › « Mettre Œnotrack en ligne ») ou dans le fichier enregistré puis ouvert dans votre navigateur.</Notice> : null}
      <div className="card space-y-3 p-4">
        <Field label="Service d’IA"><SI plain value={F.id} onChange={choisir} options={IA_FOURNISSEURS.map((x) => ({ value: x.id, label: x.nom }))} aria-label="Service d’IA" /></Field>
        <p className="help">{F.aide}{F.console ? <> <a className="linkish" href={F.console} target="_blank" rel="noopener noreferrer">Créer une clé ↗</a></> : null}</p>
        {F.id === 'perso' ? <Field label="Adresse du service (compatible OpenAI)" help="Jusqu’à « /v1 » : Œnotrack y ajoute « /chat/completions » et « /models »."><TI value={c.url || ''} onChange={(v) => { maj({ url: v }); setTest(null); }} placeholder="https://api.exemple.com/v1" aria-label="Adresse du service" /></Field> : null}
        <Field label={`Clé API ${F.court}${F.id === 'perso' ? ' (facultative)' : ''}`} help={A.cle ? `Enregistrée sur cet appareil : ${iaMasque(A.cle)}` : 'Collez ici la clé créée sur le site du service.'}>
          <div className="flex flex-wrap items-center gap-2"><input className="inp min-w-0 flex-1" type={voir ? 'text' : 'password'} autoComplete="off" spellCheck={false} value={(c.cles || {})[F.id] || ''} onChange={(e) => majCle(e.target.value)} placeholder={F.id === 'anthropic' ? 'sk-ant-…' : F.id === 'openrouter' ? 'sk-or-…' : F.id === 'gemini' ? 'AIza…' : 'clé API'} aria-label={`Clé API ${F.court}`} style={{ minWidth: 220 }} />
            <Btn size="sm" onClick={() => setVoir(!voir)}>{voir ? 'Masquer' : 'Afficher'}</Btn>{A.cle ? <Btn size="sm" kind="danger" onClick={() => { majCle(''); toast('Clé effacée de cet appareil.'); }}>Effacer</Btn> : null}</div></Field>
        <Field label="Modèle" help={`Par défaut : ${F.modele || 'à saisir'}. Les modèles changent souvent : « Charger la liste des modèles » montre ceux de votre compte.`}>
          <div className="flex flex-wrap items-center gap-2"><input className="inp min-w-0 flex-1" list="ia-modeles" value={(c.modeles || {})[F.id] != null ? c.modeles[F.id] : F.modele} onChange={(e) => majModele(e.target.value)} placeholder={F.modele || 'nom du modèle'} aria-label="Modèle d’IA" style={{ minWidth: 200 }} />
            <Btn size="sm" disabled={busy === 'modeles' || (!A.cle && F.id !== 'perso' && F.id !== 'openrouter')} onClick={charger}>{busy === 'modeles' ? 'Chargement…' : 'Charger la liste des modèles'}</Btn></div>
          <datalist id="ia-modeles">{modeles.map((m) => <option key={m.id} value={m.id}>{m.nom && m.nom !== m.id ? m.nom : null}</option>)}</datalist></Field>
        <div className="flex flex-wrap items-center gap-2"><Btn kind="primary" disabled={!A.pret || busy === 'test'} onClick={tester}>{busy === 'test' ? 'Test en cours…' : 'Tester la connexion'}</Btn>{A.pret ? <Chip tone="ok">prêt : {A.nom} · {A.modele}</Chip> : <Chip tone="warn">{F.id === 'perso' ? 'adresse et modèle à renseigner' : 'clé à renseigner'}</Chip>}</div>
        {test ? <Notice tone={test.ok ? 'ok' : 'bad'} title={test.ok ? 'Connexion réussie' : 'Échec de la connexion'}>{test.msg}</Notice> : null}
      </div>
      <div className="card space-y-2 p-4">
        <h3 className="font-semibold">Ce que fait l’assistant</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><b>Identifier les documents non reconnus</b> lors d’un dépôt de FT et FDS (Intrants › Fiches FT &amp; FDS) : type, produit, date de révision. Envoyé : le début du texte du document et la liste des noms de vos produits.</li>
          <li><b>Veille en ligne</b> : chercher la page du produit chez le fournisseur et ses dernières FT et FDS (bouton « 🔎 Vérifier en ligne »). Envoyé : nom du produit, fournisseur, référence, dates de vos fiches. Avec Claude, ChatGPT, Gemini et OpenRouter, la recherche web du service est utilisée.</li>
          <li><b>Compléter les fiches produits</b> à la lecture d’une FT, d’une FDS ou d’un certificat (intrants, produits d’hygiène) : l’IA complète ce que la lecture automatique n’a pas trouvé ; vous cochez ce que vous reprenez. Envoyé : le texte du document et le nom du produit.</li>
          <li>Jamais envoyé : vos volumes, lots, cuves, analyses, ni aucune donnée de traçabilité.</li>
        </ul>
        <Check checked={c.completer !== false} onChange={(v) => maj({ completer: v })} label="Compléter les fiches produits avec l’IA à chaque lecture de document (FT, FDS, certificats)" />
        <Check checked={!!c.auto} onChange={(v) => maj({ auto: v })} label={<>Veille automatique : à l’ouverture d’Œnotrack sur cet appareil, vérifier en ligne les intrants non vérifiés depuis <input className="inp num mx-1 inline-block" style={{ width: 64, minHeight: 28, padding: '1px 6px' }} inputMode="numeric" value={c.autoJours || 30} onChange={(e) => maj({ autoJours: e.target.value.replace(/\D/g, '').slice(0, 3) })} onClick={(e) => e.preventDefault()} aria-label="Nombre de jours entre deux vérifications" /> jours (5 produits au plus par jour)</>} />
        <p className="help">Coût : chaque demande est facturée par le service sur votre compte (en général quelques centimes ; la recherche web est comptée en plus chez certains). Fixez une limite de dépenses dans la console du service. Sur un ordinateur partagé, effacez la clé après usage : toute personne utilisant ce navigateur peut s’en servir.</p>
        {nCles ? <div><Btn size="sm" kind="danger" onClick={effacerTout}>Effacer toutes les clés de cet appareil ({nCles})</Btn></div> : null}
      </div>
    </div>
  );
}
