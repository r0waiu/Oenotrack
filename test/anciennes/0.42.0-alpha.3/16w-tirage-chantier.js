/* ============ TIRAGE — CHANTIER, MIXTION OU POMPE DOSEUSE, PRESTATION (0.42.0-alpha.2) ============
   - db.chantiersTirage = [{ id, numero, nom, dateDebut, dateFin, realisation: 'interne' | 'prestataire', prestataireId (fournisseur
     au rôle « prestataire_tirage »), ligne { depalettiseur, tireuse, nbBecs, injecteuse, biduleuse, capsuleuse, marquage ('laser' | 'jet' | ''),
     emboxeur, robot, vision, autres }, notes, visaCave, visaPrestataire, par, le, maj }] — documents : db.docs cible { type: 'chantier', id }
   - opération « tirage » : formats [{ format, nb, L }] (nbBouteilles = total, volBouteilleL = volume moyen : lus par les versions antérieures),
     casse, chantierId, mode 'mixtion' | 'pompe' (exclusif pour un lot de tirage), pompe { consignes { liqueurPct, levainPct, adjuvants },
     debitColsH, controles [{ heure, operateur, type, cible, nCols, mesure, unite, densite, tempC, action }] }
   - cuve de mixtion : opération « assemblage » marquée mixtion (lot.mixtion = true) avec préparations versées (levain, liqueur) et
     densités ; une version antérieure y voit un assemblage */

const TIRAGE_MODES = [{ id: 'mixtion', label: 'Mixtion en cuve' }, { id: 'pompe', label: 'Pompe doseuse / injecteuse en ligne' }];
const TIRAGE_LIGNE = [['depalettiseur', 'Dépalettiseur'], ['tireuse', 'Tireuse'], ['injecteuse', 'Injecteuse (pompe doseuse)'], ['biduleuse', 'Biduleuse'], ['capsuleuse', 'Capsuleuse'], ['marquage', 'Marquage (laser, jet d’encre)'], ['emboxeur', 'Emboxeur'], ['robot', 'Robot de palettisation'], ['vision', 'Contrôle par vision']];
const POMPE_CONTROLES = [{ id: 'eprouvette', label: 'Éprouvette (volume injecté)' }, { id: 'pesee', label: 'Pesée de cols' }, { id: 'densite', label: 'Densité du vin mixtionné' }, { id: 'debit', label: 'Débit de la ligne' }];
const FOURNISSEUR_ROLES = [{ id: 'prestataire_tirage', label: 'Prestataire de tirage' }];
const fournisseurRoles = (f) => (Array.isArray(f && f.roles) ? f.roles : []);
const prestatairesTirage = (db) => (db.fournisseurs || []).filter((f) => fournisseurRoles(f).includes('prestataire_tirage'));

/* ---------- formats d'un tirage ---------- */
// formats d'une opération de tirage (les anciennes n'ont que nbBouteilles × volBouteilleL)
function tirageFormatsDe(op) {
  if (Array.isArray(op && op.formats) && op.formats.length) return op.formats.map((f) => ({ format: f.format || 'bouteille', nb: num(f.nb), L: num(f.L) || (tirageFormat(f.format) || {}).L || 0.75 }));
  const L0 = num(op && op.volBouteilleL) || 0.75; const fm = TIRAGE_FORMATS.find((x) => Math.abs(x.L - L0) < 1e-6);
  return [{ format: fm ? fm.id : 'autre', nb: num(op && op.nbBouteilles), L: L0 }];
}
// champs lus par les versions antérieures : total des cols et volume moyen
function tirageFormatsCompat(formats) {
  const F = (formats || []).filter((f) => num(f.nb) > 0); const n = sum(F, (f) => f.nb); const v = tirageVolFormats(F);
  return { nbBouteilles: n, volBouteilleL: n > 0 ? Math.round(v / n * 1e6) / 1e6 : 0.75 };
}
const tirageEqBouteilles = (formats) => tirageVolFormats(formats) / 0.75;

