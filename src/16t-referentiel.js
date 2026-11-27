/* ============ RÉFÉRENTIEL RÉGLEMENTAIRE DES INTRANTS (0.40.0-alpha.1) ============
   Base préétablie, dans le code (jamais dans la base) : réglementation de l'UE, cahier des charges de l'appellation (selon le vignoble du
   profil régional), labels et démarches (Bio UE, Demeter, Biodyvin, Terra Vitis, Nature & Progrès, AVN, S.A.I.N.S.).
   Pour chaque couple composé actif × référentiel : statut (oui | non | condition), dose maximale d'emploi (g/hL du composé),
   teneur maximale résiduelle ou cumulée dans le vin (mg/L de l'espèce dosée : acide sorbique, cuivre…), condition, texte source.
   TOUTES LES VALEURS SONT DES EXEMPLES « À VÉRIFIER » (CLAUDE.md) : relevées dans les textes cités et recoupées avec les catalogues
   des fournisseurs archivés (16k-catalogues : doses maximales et mentions « utilisable en bio »), jamais présentées comme officielles.
   Corrections de l'exploitation : db.settings.referentiel = { actif (absent = oui), exceptions: { 'label|composé' | 'label|so2t|vin':
     { statut, doseMax, teneurMax, valeur, condition, par, le } } } (réglage commun, droit Intrants ; les champs inconnus sont gardés).
   Revendications de l'exploitation → référentiels : lists.qualifs[].referentiels (absent : deviné d'après l'identifiant et le nom).
   Lot : lots[].labelsVises = [ids du référentiel] (labels visés en plus de la revendication).
   Produit : produits[].composes = [{ id, part }] (part : g de composé par g — ou par mL — de produit ; absent : deviné d'après le nom,
     « 2 % » dans le nom → 0,02, sinon produit supposé pur). */
