/* ============ ONGLET 2 : OPÉRATIONS & ASSEMBLAGES · ONGLET DÉCLASSEMENTS ============
   0.48.0-alpha.1 : « ＋ Nouvelle opération » (sélecteur : recherche, favoris, dernières), journal (50 lignes puis « Afficher plus »),
   actions de ligne dans « ⋯ », filtre « à vérifier », états vides, aide repliable, sous-onglet « Journal »
   0.49.0-alpha.1 : « Décrire l'opération… » (IA01, saisie en langage courant, dictée), pastille « 🤖 IA » des opérations proposées par l'IA (S4) */
function OpWarns({ r, open, setOpen }) {
  const { act } = useApp(); const op = r.op;
  if (!r.warns.length) return <span className="text-xs text-ink2">—</span>;
  return (
    <div>
      <button type="button" className="rounded-full" onClick={(e) => { e.stopPropagation(); setOpen(!open); }} aria-expanded={open} title="Afficher le détail des avertissements"><WarnChip n={r.warns.length} verified={op.verifie} /></button>
      {open ? <div className="mt-1 space-y-1"><ul className="list-disc pl-4 text-xs text-warn">{r.warns.map((w, i) => <li key={i}>{w}</li>)}</ul>{!r.locked ? <Btn size="sm" onClick={() => act((d) => opToggleVerified(d, op.id), op.verifie ? 'Marqueur « à vérifier » rétabli.' : 'Opération marquée comme vérifiée.')}>{op.verifie ? 'Remettre « à vérifier »' : '✓ Marquer comme vérifiée'}</Btn> : null}</div> : null}
    </div>
  );
}

/* 0.48.0-alpha.1 — sélecteur « ＋ Nouvelle opération » : recherche, favoris et dernières opérations choisies (souvenir de cet appareil,
   localStorage oenotrack-ops-choix = { favoris: [id], recentes: [id] }, jamais dans la base) ; les familles restent dans le sélecteur. */
const OPS_CHOIX_KEY = 'oenotrack-ops-choix'; const OPS_RECENTES_MAX = 6;
const opsChoixLire = () => { try { const o = JSON.parse(window.localStorage.getItem(OPS_CHOIX_KEY) || '{}'); return { favoris: Array.isArray(o && o.favoris) ? o.favoris.filter((x) => typeof x === 'string') : [], recentes: Array.isArray(o && o.recentes) ? o.recentes.filter((x) => typeof x === 'string') : [] }; } catch (e) { return { favoris: [], recentes: [] }; } };
const opsChoixEcrire = (o) => { try { window.localStorage.setItem(OPS_CHOIX_KEY, JSON.stringify(o)); } catch (e) { /* stockage indisponible : souvenir de la session seulement */ } };
const JOURNAL_PAGE = 50;

// bouton d'une opération du sélecteur, avec son étoile de favori ; raccourci (favori, dernière) : « ★ Libellé » / « ↺ Libellé » d'un seul texte
function OpChoixBtn({ t, prefixe, fav, onChoisir, onFav, disabled }) {
  const { db } = useApp(); const x = opDef(db, t); if (!x) return null;
  return (
    <span className="op-choix">
      <Btn disabled={disabled} title={x.aide || OP_HELP[x.base] || ''} onClick={() => onChoisir(t)} data-op-choix={t} data-op-raccourci={prefixe ? '' : undefined}>{prefixe ? `${prefixe} ${x.label}` : <><span aria-hidden="true" className="mr-1 opacity-70">{opIcone(db, t)}</span>{x.label}</>}</Btn>
      {onFav ? <button type="button" className="op-fav" aria-pressed={fav} aria-label={fav ? `Retirer ${x.label} des favoris` : `Ajouter ${x.label} aux favoris`} title={fav ? 'Retirer des favoris' : 'Épingler en favori'} onClick={() => onFav(t)}>{fav ? '★' : '☆'}</button> : null}
    </span>
  );
}

/* 0.49.0-alpha.1 (IA01, usage « saisie », niveau 2) — « Décrire l'opération… » : phrase tapée ou dictée (reconnaissance vocale du navigateur),
   l'IA choisit l'opération, les contenants et les produits dans les listes envoyées (codes courts, 17ab-ia-chai) ; le formulaire s'ouvre
   prérempli (encadré « Prérempli par l'IA », trace « ia » gardée à la validation) ; opération inconnue ou ambiguë : liste de choix. */
