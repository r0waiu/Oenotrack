/* ============ BULLETINS D'ANALYSES (0.27.0-alpha.1) : lecture automatique, complétée par l'IA si elle est configurée ============
   Sources : PDF (texte positionné de pdf.js), scans et photos (reconnaissance de caractères), tableurs et CSV (lignes et colonnes),
   texte. Le script reconnaît :
   - les paramètres (catalogue de libellés de laboratoire → paramètres de la cave, nouveaux paramètres proposés), valeurs et unités
     (acidités exprimées en acide tartrique ou acétique, ou en méq/L → g/L H₂SO₄ ; densité en g/L → g/mL ; « < 0,1 » gardé avec une note) ;
   - les échantillons : codes des lots et noms des contenants cités dans le bulletin (rapprochés sur cet appareil, jamais envoyés à l'IA),
     en liste (un bloc par échantillon), en tableau (une colonne par échantillon) ou en export de laboratoire (une ligne par échantillon) ;
   - la date de prélèvement (sinon de réception, d'analyse, d'édition), le laboratoire et le n° du bulletin.
   L'IA (si configurée, réglage « bulletins ») reçoit le texte du bulletin et la liste des paramètres de la cave ; elle complète ce que le
   script n'a pas trouvé. Tout est vérifié par l'utilisateur avant l'enregistrement (onglet Analyses).
   0.37.0-alpha.1 : rapports à plusieurs échantillons (une ligne par échantillon, en-tête de colonnes sur plusieurs lignes, n° d'échantillon
   du laboratoire et référence du client, valeurs « x / incertitude » : bulletinColonnes), exports en format long (bulletinFormatLong),
   n° d'échantillon (e.numero) jusque dans l'IA ; entrée de moûts : rapprochement noté (e.sur) et affectation guidée (bulletinAffectationDouteuse).
   0.40.0-alpha.2 : paramètres répartis sur plusieurs tableaux et plusieurs pages (un en-tête par tableau, morceaux d'un même échantillon réunis
   par n° de laboratoire : bulletinColonnesReunir), azote ammoniacal et alpha-aminé, chaptalisation calculée, renvois « (**) » après une valeur. */
