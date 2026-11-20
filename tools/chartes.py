# Génère les chartes graphiques : bloc CSS (variables par charte) dans src/head.html + données JS (src/48-chartes-data.js)
import json, re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SH_L = '0 1px 2px rgba(0,0,0,.06),0 8px 22px rgba(0,0,0,.08)'
SH_D = '0 1px 2px rgba(0,0,0,.5),0 8px 24px rgba(0,0,0,.45)'
DARK_Q = dict(qconv='#93A6B4', qbio='#6CC48A', qdem='#B795E8')
LIGHT_Q = dict(qconv='#5F7A8A', qbio='#3E8E4E', qdem='#8454B3')
F_MONO = "'IBM Plex Mono',ui-monospace,Menlo,Consolas,monospace"
T = []
T.append(dict(id='oenotrack', nom='Œnotrack', sous='Craie & Champagne · épuré, très lisible', nature='light', bands=dict(light='light', dark='dark'),
  desc='Thème par défaut. Blanc craie, bordures calcaire, or champagne pour les actions, gris ardoise pour le texte ; en sombre, ardoise profonde et or champagne. Inter ; Playfair Display pour le logo.',
  polices='Inter · Playfair Display (logo)', fonts=dict(display="'Inter',system-ui,sans-serif", body="'Inter',system-ui,sans-serif", serif="'Playfair Display',Georgia,serif", mono="'Inter',system-ui,sans-serif"),
  radius=('8px', '10px', '12px'), cepages=dict(chard='#EED484', pn='#9E2A2B', pm='#6D4C6B', autre='#A9B4B0'),
  light=dict(bg='#F9F8F6', surface='#FFFFFF', surface2='#F4F2EE', ink='#1E242B', ink2='#5B636D', line='#E5E2DC', accent='#8C6E2F', accentSoft='#F5EEDF', accentInk='#FFFFFF', gold='#B49249', goldSoft='#F7F0E0',
    ok='#2F7D5B', okSoft='#E1F2EA', warn='#A3620A', warnSoft='#FBEED6', bad='#B93A32', badSoft='#FBE2DF', **LIGHT_Q,
    band1='#FFFFFF', band2='#FFFFFF', bandInk='#1E242B', bandInk2='#5B636D', bandGold='#B49249', bandBorder='#E5E2DC', btnPrimHover='#7A5F27',
    logo1='#2A323B', logo2='#1E242B', logoG1='#E3C88A', logoG2='#B49249', logoDot='#FFF8E6', shadow='0 1px 2px rgba(30,36,43,.05),0 6px 16px rgba(30,36,43,.06)'),
  dark=dict(bg='#15171B', surface='#1D2026', surface2='#252932', ink='#EEF0F2', ink2='#A3AAB3', line='#323741', accent='#D2B26A', accentSoft='#3A3220', accentInk='#1A1408', gold='#E3C88A', goldSoft='#3A321E',
    ok='#5DC08F', okSoft='#16301F', warn='#E8B04A', warnSoft='#3A2C10', bad='#F07A6E', badSoft='#3D1A17', **DARK_Q,
    band1='#1D2026', band2='#15171B', bandInk='#EEF0F2', bandInk2='#A3AAB3', bandGold='#D2B26A', bandBorder='#2C3038', btnPrimHover='#E3C88A',
    logo1='#2A323B', logo2='#1E242B', logoG1='#E3C88A', logoG2='#B49249', logoDot='#FFF8E6', shadow=SH_D),
  extra=""".sheet-title,.sheet-h h2{font-family:var(--font-display);font-weight:650}
.tab[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--gold)}
.brand{font-weight:700}
.num{letter-spacing:0}"""))
T.append(dict(id='millesime', nom='Terroir & Millésime', sous='authentique et chaleureux', nature='light', bands=dict(light='dark', dark='dark'),
  desc='Parchemin, vert vigne profond, lie-de-vin et chêne clair. Titres en Lora, interface en Source Sans 3.',
  polices='Lora · Source Sans 3', fonts=dict(display="'Lora',Georgia,serif", body="'Source Sans 3','Segoe UI',system-ui,sans-serif", serif="'Lora',Georgia,serif", mono=F_MONO),
  radius=('6px', '8px', '10px'), cepages=dict(chard='#E3C873', pn='#7C2D36', pm='#B26A62', autre='#9AA39B'),
  light=dict(bg='#F4EFEA', surface='#FCFBF9', surface2='#F0E9E1', ink='#2A2420', ink2='#6B5E54', line='#D9CBBD', accent='#2D4A3E', accentSoft='#E2EBE5', accentInk='#FFFFFF', gold='#7C2D36', goldSoft='#F4E4E6',
    ok='#2F6B4F', okSoft='#DDEDE4', warn='#985E0B', warnSoft='#F6E7C8', bad='#A33A2F', badSoft='#F6DAD5', **LIGHT_Q,
    band1='#2F4F42', band2='#1F362D', bandInk='#F7F1EA', bandInk2='#C9D5CD', bandGold='#E6CFA6', bandBorder='#7C2D36', btnPrimHover='#EFDDBE',
    logo1='#2F5546', logo2='#1C3229', logoG1='#F1DDB8', logoG2='#C8A26A', logoDot='#FFF7E8', shadow='0 1px 2px rgba(42,36,32,.07),0 8px 22px rgba(42,36,32,.09)'),
  dark=dict(bg='#151412', surface='#1F1D1A', surface2='#282521', ink='#EFE9E2', ink2='#B4A89D', line='#3A352F', accent='#8CC0A6', accentSoft='#1C2E26', accentInk='#10201A', gold='#D98B97', goldSoft='#3A2227',
    ok='#6CC79A', okSoft='#163023', warn='#E0AE4A', warnSoft='#36290E', bad='#F0786F', badSoft='#3A1815', **DARK_Q,
    band1='#21342B', band2='#131D18', bandInk='#F2ECE4', bandInk2='#B8C7BE', bandGold='#E2C79A', bandBorder='#9E4652', btnPrimHover='#EBD5AE',
    logo1='#2F5546', logo2='#1C3229', logoG1='#F1DDB8', logoG2='#C8A26A', logoDot='#FFF7E8', shadow=SH_D),
  extra=".sec-t{font-weight:600}\n.brand{font-weight:600}"))
