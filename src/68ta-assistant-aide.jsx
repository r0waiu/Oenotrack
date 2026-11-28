/* ============ ASSISTANT « COMMENT FAIRE… ? » (0.49.0-alpha.1, audit IA validé : IA07, usage aide, niveau 0) ============
   Une question → réponse fondée sur la documentation intégrée envoyée avec elle (chapitres et étapes de la visite guidée VISITE_CHAPITRES,
   modules MODULE_DEFS, rubriques de Paramètres PARAMS_ITEMS / PARAMS_GROUPES, notes de version récentes CHANGELOG) : rien de l'exploitation.
   La réponse (schéma IA_AIDE_SCHEMA, moteur 17ad-ia-regle.js) donne un texte et des liens { module, sub, libelle } transformés en boutons
   setTab(module, sub), seulement vers des modules affichés et autorisés. Historique de la conversation en mémoire seulement (jamais
   enregistré, perdu au rechargement). Ouvert par « 💬 Comment faire ? » (en-tête) et depuis Paramètres › Affichage & application. */
const AIDE_HISTORIQUE = { L: [] }; // [{ q, reponse, liens, le }] — en mémoire seulement
const AIDE_LANGUES = { en: 'anglais', es: 'espagnol', it: 'italien', de: 'allemand', pt: 'portugais' };
// modules vers lesquels un lien est permis : affichés et autorisés (Paramètres : niveau params)
function aideModulesPermis(db, niveau) {
  return Object.keys(MODULE_DEFS).filter((id) => id !== 'declass' && (id === 'params' || moduleActif(db, id)) && niveau(id) !== 'aucun');
}
function aideDocumentation(db, permis, niveau) {
  const voir = (m) => niveau(m) !== 'aucun';
  const groupe = (id) => (PARAMS_GROUPES.find((g) => g.items.includes(id)) || {}).label || '';
  return iaAideDoc({ modules: permis.map((id) => ({ id, label: MODULE_DEFS[id].label, desc: MODULE_DEFS[id].desc })), chapitres: visiteChapitres(db, voir),
    rubriques: permis.includes('params') ? PARAMS_ITEMS.filter((x) => !x.module).map((x) => ({ id: x.id, label: x.label, groupe: groupe(x.id) })) : [], notes: CHANGELOG.slice(0, 3) });
}
function AssistantAide({ onClose }) {
  const { db, setTab, niveau } = useApp(); const ia = useIaUsage(); const [q, setQ] = useState(''); const [busy, setBusy] = useState(false); const [L, setL] = useState(() => [...AIDE_HISTORIQUE.L]);
  const finRef = useRef(null);
  const permis = useMemo(() => aideModulesPermis(db, niveau), [db]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (finRef.current && finRef.current.scrollIntoView) finRef.current.scrollIntoView({ block: 'nearest' }); }, [L.length, busy]);
  const demander = async () => {
    const question = q.trim(); if (!question || busy) return; setBusy(true);
    try {
      const P = iaAidePrompt(question, aideDocumentation(db, permis, niveau), L.map((x) => x.q));
      if (LANGUE !== 'fr' && AIDE_LANGUES[LANGUE]) P.system += `\n\nRédige la réponse et les libellés des liens en ${AIDE_LANGUES[LANGUE]}.`;
      const r = await ia.demander('aide', P); if (!r) return;
      const x = iaAideLire(r.valeur, permis); const e = { q: question, reponse: x.reponse, liens: x.liens, le: new Date().toISOString() };
      AIDE_HISTORIQUE.L = [...AIDE_HISTORIQUE.L, e].slice(-20); setL(AIDE_HISTORIQUE.L); setQ('');
    } finally { setBusy(false); }
  };
  const aller = (l) => { onClose(); setTab(l.module, l.sub || undefined); };
  const effacer = () => { AIDE_HISTORIQUE.L = []; setL([]); };
  return (<Sheet title="💬 Comment faire ?" sub="Réponses tirées de la documentation d’Œnotrack ; rien de votre exploitation n’est envoyé." onClose={onClose}
    footer={<><Btn onClick={effacer} disabled={!L.length} data-aide-effacer="">Effacer la conversation</Btn><Btn onClick={onClose}>Fermer</Btn></>}>
    <div className="aide-fil" data-assistant-aide="">
      {!L.length ? <p className="help">Posez votre question, par exemple « comment enregistrer un sulfitage ? » ou « où régler les codes de lots ? ». La réponse s’appuie sur la visite guidée, les modules, les rubriques de Paramètres et les dernières nouveautés ; les boutons ouvrent l’onglet indiqué.</p> : null}
      {L.map((x, k) => <div key={k} className="aide-echange" data-aide-echange={k}>
        <div className="aide-q" translate="no">{x.q}</div>
        <div className="aide-r"><p translate="no" style={{ whiteSpace: 'pre-wrap' }}>{x.reponse || '—'}</p>
          {x.liens.length ? <div className="mt-2 flex flex-wrap gap-2">{x.liens.map((l, j) => <Btn key={j} size="sm" onClick={() => aller(l)} data-aide-lien={`${l.module}${l.sub ? `|${l.sub}` : ''}`}><span translate="no">{`${l.libelle} ↗`}</span></Btn>)}</div> : null}</div>
      </div>)}
      {busy ? <p className="help">⏳ L’assistant cherche dans la documentation…</p> : null}
      <div ref={finRef} />
    </div>
    <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); demander(); }}>
      <div className="min-w-0 flex-1" style={{ minWidth: 200 }}><Field label="Votre question"><TI value={q} onChange={setQ} placeholder="Comment faire… ?" aria-label="Votre question" maxLength={600} /></Field></div>
      <IaBouton usage="aide" busy={busy} disabled={!q.trim()} onClick={demander} data-aide-envoyer="">Demander</IaBouton>
    </form>
    <p className="help mt-2">La conversation reste en mémoire le temps de la session ; elle n’est jamais enregistrée.</p>
  </Sheet>);
}
