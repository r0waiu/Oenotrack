/* ============ PARAMÈTRES › 🍇 VIGNOBLE (0.33.0-alpha.1 « Région & types de vins » ; 0.50.0-alpha.1 : fusion avec « Crus & parcelles ») ============
   Une seule rubrique, appellations d'abord : 1. région (carte de France ou liste) → 2. appellations produites (référentiel officiel,
   dénominations rattachées, Vin de France) → 3. types de vins (déduits des appellations ou cochés) → 4. communes et crus → 5. parcelles →
   6. adaptations (onglets, opérations, fractions, spécificités champenoises : automatiques, ou forcées « toujours affiché / masqué »).
   Tout changement s'applique aussitôt (profilEnregistrer, profilForcer, vignobleAppellationAjouter… — 16oe) ; rien n'est supprimé, les
   réglages faits à la main restent. Identifiants gardés : setTab('params', 'profil') et setTab('params', 'crus') ouvrent cette rubrique
   (« crus » à l'étape des communes, nav.sub2 « parcelles » à celle des parcelles). Raccourcis retirés (0.50.0-alpha.1). */
const VIGNOBLE_ETAPES = [['region', '1. Région'], ['appellations', '2. Appellations'], ['types', '3. Types de vins'], ['crus', '4. Communes & crus'], ['parcelles', '5. Parcelles'], ['adaptations', '6. Adaptations']];
const VIGNOBLE_GENRES = { aop: 'AOP', igp: 'IGP', dgc: 'dénomination', vsig: 'Vin de France', main: 'saisie à la main' };
const vignobleGenre = (a) => (!a.ref ? 'main' : a.ref.genre === 'dgc' ? 'dgc' : a.ref.genre === 'vsig' ? 'vsig' : a.ref.eu === 'IGP' ? 'igp' : 'aop');
const typeLabel = (t) => (PROFIL_TYPES.find((x) => x[0] === t) || [t, t])[1];
const TYPES_COURTS = { blanc: 'blanc', rose: 'rosé', rouge: 'rouge', effervescent: 'effervescent', ancestrale: 'ancestrale', doux: 'doux' };

function ProfilViticoleView({ etape }) {
  const { db, nav } = useApp(); useLangue(); const pv = profilViticole(db);
  const depart = etape || (nav && nav.sub === 'crus' ? (nav.sub2 === 'parcelles' ? 'parcelles' : 'crus') : (nav && VIGNOBLE_ETAPES.some((x) => x[0] === nav.sub2) ? nav.sub2 : 'region'));
  const [e, setE] = useState(depart); useEffect(() => { setE(depart); }, [depart]);
  const nApp = ((db.lists && db.lists.appellations) || []).length; const champ = champenois(db);
  const items = VIGNOBLE_ETAPES.map(([id, l]) => ({ id, label: id === 'crus' ? (champ ? '4. Crus (villages)' : l) : id === 'appellations' ? `${l} · ${nApp}` : id === 'parcelles' ? `${l} · ${(db.parcelles || []).length}` : l }));
  return (
    <div className="space-y-4" data-profil="" data-vignoble="">
      <Aide id="vignoble" resume="Région, appellations, types de vins, communes et parcelles : Œnotrack s’adapte aussitôt.">
        <span>Choisissez votre région puis vos appellations : les types de vins en sont déduits, et Œnotrack affiche aussitôt les onglets, opérations et fractions qui vous concernent.</span>{' '}
        <span>Rien n’est supprimé : un élément masqué revient dès qu’il redevient utile, et chacun peut être forcé « toujours affiché » ou « toujours masqué » à l’étape des adaptations.</span>
      </Aide>
      <VignobleResume />
      <div className="no-print"><SubNav value={e} onChange={setE} items={items} /></div>
      <div data-vignoble-etape={e}>
        {e === 'region' ? <VignobleRegion onSuite={() => setE('appellations')} /> : e === 'appellations' ? <VignobleAppellationsEtape /> : e === 'types' ? <VignobleTypes />
          : e === 'crus' ? <CrusView /> : e === 'parcelles' ? <ParcellesView /> : <VignobleAdaptations />}
      </div>
      {pv.defini && !profilEstDirect(db) ? <p className="help" data-profil-ancien="">Profil appliqué avec la liste à cocher d’une version précédente : le prochain changement passe au réglage en direct.</p> : null}
    </div>
  );
}
function VignobleResume() {
  const { db } = useApp(); const pv = profilViticole(db); const R = profilRegionDef(pv.region) || {};
  return (<p className="text-sm text-ink2" data-profil-actuel=""><span>Profil actuel :</span> <b translate="no">{pv.defini ? R.nom : `${R.nom || ''} (non précisé)`}</b>{' · '}<span>{pv.types.map(typeLabel).join(', ')}</span>{pv.typesAuto ? <>{' '}<Chip tone="info">déduits des appellations</Chip></> : null}{pv.le ? <span>{` · ${fmtDate(pv.le)}`}</span> : null}</p>);
}

