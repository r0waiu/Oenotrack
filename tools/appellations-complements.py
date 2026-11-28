#!/usr/bin/env python3
"""Compléments du référentiel des appellations → src/16oda-appellations-complements-donnees.js (données dans le code, jamais dans la base).
Entrée : verif.json (relevé hors dépôt, 28/11/2026) — chaque entrée lue dans le cahier des charges homologué EN VIGUEUR (Bulletin officiel du
ministère de l'Agriculture, atteint depuis les fiches produits de l'INAO ; Limoux : registre de l'UE eAmbrosia) : nom officiel, appellation
parente, catégories et couleurs autorisées pour cette dénomination précise, URL du texte, version (date d'homologation).
Usage : python3 tools/appellations-complements.py <verif.json>
Une ligne : nom ⇥ région ⇥ signe ⇥ AOP|IGP|SIG ⇥ catégories ⇥ couleurs ⇥ genre (aop | dgc | vsig) ⇥ parent ⇥ alias (« ; ») ⇥ vérifiée ⇥ n° de source ⇥ version."""
import json, sys, os, re
d = json.load(open(sys.argv[1], encoding='utf-8'))
# noms d'usage : l'INAO décrit certaines dénominations par une phrase (mention d'une AOC) — on garde le nom porté sur l'étiquette
NOMS = {
    'Crémant de Savoie': ('Crémant de Savoie', ['Vin de Savoie Crémant', 'Savoie Crémant']),
    'Beaujolais-Villages': ('Beaujolais Villages', ['Beaujolais-Villages']),
    'Blanquette de Limoux': ('Blanquette de Limoux', ['Limoux Blanquette de Limoux']),
    'Blanquette méthode ancestrale': ('Limoux méthode ancestrale', ['Blanquette méthode ancestrale']),
    'Mâcon-Villages': ('Mâcon Villages', ['Mâcon-Villages']),
    'Languedoc Montpeyroux': ('Montpeyroux', ['Languedoc Montpeyroux']),
    'Vin de France': ('Vin de France', ['VSIG', 'Vin sans IG']),
}
sources, lignes, vus = [], [], set()
def s_idx(u):
    if not u: return -1
    if u not in sources: sources.append(u)
    return sources.index(u)
for e in d['entrees']:
    if e['statut'] == 'inexistante' and e.get('genre') != 'aop': continue  # n'existe pas (ou plus) : jamais proposée
    act = e.get('nom_actuel') or ''
    nom, alias = NOMS.get(act, (None, []))
    if not nom:
        n = e['nom_officiel']; m = re.match(r'^(.*?)\s*\(ou (?:« )?(.*?)(?: »)?\)\s*$', n)
        if m: nom = m.group(1).strip(); alias = [m.group(2).strip()] if m.group(2).strip() else []
        else: nom = re.sub(r'\s*\(.*\)\s*$', '', n).strip()
        if m and not alias[0].startswith(('Corse', 'Vin')): alias = [f"{e['parent'].split(' / ')[0]} {alias[0]}"] if e.get('parent') else alias
    if act and act != nom and act not in alias: alias.append(act)
    if e['genre'] == 'dgc' and e.get('parent'):  # nom court de la dénomination (recherche)
        for p in [e['parent'], *e['parent'].split(' / ')]:
            if nom.startswith(p + ' '): c = nom[len(p) + 1:].strip(); (c and c not in alias) and alias.append(c); break
        if ' Côtes de Bordeaux' in act: alias.append(act)
    k = (e['region'], nom.lower())
    if k in vus: continue
    vus.add(k)
    genre = 'aop' if e['statut'] == 'inexistante' else e['genre']; parent = '' if genre != 'dgc' else e.get('parent', '')
    eu = 'SIG' if e['signe'] == 'VSIG' else e['signe']
    lignes.append([nom, e['region'], e['signe'], eu, e.get('categories', ''), e.get('couleurs', ''), genre, parent, ';'.join(dict.fromkeys(a for a in alias if a and a != nom)), 1 if e.get('verifie') else 0, s_idx(e.get('source', '')), e.get('version_cdc', '')])
alias = [[a['ancien'], a['actuel'], 1 if a.get('verifie') else 0, s_idx(a.get('source', ''))] for a in d.get('alias', []) if a.get('verifie') and a['actuel'] and 'Ardèche' not in a['actuel'] and a['ancien'] != 'Vin de Corse']
lignes.sort(key=lambda l: (l[1], l[7], l[0].lower()))
txt = '\n'.join('\t'.join(str(v) for v in l) for l in lignes)
out = os.path.join(os.path.dirname(__file__), '..', 'src', '16oda-appellations-complements-donnees.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write('/* ============ RÉFÉRENTIEL DES APPELLATIONS — COMPLÉMENTS, DONNÉES (0.50.0-alpha.2, généré par tools/appellations-complements.py) ============\n')
    f.write(f"   Relevé du {d.get('releve', '')} dans les cahiers des charges homologués en vigueur (Bulletin officiel du ministère de l’Agriculture, atteint\n")
    f.write('   depuis les fiches produits de l’INAO ; Limoux : registre de l’UE eAmbrosia) : dénominations rattachées à une appellation, mentions,\n')
    f.write('   Vin de France. Une ligne : nom ⇥ région ⇥ signe ⇥ AOP|IGP|SIG ⇥ catégories (codes de 16oa) ⇥ couleurs ⇥ genre ⇥ appellation parente ⇥\n')
    f.write('   alias ⇥ vérifiée (1 : lue dans le texte en vigueur) ⇥ n° de source ⇥ version du cahier des charges. Ne pas modifier à la main. */\n')
    f.write('const APP_COMPL_SOURCES = ' + json.dumps(sources, ensure_ascii=False) + ';\n')
    f.write('const APP_COMPL_TXT = ' + json.dumps(txt, ensure_ascii=False) + ';\n')
    f.write('// anciens noms d’appellations du relevé principal, lus dans le cahier des charges : [ancien, actuel, vérifié, n° de source]\n')
    f.write('const APP_COMPL_ALIAS = ' + json.dumps(alias, ensure_ascii=False) + ';\n')
print(len(lignes), 'compléments,', len(alias), 'alias,', len(sources), 'sources →', out)
