import requests
import json
import unicodedata
import numpy as np
import nltk
import predict_flair
from flair.models import SequenceTagger
from ip2geotools.databases.noncommercial import DbIpCity
import re
import ipinfo
from datetime import datetime
from math import cos, asin, sqrt, pi
import stanza
import itertools
from termcolor import colored


from stanza.server import CoreNLPClient


def get_bss(query):
    """
     Extract BSS code from query
    """
    # AAAABCDDDD/designation
    regex = "[0-9]{5}[a-zA-Z][0-9]{4}/[a-zA-Z0-9]+"
    match = re.findall(regex, query)
    return match


def equal(x, y):
    return unicodedata.normalize('NFD', x.lower()).encode('ascii', 'ignore').decode(
        "utf-8") == unicodedata.normalize('NFD', y.lower()).encode('ascii', 'ignore').decode("utf-8")


def get_insee(location):
    """
    Returns the insee codes of the location, whether the name corresponds to  a region, a departements or a commune or multiple at once.
    Returns similar locations
    """
    similar, exact_match = {}, {}
    location_ = location.lower()
    url = 'https://geo.api.gouv.fr/communes?nom={c}&fields=nom,code,' \
          'codeDepartement,codeRegion&format=json&geometry=centre' \
        .format(c=location_)
    response = json.loads(requests.get(url).text)

    exact_match["communes"] = {code["code"]: {"nom": code["nom"], "codeDepartement": code["codeDepartement"],
                                              "codeRegion": code["codeRegion"]} for code in response
                               if equal(code["nom"], location_)}

    similar["communes"] = {code["code"]: {"nom": code["nom"], "codeDepartement": code["codeDepartement"],
                                          "codeRegion": code["codeRegion"]} for code in response}

    url = 'https://geo.api.gouv.fr/departements?nom={c}&fields=nom,code,codeRegion' \
          '&format=json&geometry=centre' \
        .format(c=location_)
    response = json.loads(requests.get(url).text)

    exact_match["departements"] = {code["code"]: {"nom": code["nom"], "codeRegion": code["codeRegion"]} for code in
                                   response if equal(code["nom"], location_)}
    similar["departements"] = {code["code"]: {"nom": code["nom"], "codeRegion": code["codeRegion"]} for code in
                               response}

    url = 'https://geo.api.gouv.fr/regions?nom={c}&fields=nom,code' \
          '&format=json&geometry=centre' \
        .format(c=location_)
    response = json.loads(requests.get(url).text)

    exact_match["regions"] = {code["code"]: {"nom": code["nom"]} for code in response if equal(code["nom"], location_)}
    for region in exact_match["regions"]:
        url = "https://geo.api.gouv.fr/regions/{c}/departements".format(c=region)
        deps = json.loads(requests.get(url).text)
        exact_match["regions"][region]["codesDepartements"] = [code["code"] for code in deps]

    similar["regions"] = {code["code"]: {"nom": code["nom"]} for code in response}
    for similar_region in similar["regions"]:
        url = "https://geo.api.gouv.fr/regions/{c}/departements".format(c=similar_region)
        codes_ = json.loads(requests.get(url).text)
        similar["regions"][similar_region]["codesDepartements"] = [code["code"] for code in codes_]

    exact_match["count"] = sum([len(v) for k, v in exact_match.items()])
    similar["count"] = sum([len(v) for k, v in similar.items()])
    return exact_match, similar


