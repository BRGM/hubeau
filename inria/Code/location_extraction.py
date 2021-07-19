import requests
import json
import unicodedata
import numpy as np
import nltk
from nltk.stem.snowball import FrenchStemmer
import predict_flair
from flair.models import SequenceTagger
from ip2geotools.databases.noncommercial import DbIpCity
import re
import ipinfo
from datetime import datetime, date
from math import cos, asin, sqrt, pi
import stanza
import itertools
from termcolor import colored
from enum import Enum
from tabulate import tabulate
from pprint import pprint


# from stanza.server import CoreNLPClient

class method(Enum):
    DEMONYM = 1
    GEOLOCATION = 2
    ELSE = 3


def get_bss(query):
    """
     Extract BSS code from query
    """
    # AAAABCDDDD/designation
    regex = "[0-9]{5}[a-zA-Z][0-9]{4}/[a-zA-Z0-9]+"
    match = re.findall(regex, query)
    return match

def replace(x):
    x1 = re.sub("î", "i", x.lower())
    return re.sub("ç", "c", x1)

def stem(word):
    """ stemming """
    word_ = "".join(list(word)[-4:])
    return word[:-4] + re.sub(r'iens|ains|ards|ain|ien|ard|ois|oi|ens|en|ais|ai|ins|in|s$', '', word_, count=1)

def stem_nltk(word):
    stemmer = FrenchStemmer()
    return stemmer.stem(word)

def equal(x, y):
    return unicodedata.normalize('NFD', x.lower()).encode('ascii', 'ignore').decode(
        "utf-8") == unicodedata.normalize('NFD', y.lower()).encode('ascii', 'ignore').decode("utf-8")


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


def get_location_demonym(query, communes):
    adjs = POS(query, "ADJ")
    locations = {get_most_similar(adj, communes): adj for adj in adjs}
    return locations

def get_location_demonym_dict(query, stemmed_dict):
    demonyms = POS(query, "ADJ")
    locations = []
    for demonym in demonyms:
        stemmed = stem_nltk(demonym)
        if stemmed in stemmed_dict:
            locations += stemmed_dict[stemmed]
    return locations

def get_geolocation(ip_address):
    """
    Get location from ip adress
    """
    response = DbIpCity.get(ip_address, api_key='free')
    city = {"location": response.city, "lat": response.latitude, "long": response.longitude}
    return city


def get_geolocation_ipinfo(ip_address):
    """
    Get location from ip adress with ipinfo API
    """
    access_token = 'ea47e58acb96e4'
    handler = ipinfo.getHandler(access_token)
    details = handler.getDetails(ip_address)
    city = {"location": details.city, "lat": details.latitude, "long": details.longitude}
    return city


def get_locations_stanford(query):
    nlp = stanza.Pipeline(lang='fr', logging_level="FATAL", processors='tokenize, ner')
    result = nlp(query)
    tags = [ent.text for sentence in result.sentences for ent in sentence.ents if ent.type == "LOC"]
    return tags


def get_dependencies(query, word_list):
    """
    Returns all the words that have a dependency to one of the words in word_list
    """
    nlp = stanza.Pipeline(lang='fr', processors='tokenize,mwt,pos,lemma,depparse')
    doc = nlp(query)
    words = {}
    dependent = {}
    for sent in doc.sentences:
        for word in sent.words:
            if word.text in word_list:
                words[word.id] = {'word': word.text, 'head id': word.head,
                                  'head': sent.words[word.head - 1].text if word.head > 0 else "root",
                                  'deprel': word.deprel}
            else:
                dependent[word.id] = {'word': word.text, 'head id': word.head,
                                      'head': sent.words[word.head - 1].text if word.head > 0 else "root",
                                      'deprel': word.deprel}

    return [v["word"].lower() for k, v in dependent.items() if (v["head id"] in words and v["deprel"] == "nmod") or (
            v["deprel"] == "conj" and dependent[v["head id"]]["head id"] in words)]


def get_locations_flair(query, MODEL_PATH):
    batch_size = 8
    tag_type = "label"
    model = SequenceTagger.load(MODEL_PATH)

    snippets = [[1, query]]
    result = predict_flair.get_entities(snippets, model, tag_type, batch_size)["snippets"][0][1]
    locations = [entity["text"].lower() for entity in result["entities"] if "LOC" in str(entity["labels"][0])]
    return locations


