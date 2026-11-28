/* ============ PARAMÈTRES : catalogue des opérations (personnalisation, création, stade automatique, fiche associée) ============ */
// résumé du formulaire personnalisé d'une opération
function formulaireResume(db, catId) {
  const cat = opDef(db, catId); if (!cat) return ''; const f = formulaireDe(db, catId); const type = cat.base || catId;
  const L = champsStd(type).map((c) => champEffectif(f, type, c.k)); const m = L.filter((c) => c.vis === 'masque').length; const r = L.filter((c) => c.vis === 'replie').length; const o = L.filter((c) => c.obligatoire).length; const d = L.filter((c) => c.defaut != null && c.defaut !== '').length;
  const t = [m ? `${m} masqué${m > 1 ? 's' : ''}` : '', r ? `${r} replié${r > 1 ? 's' : ''}` : '', o ? `${o} obligatoire${o > 1 ? 's' : ''}` : '', d ? `${d} valeur${d > 1 ? 's' : ''} par défaut` : '', f.perso.length ? `${f.perso.length} champ${f.perso.length > 1 ? 's' : ''} personnalisé${f.perso.length > 1 ? 's' : ''}` : ''].filter(Boolean);
  return t.length ? t.join(' · ') : '';
}
function OpCatForm({ id, onClose }) {
  const { db, act } = useApp(); const cur = id ? opList(db).find((x) => x.id === id) : null; const M = fichesModeles(db); const [fe, setFe] = useState(false);
  const [f, setF] = useState(() => (cur ? { ...cur, stadeAuto: { actif: false, stade: '', ...(cur.stadeAuto || {}) } }
    : { label: '', base: 'intrant', groupe: OP_GROUPES[2], icone: '', aide: '', motif: '', stadeAuto: { actif: false, stade: '' }, menu: true, creerFiche: true }));
  const upd = (p) => setF((x) => ({ ...x, ...p })); const sa = f.stadeAuto || { actif: false, stade: '' };
  const base = cur ? cur.base : f.base; const usage = cur ? opCatUsage(db, cur.id) : 0;
  const ficheBase = modeleFor(db, base, { sousType: '' });
  const ficheAuto = cur ? modeleAuto(db, base, { sousType: cur.id === cur.base ? '' : cur.id }) : ficheBase;
  const groupes = uniq([...OP_GROUPES, ...opList(db).map((x) => x.groupe).filter(Boolean)]);
  const motifOK = ['intrant', 'suivi', 'sortie'].includes(base); const menuOK = OP_BASES_VISIBLES_MENU.includes(base);
  const stadeOK = VIN_APRES.includes(base) || ['etape', 'assemblage', 'tirage'].includes(base);
  const save = () => {
    const x = { ...(cur ? { id: cur.id } : { base }), label: f.label, groupe: f.groupe, icone: f.icone, aide: f.aide, motif: motifOK ? f.motif : undefined, stadeAuto: stadeOK ? { actif: !!sa.actif, stade: sa.stade } : undefined, menu: menuOK ? !!f.menu : undefined, masque: !!f.masque, ...(cur ? { ficheId: f.ficheId || undefined } : {}) };
    if (!stadeOK) delete x.stadeAuto; if (!motifOK) delete x.motif; if (!menuOK) delete x.menu; if (cur && !f.ficheId) x.ficheId = '';
    const tpl = !cur && f.creerFiche && ficheBase ? (() => { const t = clone(ficheBase); delete t._perso; delete t._defaut; delete t.cartouche; delete t.modifieLe; return t; })() : null;
    const r = act((d) => { const res = opCatSave(d, x, { fiche: tpl }); if (res.ok && cur && !f.ficheId) { const it = d.lists.operations.find((y) => y.id === cur.id); if (it) delete it.ficheId; } return res; }, cur ? 'Opération modifiée.' : `Opération « ${String(f.label).trim()} » créée${tpl ? ' avec sa fiche' : ''}.`);
    if (r && r.ok) onClose();
  };
  return (
    <FormSheet title={cur ? `Opération — ${cur.label}` : 'Nouvelle opération'} sub={cur ? `${cur.custom ? 'Opération personnalisée' : 'Opération d’origine'} · comportement : ${opComportement(base)}${usage ? ` · utilisée ${usage} fois` : ''}` : 'Elle apparaîtra dans « Nouvelle opération », avec sa fiche d’enregistrement imprimable.'} onClose={onClose} onSave={save} saveLabel={cur ? 'Enregistrer' : 'Créer l’opération'}>
      <div className="grid2">
        <Field label="Nom de l’opération"><TI value={f.label} onChange={(v) => upd({ label: v })} placeholder="ex. Tanisage, Mise sous gaz, Contrôle sucres…" aria-label="Nom de l’opération" autoFocus={!cur} /></Field>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'minmax(0,1fr) 84px' }}>
          <Field label="Groupe"><SI plain value={f.groupe} onChange={(v) => upd({ groupe: v })} options={groupes.map((g) => ({ value: g, label: g }))} aria-label="Groupe" /></Field>
          <Field label="Icône"><TI value={f.icone} onChange={(v) => upd({ icone: v })} maxLength={3} placeholder={opIcone(db, base)} aria-label="Icône" /></Field>
        </div>
      </div>
      {cur ? null : (
        <Group label="Comportement (ce que l’opération fait sur les stocks)">
          <div className="grid gap-2" role="radiogroup" aria-label="Comportement" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,250px),1fr))' }}>
            {OP_COMPORTEMENTS.map(([b, l, d]) => (
              <label key={b} className={cx('flex cursor-pointer gap-2 rounded-md border p-2 text-sm', f.base === b ? 'border-accent' : 'border-line')} style={f.base === b ? { background: 'var(--accentSoft, transparent)' } : undefined}>
                <input type="radio" name="op-base" checked={f.base === b} onChange={() => upd({ base: b, menu: OP_BASES_VISIBLES_MENU.includes(b) })} style={{ accentColor: 'var(--accent)' }} />
                <span><b>{OP_BASES_ICONES[b] || '•'} {l}</b><span className="block text-xs text-ink2">{d}</span></span>
              </label>))}
          </div>
        </Group>)}
      <Field label="Aide affichée dans le formulaire (facultatif)"><TA value={f.aide} onChange={(v) => upd({ aide: v })} rows={2} placeholder={OP_HELP[base] || ''} aria-label="Aide" /></Field>
      {motifOK ? <Field label="Objet proposé dans le formulaire" help="Repris dans le journal et les registres (ex. Collage, Vente en vrac)."><TI value={f.motif} onChange={(v) => upd({ motif: v })} placeholder={f.label} aria-label="Objet proposé" /></Field> : null}
      {stadeOK ? (
        <Group label="Changement de stade automatique">
          <div className="rounded-md border border-line p-3">
            <div className="flex flex-wrap items-center gap-3">
              <Check checked={!!sa.actif} onChange={(v) => upd({ stadeAuto: { ...sa, actif: v, stade: sa.stade || (stadeList(db).find((x) => !x.masque) || {}).id || '' } })} label={base === 'etape' ? 'Proposer ce nouveau stade' : base === 'assemblage' ? 'Le lot créé (s’il s’agit de vins) passe au stade' : 'Le lot traité passe au stade'} />
              <select className="inp" style={{ width: 'auto', minWidth: 200 }} value={sa.stade || ''} disabled={!sa.actif} onChange={(e) => upd({ stadeAuto: { ...sa, stade: e.target.value } })} aria-label="Stade appliqué automatiquement">
                <option value="">— choisir —</option>{stadeOptions(db, sa.stade).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {sa.actif && sa.stade ? <StadeChip id={sa.stade} /> : null}
            </div>
            <p className="help mt-2">{base === 'assemblage' ? 'Sinon, le stade suit les règles de mélange des stades (Paramètres › Revendications, stades & listes).' : 'Proposé dans le formulaire (modifiable, ou « Inchangé ») et appliqué seulement s’il fait avancer le vin — jamais un moût ou un vin en fermentation directement vers un stade de la phase Vin.'}</p>
          </div>
        </Group>) : null}
      {cur ? <Group label="Formulaire de saisie" help="Champs affichés, repliés ou masqués, obligatoires, valeurs par défaut, et vos propres champs (texte, nombre, calcul, date, heure, case, listes).">
        <div className="flex flex-wrap items-center gap-2"><span className="text-sm">{formulaireResume(db, cur.id) || 'Formulaire d’origine'}</span><Btn size="sm" onClick={() => setFe(true)}>⚙ Personnaliser le formulaire…</Btn></div>
        {fe ? <FormulaireEditor catId={cur.id} onClose={() => setFe(false)} /> : null}
      </Group> : null}
      <Group label="Fiche d’enregistrement">
        {cur ? (
          <Field label="Fiche imprimée pour cette opération"><SI plain value={f.ficheId || ''} onChange={(v) => upd({ ficheId: v })} aria-label="Fiche associée" options={[{ value: '', label: `Automatique (${(ficheAuto || {}).titre || '—'})` }, ...M.map((m) => ({ value: m.id, label: m.titre }))]} /></Field>
        ) : <Check checked={!!f.creerFiche} onChange={(v) => upd({ creerFiche: v })} label={`Créer une fiche « ${String(f.label).trim() || 'nouvelle opération'} » (copie de « ${(ficheBase || {}).titre || '—'} », modifiable dans Fiches)`} />}
      </Group>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {menuOK ? <Check checked={!!f.menu} onChange={(v) => upd({ menu: v })} label="Raccourci dans le menu d’une cuve (clic droit)" /> : null}
        <Check checked={!!f.masque} onChange={(v) => upd({ masque: v })} label="Masquer (plus proposée à la saisie ; l’historique est conservé)" />
      </div>
    </FormSheet>
  );
}

