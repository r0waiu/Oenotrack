/* ============ ASSISTANT IA — USAGES, NIVEAUX DE DONNÉES, JOURNAL, IMAGES, RÉPONSES CONTRÔLÉES (0.49.0-alpha.1) ============
   Socle validé par l'exploitation (audit IA : S1 à S5) :
   - S2 : chaque usage de l'IA a son interrupteur (sur cet appareil : oenotrack-ia › usages), son niveau de données (IA_NIVEAUX) et,
     pour le niveau 2 (données de l'exploitation), un aperçu de ce qui part avant le premier envoi (consentement par usage :
     oenotrack-ia › consentements) ; journal local des envois (oenotrack-ia-journal : date, usage, niveau, service, modèle, taille,
     images ; jamais le contenu), consultable et effaçable dans Paramètres › Assistant IA ;
   - S3 : l'administrateur peut réserver le niveau 2 à un modèle installé sur l'ordinateur (db.settings.ia.niveau2 = 'local' :
     service « compatible OpenAI » à une adresse locale — localhost, 127.0.0.1, ::1, *.local, réseau privé) ;
   - S1 : images envoyées au service (vision) : iaRequete reçoit o.images = [{ type, data (base64) }] ;
   - S5 : réponse au format imposé (schéma JSON demandé au service quand il le permet, toujours rappelé dans les consignes) puis
     contrôlée par iaSchemaValider : une réponse hors schéma est refusée, jamais devinée ;
   - S4 : l'IA ne fait que proposer ; ce qui est enregistré après relecture garde la trace iaTraceNorm → { usage, modele, fournisseur, le }
     (champ « ia » d'une opération, d'un arrivage, d'une pesée… ; ignoré par les versions antérieures, jamais recalculé).
   Rien de ce fichier n'écrit dans la base. */
