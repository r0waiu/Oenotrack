/* ============ ÉQUIPEMENTS › MAINTENANCE : PRODUITS DE MAINTENANCE (0.36.0-alpha.1) ============
   Catalogue : db.produitsMaintenance [{ id, nom, fournisseur, fabricant, reference, usage, contactAlimentaire ('oui' | 'non' | ''),
   caveVinif ('oui' | 'non' | '' : utilisation en cave de vinification), composition, stockage, unite, suiviStock (bool), seuil (stock
   minimal), champs [{ label, valeur }] (champs personnalisés), fdsDate, fdsVersion, fdsNonRequise, actif, notes, cree, modifLe }].
   Documents : cible { type: 'produitMaintenance', id } (FDS, FT, attestation contact alimentaire), même dépôt groupé que les intrants.
   Stock (seulement si suiviStock) : db.mouvementsMaintenance [{ id, produitId, date, type ('entree' | 'sortie' | 'regul'), qty (positive
   pour une entrée ou une sortie, signée pour une régularisation), motif, numLot, notes, par, le }] ; le stock est recalculé, jamais stocké. */
const PMAINT_UNITES = ['u', 'kg', 'g', 'L', 'mL'];
const PMAINT_INFOS = [['fabricant', 'Fabricant', 120], ['composition', 'Composition', 600], ['stockage', 'Stockage', 400]];
const PMAINT_MOUV_TYPES = [['entree', 'Entrée (réception)'], ['sortie', 'Sortie (utilisation)'], ['regul', 'Régularisation (inventaire, casse, perte…)']];
const produitsMaint = (db) => (Array.isArray(db && db.produitsMaintenance) ? db.produitsMaintenance.filter((p) => p && p.id) : []);
const maintProdDef = (db, id) => produitsMaint(db).find((p) => p.id === id) || null;
const mouvementsMaint = (db, pid) => (Array.isArray(db && db.mouvementsMaintenance) ? db.mouvementsMaintenance.filter((m) => m && m.id && (!pid || m.produitId === pid)) : []);
const maintMouvSigne = (m) => (m.type === 'sortie' ? -Math.abs(num(m.qty)) : m.type === 'entree' ? Math.abs(num(m.qty)) : num(m.qty));
function maintStock(db, pid, date) { return r2(sum(mouvementsMaint(db, pid).filter((m) => !date || m.date <= date), maintMouvSigne)); }
function maintMouvHistorique(db, pid) {
  const M = mouvementsMaint(db, pid).slice().sort(maintMouvOrdre);
  let s = 0; return M.map((m) => { s += maintMouvSigne(m); return { ...m, signe: maintMouvSigne(m), solde: r2(s) }; });
}
const maintStockBas = (db, p) => !!(p && p.suiviStock && p.actif !== false && hasNum(p.seuil) && maintStock(db, p.id) <= num(p.seuil) + 1e-9);
const maintDocs = (db, id, cat) => ficheDocs(db, 'produitMaintenance', id, cat);
function maintFdsEtat(db, p, today) {
  if (!p) return { k: 'manquante', tone: 'bad', label: 'FDS manquante', n: 0 };
  if (p.fdsNonRequise) return { k: 'sansobjet', tone: '', label: 'FDS non requise', n: 0 };
  const n = maintDocs(db, p.id, 'fds').length; const date = derniereRevision(maintDocs(db, p.id, 'fds')) || (isoOK(p.fdsDate) ? p.fdsDate : '');
  const age = isoOK(date) ? daysBetween(date, today || todayISO()) / 365.25 : null;
  if (!n) return { k: 'manquante', tone: 'bad', label: 'FDS manquante', n };
  if (age != null && age > PROD_FDS_ANS) return { k: 'ancienne', tone: 'warn', label: `FDS du ${fmtDate(date)} (plus de ${PROD_FDS_ANS} ans)`, n, date };
  return { k: 'ok', tone: 'ok', label: date ? `FDS du ${fmtDate(date)}` : 'FDS jointe', n, date };
}
const maintFtEtat = (db, p) => { const L = p ? maintDocs(db, p.id, 'ft') : []; const d = derniereRevision(L); return L.length ? { k: 'ok', label: d ? `FT du ${fmtDate(d)}` : 'FT jointe' } : { k: 'manquante', label: 'pas de FT' }; };
const ON_VAL = (v) => (v === 'oui' || v === true ? 'oui' : v === 'non' || v === false ? 'non' : '');
const onLib = (v) => (ON_VAL(v) === 'oui' ? 'Oui' : ON_VAL(v) === 'non' ? 'Non' : '—');
// champs gérés ici : les autres (version suivante) sont gardés à la modification
function maintProduitSave(db, s, id) {
  s = s || {}; const nom = String(s.nom || '').trim().replace(/\s+/g, ' ').slice(0, 90); if (!nom) return fail('Nom du produit de maintenance requis.');
  if (produitsMaint(db).some((p) => p.id !== id && norm(p.nom).trim() === norm(nom).trim())) return fail(`Le produit « ${nom} » existe déjà.`);
  const t = (k, n) => String(s[k] == null ? '' : s[k]).trim().slice(0, n);
  const champs = (Array.isArray(s.champs) ? s.champs : []).map((c) => ({ label: String((c && c.label) || '').trim().slice(0, 60), valeur: String((c && c.valeur) || '').trim().slice(0, 300) })).filter((c) => c.label || c.valeur).slice(0, 20);
  if (champs.some((c) => !c.label)) return fail('Champ personnalisé : donnez-lui un nom.');
  if (s.seuil !== undefined && String(s.seuil).trim() !== '' && !(hasNum(s.seuil) && num(s.seuil) >= 0)) return fail('Stock minimal : valeur positive ou nulle.');
  const x = { nom, fournisseur: t('fournisseur', 120), fabricant: t('fabricant', 120), reference: t('reference', 60), usage: t('usage', 300), contactAlimentaire: ON_VAL(s.contactAlimentaire), caveVinif: ON_VAL(s.caveVinif),
    composition: t('composition', 600), stockage: t('stockage', 400), unite: PMAINT_UNITES.includes(s.unite) ? s.unite : 'u', suiviStock: !!s.suiviStock, seuil: hasNum(s.seuil) && String(s.seuil).trim() !== '' ? num(s.seuil) : null,
    champs, fdsNonRequise: !!s.fdsNonRequise, actif: s.actif !== false, notes: t('notes', 1000), modifLe: todayISO() };
  if (!Array.isArray(db.produitsMaintenance)) db.produitsMaintenance = [];
  if (id) { const p = maintProdDef(db, id); if (!p) return fail('Produit de maintenance introuvable.'); Object.assign(p, x); return okr({ id }); }
  const p = { id: nid(db, 'pm'), ...x, cree: todayISO() }; db.produitsMaintenance.push(p); return okr({ id: p.id });
}
function maintProduitDelete(db, id) {
  if (!maintProdDef(db, id)) return fail('Produit de maintenance introuvable.');
  if (mouvementsMaint(db, id).length) return fail('Ce produit a des mouvements de stock : désactivez-le plutôt que de le supprimer.');
  const docs = (db.docs || []).filter((x) => x && x.cible && x.cible.type === 'produitMaintenance' && x.cible.id === id).map((x) => x.id);
  db.produitsMaintenance = db.produitsMaintenance.filter((p) => !(p && p.id === id)); if (docs.length) db.docs = db.docs.filter((x) => !docs.includes(x.id)); return okr({ docs });
}
// ordre des mouvements : date, puis moment de la saisie (0.38.0-alpha.3 : le même partout ; une modification garde sa place)
const maintMouvOrdre = (a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : String(a.le || '').localeCompare(String(b.le || '')));
function maintMouvementSave(db, s, id, uid) {
  s = s || {}; const p = maintProdDef(db, s.produitId); if (!p) return fail('Produit de maintenance introuvable.');
  if (!p.suiviStock) return fail('Le suivi du stock n’est pas activé pour ce produit.');
  if (!PMAINT_MOUV_TYPES.some((x) => x[0] === s.type)) return fail('Type de mouvement inconnu.');
  if (!isoOK(s.date)) return fail('Date du mouvement invalide.'); if (isLocked(db, s.date)) return fail('Cette date appartient à une campagne figée.');
  const old = id ? mouvementsMaint(db).find((m) => m.id === id) : null; if (id && !old) return fail('Mouvement introuvable.'); if (old && isLocked(db, old.date)) return fail('Mouvement verrouillé (campagne figée).');
  let qty;
  if (s.type === 'regul' && s.mode === 'compte') { if (!hasNum(s.compte) || num(s.compte) < 0) return fail('Quantité comptée : valeur positive ou nulle requise.'); const st = r2(sum(mouvementsMaint(db, p.id).filter((m) => m.id !== id && m.date <= s.date), maintMouvSigne)); qty = r2(num(s.compte) - st); if (Math.abs(qty) < 1e-9) return fail('Le stock compté est égal au stock calculé : rien à régulariser.'); }
  else { if (!hasNum(s.qty) || Math.abs(num(s.qty)) < 1e-9) return fail('Quantité : valeur non nulle requise.'); qty = s.type === 'regul' ? r2(num(s.qty)) : r2(Math.abs(num(s.qty))); }
  const notes = String(s.notes || '').trim().slice(0, 300); const motif = s.type === 'regul' ? (REGUL_MOTIFS.some((m) => m[0] === s.motif) ? s.motif : 'autre') : '';
  if (s.type === 'regul' && s.mode !== 'compte' && ['casse', 'perte', 'peremption', 'echantillon', 'retour'].includes(motif) && qty > 0) qty = -qty; // un comptage donne le signe de lui-même
  if (motif === 'autre' && !notes) return fail('Motif « Autre » : précisez la raison dans les notes.');
  const x = { produitId: p.id, date: s.date, type: s.type, qty, motif, numLot: String(s.numLot || '').trim().slice(0, 60), notes, ...(s.type === 'regul' && s.mode === 'compte' ? { compte: r2(num(s.compte)) } : {}), par: uid || '', le: new Date().toISOString() };
  // stock jamais négatif après le mouvement (à sa date et ensuite)
  const tous = mouvementsMaint(db, p.id); const L = (old ? tous.map((m) => (m.id === id ? { ...x, id, le: old.le || x.le } : m)) : [...tous, { ...x, id: '_' }]).sort(maintMouvOrdre); // tri stable : à égalité, l'ordre de saisie
  let st = 0; for (const m of L) { st += maintMouvSigne(m); if (st < -1e-6) return fail(`Stock insuffisant au ${fmtDate(m.date)} (${fmt(st - maintMouvSigne(m), 2)} ${p.unite}).`); }
  if (!Array.isArray(db.mouvementsMaintenance)) db.mouvementsMaintenance = [];
  if (old) { delete old.compte; Object.assign(old, x, { le: old.le || x.le, modifLe: x.le }); return okr({ id: old.id }); }
  const m = { id: nid(db, 'mm'), ...x }; db.mouvementsMaintenance.push(m); return okr({ id: m.id });
}
function maintMouvementDelete(db, id) {
  const m = mouvementsMaint(db).find((x) => x.id === id); if (!m) return fail('Mouvement introuvable.'); if (isLocked(db, m.date)) return fail('Mouvement verrouillé (campagne figée).');
  const reste = mouvementsMaint(db, m.produitId).filter((x) => x.id !== id).sort(maintMouvOrdre); let st = 0;
  for (const x of reste) { st += maintMouvSigne(x); if (st < -1e-6) return fail('Supprimer ce mouvement rendrait le stock négatif.'); }
  db.mouvementsMaintenance = db.mouvementsMaintenance.filter((x) => !(x && x.id === id)); return okr();
}
// « contact alimentaire » lu dans une FT / FDS (NSF H1, règlement (CE) 1935/2004, « food grade »…)
function maintContactDetecter(texte) {
  const L = String(texte || '').split('\n').map((x) => lot3Plier(x)); let pos = false; let neg = false;
  L.forEach((l) => {
    if (!/(contact alimentaire|contact avec (les )?(denrees|aliments)|food contact|food grade|nsf ?h1|nsf ?h2|nsf ?3h|1935\/2004|qualite alimentaire|alimentarite)/.test(l)) return;
    if (/(nsf ?h2|non (agree|homologue|autorise|adapte|apte)|pas (de )?contact|ne (doit|peut) pas|interdit|not (suitable|approved|for food))/.test(l)) neg = true; else pos = true;
  });
  return neg ? 'non' : pos ? 'oui' : '';
}

