/* ============ ONGLET PRESSOIR (0.24.0-alpha.1) : registre des pesées, carnet de pressoir, relevés, bilan, journal, réglages ============
   Moteur : 19-pressoir.js. Une pesée est une opération « apport » (proposée aussitôt dans les pressurages de l'onglet Opérations),
   un marc une opération « pressurage » (ses lots de cuvée, tailles et rebêches entrent dans les cuves). */
const pMaintenant = () => new Date().toISOString();
const kgTxt = (x) => `${fmt(x)} kg`;
const etatLabel = (id) => (ETATS_SANITAIRES.find((e) => e.id === id) || {}).label || '';
const peseeOrigine = (db, o) => [o.cruId ? cruName(db, o.cruId) : '', o.parcelleId ? parcelleName(db, o.parcelleId) : '', (o.pesee || {}).mention || ''].filter(Boolean).join(' · ');
const peseeLibelle = (db, o, reste) => `${o.pesee && o.pesee.num ? `n° ${o.pesee.num}` : 'sans n°'} · ${fmtDate(o.date)}${o.pesee && o.pesee.heure ? ` ${o.pesee.heure}` : ''} · ${lbl(db, 'cepages', o.cepageId)} · ${o.apporteurId ? apporteurName(db, o.apporteurId) : 'exploitation'}${o.cruId ? ` · ${cruName(db, o.cruId)} (${cruEchUn(db, o.cruId)})` : ''}${reste != null ? ` · reste ${kgTxt(reste)}` : ''}`;
// échelle des crus d'un cru (0.27.0-alpha.2) : son classement (Grand Cru, 1er Cru, Autre cru…), jamais de pourcentage
const echUn = (id) => { const e = eDef(id); return e ? e.un : 'Non classé'; };
const cruEchUn = (db, cruId) => (cruId ? echUn(cruEchelle(db, cruId)) : '');
function EchelleCru({ cruId }) {
  const { db } = useApp(); if (!cruId) return null; const id = cruEchelle(db, cruId);
  return <span className="chip ech-chip" data-echelle-cru={id || ''} style={{ borderColor: eColor(db, id) }}><i aria-hidden="true" style={{ background: eColor(db, id) }} />{echUn(id)}</span>;
}
// kg par clé (cépage, échelle…) → « Chardonnay = 4 345 kg / Meunier = 451 kg » (du plus lourd au plus léger)
const kgListe = (m, lib) => Object.keys(m).filter((k) => num(m[k]) > 0).sort((a, b) => num(m[b]) - num(m[a])).map((k) => `${lib(k)} = ${kgTxt(m[k])}`).join(' / ');
const centrePressurage = (db) => { const e = db.entreprise || {}; const site = (db.sites || [])[0] || {}; return { nom: e.nom || db.settings.domaine || site.nom || '', adresse: e.adresse || site.adresse || '', ident: e.identifiants || '', logo: e.logo || '' }; };
// code de la pressée suivante (P26-06…) : d'après les codes des pressées seulement, pas ceux de leurs fractions
function codeMarcSuivant(db, date) {
  const yy = pad(yearOf(date) % 100); const re = new RegExp(`^P${yy}-(\\d+)$`);
  let n = Math.max(0, ...(db.lots || []).map((l) => { const m = re.exec(String(l.code || '')); return m ? num(m[1]) : 0; })) + 1;
  let c = `P${yy}-${pad(n)}`; while (codeLotPris(db, c)) { n += 1; c = `P${yy}-${pad(n)}`; } return c;
}
const statutChip = (x, objet) => (x && x.valide ? <Chip tone="ok">validé{objet === 'pesee' ? 'e' : ''}</Chip> : x && x.enCours ? <Chip tone="info">en cours</Chip> : <Chip tone="warn">à valider</Chip>);
// droits (identifiants activés) : saisie au pressoir ; correction d'une saisie validée : droit « corriger »
function usePressoirDroits() {
  const { db, uid } = useApp(); const secu = securiteActive(db);
  const ecrit = !secu || niveauModule(db, uid, 'pressoir') === 'ecriture' || niveauModule(db, uid, 'ops') === 'ecriture';
  return { secu, ecrit, corriger: ecrit && (!secu || peut(db, uid, 'modifier')), annuler: ecrit && (!secu || peut(db, uid, 'supprimer')), params: !secu || niveauModule(db, uid, 'params') === 'ecriture' };
}

/* ---------- motif (correction, annulation) ---------- */
function MotifSheet({ title, body, ok = 'Confirmer', danger, onClose }) {
  const [m, setM] = useState('');
  return (
    <Sheet title={title} onClose={() => onClose(null)} footer={<><Btn onClick={() => onClose(null)}>Annuler</Btn><Btn kind={danger ? 'danger' : 'primary'} disabled={!m.trim()} onClick={() => onClose(m.trim())}>{ok}</Btn></>}>
      <div className="space-y-3">{body ? <p className="text-sm text-ink2">{body}</p> : null}
        <Field label="Motif (obligatoire, gardé au journal du pressoir)"><TA value={m} onChange={setM} rows={3} autoFocus placeholder="ex. erreur de saisie du poids, pesée enregistrée deux fois…" data-motif="" /></Field></div>
    </Sheet>
  );
}