const REG_TEXTES = {
  ue: 'Règlement délégué (UE) 2019/934 (pratiques œnologiques), annexe I, modifié (règlement délégué (UE) 2024/3085) — exemple à vérifier',
  ue_zones: 'Règlement (UE) n° 1308/2013, annexe VIII (enrichissement, acidification, désacidification par zone viticole) — exemple à vérifier',
  champagne: 'Cahier des charges de l’AOC « Champagne » homologué (Code rural et de la pêche maritime, art. L641-6 et suivants) — exemple à vérifier',
  bio: 'Règlement (UE) 2018/848, annexe II partie VI ; règlement d’exécution (UE) 2021/1165, annexe V partie D — exemple à vérifier',
  demeter: 'Cahier des charges Demeter France, vinification (résumé 2024, fiche 2026) — exemple à vérifier',
  biodyvin: 'Cahier des charges Biodyvin (SIVCBD, mise à jour du 26 novembre 2024) — exemple à vérifier',
  terravitis: 'Cahier des charges Terra Vitis — aucune restriction d’intrant relevée : à vérifier',
  np: 'Cahier des charges Nature & Progrès, vins — exemple à vérifier',
  avn: 'Charte et cahier des charges de l’Association des Vins Naturels (AVN) — exemple à vérifier',
  sains: 'Charte de l’association S.A.I.N.S. (Sans Aucun Intrant Ni Sulfite ajouté) — exemple à vérifier',
};
// herite : référentiels dont les règles s'appliquent aussi (la plus restrictive l'emporte) ; defaut 'non' : tout intrant non listé « oui » est refusé
const REG_LABELS = [
  { id: 'ue', label: 'Réglementation UE', court: 'UE', type: 'reglement', herite: [], texte: 'ue', note: 'S’applique à tous les vins.' },
  { id: 'aoc-champagne', label: 'AOC Champagne', court: 'AOC', type: 'appellation', regions: ['champagne'], herite: ['ue'], texte: 'champagne', note: 'Appliqué quand le vignoble du profil régional est la Champagne.' },
  { id: 'bio-ue', label: 'Bio européen (UE)', court: 'BIO', type: 'label', herite: ['ue'], texte: 'bio', note: 'Seuls les produits de l’annexe V partie D sont utilisables ; sucre, MCR et alcool d’origine biologique.' },
  { id: 'demeter', label: 'Demeter', court: 'DEM', type: 'label', herite: ['bio-ue'], texte: 'demeter', note: 'Certification bio exigée ; au plus 5 interventions de vinification avant la mise en bouteille.' },
  { id: 'biodyvin', label: 'Biodyvin', court: 'BDV', type: 'label', herite: ['bio-ue'], texte: 'biodyvin', note: 'Certification bio exigée.' },
  { id: 'terra-vitis', label: 'Terra Vitis', court: 'TV', type: 'label', herite: ['ue'], texte: 'terravitis', note: 'Démarche de viticulture durable : règles de l’UE à défaut de restriction relevée.' },
  { id: 'nature-progres', label: 'Nature & Progrès', court: 'N&P', type: 'label', herite: ['bio-ue'], texte: 'np', note: 'Règles au moins aussi strictes que le bio (à vérifier).' },
  { id: 'avn', label: 'AVN (Vins Naturels)', court: 'AVN', type: 'label', herite: ['bio-ue'], texte: 'avn', defaut: 'non', note: 'Raisins bio certifiés ; aucun intrant ni additif, sulfites en doses minimes seulement.' },
  { id: 'sains', label: 'Vins S.A.I.N.S.', court: 'SAINS', type: 'label', herite: ['bio-ue'], texte: 'sains', defaut: 'non', note: 'Raisins bio ; aucun intrant, aucun sulfite ajouté.' },
];
const refLabel = (id) => REG_LABELS.find((l) => l.id === id) || null;
const refLabelNom = (id) => (refLabel(id) || { label: id || '—' }).label;
// espèces dosées dans le vin (teneur résiduelle ou cumulée)
const REG_ESPECES = { sorbique: 'acide sorbique', cuivre: 'cuivre', metatartrique: 'acide métatartrique', cmc: 'carboxyméthylcellulose', polyaspartate: 'polyaspartate de potassium', ascorbique: 'acide ascorbique', citrique: 'acide citrique ajouté', fumarique: 'acide fumarique', argent: 'argent' };
// composés actifs : [id, libellé, mots (catCle du nom et de la composition), familles du catalogue, espèce dosée, facteur (g d'espèce par g de composé)]
const REG_COMPOSES = [
  ['so2', 'Anhydride sulfureux (SO₂, sulfites)', /\b(sulfit|bisulfite|metabisulfite|anhydride sulfureux|so2|solution sulfureuse|efferbaktol|oenosteryl|meche|soufre)/, ['sulfitage', 'méchage']],
  ['bisulfite-ammonium', 'Bisulfite d’ammonium', /\bbisulfite (d )?ammonium|\bbisulfite nh4/],
  ['levures', 'Levures sélectionnées', /\b(levure(?!s? inactiv)|saccharomyces|bayanus|zymaflore)/, ['levure']],
  ['levures-inactivees', 'Levures inactivées, autolysats, écorces de levures', /\b(levures? inactiv|ecorces? de levure|autolysat|derives? de levure|parois de levure)/, ['produit de levure']],
  ['mannoproteines', 'Mannoprotéines de levures', /\bmannoprot/],
  ['dap', 'Phosphate diammonique, sulfate d’ammonium', /\b(phosphate (di)?ammonique|phosphate diammonique|sulfate d ammonium|dap)\b/],
  ['thiamine', 'Thiamine (vitamine B1)', /\bthiamine/],
  ['enzymes', 'Enzymes (pectolytiques, glucanases…)', /\b(enzym|pectinase|pectolyt|glucanase)/, ['enzyme']],
  ['bacteries', 'Bactéries lactiques', /\b(bacteri|oenococcus|malolact)/, ['bactérie']],
  ['bentonite', 'Bentonite', /\bbentonite/, ['bentonite']],
  ['gelatine', 'Gélatine', /\bgelatine/],
  ['colle-poisson', 'Colle de poisson (ichtyocolle)', /\b(ichtyocolle|colle de poisson)/],
  ['caseine', 'Caséine, caséinate de potassium', /\bcasein/],
  ['albumine', 'Albumine d’œuf', /\b(albumin|ovalbumin|blanc d oeuf)/],
  ['proteines-vegetales', 'Protéines végétales (pois, pomme de terre, blé)', /\bproteines? (vegetales?|de pois|de pomme de terre|de ble)\b/],
  ['silice', 'Dioxyde de silicium (gel, solution colloïdale)', /\b(silice|dioxyde de silicium|kieselsol)/],
  ['pvpp', 'PVPP', /\b(pvpp|polyvinylpolypyrrolidone)/, ['pvpp']],
  ['charbon', 'Charbon œnologique', /\bcharbon/, ['charbon']],
  ['tanins', 'Tanins œnologiques', /\b(tanin|tannin)/, ['tanin']],
  ['chitosane', 'Chitosane (Aspergillus niger)', /\bchitosan/],
  ['copeaux', 'Morceaux de bois de chêne (copeaux, douelles)', /\b(copeau|chips|douelle|stave|morceaux de bois)/, ['bois']],
  ['acide-ascorbique', 'Acide L-ascorbique', /\bascorbique/, [], 'ascorbique'],
  ['acide-citrique', 'Acide citrique', /\bacide citrique/, [], 'citrique'],
  ['acide-tartrique', 'Acide L(+) tartrique (acidification)', /\bacide (l )?tartrique/],
  ['acide-malique', 'Acide malique', /\bacide (dl |l )?malique/],
  ['acide-lactique', 'Acide lactique', /\bacide lactique/],
  ['desacidifiants', 'Désacidifiants (bicarbonate de potassium, carbonate de calcium)', /\b(bicarbonate de potassium|carbonate de calcium|tartrate neutre de potassium|desacid)/, ['désacidifiant']],
  ['acide-metatartrique', 'Acide métatartrique', /\bmetatartrique/, [], 'metatartrique'],
  ['gomme-arabique', 'Gomme arabique', /\b(gomme arabique|gomme|arabique)/, ['gomme arabique'], 'gomme'],
  ['cmc', 'Carboxyméthylcellulose (CMC)', /\b(cmc|carboxymethylcellulose|carboxymethyl cellulose)\b/, [], 'cmc'],
  ['polyaspartate', 'Polyaspartate de potassium', /\b(polyaspartate|kpa)\b/, [], 'polyaspartate'],
  ['sorbate', 'Sorbate de potassium', /\bsorbate/, [], 'sorbique', 0.7464], // C6H7KO2 (150,22) → C6H8O2 (112,13)
  ['acide-sorbique', 'Acide sorbique', /\bacide sorbique/, [], 'sorbique'],
  ['lysozyme', 'Lysozyme', /\blysozym/],
  ['dmdc', 'Dicarbonate de diméthyle (DMDC)', /\b(dicarbonate|dmdc|velcorin)/],
  ['sulfate-cuivre', 'Sulfate de cuivre', /\bsulfate de cuivre/, [], 'cuivre', 0.2545], // CuSO₄·5H₂O (249,69) → Cu (63,55)
  ['citrate-cuivre', 'Citrate de cuivre', /\bcitrate de cuivre/, [], 'cuivre', 0.3528], // Cu₂C₆H₄O₇·2,5H₂O (360,2) → 2 Cu (127,1)
  ['acide-fumarique', 'Acide fumarique', /\bfumari/, [], 'fumarique'],
  ['ferrocyanure', 'Ferrocyanure de potassium', /\bferrocyanure/],
  ['phytate', 'Phytate de calcium', /\bphytate/],
  ['chlorure-argent', 'Chlorure d’argent', /\bchlorure d argent/, [], 'argent', 0.7527], // AgCl (143,32) → Ag (107,87)
  ['sucre', 'Saccharose, moût concentré (rectifié) : enrichissement, liqueurs', /\b(sucre|saccharose|mcr|mout concentre)/, ['sucre / MCR']],
].map(([id, label, re, familles, espece, facteur]) => ({ id, label, re, familles: familles || [], espece: espece === 'gomme' ? null : espece || null, facteur: facteur || 1 }));
const refCompose = (id) => REG_COMPOSES.find((c) => c.id === id) || null;
// règles : composé|référentiel|statut|dose max (g/hL de composé)|teneur max (mg/L de l'espèce)|condition|texte
const REG_REGLES_TXT = `so2|ue|oui|||Teneur maximale en SO₂ total selon le type de vin (plafonds ci-dessous)|ue
bisulfite-ammonium|ue|condition|||Moûts et vins en fermentation|ue
levures|ue|oui||||ue
levures-inactivees|ue|oui||||ue
mannoproteines|ue|oui||||ue
dap|ue|condition|100||1 g/L exprimé en sel (phosphate diammonique et sulfate d’ammonium ensemble)|ue
thiamine|ue|condition|0.06||0,6 mg/L exprimée en thiamine|ue
enzymes|ue|oui||||ue
bacteries|ue|oui||||ue
bentonite|ue|oui||||ue
gelatine|ue|oui|||Allergène non concerné ; étiquetage selon l’usage|ue
colle-poisson|ue|oui||||ue
caseine|ue|oui|||Allergène (lait) : étiquetage si résidu|ue
albumine|ue|oui|||Allergène (œuf) : étiquetage si résidu|ue
proteines-vegetales|ue|oui||||ue
silice|ue|oui||||ue
pvpp|ue|oui|80|||ue
tanins|ue|oui||||ue
charbon|ue|condition|100||Moûts, vins nouveaux encore en fermentation, MCR et vins blancs (100 g de produit sec par hL)|ue
chitosane|ue|condition|100||Chitosane d’Aspergillus niger ; dose selon l’usage (clarification, contaminants, micro-organismes)|ue
copeaux|ue|oui|||Bois de chêne ; dimensions et traitement encadrés|ue
acide-ascorbique|ue|oui|25|300|250 mg/L par traitement ; 300 mg/L dans le vin mis sur le marché|ue
acide-citrique|ue|oui||1000|1 g/L au plus dans le vin traité (ajouts comptés, acide citrique naturel non compté)|ue
acide-tartrique|ue|condition|||Acidification : limites et zones viticoles (Champagne : zone B)|ue_zones
acide-malique|ue|condition|||Acidification : limites et zones viticoles|ue_zones
acide-lactique|ue|condition|||Acidification : limites et zones viticoles|ue_zones
desacidifiants|ue|condition|||Désacidification : limites et zones viticoles|ue_zones
acide-metatartrique|ue|oui|10|100|100 mg/L au plus|ue
gomme-arabique|ue|oui||||ue
cmc|ue|condition|10|100|Vins blancs, rosés et mousseux ; 100 mg/L au plus|ue
polyaspartate|ue|oui|10|100|100 mg/L au plus|ue
sorbate|ue|oui||200|200 mg/L exprimés en acide sorbique dans le vin mis sur le marché|ue
acide-sorbique|ue|oui||200|200 mg/L dans le vin mis sur le marché|ue
lysozyme|ue|oui|50||500 mg/L au total (moût et vin)|ue
dmdc|ue|condition|20||200 mg/L ; vins de plus de 5 g/L de sucres ; non décelable à la mise sur le marché|ue
sulfate-cuivre|ue|oui|1|1|1 g/hL ; cuivre du vin traité ≤ 1 mg/L (2 mg/L pour les vins de liqueur)|ue
citrate-cuivre|ue|oui|1|1|1 g/hL ; cuivre du vin traité ≤ 1 mg/L (2 mg/L pour les vins de liqueur)|ue
acide-fumarique|ue|condition|60|600|Inhibition de la fermentation malolactique ; 600 mg/L au plus|ue
ferrocyanure|ue|condition|||Sous la responsabilité d’un œnologue ; aucun résidu dans le vin|ue
phytate|ue|condition|8||Vins rouges seulement|ue
chlorure-argent|ue|condition|1|0.1|Argent résiduel < 0,1 mg/L|ue
sucre|ue|condition|||Enrichissement dans les limites de la zone (Champagne : zone B) ; liqueurs de tirage et d’expédition|ue_zones
copeaux|aoc-champagne|non|||Morceaux de bois de chêne non autorisés pour l’appellation (à vérifier dans le cahier des charges en vigueur)|champagne
sucre|aoc-champagne|condition|||Enrichissement des vins de base et liqueurs selon le cahier des charges|champagne
acide-tartrique|aoc-champagne|condition|||Acidification selon les décisions de la campagne et le cahier des charges|champagne
so2|bio-ue|condition|||Anhydride sulfureux, bisulfite et métabisulfite de potassium seulement ; plafonds de SO₂ total réduits (ci-dessous)|bio
bisulfite-ammonium|bio-ue|non|||Seuls l’anhydride sulfureux, le bisulfite et le métabisulfite de potassium|bio
levures|bio-ue|condition|||Biologiques si disponibles|bio
levures-inactivees|bio-ue|condition|||Biologiques si disponibles|bio
mannoproteines|bio-ue|oui||||bio
dap|bio-ue|oui||||bio
thiamine|bio-ue|oui||||bio
enzymes|bio-ue|condition|||Enzymes pectolytiques, pour la clarification seulement|bio
bacteries|bio-ue|oui||||bio
bentonite|bio-ue|oui||||bio
gelatine|bio-ue|oui||||bio
colle-poisson|bio-ue|oui||||bio
caseine|bio-ue|oui||||bio
albumine|bio-ue|condition|||Biologique si disponible|bio
proteines-vegetales|bio-ue|condition|||Biologiques si disponibles|bio
silice|bio-ue|oui||||bio
pvpp|bio-ue|non||||bio
charbon|bio-ue|oui||||bio
tanins|bio-ue|oui||||bio
copeaux|bio-ue|oui||||bio
acide-ascorbique|bio-ue|oui||||bio
acide-citrique|bio-ue|oui||||bio
acide-tartrique|bio-ue|oui||||bio
acide-malique|bio-ue|non||||bio
acide-lactique|bio-ue|oui||||bio
desacidifiants|bio-ue|oui||||bio
acide-metatartrique|bio-ue|oui||||bio
gomme-arabique|bio-ue|condition|||Biologique si disponible|bio
cmc|bio-ue|non||||bio
polyaspartate|bio-ue|non||||bio
sorbate|bio-ue|non||||bio
acide-sorbique|bio-ue|non||||bio
lysozyme|bio-ue|non||||bio
dmdc|bio-ue|non||||bio
sulfate-cuivre|bio-ue|non||||bio
citrate-cuivre|bio-ue|oui||||bio
acide-fumarique|bio-ue|non||||bio
ferrocyanure|bio-ue|non||||bio
phytate|bio-ue|non||||bio
chlorure-argent|bio-ue|non||||bio
sucre|bio-ue|condition|||Saccharose, moût concentré et MCR d’origine biologique|bio
levures|demeter|condition|||Fermentation par les levures indigènes ; levures exogènes certifiées bio et sans OGM seulement en cas d’arrêt de fermentation (prise de mousse : à vérifier)|demeter
levures-inactivees|demeter|condition|||Écorces de levures bio en cas d’arrêt de fermentation ; autolysats ou levures inactivées si carence avérée (< 100 mg/L d’azote assimilable)|demeter
dap|demeter|non|||À confirmer dans le cahier des charges complet|demeter
thiamine|demeter|non|||À confirmer dans le cahier des charges complet|demeter
enzymes|demeter|non|||À confirmer dans le cahier des charges complet|demeter
sucre|demeter|condition|||Chaptalisation : +0,9 % vol au plus ; sucre d’origine bio ou Demeter|demeter
so2|avn|condition|||Sulfites en doses minimes seulement (voir les plafonds de SO₂ total)|avn
so2|sains|non|||Aucun sulfite ajouté|sains`;
const REG_REGLES = REG_REGLES_TXT.split('\n').map((l) => { const [compose, label, statut, d, t, condition, texte] = l.split('|'); return { compose, label, statut, doseMax: d ? Number(d) : null, teneurMax: t ? Number(t) : null, condition: condition || '', source: REG_TEXTES[texte] || '' }; });
// plafonds de SO₂ total (mg/L) : référentiel|vin|valeur|précision|texte
const REG_SO2_TXT = `ue|rouge|150|sucres < 5 g/L (200 au-delà)|ue
ue|blanc_rose|200|sucres < 5 g/L (250 au-delà)|ue
ue|effervescent|185|vins mousseux de qualité (235 pour les autres vins mousseux)|ue
bio-ue|rouge|100|sucres < 2 g/L (plafond de l’UE réduit de 30 mg/L au-delà)|bio
bio-ue|blanc_rose|150|sucres < 2 g/L (plafond de l’UE réduit de 30 mg/L au-delà)|bio
bio-ue|effervescent|155|vins mousseux de qualité (205 pour les autres vins mousseux)|bio
demeter|rouge|70|sucres < 5 g/L ; dose dérogatoire 100|demeter
demeter|blanc_rose|90|sucres < 5 g/L ; dose dérogatoire 120|demeter
demeter|effervescent|70|sucres < 10 g/L (résumé 2024) ou < 12 g/L (fiche 2026) ; 100 au-delà ; dose dérogatoire 100|demeter
biodyvin|rouge|80|sucres ≤ 5 g/L ; 110 après un élevage de plus de 9 mois|biodyvin
nature-progres|rouge|70|vins rouges|np
avn|rouge|30|vins rouges secs|avn
avn|blanc_rose|40|autres vins|avn
avn|effervescent|40|autres vins|avn`;
const REG_SO2 = REG_SO2_TXT.split('\n').map((l) => { const [label, vin, v, note, texte] = l.split('|'); return { label, vin, valeur: Number(v), note, source: REG_TEXTES[texte] || '' }; });
const REG_STATUTS = { oui: 'autorisé', non: 'interdit', condition: 'sous condition' };
const REG_POIDS = { oui: 0, condition: 1, non: 2 };

