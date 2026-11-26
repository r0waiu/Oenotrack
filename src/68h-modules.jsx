/* ============ PARAMÈTRES › MODULES : ordre des onglets et modules actifs ============
   Réglage commun à la base (settings.modulesOrdre / modulesOff, voir 31-crud.js) : il suit la base sur tous les appareils.
   Désactiver un module masque son onglet et ses raccourcis ; aucune donnée n'est supprimée. « Paramètres » reste toujours actif. */
const pl_ = (n, un, plusieurs) => `${fmt(n)} ${n > 1 ? plusieurs : un}`;
// ce que contient chaque module, et ce qui resterait en attente s'il était désactivé
function moduleContenu(db, R, id) {
  const prev = (db.previsions || []).filter((p) => p.statut === 'prevue').length; const att = (db.alertes || []).filter((a) => a.statut === 'attente').length;
  switch (id) {
    case 'cuverie': return { txt: `${pl_(db.contenants.length, 'contenant', 'contenants')} · ${pl_(Object.keys(R.lotVol).filter((l) => R.lotVol[l] > 0.5).length, 'lot en cuve', 'lots en cuve')}` };
    case 'ops': return { txt: pl_(db.ops.length, 'opération', 'opérations') };
    case 'previsions': return { txt: `${pl_(prev, 'opération', 'opérations')} à réaliser`, attente: prev ? `${prev > 1 ? `${fmt(prev)} opérations planifiées restent en attente et ne sont plus visibles` : '1 opération planifiée reste en attente et n’est plus visible'} ; le bouton « Planifier » disparaît des formulaires.` : '' };
    case 'declass': return { txt: `${pl_(att, 'alerte', 'alertes')} en attente`, attente: att ? `${att > 1 ? `${fmt(att)} alertes de déclassement restent en attente : la revendication des lots ne change pas tant qu’elles ne sont pas validées` : '1 alerte de déclassement reste en attente : la revendication du lot ne change pas tant qu’elle n’est pas validée'}.` : '' };
    case 'tirage': return { txt: pl_(db.ops.filter((o) => o.type === 'tirage').length, 'tirage', 'tirages') };
    case 'cave': { const nb = sum(Object.values(R.tir), (t) => t.nb); return { txt: `${pl_(nb, 'bouteille', 'bouteilles')} sur lattes` }; }
    case 'degorgement': return { txt: pl_((db.lotsFinis || []).length, 'lot fini', 'lots finis') };
    case 'analyses': return { txt: pl_((db.analyses || []).length, 'analyse', 'analyses') };
    case 'intrants': return { txt: `${pl_(db.produits.length, 'produit', 'produits')} · ${pl_(db.arrivages.length, 'arrivage', 'arrivages')}` };
    case 'hygiene': return { txt: pl_((db.hygiene || []).length, 'entrée', 'entrées') };
    case 'trace': return { txt: 'recherches sur les lots, intrants et parcelles' };
    case 'registres': return { txt: 'exports CSV / Excel, bilan matière' };
    default: return { txt: 'toujours actif' };
  }
}

