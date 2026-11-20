/* ============ ASSISTANT IA (alpha V2.1) : le service d'IA choisi par chaque utilisateur, avec SA propre clé API ============
   Œnotrack ne fournit ni IA ni clé. La clé est gardée dans ce navigateur seulement (localStorage « oenotrack-ia ») : jamais dans
   la base, la synchronisation, les sauvegardes ni le Drive. Les demandes partent directement de ce navigateur vers le service choisi.
   Ce qui est envoyé : pour identifier un document, le début de son texte et la liste des noms de produits ; pour la veille,
   le nom du produit, son fournisseur, sa référence et les dates des fiches jointes. Jamais les volumes, lots, analyses ni la traçabilité.
   Usages : (a) identifier un document fournisseur non reconnu ; (b) veille : trouver en ligne les dernières FT et FDS (recherche web du service). */
const IA_KEY = 'oenotrack-ia'; const IA_AUTO_KEY = 'oenotrack-ia-veille';
const IA_FOURNISSEURS = [
  { id: 'anthropic', nom: 'Claude (Anthropic)', court: 'Claude', modele: 'claude-sonnet-5-5', web: true, console: 'https://platform.claude.com/settings/keys', aide: 'Clé « sk-ant-… » créée dans la console Claude (platform.claude.com › API keys). Recherche et lecture de pages web incluses.' },
  { id: 'openai', nom: 'ChatGPT (OpenAI)', court: 'ChatGPT', modele: 'gpt-6.2-astra', web: true, console: 'https://platform.openai.com/api-keys', aide: 'Clé « sk-… » créée sur platform.openai.com (l’abonnement ChatGPT ne donne pas de clé API : le compte API se crédite à part).' },
  { id: 'gemini', nom: 'Gemini (Google)', court: 'Gemini', modele: 'gemini-3.8-flash', web: true, console: 'https://aistudio.google.com/apikey', aide: 'Clé créée dans Google AI Studio (aistudio.google.com › Get API key). Recherche Google incluse.' },
  { id: 'mistral', nom: 'Mistral AI (Le Chat)', court: 'Mistral', modele: 'mistral-medium-latest', web: true, console: 'https://console.mistral.ai/api-keys', aide: 'Clé créée dans la console Mistral (console.mistral.ai › API Keys). Si votre navigateur refuse la connexion directe, passez par OpenRouter avec un modèle « mistralai/… ».' },
  { id: 'openrouter', nom: 'OpenRouter (Claude, GPT, Gemini, Mistral, Llama… avec une seule clé)', court: 'OpenRouter', modele: 'openrouter/auto', web: true, console: 'https://openrouter.ai/keys', aide: 'Clé « sk-or-… » créée sur openrouter.ai › Keys. Modèle au choix, par exemple « mistralai/mistral-medium-3.1 » ou « anthropic/claude-sonnet-5.5 ».' },
  { id: 'perso', nom: 'Autre service compatible OpenAI (adresse à saisir)', court: 'Service IA', modele: '', web: false, console: '', aide: 'Adresse de base du service (ex. https://api.exemple.com/v1, ou http://localhost:11434/v1 pour un modèle installé sur cet ordinateur) ; clé facultative.' },
];
const iaFournisseur = (id) => IA_FOURNISSEURS.find((f) => f.id === id) || IA_FOURNISSEURS[0];
function iaConfigLire() { try { const c = JSON.parse(window.localStorage.getItem(IA_KEY) || 'null'); return c && typeof c === 'object' && !Array.isArray(c) ? c : {}; } catch (e) { return {}; } }
function iaConfigEcrire(c) { try { window.localStorage.setItem(IA_KEY, JSON.stringify(c || {})); return true; } catch (e) { return false; } }
// réglage effectif : service choisi, sa clé, son modèle, et si la recherche web est demandée
function iaActive(c0) {
  const c = c0 || iaConfigLire(); const f = iaFournisseur(c.fournisseur);
  const cle = String((c.cles || {})[f.id] || '').trim(); const modele = String((c.modeles || {})[f.id] || f.modele || '').trim();
  const url = f.id === 'perso' ? String(c.url || '').trim().replace(/\/+$/, '').replace(/\/chat\/completions$/, '') : '';
  return { fournisseur: f.id, nom: f.court, cle, modele, url, web: f.web, pret: !!modele && (f.id === 'perso' ? /^https?:\/\/\S+$/.test(url) : !!cle), auto: !!c.auto, autoJours: Math.max(7, Math.min(365, Number(c.autoJours) || 30)) };
}
const iaMasque = (k) => { const s = String(k || ''); return s.length <= 10 ? '•'.repeat(s.length) : `${s.slice(0, 6)}…${s.slice(-4)}`; };

