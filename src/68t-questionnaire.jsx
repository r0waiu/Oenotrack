/* ============ CONFIGURATION GUIDÉE ET VISITE GUIDÉE (0.43.0-alpha.3) ============
   - Questionnaire (moteur 16z-personnalisation.js) : à la toute première ouverture (après la page de présentation) ou depuis Paramètres ;
     mode Basique ou Avancé (durée estimée d'après les questions qui s'appliquent), une question par écran, barre de progression, aperçu des
     changements, application en une fois (base vide ou actuelle), compte administrateur créé si l'équipe se connecte, code de secours.
   - Visite guidée : bulles qui pointent les vrais onglets et boutons de l'écran (Suivant, Précédent, Passer ; Échap), lancée à la fin du
     questionnaire ou par « ❓ Visite guidée » (en-tête, Paramètres). */

function QuestionChamp({ q, v, set, err }) {
  const opts = persoOptions(q);
  if (q.type === 'choix') return <div className="grid gap-2" role="radiogroup" aria-label={q.texte}>{opts.map((o) => <label key={o.id} className={cx('perso-choix', v === o.id && 'perso-choix-on')}><input type="radio" name={q.id} checked={v === o.id} onChange={() => set(o.id)} /> <span>{o.label}</span></label>)}</div>;
  if (q.type === 'multi') { const L = Array.isArray(v) ? v : []; return <div className="grid gap-2" aria-label={q.texte}>{opts.map((o) => <label key={o.id} className={cx('perso-choix', L.includes(o.id) && 'perso-choix-on')}><input type="checkbox" checked={L.includes(o.id)} onChange={(e) => set(e.target.checked ? uniq([...L, o.id]) : L.filter((x) => x !== o.id))} /> <span>{o.label}</span></label>)}</div>; }
  if (q.type === 'oui_non') return <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.texte}>{[[true, 'Oui'], [false, 'Non']].map(([b, l]) => <label key={l} className={cx('perso-choix', v === b && 'perso-choix-on')}><input type="radio" name={q.id} checked={v === b} onChange={() => set(b)} /> <span>{l}</span></label>)}</div>;
  if (q.type === 'liste') return <TA value={v || ''} onChange={set} rows={5} placeholder="ex. Julien Morel" aria-label={q.texte} />;
  if (q.type === 'nombre') return <NI value={v ?? ''} onChange={set} aria-label={q.texte} style={{ maxWidth: 160 }} />;
  if (q.type === 'date') return <DI value={v || ''} onChange={set} aria-label={q.texte} style={{ maxWidth: 200 }} />;
  if (q.type === 'compte') { const c = v || {}; const sc = (k, x) => set({ ...c, [k]: x }); return (<div className="grid max-w-md gap-2" data-perso-compte="">
    <Field label="Identifiant"><TI value={c.identifiant || ''} onChange={(x) => sc('identifiant', x)} placeholder="ex. julien" autoComplete="username" aria-label="Identifiant" /></Field>
    <Field label="Nom affiché"><TI value={c.nom || ''} onChange={(x) => sc('nom', x)} placeholder="ex. Julien Morel" aria-label="Nom affiché" /></Field>
    <Field label="Mot de passe"><MdpInput value={c.mdp || ''} onChange={(x) => sc('mdp', x)} label="Mot de passe" autoComplete="new-password" /><MdpJauge mdp={c.mdp || ''} min={8} /></Field>
    <Field label="Confirmer le mot de passe"><MdpInput value={c.mdp2 || ''} onChange={(x) => sc('mdp2', x)} label="Confirmer le mot de passe" autoComplete="new-password" /></Field>
  </div>); }
  return <TI value={v || ''} onChange={set} aria-label={q.texte} autoFocus />;
}

