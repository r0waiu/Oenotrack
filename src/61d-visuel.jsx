/* ============ IMPRESSIONS VISUELLES (0.31.0-alpha.1) : logigramme vertical, frise ou tableau, au choix à chaque impression ============
   Utilisées par les schémas de vinification (schéma type, opérations prévues d'un lot) et par les plans de nettoyage-désinfection et
   de maintenance. La forme choisie est gardée sur l'appareil pour la prochaine impression du même document. */
const FORMES_VIS = [{ id: 'logigramme', label: '⇣ Logigramme' }, { id: 'frise', label: '⟶ Frise' }, { id: 'tableau', label: '▦ Tableau' }];
const formeLue = (cle, def) => { try { const v = localStorage.getItem(`oenotrack-forme-${cle}`); return FORMES_VIS.some((f) => f.id === v) ? v : def; } catch (e) { return def; } };
const formeGardee = (cle, v) => { try { localStorage.setItem(`oenotrack-forme-${cle}`, v); } catch (e) { /* navigateur sans stockage : choix non gardé */ } };
function FormeChoix({ value, onChange }) {
  return <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Forme de l’impression" data-forme-choix="">{FORMES_VIS.map((f) => <Btn key={f.id} kind={value === f.id ? 'primary' : undefined} role="radio" aria-checked={value === f.id} data-forme={f.id} onClick={() => onChange(f.id)}>{f.label}</Btn>)}</div>;
}
// boîte : { haut (jour, moment…), titre, lignes [texte ou élément] }
const VisBoite = ({ b }) => (
  <div className="vis-boite">{b.haut ? <div className="vis-h">{b.haut}</div> : null}{b.titre ? <div className="vis-t">{b.titre}</div> : null}
    {(b.lignes || []).filter((x) => x != null && x !== '' && x !== false).map((l, i) => <div key={i} className="vis-l">{l}</div>)}</div>
);
// logigramme vertical : une ou plusieurs colonnes de boîtes reliées par des flèches
function Logigramme({ colonnes }) {
  const seule = colonnes.length === 1;
  return (
    <div className="vis-logi" data-vis="logigramme">
      {colonnes.map((c, i) => (
        <div key={i} className={cx('vis-col', seule && 'seule')}>
          {c.titre ? <div className="vis-col-t">{c.titre}</div> : null}
          {c.boites.map((b, k) => <React.Fragment key={k}>{k ? <div className="vis-fleche" aria-hidden="true">▼</div> : null}<VisBoite b={b} /></React.Fragment>)}
        </div>
      ))}
    </div>
  );
}
// frise : des jalons (jour, moment, mois) le long d'une ligne, leurs boîtes en dessous ; 8 jalons par ligne au plus
function Frise({ colonnes, parLigne = 8 }) {
  const rangs = []; for (let i = 0; i < colonnes.length; i += parLigne) rangs.push(colonnes.slice(i, i + parLigne));
  return (
    <div data-vis="frise">
      {rangs.map((r, k) => (
        <div key={k} className="vis-frise" style={{ gridTemplateColumns: `repeat(${r.length}, minmax(0, 1fr))` }}>
          {r.map((c, i) => <div key={i} className="vis-fcol"><div className="vis-fh">{c.haut}</div><div className="vis-fdot" aria-hidden="true" /><div className="vis-fs">{c.sous || ' '}</div>{c.boites.map((b, j) => <VisBoite key={j} b={b} />)}</div>)}
        </div>
      ))}
    </div>
  );
}
function TableauVis({ entetes, lignes }) {
  return <table data-vis="tableau"><thead><tr>{entetes.map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{lignes.map((l, i) => <tr key={i}>{l.map((v, j) => <td key={j}>{v == null || v === '' ? '—' : v}</td>)}</tr>)}</tbody></table>;
}
// feuille d'impression : forme au choix (gardée sur l'appareil), aperçu, sorties (imprimer, PDF, HTML)
function ImpressionVisuelle({ cle, titre, sous, nomFichier, rendu, onClose, formeDefaut, note, attrs, aide }) {
  const ref = useRef(null); const [forme, setForme0] = useState(() => formeLue(cle, formeDefaut || 'logigramme'));
  const setForme = (v) => { setForme0(v); formeGardee(cle, v); };
  const out = useReportOutput(ref, `${nomFichier}-${forme}`, { orientation: forme === 'frise' ? 'paysage' : 'portrait' });
  return (
    <Sheet wide title={titre} sub={aide ? <><span>{aide}</span> · <span>Choisissez la forme : logigramme vertical, frise ou tableau.</span></> : 'Choisissez la forme : logigramme vertical, frise ou tableau.'} onClose={onClose} footer={<><Btn onClick={onClose} className="mr-auto">Fermer</Btn><BoutonsSortie out={out} /></>}>
      <div className="mb-3"><FormeChoix value={forme} onChange={setForme} /></div>
      <div className="fiche-scroll"><div ref={ref} className="report" data-impression-visuelle={forme} {...(attrs || {})}><ReportHead title={titre} sub={sous} />{rendu(forme)}
        {note ? <p className="muted" style={{ fontSize: 10, marginTop: 10 }}>{note}</p> : null}</div></div>
    </Sheet>
  );
}
