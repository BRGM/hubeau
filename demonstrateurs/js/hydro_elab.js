// *** hydro_elab.js v1.0.0 2021-08-06 Regroupement de :
	// *** qmm.js v1.0.0 2020-06-08 *** Fonctions js utilisées par qmm.htm, interrogation de fichiers xml statiques ***
	// *** qmj.js v1.0.0 2021-06-01 *** Interrogation de Hub'Eau rec, débits journaliers en courbes ***
// *** hydro_elab.js v1.1.0 2021-11-26 *** utilisation URLs de prod et nouveau fichier data contenant toutes les stations ayant au moins 1 QmJ ou QmM + infobulles avec nb et datedeb QmJ et M
// *** hydro_elab.js v2.0.0 2021-12-22 *** branchement nbobsmin, datedeb et datefin + suppression contact + gestion stations de type J ou M comme codes_support pour pouvoir les afficher quand grandeur change
// *** hydro_elab.js v2.1.0 2022-08-02 *** branchement seuil et resdeb. 
// passer les URL en asynchrone, on doit pouvoir car pas de limite de 20000 avec cursor ? suivre les liens dans next
// + implémenter size (pas prioritaire)

// *** variables globales ***
	slong = 'longitude_station';
	slat = 'latitude_station';
	scode = 'code_station';
	slib = 'libelle_station';
	smeau = 'libelle_cours_eau';
	snbmes = 'nbqmj';
	sdatefin = 'datefin_qmj';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	sdatedeb = 'datedeb_qmj';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	snat = 'type_station'; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	ssupport = 'type_donnee'; // 2021-12-22 pour gérer affichage des stations en fonction des données J ou  M. Gérer J et M commme des code_support.
	sres = 'valmax_qmj'; // nom du champ dans le fichier station pour le résultat max (permet de discriminer l'affichage des stations par seuil de résultat). Peut ne pas exister ('')
	sunit = ''; // nom du champ unité dans la réponse hubeau
	iconfile = 'HydrometrieBleu_on.svg';
	iconscale = 6;
	icony = 32;
	fdp = 'jawg2';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = false;
	size = 20000;
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['day', 'month', 'year', 'year'];
	co = [7, 1, 1, 10];
	te = ['1 semaine', '1 mois', '1 an', '10 ans'];
	down_img_top = 324+10-65; // position de arrowdown +10 pour compenser la hauteur de l'icone -65 suppression Contact tout en permettant affichage détails station sur 2 lignes
	ajout = 100000; // 6 chiffres dont 1 décimale
	station_layer_name = 'https://hubeau.eaufrance.fr/sites/default/files/api/demo/data/demo_hydroelab_stations.json'; // nom du fichier des stations, changement 2021-11-26
	station_layer_type = 'json'; // json ou geojson
	setat = 'stations'; // 2021-08-26 phrase qui doit apparaître dans la ligne d'état
// **************************

code_support = 'J';
seuil = 0;
station_layer(false);

function changeGrandeur() {
	grandeur = document.getElementById('grandeur').value;
	// si une station est affichée, changer le graphique avec la nouvelle grandeur
	if (typeof(bss) !== 'undefined') { 
		donnees_piezo(bss);
	} 
	snbmes = 'nb' + grandeur.toLowerCase();
	sdatefin = 'datefin_' + grandeur.toLowerCase();
	sdatedeb = 'datedeb_' + grandeur.toLowerCase();
	code_support = grandeur.toUpperCase().substring(2,3);
	redrawStations(); // 2021-12-22 // pour n'afficher que les stations concernées par QmJ ou QmM
}

