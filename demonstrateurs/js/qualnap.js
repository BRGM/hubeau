// *** qualnap.js v1.0.0 2021-08-15 *** Copie de qualriv.js ***
// *** qualnap.js v2.0.0 2021-08-17 *** couleur différente selon nature du point d'eau, possibilité de n'afficher que 1 ou 2 natures ***
// permettre de passer un code sandre paramètre dans l'URL même s'il n'est pas présent dans la liste déroulante (ligne Autre... dans la liste + table de correspondance codes - noms. si code est trouvé on lance l'interrogation). Ok
// on utilise le support 66 (nappe alluviale) du fichier parametre_qual.json, qu'on généralise à l'ensemble des eaux souterraines
// Ne pas mettre 66 dans "code_support" des différents paramètres, on considère que tous les paramètres sont affichables. prefix = "eso" si nécessaire

// *** variables globales ***
	slong = 'longitude';
	slat = 'latitude';
	scode = 'code_bss';
	slib = 'nompe';
	smeau = 'lisa'; // on va écrire l'entité bdlisa à la place de la masse d'eau
	snbmes = 'nbana'; // nom du champ dans le fichier station pour le nb de données/mesures/analyses. Peut ne pas exister (''). Changement nbmes en nbana 2021-08-30
	sdatefin = 'datefin';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	sdatedeb = 'datedeb';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	snat = 'natpe'; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	sparam = 'params'; // 2021-08-31 nom du champ dans le fichier station pour le tableau des paramètres "code": [nbana, valmax]
	sunit = 'symbole_unite'; // nom du champ unité dans la réponse hubeau
	iconfile = 'pointOr_on.png'; // l'image 'iconPiezo.svg' met trop de temps à charger quand beaucoup d'éléments et nécessiterait clustering
	iconscale = 15;
	icony = 0; // 32
	fdp = 'esri_topo3';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = true;
	size = 20000; 
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['month', 'year', 'year', 'year'];
	co = [3, 1, 5, 10];
	te = ['3 mois', '1 an', '5 ans', '10 ans'];
	down_img_top = 278+10+30-75; // position de arrowdown pour gérer affichage graphique +10 à cause liste déroulante +30 pour possibilité station+nappe sur 3 lignes -75 suppression Contact
	ajout = 100000; // pour afficher 5 chiffres dans odometer dont 1 décimale
	// génération fichier station en 2 fois : https://hubeau.eaufrance.fr/api/v1/qualite_rivieres/station_pc?code_support=3&size=20000&code_region=01,02,03,04,06,11,24,27,28,32,44,52&fields=longitude,latitude,code_station,libelle_station (9123 stations le 12/08/2021)	
	// https://hubeau.eaufrance.fr/api/v1/qualite_rivieres/station_pc?code_support=3&size=20000&code_region=53,75,76,84,93,94&fields=longitude,latitude,code_station,libelle_station (11271 stations) ; enlever l'entête jusqu'à "data": et réunir les 2 fichiers
	// 2021-08-30 le fichier stations est généré grâce à Solr puis qual_nap2_json.php
	station_layer_name = chemin + 'data/demo_qualnap_stations_params.json'; // nom du fichier des stations
	station_layer_type = 'json'; // json ou geojson
	setat = "points d'eau"; // 2021-08-26 phrase qui doit apparaître dans la ligne d'état
// **************************

tableau_params();	// 2021-08-31 pour que grandeur soit connu dès le départ
station_layer(false); 
	
function changeGrandeur() {
	grandeur = document.getElementById('grandeur').value;
	// si une station est affichée, changer le graphique avec la nouvelle grandeur
	sgrandeur = tabnom[grandeur];
	if (typeof(bss) !== 'undefined') { 
		dm.style.cursor = "wait";
		document.getElementById("search").style.cursor = "wait";
		donnees_piezo(bss);
	}
}

