/* ============ PLAN DE VINIFICATION (0.39.0-alpha.1) ============
   Instruction de travail de la cave (ex. « Schéma de vinifications », document qualité) : un tableau qui donne, pour chaque étape
   (sulfitage, enzymage, débourbage, levurage, chaptalisation, FML, passage au froid, filtration, tirage…) et chaque produit, la dose
   à appliquer selon le groupe de cépages (blancs, noirs), la revendication (conventionnel, FR-BIO-01, Demeter) et la fraction (cuvée,
   tailles). Il complète les schémas de vinification (16m-schemas : étapes datées proposées à la création d'un lot).
   db.plansVinif (absent : un exemple ci-dessous, « à vérifier », copié dans la base à la 1re modification ; champs inconnus gardés) :
     { id, nom, reference (ex. OE-INS-01), version (ex. V1.2), sousTitre, note, actif,
       groupes: [{ id, label, cepages: [ids] }], revendications: [{ id (revendication de la liste, sinon libre), label }],
       fractions: [{ id, label, fractions: [ids de la liste des fractions] }],
       lignes: [{ id, type: 'etape' | 'section' | 'note', etape, produit, etendue: 'colonne' | 'revendication' | 'groupe', valeurs: { clé: texte } }],
       aVerifier, verifiePar, verifieLe, exemple, cree, maj: { par, le } }
   Colonnes = groupes × revendications × fractions. Clé d'une valeur selon l'étendue de la ligne : « g|r|f » (une colonne),
   « g|r » (cuvée et tailles d'une revendication réunies), « g » (tout le groupe de cépages).
   Import d'un tableur (planVinifDepuisFeuille) : lignes de cellules + cellules fusionnées, mise en page du modèle reconnue (titre,
   en-têtes groupes / revendications / fractionnement, étapes en 1re colonne, produits en 2e, doses ensuite).
   Les doses de l'exemple sont des valeurs courantes, non officielles : à adapter avec votre œnologue (« à vérifier »). */
