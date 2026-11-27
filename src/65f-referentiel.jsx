/* ============ INTRANTS › RÉFÉRENTIEL RÉGLEMENTAIRE (0.40.0-alpha.1) ============
   Référentiel préétabli (16t-referentiel) : activation, référentiels de chaque revendication de l'exploitation, matrice composés × labels
   (statut, dose maximale, teneur maximale, condition, source), plafonds de SO₂ total, corrections de l'exploitation (tracées).
   Synthèse « Produits du catalogue » : vue commune aux sous-onglets « Produits & règles par revendication » et « Revendications & plafonds ». */
const refStatutChip = (st, title) => (st === 'non' ? <Chip tone="bad" title={title}>interdit</Chip> : st === 'condition' ? <Chip tone="warn" title={title}>sous condition</Chip> : st === 'oui' ? <Chip tone="good" title={title}>autorisé</Chip> : <span className="text-xs text-ink2">non relevé</span>);
const refNb = (v) => fmt(v, v < 1 ? 2 : Number.isInteger(v) ? 0 : 1);
function RefCellule({ c, onEdit }) {
  const r = c.propre || (c.eff ? { ...c.eff, statut: c.eff.statut } : null);
  if (!r) return <span className="text-xs text-ink2">non relevé</span>;
  const tip = [r.condition || (c.eff && c.eff.conditions.map((x) => x.texte).join(' · ')) || '', r.source || '', r.ref || ''].filter(Boolean).join(' — ');
  const verif = c.propre && !c.propre.exception ? (c.propre.aVerifier ? <span className="text-xs text-warn" data-ref-verif="non">à vérifier</span> : <span className="text-xs text-ok" data-ref-verif="oui" title={tip}>✓ vérifié</span>) : null;
  return (
    <div className="flex flex-col items-start gap-0.5" data-ref-cellule={`${c.label}|${(c.propre || c.eff).compose}`}>
      <span className="flex flex-wrap items-center gap-1">{refStatutChip(r.statut, tip)}{c.herite ? <span className="text-xs text-ink2" title={tip}>(<span translate="no">{refLabelNom(c.eff.statutPar)}</span>)</span> : null}{c.propre && c.propre.exception ? <Chip tone="info">corrigé</Chip> : null}</span>
      {verif}
      {r.doseMax != null ? <span className="text-xs"><span>dose max</span> <b className="num" translate="no">{refNb(r.doseMax)} g/hL</b></span> : null}
      {r.teneurMax != null ? <span className="text-xs"><span>teneur max</span> <b className="num" translate="no">{refNb(r.teneurMax)} mg/L</b></span> : null}
      {onEdit ? <button type="button" className="linkish text-xs" onClick={onEdit}>Corriger</button> : null}
    </div>
  );
}
function RefExceptionForm({ cle, onClose }) {
  const { db, act, uid } = useApp(); const [lab, comp, vin] = cle.split('|'); const so2 = comp === 'so2t';
  const cur = so2 ? refSo2(db, lab, vin) : refRegle(db, lab, comp); const ex = refReglage(db).exceptions[cle];
  const [f, set] = useDraft(so2 ? { valeur: cur ? String(cur.valeur) : '', note: cur ? cur.note || '' : '' } : { statut: (cur && cur.statut) || 'oui', doseMax: cur && cur.doseMax != null ? String(cur.doseMax) : '', teneurMax: cur && cur.teneurMax != null ? String(cur.teneurMax) : '', condition: (cur && cur.condition) || '' });
  const save = () => { const r = act((d) => refExceptionSet(d, cle, f, uid), 'Valeur du référentiel corrigée.'); if (r && r.ok !== false) onClose(); };
  const retirer = () => { const r = act((d) => refExceptionSet(d, cle, null, uid), 'Valeur d’origine rétablie.'); if (r && r.ok !== false) onClose(); };
  return (
    <FormSheet title={<><span>Corriger le référentiel</span> · <span translate="no">{refLabelNom(lab)} · {so2 ? `SO₂ total, ${vinTypeLabel(vin)}` : (refCompose(comp) || {}).label}</span></>} sub="Correction de l’exploitation, après vérification dans le texte en vigueur : elle remplace la valeur d’exemple et elle est tracée." onClose={onClose} onSave={save} extraFooter={ex ? <Btn className="mr-auto" onClick={retirer}>Rétablir la valeur d’origine</Btn> : null}>
      {so2 ? <G><Field label="SO₂ total maximal (mg/L)"><NI value={f.valeur} onChange={(v) => set('valeur', v)} /></Field><Field label="Précision"><TI value={f.note} onChange={(v) => set('note', v)} /></Field></G> : (<>
        <Field label="Statut"><SI value={f.statut} onChange={(v) => set('statut', v)} options={Object.keys(REG_STATUTS).map((k) => ({ value: k, label: REG_STATUTS[k] }))} /></Field>
        {f.statut !== 'non' ? <G><Field label="Dose maximale (g/hL du composé)"><NI value={f.doseMax} onChange={(v) => set('doseMax', v)} placeholder="aucune" /></Field><Field label="Teneur maximale dans le vin (mg/L)"><NI value={f.teneurMax} onChange={(v) => set('teneurMax', v)} placeholder="aucune" /></Field></G> : null}
        <Field label="Condition"><TI value={f.condition} onChange={(v) => set('condition', v)} /></Field>
      </>)}
      {cur && cur.source ? <p className="help"><span>Source :</span> <span translate="no">{cur.source}</span></p> : null}
    </FormSheet>
  );
}
// 0.43.0-alpha.1 : partie 'revendications' | 'matrice' | 'so2' | 'textes' (sous-onglet « Labels & cahiers des charges ») ; composés des produits des catalogues
function ReferentielView({ partie }) {
  const { db, act } = useApp(); const lect = useLectureSeule('intrants'); const [ex, setEx] = useState(null); const [q, setQ] = useState(''); const [cc, setCc] = useState(null);
  const voir = (x) => !partie || partie === x; const nCc = useMemo(() => { const o = {}; catalogueEntrees(db, {}).forEach((e) => refComposesCatalogue(db, e).forEach((c) => { o[c.id] = (o[c.id] || 0) + 1; })); return o; }, [db]);
  const rg = refReglage(db); const M = useMemo(() => refMatrice(db), [db]); const qs = qualifList(db); const ap = refAppellation(db);
  const rows = M.filter((x) => !q || norm(x.compose.label).includes(norm(q)));
  return (
    <div data-referentiel="">
      {voir('revendications') ? <><Notice tone="info" title="Labels et cahiers des charges préétablis">
        <span>Chaque valeur cite son texte et son article. « ✓ vérifié » : relue dans le texte officiel en vigueur (règlement de l’UE consolidé, Code OIV, cahier des charges de l’appellation ou du label) ; « à vérifier » : non confirmée. Les textes évoluent : revérifiez avant un contrôle. La règle la plus restrictive l’emporte ; une correction de l’exploitation remplace la valeur.</span>
      </Notice>
      <Sec title="Activation" right={lect ? null : <Check checked={rg.actif} onChange={(v) => act((d) => refActiver(d, v), v ? 'Référentiel activé.' : 'Référentiel désactivé.')} label={rg.actif ? 'Activé (alertes à la saisie et sur les lots)' : 'Désactivé'} />}>
        <div className="text-sm"><span>Appellation du vignoble (profil régional) :</span> <b translate="no">{ap ? refLabelNom(ap) : '—'}</b></div>
      </Sec>
      <Sec title="Référentiels de vos revendications">
        <p className="help">Chaque revendication suit la réglementation de l’UE, l’appellation, et les labels cochés (avec ceux qu’ils reprennent). Proposés d’après le nom de la revendication ; modifiables.</p>
        <div data-ref-revendications=""><Tbl rows={qs.map((x) => ({ ...x }))} cols={[
          { h: 'Revendication', r: (x) => <QChip id={x.id} /> },
          { h: 'Labels', r: (x) => { const cur = qualifReferentiels(db, x.id); return <div className="flex flex-wrap gap-x-3 gap-y-1">{REG_LABELS.filter((l) => l.type === 'label').map((l) => <Check key={l.id} disabled={lect} checked={cur.includes(l.id)} label={l.label} onChange={(v) => act((d) => qualifReferentielsSet(d, x.id, v ? [...cur, l.id] : cur.filter((y) => y !== l.id)), 'Référentiels de la revendication enregistrés.')} />)}</div>; } },
          { h: 'Appliqués', r: (x) => <span className="text-xs" translate="no">{refLabelsPour(db, x.id).map((l) => refLabelNom(l.id)).join(' · ')}</span> },
        ]} /></div>
      </Sec>
      </> : null}
      {voir('matrice') ? <Sec title="Composés actifs × référentiels" right={<TI value={q} onChange={setQ} placeholder="Rechercher un composé…" style={{ width: 220 }} aria-label="Rechercher un composé" />}>
        <p className="help">Dose maximale : par traitement ou cumulée, en g/hL du composé. Teneur maximale : résiduelle ou cumulée dans le vin, en mg/L de l’espèce dosée. « Non relevé » : aucune règle propre, celle des référentiels repris s’applique.</p>
        <div className="overflow-x-auto" data-ref-matrice=""><table className="tbl text-sm"><thead><tr><th>Composé</th>{REG_LABELS.map((l) => <th key={l.id} title={l.note}><span translate="no">{l.court}</span></th>)}</tr></thead>
          <tbody>{rows.map((x) => <tr key={x.compose.id}><td><b translate="no">{x.compose.label}</b>{x.compose.espece ? <div className="text-xs text-ink2"><span>dosé :</span> <span translate="no">{REG_ESPECES[x.compose.espece]}</span></div> : null}<div><button type="button" className="linkish text-xs" onClick={() => setCc(x.compose.id)} data-compose-catalogue={x.compose.id}>{`${fmt(nCc[x.compose.id] || 0)} produit(s) des catalogues`}</button></div></td>
            {x.cellules.map((c) => <td key={c.label}><RefCellule c={c} onEdit={lect ? null : () => setEx(`${c.label}|${x.compose.id}`)} /></td>)}</tr>)}</tbody></table></div>
      </Sec> : null}
      {voir('so2') ? <Sec title="SO₂ total maximal des labels et cahiers des charges (mg/L)">
        <div data-ref-so2=""><Tbl rows={REG_LABELS.flatMap((l) => VINS_TYPES.filter((v) => v.id !== 'tous').map((v) => ({ id: `${l.id}|${v.id}`, l, v, r: refSo2(db, l.id, v.id) }))).filter((x) => x.r)} cols={[
          { h: 'Référentiel', r: (x) => <b translate="no">{x.l.label}</b> }, { h: 'Vins', r: (x) => vinTypeLabel(x.v.id) },
          { h: 'SO₂ total max', cls: 'r', r: (x) => <b className="num" translate="no">{fmt(x.r.valeur, 0)} mg/L</b> },
          { h: 'Précision', r: (x) => <span className="text-xs" translate="no">{x.r.note || '—'}</span> }, { h: 'Source', r: (x) => <span className="text-xs text-ink2" translate="no">{x.r.source}{x.r.ref ? ` — ${x.r.ref}` : ''}</span> },
          { h: '', r: (x) => <span className="flex flex-wrap gap-1">{x.r.exception ? <Chip tone="info">corrigé</Chip> : x.r.aVerifier ? <Chip tone="warn">à vérifier</Chip> : <Chip tone="good">vérifié</Chip>}{lect ? null : <Btn size="sm" onClick={() => setEx(`${x.l.id}|so2t|${x.v.id}`)}>Corriger</Btn>}</span> },
        ]} /></div>
      </Sec> : null}
      {voir('textes') ? <Sec title="Textes de référence">
        <ul className="list-disc pl-5 text-sm">{REG_LABELS.map((l) => <li key={l.id}><b translate="no">{l.label}</b> : <span translate="no">{REG_TEXTES[l.texte]}</span>{l.note ? <span className="text-ink2" translate="no"> — {l.note}</span> : null}</li>)}</ul>
      </Sec> : null}
      {ex ? <RefExceptionForm cle={ex} onClose={() => setEx(null)} /> : null}
      {cc ? <ComposeCatalogueSheet composeId={cc} onClose={() => setCc(null)} /> : null}
    </div>
  );
}
// avis du référentiel dans une cellule de règle (Produits & règles par revendication)
function RefAvisChip({ avis }) {
  const a = avis; if (!a) return null;
  const tip = a.conditions.map((x) => `${refLabelNom(x.label)} : ${x.texte}`).join(' · ');
  if (a.interdit) return <Chip tone="bad" title={tip} data-ref-avis="non"><span>référentiel : interdit</span> <span translate="no">{`(${refLabelNom(a.interditPar)})`}</span></Chip>;
  if (a.doseMax != null) return <Chip tone={a.conditions.length ? 'warn' : ''} title={tip} data-ref-avis="dose"><span>référentiel : max</span> <span translate="no">{`${refNb(a.doseMax)} ${a.du} (${refLabelNom(a.dosePar)})`}</span></Chip>;
  if (a.conditions.length) return <Chip tone="warn" title={tip} data-ref-avis="condition">référentiel : sous condition</Chip>;
  return <Chip tone="good" title={tip} data-ref-avis="oui">référentiel : autorisé</Chip>;
}
// synthèse par revendication : la même donnée que l'onglet « Produits & règles », vue depuis « Revendications & plafonds »
function RevendicationSyntheseSec() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('intrants'); const qs = qualifList(db);
  const [q, setQ] = useState((qs.find((x) => x.id === 'bio') || qs[0] || {}).id || 'conv'); const [ecarts, setEcarts] = useState(false);
  const S = useMemo(() => revendicationSynthese(db, q), [db, q]); const rows = S.filter((x) => !ecarts || x.conflit || x.ecartRef);
  const nE = S.filter((x) => x.conflit || x.ecartRef).length;
  return (
    <Sec title="Produits du catalogue de l’exploitation pour cette revendication" right={<div className="flex flex-wrap items-center gap-2"><SI value={q} onChange={setQ} style={{ width: 'auto' }} options={qs.map((x) => ({ value: x.id, label: qLabel(x.id) }))} aria-label="Revendication" /><Check checked={ecarts} onChange={setEcarts} label={`Écarts seulement (${nE})`} />{lect || !refActif(db) ? null : <Btn onClick={() => act((d) => reglesDepuisReferentiel(d, q, uid), 'Règles alignées sur le référentiel (à vérifier).')} data-ref-aligner-tout="">⚖ Aligner sur le référentiel</Btn>}</div>}>
      <p className="help">Règle du produit (onglet « Produits & règles par revendication »), règles de substance ci-dessus et avis du référentiel réglementaire : la règle effective, la plus restrictive, est celle qu’appliquent les opérations et les alertes. Toute modification ici ou là-bas se voit aussitôt des deux côtés.</p>
      <div data-ref-synthese={q}><Tbl rows={rows} empty="Aucun produit (hors matières sèches)." cols={[
        { h: 'Produit', r: (x) => <div><b translate="no">{x.p.nom}</b>{x.composes.length ? <div className="text-xs text-ink2" translate="no">{x.composes.map((c) => `${(refCompose(c.id) || {}).label}${c.part < 1 ? ` (${fmt(c.part * 100, 1)} %)` : ''}`).join(', ')}</div> : <div className="text-xs text-ink2">composé non reconnu</div>}</div> },
        { h: 'Règle du produit', r: (x) => (x.base ? <span>{x.base.autorise ? <Chip tone="good">autorisé</Chip> : <Chip tone="bad">interdit</Chip>}{x.base.autorise && hasNum(x.base.doseMax) ? <span className="num ml-1 text-xs" translate="no">{refNb(num(x.base.doseMax))} {doseUnit(x.p.unite)}</span> : null}{x.base.aVerifier ? <Chip tone="warn" className="ml-1">à vérifier</Chip> : null}</span> : <span className="text-xs text-ink2">—</span>) },
        { h: 'Référentiel', r: (x) => (x.ref ? <RefAvisChip avis={{ ...x.ref, du: doseUnit(x.p.unite) }} /> : <span className="text-xs text-ink2">—</span>) },
        { h: 'Règle effective', r: (x) => (x.eff ? <span>{x.eff.autorise ? <Chip tone="good">autorisé</Chip> : <Chip tone="bad">interdit</Chip>}{x.eff.autorise && x.eff.doseMax != null ? <span className="num ml-1 text-xs" translate="no">max {refNb(num(x.eff.doseMax))} {doseUnit(x.p.unite)}</span> : null}</span> : <Chip tone="bad">interdit</Chip>) },
        { h: '', r: (x) => <span className="flex flex-wrap gap-1">{x.conflit ? <Chip tone="warn" title="La règle du produit est moins restrictive que la règle effective">restreint</Chip> : null}{x.ecartRef && !lect ? <Btn size="sm" onClick={() => act((d) => regleDepuisReferentiel(d, x.id, q, uid), 'Règle alignée sur le référentiel (à vérifier).')} data-ref-aligner={x.id}>Aligner</Btn> : null}</span> },
      ]} /></div>
    </Sec>
  );
}
// composés actifs d'un produit (fiche du produit) : devinés d'après le nom (auto), ou choisis (liste : [{ id, part en % }]) ; null = devinés
function ComposesChoix({ auto, liste, onChange }) {
  const L = liste || auto.map((x) => ({ id: x.id, part: x.supposee ? '' : String(r2(x.part * 100)) }));
  return (
    <div className="space-y-1" data-composes="">
      {L.length ? null : <div className="text-sm text-ink2">Aucun composé reconnu.</div>}
      {L.map((x, i) => <div key={x.id} className="flex flex-wrap items-center gap-2"><span className="text-sm" translate="no">{(refCompose(x.id) || {}).label}</span>
        <input className="inp num" style={{ maxWidth: 90, minHeight: 30 }} inputMode="decimal" value={x.part} placeholder="100" aria-label="Teneur du produit en composé (%)" onChange={(e) => onChange(L.map((y, k) => (k === i ? { ...y, part: e.target.value } : y)))} /><span className="text-xs text-ink2">%</span>
        <Btn size="sm" kind="ghost" onClick={() => onChange(L.filter((_, k) => k !== i))} aria-label="Retirer">✕</Btn></div>)}
      <SI value="" onChange={(v) => { if (v) onChange([...L, { id: v, part: '' }]); }} placeholder="+ Ajouter un composé…" style={{ width: 'auto' }} options={REG_COMPOSES.filter((k) => !L.some((x) => x.id === k.id)).map((k) => ({ value: k.id, label: k.label }))} aria-label="Ajouter un composé" />
      <div className="help"><span>{liste ? 'Composés choisis pour ce produit.' : 'Reconnus d’après le nom et la composition.'}</span> <span>Teneur vide : produit supposé pur (estimation prudente).</span></div>
      {liste ? <button type="button" className="linkish text-xs" onClick={() => onChange(null)}>Revenir aux composés reconnus</button> : null}
    </div>
  );
}
const composesDepuisChoix = (L) => (L ? L.map((x) => ({ id: x.id, ...(hasNum(x.part) && num(x.part) > 0 ? { part: Math.min(1, num(x.part) / 100) } : {}) })) : null);
const composesVersChoix = (p) => (p && Array.isArray(p.composes) ? p.composes.map((x) => ({ id: x.id, part: hasNum(x.part) ? String(r2(num(x.part) * 100)) : '' })) : null);
