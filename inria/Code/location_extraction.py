import requests
import json
import unicodedata
import numpy as np
import nltk
from nltk.stem.snowball import FrenchStemmer
import predict_flair
from ip2geotools.databases.noncommercial import DbIpCity
import re
import ipinfo
from pprint import pprint
from termcolor import colored
from enum import Enum
def get_bss(query):
    """
     Extract BSS code from query using a regular expression: AAAABCDDDD/designation

     @param query: the user query
     @return: list of extracted BSS codes
    """

    regex = "[0-9]{5}[a-zA-Z][0-9]{4}/[a-zA-Z0-9]+"
    match = re.findall(regex, query)
    return match


def replace(x):
    """
    Replace the french letters 'î' and 'ç' by regular 'i' and 'c'

    @param x: entry text
    @return: text after replacing the letters
    """
    x1 = re.sub("î", "i", x.lower())
    return re.sub("ç", "c", x1)


def stem(word):
    """
    Manual stemming of french adjectives

    @param word: adjective
    @return: manually stemmed adjective
    """
    word_ = "".join(list(word)[-4:])
    return word[:-4] + re.sub(r'iens|ains|ards|ain|ien|ard|ois|oi|ens|en|ais|ai|ins|in|s$', '', word_, count=1)


def stem_nltk(word):
    """
    Stemming using nltk's FrenchStemmer model

    @param word: entry word
    @return: stemmed word
    """
    stemmer = FrenchStemmer()
    return stemmer.stem(word)


# print(stem_nltk("Beychacais-et-Caillalais"))
# import spacy
# nlp = spacy.load('fr_core_news_md')
#
# doc = nlp(u"Beychacais-et-Caillalais")
# for token in doc:
#     print(token, token.lemma_)

def equal(x, y):
    """
    Verify if two strings are equal, after normalization (ignores case and accents)

    @param x: first text
    @param y: second text
    @return: True if the two texts are equal after normalizing, else False
    """
    return unicodedata.normalize('NFD', x.lower()).encode('ascii', 'ignore').decode(
        "utf-8") == unicodedata.normalize('NFD', y.lower()).encode('ascii', 'ignore').decode("utf-8")


def pos(text, tag, nlp):
    """
    Runs a part of speech tagging using the StanfordNLP French model and the
    python wrapper stanza and returns the word with the specified tag

    @param text: entry text
    @param tag: POS tag used to select words (ADJ, NOUN,...)
    @return: list of words that are tagged with specified tag
    """
    tags = []
    result = nlp(text)
    for sentence in result.sentences:
        for word in sentence.words:
            if word.upos == tag:
                tags.append(word.text)
    return tags


def get_most_similar(demonym, communes):
    """
     Returns the most similar commune to the demonym from the list of communes
     the most similar one here is the one that has the smallest edit distance

     @param demonym: demonym
     @param communes: list of communes names
     @return: the commune name from the list of communes that is the most similar to the demonym
    """
    c_ = stem(demonym)
    dist = []
    for a in communes:
        limit = min(int(2 * len(demonym) / 3), len(a))
        a1 = "".join(list(a)[:limit])
        c1 = "".join(list(demonym)[:limit])
        d1 = nltk.edit_distance(c1, a1)
        d2 = nltk.edit_distance(c_, a)
        dist.append([d1, d2])

    dist = np.array(dist)
    avg = 0.5 * dist[:, 0] + 0.5 * dist[:, 1]
    min_ = np.argmin(avg)

    commune_ = communes[min_]
    return commune_


def get_location_demonym(query, communes, nlp):
    """
    Select the words that are adjectives in the query, which are potentially demonyms.
    For each extracted adjective, select the most similar commune name

    @param query: query text
    @param communes: list of commune names
    @return: list of commune names corresponding to the demonyms of the query
    """
    adjs = pos(query, "ADJ", nlp)
    locations = {get_most_similar(adj, communes): adj for adj in adjs}
    return locations


def get_geolocation(ip_address):
    """
    Get geolocation from ip adress using DbIpCity API

    @param ip_address: ip adress
    @return: geolocated city
    """
    response = DbIpCity.get(ip_address, api_key='free')
    city = {"location": response.city, "lat": response.latitude, "long": response.longitude}
    return city


def get_geolocation_ipinfo(ip_address):
    """
    Get location from ip adress with ipinfo API

    @param ip_address: ip adress
    @return: geolocated city
    """
    access_token = 'ea47e58acb96e4'
    handler = ipinfo.getHandler(access_token)
    details = handler.getDetails(ip_address)
    city = {"location": details.city, "lat": details.latitude, "long": details.longitude}
    return city


def get_locations_stanford(query, nlp):
    """
    Does a NER tagging on the query using the stanfordNLP french model
    and returns the words tagged as LOCATION

    @param query: query text
    @return: list of words with the tag "LOC"
    """
    result = nlp(query)
    tags = [ent.text for sentence in result.sentences for ent in sentence.ents if ent.type == "LOC"]
    return tags


