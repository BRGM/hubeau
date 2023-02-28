// *** piezo_chroniques.js v1.0.0 2022-07-27 *** Basé sur qualnap.js ***
// *** piezo_chroniques.js v1.1.0 2022-08-02 *** prise en charge stations avec plus de 20000 mesures + paramètre seuil + paramètre resdeb : date de début des graphiques - on ne trace que depuis cette date pour toutes les stations (+ pratique que size car les stations n'ont pas toutes la même fréquence de mesures)

// *** variables globales ***
	slong = 'longitude';
	slat = 'latitude';
	scode = 'code_bss';
	slib = 'nompe';
	smeau = 'lisa'; // on va écrire l'entité bdlisa à la place de la masse d'eau
	snbmes = 'nbmes'; // nom du champ dans le fichier station pour le nb de données/mesures/analyses. Peut ne pas exister ('')
	sdatefin = 'datefin';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	sdatedeb = 'datedeb';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	snat = 'natpe'; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	sparam = ''; 
	sres = 'profmax'; // nom du champ dans le fichier station pour le résultat max (permet de discriminer l'affichage des stations par seuil de résultat). Peut ne pas exister ('')
	sunit = ''; // nom du champ unité dans la réponse hubeau
	iconfile = 'pointOr_on.png'; // l'image 'iconPiezo.svg' met trop de temps à charger quand beaucoup d'éléments et nécessiterait clustering
	iconscale = 15;
	icony = 0; // 32
	fdp = 'esri_topo3';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = true;
	size = 40000; // 2022-08-02 changé de 20000 à 40000 car une station a 20304 mesures. Nécessité de changer le traitement dans donnees_piezo
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['month', 'year', 'year', 'year'];
	co = [3, 1, 5, 10];
	te = ['3 mois', '1 an', '5 ans', '10 ans'];
	down_img_top = 278+30-75; // position de arrowdown pour gérer affichage graphique +30 pour possibilité station+nappe sur 3 lignes -75 suppression Contact
	ajout = 100000; // pour afficher 5 chiffres dans odometer dont 1 décimale
	station_layer_name = chemin + 'data/demo_piezo_stations.json'; // nom du fichier des stations
	station_layer_type = 'json'; // json ou geojson
	setat = "points d'eau"; // 2021-08-26 phrase qui doit apparaître dans la ligne d'état
// **************************

grandeur = "piezo"; // pour éviter erreur dans les tooltips
seuil = 0;
station_layer(false); 
	
function donnees_piezo(bss) {
		// il y a des valeurs abberantes égales à 10020.4
		// Pb aussi pour source 08612X0201/LZG122 avec des valeurs >1270 (doivent être négatives) et 08617X0211/LZG248
		var classdat = document.getElementById("dat");
		jsondata = new Array();
		processed_json = new Array();   
		if (size > 40000) { size = 40000; }
		sizereq = size;
		if (size > 20000) { sizereq = 20000; }
		urlobs = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss=" + bss + "&size=" + sizereq + "&fields=date_mesure,profondeur_nappe&sort=desc"; // 2022-08-02 sort=desc pour pouvoir ne tracer que les size dernières mesures
		if (typeof(resdeb) !== 'undefined') { // 2022-08-02 prise en compte date de début des résultats
			urlobs += '&date_debut_mesure=' + resdeb;
		}
		asyncReq(function(result) {
			var rep = JSON.parse(result); 
			jsondata = rep.data;
			nbmes = jsondata.length;
			if (nbmes > 0) { 
				for(var key in jsondata) {
					dat = jsondata[key]['date_mesure'];
					dat = Date.parse(dat);
					niv = jsondata[key]['profondeur_nappe']; 
					processed_json.push([dat, niv]);
				}
				
				// 2022-08-02 traitement quand plus de 20000 mesures (appel synchrone)	
				count = rep.count;
				if (count > 20000 && size > 20000) {
					if (count > size) { count = size; }
					// il faut récupérer les count-20000 enregs restants
					url2 = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss=" + bss + "&size=" + (size-20000) + "&fields=date_mesure,profondeur_nappe&sort=desc&date_fin_mesure=" + jsondata[19999]['date_mesure']; 
					if (typeof(resdeb) !== 'undefined') { // 2022-08-02 prise en compte date de début des résultats
						url2 += '&date_debut_mesure=' + resdeb;
					}
					var rep2 = JSON.parse(ajaxGet(url2)); 
					data2 = rep2.data;
					for(var i in data2) {
						dat = data2[i]['date_mesure'];
						dat = Date.parse(dat);
						niv = data2[i]['profondeur_nappe']; 
						processed_json.push([dat, niv]);
					}
					nbmes = processed_json.length; 	
				}	
				
				processed_json.sort(function(a,b) { // ajout 2021-08-04 pour ne plus avoir le warning https://assets.highcharts.com/errors/15/ et avoir le navigator correct
					return a[0]-b[0]
				});
				dernier_resultat = processed_json[nbmes-1][1]; 
				if (dernier_resultat < 0) { dernier_resultat = 0; } // 2021-08-25 pour prendre en compte piézos artésiens (copié de piezo_tr.js)
				delayedAlert(Math.round(dernier_resultat*10)); // si on veut 1 chiffre après la virgule. Il faut changer le thème odometer pour avoir dernier chiffre en gris
				var options = {timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit"};
				date_max = new Date(processed_json[nbmes-1][0]);
				classdat.innerHTML = "<b>"+nbmes+"</b> mesures - Dernière mesure le <b>" + date_max.toLocaleDateString('fr-FR', options) + "</b>";
				graphique("Profondeur de la nappe", 'Profondeur (m)', '%e %b %Y', -1, 'm', false, 1, 'scatter', true, false);

				document.getElementById("limit").style.display = 'none';

			} else {
				delayedAlert(0);
				//document.getElementsByClassName("metres")[0].innerHTML = '&nbsp;' // 2021-08-31 on enlève unité d'une éventuelle requête antérieure
				classdat.innerHTML = "Pas de mesure disponible";
				graphique("Profondeur de la nappe", '', '%e %b %Y', -1, 'm', false, 1, 'scatter', true, false);
			}
			dm.style.cursor = "default";
			document.getElementById("search").style.cursor = "default";
		});		
}	

function init_nat() { // partie spécifique au démonstrateur pour le traitement des natures
   	iconPiezoNat = new Array();
	iconPiezoNat[0] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/pointOr_on.png'
		}))
    });
	iconPiezoNat[1] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/pointBleu_on.png'
		}))
    });
	iconPiezoNat[2] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/pointMauve_on.png'
		}))
    });
	iconPiezoNat[3] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/pointGris_on.png'
		}))
    });

	tabnat = [true,true,true,true]; // affichage des natures (forage,source,puits,inconnue) 
	sim = ['on','on','on','on'];
	nature = '';
	if (typeof(f['nature']) !== 'undefined') { 
		nature = f['nature'].toLowerCase();
		if (nature.indexOf('forage') == -1) { tabnat[0] = false; sim[0] = 'off'; } 
		if (nature.indexOf('source') == -1) { tabnat[1] = false; sim[1] = 'off'; } 
		if (nature.indexOf('puits') == -1) { tabnat[2] = false; sim[2] = 'off'; } 
		if (nature.indexOf('inconnue') == -1) { tabnat[3] = false; sim[3] = 'off'; } 
		affiche_legende();
	}
}

