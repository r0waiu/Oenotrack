/* ============ HYGIÈNE › LISTES (0.27.0-alpha.2) : toutes les listes de l'hygiène se personnalisent ============
   Moteur : 16h-listes-hygiene.js. Contrôles après rinçage (avec le résultat attendu), zones, dangers, natures, formes et unités des
   produits, protections individuelles, moments du plan, types et résultats de maintenance ; actions et locaux (listes de Paramètres,
   mêmes données) repris ici. Un élément utilisé se masque (l'historique le garde) ; un élément d'origine ne se supprime pas. */
function HygListeCarte({ def }) {
  const { db, act } = useApp(); const items = hygListeItems(db, def.key);
  const [nv, setNv] = useState(''); const [nvA, setNvA] = useState(''); const [ed, setEd] = useState(null); // ed : { id, label, attendu }
  const ajouter = () => { const r = act((d) => hygListeAjouter(d, def.key, nv, { attendu: nvA }), 'Élément ajouté.'); if (r && r.ok) { setNv(''); setNvA(''); } };
  const enregistrer = () => { const r = act((d) => hygListeModifier(d, def.key, ed.id, { label: ed.label, ...(def.attendu ? { attendu: ed.attendu } : {}) }), 'Élément modifié.'); if (r && r.ok) setEd(null); };
  return (
    <div className="card p-3" data-hyg-liste={def.key}>
      <h4 className="text-lg font-semibold">{def.titre}</h4>{def.aide ? <p className="help mb-2">{def.aide}</p> : null}
      {!items.length ? <p className="help">Aucun élément pour l’instant.</p> : null}
      <ul className="space-y-1.5">{items.map((it, i) => { const n = hygListeUsage(db, def.key, it.id); return (
        <li key={it.id} className={cx('rounded-md border border-line px-2.5 py-1.5', it.masque && 'opacity-70')} data-hyg-item={it.id}>
          {ed && ed.id === it.id ? <div className="flex flex-wrap items-center gap-1.5">
            <TI value={ed.label} onChange={(v) => setEd({ ...ed, label: v })} autoFocus aria-label="Libellé" onKeyDown={(e) => { if (e.key === 'Enter') enregistrer(); if (e.key === 'Escape') setEd(null); }} style={{ minWidth: 140, flex: 1 }} />
            {def.attendu ? <TI value={ed.attendu} onChange={(v) => setEd({ ...ed, attendu: v })} placeholder="Résultat attendu" aria-label="Résultat attendu" style={{ minWidth: 120, flex: 1 }} /> : null}
            <Btn size="sm" kind="primary" onClick={enregistrer}>OK</Btn><Btn size="sm" onClick={() => setEd(null)} aria-label="Annuler la modification">✕</Btn>
          </div> : <>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1" style={{ overflowWrap: 'anywhere' }}><span className="font-medium">{it.label}</span>{it.masque ? <Chip className="ml-1.5">masqué</Chip> : null}{n ? <Chip className="ml-1.5" title="Nombre d’utilisations">{`${n}×`}</Chip> : null}
                {def.attendu && it.attendu ? <div className="text-xs text-ink2">{`attendu : ${it.attendu}`}</div> : null}</div>
              <div className="flex flex-none items-center">
                <Btn size="sm" kind="ghost" disabled={i === 0} onClick={() => act((d) => hygListeDeplacer(d, def.key, it.id, -1))} aria-label={`Monter ${it.label}`} title="Monter">▲</Btn>
                <Btn size="sm" kind="ghost" disabled={i === items.length - 1} onClick={() => act((d) => hygListeDeplacer(d, def.key, it.id, 1))} aria-label={`Descendre ${it.label}`} title="Descendre">▼</Btn></div>
            </div>
            <div className="mt-0.5 flex flex-wrap gap-1">
              <Btn size="sm" kind="ghost" onClick={() => setEd({ id: it.id, label: it.label, attendu: it.attendu || '' })}>Modifier</Btn>
              <Btn size="sm" kind="ghost" onClick={() => act((d) => hygListeModifier(d, def.key, it.id, { masque: !it.masque }), it.masque ? 'Élément de nouveau proposé.' : 'Élément masqué : il n’est plus proposé (l’historique le garde).')}>{it.masque ? 'Afficher' : 'Masquer'}</Btn>
              {!it.origine ? <Btn size="sm" kind="ghost" disabled={n > 0} title={n > 0 ? 'Utilisé : masquez-le plutôt' : 'Supprimer'} onClick={() => act((d) => hygListeSupprimer(d, def.key, it.id), 'Élément supprimé.')}>Supprimer</Btn> : null}
            </div>
          </>}
        </li>); })}</ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <TI value={nv} onChange={setNv} placeholder="Nouvel élément…" aria-label={`Ajouter à ${def.titre}`} onKeyDown={(e) => { if (e.key === 'Enter') ajouter(); }} style={{ minWidth: 150, flex: 1 }} />
        {def.attendu ? <TI value={nvA} onChange={setNvA} placeholder="Résultat attendu (ex. pH 7)" aria-label="Résultat attendu du nouvel élément" style={{ minWidth: 150, flex: 1 }} /> : null}
        <Btn onClick={ajouter}>Ajouter</Btn>
      </div>
    </div>
  );
}
// groupes : 'hygiene', 'maintenance' (types et résultats d'intervention), 'equipements' (catégories du parc) — 0.28.0-alpha.1
function HygListesView({ groupes = ['hygiene', 'maintenance'] }) {
  const hyg = groupes.includes('hygiene');
  return (
    <div data-hyg-listes="">
      {hyg ? <Notice tone="info" title="Listes de l’hygiène">Les choix proposés dans le journal, le plan de nettoyage, la maintenance et les produits d’hygiène se personnalisent ici : renommez, masquez, réordonnez, ajoutez vos propres éléments. Un élément déjà utilisé se masque (l’historique le garde) ; les éléments d’origine ne se suppriment pas.</Notice>
        : <Notice tone="info" title="Listes des équipements">Catégories du parc, types et résultats des interventions de maintenance : renommez, masquez, réordonnez, ajoutez vos propres éléments. Un élément déjà utilisé se masque (l’historique le garde) ; les éléments d’origine ne se suppriment pas.</Notice>}
      <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,340px),1fr))' }}>
        {HYG_LISTES_DEF.filter((d) => groupes.includes(d.groupe || 'hygiene')).map((d) => <HygListeCarte key={d.key} def={d} />)}
        {hyg ? LIST_META.filter((m) => m.key === 'actionsHygiene' || m.key === 'locaux').map((m) => <ListCard key={m.key} meta={m} />) : null}
      </div>
    </div>
  );
}