/* ---------- réglage, revendications de l'exploitation, labels d'un lot ---------- */
function refReglage(db) { const r = db && db.settings && db.settings.referentiel && typeof db.settings.referentiel === 'object' ? db.settings.referentiel : {}; return { actif: r.actif !== false, exceptions: r.exceptions && typeof r.exceptions === 'object' ? r.exceptions : {} }; }
const refActif = (db) => refReglage(db).actif;
// référentiels d'une revendication de l'exploitation : choisis (lists.qualifs[].referentiels), sinon devinés d'après l'identifiant et le nom
function refDeviner(q) {
  if (!q) return []; const s = catCle(`${q.id || ''} ${q.label || q.code || ''} ${q.court || ''}`);
  if (/\bsains\b/.test(s)) return ['sains']; if (/\bavn\b|vins? naturels?|methode nature/.test(s)) return ['avn']; if (/biodyvin/.test(s)) return ['biodyvin'];
  if (/demeter|\bdem\b/.test(s)) return ['demeter']; if (/nature (et |and )?progres|\bn p\b/.test(s)) return ['nature-progres']; if (/terra ?vitis/.test(s)) return ['terra-vitis'];
  if (/\bbio\b|biolog|organic|\bab\b|fr bio/.test(s)) return ['bio-ue']; return [];
}
function qualifReferentiels(db, qid) {
  const q = (qualifList(db) || []).find((x) => x.id === qid); if (!q) return [];
  if (Array.isArray(q.referentiels)) return q.referentiels.filter((x) => refLabel(x) && refLabel(x).type === 'label');
  return refDeviner(q);
}
function qualifReferentielsSet(db, qid, ids) {
  const q = (db.lists.qualifs || []).find((x) => x && x.id === qid); if (!q) return fail('Revendication introuvable.');
  q.referentiels = uniq((ids || []).filter((x) => refLabel(x) && refLabel(x).type === 'label')); return okr();
}
// appellation : référentiel de l'appellation du vignoble choisi dans le profil régional (Champagne par défaut, comme le reste de l'application)
function refAppellation(db) {
  const pv = (db && db.settings && db.settings.profilViticole) || {}; const reg = pv.region || (regionDe(db) === 'champagne' ? 'champagne' : '');
  const l = REG_LABELS.find((x) => x.type === 'appellation' && (x.regions || []).includes(reg)); return l ? l.id : null;
}
// chaîne d'héritage : le label, puis ceux dont il reprend les règles
function refChaine(ids) { const out = []; const add = (id) => { const l = refLabel(id); if (!l || out.includes(id)) return; out.push(id); (l.herite || []).forEach(add); }; (ids || []).forEach(add); return out; }
const refLotDe = (db, R, lotId) => (R && R.lots && R.lots[lotId]) || (db.lots || []).find((x) => x.id === lotId) || (db.lotsFinis || []).find((x) => x.id === lotId) || null;
// référentiels d'un lot : UE, appellation, ceux de sa revendication, labels visés (lots[].labelsVises) — avec leur origine
function refLabelsPour(db, qualifId, vises) {
  const base = ['ue']; const ap = refAppellation(db); if (ap) base.push(ap);
  const rev = qualifId ? qualifReferentiels(db, qualifId) : []; const vis = (Array.isArray(vises) ? vises : []).filter((x) => refLabel(x));
  const ids = refChaine([...vis, ...rev, ...base]);
  return ids.map((id) => ({ id, origine: vis.includes(id) ? 'vise' : rev.includes(id) ? 'revendication' : id === ap ? 'appellation' : id === 'ue' ? 'base' : 'herite' }));
}
function refLabelsLot(db, R, lotId) { const l = refLotDe(db, R, lotId); return l ? refLabelsPour(db, l.qualif, l.labelsVises) : []; }
function lotLabelsVises(db, lotId, ids) {
  const l = (db.lots || []).find((x) => x.id === lotId) || (db.lotsFinis || []).find((x) => x.id === lotId); if (!l) return fail('Lot introuvable.');
  const L = uniq((ids || []).filter((x) => refLabel(x) && refLabel(x).type === 'label')); if (L.length) l.labelsVises = L; else delete l.labelsVises; return okr();
}