def get_locations_flair(query, model):
    """
    Does a NER tagging on the query using the flair french model
    and returns the words tagged as LOCATION

    @param query: query text
    @param MODEL_PATH: path to the flair model
    @return: list of words with the tag "LOC"
    """
    batch_size = 8
    tag_type = "label"

    snippets = [[1, query]]
    result = predict_flair.get_entities(snippets, model, tag_type, batch_size)["snippets"][0][1]
    locations = [entity["text"].lower() for entity in result["entities"] if "LOC" in str(entity["labels"][0])]
    return locations


def get_dependencies(query, word_list, nlp):
    """
    Returns all the words that have a dependency to one of the words in word_list

    @param query: query text
    @param word_list: list of words used as roots
    @return: all words that are dependant to one of the words in the list
    """

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
    return [v["word"].lower() for k, v in dependent.items() if
            (v["head id"] in words and v["deprel"] in ["nmod", "amod"]) or
            (v["deprel"] == "conj" and dependent[v["head id"]]["head id"] in words)]


def get_locations_static(query, location_names, nlp):
    """
    Performs a POS tagging on the query to select nouns, for each noun check if it corresponds to a location name in the
    list of locations

    @param query: query text
    @param location_names: list of location names
    @return: list of locations in the query
    """
    nouns = pos(query.lower(), "NOUN", nlp)
    locations = [noun.lower() for noun in nouns if replace(noun) in location_names]
    return locations


def get_locations_api(query, nlp, exact_match=True):
    """
    Performs a POS tagging on the query to select nouns, for each noun check if it corresponds to a location name by
    querying the geographic API.
    @param query: query text
    @param exact_match: Only
    @return:

    """

    nouns = pos(query.lower(), "NOUN", nlp)
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


def get_location_demonym_dict(query, stemmed_dict, nlp):
    """
    Performs a POS tagging on the query text to select adjectives.
    For each extracted adjectives, get the stemmed version and check if it is a demonym in the demonym dictionnary
    and return the corresponding location names

    @param query: query text
    @param stemmed_dict: dictionnary of demonyms, the keys are the stemmed demonyms and the values corresponding locations.
    @return: list of location names
    """
    demonyms = pos(query, "ADJ", nlp)
    locations = {}
    for demonym in demonyms:
        stemmed = stem_nltk(demonym)
        if stemmed in stemmed_dict["communes"] or stemmed in stemmed_dict["departements"] or stemmed in stemmed_dict["regions"]:
            locations[demonym] = list(
                set(stemmed_dict["communes"].get(stemmed, []) + stemmed_dict["departements"].get(stemmed, []) + stemmed_dict["regions"].get(stemmed, [])))
    return locations


def get_insee_commune(commune, parameter):
    """
    Query the geo API to get data (name, insee code, departement code and region code ) related to a french commune.

    If the parameter used is the name: returns two dictionnaries :
        - exact_match : which contains data related to all communes that have exactly the name specified in the
         parameter value.
        - similar :  which contains data related to all communes that have a name where the parameter value is
         a substring.
    If the parameter used is the insee code: returns one dictionnary corresponding to the commune with that exact insee
    code.

    @param commune: the parameter value
    @param parameter: the parameter to use in the query: nom (commune name) or code (commune insee code)
    @return: one or two dictionnaries.

    """
    url = 'https://geo.api.gouv.fr/communes?' + parameter + '={c}&fields=nom,code,' \
                                                            'codeDepartement,codeRegion&format=json&geometry=centre' \
        .format(c=commune)
    response = json.loads(requests.get(url).text)
    if parameter == "nom":
        exact_match = {
            code.get("code", ""): {"nom": code.get("nom", ""), "codeDepartement": code.get("codeDepartement", ""),
                           "codeRegion": code["codeRegion"]} for code in response
            if equal(code.get("nom", ""), commune)}

        similar = {code.get("code", ""): {"nom": code.get("nom", ""), "codeDepartement": code.get("codeDepartement", ""),
                                  "codeRegion": code.get("codeRegion", "")} for code in response if
                   not equal(code.get("nom", ""), commune)}
        return exact_match, similar
    elif parameter == "code":
        exact_match = {
            code.get("code", ""): {"nom": code.get("nom", ""), "codeDepartement": code.get("codeDepartement", ""),
                           "codeRegion": code.get("codeRegion", "")} for code in response}
        return exact_match


def get_insee_departement(departement, parameter):
    """
    Query the geo API to get data (name, insee code, region code ) related to a french departement.

    If the parameter used is the name: returns two dictionnaries :
        - exact_match : which contains data related to all departements that have exactly the name specified in the
         parameter value.
        - similar :  which contains data related to all departements that have a name where the parameter value is
         a substring.
    If the parameter used is the insee code: returns one dictionnary corresponding to the departement with that exact insee
    code.
    @param departement: the parameter value
    @param parameter: the parameter to use in the query: nom (departement name) or code (departement insee code)
    @return: one or two dictionnaries.
    """
    url = 'https://geo.api.gouv.fr/departements?' + parameter + '={c}&fields=nom,code,codeRegion' \
                                                                '&format=json&geometry=centre' \
        .format(c=departement)

    response = json.loads(requests.get(url).text)
    if parameter == "nom":
        exact_match = {code.get("code", ""): {"nom": code.get("nom", ""), "codeRegion": code.get("codeRegion", "")}
                       for code in
                       response if equal( code.get("nom", ""), departement)}
        similar = {code.get("code", ""): {"nom":  code.get("nom", ""), "codeRegion": code.get("codeRegion", "")} for
                   code in
                   response if not equal( code.get("nom", ""), departement)}
        return exact_match, similar
    elif parameter == "code":
        exact_match = {code.get("code", ""): {"nom":  code.get("nom", ""), "codeRegion": code.get("codeRegion", "")}
                       for code in response}
        return exact_match