/* ---------- pesée : saisie (formulaire personnalisable : Pressoir › Réglages ou « ⚙ Personnaliser ce formulaire », 0.25.0-alpha.1) ---------- */
const nSaisie = (x) => (hasNum(x) ? String(x).replace('.', ',') : '');
// 0.49.0-alpha.1 (IA03) : ticket de pesée, bon de livraison ou DAE lu par l'IA (usage « pesee », niveau 2 : aperçu avant le premier envoi)
const PESEE_IA_LIBELLES = { date: 'Date', heure: 'Heure de la pesée', apporteur: 'Apporteur', cru: 'Cru (village)', parcelle: 'Parcelle', cepage: 'Cépage', poids: 'Poids', caisses: 'Caisses (nombre)', tap: 'TAP (% vol.)', numero: 'N° de bon / ticket' };
function PeseeIaLecture({ upd, lu, setLu, ia: trace }) {
  const { db, toast } = useApp(); const ia = useIaUsage(); const [busy, setBusy] = useState(false);
  const lire = async (files) => {
    setBusy(true);
    try {
      const images = await iaImagesDepuisFichiers(files, { pages: 2 }); const P = iaPeseePrompt(db, 'pesee');
      const r = await ia.demander('pesee', { system: P.system, texte: P.texte, images, schema: P.schema, nom: P.nom, max: P.max }); if (!r) return;
      const x = iaPeseeLire(db, r.valeur, P.codes); if (!x.ok) { toast(x.msg, 'bad'); return; }
      // poids brut et tare lus : le poids net est recalculé par le formulaire ; poids net seul : brut et tare vidés
      upd({ ...x.patch, ...(x.patch.brutKg ? { kg: '' } : x.patch.kg ? { brutKg: '', tareKg: '' } : {}), ia: r.trace }); setLu(x);
      toast('Document lu : pesée préremplie, à vérifier avant de la valider.');
    } catch (e) { toast((e && e.message) || 'Lecture impossible.', 'bad'); } finally { setBusy(false); }
  };
  return (
    <div className="space-y-2" data-pesee-ia="">
      <div className="flex flex-wrap items-center gap-2"><IaFichierBouton usage="pesee" photo busy={busy} onFichiers={lire}>Lire le ticket / le bon / le DAE</IaFichierBouton>{trace ? <IaTrace ia={trace} /> : null}</div>
      <IaLectureNotice x={lu} libelles={PESEE_IA_LIBELLES} />
    </div>
  );
}
function PeseeForm({ id, onClose, onTicket }) {
  const { db, defaultDate, moi, uid } = useApp(); const act = useActFiche(); /* 0.48.0-alpha.1 : erreur sous le champ */ const o = id ? db.ops.find((x) => x.id === id) : null; const p0 = (o && o.pesee) || {};
  const droits = usePressoirDroits(); const P = pressoirParams(db); const bal = balancesDe(db);
  const valide = !!p0.valide; const lecture = !droits.ecrit || (valide && !droits.corriger) || (o && isLocked(db, o.date));
  const fcfg = formulaireDe(db, 'pesee'); const persoD = fcfg.perso.filter((x) => x.position === 'debut'); const persoF = fcfg.perso.filter((x) => x.position !== 'debut');
  const [tout, setTout] = useState(false); const [cfgEd, setCfgEd] = useState(false); const [iaLu, setIaLu] = useState(null); const dt = (...k) => iaDoute(iaLu, ...k);
  const [f, set, setF] = useDraft(() => {
    if (o) return { date: o.date, heure: p0.heure || '', apporteurId: o.apporteurId || '', cruId: o.cruId || '', parcelleId: o.parcelleId || '', cepageId: o.cepageId, qualifId: o.qualifId || 'conv', mention: p0.mention || '', brutKg: hasNum(p0.brutKg) ? String(p0.brutKg) : '', tareKg: hasNum(p0.tareKg) ? String(p0.tareKg) : '', kg: String(o.kg), caisses: p0.caisses ? String(p0.caisses) : '', etat: p0.etat || '', pourritureAcide: nSaisie(p0.pourritureAcide), tap: nSaisie(p0.tap), heureCueillette: p0.heureCueillette || '', balanceId: p0.balanceId || '', ref: o.ref || '', notes: o.notes || '', operateurs: o.operateurs || [], champs: champsEtat(o), valider: true, motif: '' };
    const s0 = { date: defaultDate, heure: heureNow(), apporteurId: '', cruId: '', parcelleId: '', cepageId: (db.lists.cepages[0] || {}).id || '', qualifId: 'conv', mention: '', brutKg: '', tareKg: '', kg: '', caisses: '', etat: champEffectif(fcfg, 'pesee', 'etat').vis === 'masque' ? '' : 'sain', pourritureAcide: '', tap: '', heureCueillette: '', balanceId: (bal[0] || {}).id || '', ref: '', notes: '', operateurs: moi ? [moi] : [], champs: {}, valider: true, motif: '' };
    return formulaireDefauts(db, 'pesee', 'pesee', s0, {}); // valeurs proposées par le formulaire personnalisé
  });
  const upd = (patch) => setF((x) => ({ ...x, ...patch }));
  const cfgv = { cfg: fcfg, type: 'pesee', tout }; const E = (k) => champEffectif(fcfg, 'pesee', k);
  const fac = (k, l) => (E(k).obligatoire ? l : `${l} (facultatif)`);
  // état « Sain » : les relevés de pourriture (condition « si altéré ») disparaissent ; leurs valeurs reviennent si l'on change d'état
  const sain = etatSain(f); const vuPerso = (d) => !(sain && persoSiAltere(d)); const paVu = !(sain && E('pourritureAcide').siAltere);
  const condPourriture = E('pourritureAcide').siAltere || fcfg.perso.some(persoSiAltere);
  const nMasques = champsStd('pesee').filter((c) => E(c.k).vis === 'masque').length;
  // poids brut et tare : affichés s'ils ont une valeur, même masqués (le poids net en dépend)
  const btValeur = hasNum(f.brutKg) || hasNum(f.tareKg); const bt = btValeur || cfVisible(cfgv, 'brutTare'); const btReplie = !btValeur && !tout && E('brutTare').vis === 'replie';
  const net = bt && hasNum(f.brutKg) && hasNum(f.tareKg) ? r2(num(f.brutKg) - num(f.tareKg)) : hasNum(f.kg) ? num(f.kg) : 0;
  const pris = o ? r2(num(o.kg) - peseeReste(db, o.id)) : 0;
  const alertesTap = peseeAlertes(db, { pesee: { tap: hasNum(f.tap) ? num(f.tap) : null } });
  const save = () => {
    const r = act((d) => peseeSave(d, f, id || null, { motif: f.motif, par: uid, maintenant: pMaintenant(), valider: f.valider }), id ? 'Pesée modifiée.' : 'Pesée inscrite au registre.');
    if (r && r.ok) { onClose(); if (!id && onTicket) onTicket(r.op.id); }
  };
  const num0 = p0.num || numeroSuivant(db, 'pesee', yearOf(f.date));
  const btChamps = <><Field label="Poids brut (kg)" champ="brutKg"><NI value={f.brutKg} onChange={(v) => set('brutKg', v)} placeholder="ex. 4 300" aria-label="Poids brut" data-brut="" /></Field>
    <Field label="Tare (kg)" champ="tareKg"><NI value={f.tareKg} onChange={(v) => set('tareKg', v)} placeholder="caisses, palettes" aria-label="Tare" data-tare="" /></Field></>;
  return (
    <FormSheet readOnly={lecture} title={o ? `Pesée n° ${p0.num || '—'}` : 'Nouvelle pesée'} sub={o ? `${fmtDate(o.date)}${p0.heure ? ` · ${p0.heure}` : ''} — registre des pesées ${yearOf(o.date)}` : `Registre des pesées ${yearOf(f.date)} : n° ${num0}`} onClose={onClose} onSave={save} saveLabel={o ? 'Enregistrer' : f.valider ? 'Peser et valider' : 'Enregistrer'} wide>
      {valide ? <Notice tone="info" title={`Pesée validée le ${fmtDateHeure(p0.valide.le)}`}>Une correction reste possible : elle est gardée au journal du pressoir avec son motif (valeurs d’avant et d’après).{pris > 0 ? ` ${kgTxt(pris)} de cette pesée sont déjà chargés dans un marc.` : ''}</Notice> : null}
      {lecture && droits.ecrit && valide ? <Notice tone="info" title="Consultation">Votre profil ne permet pas de corriger une pesée validée.</Notice> : null}
      <FormCfgCtx.Provider value={cfgv}>
      {nMasques || (!lecture && droits.params) ? <div className="cf-barre">
        {nMasques ? <button type="button" className="linkish" onClick={() => setTout(!tout)} aria-pressed={tout}>{tout ? 'Cacher les champs masqués' : `Afficher tous les champs (${nMasques} masqué${nMasques > 1 ? 's' : ''})`}</button> : null}
        {!lecture && droits.params ? <button type="button" className="linkish" onClick={() => setCfgEd(true)} data-personnaliser-pesee="" title="Choisir les champs affichés, obligatoires, leurs valeurs par défaut, et ajouter vos propres relevés (les mentions obligatoires du ticket de pesée restent affichées)">⚙ Personnaliser ce formulaire</button> : null}
      </div> : null}
      {!lecture && !valide ? <PeseeIaLecture upd={upd} lu={iaLu} setLu={setIaLu} ia={f.ia || (o && o.ia)} /> : o && o.ia ? <div><IaTrace ia={o.ia} /></div> : null}
      <ChampsPerso defs={persoD.filter(vuPerso)} tous={fcfg.perso} f={f} upd={upd} type="pesee" />
      <G n={3}><CF k="date" label="Date" className={dt('date')}><DI value={f.date} onChange={(v) => set('date', v)} /></CF><CF k="heure" label="Heure de la pesée" className={dt('heure')}><input className="inp num" type="time" value={f.heure} onChange={(e) => set('heure', e.target.value)} aria-label="Heure de la pesée" data-heure="" /></CF>
        <CF k="balanceId" label="Balance / bascule">{bal.length ? <SI value={f.balanceId} onChange={(v) => set('balanceId', v)} placeholder="Choisir…" options={bal.map((b) => ({ value: b.id, label: `${b.nom}${b.valideJusquau ? ` (vignette au ${fmtDate(b.valideJusquau)})` : ''}` }))} /> : <div className="help pt-2">Ajoutez la bascule dans Pressoir › Réglages.</div>}</CF></G>
      <G><CF k="apporteurId" label="Apporteur" className={dt('apporteur')} help="Vide : raisins de l’exploitation. Pressurage à façon : le nom de l’apporteur est obligatoire au registre."><ApporteurSelect value={f.apporteurId} role="apporteur" onChange={(v) => setF((x) => ({ ...x, apporteurId: v, ...(v && !x.cruId && apporteurCruAuto(db, v) ? { cruId: apporteurCruAuto(db, v) } : {}) }))} /></CF>
        <CF k="cruId" label="Cru (village)" className={dt('cru')}><CruSelect value={f.cruId} onChange={(v) => set('cruId', v)} /><CrusProposes ids={[f.apporteurId]} cruId={f.cruId} onPick={(c) => set('cruId', c)} />{f.cruId ? <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink2" data-echelle-pesee=""><span>{`${ECH.nom} :`}</span><EchelleCru cruId={f.cruId} /></div> : null}</CF></G>
      <G n={3}><CF k="parcelleId" label={fac('parcelleId', 'Parcelle')} className={dt('parcelle')}><ParcelleSelect value={f.parcelleId} preset={{ cruId: f.cruId, cepageId: f.cepageId, apporteurId: f.apporteurId }} onChange={(v) => { const pc = (db.parcelles || []).find((x) => x.id === v); setF((x) => ({ ...x, parcelleId: v, ...(pc ? { cruId: pc.cruId || x.cruId, ...(pc.cepageId ? { cepageId: pc.cepageId } : {}), ...(pc.apporteurId ? { apporteurId: pc.apporteurId } : {}) } : {}) })); }} /></CF>
        <CF k="cepageId" label="Cépage" className={dt('cepage')}><SI value={f.cepageId} onChange={(v) => set('cepageId', v)} options={opts(db, 'cepages')} /></CF>
        <CF k="qualifId" label="Revendication"><SI value={f.qualifId} onChange={(v) => set('qualifId', v)} options={qualifOptions(db, f.qualifId)} /></CF></G>
      <CF k="mention" label="Revendication particulière : mention, lieu-dit…" help={P.registre ? 'Inscrite au registre et reprise au carnet de pressoir (origine des raisins).' : ''}><TI value={f.mention} onChange={(v) => set('mention', v)} placeholder="ex. lieu-dit « Les Chétillons », mention premier cru…" /></CF>
      <Group label="Poids" className={dt('poids')}>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
          {bt ? (btReplie ? <details className="cf-replie" data-champ="brutTare"><summary>{E('brutTare').libelle || 'Poids brut et tare'}{E('brutTare').obligatoire ? ' *' : ''}</summary><div className="mt-2 grid gap-2">{btChamps}</div></details> : btChamps) : null}
          {bt && hasNum(f.brutKg) && hasNum(f.tareKg) ? <Field label="Poids net"><div className="disp text-2xl" data-net="">{kgTxt(net)}</div></Field>
            : <CF k="kg" label={bt ? 'ou poids net (kg)' : 'Poids net (kg)'}><NI value={f.kg} onChange={(v) => set('kg', v)} placeholder="ex. 4 000" aria-label="Poids net" data-netkg="" /></CF>}
          <CF k="caisses" label="Caisses (nombre)" className={dt('caisses')}><NI value={f.caisses} onChange={(v) => set('caisses', v)} aria-label="Nombre de caisses" /></CF>
        </div>
      </Group>
      <G n={3}><CF k="etat" label="État sanitaire" help={sain && condPourriture ? 'Les relevés de pourriture apparaissent si l’état n’est pas « Sain ».' : undefined}><SI value={f.etat} onChange={(v) => set('etat', v)} placeholder="—" options={ETATS_SANITAIRES.map((e) => ({ value: e.id, label: e.label }))} aria-label="État sanitaire" data-etat="" /></CF>
        {paVu ? <CF k="pourritureAcide" label="Pourriture acide (%)" help="Part estimée des raisins atteints (baies vinaigrées, moucherons)."><NI value={f.pourritureAcide} onChange={(v) => set('pourritureAcide', v)} placeholder="ex. 2" aria-label="Pourriture acide" data-pourriture="" /></CF> : null}
        <CF k="tap" label="TAP (% vol.)" className={dt('tap')} help="Titre alcoométrique volumique en puissance des raisins (réfractomètre ou densimètre sur un échantillon de jus)."><NI value={f.tap} onChange={(v) => set('tap', v)} placeholder="ex. 10,2" aria-label="TAP" data-tap="" /></CF></G>
      {alertesTap.map((m) => <Notice key={m} tone="warn">{m}</Notice>)}
      <G><CF k="heureCueillette" label={fac('heureCueillette', 'Heure de cueillette')}><input className="inp num" type="time" value={f.heureCueillette} onChange={(e) => set('heureCueillette', e.target.value)} aria-label="Heure de cueillette" /></CF>
        <CF k="ref" label={fac('ref', 'N° de bon / ticket')} className={dt('numero')}><TI value={f.ref} onChange={(v) => set('ref', v)} /></CF></G>
      <ChampsPerso defs={persoF.filter(vuPerso)} tous={fcfg.perso} f={f} upd={upd} type="pesee" />
      <CF k="operateurs" label="Pesée faite par" bare><OperateursPicker value={f.operateurs} onChange={(v) => set('operateurs', v)} label={<>{E('operateurs').libelle || 'Pesée faite par'}{E('operateurs').obligatoire ? <CfReq /> : null}</>} help={E('operateurs').aide || ((db.settings.operateurObligatoire || E('operateurs').obligatoire) && !o ? 'Obligatoire (réglage de la société).' : '')} /></CF>
      <CF k="notes" label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} rows={2} /></CF>
      </FormCfgCtx.Provider>
      {o ? <DocsPanel cible={{ type: 'op', id: o.id }} kind="op" locked={isLocked(db, o.date)} /> : null}
      {!valide && !lecture ? <Check checked={f.valider} onChange={(v) => set('valider', v)} label="Valider la pesée (inscrite au registre ; ensuite, toute correction demande un motif)" /> : null}
      {valide && !lecture ? <Field label="Motif de la correction (obligatoire si vous changez la pesée)" champ="motif"><TI value={f.motif} onChange={(v) => set('motif', v)} placeholder="ex. erreur de lecture de la bascule" data-motif-correction="" /></Field> : null}
      {cfgEd ? <FormulaireEditor catId="pesee" onClose={() => setCfgEd(false)} /> : null}
    </FormSheet>
  );
}

// pesée ouverte depuis Opérations (saisies d'avant 0.27.0-alpha.2 : « Pesée de vendange » n'y est plus proposée) : même formulaire, puis le ticket de pesée
function PeseeOpForm({ id, onClose }) {
  const [e, setE] = useState({ ferme: false, ticket: null });
  useEffect(() => { if (e.ferme && !e.ticket) onClose(); }, [e]);
  if (e.ticket) return <BonPesee id={e.ticket} onClose={onClose} />;
  if (e.ferme) return null;
  return <PeseeForm id={id} onClose={() => setE((x) => ({ ...x, ferme: true }))} onTicket={(t) => setE({ ferme: true, ticket: t })} />;
}

/* ---------- ticket de pesée (0.27.0-alpha.2 ; « bon de pesée » de 0.27.0-alpha.2 à 0.47.0-alpha.1, nom du cahier des charges depuis) : remis à l'apporteur à chaque livraison de raisins ----------
   Ce qui est livré (cépage, cru et son échelle, parcelle, caisses, poids), les relevés de qualité et le cumul de la campagne de cet
   apporteur. Le bon de pressoir, lui, suit un marc (raisins chargés, moûts obtenus et leurs cuves). */