/* 2021-08-16
	"code_remarque_analyse":0 ,"nom_remarque_analyse":"Analyse non faite", resultat=null, ne pas tenir compte ni de la date ni du résultat, nbmes--. éviter ce cas dès la requête
	"code_remarque_analyse":5 ,"nom_remarque_analyse":"Incomptable", resultat=null, ne pas tenir compte ni de la date ni du résultat, nbmes--. éviter ce cas dès la requête
	"code_remarque_analyse":4,"nom_remarque_analyse":"Présence ou Absence" - pour bacterio. ne pas tenir compte ici. éviter ce cas dès la requête

	"code_remarque_analyse":1, "nom_remarque_analyse":"Résultat > seuil de quantification et < au seuil de saturation ou Résultat = 0" - cas général, garder la valeur du résultat
	"code_remarque_analyse":7 ,"nom_remarque_analyse":"Traces (< seuil de quantification et > seuil de détection)" - garder la valeur du résultat		
	"code_remarque_analyse":3,"nom_remarque_analyse":"Résultat > seuil de saturation" - garder le résultat, il faudrait pouvoir indiquer > résultat
	"code_remarque_analyse":8,"nom_remarque_analyse":"Dénombrement > Valeur"	   	- garder le résultat, il faudrait pouvoir indiquer > résultat
	"code_remarque_analyse":2, "nom_remarque_analyse":"Résultat < seuil de détection" 					- mettre le résultat à 0
	"code_remarque_analyse":10, "nom_remarque_analyse":"Résultat inférieur au seuil de quantification"  - mettre le résultat à 0	
	"code_remarque_analyse":9, "nom_remarque_analyse":"Dénombrement < Valeur"						    - mettre le résultat à 0	
	
*/