def classify(locations):
    """
    For a list of locations, get the insee codes and classify the locations into commune, departement or region by following a set of rules
    """
    all, communes, regions, departements = {"communes": {}, "departements": {}, "regions": {}}, {}, {}, {}
    for loc in locations:
        exact_match, similar = get_insee(loc)
        if exact_match["count"] > 0:  # Locations match exactly
            all["communes"][loc] = exact_match["communes"]
            all["departements"][loc] = exact_match["departements"]
            all["regions"][loc] = exact_match["regions"]
            if len(exact_match["regions"]) == 0 and len(exact_match["departements"]) == 0:  # The location is a commune
                communes[loc] = exact_match["communes"]
            elif len(exact_match["regions"]) == 0 and len(
                    exact_match["communes"]) == 0:  # The location is a departement
                departements[loc] = exact_match["departements"]
            elif len(exact_match["departements"]) == 0 and len(
                    exact_match["communes"]) == 0:  # The location is a region
                regions[loc] = exact_match["regions"]
            else:  #len(exact_match["departements"]) > 0 and len(exact_match["communes"]) > 0 and len(exact_match["regions"]):
                communes[loc] = exact_match["communes"]
        elif similar["count"] > 0:
            communes[loc] = similar["communes"]
            departements[loc] = similar["departements"]
            regions[loc] = similar["regions"]


    return all, communes, departements, regions, len(communes)+len(regions)+len(departements)


def insee_to_bss(code_location, type_location):
    """
    Returns the BSS codes corresponding to the INSEE code
    """
    if type_location == 'commune':
        url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_commune={c}&format=json&size=500".format(
            c=code_location)

    elif type_location == 'departement':
        url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_departement={c}&format=json&size=500".format(
            c=code_location)
    else:
        return -1

    exists = json.loads(requests.get(url).text)["count"]
    if exists > 0:
        data = json.loads(requests.get(url).text)
        bss = [station["code_bss"] for station in data["data"]]
        return bss

    else:
        return -1


def get_mesure_piezo(station, start_date=None, end_date=None):
    """
    Returns mesures corresponding to the station BSS code
    """
    url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss={bss}&date_debut_mesure={d1}&date_fin_mesure={d2}&size=1".format(
        bss=station, d1=start_date, d2=end_date)
    number = json.loads(requests.get(url).text)["count"]
    if number > 0:
        url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss={bss}&date_debut_mesure={d1}&date_fin_mesure={d2}&size={s}".format(
            bss=station, d1=start_date, d2=end_date, s=number + 1)
        return json.loads(requests.get(url).text)


def POS(text, tag):
    """
    Returns words that are tagged ADJ in query
    uses stanfordNLP POS with the python wrapper stanza
    """
    nlp = stanza.Pipeline(lang='fr', logging_level="FATAL", processors='tokenize, pos')
    tags = []
    result = nlp(text)
    for sentence in result.sentences:
        for word in sentence.words:
            if word.upos == tag:
                tags.append(word.text)
    return tags


def stem(word):
    """ stemming """
    word_ = "".join(list(word)[-4:])
    return word[:-4] + re.sub(r'iens|ains|ards|ain|ien|ard|ois|oi|ens|en|ais|ai|ins|in|s$', '', word_, count=1)


def get_most_similar(c, communes):
    """
     Returns the most similar commune to the adjective c from the list of communes
    """
    c_ = stem(c)
    dist = []
    for a in communes:
        limit = min(int(2 * len(c) / 3), len(a))
        a1 = "".join(list(a)[:limit])
        c1 = "".join(list(c)[:limit])
        d1 = nltk.edit_distance(c1, a1)
        d2 = nltk.edit_distance(c_, a)
        dist.append([d1, d2])

    dist = np.array(dist)
    avg = 0.5 * dist[:, 0] + 0.5 * dist[:, 1]
    min_ = np.argmin(avg)

    commune_ = communes[min_]
    return commune_


def get_location_from_adj(query, communes):
    adjs = POS(query, "ADJ")
    print(adjs)
    locations = [get_most_similar(adj, communes) for adj in adjs]
    return locations


def get_geolocation(ip_address):
    """
    Get location from ip adress
    """
    response = DbIpCity.get(ip_address, api_key='free')
    return response.city


def get_geolocation_ipinfo(ip_address):
    """
    Get location from ip adress with ipinfo API
    """
    access_token = 'ea47e58acb96e4'
    handler = ipinfo.getHandler(access_token)
    details = handler.getDetails(ip_address)
    city = details.city
    return city