def get_insee_region(region, parameter):
    """
    Query the geo API to get data (name, insee code, list of the departements codes of the region) related to a french
    region.

    If the parameter used is the name: returns two dictionnaries :
        - exact_match : which contains data related to all regions that have exactly the name specified in the
         parameter value.
        - similar :  which contains data related to all regions that have a name where the parameter value is
         a substring.
    If the parameter used is the insee code: returns one dictionnary corresponding to the regions with that exact insee
    code.
    @param region: the parameter value
    @param parameter: the parameter to use in the query: nom (region name) or code (region insee code)
    @return: one or two dictionnaries.
    """
    url = 'https://geo.api.gouv.fr/regions?' + parameter + '={c}&fields=nom,code' \
                                                           '&format=json&geometry=centre' \
        .format(c=region)
    response = json.loads(requests.get(url).text)

    if parameter == "nom":

        exact_match = {code.get("code", ""): {"nom": code.get("nom", "")} for code in response if
                       equal(code.get("nom", ""), region)}
        for region in exact_match:
            url = "https://geo.api.gouv.fr/regions/{c}/departements".format(c=region)
            deps = json.loads(requests.get(url).text)
            exact_match[region]["codesDepartements"] = [code.get("code", "") for code in deps]

        similar = {code["code"]: {"nom": code["nom"]} for code in response if not equal(code["nom"], region)}
        for similar_region in similar:
            url = "https://geo.api.gouv.fr/regions/{c}/departements".format(c=similar_region)
            deps = json.loads(requests.get(url).text)
            similar[similar_region]["codesDepartements"] = [code.get("code", "") for code in deps]

        return exact_match, similar

    elif parameter == "code":

        exact_match = {code.get("code", ""): {"nom": code.get("nom", "")} for code in response}
        for region in exact_match:
            url = "https://geo.api.gouv.fr/regions/{c}/departements".format(c=region)
            deps = json.loads(requests.get(url).text)
            exact_match[region]["codesDepartements"] = [code.get("code", "") for code in deps]

        return exact_match


def get_insee(locations):
    """
    Gets data from geo API corresponding to each location name in the list of locations:

    For each location in locations:
        - Uses the functions get_insee_commune, get_insee_departement, get_insee_region using "name" as the parameter type
         and the location as parameter value to get all the locations (communes, departements or regions) that have that name.

    Returns a first dictionnary of all communes, departements and regions that match exactly the value.
    Returns a second dictionnary of all communes, departements and regions that are similar (returned by the API but don't match exactly/substring ).

    @param locations: list of location names
    @return: dictionnary of all data extracted from the names using the three functions and the total number of them.
    """
    similar, exact_match, total = {}, {}, 0
    for location in locations:
        exact_match[location], similar[location] = {}, {}
        location_ = location.lower()

        exact_match[location]["communes"], similar[location]["communes"] = get_insee_commune(location_, "nom")
        exact_match[location]["departements"], similar[location]["departements"] = get_insee_departement(location_,
                                                                                                         "nom")
        exact_match[location]["regions"], similar[location]["regions"] = get_insee_region(location_, "nom")

        exact_match[location]["count"] = sum([len(v) for k, v in exact_match[location].items()])
        similar[location]["count"] = sum([len(v) for k, v in similar[location].items()])
        total += exact_match[location]["count"] + similar[location]["count"]

    return exact_match, similar, total