function peseeCumul(db, o) { // pesées de la même origine (apporteur ou exploitation) dans l'année, jusqu'à celle-ci comprise
  const n0 = num((o.pesee || {}).num);
  const L = peseesDe(db, yearOf(o.date)).filter((x) => (x.apporteurId || '') === (o.apporteurId || '') && (x.id === o.id || (n0 > 0 && num((x.pesee || {}).num) > 0 ? num(x.pesee.num) < n0 : x.date < o.date)));
  const par = (k) => { const m = {}; L.forEach((x) => { const c = k(x); m[c] = (m[c] || 0) + num(x.kg); }); return m; };
  return { n: L.length, kg: sum(L, (x) => x.kg), caisses: sum(L, (x) => num((x.pesee || {}).caisses)), cepages: par((x) => x.cepageId || ''), echelles: par((x) => (x.cruId ? cruEchelle(db, x.cruId) || '' : '')) };
}
const BonSignatures = ({ a, b }) => <div style={{ display: 'flex', gap: 24, marginTop: 28 }}><div style={{ flex: 1, borderTop: '1px solid #999', paddingTop: 4, fontSize: 11 }}>{a}</div><div style={{ flex: 1, borderTop: '1px solid #999', paddingTop: 4, fontSize: 11 }}>{b}</div></div>;
function BonTete({ droite }) {
  const { db } = useApp(); const c = centrePressurage(db);
  return (
    <div className="bon-tete">
      <div className="bon-bloc"><div className="bon-lbl">Centre de pressurage</div>{c.logo ? <img src={c.logo} alt="" style={{ maxHeight: 44, maxWidth: 150, objectFit: 'contain', display: 'block', marginBottom: 4 }} /> : null}<b>{c.nom || '—'}</b>{c.adresse ? <div style={{ whiteSpace: 'pre-line' }}>{c.adresse}</div> : null}{c.ident ? <div className="muted">{c.ident}</div> : null}</div>
      <div className="bon-bloc">{droite}</div>
    </div>
  );
}
function BonPesee({ id, onClose }) {
  const { db } = useApp(); const ref = useRef(null); const o = db.ops.find((x) => x.id === id); const p = (o && o.pesee) || {};
  const out = useReportOutput(ref, `bon-pesee-${o ? yearOf(o.date) : ''}-${p.num || ''}`);
  if (!o) return null;
  const b = p.balanceId ? balancesDe(db).find((x) => x.id === p.balanceId) : null; const ap = (db.apporteurs || []).find((a) => a.id === o.apporteurId);
  // mentions obligatoires toujours imprimées ; les autres suivent le formulaire de pesée (champ masqué et vide : omis)
  const fcfg = formulaireDe(db, 'pesee'); const E = (k) => champEffectif(fcfg, 'pesee', k); const vu = (k, v) => E(k).vis !== 'masque' || (v !== undefined && v !== null && v !== '');
  const L = (k, x) => E(k).libelle || x; const perso = (Array.isArray(o.champs) ? o.champs : []).filter((c) => c && c.journal !== false && champValeurTexte(c));
  const an = yearOf(o.date); const C = peseeCumul(db, o); const voirCaisses = vu('caisses', p.caisses); // caisses masquées et vides : colonne omise
  const cols = [['Cépage', lbl(db, 'cepages', o.cepageId)], vu('cruId', o.cruId) && [L('cruId', 'Cru (village)'), o.cruId ? cruName(db, o.cruId) : '—'], vu('cruId', o.cruId) && [ECH.nom, o.cruId ? cruEchUn(db, o.cruId) : '—'],
    vu('parcelleId', o.parcelleId) && [L('parcelleId', 'Parcelle'), o.parcelleId ? parcelleName(db, o.parcelleId) : '—'], (E('qualifId').vis !== 'masque' || (o.qualifId && o.qualifId !== 'conv')) && [L('qualifId', 'Revendication'), qLabel(o.qualifId)],
    vu('caisses', p.caisses) && [L('caisses', 'Caisses'), p.caisses ? fmt(p.caisses) : '—'], vu('brutTare', p.brutKg) && ['Poids brut', hasNum(p.brutKg) ? kgTxt(p.brutKg) : '—'], vu('brutTare', p.tareKg) && ['Tare', hasNum(p.tareKg) ? kgTxt(p.tareKg) : '—'], ['Poids net', kgTxt(o.kg)]].filter(Boolean);
  const qualite = [vu('etat', p.etat) && [L('etat', 'État sanitaire'), etatLabel(p.etat) || '—'],
    (hasNum(p.pourritureAcide) || (vu('pourritureAcide') && !(etatSain(p) && E('pourritureAcide').siAltere))) && [L('pourritureAcide', 'Pourriture acide'), hasNum(p.pourritureAcide) ? `${fmt(p.pourritureAcide, 1)} %` : '—'],
    vu('tap', p.tap) && [L('tap', 'TAP (titre alcoométrique volumique en puissance)'), hasNum(p.tap) ? `${fmt(p.tap, 1)} % vol.` : '—'], vu('heureCueillette', p.heureCueillette) && [L('heureCueillette', 'Heure de cueillette'), p.heureCueillette || '—'],
    ...perso.map((c) => [c.label, champValeurTexte(c)])].filter(Boolean);
  const infos = [['Revendication particulière (mention, lieu-dit)', p.mention || '—'], vu('balanceId', p.balanceId) && [L('balanceId', 'Balance'), b ? `${b.nom}${b.valideJusquau ? ` — vérification valable jusqu’au ${fmtDate(b.valideJusquau)}` : ''}` : '—'],
    vu('ref', o.ref) && [L('ref', 'N° de bon'), o.ref || '—'], vu('operateurs', (o.operateurs || []).length ? 1 : '') && [L('operateurs', 'Pesée faite par'), operateursNoms(db, o.operateurs) || '—']].filter(Boolean);
  return (
    <Sheet wide title={`Ticket de pesée n° ${p.num || '—'}`} sub="À remettre à l’apporteur" onClose={onClose}
      footer={<><Btn onClick={onClose} className="mr-auto">Fermer</Btn><BoutonsSortie out={out} /></>}>
      <div ref={ref} className="report bon" data-ticket="" data-bon-pesee="">
        <BonTete droite={<><div className="bon-camp">{`Vendanges ${an}`}</div><div className="bon-lbl">{o.apporteurId ? 'Apporteur' : 'Origine des raisins'}</div><b>{ap ? ap.nom : 'Raisins de l’exploitation'}</b>{ap && ap.commune ? <div>{ap.commune}</div> : null}{ap && ap.ident ? <div className="muted">{ap.ident}</div> : null}</>} />
        <h1>{`Ticket de pesée n° ${p.num || '—'}`}</h1>
        <p className="bon-ligne">{`Pesée du ${fmtDate(o.date)} à ${p.heure || '—'}`}</p>
        <table data-bon-livraison=""><thead><tr>{cols.map(([h]) => <th key={h}>{h}</th>)}</tr></thead><tbody><tr>{cols.map(([h, v]) => <td key={h}>{v}</td>)}</tr></tbody></table>
        {qualite.length ? <><h3>Critères de qualité et relevés</h3><table><tbody>{qualite.map(([k, v]) => <tr key={k}><th style={{ width: '42%' }}>{k}</th><td>{v}</td></tr>)}</tbody></table></> : null}
        <table><tbody>{infos.map(([k, v]) => <tr key={k}><th style={{ width: '42%' }}>{k}</th><td>{v}</td></tr>)}</tbody></table>
        <h3>{`Livraison et cumul de la campagne ${an}`}</h3>
        <table data-bon-cumul=""><thead><tr><th /><th>Pesées</th>{voirCaisses ? <th>{L('caisses', 'Caisses')}</th> : null}<th>Poids net</th></tr></thead>
          <tbody><tr><th>Cette livraison</th><td>1</td>{voirCaisses ? <td>{p.caisses ? fmt(p.caisses) : '—'}</td> : null}<td>{kgTxt(o.kg)}</td></tr>
            <tr><th>Cumul de la campagne</th><td>{C.n}</td>{voirCaisses ? <td>{C.caisses ? fmt(C.caisses) : '—'}</td> : null}<td><b>{kgTxt(C.kg)}</b></td></tr></tbody></table>
        <p className="bon-ligne">{`Cépages livrés : ${kgListe(C.cepages, (k) => lbl(db, 'cepages', k))}`}</p>
        {Object.keys(C.echelles).some(Boolean) ? <p className="bon-ligne" data-bon-echelles="">{`${ECH.nom} : ${kgListe(C.echelles, echUn)}`}</p> : null}
        {o.notes ? <><h3>Observations</h3><p style={{ whiteSpace: 'pre-line' }}>{o.notes}</p></> : null}
        <p className="muted" style={{ fontSize: 11, marginTop: 10 }}><span>{p.valide ? `Pesée inscrite au registre des pesées sous le n° ${p.num}, validée le ${fmtDateHeure(p.valide.le)}.` : 'Pesée non encore validée au registre.'}</span>{champenois(db) ? <span>{' Registre tenu selon le cahier des charges de l’AOC Champagne (chapitre II).'}</span> : null}</p>
        <BonSignatures a="Signature de l’apporteur" b="Signature du centre de pressurage" />
      </div>
    </Sheet>
  );
}

/* ---------- bon de pressoir (0.27.0-alpha.2) : un marc — raisins chargés et leur origine, moûts obtenus, cuves et contrôles ---------- */
function BonPressoir({ id, onClose }) {
  const { db } = useApp(); const ref = useRef(null); const o = db.ops.find((x) => x.id === id); const m = (o && o.marc) || {};
  const out = useReportOutput(ref, `bon-pressoir-${o ? yearOf(o.date) : ''}-${m.num || ''}`);
  if (!o) return null;
  const P = pressoirParams(db); const pr = pressoirDe(db, o.equipementId); const totKg = marcKg(o); const v = marcVolumes(db, o); const ctl = marcControles(db, o);
  const ch = (o.charges || []).map((c) => ({ c, a: db.ops.find((x) => x.id === c.apportId) })).filter((x) => x.a);
  const parEch = {}; ch.forEach(({ c, a }) => { const k = a.cruId ? cruEchelle(db, a.cruId) || '' : ''; parEch[k] = (parEch[k] || 0) + num(c.kg); });
  const pc = (x) => (totKg > 0 ? `${fmt((num(x) / totKg) * 100, 1)} %` : '—');
  const pcListe = (mm, lib) => Object.keys(mm).filter((k) => num(mm[k]) > 0).sort((a, b) => num(mm[b]) - num(mm[a])).map((k) => `${lib(k)} = ${pc(mm[k])}`).join(' / ');
  const fr = (o.fractions || []).filter((x) => num(x.volL) > 0); const plafond = P.ratioKg > 0 && P.ratioL > 0 && totKg > 0 ? (totKg * P.ratioL) / P.ratioKg : 0;
  const lotFr = (x) => x.code || (x.lotId ? lotCode(db, null, x.lotId) : '') || '—';
  return (
    <Sheet wide title={`Bon de pressoir — marc n° ${m.num || '—'}`} sub={`Carnet de pressoir ${yearOf(o.date)}`} onClose={onClose}
      footer={<><Btn onClick={onClose} className="mr-auto">Fermer</Btn><BoutonsSortie out={out} /></>}>
      <div ref={ref} className="report bon" data-bon-pressoir="">
        <BonTete droite={<><div className="bon-camp">{`Vendanges ${yearOf(o.date)}`}</div><div className="bon-lbl">Pressée</div><b>{(o.parentSpec || {}).code || '—'}</b>{(o.parentSpec || {}).designation ? <div>{o.parentSpec.designation}</div> : null}</>} />
        <h1>{`Bon de pressoir — marc n° ${m.num || '—'}`}</h1>
        <p className="bon-ligne">{m.heureDebut && m.heureFin ? `Pressurage du ${fmtDate(o.date)}, de ${m.heureDebut} à ${m.heureFin}` : m.heureDebut ? `Pressurage du ${fmtDate(o.date)}, à partir de ${m.heureDebut}` : `Pressurage du ${fmtDate(o.date)}`}</p>
        <table><tbody>
          <tr><th style={{ width: '32%' }}>Pressoir</th><td>{pr ? `${pr.nom}${pr.capaciteKg && capaciteDeLibelle(pr.nom) !== num(pr.capaciteKg) ? ` — ${kgTxt(pr.capaciteKg)}` : ''}` : lbl(db, 'equipements', o.equipementId)}</td></tr>
          {(o.operateurs || []).length ? <tr><th>Pressurage fait par</th><td>{operateursNoms(db, o.operateurs)}</td></tr> : null}
          {m.sousCharge ? <tr><th>Motif du sous-chargement</th><td>{m.sousCharge}</td></tr> : null}
        </tbody></table>
        <h3>Raisins chargés</h3>
        <table data-bon-charges=""><thead><tr><th>Pesée</th><th>Apporteur</th><th>Cru (village)</th><th>{ECH.nom}</th><th>Cépage</th><th>Revendication</th><th>Poids chargé</th></tr></thead>
          <tbody>{ch.map(({ c, a }) => <tr key={c.apportId}><td>{`n° ${(a.pesee || {}).num || '—'}`}</td><td>{a.apporteurId ? apporteurName(db, a.apporteurId) : 'Exploitation'}</td><td>{a.cruId ? cruName(db, a.cruId) : '—'}</td><td>{a.cruId ? cruEchUn(db, a.cruId) : '—'}</td><td>{lbl(db, 'cepages', a.cepageId)}</td><td>{qLabel(a.qualifId)}</td><td>{kgTxt(c.kg)}</td></tr>)}
            <tr><th colSpan={6}>Total chargé</th><td><b>{kgTxt(totKg)}</b></td></tr></tbody></table>
        <p className="bon-ligne">{`Cépages : ${pcListe(marcCepages(db, o), (k) => lbl(db, 'cepages', k))}`}</p>
        {Object.keys(parEch).some(Boolean) ? <p className="bon-ligne" data-bon-echelles="">{`${ECH.nom} : ${pcListe(parEch, echUn)}`}</p> : null}
        <h3>Moûts obtenus</h3>
        {fr.length ? <table data-bon-fractions=""><thead><tr><th>Fraction</th><th>Volume</th><th>Cuve</th><th>Lot</th></tr></thead>
          <tbody>{fr.map((x, i) => <tr key={i}><td>{(fracDef(db, x.fractionId) || { label: x.fractionId }).label}</td><td>{fmtL(x.volL)}</td><td>{x.contenantId ? contName(db, x.contenantId) : '—'}</td><td>{lotFr(x)}</td></tr>)}</tbody></table> : <p className="muted">Volumes à compléter à la fin du pressurage.</p>}
        <table data-bon-rendement=""><tbody>
          {v.total > 0 ? <tr><th style={{ width: '32%' }}>Revendicable (cuvée + taille)</th><td>{fmtL(v.aoc)}</td></tr> : null}
          {v.total > 0 && plafond ? <tr><th>Plafond du marc</th><td>{fmtL(plafond)}</td></tr> : null}
          {v.total > 0 ? <tr><th>Rebêches</th><td>{fmtL(v.rebeche)}</td></tr> : null}
          {v.total > 0 && totKg > 0 ? <tr><th>Rendement</th><td>{`${fmt((v.total / totKg) * (P.ratioKg || 100), 1)} L / ${P.ratioKg || 100} kg`}</td></tr> : null}
          <tr><th style={{ width: '32%' }}>TAP (titre alcoométrique volumique en puissance)</th><td>{hasNum(m.tavp) ? `${fmt(m.tavp, 1)} % vol.` : '—'}</td></tr>
          <tr><th>Bourbes</th><td>{hasNum(m.bourbesL) ? fmtL(m.bourbesL) : '—'}</td></tr>
        </tbody></table>
        <h3>Contrôles</h3>
        {ctl.length ? <ul style={{ paddingLeft: 18, listStyle: 'disc', fontSize: 12 }}>{ctl.map((c, i) => <li key={i}>{c.msg}</li>)}</ul> : <p className="bon-ligne">Conforme.</p>}
        {o.notes ? <><h3>Observations</h3><p style={{ whiteSpace: 'pre-line' }}>{o.notes}</p></> : null}
        <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>{m.valide ? `Marc inscrit au carnet de pressoir sous le n° ${m.num}, validé le ${fmtDateHeure(m.valide.le)}.` : 'Marc non encore validé au carnet de pressoir.'}</p>
        <BonSignatures a="Signature du responsable du pressurage" b="Signature de l’apporteur (pressurage à façon)" />
      </div>
    </Sheet>
  );
}

