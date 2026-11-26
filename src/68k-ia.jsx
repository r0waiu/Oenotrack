/* ============ PARAMÈTRES › 🤖 ASSISTANT IA (0.20.0-alpha.1) : service et clé API propres à chaque utilisateur, sur son appareil ============
   Réglage enregistré dans ce navigateur seulement (iaConfigLire / iaConfigEcrire, 17-ia.js) : jamais dans la base ni les sauvegardes.
   0.38.0-alpha.1 : clés personnelles dans le coffre de l'appareil (chiffrées) ou pour la session seulement ; espace de travail
   (IaEspaceCard, administrateurs) : service, modèle et clé communs — la clé est chiffrée avec la clé de l'équipe avant d'entrer dans
   la base (iaEspaceRegler) — et droit des autres utilisateurs d'ajouter leurs propres clés et modèles (iaPersoAutorise). */
// état de l'espace de travail sur cet appareil (appelé par App) : clé commune déchiffrée en mémoire, jamais enregistrée
function useIaEspace(db, uid) {
  const r = iaEspaceReglage(db); const [k, setK] = useState({ env: null, valeur: '', etat: 'absente' }); const [n, setN] = useState(0);
  useEffect(() => { const f = () => setN((x) => x + 1); window.addEventListener('oenotrack-cle-equipe', f); return () => window.removeEventListener('oenotrack-cle-equipe', f); }, []);
  const env = r && r.cle ? r.cle : '';
  useEffect(() => {
    let vivant = true; if (!env) { setK({ env: '', valeur: '', etat: 'absente' }); return undefined; }
    (async () => {
      const e = enveloppeChiffree(env); let x = { env, valeur: '', etat: 'illisible' };
      try { const cle = e ? await chiffrementCleAppareil(e.chiffrement.cleId) : null; if (!cle) x = { env, valeur: '', etat: 'sans-cle-equipe' }; else x = { env, valeur: String(await dechiffrerTexte(cle, env)).trim(), etat: 'ok' }; } catch (er) { x = { env, valeur: '', etat: 'illisible' }; }
      if (vivant) setK(x);
    })();
    return () => { vivant = false; };
  }, [env, n]);
  _iaEspace = r ? { reglage: r, cle: k.env === env ? k.valeur : '', etatCle: !env ? 'absente' : k.env === env ? k.etat : 'attente', persoAutorise: iaPersoAutorise(db, uid) } : null;
  return _iaEspace;
}
// clé commune → enveloppe chiffrée avec la clé de l'équipe (exige le chiffrement des sauvegardes et la clé sur cet appareil)
async function iaCleEspaceChiffrer(db, cle) {
  const reg = chiffrementReglage(db); if (!reg) throw { message: 'Activez d’abord le chiffrement des sauvegardes et du Drive (Paramètres › 💾 Sauvegarde & Drive) : la clé commune est chiffrée avec la clé de l’équipe.' };
  const k = await chiffrementCleAppareil(reg.cleId); if (!k) throw { message: 'Saisissez d’abord le mot de passe de chiffrement de l’équipe sur cet appareil (Paramètres › 💾 Sauvegarde & Drive).' };
  return { cle: await chiffrerTexte(k, String(cle).trim()), cleId: k.cleId, masque: iaMasque(cle) };
}
function IaEspaceCard() {
  const { db, act, toast, confirm, secu, uid } = useApp(); const r = iaEspaceReglage(db); const E = _iaEspace;
  const admin = !secu || estAdmin(db, uid);
  const [f, setF] = useState(() => ({ fournisseur: (r && r.fournisseur) || 'anthropic', modele: (r && r.modele) || '', url: (r && r.url) || '', cle: '' }));
  const [voir, setVoir] = useState(false); const [busy, setBusy] = useState(''); const [test, setTest] = useState(null); const [ouvert, setOuvert] = useState(!!r);
  const F = iaFournisseur(f.fournisseur); const reg = chiffrementReglage(db);
  const users = (db.utilisateurs || []).filter((u) => u && u.actif !== false && !estAdmin(db, u.id));
  if (!admin && !r) return null;
  const enregistrer = async () => {
    setBusy('enr'); setTest(null);
    try {
      let c = {}; if (f.cle.trim()) c = await iaCleEspaceChiffrer(db, f.cle);
      const res = act((d) => iaEspaceRegler(d, { fournisseur: f.fournisseur, modele: f.modele || F.modele, url: f.url, ...(f.cle.trim() ? c : {}) }, uid), 'Assistant IA de l’espace de travail enregistré (pour toute l’équipe).');
      if (res && res.ok) setF((x) => ({ ...x, cle: '' }));
    } catch (e) { toast((e && e.message) || String(e), 'bad'); }
    setBusy('');
  };
  const politique = (patch) => act((d) => iaEspaceRegler(d, patch, uid), 'Droits des clés personnelles enregistrés.');
  const retirerCle = async () => { if (!(await confirm({ title: 'Retirer la clé commune ?', body: 'Les utilisateurs sans clé personnelle ne pourront plus utiliser l’assistant IA.', ok: 'Retirer', danger: true }))) return; act((d) => iaEspaceRegler(d, { cle: '' }, uid), 'Clé commune retirée.'); };
  const toutRetirer = async () => { if (!(await confirm({ title: 'Retirer le réglage de l’espace de travail ?', body: 'Service, modèle, clé commune et droits des clés personnelles sont retirés : chacun utilise de nouveau sa propre clé.', ok: 'Retirer', danger: true }))) return; act((d) => iaEspaceRetirer(d), 'Réglage de l’espace de travail retiré.'); setOuvert(false); };
  const tester = async () => {
    setBusy('test'); setTest(null);
    try { const A = iaActive({ source: 'espace' }); const R = await iaDemander({ ...A, cle: f.cle.trim() || A.cle, fournisseur: F.id, modele: f.modele || F.modele, url: F.id === 'perso' ? f.url.replace(/\/+$/, '') : '', pret: true }, { system: 'Tu réponds en français, en une phrase courte.', texte: 'Test de connexion depuis Œnotrack : réponds « Connexion réussie » suivi du nom de ton modèle.', max: 80, delai: 60000 }); setTest({ ok: true, msg: R.texte.slice(0, 240) || 'Réponse vide (connexion établie).' }); }
    catch (e) { setTest({ ok: false, msg: (e && e.message) || String(e) }); }
    setBusy('');
  };
  const etatCle = E && E.etatCle;
  return (
    <div className="card space-y-3 p-4" data-ia-espace="">
      <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Espace de travail : assistant commun</h3>{r ? <Chip tone="ok"><span>réglé</span>{r.modele ? <span translate="no"> · {iaFournisseur(r.fournisseur).court} · {r.modele}</span> : null}</Chip> : <Chip>non réglé</Chip>}
        {r && r.cle ? (etatCle === 'ok' ? <Chip tone="ok"><span>clé commune</span> <span translate="no">{r.masque}</span></Chip> : etatCle === 'sans-cle-equipe' ? <Chip tone="warn">clé commune : mot de passe de l’équipe à saisir sur cet appareil</Chip> : etatCle === 'illisible' ? <Chip tone="bad">clé commune illisible</Chip> : null) : null}</div>
      <p className="help">{admin ? 'L’administrateur règle un service, un modèle et une clé API communs à toute l’équipe, et décide qui peut ajouter ses propres clés et modèles. La clé commune est chiffrée avec la clé de chiffrement de l’équipe : elle n’est jamais en clair dans la base, la synchronisation, le Drive ni les sauvegardes, et seuls les appareils qui ont la clé de l’équipe peuvent l’utiliser.' : 'Réglé par l’administrateur de l’espace de travail.'}</p>
      {admin && !ouvert ? <Btn onClick={() => setOuvert(true)}>Régler l’assistant commun…</Btn> : null}
      {admin && ouvert ? <>
        {!reg ? <Notice tone="warn" title="Chiffrement de l’équipe nécessaire">La clé commune est chiffrée avec la clé de l’équipe : activez d’abord le chiffrement des sauvegardes et du Drive (Paramètres › 💾 Sauvegarde &amp; Drive).</Notice> : null}
        <div className="grid2">
          <Field label="Service d’IA commun"><SI plain value={F.id} onChange={(v) => { setF({ ...f, fournisseur: v, modele: '' }); setTest(null); }} options={IA_FOURNISSEURS.map((x) => ({ value: x.id, label: x.nom }))} aria-label="Service d’IA commun" /></Field>
          <Field label="Modèle par défaut" help={`Par défaut : ${F.modele || 'à saisir'}.`}><input className="inp" value={f.modele} onChange={(e) => setF({ ...f, modele: e.target.value })} placeholder={F.modele || 'nom du modèle'} aria-label="Modèle commun" /></Field>
        </div>
        {F.id === 'perso' ? <Field label="Adresse du service (compatible OpenAI)"><TI value={f.url} onChange={(v) => setF({ ...f, url: v })} placeholder="https://api.exemple.com/v1" aria-label="Adresse du service commun" /></Field> : null}
        <Field label={`Clé API commune ${F.court}`} help={r && r.cle ? `Enregistrée (chiffrée) : ${r.masque}. Laissez vide pour la garder.` : 'Collez la clé créée sur le compte de l’entreprise.'}>
          <div className="flex flex-wrap items-center gap-2"><input className="inp min-w-0 flex-1" type={voir ? 'text' : 'password'} autoComplete="off" spellCheck={false} value={f.cle} onChange={(e) => setF({ ...f, cle: e.target.value })} aria-label="Clé API commune" style={{ minWidth: 220 }} /><Btn size="sm" onClick={() => setVoir(!voir)}>{voir ? 'Masquer' : 'Afficher'}</Btn></div></Field>
        <div className="flex flex-wrap items-center gap-2">
          <Btn kind="primary" disabled={busy === 'enr' || (!!f.cle.trim() && !reg)} onClick={enregistrer}>{busy === 'enr' ? 'Enregistrement…' : 'Enregistrer pour l’espace de travail'}</Btn>
          <Btn disabled={busy === 'test' || !(f.cle.trim() || (E && E.cle)) && F.id !== 'perso'} onClick={tester}>{busy === 'test' ? 'Test en cours…' : 'Tester'}</Btn>
          {r && r.cle ? <Btn kind="danger" onClick={retirerCle}>Retirer la clé commune</Btn> : null}
          {r ? <Btn kind="ghost" onClick={toutRetirer}>Retirer le réglage</Btn> : null}
        </div>
        {test ? <Notice tone={test.ok ? 'ok' : 'bad'} title={test.ok ? 'Connexion réussie' : 'Échec de la connexion'}>{test.msg}</Notice> : null}
        {r ? <div className="space-y-2" data-ia-droits="">
          <h4 className="font-semibold">Clés et modèles personnels des autres utilisateurs</h4>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Droit d’ajouter ses propres clés">
            {[['tous', 'Autorisés pour tous'], ['choisis', 'Autorisés pour certains'], ['aucun', 'Interdits (clé commune seulement)']].map(([v, l]) => <Btn key={v} size="sm" kind={r.perso === v ? 'primary' : undefined} aria-pressed={r.perso === v} onClick={() => politique({ perso: v })}>{l}</Btn>)}
          </div>
          {r.perso === 'choisis' ? (users.length ? <div className="flex flex-wrap gap-x-4 gap-y-1">{users.map((u) => <Check key={u.id} checked={r.persoUtilisateurs.includes(u.id)} onChange={(v) => politique({ persoUtilisateurs: v ? [...r.persoUtilisateurs, u.id] : r.persoUtilisateurs.filter((x) => x !== u.id) })} label={<span translate="no">{u.nom || u.identifiant}</span>} />)}</div> : <p className="help">Aucun autre utilisateur actif.</p>) : null}
          <p className="help">S’applique aux utilisateurs connectés (identifiants activés) ; les administrateurs gardent toujours ce droit. Retirer le droit n’efface pas les clés déjà gardées sur les appareils : elles ne sont plus utilisées.</p>
        </div> : null}
      </> : null}
    </div>
  );
}
function IaView() {
  const { toast, confirm } = useApp(); const [c, setC] = useState(() => iaConfigLire()); const E = _iaEspace; const persoOK = !E || E.persoAutorise;
  const A = iaActive(c); const P = iaActivePerso(c); const F = iaFournisseur(P.fournisseur);
  const [voir, setVoir] = useState(false); const [modeles, setModeles] = useState([]); const [busy, setBusy] = useState(''); const [test, setTest] = useState(null);
  const maj = (patch) => { const n = { ...c, ...patch }; setC(n); if (!iaConfigEcrire(n)) toast('Impossible d’enregistrer le réglage dans ce navigateur (stockage indisponible).', 'bad'); };
  const majCle = (v) => { maj({ cles: { ...(c.cles || {}), [F.id]: String(v || '').trim() } }); setTest(null); };
  const majModele = (v) => { maj({ modeles: { ...(c.modeles || {}), [F.id]: String(v || '').trim() } }); setTest(null); };
  const choisir = (id) => { maj({ fournisseur: id }); setModeles([]); setTest(null); setVoir(false); };
  const charger = async () => { setBusy('modeles'); try { const L = await iaModeles(P); setModeles(L); toast(L.length ? `${L.length} modèle${L.length > 1 ? 's' : ''} disponible${L.length > 1 ? 's' : ''} : choisissez dans la liste du champ « Modèle ».` : 'Aucun modèle renvoyé par le service.'); } catch (e) { toast((e && e.message) || String(e), 'bad'); } setBusy(''); };
  const tester = async () => {
    setBusy('test'); setTest(null);
    try { const R = await iaDemander(P, { system: 'Tu réponds en français, en une phrase courte.', texte: 'Test de connexion depuis Œnotrack : réponds « Connexion réussie » suivi du nom de ton modèle.', max: 80, delai: 60000 }); setTest({ ok: true, msg: R.texte.slice(0, 240) || 'Réponse vide (connexion établie).' }); }
    catch (e) { setTest({ ok: false, msg: (e && e.message) || String(e) }); }
    setBusy('');
  };
  const effacerTout = async () => { if (!(await confirm({ title: 'Effacer les clés de cet appareil ?', body: 'Toutes les clés API enregistrées dans ce navigateur sont supprimées (les autres appareils ne sont pas concernés).', ok: 'Effacer', danger: true }))) return; maj({ cles: {} }); setTest(null); toast('Clés API effacées de cet appareil.'); };
  let cadre = false; try { cadre = window.self !== window.top; } catch (e) { cadre = true; }
  const nCles = Object.values(c.cles || {}).filter(Boolean).length;
  return (
    <div className="space-y-4" data-ia-reglages="">
      <Notice tone="info" title="Votre IA, avec votre propre compte">Œnotrack ne fournit ni intelligence artificielle ni clé : chacun peut utiliser son propre compte Claude, ChatGPT, Gemini, Mistral… avec sa clé API. La clé reste <b>sur cet appareil</b>, chiffrée dans le coffre de l’appareil (aucun script ne peut la lire dans le stockage du navigateur) : elle n’est jamais enregistrée dans la base, la synchronisation, les sauvegardes ni le Drive, et chaque utilisateur règle la sienne. Les demandes partent directement de ce navigateur vers le service choisi.</Notice>
      {cadre ? <Notice tone="warn" title="Page affichée dans claude.ai">Ici, claude.ai bloque en général les appels vers les services extérieurs : si « Tester la connexion » échoue, réglez et utilisez l’assistant dans Œnotrack en ligne (Paramètres › 💾 Sauvegarde &amp; Drive › « Mettre Œnotrack en ligne ») ou dans le fichier enregistré puis ouvert dans votre navigateur.</Notice> : null}
      <IaEspaceCard />
      {E && E.reglage && persoOK ? <div className="card space-y-2 p-4" data-ia-source="">
        <h3 className="font-semibold">Clé utilisée par l’assistant</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Clé utilisée">
          {[['auto', 'Ma clé si elle est réglée, sinon la clé commune'], ['espace', 'Clé commune de l’espace de travail'], ['perso', 'Ma propre clé']].map(([v, l]) => <Btn key={v} size="sm" kind={(c.source || 'auto') === v ? 'primary' : undefined} aria-pressed={(c.source || 'auto') === v} onClick={() => { maj({ source: v }); setTest(null); }}>{l}</Btn>)}
        </div>
        <p className="help" data-ia-en-cours="">En ce moment : {A.pret ? <b><span>{A.source === 'espace' ? 'clé commune' : 'votre clé'}</span><span translate="no"> · {A.nom} · {A.modele}</span></b> : <span>aucune clé utilisable</span>}</p>
      </div> : null}
      {!persoOK ? <Notice tone="info" title="Clé commune de l’espace de travail"><span>Votre administrateur n’a pas autorisé les clés et modèles personnels : l’assistant utilise la clé commune de l’espace de travail.</span>{A.pret ? <span translate="no"> {A.nom} · {A.modele}</span> : null}{E && E.etatCle === 'sans-cle-equipe' ? <span> Saisissez le mot de passe de chiffrement de l’équipe sur cet appareil (Paramètres › 💾 Sauvegarde & Drive) pour l’utiliser.</span> : null}</Notice> : null}
      {persoOK ? <div className="card space-y-3 p-4" data-ia-perso="">
        <Field label="Service d’IA"><SI plain value={F.id} onChange={choisir} options={IA_FOURNISSEURS.map((x) => ({ value: x.id, label: x.nom }))} aria-label="Service d’IA" /></Field>
        <p className="help">{F.aide}{F.console ? <> <a className="linkish" href={F.console} target="_blank" rel="noopener noreferrer">Créer une clé ↗</a></> : null}</p>
        {F.id === 'perso' ? <Field label="Adresse du service (compatible OpenAI)" help="Jusqu’à « /v1 » : Œnotrack y ajoute « /chat/completions » et « /models »."><TI value={c.url || ''} onChange={(v) => { maj({ url: v }); setTest(null); }} placeholder="https://api.exemple.com/v1" aria-label="Adresse du service" /></Field> : null}
        <Field label={`Clé API ${F.court}${F.id === 'perso' ? ' (facultative)' : ''}`} help={P.cle ? (c.memoire ? `Gardée pour cette session seulement : ${iaMasque(P.cle)}` : `Enregistrée sur cet appareil, chiffrée dans le coffre : ${iaMasque(P.cle)}`) : 'Collez ici la clé créée sur le site du service.'}>
          <div className="flex flex-wrap items-center gap-2"><input className="inp min-w-0 flex-1" type={voir ? 'text' : 'password'} autoComplete="off" spellCheck={false} value={(c.cles || {})[F.id] || ''} onChange={(e) => majCle(e.target.value)} placeholder={F.id === 'anthropic' ? 'sk-ant-…' : F.id === 'openrouter' ? 'sk-or-…' : F.id === 'gemini' ? 'AIza…' : 'clé API'} aria-label={`Clé API ${F.court}`} style={{ minWidth: 220 }} />
            <Btn size="sm" onClick={() => setVoir(!voir)}>{voir ? 'Masquer' : 'Afficher'}</Btn>{P.cle ? <Btn size="sm" kind="danger" onClick={() => { majCle(''); toast('Clé effacée de cet appareil.'); }}>Effacer</Btn> : null}</div></Field>
        <Field label="Modèle" help={`Par défaut : ${F.modele || 'à saisir'}. Les modèles changent souvent : « Charger la liste des modèles » montre ceux de votre compte.`}>
          <div className="flex flex-wrap items-center gap-2"><input className="inp min-w-0 flex-1" list="ia-modeles" value={(c.modeles || {})[F.id] != null ? c.modeles[F.id] : F.modele} onChange={(e) => majModele(e.target.value)} placeholder={F.modele || 'nom du modèle'} aria-label="Modèle d’IA" style={{ minWidth: 200 }} />
            <Btn size="sm" disabled={busy === 'modeles' || (!P.cle && F.id !== 'perso' && F.id !== 'openrouter')} onClick={charger}>{busy === 'modeles' ? 'Chargement…' : 'Charger la liste des modèles'}</Btn></div>
          <datalist id="ia-modeles">{modeles.map((m) => <option key={m.id} value={m.id}>{m.nom && m.nom !== m.id ? m.nom : null}</option>)}</datalist></Field>
        <div className="flex flex-wrap items-center gap-2"><Btn kind="primary" disabled={!P.pret || busy === 'test'} onClick={tester}>{busy === 'test' ? 'Test en cours…' : 'Tester la connexion'}</Btn>{P.pret ? <Chip tone="ok">prêt : {P.nom} · {P.modele}</Chip> : <Chip tone="warn">{F.id === 'perso' ? 'adresse et modèle à renseigner' : 'clé à renseigner'}</Chip>}</div>
        <Check checked={!!c.memoire} onChange={(v) => maj({ memoire: v })} label="Garder ma clé pour cette session seulement (jamais enregistrée : à recoller à la prochaine ouverture)" />
        {test ? <Notice tone={test.ok ? 'ok' : 'bad'} title={test.ok ? 'Connexion réussie' : 'Échec de la connexion'}>{test.msg}</Notice> : null}
      </div> : null}
      <div className="card space-y-2 p-4">
        <h3 className="font-semibold">Ce que fait l’assistant</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li><b>Identifier les documents non reconnus</b> lors d’un dépôt de FT et FDS (Intrants › Fiches FT &amp; FDS) : type, produit, date de révision. Envoyé : le début du texte du document et la liste des noms de vos produits.</li>
          <li><b>Veille en ligne</b> : chercher la page du produit chez le fournisseur et ses dernières FT et FDS (bouton « 🔎 Vérifier en ligne »). Envoyé : nom du produit, fournisseur, référence, dates de vos fiches. Avec Claude, ChatGPT, Gemini et OpenRouter, la recherche web du service est utilisée.</li>
          <li><b>Compléter les fiches produits</b> à la lecture d’une FT, d’une FDS ou d’un certificat (intrants, produits d’hygiène) : l’IA complète ce que la lecture automatique n’a pas trouvé ; vous cochez ce que vous reprenez. Envoyé : le texte du document et le nom du produit.</li>
          <li><b>Bulletins d’analyses.</b> L’IA complète ce que la lecture automatique n’a pas reconnu dans les bulletins importés (onglet Analyses) ; vous vérifiez avant d’enregistrer. Envoyé : le texte du bulletin et la liste de vos paramètres d’analyse (noms et unités) ; les échantillons sont rattachés à vos lots et à vos cuves sur cet appareil.</li>
          <li>Jamais envoyé : vos volumes, vos codes de lots, les noms de vos cuves, ni aucune donnée de traçabilité ; des résultats d’analyses seulement quand vous lisez un bulletin avec l’IA.</li>
        </ul>
        <Check checked={c.completer !== false} onChange={(v) => maj({ completer: v })} label="Compléter les fiches produits avec l’IA à chaque lecture de document (FT, FDS, certificats)" />
        <Check checked={c.bulletins !== false} onChange={(v) => maj({ bulletins: v })} label="Lire les bulletins d’analyses avec l’IA, en complément de la lecture automatique" />
        <Check checked={!!c.auto} onChange={(v) => maj({ auto: v })} label={<>Veille automatique : à l’ouverture d’Œnotrack sur cet appareil, vérifier en ligne les intrants non vérifiés depuis <input className="inp num mx-1 inline-block" style={{ width: 64, minHeight: 28, padding: '1px 6px' }} inputMode="numeric" value={c.autoJours || 30} onChange={(e) => maj({ autoJours: e.target.value.replace(/\D/g, '').slice(0, 3) })} onClick={(e) => e.preventDefault()} aria-label="Nombre de jours entre deux vérifications" /> jours (5 produits au plus par jour)</>} />
        <p className="help">Coût : chaque demande est facturée par le service sur votre compte (en général quelques centimes ; la recherche web est comptée en plus chez certains). Fixez une limite de dépenses dans la console du service. Sur un ordinateur partagé, effacez la clé après usage : toute personne utilisant ce navigateur peut s’en servir.</p>
        {nCles ? <div><Btn size="sm" kind="danger" onClick={effacerTout}>Effacer toutes les clés de cet appareil ({nCles})</Btn></div> : null}
      </div>
    </div>
  );
}