T.append(dict(id='terroirs', nom='Terroirs', sous='d’après votre présentation', nature='light', bands=dict(light='dark', dark='dark'),
  desc='Inspirée de « Les Terroirs de la Vallée du Rhône » : bandeau bordeaux #8A0B1C, fond gris chaud, étiquettes blanches, police Lato (proche de Calibri).',
  polices='Lato', fonts=dict(display="'Lato',Calibri,'Segoe UI',system-ui,sans-serif", body="'Lato',Calibri,'Segoe UI',system-ui,sans-serif", serif="'Lato',Calibri,'Segoe UI',system-ui,sans-serif", mono=F_MONO),
  radius=('2px', '2px', '3px'), cepages=dict(chard='#E6D58A', pn='#8A0B1C', pm='#C27D7A', autre='#9A9A9A'),
  light=dict(bg='#ECEAE6', surface='#FFFFFF', surface2='#F4F2EF', ink='#1F1D1D', ink2='#5E5A59', line='#D8D3CD', accent='#8A0B1C', accentSoft='#F6E3E5', accentInk='#FFFFFF', gold='#C8161D', goldSoft='#FBE4E5',
    ok='#2B7A4B', okSoft='#DAEEE0', warn='#9A5F0A', warnSoft='#F6E7C8', bad='#B3372F', badSoft='#F7DAD6', **LIGHT_Q,
    band1='#A3111F', band2='#6A0713', bandInk='#FFFFFF', bandInk2='#F3CBD0', bandGold='#FFFFFF', bandBorder='#6A0713', btnPrimHover='#F3EDEC',
    logo1='#B5162A', logo2='#6E0814', logoG1='#FFFFFF', logoG2='#F0D2D5', logoDot='#FFFFFF', shadow='0 1px 2px rgba(0,0,0,.10),0 6px 18px rgba(0,0,0,.10)'),
  dark=dict(bg='#171415', surface='#221E1F', surface2='#2B2627', ink='#F0ECEB', ink2='#B7ADAC', line='#3B3536', accent='#EC7182', accentSoft='#3B1C22', accentInk='#1A0B0E', gold='#EC7182', goldSoft='#40222A',
    ok='#5DC78B', okSoft='#15301F', warn='#E0AE4A', warnSoft='#36290E', bad='#F0786F', badSoft='#3A1815', **DARK_Q,
    band1='#76091A', band2='#3E040E', bandInk='#FFFFFF', bandInk2='#EDC0C6', bandGold='#FFFFFF', bandBorder='#3E040E', btnPrimHover='#E9E2E1',
    logo1='#B5162A', logo2='#6E0814', logoG1='#FFFFFF', logoG2='#F0D2D5', logoDot='#FFFFFF', shadow=SH_D),
  extra="""
.topbar{background:linear-gradient(100deg,var(--band1) 0%,#8A0B1C 55%,var(--band2) 100%);border-bottom:0;box-shadow:inset 0 -6px 0 rgba(0,0,0,.12)}
.brand{font-weight:300;letter-spacing:.01em;border-left:1px solid rgba(255,255,255,.55);padding-left:12px}
.brand em{font-weight:700}
.brand-sub{padding-left:13px;letter-spacing:.12em}
.topbar .btn-primary{color:#8A0B1C}
.navbar{box-shadow:0 2px 6px rgba(0,0,0,.08)}
.tab{font-weight:400}
.tab[aria-selected="true"]{font-weight:700;border-bottom-color:var(--accent);background:var(--surface2)}
.sec-t{display:inline-block;background:var(--surface);font-weight:400;font-size:1.05rem;padding:3px 12px;border-left:4px solid var(--accent);box-shadow:0 1px 3px rgba(0,0,0,.14)}
.chip{border-radius:3px}
.sheet-h{background:linear-gradient(100deg,var(--band1),#8A0B1C 70%,var(--band2));color:#fff;border-bottom:0}
.sheet-h .text-ink2{color:#F3CBD0}
.sheet-h .btn-ghost{color:#fff}
.sheet-h .btn-ghost:hover{background:rgba(255,255,255,.15)}
.appfoot{background:#5B5757;color:#F2F0EE}
.appfoot-n{background:#8A0B1C;color:#fff}"""))
T.append(dict(id='nocturne', nom='Chai Nocturne & Cuivre', sous='sombre premium (version claire « au jour »)', nature='dark', bands=dict(light='dark', dark='dark'),
  desc='Pour la cave peu éclairée : noir basalte, anthracite, cuivre pour les actions, vert sauge pour les statuts ; version claire pierre et cuivre. DM Sans à chiffres alignés.',
  polices='DM Sans (chiffres tabulaires)', fonts=dict(display="'DM Sans',system-ui,sans-serif", body="'DM Sans',system-ui,sans-serif", serif="'DM Sans',system-ui,sans-serif", mono="'DM Sans',system-ui,sans-serif"),
  radius=('6px', '8px', '10px'), cepages=dict(chard='#F59E0B', pn='#E11D48', pm='#6366F1', autre='#94A3B8'),
  light=dict(bg='#F5F3F0', surface='#FFFFFF', surface2='#EEEBE6', ink='#1C2026', ink2='#5A616B', line='#DDD8D1', accent='#B5602A', accentSoft='#F6E6DA', accentInk='#FFFFFF', gold='#C77A42', goldSoft='#F7E9DD',
    ok='#3C8A64', okSoft='#DDEFE5', warn='#A8650C', warnSoft='#FBEBD3', bad='#C0453A', badSoft='#FBE1DE', **LIGHT_Q,
    band1='#1C2026', band2='#121417', bandInk='#F3F4F6', bandInk2='#9CA3AF', bandGold='#D97736', bandBorder='#D97736', btnPrimHover='#E58A4E',
    logo1='#262B33', logo2='#15181D', logoG1='#F2A66B', logoG2='#D97736', logoDot='#FFE8D6', shadow='0 1px 2px rgba(28,32,38,.06),0 8px 22px rgba(28,32,38,.08)'),
  dark=dict(bg='#121417', surface='#1C2026', surface2='#232830', ink='#F3F4F6', ink2='#9CA3AF', line='#2D333C', accent='#D97736', accentSoft='#3A2618', accentInk='#121417', gold='#E8955A', goldSoft='#3B2A1E',
    ok='#4E9F78', okSoft='#16291F', warn='#F0B44C', warnSoft='#33280F', bad='#F2685E', badSoft='#3A1A18', **DARK_Q,
    band1='#1C2026', band2='#15181D', bandInk='#F3F4F6', bandInk2='#9CA3AF', bandGold='#D97736', bandBorder='#D97736', btnPrimHover='#E58A4E',
    logo1='#262B33', logo2='#15181D', logoG1='#F2A66B', logoG2='#D97736', logoDot='#FFE8D6', shadow=SH_D, scheme='dark'),
  extra=""".topbar .btn-primary{color:#121417}
.brand{font-weight:700}
.num{font-variant-numeric:tabular-nums;font-size:.95em}"""))
T.append(dict(id='inox', nom='Inox & Précision', sous='industriel, technique', nature='light', bands=dict(light='dark', dark='dark'),
  desc='Rigueur de laboratoire pour grandes maisons et coopératives : gris brouillard, bleu pétrole, vert menthe pour les validations, orange et rouge de sécurité. IBM Plex Sans + JetBrains Mono pour lots et cuves.',
  polices='IBM Plex Sans · JetBrains Mono', fonts=dict(display="'IBM Plex Sans',system-ui,sans-serif", body="'IBM Plex Sans',system-ui,sans-serif", serif="'IBM Plex Sans',system-ui,sans-serif", mono="'JetBrains Mono',ui-monospace,Menlo,monospace"),
  radius=('4px', '6px', '8px'), cepages=dict(chard='#E8C547', pn='#B4233C', pm='#7C5CC4', autre='#94A3B8'),
  light=dict(bg='#F1F5F9', surface='#FFFFFF', surface2='#F8FAFC', ink='#0F172A', ink2='#475569', line='#E2E8F0', accent='#0F4C81', accentSoft='#E3EEF8', accentInk='#FFFFFF', gold='#10B981', goldSoft='#D1FAE5',
    ok='#047857', okSoft='#D1FAE5', warn='#C2410C', warnSoft='#FFEDD5', bad='#DC2626', badSoft='#FEE2E2', **LIGHT_Q,
    band1='#0F4C81', band2='#0B3961', bandInk='#FFFFFF', bandInk2='#BFD3E6', bandGold='#34D399', bandBorder='#10B981', btnPrimHover='#6EE7B7',
    logo1='#1462A6', logo2='#0B3961', logoG1='#E2E8F0', logoG2='#94A3B8', logoDot='#FFFFFF', shadow='0 1px 2px rgba(15,23,42,.05),0 4px 12px rgba(15,23,42,.05)'),
  dark=dict(bg='#0E141B', surface='#151D27', surface2='#1B2532', ink='#E6EDF5', ink2='#93A3B5', line='#263445', accent='#5AA9E6', accentSoft='#13283A', accentInk='#06121C', gold='#34D399', goldSoft='#0F2E24',
    ok='#34D399', okSoft='#0F2E24', warn='#FB923C', warnSoft='#3A220F', bad='#F87171', badSoft='#3A1717', **DARK_Q,
    band1='#0F2A44', band2='#0A1C2E', bandInk='#FFFFFF', bandInk2='#A9C0D6', bandGold='#34D399', bandBorder='#10B981', btnPrimHover='#6EE7B7',
    logo1='#1462A6', logo2='#0B3961', logoG1='#E2E8F0', logoG2='#94A3B8', logoDot='#FFFFFF', shadow=SH_D),
  extra=""".topbar .btn-primary{color:#064E3B}
.linkish,.pname,.tankcard .disp,.ctxmenu .disp{font-family:var(--font-mono);letter-spacing:-.01em}
.brand{font-weight:600;letter-spacing:-.01em}"""))
T.append(dict(id='bordeaux', nom='Bordeaux', sous='chaud, institutionnel', nature='light', bands=dict(light='dark', dark='dark'),
  desc='Hommage aux grandes appellations : lin et crème, lie-de-vin pour textes et actions, or vieilli et vert olive pour les statuts ; contrastes feutrés et coins légèrement arrondis.',
  polices='Cormorant Garamond · Lato', fonts=dict(display="'Cormorant Garamond',Georgia,serif", body="'Lato',system-ui,sans-serif", serif="'Cormorant Garamond',Georgia,serif", mono=F_MONO),
  radius=('7px', '8px', '10px'), cepages=dict(chard='#E2CE95', pn='#7B2832', pm='#C27A5C', autre='#D6C6AE'),
  light=dict(bg='#F6F1EB', surface='#FDFBF7', surface2='#F1E9E0', ink='#3A1C20', ink2='#6E5A55', line='#E3D5C8', accent='#5B1D24', accentSoft='#F2E2E2', accentInk='#FFFFFF', gold='#A48243', goldSoft='#F3EBDA',
    ok='#47543B', okSoft='#E5EADC', warn='#94600F', warnSoft='#F5E8CD', bad='#A23A2E', badSoft='#F6DDD7', **LIGHT_Q,
    band1='#5B1D24', band2='#3F1218', bandInk='#FBF4EA', bandInk2='#DCC5BC', bandGold='#D7BE85', bandBorder='#A48243', btnPrimHover='#E4CF9E',
    logo1='#6B2730', logo2='#3F1218', logoG1='#E9D5A6', logoG2='#A48243', logoDot='#FFF6E2', shadow='0 1px 2px rgba(58,28,32,.06),0 8px 22px rgba(58,28,32,.08)'),
  dark=dict(bg='#1A1214', surface='#23181B', surface2='#2C1F22', ink='#F3E9E4', ink2='#BFA9A2', line='#3D2C2F', accent='#D98C95', accentSoft='#3D1F25', accentInk='#1A0B0E', gold='#D7BE85', goldSoft='#3A3020',
    ok='#9DB384', okSoft='#24301C', warn='#E3B05A', warnSoft='#3A2C12', bad='#EE7F72', badSoft='#3E1D19', **DARK_Q,
    band1='#4A161D', band2='#2E0C11', bandInk='#FBF4EA', bandInk2='#DCC5BC', bandGold='#D7BE85', bandBorder='#A48243', btnPrimHover='#E4CF9E',
    logo1='#6B2730', logo2='#3F1218', logoG1='#E9D5A6', logoG2='#A48243', logoDot='#FFF6E2', shadow=SH_D),
  extra="""h1,h2,h3,.disp{font-weight:700}
h3.sec-t{font-size:1.5rem}
.brand{font-weight:700}"""))
T.append(dict(id='bio', nom='Vert Biodynamie & Nature', sous='frais, naturel, engagé', nature='light', bands=dict(light='dark', dark='dark'),
  desc='Le vivant et le végétal (AB, biodynamie, Demeter) : vert sauge, vert forêt, ocre pour le dynamisme, terre cuite pour les alertes ; typographie humaine et boutons très adoucis.',
  polices='Newsreader · Alegreya Sans', fonts=dict(display="'Newsreader',Georgia,serif", body="'Alegreya Sans','Segoe UI',system-ui,sans-serif", serif="'Newsreader',Georgia,serif", mono=F_MONO),
  radius=('14px', '16px', '18px'), cepages=dict(chard='#CDB65A', pn='#8E3B3B', pm='#A0674B', autre='#7FA36B'),
  light=dict(bg='#F0F4F1', surface='#FAFBF9', surface2='#E8EFEA', ink='#1C2B24', ink2='#55665D', line='#D3DED6', accent='#1A3E2F', accentSoft='#DCE9E1', accentInk='#FFFFFF', gold='#B8932A', goldSoft='#F6EECF',
    ok='#2E7D4F', okSoft='#DCEFE2', warn='#9A6A0A', warnSoft='#F7ECCB', bad='#B2533E', badSoft='#F7E1DA', **LIGHT_Q,
    band1='#1A3E2F', band2='#122B20', bandInk='#F4F7F2', bandInk2='#BFD1C5', bandGold='#D4AF37', bandBorder='#D4AF37', btnPrimHover='#E2C45E',
    logo1='#24533F', logo2='#122B20', logoG1='#EBD27A', logoG2='#D4AF37', logoDot='#FFFBEA', shadow='0 1px 2px rgba(28,43,36,.06),0 8px 22px rgba(28,43,36,.08)'),
  dark=dict(bg='#111A15', surface='#18231D', surface2='#1F2D25', ink='#E8F0EA', ink2='#A3B5AA', line='#2C3D33', accent='#7CC49A', accentSoft='#1A3326', accentInk='#0B1A12', gold='#D4AF37', goldSoft='#3A3115',
    ok='#6FCB8F', okSoft='#173322', warn='#E1B34F', warnSoft='#3A2E12', bad='#E98A72', badSoft='#3D2019', **DARK_Q,
    band1='#173628', band2='#0E2219', bandInk='#F4F7F2', bandInk2='#BFD1C5', bandGold='#D4AF37', bandBorder='#D4AF37', btnPrimHover='#E2C45E',
    logo1='#24533F', logo2='#122B20', logoG1='#EBD27A', logoG2='#D4AF37', logoDot='#FFFBEA', shadow=SH_D),
  extra="""h1,h2,h3{font-weight:600}
.brand{font-weight:600}
.chip{border-radius:999px}"""))
T.append(dict(id='cyber', nom='Cyber-Chai Néon', sous='futuriste, très contrasté', nature='dark', bands=dict(light='dark', dark='dark'),
  desc='Lecture instantanée dans une cave très sombre : bleu-noir spatial, cyan électrique et violet néon, vert phosphore pour « tout va bien », rouge laser pour les alertes ; coins vifs, chiffres en JetBrains Mono.',
  polices='Space Grotesk · JetBrains Mono', fonts=dict(display="'Space Grotesk',system-ui,sans-serif", body="'Space Grotesk',system-ui,sans-serif", serif="'Space Grotesk',system-ui,sans-serif", mono="'JetBrains Mono',ui-monospace,Menlo,monospace"),
  radius=('0px', '2px', '2px'), cepages=dict(chard='#FFE14D', pn='#FF2E88', pm='#8B5CFF', autre='#00E5A0'),
  light=dict(bg='#F2F5FA', surface='#FFFFFF', surface2='#E9EEF6', ink='#0B1020', ink2='#4A5570', line='#D5DDEA', accent='#0087A8', accentSoft='#DDF4FA', accentInk='#FFFFFF', gold='#8A1FD1', goldSoft='#F0E3FB',
    ok='#118A32', okSoft='#DDF5E3', warn='#B86A00', warnSoft='#FDEDD3', bad='#D61F3D', badSoft='#FCE0E5', qconv='#2D7FA8', qbio='#118A32', qdem='#8A1FD1',
    band1='#0F111A', band2='#1E222B', bandInk='#E8F7FF', bandInk2='#8D97AB', bandGold='#00F2FE', bandBorder='#00F2FE', btnPrimHover='#7CF9FF',
    logo1='#151A2B', logo2='#0A0C14', logoG1='#00F2FE', logoG2='#B026FF', logoDot='#E8FFFF', shadow='0 1px 2px rgba(11,16,32,.06),0 8px 22px rgba(11,16,32,.08)'),
  dark=dict(bg='#0F111A', surface='#161A26', surface2='#1E222B', ink='#E8F7FF', ink2='#8D97AB', line='#2A3146', accent='#00F2FE', accentSoft='#062C33', accentInk='#03141A', gold='#B026FF', goldSoft='#2A0F3D',
    ok='#39FF14', okSoft='#0E2A10', warn='#FFB020', warnSoft='#33260A', bad='#FF2E4D', badSoft='#3A0E18', qconv='#7FD6FF', qbio='#39FF14', qdem='#C77DFF',
    band1='#0F111A', band2='#1E222B', bandInk='#E8F7FF', bandInk2='#8D97AB', bandGold='#00F2FE', bandBorder='#00F2FE', btnPrimHover='#7CF9FF',
    logo1='#151A2B', logo2='#0A0C14', logoG1='#00F2FE', logoG2='#B026FF', logoDot='#E8FFFF', shadow='0 0 0 1px rgba(0,242,254,.10),0 8px 26px rgba(0,0,0,.6)', scheme='dark'),
  extra=""".topbar{box-shadow:0 1px 0 rgba(0,242,254,.7),0 0 24px rgba(0,242,254,.18)}
.topbar .btn-primary{color:#03141A}
.linkish,.num,.pname{font-family:var(--font-mono)}
.brand{font-weight:700;letter-spacing:.02em}
.chip{border-radius:2px}""",
  extra_dark=""".btn-primary{box-shadow:0 0 14px rgba(0,242,254,.4)}
.tab[aria-selected="true"]{text-shadow:0 0 10px rgba(0,242,254,.65)}
.pitem svg,.tankcard svg{filter:drop-shadow(0 0 6px rgba(0,242,254,.3)) saturate(1.35)}"""))
T.append(dict(id='nuit', nom='Nuit du Domaine', sous='sombre tout en douceur (version claire « aube »)', nature='dark', bands=dict(light='dark', dark='dark'),
  desc='Ambiance calme : ardoise bleu nuit, or champagne éteint et rose cuivré, cuves aux teintes sourdes (vieux rose, paille, grège, ocre) ; version claire lin et ardoise ; très grands arrondis.',
  polices='Manrope', fonts=dict(display="'Manrope',system-ui,sans-serif", body="'Manrope',system-ui,sans-serif", serif="'Manrope',system-ui,sans-serif", mono="'Manrope',system-ui,sans-serif"),
  radius=('12px', '18px', '22px'), cepages=dict(chard='#E6D6A3', pn='#C98E96', pm='#B7A5C2', autre='#C9A27E'),
  light=dict(bg='#F3F1EE', surface='#FFFFFF', surface2='#ECE8E3', ink='#252A35', ink2='#636874', line='#DCD6CE', accent='#8C6D45', accentSoft='#F1E9DE', accentInk='#FFFFFF', gold='#B07A6E', goldSoft='#F5E6E2',
    ok='#4F8A62', okSoft='#E1EFE5', warn='#A0712A', warnSoft='#F7ECD7', bad='#B85A52', badSoft='#F7E2DF', qconv='#5F7A8A', qbio='#4F8A62', qdem='#8B6BB0',
    band1='#323A4C', band2='#252B38', bandInk='#ECE6DF', bandInk2='#B5AFA7', bandGold='#C5A880', bandBorder='#C5A880', btnPrimHover='#D6BE9C',
    logo1='#323A4C', logo2='#232937', logoG1='#E3CDAA', logoG2='#C5A880', logoDot='#FFF6EA', shadow='0 2px 6px rgba(37,42,53,.07),0 12px 30px rgba(37,42,53,.08)'),
  dark=dict(bg='#1F242E', surface='#282E3C', surface2='#303748', ink='#ECE6DF', ink2='#A9A39B', line='#3A4255', accent='#C5A880', accentSoft='#3A3530', accentInk='#1F242E', gold='#D3A297', goldSoft='#3D3134',
    ok='#93C2A2', okSoft='#24352C', warn='#E3BC6E', warnSoft='#3B3220', bad='#E48A82', badSoft='#3E2A2B', qconv='#A3B6C4', qbio='#93C2A2', qdem='#C3A8E0',
    band1='#282E3C', band2='#1F242E', bandInk='#ECE6DF', bandInk2='#A9A39B', bandGold='#C5A880', bandBorder='#3A4255', btnPrimHover='#D6BE9C',
    logo1='#323A4C', logo2='#232937', logoG1='#E3CDAA', logoG2='#C5A880', logoDot='#FFF6EA', shadow='0 2px 6px rgba(0,0,0,.25),0 12px 30px rgba(0,0,0,.25)', scheme='dark'),
  extra=""".topbar .btn-primary{color:#1F242E}
.brand{font-weight:700}
.num{font-variant-numeric:tabular-nums}"""))