/* 0.48.0-alpha.1 : état vide de première utilisation (aucune pesée ou aucun marc dans l'année) — une phrase, l'action principale,
   les pressoirs et balances à déclarer d'abord s'il n'y en a aucun */
function PressoirVide({ titre, texte, action, onAction, data }) {
  const { db, setTab } = useApp(); const sansEquip = !pressoirsDe(db).length;
  return (
    <div className="vide-accueil card" data-pressoir-vide={data}>
      <div className="vide-ic" aria-hidden="true">🍇</div>
      <h3 className="disp text-xl">{titre}</h3>
      <p className="text-sm text-ink2">{texte}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {onAction ? <Btn kind="primary" onClick={onAction}>{action}</Btn> : null}
        {sansEquip ? <Btn onClick={() => setTab('pressoir', 'reglages')} data-vide-reglages="">⚙ Déclarer pressoirs et balances</Btn> : null}
      </div>
    </div>
  );
}

/* ---------- registre des pesées ---------- */
function PeseesView({ annee }) {
  const { db, act, camp, uid } = useApp(); const droits = usePressoirDroits();
  const [form, setForm] = useState(null); const [ticket, setTicket] = useState(null); const [annul, setAnnul] = useState(null); const [q, setQ] = useState(''); const [jour, setJour] = useState(''); const [marc, setMarc] = useState(null);
  const L = peseesDe(db, annee).slice().reverse(); const auj = todayISO();
  const rows = L.filter((o) => (!jour || o.date === jour) && (!q || norm(`${apporteurName(db, o.apporteurId)} ${peseeOrigine(db, o)} ${cruEchUn(db, o.cruId)} ${lbl(db, 'cepages', o.cepageId)} ${(o.pesee || {}).num || ''}`).includes(norm(q))));
  const reste = (o) => peseeReste(db, o.id); const duJour = L.filter((o) => o.date === auj);
  const aValider = L.filter((o) => !(o.pesee && o.pesee.valide)).length; const P = pressoirParams(db);
  const valider = (o) => act((d) => peseeValider(d, o.id, { par: uid, maintenant: pMaintenant() }), `Pesée n° ${(o.pesee || {}).num || ''} validée.`);
  const annuler = (motif) => { const o = annul; setAnnul(null); if (motif) act((d) => registreAnnuler(d, o.id, { motif, par: uid, maintenant: pMaintenant() }), 'Pesée annulée : gardée au journal du pressoir.'); };
  const jours = uniq(L.map((o) => o.date));
  const fcfg = formulaireDe(db, 'pesee'); const colVue = (k) => champEffectif(fcfg, 'pesee', k).vis !== 'masque' || L.some((o) => hasNum((o.pesee || {})[k]));
  const colsReleves = [colVue('tap') && { h: 'TAP', cls: 'r hm', r: (o) => { const x = (o.pesee || {}).tap; const al = peseeAlertes(db, o); return hasNum(x) ? <span className={cx('num whitespace-nowrap', al.length && 'text-warn')} title={al[0] || ''} data-tap-pesee="">{fmt(x, 1)} %</span> : <span className="text-ink2">—</span>; } },
    colVue('pourritureAcide') && { h: 'Pourr. acide', cls: 'r hm', r: (o) => { const x = (o.pesee || {}).pourritureAcide; return hasNum(x) ? <span className={cx('num whitespace-nowrap', num(x) > 0 && 'text-warn')}>{fmt(x, 1)} %</span> : <span className="text-ink2">—</span>; } }].filter(Boolean);
  return (
    <div>
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label="Pesées" value={L.length} sub={`${fmt(sum(L, (o) => o.kg))} kg de raisin`} />
        <Kpi label="Aujourd’hui" value={duJour.length} sub={duJour.length ? `${fmt(sum(duJour, (o) => o.kg))} kg` : 'aucune pesée'} />
        <Kpi label="Reste à presser" value={kgTxt(sum(L, reste))} sub={`${L.filter((o) => reste(o) > 0.5).length} pesée(s)`} tone={sum(L, reste) > 0.5 ? 'warn' : undefined} />
        {P.registre ? <Kpi label="À valider" value={aValider} tone={aValider ? 'warn' : 'ok'} sub={aValider ? 'pesées non validées' : 'registre à jour'} /> : null}
      </div>
      <Sec title={`Registre des pesées ${annee}`} right={<><input className="inp" style={{ width: 200 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher une pesée" />
        <SI value={jour} onChange={setJour} placeholder="Tous les jours" style={{ width: 'auto' }} options={jours.map((j) => ({ value: j, label: fmtDate(j) }))} aria-label="Jour" />
        {droits.ecrit ? <Btn kind="primary" disabled={camp.figee} onClick={() => setForm({})} data-nouvelle-pesee="">＋ Nouvelle pesée</Btn> : null}</>}>
        {!L.length ? <PressoirVide data="pesees" titre={`Aucune pesée en ${annee}`} texte="Enregistrez une pesée à l’arrivée de chaque chargement de raisins : elle alimente le registre des pesées, le ticket de pesée et le carnet de pressoir." action="＋ Enregistrer la première pesée" onAction={droits.ecrit && !camp.figee ? () => setForm({}) : null} /> : null}
        {L.length ? <Tbl rows={rows} empty="Aucune pesée pour ces critères." cols={[
          { h: 'N°', r: (o) => <b className="num" data-num-pesee="">{(o.pesee || {}).num || '—'}</b> },
          { h: 'Date', r: (o) => <span className="num whitespace-nowrap">{fmtDate(o.date)} {(o.pesee || {}).heure || ''}</span> },
          { h: 'Apporteur', r: (o) => (o.apporteurId ? apporteurName(db, o.apporteurId) : <span className="text-ink2">exploitation</span>) },
          { h: 'Origine', cls: 'hm', r: (o) => { const reste0 = [o.parcelleId ? parcelleName(db, o.parcelleId) : '', (o.pesee || {}).mention || ''].filter(Boolean).join(' · '); return <span className="text-sm">{o.cruId ? <span className="inline-flex flex-wrap items-center gap-1">{cruName(db, o.cruId)}<EchelleCru cruId={o.cruId} /></span> : null}{reste0 ? <span className="block">{reste0}</span> : null}{!o.cruId && !reste0 ? '—' : null}</span>; } },
          { h: 'Cépage', r: (o) => lbl(db, 'cepages', o.cepageId) }, { h: 'Revendication', cls: 'hm', r: (o) => <QChip id={o.qualifId} /> },
          { h: 'Poids net', cls: 'r', r: (o) => <span className="num whitespace-nowrap" title={hasNum((o.pesee || {}).brutKg) ? `brut ${kgTxt(o.pesee.brutKg)} − tare ${kgTxt(o.pesee.tareKg)}` : ''}>{kgTxt(o.kg)}</span> },
          ...colsReleves,
          { h: 'Reste', cls: 'r', r: (o) => { const x = reste(o); return <span className={cx('num whitespace-nowrap', x > 0.5 ? 'text-warn' : 'text-ink2')}>{x > 0.5 ? kgTxt(x) : 'pressée'}</span>; } },
          { h: 'Statut', r: (o) => statutChip(o.pesee, 'pesee') },
          { h: '', r: (o) => <div className="flex flex-wrap gap-1">{droits.ecrit && !camp.figee && reste(o) > 0.5 && !isLocked(db, o.date) ? <Btn size="sm" kind="primary" onClick={() => setMarc({ date: o.date, charges: [{ apportId: o.id, kg: reste(o) }] })} title="Charger un marc avec le reste de cette pesée (pressurage)" data-presser={(o.pesee || {}).num || ''}>Presser</Btn> : null}<Btn size="sm" onClick={() => setTicket(o.id)} title="Ticket de pesée à remettre à l’apporteur" data-bon-pesee-btn="">Ticket de pesée</Btn><Btn size="sm" onClick={() => setForm({ id: o.id })}>{droits.ecrit && !isLocked(db, o.date) ? 'Modifier' : 'Voir'}</Btn>
            {droits.ecrit && !(o.pesee && o.pesee.valide) && !isLocked(db, o.date) ? <Btn size="sm" kind="primary" onClick={() => valider(o)}>Valider</Btn> : null}
            {droits.annuler && !isLocked(db, o.date) && reste(o) >= num(o.kg) - 0.5 ? <Btn size="sm" kind="danger" onClick={() => setAnnul(o)}>Annuler</Btn> : null}</div> }]} /> : null}
        <p className="help mt-2">Chaque pesée reçoit un n° continu dans l’année ; une pesée annulée garde son n° (journal). « Presser » charge un marc avec le reste de la pesée ; les pesées sont aussi proposées dans chaque pressurage (onglet Pressurages).</p>
      </Sec>
      {form ? <PeseeForm id={form.id} onClose={() => setForm(null)} onTicket={(id) => setTicket(id)} /> : null}
      {ticket ? <BonPesee id={ticket} onClose={() => setTicket(null)} /> : null}
      {marc ? <MarcForm preset={marc} onClose={() => setMarc(null)} /> : null}
      {annul ? <MotifSheet title={`Annuler la pesée n° ${(annul.pesee || {}).num || ''} ?`} body="La pesée est retirée du registre ; son n° n’est jamais réattribué et une copie est gardée au journal du pressoir." ok="Annuler la pesée" danger onClose={annuler} /> : null}
    </div>
  );
}

/* ---------- marc : chargement, volumes, validation ---------- */
function MarcForm({ id, onClose, preset }) {
  const { db, act, defaultDate, moi, uid, toast, openSchema } = useApp(); const o = id ? db.ops.find((x) => x.id === id) : null; const m0 = (o && o.marc) || {};
  const droits = usePressoirDroits(); const P = pressoirParams(db); const PR = pressoirsDe(db);
  const valide = !!m0.valide; const lecture = !droits.ecrit || (valide && !droits.corriger) || (o && isLocked(db, o.date));
  const fracs = fracPress(db, ((o && o.fractions) || []).map((x) => x.fractionId));
  const frac0 = {}; fracs.forEach((fr) => { const x = ((o && o.fractions) || []).find((y) => y.fractionId === fr.id); frac0[fr.id] = { volL: x ? String(x.volL) : '', contenantId: x ? x.contenantId : '', code: x ? x.code : '' }; });
  const persoM = formulaireDe(db, 'pressurage').perso; // champs personnalisés du formulaire « Pressurage » (Paramètres › Opérations)
  const [f, set, setF] = useDraft(o ? { date: o.date, heureDebut: m0.heureDebut || '', heureFin: m0.heureFin || '', equipementId: o.equipementId || '', charges: (o.charges || []).map((c) => ({ apportId: c.apportId, kg: String(c.kg) })), code: (o.parentSpec || {}).code || '', designation: (o.parentSpec || {}).designation || '', millesime: (o.parentSpec || {}).millesime || '', qualifId: (o.parentSpec || {}).qualifId || '', frac: frac0, tavp: hasNum(m0.tavp) ? String(m0.tavp) : '', bourbesL: hasNum(m0.bourbesL) ? String(m0.bourbesL) : '', sousCharge: m0.sousCharge || '', notes: o.notes || '', operateurs: o.operateurs || [], couleur: o.couleur || '', champs: champsEtat(o), motif: '', valider: false }
    : (() => { const P0 = preset || {}; const d0 = isoOK(P0.date) ? P0.date : defaultDate; const fr0 = { ...frac0 }; Object.keys(P0.frac || {}).forEach((k) => { if (fr0[k] && P0.frac[k] && P0.frac[k].contenantId) fr0[k] = { ...fr0[k], contenantId: P0.frac[k].contenantId }; });
      const ch0 = (Array.isArray(P0.charges) ? P0.charges : []).filter((c) => c && c.apportId && num(c.kg) > 0).map((c) => ({ apportId: c.apportId, kg: String(r2(num(c.kg))) })); const a0 = ch0.length ? db.ops.find((y) => y.id === ch0[0].apportId) : null;
      const s0 = { date: d0, heureDebut: heureNow(), heureFin: '', equipementId: (PR.find((x) => x.id === P0.equipementId) || PR[0] || {}).id || '', charges: ch0, code: codeMarcSuivant(db, d0), designation: a0 ? `${lbl(db, 'cepages', a0.cepageId)} ${yearOf(d0)} – marc` : '', millesime: '', qualifId: '', frac: fr0, tavp: '', bourbesL: '', sousCharge: '', notes: '', operateurs: moi ? [moi] : [], couleur: couleurDefaut(db), champs: {}, motif: '', valider: false };
      persoM.forEach((d) => { if (d.defaut != null && d.defaut !== '' && d.type !== 'calcul') s0.champs[d.id] = d.defaut; }); return s0; })());
  const pr = PR.find((x) => x.id === f.equipementId);
  const dispo = db.ops.filter((x) => x.type === 'apport' && x.date <= f.date && yearOf(x.date) === yearOf(f.date) && (peseeReste(db, x.id, id) > 0.5 || f.charges.some((c) => c.apportId === x.id))).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : num((b.pesee || {}).num) - num((a.pesee || {}).num)));
  const setCh = (charges) => setF((x) => { const first = db.ops.find((y) => y.id === (charges[0] || {}).apportId); return { ...x, charges, designation: x.designation || (first ? `${lbl(db, 'cepages', first.cepageId)} ${yearOf(x.date)} – marc` : '') }; });
  const totKg = sum(f.charges, (c) => c.kg);
  // chargement : pesées du jour non pressées, jusqu'à la capacité du pressoir
  const remplir = () => { const cap = (pr && pr.capaciteKg) || 0; let reste = cap > 0 ? cap - totKg : Infinity; const add = [];
    dispo.filter((x) => x.date === f.date && !f.charges.some((c) => c.apportId === x.id)).reverse().forEach((x) => { if (reste <= 0.5) return; const r = peseeReste(db, x.id, id); const k = Math.min(r, reste); if (k > 0.5) { add.push({ apportId: x.id, kg: String(r2(k)) }); reste -= k; } });
    if (!add.length) toast('Aucune pesée du jour à charger.', 'bad'); else setCh([...f.charges, ...add]); };
  // aperçu des contrôles (sans enregistrer)
  const tapCharges = tapPesees(db, (f.charges || []).filter((c) => c.apportId && num(c.kg) > 0));
  const apercu = useMemo(() => { const r = marcSpec(db, f, o); if (!r.ok) return { err: r.msg, ctl: [] }; const op = { ...r.spec, id: id || '_nouveau', marc: { ...(o && o.marc), ...r.spec.marc, saisiLe: m0.saisiLe || pMaintenant() } };
    const d = { ...db, ops: id ? db.ops.map((x) => (x.id === id ? op : x)) : [...db.ops, op] }; return { err: '', ctl: marcControles(d, op), vol: marcVolumes(d, op), spec: op }; }, [f, db]);
  const save = (val) => {
    let opId = null; const r = act((d) => { const s = marcSave(d, f, id || null, { motif: f.motif, par: uid, maintenant: pMaintenant() }); if (s.ok) opId = s.op.id; if (!s.ok || !val) return s; return marcValider(d, s.op.id, { par: uid, maintenant: pMaintenant() }); },
      val ? 'Marc validé au carnet de pressoir.' : id ? 'Marc enregistré.' : 'Marc chargé : complétez les volumes à la fin du pressurage.');
    if (r && r.ok) { onClose(); if (val && !valide && opId && openSchema && schemasReglage(db).proposer) openSchema({ opId, auto: true }); } // marc validé : schéma de vinification proposé aux lots créés (0.31.0-alpha.1)
  };
  const plafond = P.ratioKg > 0 && P.ratioL > 0 && totKg > 0 ? (totKg * P.ratioL) / P.ratioKg : 0;
  const bloquants = apercu.ctl.filter((c) => c.niveau === 'bloquant'); const alertes = apercu.ctl.filter((c) => c.niveau === 'alerte');
  const fr = (fid, patch) => setF((x) => ({ ...x, frac: { ...x.frac, [fid]: { ...x.frac[fid], ...patch } } }));
  return (
    <FormSheet readOnly={lecture} wide title={o ? `Marc n° ${m0.num || '—'}${o.parentSpec ? ` — ${o.parentSpec.code}` : ''}` : 'Charger un marc'} sub={`Carnet de pressoir ${yearOf(f.date)}${o ? '' : ` : marc n° ${numeroSuivant(db, 'marc', yearOf(f.date))}`}`} onClose={onClose}
      onSave={() => save(false)} saveLabel={o ? 'Enregistrer' : 'Charger le marc'}
      secondary={!lecture && !valide ? <Btn kind="primary" onClick={() => save(true)} disabled={!!apercu.err || bloquants.length > 0} title={bloquants.length ? bloquants.map((c) => c.msg).join(' ') : 'Enregistrer et valider le marc'} data-valider-marc="">Enregistrer et valider</Btn> : null}>
      {valide ? <Notice tone="info" title={`Marc validé le ${fmtDateHeure(m0.valide.le)}`}>Une correction reste possible : elle est gardée au journal du pressoir avec son motif.</Notice> : !o ? <Notice tone="info">Le carnet se remplit au fur et à mesure : enregistrez le marc dès le chargement (heure du début, pesées chargées), puis complétez les volumes, le TAV en puissance et les bourbes.</Notice> : null}
      <G n={3}><Field label="Date"><DI value={f.date} onChange={(v) => set('date', v)} /></Field>
        <Field label="Heure du début"><input className="inp num" type="time" value={f.heureDebut} onChange={(e) => set('heureDebut', e.target.value)} aria-label="Heure du début du pressurage" data-heure-debut="" /></Field>
        <Field label="Heure de fin (facultatif)"><input className="inp num" type="time" value={f.heureFin} onChange={(e) => set('heureFin', e.target.value)} aria-label="Heure de fin du pressurage" /></Field></G>
      <G><Field label="Pressoir">{PR.length ? <SI value={f.equipementId} onChange={(v) => set('equipementId', v)} options={PR.map((x) => ({ value: x.id, label: `${x.nom}${x.capaciteKg ? ` — ${fmt(x.capaciteKg)} kg` : ''}` }))} /> : <div className="help pt-2">Ajoutez un pressoir dans Pressoir › Réglages (ou Paramètres › Listes › Équipements).</div>}</Field>
        <Field label="Code du lot (pressée)" help="Les fractions prennent ce code suivi de leur suffixe (C, T1, R…)."><TI value={f.code} onChange={(v) => set('code', v)} /></Field></G>
      <Group label={`Pesées chargées${totKg ? ` : ${kgTxt(totKg)}${pr && pr.capaciteKg ? ` pour ${kgTxt(pr.capaciteKg)} agréés` : ''}` : ''}`}>
        <div className="space-y-2" data-charges="">{f.charges.map((c, i) => (
          <div key={i} className="grid items-end gap-2" style={{ gridTemplateColumns: 'minmax(0,3fr) minmax(90px,1fr) auto' }}>
            <SI value={c.apportId} onChange={(v) => setCh(f.charges.map((x, k) => (k === i ? { apportId: v, kg: v ? String(r2(peseeReste(db, v, id))) : '' } : x)))} placeholder="Choisir une pesée…" options={dispo.filter((x) => x.id === c.apportId || !f.charges.some((y) => y.apportId === x.id)).map((x) => ({ value: x.id, label: peseeLibelle(db, x, r2(peseeReste(db, x.id, id))) }))} aria-label={`Pesée ${i + 1}`} />
            <NI value={c.kg} onChange={(v) => setCh(f.charges.map((x, k) => (k === i ? { ...x, kg: v } : x)))} placeholder="kg" aria-label={`Poids chargé ${i + 1}`} />
            <Btn kind="danger" size="sm" aria-label="Retirer" onClick={() => setCh(f.charges.filter((_, k) => k !== i))}>✕</Btn>
          </div>))}
          <div className="flex flex-wrap gap-2"><Btn size="sm" onClick={() => setCh([...f.charges, { apportId: '', kg: '' }])}>＋ Ajouter une pesée</Btn><Btn size="sm" kind="ghost" onClick={remplir} data-remplir="">Charger les pesées du jour</Btn>
            {!dispo.length ? <span className="help">Aucune pesée à presser à cette date : enregistrez d’abord les pesées (onglet Pesées).</span> : null}</div>
        </div>
      </Group>
      {pr && pr.capaciteKg && totKg > 0 && totKg < pr.capaciteKg * 0.98 && P.chargementPlein ? <Field label="Motif du sous-chargement (exceptionnel)"><TI value={f.sousCharge} onChange={(v) => set('sousCharge', v)} placeholder="ex. fin de cueillette, cépage seul…" /></Field> : null}
      <Group label="Moûts obtenus" help={plafond ? `Plafond revendicable (cuvée + taille) : ${fmtL(plafond)} — ${P.ratioL} L de ${P.volume} pour ${P.ratioKg} kg. Au-delà : rebêches.` : 'Renseignez le volume et la cuve de chaque fraction à la fin du pressurage.'}>
        <div className="space-y-2" data-fractions="">{fracs.map((x) => (
          <div key={x.id} className="grid items-end gap-2" style={{ gridTemplateColumns: 'minmax(80px,.8fr) minmax(0,1fr) minmax(0,1.6fr) minmax(0,1fr)' }}>
            <div className="pb-2 text-sm font-semibold">{x.label}</div>
            <VI value={f.frac[x.id] ? f.frac[x.id].volL : ''} onChange={(v) => fr(x.id, { volL: v })} placeholder="hL" aria-label={`Volume ${x.label}`} />
            <SI value={f.frac[x.id] ? f.frac[x.id].contenantId : ''} onChange={(v) => fr(x.id, { contenantId: v })} placeholder="Cuve…" options={contOptions(db)} aria-label={`Cuve ${x.label}`} />
            <TI value={f.frac[x.id] ? f.frac[x.id].code : ''} onChange={(v) => fr(x.id, { code: v })} placeholder={`${f.code || 'code'}-${x.suffix}`} aria-label={`Code ${x.label}`} />
          </div>))}</div>
      </Group>
      {apercu.vol && apercu.vol.total > 0 ? <div className="flex flex-wrap gap-2 text-sm" data-volumes=""><Chip>cuvée {fmtL(apercu.vol.cuvee)}</Chip><Chip>tailles {fmtL(apercu.vol.taille)}</Chip><Chip>rebêches {fmtL(apercu.vol.rebeche)}</Chip><Chip tone={plafond && apercu.vol.aoc > plafond + 0.5 ? 'bad' : 'ok'}>revendicable {fmtL(apercu.vol.aoc)}{plafond ? ` / ${fmtL(plafond)}` : ''}</Chip>{totKg > 0 ? <Chip>{fmt((apercu.vol.total / totKg) * (P.ratioKg || 100), 1)} L / {P.ratioKg || 100} kg</Chip> : null}</div> : null}
      <G n={3}><Field label="TAP, titre alcoométrique volumique en puissance (% vol.)" help={[P.registre ? 'Obligatoire au carnet.' : '', tapCharges ? `TAP moyen des pesées chargées : ${fmt(tapCharges.tap, 1)} % vol.` : ''].filter(Boolean).join(' ')}><NI value={f.tavp} onChange={(v) => set('tavp', v)} placeholder="ex. 10,2" aria-label="TAV en puissance" data-tavp="" /></Field>
        <Field label="Bourbes (hL, en fin de débourbage)" help={P.bourbesMax ? `Attendu : ${fmt(P.bourbesMin)} à ${fmt(P.bourbesMax)} % des moûts.` : ''}><VI value={f.bourbesL} onChange={(v) => set('bourbesL', v)} placeholder="hL" aria-label="Bourbes" /></Field>
        <Field label="Désignation"><TI value={f.designation} onChange={(v) => set('designation', v)} /></Field></G>
      <G><Field label="Couleur des moûts" help="Blanc, y compris pour les raisins noirs pressés directement (blanc de noirs) ; rosé pour une saignée ou une macération."><SI plain value={f.couleur || couleurDefaut(db)} onChange={(v) => set('couleur', v)} options={couleurOptions(db, f.couleur)} aria-label="Couleur des moûts" data-couleur-marc="" /></Field><div /></G>
      <ChampsPerso defs={persoM} tous={persoM} f={f} upd={(patch) => setF((x) => ({ ...x, ...patch }))} type="pressurage" />
      <OperateursPicker value={f.operateurs} onChange={(v) => set('operateurs', v)} label="Pressurage fait par" />
      <Field label="Notes"><TA value={f.notes} onChange={(v) => set('notes', v)} rows={2} /></Field>
      {o ? <DocsPanel cible={{ type: 'op', id: o.id }} kind="op" locked={isLocked(db, o.date)} /> : null}
      {apercu.err && f.charges.length ? <Notice tone="warn">{apercu.err}</Notice> : null}
      {bloquants.map((c, i) => <Notice key={`b${i}`} tone="bad">{c.msg}</Notice>)}
      {alertes.map((c, i) => <Notice key={`a${i}`} tone="warn">{c.msg}</Notice>)}
      {apercu.spec && !lecture && moduleActif(db, 'hygiene') ? <HygControlesNotices spec={apercu.spec} editId={id || null} /> : null}
      {valide && !lecture ? <Field label="Motif de la correction (obligatoire si vous changez le marc)"><TI value={f.motif} onChange={(v) => set('motif', v)} data-motif-correction="" /></Field> : null}
    </FormSheet>
  );
}