# def classify_nameNdemonym(query, locations, exact_match_, nlp):
#     """
#     Classification of the location names into one of the three types : commune, departement or region
#     for when the locations were extracted using NER or locations dataset.
#
#     - The classification is trivial when there's only one type of location that has that name (only communes, only departements ...).
#     - In case two types of locations have that name, the function uses the query context to classify that name
#         (e.g "Aube" is both a commune and a departement name)
#     - If the context does not help, the default type is the thinnest granularity: commune
#     After classifying the name, take the right data from exact_match_ and add it to the right returned dictionnary.
#
#     @param query: query text
#     @param locations: list of words in the query that are location names
#     @param exact_match_: data related to all locations having the names in the list
#     @return: three dictionnaries where the data in exact_match_ is classified and separated into the three types.
#     """
#     communes, regions, departements = {}, {}, {}
#     check_again, code_regions, code_departements = {}, set(), set()
#     d_dependencies, r_dependencies = None, None
#     for loc in locations:
#         exact_match = exact_match_[loc]
#         if exact_match["count"] > 0:  # Locations that match exactly exist
#             if len(exact_match["regions"]) == 0 and len(
#                     exact_match["departements"]) == 0:  # The location is a commune
#                 communes[loc] = exact_match["communes"]
#
#             elif len(exact_match["regions"]) == 0 and len(
#                     exact_match["communes"]) == 0:  # The location is a departement
#                 departements[loc] = exact_match["departements"]
#                 code_departements = code_departements.union(list(exact_match["departements"].keys()))
#             elif len(exact_match["departements"]) == 0 and len(
#                     exact_match["communes"]) == 0:  # The location is a region
#                 regions[loc] = exact_match["regions"]
#                 code_regions = code_regions.union(list(exact_match["regions"].keys()))
#
#             elif len(exact_match["departements"]) > 0 and len(exact_match["communes"]) > 0 and len(
#                     exact_match["regions"]) == 0:  # There's a departement and a commune that both have this name
#                 d_match = re.search("(departement|département|departements|départements)", query)
#                 if d_match:
#                     d_dependencies = get_dependencies(query, ["departement", "département", "departements",
#                                                               "départements"], nlp) if d_dependencies is None else d_dependencies
#                     if loc in d_dependencies:
#                         departements[loc] = exact_match["departements"]
#                         code_departements = code_departements.union(list(exact_match["departements"].keys()))
#                     else:
#                         dep_regions, com_regions = [d["codeRegion"] for d in exact_match["departements"].values()], [
#                             d["codeRegion"]
#                             for d in
#                             exact_match["communes"].values()]
#                         inter = list(set(dep_regions).intersection(com_regions))
#                         if len(inter) == 0:
#                             com_departements = [d["codeDepartement"] for d in exact_match["communes"].values()]
#                             check_again[loc] = {"com_regions": com_regions, "dep_regions": dep_regions,
#                                                 "com_departements": com_departements}
#                         else:
#                             communes[loc] = exact_match["communes"]
#                 else:
#                     # communes[loc] = exact_match["communes"]# This case needs to be changed
#                     # conditions for the special case:
#                     # 1-having a region in the locations
#                     # 2-all the communes are located in a different region than the departement
#
#                     dep_regions, com_regions = [d["codeRegion"] for d in exact_match["departements"].values()], [
#                         d["codeRegion"]
#                         for d in
#                         exact_match["communes"].values()]
#                     inter = list(set(dep_regions).intersection(com_regions))
#                     if len(inter) == 0:
#                         com_departements = [d["codeDepartement"] for d in exact_match["communes"].values()]
#                         check_again[loc] = {"com_regions": com_regions, "dep_regions": dep_regions,
#                                             "com_departements": com_departements}
#                     else:
#                         communes[loc] = exact_match["communes"]
#
#             elif len(exact_match["departements"]) == 0 and len(exact_match["communes"]) > 0 and len(
#                     exact_match["regions"]) > 0:  # There's a departement and a commune that both have this name
#                 r_match = re.search("(region|région|regions|régions)", query)
#                 if r_match:
#                     r_dependencies = get_dependencies(query, ["region", "région", "regions",
#                                                               "régions"], nlp) if r_dependencies is None else r_dependencies
#                     if loc in r_dependencies:
#                         regions[loc] = exact_match["regions"]
#                         code_regions = code_regions.union(list(exact_match["regions"].keys()))
#                     else:
#                         communes[loc] = exact_match["communes"]
#                 else:
#                     communes[loc] = exact_match["communes"]
#
#         # elif similar["count"] > 0:
#         #     communes[loc] = similar["communes"]
#         #     departements[loc] = similar["departements"]
#         #     regions[loc] = similar["regions"]
#     if len(regions) == 0:
#         for loc in check_again:
#             exact_match = exact_match_[loc]
#             communes[loc] = exact_match["communes"]
#         return communes, departements, regions
#     else:
#         for loc, values in check_again.items():
#             exact_match = exact_match_[loc]
#             if len(code_regions.intersection(values["com_regions"])) == 0 and len(
#                     code_regions.intersection(values["dep_regions"])) == 0:
#                 communes[loc] = exact_match["communes"]
#             if len(set(values["dep_regions"]).intersection(code_regions)) > 0:
#                 departements[loc] = exact_match["departements"]
#             if len(set(values["com_regions"]).intersection(code_regions)) > 0 or len(
#                     set(values["com_departements"]).intersection(code_departements)) > 0:
#                 communes[loc] = exact_match["communes"]
#         return communes, departements, regions
def classify_nameNdemonym(query, locations, exact_match_, similar_, nlp):
    """
    Classification of the location names into one of the three types : commune, departement or region
    for when the locations were extracted using NER or locations dataset.

    - The classification is trivial when there's only one type of location that has that name (only communes, only departements ...).
    - In case two types of locations have that name, the function uses the query context to classify that name
        (e.g "Aube" is both a commune and a departement name)
    - If the context does not help, the default type is the thinnest granularity: commune
    After classifying the name, take the right data from exact_match_ and add it to the right returned dictionnary.

    @param query: query text
    @param locations: list of words in the query that are location names
    @param exact_match_: data related to all locations having the names in the list
    @return: three dictionnaries where the data in exact_match_ is classified and separated into the three types.
    """
    communes, regions, departements = {}, {}, {}
    check_again, code_regions, code_departements = {}, set(), set()
    d_dependencies, r_dependencies = None, None
    for loc in locations:
        insee_locations = exact_match_[loc] if exact_match_[loc]["count"] > 0 else similar_[loc]
        if insee_locations["count"] > 0:
            if len(insee_locations["regions"]) == 0 and len(
                    insee_locations["departements"]) == 0:  # The location is a commune
                communes[loc] = insee_locations["communes"]

            elif len(insee_locations["regions"]) == 0 and len(
                    insee_locations["communes"]) == 0:  # The location is a departement
                departements[loc] = insee_locations["departements"]
                code_departements = code_departements.union(list(insee_locations["departements"].keys()))
            elif len(insee_locations["departements"]) == 0 and len(
                    insee_locations["communes"]) == 0:  # The location is a region
                regions[loc] = insee_locations["regions"]
                code_regions = code_regions.union(list(insee_locations["regions"].keys()))

            elif len(insee_locations["departements"]) > 0 and len(insee_locations["communes"]) > 0 and len(
                    insee_locations["regions"]) == 0:  # There's a departement and a commune that both have this name
                d_match = re.search("(departement|département|departements|départements)", query)
                if d_match:
                    d_dependencies = get_dependencies(query, ["departement", "département", "departements",

                                                              "départements"], nlp) if d_dependencies is None else d_dependencies
                    if loc in d_dependencies:
                        departements[loc] = insee_locations["departements"]
                        code_departements = code_departements.union(list(insee_locations["departements"].keys()))
                    else:
                        dep_regions, com_regions = [d["codeRegion"] for d in insee_locations["departements"].values()], [
                            d["codeRegion"]
                            for d in
                            insee_locations["communes"].values()]
                        inter = list(set(dep_regions).intersection(com_regions))
                        if len(inter) == 0:
                            com_departements = [d["codeDepartement"] for d in insee_locations["communes"].values()]
                            check_again[loc] = {"com_regions": com_regions, "dep_regions": dep_regions,
                                                "com_departements": com_departements}
                        else:
                            communes[loc] = insee_locations["communes"]
                else:
                    # communes[loc] = exact_match["communes"]# This case needs to be changed
                    # conditions for the special case:
                    # 1-having a region in the locations
                    # 2-all the communes are located in a different region than the departement

                    dep_regions, com_regions = [d["codeRegion"] for d in insee_locations["departements"].values()], [
                        d["codeRegion"]
                        for d in
                        insee_locations["communes"].values()]
                    inter = list(set(dep_regions).intersection(com_regions))
                    if len(inter) == 0:
                        com_departements = [d["codeDepartement"] for d in insee_locations["communes"].values()]
                        check_again[loc] = {"com_regions": com_regions, "dep_regions": dep_regions,
                                            "com_departements": com_departements}
                    else:
                        communes[loc] = insee_locations["communes"]

            elif len(insee_locations["departements"]) == 0 and len(insee_locations["communes"]) > 0 and len(
                    insee_locations["regions"]) > 0:  # There's a departement and a commune that both have this name
                r_match = re.search("(region|région|regions|régions)", query)
                if r_match:
                    r_dependencies = get_dependencies(query, ["region", "région", "regions",
                                                              "régions"], nlp) if r_dependencies is None else r_dependencies
                    if loc in r_dependencies:
                        regions[loc] = insee_locations["regions"]
                        code_regions = code_regions.union(list(insee_locations["regions"].keys()))
                    else:
                        communes[loc] = insee_locations["communes"]
                else:
                    communes[loc] = insee_locations["communes"]

        # elif similar["count"] > 0:
        #     communes[loc] = similar["communes"]
        #     departements[loc] = similar["departements"]
        #     regions[loc] = similar["regions"]
    if len(regions) == 0:
        for loc in check_again:
            insee_locations = exact_match_[loc]
            communes[loc] = insee_locations["communes"]
        return communes, departements, regions
    else:
        for loc, values in check_again.items():
            insee_locations = exact_match_[loc]
            if len(code_regions.intersection(values["com_regions"])) == 0 and len(
                    code_regions.intersection(values["dep_regions"])) == 0:
                communes[loc] = insee_locations["communes"]
            if len(set(values["dep_regions"]).intersection(code_regions)) > 0:
                departements[loc] = insee_locations["departements"]
            if len(set(values["com_regions"]).intersection(code_regions)) > 0 or len(
                    set(values["com_departements"]).intersection(code_departements)) > 0:
                communes[loc] = insee_locations["communes"]
        return communes, departements, regions

