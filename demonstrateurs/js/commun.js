// *** commun.js v1.0.0 2021-07-28 *** Fonctions js utilisées par plusieurs démonstrateurs hub'eau de type PLOUF (ne pas confondre avec précédent fichier commun.js utilisé par scripts php). Ajout des fdp IGN planv2 et bdortho + geol BRGM ***
// *** commun.js v2.0.0 2021-08-04 *** Responsive en hauteur ***
// *** commun.js v3.0.0 2021-08-17 *** Affichage différencié des stations : couleurs en fonction de nature ou type station + nb min de mesures/analyses (+ traitement unités) ***
// *** commun.js v3.1.0 2021-08-24 *** Paramètres datedeb, datefin, limit

// TODO : avoir ligne d'état qui dit combien de stations s'affichent avec les critères entrés + d'autres choses. Fait 2021-08-25
// TODO : en dessous du sélecteur fdp, avoir un sélecteur qui présente tous les paramètres possibles (code_parametre ou grandeur, code_station, code_support, coord, datedeb, datefin, limit, nbobsmin) et permet d'entrer une valeur. Adresse et fdp ont déjà leur sélecteur
// 2021-08-25 checkbox limit mis dans le graphique, datedeb, datefin, nbobsmin mis dans la légende
// TODO : avoir parametre resmin qui, pour la grandeur sélectionnée, affiche toutes les stations qui ont un résultat > resmin. Nécessite de confectionner fichier avant. Avoir aussi resmoymin qui travaille sur la moyenne des résultats et non plus le max.
// pouvoir définir une plage de dates sur lesquelles s'exercent ce max et ce moy? Là on ne peut plus traiter avec un fichier de stations statique
// avoir déjà un paramètre qui permet d'afficher les stations ayant des données pour ce paramètre (pour l'instant l'affichage n'est géré qu'au niveau supérieur du support). Nécessite un fichier de stations du type cc
// mettre fond bleu dégradé sous légende ? non, moche

chemin = 'https://hubeau.eaufrance.fr/sites/default/files/api/demo/';

function delayedAlert(p) {
	timeoutID = window.setTimeout(slowAlert(p), 100);
}
function slowAlert(p) {
  document.getElementById('odometer').innerHTML = p+ajout;
}

//https://forum.alsacreations.com/topic-4-71386-1-Comment-avoir-un-div-de-la-taille-dun-ecranresolution-.html
$(function() {
        // Sections height
        $(window).resize(function() {
			calcul_hauteur();
        });        
    });

function calcul_hauteur() {
            sH = $(window).height();
			htgraph = sH - down_img_top - 283;
			console.log(htgraph);
            if (htgraph >= 90) { // tracer le graphique si sa hauteur est >= 90
				$('#container').css('height', htgraph + 'px'); // la hauteur du graphique sera (hauteur dispo-600) pour le cas classique font odometer 50px et pas de liste déroulante (temperature, prel, ...) soit hauteur dispo - down_img_top - 283
			} else {
				$('#container').css('height', '0px');
			}	
}

// Fonction de récupération des paramètres GET de la page. @return Array Tableau associatif contenant les paramètres GET
function extractUrlParams(){	
	var t = location.search.substring(1).split('&');
	var f = [];
	for (var i=0; i<t.length; i++){
		var x = t[ i ].split('=');
		f[x[0]]=x[1];
	}
	return f;
}	

// remplace toutes les occurences d'une chaine contrairement à la méthode string.replace()
function replaceAll(recherche, remplacement, chaineAModifier) {
	return chaineAModifier.split(recherche).join(remplacement);
}

function station_layer(bdata=false) {	
	// si bdata= true, c'est une requête Hub'Eau qui est envoyée, il faut interroger response.data
	var request = new XMLHttpRequest();
	request.open('GET', station_layer_name);
	request.responseType = 'json';
	request.send();
	request.onload = function() {
	  if (bdata) {
		rep = request.response.data;
	  } else {
		rep = request.response;
	  }	  
	  f = extractUrlParams();
	  create_layer_station();
	  carte();
	}
}

// urlobs = variable globale contenant l'URL pour appeler les observations
function asyncReq(callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onload = function(){ // when the request is loaded
       callback(httpRequest.responseText);// we're calling our method
    };
    httpRequest.open('GET', urlobs);
    httpRequest.send();
}

// Appel AJAX synchrone
function ajaxGet(url) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false);
    req.send(null);
    if (req.status >= 200 && req.status < 400) {
            return req.responseText;
    } else {
            console.error(req.status + " " + req.statusText + " " + url);
    }
}

// Exécute un appel AJAX GET asynchrone
// Prend en paramètres l'URL cible et la fonction callback appelée en cas de succès
function ajaxGetAsync(url, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", url);
    req.addEventListener("load", function () {
        if (req.status >= 200 && req.status < 400) {
            // Appelle la fonction callback en lui passant la réponse de la requête
            callback(req.responseText);
        } else {
            console.error(req.status + " " + req.statusText + " " + url);
        }
    });
    req.addEventListener("error", function () {
        console.error("Erreur réseau avec l'URL " + url);
    });
    req.send(null);
}

function get_adresse(){
		var adrval = document.getElementById("adresse").value;
		var url = "https://api-adresse.data.gouv.fr/search/?q=" + adrval + "&limit=1"; 
		var rep = JSON.parse(ajaxGet(url)); 
		if (rep.features[0]) {
			//long = rep.features[0].geometry.coordinates[0];
			//lat = rep.features[0].geometry.coordinates[1];
			coord = rep.features[0].geometry.coordinates;
			var coordinate = ol.proj.fromLonLat(coord);
			AdrFeature.getGeometry().setCoordinates(coordinate);
			//AdrFeature.setStyle(iconAdrStyle);
			map.getView().setCenter(coordinate);
			map.getView().setZoom(12);   // 2021-07-28 passage de 11 à 12 pour zoomer plus près
		}	else {
			AdrFeature.setStyle(iconInvisibleStyle);
		}	
}

function convertDateTimeISO(s) { 
	// convertit une date ISO (2019-07-10T02:05:20Z) en date/time usuelle (10/07/2019 02:05:20)
	return(s.substring(8, 10) + '/' + s.substring(5, 7) + '/' + s.substring(0, 4) + ' ' + s.substring(11, 13) + ':' + s.substring(14, 16) + ':' + s.substring(17, 19));
}

function convertDateISO(s) { 
	// convertit une date ISO (2019-07-10T00:00:00Z) en date usuelle (10/07/2019)
	return(s.substring(8, 10) + '/' + s.substring(5, 7) + '/' + s.substring(0, 4));
}

function convertMoisISO(s) { 
	// convertit une date ISO (2019-07-10T02:05:20Z) en mois/année(07/2019). Utilisé par qmm
	return(s.substring(5, 7) + '/' + s.substring(0, 4));
}

function convertAnneeISO(s) { 
	return(s.substring(0, 4));
}

