#!/usr/bin/env python3
"""Référentiel des appellations viticoles → src/16oa-appellations-donnees.js (données compactes, dans le code, jamais dans la base).
Entrées (relevés hors dépôt, sources officielles) : fr.json (INAO, eAmbrosia, cahiers des charges), ue.json (eAmbrosia : Italie, Espagne,
Portugal, Allemagne, Autriche), hors_ue.json (OFAG, TTB / eCFR, Wine Australia). Usage : python3 tools/appellations-donnees.py <dossier des relevés>
Une ligne par appellation : nom, région (id de PROFIL_REGIONS), pays, signe, AOP|IGP, sous-région, catégories, couleurs, vérifiée, état, source."""
import json, sys, os
src = sys.argv[1]
CATS = {'tranquille': 't', 'effervescent': 'e', 'petillant': 'p', 'ancestrale': 'a', 'doux': 'd', 'vdn': 'v', 'sous_voile': 's'}
COUL = {'blanc': 'b', 'rose': 'o', 'rouge': 'r'}
ETAT = {'enregistree': '', 'enregistree_absente_inao': 'absente_inao', 'annulee_ue': 'annulee', 'demande_ue': 'demande'}
sources, lignes, releves = [], [], []
def s_idx(u):
    if not u: return -1
    if u not in sources: sources.append(u)
    return sources.index(u)
def ajouter(nom, region, pays, signe, eu, sous, cats, coul, verif, etat, srcs, libre=False):
    c = '*' if libre else ''.join(sorted({CATS[x] for x in cats if x in CATS}))
    k = ''.join(COUL[x] for x in ('blanc', 'rose', 'rouge') if x in coul)
    lignes.append([nom, region, pays, signe, eu, sous or '', c, k, 1 if verif else 0, etat, s_idx((srcs or [''])[0])])
fr = json.load(open(os.path.join(src, 'fr.json'))); releves.append(fr.get('releve', ''))
for x in fr['appellations']:
    ajouter(x['nom'], x['region'], 'france', x['signe'], 'AOP' if x['signe'] == 'AOP' else 'IGP', x.get('bassin', ''), x.get('categories', []), x.get('couleurs', []), x.get('verifie'), ETAT.get(x.get('etat', ''), x.get('etat', '')), x.get('sources'))
ue = json.load(open(os.path.join(src, 'ue.json'))); releves.append(ue.get('releve', ''))
for x in ue['appellations']:
    ajouter(x['nom'], x['pays'], x['pays'], x['signe'], 'AOP' if x.get('eu') == 'PDO' else 'IGP', x.get('sous_region', ''), x.get('categories', []), x.get('couleurs', []), x.get('verifie'), '', x.get('sources'))
hu = json.load(open(os.path.join(src, 'hors_ue.json'))); releves.append(hu.get('releve', ''))
for x in hu['appellations']:
    ajouter(x['nom'], x['pays'], x['pays'], x['signe'], 'IG', x.get('sous_region', ''), [], x.get('couleurs', []), x.get('verifie'), '', x.get('sources'), libre=True)
lignes.sort(key=lambda l: (l[1], l[0].lower()))
txt = '\n'.join('\t'.join(str(v) for v in l) for l in lignes)
out = os.path.join(os.path.dirname(__file__), '..', 'src', '16oa-appellations-donnees.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write('/* ============ RÉFÉRENTIEL DES APPELLATIONS VITICOLES — DONNÉES (0.46.0-alpha.2, généré par tools/appellations-donnees.py) ============\n')
    f.write('   Relevé du 27/11/2026 sur les sources officielles : France — INAO (liste des produits sous SIQO, data.gouv.fr), registre de l’UE\n')
    f.write('   eAmbrosia (documents uniques), cahiers des charges ; Italie, Espagne, Portugal, Allemagne, Autriche — eAmbrosia (statut « Registered »),\n')
    f.write('   MASAF, MAPA ; Suisse — répertoire OFAG des AOC (1er janvier 2026) ; États-Unis — TTB / eCFR 27 CFR part 9 ; Australie — registre\n')
    f.write('   Wine Australia. Une ligne : nom ⇥ région ⇥ pays ⇥ signe ⇥ AOP|IGP|IG ⇥ sous-région ⇥ catégories (t tranquille, e effervescent,\n')
    f.write('   p pétillant, a ancestrale, d doux, v vin doux naturel / de liqueur, s sous voile ; * non restreintes) ⇥ couleurs (b blanc, o rosé,\n')
    f.write('   r rouge ; vide = non précisées) ⇥ vérifiée (1 : catégories et couleurs lues dans une source officielle) ⇥ état ⇥ n° de source.\n')
    f.write('   Ne pas modifier à la main : relancer la collecte puis ce script. */\n')
    f.write('const APP_REF_SOURCES = ' + json.dumps(sources, ensure_ascii=False) + ';\n')
    f.write('const APP_REF_TXT = ' + json.dumps(txt, ensure_ascii=False) + ';\n')
print(len(lignes), 'appellations,', len(sources), 'sources →', out, os.path.getsize(out) // 1024, 'Ko')