const BULLETIN_CATALOGUE = [
  { cle: 'tap', nom: 'TAP', unite: '% vol.', dec: 1, motifs: [/\btap\b/, /\btavn\b/, /titre alcoometrique (?:volumique )?(?:potentiel|naturel)/, /alcool (?:probable|potentiel)/, /degre (?:probable|potentiel)/] },
  { cle: 'tav', nom: 'TAV acquis', unite: '% vol.', dec: 2, motifs: [/\btava?\b/, /titre alcoometrique/, /alcool (?:acquis|reel)/, /degre alcoolique/, /^alcool\b/] },
  { cle: 'sucres', nom: 'Sucres (glucose + fructose)', unite: 'g/L', dec: 1, motifs: [/glucose ?\+? ?fructose/, /sucres? ?(?:residuels?|reducteurs?|fermentescibles|totaux)/, /^sucres?\b/] },
  { cle: 'saccharose', nom: 'Saccharose', unite: 'g/L', dec: 1, motifs: [/^saccharose\b/, /\bsucrose\b/] },
  { cle: 'av', nom: 'Acidité volatile', unite: 'g/L H₂SO₄', dec: 2, motifs: [/acidite volatile/, /^av\b/, /^acide acetique\b/] },
  { cle: 'at', nom: 'AT', unite: 'g/L H₂SO₄', dec: 2, motifs: [/acidite (?:totale|titrable)/, /^at\b/] },
  { cle: 'ph', nom: 'pH', unite: '', dec: 2, motifs: [/^ph\b/, /\bph\b/] },
  { cle: 'so2l', nom: 'SO₂ libre', unite: 'mg/L', dec: 0, motifs: [/so2 ?libre/, /^so2l\b/, /(?:anhydride|dioxyde de) ?(?:soufre|sulfureux) libre/, /sulfureux libre/, /\bso2 ?l\b/] },
  { cle: 'so2t', nom: 'SO₂ total', unite: 'mg/L', dec: 0, motifs: [/so2 ?total/, /^so2t\b/, /(?:anhydride|dioxyde de) ?(?:soufre|sulfureux) total/, /sulfureux total/, /\bso2 ?t\b/] },
  { cle: 'azote', nom: 'Azote assimilable', unite: 'mg/L', dec: 0, motifs: [/azote (?:assimilable|facilement assimilable)/, /\bapa\b/, /\byan\b/] },
  // 0.40.0-alpha.2 : formes de l'azote et sucre à ajouter calculé par le laboratoire (rapports de moûts)
  { cle: 'azoteAmmoniacal', nom: 'Azote ammoniacal', unite: 'mg/L', dec: 0, motifs: [/azote ammoniacal/, /\bammonium\b/, /\bnh4\b/] },
  { cle: 'azoteAmine', nom: 'Azote alpha-aminé', unite: 'mg/L', dec: 0, motifs: [/azote (?:alpha )?amine/, /\bnopa\b/] },
  { cle: 'chaptalisation', nom: 'Chaptalisation (calcul du laboratoire)', unite: 'kg/hL', dec: 3, motifs: [/^chaptalisation\b/] },
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
  // incertitude écrite après la valeur : « 3,25 ± 0,05 », « 3,25 / », « 12,06 / 0,13 » (rapports multi-échantillons, 0.37.0-alpha.1) ;
  // 0.40.0-alpha.2 : « 6,9/ (**) », « 36 (*) » (barre collée, renvoi à une note du laboratoire) — « 12/09 » reste refusé
  const m = /^([<>≤≥]=?)?\s*([-+]?\d{1,7}(?: \d{3})*(?:[.,]\d+)?)(?:\s*[±]\s*\d+(?:[.,]\d+)?|\s+\/(?:\s*\d+(?:[.,]\d+)?\s*%?)?|\/(?:\s+\d+(?:[.,]\d+)?\s*%?)?(?=\s|$))?(?:\s*\(\*{1,3}\)|\s*\*{1,3})?$/.exec(s); if (!m) return null;
  const v = parseFloat(m[2].replace(/ /g, '').replace(',', '.')); if (!Number.isFinite(v)) return null;
  return { v, op: m[1] ? m[1].replace('≤', '<').replace('≥', '>').replace('=', '') : '' };
}
// valeur dans l'unité du paramètre de la cave (acidités, densité, sucres, SO₂)
function bulletinConvertir(v, uniteTexte, unitePar, nomPar) {
  const u = bulNorm(uniteTexte); const up = bulNorm(unitePar);
  // 0.38.0-alpha.3 : valeur déjà en H₂SO₄ (son unité vient avant toute mention de l'acide tartrique, p. ex. « 3,43 g/L H2SO4 5,25 g/L
  // acide tartrique ») : gardée telle quelle — elle était divisée une seconde fois par 1,531
  if (/h2so4/.test(up)) { const ih = u.search(/h2so4/); const it = u.search(/tartrique|h2t\b|\bth2\b|meq|acetique/); if (ih >= 0 && (it < 0 || ih < it)) return v; if (/meq/.test(u)) return v * 0.049; if (/tartrique|h2t\b|\bth2\b/.test(u)) return v / 1.531; if (/acetique/.test(u)) return v * 0.8167; }
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
      // mots et éléments d'origine (une case d'en-tête du PDF) placés : colonnes des rapports à plusieurs échantillons (0.37.0-alpha.1)
      const elems = (p.items || []).filter((it) => it && String(it.s == null ? '' : it.s).trim() && Math.abs(num(it.y) - lg.y) <= hm * 0.45).map((it) => ({ s: String(it.s).trim(), x: num(it.x), w: Math.max(1, num(it.w)), xc: num(it.x) + Math.max(1, num(it.w)) / 2 }));
      if (cells.length) out.push({ cells, texte: cells.map((c) => c.s).join('   '), page: p.n || 1, y: lg.y, h: hm, mots: lg.mots.map((m) => ({ s: m.s, xc: m.x + m.w / 2 })), elems });
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
// laboratoires œnologiques courants (lecture du nom seulement ; tout autre laboratoire est reconnu par le mot « laboratoire »)
const BUL_LABOS = /\b(?:sofralab|oenoalliance|œnoalliance|natoli|dubernet|oenofrance|œnofrance|oenolab|œnolab|excell|inovalys|eurofins|vinlab|oenoconseil|œnoconseil|laboratoire [a-z])/i;
function bulletinEntete(texte) {
  const T = String(texte || ''); const L = T.split('\n').map((x) => x.trim()).filter(Boolean);
  // laboratoire : nom connu, sinon case citant un laboratoire (pas une phrase du rapport : « … autorisation du laboratoire. ») ; forme juridique retirée
  const cases = L.slice(0, 40).flatMap((x) => x.split(/\s{2,}/)).map((x) => x.trim()).filter((x) => x.length >= 3 && x.length <= 90);
  const phrase = (x) => { const n = norm(x).replace(/[^a-z ]/g, '').trim(); return /[.;]$/.test(x) || x.split(/\s+/).length > 9 || /^(?:par|analyste|oenologue|valide|approuve)\b/.test(n) || /^laboratoire$/.test(n) || /habilite|accredit/.test(n); };
  const lab0 = cases.find((x) => BUL_LABOS.test(x) && !phrase(x)) || cases.find((x) => /laboratoire|labo\b|oenolog|œnolog|analyses? (?:oenolog|œnolog)/i.test(x) && !phrase(x)) || '';
  const labo = lab0.replace(/^(?:s\.?\s?a\.?\s?s\.?\s?u?\.?|s\.?\s?a\.?\s?r\.?\s?l\.?|e\.?u\.?r\.?l\.?|s\.?\s?a\.?|scop)\s+/i, '').slice(0, 80);
  const m = /(?:bulletin|rapport|certificat|dossier)(?:\s+d['’]analyses?)?\s*(?:n[°º]|no\b\.?|num[ée]ro)\s*[:.]?\s*((?=[A-Z0-9/._-]*\d)[A-Z0-9][A-Z0-9/._-]{2,30})/i.exec(T); // 0.38.0-alpha.3 : « no » mot entier, au moins un chiffre (« Rapport normal » ne donne plus « rmal »)
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
/* ---------- rapport multi-échantillons (0.37.0-alpha.1) : une ligne par échantillon, une colonne par paramètre ----------
   Libellé, méthode et unité de chaque paramètre empilés sur plusieurs lignes au-dessus de sa colonne ; en marge gauche, le n° d'échantillon
   du laboratoire (« 26LAB000123 ») et la référence du client (« M1 5002 », « Cuve 12 »), avant, sur ou après la ligne des valeurs ;
   valeurs suivies de leur incertitude (« 3,25 / », « 12,06 / 0,13 »). Lu d'après la position des mots (PDF, scans). */
const BUL_ENTETE_PARAM = /^(?:parametres?|analyses?|determinations?|criteres?)\b/; // ligne qui ouvre l'en-tête d'un tableau de paramètres
const BUL_NUM_ECH = /^(?=[a-z0-9\-/.]*\d{4})[a-z0-9][a-z0-9\-/.]{6,24}$/i; // n° d'échantillon du laboratoire : un seul mot, au moins 4 chiffres de suite
const bulEstValeur = (c) => !!bulletinNombre(c.s) && !/^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}$/.test(String(c.s).trim());
const bulMotsDe = (el) => { const L = el.s.length || 1; const out = []; const re = /\S+/g; let m; while ((m = re.exec(el.s))) out.push({ s: m[0], xc: el.x + (el.w * (m.index + m[0].length / 2)) / L }); return out; };
function bulletinColonnes(db, lignes, cands) {
  const pos = (lignes || []).filter((l) => Array.isArray(l.mots) && Number.isFinite(l.y)); if (pos.length < 3) return null;
  const out = [];
  // 0.40.0-alpha.2 : une page peut porter plusieurs tableaux (la suite des paramètres sous le premier) : chacun, ouvert par sa ligne
  // « Paramètre », est lu avec son propre en-tête ; les morceaux d'un même échantillon (autres tableaux, autres pages) sont réunis à la fin
  const tableaux = [];
  uniq(pos.map((l) => l.page || 1)).forEach((pg) => {
    const LPg = pos.filter((l) => (l.page || 1) === pg).sort((a, b) => a.y - b.y);
    const hs = LPg.map((l, i) => (BUL_ENTETE_PARAM.test(bulNorm(l.cells[0].s)) ? i : -1)).filter((i) => i > 0);
    const bornes = [0, ...hs, LPg.length]; for (let k = 0; k < bornes.length - 1; k += 1) if (bornes[k + 1] > bornes[k]) tableaux.push(LPg.slice(bornes[k], bornes[k + 1]));
  });
  tableaux.forEach((LP, tab) => {
    const hm = mediane(LP.map((l) => l.h || 8)) || 8;
    const rows = LP.map((l, i) => (l.cells.filter(bulEstValeur).length >= 2 ? i : -1)).filter((i) => i >= 0); if (!rows.length) return;
    // colonnes : abscisses des valeurs, regroupées
    const xs = rows.flatMap((i) => LP[i].cells.filter(bulEstValeur).map((c) => c.xc)).sort((a, b) => a - b); const tol = Math.max(hm * 2.2, 10); const grp = [];
    xs.forEach((x) => { const g = grp[grp.length - 1]; if (g && x - g[g.length - 1] <= tol) g.push(x); else grp.push([x]); });
    const cols = grp.filter((g) => g.length >= Math.max(1, rows.length * 0.4)).map((g) => ({ xc: mediane(g) })); if (cols.length < 2) return;
    const pas = Math.min(...cols.slice(1).map((c, k) => c.xc - cols[k].xc));
    cols.forEach((c, k) => { c.g = k ? (c.xc + cols[k - 1].xc) / 2 : c.xc - pas / 2; c.d = k < cols.length - 1 ? (c.xc + cols[k + 1].xc) / 2 : c.xc + pas / 2; });
    const gauche = cols[0].g; const colDe = (x) => cols.findIndex((c) => x >= c.g && x < c.d); const dansCols = (l) => l.mots.some((m) => colDe(m.xc) >= 0);
    // en-tête : de la ligne « Paramètre » (ou équivalent) à la première ligne de valeurs ; sinon les lignes alignées sur les colonnes juste au-dessus
    const r0 = rows[0]; let h0 = -1;
    for (let i = r0 - 1; i >= Math.max(0, r0 - 14); i -= 1) if (BUL_ENTETE_PARAM.test(bulNorm(LP[i].cells[0].s))) { h0 = i; break; }
    if (h0 < 0) { h0 = r0; for (let i = r0 - 1; i >= Math.max(0, r0 - 7); i -= 1) { if (LP[i].cells.some(bulEstValeur)) break; if (dansCols(LP[i])) h0 = i; else if (h0 < r0) break; } }
    const labels = cols.map(() => []); const unites = cols.map(() => []);
    // une case d'en-tête du PDF va à la colonne de son centre ; trop large (plusieurs colonnes réunies), elle est répartie mot par mot
    const morceaux = (l) => (Array.isArray(l.elems) && l.elems.length ? l.elems.flatMap((el) => (el.w <= pas * 1.3 ? [el] : bulMotsDe(el))) : l.mots);
    LP.slice(h0, r0).filter((l) => !l.cells.some(bulEstValeur)).forEach((l) => { const u = /^unites?\b/.test(bulNorm(l.cells[0].s)); morceaux(l).forEach((m) => { const k = colDe(m.xc); if (k >= 0) (u ? unites : labels)[k].push(m.s); }); });
    cols.forEach((c, k) => { c.label = labels[k].join(' '); c.unite = unites[k].join(' '); const w = labels[k]; for (let i = 0; i < w.length && !c.p; i += 1) c.p = bulletinParam(db, w.slice(i).join(' ')); });
    // pas un tableau de paramètres (une colonne par échantillon, liste…) ; un seul paramètre reconnu suffit sous une ligne « Paramètre » (suite d'un tableau)
    if (uniq(cols.filter((c) => c.p).map((c) => c.p.paramId || c.p.cat.cle)).length < (h0 < r0 && BUL_ENTETE_PARAM.test(bulNorm(LP[h0].cells[0].s)) ? 1 : 2)) return;
    // marge gauche : n° d'échantillon et référence de chaque ligne de valeurs
    const r1 = rows[rows.length - 1]; let fin = r1; for (let i = r1 + 1; i < Math.min(LP.length, r1 + 4); i += 1) { if (dansCols(LP[i]) || LP[i].y - LP[i - 1].y > hm * 4) break; fin = i; }
    let debut = r0; for (let i = r0 - 1; i >= Math.max(h0, r0 - 3); i -= 1) { if (dansCols(LP[i])) break; debut = i; }
    const T = []; for (let i = debut; i <= fin; i += 1) { const t = LP[i].cells.filter((c) => c.xc < gauche && !(rows.includes(i) && bulEstValeur(c))).map((c) => c.s).join(' ').replace(/\s+/g, ' ').trim(); if (t) T.push({ i, t, id: BUL_NUM_ECH.test(t) && !bulletinNombre(t) && !/[/.]\d{2,4}$/.test(t) }); }
    const blocs = rows.map((i) => ({ i, refs: [], num: '' })); const sig = (t) => t.replace(/\d/g, '9').replace(/[a-z]/gi, 'A'); const parSig = {};
    T.filter((x) => x.id).forEach((x) => { (parSig[sig(x.t)] = parSig[sig(x.t)] || []).push(x); });
    const G = Object.values(parSig).find((g) => g.length === rows.length && g.every((x, k) => x.i <= rows[k] && (k === g.length - 1 || rows[k] < g[k + 1].i)));
    if (G) T.forEach((x) => { let k = 0; G.forEach((g, j) => { if (g.i <= x.i) k = j; }); if (G[k] === x) blocs[k].num = x.t; else blocs[k].refs.push(x.t); });
    else T.forEach((x) => { let k = 0; let d = Infinity; rows.forEach((ri, j) => { const dd = Math.abs(LP[ri].y - LP[x.i].y); if (dd < d - 1e-6) { d = dd; k = j; } }); blocs[k].refs.push(x.t); });
    if (blocs.filter((b) => b.refs.some((r) => bulletinParam(db, r))).length > blocs.length / 2) return; // « libellé  valeur  valeur » : une liste, pas ce tableau
    blocs.forEach((b) => {
      const l = LP[b.i]; const ref = b.refs.join(' ').trim(); const vals = [];
      l.cells.filter((c) => c.xc >= gauche && bulEstValeur(c)).forEach((c) => { const k = colDe(c.xc); if (k < 0 || !cols[k].p) return; vals.push({ ...cols[k].p, ...bulletinNombre(c.s), label: cols[k].label, unite: `${cols[k].unite} ${cols[k].label}` }); });
      if (vals.length) out.push({ ref: ref || b.num, numero: b.num, trouve: bulletinTrouver(`${ref} ${b.num}`, cands)[0] || null, vals, lignes: [l.texte], tab });
    });
  });
  return out.length ? bulletinColonnesReunir(out) : null;
}
// 0.40.0-alpha.2 : un échantillon dont les paramètres sont répartis sur plusieurs tableaux ou plusieurs pages = un seul échantillon.
// Rapprochement par n° d'échantillon du laboratoire (deux n° différents restent deux échantillons, même avec la même référence du client),
// sinon par référence ; jamais deux morceaux d'un même tableau (un échantillon analysé deux fois reste en double).
function bulletinColonnesReunir(morceaux) {
  const out = [];
  morceaux.forEach((m) => {
    const cle = bulNorm(m.numero) ? `n:${bulNorm(m.numero)}` : `r:${bulNorm(m.ref)}`;
    const e = cle.length > 2 && out.find((x) => x.cle === cle && !x.tabs.includes(m.tab) && (!m.numero || !x.ref || !m.ref || bulNorm(x.ref) === bulNorm(m.ref) || x.ref === x.numero || m.ref === m.numero));
    if (!e) { out.push({ ...m, cle, tabs: [m.tab] }); return; }
    e.tabs.push(m.tab); if ((!e.ref || e.ref === e.numero) && m.ref) e.ref = m.ref; if (!e.trouve && m.trouve) e.trouve = m.trouve;
    m.vals.forEach((v) => { const k = v.paramId || (v.cat && v.cat.cle); if (!e.vals.some((x) => (x.paramId || (x.cat && x.cat.cle)) === k)) e.vals.push(v); });
    e.lignes = [...e.lignes, ...m.lignes];
  });
  return out.map(({ cle, tabs, tab, ...x }) => x);
}
/* ---------- export de laboratoire en format long (0.37.0-alpha.1) : une ligne par résultat (échantillon, paramètre, résultat, unité) ---------- */
function bulletinFormatLong(db, lignes) {
  for (let h = 0; h < Math.min((lignes || []).length, 12); h += 1) {
    const H = lignes[h].cells.map((c) => ({ x: c.x, t: bulNorm(c.s) })); const col = (re) => { const c = H.find((x) => re.test(x.t)); return c ? c.x : null; };
    const xP = col(/^(?:parametres?|analyses?|determinations?|criteres?|code parametre)$/); const xR = col(/^(?:resultats?|valeurs?|results?)\b/); if (xP == null || xR == null) continue;
    const xE = col(/^(?:echantillons?|n echantillon|numero d echantillon|n labo|samples?)\b/); const xU = col(/^unites?\b/); const xDp = col(/prel/); const xDr = col(/^date (?:de )?(?:reception|analyse)/); const xDos = col(/^(?:dossier|rapport|bulletin|n dossier)\b/);
    const xRefs = H.filter((c) => /^(?:identification|references?|ref client|reference client|designation|cuve|lot|contenant|libelle)\b/.test(c.t) && !/commande/.test(c.t)).map((c) => c.x);
    const G = new Map(); let date = ''; let numero = '';
    lignes.slice(h + 1).forEach((l) => {
      const v = (x) => (x == null ? '' : ((l.cells.find((c) => c.x === x) || {}).s || '')); const n = bulletinNombre(v(xR)); const p = bulletinParam(db, v(xP)); if (!n || !p) return;
      const ref = uniq(xRefs.map(v).filter(Boolean)).join(' · '); const num = v(xE); const k = num || ref; if (!k) return;
      if (!G.has(k)) { const dp = bulletinDates(v(xDp))[0]; G.set(k, { ref: ref || num, numero: num, date: dp ? dp.iso : '', vals: [], lignes: [] }); }
      if (!date) { const dr = bulletinDates(v(xDr))[0]; if (dr) date = dr.iso; } if (!numero && v(xDos)) numero = v(xDos).slice(0, 40);
      const g = G.get(k); g.vals.push({ ...p, ...n, label: v(xP), unite: `${v(xU)} ${v(xP)}` }); g.lignes.push(l.texte);
    });
    if (G.size) return { echantillons: [...G.values()], date, numero };
  }
  return null;
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
  // export en format long, puis rapport multi-échantillons placé (0.37.0-alpha.1) : chaque échantillon garde son n° de laboratoire
  const garde = (e) => Object.keys(e.valeurs).length || Object.keys(e.nouveaux).length;
  const lg = bulletinFormatLong(db, lignes);
  if (lg) { lg.echantillons.forEach((x) => { const e = nouvel(x.ref, bulletinTrouver(`${x.ref} ${x.numero}`, cands)[0] || null, { numero: x.numero, lignes: x.lignes.slice(0, 40) }); e.date = x.date || ''; x.vals.forEach((r) => ajouter(e, r)); });
    return { ...ent, numero: ent.numero || lg.numero, date: dateG || lg.date, format: 'long', echantillons: E.filter(garde) }; }
  const co = bulletinColonnes(db, lignes, cands);
  if (co) { co.forEach((x) => { const e = nouvel(x.ref || `Échantillon ${E.length + 1}`, x.trouve, { numero: x.numero, lignes: x.lignes }); x.vals.forEach((r) => ajouter(e, r)); }); return { ...ent, date: dateG, format: 'colonnes', echantillons: E.filter(garde) }; }
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
    + 'Réponds par un objet JSON de la forme : {"laboratoire": "<nom ou null>", "numero": "<n° du bulletin ou null>", "echantillons": [{"numero_echantillon": "<n° d’échantillon donné par le laboratoire, ou null>", "reference": "<référence du client telle qu’écrite : cuve, lot, désignation>", "date_prelevement": "<AAAA-MM-JJ ou null>", "resultats": {"<identifiant du paramètre>": <nombre dans l’unité attendue>}, "autres": [{"nom": "<paramètre absent de la liste>", "valeur": <nombre>, "unite": "<unité>"}]}]}.\n'
    + 'Un même bulletin contient souvent plusieurs échantillons (une ligne ou une colonne chacun, avec un n° d’échantillon du laboratoire et une référence du client) : renvoie-les tous, séparément, dans l’ordre du bulletin, sans mélanger leurs valeurs. '
    + 'Valeur suivie de son incertitude (« 3,25 / », « 12,06 / 0,13 », « 3,25 ± 0,05 ») : la valeur seule. Masse volumique en g/dm³ ou g/L → densité : diviser par 1000. Titre alcoométrique volumique naturel (moût) → TAP. Acide acétique → acidité volatile (× 0,817 en g/L H₂SO₄). '
    + 'Acidités exprimées en acide tartrique (g/L TH2) → g/L H₂SO₄ : diviser par 1,531 ; en acide acétique → × 0,817. Valeur écrite « < x » : x. Date de prélèvement absente : date de réception. Seulement les résultats présents dans le bulletin.';
  return { system, texte: t, max: 6000 };
}
function iaLireBulletin(db, o) {
  if (!o || typeof o !== 'object') return null; const ids = new Set((db.analysesParams || []).map((p) => p.id)); const nb = (v) => { const n = typeof v === 'number' ? { v } : bulletinNombre(v); return n && Number.isFinite(n.v) ? n : null; };
  const E = (Array.isArray(o.echantillons) ? o.echantillons : []).slice(0, 60).map((e) => {
    if (!e || typeof e !== 'object') return null; const valeurs = {}; const nouveaux = {};
    // clé = identifiant du paramètre ; sinon (réponse moins docile) son nom, reconnu comme un libellé de bulletin (0.37.0-alpha.1)
    Object.keys(e.resultats && typeof e.resultats === 'object' ? e.resultats : {}).forEach((k) => { const n = nb(e.resultats[k]); if (!n) return; if (ids.has(k)) { valeurs[k] = { v: n.v, op: n.op || '', label: k, src: 'ia' }; return; } const p = bulletinParam(db, k); if (p && p.paramId && !valeurs[p.paramId] && !e.resultats[p.paramId]) valeurs[p.paramId] = { v: n.v, op: n.op || '', label: k, src: 'ia' }; });
    (Array.isArray(e.autres) ? e.autres : []).slice(0, 30).forEach((x) => { if (!x || typeof x !== 'object') return; const n = nb(x.valeur); const lab = iaTexte(x.nom, 80); if (!n || !lab) return; const p = bulletinParam(db, lab);
      if (p && p.paramId) { const par = (db.analysesParams || []).find((y) => y.id === p.paramId) || {}; if (!valeurs[p.paramId]) valeurs[p.paramId] = { v: Math.round(bulletinConvertir(n.v, x.unite || '', par.unite || '', par.nom) * 1e5) / 1e5, op: n.op || '', label: lab, src: 'ia' }; }
      else if (p && p.cat && !nouveaux[p.cat.cle]) nouveaux[p.cat.cle] = { cle: p.cat.cle, nom: p.cat.nom, unite: p.cat.unite, dec: p.cat.dec, v: Math.round(bulletinConvertir(n.v, x.unite || '', p.cat.unite, p.cat.nom) * 1e5) / 1e5, op: n.op || '', label: lab, src: 'ia' }; });
    const d = iaDateDe(e.date_prelevement);
    const numero = iaTexte(e.numero_echantillon, 40); return { ref: iaTexte(e.reference, 120) || numero || 'Échantillon', numero, date: isoOK(d) ? d : '', valeurs, nouveaux, notes: [], lignes: [] };
  }).filter((e) => e && (Object.keys(e.valeurs).length || Object.keys(e.nouveaux).length));
  return { labo: iaTexte(o.laboratoire, 80), numero: iaTexte(o.numero, 40), echantillons: E };
}
// script d'abord ; l'IA complète (échantillons rapprochés par le lot ou le contenant trouvé, sinon par la référence)
function bulletinFusion(db, R, script, ia, cands0) {
  if (!ia) return script; const cands = cands0 || bulletinCandidats(db, R); const S = { ...script, echantillons: script.echantillons.map((e) => ({ ...e, valeurs: { ...e.valeurs }, nouveaux: { ...e.nouveaux } })) };
  if (!S.labo && ia.labo) S.labo = ia.labo; if (!S.numero && ia.numero) S.numero = ia.numero;
  ia.echantillons.forEach((x) => {
    const tr = bulletinTrouver(x.ref, cands)[0] || null; const nr = bulNorm(x.ref);
    const nn = bulNorm(x.numero); // n° d'échantillon du laboratoire d'abord (0.37.0-alpha.1) : plusieurs échantillons peuvent viser la même cuve
    const e = (nn && S.echantillons.find((y) => bulNorm(y.numero) === nn)) || S.echantillons.find((y) => (!nn || !y.numero) && ((tr && y.trouve && y.trouve.kind === tr.kind && y.trouve.id === tr.id) || (nr && bulNorm(y.ref) === nr))) || (S.echantillons.length === 1 && ia.echantillons.length === 1 ? S.echantillons[0] : null);
    if (!e) { S.echantillons.push({ ...x, trouve: tr, src: 'ia' }); return; }
    if (!e.trouve && tr) e.trouve = tr; if (!e.numero && x.numero) e.numero = x.numero; if (!e.date && x.date) e.date = x.date;
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

/* ---------- bulletin d'un partenaire, dans l'entrée de moûts (0.34.0-alpha.1) ----------
   res : résultat de bulletinAnalyser ; mouts : [{ i (index du moût dans l'entrée), numLot, compartiment }] (moûts de l'onglet du partenaire).
   Rapprochement : n° de lot, puis compartiment cités dans l'échantillon ; puis, dans l'ordre, les échantillons restants aux moûts restants ;
   un seul échantillon sans rapprochement : il vaut pour tous les moûts du partenaire. → [{ i, valeurs: { paramId: nombre }, ref }] */
function bulletinPourMouts(res, mouts) {
  const E = bulletinEchantillonsValeurs(res); const M = (mouts || []).filter(Boolean);
  if (!E.length || !M.length) return [];
  const contient = (ref, s) => { const t = bulNorm(s); if (!t) return false; const r = ` ${bulNorm(ref)} `; return r.includes(` ${t} `) || (t.replace(/ /g, '').length >= 4 && r.replace(/ /g, '').includes(t.replace(/ /g, ''))); };
  const chiffres = (s) => (String(s || '').match(/\d+/g) || []).map((x) => String(Number(x)));
  const refDe = (e) => `${e.ref || ''} ${e.numero || ''}`;
  const out = []; const prisE = new Set(); const prisM = new Set();
  const lier = (sur, test) => E.forEach((e) => { if (prisE.has(e.k)) return; const m = M.find((x) => !prisM.has(x.i) && test(e, x)); if (m) { prisE.add(e.k); prisM.add(m.i); out.push({ i: m.i, k: e.k, valeurs: e.valeurs, ref: e.ref, numero: e.numero, sur }); } });
  lier('lot', (e, m) => String(m.numLot || '').trim() && contient(refDe(e), m.numLot));
  lier('compartiment', (e, m) => String(m.compartiment || '').trim() && contient(refDe(e), m.compartiment));
  // mêmes nombres (0.37.0-alpha.1) : lot « M1-5002 » ↔ échantillon « M1TMNC 5002 »
  lier('chiffres', (e, m) => { const d = chiffres(m.numLot).filter((x) => x.length >= 2); const r = chiffres(refDe(e)); return d.length && d.every((x) => r.includes(x)); });
  if (E.length === 1 && !out.length) return M.map((m) => ({ i: m.i, k: E[0].k, valeurs: E[0].valeurs, ref: E[0].ref, numero: E[0].numero, sur: 'unique' }));
  E.forEach((e) => { if (prisE.has(e.k)) return; const m = M.find((x) => !prisM.has(x.i)); if (m) { prisE.add(e.k); prisM.add(m.i); out.push({ i: m.i, k: e.k, valeurs: e.valeurs, ref: e.ref, numero: e.numero, sur: 'ordre' }); } });
  return out.sort((a, b) => a.i - b.i);
}
// échantillons d'un bulletin lu, avec leurs valeurs en nombres : [{ k, ref, numero, valeurs: { paramId: nombre } }] (0.37.0-alpha.1)
function bulletinEchantillonsValeurs(res) {
  return ((res && res.echantillons) || []).filter((e) => e && Object.keys(e.valeurs || {}).length).map((e, k) => {
    const v = {}; Object.keys(e.valeurs).forEach((p) => { const x = e.valeurs[p]; const n = x && typeof x === 'object' ? x.v : x; if (Number.isFinite(+n)) v[p] = +n; });
    return { k, ref: e.ref || '', numero: e.numero || '', valeurs: v };
  });
}
// affectation guidée nécessaire : rapprochement fait dans l'ordre, échantillon laissé de côté, ou un seul échantillon pour des moûts de plusieurs partenaires
function bulletinAffectationDouteuse(res, aff, plusieursPartenaires) {
  const E = bulletinEchantillonsValeurs(res); if (!E.length) return false;
  return (aff || []).some((a) => a.sur === 'ordre' || (plusieursPartenaires && a.sur === 'unique')) || uniq((aff || []).map((a) => a.k)).length < E.length;
}