function traitement_unite(bmetres) {
	// bmetres : true si on affiche les unités après odometer
	unite = jsondata[0][sunit];
	switch (unite) {
	  case '°C':
		symb = '°C'; 
		syaxis = 'Température (°C)';
		break;
	  case '°f': case '°F':
		symb = '°f'; 
		syaxis = 'Dureté (°f)';
		break;
	  case 'gramme par kilogramme':
		symb = 'g/kg'; 
		syaxis = 'Concentration (g/kg)';
		break;
	  case 'milligramme par kilogramme': case 'mg/(kg MS)': case 'mg(Hg)/kg': case 'mg(Cr)/kg': case 'mg(Pb)/kg':
		symb = 'mg/kg'; 
		syaxis = 'Concentration (mg/kg)';
		break;
	  case 'microgramme par kilogramme': case 'µg/(kg MS)':	
		symb = 'µg/kg'; 
		syaxis = 'Concentration (µg/kg)';
		break;
	  case 'milligramme par litre':
	  case 'mg/L': case 'mg(Ca)/L': case 'mg(Cl)/L': case 'mg(Mg)/L': case 'mg(K)/L': case 'mg(Na)/L': case 'mg(N)/L':
	  case 'mg(NH4)/L': case 'mg(NO2)/L': case 'mg(NO3)/L': case 'mg(O2)/L':
	  case 'mg(P)/L': case 'mg(PO4)/L': case 'mg(P2O5)/L': case 'mg(SO4)/L':
		symb = 'mg/l'; 
		syaxis = 'Teneur (mg/l)';
		break;
	  case 'microgramme par litre': case 'µg/L': case 'µg(Cd)/L': case 'µg(Cu)/L': case 'µg(Ni)/L': case 'µg(Pb)/L': case 'µg(Zn)/L': case 'µg(Cr)/L': case 'µg(Hg)/L': case 'µg(As)/L':
	  case 'µg(B)/L': case 'µg(Se)/L': case 'µg(Fe)/L': case 'µg(Co)/L': case 'µg(Mo)/L': case 'µg(Mn)/L': case 'µg(Al)/L': case 'µg(Ag)/L': case 'µg(Ba)/L': case 'µg(Be)/L': case 'µg(Sn)/L': case 'µg(Ti)/L': case 'µg(V)/L':
		symb = 'µg/l'; 
		syaxis = 'Teneur (µg/l)';
		break;
	  case 'nanogramme par litre':
		symb = 'ng/l'; 
		syaxis = 'Teneur (ng/l)';
		break;
	  case 'pourcentage':
	  case '%':
		symb = '%';
		syaxis = 'Taux (%)';
		break;
	  case 'unité pH':
		symb = 'unité pH'; 
		syaxis = 'pH (unité pH)';
		break;
	  case 'µS/cm':
		symb = 'µS/cm'; 
		syaxis = 'Conductivité (µS/cm)';
		break;
	  case 'NFU': case 'NTU':
		symb = 'NFU'; 
		syaxis = 'Turbidité (NFU)';
		break;
	  case 'X': case 'n': case '‰ vs SMOW': case 'Unité inconnue': case 'unité inconnue':
		// prendre valeur max dans fichier paramètre
		if (typeof(valmax[grandeur]) !== 'undefined') { 
			symb = ' / ' + valmax[grandeur]; 
			syaxis = 'Valeur (/' + valmax[grandeur] + ')';
		} else {
			symb = '?';
			syaxis = '?';
		}	
		break;
	  default:
		symb = '?';
		syaxis = '?';
	}	
	if (bmetres) { document.getElementsByClassName("metres")[0].innerHTML = '&nbsp;' + symb; }
	console.log('unité = ' + unite);
}

