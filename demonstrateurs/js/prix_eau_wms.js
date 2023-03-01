// *** prix_eau.js v1.0.0 2020-08-13 *** Fonctions js utilisées par prix_eau.htm ***
// *** prix_eau.js v2.0.0 2020-10-07 *** utilisation layer communes WMS ***

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

function get_adresse(){
		var adrval = document.getElementById("adresse").value;
		var url = "https://api-adresse.data.gouv.fr/search/?q=" + adrval + "&limit=1"; 
		var rep = JSON.parse(ajaxGet(url)); 
		if (rep.features[0]) {
			long = rep.features[0].geometry.coordinates[0];
			lat = rep.features[0].geometry.coordinates[1];
			coord = rep.features[0].geometry.coordinates;
			var coordinate = ol.proj.fromLonLat(coord);
			AdrFeature.getGeometry().setCoordinates(coordinate);
			//AdrFeature.setStyle(iconAdrStyle);
			map.getView().setCenter(coordinate);
			map.getView().setZoom(12); // 11
			// 2020-10-07 ne plus mettre de marqueur d'adresse mais émuler un clic dans la commune concernée (ne plus tracer AdrLayer)
			clic_commune(coordinate);
		}	else {
			AdrFeature.setStyle(iconInvisibleStyle);
		}
}

function convertDateISO(s) { 
	// convertit une date ISO (2019-07-10T02:05:20Z) en date usuelle (10/07/2019 02:05:20)
	return(s.substring(5, 7) + '/' + s.substring(0, 4));
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
		//var dt = document.getElementById('tableau'); 
		dtable.insertAdjacentHTML('beforeend', st);
}	
	
