// *** qualriv.js v1.0.0 2021-07-30 *** Fonctions js utilisées par qualriv.htm ***
// *** qualriv.js v2.0.0 2021-08-01 *** liste déroulante paramètres ***
// *** qualriv.js v3.0.0 2021-08-25 *** ligne d'état + légende ***
// essayer layer stations en fichier geoJSON : non
// mettre autres paramètres PC en liste déroulante : Ok
// mettre 1 décimale sur l'affichage odometer : Ok
// permettre de passer un code sandre paramètre dans l'URL même s'il n'est pas présent dans la liste déroulante (ligne Autre... dans la liste + table de correspondance codes - noms. si code est trouvé on lance l'interrogation) : Ok
/* Utilisation de parametre_qual.json : description des supports, familles et paramètres
Les supports s'affichent selon "ordre" dans la 1ere liste déroulante. Ils ont chacun un paramètre par défaut "param_defaut"
Les familles s'affichent selon leur ordre d'apparence dans parametre_qual.json si le support est dans leur "code_support". Les paramètres qui s'affichent à l'intérieur des familles sont dans prefix+"_membres". "eso_membres" est pour qualnap
On assigne le code_support 66 à l'eau souterraine (qualnap)
Pour chaque paramètre, "code_support" précise les supports possibles quand le code paramètre est saisi dans l'URL. On ne le précise pas pour 66 (eau sout, qui est gérée à part dans qualnap) */
// *** qualriv.js v4.0.0 2022-08-04 *** Passage à API v2 pour qualriv, v1 pour hydrobio + prise en compte resdeb ***

// *** variables globales ***
	slong = 'longitude';
	slat = 'latitude';
	scode = 'code_station';
	slib = 'libelle_station';
	smeau = 'libelle_station';
	snbmes = 'eau_nbobs'; 
	sdatefin = 'eau_datefin';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	sdatedeb = 'eau_datedeb';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	snat = 'type_entite_hydro'; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	ssupport = 'code_support';
	sunit = 'symbole_unite'; // nom du champ unité dans la réponse hubeau
	iconfile = 'pointViolet_on.png'; 
	iconscale = 15;
	icony = 0;
	fdp = 'esri_topo3';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = false;
	size = 5000; // taille maxi acceptée par analyse_pc de Hub'Eau et jamais plus de 1150 analyses PC par paramètre. Pour hydrobio, pas plus de 20. Problématique pour température où on peut avoir jusqu'à 355000 mesures
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['month', 'year', 'year', 'year'];
	co = [3, 1, 5, 10];
	te = ['3 mois', '1 an', '5 ans', '10 ans'];
	down_img_top = 316+10-75; // position de arrowdown pour gérer affichage graphique +10 à cause liste déroulante -75 suppression Contact
	ajout = 10000; // pour afficher 4 chiffres dans odometer
	// génération fichier station en 2 fois : https://hubeau.eaufrance.fr/api/v1/qualite_rivieres/station_pc?code_support=3&size=20000&code_region=01,02,03,04,06,11,24,27,28,32,44,52&fields=longitude,latitude,code_station,libelle_station (9123 stations le 12/08/2021)	
	// https://hubeau.eaufrance.fr/api/v1/qualite_rivieres/station_pc?code_support=3&size=20000&code_region=53,75,76,84,93,94&fields=longitude,latitude,code_station,libelle_station (11271 stations) ; enlever l'entête jusqu'à "data": et réunir les 2 fichiers
	// 2021-08-17 génération via qual_riv_json.php
	station_layer_name = chemin + 'data/demo_qualriv_station_pc_test.json'; // nom du fichier des stations
	station_layer_type = 'json'; // json ou geojson
	setat = 'stations'; // 2021-08-25 phrase qui doit apparaître dans la ligne d'état
// **************************

//alert((navigator.userAgent.indexOf('Mobi') !== -1));