function donnees_piezo(bss) {
		// afficher la courbe limite de qualité ? ça tasserait bcp de graphiques...
		var classdat = document.getElementById("dat");
		var couleur = (document.getElementById("grandeur").selectedIndex+1) % 10;
		if (couleur == 0) { couleur = 10; }
		jsondata = new Array();
		processed_json = new Array();   
		if (grandeur.toString == '7073') { grandeur = '7073,1391'; }
		if (grandeur.toString == '1303') { grandeur = '1303,1304'; }
		urlobs = "https://hubeau.eaufrance.fr/api/v1/qualite_nappes/analyses?bss_id=" + bss + "&code_param=" + grandeur + "&size=" + size + "&fields=code_param,date_debut_prelevement,resultat,code_remarque_analyse,symbole_unite&sort=desc&code_remarque_analyse=1,2,3,7,8,9,10"; 
		if (grandeur == '7073,1391') { grandeur = '7073'; }
		if (grandeur == '1303,1304') { grandeur = '1303'; }
		asyncReq(function(result) {
			var rep = JSON.parse(result); 
			jsondata = rep.data;
			nbmes = jsondata.length;
			
			if (nbmes > 0) { 
				traitement_unite(true); // 2021-08-24 on écrit dorénavant l'unité après odometer car on a supprimé l'unité du libellé dans la liste déroulante (utilisation de parametres_qual.json) + même comportement que qualriv
				//document.getElementsByClassName("metres")[0].innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'; 
				// si grandeur=1304 (conduc à 20°), la multiplier par 1.11 pour qu'elle soit "équivalente" à la condu à 25° (1303). ou plutôt si pas de mesure en 1303, regarder s'il y en a en 1304. compliqué avec l'asynchrone
				for(var key in jsondata) {
					$dat = jsondata[key]['date_debut_prelevement'];
					if ($dat.substring(0, 2) == '00') {   // 2021-08-30 correction des éventuelles dates d'analyses en 0016 au lieu de 2016
						$dat = '20' + $dat.substring(2, 8);
						console.log('!!! correction date brute = ' + jsondata[key]['date_debut_prelevement']);
					} 
					$dat = Date.parse($dat);
					niv = jsondata[key]['resultat']; 
					if (jsondata[key]['code_param'] == 1304) { niv = niv * 1.11; } // 2021-08-29 prise en compte des conduc à 20°, converties pour être équivalentes à 25°
					rem = jsondata[key]['code_remarque_analyse'];
					if ((rem==2) || (rem==9) || (rem==10)) { niv = 0; }
					if ((rem==3) || (rem==8)) { console.log('Résultat supérieur à la valeur affichée '+niv); };
					processed_json.push([$dat, niv]);
					if (jsondata[key][sunit] != unite) { console.log('!!! Unités différentes !!!  ' + jsondata[key][sunit] + ' - ' + unite); }
				}
				processed_json.sort(function(a,b) { // ajout 2021-08-04 pour ne plus avoir le warning https://assets.highcharts.com/errors/15/ et avoir le navigator correct
					return a[0]-b[0]
				});
				dernier_resultat = processed_json[nbmes-1][1]; // 2021-08-16 dernier résultat peut avoir changé du fait du tri ou du code remarque, on le met donc en fin de traitement
				if (dernier_resultat > 9999.9) { dernier_resultat = 9999.9; }
				delayedAlert(Math.round(dernier_resultat*10)); // si on veut 1 chiffre après la virgule. Il faut changer le thème odometer pour avoir dernier chiffre en gris
				var options = {timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit"};
				date_max = new Date(processed_json[nbmes-1][0]);
				classdat.innerHTML = "<b>"+nbmes+"</b> analyses - Dernière analyse le <b>" + date_max.toLocaleDateString('fr-FR', options) + "</b>";
				graphique(sgrandeur, syaxis, '%e %b %Y', -1, symb, false, couleur);

				if ((typeof(tablimit[grandeur]) !== 'undefined') && (htgraph >= 120)) { // on ne propose valeur seuil que s'il y a assez de place
					document.getElementById("limit").style.display = 'block';
					var rect = document.getElementById("container").getBoundingClientRect();
					document.getElementById("limit").style.top = rect.top + 35 + 'px';
				} else {
					document.getElementById("limit").style.display = 'none';
				}	
				if (blimit && (typeof(tablimit[grandeur]) !== 'undefined')) { // 2021-08-24 limite de qualité
					d1 = processed_json[0][0];
					d2 = processed_json[nbmes-1][0];
					lim = tablimit[grandeur];
					myChart.addSeries({
								name: 'limite supérieure de qualité',
								color: 'rgb(255, 0, 0)',
								//colorIndex: 4,
								lineWidth: 2,
								yAxis: 0,
								data: [[d1,lim],[d2,lim]]
					}); 
				}	

			} else {
				delayedAlert(0);
				document.getElementsByClassName("metres")[0].innerHTML = '&nbsp;' // 2021-08-31 on enlève unité d'une éventuelle requête antérieure
				classdat.innerHTML = "Pas d'analyse disponible";
				graphique(sgrandeur, '', '%e %b %Y', -1, '', false, 1, 'scatter', false);
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

	tabnat = [true,true,true]; // affichage des natures (forage,source,puits) 
	sim = ['on','on','on'];
	nature = '';
	if (typeof(f['nature']) !== 'undefined') { 
		nature = f['nature'].toLowerCase();
		if (nature.indexOf('forage') == -1) { tabnat[0] = false; sim[0] = 'off'; } 
		if (nature.indexOf('source') == -1) { tabnat[1] = false; sim[1] = 'off'; } 
		if (nature.indexOf('puits') == -1) { tabnat[2] = false; sim[2] = 'off'; } 
		affiche_legende();
		/* document.getElementById("legende").innerHTML = '<img class="imgleg" src="images/pointOr_' + sim[0] + '.png" title="Forage" onclick="iconat(this)">&nbsp;&nbsp;Forage&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointBleu_' + 
			sim[1] + '.png" title="Source" onclick="iconat(this)">&nbsp;&nbsp;Source&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointMauve_' + 
			sim[2] + '.png" title="Puits" onclick="iconat(this)">&nbsp;&nbsp;Puits'; */
	}
}

function traitement_station() {
			dm.style.cursor = "wait";
			if (feat.get('ipt')) { // affichage de la bonne couleur du symbole dans le titre de la station
				switch (rep[feat.get('ipt')][snat].toLowerCase()) {
					case 'forage': scou = 'Or'; break;
					case 'source': scou = 'Bleu'; break;
					case 'puits': scou = 'Mauve'; break;
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

function tableau_params() {
	par = JSON.parse(ajaxGet(chemin+'data/parametres_qual.json'));
	//console.table(par.parametres);	
	nbfam = par.familles.length;
	nbparam = par.parametres.length;
	tablib = new Array();
	tabnom = new Array();
	tabsupfam = new Array();
	tablimit = new Array();
	for (var k = 0; k < par.parametres.length; k++) {
		tablib[par.parametres[k].code] = par.parametres[k].libelle;
		tabnom[par.parametres[k].code] = par.parametres[k].nom;
		tablimit[par.parametres[k].code] = par.parametres[k].eso_limit;
	}	

	grandeur = 1340; sgrandeur = 'Nitrates'; libel = 'Teneur en Nitrates (NO3) en mg/l';
	f = extractUrlParams();
	if ((typeof(f['grandeur']) !== 'undefined') || (typeof(f['code_parametre']) !== 'undefined')) { // 2021-08-24 on permet d'avoir le paramètre GET code_parametre à la place de grandeur
		if (typeof(f['grandeur']) !== 'undefined') { tgrandeur = f['grandeur']; } else { tgrandeur = f['code_parametre']; }
		if (tgrandeur == '1391') { tgrandeur = '7073'; } // cas particulier du Fluor 2021-08-27
		if (tgrandeur == '1304') { tgrandeur = '1303'; } // cas particulier de la Conductivité 2021-08-29
		if (typeof(tablib[tgrandeur]) !== 'undefined') { // TODO ajouter test support 3 pour ne pas accepter 5856 par exemple
			grandeur = tgrandeur; // si la grandeur saisie dans l'URL n'est pas dans le fichier de paramètres, on rebascule sur Nitrates. par contre ça interdit de rentrer des codes valides non présents dans le fichier (posent pb de nom et titre axe)
			libel = tablib[grandeur];
			sgrandeur = tabnom[grandeur];
		}
	}
}

function carte() {
	// paramètres génériques :  code_station (code bss), adresse, coord, fdp, size = profondeur des données (nb de données à afficher)
	// paramètres spécifiques : grandeur (code SANDRE du paramètre physico-chimique), nbanamin (n'affiche que les stations qui ont au moins nbanamin analyses), nature 
	// pour le zoom : code_station est prioritaire sur coord qui est prioritaire sur adresse

	carte_commun();
	/*
	ssel = '';
	for (var i = 0; i < nbfam; i++) {
		ssel += '    <OPTGROUP label="' + par.familles[i].libelle + '">';
		memb = par.familles[i].membres;
		for (var j = 0; j < memb.length; j++) {
			var code = memb[j];
			ssel += '        <option value="' + code + '"';
			if(code.toString() == grandeur) { ssel += ' selected="selected"'; } 
			ssel += '>' + tablib[code] + '</option>';
		}	
		ssel += '    </OPTGROUP>';
	}
	document.getElementById("grandeur").innerHTML = ssel;
	*/
	// 2021-08-24 tiré de qualriv.js (pourrait être dans commun ?) utilisation de parametre_qual.json, commun à qualriv et qualnap.
	ssel = '';
	var bsel = false;
	for (var i = 0; i < nbfam; i++) {
		tabsupfam = par.familles[i].code_support;
		if (tabsupfam.indexOf(66) != -1) { // traitement de la famille si elle correspond au support 66
			ssel += '    <OPTGROUP label="' + par.familles[i].libelle + '">';
			memb = par.familles[i]["eso_membres"];
			//console.log(i, memb);
			for (var j = 0; j < memb.length; j++) {
				var code = memb[j];
				ssel += '        <option value="' + code + '"';
				if(code.toString() == grandeur) { 
					ssel += ' selected="selected"';
					bsel = true;
				} 
				ssel += '>' + tablib[code] + '</option>';
			}	
			ssel += '    </OPTGROUP>';
		}	
	}
	if (!bsel) { // grandeur en cours n'est pas dans la liste déroulante, le rajouter
		ssel += '    <OPTGROUP label="Paramètre utilisateur">';
		ssel += '        <option value="' + grandeur + '" selected="selected">' + tablib[grandeur]  + '</option>';
		ssel += '    </OPTGROUP>';
	}
	document.getElementById("grandeur").innerHTML = ssel;
	
	event_params();

}

function affiche_legende() {
	document.getElementById("legende").innerHTML = '<img class="imgleg" src="images/pointOr_' + sim[0] + 
		'.png" title="Forage" onclick="iconat(this)">&nbsp;&nbsp;Forage&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointBleu_' + 
		sim[1] + '.png" title="Source" onclick="iconat(this)">&nbsp;&nbsp;Source&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointMauve_' + 
		sim[2] + '.png" title="Puits" onclick="iconat(this)">&nbsp;&nbsp;Puits&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 
		'nbobsmin = <input type="text" id="val6" name="val6" size="6" title="Affichage uniquement des points d\'eau ayant au moins nbobsmin analyses" placeholder="nbobsmin" value="' + nbanamin + '">&nbsp;&nbsp;' + 
		'datedeb = <input type="text" id="val3" name="val3" size="8" title="Affichage uniquement des points d\'eau ayant des analyses antérieures à datedeb" placeholder="datedeb" value="' + datedeb + '">&nbsp;&nbsp;' +
		'datefin = <input type="text" id="val4" name="val4" size="8" title="Affichage uniquement des points d\'eau ayant des analyses postérieures à datefin" placeholder="datefin" value="' + datefin + '">';
}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' [' + rep[j]['bss_id'] + ']' + ' - ' + feat.get(slib); // 2022-08-05 ajout nouveau code BSS
	content.innerHTML += '<br>' + rep[j]['nbprel'] + ' prélèvements et ' + rep[j]['nbana'] + ' analyses du ' + convertDateISO(rep[j]['datedeb']) + ' au ' + convertDateISO(rep[j]['datefin']); 
}
