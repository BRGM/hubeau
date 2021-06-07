# Glossaire APIs Niveaux des nappes (piézométrie), qualité des nappes, hauteurs et débits des cours d’eau (hydrométrie) et qualité des cours d’eau de Hub’Eau


## Partie Eaux souterraines (niveaux et qualité des nappes)

### ADES
[ADES](http://www.ades.eaufrance.fr) est la banque nationale d’Accès aux Données sur les Eaux Souterraines qui rassemble sur son site internet public des données quantitatives et qualitatives relatives aux eaux souterraines, dont les objectifs sont de constituer un outil de collecte et de conservation des données sur les eaux souterraines, d’être mobilisable par un large ensemble de partenaires, de permettre les traitements nécessaires à l’action de chacun des partenaires, d’être le guichet d’accès aux informations sur les eaux souterraines, d’avoir un suivi de l’état patrimonial des ressources pour répondre à la politique des eaux souterraines, et enfin d’adopter au niveau national un principe de transparence et d’accessibilité aux données sur les eaux souterraines.

### Aquifère
Un aquifère est une formation géologique ou une roche, suffisamment poreuse et/ou fissurée (pour stocker de grandes quantités d'eau) tout en étant suffisamment perméable pour que l'eau puisse y circuler librement. Pour se représenter un aquifère, il faut imaginer un vaste réservoir naturel de stockage d'eau souterraine.

### Eaux souterraines
Les eaux souterraines désignent toutes les eaux se trouvant sous la surface du sol en contact direct avec le sol ou le sous-sol et qui transitent plus ou moins rapidement dans les fissures et les pores du sol.

### Nappe d'eau souterraine
Une nappe d'eau souterraine est une eau contenue dans les interstices ou les fissures d'une roche du sous-sol qu'on nomme aquifère.

### Niveau piézométrique
Le niveau piézométrique caractérise la pression de la nappe en un point donné. Il est exprimé soit par rapport au sol en mètre, soit par rapport à l’altitude zéro du niveau de la mer en mètre NGF (Nivellement Général Français). Autrement dit, c'est le niveau libre de l'eau observé dans un piézomètre.

### Piézomètre
Les piézomètres constituent les stations de mesure du niveau piézométrique (niveau d'eau dans la nappe). Un piézomètre est un forage non exploité qui permet la mesure du niveau de l'eau souterraine en un point donné de la nappe. Ce niveau qui varie avec l'exploitation renseigne sur la capacité de production de l'aquifère.


## Partie Eaux superficielles (hauteur, débit et qualité des cours d’eau et plans d’eau)

### Grandeur hydrométrique
Type de donnée restituée par une station hydrométrique (hauteur d'eau, débit ou vitesse). Deux grandeurs hydrométriques sont disponibles via l'opération "observations\_tr" de Hub'Eau : la hauteur d'eau et le débit.

### Naïades
[Naïades](http://www.naiades.eaufrance.fr/) est l'interface nationale pour l'accès aux données des rivières et des lacs. Elle permet aux utilisateurs d'accéder aux données collectées par les agences de l'eau, les offices de l'eau et l'AFB sur les paramètres physiques, les concentrations de substances chimiques, les inventaires d'espèces et l'hydromorphologie en un point unique dans des formats standardisés.

### Référentiel hydrométrique
Le référentiel hydrométrique est constitué de sites, de stations et de capteurs.

### SCHAPI
Basé sur la Météopole de Toulouse, le [SCHAPI (Service Central d'Hydrométéorologie et d'Appui à la Prévision des Inondations)](http://www.side.developpement-durable.gouv.fr/EXPLOITATION/DEFAULT/doc/IFD/I_IFD_REFDOC_0076356/SCHAPI-Service-Central-d-Hydrom%C3%A9t%C3%A9orologie-et-d-Appui-la-Pr%C3%A9vision-des-Inondations) produit et diffuse une information continue de vigilance sur les crues publiée sur le [site Vigicrues](http://www.vigicrues.gouv.fr). Il anime et pilote le réseau de la prévision des crues et de l’hydrométrie de l’État (Services de Prévision des Crues et Unités d’Hydrométrie rattachés aux services régionaux DREAL ou à la direction inter-régionale Sud-Est de Météo-France).

### Site hydrométrique
Un site hydrométrique est un tronçon de cours d'eau sur lequel les mesures de débit sont réputées homogènes et comparables entre elles. Un site peut posséder une ou plusieurs stations et il ne peut porter que des données de débit.

### Station hydrométrique
Un appareillage installé sur un site hydrométrique afin d'observer et de mesurer une grandeur spécifique lié à l'hydrologie (hauteur ou débit) constitue une station hydrométrique. Une station peut porter une hauteur et/ou un débit (directement mesurés ou calculés à partir d'une courbe de tarage). Chaque station possède un ou plusieurs capteurs (appareil mesurant une grandeur : hauteur ou débit).

Les méthodes de l'API hydrometrie de Hub'Eau permettent d'interroger les sites et les stations hydrométriques mais ne descendent pas au niveau des capteurs.


## Partie commune

### Agence de l'Eau
Les Agences de l'Eau sont des établissements publics du ministère chargé du développement durable. Au nombre de six en France Métropolitaine, elles ont pour missions de contribuer à réduire les pollutions de toutes origines et à protéger les ressources en eau et les milieux aquatiques. Les agences de l’eau mettent en œuvre, dans les sept bassins hydrographiques métropolitains, les objectifs et les dispositions des schémas directeurs d’aménagement et de gestion des eaux (SDAGE, plans de gestion français de la directive cadre sur l’eau et leur déclinaison locale, les SAGE), en favorisant une gestion équilibrée et économe de la ressource en eau et des milieux aquatiques, l’alimentation en eau potable, la régulation des crues et le développement durable des activités économiques. Acteurs de la mise en œuvre de la politique publique de l’eau, organisée en France autour du principe de la gestion concertée par bassin versant, les agences de l’eau exercent leurs missions dans le cadre de programmes d’actions pluriannuels avec pour objectif final l’atteinte du bon état des eaux (selon la directive cadre sur l’eau d’octobre 2000).

### BRGM
Le [BRGM (Bureau de Recherches Géologiques et Minières)](http://www.brgm.fr/), service géologique national français, est l'établissement public de référence dans les applications des sciences de la Terre pour gérer les ressources et les risques du sol et du sous-sol. Le BRGM assure notamment la diffusion de données géologiques et environnementales via les technologies de l’information et de la communication, avec pour objectif la mise à disposition des pouvoirs publics, des acteurs économiques et du grand public d'informations géoréférencées pour appuyer leurs décisions. Parmi les domaines de compétence du BRGM figurent les infrastructures informatiques de diffusion, calcul, simulation-visualisation 3D et réalité virtuelle ainsi que l'interopérabilité.

### SANDRE
Le [SANDRE (Service d'Administration Nationale des Données et Référentiels sur l'Eau)](http://www.sandre.eaufrance.fr/) a pour mission d'établir et de mettre à disposition le référentiel des données sur l'eau du SIE (Système d'Information sur l'Eau). Ce référentiel, composé de spécifications techniques et de listes de codes libres d'utilisation, décrit les modalités d'échange des données sur l'eau à l'échelle de la France. D'un point de vue informatique, le Sandre garantit l'interopérabilité des systèmes d'information relatifs à l'eau.