/* ---------- composés d'un produit ---------- */
const REF_CACHE = new WeakMap();
function refComposesDe(p) {
  if (!p || p.categorie === 'sec') return [];
  if (Array.isArray(p.composes)) return p.composes.filter((x) => x && refCompose(x.id)).map((x) => ({ id: x.id, part: num(x.part) > 0 ? Math.min(1, num(x.part)) : 1, choisi: true, supposee: !(num(x.part) > 0) }));
  const sig = `${p.nom}|${p.famille}|${p.composition}`; const c = REF_CACHE.get(p); if (c && c.sig === sig) return c.val;
  const t = ` ${catCle(`${p.nom || ''} ${p.composition || ''}`)} `; const pc = /(\d+(?:[.,]\d+)?)\s*%/.exec(String(p.nom || '')); const part = pc && num(pc[1]) > 0 && num(pc[1]) < 100 ? num(pc[1]) / 100 : null;
  let val = REG_COMPOSES.filter((k) => k.re.test(t) || (p.famille && k.familles.includes(p.famille))).map((k) => ({ id: k.id, part: part || 1, supposee: !part, devine: true }));
  if (val.some((x) => x.id === 'bisulfite-ammonium')) val = val.filter((x) => x.id !== 'dap'); // « bisulfite d'ammonium » n'est pas un sel nutritif
  if (val.some((x) => x.id === 'levures-inactivees')) val = val.filter((x) => x.id !== 'levures');
  if (val.some((x) => x.id === 'acide-sorbique')) val = val.filter((x) => x.id !== 'sorbate');
  if (val.some((x) => x.id === 'citrate-cuivre')) val = val.filter((x) => x.id !== 'acide-citrique');
  if (val.some((x) => x.id === 'gomme-arabique') && val.length > 1 && !/gomme/.test(t)) val = val.filter((x) => x.id !== 'gomme-arabique');
  REF_CACHE.set(p, { sig, val }); return val;
}

