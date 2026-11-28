/* ============ ASSISTANT IA — INTERFACE DU SOCLE (0.49.0-alpha.1) : usages, aperçu avant envoi, journal, images, trace ============
   Moteur : 17a-ia-usages.js. À utiliser par toute fonction qui appelle l'IA :
   - const ia = useIaUsage() ; ia.refus(usage) → '' ou raison ; const r = await ia.demander(usage, { system, texte, images, schema, nom })
     → résultat d'iaUsage (r.ok, r.valeur, r.trace) ou null (refus, annulation, erreur : message déjà affiché) ;
   - au niveau 2, avant le premier envoi d'un usage : aperçu de ce qui part (IaApercu, servi par IaApercuHote rendu une fois dans App) :
     « Envoyer cette fois », « Envoyer et ne plus demander pour cet usage » (consentement gardé sur cet appareil), « Annuler » ;
   - iaImagesDepuisFichiers(fichiers, opts) : photos et PDF (pages rendues) → images JPEG en base64 pour la vision ;
   - <IaBouton usage> : bouton « 🤖 … » désactivé avec sa raison quand l'usage n'est pas possible ;
   - <IaTrace ia> : pastille « 🤖 IA » d'un enregistrement proposé par l'IA (S4) ;
   - Paramètres › Assistant IA : IaUsagesCard (interrupteurs, niveaux, accords, niveau 2 réservé au modèle local) et IaJournalCard. */