VARMAP = dict(bg='bg', surface='surface', surface2='surface2', ink='ink', ink2='ink2', line='line', accent='accent', accentSoft='accentSoft', accentInk='accentInk', gold='gold', goldSoft='goldSoft',
  ok='ok', okSoft='okSoft', warn='warn', warnSoft='warnSoft', bad='bad', badSoft='badSoft', qconv='qconv', qbio='qbio', qdem='qdem', band1='band1', band2='band2', bandInk='bandInk', bandInk2='bandInk2',
  bandGold='bandGold', bandBorder='bandBorder', btnPrimHover='btnPrimHover', logo1='logo1', logo2='logo2', logoG1='logoG1', logoG2='logoG2', logoDot='logoDot', shadow='shadow')
def block(sel, pal, t):
    v = [f'--{VARMAP[k]}:{pal[k]}' for k in VARMAP]
    f = t['fonts']; v += [f"--font-display:{f['display']}", f"--font-body:{f['body']}", f"--font-serif:{f['serif']}", f"--font-mono:{f['mono']}"]
    r = t['radius']; v += [f'--r-btn:{r[0]}', f'--r-card:{r[1]}', f'--r-sheet:{r[2]}']
    v.append(f"color-scheme:{pal.get('scheme', 'light')}")
    return sel + '{\n  ' + '; '.join(v) + ';\n}\n'