/* ---------- 1. Région : carte de France schématique (sans réseau) + liste ---------- */
// position des bassins (longitude, latitude) sur la carte ; contour simplifié de la France métropolitaine et de la Corse
const CARTE_REGIONS = { champagne: [4.0, 49.05], alsace: [7.35, 48.25], bourgogne: [4.75, 47.1], beaujolais: [4.6, 46.1], jura_savoie: [6.0, 46.35], rhone: [4.85, 44.6], provence: [6.15, 43.5], languedoc: [3.1, 43.35], sud_ouest: [0.9, 44.0], bordeaux: [-0.55, 44.85], charentes: [-0.3, 45.75], loire: [0.4, 47.35], corse: [9.1, 42.15] };
const CARTE_FRANCE = [[2.54, 51.09], [3.1, 50.78], [4.0, 50.35], [4.85, 50.15], [5.0, 49.8], [5.8, 49.55], [6.4, 49.45], [7.0, 49.15], [8.2, 48.97], [7.8, 48.55], [7.55, 47.6], [7.0, 47.5], [6.95, 47.25], [6.1, 46.6], [6.1, 46.2], [6.8, 46.4], [6.85, 45.85], [7.1, 45.25], [6.65, 45.0], [7.0, 44.2], [7.5, 43.78], [7.0, 43.55], [6.65, 43.25], [5.93, 43.1], [5.37, 43.3], [4.6, 43.4], [3.9, 43.5], [3.1, 43.1], [3.05, 42.6], [3.17, 42.43], [2.5, 42.35], [1.75, 42.5], [0.7, 42.8], [-0.3, 42.85], [-1.4, 43.1], [-1.78, 43.37], [-1.55, 43.5], [-1.25, 44.2], [-1.25, 44.65], [-1.1, 45.55], [-1.2, 46.15], [-1.8, 46.5], [-2.2, 47.1], [-2.5, 47.3], [-3.1, 47.5], [-3.4, 47.7], [-4.4, 47.8], [-4.7, 48.05], [-4.75, 48.35], [-4.6, 48.6], [-3.9, 48.7], [-3.0, 48.85], [-2.0, 48.65], [-1.55, 48.65], [-1.6, 49.2], [-1.9, 49.7], [-1.25, 49.7], [-1.1, 49.35], [-0.3, 49.3], [0.1, 49.5], [1.0, 49.9], [1.6, 50.2], [1.6, 50.7], [1.85, 50.95]];
const CARTE_CORSE = [[9.4, 43.0], [9.55, 42.6], [9.55, 42.1], [9.25, 41.4], [8.85, 41.55], [8.6, 42.0], [8.6, 42.4], [9.0, 42.75], [9.3, 42.7]];
const carteXY = ([lon, lat]) => [Math.round(((lon + 5.2) * 0.69 * 40) * 10) / 10, Math.round(((51.4 - lat) * 40) * 10) / 10];
const cartePoly = (L) => L.map((p) => carteXY(p).join(',')).join(' ');
function CarteVignobles({ value, onChoisir, disabled }) {
  const choisir = (id) => { if (!disabled) onChoisir(id); };
  return (
    <svg viewBox="0 0 440 420" className="w-full" style={{ maxWidth: 460 }} role="group" aria-label="Carte des régions viticoles de France" data-carte-vignobles="">
      <polygon points={cartePoly(CARTE_FRANCE)} fill="var(--surface2)" stroke="var(--line)" strokeWidth="1.5" />
      <polygon points={cartePoly(CARTE_CORSE)} fill="var(--surface2)" stroke="var(--line)" strokeWidth="1.5" />
      {Object.entries(CARTE_REGIONS).map(([id, pos]) => { const R = profilRegionDef(id); if (!R) return null; const [x, y] = carteXY(pos); const on = value === id; return (
        <g key={id} role="button" tabIndex={disabled ? -1 : 0} aria-pressed={on} aria-label={R.nom} data-carte-region={id} style={{ cursor: disabled ? 'default' : 'pointer' }}
          onClick={() => choisir(id)} onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); choisir(id); } }}>
          <circle cx={x} cy={y - 6} r={20} fill="transparent" />
          <circle cx={x} cy={y} r={on ? 11 : 8} fill={on ? 'var(--gold)' : 'var(--surface)'} stroke={on ? 'var(--ink)' : 'var(--ink2)'} strokeWidth={on ? 2.5 : 1.5} />
          <text x={x} y={y - 13} textAnchor="middle" fontSize="12" fontWeight={on ? 700 : 500} fill="var(--ink)" style={{ paintOrder: 'stroke', stroke: 'var(--bg)', strokeWidth: 3 }} translate="no">{R.nom}</text>
        </g>); })}
    </svg>
  );
}
function VignobleRegion({ onSuite }) {
  const { db, act, uid, confirm } = useApp(); const lect = useLectureSeule('params'); const pv = profilViticole(db);
  const changer = async (id) => {
    if (id === pv.region && pv.defini) return; const R = profilRegionDef(id); if (!R) return;
    if (pv.defini && !(await confirm({ title: `Passer en ${R.nom} ?`, body: 'Onglets, opérations, fractions, pressoir et échelle de classement sont adaptés aussitôt. Vos réglages faits à la main sont gardés, rien n’est supprimé.', ok: 'Changer de région' }))) return;
    const r = act((d) => profilEnregistrer(d, { region: id, ...(profilViticole(d).defini ? {} : { types: R.types }) }, uid), `Région : ${R.nom}.`); if (r && r.ok) onSuite();
  };
  const groupes = [['France', 'France'], ['Étranger', 'Étranger'], ['Autre', 'Autre']];
  const R = profilRegionDef(pv.region) || {};
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
      <div className="card p-3"><CarteVignobles value={pv.region} onChoisir={changer} disabled={lect} /><p className="help mt-1">Carte schématique : cliquez sur votre bassin viticole.</p></div>
      <div className="space-y-3">
        <Field label="Région">
          <select className="inp" value={pv.region} disabled={lect} onChange={(ev) => changer(ev.target.value)} aria-label="Région viticole" data-vignoble-region="">
            {groupes.map(([g, l]) => <optgroup key={g} label={traduire(l)}>{PROFIL_REGIONS.filter((r) => r.pays === g).map((r) => <option key={r.id} value={r.id}>{r.nom}</option>)}</optgroup>)}
          </select>
        </Field>
        {R.enrichMax > 0 ? <p className="help">{`Enrichissement maximal de la zone viticole : +${fmt(R.enrichMax, 1)} % vol (règlement (UE) 1308/2013, annexe VIII ; relevable de 0,5 % vol les années exceptionnelles, éventuellement restreint par le cahier des charges).`}</p> : null}
        <Btn onClick={onSuite} data-vignoble-suite="">Choisir les appellations ›</Btn>
      </div>
    </div>
  );
}

