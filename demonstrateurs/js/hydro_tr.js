// *** hydro_tr.js v1.0.0 2020-02-27 *** Adaptation de piezo_tr.htm ***
// *** hydro_tr.js v2.0.0 2020-07-16 *** Une seule courbe : débits ***
// *** hydro_tr.js v2.1.0 2021-07-09 *** on trace les 20000 dernières mesures au lieu de 100 + réactivation rangeSelector avec navigator ***
// *** hydro_tr.js v2.2.0 2021-07-15 *** tooltip (info-bulles sur les stations) ***
// *** hydro_tr.js v2.2.1 2021-07-16 *** ne transforme plus le curseur en main, n'affiche plus d'info bulle et d'infos sur le graphique pour la goutte bleue de localisation + prise en compte stations sans donnée ***
// *** hydro_tr.js v2.3.0 2021-07-27 *** layerswitcher avec choix de 3 fonds de carte + arrondi à 2 chiffres après virgule (dizaine de litres) + utilisation de js/commun.js ***
// v3.0.0 2021-07-29 : passage de paramètres : grandeur (H ou Q), code_station, coord (longitude, latitude), adresse ou fdp. Pratique si on suit toujours une même station par exemple + choix entre Q ou H
// v4.0.0 2021-08-06 : mode asynchrone et transformation du curseur en sablier pendant que les données sont récupérées + taille du graphique qui s'adapte à la hauteur disponible
// v4.1.0 2021-08-18 : paramètre nature + affichage différencié stations DEB et LIMNI
// Le graphique est trop petit pour afficher 2 courbes : c'est donc hauteur OU débit.
// 2021-11-25 plutot que LIMNI ou DEB, faire apparaitre stations avec HQ, Q ou H ? Pb ça peut être changeant... Il faut faire tourner script stations souvent
// 2025-04-03 : modif liens infos station + passage à API v2

// *** variables globales ***
	slong = 'longitude_station';
	slat = 'latitude_station';
	scode = 'code_station';
	slib = 'libelle_station';
	smeau = 'libelle_cours_eau';
	snbmes = ''; // nom du champ dans le fichier station pour le nb de données/mesures/analyses. Peut ne pas exister (''). On ne met pas nbmestr car change tout le temps
	snat = 'type_station'; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	sunit = ''; // nom du champ unité dans la réponse hubeau
	iconfile = 'HydrometrieBleu_on.svg';
	iconscale = 6;
	icony = 32;
	fdp = 'jawg2';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = false;
	size = 20000;
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['day', 'day', 'day', 'day'];
	co = [1, 3, 7, 14];
	te = ['1 jour', '3 jours', '7 jours', '14 jours'];
	down_img_top = 324+10; // position de arrowdown +10 pour compenser la hauteur de l'icone
	ajout = 100000; // 6 chiffres dont 1 décimale
	station_layer_name = 'https://hubeau.eaufrance.fr/sites/default/files/api/demo/data/demo_hydrotr_stations.json'; // nom du fichier des stations
	station_layer_type = 'json'; // json ou geojson
	setat = 'stations'; // 2021-08-26 phrase qui doit apparaître dans la ligne d'état
// **************************

station_layer(false);

function changeGrandeur() {
	grandeur = document.getElementById('grandeur').value;
	// si une station est affichée, changer le graphique avec la nouvelle grandeur
	if (typeof(bss) !== 'undefined') { 
		dm.style.cursor = "wait";
		document.getElementById("search").style.cursor = "wait";
		donnees_piezo(bss);
	}
}