/* ---------- règle d'un composé pour un référentiel, combinée sur plusieurs référentiels ---------- */
function refRegle(db, labelId, composeId) {
  const ex = refReglage(db).exceptions[`${labelId}|${composeId}`];
  const r = REG_REGLES.find((x) => x.label === labelId && x.compose === composeId);
  if (ex && REG_STATUTS[ex.statut]) return { compose: composeId, label: labelId, statut: ex.statut, doseMax: hasNum(ex.doseMax) ? num(ex.doseMax) : null, teneurMax: hasNum(ex.teneurMax) ? num(ex.teneurMax) : null, condition: String(ex.condition || (r && r.condition) || ''), source: `Correction de l’exploitation${ex.le ? ` (${ex.le})` : ''}`, exception: true, aVerifier: false, par: ex.par || '', le: ex.le || '' };
  if (r) return { ...r, exemple: true, aVerifier: true };
  const l = refLabel(labelId); if (l && l.defaut === 'non') return { compose: composeId, label: labelId, statut: 'non', doseMax: null, teneurMax: null, condition: 'Aucun intrant hors de ceux que le label accepte', source: REG_TEXTES[l.texte] || '', defaut: true, exemple: true, aVerifier: true };
  return null;
}
// combinaison sur une liste de référentiels : la plus restrictive l'emporte (statut, dose, teneur), avec ses origines
function refCombiner(db, labelIds, composeId) {
  const R0 = labelIds.map((id) => refRegle(db, id, composeId)).filter(Boolean); if (!R0.length) return null;
  const pire = R0.reduce((m, r) => (REG_POIDS[r.statut] > REG_POIDS[m.statut] ? r : m), R0[0]);
  const dm = R0.filter((r) => r.doseMax != null).sort((a, b) => a.doseMax - b.doseMax)[0] || null; const tm = R0.filter((r) => r.teneurMax != null).sort((a, b) => a.teneurMax - b.teneurMax)[0] || null;
  return { compose: composeId, statut: pire.statut, statutPar: pire.label, doseMax: dm ? dm.doseMax : null, dosePar: dm ? dm.label : null, teneurMax: tm ? tm.teneurMax : null, teneurPar: tm ? tm.label : null,
    conditions: R0.filter((r) => r.statut === 'condition' && r.condition).map((r) => ({ label: r.label, texte: r.condition })), regles: R0, aVerifier: R0.some((r) => r.aVerifier) };
}
// produit sans composé reconnu : seuls les labels « aucun intrant » le refusent
const REF_SANS_COMPOSE = '(produit sans composé reconnu)';
// avis du référentiel sur un produit, pour une revendication (et des labels visés) : interdit, dose maximale du produit (unité du produit)
function refRegleProduit(db, p, qualifId, vises) {
  if (!refActif(db) || !p || p.categorie === 'sec') return null;
  const labels = refLabelsPour(db, qualifId, vises).map((x) => x.id); const comps = refComposesDe(p); const avis = [];
  comps.forEach((c) => { const r = refCombiner(db, labels, c.id); if (r) avis.push({ ...r, part: c.part, supposee: c.supposee }); });
  if (!comps.length) { const nl = labels.filter((id) => (refLabel(id) || {}).defaut === 'non'); if (nl.length) avis.push({ compose: null, statut: 'non', statutPar: nl[0], doseMax: null, teneurMax: null, conditions: [], regles: [], aVerifier: true, sansCompose: true }); }
  if (!avis.length) return null;
  const interdit = avis.find((a) => a.statut === 'non') || null; let doseMax = null; let dosePar = null; let doseCompose = null;
  const du = doseUnit(p.unite);
  if (du) avis.forEach((a) => { if (a.doseMax == null) return; const d = a.doseMax / (a.part || 1); if (doseMax == null || d < doseMax) { doseMax = Math.round(d * 1e6) / 1e6; dosePar = a.dosePar; doseCompose = a.compose; } });
  return { labels, avis, interdit: !!interdit, interditPar: interdit ? interdit.statutPar : null, interditCompose: interdit ? interdit.compose : null, doseMax, dosePar, doseCompose, conditions: avis.flatMap((a) => a.conditions.map((x) => ({ ...x, compose: a.compose }))), aVerifier: avis.some((a) => a.aVerifier) };
}

