/* ============ FORMULAIRE D'OPÉRATION (tous types) ============ */
const OP_HELP = {
  apport: 'Raisin réceptionné au pressoir : cépage, poids, apporteur, cru (village) et revendication.',
  entree_mout: 'Livraison de moûts (citerne) : pour chaque compartiment, cépage, fraction, cru, revendication et volume, répartis sur une ou plusieurs cuves — un lot de moût par cuve.',
  pressurage: '1 lot parent par pressée + des lots fractions (cuvée, tailles, rebêche).',
  debourbage: 'Moût clarifié transféré vers une cuve ; les bourbes sont enregistrées comme perte.',
  soutirage: 'Transfert hors des lies ; les lies sont enregistrées comme perte.',
  transfert: 'Transfert simple entre contenants, avec pertes éventuelles.',
  intrant: 'Ajout d’intrants sur une portion précise (levures, SO₂, pied de cuve…).',
  froid: 'Passage au froid : cuve, température et intrants éventuels.',
  filtration: 'Méthode libre ; auxiliaires avec numéro de lot fournisseur.',
  jaugeage: 'Corrige le volume réel d’une portion (écart tracé).',
  assemblage: 'Plusieurs portions → un nouveau lot ; revendication et classement = rang le plus bas ; couleur : blanc + rouge = rosé d’assemblage.',
  etape: 'Fait évoluer le stade du vin (fin de FA, FML terminée, vin clair…), et si besoin sa couleur ou sa nature (vin de réserve).',
  reprise: 'Stock initial : vin en contenant ou bouteilles sur lattes.',
  preparation: 'Levain, pied de cuve, liqueur de tirage ou d’expédition (qualifiés).',
  tirage: 'Mixtion sans cuve dédiée : vin de base + liqueur + levain + adjuvants + matières sèches.',
  degorgement: 'Sort les bouteilles du stock et crée un lot fini tracé.',
};
const G = ({ children, n = 2 }) => <div className={`grid${n}`}>{children}</div>;
// Stade et couleur du vin : lots créés par l'opération, ou stade du lot traité après l'opération
function VinFields({ type, f, upd, Rd }) {
  const { db } = useApp(); const v = vinChoix(type, f, db, Rd); const p = v.p;
  if (VIN_CREE.includes(type)) return (
    <Group label={type === 'entree_mout' ? 'Stade des moûts à la réception' : type === 'pressurage' ? 'Stade et couleur des moûts' : 'Stade et couleur du lot créé'}>
      <G>
        <Field label="Stade" help={!f.stadeManuel && type === 'assemblage' && p.stade ? `Proposé : ${p.whyStade || 'd’après les lots assemblés'} (règles modifiables dans Paramètres › Stades).` : undefined}><SI plain value={v.stade} onChange={(x) => upd({ stade: x, stadeManuel: true })} options={stadeOptions(db, v.stade)} aria-label="Stade du vin" /></Field>
        {type === 'entree_mout' ? <div className="help self-end">La couleur se choisit pour chaque moût reçu (ci-dessus).</div>
          : <Field label="Couleur du vin" help={p.why ? `Proposée : ${p.why}.` : type === 'pressurage' ? 'Blanc, y compris pour les raisins noirs pressés directement (blanc de noirs) ; rosé pour une saignée ou une macération.' : undefined}><SI plain value={v.couleur} onChange={(x) => upd({ couleur: x, couleurManuel: true })} options={couleurOptions(db, v.couleur)} aria-label="Couleur du vin" /></Field>}
      </G>
    </Group>);
  const lot = v.lot; if (!lot) return null;
  return (
    <Field label="Stade du lot après l’opération" help={!f.stadeManuel && p.stade ? `Proposé : ${stadeLabel(db, p.stade)} (${p.why}). Choisissez « Inchangé » si ce n’est pas le cas.` : `Actuellement : ${stadeLabel(db, lot.stade)} · ${couleurLabel(db, lot.couleur)}.`}>
      <SI plain value={v.stade || ''} onChange={(x) => upd({ stade: x, stadeManuel: true })} aria-label="Stade du lot après l’opération"
        options={[{ value: '', label: `Inchangé (${stadeLabel(db, lot.stade)})` }, ...stadeOptions(db, v.stade).filter((o) => o.value !== lot.stade)]} />
    </Field>);
}
const Eq = ({ db, value, onChange }) => (<Group label="Équipements utilisés"><div className="flex flex-wrap gap-x-4 gap-y-1">{db.lists.equipements.map((e) => <Check key={e.id} checked={(value || []).includes(e.id)} label={e.label} onChange={(c) => onChange(c ? [...(value || []), e.id] : value.filter((x) => x !== e.id))} />)}</div></Group>);
const LABELS_PREP = { levain: 'LEV', pied_mlf: 'PDC', liqueur_tirage: 'LT', liqueur_exp: 'LE' };
const nextPrepCode = (db, ptype, date) => { const n = db.ops.filter((o) => o.type === 'preparation' && o.ptype === ptype).length + 1; return `${LABELS_PREP[ptype]}-${pad(yearOf(date) % 100)}-${pad(n)}`; };
const nextFini = (db, date) => `LF-${pad(yearOf(date) % 100)}-${pad((db.lotsFinis || []).length + 1, 3)}`;

