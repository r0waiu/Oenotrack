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

/* ---------- visite guidée par chapitres (0.45.0-alpha.1 ; chapitres : VISITE_CHAPITRES, 16z) ----------
   Sommaire des chapitres (modules affichés et autorisés), « L’essentiel » ou « Tout voir » ; chaque étape ouvre l'onglet et le sous-onglet
   voulus, puis met la cible en avant (bulle et halo) ; une cible absente est sautée. Suivant / Précédent / flèches, Échap pour fermer.
   0.48.0-alpha.1 : sommaire toujours dans l'écran (centré d'après sa hauteur réelle, en haut sous 600 px, boutons dans un pied collant),
   fermé au toucher du voile ; bulle placée sous, au-dessus ou à côté de la cible, jamais dessus quand il y a la place (au téléphone :
   feuille basse) ; cible « A || B » (repli) ; nombre d'étapes et durée annoncés ; parcours « L’essentiel » (VISITE_ESSENTIEL, 16z). */
const visiteAttendre = (ms) => new Promise((r) => setTimeout(r, ms));
const visiteOnglets = () => [...document.querySelectorAll('main [role=tablist]')].find((x) => !x.closest('[data-onglet-groupe]') && x.getClientRects().length > 0) || null;
const visiteCible1 = (sel) => { try { const el = sel === '@onglets' ? visiteOnglets() : document.querySelector(sel); return el && el.getClientRects().length > 0 ? el : null; } catch (x) { return null; } };
const visiteCible = (sel) => { for (const s of String(sel || '').split('||')) { const el = visiteCible1(s.trim()); if (el) return el; } return null; };
const VISITE_MARGE = 12;
// position de la bulle (largeur W, hauteur h) autour du rectangle r de la cible, dans un écran vw × vh
function visitePlacer(r, W, h, vw, vh) {
  const m = VISITE_MARGE; const tel = vw < 640;
  if (!r) return { top: Math.max(m, (vh - h) / 2), left: Math.max(m, (vw - W) / 2), cote: 'centre' };
  const cx0 = Math.max(m, Math.min(vw - W - m, r.x + r.w / 2 - W / 2));
  const haut = Math.max(m, Math.min(vh - h - m, Math.max(r.y, m)));
  if (vh - (r.y + r.h) >= h + 2 * m) return { top: r.y + r.h + m, left: cx0, cote: 'dessous' };
  if (r.y >= h + 2 * m) return { top: r.y - h - m, left: cx0, cote: 'dessus' };
  if (!tel && vw - (r.x + r.w) >= W + 2 * m) return { top: haut, left: r.x + r.w + m, cote: 'droite' };
  if (!tel && r.x >= W + 2 * m) return { top: haut, left: r.x - W - m, cote: 'gauche' };
  if (tel) return { feuille: true, cote: 'feuille' };
  return { top: vh - h - m, left: vw - W - m, cote: 'coin' };
}
function VisiteGuidee({ onClose }) {
  const { db, nav, setTab, niveau } = useApp();
  const voir = (m) => niveau(m) !== 'aucun';
  const chapitres = useMemo(() => visiteChapitres(db, voir), [db]); // eslint-disable-line react-hooks/exhaustive-deps
  const essentiel = useMemo(() => visiteEssentiel(db, voir), [db]); // eslint-disable-line react-hooks/exhaustive-deps
  const [file, setFile] = useState(null); const [pos, setPos] = useState({ c: 0, e: 0, dir: 1 }); const [r, setR] = useState(null); const [pret, setPret] = useState(false); const [fin, setFin] = useState(false);
  const [hB, setHB] = useState(0); const bulleRef = useRef(null);
  const navRef = useRef(nav); navRef.current = nav; const elRef = useRef(null);
  const ch = file ? file[pos.c] : null; const et = ch ? ch.etapes[pos.e] : null;
  const total = file ? sum(file, (c) => c.etapes.length) : 0; const rangE = file ? sum(file.slice(0, pos.c), (c) => c.etapes.length) + pos.e + 1 : 0;
  const nTout = sum(chapitres, (c) => c.etapes.length);
  const deplacer = (dir) => setPos((p) => { const F = file || []; let c = p.c; let e = p.e + dir;
    if (e >= ((F[c] || {}).etapes || []).length) { c += 1; e = 0; } else if (e < 0) { c -= 1; e = c >= 0 ? F[c].etapes.length - 1 : 0; }
    if (c >= F.length) { setFin(true); return p; } if (c < 0) return { c: 0, e: 0, dir: 1 }; return { c, e, dir }; });
  const mesurer = () => { const el = elRef.current; if (!el || !document.body.contains(el)) { setR(null); return; } const b = el.getBoundingClientRect(); setR((x) => (x && x.x === b.left && x.y === b.top && x.w === b.width && x.h === b.height ? x : { x: b.left, y: b.top, w: b.width, h: b.height })); };
  useEffect(() => { if (!file || fin || !et) return undefined; let annule = false; setPret(false);
    (async () => {
      const sub = et.sub || null;
      if (ch.module && (navRef.current.tab !== ch.module || (sub && navRef.current.sub !== sub))) { setTab(ch.module, sub || undefined); await visiteAttendre(380); }
      if (et.clic != null) { const T = visiteOnglets(); const b = T ? T.querySelectorAll('[role=tab]')[et.clic] : null; if (b && b.getAttribute('aria-selected') !== 'true') { b.click(); await visiteAttendre(320); } }
      if (annule) return; let el = visiteCible(et.cible); if (!el) { await visiteAttendre(250); el = visiteCible(et.cible); }
      if (annule) return; if (!el) { deplacer(pos.dir || 1); return; }
      elRef.current = el; const haute = el.getBoundingClientRect().height > window.innerHeight * 0.55; // cible haute : son début en haut de l'écran
      try { el.scrollIntoView({ block: haute ? 'start' : 'center', inline: 'nearest' }); } catch (x) { /* ignoré */ } await visiteAttendre(60); if (!annule) { mesurer(); setPret(true); }
    })();
    return () => { annule = true; };
  }, [file, pos, fin]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const f = () => mesurer(); window.addEventListener('resize', f); window.addEventListener('scroll', f, true); return () => { window.removeEventListener('resize', f); window.removeEventListener('scroll', f, true); }; }, []);
  useEffect(() => { if (!pret) return undefined; const h = setInterval(mesurer, 350); return () => clearInterval(h); }, [pret]); /* la page peut encore bouger après la mesure (images, polices) */
  React.useLayoutEffect(() => { const b = bulleRef.current; const h = b ? Math.ceil(b.offsetHeight) : 0; if (h && Math.abs(h - hB) > 1) setHB(h); }); // hauteur réelle de la bulle
  useEffect(() => { const k = (ev) => { if (ev.key === 'Escape') onClose(); else if (file && !fin && pret && ev.key === 'ArrowRight') deplacer(1); else if (file && !fin && pret && ev.key === 'ArrowLeft') deplacer(-1); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }); // eslint-disable-line react-hooks/exhaustive-deps
  const lancer = (L) => { setFin(false); setR(null); elRef.current = null; setPos({ c: 0, e: 0, dir: 1 }); setFile(L); };
  const sommaire = () => { setFile(null); setFin(false); setR(null); };
  const vw = typeof window !== 'undefined' ? window.innerWidth : 800; const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  if (!file || fin) {
    const W = Math.min(460, vw - 2 * VISITE_MARGE); const h = hB || Math.min(560, vh - 2 * VISITE_MARGE);
    const top = vh < 600 || vw < 600 ? VISITE_MARGE : Math.max(VISITE_MARGE, (vh - h) / 2);
    const nE = sum(essentiel, (c) => c.etapes.length);
    return ReactDOM.createPortal(<div className="visite" role="dialog" aria-modal="true" aria-label="Visite guidée" data-visite-sommaire="">
      <div className="visite-voile" onClick={onClose} data-visite-voile="" />
      <div ref={bulleRef} className="visite-bulle visite-sommaire card" style={{ top, left: Math.max(VISITE_MARGE, (vw - W) / 2), width: W, maxHeight: vh - 2 * VISITE_MARGE }}>
        <div className="visite-corps">
          <div className="font-semibold">{fin ? 'Fin de la visite' : '❓ Visite guidée'}</div>
          <p className="text-sm text-ink2">{fin ? 'Choisissez un autre chapitre, ou fermez la visite.' : 'Choisissez un chapitre (un module), ou faites tout le tour. Seuls les modules affichés sont présentés.'}</p>
          {essentiel.length ? <button type="button" className="btn btn-sm mt-2 justify-between" style={{ width: '100%' }} onClick={() => lancer(essentiel)} data-visite-essentiel=""><span>★ L’essentiel</span><span className="text-xs text-ink2">{`${nE} étapes · ~${visiteDuree(nE)} min`}</span></button> : null}
          <div className="my-2 grid gap-1" data-visite-chapitres="">{chapitres.map((c) => <button key={c.id} type="button" className="btn btn-sm justify-between" style={{ width: '100%' }} onClick={() => lancer([c])} data-visite-chapitre={c.id}><span>{c.titre}</span><span className="text-xs text-ink2">{`${c.etapes.length} étape(s)`}</span></button>)}</div>
        </div>
        <div className="visite-pied flex flex-wrap items-center gap-2"><Btn size="sm" kind="ghost" onClick={onClose} data-visite-passer="">Fermer</Btn><span className="ml-auto" /><Btn size="sm" kind="primary" onClick={() => lancer(chapitres)} data-visite-tout="">{`Tout voir · ${nTout} étapes · ~${visiteDuree(nTout)} min →`}</Btn></div>
      </div>
    </div>, document.body);
  }
  const W = Math.min(340, vw - 2 * VISITE_MARGE); const P = visitePlacer(r, W, hB || 200, vw, vh);
  const halo = r ? (() => { const y0 = Math.max(r.y - 6, 4); const y1 = Math.min(r.y + r.h + 6, vh - 4); return { left: r.x - 6, top: y0, width: r.w + 12, height: Math.max(0, y1 - y0) }; })() : null; // halo limité à l'écran
  const dernier = pos.c === file.length - 1 && pos.e === ch.etapes.length - 1;
  return ReactDOM.createPortal(<div className="visite" data-visite={rangE} data-visite-chap={ch.id} role="dialog" aria-modal="true" aria-label="Visite guidée">
    {pret && halo ? <div className="visite-cible" style={halo} /> : <div className="visite-voile" />}
    {pret ? <div ref={bulleRef} className={cx('visite-bulle card', P.feuille && 'visite-feuille')} style={P.feuille ? undefined : { top: P.top, left: P.left, width: W }} data-visite-cote={P.cote}>
      <div className="text-xs text-ink2"><span translate="no">{ch.titre}</span>{` · étape ${rangE} / ${total}`}</div>
      <div className="font-semibold">{et.titre}</div><p className="text-sm">{et.texte}</p>
      <div className="mt-2 flex flex-wrap gap-2"><Btn size="sm" kind="ghost" onClick={onClose} data-visite-passer="">Passer</Btn><Btn size="sm" kind="ghost" onClick={sommaire} data-visite-retour="">Sommaire</Btn><span className="ml-auto" />{rangE > 1 ? <Btn size="sm" onClick={() => deplacer(-1)}>← Précédent</Btn> : null}<Btn size="sm" kind="primary" onClick={() => deplacer(1)} data-visite-suivant="">{dernier ? 'Terminer' : 'Suivant →'}</Btn></div>
    </div> : null}
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