function graphique(stitle, sytitle, sttformat, ttnbdec, sttunit, blegend=false, coul=1, styp='scatter', breversed=false, bmarker=false) {
	//rangeSelector a 4 entrées + tout. Les 4 entrées sont personnalisables en entête de chaque fichier .js des démonstrateurs
	// stitle : titre du graphique. ex: 'Débit de la rivière'
	// sytitle : titre de l'axe y. ex: 'Débit (m3/s)'
	// sttformat : format du tooltip en x. ex: '%e %b %Y à %H:%M'
	// ttnbdec : nb de décimales du tooltip de la valeur. ex: 2 pour hydro_tr. -1 si pas d'arrondi
	// sttunit : nom de l'unité pour le tooltip de la valeur. ex: 'm3/s' ou 'm'
	// blegend : boolean legend enabled ou non
	// coul : couleur de la courbe. 1 par défaut, 2 pour les hauteurs hydro_tr
	// styp : type de graphique. 'scatter' par défaut pour tous sauf 'column' pour qmm
	// breversed : boolean axe y reversed ou non. false par défaut, true pour piezo_tr
	// bmarker : boolean affichage des points sur le graphique. True seulement pour hydrobio 
	// sbuttons : sélecteurs de temps à afficher - Abandonné car ne fonctionne pas -> 3 tableaux globaux passés en entête de chaque fichier .js
	
	// 2021-07-09 passage à stockChart pour afficher le range selector ; désactivation scrollbar et "navigator" 
	// trouver le moyen que l'usage du navigator affecte dynamiquement l'affichage de la courbe. ce n'est pas le fait d'inclure la série dans series[] au lieu de addSeries. type line au lieu de scatter inopérant aussi. Il faut la scrollbar
	bnav = false;
	if (htgraph >= 210) { bnav = true; } // si hauteur graphique >= 210 on affiche le navigator
	myChart = Highcharts.stockChart('container', {
		chart: {
				type: styp, /* 'scatter' pour avoir tooltip */
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
			column: {
				pointPadding: 0.2,
				borderWidth: 0,
				groupPadding: 0,
				color: '#0000FF',
				shadow: false
			},
			scatter: {
				lineWidth: 1, 
				marker: {
					radius: 3,
					enabled: bmarker
				},
			}
		},
		tooltip: {
			useHTML: true,
			formatter: function() {
				// 2022-08-01 cas particulier QmM et prel - sale mais fonctionne
				switch (grandeur) {
					case 'QmM': 
						return Highcharts.dateFormat('%b %Y', this.x+86400000) +' : <b>'+ Highcharts.numberFormat(this.y,2,'.',' ') +'</b> m3/s'; // 86400000 pour ajouter 1 jour et afficher le bon mois
						break
					case 'prel': 
						return Highcharts.dateFormat('%Y', this.x+86400000) +' : <b>'+ Highcharts.numberFormat(this.y,0,'.',' ') +'</b> m3'; // 86400000 pour ajouter 1 jour et afficher la bonne année
						break
					default : 
						if (ttnbdec == -1) {
							return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat(sttformat, this.x) +' : <b>'+ this.y +'</b> ' + sttunit; 
						} else {	
							return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat(sttformat, this.x) +' : <b>'+ Highcharts.numberFormat(this.y,ttnbdec,'.',' ') +'</b> ' + sttunit; 
						}	
				};	
				/*	
				if (grandeur == 'QmM') {
					return Highcharts.dateFormat('%b %Y', this.x+86400000) +' : <b>'+ Highcharts.numberFormat(this.y,2,'.',' ') +'</b> m3/s'; // 86400000 pour ajouter 1 jour et afficher le bon mois
				} else {	
					if (ttnbdec == -1) {
						return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat(sttformat, this.x) +' : <b>'+ this.y +'</b> ' + sttunit; 
					} else {	
						return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat(sttformat, this.x) +' : <b>'+ Highcharts.numberFormat(this.y,ttnbdec,'.',' ') +'</b> ' + sttunit; 
					}	
				} */	
			},
			shared: false //true
			//xDateFormat: '%Y-%m-%d',
			//valueDecimals: 2
		},
		legend: {
			backgroundColor: '#FFFFFF',
			enabled: blegend,
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
			text: stitle,
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
			reversed: breversed,
			opposite: false,
			//min : deb_min,
			//max : deb_max,
			title: {
				enabled: true,
				text: sytitle,
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
						//[0, '#EEEEEE'],
						//[1, '#FFFFFF']
					]
				},
				data: processed_json
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

// fonctions ico* à mettre dans chaque js plutôt que dans commun ?
function iconat(balise) { // pour les démonstrateurs eau souterraine acceptant un paramètre nature
	var snatclic = balise.title.toLowerCase();
	switch (snatclic) {
		case 'forage': inat=0; break
		case 'source': inat=1; break
		case 'puits': inat=2; break
		case 'inconnue': inat=3; break
	};	
	if (tabnat[inat]) { tabnat[inat] = false; } else { tabnat[inat] = true; }
	nature = 'tout';
	if (tabnat[0]) { nature += 'forage'; }
	if (tabnat[1]) { nature += 'source'; }
	if (tabnat[2]) { nature += 'puits'; }
	if (tabnat[3]) { nature += 'inconnue'; }
	
	if (balise.src.indexOf('_on') != -1) {
		balise.src = balise.src.replace('on', 'off');
	} else {
		balise.src = balise.src.replace('off', 'on');
	}		
	redrawStations();
}

function icotyp(balise) { // pour les démonstrateurs eau superficielle continentale acceptant un paramètre nature (type entité hydro)
	// en paramètre get, entrer nature=1 pour les plans d'eau, nature=2 pour les cours d'eau
	var snatclic = balise.title.toLowerCase();
	switch (snatclic) {
		case "plan d'eau": inat=0; break
		case "cours d'eau": inat=1; break
	};	
	if (tabnat[inat]) { tabnat[inat] = false; } else { tabnat[inat] = true; }
	nature = 'tout';
	if (tabnat[0]) { nature += '1'; }
	if (tabnat[1]) { nature += '2'; }
	
	if (balise.src.indexOf('_on') != -1) {
		balise.src = balise.src.replace('on', 'off');
	} else {
		balise.src = balise.src.replace('off', 'on');
	}		
	redrawStations();
}

function icoapp(balise) { // pour les démonstrateurs eau superficielle continentale acceptant un paramètre nature (type station = type appareillage)
	// en paramètre get, entrer nature=limni pour les limnimètres, nature=deb pour les débitmètres
	var snatclic = balise.title.toLowerCase();
	switch (snatclic) {
		case "limni": inat=0; break
		case "deb": inat=1; break
	};	
	if (tabnat[inat]) { tabnat[inat] = false; } else { tabnat[inat] = true; }
	nature = 'tout';
	if (tabnat[0]) { nature += 'limni'; }
	if (tabnat[1]) { nature += 'deb'; }
	
	if (balise.src.indexOf('_on') != -1) {
		balise.src = balise.src.replace('on', 'off');
	} else {
		balise.src = balise.src.replace('off', 'on');
	}		
	redrawStations();
}

function icomil(balise) { // pour les démonstrateurs acceptant un paramètre nature correspondant au milieu
	// en paramètre GET, entrer nature=sout, cont ou lit
	var snatclic = balise.title.toLowerCase();
	switch (snatclic) {
		case 'sout': inat=0; break
		case 'cont': inat=1; break
		case 'lit': inat=2; break
	};	
	if (tabnat[inat]) { tabnat[inat] = false; } else { tabnat[inat] = true; }
	nature = 'tout';
	if (tabnat[0]) { nature += 'sout'; }
	if (tabnat[1]) { nature += 'cont'; }
	if (tabnat[2]) { nature += 'lit'; }
	
	if (balise.src.indexOf('_on') != -1) {
		balise.src = balise.src.replace('on', 'off');
	} else {
		balise.src = balise.src.replace('off', 'on');
	}		
	redrawStations();
}

function tailleCarte() {
	dm =  document.getElementById('basicMap'); 
	//l = 162 + (npt*26);
	//dm.style.height = l + "px";	
	//dm.style.width = l + "px";
	//map.updateSize();	
}

function zoomToPiezos() {	
	// zoom sur tout 
	//map.getView().fit(markerSource.getExtent(), map.getSize());
	//map.getView().setZoom(map.getView().getZoom()-1);
	// zoom sur France métro
	map.getView().setCenter(ol.proj.fromLonLat([2.571723, 46.4975481]));
	map.getView().setZoom(6);

}

function addPiezoToMap() {
		// *** remplit markerSource avec toutes les stations de mesure ***
		// slong = nom du champ longitude des stations, slat = id pour latitude. ex: ('longitude_station','latitude_station') pour hydro_tr, ('longx','laty') pour piezo_tr
		// scode = nom du champ code station. ex: 'code_station' ou 'bss_id'. Sera mis dans 'codesta' de chaque point
		// slib = nom du champ libelle station. ex: 'libelle_station', 'nompe'. Sera mis dans 'libpe' de chaque point
		// smeau = nom du 3e champ descriptif (parfois non utilisé). ex: 'libelle_cours_eau' pour hydro_tr, 'me' pour piezo_tr (nom masse d'eau). Sera mis dans 'meau' de chaque point
		// snbmes = nom du champ nb de données/mesures/analyses. ex: 'nbmes', 'nbmestr'. Peut ne pas exister ('')
		// snat = nom du champ nature ou type pour discriminer affichage. ex: 'natpe' pour qualnap, 'type_entite_hydro' pour qualriv. Peut ne pas exister ('')
		// sres = nom du champ résultat pour filtrer stations sur seuil de résultat maxi. ex: 'volmax' pour prel. Peut ne pas exister ('')
		
		//if (ipt == 0) { nbmin = 999999; nbmax = 0; }
		
		bnat = true; // 2021-08-17 paramètre général nature : permet de n'afficher que les stations d'une nature spécifique
		if ((typeof(snat) !== 'undefined') && (snat != '') && (nature != '') && (typeof(rep[ipt][snat]) !== 'undefined')) { // traitement nature
			nat = rep[ipt][snat].toLowerCase();  
			if (nature.indexOf(nat) == -1) { bnat = false; } // si la nature du point n'est pas trouvée dans la chaîne nature, on n'affiche pas le point
		}

		//bsupport = true; // 2021-08-19 paramètre général code_support : permet de n'afficher que les stations d'un support spécifique
		// on utilise bnat
		if ((typeof(ssupport) !== 'undefined') && (ssupport != '') && (code_support != '') && (typeof(rep[ipt][ssupport]) !== 'undefined')) { // traitement support
			var tabsup = rep[ipt][ssupport];
			if ((tabsup.indexOf(code_support.toString()) == -1) && (tabsup.indexOf(parseInt(code_support, 10)) == -1)) { bnat = false; } // si le support du point n'est pas trouvé dans le tableau tabsup, on n'affiche pas le point
			//console.log(bnat, tabsup, code_support, code_support.toString(), parseInt(code_support, 10));
		}

		// 2021-08-31 tableau des paramètres pour chaque station. du coup relancer la carte à chaque chgmt de paramètre. et avoir un booléen qui indique si on change stations à chaque chgmt de paramètres ou pas
		// ds liste déroulante : ne proposer que les paramètres dispos à la station sélectionnée? ou alors 1) params dispos puis 2) autres params
		// pas sûr de vouloir mettre en place ce système
		/*
		if ((typeof(sparam) !== 'undefined') && (sparam != '') && (typeof(rep[ipt][sparam]) !== 'undefined')) { // traitement params
			//if (ipt==1) {console.log(grandeur, rep[ipt][sparam][grandeur]);}	// grandeur n'est pas encore défini à ce moment
			if ((typeof(rep[ipt][sparam][grandeur]) === 'undefined')) { bnat = false; }
		}
		*/
		
		// 2022-08-01 parametre général resmin : n'affiche que les stations dont un des résultats est supérieur à seuil. on utilise bnat
		if ((typeof(sres) !== 'undefined') && (sres != '') && (typeof(seuil) !== 'undefined') && (seuil != '') && (typeof(rep[ipt][sres]) !== 'undefined')) { // traitement seuil
			res = rep[ipt][sres];  
			if (res < seuil) { bnat = false; } // si le résultat maxi de la station est inférieur à seuil, on n'affiche pas cette station
		}
		
		if (bnat && ((snbmes == '') || (rep[ipt][snbmes] >= nbanamin)) && ((datefin == '') || (rep[ipt][sdatefin] >= datefin)) && ((datedeb == '') || (rep[ipt][sdatedeb] <= datedeb))) {
			x = rep[ipt][slong];
			y = rep[ipt][slat];
			markerPiezoFeature[ipt] = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y]))
			});
			//markerPiezoFeature[ipt].setStyle(iconPiezoStyle);
			markerPiezoFeature[ipt].set(scode, rep[ipt][scode]); // 2021-07-22 remplacement de name par codesta, 2021-08-09, remplacement par variable scode
			markerPiezoFeature[ipt].set(slib, rep[ipt][slib]);
			markerPiezoFeature[ipt].set(smeau, rep[ipt][smeau]);
			if (typeof(sres) !== 'undefined') { markerPiezoFeature[ipt].set(sres, rep[ipt][sres]); }  // 2022-08-01
			markerPiezoFeature[ipt].set('ipt', ipt); // 2021-08-16 ajout du n° d'ordre ipt qui permet de faire le lien avec le tableau rep des stations (comme pour cc.js)
			markerSource.addFeature(markerPiezoFeature[ipt]);
			// 2021-08-26 stats
			/* ça ralentit beaucoup
			if (snbmes != '') { 
				if (rep[ipt][snbmes] < nbmin) { nbmin = rep[ipt][snbmes]; };
				if (rep[ipt][snbmes] > nbmax) { nbmax = rep[ipt][snbmes]; };
			} */
		}
}


