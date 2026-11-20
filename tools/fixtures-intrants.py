# Documents fournisseurs FICTIFS (FDS, fiches techniques) pour les tests de l'onglet Intrants › Fiches FT & FDS (0.20.0-alpha.1)
# → test/fixtures/intrants/*.pdf  (python3 tools/fixtures-intrants.py)
import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

OUT = os.path.join(os.path.dirname(__file__), '..', 'test', 'fixtures', 'intrants')
os.makedirs(OUT, exist_ok=True)
W, H = A4

def fds(nom_fichier, produit, fabricant, date, version, usage, h_codes, cas, extra=''):
    c = canvas.Canvas(os.path.join(OUT, nom_fichier), pagesize=A4)
    c.setTitle(f'FDS {produit} (document fictif)')
    y = H - 50
    def l(t, size=9.5, bold=False, dy=14):
        nonlocal y
        c.setFont('Helvetica-Bold' if bold else 'Helvetica', size); c.drawString(48, y, t); y -= dy
    l('FICHE DE DONNÉES DE SÉCURITÉ', 15, True, 20)
    l('conforme au règlement (CE) n° 1907/2006 (REACH), modifié par le règlement (UE) 2020/878', 8.5)
    l(f'Date de révision : {date}        Version : {version}', 9.5, False, 22)
    l('RUBRIQUE 1 : Identification de la substance/du mélange et de la société/l\'entreprise', 10, True)
    l('1.1 Identificateur de produit')
    l(f'Nom du produit : {produit}')
    l(f'1.2 Utilisations identifiées pertinentes : {usage}')
    l('1.3 Renseignements concernant le fournisseur de la fiche de données de sécurité')
    l(f'Fournisseur : {fabricant}, 1 rue de l\'Exemple, 51000 Exempleville')
    l('1.4 Numéro d\'appel d\'urgence : ORFILA (INRS) : 01 00 00 00 00', 9.5, False, 20)
    l('RUBRIQUE 2 : Identification des dangers', 10, True)
    l('2.2 Éléments d\'étiquetage')
    for h in h_codes: l(h)
    y -= 6
    l('RUBRIQUE 3 : Composition/informations sur les composants', 10, True)
    l(cas, 9.5, False, 20)
    l('RUBRIQUE 4 : Premiers secours', 10, True)
    l('En cas de contact avec les yeux : rincer abondamment à l\'eau.', 9.5, False, 20)
    l('RUBRIQUE 7 : Manipulation et stockage', 10, True)
    l('7.2 Conditions d\'un stockage sûr : conserver au sec, à l\'abri de la chaleur.', 9.5, False, 20)
    l('RUBRIQUE 8 : Contrôles de l\'exposition/protection individuelle', 10, True)
    l('Porter des gants et des lunettes de protection.', 9.5, False, 20)
    if extra: l(extra)
    l('RUBRIQUE 16 : Autres informations', 10, True)
    l('Document fictif établi pour les tests d\'Œnotrack — aucune valeur réglementaire.', 8.5)
    c.showPage(); c.save()

def ft(nom_fichier, titre, lignes):
    c = canvas.Canvas(os.path.join(OUT, nom_fichier), pagesize=A4)
    c.setTitle(f'FT {titre} (document fictif)')
    c.setFont('Helvetica', 9); c.drawString(48, H - 40, 'Démo Œnologie SAS — produits œnologiques')
    c.setFont('Helvetica-Bold', 11); c.drawString(48, H - 70, 'FICHE TECHNIQUE')
    c.setFont('Helvetica-Bold', 24); c.drawString(48, H - 105, titre)
    y = H - 140
    for t in lignes:
        c.setFont('Helvetica', 10); c.drawString(48, y, t); y -= 16
    c.setFont('Helvetica', 8); c.drawString(48, 40, 'Document fictif établi pour les tests d\'Œnotrack.')
    c.showPage(); c.save()

fds('FDS_metabisulfite_2021.pdf', 'MÉTABISULFITE DE POTASSIUM DÉMO', 'Démo Œnologie SAS', '10/05/2021', '1', 'produit œnologique, sulfitage des moûts et des vins',
    ['Mention d\'avertissement : Danger', 'H302 : Nocif en cas d\'ingestion.', 'H318 : Provoque de graves lésions des yeux.'], 'Disulfite de potassium   CAS 16731-55-8   > 95 %')
fds('FDS-METABISULFITE-2025.pdf', 'MÉTABISULFITE DE POTASSIUM DÉMO', 'Démo Œnologie SAS', '14/02/2025', '2', 'produit œnologique, sulfitage des moûts et des vins',
    ['Mention d\'avertissement : Danger', 'H302 : Nocif en cas d\'ingestion.', 'H318 : Provoque de graves lésions des yeux.', 'EUH031 : Au contact d\'un acide, dégage un gaz toxique.'], 'Disulfite de potassium   CAS 16731-55-8   > 95 %')
fds('fds_enzyme_pectolytique.pdf', 'PECTOZYM DÉMO', 'Démo Enzymes SARL', '03/03/2024', '1.2', 'préparation enzymatique pour la clarification des moûts',
    ['Mention d\'avertissement : Danger', 'H334 : Peut provoquer des symptômes allergiques ou d\'asthme par inhalation.'], 'Pectinase   CAS 9032-75-1   10 - 30 %')
fds('SDS_XR-200.pdf', 'CLARIFIANT XR-200', 'Démo Colles SAS', '20/06/2025', '4', 'collage des vins (usage professionnel)',
    ['Ce mélange n\'est pas classé dangereux.'], 'Protéine de pois hydrolysée   CAS 0000-00-0   > 90 %')
fds('FDS peracetique.pdf', 'ACIDE PERACÉTIQUE 5 %', 'Démo Hygiène Vinicole SAS', '07/09/2024', '3', 'désinfection des cuves et du matériel',
    ['Mention d\'avertissement : Danger', 'H242 : Peut s\'enflammer sous l\'effet de la chaleur.', 'H314 : Provoque de graves brûlures de la peau et de graves lésions des yeux.'], 'Acide peracétique   CAS 79-21-0   5 %')
ft('FT Bentonite sodique.pdf', 'BENTONITE SODIQUE DÉMO', [
    'Clarification et stabilisation protéique des moûts et des vins.', 'Composition : bentonite sodique activée, granulés.', 'Dosage : 20 à 80 g/hL selon les essais de stabilité.',
    'Conditionnement : sac de 25 kg. DLUO : 12/2028.', 'Mise à jour : 05/09/2023 — Version 2'])
print('ok', sorted(os.listdir(OUT)))