function donnees_piezo(bss) {
		//1ere version - data est rempli dans prix_eau.htm au début. Il contient toutes les communes et toutes les valeurs par années
		//v2 - on interroge hubeau
		var classdat = document.getElementById("dat");
		jsondata = new Array();
		processed_json = new Array();   

		// plusieurs réponses possibles par année, dont certaines peuvent être null -> interroger par année
		for(var an=2008; an<2020; an++) {
			var url = 'https://hubeau.eaufrance.fr/api/v0/indicateurs_services/services?code_commune=' + bss + '&type_service=AEP&annee=' + an;	
			var rep = JSON.parse(ajaxGet(url)); 
			jsondata = rep.data;
			somprix = 0;
			iprix = 0;
			for(var key in jsondata) {
				if (jsondata[key]['indicateurs']['D102.0'] > 0) {
					somprix = somprix + jsondata[key]['indicateurs']['D102.0'];
					iprix++;
				}	
			}	
			if (iprix > 0) { 
				derPrix = Math.round(somprix / iprix * 100) / 100;
				derAn = an;
				//console.log(an); console.log(derPrix);
				processed_json.push([an, derPrix]); 
			}
			//console.table(processed_json);
		}	
		
	if (processed_json.length > 0) {
		cl = 0;
		if (derPrix >=1.5 && derPrix <1.9) { cl = 1} else {
			if (derPrix >=1.9 && derPrix <2.3) { cl = 2} else {
				if (derPrix >=2.3) { cl = 3}
		}}		

		delayedAlert(derPrix*100); // pour afficher 2 chiffres après la virgule
		classdat.innerHTML = "Dernière année disponible : <b>" + derAn + "</b>";

		graphique();
		myChart.addSeries({
			name: 'Prix au m3',
			colorIndex: 1,
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
		});
		/*
		myChart.addSeries({
			name: 'Débit',
			colorIndex: 2,
			yAxis: 1,
			data: processed_q
		});
		*/
		//console.table(processed_json); 
		//ligne_tableau(ipt);
		//ecritLog('Piézo : ' + code_bss[ipt], function (reponse) {		});
	}
		
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
	
function graphique() {
	//myChart = Highcharts.stockChart('container', {
	myChart = Highcharts.chart('container', {
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
			/*
			column: {
				pointPadding: 0.2,
				borderWidth: 0,
				groupPadding: 0,
				color: '#0000FF',
				shadow: false
			}
			*/
			scatter: {
				lineWidth: 1, 
				marker: {
					radius: 3,
					enabled: true
				},
			}
		},
		tooltip: {
			useHTML: true,
			formatter: function() {
				//return ''+ Highcharts.dateFormat('%e. %b %Y, %H:00', this.x) +': '+ this.y +' m NGF';
				//return '<u>' + this.series.name + '</u><br>le '+ Highcharts.dateFormat('%e %b %Y à %H:%M', this.x) +' : <b>'+ Highcharts.numberFormat(this.y,3,'.',' ') +'</b> m3/s';
				return this.x +' : <b>'+ Highcharts.numberFormat(this.y,2,'.',' ') +'</b> €/m3';
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
		/*
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
		*/
		title: {
			text: 'Prix de l\'eau au m3',
			style: {
				color: '#333333',
				fontSize: '12px'
				//fontWeight: 'bold'
			}
		},
		xAxis: {
			//type: 'datetime',
			visible: true
		},
		yAxis: [{
			reversed: false,
			opposite: false,
			//min : deb_min,
			//max : deb_max,
			title: {
				enabled: true,
				text: 'Prix (€/m3)',
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

function tailleCarte() {
	dm =  document.getElementById('basicMap'); 
	//l = 162 + (npt*26);
	//dm.style.height = l + "px";	
	//dm.style.width = l + "px";
	//map.updateSize();	
}

function addPiezoToMap() {
		/*
		var url1 = "https://hubeau.eaufrance.fr/api/v1/hydrometrie/observations_tr?code_entite=" + rep[ipt]['code_station'] + "&grandeur_hydro=Q&size=1&sort=desc"; 
		console.log(url1);
		var rep1 = JSON.parse(ajaxGet(url1)); 
		json1 = rep1.data;
		if (json1.length > 0) { */
			//console.log("ipt="+ipt+" - bss_id="+rep[ipt]['bss_id']);
			x = rep[ipt]['LONG'];
			y = rep[ipt]['LAT'];
			markerPiezoFeature[ipt] = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y]))
			});
			var der = rep[ipt]['DERNIER'];
			var cl = 0;
			if (der >=1.5 && der <1.9) { cl = 1} else {
				if (der >=1.9 && der <2.3) { cl = 2} else {
					if (der >=2.3) { cl = 3}
			}}		
			//markerPiezoFeature[ipt].setStyle(iconPiezoStyle[cl]);
			//markerPiezoFeature[ipt].setStyle(iconPiezoStyle);   si on décommente cette ligne, pas de gestion de scale au niveau du layer
			markerPiezoFeature[ipt].set('name', rep[ipt]['CODE']);
			markerPiezoFeature[ipt].set('libpe', rep[ipt]['NOM']);
			markerPiezoFeature[ipt].set('meau', cl);
			markerPiezoFeature[ipt].set('dernier', der);
			markerSource.addFeature(markerPiezoFeature[ipt]);
		//}	
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
	// zoom sur tout 
	//map.getView().fit(markerSource.getExtent(), map.getSize());
	//map.getView().setZoom(map.getView().getZoom()-1);
	// zoom sur France métro
	map.getView().setCenter(ol.proj.fromLonLat([2.571723, 46.4975481]));
	map.getView().setZoom(6);

}

function carte() {
	classbss = document.getElementById("bss");
	classlibpe = document.getElementById("libpe");
	classcode = document.getElementById("code");
    var overviewMapControl = new ol.control.OverviewMap({
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

	iconPiezoStyle = new Array();
	/*
	iconPiezoStyle = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ /*({
		  anchor: [0.5, 540],
		  anchorXUnits: 'fraction',
		  anchorYUnits: 'pixels',
		  opacity: 0.7,
		  src: 'images/robinet.svg'
		}))
	  });*/
	iconPiezoStyle[0] = new ol.style.Style({image: new ol.style.Icon(({	  anchor: [0.5, 32],	  anchorXUnits: 'fraction',	  anchorYUnits: 'pixels',	  opacity: 0.7,	 src: 'images/robinet_bleu.svg'	}))	  });
	iconPiezoStyle[1] = new ol.style.Style({image: new ol.style.Icon(({	  anchor: [0.5, 32],	  anchorXUnits: 'fraction',	  anchorYUnits: 'pixels',	  opacity: 0.7,	 src: 'images/robinet_vert.svg'	}))	  });
	iconPiezoStyle[2] = new ol.style.Style({image: new ol.style.Icon(({	  anchor: [0.5, 32],	  anchorXUnits: 'fraction',	  anchorYUnits: 'pixels',	  opacity: 0.7,	 src: 'images/robinet_orange.svg'	}))	  });
	iconPiezoStyle[3] = new ol.style.Style({image: new ol.style.Icon(({	  anchor: [0.5, 32],	  anchorXUnits: 'fraction',	  anchorYUnits: 'pixels',	  opacity: 0.7,	 src: 'images/robinet_rouge.svg'	}))	  });

	icon_ind = new Array();
	icon_ind[0] = 'bleu';
	icon_ind[1] = 'vert';
	icon_ind[2] = 'orange';
	icon_ind[3] = 'rouge';
	
	/*
	markerPiezoFeature = new Array();
	markerSource = new ol.source.Vector({
	});
	for (ipt = 0; ipt < rep.length; ipt++) {
		addPiezoToMap();
	}

	markerLayer = new ol.layer.Vector({
		source: markerSource, 
		updateWhileAnimating: true,
		updateWhileInteracting: true,
			style: function(feature, resolution) {
				iconStyle = iconPiezoStyle[feature.get('meau')];
				//iconStyle.getImage().setScale(1/Math.pow(resolution, 1/3));
				//iconStyle.getImage().setScale(map.getView().getResolutionForZoom(3) / resolution);
				if (resolution > 150) {
					iconStyle.getImage().setScale(0.28/Math.sqrt(resolution));  // 6
				} else { // la taille du symbole n'augmente plus passé un certain niveau de zoom
					iconStyle.getImage().setScale(0.025);  // 0.5
				}
				return iconStyle;				
			}
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
	
	limStyle = new ol.style.Style({
		stroke: new ol.style.Stroke({
		  color: '#319FD3',
		  width: 1,
		}),
		fill: new ol.style.Fill({
		  color: 'rgba(255, 255, 255, 0.6)',
		}),
		text: new ol.style.Text({
			font: '12px Calibri,sans-serif',
			fill: new ol.style.Fill({
			  color: '#000',
			}),
			stroke: new ol.style.Stroke({
			  color: '#fff',
			  width: 3,
			}),
		  }),
		});
	limVector = new ol.layer.Vector({
			source: new ol.source.Vector({
				format: new ol.format.GeoJSON(),
				url: './data/comm_simpl.json'
			}),
            style: function (feature) {
				limStyle.getText().setText(feature.get('nom'));
				return limStyle;
			},
	});
		
	OSMtileLayer = new ol.layer.Tile({
		  source: new ol.source.OSM()
		});

/*
 sourceWMS = new ol.source.ImageWMS({
	url: 'https://mapsref.brgm.fr/wxs/sispea/sispea_diffusion',
	params: {'LAYERS': 'PrixEPCommuneDernieresDonnees'},
	ratio: 1,
    serverType: 'geoserver',
}),		
 coucheWMS = new ol.layer.Image({ source: sourceWMS });

 sourceTileWMS = new ol.source.TileWMS({
	url: 'https://mapsref.brgm.fr/wxs/sispea/sispea_diffusion',
	params: {'LAYERS': 'Communes', 'TILED': true},
    serverType: 'geoserver',
}),		
 coucheTileWMS = new ol.layer.Tile({ source: sourceTileWMS });
*/
 commWMSsource = new ol.source.ImageWMS({
	url: 'https://mapsref.brgm.fr/wxs/refcom-env/refign',
	params: {'LAYERS': 'COMMUNE'},
	ratio: 1,
    serverType: 'geoserver',
	crossOrigin: 'anonymous',	
}),		
 commWMSlayer = new ol.layer.Image({ source: commWMSsource });

 deptWMSsource = new ol.source.ImageWMS({
	url: 'https://mapsref.brgm.fr/wxs/refcom-env/refign',
	params: {'LAYERS': 'DEPARTEMENT'},
	ratio: 1,
    serverType: 'geoserver',
}),		
deptWMSlayer = new ol.layer.Image({
	source: deptWMSsource
});
 
 regWMSsource = new ol.source.ImageWMS({
	url: 'https://mapsref.brgm.fr/wxs/refcom-env/refign',
	params: {'LAYERS': 'REGION2'},
	ratio: 1,
    serverType: 'geoserver',
}),		
 regWMSlayer = new ol.layer.Image({ source: regWMSsource });
 
	view = new ol.View({
		center: ol.proj.fromLonLat([2.571723, 46.4975481]),
		zoom: 8 //4 avant pour la France. Là on zoome au niveau régional
	});
  
	scaleLineControl = new ol.control.ScaleLine();
	attribution = new ol.control.Attribution({
	  collapsible: false,
	  collapsed: false
	});

    //controls: ol.control.defaults().extend([
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
		OSMtileLayer,
		regWMSlayer,
		deptWMSlayer,
		commWMSlayer,
		//coucheTileWMS,
		//limVector,
		//markerLayer,
		//AdrLayer
	  ],
	  view: view
	});
	/*
	attribution.setCollapsible(true);
	attribution.setCollapsed(true);
	*/
	tailleCarte();
	//zoomToPiezos();	
	
	ancbss = '';
	map.on('singleclick', function(evt) {
	//map.on('pointermove', function(evt) {
	  if (evt.dragging) {
		return;
	  }
	  clic_commune(evt.coordinate);
    });		
	// change mouse cursor when over marker (ne fonctionne pas pour layer image)
	/*
	map.on('pointermove', function(e) {
	  var pixel = map.getEventPixel(e.originalEvent);
	  var hit = map.hasFeatureAtPixel(pixel);
	  dm.style.cursor = hit ? 'pointer' : '';
	});
	*/
	// Erreur : The canvas has been tainted by cross-origin data.
	/*
	map.on('pointermove', function (evt) {
	  if (evt.dragging) {
		return;
	  }
	  var pixel = map.getEventPixel(evt.originalEvent);
	  var hit = map.forEachLayerAtPixel(pixel, function () {
		return true;
	  });
	  dm.style.cursor = hit ? 'pointer' : '';
	});
	*/
	
// ****************** https://openlayers.org/en/latest/examples/hitdetect-vector.html **************************************
/*
var highlightStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#f00',
    width: 1,
  }),
  fill: new ol.style.Fill({
    color: 'rgba(255,0,0,0.1)',
  }),
  text: new ol.style.Text({
    font: '12px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: '#000',
    }),
    stroke: new ol.style.Stroke({
      color: '#f00',
      width: 3,
    }),
  }),
});

var featureOverlay = new ol.layer.Vector({
  source: new ol.source.Vector(),
  map: map,
  style: function (feature) {
    highlightStyle.getText().setText(feature.get('nom'));
    return highlightStyle;
  },
});

var highlight;
var displayFeatureInfo = function (pixel) {
  limVector.getFeatures(pixel).then(function (features) {
    var feature = features.length ? features[0] : undefined;
    /*
	var info = document.getElementById('info');
    if (features.length) {
      info.innerHTML = feature.getId() + ': ' + feature.get('nom');
    } else {
      info.innerHTML = '&nbsp;';
    }
	*/ /*
    if (feature !== highlight) {
      if (highlight) {
        featureOverlay.getSource().removeFeature(highlight);
      }
      if (feature) {
        featureOverlay.getSource().addFeature(feature);
      }
      highlight = feature;
    }
  });
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = map.getEventPixel(evt.originalEvent);
  displayFeatureInfo(pixel);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel);
});
*/
//****************************************************************	
	
	
	var bton_fm = document.getElementById('bton_fm');
	bton_fm.onclick = function() {
		map.getView().setCenter(ol.proj.fromLonLat([2.571723, 46.4975481]));
		map.getView().setZoom(6);
	};				
	var bton_pp = document.getElementById('bton_pp');
	bton_pp.onclick = function() {
		map.getView().fit(markerSource.getExtent(), map.getSize());
		//map.getView().setZoom(map.getView().getZoom()-1);
	};		
	var aide = document.getElementById('aide');
	aide.onclick = function() {
		document.getElementById('fen_aide').style.display = 'block'; 
	};		
	var fen_aide = document.getElementById('fen_aide');
	fen_aide.onclick = function() {
		document.getElementById('fen_aide').style.display = 'none';
	};		
}

function clic_commune(varcoord) {
	  /*
	  var feat = map.forEachFeatureAtPixel(evt.pixel,
		  function(feat, layer) {
			return feat;
		  });
	  if (feat) {
		bss = feat.get('insee_com');
		if (bss != ancbss) {
			donnees_piezo(bss);
			//document.getElementById('titre_detail').innerHTML = '<img src="images/robinet_' + icon_ind[feat.get('meau')] + '.svg"><b>' + feat.get('nom') + '</b>'; 
			document.getElementById('titre_detail').innerHTML = '<img src="images/robinet_' + icon_ind[cl] + '.svg"><b>' + feat.get('nom') + '</b>'; 
			classlibpe.innerHTML = 'Commune de code INSEE n° ' + bss;
			ancbss = bss;
		}	
	  }	
	  */
		var url = commWMSlayer.getSource().getGetFeatureInfoUrl(
			varcoord,
			map.getView().getResolution(),
			map.getView().getProjection(), {
					// retour en format json impossible
					'INFO_FORMAT': 'text/plain',
					'format_options': 'callback:parseResponse',
					// Définition des champs pour lesquels on veut obtenir les valeurs attributaires
					//'propertyName': 'insee_com',
		});
		//console.log(url)
		var aj = ajaxGet(url);
		//console.log(aj);
		/* exemple de réponse :
GetFeatureInfo results:

Layer 'FXX_CARTO_COMMUNE'
  Feature 1294: 
    nom_comm = 'MONTLUCON'
    insee_comm = '03185'
    statut = 'Sous-préfecture'
	*/
		pos1 = aj.indexOf('nom_comm = ');
		pos2 = aj.indexOf("'", pos1+12);
		pos = aj.indexOf('insee_comm = ');
		if (pos > -1) {
			nom_comm = aj.substring(pos1+12, pos-6);
			bss = aj.substr(pos+14, 5); 
			if (bss != ancbss) {
				donnees_piezo(bss);
				document.getElementById('titre_detail').innerHTML = '<img src="images/robinet_' + icon_ind[cl] + '.svg"><b>' + nom_comm + '</b>'; 
				classlibpe.innerHTML = 'Commune de code INSEE n° ' + bss;
				ancbss = bss;
			}	
		} else {
			// on garde les anciennes données affichées
			/*
			nom_comm = 'Pas de commune à cet emplacement';
			bss = '';
			document.getElementById('titre_detail').innerHTML = 'Pas de commune à cet emplacement'; 
			classlibpe.innerHTML = '';
			*/
		}		
}	