def get_locations_stanford(query):
    nlp = stanza.Pipeline(lang='fr', logging_level="FATAL", processors='tokenize, ner')
    result = nlp(query)
    tags = [ent.text for sentence in result.sentences for ent in sentence.ents if ent.type == "LOC"]
    print(tags)
    return tags


def get_locations_flair(query, MODEL_PATH):
    batch_size = 8
    tag_type = "label"
    model = SequenceTagger.load(MODEL_PATH)

    snippets = [[1, query]]
    result = predict_flair.get_entities(snippets, model, tag_type, batch_size)["snippets"][0][1]
    locations = [entity["text"] for entity in result["entities"] if "LOC" in str(entity["labels"][0])]
    return locations


def get_locations_static(query, location_names):
    nouns = POS(query.lower(), "NOUN")
    print(nouns)
    locations = [noun.lower() for noun in nouns if noun in location_names]
    return locations


def get_locations_api(query, exact_match=True):
    nouns = POS(query.lower(), "NOUN")
    locations = []
    for noun in nouns:
        url = 'https://geo.api.gouv.fr/communes?nom={c}&fields=nom&format=json&geometry=centre' \
            .format(c=noun)
        result = json.loads(requests.get(url).text)
        locations_ = []
        if len(result) > 0:
            if exact_match:
                locations_ = [l["nom"] for l in result if equal(l["nom"], noun)]

        locations += list(locations_)
    return locations


def get_locations(query_, all_location_names, MODEL_PATH, ip_address=None):
    """
    Use NER to extract locations from query,
    if NER gives no result, look for demonyms and return corresponding location,
    if none found, return geolocation
    """
    query = re.sub("d'", "de ", re.sub("l'", "le ", query_))
    locations = get_locations_flair(query, MODEL_PATH)
    all, communes, departements, regions, count = classify(locations)
    if count > 0:
        print(colored("Extracted with NER ", "green"), locations)
        return all, communes, departements, regions, count
    else:
        locations = get_locations_static(query, all_location_names)
        if len(locations) > 0:
            print(colored("Extracted with locations dictionnary ", "green"), locations)
            return classify(locations)
        else:
            locations = get_locations_api(query)
            if len(locations) > 0:
                print(colored( "Exctracted using geo api queries ", "green"), locations)
                return classify(locations)

            else:   # no exact match found: we look for demonyms
                    # get_location_from_adj will be modified
                    # to work with the dictionnary, for now it uses string similarity
                locations = get_location_from_adj(query, all_location_names)
                if len(locations) > 0:
                    print(colored("Extracted from demonyms ", "green"), locations)
                    return classify(locations)
                else: # no demonyms, geolocalization
                    locations = [get_geolocation(ip_address)]
                    print(colored("Extacted with geolocalization ", "green"), locations)
                    return classify(locations)


def distance(lon1, lat1, lon2, lat2):
    p = pi / 180
    a = 0.5 - cos((lat2 - lat1) * p) / 2 + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2
    return 12742 * asin(sqrt(a))  # 2*R*asin...


def get_coordinates(bss):
    url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_bss={c}&format=json&size=200".format(c=bss)
    exists = json.loads(requests.get(url).text)["count"]
    if exists > 0:
        data = json.loads(requests.get(url).text)
        infos = data["data"]
        return [{"code_bss": info["code_bss"], "code_commune": info["code_commune_insee"],
                 "code_departement": info["code_departement"],
                 "long": info["geometry"]["coordinates"][0], "lat": info["geometry"]["coordinates"][1],
                 "date_fin_mesure": info["date_fin_mesure"]} for info in infos]
    else:
        return -1  # bss codes do not correspond to any station


