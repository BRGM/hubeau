// *** prel.js v1.0.0 2022-07-29 *** Basé sur piezo_chroniques.js ***
// introduire un volmin et volmax et pouvoir rechercher tous les points qui ont été au dessus de volmax dans leur historique
// pour résoudre les pbs d'affichage des ouvrages (trop nombreux > 100 000), n'afficher que ceux de volmax supérieur à un certain seuil ? ou plutôt ne faire apparaître l'ouvrage dans le fichier qu'à partir de ce seuil

// *** variables globales ***
	slong = 'longitude';
	slat = 'latitude';
	scode = 'code_ouv';
	slib = 'nom_ouv';
	smeau = ''; // pas d'entité ou de masse d'eau disponible
	snbmes = 'nbvol'; // nom du champ dans le fichier station pour le nb de données/mesures/analyses. Peut ne pas exister ('')
	sdatefin = 'anneefin';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	sdatedeb = 'anneedeb';   // nom du champ dans le fichier station pour la date de fin. Permet de n'afficher que les stations qui dont des données postérieures à date passé en paramètre. Peut ne pas exister ('')
	snat = 'milieu'; // nom du champ dans le fichier station pour la nature (permet de discriminer l'affichage des stations par couleur ou présence/absence). Peut ne pas exister ('')
	sparam = ''; 
	sres = 'volmax'; // nom du champ dans le fichier station pour le résultat max (permet de discriminer l'affichage des stations par seuil de résultat). Peut ne pas exister ('')
	sunit = ''; // nom du champ unité dans la réponse hubeau
	iconfile = 'pointOr_on.png'; // l'image 'iconPiezo.svg' met trop de temps à charger quand beaucoup d'éléments et nécessiterait clustering
	iconscale = 15;
	icony = 0; // 32
	fdp = 'esri_topo3';
	fp1 = true; fp2 = true; fp3 = true; fp4 = false; fp5 = true; fp6 = true; fp7 = true;
	size = 20000; 
	// tableaux pour rangeSelector de la fonction graphique()
	ty = ['year', 'year', 'year', 'year'];
	co = [3, 5, 7, 10];
	te = ['3 ans', '5 ans', '7 ans', '10 ans'];
	down_img_top = 278+30-75-10; // position de arrowdown pour gérer affichage graphique +30 pour possibilité station+nappe sur 3 lignes -75 suppression Contact -10 que 2 lignes pour station
	ajout = 1000000000; // pour afficher 9 chiffres dans odometer
	station_layer_name = chemin + 'data/demo_prel_stations.json'; // nom du fichier des stations
	station_layer_type = 'json'; // json ou geojson
	setat = "ouvrages"; // 2021-08-26 phrase qui doit apparaître dans la ligne d'état
// **************************

/*
window.odometerOptions = {
  format: '( ddd)' // Change how digit groups are formatted, and how many digits are shown after the decimal point
}; // ne fonctionne pas -> utilisation de odometer-prel.js
*/
grandeur = "prel"; // pour éviter erreur dans les tooltips
seuil = 0; 
station_layer(false); 
	
function donnees_piezo(bss) {
		var classdat = document.getElementById("dat");
		jsondata = new Array();
		processed_json = new Array();   
		// sort=desc pour que le paramètre GET size permette d'afficher les size dernières valeurs. Mais du coup les tableaux ne sont plus bien triés
		urlobs = "https://hubeau.eaufrance.fr/api/v1/prelevements/chroniques?code_ouvrage=" + bss + "&size=" + size + "&fields=annee,volume&sort=desc"; 
		asyncReq(function(result) {
			var rep = JSON.parse(result); 
			jsondata = rep.data;
			nbmes = jsondata.length;
			
			// Attention il peut y avoir plusieurs enregs par année pour un ouvrage (ex : OPR0000001870 en 2016).
			anneeanc = 0;
			i = -1;
			if (nbmes > 0) { 
				for(var key in jsondata) {
					an = jsondata[key]['annee'];
					niv = jsondata[key]['volume']; 
					if (an == anneeanc) {
						processed_json[i][1] = processed_json[i][1] + niv;
					} else {
						i++;
						dat = Date.parse(an); // on garde une date en X pour être compatible avec les graphiques des autres démonstrateurs
						processed_json.push([dat, niv]);
						anneeanc = an;
					}	
				}
				processed_json.sort(function(a,b) { // ajout 2021-08-04 pour ne plus avoir le warning https://assets.highcharts.com/errors/15/ et avoir le navigator correct
					return a[0]-b[0]
				});
				dernier_resultat = processed_json[i][1]; 
				if (dernier_resultat > 999999999) { dernier_resultat = 999999999; } // 2022-08-01 chiffre affiché quand dépassement
				delayedAlert(dernier_resultat); // pas de chiffre après la virgule, plus de dernier chiffre en gris dans prel.htm
				//var options = {timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit"};
				//date_max = new Date(processed_json[nbmes-1][0]);
				classdat.innerHTML = "<b>"+ (i+1) +"</b> mesures annuelles - Dernière année disponible : <b>" + jsondata[0]['annee'] + "</b>";
				graphique("Volume annuel prélevé", 'Volume (m3)', '%Y', -1, 'm', false, 1, 'column', false, false);
				document.getElementById("limit").style.display = 'none';
				// pourvoir corriger le fichier stations qui peut afficher un nbvol trop élevé
				//console.table(processed_json);
			} else {
				delayedAlert(0);
				classdat.innerHTML = "Pas de mesure disponible";
				graphique("Volume annuel prélevé", '', '%Y', -1, 'm', false, 1, 'column', false, false);
			}
			dm.style.cursor = "default";
			document.getElementById("search").style.cursor = "default";
		});		
}	