code_support = 3; prefix = 'eau'; ancsup = 3; grandeur = 1340; sgrandeur = 'Nitrates';
//station_layer(false); // pour pouvoir lancer traitement support et grandeur avant create_layer_station
	var request = new XMLHttpRequest();
	request.open('GET', station_layer_name);
	request.responseType = 'json';
	request.send();
	request.onload = function() {
		rep = request.response;
	  f = extractUrlParams();
      get_support_grandeur();
	  create_layer_station();
	  carte();
	}


function changeSupport() {
	ancsup = code_support;
	code_support = document.getElementById('code_support').value;
	// garder le même zoom, remplacer ancien markerSource par la nouvelle
	//markerSource.clear(true);
	traitement_support();
	/*
	for (ipt = 0; ipt < rep.length; ipt++) {
		addPiezoToMap();
	};
	*/
	remplit_select_param(prefix + '_membres');
	redrawStations(); // 2021-10-13 permet le rafraichissement de la ligne d'état sur le nb de stations quand on change de support
	// si une station est affichée, changer le graphique avec le nouveau support
	redrawGraph();
	/*
	if (typeof(bss) !== 'undefined') { 
		donnees_piezo(bss);
	} */
}
	
function changeGrandeur() {
	grandeur = document.getElementById('grandeur').value;
	// si une station est affichée, changer le graphique avec la nouvelle grandeur
	sgrandeur = tabnom[grandeur];
	redrawGraph();
	/*
	if (typeof(bss) !== 'undefined') { 
		dm.style.cursor = "wait";
		document.getElementById("search").style.cursor = "wait";
		donnees_piezo(bss);
	}*/
}

