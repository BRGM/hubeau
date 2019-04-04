# Exemples de code de récupération de données via les API de Hub'Eau

Ces examples sont appliqués à des API précises mais sont généralement transposables aux autres API de Hub'Eau.  
N'hésitez pas à ajouter vos propres examples ou partager vos trucs et astuces.  

## Récupération de données de qualité des nappes avec Hubeau.ipynb
Code Python et examples montrant la récupération de données.  
Code appliqué à l'API Qualité des nappes d'eau souterraine, transposable aux autres API de Hub'Eau en changeant l'URL appelée.  

## Tracé d'une chronique piézométrique avec R.ipynb
Code R et example de tracé d'une chronique.  
Code appliqué à l'opération chroniques de l'API Piézométrie, transposable à toutes les opérations des autres API renvoyant des chroniques temporelles (séries de données date, valeur).  

## gen_cache_hydroTR_cursor.php
Code php pour la récupération des observations hydrométriques en temps réel.  
Code spécifique à la méthode observations_tr de l'API hydrométrie montrant comment utiliser la pagination de type 'cursor' pour récupérer l'ensemble des données.  

## debits_a_plusieurs_stations_avec_historique.php
Code php montrant comment conserver un historique des observations hydrométriques en temps réel sur quelques stations pour une période supérieure à 1 mois. Le script montre également comment tracer un graphique de l'évolution des débits.  
Code spécifique à la méthode observations_tr de l'API hydrométrie.  
