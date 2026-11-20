/* ============ FICHES D'ENREGISTREMENT À IMPRIMER (remplies à la main au chai, puis saisies dans Œnotrack) ============
   0.19.0-alpha.1 : modèles génériques pour tous les vignerons (plus de codes ni de réglages propres à une entreprise), en-tête compact.
   Colonnes : une par ligne, sous-colonnes indentées de 2 espaces ; « {clé} » = colonne pré-remplie (voir FICHE_KEYS) ;
   sous-colonnes « prévu » (valeur calculée par Œnotrack, en gris) et « relevé » (à noter par l'opérateur, case teintée).
   Champs sous l'en-tête : « Libellé {clé} » = pré-rempli (voir ficheChampVal), sinon à écrire à la main. */
const FICHE_FILLS = {
  aucun: 'Aucun pré-remplissage', apport: 'Apports de vendange', charges: 'Pressurage : raisins chargés', fractions: 'Pressurage : moûts obtenus (fractions)',
  reception: 'Réception de moûts (un compartiment par ligne)', debourbage: 'Débourbage (moût, clair, bourbes)', mouvements: 'Mouvements (soutirage, transfert)', assemblage: 'Assemblage (une ligne par cuve source)',
  traitements: 'Traitements (un produit par ligne)', levurage: 'Levurage (un produit par ligne)', froid: 'Stabilisation par le froid (produits ajoutés)', filtration: 'Filtration (vin filtré)',
  produits: 'Produits et matières sèches de l’opération', preparations: 'Préparations utilisées (liqueur, levain)', suivi: 'Suivi de cuves (la cuve + toutes les cuves en fermentation)',
  inventaire: 'Inventaire (toutes les cuves occupées)', sortie: 'Sorties (cuve, volume sorti)', etape: 'Changements de stade (lot, stade avant / après)',
};
const FICHE_CLES = {}; // (ancien aide-mémoire des clés, remplacé par les listes de l'éditeur)
const FICHE_VERSION = 2; // modèles d'origine de la 0.19.0-alpha.1 (génériques)
const pr2 = (t, k, s = 'relevé') => `${t}\n  prévu${k ? ` {${k}}` : ''}\n  ${s}`; // colonne « prévu / relevé »
const sub2 = (txt) => txt.split('\n').map((l) => `  ${l}`).join('\n'); // indente un bloc (sous-colonnes)
const FICHE_DEFAULTS = () => ([
  { id: 'apports', titre: 'Réception de vendange', sous: 'Apports de raisins au pressoir', prefixe: 'VEN', orientation: 'paysage', types: ['apport'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}', 'Lieu de réception'],
    tableaux: [{ titre: '', fill: 'apport', lignes: 14, zebre: false, fixes: '', cols: ['Apporteur {app}', 'Cru / commune {cru}', 'Parcelle {parcelle}', 'Cépage {cep}', 'Revendication {rev}', 'Heure', 'Caisses (nb)', pr2('Poids (kg)', 'kg', 'pesé'), 'État sanitaire', 'TAP (% vol)', 'N° de marc'].join('\n') }], notes: '' },
  { id: 'pressurage', titre: 'Pressurage', sous: 'Raisins chargés et moûts obtenus', prefixe: 'PRS', orientation: 'paysage', types: ['pressurage'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}', 'Pressoir {pressoir}', 'N° de marc / pressée {pressee}', 'Début du chargement', 'Fin du pressurage'],
    tableaux: [
      { titre: 'Raisins chargés', fill: 'charges', lignes: 6, zebre: false, fixes: '', cols: ['Apporteur {app}', 'Cru / commune {cru}', 'Cépage {cep}', 'Revendication {rev}', pr2('Poids chargé (kg)', 'kg', 'pesé')].join('\n') },
      { titre: 'Moûts obtenus', fill: 'fractions', lignes: 5, zebre: false, fixes: '', cols: ['Fraction {frac}', 'Cuve {cuve}', 'Lot {code}', pr2('Volume (hL)', 'vol'), 'Heure', 'Échantillon {ech}'].join('\n') }], notes: '' },
  { id: 'reception', titre: 'Réception de moûts', sous: 'Livraison en citerne ou en bennes', prefixe: 'REC', orientation: 'paysage', types: ['entree_mout'],
    champs: ['Date {date}', 'Heure d’arrivée', 'Opérateur(s) {operateurs}', 'Expéditeur {expediteur}', 'Transporteur', 'Immatriculation {immat}', 'Document (DAE, DSA, bon) {document}'],
    tableaux: [{ titre: '', fill: 'reception', lignes: 8, zebre: false, fixes: '', cols: ['Compart. {comp}', 'Origine (fraction · cépage · cru · millésime) {origine}', 'N° de lot {numLot}', pr2('Volume reçu (hL)', 'vol'), 'Cuve de destination {dest}', 'Lot en cuve {code}', pr2('Cuve avant (hL)', 'avHL'), pr2('Cuve après (hL)', 'apHL'), 'Densité / TAP', 'Échantillon {ech}'].join('\n') }],
    notes: 'Relevé : en hL, ou en cm si la cuve (ou la citerne) a un barème de jaugeage dans Œnotrack.' },
  { id: 'debourbage', titre: 'Débourbage', sous: 'Mise en débourbage, soutirage du clair et bourbes', prefixe: 'DEB', orientation: 'paysage', types: ['debourbage'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}'],
    tableaux: [{ titre: '', fill: 'debourbage', lignes: 10, zebre: false, fixes: '', cols: ['Cuve de moût {dep}', 'Lot {depCode}', pr2('Moût (hL)', 'depAvT'), 'Mise en débourbage (heure)', 'Soutirage (date, heure)', 'Cuve du clair {arr}', pr2('Clair soutiré (hL)', 'clairT'), pr2('Bourbes (hL)', 'bourbesT'), 'Destination des bourbes'].join('\n') }],
    notes: 'Relevé : en hL, ou en cm si la cuve a un barème de jaugeage dans Œnotrack.' },
  { id: 'mouvements', titre: 'Soutirages et transferts', sous: 'Mouvements de vin entre contenants', prefixe: 'MVT', orientation: 'paysage', types: ['soutirage', 'transfert'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}'],
    tableaux: [{ titre: '', fill: 'mouvements', lignes: 10, zebre: false, fixes: '', cols: ['Opération {op}', 'Cuve de départ {dep}', 'Lot {depCode}', pr2('Départ avant (hL)', 'depAvT'), pr2('Transféré (hL)', 'volT'), pr2('Départ après (hL)', 'depApT'), 'Cuve d’arrivée {arr}', pr2('Arrivée avant (hL)', 'arrAvT'), pr2('Arrivée après (hL)', 'arrApT'), 'Lies, pertes (hL) {perteT}'].join('\n') }],
    notes: 'Relevé : en hL, ou en cm si la cuve a un barème de jaugeage dans Œnotrack.' },
  { id: 'assemblages', titre: 'Assemblage', sous: 'Une ligne par cuve source', prefixe: 'ASS', orientation: 'paysage', types: ['assemblage'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}', 'Cuve d’assemblage {cuveAss}', 'Lot créé {lotCree}', 'Volume final prévu (hL) {volFinal}', 'Volume final relevé (hL)'],
    tableaux: [{ titre: '', fill: 'assemblage', lignes: 10, zebre: false, fixes: '', cols: ['Cuve source {dep}', 'Lot {depCode}', 'Désignation {depDesignation}', pr2('Dans la cuve (hL)', 'depAvT'), pr2('À prélever (hL)', 'volT', 'prélevé'), pr2('Reste (hL)', 'depApT'), 'Fait {ech}'].join('\n') }], notes: '' },
  { id: 'traitements', titre: 'Traitements et ajouts de produits', sous: 'Produits œnologiques ajoutés aux cuves', prefixe: 'TRT', orientation: 'paysage', types: ['intrant'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}'],
    tableaux: [{ titre: '', fill: 'traitements', lignes: 12, zebre: false, fixes: '', cols: ['Cuve {cuve}', 'Lot {code}', 'Volume (hL) {volHL}', 'Produit {produit}', 'Dose {dose}', pr2('Quantité', 'qte', 'pesée'), pr2('N° de lot du produit', 'numLot', 'utilisé'), 'Heure', 'Fait {ech}'].join('\n') }], notes: '' },
  { id: 'levurage', titre: 'Levurage', sous: 'Ensemencement en levures ou en levain', prefixe: 'LEV', orientation: 'paysage', types: [],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}'],
    tableaux: [{ titre: '', fill: 'levurage', lignes: 8, zebre: false, fixes: '', cols: ['Cuve {cuve}', 'Lot {code}', 'Volume (hL) {volHL}', 'Levure ou levain {produit}', 'Dose {dose}', pr2('Quantité', 'qte', 'pesée'), pr2('N° de lot', 'numLot', 'utilisé'), 'Réhydratation (°C, durée)', 'Heure', 'Densité, T° du moût'].join('\n') }], notes: '' },
  { id: 'preparation', titre: 'Préparation', sous: 'Levain, pied de cuve, liqueur de tirage ou d’expédition', prefixe: 'PRP', orientation: 'paysage', types: ['preparation'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}', 'Préparation {preparation}', 'Volume à préparer (hL) {volPrep}', 'Vin utilisé {vinPrep}'],
    tableaux: [
      { titre: 'Composition', fill: 'produits', lignes: 5, zebre: false, fixes: '', cols: ['Produit {produit}', pr2('Quantité', 'qte', 'pesée'), pr2('N° de lot', 'numLot', 'utilisé'), 'Heure d’ajout'].join('\n') },
      { titre: 'Suivi du levain ou du pied de cuve', fill: 'aucun', lignes: 6, zebre: false, fixes: '', cols: ['Date', 'Heure', 'Densité', 'Température (°C)', 'Observations', 'Visa'].join('\n') }], notes: '' },
  { id: 'froid', titre: 'Stabilisation par le froid', sous: 'Produits ajoutés et relevés de température', prefixe: 'FRO', orientation: 'paysage', types: ['froid'],
    champs: ['Date de début {date}', 'Opérateur(s) {operateurs}', 'Cuve {cuve}', 'Lot {lot}', 'Volume (hL) {volume}', 'Température visée (°C) {tempVisee}', 'Durée prévue (jours) {jours}'],
    tableaux: [
      { titre: 'Produits ajoutés', fill: 'froid', lignes: 3, zebre: false, fixes: '', cols: ['Produit {produit}', 'Dose {dose}', pr2('Quantité', 'qte', 'pesée'), pr2('N° de lot', 'numLot', 'utilisé'), 'T° du vin à l’ajout (°C)', 'Heure'].join('\n') },
      { titre: 'Relevés de température', fill: 'aucun', lignes: 8, zebre: false, fixes: '', cols: ['Date', 'Heure', 'Température (°C)', 'Observations', 'Visa'].join('\n') }], notes: '' },
  { id: 'filtration', titre: 'Filtration', sous: 'Vin filtré et auxiliaires de filtration', prefixe: 'FIL', orientation: 'paysage', types: ['filtration'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}', 'Méthode {methode}', 'Filtre ou prestataire {equipement}'],
    tableaux: [
      { titre: 'Vin filtré', fill: 'filtration', lignes: 4, zebre: false, fixes: '', cols: ['Cuve de départ {dep}', 'Lot {depCode}', pr2('Volume avant (hL)', 'depAvT'), 'Cuve d’arrivée {arr}', 'Volume filtré (hL)', 'Turbidité (NTU)\n  avant\n  après', 'Début (heure)', 'Fin (heure)'].join('\n') },
      { titre: 'Auxiliaires de filtration (terre, plaques, cartouches…)', fill: 'produits', lignes: 4, zebre: false, fixes: '', cols: ['Produit {produit}', pr2('Quantité', 'qte', 'utilisée'), pr2('N° de lot', 'numLot', 'utilisé')].join('\n') }], notes: '' },
  { id: 'suivi', titre: 'Suivi des fermentations', sous: 'Relevés de densité et de température', prefixe: 'SFE', orientation: 'paysage', types: ['suivi'],
    champs: ['Date {date}', 'Heure du relevé', 'Opérateur(s) {operateurs}'],
    tableaux: [{ titre: '', fill: 'suivi', lignes: 14, zebre: true, fixes: '', cols: ['Cuve {cuve}', 'Lot {code}', 'Volume (hL) {volHL}', 'Stade {stade}', 'Dernier relevé {dernier}', 'Densité {densite}', 'Température (°C) {temp}', 'Action (remontage, chauffage…) {action}', 'Ajout (produit, quantité, n° de lot) {x_produit_qte_numLot}', 'Visa'].join('\n') }],
    notes: 'Densité lue au densimètre, corrigée à 20 °C.' },
  { id: 'jaugeage', titre: 'Jaugeage et inventaire des cuves', sous: 'Volumes théoriques et relevés', prefixe: 'INV', orientation: 'portrait', types: ['jaugeage'],
    champs: ['Date {date}', 'Heure', 'Opérateur(s) {operateurs}'],
    tableaux: [{ titre: '', fill: 'inventaire', lignes: 18, zebre: true, fixes: '', cols: ['Cuve {cuve}', 'Contenance (hL) {cap}', 'Lot {code}', 'Désignation {desig}', 'Volume (hL)\n  théorique {volHL}\n  relevé', 'Hauteur ou creux (cm)', 'Écart (hL)'].join('\n') }],
    notes: 'Relevé : en hL, ou hauteur / creux en cm si la cuve a un barème de jaugeage dans Œnotrack.' },
  { id: 'tirage', titre: 'Tirage', sous: 'Mise en bouteilles pour la prise de mousse', prefixe: 'TIR', orientation: 'paysage', types: ['tirage'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}', 'Cuvée de tirage {cuvee}', 'Cuve(s) {cuvesTirage}', 'Volume (hL) {volTirage}', 'Bouteilles prévues {nbPrevu}', 'Bouteilles tirées'],
    tableaux: [
      { titre: 'Liqueur de tirage et levain', fill: 'preparations', lignes: 3, zebre: false, fixes: '', cols: ['Préparation {prepType}', 'Code {prepCode}', pr2('Volume (hL)', 'volHL', 'utilisé'), 'Heure d’ajout'].join('\n') },
      { titre: 'Matières sèches', fill: 'produits', lignes: 4, zebre: false, fixes: '', cols: ['Article (bouteilles, capsules, bidules…) {produit}', pr2('Quantité', 'qte', 'utilisée'), pr2('N° de lot', 'numLot', 'utilisé')].join('\n') },
      { titre: 'Contrôles pendant le tirage', fill: 'aucun', lignes: 6, zebre: false, fixes: '', cols: ['Heure', 'Compteur (bouteilles)', 'Niveau de remplissage', 'Densité de la mixtion', 'Observations', 'Visa'].join('\n') }], notes: '' },
  { id: 'degorgement', titre: 'Dégorgement', sous: 'Dégorgement, dosage et bouchage', prefixe: 'DEG', orientation: 'paysage', types: ['degorgement'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}', 'Lot tiré {lotTire}', 'Bouteilles prévues {nbPrevu}', 'Liqueur d’expédition {liqueur}', 'Dosage (g/L) {dosage}', 'Lot fini {lotFini}'],
    tableaux: [
      { titre: 'Matières sèches', fill: 'produits', lignes: 5, zebre: false, fixes: '', cols: ['Article (bouchons, muselets, capsules…) {produit}', pr2('Quantité', 'qte', 'utilisée'), pr2('N° de lot', 'numLot', 'utilisé')].join('\n') },
      { titre: 'Contrôles pendant le dégorgement', fill: 'aucun', lignes: 6, zebre: false, fixes: '', cols: ['Heure', 'Compteur (bouteilles)', 'Casse, pertes', 'Niveau', 'Observations', 'Visa'].join('\n') }], notes: '' },
  { id: 'sorties', titre: 'Sorties de vin et de sous-produits', sous: 'Vin en vrac, lies, bourbes…', prefixe: 'SOR', orientation: 'paysage', types: ['sortie'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}', 'Destinataire {destinataire}', 'Transporteur', 'Immatriculation', 'Document (DAE, DSA) {document}'],
    tableaux: [{ titre: '', fill: 'sortie', lignes: 6, zebre: false, fixes: '', cols: ['Cuve {cuve}', 'Lot {code}', 'Nature (vin, lies, bourbes…) {motif}', pr2('Cuve avant (hL)', 'avHL'), pr2('Volume sorti (hL)', 'volHL'), pr2('Cuve après (hL)', 'apHL'), 'Échantillon conservé {ech}'].join('\n') }],
    notes: 'Le document d’accompagnement (DAE, DSA…) doit accompagner le transport.' },
  { id: 'etapes', titre: 'Changements de stade', sous: 'Fin de fermentation, vin clair, élevage…', prefixe: 'STA', orientation: 'portrait', types: ['etape'],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}'],
    tableaux: [{ titre: '', fill: 'etape', lignes: 12, zebre: false, fixes: '', cols: ['Cuve {cuve}', 'Lot {code}', 'Volume (hL) {volHL}', 'Stade actuel {stadeAv}', 'Nouveau stade {stadeAp}', 'Contrôle (analyse, dégustation)', 'Visa'].join('\n') }], notes: '' },
  { id: 'nettoyage', titre: 'Nettoyage et désinfection', sous: 'Cuves, matériel et équipements', prefixe: 'NET', orientation: 'paysage', types: [],
    champs: ['Date {date}', 'Opérateur(s) {operateurs}'],
    tableaux: [{ titre: '', fill: 'aucun', lignes: 14, zebre: false, fixes: '', cols: ['Cuve ou équipement', 'Action (nettoyage, rinçage, désinfection…)', 'Produit', 'Concentration', 'Température', 'Temps de contact', 'Rinçage {ech}', 'Heure', 'Visa'].join('\n') }],
    notes: 'Ne jamais mélanger un produit chloré et un produit acide. Protections : voir la fiche de sécurité du produit (Hygiène › Produits d’hygiène).' },
].map((t) => ({ version: '1', creeLe: '2026-11-19', logo: true, remarque: true, visas: true, saisie: true, v: FICHE_VERSION, ...t })));
// champs pré-remplis proposés dans l'éditeur : [clé, libellé, pour quelles opérations]
const FICHE_CHAMPS_CLES = [['date', 'Date', 'toutes'], ['operateurs', 'Opérateur(s)', 'toutes'], ['expediteur', 'Expéditeur', 'réception de moûts'], ['immat', 'Immatriculation', 'réception de moûts'], ['document', 'Document (DAE, DSA, bon)', 'réception, sorties'],
  ['destinataire', 'Destinataire', 'sorties'], ['pressoir', 'Pressoir', 'pressurage'], ['pressee', 'N° de marc / pressée', 'pressurage'], ['cuve', 'Cuve', 'opération sur une cuve'], ['lot', 'Lot', 'opération sur une cuve'], ['volume', 'Volume (hL)', 'opération sur une cuve'],
  ['tempVisee', 'Température visée (°C)', 'froid'], ['jours', 'Durée prévue (jours)', 'froid'], ['cuveAss', 'Cuve d’assemblage', 'assemblage'], ['lotCree', 'Lot créé', 'assemblage'], ['volFinal', 'Volume final prévu (hL)', 'assemblage'],
  ['methode', 'Méthode de filtration', 'filtration'], ['equipement', 'Équipement(s)', 'filtration, soutirage'], ['preparation', 'Préparation', 'préparation'], ['volPrep', 'Volume à préparer (hL)', 'préparation'], ['vinPrep', 'Vin utilisé', 'préparation'],
  ['cuvee', 'Cuvée de tirage', 'tirage'], ['cuvesTirage', 'Cuve(s)', 'tirage'], ['volTirage', 'Volume (hL)', 'tirage'], ['nbPrevu', 'Bouteilles prévues', 'tirage, dégorgement'], ['lotTire', 'Lot tiré', 'dégorgement'], ['liqueur', 'Liqueur d’expédition', 'dégorgement'],
  ['dosage', 'Dosage (g/L)', 'dégorgement'], ['lotFini', 'Lot fini', 'dégorgement'], ['stade', 'Stade', 'changement de stade'], ['couleur', 'Couleur', 'changement de stade']];
