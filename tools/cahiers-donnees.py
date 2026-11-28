#!/usr/bin/env python3
"""Cahiers des charges des appellations françaises → src/16of-cahiers-donnees.js (données dans le code, jamais dans la base).
Entrées : relevés hors dépôt (un fichier JSON par groupe de régions, 28/11/2026), chaque appellation lue dans le cahier des charges homologué
EN VIGUEUR (Bulletin officiel du ministère de l'Agriculture, atteint depuis les fiches produits de l'INAO ; eAmbrosia en dernier recours) :
niveau 1 (nom officiel, statut, catégories, couleurs, dénominations et mentions) et niveau 2 (cépages, rendements, richesse en sucre, TAV,
enrichissement, sucres, élevage, mise en marché, pratiques imposées ou interdites, conditionnement).
Usage : python3 tools/cahiers-donnees.py <dossier des relevés>   (lit <dossier>/g*.json, sauf *-liste.json)
Les fiches techniques identiques (ex. les 51 Alsace grand cru) ne sont écrites qu'une fois (CDC_FICHES), les textes une fois (CDC_SOURCES)."""
import json, sys, os, glob
src = sys.argv[1]
CHAMPS_T = ['pour', 'couleur', 'categorie', 'cepages_principaux', 'cepages_accessoires', 'regles_cepages', 'rendement_hl_ha', 'rendement_butoir_hl_ha', 'rendement_kg_ha',
            'richesse_sucre_min_g_l', 'tav_naturel_min', 'tav_acquis_min', 'tav_total_max', 'enrichissement', 'sucres_residuels', 'elevage', 'mise_en_marche']
COURT = {'pour': 'p', 'couleur': 'c', 'categorie': 'k', 'cepages_principaux': 'cp', 'cepages_accessoires': 'ca', 'regles_cepages': 'rc', 'rendement_hl_ha': 'r', 'rendement_butoir_hl_ha': 'rb', 'rendement_kg_ha': 'rk',
         'richesse_sucre_min_g_l': 'su', 'tav_naturel_min': 'tn', 'tav_acquis_min': 'ta', 'tav_total_max': 'tt', 'enrichissement': 'en', 'sucres_residuels': 'sr', 'elevage': 'el', 'mise_en_marche': 'mm'}
def coupe(s, n):
    if s is None: return None
    s = str(s).strip(); return s if len(s) <= n else s[:n - 1].rstrip() + '…'
def nombre(v):
    try: return None if v in (None, '') else float(v)
    except (TypeError, ValueError): return None
sources, fiches, fidx, lignes, problemes, groupes = [], [], {}, [], [], []
def s_idx(u):
    if not u: return -1
    if u not in sources: sources.append(u)
    return sources.index(u)
for f in sorted(glob.glob(os.path.join(src, 'g*.json'))):
    if f.endswith('-liste.json'): continue
    d = json.load(open(f, encoding='utf-8')); groupes.append(d.get('groupe', os.path.basename(f))); problemes += [f"{d.get('groupe', '')} : {p}" for p in d.get('problemes', [])]
    for a in d.get('appellations', []):
        T = []
        for t in a.get('technique', []) or []:
            x = {}
            for k in CHAMPS_T:
                v = t.get(k)
                if k.startswith(('rendement', 'richesse', 'tav')): v = nombre(v)
                elif k.startswith('cepages'): v = [coupe(c, 80) for c in (v or []) if c] or None
                else: v = coupe(v, 400) if v not in (None, '') else None
                if v is not None and v != '': x[COURT[k]] = v
            T.append(x)
        P = a.get('pratiques') or {}
        p = {k: v for k, v in {'i': [coupe(x, 300) for x in (P.get('interdites') or []) if x], 'm': [coupe(x, 300) for x in (P.get('imposees') or []) if x], 'co': coupe(P.get('conditionnement'), 300) if P.get('conditionnement') else None, 'dp': nombre(P.get('densite_plantation_min'))}.items() if v}
        cle = json.dumps({'t': T, 'p': p}, ensure_ascii=False, sort_keys=True)
        if cle not in fidx: fidx[cle] = len(fiches); fiches.append({'t': T, 'p': p})
        den = [[coupe(x.get('nom'), 120), x.get('type') or 'dgc', x.get('categories') or '', x.get('couleurs') or ''] for x in (a.get('denominations') or []) if x.get('nom')]
        lignes.append([a.get('id') or '', a.get('nom_officiel') or a.get('nom_liste') or '', a.get('region') or '', a.get('signe') or '', a.get('statut') or '', a.get('categories') or '', a.get('couleurs') or '',
                       den, fidx[cle], s_idx(a.get('source')), coupe(a.get('version_cdc'), 160) or '', 1 if a.get('verifie') else 0, coupe(a.get('remarque'), 400) or ''])
out = os.path.join(os.path.dirname(__file__), '..', 'src', '16of-cahiers-donnees.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write('/* ============ CAHIERS DES CHARGES DES APPELLATIONS FRANÇAISES — DONNÉES (0.50.0-alpha.3, généré par tools/cahiers-donnees.py) ============\n')
    f.write('   Relevé du 28/11/2026 dans les cahiers des charges homologués en vigueur (Bulletin officiel du ministère de l’Agriculture, atteint depuis\n')
    f.write('   les fiches produits de l’INAO ; eAmbrosia en dernier recours). Groupes : ' + ', '.join(groupes) + '.\n')
    f.write('   CDC_TXT : [id du référentiel, nom officiel, région, signe, statut (confirmee | corrigee | inexistante | ajout), catégories, couleurs,\n')
    f.write('   dénominations [[nom, type dgc | mention | ugp, catégories, couleurs]], n° de fiche, n° de source, version, vérifiée, remarque].\n')
    f.write('   CDC_FICHES : { t: [ { p pour, c couleur, k catégorie, cp cépages principaux, ca accessoires, rc règles, r / rb rendement / butoir hL/ha,\n')
    f.write('   rk kg/ha, su richesse en sucre g/L, tn TAV naturel min, ta TAV acquis min, tt TAV total max, en enrichissement, sr sucres, el élevage,\n')
    f.write('   mm mise en marché } ], p: { i interdites, m imposées, co conditionnement, dp densité de plantation min } }. Ne pas modifier à la main. */\n')
    f.write('const CDC_SOURCES = ' + json.dumps(sources, ensure_ascii=False) + ';\n')
    f.write('const CDC_FICHES = ' + json.dumps(fiches, ensure_ascii=False, separators=(',', ':')) + ';\n')
    f.write('const CDC_TXT = ' + json.dumps(lignes, ensure_ascii=False, separators=(',', ':')) + ';\n')
    f.write('const CDC_PROBLEMES = ' + json.dumps(problemes, ensure_ascii=False) + ';\n')
print(len(lignes), 'appellations,', len(fiches), 'fiches,', len(sources), 'sources →', out, os.path.getsize(out) // 1024, 'Ko')