function donnees_piezo(bss) {
	// Possibilités : 1. On affiche systématiquement débits ET hauteurs et l'utilisateur choisit d'enlever les courbes à l'aide de la légende. Pas de liste déroulante à gérer, pas de paramètre H, Q, HQ ou garder param GET uniquement. Temps de requetage double
	// 2. Faire liste déroulante Débits, Hauteurs, Débits et hauteurs. 2 courbes sur le même graphique c'est trop peu lisible donc hauteur OU débit
	// 3. Abandonner l'odometer pour faire graphique + grand.
	// Choix = 2
		var classdat = document.getElementById("dat");

		jsondata = new Array();
		processed_json = new Array();   
		urlobs = "https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr?code_entite=" + bss + "&grandeur_hydro=" + grandeur + "&size=" + size + "&sort=desc&fields=date_obs,resultat_obs"; // changement 2021-07-09

		asyncReq(function(result) { // 2021-08-06 appel asynchrone qui permet d'afficher le sablier comme curseur de souris
			// Code that depends on 'result' https://qastack.fr/programming/14220321/how-do-i-return-the-response-from-an-asynchronous-call
				var rephub = JSON.parse(result);
				jsondata = rephub.data;
				nbmes = jsondata.length;
				
				if (nbmes > 0) { // 2021-07-16 certaines stations n'ont pas de mesure sur les 30 derniers jours on n'ont que H ou Q
					date_max = jsondata[0]['date_obs']; 
					classdat.innerHTML = "Dernière mesure le <b>" + convertDateTimeISO(date_max) + " UTC</b>";
					if (grandeur == 'H') { 
						dernier_resultat = jsondata[0]['resultat_obs'];
						if (dernier_resultat < 0) { dernier_resultat = 0; }
						delayedAlert(Math.round(dernier_resultat*10)); // pour 1 chiffre derrière la virgule. On garde les mm
						for(var key in jsondata) { 
							jsondata[key]['date_obs'] = Date.parse(jsondata[key]['date_obs']);
							deb = jsondata[key]['resultat_obs'];  // différence avec les débits : on ne divise pas par 1000
							processed_json.push([jsondata[key]['date_obs'], deb]);
						}
					} else {	
						dernier_resultat = jsondata[0]['resultat_obs']/1000; // ATTENTION aux valeurs négatives possibles qui affichent n'importe quoi E633095001
						if (dernier_resultat < 0) { dernier_resultat = 0; }
						delayedAlert(Math.round(dernier_resultat*10)); // pour afficher un chiffre après la virgule
						for(var key in jsondata) {
							jsondata[key]['date_obs'] = Date.parse(jsondata[key]['date_obs']);
							deb = jsondata[key]['resultat_obs']/1000;
							processed_json.push([jsondata[key]['date_obs'], deb]);
						}
					}	

					processed_json.sort(function(a,b) { // ajout 2021-08-04 pour ne plus avoir le warning https://assets.highcharts.com/errors/15/ et avoir le navigator correct
						return a[0]-b[0]
					});
					//graphique_old();
					if (grandeur == 'H') { 
						graphique('Hauteur de la rivière', 'Hauteur (mm)', '%e %b %Y à %H:%M', -1, 'mm', false, 2);
					} else {
						graphique('Débit de la rivière', 'Débit (m3/s)', '%e %b %Y à %H:%M', 2, 'm3/s', false, 1);
					}	
				} else {
					classdat.innerHTML = "Pas de mesure disponible durant les 30 derniers jours";
					delayedAlert(0);
					graphique('', '', '%e %b %Y à %H:%M', -1, '', false, 1, 'scatter', false);
					/*
					if (typeof myChart != 'undefined') {
						myChart.series[0].remove();
					} */	
				}
				
				dm.style.cursor = "default";
				document.getElementById("search").style.cursor = "default";
		});		

}	


function graphique_old() {
	// 2021-07-09 passage à stockChart pour afficher le range selector ; désactivation scrollbar et "navigator" 
	myChart = Highcharts.stockChart('container', {
	//myChart = Highcharts.chart('container', {
		chart: {
				/*type: 'area', /* pour dégradé couleur */
				type: 'scatter', /* pour avoir tooltip */
				backgroundColor: {
					linearGradient: [0, 0, 500, 500],
					stops: [
						[0, 'rgb(255, 255, 255)'],
						[1, 'rgb(240, 241, 252)']
					]
				},
				borderColor: '#EBBA95',
				borderWidth: 2,
				marginRight: 20				
			},
		plotOptions: {
			scatter: {
				lineWidth: 1, 
				marker: {
					radius: 3,
					enabled: false
				},
			}
		},
		tooltip: {
			useHTML: true,
			formatter: function() {
				//return ''+ Highcharts.dateFormat('%e. %b %Y, %H:00', this.x) +': '+ this.y +' m NGF';
				return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat('%e %b %Y à %H:%M', this.x) +' : <b>'+ Highcharts.numberFormat(this.y,2,'.',' ') +'</b> m3/s'; // 2021-07-28 2 chiffres après la virgule au lieu de 3
			},
			shared: true
			//xDateFormat: '%Y-%m-%d',
			//valueDecimals: 2
		},
		legend: {
			backgroundColor: '#FFFFFF',
			enabled: false,
			verticalAlign: 'top',
			y: 0, //70,
			align: 'center', //'left',
			backgroundColor: 'lightgray',
			borderColor: 'black',
			borderWidth: 1,
			layout: 'horizontal', //'vertical',
			shadow: true
		},
		scrollbar: {
		    enabled: false
		},
        navigator: {
		    enabled: false
		},
        rangeSelector: {
		  inputEnabled: false,
		  floating: true,
		  dropdown: 'always',
		  buttonPosition: {
			x: -30,
			y: -35  
		  },	  
		  buttons: [{
			type: 'day',
			count: 1,
			text: '1 jour'
			}, {
			type: 'day',
			count: 3,
			text: '3 jours'
			}, {
			type: 'day',
			count: 7,
			text: '7 jours'
			}, {
			type: 'day',
			count: 14,
			text: '14 jours'
			}, {
			type: 'all',
			text: 'Tout'
		  }]
		},
		title: {
			text: 'Débit de la rivière',
			style: {
				color: '#333333',
				fontSize: '12px'
				//fontWeight: 'bold'
			}
		},
		xAxis: {
			type: 'datetime',
			visible: true
		},
		yAxis: [{
			reversed: false,
			opposite: false,
			min : deb_min,
			max : deb_max,
			title: {
				enabled: true,
				text: 'Débit (m3/s)',
				style: {
					fontWeight: 'normal'
				}
			},
			labels: {
				align: 'right'
			}
		}],	
		series: []
	});
//});

	//size = 20000;
}

