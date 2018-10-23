<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr">
<head>
<title>Génération du cache des observations hydro en temps réel</title>
<meta name="author" content="BRGM" />
<meta name="description" content="Observations hydrométriques en temps réel" />
<meta name="keywords" content="eau, cours d'eau, rivière, fleuve, lac, eau superficielle, Hub'Eau, HubEau, SCHAPI, évolution, commune, France, hydrométrie, débit, niveau, inondation, curseur" />
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
<meta http-equiv="Content-Language" content="fr" />

<style>
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
    <h1>Génération du cache des observations hydrométriques en temps réel avec utilisation des curseurs</h1>
</header>
<body>

<?php 
set_time_limit(0);
// *************************************************************************
// *** Génération du cache des observations hydrométriques en temps réel ***
// ***            Utilisation de la pagination de type 'cursor'          ***
// *************************************************************************

$size = 1000;  // *** taille des pages de réponse *** 

/* l'API est appelée avec les paramètres :
     pretty pour une mise en forme lisible des résultats
	 fields=code_site,code_station,grandeur_hydro,date_obs,resultat_obs pour ne récupérer que les champs principaux
	 sort=desc pour récupérer d'abord les mesures les plus récentes
*/
$url = 'https://hubeau.eaufrance.fr/api/vbeta/hydrometrie/observations_tr?size='.$size.'&pretty&fields=code_site,code_station,grandeur_hydro,date_obs,resultat_obs&sort=desc';
$page = 0;
echo 'page = '.$page.'  url = '.$url.'<br>';
flush(); ob_flush();

$cache_file = 'cache/_s'.$size.'_page0.json'; 
	
$raw = file_get_contents($url);
file_put_contents($cache_file,$raw);
$json = json_decode($raw,true);
while ($json['next']) { 									// on boucle tant que l'URL de la page suivante n'est pas vide
	$page++;
	$cache_file = 'cache/_s'.$size.'_page'.$page.'.json'; 	// nom du fichier recueillant les résultats de la page n°$page
	$url = $json['next'];									// on lit l'URL de la page suivante	
	echo 'page = '.$page.'  url = '.$url.'<br>';			// on écrit à l'écran le n° de page et l'URL appelée
	flush(); ob_flush();
	$raw = file_get_contents($url);							// on récupère les résultats fournis par l'appel de l'URL Hub'Eau dans la variable $raw	
	file_put_contents($cache_file,$raw);					// on écrit le contenu récupéré dans le fichier de nom $cache_file
	$json = json_decode($raw,true);							// on décode le résultat obtenu pour pouvoir lire le contenu de l'attribut 'next'
}															// fin de la boucle
?>

</body>
</html>
