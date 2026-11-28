/* ============ SÉLECTEURS : crus (villages), apporteurs ; blocs de composition ============ */
function CruForm({ id, preset, onClose, onSaved }) {
  const { db, act } = useApp(); const c = id ? db.crus.find((x) => x.id === id) : null;
  const [f, set] = useDraft({ nom: c ? c.nom : (preset && preset.nom) || '', echelle: c ? c.echelle : (eDef('autre') ? 'autre' : (ECHELLES[0] || {}).id), dep: c ? c.dep : 'Marne', alias: c ? c.alias || '' : '', masque: c ? !!c.masque : false });
  const save = () => { const r = act((d) => cruSave(d, f, id), id ? 'Cru modifié.' : 'Cru personnalisé ajouté.'); if (r.ok) { if (onSaved) onSaved(r.id); onClose(); } };
  const dup = f.nom.trim() && nameTaken(db.crus, f.nom, id);
  return (
    <FormSheet title={id ? `Modifier le cru ${c.nom}` : 'Nouveau cru (village)'} sub="Ajoutez un village absent de la liste ou corrigez un classement." onClose={onClose} onSave={save}>
      <Field label="Nom du cru (village)" help={dup ? '⚠ Ce nom existe déjà.' : ''}><TI value={f.nom} onChange={(v) => set('nom', v)} autoFocus placeholder="ex. Cramant" /></Field>
      <G><Field label={ECH.nom}><SI value={f.echelle} onChange={(v) => set('echelle', v)} options={[...ECHELLES].reverse().map((e) => ({ value: e.id, label: e.un }))} /></Field><Field label="Département"><TI value={f.dep} onChange={(v) => set('dep', v)} list="dep-list" placeholder="Marne" /></Field></G>
      <datalist id="dep-list">{DEPARTEMENTS.map((d) => <option key={d} value={d} />)}</datalist>
      <Field label="Autres graphies (recherche)" help="Variantes d’orthographe, séparées par des virgules : elles servent uniquement à la recherche."><TI value={f.alias} onChange={(v) => set('alias', v)} /></Field>
      <Check checked={f.masque} onChange={(v) => set('masque', v)} label="Masquer ce cru dans les listes de saisie (il reste visible dans l’historique et les registres)" />
    </FormSheet>
  );
}
// Partenaire (db.apporteurs) : apporteur de raisins ou de moûts, vendeur de vins, ou les deux ; crus par défaut proposés à la saisie
function ApporteurForm({ id, preset, onClose, onSaved }) {
  const { db, act } = useApp(); const a = id ? db.apporteurs.find((x) => x.id === id) : null; const p = preset || {};
  const [f, set] = useDraft({ nom: a ? a.nom : p.nom || '', commune: a ? a.commune : '', ident: a ? a.ident || '' : '', contact: a ? a.contact : '', notes: a ? a.notes : p.notes || '', apporteur: a ? a.apporteur !== false : p.vendeur ? false : true, vendeur: a ? !!a.vendeur : !!p.vendeur, crusDefaut: a ? [...(a.crusDefaut || [])] : [], cruAuto: a ? !!a.cruAuto : true });
  const [cru, setCru] = useState('');
  const save = () => { const r = act((d) => apporteurSave(d, f, id), id ? 'Partenaire modifié.' : 'Partenaire ajouté.'); if (r.ok) { if (onSaved) onSaved(r.id); onClose(); } };
  const addCru = (v) => { if (v && !f.crusDefaut.includes(v)) set('crusDefaut', [...f.crusDefaut, v]); setCru(''); };
  return (
    <FormSheet title={id ? `Modifier ${a.nom}` : 'Nouveau partenaire'} sub="Viticulteur, coopérative ou négociant : apporteur de raisins ou de moûts, vendeur de vins, ou les deux." onClose={onClose} onSave={save}>
      <Field label="Nom" help={f.nom.trim() && nameTaken(db.apporteurs, f.nom, id) ? '⚠ Ce partenaire existe déjà.' : ''}><TI value={f.nom} onChange={(v) => set('nom', v)} autoFocus /></Field>
      <Group label="Rôles"><div className="flex flex-wrap gap-x-6 gap-y-1"><Check checked={f.apporteur} onChange={(v) => set('apporteur', v)} label="Apporteur (raisins, moûts)" /><Check checked={f.vendeur} onChange={(v) => set('vendeur', v)} label="Vendeur de vins (entrée de vin)" /></div></Group>
      <G><Field label="Commune"><TI value={f.commune} onChange={(v) => set('commune', v)} /></Field><Field label="Contact"><TI value={f.contact} onChange={(v) => set('contact', v)} placeholder="Téléphone, e-mail…" /></Field></G>
      <Field label="Identifiant (facultatif)" help="Imprimé sur les bons de pesée : n° CVI, n° interprofessionnel…"><TI value={f.ident} onChange={(v) => set('ident', v)} placeholder="ex. CVI 51…" aria-label="Identifiant du partenaire" /></Field>
      <Group label="Crus par défaut" help="Proposés quand ce partenaire est choisi dans un apport ou un compartiment d’entrée de moûts (modifiables à chaque saisie).">
        <div className="space-y-2">
          {f.crusDefaut.length ? <div className="flex flex-wrap gap-1.5">{f.crusDefaut.map((c, i) => <span key={c} className="chip" style={{ gap: 6 }}>{i === 0 ? '★ ' : ''}{cruName(db, c)}<button type="button" className="linkish" aria-label={`Retirer ${cruName(db, c)}`} onClick={() => set('crusDefaut', f.crusDefaut.filter((x) => x !== c))}>✕</button></span>)}</div> : <div className="text-sm text-ink2">Aucun cru par défaut.</div>}
          <CruSelect value={cru} onChange={addCru} placeholder="Ajouter un cru par défaut…" />
          <Check checked={f.cruAuto} onChange={(v) => set('cruAuto', v)} label={`Proposer automatiquement ${f.crusDefaut.length > 1 ? 'le premier cru (★)' : 'ce cru'} à la saisie`} />
        </div>
      </Group>
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} /></Field>
    </FormSheet>
  );
}

