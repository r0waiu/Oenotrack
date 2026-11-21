/* ============ GLISSER-DÉPOSER DE FICHIERS (0.17.0-alpha.1) ============
   Toute zone de dépôt montée à l'écran prend la main sur le dépôt global (synchronisation par fichier, 68f-drive.jsx) :
   pendant qu'on glisse des fichiers au-dessus d'Œnotrack, les zones s'allument (classe « depot-fichiers » sur <html>) ;
   un fichier lâché dans une zone y est joint, ailleurs il est ignoré avec un message. */
const DEPOT = { zones: 0 };
const aDesFichiers = (e) => { const t = e && e.dataTransfer && e.dataTransfer.types; return !!t && Array.from(t).includes('Files'); };
// accepte-t-on ce fichier ? accept = « .pdf,image/*,application/json… » (même syntaxe que <input type=file>)
function fichierAccepte(f, accept) {
  if (!accept) return true; const nom = String((f && f.name) || '').toLowerCase(); const type = String((f && f.type) || '').toLowerCase();
  return accept.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean).some((a) => (a.startsWith('.') ? nom.endsWith(a) : a.endsWith('/*') ? type.startsWith(a.slice(0, -1)) : type === a));
}
// dossier déposé (0.20.0-alpha.1) : ses fichiers, sous-dossiers compris (300 au plus, fichiers cachés ignorés)
async function fichiersDesEntrees(entrees, max = 300) {
  const out = []; const lireFichier = (en) => new Promise((res) => { try { en.file((f) => res(f), () => res(null)); } catch (e) { res(null); } });
  const lireDossier = (en) => new Promise((res) => { const rd = en.createReader(); const tout = []; const lot = () => rd.readEntries((L) => { if (!L.length) res(tout); else { tout.push(...L); lot(); } }, () => res(tout)); lot(); });
  const visiter = async (en) => { if (!en || out.length >= max || /^\./.test(en.name || '')) return; if (en.isFile) { const f = await lireFichier(en); if (f) out.push(f); } else if (en.isDirectory) { for (const x of await lireDossier(en)) await visiter(x); } };
  for (const en of entrees) await visiter(en);
  return out;
}
// garde (0.27.0-alpha.1) : chaque fichier est vérifié en arrière-plan avant d'être transmis (16e-garde.js) ; garde = usage ('document',
// 'logo', 'bareme', 'bulletin', 'tracabilite'…) ou false quand l'appelant vérifie lui-même
function useDepot(onFiles, { disabled, multiple = true, accept, refus, dossiers, garde = 'document' } = {}) {
  const [sur, setSur] = useState(false); const n = useRef(0); const cb = useRef(onFiles); cb.current = onFiles; const { toast } = useApp();
  const verifier = useGarde(); const [verif, setVerif] = useState(false);
  useEffect(() => { if (disabled) return undefined; DEPOT.zones += 1; return () => { DEPOT.zones = Math.max(0, DEPOT.zones - 1); }; }, [disabled]);
  useEffect(() => { if (disabled) { n.current = 0; setSur(false); } }, [disabled]);
  if (disabled) return { sur: false, props: {}, verif: false };
  const props = {
    onDragEnter: (e) => { if (!aDesFichiers(e)) return; e.preventDefault(); n.current += 1; setSur(true); },
    onDragOver: (e) => { if (!aDesFichiers(e)) return; e.preventDefault(); e.stopPropagation(); try { e.dataTransfer.dropEffect = 'copy'; } catch (er) { /* ignoré */ } },
    onDragLeave: (e) => { if (!aDesFichiers(e)) return; n.current = Math.max(0, n.current - 1); if (!n.current) setSur(false); },
    onDrop: (e) => {
      if (!aDesFichiers(e)) return; e.preventDefault(); e.stopPropagation(); n.current = 0; setSur(false);
      const traiter = async (liste) => {
        let fs = liste; if (!fs.length) return;
        const non = fs.filter((f) => !fichierAccepte(f, accept)); fs = fs.filter((f) => fichierAccepte(f, accept));
        if (non.length) toast(refus || `${non.length > 1 ? `${non.length} fichiers ignorés` : `« ${non[0].name} » ignoré`} : type de fichier non pris en charge ici.`, 'bad');
        if (!fs.length) return; if (!multiple && fs.length > 1) { toast('Un seul fichier à la fois : le premier est utilisé.'); fs = fs.slice(0, 1); }
        if (garde) { setVerif(true); try { fs = await verifier(fs, garde); } finally { setVerif(false); } if (!fs.length) return; }
        cb.current(fs);
      };
      const items = Array.from((e.dataTransfer && e.dataTransfer.items) || []); const entrees = dossiers ? items.map((it) => (it && it.webkitGetAsEntry ? it.webkitGetAsEntry() : null)).filter(Boolean) : [];
      if (entrees.some((en) => en.isDirectory)) { fichiersDesEntrees(entrees).then(traiter); return; } // un dossier : on lit son contenu
      traiter(Array.from((e.dataTransfer && e.dataTransfer.files) || []));
    },
  };
  return { sur, props, verif };
}
// Appareil photo (0.26.0-alpha.1) : sur téléphone et tablette, « 📷 Photo » à côté de la zone ouvre directement l'appareil photo (le choix
// de fichiers reste là) ; la photo est réduite (2 400 px de côté au plus, JPEG) et nommée « photo-AAAAMMJJ-HHMMSS.jpg ».
const PHOTO_COTE = 2400;
const photoPossible = () => { try { return !!window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || (window.matchMedia('(any-pointer: coarse)').matches && window.matchMedia('(hover: none)').matches)); } catch (e) { return false; } };
const accepteImages = (accept) => !accept || String(accept).split(',').some((a) => /^image\//i.test(a.trim()) || /^\.(?:jpe?g|png|webp|heic)$/i.test(a.trim()));
const photoNom = (d = new Date()) => { const p2 = (n) => String(n).padStart(2, '0'); return `photo-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`; };
async function photoPreparer(f, i) {
  const base = `${photoNom()}${i ? `-${i + 1}` : ''}`; const ext = /png/i.test(f.type) ? 'png' : /webp/i.test(f.type) ? 'webp' : /hei[cf]/i.test(f.type) ? 'heic' : 'jpg';
  const renomme = () => { try { return new File([f], `${base}.${ext}`, { type: f.type || 'image/jpeg', lastModified: Date.now() }); } catch (e) { return f; } };
  if (!/^image\/(?:jpe?g|png|webp)$/i.test(f.type || '') || typeof createImageBitmap !== 'function') return renomme();
  try {
    const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' }); const k = Math.min(1, PHOTO_COTE / Math.max(bmp.width, bmp.height));
    if (k >= 1 && f.size <= 1.5e6) { if (bmp.close) bmp.close(); return renomme(); }
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); if (bmp.close) bmp.close();
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85)); c.width = 0;
    return blob && blob.size < f.size ? new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }) : renomme();
  } catch (e) { return renomme(); }
}
// Bouton-zone en pointillés : clic = choisir les fichiers ; glisser-déposer dessus (ou sur le bloc qui porte useDepot)
function ZoneDepot({ onFiles, accept, multiple = true, disabled, busy: busy0, label, sub, icon = '📎', inputLabel = 'Fichiers à joindre', depot, className, kind, dossiers, garde = 'document' }) {
  const ref = useRef(null); const own = useDepot(onFiles, { disabled: disabled || busy0 || !!depot, multiple, accept, dossiers, garde });
  const d = depot || own; const verifier = useGarde(); const [verif, setVerif] = useState(false); const enVerif = verif || !!d.verif; const busy = busy0 || enVerif;
  const transmettre = async (fs0) => { let fs = multiple ? fs0 : fs0.slice(0, 1); if (!fs.length) return; if (garde) { setVerif(true); try { fs = await verifier(fs, garde); } finally { setVerif(false); } } if (fs.length) onFiles(fs); };
  const pick = (e) => { const fs = Array.from(e.target.files || []); e.target.value = ''; if (fs.length) transmettre(fs); };
  const photoRef = useRef(null); const [prep, setPrep] = useState(false); const photo = accepteImages(accept) && photoPossible();
  const prendre = async (e) => { const fs = Array.from(e.target.files || []); e.target.value = ''; if (!fs.length) return; setPrep(true); const L = []; for (let i = 0; i < fs.length; i += 1) L.push(await photoPreparer(fs[i], fs.length > 1 ? i : 0)); setPrep(false); transmettre(L); };
  const Ligne = photo ? 'div' : Fragment;
  return (
    <Ligne {...(photo ? { className: 'zone-depot-ligne' } : {})}>
      <button type="button" {...(depot ? {} : d.props)} className={cx('zone-depot', d.sur && 'sur', kind === 'primary' && 'fort', className)} disabled={disabled || busy} onClick={() => ref.current && ref.current.click()} data-zone-depot="">
        <span className="zone-depot-ic" aria-hidden="true">{enVerif ? '🛡' : busy ? '⏳' : icon}</span>
        <span className="min-w-0"><b>{enVerif ? 'Vérification du fichier…' : busy ? 'Enregistrement…' : d.sur ? 'Lâchez pour déposer' : label || 'Joindre des fichiers'}</b>
          <span className="zone-depot-sub"><span className="zone-depot-glisser">{multiple ? 'Glissez-déposez vos fichiers ici, ou cliquez pour les choisir' : 'Glissez-déposez le fichier ici, ou cliquez pour le choisir'}</span>{sub ? <span className="zone-depot-glisser"> · </span> : null}{sub || null}</span></span>
      </button>
      {photo ? <button type="button" className="zone-photo" disabled={disabled || busy || prep} onClick={() => photoRef.current && photoRef.current.click()} title="Prendre une photo avec l’appareil photo" data-photo=""><span aria-hidden="true">📷</span><span>{prep ? 'Photo…' : 'Photo'}</span></button> : null}
      <input ref={ref} type="file" multiple={multiple} hidden onChange={pick} accept={accept} aria-label={inputLabel} />
      {photo ? <input ref={photoRef} type="file" accept="image/*" capture="environment" hidden onChange={prendre} aria-label="Photo à joindre" /> : null}
    </Ligne>
  );
}