/* ---------- carnet de pressoir ---------- */
function MarcsView({ annee }) {
  const { db, act, camp, uid, showLot, openSchema } = useApp(); const droits = usePressoirDroits();
  const [form, setForm] = useState(null); const [annul, setAnnul] = useState(null); const [imp, setImp] = useState(false); const [bon, setBon] = useState(null);
  const L = marcsDe(db, annee).slice().reverse(); const P = pressoirParams(db);
  // marc validé depuis le carnet : schéma de vinification proposé aux lots créés (0.31.0-alpha.1)
  const valider = (o) => { const r = act((d) => marcValider(d, o.id, { par: uid, maintenant: pMaintenant() }), `Marc n° ${(o.marc || {}).num || ''} validé.`); if (r && r.ok && openSchema && schemasReglage(db).proposer) openSchema({ opId: o.id, auto: true }); };
  const annuler = (motif) => { const o = annul; setAnnul(null); if (motif) act((d) => registreAnnuler(d, o.id, { motif, par: uid, maintenant: pMaintenant() }), 'Marc annulé : gardé au journal du pressoir.'); };
  const ce = (o) => { const m = marcCepages(db, o); return Object.keys(m).map((k) => `${lbl(db, 'cepages', k)} ${fmt(m[k])} kg`).join(' · '); };
  const enCours = L.filter((o) => o.marc && o.marc.enCours).length; const aValider = L.filter((o) => !(o.marc && o.marc.valide)).length;
  return (
    <div>
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label="Marcs" value={L.length} sub={`${fmt(sum(L, marcKg))} kg pressés`} /><Kpi label="Moûts" value={fmtL(sum(L, (o) => marcVolumes(db, o).total))} sub={`dont rebêches ${fmtL(sum(L, (o) => marcVolumes(db, o).rebeche))}`} />
        <Kpi label="En cours" value={enCours} tone={enCours ? 'warn' : undefined} sub="volumes à compléter" /><Kpi label="À valider" value={aValider} tone={aValider ? 'warn' : 'ok'} sub={aValider ? 'marcs non validés' : 'carnet à jour'} />
      </div>
      <Sec title={`Carnet de pressoir ${annee}`} right={<><Btn onClick={() => setImp(true)} disabled={!L.length}>🖨 Imprimer le carnet</Btn>{droits.ecrit ? <Btn kind="primary" disabled={camp.figee} onClick={() => setForm({})} data-nouveau-marc="" title="Charger un marc : pesées pressées, cuves des moûts">＋ Nouveau pressurage</Btn> : null}</>}>
        {!L.length ? <PressoirVide data="marcs" titre={`Aucun pressurage en ${annee}`} texte="Chargez un marc au début de chaque pressurage (ou « Presser » sur une pesée) : il est numéroté au carnet de pressoir et crée les lots de moûts dans leurs cuves." action="＋ Nouveau pressurage" onAction={droits.ecrit && !camp.figee ? () => setForm({}) : null} /> : null}
        {L.length ? <Tbl rows={L} empty="Aucun marc cette année." cols={[
          { h: 'N°', r: (o) => <b className="num" data-num-marc="">{(o.marc || {}).num || '—'}</b> },
          { h: 'Date', r: (o) => <span className="num whitespace-nowrap">{fmtDate(o.date)} {(o.marc || {}).heureDebut || ''}{(o.marc || {}).heureFin ? `–${o.marc.heureFin}` : ''}</span> },
          { h: 'Pressoir', cls: 'hm', r: (o) => lbl(db, 'equipements', o.equipementId) },
          { h: 'Raisins', r: (o) => <span className="text-sm"><b className="num">{kgTxt(marcKg(o))}</b><span className="block text-xs text-ink2">{ce(o)}</span></span> },
          { h: 'Moûts', r: (o) => { const v = marcVolumes(db, o); return v.total ? <span className="text-sm num">cuvée {fmtL(v.cuvee)}{v.taille ? ` · tailles ${fmtL(v.taille)}` : ''}{v.rebeche ? ` · rebêches ${fmtL(v.rebeche)}` : ''}</span> : <span className="text-xs text-ink2">à compléter</span>; } },
          { h: 'TAV puiss.', cls: 'r hm', r: (o) => (hasNum((o.marc || {}).tavp) ? <span className="num">{fmt(o.marc.tavp, 1)} %</span> : '—') },
          { h: 'Lot', cls: 'hm', r: (o) => (o.parentLotId ? <button type="button" className="linkish" onClick={() => showLot(o.parentLotId)}>{(o.parentSpec || {}).code}</button> : '—') },
          { h: 'Contrôles', r: (o) => { const c = marcControles(db, o); const b = c.filter((x) => x.niveau === 'bloquant').length; const a = c.filter((x) => x.niveau === 'alerte').length; return (o.marc && o.marc.valide && !b && !a) ? <Chip tone="ok">conforme</Chip> : <span className="flex flex-wrap gap-1" title={c.map((x) => x.msg).join('\n')}>{b ? <Chip tone="bad">{b} bloquant{b > 1 ? 's' : ''}</Chip> : null}{a ? <Chip tone="warn">{a} alerte{a > 1 ? 's' : ''}</Chip> : null}{!b && !a ? <Chip tone="ok">conforme</Chip> : null}</span>; } },
          { h: 'Statut', r: (o) => statutChip(o.marc, 'marc') },
          { h: '', r: (o) => <div className="flex flex-wrap gap-1"><Btn size="sm" onClick={() => setBon(o.id)} title="Bon de pressoir de ce marc (à imprimer)" data-bon-pressoir-btn="">Bon de pressoir</Btn><Btn size="sm" onClick={() => setForm({ id: o.id })}>{droits.ecrit && !isLocked(db, o.date) ? (o.marc && o.marc.enCours ? 'Compléter' : 'Modifier') : 'Voir'}</Btn>
            {droits.ecrit && o.marc && !o.marc.valide && !o.marc.enCours && !isLocked(db, o.date) ? <Btn size="sm" kind="primary" onClick={() => valider(o)}>Valider</Btn> : null}
            {droits.annuler && !isLocked(db, o.date) && !dependentsOf(db, o).length ? <Btn size="sm" kind="danger" onClick={() => setAnnul(o)}>Annuler</Btn> : null}</div> }]} /> : null}
        <p className="help mt-2">{P.ratioKg ? `Plafond : ${P.ratioL} L de ${P.volume} pour ${P.ratioKg} kg (bloquant)${P.cadenceMax ? ` ; ${P.cadenceMax} marcs au plus par 24 h et par pressoir` : ''}${P.marcKg && P.cuveeL ? ` ; usage : ${fmtL(P.cuveeL)} de cuvée et ${fmtL(P.tailleL)} de taille pour ${fmt(P.marcKg)} kg (alerte)` : ''}.` : 'Profil sans plafond : aucun contrôle réglementaire de rendement au pressurage.'} Un marc validé crée ses lots dans les cuves (onglet Cuverie) ; il apparaît aussi dans l’onglet Opérations (pressurage).</p>
      </Sec>
      {form ? <MarcForm id={form.id} onClose={() => setForm(null)} /> : null}
      {annul ? <MotifSheet title={`Annuler le marc n° ${(annul.marc || {}).num || ''} ?`} body="Le marc est retiré du carnet (ses lots aussi, s’ils n’ont pas servi depuis) ; son n° n’est jamais réattribué et une copie est gardée au journal." ok="Annuler le marc" danger onClose={annuler} /> : null}
      {imp ? <CarnetImpression annee={annee} onClose={() => setImp(false)} /> : null}
      {bon ? <BonPressoir id={bon} onClose={() => setBon(null)} /> : null}
    </div>
  );
}
function CarnetImpression({ annee, onClose }) {
  const { db } = useApp(); const ref = useRef(null); const out = useReportOutput(ref, `carnet-pressoir-${annee}`);
  const L = marcsDe(db, annee); const fr = fracPress(db).filter((x) => fracRole(db, x.id) !== 'autre');
  const rows = L.map((o) => { const m = o.marc || {}; const ce = marcCepages(db, o); const orig = uniq((o.charges || []).map((c) => db.ops.find((x) => x.id === c.apportId)).filter(Boolean).map((a) => [a.apporteurId ? apporteurName(db, a.apporteurId) : '', a.cruId ? `${cruName(db, a.cruId)} (${cruEchUn(db, a.cruId)})` : '', (a.pesee || {}).mention || ''].filter(Boolean).join(' · '))).join(' | ');
    return [m.num || '', fmtDate(o.date), `${m.heureDebut || ''}${m.heureFin ? `–${m.heureFin}` : ''}`, lbl(db, 'equipements', o.equipementId), Object.keys(ce).map((k) => `${lbl(db, 'cepages', k)} ${fmt(ce[k])}`).join(', '), orig, ...fr.map((x) => fmtHL(sum((o.fractions || []).filter((y) => y.fractionId === x.id), (y) => y.volL))), hasNum(m.tavp) ? fmt(m.tavp, 1) : '', hasNum(m.bourbesL) ? fmtHL(m.bourbesL) : '', m.valide ? 'validé' : 'à valider']; });
  return (
    <Sheet wide title={`Carnet de pressoir ${annee}`} onClose={onClose} footer={<><Btn onClick={onClose} className="mr-auto">Fermer</Btn><BoutonsSortie out={out} /></>}>
      <div ref={ref} className="report"><ReportHead title={`Carnet de pressoir — vendanges ${annee}`} sub={`${L.length} marc(s)`} />
        <RTable head={['N°', 'Date', 'Heures', 'Pressoir', 'Poids par cépage (kg)', 'Apporteurs · origine', ...fr.map((x) => `${x.label} (hL)`), 'TAV puiss.', 'Bourbes (hL)', 'Statut']} rows={rows} empty="Aucun marc." /></div>
    </Sheet>
  );
}

