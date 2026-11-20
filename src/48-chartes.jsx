/* ============ CHOIX DE LA CHARTE GRAPHIQUE (aperçus) ET DU MODE CLAIR / SOMBRE ============ */
function CharteMini({ c, mode }) {
  const a = mode === 'dark' ? (c.apercuDark || c.apercu) : c.apercu; const cep = c.cepages;
  return (
    <div className="charte-mini" aria-hidden="true" style={{ background: a.bg, fontFamily: a.font }}>
      <div className="m-band" style={{ background: `linear-gradient(135deg,${a.band1},${a.band2})`, color: a.bandInk, borderBottom: `2px solid ${a.bandGold}`, fontFamily: a.titre }}><span>Œno<span style={{ color: a.bandGold }}>track</span></span></div>
      <div className="m-body">
        <div className="m-card" style={{ background: a.surface, border: `1px solid ${a.line}`, color: a.ink, borderRadius: a.r }}>
          <span style={{ fontWeight: 700 }}>199,35 hL</span><span style={{ color: a.ink2 }}>en cuverie</span>
          <span className="m-btn" style={{ background: a.accent, color: a.accentInk, borderRadius: a.r }}>Action</span>
        </div>
        {['chard', 'pn', 'pm'].map((k, i) => (
          <div key={k} className="m-tank" style={{ borderColor: a.ink2, background: a.surface }}><i style={{ display: 'block', height: `${[70, 48, 30][i]}%`, background: cep[k] }} /></div>
        ))}
      </div>
    </div>
  );
}
function ChartePicker() {
  const { db, act, mode, setTheme, theme } = useApp(); const cur = charteDef(db.settings.charte).id;
  const pick = (c, m) => { act((d) => { d.settings.charte = c.id; return okr(); }, `Charte « ${c.nom} » appliquée${m ? (m === 'dark' ? ' en sombre' : ' en clair') : ''}.`); if (m) setTheme(m); };
  return (
    <div className="charte-grid" role="group" aria-label="Charte graphique">
      {CHARTES.map((c) => (
        <div key={c.id} className="charte-card" aria-current={cur === c.id ? 'true' : undefined}>
          <button type="button" className="charte-pick" aria-pressed={cur === c.id} onClick={() => pick(c)} title={`Appliquer « ${c.nom} » (mode ${mode === 'dark' ? 'sombre' : 'clair'} actuel)`}>
            <CharteMini c={c} mode={mode} />
            <span><b>{c.nom}</b>{cur === c.id ? ' ✓' : ''}{c.id === 'oenotrack' ? <span className="chip chip-info ml-1">par défaut</span> : null}</span>
            <span className="text-xs text-ink2">{c.sous}</span>
            <span className="text-xs">{c.desc}</span>
            <span className="text-xs text-ink2">Polices : {c.polices}</span>
          </button>
          <div className="charte-modes" role="group" aria-label={`Mode pour ${c.nom}`}>
            {[['light', '☀ Clair'], ['dark', '☾ Sombre']].map(([m, l]) => <button key={m} type="button" className={cx('btn btn-sm', cur === c.id && theme === m && 'btn-primary')} aria-pressed={cur === c.id && theme === m} onClick={() => pick(c, m)}>{l}</button>)}
            {c.nature === 'dark' ? <span className="text-xs text-ink2">pensé en sombre</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
function ModePicker() {
  const { db, theme, setTheme } = useApp(); const c = charteDef(db.settings.charte);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">{[['auto', 'Automatique (comme l’appareil)'], ['light', '☀ Clair'], ['dark', '☾ Sombre']].map(([k, l]) => <Btn key={k} kind={theme === k ? 'primary' : undefined} aria-pressed={theme === k} onClick={() => setTheme(k)}>{l}</Btn>)}</div>
      <div className="help">Toutes les chartes existent en clair et en sombre : le sombre repose les yeux en cave peu éclairée, le clair reste plus lisible au bureau ou en plein jour.{c.nature === 'dark' ? ` « ${c.nom} » a été pensée d’abord en sombre.` : ''}</div>
    </div>
  );
}
function ApparenceSheet({ onClose }) {
  return (
    <Sheet wide title="Thème et charte graphique" sub="Le choix est enregistré avec vos données (sauvegarde .json comprise)." onClose={onClose} footer={<Btn kind="primary" onClick={onClose}>Fermer</Btn>}>
      <div className="space-y-5"><Group label="Charte graphique"><ChartePicker /></Group><Group label="Mode d’affichage"><ModePicker /></Group></div>
    </Sheet>
  );
}