def classify_geoloc(query, locations):
    """
        Classification of the location names into one of the three types : commune, departement or region
        for when the location was extracted using geolocation.

    - Here the function checks with a regular expression if the query contains the word "departement", if true
    classifies the location as departement and gets data using get_insee_departement.
    - Same thing with the word "region"
    - If none of the above, default is commune.

    @param query: query text
    @param locations: geolocated city name
    @return: three dictionnaries, where one contains the data related to the geolocation.
    """
    communes, regions, departements = {}, {}, {}
    url = "https://geo.api.gouv.fr/communes?lat={lat}&lon={long}&fields=code,codeDepartement,codeRegion".format(
        lat=locations["lat"], long=locations["long"])
    response = json.loads(requests.get(url).text)[0]
    code_c, code_d, code_r = response.get("code", ""), response.get("codeDepartement", ""), response.get("codeRegion", "")
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


# def classify_demonym(query, locations):
#     """
#     Classification for when the locations are demonyms
#     The function just adapts the parameters to call classify_else.
#
#     @param query: query text
#     @param locations: dictionnary of extracted demonyms and corresponding location names
#     @return: three dictionnaries where the data extracted with the locations is classified into the three categpries
#     """
#     exact_match = {}
#     similar = {}
#     for demonym, locs in locations.items():
#         exact_match[demonym] = {}
#         similar[demonym] = {}
#         e, s, count = get_insee(locs)
#         coms, deps, regs = {}, {}, {}
#         coms_, deps_, regs_ = {}, {}, {}
#         count = 0
#         for name in e:
#             v, v_ = e[name], s[name]
#             coms.update(v["communes"])
#             deps.update(v["departements"])
#             regs.update(v["regions"])
#             count += v["count"]
#             coms_.update(v_["communes"])
#             deps_.update(v_["departements"])
#             regs_.update(v_["regions"])
#
#         exact_match[demonym]["communes"] = coms
#         exact_match[demonym]["departements"] = deps
#         exact_match[demonym]["regions"] = regs
#         exact_match[demonym]["count"] = count
#
#         similar[demonym]["communes"] = coms_
#         similar[demonym]["departements"] = deps_
#         similar[demonym]["regions"] = regs_
#
#     return classify_else(query, list(locations.keys()), exact_match)