def get_locations_static(query, location_names):
    nouns = POS(query.lower(), "NOUN")
    locations = [noun.lower() for noun in nouns if replace(noun) in location_names]
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
                locations_ = [l["nom"].lower() for l in result if equal(l["nom"], noun)]

        locations += list(locations_)
    return locations


def get_insee_commune(commune, parameter):
    url = 'https://geo.api.gouv.fr/communes?' + parameter + '={c}&fields=nom,code,' \
                                                            'codeDepartement,codeRegion&format=json&geometry=centre' \
        .format(c=commune)
    response = json.loads(requests.get(url).text)
    if parameter == "nom":
        exact_match = {
            code["code"]: {"nom": code["nom"], "codeDepartement": code["codeDepartement"],
                           "codeRegion": code["codeRegion"]} for code in response
            if equal(code["nom"], commune)}

        similar = {code["code"]: {"nom": code["nom"], "codeDepartement": code["codeDepartement"],
                                  "codeRegion": code["codeRegion"]} for code in response if not equal(code["nom"], commune)}
        return exact_match, similar
    elif parameter == "code":
        exact_match = {
            code["code"]: {"nom": code["nom"], "codeDepartement": code["codeDepartement"],
                           "codeRegion": code["codeRegion"]} for code in response}
        return exact_match


def get_insee_departement(departement, parameter):
    url = 'https://geo.api.gouv.fr/departements?' + parameter + '={c}&fields=nom,code,codeRegion' \
                                                                '&format=json&geometry=centre' \
        .format(c=departement)

    response = json.loads(requests.get(url).text)
    if parameter == "nom":
        exact_match = {code["code"]: {"nom": code["nom"], "codeRegion": code["codeRegion"]}
                       for code in
                       response if equal(code["nom"], departement)}
        similar = {code["code"]: {"nom": code["nom"], "codeRegion": code["codeRegion"]} for
                   code in
                   response if not equal(code["nom"], departement)}
        return exact_match, similar
    elif parameter == "code":
        exact_match = {code["code"]: {"nom": code["nom"], "codeRegion": code["codeRegion"]}
                       for code in response}
        return exact_match


def get_insee_region(region, parameter):
    url = 'https://geo.api.gouv.fr/regions?' + parameter + '={c}&fields=nom,code' \
                                                           '&format=json&geometry=centre' \
        .format(c=region)
    response = json.loads(requests.get(url).text)

    if parameter == "nom":

        exact_match = {code["code"]: {"nom": code["nom"]} for code in response if
                       equal(code["nom"], region)}
        for region in exact_match:
            url = "https://geo.api.gouv.fr/regions/{c}/departements".format(c=region)
            deps = json.loads(requests.get(url).text)
            exact_match[region]["codesDepartements"] = [code["code"] for code in deps]

        similar = {code["code"]: {"nom": code["nom"]} for code in response if not equal(code["nom"], region)}
        for similar_region in similar:
            url = "https://geo.api.gouv.fr/regions/{c}/departements".format(c=similar_region)
            deps = json.loads(requests.get(url).text)
            similar[similar_region]["codesDepartements"] = [code["code"] for code in deps]

        return exact_match, similar

    elif parameter == "code":

        exact_match = {code["code"]: {"nom": code["nom"]} for code in response}
        for region in exact_match:
            url = "https://geo.api.gouv.fr/regions/{c}/departements".format(c=region)
            deps = json.loads(requests.get(url).text)
            exact_match[region]["codesDepartements"] = [code["code"] for code in deps]

        return exact_match


def get_insee(locations):
    """
    Gets the insee codes of each location in the list locations: Returns a first distionnary of all communes,
    departements and regions that match exactly Returns a second dictionnary of all communes, departements and
    regions that are similar (returned by the API but don't match exactly)
    """
    similar, exact_match, total = {}, {}, 0
    for location in locations:
        exact_match[location], similar[location] = {}, {}
        location_ = location.lower()

        exact_match[location]["communes"], similar[location]["communes"] = get_insee_commune(location_, "nom")
        exact_match[location]["departements"], similar[location]["departements"] = get_insee_departement(location_, "nom")
        exact_match[location]["regions"], similar[location]["regions"] = get_insee_region(location_, "nom")

        exact_match[location]["count"] = sum([len(v) for k, v in exact_match[location].items()])
        similar[location]["count"] = sum([len(v) for k, v in similar[location].items()])
        total += exact_match[location]["count"] + similar[location]["count"]

    return exact_match, similar, total


