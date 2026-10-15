// *** onde.js v1.0.0 2022-07-18 sur la base de hydro_elab.js

// *** variables globales ***
	slong = 'longitude';
	slat = 'latitude';
	scode = 'code_station';
	slib = 'libelle_station';
	smeau = '';
	snbmes = 'nbobs';
	sdatefin = 'datefin';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	sdatedeb = 'datedeb';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	snat = ''; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	ssupport = ''; // 2021-12-22 pour gérer affichage des stations en fonction des données J ou  M. Gérer J et M commme des code_support
	sunit = ''; // nom du champ unité dans la réponse hubeau
	iconfile = 'HydrometrieBleu_on.svg';
	iconscale = 6;
	icony = 32;
	fdp = 'osm1';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = false;
	size = 200;
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['month', 'year', 'year', 'year'];
	co = [6, 1, 3, 10];
	te = ['6 mois', '1 an', '3 ans', '10 ans'];
	down_img_top = 324+10-65-52; // position de arrowdown +10 pour compenser la hauteur de l'icone -65 suppression Contact tout en permettant affichage détails station sur 2 lignes (dans de très rares cas : Q3440001) -52 suppression liste déroulante grandeur élaborée et odometer
	ajout = 0; // on utilise pas odometer
	station_layer_name = 'https://hubeau.eaufrance.fr/sites/default/files/api/demo/data/demo_onde_stations.json'; // nom du fichier des stations, changement 2021-11-26
	station_layer_type = 'json'; // json ou geojson
	setat = 'stations'; // 2021-08-26 phrase qui doit apparaître dans la ligne d'état
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

function libelle_code(x) {
	switch (x) {
		case 0: 
			s = 'écoulement visible acceptable (code 1a) ou écoulement visible (code 1)';
			break;
		case 1: 
			s = 'écoulement visible faible (code 1f)';
			break;
		case 2: 
			s = 'écoulement non visible (code 2)';
			break;
		case 3: 
			s = 'assec (code 3)';
			break;
	};
	return s;	
}
	
function donnees_piezo(bss) {
		var classdat = document.getElementById("dat");
		var classodo = document.getElementById("odometer");
		qdata = new Array();
		processed_json = new Array();   
		// 1-Ecoulement visible / 1a-Ecoulement visible acceptable / 1f-Ecoulement visible faible / 2-Ecoulement non visible / 3-Assec / 4-Observation impossible
		// je peux confondre écoulement visible et écoulement visible acceptable. Obs impossible : ne pas les prendre en compte
		// les dates sont en ordre décroissant. date_observation_min=2000-01-01 pour éliminer les obs sans dates
		// pour mon histogramme : 1 et 1a -> 1 ; 1f -> 1.5 ; 2 et 3 restent. tracer en ordre décroissant. ça ne rend pas bien
		//						3 -> 0 ; 2 -> 10 ; 1f -> 20 ; 1 et 1a -> 30 ; écrire les vrais codes en ordonnées si possible	
		// ou mettre les couleurs usuelles : bleu pour 1 et 1a, jaune pour 1f, orange pour 2, rouge pour 3 + mettre le bleu plus haut que le jaune plus haut que le orange plus haut que le rouge. Sans mettre de labels aux axes
		// Au 09/08/2022 : 	1a : 115415
		//					1  :  34393
		//					1f :  44046
		//					2  :  10534
		//					3  :  23614
		//					4  :    216
		//				  null :  12709
		var urlq = "https://hubeau.eaufrance.fr/api/v1/ecoulement/observations?code_station=" + bss + "&size=" + size + "&fields=date_observation,code_ecoulement&date_observation_min=2000-01-01&code_ecoulement=1,1a,1f,2,3"; 
		j=0;
		d = new Array();
		r = new Array();
		
		var repq = JSON.parse(ajaxGet(urlq)); 
		qdata = repq.data;
		for(var i in qdata) {
			d[j] = qdata[i]['date_observation'];
			r[j] = qdata[i]['code_ecoulement'];
			if ((r[j] == "1") || (r[j] == "1a")) { r[j] = 0; }
			if (r[j] == "1f") { r[j] = 1; }
			if (r[j] == "2") { r[j] = 2; }
			if (r[j] == "3") { r[j] = 3; }
			date_obs = Date.parse(d[j]);
			processed_json.push([date_obs, r[j]]);
			j++;
		}

		processed_json.sort(function(a,b) { // pour trier en dates ascendantes et avoir le navigator correct
			return a[0]-b[0]
		});
		
		nbmes = d.length;
		if (nbmes > 0) { // si certaines stations n'avaient pas d'observation
			qdate_max = d[0];
			classodo.innerHTML = '<p>Dernière observation :<br>' + libelle_code(processed_json[nbmes-1][1]) + '<br> le ' + convertDateISO(qdate_max) + '</p>'; 
			classdat.innerHTML = "<b>"+nbmes+"</b> observations. Dernière campagne : <b>" + convertDateISO(qdate_max) + "</b>";
			graphique_onde();
		} else {
			classdat.innerHTML = "Pas d'observation disponible";
			classodo.innerHTML = "Pas d'observation disponible"; 
			if (typeof myChart != 'undefined') {
				myChart.series[0].remove();
			}	
		}
}

/*
series: [{
        data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, {
            y: 216.4,
            color: '#BF0B23'
        }, 194.1, 95.6, 54.4]
    }]	
*/

