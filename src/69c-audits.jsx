/* ============ TRAÇABILITÉ › MODE AUDIT (0.28.0-alpha.1) ============
   Moteur : 27-audits.js. Types d'audit personnalisables (pièces à présenter, points de contrôle, réglages) ; pendant la visite, le mode
   audit présente chaque pièce (registres, bilan matière, stocks, SO₂, durée sur lattes, test de traçabilité chronométré…), note les
   réponses point par point et imprime le dossier complet. */
const AUDIT_TONS = { conforme: 'ok', obs: 'warn', nc: 'bad', na: '' };
const auditPeriodeDefaut = (db) => { const t = todayISO(); const c = campOf(db, t) || (db.campagnes || [])[0]; return c ? { debut: c.debut, fin: t < c.fin ? t : c.fin } : { debut: `${t.slice(0, 4)}-01-01`, fin: t }; };
function AuditResumeChips({ a }) {
  const { db } = useApp(); const r = auditResume(db, a);
  return <span className="flex flex-wrap gap-1">{r.conforme ? <Chip tone="ok">{`${r.conforme} conforme(s)`}</Chip> : null}{r.obs ? <Chip tone="warn">{`${r.obs} observation(s)`}</Chip> : null}{r.nc ? <Chip tone="bad">{`${r.nc} non-conformité(s)`}</Chip> : null}{r.attente ? <Chip>{`${r.attente} à voir`}</Chip> : null}</span>;
}
// nouvel audit : type, période, auditeur
function AuditForm({ modeleId, onClose, onCree }) {
  const { db, act } = useApp(); const P = auditPeriodeDefaut(db);
  const [f, set] = useDraft({ modeleId, debut: P.debut, fin: P.fin, date: todayISO(), auditeur: '', organisme: '' });
  const save = () => { const r = act((d) => auditSave(d, null, f), 'Audit préparé.'); if (r && r.ok) onCree(r.id); };
  return (
    <FormSheet title="Préparer un audit" onClose={onClose} onSave={save} saveLabel="Ouvrir le mode audit">
      <Field label="Type d’audit"><SI plain value={f.modeleId} onChange={(v) => set('modeleId', v)} options={auditModeles(db).map((m) => ({ value: m.id, label: m.nom }))} aria-label="Type d’audit" /></Field>
      <G n={3}><Field label="Période du"><DI value={f.debut} onChange={(v) => set('debut', v)} /></Field><Field label="au"><DI value={f.fin} onChange={(v) => set('fin', v)} /></Field><Field label="Date de l’audit"><DI value={f.date} onChange={(v) => set('date', v)} /></Field></G>
      <G><Field label="Auditeur"><TI value={f.auditeur} onChange={(v) => set('auditeur', v)} aria-label="Auditeur" /></Field><Field label="Organisme"><TI value={f.organisme} onChange={(v) => set('organisme', v)} placeholder="ex. organisme certificateur, douane, DDPP, ODG…" aria-label="Organisme" /></Field></G>
    </FormSheet>
  );
}
// type d'audit : pièces, points de contrôle, réglages
function AuditModeleForm({ id, onClose }) {
  const { db, act, confirm } = useApp(); const m0 = id ? auditModele(db, id) : null;
  const [f, set, setF] = useDraft(() => (m0 ? { nom: m0.nom, icone: m0.icone, desc: m0.desc || '', pieces: [...m0.pieces], points: m0.points.map((p) => ({ ...p, pieces: [...(p.pieces || [])] })), reglages: { lattesMois: '', lattesMillesimeMois: '', so2Max: '', ...(m0.reglages || {}) } } : { nom: '', icone: '📋', desc: '', pieces: ['identite', 'bilan', 'tracabilite'], points: [{ id: 'p1', texte: '', pieces: [] }], reglages: { lattesMois: '', lattesMillesimeMois: '', so2Max: '' } }));
  const tog = (p) => setF((x) => ({ ...x, pieces: x.pieces.includes(p) ? x.pieces.filter((y) => y !== p) : [...x.pieces, p] }));
  const setP = (i, patch) => setF((x) => ({ ...x, points: x.points.map((p, j) => (j === i ? { ...p, ...patch } : p)) }));
  const save = () => { const r = act((d) => auditModeleSave(d, id || null, f), id ? 'Type d’audit enregistré.' : 'Type d’audit créé.'); if (r && r.ok) onClose(); };
  const retablir = async () => { if (await confirm({ title: m0.fourni ? `Rétablir « ${m0.nom} » d’origine ?` : `Supprimer « ${m0.nom} » ?`, body: m0.fourni ? 'Vos changements de pièces, de points et de réglages seront perdus.' : 'Ce type d’audit disparaît de la liste.', ok: m0.fourni ? 'Rétablir' : 'Supprimer', danger: true })) { const r = act((d) => auditModeleRetablir(d, id), m0.fourni ? 'Type d’audit rétabli.' : 'Type d’audit supprimé.'); if (r && r.ok) onClose(); } };
  return (
    <FormSheet title={id ? `Personnaliser — ${m0 ? m0.nom : ''}` : 'Nouveau type d’audit'} onClose={onClose} onSave={save}
      extraFooter={m0 && (m0.modifie || !m0.fourni) ? <Btn kind="danger" className="mr-auto" onClick={retablir}>{m0.fourni ? 'Rétablir l’original' : 'Supprimer'}</Btn> : null}>
      <G><Field label="Nom"><TI value={f.nom} onChange={(v) => set('nom', v)} placeholder="ex. Audit client export, IFS, HVE…" aria-label="Nom du type d’audit" /></Field><Field label="Icône"><TI value={f.icone} onChange={(v) => set('icone', v)} aria-label="Icône" style={{ maxWidth: 90 }} /></Field></G>
      <Field label="Ce que l’auditeur attend"><TA value={f.desc} onChange={(v) => set('desc', v)} rows={2} aria-label="Description" /></Field>
      <Group label="Pièces à présenter" help="Ce que le mode audit montre, chapitre par chapitre, sur la période de l’audit.">
        <div className="flex flex-wrap gap-x-4 gap-y-1" data-audit-pieces="">{AUDIT_PIECES.map(([p, pl]) => <Check key={p} checked={f.pieces.includes(p)} onChange={() => tog(p)} label={pl} />)}</div>
      </Group>
      <Group label="Points de contrôle" help="Les questions de l’auditeur ; reliez chacune aux pièces qui y répondent.">
        <div className="space-y-2" data-audit-points="">{f.points.map((p, i) => (
          <div key={i} className="rounded-md border border-line p-2">
            <div className="flex gap-2"><TI value={p.texte} onChange={(v) => setP(i, { texte: v })} placeholder="ex. Factures des raisins achetés disponibles" aria-label={`Point ${i + 1}`} style={{ flex: 1 }} /><Btn size="sm" kind="danger" onClick={() => setF((x) => ({ ...x, points: x.points.filter((_, j) => j !== i) }))} aria-label={`Retirer le point ${i + 1}`}>✕</Btn></div>
            {f.pieces.length ? <div className="mt-1.5 flex flex-wrap gap-1">{f.pieces.map((pc) => <button key={pc} type="button" className={cx('chip', (p.pieces || []).includes(pc) && 'chip-info')} onClick={() => setP(i, { pieces: (p.pieces || []).includes(pc) ? p.pieces.filter((y) => y !== pc) : [...(p.pieces || []), pc] })}>{auditPieceNom(pc)}</button>)}</div> : null}
          </div>))}
          <Btn size="sm" onClick={() => setF((x) => ({ ...x, points: [...x.points, { id: '', texte: '', pieces: [] }] }))}>＋ Ajouter un point de contrôle</Btn></div>
      </Group>
      <Group label="Réglages" help="Valeurs à vérifier avec votre cahier des charges ou votre organisme (laisser vide : pas de contrôle).">
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,190px),1fr))' }}>
          <Field label="Sur lattes, minimum (mois)"><input className="inp num" inputMode="numeric" value={f.reglages.lattesMois} onChange={(e) => setF((x) => ({ ...x, reglages: { ...x.reglages, lattesMois: e.target.value } }))} aria-label="Durée minimale sur lattes en mois" /></Field>
          <Field label="… millésimés (mois)"><input className="inp num" inputMode="numeric" value={f.reglages.lattesMillesimeMois} onChange={(e) => setF((x) => ({ ...x, reglages: { ...x.reglages, lattesMillesimeMois: e.target.value } }))} aria-label="Durée minimale sur lattes des millésimés en mois" /></Field>
          <Field label="SO₂ total maximum (mg/L)"><input className="inp num" inputMode="decimal" value={f.reglages.so2Max} onChange={(e) => setF((x) => ({ ...x, reglages: { ...x.reglages, so2Max: e.target.value } }))} aria-label="SO₂ total maximum en mg/L" /></Field>
        </div>
      </Group>
    </FormSheet>
  );
}
// test de traçabilité chronométré : l'auditeur choisit un lot, la chaîne s'affiche, le temps est noté
function AuditTestTrace({ a }) {
  const { act } = useApp(); const [t0, setT0] = useState(null); const [c, setC] = useState(null); const [now, setNow] = useState(Date.now());
  useEffect(() => { if (!t0) return undefined; const h = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(h); }, [t0]);
  const s = t0 ? Math.round((now - t0) / 1000) : 0;
  return (
    <div data-audit-test="">
      {(a.tests || []).length ? <div className="mb-2 flex flex-wrap gap-1">{a.tests.map((x, i) => <Chip key={i} tone="ok">{`${x.titre} : ${x.secondes} s`}</Chip>)}</div> : null}
      {a.statut === 'clos' ? null : !t0 ? <Btn kind="primary" onClick={() => { setT0(Date.now()); setC(null); }} data-audit-test-go="">⏱ Démarrer un test de traçabilité</Btn>
        : <div className="mb-2 flex flex-wrap items-center gap-2"><Chip tone="info">{`⏱ ${s} s`}</Chip><Btn kind="primary" disabled={!c} onClick={() => { const r = act((d) => auditTest(d, a.id, { cible: c, titre: c.titre || c.id, secondes: s }), 'Test de traçabilité enregistré.'); if (r && r.ok) setT0(null); }} data-audit-test-ok="">✓ Chaîne présentée : enregistrer</Btn><Btn onClick={() => setT0(null)}>Annuler</Btn></div>}
      {t0 ? <TraceEtapes onCible={setC} /> : <p className="help">L’auditeur choisit un lot (fini, en cuve, une pesée…) : retrouvez sa chaîne complète, un pas en amont et un pas en aval à chaque étape ; le temps mis est noté dans l’audit.</p>}
    </div>
  );
}
// une pièce du dossier
function AuditPiece({ piece, a, m, regs, imprime }) {
  const { db, R } = useApp(); const [q, setQ] = useState('');
  const reg = regs.find((x) => x.id === piece);
  if (reg) {
    const rows = q.trim() ? reg.rows.filter((r) => norm(r.join(' ')).includes(norm(q))) : reg.rows;
    const S = piece === 'stocks' ? snapshotAt(db, a.fin) : null; const par = {}; if (S) S.portions.forEach((p) => { const k = p.qualif || '—'; par[k] = (par[k] || 0) + (p.vol || p.volL || 0); });
    return (<div>
      {S ? <><p className="mb-2 text-sm font-semibold">{`Stock au ${fmtDate(a.fin)} : ${fmtL(S.totalL)} en cuve, ${fmt(S.totalBouteilles)} bouteille(s) sur lattes.`}</p>
        <div className="mb-3"><RTable head={['Revendication', 'Volume']} rows={Object.keys(par).map((k) => [qLabel(k), fmtL(par[k])])} /></div></> : null}
      <p className="help mb-2"><span>{reg.desc || ''}</span> <span>{`${rows.length} ligne(s) sur la période.`}</span></p>
      {!imprime ? <input className="inp no-print mb-2" style={{ maxWidth: 280 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer…" aria-label="Filtrer la pièce" /> : null}
      <div className={imprime ? '' : 'overflow-x-auto'}><RTable head={reg.headers} rows={imprime ? rows : rows.slice(0, 300)} empty="Rien sur la période." /></div>
      {!imprime && rows.length > 300 ? <p className="help mt-1">{`300 premières lignes affichées sur ${rows.length} : le dossier imprimé les contient toutes.`}</p> : null}
    </div>);
  }
  if (piece === 'identite') { const e = db.entreprise || {}; const certifs = (db.docs || []).filter((d) => d && /certif|attest|habilit/i.test(`${d.cat || ''} ${d.nom || ''}`)); return (<div>
    <table className="tbl"><tbody>{[['Société', e.nom], ['Adresse', e.adresse], ['Identifiants officiels', e.identifiants], ['Sites', (db.sites || []).map((s) => s.nom).join(', ')]].filter((x) => x[1]).map(([k, v]) => <tr key={k}><th style={{ width: '30%' }}>{k}</th><td>{v}</td></tr>)}</tbody></table>
    <div className="lbl mt-3 mb-1">{`Certificats et attestations joints (${certifs.length})`}</div>
    <RTable head={['Document', 'Catégorie', 'Date']} rows={certifs.map((d) => [d.nom, d.cat || '', fmtDate(d.date || '')])} empty="Aucun certificat joint : ajoutez-les aux fiches (📎)." />
  </div>); }
  if (piece === 'bilan') { const B = bilanOf(db, { debut: a.debut, fin: a.fin, nom: '' }); return (<div>
    <RTable head={['Poste', 'Volume (hL)']} rows={bilanRows(db, B).map((r) => [r.label, fmtHL(r.v)])} />
    <p className={cx('mt-2 text-sm', Math.abs(B.ecart) > 50 ? 'text-bad' : 'text-ink2')}>{`Écart entre le stock de clôture réel et le stock calculé : ${fmtL(B.ecart)}.`}</p>
    <RTable head={['Raisins', 'kg']} rows={[['Raisins reçus', fmt(B.kgRecus)], ['Raisins pressés', fmt(B.kgPresses)], ['Moûts obtenus (L)', fmt(B.lMout)]]} />
  </div>); }
  if (piece === 'stocks') { const S = snapshotAt(db, a.fin); const par = {}; S.portions.forEach((p) => { const k = p.qualif || '—'; par[k] = (par[k] || 0) + (p.vol || p.volL || 0); }); return (<div>
    <p className="help mb-2">{`Stock au ${fmtDate(a.fin)} : ${fmtL(S.totalL)} en cuve, ${fmt(S.totalBouteilles)} bouteille(s) sur lattes.`}</p>
    <RTable head={['Revendication', 'Volume']} rows={Object.keys(par).map((k) => [qLabel(k), fmtL(par[k])])} />
    <RTable head={['Lot', 'Désignation', 'Revendication', 'Contenant', 'Volume']} rows={S.portions.map((p) => [p.code || '', p.designation || '', qLabel(p.qualif), contName(db, p.contenantId), fmtL(p.vol || p.volL || 0)])} empty="Aucun stock." />
  </div>); }
  if (piece === 'so2') { const L = auditSo2(db, a.debut, a.fin, (m.reglages || {}).so2Max); const n = L.filter((x) => x.depasse).length; return (<div>
    <p className={cx('help mb-2', n && 'text-bad')}>{num((m.reglages || {}).so2Max) > 0 ? `Maximum du type d’audit : ${fmt(m.reglages.so2Max)} mg/L — ${n} lot(s) au-dessus.` : 'Aucun maximum réglé pour ce type d’audit (Personnaliser › Réglages).'}</p>
    <RTable head={['Lot', 'Désignation', 'Date', 'SO₂ total (mg/L)', '']} rows={L.map((x) => [x.lot ? x.lot.code : x.a.lotId, x.lot ? x.lot.designation || '' : '', fmtDate(x.a.date), fmt(x.v), x.depasse ? 'au-dessus du maximum' : ''])} empty="Aucune analyse de SO₂ total sur la période." />
  </div>); }
  if (piece === 'lattes') { const L = auditLattes(db, m.reglages, a.debut, a.fin); return (<div>
    <p className="help mb-2">{num((m.reglages || {}).lattesMois) > 0 ? `Minimum : ${m.reglages.lattesMois} mois${num(m.reglages.lattesMillesimeMois) > 0 ? ` (${m.reglages.lattesMillesimeMois} mois pour un millésimé)` : ''}.` : 'Aucune durée minimale réglée pour ce type d’audit.'}</p>
    <RTable head={['Lot fini', 'Désignation', 'Tirage', 'Dégorgement', 'Sur lattes', '']} rows={L.map((x) => [x.f.code, x.f.designation || '', x.debut ? fmtDate(x.debut) : x.reprise ? 'inconnue (stock repris)' : '—', fmtDate(x.f.date), x.mois == null ? '—' : `${x.mois} mois`, x.ok === false ? `sous le minimum (${x.min} mois)` : x.ok ? 'conforme' : ''])} empty="Aucun lot fini dégorgé sur la période." />
  </div>); }
  if (piece === 'tracabilite') return imprime ? <RTable head={['Lot recherché', 'Temps', 'Le']} rows={(a.tests || []).map((x) => [x.titre, `${x.secondes} s`, fmtDateHeure(x.le)])} empty="Aucun test enregistré." /> : <AuditTestTrace a={a} />;
  if (piece === 'plan_hygiene') { const PN = (db.planNettoyage || []).filter((e) => e && e.actif !== false); const AQ = (db.hygieneAcquits || []).filter((x) => x && x.date >= a.debut && x.date <= a.fin); return (<div>
    <RTable head={['Zone', 'Ligne du plan', 'Contrôle', 'Danger']} rows={PN.map((e) => [hygLib(HYG_ZONES, e.zone), e.libelle, hygLib(HYG_CONTROLES, e.controle), hygLib(HYG_DANGERS, e.danger)])} empty="Pas de plan de nettoyage." />
    <div className="lbl mt-3 mb-1">{`Non-conformités justifiées sur la période (${AQ.length})`}</div>
    <RTable head={['Date', 'Alerte', 'Justification']} rows={AQ.map((x) => [fmtDate(x.date), x.msg || x.id, x.motif || ''])} empty="Aucune." />
  </div>); }
  if (piece === 'equipements') { const L = equipementsListe(db, a.fin); return (
    <RTable head={['Matériel', 'État', 'Vérification périodique', 'Dernière intervention']} rows={L.map((x) => { const iv = equipInterventions(db, x.e.id)[0]; return [x.e.label, EQUIP_ETAT_TXT[x.k], x.verif.k === 'aucune' ? '—' : x.verif.valideJusquau ? `valable jusqu’au ${fmtDate(x.verif.valideJusquau)}` : 'date à saisir', iv ? `${fmtDate(iv.date)} — ${hygLib(MAINT_TYPES, iv.type)}` : '—']; })} empty="Aucun équipement." />); }
  return <p className="help">—</p>;
}
// un point de contrôle : état et note
function AuditPoint({ a, p, i }) {
  const { act } = useApp(); const r = (a.reponses || {})[p.id] || {}; const [note, setNote] = useState(r.note || ''); const clos = a.statut === 'clos';
  return (
    <div className="card p-3" data-audit-point={p.id}>
      <div className="flex flex-wrap items-start gap-2"><b className="min-w-0 flex-1">{i + 1}. <span>{p.texte}</span></b>{r.etat ? <Chip tone={AUDIT_TONS[r.etat]}>{(AUDIT_ETATS.find((e) => e[0] === r.etat) || ['', ''])[1]}</Chip> : null}</div>
      {(p.pieces || []).length ? <div className="mt-1 text-xs text-ink2">{'Pièces : '}{p.pieces.map((x, k) => <React.Fragment key={x}>{k ? ' · ' : ''}<span>{auditPieceNom(x)}</span></React.Fragment>)}</div> : null}
      {!clos ? <div className="mt-2 flex flex-wrap gap-1">{AUDIT_ETATS.map(([e, el]) => <Btn key={e} size="sm" kind={r.etat === e ? 'primary' : 'ghost'} onClick={() => act((d) => auditRepondre(d, a.id, p.id, { etat: r.etat === e ? '' : e }))} data-etat={e}>{el}</Btn>)}</div> : null}
      {!clos ? <div className="mt-2"><TI value={note} onChange={setNote} onBlur={() => { if (note !== (r.note || '')) act((d) => auditRepondre(d, a.id, p.id, { note })); }} placeholder="Constat, preuve présentée, action corrective…" aria-label={`Note du point ${i + 1}`} /></div> : r.note ? <p className="mt-1 text-sm">{r.note}</p> : null}
    </div>
  );
}
// 0.49.0-alpha.1 (IA09, usage audit, niveau 2 : moteur 17ad-ia-regle.js) : « 🤖 Préparer » → synthèse, points faibles, pièces à préparer et
// brouillon de notes par chapitre ; parties cochées reprises dans les notes générales de l'audit seulement sur « Reprendre dans les notes »
function AuditPreparer({ a, m, regs }) {
  const { db, act, toast } = useApp(); const ia = useIaUsage(); const [busy, setBusy] = useState(false); const [prop, setProp] = useState(null);
  const preparer = async () => {
    if (busy) return; setBusy(true);
    try { const D = iaAuditDonnees(db, a, m, iaAuditPiecesEtat(db, a, m, regs)); const r = await ia.demander('audit', iaAuditPrompt(D)); if (r) { const x = iaAuditLire(r.valeur, m); setProp({ x, trace: r.trace, choix: { synthese: !!x.synthese, faibles: x.pointsFaibles.length > 0, pieces: x.piecesAPreparer.length > 0, chapitres: x.chapitres.map((c) => c.chapitre) } }); } }
    finally { setBusy(false); }
  };
  const reprendre = () => { const t = iaAuditNotesTexte(prop.x, prop.choix, m); const r = act((d) => iaAuditNotesAjouter(d, a.id, t, prop.trace), 'Préparation reprise dans les notes de l’audit.'); if (r && r.ok) { if (r.tronque) toast('Notes limitées à 3 000 caractères : la fin a été coupée.', 'warn'); setProp(null); } };
  const setC = (k, v) => setProp((p) => ({ ...p, choix: { ...p.choix, [k]: v } }));
  const chapNom = (c) => (c === 'synthese' ? 'Points de contrôle' : auditPieceNom(c));
  return (<div className="flex flex-wrap items-center gap-2" data-audit-preparer="">
    <IaBouton usage="audit" busy={busy} onClick={preparer}>Préparer</IaBouton><span className="help">Synthèse, points faibles, pièces à préparer et brouillon de notes ; rien n’est ajouté aux notes sans votre accord.</span>
    {prop ? <Sheet wide title="Préparation de l’audit" sub="Proposée par l’IA : relisez, cochez ce que vous gardez." onClose={() => setProp(null)}
      footer={<><Btn onClick={() => setProp(null)}>Fermer sans reprendre</Btn><Btn kind="primary" onClick={reprendre} data-audit-reprendre="">Reprendre dans les notes</Btn></>}>
      <div className="space-y-3" data-audit-proposition="">
        {prop.x.synthese ? <div><Check checked={prop.choix.synthese} onChange={(v) => setC('synthese', v)} label={<b>Synthèse</b>} /><p className="mt-1 text-sm" translate="no">{prop.x.synthese}</p></div> : null}
        {prop.x.pointsFaibles.length ? <div><Check checked={prop.choix.faibles} onChange={(v) => setC('faibles', v)} label={<b>Points faibles</b>} /><ul className="mt-1 list-disc pl-5 text-sm">{prop.x.pointsFaibles.map((x, k) => <li key={k}>{x.point ? <span className="text-ink2" translate="no">{`${m.points.findIndex((p) => p.id === x.point) + 1}. `}</span> : null}<span translate="no">{x.texte}</span></li>)}</ul></div> : null}
        {prop.x.piecesAPreparer.length ? <div><Check checked={prop.choix.pieces} onChange={(v) => setC('pieces', v)} label={<b>Pièces à préparer</b>} /><ul className="mt-1 list-disc pl-5 text-sm">{prop.x.piecesAPreparer.map((x, k) => <li key={k}>{x.piece ? <><b>{auditPieceNom(x.piece)}</b> — </> : null}<span translate="no">{x.texte}</span></li>)}</ul></div> : null}
        {prop.x.chapitres.length ? <div><div className="lbl">Brouillon de notes par chapitre</div><div className="space-y-2">{prop.x.chapitres.map((c) => <div key={c.chapitre} className="rounded-md border border-line p-2" data-audit-chapitre-ia={c.chapitre}>
          <Check checked={prop.choix.chapitres.includes(c.chapitre)} onChange={(v) => setC('chapitres', v ? [...prop.choix.chapitres, c.chapitre] : prop.choix.chapitres.filter((y) => y !== c.chapitre))} label={<b>{chapNom(c.chapitre)}</b>} />
          <p className="mt-1 text-sm" translate="no">{c.notes}</p></div>)}</div></div> : null}
        <p className="help">Pistes à vérifier : les types d’audit fournis sont des aide-mémoire, pas les référentiels officiels.</p>
      </div>
    </Sheet> : null}
  </div>);
}
// mode audit : chapitres, pièces, points, dossier imprimable
function ModeAudit({ id, onClose }) {
  const { db, R, act, confirm } = useApp(); const ref = useRef(null); const [chap, setChap] = useState('synthese');
  const a = (db.audits || []).find((x) => x && x.id === id); const m = a ? auditModele(db, a.modeleId) : null;
  const regs = useMemo(() => (a ? buildRegisters(db, R, { camp: { debut: a.debut, fin: a.fin, nom: '' }, scope: 'camp', asOf: a.fin }) : []), [db, R, a && a.debut, a && a.fin]);
  const out = useReportOutput(ref, a ? `audit-${slug(a.nom || '')}-${a.date}` : 'audit');
  if (!a || !m) return null;
  const chaps = [['synthese', 'Points de contrôle'], ...m.pieces.map((p) => [p, auditPieceNom(p)])];
  const r0 = auditResume(db, a); const clos = a.statut === 'clos';
  const clore = async () => { if (clos) { act((d) => auditClore(d, a.id, false), 'Audit rouvert.'); return; } if (await confirm({ title: 'Clore cet audit ?', body: r0.attente ? `${r0.attente} point(s) sans réponse.` : 'Les réponses ne pourront plus être modifiées (sauf en rouvrant l’audit).', ok: 'Clore' })) act((d) => auditClore(d, a.id, true), 'Audit clos.'); };
  return (
    <Sheet wide title={<>{m.icone} <span>{a.nom}</span></>} sub={`Période du ${fmtDate(a.debut)} au ${fmtDate(a.fin)} · audit du ${fmtDate(a.date)}${a.auditeur ? ` · ${a.auditeur}` : ''}${a.organisme ? ` (${a.organisme})` : ''}`} onClose={onClose}
      footer={<><span className="mr-auto flex flex-wrap items-center gap-2"><AuditResumeChips a={a} />{clos ? <Chip>clos</Chip> : null}</span><Btn onClick={clore} data-audit-clore="">{clos ? 'Rouvrir' : 'Clore l’audit'}</Btn><BoutonsSortie out={out} html={false} /></>}>
      <div className="flex flex-col gap-4 md:flex-row" data-mode-audit={a.id}>
        <nav className="md:w-64 md:flex-none" aria-label="Chapitres de l’audit">
          <SI plain value={chap} onChange={setChap} options={chaps.map(([c, cl]) => ({ value: c, label: cl }))} aria-label="Chapitre" className="md:hidden" />
          <div className="hidden flex-col gap-1 md:flex">{chaps.map(([c, cl]) => { const pts = c === 'synthese' ? [] : m.points.filter((p) => (p.pieces || []).includes(c)); const nc = pts.some((p) => ((a.reponses || {})[p.id] || {}).etat === 'nc'); return <button key={c} type="button" className={cx('rounded-md px-3 py-2 text-left text-sm', chap === c ? 'bg-accent text-white' : 'hover:bg-surface2')} onClick={() => setChap(c)} data-chapitre={c}>{cl}{nc ? ' ⚠' : ''}</button>; })}</div>
        </nav>
        <div className="min-w-0 flex-1">
          <h3 className="mb-2 text-lg font-semibold">{(chaps.find((x) => x[0] === chap) || chaps[0])[1]}</h3>
          {chap === 'synthese' ? <div className="space-y-2">{m.points.map((p, i) => <AuditPoint key={p.id} a={a} p={p} i={i} />)}{!m.points.length ? <p className="help">Aucun point de contrôle : personnalisez le type d’audit.</p> : null}
            {!clos ? <AuditPreparer a={a} m={m} regs={regs} /> : null}
            {!clos ? <Field label={<span className="inline-flex items-center gap-2"><span>Notes générales de l’audit</span><IaTrace ia={a.ia} /></span>}><TAD value={a.notes || ''} onChange={(v) => act((d) => auditSave(d, a.id, { notes: v }))} rows={3} aria-label="Notes de l’audit" /></Field> : a.notes ? <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{a.notes}</p> : null}</div>
            : <>{m.points.filter((p) => (p.pieces || []).includes(chap)).length ? <div className="mb-3 space-y-2">{m.points.map((p, i) => ((p.pieces || []).includes(chap) ? <AuditPoint key={p.id} a={a} p={p} i={i} /> : null))}</div> : null}
              <AuditPiece piece={chap} a={a} m={m} regs={regs} /></>}
        </div>
      </div>
      <div className="hidden"><div ref={ref} className="report">
        <ReportHead title={`Audit — ${a.nom}`} sub={`Période du ${fmtDate(a.debut)} au ${fmtDate(a.fin)} · audit du ${fmtDate(a.date)}${a.auditeur ? ` · ${a.auditeur}` : ''}${a.organisme ? ` (${a.organisme})` : ''}`} />
        <h3>Points de contrôle</h3>
        <RTable head={['Point de contrôle', 'Résultat', 'Note']} rows={m.points.map((p, i) => { const rr = (a.reponses || {})[p.id] || {}; return [<>{i + 1}. <span>{p.texte}</span></>, rr.etat ? (AUDIT_ETATS.find((e) => e[0] === rr.etat) || ['', ''])[1] : '—', rr.note || '']; })} />
        {a.notes ? <p>{a.notes}</p> : null}
        {m.pieces.map((p) => <div key={p} className="rpt-section"><h3>{auditPieceNom(p)}</h3><AuditPiece piece={p} a={a} m={m} regs={regs} imprime /></div>)}
      </div></div>
    </Sheet>
  );
}
function AuditsView() {
  const { db, act, confirm } = useApp(); const [edM, setEdM] = useState(null); const [nouv, setNouv] = useState(null); const [ouvert, setOuvert] = useState(null);
  const M = auditModeles(db); const A = [...(db.audits || [])].filter(Boolean).sort((x, y) => String(y.date).localeCompare(String(x.date)));
  const suppr = async (a) => { if (await confirm({ title: `Supprimer l’audit du ${fmtDate(a.date)} ?`, body: 'Ses réponses et ses notes seront perdues.', ok: 'Supprimer', danger: true })) act((d) => auditSupprimer(d, a.id), 'Audit supprimé.'); };
  return (
    <div data-audits="">
      <Notice tone="info" title="Mode audit">Préparez la visite d’un auditeur (organisme bio ou Demeter, douanes, contrôle sanitaire, appellation…) : chaque type d’audit réunit les pièces qu’il attend — registres, bilan matière, stocks, test de traçabilité… — et ses points de contrôle. Pendant la visite, le mode audit présente tout chapitre par chapitre, note vos réponses, et le dossier s’imprime. Les types fournis sont des aide-mémoire à adapter : vérifiez-les avec votre organisme.</Notice>
      <Sec title="Types d’audit" right={<Btn onClick={() => setEdM({})} data-audit-nouveau-type="">＋ Nouveau type d’audit</Btn>}>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))' }}>
          {M.map((m) => (
            <div key={m.id} className="card flex flex-col gap-2 p-4" data-audit-type={m.id}>
              <div className="flex items-start gap-2"><span style={{ fontSize: 22 }} aria-hidden="true">{m.icone}</span><b className="min-w-0 flex-1">{m.nom}</b>{m.modifie ? <Chip tone="info">personnalisé</Chip> : !m.fourni ? <Chip>créé par vous</Chip> : null}</div>
              <div className="text-sm text-ink2">{m.desc}</div>
              <div className="text-xs text-ink2">{`${m.pieces.length} pièce(s) · ${m.points.length} point(s) de contrôle`}</div>
              <div className="mt-auto flex flex-wrap gap-2 pt-1"><Btn kind="primary" onClick={() => setNouv(m.id)}>Préparer un audit</Btn><Btn onClick={() => setEdM({ id: m.id })}>Personnaliser</Btn></div>
            </div>))}
        </div>
      </Sec>
      <Sec title={`Audits (${A.length})`}>
        <Tbl rows={A} empty="Aucun audit pour l’instant : « Préparer un audit »." cols={[
          { h: 'Date', r: (a) => <span className="num">{fmtDate(a.date)}</span> }, { h: 'Type', r: (a) => <b>{a.nom}</b> },
          { h: 'Période', cls: 'hm', r: (a) => `${fmtDate(a.debut)} → ${fmtDate(a.fin)}` }, { h: 'Auditeur', cls: 'hm', r: (a) => [a.auditeur, a.organisme].filter(Boolean).join(' · ') || '—' },
          { h: 'Résultats', r: (a) => <span className="flex flex-wrap items-center gap-1">{a.statut === 'clos' ? <Chip>clos</Chip> : <Chip tone="info">en cours</Chip>}<AuditResumeChips a={a} /></span> },
          { h: '', r: (a) => <span className="flex flex-wrap gap-1"><Btn size="sm" kind="primary" onClick={() => setOuvert(a.id)} data-audit-ouvrir={a.id}>Ouvrir le mode audit</Btn><Btn size="sm" kind="ghost" onClick={() => suppr(a)}>Supprimer</Btn></span> }]} />
      </Sec>
      {edM ? <AuditModeleForm id={edM.id} onClose={() => setEdM(null)} /> : null}
      {nouv ? <AuditForm modeleId={nouv} onClose={() => setNouv(null)} onCree={(id) => { setNouv(null); setOuvert(id); }} /> : null}
      {ouvert ? <ModeAudit id={ouvert} onClose={() => setOuvert(null)} /> : null}
    </div>
  );
}