function create_layer_station() { 
	tabbss = new Array(); // 2021-08-27 tableau des codes stations indiquant le n° d'ordre ipt
	nbanamin = 0; // 2021-08-16 nbanamin ajouté comme paramètre général. Il faut que le jeu de données des stations comporte un champ nb de données/mesures/analyses. 2021-08-24 nom du paramètre changé en nbobsmin pour être mieux représentatif des données de tous les démonstrateurs
	if ((typeof(f['nbobsmin']) !== 'undefined') && (snbmes != '')) { 
		if (f['nbobsmin'] > 0) {
			nbanamin = f['nbobsmin'];
			if (typeof(document.getElementById("val6")) !== 'undefined') { 
				document.getElementById("val6").value = nbanamin;
			}
		}	
	}

	datefin = '';
	datedeb = '';
	// TODO : afficher sélecteur pour choisir année interactivement ou mieux sélecteur qui propose tous les paramètres : nbobsmin, datedeb, datefin, coord, code_station. Plus convivial et permet de ne pas recharger la page à chaque fois
	if ((typeof(f['datefin']) !== 'undefined') && (typeof(sdatefin) !== 'undefined') && (sdatefin != '')) {  // 2021-08-24 datefin ajouté comme paramètre général pour n'afficher que les stations qui ont des données postérieures à datefin. sdatefin doit être défini dans le démonstrateur appelant.
		// tester validité date (format YYYY-MM-DD ou YYYY-MM ou YYYY)
		datefin = f['datefin'];
		if (typeof(document.getElementById("val4")) !== 'undefined') { 
			document.getElementById("val4").value = datefin;
		}
	}

	if ((typeof(f['datedeb']) !== 'undefined') && (typeof(sdatedeb) !== 'undefined')  && (sdatedeb != '')) {  // 2021-08-24 datedeb ajouté comme paramètre général pour n'afficher que les stations qui ont des données antérieures à datedeb. sdatedeb doit être défini dans le démonstrateur appelant.
		datedeb = f['datedeb'];
		if (typeof(document.getElementById("val3")) !== 'undefined') { 
			document.getElementById("val3").value = datedeb;
		}
	}
	
	if ((typeof(snat) !== 'undefined') && (snat != '')) { // 2021-08-17 il y a un traitement de nature (type de station). Appeler la procédure spécifique à chaque démonstrateur le prenant en charge
		init_nat();
	}

	if (typeof(f['seuil']) !== 'undefined') { // 2022-08-01
		seuil = f['seuil'];
	}

	if (station_layer_type != 'geojson') {
		markerPiezoFeature = new Array();
		markerSource = new ol.source.Vector({
		});
		for (ipt = 0; ipt < rep.length; ipt++) {
			tabbss[rep[ipt][scode]] = ipt;
			addPiezoToMap();
		}
		if (document.getElementById("etat")) { 
			document.getElementById("etat").innerHTML = markerSource.getFeatures().length + ' ' + setat;
			//document.getElementById("etat").innerHTML = markerSource.getFeatures().length + ' ' + setat + ' avec de ' + nbmin + ' à ' + nbmax + ' données';
		}

		markerLayer = new ol.layer.Vector({
			source: markerSource, 
				style: function(feature, resolution) {
					if ((typeof(snat) !== 'undefined') && (typeof(rep[0][snat]) !== 'undefined')) { // special qualnap : 3 couleurs. Le généraliser pour autres visualisateurs. Mutualisé avec qualriv et hydro_tr, hydro_elab
						//feature.get('natpe'); // Forage (orange), source (bleu) ou puits (mauve)
						var isty = feature.get('ipt');
						nat = rep[isty][snat];
						var k=0;
						if ((nat == 'Source') || (nat == '2') || (nat == 'DEB') || (nat == 'CONT')) { k = 1; };
						if ((nat == 'Puits') || (nat == 'LIT')) { k = 2; }
						if (nat == 'Inconnue') { k = 3; }
						iconStyle = iconPiezoNat[k];
					} else {		
						iconStyle = iconPiezoStyle;
					}	
					if (resolution > 150) {
						iconStyle.getImage().setScale(iconscale/Math.sqrt(resolution));
					} else { // la taille du symbole n'augmente plus passé un certain niveau de zoom (iconstyle divisé par 2.5 pour Hydrometrie.svg par rapport aux autres démonstrateurs)
						iconStyle.getImage().setScale(iconscale/12);
					}
					return iconStyle;				
					/*
					console.log(resolution);
					var z = map.getView().getZoom();
					  style = [new ol.style.Style({
						image: new ol.style.Circle({
						  radius: 20,
						  stroke: new ol.style.Stroke({
							color: '#fff'
						  }),
						  fill: new ol.style.Fill({
							color: '#3399CC'
						  })
						}),
					  })];
					return style;
					*/
				}
		});	
	} else { // traitement geojson 2021-08-08
		markerSource = new ol.source.Vector({
				format: new ol.format.GeoJSON(),
				url: station_layer_name
			  });
		markerLayer = new ol.layer.Vector({
		  source: markerSource,
				style: function(feature, resolution) {
					iconStyle = iconPiezoStyle;
					if (resolution > 150) {
						iconStyle.getImage().setScale(iconscale/Math.sqrt(resolution));
					} else { // la taille du symbole n'augmente plus passé un certain niveau de zoom (iconstyle divisé par 2.5 pour Hydrometrie.svg par rapport aux autres démonstrateurs)
						iconStyle.getImage().setScale(iconscale/12);
					}
					return iconStyle;				
				}	
		});
	}
}