function donnees_piezo(bss) {
	// afficher la courbe limite de qualité ? ça tasserait bcp de graphiques... Oui, mais sur demande
	// paramètres importants d'après FNE : T°, oxygène, conduc, pH. test4: DBO5, O2sat, NH4, NO3, PO4, Ptot
	var classdat = document.getElementById("dat");
	var couleur = (document.getElementById("grandeur").selectedIndex+1) % 10;
	if (couleur == 0) { couleur = 10; }
	jsondata = new Array();
	processed_json = new Array();   
	// 2021-08-16 prise en compte code_remarque sur le modèle de qualnap. Attention code_remarque n'est pas un paramètre interrogeable par Hub'Eau ici (contrairement à qualite_nappes). Du coup les codes rem 0,4 et 5 apparaissent dans les résultats
	// 2021-08-20 regroupement avec hydrobio et temperature
	switch (code_support.toString()) {
		case '3': case '6':
			if (grandeur.toString == '7073') { grandeur = '7073,1391'; }
			if (grandeur.toString == '1303') { grandeur = '1303,1304'; }
			urlobs = "https://hubeau.eaufrance.fr/api/v2/qualite_rivieres/analyse_pc?code_station=" + bss + "&code_parametre=" + grandeur + "&code_support=" + code_support + "&size=" + size + "&fields=date_prelevement,heure_prelevement,resultat,symbole_unite,code_remarque&sort=desc&code_remarque=1,2,3,7,8,9,10"; 
			if (typeof(resdeb) !== 'undefined') { // 2022-08-04 prise en compte date de début des résultats + passage à api v2
				urlobs += '&date_debut_prelevement=' + resdeb;
			}
			if (grandeur == '7073,1391') { grandeur = '7073'; }
			if (grandeur == '1303,1304') { grandeur = '1303'; }
			sunit = 'symbole_unite';
			sres = 'resultat';
			api = 'qualriv';
			s0 = "Pas d'analyse disponible";
			break;
		case '4': case '10': case '13': case '27':
			urlobs = "https://hubeau.eaufrance.fr/api/v1/hydrobio/indices?code_station_hydrobio=" + bss + "&code_indice=" + grandeur + "&sort=asc&fields=date_prelevement,resultat_indice,unite_indice&size=" + size;
			if (typeof(resdeb) !== 'undefined') { // 2022-08-04 prise en compte date de début des résultats + passage à api v1
				urlobs += '&date_debut_prelevement=' + resdeb;
			}
			sunit = 'unite_indice';
			sres = 'resultat_indice';
			api = 'hydrobio';
			s0 = "Pas de résultat disponible";
			break;
		case '99': 
			// dire dans l'aide que les graphiques sont limités aux 5000 derniers résultats
			urlobs = "https://hubeau.eaufrance.fr/api/v1/temperature/chronique?sort=desc&code_station=" + bss + "&size=" + size + "&fields=date_mesure_temp,heure_mesure_temp,resultat"; 
			if (typeof(resdeb) !== 'undefined') { // 2022-08-04 prise en compte date de début des résultats
				urlobs += '&date_debut_mesure=' + resdeb;
			}
			sres = 'resultat';
			api = 'temperature';
			s0 = 'Pas de mesure disponible';
			sgrandeur = 'Température de l\'eau';
			break;
	}

	asyncReq(function(result) {
		var rep = JSON.parse(result); 
		jsondata = rep.data;
		nbmes = jsondata.length;
		
		if (nbmes > 0) { 
			switch (api) {
			case 'qualriv':	
				traitement_unite(true); // 2021-08-19 on écrit l'unité après odometer car on va permettre plusieurs supports dont hydrobio
				//document.getElementsByClassName("metres")[0].innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'; 
				// si grandeur=1304 (conduc à 20°), la multiplier par 1.11 pour qu'elle soit "équivalente" à la condu à 25° (1303). ou plutôt si pas de mesure en 1303, regarder s'il y en a en 1304. compliqué avec l'asynchrone
				for(var key in jsondata) {
					jsondata[key]['date_prelevement'] = Date.parse(jsondata[key]['date_prelevement']);
					niv = jsondata[key]['resultat']; 
					rem = jsondata[key]['code_remarque'];
					if ((rem==2) || (rem==9) || (rem==10)) { niv = 0; }
					if ((rem==3) || (rem==8)) { console.log('Résultat supérieur à la valeur affichée '+niv); };
					if ((rem==0) || (rem==4) || (rem==5)) { // ces codes n'ont pas été filtrés dans la requête Hub'Eau . Ne pas pousser la mesure dans les résultats et enlever 1 au nombre de mesures
						nbmes--;
					} else {	
						processed_json.push([jsondata[key]['date_prelevement'], niv]);
						if (jsondata[key][sunit] != unite) { console.log('!!! Unités différentes !!!  ' + jsondata[key][sunit] + ' - ' + unite); }
					}	
				}
				processed_json.sort(function(a,b) { // ajout 2021-08-04 pour ne plus avoir le warning https://assets.highcharts.com/errors/15/ et avoir le navigator correct
					return a[0]-b[0]
				});
				dernier_resultat = processed_json[nbmes-1][1]; // 2021-08-16 dernier résultat peut avoir changé du fait du tri ou du code remarque, on le met donc en fin de traitement
				if (dernier_resultat > 999.9) { dernier_resultat = 999.9; }
				delayedAlert(Math.round(dernier_resultat*10)); // si on veut 1 chiffre après la virgule. Il faut changer le thème odometer pour avoir dernier chiffre en gris
				var options = {timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit"};
				date_max = new Date(processed_json[nbmes-1][0]);	// je n'utilise pas les heures de prélèvement car sont trop souvent à 00:00 
				classdat.innerHTML = "<b>"+nbmes+"</b> analyses - Dernière analyse le <b>" + date_max.toLocaleDateString('fr-FR', options) + "</b>";
				graphique(sgrandeur, syaxis, '%e %b %Y', -1, symb, false, couleur);
				break;
			case 'hydrobio':
				traitement_unite(true); // voir si unité est tjs /20 ou pas (pas pour IPR)
				delayedAlert(Math.round(jsondata[jsondata.length-1]['resultat_indice'] * 10)); // x10 pour afficher 1 chiffre après la virgule et round pour éliminer décimales après la 1ere.
				date_max = jsondata[jsondata.length-1]['date_prelevement']; 
				classdat.innerHTML = "<b>"+nbmes+"</b> indices - Dernier résultat le <b>" + convertDateISO(date_max) + "</b>";
				for(var key in jsondata) {
					jsondata[key]['date_prelevement'] = Date.parse(jsondata[key]['date_prelevement']);
					niv = jsondata[key]['resultat_indice'];
					processed_json.push([jsondata[key]['date_prelevement'], niv]);
				}
				var baxeyrev = false;
				if (grandeur == 7036) { baxeyrev = true; } // Les IPR vont de 0 (meilleur) à 150
				var nbdec = 1;
				if (grandeur == 7613) { nbdec = 3; } // I2M2 vont de 0 à 1
				graphique(sgrandeur, syaxis, '%e %b %Y', nbdec, symb, false, couleur, 'scatter', baxeyrev, true);
				break;
			case 'temperature':
				// TODO : faire cache température par stations pour stocker toutes les données quand plus de 5000, et n'interroqer que les 5000 dernières
				// ou implémenter requêtes multiples
				//Date.parse fournit le timestamp selon l'heure locale de l'ordi si pas de fuseau horaire. ajouter +00:00 à la fin
				// Quel est le fuseau horaire utilisé pour la température ??? Pour retranscrire les heures telles qu'elles sortent de hub'eau, ajouter +00:00 à la fin
				for(var key in jsondata) {
					dt = Date.parse(jsondata[key]['date_mesure_temp'] + 'T' + jsondata[key]['heure_mesure_temp'] + '+00:00');
					niv = jsondata[key]['resultat'];
					processed_json.push([dt, niv]);
				}
				processed_json.sort(function(a,b) {
					return a[0]-b[0]
				});
				delayedAlert(Math.round(processed_json[nbmes-1][1]*10)); // si on veut 1 chiffre après la virgule. récupération du dernier résultat, correspondant à date_max
				document.getElementsByClassName("metres")[0].innerHTML = '&nbsp;°C';
				var options = {timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"};
				date_max = new Date(processed_json[nbmes-1][0]);
				classdat.innerHTML = "<b>"+nbmes+"</b> mesures - Dernière mesure le <b>" + date_max.toLocaleDateString('fr-FR', options) + "</b>";
				graphique('Température de l\'eau', 'Température (°C)', '%e %b %Y à %H:%M', 2, '°C', false, 1);
				break;
			}	

			if ((typeof(tablimit[grandeur]) !== 'undefined') && (code_support != 6) && (htgraph >= 120)) { // on ne propose valeur seuil que s'il y a assez de place
				document.getElementById("limit").style.display = 'block';
			} else {
				document.getElementById("limit").style.display = 'none';
			}	
			console.log(htgraph);
			if (blimit && (typeof(tablimit[grandeur]) !== 'undefined') && (code_support != 6)) { // 2021-08-24 limite de qualité
				d1 = processed_json[0][0];
				d2 = processed_json[nbmes-1][0];
				lim = tablimit[grandeur];
				myChart.addSeries({
							name: 'limite supérieure de qualité',
							color: 'rgb(255, 0, 0)',
							lineWidth: 2,
							yAxis: 0,
							data: [[d1,lim],[d2,lim]]
				}); 
			}	

		} else {
			delayedAlert(0);
			document.getElementsByClassName("metres")[0].innerHTML = '&nbsp;' // 2021-08-31 on enlève unité d'une éventuelle requête antérieure
			classdat.innerHTML = s0;
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
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/pointBleu_on.png'
		}))
    });
	iconPiezoNat[1] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/pointViolet_on.png'
		}))
    });

	tabnat = [true,true]; // affichage des natures (1 pour plan d'eau, 2 pour cours d'eau) 
	sim = ['on','on'];
	nature = '';
	if (typeof(f['nature']) !== 'undefined') { 
		nature = f['nature'].toLowerCase();
		if (nature.indexOf('1') == -1) { tabnat[0] = false; sim[0] = 'off'; } 
		if (nature.indexOf('2') == -1) { tabnat[1] = false; sim[1] = 'off'; } 
		affiche_legende();
		//document.getElementById("legende").innerHTML = 'Type de station :&nbsp;&nbsp;<img class="imgleg" src="images/pointBleu_' + sim[0] + '.png" title="Plan d\'eau" onclick="icotyp(this)">&nbsp;&nbsp;Plan d\'eau&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointViolet_' + 
		//	sim[1] + '.png" title="Cours d\'eau" onclick="icotyp(this)">&nbsp;&nbsp;Cours d\'eau';
	}
}

