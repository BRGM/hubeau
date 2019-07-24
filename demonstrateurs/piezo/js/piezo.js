// *** piezo.js v1.0.0 2019-07-23 *** Fonctions js utilisées par piezo.htm ***

	function changeDpt() {
	/*
		s = 'piezo.htm?code_dpt=' + document.getElementById('code_dpt').value;
		if (npt > 0) {
			s += '&code_bss=' + code_bss;
		}
		self.location = s;
	*/
	// On ne recharge plus la page
	code_dpt = document.getElementById('code_dpt').value;
	remplitDpt();
	remplitPiezo();
	}	

function remplitDpt() {
	// remplit la liste déroulante code_dpt avec les codes et noms des départements. Pb de tri sur les codes
	var s = '';
	for(var obj of dpt)
	{
		var value = obj['nom'];
		var key = obj['code'];
		s = s + '<option ';
		if (code_dpt == key){ s = s +' selected="selected"'; }  
		s = s + ' value="' + key + '">' + key + ' - ' + value + '</option>';
	}
	var di = document.getElementById('code_dpt'); 
	di.innerHTML = '';
	di.insertAdjacentHTML('beforeend', s);
}	

function remplitPiezo() {
		// remplit la liste déroulante code_bss avec les piézomètres présents dans le département sélectionné
		var size = 8000;
		laty = new Array();
		longx = new Array();
		code_comm = new Array();
		code_dept = new Array();
		nom_comm = new Array();
		periode = new Array();
		nappes = new Array();
		var rep = JSON.parse(ajaxGet("https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?size=" + size + "&format=json"));
			var nbsta = rep.count;
			console.log(nbsta);
			var data = rep.data;
			//console.table(data);
			for (var i = 0; i < nbsta; i++) {
				code_commune = data[i]['code_commune_insee'];
				if (code_commune < '97000') {
					code_departement = code_commune.substring(0, 2);
				} else {
					code_departement = code_commune.substring(0, 3);
				}	
				// ne récupérer que les éléments qui ont valeur de code_dept[]=code_dpt  (soient les piézos qui sont dans le département sélectionné)
				// sauf nom_comm et nappes qui servent dans le tableau
						nom_comm[data[i]['code_bss']] = data[i]['nom_commune']; // encodeURI(
						//console.log("i="+i+" bss="+data[i]['code_bss']+" bdlisa="+data[i]['codes_bdlisa']);
						if (data[i]['codes_bdlisa'] !== null) {
							nappes[data[i]['code_bss']] = data[i]['codes_bdlisa'][0]; // URL fiche BDLISA = https://bdlisa.eaufrance.fr/hydrogeounit/<code_bdlisa>
						} else {
							nappes[data[i]['code_bss']] = '';
						}	
						laty[data[i]['code_bss']] = data[i]['y'];
						longx[data[i]['code_bss']] = data[i]['x'];
				if (code_departement == code_dpt) {
					codebss = data[i]['code_bss'];
					if (data[i]['date_debut_mesure'] !== null) { // éliminer les piézos qui n'ont pas de mesure
						periode[codebss] = data[i]['date_debut_mesure'].substring(0,4) + ' - ' + data[i]['date_fin_mesure'].substring(0,4);
						code_comm[codebss] = code_commune;
						code_dept[codebss] = code_departement;
						//console.log(nom_comm[codebss]);
					}
				}	
			}
			//console.table(nom_comm);

			ksort(code_dept); // classe le tableau selon les codes bss
			var s = '';
			for(var key in code_dept) {
				s = s +'<option '; 
				if (code_bss == key) { s = s + ' selected="selected"'; }  
				s = s + ' value="' + key + '">' + key + ' à ' + nom_comm[key] + ' (' + periode[key] + ')</option>';
			}
			var dd = document.getElementById('form2'); 
			dd.innerHTML = '';
			dd.insertAdjacentHTML('beforeend', '<input type="hidden" name="code_dpt" id="code_dpt" value="' + code_dpt + '">');
			var d = document.getElementById('code_bss'); 
			d.innerHTML = '';
			d.insertAdjacentHTML('beforeend', s);
}
	