/* ---------- teneurs dans le vin : espèces apportées par les intrants cumulés d'un lot ---------- */
// conc : { produitId: dose cumulée (g/hL ou mL/hL de produit) } → { espèce: mg/L }
function refTeneursDe(db, conc) {
  const out = {}; const prods = Object.fromEntries((db.produits || []).map((p) => [p.id, p]));
  Object.keys(conc || {}).forEach((pid) => { if (pid[0] === '@') return; const p = prods[pid]; if (!p || !doseUnit(p.unite)) return; const d = num(conc[pid]); if (!(d > 0)) return;
    refComposesDe(p).forEach((c) => { const k = refCompose(c.id); if (!k || !k.espece) return; const o = (out[k.espece] = out[k.espece] || { espece: k.espece, mgL: 0, produits: [], supposee: false }); const v = d * c.part * k.facteur * 10; o.mgL += v; o.produits.push({ produitId: pid, compose: c.id, mgL: v }); if (c.supposee) o.supposee = true; }); });
  return out;
}
// plafond de teneur d'une espèce pour des référentiels : le plus bas des composés de cette espèce
function refTeneurMax(db, labels, espece) {
  let best = null; REG_COMPOSES.filter((k) => k.espece === espece).forEach((k) => { const r = refCombiner(db, labels, k.id); if (r && r.teneurMax != null && (!best || r.teneurMax < best.max)) best = { max: r.teneurMax, label: r.teneurPar, compose: k.id, aVerifier: r.aVerifier }; });
  return best;
}
function refTeneursLot(db, R, lotId, conc) {
  const labels = refLabelsLot(db, R, lotId).map((x) => x.id); const T = refTeneursDe(db, conc || ((R.conc || {})[lotId] || {}));
  return Object.values(T).map((t) => { const m = refTeneurMax(db, labels, t.espece); return { ...t, libelle: REG_ESPECES[t.espece] || t.espece, max: m ? m.max : null, maxPar: m ? m.label : null, aVerifier: !!(m && m.aVerifier), depasse: !!(m && t.mgL > m.max + 1e-9) }; })
    .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
}