function init_nat() { // partie spécifique au démonstrateur pour le traitement des natures
   	iconPiezoNat = new Array();
	iconPiezoNat[0] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/HydrometrieBleu_on.svg'
		}))
    });
	iconPiezoNat[1] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/HydrometrieMauve_on.svg'
		}))
    });

	// Limnimètre - cas courant(échelle limnimétrique avec ou sans courbe de tarage)
	// Debitmètre - pour une station délivrant directement une information de débit. Des données de hauteur peuvent exister sur ce type de station mais il n’y a pas de courbe de tarage
	tabnat = [true,true]; // affichage des natures ('LIMNI' pour limnimètre, 'DEB' pour débitmetre) 
	sim = ['on','on'];
	nature = '';
	if (typeof(f['nature']) !== 'undefined') { 
		nature = f['nature'].toLowerCase();
		if (nature.indexOf('limni') == -1) { tabnat[0] = false; sim[0] = 'off'; } 
		if (nature.indexOf('deb') == -1) { tabnat[1] = false; sim[1] = 'off'; } 
		document.getElementById("legende").innerHTML = '<img class="imgleg" src="images/HydrometrieBleu_' + sim[0] + '.svg" title="LIMNI" onclick="icoapp(this)">&nbsp;&nbsp;Limnimètre&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/HydrometrieMauve_' + 
			sim[1] + '.svg" title="DEB" onclick="icoapp(this)">&nbsp;&nbsp;Débitmètre';
	}
}

function traitement_station() {
			dm.style.cursor = "wait";
			if (feat.get('ipt')) { // affichage de la bonne couleur du symbole dans le titre de la station
				switch (rep[feat.get('ipt')][snat].toLowerCase()) {
					case 'limni': scou = 'Bleu'; break;
					case 'deb': scou = 'Mauve'; break;
				}	
				document.getElementById('titre_detail').innerHTML = '<img src="images/Hydrometrie' + scou + '_on.svg" title="' + rep[feat.get('ipt')][snat] + '"><b>Détail de la station de mesure</b> <i><class id="code"></class></i>'; 
			}	
			//classdist.innerHTML = bss;
			classbss.innerHTML = '<a href="https://hydro.eaufrance.fr/stationhydro/' + bss + '/fiche" target="_blank">Plus d\'informations sur la station de mesure</a>';
			document.getElementById("code").innerHTML = bss;
			if (feat.get(slib)) {
				classlibpe.innerHTML = "<b>" + feat.get(slib);
			} else { classlibpe.innerHTML = "<b>" + bss; }	
			/* le nom du cours d'eau est dans le libellé de la station
			if (feat.get('meau')) {
				classlibpe.innerHTML += "</b> sur le cours d'eau <b>" + feat.get('meau');
			} else { classlibpe.innerHTML += "</b> sur un cours d'eau non renseigné"; }
			*/
			donnees_piezo(bss);
}


function carte() {
	//classchif = document.getElementById("titre_chiffres");

	// paramètres possibles :  code_station, grandeur (H ou Q, pas HQ), adresse, coord, fdp
	// pour le zoom, code_station est prioritaire sur coord qui est prioritaire sur adresse
	f = extractUrlParams();
	grandeur = 'Q'; // par défaut
	if (typeof(f['grandeur']) !== 'undefined') { 
		var elmt = document.getElementById("grandeur");
		switch (f['grandeur']) {
		  case 'H':
			grandeur = 'H';
			//classchif.innerHTML = 'Hauteur de l\'eau en mm';
			elmt.selectedIndex = 1;
			break;
		  case 'Q':
			grandeur = 'Q';
			elmt.selectedIndex = 0;
			break;
		  default:
			elmt.selectedIndex = 0;
		}	
	}

	/*
	riverLayer = new ol.layer.Vector({
	  source: new ol.source.Vector({
			format: new ol.format.GeoJSON(),
			url: 'https://hubeau.eaufrance.fr/sites/default/files/api/demo/data/rivers/lorraine_waterways_rivers.geojson'
		  })
	  //style: styleFunction,
	});
	*/

	// Appel des variables et fonctions communes pour la carte
	carte_commun();
}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' - ' + feat.get(slib);
}
