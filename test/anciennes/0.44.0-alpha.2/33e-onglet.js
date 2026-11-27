/* ============ ONGLET UNIQUE (0.38.0-alpha.3) : un seul onglet actif à la fois sur cet appareil ============
   Deux onglets ouverts écrivaient chacun la base entière depuis leur copie en mémoire : la saisie de l'un effaçait celle de l'autre,
   sans message. Désormais le premier onglet tient un verrou (Web Locks, « oenotrack-onglet ») ; un autre onglet affiche « Œnotrack est
   déjà ouvert dans un autre onglet » et n'écrit rien. « Reprendre la main ici » prend le verrou : l'ancien onglet se bloque, termine
   ses écritures en cours (coffre), le signale (BroadcastChannel « oenotrack-onglets »), puis ce nouvel onglet se recharge et relit la
   base à jour. Sans Web Locks (anciens navigateurs) : le canal seul ; sans les deux : aucun blocage (comme avant). */
const ONGLET_VERROU = 'oenotrack-onglet';
const ONGLET_CANAL = 'oenotrack-onglets';
const _onglet = { etat: 'inconnu', id: `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, canal: null, ecoute: new Set(), vuActif: false, attenteCede: null };
const ongletBloque = () => _onglet.etat === 'bloque';
const ongletEtat = () => _onglet.etat;
const ongletEcouter = (f) => { _onglet.ecoute.add(f); return () => _onglet.ecoute.delete(f); };
function ongletNotifier(e) { _onglet.etat = e; _onglet.ecoute.forEach((f) => { try { f(e); } catch (x) { /* ignoré */ } }); }
const ongletAttente = (ms) => new Promise((r) => setTimeout(r, ms));
const ongletLocks = () => { try { return typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function' ? navigator.locks : null; } catch (e) { return null; } };
function ongletPoster(m) { const c = ongletCanal(); if (c) { try { c.postMessage({ ...m, id: _onglet.id }); } catch (e) { /* ignoré */ } } }
function ongletCanal() {
  if (_onglet.canal !== null) return _onglet.canal;
  try { _onglet.canal = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(ONGLET_CANAL) : false; } catch (e) { _onglet.canal = false; }
  if (_onglet.canal) _onglet.canal.onmessage = (ev) => ongletMessage((ev && ev.data) || {});
  return _onglet.canal;
}
function ongletMessage(m) {
  if (!m || m.id === _onglet.id) return;
  if (m.type === 'qui' && _onglet.etat === 'actif') ongletPoster({ type: 'actif' });
  else if (m.type === 'actif') _onglet.vuActif = true;
  else if (m.type === 'prendre' && _onglet.etat === 'actif' && !ongletLocks()) ongletCeder(); // sans Web Locks : le canal suffit
  else if (m.type === 'cede' && _onglet.attenteCede) { const f = _onglet.attenteCede; _onglet.attenteCede = null; f(); }
}
// un autre onglet a pris la main : plus rien n'est écrit ici ; les écritures chiffrées en cours se terminent, puis on le lui dit
async function ongletCeder() {
  if (_onglet.etat === 'bloque') return; ongletNotifier('bloque');
  try { if (typeof coffreAttendre === 'function') await coffreAttendre(); } catch (e) { /* ignoré */ }
  ongletPoster({ type: 'cede' });
}
// verrou tenu tant que la page est ouverte ; voler = « Reprendre la main ici » (l'onglet qui le tenait est prévenu par le rejet de sa demande)
function ongletTenir(voler) {
  const L = ongletLocks();
  if (L) {
    return new Promise((res) => {
      L.request(ONGLET_VERROU, voler ? { steal: true } : { ifAvailable: true }, (lock) => { if (!lock) { res(false); return null; } res(true); return new Promise(() => { /* tenu jusqu'à la fermeture */ }); })
        .catch(() => { res(false); ongletCeder(); });
    });
  }
  if (!ongletCanal()) return Promise.resolve(true);
  if (voler) return Promise.resolve(true);
  _onglet.vuActif = false; ongletPoster({ type: 'qui' });
  return ongletAttente(250).then(() => !_onglet.vuActif);
}
// → 'actif' | 'bloque'
async function ongletDemarrer() {
  if (_onglet.etat === 'actif' || _onglet.etat === 'bloque') return _onglet.etat;
  if (typeof window === 'undefined' || typeof document === 'undefined') { ongletNotifier('actif'); return 'actif'; } // hors page (Node, tests du moteur)
  ongletCanal();
  let ok = await ongletTenir(false);
  if (!ok) { await ongletAttente(500); ok = await ongletTenir(false); } // rechargement : le verrou de la page précédente est rendu un peu après
  ongletNotifier(ok ? 'actif' : 'bloque'); return _onglet.etat;
}
// « Reprendre la main ici » : verrou pris, l'ancien onglet termine ses écritures (2 s au plus), puis rechargement (base relue à jour)
async function ongletReprendre(recharger) {
  const cede = new Promise((r) => { _onglet.attenteCede = r; setTimeout(r, 2000); });
  await ongletTenir(true); ongletPoster({ type: 'prendre' });
  await cede; _onglet.attenteCede = null;
  if (recharger !== false) { try { window.location.reload(); } catch (e) { /* ignoré */ } }
  return true;
}