function donnees_piezo(bss) {
		var classdat = document.getElementById("dat");
		qdata = new Array();
		processed_json = new Array();   
		var ireq = 0;
		// size=20000 imposée car on veut tout l'historique et faire éventuellement plusieurs requêtes
		// sort=desc ne fonctionne pas dans obs_elab : pas de possibilité simple de mettre en oeuvre le paramètre size
		var urlq = "https://hubeau.eaufrance.fr/api/v1/hydrometrie/obs_elab?code_entite=" + bss + "&grandeur_hydro_elab=" + grandeur + "&size=20000&fields=date_obs_elab,resultat_obs_elab"; 
		if (typeof(resdeb) !== 'undefined') { // 2022-08-02 prise en compte date de début des résultats
			urlq += '&date_debut_obs_elab=' + resdeb;
		}
		j=0;
		d = new Array();
		r = new Array();
		//deb_min = 10000000;
		//deb_max = -1000000;
		
		var bcont = true;
		while (bcont) {	
			ireq++;
			var repq = JSON.parse(ajaxGet(urlq)); 
			qdata = repq.data;
			for(var i in qdata) {
				d[j] = qdata[i]['date_obs_elab'];
				r[j] = qdata[i]['resultat_obs_elab'];
				date_obs = Date.parse(d[j]);
				deb = r[j]/1000;
				processed_json.push([date_obs, deb]);
				//if (deb < deb_min) { deb_min = deb; }
				//if (deb > deb_max) { deb_max = deb; }
				j++;
			}
			console.log("j="+j);
			bcont = (j >= 20000*ireq);
			console.log("bcont="+bcont);
			if (bcont) {
				lastdate = qdata[19999]['date_obs_elab'];
				urlq = 	"https://hubeau.eaufrance.fr/api/v1/hydrometrie/obs_elab?code_entite=" + bss + "&grandeur_hydro_elab=" + grandeur + "&size=20000&fields=date_obs_elab,resultat_obs_elab&date_debut_obs_elab=" + lastdate; 
				console.log("urlq="+urlq);
			}	
		}
		nbmes = d.length;
		if (nbmes > 0) { // certaines stations n'ont pas de débit moyen
			delayedAlert(Math.round(r[nbmes-1]/100)); // pour afficher un chiffre après la virgule
			//qdate_min = d[0]; 
			qdate_max = d[nbmes-1];
				if (grandeur == 'QmM') { 
					classdat.innerHTML = "Dernier mois de calcul : <b>" + convertMoisISO(qdate_max) + "</b>";
					graphique('Débit moyen mensuel', 'Débit (m3/s)', '%b %Y', 2, 'm3/s', false, 1, 'column'); // this.x+86400000 pour ajouter 1 jour et afficher le bon mois -- type: 'column', 
				} else {
					classdat.innerHTML = "<b>"+nbmes+"</b> données. Dernier jour : <b>" + convertDateISO(qdate_max) + "</b>";
					graphique('Débit moyen journalier', 'Débit (m3/s)', '%e %b %Y', 2, 'm3/s', false, 1, 'scatter');
				}	
		} else {
			classdat.innerHTML = "Pas de débit moyen disponible";
			delayedAlert(0);
			if (typeof myChart != 'undefined') {
				myChart.series[0].remove();
			}	
		}
}

/* hydro_tr.js
		nbmes = jsondata.length;
		if (nbmes > 0) { // certaines stations n'ont pas de mesure sur les 30 derniers jours
			date_max = jsondata[0]['date_obs']; 
			classdat.innerHTML = "Dernière mesure le <b>" + convertDateTimeISO(date_max) + " UTC</b>";
			if (grandeur == 'H') { 
				dernier_resultat = jsondata[0]['resultat_obs'];
				if (dernier_resultat < 0) { dernier_resultat = 0; }
				delayedAlert(Math.round(dernier_resultat*10)); // pour 1 chiffre derrière la virgule. On garde les mm
				for(var key in jsondata) { // il faudrait parcourir le tableau en ordre inverse
					jsondata[key]['date_obs'] = Date.parse(jsondata[key]['date_obs']);
					deb = jsondata[key]['resultat_obs'];  // différence avec les débits : on ne divise pas par 1000
					processed_json.push([jsondata[key]['date_obs'], deb]);
				}
			} else {	
				dernier_resultat = jsondata[0]['resultat_obs']/1000; 
				if (dernier_resultat < 0) { dernier_resultat = 0; }
				delayedAlert(Math.round(dernier_resultat*10)); // pour afficher un chiffre après la virgule
				for(var key in jsondata) {
					jsondata[key]['date_obs'] = Date.parse(jsondata[key]['date_obs']);
					deb = jsondata[key]['resultat_obs']/1000;
					processed_json.push([jsondata[key]['date_obs'], deb]);
				}
			}	

			processed_json.sort(function(a,b) { // ajout 2021-08-04 pour ne plus avoir le warning https://assets.highcharts.com/errors/15/ et avoir le navigator correct
				return a[0]-b[0]
			});
}	
*/