/* ---------- requête au format de chaque service ---------- */
function iaRequete(c, o) {
  const system = o.system || ''; const texte = o.texte || ''; const web = !!o.web && c.web !== false; const M = o.max || 1600;
  const json = { 'content-type': 'application/json' };
  const msgs = [{ role: 'system', content: system }, { role: 'user', content: texte }];
  if (c.fournisseur === 'anthropic') {
    const tools = web ? [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }, ...(o.sansFetch ? [] : [{ type: 'web_fetch_20250910', name: 'web_fetch', max_uses: 3, max_content_tokens: 20000 }])] : null;
    return { url: 'https://api.anthropic.com/v1/messages', headers: { ...json, 'x-api-key': c.cle, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: { model: c.modele, max_tokens: M, system, messages: [{ role: 'user', content: texte }], ...(tools ? { tools } : {}) } };
  }
  if (c.fournisseur === 'openai') return { url: 'https://api.openai.com/v1/responses', headers: { ...json, authorization: `Bearer ${c.cle}` },
    body: { model: c.modele, instructions: system, input: texte, max_output_tokens: Math.max(8000, M * 4), ...(web ? { tools: [{ type: 'web_search' }], include: ['web_search_call.action.sources'] } : {}) } };
  if (c.fournisseur === 'gemini') return { url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(c.modele.replace(/^models\//, ''))}:generateContent`, headers: { ...json, 'x-goog-api-key': c.cle },
    body: { systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: texte }] }], ...(web ? { tools: [{ google_search: {} }] } : {}), generationConfig: { maxOutputTokens: Math.max(8000, M * 4) } } };
  if (c.fournisseur === 'mistral' && web) return { url: 'https://api.mistral.ai/v1/conversations', headers: { ...json, authorization: `Bearer ${c.cle}` },
    body: { model: c.modele, instructions: system, inputs: texte, tools: [{ type: 'web_search' }], completion_args: { max_tokens: M } } };
  if (c.fournisseur === 'mistral') return { url: 'https://api.mistral.ai/v1/chat/completions', headers: { ...json, authorization: `Bearer ${c.cle}` }, body: { model: c.modele, messages: msgs, max_tokens: M } };
  if (c.fournisseur === 'openrouter') return { url: 'https://openrouter.ai/api/v1/chat/completions', headers: { ...json, authorization: `Bearer ${c.cle}` },
    body: { model: c.modele, messages: msgs, max_tokens: Math.max(4000, M * 2), ...(web ? { plugins: [{ id: 'web', max_results: 5 }] } : {}) } };
  return { url: `${c.url}/chat/completions`, headers: { ...json, ...(c.cle ? { authorization: `Bearer ${c.cle}` } : {}) }, body: { model: c.modele, messages: msgs, max_tokens: Math.max(4000, M * 2) } };
}
// réponse → texte et sources (adresses consultées ou citées)
function iaReponse(fid, j) {
  const src = []; const ajout = (url, titre) => { const u = String(url || ''); if (/^https?:\/\//.test(u) && !src.some((s) => s.url === u)) src.push({ url: u, titre: String(titre || '').slice(0, 160) }); };
  let texte = ''; let suite = false; const J = j || {};
  if (fid === 'anthropic') {
    (J.content || []).forEach((b) => {
      if (!b) return; if (b.type === 'text') { texte += b.text || ''; (b.citations || []).forEach((x) => ajout(x.url, x.title)); }
      if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) b.content.forEach((r) => ajout(r.url, r.title));
      if (b.type === 'web_fetch_tool_result' && b.content && b.content.url) ajout(b.content.url, (b.content.content || {}).title);
    });
    suite = J.stop_reason === 'pause_turn';
  } else if (fid === 'openai') {
    (J.output || []).forEach((it) => {
      if (!it) return; if (it.type === 'message') (it.content || []).forEach((x) => { if (x.type === 'output_text') { texte += x.text || ''; (x.annotations || []).forEach((a) => { if (a.type === 'url_citation') ajout(a.url, a.title); }); } });
      if (it.type === 'web_search_call' && it.action && Array.isArray(it.action.sources)) it.action.sources.forEach((s) => ajout(s.url, s.title));
    });
    if (!texte && typeof J.output_text === 'string') texte = J.output_text;
  } else if (fid === 'gemini') {
    const c0 = (J.candidates || [])[0] || {}; ((c0.content || {}).parts || []).forEach((p) => { if (p && p.text && !p.thought) texte += p.text; });
    ((c0.groundingMetadata || {}).groundingChunks || []).forEach((g) => { if (g && g.web) ajout(g.web.uri, g.web.title); });
  } else if (fid === 'mistral' && Array.isArray(J.outputs)) {
    J.outputs.forEach((o) => { if (!o || o.type !== 'message.output') return; if (typeof o.content === 'string') texte += o.content; else (o.content || []).forEach((x) => { if (x.type === 'text') texte += x.text || ''; if (x.type === 'tool_reference') ajout(x.url, x.title); }); });
  } else { // format « chat completions » : Mistral sans recherche, OpenRouter, services compatibles (Perplexity : citations)
    const m = ((J.choices || [])[0] || {}).message || {}; texte = typeof m.content === 'string' ? m.content : Array.isArray(m.content) ? m.content.map((x) => (x && x.text) || '').join('') : '';
    (m.annotations || []).forEach((a) => { const u = (a && a.url_citation) || a || {}; ajout(u.url, u.title); });
    (J.citations || []).forEach((u) => ajout(typeof u === 'string' ? u : u && u.url, u && u.title)); (J.search_results || []).forEach((s) => ajout(s && s.url, s && s.title));
  }
  return { texte: texte.trim(), sources: src.slice(0, 15), suite };
}
// objet JSON contenu dans la réponse (bloc ```json, ou le plus grand objet {…} lisible)
function iaJson(texte) {
  const t = String(texte || ''); const f = /```(?:json)?\s*([\s\S]*?)```/i.exec(t); if (f) { try { const o = JSON.parse(f[1].trim()); if (o && typeof o === 'object') return o; } catch (e) { /* on cherche ailleurs */ } }
  let best = null;
  for (let i = t.indexOf('{'); i >= 0; i = t.indexOf('{', i + 1)) {
    let prof = 0; let ch = false; let esc = false;
    for (let k = i; k < t.length; k += 1) {
      const c = t[k]; if (ch) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') ch = false; continue; }
      if (c === '"') ch = true; else if (c === '{') prof += 1; else if (c === '}') { prof -= 1; if (!prof) { const seg = t.slice(i, k + 1); if (!best || seg.length > best.length) { try { JSON.parse(seg); best = seg; } catch (e) { /* pas du JSON */ } } break; } }
    }
  }
  return best ? JSON.parse(best) : null;
}
const iaNul = (v) => v == null || (typeof v === 'string' && /^\s*(?:null|none|n\/?a|inconnu[e]?|-|)\s*$/i.test(v));
const iaTexte = (v, n) => (iaNul(v) ? '' : String(v).trim().slice(0, n || 200));
const iaDateDe = (v) => { if (iaNul(v)) return ''; const s = String(v).trim(); const d = isoOK(s) ? s : fdsDate(s) || moisAnnee(s) || (/^\d{4}-\d{2}$/.test(s) ? `${s}-01` : ''); return dateRevOk(d) ? d : ''; };

/* ---------- messages d'erreur compréhensibles ---------- */
function iaErreurMsg(c, statut, j) {
  const nom = iaFournisseur(c.fournisseur).court; const e = j && (j.error || j);
  const det = String((e && (typeof e === 'string' ? e : e.message || e.detail || e.type)) || (j && j.message) || '').slice(0, 220);
  if (statut === 401 || statut === 403 || (statut === 400 && /api.?key|clé|unauthori[sz]ed|permission/i.test(det))) return `${nom} refuse la clé API (${statut}) : vérifiez-la dans Paramètres › 🤖 Assistant IA.${det ? ` (${det})` : ''}`;
  if (statut === 402) return `${nom} : crédit épuisé ou moyen de paiement à renseigner sur votre compte.${det ? ` (${det})` : ''}`;
  if (statut === 404) return `${nom} : modèle « ${c.modele} » introuvable. Choisissez-en un dans la liste (Paramètres › 🤖 Assistant IA › « Charger la liste des modèles »).`;
  if (statut === 429) return `${nom} : trop de demandes, ou crédit épuisé (429). Patientez un peu ou vérifiez votre compte.${det ? ` (${det})` : ''}`;
  if (statut >= 500) return `${nom} est momentanément indisponible (${statut}). Réessayez plus tard.`;
  return `${nom} a refusé la demande (${statut})${det ? ` : ${det}` : ''}.`;
}
function iaErreurReseau(c) {
  const nom = iaFournisseur(c.fournisseur).court; let cadre = false; try { cadre = window.self !== window.top; } catch (e) { cadre = true; }
  if (cadre) return `Impossible de joindre ${nom} depuis cette page : dans claude.ai, Œnotrack ne peut pas appeler de service extérieur. Utilisez Œnotrack en ligne (Paramètres › 💾 Sauvegarde & Drive › « Mettre Œnotrack en ligne ») ou le fichier enregistré puis ouvert dans votre navigateur.`;
  if (c.fournisseur === 'mistral') return 'Mistral n’accepte pas la connexion directe depuis ce navigateur. Choisissez « OpenRouter » et un modèle « mistralai/… » (une seule clé pour tous les modèles), ou un autre service.';
  if (c.fournisseur === 'perso') return `Impossible de joindre ${c.url} : adresse inexacte, service arrêté, ou service qui n’accepte pas les appels depuis un navigateur (CORS).`;
  return `Impossible de joindre ${nom} : vérifiez la connexion internet de cet appareil.`;
}

/* ---------- appel (navigateur) ---------- */
async function iaDemander(c0, o) {
  const c = c0 || iaActive(); if (!c.pret) throw { config: true, message: 'Assistant IA non configuré : Paramètres › 🤖 Assistant IA (service et clé API).' };
  let rq = iaRequete(c, o); let sansFetch = false; let tours = 0; const tout = { texte: '', sources: [] };
  for (;;) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null; const delai = setTimeout(() => { if (ctrl) ctrl.abort(); }, o.delai || 180000);
    if (o.signal) { if (o.signal.aborted) { clearTimeout(delai); throw { arret: true, message: 'Demande interrompue.' }; } o.signal.addEventListener('abort', () => { if (ctrl) ctrl.abort(); }, { once: true }); }
    let r;
    try { r = await fetch(rq.url, { method: 'POST', headers: rq.headers, body: JSON.stringify(rq.body), signal: ctrl ? ctrl.signal : undefined }); }
    catch (e) { clearTimeout(delai); if (o.signal && o.signal.aborted) throw { arret: true, message: 'Demande interrompue.' }; if (e && e.name === 'AbortError') throw { message: `${c.nom} n’a pas répondu à temps (plus de ${Math.round((o.delai || 180000) / 1000)} s).` }; throw { reseau: true, message: iaErreurReseau(c) }; }
    clearTimeout(delai);
    let j = null; try { j = await r.json(); } catch (e) { j = null; }
    if (!r.ok) {
      // lecture des pages désactivée pour l'organisation (console Claude) : la recherche seule suffit
      if (r.status === 400 && c.fournisseur === 'anthropic' && !sansFetch && o.web && /web.?fetch/i.test(JSON.stringify(j || {}))) { sansFetch = true; rq = iaRequete(c, { ...o, sansFetch: true }); continue; }
      throw { statut: r.status, message: iaErreurMsg(c, r.status, j) };
    }
    const R = iaReponse(c.fournisseur, j); tout.texte += (tout.texte && R.texte ? '\n' : '') + R.texte; R.sources.forEach((s) => { if (!tout.sources.some((x) => x.url === s.url)) tout.sources.push(s); });
    if (R.suite && c.fournisseur === 'anthropic' && tours < 3) { tours += 1; rq = { ...rq, body: { ...rq.body, messages: [...rq.body.messages, { role: 'assistant', content: j.content }] } }; continue; } // recherche longue : on laisse le service poursuivre
    return { texte: tout.texte.trim(), sources: tout.sources, brut: j };
  }
}
// liste des modèles proposés par le service (avec la clé)
async function iaModeles(c) {
  const f = c.fournisseur; let url; let headers = {};
  if (f === 'anthropic') { url = 'https://api.anthropic.com/v1/models?limit=100'; headers = { 'x-api-key': c.cle, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }; }
  else if (f === 'openai') { url = 'https://api.openai.com/v1/models'; headers = { authorization: `Bearer ${c.cle}` }; }
  else if (f === 'gemini') { url = 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=200'; headers = { 'x-goog-api-key': c.cle }; }
  else if (f === 'mistral') { url = 'https://api.mistral.ai/v1/models'; headers = { authorization: `Bearer ${c.cle}` }; }
  else if (f === 'openrouter') { url = 'https://openrouter.ai/api/v1/models'; headers = c.cle ? { authorization: `Bearer ${c.cle}` } : {}; }
  else { url = `${c.url}/models`; headers = c.cle ? { authorization: `Bearer ${c.cle}` } : {}; }
  let r; try { r = await fetch(url, { headers }); } catch (e) { throw { reseau: true, message: iaErreurReseau(c) }; }
  let j = null; try { j = await r.json(); } catch (e) { j = null; }
  if (!r.ok) throw { statut: r.status, message: iaErreurMsg(c, r.status, j) };
  return iaModelesDe(f, j);
}
function iaModelesDe(f, j) {
  const J = j || {};
  if (f === 'gemini') return (J.models || []).filter((m) => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/i.test(m.name || '') && !/embedding|image|tts|live|transcribe|robotics/i.test(m.name || '')).map((m) => ({ id: String(m.name).replace(/^models\//, ''), nom: m.displayName || '' }));
  let L = (J.data || []).map((m) => ({ id: m.id, nom: m.display_name || m.name || '' })).filter((m) => m.id);
  if (f === 'openai') L = L.filter((m) => /^(?:gpt|o\d|chatgpt)/i.test(m.id) && !/audio|realtime|tts|transcribe|image|embedding|moderation|search|instruct|davinci|babbage/i.test(m.id));
  if (f === 'mistral') L = L.filter((m) => !/embed|moderation|ocr|transcri/i.test(m.id));
  return L.sort((a, b) => a.id.localeCompare(b.id));
}

/* ---------- (a) identifier un document fournisseur ---------- */
function iaPromptIdentifier(db, lu) {
  const C = ficheCandidatsListe(db).slice(0, 400); const codes = {};
  const lignes = C.map((x, i) => { const k = `P${i + 1}`; codes[k] = { type: x.type, id: x.id }; return `${k} | ${x.nom}${x.type === 'produitHygiene' ? ' (hygiène)' : ''} | ${x.fo || '—'} | ${x.ref || '—'}`; });
  const system = 'Tu aides une cave (vinification) à ranger les documents de ses fournisseurs de produits œnologiques et de produits d’hygiène. Tu réponds uniquement par un objet JSON valide, sans texte autour.';
  const texte = `Document : « ${lu.fichier || 'document'} »${lu.ocr ? ' (texte reconnu sur un scan : il peut contenir des erreurs)' : ''}.\nDébut du texte :\n"""\n${String(lu.extrait || '').slice(0, 3500)}\n"""\n\nProduits de la cave (code | nom | fournisseur | référence) :\n${lignes.join('\n') || '(aucun)'}\n\nDis de quel document il s’agit et à quel produit de la liste il se rapporte. Réponds par :\n{"type": "fds" | "ft" | "certificat" | "autre", "code": "<code du produit de la liste, ou null si aucun ne correspond>", "nomProduit": "<nom commercial du produit d’après le document>", "fabricant": "<société qui a émis le document, ou null>", "dateRevision": "AAAA-MM-JJ ou null", "version": "<version ou null>", "confiance": <de 0 à 1>}\nN’associe un produit que si le document le concerne clairement (le même produit, pas seulement la même famille de produits).`;
  return { system, texte, codes };
}
function iaLireIdentification(o, codes) {
  if (!o || typeof o !== 'object') return null; const type = String(o.type || '').toLowerCase();
  const genre = /fds|sds|securit/.test(type) ? 'fds' : /^ft$|techn/.test(type) ? 'ft' : /certif|attest/.test(type) ? 'certificat' : type ? 'autre' : '';
  const k = iaNul(o.code) ? '' : String(o.code).trim().toUpperCase(); const cible = (codes || {})[k] || null;
  const conf = Number(o.confiance); return { genre, cible, nom: iaTexte(o.nomProduit, 90), fabricant: iaTexte(o.fabricant, 90), date: iaDateDe(o.dateRevision), version: iaTexte(o.version, 20), confiance: Number.isFinite(conf) ? Math.max(0, Math.min(1, conf)) : null };
}

/* ---------- (b) veille : dernière FT et FDS en ligne ---------- */
function iaPromptVeille(db, id) {
  const p = (db.produits || []).find((x) => x.id === id); if (!p) return null;
  const fo = ficheFournisseur(db, { type: 'produit', id }, p); const fd = prodFdsDate(db, p); const fv = (prodDocs(db, p.id, 'fds').find((x) => x.revision === fd) || {}).version || p.fdsVersion || ''; const td = prodFtDate(db, p);
  const system = 'Tu fais la veille documentaire d’une cave (vinification) : tu cherches sur internet, chez le fabricant ou le distributeur du produit, sa fiche technique (FT) et sa fiche de données de sécurité (FDS) en français les plus récentes. Tu ne donnes que des adresses réellement trouvées dans tes recherches ou dans les pages consultées, jamais une adresse devinée ou reconstituée. Tu réponds uniquement par un objet JSON valide.';
  const texte = `Produit : ${p.nom}\nFournisseur / fabricant : ${fo || 'inconnu'}${p.reference ? `\nRéférence : ${p.reference}` : ''}${lienNorm(p.lien) ? `\nPage connue du produit : ${lienNorm(p.lien)}` : ''}\nFDS dont dispose la cave : ${fd ? `révision du ${fd}${fv ? `, version ${fv}` : ''}` : 'aucune'}\nFiche technique dont dispose la cave : ${td ? `du ${td}` : 'aucune'}\n\nCherche : 1) la page officielle de ce produit chez le fabricant ou le distributeur ; 2) le lien direct vers la FDS en français la plus récente, avec sa date de révision et sa version ; 3) le lien vers la fiche technique en français et sa date.\nRéponds par :\n{"page": "<adresse ou null>", "fds": {"url": "<adresse ou null>", "date": "AAAA-MM-JJ ou null", "version": "<ou null>"}, "ft": {"url": "<adresse ou null>", "date": "AAAA-MM-JJ ou null"}, "fabricant": "<nom ou null>", "remarque": "<une phrase utile (produit renommé, plus commercialisé, FDS fournie seulement sur demande…) ou null>"}`;
  return { system, texte, web: true, max: 1600 };
}
function iaLireVeille(o, sources, c, today) {
  const O = o && typeof o === 'object' ? o : {}; const S = (sources || []).slice(0, 8);
  const sans = (u) => String(u || '').split('#')[0].replace(/\/+$/, '');
  const vu = (u) => !!u && S.some((s) => sans(s.url) === sans(u));
  const lien = (u) => (iaNul(u) ? '' : lienNorm(u));
  const page = lien(O.page); const fds = { url: lien(O.fds && O.fds.url), date: iaDateDe(O.fds && O.fds.date), version: iaTexte(O.fds && O.fds.version, 20) }; const ft = { url: lien(O.ft && O.ft.url), date: iaDateDe(O.ft && O.ft.date) };
  return { date: today || todayISO(), page, fds, ft, fabricant: iaTexte(O.fabricant, 90), remarque: iaTexte(O.remarque, 300), sources: S, service: (c && c.fournisseur) || '', modele: (c && c.modele) || '',
    verifie: { page: vu(page), fds: vu(fds.url), ft: vu(ft.url) }, trouve: !!(page || fds.url || ft.url) };
}
// produits à vérifier lors de la veille automatique : jamais vérifiés ou vérifiés il y a plus de N jours, les plus anciens d'abord
function iaVeilleAFaire(db, jours, today, max) {
  const t = today || todayISO();
  return (db.produits || []).filter((p) => p.actif !== false && prodFdsRequise(p) && (!p.veille || !isoOK(p.veille.date) || daysBetween(p.veille.date, t) >= jours))
    .sort((a, b) => String((a.veille || {}).date || '').localeCompare(String((b.veille || {}).date || '')) || a.nom.localeCompare(b.nom, 'fr')).slice(0, max || 5).map((p) => p.id);
}
