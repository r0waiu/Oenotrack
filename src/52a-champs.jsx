/* ============ FORMULAIRES D'OPÉRATION : champs réglables et champs personnalisés (0.16.0-alpha.1) ============
   Réglages : Paramètres › Opérations › Formulaire (moteur : 14-formulaires.js). */
const FormCfgCtx = React.createContext(null); // { cfg, type, tout }
const CfReq = () => <span className="cf-req" title="Obligatoire" aria-label="obligatoire"> *</span>;
// champ standard : affiché, replié (cliquer pour l'ouvrir) ou masqué ; libellé, aide et caractère obligatoire réglables
// 0.48.0-alpha.1 : data-champ = k (erreur de validation affichée sous le champ) ; replieTel = nombre d'éléments d'une section facultative
// (intrants, équipements, documents) : au téléphone, elle est repliée tant qu'elle est vide, avec ce compteur
function CF({ k, label, help, children, group, bare, className, replieTel }) {
  const c = useContext(FormCfgCtx); const tel = useTel();
  const e = c ? champEffectif(c.cfg, c.type, k) : { vis: 'visible' };
  if (e.vis === 'masque' && !(c && c.tout)) return null;
  const lab = <>{e.libelle || label}{e.obligatoire ? <CfReq /> : null}{e.vis === 'masque' ? <span className="cf-masque"> · masqué</span> : null}</>;
  const h = e.aide || help;
  // bloc dont le libellé est intérieur (équipements, intrants…) : la mention « obligatoire » et l'aide réglée s'affichent dessous
  const inner = bare ? <div className="min-w-0 cf-bare" data-champ={k}>{(e.obligatoire && k !== 'operateurs') || (e.aide && k !== 'operateurs') ? <div className="min-w-0">{children}<div className="help">{e.obligatoire && k !== 'operateurs' ? <span className="cf-req">* obligatoire</span> : null}{e.obligatoire && e.aide ? ' · ' : ''}{e.aide || ''}</div></div> : children}</div>
    : group ? <Group label={lab} help={h} className={className} champ={k}>{children}</Group> : <Field label={lab} help={h} className={className} champ={k}>{children}</Field>;
  if (e.vis === 'replie' && !(c && c.tout)) return <details className={cx('cf-replie', className)} data-champ={k}><summary>{e.libelle || label}{e.obligatoire ? ' *' : ''}</summary><div className="mt-2">{inner}</div></details>;
  if (tel && replieTel != null && !e.obligatoire) return <CfTelReplie k={k} label={e.libelle || label} n={replieTel}>{inner}</CfTelReplie>;
  return inner;
}
// section facultative au téléphone : repliée si elle est vide, son compteur dans le titre (« Équipements utilisés (0) »)
function CfTelReplie({ k, label, n, children }) {
  const [o, setO] = useState(n > 0);
  return <details className="cf-tel-replie" open={o} onToggle={(ev) => setO(ev.currentTarget.open)} data-cf-tel={k}><summary><span>{label}</span><span className="cf-tel-n"> ({n})</span></summary><div className="mt-2">{children}</div></details>;
}
const cfVisible = (c, k) => !c || champEffectif(c.cfg, c.type, k).vis !== 'masque' || c.tout;

// champs personnalisés d'un formulaire (début ou fin)
function ChampsPerso({ defs, tous, f, upd, type }) {
  const v = f.champs || {}; const set = (id, x) => upd({ champs: { ...(f.champs || {}), [id]: x } });
  if (!defs.length) return null;
  const calc = champsNumeriques(tous, v, formuleVarsStd(type, f));
  return <div className="cp-grille" data-champs-perso="">{defs.map((d) => <ChampPerso key={d.id} d={d} v={v[d.id]} calc={calc[d.id]} onChange={(x) => set(d.id, x)} />)}</div>;
}
function ChampPerso({ d, v, calc, onChange }) {
  const lab = <>{d.label}{d.unite && d.type === 'nombre' ? ` (${d.unite})` : ''}{d.obligatoire ? <CfReq /> : null}</>;
  const borne = d.type === 'nombre' && (hasNum(d.min) || hasNum(d.max)) ? `${hasNum(d.min) ? `min ${fmt(d.min)}` : ''}${hasNum(d.min) && hasNum(d.max) ? ' · ' : ''}${hasNum(d.max) ? `max ${fmt(d.max)}` : ''}` : '';
  const hors = d.type === 'nombre' && hasNum(v) && ((hasNum(d.min) && num(v) < num(d.min)) || (hasNum(d.max) && num(v) > num(d.max)));
  const aide = [d.aide, borne, d.type === 'calcul' ? `= ${d.formule}` : ''].filter(Boolean).join(' · ') || undefined;
  const plein = ['texteLong', 'multi'].includes(d.type);
  const box = (x) => <div className={cx('cp-champ', plein && 'plein', hors && 'hors')} data-champ-perso={d.id}>{x}</div>;
  switch (d.type) {
    case 'texteLong': return box(<Field label={lab} help={aide}><TA value={v || ''} onChange={onChange} rows={3} aria-label={d.label} /></Field>);
    case 'nombre': return box(<Field label={lab} help={hors ? `Hors limites (${borne})` : aide}><NI value={v ?? ''} onChange={onChange} aria-label={d.label} /></Field>);
    case 'calcul': return box(<Group label={lab} help={aide}><div className="cp-calc num" aria-label={d.label} data-calcul={d.id}>{calc != null ? `${fmtChamp(calc, d.dec)}${d.unite ? ` ${d.unite}` : ''}` : '—'}</div></Group>);
    case 'date': return box(<Field label={lab} help={aide}><DI value={v || ''} onChange={onChange} aria-label={d.label} /></Field>);
    case 'heure': return box(<Field label={lab} help={aide}><input className="inp" type="time" value={v || ''} onChange={(e) => onChange(e.target.value)} aria-label={d.label} /></Field>);
    case 'ouinon': return box(<Group label={<span className="sr-only">{d.label}</span>} help={aide}><div className="pt-1"><Check checked={v === true} onChange={(x) => onChange(!!x)} label={<>{d.label}{d.obligatoire ? <CfReq /> : null}</>} /></div></Group>);
    case 'liste': return box(<Field label={lab} help={aide}><select className="inp" value={v || ''} onChange={(e) => onChange(e.target.value)} aria-label={d.label}><option value="">—</option>{(d.options || []).map((o) => <option key={o} value={o}>{o}</option>)}{v && !(d.options || []).includes(v) ? <option value={v}>{v}</option> : null}</select></Field>);
    case 'multi': { const L = Array.isArray(v) ? v : []; return box(<Group label={lab} help={aide}><div className="flex flex-wrap gap-1.5" role="group" aria-label={d.label}>{(d.options || []).map((o) => <button key={o} type="button" className={cx('opr-tog', L.includes(o) && 'on')} aria-pressed={L.includes(o)} onClick={() => onChange(L.includes(o) ? L.filter((x) => x !== o) : [...L, o])}>{o}</button>)}</div></Group>); }
    default: return box(<Field label={lab} help={aide}><div className="flex items-center gap-2"><TI value={v || ''} onChange={onChange} aria-label={d.label} />{d.unite ? <span className="text-sm text-ink2">{d.unite}</span> : null}</div></Field>);
  }
}