const IA_APERCU = { ouvrir: null }; // posé par IaApercuHote (une seule instance, dans App)
function IaApercuHote() {
  const [req, setReq] = useState(null);
  useEffect(() => { IA_APERCU.ouvrir = (r) => new Promise((res) => setReq({ ...r, res })); return () => { IA_APERCU.ouvrir = null; }; }, []);
  if (!req) return null;
  const fin = (v) => { const r = req.res; setReq(null); r(v); };
  return <IaApercu req={req} onChoix={fin} />;
}
function IaApercu({ req, onChoix }) {
  const u = iaUsageDef(req.usage) || { nom: req.usage, niveau: 2, envoie: '' }; const c = iaActive(); const local = iaServiceLocal(c);
  const extrait = String(req.texte || '').slice(0, 2500); const reste = String(req.texte || '').length - extrait.length;
  return (
    <Sheet title="Ce qui va être envoyé" sub={u.nom} onClose={() => onChoix('annuler')} footer={<>
      <Btn onClick={() => onChoix('annuler')}>Annuler</Btn>
      <Btn onClick={() => onChoix('toujours')} data-ia-toujours="">Envoyer et ne plus demander pour cet usage</Btn>
      <Btn kind="primary" onClick={() => onChoix('unefois')} data-ia-unefois="">Envoyer cette fois</Btn></>}>
      <div className="space-y-3" data-ia-apercu={req.usage}>
        <Notice tone="warn" title={`${IA_NIVEAUX[u.niveau].court} · ${IA_NIVEAUX[u.niveau].label}`}>Cet usage envoie des données de votre exploitation à <b translate="no">{c.nom}{c.modele ? ` · ${c.modele}` : ''}</b>{local ? ' (modèle installé sur votre réseau : rien ne sort de l’exploitation)' : ', hors de votre appareil'}. Rien n’est enregistré sans votre relecture.</Notice>
        <div><div className="lbl">Ce qui part</div><p className="text-sm">{u.envoie}</p></div>
        {extrait ? <div><div className="lbl">Texte envoyé</div><pre className="ia-apercu-texte" translate="no">{extrait}{reste > 0 ? `\n… (${reste} caractères de plus)` : ''}</pre></div> : null}
        {(req.images || []).length ? <div><div className="lbl">{`Images envoyées : ${req.images.length}`}</div><div className="ia-apercu-images">{req.images.map((i, k) => <img key={k} src={`data:${i.type};base64,${i.data}`} alt={`Image ${k + 1}`} />)}</div></div> : null}
        <p className="help">Chaque envoi est noté dans le journal de cet appareil (Paramètres › 🤖 Assistant IA), sans son contenu. Vous pouvez désactiver cet usage ou retirer votre accord à tout moment.</p>
      </div>
    </Sheet>
  );
}
// appel d'un usage avec l'aperçu au besoin ; messages d'erreur affichés ; null si rien n'est revenu d'exploitable
function useIaUsage() {
  const { db, toast } = useApp(); const dbRef = useRef(db); dbRef.current = db;
  const refus = useCallback((id) => iaUsageRefus(iaActive(), id, iaNiveau2Reglage(dbRef.current)), []);
  const demander = useCallback(async (id, o) => {
    const opts = { ...(o || {}) };
    for (let essai = 0; essai < 2; essai += 1) {
      try { const r = await iaUsage(id, opts, { db: dbRef.current }); if (!r.ok && opts.schema) toast(`Réponse de l’IA inutilisable : ${(r.erreurs || [])[0] || 'format inattendu'}. Rien n’a été prérempli.`, 'bad'); return r.ok ? r : null; }
      catch (e) {
        if (e && e.consentement && IA_APERCU.ouvrir && essai === 0) {
          const choix = await IA_APERCU.ouvrir({ usage: id, texte: `${opts.system ? `${opts.system}\n\n` : ''}${opts.texte || ''}`, images: iaImagesNorm(opts.images) });
          if (choix === 'annuler') return null;
          if (choix === 'toujours') { const c = iaConfigLire(); iaConfigEcrire({ ...c, consentements: { ...(c.consentements || {}), [id]: new Date().toISOString() } }); }
          opts.consenti = true; continue;
        }
        if (!(e && e.arret)) toast((e && e.message) || 'L’assistant IA n’a pas pu répondre.', 'bad'); return null;
      }
    }
    return null;
  }, [toast]);
  return { refus, demander };
}
function IaBouton({ usage, children, onClick, size = 'sm', busy, ...p }) {
  const ia = useIaUsage(); const raison = ia.refus(usage); const u = iaUsageDef(usage);
  if (!u) return null;
  return <Btn size={size} {...p} disabled={!!raison || busy || p.disabled} title={raison || `${u.nom} — ${u.envoie}`} onClick={onClick} data-ia-bouton={usage}>{busy ? '⏳ ' : '🤖 '}{children || u.nom}</Btn>;
}
const IaTrace = ({ ia }) => { const t = iaTraceTexte(ia); return t ? <Chip tone="info" title={t} data-ia-trace="">🤖 IA</Chip> : null; };
// photos et PDF → images JPEG (base64) pour la vision ; pages = nombre maximal de pages lues par PDF ; cote = plus grand côté en pixels
async function iaImagesDepuisFichiers(fichiers, opts) {
  const o = { pages: 4, cote: 1600, qualite: 0.85, ...(opts || {}) }; const out = [];
  const versJpeg = (canvas) => { const k = Math.min(1, o.cote / Math.max(canvas.width, canvas.height)); let c = canvas;
    if (k < 1) { c = document.createElement('canvas'); c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(canvas, 0, 0, c.width, c.height); }
    return { type: 'image/jpeg', data: c.toDataURL('image/jpeg', o.qualite).split(',')[1] || '' }; };
  for (const f0 of Array.from(fichiers || [])) {
    if (out.length >= IA_IMAGES_MAX) break;
    const g = await gardeFichier(f0, 'ia'); if (!g.file) throw { message: `« ${f0.name} » refusé : ${(g.v.raisons || []).join(', ')}.` };
    const f = g.file;
    if (/pdf/i.test(f.type) || /\.pdf$/i.test(f.name)) {
      await pdfAvecDocument(f, async (doc) => { for (let n = 1; n <= Math.min(doc.numPages, o.pages) && out.length < IA_IMAGES_MAX; n += 1) { const pg = await doc.getPage(n); const r = await renduPage(pg, 150); out.push(versJpeg(r.canvas)); } });
    } else out.push(versJpeg(await imageCanvas(f)));
  }
  return out.filter((i) => i.data);
}