// anciens modèles d'origine (0.5.0-alpha.1 à 0.18.0-alpha.1) : titres gardés pour le journal des fiches imprimées
const FICHE_ANCIENS = { citerne: 'Citerne', kieselguhr: 'Filtration Kieselguhr', tangentielle: 'Filtration tangentielle – Électrodialyse' };
const ficheTitre = (M, id) => (M.find((m) => m.id === id) || { titre: FICHE_ANCIENS[id] || id }).titre;
// Modèles actifs : modèles par défaut, remplacés ou complétés par les modèles personnalisés de la base
function fichesModeles(db) {
  const def = FICHE_DEFAULTS(); const own = db.modelesFiches || [];
  return [...def.map((d) => { const o = own.find((x) => x.id === d.id); return o ? { ...o, _perso: true, _defaut: true } : { ...d, _defaut: true }; }), ...own.filter((x) => !def.some((d) => d.id === x.id)).map((x) => ({ ...x, _perso: true }))];
}
// fiche associée à l'opération (catalogue), sinon modèle proposé pour la variante, puis pour le comportement
function modeleFor(db, type, f) {
  const M = fichesModeles(db); const cat = opDef(db, (f && f.sousType) || type);
  if (cat && cat.ficheId) { const t = M.find((m) => m.id === cat.ficheId); if (t) return t; }
  return modeleAuto(db, type, f, M);
}
function modeleAuto(db, type, f, M0) {
  const M = M0 || fichesModeles(db); const st = f && f.sousType;
  if (st) { const t = M.find((m) => (m.types || []).includes(st)); if (t) return t; }
  return M.find((m) => (m.types || []).includes(type)) || M.find((m) => m.id === 'mouvements') || M[0];
}

/* ---------- colonnes : texte indenté → arbre → en-têtes multi-niveaux ---------- */
function parseCols(text) {
  const root = { c: [] }; const stack = [{ d: -1, n: root }];
  String(text || '').split('\n').forEach((raw) => {
    if (!raw.trim()) return;
    const d = Math.floor(raw.match(/^\s*/)[0].replace(/\t/g, '  ').length / 2);
    const m = raw.trim().match(/^(.*?)\s*(?:\{(\w+)\})?$/); const node = { h: m[1], k: m[2] || null, c: [] };
    while (stack.length > 1 && stack[stack.length - 1].d >= d) stack.pop();
    stack[stack.length - 1].n.c.push(node); stack.push({ d, n: node });
  });
  return root.c;
}
// largeur minimale d'une colonne à remplir à la main (mm), d'après son intitulé : assez de place pour écrire
function colMin(h, pere) {
  const t = norm(`${h}`).trim(); const p = norm(pere || '');
  if (/^(prevu|releve|pese|pesee|utilise|utilisee|preleve|theorique|avant|apres|reel)$/.test(t)) return /n° de lot|lot du produit/.test(p) ? 20 : 13;
  if (/^visa$/.test(t)) return 16;
  if (/designation|origine|observation|action|ajout|produit|article|apporteur|parcelle|destination des bourbes|controle|levure|nature|preparation/.test(t)) return 26;
  if (/dernier releve|rehydratation/.test(t)) return 22;
  if (/^lot|n° de lot|lot en cuve|lot cree|^code/.test(t)) return 20;
  if (/^cuve|equipement|cru|commune/.test(t)) return 17;
  if (/stade|cepage|fraction|revendication|sanitaire/.test(t)) return 18;
  return 12;
}
const colLeaves = (cols) => cols.flatMap((c) => (c.c.length ? colLeaves(c.c) : [c]));
const colDepth = (cols) => (cols.length ? 1 + Math.max(...cols.map((c) => colDepth(c.c))) : 0);
function colHeadRows(cols) {
  const D = colDepth(cols); const rows = Array.from({ length: D }, () => []);
  const walk = (nodes, lvl, pere) => nodes.forEach((n) => { rows[lvl].push({ h: n.h, k: n.k, leaf: !n.c.length, pere: pere || '', colSpan: n.c.length ? colLeaves(n.c).length : 1, rowSpan: n.c.length ? 1 : D - lvl }); if (n.c.length) walk(n.c, lvl + 1, n.h); });
  walk(cols, 0); return rows;
}