// Crus : champ à autocomplétion (« Lou » → Louvois), groupé par échelle ; les crus masqués n'apparaissent pas (sauf valeur déjà choisie)
const cruOptions = (db, value, includeHidden) => [...ECHELLES].reverse().concat([{ id: '', un: 'Non classé', label: 'Non classés' }]).flatMap((e) => db.crus.filter((c) => (e.id ? c.echelle === e.id : !eDef(c.echelle)) && (includeHidden || !c.masque || c.id === value))
  .map((c) => ({ value: c.id, label: c.nom, sub: `${e.un}${c.dep && c.dep !== 'Marne' ? ' · ' + c.dep : ''}${c.custom ? ' · perso' : ''}${c.masque ? ' · masqué' : ''}`, group: e.label, keys: c.alias || '' })));
function CruSelect({ value, onChange, placeholder = 'Cru (village) : commencez à écrire…', allowAdd = true, includeHidden, className }) {
  const { db } = useApp(); const [add, setAdd] = useState(null);
  return (
    <div className={cx('flex min-w-0 gap-1', className)}>
      <Combo value={value || ''} onChange={onChange} options={cruOptions(db, value, includeHidden)} placeholder={placeholder} aria-label="Cru (village)" onCreate={allowAdd ? (t) => setAdd({ nom: t }) : undefined} createLabel="Créer le cru" />
      {allowAdd ? <Btn size="sm" title="Ajouter un cru personnalisé" aria-label="Ajouter un cru personnalisé" onClick={() => setAdd({})}>+</Btn> : null}
      {add ? <CruForm preset={add} onClose={() => setAdd(null)} onSaved={(id) => onChange(id)} /> : null}
    </div>
  );
}
// Parcelles : choisies par nom, lieu-dit, cadastre ou cru ; rangées par cru
const parcelleOptions = (db, value) => (db.parcelles || []).filter((p) => !p.masque || p.id === value).sort((a, b) => cruName(db, a.cruId).localeCompare(cruName(db, b.cruId), 'fr') || a.nom.localeCompare(b.nom, 'fr'))
  .map((p) => ({ value: p.id, label: p.nom, sub: [p.lieuDit, p.cepageId ? lbl(db, 'cepages', p.cepageId) : '', p.surface ? `${fmt(p.surface, 2)} a` : '', p.masque ? 'masquée' : ''].filter(Boolean).join(' · '), group: cruName(db, p.cruId), keys: `${p.lieuDit || ''} ${p.cadastre || ''} ${cruName(db, p.cruId)}` }));
