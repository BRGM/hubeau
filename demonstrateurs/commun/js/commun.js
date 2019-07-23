// *** commun.js v1.0.0 2019-07-23 *** Fonctions js utilisées par plusieurs démonstrateurs ***

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

// Trie le tableau ob selon ses clés, comme la fonction php de même nom. Ne marche pas bien avec les nombres
function ksort(ob) {            
  var k = Object.keys(ob)
  var cl = {}
  for(var i in ob) {
    cl[i] = ob[i]
    delete ob[i]
  }
  k.sort();
  for(var i = 0;i < k.length; i++) {
    ob[ k[i] ] = cl[ k[i] ]; 
  }
} 	

// remplace toutes les occurences d'une chaine contrairement à la méthode string.replace()
function replaceAll(recherche, remplacement, chaineAModifier) {
	return chaineAModifier.split(recherche).join(remplacement);
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

function ecritLog(stext, callback) {
    var req = new XMLHttpRequest();
    req.open("GET", urllog+"?log="+stext, true);
    req.addEventListener("load", function () {
        if (req.status >= 200 && req.status < 400) {
            // Appelle la fonction callback en lui passant la réponse de la requête
            callback(req.responseText);
        } else {
            console.error(req.status + " " + req.statusText + " " + urllog);
        }
    });
    req.addEventListener("error", function () {
        console.error("Erreur réseau avec l'URL " + urllog);
    });
    req.send(null);
}
