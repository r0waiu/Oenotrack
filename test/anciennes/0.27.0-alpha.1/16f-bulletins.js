/* ============ BULLETINS D'ANALYSES (0.27.0-alpha.1) : lecture automatique, complétée par l'IA si elle est configurée ============
   Sources : PDF (texte positionné de pdf.js), scans et photos (reconnaissance de caractères), tableurs et CSV (lignes et colonnes),
   texte. Le script reconnaît :
   - les paramètres (catalogue de libellés de laboratoire → paramètres de la cave, nouveaux paramètres proposés), valeurs et unités
     (acidités exprimées en acide tartrique ou acétique, ou en méq/L → g/L H₂SO₄ ; densité en g/L → g/mL ; « < 0,1 » gardé avec une note) ;
   - les échantillons : codes des lots et noms des contenants cités dans le bulletin (rapprochés sur cet appareil, jamais envoyés à l'IA),
     en liste (un bloc par échantillon), en tableau (une colonne par échantillon) ou en export de laboratoire (une ligne par échantillon) ;
   - la date de prélèvement (sinon de réception, d'analyse, d'édition), le laboratoire et le n° du bulletin.
   L'IA (si configurée, réglage « bulletins ») reçoit le texte du bulletin et la liste des paramètres de la cave ; elle complète ce que le
   script n'a pas trouvé. Tout est vérifié par l'utilisateur avant l'enregistrement (onglet Analyses). */
const BULLETIN_CATALOGUE = [
  { cle: 'tap', nom: 'TAP', unite: '% vol.', dec: 1, motifs: [/\btap\b/, /titre alcoometrique (?:volumique )?potentiel/, /alcool (?:probable|potentiel)/, /degre (?:probable|potentiel)/] },
  { cle: 'tav', nom: 'TAV acquis', unite: '% vol.', dec: 2, motifs: [/\btava?\b/, /titre alcoometrique/, /alcool (?:acquis|reel)/, /degre alcoolique/, /^alcool\b/] },
  { cle: 'sucres', nom: 'Sucres (glucose + fructose)', unite: 'g/L', dec: 1, motifs: [/glucose ?\+? ?fructose/, /sucres? (?:residuels?|reducteurs?|fermentescibles|totaux)/, /^sucres?\b/] },
  { cle: 'av', nom: 'Acidité volatile', unite: 'g/L H₂SO₄', dec: 2, motifs: [/acidite volatile/, /^av\b/] },
  { cle: 'at', nom: 'AT', unite: 'g/L H₂SO₄', dec: 2, motifs: [/acidite (?:totale|titrable)/, /^at\b/] },
  { cle: 'ph', nom: 'pH', unite: '', dec: 2, motifs: [/^ph\b/, /\bph\b/] },
  { cle: 'so2l', nom: 'SO₂ libre', unite: 'mg/L', dec: 0, motifs: [/so2 ?libre/, /(?:anhydride|dioxyde de) ?(?:soufre|sulfureux) libre/, /sulfureux libre/, /\bso2 ?l\b/] },
  { cle: 'so2t', nom: 'SO₂ total', unite: 'mg/L', dec: 0, motifs: [/so2 ?total/, /(?:anhydride|dioxyde de) ?(?:soufre|sulfureux) total/, /sulfureux total/, /\bso2 ?t\b/] },
  { cle: 'azote', nom: 'Azote assimilable', unite: 'mg/L', dec: 0, motifs: [/azote (?:assimilable|facilement assimilable)/, /\bapa\b/, /\byan\b/] },
  { cle: 'malique', nom: 'Acide malique', unite: 'g/L', dec: 2, motifs: [/acide l? ?malique/, /^malique\b/] },
  { cle: 'lactique', nom: 'Acide lactique', unite: 'g/L', dec: 2, motifs: [/acide l? ?lactique/, /^lactique\b/] },
  { cle: 'tartrique', nom: 'Acide tartrique', unite: 'g/L', dec: 2, motifs: [/^acide tartrique/] },
  { cle: 'potassium', nom: 'Potassium', unite: 'mg/L', dec: 0, motifs: [/\bpotassium\b/] },
  { cle: 'calcium', nom: 'Calcium', unite: 'mg/L', dec: 0, motifs: [/\bcalcium\b/] },
  { cle: 'fer', nom: 'Fer', unite: 'mg/L', dec: 1, motifs: [/^fer\b/] },
  { cle: 'cuivre', nom: 'Cuivre', unite: 'mg/L', dec: 2, motifs: [/^cuivre\b/] },
  { cle: 'turbidite', nom: 'Turbidité', unite: 'NTU', dec: 0, motifs: [/turbidite/] },
  { cle: 'co2', nom: 'CO₂', unite: 'mg/L', dec: 0, motifs: [/^co2\b/, /gaz carbonique/, /dioxyde de carbone/] },
  { cle: 'densite', nom: 'Densité', unite: '', dec: 4, motifs: [/^densite\b/, /^masse volumique/] },
  { cle: 'glycerol', nom: 'Glycérol', unite: 'g/L', dec: 1, motifs: [/glycerol/] },
  { cle: 'ethanal', nom: 'Éthanal', unite: 'mg/L', dec: 0, motifs: [/^ethanal/, /acetaldehyde/] },
  { cle: 'ipt', nom: 'IPT', unite: '', dec: 0, motifs: [/\bipt\b/, /indice (?:de )?polyphenols/, /indice de folin/] },
];
// texte comparable : minuscules, sans accents, indices et exposants ramenés aux chiffres, ponctuation → espaces
const bulNorm = (s) => norm(String(s || '').replace(/[₀-₉]/g, (c) => String(c.charCodeAt(0) - 0x2080)).replace(/[⁰¹²³⁴-⁹]/g, (c) => ({ '⁰': '0', '¹': '1', '²': '2', '³': '3' }[c] || String(c.charCodeAt(0) - 0x2070))))
  .replace(/\bn\s*[°º]\s*/g, ' ').replace(/[°º]/g, ' ').replace(/[^a-z0-9+]+/g, ' ').replace(/\b0+(\d)/g, '$1').replace(/\s+/g, ' ').trim(); // « Cuve 03 » = « cuve 3 »