/* ---------- pré-remplissage à partir d'une prévision, d'une opération ou d'un formulaire en cours (ou fiche vierge) ---------- */
const hlv = (L) => (L === null || L === undefined || L === '' ? '' : fmt(num(L) / 100, 2));
const volIn = (Rd, cid) => sum(Object.values(Rd.portions).filter((p) => p.contenantId === cid), (p) => p.vol);
function ficheSrcState(db, s) { // → { type, f, date, Rd } ; fiche vierge : { vierge, modele }
  if (s.kind === 'vierge') return { vierge: true, modele: s.modele, type: null, f: {}, date: '', Rd: null };
  if (s.kind === 'op') { const op = db.ops.find((o) => o.id === s.id); if (!op) return null; const base = { ...db, ops: db.ops.filter((o) => o.id !== op.id) }; return { type: op.type, f: opInit(op.type, op, db, op.date), date: op.date, Rd: getR(base, op.date), opId: op.id }; }
  if (s.kind === 'prev') { const p = (db.previsions || []).find((x) => x.id === s.id); if (!p) return null; return { type: p.type, f: { ...p.f, date: p.date }, date: p.date, Rd: getR(db, p.date) }; }
  return { type: s.type, f: s.f, date: s.f.date, Rd: getR(s.editId ? { ...db, ops: db.ops.filter((o) => o.id !== s.editId) } : db, isoOK(s.f.date) ? s.f.date : undefined), opId: s.editId || null };
}
// données d'un lot pour les pré-remplis personnalisés (préfixe : dep = lot de départ, lot = lot traité)
function lotAtomes(db, Rd, lotId, pre) {
  const l = (lotId && (Rd.lots[lotId] || lotById(db, lotId))) || null; if (!l) return {};
  let c = null; try { c = composition(db, Rd, lotId); } catch (e) { c = null; }
  const part = (o, lab) => Object.keys(o || {}).filter((k) => k !== '?' && k !== 'inconnu' && o[k] >= 0.01).sort((a, b) => o[b] - o[a]).map((k) => `${lab(k)}${o[k] < 0.995 ? ` ${Math.round(o[k] * 100)} %` : ''}`).join(' · ');
  return { [`${pre}Designation`]: l.designation || '', [`${pre}Revendication`]: l.qualif ? qLabel(l.qualif) : '', [`${pre}Stade`]: l.stade ? stadeLabel(db, l.stade) : '',
    [`${pre}Cepages`]: c ? part(c.cepages, (k) => lbl(db, 'cepages', k)) : '', [`${pre}Crus`]: c ? part(c.crus, (k) => cruName(db, k)) : '', [`${pre}Millesimes`]: c ? part(c.millesimes, (k) => k) : String(l.millesime || ''),
    [`${pre}Fractions`]: c ? part(c.fractions, (k) => fracLabel(db, k)) : '', [`${pre}Partenaires`]: c ? part(c.apporteurs, (k) => apporteurName(db, k)) : '' };
}
// cellule d'une fiche : donnée simple {cle} ou pré-rempli personnalisé {x_cle1_cle2…} (valeurs jointes par « · »)
const celluleFiche = (row, k) => { if (!row || !k) return ''; if (k.startsWith('x_')) return k.slice(2).split('_').map((a) => row[a]).filter((v) => v != null && String(v).trim() !== '').join(' · '); return row[k] != null ? row[k] : ''; };
function ficheRows(db, st, fill) {
  if (!st || st.vierge) return [];
  const rows0 = ficheRows0(db, st, fill);
  if (!rows0.length) return rows0;
  const { Rd, f } = st;
  const cp = champsAtomes(db, st.type, f); // champs personnalisés de l'opération
  return rows0.map((r) => ({ ...r, ...cp, ...(r._lotDep ? lotAtomes(db, Rd, r._lotDep, 'dep') : {}), ...(r._lot ? lotAtomes(db, Rd, r._lot, 'lot') : {}), date: fmtDate(st.date || f.date || ''), operateurs: operateursNoms(db, f.operateurs), notes: f.notes || '' }));
}
// dernier relevé de densité / température d'un lot (suivi de fermentation, analyses) des jours précédant la fiche
function dernierReleve(db, Rd, lotId, date, sauf) {
  const L = [];
  db.ops.forEach((o) => { if (o.type !== 'suivi' || o.id === sauf || (date && o.date >= date)) return; const p = Rd.portions[o.portionId]; if (!p || p.lotId !== lotId) return; if (hasNum(o.densite) || hasNum(o.tempC)) L.push({ date: o.date, d: o.densite, t: o.tempC }); });
  (db.analyses || []).forEach((a) => { if (a.lotId !== lotId || (date && a.date >= date)) return; const v = a.valeurs || {}; if (hasNum(v.densite) || hasNum(v.temp)) L.push({ date: a.date, d: v.densite, t: v.temp }); });
  const x = L.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))[0]; if (!x) return '';
  return [hasNum(x.d) ? fmt(num(x.d), 3) : '', hasNum(x.t) ? `${fmt(num(x.t), 1)} °C` : ''].filter(Boolean).join(' · ') + ` (${fmtDate(x.date).slice(0, 5)})`;
}
function ficheRows0(db, st, fill) {
  if (!st || fill === 'aucun') return [];
  const { type, f, Rd } = st; const P = (pid) => (pid ? Rd.portions[pid] : null); const code = (lotId) => ((Rd.lots[lotId] || lotById(db, lotId) || {}).code || '');
  const cn = (id) => (id ? contName(db, id) : ''); const rows = [];
  const mv = (opLabel, p, v, destId, arrCode, loss) => { const dv = destId ? volIn(Rd, destId) : 0; const pe = num(loss); return { _lotDep: p ? p.lotId : null, op: opLabel, dep: p ? cn(p.contenantId) : '', depCode: p ? code(p.lotId) : '', depAvT: p ? hlv(p.vol) : '', depApT: p && v != null ? hlv(Math.max(0, p.vol - v)) : '', volT: v != null ? hlv(v) : '', perteT: pe > 0 ? hlv(pe) : '', clairT: v != null ? hlv(Math.max(0, v - pe)) : '', bourbesT: pe > 0 ? hlv(pe) : '', arr: cn(destId), arrCode: arrCode != null ? arrCode : (p ? code(p.lotId) : ''), arrAvT: destId ? hlv(dv) : '', arrApT: destId && v != null ? hlv(dv + Math.max(0, v - pe)) : '', ech: '☐' }; };
  const ligneProduit = (l, vol) => { const pr = prodOf(db, l.produitId); const a = arrOf(db, l.arrivageId); const du = doseUnit(pr.unite); const q = hasNum(l.qty) ? num(l.qty) : null;
    return { produit: pr.nom || '', qte: q != null ? `${fmt(q, Number.isInteger(q) ? 0 : 2)} ${pr.unite || ''}`.trim() : '', numLot: a.numLot || '', dose: q != null && vol > 0 && du ? `${fmt((q * (pr.unite === 'kg' || pr.unite === 'L' ? 1000 : 1)) / (vol / 100), 1)} ${du}` : '' }; };
  const apportRow = (r, kg) => ({ app: r.apporteurId ? apporteurName(db, r.apporteurId) : '', cru: r.cruId ? cruName(db, r.cruId) : '', parcelle: r.parcelleId ? parcelleName(db, r.parcelleId) : '', cep: r.cepageId ? lbl(db, 'cepages', r.cepageId) : '', rev: qLabel(r.qualifId || 'conv'), kg: hasNum(kg) ? fmt(num(kg)) : '', ref: r.ref || '', ech: '☐' });
  if (['mouvements', 'debourbage', 'assemblage', 'filtration'].includes(fill)) {
    if (['soutirage', 'transfert', 'debourbage'].includes(type) && fill !== 'filtration' && fill !== 'assemblage') {
      const r = mv(OP_LABELS[f.sousType || type] || OP_LABELS[type], P(f.portionId), hasNum(f.volL) ? num(f.volL) : null, f.destId, null, sum(f.pertes || [], (x) => x.volL));
      rows.push(r);
    }
    if (type === 'jaugeage' && fill === 'mouvements') { const p = P(f.portionId); rows.push({ op: 'Jaugeage', dep: p ? cn(p.contenantId) : '', depCode: p ? code(p.lotId) : '', depAvT: p ? hlv(p.vol) : '', depApT: hasNum(f.volMesure) ? hlv(f.volMesure) : '' }); }
    if (type === 'assemblage' && (fill === 'assemblage' || fill === 'mouvements')) {
      let acc = f.destId ? volIn(Rd, f.destId) : 0;
      (f.sources || []).filter((s) => s.portionId).forEach((s) => { const p = P(s.portionId); const v = num(s.volL); rows.push({ _lotDep: p ? p.lotId : null, op: 'Assemblage', dep: p ? cn(p.contenantId) : '', depCode: p ? code(p.lotId) : '', depAvT: p ? hlv(p.vol) : '', volT: hlv(v), depApT: p ? hlv(Math.max(0, p.vol - v)) : '', arr: cn(f.destId), arrCode: f.code || '', arrAvT: f.destId ? hlv(acc) : '', arrApT: f.destId ? hlv(acc + v) : '', ech: '☐' }); acc += v; });
    }
    if (type === 'filtration' && fill === 'filtration') { const p = P(f.portionId); rows.push({ _lotDep: p ? p.lotId : null, op: 'Filtration', dep: p ? cn(p.contenantId) : '', depCode: p ? code(p.lotId) : '', depAvT: p ? hlv(p.vol) : '' }); }
    if (['soutirage', 'transfert'].includes(type) && fill === 'filtration') rows.push(mv(OP_LABELS[f.sousType || type] || OP_LABELS[type], P(f.portionId), hasNum(f.volL) ? num(f.volL) : null, f.destId));
  }
  if (fill === 'reception' && type === 'entree_mout') {
    const plan = moutPlan(db, f); const cur = {};
    (f.entrees || []).forEach((e, i) => (e.dests || []).filter((d) => d.contenantId || num(d.volL) > 0).forEach((d) => {
      const t = plan.find((x) => x.contenantId === d.contenantId); const av = d.contenantId ? (cur[d.contenantId] != null ? cur[d.contenantId] : volIn(Rd, d.contenantId)) : 0; const v = num(d.volL);
      if (d.contenantId) cur[d.contenantId] = av + v;
      rows.push({ comp: e.compartiment || String(i + 1), vol: v ? hlv(v) : '', origine: [fracLabel(db, e.fractionId), lbl(db, 'cepages', e.cepageId), e.cruId ? cruName(db, e.cruId) : '', e.millesime || f.millesime || ''].filter(Boolean).join(' · '), dest: cn(d.contenantId), code: t ? t.code : '', avHL: d.contenantId ? hlv(av) : '', apHL: d.contenantId && v ? hlv(av + v) : '', ech: '☐',
        numLot: String(e.numLot || ''), fraction: e.fractionId ? fracLabel(db, e.fractionId) : '', cepage: e.cepageId ? lbl(db, 'cepages', e.cepageId) : '', cru: e.cruId ? cruName(db, e.cruId) : '', echelle: e.cruId ? eLabel(cruEchelle(db, e.cruId)) : '', millesime: String(e.millesime || f.millesime || ''), revendication: qLabel(e.qualifId || 'conv'), couleur: e.couleur ? couleurLabel(db, e.couleur) : '', parcelle: e.parcelleId ? parcelleName(db, e.parcelleId) : '',
        partenaires: (e.apporteurs || []).filter((a) => a.id).map((a) => `${apporteurName(db, a.id)}${hasNum(a.pct) ? ` (${fmt(a.pct)} %)` : ''}`).join(', ') || (f.apporteurId ? apporteurName(db, f.apporteurId) : ''), analyses: analysesTexte(db, e.analyses), refBon: f.ref || '', citerne: f.immat || '' });
    }));
  }
  // vendange : l'apport lui-même, ou les apports chargés au pressoir
  if (fill === 'apport' || fill === 'charges') {
    if (type === 'apport') rows.push(apportRow(f, f.kg));
    if (type === 'pressurage') (f.charges || []).filter((c) => c.apportId).forEach((c) => { const r = Rd.raisins[c.apportId]; if (r) rows.push(apportRow(r, hasNum(c.kg) ? c.kg : r.kg - r.used)); });
  }
  if (fill === 'fractions' && type === 'pressurage') {
    const fr = f.frac || {}; const cur = {};
    fracPress(db, Object.keys(fr)).forEach((x) => { const y = fr[x.id]; if (!y) return; const cid = y.contenantId; const av = cid ? (cur[cid] != null ? cur[cid] : volIn(Rd, cid)) : 0; const v = hasNum(y.volL) ? num(y.volL) : 0; if (cid) cur[cid] = av + v;
      rows.push({ frac: x.label, cuve: cn(cid), code: y.code || '', vol: v ? hlv(v) : '', avHL: cid ? hlv(av) : '', apHL: cid && v ? hlv(av + v) : '', ech: '☐' }); });
  }
  if (fill === 'suivi') {
    const one = (p, extra) => { const l = Rd.lots[p.lotId] || {}; return { _lot: p.lotId, cuve: cn(p.contenantId), code: l.code || '', volHL: hlv(p.vol), stade: l.stade ? stadeCourt(db, l.stade) : '', dernier: dernierReleve(db, Rd, p.lotId, st.date, st.opId), ...(extra || {}) }; };
    const p0 = P(f.portionId);
    if (p0) { const L = (f.lignes || []).filter((l) => l.produitId); const x = { densite: hasNum(f.densite) ? fmt(f.densite, 3) : '', temp: hasNum(f.tempC) ? fmt(f.tempC, 1) : '', action: f.motif || '' };
      if (L.length) L.forEach((l, i) => { const lp = ligneProduit(l, p0.vol); rows.push(i ? { _lot: p0.lotId, cuve: cn(p0.contenantId), produit: lp.produit, qte: lp.qte, numLot: lp.numLot } : one(p0, { ...x, produit: lp.produit, qte: lp.qte, numLot: lp.numLot })); });
      else rows.push(one(p0, x)); }
    // les autres cuves en fermentation, pour un relevé complet
    Object.values(Rd.portions).filter((p) => p !== p0 && p.vol > 0 && stadePhase(db, (Rd.lots[p.lotId] || {}).stade) === 'ferm')
      .sort((a, b) => cn(a.contenantId).localeCompare(cn(b.contenantId), 'fr', { numeric: true })).forEach((p) => rows.push(one(p)));
  }
  // inventaire : la cuve jaugée d'abord, puis toutes les cuves occupées (par nom)
  if (fill === 'inventaire') {
    const parC = {}; Object.values(Rd.portions).filter((p) => p.vol > 0.5).forEach((p) => { (parC[p.contenantId] = parC[p.contenantId] || []).push(p); });
    const p0 = P(f.portionId); const ids = Object.keys(parC).sort((a, b) => cn(a).localeCompare(cn(b), 'fr', { numeric: true }));
    if (p0) { const i = ids.indexOf(p0.contenantId); if (i > 0) { ids.splice(i, 1); ids.unshift(p0.contenantId); } }
    ids.forEach((cid) => { const ps = parC[cid]; const c = db.contenants.find((x) => x.id === cid) || {}; const ls = ps.map((p) => Rd.lots[p.lotId] || {});
      rows.push({ _lot: ps.length === 1 ? ps[0].lotId : null, cuve: cn(cid), cap: c.volMax ? hlv(c.volMax) : '', code: ls.map((l) => l.code).filter(Boolean).join(' + '), desig: ls.map((l) => l.designation).filter(Boolean).join(' + '), volHL: hlv(sum(ps, (p) => p.vol)), ech: '☐' }); });
  }
  if (fill === 'sortie') { const p = P(f.portionId); if (p) { const v = hasNum(f.volL) ? num(f.volL) : null; rows.push({ _lot: p.lotId, cuve: cn(p.contenantId), code: code(p.lotId), avHL: hlv(p.vol), volHL: v != null ? hlv(v) : '', apHL: v != null ? hlv(Math.max(0, p.vol - v)) : '', motif: f.motif || '', dest: f.destinataire || '', ref: f.ref || '', ech: '☐' }); } }
  if (fill === 'etape' && f.lotId) { const l = Rd.lots[f.lotId] || {}; const ps = Object.values(Rd.portions).filter((p) => p.lotId === f.lotId); (ps.length ? ps : [null]).forEach((p) => rows.push({ _lot: f.lotId, cuve: p ? cn(p.contenantId) : '', code: l.code || '', volHL: p ? hlv(p.vol) : '', stadeAv: l.stade ? stadeLabel(db, l.stade) : '', stadeAp: f.newStade ? stadeLabel(db, f.newStade) : '', couleur: f.couleur ? couleurLabel(db, f.couleur) : '' })); }
  if (['traitements', 'froid', 'levurage'].includes(fill)) {
    const p = P(f.portionId || f.sourcePortionId); const cuve = p ? cn(p.contenantId) : cn(f.destId); const vol = type === 'preparation' ? num(f.volL) : p ? p.vol : sum(f.sources || [], (s) => s.volL);
    (f.lignes || []).filter((l) => l.produitId).forEach((l) => { rows.push({ _lot: p ? p.lotId : null, code: p ? code(p.lotId) : '', cuve: cuve || (type === 'preparation' ? `Prép. ${f.code || ''}` : ''), volHL: vol ? hlv(vol) : '', ...ligneProduit(l, vol), ech: '☐' }); });
    if (!rows.length && (cuve || vol)) rows.push({ _lot: p ? p.lotId : null, cuve, code: p ? code(p.lotId) : '', volHL: vol ? hlv(vol) : '' });
  }
  // produits et matières sèches de l'opération (préparation, filtration, tirage, dégorgement…)
  if (fill === 'produits') {
    const p = P(f.portionId || f.sourcePortionId); const vol = type === 'preparation' ? num(f.volL) : type === 'tirage' ? sum(f.sources || [], (s) => s.volL) : p ? p.vol : 0;
    (f.lignes || []).filter((l) => l.produitId).forEach((l) => rows.push({ ...ligneProduit(l, ['tirage', 'degorgement'].includes(type) ? 0 : vol), ech: '☐' }));
  }
  if (fill === 'preparations') (f.prepUses || []).filter((u) => u.prepId).forEach((u) => { const x = Rd.preps[u.prepId] || {}; rows.push({ prepType: PREP_TYPES[x.ptype] || '', prepCode: x.code || '', volHL: hasNum(u.volL) ? hlv(u.volL) : '', rev: x.qualif ? qLabel(x.qualif) : '', ech: '☐' }); });
  return rows;
}
// champ sous l'en-tête : « Libellé {clé} » → valeur pré-remplie ; sans clé (anciens modèles) : reconnu d'après le libellé
const champParse = (ch) => { const m = String(ch || '').trim().match(/^(.*?)\s*(?:\{(\w+)\})?$/); return { label: m ? m[1] : String(ch || ''), k: m ? m[2] || null : null }; };
function ficheChampVal(db, key, ctx) {
  const f = ctx.f || {}; const Rd = ctx.Rd; const cn = (id) => (id ? contName(db, id) : ''); const P = (pid) => (pid && Rd ? Rd.portions[pid] : null);
  const lotC = (lotId) => (lotId ? ((Rd && Rd.lots[lotId]) || lotById(db, lotId) || {}).code || '' : ''); const hl = (L) => (hasNum(L) && num(L) > 0 ? hlv(L) : '');
  switch (key) {
    case 'ordre': return ctx.ordre || '';
    case 'date': return isoOK(ctx.date) ? fmtDate(ctx.date) : '';
    case 'operateurs': return ctx.operateursTexte != null ? ctx.operateursTexte : operateursNoms(db, f.operateurs);
    case 'expediteur': return f.apporteurId ? apporteurName(db, f.apporteurId) : '';
    case 'destinataire': return f.destinataire || '';
    case 'immat': return f.immat || '';
    case 'document': return f.ref || '';
    case 'pressoir': return f.equipementId ? lbl(db, 'equipements', f.equipementId) : '';
    case 'pressee': return f.code || '';
    case 'cuve': { const p = P(f.portionId); return p ? cn(p.contenantId) : ''; }
    case 'lot': { const p = P(f.portionId); return p ? lotC(p.lotId) : ''; }
    case 'volume': { const p = P(f.portionId); return p ? hlv(p.vol) : ''; }
    case 'tempVisee': return hasNum(f.tempC) ? fmt(num(f.tempC), 1) : '';
    case 'jours': return hasNum(f.jours) ? fmt(num(f.jours)) : '';
    case 'cuveAss': return cn(f.destId);
    case 'lotCree': return [f.code, f.designation].filter(Boolean).join(' — ');
    case 'volFinal': { if (!Rd) return ''; const v = (f.destId ? volIn(Rd, f.destId) : 0) + sum(f.sources || [], (s) => s.volL) - sum(f.pertes || [], (x) => x.volL); return v > 0 ? hlv(v) : ''; }
    case 'methode': return f.methodeId ? lbl(db, 'methodesFiltration', f.methodeId) : '';
    case 'equipement': return (f.equipementIds || []).map((e) => lbl(db, 'equipements', e)).join(', ');
    case 'preparation': return f.ptype ? [PREP_TYPES[f.ptype], f.code].filter(Boolean).join(' ') : '';
    case 'volPrep': return hl(f.volL);
    case 'vinPrep': { const p = P(f.sourcePortionId); return p ? [cn(p.contenantId), lotC(p.lotId), hl(f.sourceVolL) ? `${hl(f.sourceVolL)} hL` : ''].filter(Boolean).join(' · ') : ''; }
    case 'cuvee': return [f.code, f.designation].filter(Boolean).join(' — ');
    case 'cuvesTirage': return uniq((f.sources || []).map((s) => P(s.portionId)).filter(Boolean).map((p) => cn(p.contenantId))).join(', ');
    case 'volTirage': return hl(sum(f.sources || [], (s) => s.volL));
    case 'nbPrevu': return hasNum(f.nbBouteilles) ? fmt(num(f.nbBouteilles)) : hasNum(f.nb) ? fmt(num(f.nb)) : '';
    case 'lotTire': return lotC(f.sourceLotId);
    case 'liqueur': return (f.prepUses || []).map((u) => ((Rd && Rd.preps[u.prepId]) || {}).code).filter(Boolean).join(', ');
    case 'dosage': return hasNum(f.dosageGL) ? fmt(num(f.dosageGL), 1) : '';
    case 'lotFini': return [f.code, f.designation].filter(Boolean).join(' — ');
    case 'stade': return f.newStade || f.stade ? stadeLabel(db, f.newStade || f.stade) : '';
    case 'couleur': return f.couleur ? couleurLabel(db, f.couleur) : '';
    default: { const cp = key.startsWith('cf') && ctx.type ? champsAtomes(db, ctx.type, f)[key] : ''; return cp || ''; }
  }
}
function ficheChamp(db, label, ctx) {
  const { label: lab, k } = champParse(label); if (k) return ficheChampVal(db, k, ctx);
  const n = norm(lab); const f = ctx.f || {};
  if (n.includes('ordre')) return ctx.ordre || '';
  if (n === 'date') return ficheChampVal(db, 'date', ctx);
  if (n.includes('operateur')) return ficheChampVal(db, 'operateurs', ctx); // opérateurs prévus ou choisis
  if (n.includes('dae')) return f.ref || '';
  if (n.includes('expediteur')) return f.apporteurId ? apporteurName(db, f.apporteurId) : '';
  if (n.includes('destinataire')) return f.destinataire || '';
  if (n.includes('immatriculation')) return f.immat || '';
  if (n.includes('stade')) return f.newStade || f.stade ? stadeLabel(db, f.newStade || f.stade) : '';
  if (n.includes('couleur')) return f.couleur ? couleurLabel(db, f.couleur) : '';
  if (n.includes('pressoir')) return f.equipementId && /press/i.test(lbl(db, 'equipements', f.equipementId)) ? lbl(db, 'equipements', f.equipementId) : '';
  { const perso = formulaireDe(db, f.sousType || ctx.type || f.type).perso.find((p) => norm(p.label) === n); if (perso) { const a = champsAtomes(db, ctx.type || f.type, f); if (a[`cf${perso.id}`]) return a[`cf${perso.id}`]; } } // champ personnalisé du même nom
  return '';
}

