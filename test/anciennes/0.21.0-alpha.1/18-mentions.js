/* ============ INFORMATIONS LÉGALES (alpha V2.2) : mentions légales, confidentialité, CGU, code source & licence, réglementation ============
   Les mentions concernent le SITE où Œnotrack est mis en ligne (éditeur, hébergeur, contact) : chaque personne qui met en ligne
   sa copie les renseigne (Paramètres › ⚖ Mentions légales & licence) ; elles sont lues dans config.json (« mentions », déposé à côté
   d'index.html) ou, sur cet appareil seulement, dans le navigateur. Rien n'est enregistré dans la base.
   Le code d'Œnotrack est sous licence GNU AGPL v3 (ou ultérieure) ; le nom et le logo « Œnotrack » ne sont pas couverts par la licence. */
const LEGAL_DATE = '2026-11-19'; // dernière mise à jour des textes
const OENOTRACK_AUTEUR = ''; // titulaire des droits sur le code (à compléter) ; à défaut : « l'auteur d'Œnotrack »
const OENOTRACK_DEPOT = ''; // dépôt officiel du code source (GitHub), à compléter
const LEGAL_ONGLETS = [['mentions', 'Mentions légales', 'mentions-legales'], ['confidentialite', 'Confidentialité', 'confidentialite'], ['cgu', 'CGU', 'cgu'], ['licence', 'Code source & licence', 'licence'], ['reglementation', 'Réglementation', 'reglementation']];
const legalOngletDeHash = (h) => { const x = String(h || '').replace(/^#\/?/, '').toLowerCase(); const o = LEGAL_ONGLETS.find((t) => t[2] === x || t[0] === x); return o ? o[0] : ''; };
// hébergeurs courants (coordonnées relevées sur leurs propres mentions légales, novembre 2026)
const HEBERGEURS = [
  { id: 'ovh', court: 'OVHcloud', nom: 'OVH SAS (OVHcloud)', details: 'SAS au capital de 50 000 000 € · RCS Lille Métropole 424 761 419', adresse: '2 rue Kellermann, 59100 Roubaix, France', tel: '+33 9 72 10 10 07', web: 'https://www.ovhcloud.com', ue: true },
  { id: 'o2switch', court: 'o2switch', nom: 'o2switch', details: 'SARL au capital de 100 000 € · RCS Clermont-Ferrand', adresse: 'Chemin des Pardiaux, 63000 Clermont-Ferrand, France', tel: '+33 4 44 44 60 40', web: 'https://www.o2switch.fr', ue: true },
  { id: 'scaleway', court: 'Scaleway', nom: 'Scaleway SAS', details: 'SAS au capital de 214 410,50 € · RCS Paris 433 115 904', adresse: '8 rue de la Ville l’Évêque, 75008 Paris, France', tel: '', web: 'https://www.scaleway.com', ue: true },
  { id: 'netlify', court: 'Netlify', nom: 'Netlify, Inc.', details: '', adresse: '101 2nd Street, San Francisco, CA 94105, États-Unis', tel: '', web: 'https://www.netlify.com', ue: false },
  { id: 'github', court: 'GitHub Pages', nom: 'GitHub, Inc. (GitHub Pages)', details: '', adresse: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis', tel: '', web: 'https://pages.github.com', ue: false },
];
const MENTIONS_STATUTS = [['particulier', 'Particulier, à titre non professionnel'], ['pro', 'Professionnel (entreprise individuelle ou société)'], ['association', 'Association']];
const mentionsVides = () => ({ editeur: { statut: 'particulier', nom: '', email: '', adresse: '', tel: '', immatriculation: '', directeur: '' }, hebergeur: { id: '', nom: '', details: '', adresse: '', tel: '', web: '' }, site: '', depot: '', maj: '' });
const mailOk = (s) => /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i.test(String(s || '').trim());
// nettoyage : textes bornés, adresses web et e-mail vérifiées (une valeur invalide est ignorée)
function mentionsNettoyer(m0) {
  const m = m0 && typeof m0 === 'object' ? m0 : {}; const e = m.editeur && typeof m.editeur === 'object' ? m.editeur : {}; const h = m.hebergeur && typeof m.hebergeur === 'object' ? m.hebergeur : {};
  const t = (v, n) => (typeof v === 'string' || typeof v === 'number' ? String(v).replace(/\s+/g, ' ').trim().slice(0, n) : '');
  const statut = MENTIONS_STATUTS.some((s) => s[0] === e.statut) ? e.statut : '';
  return { editeur: { statut, nom: t(e.nom, 120), email: mailOk(e.email) ? t(e.email, 120) : '', adresse: t(e.adresse, 200), tel: t(e.tel, 40), immatriculation: t(e.immatriculation, 160), directeur: t(e.directeur, 120) },
    hebergeur: { id: HEBERGEURS.some((x) => x.id === h.id) ? h.id : h.id === 'autre' ? 'autre' : '', nom: t(h.nom, 120), details: t(h.details, 200), adresse: t(h.adresse, 200), tel: t(h.tel, 40), web: lienNorm(h.web) },
    site: lienNorm(m.site), depot: lienNorm(m.depot), maj: isoOK(m.maj) ? m.maj : '' };
}
// fusion : chaque source ne remplace que les champs qu'elle renseigne (la première l'emporte)
function mentionsFusion(...sources) {
  const out = mentionsVides(); const S = sources.map(mentionsNettoyer);
  const pick = (f) => { for (const s of S) { const v = f(s); if (v) return v; } return ''; };
  // l'éditeur et l'hébergeur viennent chacun d'une seule source (jamais le nom de l'un avec l'e-mail d'un autre)
  const se = S.find((s) => s.editeur.nom || s.editeur.email || s.editeur.adresse); if (se) out.editeur = { ...out.editeur, ...se.editeur, statut: se.editeur.statut || 'particulier' };
  const sh = S.find((s) => s.hebergeur.nom || s.hebergeur.id); if (sh) out.hebergeur = { ...out.hebergeur, ...sh.hebergeur };
  if (out.hebergeur.id && out.hebergeur.id !== 'autre' && !out.hebergeur.nom) { const H = HEBERGEURS.find((x) => x.id === out.hebergeur.id); if (H) out.hebergeur = { ...H }; }
  ['site', 'depot', 'maj'].forEach((k) => { out[k] = pick((s) => s[k]); });
  return out;
}
const mentionsHebergeur = (id) => { const H = HEBERGEURS.find((x) => x.id === id); return H ? { id: H.id, nom: H.nom, details: H.details, adresse: H.adresse, tel: H.tel, web: H.web } : { id: 'autre', nom: '', details: '', adresse: '', tel: '', web: '' }; };
const mentionsHorsUE = (m) => { const H = HEBERGEURS.find((x) => x.id === (m && m.hebergeur && m.hebergeur.id)); return H ? !H.ue : false; };
// ce qui manque pour des mentions légales complètes (loi pour la confiance dans l'économie numérique, art. 1-1)
function mentionsManquantes(m0) {
  const m = mentionsNettoyer(m0); const e = m.editeur; const L = [];
  if (!m.hebergeur.nom) L.push('nom de l’hébergeur'); if (!m.hebergeur.adresse) L.push('adresse de l’hébergeur');
  if (e.statut !== 'particulier') {
    if (!e.nom) L.push(e.statut === 'association' ? 'nom de l’association' : 'nom ou raison sociale de l’éditeur'); if (!e.adresse) L.push(e.statut === 'association' ? 'adresse du siège' : 'adresse de l’éditeur');
    if (e.statut === 'pro' && !e.tel) L.push('téléphone de l’éditeur'); if (e.statut === 'pro' && !m.hebergeur.tel) L.push('téléphone de l’hébergeur');
  }
  return L;
}
const mentionsConseils = (m0) => { const m = mentionsNettoyer(m0); const L = []; if (!m.editeur.email) L.push('une adresse e-mail de contact (demandes RGPD, signalements)'); if (!m.depot && !OENOTRACK_DEPOT) L.push('l’adresse du dépôt du code source'); return L; };
const legalAuteur = () => OENOTRACK_AUTEUR || 'l’auteur d’Œnotrack';
// composants d'autres auteurs utilisés par Œnotrack, et leur licence
const COMPOSANTS_TIERS = [
  { nom: 'React et React DOM 18.3', role: 'interface', auteur: 'Meta Platforms, Inc.', licence: 'MIT', web: 'https://react.dev' },
  { nom: 'Tailwind CSS 3.4', role: 'mise en forme', auteur: 'Tailwind Labs, Inc.', licence: 'MIT', web: 'https://tailwindcss.com' },
  { nom: 'SheetJS Community Edition (xlsx) 0.18', role: 'exports Excel', auteur: 'SheetJS LLC', licence: 'Apache 2.0', web: 'https://sheetjs.com' },
  { nom: 'PDF.js 6.2', role: 'lecture des PDF', auteur: 'Mozilla et contributeurs', licence: 'Apache 2.0', web: 'https://mozilla.github.io/pdf.js/' },
  { nom: 'pdf-lib 1.17', role: 'fabrication des PDF', auteur: 'Andrew Dillon et contributeurs', licence: 'MIT', web: 'https://pdf-lib.js.org' },
  { nom: 'Tesseract.js 5.1 et Tesseract OCR', role: 'lecture des scans et photos', auteur: 'Projet Naptha ; Google et contributeurs', licence: 'Apache 2.0', web: 'https://tesseract.projectnaptha.com' },
  { nom: 'Polices Barlow, Lato, Inter, Lora, Manrope, IBM Plex, DM Sans, Playfair Display, Source Sans 3, Space Grotesk…', role: 'typographie', auteur: 'leurs auteurs (diffusion Google Fonts)', licence: 'SIL Open Font License 1.1', web: 'https://fonts.google.com' },
];
// services tiers sollicités au chargement de la page (adresse IP et navigateur transmis) — à citer dans la politique de confidentialité
const SERVICES_CHARGEMENT = [
  { nom: 'Google Fonts', societe: 'Google', quoi: 'polices de caractères', quand: 'à l’ouverture' },
  { nom: 'cdnjs', societe: 'Cloudflare, Inc.', quoi: 'bibliothèques React et SheetJS', quand: 'à l’ouverture' },
  { nom: 'Tailwind CSS (CDN)', societe: 'Tailwind Labs, Inc.', quoi: 'mise en forme', quand: 'à l’ouverture' },
  { nom: 'jsDelivr', societe: 'jsDelivr (réseau de diffusion)', quoi: 'lecture des PDF, des scans et fabrication des PDF', quand: 'à la première utilisation de ces fonctions' },
];