// paramètre de la cave désigné par un libellé : catalogue (identifiant d'origine ou nom), puis nom exact d'un paramètre ajouté
function bulletinParam(db, label) {
  const t = bulNorm(label); if (!t || t.length > 90) return null;
  const P = db.analysesParams || [];
  for (const c of BULLETIN_CATALOGUE) {
    if (!c.motifs.some((re) => re.test(t))) continue;
    const p = P.find((x) => x.id === c.cle) || P.find((x) => bulNorm(x.nom) === bulNorm(c.nom)) || P.find((x) => c.motifs.some((re) => re.test(bulNorm(x.nom))));
    return p ? { paramId: p.id, cat: c } : { cat: c, nouveau: true };
  }
  const p = P.find((x) => { const n = bulNorm(x.nom); return n.length >= 3 && (t === n || t.startsWith(`${n} `)); });
  return p ? { paramId: p.id, cat: null } : null;
}
// nombre écrit dans une case : « 3,45 », « < 0,1 », « 1 234,5 », « 0.99255 »
function bulletinNombre(s0) {
  const s = String(s0 == null ? '' : s0).trim().replace(/[  ]/g, ' ');
  const m = /^([<>≤≥]=?)?\s*([-+]?\d{1,7}(?: \d{3})*(?:[.,]\d+)?)(?:\s*[±]\s*\d+(?:[.,]\d+)?)?$/.exec(s); if (!m) return null;
  const v = parseFloat(m[2].replace(/ /g, '').replace(',', '.')); if (!Number.isFinite(v)) return null;
  return { v, op: m[1] ? m[1].replace('≤', '<').replace('≥', '>').replace('=', '') : '' };
}
// valeur dans l'unité du paramètre de la cave (acidités, densité, sucres, SO₂)
function bulletinConvertir(v, uniteTexte, unitePar, nomPar) {
  const u = bulNorm(uniteTexte); const up = bulNorm(unitePar);
  if (/h2so4/.test(up)) { if (/meq/.test(u)) return v * 0.049; if (/tartrique|h2t\b/.test(u)) return v / 1.531; if (/acetique/.test(u)) return v * 0.8167; }
  if (/densite|masse volumique/.test(bulNorm(nomPar)) && v > 100 && v < 2000) return v / 1000;
  if (/^g l$/.test(up) && /\bmg l\b/.test(u)) return v / 1000;
  if (/^mg l$/.test(up) && /\bg l\b/.test(u) && !/\bmg l\b/.test(u) && v < 5) return v * 1000;
  return v;
}

