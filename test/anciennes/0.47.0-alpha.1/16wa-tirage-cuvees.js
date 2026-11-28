/* ============ TIRAGE — PRÉVISIONNEL DES CUVÉES D'UN CHANTIER (0.44.0-alpha.1) ============
   Un chantier tire souvent plusieurs qualités (couleurs, revendications, échelles des crus, cépages différents) : chaque cuvée prévue est
   décrite depuis ses vins de base, puis la cuve de mixtion ou le lot tiré par pompe doseuse se créent depuis la ligne et la mettent à jour.
   - chantier.cuvees = [{ id, nom, sources [{ portionId, lotId, volL }], vinHL (vin de base prévu), pointGL, mode ('mixtion' | 'pompe'),
     formats [{ format, nb }], couleur, qualif, echelle, millesime, mentions [texte] (vides = calculés), notes, par, le, maj }]
   - opérations liées : assemblage marqué mixtion et tirage portent op.cuveeId (+ op.chantierId) ; une version antérieure les garde
   - déclaration préalable d'un chantier : une ligne par cuvée (couleur, revendication, échelle, mentions, vin, sucre, total) et les totaux ;
     rosé d'assemblage : vins rouges et blancs d'après la couleur des vins de base, au prorata du vin prévu */

const chantierCuvees = (ch) => (Array.isArray(ch && ch.cuvees) ? ch.cuvees.filter((c) => c && c.id) : []);
const chantierCuvee = (db, chantierId, id) => chantierCuvees(chantierTirage(db, chantierId)).find((c) => c.id === id) || null;
// mentions d'une composition : Grand / Premier Cru (si tout le vin), blanc de blancs, blanc de noirs (pinots noir et meunier, seuls ou ensemble), monocépage
function cuveeMentionsComp(db, comp, couleur) {
  const out = []; if (!comp) return out;
  const e = echelleInfo(comp); const ed = e.id && !e.partiel && Object.keys(comp.echelles || {}).filter((k) => comp.echelles[k] > 0.0005).length === 1 ? eDef(e.id) : null;
  if (ed && /grand/i.test(`${ed.id} ${ed.label}`)) out.push('Grand Cru'); else if (ed && /premier|1er/i.test(`${ed.id} ${ed.label}`)) out.push('Premier Cru');
  const ce = Object.keys(comp.cepages || {}).filter((k) => comp.cepages[k] > 0.0005); const blanc = !couleur || couleur === 'blanc';
  if (ce.length && ce.every((k) => k === 'pn' || k === 'pm') && blanc) out.push('Blanc de noirs');
  if (ce.length === 1) { if (ce[0] === 'chard' && blanc) out.push('Blanc de blancs'); else out.push(`Monocépage ${(((db.lists && db.lists.cepages) || []).find((c) => c.id === ce[0]) || { label: ce[0] }).label}`); }
  return out;
}
// caractères calculés depuis les vins de base : couleur, revendication (la plus basse), échelle, millésime commun, cépages, mentions,
// volumes de vins rouges et blancs (rosé d'assemblage)
function cuveeCaracteres(db, R, sources) {
  const S = (sources || []).map((s) => { const p = (R.portions || {})[s.portionId]; const lotId = s.lotId || (p && p.lotId); return { lotId, volL: num(s.volL) || (p ? p.vol : 0) }; }).filter((s) => s.lotId && (R.lots || {})[s.lotId]);
  if (!S.length) return { couleur: '', qualif: '', echelle: '', millesime: '', mentions: [], volL: 0, rougeL: 0, blancL: 0, cepages: {}, comp: null };
  const L = S.map((s) => ({ ...s, lot: R.lots[s.lotId] }));
  const comp = mixComp(L.map((x) => ({ comp: composition(db, R, x.lotId), w: x.volL })));
  const couleur = mixCouleur(db, L.map((x) => x.lot.couleur || '')); const qualif = minQualif(uniq(L.map((x) => x.lot.qualif).filter(Boolean)));
  const mil = uniq(L.map((x) => String(x.lot.millesime || 'NV'))); const millesime = mil.length === 1 && /^\d{4}$/.test(mil[0]) ? mil[0] : '';
  return { couleur, qualif, echelle: echelleInfo(comp).id || '', millesime, mentions: cuveeMentionsComp(db, comp, couleur), volL: sum(L, (x) => x.volL), rougeL: sum(L.filter((x) => x.lot.couleur === 'rouge'), (x) => x.volL), blancL: sum(L.filter((x) => x.lot.couleur !== 'rouge'), (x) => x.volL), cepages: comp.cepages || {}, comp };
}
// cuvée effective : valeurs choisies, sinon calculées ; mentions complètes (revendication autre que conventionnelle comprise)
function cuveeEffective(db, R, c) {
  const k = cuveeCaracteres(db, R, c.sources); const couleur = c.couleur || k.couleur; const qualif = c.qualif || k.qualif || 'conv';
  const auto = [...(c.couleur && c.couleur !== k.couleur ? cuveeMentionsComp(db, k.comp, couleur) : k.mentions), ...(qualif && qualif !== 'conv' ? [qLabel(qualif)] : [])];
  const mentions = Array.isArray(c.mentions) && c.mentions.length ? c.mentions : auto;
  const vinHL = hasNum(c.vinHL) ? num(c.vinHL) : k.volL / 100;
  return { ...c, couleur, qualif, echelle: c.echelle || k.echelle, millesime: c.millesime !== undefined && c.millesime !== '' ? c.millesime : k.millesime, mentions, mentionsAuto: auto, vinHL, caracteres: k };
}
function chantierCuveeSave(db, chantierId, s, id, uid) {
  const ch = chantierTirage(db, chantierId); if (!ch) return fail('Chantier introuvable.'); if (isLocked(db, ch.dateDebut)) return fail('Ce chantier appartient à une campagne figée.');
  const L = Array.isArray(ch.cuvees) ? ch.cuvees : (ch.cuvees = []); const old = id ? L.find((c) => c && c.id === id) : null; if (id && !old) return fail('Cuvée prévue introuvable.');
  const nom = String(s.nom || '').trim().slice(0, 100); if (!nom) return fail('Nom de la cuvée requis.');
  if (L.some((c) => c && c.id !== id && norm(c.nom) === norm(nom))) return fail(`La cuvée « ${nom} » est déjà prévue sur ce chantier.`);
  if (hasNum(s.vinHL) && num(s.vinHL) <= 0) return fail('Volume de vin de base prévu invalide.');
  if (s.pointGL !== '' && s.pointGL != null && (!hasNum(s.pointGL) || num(s.pointGL) < 0)) return fail('Point de tirage invalide.');
  const sources = (s.sources || []).filter((x) => x && (x.portionId || x.lotId)).map((x) => ({ portionId: x.portionId || '', lotId: x.lotId || '', volL: num(x.volL) }));
  const formats = (s.formats || []).filter((f) => f && num(f.nb) > 0 && tirageFormat(f.format)).map((f) => ({ format: f.format, nb: Math.round(num(f.nb)) }));
  const mentions = (Array.isArray(s.mentions) ? s.mentions : String(s.mentions || '').split(/[,;\n]/)).map((m) => String(m).trim().slice(0, 60)).filter(Boolean).slice(0, 12);
  const x = { ...(old || {}), id: old ? old.id : `cv${(L.length ? Math.max(...L.map((c) => num(String(c.id).replace(/\D/g, '')) || 0)) : 0) + 1}`, nom, sources, ...(hasNum(s.vinHL) ? { vinHL: num(s.vinHL) } : {}), pointGL: hasNum(s.pointGL) ? num(s.pointGL) : null, mode: ['mixtion', 'ancestrale'].includes(s.mode) ? s.mode : 'pompe', formats,
    couleur: s.couleur && couleurDef(db, s.couleur) ? s.couleur : '', qualif: s.qualif && qualifList(db).some((q) => q.id === s.qualif) ? s.qualif : '', echelle: s.echelle && eDef(s.echelle) ? s.echelle : '', millesime: String(s.millesime == null ? '' : s.millesime).trim().slice(0, 10), mentions, notes: String(s.notes || '').trim().slice(0, 300), maj: new Date().toISOString(), ...(old ? {} : { par: uid || '', le: new Date().toISOString() }) };
  if (!hasNum(s.vinHL)) delete x.vinHL;
  if (old) L[L.indexOf(old)] = x; else L.push(x); ch.maj = x.maj; return okr({ id: x.id });
}
function chantierCuveeDelete(db, chantierId, id) {
  const ch = chantierTirage(db, chantierId); if (!ch) return fail('Chantier introuvable.'); const c = chantierCuvees(ch).find((x) => x.id === id); if (!c) return fail('Cuvée prévue introuvable.');
  const n = (db.ops || []).filter((o) => o && o.cuveeId === id && o.chantierId === chantierId).length; if (n) return fail(`Cuvée déjà mise en œuvre (${n} opération(s)) : retirez d’abord la cuve de mixtion ou le lot de tirage.`);
  ch.cuvees = chantierCuvees(ch).filter((x) => x.id !== id); return okr();
}
// réalisé d'une cuvée : cuves de mixtion et lots tirés liés, statut, écarts au prévu
function cuveeRealise(db, R, chantierId, c) {
  const ops = (db.ops || []).filter((o) => o && o.cuveeId === c.id && o.chantierId === chantierId);
  const mix = ops.filter((o) => o.type === 'assemblage' && o.mixtion); const tir = ops.filter((o) => o.type === 'tirage');
  const F = tir.flatMap((o) => tirageFormatsDe(o)); const cols = sum(F, (f) => num(f.nb)); const tireL = tirageVolFormats(F);
  const prevF = (c.formats || []).map((f) => ({ ...f, L: (tirageFormat(f.format) || {}).L || 0.75 })); const prevCols = sum(prevF, (f) => num(f.nb));
  const statut = tir.length ? 'tiree' : mix.length ? 'en_cours' : 'prevue';
  const ce = cuveeEffective(db, R, c); const vinPrevL = ce.vinHL * 100; const vinMisL = sum(tir, (o) => tirageBilan(db, R, { ...o, formats: tirageFormatsDe(o) }).vinL);
  return { statut, mixtions: mix.map((o) => o.id), tirages: tir.map((o) => o.id), cols, tireL, prevCols, prevL: tirageVolFormats(prevF), ecartCols: tir.length && prevCols ? cols - prevCols : null, vinMisL, ecartVinL: tir.length ? vinMisL - vinPrevL : null };
}
const CUVEE_STATUTS = { prevue: 'prévue', en_cours: 'en mixtion', tiree: 'tirée' };
// préremplissage d'une cuve de mixtion ou d'un lot de tirage depuis une cuvée prévue
function cuveePreset(db, R, ch, c, type) {
  const ce = cuveeEffective(db, R, c); const base = { chantierId: ch.id, cuveeId: c.id, date: ch.dateDebut, pointGL: ce.pointGL != null ? String(ce.pointGL) : '' };
  const srcs = (c.sources || []).map((s) => { const p = (R.portions || {})[s.portionId] || Object.values(R.portions || {}).find((x) => x.lotId === s.lotId); return p ? { portionId: p.id, volL: String(r2(Math.min(num(s.volL) || p.vol, p.vol))) } : null; }).filter(Boolean);
  if (type === 'assemblage') return { ...base, mixtion: true, ltype: 'assemblage', sources: srcs, designation: `${c.nom} — mixtion` };
  const mix = (db.ops || []).filter((o) => o && o.type === 'assemblage' && o.mixtion && o.cuveeId === c.id).map((o) => Object.values(R.portions || {}).find((p) => p.lotId === o.lotId)).filter(Boolean);
  return { ...base, mode: c.mode, designation: c.nom, millesime: ce.millesime || '', ...((c.formats || []).length ? { formats: c.formats.map((f) => ({ format: f.format, nb: String(f.nb) })) } : {}), sources: c.mode === 'mixtion' && mix.length ? mix.map((p) => ({ portionId: p.id, volL: String(r2(p.vol)) })) : srcs };
}
// lignes de la déclaration préalable d'un chantier : une par cuvée prévue (volumes calculés par le profil de tirage, à vérifier) et totaux
function declPrealableCuvees(db, R, chantierId) {
  const ch = chantierTirage(db, chantierId); const C = chantierCuvees(ch); if (!C.length) return null;
  const lignes = C.map((c) => { const ce = cuveeEffective(db, R, c); const k = hasNum(ce.pointGL) && ce.vinHL > 0 ? declPrealableCalcul(db, { vinHL: ce.vinHL, pointGL: ce.pointGL }) : fail('');
    const rose = ce.couleur === 'rose' || (couleurDef(db, ce.couleur) || {}).melange;
    return { id: c.id, nom: c.nom, couleur: ce.couleur, qualif: ce.qualif, echelle: ce.echelle, millesime: ce.millesime, mentions: ce.mentions, mode: c.mode, ok: k.ok, vinHL: k.ok ? k.vinHL : ce.vinHL, sucreHL: k.ok ? k.sucreHL : null, sucreKg: k.ok ? k.sucreKg : null, totalHL: k.ok ? k.totalHL : null, vrtpHL: k.ok ? k.vrtpHL : null,
      rougeHL: rose && ce.caracteres.volL > 0 ? ce.vinHL * ce.caracteres.rougeL / ce.caracteres.volL : 0, blancHL: rose && ce.caracteres.volL > 0 ? ce.vinHL * ce.caracteres.blancL / ce.caracteres.volL : 0, manque: !hasNum(ce.pointGL) ? 'point de tirage' : !(ce.vinHL > 0) ? 'volume de vin' : '' }; });
  const t = (k) => sum(lignes.filter((l) => l.ok), (l) => l[k] || 0);
  return { lignes, vinHL: t('vinHL'), sucreHL: t('sucreHL'), sucreKg: t('sucreKg'), totalHL: t('totalHL'), vrtpHL: t('vrtpHL'), rougeHL: sum(lignes, (l) => l.rougeHL), blancHL: sum(lignes, (l) => l.blancHL), incompletes: lignes.filter((l) => !l.ok).map((l) => l.nom) };
}