// Couleurs, tailles et options d'impression des fiches (personnalisables par modèle) — par défaut : sobre et économe en encre
const FICHE_COULEURS = () => ({ th: '#E6E6E6', thTxt: '#000000', band: '#CFCFCF', bandTxt: '#000000', zebre: '#F3F3F3', bord: '#555555', theo: '#555555', saisie: '#FFF8DC', titre: '#000000' });
const FICHE_PRESETS = [
  { id: 'sobre', nom: 'Sobre (économe en encre)', c: {} },
  { id: 'noir', nom: 'Noir et blanc contrasté', c: { th: '#000000', thTxt: '#FFFFFF', band: '#000000', bandTxt: '#FFFFFF', zebre: '#D9D9D9', bord: '#000000', theo: '#4D4D4D', saisie: '#FFFBE6' } },
  { id: 'vigne', nom: 'Vert vigne', c: { th: '#2D4A3E', thTxt: '#FFFFFF', band: '#2D4A3E', bandTxt: '#FFFFFF', zebre: '#E9F0EB', bord: '#2D4A3E', titre: '#2D4A3E', theo: '#4F5F57' } },
  { id: 'bordeaux', nom: 'Bordeaux', c: { th: '#5B1D24', thTxt: '#FFFFFF', band: '#5B1D24', bandTxt: '#FFFFFF', zebre: '#F3E8E4', bord: '#5B1D24', titre: '#5B1D24', theo: '#6E4E4A', saisie: '#FFF8E8' } },
  { id: 'acier', nom: 'Bleu acier', c: { th: '#0F4C81', thTxt: '#FFFFFF', band: '#0F4C81', bandTxt: '#FFFFFF', zebre: '#EAF1F8', bord: '#0F4C81', titre: '#0F4C81', theo: '#455A6E' } },
  { id: 'or', nom: 'Or champagne', c: { th: '#8C6E2F', thTxt: '#FFFFFF', band: '#8C6E2F', bandTxt: '#FFFFFF', zebre: '#F6F0E2', bord: '#8C6E2F', titre: '#5E4A1F', theo: '#5E5543' } },
];
const FICHE_COUL_LABELS = [['th', 'En-têtes de colonnes'], ['thTxt', 'Texte des en-têtes'], ['band', 'Bandeau de titre de tableau'], ['bandTxt', 'Texte du bandeau'], ['zebre', 'Lignes alternées'], ['bord', 'Bordures'], ['theo', 'Valeurs prévues (pré-remplies)'], ['saisie', 'Cases « relevé » à remplir'], ['titre', 'Titre de la fiche']];
const ficheCoul = (tpl) => ({ ...FICHE_COULEURS(), ...(tpl.couleurs || {}) });
// sous-colonne à remplir par l'opérateur (en face d'une valeur « prévu ») : case teintée
const isSaisie = (h) => /^(relev|r[ée]el|pes[ée]|utilis|pr[ée]lev|mesur)/i.test(String(h || '').trim());