function carte_commun() {
	// iconfile = nom du fichier contenant le picto à afficher pour les stations (doit être dans le sous-répertoire images. ex : 'Hydrometrie.svg' ou 'iconPiezo.svg'
	// iconscale = facteur d'échelle pour l'icône des stations (15 pour la plupart des démonstrateurs, 6 pour hydro_tr). La taille maxi du symbole sera iconscale/12.

	if (typeof(f['size']) !== 'undefined') { 
		if (!isNaN(f['size'])) {
			size = f['size']; // nb de données à récupérer dans la réponse hub'eau
		}	
		if (size > 20000 && grandeur != 'piezo') { size = 20000; }
	}
	
	blimit = false; // 2021-08-24 paramètre GET limit=1, true, oui, o ou yes pour tracer limite ou ref de qualité sur graphique
	// pour eso : https://www.legifrance.gouv.fr/loda/id/LEGIARTI000032789885/2016-06-27/
	// NQE esu : https://substances.ineris.fr/fr/substance/getDocument/3490 et https://aida.ineris.fr/consultation_document/4159 + normes eau potable https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000465574/
	// arrêté 2018 : https://www.legifrance.gouv.fr/download/file/vnWMBApAUzS-98Ro7fb1RlsDFihSq-tW46KWa2ISZzs=/JOE_TEXTE
	if (typeof(f['limit']) !== 'undefined') { 
		if ((f['limit'].toLowerCase() == 'oui') || (f['limit'].toLowerCase() == 'yes') || (f['limit'].toLowerCase() == 'true') || (f['limit'].toLowerCase() == '1') || (f['limit'].toLowerCase() == 'o')) {
			blimit = true;
		}	
	}

	// 2022-08-02 prise en compte du paramètre GET resdeb : date de début de la récupération des données et du tracé des graphiques
	if (typeof(f['resdeb']) !== 'undefined') { 
		resdeb = f['resdeb'];
	}

	classbss = document.getElementById("station"); // id était "bss" avant dans .htm
	classlibpe = document.getElementById("libpe");
	classcode = document.getElementById("code");
    overviewMapControl = new ol.control.OverviewMap({
        className: 'ol-overviewmap ol-custom-overviewmap',
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        collapseLabel: '\u00BB',
        label: '\u00AB',
		tipLabel: 'Ouvrir ou fermer la mini-carte',
        collapsed: false,
		view: new ol.View({
          center: ol.proj.fromLonLat([2.571723, 46.4975481]),
		  maxZoom: 3,
		  minZoom: 1,
		  zoom: 3
		})
	});

	// icone des stations de mesure
   	iconPiezoStyle = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],
		  anchorXUnits: 'fraction',
		  anchorYUnits: 'pixels',
		  opacity: 1.0,
		  src: 'images/' + iconfile
		}))
    });

//clusteriser pour la vue générale ! pose des problèmes... evnmts click et pointermove non reconnus
/*
clusterSource = new ol.source.Cluster({
  distance: 40,
  source: markerSource
});

var styleCache = {};
var markerLayer = new ol.layer.Vector({
  source: clusterSource,
  style: function(feature, resolution) {
    var z = map.getView().getZoom();
	var size = feature.get('features').length;
	if (size > 1) {
		var style = styleCache[size];
		if (!style) {
		  style = [new ol.style.Style({
			image: new ol.style.Circle({
			  radius: 20 + size * z * z / 1500,  //20
			  stroke: new ol.style.Stroke({
				color: '#fff'
			  }),
			  fill: new ol.style.Fill({
				color: '#3399CC'
			  })
			}),
			text: new ol.style.Text({
			  text: size.toString(),
			  fill: new ol.style.Fill({
				color: '#fff'
			  })
			})
		  })];
		  styleCache[size] = style;
		}
	} else {	
		style = iconPiezoStyle;
	}
    return style;
  }
});	

map.on('click', (e) => {
  clusters.getFeatures(e.pixel).then((clickedFeatures) => {
    if (clickedFeatures.length) {
      // Get clustered Coordinates
      const features = clickedFeatures[0].get('features');
      if (features.length > 1) {
        const extent = boundingExtent(
          features.map((r) => r.getGeometry().getCoordinates())
        );
        map.getView().fit(extent, {duration: 1000, padding: [50, 50, 50, 50]});
      }
    }
  });
});
*/