/* ---------- lignes du bulletin : cases (texte, position) ---------- */
// pages pdf.js ou reconnaissance de caractères → lignes de cases (mots proches réunis)
function bulletinLignesDePages(pages) {
  const out = [];
  (pages || []).forEach((p) => {
    const mots = jaugeMots(p); const hm = mediane(mots.map((m) => m.h)) || 8;
    jaugeLignes(mots).forEach((lg) => {
      const cells = []; let cur = null;
      lg.mots.forEach((m) => { if (cur && m.x - cur.x2 <= hm * 1.2) { cur.s += ` ${m.s}`; cur.x2 = m.x + m.w; } else { cur = { s: m.s, x: m.x, x2: m.x + m.w }; cells.push(cur); } });
      cells.forEach((c) => { c.xc = (c.x + c.x2) / 2; });
      if (cells.length) out.push({ cells, texte: cells.map((c) => c.s).join('   '), page: p.n || 1 });
    });
  });
  return out;
}
// texte (bulletin en texte, export) : cases séparées par tabulation, point-virgule ou plusieurs espaces
function bulletinLignesDeTexte(t) {
  return String(t || '').replace(/\r/g, '').split('\n').map((l) => {
    const parts = l.includes('\t') ? l.split('\t') : (l.match(/;/g) || []).length >= 1 ? l.split(';') : l.split(/\s{2,}/);
    const cells = parts.map((s, i) => ({ s: s.trim().replace(/^"(.*)"$/, '$1'), x: i, x2: i, xc: i })).filter((c) => c.s);
    return { cells, texte: cells.map((c) => c.s).join('   ') };
  }).filter((l) => l.cells.length);
}
// tableau (tableur) : lignes de cases
const bulletinLignesDeTableau = (rows) => (rows || []).map((r) => { const cells = (Array.isArray(r) ? r : []).map((s, i) => ({ s: String(s == null ? '' : s).trim(), x: i, x2: i, xc: i })).filter((c) => c.s); return { cells, texte: cells.map((c) => c.s).join('   ') }; }).filter((l) => l.cells.length);

/* ---------- échantillons : lots et contenants cités ---------- */
function bulletinCandidats(db, R) {
  const C = []; const cle = (s) => { const t = bulNorm(s); return t ? [t, t.replace(/ /g, '')] : []; };
  Object.values((R && R.lots) || {}).forEach((l) => { if (l && l.code && String(l.code).length >= 2) C.push({ kind: 'lot', id: l.id, nom: l.code, cles: cle(l.code) }); });
  // contenant au nom fait d'un seul nombre (« 12 ») : cherché seulement sous la forme « cuve 12 » (sinon tout « 12 » du bulletin le désignerait)
  (db.contenants || []).forEach((c) => { if (c && c.nom) { let k = cle(c.nom); if (/^\d+$/.test(k[0] || '')) k = [`cuve ${k[0]}`, `cuve${k[0]}`]; C.push({ kind: 'cont', id: c.id, nom: c.nom, cles: k }); } });
  return C.filter((c) => c.cles.length && c.cles[0].length >= 2);
}
// lots et contenants cités dans un texte (mot entier, ou suite de mots collés : « M26-02-C », « Cuve 12 »)
function bulletinTrouver(texte, cands) {
  const t = bulNorm(texte); if (!t) return []; const toks = t.split(' '); const pad = ` ${t} `; const out = [];
  cands.forEach((c) => {
    let ok = pad.includes(` ${c.cles[0]} `);
    if (!ok && c.cles[1]) for (let i = 0; i < toks.length && !ok; i += 1) { let s = ''; for (let j = i; j < Math.min(toks.length, i + 5); j += 1) { s += toks[j]; if (s === c.cles[1]) { ok = true; break; } if (s.length >= c.cles[1].length) break; } }
    if (ok) out.push({ ...c, long: c.cles[0].length });
  });
  // le plus précis d'abord ; un nom contenu dans un autre trouvé (« C1 » dans « C12 ») est écarté
  out.sort((a, b) => b.long - a.long);
  return out.filter((c, i) => !out.slice(0, i).some((d) => d.kind === c.kind && d.cles[0].includes(c.cles[0]) && d.cles[0] !== c.cles[0]));
}