const IA_PREREMPLI = {}; // trace.le → { phrase, notes } (souvenir de la session, jamais dans la base) : encadré du formulaire prérempli
const iaReconnaissanceVocale = () => (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;
function useDictee(onTexte) {
  const [ecoute, setEcoute] = useState(false); const ref = useRef(null); const R0 = iaReconnaissanceVocale();
  useEffect(() => () => { try { if (ref.current) ref.current.abort(); } catch (e) { /* déjà arrêtée */ } }, []);
  const basculer = () => {
    if (!R0) return; if (ecoute && ref.current) { try { ref.current.stop(); } catch (e) { /* déjà arrêtée */ } return; }
    let r; try { r = new R0(); } catch (e) { return; }
    r.lang = (LANGUES.find((l) => l.id === LANGUE) || LANGUES[0]).locale; r.interimResults = false; r.continuous = false; r.maxAlternatives = 1;
    r.onresult = (e) => { const t = Array.from(e.results || []).map((x) => (x[0] ? x[0].transcript : '')).join(' ').trim(); if (t) onTexte(t); };
    r.onend = () => setEcoute(false); r.onerror = () => setEcoute(false);
    ref.current = r; setEcoute(true); try { r.start(); } catch (e) { setEcoute(false); }
  };
  return { dispo: !!R0, ecoute, basculer };
}
// encadré du formulaire prérempli par l'IA (52-opform, nouvelle opération ou opération à réaliser ouverte avec la trace « ia »)
function IaPrerempliNotice({ ia }) {
  const x = (ia && IA_PREREMPLI[ia.le]) || {};
  return (
    <div className="ia-prerempli mb-3" data-ia-prerempli="">
      <Notice tone="warn" title="Prérempli par l’IA : relisez avant de valider">
        {x.phrase ? <div><span>D’après : </span><q translate="no">{x.phrase}</q></div> : null}
        {x.source === 'fiche' ? <div>Valeurs lues sur la photo de la fiche remplie.</div> : null}
        {(x.notes || []).length ? <ul className="mt-1 list-disc pl-4">{x.notes.map((n, i) => <li key={i}>{n}</li>)}</ul> : null}
        <div className="mt-1 text-xs">Vérifiez l’opération, les contenants, les produits et les quantités : rien n’est enregistré avant « ✓ Valider », et l’opération gardera la mention « 🤖 IA ».</div>
      </Notice>
    </div>
  );
}
// champ « Décrire l'opération… » : opIds = opérations proposées par le sélecteur ; onOuvrir(type, preset) ouvre le formulaire prérempli
function IaSaisieChamp({ opIds, onOuvrir, disabled, contId }) {
  const { db, defaultDate } = useApp(); const ia = useIaUsage();
  const [phrase, setPhrase] = useState(''); const [busy, setBusy] = useState(false); const [res, setRes] = useState(null);
  const dictee = useDictee((t) => setPhrase((p) => (p ? `${p} ${t}` : t)));
  const raison = ia.refus('saisie');
  const ouvrir = (r, type) => {
    const R1 = getR(db, iaChaiIso(r.lu.lu.date) || defaultDate);
    const x = iaSaisiePreset(db, R1, r.codes, r.lu.lu, type, r.trace);
    const notes = [...x.notes, ...(r.lu.question ? [r.lu.question] : [])];
    if (x.preset.ia) IA_PREREMPLI[x.preset.ia.le] = { phrase: r.phrase, notes };
    setRes(null); setPhrase(''); onOuvrir(type, x.preset);
  };
  const lancer = async () => {
    const t = phrase.trim(); if (!t || busy) return;
    const P = iaSaisiePrompt(db, getR(db, defaultDate), contId ? `${t} (contenant : ${(db.contenants.find((c) => c.id === contId) || {}).nom || ''})` : t, { opIds, date: defaultDate });
    setBusy(true); const r = await ia.demander('saisie', { system: P.system, texte: P.texte, schema: P.schema, nom: P.nom }); setBusy(false);
    if (!r) return;
    const lu = iaSaisieLire(P.codes, r.valeur); const rr = { lu, codes: P.codes, trace: r.trace, phrase: t };
    if (lu.type) ouvrir(rr, lu.type); else setRes(rr);
  };
  return (
    <div className="ia-saisie" data-ia-saisie="">
      <div className="flex flex-wrap items-center gap-2">
        <input className="inp min-w-0 flex-1" style={{ minWidth: 200 }} value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="Décrire l’opération…" aria-label="Décrire l’opération en langage courant" disabled={disabled || !!raison} title={raison || 'ex. « sulfitage de la cuve 08 à 3 g/hL », « soutirage de la cuve 05 vers la cuve 06, 20 hL »'} data-ia-saisie-phrase=""
          onKeyDown={(e) => { if (e.key === 'Enter' && phrase.trim()) { e.preventDefault(); e.stopPropagation(); lancer(); } }} />
        {dictee.dispo ? <Btn kind={dictee.ecoute ? 'primary' : undefined} onClick={dictee.basculer} disabled={disabled || !!raison} aria-pressed={dictee.ecoute} aria-label={dictee.ecoute ? 'Arrêter la dictée' : 'Dicter l’opération'} title="Dictée par la reconnaissance vocale du navigateur (selon le navigateur, le son peut être traité par son éditeur)" data-ia-dictee="">{dictee.ecoute ? '⏹' : '🎤'}</Btn> : null}
        <IaBouton usage="saisie" busy={busy} disabled={disabled || !phrase.trim()} onClick={lancer} data-ia-saisie-ok="">Préremplir</IaBouton>
      </div>
      {res ? <div className="mt-2" data-ia-saisie-choix="">
        <Notice tone="info" title={res.lu.choix.length ? 'Plusieurs opérations possibles : choisissez' : 'Opération non reconnue'}>
          {res.lu.question ? <div translate="no">{res.lu.question}</div> : null}
          {res.lu.choix.length ? <div className="mt-2 flex flex-wrap gap-2">{res.lu.choix.map((t) => <Btn key={t} size="sm" onClick={() => ouvrir(res, t)} data-ia-choix-op={t}>{(opDef(db, t) || {}).label || t}</Btn>)}</div>
            : <div>Choisissez l’opération dans la liste ci-dessous, ou précisez la phrase.</div>}
        </Notice>
      </div> : null}
    </div>
  );
}

function NouvelleOpChoix({ groupes, versBouteilles, onChoisir, onChoisirPreset, onFermer, figee }) {
  const { db, uid, setTab } = useApp();
  const [q, setQ] = useState(''); const [choix, setChoixS] = useState(opsChoixLire); const champ = useRef(null);
  const tous = useMemo(() => groupes.flatMap((g) => g.items), [groupes]);
  const setChoix = (f) => setChoixS((c) => { const n = f(c); opsChoixEcrire(n); return n; });
  const fav = (t) => setChoix((c) => ({ ...c, favoris: c.favoris.includes(t) ? c.favoris.filter((x) => x !== t) : [...c.favoris, t] }));
  const choisir = (t) => { setChoix((c) => ({ ...c, recentes: [t, ...c.recentes.filter((x) => x !== t)].slice(0, OPS_RECENTES_MAX) })); onChoisir(t); };
  useEffect(() => { if (champ.current) { try { champ.current.focus({ preventScroll: true }); } catch (e) { champ.current.focus(); } } }, []);
  const favoris = choix.favoris.filter((t) => tous.includes(t)); const recentes = choix.recentes.filter((t) => tous.includes(t));
  const nq = norm(q.trim());
  const trouves = nq ? tous.filter((t) => { const x = opDef(db, t) || {}; return norm(`${x.label} ${x.aide || ''} ${OP_LABELS[x.base] || ''} ${x.groupe || ''}`).includes(nq); }) : [];
  const btn = (t, prefixe) => <OpChoixBtn key={`${prefixe || ''}${t}`} t={t} prefixe={prefixe} fav={choix.favoris.includes(t)} onChoisir={choisir} onFav={prefixe ? null : fav} disabled={figee} />;
  return (
    <div className="nouvelle-op card p-3" data-nouvelle-op-panneau="" role="region" aria-label="Choisir une opération" onKeyDown={(e) => { if (e.key === 'Escape' && !document.querySelector('.overlay')) { e.stopPropagation(); onFermer(); } }}>
      {onChoisirPreset ? <div className="mb-3"><IaSaisieChamp opIds={tous} disabled={figee} onOuvrir={(t, preset) => { setChoix((c) => ({ ...c, recentes: [t, ...c.recentes.filter((x) => x !== t)].slice(0, OPS_RECENTES_MAX) })); onChoisirPreset(t, preset); }} /></div> : null}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input ref={champ} className="inp min-w-0 flex-1" style={{ minWidth: 180 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une opération…" aria-label="Rechercher une opération" data-nouvelle-op-recherche=""
          onKeyDown={(e) => { if (e.key === 'Enter' && trouves.length && !figee) { e.preventDefault(); choisir(trouves[0]); } }} />
        <Btn kind="ghost" onClick={onFermer} aria-label="Fermer le choix des opérations">✕ Fermer</Btn>
      </div>
      {nq ? (trouves.length ? <div className="flex flex-wrap gap-2" data-nouvelle-op-trouves="">{trouves.map((t) => btn(t))}</div> : <Empty>Aucune opération ne correspond à « {q.trim()} ».</Empty>) : (<>
        {favoris.length || recentes.length ? <div className="mb-3 grid gap-3 sm:grid-cols-2">
          {favoris.length ? <div data-ops-favoris=""><div className="lbl">★ Favoris</div><div className="flex flex-wrap gap-2">{favoris.map((t) => btn(t, '★'))}</div></div> : null}
          {recentes.length ? <div data-ops-recentes=""><div className="lbl">Dernières utilisées</div><div className="flex flex-wrap gap-2">{recentes.map((t) => btn(t, '↺'))}</div></div> : null}
        </div> : <p className="help mb-2">☆ à côté d’une opération : l’épingler en favori (sur cet appareil).</p>}
        <div className="ops-familles grid gap-3">
          {groupes.map((g) => (<div key={g.title} className="card p-3" data-groupe={g.title}><div className="lbl">{g.title}</div>{g.title === OP_GROUPES[0] && moduleActif(db, 'pressoir') && moduleAutorise(db, uid, 'pressoir') ? <div className="mb-2 text-sm" data-vers-pressoir=""><span className="text-ink2">Pesées et pressurages : </span><button type="button" className="linkish" onClick={() => setTab('pressoir')}>onglet Pressoir</button></div>
            : g.title === OP_GROUPES[0] ? <div className="mb-2 text-sm" data-vers-pressoir=""><span className="text-ink2">{`Pesées de vendange : onglet Pressoir${moduleActif(db, 'pressoir') ? '' : ' (masqué)'}`}</span>{!moduleActif(db, 'pressoir') && moduleAutorise(db, uid, 'params') ? <> — <button type="button" className="linkish" onClick={() => setTab('params', 'modules')}>l’afficher</button></> : null}</div> : null}<div className="flex flex-wrap gap-2">{g.items.map((t) => btn(t))}</div></div>))}
          {versBouteilles.length ? <div className="card p-3" data-groupe={OP_GROUPES[4]} data-vers-bouteilles=""><div className="lbl">{OP_GROUPES[4]}</div><div className="text-sm text-ink2">Saisis dans leur onglet, avec le suivi des bouteilles :</div><ul className="mt-1 space-y-0.5 text-sm">{versBouteilles.map(([m, l]) => <li key={m}>{l} : <button type="button" className="linkish" onClick={() => setTab(m)} data-vers-module={m}>{`onglet ${moduleNom(m)}`}</button></li>)}</ul></div> : null}
        </div>
      </>)}
    </div>
  );
}

// actions d'une ligne du journal : « Modifier » visible, le reste dans « ⋯ » ; pièces jointes, traçabilité aval et amont signalées quand elles existent
function OpActions({ r, onEdit, onDel }) {
  const { db, openDocs, openTrace, openFiche } = useApp(); const op = r.op;
  const titre = `${opNom(op)} du ${fmtDate(op.date)}`; const nDocs = docsOf(db, 'op', op.id).filter((d) => !d.archive).length;
  const fiche = op.type !== 'declassement'; const suppr = !r.locked;
  return (
    <div className="op-acts flex flex-wrap items-center gap-1" data-op-actions={op.id}>
      {traceOpOk(op) ? <Btn size="sm" kind="ghost" onClick={() => openTrace({ k: 'export', opId: op.id })} title="Fichier de traçabilité pour le destinataire" aria-label="Fichier de traçabilité pour le destinataire" data-trace-export-btn={op.id}>📤{(op.traceExports || []).length ? ' ✓' : ''}</Btn> : null}
      {(op.amont || []).length ? <Btn size="sm" kind="ghost" onClick={() => openTrace({ k: 'amont', opId: op.id })} title="Traçabilité amont (fichier de l’expéditeur)" aria-label="Traçabilité amont" data-trace-amont-btn={op.id}>📥</Btn> : null}
      {nDocs ? <DocsButton cible={{ type: 'op', id: op.id }} kind="op" title={titre} /> : null}
      {r.locked ? <Chip title="Campagne figée">🔒 figée</Chip> : op.type !== 'declassement' ? <Btn size="sm" onClick={onEdit}>Modifier</Btn> : null}
      {!nDocs || fiche || suppr ? <MenuDeroulant label="⋯" title="Autres actions" menuLabel={`Actions — ${titre}`} aria-label={`Autres actions — ${titre}`} data-op-menu={op.id}>{(fermer) => (<>
        {!nDocs ? <MenuItem ic="📎" onClick={() => { fermer(); openDocs({ type: 'op', id: op.id }, 'op', titre); }} aria-label={`Documents — ${titre}`}>Joindre des documents</MenuItem> : null}
        {fiche ? <MenuItem ic="🖨" onClick={() => { fermer(); openFiche([{ kind: 'op', id: op.id }]); }} aria-label="Fiche d’enregistrement" title="Fiche d’enregistrement à imprimer">Fiche d’enregistrement</MenuItem> : null}
        {suppr ? <MenuItem ic="🗑" tone="bad" onClick={() => { fermer(); onDel(); }} aria-label="Supprimer l’opération">Supprimer…</MenuItem> : null}
      </>)}</MenuDeroulant> : null}
    </div>
  );
}

function TabOps() {
  const { db, R, camp, act, confirm, setTab, uid, secu } = useApp();
  // déclassements (0.27.0-alpha.2) : sous-onglet de « Opérations & Assemblages » (module activable, droits gardés)
  const voirDeclass = moduleActif(db, 'declass') && moduleAutorise(db, uid, 'declass'); const nDeclass = db.alertes.filter((a) => a.statut === 'attente').length;
  // 0.39.0-alpha.1 : catalogue des opérations (avant : Paramètres › Opérations), avec les droits des paramètres
  const voirCatalogue = !secu || niveauModule(db, uid, 'params') !== 'aucun';
  // 0.48.0-alpha.1 : le sous-onglet du journal s'appelle « Journal » (identifiant « journal » inchangé)
  const sousItems = [{ id: 'journal', label: 'Journal' }, ...(voirDeclass ? [{ id: 'declass', label: 'Déclassements', badge: nDeclass || null }] : []), ...(voirCatalogue ? [{ id: 'catalogue', label: '⚙ Catalogue des opérations' }] : [])];
  // préparations, mixtions, remuage et dégorgement : saisis dans leur onglet (Tirages, Cave, Dégorgement) quand il est affiché
  const ailleurs = (x) => { const m = opModuleSaisie(db, x); return m !== 'ops' && moduleActif(db, m) && moduleAutorise(db, uid, m); };
  const [sousOnglet, setSousOnglet] = useSousOnglet(sousItems, 'journal');
  const [form, setForm] = useState(null); const [scope, setScope] = useState('camp'); const [typeF, setTypeF] = useState(''); const [oprF, setOprF] = useState(''); const [q, setQ] = useState(''); const [openW, setOpenW] = useState({});
  const [verifF, setVerifF] = useState(false); const [nMax, setNMax] = useState(JOURNAL_PAGE); const [choixOuvert, setChoixOuvert] = useState(false); const btnNouv = useRef(null);
  useEffect(() => { setNMax(JOURNAL_PAGE); }, [scope, typeF, oprF, q, verifF]);
  const quiOK = (o) => !oprF || (oprF === '-' ? !operateursValides(db, o.operateurs).length : Array.isArray(o.operateurs) && o.operateurs.includes(oprF));
  const inCamp = (o) => o.date >= camp.debut && o.date <= camp.fin;
  const kOf = (o) => (o.sousType && opDef(db, o.sousType) ? o.sousType : o.type);
  // 0.38.0-alpha.3 : liste recalculée quand la base ou un filtre change (plus à chaque rendu : toasts, synchronisation, menus)
  const rows = useMemo(() => [...db.ops].filter((o) => (scope === 'all' || inCamp(o)) && quiOK(o) && (!typeF || kOf(o) === typeF || (typeF.startsWith('g:') && (opDef(db, kOf(o)) || {}).groupe === typeF.slice(2))) && (!verifF || ((R.warn[o.id] || []).length && !o.verifie)))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.seq || 0) - (a.seq || 0)))
    .map((op) => ({ id: op.id, op, lots: opLots(op, R), conts: opConts(op, R), text: opSummary(db, R, op), vol: opVolume(op), warns: R.warn[op.id] || [], locked: isLocked(db, op.date) }))
    .filter((r) => !q || norm(`${opNom(r.op)} ${r.text} ${r.op.notes || ''} ${r.lots.map((l) => lotCode(db, R, l)).join(' ')} ${r.conts.map((c) => contName(db, c)).join(' ')} ${operateursNoms(db, r.op.operateurs, ' ')}`).includes(norm(q))), [db, R, scope, oprF, typeF, q, verifF, camp.debut, camp.fin]);
  const vus = rows.slice(0, nMax);
  const groupes = useMemo(() => opGroupes(db, (x) => x.base !== 'apport' && !opViaPressoir(db, { type: x.id }) && !ailleurs(x)), [db, uid]);
  const oprs = operateursTries(db, true);
  const nCamp = db.ops.filter(inCamp).length; const nPlan = (db.previsions || []).filter((p) => p.statut === 'prevue').length; const toCheck = db.ops.filter((o) => inCamp(o) && (R.warn[o.id] || []).length && !o.verifie).length;
  const pending = db.alertes.filter((a) => a.statut === 'attente').length;
  const del = async (op) => { const ok = await confirm({ title: 'Supprimer cette opération ?', body: `${opNom(op)} du ${fmtDate(op.date)} — ${opSummary(db, R, op)}. Les stocks seront recalculés.`, ok: 'Supprimer', danger: true }); if (ok) act((d) => opDelete(d, op.id), 'Opération supprimée.'); };
  const acts = (r) => <OpActions r={r} onEdit={() => setForm({ editId: r.op.id })} onDel={() => del(r.op)} />;
  if (sousOnglet === 'declass') return <div><SubNav value={sousOnglet} onChange={setSousOnglet} items={sousItems} /><TabDeclass /></div>;
  if (sousOnglet === 'catalogue') return <div data-ops-catalogue=""><SubNav value={sousOnglet} onChange={setSousOnglet} items={sousItems} /><ParamsLecture /><OperationsView /></div>;
  const versBouteilles = [['tirage', 'Préparations et tirages (mixtions)'], ['cave', 'Remuage'], ['degorgement', 'Dégorgement']].filter(([m]) => moduleActif(db, m) && moduleAutorise(db, uid, m));
  const lotsOf = (r) => <div className="flex flex-wrap gap-x-2">{r.lots.map((id) => <LotLink key={id} id={id} />)}</div>;
  const contsOf = (r) => <div className="flex flex-wrap gap-x-2">{r.conts.map((id) => <ContLink key={id} id={id} />)}</div>;
  const fermerChoix = () => { setChoixOuvert(false); if (btnNouv.current) btnNouv.current.focus(); };
  const ouvrirChoix = () => setChoixOuvert(true);
  const filtres = scope !== 'camp' || typeF || oprF || q || verifF;
  const effacer = () => { setTypeF(''); setOprF(''); setQ(''); setVerifF(false); };
  // 0.48.0-alpha.1 : états vides — base sans opération, campagne sans opération, filtre sans résultat
  const vide = !db.ops.length ? <Empty><div data-journal-vide="">Aucune opération enregistrée pour l’instant.</div><div className="mt-2 flex flex-wrap justify-center gap-2">{!camp.figee ? <Btn kind="primary" onClick={ouvrirChoix}>＋ Saisir une première opération</Btn> : null}{moduleActif(db, 'pressoir') && moduleAutorise(db, uid, 'pressoir') ? <Btn onClick={() => setTab('pressoir')}>Pesées et pressurages : onglet Pressoir</Btn> : null}</div></Empty>
    : !nCamp && !filtres ? <Empty><span>{`Aucune opération dans la campagne ${camp.nom}.`}</span> <button type="button" className="linkish" onClick={() => setScope('all')}>Voir toutes les campagnes</button></Empty>
      : <Empty><span>Aucune opération pour ces critères.</span>{typeF || oprF || q || verifF ? <> <button type="button" className="linkish" onClick={effacer} data-effacer-filtre="">Effacer les filtres</button></> : null}</Empty>;
  return (
    <div>
      {sousItems.length > 1 ? <SubNav value={sousOnglet} onChange={setSousOnglet} items={sousItems} /> : null}
      <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label={`Opérations ${camp.nom}`} value={fmt(nCamp)} /><Kpi label="À vérifier" value={fmt(toCheck)} tone={toCheck ? 'warn' : undefined} sub="avertissements non bloquants" onClick={toCheck ? () => { setScope('camp'); setVerifF(true); } : undefined} va={toCheck ? 'Voir les opérations' : undefined} />
        <Kpi label="Volume en cuve" value={`${fmtL(R.totalVol)}`} />{voirDeclass ? <Kpi label="Déclassements à valider" value={fmt(pending)} tone={pending ? 'bad' : undefined} sub={pending ? 'voir « Déclassements »' : 'aucun'} onClick={() => setSousOnglet('declass')} va="Voir les déclassements" /> : <Kpi label="Déclassements à valider" value={fmt(pending)} tone={pending ? 'bad' : undefined} sub={moduleActif(db, 'declass') ? 'non accessible avec votre profil' : 'module Déclassements désactivé'} />}
      </div>
      <Sec title="Nouvelle opération" data-nouvelle-op-sec="" right={<>{camp.figee ? <Chip tone="bad">Campagne figée : saisie impossible</Chip> : null}{nPlan && moduleActif(db, 'previsions') ? <button type="button" className="linkish text-sm" onClick={() => setTab('previsions')}>{`📋 ${nPlan} à réaliser`}</button> : null}<Btn size="sm" kind="ghost" onClick={() => (voirCatalogue ? setSousOnglet('catalogue') : setTab('params', 'operations'))} title="Renommer, masquer, créer des opérations ; stade automatique et fiche associée">⚙ Personnaliser les opérations</Btn></>}>
        <div className="flex flex-wrap items-center gap-2">
          <button ref={btnNouv} type="button" className={cx('btn', !choixOuvert && 'btn-primary')} aria-expanded={choixOuvert} aria-controls="nouvelle-op-choix" onClick={() => (choixOuvert ? fermerChoix() : ouvrirChoix())} data-nouvelle-op="" data-vg="ops-nouvelle">{choixOuvert ? '▴ Masquer le choix' : '＋ Nouvelle opération'}</button>
          {!choixOuvert ? <span className="text-sm text-ink2">Recherche, favoris et dernières opérations utilisées.</span> : null}
        </div>
        {choixOuvert ? <div id="nouvelle-op-choix" className="mt-3"><NouvelleOpChoix groupes={groupes} versBouteilles={versBouteilles} figee={camp.figee} onChoisir={(t) => setForm({ type: t })} onChoisirPreset={(t, preset) => setForm({ type: t, preset })} onFermer={fermerChoix} /></div> : null}
        <Aide id="ops-nouvelle" className="mt-3" resume="« ✓ Valider » enregistre l’opération faite, « 📋 Planifier » la garde à réaliser.">
          <p className="text-sm">Dans chaque formulaire : « ✓ Valider » enregistre l’opération faite (stocks mis à jour) ou « 📋 Planifier (à réaliser) » la garde en attente, sans toucher aux stocks. Le journal ci-dessous garde toutes les opérations, tirage, cave et dégorgement compris. Astuce : « ⋯ », clic droit ou appui long sur un contenant du plan de cave pour lancer une opération directement dessus.</p>
        </Aide>
      </Sec>
      <Sec title="Journal des opérations" data-journal="" right={<>
        <SI value={scope} onChange={setScope} options={[{ value: 'camp', label: `Campagne ${camp.nom}` }, { value: 'all', label: 'Toutes les campagnes' }]} style={{ width: 'auto' }} aria-label="Période" />
        <select className="inp" style={{ width: 'auto', maxWidth: 260 }} value={typeF} onChange={(e) => setTypeF(e.target.value)} aria-label="Type d’opération">
          <option value="">Tous les types</option>
          {opGroupes(db, null, true).map((g) => <optgroup key={g.title} label={g.title}><option value={`g:${g.title}`}>Tout le groupe « {g.title} »</option>{g.items.map((k) => <option key={k} value={k}>{OP_LABELS[k] || k}</option>)}</optgroup>)}
        </select>
        {oprs.length ? <select className="inp" style={{ width: 'auto', maxWidth: 230 }} value={oprF} onChange={(e) => setOprF(e.target.value)} aria-label="Opérateur">
          <option value="">Tous les opérateurs</option>{oprs.map((o) => <option key={o.id} value={o.id}>{operateurPlein(o)}{o.actif === false ? ' (archivé)' : ''}</option>)}<option value="-">— Sans opérateur</option>
        </select> : null}
        {verifF ? <button type="button" className="chip chip-warn" onClick={() => setVerifF(false)} aria-label="Retirer le filtre « à vérifier »" data-filtre-verifier="">⚠ À vérifier ✕</button> : null}
        <TI value={q} onChange={setQ} placeholder="Rechercher…" title="Lot, cuve, produit, opérateur, notes…" style={{ width: 200, maxWidth: '100%' }} aria-label="Rechercher" /></>}>
        {!rows.length ? vide : (<>
          <div className="hidden md:block"><div className="tblwrap"><table className="tbl"><thead><tr><th>Date</th><th>Opération</th><th>Lots</th><th>Contenants</th><th>Détail</th><th className="r">Volume</th><th>Opérateur(s)</th><th>Contrôle</th><th aria-label="Actions" /></tr></thead>
            <tbody>{vus.map((r) => (<tr key={r.id}><td className="num whitespace-nowrap">{fmtDate(r.op.date)}</td><td><Chip tone={OP_TONE[r.op.type]}>{opNom(r.op)}</Chip>{r.op.groupe || r.op.schema || r.op.ia || (r.op.depassement && r.op.depassement.motif) ? <div className="mt-1 flex flex-wrap gap-1"><GroupeChip x={r.op} /><DepassementChip op={r.op} /><SchemaChip x={r.op} /><IaTrace ia={r.op.ia} /></div> : null}</td><td>{lotsOf(r)}</td><td>{contsOf(r)}</td><td className="max-w-md">{r.text}{r.op.notes ? <div className="text-xs text-ink2">{r.op.notes}</div> : null}</td><td className="r num whitespace-nowrap">{r.vol != null ? `${fmtL(r.vol)}` : ''}</td><td><OperateursChips ids={r.op.operateurs} />{r.op.saisiPar ? <div className="mt-0.5 text-xs text-ink2" title={r.op.modifiePar ? `corrigée par ${utilisateurNom(db, r.op.modifiePar)}` : undefined}>saisie : {utilisateurNom(db, r.op.saisiPar)}{r.op.modifiePar ? ' · corrigée' : ''}</div> : null}</td><td><OpWarns r={r} open={!!openW[r.id]} setOpen={(v) => setOpenW((s) => ({ ...s, [r.id]: v }))} /></td><td className="op-acts-td">{acts(r)}</td></tr>))}</tbody></table></div></div>
          <div className="space-y-2 md:hidden">{vus.map((r) => (<div key={r.id} className="card p-3"><div className="flex flex-wrap items-center gap-2"><Chip tone={OP_TONE[r.op.type]}>{opNom(r.op)}</Chip><GroupeChip x={r.op} /><DepassementChip op={r.op} /><SchemaChip x={r.op} /><IaTrace ia={r.op.ia} /><span className="num text-sm">{fmtDate(r.op.date)}</span>{r.vol != null ? <span className="num ml-auto text-sm">{fmtL(r.vol)}</span> : null}</div>
            <div className="mt-1 text-sm">{r.text}</div><div className="mt-1 flex flex-wrap gap-x-3 text-sm">{lotsOf(r)}{contsOf(r)}</div>
            {operateursValides(db, r.op.operateurs).length ? <div className="mt-1.5"><OperateursChips ids={r.op.operateurs} /></div> : null}
            {r.op.saisiPar ? <div className="mt-1 text-xs text-ink2">saisie : {utilisateurNom(db, r.op.saisiPar)}{r.op.modifiePar ? ` · corrigée par ${utilisateurNom(db, r.op.modifiePar)}` : ''}</div> : null}
            <div className="mt-2"><OpWarns r={r} open={!!openW[r.id]} setOpen={(v) => setOpenW((s) => ({ ...s, [r.id]: v }))} /></div><div className="mt-2">{acts(r)}</div></div>))}</div>
          {rows.length > vus.length ? <div className="mt-3 flex flex-wrap items-center justify-center gap-2 no-print" data-journal-plus=""><span className="text-sm text-ink2">{`${fmt(vus.length)} opérations affichées sur ${fmt(rows.length)}`}</span><Btn onClick={() => setNMax((n) => n + JOURNAL_PAGE)}>Afficher plus</Btn><Btn kind="ghost" onClick={() => setNMax(rows.length)}>Tout afficher</Btn></div> : null}
        </>)}
      </Sec>
      {form ? <OpForm type={form.type} editId={form.editId} preset={form.preset} onClose={() => setForm(null)} /> : null}
    </div>
  );
}
TABS_REG.ops = TabOps;