function ligne_tableau(ipt) {
		lien_suppr = '<a onclick="supprPiezo(' + ipt + ');"title="Supprime le piézomètre">Supprimer</a>';
		var st = '';
		st = st + '	<tr id="tr'+ ipt + '"><td><a href="https://ades.eaufrance.fr/Fiche/PtEau?Code=' + code_bss[ipt] + '" target="_blank">' + code_bss[ipt] + '</a></td><td>' + nom_comm[code_bss[ipt]] + '</td><td align="right">' + nbmes[code_bss[ipt]] + '</td><td>';
		st = st + date_min[ipt] + '</td><td>' + date_max[ipt]; 
		st = st + '</td><td align="right">' + Intl.NumberFormat("en-IN", {maximumFractionDigits: 2, minimumFractionDigits: 2}).format(niv_min[ipt]);
		st = st + '</td><td align="right">' + Intl.NumberFormat("en-IN", {maximumFractionDigits: 2, minimumFractionDigits: 2}).format(niv_max[ipt]);
		st = st + '</td><td align="right"><a href="https://bdlisa.eaufrance.fr/hydrogeounit/' + nappes[code_bss[ipt]] + '" target="_blank">' + nappes[code_bss[ipt]] + '</a></td><td>'; // que 1ere nappe pour l'instant
		st = st + lien_suppr + '</td></tr>'; 
		var dt = document.getElementById('tableau'); 
		dt.insertAdjacentHTML('beforeend', st);
}	
	
function donnees_piezo(ipt) {
		jsondata = new Array();
		processed_json = new Array();   
		console.log("code_bss ds fonction graphique = " + code_bss[ipt]);
		var url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss=" + code_bss[ipt] + "&size=" + size + "&fields=date_mesure,niveau_nappe_eau&sort=asc"; 
		// timestamp_mesure est null si passé en fields, mais pas date_mesure
		var rep = JSON.parse(ajaxGet(url)); 
		jsondata = rep.data;
		console.log(jsondata.length);
		nbmes[code_bss[ipt]] = jsondata.length;
		
		date_min[ipt] = jsondata[0]['date_mesure']; // faire des tableaux avec indice code_bss[ipt] au lieu de ipt?
		date_max[ipt] = jsondata[jsondata.length-1]['date_mesure'];
		niv_min[ipt] = 5000;
		niv_max[ipt] = -1000;
		for(var key in jsondata) {
			jsondata[key]['date_mesure'] = Date.parse(jsondata[key]['date_mesure']);
			niv = jsondata[key]['niveau_nappe_eau'];
			processed_json.push([jsondata[key]['date_mesure'], niv]);
			if (niv < niv_min[ipt]) { niv_min[ipt] = niv; }
			if (niv > niv_max[ipt]) { niv_max[ipt] = niv; }
		}
		myChart.addSeries({
			name: code_bss[ipt],
			colorIndex: ipt,
			data: processed_json
		});

		//console.table(processed_json); 
		ligne_tableau(ipt);
		ecritLog('Piézo : ' + code_bss[ipt], function (reponse) {		});
}	

function urlPage() {
			var base = window.location.href.split('?');
			var u = document.getElementById('urlget'); 
			su = '<p>URL pour générer directement ce graphique : ';
			var url = base[0] +'?code_bss=';
			for (var i = 0; i < npt; i++) {
				url += code_bss[i];
				if (i < npt-1) { url += ','; }
			}		
			su += '<a href="' + url + '">' + url + '</a></p>'; 
			//console.log(su);
			u.innerHTML = su;
}
	
function ajoutePiezo() {
	if (npt < 1) { // il n'y a pas encore de piézo, document.getElementById("code_bss") est inconnu
		var selectForm = document.getElementById("form2");
		selectForm.submit();
	}
	npt++;
	console.log("npt="+npt);
	code_bss[npt-1] = document.getElementById('code_bss').value;
	ecritLog('Ajout piézo : ' + code_bss[npt-1], function (reponse) {	});
	donnees_piezo(npt-1);
	urlPage();
	addPiezoToMap(npt-1); 
	tailleCarte();
	zoomToPiezos();
}	