def organize(locations):
    """
    Organizing  for when the locations are demonyms
    The function just adapts the parameters to call classify_else.

    @param query: query text
    @param locations: dictionnary of extracted demonyms and corresponding location names
    @return: three dictionnaries where the data extracted with the locations is classified into the three categpries
    """
    exact_match = {}
    similar = {}
    for demonym, locs in locations.items():
        exact_match[demonym] = {}
        similar[demonym] = {}
        e, s, count = get_insee(locs)
        coms, deps, regs = {}, {}, {}
        coms_, deps_, regs_ = {}, {}, {}
        count = 0
        for name in e:
            v, v_ = e[name], s[name]
            coms.update(v["communes"])
            deps.update(v["departements"])
            regs.update(v["regions"])
            count += v["count"]
            coms_.update(v_["communes"])
            deps_.update(v_["departements"])
            regs_.update(v_["regions"])

        exact_match[demonym]["communes"] = coms
        exact_match[demonym]["departements"] = deps
        exact_match[demonym]["regions"] = regs
        exact_match[demonym]["count"] = count

        similar[demonym]["communes"] = coms_
        similar[demonym]["departements"] = deps_
        similar[demonym]["regions"] = regs_

    return exact_match, similar


def classify(query, locations, nlp):
    """
    For a list of locations, according to the method used to extract them (demonym, geoloc or else),
    call the right classifying method.

    @param query: query text
    @param locations: extracted locations
    @return: three dictionnaries : regions, communes and departements where locations are sorted by the
             type of the location  after classifying.
    """
    communes, departements, regions = {}, {}, {}
    for locations_ in locations:
        if locations_["method"] == "GEOLOCATION":
            return classify_geoloc(query, locations_["locations"])

        if locations_["method"] == "NAME" or locations_["method"] == "DEMONYM":
            c, d, r = classify_nameNdemonym(query, locations_["locations"],
                                            locations_["exact_match"], locations_["similar"], nlp)

            communes.update(c)
            departements.update(d)
            regions.update(r)

    return communes, departements, regions