// une appellation du référentiel (case à cocher : ajout à la liste de l'exploitation)
function VignobleRefLigne({ a, sous, deja, lect, onAjouter }) {
  return (
    <li className={cx('flex flex-wrap items-center gap-2 text-sm', sous && 'pl-6')} data-vignoble-ref={a.id}>
      <label className="flex flex-wrap items-center gap-2"><input type="checkbox" checked={deja} disabled={lect || deja} onChange={() => onAjouter(a.id)} aria-label={a.nom} />
        <span translate="no"><b>{a.nom}</b></span></label>
      <Chip>{a.genre === 'dgc' ? 'dénomination' : a.genre === 'vsig' ? 'Vin de France' : a.eu}</Chip>
      <span className="text-xs text-ink2">{a.libre ? 'tous types' : appTypes(a).map((t) => TYPES_COURTS[t]).join(' · ')}</span>
      {a.alias && a.alias.length && a.genre !== 'dgc' ? <span className="text-xs text-ink2" translate="no">{`(${a.alias.join(', ')})`}</span> : null}
      {!a.verifie ? <Chip tone="warn" title="Ajout écrit à la main : à vérifier dans le cahier des charges.">à vérifier</Chip> : null}
    </li>);
}
/* ---------- 2. Appellations produites ---------- */
function VignobleAppellationsEtape() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('params'); const pv = profilViticole(db);
  const [q, setQ] = useState(''); const [tout, setTout] = useState(false); const [cdcOuv, setCdcOuv] = useState(null);
  const mes = useMemo(() => vignobleAppellations(db), [db]); const pris = new Set(mes.filter((a) => a.ref).map((a) => a.ref.id)); const prisNom = new Set(mes.map((a) => norm(a.label)));
  const aRelier = useMemo(() => vignobleAReliers(db), [db]);
  const ajouter = (id) => act((d) => vignobleAppellationAjouter(d, id, uid), 'Appellation ajoutée.');
  const retirer = (id) => act((d) => vignobleAppellationRetirer(d, id, uid), 'Appellation retirée de la liste.');
  const region = useMemo(() => { const L = appRefRegion(pv.region).filter(appEnVigueur); const tete = L.filter((a) => !a.parentId).sort((a, b) => (a.eu === b.eu ? a.nom.localeCompare(b.nom, 'fr') : a.eu === 'AOP' ? -1 : 1));
    return tete.map((a) => ({ a, dgc: L.filter((x) => x.parentId === a.id).sort((x, y) => x.nom.localeCompare(y.nom, 'fr')) })); }, [pv.region]);
  const nq = norm(q); const filtre = (a) => !nq || norm(a.nom).includes(nq) || (a.alias || []).some((x) => norm(x).includes(nq));
  const autres = useMemo(() => (q.trim() ? appChercher(q, { region: pv.region, limite: 20 }).filter((a) => a.region !== pv.region) : []), [q, pv.region]);
  const dejaDe = (a) => pris.has(a.id) || prisNom.has(norm(a.nom));
  const vdf = appVinDeFrance(); const france = (profilRegionDef(pv.region) || {}).pays === 'France';
  return (
    <div className="space-y-4">
      <Sec title={`Vos appellations (${mes.length})`}>
        {!mes.length ? <Empty>Aucune appellation : cochez celles que vous produisez ci-dessous.</Empty> : (
          <ul className="space-y-1" data-vignoble-mes="">{mes.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 text-sm" data-vignoble-app={a.id}>
              <b translate="no">{a.label}</b><Chip tone={a.genre === 'main' ? 'warn' : 'info'}>{VIGNOBLE_GENRES[vignobleGenre(a)]}</Chip>
              {a.types.length ? <span className="text-xs text-ink2">{a.types.map((t) => TYPES_COURTS[t]).join(' · ')}</span> : null}
              {a.usage ? <span className="text-xs text-ink2">{`${a.usage} parcelle(s)`}</span> : null}
              <span className="ml-auto" />{a.ref && cdcDe(a.ref.id) ? <Btn size="sm" onClick={() => setCdcOuv({ refId: a.ref.id, appId: a.id })} data-vignoble-cdc={a.id}>📜 Cahier des charges</Btn> : null}{lect ? null : <Btn size="sm" kind="ghost" disabled={a.usage > 0} title={a.usage ? 'Rattachée à des parcelles : retirez-la d’abord des parcelles.' : undefined} onClick={() => retirer(a.id)} data-vignoble-retirer={a.id}>Retirer</Btn>}
            </li>))}</ul>)}
        {aRelier && !lect ? <div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><span>{`${aRelier} appellation(s) saisie(s) à la main portent le nom d’une appellation du référentiel.`}</span><Btn size="sm" onClick={() => act((d) => vignobleAppellationsRelier(d, uid), 'Appellations reliées au référentiel.')} data-vignoble-relier="">Relier au référentiel</Btn></div> : null}
      </Sec>
      <Sec title={`Appellations de la région ${(profilRegionDef(pv.region) || {}).nom || ''}`}>
        <input className="inp mb-2" value={q} onChange={(ev) => setQ(ev.target.value)} placeholder="Rechercher (nom, ancien nom, dénomination)…" aria-label="Rechercher une appellation" data-vignoble-recherche="" />
        {france && vdf ? <ul className="mb-2"><VignobleRefLigne a={vdf} deja={dejaDe(vdf)} lect={lect} onAjouter={ajouter} /></ul> : null}
        {!region.length ? <Empty>Aucune appellation de cette région dans le référentiel : recherchez-la ci-dessus ou saisissez-la dans Paramètres › Listes.</Empty> : (
          <ul className="space-y-1" data-vignoble-region-liste="">{region.filter(({ a, dgc }) => filtre(a) || dgc.some(filtre)).slice(0, tout || nq ? 9999 : 40).map(({ a, dgc }) => (
            <Fragment key={a.id}><VignobleRefLigne a={a} deja={dejaDe(a)} lect={lect} onAjouter={ajouter} />{dgc.filter((x) => !nq || filtre(x) || filtre(a)).map((x) => <VignobleRefLigne key={x.id} a={x} sous deja={dejaDe(x)} lect={lect} onAjouter={ajouter} />)}</Fragment>))}</ul>)}
        {!nq && region.length > 40 && !tout ? <Btn size="sm" className="mt-2" onClick={() => setTout(true)} data-vignoble-tout="">{`Voir les ${region.length} appellations`}</Btn> : null}
        {autres.length ? <div className="mt-3"><div className="lbl mb-1">Autres régions</div><ul className="space-y-1">{autres.map((a) => <VignobleRefLigne key={a.id} a={a} deja={dejaDe(a)} lect={lect} onAjouter={ajouter} />)}</ul></div> : null}
        <p className="help mt-2">Référentiel officiel (INAO, registre de l’UE) complété des dénominations, mentions, couleurs et contenu technique lus dans les cahiers des charges en vigueur.</p>
      </Sec>
      {cdcOuv ? <CdcSheet refId={cdcOuv.refId} appId={cdcOuv.appId} onClose={() => setCdcOuv(null)} /> : null}
    </div>
  );
}

