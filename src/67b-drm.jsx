/* ============ DRM — interface (0.32.0-alpha.1) : Registres › 📮 DRM ============
   Période (mois ou campagne), balance par produit (produits en colonnes, comme dans CIEL), saisie des bouteilles finies sorties du chai,
   contrôles, impression, CSV, fichier XML DTI+ pour CIEL et pour le CIVC, « ✓ Marquer comme déposée ». Réglages : identifiants, produits
   (exemples à vérifier), rattachement manuel des lots. */
const drmPeriodeLabel = (db, key) => {
  const p = drmPeriode(db, key); if (!p) return key; if (p.type === 'A') return `DRA ${p.campagne.nom}`;
  try { return new Date(`${p.ym}-15T12:00:00Z`).toLocaleDateString(LANGUE, { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return p.ym; }
};
const drmHlTexte = (L) => fmt(L / 100, 2);
const drmBt = (L) => fmt(Math.round(L / DRM_BOUTEILLE_L));
// règle de rattachement lisible (chaque mot dans son nœud, pour la traduction)
function DrmRegle({ p }) {
  const { db } = useApp(); if (p.manuel) return <span>rattachement manuel seulement</span>;
  const liste = (L) => L.map((x, i) => <span key={x}>{i ? ', ' : ''}<span>{fracNom(db, x)}</span></span>);
  const parts = [p.nature ? <span key="n">{p.nature === 'tranquille' ? 'vins tranquilles' : 'vins mousseux'}</span> : null, (p.fractions || []).length ? <span key="f"><span>fractions :</span> {liste(p.fractions)}</span> : null, (p.sansFractions || []).length ? <span key="s"><span>sauf</span> {liste(p.sansFractions)}</span> : null].filter(Boolean);
  return parts.length ? <>{parts.map((x, i) => <React.Fragment key={i}>{i ? ' · ' : null}{x}</React.Fragment>)}</> : <span>tous les lots</span>;
}
// message de contrôle : le libellé du produit est une donnée (jamais traduit), la suite est traduite
function DrmMsg({ c }) {
  const lg = useLangue(); if (!c.nom) return <span>{c.msg}</span>;
  return <span><b translate="no">{c.nom}</b>{lg === 'fr' ? ' : ' : ': '}{c.texte}</span>;
}
// case de saisie (bouteilles) : enregistrée à la sortie du champ
function DrmCase({ valeur, onCommit, disabled, label }) {
  const [v, setV] = useState(valeur ? String(valeur) : ''); useEffect(() => { setV(valeur ? String(valeur) : ''); }, [valeur]);
  return <input className="inp num" style={{ width: 92 }} inputMode="numeric" value={v} disabled={disabled} aria-label={label} placeholder="0" onChange={(e) => setV(e.target.value.replace(/[^\d]/g, ''))} onBlur={() => { if (String(v || '') !== String(valeur || '')) onCommit(v); }} />;
}

function DrmView() {
  const { db, act, toast, uid, confirm } = useApp(); const lect = useLectureSeule('registres'); const lectP = useLectureSeule('params');
  const reg = drmReglage(db); const [mode, setMode] = useState(reg.periodicite); const [cle, setCle] = useState(''); const [reglages, setReglages] = useState(false); const [imp, setImp] = useState(false);
  const periodes = useMemo(() => drmPeriodes(db, mode === 'annuelle' ? 'annuelle' : 'mensuelle'), [db, mode]);
  const defaut = mode === 'annuelle' ? (periodes.find((k) => drmFinPeriode(db, k) < todayISO()) || periodes[0]) : (periodes[1] || periodes[0]); // mois précédent, ou dernière campagne close
  const key = periodes.includes(cle) ? cle : defaut;
  const calc = useMemo(() => (key ? drmCalcul(db, key) : null), [db, key]);
  if (!calc) return <Empty>Aucune période à déclarer : enregistrez d’abord des opérations.</Empty>;
  const ctl = drmControles(db, calc); const bl = ctl.filter((c) => c.niveau === 'bloquant'); const al = ctl.filter((c) => c.niveau === 'alerte');
  const actifs = calc.lignes.filter((x) => x.actif); const depose = !!calc.declaration;
  const saisissables = calc.lignes.filter((x) => x.produit && (x.produit.nature === 'mousseux' || x.f0 > 0.005 || x.f1 > 0.005 || drmSaisieDe(db, key, x.produitId)));
  const telecharger = async (civc) => {
    const b = drmControles(db, calc, { civc }).filter((c) => c.niveau === 'bloquant'); if (b.length) { toast(b[0].nom ? 'À compléter avant le dépôt : voyez la liste en haut de la DRM.' : b[0].msg, 'bad'); return; }
    const r = await saveFile(drmNomFichier(calc, 'xml', civc), drmXml(db, calc, { civc }), 'application/xml');
    if (r.ok) toast(civc ? 'Fichier DRM pour le CIVC enregistré : à déposer sur la plateforme du CIVC.' : 'Fichier DRM enregistré : à déposer dans CIEL (import d’un fichier DTI+).'); else if (!r.declined) toast(failMsg(r), 'bad');
  };
  const csv = async () => { const r = await saveFile(drmNomFichier(calc, 'csv'), toCSV(drmCsvLignes(db, calc).map((row) => row.map(csvNum))), 'text/csv;charset=utf-8'); if (r.ok) toast(`Export CSV : ${drmNomFichier(calc, 'csv')}`); else if (!r.declined) toast(failMsg(r), 'bad'); };
  const deposer = async () => {
    if (!(await confirm({ title: 'Marquer cette DRM comme déposée ?', body: 'Ses chiffres sont gardés tels quels : la DRM suivante doit repartir de ses stocks de fin, et une modification ultérieure d’une opération de la période sera signalée.', ok: 'Marquer comme déposée' }))) return;
    act((d) => drmDeposer(d, key, uid), 'DRM marquée comme déposée.');
  };
  const rouvrir = async () => { if (!(await confirm({ title: 'Rouvrir cette DRM ?', body: 'Elle redevient modifiable (saisies des bouteilles) ; ses chiffres seront recalculés.', ok: 'Rouvrir', danger: true }))) return; act((d) => drmRouvrir(d, key), 'DRM rouverte.'); };
  const saisir = (pid, k, v) => act((d) => drmSaisieSet(d, key, pid, { [k]: v }));
  const lignesS = DRM_SORTIES.filter(([k]) => actifs.some((x) => x.S[k])); const lignesE = DRM_ENTREES.filter(([k]) => actifs.some((x) => x.E[k]));
  return (
    <div data-drm="">
      <Notice tone="info" title="DRM : déclaration récapitulative des entrées et sorties de vins">
        <span>Calculée d’après vos opérations : stocks de début et de fin (vrac, bouteilles sur lattes, bouteilles finies), récolte, achats, transferts entre produits (tirage, assemblage), pertes et sorties. Les bouteilles finies sorties du chai se saisissent ici, à chaque DRM.</span>{' '}
        <span>Trois moyens : le fichier XML pour CIEL (douane), le même fichier avec vos codes CIVC, ou l’impression et le CSV pour reporter les chiffres. Pas de compte CRD.</span>
      </Notice>
      <div className="my-3 flex flex-wrap items-end gap-3">
        <Field label="Déclaration" className="w-56"><SI value={mode} onChange={(v) => { setMode(v); setCle(''); }} plain options={[{ value: 'mensuelle', label: 'DRM mensuelle' }, { value: 'annuelle', label: 'DRA annuelle (petits producteurs)' }]} aria-label="Périodicité" /></Field>
        <Field label="Période" className="w-56"><SI value={key} onChange={setCle} plain options={periodes.map((k) => ({ value: k, label: drmPeriodeLabel(db, k) }))} aria-label="Période de la DRM" /></Field>
        <span className="pb-2 text-sm text-ink2">{`du ${fmtDate(calc.periode.d1)} au ${fmtDate(calc.periode.d2)}`}</span>
        {depose ? <Chip tone="ok" data-drm-deposee="">{`déposée le ${fmtDate(calc.declaration.deposeeLe)}`}</Chip> : <Chip tone="warn">à déposer</Chip>}
        <span className="ml-auto flex flex-wrap gap-2"><Btn onClick={() => setReglages(true)} data-drm-reglages="">⚙ Réglages de la DRM</Btn></span>
      </div>
      {bl.length ? <div className="mb-3"><Notice tone="bad" title="À compléter avant le dépôt"><ul className="ml-4 list-disc">{bl.map((c, i) => <li key={i}><DrmMsg c={c} /></li>)}</ul></Notice></div> : null}
      {al.length ? <div className="mb-3"><Notice tone="warn" title="À vérifier"><ul className="ml-4 list-disc" data-drm-alertes="">{al.map((c, i) => <li key={i}><DrmMsg c={c} /></li>)}</ul></Notice></div> : null}
      <Sec title="Balance des stocks en droits suspendus (hL)">
        {!actifs.length ? <Empty>Aucun stock ni mouvement sur cette période.</Empty> : (
          <div className="tblwrap"><table className="tbl" data-drm-balance="">
            <thead><tr><th style={{ minWidth: 190 }}>Rubrique</th>{actifs.map((x) => <th key={x.produitId || 'nr'} className="r" style={{ minWidth: 120 }} data-drm-produit={x.produitId}>{x.produit ? <><span translate="no">{x.produit.libelle}</span><div className="text-xs font-normal normal-case text-ink2" translate="no">{drmCode(x.produit)}</div></> : <span>Non rattaché</span>}</th>)}</tr></thead>
            <tbody>
              <tr className="font-semibold" data-drm-ligne="s0"><td>Stock de début</td>{actifs.map((x) => <td key={x.produitId} className="r num">{drmHlTexte(x.s0)}</td>)}</tr>
              {lignesE.map(([k, label]) => <tr key={k} data-drm-ligne={k}><td><span>+</span> <span>{label}</span></td>{actifs.map((x) => <td key={x.produitId} className="r num">{x.E[k] ? drmHlTexte(x.E[k]) : '—'}</td>)}</tr>)}
              {lignesS.map(([k, label]) => <tr key={k} data-drm-ligne={k}><td><span>−</span> <span>{label}</span></td>{actifs.map((x) => <td key={x.produitId} className="r num">{x.S[k] ? drmHlTexte(x.S[k]) : '—'}</td>)}</tr>)}
              {actifs.some((x) => x.S.ventesFranceAnt) ? <tr data-drm-ligne="ventesFranceAnt"><td><span>−</span> <span>Ventes France sous CRD, année précédente</span></td>{actifs.map((x) => <td key={x.produitId} className="r num">{x.S.ventesFranceAnt ? drmHlTexte(x.S.ventesFranceAnt) : '—'}</td>)}</tr> : null}
              <tr className="font-semibold" data-drm-ligne="s1"><td>Stock de fin</td>{actifs.map((x) => <td key={x.produitId} className={cx('r num', x.negatif && 'text-bad')}>{drmHlTexte(x.s1)}</td>)}</tr>
              {actifs.some((x) => x.f1 > 0.005 || x.f0 > 0.005) ? <tr className="text-ink2"><td><span>dont bouteilles finies (équivalent 75 cl)</span></td>{actifs.map((x) => <td key={x.produitId} className="r num"><span translate="no">{x.f1 ? drmBt(x.f1) : '—'}</span></td>)}</tr> : null}
            </tbody></table></div>)}
        {actifs.some((x) => x.obs.length) ? <div className="mt-2 text-sm"><b>Observations</b>{actifs.filter((x) => x.obs.length).map((x) => <div key={x.produitId}><span translate="no">{x.produit ? x.produit.libelle : ''}</span> : {x.obs.map((o, i) => <span key={i}>{i ? ' ; ' : ''}<span>{o}</span></span>)}</div>)}</div> : null}
      </Sec>
      <Sec title="Bouteilles finies sorties du chai (équivalent 75 cl)" className="mt-5">
        <p className="help mb-2">À saisir à chaque DRM. Les bouteilles dégorgées restent dans votre stock (droits suspendus) jusqu’à leur sortie : ventes en France sous capsules (CRD), expéditions export ou UE (DAE), dégustations. Un magnum compte pour 2.</p>
        {!saisissables.length ? <Empty>Aucun produit de vins mousseux : ajoutez-en un dans les réglages de la DRM.</Empty> : (
          <div className="tblwrap"><table className="tbl" data-drm-saisies="">
            <thead><tr><th style={{ minWidth: 200 }}>Produit</th><th className="r" style={{ whiteSpace: 'normal' }}>En stock au début</th>{DRM_SAISIES.map(([k, l]) => <th key={k} className="r" style={{ whiteSpace: 'normal' }}>{l}</th>)}{calc.periode.type === 'A' ? <th className="r" style={{ whiteSpace: 'normal' }}>Ventes France, année précédente</th> : null}<th>Observations</th></tr></thead>
            <tbody>{saisissables.map((x) => { const s = drmSaisieDe(db, key, x.produitId) || {}; const dis = lect || depose;
              return (<tr key={x.produitId} data-drm-saisie={x.produitId}><td><span translate="no">{x.produit.libelle}</span></td><td className="r num"><span translate="no">{drmBt(x.f0 || 0)}</span></td>
                {DRM_SAISIES.map(([k, l]) => <td key={k} className="r"><DrmCase valeur={s[k]} disabled={dis} label={`${l} — ${x.produit.libelle}`} onCommit={(v) => saisir(x.produitId, k, v)} /></td>)}
                {calc.periode.type === 'A' ? <td className="r"><DrmCase valeur={s.ventesFranceAnt} disabled={dis} label="Ventes France, année précédente" onCommit={(v) => saisir(x.produitId, 'ventesFranceAnt', v)} /></td> : null}
                <td><DrmObs valeur={s.obs || ''} disabled={dis} onCommit={(v) => saisir(x.produitId, 'obs', v)} /></td></tr>); })}</tbody></table></div>)}
      </Sec>
      <div className="mt-5 flex flex-wrap gap-2" data-drm-actions="">
        <Btn onClick={() => setImp(true)}>🖨 Imprimer…</Btn><Btn onClick={csv}>⬇ CSV</Btn>
        <Btn kind="primary" onClick={() => telecharger(false)} data-drm-xml="" title="Fichier DTI+ à importer dans CIEL (douane)">⬇ XML douane (CIEL)</Btn>
        <Btn onClick={() => telecharger(true)} data-drm-xml-civc="" title="Le même fichier, avec vos codes produits CIVC, pour la plateforme du CIVC">⬇ XML CIVC</Btn>
        <span className="ml-auto" />
        {lect ? null : depose ? <Btn kind="danger" onClick={rouvrir}>Rouvrir la déclaration</Btn> : <Btn kind="primary" onClick={deposer} disabled={bl.length > 0} title={bl.length ? 'À compléter avant le dépôt' : 'Figer les chiffres de cette DRM'} data-drm-deposer="">✓ Marquer comme déposée</Btn>}
      </div>
      <p className="help mt-2">Le format du fichier suit la documentation de la douane (DTI+, entrepositaires agréés viticoles). Vérifiez les chiffres dans CIEL avant de valider la déclaration : vous restez responsable de son contenu.</p>
      {reglages ? <DrmReglagesSheet lect={lectP} onClose={() => setReglages(false)} /> : null}
      {imp ? <DrmImpression calc={calc} onClose={() => setImp(false)} /> : null}
    </div>
  );
}
function DrmObs({ valeur, onCommit, disabled }) {
  const [v, setV] = useState(valeur); useEffect(() => { setV(valeur); }, [valeur]);
  return <input className="inp" style={{ minWidth: 160 }} value={v} disabled={disabled} aria-label="Observations" placeholder="ex. casse au transport" maxLength={250} onChange={(e) => setV(e.target.value)} onBlur={() => { if (v !== valeur) onCommit(v); }} />;
}

/* ---------- impression ---------- */
function DrmImpression({ calc, onClose }) {
  const { db } = useApp(); const ref = useRef(null); const r = drmReglage(db); const actifs = calc.lignes.filter((x) => x.actif && x.produit);
  const out = useReportOutput(ref, drmNomFichier(calc, 'x').replace(/\.x$/, ''), { orientation: actifs.length > 3 ? 'paysage' : 'portrait' });
  const th = { textAlign: 'right', fontSize: 11 }; const td = { textAlign: 'right', fontSize: 11 }; const tl = { fontSize: 11 };
  const ligne = (k, label, f, gras) => <tr key={k} style={gras ? { fontWeight: 700 } : undefined}><td style={tl}>{label}</td>{actifs.map((x) => <td key={x.produitId} style={td}>{f(x)}</td>)}</tr>;
  const plus = (l) => <><span>+</span> <span>{l}</span></>; const moins = (l) => <><span>−</span> <span>{l}</span></>;
  const ctl = drmControles(db, calc);
  return (
    <Sheet wide title="Imprimer la DRM" sub={drmPeriodeLabel(db, calc.periode.key)} onClose={onClose} footer={<><Btn onClick={onClose} className="mr-auto">Fermer</Btn><BoutonsSortie out={out} /></>}>
      <div className="fiche-scroll"><div ref={ref} className="report" data-drm-impression="">
        <ReportHead title={calc.periode.type === 'A' ? `DRA — ${drmPeriodeLabel(db, calc.periode.key)}` : `DRM — ${drmPeriodeLabel(db, calc.periode.key)}`} sub={`N° d’accise ${r.accise || '—'} · CVI ${r.cvi || '—'} · CIVC ${r.civc || '—'}`} />
        <p style={{ fontSize: 11 }}><span>{`Période du ${fmtDate(calc.periode.d1)} au ${fmtDate(calc.periode.d2)}`}</span> · <span>Balance des stocks en droits suspendus, en hectolitres</span></p>
        <table><thead><tr><th style={{ textAlign: 'left', fontSize: 11 }}>Rubrique</th>{actifs.map((x) => <th key={x.produitId} style={th}><span translate="no">{x.produit.libelle}</span><br /><span translate="no" style={{ fontWeight: 400 }}>{drmCode(x.produit)}{x.produit.codeCivc ? ` · CIVC ${x.produit.codeCivc}` : ''}</span></th>)}</tr></thead>
          <tbody>
            {ligne('s0', <span>Stock de début</span>, (x) => drmHlTexte(x.s0), true)}
            {DRM_ENTREES.filter(([k]) => actifs.some((x) => x.E[k])).map(([k, label]) => ligne(k, plus(label), (x) => (x.E[k] ? drmHlTexte(x.E[k]) : '—')))}
            {DRM_SORTIES.filter(([k]) => actifs.some((x) => x.S[k])).map(([k, label]) => ligne(k, moins(label), (x) => (x.S[k] ? drmHlTexte(x.S[k]) : '—')))}
            {actifs.some((x) => x.S.ventesFranceAnt) ? ligne('ant', moins('Ventes France sous CRD, année précédente'), (x) => (x.S.ventesFranceAnt ? drmHlTexte(x.S.ventesFranceAnt) : '—')) : null}
            {ligne('s1', <span>Stock de fin</span>, (x) => drmHlTexte(x.s1), true)}
          </tbody></table>
        {actifs.some((x) => x.obs.length) ? <div style={{ fontSize: 11, marginTop: 8 }}><b>Observations</b>{actifs.filter((x) => x.obs.length).map((x) => <div key={x.produitId}><span translate="no">{x.produit.libelle}</span> : {x.obs.map((o, i) => <span key={i}>{i ? ' ; ' : ''}<span>{o}</span></span>)}</div>)}</div> : null}
        {ctl.length ? <div style={{ fontSize: 10, marginTop: 8 }}><b>Contrôles</b><ul>{ctl.map((c, i) => <li key={i}><DrmMsg c={c} /></li>)}</ul></div> : null}
        <p className="muted" style={{ fontSize: 10, marginTop: 10 }}>{calc.declaration ? <span>{`Déposée le ${fmtDate(calc.declaration.deposeeLe)}.`}</span> : <span>Non déposée.</span>} <span>Chiffres calculés par Œnotrack d’après les opérations enregistrées : à vérifier avant leur report dans CIEL.</span></p>
      </div></div>
    </Sheet>
  );
}

/* ---------- réglages : identifiants, produits, rattachement manuel des lots ---------- */
function DrmReglagesSheet({ lect, onClose }) {
  const { db, R, act, uid } = useApp(); const r = drmReglage(db); const P = drmProduitsDe(db); const ask = useRetirer(); const [form, setForm] = useState(null);
  const [ids, setIds] = useState({ accise: r.accise, cvi: r.cvi, civc: r.civc });
  const enr = (k) => { if (ids[k] !== r[k]) act((d) => drmReglageSet(d, { [k]: ids[k] }), 'Réglage de la DRM enregistré.'); };
  const dbAuto = { ...db, drmRattachements: [] }; const cacheAuto = {}; const lots = Object.values(R.lots).filter((l) => (R.lotVol[l.id] || 0) > 0.5 || (R.tir[l.id] && R.tir[l.id].nb > 0)).sort((a, b) => String(a.code).localeCompare(String(b.code), 'fr'));
  const manuel = (id) => ((db.drmRattachements || []).find((x) => x.id === id) || {}).produitId || '';
  const nomP = (id) => (P.find((p) => p.id === id) || {}).libelle || '';
  return (
    <Sheet wide title="Réglages de la DRM" sub="Identifiants, produits déclarés et rattachement des lots" onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Fermer</Btn>}>
      <div className="space-y-5" data-drm-reglages-feuille="">
        <Sec title="Identifiants">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))' }}>
            <Field label="N° d’accise (entrepositaire agréé)" help="13 caractères, ex. FR012345E6789"><input className="inp" value={ids.accise} disabled={lect} onChange={(e) => setIds({ ...ids, accise: e.target.value.toUpperCase().replace(/\s/g, '') })} onBlur={() => enr('accise')} aria-label="N° d’accise" maxLength={13} /></Field>
            <Field label="N° CVI"><input className="inp" value={ids.cvi} disabled={lect} onChange={(e) => setIds({ ...ids, cvi: e.target.value })} onBlur={() => enr('cvi')} aria-label="N° CVI" /></Field>
            <Field label="N° CIVC (identifiant interprofessionnel)"><input className="inp" value={ids.civc} disabled={lect} onChange={(e) => setIds({ ...ids, civc: e.target.value })} onBlur={() => enr('civc')} aria-label="N° CIVC" /></Field>
            <Field label="Déclaration par défaut"><SI value={r.periodicite} disabled={lect} onChange={(v) => act((d) => drmReglageSet(d, { periodicite: v }), 'Réglage de la DRM enregistré.')} plain options={[{ value: 'mensuelle', label: 'DRM mensuelle' }, { value: 'annuelle', label: 'DRA annuelle (petits producteurs)' }]} aria-label="Déclaration par défaut" /></Field>
          </div>
        </Sec>
        <Sec title="Produits déclarés" right={lect ? null : <Btn kind="primary" onClick={() => setForm({})}>+ Nouveau produit</Btn>}>
          <p className="help mb-2">Chaque produit reprend exactement le libellé personnalisé de votre compte CIEL et son code INAO (à défaut, le libellé fiscal). Les exemples sont à vérifier. Un lot va au premier produit dont la règle lui convient (la plus précise d’abord), sauf rattachement manuel ci-dessous.</p>
          <div data-drm-produits=""><Tbl rows={P} empty="Aucun produit." cols={[
            { h: 'Produit (libellé CIEL)', r: (p) => <b translate="no">{p.libelle}</b> }, { h: 'Code', r: (p) => <span translate="no">{drmCode(p) || '—'}</span> }, { h: 'Code CIVC', r: (p) => <span translate="no">{p.codeCivc || '—'}</span> },
            { h: 'Rattachement', r: (p) => <span className="text-sm"><DrmRegle p={p} /></span> }, { h: 'État', r: (p) => (p.aVerifier ? <Chip tone="warn">{p.exemple ? 'exemple à vérifier' : 'à vérifier'}</Chip> : <Chip tone="good">vérifié</Chip>) },
            { h: '', r: (p) => (lect ? null : <div className="flex flex-wrap gap-1" style={{ minWidth: 172 }}><Btn size="sm" aria-label="Monter" onClick={() => act((d) => drmProduitDeplacer(d, p.id, -1))}>▲</Btn><Btn size="sm" aria-label="Descendre" onClick={() => act((d) => drmProduitDeplacer(d, p.id, 1))}>▼</Btn>
              <Btn size="sm" onClick={() => setForm({ id: p.id })}>Modifier</Btn><Btn size="sm" kind="danger" onClick={() => ask('Retirer ce produit ?', (d) => drmProduitSupprimer(d, p.id), 'Produit retiré.', 'Ses lots iront au produit suivant qui leur convient.')}>Retirer</Btn></div>) },
          ]} /></div>
        </Sec>
        <Sec title="Rattachement des lots en stock">
          <p className="help mb-2">Automatique d’après les règles des produits ; choisissez un produit pour un lot particulier (Coteaux champenois, Rosé des Riceys…).</p>
          <div data-drm-lots=""><Tbl rows={lots} empty="Aucun lot en stock." cols={[
            { h: 'Lot', r: (l) => <b translate="no">{l.code}</b> }, { h: 'Désignation', r: (l) => <span className="text-sm" translate="no">{l.designation || ''}</span> },
            { h: 'Volume', cls: 'r', r: (l) => <span className="num" translate="no">{R.tir[l.id] && R.tir[l.id].nb > 0 ? `${fmt(R.tir[l.id].nb)} bt` : fmtL(R.lotVol[l.id] || 0)}</span> },
            { h: 'Produit (automatique)', r: (l) => { const a = drmProduitDuLot(dbAuto, P, [R], l.id, cacheAuto); return a ? <span translate="no">{nomP(a)}</span> : <Chip tone="warn">aucun</Chip>; } },
            { h: 'Rattachement', r: (l) => <SI value={manuel(l.id)} disabled={lect} plain onChange={(v) => act((d) => drmRattacher(d, l.id, v), v ? 'Lot rattaché.' : 'Rattachement automatique.')} aria-label={`Rattachement du lot ${l.code}`} options={[{ value: '', label: 'Automatique' }, ...P.map((p) => ({ value: p.id, label: p.libelle, donnee: true }))]} /> },
          ]} /></div>
        </Sec>
      </div>
      {form ? <DrmProduitForm id={form.id} onClose={() => setForm(null)} /> : null}
    </Sheet>
  );
}
function DrmProduitForm({ id, onClose }) {
  const { db, act, uid } = useApp(); const p0 = id ? drmProduitsDe(db).find((x) => x.id === id) : null;
  const [f, set] = useDraft(p0 ? { libelle: p0.libelle, codeInao: p0.codeInao || '', libelleFiscal: p0.libelleFiscal || '', codeCivc: p0.codeCivc || '', tav: p0.tav == null ? '' : String(p0.tav), nature: p0.nature || '', fractions: [...(p0.fractions || [])], sansFractions: [...(p0.sansFractions || [])], manuel: !!p0.manuel, verifie: !p0.aVerifier }
    : { libelle: '', codeInao: '', libelleFiscal: '', codeCivc: '', tav: '', nature: '', fractions: [], sansFractions: [], manuel: false, verifie: true });
  const tog = (k, v, on) => set(k, on ? uniq([...f[k], v]) : f[k].filter((x) => x !== v));
  const save = () => { const r = act((d) => drmProduitSave(d, { ...f, aVerifier: !f.verifie }, id, uid), id ? 'Produit modifié.' : 'Produit ajouté.'); if (r && r.ok !== false) onClose(); };
  const fr = fracList(db);
  return (
    <FormSheet title={id ? 'Modifier le produit' : 'Nouveau produit de la DRM'} onClose={onClose} onSave={save}>
      <Field label="Libellé personnalisé" help="Exactement comme dans votre compte CIEL : c’est l’identifiant du produit."><TI value={f.libelle} onChange={(v) => set('libelle', v)} maxLength={100} autoFocus /></Field>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))' }}>
        <Field label="Code INAO" help="6 à 8 caractères, celui du produit dans CIEL"><TI value={f.codeInao} onChange={(v) => set('codeInao', v.toUpperCase())} maxLength={8} /></Field>
        <Field label="Libellé fiscal (sans code INAO)"><SI value={f.libelleFiscal} onChange={(v) => set('libelleFiscal', v)} plain options={[{ value: '', label: '—' }, ...DRM_LIBELLES_FISCAUX.map(([k, l]) => ({ value: k, label: l }))]} /></Field>
        <Field label="Code CIVC" help="5 à 8 caractères"><TI value={f.codeCivc} onChange={(v) => set('codeCivc', v.toUpperCase())} maxLength={8} /></Field>
        <Field label="TAV (facultatif)"><NI value={f.tav} onChange={(v) => set('tav', v)} placeholder="ex. 12" /></Field>
      </div>
      <Group label="Rattachement automatique des lots">
        <Check checked={f.manuel} onChange={(v) => set('manuel', v)} label="Rattachement manuel seulement (aucun lot n’y va de lui-même)" />
        {f.manuel ? null : <>
          <Field label="Nature"><SI value={f.nature} onChange={(v) => set('nature', v)} plain options={[{ value: '', label: 'Toutes' }, ...DRM_NATURES.map(([k, l]) => ({ value: k, label: l }))]} /></Field>
          <div className="text-sm"><b>Seulement les fractions</b> <span className="text-ink2">(rien de coché : toutes)</span></div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">{fr.map((x) => <Check key={x.id} checked={f.fractions.includes(x.id)} onChange={(v) => tog('fractions', x.id, v)} label={x.label} />)}</div>
          <div className="text-sm"><b>Sauf les fractions</b></div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">{fr.map((x) => <Check key={x.id} checked={f.sansFractions.includes(x.id)} onChange={(v) => tog('sansFractions', x.id, v)} label={x.label} />)}</div>
        </>}
      </Group>
      <Check checked={!!f.verifie} onChange={(v) => set('verifie', v)} label="Vérifié (sinon : à vérifier)" />
    </FormSheet>
  );
}
