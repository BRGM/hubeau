// *** qualaep.js v1.0.0 2022-08-12 sur la base de onde.js
// *** qualaep.js v2.0.0 2022-08-17 plus d'appel à Hub'Eau, on utilise les fichiers cache. // pouvoir cliquer sur un prélèvement et afficher les résultats des analyses
// utiliser couche WMS comme prix_eau_wms ?

// *** variables globales ***
	slong = 'longitude';
	slat = 'latitude';
	scode = 'code_commune';
	slib = 'nom_commune';
	smeau = '';
	snbmes = 'nbprel';
	sdatefin = 'datefin';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	sdatedeb = 'datedeb';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	snat = ''; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	ssupport = ''; // 2021-12-22 pour gérer affichage des stations en fonction des données J ou  M. Gérer J et M commme des code_support
	sunit = ''; // nom du champ unité dans la réponse hubeau
	iconfile = 'pointOr_on.png';
	iconscale = 15;
	icony = 0;
	fdp = 'osm1';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = false;
	size = 200;
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['month', 'year', 'year', 'year'];
	co = [6, 1, 3, 10];
	te = ['6 mois', '1 an', '3 ans', '10 ans'];
	down_img_top = 324+10-65-52; // position de arrowdown +10 pour compenser la hauteur de l'icone -65 suppression Contact tout en permettant affichage détails station sur 2 lignes (dans de très rares cas : Q3440001) -52 suppression liste déroulante grandeur élaborée et odometer
	ajout = 0; // on utilise pas odometer
	station_layer_name = 'https://hubeau.eaufrance.fr/sites/default/files/api/demo/data/demo_aep_communes.json'; // nom du fichier des stations, changement 2021-11-26
	station_layer_type = 'json'; // json ou geojson
	setat = 'communes'; // 2021-08-26 phrase qui doit apparaître dans la ligne d'état
// **************************

	grandeur = 'qualaep';
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

function str_conforme(x) {
	switch (x) {
		case 1: 
			s = "Eau d'alimentation non conforme aux exigences de qualité<br>&nbsp;";
			break;
		case 2: 
			s = "Eau d'alimentation conforme aux limites de qualité, avec dépassement de références de qualité";
			break;
		case 3: 
			s = "Eau d'alimentation conforme aux exigences de qualité<br>&nbsp;";
			break;
	};
	return s;	
}

function donnees_piezo(bss) {
		var classdat = document.getElementById("dat");
		var classodo = document.getElementById("odometer");
		processed_json = new Array();   
		urlobs = "data/communes/" + bss + ".csv"; 
		asyncReq(function(result) {
			var rep = $.csv.toObjects(result, { separator: ';' });
			conf = new Array();
			codeprel = new Array();
			j=0;
			for(var p = 0; p < rep.length; p++) { // méthode la + performante
				if (typeof(rep[p]['conclusion']) !== 'undefined') {
					dat = rep[p]['date'];
					date_obs = Date.parse(dat);
					niv = 3;
					if (rep[p]['ref_bact'] == 'N') { niv = 2; }
					if (rep[p]['ref_pc'] == 'N') { niv = 2; }
					if (rep[p]['lim_bact'] == 'N') { niv = 1; }
					if (rep[p]['lim_pc'] == 'N') { niv = 1; }
					switch (niv) {
						case 1: 
							scol = 'red';
							break;
						case 2: 
							scol = 'orange';
							break;
						case 3: 
							scol = 'lightgreen';
							break;
					};
					var point = {
						y: niv,
						x: date_obs,
						marker: { fillColor: scol }
					};
					processed_json.push(point);
					//processed_json.push([date_obs, niv]);
					conf[j] = rep[p]['conclusion'];
					codeprel[j] = rep[p]['code'];
					j++;
				}	
			}	
			processed_json.sort(function(a,b) { // pour trier en dates ascendantes et avoir le navigator correct
				return a[0]-b[0]
			});
			//console.table(processed_json);
			
			nbmes = processed_json.length;
			if (nbmes > 0) { // si certaines stations n'avaient pas d'observation
				classodo.innerHTML = '<p>Dernier prélèvement le ' + convertDateISO(dat) + '<br>' + str_conforme(processed_json[nbmes-1]['y']) + '</p>'; 
				classdat.innerHTML = "<b>"+nbmes+"</b> prélèvements. Dernier prélèvement : <b>" + convertDateISO(dat) + "</b>";
				//var a = performance.now();
				graphique_cat(); // tracer 3 séries de couleurs définies pour améliorer les performances ? non
				//var b = performance.now();
				//console.log((b-a) + 'ms pour graphique');
			} else {
				classdat.innerHTML = "Pas de prélèvement disponible";
				classodo.innerHTML = "Pas de prélèvement disponible"; 
				if (typeof myChart != 'undefined') {
					myChart.series[0].remove();
				}	
			}
			dm.style.cursor = "default";
			document.getElementById("search").style.cursor = "default";
		});		
			


		// appeler hub'eau pour tous les code_prelevement. quand plusieurs centaines de prélèvements (Briançon), c'est trop lent
		/*
		cp = new Array();
		conf = new Array();
		ipt = feat.get('ipt');
		cp = rep[ipt]['codes_prel'];
		j=0;
		for(var p= 0; p < cp.length; p++) { // méthode la + performante
			codeprel = cp[p];
			var urlp = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_prelevement=" + codeprel + "&size=1&fields=date_prelevement,conclusion_conformite_prelevement,conformite_limites_bact_prelevement,conformite_limites_pc_prelevement,conformite_references_bact_prelevement,conformite_references_pc_prelevement"; 
			var repp = JSON.parse(ajaxGet(urlp)); 
			pdata = repp.data;
			for(var i in pdata) {
				dat = pdata[i]['date_prelevement'];
				//console.table(pdata[i]);
				niv = 3;
				if (pdata[i]['conformite_references_bact_prelevement'] == 'N') { niv = 2; }
				if (pdata[i]['conformite_references_pc_prelevement'] == 'N') { niv = 2; }
				if (pdata[i]['conformite_limites_bact_prelevement'] == 'N') { niv = 1; }
				if (pdata[i]['conformite_limites_pc_prelevement'] == 'N') { niv = 1; }
				date_obs = Date.parse(dat);
				processed_json.push([date_obs, niv]);
				conf[j] = pdata[i]['conclusion_conformite_prelevement']
				j++;
			}
		}		
*/
}