/* ---------- alertes de déclassement : sous-onglet « Déclassements » d'Opérations & Assemblages (onglet dédié jusqu'à 0.27.0-alpha.1) ---------- */
function TabDeclass() {
  const { db, R, act, camp, defaultDate, showLot, moi } = useApp();
  const [dates, setDates] = useState({}); const [qui, setQui] = useState({});
  const quiOf = (a) => qui[a.id] || (moi ? [moi] : []);
  const pending = db.alertes.filter((a) => a.statut === 'attente'); const done = db.alertes.filter((a) => a.statut !== 'attente').sort((a, b) => ((a.decidedOn || '') < (b.decidedOn || '') ? 1 : -1));
  const dateOf = (a) => dates[a.id] || defaultDate;
  return (
    <div data-vg="declass">
      <Notice tone="info" title="Un déclassement n’est jamais appliqué sans votre validation">Quand un intrant non autorisé est ajouté à une portion, ou qu’une préparation de rang inférieur y est incorporée, une alerte est créée ici. La revendication du lot ne change qu’au moment où vous la validez ; elle est alors tracée comme une opération « Déclassement validé ».</Notice>
      <Sec className="mt-5" title={`À valider (${pending.length})`}>
        {!pending.length ? <Empty>Aucune alerte en attente.</Empty> : <div className="space-y-3">{pending.map((a) => { const lot = R.lots[a.lotId] || {}; const op = db.ops.find((o) => o.id === a.opId);
          return (<div key={a.id} className="card p-4" style={{ borderLeft: '4px solid var(--bad)' }}>
            <div className="flex flex-wrap items-center gap-2"><b className="text-base">{a.motif}</b><Chip tone="bad">{a.kind === 'propagation' ? 'Propagation' : a.kind === 'prep' ? 'Préparation' : 'Intrant non autorisé'}</Chip></div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink2"><span>Lot <button type="button" className="linkish" onClick={() => showLot(a.lotId)}>{lot.code || '—'}</button></span>{a.contenantId ? <span>Cuve <ContLink id={a.contenantId} /></span> : null}{op ? <span>{opNom(op)} du {fmtDate(op.date)}</span> : null}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">Revendication actuelle <QChip id={a.from} /> <span aria-hidden="true">→</span> déclassement proposé <QChip id={a.to} /></div>
            {operateursTries(db, false).length ? <div className="mt-3"><OperateursPicker value={quiOf(a)} onChange={(v) => setQui((s) => ({ ...s, [a.id]: v }))} label="Décision prise par" allowAdd={false} /></div> : null}
            <div className="mt-3 flex flex-wrap items-end gap-2"><Field label="Date de la décision" className="w-44"><DI value={dateOf(a)} onChange={(v) => setDates((s) => ({ ...s, [a.id]: v }))} /></Field>
              <Btn kind="primary" onClick={() => act((d) => alertValidate(d, a.id, dateOf(a), quiOf(a)), `Lot ${lot.code} déclassé en ${qLabel(a.to)}.`)}>Valider le déclassement en {qLabel(a.to)}</Btn>
              <Btn onClick={() => act((d) => alertRefuse(d, a.id, quiOf(a)), 'Alerte refusée : la revendication est inchangée.')}>Refuser (garder {qLabel(a.from)})</Btn></div>
            <p className="help">Refuser conserve la revendication actuelle ; l’avertissement reste visible dans le journal de l’opération. {camp.figee ? ' La campagne active est figée : choisissez une date dans une campagne ouverte.' : ''}</p>
          </div>); })}</div>}
      </Sec>
      <Sec title="Historique des décisions"><Tbl rows={done} empty="Aucune décision enregistrée." cols={[
        { h: 'Décidée le', r: (a) => <span className="num">{fmtDate(a.decidedOn)}</span> }, { h: 'Lot', r: (a) => <LotLink id={a.lotId} /> }, { h: 'Motif', r: (a) => a.motif },
        { h: 'Revendication', r: (a) => <span className="flex items-center gap-1"><QChip id={a.from} />→<QChip id={a.to} /></span> },
        { h: 'Décision', r: (a) => (a.statut === 'valide' ? <Chip tone="bad">{a.dejaFait ? 'Validée (déjà déclassé)' : 'Déclassement appliqué'}</Chip> : <Chip>Refusée</Chip>) }, { h: 'Décidé par', r: (a) => <OperateursChips ids={a.decidePar} /> }]} /></Sec>
    </div>
  );
}
TABS_REG.declass = TabDeclass;
