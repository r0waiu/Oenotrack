/* ============ ÉTIQUETTES QR DES CUVES ET SCANNER (0.29.0-alpha.1) ============
   Le QR ne contient qu'une adresse (Œnotrack en ligne) et l'identifiant interne de la cuve — aucune donnée de la cave : lu par
   l'appareil photo du téléphone, il ouvre directement la fiche de la cuve (après connexion si les identifiants sont activés) ;
   en mode « code » (sans adresse), seul le scanner d'Œnotrack le lit. Planche A4 de 24 étiquettes (70 × 37 mm) ou grande étiquette A6 ;
   0.38.0-alpha.1 : planche A4 personnalisable (colonnes × lignes, largeur × hauteur, marges, espacements — etiqPersoMise, 16j-cave),
   réglage gardé sur cet appareil (« oenotrack-etiquettes » : format, perso, contour). */
const qrBaseDefaut = () => { try { const u = window.location; if (!/^https?:$/.test(u.protocol)) return ''; const b = `${u.origin}${u.pathname}`; return qrBaseValide(b) ? b : ''; } catch (e) { return ''; } };
function QrImage({ texte, titre, className }) {
  const svg = useMemo(() => { try { return qrSvg(texte, { niveau: 'Q', titre }); } catch (e) { return ''; } }, [texte, titre]);
  return svg ? <span className={cx('qr', className)} translate="no" data-qr={texte} dangerouslySetInnerHTML={{ __html: svg }} /> : <span className={cx('qr qr-ko', className)}>QR ?</span>;
}
const ETIQ_KEY = 'oenotrack-etiquettes';
const mmTxt = (x) => num(x).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
function EtiquettesSheet({ contIds, onClose }) {
  const { db, act, niveau, secu } = useApp(); const q = qrReglages(db); const defaut = qrBaseDefaut();
  const [o, setO] = useState(() => { let x = {}; try { x = JSON.parse(window.localStorage.getItem(ETIQ_KEY) || '{}') || {}; } catch (e) { x = {}; } return { format: ['a6', 'perso'].includes(x.format) ? x.format : 'a4', debut: 1, type: x.type !== false, site: x.site !== false, entreprise: !!x.entreprise, perso: etiqPersoNorm(x.perso), contour: !!x.contour }; });
  useEffect(() => { try { window.localStorage.setItem(ETIQ_KEY, JSON.stringify({ format: o.format, type: o.type, site: o.site, entreprise: o.entreprise, perso: o.perso, contour: o.contour })); } catch (e) { /* ignoré */ } }, [o.format, o.type, o.site, o.entreprise, o.perso, o.contour]);
  const P = etiqPersoMise(o.perso); const perso = o.format === 'perso'; const parPage = perso ? P.parPage : 24;
  const [saisie, setSaisie] = useState(() => { const r = {}; Object.keys(ETIQ_PERSO_DEFAUT).forEach((k) => { r[k] = String(o.perso[k]).replace('.', ','); }); return r; }); // champs tels que tapés (virgule décimale)
  const majPerso = (k, v) => { const n = { ...saisie, [k]: v }; setSaisie(n); setO((x) => ({ ...x, perso: etiqPersoNorm({ ...x.perso, [k]: v === '' ? x.perso[k] : v }), debut: 1 })); };
  const modele = (id) => { const m = ETIQ_PERSO_MODELES.find((x) => x.id === id); if (!m) return; const r = {}; Object.keys(m.v).forEach((k) => { r[k] = String(m.v[k]).replace('.', ','); }); setSaisie(r); setO((x) => ({ ...x, perso: etiqPersoNorm(m.v), debut: 1 })); };
  const [reg, setReg] = useState(false); const [base, setBase] = useState(q.base || defaut); const [mode, setMode] = useState(q.mode);
  const peut = !secu || niveau('params') === 'ecriture';
  const conts = contIds.map((id) => db.contenants.find((c) => c.id === id)).filter(Boolean);
  const ref = useRef(null); const out = useReportOutput(ref, `etiquettes-qr-${todayISO()}`, { format: o.format === 'a6' ? 'etiq-a6' : 'etiq-a4', units: (root) => Array.from(root.querySelectorAll('.etq-page')).map((el) => ({ el, orientation: 'portrait', fit: 'page', format: o.format === 'a6' ? 'A6' : 'A4', marge: 0, svgScale: 4 })) });
  const lien = q.mode === 'lien' && qrBaseValide(q.base || defaut);
  const nomE = String((db.entreprise || {}).nom || '').trim();
  const persoStyle = { padding: `${P.pad}mm`, '--etq-k': P.echelle, '--etq-qr': `${P.qr}mm` };
  const pageStyle = perso ? { paddingTop: `${P.margeHaut}mm`, paddingLeft: `${P.margeGauche}mm`, gridTemplateColumns: `repeat(${P.cols}, ${P.largeur}mm)`, gridTemplateRows: `repeat(${P.lignes}, ${P.hauteur}mm)`, columnGap: `${P.espH}mm`, rowGap: `${P.espV}mm` } : undefined;
  const etiq = (c) => (
    <div className={cx('etq', o.format === 'a6' ? 'etq-a6' : perso ? cx('etq-perso', P.haute && 'etq-haute') : 'etq-a4', o.contour && 'etq-contour')} key={c.id} data-etiquette={c.id} style={perso ? persoStyle : undefined}>
      <QrImage texte={qrTexteCuve(db, c.id, defaut)} titre={`QR ${c.nom}`} className="etq-qr" />
      <div className="etq-txt"><div className="etq-nom" translate="no">{c.nom}</div>
        {o.type ? <div className="etq-sub" translate="no">{lbl(db, 'typesContenant', c.type)} · {fmtL(c.volMax)}</div> : null}
        {o.site && db.sites.length > 1 ? <div className="etq-sub" translate="no">{siteName(db, c.siteId)}</div> : null}
        {o.entreprise && nomE ? <div className="etq-ent" translate="no">{nomE}</div> : null}
        <div className="etq-pied">{lien ? 'Scannez : fiche de la cuve' : 'Scanner Œnotrack'}</div></div>
    </div>);
  const pages = []; if (o.format !== 'a6') { const vides = Math.max(0, Math.min(parPage - 1, num(o.debut) - 1)); const cases = [...Array(vides).fill(null), ...conts]; for (let i = 0; i < cases.length; i += parPage) pages.push(cases.slice(i, i + parPage)); } else conts.forEach((c) => pages.push([c]));
  const enregistrer = () => { const r = act((d) => { d.settings.qr = { ...(d.settings.qr || {}), mode, base: base.trim() }; return okr(); }, 'Réglages des QR codes enregistrés (pour toute l’équipe).'); if (r && r.ok) setReg(false); };
  return (
    <Sheet wide title="Étiquettes QR" sub={`${conts.length} contenant(s)`} onClose={onClose} footer={<><Btn onClick={() => setReg(!reg)} className="mr-auto">⚙ Réglages des QR codes</Btn><BoutonsSortie out={out} html={false} /></>}>
      <div className="no-print mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Format">
          <Btn size="sm" kind={o.format === 'a4' ? 'primary' : undefined} aria-pressed={o.format === 'a4'} onClick={() => setO({ ...o, format: 'a4' })}>Planche A4 · 24 étiquettes 70 × 37 mm</Btn>
          <Btn size="sm" kind={o.format === 'a6' ? 'primary' : undefined} aria-pressed={o.format === 'a6'} onClick={() => setO({ ...o, format: 'a6' })}>Grande étiquette A6 (une par cuve)</Btn>
          <Btn size="sm" kind={perso ? 'primary' : undefined} aria-pressed={perso} onClick={() => setO({ ...o, format: 'perso', debut: 1 })} data-etiq-perso-bouton="">Planche A4 personnalisée</Btn>
          {o.format !== 'a6' ? <label className="flex items-center gap-2 text-sm">Commencer à l’étiquette n° <select className="inp" style={{ width: 'auto' }} value={Math.min(o.debut, parPage)} onChange={(e) => setO({ ...o, debut: num(e.target.value) })} aria-label="Première étiquette de la planche">{Array.from({ length: parPage }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select></label> : null}
        </div>
        {perso ? <div className="card space-y-3 p-3" data-etiq-perso="">
          <div className="flex flex-wrap items-end gap-2"><Field label="Modèle courant (à vérifier sur la notice de vos planches)"><select className="inp" style={{ width: 'auto' }} value="" onChange={(e) => modele(e.target.value)} aria-label="Modèle de planche"><option value="">Choisir un modèle…</option>{ETIQ_PERSO_MODELES.map((m) => <option key={m.id} value={m.id}>{m.nom}</option>)}</select></Field></div>
          <div className="etq-reglages">
            {[['cols', 'Colonnes', ''], ['lignes', 'Lignes', ''], ['largeur', 'Largeur', 'mm'], ['hauteur', 'Hauteur', 'mm'], ['margeHaut', 'Marge du haut', 'mm'], ['margeGauche', 'Marge de gauche', 'mm'], ['espH', 'Espace entre colonnes', 'mm'], ['espV', 'Espace entre lignes', 'mm']].map(([k, l, u]) => (
              <Field key={k} label={u ? `${l} (${u})` : l}><input className="inp num" inputMode="decimal" value={saisie[k]} onChange={(e) => majPerso(k, e.target.value.replace(/[^\d.,]/g, '').slice(0, 6))} onBlur={() => setSaisie((x) => ({ ...x, [k]: String(o.perso[k]).replace('.', ',') }))} aria-label={l} data-etiq-champ={k} /></Field>))}
          </div>
          <p className="help" data-etiq-resume="">Par page : {P.parPage} ({P.cols} × {P.lignes}) · étiquette {mmTxt(P.largeur)} × {mmTxt(P.hauteur)} mm · encombrement {mmTxt(P.largeurTotale)} × {mmTxt(P.hauteurTotale)} mm sur 210 × 297 mm.</p>
          {P.erreurs.map((x, i) => <Notice key={i} tone="warn">{x}</Notice>)}
          <Check checked={o.contour} onChange={(v) => setO({ ...o, contour: v })} label="Imprimer un contour léger (pour vérifier l’alignement sur une feuille blanche)" />
        </div> : null}
        <div className="flex flex-wrap gap-4"><Check checked={o.type} onChange={(v) => setO({ ...o, type: v })} label="Type et contenance" /><Check checked={o.site} onChange={(v) => setO({ ...o, site: v })} label="Site" />{nomE ? <Check checked={o.entreprise} onChange={(v) => setO({ ...o, entreprise: v })} label="Nom de l’entreprise" /> : null}</div>
        {lien ? <p className="help">Le QR code contient l’adresse d’Œnotrack en ligne et l’identifiant de la cuve (aucune donnée de la cave) : l’appareil photo du téléphone ouvre directement la fiche.</p>
          : <Notice tone="info" title="QR codes lus par le scanner d’Œnotrack">{q.mode === 'code' ? 'Mode « code » : seul le scanner d’Œnotrack (bouton 📷 Scanner de la cuverie) lit ces étiquettes.' : 'Indiquez l’adresse d’Œnotrack en ligne (⚙ Réglages des QR codes) pour que l’appareil photo du téléphone ouvre directement la fiche ; en attendant, le scanner d’Œnotrack lit ces étiquettes.'}</Notice>}
        {reg ? <div className="card space-y-3 p-3" data-qr-reglages="">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Contenu des QR codes">
            <Btn size="sm" kind={mode === 'lien' ? 'primary' : undefined} aria-pressed={mode === 'lien'} onClick={() => setMode('lien')}>Lien vers Œnotrack en ligne (appareil photo)</Btn>
            <Btn size="sm" kind={mode === 'code' ? 'primary' : undefined} aria-pressed={mode === 'code'} onClick={() => setMode('code')}>Code seul (scanner d’Œnotrack)</Btn>
          </div>
          {mode === 'lien' ? <Field label="Adresse d’Œnotrack en ligne" help={base && !qrBaseValide(base) ? 'Adresse https:// de votre Œnotrack en ligne attendue.' : 'Celle où votre équipe ouvre Œnotrack (paquet « Œnotrack en ligne »).'}><div className="flex flex-wrap gap-2"><TI value={base} onChange={setBase} placeholder="https://cave.exemple.fr/oenotrack/" />{defaut && base !== defaut ? <Btn size="sm" onClick={() => setBase(defaut)}>Adresse de cette page</Btn> : null}</div></Field> : null}
          <div className="flex flex-wrap items-center gap-2"><Btn kind="primary" size="sm" disabled={!peut || (mode === 'lien' && !!base && !qrBaseValide(base))} onClick={enregistrer}>Enregistrer pour toute l’équipe</Btn>{!peut ? <span className="help">Réglage commun : droit de modifier les paramètres nécessaire.</span> : null}</div>
          <p className="help">Changer l’adresse plus tard : réimprimez les étiquettes ; le mode « code » ne dépend d’aucune adresse.</p>
        </div> : null}
      </div>
      <div className="etq-scroll"><div ref={ref} className="report etiquettes" data-format={o.format}>
        {pages.map((pg, i) => <div key={i} className={cx('etq-page', o.format === 'a6' ? 'etq-page-a6' : perso ? 'etq-page-perso' : 'etq-page-a4')} style={pageStyle}>{pg.map((c, k) => (c ? etiq(c) : <div key={`v${k}`} className={cx('etq', perso ? 'etq-perso' : 'etq-a4', 'etq-vide', o.contour && 'etq-contour')} />))}</div>)}
      </div></div>
    </Sheet>
  );
}

// scanner : appareil photo + lecture des QR codes (BarcodeDetector), ou saisie du nom de la cuve
function ScannerSheet({ onClose }) {
  const { db, showCont, toast } = useApp(); const vref = useRef(null); const fref = useRef(null);
  const ok = typeof window !== 'undefined' && 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  const [etat, setEtat] = useState(ok ? 'demarrage' : 'non'); const [nom, setNom] = useState('');
  const ouvrir = (texte) => {
    const x = qrLire(texte); if (!x) { toast('Ce QR code n’est pas une étiquette de cuve Œnotrack.', 'bad'); return false; }
    if (!db.contenants.some((c) => c.id === x.cuve)) { toast('Cette étiquette ne correspond à aucun contenant de cette base (autre exploitation, ou contenant supprimé).', 'bad'); return false; }
    onClose(); showCont(x.cuve); return true;
  };
  useEffect(() => {
    if (!ok) return undefined; let flux = null; let t = null; let vivant = true;
    (async () => {
      try {
        const det = new window.BarcodeDetector({ formats: ['qr_code'] });
        flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); if (!vivant) return;
        const v = vref.current; v.srcObject = flux; await v.play(); setEtat('actif');
        const tour = async () => { if (!vivant) return; try { const r = await det.detect(v); const txt = r && r[0] && r[0].rawValue; if (txt && ouvrir(txt)) return; } catch (e) { /* image suivante */ } t = setTimeout(tour, 250); };
        tour();
      } catch (e) { setEtat(e && e.name === 'NotAllowedError' ? 'refuse' : 'erreur'); }
    })();
    return () => { vivant = false; clearTimeout(t); if (flux) flux.getTracks().forEach((x) => x.stop()); };
  }, []);
  const photo = async (ev) => { const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return; try { const det = new window.BarcodeDetector({ formats: ['qr_code'] }); const img = await createImageBitmap(f); const r = await det.detect(img); if (r && r[0]) ouvrir(r[0].rawValue); else toast('Aucun QR code lisible sur cette photo.', 'bad'); } catch (e) { toast('Lecture de la photo impossible sur cet appareil.', 'bad'); } };
  const trouver = () => { const n = norm(nom).trim(); if (!n) return; const c = db.contenants.find((x) => norm(x.nom).trim() === n) || db.contenants.find((x) => norm(x.nom).includes(n)); if (!c) { toast('Aucun contenant de ce nom.', 'bad'); return; } onClose(); showCont(c.id); };
  return (
    <Sheet title="Scanner une étiquette" sub="QR code d’une cuve" onClose={onClose} footer={<Btn onClick={onClose}>Fermer</Btn>}>
      {ok ? <div className="scan-cadre"><video ref={vref} className="scan-video" playsInline muted aria-label="Appareil photo" />{etat !== 'actif' ? <div className="scan-msg">{etat === 'refuse' ? 'Accès à l’appareil photo refusé : autorisez-le dans les réglages du navigateur.' : etat === 'erreur' ? 'Appareil photo indisponible.' : 'Ouverture de l’appareil photo…'}</div> : <div className="scan-viseur" aria-hidden="true" />}</div>
        : <Notice tone="info" title="Lecture directe indisponible dans ce navigateur">Utilisez l’appareil photo du téléphone : une étiquette avec lien ouvre directement la fiche de la cuve dans Œnotrack en ligne. Sinon, tapez le nom de la cuve ci-dessous.</Notice>}
      {ok ? <div className="mt-2"><Btn size="sm" onClick={() => fref.current && fref.current.click()}>📷 Lire une photo</Btn><input ref={fref} type="file" accept="image/*" capture="environment" hidden onChange={photo} aria-label="Photo d’une étiquette" /></div> : null}
      <div className="mt-4 flex flex-wrap items-end gap-2"><div className="min-w-0 flex-1"><Field label="Ou nom de la cuve"><TI value={nom} onChange={setNom} onKeyDown={(e) => { if (e.key === 'Enter') trouver(); }} placeholder="ex. Cuve 12" /></Field></div><Btn kind="primary" onClick={trouver}>Ouvrir la fiche</Btn></div>
    </Sheet>
  );
}