/* ---------- dates, laboratoire, n° ---------- */
const BUL_MOIS = { janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12 };
function bulletinDates(texte) {
  const t = norm(String(texte || '')); const out = []; const re = /(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})|(\d{4})-(\d{2})-(\d{2})|(\d{1,2})(?:er)? (janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre) (\d{4})/g; let m;
  while ((m = re.exec(t))) {
    let d, mo, y; if (m[1]) { d = +m[1]; mo = +m[2]; y = +m[3]; if (y < 100) y += 2000; } else if (m[4]) { y = +m[4]; mo = +m[5]; d = +m[6]; } else { d = +m[7]; mo = BUL_MOIS[m[8]]; y = +m[9]; }
    const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`; if (isoOK(iso) && y >= 2000 && y <= 2100) out.push({ iso, i: m.index, avant: t.slice(Math.max(0, m.index - 48), m.index) });
  }
  return out;
}
const bulletinDateRole = (avant) => { const a = bulNorm(avant); return /prel[e]?v|preleve/.test(a) ? 1 : /recu|recept|arrivee/.test(a) ? 2 : /analys|debut|fin d analyse/.test(a) ? 3 : /edit|rapport|bulletin|emis|imprime|date/.test(a) ? 4 : 5; };
function bulletinDate(texte) { const D = bulletinDates(texte); if (!D.length) return ''; return D.map((d) => ({ ...d, r: bulletinDateRole(d.avant) })).sort((a, b) => a.r - b.r || a.i - b.i)[0].iso; }
function bulletinEntete(texte) {
  const T = String(texte || ''); const L = T.split('\n').map((x) => x.trim()).filter(Boolean);
  const labo = (L.find((x) => /laboratoire|labo\b|oenolog|œnolog|analyses? (?:oenolog|œnolog)/i.test(x) && x.length <= 90) || '').replace(/\s{2,}.*/, '').slice(0, 80);
  const m = /(?:bulletin|rapport|certificat|dossier)(?:\s+d['’]analyses?)?\s*(?:n[°º]|no|num[ée]ro)\s*[:.]?\s*([A-Z0-9][A-Z0-9/._-]{2,30})/i.exec(T);
  return { labo, numero: m ? m[1] : '' };
}

/* ---------- analyse du bulletin ---------- */
const BUL_ENTETE_ECH = /\b(?:echantillon|echant|ref(?:erence)?s?(?: client)?|votre ref|vos ref|identification|designation|cuve|lot|contenant|prelevement)\b/;
// valeur d'une ligne « libellé … valeur unité » (cases) ou d'un texte suivi
function bulletinValeurLigne(db, cells) {
  let k = -1; let lab = ''; let P = null;
  for (let i = 0; i < Math.min(cells.length, 3); i += 1) { if (bulletinNombre(cells[i].s)) break; lab = lab ? `${lab} ${cells[i].s}` : cells[i].s; const p = bulletinParam(db, lab); if (p) { k = i; P = p; } }
  if (!P) { // libellé et valeur dans la même case (texte suivi, reconnaissance de caractères)
    const c0 = cells[0] ? cells[0].s : ''; const toks = c0.split(/\s+/); let lab2 = '';
    for (let i = 0; i < toks.length; i += 1) {
      const n = bulletinNombre(toks[i]); const n2 = !n && /^[<>≤≥]=?$/.test(toks[i]) ? bulletinNombre(`${toks[i]}${toks[i + 1] || ''}`) : null;
      if ((n || n2) && lab2 && !/^(?:a|à)$/i.test(toks[i - 1] || '') && !/^°/.test(toks[i + 1] || '')) { const p = bulletinParam(db, lab2); if (p) return { ...p, ...(n || n2), label: lab2.trim(), unite: toks.slice(i + (n2 ? 2 : 1), i + 4).join(' ') + ' ' + lab2 }; break; }
      lab2 += ` ${toks[i]}`;
    }
    return null;
  }
  for (let j = k + 1; j < cells.length; j += 1) {
    if (/^(?:a|à)\s*\d/.test(cells[j].s) || /°\s*c$/i.test(cells[j].s)) continue;
    const n = bulletinNombre(cells[j].s); if (n) return { ...P, ...n, label: lab, unite: `${cells.slice(k + 1, j).map((c) => c.s).join(' ')} ${cells.slice(j + 1, j + 3).map((c) => c.s).join(' ')} ${lab}`, x: cells[j].xc };
  }
  return null;
}
// valeurs d'une ligne de tableau (une colonne par échantillon)
function bulletinValeursColonnes(db, cells, cols) {
  let k = -1; let lab = ''; let P = null;
  for (let i = 0; i < Math.min(cells.length, 3); i += 1) { if (bulletinNombre(cells[i].s)) break; lab = lab ? `${lab} ${cells[i].s}` : cells[i].s; const p = bulletinParam(db, lab); if (p) { k = i; P = p; } }
  if (!P) return null; const out = [];
  cells.slice(k + 1).forEach((c) => { const n = bulletinNombre(c.s); if (!n) return; let best = null; let d = Infinity; cols.forEach((col, ci) => { const dd = Math.abs(col.xc - c.xc); if (dd < d) { d = dd; best = ci; } }); if (best != null && !out.some((o) => o.col === best)) out.push({ col: best, ...n }); });
  const unite = `${cells.slice(k + 1).filter((c) => !bulletinNombre(c.s)).map((c) => c.s).join(' ')} ${lab}`;
  return { ...P, label: lab, unite, valeurs: out };
}
// lignes → { labo, numero, date, echantillons: [{ ref, lot/cont trouvés, date, valeurs: { paramId: { v, op, label } }, nouveaux: { cle: { … } } }] }
function bulletinAnalyser(db, R, lignes, opts) {
  const o = opts || {}; const cands = o.candidats || bulletinCandidats(db, R); const texte = lignes.map((l) => l.texte).join('\n');
  const ent = bulletinEntete(texte); const dateG = bulletinDate(texte);
  const E = []; let cur = null; let cols = null;
  const nouvel = (ref, trouve, extra) => { cur = { ref: String(ref || '').trim().slice(0, 120), trouve: trouve || null, date: '', valeurs: {}, nouveaux: {}, notes: [], lignes: [], ...(extra || {}) }; E.push(cur); return cur; };
  const ajouter = (e, r) => {
    if (!e || !r) return; const v0 = r.v; const par = r.paramId ? (db.analysesParams || []).find((p) => p.id === r.paramId) || {} : r.cat; const unitePar = par.unite;
    const v = Math.round(bulletinConvertir(v0, r.unite || '', unitePar || '', par.nom) * 1e5) / 1e5;
    if (r.paramId) { if (e.valeurs[r.paramId] == null) e.valeurs[r.paramId] = { v, op: r.op, label: r.label, src: 'script' }; }
    else if (r.cat && !e.nouveaux[r.cat.cle]) e.nouveaux[r.cat.cle] = { cle: r.cat.cle, nom: r.cat.nom, unite: r.cat.unite, dec: r.cat.dec, v: Math.round(bulletinConvertir(v0, r.unite || '', r.cat.unite, r.cat.nom) * 1e5) / 1e5, op: r.op, label: r.label, src: 'script' };
  };
  // export en lignes (une ligne par échantillon, une colonne par paramètre)
  const hdr = lignes.findIndex((l) => l.cells.filter((c) => bulletinParam(db, c.s)).length >= 2 && !l.cells.some((c) => bulletinNombre(c.s)));
  if (hdr >= 0 && lignes.slice(hdr + 1).some((l) => l.cells.filter((c) => bulletinNombre(c.s)).length >= 2)) {
    const H = lignes[hdr].cells.map((c) => ({ ...c, p: bulletinParam(db, c.s) }));
    const tab = lignes.slice(hdr + 1).filter((l) => l.cells.filter((c) => bulletinNombre(c.s)).length >= 1);
    if (tab.length && tab.every((l) => l.cells.length <= H.length + 2)) {
      tab.forEach((l) => {
        const idc = l.cells.filter((c) => { const h = H.reduce((b, x) => (Math.abs(x.xc - c.xc) < Math.abs(b.xc - c.xc) ? x : b), H[0]); return !h.p || !bulletinNombre(c.s); });
        const ref = idc.map((c) => c.s).join(' · '); const tr = bulletinTrouver(ref, cands); const e = nouvel(ref || `Échantillon ${E.length + 1}`, tr[0] || null);
        const dd = bulletinDates(ref); if (dd.length) e.date = dd[0].iso;
        l.cells.forEach((c) => { const n = bulletinNombre(c.s); if (!n) return; const h = H.reduce((b, x) => (Math.abs(x.xc - c.xc) < Math.abs(b.xc - c.xc) ? x : b), H[0]); if (h && h.p) ajouter(e, { ...h.p, ...n, label: h.s, unite: h.s }); });
      });
      return { ...ent, date: dateG, format: 'lignes', echantillons: E.filter((e) => Object.keys(e.valeurs).length || Object.keys(e.nouveaux).length) };
    }
  }
  lignes.forEach((l) => {
    const tr = bulletinTrouver(l.texte, cands); const nNum = l.cells.filter((c) => bulletinNombre(c.s)).length;
    // en-tête de tableau : plusieurs échantillons, une colonne chacun
    if (tr.length >= 2 && nNum === 0 && l.cells.length >= 2) {
      const cs = l.cells.map((c) => ({ c, t: bulletinTrouver(c.s, cands)[0] })).filter((x) => x.t);
      if (cs.length >= 2) { cols = cs.map((x) => ({ xc: x.c.xc, e: nouvel(x.c.s, x.t) })); return; }
    }
    if (cols) { const r = bulletinValeursColonnes(db, l.cells, cols); if (r && r.valeurs.length) { r.valeurs.forEach((x) => ajouter(cols[x.col].e, { ...r, ...x })); return; } }
    const r = bulletinValeurLigne(db, l.cells);
    if (r) { if (!cur) nouvel(o.refDefaut || 'Échantillon', null); ajouter(cur, r); cur.lignes.push(l.texte); return; }
    const n = bulNorm(l.texte);
    if (tr.length) { if (!cur || cur.trouve || Object.keys(cur.valeurs).length || Object.keys(cur.nouveaux).length) nouvel(l.texte, tr[0]); else { cur.trouve = tr[0]; cur.ref = `${cur.ref} · ${l.texte}`.slice(0, 120); } cols = null; }
    else if (BUL_ENTETE_ECH.test(n) && /[:]\s*\S/.test(l.texte) && n.length < 90 && (!cur || Object.keys(cur.valeurs).length || Object.keys(cur.nouveaux).length)) { nouvel(l.texte.split(/:\s*/).slice(1).join(': ') || l.texte, null); cols = null; }
    const dd = bulletinDates(l.texte); if (cur && dd.length && /prel/.test(n)) cur.date = dd[0].iso;
  });
  return { ...ent, date: dateG, format: cols ? 'tableau' : 'liste', echantillons: E.filter((e) => Object.keys(e.valeurs).length || Object.keys(e.nouveaux).length) };
}

/* ---------- IA : lecture du bulletin (texte + paramètres de la cave, sans les lots ni les cuves) ---------- */
function iaPromptBulletin(db, texte, ocr) {
  const system = 'Tu lis des bulletins d’analyses œnologiques de laboratoire pour une cave. Tu ne reprends que ce qui est écrit, sans rien inventer ni calculer d’autre que les conversions d’unités demandées. Tu réponds uniquement par un objet JSON valide.';
  const P = (db.analysesParams || []).map((p) => `- ${p.id} : ${p.nom}${p.unite ? ` (${p.unite})` : ''}`).join('\n');
  const t = `Paramètres d’analyse de la cave (identifiant : nom (unité attendue)) :\n${P}\n\nBulletin d’analyses${ocr ? ' (texte reconnu sur un scan ou une photo : il peut contenir des erreurs de lecture)' : ''} :\n"""\n${String(texte || '').slice(0, 15000)}\n"""\n\n`
    + 'Réponds par un objet JSON de la forme : {"laboratoire": "<nom ou null>", "numero": "<n° du bulletin ou null>", "echantillons": [{"reference": "<référence de l’échantillon telle qu’écrite : cuve, lot, désignation, n° d’échantillon>", "date_prelevement": "<AAAA-MM-JJ ou null>", "resultats": {"<identifiant du paramètre>": <nombre dans l’unité attendue>}, "autres": [{"nom": "<paramètre absent de la liste>", "valeur": <nombre>, "unite": "<unité>"}]}]}.\n'
    + 'Acidités exprimées en acide tartrique → g/L H₂SO₄ : diviser par 1,531 ; en acide acétique → × 0,817. Valeur écrite « < x » : x. Un échantillon par référence ; seulement les résultats présents dans le bulletin.';
  return { system, texte: t, max: 3000 };
}
function iaLireBulletin(db, o) {
  if (!o || typeof o !== 'object') return null; const ids = new Set((db.analysesParams || []).map((p) => p.id)); const nb = (v) => { const n = typeof v === 'number' ? { v } : bulletinNombre(v); return n && Number.isFinite(n.v) ? n : null; };
  const E = (Array.isArray(o.echantillons) ? o.echantillons : []).slice(0, 60).map((e) => {
    if (!e || typeof e !== 'object') return null; const valeurs = {}; const nouveaux = {};
    Object.keys(e.resultats && typeof e.resultats === 'object' ? e.resultats : {}).forEach((k) => { const n = nb(e.resultats[k]); if (n && ids.has(k)) valeurs[k] = { v: n.v, op: n.op || '', label: k, src: 'ia' }; });
    (Array.isArray(e.autres) ? e.autres : []).slice(0, 30).forEach((x) => { if (!x || typeof x !== 'object') return; const n = nb(x.valeur); const lab = iaTexte(x.nom, 80); if (!n || !lab) return; const p = bulletinParam(db, lab);
      if (p && p.paramId) { const par = (db.analysesParams || []).find((y) => y.id === p.paramId) || {}; if (!valeurs[p.paramId]) valeurs[p.paramId] = { v: Math.round(bulletinConvertir(n.v, x.unite || '', par.unite || '', par.nom) * 1e5) / 1e5, op: n.op || '', label: lab, src: 'ia' }; }
      else if (p && p.cat && !nouveaux[p.cat.cle]) nouveaux[p.cat.cle] = { cle: p.cat.cle, nom: p.cat.nom, unite: p.cat.unite, dec: p.cat.dec, v: Math.round(bulletinConvertir(n.v, x.unite || '', p.cat.unite, p.cat.nom) * 1e5) / 1e5, op: n.op || '', label: lab, src: 'ia' }; });
    const d = iaDateDe(e.date_prelevement);
    return { ref: iaTexte(e.reference, 120) || 'Échantillon', date: isoOK(d) ? d : '', valeurs, nouveaux, notes: [], lignes: [] };
  }).filter((e) => e && (Object.keys(e.valeurs).length || Object.keys(e.nouveaux).length));
  return { labo: iaTexte(o.laboratoire, 80), numero: iaTexte(o.numero, 40), echantillons: E };
}
// script d'abord ; l'IA complète (échantillons rapprochés par le lot ou le contenant trouvé, sinon par la référence)
function bulletinFusion(db, R, script, ia, cands0) {
  if (!ia) return script; const cands = cands0 || bulletinCandidats(db, R); const S = { ...script, echantillons: script.echantillons.map((e) => ({ ...e, valeurs: { ...e.valeurs }, nouveaux: { ...e.nouveaux } })) };
  if (!S.labo && ia.labo) S.labo = ia.labo; if (!S.numero && ia.numero) S.numero = ia.numero;
  ia.echantillons.forEach((x) => {
    const tr = bulletinTrouver(x.ref, cands)[0] || null; const nr = bulNorm(x.ref);
    const e = S.echantillons.find((y) => (tr && y.trouve && y.trouve.kind === tr.kind && y.trouve.id === tr.id) || (nr && bulNorm(y.ref) === nr)) || (S.echantillons.length === 1 && ia.echantillons.length === 1 ? S.echantillons[0] : null);
    if (!e) { S.echantillons.push({ ...x, trouve: tr, src: 'ia' }); return; }
    if (!e.trouve && tr) e.trouve = tr; if (!e.date && x.date) e.date = x.date;
    Object.keys(x.valeurs).forEach((k) => { if (!e.valeurs[k]) e.valeurs[k] = x.valeurs[k]; else if (Math.abs(e.valeurs[k].v - x.valeurs[k].v) > 1e-6) e.valeurs[k] = { ...e.valeurs[k], ia: x.valeurs[k].v }; });
    Object.keys(x.nouveaux).forEach((k) => { if (!e.nouveaux[k] && !Object.keys(e.valeurs).some((p) => p === k)) e.nouveaux[k] = x.nouveaux[k]; });
  });
  return S;
}

/* ---------- plan d'enregistrement : lot et contenant d'après ce qui a été trouvé ---------- */
function bulletinRattacher(db, getRd, e, dateDefaut) {
  const date = e.date || dateDefaut || todayISO(); const Rd = getRd(date); const t = e.trouve;
  let lotId = ''; let contenantId = ''; let doute = '';
  if (t && t.kind === 'lot') { lotId = t.id; const cs = uniq(Object.values(Rd.portions || {}).filter((p) => p.lotId === t.id && p.vol > 0.0001).map((p) => p.contenantId)); if (cs.length === 1) contenantId = cs[0]; }
  else if (t && t.kind === 'cont') { contenantId = t.id; const ps = Object.values(Rd.portions || {}).filter((p) => p.contenantId === t.id && p.vol > 0.0001).sort((a, b) => b.vol - a.vol); if (ps.length) lotId = ps[0].lotId; if (ps.length > 1) doute = 'plusieurs lots dans ce contenant : vérifiez le lot'; else if (!ps.length) doute = 'contenant vide à cette date : choisissez le lot'; }
  else doute = 'échantillon non reconnu : choisissez le lot';
  return { date, lotId, contenantId, doute };
}
// modèle de fiche le plus proche des paramètres mesurés (au moins la moitié de ses paramètres)
function bulletinModele(db, ids) { let best = ''; let sc = 0; (db.analysesModeles || []).forEach((m) => { const n = (m.paramIds || []).filter((p) => ids.includes(p)).length; const s = n / Math.max(1, (m.paramIds || []).length); if (n >= 2 && s >= 0.5 && (s > sc || (s === sc && n > 0))) { best = m.id; sc = s; } }); return best; }
// enregistrement : nouveaux paramètres, analyses, bulletin joint (une fiche de document pour toutes ses analyses)
// plan : { doc: { id, nom, mime, taille, garde }, labo, numero, params: [{ cle, nom, unite, dec }], analyses: [{ date, lotId, contenantId, modeleId, valeurs: { paramId ou « +cle » : nombre }, notes }] }
function bulletinEnregistrer(db, plan) {
  const A = (plan && plan.analyses) || []; if (!A.length) return fail('Aucune analyse à enregistrer.');
  for (const a of A) {
    if (!a.lotId) return fail(`Rattachez chaque analyse à un lot (${a.ref || 'échantillon'}).`); if (!isoOK(a.date)) return fail('Date de prélèvement invalide.');
    if (isLocked(db, a.date)) return fail(`La date du ${fmtDate(a.date)} appartient à une campagne figée.`);
    if (!Object.keys(a.valeurs || {}).some((k) => hasNum(a.valeurs[k]))) return fail(`Aucune valeur cochée pour ${a.ref || 'un échantillon'}.`);
  }
  const ids = {}; // nouveaux paramètres : repris s'ils existent déjà sous ce nom
  (plan.params || []).forEach((p) => { const ex = (db.analysesParams || []).find((x) => bulNorm(x.nom) === bulNorm(p.nom)); if (ex) { ids[p.cle] = ex.id; return; } const id = nid(db, 'pa'); db.analysesParams.push({ id, nom: String(p.nom).slice(0, 60), unite: String(p.unite || '').slice(0, 30), dec: clamp(parseInt(p.dec, 10) || 0, 0, 6) }); ids[p.cle] = id; });
  const faits = [];
  A.forEach((a) => {
    const valeurs = {}; Object.keys(a.valeurs).forEach((k) => { if (!hasNum(a.valeurs[k])) return; const id = k.startsWith('+') ? ids[k.slice(1)] : k; if (id && (db.analysesParams || []).some((p) => p.id === id)) valeurs[id] = num(a.valeurs[k]); });
    if (!Object.keys(valeurs).length) return;
    const id = nid(db, 'an'); db.analyses.push({ id, date: a.date, lotId: a.lotId, contenantId: a.contenantId || '', modeleId: a.modeleId || '', valeurs, notes: String(a.notes || '').slice(0, 600), ...(plan.doc ? { bulletinDocId: plan.doc.id } : {}), source: a.ia ? 'bulletin-ia' : 'bulletin' }); faits.push(id);
  });
  if (!faits.length) return fail('Aucune valeur à enregistrer.');
  if (plan.doc && plan.doc.id && !(db.docs || []).some((d) => d.id === plan.doc.id)) docMetaAdd(db, { id: plan.doc.id, nom: plan.doc.nom, mime: plan.doc.mime, taille: plan.doc.taille, cat: 'analyse', cible: { type: 'bulletin', id: plan.doc.id }, garde: plan.doc.garde, analyseIds: faits });
  return okr({ n: faits.length, ids: faits, params: Object.keys(ids).length });
}
// bulletin d'une analyse (fiche du document)
const analyseBulletin = (db, a) => (a ? (db.docs || []).find((d) => d && ((a.bulletinDocId && d.id === a.bulletinDocId) || (Array.isArray(d.analyseIds) && d.analyseIds.includes(a.id)))) || null : null);
