/* ============ ÉCHELLES PAR APPELLATION (0.47.0-alpha.1) ============
   Chaque appellation de la liste de l'exploitation (db.lists.appellations) a sa hiérarchie (lists.appellations[].echelle = id de
   ECHELLE_HIERARCHIES), proposée d'après son nom et sa région (appEchelleProposee) puis confirmée par l'utilisateur ; une parcelle porte
   son appellation et son niveau dans la hiérarchie de cette appellation (parcelles[].appellationId, parcelles[].niveau) ; un lot en
   reprend la répartition au prorata de ses parcelles (lotAppellations, depuis la composition). L'échelle des crus de l'exploitation
   (db.lists.echelles, crus[].echelle) reste en place : composition, plafonds, déclarations et versions antérieures s'en servent toujours.
   Les hiérarchies ajoutées en 0.47.0-alpha.1 sont des repères réglementaires « à vérifier » pour chaque appellation. */
const _ECH = (s) => s.split('|').map((x, i, a) => { const [id, label, un, court] = x.split(':'); return { id, label, un: un || label, court: court || id.toUpperCase().slice(0, 4), rang: i + 1, couleur: ['#8A7F6B', '#5F8A6B', '#7C2D36', '#C07A2C', '#C79A1E', '#9C6B1E'][Math.min(i, 5)] }; });
const ECHELLE_HIERARCHIES = [
  ...ECHELLE_PRESETS,
  { id: 'chablis', nom: 'Chablis', titre: 'Hiérarchie des appellations', aVerifier: true, items: _ECH('petit_chablis:Petit Chablis::PCH|chablis:Chablis::CHA|premier:Chablis premier cru:Chablis 1er cru:1ER|grand:Chablis grand cru:Chablis grand cru:GC') },
  { id: 'beaujolais', nom: 'Beaujolais', titre: 'Hiérarchie des appellations', aVerifier: true, items: _ECH('regionale:Beaujolais::BJ|villages:Beaujolais Villages::BJV|cru:Crus du Beaujolais:Cru du Beaujolais:CRU') },
  { id: 'rhone', nom: 'Côtes du Rhône', titre: 'Hiérarchie des appellations', aVerifier: true, items: _ECH('regionale:Côtes du Rhône::CDR|villages:Côtes du Rhône Villages::CDRV|villages_nom:Villages avec nom géographique:Village nommé:VN|cru:Crus de la vallée du Rhône:Cru:CRU') },
  { id: 'medoc', nom: 'Médoc', titre: 'Classements', aVerifier: true, items: _ECH('regionale:Bordeaux et Médoc (régionales):Régionale:RÉG|communale:Appellations communales:Communale:COM|cru_bourgeois:Crus bourgeois:Cru bourgeois:CB|cru_classe:Crus classés en 1855:Cru classé 1855:CC') },
  { id: 'sauternes', nom: 'Sauternes et Barsac', titre: 'Classement de 1855', aVerifier: true, items: _ECH('aoc:Sauternes, Barsac::AOC|deuxieme:Deuxièmes crus classés:2e cru classé:2CC|premier:Premiers crus classés:1er cru classé:1CC|superieur:Premier cru supérieur::1CS') },
  { id: 'graves', nom: 'Graves', titre: 'Classement', aVerifier: true, items: _ECH('aoc:Graves, Pessac-Léognan::AOC|cru_classe:Crus classés de Graves:Cru classé de Graves:CCG') },
  { id: 'languedoc', nom: 'Languedoc', titre: 'Hiérarchie des appellations', aVerifier: true, items: _ECH('regionale:Languedoc (régionale):Régionale:RÉG|grand_vin:Grands vins du Languedoc:Grand vin:GV|cru:Crus du Languedoc:Cru:CRU') },
  { id: 'loire', nom: 'Val de Loire', titre: 'Hiérarchie des appellations', aVerifier: true, items: _ECH('regionale:Appellations régionales:Régionale:RÉG|communale:Communales et sous-régionales:Communale:COM|premier:Premiers crus:Premier cru:1ER|grand:Grands crus:Grand cru:GC') },
  { id: 'italie', nom: 'Italie', titre: 'Classement', aVerifier: true, items: _ECH('vino:Vino (sans IG)::VINO|igt:IGT::IGT|doc:DOC::DOC|docg:DOCG::DOCG') },
  { id: 'espagne', nom: 'Espagne', titre: 'Classement', aVerifier: true, items: _ECH('vino:Vino (sans IG)::VINO|igp:Vino de la Tierra (IGP)::VT|vc:Vino de calidad (VC)::VC|do:Denominación de Origen (DO)::DO|doca:DOCa / DOQ::DOCA|pago:Vino de Pago::VP') },
  { id: 'allemagne', nom: 'Allemagne', titre: 'Pyramide d’origine (loi de 2021)', aVerifier: true, items: _ECH('deutscher_wein:Deutscher Wein::DW|landwein:Landwein (g.g.A.)::LW|gutswein:Gutswein (Qualitätswein)::GW|ortswein:Ortswein::OW|lagenwein:Lagenwein::LGW') },
  { id: 'autriche', nom: 'Autriche', titre: 'Pyramide d’origine (DAC)', aVerifier: true, items: _ECH('wein:Wein (sans IG)::W|landwein:Landwein::LW|gebietswein:Gebietswein (Qualitätswein)::GBW|ortswein:Ortswein::OW|riedenwein:Riedenwein::RW') },
  { id: 'portugal', nom: 'Portugal', titre: 'Classement', aVerifier: true, items: _ECH('vinho:Vinho (sans IG)::V|regional:Vinho Regional (IG)::VR|doc:DOC (DOP)::DOC') },
  { id: 'suisse', nom: 'Suisse', titre: 'Classement', aVerifier: true, items: _ECH('vin_pays:Vin de pays::VDP|aoc:AOC cantonale ou régionale:AOC:AOC|aoc_locale:AOC locale (commune, lieu-dit):AOC locale:LOC|grand_cru:Grands crus:Grand cru:GC|premier_grand_cru:Premiers grands crus:Premier grand cru:PGC') },
];
const echelleHierarchie = (id) => ECHELLE_HIERARCHIES.find((h) => h.id === id) || null;
const APP_ECH_MEDOC = ['Médoc', 'Haut-Médoc', 'Margaux', 'Pauillac', 'Saint-Julien', 'Saint-Estèphe', 'Listrac-Médoc', 'Moulis-en-Médoc', 'Moulis'];
// hiérarchie proposée pour une appellation (référence du référentiel, sinon nom et région du profil)
function appEchelleProposee(ap, regionProfil) {
  const ref = (ap && ap.ref) || {}; const nom = String((ap && (ap.label || ap.nom)) || ''); const n = norm(nom);
  const region = ref.region || regionProfil || ''; const pays = ref.pays || (region && profilRegionDef(region) && profilRegionDef(region).pays !== 'France' ? region : 'france');
  if (['italie', 'espagne', 'allemagne', 'autriche', 'portugal', 'suisse'].includes(pays)) return pays;
  if (ref.eu === 'IGP') return 'generique';
  if (region === 'champagne') return 'champagne';
  if (/chablis/.test(n)) return 'chablis';
  if (region === 'bourgogne') return 'bourgogne';
  if (region === 'alsace') return 'alsace';
  if (/saint-emilion|saint emilion/.test(n)) return 'saint-emilion';
  if (APP_ECH_MEDOC.some((x) => norm(x) === n)) return 'medoc';
  if (/sauternes|barsac/.test(n)) return 'sauternes';
  if (/graves|pessac/.test(n)) return 'graves';
  if (region === 'beaujolais') return 'beaujolais';
  if (region === 'rhone') return 'rhone';
  if (region === 'languedoc') return 'languedoc';
  if (region === 'loire') return 'loire';
  return 'generique';
}
// hiérarchie d'une appellation de la liste : choisie (confirmée) ou proposée
function appellationEchelle(db, appId) {
  const ap = ((db.lists && db.lists.appellations) || []).find((x) => x && x.id === appId); if (!ap) return null;
  const choisie = ap.echelle && echelleHierarchie(ap.echelle) ? ap.echelle : '';
  const id = choisie || appEchelleProposee(ap, profilViticole(db).region);
  return { id, hierarchie: echelleHierarchie(id), confirmee: !!choisie };
}
function appellationEchelleSet(db, appId, hierId, uid) {
  const ap = ((db.lists && db.lists.appellations) || []).find((x) => x && x.id === appId); if (!ap) return fail('Appellation introuvable.');
  if (!echelleHierarchie(hierId)) return fail('Hiérarchie inconnue.');
  const n = (db.parcelles || []).filter((p) => p.appellationId === appId && p.niveau && !echelleHierarchie(hierId).items.some((i) => i.id === p.niveau)).length;
  if (n) return fail(`${n} parcelle(s) ont un niveau qui n’existe pas dans cette hiérarchie : changez d’abord leur niveau.`);
  ap.echelle = hierId; ap.echellePar = uid || ''; ap.echelleLe = new Date().toISOString(); return okr();
}
const appellationNiveaux = (db, appId) => { const e = appellationEchelle(db, appId); return e && e.hierarchie ? e.hierarchie.items : []; };
// appellations et niveaux d'un lot, au prorata de ses parcelles (parcelle sans appellation ou inconnue : « ? »)
function lotAppellations(db, R, lotId) {
  const comp = composition(db, R, lotId); const P = comp.parcelles || {}; const out = {};
  Object.keys(P).forEach((pid) => { const p = (db.parcelles || []).find((x) => x.id === pid); const k = p && p.appellationId ? `${p.appellationId}|${p.niveau || ''}` : '?'; out[k] = (out[k] || 0) + P[pid]; });
  return Object.keys(out).map((k) => { if (k === '?') return { appId: '', niveau: '', part: out[k], label: '' };
    const [appId, niveau] = k.split('|'); const ap = (db.lists.appellations || []).find((x) => x.id === appId) || {}; const it = appellationNiveaux(db, appId).find((i) => i.id === niveau);
    return { appId, niveau, part: out[k], label: ap.label || appId, niveauLabel: it ? it.un : '' }; }).sort((a, b) => b.part - a.part);
}