const IA_NIVEAUX = [
  { n: 0, court: 'Niveau 0', label: 'Rien de l’exploitation' },
  { n: 1, court: 'Niveau 1', label: 'Un document ou une photo' },
  { n: 2, court: 'Niveau 2', label: 'Données de l’exploitation' },
];
// usages : id, nom, niveau, module (droit de l'interface), envoie (ce qui part, en clair pour l'aperçu et les réglages)
const IA_USAGES = [
  { id: 'identifier', nom: 'Identifier un document fournisseur', niveau: 1, module: 'intrants', envoie: 'Le début du texte du document et la liste des noms de produits.' },
  { id: 'completer', nom: 'Compléter la fiche d’un intrant (FT, FDS, certificat)', niveau: 1, module: 'intrants', envoie: 'Le texte du document et le nom du produit.' },
  { id: 'veille', nom: 'Veille en ligne des FT et FDS', niveau: 0, module: 'intrants', envoie: 'Le nom du produit, son fournisseur, sa référence et les dates des fiches.' },
  { id: 'bulletins', nom: 'Lire un bulletin d’analyses', niveau: 1, module: 'analyses', envoie: 'Le texte ou l’image du bulletin et les noms des paramètres d’analyse.' },
  { id: 'catalogue', nom: 'Relever un catalogue fournisseur', niveau: 1, module: 'intrants', envoie: 'Le texte du catalogue.' },
  { id: 'cahier', nom: 'Relever un cahier des charges', niveau: 1, module: 'intrants', envoie: 'Le texte du cahier des charges.' },
  { id: 'fdsHygiene', nom: 'Lire la FDS d’un produit d’hygiène', niveau: 1, module: 'hygiene', envoie: 'Le texte de la FDS.' },
  { id: 'saisie', nom: 'Saisie dictée ou tapée en langage courant', niveau: 2, module: 'ops', envoie: 'La phrase, les noms des opérations du catalogue, des contenants et des produits en stock.' },
  { id: 'ficheRelue', nom: 'Relire une fiche papier remplie au chai', niveau: 2, module: 'previsions', envoie: 'La photo de la fiche (cuves, lots et volumes qui y figurent) et la structure de la fiche.' },
  { id: 'fermentation', nom: 'Expliquer une alerte de fermentation', niveau: 2, module: 'cuverie', envoie: 'Les points de la courbe (densité, température, dates) et les intrants du lot, sans code de lot ni nom de cuve.' },
  { id: 'reception', nom: 'Photo d’un sac ou d’un bidon à la réception', niveau: 1, module: 'intrants', envoie: 'La photo de l’étiquette et la liste des noms de produits.' },
  { id: 'pesee', nom: 'Ticket de pesée, bon de livraison, DAE', niveau: 2, module: 'pressoir', envoie: 'Le document ou sa photo, les noms des apporteurs, crus, parcelles et cépages.' },
  { id: 'baremes', nom: 'Barèmes de jaugeage difficiles à lire', niveau: 1, module: 'cuverie', envoie: 'Les pages du certificat de jaugeage.' },
  { id: 'planProtocole', nom: 'Plan de vinification depuis un protocole', niveau: 1, module: 'plan', envoie: 'Le document du protocole.' },
  { id: 'composes', nom: 'Composés actifs d’un produit', niveau: 1, module: 'intrants', envoie: 'Le texte de la fiche technique et la liste des composés connus.' },
  { id: 'veilleTextes', nom: 'Veille des textes réglementaires', niveau: 0, module: 'intrants', envoie: 'Les noms et références des textes du référentiel.' },
  { id: 'audit', nom: 'Préparer un audit', niveau: 2, module: 'trace', envoie: 'Les points de contrôle, réponses, pièces et notes de l’audit.' },
  { id: 'aide', nom: 'Assistant « Comment faire… ? »', niveau: 0, module: null, envoie: 'La question et la documentation d’Œnotrack.' },
  { id: 'traceRecherche', nom: 'Recherche de traçabilité en langage courant', niveau: 0, module: 'trace', envoie: 'La question et la liste des filtres possibles ; jamais les résultats.' },
  { id: 'histoireLot', nom: 'Histoire d’un lot rédigée', niveau: 2, module: 'cuverie', envoie: 'La chaîne de traçabilité du lot (étapes, volumes, intrants, dates).' },
  { id: 'codification', nom: 'Règle de codification dictée', niveau: 0, module: 'params', envoie: 'La phrase et les noms des tables de codification.' },
  { id: 'configuration', nom: 'Configuration guidée depuis une description', niveau: 0, module: 'params', envoie: 'La description saisie et la liste des questions.' },
  { id: 'planNettoyage', nom: 'Plan de nettoyage proposé', niveau: 0, module: 'hygiene', envoie: 'Les types d’équipements et de contenants, les noms des produits d’hygiène.' },
  { id: 'bulletinCommentaire', nom: 'Commentaire d’un bulletin d’analyses', niveau: 2, module: 'analyses', envoie: 'Les résultats du bulletin, le stade et la revendication du lot.' },
];
const iaUsageDef = (id) => IA_USAGES.find((u) => u.id === id) || null;
// usage activé sur cet appareil ? (niveau 0 et 1 : oui par défaut ; niveau 2 : non par défaut) ; anciens réglages « completer » et « bulletins » repris
function iaUsageActif(c, id) {
  const u = iaUsageDef(id); if (!u) return false; const U = (c && c.usages && typeof c.usages === 'object') ? c.usages : {};
  if (typeof U[id] === 'boolean') return U[id];
  if (id === 'completer' && c && c.completer === false) return false; if (id === 'bulletins' && c && c.bulletins === false) return false;
  return u.niveau < 2;
}
// adresse d'un service installé sur l'ordinateur ou le réseau de l'exploitation
function iaAdresseLocale(url) {
  let h = ''; try { h = new URL(String(url || '')).hostname.toLowerCase().replace(/^\[|\]$/g, ''); } catch (e) { return false; }
  return h === 'localhost' || h === '::1' || /^127\./.test(h) || /\.local$/.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h);
}
const iaServiceLocal = (c) => !!c && c.fournisseur === 'perso' && iaAdresseLocale(c.url);
// niveau 2 réservé au modèle local (réglage de l'administrateur, db.settings.ia.niveau2 = 'local')
const IA_NIVEAU2 = ['tous', 'local'];
const iaNiveau2Reglage = (db) => { const s = db && db.settings && db.settings.ia; return s && s.niveau2 === 'local' ? 'local' : 'tous'; };
function iaNiveau2Set(db, v, uid) {
  if (!IA_NIVEAU2.includes(v)) return fail('Réglage du niveau 2 inconnu.');
  db.settings.ia = { ...((db.settings && db.settings.ia) || {}), niveau2: v, niveau2Par: uid || '', niveau2Le: new Date().toISOString() }; return okr();
}
// l'usage peut-il partir vers ce service ? → '' ou la raison du refus
function iaUsageRefus(c, id, regleNiveau2) {
  const u = iaUsageDef(id); if (!u) return 'Usage de l’IA inconnu.';
  if (!c || !c.pret) return 'Assistant IA non configuré : Paramètres › 🤖 Assistant IA (service et clé API).';
  if (!iaUsageActif(c, id)) return `« ${u.nom} » est désactivé sur cet appareil (Paramètres › 🤖 Assistant IA › Usages).`;
  if (u.niveau === 2 && regleNiveau2 === 'local' && !iaServiceLocal(c)) return `« ${u.nom} » envoie des données de l’exploitation : votre administrateur le réserve à un modèle installé sur l’ordinateur (service compatible OpenAI à une adresse locale).`;
  return '';
}
// consentement (niveau 2) : demandé avant le premier envoi de chaque usage, gardé sur cet appareil
const iaConsentRequis = (c, id) => { const u = iaUsageDef(id); return !!u && u.niveau === 2 && !(c && c.consentements && c.consentements[id]); };