// Cartouche (case du n° de fiche, en haut à droite) : lignes facultatives — version, création, modification, page et lignes libres
// (masquées par défaut : utiles seulement aux entreprises qui gèrent leurs documents qualité)
const cartoucheDe = (tpl) => (Array.isArray(tpl.cartouche) && tpl.cartouche.length ? tpl.cartouche : [
  { k: 'version', label: 'Version', valeur: tpl.version || '1', visible: false }, { k: 'cree', label: 'Créé le', valeur: tpl.creeLe || '', visible: false },
  { k: 'modif', label: 'Modifié le', valeur: tpl.modifieLe || '', auto: true, visible: false }, { k: 'page', label: 'Page', valeur: '', visible: false }]);
const cartoucheVal = (tpl, x) => (x.k === 'cree' ? (x.valeur ? fmtDate(x.valeur) : '') : x.k === 'modif' ? ((x.auto !== false ? tpl.modifieLe || tpl.creeLe : x.valeur) ? fmtDate(x.auto !== false ? tpl.modifieLe || tpl.creeLe : x.valeur) : '') : x.k === 'page' ? (x.valeur || '1/1') : (x.valeur || ''));
function CartoucheEditor({ m, set }) {
  const L = cartoucheDe(m); const put = (L2) => { const v = L2.find((x) => x.k === 'version'); const c = L2.find((x) => x.k === 'cree'); setAll(L2, v, c); };
  const setAll = (L2, v, c) => { set('cartouche', L2); if (v) set('version', v.valeur); if (c) set('creeLe', c.valeur); };
  const upd = (i, patch) => put(L.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <Group label="Lignes sous le n° de fiche (facultatives)" help="Pour un suivi qualité (version, date de création, référence du document…) : cochez les lignes à imprimer, ajoutez-en si besoin.">
      <div className="space-y-1.5">
        {L.map((x, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Check checked={x.visible !== false} onChange={(v) => upd(i, { visible: v })} label="" />
            <input className="inp" style={{ width: 150 }} value={x.label} onChange={(e) => upd(i, { label: e.target.value })} aria-label={`Libellé de la ligne ${i + 1} du cartouche`} />
            {x.k === 'cree' ? <input type="date" className="inp" style={{ width: 'auto' }} value={x.valeur || ''} onChange={(e) => upd(i, { valeur: e.target.value })} aria-label="Date de création" />
              : x.k === 'modif' ? <><input type="date" className="inp" style={{ width: 'auto' }} disabled={x.auto !== false} value={(x.auto !== false ? m.modifieLe : x.valeur) || ''} onChange={(e) => upd(i, { valeur: e.target.value })} aria-label="Date de modification" /><Check checked={x.auto !== false} onChange={(v) => upd(i, { auto: v, valeur: v ? '' : (m.modifieLe || todayISO()) })} label="automatique (date d’enregistrement)" /></>
              : x.k === 'page' ? <input className="inp" style={{ width: 90 }} value={x.valeur || ''} placeholder="1/1" onChange={(e) => upd(i, { valeur: e.target.value })} aria-label="Pagination" />
              : <input className="inp" style={{ flex: '1 1 160px', width: 'auto' }} value={x.valeur || ''} onChange={(e) => upd(i, { valeur: e.target.value })} aria-label={`Valeur de la ligne ${i + 1} du cartouche`} />}
            {x.k === 'libre' ? <Btn size="sm" kind="danger" aria-label={`Supprimer la ligne ${x.label}`} onClick={() => put(L.filter((_, k) => k !== i))}>✕</Btn> : null}
          </div>))}
        <Btn size="sm" onClick={() => put([...L, { k: 'libre', label: 'Réf.', valeur: '', visible: true }])}>+ Ligne libre</Btn>
      </div>
    </Group>
  );
}
// Une fiche A4 : en-tête compact (logo, titre, n° de fiche), champs à remplir, tableaux, observations, visa et case « saisi dans Œnotrack »
function FichePage({ tpl, ctx }) {
  const { db } = useApp(); const e = db.entreprise || {}; const c = ficheCoul(tpl);
  const vars = { '--f-th': c.th, '--f-thtxt': c.thTxt, '--f-band': c.band, '--f-bandtxt': c.bandTxt, '--f-zebre': c.zebre, '--f-bord': c.bord, '--f-theo': c.theo, '--f-saisie': c.saisie, '--f-titre': c.titre };
  const champs = ctx.champs || {}; const cart = cartoucheDe(tpl).filter((x) => x.visible !== false);
  const logo = tpl.logo !== false && e.logo; const nomE = String(e.nom || '').trim();
  return (
    <div className={cx('fiche', tpl.orientation === 'portrait' ? 'portrait' : 'paysage', `fs-${tpl.taille || 'm'}`, `lh-${tpl.ligne || 'n'}`)} style={vars}>
      <div className="fh2">
        {logo ? <div className="fh2-logo"><img src={e.logo} alt={nomE || 'Logo'} /></div> : nomE ? <div className="fh2-nom">{nomE}</div> : null}
        <div className="fh2-t"><div className="fh-titre">{tpl.titre}</div>{tpl.sous ? <div className="fh2-sous">{tpl.sous}</div> : null}</div>
        <div className="fh-ver"><div className="fh2-no"><span>N° de fiche</span><b className={cx(!ctx.ordre && 'vide')}>{ctx.ordre || ' '}</b></div>{cart.map((x, i) => <div key={i} className="fh2-cart">{x.label ? `${x.label} : ` : ''}{cartoucheVal(tpl, x)}</div>)}</div>
      </div>
      {(tpl.champs || []).length ? <div className="fh-champs">{(tpl.champs || []).map((ch, i) => { const { label } = champParse(ch); const v = champs[label] != null && champs[label] !== '' ? champs[label] : champs[ch] != null && champs[ch] !== '' ? champs[ch] : ficheChamp(db, ch, ctx); return <span key={i} className="fh-ch"><b>{label} :</b> <span className={cx('fh-val', v && 'rempli')}>{v || ' '}</span></span>; })}</div> : null}
      {(tpl.tableaux || []).map((t, ti) => {
        const cols = parseCols(t.cols); const L = colLeaves(cols); const rows = (ctx.rows && ctx.rows[ti]) || []; const fixes = String(t.fixes || '').split('\n').map((x) => x.trim()).filter(Boolean);
        const n = Math.max(num(t.lignes) + num(ctx.plus || 0), rows.length); if (!L.length) return null;
        const hasPre = L.some((x) => x.k && x.k !== 'ech') && rows.length; const hasSaisie = L.some((x) => isSaisie(x.h));
        return (
          <div key={ti} className="ft-wrap">
            {t.titre ? <div className="ft-titre">{t.titre}</div> : null}
            <table className="ft"><thead>{colHeadRows(cols).map((r, i) => <tr key={i}>{r.map((h, j) => <th key={j} colSpan={h.colSpan} rowSpan={h.rowSpan} style={h.leaf ? { minWidth: `${colMin(h.h, h.pere)}mm` } : undefined}>{h.h}</th>)}</tr>)}</thead>
              <tbody>{Array.from({ length: n }, (_, i) => { const row = rows[i] || null; const fx = !row && fixes.length ? fixes[(i - rows.length) % fixes.length] : ''; return (
                <tr key={i} className={t.zebre && i % 2 === 1 ? 'z' : ''}>{L.map((col, j) => { const v = row ? celluleFiche(row, col.k) : (j === 0 ? fx : (col.k === 'ech' ? '☐' : '')); return <td key={j} className={cx(j === 0 && 'c0', row && col.k && col.k !== 'ech' && v !== '' && 'pre', isSaisie(col.h) && 'saisie')}>{v}</td>; })}</tr>); })}</tbody>
            </table>
            {hasPre || hasSaisie ? <div className="ft-aide">{hasPre ? <span><i className="pre">en gris italique</i> : valeurs prévues par Œnotrack</span> : null}{hasSaisie ? <span><i className="sw" /> à relever et noter</span> : null}</div> : null}
          </div>
        );
      })}
      {tpl.remarque !== false ? <div className="fh-rem"><b>Observations :</b> {ctx.remarque || ''}<div className="fh-lignes"><i /><i /></div></div> : null}
      <div className="fh-visas">
        {tpl.visas !== false ? <span className="fh-visa">Visa de l’opérateur :</span> : null}
        {tpl.visaResp ? <span className="fh-visa">Visa du responsable :</span> : null}
        {tpl.saisie !== false ? <span className="fh-saisie">☐ Saisi dans Œnotrack le ____ / ____ / ________ par ____________</span> : null}
      </div>
      {tpl.notes ? <div className="fh-notes">{String(tpl.notes).split('\n').map((l, i) => <div key={i}>{l}</div>)}</div> : null}
      <div className="fh-foot">Œnotrack{ctx.ordre ? ` · fiche ${ctx.ordre}` : ''} · imprimée le {fmtDate(todayISO())}</div>
    </div>
  );
}