function ParcelleSelect({ value, onChange, placeholder = 'Parcelle : commencez à écrire…', allowAdd = true, className, preset }) {
  const { db } = useApp(); const [add, setAdd] = useState(null);
  return (
    <div className={cx('flex min-w-0 gap-1', className)}>
      <Combo value={value || ''} onChange={onChange} options={parcelleOptions(db, value)} placeholder={placeholder} aria-label="Parcelle" onCreate={allowAdd ? (t) => setAdd({ ...(preset || {}), nom: t }) : undefined} createLabel="Créer la parcelle" />
      {allowAdd ? <Btn size="sm" title="Ajouter une parcelle" aria-label="Ajouter une parcelle" onClick={() => setAdd({ ...(preset || {}) })}>+</Btn> : null}
      {add ? <ParcelleForm preset={add} onClose={() => setAdd(null)} onSaved={(id) => onChange(id)} /> : null}
    </div>
  );
}
function ParcelleForm({ id, preset, onClose, onSaved }) {
  const { db, act } = useApp(); const p = id ? (db.parcelles || []).find((x) => x.id === id) : null; const s0 = p || preset || {};
  const [f, set] = useDraft({ nom: s0.nom || '', cruId: s0.cruId || '', lieuDit: s0.lieuDit || '', cadastre: s0.cadastre || '', surface: s0.surface != null ? String(s0.surface) : '', cepageId: s0.cepageId || '', annee: s0.annee || '', apporteurId: s0.apporteurId || '', appellationId: s0.appellationId || '', niveau: s0.niveau || '', notes: s0.notes || '', masque: !!s0.masque });
  const save = () => { const r = act((d) => parcelleSave(d, f, id), id ? 'Parcelle modifiée.' : 'Parcelle ajoutée.'); if (r.ok) { if (onSaved) onSaved(r.id); onClose(); } };
  return (
    <FormSheet title={id ? `Modifier la parcelle ${p.nom}` : 'Nouvelle parcelle'} sub="Une parcelle appartient à un cru (village) : la choisir dans un apport renseigne le cru automatiquement." onClose={onClose} onSave={save}>
      <div className="grid2"><Field label="Nom de la parcelle"><TI value={f.nom} onChange={(v) => set('nom', v)} placeholder="ex. Les Crayères – rang 3" /></Field><Field label="Cru (village)"><CruSelect value={f.cruId} onChange={(v) => set('cruId', v)} /></Field></div>
      <div className="grid2"><Field label="Lieu-dit"><TI value={f.lieuDit} onChange={(v) => set('lieuDit', v)} /></Field><Field label="Référence cadastrale" help="ex. AB 123"><TI value={f.cadastre} onChange={(v) => set('cadastre', v)} /></Field></div>
      <div className="grid3"><Field label="Surface (ares)"><NI value={f.surface} onChange={(v) => set('surface', v)} placeholder="ex. 35,20" /></Field><Field label="Cépage principal"><SI value={f.cepageId} onChange={(v) => set('cepageId', v)} placeholder="—" options={opts(db, 'cepages')} /></Field><Field label="Année de plantation"><TI value={f.annee} onChange={(v) => set('annee', v)} inputMode="numeric" placeholder="ex. 1998" /></Field></div>
      <ParcelleAppellation f={f} set={set} />
      <Field label="Exploitant / apporteur" help="Proposé automatiquement dans les apports de cette parcelle."><ApporteurSelect value={f.apporteurId} onChange={(v) => set('apporteurId', v)} /></Field>
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} placeholder="Porte-greffe, clone, mode de conduite, exposition…" /></Field>
      <Check checked={f.masque} onChange={(v) => set('masque', v)} label="Masquer cette parcelle dans les listes de saisie" />
    </FormSheet>
  );
}
// 0.47.0-alpha.1 : appellation de la parcelle et son niveau dans la hiérarchie de l'appellation
function ParcelleAppellation({ f, set }) {
  const { db } = useApp(); const A = db.lists.appellations || []; const e = f.appellationId ? appellationEchelle(db, f.appellationId) : null; const N = e && e.hierarchie ? e.hierarchie.items : [];
  return (<div className="grid2" data-parcelle-appellation="">
    <Field label="Appellation"><SI plain value={f.appellationId} onChange={(v) => { set('appellationId', v); set('niveau', ''); }} options={[{ value: '', label: A.length ? 'Non précisée' : 'Aucune appellation dans la liste (Paramètres › Listes)' }, ...A.map((a) => ({ value: a.id, label: a.label, donnee: true }))]} aria-label="Appellation de la parcelle" /></Field>
    <Field label={e && e.hierarchie ? `Niveau (${e.hierarchie.nom})` : 'Niveau'} help={e && !e.confirmee ? 'Hiérarchie proposée d’après l’appellation : confirmez-la dans Paramètres › Listes.' : undefined}><SI plain value={f.niveau} onChange={(v) => set('niveau', v)} disabled={!N.length} options={[{ value: '', label: 'Non précisé' }, ...N.map((i) => ({ value: i.id, label: i.label }))]} aria-label="Niveau de la parcelle" /></Field>
  </div>);
}
function ApporteurSelect({ value, onChange, placeholder = 'Partenaire : commencez à écrire…', allowAdd = true, className, role, ariaLabel = 'Partenaire' }) {
  const { db } = useApp(); const [add, setAdd] = useState(null);
  const L = [...db.apporteurs].sort((x, y) => (role === 'vendeur' ? (!!y.vendeur - !!x.vendeur) : role === 'apporteur' ? ((y.apporteur !== false) - (x.apporteur !== false)) : 0) || x.nom.localeCompare(y.nom, 'fr'));
  return (
    <div className={cx('flex min-w-0 gap-1', className)}>
      <Combo value={value || ''} onChange={onChange} placeholder={placeholder} aria-label={ariaLabel} options={L.map((a) => ({ value: a.id, label: a.nom, sub: [apporteurRoles(a).join(' · '), a.commune || ''].filter(Boolean).join(' · ') }))} onCreate={allowAdd ? (t) => setAdd({ nom: t, vendeur: role === 'vendeur' }) : undefined} createLabel="Créer le partenaire" />
      {allowAdd ? <Btn size="sm" title="Ajouter un partenaire" aria-label="Ajouter un partenaire" onClick={() => setAdd({ vendeur: role === 'vendeur' })}>+</Btn> : null}
      {add ? <ApporteurForm preset={add} onClose={() => setAdd(null)} onSaved={(id) => onChange(id)} /> : null}
    </div>
  );
}
// Origine par crus d'un stock repris : lignes cru + part relative ; à défaut de village, une simple échelle
function CrusEditor({ crus, onChange, echelle, onEchelle }) {
  const upd = (i, patch) => onChange(crus.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  const used = crus.some((x) => x.cruId);
  return (
    <div className="space-y-2">
      {crus.map((x, i) => (
        <div key={i} className="grid items-start gap-2" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) auto' }}>
          <CruSelect value={x.cruId} onChange={(v) => upd(i, { cruId: v })} />
          <NI value={x.pct} onChange={(v) => upd(i, { pct: v })} placeholder="part (%)" aria-label="Part de ce cru" />
          <Btn kind="danger" size="sm" aria-label="Retirer le cru" onClick={() => onChange(crus.length > 1 ? crus.filter((_, k) => k !== i) : [{ cruId: '', pct: '' }])}>✕</Btn>
        </div>
      ))}
      <Btn size="sm" onClick={() => onChange([...crus, { cruId: '', pct: '' }])}>+ Ajouter un cru</Btn>
      {!used ? <Field label={`${ECH.nom} (si les villages sont inconnus)`}><SI value={echelle} onChange={onEchelle} placeholder="Non renseignée" options={[...ECHELLES].reverse().map((e) => ({ value: e.id, label: e.un }))} /></Field> : null}
    </div>
  );
}
const CruBadge = ({ id }) => { const { db } = useApp(); const c = id ? cruById(db, id) : null; return c ? <span className="inline-flex items-center gap-1"><span>{c.nom}</span><EChip id={c.echelle} compact /></span> : <span className="text-ink2">cru non renseigné</span>; };

