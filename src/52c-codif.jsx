/* ============ CODE DU LOT DANS LES FORMULAIRES (0.41.0-alpha.1) ============
   Encadré « 🏷 Code du lot » : n'apparaît que si une règle de codification est en vigueur pour le stade à la date de l'opération.
   Choix demandés par la règle (marque, cuvée, format…), repris de l'étape précédente ; code proposé mis à jour en direct tant
   qu'il n'a pas été modifié à la main ; « ↺ Code proposé » le rétablit. f.codifAuto : dernier code proposé (null = code imposé). */
function CodifChoixSelects({ db, stade, date, choix, onChange }) {
  const T = codifChoixTables(db, stade, date); if (!T.length) return null;
  return (<div className="flex flex-wrap gap-2" data-codif-choix>
    {T.map((t) => (<label key={t.id} className="text-sm" style={{ minWidth: 150 }}><span className="lbl">{t.nom}</span>
      <SI plain value={(choix || {})[t.id] || ''} onChange={(v) => onChange({ ...(choix || {}), [t.id]: v })} aria-label={t.nom} options={[{ value: '', label: '—' }, ...(t.lignes || []).map((l) => ({ value: l.id, label: `${l.libelle || l.cle}${l.code ? ` (${l.code})` : ''}` }))]} /></label>))}
  </div>);
}
// stadeFixe / ctxFixe : code hors opération (habillage, mise en carton)
function CodifCode({ db, Rd, type, f, upd, old, champ = 'code', sansCode, ctxPlus, stadeFixe, ctxFixe }) {
  const stade = stadeFixe || codifStadePourOp(db, type, f); const actif = !!stade && codifActif(db, stade, f.date);
  const ctx = useMemo(() => (!actif ? null : ctxFixe || { ...codifCtxForm(db, Rd, type, f, old), ...(ctxPlus || {}) }), [actif, db, Rd, type, f, old, ctxPlus, ctxFixe]);
  const g = useMemo(() => (ctx ? codifGenerer(db, stade, ctx) : null), [ctx, db, stade]);
  // choix repris de l'étape précédente (marque, cuvée…) quand ils ne sont pas encore faits
  useEffect(() => { if (!actif || old || !ctx || !ctx.parent || !ctx.parent.codif) return; const h = codifChoixHerites(db, stade, f.date, ctx.parent.codif); const k = Object.keys(h).filter((x) => !(f.codifChoix || {})[x]); if (k.length) upd({ codifChoix: { ...(f.codifChoix || {}), ...Object.fromEntries(k.map((x) => [x, h[x]])) } }); }, [actif, ctx && ctx.parent && ctx.parent.code]);
  const auto = !old && f.codifAuto !== null && (f.codifAuto === undefined || String(f[champ] || '') === String(f.codifAuto || ''));
  useEffect(() => { if (sansCode || !g || !g.ok || !g.code || !auto || f[champ] === g.code) return; upd({ [champ]: g.code, codifAuto: g.code }); }, [g && g.code, auto]);
  if (!actif) return null;
  const st = codifStadeDef(stade) || {}; const manuel = !sansCode && g && g.ok && g.code && String(f[champ] || '').trim() !== g.code;
  return (<div className="rounded-md border border-line p-2 text-sm grid gap-2" data-codif={stade}>
    <div className="flex flex-wrap items-center gap-2"><b>🏷 Code du lot</b><span className="text-ink2">— règle « {st.label || stade} »</span>
      {g && g.ok && g.code && !sansCode ? <span className="num" translate="no" data-codif-propose>{g.code}</span> : null}
      {manuel ? <><Chip>✎ modifié à la main</Chip><Btn kind="ghost" size="sm" onClick={() => upd({ [champ]: g.code, codifAuto: g.code })}>↺ Code proposé</Btn></> : null}
    </div>
    <CodifChoixSelects db={db} stade={stade} date={f.date} choix={f.codifChoix} onChange={(v) => upd({ codifChoix: v })} />
    {g && !g.ok ? <p className="text-bad" role="alert">{g.msg}</p> : null}
    {g && (g.avert || []).length ? <p className="text-warn">{g.avert.join(' ')}</p> : null}
    {sansCode ? <p className="help">Les codes de chaque lot ci-dessous suivent la règle ; chacun reste modifiable.</p> : <p className="help">Le code suit la règle de codification réglée dans Paramètres › Codification des lots ; il reste modifiable pour une exception.</p>}
  </div>);
}
// étape : nouveau code proposé quand le lot passe à un stade choisi dans la règle « Vinification »
function CodifEtape({ db, Rd, f, upd, old }) {
  const dec = codifDeclencheurs(db); const actif = codifActif(db, 'vinification', f.date); const prevu = actif && f.newStade && dec.includes(f.newStade);
  useEffect(() => { if (!old && prevu && f.codifAttribuer === undefined) upd({ codifAttribuer: true }); if (!old && !prevu && f.codifAttribuer && !f.nouveauCode) upd({ codifAttribuer: undefined }); }, [prevu]);
  if (!prevu && !f.codifAttribuer && !(old && old.nouveauCode)) return null;
  return (<div className="grid gap-2">
    <Check checked={f.codifAttribuer} onChange={(v) => upd({ codifAttribuer: v })} label="Attribuer un nouveau code au lot (l’ancien reste cherchable)" />
    {f.codifAttribuer ? <><Field label="Nouveau code du lot"><TI value={f.nouveauCode || ''} onChange={(v) => upd({ nouveauCode: v })} aria-label="Nouveau code du lot" /></Field>
      <CodifCode db={db} Rd={Rd} type="etape" f={f} upd={upd} old={old} champ="nouveauCode" /></> : null}
  </div>);
}