css = ['/* === CHARTES (généré par tools/chartes.py) === */\n']
for t in T:
    sel = f':root[data-charte="{t["id"]}"]' + (',:root:not([data-charte])' if t['id'] == 'oenotrack' else '')
    css.append(f'/* {t["nom"]} — {t["sous"]} */\n')
    css.append(block(sel, t['light'], t))
    d = dict(t['dark']); d['scheme'] = 'dark'; l = dict(t['light']); l['scheme'] = 'light'
    css[-1] = block(sel, l, t)
    css.append(block(f':root[data-charte="{t["id"]}"][data-mode="dark"]', d, t))
    if t.get('extra'):
        for line in t['extra'].strip().split('\n'):
            line = line.strip()
            if not line: continue
            sel_, rest = line.split('{', 1)
            css.append(','.join(f':root[data-charte="{t["id"]}"] {s.strip()}' for s in sel_.split(',')) + '{' + rest + '\n')
    for line in (t.get('extra_dark') or '').strip().split('\n'):
        line = line.strip()
        if not line: continue
        sel_, rest = line.split('{', 1)
        css.append(','.join(f':root[data-charte="{t["id"]}"][data-mode="dark"] {s.strip()}' for s in sel_.split(',')) + '{' + rest + '\n')
css.append('/* === FIN CHARTES === */\n')
CSS = ''.join(css)
p = os.path.join(ROOT, 'src', 'head.html'); s = open(p, encoding='utf8').read()
a = s.find('/* === CHARTES'); b = s.find('/* === FIN CHARTES === */\n')
if a < 0:
    a = s.index('/* Charte Œnotrack'); b = s.index('html,body{height:auto}')
    s = s[:a] + CSS + s[b:]
else:
    s = s[:a] + CSS + s[b + len('/* === FIN CHARTES === */\n'):]
open(p, 'w', encoding='utf8').write(s)
js = [{k: t[k] for k in ('id', 'nom', 'sous', 'desc', 'nature', 'bands', 'polices', 'cepages')} for t in T]
for j, t in zip(js, T):
    for key, mode in (('apercu', 'light'), ('apercuDark', 'dark')):
        L = t[mode]; j[key] = {k: L[k] for k in ('band1', 'band2', 'bandInk', 'bandGold', 'bg', 'surface', 'line', 'ink', 'ink2', 'accent', 'accentInk', 'gold')}
        j[key]['font'] = t['fonts']['body']; j[key]['titre'] = t['fonts']['serif']; j[key]['r'] = t['radius'][1]
open(os.path.join(ROOT, 'src', '48-chartes-data.js'), 'w', encoding='utf8').write('/* ============ CHARTES GRAPHIQUES (données générées par tools/chartes.py) ============ */\nconst CHARTES = ' + json.dumps(js, ensure_ascii=False, indent=1) + ';\nconst charteDef = (id) => CHARTES.find((c) => c.id === id) || CHARTES[0];\n')
print('chartes :', len(T), '· CSS', len(CSS), 'octets')
