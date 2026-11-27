/* ============ LISTES DU VIN : stades, couleurs du vin, échelle (classement) des crus — éditeurs ============ */
function RichRow({ k, x, i, n, children }) {
  const { act } = useApp(); const ed = (patch, msg) => act((d) => richListCont(d, k, 'edit', x.id, patch), msg);
  return (
    <div className={cx('flex flex-wrap items-center gap-2 rounded-md border border-line p-2', x.masque && 'opacity-60')} style={{ background: 'var(--surface)' }}>
      <ColorInp label={`Couleur de ${x.label}`} value={x.couleur || '#8C9792'} onChange={(v) => ed({ couleur: v })} />
      <input className="inp" style={{ flex: '2 1 180px', width: 'auto', minWidth: 140 }} defaultValue={x.label} key={`l${x.label}`} aria-label="Libellé" onBlur={(e) => { if (e.target.value.trim() && e.target.value.trim() !== x.label) ed({ label: e.target.value }, 'Libellé modifié.'); }} />
      {children(ed)}
      <div className="ml-auto flex gap-1">
        <Btn size="sm" disabled={i === 0} aria-label={`Monter ${x.label}`} onClick={() => act((d) => richListCont(d, k, 'up', x.id))}>↑</Btn>
        <Btn size="sm" disabled={i === n - 1} aria-label={`Descendre ${x.label}`} onClick={() => act((d) => richListCont(d, k, 'down', x.id))}>↓</Btn>
        <Btn size="sm" kind="danger" aria-label={`Supprimer ${x.label}`} onClick={() => act((d) => richListCont(d, k, 'del', x.id), 'Supprimé.')}>✕</Btn>
      </div>
    </div>
  );
}
function RichAdd({ k, placeholder, extra }) {
  const { act } = useApp(); const [v, setV] = useState(''); const [c, setC] = useState('#8C9792');
  const add = () => { const r = act((d) => richListCont(d, k, 'add', null, { label: v, couleur: c, ...(extra || {}) }), 'Ajouté.'); if (r && r.ok) setV(''); };
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line pt-2">
      <ColorInp label="Couleur du nouvel élément" value={c} onChange={setC} />
      <input className="inp" style={{ flex: '1 1 220px', width: 'auto' }} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} placeholder={placeholder} aria-label={placeholder} />
      <Btn kind="primary" size="sm" onClick={add}>+ Ajouter</Btn>
    </div>
  );
}