# def get_closest_stations(bss, N=4):
#     info = get_coordinates(bss)
#     if info != -1:
#         dep, long, lat = info["code_departement"], info["long"], info["lat"]
#         dep_stations = insee_to_bss(dep, "departement")
#         dist = {}
#
#         for station in dep_stations:
#             _ = get_coordinates(station)
#             long_, lat_, date = _["long"], _["lat"], _["date_fin_mesure"]
#             if date is not None:
#                 date = date.split("-")
#                 last_mesure_date = datetime(int(date[0]), int(date[1]), int(date[2]))
#
#                 if last_mesure_date >= datetime(2005, 1, 1):  # the last mesure date must be later than 01-01-2005
#                     dist[station] = distance(long, lat, long_, lat_)
#
#         sortd = dict(sorted(dist.items(), key=lambda item: item[1]))
#         return list(sortd.keys())[: min(N, len(sortd.keys()))]
#
#     return -1


def get_closest_stations(bss, N=4):
    info = get_coordinates(bss)
    if info != -1:
        dep, long, lat = info[0]["code_departement"], info[0]["long"], info[0]["lat"]
        dep_stations = insee_to_bss(dep, "departement")
        if len(dep_stations) <= 200:
            query = ",".join(dep_stations)
            infos = get_coordinates(query)
        else:
            lists = np.array_split(dep_stations, int(len(dep_stations) / 200))
            infos = [get_coordinates(",".join(l)) for l in lists]
            infos = list(itertools.chain.from_iterable(infos))

        dist = {}
        for _ in infos:
            station, long_, lat_, date = _["code_bss"], _["long"], _["lat"], _["date_fin_mesure"]
            if date is not None:
                date = date.split("-")
                last_mesure_date = datetime(int(date[0]), int(date[1]), int(date[2]))

                if last_mesure_date >= datetime(2005, 1, 1):  # the last mesure date must be later than 01-01-2005
                    dist[station] = distance(long, lat, long_, lat_)

        sortd = dict(sorted(dist.items(), key=lambda item: item[1]))
        return list(sortd.keys())[: min(N, len(sortd.keys()))]

    return -1

# locations = get_locations("A quelle profondeur se trouve la nappe à l'adresse 12 rue de Coulmiers, 45000 Orléans", communes, "NER_tool/stacked-standard-flair-150-wikiner.pt")
# print(locations)
#
# print(get_bss( "Quel était le niveau de la nappe phréatique à la station piézométrique 03635X0545/PZ1 03635X0545/F1 le 12 janvier 2019 ?"))
#
#
# bss = insee_to_bss("45188", "commune")
# print(bss)
#
# # %%
#
# mesure = get_mesure_piezo("03634X0049/P1", start_date="2019-01-12", end_date="2019-01-30")
# print(mesure)
#
# # %%
#
# locations = get_locations("Quel est le niveau de la nappe phréatique à Orléans et Paris aujourd'hui?", communes, "NER_tool/stacked-standard-flair-150-wikiner.pt")
# locations
#
# # %%
#
# locations = get_locations("A quelle profondeur se trouve la nappe à l'adresse 12 rue de Coulmiers, 45000 Orléans", communes, "NER_tool/stacked-standard-flair-150-wikiner.pt")
# print(locations)
#
# # %%
#
# locations = get_locations("Y'a-t-il de l'eau dans le sous-sol lyonnais", communes, "NER_tool/stacked-standard-flair-150-wikiner.pt")
# print(locations)
#
# # %%
#
# with requests.get("https://geolocation-db.com/json") as url:
#     data = json.loads(url.text)
#     ip_address = data["IPv4"]
#
# locations = get_locations("Y'a-t-il de l'eau dans le sous-sol", communes, "NER_tool/stacked-standard-flair-150-wikiner.pt", ip_address=ip_address)
# print(locations)
#
# # %%
#
# locations = get_locations("A quelle profondeur se trouve la plus profonde nappe parisienne ", communes, "NER_tool/stacked-standard-flair-150-wikiner.pt")
# print(locations)
#
# # %%
#
# print(get_geolocation_ipinfo(ip_address))
#
# # %%
# print(get_closest_stations2('03634X0049/P1'))