/* ---------- composition : 6 barres (cépages, millésimes, revendications, échelle, crus, apporteurs) ---------- */
const FRAC_COLORS = ['#3D7A5C', '#C9A13B', '#B5683F', '#7B5EA7', '#5E8F9C', '#8D9A3F', '#A0526B', '#6F7F8C'];
const fracColor = (db, k) => { if (!k || k === '?') return '#B7BDB9'; const i = fracList(db).findIndex((x) => x.id === k); return FRAC_COLORS[(i < 0 ? 7 : i) % FRAC_COLORS.length]; };
function compItems(db, comp) {
  const mk = (o, colorOf, labelOf) => Object.keys(o || {}).sort((a, b) => o[b] - o[a]).map((k, i) => ({ key: k, label: labelOf(k), share: o[k], color: colorOf(k, i) }));
  return {
    cepages: mk(comp.cepages, (k) => cepageColor(db, k), (k) => lbl(db, 'cepages', k)),
    millesimes: mk(comp.millesimes, (k, i) => MILL_COLORS[i % MILL_COLORS.length], (k) => millesimeAffiche(k)),
    fractions: mk(comp.fractions, (k) => fracColor(db, k), (k) => fracLabel(db, k)),
    qualifs: mk(comp.qualifs, (k) => qColor(db, k), (k) => qLabel(k)),
    echelles: mk(comp.echelles, (k) => eColor(db, k === 'inconnu' ? null : k), (k) => (k === 'inconnu' ? 'Non renseigné' : eLabel(k))),
    crus: mk(comp.crus, (k, i) => (k === '?' ? '#B7BDB9' : shade(eColor(db, cruEchelle(db, k)), ((i % 3) - 1) * 0.16)), (k) => (k === '?' ? 'Non renseigné' : cruName(db, k))),
    apporteurs: mk(comp.apporteurs, (k, i) => originColor(k, i), (k) => (k === '?' ? 'Non renseigné' : apporteurName(db, k))),
    parcelles: mk(comp.parcelles, (k, i) => (k === '?' ? '#B7BDB9' : originColor(k, i + 3)), (k) => (k === '?' ? 'Non renseignée' : parcelleName(db, k))),
  };
}
function CompBlock({ comp, empty }) {
  const { db } = useApp();
  if (!comp) return <div className="text-sm text-ink2">{empty || 'Aucun contenu.'}</div>;
  const it = compItems(db, comp); const ei = echelleInfo(comp);
  const B = (title, items) => (<div className="min-w-0"><div className="lbl">{title}</div><StackBar items={items} /></div>);
  return (
    <div>
      <div className="grid gap-x-4 gap-y-4" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))' }}>{B('Cépages', it.cepages)}{B('Millésimes', it.millesimes)}{B('Fractions de moût', it.fractions)}{B('Revendications', it.qualifs)}{B(ECH.nom, it.echelles)}{B('Crus (villages)', it.crus)}{B('Partenaires', it.apporteurs)}{(it.parcelles || []).some((x) => x.key !== '?') ? B('Parcelles', it.parcelles) : null}</div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span className="text-ink2">{ECH.nom} retenue pour ce contenu :</span><EChip info={ei} />{ei.partiel ? <span className="text-xs text-ink2">(* origine partiellement renseignée)</span> : null}<span className="text-ink2">· Revendication retenue :</span><QChip id={minQualif(Object.keys(comp.qualifs).filter((k) => comp.qualifs[k] > 0.0005))} /></div>
    </div>
  );
}