const FICHE_CSS_KEY = '/* fiches d’enregistrement */';
function ficheHtml(node, title, orientation) {
  const css = Array.from(document.querySelectorAll('style')).map((s) => s.textContent).join('\n'); const i = css.indexOf(FICHE_CSS_KEY); const j = css.indexOf('/* fin fiches */', i);
  const fcss = i >= 0 && j > i ? css.slice(i, j) : '';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title><style>body{margin:0;background:#fff}@page{size:A4 ${orientation === 'portrait' ? 'portrait' : 'landscape'};margin:10mm}${fcss}.fiche{width:auto!important;margin:0;zoom:1!important}.fiche+.fiche{break-before:page}</style></head><body>${node ? node.innerHTML : ''}</body></html>`;
}
// n° de fiche : préfixe du modèle, date (AAMMJJ) et rang de la fiche du jour — ex. MVT-261119-1
const ordreAuto = (db, tpl, date, offset = 0) => `${tpl.prefixe || 'FIC'}-${date.slice(2, 4)}${date.slice(5, 7)}${date.slice(8, 10)}-${(db.fiches || []).filter((y) => y.modele === tpl.id && y.date === date).length + 1 + offset}`;

// Boîte de dialogue : regroupe les éléments par modèle (une fiche par modèle), réglages à gauche, aperçu fidèle à droite, impression en PDF
function FicheDialog({ sources, onClose }) {
  const { db, act, toast } = useApp(); const M = fichesModeles(db);
  const states = useMemo(() => sources.map((s) => ({ s, st: ficheSrcState(db, s) })).filter((x) => x.st), []);
  const [choix, setChoix] = useState(() => { const c = {}; states.forEach((x, i) => { c[i] = x.st.vierge ? (M.find((m) => m.id === x.st.modele) || M[0]).id : (modeleFor(db, x.st.type, x.st.f) || {}).id; }); return c; });
  const groups = useMemo(() => { const g = {}; states.forEach((x, i) => { const id = choix[i]; (g[id] = g[id] || []).push(x); }); return Object.keys(g).map((id) => ({ tpl: M.find((m) => m.id === id) || M[0], items: g[id] })); }, [choix, db]);
  const [ordres, setOrdres] = useState({}); const [rem, setRem] = useState(''); const [ops, setOps] = useState(''); const [plus, setPlus] = useState(0); const [logged, setLogged] = useState(false); const [busy, setBusy] = useState(false); const ref = useRef(null);
  const [coulTmp, setCoulTmp] = useState(null); const [edTpl, setEdTpl] = useState(null); // couleurs pour cette impression seulement ; modèle à personnaliser
  const tplOf = (t) => { const p = coulTmp && FICHE_PRESETS.find((x) => x.id === coulTmp); return p ? { ...t, couleurs: { ...FICHE_COULEURS(), ...p.c } } : t; };
  const vierge = (g) => g.items.every((x) => x.st.vierge); // fiche vierge : n° et date à écrire à la main
  const ordreOf = (g, gi) => { const k = `${g.tpl.id}|${g.items[0].st.date}`; if (ordres[k] != null) return ordres[k]; if (vierge(g)) return ''; const before = groups.slice(0, gi).filter((x) => x.tpl.id === g.tpl.id && x.items[0].st.date === g.items[0].st.date).length; return ordreAuto(db, g.tpl, g.items[0].st.date, before); };
  const log = () => { if (logged) return; groups.forEach((g, gi) => { if (vierge(g) && !ordreOf(g, gi)) return; const src = g.items.filter((x) => x.s.kind === 'op' || x.s.kind === 'prev').map((x) => ({ kind: x.s.kind, id: x.s.id })); act((d) => ficheAdd(d, { modele: g.tpl.id, ordre: ordreOf(g, gi), date: g.items[0].st.date || todayISO(), sources: src })); }); setLogged(true); };
  const pdf = async () => {
    if (!ref.current) return; setBusy(true);
    const units = Array.from(ref.current.querySelectorAll('.fiche')).map((el) => ({ el, orientation: el.classList.contains('portrait') ? 'portrait' : 'paysage', fit: 'page' }));
    const ok = await printPdf({ units, root: ref.current, filename: `fiches-${groups.map((g, gi) => ordreOf(g, gi)).join('_').slice(0, 80) || todayISO()}.pdf`, title: groups.map((g) => g.tpl.titre).join(' · '), author: (db.entreprise || {}).nom, toast });
    setBusy(false); if (ok) log();
  };
  const direct = () => { log(); try { window.print(); } catch (e) { /* ignoré */ } };
  const html = async () => { log(); const o = groups[0] ? groups[0].tpl.orientation : 'paysage'; const r = await saveFile(`fiches-${todayISO()}.html`, ficheHtml(ref.current, 'Fiches d’enregistrement', o), 'text/html'); if (r.ok) toast('Fiches enregistrées en HTML.'); else if (!r.declined) toast(failMsg(r), 'bad'); };
  const champs = {}; if (ops.trim()) (groups[0] ? groups[0].tpl.champs || [] : []).forEach((ch) => { if (/op[ée]rateur/i.test(ch)) champs[ch] = ops.trim(); });
  const oprDe = (items) => operateursNoms(db, uniq(items.flatMap((x) => (x.st.f && x.st.f.operateurs) || []))); // opérateurs prévus / choisis des éléments de la fiche
  const oprDefaut = oprDe(states);
  return (
    <Sheet wide title="Fiches d’enregistrement" sub={states.every((x) => x.st.vierge) ? 'Fiche vierge, à remplir entièrement à la main' : `${states.length} élément(s) → ${groups.length} fiche(s) à imprimer pour les opérateurs`} onClose={onClose}
      footer={<><span className="mr-auto text-xs text-ink2">{logged ? (groups.every((g, gi) => vierge(g) && !ordreOf(g, gi)) ? '✓ Fiche vierge imprimée.' : '✓ N° de fiche noté dans « Fiches imprimées ».') : 'Le PDF s’ouvre dans votre lecteur : imprimez-le de là.'}</span><Btn onClick={html} title="Fichier HTML modifiable">⬇ HTML</Btn>{CAN_PRINT_DIRECT ? <Btn onClick={direct}>Impression directe</Btn> : null}<Btn kind="primary" onClick={pdf} disabled={busy}>{busy ? 'Préparation…' : '🖨 Imprimer (PDF)'}</Btn></>}>
      <div className="no-print mb-4 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
        <div className="space-y-2">
          <div className="lbl">1 · Modèle de fiche</div>
          {states.map((x, i) => (
            <div key={i} className="rounded-md border border-line p-2 text-sm">
              <div className="mb-1 flex flex-wrap items-center gap-2"><Chip tone={x.s.kind === 'prev' ? 'info' : x.s.kind === 'op' ? 'ok' : ''}>{x.st.vierge ? 'Vierge' : x.s.kind === 'prev' ? 'À réaliser' : x.s.kind === 'op' ? 'Validée' : 'Formulaire'}</Chip>{x.st.vierge ? null : <><b>{OP_LABELS[(x.st.f && x.st.f.sousType) || x.st.type] || OP_LABELS[x.st.type]}</b><span className="text-ink2">{fmtDate(x.st.date)}</span></>}</div>
              <SI plain value={choix[i]} onChange={(v) => setChoix({ ...choix, [i]: v })} options={M.map((m) => ({ value: m.id, label: m.titre }))} aria-label="Modèle de fiche" />
            </div>))}
        </div>
        <div className="space-y-2">
          <div className="lbl">2 · À compléter avant impression (facultatif)</div>
          {groups.map((g, gi) => <Field key={gi} label={`N° de fiche — ${g.tpl.titre}`} help={vierge(g) ? 'Vide : à écrire à la main.' : ''}><TI value={ordreOf(g, gi)} onChange={(v) => setOrdres({ ...ordres, [`${g.tpl.id}|${g.items[0].st.date}`]: v })} placeholder={vierge(g) ? 'à écrire à la main' : ''} /></Field>)}
          <Field label="Opérateur(s)" help={oprDefaut ? `Par défaut : ${oprDefaut}.` : 'Par défaut : les opérateurs choisis dans l’opération (sinon, à écrire à la main).'}><TI value={ops} onChange={setOps} placeholder={oprDefaut || 'Laisser vide pour l’écrire à la main'} /></Field>
          <Field label="Remarque pré-imprimée"><TI value={rem} onChange={setRem} placeholder="ex. Rincer la cuve 08 avant le transfert" /></Field>
          <Field label="Lignes vides en plus"><SI plain value={String(plus)} onChange={(v) => setPlus(num(v))} options={[0, 2, 4, 6, 10].map((k) => ({ value: String(k), label: k ? `+ ${k} lignes` : 'Aucune' }))} /></Field>
        </div>
        <div className="space-y-2 text-sm">
          <div className="lbl">3 · Couleurs, puis impression</div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Couleurs de la fiche">
            <Btn size="sm" kind={!coulTmp ? 'primary' : undefined} aria-pressed={!coulTmp} onClick={() => setCoulTmp(null)}>Celles du modèle</Btn>
            {FICHE_PRESETS.map((p) => <Btn key={p.id} size="sm" kind={coulTmp === p.id ? 'primary' : undefined} aria-pressed={coulTmp === p.id} onClick={() => setCoulTmp(p.id)}><span className="swatch" style={{ background: p.c.th || FICHE_COULEURS().th }} />{p.nom}</Btn>)}
          </div>
          <div className="flex flex-wrap gap-1.5">{uniq(groups.map((g) => g.tpl.id)).map((id) => { const t = groups.find((g) => g.tpl.id === id).tpl; return <Btn key={id} size="sm" onClick={() => setEdTpl(t)} title="Colonnes, champs, couleurs, taille du texte… enregistrés pour les prochaines fois">🎨 Personnaliser « {t.titre} »…</Btn>; })}</div>
          <p className="text-ink2">Gris italique = valeurs prévues par Œnotrack ; cases teintées = valeurs à relever. « 🖨 Imprimer (PDF) » crée un PDF A4 identique à l’aperçu : ouvrez-le puis imprimez-le.</p>
        </div>
      </div>
      <div className="fiche-scroll"><div ref={ref} className="report fiches">
        {groups.map((g, gi) => { const first = g.items[0].st; const rows = (g.tpl.tableaux || []).map((t) => g.items.flatMap((x) => ficheRows(db, x.st, t.fill))); return <FichePage key={gi} tpl={tplOf(g.tpl)} ctx={{ ordre: ordreOf(g, gi), date: first.date, f: first.f, type: first.type, Rd: first.Rd, rows, remarque: rem, plus, champs, operateursTexte: oprDe(g.items) }} />; })}
      </div></div>
      {edTpl ? <ModeleEditor tpl={edTpl} onClose={() => setEdTpl(null)} /> : null}
    </Sheet>
  );
}

/* ---------- éditeur visuel des colonnes ---------- */
const K_MVT = [['op', 'Opération'], ['dep', 'Cuve de départ'], ['depCode', 'Lot (départ)'], ['depAvT', 'Départ : volume avant prévu (hL)'], ['volT', 'Volume transféré prévu (hL)'], ['depApT', 'Départ : volume après prévu (hL)'], ['arr', 'Cuve d’arrivée'], ['arrCode', 'Lot (arrivée)'], ['arrAvT', 'Arrivée : volume avant prévu (hL)'], ['arrApT', 'Arrivée : volume après prévu (hL)'], ['perteT', 'Lies, pertes prévues (hL)'], ['clairT', 'Clair soutiré prévu (hL)'], ['bourbesT', 'Bourbes prévues (hL)'], ['ech', 'Case à cocher ☐']];
const K_REC = [['comp', 'Compartiment'], ['vol', 'Volume reçu (hL)'], ['origine', 'Fraction · cépage · cru · millésime'], ['dest', 'Cuve de destination'], ['code', 'Code qualité (lot)'], ['avHL', 'Volume avant (hL)'], ['apHL', 'Volume après (hL)'], ['ech', 'Case à cocher ☐']];
const K_TRT = [['cuve', 'Cuve traitée'], ['code', 'Lot'], ['volHL', 'Volume traité (hL)'], ['produit', 'Produit'], ['dose', 'Dose (g/hL ou mL/hL)'], ['qte', 'Quantité prévue'], ['numLot', 'N° de lot fournisseur'], ['ech', 'Case à cocher ☐']];
const K_SUI = [['cuve', 'Cuve'], ['code', 'Lot'], ['volHL', 'Volume (hL)'], ['stade', 'Stade'], ['dernier', 'Dernier relevé (densité · T°)'], ['densite', 'Densité relevée'], ['temp', 'Température relevée'], ['action', 'Action / motif'], ['produit', 'Intrant ajouté'], ['qte', 'Quantité'], ['numLot', 'N° de lot fournisseur'], ['ech', 'Case à cocher ☐']];
const K_SOR = [['cuve', 'Cuve'], ['code', 'Lot'], ['avHL', 'Volume avant (hL)'], ['volHL', 'Volume sorti (hL)'], ['apHL', 'Volume après (hL)'], ['motif', 'Nature / motif'], ['dest', 'Destinataire'], ['ref', 'N° de document'], ['ech', 'Case à cocher ☐']];
const K_ETA = [['cuve', 'Cuve'], ['code', 'Lot'], ['volHL', 'Volume (hL)'], ['stadeAv', 'Stade avant'], ['stadeAp', 'Stade après'], ['couleur', 'Couleur'], ['ech', 'Case à cocher ☐']];
const K_APP = [['app', 'Apporteur'], ['cru', 'Cru / commune'], ['parcelle', 'Parcelle'], ['cep', 'Cépage'], ['rev', 'Revendication'], ['kg', 'Poids (kg)'], ['ref', 'N° de bon'], ['ech', 'Case à cocher ☐']];
const K_FRA = [['frac', 'Fraction'], ['cuve', 'Cuve'], ['code', 'Lot'], ['vol', 'Volume prévu (hL)'], ['avHL', 'Cuve avant (hL)'], ['apHL', 'Cuve après (hL)'], ['ech', 'Case à cocher ☐']];
const K_PRO = [['produit', 'Produit / article'], ['dose', 'Dose (g/hL ou mL/hL)'], ['qte', 'Quantité prévue'], ['numLot', 'N° de lot fournisseur'], ['ech', 'Case à cocher ☐']];
const K_PRE = [['prepType', 'Type de préparation'], ['prepCode', 'Code'], ['volHL', 'Volume prévu (hL)'], ['rev', 'Revendication'], ['ech', 'Case à cocher ☐']];
const K_INV = [['cuve', 'Cuve'], ['cap', 'Contenance (hL)'], ['code', 'Lot(s)'], ['desig', 'Désignation'], ['volHL', 'Volume théorique (hL)'], ['ech', 'Case à cocher ☐']];
const FICHE_KEYS = { aucun: [['ech', 'Case à cocher ☐']], mouvements: K_MVT, assemblage: K_MVT, debourbage: K_MVT, filtration: K_MVT, reception: K_REC, traitements: K_TRT, froid: K_TRT, levurage: K_TRT, suivi: K_SUI, sortie: K_SOR, etape: K_ETA,
  apport: K_APP, charges: K_APP, fractions: K_FRA, produits: K_PRO, preparations: K_PRE, inventaire: K_INV };
// données élémentaires (à combiner librement dans un « pré-rempli personnalisé »)
const A_LOT = (pre, quoi) => [[`${pre}Designation`, `Désignation (${quoi})`], [`${pre}Cepages`, `Cépages (${quoi})`], [`${pre}Crus`, `Crus (${quoi})`], [`${pre}Millesimes`, `Millésimes (${quoi})`], [`${pre}Fractions`, `Fractions (${quoi})`], [`${pre}Revendication`, `Revendication (${quoi})`], [`${pre}Stade`, `Stade (${quoi})`], [`${pre}Partenaires`, `Partenaires (${quoi})`]];
const A_COMMUN = [['date', 'Date'], ['operateurs', 'Opérateur(s)'], ['notes', 'Notes']];
const A_REC = [['numLot', 'N° de lot'], ['comp', 'Compartiment'], ['partenaires', 'Partenaire(s)'], ['fraction', 'Fraction'], ['cepage', 'Cépage'], ['cru', 'Cru (village)'], ['echelle', 'Classement du cru'], ['millesime', 'Millésime'], ['revendication', 'Revendication'], ['couleur', 'Couleur'], ['parcelle', 'Parcelle'], ['analyses', 'Analyses du lot'], ['vol', 'Volume reçu (hL)'], ['dest', 'Cuve de destination'], ['code', 'Code qualité (lot)'], ['avHL', 'Volume avant (hL)'], ['apHL', 'Volume après (hL)'], ['refBon', 'N° de bon / DAE'], ['citerne', 'Citerne'], ['ech', 'Case à cocher ☐']];
const FICHE_ATOMES = { reception: [...A_REC, ...A_COMMUN], mouvements: [...K_MVT, ...A_LOT('dep', 'lot de départ'), ...A_COMMUN], traitements: [...K_TRT, ...A_LOT('lot', 'lot traité'), ...A_COMMUN],
  suivi: [...K_SUI, ...A_LOT('lot', 'lot en cuve'), ...A_COMMUN], sortie: [...K_SOR, ...A_LOT('lot', 'lot sorti'), ...A_COMMUN], etape: [...K_ETA, ...A_LOT('lot', 'lot'), ...A_COMMUN], inventaire: [...K_INV, ...A_LOT('lot', 'lot en cuve'), ...A_COMMUN] };
['assemblage', 'debourbage', 'filtration'].forEach((k) => { FICHE_ATOMES[k] = FICHE_ATOMES.mouvements; }); ['froid', 'levurage'].forEach((k) => { FICHE_ATOMES[k] = FICHE_ATOMES.traitements; });
const ficheAtomes = (fill) => [...(FICHE_ATOMES[fill] || [...(FICHE_KEYS[fill] || FICHE_KEYS.aucun), ...A_COMMUN]), ...CHAMPS_FICHE]; // + champs personnalisés des opérations
const atomeLabel = (fill, a) => (ficheAtomes(fill).find((x) => x[0] === a) || [a, a])[1];
const persoLabel = (fill, k) => k.slice(2).split('_').map((a) => atomeLabel(fill, a)).join(' · ');
// choisir et ordonner les données d'un pré-rempli personnalisé
function PrerempliDialog({ fill, value, onSave, onClose }) {
  const atomes = ficheAtomes(fill); const [sel, setSel] = useState(() => (value && value.startsWith('x_') ? value.slice(2).split('_') : []));
  const tog = (a) => setSel((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a])); const mv = (i, d) => setSel((s) => { const t = [...s]; const j = i + d; if (j < 0 || j >= t.length) return s; [t[i], t[j]] = [t[j], t[i]]; return t; });
  return (
    <Sheet title="Pré-rempli personnalisé" sub="Cochez les données à écrire dans la colonne, puis réglez leur ordre : elles seront séparées par « · »." onClose={onClose}
      footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" disabled={!sel.length} onClick={() => { onSave(`x_${sel.join('_')}`); onClose(); }}>Utiliser ce pré-rempli</Btn></>}>
      {sel.length ? <div className="mb-3 space-y-1" data-ordre="">{sel.map((a, i) => <div key={a} className="flex items-center gap-2 rounded-md border border-line px-2 py-1 text-sm"><span className="num w-5 text-ink2">{i + 1}</span><span className="flex-1">{atomeLabel(fill, a)}</span><Btn size="sm" disabled={!i} onClick={() => mv(i, -1)} aria-label={`Monter ${atomeLabel(fill, a)}`}>↑</Btn><Btn size="sm" disabled={i === sel.length - 1} onClick={() => mv(i, 1)} aria-label={`Descendre ${atomeLabel(fill, a)}`}>↓</Btn></div>)}
        <div className="text-xs text-ink2">Aperçu : « {sel.map((a) => atomeLabel(fill, a)).join(' · ')} »</div></div> : <div className="mb-3 text-sm text-ink2">Aucune donnée choisie.</div>}
      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,210px),1fr))' }}>{atomes.filter(([k]) => k !== 'ech').map(([k, l]) => <Check key={k} checked={sel.includes(k)} onChange={() => tog(k)} label={l} />)}</div>
    </Sheet>
  );
}
const serializeCols = (nodes, d = 0) => nodes.map((n) => `${'  '.repeat(d)}${n.h}${n.k ? ` {${n.k}}` : ''}${n.c.length ? `\n${serializeCols(n.c, d + 1)}` : ''}`).join('\n');
function ColsEditor({ value, onChange, fill }) {
  const [tree, setTree] = useState(() => parseCols(value));
  useEffect(() => { if (serializeCols(tree) !== value) setTree(parseCols(value)); }, [value]);
  const keys = FICHE_KEYS[fill] || FICHE_KEYS.aucun; const [perso, setPerso] = useState(null); // { p, k }
  const autres = ficheAtomes(fill).filter(([k]) => !keys.some((x) => x[0] === k));
  const optsDe = (k) => [...keys.map(([kk, l]) => ({ value: kk, label: `Pré-rempli : ${l}` })), ...autres.map(([kk, l]) => ({ value: kk, label: `Pré-rempli : ${l}` })),
    ...(k && k.startsWith('x_') ? [{ value: k, label: `Personnalisé : ${persoLabel(fill, k)}` }] : []), { value: '__perso', label: '✚ Pré-rempli personnalisé…' }];
  const sib = (t, p) => (p.length === 1 ? t : p.slice(0, -1).reduce((nodes, i) => nodes[i].c, t));
  const node = (t, p) => sib(t, p)[p[p.length - 1]];
  const mut = (fn) => { const t = clone(tree); fn(t); setTree(t); onChange(serializeCols(t)); };
  const rows = []; const walk = (nodes, path, d) => nodes.forEach((n, i) => { const p = [...path, i]; rows.push({ n, p, d, first: i === 0, last: i === nodes.length - 1 }); walk(n.c, p, d + 1); }); walk(tree, [], 0);
  return (
    <div className="space-y-1">
      {rows.map(({ n, p, d, first, last }) => (
        <div key={p.join('.')} className="flex flex-wrap items-center gap-1 rounded-md py-0.5" style={{ paddingLeft: d * 22, background: d ? 'transparent' : 'var(--surface2)' }}>
          <span className="w-4 text-center text-ink2" aria-hidden="true">{d ? '↳' : '▦'}</span>
          <input className="inp" style={{ width: 'auto', flex: '1 1 150px', minWidth: 120 }} value={n.h} onChange={(e) => { const v = e.target.value; mut((t) => { node(t, p).h = v; }); }} aria-label="Intitulé de la colonne" />
          {!n.c.length ? <div className="flex items-center gap-1" style={{ flex: '0 1 280px', minWidth: 170 }}><SI plain value={n.k || ''} onChange={(v) => { if (v === '__perso') { setPerso({ p, k: n.k || '' }); return; } mut((t) => { node(t, p).k = v || null; }); }} placeholder="✍ à remplir à la main" options={optsDe(n.k)} aria-label="Contenu de la colonne" />{n.k && n.k.startsWith('x_') ? <Btn size="sm" onClick={() => setPerso({ p, k: n.k })} aria-label="Modifier le pré-rempli personnalisé" title="Modifier les données de ce pré-rempli">✎</Btn> : null}</div> : <span className="text-xs text-ink2">{colLeaves(n.c).length} sous-colonnes</span>}
          <Btn size="sm" disabled={first} onClick={() => mut((t) => { const s = sib(t, p); const i = p[p.length - 1]; [s[i - 1], s[i]] = [s[i], s[i - 1]]; })} aria-label="Déplacer avant">↑</Btn>
          <Btn size="sm" disabled={last} onClick={() => mut((t) => { const s = sib(t, p); const i = p[p.length - 1]; [s[i + 1], s[i]] = [s[i], s[i + 1]]; })} aria-label="Déplacer après">↓</Btn>
          <Btn size="sm" onClick={() => mut((t) => { const nd = node(t, p); nd.k = null; nd.c.push({ h: nd.c.length ? 'réel' : 'théo.', k: null, c: [] }); })} title="Ajouter une sous-colonne (ex. théo. / réel)">+ sous-colonne</Btn>
          <Btn size="sm" kind="danger" onClick={() => mut((t) => { sib(t, p).splice(p[p.length - 1], 1); })} aria-label="Retirer la colonne">✕</Btn>
        </div>))}
      <Btn size="sm" onClick={() => mut((t) => { t.push({ h: 'Nouvelle colonne', k: null, c: [] }); })}>+ Ajouter une colonne</Btn>
      {perso ? <PrerempliDialog fill={fill} value={perso.k} onClose={() => setPerso(null)} onSave={(k) => mut((t) => { node(t, perso.p).k = k; })} /> : null}
    </div>
  );
}