function Questionnaire({ premiere, onClose, onVisite }) {
  const app = useApp(); const { db, act, uid, toast, connecter } = app; const ctxQ = useMemo(() => ({ premiere: !!premiere }), [premiere]);
  const [mode, setMode] = useState(''); const [rep, setRep] = useState(() => persoDefauts(db, ctxQ)); const [i, setI] = useState(0); const [err, setErr] = useState('');
  const [fin, setFin] = useState(null); const [busy, setBusy] = useState(false);
  const Q = mode ? persoQuestions(mode, rep, ctxQ) : []; const q = Q[i] || null; const apercu = mode && i >= Q.length;
  const plan = useMemo(() => (apercu ? persoPlan(db, mode, rep, ctxQ) : null), [apercu, db, mode, rep, ctxQ]);
  const set = (v) => { setRep((x) => ({ ...x, [q.id]: v })); setErr(''); };
  const suivant = () => { const m = persoValider(q, rep[q.id]); if (m) { setErr(m); return; } setErr(''); setI(i + 1); };
  const appliquer = async () => {
    const v = persoValiderTout(mode, rep, ctxQ); if (!v.ok) { const k = Object.keys(v.erreurs)[0]; setI(Math.max(0, Q.findIndex((x) => x.id === k))); setErr(v.erreurs[k]); return; }
    if (busy) return; setBusy(true);
    try {
      if (plan.baseVide) { const nd = normalizeDb(emptyDb()); syncConfig(nd); const r = persoAppliquer(nd, plan, uid); if (!r.ok) { toast(r.msg, 'bad'); return; } persoMemoriser(nd, mode, rep, uid); if (!app.replaceDb(nd, null, 'Configuration guidée : base vide')) return; }
      else { const r = act((d) => { const x = persoAppliquer(d, plan, uid); if (!x.ok) return x; return persoMemoriser(d, mode, rep, uid); }); if (!r || !r.ok) return; }
      let code = '';
      if (rep.acces === 'equipe' && rep.compte && !securiteActive(db)) {
        const c = rep.compte; const h = await mdpEmpreinte(c.mdp); code = codeSecoursNouveau(); const hs = await mdpEmpreinte(codeSecoursNorm(code));
        const r = act((d) => { const r1 = securiteActiver(d, { identifiant: c.identifiant, nom: c.nom, mdp: h, secours: hs }); if (r1.ok) { if (plan.verrouMin != null) securiteRegler(d, { verrouMin: plan.verrouMin }); auditAjouter(d, [{ uid: r1.id, action: 'securite', resume: 'Identifiants activés (configuration guidée)' }]); } return r1; }, null, { systeme: true });
        if (r && r.ok) { dernierIdentEcrire(String(c.identifiant).trim()); connecter(r.id, false, { rester: true }); } else code = '';
      }
      setFin({ n: plan.changements.length, code });
    } finally { setBusy(false); }
  };
  if (fin) return (<Sheet title="Œnotrack est configuré" onClose={onClose} footer={<><Btn onClick={onClose}>Plus tard</Btn><Btn kind="primary" onClick={() => { onClose(); onVisite(); }} data-perso-visite="">❓ Lancer la visite guidée</Btn></>}>
    <div data-perso-fin=""><p>{`${fmt(fin.n)} réglage(s) appliqué(s). Vous les retrouvez et les modifiez dans Paramètres ; le questionnaire peut être relancé à tout moment.`}</p>
      {fin.code ? <div className="mt-3"><Notice tone="warn" title="Code de secours de l’administrateur">Notez ce code et gardez-le en lieu sûr : il permet de reprendre la main si le mot de passe est perdu. Il ne sera plus affiché.</Notice><CodeSecoursBloc code={fin.code} /></div> : null}
      <p className="mt-3 text-sm text-ink2">La visite guidée montre les principaux onglets et boutons de l’écran (moins d’une minute).</p></div>
  </Sheet>);
  return (<Sheet wide title="🧭 Configurer Œnotrack" sub={mode ? `${PERSO_MODES.find((m) => m.id === mode).label} · environ ${persoDuree(mode, rep, ctxQ)} min` : 'Quelques questions pour régler l’application d’avance, sans aller chercher dans les paramètres.'} onClose={onClose}
    footer={!mode ? <Btn onClick={onClose}>{premiere ? 'Plus tard (garder le jeu d’exemple)' : 'Fermer'}</Btn> : apercu ? <><Btn onClick={() => setI(Q.length - 1)}>← Modifier mes réponses</Btn><Btn kind="primary" onClick={appliquer} disabled={busy} data-perso-appliquer="">✓ Appliquer et commencer</Btn></>
      : <><Btn onClick={() => (i ? setI(i - 1) : setMode(''))}>← Précédent</Btn><Btn kind="primary" onClick={suivant} data-perso-suivant="">Suivant →</Btn></>}>
    <div data-questionnaire={mode || 'mode'}>
      {!mode ? <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
        {PERSO_MODES.map((m) => <button key={m.id} type="button" className="card perso-mode p-4 text-left" onClick={() => { setMode(m.id); setI(0); }} data-perso-mode={m.id}>
          <div className="text-lg font-semibold">{m.label}</div><div className="text-sm text-ink2">{`${persoQuestions(m.id, rep, ctxQ).length} questions · environ ${persoDuree(m.id, rep, ctxQ)} min`}</div>
          <p className="mt-2 text-sm">{m.id === 'basique' ? 'L’essentiel : votre exploitation, vos vins, vos revendications, votre chai et votre équipe.' : 'En plus : identifiants douaniers, cave et dégorgement, plan de vinification, alertes de conformité, opérateurs, campagne, onglet d’ouverture.'}</p></button>)}
      </div> : apercu ? <div data-perso-apercu="">
        <h3 className="mb-2 font-semibold">Voici ce qui sera réglé</h3>
        {PERSO_SECTIONS.concat([['onglets', 'Onglets']]).map(([sid, slib]) => { const L = plan.changements.filter((c) => c.groupe === sid); return L.length ? <div key={sid} className="mb-2"><div className="lbl">{slib}</div><ul className="list-disc pl-5 text-sm">{L.map((c, k) => <li key={k}><span>{c.label}</span> : <span translate="no">{c.apres}</span></li>)}</ul></div> : null; })}
        <p className="help"><span>Rien n’est supprimé : les onglets masqués se réaffichent dans Paramètres › Modules.</span>{plan.baseVide ? <span>{' '}Le jeu d’exemple est remplacé par une base vide.</span> : null}</p>
      </div> : <div data-perso-question={q.id}>
        <div className="perso-progres" aria-hidden="true"><div style={{ width: `${Math.round((i / Q.length) * 100)}%` }} /></div>
        <div className="mb-1 text-xs text-ink2"><span>{(PERSO_SECTIONS.find((s) => s[0] === q.section) || ['', ''])[1]}</span> · <span>{`question ${i + 1} / ${Q.length}`}</span></div>
        <h3 className="mb-1 text-lg font-semibold">{q.texte}</h3>{q.aide ? <p className="help mb-3">{q.aide}</p> : <div className="mb-3" />}
        <form onSubmit={(e) => { e.preventDefault(); suivant(); }}><QuestionChamp q={q} v={rep[q.id]} set={set} err={err} /><button type="submit" hidden /></form>
        {err ? <div className="login-err mt-2" role="alert">{err}</div> : null}
      </div>}
    </div>
  </Sheet>);
}

