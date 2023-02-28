// *** piezo_tr.js v1.0.0 2020-02-27 *** Fonctions js utilisées par piezo_tr.htm ***
// *** piezo_tr.js v2.0.0 2021-07-20 *** Améliorations apportées par hydro_tr.js (10 derniers jours au lieu de tout l'historique) + redirection ancienne URL vers URL harmonisée avec les autres démonstrateurs ***
// *** piezo_tr.js v2.1.0 2021-07-28 *** utilisation de js/commun.js et améliorations liées comme layerswitcher avec choix de 3 fonds de carte ***
//									 *** passage aux 500 dernières mesures et affichage rangeSelector (utilisation graphique() de commun_js ***
// *** piezo_tr.js v3.0.0 2021-07-30 *** gestion des paramètres dans l'URL ***

// *** variables globales ***
	slong = 'longx';
	slat = 'laty';
	scode = 'bss_id';
	slib = 'nompe';
	smeau = 'me';
	snbmes = 'nbmestr'; // nom du champ dans le fichier station pour le nb de données/mesures/analyses. Peut ne pas exister ('')
	snat = ''; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	sunit = ''; // nom du champ unité dans la réponse hubeau
	iconfile = 'iconPiezo.svg';
	iconscale = 15;
	icony = 32;
	fdp = 'osm1';
	//fdp = 'brgm_geol7';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = true;
	size = 500; // par défaut, peut être changé dans l'URL
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['day', 'day', 'day', 'day'];
	co = [1, 3, 7, 14];
	te = ['1 jour', '3 jours', '7 jours', '14 jours'];
	down_img_top = 338+20+30-80; // position de arrowdown pour gérer affichage graphique + 20 car nom de station sur 2 lignes + 30 car chiffres odometer sur 80px au lieu de 50 - 80 car div contact enlevé (liens mis sur les logos)
	// il faut une hauteur utile de 553px pour voir le lien Plus d'informations si le libellé est sur 2 lignes et 681px pour afficher le graphique
	ajout = 1000; // pour afficher 3 chiffres dans odometer
	grandeur = '';
	station_layer_name = 'https://hubeau.eaufrance.fr/sites/default/files/api/demo/data/demo_piezotr_stations.json'; // nom du fichier des stations
	station_layer_type = 'json'; // json ou geojson
	setat = 'piézomètres'; // 2021-08-26 phrase qui doit apparaître dans la ligne d'état
// **************************

station_layer(false);

function donnees_piezo(bss) {
		var classdat = document.getElementById("dat");
		jsondata = new Array();
		processed_json = new Array();   
		// timestamp_mesure est null si passé en fields, mais pas date_mesure
		urlobs = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques_tr?bss_id=" + bss + "&size=" + size + "&fields=date_mesure,profondeur_nappe&sort=desc"; 
		asyncReq(function(result) {
			var rep = JSON.parse(result); 
			jsondata = rep.data;
			nbmes = jsondata.length;
			
			if (nbmes > 0) { 
				dernier_resultat = Math.round(jsondata[0]['profondeur_nappe']);
				if (dernier_resultat < 0) { dernier_resultat = 0; } // 2021-08-25 pour prendre en compte piézos artésiens
				delayedAlert(dernier_resultat);
				//je laisse highcharts gérer les min et max
				date_max = jsondata[0]['date_mesure']; 
				//date_min = jsondata[jsondata.length-1]['date_mesure'];
				//niv_min = 5000; 
				//niv_max = -1000;
				classdat.innerHTML = "Dernière mesure le <b>" + convertDateTimeISO(date_max) + "</b>";
				for(var key in jsondata) {
					jsondata[key]['date_mesure'] = Date.parse(jsondata[key]['date_mesure']);
					niv = jsondata[key]['profondeur_nappe'];
					processed_json.push([jsondata[key]['date_mesure'], niv]);
					//if (niv < niv_min) { niv_min = niv; }
					//if (niv > niv_max) { niv_max = niv; }
				}

				processed_json.sort(function(a,b) { // ajout 2021-08-04 pour ne plus avoir le warning https://assets.highcharts.com/errors/15/ et avoir le navigator correct
					return a[0]-b[0]
				});
				graphique('Profondeur de la nappe', 'Profondeur (m)', '%e %b %Y à %H:%M', -1, 'm', false, 1, 'scatter', true);
			} else {
				classdat.innerHTML = "Pas de mesure disponible";
				delayedAlert(0);
				graphique('Profondeur de la nappe', '', '%e %b %Y à %H:%M', -1, '', false, 1, 'scatter', true);
				/*
				if (typeof myChart != 'undefined') {
					myChart.series[0].remove();
				}*/	
			}
			
			dm.style.cursor = "default";
	});		
}	

function graphique_old() {
	myChart = Highcharts.stockChart('container', { // 2021-07-28 passage à stockChart pour afficher le range selector ; désactivation scrollbar et "navigator" 
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
				return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat('%e %b %Y à %H:%M', this.x) +' : <b>'+ this.y +'</b> m';
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
			x: -65,
			y: -37  
		  },	  
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
			text: 'Profondeur de la nappe',
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
		yAxis: {
			reversed: true,
			opposite: false,
			min : niv_min,
			max : niv_max,
			title: {
				enabled: true,
				text: 'Profondeur (m)',
				style: {
					fontWeight: 'normal'
				}
			},
			labels: {
				align: 'right'
			}
		},
		series: []
	});
//});

	size = 20000;
		myChart.addSeries({
			name: bss,
			colorIndex: 1,
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
		});
}

function traitement_station() {
			dm.style.cursor = "wait";
			//classdist.innerHTML = bss;
			classbss.innerHTML = '<a href="https://ades.eaufrance.fr/Fiche/PtEau?Code=' + bss + '#mesures_graphiques" target="_blank">Plus d\'informations sur le point de mesure</a>';
			classcode.innerHTML = bss; // code BSS du piézomètre remis 2021-07-30
			if (feat.get(slib)) {
				classlibpe.innerHTML = "<b>" + feat.get(slib);
			} else { classlibpe.innerHTML = "<b>" + bss; }	
			if (feat.get(smeau)) {
				classlibpe.innerHTML += "</b> captant la masse d'eau <b>" + feat.get(smeau);
			} else { classlibpe.innerHTML += "</b> captant une masse d'eau non renseignée"; }
			donnees_piezo(bss);
}

function carte() {
	// paramètres génériques :  code_station (code bss), adresse, coord, fdp, size = profondeur des données (nb de données à afficher)
	// paramètres spécifiques : grandeur (profondeur ou cote NGF, à faire + tard) 
	// pour le zoom : code_station est prioritaire sur coord qui est prioritaire sur adresse
	f = extractUrlParams();

	carte_commun();

}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' - ' + feat.get(slib); // ajouter l'ancien code_bss au fichier data pour pouvoir l'afficher
}
