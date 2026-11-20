/* ============ LANGUE DE L'INTERFACE (0.24.0-alpha.1) : traduction à l'affichage, choix de la langue ============
   Un observateur traduit les textes de la page dès qu'ils s'affichent (texte des éléments, et attributs placeholder, title,
   aria-label, alt) d'après les dictionnaires (17b, 17c) ; revenir au français remet les textes d'origine. Jamais traduits : champs
   de saisie, zones marquées translate="no" (données, noms des langues). La langue est un réglage de l'appareil (localStorage). */
const TRAD_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const Traducteur = (() => {
  const orig = new WeakMap(); // nœud texte → { fr, tr } ; élément → { attr: { fr, tr } }
  let obs = null;
  const exclu = (el) => !el || (el.closest && el.closest('[translate="no"],.notranslate,textarea,[contenteditable="true"],script,style'));
  function texte(n) {
    const p = n.parentElement; if (!p || exclu(p)) return;
    const o = orig.get(n); if (LANGUE === 'fr' && !o) return; // en français : rien à faire pour un texte jamais traduit
    const v = n.nodeValue; if (!v || !/[A-Za-zÀ-ÿ]/.test(v)) return;
    const fr = o && o.tr === v ? o.fr : v; // le nœud porte-t-il déjà notre traduction ?
    const s = fr.trim(); const tr = LANGUE === 'fr' ? s : traduire(s);
    const nv = tr === s ? fr : fr.replace(s, () => tr);
    orig.set(n, { fr, tr: nv }); if (nv !== v) n.nodeValue = nv;
  }
  function attrs(el) {
    if (!el.getAttribute) return; let o = orig.get(el); if (LANGUE === 'fr' && !o) return;
    if (exclu(el)) return;
    for (const a of TRAD_ATTRS) {
      const v = el.getAttribute(a); if (!v || !/[A-Za-zÀ-ÿ]/.test(v)) continue;
      const x = o && o[a]; const fr = x && x.tr === v ? x.fr : v; const tr = LANGUE === 'fr' ? fr : traduire(fr.trim());
      if (!o) { o = {}; orig.set(el, o); } o[a] = { fr, tr }; if (tr !== v) el.setAttribute(a, tr);
    }
  }
  function parcourir(racine) {
    if (!racine) return;
    if (racine.nodeType === 3) { texte(racine); return; }
    if (racine.nodeType !== 1 && racine.nodeType !== 11) return;
    if (racine.nodeType === 1) attrs(racine);
    const w = document.createTreeWalker(racine, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n = w.nextNode(); while (n) { if (n.nodeType === 3) texte(n); else attrs(n); n = w.nextNode(); }
  }
  function demarrer() {
    if (obs || typeof MutationObserver === 'undefined' || !document.body) return;
    obs = new MutationObserver((ms) => { for (const m of ms) { if (m.type === 'characterData') texte(m.target); else if (m.type === 'attributes') attrs(m.target); else m.addedNodes.forEach(parcourir); } });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: TRAD_ATTRS });
  }
  // nouvelle langue : toute la page repasse par le français puis par la langue choisie
  function appliquer() { try { document.documentElement.lang = LANGUE; } catch (e) { /* ignoré */ } parcourir(document.body); }
  return { demarrer, appliquer };
})();
function langueChanger(id) {
  if (!langueConnue(id)) return; LANGUE = id;
  try { window.localStorage.setItem(LANGUE_KEY, id); } catch (e) { /* stockage indisponible : choix gardé pour la séance */ }
  Traducteur.appliquer(); try { window.dispatchEvent(new Event('oenotrack-langue')); } catch (e) { /* ignoré */ }
}
// au chargement : langue de l'appareil (ou du navigateur à la toute première ouverture), observateur lancé avant le premier affichage
(() => {
  let stockee = null; let base = false; let nav = ['fr'];
  try { stockee = window.localStorage.getItem(LANGUE_KEY); base = !!window.localStorage.getItem(STORAGE_KEY) || OLD_STORAGE_KEYS.some((k) => !!window.localStorage.getItem(k)); } catch (e) { /* ignoré */ }
  try { nav = navigator.languages && navigator.languages.length ? Array.from(navigator.languages) : [navigator.language]; } catch (e) { /* ignoré */ }
  LANGUE = langueInitiale({ stockee, base, navigateur: nav });
  try { if (!langueConnue(stockee)) window.localStorage.setItem(LANGUE_KEY, LANGUE); } catch (e) { /* ignoré */ }
  try { document.documentElement.lang = LANGUE; } catch (e) { /* ignoré */ }
  Traducteur.demarrer();
})();
// choix de la langue : noms des langues jamais traduits
function LangueChoix({ compact, className }) {
  const [lg, setLg] = useState(LANGUE);
  useEffect(() => { const f = () => setLg(LANGUE); window.addEventListener('oenotrack-langue', f); return () => window.removeEventListener('oenotrack-langue', f); }, []);
  return (
    <label className={cx('langue-choix', compact && 'langue-compacte', className)} translate="no" title="Langue · Language · Idioma · Lingua · Sprache · Língua">
      <span aria-hidden="true">🌐</span>
      <select className="inp" value={lg} onChange={(e) => langueChanger(e.target.value)} aria-label="Langue / Language" data-langue="">
        {LANGUES.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
      </select>
    </label>
  );
}