/* ---------- 3. Types de vins ---------- */
function VignobleTypes() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('params'); const pv = profilViticole(db);
  const AT = useMemo(() => appTypesRegion(pv.region), [pv.region]); const D = useMemo(() => profilTypesDeduits(db), [db]);
  const basculer = (t) => { const T = pv.types.includes(t) ? pv.types.filter((x) => x !== t) : [...pv.types, t]; act((d) => profilEnregistrer(d, { types: T, typesAuto: false }, uid), 'Types de vins enregistrés.'); };
  const auto = (on) => act((d) => profilEnregistrer(d, { typesAuto: on, types: pv.types }, uid), on ? 'Types déduits des appellations.' : 'Types cochés à la main.');
  return (
    <div className="space-y-3">
      <label className="flex flex-wrap items-center gap-2 text-sm"><input type="checkbox" checked={!!pv.typesAuto} disabled={lect || (!D.types.length && !pv.typesAuto)} onChange={(ev) => auto(ev.target.checked)} data-types-auto="" />
        <span><b>Déduire les types de vins de mes appellations</b></span>{!D.types.length ? <span className="text-xs text-ink2">(aucune appellation du référentiel dans votre liste)</span> : null}</label>
      <div className="space-y-2" data-profil-types="">{PROFIL_TYPES.map(([t, l]) => { const hors = !AT.libre && !AT.possibles.includes(t); const par = D.parType[t] || []; return (
        <div key={t} className="flex flex-wrap items-center gap-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={pv.types.includes(t)} disabled={lect || !!pv.typesAuto} onChange={() => basculer(t)} data-type={t} /><span>{l}</span></label>
          {par.length ? <span className="text-xs text-ink2" translate="no">{par.slice(0, 4).join(', ')}{par.length > 4 ? ` +${par.length - 4}` : ''}</span> : null}
          {hors ? <Chip tone={pv.types.includes(t) ? 'warn' : ''} title="Aucune appellation de la région n’autorise ce type de vin : vin sans indication géographique." data-hors-appellation={t}>hors appellation</Chip> : null}
        </div>); })}</div>
      <p className="help" data-profil-appellations="">{AT.nb.total ? (AT.libre ? `${AT.nb.total} appellation(s) dans le référentiel ; elles ne restreignent pas le type de vin.` : `${AT.nb.total} appellation(s) dans le référentiel (AOP : ${AT.nb.aop}, IGP : ${AT.nb.igp}) : un type qu’aucune n’autorise est signalé « hors appellation » (vins sans IG), sans être interdit.`) : 'Aucune appellation de cette région dans le référentiel.'}</p>
    </div>
  );
}