/* ---------- mixtion en cuve ou pompe doseuse : jamais les deux pour un même lot ---------- */
const lotEstMixtion = (db, R, lotId) => !!(((R && R.lots && R.lots[lotId]) || lotById(db, lotId) || {}).mixtion);
// contrôle de la spécification d'un tirage : message d'erreur ou null
function tirageModeControle(db, R, spec) {
  const mode = spec.mode; if (!mode) return null; // tirage d'avant 0.42.0-alpha.2 : ni l'un ni l'autre imposé
  if (!TIRAGE_MODES.some((m) => m.id === mode)) return 'Mode de tirage inconnu.';
  const srcMix = (spec.sources || []).map((s) => lotEstMixtion(db, R, s.lotId || ((R.portions || {})[s.portionId] || {}).lotId));
  const prepsInc = (spec.prepUses || []).filter((u) => { const p = (R.preps || {})[u.prepId]; return p && (p.ptype === 'levain' || p.ptype === 'liqueur_tirage'); });
  if (mode === 'mixtion') {
    if (srcMix.some((x) => !x)) return 'Tirage par mixtion : le vin doit venir d’une cuve de mixtion (vin, liqueur, levain et adjuvants déjà assemblés).';
    if (prepsInc.length) return 'Tirage par mixtion : la liqueur et le levain sont déjà dans la cuve de mixtion — pas de dosage en ligne sur ce lot.';
  }
  if (mode === 'pompe') {
    if (srcMix.some((x) => x)) return 'Tirage par pompe doseuse : le vin de base ne doit pas venir d’une cuve de mixtion (la liqueur et le levain sont dosés en ligne).';
    if (!prepsInc.length) return 'Tirage par pompe doseuse : indiquez la liqueur et le levain dosés en ligne.';
  }
  return null;
}
// pompe doseuse : volumes théoriques d'après les consignes (en % du volume tiré) et volumes réellement consommés
function tiragePompeBilan(db, R, op) {
  const P = op.pompe || {}; const C = P.consignes || {}; const formats = tirageFormatsDe(op); const volL = tirageVolFormats(formats);
  const reel = { liqueur: 0, levain: 0 }; (op.prepUses || []).forEach((u) => { const p = (R.preps || {})[u.prepId] || {}; if (p.ptype === 'liqueur_tirage') reel.liqueur += num(u.volL); else if (p.ptype === 'levain') reel.levain += num(u.volL); });
  const ligne = (nom, pct, r) => { const th = volL * num(pct) / 100; return { nom, pct: num(pct), theoL: th, reelL: r, ecartPct: th > 0 && r != null ? (r - th) / th * 100 : null, mLcol: formats.map((f) => ({ format: f.format, mL: num(pct) / 100 * f.L * 1000 })) }; };
  const lignes = [ligne('Liqueur de tirage', C.liqueurPct, reel.liqueur), ligne('Levain', C.levainPct, reel.levain), ...((C.adjuvants || []).map((a) => ligne(a.nom, a.pct, null)))].filter((l) => l.pct > 0 || l.reelL > 0);
  const ctrl = (P.controles || []).map((c) => { const cible = num(c.cible); const m = num(c.mesure) / Math.max(1, num(c.nCols) || 1); return { ...c, parCol: m, ecartPct: cible > 0 && hasNum(c.mesure) ? (m - cible) / cible * 100 : null }; });
  return { volL, lignes, controles: ctrl, derive: ctrl.filter((c) => c.ecartPct != null && Math.abs(c.ecartPct) > num(P.tolerancePct || 2)) };
}
// consigne de la pompe en mL par col pour un format, depuis un pourcentage du volume tiré
const pompeMlCol = (pct, format) => num(pct) / 100 * (((tirageFormat(format) || {}).L) || 0.75) * 1000;