function init_nat() { // partie spécifique au démonstrateur pour le traitement des natures (correspond au milieu de prélèvement pour ce démonstrateur)
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

	tabnat = [true,true,true]; // affichage des natures (souterrain,superficiel,littoral) 
	sim = ['on','on','on'];
	nature = '';
	if ((typeof(f['nature']) !== 'undefined') || (typeof(f['milieu']) !== 'undefined')) { // 2022-08-02 on permet d'avoir le paramètre GET milieu à la place de nature
		if (typeof(f['milieu']) !== 'undefined') { nature = f['milieu'].toLowerCase(); } else { nature = f['nature'].toLowerCase(); } // priorité à milieu sur nature si les 2 sont présents
		//nature = f['nature'].toLowerCase();
		if (nature.indexOf('sout') == -1) { tabnat[0] = false; sim[0] = 'off'; } 
		if (nature.indexOf('cont') == -1) { tabnat[1] = false; sim[1] = 'off'; } 
		if (nature.indexOf('lit') == -1) { tabnat[2] = false; sim[2] = 'off'; } 
		affiche_legende();
	}
}

function traitement_station() {
			dm.style.cursor = "wait";
			if (feat.get('ipt')) { // affichage de la bonne couleur du symbole dans le titre de la station
				switch (rep[feat.get('ipt')][snat].toLowerCase()) {
					case 'sout': scou = 'Or'; break;
					case 'cont': scou = 'Bleu'; break;
					case 'lit': scou = 'Mauve'; break;
				}	
				document.getElementById('titre_detail').innerHTML = '<img src="images/point' + scou + '_on.png" title="' + rep[feat.get('ipt')][snat] + '">&nbsp;&nbsp;<b>Ouvrage de prélèvement</b> <i><class id="code"></class></i>'; 
			}	
			classbss.innerHTML = '<a href="https://id.eaufrance.fr/OuvragePrel/' + bss + '" target="_blank">Plus d\'informations sur l\'ouvrage</a>';
			document.getElementById("code").innerHTML = bss; 
			if (feat.get(slib)) {
				classlibpe.innerHTML = "<b>" + feat.get(slib);
			} else { classlibpe.innerHTML = "<b>" + bss; }	
			/*
			if (feat.get(smeau)) {
				snap = feat.get(smeau);
				if (snap.length > 80) { snap = snap.substring(0, 80) + '...'; }
				classlibpe.innerHTML += "</b> captant l'entité hydrogéologique <b>" + snap;
			} else { classlibpe.innerHTML += "</b> captant une entité hydrogéologique non renseignée"; }
			*/
			donnees_piezo(bss);
}

function carte() {
	// paramètres génériques :  code_station (code bss), adresse, coord, fdp, size = profondeur des données (nb de données à afficher), 
	//							nbobsmin (n'affiche que les stations qui ont au moins nbobsmin mesures), nature, datedeb, datefin
	// paramètres spécifiques : milieu ( = nature), seuil (n'affiche que les stations dont au moins un volume est supérieur à seuil) 
	// pour le zoom : code_station est prioritaire sur coord qui est prioritaire sur adresse

	carte_commun();
	event_params();

}

function affiche_legende() { 
	document.getElementById("legende").innerHTML = '<img class="imgleg" src="images/pointOr_' + sim[0] + 
		'.png" title="SOUT" onclick="icomil(this)">&nbsp;&nbsp;Souterrain&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointBleu_' + 
		sim[1] + '.png" title="CONT" onclick="icomil(this)">&nbsp;&nbsp;Continental&nbsp;&nbsp;&nbsp;&nbsp;<img class="imgleg" src="images/pointMauve_' + 
		sim[2] + '.png" title="LIT" onclick="icomil(this)">&nbsp;&nbsp;Littoral&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + 
		'nbobsmin = <input type="text" id="val6" name="val6" size="6" title="Affichage uniquement des ouvrages ayant au moins nbobsmin analyses" placeholder="nbobsmin" value="' + nbanamin + '">&nbsp;&nbsp;' + 
		'datedeb = <input type="text" id="val3" name="val3" size="8" title="Affichage uniquement des ouvrages ayant des analyses antérieures à datedeb" placeholder="datedeb" value="' + datedeb + '">&nbsp;&nbsp;' +
		'datefin = <input type="text" id="val4" name="val4" size="8" title="Affichage uniquement des ouvrages ayant des analyses postérieures à datefin" placeholder="datefin" value="' + datefin + '">';
}

function infobulle(feat, j) { // contenu de l'infobulle, spécifique à chaque démonstrateur
	content.innerHTML = feat.get(scode) + ' - ' + feat.get(slib);
	if (rep[j]['nbvol'] > 0) { content.innerHTML += '<br>' + rep[j]['nbvol'] + ' volumes annuels de ' + rep[j]['anneedeb'] + ' à ' + rep[j]['anneefin'] + '<br>Volume maxi : ' + new Intl.NumberFormat().format(rep[j]['volmax']) + ' m3'; }
}