# def get_locations_(query_, all_location_names, MODEL_PATH, ip_address=None):
#     """
#     Use NER and static names dataset to extract locations from query,
#     if NER gives no result.txt, look for demonyms and return corresponding locations,
#     if none found, use nouns and the GEO API,
#     if none found, use geolocation
#     """
#     query = re.sub("d'", "de ", re.sub("l'", "le ", query_))
#     locations = get_locations_flair(query, MODEL_PATH)
#     exact_match, similar, count = get_insee(locations)
#     if count > 0:
#         print(colored("Extracted with NER ", "green"), locations)
#         return locations, method.NER, exact_match, similar
#     else:
#         locations = get_locations_static(query, all_location_names)
#         if len(locations) > 0:
#             print(colored("Extracted with locations dictionnary ", "green"), locations)
#             exact_match, similar, count = get_insee(locations)
#             return locations, method.STATIC, exact_match, similar
#         else:
#             locations = get_locations_api(query)
#             if len(locations) > 0:
#                 print(colored("Exctracted using geo api queries ", "green"), locations)
#                 exact_match, similar, count = get_insee(locations)
#                 return locations, method.GEO_API, exact_match, similar
#
#             else:  # no exact match found: we look for demonyms
#                 # get_location_from_adj will be modified
#                 # to work with the dictionnary, for now it uses string similarity
#                 locations = get_location_demonym(query, all_location_names)
#                 if len(locations) > 0:
#                     print(colored("Extracted from demonyms ", "green"), locations)
#                     return locations, method.DEMONYM, None, None
#                 else:  # no demonyms, geolocalization
#                     location = get_geolocation(ip_address)
#                     print(colored("Extacted with geolocalization ", "green"), location)
#                     return location, method.GEOLOCATION, None, None
#
#
# def get_locations__(query_, all_location_names, demonym_dict, MODEL_PATH, ip_address=None):
#     """
#     Use NER and static names dataset to extract locations from query,
#     if NER gives no result.txt, look for demonyms and return corresponding locations,
#     if none found, use nouns and the GEO API,
#     if none found, use geolocation
#     """
#     query = re.sub("l'", "le ", query_)
#
#     locations1 = get_locations_flair(query, MODEL_PATH)
#     locations2 = get_locations_static(query_, all_location_names)
#     print(locations2, locations1)
#     locations = list(set(locations1 + locations2))
#     exact_match, similar, count = get_insee(locations)
#     if count > 0:
#         print(colored("Expressions de lieux extraites avec le modèle NER et la base de noms de lieux: ", "green"),
#               locations)
#         return locations, method.ELSE, exact_match, similar
#
#     else:
#         locations = get_locations_api(query)
#         if len(locations) > 0:
#             print(colored("Expressions de lieux extraites avec l'API geographique: ", "green"), locations)
#             exact_match, similar, count = get_insee(locations)
#             return locations, method.ELSE, exact_match, similar
#
#         else:
#             # no exact match found: we look for demonyms
#             # get_location_from_adj will be modified
#             # to work with the dictionnary, for now it uses string similarity
#             locations = get_location_demonym_dict(query, demonym_dict)
#             if len(locations) > 0:
#                 print(colored("Expressions de lieux extraites à partir des gentilés: ", "green"), locations)
#                 exact_match, similar, count = get_insee(locations)
#                 return locations, method.DEMONYM, exact_match, similar
#             else:  # no demonyms, geolocalization
#                 location = get_geolocation(ip_address)
#                 print(colored("Geolocalisation ", "green"), location)
#                 return location, method.GEOLOCATION, None, None

def get_locations(query_, all_location_names, demonym_dict, model, nlp, ip_address=None):
    """
    Use NER and static names dataset to extract locations from query,
    Looks for demonyms and return corresponding locations,
    if none found above, use nouns and the GEO API,
    if none found, use geolocation
    """
    final_result = []
    locations1 = get_locations_flair(query_, model)
    locations1 = [ re.sub("^l'", "", l) for l in locations1]
    locations2 = get_locations_static(query_, all_location_names, nlp)
    locations = list(set(locations1 + locations2))
    exact_match, similar, count = get_insee(locations)
    if count > 0:
        final_result.append(
            {"locations": locations, "method": "NAME", "exact_match": exact_match, "similar": similar})

    locations_ = get_location_demonym_dict(query_, demonym_dict, nlp)
    locations__ = {loc: locations_[loc] for loc in locations_ if loc not in locations}
    if len(locations__) > 0:
        exact_match_, similar_ = organize(locations__)
        final_result.append({"locations": locations__, "method": "DEMONYM", "exact_match": exact_match_, "similar": similar_})

    if count + len(locations__) == 0:
        # locations = get_locations_api(query, nlp)
        # if len(locations) > 0:
        #     print(colored("Expressions de lieux extraites avec l'API geographique: ", "green"), locations)
        #     exact_match, similar, count = get_insee(locations)
        #     final_result.append(
        #         {"locations": locations, "method": Method.NAME, "exact_match": exact_match})
        #
        # else:
        location = get_geolocation(ip_address)
        # print(colored("Geolocalisation ", "green"), location)
        final_result.append({"method": "GEOLOCATION", "locations": location})

    return final_result