function supprPiezo(ipt) {
	ecritLog('Suppression piézo : ' + code_bss[ipt], function (reponse) {	});
	myChart.series[ipt].remove(true, true); // il faut recharger le graphique sinon périodes de temps incohérentes
	// enlever élement ipt du tableau code_bss, puis décaler les éléments suivants
	console.table("avant: " + code_bss);
	var dummy = code_bss.splice(ipt, 1);
	console.table("après: " + code_bss);
	var ligne = document.getElementById('tr' + ipt);
	ligne.innerHTML=''; // Ok mais les lignes id tr du tableau sont décalées pour les suppressions suivantes -> il faut rafraîchir le tableau entier
	var dummy = date_min.splice(ipt, 1);
	var dummy = date_max.splice(ipt, 1);
	var dummy = niv_min.splice(ipt, 1);
	var dummy = niv_max.splice(ipt, 1);
	if (npt == 1) {
		markerSource.clear();
	} else {
		markerSource.removeFeature(markerPiezoFeature[ipt]);
	}	
	var dummy = markerPiezoFeature.splice(ipt, 1);
	npt--;
	tailleCarte();
	zoomToPiezos();
	updateStyle();
	console.log("suppression pt n° "+ipt+" - reste "+npt+" pts");
	var dt = document.getElementById('tableau'); 
	dt.innerHTML='<TABLE id="tableau" COLS="8" BORDER="1" CELLPADDING="3" CELLSPACING="0">' + 
	  '<tr><th>Code BSS</th><th>Commune</th><th align="right">Nb Mesures</th><th>Début</th><th>Fin</th><th align="right">Niveau mini</th><th align="right">Niveau maxi</th><th>Entité hydrogéol.</th><th>Action</th></tr></TABLE>';
	for (var i = 0; i < npt; i++) {
		ligne_tableau(i);
	}		
	urlPage();
}	
	
function graphique(il, grandeur_hydro, titre_graph) {
//document.addEventListener('DOMContentLoaded', function () {
	myChart = Highcharts.stockChart('container', {
		chart: {
				type: 'scatter',
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
			formatter: function() {
				//return ''+ Highcharts.dateFormat('%e. %b %Y, %H:00', this.x) +': '+ this.y +' m NGF';
				return 'le '+ Highcharts.dateFormat('%e %b %Y', this.x) +' : '+ this.y +' m NGF';
			},
			shared: true
			//xDateFormat: '%Y-%m-%d',
			//valueDecimals: 2
		},
		legend: {
			backgroundColor: '#FFFFFF',
			enabled: true,
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
			text: '1jour'
			}, {
			type: 'month',
			count: 1,
			text: '1mois'
			}, {
			type: 'year',
			count: 1,
			text: '1an'
			}, {
			type: 'year',
			count: 10,
			text: '10ans'
			}, {
			type: 'all',
			text: 'Tout'
		  }]
		},
		title: {
			text: 'Niveau des nappes d\'eau souterraine'
		},
		xAxis: {
			type: 'datetime',
			visible: true
		},
		yAxis: {
			opposite: false,
			title: {
				enabled: true,
				text: 'Niveau (m NGF)',
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

	nbmes = new Array();
	niv_min = new Array();
	niv_max = new Array();
	date_min = new Array();
	date_max = new Array();
	size = 20000;
	for (ipt = 0; ipt < npt; ipt++) {
		donnees_piezo(ipt);
	}		
}

function tailleCarte() {
	dm =  document.getElementById('basicMap'); 
	l = 162 + (npt*26);
	dm.style.height = l + "px";	
	dm.style.width = l + "px";
	map.updateSize();	
}

function addPiezoToMap(ipt) {
		console.log("ipt="+ipt+" - code_bss="+code_bss[ipt]);
		x = longx[code_bss[ipt]];
		y = laty[code_bss[ipt]];
		markerPiezoFeature[ipt] = new ol.Feature({
			geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y]))
		});
		markerPiezoFeature[ipt].setStyle(iconPiezoStyle[ipt]);
		markerPiezoFeature[ipt].set('name', code_bss[ipt]);
		markerSource.addFeature(markerPiezoFeature[ipt]);
}

function updateStyle() {
	// remet les bonnes couleurs, en cas de suppression, sur le piézo de la carte et sur la courbe du graphique
	// sinon, lors du prochain ajout, 2 piézos auront la même couleur
	for (ipt = 0; ipt < npt; ipt++) {
		markerPiezoFeature[ipt].setStyle(iconPiezoStyle[ipt]);
		myChart.series[ipt].colorIndex = ipt;
		myChart.series[ipt].update(myChart.series[ipt].options);
	}

}