function StadesEditor() {
  const { db, act } = useApp(); const L = stadeList(db);
  return (
    <div className="space-y-2">
      <p className="help">L’ordre de la liste suit la vinification : il sert au bouton « stade suivant » de la fiche lot et aux assemblages (un mélange prend le stade le moins avancé, ou « assemblé » si ce sont des vins). Le <b>rôle automatique</b> relie un stade aux opérations : débourbage → moût débourbé, ajout de levures → en FA, de bactéries → en FML, tirage → tiré…</p>
      {L.map((x, i) => (
        <RichRow key={x.id} k="stades" x={x} i={i} n={L.length}>{(ed) => (<>
          <input className="inp" style={{ width: 104 }} defaultValue={x.court || ''} key={`c${x.court}`} maxLength={14} aria-label={`Libellé court de ${x.label}`} title="Libellé court (plan, puces)" onBlur={(e) => { if (e.target.value.trim() !== (x.court || '')) ed({ court: e.target.value }); }} />
          <select className="inp" style={{ width: 'auto' }} value={x.phase || 'vin'} onChange={(e) => ed({ phase: e.target.value })} aria-label={`Phase de ${x.label}`} title="Phase">{STADE_PHASES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select className="inp" style={{ width: 'auto', maxWidth: 230 }} value={x.role || ''} onChange={(e) => ed({ role: e.target.value })} aria-label={`Rôle automatique de ${x.label}`} title="Rôle automatique">{STADE_ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <Check checked={!!x.masque} onChange={(v) => ed({ masque: v })} label="masqué" />
        </>)}</RichRow>))}
      <RichAdd k="stades" placeholder="Nouveau stade (ex. Sur lies, En barrique, Macération…)" />
      <Btn size="sm" onClick={() => act((d) => richListReset(d, 'stades'), 'Stades par défaut réajoutés.')}>Réajouter les stades par défaut manquants</Btn>
    </div>
  );
}

function CouleursEditor() {
  const { db, act } = useApp(); const L = couleurList(db);
  return (
    <div className="space-y-2">
      <p className="help">La couleur suit le lot dans toutes ses opérations. Couleur « d’assemblage » : celle obtenue quand on assemble des couleurs différentes (blanc + rouge = rosé d’assemblage, comme en Champagne).</p>
      {L.map((x, i) => (
        <RichRow key={x.id} k="couleursVin" x={x} i={i} n={L.length}>{(ed) => (<>
          <label className="flex items-center gap-1.5 text-sm"><input type="radio" name="coul-melange" checked={!!x.melange} onChange={() => ed({ melange: true })} style={{ accentColor: 'var(--accent)' }} />couleur d’assemblage</label>
          <Check checked={!!x.masque} onChange={(v) => ed({ masque: v })} label="masquée" />
        </>)}</RichRow>))}
      <RichAdd k="couleursVin" placeholder="Nouvelle couleur (ex. Gris, Orange / macéré…)" />
      <div className="flex flex-wrap items-center gap-2 pt-1"><span className="lbl mb-0">Couleur proposée par défaut aux moûts</span>
        <select className="inp" style={{ width: 'auto' }} value={couleurDefaut(db)} onChange={(e) => act((d) => { d.settings.couleurDefaut = e.target.value; return okr(); }, 'Couleur par défaut enregistrée.')} aria-label="Couleur par défaut des moûts">{L.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
        <Btn size="sm" onClick={() => act((d) => richListReset(d, 'couleursVin'), 'Couleurs par défaut réajoutées.')}>Réajouter blanc / rosé / rouge</Btn>
      </div>
    </div>
  );
}

// Échelle (classement) : préréglages régionaux, nom, niveaux du plus bas au plus haut
function EchellesEditor() {
  const { db, act, confirm } = useApp(); const L = echList(db); const [nom, setNom] = useState(ECH.nom);
  useEffect(() => { setNom(ECH.nom); }, [db.settings.echelleNom]);
  const preset = async (p) => {
    const lost = db.crus.filter((c) => c.echelle && !p.items.some((x) => x.id === c.echelle)).length;
    if (await confirm({ title: `Appliquer le préréglage « ${p.nom} » ?`, body: `Niveaux : ${p.items.map((x) => x.un).join(' < ')}.${lost ? ` ${lost} cru(s) rangé(s) dans un niveau qui disparaît deviendront « non classés » (à reclasser dans la liste des crus).` : ''}`, ok: 'Appliquer' })) act((d) => echellePreset(d, p.id), `Classement « ${p.titre} » appliqué.`);
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2"><span className="lbl mb-0">Préréglages</span>{ECHELLE_PRESETS.map((p) => <Btn key={p.id} size="sm" kind={db.settings.echellePreset === p.id ? 'primary' : undefined} onClick={() => preset(p)}>{p.nom}</Btn>)}</div>
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Nom affiché du classement"><input className="inp" style={{ width: 280 }} value={nom} onChange={(e) => setNom(e.target.value)} onBlur={() => { if (nom.trim() && nom.trim() !== ECH.nom) act((d) => { d.settings.echelleNom = nom.trim(); return okr(); }, 'Nom du classement enregistré.'); }} aria-label="Nom du classement" /></Field>
        <span className="help pb-2">ex. Échelle des crus, Hiérarchie des appellations, Classement…</span>
      </div>
      <p className="help">Du niveau le plus bas (en haut) au plus élevé (en bas). Un assemblage prend le niveau le plus bas des crus qui le composent ; chaque cru (village, lieu-dit, parcelle) est rangé dans un niveau.</p>
      {L.map((x, i) => (
        <RichRow key={x.id} k="echelles" x={x} i={i} n={L.length}>{(ed) => (<>
          <input className="inp" style={{ width: 160 }} defaultValue={x.un || ''} key={`u${x.un}`} aria-label={`Libellé au singulier de ${x.label}`} title="Au singulier (ex. Grand Cru)" placeholder="Singulier" onBlur={(e) => { if (e.target.value.trim() && e.target.value.trim() !== x.un) ed({ un: e.target.value }); }} />
          <input className="inp" style={{ width: 76 }} defaultValue={x.court || ''} key={`c${x.court}`} maxLength={6} aria-label={`Abréviation de ${x.label}`} title="Abréviation" onBlur={(e) => { if (e.target.value.trim() !== (x.court || '')) ed({ court: e.target.value.toUpperCase() }); }} />
          <span className="chip">rang {i + 1}</span>
        </>)}</RichRow>))}
      <RichAdd k="echelles" placeholder="Nouveau niveau (ex. Lieu-dit, Cru classé…)" />
    </div>
  );
}

// 0.45.0-alpha.1 : revendication bio — code d'agrément de l'organisme certificateur (affiché comme revendication partout) et nom de l'organisme
function QualifAgrement({ q }) {
  const { act, uid } = useApp(); const lect = useLectureSeule('params');
  const enr = (patch) => { const s = { codeAgrement: q.codeAgrement || '', organisme: q.organisme || '', ...patch }; if (codeAgrementNorm(s.codeAgrement) === (q.codeAgrement || '') && String(s.organisme).trim() === (q.organisme || '')) return; act((d) => qualifCodeAgrementSet(d, q.id, s, uid), 'Code d’agrément enregistré.'); };
  return (<div className="flex w-full flex-wrap items-end gap-2 pl-8" data-qualif-agrement={q.id}>
    <Field label="Code d’agrément de l’organisme certificateur" help={q.codeAgrement ? `Affiché comme revendication : ${q.codeAgrement} (reste du bio).` : `Vide : « ${q.label} » est affiché.`}>
      <input className="inp" style={{ width: 160 }} defaultValue={q.codeAgrement || ''} key={`a${q.codeAgrement || ''}`} placeholder="ex. FR-BIO-01" disabled={lect} aria-label={`Code d’agrément de ${q.label}`} translate="no"
        onBlur={(e) => enr({ codeAgrement: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} /></Field>
    <Field label="Organisme certificateur"><input className="inp" style={{ width: 200 }} defaultValue={q.organisme || ''} key={`o${q.organisme || ''}`} placeholder="ex. Ecocert" disabled={lect} aria-label={`Organisme certificateur de ${q.label}`} translate="no"
      onBlur={(e) => enr({ organisme: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }} /></Field>
  </div>);
}
// Revendications (0.18.0-alpha.1) : du rang le plus bas (en haut) au plus élevé ; un mélange prend la plus basse ; le rang 1 reste en tête
function QualifsEditor() {
  const { db, act, toast, confirm } = useApp(); const L = qualifList(db);
  const vide = { label: '', court: '', couleur: '#2F7D8C', after: '', copieDe: '' }; const [nv, setNv] = useState(vide);
  const apres = nv.after && L.some((x) => x.id === nv.after) ? nv.after : L[L.length - 1].id;
  const copie = nv.copieDe === '' ? apres : nv.copieDe; // par défaut : les règles de la revendication juste en dessous
  const nProd = (db.produits || []).filter((p) => p.categorie !== 'sec').length;
  const ed = (id, patch, msg) => act((d) => richListCont(d, 'qualifs', 'edit', id, patch), msg);
  const add = () => {
    const src = copie === 'aucune' ? null : copie; const nom = nv.label.trim();
    const r = act((d) => richListCont(d, 'qualifs', 'add', null, { label: nv.label, court: nv.court, couleur: nv.couleur, after: apres, copieDe: src }));
    if (r && r.ok) { toast(`Revendication « ${nom} » ajoutée${r.regles ? ` : règles des intrants reprises de « ${qLabel(src)} » (${r.regles})` : nProd ? ' : aucun intrant autorisé pour l’instant (Intrants › Produits & règles)' : ''}.`); setNv(vide); }
  };
  const del = async (x) => { if (await confirm({ title: `Supprimer la revendication « ${x.label} » ?`, body: 'Ses règles d’intrants sont supprimées avec elle.', ok: 'Supprimer', danger: true })) act((d) => richListCont(d, 'qualifs', 'del', x.id), 'Revendication supprimée.'); };
  return (
    <div className="space-y-2">
      <p className="help">Du rang le plus bas (en haut) au plus élevé (en bas) : un assemblage ou un mélange prend la revendication de <b>rang le plus bas</b> de ses composants, et un intrant non autorisé propose un déclassement vers un rang inférieur. Chaque revendication a ses propres règles d’intrants (Intrants › Produits &amp; règles). Une revendication déjà utilisée se renomme ou se masque (elle n’est plus proposée à la saisie) mais ne se supprime pas.</p>
      {L.map((x, i) => { const n = listUsage(db, 'qualifs', x.id); const conv = x.id === 'conv'; return (
        <div key={x.id} className={cx('flex flex-wrap items-center gap-2 rounded-md border border-line p-2', x.masque && 'opacity-60')} style={{ background: 'var(--surface)' }} data-qualif={x.id}>
          <ColorInp label={`Couleur de ${x.label}`} value={qColor(db, x.id)} onChange={(v) => ed(x.id, { couleur: v })} />
          <input className="inp" style={{ flex: '2 1 180px', width: 'auto', minWidth: 140 }} defaultValue={x.label} key={`l${x.label}`} aria-label={`Nom de la revendication ${x.label}`} onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== x.label) ed(x.id, { label: v }, 'Revendication renommée.'); else e.target.value = x.label; }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
          <input className="inp" style={{ width: 96 }} defaultValue={x.court || ''} key={`c${x.court}`} maxLength={8} aria-label={`Abréviation de ${x.label}`} title="Abréviation (plan de cave, rapports)" onBlur={(e) => { if (e.target.value.trim().toUpperCase() !== (x.court || '')) ed(x.id, { court: e.target.value }); }} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
          <span className="chip">rang {i + 1}</span>{n ? <Chip title="Lots, opérations, déclassements…">{n}×</Chip> : null}
          {conv ? <span className="text-xs text-ink2">reste au rang 1</span> : <Check checked={!!x.masque} onChange={(v) => ed(x.id, { masque: v }, v ? 'Revendication masquée : elle n’est plus proposée à la saisie.' : 'Revendication de nouveau proposée.')} label="masquée" />}
          <div className="ml-auto flex gap-1">
            <Btn size="sm" disabled={conv || i <= 1} aria-label={`Monter ${x.label}`} onClick={() => act((d) => richListCont(d, 'qualifs', 'up', x.id))}>↑</Btn>
            <Btn size="sm" disabled={conv || i === L.length - 1} aria-label={`Descendre ${x.label}`} onClick={() => act((d) => richListCont(d, 'qualifs', 'down', x.id))}>↓</Btn>
            <Btn size="sm" kind="danger" disabled={conv || n > 0} title={conv ? 'Rang 1 : se renomme mais ne se supprime pas' : n ? 'Utilisée : masquez-la plutôt' : 'Supprimer'} aria-label={`Supprimer ${x.label}`} onClick={() => del(x)}>✕</Btn>
          </div>
          {qualifEstBio(x) ? <QualifAgrement q={x} /> : null}
        </div>); })}
      <div className="rounded-md border border-dashed border-line p-3" data-qualif-ajout="">
        <div className="mb-2 text-sm font-semibold">Ajouter une revendication</div>
        <div className="flex flex-wrap items-end gap-2">
          <Group label="Couleur"><ColorInp label="Couleur de la nouvelle revendication" value={nv.couleur} onChange={(v) => setNv({ ...nv, couleur: v })} /></Group>
          <Field label="Nom" className="min-w-[200px] flex-1"><TI value={nv.label} onChange={(v) => setNv({ ...nv, label: v })} placeholder="ex. HVE, Conversion bio (C2), VDC…" onKeyDown={(e) => { if (e.key === 'Enter') add(); }} aria-label="Nom de la nouvelle revendication" /></Field>
          <Field label="Abréviation"><TI value={nv.court} onChange={(v) => setNv({ ...nv, court: v.toUpperCase() })} maxLength={8} placeholder={(nv.label.trim().slice(0, 4) || 'ABRÉV').toUpperCase()} style={{ width: 110 }} aria-label="Abréviation de la nouvelle revendication" /></Field>
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <Field label="Rang"><SI plain value={apres} onChange={(v) => setNv({ ...nv, after: v })} options={L.map((x, i) => ({ value: x.id, label: `rang ${i + 2} — ${i === L.length - 1 ? 'en dernier, ' : ''}juste après ${x.label}` }))} aria-label="Rang de la nouvelle revendication" /></Field>
          <Field label="Règles des intrants" className="min-w-[220px] flex-1"><SI plain value={copie} onChange={(v) => setNv({ ...nv, copieDe: v })} options={[...L.map((x) => ({ value: x.id, label: `Reprendre celles de ${x.label}` })), { value: 'aucune', label: 'Aucune (rien d’autorisé, à régler ensuite)' }]} aria-label="Règles des intrants de la nouvelle revendication" /></Field>
          <Btn kind="primary" onClick={add}>+ Ajouter</Btn>
        </div>
      </div>
      <Btn size="sm" onClick={() => act((d) => { const r = richListReset(d, 'qualifs'); syncConfig(d); return r; }, 'Revendications d’origine réajoutées (en fin de liste).')}>Réajouter Conventionnel, BIO et Demeter s’ils manquent</Btn>
    </div>
  );
}

function VinListesView() {
  return (
    <div className="mb-4 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,520px),1fr))' }}>
      <div className="card p-4"><h3 className="mb-2 text-lg font-semibold">Stades du vin</h3><StadesEditor /></div>
      <div className="min-w-0 space-y-4">
        <div className="card p-4"><h3 className="mb-2 text-lg font-semibold">Mélanges de stades</h3><StadesMelangesEditor /></div>
        <div className="card p-4"><h3 className="mb-2 text-lg font-semibold">Couleurs du vin</h3><CouleursEditor /></div>
      </div>
    </div>
  );
}