function traitement_station() {
			dm.style.cursor = "wait";
			if (feat.get('ipt')) { // affichage de la bonne couleur du symbole dans le titre de la station
				switch (rep[feat.get('ipt')][snat].toLowerCase()) {
					case '1': scou = 'Bleu'; break;
					case '2': scou = 'Violet'; break;
				}	
				document.getElementById('titre_detail').innerHTML = '<img src="images/point' + scou + '_on.png" title="' + rep[feat.get('ipt')][snat] + '">&nbsp;&nbsp;<b>Détail de la station de mesure</b> <i><class id="code"></class></i>'; 
			}	
			classbss.innerHTML = '<a href="https://www.sandre.eaufrance.fr/geo/StationMesureEauxSurface/' + bss + '" target="_blank">Plus d\'informations sur la station de mesure</a>';
			document.getElementById("code").innerHTML = bss; 
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
	// paramètres spécifiques : grandeur (code SANDRE du paramètre physico-chimique), code_support, blimit, resdeb (date de début de la récupération des données et du tracé de la courbe) 
	// pour le zoom : code_station est prioritaire sur coord qui est prioritaire sur adresse
	
	carte_commun();
	//smembres = prefix + '_membres';
	remplit_select_param(prefix + '_membres');

	event_params();
	
	//affiche_legende();

//console.log(console.memory.totalJSHeapSize.toLocaleString());
//console.log(console.memory.usedJSHeapSize.toLocaleString());
//console.log(console.memory.jsHeapSizeLimit.toLocaleString());	
}