def classify(query, locations, method_used, exact_match_, similar_):
    """
    For a list of locations, get the insee codes and classify the locations into commune, departement or region by following a set of rules
    """
    communes, regions, departements = {}, {}, {}

    if method_used == method.GEOLOCATION:
        """
        we use directly the lattitude and longitude to get the location. than chose 
        to either take it as a commune, departement or region depending on the query text
        """
        url = "https://geo.api.gouv.fr/communes?lat={lat}&lon={long}&fields=code,codeDepartement,codeRegion".format(
            lat=locations["lat"], long=locations["long"])
        response = json.loads(requests.get(url).text)[0]
        code_c, code_d, code_r = response["code"], response["codeDepartement"], response["codeRegion"]
        d_match = re.search("departement|département", query)
        if d_match:
            exact_match = get_insee_departement(code_d, "code")
            departements[exact_match[code_d]["nom"]] = exact_match
        else:
            r_match = re.search("région|region", query)
            if r_match:
                exact_match = get_insee_region(code_r, "code")
                regions[exact_match[code_r]["nom"]] = exact_match
            else:
                exact_match = get_insee_commune(code_c, "code")
                communes[exact_match[code_c]["nom"]] = exact_match

        return communes, departements, regions

    if method_used == method.DEMONYM:
        for loc in locations:
            exact_match = exact_match_[loc]
            similar = similar_[loc]
            if exact_match["count"] > 0:
                communes[loc] = exact_match["communes"]

            elif similar["count"] > 0:
                communes[loc] = similar["communes"]
                departements[loc] = similar["departements"]
                regions[loc] = similar["regions"]

        return communes, departements, regions

    if method_used == method.ELSE:
        d_dependencies, r_dependencies = None, None
        for loc in locations:
            exact_match = exact_match_[loc]
            similar = similar_[loc]
            if exact_match["count"] > 0:  # Locations that match exactly exist
                if len(exact_match["regions"]) == 0 and len(exact_match["departements"]) == 0:  # The location is a commune
                    communes[loc] = exact_match["communes"]

                elif len(exact_match["regions"]) == 0 and len(
                        exact_match["communes"]) == 0:  # The location is a departement
                    departements[loc] = exact_match["departements"]

                elif len(exact_match["departements"]) == 0 and len(
                        exact_match["communes"]) == 0:  # The location is a region
                    regions[loc] = exact_match["regions"]

                elif len(exact_match["departements"]) > 0 and len(exact_match["communes"]) > 0 and len(
                        exact_match["regions"]) == 0:  # There's a departement and a commune that both have this name
                    d_match = re.search("(departement|département|departements|départements)", query)
                    if d_match:
                        d_dependencies = get_dependencies(query, ["departement", "département", "departements",
                                                                  "départements"]) if d_dependencies is None else d_dependencies
                        if loc in d_dependencies:
                            departements[loc] = exact_match["departements"]
                        else:
                            communes[loc] = exact_match["communes"]
                    else:
                        communes[loc] = exact_match["communes"]

                elif len(exact_match["departements"]) == 0 and len(exact_match["communes"]) > 0 and len(
                        exact_match["regions"]) > 0:  # There's a departement and a commune that both have this name
                    r_match = re.search("(region|région|regions|régions)", query)
                    if r_match:
                        r_dependencies = get_dependencies(query, ["region", "région", "regions",
                                                                  "régions"]) if r_dependencies is None else r_dependencies
                        if loc in r_dependencies:
                            regions[loc] = exact_match["regions"]
                        else:
                            communes[loc] = exact_match["communes"]
                    else:
                        communes[loc] = exact_match["communes"]

            elif similar["count"] > 0:
                communes[loc] = similar["communes"]
                departements[loc] = similar["departements"]
                regions[loc] = similar["regions"]

        return communes, departements, regions