function SourcesEditor({ db, Rd, sources, onChange, label = 'Portions sources' }) {
  const upd = (i, patch) => onChange(sources.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const chosen = sources.map((s) => s.portionId);
  return (
    <div className="space-y-2">
      {sources.map((s, i) => (
        <div key={i} className="grid items-end gap-2" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) auto' }}>
          <Group label={i === 0 ? label : ' '}><SI value={s.portionId} onChange={(v) => upd(i, { portionId: v, volL: s.volL || (Rd.portions[v] ? String(r2(Rd.portions[v].vol)) : '') })} placeholder="Cuve · lot · volume…" options={portionOptions(db, Rd, (p) => p.id === s.portionId || !chosen.includes(p.id))} /></Group>
          <Group label={i === 0 ? 'Volume (hL)' : ' '}><div className="flex gap-1"><VI value={s.volL} onChange={(v) => upd(i, { volL: v })} placeholder="0" /><Btn size="sm" title="Prendre toute la portion" onClick={() => Rd.portions[s.portionId] && upd(i, { volL: String(r2(Rd.portions[s.portionId].vol)) })}>Tout</Btn></div></Group>
          <Btn kind="danger" size="sm" aria-label="Retirer" onClick={() => onChange(sources.filter((_, k) => k !== i))}>✕</Btn>
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3"><Btn size="sm" onClick={() => onChange([...sources, { portionId: '', volL: '' }])}>+ Ajouter une portion</Btn><span className="text-sm text-ink2">Total repris : <b className="num">{fmtL(sum(sources, (s) => s.volL))}</b></span></div>
    </div>
  );
}

/* Toute opération peut être soit validée (réalisée : stocks mis à jour), soit planifiée « à réaliser » (aucun effet sur les stocks),
   puis validée plus tard avec les valeurs réelles. prevId = opération à réaliser ouverte depuis la liste (fromPrev : ancien nom). */
// onglet Pressoir actif (0.25.0-alpha.2) : la pesée de vendange et le pressurage s'ouvrent dans ses formulaires (voir opViaPressoir)
function OpForm(props) {
  const { db } = useApp(); const via = opViaPressoir(db, props);
  if (via === 'pesee') return <PeseeOpForm id={props.editId || null} onClose={props.onClose} />;
  if (via === 'marc') return <MarcForm id={props.editId || null} preset={props.preset} onClose={props.onClose} />;
  return <OpFormSaisie {...props} />;
}
function OpFormSaisie({ type: t0, editId, preset, onClose, prevId: prevId0, fromPrev }) {
  const { db, R, act, toast, confirm, defaultDate, openFiche, moi, uid, secu, openSchema } = useApp();
  const prevId = prevId0 || fromPrev || null; const plan0 = prevId ? (db.previsions || []).find((p) => p.id === prevId) : null;
  const old = editId ? db.ops.find((o) => o.id === editId) : null;
  // t0 peut être une variante du catalogue (collage, levurage…) : le formulaire et le moteur suivent son comportement (base)
  const t1 = old ? old.type : t0; const cat = opDef(db, old ? (old.sousType || old.type) : ((preset && preset.sousType) || t0)) || opDef(db, t1) || { id: t1, base: t1, label: OP_LABELS[t1] };
  const type = old ? old.type : cat.base; const sousType = old ? (old.sousType || '') : (cat.id !== cat.base ? cat.id : '');
  // formulaire personnalisé (Paramètres › Opérations › Formulaire) : champs réglés et champs personnalisés
  const fcfg = formulaireDe(db, cat.id); const persoD = fcfg.perso.filter((p) => p.position === 'debut'); const persoF = fcfg.perso.filter((p) => p.position !== 'debut');
  const [f, set, setF] = useDraft(() => {
    const s = opInit(type, old, db, defaultDate); s.sousType = sousType;
    if (!old && cat.motif && ['intrant', 'suivi', 'sortie'].includes(type)) s.motif = cat.motif;
    if (!old && type === 'etape' && cat.stadeAuto && cat.stadeAuto.actif && stadeDef(db, cat.stadeAuto.stade)) s.newStade = cat.stadeAuto.stade;
    if (!old && type === 'etape' && cat.nature) s.newType = cat.nature;
    if (!old && preset) Object.assign(s, preset);
    // étape d'un schéma (0.31.0-alpha.1) : la portion prévue a pu changer depuis (débourbage, soutirage) → portion actuelle du lot
    if (!old && plan0 && plan0.schema && s.portionId !== undefined) { const Rp = getR(db, s.date || defaultDate); if (!Rp.portions[s.portionId]) { const pp = Object.values(Rp.portions).filter((x) => x.lotId === plan0.schema.lotId && x.vol > 0.5).sort((a, b) => b.vol - a.vol)[0]; if (pp) s.portionId = pp.id; } }
    if (!old && !prevId) formulaireDefauts(db, cat.id, type, s, preset || {}); // valeurs par défaut réglées pour ce formulaire
    if (!old && !(Array.isArray(s.operateurs) && s.operateurs.length) && moi) s.operateurs = [moi]; // opérateur de cet appareil, sauf opérateurs déjà prévus
    if (!old && !(preset && preset.code)) {
      if (type === 'entree_mout') s.code = nextCode(db, 'M', s.date); if (type === 'pressurage') s.code = nextCode(db, 'P', s.date); if (type === 'assemblage') s.code = nextCode(db, 'AS', s.date); if (type === 'tirage') s.code = nextCode(db, 'T', s.date);
      if (type === 'degorgement') s.code = nextFini(db, s.date); if (type === 'preparation') s.code = nextPrepCode(db, s.ptype, s.date);
    }
    return s;
  });
  const Rd = useRd(db, f.date, editId);
  const [fracEd, setFracEd] = useState(false);
  const [ongletMout, setOngletMout] = useState(''); const [bulBusy, setBulBusy] = useState(''); const [bulGuides, setBulGuides] = useState([]); // entrée de moûts : onglet partenaire affiché, lecture d'un bulletin (0.34.0-alpha.1)
  const [tout, setTout] = useState(false); const [cfgEd, setCfgEd] = useState(false); // afficher les champs masqués ; éditeur du formulaire
  const cfgv = { cfg: fcfg, type, tout };
  const nMasques = champsStd(type).filter((c) => champEffectif(fcfg, type, c.k).vis === 'masque').length;
  const nvLigne = () => ligneDefauts(db, cat.id, moutLine(db, ''));
  // documents joints dès la saisie (nouvelle opération) : rattachés à l'enregistrement validé ou planifié, effacés si le formulaire est abandonné
  const [pieces, setPieces] = useState([]); const piecesRef = useRef(pieces); piecesRef.current = pieces; const engage = useRef(false);
  useEffect(() => () => { if (!engage.current) piecesRef.current.forEach((x) => { docDel(x.id).catch(() => { /* déjà absent */ }); }); }, []);
  const nDocs = () => (piecesRef.current.length ? ` ${piecesRef.current.length > 1 ? `${piecesRef.current.length} documents joints` : '1 document joint'}.` : '');
  const built = useMemo(() => buildSpec(type, f, db, Rd, old), [f, db, Rd]);
  // aperçu (copie de la base + rejeu complet) : 0.38.0-alpha.3, recalculé 250 ms après la dernière frappe, plus à chaque caractère ;
  // à la validation, il est recalculé tout de suite s'il est en retard (un dépassement de plafond n'est jamais manqué)
  const [builtPv, setBuiltPv] = useState(built);
  useEffect(() => { if (builtPv === built) return undefined; const t = setTimeout(() => setBuiltPv(built), 250); return () => clearTimeout(t); }, [built]);
  const pv = useMemo(() => (builtPv.spec ? previewOp(db, builtPv.spec, editId) : null), [builtPv, db, editId]);
  const pvAJour = () => (builtPv === built ? pv : built.spec ? previewOp(db, built.spec, editId) : null);
  // dépassement d'un plafond (dose, dose cumulée, SO₂ total estimé) : avertir et exiger le motif, tracé avec l'opération (0.30.0-alpha.1)
  const [motifDep, setMotifDep] = useState(() => (old && old.depassement && old.depassement.motif) || ''); const deps = (pv && pv.ok && pv.depassements) || [];
  const upd = (patch) => setF((x) => ({ ...x, ...patch }));
  // mesures de jaugeage (📏) gardées avec l'opération, une par champ de volume (0.17.0-alpha.1)
  const jauger = (champ) => (r) => setF((x) => ({ ...x, jauges: [...(x.jauges || []).filter((j) => j.champ !== champ), { champ, contenantId: r.contenantId, baremeId: r.baremeId, mesure: r.mesure, avant: r.avant, apres: r.apres, volL: Math.round(r.volL) }] }));
  const volDans = (cid) => sum(Object.values(Rd.portions).filter((x) => x.contenantId === cid), (x) => x.vol);
  const pOf = (id) => Rd.portions[id];
  const lotQ = (id) => { const p = pOf(id); return p ? (Rd.lots[p.lotId] || {}).qualif : null; };
  const isTransfer = ['debourbage', 'soutirage', 'transfert'].includes(type);
  const portionPick = (pid) => { const p = pOf(pid); upd({ portionId: pid, ...(isTransfer && !f.volL && p ? { volL: String(r2(p.vol)) } : {}) }); };
  // « Planifier » : enregistrée même incomplète, sans effet sur les stocks, dans la liste « À réaliser »
  const planifier = () => {
    if (!isoOK(f.date)) { toast('Choisissez la date prévue.', 'bad'); return; }
    let resume = ''; try { resume = built.spec ? opSummary(db, Rd, built.spec) : ''; } catch (e) { resume = ''; }
    const r = act((d) => { const r1 = previsionSave(d, { type, date: f.date, f, resume: resume || `${cat.label || OP_LABELS[type]} (à compléter : ${built.error || ''})` }, prevId); if (r1 && r1.ok && !prevId) docsJoindre(d, piecesRef.current, { type: 'prev', id: r1.id }); return r1; },
      prevId ? 'Opération à réaliser mise à jour.' : `Opération planifiée pour le ${fmtDate(f.date)} : elle attend dans « À réaliser ».${nDocs()}`);
    if (r && r.ok) { engage.current = true; onClose(); }
  };
  // « Valider » : l'opération est réalisée, les stocks sont mis à jour
  const valider = () => {
    if (built.error) { toast(built.error, 'bad'); return; }
    if (!old && champEffectif(fcfg, type, 'docs').obligatoire && !piecesRef.current.length && !(prevId && docsOf(db, 'prev', prevId).length)) { toast(`Joignez au moins un document : « ${champEffectif(fcfg, type, 'docs').libelle || 'Documents joints'} » est obligatoire pour cette opération.`, 'bad'); return; }
    const pvV = pvAJour(); const depsV = (pvV && pvV.ok && pvV.depassements) || []; if (pvV !== pv) setBuiltPv(built);
    if (depsV.length && !String(motifDep || '').trim()) { toast('Dépassement d’un plafond : indiquez le motif (il est tracé avec l’opération).', 'bad'); return; }
    const spec00 = plan0 && plan0.groupe && !old ? { ...built.spec, groupe: plan0.groupe } : built.spec; // validée seule, une opération d'un groupe planifié y reste (0.29.0-alpha.1)
    const spec0 = plan0 && plan0.schema && !old ? { ...spec00, schema: plan0.schema } : spec00; // étape d'un schéma de vinification (0.31.0-alpha.1)
    const spec = depsV.length ? { ...spec0, depassement: depassementSpec(depsV, motifDep, uid) } : old && old.depassement ? { ...spec0, depassement: null } : spec0;
    const r = act((d) => { const r1 = opSave(d, spec, editId, { motif: f.motifRegistre, par: uid, maintenant: new Date().toISOString() }); if (r1 && r1.ok && prevId) previsionStatut(d, prevId, 'realisee', r1.op.id); if (r1 && r1.ok && !old) docsJoindre(d, piecesRef.current, { type: 'op', id: r1.op.id }); return r1; });
    if (r && r.ok) { engage.current = true; toast(`${pvV && (pvV.warnings.length || pvV.alerts.length) ? 'Opération validée — des avertissements sont à vérifier dans le journal.' : prevId ? 'Opération validée : retirée de la liste « À réaliser ».' : old ? 'Opération modifiée.' : 'Opération validée.'}${old ? '' : nDocs()}`); onClose();
      if (!old && ['pressurage', 'entree_mout'].includes(type) && r.op && schemasReglage(db).proposer && lotsCreesPar(r.op).length && openSchema) openSchema({ opId: r.op.id, auto: true }); } // schéma de vinification proposé (0.31.0-alpha.1)
  };
  const sourcesQ = (srcs, preps) => { const qs = [...srcs.map((s) => lotQ(s.portionId)), ...(preps || []).map((u) => (Rd.preps[u.prepId] || {}).qualif)].filter(Boolean); return qs.length ? minQualif(qs) : 'conv'; };
  const mixed = (srcs, preps) => { const qs = uniq([...srcs.map((s) => lotQ(s.portionId)), ...(preps || []).map((u) => (Rd.preps[u.prepId] || {}).qualif)].filter(Boolean)); return qs.length > 1 ? qs : null; };

  /* ----- pressurage : apports pressés ----- */
  const peseeNo = (id) => { const a = db.ops.find((o) => o.id === id); return a && a.pesee && a.pesee.num ? `Pesée n° ${a.pesee.num}${a.pesee.heure ? ` (${a.pesee.heure})` : ''} · ` : ''; }; // registre des pesées (onglet Pressoir)
  const apOpts = (cur) => Object.values(Rd.raisins).filter((r) => r.kg - r.used > 0.5 || r.id === cur).map((r) => ({ value: r.id, label: `${peseeNo(r.id)}${fmtDate(r.date)} · ${lbl(db, 'cepages', r.cepageId)} · ${r.cruId ? cruName(db, r.cruId) : 'cru ?'}${r.apporteurId ? ` · ${apporteurName(db, r.apporteurId)}` : ''} · ${qDef(r.qualifId).court} · reste ${fmt(r.kg - r.used)} kg` }));
  const setCharges = (charges) => { const qs = charges.map((c) => (Rd.raisins[c.apportId] || {}).qualifId).filter(Boolean); const first = Rd.raisins[(charges[0] || {}).apportId]; setF((x) => ({ ...x, charges, qualifId: qs.length ? minQualif(qs) : x.qualifId, designation: x.designation || (first ? `${lbl(db, 'cepages', first.cepageId)} ${yearOf(x.date)} – pressée` : '') })); };
  const totKg = sum(f.charges || [], (c) => c.kg); const totVol = type === 'pressurage' ? sum(Object.values(f.frac || {}), (x) => x.volL) : 0;

  const echOf = (items) => { const e = {}; items.forEach((x) => { const k = cruEchelle(db, x.cruId) || 'inconnu'; e[k] = (e[k] || 0) + num(x.w); }); const t = sum(Object.values(e)); if (t > 0) Object.keys(e).forEach((k) => { e[k] /= t; }); return t > 0 ? echelleInfo({ echelles: e }) : null; };
  const srcEch = (srcs) => { const parts = srcs.filter((s) => s.portionId && num(s.volL) > 0 && pOf(s.portionId)).map((s) => ({ comp: composition(db, Rd, pOf(s.portionId).lotId), w: num(s.volL) })); return parts.length ? echelleInfo(mixComp(parts)) : null; };
  const EchNote = ({ info, what }) => (info ? <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-ink2">{ECH.nom} {what} :</span><EChip info={info} />{info.partiel ? <span className="text-xs text-ink2">(* part d’origine non renseignée : {pct(info.inconnu)})</span> : null}</div> : null);
  const lignesProps = { db, Rd, onChange: (l) => upd({ lignes: l }), lignes: f.lignes };
  const body = () => {
    switch (type) {
      case 'apport': return (<>
        {old && old.pesee && old.pesee.num ? <Notice tone="info" title={`Registre des pesées : pesée n° ${old.pesee.num}${old.pesee.valide ? ', validée' : ''}`}>Brut, tare, caisses, état sanitaire et bon de pesée : onglet Pressoir › Pesées.</Notice> : null}
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="cepageId" label="Cépage"><SI value={f.cepageId} onChange={(v) => upd({ cepageId: v })} options={opts(db, 'cepages')} /></CF></G>
        {pressoirParams(db).registre || (old && old.pesee) ? <div style={{ maxWidth: 220 }}><Field label="Heure de la pesée (registre)"><input className="inp num" type="time" value={f.heurePesee || ''} onChange={(e) => upd({ heurePesee: e.target.value })} aria-label="Heure de la pesée" /></Field></div> : null}
        <G><CF k="kg" label="Poids reçu (kg)"><NI value={f.kg} onChange={(v) => upd({ kg: v })} placeholder="ex. 4000" /></CF><CF k="qualifId" label="Revendication du raisin"><SI value={f.qualifId} onChange={(v) => upd({ qualifId: v })} options={qualifOptions(db, f.qualifId)} /></CF></G>
        <CF k="parcelleId" label="Parcelle (facultatif)" help="Choisir la parcelle renseigne le cru, et le cépage et l’apporteur s’ils sont connus. Liste : Paramètres › Crus & parcelles."><ParcelleSelect value={f.parcelleId} preset={{ cruId: f.cruId, cepageId: f.cepageId, apporteurId: f.apporteurId }} onChange={(v) => { const pc = (db.parcelles || []).find((x) => x.id === v); upd({ parcelleId: v, ...(pc ? { cruId: pc.cruId, ...(pc.cepageId ? { cepageId: pc.cepageId } : {}), ...(pc.apporteurId ? { apporteurId: pc.apporteurId } : {}) } : {}) }); }} /></CF>
        <G><CF k="apporteurId" label="Partenaire (apporteur)" help="Viticulteur, coopérative ou négoce qui livre ; ses crus par défaut sont proposés. « + » pour en créer un."><ApporteurSelect value={f.apporteurId} role="apporteur" onChange={(v) => upd({ apporteurId: v, ...(v && !f.cruId && apporteurCruAuto(db, v) ? { cruId: apporteurCruAuto(db, v) } : {}) })} /></CF><CF k="cruId" label="Cru (village) de la parcelle" help="Liste modifiable (Paramètres › Crus). « + » pour ajouter un cru personnalisé."><CruSelect value={f.cruId} onChange={(v) => upd({ cruId: v, ...(f.parcelleId && ((db.parcelles || []).find((x) => x.id === f.parcelleId) || {}).cruId !== v ? { parcelleId: '' } : {}) })} /><CrusProposes ids={[f.apporteurId]} cruId={f.cruId} onPick={(c) => upd({ cruId: c })} /></CF></G>
        <G><CF k="ref" label="N° de bon de pesée / DAE (facultatif)"><TI value={f.ref} onChange={(v) => upd({ ref: v })} /></CF><Group label={`${ECH.nom} déduite du cru`}><div className="pt-1.5">{f.cruId ? <EChip id={cruEchelle(db, f.cruId)} /> : <span className="text-sm text-ink2">Choisissez un cru pour déterminer l’échelle.</span>}</div></Group></G>
        {!f.apporteurId || !f.cruId ? <Notice tone="info">Renseignez le partenaire et le cru : ils alimentent la composition par cru des lots et les recherches de traçabilité.</Notice> : null}
      </>);
      case 'entree_mout': {
        const plan = moutPlan(db, f); const totV = sum(f.entrees, (e) => sum(e.dests, (d) => d.volL));
        const setE = (i, patch) => upd({ entrees: f.entrees.map((e, k) => (k === i ? { ...e, ...patch } : e)) });
        const setD = (i, j, patch) => setE(i, { dests: f.entrees[i].dests.map((d, k) => (k === j ? { ...d, ...patch } : d)) });
        const setCode = (cid, patch) => upd({ lotCodes: { ...(f.lotCodes || {}), [cid]: { ...((f.lotCodes || {})[cid] || {}), ...patch } } });
        const inTank = (cid) => sum(Object.values(Rd.portions).filter((p) => p.contenantId === cid), (p) => p.vol);
        const fracOpts = fracList(db).map((x) => ({ value: x.id, label: x.label })).concat([...new Set(f.entrees.map((e) => e.fractionId))].filter((x) => x && !fracDef(db, x)).map((x) => ({ value: x, label: `(${x})` })));
        const mod = moutModeleImpose(db); // analyses imposées : « Moût · Débourbage » (0.34.0-alpha.1)
        // onglets partenaires (0.34.0-alpha.1) : le premier garde ses valeurs dans f.apporteurId / f.ref (lus par l'import de traçabilité et les versions antérieures)
        const P = moutOnglets(f); const actif = P.some((p) => p.id === ongletMout) ? ongletMout : P[0].id; const kA = P.findIndex((p) => p.id === actif); const tabA = { ...P[kA], ...(kA === 0 ? { apporteurId: f.apporteurId || '', ref: f.ref || '' } : {}) };
        const ongletVal = (p, k) => (k === 0 ? { ...p, apporteurId: f.apporteurId || '', ref: f.ref || '' } : p);
        const lignesDe = (pid) => f.entrees.map((e, i) => ({ e, i })).filter((x) => moutOngletDe(P, x.e) === pid);
        const setTab = (pid, patch) => setF((x) => { const L = moutOnglets(x); const k = L.findIndex((p) => p.id === pid); const nv = L.map((p, j) => (j === k ? { ...p, ...patch } : p));
          return { ...x, partenaires: nv.map((p) => ({ id: p.id, apporteurId: p.apporteurId || '', ref: p.ref || '' })), ...(k === 0 ? { ...('apporteurId' in patch ? { apporteurId: patch.apporteurId } : {}), ...('ref' in patch ? { ref: patch.ref } : {}) } : {}) }; });
        // partenaire d'un onglet : donné aux moûts de l'onglet qui n'en ont pas (ou qui avaient l'ancien), avec son cru par défaut si la case est vide
        const setPartenaire = (pid, v) => { const avant = (ongletVal(P.find((p) => p.id === pid) || {}, P.findIndex((p) => p.id === pid)) || {}).apporteurId;
          setTab(pid, { apporteurId: v }); setF((x) => ({ ...x, entrees: x.entrees.map((e) => { if (moutOngletDe(moutOnglets(x), e) !== pid || !v) return e; const L = e.apporteurs || []; if (L.length && !(L.length === 1 && L[0].id === avant)) return e; return { ...e, apporteurs: [{ id: v, pct: '' }], ...(!e.cruId && apporteurCruAuto(db, v) ? { cruId: apporteurCruAuto(db, v) } : {}) }; }) })); };
        const ajouterOnglet = () => { const id = `pa${Date.now().toString(36)}${P.length + 1}`; setF((x) => ({ ...x, partenaires: [...moutOnglets(x).map((p) => ({ id: p.id, apporteurId: p.apporteurId || '', ref: p.ref || '' })), { id, apporteurId: '', ref: '' }], entrees: [...x.entrees.map((e) => (e.partId ? e : { ...e, partId: moutOnglets(x)[0].id })), { ...nvLigne(), partId: id }] })); setOngletMout(id); };
        const retirerOnglet = async (pid) => {
          const L = lignesDe(pid); const plein = L.some((x) => sum(x.e.dests, (d) => d.volL) > 0);
          if (plein && !(await confirm({ title: 'Retirer ce partenaire ?', body: `Ses ${L.length} moût(s) seront retirés de cette entrée.`, ok: 'Retirer', danger: true }))) return;
          const reste = P.filter((p) => p.id !== pid); const prem = ongletVal(reste[0], P.indexOf(reste[0]));
          setF((x) => { const ent = x.entrees.filter((e) => moutOngletDe(moutOnglets(x), e) !== pid); return { ...x, partenaires: reste.map((p, k) => (k === 0 ? { id: p.id, apporteurId: prem.apporteurId || '', ref: prem.ref || '' } : { id: p.id, apporteurId: p.apporteurId || '', ref: p.ref || '' })), apporteurId: prem.apporteurId || '', ref: prem.ref || '', entrees: ent.length ? ent : [{ ...nvLigne(), partId: reste[0].id }] }; });
          setPieces((L0) => L0.map((d) => (d.partId === pid ? { ...d, partId: '' } : d))); setOngletMout(reste[0].id);
        };
        const prefixeLot = (ref) => (String(ref || '').trim() ? String(ref).trim().toUpperCase().replace(/\s+/g, '') : `EM${String(f.date || todayISO()).slice(2).replace(/-/g, '')}`);
        const numeroter = () => { const cpt = {}; upd({ entrees: f.entrees.map((e) => { const pid = moutOngletDe(P, e); cpt[pid] = (cpt[pid] || 0) + 1; if (String(e.numLot || '').trim()) return e; const t = ongletVal(P.find((p) => p.id === pid), P.findIndex((p) => p.id === pid)); return { ...e, numLot: `${prefixeLot(t.ref || (P.length > 1 ? '' : f.ref))}${P.length > 1 && !String(t.ref || '').trim() ? `-P${P.findIndex((p) => p.id === pid) + 1}` : ''}-${cpt[pid]}` }; }) }); };
        // bulletin d'analyses (0.37.0-alpha.1) : déposé dans l'onglet d'un partenaire (ses moûts) ou pour toute l'entrée (tous les moûts) ;
        // chaque échantillon est rapproché d'un moût (n° de lot, compartiment, mêmes nombres) ; s'il reste un doute, affectation guidée
        const moutsPour = (pid) => (pid ? lignesDe(pid) : f.entrees.map((e, i) => ({ e, i }))).map((x) => { const t = moutOngletDe(P, x.e); const k = P.findIndex((p) => p.id === t); const ap = ongletVal(P[k], k).apporteurId;
          return { i: x.i, numLot: x.e.numLot, compartiment: x.e.compartiment, partId: t, onglet: k + 1, partenaire: ap ? apporteurName(db, ap) : '', n: lignesDe(t).findIndex((y) => y.i === x.i) + 1 }; });
        const reporter = (aff) => setF((x) => ({ ...x, entrees: x.entrees.map((e, k) => { const L = (aff || []).filter((y) => y.i === k); if (!L.length) return e; const an = { ...(e.analyses || {}) }; L.forEach((a) => Object.keys(a.valeurs).forEach((pp) => { an[pp] = String(a.valeurs[pp]).replace('.', ','); })); return { ...e, analyses: an }; }) }));
        const lireBulletin = async (files, pid) => {
          const M = moutsPour(pid); const plusieurs = !pid && P.length > 1;
          for (const file of files) {
            setBulBusy(`« ${file.name} » : lecture…`);
            try {
              const lu = await bulletinLireAnalyser(db, R, file, { candidats: [], onEtape: (t) => setBulBusy(`« ${file.name} » : ${t}`) }); const res = lu.res; const aff = bulletinPourMouts(res, M);
              const nE = bulletinEchantillonsValeurs(res).length; const parts = uniq(aff.map((a) => (M.find((m) => m.i === a.i) || {}).partId));
              const id = newDocId(); await docPut(id, file); const meta = { id, nom: gardeNomPropre(file.name), mime: file.type, taille: file.size, cat: 'analyse', date: todayISO(), garde: gardeResume(GARDE_VERDICTS.get(file)), partId: pid || (P.length === 1 || parts.length === 1 ? parts[0] || P[0].id : '') };
              if (old) act((d) => docMetaAdd(d, { ...meta, cible: { type: 'op', id: old.id } })); else setPieces((X) => [...X, meta]);
              if (nE && bulletinAffectationDouteuse(res, aff, plusieurs)) { setBulGuides((G) => [...G, { cle: id, nom: file.name, res, aff, mouts: M, ia: lu.ia }]); continue; }
              if (aff.length) reporter(aff);
              toast(aff.length ? `Bulletin « ${file.name} » : analyses reportées sur ${aff.length} moût(s).` : `Bulletin « ${file.name} » joint : aucune valeur reconnue, saisissez les analyses.`, aff.length ? 'ok' : 'warn');
            } catch (er) { toast(lectureEchec(file, er), 'bad'); }
          }
          setBulBusy('');
        };
        const nTab = (pid) => lignesDe(pid).length; const LA = lignesDe(actif);
        return (<>
          <TraceImport type="entree_mout" f={f} setF={setF} />
          <G n={3}><CF k="date" label="Date de réception"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="immat" label="Immatriculation de la citerne (facultatif)" help={(() => { const L = f.immat ? baremesCiterne(db, f.immat) : []; if (!L.length) return immatNorm(f.immat).length >= 6 ? <span data-citerne-inconnue="">📏 Importez son certificat de jaugeage (Paramètres › Barèmes de jaugeage) pour saisir le creux de chaque compartiment.</span> : ''; const val = L.map((b) => (b.meta || {}).validite).filter(Boolean).sort()[0]; return <span data-citerne-connue="">📏 Certificat de jaugeage : {L.length} compartiment{L.length > 1 ? 's' : ''}{val ? (val < todayISO() ? <b className="text-bad"> · expiré le {fmtDate(val)}</b> : ` · valable jusqu’au ${fmtDate(val)}`) : ''}</span>; })()}><TI value={f.immat} onChange={(v) => upd({ immat: v.toUpperCase() })} placeholder="ex. AB-123-CD" /></CF><CF k="millesime" label="Millésime (par défaut)" help="Modifiable pour chaque moût."><TI value={f.millesime} onChange={(v) => upd({ millesime: v })} placeholder={String(yearOf(f.date))} /></CF></G>
          <div className="flex flex-wrap items-end gap-3"><div className="help" data-analyse-imposee="">🔬 Analyses des lots reçus : <b>{mod.nom}{mod.etape ? ` · ${mod.etape}` : ''}</b> ({mod.paramIds.map((x) => paramDe(db, x).nom).join(', ')})</div>
            {cfVisible(cfgv, 'e.numLot') ? <Btn size="sm" onClick={numeroter} title="Donne un n° de lot à chaque compartiment qui n’en a pas (n° de bon ou date)">№ Numéroter les lots</Btn> : null}</div>
          <div data-bulletin-entree=""><ZoneDepot onFiles={(fs) => lireBulletin(fs, '')} accept={BULLETIN_ACCEPT} garde="bulletin" icon="🧪" busy={!!bulBusy} label="Glisser ici le bulletin d’analyses des moûts" sub={bulBusy || `PDF, scan, tableur ou CSV du laboratoire, même avec plusieurs échantillons : chaque échantillon est reporté sur son moût${P.length > 1 ? ' (tous les partenaires)' : ''}`} inputLabel="Bulletin d’analyses de l’entrée de moûts" /></div>
          {bulGuides.length ? <BulletinMoutsGuide g={bulGuides[0]} reste={bulGuides.length - 1} onAnnuler={() => setBulGuides((G) => G.slice(1))} onValider={(aff) => { reporter(aff); toast(`Bulletin « ${bulGuides[0].nom} » : analyses reportées sur ${uniq(aff.map((a) => a.i)).length} moût(s).`); setBulGuides((G) => G.slice(1)); }} /> : null}
          <Group label={`Partenaires de la citerne (${P.length})`} help={<span>Un onglet par partenaire, avec son n° de bon / DAE, ses moûts et ses documents. Total reçu : <b className="num">{fmtL(totV)}</b>. <button type="button" className="linkish" onClick={() => setFracEd(true)}>Personnaliser les fractions</button></span>}>
            <div className="mb-2 flex flex-wrap items-center gap-1" role="tablist" aria-label="Partenaires de la citerne" data-onglets-partenaires="">
              {P.map((p0, k) => { const p = ongletVal(p0, k); return <button key={p.id} type="button" role="tab" aria-selected={p.id === actif} className={cx('opr-tog', p.id === actif && 'on')} data-onglet-partenaire={k + 1} onClick={() => setOngletMout(p.id)}>
                <span translate={p.apporteurId ? 'no' : undefined}>{p.apporteurId ? apporteurName(db, p.apporteurId) : `Partenaire n° ${k + 1}`}</span>{p.ref ? <span className="text-ink2" translate="no"> · {p.ref}</span> : null} <span className="chip">{nTab(p.id)}</span></button>; })}
              <Btn size="sm" onClick={ajouterOnglet} data-ajouter-partenaire="">+ Partenaire</Btn>
            </div>
            <div role="tabpanel" className="space-y-3 rounded-md border border-line p-3" data-onglet-actif={kA + 1}>
              <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))' }}>
                <CF k="apporteurId" label="Partenaire" help="Viticulteur, coopérative ou négoce ; donné à chaque moût de l’onglet qui n’en a pas."><ApporteurSelect value={tabA.apporteurId} role="apporteur" onChange={(v) => setPartenaire(actif, v)} ariaLabel={`Partenaire ${kA + 1}`} /></CF>
                <CF k="ref" label="N° de bon / DAE (facultatif)"><TI value={tabA.ref} onChange={(v) => setTab(actif, { ref: v })} aria-label={`N° de bon / DAE du partenaire ${kA + 1}`} /></CF>
              </div>
              <details className="rounded-md border border-line px-2 py-1.5" open={(old ? docsOf(db, 'op', old.id) : pieces).some((d) => d.partId === actif) || undefined} data-docs-partenaire={kA + 1}>
                <summary className="cursor-pointer text-sm"><b>📎 Documents et bulletins d’analyses de ce partenaire</b> <span className="text-ink2">({(old ? docsOf(db, 'op', old.id) : pieces).filter((d) => d.partId === actif).length})</span></summary>
                <div className="mt-2 space-y-2">
                  <ZoneDepot onFiles={(fs) => lireBulletin(fs, actif)} accept={BULLETIN_ACCEPT} garde="bulletin" icon="🧪" busy={!!bulBusy} label="Importer un bulletin d’analyses" sub={bulBusy || 'Lu et reporté sur les moûts de ce partenaire (n° de lot, compartiment), puis joint à l’onglet'} inputLabel={`Bulletin d’analyses du partenaire ${kA + 1}`} />
                  {old ? <DocsPanel cible={{ type: 'op', id: old.id }} kind="op" locked={isLocked(db, old.date)} filtre={(d) => d.partId === actif} extra={{ partId: actif }} inputLabel={`Documents du partenaire ${kA + 1}`} catDefaut="bon" key={actif} /> : <DocsAttente items={pieces} onChange={setPieces} filtre={(d) => d.partId === actif} extra={{ partId: actif }} inputLabel={`Documents du partenaire ${kA + 1}`} catDefaut="bon" key={actif} />}
                </div>
              </details>
              <div className="space-y-3">{LA.map(({ e, i }, k) => (
              <div key={i} className="rounded-md border border-line p-3" style={{ background: 'var(--surface2)' }} data-mout={i + 1}>
                <div className="mb-2 flex flex-wrap items-center gap-2"><span className="chip chip-info">Moût {k + 1}{e.numLot ? ` · lot ${e.numLot}` : ''}{e.compartiment ? ` · ${e.compartiment}` : ''}</span><span className="num text-sm">{fmtL(sum(e.dests, (d) => d.volL))}</span>
                  <span className="ml-auto flex gap-1"><Btn size="sm" onClick={() => upd({ entrees: [...f.entrees.slice(0, i + 1), { ...e, compartiment: '', numLot: '', dests: e.dests.map((d) => ({ ...d, volL: '', hauteur: '' })) }, ...f.entrees.slice(i + 1)] })} title="Copier cépage, fraction, cru, revendication et cuves">Dupliquer</Btn><Btn size="sm" kind="danger" aria-label={`Retirer le moût ${i + 1}`} onClick={() => upd({ entrees: f.entrees.length > 1 && LA.length > 1 ? f.entrees.filter((_, x) => x !== i) : f.entrees.map((y, x) => (x === i ? { ...nvLigne(), partId: actif } : y)) })}>✕</Btn></span></div>
                <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
                  <CF k="e.numLot" label="N° de lot"><TI value={e.numLot || ''} onChange={(v) => setE(i, { numLot: v })} placeholder="ex. EM-261005-1" aria-label={`N° de lot du moût ${i + 1}`} /></CF>
                  <CF k="e.compartiment" label="Compartiment"><TI value={e.compartiment} onChange={(v) => setE(i, { compartiment: v })} placeholder="ex. C1 (facultatif)" aria-label={`Compartiment du moût ${i + 1}`} /></CF>
                  <CF k="e.cepageId" label="Cépage"><SI value={e.cepageId} onChange={(v) => setE(i, { cepageId: v })} options={opts(db, 'cepages')} aria-label={`Cépage du moût ${i + 1}`} /></CF>
                  <CF k="e.fractionId" label="Fraction"><SI value={e.fractionId} onChange={(v) => setE(i, { fractionId: v })} placeholder="Fraction…" options={fracOpts} aria-label={`Fraction du moût ${i + 1}`} /></CF>
                  <CF k="e.qualifId" label="Revendication"><SI value={e.qualifId} onChange={(v) => setE(i, { qualifId: v })} options={qualifOptions(db, e.qualifId)} aria-label={`Revendication du moût ${i + 1}`} /></CF>
                  <CF k="e.millesime" label="Millésime"><TI value={e.millesime} onChange={(v) => setE(i, { millesime: v })} placeholder={f.millesime || String(yearOf(f.date))} inputMode="numeric" aria-label={`Millésime du moût ${i + 1}`} /></CF>
                  <CF k="e.couleur" label="Couleur"><SI plain value={e.couleur || couleurDefaut(db)} onChange={(v) => setE(i, { couleur: v })} options={couleurOptions(db, e.couleur)} aria-label={`Couleur du moût ${i + 1}`} /></CF>
                  {(db.parcelles || []).length ? <CF k="e.parcelleId" label="Parcelle (facultatif)"><ParcelleSelect allowAdd={false} value={e.parcelleId} onChange={(v) => { const pc = (db.parcelles || []).find((x) => x.id === v); setE(i, { parcelleId: v, ...(pc ? { cruId: pc.cruId, ...(pc.cepageId ? { cepageId: pc.cepageId } : {}) } : {}) }); }} /></CF> : null}
                </div>
                {f.immat && baremesCiterne(db, f.immat).length ? <CF k="e.creux" label="Creux mesuré" bare><CreuxCiterne n={i + 1} immat={f.immat} compartiment={e.compartiment} creux={e.creux} onChange={(x) => setE(i, x)}
                  onVolume={(v, b) => { const autres = sum(e.dests.slice(1), (d) => num(d.volL)); const dests = e.dests.map((d, k) => (k === 0 ? { ...d, volL: String(Math.round(Math.max(0, v - autres))) } : d)); setE(i, { dests, baremeId: b.id, ...(String(e.compartiment || '').trim() ? {} : { compartiment: String(b.compartiment) }) }); }} /></CF> : null}
                <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))' }}>
                  <CF k="e.apporteurs" group label={(e.apporteurs || []).length > 1 ? 'Partenaires (parts en %)' : 'Partenaire'}><PartenairesLigne n={i + 1} value={e.apporteurs} onChange={(v) => setE(i, { apporteurs: v })} onAjout={(id) => { if (!e.cruId && apporteurCruAuto(db, id)) setE(i, { apporteurs: [...(e.apporteurs || []), { id, pct: '' }], cruId: apporteurCruAuto(db, id) }); }} /></CF>
                  <CF k="e.cruId" group label="Cru (village)"><CruSelect value={e.cruId} onChange={(v) => setE(i, { cruId: v })} /><CrusProposes ids={(e.apporteurs || []).map((a) => a.id)} cruId={e.cruId} onPick={(c) => setE(i, { cruId: c })} /></CF>
                </div>
                <CF k="e.analyses" label="Analyses du lot" bare><div className="mt-2 rounded-md border border-line px-2 py-1.5" data-analyses-mout={i + 1}>
                  <div className="text-sm"><b>🔬 Analyses du lot{e.numLot ? ` ${e.numLot}` : ''}</b> <span className="text-ink2">{mod.nom}{mod.etape ? ` · ${mod.etape}` : ''}</span></div>
                  <div className="mt-2"><AnalysesLigne n={i + 1} paramIds={mod.paramIds} value={e.analyses} onChange={(v) => setE(i, { analyses: v })} /></div>
                </div></CF>
                <div className="mt-2"><span className="lbl">{e.dests.length > 1 ? 'Répartition sur plusieurs cuves' : 'Cuve de destination et volume'}</span>
                  <div className="space-y-2">{e.dests.map((d, j) => (
                    <div key={j} className="space-y-1">
                      <div className="grid items-center gap-2" style={{ gridTemplateColumns: 'minmax(0,1.6fr) minmax(90px,.8fr) auto' }}>
                        <SI value={d.contenantId} onChange={(v) => setD(i, j, { contenantId: v, hauteur: '' })} placeholder="Cuve…" options={contOptions(db)} aria-label={`Cuve de destination ${j + 1} du moût ${i + 1}`} />
                        <VI value={d.volL} onChange={(v) => setD(i, j, { volL: v })} placeholder="hL" aria-label={`Volume vers la cuve ${j + 1} du moût ${i + 1}`} />
                        <Btn size="sm" kind="danger" disabled={e.dests.length < 2} aria-label="Retirer cette cuve" onClick={() => setE(i, { dests: e.dests.filter((_, x) => x !== j) })}>✕</Btn>
                      </div>
                      {cfVisible(cfgv, 'd.hauteur') ? <HauteurCuve contId={d.contenantId} hauteur={d.hauteur} volL={d.volL} volAvant={moutVolAvant(Rd, f, i, j)} n={i + 1} j={j + 1} onChange={(h, v) => setD(i, j, { hauteur: h, ...(v != null ? { volL: String(Math.round(v)) } : {}) })} /> : null}
                    </div>))}
                    <Btn size="sm" onClick={() => setE(i, { dests: [...e.dests, { contenantId: '', volL: '' }] })}>+ Répartir sur une autre cuve</Btn>
                  </div></div>
              </div>))}
              <Btn onClick={() => upd({ entrees: [...f.entrees, { ...nvLigne(), partId: actif }] })}>+ Ajouter un moût (compartiment)</Btn>
              {P.length > 1 ? <div><Btn size="sm" kind="danger" onClick={() => retirerOnglet(actif)} data-retirer-partenaire="">Retirer ce partenaire</Btn></div> : null}
              </div>
            </div>
          </Group>
          {fracEd ? <FractionsDialog onClose={() => setFracEd(false)} /> : null}
          <Group label={`Lots créés : un lot de moût par cuve (${plan.length})`} help="Le code est proposé à partir du préfixe et de la fraction ; vous pouvez le modifier, ainsi que la désignation.">
            {plan.length ? <div className="space-y-2">{plan.map((t) => { const ct = db.contenants.find((c) => c.id === t.contenantId) || {}; const here = inTank(t.contenantId); const ov = (f.lotCodes || {})[t.contenantId] || {}; return (
              <div key={t.contenantId} className="rounded-md border border-line p-2">
                <div className="flex flex-wrap items-center gap-2 text-sm"><b>{ct.nom || '?'}</b><span className="num">{fmtL(t.vol)}</span>
                  {here > 0.5 ? <Chip tone="warn">contient déjà {fmtL(here)}</Chip> : null}<NiveauAttendu contId={t.contenantId} volL={here + t.vol} />{ct.volMax && here + t.vol > ct.volMax + 0.5 ? <Chip tone="bad">capacité dépassée ({fmtL(ct.volMax)})</Chip> : null}
                  <QChip id={t.qualif} />{t.qualifs.length > 1 ? <Chip tone="warn">revendications mélangées → {qLabel(t.qualif)}</Chip> : null}<EChip info={echOf(t.parts.map((p) => ({ cruId: p.e.cruId, w: p.vol })))} /></div>
                <div className="mt-1 text-xs text-ink2">{t.parts.map((p) => `${p.e.numLot ? `${p.e.numLot} · ` : ''}${p.e.compartiment || `Moût ${p.i + 1}`} : ${lbl(db, 'cepages', p.e.cepageId)} ${fracLabel(db, p.e.fractionId).toLowerCase()}${p.e.cruId ? ` ${cruName(db, p.e.cruId)}` : ''} ${p.e.millesime || f.millesime || yearOf(f.date)} (${fmtL(p.vol)})`).join(' + ')}</div>
                <div className="mt-1"><MoyennesEnrichissement compact parts={t.parts.map((p) => ({ vol: p.vol, analyses: p.e.analyses }))} volL={t.vol} /></div>
                <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: 'minmax(110px,1fr) minmax(0,2fr)' }}>
                  <TI value={ov.code || ''} onChange={(v) => setCode(t.contenantId, { code: v })} placeholder={t.auto || 'Code du lot'} aria-label={`Code du lot en ${ct.nom}`} />
                  <TI value={ov.designation || ''} onChange={(v) => setCode(t.contenantId, { designation: v })} placeholder={t.designationAuto} aria-label={`Désignation du lot en ${ct.nom}`} />
                </div>
              </div>); })}</div> : <div className="help">Choisissez au moins une cuve de destination.</div>}
            <div className="mt-2" style={{ maxWidth: 260 }}><CF k="code" label="Préfixe des codes de lots"><TI value={f.code} onChange={(v) => upd({ code: v })} placeholder="ex. M26-02" /></CF></div>
          </Group>
        </>);
      }
      case 'pressurage': return (<>
        {old && old.marc && old.marc.num ? <Notice tone="info" title={`Carnet de pressoir : marc n° ${old.marc.num}${old.marc.valide ? ', validé' : old.marc.enCours ? ', en cours' : ''}`}>TAV en puissance, bourbes, contrôles et validation : onglet Pressoir › Pressurages.</Notice> : pressoirParams(db).registre ? <Notice tone="info">Ce pressurage entre au carnet de pressoir : complétez-le et validez-le dans l’onglet Pressoir (TAV en puissance, bourbes, contrôles).</Notice> : null}
        <G n={3}><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><Field label="Heure du début (carnet)"><input className="inp num" type="time" value={f.heureDebut || ''} onChange={(e) => upd({ heureDebut: e.target.value })} aria-label="Heure du début du pressurage" /></Field><CF k="equipementId" label="Pressoir"><SI value={f.equipementId} onChange={(v) => upd({ equipementId: v })} options={opts(db, 'equipements')} /></CF></G>
        <CF k="charges" group label="Pesées pressées">
          <div className="space-y-2">{f.charges.map((c, i) => (
            <div key={i} className="grid items-end gap-2" style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) auto' }}>
              <SI value={c.apportId} onChange={(v) => { const r = Rd.raisins[v]; setCharges(f.charges.map((x, k) => (k === i ? { apportId: v, kg: r ? String(r2(r.kg - r.used)) : '' } : x))); }} placeholder="Choisir une pesée…" options={apOpts(c.apportId)} />
              <NI value={c.kg} onChange={(v) => setCharges(f.charges.map((x, k) => (k === i ? { ...x, kg: v } : x)))} placeholder="kg pressés" />
              <Btn kind="danger" size="sm" aria-label="Retirer" onClick={() => setCharges(f.charges.filter((_, k) => k !== i))}>✕</Btn>
            </div>))}
            <Btn size="sm" onClick={() => setCharges([...f.charges, { apportId: '', kg: '' }])}>+ Ajouter une pesée</Btn>{!Object.keys(Rd.raisins).length ? <div className="help">Aucune pesée à cette date : enregistrez d’abord une « Pesée de vendange ».</div> : null}
          </div>
        </CF>
        <G n={3}><CF k="code" label="Code du lot parent"><TI value={f.code} onChange={(v) => upd({ code: v })} /></CF><CF k="designation" label="Désignation" className="sm:col-span-1"><TI value={f.designation} onChange={(v) => upd({ designation: v })} /></CF><CF k="millesime" label="Millésime"><TI value={f.millesime} onChange={(v) => upd({ millesime: v })} placeholder={String(yearOf(f.date))} /></CF></G>
        <CF k="qualifId" label="Revendication du lot" help="Proposée d’après le rang le plus bas des apports pressés."><SI value={f.qualifId} onChange={(v) => upd({ qualifId: v })} options={qualifOptions(db, f.qualifId)} /></CF>
        <EchNote info={echOf(f.charges.filter((c) => c.apportId && num(c.kg) > 0).map((c) => ({ cruId: (Rd.raisins[c.apportId] || {}).cruId, w: c.kg })))} what="des raisins pressés" />
        <CF k="frac" group label="Fractions obtenues (lots enfants)" help={totKg > 0 && totVol > 0 ? `Total ${fmtL(totVol)} pour ${fmt(totKg)} kg → ${fmtL((totVol / totKg) * 100)} / 100 kg` : 'Renseignez le volume de chaque fraction produite ; les autres restent vides.'}>
          <div className="space-y-2">{Object.keys(f.frac).map((fid) => fracDef(db, fid) || { id: fid, label: `(${fid})`, suffix: fid }).map((fr) => (
            <div key={fr.id} className="grid items-end gap-2" style={{ gridTemplateColumns: 'minmax(70px,.8fr) minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)' }}>
              <div className="pb-2 text-sm font-semibold">{fr.label}</div>
              <VI value={f.frac[fr.id].volL} onChange={(v) => setF((x) => ({ ...x, frac: { ...x.frac, [fr.id]: { ...x.frac[fr.id], volL: v } } }))} placeholder="L" aria-label={`Volume ${fr.label}`} />
              <SI value={f.frac[fr.id].contenantId} onChange={(v) => setF((x) => ({ ...x, frac: { ...x.frac, [fr.id]: { ...x.frac[fr.id], contenantId: v } } }))} placeholder="Contenant…" options={contOptions(db)} aria-label={`Contenant ${fr.label}`} />
              <TI value={f.frac[fr.id].code} onChange={(v) => setF((x) => ({ ...x, frac: { ...x.frac, [fr.id]: { ...x.frac[fr.id], code: v } } }))} placeholder={`${f.code || 'code'}-${fr.suffix}`} aria-label={`Code ${fr.label}`} />
            </div>))}
          </div>
          <div className="help mt-1">Les fractions proposées ici se règlent dans Paramètres › Listes modifiables › Fractions de moût. <button type="button" className="linkish" onClick={() => setFracEd(true)}>Personnaliser</button></div>
          {fracEd ? <FractionsDialog onClose={() => setFracEd(false)} /> : null}
        </CF>
      </>);
      case 'debourbage': case 'soutirage': case 'transfert': { const p = pOf(f.portionId); const loss = sum(f.pertes, (x) => x.volL); return (<>
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="portionId" label="Portion source"><PortionSelect db={db} Rd={Rd} value={f.portionId} onChange={portionPick} /></CF></G>
        <G><CF k="volL" label="Volume repris (hL)" help={p ? <>Stock de la portion : {fmtL(p.vol)}{hasNum(f.volL) ? <> <NiveauAttendu contId={p.contenantId} volL={volDans(p.contenantId) - num(f.volL)} label={`Niveau attendu ensuite en ${(db.contenants.find((c) => c.id === p.contenantId) || {}).nom}`} /></> : null}</> : ''}><VolJauge value={f.volL} onChange={(v) => upd({ volL: v })} contIds={[p && p.contenantId, f.destId]} sortieDe={p && p.contenantId} onJauge={jauger('volL')} /></CF><CF k="destId" label="Contenant de destination" help={f.destId && hasNum(f.volL) ? <NiveauAttendu contId={f.destId} volL={volDans(f.destId) + Math.max(0, num(f.volL) - loss)} /> : ''}><SI value={f.destId} onChange={(v) => upd({ destId: v })} placeholder="Destination…" options={contOptions(db)} /></CF></G>
        <CF k="pertes" group label={type === 'debourbage' ? 'Pertes (bourbes)' : type === 'soutirage' ? 'Pertes (lies)' : 'Pertes éventuelles'} help={`Volume reçu en destination : ${fmtL(Math.max(0, num(f.volL) - loss))}`}><PertesEditor db={db} pertes={f.pertes} onChange={(v) => upd({ pertes: v })} defaultType={type === 'debourbage' ? 'bourbes' : type === 'soutirage' ? 'lies' : undefined} /></CF>
        <CF k="lignes" group label="Intrants ajoutés (facultatif)"><LignesEditor {...lignesProps} qualif={lotQ(f.portionId)} vol={Math.max(0, num(f.volL) - loss)} cats={['oeno', 'aux']} /></CF>
        <CF k="equipementIds" label="Équipements utilisés" bare><Eq db={db} value={f.equipementIds} onChange={(v) => upd({ equipementIds: v })} /></CF>
      </>); }
      case 'intrant': { const p = pOf(f.portionId); return (<>
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="portionId" label="Portion concernée"><PortionSelect db={db} Rd={Rd} value={f.portionId} onChange={(v) => upd({ portionId: v })} /></CF></G>
        <CF k="motif" label="Objet de l’ajout"><TI value={f.motif} onChange={(v) => upd({ motif: v })} placeholder="Levurage, sulfitage, collage…" /></CF>
        <CF k="lignes" group label="Intrants"><LignesEditor {...lignesProps} qualif={lotQ(f.portionId)} vol={p ? p.vol : 0} cats={['oeno', 'aux']} /></CF>
        <CF k="prepUses" group label="Préparations ajoutées (pied de cuve, levain…)"><PrepUsesEditor db={db} Rd={Rd} uses={f.prepUses} onChange={(v) => upd({ prepUses: v })} /></CF>
      </>); }
      case 'suivi': { const p = pOf(f.portionId); return (<>
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="portionId" label="Portion (cuve)"><PortionSelect db={db} Rd={Rd} value={f.portionId} onChange={(v) => upd({ portionId: v })} /></CF></G>
        <G n={3}><CF k="motif" label="Objet"><TI value={f.motif} onChange={(v) => upd({ motif: v })} placeholder="Remontage, bâtonnage, contrôle…" /></CF><CF k="densite" label="Densité (facultatif)"><NI value={f.densite} onChange={(v) => upd({ densite: v })} placeholder="ex. 1,012" /></CF><CF k="tempC" label="Température (°C, facultatif)"><NI value={f.tempC} onChange={(v) => upd({ tempC: v })} placeholder="ex. 18" /></CF></G>
        <CF k="lignes" group label="Intrants (facultatif : activateur, nutriments…)"><LignesEditor {...lignesProps} qualif={lotQ(f.portionId)} vol={p ? p.vol : 0} cats={['oeno', 'aux']} /></CF>
      </>); }
      case 'sortie': { const p = pOf(f.portionId); return (<>
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="portionId" label="Portion (cuve · lot)"><PortionSelect db={db} Rd={Rd} value={f.portionId} onChange={(v) => upd({ portionId: v, volL: f.volL || (pOf(v) ? String(r2(pOf(v).vol)) : '') })} /></CF></G>
        <G n={3}><CF k="volL" label="Volume sorti (hL)" help={p ? `Stock de la cuve : ${fmtL(p.vol)}` : ''}><VolJauge value={f.volL} onChange={(v) => upd({ volL: v })} contIds={[p && p.contenantId]} sortieDe={p && p.contenantId} onJauge={jauger('volL')} /></CF><CF k="motif" label="Motif"><TI value={f.motif} onChange={(v) => upd({ motif: v })} placeholder="Vente en vrac, prestations viniques, destruction…" /></CF><CF k="ref" label="N° de DAE / DSA (facultatif)"><TI value={f.ref} onChange={(v) => upd({ ref: v })} /></CF></G>
        <CF k="destinataire" label="Destinataire (acheteur, distillerie…)"><TI value={f.destinataire} onChange={(v) => upd({ destinataire: v })} placeholder="ex. Distillerie de la Marne" /></CF>
        <Notice tone="info">Le volume sort définitivement du stock de la cave (bilan matière : « sorties de cave »).</Notice>
      </>); }
      case 'froid': { const p = pOf(f.portionId); return (<>
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="portionId" label="Portion (cuve)"><PortionSelect db={db} Rd={Rd} value={f.portionId} onChange={(v) => upd({ portionId: v })} /></CF></G>
        <G><CF k="tempC" label="Température (°C)"><NI value={f.tempC} onChange={(v) => upd({ tempC: v })} placeholder={/chauff/i.test(cat.label || '') ? 'ex. 20' : 'ex. -2'} /></CF><CF k="jours" label="Durée (jours)"><NI value={f.jours} onChange={(v) => upd({ jours: v })} placeholder="facultatif" /></CF></G>
        <CF k="lignes" group label={cat.id === 'froid' ? 'Intrants (collage, tartre…)' : 'Intrants (facultatif)'}><LignesEditor {...lignesProps} qualif={lotQ(f.portionId)} vol={p ? p.vol : 0} cats={['oeno', 'aux']} /></CF>
      </>); }
      case 'filtration': { const p = pOf(f.portionId); return (<>
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="portionId" label="Portion filtrée"><PortionSelect db={db} Rd={Rd} value={f.portionId} onChange={(v) => upd({ portionId: v })} /></CF></G>
        <CF k="methodeId" label="Méthode de filtration" help="Liste modifiable dans Paramètres › Listes."><SI value={f.methodeId} onChange={(v) => upd({ methodeId: v })} options={opts(db, 'methodesFiltration')} /></CF>
        <CF k="lignes" group label="Auxiliaires et intrants (avec n° de lot fournisseur)"><LignesEditor {...lignesProps} qualif={lotQ(f.portionId)} vol={p ? p.vol : 0} cats={['aux', 'oeno']} /></CF>
        <CF k="pertes" group label="Pertes de filtration (facultatif)"><PertesEditor db={db} pertes={f.pertes} onChange={(v) => upd({ pertes: v })} /></CF>
        <CF k="equipementIds" label="Équipements utilisés" bare><Eq db={db} value={f.equipementIds} onChange={(v) => upd({ equipementIds: v })} /></CF>
      </>); }
      case 'jaugeage': { const p = pOf(f.portionId); const bj = p ? baremeDe(db, p.contenantId) : null; const autres = p ? volDans(p.contenantId) - p.vol : 0; return (<>
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="portionId" label="Portion jaugée"><PortionSelect db={db} Rd={Rd} value={f.portionId} onChange={(v) => upd({ portionId: v })} /></CF></G>
        {bj ? <CF k="hauteurMesure" label={`${bj.mesure === 'creux' ? 'Creux' : 'Hauteur'} mesuré${bj.mesure === 'creux' ? '' : 'e'} (cm)`} help={<>Barème de {(db.contenants.find((c) => c.id === p.contenantId) || {}).nom} : {baremePlage(bj)}{autres > 0.5 ? ` · le contenant contient aussi ${fmtL(autres)} d’autres lots, déduits du volume mesuré` : ''}{f.portionId && p ? <> · <NiveauAttendu contId={p.contenantId} volL={volDans(p.contenantId)} label="niveau attendu d’après le stock" /></> : null}</>}>
          <NI value={f.hauteurMesure ?? ''} onChange={(v) => { const r = hasNum(v) ? baremeVolume(bj, v) : null; upd({ hauteurMesure: v, baremeId: bj.id, mesureJauge: bj.mesure, ...(r ? { volMesure: String(Math.round(Math.max(0, r.v - autres))) } : {}) }); }} placeholder="ex. 152,5" aria-label="Hauteur mesurée (cm)" /></CF> : null}
        <G><CF k="volMesure" label="Volume mesuré (hL)" help={p ? `Volume en stock : ${fmtL(p.vol)} → écart ${fmtL(num(f.volMesure) - p.vol)}` : ''}><VI value={f.volMesure} onChange={(v) => upd({ volMesure: v })} /></CF><CF k="typeId" label="Nature de l’écart"><SI value={f.typeId} onChange={(v) => upd({ typeId: v })} options={opts(db, 'typesPerte')} /></CF></G>
      </>); }
      case 'assemblage': { const q = sourcesQ(f.sources), mx = mixed(f.sources); const tot = sum(f.sources, (s) => s.volL) - sum(f.pertes, (x) => x.volL); return (<>
        <CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF>
        <SourcesEditor db={db} Rd={Rd} sources={f.sources} onChange={(v) => upd({ sources: v })} />
        {mx ? <Notice title="Déclassement automatique à l’assemblage">Revendications mélangées ({mx.map(qLabel).join(' + ')}) : le lot résultant sera <b>{qLabel(q)}</b> (rang le plus bas).</Notice> : f.sources.some((s) => s.portionId) ? <Notice tone="info">Qualification du lot résultant : <b>{qLabel(q)}</b>.</Notice> : null}
        <EchNote info={srcEch(f.sources)} what="du lot résultant (rang le plus bas des sources)" />
        <G><CF k="destId" label="Contenant de destination" help={f.destId && tot > 0 ? <NiveauAttendu contId={f.destId} volL={volDans(f.destId) + tot} /> : ''}><SI value={f.destId} onChange={(v) => upd({ destId: v })} placeholder="Destination…" options={contOptions(db)} /></CF><CF k="ltype" label="Nature du lot résultant" help="« Vin de réserve » pour un vin conservé pour les assemblages futurs."><SI plain value={f.ltype} onChange={(v) => upd({ ltype: v })} options={['assemblage', 'vin_reserve', 'vin_clair'].map((k) => ({ value: k, label: LOT_TYPES[k] }))} /></CF></G>
        <G n={3}><CF k="code" label="Code du nouveau lot"><TI value={f.code} onChange={(v) => upd({ code: v })} /></CF><CF k="designation" label="Désignation"><TI value={f.designation} onChange={(v) => upd({ designation: v })} /></CF><CF k="millesime" label="Millésime"><TI value={f.millesime} onChange={(v) => upd({ millesime: v })} placeholder="2026 ou NV" /></CF></G>
        <CF k="pertes" group label="Pertes à l’assemblage (facultatif)" help={`Volume obtenu : ${fmtL(Math.max(0, tot))}`}><PertesEditor db={db} pertes={f.pertes} onChange={(v) => upd({ pertes: v })} /></CF>
        <CF k="lignes" group label="Intrants ajoutés (facultatif)"><LignesEditor {...lignesProps} qualif={q} vol={Math.max(0, tot)} cats={['oeno', 'aux']} /></CF>
      </>); }
      case 'etape': { const lot = Rd.lots[f.lotId]; const nx = lot ? stadeNext(db, lot.stade) : null; return (<>
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="lotId" label="Lot"><SI value={f.lotId} onChange={(v) => { const l = Rd.lots[v]; const auto = cat.stadeAuto && cat.stadeAuto.actif && stadeDef(db, cat.stadeAuto.stade) ? cat.stadeAuto.stade : ''; upd({ lotId: v, newStade: l ? (auto || (stadeNext(db, l.stade) || {}).id || l.stade) : auto }); }} placeholder="Lot…" options={Object.values(Rd.lots).filter((l) => (Rd.lotVol[l.id] || 0) > 0 || (Rd.tir[l.id] && Rd.tir[l.id].nb > 0)).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true })).map((l) => ({ value: l.id, label: `${l.code} · ${stadeCourt(db, l.stade)} · ${couleurLabel(db, l.couleur)}${(Rd.lotVol[l.id] || 0) > 0 ? ` · ${fmtL(Rd.lotVol[l.id])}` : ''}` }))} /></CF></G>
        {lot ? <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-ink2">Aujourd’hui :</span><StadeChip id={lot.stade} /><CouleurChip id={lot.couleur} /><Chip>{LOT_TYPES[lot.type]}</Chip>{nx ? <span className="text-ink2">· stade suivant habituel : <b>{nx.label}</b></span> : null}</div> : null}
        <G n={3}><CF k="newStade" label="Nouveau stade"><SI plain value={f.newStade} onChange={(v) => upd({ newStade: v })} options={stadeOptions(db, f.newStade)} aria-label="Nouveau stade" /></CF>
          <CF k="couleur" label="Couleur du vin"><SI plain value={f.couleur} onChange={(v) => upd({ couleur: v })} options={[{ value: '', label: 'Inchangée' }, ...couleurOptions(db, f.couleur)]} aria-label="Nouvelle couleur" /></CF>
          <CF k="newType" label="Nature du lot"><SI plain value={f.newType} onChange={(v) => upd({ newType: v })} options={[{ value: '', label: 'Inchangée' }, ...['vin_clair', 'assemblage', 'vin_reserve'].map((k) => ({ value: k, label: LOT_TYPES[k] }))]} aria-label="Nouvelle nature" /></CF></G>
        <p className="help">Repères : fin de FA quand la densité est stable et les sucres sous 2 g/L ; FML terminée quand l’acide malique est quasi nul ; vin clair après soutirage et clarification. Pensez à joindre l’analyse qui le justifie (📎 dans le journal).</p>
      </>); }
      case 'reprise': return (<>
        {f.sousType === 'entree_vin' || (f.amont || []).length ? <TraceImport type="reprise" f={f} setF={setF} /> : null}
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="kind" label={f.sousType === 'entree_vin' ? 'Nature du vin reçu' : 'Nature du stock repris'}><SI value={f.kind} onChange={(v) => upd({ kind: v, ltype: v === 'bouteilles' ? 'cuvee_tirage' : 'vin_reserve' })} options={[{ value: 'vin', label: 'Vin en contenant' }, { value: 'bouteilles', label: 'Bouteilles sur lattes (cuvée de tirage)' }]} /></CF></G>
        <CF k="apporteurId" label={f.sousType === 'entree_vin' ? 'Partenaire (vendeur de vins)' : 'Partenaire (vendeur), facultatif'} help="Le vin est rattaché à ce partenaire dans la composition et la traçabilité."><ApporteurSelect value={f.apporteurId || ''} role="vendeur" onChange={(v) => upd({ apporteurId: v })} /></CF>
        {f.kind === 'vin' ? <G><Field label="Contenant"><SI value={f.contenantId} onChange={(v) => upd({ contenantId: v })} placeholder="Contenant…" options={contOptions(db)} /></Field><Field label="Volume (hL)"><VI value={f.volL} onChange={(v) => upd({ volL: v })} /></Field></G> : <Field label="Nombre de bouteilles"><NI value={f.nbBouteilles} onChange={(v) => upd({ nbBouteilles: v })} /></Field>}
        <G n={3}><CF k="code" label="Code du lot"><TI value={f.code} onChange={(v) => upd({ code: v })} /></CF><CF k="designation" label="Désignation"><TI value={f.designation} onChange={(v) => upd({ designation: v })} /></CF><CF k="millesime" label="Millésime"><TI value={f.millesime} onChange={(v) => upd({ millesime: v })} placeholder="2024 ou NV" /></CF></G>
        <G>{f.kind === 'vin' ? <CF k="ltype" label="Nature du lot"><SI plain value={f.ltype} onChange={(v) => upd({ ltype: v })} options={['vin_clair', 'vin_reserve', 'assemblage'].map((k) => ({ value: k, label: LOT_TYPES[k] }))} /></CF> : <div />}<CF k="qualifId" label="Revendication"><SI value={f.qualifId} onChange={(v) => upd({ qualifId: v })} options={qualifOptions(db, f.qualifId)} /></CF></G>
        <CF k="crus" group label="Origine par crus (villages) — facultatif" help="Parts relatives (%) ; à défaut, parts égales. Sert à la composition par cru, au classement (échelle) et à la traçabilité."><CrusEditor crus={f.crus} onChange={(v) => upd({ crus: v })} echelle={f.echelle} onEchelle={(v) => upd({ echelle: v })} /></CF>
        <CF k="cepages" group label="Composition connue (% par cépage, facultatif)" help="Sert au calcul de composition du lot et de ses descendants."><div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>{db.lists.cepages.map((c) => <Field key={c.id} label={c.label}><NI value={f.cepages[c.id] || ''} onChange={(v) => setF((x) => ({ ...x, cepages: { ...x.cepages, [c.id]: v } }))} placeholder="%" /></Field>)}</div></CF>
      </>);
      case 'preparation': return (<>
        <G><CF k="date" label="Date"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="ptype" label="Type de préparation"><SI value={f.ptype} onChange={(v) => upd({ ptype: v, code: !f.code || /^(LEV|PDC|LT|LE)-/.test(f.code) ? nextPrepCode(db, v, f.date) : f.code })} options={Object.keys(PREP_TYPES).map((k) => ({ value: k, label: PREP_TYPES[k] }))} /></CF></G>
        <G n={3}><CF k="code" label="Code"><TI value={f.code} onChange={(v) => upd({ code: v })} /></CF><CF k="volL" label="Volume préparé (hL)"><VI value={f.volL} onChange={(v) => upd({ volL: v })} /></CF><CF k="qualifId" label="Revendication" help="Selon la revendication du vin à tirer."><SI value={f.qualifId} onChange={(v) => upd({ qualifId: v })} options={qualifOptions(db, f.qualifId)} /></CF></G>
        <CF k="source" group label="Vin prélevé pour la préparation (facultatif)"><div className="grid2"><PortionSelect db={db} Rd={Rd} value={f.sourcePortionId} onChange={(v) => upd({ sourcePortionId: v })} placeholder="Aucun (pas de prélèvement)" /><VI value={f.sourceVolL} onChange={(v) => upd({ sourceVolL: v })} placeholder="Volume prélevé (hL)" /></div></CF>
        <CF k="lignes" group label="Ingrédients (sucre, MCR, levures, SO₂…)"><LignesEditor {...lignesProps} qualif={f.qualifId} vol={num(f.volL)} cats={['oeno', 'aux']} hideDose /></CF>
      </>);
      case 'tirage': { const q = sourcesQ(f.sources, f.prepUses), mx = mixed(f.sources, f.prepUses); const sucre = hasNum(f.densBase) && hasNum(f.densMix) ? (num(f.densMix) - num(f.densBase)) * 1000 * num(db.settings.coefSucre) : null; return (<>
        <CF k="date" label="Date du tirage"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF>
        <SourcesEditor db={db} Rd={Rd} sources={f.sources} onChange={(v) => upd({ sources: v })} label="Vin de base (portions)" />
        <EchNote info={srcEch(f.sources)} what="de la cuvée de tirage" />
        <CF k="prepUses" group label="Liqueur de tirage et levain consommés"><PrepUsesEditor db={db} Rd={Rd} uses={f.prepUses} onChange={(v) => upd({ prepUses: v })} types={['liqueur_tirage', 'levain']} /></CF>
        {mx ? <Notice title="Déclassement automatique">Revendications mélangées ({mx.map(qLabel).join(' + ')}) : la cuvée de tirage sera <b>{qLabel(q)}</b>.</Notice> : null}
        <CF k="lignes" group label="Adjuvants et matières sèches (bouteilles, capsules…) avec n° de lot"><LignesEditor {...lignesProps} qualif={q} vol={num(f.nbBouteilles) * (num(f.volBouteilleL) || 0.75)} /></CF>
        <G n={3}><CF k="nbBouteilles" label="Bouteilles tirées"><NI value={f.nbBouteilles} onChange={(v) => upd({ nbBouteilles: v })} /></CF><CF k="volBouteilleL" label="Volume bouteille (L)"><NI value={f.volBouteilleL} onChange={(v) => upd({ volBouteilleL: v })} /></CF><div /></G>
        <CF k="densites" label="Densités et sucre de la mixtion" bare><G n={3}><Field label="Densité vin de base seul"><NI value={f.densBase} onChange={(v) => upd({ densBase: v })} placeholder="ex. 0,9918" /></Field><Field label="Densité mixtion"><NI value={f.densMix} onChange={(v) => upd({ densMix: v })} placeholder="ex. 1,0010" /></Field><Group label="Sucre de la mixtion"><div className="num pt-2 text-lg font-semibold">{sucre != null ? `${fmt(sucre, 1)} g/L` : '—'}</div><div className="help">(mixtion − base) × 1000 × {fmt(db.settings.coefSucre, 2)} g/L par point de densité ; objectif {fmt(db.settings.objectifTirageGL)} g/L.</div></Group></G></CF>
        <G n={3}><CF k="code" label="Code du lot de tirage"><TI value={f.code} onChange={(v) => upd({ code: v })} /></CF><CF k="designation" label="Désignation"><TI value={f.designation} onChange={(v) => upd({ designation: v })} /></CF><CF k="millesime" label="Millésime"><TI value={f.millesime} onChange={(v) => upd({ millesime: v })} placeholder={String(yearOf(f.date))} /></CF></G>
      </>); }
      case 'degorgement': return (<>
        <G><CF k="date" label="Date du dégorgement"><DI value={f.date} onChange={(v) => upd({ date: v })} /></CF><CF k="sourceLotId" label="Lot de tirage (bouteilles en stock)"><SI value={f.sourceLotId} onChange={(v) => upd({ sourceLotId: v, nb: f.nb || (Rd.tir[v] ? String(Rd.tir[v].nb) : '') })} placeholder="Lot de tirage…" options={Object.values(Rd.tir).filter((t) => t.nb > 0).map((t) => ({ value: t.lotId, label: `${lotCode(db, Rd, t.lotId)} · ${fmt(t.nb)} bouteilles en stock` }))} /></CF></G>
        <CF k="nb" label="Bouteilles dégorgées" help={Rd.tir[f.sourceLotId] ? `Stock : ${fmt(Rd.tir[f.sourceLotId].nb)} bouteilles — elles sortent du stock mais restent tracées.` : ''}><NI value={f.nb} onChange={(v) => upd({ nb: v })} /></CF>
        <CF k="prepUses" group label="Liqueur d’expédition utilisée"><PrepUsesEditor db={db} Rd={Rd} uses={f.prepUses} onChange={(v) => upd({ prepUses: v })} types={['liqueur_exp']} /></CF>
        <CF k="lignes" group label="Bouchon, muselet… (avec n° de lot fournisseur)"><LignesEditor {...lignesProps} qualif={null} vol={0} hideDose cats={['sec', 'oeno', 'aux']} /></CF>
        <G n={3}><CF k="code" label="Code du lot fini"><TI value={f.code} onChange={(v) => upd({ code: v })} /></CF><CF k="designation" label="Désignation"><TI value={f.designation} onChange={(v) => upd({ designation: v })} placeholder="Brut – dégorgé…" /></CF><CF k="dosageGL" label="Dosage (g/L)"><NI value={f.dosageGL} onChange={(v) => upd({ dosageGL: v })} placeholder="facultatif" /></CF></G>
      </>);
      default: return null;
    }
  };
  // droits (identifiants activés) : saisie dans le module de l'opération (ou Opérations), correction d'une opération validée
  const ecrit = !secu || niveauModule(db, uid, moduleDeType(type, f)) === 'ecriture' || niveauModule(db, uid, 'ops') === 'ecriture';
  const regEnCours = !!(old && ((old.type === 'apport' && old.pesee && !old.pesee.valide) || (old.type === 'pressurage' && old.marc && !old.marc.valide))); // registre du pressoir : pas encore validé
  const regValide = !!(old && ((old.type === 'apport' && old.pesee && old.pesee.valide) || (old.type === 'pressurage' && old.marc && old.marc.valide)));
  const lecture = secu && (old ? !(ecrit && (peut(db, uid, 'modifier') || regEnCours)) : !ecrit);
  if (lecture && !old && !prevId) return <Sheet title={`${cat.label || OP_LABELS[type]}`} onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Fermer</Btn>}><Notice tone="bad" title="Droits insuffisants">Votre profil « {profilNom(db, uid)} » ne permet pas de saisir cette opération ({moduleNom(moduleDeType(type, f))} en consultation). Demandez à un administrateur.</Notice></Sheet>;
  const tracePar = old && (old.saisiPar || old.modifiePar) ? <div className="text-xs text-ink2" data-saisi-par="">{old.saisiPar ? `Saisie par ${utilisateurNom(db, old.saisiPar)}${old.saisiLe ? ` le ${fmtDateHeure(old.saisiLe)}` : ''}` : ''}{old.modifiePar ? `${old.saisiPar ? ' · ' : ''}corrigée par ${utilisateurNom(db, old.modifiePar)}${old.modifieLe ? ` le ${fmtDateHeure(old.modifieLe)}` : ''}` : ''}</div> : null;
  return (
    <FormSheet readOnly={lecture} title={prevId ? `À réaliser — ${cat.label || OP_LABELS[type]}` : `${lecture ? 'Opération' : old ? 'Modifier l’opération' : 'Nouvelle opération'} — ${cat.label || OP_LABELS[type]}`} sub={prevId ? `Planifiée pour le ${fmtDate(plan0 ? plan0.date : f.date)} · sans effet sur les stocks tant qu’elle n’est pas validée.` : (cat.aide || OP_HELP[type])} onClose={onClose} onSave={valider} wide
      saveLabel={old ? 'Enregistrer' : '✓ Valider'} saveTitle={old ? undefined : 'L’opération est faite : les stocks et la traçabilité sont mis à jour.'}
      secondary={old || (!prevId && !moduleActif(db, 'previsions')) ? null : <Btn onClick={planifier} title="Garder l’opération dans la liste « À réaliser » : aucun effet sur les stocks, fiche imprimable pour les opérateurs, validation plus tard avec les valeurs réelles.">{prevId ? 'Enregistrer (à réaliser)' : '📋 Planifier (à réaliser)'}</Btn>}
      extraFooter={<Btn className="mr-auto" onClick={() => openFiche([prevId && plan0 ? { kind: 'prev', id: prevId } : { kind: 'draft', type, f, editId }])} title="Fiche d’enregistrement pré-remplie à imprimer pour les opérateurs">🖨 Fiche à remplir</Btn>}>
      {lecture ? <Notice tone="info" title="Consultation">Votre profil « {profilNom(db, uid)} » ne permet pas de {old ? 'corriger une opération validée' : 'valider cette opération'} : les valeurs sont affichées sans pouvoir être enregistrées.</Notice> : null}
      {tracePar}
      {prevId ? <Notice tone="info" title="Opération à réaliser">Après l’opération, corrigez avec les valeurs réelles relevées (sur la fiche remplie, par exemple) puis « ✓ Valider ». « Enregistrer (à réaliser) » la garde en attente.</Notice> : null}
      <FormCfgCtx.Provider value={cfgv}>
      {nMasques || !lecture ? <div className="cf-barre">
        {nMasques ? <button type="button" className="linkish" onClick={() => setTout(!tout)} aria-pressed={tout}>{tout ? 'Cacher les champs masqués' : `Afficher tous les champs (${nMasques} masqué${nMasques > 1 ? 's' : ''})`}</button> : null}
        {!lecture && (!secu || niveauModule(db, uid, 'params') === 'ecriture') ? <button type="button" className="linkish" onClick={() => setCfgEd(true)} title="Choisir les champs affichés, obligatoires, leurs valeurs par défaut, et ajouter vos propres champs">⚙ Personnaliser ce formulaire</button> : null}
      </div> : null}
      <ChampsPerso defs={persoD} tous={fcfg.perso} f={f} upd={upd} type={type} />
      {body()}
      {regValide && !lecture ? <Field label={`Motif de la correction (${old.type === 'apport' ? 'registre des pesées' : 'carnet de pressoir'})`} help="Obligatoire si vous changez ce qui est inscrit au registre ; gardé au journal du pressoir."><TI value={f.motifRegistre || ''} onChange={(v) => upd({ motifRegistre: v })} placeholder="ex. erreur de saisie du poids" data-motif-registre="" /></Field> : null}
      <ChampsPerso defs={persoF} tous={fcfg.perso} f={f} upd={upd} type={type} />
      {VIN_CREE.includes(type) || VIN_APRES.includes(type) ? <CF k="vin" label="Stade et couleur du vin" bare><VinFields type={type} f={f} upd={upd} Rd={Rd} /></CF> : null}
      <CF k="operateurs" label="Opérateur(s)" bare><OperateursPicker value={f.operateurs} onChange={(v) => upd({ operateurs: v })} label={<>{champEffectif(fcfg, type, 'operateurs').libelle || 'Opérateur(s)'}{champEffectif(fcfg, type, 'operateurs').obligatoire ? <CfReq /> : null}</>}
        help={champEffectif(fcfg, type, 'operateurs').aide || `${prevId ? 'Qui réalise l’opération' : 'Qui a fait l’opération (ou, si vous la planifiez, qui doit la faire)'} : une ou plusieurs personnes${(db.settings.operateurObligatoire || champEffectif(fcfg, type, 'operateurs').obligatoire) && !old ? ' — obligatoire pour valider' : ''}. Liste : Paramètres › Société & opérateurs.`} /></CF>
      <CF k="notes" label="Notes"><TA value={f.notes} onChange={(v) => upd({ notes: v })} placeholder="Observations (facultatif)" /></CF>
      <CF k="docs" group label="Documents joints (fiche remplie, bon, bulletin d’analyse, photo…)"
        help={old ? null : prevId && plan0 ? 'Joints à l’opération à réaliser : ils passent sur l’opération dès sa validation.' : `Rattachés à l’opération dès « ✓ Valider »${moduleActif(db, 'previsions') ? ' (ou à l’opération à réaliser avec « 📋 Planifier »)' : ''} ; formulaire fermé sans enregistrer : ils sont retirés.`}>
        {(() => { const ids = type === 'entree_mout' ? moutOnglets(f).map((p) => p.id) : []; const gen = ids.length ? (d) => !d.partId || !ids.includes(d.partId) : undefined; // entrée de moûts : documents des partenaires dans leur onglet (0.34.0-alpha.1)
          return old ? <DocsPanel cible={{ type: 'op', id: old.id }} kind="op" locked={isLocked(db, old.date)} filtre={gen} /> : prevId && plan0 ? <DocsPanel cible={{ type: 'prev', id: prevId }} kind="op" filtre={gen} /> : <DocsAttente items={pieces} onChange={setPieces} filtre={gen} />; })()}
      </CF>
      </FormCfgCtx.Provider>
      {cfgEd ? <FormulaireEditor catId={cat.id} onClose={() => setCfgEd(false)} /> : null}
      {old ? null : <div className="help">« ✓ Valider » enregistre l’opération réalisée (stocks mis à jour){moduleActif(db, 'previsions') ? ' ; « 📋 Planifier » la met dans la liste « À réaliser » sans toucher aux stocks' : ''}.</div>}
      {built.error ? <div className="text-sm text-ink2">{old ? 'Pour enregistrer : ' : 'Pour valider : '}{built.error}{old || !moduleActif(db, 'previsions') ? '' : ' — vous pouvez déjà la planifier.'}</div> : <PreviewBox pv={pv} />}
      {!built.error && !lecture ? <DepassementBox deps={deps} R={pv && pv.R} motif={motifDep} setMotif={setMotifDep} /> : null}
      {!built.error && built.spec && !lecture && moduleActif(db, 'hygiene') ? <HygControlesNotices spec={built.spec} editId={editId} pv={pv} /> : null}
    </FormSheet>
  );
}
