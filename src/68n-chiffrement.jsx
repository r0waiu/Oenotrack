/* ============ CHIFFREMENT (mot de passe de l'équipe) ET RAPPEL DE SAUVEGARDE (0.29.0-alpha.1) ============ */
// demande du mot de passe (réglée par l'application) : (entete { sel, iter, cleId }, raison) → Promise<clé | null>
let CHIFFRE_DEMANDER = null;
// texte qui quitte l'appareil (sauvegarde, Drive, fichier de synchronisation) : chiffré si le réglage commun l'exige
async function sauvTexteSortie(db, texte, interactif) {
  const reg = chiffrementReglage(db); if (!reg) return texte;
  let k = await chiffrementCleAppareil(reg.cleId);
  if (!k && interactif && CHIFFRE_DEMANDER) k = await CHIFFRE_DEMANDER(reg, 'Le chiffrement est activé pour l’équipe : saisissez son mot de passe pour enregistrer le fichier chiffré.');
  if (!k) throw { chiffre: true, sansCle: true, message: 'Chiffrement activé : saisissez le mot de passe de l’équipe sur cet appareil (Paramètres › Sauvegarde & Drive › Chiffrement).' };
  return chiffrerTexte(k, texte);
}
// texte reçu : déchiffré s'il est chiffré (clé de l'appareil, sinon mot de passe demandé si interactif)
async function sauvTexteEntree(texte, interactif) {
  const env = enveloppeChiffree(texte); if (!env) return texte;
  let k = await chiffrementCleAppareil(env.chiffrement.cleId);
  if (!k && interactif && CHIFFRE_DEMANDER) k = await CHIFFRE_DEMANDER(env.chiffrement, 'Ce fichier est chiffré : saisissez le mot de passe de chiffrement de l’équipe.');
  if (!k) throw { chiffre: true, sansCle: true, message: env.chiffrement.cleId && chiffrementCleLire() ? 'Fichier chiffré avec un autre mot de passe (changé depuis ?) : saisissez le mot de passe actuel de l’équipe.' : 'Fichier chiffré : saisissez le mot de passe de chiffrement de l’équipe sur cet appareil.' };
  return dechiffrerTexte(k, env);
}
const fichierChiffre = async (blob, k) => new Blob([await chiffrerOctets(k, new Uint8Array(await blob.arrayBuffer()))], { type: 'application/octet-stream' });

// boîte « mot de passe » : saisir (fichier ou réglage existant), activer, changer
function MdpChiffrementDialog({ d, onFin }) {
  const { toast } = useApp(); const [mdp, setMdp] = useState(''); const [conf, setConf] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [voir, setVoir] = useState(false);
  const nouveau = d.mode === 'activer' || d.mode === 'changer';
  const ok = async () => {
    const e = nouveau ? chiffrementMdpErreur(mdp, conf) : (!mdp ? 'Saisissez le mot de passe.' : ''); if (e) { setErr(e); return; }
    setBusy(true); setErr('');
    try {
      if (nouveau) { const k = await chiffrementDeriver(mdp, null, CHIFFRE_ITER); onFin(k); return; }
      const ent = d.entete || {}; const k = await chiffrementDeriver(mdp, ent.sel, ent.iter);
      const bon = ent.temoin ? await chiffrementVerifier(k, ent) : !ent.cleId || k.cleId === ent.cleId;
      if (!bon) { setErr('Mot de passe incorrect.'); setBusy(false); return; }
      chiffrementRetenir(k); toast('Mot de passe accepté : la clé est gardée sur cet appareil.'); onFin(k);
    } catch (er) { setErr((er && er.message) || 'Calcul de la clé impossible sur cet appareil.'); setBusy(false); }
  };
  return (
    <FormSheet title={d.mode === 'activer' ? 'Activer le chiffrement' : d.mode === 'changer' ? 'Changer le mot de passe de chiffrement' : 'Mot de passe de chiffrement'} onClose={() => onFin(null)} onSave={ok} saveLabel={busy ? 'Calcul de la clé…' : nouveau ? 'Enregistrer' : 'Déverrouiller'} disabled={busy}>
      {d.raison ? <p className="text-sm">{d.raison}</p> : null}
      <Field label={nouveau ? 'Nouveau mot de passe de l’équipe' : 'Mot de passe de l’équipe'} help={nouveau ? `Au moins ${CHIFFRE_MDP_MIN} caractères : une phrase facile à retenir convient.` : ''}><input className="inp" type={voir ? 'text' : 'password'} autoComplete={nouveau ? 'new-password' : 'current-password'} value={mdp} onChange={(e) => setMdp(e.target.value)} autoFocus /></Field>
      {nouveau ? <Field label="Confirmer le mot de passe"><input className="inp" type={voir ? 'text' : 'password'} autoComplete="new-password" value={conf} onChange={(e) => setConf(e.target.value)} /></Field> : null}
      <Check checked={voir} onChange={setVoir} label="Afficher le mot de passe" />
      {err ? <Notice tone="bad" title="À corriger">{err}</Notice> : null}
      {nouveau ? <Notice tone="warn" title="Mot de passe perdu = fichiers illisibles">Personne ne peut le retrouver, pas même l’éditeur d’Œnotrack : notez-le dans un endroit sûr. Il n’est jamais enregistré dans la base, dans les sauvegardes ni sur le Drive ; chaque appareil garde seulement sa clé.</Notice> : null}
    </FormSheet>
  );
}