// Layer Adresse
	iconAdrStyle = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, 44],
		  anchorXUnits: 'fraction',
		  anchorYUnits: 'pixels',
		  opacity: 1.0,
		  src: 'images/Marker.svg'
		}))
    });
	iconInvisibleStyle = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, 44],
		  anchorXUnits: 'fraction',
		  anchorYUnits: 'pixels',
		  opacity: 0.0,
		  src: 'images/Marker.svg'
		}))
    });
	AdrFeature = new ol.Feature({
		geometry: new ol.geom.Point(ol.proj.fromLonLat([0.0, -80.0]))
	});
	//AdrFeature.setStyle(iconInvisibleStyle);
	AdrSource = new ol.source.Vector({
	});
	AdrSource.addFeature(AdrFeature);
	AdrLayer = new ol.layer.Vector({
		source: AdrSource, 
			style: function(feature, resolution) {
				iStyle = iconAdrStyle;
				if (resolution > 150) {
					iStyle.getImage().setScale(12/Math.sqrt(resolution));
				} else { // la taille du symbole n'augmente plus passé un certain niveau de zoom
					iStyle.getImage().setScale(1);
				}
				return iStyle;				
			}
	});	

	view = new ol.View({
		center: ol.proj.fromLonLat([2.571723, 46.4975481]),
		zoom: 4
	});
  
	scaleLineControl = new ol.control.ScaleLine();
	attribution = new ol.control.Attribution({
	  collapsible: false,
	  collapsed: false
	});

	// base layers
	if (typeof(f['fdp']) !== 'undefined') { 
		switch (f['fdp']) {
		  case '1':
		  case 'osm1':
			fdp = 'osm1';
			break;
		  case '2':
		  case 'jawg2':
			fdp = 'jawg2';
			break;
		  case '3':
		  case 'esri_topo3':
			fdp = 'esri_topo3';
			break;
		  case '4':
		  case 'stadia_bright4':
			fdp = 'stadia_bright4';
			break;
		  case '5':
		  case 'ign_plan5':
			fdp = 'ign_plan5';
			break;
		  case '6':
		  case 'ign_ortho6':
			fdp = 'ign_ortho6';
			break;
		  case '7':
		  case 'brgm_geol7':
			fdp = 'brgm_geol7';
			break;
		  default:
			console.log('Mauvais fond de plan passé en paramètre');
		}
	}	
	// Layer Group https://www.youtube.com/watch?v=k4b3nqDHCIU
	baseLayerGroup = new ol.layer.Group({
	  title: 'Fonds de carte',
	  layers: []
	});	
	if (fp7) {
		geolWMSsource = new ol.source.ImageWMS({
			url: 'http://geoservices.brgm.fr/geologie?language=fre&',
			params: {'LAYERS': ['GEOLOGIE','GEOLOGIE_OUTRE_MER'], srs: 'EPSG:4326', format: 'png'},
			//params: {'LAYERS': 'LITHO_1M_SIMPLIFIEE', srs: 'EPSG:4326', format: 'png'}, bien mais on ne peut pas se repérer + pas de légende. le proposer en layer descriptif? (gérer opacité)
			ratio: 1,
			serverType: 'mapserver',
			crossOrigin: 'anonymous',
			attributions: '&copy; BRGM'	
		}),		
		brgm_geol7 = new ol.layer.Image({
			source: geolWMSsource, 
			title: 'BRGM géologie',
			type: 'base', // pour layerSwitcher
			reproject: true,
			visible: (fdp == 'brgm_geol7')	
		});
		baseLayerGroup.getLayers().push(brgm_geol7);
	}	
	if (fp6) {
		orthoWMSsource = new ol.source.ImageWMS({
			url: 'https://wxs.ign.fr/choisirgeoportail/geoportail/r/wms?',
			params: {'LAYERS': 'ORTHOIMAGERY.ORTHOPHOTOS.BDORTHO', srs: 'EPSG:4326', format: 'png'},
			ratio: 1,
			serverType: 'mapserver',
			crossOrigin: 'anonymous',
			attributions: '&copy; IGN'	
		}),		
		ign_ortho6 = new ol.layer.Image({
			source: orthoWMSsource, 
			title: 'IGN BD Ortho',
			type: 'base', // pour layerSwitcher
			reproject: true,
			visible: (fdp == 'ign_ortho6')	
		});
		baseLayerGroup.getLayers().push(ign_ortho6);
	}	
	if (fp5) {
		planWMSsource = new ol.source.ImageWMS({
			url: 'https://wxs.ign.fr/choisirgeoportail/geoportail/r/wms?',
			params: {'LAYERS': 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', srs: 'EPSG:4326', format: 'png'},
			ratio: 1,
			serverType: 'mapserver',
			crossOrigin: 'anonymous',
			attributions: '&copy; IGN'	
		}),		
		ign_plan5 = new ol.layer.Image({
			source: planWMSsource, 
			title: 'IGN plan v2',
			type: 'base', // pour layerSwitcher
			reproject: true,
			visible: (fdp == 'ign_plan5')	
		});
		baseLayerGroup.getLayers().push(ign_plan5);
	}	
	if (fp4) {
		// ne marche que sur domaine hubeau.eaufrance.fr, même pas?
		stadia_bright4 = new ol.layer.Tile({
			source: new ol.source.XYZ({
				url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png',
				attributions: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
			}),
			title: 'Stadia Bright',
			type: 'base',
			visible: (fdp == 'stadia_brigth4')	
		});
		baseLayerGroup.getLayers().push(stadia_bright4);
	}	
	if (fp3) {
		esri_topo3 = new ol.layer.Tile({
			source: new ol.source.XYZ({
				url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
				attributions: 'Tiles &copy; Esri'
			}),
			title: 'ESRI topo',
			type: 'base', // pour layerSwitcher
			visible: (fdp == 'esri_topo3')	
		});
		baseLayerGroup.getLayers().push(esri_topo3);
	}	
	if (fp2) {
		jawg2 = new ol.layer.Tile({
			source: new ol.source.XYZ({
				url: 'https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}.png?access-token=biamPHMuFXLC0UIpyzRgZ7zrnttyG9KYdc8bS4xb8tT7OoSpwy2BZN6tHA6OpzIT',
				attributions: '<a href="http://jawg.io" title="Tiles Courtesy of Jawg Maps" target="_blank">&copy; <b>Jawg</b>Maps</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
			}),
			title: 'JAWG terrain',
			type: 'base', // pour layerSwitcher
			visible: (fdp == 'jawg2')	
		});
		baseLayerGroup.getLayers().push(jawg2);
	}	
	if (fp1) {
		osm1 = new ol.layer.Tile({
			source: new ol.source.OSM(),
			title: 'OSM standard',
			type: 'base', // pour layerSwitcher
			visible: (fdp == 'osm1')	
		});
		baseLayerGroup.getLayers().push(osm1);
	}	
		
	map = new ol.Map({
	  target: 'basicMap',
	  controls: ol.control.defaults({attribution: false}).extend([
        overviewMapControl,
		scaleLineControl,
		attribution
	  ]),
	  interactions: ol.interaction.defaults().extend([
		new ol.interaction.DragRotateAndZoom()
	  ]),
	  layers: [
		baseLayerGroup
		, markerLayer, AdrLayer],
	  view: view
	});
	/*
	attribution.setCollapsible(true);
	attribution.setCollapsed(true);
	*/
	tailleCarte();
	zoomToPiezos();	
	
	// 2021-07-27  https://github.com/walkermatt/ol-layerswitcher/blob/master/examples/layerswitcher.js	
	var layerSwitcher = new ol.control.LayerSwitcher({
		reverse: true,
		tipLabel: 'Légende', // Optional label for button
		groupSelectStyle: 'group' // Can be 'children' [default], 'group' or 'none'
	});
	map.addControl(layerSwitcher);
	
	
	//https://www.developpez.net/forums/d1670841/applications/sig-systeme-d-information-geographique/ign-api-geoportail/affichage-popups-l-extension-openlayers/
	map.on('singleclick', function(evt) {
	  feat = map.forEachFeatureAtPixel(evt.pixel,
		  function(feat, layer) {
			return feat;
		  });
	  if (feat) {
		bss = feat.get(scode);
		if (bss) { // 2021-07-16 ajout test pour ne pas lancer le traitement si on clique sur la goutte bleue de localisation
			traitement_station(); // propre à chaque démonstrateur
		}	
	  }	
    });		
	
	// *** penser à déclarer les div dans le document htm chapeau ***
	container = document.getElementById('popup');
	content = document.getElementById('popupcontent');
	closer = document.getElementById('popupcloser');	
	// change mouse cursor when over marker
	map.on('pointermove', function(e) {
		  var pixel = map.getEventPixel(e.originalEvent);
		  var hit = map.hasFeatureAtPixel(pixel);
		  dm.style.cursor = hit ? 'pointer' : '';

		  if (hit) {	
			var feat = map.forEachFeatureAtPixel(e.pixel,
			  function(feat, layer) {
				return feat;
			  });
			  if (feat && feat.get(scode)) { 
					coord = e.coordinate;
					//coord = feat.getGeometry().getCoordinates();
					var j = feat.get('ipt');
					infobulle(feat, j); // 2022-08-05 contenu de l'infobulle, spécifique à chaque démonstrateur
					/*
					content.innerHTML = feat.get(scode) + ' - ' + feat.get(slib);
					
					// faire plutôt une procédure dans le js de chaque démonstrateur
					if (typeof(rep[0]['nbana']) !== 'undefined') { // affichage nb de mesures/analyses + prel, special qualnap
						var j = feat.get('ipt');
						content.innerHTML += '<br>' + rep[j]['nbprel'] + ' prélèvements et ' + rep[j]['nbana'] + ' analyses du ' + convertDateISO(rep[j]['datedeb']) + ' au ' + convertDateISO(rep[j]['datefin']); // pour qualnap, le généraliser
					}
					if (typeof(prefix) !== 'undefined') { // special cc et qualriv
						var j = feat.get('ipt');
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
						// qualriv. faire boucle sur tous les prefix possibles sauf tem
						//for (var i in supopt_code) { // pour avoir les supports dans le bon ordre
						if (rep[j]['eau_nbobs'] > 0) {
							content.innerHTML += '<br>sur eau : ' + rep[j]['eau_nbprel'] + ' prélèvements et ' + rep[j]['eau_nbobs'] + ' analyses de ' + convertAnneeISO(rep[j]['eau_datedeb']) + ' à ' + convertAnneeISO(rep[j]['eau_datefin']);
						}	
						if (rep[j]['sed_nbobs'] > 0) {
							content.innerHTML += '<br>sur sédiments : ' + rep[j]['sed_nbprel'] + ' prélèvements et ' + rep[j]['sed_nbobs'] + ' analyses de ' + convertAnneeISO(rep[j]['sed_datedeb']) + ' à ' + convertAnneeISO(rep[j]['sed_datefin']);
						}	
						if (rep[j]['dia_nbobs'] > 0) {
							content.innerHTML += '<br>sur diatomées : ' + rep[j]['dia_nbprel'] + ' prélèvements et ' + rep[j]['dia_nbobs'] + ' indices de ' + convertAnneeISO(rep[j]['dia_datedeb']) + ' à ' + convertAnneeISO(rep[j]['dia_datefin']);
						}	
						if (rep[j]['inv_nbobs'] > 0) {
							content.innerHTML += '<br>sur invertébrés : ' + rep[j]['inv_nbprel'] + ' prélèvements et ' + rep[j]['inv_nbobs'] + ' indices de ' + convertAnneeISO(rep[j]['inv_datedeb']) + ' à ' + convertAnneeISO(rep[j]['inv_datefin']);
						}	
						if (rep[j]['phy_nbobs'] > 0) {
							content.innerHTML += '<br>sur macrophytes : ' + rep[j]['phy_nbprel'] + ' prélèvements et ' + rep[j]['phy_nbobs'] + ' indices de ' + convertAnneeISO(rep[j]['phy_datedeb']) + ' à ' + convertAnneeISO(rep[j]['phy_datefin']);
						}	
						if (rep[j]['poi_nbobs'] > 0) {
							content.innerHTML += '<br>sur poissons : ' + rep[j]['poi_nbprel'] + ' prélèvements et ' + rep[j]['poi_nbobs'] + ' indices de ' + convertAnneeISO(rep[j]['poi_datedeb']) + ' à ' + convertAnneeISO(rep[j]['poi_datefin']);
						}	
						if (rep[j]['tem_nbobs'] > 0) {
							content.innerHTML += '<br>température en continu : ' + rep[j]['tem_nbobs'] + ' mesures de ' + convertAnneeISO(rep[j]['tem_datedeb']) + ' à ' + convertAnneeISO(rep[j]['tem_datefin']);
						}	
					}
					if (typeof(rep[0]['nbqmj']) !== 'undefined') { // special hydro_elab
						var j = feat.get('ipt');
						if (rep[j]['nbqmj'] > 0) { content.innerHTML += '<br>' + rep[j]['nbqmj'] + ' débits moyens journaliers à partir du ' + convertDateISO(rep[j]['datedeb_qmj']); }
						if (rep[j]['nbqmm'] > 0) { content.innerHTML += '<br>' + rep[j]['nbqmm'] + ' débits moyens mensuels à partir de ' + convertMoisISO(rep[j]['datedeb_qmm']); }
					}
					if (typeof(rep[0]['nbobs']) !== 'undefined') { // special onde
						var j = feat.get('ipt');
						if (rep[j]['nbobs'] > 0) { content.innerHTML += '<br>' + rep[j]['nbobs'] + ' observations de ' + convertAnneeISO(rep[j]['datedeb']) + ' à ' + convertAnneeISO(rep[j]['datefin']); }
					}
					if (typeof(rep[0]['nbvol']) !== 'undefined') { // special prel
						var j = feat.get('ipt');
						if (rep[j]['nbvol'] > 0) { content.innerHTML += '<br>' + rep[j]['nbvol'] + ' volumes annuels de ' + rep[j]['anneedeb'] + ' à ' + rep[j]['anneefin'] + '<br>Volume maxi : ' + new Intl.NumberFormat().format(rep[j]['volmax']) + ' m3'; }
					}
					if (typeof(rep[0]['nbmes']) !== 'undefined') { // 2022-07-27 special piezo_chroniques + autres démonstrateurs qui ont un paramètre nbmes?
						var j = feat.get('ipt');
						if (rep[j]['nbmes'] > 0) { content.innerHTML += '<br>' + rep[j]['nbmes'] + ' mesures du ' + convertDateISO(rep[j]['datedeb']) + ' au ' + convertDateISO(rep[j]['datefin']) + '<br>Profondeur max : ' + new Intl.NumberFormat().format(rep[j]['profmax']) + ' m'; }
					}
					*/
					popup.setPosition(coord);
			  } else {
				popup.setPosition(undefined);
				dm.style.cursor = ''; // 2021-07-16 ne plus transformer le curseur en main au passage sur la goutte bleue de localisation
			  }
		  }		  
    });

	popup = new ol.Overlay({
	  element: container,
	  autoPanAnimation: {
		duration: 250
	  }
	});
	map.addOverlay(popup);
	popup.setPosition(undefined);	
	
	bton_fm = document.getElementById('bton_fm');
	bton_fm.onclick = function() {
		map.getView().setCenter(ol.proj.fromLonLat([2.571723, 46.4975481]));
		map.getView().setZoom(6);
	};				
	bton_pp = document.getElementById('bton_pp');
	bton_pp.onclick = function() {
		map.getView().fit(markerSource.getExtent(), map.getSize());
		//map.getView().setZoom(map.getView().getZoom()-1);
	};		
	aide = document.getElementById('aide');
	aide.onclick = function() {
		document.getElementById('fen_aide').style.display = 'block'; 
	};		
	fen_aide = document.getElementById('fen_aide');
	fen_aide.onclick = function() {
		document.getElementById('fen_aide').style.display = 'none';
	};

	if (typeof(f['adresse']) !== 'undefined') { 
		document.getElementById("adresse").value = replaceAll('%20',' ',f['adresse']);
		get_adresse();
	}
	
	if (typeof(f['coord']) !== 'undefined') { 
		lonlat = f['coord'].split(',');
		//console.log(lonlat);
		if (!isNaN(lonlat[0]) && !isNaN(lonlat[1])) {
			longit = parseFloat(lonlat[0]);
			latit = parseFloat(lonlat[1]);
			//console.log(longit, latit);
			coordinate = ol.proj.fromLonLat([longit, latit]);
			//console.log(coordinate);
			AdrFeature.getGeometry().setCoordinates(coordinate);
			map.getView().setCenter(coordinate);
			map.getView().setZoom(12);  
		} else {
			console.log('Les coordonnées entrées en paramètres ont été ignorées car incorrectes : longitude = ' + lonlat[0] + ', latitude = ' + lonlat[1]);
		}	
	}

	if (typeof(f['code_station']) !== 'undefined') { 
		// il y a un paramètre code_station dans l'URL
		bss = f['code_station'];
		// rechercher la feature qui a bss en codesta, chercher dans rep[ipt][scode]
		/*
		if (typeof(tabbss[bss]) !== 'undefined') { 
			ipt = tabbss[bss];
			x = rep[ipt][slong];
			y = rep[ipt][slat];
			var coord = ol.proj.fromLonLat([x, y]);
			AdrFeature.getGeometry().setCoordinates(coord);
			map.getView().setCenter(coord);
			map.getView().setZoom(12);
			traitement_station();
		}	
		*/
		/* changement 2021-08-27
		ifeat = -1;
		for (ipt = 0; ipt < rep.length; ipt++) {
			if (rep[ipt][scode] == bss) { ifeat = ipt }; // ne fonctionnera pas avec geojson qui ne passe pas par rep
		}
		if (ifeat != -1) {
		*/	
		if (typeof(tabbss[bss]) !== 'undefined') { // ne fonctionnera pas avec geojson qui ne passe pas par rep
			ipt = tabbss[bss];  
			if (typeof(markerPiezoFeature[ipt]) === 'undefined') { // la station existe mais n'est pas dans la source à cause d'autres critères (nature, nbobsmin, datedeb, datefin). L'ajouter sinon erreur
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
			feat = markerPiezoFeature[ipt]; // n'existe pas si la station n'est pas de la nature passée en paramètre
			coord = feat.getGeometry().getCoordinates();
			AdrFeature.getGeometry().setCoordinates(coord);
			map.getView().setCenter(coord);
			map.getView().setZoom(12);
			traitement_station();
		}	
	}
		//code_bss = replaceAll("%2F", "/", f['code_bss']).split(','); 
	
}	

function redrawStations() {
	markerSource.clear(true);
	for (ipt = 0; ipt < rep.length; ipt++) {
		addPiezoToMap();
	};
	if (document.getElementById("etat")) { 
		document.getElementById("etat").innerHTML = markerSource.getFeatures().length + ' ' + setat;
		//document.getElementById("etat").innerHTML = markerSource.getFeatures().length + ' ' + setat + ' avec de ' + nbmin + ' à ' + nbmax + ' données';
	}
}	

function redrawGraph() {
	if (typeof(bss) !== 'undefined') { 
		dm.style.cursor = "wait";
		document.getElementById("search").style.cursor = "wait";
		donnees_piezo(bss);
	}
}	

function event_params() {
	document.getElementById('climit').checked = blimit;
	document.getElementById('climit').onchange = function() {
		blimit = document.getElementById('climit').checked;
		redrawGraph();
	};

	document.getElementById('val6').onchange = function() { // oninput marche à chaque frappe de chiffre, avec onchange, le contrôle doit perdre le focus
		nbanamin_anc = nbanamin;
		if ((snbmes != '') && (document.getElementById("val6").value >= 0)) { 
			nbanamin = document.getElementById("val6").value;
			if (nbanamin_anc != nbanamin) { redrawStations(); }
		}
	};

	document.getElementById('val3').onchange = function() { 
		datedeb_anc = datedeb;
		if ((typeof(sdatedeb) !== 'undefined')  && (sdatedeb != '')) {  
			datedeb = document.getElementById("val3").value;
			if (datedeb_anc != datedeb) { redrawStations();  }
		}
	};	
	document.getElementById('val4').onchange = function() { 
		datefin_anc = datefin;
		if ((typeof(sdatefin) !== 'undefined')  && (sdatefin != '')) {  
			datefin = document.getElementById("val4").value;
			if (datefin_anc != datefin) { redrawStations();}
		}
	}
}