function traitement_station() {
			dm.style.cursor = "wait";
			if (feat.get('ipt')) { // affichage de la bonne couleur du symbole dans le titre de la station
				switch (rep[feat.get('ipt')][snat].toLowerCase()) {
					case 'forage': scou = 'Or'; break;
					case 'source': scou = 'Bleu'; break;
					case 'puits': scou = 'Mauve'; break;
					case 'inconnue': scou = 'Gris'; break;
				}	
				document.getElementById('titre_detail').innerHTML = '<img src="images/point' + scou + '_on.png" title="' + rep[feat.get('ipt')][snat] + '">&nbsp;&nbsp;<b>Détail du point d\'eau</b> <i><class id="code"></class></i>'; 
			}	
			classbss.innerHTML = '<a href="https://ades.eaufrance.fr/Fiche/PtEau?Code=' + bss + '" target="_blank">Plus d\'informations sur le point d\'eau</a>';
			document.getElementById("code").innerHTML = bss; 
			if (feat.get(slib)) {
				classlibpe.innerHTML = "<b>" + feat.get(slib);
			} else { classlibpe.innerHTML = "<b>" + bss; }	
			if (feat.get(smeau)) {
				snap = feat.get(smeau);
				if (snap.length > 80) { snap = snap.substring(0, 80) + '...'; }
				classlibpe.innerHTML += "</b> captant l'entité hydrogéologique <b>" + snap;
			} else { classlibpe.innerHTML += "</b> captant une entité hydrogéologique non renseignée"; }
			donnees_piezo(bss);
}

function carte() {
	// paramètres génériques :  code_station (code bss), adresse, coord, fdp, size = profondeur des données (nb de données à afficher), nbobsmin (n'affiche que les stations qui ont au moins nbobsmin analyses), nature, datedeb, datefin, seuil
	// paramètres spécifiques : resdeb (date de début de la récupération des données et du tracé de la courbe)
	// pour le zoom : code_station est prioritaire sur coord qui est prioritaire sur adresse

	carte_commun();
	event_params();

}

function affiche_legende() { // gérer les autres natures
	document.getElementById("legende").innerHTML = '<img class="imgleg" src="images/pointOr_' + sim[0] + 
		'.png" title="Forage" onclick="iconat(this)">&nbsp;&nbsp;Forage&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointBleu_' + 
		sim[1] + '.png" title="Source" onclick="iconat(this)">&nbsp;&nbsp;Source&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointMauve_' + 
		sim[2] + '.png" title="Puits" onclick="iconat(this)">&nbsp;&nbsp;Puits&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointGris_' + 
		sim[3] + '.png" title="Inconnue" onclick="iconat(this)">&nbsp;&nbsp;Inconnue&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 
		'nbobsmin = <input type="text" id="val6" name="val6" size="6" title="Affichage uniquement des points d\'eau ayant au moins nbobsmin analyses" placeholder="nbobsmin" value="' + nbanamin + '">&nbsp;&nbsp;' + 
		'datedeb = <input type="text" id="val3" name="val3" size="8" title="Affichage uniquement des points d\'eau ayant des analyses antérieures à datedeb" placeholder="datedeb" value="' + datedeb + '">&nbsp;&nbsp;' +
		'datefin = <input type="text" id="val4" name="val4" size="8" title="Affichage uniquement des points d\'eau ayant des analyses postérieures à datefin" placeholder="datefin" value="' + datefin + '">';
}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' [' + rep[j]['bss_id'] + ']' + ' - ' + feat.get(slib); // 2022-08-05 ajout nouveau code BSS
	if (rep[j]['nbmes'] > 0) { content.innerHTML += '<br>' + rep[j]['nbmes'] + ' mesures du ' + convertDateISO(rep[j]['datedeb']) + ' au ' + convertDateISO(rep[j]['datefin']) + '<br>Profondeur max : ' + new Intl.NumberFormat().format(rep[j]['profmax']) + ' m'; }
}
