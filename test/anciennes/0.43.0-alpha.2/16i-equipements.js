/* ============ ÉQUIPEMENTS ET MAINTENANCE (0.28.0-alpha.1) ============
   Onglet « Équipements » : le parc (une fiche par matériel), sa maintenance (plan et interventions : mêmes données que dans l'Hygiène
   depuis la 0.26.0-alpha.1), ses vérifications périodiques (bascules et balances, instruments de mesure, extincteurs…) et ses documents.
   Les fiches complètent les éléments de la liste « Équipements » : db.lists.equipements [{ id, label, pressoir?, balance?,
   categorie, marque, modele, numSerie, annee, fournisseur, siteId, emplacement, etat ('service' | 'arret' | 'reforme'),
   garantieJusquau, verif { periodeMois, derniere, valideJusquau, organisme }, champs [{ label, valeur }], notes }]
   (une version antérieure garde ces champs sans les montrer ; la vignette d'une bascule reste dans balance.valideJusquau et fait foi). */
const EQUIP_CATEGORIES = [['pressoir', 'Pressoirs'], ['reception', 'Réception de vendange'], ['transfert', 'Pompes, tuyaux et raccords'], ['filtration', 'Filtration'], ['froid', 'Froid et thermorégulation'], ['cuverie', 'Matériel de cuverie'], ['tirage', 'Tirage et remuage'], ['degorgement', 'Dégorgement et habillage'], ['mesure', 'Pesage et instruments de mesure'], ['nettoyage', 'Matériel de nettoyage'], ['securite', 'Sécurité (extincteurs, détection du CO₂)'], ['levage', 'Levage et manutention'], ['autre', 'Autre matériel']];
const EQUIP_ETATS = [['service', 'En service'], ['arret', 'À l’arrêt'], ['reforme', 'Réformé']];
hygListeDeclarer({ key: 'equipCategories', titre: 'Catégories d’équipements', aide: 'Familles du parc de matériel (filtres et regroupements de l’onglet Équipements).', L: EQUIP_CATEGORIES, groupe: 'equipements', special: ['autre'] }); // « Autre matériel » reste en dernier
// catégorie : choisie sur la fiche, sinon devinée d'après le nom
function equipCategorie(e) {
  if (!e) return 'autre'; if (e.categorie && EQUIP_CATEGORIES.some((c) => c[0] === e.categorie)) return e.categorie;
  if (estPressoir(e)) return 'pressoir'; if (estBalance(e)) return 'mesure';
  const n = norm(e.label || '');
  const R = [[/pompe|tuyau|raccord/, 'transfert'], [/filtr/, 'filtration'], [/froid|groupe|thermo|echangeur/, 'froid'], [/tireuse|gyro|remu|caisse a remu/, 'tirage'], [/degorg|habill|etiquet|bouch|museleu|dosage/, 'degorgement'],
    [/extinct|co2|detect/, 'securite'], [/chariot|transpal|levage|palan/, 'levage'], [/laveu|nettoy|haute pression|karcher/, 'nettoyage'], [/refracto|thermom|densim|ph-?m|balance|bascule|aerometre/, 'mesure'], [/conquet|benne|tapis|tremie|maie|quai/, 'reception'], [/agitat|cuve|chapeau|soutir/, 'cuverie']];
  const r = R.find(([re]) => re.test(n)); return r ? r[1] : 'autre';
}
// tâches de l'onglet Équipements : maintenance du plan (échéances, pannes) et vérifications périodiques
function equipTaches(db, today) { const t = today || todayISO(); let T = []; try { T = planTaches(db, t).filter((x) => x.origine === 'maintenance'); } catch (e) { T = []; } return [...T, ...equipAlertes(db, t)]; }
// vérification périodique (métrologie) : la vignette d'une bascule reste dans balance.valideJusquau
function equipVerif(e, today) {
  const v = { ...((e && e.verif) || {}) }; if (e && e.balance && isoOK(e.balance.valideJusquau)) v.valideJusquau = e.balance.valideJusquau; // vignette de la bascule (Pressoir › Réglages, versions antérieures) : elle fait foi
  if (!v.valideJusquau && isoOK(v.derniere) && num(v.periodeMois) > 0) v.valideJusquau = maintAjout(v.derniere, { n: num(v.periodeMois), unite: 'mois' });
  const t = today || todayISO(); const d = isoOK(v.valideJusquau) ? v.valideJusquau : '';
  const k = !d ? (num(v.periodeMois) > 0 || (e && estBalance(e)) ? 'inconnue' : 'aucune') : t > d ? 'retard' : daysBetween(t, d) <= 30 ? 'bientot' : 'ok';
  return { ...v, valideJusquau: d, k };
}
// panne en cours (intervention curative ouverte) sur ce matériel
const equipPannes = (db, id) => (db.maintenance || []).filter((m) => m && m.statut === 'ouverte' && (m.equipementId === id || (m.entreeId && maintEquipements(db, (planMaintenance(db).find((x) => x.id === m.entreeId) || {})).some((c) => c.id === id) && !m.equipementId)));
// lignes du plan de maintenance qui couvrent ce matériel, et leur état
const equipPlan = (db, id, today) => planMaintenance(db).filter((e) => e && e.actif !== false && maintEquipements(db, e).some((c) => c.id === id)).map((e) => ({ e, s: maintEtat(db, e, today) }));
// interventions sur ce matériel (directes, ou par une ligne du plan qui le couvre seul)
function equipInterventions(db, id) {
  const lignes = new Set(planMaintenance(db).filter((e) => e && maintEquipements(db, e).length === 1 && maintEquipements(db, e)[0].id === id).map((e) => e.id));
  return (db.maintenance || []).filter((m) => m && (m.equipementId === id || (!m.equipementId && lignes.has(m.entreeId)))).sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
// état d'un matériel : réformé, à l'arrêt, en panne, maintenance ou vérification en retard, à prévoir, en ordre
function equipEtat(db, e, today) {
  const t = today || todayISO(); const pannes = equipPannes(db, e.id); const plan = equipPlan(db, e.id, t); const verif = equipVerif(e, t);
  const retard = plan.filter((x) => x.s.etat === 'retard'); const bientot = plan.filter((x) => x.s.etat === 'bientot');
  const k = e.etat === 'reforme' ? 'reforme' : pannes.length ? 'panne' : e.etat === 'arret' ? 'arret' : retard.length || verif.k === 'retard' ? 'retard' : bientot.length || verif.k === 'bientot' ? 'bientot' : 'ok';
  return { k, pannes, plan, verif, retard, bientot };
}
const EQUIP_ETAT_TXT = { reforme: 'réformé', panne: 'en panne', arret: 'à l’arrêt', retard: 'en retard', bientot: 'à prévoir', ok: 'en ordre' };
function equipementsListe(db, today) {
  return equipementsDe(db).filter((e) => e && e.id).map((e) => ({ e, cat: equipCategorie(e), ...equipEtat(db, e, today) }));
}
// vérifications périodiques échues ou proches (la maintenance due et les pannes sont dans les tâches du plan de maintenance)
function equipAlertes(db, today) {
  const t = today || todayISO(); const out = [];
  equipementsListe(db, t).filter((x) => x.k !== 'reforme' && x.e.etat !== 'arret').forEach((x) => {
    if (x.verif.k === 'retard') out.push({ cle: `eq:verif:${x.e.id}:${x.verif.valideJusquau}`, equipementId: x.e.id, etat: 'retard', origine: 'verif', msg: `${x.e.label} — vérification périodique échue depuis le ${fmtDate(x.verif.valideJusquau)}.` });
    else if (x.verif.k === 'bientot') out.push({ cle: `eq:verif:${x.e.id}:${x.verif.valideJusquau}`, equipementId: x.e.id, etat: 'afaire', origine: 'verif', msg: `${x.e.label} — vérification périodique à faire avant le ${fmtDate(x.verif.valideJusquau)}.` });
  });
  return out;
}
function equipementSave(db, id, s) {
  if (!Array.isArray(db.lists.equipements)) db.lists.equipements = [];
  const L = db.lists.equipements; const e0 = id ? L.find((x) => x && x.id === id) : null; if (id && !e0) return fail('Équipement introuvable.');
  const nom = String((s && s.label) != null ? s.label : (e0 ? e0.label : '')).trim().slice(0, 120); if (!nom) return fail('Indiquez le nom de l’équipement.');
  if (L.some((x) => x && x.id !== id && norm(x.label) === norm(nom))) return fail(`L’équipement « ${nom} » existe déjà.`);
  const T = (k, n) => String((s && s[k]) || '').trim().slice(0, n);
  if (s && s.garantieJusquau && !isoValide(s.garantieJusquau)) return fail('Date de fin de garantie invalide.');
  const v = s && s.verif ? s.verif : null;
  if (v && ((v.derniere && !isoValide(v.derniere)) || (v.valideJusquau && !isoValide(v.valideJusquau)))) return fail('Date de vérification invalide.');
  const item = { label: nom };
  if (s && s.categorie !== undefined) item.categorie = EQUIP_CATEGORIES.some((c) => c[0] === s.categorie) ? s.categorie : 'autre';
  ['marque', 'modele', 'numSerie', 'fournisseur', 'emplacement'].forEach((k) => { if (s && s[k] !== undefined) item[k] = T(k, 120); });
  if (s && s.annee !== undefined) item.annee = T('annee', 10);
  if (s && s.notes !== undefined) item.notes = T('notes', 1500);
  if (s && s.siteId !== undefined) item.siteId = (db.sites || []).some((x) => x.id === s.siteId) ? s.siteId : '';
  if (s && s.etat !== undefined) item.etat = EQUIP_ETATS.some((x) => x[0] === s.etat) ? s.etat : 'service';
  if (s && s.garantieJusquau !== undefined) item.garantieJusquau = isoOK(s.garantieJusquau) ? s.garantieJusquau : '';
  if (v) item.verif = { periodeMois: num(v.periodeMois) > 0 ? Math.min(240, Math.round(num(v.periodeMois))) : 0, derniere: isoOK(v.derniere) ? v.derniere : '', valideJusquau: isoOK(v.valideJusquau) ? v.valideJusquau : '', organisme: String(v.organisme || '').trim().slice(0, 120) };
  if (s && Array.isArray(s.champs)) item.champs = s.champs.filter((c) => c && String(c.label || '').trim()).slice(0, 30).map((c) => ({ label: String(c.label).trim().slice(0, 60), valeur: String(c.valeur == null ? '' : c.valeur).trim().slice(0, 300) }));
  if (e0) {
    Object.assign(e0, item); // champs inconnus (version plus récente), réglages du pressoir et de la bascule gardés
    if (item.verif && estBalance(e0)) { e0.balance = { ...(e0.balance || {}) }; if (item.verif.valideJusquau) e0.balance.valideJusquau = item.verif.valideJusquau; else delete e0.balance.valideJusquau; }
    return okr({ id });
  }
  const nid0 = nid(db, 'eq'); const e = { id: nid0, ...item };
  if ((item.categorie === 'pressoir' || /^pressoir/i.test(nom)) && !e.pressoir) e.pressoir = { capaciteKg: capaciteDeLibelle(nom) || 4000, agrement: 'qualitatif', h24: false };
  if (item.categorie === 'mesure' && /^(balance|bascule|pont[- ]bascule)/i.test(norm(nom).trim())) e.balance = { ...(item.verif && item.verif.valideJusquau ? { valideJusquau: item.verif.valideJusquau } : {}) };
  L.push(e); return okr({ id: nid0 });
}
// suppression : seulement un matériel jamais utilisé (sinon : « Réformé », l'historique reste lisible)
function equipementSupprimer(db, id) {
  const e = equipementsDe(db).find((x) => x && x.id === id); if (!e) return fail('Équipement introuvable.');
  const n = (typeof listUsage === 'function' ? listUsage(db, 'equipements', id) : 0) + (db.maintenance || []).filter((m) => m && m.equipementId === id).length + planMaintenance(db).filter((x) => x && (x.equipementIds || []).includes(id)).length + (db.docs || []).filter((d) => d && d.cible && d.cible.type === 'equipement' && d.cible.id === id).length;
  if (n) return fail(`Matériel utilisé ${n} fois : passez-le en « Réformé » (son historique reste lisible).`);
  db.lists.equipements = equipementsDe(db).filter((x) => x.id !== id); return okr();
}
// historique d'un matériel : interventions, nettoyages, opérations où il a servi, documents
function equipHistorique(db, id) {
  return {
    interventions: equipInterventions(db, id),
    hygiene: (db.hygiene || []).filter((h) => h && h.cibleType === 'equipement' && h.cibleId === id).sort((a, b) => String(b.date).localeCompare(String(a.date))),
    ops: (db.ops || []).filter((o) => o && (o.equipementId === id || (o.equipementIds || []).includes(id))).sort((a, b) => String(b.date).localeCompare(String(a.date))),
    docs: (db.docs || []).filter((d) => d && d.cible && ((d.cible.type === 'equipement' && d.cible.id === id) || (d.cible.type === 'maintenance' && equipInterventions(db, id).some((m) => m.id === d.cible.id)))),
  };
}