/* ---------- relevés par apporteur ---------- */
function RelevesView({ annee }) {
  const { db } = useApp(); const [imp, setImp] = useState(false);
  const L = releveApporteurs(db, annee).sort((a, b) => String(apporteurName(db, a.apporteurId)).localeCompare(String(apporteurName(db, b.apporteurId)), 'fr'));
  return (
    <div>
      <Notice tone="info">Répartition des moûts de chaque marc au prorata du poids net apporté (document de suivi pour les apporteurs, pas un registre réglementaire).</Notice>
      <Sec className="mt-4" title={`Relevés ${annee}`} right={<Btn kind="primary" onClick={() => setImp(true)} disabled={!L.length}>🖨 Imprimer les relevés</Btn>}>
        <Tbl rows={L.map((r) => ({ ...r, id: r.apporteurId || '_expl' }))} empty="Aucun marc cette année." cols={[
          { h: 'Apporteur', r: (r) => <b>{releveNom(db, r.apporteurId)}</b> }, { h: 'Raisins pressés', cls: 'r', r: (r) => <span className="num">{kgTxt(r.kg)}</span> },
          { h: 'Cuvée', cls: 'r', r: (r) => <span className="num">{fmtL(r.cuvee)}</span> }, { h: 'Tailles', cls: 'r', r: (r) => <span className="num">{fmtL(r.taille)}</span> }, { h: 'Rebêches', cls: 'r', r: (r) => <span className="num">{fmtL(r.rebeche)}</span> },
          { h: 'Total moûts', cls: 'r', r: (r) => <b className="num">{fmtL(r.total)}</b> }, { h: 'TAP moyen', cls: 'r hm', r: (r) => (r.tap != null ? <span className="num">{fmt(r.tap, 1)} % vol.</span> : <span className="text-ink2">—</span>) }, { h: 'Marcs', r: (r) => <span className="text-xs">{r.marcs.map((m) => `n° ${m.num || '?'}`).join(', ')}</span> }]} />
      </Sec>
      {imp ? <RelevesImpression annee={annee} L={L} onClose={() => setImp(false)} /> : null}
    </div>
  );
}
const releveNom = (db, id) => (id ? apporteurName(db, id) : 'Raisins de l’exploitation');
function RelevesImpression({ annee, L, onClose }) {
  const { db } = useApp(); const ref = useRef(null); const out = useReportOutput(ref, `releves-apporteurs-${annee}`);
  return (
    <Sheet wide title={`Relevés par apporteur — ${annee}`} sub="une page par apporteur" onClose={onClose} footer={<><Btn onClick={onClose} className="mr-auto">Fermer</Btn><BoutonsSortie out={out} /></>}>
      <div ref={ref} className="report">
        {L.map((r, i) => <div key={i} className="rpt-item"><ReportHead title={`Relevé de pressurage — ${releveNom(db, r.apporteurId)}`} sub={`Vendanges ${annee} · répartition au prorata du poids`} />
          <RTable head={['Marc', 'Date', 'Poids apporté (kg)', 'Part du marc', 'Cuvée (hL)', 'Tailles (hL)', 'Rebêches (hL)']} rows={r.marcs.map((m) => [`n° ${m.num || '?'}`, fmtDate(m.date), fmt(m.kg), pct(m.part), fmtHL(m.cuvee), fmtHL(m.taille), fmtHL(m.rebeche)])} />
          <p><b>Total : {kgTxt(r.kg)} · cuvée {fmtL(r.cuvee)} · tailles {fmtL(r.taille)} · rebêches {fmtL(r.rebeche)}{r.tap != null ? ` · TAP moyen ${fmt(r.tap, 1)} % vol.` : ''}</b></p></div>)}
      </div>
    </Sheet>
  );
}