/* ---------- SO₂ total : plafonds du référentiel pour un lot ---------- */
function refSo2(db, labelId, vin) {
  const ex = refReglage(db).exceptions[`${labelId}|so2t|${vin}`]; if (ex && num(ex.valeur) > 0) return { label: labelId, vin, valeur: num(ex.valeur), note: String(ex.note || ''), source: 'Correction de l’exploitation', exception: true, aVerifier: false };
  const r = REG_SO2.find((x) => x.label === labelId && x.vin === vin); return r ? { ...r, exemple: true, aVerifier: true } : null;
}
// candidats du référentiel : un plafond vérifié de l'exploitation pour la revendication (même type de vin) remplace celui de ses labels
function refSo2Plafonds(db, R, lotId, typeVin, verifieExploitation) {
  if (!refActif(db)) return []; const l = refLotDe(db, R, lotId); if (!l) return [];
  return refLabelsLot(db, R, lotId).filter((x) => !verifieExploitation || x.origine === 'vise').map((x) => refSo2(db, x.id, typeVin)).filter(Boolean)
    .map((r) => ({ id: `ref-${r.label}-${r.vin}`, qualifId: l.qualif, objet: 'so2t', vin: r.vin, valeur: r.valeur, unite: 'mg/L', note: r.note, source: r.source, exemple: !!r.exemple, aVerifier: r.aVerifier, referentiel: r.label }));
}

/* ---------- conformité d'un lot (alerte a posteriori) : intrants non conformes, doses, teneurs, SO₂ total ---------- */
function lotConformite(db, R, lotId) {
  if (!refLotDe(db, R, lotId)) return [];
  const just = (pid) => Object.values(R.depass || {}).some((L) => L.some((x) => x.lotId === lotId && x.justifie && (!pid || x.produitId === pid)));
  const out = [];
  lotIntrantsCumul(db, R, lotId).forEach((x) => {
    if (x.interdit) out.push({ type: 'interdit', produitId: x.produitId, p: x.p, label: x.regle && x.regle.refInterditPar, compose: x.regle && x.regle.refInterditCompose, justifie: just(x.produitId), aVerifier: x.aVerifier });
    else if (x.depasse) out.push({ type: 'cumul', produitId: x.produitId, p: x.p, valeur: x.dose, max: x.max, unite: x.unite, label: x.regle && x.regle.refDosePar, justifie: just(x.produitId), aVerifier: x.aVerifier });
  });
  if (refActif(db)) refTeneursLot(db, R, lotId).filter((t) => t.depasse).forEach((t) => out.push({ type: 'teneur', espece: t.espece, libelle: t.libelle, valeur: t.mgL, max: t.max, unite: 'mg/L', label: t.maxPar, produits: t.produits, justifie: t.produits.some((x) => just(x.produitId)), aVerifier: t.aVerifier, supposee: t.supposee }));
  const e = so2TotalEstime(db, R, lotId); if (e.depasse && e.plafond) out.push({ type: 'so2t', valeur: e.estime, max: e.plafond.valeur, unite: 'mg/L', label: e.plafond.referentiel || null, qualif: e.plafond.qualifId, justifie: just(null), aVerifier: !!e.plafond.aVerifier });
  return out;
}
// lots en alerte (registre de traçabilité, cuverie) : lots du rejeu ayant au moins une alerte non justifiée (ou toutes avec tous)
function lotsNonConformes(db, R, tous) {
  return Object.keys(R.lots || {}).map((id) => ({ lotId: id, alertes: lotConformite(db, R, id) })).filter((x) => x.alertes.length && (tous || x.alertes.some((a) => !a.justifie)));
}
const refAlerteTexte = (db, a) => {
  const L = a.label ? refLabelNom(a.label) : ''; const nom = a.p ? a.p.nom : 'Intrant';
  if (a.type === 'interdit') return L ? `${nom} : non autorisé (${L})` : `${nom} : non autorisé`;
  if (a.type === 'cumul') { const v = `${fmt(a.valeur, 1)} ${a.unite}`; const m = fmt(a.max, 1); return L ? `${nom} : dose cumulée ${v} > ${m} (${L})` : `${nom} : dose cumulée ${v} > ${m}`; }
  if (a.type === 'teneur') { const m = fmt(a.max, a.max < 1 ? 2 : 0); return L ? `${a.libelle} : ${fmt(a.valeur, 1)} mg/L > ${m} mg/L (${L})` : `${a.libelle} : ${fmt(a.valeur, 1)} mg/L > ${m} mg/L`; }
  return L ? `SO₂ total estimé ${fmt(a.valeur, 0)} mg/L > ${fmt(a.max, 0)} mg/L (${L})` : `SO₂ total estimé ${fmt(a.valeur, 0)} mg/L > ${fmt(a.max, 0)} mg/L`;
};