/* ---------- Paramètres › Assistant IA : usages et journal ---------- */
function IaUsagesCard() {
  const { db, act, uid, droit } = useApp(); const [c, setC] = useState(iaConfigLire); const actif = iaActive(c); const regle = iaNiveau2Reglage(db);
  const majC = (patch) => { const n = { ...iaConfigLire(), ...patch }; iaConfigEcrire(n); setC(iaConfigLire()); };
  const basculer = (id, v) => majC({ usages: { ...(c.usages || {}), [id]: v } });
  const retirerAccord = (id) => { const k = { ...(c.consentements || {}) }; delete k[id]; majC({ consentements: k }); };
  const admin = !securiteActive(db) || droit('utilisateurs');
  return (
    <section className="card p-4 space-y-3" data-ia-usages="">
      <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">Usages de l’IA</h3><span className="text-sm text-ink2">sur cet appareil</span></div>
      <p className="help">Chaque usage a son interrupteur et son niveau de données. Les usages de niveau 2 envoient des données de votre exploitation : ils sont désactivés par défaut, et un aperçu de ce qui part s’affiche avant le premier envoi. L’IA ne fait que proposer : rien n’est enregistré sans votre relecture, et ce qui l’est garde la mention « 🤖 IA ».</p>
      <Notice tone="info" title="Modèle installé sur l’ordinateur">Pour les usages de niveau 2, préférez un modèle installé sur l’ordinateur ou le réseau de l’exploitation (Ollama, LM Studio…) : choisissez « Autre service compatible OpenAI » et son adresse locale (par exemple http://localhost:11434/v1). Rien ne sort alors de l’exploitation.{iaServiceLocal(actif) ? <b> Le service actuel est local.</b> : null}</Notice>
      {admin ? <Field label="Niveau 2 (données de l’exploitation), pour toute l’équipe"><select className="inp" style={{ maxWidth: 520 }} value={regle} onChange={(e) => act((d) => iaNiveau2Set(d, e.target.value, uid), e.target.value === 'local' ? 'Niveau 2 réservé au modèle local.' : 'Niveau 2 permis avec tout service.')} aria-label="Niveau 2 pour toute l’équipe" data-ia-niveau2="">
        <option value="tous">Permis avec tout service, après accord de chaque personne</option><option value="local">Réservé à un modèle installé sur l’ordinateur ou le réseau</option></select></Field>
        : <p className="text-sm">{regle === 'local' ? 'Votre administrateur réserve le niveau 2 à un modèle installé sur l’ordinateur ou le réseau.' : 'Niveau 2 permis avec tout service, après votre accord.'}</p>}
      <div className="tblwrap"><table className="tbl"><thead><tr><th>Usage</th><th>Niveau</th><th>Ce qui part</th><th>Activé</th></tr></thead>
        <tbody>{IA_USAGES.map((u) => { const on = iaUsageActif(c, u.id); const accord = (c.consentements || {})[u.id]; return (
          <tr key={u.id} data-ia-usage={u.id}><td><b>{u.nom}</b>{u.niveau === 2 && accord ? <div className="text-xs text-ink2">Accord donné le {fmtDate(String(accord).slice(0, 10))} · <button type="button" className="linkish" onClick={() => retirerAccord(u.id)}>Retirer l’accord</button></div> : null}</td>
            <td><span className={cx('chip', u.niveau === 0 ? 'chip-ok' : u.niveau === 1 ? 'chip-info' : 'chip-warn')} title={IA_NIVEAUX[u.niveau].label}>{IA_NIVEAUX[u.niveau].court}</span></td>
            <td className="text-sm text-ink2">{u.envoie}</td>
            <td><Check checked={on} onChange={(v) => basculer(u.id, v)} label={on ? 'Oui' : 'Non'} /></td></tr>); })}</tbody></table></div>
    </section>
  );
}
function IaJournalCard() {
  const [L, setL] = useState(iaJournalLire); const nomU = (id) => (iaUsageDef(id) || { nom: id }).nom;
  return (
    <section className="card p-4 space-y-3" data-ia-journal="">
      <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-semibold">Journal des envois</h3><span className="text-sm text-ink2">{`${L.length} envoi(s) gardé(s) sur cet appareil`}</span>
        <span className="ml-auto"><Btn size="sm" disabled={!L.length} onClick={() => { iaJournalVider(); setL([]); }}>Vider le journal</Btn></span></div>
      <p className="help">Date, usage, niveau, service, modèle et taille de chaque envoi ; jamais son contenu. Ce journal reste sur cet appareil (300 envois au plus).</p>
      <Tbl rows={L.slice(0, 60).map((x, i) => ({ ...x, id: `${x.le}-${i}` }))} empty="Aucun envoi pour l’instant." cols={[
        { h: 'Quand', r: (x) => fmtQuand(x.le) }, { h: 'Usage', r: (x) => nomU(x.usage) },
        { h: 'Niveau', r: (x) => <span className={cx('chip', x.niveau === 0 ? 'chip-ok' : x.niveau === 1 ? 'chip-info' : 'chip-warn')}>{(IA_NIVEAUX[x.niveau] || IA_NIVEAUX[0]).court}</span> },
        { h: 'Service', r: (x) => <span translate="no">{`${x.fournisseur}${x.modele ? ` · ${x.modele}` : ''}${x.local ? ' (local)' : ''}`}</span> },
        { h: 'Taille', cls: 'num', r: (x) => `${Math.max(1, Math.round(x.taille / 1024))} ko${x.images ? ` · ${x.images} image(s)` : ''}` },
        { h: 'Résultat', r: (x) => (x.ok ? <Chip tone="ok">reçu</Chip> : <Chip tone="bad" title={x.erreur}>échec</Chip>) },
      ]} />
    </section>
  );
}
