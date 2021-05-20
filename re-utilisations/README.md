## [hubeau.py, script Python permettant d'interroger l'API hydrométrie de Hub'Eau, par Pierre-Alain Dorange](https://github.com/padorange/hubeau)  
Permet de suivre les mesures de hauteur des cours d'eau diffusée par l'API HubEau :  
	- Télécharge les dernières mesures (API HubEau via le format json)  
	- Stocke les mesures en local (via sqlite + sqlalchemy)  
	- Permet de mettre des graphiques l'historique des hauteur d'eau (via matplotlib)  
	- Génère une page HTML5+CSS+Javascript de suivi des stations de mesures (via ElementTree)  
	- Intègre une carte des stations sur la page HTML via Leaflet et OpenStreetMap  
  
## [The underground French waters, par Campalo](https://github.com/Campalo/FrenchWaters)  
A French speaking user will discover the multitude of underground waters located over the French landscape. 
The user selects a departement, then sees a list of all the stations of measurement located in this specific departement, by clicking on one of the stations it displays the depth and altitude of the selected underground water station. 

## [k-hubeau, a Krawler based service to download data from French open portal Hub'Eau, par Kalisio](https://github.com/kalisio/k-hubeau)  
The **k-hubeau** jobs allow to scrape hydrometric data from the following api: [http://hubeau.eaufrance.fr/page/api-hydrometrie](http://hubeau.eaufrance.fr/page/api-hydrometrie).  The downloaded data are stored in a [MongoDB](https://www.mongodb.com/) database and more precisely in 2 collections:
* the `observations` collection stores the observed data:
  * the water level `H` in meter (m)
  * the water flow `Q` in cubic meter per second (m3/s)
* the `stations` collection stores the data of the stations

## [Timeseries forecasting use case: level of water, par Kalisio](https://github.com/kalisio/water-level-forecasting)  
> Based on Open Data provided by Hub'Eau and largely inspired by https://www.tensorflow.org/tutorials/structured_data/time_series  

Predicting the level of water in rivers can prove to be invaluable in areas with a high risk of flooding. While traditional methods are based primarily on physical model, another approach is emerging: artificial neural networks.  

## [Python & Hub'Eau, par Sofiyan Ifren](https://www.linkedin.com/pulse/python-hubeau-sofiyan-ifren/)  
Récupération de données de pêche électrique avec un peu de programmation en Python  

## [Leaflet & Hub'Eau, par Sofiyan Ifren](https://www.linkedin.com/pulse/leaflet-hubeau-sofiyan-ifren/?trk=related_artice_Leaflet%20%26amp%3Bamp%3Bamp%3B%20Hub%26amp%3Bamp%3B%2339%3BEau%20_article-card_title)  
Cartographie des données de pêche électrique avec Leaflet