function get_support_grandeur() {
	par = JSON.parse(ajaxGet(chemin+'data/parametres_qual.json'));
	//console.table(par.parametres);	
	nbfam = par.familles.length;
	nbparam = par.parametres.length;
	tablib = new Array();
	tabnom = new Array();
	tabsupfam = new Array();
	supopt_code = new Array();
	supopt_lib = new Array();
	supopt_pref = new Array();
	valmax = new Array();
	tabk = new Array();
	tablimit = new Array();
	for (var k = 0; k < par.parametres.length; k++) {
		tablib[par.parametres[k].code] = par.parametres[k].libelle;
		tabnom[par.parametres[k].code] = par.parametres[k].nom;
		valmax[par.parametres[k].code] = par.parametres[k].max;
		tabk[par.parametres[k].code] = k;
		//console.log(par.parametres[k].code, valmax[par.parametres[k].code]);
		// pour les ESU il n'y a qu'une limite qqsoit le support donc on va utiliser eau_limit qqsoit le support (par exemple pour IBD ou IPR). Par contre ces limites ne sont pas valables pour sédiments
		tablimit[par.parametres[k].code] = par.parametres[k].eau_limit; 
	}	
	for (var k = 0; k < par.supports.length; k++) {
		supopt_code[par.supports[k].ordre] = par.supports[k].code;
		supopt_lib[par.supports[k].ordre] = par.supports[k].libelle;
		supopt_pref[par.supports[k].ordre] = par.supports[k].prefix;
	}	

	if (typeof(f['code_support']) !== 'undefined') { 
		elmt_sup = document.getElementById("code_support");
		code_support = f['code_support'];
		traitement_support();
		remplit_select_support();
		ancsup = code_support;
	}

	// grandeur doit venir après code_support sinon c'est toujours la grandeur par défaut qui est prise
	// grandeur = 1340; sgrandeur = 'Nitrates'; libel = 'Teneur en Nitrates (NO3)';
	// si la grandeur saisie dans l'URL n'est pas dans le fichier de paramètres, on rebascule sur Nitrates. par contre ça interdit de rentrer des codes valides non présents dans le fichier (posent pb de nom et titre axe)
	if ((typeof(f['grandeur']) !== 'undefined') || (typeof(f['code_parametre']) !== 'undefined')) { 
		if (typeof(f['grandeur']) !== 'undefined') { tgrandeur = f['grandeur']; } else { tgrandeur = f['code_parametre']; }
		if (tgrandeur == '1391') { tgrandeur = '7073'; } // cas particulier du Fluor 2021-08-27
		if (tgrandeur == '1304') { tgrandeur = '1303'; } // cas particulier de la Conductivité 2021-08-29
		if (typeof(tablib[tgrandeur]) !== 'undefined') { 
			// si code_support est entré par l'utilisateur et incompatible avec grandeur, code_support est prioritaire (affichage code_support dans select et grandeur par défaut de ce support
			// pouvoir écrire sur une ligne d'état ce qui est fait (code_support prioritaire affiché, grandeur non prise en compte
			var k = tabk[tgrandeur];
			if (typeof(f['code_support']) !== 'undefined') { 
				if (par.parametres[k].code_support.indexOf(parseInt(f['code_support'], 10)) != -1) { // le support saisi est dans la liste des supports du paramètre grandeur
					grandeur = tgrandeur; 
					libel = tablib[grandeur];
					sgrandeur = tabnom[grandeur];
				} else {
					alert('code paramètre ' + tgrandeur + ' incompatible avec le code support ' + code_support +
						' saisi. Le code support, prioritaire, est conservé ; le paramètre retenu est celui par défaut pour ce support (' + grandeur + ' - ' + sgrandeur + ')'); 		
				}		
			}	
			if ((typeof(f['code_support']) === 'undefined') && (typeof(par.parametres[k].code_support[0]) !== 'undefined') && (typeof(par.parametres[k].code_support[1]) === 'undefined')) {
				// 1 seul support déclaré pour ce paramètre, on lui assigne d'office son bon support SI AUCUN code_support entré par l'utilisateur
				code_support = par.parametres[k].code_support[0].toString();
				traitement_support();
				grandeur = tgrandeur; // traitement_support() a remis le paramètre par défaut du support
				libel = tablib[grandeur];
				sgrandeur = tabnom[grandeur];
				remplit_select_support();
				ancsup = code_support;
			}
			// si le paramètre grandeur a un support 3 dans le fichier parametres_qual.json et que aucun code_support n'a été saisi, alors on le garde	
			if ((typeof(f['code_support']) === 'undefined') && (par.parametres[k].code_support.indexOf(3) != -1)) {
				grandeur = tgrandeur; 
				libel = tablib[grandeur];
				sgrandeur = tabnom[grandeur];
			}	
		} else { // code paramètre non connu dans fichier parametres_qual : on garde paramètre par défaut
			alert('code paramètre ' + tgrandeur + ' non reconnu par l\'application. Le paramètre par défaut ' + sgrandeur + ' est conservé.');
		}	
	}	
}