def get_locations_(query_, all_location_names, MODEL_PATH, ip_address=None):
    """
    Use NER to extract locations from query,
    if NER gives no result, look for demonyms and return corresponding location,
    if none found, return geolocation
    """
    query = re.sub("d'", "de ", re.sub("l'", "le ", query_))
    locations = get_locations_flair(query, MODEL_PATH)
    exact_match, similar, count = get_insee(locations)
    if count > 0:
        print(colored("Extracted with NER ", "green"), locations)
        return locations, method.NER, exact_match, similar
    else:
        locations = get_locations_static(query, all_location_names)
        if len(locations) > 0:
            print(colored("Extracted with locations dictionnary ", "green"), locations)
            exact_match, similar, count = get_insee(locations)
            return locations, method.STATIC, exact_match, similar
        else:
            locations = get_locations_api(query)
            if len(locations) > 0:
                print(colored("Exctracted using geo api queries ", "green"), locations)
                exact_match, similar, count = get_insee(locations)
                return locations, method.GEO_API, exact_match, similar

            else:  # no exact match found: we look for demonyms
                # get_location_from_adj will be modified
                # to work with the dictionnary, for now it uses string similarity
                locations = get_location_demonym(query, all_location_names)
                if len(locations) > 0:
                    print(colored("Extracted from demonyms ", "green"), locations)
                    exact_match, similar, count = get_insee(locations)
                    return locations, method.DEMONYM, exact_match, similar
                else:  # no demonyms, geolocalization
                    location = get_geolocation(ip_address)
                    print(colored("Extacted with geolocalization ", "green"), location)
                    return location, method.GEOLOCATION, None, None


def get_locations(query_, all_location_names, demonym_dict, MODEL_PATH, ip_address=None):
    """
    Use NER to extract locations from query,
    if NER gives no result, look for demonyms and return corresponding location,
    if none found, return geolocation
    """
    query = re.sub("d'", "de ", re.sub("l'", "le ", query_))
    locations1 = get_locations_flair(query, MODEL_PATH)
    locations2 = get_locations_static(query, all_location_names)
    locations = list(set(locations1 + locations2))
    exact_match, similar, count = get_insee(locations)
    if count > 0:
        print(colored("Extracted with NER, and static dataset", "green"), locations)
        return locations, method.ELSE, exact_match, similar

    else:
        locations = get_locations_api(query)
        if len(locations) > 0:
            print(colored("Exctracted using geo api queries ", "green"), locations)
            exact_match, similar, count = get_insee(locations)
            return locations, method.ELSE, exact_match, similar

        else:
            # no exact match found: we look for demonyms
            # get_location_from_adj will be modified
            # to work with the dictionnary, for now it uses string similarity
            locations = get_location_demonym_dict(query, demonym_dict)
            if len(locations) > 0:
                print(colored("Extracted from demonyms ", "green"), locations)
                exact_match, similar, count = get_insee(locations)
                return locations, method.DEMONYM, exact_match, similar
            else:  # no demonyms, geolocalization
                location = get_geolocation(ip_address)
                print(colored("Extacted with geolocalization ", "green"), location)
                return location, method.GEOLOCATION, None, None


def distance(lon1, lat1, lon2, lat2):
    p = pi / 180
    a = 0.5 - cos((lat2 - lat1) * p) / 2 + cos(lat1 * p) * cos(lat2 * p) * (1 - cos((lon2 - lon1) * p)) / 2
    return 12742 * asin(sqrt(a))  # 2*R*asin...


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
    elif type_location == "region":
        q = ",".join(code_location)
        url = "https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/stations?code_departement={c}&format=json&size=500".format(
            c=q)

    exists = json.loads(requests.get(url).text)["count"]
    if exists > 0:
        data = json.loads(requests.get(url).text)
        bss = {station["code_bss"]: {"date_debut_mesure": station["date_debut_mesure"],
                                     "date_fin_mesure": station["date_fin_mesure"]} for station in
               data["data"]}
        return bss

    else:
        return -1

def get_mesure_piezo(station, start_date=None, end_date=None):
    """
    Returns mesures corresponding to all stations in the location
    """
    url = f'{"https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss={bss}".format(bss=station)}' + \
          f'{"&date_debut_mesure={d1}".format(d1=start_date) if start_date is not None else ""}' + \
          f'{"&date_fin_mesure={d2}&size=1".format(d2=end_date) if end_date is not None else "&size=1"}'

    response = json.loads(requests.get(url).text)
    number = response["count"]
    if number > 0:
        url = f'{"https://hubeau.eaufrance.fr/api/v1/niveaux_nappes/chroniques?code_bss={bss}".format(bss=station)}' + \
              f'{"&date_debut_mesure={d1}".format(d1=start_date) if start_date is not None else ""}' + \
              f'{"&date_fin_mesure={d2}&size={s}".format(d2=end_date, s=number + 1) if end_date is not None else "&size={s}".format(s=number + 1)}'
        response = json.loads(requests.get(url).text)
        return {"count": response["count"], "mesures": response["data"]}
    else:
        return {"count": 0, "mesures": -1}


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
                last_mesure_date = date.fromisoformat('2019-12-04')

                if last_mesure_date >= datetime(2005, 1, 1):  # the last mesure date must be later than 01-01-2005
                    dist[station] = distance(long, lat, long_, lat_)

        sortd = dict(sorted(dist.items(), key=lambda item: item[1]))
        return list(sortd.keys())[: min(N, len(sortd.keys()))]

    return -1