/* ---------- personnalisation des modèles ---------- */
function ModeleEditor({ tpl, onClose }) {
  const { db, act } = useApp();
  const [m, setM] = useState(() => clone({ ...tpl, _perso: undefined, _defaut: undefined }));
  const set = (k, v) => setM((x) => ({ ...x, [k]: v }));
  const setT = (i, k, v) => setM((x) => ({ ...x, tableaux: x.tableaux.map((t, j) => (j === i ? { ...t, [k]: v } : t)) }));
  const coul = ficheCoul(m); const setC = (k, v) => setM((x) => ({ ...x, couleurs: { ...ficheCoul(x), [k]: v } }));
  const save = () => { const t = { ...m }; delete t._perso; delete t._defaut; const r = act((d) => modeleFicheSave(d, t), 'Modèle enregistré.'); if (r.ok) onClose(); };
  const demo = { ordre: ordreAuto({ fiches: [] }, m, todayISO()), date: todayISO(), f: {}, rows: [], remarque: '' };
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  return (
    <Sheet wide title={`Modèle de fiche — ${m.titre || 'sans titre'}`} sub="Modifiez puis regardez l’aperçu en bas : il est identique au PDF imprimé." onClose={onClose} footer={<><Btn onClick={onClose}>Annuler</Btn><Btn kind="primary" onClick={save}>Enregistrer le modèle</Btn></>}>
      <div className="space-y-5">
        <Sec title="1 · En-tête">
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
            <Field label="Titre"><TI value={m.titre} onChange={(v) => set('titre', v)} /></Field>
            <Field label="Sous-titre (facultatif)"><TI value={m.sous || ''} onChange={(v) => set('sous', v)} placeholder="ex. Mouvements de vin entre contenants" /></Field>
            <Field label="Préfixe du n° de fiche" help="ex. MVT → MVT-261119-1 (date AAMMJJ, rang du jour)"><TI value={m.prefixe} onChange={(v) => set('prefixe', v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))} /></Field>
            <Field label="Format"><SI plain value={m.orientation} onChange={(v) => set('orientation', v)} options={[{ value: 'paysage', label: 'A4 paysage' }, { value: 'portrait', label: 'A4 portrait' }]} /></Field>
          </div>
          <div className="mt-3"><CartoucheEditor m={m} set={set} /></div>
          <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
            <Group label="Champs à remplir sous l’en-tête (un par ligne)" help="« {clé} » après le libellé : rempli par Œnotrack (choisissez dans la liste ci-dessous) ; sans clé : à écrire à la main."><TA value={(m.champs || []).join('\n')} onChange={(v) => set('champs', v.split('\n').map((x) => x.trim()).filter(Boolean))} rows={5} aria-label="Champs sous l’en-tête" />
              <div className="mt-1"><SI plain value="" onChange={(v) => { if (!v) return; const c = FICHE_CHAMPS_CLES.find((x) => x[0] === v); set('champs', [...(m.champs || []), `${c[1]} {${c[0]}}`]); }} options={[{ value: '', label: '+ Ajouter un champ pré-rempli…' }, ...FICHE_CHAMPS_CLES.map(([k, l, q]) => ({ value: k, label: `${l} (${q})` }))]} aria-label="Ajouter un champ pré-rempli" /></div></Group>
            <Group label="Proposé par défaut pour (opérations)"><div className="max-h-56 space-y-2 overflow-auto pr-1">{opGroupes(db, null, true).map((g) => <div key={g.title}><div className="text-xs font-semibold text-ink2">{g.title}</div><div className="flex flex-wrap gap-x-4 gap-y-1">{g.items.filter((k) => k !== 'declassement').map((k) => <Check key={k} checked={(m.types || []).includes(k)} onChange={(v) => set('types', v ? [...(m.types || []), k] : (m.types || []).filter((x) => x !== k))} label={OP_LABELS[k] || k} />)}</div></div>)}</div></Group>
          </div>
        </Sec>
        <Sec title="2 · Tableaux et colonnes">
          {(m.tableaux || []).map((t, i) => (
            <div key={i} className="mb-3 rounded-md border border-line p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2"><b>Tableau {i + 1}</b><span className="ml-auto" /><Btn size="sm" kind="danger" disabled={(m.tableaux || []).length < 2} onClick={() => set('tableaux', m.tableaux.filter((_, j) => j !== i))}>Retirer le tableau</Btn></div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
                <Field label="Titre du tableau (bandeau)"><TI value={t.titre} onChange={(v) => setT(i, 'titre', v)} placeholder="facultatif" /></Field>
                <Field label="Lignes à remplir"><NI value={t.lignes} onChange={(v) => setT(i, 'lignes', clamp(parseInt(v, 10) || 0, 0, 60))} /></Field>
                <Field label="Pré-remplir à partir de"><SI plain value={t.fill} onChange={(v) => setT(i, 'fill', v)} options={Object.keys(FICHE_FILLS).map((k) => ({ value: k, label: FICHE_FILLS[k] }))} /></Field>
                <Group label="Présentation"><Check checked={!!t.zebre} onChange={(v) => setT(i, 'zebre', v)} label="Lignes grisées une sur deux" /></Group>
              </div>
              <div className="mt-3"><span className="lbl">Colonnes (dans l’ordre d’impression)</span><ColsEditor value={t.cols} fill={t.fill} onChange={(v) => setT(i, 'cols', v)} /></div>
              <details className="mt-3"><summary className="text-sm">Options avancées</summary>
                <div className="mt-2 grid gap-3" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
                  <Field label="1re colonne des lignes vides (une valeur par ligne, en boucle)" help="ex. « Débourbage statique » puis « Relogement bourbes »."><TA value={t.fixes} onChange={(v) => setT(i, 'fixes', v)} rows={4} /></Field>
                  <Field label="Colonnes en texte (2 espaces = sous-colonne ; {clé} = pré-remplie)"><textarea className="inp num" style={{ minHeight: 150, fontSize: 12, whiteSpace: 'pre' }} value={t.cols} onChange={(e) => setT(i, 'cols', e.target.value)} spellCheck={false} /></Field>
                </div></details>
            </div>))}
          <Btn size="sm" onClick={() => set('tableaux', [...(m.tableaux || []), { titre: '', fill: 'aucun', lignes: 6, zebre: false, fixes: '', cols: 'Colonne 1\nColonne 2\nColonne 3' }])}>+ Ajouter un tableau</Btn>
        </Sec>
        <Sec title="3 · Couleurs et lisibilité">
          <div className="mb-3 flex flex-wrap gap-2">{FICHE_PRESETS.map((p) => <Btn key={p.id} size="sm" onClick={() => set('couleurs', { ...FICHE_COULEURS(), ...p.c })}><span className="swatch" style={{ background: p.c.th || FICHE_COULEURS().th }} />{p.nom}</Btn>)}<Btn size="sm" onClick={() => set('couleurs', { ...FICHE_COULEURS(), th: accent, thTxt: '#FFFFFF', band: accent, bandTxt: '#FFFFFF', titre: accent, bord: accent })}><span className="swatch" style={{ background: accent }} />Couleur de la charte</Btn></div>
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))' }}>{FICHE_COUL_LABELS.map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="color" className="h-8 w-11 cursor-pointer rounded border border-line bg-surface p-0.5" value={coul[k]} onChange={(e) => setC(k, e.target.value)} aria-label={l} />{l}</label>)}</div>
          <div className="mt-3 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))' }}>
            <Field label="Taille du texte"><SI plain value={m.taille || 'm'} onChange={(v) => set('taille', v)} options={[{ value: 's', label: 'Petite' }, { value: 'm', label: 'Normale' }, { value: 'l', label: 'Grande' }]} /></Field>
            <Field label="Hauteur des lignes à remplir"><SI plain value={m.ligne || 'n'} onChange={(v) => set('ligne', v)} options={[{ value: 'c', label: 'Compacte' }, { value: 'n', label: 'Normale' }, { value: 'l', label: 'Large (écriture à la main)' }]} /></Field>
            <Group label="Zones"><div className="space-y-1"><Check checked={m.logo !== false} onChange={(v) => set('logo', v)} label="Logo de l’entreprise" /><Check checked={m.remarque !== false} onChange={(v) => set('remarque', v)} label="Observations" /><Check checked={m.visas !== false} onChange={(v) => set('visas', v)} label="Visa de l’opérateur" /><Check checked={!!m.visaResp} onChange={(v) => set('visaResp', v)} label="Visa du responsable" /><Check checked={m.saisie !== false} onChange={(v) => set('saisie', v)} label="Case « saisi dans Œnotrack »" /></div></Group>
          </div>
          <Field label="Notes de bas de fiche" className="mt-3"><TA value={m.notes} onChange={(v) => set('notes', v)} rows={2} /></Field>
        </Sec>
        <Sec title="Aperçu"><div className="fiche-scroll rounded-md border border-line bg-white p-2"><div className="fiche-preview" style={{ zoom: 0.72 }}><FichePage tpl={m} ctx={demo} /></div></div></Sec>
      </div>
    </Sheet>
  );
}