// clé IA commune de l'espace de travail (0.38.0-alpha.1) : rechiffrée avec la nouvelle clé de l'équipe au changement de mot de passe
async function iaCleReChiffrer(db, kNouveau) {
  const r = iaEspaceReglage(db); if (!r || !r.cle) return null; const e = enveloppeChiffree(r.cle); if (!e) return null;
  const ancien = await chiffrementCleAppareil(e.chiffrement.cleId); if (!ancien) return null; // illisible ici : l'administrateur la ressaisira
  try { const v = await dechiffrerTexte(ancien, r.cle); return { cle: await chiffrerTexte(kNouveau, v), cleId: kNouveau.cleId }; } catch (er) { return null; }
}
// carte « Chiffrement » (Paramètres › Sauvegarde & Drive)
function ChiffrementCard() {
  const { db, act, confirm, toast, uid, secu } = useApp(); const reg = chiffrementReglage(db); const [dlg, setDlg] = useState(null); const [, setN] = useState(0);
  const local = chiffrementCleLire(); const cleOK = !!(reg && local && local.cleId === reg.cleId);
  const autorise = !secu || peut0(db, uid);
  const activer = (mode) => setDlg({ mode, raison: mode === 'activer' ? 'Les prochaines sauvegardes et la synchronisation avec le Drive seront chiffrées avec ce mot de passe, commun à toute l’équipe.' : 'Les fichiers déjà enregistrés restent lisibles avec l’ancien mot de passe ; les prochains utiliseront le nouveau. Chaque appareil devra saisir le nouveau mot de passe.' });
  const fin = async (k) => {
    const m = dlg && dlg.mode; setDlg(null); if (!k) return;
    if (m === 'activer' || m === 'changer') { const nouveau = await chiffrementReglageNouveau(k, uid || ''); const ia = await iaCleReChiffrer(db, k); const r = act((d) => { d.settings.chiffrement = nouveau; if (ia) d.settings.ia = { ...d.settings.ia, ...ia }; return okr(); }, m === 'activer' ? 'Chiffrement activé : prochaines sauvegardes et synchronisations chiffrées.' : 'Mot de passe de chiffrement changé.'); if (r && r.ok) chiffrementRetenir(k); }
    setN((x) => x + 1);
  };
  const desactiver = async () => { if (!(await confirm({ title: 'Désactiver le chiffrement ?', body: 'Les prochaines sauvegardes et la synchronisation avec le Drive seront de nouveau en clair. Les fichiers déjà chiffrés restent lisibles avec le mot de passe.', ok: 'Désactiver', danger: true }))) return; act((d) => { d.settings.chiffrement = { ...(d.settings.chiffrement || {}), actif: false }; return okr(); }, 'Chiffrement désactivé.'); };
  const oublier = async () => { if (!(await confirm({ title: 'Oublier la clé sur cet appareil ?', body: 'Le mot de passe sera redemandé pour la prochaine sauvegarde ou synchronisation.', ok: 'Oublier' }))) return; chiffrementOublierCle(); setN((x) => x + 1); toast('Clé oubliée sur cet appareil.'); };
  let dispo = true; try { chSubtle(); } catch (e) { dispo = false; }
  return (
    <section className="card p-4" aria-labelledby="svch" data-chiffrement={reg ? (cleOK ? 'actif' : 'sans-cle') : 'inactif'}>
      <div className="flex flex-wrap items-center gap-3"><div className="sauv-ic" aria-hidden="true">🔒</div><h3 id="svch" className="text-lg font-semibold">Chiffrement des sauvegardes et du Drive</h3>{reg ? <Chip tone="ok">activé</Chip> : <Chip>désactivé</Chip>}</div>
      <p className="mt-2 text-sm">Un mot de passe commun à l’équipe chiffre (AES-256) ce qui quitte l’appareil : sauvegarde complète, fichier du Drive et ses copies, documents joints envoyés au Drive, fichier de synchronisation. Sur chaque appareil, les données sont aussi chiffrées par le coffre de l’appareil, qui garde la clé de l’équipe.</p>
      {reg ? <div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span>Depuis le </span><span className="num">{fmtDate(reg.depuis)}</span><span> · cet appareil :</span>{cleOK ? <Chip tone="ok">clé enregistrée</Chip> : <Chip tone="warn">mot de passe à saisir</Chip>}</div> : null}
      {!dispo ? <div className="mt-2"><Notice tone="warn" title="Indisponible ici">Le chiffrement demande une connexion sécurisée (https) ou l’application installée.</Notice></div> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {!reg ? <Btn kind="primary" disabled={!autorise || !dispo} onClick={() => activer('activer')}>Activer le chiffrement…</Btn> : <>
          {!cleOK ? <Btn kind="primary" disabled={!dispo} onClick={() => setDlg({ mode: 'saisir', entete: reg, raison: 'Saisissez le mot de passe de chiffrement de l’équipe : la clé sera gardée sur cet appareil.' })}>Saisir le mot de passe sur cet appareil</Btn> : <Btn onClick={oublier}>Oublier la clé sur cet appareil</Btn>}
          <Btn disabled={!autorise || !dispo} onClick={() => activer('changer')}>Changer le mot de passe…</Btn><Btn kind="danger" disabled={!autorise} onClick={desactiver}>Désactiver</Btn></>}
      </div>
      {!autorise ? <p className="help mt-2">Réglage commun : réservé aux profils « Sauvegardes et Drive ».</p> : null}
      <p className="help mt-2">Les appareils restés sur une version antérieure à la 0.29.0-alpha.1 ne peuvent pas lire un Drive chiffré (ils s’arrêtent sans rien écraser) : mettez-les à jour.</p>
      {dlg ? <MdpChiffrementDialog d={dlg} onFin={fin} /> : null}
    </section>
  );
}
const peut0 = (db, uid) => peut(db, uid, 'sauvegarde');

// export de la base complète (chiffré si le réglage l'exige) : utilisé par Paramètres › Sauvegarde et par le rappel
function useExportComplet() {
  const { db, act, toast } = useApp(); const [busy, setBusy] = useState(false);
  const exporter = async (opts) => {
    setBusy(true);
    try {
      const b = await buildSauvegarde(db); const clair = opts && opts.clair; const chiffre = !clair && chiffrementActif(db);
      const texte = chiffre ? await sauvTexteSortie(db, b.text, true) : b.text; const name = `oenotrack-sauvegarde-${todayISO()}${chiffre ? '-chiffree' : ''}.json`;
      const r = await saveFile(name, new Blob([texte], { type: 'application/json' }), 'application/json');
      if (r.ok) { act((d) => { d.meta.derniereExport = todayISO(); return okr(); }, `Sauvegarde complète enregistrée${chiffre ? ' (chiffrée)' : ''} : ${name} (${fmtSize(texte.length)}, ${b.head.contenu.documents} document(s))${b.manquants.length ? ` — ${b.manquants.length} fichier(s) introuvable(s) dans ce navigateur` : ''}.`); try { window.localStorage.removeItem(RAPPEL_REPORT_KEY); } catch (e) { /* ignoré */ } }
      else if (r.declined) toast('Sauvegarde annulée.'); else toast(failMsg(r), 'bad');
    } catch (er) { toast(er && er.chiffre ? er.message : 'Sauvegarde impossible (stockage des documents indisponible ?).', 'bad'); }
    setBusy(false);
  };
  return { exporter, busy };
}

// rappel discret : base gardée seulement sur cet appareil (pas de Drive) et pas de sauvegarde récente
const RAPPEL_REPORT_KEY = 'oenotrack-rappel-sauvegarde';
function RappelSauvegarde() {
  const { db, cloud, sync, secu, uid, setTab } = useApp(); const { exporter, busy } = useExportComplet(); const [, setN] = useState(0);
  if (secu && !peut(db, uid, 'sauvegarde')) return null;
  let reporte = ''; try { reporte = window.localStorage.getItem(RAPPEL_REPORT_KEY) || ''; } catch (e) { reporte = ''; }
  const lie = !!((cloud && cloud.lie) || (sync && sync.etat && sync.etat.fichierNom && !sync.etat.suspendu && sync.etat.derniereSync && joursEntre(sync.etat.derniereSync, todayISO()) <= 2));
  const e = rappelSauvegardeEtat({ derniere: derniereSauvegarde(db), depuis: (db.meta || {}).creeLe, jours: db.settings.rappelSauvegardeJours, lie, vide: baseVide(db), aujourdhui: todayISO(), reporte });
  if (!e.montrer) return null;
  const plusTard = () => { try { window.localStorage.setItem(RAPPEL_REPORT_KEY, addDays(todayISO(), 1)); } catch (er) { /* ignoré */ } setN((x) => x + 1); };
  return (
    <div className="wrap pb-3" data-rappel-sauvegarde=""><div className="rappel-sauv">
      <span aria-hidden="true">💾</span><span className="min-w-0 flex-1 text-sm">{e.jamais ? <span>Vos données ne sont enregistrées que dans ce navigateur et n’ont encore jamais été sauvegardées.</span> : <><span>Vos données ne sont enregistrées que dans ce navigateur ; dernière sauvegarde il y a </span><b className="num">{e.jours}</b><span> jour(s).</span></>}</span>
      <Btn size="sm" kind="primary" disabled={busy} onClick={() => exporter()}>{busy ? 'Préparation…' : '⬇ Sauvegarder maintenant'}</Btn><Btn size="sm" onClick={() => setTab('params', 'sauvegarde')}>Drive…</Btn><Btn size="sm" kind="ghost" onClick={plusTard}>Plus tard</Btn>
    </div></div>
  );
}