/* ---------- journal local des envois (jamais le contenu) ---------- */
const IA_JOURNAL_KEY = 'oenotrack-ia-journal'; const IA_JOURNAL_MAX = 300;
function iaJournalLire() { try { const L = JSON.parse(window.localStorage.getItem(IA_JOURNAL_KEY) || '[]'); return Array.isArray(L) ? L.filter((x) => x && typeof x === 'object') : []; } catch (e) { return []; } }
function iaJournalAjouter(e) {
  const x = { le: new Date().toISOString(), usage: String(e.usage || ''), niveau: Number(e.niveau) || 0, fournisseur: String(e.fournisseur || ''), modele: String(e.modele || ''), local: !!e.local, taille: Math.max(0, Math.round(Number(e.taille) || 0)), images: Math.max(0, Math.round(Number(e.images) || 0)), ok: e.ok !== false, erreur: e.ok === false ? String(e.erreur || '').slice(0, 160) : '' };
  try { const L = [x, ...iaJournalLire()].slice(0, IA_JOURNAL_MAX); window.localStorage.setItem(IA_JOURNAL_KEY, JSON.stringify(L)); } catch (er) { /* stockage indisponible : rien n'est gardé */ }
  return x;
}
const iaJournalVider = () => { try { window.localStorage.removeItem(IA_JOURNAL_KEY); } catch (e) { /* ignoré */ } };

/* ---------- S1 : images (vision) ---------- */
const IA_IMAGES_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IA_IMAGES_MAX = 8; const IA_IMAGE_MAX_OCTETS = 5 * 1024 * 1024;
// images acceptées : type d'image connu, base64 sans en-tête, taille raisonnable ; au plus IA_IMAGES_MAX
function iaImagesNorm(L) {
  return (Array.isArray(L) ? L : []).filter((i) => i && IA_IMAGES_TYPES.includes(i.type) && typeof i.data === 'string' && /^[A-Za-z0-9+/=]+$/.test(i.data.slice(0, 200)) && i.data.length * 0.75 <= IA_IMAGE_MAX_OCTETS).slice(0, IA_IMAGES_MAX).map((i) => ({ type: i.type, data: i.data }));
}
// contenu « utilisateur » au format de chaque service (texte + images)
function iaContenuImages(fid, texte, images) {
  const I = iaImagesNorm(images); if (!I.length) return null; const uri = (i) => `data:${i.type};base64,${i.data}`;
  if (fid === 'anthropic') return [...I.map((i) => ({ type: 'image', source: { type: 'base64', media_type: i.type, data: i.data } })), { type: 'text', text: texte }];
  if (fid === 'openai') return [{ type: 'input_text', text: texte }, ...I.map((i) => ({ type: 'input_image', image_url: uri(i) }))];
  if (fid === 'gemini') return [{ text: texte }, ...I.map((i) => ({ inline_data: { mime_type: i.type, data: i.data } }))];
  if (fid === 'mistral') return [{ type: 'text', text: texte }, ...I.map((i) => ({ type: 'image_url', image_url: uri(i) }))];
  return [{ type: 'text', text: texte }, ...I.map((i) => ({ type: 'image_url', image_url: { url: uri(i) } }))]; // OpenRouter, service compatible OpenAI
}