function ModelesView() {
  const { db, act, confirm, openFiche } = useApp(); const M = fichesModeles(db); const [ed, setEd] = useState(null); const [prev, setPrev] = useState(null);
  const dup = (t) => { const id = `perso-${Date.now().toString(36)}`; setEd({ ...clone(t), id, titre: `${t.titre} (copie)`, types: [], _perso: false, _defaut: false }); };
  const reset = async (t) => { if (await confirm({ title: `Rétablir le modèle « ${t.titre} » d’origine ?`, body: 'Vos personnalisations de ce modèle seront perdues.', ok: 'Rétablir', danger: true })) act((d) => modeleFicheReset(d, t.id), 'Modèle d’origine rétabli.'); };
  const anciens = M.filter((t) => t._perso && t._defaut && (t.v || 0) < FICHE_VERSION);
  return (
    <div>
      <p className="mb-3 text-sm text-ink2">Fiches papier à remplir au chai : Œnotrack y pré-remplit ce qu’il sait (cuves, lots, volumes prévus, produits) ; l’opérateur note les valeurs relevées, puis on les saisit dans Œnotrack. Imprimez-les depuis une opération ou une opération à réaliser (🖨), ou vierges ci-dessous. Chaque modèle se modifie (titre, champs, colonnes, couleurs) ou se duplique.</p>
      {anciens.length ? <div className="mb-3"><Notice tone="info" title={`${anciens.length} modèle${anciens.length > 1 ? 's' : ''} personnalisé${anciens.length > 1 ? 's' : ''} d’après les anciens modèles`}>Les modèles d’origine ont été refaits (en-tête compact, colonnes « prévu / relevé », rien de propre à une entreprise). Vos versions personnalisées sont gardées : « Rétablir » reprend le nouveau modèle d’origine.</Notice></div> : null}
      <Tbl rows={M} cols={[
        { h: 'Modèle', r: (t) => <div><b>{t.titre}</b>{t.sous ? <div className="text-xs text-ink2">{t.sous}</div> : null}</div> }, { h: 'N° de fiche', r: (t) => <span className="num">{t.prefixe}-…</span> }, { h: 'Format', cls: 'hm', r: (t) => (t.orientation === 'portrait' ? 'A4 portrait' : 'A4 paysage') },
        { h: 'Utilisé pour', cls: 'hm', r: (t) => (t.types || []).map((k) => OP_LABELS[k]).join(', ') || (opList(db).filter((x) => x.ficheId === t.id).map((x) => x.label).join(', ')) || '—' },
        { h: 'État', r: (t) => (t._perso ? <Chip tone="info">{t._defaut ? 'personnalisé' : 'créé'}</Chip> : <span className="text-xs text-ink2">d’origine</span>) },
        { h: '', r: (t) => <div className="flex flex-wrap gap-1"><Btn size="sm" onClick={() => setPrev(t)}>Aperçu</Btn><Btn size="sm" onClick={() => openFiche([{ kind: 'vierge', modele: t.id }])} title="Fiche à remplir entièrement à la main">🖨 Vierge</Btn><Btn size="sm" onClick={() => setEd(t)}>Modifier</Btn><Btn size="sm" onClick={() => dup(t)}>Dupliquer</Btn>{t._perso ? <Btn size="sm" kind="danger" onClick={() => reset(t)}>{t._defaut ? 'Rétablir' : 'Supprimer'}</Btn> : null}</div> }]} />
      {ed ? <ModeleEditor tpl={ed} onClose={() => setEd(null)} /> : null}
      {prev ? <Sheet wide title={`Aperçu — ${prev.titre}`} onClose={() => setPrev(null)} footer={<><Btn onClick={() => { setPrev(null); openFiche([{ kind: 'vierge', modele: prev.id }]); }}>🖨 Imprimer vierge</Btn><Btn kind="primary" onClick={() => setPrev(null)}>Fermer</Btn></>}><div className="fiche-scroll"><div className="fiche-preview" style={{ zoom: 0.8 }}><FichePage tpl={prev} ctx={{ ordre: '', date: '', f: {}, rows: [], remarque: '' }} /></div></div></Sheet> : null}
    </div>
  );
}

function FichesLogView() {
  const { db, openFiche } = useApp(); const M = fichesModeles(db); const rows = [...(db.fiches || [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return <Tbl rows={rows} empty="Aucune fiche imprimée pour l’instant." cols={[
    { h: 'N° de fiche', r: (x) => <b className="num">{x.ordre}</b> }, { h: 'Modèle', r: (x) => ficheTitre(M, x.modele) }, { h: 'Date', r: (x) => fmtDate(x.date) },
    { h: 'Éléments', r: (x) => (x.sources || []).map((s) => (s.kind === 'op' ? (db.ops.find((o) => o.id === s.id) ? opNom(db.ops.find((o) => o.id === s.id)) : 'opération supprimée') : (() => { const pv = (db.previsions || []).find((p) => p.id === s.id); return pv ? `${opNom(pv)} (${PREV_STATUT[pv.statut] ? PREV_STATUT[pv.statut].label.toLowerCase() : 'à réaliser'})` : 'opération planifiée supprimée'; })())).join(', ') || '—' },
    { h: 'Éditée le', cls: 'hm', r: (x) => fmtDate(x.creeLe) },
    { h: '', r: (x) => ((x.sources || []).length ? <Btn size="sm" onClick={() => openFiche(x.sources)}>Réimprimer</Btn> : null) }]} />;
}