/* ---------- bilan de campagne et exports ---------- */
function BilanPressoirView({ annee }) {
  const { db, toast } = useApp(); const b = useMemo(() => bilanPressoir(db, annee), [db, annee]); const P = b.params;
  const exporter = async (quoi) => { const csv = '﻿' + (quoi === 'pesees' ? registrePeseesCsv(db, annee) : carnetPressoirCsv(db, annee)); const nom = quoi === 'pesees' ? `registre-pesees-${annee}.csv` : `carnet-pressoir-${annee}.csv`;
    const r = await saveFile(nom, csv, 'text/csv;charset=utf-8'); if (r.ok) toast(`Export : ${nom}`); else if (!r.declined) toast(failMsg(r), 'bad'); };
  return (
    <div>
      <div className="mb-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <Kpi label="Raisins pesés" value={kgTxt(b.kgPeses)} sub={`${b.nbPesees} pesée(s)`} /><Kpi label="Raisins pressés" value={kgTxt(b.kgPresses)} sub={`${b.nbMarcs} marc(s) en ${b.jours} jour(s)`} />
        <Kpi label="Moûts revendicables" value={fmtL(b.volumes.aoc)} sub={b.kgPresses ? `${fmt((b.volumes.aoc / b.kgPresses) * 160, 1)} L / 160 kg` : ''} /><Kpi label="Rebêches" value={fmtL(b.volumes.rebeche)} sub={b.tauxRebeches ? `minimum ${fmt(b.tauxRebeches, 1)} %` : 'pas de minimum cette année'} />
        <Kpi label="Bourbes" value={fmtL(b.volumes.bourbes)} sub={b.volumes.total ? `${fmt((b.volumes.bourbes / b.volumes.total) * 100, 1)} % des moûts` : ''} />
        <Kpi label="TAP moyen" value={b.tap ? `${fmt(b.tap.tap, 1)} % vol.` : '—'} sub={b.tap ? `${kgTxt(b.tap.kg)} de raisins mesurés${b.tapBas ? ` · ${b.tapBas} sous le minimum` : ''}` : 'aucun TAP relevé'} tone={b.tapBas ? 'warn' : undefined} />
        <Kpi label="Pourriture acide" value={b.pourriture ? kgTxt(b.pourriture.kg) : 'aucune'} sub={b.pourriture ? `${b.pourriture.nb} pesée(s) · ${fmt(b.pourriture.moyenne, 1)} % en moyenne` : 'aucune pourriture acide relevée'} tone={b.pourriture ? 'warn' : undefined} />
      </div>
      <Sec title="À surveiller">
        {b.alertes.length ? <div className="space-y-2" data-alertes-pressoir="">{b.alertes.map((a, i) => <Notice key={i} tone={a.niveau === 'bloquant' ? 'bad' : 'warn'}>{a.msg}</Notice>)}</div> : <Notice tone="ok">Rien à signaler pour les vendanges {annee}.</Notice>}
        {b.nonValides.pesees || b.nonValides.marcs ? <p className="help mt-2">{b.nonValides.pesees ? `${b.nonValides.pesees} pesée(s) ` : ''}{b.nonValides.pesees && b.nonValides.marcs ? 'et ' : ''}{b.nonValides.marcs ? `${b.nonValides.marcs} marc(s) ` : ''}à valider.</p> : null}
      </Sec>
      <Sec title="Cadence des pressoirs">
        <Tbl rows={b.pressoirs} empty="Aucun marc." cols={[{ h: 'Pressoir', r: (x) => <b>{x.nom}</b> }, { h: 'Agrément', r: (x) => (x.h24 ? '24 h/24' : x.agrement || '—') }, { h: 'Marcs', cls: 'r', r: (x) => x.nb },
          { h: 'Maximum en 24 h', cls: 'r', r: (x) => <Chip tone={P.cadenceMax && x.max24 > P.cadenceMax ? 'bad' : 'ok'}>{x.max24}{P.cadenceMax ? ` / ${P.cadenceMax}` : ''}</Chip> }, { h: 'Moyenne par jour', cls: 'r', r: (x) => <Chip tone={x.plafondMoy && x.moyenne > x.plafondMoy ? 'warn' : ''}>{fmt(x.moyenne, 2)}{x.plafondMoy ? ` / ${x.plafondMoy}` : ''}</Chip> }]} />
      </Sec>
      <Sec title="Dates limites">
        <ul className="list-disc pl-5 text-sm space-y-1">{b.limiteRebeches ? <li>Rebêches à livrer en distillerie avant le <b>{fmtDate(b.limiteRebeches)}</b> (garder le justificatif).</li> : null}{b.limiteBourbes ? <li>Bourbes à éliminer avant le <b>{fmtDate(b.limiteBourbes)}</b>.</li> : null}
          {(P.dates[annee] || {}).finPressurage ? <li>Fin des pressurages : {fmtDate(P.dates[annee].finPressurage)}.</li> : null}{(P.dates[annee] || {}).remiseCarnets ? <li>Remise des carnets : {fmtDate(P.dates[annee].remiseCarnets)}.</li> : null}
          {!b.limiteRebeches && !b.limiteBourbes ? <li className="text-ink2">Aucune date limite dans ce profil.</li> : null}</ul>
      </Sec>
      <Sec title="Exports">
        <div className="flex flex-wrap gap-2"><Btn onClick={() => exporter('pesees')} data-export-pesees="">⬇ Registre des pesées (CSV)</Btn><Btn onClick={() => exporter('carnet')} data-export-carnet="">⬇ Carnet de pressoir (CSV)</Btn></div>
        <p className="help mt-2">Séparateur « ; », s’ouvre dans Excel. Les deux registres sont aussi dans l’onglet Registres (exports CSV / Excel de la campagne). Aucun format d’échange officiel n’est publié : ces fichiers servent de copie et de contrôle.</p>
      </Sec>
    </div>
  );
}

/* ---------- journal du pressoir ---------- */
function JournalPressoirView({ annee }) {
  const { db, act, uid } = useApp(); const droits = usePressoirDroits();
  const J = journalTrie(db).filter((j) => num(j.annee) === annee).reverse(); const alt = new Set(journalAlteres(db).map((j) => j && j.id));
  const ecarts = registreEcarts(db).filter((x) => yearOf(x.op.date) === annee); const doubles = [...registreDoublons(db, 'pesee', annee).map((x) => ({ ...x, objet: 'pesee' })), ...registreDoublons(db, 'marc', annee).map((x) => ({ ...x, objet: 'marc' }))];
  const ACT = { validation: ['validation', 'ok'], correction: ['correction', 'warn'], annulation: ['annulation', 'bad'] };
  const champsDiff = (j) => { if (!j.avant || !j.apres) return ''; return uniq([...Object.keys(j.avant), ...Object.keys(j.apres)]).filter((k) => JSON.stringify(j.avant[k]) !== JSON.stringify(j.apres[k])).map((k) => `${k} : ${JSON.stringify(j.avant[k]) || '—'} → ${JSON.stringify(j.apres[k]) || '—'}`).join(' ; '); };
  const renum = (op) => act((d) => registreRenumeroter(d, op.id, { par: uid, maintenant: pMaintenant() }), 'Nouveau n° attribué (journal).');
  return (
    <div>
      {alt.size ? <Notice tone="bad" title="Journal modifié hors d’Œnotrack">{alt.size} ligne(s) ne correspondent plus à leur empreinte : le fichier de la base a été modifié à la main.</Notice> : null}
      {ecarts.length ? <Notice tone="warn" title="Saisies validées modifiées hors du registre">{ecarts.map((x) => `${x.op.type === 'apport' ? 'Pesée' : 'Marc'} n° ${(x.op.pesee || x.op.marc || {}).num}`).join(', ')} : modifiées sans motif (version antérieure d’Œnotrack ou fichier modifié). Vérifiez-les puis enregistrez une correction avec son motif.</Notice> : null}
      {doubles.length ? <Sec title="N° en double (synchronisation)"><div className="space-y-2">{doubles.map((x) => <div key={`${x.objet}${x.num}`} className="card flex flex-wrap items-center gap-2 p-2 text-sm"><b>{x.objet === 'pesee' ? 'Pesée' : 'Marc'} n° {x.num}</b>{x.ops.map((o, k) => <span key={o.id} className="flex items-center gap-1">{x.objet === 'pesee' ? peseeLibelle(db, o) : `${fmtDate(o.date)} ${(o.marc || {}).heureDebut || ''} · ${(o.parentSpec || {}).code || ''}`}{k > 0 && droits.ecrit ? <Btn size="sm" onClick={() => renum(o)}>Nouveau n°</Btn> : null}</span>)}</div>)}</div></Sec> : null}
      <Sec title={`Journal ${annee} (${J.length})`}>
        <Tbl rows={J} empty="Aucune entrée." cols={[
          { h: 'Quand', r: (j) => <span className="num whitespace-nowrap">{fmtDateHeure(j.quand)}</span> }, { h: 'Saisie', r: (j) => <b>{j.objet === 'pesee' ? 'Pesée' : 'Marc'} n° {j.num || '—'}</b> },
          { h: 'Action', r: (j) => <Chip tone={(ACT[j.action] || [])[1]}>{(ACT[j.action] || [j.action])[0]}</Chip> }, { h: 'Motif', r: (j) => <span className="text-sm">{j.motif || '—'}</span> },
          { h: 'Détail', cls: 'hm', r: (j) => <span className="text-xs text-ink2 break-all">{j.action === 'correction' ? champsDiff(j) : j.action === 'annulation' && j.avant ? `copie : ${j.avant.date ? fmtDate(j.avant.date) : ''} ${j.avant.kg ? kgTxt(j.avant.kg) : ''}` : ''}</span> },
          { h: 'Par', cls: 'hm', r: (j) => (j.par ? utilisateurNom(db, j.par) : '—') }, { h: 'Empreinte', r: (j) => (alt.has(j.id) ? <Chip tone="bad">altérée</Chip> : <span className="num text-xs text-ink2" title={j.h}>✓ {String(j.h || '').slice(0, 8)}</span>) }]} />
        <p className="help mt-2">Le journal ne s’efface pas : validations, corrections (valeurs d’avant et d’après, motif) et annulations (copie de la saisie). Chaque ligne porte une empreinte SHA-256 qui révèle une modification faite hors d’Œnotrack.</p>
      </Sec>
    </div>
  );
}

