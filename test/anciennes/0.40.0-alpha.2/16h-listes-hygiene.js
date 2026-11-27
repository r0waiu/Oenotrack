/* ============ LISTES DE L'HYGIÈNE PERSONNALISABLES (0.27.0-alpha.2) ============
   Contrôles après rinçage (avec le résultat attendu), zones et dangers du plan de nettoyage, natures, formes, unités et concentrations
   des produits, protections individuelles, moments « consigne » du plan, types et résultats de maintenance :
   db.lists.<clé> [{ id, label, attendu?, masque?, perso? }].
   Les éléments d'origine gardent leur identifiant (les règles du plan et les modèles en dépendent) : renommables et masquables, jamais
   supprimés ; un élément ajouté se supprime tant qu'il ne sert pas. Les listes HYG_* / MAINT_* (paires [id, libellé, { masque, attendu }])
   sont recalculées depuis la base à chaque synchronisation (syncConfig), comme les échelles des crus et les revendications : un
   identifiant ajouté reste donc valide partout (enregistrement, contrôles). Une version antérieure garde ces listes sans les montrer. */
const HYG_MOMENTS = []; // moments « consigne » ajoutés (texte affiché dans le plan, sans alerte)
const HYG_LISTES_DEF = [
  { key: 'hygControles', titre: 'Contrôles après rinçage', aide: 'Moyens de vérifier le rinçage (papier pH, papier peroxyde, conductimètre, bandelette ATP…) et le résultat attendu, proposé dans le plan et le journal.', L: HYG_CONTROLES, attendu: true, special: ['aucun'] },
  { key: 'hygZones', titre: 'Zones du plan de nettoyage', L: HYG_ZONES },
  { key: 'hygDangers', titre: 'Dangers maîtrisés', L: HYG_DANGERS },
  { key: 'hygTypes', titre: 'Natures de produits d’hygiène', L: HYG_TYPES },
  { key: 'hygFormes', titre: 'Formes des produits', L: HYG_FORMES },
  { key: 'hygUnites', titre: 'Unités de stock des produits', L: HYG_UNITES },
  { key: 'hygConc', titre: 'Unités de concentration', L: HYG_CONC },
  { key: 'hygEpi', titre: 'Protections individuelles (EPI)', L: HYG_EPI },
  { key: 'hygMoments', titre: 'Moments personnalisés du plan', aide: 'Consignes de moment (« après chaque débourbage »…) proposées dans le plan de nettoyage, sans alerte automatique.', L: HYG_MOMENTS },
  { key: 'maintTypes', titre: 'Types d’intervention de maintenance', L: MAINT_TYPES },
  { key: 'maintResultats', titre: 'Résultats d’une intervention', L: MAINT_RESULTATS },
];
// listes d'origine : copie prise au chargement, avant toute synchronisation (les résultats attendus d'origine en plus pour les contrôles)
// groupe (0.28.0-alpha.1) : 'hygiene' (Hygiène › Listes), 'maintenance' et 'equipements' (Équipements › Listes quand l'onglet est actif)
function hygListePreparer(d) {
  d.groupe = d.groupe || (/^maint/.test(d.key) ? 'maintenance' : 'hygiene');
  d.origine = d.L.filter((x) => !(d.special || []).includes(x[0])).map((x) => [x[0], x[1], d.key === 'hygControles' && HYG_CONTROLE_ATTENDU[x[0]] ? { attendu: HYG_CONTROLE_ATTENDU[x[0]] } : {}]);
  d.speciaux = d.L.filter((x) => (d.special || []).includes(x[0])).map((x) => [...x]);
}
HYG_LISTES_DEF.forEach(hygListePreparer);
// autre liste personnalisable déclarée par un autre module (catégories d'équipements…)
function hygListeDeclarer(d) { if (!HYG_LISTES_DEF.some((x) => x.key === d.key)) { hygListePreparer(d); HYG_LISTES_DEF.push(d); } return d; }
const hygListeDef = (key) => HYG_LISTES_DEF.find((d) => d.key === key) || null;
// éléments d'une liste : ceux de la base dans leur ordre, puis les éléments d'origine qui y manquent
function hygListeItems(db, key) {
  const def = typeof key === 'string' ? hygListeDef(key) : key; if (!def) return [];
  const orig = def.origine.map(([id, label, x]) => ({ id, label, ...(x || {}), origine: true }));
  const brut = db && db.lists && Array.isArray(db.lists[def.key]) ? db.lists[def.key].filter((x) => x && typeof x.id === 'string' && x.id && !(def.special || []).includes(x.id)) : null;
  if (!brut) return orig;
  const vus = new Set(); const out = [];
  brut.forEach((x) => { if (vus.has(x.id)) return; vus.add(x.id); const o = def.origine.find((y) => y[0] === x.id); out.push({ ...x, label: String(x.label || (o && o[1]) || x.id), origine: !!o }); });
  orig.forEach((x) => { if (!vus.has(x.id)) out.push(x); });
  return out;
}
function syncHygieneListes(db) {
  HYG_LISTES_DEF.forEach((def) => {
    const items = hygListeItems(db, def);
    def.L.splice(0, def.L.length, ...items.map((x) => [x.id, x.label, { masque: !!x.masque, attendu: x.attendu || '' }]), ...def.speciaux.map((x) => [...x]));
    if (def.key === 'hygControles') { Object.keys(HYG_CONTROLE_ATTENDU).forEach((k) => { delete HYG_CONTROLE_ATTENDU[k]; }); items.forEach((x) => { if (x.attendu) HYG_CONTROLE_ATTENDU[x.id] = x.attendu; }); }
  });
}
// options d'une liste de choix : éléments visibles (+ la valeur actuelle, même masquée)
const hygOpts = (L, keep) => L.filter((x) => !(x[2] && x[2].masque) || x[0] === keep).map(([v, l]) => ({ value: v, label: l }));
// nombre d'utilisations d'un élément (un élément utilisé se masque, il ne se supprime pas)
function hygListeUsage(db, key, id) {
  const P = (db.produitsHygiene || []); const PN = (db.planNettoyage || []).filter(Boolean); const H = (db.hygiene || []).filter(Boolean);
  const lignesPlan = (k) => sum(PN, (e) => (e.produits || []).filter((p) => p && p[k] === id).length);
  switch (key) {
    case 'hygControles': return H.filter((h) => h.controle && h.controle.type === id).length + PN.filter((e) => e.controle === id).length;
    case 'hygZones': return PN.filter((e) => e.zone === id).length;
    case 'hygDangers': return PN.filter((e) => e.danger === id).length;
    case 'hygTypes': return P.filter((p) => p && p.type === id).length + lignesPlan('type');
    case 'hygFormes': return P.filter((p) => p && p.forme === id).length;
    case 'hygUnites': return P.filter((p) => p && p.unite === id).length + sum(H, (h) => (h.produits || []).filter((l) => l && l.unite === id).length);
    case 'hygConc': return P.filter((p) => p && p.concUnite === id).length + lignesPlan('concUnite') + sum(H, (h) => (h.produits || []).filter((l) => l && l.concUnite === id).length);
    case 'hygEpi': return P.filter((p) => p && (p.epi || []).includes(id)).length;
    case 'hygMoments': { const it = hygListeItems(db, key).find((x) => x.id === id); return PN.filter((e) => (e.quand || []).some((q) => q && q.type === 'texte' && (q.momentId === id || (it && q.texte === it.label)))).length; }
    case 'maintTypes': return (db.planMaintenance || []).filter((e) => e && e.type === id).length + (db.maintenance || []).filter((m) => m && m.type === id).length;
    case 'maintResultats': return (db.maintenance || []).filter((m) => m && m.resultat === id).length;
    case 'equipCategories': return ((db.lists && db.lists.equipements) || []).filter((e) => e && e.categorie === id).length;
    default: return 0;
  }
}
function hygListeEcrire(db, def, items) {
  db.lists = db.lists || {}; db.lists[def.key] = items.map(({ origine, ...x }) => { const o = { id: x.id, label: x.label }; if (x.attendu) o.attendu = x.attendu; if (x.masque) o.masque = true; if (x.perso) o.perso = true; Object.keys(x).forEach((k) => { if (!(k in o) && !['attendu', 'masque', 'perso'].includes(k)) o[k] = x[k]; }); return o; });
  syncHygieneListes(db); return okr();
}
function hygListeAjouter(db, key, label, extra) {
  const def = hygListeDef(key); if (!def) return fail('Liste inconnue.');
  const t = String(label || '').trim().slice(0, 120); if (!t) return fail('Saisissez le libellé.');
  const items = hygListeItems(db, def); if (items.some((x) => norm(x.label).trim() === norm(t).trim())) return fail(`« ${t} » existe déjà dans cette liste.`);
  const base = `${slug(t).slice(0, 28) || 'element'}`; let id = base; let k = 2;
  while (items.some((x) => x.id === id) || (def.special || []).includes(id) || def.origine.some((x) => x[0] === id)) { id = `${base}-${k}`; k += 1; }
  items.push({ id, label: t, perso: true, ...(def.attendu ? { attendu: String((extra && extra.attendu) || '').trim().slice(0, 120) } : {}) });
  hygListeEcrire(db, def, items); return okr({ id });
}
function hygListeModifier(db, key, id, patch) {
  const def = hygListeDef(key); if (!def) return fail('Liste inconnue.');
  const items = hygListeItems(db, def); const it = items.find((x) => x.id === id); if (!it) return fail('Élément introuvable.');
  if (patch.label !== undefined) {
    const t = String(patch.label || '').trim().slice(0, 120); if (!t) return fail('Le libellé ne peut pas être vide.');
    if (items.some((x) => x.id !== id && norm(x.label).trim() === norm(t).trim())) return fail(`« ${t} » existe déjà dans cette liste.`);
    if (key === 'hygMoments' && t !== it.label) (db.planNettoyage || []).forEach((e) => { (e && e.quand || []).forEach((q) => { if (q && q.type === 'texte' && (q.momentId === id || q.texte === it.label)) { q.texte = t; q.momentId = id; } }); });
    it.label = t;
  }
  if (patch.attendu !== undefined && def.attendu) it.attendu = String(patch.attendu || '').trim().slice(0, 120);
  if (patch.masque !== undefined) it.masque = !!patch.masque;
  return hygListeEcrire(db, def, items);
}
function hygListeSupprimer(db, key, id) {
  const def = hygListeDef(key); if (!def) return fail('Liste inconnue.');
  const items = hygListeItems(db, def); const it = items.find((x) => x.id === id); if (!it) return fail('Élément introuvable.');
  if (it.origine) return fail('Élément d’origine : masquez-le plutôt (il reste lisible dans l’historique).');
  const n = hygListeUsage(db, key, id); if (n) return fail(`Utilisé ${n} fois : masquez-le plutôt (l’historique le garde).`);
  return hygListeEcrire(db, def, items.filter((x) => x.id !== id));
}
function hygListeDeplacer(db, key, id, delta) {
  const def = hygListeDef(key); if (!def) return fail('Liste inconnue.');
  const items = hygListeItems(db, def); const i = items.findIndex((x) => x.id === id); if (i < 0) return fail('Élément introuvable.');
  const j = Math.max(0, Math.min(items.length - 1, i + delta)); if (j === i) return okr();
  const [x] = items.splice(i, 1); items.splice(j, 0, x); return hygListeEcrire(db, def, items);
}