/* ---------- chantiers de tirage ---------- */
const chantiersTirage = (db) => (Array.isArray(db && db.chantiersTirage) ? db.chantiersTirage.filter((c) => c && c.id) : []);
const chantierTirage = (db, id) => chantiersTirage(db).find((c) => c.id === id) || null;
const chantierTirages = (db, id) => (db.ops || []).filter((o) => o && o.type === 'tirage' && o.chantierId === id).sort(byDate);
const chantierNumeroSuivant = (db, date) => { const a = yearOf(isoOK(date) ? date : todayISO()); return `CH-${a}-${pad(chantiersTirage(db).filter((c) => yearOf(c.dateDebut) === a).length + 1)}`; };
function chantierTirageSave(db, c, id, par) {
  const old = id ? chantierTirage(db, id) : null; if (id && !old) return fail('Chantier introuvable.');
  if (!isoValide(c.dateDebut)) return fail('Indiquez la date de début du chantier.'); if (c.dateFin && !isoValide(c.dateFin)) return fail('Date de fin invalide.');
  if (c.dateFin && c.dateFin < c.dateDebut) return fail('La date de fin précède la date de début.');
  const cp = campOf(db, c.dateDebut); if (!cp) return fail('Aucune campagne ne couvre cette date. Créez-la dans Paramètres › Campagnes.'); if (cp.figee) return fail(`La campagne ${cp.nom} est figée.`);
  const real = c.realisation === 'prestataire' ? 'prestataire' : 'interne';
  if (real === 'prestataire' && !(db.fournisseurs || []).some((f) => f.id === c.prestataireId)) return fail('Choisissez le prestataire de tirage (Intrants › Fournisseurs, rôle « Prestataire de tirage »).');
  const numero = String(c.numero || '').trim() || chantierNumeroSuivant(db, c.dateDebut);
  if (chantiersTirage(db).some((x) => x.id !== id && norm(x.numero) === norm(numero))) return fail(`Le chantier n° ${numero} existe déjà.`);
  const ligne = {}; const L0 = c.ligne || {}; TIRAGE_LIGNE.forEach(([k]) => { const v = L0[k]; if (v !== undefined && v !== '' && v !== false) ligne[k] = typeof v === 'string' ? v.trim() : v; }); if (hasNum(L0.nbBecs)) ligne.nbBecs = num(L0.nbBecs); if (L0.autres) ligne.autres = String(L0.autres).trim();
  if (!Array.isArray(db.chantiersTirage)) db.chantiersTirage = [];
  const x = { ...(old || {}), ...c, id: old ? old.id : nid(db, 'cht'), numero, nom: String(c.nom || '').trim(), dateDebut: c.dateDebut, dateFin: c.dateFin || '', realisation: real, prestataireId: real === 'prestataire' ? c.prestataireId : '', ligne, notes: String(c.notes || '').trim(), maj: new Date().toISOString(), ...(old ? {} : { par: par || '', le: new Date().toISOString() }) };
  if (old) db.chantiersTirage[db.chantiersTirage.indexOf(db.chantiersTirage.find((y) => y && y.id === old.id))] = x; else db.chantiersTirage.push(x);
  return okr({ id: x.id });
}
function chantierTirageDelete(db, id) {
  const c = chantierTirage(db, id); if (!c) return fail('Chantier introuvable.'); if (isLocked(db, c.dateDebut)) return fail('Ce chantier appartient à une campagne figée.');
  const T = chantierTirages(db, id); if (T.length) return fail(`Suppression impossible : ${T.length} tirage(s) rattaché(s) à ce chantier. Retirez-les d’abord.`);
  db.chantiersTirage = chantiersTirage(db).filter((x) => x.id !== id); db.docs = (db.docs || []).filter((d) => !(d.cible && d.cible.type === 'chantier' && d.cible.id === id)); return okr();
}
// bilan d'un chantier : cols par format et par lot, casse, volumes, VRTP par lot
function chantierBilan(db, R, id) {
  const T = chantierTirages(db, id); const parFormat = {}; let casse = 0;
  const lots = T.map((o) => { const F = tirageFormatsDe(o); F.forEach((f) => { parFormat[f.format] = (parFormat[f.format] || 0) + num(f.nb); }); casse += num(o.casse); const b = tirageBilan(db, R, { ...o, formats: F }); return { opId: o.id, lotId: o.lotId, code: ((R.lots || {})[o.lotId] || lotById(db, o.lotId) || {}).code || (o.lotSpec || {}).code, date: o.date, mode: o.mode || '', formats: F, casse: num(o.casse), bilan: b }; });
  return { lots, parFormat, casse, cols: sum(Object.values(parFormat)), eqBouteilles: sum(lots, (l) => tirageEqBouteilles(l.formats)), volL: sum(lots, (l) => l.bilan.tireL) };
}
// pompe doseuse enregistrée avec le tirage : consignes, débit, tolérance, contrôles (nombres normalisés, lignes vides retirées)
function tiragePompeSpec(P) {
  const n = (v) => (hasNum(v) ? num(v) : undefined); const C = P.consignes || {}; const o = {};
  const c = { liqueurPct: n(C.liqueurPct), levainPct: n(C.levainPct), ...(Array.isArray(C.adjuvants) && C.adjuvants.length ? { adjuvants: C.adjuvants.filter((a) => a && a.nom && hasNum(a.pct)).map((a) => ({ nom: String(a.nom).trim(), pct: num(a.pct) })) } : {}) };
  Object.keys(c).forEach((k) => { if (c[k] === undefined) delete c[k]; }); if (Object.keys(c).length) o.consignes = c;
  if (n(P.debitColsH) !== undefined) o.debitColsH = n(P.debitColsH); if (n(P.tolerancePct) !== undefined) o.tolerancePct = n(P.tolerancePct);
  const K = (P.controles || []).filter((x) => x && (hasNum(x.mesure) || hasNum(x.densite) || String(x.action || '').trim())).map((x) => { const y = { heure: String(x.heure || '').trim(), type: x.type || 'eprouvette' }; ['nCols', 'mesure', 'cible', 'densite', 'tempC'].forEach((k) => { if (hasNum(x[k])) y[k] = num(x[k]); }); ['operateur', 'action', 'unite'].forEach((k) => { if (String(x[k] || '').trim()) y[k] = String(x[k]).trim(); }); return y; });
  if (K.length) o.controles = K; return Object.keys(o).length ? o : null;
}
