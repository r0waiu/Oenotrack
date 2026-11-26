/* ============ STOCKAGE DRIVE : connecteurs Google Drive, OneDrive, Dropbox, dossier de l'ordinateur et dossier réseau (0.34.0-alpha.1) ============ */
// Connexion dans le navigateur, sans serveur : Google (Google Identity Services, jeton d'une heure), Microsoft et Dropbox
// (OAuth 2 « code + PKCE », jeton renouvelé seul). Les identifiants publics de l'application (client ID, app key) viennent de
// config.json, posé à côté d'index.html, ou de Paramètres › Sauvegarde & Drive › Identifiants des services.
const CLOUD_CONFIG_KEY = 'oenotrack-config'; const CLOUD_JETONS_KEY = 'oenotrack-cloud-jetons'; const CLOUD_PKCE_KEY = 'oenotrack-pkce';
let CLOUD_CONFIG_FICHIER = {};
const cloudConfigLocale = () => { try { return JSON.parse(window.localStorage.getItem(CLOUD_CONFIG_KEY) || '{}') || {}; } catch (e) { return {}; } };
function cloudConfig() {
  const a = CLOUD_CONFIG_FICHIER || {}; const b = cloudConfigLocale(); const pick = (k, c) => ((b[k] || {})[c] || (a[k] || {})[c] || '').trim();
  return { google: { clientId: pick('google', 'clientId') }, microsoft: { clientId: pick('microsoft', 'clientId') }, dropbox: { appKey: pick('dropbox', 'appKey') } };
}
async function cloudChargerConfig() {
  if (cloudIntegre()) return cloudConfig();
  try { const r = await fetch('config.json', { cache: 'no-store' }); if (r.ok) { const j = await r.json(); if (j && typeof j === 'object' && !Array.isArray(j)) CLOUD_CONFIG_FICHIER = j; } } catch (e) { /* pas de config.json (claude.ai, fichier ouvert en local) */ }
  try { window.dispatchEvent(new Event('oenotrack-config')); } catch (e) { /* ignoré */ } // mentions légales (0.21.0-alpha.1) : relues à la réception
  return cloudConfig();
}
// config.json à déposer à côté d'index.html : celui du site, complété (identifiants des services, mentions légales…) — rien n'est perdu
const configFichierAvec = (patch) => ({ ...(CLOUD_CONFIG_FICHIER && typeof CLOUD_CONFIG_FICHIER === 'object' ? CLOUD_CONFIG_FICHIER : {}), ...(patch || {}) });
const cloudRetourUrl = () => `${window.location.origin}${window.location.pathname}`;
// page ouverte dans claude.ai (cadre intégré) : pas de connexion directe possible aux services
const cloudIntegre = () => { try { return window.self !== window.top; } catch (e) { return true; } };
const jetonsLire = (f) => { try { return (JSON.parse(window.localStorage.getItem(CLOUD_JETONS_KEY) || '{}') || {})[f] || null; } catch (e) { return null; } };
const jetonsEcrire = (f, j) => { try { const all = JSON.parse(window.localStorage.getItem(CLOUD_JETONS_KEY) || '{}') || {}; if (j) all[f] = j; else delete all[f]; window.localStorage.setItem(CLOUD_JETONS_KEY, JSON.stringify(all)); } catch (e) { /* ignoré */ } };
const b64url = (bytes) => btoa(String.fromCharCode.apply(null, Array.from(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const pkceVerifier = () => { const a = new Uint8Array(48); crypto.getRandomValues(a); return b64url(a); };
const pkceChallenge = async (v) => b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v))));
const qs = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
function chargerScript(src) {
  return new Promise((res, rej) => { if (document.querySelector(`script[src="${src}"]`)) { res(); return; } const s = document.createElement('script'); s.src = src; s.async = true; s.onload = () => res(); s.onerror = () => rej({ reseau: true, message: 'Script de connexion indisponible' }); document.head.appendChild(s); });
}
async function cloudFetch(url, opts, jeton) {
  let r; const o = opts || {};
  try { r = await fetch(url, { ...o, headers: { ...(o.headers || {}), ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}) } }); } catch (er) { throw { reseau: true, message: 'Pas de réseau' }; }
  if (r.status === 401) throw { auth: true, message: 'Connexion expirée' };
  return r;
}
async function httpErreur(r, extra) {
  let t = ''; try { t = await r.text(); } catch (e) { t = ''; }
  if (r.status === 412 || r.status === 409 && /conflict/i.test(t)) return { conflit: true, message: t.slice(0, 200) };
  if (r.status === 404 || /not_found/.test(t)) return { introuvable: true, message: t.slice(0, 200) };
  if (r.status === 429 || r.status >= 500) return { reseau: true, message: `Service momentanément indisponible (${r.status})` };
  if (r.status === 403 && /quota|rate/i.test(t)) return { reseau: true, message: 'Trop de demandes : nouvel essai dans un instant' };
  return { autre: true, message: `${extra || 'Erreur'} (${r.status}) ${t.slice(0, 160)}` };
}
// retour d'une connexion Microsoft / Dropbox (?code=…&state=…) : échange du code contre les jetons
async function cloudRetourConnexion() {
  const p = new URLSearchParams(window.location.search); const code = p.get('code'); const st = p.get('state'); const err = p.get('error');
  if (!code && !err) return null;
  let att = null; try { att = JSON.parse(window.sessionStorage.getItem(CLOUD_PKCE_KEY) || window.localStorage.getItem(CLOUD_PKCE_KEY) || 'null'); } catch (e) { att = null; }
  try { window.history.replaceState(null, '', window.location.pathname + window.location.hash); } catch (e) { /* ignoré */ }
  try { window.sessionStorage.removeItem(CLOUD_PKCE_KEY); window.localStorage.removeItem(CLOUD_PKCE_KEY); } catch (e) { /* ignoré */ }
  if (!att || att.st !== st) return { erreur: 'Connexion interrompue : recommencez.' };
  if (err) return { fournisseur: att.f, erreur: err === 'access_denied' ? 'Connexion refusée.' : `Connexion impossible (${p.get('error_description') || err}).` };
  const F = CLOUD_FOURNISSEURS[att.f]; if (!F || !F.echanger) return { erreur: 'Service inconnu.' };
  try { await F.echanger(code, att.v); return { fournisseur: att.f, ok: true }; } catch (e) { return { fournisseur: att.f, erreur: (e && e.message) || 'Connexion impossible.' }; }
}
async function cloudRedirigerPkce(f, url, params) {
  const v = pkceVerifier(); const ch = await pkceChallenge(v); const st = `${f}.${Math.random().toString(36).slice(2, 12)}`;
  const att = JSON.stringify({ f, v, st }); try { window.sessionStorage.setItem(CLOUD_PKCE_KEY, att); window.localStorage.setItem(CLOUD_PKCE_KEY, att); } catch (e) { /* ignoré */ }
  window.location.assign(`${url}?${qs({ ...params, state: st, code_challenge: ch, code_challenge_method: 'S256', redirect_uri: cloudRetourUrl(), response_type: 'code' })}`);
}
async function jetonForm(url, body) {
  let r; try { r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: qs(body) }); } catch (e) { throw { reseau: true, message: 'Pas de réseau' }; }
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) { if (r.status >= 500) throw { reseau: true, message: 'Service indisponible' }; throw { auth: true, message: j.error_description || j.error || `Connexion refusée (${r.status})` }; }
  return j;
}
const multipart = (meta, contenu, mime) => { const b = `oenotrack${Math.random().toString(36).slice(2)}`; return { type: `multipart/related; boundary=${b}`, body: new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${b}\r\nContent-Type: ${mime || 'application/octet-stream'}\r\n\r\n`, contenu, `\r\n--${b}--`]) }; };

/* ---------- Google Drive (API v3) ---------- */
const GD = {
  id: 'google', nom: 'Google Drive', partages: true, scope: 'https://www.googleapis.com/auth/drive',
  pret: () => !!cloudConfig().google.clientId,
  precharger() { if (this.pret() && !cloudIntegre()) chargerScript('https://accounts.google.com/gsi/client').catch(() => null); },
  // à appeler dans un clic (fenêtre de connexion Google) ; la fenêtre se referme seule si l'accord est déjà donné
  connecter() {
    const cfg = cloudConfig().google; if (!cfg.clientId) return Promise.reject({ config: true, message: 'Identifiant Google à renseigner.' });
    const go = () => new Promise((res, rej) => {
      const j0 = jetonsLire('google') || {};
      const tc = window.google.accounts.oauth2.initTokenClient({ client_id: cfg.clientId, scope: this.scope, prompt: '', login_hint: j0.email || undefined, hint: j0.email || undefined,
        callback: (r) => { if (!r || r.error) { rej({ auth: true, message: (r && (r.error_description || r.error)) || 'Connexion refusée.' }); return; } if (window.google.accounts.oauth2.hasGrantedAllScopes && !window.google.accounts.oauth2.hasGrantedAllScopes(r, this.scope)) { rej({ auth: true, message: 'Cochez l’accès à Google Drive dans la fenêtre de Google pour qu’Œnotrack puisse y enregistrer ses données.' }); return; } jetonsEcrire('google', { ...j0, acces: r.access_token, exp: Date.now() + (num(r.expires_in) - 90) * 1000 }); res(true); },
        error_callback: (e) => rej({ annule: true, message: e && e.type === 'popup_closed' ? 'Fenêtre de connexion fermée.' : 'Connexion interrompue (fenêtre bloquée ?).' }) });
      tc.requestAccessToken();
    });
    if (window.google && window.google.accounts && window.google.accounts.oauth2) return go();
    return chargerScript('https://accounts.google.com/gsi/client').then(go);
  },
  async jeton() { const j = jetonsLire('google'); if (j && j.acces && j.exp > Date.now()) return j.acces; throw { auth: true, renouveler: true, message: 'Connexion Google à renouveler (1 clic).' }; },
  async api(chemin, opts, base) { const r = await cloudFetch(`${base || 'https://www.googleapis.com'}${chemin}`, opts, await this.jeton()); if (!r.ok) throw await httpErreur(r, 'Google Drive'); return r; },
  async compte() { const j = await (await this.api('/drive/v3/about?fields=user(displayName,emailAddress)')).json(); const u = j.user || {}; const t = jetonsLire('google') || {}; jetonsEcrire('google', { ...t, email: u.emailAddress }); return { nom: u.displayName || '', email: u.emailAddress || '' }; },
  async liste(q, champs) {
    const out = []; let page = '';
    do {
      const j = await (await this.api(`/drive/v3/files?${qs({ q, fields: `nextPageToken,files(${champs || 'id,name'})`, pageSize: 200, supportsAllDrives: 'true', includeItemsFromAllDrives: 'true', pageToken: page })}`)).json();
      out.push(...(j.files || [])); page = j.nextPageToken || '';
    } while (page && out.length < 2000);
    return out;
  },
  async dossiers(parent) {
    const q = parent === 'partages' ? "sharedWithMe and mimeType='application/vnd.google-apps.folder' and trashed=false" : `'${(parent && parent.id) || 'root'}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    return (await this.liste(q)).map((x) => ({ id: x.id, nom: x.name })).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  },
  async creerDossier(parent, nom) { const j = await (await this.api('/drive/v3/files?supportsAllDrives=true&fields=id,name', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nom, mimeType: 'application/vnd.google-apps.folder', parents: [(parent && parent.id) || 'root'] }) })).json(); return { id: j.id, nom: j.name }; },
  esc: (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"),
  async trouver(parentId, nom, dossier) { const L = await this.liste(`name='${this.esc(nom)}' and '${parentId}' in parents and trashed=false${dossier ? " and mimeType='application/vnd.google-apps.folder'" : ''}`, 'id,name,version,size'); return L[0] || null; },
  _sous: {},
  async sousDossier(d, nom) { const k = `${d.id}/${nom}`; if (this._sous[k]) return this._sous[k]; let x = await this.trouver(d.id, nom, true); if (!x) x = await this.creerDossier(d, nom); this._sous[k] = x.id; return x.id; },
  async infoBase(d) { const x = await this.trouver(d.id, CLOUD_BASE); return x ? { rev: String(x.version), id: x.id } : null; },
  async lireBase(d) { const x = await this.trouver(d.id, CLOUD_BASE); if (!x) return null; const r = await this.api(`/drive/v3/files/${x.id}?alt=media&supportsAllDrives=true`); return { texte: await r.text(), rev: String(x.version) }; },
  async envoyer(parentId, nom, contenu, mime, idExistant) {
    const blob = contenu instanceof Blob ? contenu : new Blob([contenu], { type: mime });
    if (idExistant) { const j = await (await this.api(`/upload/drive/v3/files/${idExistant}?${qs({ uploadType: 'media', supportsAllDrives: 'true', fields: 'id,version' })}`, { method: 'PATCH', headers: { 'Content-Type': mime }, body: blob })).json(); return j; }
    if (blob.size > 4.5 * 1024 * 1024) { // gros fichier : envoi « reprenable »
      const r = await this.api(`/upload/drive/v3/files?${qs({ uploadType: 'resumable', supportsAllDrives: 'true', fields: 'id,version' })}`, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': mime }, body: JSON.stringify({ name: nom, parents: [parentId] }) });
      const loc = r.headers.get('Location'); if (!loc) throw { autre: true, message: 'Envoi du fichier refusé par Google Drive.' };
      const r2 = await cloudFetch(loc, { method: 'PUT', headers: { 'Content-Type': mime }, body: blob }); if (!r2.ok) throw await httpErreur(r2, 'Google Drive'); return r2.json();
    }
    const m = multipart({ name: nom, parents: [parentId], mimeType: mime }, blob, mime);
    return (await this.api(`/upload/drive/v3/files?${qs({ uploadType: 'multipart', supportsAllDrives: 'true', fields: 'id,version' })}`, { method: 'POST', headers: { 'Content-Type': m.type }, body: m.body })).json();
  },
  async ecrireBase(d, texte, rev) {
    const x = await this.trouver(d.id, CLOUD_BASE);
    if (x && (rev === null || String(x.version) !== String(rev))) throw { conflit: true }; // écrit ailleurs entre-temps
    const j = await this.envoyer(d.id, CLOUD_BASE, texte, 'application/json', x && x.id); return { rev: String(j.version) };
  },
  async listerDocs(d) { const id = await this.sousDossier(d, 'documents'); const o = {}; (await this.liste(`'${id}' in parents and trashed=false`)).forEach((x) => { o[x.name] = x.id; }); return o; },
  async lireDoc(d, ref) { return (await this.api(`/drive/v3/files/${ref}?alt=media&supportsAllDrives=true`)).blob(); },
  async ecrireDoc(d, nom, blob) { const id = await this.sousDossier(d, 'documents'); return (await this.envoyer(id, nom, blob, blob.type || 'application/octet-stream')).id; },
  async ecrireHistorique(d, nom, texte) { const id = await this.sousDossier(d, 'historique'); const x = await this.trouver(id, nom); await this.envoyer(id, nom, texte, 'application/json', x && x.id); },
  deconnecter() { const j = jetonsLire('google'); try { if (j && j.acces && window.google && window.google.accounts) window.google.accounts.oauth2.revoke(j.acces, () => null); } catch (e) { /* ignoré */ } jetonsEcrire('google', null); },
};

/* ---------- OneDrive (Microsoft Graph), comptes personnels et professionnels ---------- */
const MS = {
  id: 'onedrive', nom: 'OneDrive', partages: true, auto: 'https://login.microsoftonline.com/common/oauth2/v2.0', scope: 'offline_access User.Read Files.ReadWrite.All',
  pret: () => !!cloudConfig().microsoft.clientId, precharger() {},
  connecter() { const c = cloudConfig().microsoft; if (!c.clientId) return Promise.reject({ config: true, message: 'Identifiant Microsoft à renseigner.' }); return cloudRedirigerPkce('onedrive', `${this.auto}/authorize`, { client_id: c.clientId, scope: this.scope, response_mode: 'query', prompt: 'select_account' }); },
  async echanger(code, v) { const c = cloudConfig().microsoft; const j = await jetonForm(`${this.auto}/token`, { client_id: c.clientId, grant_type: 'authorization_code', code, redirect_uri: cloudRetourUrl(), code_verifier: v, scope: this.scope }); jetonsEcrire('onedrive', { acces: j.access_token, refresh: j.refresh_token, exp: Date.now() + (num(j.expires_in) - 120) * 1000 }); },
  async jeton() {
    const j = jetonsLire('onedrive'); if (j && j.acces && j.exp > Date.now()) return j.acces;
    if (!j || !j.refresh) throw { auth: true, message: 'Connexion OneDrive à renouveler.' };
    const c = cloudConfig().microsoft; const n = await jetonForm(`${this.auto}/token`, { client_id: c.clientId, grant_type: 'refresh_token', refresh_token: j.refresh, scope: this.scope });
    jetonsEcrire('onedrive', { ...j, acces: n.access_token, refresh: n.refresh_token || j.refresh, exp: Date.now() + (num(n.expires_in) - 120) * 1000 }); return n.access_token;
  },
  async api(chemin, opts) { const r = await cloudFetch(chemin.startsWith('http') ? chemin : `https://graph.microsoft.com/v1.0${chemin}`, opts, await this.jeton()); if (!r.ok) throw await httpErreur(r, 'OneDrive'); return r; },
  async compte() { const j = await (await this.api('/me?$select=displayName,mail,userPrincipalName')).json(); return { nom: j.displayName || '', email: j.mail || j.userPrincipalName || '' }; },
  item: (d) => (d.driveId ? `/drives/${d.driveId}/items/${d.id}` : `/me/drive/items/${d.id}`),
  enc: (s) => String(s).split('/').map(encodeURIComponent).join('/'),
  async dossiers(parent) {
    if (parent === 'partages') {
      let j; try { j = await (await this.api('/me/drive/sharedWithMe')).json(); } catch (e) { if (e && (e.auth || e.reseau)) throw e; throw { autre: true, message: 'Liste des partages indisponible. Astuce : dans OneDrive, « Ajouter un raccourci à Mes fichiers » sur le dossier partagé, puis choisissez-le dans « Mes fichiers ».' }; }
      return (j.value || []).filter((x) => (x.remoteItem && x.remoteItem.folder) || x.folder).map((x) => { const r = x.remoteItem || x; return { id: r.id, nom: r.name || x.name, driveId: (r.parentReference || {}).driveId }; });
    }
    const out = []; let url = parent && parent.id ? `${this.item(parent)}/children?$top=200` : '/me/drive/root/children?$top=200';
    while (url && out.length < 2000) {
      const j = await (await this.api(url)).json();
      (j.value || []).forEach((x) => { if (x.folder) out.push({ id: x.id, nom: x.name, driveId: (x.parentReference || {}).driveId }); else if (x.remoteItem && x.remoteItem.folder) out.push({ id: x.remoteItem.id, nom: x.name, driveId: (x.remoteItem.parentReference || {}).driveId }); });
      url = j['@odata.nextLink'] || '';
    }
    return out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  },
  async creerDossier(parent, nom) { const j = await (await this.api(parent && parent.id ? `${this.item(parent)}/children` : '/me/drive/root/children', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nom, folder: {}, '@microsoft.graph.conflictBehavior': 'rename' }) })).json(); return { id: j.id, nom: j.name, driveId: (j.parentReference || {}).driveId }; },
  async meta(d, chemin) { try { return await (await this.api(`${this.item(d)}:/${this.enc(chemin)}?$select=id,name,eTag,size`)).json(); } catch (e) { if (e && e.introuvable) return null; throw e; } },
  async telecharger(d, id) { const j = await (await this.api(`${this.item({ ...d, id })}?$select=id,@microsoft.graph.downloadUrl`)).json(); const u = j['@microsoft.graph.downloadUrl']; if (!u) throw { autre: true, message: 'Téléchargement refusé par OneDrive.' }; const r = await cloudFetch(u, {}); if (!r.ok) throw await httpErreur(r, 'OneDrive'); return r; },
  async envoyer(d, chemin, contenu, mime, ifMatch, creation) {
    const blob = contenu instanceof Blob ? contenu : new Blob([contenu], { type: mime });
    const h = { ...(ifMatch ? { 'If-Match': ifMatch } : {}) };
    if (blob.size <= 4 * 1024 * 1024) {
      const j = await (await this.api(`${this.item(d)}:/${this.enc(chemin)}:/content${creation ? '?@microsoft.graph.conflictBehavior=fail' : ''}`, { method: 'PUT', headers: { ...h, 'Content-Type': mime || 'application/octet-stream' }, body: blob })).json();
      return j;
    }
    const s = await (await this.api(`${this.item(d)}:/${this.enc(chemin)}:/createUploadSession`, { method: 'POST', headers: { ...h, 'Content-Type': 'application/json' }, body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': creation ? 'fail' : 'replace' } }) })).json();
    const T = 320 * 1024 * 12; let pos = 0; let fin = null;
    while (pos < blob.size) {
      const part = blob.slice(pos, Math.min(pos + T, blob.size));
      const r = await cloudFetch(s.uploadUrl, { method: 'PUT', headers: { 'Content-Range': `bytes ${pos}-${pos + part.size - 1}/${blob.size}` }, body: part });
      if (!r.ok && r.status !== 202) throw await httpErreur(r, 'OneDrive'); pos += part.size; if (r.status === 200 || r.status === 201) fin = await r.json();
    }
    return fin || {};
  },
  async infoBase(d) { const m = await this.meta(d, CLOUD_BASE); return m ? { rev: m.eTag, id: m.id } : null; },
  async lireBase(d) { const m = await this.meta(d, CLOUD_BASE); if (!m) return null; const r = await this.telecharger(d, m.id); return { texte: await r.text(), rev: m.eTag }; },
  async ecrireBase(d, texte, rev) {
    try { const j = await this.envoyer(d, CLOUD_BASE, texte, 'application/json', rev || null, !rev); return { rev: j.eTag }; }
    catch (e) { if (e && (e.conflit || /nameAlreadyExists/i.test(e.message || ''))) throw { conflit: true }; throw e; }
  },
  async listerDocs(d) {
    const m = await this.meta(d, 'documents'); if (!m) return {}; const o = {}; let url = `${this.item({ ...d, id: m.id })}/children?$select=id,name&$top=999`;
    while (url) { const j = await (await this.api(url)).json(); (j.value || []).forEach((x) => { o[x.name] = x.id; }); url = j['@odata.nextLink'] || ''; }
    return o;
  },
  async lireDoc(d, ref) { return (await this.telecharger(d, ref)).blob(); },
  _sous: {},
  async sousDossier(d, nom) { const k = `${d.driveId || ''}/${d.id}/${nom}`; if (this._sous[k]) return; const m = await this.meta(d, nom); if (!m) { try { await this.api(`${this.item(d)}/children`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nom, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' }) }); } catch (e) { if (!(e && /nameAlreadyExists|conflict/i.test(e.message || '')) && !(e && e.conflit)) throw e; } } this._sous[k] = true; },
  async ecrireDoc(d, nom, blob) { await this.sousDossier(d, 'documents'); const j = await this.envoyer(d, `documents/${nom}`, blob, blob.type || 'application/octet-stream', null, false); return j.id; },
  async ecrireHistorique(d, nom, texte) { await this.sousDossier(d, 'historique'); await this.envoyer(d, `historique/${nom}`, texte, 'application/json', null, false); },
  deconnecter() { jetonsEcrire('onedrive', null); },
};

/* ---------- Dropbox (API v2) ---------- */
const DBX = {
  id: 'dropbox', nom: 'Dropbox', partages: false,
  pret: () => !!cloudConfig().dropbox.appKey, precharger() {},
  connecter() { const c = cloudConfig().dropbox; if (!c.appKey) return Promise.reject({ config: true, message: 'Clé Dropbox à renseigner.' }); return cloudRedirigerPkce('dropbox', 'https://www.dropbox.com/oauth2/authorize', { client_id: c.appKey, token_access_type: 'offline' }); },
  async echanger(code, v) { const c = cloudConfig().dropbox; const j = await jetonForm('https://api.dropboxapi.com/oauth2/token', { code, grant_type: 'authorization_code', client_id: c.appKey, redirect_uri: cloudRetourUrl(), code_verifier: v }); jetonsEcrire('dropbox', { acces: j.access_token, refresh: j.refresh_token, exp: Date.now() + (num(j.expires_in || 14400) - 120) * 1000 }); },
  async jeton() {
    const j = jetonsLire('dropbox'); if (j && j.acces && j.exp > Date.now()) return j.acces;
    if (!j || !j.refresh) throw { auth: true, message: 'Connexion Dropbox à renouveler.' };
    const n = await jetonForm('https://api.dropboxapi.com/oauth2/token', { grant_type: 'refresh_token', refresh_token: j.refresh, client_id: cloudConfig().dropbox.appKey });
    jetonsEcrire('dropbox', { ...j, acces: n.access_token, exp: Date.now() + (num(n.expires_in || 14400) - 120) * 1000 }); return n.access_token;
  },
  arg: (o) => JSON.stringify(o).replace(/[\u007f-￿]/g, (c) => `\\u${(`000${c.charCodeAt(0).toString(16)}`).slice(-4)}`), // en-tête HTTP : ASCII seulement
  async rpc(ep, body) {
    const r = await cloudFetch(`https://api.dropboxapi.com/2/${ep}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body === undefined ? null : body) }, await this.jeton());
    if (!r.ok) { const e = await httpErreur(r, 'Dropbox'); throw e; } return r.json();
  },
  async compte() { const j = await this.rpc('users/get_current_account'); return { nom: (j.name && j.name.display_name) || '', email: j.email || '' }; },
  async dossiers(parent) {
    const out = []; let j = await this.rpc('files/list_folder', { path: (parent && parent.id) || '', include_mounted_folders: true, limit: 500 });
    for (;;) { (j.entries || []).forEach((x) => { if (x['.tag'] === 'folder') out.push({ id: x.path_lower, nom: x.name, chemin: x.path_display }); }); if (!j.has_more || out.length > 2000) break; j = await this.rpc('files/list_folder/continue', { cursor: j.cursor }); }
    return out.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  },
  async creerDossier(parent, nom) { const j = await this.rpc('files/create_folder_v2', { path: `${(parent && parent.id) || ''}/${nom}`, autorename: true }); return { id: j.metadata.path_lower, nom: j.metadata.name, chemin: j.metadata.path_display }; },
  async meta(chemin) { try { return await this.rpc('files/get_metadata', { path: chemin }); } catch (e) { if (e && e.introuvable) return null; throw e; } },
  async telecharger(chemin) { const r = await cloudFetch('https://content.dropboxapi.com/2/files/download', { method: 'POST', headers: { 'Dropbox-API-Arg': this.arg({ path: chemin }) } }, await this.jeton()); if (!r.ok) throw await httpErreur(r, 'Dropbox'); return r; },
  async envoyer(chemin, contenu, mode) {
    const r = await cloudFetch('https://content.dropboxapi.com/2/files/upload', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'Dropbox-API-Arg': this.arg({ path: chemin, mode, autorename: false, mute: true, strict_conflict: true }) }, body: contenu }, await this.jeton());
    if (!r.ok) throw await httpErreur(r, 'Dropbox'); return r.json();
  },
  async infoBase(d) { const m = await this.meta(`${d.id}/${CLOUD_BASE}`); return m ? { rev: m.rev } : null; },
  async lireBase(d) { const m = await this.meta(`${d.id}/${CLOUD_BASE}`); if (!m) return null; const r = await this.telecharger(m.path_lower); return { texte: await r.text(), rev: m.rev }; },
  async ecrireBase(d, texte, rev) { const j = await this.envoyer(`${d.id}/${CLOUD_BASE}`, new Blob([texte], { type: 'application/json' }), rev ? { '.tag': 'update', update: rev } : { '.tag': 'add' }); return { rev: j.rev }; },
  async listerDocs(d) {
    const o = {}; let j; try { j = await this.rpc('files/list_folder', { path: `${d.id}/documents`, limit: 2000 }); } catch (e) { if (e && e.introuvable) return o; throw e; }
    for (;;) { (j.entries || []).forEach((x) => { if (x['.tag'] === 'file') o[x.name] = x.path_lower; }); if (!j.has_more) break; j = await this.rpc('files/list_folder/continue', { cursor: j.cursor }); }
    return o;
  },
  async lireDoc(d, ref) { return (await this.telecharger(ref)).blob(); },
  async ecrireDoc(d, nom, blob) { const p = `${d.id}/documents/${nom}`; try { const j = await this.envoyer(p, blob, { '.tag': 'add' }); return j.path_lower; } catch (e) { if (e && e.conflit) return p.toLowerCase(); throw e; } },
  async ecrireHistorique(d, nom, texte) { await this.envoyer(`${d.id}/historique/${nom}`, new Blob([texte], { type: 'application/json' }), { '.tag': 'overwrite' }); },
  deconnecter() { jetonsEcrire('dropbox', null); },
};

/* ---------- dossier de l'ordinateur (iCloud Drive, kDrive, pCloud, Google Drive pour ordinateur…) et dossier réseau de l'entreprise
   (serveur interne, NAS, lecteur réseau : 0.34.0-alpha.1) : API File System Access, Chrome / Edge sur ordinateur ----------
   o = { id, nom, cle : clé du lien gardé dans IndexedDB, fenetre : identifiant de la fenêtre de choix (le système y rouvre le dernier
   dossier), verrou : jeton d'écriture (plusieurs postes écrivent dans le même dossier partagé) }. */
const DOSSIER_VERROU = 'oenotrack-verrou.json'; const DOSSIER_VERROU_MS = 30000; // un verrou plus vieux (poste éteint en cours d'écriture) est ignoré
const dossierPause = (ms) => new Promise((res) => setTimeout(res, ms));
function dossierFournisseur(o) {
  return {
    id: o.id, nom: o.nom, partages: false, local: true, h: null,
    pret: () => typeof window.showDirectoryPicker === 'function', precharger() {},
    async connecter() {
      if (typeof window.showDirectoryPicker !== 'function') throw { config: true, message: 'Ce navigateur ne permet pas de choisir un dossier (utilisez Chrome ou Edge sur ordinateur).' };
      let h; try { h = await window.showDirectoryPicker({ id: o.fenetre, mode: 'readwrite' }); } catch (e) { throw { annule: true, message: 'Choix du dossier annulé.' }; }
      this.h = h; try { await sdbRun('lien', 'readwrite', (s) => s.put(h, o.cle)); } catch (e) { /* lien gardé pour cette visite seulement */ }
      return { id: 'local', nom: h.name };
    },
    async poignee(demander) {
      if (!this.h) { try { this.h = (await sdbRun('lien', 'readonly', (s) => s.get(o.cle))) || null; } catch (e) { this.h = null; } }
      if (!this.h) throw { auth: true, message: 'Choisissez à nouveau le dossier.' };
      let p = 'prompt'; try { p = await this.h.queryPermission({ mode: 'readwrite' }); } catch (e) { p = 'prompt'; }
      if (p !== 'granted' && demander) { try { p = await this.h.requestPermission({ mode: 'readwrite' }); } catch (e) { p = 'denied'; } }
      if (p !== 'granted') throw { auth: true, renouveler: true, message: 'Autorisez à nouveau l’accès au dossier (1 clic).' };
      return this.h;
    },
    async renouveler() { await this.poignee(true); return true; },
    async compte() { const h = await this.poignee(false); return { nom: h.name, email: '' }; },
    async dossiers() { return []; }, async creerDossier() { throw { autre: true, message: 'Créez le dossier depuis l’explorateur de fichiers.' }; },
    async fichier(nom, sous, creer) { let d = await this.poignee(false); if (sous) d = await d.getDirectoryHandle(sous, { create: !!creer }); return d.getFileHandle(nom, { create: !!creer }); },
    rev: (f) => `${f.lastModified}:${f.size}`,
    async infoBase() { try { const f = await (await this.fichier(CLOUD_BASE)).getFile(); return { rev: this.rev(f) }; } catch (e) { if (e && e.name === 'NotFoundError') return null; throw e && e.auth ? e : { autre: true, message: (e && e.message) || 'Lecture impossible' }; } },
    async lireBase() { try { const f = await (await this.fichier(CLOUD_BASE)).getFile(); return { texte: await f.text(), rev: this.rev(f) }; } catch (e) { if (e && e.name === 'NotFoundError') return null; throw e && e.auth ? e : { autre: true, message: (e && e.message) || 'Lecture impossible' }; } },
    async ecrire(fh, contenu) { const w = await fh.createWritable(); await w.write(contenu); await w.close(); return fh.getFile(); },
    // jeton d'écriture : posé, relu après un court délai (un autre poste qui écrit au même moment l'aurait remplacé), retiré après l'écriture
    async verrouPrendre() {
      const jeton = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      for (let essai = 0; essai < 6; essai += 1) {
        let cur = null; try { cur = JSON.parse(await (await (await this.fichier(DOSSIER_VERROU)).getFile()).text()); } catch (e) { if (e && e.auth) throw e; cur = null; }
        if (cur && cur.jeton && Date.now() - (Number(cur.t) || 0) < DOSSIER_VERROU_MS) { await dossierPause(400 + Math.round(Math.random() * 600)); continue; }
        await this.ecrire(await this.fichier(DOSSIER_VERROU, null, true), JSON.stringify({ jeton, t: Date.now(), appareil: (typeof appareilNom === 'function' ? appareilNom() : '') }));
        await dossierPause(o.delaiVerrou != null ? o.delaiVerrou : 250);
        let relu = null; try { relu = JSON.parse(await (await (await this.fichier(DOSSIER_VERROU)).getFile()).text()); } catch (e) { relu = null; }
        if (relu && relu.jeton === jeton) return jeton;
      }
      throw { conflit: true }; // dossier occupé : la synchronisation relit puis réessaie
    },
    async verrouRendre(jeton) { try { const f = await (await this.fichier(DOSSIER_VERROU)).getFile(); const cur = JSON.parse(await f.text()); if (cur && cur.jeton === jeton) await (await this.poignee(false)).removeEntry(DOSSIER_VERROU); } catch (e) { /* déjà retiré ou expiré */ } },
    async ecrireBase(d, texte, rev) {
      const jeton = o.verrou ? await this.verrouPrendre() : null;
      try {
        const cur = await this.infoBase(); if (cur && (rev === null || cur.rev !== rev)) throw { conflit: true };
        const f = await this.ecrire(await this.fichier(CLOUD_BASE, null, true), texte); return { rev: this.rev(f) };
      } finally { if (jeton) await this.verrouRendre(jeton); }
    },
    async listerDocs() { const r = {}; try { const d = await (await this.poignee(false)).getDirectoryHandle('documents', { create: true }); for await (const [n, h] of d.entries()) if (h.kind === 'file') r[n] = n; } catch (e) { if (e && e.auth) throw e; } return r; },
    async lireDoc(d, ref) { return (await this.fichier(ref, 'documents')).getFile(); },
    async ecrireDoc(d, nom, blob) { await this.ecrire(await this.fichier(nom, 'documents', true), blob); return nom; },
    async ecrireHistorique(d, nom, texte) { await this.ecrire(await this.fichier(nom, 'historique', true), texte); },
    async deconnecter() { this.h = null; try { await sdbRun('lien', 'readwrite', (s) => s.delete(o.cle)); } catch (e) { /* ignoré */ } },
  };
}
const LOC = dossierFournisseur({ id: 'dossier', nom: 'Dossier de l’ordinateur', cle: 'dossier', fenetre: 'oenotrack' });
const RES = dossierFournisseur({ id: 'reseau', nom: 'Dossier réseau de l’entreprise', cle: 'reseau', fenetre: 'oenotrack-reseau', verrou: true });
const CLOUD_FOURNISSEURS = { google: GD, onedrive: MS, dropbox: DBX, dossier: LOC, reseau: RES };