/* ---------- S5 : réponses au format imposé ---------- */
// sous-ensemble de JSON Schema : type (object, array, string, number, integer, boolean, null ou liste), properties, required, items,
// enum, maxLength, minimum, maximum, maxItems, nullable ; propriétés inconnues retirées ; nombres écrits « 3,5 » acceptés
function iaSchemaValider(schema, v, chemin) {
  const ch = chemin || 'réponse'; const S = schema || {}; const err = [];
  const types = Array.isArray(S.type) ? S.type : S.type ? [S.type] : [];
  if (v == null) { if (S.nullable || types.includes('null') || !types.length) return { ok: true, valeur: null, erreurs: [] }; return { ok: false, valeur: null, erreurs: [`${ch} : valeur absente`] }; }
  const essais = types.length ? types.filter((t) => t !== 'null') : [typeof v === 'object' ? (Array.isArray(v) ? 'array' : 'object') : typeof v];
  for (const t of essais) {
    if (t === 'object' && typeof v === 'object' && !Array.isArray(v)) {
      const P = S.properties || {}; const out = {}; const e2 = [];
      (S.required || []).forEach((k) => { if (!(k in v) || v[k] == null) { if (!(P[k] && (P[k].nullable || [].concat(P[k].type || []).includes('null')))) e2.push(`${ch}.${k} : obligatoire`); } });
      Object.keys(P).forEach((k) => { if (!(k in v)) return; const r = iaSchemaValider(P[k], v[k], `${ch}.${k}`); if (r.ok) out[k] = r.valeur; else e2.push(...r.erreurs); });
      if (!e2.length) return { ok: true, valeur: out, erreurs: [] }; err.push(...e2); continue;
    }
    if (t === 'array' && Array.isArray(v)) {
      const L = S.maxItems ? v.slice(0, S.maxItems) : v; const out = []; const e2 = [];
      L.forEach((x, i) => { const r = iaSchemaValider(S.items || {}, x, `${ch}[${i}]`); if (r.ok) out.push(r.valeur); else e2.push(...r.erreurs); });
      if (!e2.length) return { ok: true, valeur: out, erreurs: [] }; err.push(...e2.slice(0, 6)); continue;
    }
    if (t === 'string' && (typeof v === 'string' || typeof v === 'number')) {
      let s = String(v); if (S.maxLength) s = s.slice(0, S.maxLength);
      if (S.enum && !S.enum.includes(s)) { err.push(`${ch} : valeur « ${s.slice(0, 40)} » hors liste`); continue; }
      return { ok: true, valeur: s, erreurs: [] };
    }
    if ((t === 'number' || t === 'integer') && (typeof v === 'number' || (typeof v === 'string' && /^\s*-?\d+(?:[.,]\d+)?\s*$/.test(v)))) {
      const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.').trim());
      if (!Number.isFinite(n) || (t === 'integer' && !Number.isInteger(n))) { err.push(`${ch} : nombre attendu`); continue; }
      if ((S.minimum != null && n < S.minimum) || (S.maximum != null && n > S.maximum)) { err.push(`${ch} : ${n} hors bornes`); continue; }
      if (S.enum && !S.enum.includes(n)) { err.push(`${ch} : valeur hors liste`); continue; }
      return { ok: true, valeur: n, erreurs: [] };
    }
    if (t === 'boolean' && typeof v === 'boolean') return { ok: true, valeur: v, erreurs: [] };
    err.push(`${ch} : ${t} attendu`);
  }
  return { ok: false, valeur: null, erreurs: err.length ? err : [`${ch} : type inattendu`] };
}
// consignes ajoutées au message système : répondre par un objet JSON conforme au schéma, rien autour
const iaSchemaConsigne = (schema) => `\n\nRéponds uniquement par un objet JSON valide, sans texte autour, conforme à ce schéma JSON :\n${JSON.stringify(schema)}\nSi une information manque, mets null plutôt que de l’inventer.`;
// format de réponse demandé au service quand il le permet (contrôlé ensuite de toute façon)
function iaFormatReponse(fid, schema, nom) {
  if (!schema) return {};
  if (fid === 'openai') return { text: { format: { type: 'json_schema', name: String(nom || 'reponse').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 60), schema, strict: false } } };
  if (fid === 'gemini') return { generationConfig: { responseMimeType: 'application/json' } };
  if (fid === 'mistral' || fid === 'openrouter' || fid === 'perso') return { response_format: { type: 'json_object' } };
  return {};
}

