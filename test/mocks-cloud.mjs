// Services simulés pour les tests : Google Drive (v3 + GIS), Microsoft Graph (OneDrive + connexion PKCE), Dropbox (v2 + PKCE)
// Sémantique minimale mais fidèle aux points utilisés : dossiers, recherche, contenu, révisions (version / eTag / rev), conflits.
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
const json = (route, status, obj, h) => route.fulfill({ status, headers: { ...CORS, 'content-type': 'application/json', ...(h || {}) }, body: JSON.stringify(obj) });
const brut = (route, status, buf, type) => route.fulfill({ status, headers: { ...CORS, 'content-type': type || 'application/octet-stream' }, body: buf });
// page de connexion simulée : l'utilisateur accepte, le service renvoie vers Œnotrack
const pageRetour = (route, url) => route.fulfill({ status: 200, headers: { 'content-type': 'text/html' }, body: `<!doctype html><title>Connexion</title><p>Connexion…</p><script>location.replace(${JSON.stringify(url)})</script>` });
export function services() {
  const S = { appels: [], google: { fichiers: {}, n: 0 }, ms: { items: {}, n: 0 }, dbx: { f: {}, n: 0 } };
  const log = (x) => S.appels.push(x);
  // ---------- Google ----------
  const G = S.google; const gNouv = (o) => { G.n += 1; const id = `g${G.n}`; G.fichiers[id] = { id, version: 1, trashed: false, ...o }; return G.fichiers[id]; };
  gNouv({ name: 'Compta', folder: true, parents: ['root'] }); gNouv({ name: 'Vendanges 2026', folder: true, parents: ['root'] }); gNouv({ name: 'Partagé par le chef de cave', folder: true, parents: ['autre'], shared: true });
  const gListe = (q) => Object.values(G.fichiers).filter((f) => {
    if (f.trashed) return false; if (/mimeType='application\/vnd.google-apps.folder'/.test(q) && !f.folder) return false;
    if (/sharedWithMe/.test(q)) return !!f.shared;
    const p = /'([^']+)' in parents/.exec(q); if (p && !(f.parents || []).includes(p[1])) return false;
    const n = /name='((?:[^'\\]|\\.)*)'/.exec(q); if (n && f.name !== n[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\')) return false;
    return true;
  });
  const gMulti = (buf, ct) => { const b = /boundary=([^;]+)/.exec(ct)[1]; const s = buf.toString('latin1'); const parts = s.split(`--${b}`).slice(1, -1).map((p) => { const i = p.indexOf('\r\n\r\n'); return p.slice(i + 4, p.length - 2); }); return { meta: JSON.parse(Buffer.from(parts[0], 'latin1').toString('utf8')), contenu: Buffer.from(parts[1], 'latin1') }; };
  async function google(route, u, req) {
    if (u.startsWith('https://accounts.google.com/gsi/client')) return route.fulfill({ status: 200, headers: { 'content-type': 'text/javascript' }, body: `window.google={accounts:{oauth2:{initTokenClient:function(c){return{requestAccessToken:function(){window.__gisAppels=(window.__gisAppels||0)+1;setTimeout(function(){c.callback({access_token:'g-tok',expires_in:3600});},20);}};},revoke:function(t,cb){cb&&cb();}}}};` });
    if (!u.startsWith('https://www.googleapis.com/')) return false;
    if (req.method() === 'OPTIONS') return brut(route, 204, '');
    if ((req.headers().authorization || '') !== 'Bearer g-tok') return json(route, 401, { error: { code: 401 } });
    const url = new URL(u); const p = url.pathname; log(`G ${req.method()} ${p}`);
    if (p === '/drive/v3/about') return json(route, 200, { user: { displayName: 'Vigneron Test', emailAddress: 'vigneron@gmail.com' } });
    if (p === '/drive/v3/files' && req.method() === 'GET') return json(route, 200, { files: gListe(url.searchParams.get('q')).map((f) => ({ id: f.id, name: f.name, version: String(f.version), size: String((f.contenu || '').length) })) });
    if (p === '/drive/v3/files' && req.method() === 'POST') { const b = JSON.parse(req.postData()); const f = gNouv({ name: b.name, folder: b.mimeType === 'application/vnd.google-apps.folder', parents: b.parents }); return json(route, 200, { id: f.id, name: f.name }); }
    let m = /^\/drive\/v3\/files\/([^/]+)$/.exec(p);
    if (m && url.searchParams.get('alt') === 'media') { const f = G.fichiers[m[1]]; return f ? brut(route, 200, f.contenu) : json(route, 404, {}); }
    if (p === '/upload/drive/v3/files' && req.method() === 'POST') { const x = gMulti(req.postDataBuffer(), req.headers()['content-type']); const f = gNouv({ name: x.meta.name, parents: x.meta.parents, contenu: x.contenu }); return json(route, 200, { id: f.id, version: String(f.version) }); }
    m = /^\/upload\/drive\/v3\/files\/([^/]+)$/.exec(p);
    if (m && req.method() === 'PATCH') { const f = G.fichiers[m[1]]; f.contenu = req.postDataBuffer(); f.version += 1; return json(route, 200, { id: f.id, version: String(f.version) }); }
    return json(route, 400, { error: `non simulé ${req.method()} ${p}` });
  }
  // ---------- Microsoft (connexion + Graph) ----------
  const M = S.ms; const mNouv = (o) => { M.n += 1; const id = `m${M.n}`; M.items[id] = { id, eTag: `"e${id}.1"`, v: 1, ...o }; return M.items[id]; };
  mNouv({ name: 'Documents', folder: true, parent: 'root' }); const mCave = mNouv({ name: 'Cave', folder: true, parent: 'root' });
  const mEnfants = (pid) => Object.values(M.items).filter((x) => x.parent === pid);
  const mChemin = (pid, chemin, creer) => { let cur = pid; const segs = chemin.split('/').filter(Boolean).map(decodeURIComponent); for (let i = 0; i < segs.length; i += 1) { let x = mEnfants(cur).find((y) => y.name === segs[i]); if (!x) { if (!creer) return null; x = mNouv({ name: segs[i], folder: i < segs.length - 1, parent: cur }); if (i === segs.length - 1) x.nouveau = true; } cur = x.id; } return M.items[cur]; };
  const mVue = (x) => ({ id: x.id, name: x.name, eTag: x.eTag, size: (x.contenu || '').length, ...(x.folder ? { folder: { childCount: mEnfants(x.id).length } } : { file: {} }), parentReference: { driveId: 'drv1' } });
  async function microsoft(route, u, req) {
    if (u.startsWith('https://login.microsoftonline.com/')) {
      const url = new URL(u);
      if (/\/authorize$/.test(url.pathname)) { log('MS authorize'); S.msAuth = Object.fromEntries(url.searchParams); return pageRetour(route, `${url.searchParams.get('redirect_uri')}?code=ms-code&state=${encodeURIComponent(url.searchParams.get('state'))}`); }
      if (req.method() === 'OPTIONS') return brut(route, 204, '');
      const b = new URLSearchParams(req.postData() || ''); log(`MS token ${b.get('grant_type')}`); S.msToken = Object.fromEntries(b);
      return json(route, 200, { access_token: 'ms-tok', refresh_token: 'ms-ref', expires_in: 3600, token_type: 'Bearer' });
    }
    if (u.startsWith('https://dl.test/')) { const id = u.split('/').pop(); return brut(route, 200, M.items[id].contenu); }
    if (!u.startsWith('https://graph.microsoft.com/')) return false;
    if (req.method() === 'OPTIONS') return brut(route, 204, '');
    if ((req.headers().authorization || '') !== 'Bearer ms-tok') return json(route, 401, { error: { code: 'InvalidAuthenticationToken' } });
    const url = new URL(u); const p = decodeURIComponent(url.pathname).replace('/v1.0', ''); log(`MS ${req.method()} ${p}`);
    if (p === '/me') return json(route, 200, { displayName: 'Vigneron Test', mail: 'vigneron@outlook.fr' });
    if (p === '/me/drive/root/children' && req.method() === 'GET') return json(route, 200, { value: mEnfants('root').map(mVue) });
    if (p === '/me/drive/sharedWithMe') return json(route, 200, { value: [] });
    if (p === '/me/drive/root/children' && req.method() === 'POST') { const b = JSON.parse(req.postData()); return json(route, 201, mVue(mNouv({ name: b.name, folder: true, parent: 'root' }))); }
    let m = /^\/drives\/drv1\/items\/([^/:]+)(?::\/(.+?))?(:\/content|:\/createUploadSession|\/children|\/content)?$/.exec(p);
    if (!m) return json(route, 400, { error: `non simulé ${p}` });
    const [, id, chemin, suite] = m;
    if (!chemin && suite === '/children' && req.method() === 'GET') return json(route, 200, { value: mEnfants(id).map(mVue) });
    if (!chemin && suite === '/children' && req.method() === 'POST') { const b = JSON.parse(req.postData()); return json(route, 201, mVue(mNouv({ name: b.name, folder: true, parent: id }))); }
    if (!chemin && !suite) { const x = M.items[id]; return x ? json(route, 200, { id: x.id, '@microsoft.graph.downloadUrl': `https://dl.test/${x.id}` }) : json(route, 404, { error: { code: 'itemNotFound' } }); }
    if (chemin && !suite) { const x = mChemin(id, chemin, false); return x ? json(route, 200, mVue(x)) : json(route, 404, { error: { code: 'itemNotFound' } }); }
    if (chemin && suite === '/children') { const x = mChemin(id, chemin, false); return x ? json(route, 200, { value: mEnfants(x.id).map(mVue) }) : json(route, 404, { error: { code: 'itemNotFound' } }); }
    if (chemin && suite === ':/content' && req.method() === 'PUT') {
      const ex = mChemin(id, chemin, false); const im = req.headers()['if-match'];
      if (ex && /conflictBehavior=fail/.test(u)) return json(route, 409, { error: { code: 'nameAlreadyExists' } });
      if (ex && im && im !== ex.eTag) return json(route, 412, { error: { code: 'resourceModified' } });
      const x = ex || mChemin(id, chemin, true); x.contenu = req.postDataBuffer(); x.v += 1; x.eTag = `"e${x.id}.${x.v}"`; delete x.nouveau;
      return json(route, ex ? 200 : 201, mVue(x));
    }
    return json(route, 400, { error: `non simulé ${req.method()} ${p}` });
  }
  // ---------- Dropbox ----------
  const D = S.dbx; const dSet = (path, o) => { D.n += 1; D.f[path.toLowerCase()] = { path_display: path, name: path.split('/').pop(), rev: `r${D.n}`, ...o }; return D.f[path.toLowerCase()]; };
  dSet('/Cave', { folder: true }); dSet('/Photos', { folder: true });
  const dVue = (x) => ({ '.tag': x.folder ? 'folder' : 'file', name: x.name, path_lower: x.path_display.toLowerCase(), path_display: x.path_display, id: `id:${x.path_display}`, ...(x.folder ? {} : { rev: x.rev, size: (x.contenu || '').length }) });
  const dErr = (route, s) => json(route, 409, { error_summary: s, error: {} });
  async function dropbox(route, u, req) {
    if (u.startsWith('https://www.dropbox.com/oauth2/authorize')) { const url = new URL(u); S.dbxAuth = Object.fromEntries(url.searchParams); log('DBX authorize'); return pageRetour(route, `${url.searchParams.get('redirect_uri')}?code=dbx-code&state=${encodeURIComponent(url.searchParams.get('state'))}`); }
    if (!u.startsWith('https://api.dropboxapi.com/') && !u.startsWith('https://content.dropboxapi.com/')) return false;
    if (req.method() === 'OPTIONS') return brut(route, 204, '');
    const url = new URL(u); const p = url.pathname;
    if (p === '/oauth2/token') { const b = new URLSearchParams(req.postData() || ''); log(`DBX token ${b.get('grant_type')}`); S.dbxToken = Object.fromEntries(b); return json(route, 200, { access_token: 'd-tok', refresh_token: 'd-ref', expires_in: 14400, token_type: 'bearer' }); }
    if ((req.headers().authorization || '') !== 'Bearer d-tok') return json(route, 401, { error_summary: 'expired_access_token/' });
    log(`DBX ${p}`);
    const arg = req.headers()['dropbox-api-arg'] ? JSON.parse(req.headers()['dropbox-api-arg']) : null; const body = arg ? null : JSON.parse(req.postData() || 'null');
    if (p === '/2/users/get_current_account') return json(route, 200, { name: { display_name: 'Vigneron Test' }, email: 'vigneron@exemple.fr' });
    if (p === '/2/files/list_folder') { const base = (body.path || '').toLowerCase(); if (base && !D.f[base]) return dErr(route, 'path/not_found/.'); return json(route, 200, { entries: Object.values(D.f).filter((x) => { const pl = x.path_display.toLowerCase(); return pl.startsWith(`${base}/`) && !pl.slice(base.length + 1).includes('/'); }).map(dVue), has_more: false, cursor: 'c' }); }
    if (p === '/2/files/create_folder_v2') { const x = dSet(body.path, { folder: true }); return json(route, 200, { metadata: dVue(x) }); }
    if (p === '/2/files/get_metadata') { const x = D.f[body.path.toLowerCase()]; return x ? json(route, 200, dVue(x)) : dErr(route, 'path/not_found/..'); }
    if (p === '/2/files/download') { const x = D.f[arg.path.toLowerCase()]; return x ? brut(route, 200, x.contenu) : dErr(route, 'path/not_found/'); }
    if (p === '/2/files/upload') {
      const pl = arg.path.toLowerCase(); const ex = D.f[pl]; const mode = arg.mode['.tag'];
      if (mode === 'add' && ex) return dErr(route, 'path/conflict/file/..');
      if (mode === 'update' && (!ex || ex.rev !== arg.mode.update)) return dErr(route, 'path/conflict/file/..');
      const segs = arg.path.split('/').filter(Boolean); for (let i = 1; i < segs.length; i += 1) { const dp = `/${segs.slice(0, i).join('/')}`; if (!D.f[dp.toLowerCase()]) dSet(dp, { folder: true }); }
      const x = dSet(ex ? ex.path_display : arg.path, { contenu: req.postDataBuffer() }); return json(route, 200, dVue(x));
    }
    return json(route, 400, { error_summary: `non simulé ${p}` });
  }
  // aides pour les tests : semer un dossier contenant une base, modifier la base « depuis un autre appareil »
  S.msSemer = (nom, contenu) => { const d = mNouv({ name: nom, folder: true, parent: 'root' }); if (contenu) mNouv({ name: 'oenotrack-base.json', parent: d.id, contenu: Buffer.from(contenu) }); return d; };
  S.msBase = () => Object.values(M.items).find((x) => x.name === 'oenotrack-base.json');
  S.msModifier = (fn) => { const x = S.msBase(); const j = JSON.parse(x.contenu.toString('utf8')); const anc = [j.sync.id, ...(j.sync.ancetres || [])]; fn(j.db); j.db.meta.modifLe = '2099-01-01T00:00:00.000Z'; j.sync = { ...j.sync, id: `sAUTRE${x.v}`, ancetres: anc, appareilNom: 'Tablette du chai', ecritLe: new Date().toISOString() }; x.contenu = Buffer.from(JSON.stringify(j)); x.v += 1; x.eTag = `"e${x.id}.${x.v}"`; };
  S.gBase = () => Object.values(G.fichiers).find((x) => x.name === 'oenotrack-base.json');
  S.gModifier = (fn) => { const x = S.gBase(); const j = JSON.parse(x.contenu.toString('utf8')); const anc = [j.sync.id, ...(j.sync.ancetres || [])]; fn(j.db); j.db.meta.modifLe = '2099-01-01T00:00:00.000Z'; j.sync = { ...j.sync, id: `sAUTRE${x.version}`, ancetres: anc, appareilNom: 'Tablette du chai', ecritLe: new Date().toISOString() }; x.contenu = Buffer.from(JSON.stringify(j)); x.version += 1; };
  S.routes = async (route, u) => { const req = route.request(); for (const f of [google, microsoft, dropbox]) { const r = await f(route, u, req); if (r !== false) return true; } return false; };
  return S;
}
