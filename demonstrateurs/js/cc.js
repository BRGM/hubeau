// *** cc.js v1.0.0 2021-04-23, basé sur hydrobio.js ***  
// *** cc.js v2.0.0 2021-08-10, utilisation commun.js ***  
// *** cc.js v3.0.0 2021-12-16, ligne d'état ***  
// faire des fichiers par paramètre pour n'afficher que les stations de ce paramètre ?

// *** variables globales ***
	slong = 'longitude';
	slat = 'latitude';
	scode = 'code_lieusurv';
	slib = 'libelle_lieusurv';
	smeau = 'noms_masses_eau';
	snbmes = '';
	snat = ''; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	sunit = 'libelle_unite_resultat'; // nom du champ unité dans la réponse hubeau
	iconfile = 'biv_black_MarkerB.png'; 
	iconscale = 20;
	icony = 32;
	fdp = 'esri_topo3';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = false;
	size = 2000; 
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['month', 'year', 'year', 'year'];
	co = [3, 1, 5, 10];
	te = ['3 mois', '1 an', '5 ans', '10 ans'];
	down_img_top = 382+10-80; // position de arrowdown pour gérer affichage graphique +10 à cause liste déroulante - 80 car div contact enlevé (liens mis sur les logos)
	ajout = 100000; // affichage 5 chiffres dont 1 décimale dans odometer
	//station_layer_name = 'https://hubeau.eaufrance.fr/api/v1/surveillance_littoral/lieux_surv?donnees_cc=true&format=json&size=500'; // URL des stations
	station_layer_name = 'https://hubeau.eaufrance.fr/sites/default/files/api/demo/data/demo_survlitt_lieuxsurv.json'; // fichier des stations généré via php
	station_layer_type = 'json'; // json ou geojson
	setat = 'lieux de surveillance'; // 2021-12-16 phrase qui doit apparaître dans la ligne d'état
// **************************

//station_layer(false);  pour pouvoir lancer create_station_layer au bon moment
	var request = new XMLHttpRequest();
	request.open('GET', station_layer_name);
	request.responseType = 'json';
	request.send();
	request.onload = function() {
		rep = request.response;
	  //create_layer_station();
	  carte();
	}

function changeSupport() {
	code_support = document.getElementById('code_support').value;
	// garder le même zoom, remplacer ancien markerSource par la nouvelle
		switch (code_support) {
		  case '3':
			iconfile = 'eau_blue_MarkerE.png'; 
			prefix = 'eau';
			break;
		  case '4':
			iconfile = 'poi_orange_MarkerP.png'; 
			prefix = 'poi';
			break;
		  case '6':
			iconfile = 'sed_brown_MarkerS.png'; 
			prefix = 'sed';
			break;
		  case '21':
			iconfile = 'biv_black_MarkerB.png'; 
			prefix = 'biv';
		}	
	snbmes = prefix + '_nbobs';  	// ajout 2021-12-16
	sdatedeb = prefix + '_datedeb'; 
	sdatefin = prefix + '_datefin'; 
	redrawStations(); // 2021-12-16 permet le rafraichissement de la ligne d'état sur le nb de stations quand on change de support
   	iconPiezoStyle = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],
		  anchorXUnits: 'fraction',
		  anchorYUnits: 'pixels',
		  opacity: 1.0,
		  src: 'images/' + iconfile
		}))
    });
	markerLayer.setStyle(markerLayer.getStyle());
	classico.innerHTML = '<img src="images/' + iconfile + '">'; 
	redrawGraph(); // si une station est affichée, changer le graphique avec le nouveau support
}
	
function changeGrandeur() {
	grandeur = document.getElementById('grandeur').value;
	// si une station est affichée, changer le graphique avec la nouvelle grandeur
	if (typeof(bss) !== 'undefined') { 
		donnees_piezo(bss);
	}
}