function graphique_cat() {
	bnav = false;
	if (htgraph >= 210) { bnav = true; } // si hauteur graphique >= 210 on affiche le navigator
	myChart = Highcharts.stockChart('container', {
		chart: {
				type: 'scatter', 
/* trop lent
				events: {
				  load: function() {
					const chart = this,
					  data = chart.series[0].data;
					data.map((element) => {
					  if (element.y === 1) {
						element.update({
						  marker: {
							fillColor: 'red'
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
					}); 
				  }
				}, */
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
					//fillColor: 'lightgreen',
					radius: 4,
					enabled: true
				},
			}
		},
		tooltip: {
			useHTML: true,
			formatter: function() {
				return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat('%e %b %Y', this.x) +' : <b>'+ conf[this.point.index] +'</b> '; 
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
			text: 'Conformité de l\'eau',
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
			categories: ['-', 'Non conforme', 'Dépassement références', 'Conforme'], // index 0,1,2,3
			reversed: false,
			opposite: false,
			min : 1,
			max : 3, //pour avoir tjs la même échelle
			title: {
				enabled: true,
				text: 'Conformité',
				style: {
					fontWeight: 'normal'
				}
			},
			labels: {
				align: 'right'
			}
		}],	
		series: [{
                events: {
                    click: function (event, i) {
                        // au click, faire une fiche prélèvement, avec commune, réseau(x), uge, distrib, moa, date et résultats des paramètres avec unités. Popup ou nouvel onglet?
						url = "https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_prelevement=" + codeprel[event.point.index] + "&size=20000";
						window.open(url, "_blank");
                    }
                },
				name: bss,
				turboThreshold: 0, // pour le désactiver
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
		}]
	});
}


function init_nat() { // partie spécifique au démonstrateur pour le traitement des natures
}

function traitement_station() {
			dm.style.cursor = "wait";
			//classdist.innerHTML = bss;
			classbss.innerHTML = '<a href="https://www.services.eaufrance.fr/donnees/commune/' + bss + '" target="_blank">Plus d\'informations sur la commune</a>';
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
		'nbobsmin = <input type="text" id="val6" name="val6" size="6" title="Affichage uniquement des communes ayant au moins nbobsmin prélèvements" placeholder="nbobsmin" value="' + nbanamin + '">&nbsp;&nbsp;' + 
		'datedeb = <input type="text" id="val3" name="val3" size="8" title="Affichage uniquement des communes ayant des prélèvements antérieure à datedeb" placeholder="datedeb" value="' + datedeb + '">&nbsp;&nbsp;' +
		'datefin = <input type="text" id="val4" name="val4" size="8" title="Affichage uniquement des communes ayant des prélèvements postérieurs à datefin" placeholder="datefin" value="' + datefin + '">';
}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' - ' + feat.get(slib);
	if (rep[j]['nbprel'] > 0) { 
		content.innerHTML += '<br>' + rep[j]['nbana'] + ' analyses réparties en ' + rep[j]['nbprel'] + ' prélèvements du ' + convertDateISO(rep[j]['datedeb']) + ' au ' + convertDateISO(rep[j]['datefin']);
	}
}
