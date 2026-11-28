/* ============ AIDE REPLIABLE (0.48.0-alpha.1) ============
   « ℹ Comment ça marche » : un texte d'aide déplié à la première visite de l'écran, puis replié (une ligne de résumé visible) ;
   souvenir par écran dans ce navigateur (oenotrack-aides : { [id]: 1 }), jamais dans la base. Les vraies alertes restent des <Notice>. */
const AIDES_KEY = 'oenotrack-aides';
const aidesLire = () => { try { const o = JSON.parse(window.localStorage.getItem(AIDES_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
const aideVue = (id) => !!aidesLire()[id];
const aideMarquer = (id) => { try { const o = aidesLire(); if (o[id]) return; o[id] = 1; window.localStorage.setItem(AIDES_KEY, JSON.stringify(o)); } catch (e) { /* ignoré */ } };
function Aide({ id, resume, titre, children, className }) {
  const [ouvert] = useState(() => !aideVue(id));
  useEffect(() => { aideMarquer(id); }, [id]);
  return (
    <details className={cx('aide', className)} open={ouvert || undefined} data-aide={id}>
      <summary><span className="aide-t">{titre || 'ℹ Comment ça marche'}</span>{resume ? <span className="min-w-0">{resume}</span> : null}</summary>
      <div className="aide-c">{children}</div>
    </details>
  );
}
