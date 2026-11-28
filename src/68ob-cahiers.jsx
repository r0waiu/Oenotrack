/* ============ CAHIERS DES CHARGES : FICHE, ALERTES NON BLOQUANTES, PRÉ-RÉGLAGES (0.50.0-alpha.3) ============
   Fiche « 📜 Cahier des charges » d'une appellation (Paramètres › Vignoble › Appellations), alertes sur la fiche d'un lot et dans le
   formulaire d'une parcelle (jamais bloquantes), ajout proposé des cépages de l'appellation. Moteur : 16og-cahiers.js. */
const CDC_LIGNES = [['cp', 'Cépages principaux'], ['ca', 'Cépages accessoires'], ['rc', 'Règles d’encépagement'], ['r', 'Rendement (hL/ha)'], ['rb', 'Rendement butoir (hL/ha)'], ['rk', 'Rendement (kg/ha)'],
  ['su', 'Richesse en sucre minimale (g/L)'], ['tn', 'TAV naturel minimal (% vol)'], ['ta', 'TAV acquis minimal (% vol)'], ['tt', 'TAV total maximal (% vol)'], ['en', 'Enrichissement'], ['sr', 'Sucres'], ['el', 'Élevage'], ['mm', 'Mise en marché']];
const cdcValeur = (k, v) => (Array.isArray(v) ? v.join(', ') : typeof v === 'number' ? fmt(v, k === 'rk' || k === 'su' ? 0 : 1) : String(v));
function CdcSheet({ refId, appId, onClose }) {
  const { db, act } = useApp(); const lect = useLectureSeule('params'); const cdc = cdcDe(refId);
  if (!cdc) return <Sheet title="Cahier des charges" onClose={onClose}><Empty>Aucun cahier des charges relevé pour cette appellation.</Empty></Sheet>;
  const T = cdc.fiche.t || []; const P = cdc.fiche.p || {}; const manq = appId ? cdcCepagesManquants(db, appId) : [];
  return (<Sheet wide title={<span>📜 <span translate="no">{cdc.denomination || cdc.nom}</span></span>} sub={cdc.denomination ? `Cahier des charges de l’appellation ${cdc.nom}` : 'Cahier des charges en vigueur'} onClose={onClose}>
    <div className="space-y-4" data-cdc={cdc.id}>
      <p className="text-sm"><span translate="no">{cdc.version}</span>{' '}{cdc.source ? <a href={cdc.source} target="_blank" rel="noopener noreferrer" className="underline" data-cdc-source="">Texte officiel ↗</a> : null}{' '}{cdc.verifie ? <Chip tone="ok">lu dans le texte en vigueur</Chip> : <Chip tone="warn">à vérifier</Chip>}</p>
      {cdc.remarque ? <Notice tone="info" title="Remarque du relevé"><span translate="no">{cdc.remarque}</span></Notice> : null}
      {manq.length && !lect ? <div className="flex flex-wrap items-center gap-2 text-sm" data-cdc-cepages-manquants=""><span>{`${manq.length} cépage(s) du cahier des charges absent(s) de votre liste :`}</span><span translate="no">{manq.join(', ')}</span><Btn size="sm" onClick={() => act((d) => cdcCepagesAjouter(d, appId), 'Cépages ajoutés à la liste.')} data-cdc-cepages-ajouter="">＋ Ajouter ces cépages</Btn></div> : null}
      {T.map((b, i) => (<div key={i} className="card p-3" data-cdc-bloc={i}><h4 className="mb-2 font-semibold" translate="no">{b.p || [CDC_CODES_COUL[b.c], CDC_CODES_CAT[b.k]].filter(Boolean).join(' · ') || 'Tous les vins'}</h4>
        <dl className="grid gap-x-4 gap-y-1 text-sm" style={{ gridTemplateColumns: 'minmax(160px,auto) 1fr' }}>{CDC_LIGNES.filter(([k]) => b[k] != null && b[k] !== '').map(([k, l]) => <Fragment key={k}><dt className="text-ink2">{l}</dt><dd translate="no">{cdcValeur(k, b[k])}</dd></Fragment>)}</dl></div>))}
      {P.i && P.i.length ? <Sec title="Pratiques interdites"><ul className="list-disc pl-5 text-sm" translate="no">{P.i.map((x) => <li key={x}>{x}</li>)}</ul></Sec> : null}
      {P.m && P.m.length ? <Sec title="Pratiques imposées"><ul className="list-disc pl-5 text-sm" translate="no">{P.m.map((x) => <li key={x}>{x}</li>)}</ul></Sec> : null}
      {P.co || P.dp ? <p className="text-sm">{P.co ? <span translate="no">{`${P.co} `}</span> : null}{P.dp ? <span>{`Densité de plantation minimale : ${fmt(P.dp, 0)} pieds/ha.`}</span> : null}</p> : null}
      {cdc.denominations.length ? <Sec title={`Dénominations et mentions (${cdc.denominations.length})`}><p className="text-sm" translate="no">{cdc.denominations.map((x) => x.nom).join(' · ')}</p></Sec> : null}
      <p className="help">Relevé du 28/11/2026 dans les cahiers des charges homologués (Bulletin officiel, fiches de l’INAO). Seul le texte officiel fait foi : vérifiez-le avant toute décision.</p>
    </div>
  </Sheet>);
}
// alertes d'un lot (fiche du lot) : non bloquantes
function CdcAlertesLot({ lotId }) {
  const { db, R } = useApp(); const A = useMemo(() => cdcAlertesLot(db, R, lotId), [db, R, lotId]); if (!A.length) return null;
  return (<div className="mb-4" data-cdc-alertes-lot=""><Notice tone="warn" title="Cahier des charges de l’appellation"><ul className="list-disc pl-5">{A.map((a, i) => <li key={i}>{a.msg}</li>)}</ul><p className="mt-1 text-xs">Avertissement seulement : rien n’est bloqué.</p></Notice></div>);
}
// formulaire d'une parcelle : cépage hors cahier des charges, rendement de la campagne
function CdcParcelleNotice({ f, id }) {
  const { db, R, camp } = useApp(); if (!f.appellationId) return null; const cdc = cdcDeListe(db, f.appellationId); if (!cdc) return null;
  const hors = f.cepageId && cdcCepageAutorise(db, cdc, f.cepageId, {}) === false; const rend = id ? cdcAlertesParcelle(db, R, id, camp).filter((a) => a.type === 'rendement') : [];
  if (!hors && !rend.length) return null;
  return (<div data-cdc-parcelle=""><Notice tone="warn" title="Cahier des charges de l’appellation">{hors ? <div>{`${lbl(db, 'cepages', f.cepageId)} n’est pas un cépage du cahier des charges « ${cdc.nom} ».`}</div> : null}{rend.map((a, i) => <div key={i}>{a.msg}</div>)}</Notice></div>);
}