/* ---------- S4 : trace de ce que l'IA a proposé ---------- */
function iaTraceNorm(t) {
  if (!t || typeof t !== 'object') return null; const u = iaUsageDef(t.usage); if (!u) return null;
  const le = typeof t.le === 'string' && !Number.isNaN(Date.parse(t.le)) ? t.le : new Date().toISOString();
  return { usage: u.id, modele: String(t.modele || '').slice(0, 120), fournisseur: String(t.fournisseur || '').slice(0, 40), le, ...(t.local ? { local: true } : {}) };
}
const iaTraceTexte = (t) => { const x = iaTraceNorm(t); if (!x) return ''; const u = iaUsageDef(x.usage); return `Proposé par l’IA (${u.nom}${x.modele ? ` · ${x.modele}` : ''}) puis relu et validé`; };

/* ---------- appel d'un usage ---------- */
// o = { system, texte, images, schema, nom, web, max, signal, consenti } ; ctx = { db } (réglage niveau 2)
// → { ok, valeur, erreurs, texte, sources, trace } ; lève { usage | consentement | config | statut… , message }
async function iaUsage(id, o, ctx) {
  const u = iaUsageDef(id); const c = iaActive(); const db = (ctx && ctx.db) || null;
  const regle = db ? iaNiveau2Reglage(db) : ((typeof _iaEspace !== 'undefined' && _iaEspace && _iaEspace.reglage && _iaEspace.reglage.niveau2) || 'tous');
  const refus = iaUsageRefus(c, id, regle); if (refus) throw { usage: true, message: refus };
  if (iaConsentRequis(iaConfigLire(), id) && !(o && o.consenti)) throw { consentement: true, usage: id, message: `« ${u.nom} » envoie des données de l’exploitation : voyez ce qui part avant le premier envoi.` };
  const images = iaImagesNorm(o && o.images); const schema = o && o.schema;
  const system = `${(o && o.system) || ''}${schema ? iaSchemaConsigne(schema) : ''}`;
  const P = { ...(o || {}), system, images, format: iaFormatReponse(c.fournisseur, schema, o && o.nom) };
  const taille = system.length + String((o && o.texte) || '').length + images.reduce((s, i) => s + Math.round(i.data.length * 0.75), 0);
  let R;
  try { R = await iaDemander(c, P); }
  catch (e) { iaJournalAjouter({ usage: id, niveau: u.niveau, fournisseur: c.fournisseur, modele: c.modele, local: iaServiceLocal(c), taille, images: images.length, ok: false, erreur: e && e.message }); throw e; }
  iaJournalAjouter({ usage: id, niveau: u.niveau, fournisseur: c.fournisseur, modele: c.modele, local: iaServiceLocal(c), taille, images: images.length, ok: true });
  const trace = iaTraceNorm({ usage: id, modele: c.modele, fournisseur: c.fournisseur, local: iaServiceLocal(c) });
  if (!schema) return { ok: true, valeur: null, erreurs: [], texte: R.texte, sources: R.sources, trace };
  let obj = null; try { obj = iaJson(R.texte); } catch (e) { obj = null; }
  if (!obj) return { ok: false, valeur: null, erreurs: ['La réponse n’est pas un objet JSON lisible.'], texte: R.texte, sources: R.sources, trace };
  const v = iaSchemaValider(schema, obj);
  return { ok: v.ok, valeur: v.ok ? v.valeur : null, erreurs: v.erreurs, texte: R.texte, sources: R.sources, trace };
}