function ModulesView() {
  const { db, R, act, confirm } = useApp();
  const ids = modulesConnus(db); const [drag, setDrag] = useState(null); const listRef = useRef(null); // drag : { id, over }
  const nOff = ids.filter((id) => !moduleActif(db, id)).length; const perso = Array.isArray(db.settings.modulesOrdre);
  const deplacer = (id, delta) => act((d) => moduleDeplacer(d, id, delta));
  const basculer = async (id, on) => {
    if (!on) { const c = moduleContenu(db, R, id); if (c.attente && !(await confirm({ title: `Désactiver « ${moduleNom(id)} » ?`, body: `${c.attente} Rien n’est supprimé : vous pourrez réactiver le module ici à tout moment.`, ok: 'Désactiver' }))) return; }
    act((d) => moduleActiver(d, id, on), on ? `Module « ${moduleNom(id)} » activé.` : `Module « ${moduleNom(id)} » désactivé : son onglet est masqué, ses données sont conservées.`);
  };
  // glisser-déposer à la souris ou au doigt, par la poignée ⋮⋮
  const indexSous = (y) => { const rows = [...listRef.current.querySelectorAll('[data-module]')]; for (let i = 0; i < rows.length; i += 1) { const r = rows[i].getBoundingClientRect(); if (y < r.top + r.height / 2) return i; } return rows.length - 1; };
  const down = (e, id) => { if (e.button > 0) return; e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (er) { /* capture indisponible */ } setDrag({ id, over: ids.indexOf(id) }); };
  const move = (e) => { if (!drag) return; const over = indexSous(e.clientY); if (over !== drag.over) setDrag({ ...drag, over }); };
  const up = () => { if (!drag) return; const from = ids.indexOf(drag.id); const to = drag.over; const id = drag.id; setDrag(null); if (to !== from && to >= 0) act((d) => moduleDeplacer(d, id, to - from), `« ${moduleNom(id)} » déplacé en position ${to + 1}.`); };
  const vue = drag ? (() => { const v = ids.filter((x) => x !== drag.id); v.splice(drag.over, 0, drag.id); return v; })() : ids;
  const accueil = ongletOuverture(db, vue.filter((x) => moduleActif(db, x))); // onglet d'ouverture (0.34.0-alpha.1) : réglage ou premier onglet
  return (
    <div className="space-y-5">
      <Notice tone="info" title="Modules de l’application">
        Faites glisser la poignée <b>⋮⋮</b> (ou utilisez les flèches) pour changer l’ordre des onglets, et désactivez les modules dont vous n’avez pas besoin.
        Un module désactivé disparaît des onglets et de ses raccourcis, mais <b>aucune donnée n’est supprimée</b> : il revient tel quel dès qu’on le réactive.
        <b> Paramètres</b> reste toujours actif. Cuverie & Lots, Opérations & Assemblages et À réaliser & fiches sont réunis dans l’onglet <b>Vinification</b>, à la place du premier des trois. Ce réglage suit la base sur tous les appareils (synchronisation Drive comprise).
      </Notice>
      <OngletDefautChoix />
      <ol className={cx('mod-liste', drag && 'drag-en-cours')} ref={listRef} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)} aria-label="Ordre des modules">
        {vue.map((id, i) => {
          const D = MODULE_DEFS[id] || { label: id }; const on = moduleActif(db, id); const c = moduleContenu(db, R, id); const fixe = id === MODULE_FIXE;
          return (
            <li key={id} data-module={id} className={cx('mod-row', !on && 'off', drag && drag.id === id && 'drag')}>
              <button type="button" className="mod-poignee" aria-label={`Faire glisser ${D.label}`} title="Glisser pour déplacer" onPointerDown={(e) => down(e, id)} onKeyDown={(e) => { if (e.key === 'ArrowUp') { e.preventDefault(); deplacer(id, -1); } if (e.key === 'ArrowDown') { e.preventDefault(); deplacer(id, 1); } }}>⋮⋮</button>
              <span className="mod-n num" aria-hidden="true">{i + 1}</span>
              <span className="mod-ic" aria-hidden="true">{D.icone}</span>
              <div className="mod-txt">
                <div className="mod-nom">{D.label}{ongletDe(id) !== id ? <Chip>{`dans « ${moduleNom(ongletDe(id))} »`}</Chip> : null}{id === accueil ? <Chip tone="info">s’ouvre au démarrage</Chip> : null}{!on ? <Chip>désactivé</Chip> : null}</div>
                <div className="mod-desc">{D.desc}</div>
                <div className="mod-info">{c.txt}{!on && c.attente ? <span className="text-warn"> · ⚠ {c.attente}</span> : null}</div>
              </div>
              <div className="mod-ctl">
                <button type="button" role="switch" aria-checked={on} className={cx('mod-sw', on && 'on')} disabled={fixe} onClick={() => basculer(id, !on)} aria-label={`${D.label} : ${fixe ? 'toujours actif' : on ? 'actif' : 'désactivé'}`} title={fixe ? 'Toujours actif : c’est ici qu’on réactive les modules' : on ? 'Désactiver ce module' : 'Activer ce module'}><span className="mod-sw-k" /></button>
                <span className="mod-sw-l">{fixe ? 'toujours actif' : on ? 'actif' : 'désactivé'}</span>
                <span className="mod-fl">
                  <button type="button" className="btn btn-sm" disabled={i === 0} onClick={() => deplacer(id, -1)} aria-label={`Monter ${D.label}`} title="Monter">▲</button>
                  <button type="button" className="btn btn-sm" disabled={i === vue.length - 1} onClick={() => deplacer(id, 1)} aria-label={`Descendre ${D.label}`} title="Descendre">▼</button>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="space-y-2" data-modules-dans="">
        <div className="lbl">Inclus dans un autre onglet</div>
        {Object.keys(MODULES_DANS).map((id) => { const D = MODULE_DEFS[id] || { label: id }; const on = moduleActif(db, id); const c = moduleContenu(db, R, id); return (
          <div key={id} data-module-dans={id} className={cx('mod-row', !on && 'off')}>
            <span className="mod-ic" aria-hidden="true">{D.icone}</span>
            <div className="mod-txt"><div className="mod-nom">{D.label}<Chip>{`dans « ${moduleNom(MODULES_DANS[id])} »`}</Chip>{!on ? <Chip>désactivé</Chip> : null}</div><div className="mod-desc">{D.desc}</div><div className="mod-info">{c.txt}{!on && c.attente ? <span className="text-warn"> · ⚠ {c.attente}</span> : null}</div></div>
            <div className="mod-ctl"><button type="button" role="switch" aria-checked={on} className={cx('mod-sw', on && 'on')} onClick={() => basculer(id, !on)} aria-label={`${D.label} : ${on ? 'actif' : 'désactivé'}`} title={on ? 'Désactiver ce module' : 'Activer ce module'}><span className="mod-sw-k" /></button><span className="mod-sw-l">{on ? 'actif' : 'désactivé'}</span></div>
          </div>); })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn disabled={!perso} onClick={() => act((d) => modulesReinitialiser(d, 'ordre'), 'Ordre d’origine des modules rétabli.')}>Rétablir l’ordre d’origine</Btn>
        {nOff ? <Btn onClick={() => act((d) => modulesReinitialiser(d, 'activation'), 'Tous les modules sont actifs.')}>Réactiver tous les modules ({nOff})</Btn> : null}
      </div>
    </div>
  );
}

/* onglet ouvert au démarrage, à la connexion et au déverrouillage (0.34.0-alpha.1) : indépendant de l'ordre des onglets ; réglage commun
   de la base (settings.ongletDefaut) ; « Premier onglet de la barre » par défaut */
function OngletDefautChoix() {
  const { db, act } = useApp(); const L = modulesVisibles(db); const barre = ongletsBarre(L); const v = String(db.settings.ongletDefaut || '');
  const premier = barre[0] || MODULE_FIXE; const absent = v && !barre.includes(v) && !L.includes(v);
  const choisir = (x) => act((d) => ongletDefautSet(d, x), x ? `« ${moduleNom(x)} » s’ouvrira à la connexion et au déverrouillage.` : 'Le premier onglet de la barre s’ouvrira à la connexion et au déverrouillage.');
  return (
    <div className="card p-3" data-onglet-defaut="">
      <Field label="Onglet ouvert au démarrage, à la connexion et au déverrouillage">
        <select className="inp" style={{ maxWidth: 420 }} value={v} onChange={(e) => choisir(e.target.value)} aria-label="Onglet ouvert au démarrage">
          <option value="">{`Premier onglet de la barre (actuellement « ${moduleNom(premier)} »)`}</option>
          {barre.map((o) => <option key={o} value={o}>{moduleNom(o)}</option>)}
          {absent ? <option value={v}>{`${moduleNom(v)} (désactivé)`}</option> : null}
        </select>
      </Field>
      <p className="help mt-1">Indépendant de l’ordre des onglets. Si l’onglet choisi est désactivé ou n’est pas accessible avec le profil de la personne connectée, le premier onglet de la barre s’ouvre.</p>
    </div>
  );
}