/* ---------- fiche récapitulative des produits de maintenance ---------- */
const RECAP_MAINT_COLS = [['nom', 'Produit'], ['fournisseur', 'Fournisseur'], ['fabricant', 'Fabricant'], ['reference', 'Référence'], ['usage', 'Usage'], ['contactAlimentaire', 'Apte au contact alimentaire'],
  ['caveVinif', 'Utilisation en cave de vinification'], ['composition', 'Composition'], ['stockage', 'Stockage'], ['stock', 'Stock actuel'], ['seuil', 'Stock minimal'], ['fds', 'FDS'], ['ft', 'Fiche technique'], ['champs', 'Champs personnalisés'], ['notes', 'Notes']];
const RECAP_MAINT_DEFAUT = ['nom', 'fournisseur', 'usage', 'contactAlimentaire', 'caveVinif', 'stock', 'fds'];
function recapMaintenance(db, cols, o = {}) {
  const C = RECAP_MAINT_COLS.filter(([k]) => (cols || RECAP_MAINT_DEFAUT).includes(k)); const auj = o.today || todayISO();
  const P = produitsMaint(db).filter((p) => o.inactifs || p.actif !== false).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const lignes = P.map((p) => {
    const v = { nom: p.nom, fournisseur: p.fournisseur || '', fabricant: p.fabricant || '', reference: p.reference || '', usage: p.usage || '', contactAlimentaire: onLib(p.contactAlimentaire), caveVinif: onLib(p.caveVinif),
      composition: p.composition || '', stockage: p.stockage || '', stock: p.suiviStock ? `${fmt(maintStock(db, p.id), 2)} ${p.unite || 'u'}` : 'non suivi', seuil: p.suiviStock && hasNum(p.seuil) ? `${fmt(p.seuil, 2)} ${p.unite || 'u'}` : '',
      fds: maintFdsEtat(db, p, auj).label, ft: maintFtEtat(db, p).label, champs: (p.champs || []).map((c) => `${c.label} : ${c.valeur}`).join(' ; '), notes: p.notes || '' };
    return { id: p.id, cells: C.map(([k]) => v[k]) };
  });
  return { entetes: C.map((c) => c[1]), cles: C.map((c) => c[0]), lignes };
}
