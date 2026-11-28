/* ============ ANALYSES › IMPORT DES BULLETINS D'ANALYSES (0.27.0-alpha.1 ; rapports multi-échantillons 0.37.0-alpha.1) ============
   Dépôt d'un ou plusieurs bulletins (PDF, scan, photo, tableur, CSV, texte) : vérifiés par la garde des importations, lus (pdf.js,
   reconnaissance de caractères, tableur), reconnus par le script (16f-bulletins.js), complétés par l'IA si elle est configurée
   (réglage « Lire les bulletins d'analyses avec l'IA ») ; puis vérification : lot, contenant, date, modèle, valeurs cochées, nouveaux
   paramètres ; enregistrement des analyses avec le bulletin joint (une fiche de document, ouverte depuis chaque analyse). */
const BULLETIN_ACCEPT = '.pdf,application/pdf,image/*,.csv,.tsv,.txt,.xlsx,.xls,.ods,text/csv,text/plain';
// lecture d'un bulletin → { lignes, texte, ocr }
async function bulletinLireFichier(file, { onEtape } = {}) {
  const et = (t) => { if (onEtape) onEtape(t); };
  if (estPdf(file)) {
    et('Ouverture du PDF…');
    return pdfAvecDocument(file, async (doc) => {
      const n = Math.min(doc.numPages, 12); let pages = [];
      for (let i = 1; i <= n; i += 1) { et(`Lecture de la page ${i} / ${n}…`); const pg = await doc.getPage(i); const t = await pdfPageItems(pg); pages.push({ n: i, ...t, pg, vide: t.items.map((it) => it.s).join('').replace(/[^A-Za-zÀ-ÿ]/g, '').length < 40 }); }
      let ocr = false;
      if (pages.length && pages.every((p) => p.vide)) { // scan : reconnaissance de caractères (4 pages au plus)
        ocr = true; const max = Math.min(pages.length, 4); const P = [];
        for (let i = 0; i < max; i += 1) { et(`Scan : reconnaissance du texte, page ${i + 1} / ${max} (la première fois, le module de lecture se télécharge)…`); const r = await renduPage(pages[i].pg, 250); nettoyerScan(r.canvas); P.push({ ...(await ocrCanvas(r.canvas, i + 1, r.echelle)), n: i + 1 }); r.canvas.width = 0; }
        pages = P;
      }
      const lignes = bulletinLignesDePages(pages); return { lignes, texte: lignes.map((l) => l.texte).join('\n'), ocr };
    });
  }
  if (estImage(file)) { et('Photo : reconnaissance du texte (la première fois, le module de lecture se télécharge)…'); const c = nettoyerScan(await imageCanvas(file)); const p = await ocrCanvas(c, 1, 1); const lignes = bulletinLignesDePages([p]); return { lignes, texte: lignes.map((l) => l.texte).join('\n'), ocr: true }; }
  if (estTableur(file)) {
    et('Lecture du tableur…'); try { await loadXlsx(); } catch (e) { /* message ci-dessous */ } if (!window.XLSX || !window.XLSX.read) throw new Error('lecture Excel indisponible (bibliothèque non chargée, hors ligne ?) : enregistrez le tableau en CSV');
    const ab = await file.arrayBuffer(); const rows = gardeSurveiller(() => { const wb = window.XLSX.read(ab, { type: 'array' }); return wb.SheetNames.slice(0, 4).flatMap((sn) => window.XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' })); });
    const lignes = bulletinLignesDeTableau(rows.slice(0, 3000)); return { lignes, texte: lignes.map((l) => l.texte).join('\n'), ocr: false };
  }
  const texte = await lectureFichier(file); const lignes = bulletinLignesDeTexte(String(texte || '').slice(0, 2e6)); return { lignes, texte: lignes.map((l) => l.texte).join('\n'), ocr: false };
}
// lecture complète d'un bulletin (0.37.0-alpha.1, commune à l'onglet Analyses et à l'entrée de moûts) : script, puis l'IA si elle est configurée
// → { res, ocr, ia } ; candidats : lots et contenants à reconnaître (aucun pour les moûts reçus, rapprochés par leur n° de lot)
async function bulletinLireAnalyser(db, R, f, { onEtape, candidats } = {}) {
  const et = (t) => { if (onEtape) onEtape(t); };
  const L = await bulletinLireFichier(f, { onEtape: et }); const cands = candidats || bulletinCandidats(db, R);
  let res = bulletinAnalyser(db, R, L.lignes, { candidats: cands }); let ia = null; const c = iaActive();
  if (c.pret && c.bulletins !== false && L.texte.trim()) {
    et(`${c.nom} complète la lecture…`);
    try { const p = iaPromptBulletin(db, L.texte, L.ocr); const r = await iaDemander(c, p); const o = iaJson(r.texte); const x = iaLireBulletin(db, o); if (x) { res = bulletinFusion(db, R, res, x, cands); ia = { ok: true, n: x.echantillons.length }; } else ia = { ok: false, msg: 'réponse illisible' }; }
    catch (e) { ia = { ok: false, msg: (e && e.message) || 'échec' }; }
  }
  return { res, ocr: L.ocr, ia };
}
/* ---------- 0.49.0-alpha.1 (IA18) : commentaire d'un bulletin d'analyses par l'IA (usage « bulletinCommentaire », niveau 2) ----------
   Envoyé : les résultats (nom, valeur, unité), le stade, la couleur, le type de vin et la revendication du lot, le plafond de SO₂ total et
   les alertes déjà calculées par le moteur (jamais le code du lot, la cuve, les produits ni les volumes) ; aperçu avant le premier envoi.
   Le commentaire complète les règles du moteur, « à vérifier avec votre œnologue » : rien n'est enregistré. */
// discret : bouton caché quand l'usage n'est pas possible (liste des analyses : pas de bouton grisé sur chaque ligne)
function BulletinCommentaireBouton({ lotId, valeurs, nouveaux, date, size = 'sm', discret }) {
  const [ouvert, setOuvert] = useState(false); const ia = useIaUsage();
  if (discret && ia.refus('bulletinCommentaire')) return null;
  return <>{lotId ? <IaBouton usage="bulletinCommentaire" size={size} onClick={() => setOuvert(true)}>Commenter</IaBouton> : null}
    {ouvert ? <BulletinCommentaire lotId={lotId} valeurs={valeurs} nouveaux={nouveaux} date={date} onClose={() => setOuvert(false)} /> : null}</>;
}
function BulletinCommentaire({ lotId, valeurs, nouveaux, date, onClose }) {
  const { db } = useApp(); const ia = useIaUsage(); const [res, setRes] = useState(null); const [busy, setBusy] = useState(true); const lance = useRef(false);
  const Rd = useMemo(() => getR(db, isoOK(date) ? date : undefined), [db, date]);
  const donnees = useMemo(() => iaCommentaireDonnees(db, Rd, { lotId, valeurs, nouveaux, date }), [db, Rd, lotId, valeurs, nouveaux, date]);
  useEffect(() => { if (lance.current) return; lance.current = true; (async () => {
    try { const P = iaCommentairePrompt(donnees); const r = await ia.demander('bulletinCommentaire', P); if (!r) { setRes({ annule: true }); return; } const x = iaCommentaireLire(r.valeur); setRes(x.ok ? { ...x, trace: r.trace } : { erreur: x.msg }); }
    finally { setBusy(false); }
  })(); }, []);
  return (
    <Sheet title="🤖 Commentaire du bulletin" sub={`${lotCode(db, Rd, lotId)}${date ? ` · ${fmtDate(date)}` : ''}`} onClose={onClose} footer={<Btn onClick={onClose}>Fermer</Btn>}>
      <div className="space-y-3" data-bulletin-commentaire="">
        <Notice tone="warn" title="À vérifier avec votre œnologue">L’IA complète les règles d’Œnotrack ; elle peut se tromper. Ce commentaire n’est pas enregistré.</Notice>
        <Sec title="Règles d’Œnotrack">
          <div className="space-y-1 text-sm" data-commentaire-moteur="">
            {donnees.plafondSo2Total ? <div><span>Plafond de SO₂ total :</span> <b className="num">{`${fmt(donnees.plafondSo2Total.mgL)} mg/L`}</b>{donnees.plafondSo2Total.aVerifier ? <Chip tone="warn">à vérifier</Chip> : null}</div> : null}
            {(donnees.alertesMoteur || []).length ? <ul className="list-disc pl-5">{donnees.alertesMoteur.map((a) => <li key={a}>{a}</li>)}</ul> : <div className="text-ink2">Aucune alerte de conformité pour ce lot.</div>}
          </div>
        </Sec>
        {busy ? <div className="text-sm text-ink2" role="status">⏳ L’IA lit le bulletin…</div>
          : res && res.annule ? <div className="text-sm text-ink2">Rien n’a été envoyé.</div>
            : res && res.erreur ? <Notice tone="bad">{res.erreur}</Notice>
              : res ? <Sec title="Commentaire de l’IA">
                {res.synthese ? <p className="text-sm" data-commentaire-synthese="">{res.synthese}</p> : null}
                {res.points.length ? <ul className="mt-2 space-y-1" data-commentaire-points="">{res.points.map((p, i) => { const N = IA_COMMENTAIRE_NIVEAUX[p.niveau]; return <li key={i} className="flex flex-wrap items-start gap-2 text-sm" data-commentaire-niveau={p.niveau}><Chip tone={N[0]}>{N[1]}</Chip>{p.parametre ? <b>{p.parametre}</b> : null}<span className="min-w-0 flex-1">{p.message}</span></li>; })}</ul>
                  : <p className="text-sm text-ink2">Aucun résultat à surveiller selon l’IA.</p>}
                {res.trace && res.trace.modele ? <div className="mt-2 text-xs text-ink2"><span>Modèle :</span> <span translate="no">{res.trace.modele}</span></div> : null}
              </Sec> : null}
      </div>
    </Sheet>
  );
}
const bulValTexte = (v, dec) => { const k = Math.pow(10, Math.min(5, (dec || 0) + 1)); return String(Math.round(v * k) / k).replace('.', ','); };

function BulletinsImport() {
  const { db, R, camp } = useApp(); const [lus, setLus] = useState(null); const [busy, setBusy] = useState('');
  const lire = async (files) => {
    const out = []; const cands = bulletinCandidats(db, R);
    for (const f of files) {
      try {
        setBusy(`« ${f.name} » : lecture…`); const x = await bulletinLireAnalyser(db, R, f, { candidats: cands, onEtape: (t) => setBusy(`« ${f.name} » : ${t}`) });
        out.push({ file: f, ...x });
      } catch (e) { out.push({ file: f, erreur: lectureEchec(f, e) }); }
    }
    setBusy(''); setLus(out);
  };
  return (
    <div className="mb-4" data-bulletins="">
      <ZoneDepot onFiles={lire} accept={BULLETIN_ACCEPT} garde="bulletin" icon="🧪" kind="primary" busy={!!busy} disabled={camp.figee} label="Importer des bulletins d’analyses" sub={busy || 'PDF, scan, photo, tableur ou CSV du laboratoire : lus et rattachés aux lots automatiquement, à vérifier avant d’enregistrer'} inputLabel="Bulletins d’analyses à importer" />
      {lus ? <BulletinRevue lus={lus} onClose={() => setLus(null)} /> : null}
    </div>
  );
}

function BulletinRevue({ lus, onClose }) {
  const { db, R, act, toast } = useApp();
  const getRd = useCallback((d) => getR(db, isoOK(d) ? d : undefined), [db]);
  const par = (id) => (db.analysesParams || []).find((p) => p.id === id) || { nom: id, unite: '', dec: 2 };
  const [rows, setRows] = useState(() => lus.flatMap((x, fi) => (x.res ? x.res.echantillons.map((e, ei) => {
    const r = bulletinRattacher(db, getRd, e, x.res.date); const ids = Object.keys(e.valeurs);
    return { k: `${fi}-${ei}`, fi, ref: e.ref, numero: e.numero || '', ia: e.src === 'ia', on: !!r.lotId, date: r.date, lotId: r.lotId, contenantId: r.contenantId, doute: r.doute, modeleId: bulletinModele(db, ids),
      vals: Object.fromEntries(ids.map((k) => [k, { v: bulValTexte(e.valeurs[k].v, par(k).dec), op: e.valeurs[k].op || '', on: true, src: e.valeurs[k].src, ia: e.valeurs[k].ia, label: e.valeurs[k].label }])),
      nouveaux: Object.fromEntries(Object.values(e.nouveaux).map((n) => [n.cle, { ...n, v: bulValTexte(n.v, n.dec), on: true }])) };
  }) : [])));
  const maj = (k, patch) => setRows((L) => L.map((r) => (r.k === k ? { ...r, ...(typeof patch === 'function' ? patch(r) : patch) } : r)));
  const choisis = rows.filter((r) => r.on && r.lotId && (Object.values(r.vals).some((v) => v.on && hasNum(v.v)) || Object.values(r.nouveaux).some((n) => n.on && hasNum(n.v))));
  const lots = Object.values(R.lots).sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
  const lotOpts = lots.map((l) => ({ value: l.id, label: `${l.code} · ${l.designation || LOT_TYPES[l.type]}${(R.lotVol[l.id] || 0) > 0 ? ` · ${fmtL(R.lotVol[l.id])}` : ''}` }));
  const enregistrer = async () => {
    if (!choisis.length) { toast('Cochez au moins un échantillon rattaché à un lot.', 'bad'); return; }
    const plans = []; let nDocs = 0;
    for (const fi of uniq(choisis.map((r) => r.fi))) {
      const x = lus[fi]; const f = x.file; const id = newDocId(); let doc = null;
      try { await docPut(id, f); doc = { id, nom: gardeNomPropre(f.name), mime: f.type || '', taille: f.size || 0, garde: gardeResume(GARDE_VERDICTS.get(f)) }; nDocs += 1; } catch (e) { doc = null; }
      const L = choisis.filter((r) => r.fi === fi); const params = {}; L.forEach((r) => Object.values(r.nouveaux).forEach((n) => { if (n.on && hasNum(n.v)) params[n.cle] = { cle: n.cle, nom: n.nom, unite: n.unite, dec: n.dec }; }));
      const entete = [x.res.labo, x.res.numero ? `bulletin n° ${x.res.numero}` : ''].filter(Boolean).join(', ');
      plans.push({ doc, params: Object.values(params), analyses: L.map((r) => {
        const valeurs = {}; const notes = [];
        Object.keys(r.vals).forEach((k) => { const v = r.vals[k]; if (!v.on || !hasNum(v.v)) return; valeurs[k] = num(v.v); if (v.op) notes.push(`${par(k).nom} ${v.op} ${v.v}`); });
        Object.values(r.nouveaux).forEach((n) => { if (!n.on || !hasNum(n.v)) return; valeurs[`+${n.cle}`] = num(n.v); if (n.op) notes.push(`${n.nom} ${n.op} ${n.v}`); });
        return { ref: r.ref, date: r.date, lotId: r.lotId, contenantId: r.contenantId, modeleId: r.modeleId, valeurs, ia: r.ia || Object.values(r.vals).some((v) => v.on && v.src === 'ia'), notes: [`Bulletin${entete ? ` (${entete})` : ''} — ${r.ref}${r.numero && r.numero !== r.ref ? ` (échantillon ${r.numero})` : ''}`, ...notes].join(' ; ') };
      }) });
    }
    const n = sum(plans, (p) => p.analyses.length);
    const res = act((d) => { for (const p of plans) { const r1 = bulletinEnregistrer(d, p); if (!r1.ok) return r1; } return okr(); }, nDocs ? `Analyses enregistrées : ${n} (bulletin joint).` : `Analyses enregistrées : ${n}.`);
    if (res && res.ok) onClose(); else plans.forEach((p) => { if (p.doc) docDel(p.doc.id).catch(() => null); });
  };
  return (
    <Sheet wide title="Bulletins d’analyses : vérification" sub="Lu automatiquement : vérifiez le lot, la date et les valeurs avant d’enregistrer" onClose={onClose} footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" onClick={enregistrer} disabled={!choisis.length}>{`Enregistrer les analyses (${choisis.length})`}</Btn></>}>
      <div className="space-y-4" data-bulletin-revue="">
        {lus.map((x, fi) => (
          <div key={fi} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2"><b className="break-all">📄 {x.file.name}</b>{x.res && x.res.labo ? <Chip>{x.res.labo}</Chip> : null}{x.res && x.res.numero ? <Chip>{`n° ${x.res.numero}`}</Chip> : null}{x.res && x.res.echantillons.length > 1 ? <Chip tone="info">{`${x.res.echantillons.length} échantillons`}</Chip> : null}{x.ocr ? <Chip tone="info" title="Texte reconnu sur un scan ou une photo : vérifiez les chiffres">reconnaissance de caractères</Chip> : null}
              {x.ia ? (x.ia.ok ? <Chip tone="ok">🤖 lecture complétée par l’IA</Chip> : <Chip tone="warn" title={x.ia.msg}>🤖 IA indisponible</Chip>) : null}</div>
            {x.erreur ? <Notice tone="bad">{x.erreur}</Notice> : !rows.some((r) => r.fi === fi) ? <Notice tone="warn"><div>Aucun résultat reconnu dans ce bulletin.</div>{iaActive().pret ? null : <div>Configurez l’assistant IA (Paramètres › 🤖 Assistant IA) pour compléter la lecture.</div>}</Notice> : null}
            {rows.filter((r) => r.fi === fi).map((r) => (
              <div key={r.k} className={cx('card space-y-2 p-3', !r.on && 'opacity-70')} data-bulletin-ech={r.ref}>
                <div className="flex flex-wrap items-center gap-2"><Check checked={r.on} onChange={(v) => maj(r.k, { on: v })} label={<b>{r.ref}</b>} />{r.numero && r.numero !== r.ref ? <Chip title="N° d’échantillon du laboratoire"><span translate="no">{`n° ${r.numero}`}</span></Chip> : null}{r.ia ? <Chip tone="info">🤖 trouvé par l’IA</Chip> : null}{r.doute ? <Chip tone="warn">{r.doute}</Chip> : null}
                  <span className="ml-auto"><BulletinCommentaireBouton lotId={r.lotId} date={r.date} valeurs={Object.fromEntries(Object.keys(r.vals).filter((k) => r.vals[k].on && hasNum(r.vals[k].v)).map((k) => [k, num(r.vals[k].v)]))} nouveaux={Object.values(r.nouveaux).filter((n) => n.on && hasNum(n.v)).map((n) => ({ nom: n.nom, v: num(n.v), unite: n.unite }))} /></span></div>
                <G n={4}><Field label="Date du prélèvement"><DI value={r.date} onChange={(v) => maj(r.k, { date: v })} /></Field>
                  <Field label="Lot analysé"><SI value={r.lotId} onChange={(v) => maj(r.k, (o) => { const Rd = getRd(o.date); const cs = uniq(Object.values(Rd.portions).filter((p) => p.lotId === v && p.vol > 0.0001).map((p) => p.contenantId)); return { lotId: v, on: !!v, doute: '', contenantId: cs.length === 1 ? cs[0] : o.contenantId }; })} placeholder="Lot…" options={lotOpts} aria-label={`Lot de ${r.ref}`} /></Field>
                  <Field label="Contenant prélevé"><SI value={r.contenantId} onChange={(v) => maj(r.k, { contenantId: v })} placeholder="Contenant (facultatif)" options={contOptions(db, true)} aria-label={`Contenant de ${r.ref}`} /></Field>
                  <Field label="Modèle de fiche"><SI value={r.modeleId} onChange={(v) => maj(r.k, { modeleId: v })} placeholder="Libre (tous les paramètres)" options={db.analysesModeles.map((m) => ({ value: m.id, label: m.nom }))} /></Field></G>
                <div className="grid gap-x-4 gap-y-1" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))' }}>
                  {Object.keys(r.vals).map((k) => { const v = r.vals[k]; const p = par(k); return (
                    <div key={k} className="flex items-center gap-2 text-sm" data-bulletin-val={k}><input type="checkbox" checked={v.on} onChange={(e) => maj(r.k, (o) => ({ vals: { ...o.vals, [k]: { ...v, on: e.target.checked } } }))} aria-label={`Reprendre ${p.nom}`} />
                      <span className="min-w-0 flex-1 truncate" title={v.label ? `Lu : « ${v.label} »` : ''}>{`${p.nom}${p.unite ? ` (${p.unite})` : ''}`}</span>
                      {v.op ? <span className="text-ink2">{v.op}</span> : null}<input className="inp num" style={{ width: 86, minHeight: 30, padding: '2px 6px' }} inputMode="decimal" value={v.v} onChange={(e) => maj(r.k, (o) => ({ vals: { ...o.vals, [k]: { ...v, v: e.target.value } } }))} aria-label={`Valeur ${p.nom}`} />
                      {v.src === 'ia' ? <span title="Valeur trouvée par l’IA">🤖</span> : null}{v.ia != null ? <span className="chip chip-warn" title="L’IA a lu une autre valeur">{`IA : ${String(v.ia).replace('.', ',')}`}</span> : null}</div>); })}
                  {Object.values(r.nouveaux).map((n) => (
                    <div key={n.cle} className="flex items-center gap-2 text-sm" data-bulletin-nouveau={n.cle}><input type="checkbox" checked={n.on} onChange={(e) => maj(r.k, (o) => ({ nouveaux: { ...o.nouveaux, [n.cle]: { ...n, on: e.target.checked } } }))} aria-label={`Créer ${n.nom}`} />
                      <span className="min-w-0 flex-1 truncate"><Chip tone="info">nouveau</Chip> <span>{`${n.nom}${n.unite ? ` (${n.unite})` : ''}`}</span></span>{n.op ? <span className="text-ink2">{n.op}</span> : null}
                      <input className="inp num" style={{ width: 86, minHeight: 30, padding: '2px 6px' }} inputMode="decimal" value={n.v} onChange={(e) => maj(r.k, (o) => ({ nouveaux: { ...o.nouveaux, [n.cle]: { ...n, v: e.target.value } } }))} aria-label={`Valeur ${n.nom}`} />{n.src === 'ia' ? <span title="Valeur trouvée par l’IA">🤖</span> : null}</div>))}
                </div>
              </div>))}
          </div>))}
        <p className="help">Les paramètres « nouveau » cochés sont créés (Analyses › Paramètres &amp; modèles de fiches). Le bulletin est joint aux analyses enregistrées : 📄 dans la liste des analyses.</p>
      </div>
    </Sheet>
  );
}
