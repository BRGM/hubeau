## QUESTION n°1
- Quel était le niveau de la nappe phréatique à la station piézométrique 03635X0545/PZ1 le 12 janvier 2019 ?
### Identifier le LIEU 
Fonction à coder pour récupérer les entités nommées géographiques

Résultat attendu ici : le code BSS d'une station piezométrique : "03635X0545/PZ1"

Requête pour récupérer les informations de cette station : <https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_bss=03635X0545%2FPZ1&format=json&size=20> 

Résultat : {"code\_bss": "03635X0545/PZ1","urn\_bss": "http://services.ades.eaufrance.fr/pointeau/03635X0545/PZ1","date\_debut\_mesure": "2012-01-01","date\_fin\_mesure": "2021-01-18","code\_commune\_insee": "45234","nom\_commune": "Orléans","x": 1.885962242,"y": 47.892217508, ....
### Identifier la PERIODE de TEMPS
Fonction à coder 

Résultat attendu ici : le 12 janvier 2019
### Identifier le THEME 
Fonction à coder 

Résultat attendu ici : « quantité eau souterraine »
### Identifier la METRIQUE 
Fonction à coder 

Résultat attendu ici : « dernière valeur piezo mesurée (ou moyenne / min / max ?) sur la période de temps considérée »
### Récupérer les DONNEES 
Requête : <https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss=03635X0545%2FPZ1&date_debut_mesure=2019-01-12&date_fin_mesure=2019-01-13&size=20> 

Résultat : 1 mesure unique
### Restituer la REPONSE
Fonction à coder

Résultat attendu ici :

"""

Le 12 janvier 2019, la station piézométrique 03635X0545/PZ1 a mesuré le niveau de nappe suivant :

|***code BSS de la station***|**dernier niveau enregistré (altitude / mer)**|**profondeur de la nappe (/ au sol)**|**date d'enregistrement**|**lien vers des infos supplémentaires**|
| -: | :- | :- | :- | :- |
|*03635X0545/PZ1*|88.39|4.95|2019-01-12|<p><http://services.ades.eaufrance.fr/pointeau/03635X0545/PZ1></p><p></p>|

"""
## QUESTION n°2
- Quel est le niveau actuel de la nappe phréatique à Orléans ?
- Où en est la nappe à Orléans ?
- A quelle hauteur se trouve l'eau souterraine sur la commune d'Orléans ?
- Y'a-t-il de l'eau dans le sous-sol orléanais ?
- A quelle profondeur se trouve la nappe à l'adresse 12 rue de Coulmiers, 45000 Orléans ?
### Identifier le LIEU 
Fonction à coder pour récupérer les entités nommées géographiques

Résultat attendu ici : la commune Orléans (plus petit considéré a priori)

Requête pour récupérer le code INSEE de la commune : <https://geo.api.gouv.fr/communes?nom=orleans&fields=nom,code,codesPostaux,codeDepartement,codeRegion,population&format=json&geometry=centre> 

Résultat : {"nom": "Orléans", "code": "45234", "codesPostaux": ["45000","45100"], "codeDepartement": "45", "codeRegion": "24", "population": 114782, "\_score": 1}
### Identifier la PERIODE de TEMPS
Fonction à coder 

Résultat attendu ici : « maintenant », ce qui peut se traduire par différentes périodes suivant la question
### Identifier le THEME 
Fonction à coder 

Résultat attendu ici : « quantité eau souterraine »
### Identifier la METRIQUE 
Fonction à coder 

Résultat attendu ici : « dernière valeur piezo mesurée »
### Récupérer les DONNEES 
Trouver toutes les stations piezo correspondant au lieu identifié, actives sur la période de temps identifiée (pour être sûr d'avoir des données piezo, on peut considérer que "maintenant" se traduit ici par "sur les 30 derniers jours" par exemple)  : <https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_commune=45234&date_recherche=2021-01-01&format=json&size=20>

Résultat : 4 stations identifiées 

- 03635X0545/PZ1
- 03636X1061/PZ3
- 03636X1062/PZ4
- 03982X1045/F

Récupérer les données pour l'ensemble des stations identifiées, à la date d'aujourd'hui (ou plutôt depuis le début du mois en cours, soit janvier 2021) : <https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss=03635X0545%2FPZ1&code_bss=03636X1061%2FPZ3&code_bss=03636X1062%2FPZ4&code_bss=03982X1045%2FF&date_debut_mesure=2021-01-01&size=100> 

Résultat : 66 mesures récupérées

Traitement complémentaire à coder : sélectionner la mesure la plus récente pour chaque station identifiée
### Restituer la REPONSE
Fonction à coder

Résultat attendu ici :

"""

4 stations piézométriques permettent actuellement de mesurer le niveau des nappes phréatiques sur la commune d'Orléans, voici leurs dernières mesures enregistrées :

|***code BSS de la station***|**dernier niveau enregistré (altitude / mer)**|**profondeur de la nappe (/ au sol)**|**date d'enregistrement**|**lien vers des infos supplémentaires**|
| -: | :- | :- | :- | :- |
|*03635X0545/PZ1*|89.7|3.64|2021-01-18|http://services.ades.eaufrance.fr/pointeau/03635X0545/PZ1|
|*03636X1061/PZ3*|90.72|3.8|2021-01-18|http://services.ades.eaufrance.fr/pointeau/03636X1061/PZ3|
|*03636X1062/PZ4*|90.56|4.4|2021-01-18|http://services.ades.eaufrance.fr/pointeau/03636X1062/PZ4|
|*03982X1045/F*|90.9|3.35|2021-01-12|http://services.ades.eaufrance.fr/pointeau/03982X1045/F|

"""

## QUESTION n°3
- ### Quel est le minimum jamais atteint par le niveau de la nappe phréatique sur la commune de Loury ?
- ### J'habite à Loury dans le Loiret, à quelle profondeur faut-il que je creuse un puits dans mon jardin pour avoir de l'eau 
### Identifier le LIEU 
Fonction à coder pour récupérer les entités nommées géographiques

Résultat attendu ici : Loury (grain minimal = commune)

Requête pour récupérer les informations de la commune de Loury : <https://geo.api.gouv.fr/communes?nom=loury&fields=nom,code,codesPostaux,codeDepartement,codeRegion,population&format=geojson&geometry=centre> 

Résultat : {"type": "FeatureCollection","features": [{"type": "Feature","properties": {"nom": "Loury","code": "45188","codesPostaux": ["45470"],"codeDepartement": "45","codeRegion": "24","population": 2484,"\_score": 1},"geometry": {"type": "Point","coordinates": [2.0991,48.01]}}
### Identifier la PERIODE de TEMPS
Fonction à coder 

Résultat attendu ici : historique complet
### Identifier le THEME 
Fonction à coder 

Résultat attendu ici : « quantité eau souterraine »
### Identifier la METRIQUE 
Fonction à coder 

Résultat attendu ici : « minimum »
### Récupérer les DONNEES 
Requête pour trouver toutes les stations piezo correspondant au lieu identifié : 

<https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_commune=45188&format=json&size=20> 

Résultat : 1 stations identifiées mais active seulement entre 1974 et 1978 à jugé trop ancien ?

Si ces données sont jugées insuffisantes (règle fonctionnelle à fixer), alors on escalade d'un niveau administratif : vers le département, ici : le Loiret (45)

Requête : <https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_departement=45&format=json&size=200> 

Résultat : 105 stations

Fonction à coder : sélection des N (par exemple N=3) stations les plus proches du lieu concerné - ici la commune de Loury - parmi les 105 obtenues 

Résultats : 3 stations retenues

- 03633X0081/P
- 03634X0093/F
- 03637X0122/P

Par station sélectionnée :

- Récupérer l'historique complet des données : <https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss=03633X0081%2FP&size=20> 
- Résultat : 1745 mesures récupérées (éventuellement de façon paginée)
- Fonctions à coder : 
- Déterminer la date de mesure la plus lointaine 
- Déterminer la date de mesure plus récente 
- Sélectionner la mesure minimale
### Restituer la REPONSE
Fonction à coder

Résultat attendu ici :

"""

Aucune donnée piezométrique récente n'est à ce jour enregistrée sur la commune de Loury. Vous trouverez ci-dessous les minima enregistrés des 3 stations du département les plus proches de Loury :

|***code BSS de la station***|**niveau minimal (altitude / mer)**|**profondeur minimale de la nappe (/ au sol)**|**année(s) du résultat**|**période de mesure consédérée**|**lien vers des infos supplémentaires**|
| -: | :- | :- | :- | :- | :- |
|*03633X0081/P*|-25.5|25.5|[1993, 1997]|1974-2006|https://ades.eaufrance.fr/Fiche/PtEau?Code=03633X0081/P#mesures\_stats|
|`	`*03634X0093/F*	|104.42|21.05|1997|1994-2021|<https://ades.eaufrance.fr/Fiche/PtEau?Code=03634X0093/F#mesures_stats> |
|*03637X0122/P*|99.27|22.75|1997|1974-2006|https://ades.eaufrance.fr/Fiche/PtEau?Code=03637X0122/P#mesures\_stats|

"""

Note : on constate qu'il y a probablement une anomalie dans les données de la station 03633X0081/P : le niveau semble être erroné comme l'opposé de la profondeur.