/* ---------- 6. Adaptations : automatiques ou forcées ---------- */
const ADAPT_ETATS = { onglets: ['affiché', 'masqué'], operations: ['proposée', 'masquée'], fractions: ['au pressurage', 'hors pressurage'], champagne: ['activées', 'désactivées'] };
function VignobleAdaptations() {
  const { db, act, uid } = useApp(); const lect = useLectureSeule('params'); const C = useMemo(() => profilCibles(db), [db]);
  const forcer = (cle, v) => act((d) => profilForcer(d, cle, v, uid), v ? 'Exception enregistrée.' : 'Retour à l’automatique.');
  return (
    <div className="space-y-3" data-vignoble-adaptations="">
      <p className="help">Chaque élément suit votre région et vos types de vins. Forcez-le si vous voulez le garder affiché ou masqué quoi qu’il arrive.</p>
      {PROFIL_CIBLE_GROUPES.filter(([g]) => C.some((x) => x.groupe === g)).map(([g, titre]) => (
        <div key={g} className="card p-3" data-profil-groupe={g}><h4 className="mb-2 font-semibold">{titre}</h4>
          <ul className="space-y-2">{C.filter((x) => x.groupe === g).map((x) => { const et = ADAPT_ETATS[g] || ADAPT_ETATS.onglets; return (
            <li key={x.cle} className="flex flex-wrap items-center gap-2 text-sm" data-adaptation={x.cle}>
              <b>{x.label}</b><Chip tone={x.effectif ? 'ok' : ''}>{x.effectif ? et[0] : et[1]}</Chip>
              {x.force ? <Chip tone="warn">forcé</Chip> : x.main ? <Chip tone="info" title="Réglé à la main dans le catalogue : gardé tel quel.">réglé à la main</Chip> : x.pour.length ? <span className="text-xs text-ink2">{x.pour.map((p) => traduire(PROFIL_POUR[p] || p)).join(' · ')}</span> : null}
              <span className="ml-auto" />
              <select className="inp" style={{ width: 'auto' }} value={x.force} disabled={lect} onChange={(ev) => forcer(x.cle, ev.target.value)} aria-label={`Réglage : ${x.label}`} data-adaptation-force={x.cle}>
                <option value="">Automatique</option><option value="affiche">Toujours affiché</option><option value="masque">Toujours masqué</option>
              </select>
            </li>); })}</ul>
        </div>))}
    </div>
  );
}

/* 0.46.0-alpha.1 — résumé (identité de la société, réglages du pressoir) avec un lien vers le réglage Vignoble */
function ProfilResume() {
  const { db, setTab } = useApp(); const pv = profilViticole(db); const R = profilRegionDef(pv.region) || {};
  return (<div className="flex flex-wrap items-center gap-3" data-profil-resume="">
    <div className="text-sm"><b translate="no">{pv.defini ? R.nom : 'Région non précisée'}</b>{pv.types.length ? <span className="text-ink2">{` · ${pv.types.map(typeLabel).join(', ')}`}</span> : null}
      <div className="help">{champenois(db) ? 'Spécificités champenoises actives (cahier des charges de l’AOC Champagne au pressoir, échelle des crus).' : 'Spécificités champenoises désactivées.'}</div></div>
    <Btn className="ml-auto" onClick={() => setTab('params', 'profil')} data-profil-regler="">🍇 Régler le vignoble</Btn>
  </div>);
}