// TODO : si une station est sélectionnée, mettre le nb d'analyses dispo pour chaque paramètre en infobulle? (nécessite plusieurs requêtes Hub'Eau)
function remplit_select_param(smembres) {
	ssel = '';
	var bsel = false;
	for (var i = 0; i < nbfam; i++) {
		tabsupfam = par.familles[i].code_support;
		if ((tabsupfam.indexOf(code_support.toString()) != -1) || (tabsupfam.indexOf(parseInt(code_support, 10)) != -1)) { // traitement de la famille si elle correspond au support
			ssel += '    <OPTGROUP label="' + par.familles[i].libelle + '">';
			memb = par.familles[i][smembres];
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
}

function traitement_support() {
	// 2021-08-22 Quand la grandeur actuelle existe dans le support d'arrivée, la conserver au lieu de prendre la grandeur par défaut du support. 
	// Ne se produit que entre 3 et 6, 3 et 99. Il faut qu'une station soit sélectionnée
	// + utiliser parametres_qual.json
	switch (code_support.toString()) {
	  case '3':
		prefix = 'eau';
		// tester en + si éligible sur support 3 ? && (par.parametres[k].code_support.indexOf(3) != -1)
		if ((typeof(bss) !== 'undefined') && (typeof(grandeur) !== 'undefined') && ((ancsup.toString() == '99') || (ancsup.toString() == '6'))) { // garder la grandeur, si pas dans liste déroulante, l'ajouter sous paramètre utilisateur
		} else {	
			grandeur = 1340;
		}	
		document.getElementById("code_support").title = "171 156 858 analyses disponibles";
		break;
	  case '4':
		prefix = 'poi';
		grandeur = 7036;
		document.getElementById("code_support").title = "209 597 indices disponibles";
		break;
	  case '6':
		prefix = 'sed';
		var k = tabk[grandeur];
		// 2021-08-26 ajout du test pour voir si le paramètre est éligible pour support 6
		if ((typeof(bss) !== 'undefined') && (typeof(grandeur) !== 'undefined') && (ancsup.toString() == '3') && (par.parametres[k].code_support.indexOf(6) != -1)) { // garder la grandeur en provenance de support 3
		} else {	
			grandeur = 1382;
		}	
		document.getElementById("code_support").title = "5 497 831 analyses disponibles";
		break;
	  case '10':
		prefix = 'dia';
		grandeur = 5856;
		document.getElementById("code_support").title = "191 517 indices disponibles";
		break;
	  case '13':
		prefix = 'inv';
		grandeur = 1000;
		document.getElementById("code_support").title = "456 388 indices disponibles";
		break;
	  case '27':
		prefix = 'phy';
		grandeur = 2928;
		document.getElementById("code_support").title = "21 960 indices disponibles";
		break;
	  case '99':
		prefix = 'tem';
		grandeur = 1301;
		document.getElementById("code_support").title = "36 709 485 mesures disponibles";
		break; 
	  default:
		prefix = 'eau';
		grandeur = 1340;
	}
	snbmes = prefix + '_nbobs'; 
	sdatedeb = prefix + '_datedeb'; 
	sdatefin = prefix + '_datefin'; 
	libel = tablib[grandeur];
	sgrandeur = tabnom[grandeur];
}	

function remplit_select_support() {
	var sopt = '';
	for (var i in supopt_code) { // pour avoir les supports dans le bon ordre
		sopt += '<option value="' + supopt_code[i] + '"';
		if(code_support.toString() == supopt_code[i].toString()) { sopt += ' selected="selected"'; } 
		sopt += '>' + supopt_lib[i] + '</option>';
	}
	document.getElementById("code_support").innerHTML = sopt;
}

// alternative : afficher tous les paramètres, ainsi que leur valeur actuelle, au centre de l'écran dans un cadre. Le cadre s'ouvre après click sur un bouton Paramètres additionnels sous layerswitcher 
// ou laisser toujours affiché ?
//essayer de placer des contrôles pour pouvoir régler tous ces paramètres individuellement. limit = liste déroulante oui/non sur le graphique, nbobsmin, datedeb et datefin qqpart à gauche, grandeur, code_station et coord?
// "Valeur seuil" en placeholder puis oui et non (ou case à cocher Valeur seuil). A coté de Tout ? ou à gauche du sélecteur highcharts? ou en dessous titre graphique (si limite dispo dans fichier paramètres)
/*
function get_valeur(){
	//document.getElementById('fen_param').style.display = 'none';
	//valparam = document.getElementById("valparam").value;
	bregraph = false;
	bremap = false;
	grandeur_anc = grandeur;
	if (typeof(bss) !== 'undefined') { 
		bss_anc = bss;
	} else {
		bss_anc = '';
	}	
	var ll = ol.proj.toLonLat(map.getView().getCenter());
	coord_anc = ll[0].toFixed(2) + ',' + ll[1].toFixed(2);
	datedeb_anc = datedeb;
	datefin_anc = datefin;
	blimit_anc = blimit;
	nbanamin_anc = nbanamin;

	grandeur = document.getElementById("val0").value;
	if (grandeur_anc != grandeur) { 
		bregraph = true;
		libel = tablib[grandeur];
		sgrandeur = tabnom[grandeur];
		remplit_select_param(prefix + '_membres');
	}

	bss = document.getElementById("val1").value;
	if (bss_anc != bss) { 
		ifeat = -1;
		for (ipt = 0; ipt < rep.length; ipt++) {
			if (rep[ipt][scode] == bss) { ifeat = ipt }; // ne fonctionnera pas avec geojson qui ne passe pas par rep
		}
		if (ifeat != -1) {
			feat = markerPiezoFeature[ifeat];
			var c = feat.getGeometry().getCoordinates();
			AdrFeature.getGeometry().setCoordinates(c);
			map.getView().setCenter(c);
			map.getView().setZoom(12);
			traitement_station(); // appelle ensuite donnees_piezo(bss)
			bremap = true;
			// incompatibilités parfois entre le zoom sur la station et la valeur de coord qui reste fixe. Enlever coord de la liste? et même code_station? (pas très utile...)
		}	
	}

	coord = document.getElementById("val2").value;
	if (coord_anc != coord) {
		var lonlat = coord.split(',');
		if (!isNaN(lonlat[0]) && !isNaN(lonlat[1])) {
			longit = parseFloat(lonlat[0]);
			latit = parseFloat(lonlat[1]);
			coordinate = ol.proj.fromLonLat([longit, latit]);
			AdrFeature.getGeometry().setCoordinates(coordinate);
			map.getView().setCenter(coordinate);
			//map.getView().setZoom(12);  
		} else {
			console.log('Les coordonnées entrées en paramètres ont été ignorées car incorrectes : longitude = ' + lonlat[0] + ', latitude = ' + lonlat[1]); // A mettre dans future ligne d'état
		}	
	}	

	if ((bregraph) && (typeof(bss) !== 'undefined')) { 
		dm.style.cursor = "wait";
		document.getElementById("search").style.cursor = "wait";
		donnees_piezo(bss);
	}
	if (bremap) { redrawStations(); }
}
*/

function affiche_legende() {
	document.getElementById("legende").innerHTML = 'Type de station :&nbsp;&nbsp;<img class="imgleg" src="images/pointBleu_' + sim[0] + '.png" title="Plan d\'eau" onclick="icotyp(this)">&nbsp;&nbsp;Plan d\'eau&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointViolet_' + 
		sim[1] + '.png" title="Cours d\'eau" onclick="icotyp(this)">&nbsp;&nbsp;Cours d\'eau&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 
		'nbobsmin = <input type="text" id="val6" name="val6" size="6" title="Affichage uniquement des stations ayant au moins nbobsmin observations" placeholder="nbobsmin" value="' + nbanamin + '">&nbsp;&nbsp;' + 
		'datedeb = <input type="text" id="val3" name="val3" size="8" title="Affichage uniquement des stations ayant des données antérieures à datedeb" placeholder="datedeb" value="' + datedeb + '">&nbsp;&nbsp;' +
		'datefin = <input type="text" id="val4" name="val4" size="8" title="Affichage uniquement des stations ayant des données postérieures à datefin" placeholder="datefin" value="' + datefin + '">';
}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' - ' + feat.get(slib);
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