const PLANV_TYPES = ['etape', 'section', 'note'];
const PLANV_ETENDUES = ['colonne', 'revendication', 'groupe'];
const PLANV_CHAMPS = ['nom', 'reference', 'version', 'sousTitre', 'note', 'actif', 'groupes', 'revendications', 'fractions', 'lignes', 'aVerifier', 'verifiePar', 'verifieLe']; // les autres (version suivante) sont gardés
// exemple : même structure que les plans des caves champenoises (12 colonnes), doses génériques à vérifier
function PLANV_EXEMPLE() {
  const G = [{ id: 'blanc', label: 'Cépage blanc', cepages: ['chard'] }, { id: 'noirs', label: 'Cépages noirs', cepages: ['pn', 'pm'] }];
  const Rv = [{ id: 'conv', label: 'Conventionnel' }, { id: 'bio', label: 'FR-BIO-01' }, { id: 'dem', label: 'Demeter' }];
  const F = [{ id: 'cuvee', label: 'Cuvée', fractions: ['cuvee'] }, { id: 'tailles', label: 'Tailles', fractions: ['taille1', 'taille2', 'taille'] }];
  // v(c, t) : même dose partout (cuvée c, tailles t) ; seulement certaines revendications : revs
  const tous = (c, t, revs) => { const o = {}; G.forEach((g) => Rv.forEach((r) => { if (!revs || revs.includes(r.id)) { o[`${g.id}|${r.id}|cuvee`] = c; if (t != null) o[`${g.id}|${r.id}|tailles`] = t; } })); return o; };
  const parRev = (v, revs) => { const o = {}; G.forEach((g) => Rv.forEach((r) => { if (!revs || revs.includes(r.id)) o[`${g.id}|${r.id}`] = v; })); return o; };
  const L = (id, etape, produit, valeurs, o) => ({ id, type: 'etape', etape, produit, etendue: 'colonne', valeurs, ...(o || {}) });
  const S = (id, type, etape) => ({ id, type, etape, produit: '', etendue: 'colonne', valeurs: {} });
  return [{
    id: 'pv-exemple-blanc', nom: 'Vinification en blanc', reference: '', version: '', actif: true,
    sousTitre: 'Les quantités d’intrants indiquées sont à adapter à chaque lot.',
    groupes: G, revendications: Rv, fractions: F,
    lignes: [
      L('l1', 'Volume non débourbé pour un marc de 4 000 kg (hL)', '', tous('20,5', '5')),
      L('l2', 'Sulfitage', 'Solution sulfureuse (à préciser)', tous('5 g/hL', '7 g/hL')),
      L('l3', 'Enzymage', 'Enzyme pectolytique (à préciser)', tous('1 g/hL', '1 g/hL', ['conv', 'bio'])),
      S('l4', 'section', 'Débourbage'), S('l5', 'note', 'Statique d’une nuit, au frais'),
      L('l6', 'Volume débourbé pour un marc de 4 000 kg (hL)', '', tous('19,5', '4,8')),
      L('l7', 'Levurage', 'Levure sèche active (à préciser)', tous('20 g/hL', '20 g/hL', ['conv', 'bio'])),
      L('l8', 'Thermorégulation', '', parRev('18 °C'), { etendue: 'revendication' }),
      L('l9', 'Chaptalisation (TAP visé)', 'Sucre (à préciser)', tous('10,5 % vol', '10,8 % vol')),
      L('l10', 'FML', 'Bactéries lactiques (à préciser)', tous('1 g/hL', '1 g/hL', ['conv', 'bio'])),
      L('l11', 'Sulfitage', 'Solution sulfureuse (à préciser)', tous('SO₂ libre : ~15 mg/L', 'SO₂ libre : ~15 mg/L')),
      S('l12', 'section', 'Assemblage'),
      L('l13', '', '', { blanc: 'Blanc de Blancs', noirs: 'Assemblage / Blanc de Noirs' }, { etendue: 'groupe' }),
      L('l14', 'Passage au froid', 'Stabulation à froid', parRev('−4 °C'), { etendue: 'revendication' }),
      L('l15', 'Filtration', 'Terres de filtration (à préciser)', parRev('selon filtrabilité'), { etendue: 'revendication' }),
      L('l16', 'Tirage', 'Sucre (point de tirage)', parRev('24 g/L'), { etendue: 'revendication' }),
      L('l17', 'Tirage', 'Levain de tirage', parRev('à préciser'), { etendue: 'revendication' }),
    ],
    note: 'Exemple non officiel : doses courantes à adapter avec votre œnologue et à vérifier sur la fiche technique des produits.', exemple: true, aVerifier: true,
  }];
}
const plansVinifDe = (db) => (Array.isArray(db && db.plansVinif) ? db.plansVinif.filter((p) => p && p.id && Array.isArray(p.lignes)) : PLANV_EXEMPLE());
function plansVinifMaterialiser(db) { if (!Array.isArray(db.plansVinif)) db.plansVinif = PLANV_EXEMPLE(); return db.plansVinif; }
const planVinifListe = (x) => (Array.isArray(x) ? x.filter((y) => y && y.id) : []);
// colonnes du tableau (ordre : groupe, puis revendication, puis fraction)
function planVinifColonnes(p) {
  const out = []; planVinifListe(p && p.groupes).forEach((g) => planVinifListe(p.revendications).forEach((r) => planVinifListe(p.fractions).forEach((f) => out.push({ key: `${g.id}|${r.id}|${f.id}`, g, r, f }))));
  return out;
}
const planVinifCle = (etendue, col) => (etendue === 'groupe' ? col.g.id : etendue === 'revendication' ? `${col.g.id}|${col.r.id}` : col.key);
const planVinifValeur = (l, col) => { const v = ((l && l.valeurs) || {})[planVinifCle(l && l.etendue, col)]; return v == null ? '' : String(v); };
// cellules à dessiner pour une ligne : valeurs réunies selon l'étendue (colspan)
function planVinifCellules(p, l) {
  const cols = planVinifColonnes(p); const out = [];
  cols.forEach((c) => { const k = planVinifCle(l.etendue, c); const last = out[out.length - 1]; if (last && last.key === k) last.span += 1; else out.push({ key: k, span: 1, col: c, valeur: planVinifValeur(l, c) }); });
  return out;
}
// ---------- enregistrement ----------
const planVinifTexte = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
function planVinifNet(db, s) {
  const ids = {}; const idNet = (x, p, i) => { let v = String((x && x.id) || '').trim().slice(0, 30) || `${p}${i + 1}`; while (ids[v]) v = `${v}b`; ids[v] = true; return v; };
  const groupes = planVinifListe(s.groupes).length ? s.groupes : []; const revs = s.revendications || []; const fracs = s.fractions || [];
  const G = (Array.isArray(groupes) ? groupes : []).filter(Boolean).map((g, i) => ({ ...g, id: idNet(g, 'g', i), label: planVinifTexte(g.label, 60) || `Groupe ${i + 1}`, cepages: uniq((Array.isArray(g.cepages) ? g.cepages : []).map(String).filter(Boolean)).slice(0, 20) }));
  const Rv = (Array.isArray(revs) ? revs : []).filter(Boolean).map((r, i) => ({ ...r, id: idNet(r, 'r', i), label: planVinifTexte(r.label, 60) || qLabel(r.id) }));
  const F = (Array.isArray(fracs) ? fracs : []).filter(Boolean).map((f, i) => ({ ...f, id: idNet(f, 'f', i), label: planVinifTexte(f.label, 60) || `Fraction ${i + 1}`, fractions: uniq((Array.isArray(f.fractions) ? f.fractions : []).map(String).filter(Boolean)).slice(0, 20) }));
  if (!G.length || !Rv.length || !F.length) return null;
  const lids = {};
  const lignes = (Array.isArray(s.lignes) ? s.lignes : []).filter(Boolean).map((l, i) => {
    let id = String(l.id || '').trim().slice(0, 30) || `l${i + 1}`; while (lids[id]) id = `${id}b`; lids[id] = true;
    const type = PLANV_TYPES.includes(l.type) ? l.type : 'etape'; const etendue = PLANV_ETENDUES.includes(l.etendue) ? l.etendue : 'colonne';
    const valeurs = {}; Object.keys(l.valeurs || {}).forEach((k) => { const v = planVinifTexte(l.valeurs[k], 120); if (v) valeurs[String(k).slice(0, 100)] = v; });
    return { ...l, id, type, etape: planVinifTexte(l.etape, 160), produit: type === 'etape' ? planVinifTexte(l.produit, 160) : '', etendue, valeurs: type === 'etape' ? valeurs : {} };
  }).filter((l) => l.etape || l.produit || Object.keys(l.valeurs).length).slice(0, 300);
  return { nom: planVinifTexte(s.nom, 100), reference: planVinifTexte(s.reference, 40), version: planVinifTexte(s.version, 20), sousTitre: planVinifTexte(s.sousTitre, 200), note: planVinifTexte(s.note, 400), actif: s.actif !== false, groupes: G, revendications: Rv, fractions: F, lignes };
}
function planVinifSave(db, s, id, uid) {
  s = s || {}; const x = planVinifNet(db, s); if (!x) return fail('Indiquez au moins un groupe de cépages, une revendication et une fraction.');
  if (!x.nom) return fail('Nom du plan de vinification requis.'); if (!x.lignes.length) return fail('Ajoutez au moins une ligne au plan.');
  const L = plansVinifMaterialiser(db); const old = id ? L.find((p) => p && p.id === id) : null; if (id && !old) return fail('Plan de vinification introuvable.');
  if (L.some((p) => p && p.id !== id && !p.exemple && norm(p.nom) === norm(x.nom) && norm(p.version) === norm(x.version))) return fail('Un plan porte déjà ce nom et cette version.');
  const verifie = s.aVerifier === false ? { aVerifier: false, verifiePar: (old && old.aVerifier === false && old.verifiePar) || uid || '', verifieLe: (old && old.aVerifier === false && old.verifieLe) || todayISO() } : { aVerifier: true };
  const maj = { par: uid || '', le: new Date().toISOString() };
  if (old) { PLANV_CHAMPS.forEach((k) => { delete old[k]; }); if (!verifie.verifiePar) { delete old.verifiePar; delete old.verifieLe; } Object.assign(old, x, verifie, { maj }); return okr({ id: old.id }); }
  const extra = {}; Object.keys(s).forEach((k) => { if (!PLANV_CHAMPS.includes(k) && !['id', 'verifie', 'exemple', 'cree', 'maj', 'verifiePar', 'verifieLe'].includes(k)) extra[k] = s[k]; }); // champs d'une version suivante (copie, import)
  const nouv = { ...extra, id: nid(db, 'pv'), ...x, ...verifie, cree: todayISO(), maj }; L.push(nouv); return okr({ id: nouv.id });
}
function planVinifValider(db, id, uid) { const p = plansVinifMaterialiser(db).find((x) => x && x.id === id); if (!p) return fail('Plan de vinification introuvable.'); p.aVerifier = false; p.verifiePar = uid || ''; p.verifieLe = todayISO(); return okr(); }
function planVinifSupprimer(db, id) { const L = plansVinifMaterialiser(db); const i = L.findIndex((x) => x && x.id === id); if (i < 0) return fail('Plan de vinification introuvable.'); L.splice(i, 1); return okr(); }
function planVinifDupliquer(db, id, uid) {
  const p = plansVinifDe(db).find((x) => x.id === id); if (!p) return fail('Plan de vinification introuvable.');
  let nom = `${p.nom} (copie)`; let k = 2; while (plansVinifDe(db).some((x) => norm(x.nom) === norm(nom))) { nom = `${p.nom} (copie ${k})`; k += 1; }
  const c = clone(p); delete c.exemple; return planVinifSave(db, { ...c, nom, aVerifier: true }, null, uid);
}
// ---------- dose écrite dans une cellule → quantité pour un volume ----------
// « 4,3 cL/hL », « 10g/hL », « 60 g/Hl », « 22 g/L », « 2 mL/hL » ; les températures, % vol, « SO2 libre : ~12 mg/L » ne sont pas des doses
function planVinifDose(t) {
  const s = String(t || '').replace(/\s+/g, ' '); if (/so\s*2|so₂|libre|°|% ?vol|selon/i.test(s)) return null;
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|mg|l|dl|cl|ml)\s*\/\s*(hl|l)\b/i); if (!m) return null;
  const v = num(m[1]); if (!(v > 0)) return null; const u = m[2].toLowerCase(); const par = m[3].toLowerCase();
  const fac = { kg: 1000, g: 1, mg: 0.001, l: 1000, dl: 100, cl: 10, ml: 1 }[u]; const liquide = ['l', 'dl', 'cl', 'ml'].includes(u);
  return { valeur: v, unite: `${m[2]}/${par === 'hl' ? 'hL' : 'L'}`, parL: (v * fac) / (par === 'hl' ? 100 : 1), base: liquide ? 'mL' : 'g' }; // parL : g ou mL par litre de vin
}
function planVinifQuantite(t, volL) {
  const d = planVinifDose(t); if (!d || !(num(volL) > 0)) return null; const q = d.parL * num(volL);
  if (d.base === 'g') return q >= 1000 ? { qte: Math.round(q / 10) / 100, unite: 'kg' } : { qte: Math.round(q * 10) / 10, unite: 'g' };
  return q >= 1000 ? { qte: Math.round(q / 10) / 100, unite: 'L' } : { qte: Math.round(q * 10) / 10, unite: 'mL' };
}
// ---------- colonne du plan qui s'applique à un lot (cépage majoritaire, revendication, fraction) ----------
function planVinifColonnePourLot(db, R, p, lotId) {
  const l = (R && R.lots && R.lots[lotId]) || null; if (!l || !p) return { col: null, manque: ['lot'] };
  const k = lotCriteres(db, R, lotId); const G = planVinifListe(p.groupes); const F = planVinifListe(p.fractions); const manque = [];
  let g = G.find((x) => k.cepage && (x.cepages || []).includes(k.cepage)) || null;
  if (!g) { const parts = Object.keys(k.cepages || {}).filter((c) => k.cepages[c] > 0); const tous = G.filter((x) => parts.length && parts.every((c) => (x.cepages || []).includes(c))); g = tous.length === 1 ? tous[0] : (G.length === 1 ? G[0] : null); }
  if (!g) manque.push('cepage');
  const r = planVinifListe(p.revendications).find((x) => x.id === l.qualif) || null; if (!r) manque.push('revendication');
  let f = F.find((x) => k.fraction && (x.fractions || []).includes(k.fraction)) || null;
  if (!f && k.fraction && typeof fracRole === 'function') { const role = fracRole(db, k.fraction); f = F.find((x) => (x.fractions || []).some((y) => fracRole(db, y) === role)) || null; }
  if (!f && F.length === 1) f = F[0]; if (!f) manque.push('fraction');
  const col = g && r && f ? planVinifColonnes(p).find((c) => c.g.id === g.id && c.r.id === r.id && c.f.id === f.id) || null : null;
  return { col, manque, criteres: k, groupe: g, revendication: r, fraction: f };
}
// lignes du plan pour un lot : valeur de sa colonne et quantité pour son volume actuel (ou le volume indiqué)
function planVinifPourLot(db, R, p, lotId, volL) {
  const c = planVinifColonnePourLot(db, R, p, lotId); const vol = volL != null ? num(volL) : num((R.lotVol || {})[lotId]);
  const lignes = (p.lignes || []).map((l) => { const v = c.col && l.type === 'etape' ? planVinifValeur(l, c.col) : ''; return { ligne: l, valeur: v, quantite: v ? planVinifQuantite(v, vol) : null }; });
  return { ...c, volL: vol, lignes };
}
// ---------- import d'un tableur (lignes de textes + fusions SheetJS { s: { r, c }, e: { r, c } }) ----------
function planVinifDepuisFeuille(db, rows0, merges0, o) {
  const rows = (Array.isArray(rows0) ? rows0 : []).map((r) => (Array.isArray(r) ? r.map((v) => (v == null ? '' : String(typeof v === 'number' ? String(v).replace('.', ',') : v).replace(/\s*\n\s*/g, ' ').trim())) : []));
  const merges = (Array.isArray(merges0) ? merges0 : []).filter((m) => m && m.s && m.e);
  const fus = (r, c) => merges.find((m) => r >= m.s.r && r <= m.e.r && c >= m.s.c && c <= m.e.c) || null;
  const cell = (r, c) => (rows[r] && rows[r][c]) || '';
  // valeur d'une cellule fusionnée : celle de son coin supérieur gauche
  const val = (r, c) => { const m = fus(r, c); return m ? cell(m.s.r, m.s.c) : cell(r, c); };
  const fr = rows.findIndex((r) => /fraction/i.test(norm(r[0] || '')) || r.filter((x) => /^cuvees?$/.test(norm(x))).length >= 2);
  if (fr < 1) return fail('Mise en page non reconnue : ligne « Fractionnement » (Cuvée, Tailles…) introuvable.');
  const debut = rows[fr].findIndex((x, i) => i > 0 && x); let fin = rows[fr].length - 1; while (fin > debut && !rows[fr][fin]) fin -= 1;
  if (debut < 1 || fin < debut) return fail('Mise en page non reconnue : colonnes des doses introuvables.');
  const colProduit = debut >= 2 ? 1 : -1;
  // segments d'une ligne d'en-tête sur [a, b] : cellules (ou fusions) successives
  const segments = (r, a, b) => { const out = []; for (let c = a; c <= b;) { const m = fus(r, c); const e = m && m.s.r <= r && m.e.r >= r ? Math.min(b, m.e.c) : c; out.push({ a: c, b: e, label: val(r, c) }); c = e + 1; } return out; };
  const revRow = fr - 1; const grRow = fr - 2 >= 0 && segments(fr - 2, debut, fin).some((s) => s.label) ? fr - 2 : -1;
  const gSegs = grRow >= 0 ? segments(grRow, debut, fin) : [{ a: debut, b: fin, label: 'Tous cépages' }];
  const cepNoms = ((db && db.lists && db.lists.cepages) || []).map((c) => ({ id: c.id, n: norm(c.label) }));
  const cepDe = (label) => { const n = norm(label); const blanc = /blanc/.test(n) && !/noir/.test(n); const noir = /noir|rouge/.test(n);
    return cepNoms.filter((c) => (blanc && /chard|blanc|arbane|meslier/.test(c.n)) || (noir && /noir|meunier/.test(c.n)) || (!blanc && !noir && n.includes(c.n))).map((c) => c.id); };
  const qualifs = ((db && db.lists && db.lists.qualifs) || DEFAULT_QUALIFS());
  const revDe = (label, i) => { const n = norm(label); const q = qualifs.find((x) => norm(x.label) === n || norm(x.court) === n || norm(x.id) === n || (/bio/.test(n) && x.id === 'bio')); return { id: q ? q.id : `r${i + 1}`, label: label || (q ? q.label : `Revendication ${i + 1}`) }; };
  const fracDe = (label, i) => { const n = norm(label); const role = /rebech/.test(n) ? 'rebeche' : /taille/.test(n) ? 'taille' : /cuvee/.test(n) ? 'cuvee' : '';
    const ids = role && typeof fracRole === 'function' ? fracList(db).filter((x) => fracRole(db, x.id) === role).map((x) => x.id) : [];
    return { id: role === 'taille' ? 'tailles' : role || `f${i + 1}`, label: label || `Fraction ${i + 1}`, fractions: ids }; };
  // groupes, puis revendications et fractions lues dans le 1er groupe (les autres doivent suivre la même disposition)
  const g0 = gSegs[0]; const rSegs = segments(revRow, g0.a, g0.b); const r0 = rSegs[0]; const fSegs = segments(fr, r0.a, r0.b);
  const larg = fSegs.length; const nR = rSegs.length; if (!larg || !nR) return fail('Mise en page non reconnue : revendications ou fractions introuvables.');
  if (gSegs.some((g) => g.b - g.a + 1 !== larg * nR)) return fail('Mise en page non reconnue : les groupes de cépages n’ont pas tous les mêmes colonnes.');
  const groupes = gSegs.map((g, i) => ({ id: `g${i + 1}`, label: g.label || `Groupe ${i + 1}`, cepages: cepDe(g.label) }));
  const revendications = rSegs.map((r, i) => revDe(r.label, i)); const fractions = fSegs.map((f, i) => fracDe(f.label, i));
  // colonne du tableur → clés
  const colInfo = (c) => { const gi = Math.floor((c - debut) / (larg * nR)); const ri = Math.floor(((c - debut) % (larg * nR)) / larg); const fi = (c - debut) % larg; return { g: groupes[gi], r: revendications[ri], f: fractions[fi] }; };
  // titre et sous-titre : lignes de texte avant l'en-tête
  const avant = rows.slice(0, Math.max(0, grRow >= 0 ? grRow : revRow)).map((r) => r.find((x) => x) || '').filter(Boolean);
  const lignes = []; let etapeCourante = ''; let precPleine = false; let n = 0;
  for (let r = fr + 1; r < rows.length; r += 1) {
    const row = rows[r] || []; if (!row.some((x) => x)) { precPleine = false; continue; }
    const mA = fus(r, 0); const pleine = !!(mA && mA.s.c === 0 && mA.e.c >= fin && mA.s.r === mA.e.r);
    if (pleine) { const t = val(r, 0); if (t) { lignes.push({ id: `l${(n += 1)}`, type: precPleine ? 'note' : 'section', etape: t, produit: '', etendue: 'colonne', valeurs: {} }); etapeCourante = ''; } precPleine = true; continue; }
    precPleine = false;
    // étape : cellule A (fusion verticale : reprise sur les lignes suivantes) ; produit : colonne B, sauf si A et B sont fusionnées
    let etape = val(r, 0); if (mA && mA.s.r < r) etape = cell(mA.s.r, 0); else if (!etape && !mA) etape = '';
    if (etape) etapeCourante = etape;
    const mB = colProduit >= 0 ? fus(r, colProduit) : null; const produit = colProduit >= 0 && !(mB && mB.s.c === 0) ? val(r, colProduit) : '';
    // valeurs : étendue la plus large commune à toutes les cellules renseignées
    const cellules = []; for (let c = debut; c <= fin;) { const m = fus(r, c); const e = m && m.s.r <= r ? Math.min(fin, m.e.c) : c; const v = val(r, c); if (v) cellules.push({ a: c, b: e, v }); c = e + 1; }
    if (!cellules.length && !produit && !(etape && !(mA && mA.s.r < r))) continue;
    const largeur = (x) => x.b - x.a + 1;
    const etendue = cellules.length && cellules.every((x) => largeur(x) === larg * nR && (x.a - debut) % (larg * nR) === 0) ? 'groupe' : cellules.length && larg > 1 && cellules.every((x) => largeur(x) === larg && (x.a - debut) % larg === 0) ? 'revendication' : 'colonne';
    const valeurs = {};
    cellules.forEach((x) => { for (let c = x.a; c <= x.b; c += 1) { const ci = colInfo(c); if (!ci.g || !ci.r || !ci.f) continue; const k = etendue === 'groupe' ? ci.g.id : etendue === 'revendication' ? `${ci.g.id}|${ci.r.id}` : `${ci.g.id}|${ci.r.id}|${ci.f.id}`; if (!valeurs[k]) valeurs[k] = x.v; } });
    lignes.push({ id: `l${(n += 1)}`, type: 'etape', etape: (mA && mA.s.r < r) ? etapeCourante : etape, produit, etendue, valeurs });
  }
  if (!lignes.length) return fail('Aucune ligne lue sous l’en-tête du tableau.');
  const nom = (o && o.nom) || avant[0] || 'Plan de vinification'; const sousTitre = avant[1] || '';
  // référence et version lues dans le nom du fichier (« OE-INS-01_Schéma de vinifications - V1.2.xlsx »)
  const ref = (o && o.fichier) ? String(o.fichier).match(/(?:^|[^A-Za-z0-9])([A-Z]{2,4}-[A-Z]{2,4}-\d{1,3})(?![0-9])/) : null; const ver = (o && o.fichier) ? String(o.fichier).replace(/\.[a-z0-9]+$/i, '').match(/(?:^|[^A-Za-z0-9])V\s?(\d+(?:[.,]\d+)*)(?![0-9])/i) : null;
  const plan = { nom: planVinifTexte(nom, 100), reference: ref ? ref[1] : '', version: ver ? `V${ver[1].replace(',', '.')}` : '', sousTitre: planVinifTexte(sousTitre, 200), groupes, revendications, fractions, lignes, aVerifier: true };
  return okr({ plan, colonnes: groupes.length * nR * larg, lignes: lignes.length });
}
// changement d'étendue d'une ligne : valeurs reprises (la 1re colonne de chaque ensemble ; une valeur réunie recopiée dans chaque colonne)
function planVinifChangerEtendue(p, l, e) {
  const nouv = PLANV_ETENDUES.includes(e) ? e : 'colonne'; const v = {};
  planVinifColonnes(p).forEach((c) => { const k = planVinifCle(nouv, c); if (v[k] == null) { const x = planVinifValeur(l, c); if (x) v[k] = x; } });
  return { ...l, etendue: nouv, valeurs: v };
}
// colonnes d'une ligne à saisir selon son étendue : [{ key, label }]
function planVinifCasesSaisie(p, etendue) {
  const out = []; const vus = {};
  planVinifColonnes(p).forEach((c) => { const k = planVinifCle(etendue, c); if (vus[k]) return; vus[k] = true; out.push({ key: k, label: etendue === 'groupe' ? c.g.label : etendue === 'revendication' ? `${c.g.label} · ${c.r.label}` : `${c.g.label} · ${c.r.label} · ${c.f.label}` }); });
  return out;
}