function graphique_onde() {
	bnav = false;
	if (htgraph >= 210) { bnav = true; } // si hauteur graphique >= 210 on affiche le navigator
	myChart = Highcharts.stockChart('container', {
		chart: {
				type: 'scatter', 
				events: {
				  load: function() {
					const chart = this,
					  data = chart.series[0].data;

					data.map((element) => {
					  if (element.y === 1) {
						element.update({
						  marker: {
							fillColor: 'yellow'
						  }
						})
					  }
					  if (element.y === 2) {
						element.update({
						  marker: {
							fillColor: 'orange'
						  }
						})
					  }
					  if (element.y === 3) {
						element.update({
						  marker: {
							fillColor: 'red'
						  }
						})
					  }
					});
				  }
				},
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
				lineWidth: 0, 
				marker: {
					lineWidth: 1,
					lineColor: 'darkgray',
					fillColor: 'blue',
					radius: 3,
					enabled: true
				},
			}
		},
		tooltip: {
			useHTML: true,
			formatter: function() {
				return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat('%e %b %Y', this.x) +' : <b>'+ libelle_code(this.y) +'</b> '; 
			},
			shared: false //true
		},
		legend: {
			backgroundColor: '#FFFFFF',
			enabled: false,
			verticalAlign: 'top',
			y: -73, //70,
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
			//maskFill: 'rgba(0, 127, 255, 0.75)',
			margin: 10,
			height: 30,
			enabled: bnav
		},
        rangeSelector: {
		  inputEnabled: false,
		  floating: true,
		  dropdown: 'always',
		  buttonPosition: {
			x: -60, //-30
			y: -37  //-35
		  },	  
		  buttons: [{
			type: ty[0],
			count: co[0],
			text: te[0]
			}, {
			type: ty[1],
			count: co[1],
			text: te[1]
			}, {
			type: ty[2],
			count: co[2],
			text: te[2]
			}, {
			type: ty[3],
			count: co[3],
			text: te[3]
			}, {
			type: 'all',
			text: 'Tout'
		  }]
		},
		title: {
			text: 'Ecoulement',
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
			categories: ['1-1a', '1f', '2', '3'], // index 0,1,2,3
			reversed: true,
			opposite: false,
			min : 0,
			max : 3, //pour avoir tjs la même échelle
			title: {
				enabled: true,
				text: 'Code écoulement',
				style: {
					fontWeight: 'normal'
				}
			},
			labels: {
				align: 'right'
			}
		}],	
		series: [{
				name: bss,
				//colorIndex: 1,  // à changer
				yAxis: 0,
				fillColor: {
					linearGradient: {
						x1: 0,
						y1: 1,
						x2: 0,
						y2: 0 
					},
					stops: [
						[0, Highcharts.getOptions().colors[0]],
						[1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
						//[0, '#EEEEEE'],
						//[1, '#FFFFFF']
					]
				},
				data: processed_json
				/*
				data: [{
					x: 1372291200000,
					y: 1,
					marker: { fillColor: 'blue' }
				}, {
					x: 1374710400000,
					y: 1,
					marker: { fillColor: 'blue' }
				}, {
					x: 1377475200000,
					y: 3,
					marker: { fillColor: 'red' }
				}, {
					x: 1380499200000,
					y: 1.5,
					marker: { fillColor: 'yellow' }
				}, {
				}, {
					x: 1401062400000,
					y: 2,
					marker: { fillColor: 'orange' }
				}, {
				}, {
					x: 1403654400000,
					y: 1,
					marker: { fillColor: 'blue' }
				}]
				*/
		}]
	});
	//size = 20000;
/*
	myChart.addSeries({
				name: bss,
				colorIndex: coul,
				yAxis: 0,
				fillColor: {
					linearGradient: {
						x1: 0,
						y1: 1,
						x2: 0,
						y2: 0
					},
					stops: [
						[0, Highcharts.getOptions().colors[0]],
						[1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
					]
				},
				data: processed_json
	}); */
}


function init_nat() { // partie spécifique au démonstrateur pour le traitement des natures
}

function traitement_station() {
			dm.style.cursor = "wait";
			//classdist.innerHTML = bss;
			classbss.innerHTML = '<a href="https://onde.eaufrance.fr/acces-aux-donnees/station/' + bss + '" target="_blank">Plus d\'informations sur la station de mesure</a>';
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
			dm.style.cursor = "default";
}


function carte() {
	// paramètres possibles :  code_station, adresse, coord, fdp
	// pour le zoom, code_station est prioritaire sur coord qui est prioritaire sur adresse
	f = extractUrlParams();
	
	// Appel des variables et fonctions communes pour la carte
	
	create_layer_station(); // changement par rapport aux autres démonstrateurs
	
	carte_commun();
	event_params();
}

function affiche_legende() {
		document.getElementById("legende").innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 
		'nbobsmin = <input type="text" id="val6" name="val6" size="6" title="Affichage uniquement des stations ayant au moins nbobsmin débits" placeholder="nbobsmin" value="' + nbanamin + '">&nbsp;&nbsp;' + 
		'datedeb = <input type="text" id="val3" name="val3" size="8" title="Affichage uniquement des stations ayant des débits antérieure à datedeb" placeholder="datedeb" value="' + datedeb + '">&nbsp;&nbsp;' +
		'datefin = <input type="text" id="val4" name="val4" size="8" title="Affichage uniquement des stations ayant des débits postérieurs à datefin" placeholder="datefin" value="' + datefin + '">';
}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' - ' + feat.get(slib);
	if (rep[j]['nbobs'] > 0) { content.innerHTML += '<br>' + rep[j]['nbobs'] + ' observations de ' + convertAnneeISO(rep[j]['datedeb']) + ' à ' + convertAnneeISO(rep[j]['datefin']); }
}