function zoomToPiezos() {	
	map.getView().fit(markerSource.getExtent(), map.getSize());
	map.getView().setZoom(map.getView().getZoom()-1);
	if (npt == 1) {
		map.getView().setZoom(13);
	}	
}

function carte() {
	iconPiezoStyle = new Array();
	iconPiezoStyle[0] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({		  
			anchor: [0.5, 34],		  
			anchorXUnits: 'fraction',		  
			anchorYUnits: 'pixels',		  
			opacity: 1.0,
			src: 'images/GM_Markers/paleblue_MarkerP.png'
		}))
	});
	iconPiezoStyle[1] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({		  anchor: [0.5, 34],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,
		  src: 'images/GM_Markers/brown_MarkerP.png'		}))
	});
	iconPiezoStyle[2] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({		  anchor: [0.5, 34],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,
		  src: 'images/GM_Markers/green_MarkerP.png'		}))
	});
	iconPiezoStyle[3] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({		  anchor: [0.5, 34],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,
		  src: 'images/GM_Markers/orange_MarkerP.png'		}))
	});
	iconPiezoStyle[4] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({		  anchor: [0.5, 34],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,
		  src: 'images/GM_Markers/blue_MarkerP.png'		}))
	});
	iconPiezoStyle[5] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({		  anchor: [0.5, 34],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,
		  src: 'images/GM_Markers/pink_MarkerP.png'		}))
	});
	iconPiezoStyle[6] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({		  anchor: [0.5, 34],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,
		  src: 'images/GM_Markers/yellow_MarkerP.png'		}))
	});
	iconPiezoStyle[7] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({		  anchor: [0.5, 34],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,
		  src: 'images/GM_Markers/darkgreen_MarkerP.png'		}))
	});
	iconPiezoStyle[8] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({		  anchor: [0.5, 34],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,
		  src: 'images/GM_Markers/red_MarkerP.png'		}))
	});
	for (i = 9; i < 18; i++) {
		iconPiezoStyle[i] = iconPiezoStyle[i-9];
	}	

	markerPiezoFeature = new Array();
	markerSource = new ol.source.Vector({
	});

	for (ipt = 0; ipt < npt; ipt++) {
		addPiezoToMap(ipt);
	}
	
	markerLayer = new ol.layer.Vector({
		source: markerSource
	});	
	view = new ol.View({
		center: ol.proj.fromLonLat([2.571723, 46.4975481]),
		zoom: 6
	});
  
	scaleLineControl = new ol.control.ScaleLine();
	attribution = new ol.control.Attribution({
	  collapsible: false,
	  collapsed: false
	});
	
	var pop = document.getElementById('popup');
    var content = document.getElementById('popup-content');
    var closer = document.getElementById('popup-closer');
	var overlay = new ol.Overlay({
        element: pop,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      });
	closer.onclick = function() {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
      };
	
	map = new ol.Map({
	  overlays: [overlay],
	  target: 'basicMap',
	  controls: ol.control.defaults({attribution: false}).extend([
		scaleLineControl,
		attribution
	  ]),
	  interactions: ol.interaction.defaults().extend([
		new ol.interaction.DragRotateAndZoom()
	  ]),
	  layers: [
		new ol.layer.Tile({
		  source: new ol.source.OSM()
		})
		, markerLayer],
	  view: view
	});
	attribution.setCollapsible(true);
	attribution.setCollapsed(true);
	tailleCarte();
	zoomToPiezos();	
	
	//https://www.developpez.net/forums/d1670841/applications/sig-systeme-d-information-geographique/ign-api-geoportail/affichage-popups-l-extension-openlayers/
	map.on('singleclick', function(evt) {
	  var feat = map.forEachFeatureAtPixel(evt.pixel,
		  function(feat, layer) {
			return feat;
		  });
	  if (feat) {
		var geometry = feat.getGeometry();
		var coordinate = geometry.getCoordinates();
        content.innerHTML = "<code>"+feat.get('name')+"</code>";
        overlay.setPosition(coordinate);
	  }	else {
		closer.onclick();
	  }	
    });		
	// change mouse cursor when over marker
	map.on('pointermove', function(e) {
	  if (e.dragging) {
		closer.onclick();
		return;
	  }
	  var pixel = map.getEventPixel(e.originalEvent);
	  var hit = map.hasFeatureAtPixel(pixel);
	  dm.style.cursor = hit ? 'pointer' : '';
	});
	
}
