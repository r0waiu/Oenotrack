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
function useDepot(onFiles, { disabled, multiple = true, accept, refus, dossiers } = {}) {
  const [sur, setSur] = useState(false); const n = useRef(0); const cb = useRef(onFiles); cb.current = onFiles; const { toast } = useApp();
  useEffect(() => { if (disabled) return undefined; DEPOT.zones += 1; return () => { DEPOT.zones = Math.max(0, DEPOT.zones - 1); }; }, [disabled]);
  useEffect(() => { if (disabled) { n.current = 0; setSur(false); } }, [disabled]);
  if (disabled) return { sur: false, props: {} };
  const props = {
    onDragEnter: (e) => { if (!aDesFichiers(e)) return; e.preventDefault(); n.current += 1; setSur(true); },
    onDragOver: (e) => { if (!aDesFichiers(e)) return; e.preventDefault(); e.stopPropagation(); try { e.dataTransfer.dropEffect = 'copy'; } catch (er) { /* ignoré */ } },
    onDragLeave: (e) => { if (!aDesFichiers(e)) return; n.current = Math.max(0, n.current - 1); if (!n.current) setSur(false); },
    onDrop: (e) => {
      if (!aDesFichiers(e)) return; e.preventDefault(); e.stopPropagation(); n.current = 0; setSur(false);
      const traiter = (liste) => {
        let fs = liste; if (!fs.length) return;
        const non = fs.filter((f) => !fichierAccepte(f, accept)); fs = fs.filter((f) => fichierAccepte(f, accept));
        if (non.length) toast(refus || `${non.length > 1 ? `${non.length} fichiers ignorés` : `« ${non[0].name} » ignoré`} : type de fichier non pris en charge ici.`, 'bad');
        if (!fs.length) return; if (!multiple && fs.length > 1) { toast('Un seul fichier à la fois : le premier est utilisé.'); fs = fs.slice(0, 1); }
        cb.current(fs);
      };
      const items = Array.from((e.dataTransfer && e.dataTransfer.items) || []); const entrees = dossiers ? items.map((it) => (it && it.webkitGetAsEntry ? it.webkitGetAsEntry() : null)).filter(Boolean) : [];
      if (entrees.some((en) => en.isDirectory)) { fichiersDesEntrees(entrees).then(traiter); return; } // un dossier : on lit son contenu
      traiter(Array.from((e.dataTransfer && e.dataTransfer.files) || []));
    },
  };
  return { sur, props };
}
// Bouton-zone en pointillés : clic = choisir les fichiers ; glisser-déposer dessus (ou sur le bloc qui porte useDepot)
function ZoneDepot({ onFiles, accept, multiple = true, disabled, busy, label, sub, icon = '📎', inputLabel = 'Fichiers à joindre', depot, className, kind, dossiers }) {
  const ref = useRef(null); const own = useDepot(onFiles, { disabled: disabled || busy || !!depot, multiple, accept, dossiers });
  const d = depot || own;
  const pick = (e) => { const fs = Array.from(e.target.files || []); e.target.value = ''; if (fs.length) onFiles(multiple ? fs : fs.slice(0, 1)); };
  return (
    <>
      <button type="button" {...(depot ? {} : d.props)} className={cx('zone-depot', d.sur && 'sur', kind === 'primary' && 'fort', className)} disabled={disabled || busy} onClick={() => ref.current && ref.current.click()} data-zone-depot="">
        <span className="zone-depot-ic" aria-hidden="true">{busy ? '⏳' : icon}</span>
        <span className="min-w-0"><b>{busy ? 'Enregistrement…' : d.sur ? 'Lâchez pour déposer' : label || 'Joindre des fichiers'}</b>
          <span className="zone-depot-sub"><span className="zone-depot-glisser">{multiple ? 'Glissez-déposez vos fichiers ici, ou cliquez pour les choisir' : 'Glissez-déposez le fichier ici, ou cliquez pour le choisir'}</span>{sub ? <span className="zone-depot-glisser"> · </span> : null}{sub || null}</span></span>
      </button>
      <input ref={ref} type="file" multiple={multiple} hidden onChange={pick} accept={accept} aria-label={inputLabel} />
    </>
  );
}
