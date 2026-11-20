/* ============ PARAMÈTRES › OPÉRATIONS › FORMULAIRE (0.16.0-alpha.1) ============
   Pour chaque opération du catalogue : ce que l'on remplit (affiché, replié, masqué), ce qui est obligatoire, les libellés, aides et valeurs
   par défaut, et des champs personnalisés (texte, nombre, calcul, date, heure, case, listes). Moteur : 14-formulaires.js. */
const VIS_CHOIX = [['visible', '👁', 'Affiché'], ['replie', '▸', 'Replié'], ['masque', '✕', 'Masqué']];
const cpTypeLabel = (t) => (CP_TYPES.find((x) => x[0] === t) || [t, t])[1];
function DefautInput({ def, value, onChange, label }) {
  const { db } = useApp(); const al = `Valeur par défaut : ${label}`;
  const sel = (opts) => <select className="inp" value={value || ''} onChange={(e) => onChange(e.target.value)} aria-label={al}><option value="">— aucune —</option>{opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>;
  switch (def) {
    case 'texte': return <TI value={value || ''} onChange={onChange} placeholder="(aucune)" aria-label={al} />;
    case 'nombre': return <NI value={value || ''} onChange={onChange} placeholder="(aucune)" aria-label={al} />;
    case 'qualif': return sel(QUALIFS.map((q) => [q.id, qLabel(q.id)]));
    case 'cepage': return sel(db.lists.cepages.map((c) => [c.id, c.label]));
    case 'fraction': return sel(fracList(db).map((x) => [x.id, x.label]));
    case 'couleur': return sel(couleurOptions(db, value).map((o) => [o.value, o.label]));
    case 'equip': return sel((db.lists.equipements || []).map((e) => [e.id, e.label]));
    case 'methode': return sel((db.lists.methodesFiltration || []).map((e) => [e.id, e.label]));
    case 'typesPerte': return sel((db.lists.typesPerte || []).map((e) => [e.id, e.label]));
    case 'ltype': return sel(['vin_clair', 'assemblage', 'vin_reserve'].map((k) => [k, LOT_TYPES[k]]));
    case 'equips': { const L = Array.isArray(value) ? value : []; return <div className="flex flex-wrap gap-1.5" role="group" aria-label={al}>{(db.lists.equipements || []).map((e) => <button key={e.id} type="button" className={cx('opr-tog', L.includes(e.id) && 'on')} aria-pressed={L.includes(e.id)} onClick={() => onChange(L.includes(e.id) ? L.filter((x) => x !== e.id) : [...L, e.id])}>{e.label}</button>)}</div>; }
    default: return null;
  }
}
const defautTexte = (db, def, v) => { if (v == null || v === '' || (Array.isArray(v) && !v.length)) return ''; if (def === 'qualif') return qLabel(v); if (def === 'cepage') return lbl(db, 'cepages', v); if (def === 'fraction') return fracLabel(db, v); if (def === 'couleur') return couleurLabel(db, v); if (def === 'equip' || def === 'equips') return [].concat(v).map((x) => lbl(db, 'equipements', x)).join(', '); if (def === 'methode') return lbl(db, 'methodesFiltration', v); if (def === 'typesPerte') return lbl(db, 'typesPerte', v); if (def === 'ltype') return LOT_TYPES[v] || v; return String(v); };

function FormulaireEditor({ catId, onClose }) {
  const { db, act, confirm, toast } = useApp(); const cat = opDef(db, catId) || { id: catId, base: catId, label: catId }; const type = cat.base || catId;
  const [cfg, setCfg] = useState(() => { const x = formulaireDe(db, catId); return { champs: clone(x.champs), perso: clone(x.perso) }; });
  const [ouvert, setOuvert] = useState(null); const [ed, setEd] = useState(null); // ed : { i } (modifier) ou { i: -1 } (nouveau)
  const champs = champsStd(type); const setC = (k, patch) => setCfg((x) => ({ ...x, champs: { ...x.champs, [k]: { ...(x.champs[k] || {}), ...patch } } }));
  const copiables = opList(db).filter((x) => x.id !== catId && memeFormulaire(x.base || x.id, type) && formulairePerso(db, x.id));
  const save = () => { const r = act((d) => formulaireSave(d, catId, cfg), `Formulaire « ${cat.label} » enregistré : il s’applique aux prochaines saisies.`); if (r && r.ok) onClose(); };
  const reset = async () => { if (await confirm({ title: 'Rétablir le formulaire d’origine ?', body: 'Tous les champs redeviennent affichés et facultatifs, sans valeur par défaut, et les champs personnalisés sont retirés du formulaire (les valeurs déjà saisies restent dans l’historique). Enregistrez ensuite pour appliquer.', ok: 'Rétablir' })) setCfg({ champs: {}, perso: [] }); };
  const delPerso = async (i) => { const p = cfg.perso[i]; if (await confirm({ title: `Retirer le champ « ${p.label} » ?`, body: 'Il ne sera plus proposé ; les valeurs déjà saisies restent dans l’historique des opérations.', ok: 'Retirer', danger: true })) setCfg((x) => ({ ...x, perso: x.perso.filter((_, k) => k !== i) })); };
  const movePerso = (i, dlt) => setCfg((x) => { const L = [...x.perso]; const j = i + dlt; if (j < 0 || j >= L.length) return x; [L[i], L[j]] = [L[j], L[i]]; return { ...x, perso: L }; });
  const nMasq = champs.filter((c) => !c.ess && (cfg.champs[c.k] || {}).vis === 'masque').length; const nObl = champs.filter((c) => !c.ess && (cfg.champs[c.k] || {}).obligatoire).length;
  return (
    <FormSheet wide title={`Formulaire — ${cat.label}`} sub={`Comportement : ${opComportement(type)}. Choisissez ce que l’on remplit, ce qui est obligatoire, les valeurs proposées, et ajoutez vos propres champs.`} onClose={onClose} onSave={save} saveLabel="Enregistrer le formulaire"
      extraFooter={<Btn className="mr-auto" onClick={reset}>Rétablir l’origine</Btn>}>
      <div className="flex flex-wrap items-center gap-2 text-sm" data-fe-resume=""><Chip>{champs.length} champs</Chip>{nMasq ? <Chip>{nMasq} masqué{nMasq > 1 ? 's' : ''}</Chip> : null}{nObl ? <Chip tone="warn">{nObl} obligatoire{nObl > 1 ? 's' : ''}</Chip> : null}<Chip tone="info">{cfg.perso.length} champ{cfg.perso.length > 1 ? 's' : ''} personnalisé{cfg.perso.length > 1 ? 's' : ''}</Chip>
        {copiables.length ? <span className="ml-auto flex items-center gap-1"><span className="text-ink2">Copier depuis :</span><select className="inp" style={{ width: 'auto' }} value="" onChange={(e) => { const src = formulaireDe(db, e.target.value); setCfg({ champs: clone(src.champs), perso: clone(src.perso).map((p) => ({ ...p, id: nouvelIdChamp() })) }); toast(`Réglages copiés de « ${opDef(db, e.target.value).label} » : enregistrez pour appliquer.`); }} aria-label="Copier le formulaire d’une autre opération"><option value="">— choisir —</option>{copiables.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select></span> : null}</div>
      <Group label="Champs de l’opération" help="🔒 indispensable : sert au calcul des stocks et de la traçabilité, toujours affiché et rempli. « Replié » : le champ reste disponible en un clic. « Masqué » : il disparaît du formulaire (« Afficher tous les champs » permet de le remplir quand même).">
        <div className="fe-liste">
          {champs.map((c) => { const x = cfg.champs[c.k] || {}; const vis = c.ess ? 'visible' : (x.vis || 'visible'); const open = ouvert === c.k; const dt = c.def ? defautTexte(db, c.def, x.defaut) : '';
            return (
              <div key={c.k} className={cx('fe-ligne', vis === 'masque' && 'off')} data-fe-champ={c.k}>
                <div className="fe-tete">
                  <span className="fe-nom"><b>{(!c.bare && x.libelle) || c.label}</b>{!c.bare && x.libelle ? <span className="text-xs text-ink2">({c.label})</span> : null}
                    {c.ligne ? <Chip>par compartiment</Chip> : null}{c.ess ? <Chip tone="info" title="Sert au calcul des stocks">🔒 indispensable</Chip> : null}{x.obligatoire && !c.ess && vis !== 'masque' ? <Chip tone="warn">obligatoire</Chip> : null}{dt ? <Chip title="Valeur par défaut">défaut : {dt}</Chip> : null}{x.aide ? <Chip title={x.aide}>aide</Chip> : null}</span>
                  <span className="fe-ctl">
                    <span className="fe-seg" role="radiogroup" aria-label={`Affichage : ${c.label}`}>{VIS_CHOIX.map(([v, ic, l]) => <button key={v} type="button" role="radio" aria-checked={vis === v} aria-label={l} disabled={c.ess} title={c.ess ? 'Champ indispensable : toujours affiché' : l} className={cx('fe-btn', vis === v && 'on', v)} onClick={() => setC(c.k, { vis: v, ...(v === 'masque' ? { obligatoire: false } : {}) })}><span aria-hidden="true">{ic}</span><span className="fe-txt"> {l}</span></button>)}</span>
                    <label className={cx('fe-obl', (c.ess || c.noObl || vis === 'masque') && 'off')} title={c.ess ? 'Toujours obligatoire' : c.noObl ? 'Ce champ ne peut pas être obligatoire' : vis === 'masque' ? 'Un champ masqué ne peut pas être obligatoire' : undefined}><input type="checkbox" checked={c.ess || (!!x.obligatoire && vis !== 'masque')} disabled={c.ess || c.noObl || vis === 'masque'} onChange={(e) => setC(c.k, { obligatoire: e.target.checked })} aria-label={`Obligatoire : ${c.label}`} /><span className="fe-txt-o">obligatoire</span><span className="fe-txt-c" aria-hidden="true">oblig.</span></label>
                    <Btn size="sm" onClick={() => setOuvert(open ? null : c.k)} aria-expanded={open} aria-label={`Détails : ${c.label}`} title="Libellé, aide, valeur par défaut">{open ? '▴' : '✎'}</Btn>
                  </span>
                </div>
                {open ? <div className="fe-detail">
                  {!c.bare ? <Field label="Libellé affiché"><TI value={x.libelle || ''} onChange={(v) => setC(c.k, { libelle: v })} placeholder={c.label} aria-label={`Libellé : ${c.label}`} /></Field> : <div className="help self-center">Bloc de saisie : libellé fixe.</div>}
                  <Field label="Aide affichée sous le champ"><TI value={x.aide || ''} onChange={(v) => setC(c.k, { aide: v })} placeholder="(aide d’origine)" aria-label={`Aide : ${c.label}`} /></Field>
                  {c.def ? <Field label={c.ligne ? 'Valeur par défaut (chaque compartiment)' : 'Valeur proposée par défaut'}><DefautInput def={c.def} value={x.defaut} onChange={(v) => setC(c.k, { defaut: v })} label={c.label} /></Field> : null}
                </div> : null}
              </div>);
          })}
        </div>
      </Group>
      <Group label="Champs personnalisés" help="Vos propres informations à relever : elles s’affichent dans le journal, les fiches de lot et de cuve, les registres, les rapports, et peuvent être pré-remplies dans les fiches à imprimer.">
        <div className="space-y-2" data-fe-persos="">
          {cfg.perso.map((p, i) => (
            <div key={p.id || i} className="fe-ligne" data-fe-perso={p.label}>
              <div className="fe-tete">
                <span className="fe-nom"><b>{p.label}</b><Chip>{cpTypeLabel(p.type)}</Chip>{p.obligatoire ? <Chip tone="warn">obligatoire</Chip> : null}{p.journal === false ? <Chip title="Pas dans le journal ni les résumés">discret</Chip> : null}
                  <span className="text-xs text-ink2">{p.position === 'debut' ? 'en haut du formulaire' : 'en bas du formulaire'}{p.unite ? ` · ${p.unite}` : ''}{p.type === 'calcul' ? ` · = ${p.formule}` : ''}{(p.options || []).length ? ` · ${p.options.join(' / ')}` : ''}</span></span>
                <span className="fe-ctl"><Btn size="sm" disabled={!i} onClick={() => movePerso(i, -1)} aria-label={`Monter ${p.label}`}>↑</Btn><Btn size="sm" disabled={i === cfg.perso.length - 1} onClick={() => movePerso(i, 1)} aria-label={`Descendre ${p.label}`}>↓</Btn><Btn size="sm" onClick={() => setEd({ i })} aria-label={`Modifier le champ ${p.label}`}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => delPerso(i)} aria-label={`Retirer le champ ${p.label}`}>✕</Btn></span>
              </div>
            </div>))}
          {!cfg.perso.length ? <div className="text-sm text-ink2">Aucun champ personnalisé : ex. « Température en fin d’opération », « Contrôle visuel effectué », « Heure de début », « Pression (bar) »…</div> : null}
          <Btn kind="primary" size="sm" onClick={() => setEd({ i: -1 })}>+ Ajouter un champ</Btn>
        </div>
      </Group>
      {ed ? <ChampPersoForm init={ed.i >= 0 ? cfg.perso[ed.i] : null} autres={cfg.perso.filter((_, k) => k !== ed.i)} onClose={() => setEd(null)}
        onSave={(p) => { setCfg((x) => ({ ...x, perso: ed.i >= 0 ? x.perso.map((y, k) => (k === ed.i ? p : y)) : [...x.perso, p] })); setEd(null); }} /> : null}
    </FormSheet>
  );
}
// un champ personnalisé : type, nom, unité, bornes, choix, formule, valeur par défaut, place
function ChampPersoForm({ init, autres, onSave, onClose }) {
  const [p, setP] = useState(() => ({ type: 'texte', label: '', unite: '', dec: '', min: '', max: '', options: [], formule: '', obligatoire: false, defaut: '', aide: '', position: 'fin', journal: true, ...(init ? clone(init) : {}), ...(init && init.journal === false ? { journal: false } : { journal: true }) }));
  const [opts, setOpts] = useState(() => ((init && init.options) || []).join('\n')); const [err, setErr] = useState('');
  const upd = (x) => setP((y) => ({ ...y, ...x })); const num1 = CP_NUM.includes(p.type); const choix = ['liste', 'multi'].includes(p.type);
  const codes = autres.map((x) => x.code || codeDe(x.label)); const code = p.code || (() => { const b = codeDe(p.label); let c = b; let k = 2; while (codes.includes(c) || FORMULE_STD.some((s) => s[0] === c) || ['min', 'max', 'abs', 'arrondi'].includes(c)) { c = `${b}${k}`; k += 1; } return c; })();
  const vars = [...FORMULE_STD, ...autres.filter((x) => CP_NUM.includes(x.type)).map((x) => [x.code || codeDe(x.label), x.label])];
  const L = opts.split('\n').map((x) => x.trim()).filter(Boolean);
  let fErr = ''; if (p.type === 'calcul' && p.formule.trim()) { try { const a = formuleAnalyser(p.formule); const inc = a.vars.filter((v) => !vars.some((x) => x[0] === v)); if (inc.length) fErr = `variable inconnue « ${inc[0]} »`; } catch (e) { fErr = e.message; } }
  const essai = p.type === 'calcul' && p.formule.trim() && !fErr ? formuleEval(p.formule, Object.fromEntries(vars.map(([v]) => [v, 10]))) : null;
  const ok = () => {
    setErr(''); const label = p.label.trim(); if (!label) { setErr('Donnez un nom au champ.'); return; }
    if (autres.some((x) => norm(x.label) === norm(label))) { setErr(`Un champ « ${label} » existe déjà.`); return; }
    if (choix && !L.length) { setErr('Ajoutez au moins un choix (un par ligne).'); return; }
    if (p.type === 'calcul' && (!p.formule.trim() || fErr)) { setErr(`Formule : ${fErr || 'à écrire'}.`); return; }
    if (p.type === 'nombre' && hasNum(p.min) && hasNum(p.max) && num(p.min) > num(p.max)) { setErr('Le minimum dépasse le maximum.'); return; }
    onSave({ ...p, label, code, options: choix ? L : undefined, id: p.id || nouvelIdChamp(), defaut: p.type === 'calcul' ? undefined : p.defaut });
  };
  return (
    <FormSheet title={init ? `Champ « ${init.label} »` : 'Nouveau champ personnalisé'} sub="Il s’ajoute au formulaire de cette opération." onClose={onClose} onSave={ok} saveLabel={init ? 'Appliquer' : 'Ajouter le champ'}>
      <G><Field label="Nom du champ"><TI value={p.label} onChange={(v) => upd({ label: v })} placeholder="ex. Température en fin d’opération" aria-label="Nom du champ" autoFocus={!init} /></Field>
        <Field label="Type"><select className="inp" value={p.type} onChange={(e) => upd({ type: e.target.value, defaut: '' })} aria-label="Type de champ">{CP_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field></G>
      {num1 || p.type === 'texte' ? <G n={3}><Field label="Unité (facultatif)"><TI value={p.unite || ''} onChange={(v) => upd({ unite: v })} placeholder={num1 ? 'ex. °C, bar, g/L' : 'ex. réf.'} aria-label="Unité" /></Field>
        {num1 ? <Field label="Décimales"><select className="inp" value={hasNum(p.dec) ? String(p.dec) : ''} onChange={(e) => upd({ dec: e.target.value })} aria-label="Décimales"><option value="">auto</option>{[0, 1, 2, 3, 4].map((d) => <option key={d} value={d}>{d}</option>)}</select></Field> : <div />}
        {p.type === 'nombre' ? <div className="grid grid-cols-2 gap-2"><Field label="Minimum"><NI value={p.min ?? ''} onChange={(v) => upd({ min: v })} aria-label="Minimum" /></Field><Field label="Maximum"><NI value={p.max ?? ''} onChange={(v) => upd({ max: v })} aria-label="Maximum" /></Field></div> : <div />}</G> : null}
      {choix ? <Field label="Choix proposés (un par ligne)"><TA value={opts} onChange={setOpts} rows={4} placeholder={'Conforme\nÀ surveiller\nNon conforme'} aria-label="Choix proposés" /></Field> : null}
      {p.type === 'calcul' ? <Group label="Formule" help={fErr ? <span className="text-bad">Formule : {fErr}.</span> : essai != null ? `Essai avec 10 pour chaque variable : ${fmt(essai, 2)}` : 'Opérations + − × ÷ et parenthèses ; fonctions min( ), max( ), abs( ), arrondi(x ; décimales).'}>
        <TI value={p.formule} onChange={(v) => upd({ formule: v })} placeholder="ex. tempfin - tempdebut" aria-label="Formule" spellCheck={false} />
        <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Variables disponibles">{vars.map(([v, l]) => <button key={v} type="button" className="chip" style={{ cursor: 'pointer' }} title={l} onClick={() => upd({ formule: `${p.formule}${p.formule && !/[\s(+\-*/]$/.test(p.formule) ? ' ' : ''}${v}` })}>{v}</button>)}</div>
      </Group> : null}
      {p.type !== 'calcul' ? <Field label={p.type === 'ouinon' ? 'Coché par défaut' : 'Valeur par défaut (facultatif)'}>{p.type === 'ouinon' ? <Check checked={p.defaut === true} onChange={(v) => upd({ defaut: v })} label="oui" />
        : p.type === 'liste' ? <select className="inp" value={p.defaut || ''} onChange={(e) => upd({ defaut: e.target.value })} aria-label="Valeur par défaut"><option value="">— aucune —</option>{L.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        : p.type === 'multi' ? <div className="flex flex-wrap gap-1.5">{L.map((o) => { const d = [].concat(p.defaut || []).filter(Boolean); return <button key={o} type="button" className={cx('opr-tog', d.includes(o) && 'on')} aria-pressed={d.includes(o)} onClick={() => upd({ defaut: d.includes(o) ? d.filter((x) => x !== o) : [...d, o] })}>{o}</button>; })}</div>
        : p.type === 'date' ? <DI value={p.defaut || ''} onChange={(v) => upd({ defaut: v })} aria-label="Valeur par défaut" /> : p.type === 'heure' ? <input className="inp" type="time" value={p.defaut || ''} onChange={(e) => upd({ defaut: e.target.value })} aria-label="Valeur par défaut" />
        : p.type === 'nombre' ? <NI value={p.defaut || ''} onChange={(v) => upd({ defaut: v })} aria-label="Valeur par défaut" /> : <TI value={p.defaut || ''} onChange={(v) => upd({ defaut: v })} aria-label="Valeur par défaut" />}</Field> : null}
      <Field label="Aide affichée sous le champ (facultatif)"><TI value={p.aide || ''} onChange={(v) => upd({ aide: v })} aria-label="Aide du champ" /></Field>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="inline-flex items-center gap-2 text-sm">Place :<select className="inp" style={{ width: 'auto' }} value={p.position} onChange={(e) => upd({ position: e.target.value })} aria-label="Place du champ"><option value="debut">en haut du formulaire</option><option value="fin">en bas (avant opérateurs et notes)</option></select></span>
        {p.type !== 'calcul' ? <Check checked={!!p.obligatoire} onChange={(v) => upd({ obligatoire: v })} label={p.type === 'ouinon' ? 'Obligatoire (doit être coché pour valider)' : 'Obligatoire pour valider'} /> : null}
        <Check checked={p.journal !== false} onChange={(v) => upd({ journal: v })} label="Afficher dans le journal et les résumés" />
      </div>
      <div className="text-xs text-ink2">Code pour les formules : <b className="num">{code}</b></div>
      {err ? <div className="login-err" role="alert">{err}</div> : null}
    </FormSheet>
  );
}