/* ---------- visite guidée ---------- */
const VISITE_ETAPES = [
  { cible: '[data-brand-presentation]', titre: 'Œnotrack', texte: 'Le logo ramène à la page de présentation de l’application.' },
  { cible: '.hdr-camp', titre: 'La campagne', texte: 'Choisissez la campagne affichée ; une campagne figée n’est plus modifiable.' },
  { cible: '#tab-vinification', titre: 'Vinification', texte: 'Cuverie et lots, opérations et assemblages, opérations à réaliser et plan de vinification.' },
  { cible: '#tab-pressoir', titre: 'Pressoir', texte: 'Registre des pesées, carnet de pressoir et marcs : les lots de cuvée et de tailles sont créés à la validation.' },
  { cible: '#tab-tirage', titre: 'Tirages', texte: 'Levains, liqueurs, chantiers de tirage, fournitures et déclarations à l’AIDAC.' },
  { cible: '#tab-analyses', titre: 'Analyses', texte: 'Résultats saisis ou lus dans les bulletins du laboratoire.' },
  { cible: '#tab-intrants', titre: 'Intrants & Stocks', texte: 'Produits, arrivages, stocks, catalogues, labels et cahiers des charges.' },
  { cible: '#tab-trace', titre: 'Traçabilité', texte: 'De la bouteille à la parcelle : origine, intrants, opérations, conformité.' },
  { cible: '#tab-params', titre: 'Paramètres', texte: 'Tous les réglages ; la configuration guidée peut y être relancée.' },
  { cible: '.hdr-status', titre: 'État de l’appareil', texte: 'Qui saisit, sauvegarde, synchronisation et thème de l’affichage.' },
  { cible: '[data-visite-bouton]', titre: 'Revoir la visite', texte: 'Ce bouton relance la visite guidée quand vous le souhaitez.' },
];
function VisiteGuidee({ onClose }) {
  const [etapes] = useState(() => VISITE_ETAPES.filter((e) => { try { const el = document.querySelector(e.cible); return !!el && el.getClientRects().length > 0; } catch (x) { return false; } }));
  const [i, setI] = useState(0); const [r, setR] = useState(null); const e = etapes[i];
  const mesurer = () => { if (!e) return; const el = document.querySelector(e.cible); if (!el) { setR(null); return; } try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (x) { /* ignoré */ } const b = el.getBoundingClientRect(); setR({ x: b.left, y: b.top, w: b.width, h: b.height }); };
  useEffect(() => { mesurer(); const f = () => mesurer(); window.addEventListener('resize', f); window.addEventListener('scroll', f, true); return () => { window.removeEventListener('resize', f); window.removeEventListener('scroll', f, true); }; }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const k = (ev) => { if (ev.key === 'Escape') onClose(); else if (ev.key === 'ArrowRight' && i < etapes.length - 1) setI(i + 1); else if (ev.key === 'ArrowLeft' && i > 0) setI(i - 1); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [i, etapes.length, onClose]);
  if (!etapes.length) { setTimeout(onClose, 0); return null; }
  const W = Math.min(340, (typeof window !== 'undefined' ? window.innerWidth : 800) - 24); const vh = typeof window !== 'undefined' ? window.innerHeight : 800; const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
  const dessous = !r || r.y + r.h + 180 < vh; const top = r ? (dessous ? r.y + r.h + 12 : Math.max(12, r.y - 172)) : vh / 2 - 80; const left = r ? Math.max(12, Math.min(vw - W - 12, r.x + r.w / 2 - W / 2)) : vw / 2 - W / 2;
  return ReactDOM.createPortal(<div className="visite" data-visite={i + 1} role="dialog" aria-modal="true" aria-label="Visite guidée">
    {r ? <div className="visite-cible" style={{ left: r.x - 6, top: r.y - 6, width: r.w + 12, height: r.h + 12 }} /> : <div className="visite-voile" />}
    <div className="visite-bulle card" style={{ top, left, width: W }}>
      <div className="text-xs text-ink2">{`Étape ${i + 1} / ${etapes.length}`}</div>
      <div className="font-semibold">{e.titre}</div><p className="text-sm">{e.texte}</p>
      <div className="mt-2 flex flex-wrap gap-2"><Btn size="sm" kind="ghost" onClick={onClose} data-visite-passer="">Passer</Btn><span className="ml-auto" />{i ? <Btn size="sm" onClick={() => setI(i - 1)}>← Précédent</Btn> : null}{i < etapes.length - 1 ? <Btn size="sm" kind="primary" onClick={() => setI(i + 1)} data-visite-suivant="">Suivant →</Btn> : <Btn size="sm" kind="primary" onClick={onClose} data-visite-terminer="">Terminer</Btn>}</div>
    </div>
  </div>, document.body);
}
// Paramètres : relancer la configuration guidée ou la visite
function ConfigurationGuideeCard() {
  const { db, openQuestionnaire, openVisite } = useApp(); const lect = useLectureSeule('params'); const p = (db.settings || {}).personnalisation;
  return (<div className="card mb-4 p-4" data-config-guidee="">
    <div className="mb-1 font-semibold">🧭 Configuration guidée</div>
    <p className="text-sm text-ink2">{p ? `Dernière configuration : ${fmtDate(String(p.le).slice(0, 10))} (mode ${(PERSO_MODES.find((m) => m.id === p.mode) || { label: p.mode }).label}). Vos réponses sont reprises si vous la relancez.` : 'Quelques questions pour régler l’application d’avance (basique ou avancé).'}</p>
    <div className="mt-2 flex flex-wrap gap-2">{lect ? null : <Btn onClick={() => openQuestionnaire({ premiere: false })} data-config-relancer="">Relancer le questionnaire</Btn>}<Btn onClick={openVisite}>❓ Visite guidée</Btn></div>
  </div>);
}