def format_table(mesures, nb_mesures):
    headers = ["Nom", "Code station", "Nombre de mesures", "Niveau enregistré (altitude / mer)",
               "Profondeur de la nappe (/ au sol)", "Date d'enregistrement"]
    table_data = []
    for location, data_ in mesures.items():
        s, n1, n2, d = "", "", "", ""
        for station, data in data_.items():
            s += station
            if data == -1:
                table_data.append([station, 0, "-", "-", "-"])
            else:
                for mesure in data['mesures'][:nb_mesures]:
                    s += "\n"
                    n1 += "\n" + str(mesure["niveau_nappe_eau"])
                    n2 += "\n" + str(mesure["profondeur_nappe"])
                    d += "\n" + mesure["date_mesure"]
        table_data.append([location, s, data["count"], n1, n2, d])

    return tabulate(table_data, headers, tablefmt="grid")


def format_table_general(mesures, nb_mesures=None):
    headers = ["Insee Code", "Code station", "Nombre de mesures", "Date début", "Date Fin",
               "Niveau enregistré (altitude / mer)\nMIN", "Niveau enregistré (altitude / mer)\nMAX",
               "Niveau enregistré (altitude / mer)\nAVG",
               "Profondeur de la nappe (/ au sol)\nMIN", "Profondeur de la nappe (/ au sol)\nMAX",
               "Profondeur de la nappe (/ au sol)\nAVG"]
    table_data = []
    for location, data_ in mesures.items():
        if data_ == -1:
            table_data.append([location, "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"])
        else:
            s, c, d1, d2, n1_max, n1_min, n1_avg, n2_max, n2_min, n2_avg = "", "", "", "", "", "", "", "", "", ""
            for station, data in data_.items():
                s += "\n" + station
                if data["mesures"] == -1:
                    c += "\n" + "0"
                    d1 += "\n" + "-"
                    d2 += "\n" + "-"
                    n1_min += "\n" + "-"
                    n1_max += "\n" + "-"
                    n1_avg += "\n" + "-"
                    n2_min += "\n" + "-"
                    n2_max += "\n" + "-"
                    n2_avg += "\n" + "-"
                else:
                    n1_, n2_, dates = [], [], []
                    for mesure in data['mesures']:
                        n1_.append(mesure["niveau_nappe_eau"])
                        n2_.append(mesure["profondeur_nappe"])
                        if nb_mesures is not None:
                            dates.append(date.fromisoformat(mesure["date_mesure"]))
                    n1_, n2_ = np.array(n1_), np.array(n2_)
                    if nb_mesures is None:
                        c += "\n" + str(data["count"])
                        d1 += "\n" + data['date_debut_mesure']
                        d2 += "\n" + data['date_fin_mesure']
                        n1_min += "\n" + str(min(n1_))
                        n1_max += "\n" + str(max(n1_))
                        n1_avg += "\n" + str(sum(n1_) / len(n1_))
                        n2_min += "\n" + str(min(n2_))
                        n2_max += "\n" + str(max(n2_))
                        n2_avg += "\n" + str(sum(n2_) / len(n2_))
                    else:
                        sortd = np.argsort(dates)[-nb_mesures:]
                        c += "\n" + str(min(data["count"], nb_mesures))
                        d1 += "\n" + str(dates[sortd[0]])
                        d2 += "\n" + str(dates[sortd[-1]])
                        n1_min += "\n" + str(min(n1_[sortd]))
                        n1_max += "\n" + str(max(n1_[sortd]))
                        n1_avg += "\n" + str(sum(n1_[sortd]) / nb_mesures)
                        n2_min += "\n" + str(min(n2_[sortd]))
                        n2_max += "\n" + str(max(n2_[sortd]))
                        n2_avg += "\n" + str(sum(n2_[sortd]) / nb_mesures)

            table_data.append([location, s, c, d1, d2, n1_min, n1_max, n1_avg, n2_min, n2_max, n2_avg])

    return tabulate(table_data, headers, tablefmt="grid")

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