function donnees_piezo(bss) {
		sgrandeur = document.getElementById('grandeur').options[document.getElementById('grandeur').selectedIndex].text;
		ssupport = document.getElementById('code_support').options[document.getElementById('code_support').selectedIndex].text;
		//console.log(grandeur, sgrandeur, document.getElementById("grandeur").selectedIndex+1);
		// tester l'existence des différents paramètres par station et réduire la liste déroulante en conséquence
		// certaines stations n'ont des analyses que sur support 3 (eau, bleu E) et pas 21 (bivalve, B, noir) + support 6 (sédiment, marron S) et 1 station avec support 4 uniquement (poisson, orange P)
		// faire 2 courbes ? 1 pour bivalves, 1 pour eau. tjs la même couleur quelque soit grandeur, mais 1 couleur pour bivalves (axe gauche) et 1 couleur pour eau (axe droit). Oui mais que mettre dans odometer?
		// ou sélectionner plutôt que les stations bivalves
		var classdat = document.getElementById("dat");
		jsondata = new Array();
		processed_json = new Array();   
		urlobs = "https://hubeau.eaufrance.fr/api/v1/surveillance_littoral/contaminants_chimiques?size=" + size + "&code_parametre=" + grandeur + "&code_support=" + code_support + "&code_lieusurv=" + bss; 
		asyncReq(function(result) {
			dm.style.cursor = "wait";
			//document.getElementById("search").style.cursor = "wait";
			var rep = JSON.parse(result); 
			jsondata = rep.data;
			nbmes = jsondata.length;
			if (nbmes > 0) { 
				// temperature.js a le bon ordre pour trier les valeurs et afficher le dernier resultat
				//delayedAlert(Math.round(jsondata[nbmes-1]['resultat_analyse']*10)); // pour afficher un chiffre après la virgule
				//date_max = jsondata[nbmes-1]['date_prel']; 
				//date_min = jsondata[0]['date_prel'];
				//deb_min = 10000000;
				//deb_max = -1000000;
				//classdat.innerHTML = "Dernier prélèvement le <b>" + convertDateISO(date_max) + "</b>";
				// attention aux unités. si Matière sèche : %
				traitement_unite(true);
				for(var key in jsondata) {
					jsondata[key]['date_prel'] = Date.parse(jsondata[key]['date_prel']);
					deb = jsondata[key]['resultat_analyse'];
					processed_json.push([jsondata[key]['date_prel'], deb]);
					//if (deb < deb_min) { deb_min = deb; }
					//if (deb > deb_max) { deb_max = deb; }
					if (jsondata[key][sunit] != unite) { console.log('!!! Unités différentes !!!  ' + jsondata[key][sunit] + ' - ' + unite); }
				}

				processed_json.sort(function(a,b) { // ajout 2021-08-04 pour ne plus avoir le warning https://assets.highcharts.com/errors/15/ et avoir le navigator correct
					return a[0]-b[0]
				});
				delayedAlert(Math.round(processed_json[nbmes-1][1]*10)); // si on veut 1 chiffre après la virgule. récupération du dernier résultat, correspondant à date_max
				var options = {timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit"};
				date_max = new Date(processed_json[nbmes-1][0]);
				classdat.innerHTML = "Dernier prélèvement le <b>" + date_max.toLocaleDateString('fr-FR', options) + "</b>";
				//graphique(stitle, sytitle, sttformat, ttnbdec, sttunit, blegend=false, coul=1, styp='scatter', breversed=false)				
				graphique(sgrandeur+' dans '+ssupport, syaxis, '%e %b %Y', -1, symb, false, document.getElementById("grandeur").selectedIndex+1, 'scatter', false);
			} else {
				delayedAlert(0);
				classdat.innerHTML = "Pas d'analyse disponible";
				graphique(sgrandeur+' dans '+ssupport, '', '%e %b %Y', -1, '', false, 1, 'scatter', false);
				/*		
				if (typeof myChart != 'undefined') {
					myChart.series[0].remove();
				}*/		
			}
			dm.style.cursor = "default";
			//document.getElementById("search").style.cursor = "default";
		});		

		
}	

function graphique_old() {
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
				//return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat('%e %b %Y à %H:%M', this.x) +' : <b>'+ Highcharts.numberFormat(this.y,3,'.',' ') +'</b> mg/kg';
				return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat('%e %b %Y', this.x) +' : <b>'+ Highcharts.numberFormat(this.y,1,'.',' ') +'</b> mg/kg';
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
		rangeSelector: {
		  buttons: [{
			type: 'day',
			count: 1,
			text: '1j'
			}, {
			type: 'day',
			count: 3,
			text: '3j'
			}, {
			type: 'all',
			text: 'Tout'
		  }]
		},
		title: {
			text: sgrandeur,
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
			//min : deb_min,
			//max : deb_max,
			title: {
				enabled: true,
				text: 'Concentration (mg/kg)',
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

	size = 20000;
}

function traitement_station() {
			dm.style.cursor = "wait";
			// A CHANGER
			classbss.innerHTML = '<a href="https://www.sandre.eaufrance.fr/geo/StationMesureEauxSurface/' + bss + ' target="_blank">Plus d\'informations sur le lieu de surveillance</a>';
			classcode.innerHTML = bss; 
			if (feat.get(slib)) {
				classlibpe.innerHTML = "<b>" + feat.get(slib);
			} else { classlibpe.innerHTML = "<b>" + bss; }	
			/* le nom du cours d'eau est dans le libellé de la station
			if (feat.get('meau')) {
				classlibpe.innerHTML += "</b> captant la masse d'eau <b>" + feat.get('meau');
			} else { classlibpe.innerHTML += "</b> captant une masse d'eau non renseignée"; } */
			donnees_piezo(bss);
}

function carte() {
	// paramètres génériques :  code_station (code bss), adresse, coord, fdp, size = profondeur des données (nb de données à afficher)
	// paramètres spécifiques : grandeur (code SANDRE du paramètre physico-chimique), code_support (3, 4, 6 ou 21 - eau, poissons, sédiments ou bivalves) 
	// pour le zoom : code_station est prioritaire sur coord qui est prioritaire sur adresse
	f = extractUrlParams();
	grandeur = 1382; sgrandeur = 'Plomb'; // par défaut. ou avoir une 1ere ligne Choisir le paramètre
	if (typeof(f['grandeur']) !== 'undefined') { 
		elmt = document.getElementById("grandeur");
		switch (f['grandeur']) {
		  case '1383':
			grandeur = 1383; 
			elmt.selectedIndex = 1; // définir selectedIndex en parcourant un tableau de paramètres
			break;
		  case '1433':
			grandeur = 1387; 
			elmt.selectedIndex = 2;
			break;
		  case '1388':
			grandeur = 1388; 
			elmt.selectedIndex = 3;
			break;
		  case '1388':
			grandeur = 1388; 
			elmt.selectedIndex = 3;
			break;
		  case '1392':
			grandeur = 1392; 
			elmt.selectedIndex = 4;
			break;
		  case '1200':
			grandeur = 1200; 
			elmt.selectedIndex = 5;
			break;
		  case '1203':
			grandeur = 1203; 
			elmt.selectedIndex = 6;
			break;
		  case '7153':
			grandeur = 7153; 
			elmt.selectedIndex = 7;
			break;
		  default:
			elmt.selectedIndex = 0;
		}	
	}
	
	classico = document.getElementById("ico");
	code_support = 21; prefix = 'biv';
	if (typeof(f['code_support']) !== 'undefined') { 
		elmt_sup = document.getElementById("code_support");
		switch (f['code_support']) {
		  case '3':
			code_support = 3; 
			ssupport = "l'eau";
			iconfile = 'eau_blue_MarkerE.png'; 
			prefix = 'eau';
			elmt_sup.selectedIndex = 2;
			break;
		  case '4':
			ssupport = "les poissons";
			code_support = 4; 
			iconfile = 'poi_orange_MarkerP.png'; 
			prefix = 'poi';
			elmt_sup.selectedIndex = 3;
			break;
		  case '6':
			ssupport = "les sédiments";
			code_support = 6; 
			iconfile = 'sed_brown_MarkerS.png'; 
			prefix = 'sed';
			elmt_sup.selectedIndex = 1;
			break;
		  default:
			ssupport = "les bivalves";
			code_support = 21;
			iconfile = 'biv_black_MarkerB.png'; 
			prefix = 'biv';
			elmt_sup.selectedIndex = 0;
		}	
	}
	classico.innerHTML = '<img src="images/' + iconfile + '">'; 
	snbmes = prefix + '_nbobs';  	// ajout 2021-12-16
	sdatedeb = prefix + '_datedeb'; 
	sdatefin = prefix + '_datefin'; 

	create_layer_station(); // changement par rapport aux autres démonstrateurs
	carte_commun();

}

function addPiezoToMap() { // remplace fonction de même nom dans commun.js 
	if (rep[ipt][prefix+'_nbana'] > 0) {
			x = rep[ipt][slong];
			y = rep[ipt][slat];
			markerPiezoFeature[ipt] = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y]))
			});
			markerPiezoFeature[ipt].set(scode, rep[ipt][scode]); 
			markerPiezoFeature[ipt].set(slib, rep[ipt][slib]);
			markerPiezoFeature[ipt].set(smeau, rep[ipt][smeau]);
			markerPiezoFeature[ipt].set('ipt', ipt);
			markerSource.addFeature(markerPiezoFeature[ipt]);
	}		
}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' - ' + feat.get(slib);
	if (rep[j]['biv_nbana'] > 0) {
		content.innerHTML += '<br>sur bivalves : ' + rep[j]['biv_nbana'] + ' analyses concernant ' + rep[j]['biv_nbpar'] + ' substances du ' + convertDateISO(rep[j]['biv_datedeb']) + ' au ' + convertDateISO(rep[j]['biv_datefin']) ;
	}	
	if (rep[j]['sed_nbana'] > 0) {
		content.innerHTML += '<br>sur sédiments : ' + rep[j]['sed_nbana'] + ' analyses concernant ' + rep[j]['sed_nbpar'] + ' substances du ' + convertDateISO(rep[j]['sed_datedeb']) + ' au ' + convertDateISO(rep[j]['sed_datefin']) ;
	}	
	if (rep[j]['eau_nbana'] > 0) {
		content.innerHTML += '<br>sur eau : ' + rep[j]['eau_nbana'] + ' analyses concernant ' + rep[j]['eau_nbpar'] + ' substances du ' + convertDateISO(rep[j]['eau_datedeb']) + ' au ' + convertDateISO(rep[j]['eau_datefin']) ;
	}	
	if (rep[j]['poi_nbana'] > 0) {
		content.innerHTML += '<br>sur poissons : ' + rep[j]['poi_nbana'] + ' analyses concernant ' + rep[j]['poi_nbpar'] + ' substances du ' + convertDateISO(rep[j]['poi_datedeb']) + ' au ' + convertDateISO(rep[j]['poi_datefin']) ;
	}	
}