function init_nat() { // partie spécifique au démonstrateur pour le traitement des natures
   	iconPiezoNat = new Array();
	iconPiezoNat[0] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/HydrometrieBleu_on.svg'
		}))
    });
	iconPiezoNat[1] = new ol.style.Style({
		image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
		  anchor: [0.5, icony],		  anchorXUnits: 'fraction',		  anchorYUnits: 'pixels',		  opacity: 1.0,		  src: 'images/HydrometrieMauve_on.svg'
		}))
    });

	// Limnimètre - cas courant(échelle limnimétrique avec ou sans courbe de tarage)
	// Debitmètre - pour une station délivrant directement une information de débit. Des données de hauteur peuvent exister sur ce type de station mais il n’y a pas de courbe de tarage
	tabnat = [true,true]; // affichage des natures ('LIMNI' pour limnimètre, 'DEB' pour débitmetre) 
	sim = ['on','on'];
	nature = '';
	if (typeof(f['nature']) !== 'undefined') { 
		nature = f['nature'].toLowerCase();
		if (nature.indexOf('limni') == -1) { tabnat[0] = false; sim[0] = 'off'; } 
		if (nature.indexOf('deb') == -1) { tabnat[1] = false; sim[1] = 'off'; } 
		affiche_legende();
	}
}

function traitement_station() {
			dm.style.cursor = "wait";
			if (feat.get('ipt')) { // affichage de la bonne couleur du symbole dans le titre de la station
				switch (rep[feat.get('ipt')][snat].toLowerCase()) {
					case 'limni': scou = 'Bleu'; break;
					case 'deb': scou = 'Mauve'; break;
				}	
				document.getElementById('titre_detail').innerHTML = '<img src="images/Hydrometrie' + scou + '_on.svg" title="' + rep[feat.get('ipt')][snat] + '"><b>Détail de la station de mesure</b> <i><class id="code"></class></i>'; 
			}	
			//classdist.innerHTML = bss;
			classbss.innerHTML = '<a href="https://www.vigicrues.gouv.fr/niv3-station.php?CdStationHydro=' + bss + '&GrdSerie=Q&ZoomInitial=3" target="_blank">Plus d\'informations sur la station de mesure</a>';
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
	// paramètres possibles :  code_station, grandeur (QmM ou QmJ), adresse, coord, fdp, seuil, resdeb (date de début de la récupération des données et du tracé de la courbe)
	// pour le zoom, code_station est prioritaire sur coord qui est prioritaire sur adresse
	f = extractUrlParams();
	grandeur = 'QmJ'; // par défaut
	if (typeof(f['grandeur']) !== 'undefined') { 
		var elmt = document.getElementById("grandeur");
		switch (f['grandeur'].toLowerCase()) {
		  case 'qmm':
			grandeur = 'QmM';
			elmt.selectedIndex = 1;
			break;
		  case 'qmj':
			grandeur = 'QmJ';
			elmt.selectedIndex = 0;
			break;
		  default:
			elmt.selectedIndex = 0;
		}	
	}
	snbmes = 'nb' + grandeur.toLowerCase();
	sdatefin = 'datefin_' + grandeur.toLowerCase();
	sdatedeb = 'datedeb_' + grandeur.toLowerCase();
	sres = 'valmax_' + grandeur.toLowerCase();
	code_support = grandeur.toUpperCase().substring(2,3);
	redrawStations(); // 2021-12-22 // pour n'afficher que les stations concernées par QmJ ou QmM

	// Appel des variables et fonctions communes pour la carte
	carte_commun();
	event_params();
}

function affiche_legende() {
		document.getElementById("legende").innerHTML = '<img class="imgleg" src="images/HydrometrieBleu_' + sim[0] + '.svg" title="LIMNI" onclick="icoapp(this)">&nbsp;&nbsp;Limnimètre&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/HydrometrieMauve_' + 
			sim[1] + '.svg" title="DEB" onclick="icoapp(this)">&nbsp;&nbsp;Débitmètre&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 
		'nbobsmin = <input type="text" id="val6" name="val6" size="6" title="Affichage uniquement des stations ayant au moins nbobsmin débits" placeholder="nbobsmin" value="' + nbanamin + '">&nbsp;&nbsp;' + 
		'datedeb = <input type="text" id="val3" name="val3" size="8" title="Affichage uniquement des stations ayant des débits antérieure à datedeb" placeholder="datedeb" value="' + datedeb + '">&nbsp;&nbsp;' +
		'datefin = <input type="text" id="val4" name="val4" size="8" title="Affichage uniquement des stations ayant des débits postérieurs à datefin" placeholder="datefin" value="' + datefin + '">';
}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' - ' + feat.get(slib);
	if (rep[j]['nbqmj'] > 0) { content.innerHTML += '<br>' + rep[j]['nbqmj'] + ' débits moyens journaliers à partir du ' + convertDateISO(rep[j]['datedeb_qmj']); }
	if (rep[j]['nbqmm'] > 0) { content.innerHTML += '<br>' + rep[j]['nbqmm'] + ' débits moyens mensuels à partir de ' + convertMoisISO(rep[j]['datedeb_qmm']); }
}