/* ---------- réglages : région, profil de pressurage, pressoirs et balances, dates ---------- */
// région viticole (0.46.0-alpha.1) : réglée dans Paramètres › Région & types de vins (résumé : ProfilResume, 68o)
function ReglagesPressoirView({ annee }) {
  const { db, act } = useApp(); const droits = usePressoirDroits(); const P = pressoirParams(db); const reg = regionDe(db);
  const [nv, setNv] = useState({}); const [nouv, setNouv] = useState(''); const [sorte, setSorte] = useState('pressoir'); const [formEd, setFormEd] = useState(false);
  useEffect(() => { setNv({}); }, [P.id]);
  // formulaire de pesée : résumé de la personnalisation
  const fp = formulaireDe(db, 'pesee'); const chp = champsStd('pesee'); const fpMasq = chp.filter((c) => champEffectif(fp, 'pesee', c.k).vis === 'masque').length; const fpObl = chp.filter((c) => champEffectif(fp, 'pesee', c.k).obligatoire).length;
  const champ = (k, label, unite, aide) => { const brut = ((db.settings.pressoir || {}).valeurs || {})[k]; const v = nv[k] !== undefined ? nv[k] : hasNum(brut) ? String(brut) : '';
    return <label key={k} className="block"><span className="lbl">{label}</span><div className="flex items-center gap-1"><input className="inp num" inputMode="decimal" value={v} placeholder={String(PRESSOIR_PROFILS[P.id][k] || 0).replace('.', ',')} disabled={!droits.params} onChange={(e) => setNv((x) => ({ ...x, [k]: e.target.value }))} onBlur={() => { if (nv[k] === undefined) return; act((d) => pressoirParamsSet(d, { valeurs: { [k]: nv[k] } }), 'Réglage du pressoir enregistré.'); setNv((x) => { const y = { ...x }; delete y[k]; return y; }); }} aria-label={label} data-reglage={k} />{unite ? <span className="text-sm text-ink2">{unite}</span> : null}</div>{aide ? <span className="help block">{aide}</span> : null}</label>; };
  const taux = ((db.settings.pressoir || {}).rebechesPct || {})[annee];
  const PR = pressoirsDe(db); const BA = balancesDe(db);
  return (
    <div className="space-y-6">
      <Sec title="Région et types de vins"><div className="card p-4" data-region-pressoir=""><ProfilResume /></div></Sec>
      <Sec title="Profil de pressurage">
        <div className="flex flex-wrap gap-2">{Object.keys(PRESSOIR_PROFILS).filter((k) => reg === 'champagne' || k !== 'champagne').map((k) => <Btn key={k} kind={P.id === k ? 'primary' : undefined} aria-pressed={P.id === k} disabled={!droits.params} onClick={() => act((d) => pressoirParamsSet(d, { profil: k }), `Profil : ${PRESSOIR_PROFILS[k].nom}.`)} data-profil={k}>{PRESSOIR_PROFILS[k].nom}</Btn>)}</div>
        <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>
          {champ('ratioL', `Moûts au plus (${P.volume})`, 'L', 'pour le poids ci-contre ; un arrêté peut réduire ce volume')}{champ('ratioKg', 'Pour un poids de', 'kg')}
          {champ('marcKg', 'Marc d’usage', 'kg')}{champ('cuveeL', 'Cuvée d’usage', 'L', 'alerte seulement')}{champ('tailleL', 'Taille d’usage', 'L', 'alerte seulement')}
          {champ('bourbesMin', 'Bourbes au moins', '%')}{champ('bourbesMax', 'Bourbes au plus', '%')}{champ('cadenceMax', 'Marcs au plus par 24 h', 'par pressoir')}
          {champ('capaciteMin', 'Capacité des pressoirs au moins', 'kg')}{champ('capaciteMax', 'au plus', 'kg')}{champ('tavpMin', 'TAV en puissance au moins', '% vol.', 'contrôlé aussi sur le TAP des pesées (alerte)')}{champ('saisieDiffereeMin', 'Saisie différée signalée après', 'min')}
          <label className="block"><span className="lbl">Rebêches : taux minimum {annee}</span><div className="flex items-center gap-1"><input className="inp num" inputMode="decimal" disabled={!droits.params} defaultValue={hasNum(taux) ? String(taux) : ''} key={`${annee}-${taux}`} placeholder={String(rebechesTaux(P, annee))} onBlur={(e) => { const v = e.target.value; if (v === (hasNum(taux) ? String(taux) : '')) return; act((d) => pressoirParamsSet(d, { rebechesPct: { [annee]: v } }), 'Taux de rebêches enregistré.'); }} aria-label={`Taux minimum de rebêches ${annee}`} data-rebeches-pct="" /><span className="text-sm text-ink2">%</span></div><span className="help block">fixé chaque année entre 0 et 10 % (0 % en 2024 et 2025)</span></label>
        </div>
        <div className="mt-3 flex flex-wrap gap-4"><Check checked={P.registre} disabled={!droits.params} onChange={(v) => act((d) => pressoirParamsSet(d, { registre: v }))} label="Registre des pesées et carnet de pressoir obligatoires (toute pesée, tout marc numéroté ; TAV en puissance exigé)" /><Check checked={P.chargementPlein} disabled={!droits.params} onChange={(v) => act((d) => pressoirParamsSet(d, { chargementPlein: v }))} label="Pressoirs chargés à leur capacité agréée (sous-chargement signalé)" /></div>
        <p className="help mt-2">Valeurs vides : celles du profil. {P.id === 'champagne' ? 'AOC Champagne : cahier des charges homologué par l’arrêté du 31 juillet 2025 (rendement au pressurage, rebêches, bourbes, cadence) ; usages de la profession pour la cuvée et la taille.' : P.id === 'cremant' ? 'Crémants : 100 litres pour 150 kg de raisins (cahiers des charges des AOC crémant) ; vérifiez celui de votre appellation.' : 'Aucun plafond : les volumes sont libres.'}</p>
      </Sec>
      <Sec title="Formulaire de pesée" right={droits.params ? <Btn kind="primary" onClick={() => setFormEd(true)} data-reglage-formulaire-pesee="">⚙ Personnaliser le formulaire</Btn> : null}>
        <p className="text-sm" data-resume-formulaire-pesee="">{formulairePerso(db, 'pesee') ? `Formulaire personnalisé : ${fpMasq} champ(s) masqué(s), ${fpObl} obligatoire(s), ${fp.perso.length} champ(s) personnalisé(s).` : 'Formulaire d’origine : tous les champs affichés, aucun champ personnalisé.'}</p>
        <p className="help mt-2">Champs affichés, repliés ou masqués, obligatoires, valeurs proposées et relevés personnalisés (pourriture grise, acidité…). La date et l’heure, le poids, le cépage, l’apporteur et la revendication particulière, mentions du registre et du ticket de pesée, restent toujours affichés.</p>
      </Sec>
      {formEd ? <FormulaireEditor catId="pesee" onClose={() => setFormEd(false)} /> : null}
      <Sec title="Pressoirs et balances" right={droits.params ? <><SI value={sorte} onChange={setSorte} style={{ width: 'auto' }} options={[{ value: 'pressoir', label: 'Pressoir' }, { value: 'balance', label: 'Balance / bascule' }]} aria-label="Type d’équipement" /><input className="inp" style={{ width: 220 }} value={nouv} onChange={(e) => setNouv(e.target.value)} placeholder={sorte === 'balance' ? 'ex. Bascule 3 t' : 'ex. Pressoir Coquard 8 000 kg'} aria-label="Nom du nouvel équipement" /><Btn onClick={() => { const r = act((d) => equipementAjouter(d, nouv, sorte), 'Équipement ajouté.'); if (r.ok) setNouv(''); }} disabled={!nouv.trim()}>＋ Ajouter</Btn></> : null}>
        <Tbl rows={PR} empty="Aucun pressoir : ajoutez-en un (capacité agréée)." cols={[{ h: 'Pressoir', r: (x) => <b>{x.nom}</b> },
          { h: 'Capacité agréée (kg)', r: (x) => <input className="inp num" style={{ width: 110 }} inputMode="decimal" defaultValue={x.capaciteKg || ''} key={`${x.id}-${x.capaciteKg}`} disabled={!droits.params} onBlur={(e) => { if (num(e.target.value) !== x.capaciteKg) act((d) => equipementPressoirSet(d, x.id, { pressoir: { capaciteKg: e.target.value } }), 'Capacité enregistrée.'); }} aria-label={`Capacité de ${x.nom}`} /> },
          { h: 'Agrément', r: (x) => <SI value={x.agrement} onChange={(v) => act((d) => equipementPressoirSet(d, x.id, { pressoir: { agrement: v } }))} options={[{ value: 'qualitatif', label: 'qualitatif (4 marcs / jour en moyenne)' }, { value: 'simple', label: 'simple (5 en moyenne)' }]} aria-label={`Agrément de ${x.nom}`} /> },
          { h: '24 h/24', r: (x) => <Check checked={x.h24} disabled={!droits.params} onChange={(v) => act((d) => equipementPressoirSet(d, x.id, { pressoir: { h24: v } }))} label="" /> }]} />
        <div className="mt-3"><Tbl rows={BA} empty="Aucune balance : ajoutez la bascule du centre de pressurage." cols={[{ h: 'Balance', r: (x) => <b>{x.nom}</b> },
          { h: 'Vérification valable jusqu’au', r: (x) => <DI value={x.valideJusquau} onChange={(v) => act((d) => equipementPressoirSet(d, x.id, { balance: { valideJusquau: v } }))} disabled={!droits.params} aria-label={`Validité de ${x.nom}`} /> },
          { h: 'Vignette / référence', r: (x) => <input className="inp" defaultValue={x.ref} key={`${x.id}-${x.ref}`} disabled={!droits.params} onBlur={(e) => { if (e.target.value !== x.ref) act((d) => equipementPressoirSet(d, x.id, { balance: { ref: e.target.value } })); }} aria-label={`Référence de ${x.nom}`} /> },
          { h: 'État', r: (x) => (x.valideJusquau ? (x.valideJusquau < todayISO() ? <Chip tone="bad">périmée</Chip> : <Chip tone="ok">valable</Chip>) : <Chip>non renseignée</Chip>) }]} /></div>
        <p className="help mt-2">La pesée se fait sur le lieu du pressurage, avec une balance adaptée (vignette de vérification conseillée). Les équipements sont aussi dans Paramètres › Listes › Équipements.</p>
      </Sec>
      <Sec title={`Dates de la campagne ${annee}`}>
        <div className="flex flex-wrap gap-4">{[['finPressurage', 'Fin des pressurages'], ['remiseCarnets', 'Remise des carnets']].map(([k, l]) => <label key={k} className="block"><span className="lbl">{l}</span><DI value={((P.dates[annee] || {})[k]) || ''} disabled={!droits.params} onChange={(v) => act((d) => pressoirParamsSet(d, { dates: { [annee]: { [k]: v } } }))} aria-label={l} /></label>)}</div>
        <p className="help mt-2">Dates fixées chaque année par l’interprofession : facultatives, elles déclenchent un rappel dans le bilan.</p>
      </Sec>
    </div>
  );
}

/* ---------- onglet ---------- */
function TabPressoir() {
  const { db, camp } = useApp(); const P = pressoirParams(db);
  const annees = anneesPressoir(db); const a0 = yearOf(camp.debut);
  const [annee, setAnnee] = useState(annees.includes(a0) ? a0 : annees[0]);
  const b = useMemo(() => bilanPressoir(db, annee), [db, annee]);
  const nP = P.registre ? b.nonValides.pesees : 0; const nB = b.alertes.filter((a) => a.niveau === 'bloquant').length;
  const items = [{ id: 'pesees', label: 'Pesées', badge: nP || null }, { id: 'marcs', label: 'Pressurages', badge: b.nonValides.marcs || null }, { id: 'releves', label: 'Relevés par apporteur' }, { id: 'bilan', label: 'Bilan', badge: nB || null }, { id: 'journal', label: 'Journal' }, { id: 'reglages', label: '⚙ Réglages' }];
  const [sub, setSub] = useSousOnglet(items, 'pesees');
  const V = { pesees: PeseesView, marcs: MarcsView, releves: RelevesView, bilan: BilanPressoirView, journal: JournalPressoirView, reglages: ReglagesPressoirView }[sub] || PeseesView;
  return (
    <div data-pressoir="">
      <div className="mb-3 flex flex-wrap items-center gap-2"><span data-profil-actif={P.id}><Chip tone={P.id === 'champagne' ? 'info' : ''}>{P.id === 'champagne' ? '🥂 ' : ''}{P.nom}</Chip></span>{!champenois(db) ? <Chip>autre région viticole</Chip> : null}
        <span className="ml-auto flex items-center gap-2 text-sm"><span className="text-ink2">Vendanges</span><SI value={String(annee)} onChange={(v) => setAnnee(num(v))} style={{ width: 'auto' }} options={uniq([...annees, annee]).sort((x, y) => y - x).map((y) => ({ value: String(y), label: String(y) }))} aria-label="Année des vendanges" plain /></span></div>
      <SubNav value={sub} onChange={setSub} items={items} />
      <V annee={annee} />
    </div>
  );
}
TABS_REG.pressoir = TabPressoir;