function OperationsView() {
  const { db, act, confirm } = useApp(); const [ed, setEd] = useState(null); const [q, setQ] = useState(''); const [voir, setVoir] = useState(true); const [fe, setFe] = useState(null);
  const L = opList(db); const D = DEFAULT_OPERATIONS(); const M = fichesModeles(db);
  const modif = (x) => { const d = D.find((y) => y.id === x.id); if (!d) return false; const k = ['label', 'groupe', 'icone', 'aide', 'motif', 'masque', 'menu', 'ficheId']; return k.some((c) => (x[c] || '') !== (d[c] || '')) || JSON.stringify(x.stadeAuto || null) !== JSON.stringify(d.stadeAuto || null); };
  const del = async (x) => { if (await confirm({ title: `Supprimer « ${x.label} » ?`, body: 'L’opération personnalisée disparaît du catalogue (sa fiche créée automatiquement aussi, si elle n’a jamais servi).', ok: 'Supprimer', danger: true })) act((d) => opCatDelete(d, x.id), 'Opération supprimée.'); };
  const groupes = opGroupes(db, (x) => !x.interne && (voir || !x.masque) && (!q || norm(`${x.label} ${x.aide || ''} ${opComportement(x.base)}`).includes(norm(q))), true);
  const nPerso = L.filter((x) => x.custom).length; const nAuto = L.filter((x) => x.stadeAuto && x.stadeAuto.actif).length; const nMasq = L.filter((x) => x.masque && !x.interne).length;
  return (
    <div>
      <Aide id="ops-catalogue" resume="Opérations personnalisables : nom, groupe, formulaire, fiche et changement de stade.">Renommez, regroupez, masquez les opérations, <b>réglez leur formulaire</b> (⚙ Formulaire : champs affichés, repliés ou masqués, obligatoires, valeurs par défaut, champs personnalisés et calculés), choisissez leur fiche d’enregistrement et le <b>changement de stade automatique</b> (ex. soutirage → « vin soutiré », filtration → « vin filtré »). Créez vos propres opérations à partir d’un comportement : elles sont tracées comme les autres et restent lisibles par toutes les versions d’Œnotrack.</Aide>
      <div className="my-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }} data-vg="ops-catalogue">
        <Kpi label="Opérations proposées" value={fmt(L.filter((x) => !x.masque && !x.interne).length)} /><Kpi label="Personnalisées" value={fmt(nPerso)} /><Kpi label="Avec stade automatique" value={fmt(nAuto)} /><Kpi label="Masquées" value={fmt(nMasq)} />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Btn kind="primary" onClick={() => setEd({ id: null })}>＋ Nouvelle opération</Btn>
        <TI value={q} onChange={setQ} placeholder="Rechercher une opération…" style={{ width: 240 }} aria-label="Rechercher une opération" />
        <Check checked={voir} onChange={setVoir} label="Afficher les opérations masquées" />
      </div>
      {!groupes.length ? <Empty>Aucune opération ne correspond.</Empty> : groupes.map((g) => (
        <Sec key={g.title} title={g.title}>
          <div className="space-y-2">{g.items.map((id) => { const x = opDef(db, id); const n = opCatUsage(db, id); const fi = modeleFor(db, x.base, { sousType: x.id === x.base ? '' : x.id }); const sa = x.stadeAuto;
            return (
              <div key={id} className={cx('card flex flex-wrap items-center gap-2 p-3', x.masque && 'opacity-60')} data-op={id}>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-base" aria-hidden="true">{opIcone(db, id)}</span>
                <div className="min-w-0 flex-1" style={{ flexBasis: 220 }}>
                  <div className="flex flex-wrap items-center gap-1.5"><b>{x.label}</b>{x.custom ? <Chip tone="info">perso</Chip> : modif(x) ? <Chip>modifiée</Chip> : null}{x.masque ? <Chip>masquée</Chip> : null}{x.menu && OP_BASES_VISIBLES_MENU.includes(x.base) ? <Chip title="Raccourci dans le menu d’une cuve">menu cuve</Chip> : null}{formulaireResume(db, id) ? <Chip tone="info" title={formulaireResume(db, id)}>formulaire perso</Chip> : null}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink2">
                    <span>{opComportement(x.base)}</span>
                    <span>{sa && sa.actif && stadeDef(db, sa.stade) ? <>stade auto → <StadeChip id={sa.stade} compact /></> : 'pas de changement de stade'}</span>
                    <span>fiche : {fi ? fi.titre : '—'}</span>{n ? <span>{n} enregistrement{n > 1 ? 's' : ''}</span> : null}
                    {x.base === 'apport' ? <span data-via-pressoir="">{`saisie dans l’onglet Pressoir seulement (registre des pesées)${moduleActif(db, 'pressoir') ? '' : ' — onglet masqué'}`}</span> : opViaPressoir(db, { type: id }) === 'marc' ? <span data-via-pressoir="">saisie dans l’onglet Pressoir seulement (pressurages : champs personnalisés repris)</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Btn size="sm" onClick={() => setEd({ id })}>Modifier</Btn>
                  <Btn size="sm" onClick={() => setFe(opViaPressoir(db, { type: id }) === 'pesee' ? 'pesee' : id)} aria-label={`Formulaire de ${x.label}`} title="Champs affichés, obligatoires, valeurs par défaut, champs personnalisés">⚙ Formulaire</Btn>
                  <Btn size="sm" aria-label={`Monter ${x.label}`} onClick={() => act((d) => opCatMove(d, id, -1))}>↑</Btn>
                  <Btn size="sm" aria-label={`Descendre ${x.label}`} onClick={() => act((d) => opCatMove(d, id, 1))}>↓</Btn>
                  <Btn size="sm" onClick={() => act((d) => opCatSave(d, { id, label: x.label, masque: !x.masque }), x.masque ? 'Opération de nouveau proposée.' : 'Opération masquée.')}>{x.masque ? 'Afficher' : 'Masquer'}</Btn>
                  {x.custom ? <Btn size="sm" kind="danger" disabled={n > 0} title={n ? 'Déjà utilisée : masquez-la plutôt' : undefined} onClick={() => del(x)}>Supprimer</Btn>
                    : modif(x) ? <Btn size="sm" onClick={() => act((d) => opCatReset(d, id), 'Réglages d’origine rétablis.')}>Rétablir</Btn> : null}
                </div>
              </div>); })}</div>
        </Sec>))}
      <p className="help">Fiches : chaque opération imprime sa fiche associée (ou celle de son comportement). Les modèles se modifient dans l’onglet Opérations › Fiches ; une opération créée ici reçoit sa propre fiche, copiée du modèle de son comportement.{M.length ? '' : ''}</p>
      {ed ? <OpCatForm id={ed.id} onClose={() => setEd(null)} /> : null}
      {fe ? <FormulaireEditor catId={fe} onClose={() => setFe(null)} /> : null}
    </div>
  );
}

/* ---------- mélanges de stades : règles « A + B = résultat » (assemblages, regroupements) ---------- */
function StadesMelangesEditor() {
  const { db, act } = useApp(); const R0 = stadeMelanges(db); const opts = stadeList(db).filter((x) => !x.masque).map((x) => ({ value: x.id, label: x.court || x.label, full: x.label }));
  const [n, setN] = useState({ a: '', b: '', r: '' }); const [t, setT] = useState({ a: 'mout', b: 'fa' });
  const dflt = (db.settings && db.settings.stadeMelangeDefaut) || 'auto';
  const sel = (v, on, lab) => <select className="inp" style={{ width: '100%', minWidth: 0 }} value={v || ''} onChange={(e) => on(e.target.value)} aria-label={lab} title={v ? stadeLabel(db, v) : ''}><option value="">—</option>{opts.map((o) => <option key={o.value} value={o.value} title={o.full}>{o.label}</option>)}{v && !opts.some((o) => o.value === v) ? <option value={v}>{stadeCourt(db, v)}</option> : null}</select>;
  const add = () => { const r = act((d) => stadeMelangeSave(d, null, n), 'Règle de mélange ajoutée.'); if (r && r.ok) setN({ a: '', b: '', r: '' }); };
  const res = t.a && t.b ? stadeMix(db, [t.a, t.b]) : '';
  const regle = t.a && t.b ? stadeRegle(db, t.a, t.b) : null;
  return (
    <div className="space-y-2">
      <p className="help">Stade du lot obtenu quand on assemble (ou regroupe) des lots à des stades différents. Exemples : moût + vin en fermentation = vin en fermentation ; vin filtré + vin clair = vin clair. Pour l’opération « Assemblage », un mélange de vins prend ensuite son stade automatique (« vin assemblé ») s’il est activé.</p>
      {R0.map((x, i) => (
        <div key={i} className="mixrow rounded-md border border-line p-1.5" style={{ background: 'var(--surface)' }} data-regle={`${x.a}+${x.b}`}>
          {sel(x.a, (v) => act((d) => stadeMelangeSave(d, i, { ...x, a: v })), `Stade A de la règle ${i + 1}`)}<b aria-hidden="true">+</b>
          {sel(x.b, (v) => act((d) => stadeMelangeSave(d, i, { ...x, b: v })), `Stade B de la règle ${i + 1}`)}<b aria-hidden="true">=</b>
          {sel(x.r, (v) => act((d) => stadeMelangeSave(d, i, { ...x, r: v })), `Résultat de la règle ${i + 1}`)}
          <Btn size="sm" kind="danger" aria-label={`Supprimer la règle ${i + 1}`} onClick={() => act((d) => stadeMelangeDelete(d, i), 'Règle supprimée.')}>✕</Btn>
        </div>))}
      <div className="mixrow border-t border-line pt-2">
        {sel(n.a, (v) => setN({ ...n, a: v }), 'Nouvelle règle : stade A')}<b aria-hidden="true">+</b>{sel(n.b, (v) => setN({ ...n, b: v }), 'Nouvelle règle : stade B')}<b aria-hidden="true">=</b>{sel(n.r, (v) => setN({ ...n, r: v }), 'Nouvelle règle : résultat')}
        <Btn kind="primary" size="sm" onClick={add} aria-label="Ajouter la règle" title="Ajouter la règle">+</Btn>
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1"><span className="lbl mb-0">Sans règle</span>
        <select className="inp" style={{ width: 'auto' }} value={dflt} onChange={(e) => act((d) => { d.settings.stadeMelangeDefaut = e.target.value; return okr(); }, 'Règle par défaut enregistrée.')} aria-label="Règle de mélange par défaut">
          <option value="auto">le stade le moins avancé (prudent)</option><option value="max">le stade le plus avancé</option>{opts.map((o) => <option key={o.value} value={o.value}>toujours « {o.label} »</option>)}
        </select>
        <Btn size="sm" onClick={() => act((d) => stadeMelangeReset(d), 'Règles par défaut réajoutées.')}>Réajouter les règles par défaut</Btn>
      </div>
      <div className="rounded-md border border-dashed border-line p-2 text-sm" aria-label="Tester un mélange">
        <div className="lbl">Tester un mélange</div>
        <div className="mixrow t">{sel(t.a, (v) => setT({ ...t, a: v }), 'Tester : stade A')}<b aria-hidden="true">+</b>{sel(t.b, (v) => setT({ ...t, b: v }), 'Tester : stade B')}<b aria-hidden="true">=</b>
          {res ? <span data-test="mix-resultat" className="min-w-0"><StadeChip id={res} /> <span className="text-xs text-ink2">{regle ? '(règle)' : t.a === t.b ? '(même stade)' : '(sans règle)'}</span></span> : <span className="text-ink2">—</span>}</div>
      </div>
    </div>
  );
}
