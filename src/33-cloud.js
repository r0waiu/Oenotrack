/* ============ STOCKAGE DRIVE : la base vit dans un dossier Google Drive / OneDrive / Dropbox / de l'ordinateur ============ */
// Local d'abord : chaque appareil garde sa copie (saisie instantanée, coupure de réseau sans perte) et la synchronise avec le
// dossier choisi. Contenu du dossier : oenotrack-base.json (base + en-tête de synchronisation), documents/ (un fichier par
// document joint), historique/ (une copie par jour d'utilisation). Plusieurs appareils et plusieurs personnes peuvent écrire
// dans le même dossier : chaque écriture est conditionnelle (révision) et, si le fichier a changé entre-temps, on relit,
// on réunit (fusion à trois voies de 32-sync.js) puis on réécrit.
//
// Fournisseur (adaptateur) :
//   infoBase(dossier) → null | { rev }                    lireBase(dossier) → null | { texte, rev }
//   ecrireBase(dossier, texte, revAttendue) → { rev }     (lève { conflit: true } si le fichier a changé depuis revAttendue)
//   listerDocs(dossier) → { nomFichier: ref }             lireDoc(dossier, ref) → Blob     ecrireDoc(dossier, nom, blob) → ref
//   ecrireHistorique(dossier, nom, texte) (facultatif)
// Erreurs normalisées : { auth: true } (reconnexion), { reseau: true } (hors ligne), { conflit: true }.
const CLOUD_BASE = 'oenotrack-base.json';
const cloudErreur = (er) => (er && (er.auth || er.reseau || er.conflit || er.introuvable) ? er : { autre: true, message: (er && er.message) || String(er) });
const docNomDistant = (d) => { const m = /\.[a-z0-9]{1,6}$/i.exec((d && d.nom) || ''); return `${d.id}${m ? m[0].toLowerCase() : ''}`; };
const docIdDistant = (nom) => String(nom || '').split('.')[0];

/**
 * Une synchronisation complète : recevoir (si le fichier a changé), puis envoyer (si cet appareil a du nouveau).
 * h (hôte) : { lireLocale(), appliquer(db), vide(db), snapLire(id), snapEcrire(id, db), construire(db, sync) → texte (ou Promise),
 *              lire(texte) → { db, sync } (ou Promise), docLocal(id) → Promise<bool>, docLire(id) → Promise<Blob|null>, docEcrire(id, blob),
 *              facultatifs (chiffrement, 0.29.0-alpha.1) : docNom(doc) → nom distant, docEnvoi(blob) → Promise<Blob>, docRecu(blob) → Promise<Blob>,
 *              appareil: { tag, nom }, nouvelId(), maintenant() → ISO, aujourdhui() → 'AAAA-MM-JJ' }
 * e (état de cet appareil, modifié en place) : { rev, syncId, lignee, empreinteDistante, docsDistants, historiqueJour }
 * → { recu: fusion|null, adopte: bool, envoye: bool, docsRecus, docsEnvoyes, essais }
 */