def get_relevant(communes, departements, regions):
    """
    This function choses the locations that are relevant for the user with a set of rules.

    @param communes: dictionnary of communes
    @param departements: dictionnary of departements
    @param regions: dictionnary of regions
    @return: three dictionnaries of communes, departements and regions that are considered relevant
    """
    deps_to_keep, coms_to_keep, regs_to_keep = {}, {}, {}
    if len(regions) == 0 and len(departements) == 0 and len(
            communes) > 0:  # Simple case where there are only communes
        for name, content in communes.items():
            coms_to_keep.update(content)

    elif len(regions) == 0 and len(departements) > 0 and len(
            communes) == 0:  # simple case where there are only departements
        for name, content in departements.items():
            deps_to_keep.update(content)

    elif len(regions) > 0 and len(departements) == 0 and len(
            communes) == 0:  # simple case where there are only regions
        for name, content in regions.items():
            regs_to_keep.update(content)

    elif len(regions) == 0 and len(departements) > 0 and len(communes) > 0:

        """
            There are communes and departements, the rules would be:
            for each commune name (as there can be communes with the same name in different departements):
             gather all the departements of the communes having that name
             Chose the one that has its departement sited.
             if none has a departement sited, take all of them
            if a departement is sited without having a commune sited, all its stations are added.
            """

        dep_codes = {k_: v_ for k, v in departements.items() for k_, v_ in v.items()}
        deps_to_omit = set()
        coms_to_keep = {}
        for name, content in communes.items():
            if len(content) == 1:  # commune name is unique, commune is added its departement is ommited
                coms_to_keep.update(content)
                deps_to_omit.add(list(content.values())[0]["codeDepartement"])

            else:  # more than one communes correspond to the name, so we chose the one that has a departement cited (omit the departement), if none take all of them
                _ = {}
                for com, info in content.items():
                    if info["codeDepartement"] in dep_codes:
                        _[com] = info
                        deps_to_omit.add(info["codeDepartement"])
                if len(_) > 0:
                    coms_to_keep.update(_)
                else:
                    coms_to_keep.update(content)

        # We still have to add departements that have no commune sited
        deps_to_keep = {k: v for k, v in dep_codes.items() if k not in deps_to_omit}

    elif len(regions) > 0 and len(departements) == 0 and len(communes) > 0:

        """
            There are communes and regions, the rules would be:
            for each commune name (as there can be communes with the same name in different regions):
             gather all the regions of the communes having that name
             Chose the ones that have the region extracted, the region is omitted.
             if none has a region extracted, take all of them
            if a region is extracted without having a commune extracted, all its stations are added.
            """

        regs_codes = {k_: v_ for k, v in regions.items() for k_, v_ in v.items()}
        regs_to_omit = set()
        coms_to_keep = {}
        for name, content in communes.items():
            if len(content) == 1:  # commune name is unique, commune is added its region is ommited
                coms_to_keep.update(content)
                regs_to_omit.add(list(content.values())[0]["codeRegion"])

            else:  # more than one communes correspond to the name, so we chose the one that has its region extrcated (omit the region), if none take all of them
                _ = {}
                for com, info in content.items():
                    if info["codeRegion"] in regs_codes:
                        _[com] = info
                        regs_to_omit.add(info["codeRegion"])
                if len(_) > 0:
                    coms_to_keep.update(_)
                else:
                    coms_to_keep.update(content)

        # We still have to add regions that have no commune extracted
        regs_to_keep = {k: v for k, v in regs_codes.items() if k not in regs_to_omit}

    elif len(regions) > 0 and len(departements) > 0 and len(communes) == 0:

        regs_codes = {k_: v_ for k, v in regions.items() for k_, v_ in v.items()}
        regs_to_omit = set()
        deps_to_keep = {}
        for name, content in departements.items():
            if len(content) == 1:  # dep name is unique, dep is added its region is ommited
                deps_to_keep.update(content)
                regs_to_omit.add(list(content.values())[0]["codeRegion"])

            else:  # more than one departement correspond to the name, so we chose the one that has its region extrcated (omit the region), if none take all of them
                _ = {}
                for dep, info in content.items():
                    if info["codeRegion"] in regs_codes:
                        _[dep] = info
                        regs_to_omit.add(info["codeRegion"])
                if len(_) > 0:
                    deps_to_keep.update(_)
                else:
                    deps_to_keep.update(content)

        # We still have to add regions that have no departement extracted
        regs_to_keep = {k: v for k, v in regs_codes.items() if k not in regs_to_omit}

    elif len(regions) > 0 and len(departements) > 0 and len(communes) > 0:
        dep_codes = {k_: v_ for k, v in departements.items() for k_, v_ in v.items()}
        regs_codes = {k_: v_ for k, v in regions.items() for k_, v_ in v.items()}
        deps_to_omit = set()
        regs_to_omit = set()
        coms_to_keep = {}
        for name, content in communes.items():
            if len(content) == 1:  # commune name is unique, commune is added its departement is ommited
                coms_to_keep.update(content)
                deps_to_omit.add(list(content.values())[0]["codeDepartement"])
                regs_to_omit.add(list(content.values())[0]["codeRegion"])

            else:  # more than one communes correspond to the name, so we chose the one that has a departement cited (omit the departement), if none take all of them
                _ = {}
                for com, info in content.items():
                    if info["codeDepartement"] in dep_codes or info["codeRegion"] in regs_codes:
                        _[com] = info
                        deps_to_omit.add(info["codeDepartement"])
                        regs_to_omit.add(info["codeRegion"])
                if len(_) > 0:
                    coms_to_keep.update(_)
                else:
                    coms_to_keep.update(content)

        for code, content in dep_codes.items():
            if code not in deps_to_omit:
                deps_to_keep[code] = content
                regs_to_omit.add(content["codeRegion"])

        # We still have to add departements that have no commune sited
        regs_to_keep = {k: v for k, v in regs_codes.items() if k not in regs_to_omit}

    return coms_to_keep, deps_to_keep, regs_to_keep
