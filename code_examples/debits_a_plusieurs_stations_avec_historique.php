<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr">
<head>
<title>Hub'Eau - Comparaison des débits à plusieurs stations</title>
<meta name="author" content="BRGM" />
<meta name="description" content="Comparaison des débits à plusieurs stations" />
<meta name="keywords" content="quantité, eau, cours d'eau, rivière, fleuve, lac, eau superficielle, niveau, hauteur, débit, Hub'Eau, HubEau, Vigicrues, SCHAPI, évolution, commune, France" />
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<meta http-equiv="Content-Language" content="fr" />

<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
<script src="https://code.highcharts.com/stock/highstock.js"></script>
<script src="https://code.highcharts.com/stock/modules/exporting.js"></script>
<script src="https://code.highcharts.com/stock/modules/export-data.js"></script>

<style>
	a:link { text-decoration: none; color: #0000FF; background: transparent; }
	a:visited {  text-decoration: none; color: #0000FF; background: transparent; }
	a:hover { text-decoration: underline; color: #0000FF; background: #ffa; }
	a:active { color: #FF0000; background: transparent; }
	
	header
	{
		left: 0;
		top: 0;
		width:100%;
		height: 70px;
		background-color: dodgerblue;
		font-family: "Sierra Madre";
	}
	h1 {
		margin:0; padding:0;
		line-height:70px; 
		width:100%;
		margin:auto; 
		text-align: center;
	}
</style>
</head>
<header>
    <h1>Comparaison des débits à plusieurs stations</h1>
</header>
<body>

<?php 
/* Ce script récupère les débits aux n stations du tableau tabStations via Hub'Eau (profondeur 1 mois), les met en cache et trace le graphique d'évolution.
En appelant ce script au moins une fois par mois, il est possible de constituer un historique des débits aux stations concernées.
Les données historiques sont conservées dans un fichier [code_station].csv
Exemple de mise en oeuvre : http://nalguise.net/hydro/comp5.php
maj T. VILMUS 2019-04-04 */

// *** tableau qui contient les codes des stations ***
$tabStations = array(
'V720001002', // Rhône
'A302009050', // Rhin
'M530001010', // Loire
'O919001001', // Garonne
'H320000104' // Seine)
);

$couleur = array("#7cb5ec", "#434348", "#90ed7d", "#f7a35c", "#8085e9", "#f15c80", "#e4d354", "#2b908f", "#f45b5b", "#91e8e1"); // couleurs des courbes sur le graphique
$size = 1000;  // *** taille des pages de réponse *** 

echo '<p><TABLE COLS="9" BORDER="1" CELLPADDING="3" CELLSPACING="0">';
echo '	<tr><th>Code Station</th><th>Libellé Station</th><th>Cours d\'eau</th><th>Commune</th><th align="right">Nb Mesures</th><th>Début</th><th>Fin</th><th align="right">Valeur mini</th><th align="right">Moyenne</th><th align="right">Valeur maxi</th></tr>';

foreach ($tabStations as $key => $code_sta) {
	// récupération info stations
	$urlsta = "https://hubeau.eaufrance.fr/api/v1/hydrometrie/referentiel/stations?code_station=$code_sta&format=json&size=$size";
	$rawsta = file_get_contents($urlsta);
	$jsonsta = json_decode($rawsta,true);
	$sta = $jsonsta['data'][0]; // 1ere (et normalement unique) réponse

	$debit = array();
	$cache_file = 'cache/'.$code_sta.'.csv'; 
	// lecture des données en cache
	if (file_exists($cache_file) and filesize($cache_file) > 0) {
		$g = fopen($cache_file, 'rb'); // ouverture en lecture seule
			while (($data = fgetcsv($g, 1000, ";")) !== FALSE) {
				$debit[$data[0]] = $data[1]; 
			}
		fclose($g);	
	}
	
	// 1ere page
	$url = "https://hubeau.eaufrance.fr/api/v1/hydrometrie/observations_tr?code_entite=$code_sta&grandeur_hydro=Q&size=$size&sort=asc";
	$raw = file_get_contents($url);
	$json = json_decode($raw,true);
	$page = 0;
	$jsondata[$page] = $json['data'];

	// pages suivantes
	while ($json['next']) { 
		$page++;
		$url = $json['next'];
		$raw = file_get_contents($url);
		$json = json_decode($raw,true);
		$jsondata[$page] = $json['data'];
	}	

	for ($ipg = 0; $ipg < $page; $ipg++) { // $ipg < $page car la dernière page est tjs vide
		$i = 0;
		while ($jsondata[$ipg][$i]) {
			$debit[strtotime($jsondata[$ipg][$i]['date_obs'])] = $jsondata[$ipg][$i]['resultat_obs'] / 1000; // passage en m3/s 
			$i++;
		}
	}

	$date_obs = array();
	$result = array();
	$g = fopen($cache_file, 'wb');  // // ouverture en écriture seule
	$idate = -1; // les tableaux de données doivent commencer à 0
	ksort($debit);
	foreach($debit as $dat => $deb) {
		$idate++;
		$date_obs[$idate] = $dat;
		$result[$idate] = $deb;
		fwrite($g,$date_obs[$idate].';'.$result[$idate].chr(10));
	}
	fclose($g);	

	echo '<tr><td><FONT color="'.$couleur[$key].'">'.$code_sta.'</FONT></td><td>'.$sta[libelle_station].'</td><td>'.$sta[libelle_cours_eau].'</td><td>'.$sta[libelle_commune].'</td>'.
		'<td align="right">'.count($date_obs).'</td><td>'.date('Y-m-d H:i:s',min($date_obs)).'</td><td>'.date('Y-m-d H:i:s',max($date_obs)).
		'</td><td align="right">'.number_format(min($result),3,'.',' ').'</td><td align="right">'.number_format(array_sum($result)/count($result),3,'.',' ').'</td><td align="right">'.number_format(max($result),3,'.',' ').
		'</td></tr>'; 

        $shc[$key] = "
		{
            name: '$sta[libelle_cours_eau]',
			colorIndex: $key,
            data: [";

	for ($i=0; $i <= $idate; $i++) {
		$shc[$key] .=  '['.($date_obs[$i]*1000).','.$result[$i].']';  // x1000 pour highstock
		if ($i < $idate) { $shc[$key] .=  ','; } // pas de virgule pour la dernière mesure
	}	
	$shc[$key] .=  "
	],
            tooltip: {
                valueDecimals: 3
            }
        }";
		if ($key < count($tabStations)-1) { $shc[$key] .=  ','; } // pas de virgule pour la dernière série
} 
		
?>
<script>
document.addEventListener('DOMContentLoaded', function () {
    var myChart = Highcharts.stockChart('container', {

 legend: {
        enabled: true,
        verticalAlign: 'top',
        align: 'center',
        backgroundColor: 'lightgray',
        borderColor: 'black',
        borderWidth: 1,
        layout: 'horizontal',
        y: 0,
        shadow: true
		},
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
    type: 'day',
    count: 7,
    text: '7j'
}, {
    type: 'day',
    count: 14,
    text: '14j'
}, {
    type: 'month',
    count: 1,
    text: '1mois'
}, {
    type: 'all',
    text: 'Tout'
}]
        },

		title: {
            text: 'Débits (m3/s)'
        },
        series: [
<?php
foreach ($shc as $key => $val) {
	echo $val;
}
?>		

		]
    });
});				
</script>
	
</TABLE></p>
<div id="container" style="width:100%; height:640px; margin: 0; border: solid 1px;"></div>

<p><i>Notes :
<ul>
<li>Les mesures hydrométriques sont récupérées via <a href="https://hubeau.eaufrance.fr/page/api-hydrometrie" target="_blank">l'API "Hydrométrie"</a> de <a href="http://hubeau.eaufrance.fr/" target="_blank">Hub'Eau</a>.</li>
</ul>
</p>
</body>
</html>