async function cloudSynchroniser(f, dossier, e, h, opts) {
  opts = opts || {}; const res = { recu: null, adopte: false, envoye: false, docsRecus: 0, docsEnvoyes: 0, essais: 0, premier: false };
  e.docsDistants = e.docsDistants || {}; e.lignee = e.lignee || [];
  for (let essai = 0; essai < 4; essai += 1) {
    res.essais = essai + 1;
    // 1. recevoir
    const info = await f.infoBase(dossier);
    let docsR = null;
    if (info && info.rev !== e.rev) {
      const r = await f.lireBase(dossier);
      if (r) {
        const { db: R, sync } = await h.lire(r.texte); const idR = (sync && sync.id) || `r${hash36(String(r.rev))}`;
        const chaine = [idR, ...((sync && sync.ancetres) || [])].filter((x, i, a) => x && a.indexOf(x) === i);
        let base = null; for (const id of chaine) { base = await h.snapLire(id); if (base) break; }
        const L = h.lireLocale();
        if (!base && !e.syncId && (h.vide(L) || opts.adopter)) { h.appliquer(normalizeDb(clone(R))); res.adopte = true; }
        else {
          const fu = syncFusion(base, L, R); res.recu = fu; res.premier = !base;
          if (!fu.identique) {
            const nd = normalizeDb(clone(fu.db));
            if (fu.conflits.length) nd.meta.syncConflits = [...fu.conflits.map((c) => ({ ...c, date: h.maintenant(), fichier: CLOUD_BASE })), ...((L.meta && L.meta.syncConflits) || [])].slice(0, 60);
            h.appliquer(nd);
          }
        }
        await h.snapEcrire(idR, R);
        e.rev = r.rev; e.syncId = idR; e.lignee = chaine.slice(0, 20); e.empreinteDistante = syncEmpreinte(R);
        e.ecritPar = (sync && sync.appareilNom) || ''; e.ecritLe = (sync && sync.ecritLe) || '';
        // documents cités par la base et absents de cet appareil
        const D = h.lireLocale().docs || []; const manquants = [];
        for (const d of D) if (!(await h.docLocal(d.id))) manquants.push(d);
        if (manquants.length) {
          docsR = await f.listerDocs(dossier); const parId = {}; Object.keys(docsR).forEach((n) => { const id = docIdDistant(n); if (!parId[id] || /\.chiffre$/i.test(n)) parId[id] = docsR[n]; }); // copie chiffrée d'abord (0.29.0-alpha.1)
          for (const d of manquants) { const ref = parId[d.id]; if (!ref) continue; const b = await f.lireDoc(dossier, ref); if (b) { await h.docEcrire(d.id, h.docRecu ? await h.docRecu(b) : b); e.docsDistants[d.id] = ref; res.docsRecus += 1; } }
        }
      }
    } else if (!info) { e.rev = null; } // dossier vide (ou fichier supprimé) : on (ré)écrit tout
    // 2. envoyer
    const L2 = h.lireLocale();
    if (info && syncEmpreinte(L2) === e.empreinteDistante && !opts.forcer) return res;
    for (const d of (L2.docs || [])) {
      if (e.docsDistants[d.id]) continue;
      if (!docsR) { docsR = await f.listerDocs(dossier); }
      const nom = h.docNom ? h.docNom(d) : docNomDistant(d); if (docsR[nom]) { e.docsDistants[d.id] = docsR[nom]; continue; }
      const b = await h.docLire(d.id); if (!b) continue;
      e.docsDistants[d.id] = await f.ecrireDoc(dossier, nom, h.docEnvoi ? await h.docEnvoi(b) : b); res.docsEnvoyes += 1; // chiffré si le chiffrement est actif
    }
    const id = h.nouvelId(); const anc = [e.syncId, ...e.lignee].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 20);
    const sync = { id, ancetres: anc, appareil: h.appareil.tag, appareilNom: h.appareil.nom, ecritLe: h.maintenant(), documentsSepares: true };
    const texte = await h.construire(L2, sync); // chiffré si le chiffrement est actif (0.29.0-alpha.1)
    try {
      const w = await f.ecrireBase(dossier, texte, e.rev || null);
      await h.snapEcrire(id, normalizeDb(clone(L2)));
      e.rev = w.rev; e.syncId = id; e.lignee = anc; e.empreinteDistante = syncEmpreinte(L2); e.ecritPar = h.appareil.nom; e.ecritLe = sync.ecritLe; res.envoye = true;
      const jour = h.aujourdhui();
      if (f.ecrireHistorique && e.historiqueJour !== jour) { try { await f.ecrireHistorique(dossier, `oenotrack-base-${jour}.json`, texte); e.historiqueJour = jour; } catch (er) { /* l'historique ne bloque pas la synchronisation */ } }
      return res;
    } catch (er) {
      if (er && er.conflit) { e.rev = '__a_relire__'; continue; } // écrit ailleurs entre-temps : relire, réunir, réécrire
      throw er;
    }
  }
  throw { autre: true, message: 'Le fichier du Drive change sans arrêt : nouvel essai dans un instant.' };
}