/* ---------- synthèse commune aux deux sous-onglets « Produits & règles » et « Revendications & plafonds » ---------- */
// pour une revendication : chaque produit du catalogue de l'exploitation, sa règle, les règles de substance et l'avis du référentiel, la règle effective
function revendicationSynthese(db, qualifId) {
  return (db.produits || []).filter((p) => p.categorie !== 'sec').map((p) => {
    const base = ruleFor(db, p.id, qualifId); const eff = regleEffective(db, p, qualifId); const ref = refRegleProduit(db, p, qualifId);
    const conflit = !!(base && base.autorise && eff && !eff.autorise) || !!(base && base.autorise && hasNum(base.doseMax) && eff && eff.doseMax != null && num(base.doseMax) > eff.doseMax + 1e-9);
    const propose = ref ? (ref.interdit ? false : true) : null; // avis du référentiel pour la règle du produit
    return { id: p.id, p, base, eff, ref, conflit, ecartRef: !!(ref && base && propose !== !!base.autorise), composes: refComposesDe(p) };
  }).sort((a, b) => a.p.nom.localeCompare(b.p.nom, 'fr'));
}
// règle du produit alignée sur le référentiel (autorisation, dose maximale), marquée « à vérifier » avec sa source
function regleDepuisReferentiel(db, pid, qualifId, uid) {
  const p = (db.produits || []).find((x) => x.id === pid); if (!p) return fail('Produit introuvable.'); if (p.categorie === 'sec') return fail('Matière sèche : sans règle de revendication.');
  const ref = refRegleProduit(db, p, qualifId); if (!ref) return fail('Le référentiel ne se prononce pas sur ce produit (aucun composé reconnu).');
  const src = ref.interdit ? `Référentiel Œnotrack : interdit (${refLabelNom(ref.interditPar)})` : `Référentiel Œnotrack${ref.doseMax != null ? ` : dose max (${refLabelNom(ref.dosePar)})` : ''}`;
  return regleSet(db, pid, qualifId, { autorise: !ref.interdit, doseMax: ref.interdit ? null : ref.doseMax, aVerifier: true, source: src.slice(0, 200), referentiel: { le: todayISO(), par: uid || '' } });
}
function reglesDepuisReferentiel(db, qualifId, uid) {
  let n = 0; (db.produits || []).filter((p) => p.categorie !== 'sec' && p.actif !== false).forEach((p) => { const qs = qualifId ? [qualifId] : qualifList(db).map((q) => q.id); qs.forEach((q) => { const ref = refRegleProduit(db, p, q); if (!ref) return; const r = ruleFor(db, p.id, q); if (r && r.aVerifier === false && !!r.autorise === !ref.interdit && (ref.doseMax == null || (hasNum(r.doseMax) && num(r.doseMax) <= ref.doseMax))) return; if (regleDepuisReferentiel(db, p.id, q, uid).ok) n += 1; }); });
  return okr({ n });
}
// correction d'une valeur du référentiel par l'exploitation (gardée dans le réglage commun, tracée)
function refExceptionSet(db, cle, s, uid) {
  if (!/^[a-z0-9-]+\|[a-z0-9-]+(\|[a-z_]+)?$/.test(String(cle || ''))) return fail('Valeur du référentiel inconnue.');
  const [lab, comp, vin] = String(cle).split('|'); if (!refLabel(lab) || (comp !== 'so2t' && !refCompose(comp)) || (comp === 'so2t' && !VINS_TYPES.some((v) => v.id === vin))) return fail('Valeur du référentiel inconnue.');
  db.settings = db.settings || {}; const r = (db.settings.referentiel = db.settings.referentiel && typeof db.settings.referentiel === 'object' ? db.settings.referentiel : {}); r.exceptions = r.exceptions && typeof r.exceptions === 'object' ? r.exceptions : {};
  if (s == null) { delete r.exceptions[cle]; return okr(); }
  if (comp === 'so2t') { if (!(num(s.valeur) > 0)) return fail('Plafond de SO₂ total invalide (mg/L).'); r.exceptions[cle] = { valeur: num(s.valeur), note: String(s.note || '').slice(0, 200), par: uid || '', le: todayISO() }; return okr(); }
  if (!REG_STATUTS[s.statut]) return fail('Choisissez le statut (autorisé, interdit, sous condition).');
  const dm = hasNum(s.doseMax) ? num(s.doseMax) : null; const tm = hasNum(s.teneurMax) ? num(s.teneurMax) : null; if ((dm != null && dm < 0) || (tm != null && tm < 0)) return fail('Valeur invalide.');
  r.exceptions[cle] = { statut: s.statut, doseMax: s.statut === 'non' ? null : dm, teneurMax: s.statut === 'non' ? null : tm, condition: String(s.condition || '').slice(0, 240), par: uid || '', le: todayISO() }; return okr();
}
function refActiver(db, actif) { db.settings = db.settings || {}; const r = (db.settings.referentiel = db.settings.referentiel && typeof db.settings.referentiel === 'object' ? db.settings.referentiel : {}); r.actif = !!actif; return okr(); }
// composés d'un produit choisis à la main (fiche du produit)
function produitComposesSet(db, pid, L) {
  const p = (db.produits || []).find((x) => x.id === pid); if (!p) return fail('Produit introuvable.');
  if (L == null) { delete p.composes; return okr(); }
  p.composes = uniq((L || []).map((x) => x && x.id).filter((id) => refCompose(id))).map((id) => { const x = L.find((y) => y.id === id); const part = hasNum(x.part) ? num(x.part) : null; return part != null && part > 0 && part <= 1 ? { id, part } : { id }; });
  return okr();
}
// matrice du référentiel pour l'affichage : chaque composé × référentiel (règle propre, sinon héritée)
function refMatrice(db) {
  return REG_COMPOSES.map((k) => ({ compose: k, cellules: REG_LABELS.map((l) => { const propre = refRegle(db, l.id, k.id); const eff = refCombiner(db, refChaine([l.id]), k.id); return { label: l.id, propre, eff, herite: !propre && !!eff }; }) }));
}
